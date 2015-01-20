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



var json_loader = function(_app) {
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				r = true;
				return r;
				},
			onError : function()	{
				_app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
		a : {

			}, //Actions

////////////////////////////////////   TLCFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//tlcformats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		tlcformats : {
			get : function(data, thisTLC){
				var args = thisTLC.args2obj(data.command.args, data.globals);
				var path = args.path || data.globals.binds[data.globals.focusBind];
				if(_app.ext.json_loader.loaded[path]){
					data.globals.binds[data.globals.focusBind] = _app.ext.json_loader.loaded[path];
					return true;
					}
				else {
					_app.u.dump('TLC ERROR: json_loader#get- path ['+path+'] could not be resolved for data');
					return false;
					}
				
				}
			}, //tlcformats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
			get : function(filepath, callback){
				if(_app.ext.json_loader.loaded[filepath]){
					callback($.extend(true, {}, _app.ext.json_loader.loaded[filepath]));
					}
				else {					
					$.getJSON(filepath+"?_v="+new Date().getTime(), function(json){
						_app.ext.json_loader.loaded[filepath] = 
						callback($.extend(true, {}, _app.ext.json_loader.loaded[filepath]));
						});	
					}
				},
			clear : function(filepath){
				if(_app.ext.json_loader.loaded[filepath]){
					delete _app.ext.json_loader.loaded[filepath];
					}
				else {
					//wasn't here to begin with, can't clear it
					}
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