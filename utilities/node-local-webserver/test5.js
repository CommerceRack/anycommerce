var tunnel = require('tunnel');


// var https = require ('https');
// var req = https.request({
  // host: '192.168.99.12',
  // port: 443,
  // agent: tunnelingAgent
// });

var poolSize = 5;
var proxyHost = '127.0.0.1';
var proxyPort = 8081;

var tunnelingAgent = tunnel.httpOverHttp({
  maxSockets: poolSize, // Defaults to 5

  proxy: { // Proxy settings
    host: proxyHost, // Defaults to 'localhost'
    port: proxyPort, // Defaults to 80
    //localAddress: localAddress, // Local interface if necessary

    // Basic authorization for proxy server if necessary
    //proxyAuth: 'user:password',

    // Header fields for proxy server if necessary
    headers: {
      'User-Agent': 'Node'
    }
  }
});

http = require('http');
var req = http.request({
  host: 'example.com',
  port: 80,
  agent: tunnelingAgent
});