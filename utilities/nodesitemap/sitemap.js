
//
// SITEMAP GENERATOR
//


var fs = require('fs');
var XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var dateFormat = require('dateformat');
var now = new Date();

var opts = require('nomnom')
        .option('domain', {
                abbr: 'd',
                required : true,
                help : 'domain to generate a sitemap for'
                })
        .option('path', {
                abbr: 'p',
                default : './',
                help : 'path to write the file'
                })
		.option('customurls',{
				abbr:'c',
				default : false,
				help : 'path to json file containing an array of custom urls to be added to the sitemap'
				}).parse();

var DOMAIN = opts['domain'];
var PATH = opts['path'];
var URLS = new Array;           // a list of URLS *without* the domain name ex: /path/to/file

//
// step1: load any extra files
//
if(opts['customurls']){
	console.log('Trying to load custom urls from file: '+opts['customurls']);
	if(opts['customurls'].charAt(0) !== "."){
		opts['customurls'] = "./"+opts['customurls'];
		}
	var customUrls;
	try{
		customUrls = require(opts['customurls']);
		if(customUrls instanceof Array){
			URLS = URLS.concat(customUrls);
			}
		else {
			console.err("Custom URL file specified was not an Array");
			}
		}
	catch(e){
		throw "Either could not load custom urls from path: "+opts['customurls']+" or specified json file was not an Array";
		}
	
	}

//
// now load all products and categories
//
var request = new XMLHttpRequest();
request.open('GET','http://www.sportsworldchicago.com/jsonapi/call/v201410/appSEOFetch',false);
request.send(null);

var urls = JSON.parse(request.responseText);
// console.log(urls['@OBJECTS']);

var today = new Date();
var datestr = dateFormat(now,"yyyy-mm-dd");

for( var i in urls['@OBJECTS'] ) {
        // { id: '.mlb.boston_red_sox.z_david_ortiz', type: 'navcat' }
        var res = urls['@OBJECTS'][i];
		if(!res['seo:noindex']){
				var url = '';
				switch (res.type) {
						case 'pid':
								url = '/product/' + res.id + '/';
								break;
						case 'navcat':
								url = '/category/' + res.id.substr(1) +'/';  // strip leading . in category name
								break;
						case 'list' :
								// we don't index these.
								break;
						default :
								console.log(res);
								break;
						}
				if (url) {
						URLS.push(url);
						}
				}
		else {
			console.log('Following object was skipped due to inclusion of seo:noindex attribute:');
			console.dir(res);
				}
        }


//
// SPLIT URLS INTO 50000 URL CHUNKS
//
var CHUNKCOUNT = 0;
var CHUNKS = new Array;
while (URLS.length > 0) {
        if (CHUNKS[CHUNKCOUNT]  == null) { CHUNKS[CHUNKCOUNT] = new Array; }    // initialize array
        CHUNKS[CHUNKCOUNT].push( URLS.shift() );
        if (CHUNKS[CHUNKCOUNT].length >= 50000) { CHUNKCOUNT++; }
        }

//
// GENERATE THE FILES
//              sitemap.xml :index to all files
//              sitemap-www.domain.com-1.xml : file
//
var XMLWriter = require('xml-writer');
si = new XMLWriter;
si.startDocument();
//si.startElement('urlset').writeAttribute('xmlns','http://www.google.com/schemas/sitemap/0.84');
//si.writeRaw("\n");
si.startElement('sitemapindex').writeAttribute('xmlns','http://www.sitemaps.org/schemas/sitemap/0.9');
si.writeRaw("\n");
var FILENUM = 0;
while (CHUNKS.length>0) {
        var XMLWriter = require('xml-writer');
        xw = new XMLWriter;
        xw.startDocument();
        xw.startElement('urlset').writeAttribute('xmlns','http://www.google.com/schemas/sitemap/0.84');
        xw.writeRaw("\n");
        // write the files
        URLS = CHUNKS.shift();
        for(var i in URLS) {
                var url = URLS[i];
                url = 'http://' + DOMAIN + url;
                xw.startElement("url");
                        xw.startElement("loc").text(url).endElement();
                        xw.startElement("priority").text("1").endElement();
                xw.endElement();
                xw.writeRaw("\n");
                }
        xw.endDocument();
        FILENUM++;


        var FILENAME = 'sitemap-'+DOMAIN+'-'+FILENUM+'.xml';
        si.startElement('sitemap');
                si.startElement('loc').text( 'http://' + DOMAIN + '/' + FILENAME).endElement();
                si.startElement('lastmod').text(datestr).endElement();
        si.endElement();
        si.writeRaw("\n");

        console.log('writing '+PATH+FILENAME);
        fs.writeFileSync(PATH + FILENAME,xw.toString());
        //   console.log(xw.toString());
        }

console.log('writing '+PATH+'sitemap.xml');
fs.writeFileSync(PATH + 'sitemap.xml', si.toString());
console.log('done');
