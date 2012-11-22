//
// so the basic idea here is to be able to run a local proxy version of the data-fair 
// (but with local code for speed/ease of change)
// if the file exists locally - we serve it locally, otherwise we grab the remote version
// at http://www.zoovy.com/  (or whatever data-fair)
//
// this *should* let us test 

// based on: https://gist.github.com/701407
// based on: www.catonmat.net/http-proxy-in-nodejs/


// setup a local proxy at port 8081
// then we'll point our browser at that, and that will translate requests between production and our local server
// this doesn't work because it requires https
// 
var http2 = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs")
    port = process.argv[2] || 8888;
http2.createServer(function(request, response) {

  var LOCAL_ROOT_DIR = process.cwd()+"/../../";
  
  var uri = url.parse(request.url).pathname
    , filename = path.join(LOCAL_ROOT_DIR, uri);

	
  path.exists(filename, function(exists) {
    if(!exists) {
      response.writeHead(404, {"Content-Type": "text/plain"});
      response.write("404 Not Found\n");
      response.end();
      return;
    }

if (fs.statSync(filename).isDirectory()) filename += '/index.html';

    fs.readFile(filename, "binary", function(err, file) {
      if(err) {
        response.writeHead(500, {"Content-Type": "text/plain"});
        response.write(err + "\n");
        response.end();
        return;
      }

      response.writeHead(200);
      response.write(file, "binary");
      response.end();
    });
  });
}).listen(parseInt(port, 10));
console.log("Static file server running at\n => http://localhost:" + port + "/\nCTRL + C to shutdown");



