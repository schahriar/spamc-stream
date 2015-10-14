var chai = require("chai");
var Spamc = require("./index");
var inspect = require("util").inspect;

var should = chai.should();
var expect = chai.expect;

var client = new Spamc();

describe('Test Suite', function() {
	it('should play ping-pong nicely', function(){
		client.ping(function(error, didPlay) {
			expect(didPlay).to.equal(true);
		})
	})
})