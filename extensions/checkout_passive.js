/* **************************************************************

   Copyright 2011 Zoovy, Inc.

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

var convertSessionToOrder = function() {
	var r = {
	vars : {
//which fieldset is currently in focus.
		focusFieldset : '',
		containerID : '',
//used to both generate and validate the echeck fields.
		echeck : {
			"payment.ea" : "Account #",
			"payment.er" : "Routing #",
			"payment.en" : "Account Name",
			"payment.eb" : "Bank Name",
			"payment.es" : "Bank State",
			"payment.ei" : "Check #"
			},
		legends : {
			"chkoutBillAddress" : "Billing Address",
			"chkoutShipAddress" : "Shipping Address",
			"chkoutShipMethods" : "Shipping Options",
			"chkoutPayOptions" : "Payment Choices",
			"chkoutOrderNotes" : "Order Notes"
			},
//though most extensions don't have the templates specified, checkout does because so much of the code is specific to these templates.
		templates : ["myCheckoutSpec","cartSummaryTotalsSpec","checkoutSuccess","chkout-billAddressSpec","chkout-shipAddressSpec","chkout-orderNotesSpec","chkout-cartSummarySpec","chkout-shipMethodsSpec","checkout-payOptionsSpec","zCheckoutContainerSpec"]
		},

					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		

/*
unlike other extensions, checkout calls rarely do a 'fetchData'. The thought here is to make sure we always have the most recent data.
calls should always return the number of dispatches needed. allows for cancelling a dispatchThis if not needed.
   so in most of these, a hard return of 1 is set.

initially, this extension auto-executed. Later, after callbacks were added to the extension object
the startCheckout call was added, which contains the code that was auto-executed as part of the INIT callback.
a callback was also added which just executes this call, so that checkout COULD be auto-started onload.
*/
	calls : {
	
//only run this once, unless the user leaves checkout and comes back.
//if the form needs to be reloaded. use the showCheckoutForm call.
//this call doesn't actually make a call, it executes another. more recycling that way.
//this call also forces a dispatch, which is abnormal.
// #### make this an action at somepoint.
		startCheckout : {
			init : function(containerID)	{
				var r = 0;
//generates the checkout container div and FORM.
//formerly hardcoded to zContent
				myControl.ext.convertSessionToOrder.vars.containerID = containerID;
				$('#'+containerID).append(myControl.renderFunctions.createTemplateInstance('zCheckoutContainerSpec','zCheckoutContainer'));

//paypal code need to be in this startCheckout and not showCheckoutForm so that showCheckoutForm can be 
// executed w/out triggering the paypal code (which happens when payment method switches FROM paypal to some other method) because
// the paypalgetdetails cmd only needs to be executed once per session UNLESS the cart contents change.
				var token = myControl.util.getParameterByName('token');
				var payerid = myControl.util.getParameterByName('PayerID');
				if(token && payerid)	{
					r += myControl.calls.cartSet.init({'payment-pt':token,'payment-pi':payerid});
					r += myControl.ext.convertSessionToOrder.calls.cartPaypalGetExpressCheckoutDetails.init({'token':token,'payerid':payerid});
					}
				else	{
//if token and/or payerid is NOT set on URI, then this is either not yet a paypal order OR is/was paypal and user left checkout and has returned.
//need to reset paypal vars in case cart/session was manipulated.
// ### NOTE - in an all RIA environment, this isnt needed. the add to cart functions should do this. however, in a hybrid (1PC) it is needed.
					myControl.calls.cartSet.init({'payment-pt':null,'payment-pi':null}); //nuke vars
					}

//inital render is just a container, so no data is needed.
				myControl.renderFunctions.translateTemplate({},'zCheckoutContainer');

				r += myControl.ext.convertSessionToOrder.calls.showCheckoutForm.init();
				myControl.model.dispatchThis("immutable");

// even in passive, this field is needed. Can be set to zero out of the gate. API will return error if not present.
				if(myControl.sharedCheckoutUtilities.determineAuthentication() == 'authenticated')	{
					myControl.util.dump(" -> user is logged in. set account creation hidden input to 0");
					$('#chkout-create_customer').val(0);
					}

				_gaq.push(['_trackEvent','Checkout','App Event','Checkout Initiated']);

				return r; 
				}			
			},
		
		


//update will modify the cart. only run this when actually selecting a shipping method (like during checkout). heavier call.
//formerly getShippingRatesWithUpdate
		cartShippingMethodsWithUpdate : {
			init : function(callback)	{
				this.dispatch(callback);
				return 1;
				},
			dispatch : function(callback)	{
//,"trace":"1"
				myControl.model.addDispatchToQ({"_cmd":"cartShippingMethods","update":"1","_tag": {"datapointer":"cartShippingMethods","callback":callback,"extension":"convertSessionToOrder"}},'immutable');
				}
			}, //cartShippingMethodsWithUpdate


		cartAmazonPaymentParams : {
			init : function()	{
				this.dispatch();
				return 1;
				},
			dispatch : function()	{
				var tagObj = {'callback':'',"datapointer":"cartAmazonPaymentParams","extension":"convertSessionToOrder"}
				myControl.model.addDispatchToQ({
"_cmd":"cartAmazonPaymentParams",
"shipping":1,
"CancelUrl":myControl.vars.secureURL+"c="+myControl.sessionId+"/cart.cgis",
"ReturnUrl":myControl.vars.secureURL+"c="+myControl.sessionId+"/checkout.cgis?SKIPPUSHSTATE=1",
'_tag':tagObj
					},'immutable');
				}
			}, //cartAmazonPaymentParams	

//each time the cart changes, so does the google checkout url.
		cartGoogleCheckoutURL : {
			init : function()	{
				this.dispatch();
				return 1;
				},
			dispatch : function()	{
				myControl.model.addDispatchToQ({
					"_cmd":"cartGoogleCheckoutURL",
					"analyticsdata":"", //must be set, even if blank.
					"edit_cart_url" : myControl.vars.secureURL+"c="+myControl.sessionId+"/cart.cgis",
					"continue_shopping_url" : myControl.vars.secureURL+"c="+myControl.sessionId+"/",
					'_tag':{'callback':'proceedToGoogleCheckout','extension':'convertSessionToOrder','datapointer':'cartGoogleCheckoutURL'}
					},'immutable');
				}
			}, //cartGoogleCheckoutURL	




		cartPaypalSetExpressCheckout : {
			init : function()	{
				var getBuyerAddress = 0;
				if(myControl.ext.convertSessionToOrder.utilities.taxShouldGetRecalculated())
					getBuyerAddress = 1;
				this.dispatch(getBuyerAddress);
				return 1;
				},
			dispatch : function(getBuyerAddress)	{
				var tagObj = {'callback':'handleCartPaypalSetECResponse',"datapointer":"cartPaypalSetExpressCheckout","extension":"convertSessionToOrder"}
				myControl.model.addDispatchToQ({"_cmd":"cartPaypalSetExpressCheckout","cancelURL":myControl.vars.secureURL+"c="+myControl.sessionId+"/cart.cgis","returnURL":myControl.vars.secureURL+"c="+myControl.sessionId+"/checkout.cgis?SKIPPUSHSTATE=1&fl=checkout-20120416&sender=jcheckout","getBuyerAddress":getBuyerAddress,'_tag':tagObj},'immutable');
				}
			}, //cartPaypalSetExpressCheckout	

// obj.token and obj.payerid are required.
//this gets executed after a user is returned to checkout from paypal
		cartPaypalGetExpressCheckoutDetails : {
			init : function(obj)	{
//				myControl.util.dump("BEGIN convertSessionToOrder.calls.cartPaypalGetExpressCheckoutDetails.init");
//				myControl.util.dump(obj);
				this.dispatch(obj);
				return 1;
				},
			dispatch : function(obj)	{
// 'callback':'handleCartPaypalGetECDetails' - removed 20120416. the action in the callback is executed as part of loadPanelContent, if needed.
// has to be done there or it 'could' be run twice.
				var tagObj = {"datapointer":"cartPaypalGetExpressCheckoutDetails","extension":"convertSessionToOrder"};
				myControl.model.addDispatchToQ({"_cmd":"cartPaypalGetExpressCheckoutDetails","token":obj.token,"payerid":obj.payerid,"_tag":tagObj},'immutable');
				}
			}, //cartPaypalGetExpressCheckoutDetails	


//formerly getCustomerAddresses
		buyerAddressList : {
			init : function(callback)	{
				this.dispatch(callback);
				return 1;
				},
			dispatch : function(callback)	{
				myControl.model.addDispatchToQ({"_cmd":"buyerAddressList","_tag": {"datapointer":"buyerAddressList","callback":callback,"extension":"convertSessionToOrder"}},'immutable');
				}
			}, //buyerAddressList	

//formerly getCheckoutDestinations
		appCheckoutDestinations : {
			init : function(callback)	{
				this.dispatch(callback);
				return 1;
				},
			dispatch : function(callback)	{
				myControl.model.addDispatchToQ({"_cmd":"appCheckoutDestinations","_tag": {"datapointer":"appCheckoutDestinations","callback":callback,"extension":"convertSessionToOrder"}},'immutable');
				}
			}, //appCheckoutDestinations

//this particular call should only be used for checkout.  It implicitely sets the datapointer and uses cart vars for country and balance.
//payment methods for other use should use an extension specific or generic call.
//formerly getPaymentMethodsForCheckout 
		appPaymentMethods : {
			init : function(callback)	{
				this.dispatch(callback);
				return 1;
				},
			dispatch : function(callback)	{
				var total; //send blank (NOT ZERO) by default.
				var country = $('#data-bill_country').val();

				myControl.model.fetchData('cartItemsList'); //will make sure cart is loaded from localStorage (if present) if not in memory.
				if(!$.isEmptyObject(myControl.data.cartItemsList))	{
					total = myControl.data.cartItemsList.cart['data.balance_due'];
					}
				if(country != "US")	{
					// country is defaulted to the form value. If that value is NOT "US", then use it (a country has been selected).
					// if the value is US, then it may be the default setting and the request should w/ country as cart/session value
					// (country may have been set elsewhere) though the form 'should' default correctly, we don't rely on that.
					}
				else if(!$.isEmptyObject(myControl.data.cartItemsList) && myControl.data.cartItemsList['data.bill_country'])	{
					country = myControl.data.cartItemsList['data.bill_country']; //use the cart, NOT the form. the form defaults to US. Better to send blank.
					}

				myControl.model.addDispatchToQ({"_cmd":"appPaymentMethods","_tag": {"datapointer":"appPaymentMethods","callback":callback,"extension":"convertSessionToOrder"},"country":country,"ordertotal":total},'immutable');
				}
			}, //appPaymentMethods	

		getCartContents : {
			init : function(callback)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.calls.getCartContents. callback = '+callback)
				this.dispatch(callback);
				return 1;
				},
			dispatch : function(callback)	{
//				myControl.util.dump(' -> adding to PDQ. callback = '+callback)
				myControl.model.addDispatchToQ({"_cmd":"cartItemsList","_zjsid":myControl.sessionId,"_tag": {"datapointer":"cartItemsList","callback":callback,"extension":"convertSessionToOrder"}},'immutable');
				}
			},//getCartContents



//formerly addGiftcardToCart
		cartGiftcardAdd : {
			init : function(giftcard,callback)	{
				this.dispatch(giftcard,callback);
				},
			dispatch : function(giftcard,callback)	{
				myControl.model.addDispatchToQ({"_cmd":"cartGiftcardAdd","giftcard":giftcard,"_tag" : {"callback":callback,"extension":"convertSessionToOrder"}},'immutable');	
				}			
			}, //cartGiftcardAdd
//formerly addCouponToCart
		cartCouponAdd : {
			init : function(coupon,callback)	{
				this.dispatch(coupon,callback);
				},
			dispatch : function(coupon,callback)	{
				myControl.model.addDispatchToQ({"_cmd":"cartCouponAdd","coupon":coupon,"_tag" : {"callback":callback,"extension":"convertSessionToOrder"}},'immutable');	
				}			
			}, //cartCouponAdd




