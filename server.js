/**
 BrowserSwarm jQuery Test Suite Worker test shim

 This little project was created to manually test running the 
 jQuery Test Suite through Node.js as is done through BrowserSwarm
 to try and diagnose some issues with the tests that require 
 PHP on the backend to test certain AJAX responses.

 */

var TEST_DIR    = __dirname + "/jquery/",
        TEST_FILE = "test/index.html",
        TEST_PORT = 8031;

var http = require('http'),
        fs = require('fs'),
        gateway = require('gateway'),
        path = require('path'),
        parse = require('url').parse,
        querystring = require('querystring'),
        runner = require('run-qunit');

var opts = {
    testfile : path.join(TEST_DIR, TEST_FILE),
    testdir: TEST_DIR,
    port: TEST_PORT,
    path: TEST_DIR,
    middleware : [
        dispatchjQuery
        //require('gateway')(TEST_DIR, {'.php': 'php-cgi'})
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
};

//console.dir(opts);

console.log("file: %s", opts.testfile);
console.log("Setting up QUnit server");

runner.start(
    opts, 
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

function dispatchjQuery (req, res, next) {

    var urlObj,
        queryObj,

        headerKeys,
        responseStr,
        
        callBack;

    urlObj = parse(req.url);
    queryObj = querystring.parse(urlObj.query);

    // Hack for jQuery's test suite
    /*
    if (req.url.match("jsonp.php/")) {
        console.log("URL Transformation: \n");
        console.log("BEFORE: "+req.url);
        req.url = req.url.replace("?","&");
        req.url = req.url.replace("jsonp.php/","jsonp.php?callback=");
        console.log("AFTER: "+req.url);
    }
    */

    if (req.url.match('data/errorWithText.php')) {
        res.writeHead(400, 'Bad Request');
        res.end('plain text message');

        return;
    }

    if (req.url.match('data/headers.php')) {
        res.setHeader('Sample-Header', 'Hello World');
        res.setHeader('Empty-Header', '');
        res.setHeader('Sample-Header2', 'Hello World 2');

        headerKeys = queryObj.keys.split('_');

        responseStr = '';

        headerKeys.forEach(
                function (headerKey) {
                    var normalizedKey;

                    normalizedKey = headerKey.toLowerCase();

                    //  Only include a header value in the result if it was
                    //  defined in 'req.headers'
                    if (req.headers[normalizedKey]) {
                        responseStr += headerKey +
                                        ': ' +
                                        req.headers[normalizedKey] +
                                        '\n';
                    }
                });

        res.end(responseStr);

        return;
    }

    if (req.url.match('data/jsonp.php')) {

        /*
    console.log('URL IS: \n\n' + JSON.stringify(req.url) + '\n\n');
    console.log('URL OBJ IS: \n\n' + JSON.stringify(urlObj) + '\n\n');
    console.log('QUERY IS: \n\n' + JSON.stringify(queryObj) + '\n\n');
    console.log('HEADERS IS: \n\n' + JSON.stringify(req.headers) + '\n\n');
        */

        res.setHeader('Content-Type', 'application/json');

        if (queryObj.json) {
            responseStr = '([ {"name": "John", "age": 21}, {"name": "Peter", "age": 25 } ])';
        } else {
            responseStr = '({ "data": {"lang": "en", "length": 25} })';
        }

        if (!(callBack = queryObj.callback)) {
            callBack = urlObj.href.slice(urlObj.href.lastIndexOf('/') + 1,
                                            urlObj.href.indexOf('?'));
        }

        console.log('callBack: ' + callBack);

        if (callBack) {
            responseStr = callBack + responseStr;
        }

        res.end(responseStr);

        return;
    }

    if (req.url.match('data/with_fries_over_jsonp.php')) {

        res.end('');

        return;
    }

    next();
}

