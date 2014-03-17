
//
// anyCommerce Developer Proxy+Webserver
//
// purpose: serves app files off the local system via http & https
//			create a semi-realistic simulation environment for testing/diagnostics without needing to commit/sync/wait/wait/wait/test
//			especially useful for testing IE, Safari, iPad's, and other things which can't load files locally.
//

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP1: setup & test proxy
// 1a. download + install node.js 
//		* node is a server side javascript engine based on chromes v8 javascript engine.
//		* node can be downloaded from http://www.nodejs.org
//		* restart your computer after node install.
// 1b. in a dos cmd window:
//		# npm install http-proxy colors mime
// 1c. open dos/cmd window, then change directory to where the proxy is installed then run:
//		# node nodeproxy.js
// 1d. open firefox, chrome, ie, etc. on your machine go to the proxy settings and put in 127.0.0.1:8081 and select 'proxy all protocols'
// 1e. visit any website on the internet - you will see url/requests passing through your local proxy
//     make sure you test https://www.paypal.com 
// **** DO NOT GO TO STEP 2 UNTIL THE STEPS ABOVE WORK ****
// **** IF YOUR BROWSER STOPS WORKING ==> DISABLE THE PROXY! ****  (you'll need to do this after you stop running the proxy anyway)

//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// STEP2: install openssl and generate TEST ssl keys
//	  * SKIP THIS STEP if keys were already generated in the project (check for domain.com.key and domain.com.cert files)
//	  * If you aren't sure look in the folder nodeproxy.js (this file) is in for files like www.the-domain-you-are-working-on.com.crt and .key 
//
// IF YOU ARE GOING TO CONTINUE:
//    * openssl is NOT necessary for running the proxy
//	  * openssl is ONLY necessary for creating self signed test keys for a domain (this step can often be skipped) - it can be found on most linux boxen.
//	  * we recommend developers use SELF SIGNED KEYS so they cannot accidentally compromise (upload) the real ssl keys
//	    (this is handy because test keys can be included with this script in the github folder, whereas real [ca signed] keys must be protected!)
//	  * openssl will already be installed on most unix systems, if you have access to a unix/linux or macos system that's cool, no need to continue.
//    * installing openssl on windows can be a bit terrifying - http://slproweb.com/products/Win32OpenSSL.html is legit, Win32 OpenSSL v1.0.1e is fine
//	    (any version with an installer is probably fine -- we're only going to use this once, 32 or 64 bit doesn't matter)
//	  * when using openssl for windows you will probably need to type C:\openssl-win32\bin\openssl.exe  instead of just "openssl" in the commands below
// 	    if all else fails - try to find the openssl.exe using your windows finder.
//
// 2a. Generate a Test Key:  (skip this step if test.key is already present)
//		# openssl genrsa -out test.key 2048

// 2b. Create a self signed certificate
//		# openssl req -new -key test.key -out WWW.DOMAIN-THE-APP-WILL-BE-HOSTED-AT.COM.csr
//
//     HINTS:
//	   * You will be asked questions to create a key - use any values for each prompt EXCEPT "Common Name" which **MUST** be the
//	   * the fully qualified host.domain.com -- ex: WWW.DOMAIN-THE-APP-WILL-BE-HOSTED-AT.COM
//	   * the domain does not need to be uppercase, leave password blank
//	   * Example: Common Name (eg, your name or your server's hostname) []:WWW.DOMAIN-THE-APP-WILL-BE-HOSTED-AT.COM
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
// 3a. change any of these variables to match your project:
var TESTING_DOMAIN = "www-sporktacular-com.app-hosted.com"; //www.zoovy.com
var PROJECT_DIRECTORY = process.cwd() + "/../..";		// the root directory where your project files are located