//used to save all the populated checkout fields to the cart. 
		saveCheckoutFields : {
			init : function(callback)	{
				this.dispatch(callback);
				return 1;
				},
			dispatch : function(callback)	{
				myControl.calls.cartSet.init($('#zCheckoutFrm').serializeJSON()); //adds dispatches.
				}
			}, //saveCheckoutFields

		showCheckoutForm : {
			init : function()	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.calls.showCheckoutForm.init');
				$('#chkoutSummaryErrors').empty(); //clear any existing global errors.
				return this.dispatch(); //at least 5 calls will be made here. maybe 6.
				},
			dispatch : function()	{
//r is set to 5 because five of these calls are fixed.
//yes, I could have done a += for each call, but since they're also a guaranteed request, just hard code this. It'll be faster and can always be changed later.
				var r = 5;  
//Do inventory check if inventory matters.
//multiple inv_mode by 1 to treat as number
				if((zGlobals.globalSettings.inv_mode * 1) > 0)	{ 
					r += myControl.ext.convertSessionToOrder.calls.cartItemsInventoryVerify.init("handleInventoryUpdate");
					}
				myControl.ext.convertSessionToOrder.calls.appPaymentMethods.init();
//only send the request for addresses if the user is logged in or the request will return an error.
				if(myControl.sharedCheckoutUtilities.determineAuthentication() == 'authenticated')	{
					myControl.ext.convertSessionToOrder.calls.buyerAddressList.init();
					}
				myControl.ext.convertSessionToOrder.calls.appCheckoutDestinations.init();
				myControl.ext.convertSessionToOrder.calls.cartShippingMethodsWithUpdate.init();
				myControl.ext.convertSessionToOrder.calls.getCartContents.init("loadPanelContent");
				return r;
				}
			}, //showCheckoutForm

//formerly createOrder
		cartOrderCreate : {
			init : function(callback)	{
//serializes just the payment panel, which is required for payment processing to occur (CC numbers can't be store anywhere, even in the session)
//seems safari doesn't like serializing a fieldset. capture individually.
//				var payObj = $('#chkoutPayOptionsFieldset').serializeJSON();
				
				this.dispatch(callback);
				return 1;

				},
			dispatch : function(callback)	{
				var payObj = {};

_gaq.push(['_trackEvent','Checkout','App Event','Attempting to create order']);
// initially, was serializing the payment panel only.  Issues here with safari.
// then, when loading .val(), field was not reliably present. 
// cc info is saved in memory so that if payment panel is reloaded, cc# is available. so that reference is used for cc and cv.
// exp alone is less valuable, so it's stored in data.cart obj and referenced there.
				payObj['payment.cc'] = myControl.ext.convertSessionToOrder.vars["payment.cc"];
				payObj['payment.cv'] = myControl.ext.convertSessionToOrder.vars["payment.cv"];
				payObj['payment.yy'] = myControl.ext.convertSessionToOrder.vars["payment.yy"];
				payObj['payment.mm'] = myControl.ext.convertSessionToOrder.vars["payment.mm"];
				payObj['_cmd'] = 'cartOrderCreate';
				payObj['_tag'] = {"callback":callback,"extension":"convertSessionToOrder","datapointer":"cartOrderCreate"}
				
//				myControl.util.dump("PayObj to follow:");
//				myControl.util.dump(payObj);

				myControl.model.addDispatchToQ(payObj,'immutable');
				}
			},//cartOrderCreate

			
/*
Run once checkout form has been filled out (or is thought to be filled out).
add all form fields to the session/cart (whether form validates or not)
 -> thought being to collect and store all that information as often as possible.
does a client-side validation of the form.
 -> if errors, they're displayed on screen as part of the individual panel validation scripts.
 -> if success, server-side validation takes place. those errors are handled in the callback (if present).
if server validation passes, the callback handles what to do next (callback is most likely "finishedValidatingCheckout")
*/
		processCheckout : {
			init : function(callback)	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.calls.processCheckout.init');

				$('#chkoutSummaryErrors').empty(); //clear any existing global errors. //blank out any existing global errors so that only new error appear.
				$('#chkoutPlaceOrderBtn').attr('disabled','disabled').addClass('ui-state-disabled loadingButtonBg'); //disable the button to avoid double-click.
//				return; //die here to test
				var checkoutIsValid = myControl.ext.convertSessionToOrder.validate.isValid();
				
			
				myControl.util.dump(' -> checkoutIsValid = '+checkoutIsValid);
//adds dispatches regardless of validation.
				var serializedCheckout = $('#zCheckoutFrm').serializeJSON()
//for security reasons, cc info is removed from cart/session update if the local validation isn't successful.
//they are saved in memory for panel updates. if a user leaves checkout and comes back, cc info will have to be re-entered.
				if(!checkoutIsValid)	{
					serializedCheckout['payment.cc'] = '';
					serializedCheckout['payment.cv'] = '';
					}
//				myControl.util.dump(' -> SANITIZED serialized checkout object: ');
//				myControl.util.dump(serializedCheckout);
				myControl.calls.cartSet.init(serializedCheckout);
				if(checkoutIsValid)	{
					this.dispatch(callback);
					myControl.util.dump(" -> Got to valid checkout and adding to dispatchQ.");
					}
				else	{
//					myControl.util.dump(' -> validation failed.');
//originally, instead of attr(disabled,false) i removed the disabled attribute. This didn't work in ios 5 safari.					
					$('#chkoutPlaceOrderBtn').attr('disabled',false).removeClass('ui-state-disabled').removeClass('loadingButtonBg');
					
//without this jump, the create order button jumps up slightly. 
//this needs to be at the end so all the content above is manipulated BEFORE jumping to the id. otherwise, the up-jump still occurs.
				myControl.util.jumpToAnchor('chkoutSummaryErrors');
					
//space separating two classes in remove class didn't play well with ipad.
					}



_gaq.push(['_trackEvent','Checkout','User Event','Create order button pushed (validated = '+checkoutIsValid+')']);
				
				return 1;
				},
			dispatch : function(callback)	{
				myControl.model.addDispatchToQ({"_cmd":"cartCheckoutValidate","_tag" : {"callback":callback,"extension":"convertSessionToOrder"}},'immutable');
				}
			},
//used when checkout is first loaded and 'should' get used just prior to checkout to ensure
//all items have available inventory (if needed based on store settings).
//formerly verifyCartInventory
		cartItemsInventoryVerify : {
			init : function(callback)	{
				this.dispatch(callback);
				return 1;
				},
			dispatch : function(callback)	{
				myControl.model.addDispatchToQ({"_cmd":"cartItemsInventoryVerify","_tag": {"datapointer":"cartItemsInventoryVerify","callback":callback,"extension":"convertSessionToOrder"}},'immutable');
				}
			} //cartItemsInventoryVerify		

		}, //calls









					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\









	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
		init : {
			onSuccess : function()	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.init.onSuccess');
				var r; //returns false if checkout can't load due to account config conflict.
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.init.onSuccess');
				if(!zGlobals || $.isEmptyObject(zGlobals.checkoutSettings))	{
					$('#globalMessaging').toggle(true).append(myControl.util.formatMessage({'message':'<strong>Uh Oh!<\/strong> It appears an error occured. Please try again. If error persists, please contact the site administrator.','uiClass':'error','uiIcon':'alert'}));
					r = false;
					}
//user is not logged in. store requires login to checkout.
//sometimes two email fields show up at the same time (default behavior).  so data-bill_email2 id is used for 'login' and data-bill_email id is used for guest.
				else if(zGlobals.checkoutSettings.preference_require_login == 1)	{
					myControl.util.dump(" -> zGlobals.checkoutSettings.preference_require_login == 1");
//require login is enabled but this checkout is for 'nice'. go nuclear.
					$('#globalMessaging').toggle(true).append(myControl.util.formatMessage({'message':'<strong>Uh Oh!<\/strong> There appears to be an issue with the store configuration. Please change your checkout setting to \'nice\' if you wish to use this layout.','uiClass':'error','uiIcon':'alert'}));
					// we should fire off some error tracking event here. %%%
					r = false;
					}
//user is not logged in. store does not prompt for login.
				else if(zGlobals.checkoutSettings.preference_request_login == 1)	{
					myControl.util.dump(" -> zGlobals.checkoutSettings.preference_request_login == 1");
					$('#globalMessaging').toggle(true).append(myControl.util.formatMessage({'message':'<strong>Uh Oh!<\/strong> There appears to be an issue with the store configuration. Please change your checkout setting to \'passive\' if you wish to use this layout.','uiClass':'error','uiIcon':'alert'}));
					r = false;
					}
				else if(typeof _gaq === 'undefined')	{
					myControl.util.dump(" -> _gaq is undefined");
					$('#globalMessaging').toggle(true).append(myControl.util.formatMessage({'message':'<strong>Uh Oh!<\/strong> It appears you are not using the Asynchronous version of Google Analytics. It is required to use this checkout.','uiClass':'error','uiIcon':'alert'}));
					r = false;					
					}
//messaging for the test harness 'success'.
				else if(myControl.util.getParameterByName('_testharness'))	{
					$('#globalMessaging').toggle(true).append(myControl.util.formatMessage({'message':'<strong>Excellent!<\/strong> Your store meets the requirements to use this one page checkout extension.','uiIcon':'circle-check','uiClass':'success'}));
					$('#'+myControl.ext.convertSessionToOrder.vars.containerID).removeClass('loadingBG').append("");
					}
				else	{
					r = true;
					}

				if(r == false)	{
//execute error handling for the extension.
//errors are reported to the screen, but 'other' actions may need to be taken.
					this.onError();
					}
				return r;
//				myControl.util.dump('END myControl.ext.convertSessionToOrder.init.onSuccess');
				},
			onError : function()	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.init.error');
				//This would be reached if a templates was not defined in the view.
				$('#'+myControl.ext.convertSessionToOrder.vars.containerID).removeClass('loadingBG');
				}
			}, //init


//SET THIS AS THE CALLBACK ON THE EXTENSION LOADER IF YOU WANT TO IMMEDIATELY START CHECKOUT
		startCheckout : {
			onSuccess : function() {
				myControl.ext.convertSessionToOrder.calls.startCheckout.init('zContent');
				},
			onError : function() {
//to get here, something catastrophic would have happened and other error messaging would have handled it.
				}
			},

		updateCheckoutShipMethods : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.updateCheckoutShipMethods.success');
				myControl.ext.convertSessionToOrder.panelContent.shipMethods();
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.updateCheckoutShipMethods.onError - ERROR!');
				myControl.ext.convertSessionToOrder.panelContent.shipMethods(); //reload ship panel or just error shows and there is no way to continue.
				$('#chkoutShipMethodsFieldsetErrors').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},


		
		
		proceedToGoogleCheckout : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN convertSessionToOrder[passive].callbacks.proceedToGoogleCheckout.onSuccess');
				_gaq.push(function() {
					var pageTracker = _gaq._getAsyncTracker();
					setUrchinInputCode(pageTracker);
					});
//				alert(myControl.data[tagObj.datapointer].URL+"?analyticsdata="+getUrchinFieldValue());
				document.location= myControl.data[tagObj.datapointer].URL+"&analyticsdata="+getUrchinFieldValue();
				},
			onError : function(responseData,uuid)	{
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled'); // re-enable checkout button on checkout page.
				myControl.util.handleErrors(responseData,uuid);
				}
			},


		handleCartPaypalSetECResponse : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN convertSessionToOrder[passive].callbacks.handleCartPaypalSetECResponse.onSuccess');
				window.location = myControl.data[tagObj.datapointer].URL
				},
			onError : function(responseData,uuid)	{
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled'); // re-enable checkout button on cart page.
				myControl.util.handleErrors(responseData,uuid);
				}
			},


		handleCartPaypalGetECDetails : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN convertSessionToOrder[passive].callbacks.handleCartPaypalGetECDetails.onSuccess');
//lock down form fields so ship addresses match (and a variety of other form manipulation occurs).
				myControl.ext.convertSessionToOrder.utilities.handlePaypalFormManipulation();
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid);
				}
			},		
		addGiftcardToCart : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('got to addGiftcardToCart success');
//after a gift card is entered, update the payment panel as well as the cart/invoice panel.
				myControl.ext.convertSessionToOrder.panelContent.cartContents();
				myControl.ext.convertSessionToOrder.panelContent.paymentOptions();

				$('#giftcardMessaging').empty().append(myControl.util.formatMessage({'message':'Your gift card has been added. Your cart summary has been updated.','uiIcon':'check','htmlid':'giftcardSuccessMessage','timeoutFunction':"$('#giftcardSuccessMessage').slideUp(1000);"}));

_gaq.push(['_trackEvent','Checkout','User Event','Cart updated - giftcard added']);



				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.addGiftcardToCart.onError - ERROR!');
				myControl.ext.convertSessionToOrder.panelContent.paymentOptions(); //regenerate the panel. need to show something or no payments can be selected.
				$('#chkoutPayOptionsFieldsetErrors').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},//addGiftcardToCart



			
		addCouponToCart : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN control.ext.convertSessionToOrder.callbacks.addcouponToCart.onSuccess');
				$('#addCouponBtn').removeAttr('disabled').removeClass('ui-state-disabled').removeClass('loadingButtonBg');
//after a gift card or coupon is entered, update the cart/invoice panel.
				$('#couponMessaging').empty().toggle(true).append(myControl.util.formatMessage({'message':'Your coupon has been added.','uiClass':'success','uiIcon':'check','htmlid':'couponSuccessMessage','timeoutFunction':"$('#couponSuccessMessage').slideUp(1000);"}));

