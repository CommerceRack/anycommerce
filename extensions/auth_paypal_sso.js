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



// An extension for Paypal Single Sign On 

var auth_paypal_sso = function() {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; 
				
				app.u.loadResourceFile(['script',0,'https://www.paypalobjects.com/js/external/api.js']);

				r = true;

				return r;
				},
			onError : function()	{
				app.u.dump('BEGIN auth_google_sso.callbacks.init.onError');
				}
			},
		signin : {
			onSuccess : function(){
				

				},
			onError : function(){
				
				}
			}
		}, //callbacks

		a : {

			}, //Actions

		renderFormats : {

			}, //renderFormats

		u : {
			showSignInModal : function(){
				var $container = $('<div id="paypalLogin123" class="outer"><div>')

				$container.dialog({'modal':'true','title':'Sign In With Paypal'});
				
				paypal.use(["login"], function(login) {
					login.render ({
						"appid": "AZoSsxAcahsSiRGy5Q7fB3E_y1Uw5yiNS7fsJsxGb-3ktx3nz6re32_8dSbq",
						"scopes": "profile email address phone https://uri.paypal.com/services/paypalattributes",
						"containerid": "paypalLogin123",
						"locale": "en-us",
						"returnurl": "http://app.sportsworldchicago.com/"
					});
				});
				
				

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