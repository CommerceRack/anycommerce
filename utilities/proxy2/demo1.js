

// anyCommerce Local Webserver + Testing Proxy 
// purpose: serves app files off the local system via http & https
//			create a realistic simulation environment for testing/diagnostics without needing to commit/sync/wait/wait/wait/test

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP1: setup & test proxy
// 1a. download + install node.js 
// 1b. npm install http-proxy
// 1c. open cmd window and run "node demo1.js"
// 1d. open firefox, chrome, ie, etc. on your machine go to the proxy settings and put in 127.0.0.1:8081 and select 'proxy all protocols'
// 1e. visit any website on the internet - you will see url/requests passing through your local proxy
//     make sure you test https://www.paypal.com 
// **** DO NOT GO TO STEP 2 UNTIL THE STEPS ABOVE WORK ****
// **** IF YOUR BROWSER STOPS WORKING ==> DISABLE THE PROXY! ****  (you'll need to do this after you stop running the proxy anyway)

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP2: install openssl and generate TEST ssl keys
//	  * skip this step if keys were already generated in the project (check for domain.com.key and domain.com.cert files)
//    * openssl is NOT necessary for running the proxy
//	  * openssl is ONLY necessary for creating self signed test keys for a domain (this step can often be skipped)
//	  * we recommend developers use SELF SIGNED KEYS so they cannot accidentally compromise (upload) the real ssl keys
//	    (this is handy because test keys can be included with this script in the github folder, whereas real [ca signed] keys must be protected!)
//	  * openssl will already be installed on most unix systems, if you have access to a unix/linux or macos system that's cool, no need to continue.
//    * installing openssl on windows can be a bit terrifying - http://slproweb.com/products/Win32OpenSSL.html is legit, Win32 OpenSSL v1.0.1e is fine
//	    (any version with an installer is probably fine -- we're only going to use this once, 32 or 64 bit doesn't matter)
//	  * when using openssl for windows you will probably need to type C:\openssl-win32\bin\openssl.exe  instead of just "openssl" in the commands below
// 	    if all else fails - try to find the openssl.exe using your windows finder.
// 2a. Generate a Test Key:
//		# openssl genrsa -out test.key 2048
// 2b. Create a self signed certificate
//		# openssl req -new -key test.key -out WWW.DOMAIN-THE-APP-WILL-BE-HOSTED-AT.COM.csr
//	   You will be asked questions to create a key - use any values for each prompt EXCEPT "Common Name" which **MUST** be the
//	   the fully qualified host.domain.com -- ex: WWW.DOMAIN-THE-APP-WILL-BE-HOSTED-AT.COM
//	   the domain does not need to be uppercase, leave password blank
//	   Example: Common Name (eg, your name or your server's hostname) []:WWW.DOMAIN-THE-APP-WILL-BE-HOSTED-AT.COM
// 2c. Generate & Self sign a certificate
//		# openssl x509 -req -in WWW.DOMAIN-THE-APP-WILL-BE-HOSTED-AT.COM.csr -signkey test.key -out WWW.DOMAIN-THE-APP-WILL-BE-HOSTED-AT.COM.crt
// 2d. **OPTIONAL** open your browser and import the CA certificate "test.key" 
//	   **IF** step 2d is not done a security warning will be presented to the device the first time it attempts to access the local site
//	          and you can import the certificate then. The warning is intended to be scary, don't panic - you're system is pretending it is
//			  a website it is not, the warnings SHOULD be scary.   Using this approach you can impersonate paypal, amazon, facebook, etc. 
//			  whatever (it's pretty cool) and a *GREAT* way to mess with kids, spouses, co-workers if you can get their browser to trust 
//			  the CA onto your proxy. 
//

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// 3a. # node demo1.js


// CREDITS
// BASED HEAVILY ON:
// HTTP forward proxy server that can also proxy HTTPS requests
// using the CONNECT method
 
// requires https://github.com/nodejitsu/node-http-proxy
 

 
var path = require('path'),
    fs = require('fs'),
	httpProxy = require('http-proxy'),
	url = require('url'),
	net = require('net'),
	http = require('http'),
	https = require('https'),
	crypto = require('crypto');
 
 
 
 var WEBSERVERoptions = {
  https: {
    key: fs.readFileSync('test.key', 'utf8'),
    cert: fs.readFileSync('www.zoovy.com.crt', 'utf8')
  }
};
 

//
// generic function to load the credentials context from disk
//
function getCredentialsContext (cer) {
  return crypto.createCredentials({
    // key:  fs.readFileSync(path.join(__dirname, 'certs', cer + '.key')),
    key:  fs.readFileSync(path.join(__dirname, './', 'test.key')),
    cert: fs.readFileSync(path.join(__dirname, './', cer + '.crt'))
  }).context;
}

//
// A certificate per domain hash
//
var certs = {
  "www.zoovy.com":  getCredentialsContext("www.zoovy.com"),
  };


//
// Proxy options
//
var REALHOST_PROXYoptions = {
  target: {
	https: true,
	port : 8000, 
    host : 'localhost',
	},
 enable : {
    xforward: true // enables X-Forwarded-For
  },
};

//
// LOCAL *FAKE* WEBSERVER - PORT 127.0.0.1:9000
// https://gist.github.com/rpflorence/701407
//
var localWebserverPort = 9000;

