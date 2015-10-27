# spamc-stream

spamc-stream is a nodejs module that connects to spamassassin's spamd daemon. You are able to:

  - Check a message for a spam score and return back what spamassassin matched on
  - Stream Messages from any [Readable Nodejs Stream](https://nodejs.org/api/stream.html#stream_class_stream_readable)
  - Ability to train Spamassassin with Ham and Spam
  - and everything else that `spamc` is capable of


[![Build Status](https://travis-ci.org/schahriar/spamc-stream.svg)](https://travis-ci.org/schahriar/spamc-stream)

# Usage
```
npm install spamc-stream
```

This example will parse a message to spamassassin to perform a report and will callback on success using a file stream. Note that there is no transformation happening on spamc-stream's side therefore the stream is directly piped into the TCP/NET connection. 

```javascript
var fs = require('fs');
var Spamc = require('spamc-stream');
var client = new Spamc();

var reporter = client.report();

var fsStream = fs.createReadStream('./tmp/file');
fsStream.pipe(reporter);

reporter.on('report', function(report) {
  console.log("Was the email a spam?", report.isSpam);
})

reporter.on('error', function(error) {
  console.log(error);
})
```

## Methods
- ping - Check if Spamc is working. Returns two arguments of error and pong. If Pong is true then Spamc is available.
- check `(headers:Object) Returns: PassThrough Stream` - *checks a message for a spam score and returns an object of information.* 
- report ↑ - *like symbols but matches also includes a small description.*
- symbols ↑  - *like check but also returns what the message matched on.*
- reportIfSpam ↑ - *only returns a result if message is spam.*
- process ↑ - *like check but also returns a processed message with extra headers.*
- headers ↑ - *like check but also returns the message headers in a array.*
- spam ↑ - *parse a message to spamassassin and learn it as spam*
- ham ↑ - *parse a message to spamassassin and learn it as ham*
- forget ↑ - *parse a message to spamassassin and forget it*
- tell ↑ - *ability to tell spamassassin that the message is spam*
- revoke ↑ - *abilty to tell spamassassin that the message is not spam*

***↑ : Follows the same argument pattern as the previous***

## License
This module is heavily based on work of Carl Glaysher and who doesn't love the [MIT license](https://raw.githubusercontent.com/schahriar/blackwall/master/LICENSE)?