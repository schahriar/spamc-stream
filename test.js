var chai = require("chai");
var Spamc = require("./index");
var inspect = require("util").inspect;

var should = chai.should();
var expect = chai.expect;

var client = new Spamc();

// Extracted from Spamassassin's training data
var EASYSPAM = "Return-Path: ler@xample.example.com\n"
+ "Delivery-Date: Wed Sep 11 12:35:04 2002\n"
+ "Return-Path: <013516@aol.com>\n"
+ "Received: from lerami.lerctr.org (201.c98.etcenter.net [210.58.98.201])\n"
+ "	by example.example.com (8.12.2/8.12.2/20020902/$Revision: 1.30 $) with SMTP id g8BHYtE9023507;\n"
+ "	Wed, 11 Sep 2002 12:34:57 -0500 (CDT)\n"
+ "Message-Id: <200209111734.g8BHYtE9023507@example.example.com>\n"
+ "From: =?Big5?B?qfap9qXNrKG69A==?= <ee@example.com.tw>\n"
+ "Subject: =?Big5?B?rEKq96SjrE5+fqdPtsykRn5+?=\n"
+ "Content-Type: text/html\n"
+ "Date: Wed, 11 Sep 2002 17:19:10 +0800\n"
+ "X-Priority: 3\n"
+ "X-Library: Indy 9.0.3-B\n"
+ "To: undisclosed-recipients:;\n"
+ "\n"
+ "<HTML>\n"
+ "<BODY>\n"
+ '<iframe align="center" marginwidth=0 marginheight=0 src="http://www.example.com/20020827" frameborder=0 width=800 scrolling=no height=1700 name="ticker"></iframe>\n'
+ "</BODY></HTML>";

describe('Test Suite', function() {
	this.timeout(12000)
	it('should play ping-pong nicely', function(done){
		client.ping(function(error, didPlay) {
			expect(didPlay).to.equal(true);
			done();
		})
	})
	it('should successfully run common commands', function(done) {
		client.check(EASYSPAM, function(error, result) {
			if(error) throw error;
			expect(result.isSpam).to.equal(true);
			done();
		})
	})
})