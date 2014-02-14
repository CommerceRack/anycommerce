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


/*
This is a beta of an AB testing plugin.  The code in init handles local storing and assigning of groupings.

Usage of the plugin is intended as follows:

1) Add feature keys to vars.groupings, along with the "length" (number of groups possible
2) Add renderFormats, actions, utilities, or other AB testable features.  Use the grouping assignments as part of a switch statement to determine functionality
3) Analyze Data

TODO:
Add support for data-mining- hooks for google analytics tracking

*/


var tools_ab_testing = function() {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	
	vars : {
		localStorageKey : 'abtesting',
		groupings : {
			//Key is feature grouping, value is the number of groups that can be assigned
			//The value will be replaced by the group (integer value, 0 indexed) during init
			"exampleFeature" : 3
			}
		},

	callbacks : {
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				
				//DETERMINE EXPERIMENTAL GROUPS
				
				//Grab any stored groupings for user consistency (a user will experience the same feature on returning to the app)
				var cachedGroupings = app.storageFunctions.readLocal(app.ext.tools_ABtesting.vars.localStorageKey);
				
				//Delete the stored groupings.  They will be rewritten after any non-existing groupings are assigned.
				localStorage.removeItem(app.ext.tools_ABtesting.vars.localStorageKey);

				//if no value was present in localstorage, the storageFunctions attempts to readCookie instead
				//if no cookie is present, false is returned.  In this case start fresh.
				if(!cachedGroupings){
					cachedGroupings = {};
					}
				
				
				for(var key in app.ext.tools_ABtesting.vars.groupings){
					//load cached groupings.  Replaces cached groupings that are outside current scope of the grouping
					if(cachedGroupings[key] && cachedGroupings[key] < app.ext.tools_ABtesting.vars.groupings[key]){
						app.ext.tools_ABtesting.vars.groupings[key] = cachedGroupings[key];
						}
					else{
						//assign new grouping
						app.ext.tools_ABtesting.vars.groupings[key] = Math.floor(Math.random()*app.ext.tools_ABtesting.vars.groupings[key]);
						//app.u.dump(key+": "+app.ext.tools_ABtesting.vars.groupings[key]);
						}
					}
				
				//re-write localStorage.  Previously cached vars that have no grouping in the current extension are tossed, to avoid localStorage buildup.
				app.storageFunctions.writeLocal(app.ext.tools_ABtesting.vars.localStorageKey, app.ext.tools_ABtesting.vars.groupings);
				
				
				//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
				r = true;

				return r;
				},
			onError : function()	{
				app.u.dump('BEGIN tools_ABtesting.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			exampleABRenderFormat: function($tag, data){
				switch(app.ext.tools_ABtesting.vars.groupings.exampleFeature){
					case 0:
						$tag.text("A: "+data.value);
						break;
					case 1:
						$tag.text("B: "+data.value);
						break;
					case 2:
						$tag.text("C: "+data.value);
						break;
					}
				}
			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			}, //u [utilities]

		e : {
			} //e [app Events]
		} //r object.
	return r;
	}