// 3b. run: node nodeproxy.js
// 3c. (as instructed) - configure your browser's proxy port


 
// these are all modules you may need to install 
//	npm install modulename 
var path = require('path'),
    fs = require('fs'),
	httpProxy = require('http-proxy'),
	url = require('url'),
	net = require('net'),
	http = require('http'),
	https = require('https'),
	util = require('util'),
	colors = require('colors'),
	mime = require('mime'),
	crypto = require('crypto');
 
 var welcome = [
'                     ______                                            ',
'  ____  ____  __  __/ ____/___  ____ ___  ____ ___  ___  _____________ ',
' / __ `/ __ \\/ / / / /   / __ \\/ __ `__ \\/ __ `__ \\/ _ \\/ ___/ ___/ _ \\',
'/ /_/ / / / / /_/ / /___/ /_/ / / / / / / / / / / /  __/ /  / /__/  __/',
'\__,_/_/ /_/\\__, /\\____/\\____/_/ /_/ /_/_/ /_/ /_/\\___/_/   \\___/\\___/ ',
'           /____/   '
].join('\n');
util.puts(welcome.rainbow.bold);

console.log("\n");
console.log("INTERCEPT DOMAIN => "+TESTING_DOMAIN);
console.log("HTTP/HTTPS Proxy => 127.0.0.1:8081");
console.log("FILES SERVED FROM=> "+PROJECT_DIRECTORY);
  
var WEBSERVERoptions = {
	https: {
		key: fs.readFileSync('test.key', 'utf8'),
		cert: fs.readFileSync(TESTING_DOMAIN+'.crt', 'utf8')
		}
	};

//
// LOCAL *FAKE* WEBSERVER - PORT 127.0.0.1:9000
// https://gist.github.com/rpflorence/701407
//
//
// Create a new instance of HttProxy to use in your server
//
var localWebserverPort = 9000;
//var FILEMISSINGproxy = new httpProxy.RoutingProxy(); // *** 201352 -> new API for httpProxy
var FILEMISSINGproxy = new httpProxy.createProxyServer();

http.createServer(function(req, res) {

	var uri = url.parse(req.url).pathname, filename = path.join(PROJECT_DIRECTORY, uri);
   
	if (!fs.existsSync(filename)) {
		// no local file, so we 'll try and grab it remotely!
		console.log("!!!!!!!!!!!!!!!!!! FORWARD MAGIC "+req.headers.host+uri);

		// if you want to simulate files not working.
		// res.writeHead(404, {"Content-Type": "text/plain"});
		// res.write("404 Local File Not Found - Additionally \"Host:\" Header Missing - forwarding not possible.\n");
		// res.end();
		// return
		
		// for now we'll do all our requests http (we still need a way to know if origin request was http or https)
// *** 201352 -> new API for httpProxy
//		FILEMISSINGproxy.proxyRequest(req, res, {
//		console.log(req.connection);
		
//!!! THIS DOES NOT CURRENTLY ADEQUATELY FORWARD SECURE REQUESTS
		var target = (req.connection.encrypted ? "https://" : "http://")+req.headers.host+":80"+uri;
		console.log(target);
		FILEMISSINGproxy.web(req,res,{
			target : target,
			secure : false
			});
			
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
	
		var content_type = mime.lookup(filename); 
		if ((content_type == "text/html") || (content_type == "text/css")) {
			// tell the webbrowser the files we're working on are utf8 by appending to Content-Type
			content_type = content_type + "; charset=utf-8";
			}
		res.writeHead(200, {"Content-Type": content_type});
		res.write(file, "binary");
		res.end();
		});
	}).listen(parseInt(localWebserverPort));

// console.log("Static file server running at => http://localhost:" + localWebserverPort);

// LOCAL *FAKE* HTTPS/HTTP PROXY SERVER (CONNECTS TO LOCAL *FAKE* WEBSERVER)
var FAKEHOST_HTTPS_PROXY_options = {
	https: {
		key: fs.readFileSync('test.key', 'utf8'),
		cert: fs.readFileSync(TESTING_DOMAIN+'.crt', 'utf8')
		}
	};
// *** 201352 -> new API for httpProxy
//httpProxy.createServer(localWebserverPort, 'localhost', FAKEHOST_HTTPS_PROXY_options).listen(9002);
httpProxy.createProxyServer(localWebserverPort, 'localhost', FAKEHOST_HTTPS_PROXY_options).listen(9002);
// console.log("HTTPS proxy to static file server running at => http://localhost:9002");

