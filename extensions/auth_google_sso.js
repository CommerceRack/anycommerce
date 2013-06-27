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



// An extension for Google Single Sign On 

var auth_google_sso = function() {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; 
				
				app.u.loadResourceFile(['script',0,'https://apis.google.com/js/client:plusone.js']);

				r = true;

				return r;
				},
			onError : function()	{
				app.u.dump('BEGIN auth_google_sso.callbacks.init.onError');
				}
			},
		signin : {
			onSuccess : function(authResult){
				if (authResult['access_token']) {
					// Successfully authorized
					// Hide the sign-in button now that the user is authorized, for example:
					//$('#signinButton').dialog('close');
					app.u.dump(authResult);
					
					var resultObj = {};
					
					$.extend(resultObj, authResult);
					
					//app.u.dump(JSON.stringify(resultObj));
					app.u.throwMessage(app.u.successMsgObject("You have been signed in with Google+!"));
					} 
				else if (authResult['error']) {
					// There was an error.
					// Possible error codes:
					//   "access_denied" - User denied access to your app
					//   "immediate_failed" - Could not automatically log in the user
					// console.log('There was an error: ' + authResult['error']);
					}

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
				window.gplusCallback = window.gplusCallback ? window.gplusCallback : app.ext.auth_google_sso.callbacks.signin.onSuccess;
				var $container = $('<div class="outer"><div class="inner" /><div>')

				$container.dialog({'modal':'true','title':'Sign In With Google+'});
				
				gapi.signin.render($container.children().get(0), {
					clientid :'464875398878.apps.googleusercontent.com',
					callback : "gplusCallback",
					cookiepolicy : "single_host_origin",
					requestvisibleactions : "http://schemas.google.com/AddActivity",
					scope : "https://www.googleapis.com/auth/plus.login",
					approvalprompt : "force"
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