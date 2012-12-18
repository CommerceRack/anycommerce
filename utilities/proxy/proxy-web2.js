


// step 1. npm install http
// step 2. npm install http-proxy
// step 3. npm install colors
// step 4. npm install optimist
// step 5. nmp install async 
// pkginfo, exports, socket.io, ws

var HTTP_PROXY_PORT = 8081;
var SIMULATED_LATENCY = 150;

var tunnel = require('tunnel');

var util = require('util'),
    colors = require('colors');
	
var http = require('http'),
	httpProxy = require('http-proxy'),
	https = require('https'),
	helpers = require('./node-http-proxy-helpers');

	
var welcome = [
  '#    # ##### ##### #####        #####  #####   ####  #    # #   #',
  '#    #   #     #   #    #       #    # #    # #    #  #  #   # # ',  
  '######   #     #   #    # ##### #    # #    # #    #   ##     #  ',   
  '#    #   #     #   #####        #####  #####  #    #   ##     #  ',   
  '#    #   #     #   #            #      #   #  #    #  #  #    #  ',   
  '#    #   #     #   #            #      #    #  ####  #    #   #  '
].join('\n');
util.puts(welcome.rainbow.bold);
	
// httpProxy.createServer(9000, 'localhost').listen(8081);
util.puts('http proxy server '.blue + 'started '.green.bold + 'on port '.blue + (HTTP_PROXY_PORT)+' '.yellow + 'with proxy table'.magenta.underline);
util.puts('http debug server '.blue + 'started '.green.bold + 'on port '.blue + (HTTP_PROXY_PORT+1)+' '.yellow);
util.puts('http file server '.blue + 'started '.green.bold + 'on port '.blue + (HTTP_PROXY_PORT+2)+' '.yellow);


// var options = {
  // hostnameOnly:true,
  // router: {
    // '.*' : '127.0.0.1:'+HTTP_PROXY_PORT+1,
	
    // 'www\.zoovy\.com': '192.168.99.12:80',
    // 'www.zoovy.com': '192.168.99.12:80',
	// '.*' : '192.168.99.12:80',
    // 'foo.com/buz': '127.0.0.1:8002',
    // 'bar.com/buz': '127.0.0.1:8003'
  // }
// };

var tunnelingAgent = tunnel.httpOverHttps({

  proxy: { // Proxy settings

    // Header fields for proxy server if necessary
    headers: {
      'User-Agent': 'Node'
    },

    // CA for proxy server if necessary
    // ca: [ fs.readFileSync('origin-server-ca.pem')],

    // Server name for verification if necessary
    // servername: 'example.com',

    // Client certification for proxy server if necessary
    // key: fs.readFileSync('origin-server-key.pem'),
    // cert: fs.readFileSync('origin-server-cert.pem'),
  }
});



var server = httpProxy.createServer(
	function (req, res, proxy) {
 
	// Buffer the request so that `data` and `end` events
	// are not lost during async operation(s).
	// var buffer = httpProxy.buffer(req);
	console.log(req.url);
	// var buffer = httpProxy.buffer(req);
  
  // Wait for two seconds then respond: this simulates
  // performing async actions before proxying a request
  //
  

  
 //  setTimeout(function () {

	if (req.url.substr(0,29) == 'http://www.zoovy.com/biz/app/') {
		/* local disk */
		console.log('URL: ' + req.url);
		req.url = req.url.substring(0,21)+"/"+req.url.substring(29);	// strip the /biz/app from url
		proxy.proxyRequest(req, res, {
			host: 'localhost',
			port: HTTP_PROXY_PORT+2
		});
		}
	else if (1) {
		req.headers['user-agent'] = 'TeSTin';		/// special user agent that does not redirect to https
		var proxy = new httpProxy.HttpProxy({ 
		target: {
			port : 80,
			host : req.headers.host,
			},
		});
		proxy.proxyRequest(req, res);
		proxy.on('data', function() { console.log(data);});
		}
	else if (1) {
		// debug data
		proxy.proxyRequest(req, res, {
			host: 'localhost',
			port: HTTP_PROXY_PORT+1
		});
		}
		
//   }, SIMULATED_LATENCY);
  
  // var options = {
  // router: {
	// hostnameOnly: false,
    // 'www.zoovy.com/biz/app/.*?': '127.0.0.1:8081',
    // '.*': '127.0.0.1:8002',
    // 'bar.com/buz': '127.0.0.1:8003'
  // }
// };

   
}).listen(HTTP_PROXY_PORT);