_gaq.push(['_trackEvent','Checkout','User Event','Cart updated - coupon added']);


				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.addcouponToCart.onError');
				$('#addCouponBtn').removeAttr('disabled').removeClass('ui-state-disabled').removeClass('loadingButtonBg');
				$('#couponMessaging').empty().toggle(true).append(myControl.util.getResponseErrors(d));
				}
			},//addcouponToCart




//executing this will not only return which items have had an inventory update (in a pretty format) but also create the dispatches
// to update the cart and then to actually update it as well.
// the individual cart update posts (there may be multiple) go without the callback. If callback is added, a ping to execute it is run.
		handleInventoryUpdate : {

				onSuccess : function(tagObj)	{

//					myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.handleInventoryUpdate.onSuccess');
					var r = false; //if false is returned, then no inventory update occured.
	//				var L = myControl.model.countProperties(myControl.data[tagObj.datapointer]);
					if(!$.isEmptyObject(myControl.data[tagObj.datapointer]) && !$.isEmptyObject(myControl.data[tagObj.datapointer]['%changes']))	{
						myControl.util.dump(' -> adjustments are present');
						r = "<div id='inventoryErrors'>It appears that some inventory adjustments needed to be made:<ul>";
						for(var key in myControl.data[tagObj.datapointer]['%changes']) {
							r += "<li>sku: "+key+" was set to "+myControl.data[tagObj.datapointer]['%changes'][key]+" due to availability<\/li>";
							myControl.calls.updateCartContents.init({"stid":key,"quantity":myControl.data[tagObj.datapointer]['%changes'][key]});
							}
						r += "<\/ul><\/div>";
						
						
						$('#globalMessaging').toggle(true).append(myControl.util.formatMessage({'message':r,'uiIcon':'alert'}));

						}


_gaq.push(['_trackEvent','Checkout','App Event','Cart updated - inventory adjusted to reflect availability']);

					return r;
					
					},
				onError : function(d)	{
					myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.handleInventoryUpdate.onError - ERROR!');
					myControl.ext.convertSessionToOrder.panelContent.paymentOptions();
//global errors are emptied when 'complete order' is pushed, so do not empty in the responses or any other errors will be lost.
					$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
					}
				},	//handleInventoryUpdate


		updateCheckoutPayOptions : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.updateCheckoutPayOptions.success');
				myControl.ext.convertSessionToOrder.panelContent.paymentOptions();
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.updateCheckoutPayOptions.onError - ERROR!');
				myControl.ext.convertSessionToOrder.panelContent.paymentOptions();  //reload panel or just error shows and user can't proceed.
				$('#chkoutPayOptionsFieldsetErrors').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},

		updateCheckoutOrderContents : {
			onSuccess : function(){
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.updateCheckoutOrderContents.success (updating cart panel)');
				myControl.ext.convertSessionToOrder.panelContent.cartContents();
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.updateCheckoutOrderContents.onError - ERROR!');
				myControl.ext.convertSessionToOrder.panelContent.cartContents();  //reload panel so more than just error shows up and user can proceed/try again.
				$('#chkoutSummaryErrors').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},
/*
this gets executed after the server side validating is run.
success would mean the checkout has successfully validated.
error would mean something was not complete. 
 -> In theory, we shouldn't get errors often because the client side validation should handle most, if not all, errors.
*/
		finishedValidatingCheckout : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.finishedValidatingCheckout.onSuccess');
//if paypal is selected but a valid token doesn't exist, route to paypal.
				if($("#chkout-payby_PAYPALEC").is(':checked') && !myControl.data.cartItemsList.cart['payment-pt'])	{
					myControl.ext.convertSessionToOrder.calls.cartPaypalSetExpressCheckout.init();
					}
				else	{
					myControl.ext.convertSessionToOrder.calls.cartOrderCreate.init("checkoutSuccess");
					}
				myControl.model.dispatchThis('immutable');


_gaq.push(['_trackEvent','Checkout','App Event','Server side validation passed']);


				},
			onError : function(responseData,uuid)	{
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled loadingButtonBg'); //make place order button appear and be clickable.
				responseData['_rtag'] = $.isEmptyObject(responseData['_rtag']) ? {} : responseData['_rtag'];
				responseData['_rtag'].targetID = 'chkoutSummaryErrors';
				myControl.ext.convertSessionToOrder.utilities.showServerErrors(responseData,uuid);
				
_gaq.push(['_trackEvent','Checkout','App Event','Server side validation failed']);


				}
			},


		loadPanelContent : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.loadPanelContent.onSuccess');

//had some issues using length. these may have been due to localStorage/expired cart issue. countProperties is more reliable though, so still using that one.			
				var stuffCount = myControl.model.countProperties(myControl.data.cartItemsList.cart.stuff);
//				myControl.util.dump('stuff util.countProperties = '+stuffCount+' and typeof = '+typeof stuffCount);


				if(stuffCount > 0)	{
					
//						myControl.util.dump(' -> authentication passed. Showing panels.');
//						myControl.util.dump(' -> chkout.bill_to_ship = '+myControl.data.cartItemsList.cart['chkout.bill_to_ship']);
//create panels. notes and ship address are hidden by default.
//ship address will make itself visible if user is authenticated.
					myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutBillAddress');

//bill to ship will be set to zero if user has disabled it, otherwise it will be 1 or undef.
					myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutShipAddress',Number(myControl.data.cartItemsList.cart['chkout.bill_to_ship']) == 0 ? false : true)

					myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutShipMethods'); 
					myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutPayOptions');
					myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutOrderNotes',true);						
//populate panels.						
					myControl.ext.convertSessionToOrder.panelContent.cartContents();
					myControl.ext.convertSessionToOrder.panelContent.billAddress();

					myControl.ext.convertSessionToOrder.panelContent.shipAddress();
					myControl.ext.convertSessionToOrder.panelContent.shipMethods();
					myControl.ext.convertSessionToOrder.panelContent.paymentOptions();
//if order notes is on, show panel and populate content.
					if(zGlobals.checkoutSettings.chkout_order_notes == true)	{
						myControl.ext.convertSessionToOrder.panelContent.orderNotes();
						$('#chkoutOrderNotes').toggle(true); 
						}
						

_gaq.push(['_trackEvent','Checkout','Milestone','Valid email address obtained']);


					}//ends 'if' for whether cart has more than zero items in it.
				else	{
					myControl.ext.convertSessionToOrder.utilities.cartIsEmptyWarning();
					}
				$('#'+myControl.ext.convertSessionToOrder.vars.containerID).removeClass('loadingBG');
				
//will lock many input fields so they match the paypal response (ship address, shipping, etc).
//needs to executed in here instead of in a callback for the payalget because the get is only run once per cart/session (unless cart is changed)
//but checkout may get load/reloaded and if the cart hasn't changed, the forms still need to be 'locked'.
//needs to run at the end here so that all the dom manipulating is done prior so function can 'lock' fields
				if(myControl.ext.convertSessionToOrder.utilities.thisSessionIsPayPal())	{
					myControl.ext.convertSessionToOrder.utilities.handlePaypalFormManipulation();
					}

				
				},
			onError : function(d)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.loadPanelContent.onError.');
				$('#globalMessaging').append({"message":"It appears something has gone very wrong. Please try again. If error persists, please contact the site administrator.","uiClass":"error","uiIcon":"alert"})
				$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			
			},//loadPanelContent

/*
this callback is executed after a successful checkout.  'success' is defined as an order created, the order may contain 'payment required' warnings.
this is what would traditionally be called an 'invoice' page, but certainly not limited to just showing the invoice.
*/
		checkoutSuccess : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.checkoutSuccess.onSuccess   datapointer = '+tagObj.datapointer);
//nuke old form content. not needed anymore. gets replaced with invoice-ish content.
				var $zContent = $('#'+myControl.ext.convertSessionToOrder.vars.containerID).empty();
				var oldSession = myControl.sessionId;
				var orderID = myControl.data[tagObj.datapointer].orderid;

				myControl.util.jumpToAnchor(myControl.ext.convertSessionToOrder.vars.containerID);
//this generates the post-checkout message from the template in the view file.
				$zContent.append(myControl.renderFunctions.createTemplateInstance('checkoutSuccess','checkoutSuccessContent')); 
				myControl.renderFunctions.translateTemplate(myControl.data[tagObj.datapointer],'checkoutSuccessContent');
// ### test this before switching back.
//				$zContent.append(myControl.renderFunctions.transmogrify('checkoutSuccess','checkoutSuccessContent',myControl.data[tagObj.datapointer]))

/*
right now, we're just displaying the payment_status_detail message.  
eventually, it will check the status and do better handling of the response.
the checkoutSuccessPaymentFailure started to do this but for the sake of getting this out, we improvised. ###
*/
				$('.paymentRequired').append(myControl.data[tagObj.datapointer].payment_status_detail);

//				$('.paymentRequired').append(myControl.ext.convertSessionToOrder.utilities.checkoutSuccessPaymentFailure(myControl.data[tagObj.datapointer].payment_success,myControl.data['order|'+orderID].cart['chkout.payby']));
				
				
				
				var cartContentsAsLinks = encodeURI(myControl.ext.convertSessionToOrder.utilities.cartContentsAsLinks('order|'+orderID))
				
				$('.ocmTwitterComment').click(function(){
					window.open('http://twitter.com/home?status='+cartContentsAsLinks,'twitter');
					_gaq.push(['_trackEvent','Checkout','User Event','Tweeted about order']);
					});
				
				$('.ocmFacebookComment').click(function(){
					myControl.thirdParty.fb.postToWall(cartContentsAsLinks);
					_gaq.push(['_trackEvent','Checkout','User Event','FB message about order']);
					});

				myControl.calls.appCartCreate.init(); //!IMPORTANT! after the order is created, a new cart needs to be created and used. the old cart id is no longer valid. 
				myControl.ext.convertSessionToOrder.calls.getCartContents.init(); //!IMPORTANT! will reset local cart object. 
				myControl.model.dispatchThis('immutable'); //these are auto-dispatched because they're essential.
				


_gaq.push(['_trackEvent','Checkout','App Event','Order created']);
_gaq.push(['_trackEvent','Checkout','User Event','Order created ('+orderID+')']);

//add the html roi to the dom. this likely includes tracking scripts. LAST in case script breaks something.
setTimeout("$('#"+myControl.ext.convertSessionToOrder.vars.containerID+"').append(myControl.data['"+tagObj.datapointer+"']['html:roi']); myControl.util.dump('wrote html:roi to DOM.');",2000); 

				},
			onError : function(responseData,uuid)	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.checkoutSuccess.onError');
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled loadingButtonBg'); //make place order button appear and be clickable.
				
				responseData['_rtag'] = $.isEmptyObject(responseData['_rtag']) ? {} : responseData['_rtag'];
				responseData['_rtag'].targetID = 'chkoutSummaryErrors';
				myControl.ext.convertSessionToOrder.utilities.showServerErrors(responseData,uuid);
				
_gaq.push(['_trackEvent','Checkout','App Event','Order NOT created. error occured. ('+responseData['_msg_1_id']+')']);

				}
			}

		}, //callbacks





