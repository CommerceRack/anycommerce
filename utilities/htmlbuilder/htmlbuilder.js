//
// HTML GENERATOR
//


var fs = require('fs');
var nXMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var dateFormat = require('dateformat');
var now = new Date();

var phantom = require('node-phantom-simple');

var opts = require('nomnom')
        .option('domain', {
                abbr: 'd',
                required : true,
                help : 'domain to generate a sitemap for'
                })
		.option('app-path',{
				abbr:'a',
				default:'../../',
				help : 'path to the directory of the app to build'
				})
		.option('threads',{
				abbr:'t',
				default:1,
				callback:function(tabs){if(tabs != parseInt(tabs)){return "tabs must be an int"}},
				help : 'how many phantom instances to run concurrently'
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
var request = new nXMLHttpRequest();
request.open('GET','http://www.sportsworldchicago.com/jsonapi/call/v201410/appSEOFetch',false);
request.send(null);

var urls = JSON.parse(request.responseText);
// console.log(urls['@OBJECTS']);

var today = new Date();
var datestr = dateFormat(now,"yyyy-mm-dd");

// for( var i in urls['@OBJECTS'] ) {
        // // { id: '.mlb.boston_red_sox.z_david_ortiz', type: 'navcat' }
        // var res = urls['@OBJECTS'][i];
		// if(!res['seo:noindex']){
				// var url = '';
				// switch (res.type) {
						// case 'pid':
								// url = '/product/' + res.id;
								// break;
						// case 'navcat':
								// url = '/category/' + res.id.substr(1);  // strip leading . in category name
								// break;
						// case 'list' :
								// // we don't index these.
								// break;
						// default :
								// console.log(res);
								// break;
						// }
				// if (url) {
						// URLS.push(url);
						// }
				// }
		// else {
			// console.log('Following object was skipped due to inclusion of seo:noindex attribute:');
			// console.dir(res);
				// }
        // }
		
var doneCount = 0;
		
for(var i =0; i < opts['threads']; i++){
	console.log('creating phantom');
	phantom.create(function(err,ph){
		return ph.createPage(function(err,page){
			// page.onConsoleMessage = function(msg){
				// console.log(msg);
				// }
			return page.open("http://"+DOMAIN+"/?_v="+new Date().getTime(), (function(page){return function(err, status){
				console.log("opened site? "+status);
				//HERE IS WHERE THE COOL SHIT HAPPENS
				function hello(){
					_robots.hello('phantom');
					_robots.next();
					}
				function getStatus(){
					var r = {
						'status' : window._robots.status(),
						'html': window.document.documentElement.outerHTML
						}
					if(window.__page){
						r.page = window.__page;
						}
					return r
					}
				function getNextPage(){
					var url = URLS.shift();
					return "function(){window.__page = '"+url+"';window._robots.next("+url+");}"
					}
				function handleContinue(err, result){
					//console.log(result);
					if(result.status == 100){
						setTimeout(function(){page.evaluate(getStatus, handleContinue)},100);
						}
					else {
						console.log("Requesting next page");
						console.log(URLS[0]);
						page.evaluate(getNextPage())
						page.evaluate(getStatus, handlePage);
						}
					}
				function handlePage(err, result){
					//console.log(result);
					if(result.status == 100){
						setTimeout(function(){page.evaluate(getStatus, handlePage)},100);
						}
					else if (result.status == 200){
						if(result.page){
							console.log('status 200 on page: '+result.page);
							var filename = "./built/"+result.page.replace(/\//g,'')+".html";
							console.log(filename);
							fs.writeFileSync(filename, result.html);
							}
						evaluateNext();
						}
					else {
						console.log(404);
						evaluateNext();
						}
					
					}
				function evaluateNext(){
					console.log(URLS.length);
					if(URLS.length){
						page.evaluate(getNextPage())
						page.evaluate(getStatus, handlePage);
						
						}
					else {
						doneCount++;
						if(doneCount >= opts['threads']){
							process.exit(0);
							}
						}
					}
				setTimeout(function(){
					page.evaluate(hello);
					page.evaluate(getStatus, handleContinue);
					}, 2000);
				}})(page));
			})
		},{parameters : {'load-images':false}})
	}

