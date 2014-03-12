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
//CCO = Cart, Checkout and Orders. Lots of shared code across these three areas.
var cco = function(_app) {
	var r = {
		vars : {},
					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		

/*
unlike other extensions, checkout calls rarely do a 'fetchData'. The thought here is to make sure we always have the most recent data.
calls should always return the number of dispatches needed. allows for cancelling a dispatchThis if not needed.
   so in most of these, a hard return of 1 is set.

*/
	calls : {

//formerly getCheckoutDestinations
		appCheckoutDestinations : {
			init : function(cartID,_tag,Q)	{
				var r = 0;
				if(cartID)	{
					this.dispatch(cartID,_tag,Q);
					r = 1;
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In cco.calls.appCheckoutDestinations, cartID not passed and is required.","gMessage":true});
					}
				return r;
				},
			dispatch : function(cartID,_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = 'appCheckoutDestinations|'+cartID;
				_app.model.addDispatchToQ({"_cmd":"appCheckoutDestinations","_tag": _tag,"_cartid":cartID},Q || 'immutable');
				}
			}, //appCheckoutDestinations

		appPaymentMethods : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(obj._cartid)	{
//				_app.u.dump(" -> appPaymentMethods cartID: "+obj._cartid);
					this.dispatch(obj,_tag,Q); //obj could contain country (as countrycode) and order total.
					r = 1;
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In cco.calls.appPaymentMethods, obj._cartid was not passed and is required.","gMessage":true});
					}
				
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "appPaymentMethods";
				obj._tag = _tag || {};
				obj._tag.datapointer = 'appPaymentMethods|'+obj._cartid;
				_app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			}, //appPaymentMethods

		cartCouponAdd : {
			init : function(coupon,cartid,_tag,Q)	{
				_app.model.addDispatchToQ({"_cmd":"cartCouponAdd","_cartid":cartid,"coupon":coupon,"_tag" : _tag},Q || 'immutable');	
				}			
			}, //cartCouponAdd

		cartGiftcardAdd : {
			init : function(giftcard,cartid,_tag,Q)	{
				_app.model.addDispatchToQ({"_cmd":"cartGiftcardAdd","_cartid":cartid,"giftcard":giftcard,"_tag" : _tag},Q || 'immutable');
				}			
			}, //cartGiftcardAdd

//can be used to verify the items in the cart have inventory available.
		cartItemsInventoryVerify : {
			init : function(cartid,_tag,Q)	{
				var r = 0;
				if(cartid)	{
					this.dispatch(cartid,_tag,Q);
					r = 1;
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In calls.cartItemsInventoryVerify, no cartid passed.','gMessage':true});
					}
				return r;
				},
			dispatch : function(cartid,_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = "cartItemsInventoryVerify|"+cartid;
				_app.model.addDispatchToQ({"_cmd":"cartItemsInventoryVerify","_cartid":cartid,"_tag": _tag},Q || 'immutable');
				}
			}, //cartItemsInventoryVerify	

		cartItemAppend : {
			init : function(obj,_tag)	{
				var r = 0;
				if(obj && obj.sku && obj.qty && obj._cartid)	{
					obj.uuid = _app.u.guidGenerator();
					this.dispatch(obj,_tag);
					r = 1;
					}
				else	{
					$('#globalMessaging').anymessage({'message':'Qty ['+obj.qty+'] or SKU ['+obj.sku+'] or _cartid ['+obj._cartid+'] left blank in cartItemAppend.'});
					_app.u.dump(" -> cartItemAppend obj param follows:"); _app.u.dump(obj);
					}
				
				return r;
				},
			dispatch : function(obj,_tag){
				obj._tag = _tag;
				obj._cmd = "cartItemAppend";
				_app.model.addDispatchToQ(obj,'immutable');
				}
			}, //cartItemAppend

		cartItemUpdate : {
			init : function(vars,_tag)	{
//				_app.u.dump('BEGIN _app.calls.cartItemUpdate.');
				var r = 0;
				vars = vars || {};
				if(vars.stid && Number(vars.quantity) >= 0)	{
					r = 1;
					this.dispatch(vars,_tag);
					}
				else	{
					_app.u.throwGMessage("In cco.calls.cartItemUpdate, either stid ["+vars.stid+"] or qty ["+vars.quantity+"] not passed.");
					}
				return r;
				},
			dispatch : function(vars,_tag)	{
//				_app.u.dump(' -> adding to PDQ. callback = '+callback)
				vars._cmd = "cartItemUpdate";
				vars._tag = _tag;
				_app.model.addDispatchToQ(vars,'immutable');
				_app.ext.cco.u.nukePayPalEC(); //nuke paypal token anytime the cart is updated.
				}
			 }, //cartItemUpdate

//cmdObj - see http://www.zoovy.com/webdoc/?VERB=DOC&DOCID=51609 for details.
//Q not an option. MUST always be immutable.
		cartPaymentQ : 	{
			init : function(cmdObj,_tag)	{
//make sure id is set for inserts.
				if(cmdObj.cmd == 'insert' && !cmdObj.ID)	{cmdObj.ID = _app.model.version+_app.u.guidGenerator().substring(0,8)}
				cmdObj['_cmd'] = "cartPaymentQ";
				cmdObj['_tag'] = _tag;
				this.dispatch(cmdObj);
				return 1;
				},
			dispatch : function(cmdObj)	{
				_app.model.addDispatchToQ(cmdObj,'immutable');
				}
			}, //cartPaymentQ
			

		cartSet : {
			init : function(obj,_tag,Q)	{
//				if(obj._cartid && _app.u.thisNestedExists('ext.cart_message.vars.carts.'+obj._cartid,_app))	{
//					_app.model.addDispatchToQ({'_cmd':'cartMessagePush','what':'cart.update','_cartid':obj._cartid},'immutable');
//					}
				obj["_cmd"] = "cartSet";
				obj._tag = _tag || {};
				_app.model.addDispatchToQ(obj,Q || 'immutable');
				return 1;
				}
			}, //cartSet


//uses the cart ID, which is passed on the parent/headers.
//always immutable.
		cartOrderCreate : {
			init : function(cartID,_tag)	{
				var r = 0;
				if(cartID)	{
					r = 1;
					this.dispatch(cartID,_tag);
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In cco.calls.cartOrderCreate, no cart ID passed.","gMessage":true});
					}
				return r;
				},
			dispatch : function(cartID,_tag)	{
				_tag = _tag || {};
				_tag.datapointer = "cartOrderCreate";
				// ### FUTURE -> domain being passed here is a temporary fix until email update occurs. only gets passed on admin.
				_app.model.addDispatchToQ({'_cartid':cartID,'_cmd':'cartOrderCreate','_tag':_tag,'iama':_app.vars.passInDispatchV, 'domain' : (_app.vars.thisSessionIsAdmin ? 'www.'+_app.vars.domain : '')},'immutable');
				}
			},//cartOrderCreate


		cartPaypalSetExpressCheckout : {
			init : function(obj,_tag,Q)	{
				this.dispatch(obj,_tag,Q);
				return 1;
				},
			dispatch : function(obj,_tag,Q)	{
				obj = obj || {};
				obj._tag = _tag || {};
				var parentID = obj._tag.parentID || '';
				var extras = "";
				if(window.debug1pc)	{extras = "&sender=jcheckout&fl=checkout-"+_app.model.version+debug1pc} //set debug1pc to a,p or r in console to force this versions 1pc layout on return from paypal
				obj._cmd = "cartPaypalSetExpressCheckout";
				obj.cancelURL = (_app.vars._clientid == '1pc') ? zGlobals.appSettings.https_app_url+"c="+_app.model.fetchCartID()+"/cart.cgis?parentID="+parentID+extras : zGlobals.appSettings.https_app_url+"?_session="+_app.vars._session+"parentID="+parentID+"&cartID="+_app.model.fetchCartID()+"#cart?show=inline";
				obj.returnURL =  (_app.vars._clientid == '1pc') ? zGlobals.appSettings.https_app_url+"c="+_app.model.fetchCartID()+"/checkout.cgis?parentID="+parentID+extras : zGlobals.appSettings.https_app_url+"?_session="+_app.vars._session+"parentID="+parentID+"&cartID="+_app.model.fetchCartID()+"#checkout?show=checkout";
				
				obj._tag.datapointer = "cartPaypalSetExpressCheckout";
				
				_app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			}, //cartPaypalSetExpressCheckout	

/*

THESE STILL NEED LOVE
left them be to provide guidance later.

		 ||
		_||_
		\  /
		 \/
*/


//each time the cart changes, so does the google checkout url.
		cartGoogleCheckoutURL : {
			init : function()	{
				this.dispatch();
				return 1;
				},
			dispatch : function()	{
				_app.model.addDispatchToQ({
					"_cmd":"cartGoogleCheckoutURL",
					"analyticsdata":"", //must be set, even if blank.
					"edit_cart_url" : (_app.vars._clientid == '1pc') ? zGlobals.appSettings.https_app_url+"c="+_app.model.fetchCartID()+"/cart.cgis" : zGlobals.appSettings.https_app_url+"?cartID="+_app.model.fetchCartID()+"#cart?show=cart",
					"continue_shopping_url" : (_app.vars._clientid == '1pc') ? zGlobals.appSettings.https_app_url+"c="+_app.model.fetchCartID()+"/" : zGlobals.appSettings.https_app_url+"?cartID="+_app.model.fetchCartID(),
					'_tag':{'callback':'proceedToGoogleCheckout','extension':'cco','datapointer':'cartGoogleCheckoutURL'}
					},'immutable');
				}
			}, //cartGoogleCheckoutURL	


		cartAmazonPaymentURL : {
			init : function()	{
				this.dispatch();
				return 1;
				},
			dispatch : function()	{
				var tagObj = {'callback':'',"datapointer":"cartAmazonPaymentURL","extension":"cco"}
				_app.model.addDispatchToQ({
"_cmd":"cartAmazonPaymentURL",
"shipping":1,
"CancelUrl":zGlobals.appSettings.https_app_url+"cart.cgis?cartID="+_app.model.fetchCartID(),
"ReturnUrl":zGlobals.appSettings.https_app_url,
"YourAccountUrl": zGlobals.appSettings.https_app_url+"customer/orders/",
'_tag':tagObj},'immutable');
				}
			}

		}, //calls





					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\




	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
//no templates or significant checks should occur in this init. templates are app specific (checkout_active has different templates than checkout_passive)
		init : {
			onSuccess : function()	{
				return true; //returns false if checkout can't load due to account config conflict.
				},
			onError : function()	{
				_app.u.dump('BEGIN _app.ext.order_create.callbacks.init.error');
				//This would be reached if a templates was not defined in the view.
				}
			}, //init

//display the '%changes', but make no adjustments to the cart.
//can be used in store, but was built for admin UI where a merchant may want to oversell.
//the checkout extension has a callback for adjusting the inventory based on availability.
		adminInventoryDiscrepencyDisplay : {
			onSuccess : function(_rtag)	{
				_rtag.jqObj = _rtag.jqObj || $('#globalMessaging');
				if(!$.isEmptyObject(_app.data[_rtag.datapointer]['%changes']))	{
					var msgObj = {}
					msgObj.message = "Inventory not available (manual corrections may be needed):<ul>";
					for(var key in _app.data[_rtag.datapointer]['%changes']) {
						msgObj.message += "<li>sku: "+key+" shows only "+_app.data[rd.datapointer]['%changes'][key]+" available<\/li>";
						}
					msgObj.message += "<\/ul>";
					msgObj.persistent = true;
					msgObj.errtype = 'halt';
					_rtag.jqObj.anymessage(msgObj);
					}
				else	{
					//there were no 'changes'.
					}
				}
			},

		proceedToGoogleCheckout : {
			onSuccess : function(tagObj)	{
				_app.u.dump('BEGIN cco.callbacks.proceedToGoogleCheckout.onSuccess');
//code for tracking the google wallet payment in GA as a conversion.
				_gaq.push(function() {
					var pageTracker = _gaq._getAsyncTracker();
					setUrchinInputCode(pageTracker);
					});
//getUrchinFieldValue is defined in the ga_post.js file. It's included as part of the google analytics plugin.
				document.location= _app.data[tagObj.datapointer].URL +"&analyticsdata="+getUrchinFieldValue();
				},
			onError : function(responseData,uuid)	{
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled'); // re-enable checkout button on checkout page.
				_app.u.throwMessage(responseData,uuid);
				}
			}
		}, //callbacks

		

//Pass in an object (typically based on $form.serializeJSON) and 
//this will make sure that specific fields are populated based on tender type.
//rather than returning specific error messages (which may need to change based on where this is used, an array of which fields are missing is returned
//plus, this allows for the attribute/fields to be modified w/ css, whereas returning messages wouldn't allow for that.
//a 'false' returned means everything passed.
// ## FUTURE -> get these migrated into validateForm.
		validate : {
			
			CREDIT : function(vars)	{
				if(vars && typeof vars == 'object')	{
					var errors = new Array(); // what is returned. an array of the payment fields that are not correct.
					if(vars['payment/CC'] && _app.u.isValidCC(vars['payment/CC']))	{} else	{errors.push("payment/CC");}
					if(vars['payment/MM'] && _app.u.isValidMonth(vars['payment/MM']))	{} else {errors.push("payment/MM");}
					if(vars['payment/YY'] && _app.u.isValidCCYear(vars['payment/YY']))	{} else {errors.push("payment/YY");}
					if(!_app.vars.thisSessionIsAdmin)	{
						if(vars['payment/CV'] && vars['payment/CV'].length > 2){} else {errors.push("payment/CV")}
						}
					return (errors.length) ? errors : false;
					}
				else	{
					$('#globalMessaging').anymessage({"message":"in cco.u.validate.CREDIT, vars is empty or not an object.","gMessage":true});
					return true;
					}
				
				},
			
			ECHECK : function(vars) {
				var errors = new Array(), // what is returned. an array of the payment fields that are not correct. 
				echeckFields = new Array("EA","ER","EN","EB","ES","EI"),
				L = echeckFields.length;
				for(var i = 0; i < L; i += 1)	{
					if(vars[echeckFields[i]])	{} else {errors.push(echeckFields[i]);}
					}
				return (errors.length) ? errors : false;
				},
			
			PO : function(vars)	{
				var errors = new Array(); // what is returned. an array of the payment fields that are not correct. 
				if(vars.PO){} else	{errors.push("PO")}
				return (errors.length) ? errors : false;
				}
			
			}, //validate


		a : {
			//for a 'complete' event, add it to the $cart object returned by this function. It'll be executed after a fetch or a refresh.
			getCartAsJqObj : function(vars)	{
				vars = vars || {};
				var r; //what is returned.
				if(vars.templateID && vars.cartid)	{
					var $cart = $(_app.renderFunctions.createTemplateInstance(vars.templateID,vars));
					$cart.attr('data-template-role','cart');

//will fetch an entirely new copy of the cart from the server.
//still requires a dispatch be sent OUTSIDE this
					$cart.on('fetch.cart',function(event,P){
						var $c = $(this);
						$c.empty().showLoading({'message':'Updating cart contents'});
						_app.model.destroy('cartDetail|'+$c.data('cartid'));
						_app.calls.cartDetail.init($c.data('cartid'),{
							'callback':'tlc',
							'onComplete' : function(){
								$cart.trigger('complete',$.extend(true,{},P,event));
								},
							'templateID' : $c.data('templateid'),
							'jqObj' : $c
							},P.Q);
						});
//will update the cart based on what's in memory.
					$cart.on('refresh.cart',function(event,P){
						var $c = $(this);
						$c.intervaledEmpty();
						if($c.data('tlc'))	{$c.tlc('destroy')}
						//w/ no destroy here, refresh will use what's in memory IF it's available. If not, it will fetch the cart.
						_app.calls.cartDetail.init($c.data('cartid'),{
							'callback':'tlc',
							'onComplete' : function(){
								$cart.trigger('complete',$.extend(true,{},P,event));
								},
							'templateID' : $c.data('templateid'),
							'jqObj' : $c
							},'mutable');
						_app.model.dispatchThis('mutable');
						});
					r = $cart;
					}
				else	{
					r = $("<div>").anymessage({'message':'In cco.a.getCartAsJqObj, vars.templateID ['+vars.templateID+'] and/or vars.cartid ['+vars.cartid+'] not specified. Both are required.','gMessage':true});
					}
				
				return r;
				}
			
			},

////////////////////////////////////   						util [u]			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {

//NOTE TO SELF:
//use if/elseif for payments with special handling (cc, po, etc) and then the else should handle all the other payment types.
//that way if a new payment type is added, it's handled (as long as there's no extra inputs).
			buildPaymentQ : function($form,cartid)	{
//				_app.u.dump("BEGIN cco.u.buildPaymentQ");
				var r = false;
//				_app.u.dump(" -> payby: "+payby);
				if($form instanceof jQuery && cartid)	{
					var sfo = $form.serializeJSON() || {}, payby = sfo["want/payby"];
					if(payby)	{
						if(payby.indexOf('WALLET') == 0)	{
							_app.ext.cco.calls.cartPaymentQ.init($.extend({'cmd':'insert','_cartid':cartid},_app.ext.cco.u.getWalletByID(payby,cartid)));
							}
						else if(payby == 'CREDIT')	{
							_app.ext.cco.calls.cartPaymentQ.init({"cmd":"insert",'_cartid':cartid,"TN":"CREDIT","CC":sfo['payment/CC'],"CV":sfo['payment/CV'],"YY":sfo['payment/YY'],"MM":sfo['payment/MM']});
							}				
						else if(payby == 'PO')	{
							_app.ext.cco.calls.cartPaymentQ.init({"cmd":"insert",'_cartid':cartid,"TN":"PO","PO":sfo['payment/PO']});
							}				
						else if(payby == 'ECHECK')	{
							_app.ext.cco.calls.cartPaymentQ.init({
								"cmd":"insert",
								'_cartid':cartid,
								"TN":"ECHECK",
								"EA":sfo['payment/EA'],
								"ER":sfo['payment/ER'],
								"EN":sfo['payment/EN'],
								"EB":sfo['payment/EB'],
								"ES":sfo['payment/ES'],
								"EI":sfo['payment/EI']
								});
							}
						else	{
							_app.ext.cco.calls.cartPaymentQ.init({"cmd":"insert",'_cartid':cartid,"TN":payby });
							}
						r = true;
						}
					else	{
						//it is valid for no payby to be set. This could happen for a zero balance order.
//						$form.anymessage({'message':'In cco.u.buildPaymentQ, unable to determine payby value','gMessage':true});
						}
					}
				else	{
					$("#globalMessaging").anymessage({'message':'In cco.u.buildPaymentQ, either form was not a valid jquery instance ['+($form instanceof jQuery)+'] or no cart id ['+cartid+'] was passed.','gMessage':true});
					}
				return r;
				},


			paymentMethodsIncludesGiftcard : function(datapointer)	{
				var r = false;
				if(_app.data[datapointer] && _app.data[datapointer]['@methods'] && _app.data[datapointer]['@methods'].length)	{
					var payMethods = _app.data[datapointer]['@methods'],
					L = _app.data[datapointer]['@methods'].length;

					for(var i = 0; i < L; i += 1)	{
						if(payMethods[i].id.indexOf('GIFTCARD:') === 0)	{
							r = true;
							break;
							}
						}
					}
				else	{
					//_app.data.datapointer is empty
					}
				return r;
				},


//A simple check to make sure that all the required inputs are populated for a given address.  
//returns boolean
//this is used in checkout for pre-existing addresses, to make sure they're complete.
			verifyAddressIsComplete : function(addrObj,addressType)	{
				var r = true;
				if(typeof addrObj === 'object')	{
					if(!addrObj[addressType+'/address1'])	{r = false}
					else if(!addrObj[addressType+'/city'])	{r = false}
					else if(!addrObj[addressType+'/countrycode'])	{r = false}
					else	{}
	//we're returning boolean, so if we already a false, no need to verify further. if true, make sure postal and region are set for US
					if(r == true && addrObj[addressType+'/countrycode'] == 'US')	{
						if(!addrObj[addressType+'/postal'])	{r = false}
						else if(!addrObj[addressType+'/region'])	{r = false}
						else	{}
						}
					}
				else	{
					r = false;
					$('#globalMessaging').anymessage({'message':'In cco.u.verifyAddressIsComplete, addrObj is not an object [typeof: '+(typeof addrObj)+']','gMessage':true});
					}
				return r;
				},

//pass in either 'bill' or 'ship' to determine if any predefined addresses for that type exist.
//buyerAddressList data should already have been retrieved by the time this is executed.
			buyerHasPredefinedAddresses : function(TYPE)	{
				var r; //What is returned. TFU.  U = unknown (no TYPE)
				if(TYPE)	{
					if(_app.data.buyerAddressList && !$.isEmptyObject(_app.data.buyerAddressList['@'+TYPE]))	{r = true}
					else	{r = false}
					}
				return r;
				},

//will get the items from a cart and return them as links. used for social marketing.
			cartContentsAsLinks : function(cartid)	{
//				_app.u.dump('BEGIN cco.u.cartContentsAsLinks.');
//				_app.u.dump(' -> datapointer = '+datapointer);
				var r = "";
				if(cartid && _app.u.thisNestedExists("data.cartDetail|"+cartid+".@items",_app))	{
					var items = _app.data[datapointer]['@ITEMS'], L = items.length;
					for(var i = 0; i < L; i += 1)	{
						//if the first character of a sku is a %, then it's a coupon, not a product.
						if(items[i].sku.charAt(0) != '%')	{
							r += "http://"+_app.vars.sdomain+"/product/"+items[i].sku+"/\n";
							}
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In cco.u.cartContentsAsLinks, either cartid ['+cartid+'] not passed or the cart detail is not in memory.','gMessage':true});
					}
				return r;
				}, //cartContentsAsLinks

//This will tell if there's a paypal tender in the paymentQ. doesn't check validity or anything like that. a quick function to be used when re-rendering panels.
			thisSessionIsPayPal : function()	{
				return (this.modifyPaymentQbyTender('PAYPALEC',null,_app.model.fetchCartID())) ? true : false;
				},

//Will check the payment q for a valid paypal transaction. Used when a buyer leaves checkout and returns during the checkout init process.
//according to B, there will be only 1 paypal tender in the paymentQ.
			aValidPaypalTenderIsPresent : function()	{
//				_app.u.dump("BEGIN cco.aValidPaypalTenderIsPresent");
				return this.modifyPaymentQbyTender('PAYPALEC',function(PQI){
					return (Math.round(+new Date(PQI.TIMESTAMP)) > +new Date()) ? true : false;
					},_app.model.fetchCartID());
				},
/*
once paypalEC has been approved by paypal, a lot of form fields lock down, but the user may decide to change
payment methods or they may add something new to the cart. If they do, execute this function. It will remove the paypal params from the session/cart and the re-initiate checkout. Be sure to do an immutable dispatch after executing this if value returned is > 0.
note - dispatch isn't IN the function to give more control to developer. (you may want to execute w/ a group of updates)
*/
			nukePayPalEC : function(_tag) {
//				_app.u.dump("BEGIN cco.u.nukePayPalEC");
				_app.ext.order_create.vars['payment-pt'] = null;
				_app.ext.order_create.vars['payment-pi'] = null;
				return this.modifyPaymentQbyTender('PAYPALEC',function(PQI){
					//the delete cmd will reset want/payby to blank.
					_app.ext.cco.calls.cartPaymentQ.init({'cmd':'delete','ID':PQI.ID},_tag || {'callback':'suppressErrors'}); //This kill process should be silent.
					},_app.model.fetchCartID());
				},

//pass in a tender/TN [CASH, PAYPALEC, CREDIT] and an array of matching id's is returned.
//used for when a paypal EC payment exists and has to be removed.
//if someFunction is set then that function will get executed over each match.
//the value returned gets added to an array, which is returned by this function.
//the entire lineitem in the paymentQ is passed in to someFunction.
			modifyPaymentQbyTender : function(tender,someFunction,cartID){
//				_app.u.dump("BEGIN cco.u.modifyPaymentQbyTender");
				var inc = 0, //what is returned if someFunction not present. # of items in paymentQ affected.
				r = new Array(), //what is returned if someFunction returns anything.
				returned; //what is returned by this function.
				if(tender && cartID && _app.u.thisNestedExists("data.cartDetail|"+cartID+".@PAYMENTQ",_app))	{
					if(_app.data['cartDetail|'+cartID]['@PAYMENTQ'].length)	{
	//					_app.u.dump(" -> all vars present. tender: "+tender+" and typeof someFunction: "+typeof someFunction);
						var L = _app.data['cartDetail|'+cartID]['@PAYMENTQ'].length;
	//					_app.u.dump(" -> paymentQ.length: "+L);
						for(var i = 0; i < L; i += 1)	{
	//						_app.u.dump(" -> "+i+" TN: "+_app.data.cartDetail['@PAYMENTQ'][i].TN);
							if(_app.data['cartDetail|'+cartID]['@PAYMENTQ'][i].TN == tender)	{
								inc += 1;
								if(typeof someFunction == 'function')	{
									r.push(someFunction(_app.data['cartDetail|'+cartID]['@PAYMENTQ'][i]))
									}
								}
							}
						returned = (typeof someFunction == 'function') ? r : inc;
						}
					else	{
						returned = inc;
						} //paymentQ is empty. no error or warning.
					}
				else	{
					_app.u.dump("WARNING! getPaymentQidByTender failed because tender ["+tender+"] or cartID ["+cartID+"] not set or @PAYMENTQ does not exist.");
					}
//				_app.u.dump(" -> num tender matches: "+r);
				return returned;
				},
			
//used in admin. adminBuyerGet formats address w/ ship_ or bill_ instead of ship/ or bill/
// addrArr is is the customerGet (for either @ship or @bill). ID is the ID/Shortcut of the method selected/desired.
			getAndRegularizeAddrObjByID : function(addrArr,ID,type,regularize)	{
//				dump("BEGIN cco.u.getAndRegularizeAddrObjByID. regularize: "+regularize);
				var r = false; //what is returned.
				if(typeof addrArr == 'object' && ID && type)	{
					var address = $.extend({},addrArr[_app.ext.admin.u.getIndexInArrayByObjValue(addrArr,'_id',ID)]); //COPY array so original in memory is unaffected.
					if(regularize)	{
//						dump(" ->  got into the regularize code. if any conversions occur, they'll be listed below: ");
						for(var index in address)	{
							if(index.indexOf(type+'_') >= 0)	{
//								dump(" ---->  converting "+index+" to "+index.replace(type+'_',type+'/'));
								address[index.replace(type+'_',type+'/')] = address[index];
								delete address[index];
								}
							}
						}
					r = address;
					}
				else	{
					$('#globalMessaging').anymessage({'message':"In cco.u.getAndRegularizeAddrObjByID, id ["+ID+"] and/or type ["+type+"] not passed or addrArr not an object ["+(typeof addrArr)+"].",'gMessage':true});
					}
				return r;
				
				},
			
			getAddrObjByID : function(type,id)	{
				var r = false; //what is returned.
				if(type && id)	{
					if(_app.data.buyerAddressList && _app.data.buyerAddressList['@'+type] && _app.data.buyerAddressList['@'+type].length)	{
						var L = _app.data.buyerAddressList['@'+type].length;
						for(var i = 0; i < L; i += 1)	{
							if(_app.data.buyerAddressList['@'+type][i]._id == id)	{
								r = _app.data.buyerAddressList['@'+type][i];
								break;
								}
							else	{}//not a match. continue loop.
							}
						}
					else	{
						//addresses not available or do not exist.
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':"In cco.u.getAddrObjByID, type or id not passed.",'gMessage':true});
					}
				return r;
				},
			
			getWalletByID : function(ID,cartid)	{
				var r = false;
				var wallets;
				if(_app.u.thisIsAnAdminSession())	{
					wallets = _app.data['adminCustomerDetail|'+_app.data['cartDetail|'+cartid].customer.cid]['@WALLETS'];
					}
				else if(_app.data.buyerWalletList && _app.data.buyerWalletList['@wallets'].length)	{
					wallets = _app.data.buyerWalletList['@wallets']
					}
				else	{}

				if(wallets)	{
					var L = wallets.length;
					for(var i = 0; i < L; i += 1)	{
						if(ID == wallets[i].ID)	{
							r = wallets[i];
							break;
							}
						}
					}
				return r;
				},

//paymentID is the payment that is selected.
//data is a data object, such as cartDetail or an invoice.
//isAdmin is used to determine if additional output is included (flag as paid checkbox and some other inputs)
// SANITY -> checkout uses the required attribute for validation. do not remove!
// when switching between payment types and supplemental inputs, always REMOVE the old supplemental inputs. keeps it clean & checkout doesn't like extra vars.
			getSupplementalPaymentInputs : function(paymentID,data,isAdmin)	{
//				_app.u.dump("BEGIN control.u.getSupplementalPaymentInputs ["+paymentID+"]");
//				_app.u.dump(" -> data:"); _app.u.dump(data);
				data = data || {}
				if(paymentID)	{
					var $o = $("<div />").addClass("paybySupplemental").attr('data-app-role','supplementalPaymentInputsContainer'), //what is returned. a jquery object (ul) w/ list item for each input of any supplemental data.
					tmp = '', //tmp var used to put together string of html to append to $o
					payStatusCB = "<div><label><input type='checkbox' name='flagAsPaid' \/>Flag as paid<\/label><\/div>"
					
					if(paymentID.substr(0,7) == 'WALLET:')	{
						paymentID = 'WALLET';
						}	
					
					switch(paymentID)	{
		//for credit cards, we can't store the # or cid in local storage. Save it in memory so it is discarded on close, reload, etc
		//expiration is less of a concern
						case 'CREDIT':
	
							tmp += "<div><label>Credit Card # <input type='text' data-format-rules='CC' size='30' name='payment/CC' data-input-keyup='input-format' data-input-format='numeric' class='creditCard' value='";
							if(data['payment/CC']){tmp += data['payment/CC']}
							tmp += "' required='required' /><\/label><\/div>";
							
							tmp += "<div><label>Expiration<\/label><select name='payment/MM' class='creditCardMonthExp' required='required'><option><\/option>";
							tmp += _app.u.getCCExpMonths(data['payment/MM']);
							tmp += "<\/select>";
							tmp += "<select name='payment/YY' class='creditCardYearExp'  required='required'><option value=''><\/option>"+_app.u.getCCExpYears(data['payment/YY'])+"<\/select><\/div>";
							
							tmp += "<div><label for='payment/CV'>CVV/CID<input data-format-rules='CV' type='text' size='4' name='payment/CV' class=' creditCardCVV' data-input-format='numeric' data-input-keyup='input-format' value='";
							if(data['payment/CV']){tmp += data['payment/CV']}
							if(!_app.u.thisIsAnAdminSession())	{
								tmp += " required='required' " //merchant has option of acquiring cvv/cid.
								}
							tmp += "'  /><\/label> <span class='ui-icon ui-icon-help creditCardCVVIcon' onClick=\"$('#cvvcidHelp').dialog({'modal':true,height:400,width:550});\"></span><\/div>";
							
							if(isAdmin === true)	{
								tmp += "<div><label><input type='radio' name='VERB' value='AUTHORIZE'>Authorize<\/label><\/div>"
								tmp += "<div><label><input type='radio' name='VERB' value='CHARGE'>Charge<\/label><\/div>"
								tmp += "<div><label><input type='radio' name='VERB' value='REFUND'>Refund<\/label><\/div>"
								}
							break;
	
							case 'WALLET':
								if(isAdmin === true)	{
									tmp += "<div><label><input type='radio' name='VERB' value='AUTHORIZE'>Authorize<\/label><\/div>"
									tmp += "<div><label><input type='radio' name='VERB' value='CHARGE' checked='checked'>Charge<\/label><\/div>"
									}
								else	{$o = false;} //inputs are only present in admin interface.
							break;
		
							case 'CASH':
							case 'MO':
							case 'CHECK':
							case 'PICKUP':
	//will output a flag as paid checkbox ONLY in the admin interface.
	//if this param is passed in a store, it will do nothing.
							if(isAdmin === true)	{
								tmp += payStatusCB;
								}
							else	{$o = false;} //inputs are only present in admin interface.
							break;
		
						case 'PO':
							tmp = $("<div \/>",{'title':'PO Number'});
	
							var $input = $("<input \/>",{'type':'text','required':'required','size':30,'name':'payment/PO','placeholder':'PO Number'}).addClass('purchaseOrder');
							if(data['payment/PO'])	{$input.val(data['payment/PO'])}
							$input.appendTo(tmp);
							if(isAdmin === true)	{
								tmp.append(payStatusCB);
								}
							break;
		
						case 'ECHECK':
							var echeckFields = {
								"payment/EA" : "Account #",
								"payment/ER" : "Routing #",
								"payment/EN" : "Account Name",
								"payment/EB" : "Bank Name",
								"payment/ES" : "Bank State",
								"payment/EI" : "Check #"
								}
							tmp = $("<div \/>");
							for(var key in echeckFields) {
	//the info below is added to the pdq but not immediately dispatched because it is low priority. this could be changed if needed.
	//The field is required in checkout. if it needs to be optional elsewhere, remove the required attribute in that code base after this has rendered.
								var $input = $("<input \/>",{'type':'text','required':'required','size':30,'name':key,'placeholder':echeckFields[key].toLowerCase()}).addClass('echeck');
								if(data[key])	{$input.val(data[key])}
								$("<div \/>",{'title':echeckFields[key]}).append($input).appendTo(tmp);
								}
							break;
						default:
	//if no supplemental material is present, return false. That'll make it easy for any code executing this to know if there is additional inputs or not.
							$o = false; //return false if there is no supplemental fields
						}
					if($o)	{
						$o.append(tmp);
	//set events to save values to memory. this will ensure data repopulates as panels get reloaded in 1PC.
						$(':input',$o).each(function(){
							$(this).off('change.save').on('change.save',function(){
								data[$(this).attr('name')] = $(this).val();
								});
							});
						} //put the li contents into the ul for return.
					}
				else	{
					$o = false; //no paymentID specified. intentionally doens't display an error.
					}
				return $o;
//				_app.u.dump(" -> $o:");
//				_app.u.dump($o);
			},

//run this just prior to creating an order.
//will clean up cart object.
			sanitizeAndUpdateCart : function($form,_tag)	{
				dump("BEGIN cco.u.sanitizeAndUpdateCart");
				if($form instanceof jQuery)	{
					_tag = _tag || {};
					var formObj = $form.serializeJSON({cb:true});
//					dump(" -> formObj: "); dump(formObj);
//po number is used for purchase order payment method, but also allowed for a reference number (if company set and po not payment method).
					if(_app.ext.order_create.vars['want/payby'] != "PO" && formObj['want/reference_number'])	{
						formObj['want/po_number'] = formObj['want/reference_number'];
						}
// to save from bill to bill, pass bill,bill. to save from bill to ship, pass bill,ship
					var populateAddressFromShortcut = function(fromAddr,toAddr)	{
						dump(" -> populateAddressFromShortcut.  from: "+fromAddr+" toAddr: "+toAddr);
						
						var addr;
						if(_app.vars.thisSessionIsAdmin)	{
							var cartID = $form.closest("[data-app-role='checkout']").data('cartid');
							addr = _app.ext.cco.u.getAndRegularizeAddrObjByID(_app.data['adminCustomerDetail|'+_app.data['cartDetail|'+cartID].customer.cid]['@'+fromAddr.toUpperCase()],formObj[fromAddr+'/shortcut'],fromAddr,true)
							}
						else	{
							addr = _app.ext.cco.u.getAddrObjByID(fromAddr,formObj[fromAddr+'/shortcut']);
							}

						for(var index in addr)	{
							if(index.indexOf(fromAddr+'/') == 0)	{ //looking for bill/ means fields like id and shortcut won't come over, which is desired behavior.
								if(fromAddr == toAddr)	{
									formObj[index] = addr[index];
									}
								else	{
									formObj[index.replace(fromAddr+'/',toAddr+'/')] = addr[index]; //when copying bill to ship, change index accordingly.
									}
								}
							}
						}

//if a shortcut is selected, save the address info into the cart.
					if(formObj['bill/shortcut'])	{
						populateAddressFromShortcut('bill','bill');
						}

//if a shortcut is selected, save the address info into the cart.
					if(formObj['ship/shortcut'])	{
						populateAddressFromShortcut('ship','ship');
						}
//if ship to billing address is enabled, copy the billing address into the shipping fields.
					else if(formObj['want/bill_to_ship'] && formObj['bill/shortcut'])	{
						populateAddressFromShortcut('bill','ship');	
						}
//bill to ship, but no short cut (not logged in)
					else if(formObj['want/bill_to_ship'])	{
						for(var index in formObj)	{
//copy billing fields into shipping. not email tho.
							if(index.indexOf('bill/') == 0 && index != 'bill/email')	{ 
								formObj[index.replace('bill/','ship/')] = formObj[index]
								}
							}
						}


//these aren't valid checkout field. used only for some logic processing.
					delete formObj['want/reference_number'];
					delete formObj['want/bill_to_ship_cb'];
//cc and cv should never go. They're added as part of cartPaymentQ
					delete formObj['payment/cc'];
					delete formObj['payment/cv'];
/* these fields are in checkout/order create but not 'supported' fields. don't send them */				
					delete formObj['giftcard'];
					delete formObj['want/bill_to_ship_cb'];
					delete formObj['want/new_password2'];
					delete formObj['coupon'];
					//the following get added to the checkout form in the admin UI
					delete formObj['sku'];	
					delete formObj['override'];	
					delete formObj['add'];	
					delete formObj['qty']; //admin UI for line item editing.	
					delete formObj['price']; //admin UI for line item editing.

					delete formObj['sum/shp_carrier']; //admin UI custom ship cost.
					delete formObj['sum/shp_method'];
					delete formObj['sum/shp_total'];
					
					_app.ext.cco.calls.cartSet.init(formObj,_tag); //adds dispatches.
					}
				else	{
					$("#globalMessaging").anymessage({"message":"In cco.u.sanitizeAndUpdateCart, $form was not a valid instance of jQuery.","gMessage":true});
					}
				}, //sanitizeAndUpdateCart


//run when a payment method is selected. updates memory and adds a class to the radio/label.
//will also display additional information based on the payment type (ex: purchase order will display PO# prompt and input)
			updatePayDetails : function($container)	{
//				_app.u.dump("BEGIN order_create.u.updatePayDetails.");
				var paymentID = $("[name='want/payby']:checked",$container).val();

				var o = '';
				$('.ui-state-active',$container).removeClass('ui-state-active ui-corner-top ui-corner-all ui-corner-bottom');
//in Admin, some of the supplemental inputs are shared between payment types (flag as paid)
//so to ensure the checkbox isn't on by accident, remove all supplemental material when switching between.
				$('.paybySupplemental', $container).empty().remove();
				var $radio = $("[name='want/payby']:checked",$container);
				
				
//				_app.u.dump(" -> $radio.length: "+$radio.length);
				var $supplementalContainer = $("[data-ui-supplemental='"+paymentID+"']",$container);
//only add the 'subcontents' once. if it has already been added, just display it (otherwise, toggling between payments will duplicate all the contents)
				if($supplementalContainer.length == 0)	{
					_app.u.dump(" -> supplemental is empty. add if needed.");
					var supplementalOutput = _app.ext.cco.u.getSupplementalPaymentInputs(paymentID,{},true); //this will either return false if no supplemental fields are required, or a jquery UL of the fields.
//					_app.u.dump("typeof supplementalOutput: "+typeof supplementalOutput);
					if(typeof supplementalOutput == 'object')	{
						$radio.parent().addClass('ui-state-active ui-corner-top'); //supplemental content will have bottom corners
//						_app.u.dump(" -> getSupplementalPaymentInputs returned an object");
						supplementalOutput.addClass('ui-widget-content ui-corner-bottom');
//save values of inputs into memory so that when panel is reloaded, values can be populated.
						$('input[type=text], select',supplementalOutput).change(function(){
							_app.ext.cco.vars[$(this).attr('name')] = $(this).val(); //use name (which coforms to cart var, not id, which is websafe and slightly different 
							})

						$radio.parent().after(supplementalOutput);
						}
					else	{
						//no supplemental material.
						$radio.parent().addClass('ui-state-active ui-corner-all');
						}
					}
				else	{
//supplemental material present and already generated once (switched back to it from another method)
					$radio.parent().addClass('ui-state-active ui-corner-top'); //supplemental content will have bottom corners
					$supplementalContainer.show();
					} //supllemental content has already been added.

				}, //updatePayDetails


/*
in an order detail, the item variations are stored as %options
in a reorder, that data needs to be converted to the variations format required by cartItemAppend.
*/

			options2Variations : function(opts)	{
				var variations = false; //what is returned. either false or an object.
				if(!$.isEmptyObject(opts))	{
					variations = {};
					for(var index in opts)	{
						variations[opts[index].id] = opts[index].v
						}
					}
				return variations;
				},

//vars.orderID is the orderID we are ordering from. - required.
//vars.cartid is the cart that the item(s) will be added to. - required.
//callback is executed as part of the cartDetail call, which is piggy backed w/ the append calls.
//skuArr is an optional param. if set, only the items in skuArr will be appended to the cart.
			appendOrderItems2Cart : function(vars,callback,skuArr)	{
//				dump("BEGIN cco.u.appendOrderItems2Cart. skuArr: "); dump(skuArr);
				vars = vars || {};
				if(vars.orderid && vars.cartid)	{
					var cmd; //the command used for the dispatch. varies based on whether this is admin or buyer.
					skuArr = skuArr || [];
					if(_app.u.thisIsAnAdminSession())	{
						cmd = 'adminOrderDetail';
						}
					else	{
						cmd = 'buyerOrderGet';
						}
					
					_app.model.addDispatchToQ({
						'_cmd':cmd,
						'orderid':vars.orderid,
						'_tag':	{
							'datapointer' : cmd+"|"+vars.orderid,
							'callback':function(rd)	{
								if(_app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									var items = (cmd == 'adminOrderDetail') ? _app.data[rd.datapointer]['@ITEMS'] : _app.data[rd.datapointer].order['@ITEMS'], L = items.length;
									for(var i = 0; i < L; i += 1)	{
										dump(i+") items[i].sku: "+items[i].sku+" and inArray: "+$.inArray(items[i].sku,skuArr));
										if(skuArr.length && $.inArray(items[i].sku,skuArr) < 0)	{
											 //skuArr is defined and this item is NOT in the array. do nothing.
											}
										else	{
											//skuArr is either not defined (append all sku's from order) OR skuArr is defined and this item is in that array. Either way, proceed w/ append.
											var appendObj = _app.ext.cco.u.buildCartItemAppendObj(items[i],vars.cartid); //will generate a new uuid.
											_app.u.dump(" -> appendObj"); _app.u.dump(appendObj);
											if(appendObj)	{
												_app.ext.cco.calls.cartItemAppend.init(appendObj,{},'immutable');
												}
											else	{
												$('#globalMessaging').anymessage({'message':'In cco.u.appendOrderItems2Cart, cco.u.buildCartItemAppendObj failed. See console for details.','gMessage':true});
												}
											}
										}
									if(L)	{
										_app.calls.cartDetail.init(vars.cartid,{'callback': (typeof callback == 'function') ? callback : ''},'immutable');
										_app.model.dispatchThis('immutable');
										}
									}
								}
							}
						},'mutable');
					_app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In cco.u.reorder, orderid ['+vars.orderid+'] and/or cartid ['+vars.cartid+'] left blank and both are required.','gMessage':true});
					}

				},

//accepts an object (probable a serialized form object) which needs sku and qty.  In an admin session, also accepts price.
//Will validate required fields and provide any necessary formatting.
//used in order_create in the admin UI for adding a line item and a re-order for previous orders.
			buildCartItemAppendObj : function(sfo,_cartid)	{
				var r = false; //what is returned. either an object or false
				if(sfo.sku && sfo.qty)	{
					if(sfo.price)	{}
					else	{delete sfo.price} //don't pass an empty price, will set price to zero. if a price is passed when not in an admin session, it'll be ignored.
					sfo.uuid = _app.u.guidGenerator();
					if(sfo['%options'])	{
						sfo['%variations'] = this.options2Variations(sfo['%options'])
						}
					if(_cartid)	{sfo._cartid = _cartid;}
					else	{sfo._cartid = _app.model.fetchCartID();}
					r = _app.u.getWhitelistedObject(sfo,['qty','%variations','price','sku','uuid','_cartid']); //whitelisted so all extra crap is dropped. ex: when %options is passed in from an existing order.
					}
				else	{
					_app.u.dump("In cco.u.buildCartItemAppendObj, both a sku ["+sfo.sku+"] and a qty ["+sfo.qty+"] are required and one was not set.",'warn'); //parent function will handle error display so that it can be case specific.
					r = false; //sku and qty are required.
					}
				return r;
				},

//cartid is required.
// vars must have qty and stid (store) or uuid (admin). in admin, vars.price is optional
			cartItemUpdate : function(cartid,vars,_tag){
				vars = vars || {};
				var r = false; //what is returned. will be true if a dispatch is added.
				if(cartid)	{
//this object that is going to be added to the dispact Q.
					var cmdObj = {
						'_cartid' : cartid,
						'_tag' : _tag || {}
						}
					
					if(_app.u.thisIsAnAdminSession())	{
						if(vars.qty && vars.uuid)	{
							r = true;
							cmdObj._cmd = 'adminCartMacro';
							cmdObj['@updates'] = ["ITEMUPDATE?"+$.param(vars)];
							}
						else	{
							$('#globalMessaging').anymessage({'message':'In cco.u.cartItemUpdate, vars.qty ['+vars.qty+'] and/or vars.uuid ['+vars.uuid+'] are blank, both of which are required in an admin session.','gMessage':true});
							}
						}
					else	{
						if(vars.quantity && vars.stid)	{
							r = true;
							cmdObj.stid = vars.stid;
							cmdObj.quantity = vars.quantity;
							cmdObj.uuid = vars.uuid;
							cmdObj._cmd = 'cartItemUpdate';							
							}
						else	{
							$('#globalMessaging').anymessage({'message':'In cco.u.cartItemUpdate, vars.quantity ['+vars.quantity+'] and/or vars.stid ['+vars.stid+'] are blank, both of which are required in an admin session.','gMessage':true});
							}
						}
					
					if(r)	{
						_app.model.addDispatchToQ(cmdObj,'immutable');
						}
					
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In cco.u.cartItemUpdate, cartid is required and was left blank.','gMessage':true});
					}
				return r;
				}, //cartItemUpdateExec




//cart must already be in memory when this is run.
//will tell you which third party checkouts are available. does NOT look to see if merchant has them enabled,
// just checks to see if the cart contents would even allow it.
//currently, there is only a google field for disabling their checkout, but this is likely to change.
			which3PCAreAvailable :	function(cartID){
	//				_app.u.dump("BEGIN control.u.which3PCAreAvailable");
					var obj = {};
					if(_app.data['cartDetail|'+cartID])	{
		//by default, everything is available
						obj = {
							paypalec : true,
							amazonpayment : true,
							googlecheckout : true
							}
						var items = _app.data['cartDetail|'+cartID]['@ITEMS'], L = items.length;
						for(var i = 0; i < L; i += 1)	{
							if(items[i]['%attribs'] && items[i]['%attribs']['gc:blocked'])	{obj.googlecheckout = false}
							if(items[i]['%attribs'] && items[i]['%attribs']['paypalec:blocked'])	{obj.paypalec = false}
							}
						}
		// cart not in memory. turn off third party checkout.
					else	{
						obj.paypalec = false;
						obj.amazonpayment = false;
						obj.googlecheckout = false;
						}
					return obj;
					} //which3PCAreAvailable
	
			}, //util






////////////////////////////////////   						renderFormats			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\







		renderFormats : {
// pass in parent data object (entire cart). need to get both the cart ID and the country that has already been selected.
			countriesasoptions : function($tag,data)	{
				var r = '';
				if(data.value.cart && data.value.cart.cartid){
					var cartid = data.value.cart.cartid;
					if(_app.data['appCheckoutDestinations|'+cartid] && _app.data['cartDetail|'+cartid] && data.bindData.shiptype)	{
						var destinations = _app.data['appCheckoutDestinations|'+cartid]['@destinations'], L = destinations.length, cartData = _app.data['cartDetail|'+cartid];
						for(var i = 0; i < L; i += 1)	{
							r += "<option value='"+destinations[i].ISO+"'>"+destinations[i].Z+"</option>";
							}
						$tag.append(r);
						$tag.val(_app.u.thisNestedExists("data.cartDetail|"+cartid+"."+data.bindData.shiptype+".countrycode",_app) ? cartData[data.bindData.shiptype].countrycode : 'US');
						}
					else if(!data.bindData.shiptype)	{
						$tag.parent().append($("<div \/>").anymessage({'persistent':true,'message':'In cco.renderFormats.countriesasoptions, data-bind rules must have a shiptype set.','gMessage':true}));
						}
					else	{
						$tag.parent().append($("<div \/>").anymessage({'persistent':true,'message':'in cco.renderFormats.countriesasoptions, _app.data[appCheckoutDestinations|'+cartid+'] or _app.data.cartDetail|'+cartid+' and both are required. is not available in memory.','gMessage':true}));
						}

					}
				},

//data.value should be the item object from the cart.
			cartitemremovebutton : function($tag,data)	{
				if(data.value.stid[0] == '%')	{$tag.remove()} //no remove button for coupons.
				else if(data.value.asm_master)	{$tag.remove()} //no remove button for assembly 'children'
				else	{
					if($tag.is('button')){$tag.button({icons: {primary: "ui-icon-closethick"},text: false})}
//					$tag.attr({'data-stid':data.value.stid}).val(0); //val is used for the updateCartQty
					}
				},

			cartitemqty : function($tag,data)	{
				$tag.val(data.value.qty);
//for coupons and assemblies, no input desired, but qty display is needed. so the qty is inserted where the input was.
				if((data.value.stid && data.value.stid[0] == '%') || data.value.asm_master)	{
					$tag.prop('disabled',true).css('border-width','0')
					} 
				else	{
					$tag.attr('data-stid',data.value.stid);
					}
				},

			paypalecbutton : function($tag,data)	{
	
				if(zGlobals.checkoutSettings.paypalCheckoutApiUser)	{
					var payObj = _app.ext.cco.u.which3PCAreAvailable();
					if(payObj.paypalec)	{
						$tag.empty().append("<img width='145' id='paypalECButton' height='42' border='0' src='"+(document.location.protocol === 'https:' ? 'https:' : 'http:')+"//www.paypal.com/en_US/i/btn/btn_xpressCheckoutsm.gif' alt='' />").addClass('pointer').off('click.paypal').on('click.paypal',function(){
							_app.ext.cco.calls.cartPaypalSetExpressCheckout.init({'getBuyerAddress':1},{'callback':function(rd){
								$('body').showLoading({'message':'Obtaining secure PayPal URL for transfer...','indicatorID':'paypalShowLoading'});
								if(_app.model.responseHasErrors(rd)){
									$(this).removeClass('disabled').attr('disabled','').removeAttr('disabled');
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									if(_app.data[rd.datapointer] && _app.data[rd.datapointer].URL)	{
										$('.ui-loading-message','#loading-indicator-paypalShowLoading').text("Transferring you to PayPal to authorize payment. See you soon!");
										document.location = _app.data[rd.datapointer].URL;
										}
									else	{
										$('#globalMessaging').anymessage({"message":"In paypalecbutton render format, dispatch to obtain paypal URL was successful, but no URL in the response.","gMessage":true});
										}
									}
								}});
							$(this).addClass('disabled').attr('disabled','disabled');
							_app.model.dispatchThis('immutable');
							});
						}
					else	{
						$tag.empty().append("<img width='145' id='paypalECButton' height='42' border='0' src='"+(document.location.protocol === 'https:' ? 'https:' : 'http:')+"//www.paypal.com/en_US/i/btn/btn_xpressCheckoutsm.gif' alt='' />").addClass('disabled').attr('disabled','disabled');
						}
					}
				else	{
					$tag.addClass('displayNone');
					}
				}, //paypalecbutton

			googlecheckoutbutton : function($tag,data)	{
	
				if(zGlobals.checkoutSettings.googleCheckoutMerchantId && (window._gat && window._gat._getTracker))	{
					var payObj = _app.ext.cco.u.which3PCAreAvailable(); //certain product can be flagged to disable googlecheckout as a payment option.
					if(payObj.googlecheckout)	{
					$tag.append("<img height=43 width=160 id='googleCheckoutButton' border=0 src='"+(document.location.protocol === 'https:' ? 'https:' : 'http:')+"//checkout.google.com/buttons/checkout.gif?merchant_id="+zGlobals.checkoutSettings.googleCheckoutMerchantId+"&w=160&h=43&style=trans&variant=text&loc=en_US' \/>").one('click',function(){
						_app.ext.cco.calls.cartGoogleCheckoutURL.init();
						$(this).addClass('disabled').attr('disabled','disabled');
						_app.model.dispatchThis('immutable');
						});
						}
					else	{
						$tag.append("<img height=43 width=160 id='googleCheckoutButton' border=0 src='"+(document.location.protocol === 'https:' ? 'https:' : 'http:')+"://checkout.google.com/buttons/checkout.gif?merchant_id="+zGlobals.checkoutSettings.googleCheckoutMerchantId+"&w=160&h=43&style=trans&variant=disable&loc=en_US' \/>")			
						}
					}
				else if(zGlobals.checkoutSettings.googleCheckoutMerchantId)	{
					_app.u.dump("zGlobals.checkoutSettings.googleCheckoutMerchantId is set, but _gaq is not defined (google analytics not loaded but required)",'warn');
					}
				else	{
					$tag.addClass('displayNone');
					}
		
				}, //googlecheckoutbutton
	


//for displaying order balance in checkout order totals.
//changes value to 0 for negative amounts. Yes, this can happen.			
			orderbalance : function($tag,data)	{
				var o = '';
				var amount = data.value;
//				_app.u.dump('BEGIN _app.renderFunctions.format.orderBalance()');
//				_app.u.dump('amount * 1 ='+amount * 1 );
//if the total is less than 0, just show 0 instead of a negative amount. zero is handled here too, just to avoid a formatMoney call.
//if the first character is a dash, it's a negative amount.  JS didn't like amount *1 (returned NAN)
				
				if(amount * 1 <= 0){
//					_app.u.dump(' -> '+amount+' <= zero ');
					o += data.bindData.currencySign ? data.bindData.currencySign : '$';
					o += '0.00';
					}
				else	{
//					_app.u.dump(' -> '+amount+' > zero ');
					o += _app.u.formatMoney(amount,data.bindData.currencySign,'',data.bindData.hideZero);
					}
				
				$tag.text("Balance due: "+o);  //update DOM.
//				_app.u.dump('END _app.renderFunctions.format.orderBalance()');
				}, //orderBalance

//displays the shipping method followed by the cost.
//is used in cart summary total during checkout.
			shipinfobyid : function($tag,data)	{
				var o = '';
				var shipMethods = data.value['@SHIPMETHODS'];
				if(shipMethods)	{
					var L = shipMethods.length;
					for(var i = 0; i < L; i += 1)	{
	//					_app.u.dump(' -> method '+i+' = '+_app.data.cartShippingMethods['@methods'][i].id);
						if(shipMethods[i].id == data.value.want.shipping_id)	{
							//sometimes pretty isn't set. also, ie didn't like .pretty, but worked fine once ['pretty'] was used.
							o = "<span class='orderShipMethod'>"+(shipMethods[i]['pretty'] ? shipMethods[i]['pretty'] : shipMethods[i]['name'])+": <\/span>";
	//only show amount if not blank.
							if(shipMethods[i].amount)	{
								o += "<span class='orderShipAmount'>"+_app.u.formatMoney(shipMethods[i].amount,' $',2,false)+"<\/span>";
								}
							break; //once we hit a match, no need to continue. at this time, only one ship method/price is available.
							}
						}
					}
				else	{
					//shipMethods is empty. this may be perfectly normal (admin UI -> new order -> no product in cart yet. store -> no zip or state.)
					}
				$tag.html(o);
				}, //shipinfobyid

			walletnameintoicon : function($tag,data)	{
				$tag.addClass('paycon_'+data.value.substring(0,4).toLowerCase());
				},
			paymentstatus : function($tag,data)        {
				if(Number(data.value[0]) === 0)        {$tag.append("Paid");}
				else{$tag.append("Unpaid")}
				},
			marketplaceorderid : function($tag,data)        {
				var order = _app.data['adminOrderDetail|'+data.value];
				var output = "";
				if(order.flow.payment_method == 'AMAZON')        {output = order.mkt.amazon_orderid}
				else if(order.flow.payment_method == 'EBAY')        {output = order.mkt.erefid.split('-')[0]}//splitting at dash shows just the ebay item #
				else if(order.flow.payment_method == 'NEWEGG')        {output = order.mkt.erefid}
				else if(order.flow.payment_method == 'BUY')        {output = order.mkt.erefid}
				else if(order.flow.payment_method == 'SEARS')        {output = order.mkt.sears_orderid}
				else{}
				$tag.append(output);
				}
			}, //renderFormats
		
		e : {
			
			cartFetchExec : function($ele,p)	{
				$ele.closest("[data-template-role='cart']").trigger('fetch',{'Q':'immutable'}); //will work if getCartAsJqObj was used to create the cart.
				_app.model.dispatchThis('immutable');
				},
			
			cartItemRemove	: function($ele,p)	{
				var stid = $ele.closest('[data-stid]').data('stid'), cartid = $ele.closest("[data-template-role='cart']").data('cartid');
				if(stid && cartid)	{
					_app.ext.cco.calls.cartItemUpdate.init({'stid':stid,'quantity':0,'_cartid':cartid},{
						'callback' : 'showMessaging',
						'message' : 'Item '+stid+' removed from your cart',
						'jqObj' : $ele.closest('form')
						},'immutable');
					$ele.closest('[data-stid]').intervaledEmpty();
					$ele.closest("[data-template-role='cart']").trigger('fetch',{'Q':'immutable'}); //will work if getCartAsJqObj was used to create the cart.
					_app.model.dispatchThis('immutable');
					}
				else	{
					$ele.closest('form').anymessage({'message':'In cco.e.cartItemRemove, unable to ascertain item STID ['+stid+'] and/or the cart id ['+cartid+'].','gMessage':true})
					}
				}, //cartItemRemove
			
			cartShipmethodSelect : function($ele,p)	{
				p.preventDefault();
				// ### TODO -> wrap this up once template on completes are ready.
				},
			//this update could get triggered by a quantity update, a button or a price change (admin).
			//$container will contain the qty and, if present, the price.
			
			
			//this can be used to update a store or admin session. the callback here is fixed and will update the cart IF the cart was generated using getCartAsJqObj
			cartItemUpdateExec : function($ele,p){
				var
					$container = $ele.closest('[data-stid]'),
					$cart = $ele.closest("[data-template-role='cart']"),
					cartid = $cart.data('cartid'),
					vars = {
						stid : $container.data('stid'),
						uuid : $container.data('uuid'),
						qty : $ele.val(), //admin wants qty.
						quantity : $ele.val() //cartItemUpdate wants quantity
						}
				if($("input[name='price']",$container).val() && _app.u.thisIsAnAdminSession())	{
					vars.price = $("input[name='price']",$container).val();
					}

				//globalMessaging is used for message display so the 'fetch' for the cart doesn't nuke the messaging.
				if(_app.ext.cco.u.cartItemUpdate(cartid,vars,{'callback' : 'showMessaging','message' : 'Item '+$container.data('stid')+ ' updated.','jqObj' : $cart}))	{
					$cart.trigger('fetch',{'Q':'immutable'}); //will work if getCartAsJqObj was used to create the cart.
					_app.model.dispatchThis('immutable');
					}
				else	{
					//cartItemUpdate will handle error display.
					}
				}, //cartItemUpdateExec
			//will post the input to the cart, passively.
			cartSetAttrib : function($ele,p)	{
				var cartid = $ele.data('cartid') || $ele.closest("[data-cartid]").data('cartid');
				if(cartid)	{
					var cmdObj = {
						_cartid : cartid
						};
					cmdObj[$ele.attr('name')] = $ele.val();
					_app.ext.cco.calls.cartSet.init(cmdObj,{},'passive'); _app.model.dispatchThis('passive');
					}
				else	{
					$("#globalMessaging").anymessage({"message":"In cco.e.cartSetAttib, unable to ascertain cart id. Be sure data-cartid is set on/above trigger element.","gMessage":true});
					}
				},

			cartZipUpdateExec : function($ele,p)	{
				_app.ext.cco.calls.cartSet.init({'ship/postal':$ele.val(), 'ship/region':'','_cartid': $ele.closest("[data-template-role='cart']").data('cartid')},{},'immutable');
				$ele.closest("[data-template-role='cart']").trigger('fetch',{'Q':'immutable'});
				_app.model.dispatchThis('immutable');
				}, //cartZipUpdateExec

			}
		
		} // r
	return r;
	}