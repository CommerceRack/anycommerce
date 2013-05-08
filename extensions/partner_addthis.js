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




in index.html, set the following vars for this to work properly:

addthis_id =  #####;

*/


//Global object that will be updated before addThis code is rendered.
var addthis_share = {
	url : "",
	title : ""
};

var partner_addthis = function() {
	var r= {
		vars : {
			selector : ".socialLinks"
		},
		
		callbacks : {
			init : {
				onSuccess : function(){
					var scriptPath = (document.location.protocol == 'https:' ? 'https:' : 'http:')+'//s7.addthis.com/js/250/addthis_widget.js';
					if(typeof addthis_id !== 'undefined'){
						scriptPath+= '#pubid='+addthis_id;
					}
					app.u.loadScript(scriptPath);
					
					return true;
				},
				onError : function() {
					app.u.dump('BEGIN app.ext.partner_addthis.callbacks.init.onError');
				}
			},
			
			startExtension : {
				onSuccess : function (){
					if(app.ext.myRIA && app.ext.myRIA.template && addthis){
						app.u.dump("Loading Addthis Extension");
						app.ext.myRIA.template.productTemplate.onCompletes.push(function(P) {
							//Adds the addthis code to the container specified
							//To Customize the look and feel of the share icons, see here: http://support.addthis.com/customer/portal/articles/381238-addthis-toolbox
							//Note: this also includes using custom share icons.
							$(app.ext.partner_addthis.vars.selector, $('#productTemplate_'+app.u.makeSafeHTMLId(P.pid))).append(
									'<div id="socialLinks" class="addthis_toolbox addthis_default_style">'
								+		'<a class="addthis_button_preferred_1"></a>'
								+		'<a class="addthis_button_preferred_2"></a>'
								+		'<a class="addthis_button_preferred_3"></a>'
								+		'<a class="addthis_button_preferred_4"></a>'
								+		'<a class="addthis_button_compact"></a>'
								+	'</div>');
							
							//Set URL+title for most sharing code
							var url = zGlobals.appSettings.http_app_url+"product/"+P.pid+"/";
							addthis_share.url = url;
							addthis_share.title = app.data[P.datapointer]['%attribs']['zoovy:prod_name'];
							
							//Set URL+title for Facebook
							$('#ogURL').attr('content',url);
							$('#ogTitle').attr('content',app.data[P.datapointer]['%attribs']['zoovy:prod_name']);
							$('#ogImage').attr('content',app.u.makeImage({"name":app.data[P.datapointer]['%attribs']['zoovy:prod_image1'],"w":150,"h":150,"b":"FFFFFF","tag":0}));
							$('#ogDescription, #metaDescription').attr('content',app.data[P.datapointer]['%attribs']['zoovy:prod_desc']);
							
							//Hooks everything in
							addthis.toolbox('#socialLinks');
							});
						app.ext.myRIA.template.productTemplate.onDeparts.push(function(P) {
							$(app.ext.partner_addthis.vars.selector, $('#productTemplate_'+app.u.makeSafeHTMLId(P.pid))).empty();
						});
					} else	{
						setTimeout(function(){app.ext.partner_addthis.callbacks.startExtension.onSuccess()},250);
					}
				},
				onError : function (){
					app.u.dump('BEGIN app.ext.partner_addthis.callbacks.startExtension.onError');
				}
			}
		}
	}
	return r;
}