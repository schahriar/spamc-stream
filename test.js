var chai = require("chai");
var Spamc = require("./index");
var inspect = require("util").inspect;
var fs = require('fs');

var should = chai.should();
var expect = chai.expect;

var client = new Spamc();

// Extracted from Spamassassin's training data
var EASYSPAM = fs.createReadStream('./samples/easyspam');
var EASYSPAMLENGTH = fs.statSync('./samples/easyspam').size;
var EASYHAM1 = fs.readFileSync('./samples/easyspam');

describe('Test Suite', function() {
	this.timeout(12000)
	it('should play ping-pong nicely', function(done){
		client.ping(function(error, didPlay) {
			expect(didPlay).to.equal(true);
			done();
		})
	})
	it('should successfully run a file through', function(done) {
		client.check(EASYHAM1, function(error, result) {
			if(error) throw error;
			expect(result.isSpam).to.equal(true);
			done();
		})
	})
	it('should successfully run a stream through', function(done) {
		client.check(EASYSPAM, { 'Content-length': EASYSPAMLENGTH }, function(error, result) {
			if(error) throw error;
			expect(result.isSpam).to.equal(true);
			done();
		})
	})
})