var subProxy = new httpProxy.RoutingProxy();
 http.createServer(function(req, res) {
   var uri = url.parse(req.url).pathname, filename = path.join(process.cwd(), "../..", uri);
   
    
  fs.exists(filename, function(exists) {
    // if (!exists) {
      // response.writeHead(404, {"Content-Type": "text/plain"});
      // response.write("404 Not Found\n");
      // response.end();
      // return;
    // }
	if (!exists) {
	  // no local file, so we 'll try and grab it remotely!
	  if (req.headers.host) {
			console.log("!!!!!!!!!!!!!!!!!!** FORWARDING MAGIC => "+req.headers.host+" **!!!!!!!!!!!!!!!!!!!!!!!!!");
			
			var buffer = httpProxy.buffer(req);
			subProxy.proxyRequest(req, res, {
				host: '192.168.99.100',
				port: 81,
				buffer: buffer
				});

			console.log(res);
			console.log("!!!!!!!!!!!!!!!!!!** FINISHED FORWARDING MAGIC **!!!!!!!!!!!!!!!!!!!!!!!!!");
			
			// var conn = net.connect(80, request.headers.host, function() {
				// respond to the client that the connection was made
				// socket.write("HTTP/1.1 200 OK\r\n\r\n");
				// create a tunnel between the two hosts
				// socket.pipe(conn);
				// conn.pipe(socket);
				// });
			}
		else {
			res.writeHead(404, {"Content-Type": "text/plain"});
			res.write("404 Local File Not Found - Additionally \"Host:\" Header Missing - forwarding not possible.\n");
			res.end();
			}
		return;			
		}
 
	if (fs.statSync(filename).isDirectory()) filename += '/index.html';
 
    fs.readFile(filename, "binary", function(err, file) {
      if(err) {        
        res.writeHead(500, {"Content-Type": "text/plain"});
        res.write(err + "\n");
        res.end();
        return;
      }
 
      res.writeHead(200);
      res.write(file, "binary");
      res.end();
    });
  });
}).listen(parseInt(localWebserverPort, 10));
 
 console.log("Static file server running at\n  => http://localhost:" + localWebserverPort + "/\nCTRL + C to shutdown");

// LOCAL *FAKE* HTTPS/HTTP PROXY SERVER (CONNECTS TO LOCAL *FAKE* WEBSERVER)
 var FAKEHOST_HTTPS_PROXY_options = {
	https: {
		key: fs.readFileSync('test.key', 'utf8'),
		cert: fs.readFileSync('www.zoovy.com.crt', 'utf8')
	}
};
httpProxy.createServer(localWebserverPort, 'localhost', FAKEHOST_HTTPS_PROXY_options).listen(9002);





//
// Create a standalone HTTP/HTTPS proxy server that will receive connections from port 8081
//
// https proxy
httpProxy.createServer(REALHOST_PROXYoptions).listen(8001);
http.createServer(function (req, res) {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.write('hello https\n');
  res.end();
}).listen(8000);
 
process.on('uncaughtException', logError);
 
function truncate(str) {
	var maxLength = 64;
	return (str.length >= maxLength ? str.substring(0,maxLength) + '...' : str);
}
 
function logRequest(req) {
	console.log(req.method + ' ' + truncate(req.url));
	for (var i in req.headers)
		console.log(' * ' + i + ': ' + truncate(req.headers[i]));
}
 
function logError(e) {
	console.warn('*** ' + e);
}
 
// this proxy will handle regular HTTP requests
var regularProxy = new httpProxy.RoutingProxy();
 
// standard HTTP server that will pass requests 
// to the proxy
var proxyWebServer = http.createServer(function (req, res) {
  console.log('running createServer');
  logRequest(req);
  uri = url.parse(req.url);

  var parts = req.url.split(':', 2);
  console.log('REQ HOST:'+uri.host);
  if (uri.host == "www.zoovy.com") {
	// we'll send this to the local server
	console.log("!!!!!!!!!!!!!!!!!!** HTTPS MAGIC **!!!!!!!!!!!!!!!!!!!!!!!!!");
	regularProxy.proxyRequest(req, res, {
		host: '127.0.0.1',
		port: 9000		
		});
	}
  else {
	// a regular connection to another non-local host
	regularProxy.proxyRequest(req, res, {
		host: uri.hostname,
		port: uri.port || 80		
		});
	}
});
 
// when a CONNECT request comes in, the 'upgrade'
// event is emitted
proxyWebServer.on('upgrade', function(req, socket, head) {
	console.log('running UPGRADE');
	logRequest(req);
	// URL is in the form 'hostname:port'
	var parts = req.url.split(':', 2);
	// open a TCP connection to the remote host
	var conn = net.connect(parts[1], parts[0], function() {
		// respond to the client that the connection was made
		socket.write("HTTP/1.1 200 OK\r\n\r\n");
		// create a tunnel between the two hosts
		socket.pipe(conn);
		conn.pipe(socket);
	});
});

// when a CONNECT request comes in, the 'upgrade'
// event is emitted
proxyWebServer.on('connect', function(req, socket, head) {
	console.log('running CONNECT');
	logRequest(req);
	// URL is in the form 'hostname:port'
	var parts = req.url.split(':', 2);
	var hostname = parts[0];
	var port = parts[0];
	// open a TCP connection to the remote host

	console.log('REQ 0:'+parts[0]+" 1:"+parts[1]);
	if (parts[0] == "www.zoovy.com") {
		console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!** HTTP MAGIC **!!!!!!!!!!!!!!!!!!!!!");
		parts[0] = "127.0.0.1"; parts[1] = "9002";
		}
	
	var conn = net.connect(parts[1], parts[0], function() {
		// respond to the client that the connection was made
		socket.write("HTTP/1.1 200 OK\r\n\r\n");
		// create a tunnel between the two hosts
		socket.pipe(conn);
		conn.pipe(socket);
	});
});
// proxyWebServer will accept connections on port 8081
proxyWebServer.listen(8081);

