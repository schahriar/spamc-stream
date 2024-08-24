/**
 * Author: Carl Glaysher, Schahriar SaffarShargh
 * Date Created: 17/03/2012
 * Description: Module to emulate SPAMC client in a node way
 * Protocol Specs: https://svn.apache.org/repos/asf/spamassassin/trunk/spamd/PROTOCOL
 * Available Commands:
 *
 *  ping - returns boolean
 *  check - returns object
 *  symbols - returns object with matches
 *  report  - returns objects with matches and descriptions
 *  reportIfSpam - returns object with matches and descriptions
 *  process - returns object with modified message
 *  headers - returns object with modified headers only
 *  learn - TELL spamassassin message is Spam or Ham
 *  tell - TELL spamassassin message is Spam
 *  revoke - remove Spammed Message as being spam from spamassassin
 *
 */
var net = require('net');
var stream = require('stream');

var patterns = {
    processAll: /(\s|-)([0-9\.]+)\s([A-Z0-9\_]+)\s([^:]+)\:\s([^\n]+)/g,
    process: /(\s|-)([0-9\.]+)\s([A-Z0-9\_]+)\s([^:]+)\:\s([^\s]+)/,
    // A fix proposed by hassansin @ https://github.com/Flolagale/spamc/commit/cf719a3436e57ff4d799eac1e58b06ab2260fbb1
    responseHead: /SPAMD\/([0-9\.\-]+)\s([0-9]+)\s([0-9A-Z_]+)/,
    response: /Spam:\s(True|False|Yes|No)\s;\s(-?[0-9\.]+)\s\/\s([0-9\.]+)/
}

