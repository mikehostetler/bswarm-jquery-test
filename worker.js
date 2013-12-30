var path = require('path')
var runner = require('run-qunit')

var createResultsHandler = function(ctx){
  return function(res){
    if (res.tracebacks){
      for (var i = 0; i<res.tracebacks.length; i++){
        ctx.striderMessage("\n\n[ERROR][QUNIT]" + res.tracebacks[i]);
      }
    }
    console.log("strider-qunit > Results:", res);
    ctx.events.emit('testDone', res);
  }
}

function getFilename(ctx) {
  if (ctx.jobData && ctx.jobData.repo_config && ctx.jobData.repo_config.qunit_file)
    return ctx.jobData.repo_config.qunit_file

  console.log("Couldn't find a QUnit filename - using default")
  return "test/index.html"
}


module.exports = function(ctx, cb) {

    ctx.addDetectionRule({
            filename: function(ctx, cb) {
              cb(null, getFilename(ctx))
            }
          , grep: /qunit/gi
          , exists: true
          , language: "javascript"
          , framework: "qunit"
          , prepare: function(ctx, cb){

              if (!ctx.events){
                throw "strider-qunit requires a worker with events bus - is your strider-simple-worker out of date?"
              }

              var cgi = require('gateway')(ctx.workingDir, {'.php': 'php-cgi'})

              var cgiwrap = function(){
                console.log("!!! -> CGI: ", req.url)
                return cgi.apply(this, arguments);
              }

              var opts = {
                testfile : path.join(ctx.workingDir, getFilename(ctx))
              , testdir: ctx.workingDir  // TODO overide from DB
              , port: ctx.browsertestPort || 8031
              , path: ctx.workingDir
              , useID : true
              , middleware : [cgi]
              , progressCB: function(err, data){
                  ctx.striderMessage("QUnit Progress (Job "+
                      data.id + ") " + data.tests_run + " tests run");
                  if (data.tracebacks){
                    for (var i = 0; i<data.tracebacks.length; i++){
                      ctx.striderMessage("\n\n[ERROR][QUNIT]" + data.tracebacks[i]);
                    }
                  }
                  console.log("QUnit Progress", data);
                }
              }

             console.dir(ctx.data)
             console.log("file: %s", opts.testfile)


             ctx.striderMessage("Setting up qunit server");
             ctx.browsertestPort =  opts.port;
             ctx.browsertestPath = "/" + getFilename(ctx)

             runner.start(opts, createResultsHandler(ctx), function(){
               ctx.striderMessage("Strider-QUnit Runner Started");
               cb(0)
             });

           }

           , cleanup: function(ctx, cb){
            if (runner.open()){
              runner.close()
            }
            cb(0)
          }
        })

  console.log("strider-qunit extension loaded")
  cb(null, null);
}
