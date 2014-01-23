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

var acreate = function() {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		vars : {
			services : ['facebook','google','linkedin','twitter']
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
	
					}
				},
	//executed when the extension loads
			initExtension : {
				onSuccess : function()	{
					app.u.dump('BEGIN lookup.initExtension.onSuccess ');
					//the zoovy branding is in place by default. override if on anycommerce.com OR if an anycommerce URI param is present (for debugging)
// ## TODO -> need a better way to handle Zoovy vs non-zoovy content.
					if(document.domain && document.domain.toLowerCase().indexOf('anycommerce') > -1)	{
						app.u.dump(" -> Treat as anycommerce");
						$('.logo img').attr('src','app-admin/images/anycommerce_logo-173x30.png');
						$('body').addClass('isAnyCommerce');
						}
					else	{
						app.u.dump(" -> Treat as zoovy");
						$('body').addClass('isZoovy'); //displays all the Zoovy only content (will remain hidden for anyCommerce)
						}
					app.u.handleButtons($('#loginFormContainer'));
//at first login, use DPS to set which service was used and next time, use that var to load that service first and if logged in, jump straight in. If no, load all services.
					app.ext.acreate.u.loadServices(app.model.dpsGet('acreate','service'));
					}
				} //initExtension
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
			
			loadServices : function(service)	{
				if(service)	{
					if(typeof app.ext.acreate.u[service] == 'function')	{
						app.ext.acreate.u[service](document);
						}
					else	{
						//for this app, this early in the process, we're suppressing errors as much as possible.
						app.u.dump('Attempted to load a service which does not exist: '+service,'warn');
						app.ext.acreate.u.loadServices();
						}
					}
				else	{
					var services = app.ext.acreate.vars.services; //shortcut.
					for(var i = 0, L = services.length; i < L; i += 1)	{
						app.ext.acreate.u['load_'+services[i]](document);
						}
					}
				},