////////////////////////////////////   						validation				    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\




	validate : {
			
 

//runs individual panel/fieldset validation and returns whether or not all checkout fields are populated/valid.
//the individual fieldset validator returns a 1/0 depending on whether it passes/fails the validation.
//order notes is NOT validated
//there are six validated fields, so summing up the values will = 6 if all panels pass.
			isValid : function()	{
				var $globalErrors = $('#chkoutSummaryErrors').empty().toggle(false);
				var r = true;
				var sum = 0;
				sum += this.chkoutShipMethodsFieldset(); //myControl.util.dump('ship methods done. sum = '+sum);
				sum += this.chkoutPayOptionsFieldset(); //myControl.util.dump('pay options done. sum = '+sum);
				sum += this.chkoutBillAddressFieldset(); //myControl.util.dump('bill address done. sum = '+sum);
				sum += this.chkoutShipAddressFieldset(); //myControl.util.dump('ship address done. sum = '+sum);

//				myControl.util.dump('END myControl.ext.convertSessionToOrder.validate.isValid. sum = '+sum);
				if(sum != 4)	{
					r = false;
					$globalErrors.append(myControl.util.formatMessage({"message":"Some required fields were left blank or contained errors. (please scroll up)","uiClass":"error","uiIcon":"alert"})).toggle(true);
					}
//				r = true; //for testing error handling. do not deploy with this line uncommented.
				return r;
				}, //isValid
//validation function should be named the same as the id of the fieldset. 



//no validation occurs here by default, but function exists so it can be overridden AND because there's some automated scripting which validates each panel as the user moves on.
			chkoutOrderNotesFieldset : function()	{
				
				},


				
//make sure a shipping method is selected
			chkoutShipMethodsFieldset : function()	{
				var valid = 1;
				var $shipMethod = $("[name='ship.selected_id']:checked");
				$('#chkoutShipMethodsFieldsetErrors').empty().toggle(false);
				if($shipMethod.val())	{
//					myControl.util.dump(' -> ship method validated');
					$('#chkoutShipMethodsFieldset').addClass('validatedFieldset');
					}
				else	{
					valid = 0;
					$('#chkoutShipMethodsFieldsetErrors').toggle(true).append(myControl.util.formatMessage("Please select a shipping method."));
					$('#chkoutShipMethodsFieldset').removeClass('validatedFieldset');
					}
				if(valid == 1)	{


_gaq.push(['_trackEvent','Checkout','Milestone','Shipping method validated']);


					}
				return valid;
				}, //validate.chkoutShipMethodsFieldset
				
//in addition to selecting a pay option, certain extra fields may be present and must be checked for.
			chkoutPayOptionsFieldset : function()	{
				var valid = 1;
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.validate.chkoutPayOptionsFieldset');
				var $payMethod = $("[name='chkout.payby']:checked");
				var $errorDiv = $('#chkoutPayOptionsFieldsetErrors').empty().toggle(false);
				var errMsg = '';
				var safeid,$holder;
				if($payMethod.val())	{
					switch($payMethod.val())	{
						
						case 'CREDIT':
							var $paymentCC = $('#payment-cc').removeClass('mandatory');
							var $paymentMM = $('#payment-mm').removeClass('mandatory');
							var $paymentYY = $('#payment-yy').removeClass('mandatory');
							var $paymentCV = $('#payment-cv').removeClass('mandatory');
							if(!myControl.util.isValidCC($paymentCC.val())){$paymentCC.parent().addClass('mandatory'); valid = 0; errMsg += '<li>please enter a valid credit card #<\/li>'}
							if(!myControl.util.isValidMonth($paymentMM.val())){$paymentMM.parent().addClass('mandatory'); valid = 0; errMsg += '<li>please select an exipration month<\/li>'}
							if(!myControl.util.isValidCCYear($paymentYY.val())){$paymentYY.parent().addClass('mandatory'); valid = 0; errMsg += '<li>please select an expiration year<\/li>'}
							if($paymentCV.val().length < 3){$paymentCV.parent().addClass('mandatory'); valid = 0; errMsg += '<li>please enter a cvv/cid #<\/li>'}
							break;
						
						case 'ECHECK':
							for(var key in myControl.ext.convertSessionToOrder.vars.echeck) {
								$holder = $('#'+myControl.util.makeSafeHTMLId(key)).removeClass('mandatory');
								if(!$holder.val())	{
									$holder.parent().addClass('mandatory');
									valid = 0;
									errMsg += '<li>please enter a '+myControl.ext.convertSessionToOrder.vars.echeck[key]+'<\/li>'
									}
								}
							break;
						
						case 'PO':
							var $paymentPO = $('#payment-po').removeClass('mandatory');
							if(!myControl.util.isSet($paymentPO.val())){$paymentPO.parent().addClass('mandatory'); valid = 0; errMsg += '<li>please enter a PO #<\/li>'}
							break;
							
						default:
							break;
						}
//the errors above get put into a list with a header. handles multiple errors (like CC, potentially) more nicely.
					errMsg = "Some required fields are missing/invalid:<ul>"+errMsg+"<\/ul>"
					}
				else	{
					valid = 0;
					errMsg = 'please select a payment method';
					}

				if(valid == 0){
					$('#chkoutPayOptionsFieldset').removeClass('validatedFieldset');
//					myControl.util.dump(' -> payment options did not pass validation');
					$errorDiv.toggle(true).append(myControl.util.formatMessage(errMsg));
					}
				else{
//					myControl.util.dump(' -> payment options passed validation');
					$('#chkoutPayOptionsFieldset').addClass('validatedFieldset');



_gaq.push(['_trackEvent','Checkout','Milestone','Payment method validated ('+$payMethod.val()+')']);



					}
//				myControl.util.dump('END myControl.ext.convertSessionToOrder.validate.chkoutPayOptionsFieldset. paymethod = '+$payMethod.val()+' and valid = '+valid);
				return valid;
				}, //chkoutPayOptionsFieldset
				
			chkoutBillAddressFieldset: function()	{
				var valid = 1;
				var r = true;
				$('#chkoutBillAddressFieldsetErrors').empty().toggle(false);
				$('#chkoutBillAddressFieldset .mandatory').removeClass('mandatory');
//all of the address validation logic is in this function. that way we can recycle for ship/bill address
				r = this.addressIsPopulated('bill'); 

				if(r)	{
					$('#chkoutBillAddressFieldset').addClass('validatedFieldset');
					}
				else	{
					valid = 0;
					$('#chkoutBillAddressFieldsetErrors').append(myControl.util.formatMessage("Some required fields were left blank or are invalid")).toggle(true);
					$('#chkoutBillAddressFieldset').removeClass('validatedFieldset');
/*
sometimes, a preexisting address may be selected but not have all required fields.
in this case, toggle the address entry form on so that the corrections can be made in an obvious manner.
*/
					$("#billAddressUL").toggle(true);
					}
				if(valid == 1)	{

_gaq.push(['_trackEvent','Checkout','Milestone','billing address obtained']);

					}
				return valid;
				}, //chkoutBillAddressFieldset
				
			chkoutShipAddressFieldset : function()	{
				var valid = 1;
				var r = true;
				$('#chkoutShipAddressFieldsetErrors').empty().toggle(false);
				$('#chkoutShipAddressFieldset .mandatory').removeClass('mandatory');
//copy all the billing address fields to the shipping address fields, if appropriate. if so, don't bother validating.
				if($('#chkout-bill_to_ship_cb').is(':checked')) {
					myControl.sharedCheckoutUtilities.setShipAddressToBillAddress();
					}
				else	{
					r = this.addressIsPopulated('ship');
					}

				if(r)	{
					$('#chkoutShipAddressFieldset').addClass('validatedFieldset');
					}
				else	{
					valid = 0;
					$('#chkoutShipAddressFieldsetErrors').append(myControl.util.formatMessage("Some required fields were left blank or are invalid")).toggle(true);
					$('#chkoutShipAddressFieldset').removeClass('validatedFieldset');
/*
sometimes, a preexisting address may be selected but not have all required fields.
in this case, toggle the address entry form on so that the corrections can be made in an obvious manner.
*/
					$("#shipAddressUL").toggle(true);
					}
				if(valid == 1)	{

_gaq.push(['_trackEvent','Checkout','Milestone','shipping address obtained']);

					}
				return valid;
				},
//type = ship or bill. will validate the respective address entered in checkout.
			addressIsPopulated : function(TYPE)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.validate.address');
//				myControl.util.dump(' -> TYPE = '+TYPE);
				var r = true;
//errordiv is specific to the type. 
				var $errorDiv = TYPE=="bill" ? $('#chkoutBillAddressFieldsetErrors') : $('#chkoutShipAddressFieldsetErrors');
				var $firstName = $('#data-'+TYPE+'_firstname').removeClass('mandatory');
				var $lastName = $('#data-'+TYPE+'_lastname').removeClass('mandatory');
				var $address1 = $('#data-'+TYPE+'_address1').removeClass('mandatory');
				var $city = $('#data-'+TYPE+'_city').removeClass('mandatory');
				var $state = $('#data-'+TYPE+'_state').removeClass('mandatory');
				var $zip = $('#data-'+TYPE+'_zip').removeClass('mandatory');
				var $country = $('#data-'+TYPE+'_country').removeClass('mandatory');
				
				if($firstName.val().length < 2){$firstName.parent().addClass('mandatory'); r = false;}				
				if($lastName.val().length < 2){$lastName.parent().addClass('mandatory'); r = false;}
				if($address1.val().length < 2){$address1.parent().addClass('mandatory'); r = false;}
				if($city.val().length < 2){$city.parent().addClass('mandatory'); r = false;}
				if($state.val().length < 2){$state.parent().addClass('mandatory'); r = false;}
				
				if(TYPE=="bill")	{
					var $email = $('#data-bill_email');
					if($email.val() == '')	{
	//						myControl.util.dump(' -> email is blank');
						$email.parent().addClass('mandatory');
						$errorDiv.append(myControl.util.formatMessage("Please provide an email address")).toggle(true);
						myControl.ext.convertSessionToOrder.vars.validPreflight = 0;
						r = false;
						}
					else if(!myControl.util.isValidEmail($email.val()))	{
	//						myControl.util.dump(' -> email is not valid');
						$errorDiv.append(myControl.util.formatMessage("Please provide a valid email address")).toggle(true);
						$email.parent().addClass('mandatory');
						r = false;
						}
					
					}
				
				if(zGlobals.checkoutSettings.chkout_phone == 'REQUIRED'){
//					myControl.util.dump(' -> phone number IS required');
					var $phone = $('#data-'+TYPE+'_phone').removeClass('mandatory');
					if(myControl.util.isValidPhoneNumber($phone.val(),$country.val()) == true)	{
//						myControl.util.dump(' -> phone number IS valid');
						//don't override what r is already set to if this validates. only override if it DOESN'T validate.
						}
					else if(TYPE == 'ship' && ($('#data-bill_phone').val()))	{
						//set the shipping phone to the billing phone to expedite checkout.
							$phone.val($('#data-bill_phone').val())
						}
					else	{
//						myControl.util.dump(' -> phone number is NOT valid');
						$errorDiv.append(myControl.util.formatMessage("Please provide a valid phone number with area code."));
						$phone.parent().addClass('mandatory');
						r = false;
						}
					}
				
				
				if(!myControl.util.isValidPostalCode($zip.val(),$country.val())){$zip.parent().addClass('mandatory'); r = false;}
				return r;
				} //addressIsPopulated
			}, //validate
		


////////////////////////////////////   						panelContent			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





/*
each of these functions creates their respective panel. 
each panel is a fieldset, which is created in a call, then populated in a callback once the 
data sets have been received. Any time checkout is intiated, several requests are made to
make sure all the data is up to date (shipping options, inventory check, etc).

a given panel can update another, but should NOT contain code to modify another panel.
all logic should be in the panel itself. That'll make it easier to maintain.
 -> there is one exception to this. currently, 'ship to billing' will hide/unhide the shipping address panel instead of reloading it. 
 	this is handled differently because it's more efficient to just hide/unhide the panel then reload it each time.
*/ 
		panelContent : {

/*
a guest checkout gets just a standard address entry. 
an existing user gets a list of previous addresses they've used and an option to enter a new address.
*/
			billAddress : function()	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.panelContent.billAddress.  ');
				var data = myControl.data.cartItemsList.cart;
//				myControl.util.dump(data);
				var txt = '';
				var cssClass; //used to hide the form inputs if user is logged in and has predefined addresses. inputs are still generated so user can create a new address.
			 	var authState = myControl.sharedCheckoutUtilities.determineAuthentication();
				if(authState == 'authenticated' && myControl.ext.convertSessionToOrder.utilities.addressListOptions('bill') != false)	{
//					myControl.util.dump(" -> user is logged in AND has predefined billing address(es)");
					txt = "<span class='addressListPrompt'>Please choose from (click on) billing address(es) below:<\/span>";
					txt += myControl.ext.convertSessionToOrder.utilities.addressListOptions('bill'); // creates pre-defined address blocks.
					cssClass = 'displayNone';
					}
				
//troubleshooting IE issues, so saved to var instead of manipulating directly. may not need this, but test in IE if changed.
				var $panelFieldset = $("#chkoutBillAddressFieldset").removeClass("loadingBG").append("<p>"+txt+"<\/p>");
//				myControl.util.dump(" -> transmogrify billing address.");
				$panelFieldset.append(myControl.renderFunctions.transmogrify({'id':'billAddressUL'},'chkout-billAddressSpec',myControl.data.cartItemsList.cart))
				
				$('#billAddressUL').addClass(cssClass);

//update form elements based on cart object.
				if(authState == 'authenticated' && myControl.ext.convertSessionToOrder.utilities.addressListOptions('ship') != false)	{
//					myControl.util.dump(' -> user is logged in and has predefined shipping addresses so bill to ship not displayed.');
					$("#chkout-bill_to_ship_cb").removeAttr("checked");
					$("#chkout-bill_to_ship").val('0');
					$("#chkout-bill_to_ship_cb_container").toggle(false);
					}
				else if(myControl.data.cartItemsList.cart['chkout.bill_to_ship']*1 == 0)	{
//					myControl.util.dump(' -> bill to ship is disabled ('+myControl.data.cartItemsList.cart['chkout.bill_to_ship']+')');
					$("#chkout-bill_to_ship_cb").removeAttr("checked");
					$("#chkout-bill_to_ship").val('0');
					}
				else	{
//					myControl.util.dump(' -> bill to ship is enabled ('+myControl.data.cartItemsList.cart['chkout.bill_to_ship']+')');
					$("#chkout-bill_to_ship").val('1');
					$("#chkout-bill_to_ship_cb").attr("checked","checked");
					}
				
//from a usability perspective, we don't want a single item select list to show up. so hide if only 1 or 0 options are available.
				if(myControl.data.appCheckoutDestinations['@destinations'].length < 2)
					$('#billCountryContainer').toggle(false);

//				myControl.util.dump('END myControl.ext.convertSessionToOrder.panelContent.billAddress.');
				}, //billAddress
				
				
			shipAddress : function()	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.panelContent.shipAddress.  ');
				var txt = '';
				var cssClass = '';  //used around the form fields. turned off if pre-defined addresses exist, but form is still generated so a new address can be added.
				var $panelFieldset = $("#chkoutShipAddressFieldset");
				
				if(myControl.sharedCheckoutUtilities.determineAuthentication() == 'authenticated' && myControl.ext.convertSessionToOrder.utilities.addressListOptions('ship') != false)	{
					myControl.util.dump(' -> user is authenticated and has predefined shipping addressses.');
// for existing customers/addresses, there is a default bill and a default ship address that could be different. So, the checkbox for bill to ship is NOT checked and the ship address panel is displayed.
					$panelFieldset.toggle(true); //toggles the panel on.
					txt = "<p class='addressListPrompt'>Please choose from (click on) shipping address(es) below:<\/p>";
					txt += myControl.ext.convertSessionToOrder.utilities.addressListOptions('ship'); // creates pre-defined address blocks.
					cssClass = 'displayNone'; 
					}

				$panelFieldset.removeClass('loadingBG').append(txt);
				$panelFieldset.append(myControl.renderFunctions.transmogrify({'id':'shipAddressUL'},'chkout-shipAddressSpec',myControl.data.cartItemsList.cart))
				
				$('#shipAddressUL').addClass(cssClass); //address form is hidden if user is logged in, in favor of clickable predefined addresses.