// hmm..
server.on('upgrade', function(req, socket, head) {
	console.log('UPGRADE: ' + req.url);
	});

	

server.on('connect', function(req, socket, head) {
  //
  console.log('CONNECT: ' + req.url);
  // console.log(req);
  // Proxy websocket requests too
  //
  
  // var req = http.request({
	  // host: 'example.com',
	  // port: 80,
	// agent: tunnelingAgent
	// });

  // var proxy = new httpProxy.HttpProxy({ 
		// target: {
			// port : HTTP_PROXY_PORT+1,
			// host : 'localhost',
			// agent: tunnelingAgent
			// }
		// });

});

// a better way to serve local files:
// var connect = require('connect');
// connect.createServer(
    // connect.static(__dirname)
// ).listen(8080);

// var url = require('url'),
    // http = require('http'),
    // acceptor = http.createServer().listen(HTTP_PROXY_PORT+5);
	
// acceptor.on('request', function(request, response) {
    // console.log('request ' + request.url);
    // request.pause();
    // var options = url.parse(request.url);
    // options.headers = request.headers;
    // options.method = request.method;
    // options.agent = false;

    // var connector = http.request(options, function(serverResponse) {
            // serverResponse.pause();
            // response.writeHeader(serverResponse.statusCode, serverResponse.headers);
            // serverResponse.pipe(response);
            // serverResponse.resume();
    // });
    // request.pipe(connector);
    // request.resume();
// });

// server.proxy.on('proxyError', function (err, req, res) {
  // res.writeHead(500, {
    // 'Content-Type': 'text/plain'
  // });
  
  // res.end('Something went wrong. And we are reporting a custom error message.');
// });


//
// debugHTTPD dumps headers, useful for seeing what request was sent.
//		resides at HTTP_PROXY_PORT+1
var debugHTTPD = http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('request successfully proxied!' + '\n' + JSON.stringify(req.headers, true, 2));
  res.end();
}).listen(HTTP_PROXY_PORT+1);

//
// dirHTTPD serves files off the local disk usually in ../.. (the anycommerce root)
//		resides at HTTP_PROXY_PORT+2
//
var dirHTTPD = require("http"),
    url = require("url"),
    path = require("path"),
    fs = require("fs");
    // port = process.argv[2] || 8888;
	
