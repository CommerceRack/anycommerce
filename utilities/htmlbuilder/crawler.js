var phantom = require('node-phantom-simple');
var fs = require('fs');
var ATTEMPT_LIMIT = 200;
var TIMEOUT = 100; // total timeout limit of 200*100 = 20000, or 20 seconds 

var crawler = function(domain, pageArr, onFinish, id){
	onFinish = onFinish || function(){};
	if(typeof id == "undefined"){
		id = new Date().getTime();
		}
	var currentPage = false;
	phantom.create((function(phantom){return function(err,ph){
		return ph.createPage(function(err,page){
			// page.onConsoleMessage = function(msg){
				// console.log(msg);
				// }
			return page.open("http://"+domain+"/?_v="+new Date().getTime(), function(err, status){
				//HERE IS WHERE THE COOL SHIT HAPPENS
				function hello(){
					return "function(){window.__ATTEMPT_LIMIT="+ATTEMPT_LIMIT+";}";
					}
				function getStatus(){
					//console.log('creating a getStatus');
					return function(){
						var r = false;
						if(window.myApp.ext &&
							window.myApp.ext.quickstart &&
							window.myApp.ext.quickstart.vars){window.myApp.ext.quickstart.vars.cachedPageCount = 0;}
						if(window.myApp.ext &&
							window.myApp.ext.quickstart &&
							window.myApp.ext.quickstart.vars &&
							window.myApp.ext.quickstart.vars.showContentFinished){
							r = {
								appuri : window.$('[data-app-uri]').attr('data-app-uri'),
								html : '<!DOCTYPE html>'+window.document.documentElement.outerHTML
								}
							}
						else if(window.__attempts < window.__ATTEMPT_LIMIT){
							window.__attempts++;
							}
						else {
							r = true;
							}
						return r
						}
					}
				function getNextPage(){
					currentPage = pageArr.shift();
					return "function(){"
								+"window.__attempts=0;"
								+"window.myApp.router.handleURIChange('"+currentPage.url+"');"
								+"}"
					}
				function handleContinue(err, result){
					//console.log(result);
					if(!result){
						setTimeout(function(){page.evaluate(getStatus(), handleContinue)},TIMEOUT);
						}
					else {
						evaluateNext();
						}
					}
				function handlePage(err, result){
					//console.log(result);
					if(!result){
						setTimeout(function(){page.evaluate(getStatus(), handlePage)},TIMEOUT);
						}
					else if (typeof result == 'object' && result.html){
						var filepath = currentPage.buildpath+""+currentPage.filename;
						if(result.appuri != currentPage.url){
							throw 'ERROR: page '+currentPage.url+' returned appuri '+result.appuri;
							}
						else{
							// console.log('Phantom crawler '+id+' writing file: '+filepath);
							fs.writeFileSync(filepath, result.html);
							}
						evaluateNext();
						}
					else{
						console.error('Received a timeout on page '+currentPage.url);
						//We got a go from result, but no info.  Continue.
						evaluateNext();
						}
					
					}
				function evaluateNext(){
					if(pageArr.length){
						// console.log('Phantom crawler '+id+' getting next page: '+pageArr[0].url);
						page.evaluate(getNextPage())
						page.evaluate(getStatus(), handlePage);
						}
					else {
						ph.exit();
						onFinish();
						}
					}
				setTimeout(function(){
					page.evaluate(hello());
					page.evaluate(getStatus(), handleContinue);
					}, 2000);
				});
			})
		}})(phantom),{parameters : {'load-images':false}});
	
	}

module.exports = crawler;