//from a usability perspective, we don't want a single item select list to show up. so hide if only 1 or 0 options are available.
				if(myControl.data.appCheckoutDestinations['@destinations'].length < 2)
					$('#shipCountryContainer').toggle(false);
				
				}, //shipAddress


			shipMethods : function()	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.panelContent.shipMethods');

				var $panelFieldset = $("#chkoutShipMethodsFieldset").removeClass("loadingBG");
				$panelFieldset.append(myControl.renderFunctions.createTemplateInstance('chkout-shipMethodsSpec','shipMethodsContainer'));
				myControl.renderFunctions.translateTemplate(myControl.data.cartShippingMethods,'shipMethodsContainer');

//must appear after panel is loaded because otherwise the divs don't exist.
				if(myControl.data.cartShippingMethods['@methods'].length == 0)	{
					$('#noShipMethodsAvailable').toggle(true);
					}
				else if(!$('#data-bill_zip').val() && !$('ship_zip').val()) {
					$('#noZipShipMessage').toggle(true);
					}

/*
it's possible that a ship method is set in the cart that is no longer available.
this could happen if 'local pickup' is selected, then country,zip,state, etc is changed to a destination where local pickup is not available.
in these instances, the selected method in the cart/memory/local storage must get nuked.
*/
				var foundMatchingShipMethodId = false; 
				var L = myControl.data.cartShippingMethods['@methods'].length;
				for(var i = 0; i < L; i += 1)	{
					if(myControl.data.cartShippingMethods['@methods'][i].id == myControl.data.cartItemsList.cart['ship.selected_id'])	{
						foundMatchingShipMethodId = true;
						break; //once a match is found, no need to continue the loop.
						}
					}

				if(foundMatchingShipMethodId == false)	{
					myControl.util.dump(' -> previously selected ship method is no longer available. update session with null value.');
					myControl.calls.cartSet.init({"ship.selected_id":null});  //the set will update the method, session and local storage.
					myControl.ext.convertSessionToOrder.calls.getCartContents.init('updateCheckoutOrderContents');
					myControl.model.dispatchThis('immutable');
					}
					
				}, //shipMethods




//displays the cart contents in a non-editable format in the right column of checkout		
			cartContents : function()	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.panelContent.cartContents');
				var $container = $('#chkoutCartSummaryContainer').toggle(true); //make sure panel is visible.

/*
checkoutCartSummary is the id given once the 'container' template has been rendered. It only needs to be rendered once. 
 -> this is more efficient. This also solves any error handling issues where the dom isn't updated prior to error messaging being added (the div may not exist yet).
two of it's children are rendered each time the panel is updated (the prodlist and cost summary)
*/
				if($('#chkoutCartSummary').length == 0)	{
//					myControl.util.dump(" -> chkoutCartSummary has no children. render entire panel.");
					$container.append(myControl.renderFunctions.createTemplateInstance('chkout-cartSummarySpec','chkoutCartSummary'));
					myControl.renderFunctions.translateTemplate(myControl.data.cartItemsList.cart,'chkoutCartSummary');
					}
				

				var $targetObj = $('#chkoutCartContents').removeClass("loadingBG").empty();
				var sku, stid, i;
//add product data.
				var L = myControl.data.cartItemsList.cart.stuff.length;
				for(i = 0; i < L; i += 1)	{
					stid = myControl.data.cartItemsList.cart.stuff[i].stid
					$targetObj.append(myControl.renderFunctions.createTemplateInstance('myCheckoutSpec','myCheckoutSpec_'+stid));
					myControl.renderFunctions.translateTemplate(myControl.data.cartItemsList.cart.stuff[i],'myCheckoutSpec_'+stid);
	//				o += cartSpec;
					}
//add cart summary.
				$('#cartSummaryTotalsContainer').append(myControl.renderFunctions.createTemplateInstance('cartSummaryTotalsSpec','cartSummaryTotals'));
				myControl.renderFunctions.translateTemplate(myControl.data.cartItemsList.cart,'cartSummaryTotals');
//				myControl.util.dump('END myControl.ext.convertSessionToOrder.panelContent.cartContents');
				}, //cartContents



			paymentOptions : function()	{
//				myControl.util.dump('myControl.ext.convertSessionToOrder.panelContent.paymentOptions has been executed');
				var $panelFieldset = $("#chkoutPayOptionsFieldset").toggle(true).removeClass("loadingBG")
				$panelFieldset.append(myControl.renderFunctions.createTemplateInstance('checkout-payOptionsSpec','payOptionsContainer'));
				myControl.renderFunctions.translateTemplate(myControl.data.appPaymentMethods,'payOptionsContainer');	
				myControl.ext.convertSessionToOrder.utilities.updatePayDetails(myControl.data.cartItemsList.cart['chkout.payby']);
				}, //paymentOptions
		
		
/*
the notes textarea will create a dispacth for the contents when they're updated, but it doesn't send.
after using it, too frequently the dispatch would get cancelled/dominated by another dispatch.
*/
			orderNotes : function()	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.panelContent.orderNotes');
				var $panelFieldset = $("#chkoutOrderNotesFieldset").toggle(true).removeClass("loadingBG")
				$panelFieldset.append(myControl.renderFunctions.createTemplateInstance('chkout-orderNotesSpec','orderNotesContainer'));
				myControl.renderFunctions.translateTemplate(myControl.data.cartItemsList.cart,'orderNotesContainer');
//				myControl.util.dump('END myControl.ext.convertSessionToOrder.panelContent.orderNotes');
				} //orderNotes



			}, //panelContent
	



////////////////////////////////////   						utilities			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		utilities : {



//executed when a coupon is submitted. handles ajax call for coupon and also updates cart.
			handleCouponSubmit : function()	{
				$('#chkoutSummaryErrors').empty(); //remove any existing errors.
				$('#addCouponBtn').attr('disabled','disabled').addClass('ui-state-disabled loadingButtonBg');
				myControl.ext.convertSessionToOrder.calls.cartCouponAdd.init($('#couponCode').val(),'addCouponToCart'); 
				myControl.ext.convertSessionToOrder.calls.getCartContents.init('updateCheckoutOrderContents');
				myControl.model.dispatchThis('immutable');
				}, //handleCouponSubmit

//executed when a giftcard is submitted. handles ajax call for giftcard and also updates cart.
//no 'loadingbg' is needed on button because entire panel goes to loading onsubmit.
//panel is reloaded in case the submission of a gift card changes the payment options available.
			handleGiftcardSubmit : function()	{
				myControl.ext.convertSessionToOrder.calls.cartGiftcardAdd.init($('#giftcardCode').val(),'addGiftcardToCart'); 
				myControl.ext.convertSessionToOrder.calls.appPaymentMethods.init();
				myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutPayOptions');
				myControl.ext.convertSessionToOrder.calls.getCartContents.init('updateCheckoutOrderContents');
				myControl.model.dispatchThis('immutable');
				}, //handleGiftcardSubmit
			

//only check the cart object. If the uri is checked here, then when 'nukepaypal' is executed and checkout is re-initiated, the uri vars will trigger the paypal code.
//plus, the token is deleted from the cart when the cart is updated, so we should check there to make sure it is/is not set.
		thisSessionIsPayPal : function()	{
//			myControl.util.dump("BEGIN convertSessionToCheckout.utilities.thisSessionIsPayPal");
			var r = false; //what is returned.  will be set to true if paypalEC approved.
//if token and payerid are set in cart, then likely the user returned from paypal and then browsed more.
			token = myControl.data.cartItemsList.cart['payment-pt'];
			payerid = myControl.data.cartItemsList.cart['payment-pi'];
			myControl.util.dump("paypal -> token: "+token+" and payerid: "+payerid);
			if(token && payerid)	{
				r = true;
				}
			return r;
			},

/*
paypal returns a user to the checkout page, not the order complete page.
if token and payerid are set on URI, then user has just returned to checkout, so do the following:
1. get checkout details (will include paypal info like address)
2. if address is not populated already, populate address. (if logged in, show form, not predefined addresses)
3. lock down address fields so they are not editable.
note - predefined addresses are hidden and the form is shown so that if the user used a paypal address, we don't have to try to 'map' it back to an account address.

4. lock down payment options so they are not editable.
5. select paypal EC as payment option.
6. lock down shipping (a method is selected in paypal)
7. add button near 'place order' that says 'change from paypal to other payment option'.

*/
			handlePaypalFormManipulation : function()	{
			myControl.util.dump("BEGIN convertSessionToOrder.utilities.handlePaypalFormManipulation ");
//when paypal redirects back to checkout, these two vars will be on URI: token=XXXX&PayerID=YYYY

//uncheck the bill to ship option so that user can see the paypal-set shipping address.
//
var $billToShipCB = $('#chkout-bill_to_ship_cb');
$billToShipCB.attr('disabled','disabled')
if($billToShipCB.is(':checked'))	{
//code didn't like running a .click() here. the trigered function registered the checkbox as checked.
	$billToShipCB.removeAttr("checked");
	myControl.ext.convertSessionToOrder.utilities.toggleShipAddressPanel();
	}
//hide all bill/ship predefined addresses.
$('#chkoutBillAddressFieldset address').hide();
$('#chkoutShipAddressFieldset address').hide();
//show bill/ship address form
$('#billAddressUL').show();
$('#shipAddressUL').show();
//disable all shipping address inputs that are populated (by paypal) and select lists except phone number (which isn't populated by paypal)
$('#chkoutShipAddressFieldset input, #chkoutShipAddressFieldset select').each(function(){
	if($(this).val() != '')	{
		$(this).attr('disabled','disabled')
		}
	});
$('#data-ship_phone').removeAttr('disabled');

//name and email are disabled for billing address. They'll be populated by paypal and are not allowed to be different.
$('#data-bill_firstname, #data-bill_lastname, #data-bill_email').attr('disabled','disabled');
$('.addressListPrompt').hide(); //this text needs to be hidden if a user is logged in cuz it doesn't make sense at this point.



//make sure paypal is selected payment option. this will trigger a request to select it as well.
//disable all other payment optins.
$('#chkout-payby_PAYPALEC').click(); //payby is not set by default, plus the 'click' is needed to open the subpanel
$('#chkoutPayOptionsFieldset input[type=radio]').attr('disabled','disabled');

//disable all ship methods.
$('#chkoutShipMethodsFieldset input[type=radio]').attr('disabled','disabled');

//disable giftcards
$('#giftcardMessaging').text('PayPal not compatible with giftCards');
//$('#couponMessaging').show().text('PayPal is not compatible with Coupons');
$('#giftcardCode').attr('disabled','disabled'); //, #couponCode
$('#addGiftcardBtn').attr('disabled','disabled').addClass('ui-state-disabled'); //, #addCouponBtn

$('#paybySupplemental_PAYPALEC').empty().append("<a href='#top' onClick='myControl.ext.convertSessionToOrder.utilities.nukePayPalEC();'>Choose Alternate Payment Method<\/a>");
				
				},
