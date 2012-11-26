#!/usr/bin/env node

var
    url = require('url'),
    http = require('http'),
	helpers = require('./node-http-proxy-helpers');
    // acceptor = http.createServer().listen(8080);

	var https = require ('https');
    var x = https.createServer(helpers.https)
	//function (req, res) {
//  res.writeHead(200, { 'Content-Type': 'text/plain' });
//  res.write('hello https\n');
//	res.end();
//}
.listen(8081);
	
x.on('request', function(request, response) {
    console.log('request ' + request.url);
    request.pause();
    var options = url.parse(request.url);
    options.headers = request.headers;
    options.method = request.method;
    options.agent = false;

    var connector = http.request(options, function(serverResponse) {
            serverResponse.pause();
            response.writeHeader(serverResponse.statusCode, serverResponse.headers);
            serverResponse.pipe(response);
            serverResponse.resume();
    });
    request.pipe(connector);
    request.resume();
});

