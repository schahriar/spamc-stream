/**
 * Contributor: Schahriar SaffarShargh
 * Date: 10/14/2015
 * Description: Front end to check spamc client through NodeJS streams
 */
var fs = require('fs');
var Spamc = require('./spamc');
var client = new Spamc();

client.report(fs.createReadStream('../samples/easyham-2'), function(error, result){
    console.log(result);
});
// It is advised to add Content-length header using fs.stats to this request
// This can prevent possible errors on protocol versions past 1.2 (This module uses v1.5)
/* Ideal Request
var length = fs.statSync('../sample/easyham-2').size;
client.report(fs.createReadStream('../samples/easyham-2'), { 'Content-length': length }, function(result){
    console.log(result);
});
*/

/* Example Response
 {
    responseCode: 0,
    responseMessage: 'EX_OK',
    isSpam: true,
    spamScore: 6.9,
    baseSpamScore: 5,
    report:[
        {
            score: '0.0',
            name: 'NO_RELAYS',
            description: 'Informational',
            type: 'message'
        }
    ]
 }
*/