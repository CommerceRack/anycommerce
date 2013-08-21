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
			showDebugger : function(){
				if(app.ext.entomologist.vars.$debugger){
					app.ext.entomologist.vars.$debugger.dialog('open');
					}
				else {
					var $debugger = $('<div></div>');
					$debugger.anycontent({'data':{}, 'templateID':'debuggerTemplate'});
					app.ext.entomologist.vars.$debugger = $debugger;
					
					$debugger.dialog({'title':'Entomology Lab'});
					}
								
				app.ext.entomologist.u.updateProdDumperList();
				app.ext.entomologist.u.updateCatDumperList();
				
				
				return "Opening Entomology Lab...";
				}
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {

			}, //renderFormats

////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			updateProdDumperList : function($context){
				var $prodDumperList = $('[data-debug="prodDumperList"]', $context);
				for(var index in app.data){
					if(index.indexOf('appProductGet') >= 0){
						app.u.dump(index);
						var $listing = $('<div />').anycontent({'data':app.data[index], 'templateID':'prodDumperTemplate'});
						$prodDumperList.append($listing);
						}
					}
				},
			updateCatDumperList : function($context){
				var $catDumperList = $('[data-debug="catDumperList"]', $context);
				for(var index in app.data){
					if(index.indexOf('appNavcatDetail') >= 0){
						var $listing = $('<div />').anycontent({'data':app.data[index], 'templateID':'catDumperTemplate'});
						$catDumperList.append($listing);
						}
					}
				},
			dumpData : function(datapointer){
				if(app.data[datapointer]){
					app.u.dump("Data for "+datapointer+":");
					app.u.dump(app.data[datapointer]);
					}
				else {
					app.u.dump("-> Error: app.ext.entomologist.u.dumpData could not find data for "+datapointer);
					}
				}
			}, //u [utilities]

		e : {
			
			} //e [app Events]
		} //r object.
	return r;
	}