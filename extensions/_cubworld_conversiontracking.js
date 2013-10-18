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

var cubworld_conversiontracking = function() {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		scripts : {
			google_adwords : function(id, order){
				return	'<script language="JavaScript" type="text/javascript">'
					+		'var google_conversion_id = 1071884015;'
					+		'var google_conversion_language = "en_US";'
					+		'var google_conversion_format = "1";'
					+		'var google_conversion_color = "FFFFFF";'
					+		'var google_conversion_value = "'+order.sum.items_total+'";'
					+		'var google_conversion_label = "purchase";'
					+	'</script>'
					+	'<script language="JavaScript" src="https://www.googleadservices.com/pagead/conversion.js">'
					+	'</script>';
				}
			},


		callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
			init : {
				onSuccess : function()	{
					var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).

					//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
					r = true;

					return r;
					},
				onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
					app.u.dump('BEGIN admin_orders.callbacks.init.onError');
					}
				},
				
			startExtension : {
				onSuccess : function(){
					//add checkoutcompletes
					app.ext.orderCreate.checkoutCompletes.push(function(P){
						var order = app.data['order|'+P.orderID];
						var count = 0;
						for(tracker in app.ext.cubworld_conversiontracking.scripts){
							app.u.dump("Running conversion script: "+tracker);
							app.ext.cubworld_conversiontracking.u.addTrackingScript(tracker, app.ext.cubworld_conversiontracking.scripts[tracker](P.orderID, order), 1000 + 100*(count));
							count++;
							}
						});
					},
				onError : function(){
					app.u.dump('cubworld_conversiontracking.startExtension.onError');
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
			test : function(){
				app.ext.cubworld_conversiontracking.u.addTrackingScript("smarter", app.ext.cubworld_conversiontracking.scripts.smarter("0000",{"sum":{"items_total":"0.99","items_count":"1"}}), 1000);
				},
			addTrackingScript : function(name, script, timeout){
				app.u.dump("Appending iframe for "+name);
				app.u.dump(script);
				app.u.dump(timeout);
				
				if(window.roiScriptError)	{}
				else	{
					window.roiScriptError = app.ext.cubworld_conversiontracking.u.roiScriptError; //assigned global scope to reduce likely hood of any errors resulting in callback.
					app.u.dump(" -> typeof window.roiScriptError: "+typeof window.roiScriptError);
					}
				
				var $container = $('#conversionIFrames');
				
				if(!$container.length){
					$container = $('<div id="conversionIFrames" />');
					$container.appendTo($('body'));
					}
				
				var $iframe = $('[data-name='+name+']', $container)
				if($iframe.length){
					$iframe.remove();
				}
				$iframe = $("<iframe \/>");
				$iframe.attr({'data-name':name}).css({'display':'block','height':40,'width':40}).appendTo($container);
				
				setTimeout(function(){
					app.u.dump("Beginning delayed tracker code append for "+name);
					app.u.dump(script);
					var $iframeBody = $iframe.contents().find('body');
					var $tmp = $('<div />');
					$tmp.append(script);
					app.u.dump($tmp.html());
					
					app.u.dump("iterating");
					
					$tmp.find('script').each(function(){
						var $s = $(this);
						app.u.dump($s);
						if($s.attr('src'))	{
							app.u.dump(" -> attempting to add "+$s.attr('src')+" to head of iframe"); //this is an js include.
							//$iframeBody.append($s);
							}
						else	{
							//$iframeBody.append("<script>try{"+$s.text()+"} catch(err){window.parent.roiScriptErr('"+name+"','error: '+err);}<\/script>");
							}
						});
					},timeout);
				},
			roiScriptError : function(owner,err)	{
				app.u.dump("The script for "+owner+" Contained an error and most likely did not execute properly. (it failed the 'try').","warn");
				app.model.addDispatchToQ({
					'_cmd':'appAccidentDataRecorder',
					'owner' : owner,
					//'app' : '1pc', //if the API call logs the clientid, this won't be necessary.
					'category' : 'html:roi',
					'scripterr' : err,
					'_tag':	{
						'callback':'suppressErrors'
						}
					},'passive');
				app.model.dispatchThis('passive');
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