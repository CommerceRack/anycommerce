//
// HTML GENERATOR
//


var fs = require('fs');
var nXMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
var dateFormat = require('dateformat');
var now = new Date();

var opts = require('nomnom')
        .option('domain', {
                abbr: 'd',
                required : true,
                help : 'domain to generate a sitemap for'
                })
		.option('threads',{
				abbr:'t',
				default:1,
				callback:function(threads){if(threads != parseInt(threads)){return "threads must be an int"}},
				help : 'how many phantom instances to run concurrently'
				})
		.option('customurls',{
				abbr:'c',
				default : false,
				help : 'path to json file containing an array of custom urls to be added to the sitemap'
				}).parse();

var DOMAIN = opts['domain'];
var PATH = opts['path'];
var PAGES = new Array;           // a list of URLS *without* the domain name ex: /path/to/file

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
			for(var i in customUrls){
				var page = {
					'url':customUrls[i],
					'filename':customUrls[i].replace(/\//g,'').replace(/\?/g,'_')+".html",
					'buildpath':'./built/custom/'
					}
				if(page.filename == ".html"){
					page.filename = "home.html";
					}
				PAGES.push(page);
				}
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

var pages = JSON.parse(request.responseText);
// console.log(urls['@OBJECTS']);

var today = new Date();
var datestr = dateFormat(now,"yyyy-mm-dd");
var prods = 0;
var navcats = 0;
for( var i in pages['@OBJECTS'] ) {
        // { id: '.mlb.boston_red_sox.z_david_ortiz', type: 'navcat' }
        var res = pages['@OBJECTS'][i];
		if(!res['seo:noindex']){
				var page = false;
				switch (res.type) {
						case 'pid':
								if(prods < 10){
									page = {
										url : '/product/' + res.id + '/',
										filename : res.id+".html",
										buildpath : "./built/product/"
										}
									prods++
									}
								break;
						case 'navcat':
								var url = "";
								if(res.id == ".mlb"){
									url = '/major_league_baseball/';
									}
								else if(res.id.indexOf('.mlb') == 0 && res.id.split('.').length == 3){
									url = '/major_league_baseball/'+res.id.split('.')[2]+'/';
									}
								else if(res.id == ".nfl_teams"){
									url = '/national_football_league/';
									}
								else if(res.id.indexOf('.nfl_teams') == 0 && res.id.split('.').length == 3){
									url = '/national_football_league/'+res.id.split('.')[2]+'/';
									}
								else if(res.id != '.'){
									url = '/category/' + res.id.substr(1) + '/';  // strip leading . in category name
									}
								if(url && navcats <10){
									page = {
										url : url,
										filename : res.id.substr(1)+".html",
										buildpath : "./built/category/"
										}
									navcats++
									}
								break;
						case 'list' :
								// we don't index these.
								break;
						default :
								console.log(res);
								break;
						}
				if (page) {
						PAGES.push(page);
						}
				}
		else {
			console.log('Following object was skipped due to inclusion of seo:noindex attribute:');
			console.dir(res);
				}
        }
		
var Crawler = require('./crawler.js');

var crawlers = new Array(opts['threads']);
var CHUNKSIZE = 200;

function makeCrawler(i){
	// console.log('makeCrawler '+i);
	if(PAGES.length){
		console.log('Making new crawler.  Remaining pages: '+PAGES.length);
		crawlers[i] = new Crawler(DOMAIN, PAGES.splice(0,CHUNKSIZE), function(){makeCrawler(i)}, i);
		}
	else{
		// console.log('crawler '+i+' setting itself to false');
		crawlers[i] = false;
		for(var j in crawlers){
			if(crawlers[j]){
				// console.log('Not Exiting.');
				return true;
				}
			}
		//we've made it to the end of the crawler list and they're all false
		// console.log('Exiting!');
		process.exit();
		}
	}

for(var i = 0; i < crawlers.length; i++){
	makeCrawler(i);
	}