/*
once paypalEC has been approved by paypal, a lot of form fields lock down, but the user may decide to change
payment methods. If they do, execute this function. It will remove the paypal params from the session/cart and 
the re-initiate checkout.
*/
			nukePayPalEC : function() {
				myControl.calls.cartSet.init({'payment-pt':null,'payment-pi':null,'chkout.payby':null}); //nuke vars
				myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutPayOptions');
				myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutBillAddress');
				myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutShipAddress');
				myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutShipMethods');
				myControl.ext.convertSessionToOrder.calls.showCheckoutForm.init();  //handles all calls.
				myControl.model.dispatchThis('immutable');
				},

//generate the list of existing addresses (for users that are logged in )
//appends addresses to a fieldset based on TYPE (bill or ship)
			addressListOptions : function(TYPE)	{
//				myControl.util.dump("BEGIN sharedCheckoutUtilities.addressListOptions ("+TYPE+")");
				var r = '';  //used for what is returned
				var a; //a paticular address, set once within the loop. shorter that myControl.data... each reference
				var parentDivId = TYPE=="bill" ? 'chkoutBillAddressFieldset' : 'chkoutShipAddressFieldset'; //the div id where r will be put
				
				var selAddress = false; //selected address. if one has already been selected, it's used. otherwise, _is_default is set as value.
								
				if(!TYPE) {r = false}
				else if($.isEmptyObject(myControl.data.buyerAddressList) || $.isEmptyObject(myControl.data.buyerAddressList['@'+TYPE])) {
					r = false
					}
				else	{
//if an address has already been selected, highlight it.  if not, use default.
					if(myControl.util.isSet(myControl.data.cartItemsList.cart['data.selected_'+TYPE.toLowerCase()+'_id']))	{
//						myControl.util.dump(' -> address what previously selected.');
						selAddress = myControl.data.cartItemsList.cart['data.selected_'+TYPE.toLowerCase()+'_id'];								
						}
					else	{
						selAddress = myControl.sharedCheckoutUtilities.fetchPreferredAddress(TYPE);
						}
					var L = myControl.data.buyerAddressList['@'+TYPE].length;

//					myControl.util.dump(" -> selectedAddressID = "+selAddress);
					for(var i = 0; i < L; i += 1)	{
						a = myControl.data.buyerAddressList['@'+TYPE][i];
//						myControl.util.dump(" -> ID = "+a['_id']);
						r += "<address class='pointer ui-state-default ";
//if an address has already been selected, add appropriate class.
						if(selAddress == a['_id'])	{
//							myControl.util.dump(" -> MATCH!");
							r += ' ui-state-active';
							}
//if no predefined address is selected, add approriate class to account default address
						else if(a['_is_default'] == 1 && selAddress == false)	{
							r += ' ui-state-active ';
//							myControl.util.dump(" -> no address selected. using default. ");
							}
							
						r += "' data-addressClass='"+TYPE+"' data-addressId='"+a['_id']+"' onClick='myControl.ext.convertSessionToOrder.utilities.selectPredefinedAddress(this);' id='"+TYPE+"_address_"+a['_id']+"'>";
						r +=a[TYPE+'_firstname']+" "+a[TYPE+'_lastname']+"<br \/>";
						r +=a[TYPE+'_address1']+"<br \/>";
						if(a[TYPE+'_address2'])
							r +=a[TYPE+'_address2']+"<br \/>";
						r += a[TYPE+'_city'];
//state, zip and country may not be populated. check so 'undef' isn't written to screen.
						if(a[TYPE+'_state'])
							r += " "+a[TYPE+'_state']+", ";
						if(a[TYPE+'_zip'])
							r +=a[TYPE+'_zip']
						if(myControl.util.isSet(a[TYPE+'_country']))
							r += "<br \/>"+a[TYPE+'_country'];					
						r += "<\/address>";
						}
					r += "<address class='pointer' onClick='$(\"#"+TYPE+"AddressUL\").toggle(true); myControl.ext.convertSessionToOrder.utilities.removeClassFromChildAddresses(\""+parentDivId+"\");'>Enter new address or edit selected address<\/address>";
					r += "<div class='clearAll'><\/div>";
					}
				return r;
				}, //addressListOptions



//will get the items from a cart and return them as links. used for social marketing.
			cartContentsAsLinks : function(datapointer)	{
//				myControl.util.dump('BEGIN convertSessionToOrder.utilities.cartContentsAsLinks.');
//				myControl.util.dump(' -> datapointer = '+datapointer);
				var r = "";
				var L = myControl.model.countProperties(myControl.data[datapointer].cart.stuff);
//				myControl.util.dump(' -> # items in cart: '+L);
				for(var i = 0; i < L; i += 1)	{
//					myControl.util.dump(' -> sku = '+myControl.data[datapointer].cart.stuff[i].sku);
//skip coupons.
					if(myControl.data[datapointer].cart.stuff[i].sku[0] != '%')	{
						r += "http://"+myControl.vars.sdomain+"/product/"+myControl.data[datapointer].cart.stuff[i].sku+"/\n";
						}
					}
//				myControl.util.dump('links = '+r);
				return r;
				}, //cartContentsAsLinks


//this is a function so that it can be more easily overridden/customized.
			cartIsEmptyWarning : function()	{
//				myControl.util.dump(' -> checkout clicked but cart empty message appeared. GA Event here. Maybe we add a link to old checkout too.'); //add GA event or zoovy error pixel track code %%%.



_gaq.push(['_trackEvent','Checkout','App Event','Empty Cart Message Displayed']);


				$('#'+myControl.ext.convertSessionToOrder.vars.containerID).empty().append("<p>It appears your cart is empty. If you think you are receiving this message in error, please contact the site administrator.<\/p>");					
				}, //cartIsEmptyWarnin

				
//if checkout succeded but payment failed (cash, cc fail, PO, etc) then this function gets executed.
			checkoutSuccessPaymentFailure : function(paycode,payby)	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.utilities.checkoutSuccessPaymentFailure');
				myControl.util.dump(' -> paycode = '+paycode);
				myControl.util.dump(' -> payby = '+payby);
				var r;

/*
0 = success (unequivicable)
1 = pending
4 = got money, but its under review. this is legacy from before fraud status was added. not used much. treat as zero.

payment_success will be undef if fail.
payment_success will be set to payment_status. CC
*/

		
		if(typeof paycode == 'undefined')	{
					switch(payby)	{
						case 'CREDIT':
							r = "There was a problem processing your credit card. Please contact us or click here for details.";
							break;
						default:
							r = 'Payment is still required for this order. Please click here for details.'; //rather than replicate all the sysmessages, we'll direct traffic to the invoice page. 
						}

_gaq.push(['_trackEvent','Checkout','User Event','Payment failure ('+payby+')']);
_gaq.push(['_trackEvent','Checkout','App Event','Payment failure']);
					
					}
				
				return r;
				}, //checkoutSuccessPaymentFailure


// not used yet. can/will be used for cross selling
			getProdDataForCartItems : function()	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.utilities.getProdDataForCartItems');
				var L = myControl.model.countProperties(myControl.data.cartItemsList.cart.stuff); //# of items in cart.
				myControl.util.dump(' -> # items in cart: '+L);
				
				for(i = 0; i < L; i += 1)	{
					myControl.calls.getQuickProd('getProduct|'+myControl.data.cartItemsList.cart.stuff[i].sku);
					}
				}, //getProdDataForCartItems




//run when a payment method is selected. updates cart/session and adds a class to the radio/label.
//will also display additional information based on the payment type (ex: purchase order will display PO# prompt and input)
			updatePayDetails : function(paymentID)	{
				myControl.util.dump(" -> PAYID = "+paymentID);
//				var paymentID = $("[name='chkout.payby']:checked").val(), o = '';
				$('#chkoutPayOptionsFieldsetErrors').empty().hide(); //clear any existing errors from previously selected payment method.
				$('#chkout-payOptions li .paycon').removeClass('ui-state-active ui-corner-top ui-corner-bottom');
				$('#chkout-payOptions .paybySupplemental').hide(); //hide all other payment messages/fields.
				$('#payby_'+paymentID+' .paycon').addClass('ui-state-active ui-corner-top');
				$('#paybySupplemental_'+paymentID).show();
				
				var $selectedPayment = $('#paybySupplemental_'+paymentID);
	//only add the 'subcontents' once. if it has already been added, just display it (otherwise, toggling between payments will duplicate all the contents)
				if($selectedPayment.length == 0)	{
					$selectedPayment = $("<ul />").attr("id","paybySupplemental_"+paymentID).addClass("paybySupplemental noPadOrMargin noListStyle ui-widget-content ui-corner-bottom");
					$('#payby_'+paymentID).append($selectedPayment);
					var o = '';
					var safeid;
					switch(paymentID)	{
//for credit cards, we can't store the # or cid in local storage. Save it in memory so it is discarded on close, reload, etc
//expiration is less of a concern
						case 'CREDIT':
							o = "<li><label for='payment-cc'>Credit Card #<\/label><input type='text' size='20' name='payment.cc' id='payment-cc' class=' creditCard' value='";
							if(myControl.ext.convertSessionToOrder.vars['payment.cc']){o += myControl.ext.convertSessionToOrder.vars['payment.cc']}
							o += "' onKeyPress='return myControl.util.numbersOnly(event);' onChange='myControl.ext.convertSessionToOrder.vars[\"payment.cc\"] = this.value' /><\/li>";
							o += "<li><label>Expiration<\/label><select name='payment.mm' id='payment-mm' class='creditCardMonthExp' onChange='myControl.ext.convertSessionToOrder.vars[\"payment.mm\"] = this.value;'><option><\/option>";
							o += myControl.util.getCCExpMonths(myControl.data.cartItemsList.cart['payment.mm']);
							o += "<\/select>";
							o += "<select name='payment.yy' id='payment-yy' class='creditCardYearExp' onChange='myControl.ext.convertSessionToOrder.vars[\"payment.yy\"] = this.value;'><option value=''><\/option>"+myControl.util.getCCExpYears(myControl.data.cartItemsList.cart['payment.yy'])+"<\/select><\/li>";
							o += "<li><label for='payment.cv'>CVV/CID<\/label><input type='text' size='8' name='payment.cv' id='payment-cv' class=' creditCardCVV' onKeyPress='return myControl.util.numbersOnly(event);' value='";
							if(myControl.ext.convertSessionToOrder.vars['payment.cv']){o += myControl.ext.convertSessionToOrder.vars['payment.cv']}
							o += "' onChange='myControl.ext.convertSessionToOrder.vars[\"payment.cv\"] = this.value' /> <span class='ui-icon ui-icon-help' onClick=\"$('#cvvcidHelp').dialog({'modal':true,height:400,width:550});\"></span><\/li>";
							break;
	
						case 'PO':
							o = "<li><label for='payment-po'>PO #<\/label><input type='text' size='2' name='payment.po' id='payment-po' class=' purchaseOrder' onChange='myControl.calls.cartSet.init({\"payment.po\":this.value});' value='";
							if(myControl.data.cartItemsList.cart['payment.po'])
									o += myControl.data.cartItemsList.cart['payment.po'];
							o += "' /><\/li>";
							break;
	
						case 'ECHECK':
							for(var key in myControl.ext.convertSessionToOrder.vars.echeck) {
								safeid = myControl.util.makeSafeHTMLId(key);
//the info below is added to the pdq but not immediately dispatched because it is low priority. this could be changed if needed.
								o += "<li><label for='"+safeid+"'>"+myControl.ext.convertSessionToOrder.vars.echeck[key]+"<\/label><input type='text' size='2' name='"+key+"' id='"+safeid+"' class=' echeck' onChange='myControl.calls.cartSet.init({\""+key+"\":this.value});' value='";
								if(myControl.data.cartItemsList.cart[key])
									o += myControl.data.cartItemsList.cart[key];
								o += "' /><\/li>";
								}
							break;
						default:
//no supplemental material is present. hide it so no styling shows up. add bottom corners to payment method for consistency (with shipping). corners added on supplemental, when present.
							$('#payby_'+paymentID+' .paycon').addClass('ui-corner-bottom');
							$('#paybySupplemental_'+paymentID).hide(); 
							o = '';
						}
					$selectedPayment.append(o);
					}

	//			myControl.util.dump('END myControl.ext.convertSessionToOrder.utilities.updatePayDetails. paymentID = '+paymentID);			
_gaq.push(['_trackEvent','Checkout','User Event','Payment method selected ('+paymentID+')']);
				}, //updatePayDetails


//used to display errors that are returned on the validateCheckout call if validation fails. 
//this is executed from a callback. It's here in case it's needed in multiple callbacks.
			showServerErrors : function(responseData,uuid)	{
				if(responseData['@issues'])	{
					var L = responseData['@issues'].length;
	//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.utilities.showServerErrors. there are '+L+' errors');
					var $errorDiv = responseData['_rtag'].targetID ? $('#'+responseData['_rtag'].targetID) : $('#chkoutSummaryErrors')
					$errorDiv.empty();
					if($errorDiv.length == 0)
						$errorDiv = $("<p \/>").attr("id","chkoutSummaryErrors").addClass("zwarn displayNone").prependTo($('#zCheckoutFrm'));
					var o = "<ul>"; //responseData['_msg_1_txt']+
					
					for(var i = 0; i < L; i += 1)	{
						o += "<li>"+responseData['@issues'][i][3]+"<\/li>";
						}
					o += "<\/ul>";
					$errorDiv.append(myControl.util.formatMessage({"message":o,"uiClass":"error","uiIcon":"alert"})).toggle(true);
					}
				else	{
					myControl.util.handleErrors(responseData,uuid)
					}
				}, //showServerErrors