dirHTTPD.createServer(function(request, response) {

  var LOCAL_ROOT_DIR = process.cwd()+"/../../";
 
  var uri = url.parse(request.url).pathname
    , filename = path.join(LOCAL_ROOT_DIR, uri);

  console.log("LOCAL FILE: "+filename);
	
  fs.exists(filename, function(exists) {
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
}).listen(parseInt(HTTP_PROXY_PORT+2, 10));

console.log("Local Proxy running at\n => http://localhost:" + HTTP_PROXY_PORT + "/\nCTRL + C to shutdown");



//
//### Proxy requests within another http server
//
//``` js
//var http = require('http'),
    //httpProxy = require('http-proxy');
//    
////
//// Create a new instance of HttProxy to use in your server
////
//var proxy = new httpProxy.RoutingProxy();
//
////
//// Create a regular http server and proxy its handler
////
//http.createServer(function (req, res) {
  ////
//  // Put your custom server logic here, then proxy
  ////
  //});
//}).listen(8001);
//
//http.createServer(function (req, res) {
  //res.writeHead(200, { 'Content-Type': 'text/plain' });
//  res.write('request successfully proxied: ' + req.url +'\n' + JSON.stringify(req.headers, true, 2));
  //res.end();
//}).listen(9000); 
//// ```
//
//// ### Proxy requests using a ProxyTable
//// A Proxy Table is a simple lookup table that maps incoming requests to proxy target locations. Take a look at an example of the options you need to pass to httpProxy.createServer:
//
//// ``` js
//var options = {
  //router: {
    //'foo.com/banotez': '127.0.0.1:8001',
//    'foo.com/buz': '127.0.0.1:8002',
    //'bar.com/buz': '127.0.0.1:8003'
  //}
//};
//// ```
//
//// The above route table will take incoming requests to 'foo.com/baz' and forward them to '127.0.0.1:8001'. Likewise it will take incoming requests to 'foo.com/buz' and forward them to '127.0.0.1:8002'. The routes themselves are later converted to regular expressions to enable more complex matching functionality. We can create a proxy server with these options by using the following code:
//
//// ``` js
//// var proxyServer = httpProxy.createServer(options);
//// proxyServer.listen(80);
//// ```
//
//// ### Proxy requests using a 'Hostname Only' ProxyTable
//// As mentioned in the previous section, all routes passes to the ProxyTable are by default converted to regular expressions that are evaluated at proxy-time. This is good for complex URL rewriting of proxy requests, but less efficient when one simply wants to do pure hostname routing based on the HTTP 'Host' header. If you are only concerned with hostname routing, you change the lookup used by the internal ProxyTable:
//
//// ``` js
//var options = {
  //hostnameOnly: true,
//  router: {
    //'foo.com': '127.0.0.1:8001',
//    'bar.com': '127.0.0.1:8002'
  //}
//}
//// ```
//
//// Notice here that I have not included paths on the individual domains because this is not possible when using only the HTTP 'Host' header. Care to learn more? See [RFC2616: HTTP/1.1, Section 14.23, "Host"][4].
//
//// ### Proxy requests with an additional forward proxy
//// Sometimes in addition to a reverse proxy, you may want your front-facing server to forward traffic to another location. For example, if you wanted to load test your staging environment. This is possible when using node-http-proxy using similar JSON-based configuration to a proxy table: 
//
//// ``` js
//var proxyServerWithForwarding = httpProxy.createServer(9000, 'localhost', {
  //forward: {
    //port: 9000,
//    host: 'staging.com'
  //}
//});
//proxyServerWithForwarding.listen(80);
//// ```
//
//// The forwarding option can be used in conjunction with the proxy table options by simply including
//// both the 'forward' and 'router' properties in the options passed to 'createServer'.
//
//// ### Listening for proxy events
//// Sometimes you want to listen to an event on a proxy. For example, you may want to listen to the 'end' event, 
//// which represents when the proxy has finished proxying a request.
//
//// ``` js
//var httpProxy = require('http-proxy');
//
//var server = httpProxy.createServer(function (req, res, proxy) {
  //var buffer = httpProxy.buffer(req);
//
  //proxy.proxyRequest(req, res, {
    //host: '127.0.0.1',
//    port: 9000,
    //buffer: buffer
  //});
//});
//
//server.proxy.on('end', function() {
  //console.log("The request was proxied.");
//});
//
//server.listen(8000);
//```
//
//It's important to remember not to listen for events on the proxy object in the function passed to `httpProxy.createServer`. Doing so would add a new listener on every request, which would end up being a disaster.
//
//## Using HTTPS
//You have all the full flexibility of node-http-proxy offers in HTTPS as well as HTTP. The two basic scenarios are: with a stand-alone proxy server or in conjunction with another HTTPS server.
//
//### Proxying to HTTP from HTTPS
//This is probably the most common use-case for proxying in conjunction with HTTPS. You have some front-facing HTTPS server, but all of your internal traffic is HTTP. In this way, you can reduce the number of servers to which your CA and other important security files are deployed and reduce the computational overhead from HTTPS traffic. 
//
//Using HTTPS in `node-http-proxy` is relatively straight-forward:
 //
//``` js
//var fs = require('fs'),
    //http = require('http'),
//    https = require('https'),
    //httpProxy = require('http-proxy');
//    
//var options = {
  //https: {
    //key: fs.readFileSync('path/to/your/key.pem', 'utf8'),
//    cert: fs.readFileSync('path/to/your/cert.pem', 'utf8')
  //}
//};
//
////
//// Create a standalone HTTPS proxy server
////
//httpProxy.createServer(8000, 'localhost', options).listen(8001);
//
////
//// Create an instance of HttpProxy to use with another HTTPS server
////
//var proxy = new httpProxy.HttpProxy({
  //target: {
    //host: 'localhost', 
//    port: 8000
  //}
//});
//https.createServer(options.https, function (req, res) {
  //proxy.proxyRequest(req, res)
//}).listen(8002);
//
////
//// Create the target HTTPS server for both cases
////
//http.createServer(function (req, res) {
  //res.writeHead(200, { 'Content-Type': 'text/plain' });
//  res.write('hello https\n');
  //res.end();
//}).listen(8000);
//```
//
//### Using two certificates
//
//Suppose that your reverse proxy will handle HTTPS traffic for two different domains `fobar.com` and `barbaz.com`.
//If you need to use two different certificates you can take advantage of [Server Name Indication](http://en.wikipedia.org/wiki/Server_Name_Indication).
//
//``` js
//var https = require('https'),
    //path = require("path"),
//    fs = require("fs"),
    //crypto = require("crypto");
//
////
//// generic function to load the credentials context from disk
////
//function getCredentialsContext (cer) {
  //return crypto.createCredentials({
    //key:  fs.readFileSync(path.join(__dirname, 'certs', cer + '.key')),
//    cert: fs.readFileSync(path.join(__dirname, 'certs', cer + '.crt'))
  //}).context;
//}
//
////
//// A certificate per domain hash
////
//var certs = {
  //"fobar.com":  getCredentialsContext("foobar"),
//  "barbaz.com": getCredentialsContext("barbaz")
//};
//
////
//// Proxy options
////
//var options = {
  //https: {
    //SNICallback: function(hostname){
      //return certs[hostname];
    //}
  //},
//  hostnameOnly: true,
  //router: {
    //'fobar.com':  '127.0.0.1:8001',
//    'barbaz.com': '127.0.0.1:8002'
  //}
//};
//
////
//// Create a standalone HTTPS proxy server
////
//httpProxy.createServer(options).listen(8001);
//
////
//// Create the target HTTPS server
////
//http.createServer(function (req, res) {
  //res.writeHead(200, { 'Content-Type': 'text/plain' });
//  res.write('hello https\n');
  //res.end();
//}).listen(8000);
//
//```
//
//### Proxying to HTTPS from HTTPS
//Proxying from HTTPS to HTTPS is essentially the same as proxying from HTTPS to HTTP, but you must include the `target` option in when calling `httpProxy.createServer` or instantiating a new instance of `HttpProxy`.
//
//``` js
//var fs = require('fs'),
    //https = require('https'),
//    httpProxy = require('http-proxy');
    //
//var options = {
  //https: {
    //key: fs.readFileSync('path/to/your/key.pem', 'utf8'),
//    cert: fs.readFileSync('path/to/your/cert.pem', 'utf8')
  //},
//  target: {
    //https: true // This could also be an Object with key and cert properties
  //}
//};
//
////
//// Create a standalone HTTPS proxy server
////
//httpProxy.createServer(8000, 'localhost', options).listen(8001);
//
////
//// Create an instance of HttpProxy to use with another HTTPS server
////
//var proxy = new httpProxy.HttpProxy({ 
  //target: {
    //host: 'localhost', 
//    port: 8000,
    //https: true
  //}
//});
//
//https.createServer(options.https, function (req, res) {
  //proxy.proxyRequest(req, res);
//}).listen(8002);
//
////
//// Create the target HTTPS server for both cases
////
//https.createServer(options.https, function (req, res) {
  //res.writeHead(200, { 'Content-Type': 'text/plain' });
//  res.write('hello https\n');
  //res.end();
//}).listen(8000);
//```
//## Middleware
//
//`node-http-proxy` now supports connect middleware. Add middleware functions to your createServer call:
//
//``` js
//httpProxy.createServer(
  //require('connect-gzip').gzip(),
//  9000, 'localhost'
//).listen(8000);
//```
//
//## Proxying WebSockets
//Websockets are handled automatically when using `httpProxy.createServer()`, but if you want to use it in conjunction with a stand-alone HTTP + WebSocket (such as [socket.io][5]) server here's how:
//
//``` js
//var http = require('http'),
    //httpProxy = require('http-proxy');
//    
////
//// Create an instance of node-http-proxy
////
//var proxy = new httpProxy.HttpProxy({
  //target: {
    //host: 'localhost',
//    port: 8000
  //}
//});
//
//var server = http.createServer(function (req, res) {
  ////
//  // Proxy normal HTTP requests
  ////
//  proxy.proxyRequest(req, res);
//});
//
//server.on('upgrade', function(req, socket, head) {
  ////
//  // Proxy websocket requests too
  ////
//  proxy.proxyWebSocketRequest(req, socket, head);
//});
//
//server.listen(8080);
//```
//
//### Configuring your Socket limits
//
//By default, `node-http-proxy` will set a 100 socket limit for all `host:port` proxy targets. You can change this in two ways: 
//
//1. By passing the `maxSockets` option to `httpProxy.createServer()`
//2. By calling `httpProxy.setMaxSockets(n)`, where `n` is the number of sockets you with to use. 
//
//## POST requests and buffering
//
//express.bodyParser will interfere with proxying of POST requests (and other methods that have a request 
//body). With bodyParser active, proxied requests will never send anything to the upstream server, and 
//the original client will just hang. See https://github.com/nodejitsu/node-http-proxy/issues/180 for options.
//
//## Using node-http-proxy from the command line
//When you install this package with npm, a node-http-proxy binary will become available to you. Using this binary is easy with some simple options:
//
//``` js
//usage: node-http-proxy [options] 
//
//All options should be set with the syntax --option=value
//
//options:
  //--port   PORT       Port that the proxy server should run on
//  --target HOST:PORT  Location of the server the proxy will target
  //--config OUTFILE    Location of the configuration file for the proxy server
//  --silent            Silence the log output from the proxy server
  //-h, --help          You're staring at it
//```
//
//<br/>
//## Why doesn't node-http-proxy have more advanced features like x, y, or z?
//If you have a suggestion for a feature currently not supported, 
//feel free to open a [support issue][6]. node-http-proxy is designed to just proxy http requests from one server to another, but we will be soon releasing many other complimentary projects that can be used in conjunction with node-http-proxy.
//
//## Options
//
//### Http Proxy
//
//`createServer()` supports the following options
//
//```javascript
//{
  //forward: { // options for forward-proxy
    //port: 8000,
//    host: 'staging.com'
  //},
//  target : { // options for proxy target
    //port : 8000, 
//    host : 'localhost',
  //};
//  source : { // additional options for websocket proxying 
    //host : 'localhost',
//    port : 8000,
    //https: true
  //},
//  enable : {
    //xforward: true // enables X-Forwarded-For
  //},
//  changeOrigin: false, // changes the origin of the host header to the target URL
//}
//```
//
//## Run Tests
//The test suite is designed to fully cover the combinatoric possibilities of HTTP and HTTPS proxying:
//
//1. HTTP --> HTTP
//2. HTTPS --> HTTP
//3. HTTPS --> HTTPS
//4. HTTP --> HTTPS
//
//```
//vows test/*-test.js --spec
//vows test/*-test.js --spec --https
//vows test/*-test.js --spec --https --target=https
//vows test/*-test.js --spec --target=https
//```
//
//<br/>
//### License
//
//(The MIT License)
//
//Copyright (c) 2010 Charlie Robbins, Mikeal Rogers, Fedor Indutny, & Marak Squires
//
//Permission is hereby granted, free of charge, to any person obtaining
//a copy of this software and associated documentation files (the
//"Software"), to deal in the Software without restriction, including
//without limitation the rights to use, copy, modify, merge, publish,
//distribute, sublicense, and/or sell copies of the Software, and to
//permit persons to whom the Software is furnished to do so, subject to
//the following conditions:
//
//The above copyright notice and this permission notice shall be
//included in all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
//EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
//MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
//NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
//LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
//OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
//WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
//[0]: http://nodejitsu.com
//[1]: https://github.com/nodejitsu/node-http-proxy/blob/master/examples/websocket/websocket-proxy.js
//[2]: https://github.com/nodejitsu/node-http-proxy/blob/master/examples/http/proxy-https-to-http.js
//[3]: https://github.com/nodejitsu/node-http-proxy/tree/master/examples
//[4]: http://www.ietf.org/rfc/rfc2616.txt
//[5]: http://socket.io
//[6]: http://github.com/nodejitsu/node-http-proxy/issues
