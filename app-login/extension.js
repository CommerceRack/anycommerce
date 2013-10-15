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

var login = function() {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



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
//executed when the extension loads
		initExtension : {
			onSuccess : function()	{
				app.u.dump('BEGIN app.ext.admin.initUserInterface.onSuccess ');
				var L = app.rq.length-1;

				var uriParams = {};
				var ps = window.location.href; //param string. find a regex for this to clean it up.
				if(ps.indexOf('?') >= 1)	{
					ps = ps.split('?')[1]; //ignore everything before the first questionmark.
					if(ps.indexOf('#') == 0){} //'could' happen if uri is ...admin.html?#doSomething. no params, so do nothing.
					else	{
						if(ps.indexOf('#') >= 1)	{ps = ps.split('#')[0]} //uri params should be before the #
						uriParams = app.u.kvp2Array(ps);
						}
					}
				
				//the zoovy branding is in place by default. override if on anycommerce.com OR if an anycommerce URI param is present (for debugging)
				if(document.domain && document.domain.toLowerCase().indexOf('anycommerce') > -1)	{
					app.u.dump(" -> Treat as anycommerce");
					$('.logo img').attr('src','app-admin/images/anycommerce_logo-173x30.png');
					$('body').addClass('isAnyCommerce');
					}
				else	{
					app.u.dump(" -> Treat as zoovy");
					$('body').addClass('isZoovy'); //displays all the Zoovy only content (will remain hidden for anyCommerce)
					}
				
				
				//if user is logged in already (persistent login), take them directly to the UI. otherwise, have them log in.
				//the code for handling the support login is in the thisisanadminsession function (looking at uri)
				if(app.u.thisIsAnAdminSession())	{
					app.ext.admin.u.showHeader();
					}
				else if(uriParams.show == 'acreate')	{
					app.ext.admin.u.handleAppEvents($('#createAccountContainer'));
					$('#appPreView').css('position','relative').animate({right:($('body').width() + $("#appPreView").width() + 100)},'slow','',function(){
						$("#appPreView").hide();
						$('#createAccountContainer').css({'left':'1000px','position':'relative'}).removeClass('displayNone').animate({'left':'0'},'slow');
						});
					}
				else	{
					app.ext.admin.u.handleAppEvents($('#appLogin'));
					$('#appPreView').css('position','relative').animate({right:($('body').width() + $("#appPreView").width() + 100)},'slow','',function(){
						$("#appPreView").hide();
						$('#appLogin').css({'left':'1000px','position':'relative'}).removeClass('displayNone').animate({'left':'0'},'slow');
						});
					}
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