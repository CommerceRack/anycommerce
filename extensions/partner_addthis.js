/* **************************************************************

   Copyright 2011 Zoovy, Inc.

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
Adds AddThis social sharing code to the product page.

For AddThis API docs, go here: http://support.addthis.com/customer/portal/articles/381263-addthis-client-api

*** 201344 MAJOR REWRITE
*** REQUIRES QUICKSTART getDataFromInfoObj METHOD

*/

var partner_addthis = function(_app) {
	var r= {
		
		vars : {
			titlePrefix : "",
			setTitle : true,
			setDesc : true,
			
			//Adjust addthis config below.  Specs for config options can be found at:
			//http://support.addthis.com/customer/portal/articles/381263-addthis-client-api#configuration-ui
			addthis_config : {
				username : ""
				}
			},
		
		callbacks : {
			init : {
				onSuccess : function(){
					var scriptPath = (document.location.protocol == 'https:' ? 'https:' : 'http:')+'//s7.addthis.com/js/250/addthis_widget.js';
					if(_app.ext.partner_addthis.vars.addthis_config.username && _app.ext.partner_addthis.vars.addthis_config.username !== ""){
						scriptPath+= '#username='+_app.ext.partner_addthis.vars.addthis_config.username+'&domready';
						}
					else {
						scriptPath += '#domready';
						}
					_app.u.loadScript(scriptPath);
					
					//This is an example of how to add an addthis toolbox to a product page
					_app.rq.push(['templateFunction','productTemplate','onCompletes',function(infoObj){
						var $context = $(_app.u.jqSelector('#',infoObj.parentID));
						var $toolbox = $('.socialLinks', $context);
						if($toolbox.hasClass('addThisRendered')){
							//Already rendered, don't do it again.
							}
						else {
							$toolbox.addClass('addThisRendered').append(
									'<div id="socialLinks" class="addthis_toolbox addthis_default_style">'
								+		'<a class="addthis_button_preferred_1"></a>'
								+		'<a class="addthis_button_preferred_2"></a>'
								+		'<a class="addthis_button_preferred_3"></a>'
								+		'<a class="addthis_button_preferred_4"></a>'
								+		'<a class="addthis_button_compact"></a>'
								+	'</div>');
							
							_app.ext.partner_addthis.u.toolbox($toolbox, infoObj);
							}
						}]);
					return true;
				},
				onError : function() {
					_app.u.dump('BEGIN _app.ext.partner_addthis.callbacks.init.onError');
				}
			}
		},
		
	u : {
	
		toolbox : function($tags, infoObj){
			
			var call = 'toolbox';
			var target = $tags.get();
			var configObj = _app.ext.partner_addthis.vars.addthis_config;
			var sharingObj = _app.ext.partner_addthis.u.buildSharingObj(infoObj);
			
			this.callAddThis(call, target, configObj, sharingObj);
			},
		button : function($tags, infoObj){
			
			var call = 'button';
			var target = $tags.get();
			var configObj = _app.ext.partner_addthis.vars.addthis_config;
			var sharingObj = _app.ext.partner_addthis.u.buildSharingObj(infoObj);
			
			this.callAddThis(call, target, configObj, sharingObj);
			},
		counter : function($tags, infoObj){
			
			var call = 'counter';
			var target = $tags.get();
			var configObj = _app.ext.partner_addthis.vars.addthis_config;
			var sharingObj = _app.ext.partner_addthis.u.buildSharingObj(infoObj);
			
			this.callAddThis(call, target, configObj, sharingObj);
			},
		
		callAddThis : function(call, target, configObj, sharingObj, attempts){
			attempts = attempts || 0;
			if(typeof addthis !== "undefined"){
				addthis[call](target, configObj, sharingObj);
				}
			else {
				if(attempts > 40){
					_app.u.dump("ADDTHIS FAILED "+call);
					}
				else {
					setTimeout(function(){_app.ext.partner_addthis.u.callAddThis(call, target,configObj, sharingObj, attempts+1);}, 250);
					}
				}
			},
			
		buildSharingObj : function(infoObj){
			// The addThis sharing configuration specs can be found here:
			// http://support.addthis.com/customer/portal/articles/381263-addthis-client-api#configuration-sharing
			// By default only url, title, and description are supported.
			sharingObj = {
				url : (document.location.protocol === "https:" ? zGlobals.appSettings.https_app_url : zGlobals.appSettings.http_app_url)+ _app.ext.myRIA.u.buildRelativePath(infoObj),
				title : _app.ext.partner_addthis.vars.titlePrefix || "",
				description : _app.ext.partner_addthis.vars.defaultDesc || ""
				};
				
			var data = _app.ext.myRIA.u.getDataFromInfoObj(infoObj);
			switch(infoObj.pageType){
				case "product" :
					if(_app.ext.partner_addthis.vars.setTitle){
						sharingObj.title += data['%attribs']['zoovy:prod_name'];
						}
					if(_app.ext.partner_addthis.vars.setDesc){
						sharingObj.description = data['%attribs']['zoovy:prod_desc'];
						}
					break;
				case "category" :
					if(_app.ext.partner_addthis.vars.setTitle){
						sharingObj.title += data.pretty;
						}
					break;
				case "company" :
					//no custom behavior
					break;
				case "search" :
					//no custom behavior
					break;
				//The following cases should all revert to homepage
				case "customer" :
				case "cart" :
				case "checkout" :
				case "homepage" :
				default :
					sharingObj.url = (document.location.protocol === "https:" ? zGlobals.appSettings.https_app_url : zGlobals.appSettings.http_app_url);
					break;
				}
			if(sharingObj.title === ""){
				//If no title is provided in the sharing object, it will default back to the window title
				delete sharingObj.title;
				}
			if(sharingObj.description === ""){
				//This is an optional parameter, so if it was not set above, let's get rid of it.
				delete sharingObj.description
				}
			return sharingObj;
			}
		}
	}
	return r;
}