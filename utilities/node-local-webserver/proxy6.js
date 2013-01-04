var Proxy = require('mitm-proxy')
  , url   = require('url');

var processor = function(proxy) {
    this.url_rewrite = function(req_url) {
        req_url.hostname = "nodejs.org";
    };
};

new Proxy({proxy_port: 8081}, processor);