//
// Create a standalone HTTP/HTTPS proxy server that will receive connections from port 8081
//
// https proxy
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
		}
	};

// *** 201352 -> new API for httpProxy
//httpProxy.createServer(REALHOST_PROXYoptions).listen(8001);
httpProxy.createProxyServer(REALHOST_PROXYoptions).listen(8001);
//console.log("Realhost proxy running at => http://localhost:8001");

http.createServer(function (req, res) {
	res.writeHead(200, { 'Content-Type': 'text/plain' });
	res.write('hello https\n');
	res.end();
	}).listen(8000);

//console.log("Routing proxy running at => http://localhost:8000");

 
process.on('uncaughtException', logError);
 
function truncate(str) {
	var maxLength = 64;
	return (str.length >= maxLength ? str.substring(0,maxLength) + '...' : str);
	}
 
function logRequest(req) {
//	console.log(req.method + ' ' + truncate(req.url));
	for (var i in req.headers)	{
//		console.log(' * ' + i + ': ' + truncate(req.headers[i]));
		}
	}
 
function logError(e) {
	console.warn('*** ' + e);
	}
 
// this proxy will handle regular HTTP requests
// *** 201352 -> new API for httpProxy
//var regularProxy = new httpProxy.RoutingProxy();
var regularProxy = new httpProxy.createProxyServer();
 
// standard HTTP server that will pass requests 
// to the proxy
var proxyWebServer = http.createServer(function (req, res) {
	console.log('running createServer');
//  logRequest(req);
	uri = url.parse(req.url);

	var parts = req.url.split(':', 2);
	console.log('REQ HOST:'+uri.host);

	if(uri.host == TESTING_DOMAIN) {
	// we'll send this to the local server
	console.log("!!!!!!!!!!!!!!!!!!** HTTPS MAGIC **!!!!!!!!!!!!!!!!!!!!!!!!!");
//	regularProxy.proxyRequest(req, res, {
//		host: '127.0.0.1',
//		port: 9000		
//		});
	regularProxy.web(req,res,{
		target : uri.protocol+'//127.0.0.1:9000'
		});
	}
  else {
	// a regular connection to another non-local host
	console.log("!!!!!!!!!!!!!!!!!!** non magic call **!!!!!!!!!!!!!!!!!!!!!!!!!");
//	regularProxy.proxyRequest(req, res, {
//		host: uri.hostname,
//		port: uri.port || 80		
//		});
	regularProxy.web(req,res,{
		target : req.url
		});
	}
});

// when a CONNECT request comes in, the 'upgrade'
// event is emitted
proxyWebServer.on('upgrade', function(req, socket, head) {
	console.log("\n\nrunning UPGRADE");
//	logRequest(req);
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
	console.log("\n\nrunning CONNECT");
//	logRequest(req);
	// URL is in the form 'hostname:port'
	console.log("req.url: "+req.url);
	var parts = req.url.split(':', 2);
	var hostname = parts[0];
	var port = parts[1];
	console.log('hostname: '+hostname+"\nport: "+port);

	// open a TCP connection to the remote host
	if(hostname == TESTING_DOMAIN) {
		console.log("hostname matches the testing domain. update hostname and port.");
		hostname = "127.0.0.1";
		port = "9002";
		}
	
	var conn = net.connect(port, hostname, function() {
		console.log("attempt tcp connection");
		// respond to the client that the connection was made
		socket.write("HTTP/1.1 200 OK\r\n\r\n");
		// create a tunnel between the two hosts
		socket.pipe(conn);
		conn.pipe(socket);
		});
	});

proxyWebServer.on('error', function(err,req,res){
	console.log("\n\nrunning ERROR");
	console.log(err);
	});

// proxyWebServer will accept connections on port 8081
proxyWebServer.listen(8081);
console.log("Ready to work\n .. use ctrl+C to exit\n");

// CREDITS
// BASED HEAVILY ON:
// HTTP forward proxy server that can also proxy HTTPS requests
// using the CONNECT method
// requires https://github.com/nodejitsu/node-http-proxy

// Copyright Zoovy, Inc. 2013
// MIT-LICENSE

