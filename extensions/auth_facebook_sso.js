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



// An extension for Facebook Single Sign On 

var auth_facebook_sso = function() {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; 
				
				app.u.loadResourceFile(['script',0,'https://connect.facebook.net/en_US/all.js', function(){
					FB.init({
						appId      : '640221622672702', // App ID
						channelUrl : '//app.sportsworldchicago.com/extensions/auth_facebook_sso_channel.html', // Channel File
						status     : true, // check login status
						cookie     : true
						});
					FB.Event.subscribe('auth.authResponseChange', function(response) {
						// Here we specify what we do with the response anytime this event occurs. 
						if (response.status === 'connected') {
							// The response object is returned with a status field that lets the app know the current
							// login status of the person. In this case, we're handling the situation where they 
							// have logged in to the app.
							app.u.dump(JSON.stringify(response));
							//testAPI();
							}
						else if (response.status === 'not_authorized') {
							// In this case, the person is logged into Facebook, but not into the app, so we call
							// FB.login() to prompt them to do so. 
							// In real-life usage, you wouldn't want to immediately prompt someone to login 
							// like this, for two reasons:
							// (1) JavaScript created popup windows are blocked by most browsers unless they 
							// result from direct interaction from people using the app (such as a mouse click)
							// (2) it is a bad experience to be continually prompted to login upon page load.
							
							//FB.login();
							}
						else {
							// In this case, the person is not logged into Facebook, so we call the login() 
							// function to prompt them to do so. Note that at this stage there is no indication
							// of whether they are logged into the app. If they aren't then they'll see the Login
							// dialog right after they log in to Facebook. 
							// The same caveats as above apply to the FB.login() call here.
							
							
							//FB.login();
							}
						});
					}]);

				r = true;

				return r;
				},
			onError : function()	{
				app.u.dump('BEGIN auth_google_sso.callbacks.init.onError');
				}
			},
		signin : {
			onSuccess : function(authResult){
				
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
				var $container = $('<div class="outer"><fb:login-button show-faces="true" width="200" max-rows="1"></fb:login-button><div>')
				$container.dialog({'modal':'true','title':'Sign in with Facebook'});
				FB.XFBML.parse($container.get(0));
				
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