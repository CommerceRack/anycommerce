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
	var theseTemplates = new Array('adminCartMessageTemplate');
	var r = {

		vars : {
			"carts" : {}  //a hash where key is cartID and value is hash of 'polling' and 'timeout'. polling is how long between each request and timeout is the setTimeout (so it can be cancelled).
			},
////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



		callbacks : {
	//executed when extension is loaded. should include any validation that needs to occur.
			init : {
				onSuccess : function()	{
					var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
					app.cmr = app.cmr || [];
					var L = app.cmr.length;
					
					var addCMResponse = function(id,func){
						//allow but notify if an existing response is overwritten.
						if(app.cmr[i][0]){
							app.u.dump("Cart Messaging Response "+app.cmr[i][0]+" is being overwritten","warn");
							}
						app.ext.cart_message.cmResponse[id] = func;
						}
					
					for(var i = (L-1); i >= 0; i -= 1)	{
						addCMResponse(app.cmr[i][0],app.cmr[i][1]);
						delete app.cmr[i];
						}
					app.cmr.push = addCMResponse; // all future pushes will get added immediately to the response list.
					app.u.loadCSSFile(app.vars.baseURL+"extensions/cart_message/styles.css","cart_messageCSS");
					app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/cart_message/templates.html',theseTemplates);
					//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
					r = true;
	
					return r;
					},
				onError : function()	{
	//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
	//you may or may not need it.
					app.u.dump('BEGIN admin_orders.callbacks.init.onError');
					}
				}, //init
	
	
	
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
					if(_rtag && _rtag.jqObj && _rtag.jqObj.data('cartid'))	{
						var
							messages = app.data[_rtag.datapointer]['@MSGS'], 
							L = messages.length, 
							cartID = _rtag.jqObj.data('cartid')
							messagesDPS = app.model.dpsGet('cartMessages',cartID) || [];
						
						if(L)	{
							((app.ext.cart_message.vars.carts[cartID].frequency - 6000) < 3000) ? app.ext.cart_message.vars.carts[cartID].frequency=3000 : app.ext.cart_message.vars.carts[cartID].frequency-=6000; //frequency is never less than 3000;
		
							for(var i = 0; i < L; i += 1)	{
								messagesDPS.push(messages[i]);
								if(typeof app.ext.cart_message.cmResponse[messages[i].what] == 'function')	{
									app.ext.cart_message.cmResponse[messages[i].what](messages[i],_rtag.jqObj)
									}
								// ### TODO -> what to do if the message type is not defined/unrecognized?
								}
							app.model.dpsSet('cartMessages',_rtag.jqObj.data('cartid'),messagesDPS);
							}
						else	{
							(app.ext.cart_message.vars.carts[cartID].frequency >= 60000) ? 60000 : app.ext.cart_message.vars.carts[cartID].frequency += 3000; //frequency is never much more than a minute.
							}
//now queue up the next request.
						app.ext.cart_message.u.fetchCartMessages(app.ext.cart_message.vars.carts[cartID].frequency,_rtag.jqObj);
						
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In cart_message.callbacks.handleCartMessageListPolling, unable to ascertain cartid.","gMessage":true});
						}
					},
				onError : function(rd)	{
					if(_rtag && _rtag.jqObj && _rtag.jqObj.data('cartid'))	{
						var cartID = cartID = _rtag.jqObj.data('cartid');
						app.ext.cart_message.vars.carts[cartID].frequency = 10000;
						app.ext.cart_message.u.fetchCartMessages(app.ext.cart_message.vars.carts[cartID].frequency,rd._rtag.jqObj);
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In cart_message.callbacks.handleCartMessageListPolling, unable to ascertain cartid.","gMessage":true});
						}
					}
				} //handleCartMessageListPolling
	
			}, //callbacks

