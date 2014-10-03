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

var entomologist = function(_app) {
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
				window.showDebugger = _app.ext.entomologist.a.showDebugger
				
				_app.model.fetchNLoadTemplates(_app.vars.baseURL + "extensions/entomologist/templates.html");
				_app.u.loadCSSFile("extensions/entomologist/styles.css","entomologistCSS");
				r = true;

				return r;
				},
			onError : function()	{
				_app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
			showDebugger : function(width, height){
				width = width || 800;
				height = height || 500;
				if(_app.ext.entomologist.vars.$debugger){
					_app.ext.entomologist.vars.$debugger.dialog('open');
					}
				else {
					var $debugger = $('<div></div>');
					$debugger.anycontent({'data':{}, 'templateID':'debuggerTemplate'});
					_app.ext.entomologist.vars.$debugger = $debugger;
					$debugger.on('click.refreshDebug', '[data-debug="refresh"]', function(){
						if($(this).attr('data-debug-target')){
							//_app.u.dump($('[data-debug="'+$(this).attr('data-debug-target')+'"]', $debugger));
							_app.ext.entomologist.u.update($('[data-debug="'+$(this).attr('data-debug-target')+'"]', $debugger));
							}
						});
						
					$('.tabificateMe', $debugger).anytabs(); //consider adding an 'applyAnytabs' to this element and running _app.u.handleCommonPlugins($debugger);
					$debugger.dialog({'title':'Entomology Lab', 'height':height, 'width':width});
					}
								
				//_app.ext.entomologist.u.update( $('[data-debug="prodDumperList"]', $debugger));
				//_app.ext.entomologist.u.update( $('[data-debug="catDumperList"]', $debugger));
				_app.ext.entomologist.u.update( $('[data-debug="localStorageDumperList"]', $debugger));
				
				
				return "Opening Entomology Lab...";
				}
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			dumpData : function($tag, data){
				_app.u.dump(data.value);
				}
			}, //renderFormats

////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			updateList : function($target, datapointerPrefix, templateID, useLocalStorage){
				_app.u.dump('BEGIN _app.ext.entomologist.u.updateList');
				$target.intervaledEmpty();
				
					_app.u.dump(datapointerPrefix);
					_app.u.dump(templateID);
					_app.u.dump(useLocalStorage);
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
					for(var index in _app.data){
						if(index.indexOf(datapointerPrefix) >= 0){
							//_app.u.dump(index);
							var $listing = $('<div />').anycontent({'data':_app.data[index], 'templateID':templateID});
							$target.append($listing.children());
							}
						}
					}					
				},
			updateTag : function($target, datapointer, templateID, useLocalStorage){
				_app.u.dump('BEGIN _app.ext.entomologist.u.updateTag');
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
					if(_app.data[datapointer]){
						$target.intervaledEmpty().anycontent({'data':_app.data[datapointer], 'templateID':templateID});
						}
				}
				
				},
			update : function($target){
				_app.u.dump('BEGIN _app.ext.entomologist.u.update');
				if($target.attr('data-debug-loadsTemplate') && ($target.attr('data-debug-datapointerPrefix') || $target.attr('data-debug-datapointerPrefix') === "")){
					_app.u.dump('Looks like a list!');
					this.updateList($target, $target.attr('data-debug-datapointerPrefix'), $target.attr('data-debug-loadsTemplate'), $target.attr('data-debug-localStorage'));
					}
				else if($target.attr('data-debug-templateID') && $target.attr('data-debug-datapointer')) {
					_app.u.dump('Looks like a tag!');
					this.updateTag($target, $target.attr('data-debug-datapointer'), $target.attr('data-debug-templateID'), $target.attr('data-debug-localStorage'));
					}
				},
			dumpData : function(datapointer, json, useLocalStorage){
				if(useLocalStorage){
					if(localStorage.getItem(datapointer)){
						_app.u.dump("Data for "+datapointer+" in localStorage:");
						if(json || localStorage.getItem(datapointer).charAt(0) != "{" || localStorage.getItem(datapointer).charAt(0) != "["){
							_app.u.dump(localStorage.getItem(datapointer));
							}
						else{
							_app.u.dump(JSON.parse(localStorage.getItem(datapointer)));
							}
						}
					else {
						_app.u.dump("-> Error: _app.ext.entomologist.u.dumpData could not find data in localStorage for "+datapointer);
						}
					}
				else {
					if(_app.data[datapointer]){
						_app.u.dump("Data for "+datapointer+" in _app.data:");
						if(json){
							_app.u.dump(JSON.stringify(_app.data[datapointer]));
							}
						else{
							_app.u.dump(_app.data[datapointer]);
							}
						}
					else {
						_app.u.dump("-> Error: _app.ext.entomologist.u.dumpData could not find data in _app.data for "+datapointer);
						}
					}
				}
			}, //u [utilities]

		e : {
			
			} //e [app Events]
		} //r object.
	return r;
	}