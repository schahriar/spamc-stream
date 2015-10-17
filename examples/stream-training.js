/**
 * Contributor: Schahriar SaffarShargh
 * Date: 10/14/2015
 * Description: Front end to check spamc client through NodeJS streams
 */
var fs = require('fs');
var Spamc = require('./spamc');
var client = new Spamc();

// Insufficient Setup -> Refer to simple-report.js
var HAMStream = fs.createReadStream('../samples/easyham-1');
var SPAMStream = fs.createReadStream('../samples/easyspam');

// Tell Client the stream is a spam
client.tell(SPAMStream, function(error, result){
    console.log(result);
});
// Remove spam status from stream
client.revoke(SPAMStream, function(error, result){
    console.log(result);
});
// Train Ham
client.ham(HAMStream, function(error, result) {
    
})


/* Example Response
 {
    responseCode: 0,
    responseMessage: 'EX_OK',
    headers: []
 }
*/