/*
the responses here are executed from handleCartMessageListPolling
The responses themselves are added by the app that loads the extension. That way, the responses are app-specific (admin responses are likely different from buyer responses).
The response ID should match the 'what' that is passed.

some defaults are present, but they can be overwritten by the app easily enough.
*/
			cmResponse : {
				'cart.change' : function(message,$context)	{
					$("[data-app-role='messageHistory']",$context).append("<p class='cart_update'><span class='from'>"+message.FROM+"<\/span> has updated the <span class='ui-icon ui-icon-cart'><\/span>.<\/p>");
					},
				'chat.exit' : function(message,$context)	{
					$("[data-app-role='messageHistory']",$context).append("<p class='chat_exit'>"+message.FROM+" has left the chat.<\/p>");
					},
				'chat.join' : function(message,$context)	{
					$("[data-app-role='messageInput']",$context).show();
					$("[data-app-role='messageHistory']",$context).append("<p class='chat_join'>"+message.FROM+" has joined the chat.<\/p>");
					},
				'chat.post' : function(message,$context)	{
					$("[data-app-role='messageHistory']",$context).append("<p class='chat_post'><span class='from'>"+message.FROM+"<\/span> "+message.message+"<\/p>");
					}

				},


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
					var $ui = $('#cartMessenger').data('cartid',app.model.fetchCartID());
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
					},

//used for admin.  Presents user w/ a text input for adding a CSR code.  Will return the cart id.
				showCSR2CartID : function()	{
					var $D = app.ext.admin.i.dialogCreate({
						'title' : 'Use CSR code to help buyer',
						'showLoading' : false
						});
					$D.addClass('smallButton').dialog('option','width',220);
					$D.append("<input type='text' name='csr' value='' size='8' required='required' />");
					$("<button \/>").text('Get Cart ID').button().on('click',function(event){
						event.preventDefault();
						app.model.addDispatchToQ({'_cmd':'adminCSRLookup','csr':$("[name='csr']",$D).val(),'_tag':	{'datapointer':'adminCSRLookup','callback':function(rd){
							if(app.model.responseHasErrors(rd)){
								$D.anymessage({'message':rd});
								}
							else if(app.model.responseIsMissing(rd))	{
								$D.anymessage({'message':rd});
								}
							else	{
								$D.dialog('close');
								app.ext.cart_message.a.showAdminCMUI(app.data[rd.datapointer].cartid);
								}
							}}},'mutable');
						app.model.dispatchThis('mutable');
						}).appendTo($D);
					$D.dialog('open');
					},