//panel value could be:  chkoutBillAddress, chkoutShipAddress
//the legend and error ul are here because this is what is used to set the panels to 'loading' when a request is made.
//adding the error container allows errors to be added while the ajax request is still in progress or finished but content hasn't been added yet.
//basically, guarantees the existence of the error container.
			handlePanel : function(panel,hidden)	{
//				myControl.util.dump("BEGIN convertSessionToOrder.panels.handlePanel");
//				myControl.util.dump(" -> panel: "+panel);
//				myControl.util.dump(" -> hidden: "+hidden);
				var cssClass = hidden == true ? 'displayNone' : ''; //if hidden is enabled, add the displayNone class. used for ship address, for example 

//here for troubleshooting.

//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.utilities.handlePanel.');
//				myControl.util.dump(' -> panel = '+panel);
//				myControl.util.dump(' -> hidden = '+hidden);
//				myControl.util.dump(' -> cssClass = '+cssClass);

//output which is automatically added to each panel. Used for title and error handling.
				var o = "<legend id='"+panel+"Legend' class='ui-widget-header ui-corner-all'>"+myControl.ext.convertSessionToOrder.vars.legends[panel]+"<\/legend>";
				o += "<div id='"+panel+"FieldsetErrors'><\/div>";
//if the panel doesn't already exist, create it.
				if(!$('#'+panel+'Fieldset').length > 0) {
//					myControl.util.dump(' -> panel does not exist');
					$('#zCheckoutFrm').append("<fieldset id='"+panel+"Fieldset' class='ui-widget ui-widget-content ui-corner-all loadingBG "+cssClass+"'>"+o+"<\/fieldset>");
					}
				else{
//					myControl.util.dump(' -> panel exists');
					$('#'+panel+'Fieldset').empty().addClass(' ui-widget ui-widget-content ui-corner-all loadingBG '+cssClass).append(o);
					}
//				myControl.util.dump('END myControl.ext.convertSessionToOrder.utilities.handlePanel.');				
				}, //handlePanel






//run when a shipping method is selected. updates cart/session and adds a class to the radio/label
//the dispatch occurs where/when this function is executed, NOT as part of the function itself.
			updateShipMethod : function(shipID,safeID)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.utilities.');	
//				myControl.util.dump('value = '+shipID);	
				myControl.calls.cartSet.init({'ship.selected_id':shipID});
				myControl.ext.convertSessionToOrder.calls.getCartContents.init('updateCheckoutOrderContents'); //update cart totals to reflect new ship method selected.
				myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutPayOptions');  //empty panel and set to loading
				myControl.ext.convertSessionToOrder.calls.appPaymentMethods.init("updateCheckoutPayOptions"); //updates payment panel (pay methods may change based on shipping method)
//on radio buttons, a safe id is passed in reference to the container li for style manipulation.
//if the safeid isn't passed, we're likely in a select list or some other format where style changes are not needed.
				if(safeID)	{
					$("#chkout-shipMethods li").removeClass("selected ui-state-active ui-corner-all");
					$('.shipcon_'+safeID).addClass('selected ui-state-active ui-corner-all');
					}

_gaq.push(['_trackEvent','Checkout','User Event','Shipping method selected ('+shipID+')']);


//				myControl.util.dump('END myControl.checkoutFunctions.ShipMethod. shipID = '+shipID);			
				}, //updateShipMethod


//is run when an existing address is selected.
//removes 'selected' class from all other addresses in fieldset.
//sets 'selected' class on focus address
//executes call which updates form fields.
//x = element object (this)
			selectPredefinedAddress : function(addressObject)	{
//				myControl.util.dump("BEGIN myControl.ext.convertSessionToOrder.utilities.selectPredefinedAddress");
				var $x = $(addressObject);
				var addressClass = $x.attr('data-addressClass'); //ship or bill

				$("#"+addressClass+"AddressUL").toggle(false); //turns off display of new address form
				
				myControl.ext.convertSessionToOrder.utilities.removeClassFromChildAddresses($x.parent().attr('id'));
				$x.addClass('selected  ui-state-active ui-corner-all');
//wtf? when attempting to pass {"data."+addressClass+"_id" : $x.attr('data-addressId')} directly into the setSession function, it barfed. creating the object then passing it in works tho. odd.
				var idObj = {};
				idObj["data.selected_"+addressClass+"_id"] = $x.attr('data-addressId');  //for whatever reason, using this as the key in the setsession function caused a js error. set data.bill_id/data.ship_id = DEFAULT (or whatever the address id is)
				
//				myControl.util.dump(" -> addressClass = "+addressClass);
//				myControl.util.dump(" -> addressID = "+$x.attr('data-addressId'));
//add this to the pdq
				myControl.calls.cartSet.init(idObj);

//copy the billing address from the ID into the form fields.
				myControl.sharedCheckoutUtilities.setAddressFormFromPredefined(addressClass,$x.attr('data-addressId'));
				$('#data-bill_email').val() == myControl.data.cartItemsList.cart['data.bill_email']; //for passive, need to make sure email is updated too.
//copy all the billing address fields to the shipping address fields, if appropriate.
				if($('#chkout-bill_to_ship').val() == '1') {
					myControl.sharedCheckoutUtilities.setShipAddressToBillAddress();
					}
/*
rather than going through and picking out just the address fields, send everything up.
This was done because it is:
1. lighter
2. one more way of collecting as much of the data as possible in case checkout is abandoned.
*/
				myControl.ext.convertSessionToOrder.calls.saveCheckoutFields.init(); 

//for billing addresses, the payment panel must be updated.
				if(addressClass == 'bill')	{
					myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutPayOptions'); //empty panel. set to loading.
					myControl.ext.convertSessionToOrder.calls.appPaymentMethods.init("updateCheckoutPayOptions");
					}
//for shipping addresses, the shipping methods panel needs updating. if predefined addresses exist, no 'ship to bill' checkbox appears.
				else if(addressClass == 'ship')	{
					myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutShipMethods'); //empty panel. set to loading.
					myControl.ext.convertSessionToOrder.calls.cartShippingMethodsWithUpdate.init("updateCheckoutShipMethods"); //update shipping methods and shipping panel
					}
				else	{
					myControl.util.dump(" -> UNKNOWN class for address selection. should be bill or ship. is: "+addressClass);
					}

				myControl.ext.convertSessionToOrder.calls.getCartContents.init('updateCheckoutOrderContents');  //updates cart object and reloads order contents panel.
				myControl.model.dispatchThis('immutable');

_gaq.push(['_trackEvent','Checkout','User Event','Pre-defined address selected ('+addressClass+')']);


				}, //selectPredefinedAddress


//executed when the 'bill to ship' checkbox is checked (either on or off)
			toggleShipAddressPanel : function()	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.utilities.toggleShipAddressPanel');
//ship to billing
				if($('#chkout-bill_to_ship_cb').is(':checked')) {
					myControl.util.dump(' -> bill to ship IS checked (hide shipping address panel)');
					$('#chkoutShipAddressFieldset').toggle(false); //disable display of ship address panel.
					$('#chkout-bill_to_ship').val('1');  //update hidden input. this is what is actually used in ajax request.
					myControl.sharedCheckoutUtilities.setShipAddressToBillAddress(); //update all shipping address fields from bill address.
					myControl.ext.convertSessionToOrder.calls.saveCheckoutFields.init(); //update session. all fields are updated because shipping address fields were populated.
					myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutShipMethods');  //empties panel. sets to loading.
					myControl.ext.convertSessionToOrder.calls.cartShippingMethodsWithUpdate.init("updateCheckoutShipMethods"); //update shipping methods and shipping panel
					myControl.ext.convertSessionToOrder.calls.getCartContents.init('updateCheckoutOrderContents');  //updates cart object and reloads order contents panel.
					}
//do not ship to billing
				else {
					myControl.util.dump('bill to ship is NOT checked (show shipping address panel)');
					myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutShipAddress');  //empties panel. sets to loading.
					$('#chkoutShipAddressFieldset').toggle(true);  //make sure panel is visible.
					myControl.ext.convertSessionToOrder.panelContent.shipAddress(); //populate panel.
					$('#chkout-bill_to_ship').val("0");  //update hidden input. this is what is actually used in ajax request.
					myControl.calls.cartSet.init({"chkout.bill_to_ship":"0"}); //update session.
					};
				myControl.model.dispatchThis('immutable');
				}, //toggleShipAddressPanel

/*
CHANGE LOG: 2012-04-04
addressFieldUpdated was changed in such a way that the zip and country inputs should NOT have recalculateShipMethods on them anymore IF addressFieldUpdated is present (bill inputs).
ship inputs or other inputs that do NOT have the addressFieldUpdated function executed can still use recalculateShipMethods directly. SUCR should be blank or false for these instances.

addressFieldUpdated should now also have the fieldID passed in. ex:
myControl.ext.convertSessionToOrder.utilities.addressFieldUpdated(this.id);

this change was made to reduce duplicate requests AND solve an issue where the session wasn't being updated prior to new ship/pay methods being requested.
recalculateShipMethods function was also modified to support SUCR var.
handleBill2Ship function added.
*/


//executed when any billing address field is updated so that tax is accurately computed/recomputed and displayed in the totals area.
			addressFieldUpdated : function(fieldID)	{
				myControl.util.dump("BEGIN myControl.ext.convertSessionToOrder.utilities.addressFieldUpdated");
				var SUCR = false; //Sesion Updated. Cart Requested. set to true if these conditions are met so that no duplicate calls are created.
//these changes need to be made before				

				this.handleBill2Ship(); //will set ship vars if bill to ship is checked.
				if(myControl.ext.convertSessionToOrder.utilities.taxShouldGetRecalculated())	{
					myControl.util.dump(" -> saveCheckoutFields originated from addressFieldUpdated");
					myControl.ext.convertSessionToOrder.calls.saveCheckoutFields.init(); //update session with ALL populated fields.
					myControl.ext.convertSessionToOrder.calls.getCartContents.init('updateCheckoutOrderContents');
					SUCR = true;
					}
//when zip or country is updated, we may need to recalculate the ship methods.
				if(fieldID.indexOf('zip') > 0 || fieldID.indexOf('country') > 0)	{
					var TYPE = fieldID.indexOf('ship') > 0 ? 'ship' : 'bill';
					myControl.util.dump(" -> type: "+TYPE);
					this.recalculateShipMethods(TYPE,SUCR);
					}

				
				}, //addressFieldUpdated

//if bill to ship is true, then the ship zip and country fields are updated to make sure API doesn't get confused.
//ok. odd. bill_to_ship is checkout var, but shouldn't it be ship to bill? I'll leave my var as is to be consistent.
			handleBill2Ship : function()	{
				var billToShip = ($('#chkout-bill_to_ship').val())*1;
				if(billToShip) {
					myControl.util.dump(" -> billToShip is true. update ship inputs with current zip/country.");
					myControl.sharedCheckoutUtilities.setShipAddressToBillAddress(); //update all shipping address fields from bill address.
//					$('#data-ship_zip').val($('#data-bill_zip').val());
//					$('#data-ship_country').val($('#data-bill_country').val());
					}
				myControl.util.dump(" -> handleBill2Ship val: "+billToShip);
				return billToShip;
				},


//for tax to accurately be computed, several fields may be required.
//this function checks to see if they're populated and, if so, returns true.
//also used in cartPaypalSetExpressCheckout call to determine whether or not address should be requested on paypal side or not.
			taxShouldGetRecalculated : function()	{
				myControl.util.dump("BEGIN myControl.ext.convertSessionToOrder.utilities.taxShouldGetRecalculated");
				var r = true;//what is returned. set to false if errors > 0
				var errors = 0; //used to track number of fields not populated.
				
				if(!$('#data-bill_address1').val())	{
					myControl.util.dump(" -> address is blank");
					errors += 1;
					}
				if(!$('#data-bill_city').val()){
					myControl.util.dump(" -> city is blank");
					errors += 1;
					}
				if(!$('#data-bill_state').val()){
					myControl.util.dump(" -> state is blank");
					errors += 1;
					}
				if(!$('#data-bill_zip').val()){
					myControl.util.dump(" -> zip is blank");
					errors += 1;
					}
				if(!$('#data-bill_country').val()){
					myControl.util.dump(" -> country is blank");
					errors += 1;
					}
				if(errors > 0)	{
					r = false;
					}
				if(r)	{


_gaq.push(['_trackEvent','Checkout','App Event','Gathered enough input to display tax']);

					}
				myControl.util.dump(" -> tax should be recalculated = "+r);
				myControl.util.dump("END myControl.ext.convertSessionToOrder.utilities.taxShouldGetRecalculated");
				return r;
				}, //taxShouldGetRecalculated


