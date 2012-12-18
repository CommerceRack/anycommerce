
var util = require ('util');
var http = require ('http');

var i = 1;

var options = {
  host: 'www.zoovy.com',
  port: 80,
  path: '/index.html',
  method: 'GET'
};

while ( i < 100 ) {
	util.puts('hello '+i);
	i++;
	var req = http.request(options, function(res) {
	console.log('STATUS: ' + res.statusCode);
	console.log('HEADERS: ' + JSON.stringify(res.headers));
	res.setEncoding('utf8');
	res.on('data', function (chunk) {
		console.log('BODY: ' + chunk);
		});
	});
	req.on('error', function(e) {
	console.log('problem with request: ' + e.message);
	});

	// write data to request body
	req.write('data\n');
	req.write('data\n');
	req.end();

}
