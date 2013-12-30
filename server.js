/**
 BrowserSwarm jQuery Test Suite Worker test shim

 This little project was created to manually test running the 
 jQuery Test Suite through Node.js as is done through BrowserSwarm
 to try and diagnose some issues with the tests that require 
 PHP on the backend to test certain AJAX responses.

 */

var TEST_DIR	= __dirname + "/jquery/",
		TEST_FILE = "test/index.html",
		TEST_PORT = 8031;

var http = require('http'),
		gateway = require('gateway'),
		path = require('path'),
		parse = require('url').parse,
		runner = require('run-qunit');

var opts = {
	testfile : path.join(TEST_DIR, TEST_FILE),
	testdir: TEST_DIR,
	port: TEST_PORT,
	path: TEST_DIR,
	middleware : [
		hackjQuery,
		require('gateway')(TEST_DIR, {'.php': 'php-cgi'})
	],
	progressCB: function(err, data){
		//console.log("QUnit Progress (Job "+ data.id + ") " + data.tests_run + " tests run");
		if (data.tracebacks){
			for (var i = 0; i<data.tracebacks.length; i++){
				console.log("\n\n[ERROR][QUNIT2]" + data.tracebacks[i]);
			}
		}
		//console.log("QUnit Progress", data);
	}
}

//console.dir(opts);

console.log("file: %s", opts.testfile)
console.log("Setting up QUnit server");

runner.start(opts, 
  function(res){
    if (res.tracebacks){
      for (var i = 0; i<res.tracebacks.length; i++){
        console.log("\n\n[ERROR][QUNIT1]" + res.tracebacks[i]);
				console.dir(res.tracebacks[i]);
      }
    }
    //console.log("strider-qunit > Results:", res);
  },
	function(){
		console.log("Strider-QUnit Runner Started on port "+TEST_PORT);
	}
);

/*
console.log("Serving a gateway server from "+TEST_DIR);
var app = http.createServer(gateway(TEST_DIR, {
'.php': 'php-cgi'
})).listen(8080);
*/

function hackjQuery(req,res,next) {
	// Hack for jQuery's test suite
	if(req.url.match("jsonp.php/")) {
		console.log("URL Transformation: \n");
		console.log("BEFORE: "+req.url);
		req.url = req.url.replace("?","&");
		req.url = req.url.replace("jsonp.php/","jsonp.php?callback=");
		console.log("AFTER: "+req.url);
	}
	next();
};

