/* **************************************************************

   Copyright 2013 Zoovy, Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

************************************************************** */



//    !!! ->   TODO: replace 'username' in the line below with the merchants username.     <- !!!

var seo_robots = function(_app) {
	var r = {

	vars : {
		pages : [],
		pagesLoaded : false
		},

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				
				
				if(_app.vars._robotGreeting){
					_app.ext.seo_robots.u.welcomeRobot(_app.vars._robotGreeting);
					}
				else {
					_robots.hello = _app.ext.seo_robots.u.welcomeRobot;
					}
				//Replace the _robots.next default functionality with some real stuff
				
				
				_robots.next = function(){
					if(_app.ext.seo_robots.vars.pagesLoaded){
						var p = _app.ext.seo_robots.vars.pages.splice(0,1)[0];
						if(typeof p == 'undefined'){
							_robots.status = function(){ return -1; }
							return false;
							}
						var status = 100;
						var hasRun = false;
						_robots.status = function(){
							if(hasRun){
								if(_app.ext.quickstart.vars.showContentFinished && _app.ext.quickstart.vars.showContentCompleteFired){
									status = 200;
									}
								else {
									status = 100;
									}
								}
							else {
								if(typeof p == 'string' && p.indexOf('#!') == 0){
									_app.ext.quickstart.vars.showContentFinished = false;
									_app.ext.quickstart.vars.showContentCompleteFired = false;
									window.location.hash = p;
									}
								else if(typeof p == 'object'){ //p is an object
									var infoObj = {};
									switch(p.type){
										case "pid":
											infoObj = {
												pageType : "product",
												pid : p.id
												};
											break;
										case "navcat" : 
											infoObj = {
												pageType : "category",
												navcat : p.id
												};
											break;
										case "list" : 
											dump("LIST "+p.id+" SKIPPED IN PAGE BUILDING");
											break;
										default :
											dump("Unrecognized pageInfo type: "+p.type+" full obj follows:");
											dump(p);
											break;	
										}
									showContent('',infoObj);
									}
								else {
									status = 404;
									}
								hasRun = true;
								}
							return status;
							}
						}
					else {
						_robots.status = function(){
							if(_app.ext.seo_robots.vars.pagesLoaded){
								return 204;
								}
							else {
								return 100;
								}
							}
						}
					}
				
				//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
				r = true;

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				_app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
		a : {

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//renderFormats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		renderFormats : {

			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
			welcomeRobot : function(botStr){
				var request = {
					"_cmd" : "appSEOFetch"
					};
				request._tag = {
					'datapointer' : 'appSEOFetch',
					'callback' : function(rd){
						$.extend(_app.ext.seo_robots.vars.pages, _app.ext.seo_robots.vars.pages, _app.data[rd.datapointer]['@OBJECTS']);
						_app.ext.seo_robots.vars.pagesLoaded = true;
						}
					};
				_app.model.addDispatchToQ(request, 'immutable');
				_app.model.dispatchThis('immutable');
				
				return "1.0";
				}
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			} //e [app Events]
		} //r object.
	return r;
	}