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

This extension provides a set of tools for tech support (e.g. Non-Developers)
to debug issues in a shopping application.

*/

var entomologist = function() {
	var theseTemplates = new Array('');
	var r = {

	vars : {
		willFetchMyOwnTemplates : true
		},
		
////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	callbacks : {
		init : {
			onSuccess : function()	{
				var r = false; 
				window.showDebugger = app.ext.entomologist.a.showDebugger
				
				app.model.fetchNLoadTemplates(app.vars.baseURL + "extensions/entomologist/templates.html", []);
				app.u.loadCSSFile("extensions/entomologist/styles.css","entomologistCSS");
				r = true;

				return r;
				},
			onError : function()	{
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
			showDebugger : function(width, height){
				width = width || 800;
				height = height || 500;
				if(app.ext.entomologist.vars.$debugger){
					app.ext.entomologist.vars.$debugger.dialog('open');
					}
				else {
					var $debugger = $('<div></div>');
					$debugger.anycontent({'data':{}, 'templateID':'debuggerTemplate'});
					app.ext.entomologist.vars.$debugger = $debugger;
					$debugger.on('click.refreshDebug', '[data-debug="refresh"]', function(){
						if($(this).attr('data-debug-target')){
							//app.u.dump($('[data-debug="'+$(this).attr('data-debug-target')+'"]', $debugger));
							app.ext.entomologist.u.update($('[data-debug="'+$(this).attr('data-debug-target')+'"]', $debugger));
							}
						});
						
					$('.tabificateMe', $debugger).anytabs();
					$debugger.dialog({'title':'Entomology Lab', 'height':height, 'width':width});
					}
								
				//app.ext.entomologist.u.update( $('[data-debug="prodDumperList"]', $debugger));
				//app.ext.entomologist.u.update( $('[data-debug="catDumperList"]', $debugger));
				app.ext.entomologist.u.update( $('[data-debug="localStorageDumperList"]', $debugger));
				
				
				return "Opening Entomology Lab...";
				}
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			dumpData : function($tag, data){
				app.u.dump(data.value);
				}
			}, //renderFormats

////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			updateList : function($target, datapointerPrefix, templateID, useLocalStorage){
				app.u.dump('BEGIN app.ext.entomologist.u.updateList');
				$target.intervaledEmpty();
				
					app.u.dump(datapointerPrefix);
					app.u.dump(templateID);
					app.u.dump(useLocalStorage);
				if(useLocalStorage){
					for(var i = 0; i < localStorage.length; i++){
						if(localStorage.key(i).indexOf(datapointerPrefix >= 0)){
							var obj = {};
							if(localStorage.getItem(localStorage.key(i)).charAt(0) == "{" ||
							   localStorage.getItem(localStorage.key(i)).charAt(0) == "["){
								obj = JSON.parse(localStorage.getItem(localStorage.key(i)));
								}
							else {
								obj.lsVal = localStorage.getItem(localStorage.key(i));
								}
							var $listing = $('<div />').anycontent({'data':$.extend(obj, {"lsKey" : localStorage.key(i)}), 'templateID':templateID});
							$target.append($listing.children());
							}
						}
					}
				else {
					for(var index in app.data){
						if(index.indexOf(datapointerPrefix) >= 0){
							//app.u.dump(index);
							var $listing = $('<div />').anycontent({'data':app.data[index], 'templateID':templateID});
							$target.append($listing.children());
							}
						}
					}					
				},
			updateTag : function($target, datapointer, templateID, useLocalStorage){
				app.u.dump('BEGIN app.ext.entomologist.u.updateTag');
				if(useLocalStorage){
					if(localStorage.getItem(datapointer)){
						var obj = {};
							if(localStorage.getItem(datapointer).charAt(0) == "{" ||
							   localStorage.getItem(datapointer).charAt(0) == "["){
								obj = JSON.parse(localStorage.getItem(datapointer));
								}
							else {
								obj.lsVal = localStorage.getItem(localStorage.key(i));
								}
						$target.intervaledEmpty().anycontent({'data':$.extend(obj, {"lsKey" : datapointer}), 'templateID':templateID});
						}
					}
				else {
					if(app.data[datapointer]){
						$target.intervaledEmpty().anycontent({'data':app.data[datapointer], 'templateID':templateID});
						}
				}
				
				},
			update : function($target){
				app.u.dump('BEGIN app.ext.entomologist.u.update');
				if($target.attr('data-debug-loadsTemplate') && ($target.attr('data-debug-datapointerPrefix') || $target.attr('data-debug-datapointerPrefix') === "")){
					app.u.dump('Looks like a list!');
					this.updateList($target, $target.attr('data-debug-datapointerPrefix'), $target.attr('data-debug-loadsTemplate'), $target.attr('data-debug-localStorage'));
					}
				else if($target.attr('data-debug-templateID') && $target.attr('data-debug-datapointer')) {
					app.u.dump('Looks like a tag!');
					this.updateTag($target, $target.attr('data-debug-datapointer'), $target.attr('data-debug-templateID'), $target.attr('data-debug-localStorage'));
					}
				},
			dumpData : function(datapointer, json, useLocalStorage){
				if(useLocalStorage){
					if(localStorage.getItem(datapointer)){
						app.u.dump("Data for "+datapointer+" in localStorage:");
						if(json || localStorage.getItem(datapointer).charAt(0) != "{" || localStorage.getItem(datapointer).charAt(0) != "["){
							app.u.dump(localStorage.getItem(datapointer));
							}
						else{
							app.u.dump(JSON.parse(localStorage.getItem(datapointer)));
							}
						}
					else {
						app.u.dump("-> Error: app.ext.entomologist.u.dumpData could not find data in localStorage for "+datapointer);
						}
					}
				else {
					if(app.data[datapointer]){
						app.u.dump("Data for "+datapointer+" in app.data:");
						if(json){
							app.u.dump(JSON.stringify(app.data[datapointer]));
							}
						else{
							app.u.dump(app.data[datapointer]);
							}
						}
					else {
						app.u.dump("-> Error: app.ext.entomologist.u.dumpData could not find data in app.data for "+datapointer);
						}
					}
				}
			}, //u [utilities]

		e : {
			
			} //e [app Events]
		} //r object.
	return r;
	}