/**
 * Contributor: Carl Glaysher
 * Date: 17/03/2012
 * Updated At: 10/14/2015 by Schahriar SFR.
 * Description: Front end to check spamc client
 */
var Spamc = require('./spamc');
var client = new Spamc();

client.report('My Message as String', function(error, result){
    console.log(result);
});

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