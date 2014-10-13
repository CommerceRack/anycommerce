var Browser = require('zombie');
var browser = Browser.create();


var nXMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;

for(var i = 0; i < 5; i++){
	console.log(i);
	browser.open("http://www.sportsworldchicago.com/");
	browser.visit("http://www.sportsworldchicago.com/", (function(i){
		return function(){
			browser.tabs.index = i;
			console.log('tab: '+i);
			browser.assert.elements('#appView');
			console.log(browser.window.document.title);
			}
		})(i));
	}
