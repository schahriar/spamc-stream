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
var EASYHAM1 = fs.readFileSync('./samples/easyham-1');
var EASYHAM2 = fs.createReadStream('./samples/easyham-2');
var EASYHAM2LENGTH = fs.statSync('./samples/easyham-2').size;
var EASYSPAMCOPY = fs.createReadStream('./samples/easyspam');
var EASYSPAMCOPY2 = fs.createReadStream('./samples/easyspam');

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
			expect(result.isSpam).to.equal(false);
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
	it('should successfully Tell a stream', function(done) {
		client.tell(EASYSPAMCOPY, { 'Content-length': EASYSPAMLENGTH }, function(error, result) {
			if(error) throw error;
			expect(result.responseMessage).to.equal("EX_OK");
			done();
		})
	})
	it('should successfully Revoke a stream', function(done) {
		client.revoke(EASYSPAMCOPY2, { 'Content-length': EASYSPAMLENGTH }, function(error, result) {
			if(error) throw error;
			expect(result.responseMessage).to.equal("EX_OK");
			done();
		})
	})
	it('should successfully Learn a file', function(done) {
		client.ham(EASYHAM1, function(error, result) {
			if(error) throw error;
			expect(result.responseMessage).to.equal("EX_OK");
			done();
		})
	})
	it('should successfully Learn a stream with headers', function(done) {
		client.ham(EASYHAM2, { 'Content-length': EASYHAM2LENGTH }, function(error, result) {
			if(error) throw error;
			expect(result.responseMessage).to.equal("EX_OK");
			done();
		})
	})
})