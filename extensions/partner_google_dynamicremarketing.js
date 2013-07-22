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


/*************

This is an extension that wraps some functionality of Google Adwords' new Dynamic Remarketing
code inside an asynchronous shell for easier access.

More information on Dynamic Remarketing: https://support.google.com/adwords/answer/3103357?hl=en



*************/
//    !!! ->   TODO: replace 'username' in the line below with the merchants username.     <- !!!

var google_dynamicremarketing = function() {
	var r = {

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				
				app.rq.push(['templateFunction','productTemplate','onCompletes',function(P){
					app.ext.google_dynamicremarketing.u.trackEvent({
						"ecomm_prodid":P.pid,
						"ecomm_pagetype":"product",
						"ecomm_totalvalue":app.data["appProductGet|"+P.pid]["%attribs"]["zoovy:base_price"]
						});
					}]);
				app.rq.push(['templateFunction','cartTemplate','onCompletes',function(P){
					var prods = [];
					if(app.data.cartDetail['@ITEMS'] && app.data.cartDetail['@ITEMS'].length > 0){
						for(var index in app.data.cartDetail['@ITEMS']){
							prods.push(app.data.cartDetail['@ITEMS'][index].product);
							}
						}
					app.ext.google_dynamicremarketing.u.trackEvent({
						"ecomm_prodid":prods,
						"ecomm_pagetype":"cart",
						"ecomm_totalvalue":app.data.cartDetail.sum.order_total
						});
					}]);
				
				//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
				r = true;

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
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
			trackEvent : function(params){
				var frame = document.createElement("iframe");
				
				$(frame).addClass('displayNone');
				$('body').append(frame);
				
				frame.contentWindow.google_conversion_id = google_conversion_id;
				frame.contentWindow.google_conversion_language = google_conversion_language;
				frame.contentWindow.google_conversion_format = google_conversion_format;
				frame.contentWindow.google_conversion_color = google_conversion_color;
				frame.contentWindow.google_conversion_label = google_conversion_label;
				
				frame.contentWindow.google_tag_params = params;
				
				setTimeout(function(){
					var script = frame.contentWindow.document.createElement('script');
					script.type="text/javascript";
					script.src = "https://www.googleadservices.com/pagead/conversion.js";
					frame.contentWindow.document.body.appendChild(script);
					}, 250);
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