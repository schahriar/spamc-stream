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
	it('should work as a PassThrough stream', function(done) {
		var reporter = client.report();
		EASYSPAM.pipe(reporter);
		
		reporter.on('report', function(report) {
			expect(report.responseMessage).to.equal("EX_OK");
			done();
		})
		
		reporter.on('error', function(error) {
			throw error;
		})
	})
	it('should successfully Tell a stream', function(done) {
		var reporter = client.tell({ 'Content-length': EASYSPAMLENGTH });
		EASYSPAMCOPY.pipe(reporter);
		
		reporter.on('report', function(report) {
			expect(report.responseMessage).to.equal("EX_OK");
			done();
		})
		
		reporter.on('error', function(error) {
			throw error;
		})
	})
	it('should successfully Revoke a stream', function(done) {
		var reporter = client.revoke();
		EASYHAM2.pipe(reporter);
		
		reporter.on('report', function(report) {
			expect(report.responseMessage).to.equal("EX_OK");
			done();
		})
		
		reporter.on('error', function(error) {
			throw error;
		})
	})
	it('should successfully Learn a Ham stream', function(done) {
		var reporter = client.ham();
		EASYHAM2.pipe(reporter);
		
		reporter.on('report', function(report) {
			expect(report.responseMessage).to.equal("EX_OK");
			done();
		})
		
		reporter.on('error', function(error) {
			throw error;
		})
	})
	it('should successfully Learn a stream with headers', function(done) {
		var reporter = client.spam({ 'Content-length': EASYSPAMLENGTH });
		EASYSPAMCOPY2.pipe(reporter);
		
		reporter.on('report', function(report) {
			expect(report.responseMessage).to.equal("EX_OK");
			done();
		})
		
		reporter.on('error', function(error) {
			throw error;
		})
	})
})