//Executed when the bill or ship fields for zip or country are updated.
//will always update the cart object with both the billing and shipping zip and country
//will use billing zip/country to update shipping if ship to billing is checked.
//ship is updated also to make sure we always get the correct shipping rates.
			recalculateShipMethods : function(TYPE,SUCR)	{
				
				var billToShip = this.handleBill2Ship(); //will return a 1 if billToShip is checked.

				if(TYPE == 'bill' && billToShip == 0)	{
//when billing is updated and bill to ship is NOT checked, no need to do any ajax update or panel update.
					myControl.util.dump(" -> bill zip/country changed, but ship to billing is NOT checked, so no update needed.");
					}
				else	{
//to get here, type = ship OR (type = bill AND ship to bill is checked)
					myControl.util.dump(" -> zip/country changed (type = "+TYPE+"). ship to bill = "+billToShip+" and typeof billToShop (should be number) = "+typeof billToShip);
					
/*
in the list of calls below, sequence is important.  The session must be updated first so that all the other calls have accurate data to work with.
the getCartContents call can come second because none of the following calls are updates, just gets.
*/

//save all the checkout fields.  This is cheaper (server side) than doing setSession for several fields according to BH (2012-12-29)
					if(!SUCR)	{
						myControl.util.dump(" -> saveCheckoutFields originated from recalculateShipMethods");
						myControl.ext.convertSessionToOrder.calls.saveCheckoutFields.init();
						myControl.ext.convertSessionToOrder.calls.getCartContents.init('updateCheckoutOrderContents');
						}

//the saveCheckoutFields above this if statement needs to be put in the q prior to the appPaymentMethods below.
					if(billToShip) {
						myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutPayOptions'); //empties panel. sets to loading.
						myControl.ext.convertSessionToOrder.calls.appPaymentMethods.init("updateCheckoutPayOptions");
						}

					myControl.ext.convertSessionToOrder.utilities.handlePanel('chkoutShipMethods'); //empties panel. sets to loading.
					myControl.ext.convertSessionToOrder.calls.cartShippingMethodsWithUpdate.init("updateCheckoutShipMethods");
					
				
					}
				}, //recalculateShipMethods


//will remove the selected and ui-state-active classes from all address elements within the passed parent div id.
			removeClassFromChildAddresses : function(parentDivId)	{
				$('#'+parentDivId+' address').each(function() {
					$(this).removeClass('selected  ui-state-active');
					});				
				} //removeClassFromChildAddresses
			},



////////////////////////////////////   						renderFormats			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



		renderFormats : {
//value is set to ISO and sent to API that way. however, cart object returned is in 'pretty'.
//so a check occurs to set selectedCountry to the selected ISO value so it can be 'selected'
			countriesAsOptions : function($tag,data)	{
//				myControl.util.dump("BEGIN myControl.ext.convertSessionToOrder.renderFormats.countriesAsOptions");
//				myControl.util.dump(" -> Country: "+data.bindData.cleanValue);
				var r = '';
				var L = myControl.data.appCheckoutDestinations['@destinations'].length;
//				myControl.util.dump(" -> number of countries = "+L);
				for(var i = 0; i < L; i += 1)	{
					r += "<option value='"+myControl.data.appCheckoutDestinations['@destinations'][i].ISO+"' ";
					if(data.bindData.cleanValue == myControl.data.appCheckoutDestinations['@destinations'][i].Z)
						r += " selected='selected' ";
					r += ">"+myControl.data.appCheckoutDestinations['@destinations'][i].Z+"</option>";
					}
				
				$tag.html(r);
				},
				
				
			secureLink : function($tag,data)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.renderFormats.secureLink');
//				myControl.util.dump(" -> data.windowName = '"+data.windowName+"'");
//if data.windowName is set, the link will open a new tab/window. otherwise, it just changes the page/tab in focus.
				if(myControl.util.isSet(data.windowName))
					$tag.click(function(){window.open(myControl.vars.secureURL+$.trim(data.value)),data.windowName});
				else
					$tag.click(function(){window.location = myControl.vars.secureURL+$.trim(data.value)});
				}, //secureLink


			orderStatusLink : function($tag,data)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.renderFormats.orderStatusLink');
				var orderSessionID = myControl.data['order|'+data.value].cart.id;
//				https://ssl.zoovy.com/s=sporks.zoovy.com/customer/order/status?cartid=SESSION&orderid=data.value
				$tag.click(function(){window.location = myControl.vars.secureURL+"customer/order/status?cartid="+orderSessionID+"&amp;orderid="+data.value,'orderStatus'});

				
				},

//displays the shipping method followed by the cost.
//is used in cart summary total during checkout.
			shipInfoById : function($tag,data)	{
				var o = '';
//				myControl.util.dump('BEGIN myControl.renderFormats.shipInfo. (formats shipping for minicart)');
//				myControl.util.dump(data);
				var L = myControl.data.cartShippingMethods['@methods'].length;
				for(var i = 0; i < L; i += 1)	{
//					myControl.util.dump(' -> method '+i+' = '+myControl.data.cartShippingMethods['@methods'][i].id);
					if(myControl.data.cartShippingMethods['@methods'][i].id == data.value)	{
						var pretty = myControl.util.isSet(myControl.data.cartShippingMethods['@methods'][i]['pretty']) ? myControl.data.cartShippingMethods['@methods'][i]['pretty'] : myControl.data.cartShippingMethods['@methods'][i]['name'];  //sometimes pretty isn't set. also, ie didn't like .pretty, but worked fine once ['pretty'] was used.
						o = "<span class='orderShipMethod'>"+pretty+": <\/span>";
//only show amount if not blank.
						if(myControl.data.cartShippingMethods['@methods'][i].amount)	{
							o += "<span class='orderShipAmount'>"+myControl.util.formatMoney(myControl.data.cartShippingMethods['@methods'][i].amount,' $',2,false)+"<\/span>";
							}
						break; //once we hit a match, no need to continue. at this time, only one ship method/price is available.
						}
					}
				$tag.html(o);
				}, //shipInfoById

			shipMethodsAsOptions : function($tag,data)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.formats.shipMethodsAsOptions');
				var o = '';
				var L = data.value.length;

				var id,isSelectedMethod,safeid,shipName;  // id is actual ship id. safeid is id without any special characters or spaces. isSelectedMethod is set to true if id matches cart shipping id selected.
				for(var i = 0; i < L; i += 1)	{
					isSelectedMethod = false;
					safeid = myControl.util.makeSafeHTMLId(data.value[i].id);
					id = data.value[i].id;

//whether or not this iteration is for the selected method should only be determined once, but is used on a couple occasions, so save to a var.
					if(id == myControl.data.cartItemsList.cart['ship.selected_id'])	{
						isSelectedMethod = true;
						}

//myControl.util.dump(' -> id = '+id+' and ship.selected_id = '+myControl.data.cartItemsList.cart['ship.selected_id']);
					
					shipName = myControl.util.isSet(data.value[i].pretty) ? data.value[i].pretty : data.value[i].name
					
					o += "<option "
					if(isSelectedMethod)
						o+= " selected='selected' ";
					o += " value = '"+id+"' id='ship-selected_id_"+safeid+"' >"+shipName+" - "+myControl.util.formatMoney(data.value[i].amount,'$','',false)+"<\/option>";
					}
				$tag.html(o);
				},


			shipMethodsAsRadioButtons : function($tag,data)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.formats.shipMethodsAsRadioButtons');
				var o = '';
				var shipName;
				var L = data.value.length;


				var id,safeid;  // id is actual ship id. safeid is id without any special characters or spaces. isSelectedMethod is set to true if id matches cart shipping id selected.
				var isSelectedMethod = false;
				if(L == 1)	{
					isSelectedMethod = data.value[0].id; //will make the ship method 'selected' if it's the only choice.
					}
				for(var i = 0; i < L; i += 1)	{
					
					safeid = myControl.util.makeSafeHTMLId(data.value[i].id);
					id = data.value[i].id;

//whether or not this iteration is for the selected method should only be determined once, but is used on a couple occasions, so save to a var.
					if(id == myControl.data.cartItemsList.cart['ship.selected_id'])	{
						isSelectedMethod = true;
						}

//myControl.util.dump(' -> id = '+id+' and ship.selected_id = '+myControl.data.cartItemsList.cart['ship.selected_id']);
					
					shipName = myControl.util.isSet(data.value[i].pretty) ? data.value[i].pretty : data.value[i].name
					
					o += "<li class='shipcon "
					if(isSelectedMethod)
						o+= ' ui-state-active selected ui-corner-all ';
					o += "shipcon_"+safeid; //hhhmmm... seems to cause issues sometimes. add it last so ui-state-active and selected always get added.
					o += "'><input type='radio' name='ship.selected_id' id='ship-selected_id_"+safeid+"' value='"+id+"' onClick='myControl.ext.convertSessionToOrder.utilities.updateShipMethod(this.value,\""+safeid+"\"); myControl.model.dispatchThis(\"immutable\"); '";
					if(isSelectedMethod)
						o += " checked='checked' "
					o += "/><label for='ship-selected_id_"+safeid+"'>"+shipName+": <span >"+myControl.util.formatMoney(data.value[i].amount,'$','',false)+"<\/span><\/label><\/li>";
					isSelectedMethod = false;
					}
				$tag.html(o);
				},


			payMethodsAsRadioButtons : function($tag,data)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.renderFormats.payOptionsAsRadioButtons');
//				myControl.util.dump(data);
				var L = data.value.length;
				var o = "";
				var id = '';
				var isSelectedMethod = false;
				if(L == 1)	{
					isSelectedMethod = data.value[0].id; //will make the ship method 'selected' if it's the only choice.
					}
				
				for(var i = 0; i < L; i += 1)	{
					id = data.value[i].id;
					if(id == myControl.data.cartItemsList.cart['chkout.payby'])	{
						isSelectedMethod = true;
						}
					o += "<li class='paycon_"+id+"' id='payby_"+id+"'><div class='paycon'><input type='radio' name='chkout.payby' id='chkout-payby_"+id+"' value='"+id+"' onClick='myControl.ext.convertSessionToOrder.utilities.updatePayDetails(this.value); myControl.calls.cartSet.init({\"chkout.payby\":this.value}); myControl.model.dispatchThis(\"immutable\"); $(\"#chkoutPayOptionsFieldsetErrors\").addClass(\"displayNone\");' ";
					if(isSelectedMethod)
						o += " checked='checked' "
					o += "/><label for='chkout-payby_"+id+"'>"+data.value[i].pretty+"<\/label></div><\/li>";
					isSelectedMethod = false; //reset on each iteration so 'next' item isn't accidentally set as selected.
					}

				$tag.html(o);
				},


//for displaying order balance in checkout order totals.				
			orderBalance : function($tag,data)	{
				var o = '';
				var amount = data.bindData.cleanValue;
//				myControl.util.dump('BEGIN myControl.renderFunctions.format.orderBalance()');
//				myControl.util.dump('amount * 1 ='+amount * 1 );
//if the total is less than 0, just show 0 instead of a negative amount. zero is handled here too, just to avoid a formatMoney call.
//if the first character is a dash, it's a negative amount.  JS didn't like amount *1 (returned NAN)
				
				o += data.bindData.pretext ? data.bindData.pretext : '';
				
				if(amount * 1 <= 0){
//					myControl.util.dump(' -> '+amount+' <= zero ');
					o += data.bindData.currencySign ? data.bindData.currencySign : '$';
					o += '0.00';
					}
				else	{
//					myControl.util.dump(' -> '+amount+' > zero ');
					o += myControl.util.formatMoney(amount,data.bindData.currencySign,'',data.bindData.hideZero);
					}
				
				o += data.bindData.posttext ? data.bindData.posttext : '';
				
				$tag.text(o);  //update DOM.
//				myControl.util.dump('END myControl.renderFunctions.format.orderBalance()');
				}, //orderBalance
//work in progress
//will show some upselling product.
			accessoryUpsell : function($tag,data)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.renderFormats.accessoryUpsell');
//				myControl.util.dump(data);
/*				var datapointer = 'order|'+data.value; //orderID is data.value
				var r = "";
				var accessories = new Array(); //add all the accessories here.
				var L = myControl.model.countProperties(myControl.data[datapointer].cart.stuff);
				myControl.util.dump(' -> # items in cart: '+L);
//a list of items only needs to be compiled if there's more than 1 item in the cart. otherwise, just use that single items accessories.
				if(L > 1)	{
					
					}
				myControl.util.dump('links = '+r);
				$tag.append(r);
*/				} //accessoryUpsell
			}
		
		}
	return r;
	}