var spamc = function (host, port, timeout) {
    var self = this;
    var protocolVersion = 1.5;
    host = (host == undefined) ? '127.0.0.1' : host;
    port = (port == undefined) ? 783 : port;
    var connTimoutSecs = (timeout == undefined) ? 15 : timeout;
    var isStream = function CHECK_IF_IS_STREAM(object) {
        return (object instanceof stream.Stream);
    }
    var MessageFactory = function MESSAGE_FACTORY(command, master_headers, processAs) {
        /*
            Handles Common Command Cases
            where theres is no special processing
            involved.
        */
        return function MESSAGE_FACTORY_PRODUCT(headers) {
            var PassThroughStream = new stream.PassThrough;

            // Callback For Results
            var callback = function(error, results) {
                if(error) {
                    PassThroughStream.emit('error', error);
                }else{
                    PassThroughStream.emit('report', results)
                }
            }
            // Merge Master Headers to Headers (IF ANY)
            if(master_headers) {
                if((!!headers) || (typeof(headers) === 'object')) {
                    var key;
                    for (key in master_headers){
                        headers[key] = master_headers[key];
                    }
                }else{
                    // If headers are not set, use master headers
                    headers = master_headers;
                }
            }
            // Execute Command & Return Stream
            exec.apply(PassThroughStream, [command, headers, function (error, data) {
                if(error) return callback(error);
                var response = processResponse(processAs || command, data);
                // Return if Tell error occurred
                if ((response) && (response[1]) && (response[1].responseCode == 69)) {
                    if(callback) callback(new Error('TELL commands are not enabled, set the --allow-tell switch.'));
                    return;
                }
                // Callback after parsing response into an argument array
                if (callback) callback.apply(this, response);
            }]);
            
            return PassThroughStream;
        }
    }
    /*
     * Description: Sends a Ping to spamd and returns Pong on response
     * Param: callback {function}
     */
    this.ping = function (callback) {
        exec('PING', null, function (error, data) {
            /* Check Response has the word PONG */
            callback(error, (data)?(data[0].indexOf('PONG') > 0):false);
        });
    };
    /*
     * Description: returns spam score
     * Param: message {string}
     * Param: callback {function}
     * Returns: PassThrough
     */
    this.check = MessageFactory('CHECK');
    /*
     * Description: Returns Spam Score and Matches
     * Param: message {string}
     * Param: callback {function}
     * Returns: PassThrough
     */
    this.symbols = MessageFactory('SYMBOLS');
    /*
     * Description: Returns an object report
     * Param: message {string}
     * Param: callback {function}
     * Returns: PassThrough
     */
    this.report = MessageFactory('REPORT');
    /*
     * Description: Returns Object Report if is spam
     * Param: message {string}
     * Param: callback {function}
     * Returns: PassThrough
     */
    this.reportIfSpam = MessageFactory('REPORT_IFSPAM');
    /*
     * Description: Returns back a report for the message + the message
     * Param: message {string}
     * Param: callback {function}
     * Returns: PassThrough
     */
    this.process = MessageFactory('PROCESS');
    /*
     * Description: Returns headers for the message
     * Param: message {string}
     * Param: callback {function}
     * Returns: PassThrough
     */
    this.headers = MessageFactory('HEADERS');

    /*
     * Description: Tell spamd to learn message is spam/ham or forget
     * Param: message {string}
     * Param: callback {function}
     * Returns: PassThrough
     */
    this.spam = MessageFactory('TELL', {
        'Message-class':    'spam',
        'Set':              'local'
    }, 'HEADERS');
    this.ham = MessageFactory('TELL', {
        'Message-class':    'ham',
        'Set':              'local'
    }, 'HEADERS');
    this.forget = MessageFactory('TELL', {
        'Remove':   'local'
    }, 'HEADERS');
    /*
     * Description: tell spamd message is not spam
     * Param: message {string}
     * Param: callback {function}
     * Returns: PassThrough
     */
    this.revoke = MessageFactory('TELL', {
        'Message-class':    'ham',
        'Set':              'local,remote'
    }, 'HEADERS');
    
    /*
     * Description: Tell spamd message is spam
     * Param: message {string}
     * Param: callback {function}
     * Returns: PassThrough
     */
    this.tell = MessageFactory('TELL', {
        'Message-class':    'spam',
        'Set':              'local,remote'
    }, 'HEADERS');
    /*
     * Description: Sends a command to spamd
     * Param: cmd {string}
     * Param: message {string}
     * Param: onData {function(data)}
     */
    var exec = function (cmd, extraHeaders, callback) {
        var _this = this;
        var responseData = [];
        var stream = net.createConnection(port, host);
        stream.setTimeout(connTimoutSecs * 1000, function () {
            if(callback) callback(new Error('Connection to spamd Timed Out'));
        });
        stream.on('connect', function () {
            /* Create Command to Send to spamd */
            cmd = cmd + " SPAMC/" + protocolVersion + "\r\n";
            /* Process Extra Headers if Any */
            if(extraHeaders) {
                var key;
                for(key in extraHeaders) {
                    cmd = cmd + key + ": " + extraHeaders[key] + "\r\n";
                }
            }
            if(isStream(_this)) {
                stream.write(cmd + "\r\n");
                _this.setEncoding('utf8');
                _this.pipe(stream);
            }else {
                stream.write(cmd + "\r\n");
            }
        });
        stream.on('error', function (data) {
            if(callback) callback(Error('spamd returned a error: ' + data.toString()));
        });
        stream.on('data', function (data) {
            var data = data.toString();
            /* Remove Last new Line and Return and Split Lines into Array */
            data = data.split("\r\n");
            for (var i = 0; i < data.length; i++) {
                if (data[i].length > 0) {
                    responseData[responseData.length] = data[i];
                }
            }
        });
        stream.on('close', function () {
            if(callback) callback(null, responseData);
        })
    };
    /*
     * Description: Processes Response from spamd and put into a formatted object
     * Param: cmd {string}
     * Param: lines {array[string]}
     * Return: [{Error}, {Object}]
     */
    var processResponse = function (cmd, lines) {
        var returnObj = {};
        if(!lines[0]) return ["Could not match response", null];
        var result = lines[0].match(patterns.responseHead);
        if (result == null) {
            return [new Error('spamd unreconized response:' + lines[0])]
        }
        returnObj.responseCode = parseInt(result[2]);
        returnObj.responseMessage = result[3];
        if (cmd == 'TELL') {
            returnObj.didSet = false;
            returnObj.didRemove = false;
        }
        for (var i = 0; i < lines.length; i++) {
            result = lines[i].match(patterns.response);
            if (result != null) {
                returnObj.isSpam = false;
                if (result[1] == 'True' || result[1] == 'Yes') {
                    returnObj.isSpam = true;
                }
                returnObj.spamScore = parseFloat(result[2]);
                returnObj.baseSpamScore = parseFloat(result[3]);
            }
            if (result == null) {
                result = lines[i].match(/([A-Z0-9\_]+)\,/g);
                if (result != null) {
                    returnObj.matches = [];
                    for (var ii = 0; ii < result.length; ii++) {
                        returnObj.matches[ii] = result[ii].substring(0, result[ii].length - 1);
                    }
                }
            }
            if (result == null && cmd != 'PROCESS') {
                result = lines[i].match(patterns.processAll);
                if (result != null) {
                    returnObj.report = [];
                    for (var ii = 0; ii < result.length; ii++) {
                        /* Remove New Line if Found */
                        result[ii] = result[ii].replace(/\n([\s]*)/, ' ');
                        /* Match Sections */
                        var matches = result[ii].match(patterns.process);
                        // Fixes a throw when Match fails
                        if(!matches) return [new Error("Could Not Match Response")];
                        
                        returnObj.report[returnObj.report.length] = {
                            score: matches[2],
                            name: matches[3],
                            description: matches[4].replace(/^\s*([\S\s]*)\b\s*$/, '$1'),
                            type: matches[5]
                        };
                    }
                }

            }
            if (lines[i].indexOf('DidSet:') >= 0) {
                returnObj.didSet = true;
            }
            if (lines[i].indexOf('DidRemove:') >= 0) {
                returnObj.didRemove = true;
            }
        }
        if (cmd == 'PROCESS') {
            returnObj.message = '';
            for (var i = 3; i < lines.length; i++) {
                returnObj.message = returnObj.message + lines[i] + "\r\n";
            }
        }
        if (cmd == 'HEADERS') {
            returnObj.headers = [];
            for (var i = 3; i < lines.length; i++) {
                if (lines[i].indexOf('\t') < 0) {
                    returnObj.headers[returnObj.headers.length] = lines[i];
                } else {
                    returnObj.headers[returnObj.headers.length - 1] = returnObj.headers[returnObj.headers.length - 1] + lines[i];
                }
            }
        }

        return [null, returnObj];
    };
};

module.exports = spamc;
