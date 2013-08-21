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
					$debugger.on('click.refreshDebug', '[data-debug="refresh"]', function(){
						if($(this).attr('data-debug-target')){
							app.u.dump($('[data-debug="'+$(this).attr('data-debug-target')+'"]', $debugger));
							app.ext.entomologist.u.update($('[data-debug="'+$(this).attr('data-debug-target')+'"]', $debugger));
							}
						});
					$debugger.dialog({'title':'Entomology Lab'});
					}
								
				app.ext.entomologist.u.update( $('[data-debug="prodDumperList"]', $debugger));
				app.ext.entomologist.u.update( $('[data-debug="catDumperList"]', $debugger));
				
				
				return "Opening Entomology Lab...";
				}
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {

			}, //renderFormats

////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			updateList : function($target, datapointerPrefix, templateID){
				app.u.dump('BEGIN app.ext.entomologist.u.updateList');
				$target.intervaledEmpty();
				for(var index in app.data){
					if(index.indexOf(datapointerPrefix) >= 0){
						app.u.dump(index);
						var $listing = $('<div />').anycontent({'data':app.data[index], 'templateID':templateID});
						$target.append($listing);
						}
					}
				},
			updateTag : function($target, datapointer, templateID){
				app.u.dump('BEGIN app.ext.entomologist.u.updateTag');
				if(app.data[datapointer]){
					$target.intervaledEmpty().anycontent({'data':app.data[datapointer], 'templateID':templateID});
					}
				
				},
			update : function($target){
				app.u.dump('BEGIN app.ext.entomologist.u.update');
				if($target.attr('data-debug-loadsTemplate') && $target.attr('data-debug-datapointerPrefix')){
					app.u.dump('Looks like a list!');
					this.updateList($target, $target.attr('data-debug-datapointerPrefix'), $target.attr('data-debug-loadsTemplate'));
					}
				else if($target.attr('data-debug-templateID') && $target.attr('data-debug-datapointer')) {
					app.u.dump('Looks like a tag!');
					this.updateTag($target, $target.attr('data-debug-datapointer'), $target.attr('data-debug-templateID'));
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