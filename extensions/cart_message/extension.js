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



var cart_message = function(_app) {
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
					window.cartMessagePush = _app.ext.cart_message.u.cartMessagePush; //global shortcut.
					_app.cmr = _app.cmr || [];
//					_app.u.dump(" -> _app.cmr: "); _app.u.dump(_app.cmr);
					var L = _app.cmr.length;
					
					var addCMResponse = function(id,func){
						//allow but notify if an existing response is overwritten.
						if(_app.cmr[i][0]){
							_app.u.dump("Cart Messaging Response "+_app.cmr[i][0]+" is being overwritten","warn");
							}
						_app.ext.cart_message.cmResponse[id] = func;
						}
					
					for(var i = (L-1); i >= 0; i -= 1)	{
						addCMResponse(_app.cmr[i][0],_app.cmr[i][1]);
						delete _app.cmr[i];
						}
					_app.cmr.push = addCMResponse; // all future pushes will get added immediately to the response list.
					_app.u.loadCSSFile(_app.vars.baseURL+"extensions/cart_message/styles.css","cart_messageCSS");
					_app.model.fetchNLoadTemplates(_app.vars.baseURL+'extensions/cart_message/templates.html',theseTemplates);
					//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
					r = true;
	
					return r;
					},
				onError : function()	{
	//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
	//you may or may not need it.
					_app.u.dump('BEGIN admin_orders.callbacks.init.onError');
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
							messages = _app.data[_rtag.datapointer]['@MSGS'], 
							cartID = _rtag.jqObj.data('cartid'), //shortcut.
							L = messages.length
						
						if(L > 0)	{
							var messagesDPS = _app.model.dpsGet('cartMessages',cartID) || [];
//							((_app.ext.cart_message.vars.carts[cartID].frequency - 6000) < 3000) ? _app.ext.cart_message.vars.carts[cartID].frequency=3000 : _app.ext.cart_message.vars.carts[cartID].frequency-=6000; //frequency is never less than 3000;
							_app.ext.cart_message.vars.carts[cartID].frequency = 3000; //if a message is present, increase frequency because chat is 'active'.
		
							for(var i = 0; i < L; i += 1)	{
								messages[i].init = _rtag.init || false; // will be set to true if this is executed as part of the init.
								messagesDPS.push(messages[i]);
								if(typeof _app.ext.cart_message.cmResponse[messages[i].what] == 'function')	{
									_app.ext.cart_message.cmResponse[messages[i].what](messages[i],_rtag.jqObj)
									}
								else if(typeof _app.ext.cart_message.cmResponse[messages[i].what.split('.')[0]] == 'function')	{ //what.split will check for 'view' instead of view.product. allows for a default.
									_app.ext.cart_message.cmResponse[messages[i].what.split('.')[0]](messages[i],_rtag.jqObj)
									}
								else	{
									// ### TODO -> what to do if the message type is not defined/unrecognized?
									}
								}
							_app.model.dpsSet('cartMessages',_rtag.jqObj.data('cartid'),messagesDPS);
							_app.model.dpsSet('cartMessages','lastMessageTS',_app.u.epochNow()); //record when the last message came in. used at init.
							}
						else	{
							if(_app.ext.cart_message.vars.carts[cartID])	{
								(_app.ext.cart_message.vars.carts[cartID].frequency >= 60000) ? 60000 : _app.ext.cart_message.vars.carts[cartID].frequency += 3000; //frequency is never much more than a minute.
								}
							}
//now queue up the next request.
						if(_app.ext.cart_message.vars.carts[cartID])	{
							_app.ext.cart_message.u.fetchCartMessages(_app.ext.cart_message.vars.carts[cartID].frequency,_rtag.jqObj);
							}
						
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In cart_message.callbacks.handleCartMessageListPolling, unable to ascertain cartid.","gMessage":true});
						}
					},
				onError : function(rd)	{
					if(rd.errid == 4)	{
						//this means the _cmd is not supported. not sense retrying every few seconds.
						}
					else if(rd && rd._rtag && rd._rtag.jqObj && rd._rtag.jqObj.data('cartid'))	{
						var cartID = rd._rtag.jqObj.data('cartid');
						_app.ext.cart_message.vars.carts[cartID].frequency = 10000;
						_app.ext.cart_message.u.fetchCartMessages(_app.ext.cart_message.vars.carts[cartID].frequency,rd._rtag.jqObj);
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
//in a storefront, chat.join will likely be overwritten. Most likely, you'll open a dialog w/ the cart messaging UI (or something like that).
				'chat.join' : function(message,$context)	{
					$("[data-app-role='messageInput']",$context).show();
					$("[data-app-role='messageHistory']",$context).append("<p class='chat_join'>"+message.FROM+" has joined the chat.<\/p>");
					},
				'cart.itemAppend' : function(opts,$context)	{
					$("[data-app-role='messageInput']",$context).show();
					$("[data-app-role='messageHistory']",$context).append("<p class='cart_item_append'>"+opts.FROM+" has added item "+opts.sku+" to the cart.<\/p>");
					},
				'chat.post' : function(message,$context)	{
					dump(message);
					//do not clear textarea for message input here. this gets run on the receiving side too and could clear something that was being written by the recipient of the chat.post.
					var $history = $("[data-app-role='messageHistory']",$context);
					$history.append("<p class='chat_post'><span class='from'>"+message.FROM+"<\/span> "+message.message+"<\/p>");
					$history.parent().scrollTop($history.height());
					}
				},


////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
			a : {

				showCartManager : function($target)	{
					dump("BEGIN showCartManager");
					$target.anycontent({'templateID':'adminCartManagementTemplate','data':{'carts':_app.vars.carts}});
					_app.u.addEventDelegation($target);
					$target.anyform();
					_app.u.handleButtons($target);
					_app.u.handleCommonPlugins($target);
					
					var $tbody = $("[data-app-role='cartManagementCartsTbody']",$target); //used for context below.

					for(var i = 0, L = _app.vars.carts.length; i < L; i += 1)	{
						var cartID = _app.vars.carts[i];
//						_app.u.dump("tr length: "+$("tr[data-value='"+_app.vars.carts[i]+"']",$tbody).length);
						_app.calls.cartDetail.init(cartID,{
							'callback':function(rd)	{
								$('.wait',rd.jqObj).removeClass('wait');
								if(_app.model.responseIsMissing(rd))	{
									$('#globalMessaging').anymessage({'message':rd}); //use global, not jqobj, which is a tr.
									rd._rtag.jqObj.hide();
									_app.model.removeCartFromSession(cartID);
									}
								else if(_app.model.responseHasErrors(rd))	{
									$('#globalMessaging').anymessage({'message':rd}); //use global, not jqobj, which is a tr.
									}
								else	{
									console.log(" -> thisNestedExists: "+_app.u.thisNestedExists("data."+rd.datapointer+".our.domain",_app));
									_app.callbacks.anycontent.onSuccess(rd);
									if(_app.u.thisNestedExists("data."+rd.datapointer+".our.domain",_app))	{
										var dmObj = _app.ext.admin.u.domainMatchesPartitionInFocus(_app.data[rd.datapointer].our.domain);
										if(dmObj.prt >= 0)	{
											rd.jqObj.find('td:first').append(dmObj.prt);
											if(dmObj.isMatch)	{
												$('button',rd.jqObj).button('enable');
												}
											else	{
												//wrong partition. can't edit. Carts are very partition specific.
												}
											}
										}
									else	{
										//no domain set on cart.  hhhmmm...
										rd.jqObj.find('td:first').append("<span class='toolTip' title='Unable to ascertain partition. Most likely, there is no domain for the cart. Editing the cart on a partition that it was not created on may result in unexpected behaviors.'>?</span>");
										$('button',rd.jqObj).button('enable');
										}
									}
								},
							'jqObj':$("tr[data-value='"+cartID+"']",$tbody)
							},'mutable');
						}
					_app.model.dispatchThis('mutable');
					},

//used for admin.  Presents user w/ a text input for adding a CSR code.  Will return the cart id.
				showCart2SessionDialog : function(onComplete)	{
					var $D = _app.ext.admin.i.dialogCreate({
						'title' : 'Add a cart to the session',
						'showLoading' : false
						});
					$D.addClass('smallButton').dialog('option','width',320);
					$D.append("<p class='hint'>Use either a full cart ID or a CSR code.<\/p>");
					$D.append("<input type='text' name='csr' value='' required='required' class='fullWidth marginBottom' />");
					$("<button \/>").text('Add').button().on('click',function(event){
						event.preventDefault();
						var cartCSR = $("[name='csr']",$D).val(); //can either be a cartID or a CSR code.
						if(cartCSR && cartCSR.length > 0)	{

//one of two cmds could get executed here. Regardless of which is executed, the same callback is triggered, which executed the oncomplete passed in and passes in the cart id.
						var callback = function(rd)	{
							var thisCartid = false;
							if(_app.model.responseHasErrors(rd)){
								$D.anymessage({'message':rd});
								}
							else if(_app.model.responseIsMissing(rd))	{
								$D.anymessage({'message':rd});
								}
							else	{
								thisCartid = (rd.datapointer == 'adminCSRLookup') ? _app.data[rd.datapointer].cartid : _app.data[rd.datapointer].cart.cartid
								$D.dialog('close');
								}
							if(typeof onComplete == 'function')	{
								onComplete(thisCartid);
								}
							}
							
							if(cartCSR.length == 4)	{
								//at four characters, this is most likely a CSR code.
								_app.model.addDispatchToQ({'_cmd':'adminCSRLookup','csr':$("[name='csr']",$D).val(),'_tag':	{'datapointer':'adminCSRLookup','callback':callback}},'mutable');								
								}
							else if(cartCSR.length < 4)	{
								$D.anymessage({'message':"A CSR code must be four characters.","errtype":"youerr"});
								}
							else	{
								_app.calls.cartDetail.init(cartCSR,{'callback' : callback},'mutable');
								}
							}
						else	{
							$D.anymessage({'message':"Please add a cart or csv code","errtype":"youerr"});
							}

						_app.model.dispatchThis('mutable');
						}).appendTo($D);
					$D.dialog('open');
					},

//this is the full blown interface, for once a cart ID is obtained.
				showAdminCMUI : function(cartID)	{
					if(cartID)	{
						var $UI = $("<div \/>");
						$UI.attr({'title':'CM: '+cartID,'id':'CM_'+cartID,'data-cartid':cartID});
						$UI.addClass('isCartMessengerDialog');
						$UI.anycontent({'templateID':'adminCartMessageTemplate'}).showLoading({'message':'Fetching cart detail'});
						_app.ext.cart_message.u.initCartMessenger(cartID,$("[data-app-role='cartMessenger']",$UI)); //starts the cart message polling. needs to be after the anycontent.
						$UI.dialog({
							'width' : '30%',
							'close' : function(event,ui)	{
								//log that the admin is leaving.
								_app.ext.cart_message.cmResponse['chat.exit']("The admin has left the chat.",$UI);
								_app.ext.cart_message.u.destroyCartMessenger($("[data-app-role='cartMessenger']",$(this)).data('cartid')); //kills the cart message polling
								}
							});

						$("textarea[name='message']",$UI).on('keypress',function(event){
							if (event.keyCode == 13) {
								$("[data-app-role='messageSubmitButton']",$(this).closest('form')).trigger('click');
								return false;
								}
							return true;
							});

						_app.model.addCart2Session(cartID); //update _app.vars.carts
						_app.u.handleButtons($UI);
						_app.u.addEventDelegation($UI);
						$UI.anyform();
						_app.model.destroy('cartDetail|'+cartID);
						_app.calls.cartDetail.init(cartID,{'callback':'anycontent','translateOnly':true,'jqObj':$UI,'onComplete':function(rd){
							//if no CID is set, lock the edit buyer button.
							if(_app.data[rd.datapointer].customer.cid)	{
								$("[data-app-role='cartMessengerBuyerEditButton']",$UI).button('enable').attr('title','Edit customer record');
								}
							}},'mutable');
						_app.model.dispatchThis('mutable');
						
						
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
				pollDetect : function($tag,data)	{
					if(_app.u.thisNestedExists("ext.cart_message.vars.carts."+data.value+".timeout",_app))	{
						$tag.append("<span class='ui-icon ui-icon-check'></span>")
						}
					else	{
						$tag.append('disabled'); //here for testing. ### TODO -> remove this output.
						}
					}
				}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
			u : {
				//cartMessagePush is here for doing quick, no nonsense updates to the cart message Q. no callbacks.
				//a global alias is created for this:  cartMessagePush
				//cartid and what are required. ex:  cartMessagePush(cartid,'cart.orderCreated');
				//P is optional and can support 'message' or 'vars'.
				cartMessagePush : function(cartid,what,P)	{
					P = P || {};
					if(cartid && what)	{
						P._cmd = 'cartMessagePush';
						P.what = what;
						P._cartid = cartid;
						_app.model.addDispatchToQ(P,'mutable');
						_app.model.dispatchThis('mutable');
						}
					else	{
						$("#globalMessaging").anymessage({"message":"In cartMessagePush, either cartid ["+cartid+"] or what ["+what+"] were left blank. both are required.","gMessage":true});
						dump("In cartMessagePush, either cartid ["+cartid+"] or what ["+what+"] were left blank.",'debug');
						}
					},
				
/*
to immediately fetch the messages, pass in zero as 'when'.
This intentionally does NOT reset the polling var. If that needs to be reset, set it when this function is called.
That way cartmessages can be fetched without impacting the polling time, if desired.
*/
				fetchCartMessages : function(when,$context)	{
//					_app.u.dump(" -> queued up the next cartMessages cmd");
					var cartID = $context.data('cartid');
					if(cartID)	{
						_app.ext.cart_message.vars.carts[cartID].timeout = setTimeout(function(){

							_app.model.addDispatchToQ({'_cmd':'cartMessageList','since':((_app.u.thisNestedExists("data.cartMessageList.SEQ",_app)) ? (_app.data.cartMessageList.SEQ) : 0),'_cartid':cartID,'_tag':	{'datapointer' : 'cartMessageList','callback':'handleCartMessageListPolling','extension' : 'cart_message','jqObj':$context}},'passive');
							_app.model.dispatchThis('passive');
							},when);
						}
					else	{
						$context.anymessage({"message":"In cart_message.u.fetchCartMessages, $context did not have data('cartid') set. It is required.","gMessage":true});
						}
					},

//a generic init for use on both sides of the force (buyer and admin). Any 'special' handling that is app specific should be added outside this function.
				initCartMessenger : function(cartID,$context){
					if(cartID && $context instanceof jQuery)	{
						$context.data('cartid',cartID);
						var messagesDPS = _app.model.dpsGet('cartMessages',cartID) || []; //, TS = _app.model.dpsGet('cartMessages','lastMessageTS') || 0, since = 0;
						_app.ext.cart_message.vars.carts[cartID] = {
							frequency : 7000,
							timeout : null
							}

						_app.model.addDispatchToQ({'_cmd':'cartMessageList','since':0,'_cartid':cartID,'_tag':	{
							'datapointer' : 'cartMessageList',
							'callback':'handleCartMessageListPolling',
							'extension' : 'cart_message',
							'init':true, //pass along that this was requested as part of init. That way, if a large history is imported, event types can be skipped if necessary.
							'jqObj' : $context
							}},'mutable'); //polling takes place on passive after initial call.  starts on mutable just to piggy-back w/ rest of init calls.
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In cart_message.u.initCartMessenger, either cartid ["+cartID+"] not set or $context ["+($context instanceof jQuery)+"] is not a valid jquery instance","gMessage":true});
						}
					},

//use this in an ADMIN session when a cart message session has ended.
//if used on a storefront, the cart message polling will end.
				destroyCartMessenger : function(cartID){
					if(cartID)	{
						window.clearTimeout(_app.ext.cart_message.vars.carts[cartID].timeout);
						delete _app.ext.cart_message.vars.carts[cartID];
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
			adminCartInteract : function($ele,p)	{
				//only 1 cart messenger instance can be open at a time.
				$('.isCartMessengerDialog').each(function(){
					$(this).dialog('close').dialog('destroy').intervaledEmpty();
					cartMessagePush($(this).data('cartid'),'chat.exit');
					});

				var cartid = $ele.closest("[data-cartid]").data('cartid');
				cartMessagePush(cartid,'chat.join');
				_app.ext.cart_message.a.showAdminCMUI(cartid);
				},

			adminCartRemoveFromSession : function($ele,p)	{
				_app.model.removeCartFromSession($ele.closest("[data-cartid]").data('cartid'));
				$ele.closest('tr').empty().remove();
				},
			
			adminCartAddToSession : function($ele,p)	{
				//_app.ext.cart_message.a.showAdminCMUI(_app.data[rd.datapointer].cartid);
				_app.ext.cart_message.a.showCart2SessionDialog(function(cartid){
					if(cartid)	{
						_app.model.addCart2Session(cartid);
						navigateTo('#!ext/cart_message/showCartManager');
						}
					else	{
//Error display is handled in the cart2session dialog. false WILL be returned into this function so that additional error handling can be added.
						}
					});
				},

			cartEditExec : function($ele,p)	{
				p.preventDefault();
				var cartID = $ele.closest("[data-app-role='cartMessenger']").data('cartid') || $ele.closest("[data-cartid]").data('cartid');
				if(cartID)	{
					navigateTo('#!ext/order_create/editCart',{'cartid':cartID});
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In cart_message.e.chatPostExec, unable to ascertain cartID.','gMessage':true});
					}
				},
			
			gotoProductShowChooser : function($ele,p)	{
				p.preventDefault();
				var $buttons = $("<div \/>").data('cartid',$ele.closest("[data-app-role='cartMessenger']").data('cartid')); //the data(cartid) here is used on the events for the buttons appended to this element
				$("<button \/>").text('Send to Buyer').attr('data-app-click','cart_message|gotoProductExec').button().appendTo($buttons);
//				$("<button \/>").text('Add to Cart').attr('data-app-click','order_create|cartItemAddWithChooser').button().appendTo($buttons);

				_app.ext.admin.a.showFinderInModal('CHOOSER','','',{'$buttons' : $buttons,'classname':'cartMessageChooser'});
				_app.u.addEventDelegation($buttons);
				},
			
			gotoProductExec : function($ele,p)	{
				p.preventDefault();
				var sku = $("input[name='sku']",'#chooserResultContainer').val();
				//cart id on parent set by gotoProductShowChooser
				cartMessagePush(cartid,'goto.product',{'vars':{'pid':sku},'_cartid':$ele.parent().data('cartid')});
				$('#prodFinder').anymessage({'message':'Product '+sku+' sent to buyer.','errtype':'done'});
				},

			buyerEditExec : function($ele,p)	{
				p.preventDefault();
				var cartID = $ele.closest("[data-app-role='cartMessenger']").data('cartid');
				alert('not done yet');
				// ### TODO -> finish this.
				},
			//will add a chat post to the log. Could be executed by either an admin or buyer.
			chatPostExec : function($ele,p)	{
				p.preventDefault();
				var $fieldset = $ele.closest('fieldset'), cartID = $ele.closest("[data-app-role='cartMessenger']").data('cartid');
				if(_app.u.validateForm($fieldset) && cartID)	{
					var $message = $ele.closest('fieldset').find("[name='message']");
					cartMessagePush(cartID,'chat.post',{'message':$message.val()});
					_app.ext.cart_message.u.fetchCartMessages(0,$ele.closest("[data-app-role='cartMessenger']"));
					$message.val(""); //reset textarea.
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
					_app.model.addDispatchToQ({'_cmd':'cartCSRShortcut','_cartid':cartID,'_tag':	{'datapointer' : 'cartCSRShortcut','callback':function(rd){
						if(_app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							//success content goes here.
							$("<div \/>").append("Cart Shortcut: "+_app.data[rd.datapointer].csr).dialog({'modal':true});
							}
						}}},'mutable');
					_app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In cart_message.e.cartCSRShortcutExec, unable to ascertain cartid.","gMessage":true});
					}
				}, //cartCSRLShortcutExec
			
			chatInitExec : function($ele,p)	{
				p.preventDefault();
				var cartID = $ele.closest("[data-app-role='cartMessenger']").data('cartid');
				if(cartID)	{
					cartMessagePush(cartID,'chat.join');
					_app.ext.cart_message.u.fetchCartMessages(0,$ele.closest("[data-app-role='cartMessenger']"));
					$ele.hide();
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In cart_message.e.chatInitExec, unable to ascertain cartid.","gMessage":true});
					}
				} //chatInitExec
			
			} //e [app Events]
		} //r object.
	return r;
	}