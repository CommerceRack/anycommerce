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



//  

var cubworld_mobilenative = function() {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	
	vars : {},

	calls : {
		appBuyerDeviceRegistration : {
			init : function(obj,_tag)	{
				this.dispatch(obj,_tag);
				return 1;
				},
			dispatch : function(obj,_tag){
				obj._tag = _tag = _tag || {};
				obj._cmd = "appBuyerDeviceRegistration";
				app.model.addDispatchToQ(obj,'immutable');
				}
			}
		},
	
	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				if(typeof anyCommerceAndroidInterface !== "undefined"){
					app.ext.cubworld_mobilenative.vars.android = true;
					}
				//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
				r = true;

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN cubworld_mobilenative.callbacks.init.onError');
				}
			},
		
		startExtension : {
			onSuccess : function(){
				if(app.ext.cubworld_mobilenative.vars.android){
					var regID = anyCommerceAndroidInterface.getRegID();
					if(typeof regID === "undefined"){
						app.u.dump("-> mobilenative no regID present, prompting registration");
						setTimeout(app.ext.cubworld_mobilenative.u.promptAndroidRegistration, 2000);
						}
					else {
						app.u.dump("-> mobilenative regID: "+regID);
						//verify registration
						}
					}
				},
			onError : function(){
				app.u.dump('BEGIN cubworld_mobilenative.callbacks.startExtension.onError');
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
			promptAndroidRegistration : function(){
				var $regForm = $('<form class="displayNone"/>');
				$regForm.on('submit', function(){
					app.u.dump("-> mobilenative calling register");
					anyCommerceAndroidInterface.register(JSON.stringify($(this).serializeJSON()));
					$(this).dialog('close');
					return false;
					});
				$regForm.append($('<input name="email" type="text" placeholder="email address"/>'));
				
				var $submitButton = $('<button class="ui-button-text ui-button ui-state-default ui-corner-all">Register for Android Notifications</button>');
				$submitButton.on('click', function(){$regForm.submit(); return false;});
				$regForm.append($submitButton);
				
				var $skipButton = $('<button class="ui-button-text ui-button ui-state-default ui-corner-all">Skip</button>');
				$skipButton.on('click', function(){$regForm.dialog('close'); return false;});
				$regForm.append($skipButton);
				
				app.u.dump('-> mobilenative opening prompt');
				$regForm.dialog({'modal':'true', 'title':'Android Notification Registration'});
				},
			androidRegister : function(regID, deviceid, json){
				app.u.dump("-> mobilenative regID received from android: "+regID);
				var obj = JSON.parse(json);
				obj.os = "android";
				obj.registrationid = regID;
				obj.deviceid = deviceid;
				obj.verb = "create";
				var _tag = {
					'callback' : function(rd){
						if(!app.model.responseHasErrors(rd)){
							app.u.throwMessage(app.u.successMsgObject("Thank you, you have been registered for Android notifications!"));
							}
						else { 
							app.u.throwMessage(rd); 
							}
						}
					}
				app.ext.cubworld_mobilenative.calls.appBuyerDeviceRegistration.init(obj, _tag);
				app.model.dispatchThis('immutable');
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