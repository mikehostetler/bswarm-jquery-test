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
        dispatchjQuery,
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
        responseData,
        responseStr,

        val,
        callBack;

    urlObj = parse(req.url);
    queryObj = querystring.parse(urlObj.query);

    /*
     * Useful debugging statements
     *
    console.log('METHOD IS: \n\n' + JSON.stringify(req.method) + '\n\n');
    console.log('URL IS: \n\n' + JSON.stringify(req.url) + '\n\n');
    console.log('URL OBJ IS: \n\n' + JSON.stringify(urlObj) + '\n\n');
    console.log('QUERY OBJ IS: \n\n' + JSON.stringify(queryObj) + '\n\n');
    console.log('HEADERS IS: \n\n' + JSON.stringify(req.headers) + '\n\n');
    console.log('BODY IS: \n\n' + JSON.stringify(req.body) + '\n\n');
     *
    */

    responseStr = '';

    //  --- Content Security Policy ---

    if (req.url.match('data/support/csp.php')) {
        res.setHeader('Content-Security-Policy', 'default-src \'self\'; report-uri csp-log.php');

        responseStr = '<!DOCTYPE html> <html> <head> <meta http-equiv="Content-Type" content="text/html; charset=utf-8" \/> <title>CSP Test Page<\/title> <script src="..\/..\/jquery.js"><\/script> <script src="csp.js"><\/script> <script src="getComputedSupport.js"><\/script> <\/head> <body> <p>CSP Test Page<\/p> <\/body> <\/html>';

        res.end(responseStr);

        return;
    }

    //  --- Error With Text ---

    if (req.url.match('data/errorWithText.php')) {
        res.writeHead(400, 'Bad Request');
        res.end('plain text message');

        return;
    }

    //  --- Simple GET ---

    if (req.url.match('data/name.php')) {

        if ((val = queryObj.wait)) {
            setTimeout(function () {
                res.end();
            }, (parseInt(val) * 1000));

            //  Return without 'end'ing here - waiting for the setTimeout
            return;
        } else if ((val = queryObj.xml)) {

            //  XML was GETed

            res.setHeader('Content-Type', 'text/xml');
            if (val === '5-2') {
                responseStr = '3';
            } else {
                responseStr = '?';
            }

            responseStr = '<math><calculation>' + val +
                            '</calculation><result>' + responseStr +'</result></math>';

        } else if ((val = req.body.xml)) {

            //  XML was POSTed

            res.setHeader('Content-Type', 'text/xml');
            if (val === '5-2') {
                responseStr = '3';
            } else {
                responseStr = '?';
            }

            responseStr = '<math><calculation>' + val +
                            '</calculation><result>' + responseStr +'</result></math>';

        } else if ((val = queryObj.name)) {
            if (val === 'foo') {
                responseStr = 'bar';
            } else if (val === 'peter') {
                responseStr = 'pan';
            }
        } else if ((val = req.body.name)) {
            if (val === 'foo') {
                responseStr = 'bar';
            } else if (val === 'peter') {
                responseStr = 'pan';
            }
        }

        res.end(responseStr);

        return;
    }

    //  --- Static text ---

    if (req.url.match('data/name.html')) {

        responseStr = 'ERROR <script type="text\/javascript">ok( true, "name.html retrieved" );<\/script>';

        res.end(responseStr);

        return;
    }

    //  --- Headers ---

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

    //  --- Static File ---

    if (req.url.match('data/with_fries_over_jsonp.php')) {

        fs.readFile('./jquery/test/data/with_fries.xml', 'utf8',
            function (err, data) {

                var callBack;

                if (err) {
                    next(err);
                    return;
                }

                res.setHeader('Content-Type', 'application/json');

                callBack = queryObj.callback;

                res.end(callBack + '(' + JSON.stringify(data) + ')');
            });

        return;
    }

    //  --- Status Text ---

    if (req.url.match('data/statusText.php')) {

        res.writeHead(queryObj.status, queryObj.text);

        res.end();

        return;
    }

    //  --- Echo Query ---

    if (req.url.match('data/echoQuery.php')) {

        responseStr = urlObj.query;

        res.end(responseStr);

        return;
    }

    //  --- Echo Data ---

    if (req.url.match('data/echoData.php')) {

        if (req.method === 'GET') {

            responseStr = '';

        } else if (req.method === 'POST') {
            val = req.body;

            responseData = [];

            //  If we got a data structure back, encode it using a loop.
            if (typeof val === 'object') {

                Object.keys(val).forEach(
                    function (valKey) {
                        var valVal;

                        valVal = val[valKey];

                        if (typeof valVal === 'object') {
                            Object.keys(valVal).forEach(
                                function (aKey) {
                                    responseData.push(
                                        valKey + '[' + aKey + ']=' + valVal[aKey]);
                                });
                        } else {
                            responseData.push(valKey);
                        }
                    });

                responseStr = encodeURI(responseData.join('&'));

            } else {
                //  We got a scalar data value
                console.log('got a scalar: ' + val);
            }
        }

        res.end(responseStr);

        return;
    }

    //  --- Params ---

    if (req.url.match('data/params_html.php')) {

        if (req.method === 'GET') {

            responseStr = '<div id="get">';
            Object.keys(queryObj).forEach(
                    function(aKey) {
                        responseStr += '<b id=' + aKey + '>' + queryObj[aKey] + '<\/b>';
                    });
            responseStr += '<\/div>';

        } else if (req.method === 'POST') {
            val = req.body;

            responseStr = '<div id="post">';
            Object.keys(val).forEach(
                    function(aKey) {
                        responseStr += '<b id=' + aKey + '>' + val[aKey] + '<\/b>';
                    });
            responseStr += '<\/div>';
        }

        res.end(responseStr);

        return;
    }

    //  --- Content-type ---

    if (req.url.match('data/script.php')) {

        if (queryObj.header === 'script') {
            res.setHeader('Content-Type', 'text/javascript');
        } else if (queryObj.header === 'ecma') {
            res.setHeader('Content-Type', 'application/ecmascript');
        }

        responseStr = 'ok( true, "Script executed correctly." );';

        res.end(responseStr);

        return;
    }

    //  --- JSON ---

    if (req.url.match('data/json.php')) {

        res.setHeader('Content-Type', 'application/json');

        if (queryObj.json) {
            responseStr = '[ {"name": "John", "age": 21}, {"name": "Peter", "age": 25 } ]';
        } else {
            responseStr = '{ "data": {"lang": "en", "length": 25} }';
        }

        res.end(responseStr);

        return;
    }

    //  --- Error With JSON ---

    if (req.url.match('data/errorWithJSON.php')) {

        res.setHeader('Content-Type', 'application/json');

        res.writeHead(400, 'Bad Request');

        responseStr = '{ "code": 40, "message": "Bad Request" }';

        res.end(responseStr);

        return;
    }

    //  --- No content ---

    if (req.url.match('data/nocontent.php')) {

        res.writeHead(204, 'No Content');

        res.end();

        return;
    }

    //  --- test.js ---

    if (req.url.match('data/test.js')) {

        responseStr = 'this.testBar = "bar"; jQuery("#ap").html("bar"); ok( true, "test.js executed");';

        res.end(responseStr);

        return;
    }

    //  --- eval script ---

    if (req.url.match('data/evalScript.php')) {

        responseStr = 'ok( "' + req.method + '" === "GET", "request method is ' + req.method + '" );';

        res.end(responseStr);

        return;
    }

    //  --- JSONP ---

    if (req.url.match('data/jsonp.php')) {

        res.setHeader('Content-Type', 'application/json');

        if (queryObj.json) {
            responseStr = '[ {"name": "John", "age": 21}, {"name": "Peter", "age": 25 } ]';
        } else {
            responseStr = '{ "data": {"lang": "en", "length": 25} }';
        }

        callBack = queryObj.callback || req.body.callback;

        if (!callBack) {
            callBack = urlObj.href.slice(urlObj.href.lastIndexOf('/') + 1,
                                            urlObj.href.indexOf('?'));
        }

        if (callBack) {
            responseStr = callBack + '(' + responseStr + ')';
        }

        res.end(responseStr);

        return;
    }

    next();
}