//this is the full blown interface, for once a cart ID is obtained.
				showAdminCMUI : function(cartID)	{
					if(cartID)	{
						var $UI = $("<div \/>");
						$UI.attr({'title':'CM: '+cartID,'id':'CM_'+cartID});
						$UI.anycontent({'templateID':'adminCartMessageTemplate'});
						app.ext.cart_message.u.initCartMessenger(cartID,$("[data-app-role='cartMessenger']",$UI)); //starts the cart message polling. needs to be after the anycontent.
						$UI.dialog({
							'width' : '30%',
							'close' : function(event,ui)	{
								app.ext.cart_message.u.destroyCartMessenger($("[data-app-role='cartMessenger']",$(this)).data('cartid')); //kills the cart message polling
								}
							});
						app.model.addCart2Session(cartID); //update app.vars.carts
						app.model.destroy('cartDetail|'+cartID);
						app.calls.cartDetail.init(cartID,{'callback':'anycontent','translateOnly':true,'jqObj':$UI,'onComplete':function(rd){
							$UI.anydelegate();
							//if no CID is set, lock the edit buyer button.
							if(!app.data[rd.datapointer].customer.cid)	{
								$("[data-app-role='cartMessengerBuyerEditButton']",$UI).button('disable').attr('title','No customer record associated with this cart');
								}
							}},'mutable');
						app.model.dispatchThis('mutable');
						
						
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In cart_message.a.showAdminCMUI, no cart id was passed.","gMessage":true});
						}
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
/*
to immediately fetch the messages, pass in zero as 'when'.
This intentionally does NOT reset the polling var. If that needs to be reset, set it when this function is called.
That way cartmessages can be fetched without impacting the polling time, if desired.
*/
				fetchCartMessages : function(when,$context)	{
//					app.u.dump(" -> queued up the next cartMessages cmd");
					var cartID = $context.data('cartid');
					if(cartID)	{
						app.ext.cart_message.vars.carts[cartID].timeout = setTimeout(function(){
							var messagesDPS = app.model.dpsGet('cartMessages',$context.data('cartid')) || [];
							app.model.addDispatchToQ({'_cmd':'cartMessageList','since':((messagesDPS.length) ? (messagesDPS.length - 1) : 0),'_cartid':cartID,'_tag':	{'datapointer' : 'cartMessageList','callback':'handleCartMessageListPolling','extension' : 'cart_message','jqObj':$context}},'passive');
							app.model.dispatchThis('passive');
							},when);
						}
					else	{
						$context.anymessage({"message":"In cart_message.u.fetchCartMessages, $context did not have data('cartid') set. It is required.","gMessage":true});
						}
					},
				
				initCartMessenger : function(cartID,$context){
					if(cartID && $context instanceof jQuery)	{
						$context.data('cartid',cartID);
						var messagesDPS = app.model.dpsGet('cartMessages',cartID) || [];
						app.ext.cart_message.vars.carts[cartID] = {
							frequency : 7000,
							timeout : null
							}
						app.model.addDispatchToQ({'_cmd':'cartMessageList','since':((messagesDPS.length) ? (messagesDPS.length - 1) : 0),'_cartid':cartID,'_tag':	{
							'datapointer' : 'cartMessageList',
							'callback':'handleCartMessageListPolling',
							'extension' : 'cart_message',
							'jqObj' : $context
							}},'mutable'); //polling takes place on passive after initial call.  starts on mutable just to piggy-back w/ rest of init calls.
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In cart_message.u.initCartMessenger, either cartid ["+cartID+"] not set or $context ["+($context instanceof jQuery)+"] is not a valid jquery instance","gMessage":true});
						}
					},
				destroyCartMessenger : function(cartID){
					if(cartID)	{
						window.clearTimeout(app.ext.cart_message.vars.carts[cartID].timeout);
						delete app.ext.cart_message.vars.carts[cartID];
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In cart_message.u.destroyCartMessenger, cartid ["+cartID+"] not set and is required.","gMessage":true});
						}
					}
				}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			cartEditExec : function($ele,p)	{
				var cartID = $ele.closest("[data-app-role='cartMessenger']").data('cartid');
				if(cartID)	{
					navigateTo('#!cartEdit',{'cartid':cartID});
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In cart_message.e.chatPostExec, unable to ascertain cartID.','gMessage':true});
					}
				},
			buyerEditExec : function($ele,p)	{
				var cartID = $ele.closest("[data-app-role='cartMessenger']").data('cartid');
				},
			//will add a chat post to the log. Could be executed by either an admin or buyer.
			chatPostExec : function($ele,p)	{
				p.preventDefault();
				var $fieldset = $ele.closest('fieldset'), cartID = $ele.closest("[data-app-role='cartMessenger']").data('cartid');
				if(app.u.validateForm($fieldset) && cartID)	{
					var message = $ele.closest('fieldset').find("[name='message']").val();
					app.model.addDispatchToQ({'_cmd':'cartMessagePush','what':'chat.post','message':message,'_cartid':cartID},'immutable');
					app.model.dispatchThis('immutable');
					app.ext.cart_message.u.fetchCartMessages(0,$ele.closest("[data-app-role='cartMessenger']"));
					}
				else	{
					//validateForm handles error display if form contents not populated.
					if(!cartID)	{
						$fieldset.anymessage({'message':'In cart_message.e.chatPostExec, unable to ascertain cartID.','gMessage':true});
						}
					} 
				}, //chatPostExec
			
			cartCSRShortcutExec : function($ele,p)	{
				var cartID = $ele.closest("[data-app-role='cartMessenger']").data('cartid');
				if(cartID)	{
					app.model.addDispatchToQ({'_cmd':'cartCSRShortcut','_cartid':cartID,'_tag':	{'datapointer' : 'cartCSRShortcut','callback':function(rd){
						if(app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							//success content goes here.
							$("<div \/>").append("Cart ID: "+app.data[rd.datapointer].csr).dialog({'modal':true});
							}
						}}},'mutable');
					app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In cart_message.e.cartCSRShortcutExec, unable to ascertain cartid.","gMessage":true});
					}
				}, //cartCSRLShortcutExec
			
			chatInitExec : function($ele,p)	{
				p.preventDefault();
				var cartID = $ele.closest("[data-app-role='cartMessenger']").data('cartid');
				if(cartID)	{
					app.model.addDispatchToQ({'_cmd':'cartMessagePush','what':'chat.join','_cartid':cartID},'immutable');
					app.model.dispatchThis('immutable');
					app.ext.cart_message.u.fetchCartMessages(0,$ele.closest("[data-app-role='cartMessenger']"));
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In cart_message.e.cartCSRShortcutExec, unable to ascertain cartid.","gMessage":true});
					}
				} //chatInitExec
			
			} //e [app Events]
		} //r object.
	return r;
	}