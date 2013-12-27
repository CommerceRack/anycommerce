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



var cart_message = function() {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				app.u.loadCSSFile(app.vars.baseURL+"extensions/cart_message/styles.css","cart_messageCSS");
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



		handleCartMessageListPolling : {
			onSuccess : function(_rtag)	{
/*
if no message, increment frequency by 3 seconds and trigger timeout but never greater than 1 minute.
if messages 
	-> update localStorage copy of messageList. store as array. push new messages onto the end of that array.
	-> update DOM.
	-> trigger another timout at frequency - 2 seconds BUT frequency never less than 3 seconds.

jqObj -> this is the chat dialog/context, not the message history pane, because not all messages will be 'chat'.

*/
				var	messages = app.data[_rtag.datapointer]['@MSGS'], L = messages.length, messagesDPS = app.model.dpsGet('cart','messages') || [];
				
				if(L)	{
					((app.ext.myRIA.vars.polling.frequency - 6000) < 3000) ? 3000 : app.ext.myRIA.vars.polling.frequency-=6000; //frequency is never less than 3000;
					var $history = $("[data-app-role='messageHistory']",_rtag.jqObj);
					for(var i = 0; i < L; i += 1)	{
						messagesDPS.push(messages[i]);
						$history.append(messages[i].WHAT); //This will need to get run through some kind of processing function.
						}
					app.model.dpsSet('cart','messages',messagesDPS);
					}
				else	{
					(app.ext.myRIA.vars.polling.frequency >= 60000) ? 60000 : app.ext.myRIA.vars.polling.frequency += 3000; //frequency is never much more than a minute.
					}
//now queue up the next request.
				app.u.dump(" -> queued up the next cartMessages cmd");
				app.ext.myRIA.vars.polling.timeout = setTimeout(function(){
					app.model.addDispatchToQ({'_cmd':'cartMessageList','since':((messagesDPS.length) ? (messagesDPS.length - 1) : 0),'_cartid':app.model.fetchCartID(),'_tag':	{'datapointer' : 'cartMessageList','callback':'handleCartMessageListPolling','extension' : 'cart_message'}},'passive');
					app.model.dispatchThis('passive');
					},app.ext.myRIA.vars.polling.frequency);

				},
			onError : function(_rtag)	{
				app.ext.myRIA.vars.polling.frequency = 10000;
				var messagesDPS = app.model.dpsGet('cart','messages') || [];
				app.ext.myRIA.vars.polling.timeout = setTimeout(function(){
					app.model.addDispatchToQ({'_cmd':'cartMessageList','since':((messagesDPS.length) ? (messagesDPS.length - 1) : 0),'_cartid':app.model.fetchCartID(),'_tag':	{'datapointer' : 'cartMessageList','callback':'handleCartMessageListPolling','extension' : 'cart_message'}},'passive');
					app.model.dispatchThis('passive');
					},app.ext.myRIA.vars.polling.frequency);
				}
			
			},


		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
		a : {
/*
app messaging ui is a mechanism for buyers and merchants to communicate in real-time.
it also allows the merchant to update the cart, load product or categories, or a variety of other things.
the ui also helps the buyer show the merchant what they're looking at and, optionally, where they've been
 -> while it's possible to automatically send a lot of info to the merchant, please keep in mind buyer privacy.
*/
			showBuyerCMUI : function()	{
				var $ui = $('#cartMessageUI').data('cartid',app.model.fetchCartID());
				if($ui.hasClass('ui-dialog-content'))	{
					//the help interface has been opened once already.
					}
				else	{
					$ui.dialog({
						'auto-open':'false'
						});
					app.u.handleButtons($ui);
					app.u.handleCommonPlugins($ui);
					$ui.anydelegate();
					}
				$ui.dialog('open');
				}
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
			//will add a chat post to the log. Could be executed by either an admin or buyer.
			chatPostExec : function($ele,p)	{
				p.preventDefault();
				var $fieldset = $ele.closest('fieldset'), cartID = $ele.closest("[data-app-role='helpContainer']").data('cartid');
				if(app.u.validateForm($fieldset) && cartID)	{
					var message = $ele.closest('fieldset').find("[name='message']").val();
					app.model.addDispatchToQ({'_cmd':'cartMessagePush','what':'chat.post','message':message,'_cartid':cartID,'_tag':{'callback':function(rd){
						if(app.model.responseHasErrors(rd)){
							$fieldset.anymessage({'message':rd});
							}
						else	{
							$("[data-app-role='messageHistory']",$('#cartMessageUI')).append("<div class='selfMessage'>"+message+"<\/div>");
							}
						}}},'mutable');
					app.model.dispatchThis('mutable');
					}
				else	{
					//validateForm handles error display if form contents not populated.
					if(!cartID)	{
						$fieldset.anymessage({'message':'In cart_message.e.chatPostExec, unable to ascertain cartID.','gMessage':true});
						}
					} 
				}, //chatPostExec
			
			chatInitExec : function($ele,p)	{}
			
			} //e [app Events]
		} //r object.
	return r;
	}