// NOTE -> each service function should check to see if it's libs have already been loaded and, if so, NOT load them again.
			load_facebook : function(d){
				app.u.dump(" -> loading facebook code");
				if(typeof FB == 'object')	{}
				else	{
	
					var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
					if (d.getElementById(id)) {return;}
					js = d.createElement('script'); js.id = id; js.async = true;
					js.src = "https://connect.facebook.net/en_US/all.js";
					ref.parentNode.insertBefore(js, ref);

					window.fbAsyncInit = function() {
						FB.init({
							appId      : '717808051580347', // App ID (from jt-zoovy fb account)
							channelUrl : 'cors/channel.html', // Channel File
							status     : true, // check login status
							cookie     : true, // enable cookies to allow the server to access the session
							xfbml      : true  // parse XFBML
							});
					
					  // Here we run a very simple test of the Graph API after login is successful. 
					  // This testAPI() function is only called in those cases. 
						function testAPI() {
							console.log('Welcome!  Fetching your information.... ');
							FB.api('/me', function(response) {
								console.log('Good to see you, ' + response.name + '.');
								});
							}
					
					// Here we subscribe to the auth.authResponseChange JavaScript event. This event is fired
					// for any authentication related change, such as login, logout or session refresh. This means that
					// whenever someone who was previously logged out tries to log in again, the correct case below 
					// will be handled. 
						FB.Event.subscribe('auth.authResponseChange', function(response) {
					// Here we specify what we do with the response anytime this event occurs. 
							if(response.status === 'connected') {
								console.log(" -> user is logged into the app");
					// The response object is returned with a status field that lets the app know the current
					// login status of the person. In this case, we're handling the situation where they 
					// have logged in to the app.
								testAPI();
								}
							else if (response.status === 'not_authorized') {
								console.log(" -> user is logged into FB but NOT the app");
					// In this case, the person is logged into Facebook, but not into the app, so we call
					// FB.login() to prompt them to do so. 
					// In real-life usage, you wouldn't want to immediately prompt someone to login 
					// like this, for two reasons:
					// (1) JavaScript created popup windows are blocked by most browsers unless they 
					// result from direct interaction from people using the app (such as a mouse click)
					// (2) it is a bad experience to be continually prompted to login upon page load.
								FB.login(function(response){
									console.log(" -> here's the response from the login"); console.dir(response);
									},{scope:'email'});
								}
							else {
								console.log(" -> user is NOT logged into FB OR the app");
					// In this case, the person is not logged into Facebook, so we call the login() 
					// function to prompt them to do so. Note that at this stage there is no indication
					// of whether they are logged into the app. If they aren't then they'll see the Login
					// dialog right after they log in to Facebook. 
					// The same caveats as above apply to the FB.login() call here.
								FB.login(function(response){
									console.log(" -> here's the response from the login"); console.dir(response);
									},{scope:'email'});
								}
							});
						}
				
					}
				},
			
			load_google : function(d)	{
				
				if(typeof gapi == 'object')	{} //google+ code already loaded.
				else	{
					var clientId = '286671899262.apps.googleusercontent.com'; //from billing.zoovy.com
					var apiKey = 'AIzaSyChIsIQp1hVMcdeyY-G4ySvxImu065YbBU'; //from billing.zoovy.com
					var scopes = 'https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/userinfo.email ';
					
					// Use a button to handle authentication the first time.
					window.handleClientLoad = function () {
						gapi.client.setApiKey(apiKey);
						window.setTimeout(checkAuth,1);
						}
					
					function checkAuth() {
						gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, handleAuthResult);
						}
					
					
					function handleAuthResult(authResult) {
						var authorizeButton = document.getElementById('authorize-button');
						if (authResult && !authResult.error) {
							authorizeButton.style.visibility = 'hidden';
							makeApiCall();
							}
						else {
							authorizeButton.style.visibility = '';
							authorizeButton.onclick = handleAuthClick;
							}
						}
					
					function handleAuthClick(event) {
						gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
						return false;
						}
					
					
					// Load the API and make an API call.  Display the results on the screen.
					function makeApiCall() {
						gapi.client.load('plus', 'v1', function() {
							var request = gapi.client.plus.people.get({
								'userId': 'me'
								});
							request.execute(function(resp) {
								console.log(" executed after a successful login");
								alert('user is logged in with google');
					/*
								var heading = document.createElement('h4');
								var image = document.createElement('img');
								image.src = resp.image.url;
								heading.appendChild(image);
								heading.appendChild(document.createTextNode(resp.displayName));
								document.getElementById('content').appendChild(heading);
					*/			});
							});
						}
					
					$.getScript("https://apis.google.com/js/client.js?onload=handleClientLoad");
					}
				},
			
			load_twitter : function(d){},
			
			load_linkedin : function(d){}
			
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			domainLookup : function($ele,event)	{
				event.preventDefault();
				var domain = $ele.find("[name='domain']").val();
				$('.warn',$ele).empty().remove(); //clear any previous warnings.
				if(domain)	{
					$('button').attr('disabled','disabled');
					$('.wait',$ele).show().css('display','inline-block');
					app.model.addDispatchToQ({
						'_cmd':'domainLookup',
						'domain' : domain,
						'_tag':	{
							'datapointer' : 'domainLookup',
							'callback':function(rd)	{
					
								$('.wait',$ele).hide();
								$('button').attr('disabled','').removeAttr('disabled');
								if(app.model.responseHasErrors(rd)){
									$ele.prepend("<div class='warn'>"+rd.errmsg+"</div>");
									}
								else	{
									//kewl. found a match.  now show them their logo, a link and a countdown till auto-redirect occurs.
									if(app.data[rd.datapointer].adminURL)	{
										window.location = app.data[rd.datapointer].adminURL+"?fromLookup="+app.u.epochNow(); //timestamp is passed so it can be used on landing page to determine if the user bookmarked w/ this param in the url
										}
									else	{
										$ele.prepend("<div class='warn'>We found a match on the domain, but no admin URL. Please contact your provider for assistance.</div>");
										}
									}
								}
							}
						},'mutable');
					app.model.dispatchThis('mutable');

					}
				else	{
					$ele.prepend("<div class='warn'>Please enter a domain</div>");
					}
				return false;
				}
			} //e [app Events]
		} //r object.
	return r;
	}