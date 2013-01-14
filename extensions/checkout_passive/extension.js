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

CHECOUT_PASSIVE.JS (just here to make it easier to know which extension is open)

************************************************************** */

var convertSessionToOrder = function() {
	var theseTemplates = new Array("productListTemplateCheckout","checkoutSuccess","checkoutTemplateBillAddress","checkoutTemplateShipAddress","checkoutTemplateOrderNotesPanel","checkoutTemplateCartSummaryPanel","checkoutTemplateShipMethods","checkoutTemplatePayOptionsPanel","checkoutTemplate","invoiceTemplate","productListTemplateInvoice");
	var r = {
	vars : {
		willFetchMyOwnTemplates : true,
		containerID : '',
		legends : {
			"chkoutBillAddress" : "Billing Address",
			"chkoutShipAddress" : "Shipping Address",
			"chkoutShipMethods" : "Shipping Options",
			"chkoutPayOptions" : "Payment Choices",
			"chkoutOrderNotes" : "Order Notes"
			},
//though most extensions don't have the templates specified, checkout does because so much of the code is specific to these templates.
		templates : theseTemplates
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
				app.ext.convertSessionToOrder.vars.containerID = containerID;
				app.ext.convertSessionToOrder.u.createProcessCheckoutModal();

				$('#'+containerID).append(app.renderFunctions.createTemplateInstance('checkoutTemplate','checkoutContainer'));
//some sort of data is needed for the translation, so an empty object is passed in (cart not available yet, potentially)
				app.renderFunctions.translateTemplate({},'checkoutContainer');
// even in passive, this field is needed. Can be set to zero out of the gate. API will return error if not present.
				if(app.u.determineAuthentication() == 'authenticated')	{
					app.u.dump(" -> user is logged in. set account creation hidden input to 0");
					$('#want-create_customer').val(0);
					}
				
//paypal code need to be in this startCheckout and not showCheckoutForm so that showCheckoutForm can be 
// executed w/out triggering the paypal code (which happens when payment method switches FROM paypal to some other method) because
// the paypalgetdetails cmd only needs to be executed once per session UNLESS the cart contents change.
				var token = app.u.getParameterByName('token');
				var payerid = app.u.getParameterByName('PayerID');
				if(token && payerid)	{
					app.u.dump("It appears we've just returned from PayPal.");
					app.ext.convertSessionToOrder.vars['payment-pt'] = token;
					app.ext.convertSessionToOrder.vars['payment-pi'] = payerid;
					app.ext.store_checkout.calls.cartPaymentQ.init({"cmd":"insert","PT":token,"PI":payerid,"TN":"PAYPALEC"},{"extension":"convertSessionToOrder","callback":"handlePayPalIntoPaymentQ"});
					app.calls.refreshCart.init({},'immutable'); //need cart updated with paymentQ for callback on cartPaymentQ above.
					app.model.dispatchThis('immutable');
//					r += app.ext.store_checkout.calls.cartPaypalGetExpressCheckoutDetails.init({'token':token,'payerid':payerid});
					}
//if token and/or payerid is NOT set on URI, then this is either not yet a paypal order OR is/was paypal and user left checkout and has returned.
				else if(app.ext.store_checkout.u.thisSessionIsPayPal())	{
					if(!app.ext.store_checkout.u.aValidPaypalTenderIsPresent())	{app.ext.store_checkout.u.nukePayPalEC();}
					r = app.ext.convertSessionToOrder.calls.showCheckoutForm.init();
					app.model.dispatchThis("immutable");
					}
				else	{
					r = app.ext.convertSessionToOrder.calls.showCheckoutForm.init();
					app.model.dispatchThis("immutable");
					}


				_gaq.push(['_trackEvent','Checkout','App Event','Checkout Initiated']);

				return r; 
				}			
			},
		


//used to save all the populated checkout fields to the cart. 
		saveCheckoutFields : {
			init : function(callback)	{
				this.dispatch(callback);
				return 1;
				},
			dispatch : function(callback)	{
				app.calls.cartSet.init($('#zCheckoutFrm').serializeJSON()); //adds dispatches.
				}
			}, //saveCheckoutFields

		showCheckoutForm : {
			init : function()	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.calls.showCheckoutForm.init');
				$('#chkoutSummaryErrors').empty(); //clear any existing global errors.
				return this.dispatch(); //at least 5 calls will be made here. maybe 6.
				},
			dispatch : function()	{
//r is set to 5 because five of these calls are fixed.
//yes, I could have done a += for each call, but since they're also a guaranteed request, just hard code this. It'll be faster and can always be changed later.
				var r = 5;  
//Do inventory check if inventory matters.
//multiple inv_mode by 1 to treat as number
				if((zGlobals.globalSettings.inv_mode * 1) > 1)	{ 
					r += app.ext.store_checkout.calls.cartItemsInventoryVerify.init("handleInventoryUpdate");
					}
				app.ext.store_checkout.calls.appPaymentMethods.init();
//only send the request for addresses if the user is logged in or the request will return an error.
				if(app.u.determineAuthentication() == 'authenticated')	{
					app.ext.store_checkout.calls.buyerAddressList.init();
					app.ext.store_checkout.calls.buyerWalletList.init();
					}
				app.ext.store_checkout.calls.appCheckoutDestinations.init();
				app.ext.store_checkout.calls.cartShippingMethodsWithUpdate.init();
				app.calls.refreshCart.init({"callback":"loadPanelContent","extension":"convertSessionToOrder"},'immutable');
				return r;
				}
			}, //showCheckoutForm



// formerly updateCartQty
		cartItemUpdate : {
			init : function(stid,qty,tagObj)	{
				app.u.dump('BEGIN app.ext.store_cart.calls.cartItemUpdate.');
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
				var r = 0;
				if(!stid || isNaN(qty))	{
					app.u.dump(" -> cartItemUpdate requires both a stid ("+stid+") and a quantity as a number("+qty+")");
					}
				else	{
					r = 1;
					this.dispatch(stid,qty,tagObj);
					}
				return r;
				},
			dispatch : function(stid,qty,tagObj)	{
//				app.u.dump(' -> adding to PDQ. callback = '+callback)
				app.model.addDispatchToQ({"_cmd":"cartItemUpdate","stid":stid,"quantity":qty,"_tag": tagObj},'immutable');
				app.ext.store_checkout.u.nukePayPalEC(); //require paypal re-authentication anytime the cart is updated.
				}
			 },

			
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
				app.u.dump('BEGIN app.ext.convertSessionToOrder.calls.processCheckout.init');
				$('#modalProcessCheckout').dialog('open');
				$('.appMessaging',$('#modalProcessCheckout')).empty(); //clear messages in the modal itself.
				$('#chkoutSummaryErrors').empty(); //clear any existing global errors. //blank out any existing global errors so that only new error appear.
				$('#returnFromThirdPartyPayment').hide(); //clear previous third party messaging.
				$('#chkoutPlaceOrderBtn').attr('disabled','disabled').addClass('ui-state-disabled '); //disable the button to avoid double-click.

//the buyer could be directed away from the store at this point, so save everything to the session/cart.
				var serializedCheckout = $('#zCheckoutFrm').serializeJSON();
				serializedCheckout['want/bill_to_ship_cb'] = null;  //this isn't a valid checkout field. used only for some logic processing.
				serializedCheckout['payment/cc'] = ''; //cc and cv should never go. They're added as part of cartPaymentQ
				serializedCheckout['payment/cv'] = '';
/* these fields are in checkout/order create but not 'supported' fields. don't send them */				
				delete serializedCheckout['giftcard'];
				delete serializedCheckout['want/bill_to_ship_cb'];
				delete serializedCheckout['coupon'];
				app.calls.cartSet.init(serializedCheckout);

//if paypalEC is selected, skip validation and go straight to paypal. Upon return, bill and ship will get populated automatically.
				if($("#want-payby_PAYPALEC").is(':checked') && !app.ext.convertSessionToOrder.vars['payment-pt'])	{
					$('#modalProcessCheckout').append("<h2>Redirecting to PayPal...</h2>");
					app.ext.store_checkout.calls.cartPaypalSetExpressCheckout.init();
					}
				else	{
					var checkoutIsValid = app.ext.convertSessionToOrder.validate.isValid();
					app.u.dump(' -> checkoutIsValid = '+checkoutIsValid);
					if(checkoutIsValid)	{
						this.dispatch(callback);
						}
					else	{
//originally, instead of attr(disabled,false) i removed the disabled attribute. This didn't work in ios 5 safari.					
						$('#chkoutPlaceOrderBtn').attr('disabled',false).removeClass('ui-state-disabled');
						$('#modalProcessCheckout').dialog('close');
//without this jump, the create order button jumps up slightly. 
//this needs to be at the end so all the content above is manipulated BEFORE jumping to the id. otherwise, the up-jump still occurs.
						app.u.jumpToAnchor('chkoutSummaryErrors');
						}
					}

_gaq.push(['_trackEvent','Checkout','User Event','Create order button pushed (validated = '+checkoutIsValid+')']);
				
				return 1;
				},
			dispatch : function(callback)	{
				app.model.addDispatchToQ({"_cmd":"cartCheckoutValidate","_tag" : {"callback":callback,"extension":"convertSessionToOrder"}},'immutable');
				}
			}
		}, //calls









					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\









	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
		init : {
			onSuccess : function()	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.init.onSuccess');
				var r =false; //returns false if checkout can't load due to account config conflict.
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.init.onSuccess');
//start this process as early as possible. Errors will be reported independantly of init (result of ajax req. for templates).
//SANITY: if you remove the baseURL var from the beginning of this, you'll break 1PC.
				
				if(app.vars._clientid == '1pc')	{
					//Do Nothing.  BAD 1pc, go home.
				}
				else {
					app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/checkout_nice/templates.html',theseTemplates);
				}
				
				var msg = false
				if(!zGlobals || $.isEmptyObject(zGlobals.checkoutSettings))	{
					msg = app.u.errMsgObject("Uh Oh! It appears an error occured. Please try again. If error persists, please contact the site administrator.");
					}
//store configuration is set to require login, which this version of checkout is not compatible with this version of checkout or
//user's store setting is set to request a login, which is not compatible with this version of checkout.
				else if(zGlobals.checkoutSettings.preference_require_login == 1 || zGlobals.checkoutSettings.preference_request_login == 1)	{
					msg = app.u.errMsgObject("Uh Oh! There appears to be an issue with the store configuration. Please change your checkout setting to 'passive' if you wish to use this layout.","MVC-INIT-CHECKOUT_PASSIVE_1000");
					}
				else if(typeof _gaq == 'undefined')	{
					msg = app.u.errMsgObject("Uh Oh! It appears you are not using the Asynchronous version of Google Analytics. It is required to use this checkout.","MVC-INIT-CHECKOUT_PASSIVE_1001");
					}
//messaging for the test harness 'success'.
				else if(app.u.getParameterByName('_testharness'))	{
					msg = app.u.successMsgObject("<strong>Excellent!<\/strong> Your store meets the requirements to use this one page checkout extension.");
					r = true;
					}
				else	{
					r = true;
					}

//display any messaging.
				if(msg)	{
					msg.persistant = true;
					app.u.throwMessage(msg);
					}

				if(r == false)	{
//execute error handling for the extension.
//errors are reported to the screen, but 'other' actions may need to be taken.
					this.onError();
					}

				return r;

				},
			onError : function()	{
				app.u.dump('BEGIN app.ext.convertSessionToOrder.callbacks.init.error');
				//This would be reached if a templates was not defined in the view.
				$('#'+app.ext.convertSessionToOrder.vars.containerID).removeClass('loadingBG');
				}
			}, //init


//SET THIS AS THE CALLBACK ON THE EXTENSION LOADER IF YOU WANT TO IMMEDIATELY START CHECKOUT
		startCheckout : {
			onSuccess : function() {
				app.ext.convertSessionToOrder.calls.startCheckout.init('mainContentArea');
				},
			onError : function() {
//to get here, something catastrophic would have happened and other error messaging would have handled it.
				}
			},

		updateCheckoutShipMethods : {
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.callbacks.updateCheckoutShipMethods.success');
				app.ext.convertSessionToOrder.panelContent.shipMethods();
				},
			onError : function(responseData)	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.callbacks.updateCheckoutShipMethods.onError - ERROR!');
				app.ext.convertSessionToOrder.panelContent.shipMethods(); //reload ship panel or just error shows and there is no way to continue.
				responseData.parentID = 'chkoutShipMethodsFieldsetErrors'
				app.u.throwMessage(responseData);
				}
			},


		
		
		proceedToGoogleCheckout : {
			onSuccess : function(tagObj)	{
				app.u.dump('BEGIN convertSessionToOrder[passive].callbacks.proceedToGoogleCheckout.onSuccess');
				_gaq.push(function() {
					var pageTracker = _gaq._getAsyncTracker();
					setUrchinInputCode(pageTracker);
					});
//				alert(app.data[tagObj.datapointer].URL+"?analyticsdata="+getUrchinFieldValue());
				document.location= app.data[tagObj.datapointer].URL+"&analyticsdata="+getUrchinFieldValue();
				},
			onError : function(responseData,uuid)	{
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled'); // re-enable checkout button on checkout page.
				app.u.throwMessage(responseData);
				}
			},



		handleCartPaypalSetECResponse : {
			onSuccess : function(tagObj)	{
				app.u.dump('BEGIN convertSessionToOrder[nice].callbacks.handleCartPaypalSetECResponse.onSuccess');
				window.location = app.data[tagObj.datapointer].URL
				},
			onError : function(responseData,uuid)	{
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled'); // re-enable checkout button on cart page.
				app.u.throwMessage(responseData);
				}
			},

//mostly used for the error handling.
		handlePayPalIntoPaymentQ : {
			onSuccess : function(tagObj)	{
				app.u.dump('BEGIN convertSessionToOrder[nice].callbacks.handlePayPalIntoPaymentQ.onSuccess');
				app.ext.convertSessionToOrder.calls.showCheckoutForm.init();
				app.model.dispatchThis('immutable');
				},
			onError : function(responseData,uuid)	{
				app.u.dump('BEGIN convertSessionToOrder[nice].callbacks.handlePayPalIntoPaymentQ.onError');
				responseData['_msg_1_txt'] = "It appears something went wrong with the PayPal payment:<br \/>err: "+responseData['_msg_1_txt'];
				responseData.persistant = true;
				app.u.throwMessage(responseData);
//nuke vars so user MUST go thru paypal again or choose another method.
//nuke local copy right away too so that any cart logic executed prior to dispatch completing is up to date.
				app.ext.store_checkout.u.nukePayPalEC();
				app.ext.convertSessionToOrder.calls.showCheckoutForm.init();
				app.model.dispatchThis('immutable');
				}
			},		


	
		addGiftcardToCart : {
			onSuccess : function(tagObj)	{
//after a gift card is entered, update the payment panel as well as the cart/invoice panel.
				app.ext.convertSessionToOrder.panelContent.cartContents();
				app.ext.convertSessionToOrder.panelContent.paymentOptions();
var msg = app.u.successMsgObject('Your gift card has been added.');
msg.parentID = 'giftcardMessaging'
app.u.throwMessage(msg);

//update the panel only on a successful add. That way, error messaging is persistent. success messaging gets nuked, but coupon will show in cart so that's okay.
				app.calls.refreshCart.init({"callback":"updateCheckoutOrderContents","extension":"convertSessionToOrder"},'immutable');
				app.model.dispatchThis('immutable');

_gaq.push(['_trackEvent','Checkout','User Event','Cart updated - giftcard added']);


				},
			onError : function(responseData,uuid)	{
				app.ext.convertSessionToOrder.panelContent.paymentOptions(); //regenerate the panel. need to show something or no payments can be selected.
				responseData.parentID = 'chkoutPayOptionsFieldsetErrors'
				app.u.throwMessage(responseData);
				}
			},//addGiftcardToCart




			
		addCouponToCart : {
			onSuccess : function(tagObj)	{
				app.u.dump('BEGIN control.ext.convertSessionToOrder.callbacks.addcouponToCart.onSuccess');
				$('#addCouponBtn').removeAttr('disabled').removeClass('ui-state-disabled');
				$('#couponCode').val(''); //empty input to allow for, potentially, easier entry of another coupon.
//after a gift card or coupon is entered, update the cart/invoice panel.
var msg = app.u.successMsgObject('Your coupon has been added.');
msg.parentID = 'couponMessaging'
app.u.throwMessage(msg);

_gaq.push(['_trackEvent','Checkout','User Event','Cart updated - coupon added']);
//update the panel only on a successful add. That way, error messaging is persistent. success messaging gets nuked, but coupon will show in cart so that's okay.
				app.calls.refreshCart.init({"callback":"updateCheckoutOrderContents","extension":"convertSessionToOrder"},'immutable');
				app.model.dispatchThis('immutable');

				},
			onError : function(responseData)	{
				app.u.dump('BEGIN app.ext.convertSessionToOrder.callbacks.addcouponToCart.onError');
				$('#addCouponBtn').removeAttr('disabled').removeClass('ui-state-disabled');
				responseData.parentID = 'couponMessaging'
				app.u.throwMessage(responseData);
				}
			},//addcouponToCart




//executing this will not only return which items have had an inventory update (in a pretty format) but also create the dispatches
// to update the cart and then to actually update it as well.
// the individual cart update posts (there may be multiple) go without the callback. If callback is added, a ping to execute it is run.
		handleInventoryUpdate : {

				onSuccess : function(tagObj)	{

//					app.u.dump('BEGIN app.ext.convertSessionToOrder.callbacks.handleInventoryUpdate.onSuccess');
					var r = false; //if false is returned, then no inventory update occured.
	//				var L = app.model.countProperties(app.data[tagObj.datapointer]);
					if(!$.isEmptyObject(app.data[tagObj.datapointer]) && !$.isEmptyObject(app.data[tagObj.datapointer]['%changes']))	{
						app.u.dump(' -> adjustments are present');
						r = "<div id='inventoryErrors'>It appears that some inventory adjustments needed to be made:<ul>";
						for(var key in app.data[tagObj.datapointer]['%changes']) {
							r += "<li>sku: "+key+" was set to "+app.data[tagObj.datapointer]['%changes'][key]+" due to availability<\/li>";
							app.ext.convertSessionToOrder.calls.cartItemUpdate.init({"stid":key,"quantity":app.data[tagObj.datapointer]['%changes'][key]});
							}
						r += "<\/ul><\/div>";
						
						
						$('#globalMessaging').toggle(true).append(app.u.formatMessage({'message':r,'uiIcon':'alert'}));

						}


_gaq.push(['_trackEvent','Checkout','App Event','Cart updated - inventory adjusted to reflect availability']);

					return r;
					
					},
				onError : function(responseData,uuid)	{
					app.ext.convertSessionToOrder.panelContent.paymentOptions();
//global errors are emptied when 'complete order' is pushed, so do not empty in the responses or any other errors will be lost.
					app.u.throwMessage(responseData);
					}
				},	//handleInventoryUpdate


		updateCheckoutPayOptions : {
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.callbacks.updateCheckoutPayOptions.success');
				app.ext.convertSessionToOrder.panelContent.paymentOptions();
				},
			onError : function(responseData,uuid)	{
				app.ext.convertSessionToOrder.panelContent.paymentOptions();  //reload panel or just error shows and user can't proceed.
				responseData.parentID = 'chkoutPayOptionsFieldsetErrors'
				app.u.throwMessage(responseData);
				}
			},

		updateCheckoutOrderContents : {
			onSuccess : function(){
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.callbacks.updateCheckoutOrderContents.success (updating cart panel)');
				app.ext.convertSessionToOrder.panelContent.cartContents();
				},
			onError : function(responseData,uuid)	{
				app.ext.convertSessionToOrder.panelContent.cartContents();  //reload panel so more than just error shows up and user can proceed/try again.
				responseData.parentID = 'chkoutSummaryErrors'
				app.u.throwMessage(responseData);
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
				app.u.dump('BEGIN app.ext.convertSessionToOrder.callbacks.finishedValidatingCheckout.onSuccess');
				$('#modalProcessCheckout').append("<h2>Creating Order...</h2>");
//okay, now build the paymentQ. This will add 1 payment to the Q. Giftcards et all will be handled by now.
				app.ext.store_checkout.u.buildPaymentQ();
				app.ext.store_checkout.calls.cartOrderCreate.init("checkoutSuccess");

				app.model.dispatchThis('immutable');


_gaq.push(['_trackEvent','Checkout','App Event','Server side validation passed']);


				},
			onError : function(responseData,uuid)	{
				$('#modalProcessCheckout').dialog('close');
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled '); //make place order button appear and be clickable.
				responseData['_rtag'] = $.isEmptyObject(responseData['_rtag']) ? {} : responseData['_rtag'];
				responseData['_rtag'].targetID = 'chkoutSummaryErrors';
				app.ext.store_checkout.u.showServerErrors(responseData,uuid);
				
_gaq.push(['_trackEvent','Checkout','App Event','Server side validation failed']);


				}
			},


		loadPanelContent : {
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN convertSessionToOrder.callbacks.loadPanelContent.onSuccess');

//had some issues using length. these may have been due to localStorage/expired cart issue. countProperties is more reliable though, so still using that one.			
				var itemsCount = app.model.countProperties(app.data.cartDetail['@ITEMS']);
				if(itemsCount > 0)	{
					
//						app.u.dump(' -> authentication passed. Showing panels.');
//						app.u.dump(' -> want/bill_to_ship = '+app.data.cartDetail['want/bill_to_ship']);
//create panels. notes and ship address are hidden by default.
//ship address will make itself visible if user is authenticated.
					app.ext.convertSessionToOrder.u.handlePanel('chkoutBillAddress');

//bill to ship will be set to zero if user has disabled it, otherwise it will be 1 or undef.
					app.ext.convertSessionToOrder.u.handlePanel('chkoutShipAddress',Number(app.data.cartDetail['want/bill_to_ship']) == 0 ? false : true)

					app.ext.convertSessionToOrder.u.handlePanel('chkoutShipMethods'); 
					app.ext.convertSessionToOrder.u.handlePanel('chkoutPayOptions');
					app.ext.convertSessionToOrder.u.handlePanel('chkoutOrderNotes',true);						
//populate panels.						
					app.ext.convertSessionToOrder.panelContent.cartContents();
					app.ext.convertSessionToOrder.panelContent.billAddress();

					app.ext.convertSessionToOrder.panelContent.shipAddress();
					app.ext.convertSessionToOrder.panelContent.shipMethods();
					app.ext.convertSessionToOrder.panelContent.paymentOptions();
//if order notes is on, show panel and populate content.
					if(zGlobals.checkoutSettings.chkout_order_notes == true)	{
						app.ext.convertSessionToOrder.panelContent.orderNotes();
						$('#chkoutOrderNotes').toggle(true); 
						}
						

_gaq.push(['_trackEvent','Checkout','Milestone','Valid email address obtained']);


					}//ends 'if' for whether cart has more than zero items in it.
				else	{
					app.u.dump(" -> cart has no contents: "+app.sessionid);
					_gaq.push(['_trackEvent','Checkout','App Event','Empty Cart Message Displayed']);
					app.u.throwMessage("It appears your cart is empty. If you think you are receiving this message in error, please contact the site administrator.");				
					}
				$('#'+app.ext.convertSessionToOrder.vars.containerID).removeClass('loadingBG');
				
//will lock many input fields so they match the paypal response (ship address, shipping, etc).
//needs to executed in here instead of in a callback for the payalget because the get is only run once per cart/session (unless cart is changed)
//but checkout may get load/reloaded and if the cart hasn't changed, the forms still need to be 'locked'.
//needs to run at the end here so that all the dom manipulating is done prior so function can 'lock' fields
				if(app.ext.store_checkout.u.thisSessionIsPayPal())	{
					app.ext.convertSessionToOrder.u.handlePaypalFormManipulation();
					}

				
				},
			onError : function(responseData,uuid)	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.callbacks.loadPanelContent.onError.');
				$('#globalMessaging').append({"message":"It appears something has gone very wrong. Please try again. If error persists, please contact the site administrator.","uiClass":"error","uiIcon":"alert"})
				app.u.throwMessage(responseData);
				}
			
			},//loadPanelContent

/*
this callback is executed after a successful checkout.  'success' is defined as an order created, the order may contain 'payment required' warnings.
this is what would traditionally be called an 'invoice' page, but certainly not limited to just showing the invoice.
*/
		checkoutSuccess : {
			onSuccess : function(tagObj)	{
				app.u.dump('BEGIN app.ext.convertSessionToOrder.callbacks.checkoutSuccess.onSuccess   datapointer = '+tagObj.datapointer);
//empty old form content. not needed anymore. gets replaced with invoice-ish content.
				var $zContent = $('#'+app.ext.convertSessionToOrder.vars.containerID).empty();
				var oldSession = app.sessionId;
				var orderID = app.data[tagObj.datapointer].orderid;

				app.u.jumpToAnchor(app.ext.convertSessionToOrder.vars.containerID);
//this generates the post-checkout message from the template in the view file.
				$zContent.append(app.renderFunctions.createTemplateInstance('checkoutSuccess','checkoutSuccessContent')); 
				app.renderFunctions.translateTemplate(app.data[tagObj.datapointer],'checkoutSuccessContent');
				
				$('#modalProcessCheckout').dialog('close');
				
// ### test this before switching back.
//				$zContent.append(app.renderFunctions.transmogrify('checkoutSuccess','checkoutSuccessContent',app.data[tagObj.datapointer]))

/*
note - the click prevent default is because the renderFormat adds an onclick that passes both order and cart id.
*/
				$('.paymentRequired').append(app.data[tagObj.datapointer].payment_status_detail).find('a').click(function(event){event.preventDefault();});

//				$('.paymentRequired').append(app.ext.store_checkout.u.checkoutSuccessPaymentFailure(app.data[tagObj.datapointer].payment_success,app.data['order|'+orderID].cart['want/payby']));
				
				
				
				var cartContentsAsLinks = encodeURI(app.ext.store_checkout.u.cartContentsAsLinks('order|'+orderID))
				
				$('.ocmTwitterComment').click(function(){
					window.open('http://twitter.com/home?status='+cartContentsAsLinks,'twitter');
					_gaq.push(['_trackEvent','Checkout','User Event','Tweeted about order']);
					});
//the fb code only works if an appID is set, so don't show banner if not present.				
				if(zGlobals.thirdParty.facebook.appId)	{
					$('.ocmFacebookComment').click(function(){
						app.thirdParty.fb.postToWall(cartContentsAsLinks);
						_gaq.push(['_trackEvent','Checkout','User Event','FB message about order']);
						});
					}
				else	{$('.ocmFacebookComment').addClass('displayNone')}

				app.calls.appCartCreate.init(); //!IMPORTANT! after the order is created, a new cart needs to be created and used. the old cart id is no longer valid. 
				app.calls.refreshCart.init({},'immutable'); //!IMPORTANT! will reset local cart object. 
				app.model.dispatchThis('immutable'); //these are auto-dispatched because they're essential.
				


_gaq.push(['_trackEvent','Checkout','App Event','Order created']);
_gaq.push(['_trackEvent','Checkout','User Event','Order created ('+orderID+')']);


				var L = app.ext.store_checkout.checkoutCompletes.length;
				for(var i = 0; i < L; i += 1)	{
					app.ext.store_checkout.checkoutCompletes[i]({'sessionID':oldSession,'orderID':orderID,'datapointer':tagObj.datapointer});
					}

				$('#invoiceContainer').append(app.renderFunctions.transmogrify({'id':'invoice_'+orderID,'orderid':orderID},'invoiceTemplate',app.data['order|'+orderID]));

//add the html roi to the dom. this likely includes tracking scripts. LAST in case script breaks something.
setTimeout("$('#"+app.ext.convertSessionToOrder.vars.containerID+"').append(app.data['"+tagObj.datapointer+"']['html:roi']); app.u.dump('wrote html:roi to DOM.');",2000); 

				},
			onError : function(responseData,uuid)	{
				app.u.dump('BEGIN app.ext.convertSessionToOrder.callbacks.checkoutSuccess.onError ['+uuid+']');
//				app.u.dump(responseData);
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled '); //make place order button appear and be clickable.
				$('#modalProcessCheckout').dialog('close');
				responseData['_rtag'] = $.isEmptyObject(responseData['_rtag']) ? {} : responseData['_rtag'];
				responseData['_rtag'].targetID = 'chkoutSummaryErrors';
//				app.ext.store_checkout.u.showServerErrors(responseData,uuid);
				responseData.persistant = true; //don't collapse these messages.
				app.u.throwMessage(responseData);

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
				var $globalErrors = $('#chkoutSummaryErrors').empty();
				var r = true;
				var sum = 0;
				sum += this.chkoutShipMethodsFieldset(); //app.u.dump('ship methods done. sum = '+sum);
				sum += this.chkoutPayOptionsFieldset(); //app.u.dump('pay options done. sum = '+sum);
				sum += this.chkoutBillAddressFieldset(); //app.u.dump('bill address done. sum = '+sum);
				sum += this.chkoutShipAddressFieldset(); //app.u.dump('ship address done. sum = '+sum);

				app.u.dump('END app.ext.convertSessionToOrder.validate.isValid. sum = '+sum);
				if(sum != 4)	{
					r = false;
					$globalErrors.append(app.u.formatMessage({"message":"Some required fields were left blank or contained errors. (please scroll up)","uiClass":"error","uiIcon":"alert"})).toggle(true);
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
				var $shipMethod = $('[name="want/shipping_id"]:checked');
				$('#chkoutShipMethodsFieldsetErrors').empty().toggle(false);
				if($shipMethod.val())	{
//					app.u.dump(' -> ship method validated');
					$('#chkoutShipMethodsFieldset').addClass('validatedFieldset');
					}
				else	{
					valid = 0;
					$('#chkoutShipMethodsFieldsetErrors').toggle(true).append(app.u.formatMessage("Please select a shipping method."));
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
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.validate.chkoutPayOptionsFieldset');
				var $payMethod = $("[name='want/payby']:checked");
				var $errorDiv = $('#chkoutPayOptionsFieldsetErrors').empty().toggle(false);
				var errMsg = '';
				var safeid,$holder;
				if($payMethod.val())	{
					switch($payMethod.val())	{
//for payment supplemental, can't use required='required' because they're not removed from the DOM if the user switches from echeck to cc (and at that point, they're no longer required						
						case 'CREDIT':
							var $paymentCC = $('#payment-cc').removeClass('mandatory');
							var $paymentMM = $('#payment-mm').removeClass('mandatory');
							var $paymentYY = $('#payment-yy').removeClass('mandatory');
							var $paymentCV = $('#payment-cv').removeClass('mandatory');
							if(!app.u.isValidCC($paymentCC.val())){$paymentCC.parent().addClass('mandatory'); valid = 0; errMsg += '<li>please enter a valid credit card #<\/li>'}
							if(!app.u.isValidMonth($paymentMM.val())){$paymentMM.parent().addClass('mandatory'); valid = 0; errMsg += '<li>please select an exipration month<\/li>'}
							if(!app.u.isValidCCYear($paymentYY.val())){$paymentYY.parent().addClass('mandatory'); valid = 0; errMsg += '<li>please select an expiration year<\/li>'}
							if($paymentCV.val().length < 3){$paymentCV.parent().addClass('mandatory'); valid = 0; errMsg += '<li>please enter a cvv/cid #<\/li>'}
							break;

						case 'ECHECK':
							$('#paymentea').parent().removeClass('mandatory');
							$('#paymenter').parent().removeClass('mandatory');
							$('#paymenten').parent().removeClass('mandatory');
							$('#paymenteb').parent().removeClass('mandatory');
							$('#paymentes').parent().removeClass('mandatory');
							$('#paymentei').parent().removeClass('mandatory');
							if(!$('#paymentEA').val())	{valid = 0; errMsg += '<li>please enter account #<\/li>'; $('#paymentEA').parent().addClass('mandatory')}
							if(!$('#paymentER').val())	{valid = 0; errMsg += '<li>please enter routing #<\/li>'; $('#paymentER').parent().addClass('mandatory')}
							if(!$('#paymentEN').val())	{valid = 0; errMsg += '<li>please enter account name<\/li>'; $('#paymentEN').parent().addClass('mandatory')}
							if(!$('#paymentEB').val())	{valid = 0; errMsg += '<li>please enter bank name<\/li>'; $('#paymentEB').parent().addClass('mandatory')}
							if(!$('#paymentES').val())	{valid = 0; errMsg += '<li>please enter bank state<\/li>'; $('#paymentES').parent().addClass('mandatory')}
							if(!$('#paymentEI').val())	{valid = 0; errMsg += '<li>please enter check #<\/li>'; $('#paymentEI').parent().addClass('mandatory')}
							break;

						
						case 'PO':
							var $paymentPO = $('#payment-po').removeClass('mandatory');
							if(!app.u.isSet($paymentPO.val())){$paymentPO.parent().addClass('mandatory'); valid = 0; errMsg += '<li>please enter a PO #<\/li>'}
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
//					app.u.dump(' -> payment options did not pass validation');
					$errorDiv.toggle(true).append(app.u.formatMessage(errMsg));
					}
				else{
//					app.u.dump(' -> payment options passed validation');
					$('#chkoutPayOptionsFieldset').addClass('validatedFieldset');



_gaq.push(['_trackEvent','Checkout','Milestone','Payment method validated ('+$payMethod.val()+')']);



					}
//				app.u.dump('END app.ext.convertSessionToOrder.validate.chkoutPayOptionsFieldset. paymethod = '+$payMethod.val()+' and valid = '+valid);
				return valid;
				}, //chkoutPayOptionsFieldset
				
			chkoutBillAddressFieldset: function()	{
				app.u.dump("BEGIN passive.validate.chkoutBillAddressFieldset");
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
					$('#chkoutBillAddressFieldsetErrors').append(app.u.formatMessage("Some required fields were left blank or are invalid")).toggle(true);
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
				if($('#want-bill_to_ship_cb').is(':checked')) {
					app.ext.store_checkout.u.setShipAddressToBillAddress();
					}
				else	{
					r = this.addressIsPopulated('ship');
					}

				if(r)	{
					$('#chkoutShipAddressFieldset').addClass('validatedFieldset');
					}
				else	{
					valid = 0;
					$('#chkoutShipAddressFieldsetErrors').append(app.u.formatMessage("Some required fields were left blank or are invalid")).toggle(true);
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
//type = ship or bill/ will validate the respective address entered in checkout.
			addressIsPopulated : function(TYPE)	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.validate.address');
//				app.u.dump(' -> TYPE = '+TYPE);
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
//state is only validated if country is US (not all countries have a state/province selection
				if($country.val() == 'US' && $state.val().length < 2)	{
					$state.parent().addClass('mandatory'); r = false;
					}
				
				if(TYPE=="bill")	{
					var $email = $('#data-bill_email');
					if($email.val() == '')	{
	//						app.u.dump(' -> email is blank');
						$email.parent().addClass('mandatory');
						$errorDiv.append(app.u.formatMessage("Please provide an email address")).toggle(true);
						app.ext.convertSessionToOrder.vars.validPreflight = 0;
						r = false;
						}
					else if(!app.u.isValidEmail($email.val()))	{
	//						app.u.dump(' -> email is not valid');
						$errorDiv.append(app.u.formatMessage("Please provide a valid email address")).toggle(true);
						$email.parent().addClass('mandatory');
						r = false;
						}
					
					}
				
				if(zGlobals.checkoutSettings.chkout_phone == 'REQUIRED'){
//					app.u.dump(' -> phone number IS required');
					var $phone = $('#data-'+TYPE+'_phone').removeClass('mandatory');
					if(app.u.isValidPhoneNumber($phone.val(),$country.val()) == true)	{
//						app.u.dump(' -> phone number IS valid');
						//don't override what r is already set to if this validates. only override if it DOESN'T validate.
						}
					else if(TYPE == 'ship' && ($('#data-bill_phone').val()))	{
						//set the shipping phone to the billing phone to expedite checkout.
							$phone.val($('#data-bill_phone').val())
						}
					else	{
//						app.u.dump(' -> phone number is NOT valid');
						$errorDiv.append(app.u.formatMessage("Please provide a valid phone number with area code."));
						$phone.parent().addClass('mandatory');
						r = false;
						}
					}
				
				
				if(!app.u.isValidPostalCode($zip.val(),$country.val())){$zip.parent().addClass('mandatory'); r = false;}
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
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.panelContent.billAddress.  ');
				var data = app.data.cartDetail;
//				app.u.dump(data);
				var txt = '';
				var cssClass; //used to hide the form inputs if user is logged in and has predefined addresses. inputs are still generated so user can create a new address.
			 	var authState = app.u.determineAuthentication();
				if(authState == 'authenticated' && app.ext.store_checkout.u.buyerHasPredefinedAddresses('bill') == true)	{
//					app.u.dump(" -> user is logged in AND has predefined billing address(es)");
					txt = "<span class='addressListPrompt'>Please choose from (click on) billing address(es) below:<\/span>";
					txt += app.ext.store_checkout.u.addressListOptions('bill'); // creates pre-defined address blocks.
					cssClass = 'displayNone';
					}
				
//troubleshooting IE issues, so saved to var instead of manipulating directly. may not need this, but test in IE if changed.
				var $panelFieldset = $("#chkoutBillAddressFieldset").removeClass("loadingBG").append("<p>"+txt+"<\/p>");
//				app.u.dump(" -> transmogrify billing address.");
				$panelFieldset.append(app.renderFunctions.transmogrify({'id':'billAddressUL'},'checkoutTemplateBillAddress',app.data.cartDetail))
				
				$('#billAddressUL').addClass(cssClass);

//update form elements based on cart object.
				if(authState == 'authenticated' && app.ext.store_checkout.u.addressListOptions('ship') != false)	{
//					app.u.dump(' -> user is logged in and has predefined shipping addresses so bill to ship not displayed.');
					$("#want-bill_to_ship_cb").removeAttr("checked");
					$("#want-bill_to_ship").val('0');
					$("#want-bill_to_ship_cb_container").toggle(false);
					}
				else if(app.data.cartDetail['want/bill_to_ship']*1 == 0)	{
//					app.u.dump(' -> bill to ship is disabled ('+app.data.cartDetail['want/bill_to_ship']+')');
					$("#want-bill_to_ship_cb").removeAttr("checked");
					$("#want-bill_to_ship").val('0');
					}
				else	{
//					app.u.dump(' -> bill to ship is enabled ('+app.data.cartDetail['want/bill_to_ship']+')');
					$("#want-bill_to_ship").val('1');
					$("#want-bill_to_ship_cb").attr("checked","checked");
					}
				
//from a usability perspective, we don't want a single item select list to show up. so hide if only 1 or 0 options are available.
				if(app.data.appCheckoutDestinations['@destinations'].length < 2)
					$('#billCountryContainer').toggle(false);

//				app.u.dump('END app.ext.convertSessionToOrder.panelContent.billAddress.');
				}, //billAddress
				
				
			shipAddress : function()	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.panelContent.shipAddress.  ');
				var txt = '';
				var cssClass = '';  //used around the form fields. turned off if pre-defined addresses exist, but form is still generated so a new address can be added.
				var $panelFieldset = $("#chkoutShipAddressFieldset");
				
				if(app.u.determineAuthentication() == 'authenticated' && app.ext.store_checkout.u.addressListOptions('ship') != false)	{
					app.u.dump(' -> user is authenticated and has predefined shipping addressses.');
// for existing customers/addresses, there is a default bill and a default ship address that could be different. So, the checkbox for bill to ship is NOT checked and the ship address panel is displayed.
					$panelFieldset.toggle(true); //toggles the panel on.
					txt = "<p class='addressListPrompt'>Please choose from (click on) shipping address(es) below:<\/p>";
					txt += app.ext.store_checkout.u.addressListOptions('ship'); // creates pre-defined address blocks.
					cssClass = 'displayNone'; 
					}

				$panelFieldset.removeClass('loadingBG').append(txt);
				$panelFieldset.append(app.renderFunctions.transmogrify({'id':'shipAddressUL'},'checkoutTemplateShipAddress',app.data.cartDetail))
				
				$('#shipAddressUL').addClass(cssClass); //address form is hidden if user is logged in, in favor of clickable predefined addresses.

//from a usability perspective, we don't want a single item select list to show up. so hide if only 1 or 0 options are available.
				if(app.data.appCheckoutDestinations['@destinations'].length < 2)
					$('#shipCountryContainer').toggle(false);
				
				}, //shipAddress


			shipMethods : function()	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.panelContent.shipMethods');

				var $panelFieldset = $("#chkoutShipMethodsFieldset").removeClass("loadingBG");
				$panelFieldset.append(app.renderFunctions.createTemplateInstance('checkoutTemplateShipMethods','shipMethodsContainer'));
				app.renderFunctions.translateTemplate(app.data.cartDetail,'shipMethodsContainer');

//must appear after panel is loaded because otherwise the divs don't exist.
//per brian, use shipping methods in cart, not in shipping call.
				if(app.data.cartDetail['@SHIPMETHODS'].length == 0)	{
					$('#noShipMethodsAvailable').toggle(true);
					}
				else if(!$('#data-bill_zip').val() && !$('ship_zip').val()) {
					$('#noZipShipMessage').toggle(true);
					}

/*
it's possible that a ship method is set in the cart that is no longer available.
this could happen if 'local pickup' is selected, then country,zip,state, etc is changed to a destination where local pickup is not available.
in these instances, the selected method in the cart/memory/local storage must get emptied.
Of course, this should only happen IF a method was selected previously.
*/
				var foundMatchingShipMethodId = false; 
				var L = app.data.cartShippingMethods['@methods'].length;
				for(var i = 0; i < L; i += 1)	{
					if(app.data.cartShippingMethods['@methods'][i].id == app.data.cartDetail['want/shipping_id'])	{
						foundMatchingShipMethodId = true;
						break; //once a match is found, no need to continue the loop.
						}
					}

				if(foundMatchingShipMethodId == false && app.data.cartDetail['want/shipping_id'])	{
					app.u.dump(' -> previously selected ship method is no longer available. update session with null value.');
					app.calls.cartSet.init({"want/shipping_id":null});  //the set will update the method, session and local storage.
					app.calls.refreshCart.init({"callback":"updateCheckoutOrderContents","extension":"convertSessionToOrder"},'immutable');
					app.model.dispatchThis('immutable');
					}
					
				}, //shipMethods




//displays the cart contents in a non-editable format	
			cartContents : function()	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.panelContent.cartContents');
				var $container = $('#chkoutCartSummaryContainer').toggle(true); //make sure panel is visible.

/*
checkoutCartSummary is the id given once the 'container' template has been rendered. It only needs to be rendered once. 
 -> this is more efficient. This also solves any error handling issues where the dom isn't updated prior to error messaging being added (the div may not exist yet).
two of it's children are rendered each time the panel is updated (the prodlist and cost summary)
*/
				if($('#chkoutCartSummary').length == 0)	{
//					app.u.dump(" -> chkoutCartSummary has no children. render entire panel.");
					$container.append(app.renderFunctions.createTemplateInstance('checkoutTemplateCartSummaryPanel','chkoutCartSummary'));
					}
				$('#checkoutStuffList').empty(); //since the template isn't getting generated empty each time, the item list must be manually emptied (or it will be appended to)
//SANITY -> yes, the template only needs to be added once (above) but it needs to be translated each time this function is executed.
				app.renderFunctions.translateTemplate(app.data.cartDetail,'chkoutCartSummary');
				


				}, //cartContents



			paymentOptions : function()	{
//				app.u.dump('app.ext.convertSessionToOrder.panelContent.paymentOptions has been executed');
				var $panelFieldset = $("#chkoutPayOptionsFieldset").toggle(true).removeClass("loadingBG")
				$panelFieldset.append(app.renderFunctions.createTemplateInstance('checkoutTemplatePayOptionsPanel','payOptionsContainer'));
				app.renderFunctions.translateTemplate(app.data.appPaymentMethods,'payOptionsContainer');	
				app.ext.convertSessionToOrder.u.updatePayDetails(app.ext.convertSessionToOrder.vars['want/payby']);
				}, //paymentOptions
		
		
/*
the notes textarea will create a dispacth for the contents when they're updated, but it doesn't send.
after using it, too frequently the dispatch would get cancelled/dominated by another dispatch.
*/
			orderNotes : function()	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.panelContent.orderNotes');
				var $panelFieldset = $("#chkoutOrderNotesFieldset").toggle(true).removeClass("loadingBG")
				$panelFieldset.append(app.renderFunctions.createTemplateInstance('checkoutTemplateOrderNotesPanel','orderNotesContainer'));
				app.renderFunctions.translateTemplate(app.data.cartDetail,'orderNotesContainer');
//				app.u.dump('END app.ext.convertSessionToOrder.panelContent.orderNotes');
				} //orderNotes



			}, //panelContent
	



////////////////////////////////////   						util [u]			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
//when a country is selected, the required attribute must be added or dropped from state/province.
//this is important because the browser itself will indicate which fields are required.
//some countries do not have state/province, so for international it is automatically not required.
			countryChange : function(type,country)	{
//				app.u.dump('BEGIN convertSessionToOrder.u.countryChange. type: '+type+' and country: '+country)
				if(country == 'US')	{
					$('#data-'+type+'_state').attr('required','required');
					}
				else	{
					app.u.dump(' -> got here: '+type);
					$('#data-'+type+'_state').removeAttr('required').parent().removeClass('mandatory');
					}
				},



			createProcessCheckoutModal : function()	{
				
				var $parent = $('#modalProcessCheckout');
//the modal opens as quick as possible so users know something is happening.
//open if it's been opened before so old data is not displayed. placeholder content (including a loading graphic, if set) will be populated pretty quick.
				if($parent.length == 0)	{
					$parent = $("<div \/>").attr({"id":"modalProcessCheckout"}).appendTo('body');
					
					$parent.html("<div class='appMessaging clearfix'><\/div><div class='loadingBG floatLeft'><\/div><h2>Validating...<\/h2>")
					$parent.dialog({
						modal: true,
						autoOpen:false,
						width:550,
						height:350,
						"title":"Processing Checkout:" //title gets changed as order goes through stages
						});  //browser doesn't like percentage for height
					}
			
				},

//executed when a coupon is submitted. handles ajax call for coupon and also updates cart.
			handleCouponSubmit : function()	{
				$('#chkoutSummaryErrors').empty(); //remove any existing errors.
				$('#addCouponBtn').attr('disabled','disabled').addClass('ui-state-disabled ');
				app.ext.store_checkout.calls.cartCouponAdd.init($('#couponCode').val(),{"callback":'addCouponToCart',"extension":"convertSessionToOrder"}); 
				app.model.dispatchThis('immutable');
				}, //handleCouponSubmit

//executed when a giftcard is submitted. handles ajax call for giftcard and also updates cart.
//no 'loadingbg' is needed on button because entire panel goes to loading onsubmit.
//panel is reloaded in case the submission of a gift card changes the payment options available.
			handleGiftcardSubmit : function()	{
				app.ext.store_checkout.calls.cartGiftcardAdd.init($('#giftcardCode').val(),{"callback":'addGiftcardToCart',"extension":"convertSessionToOrder"}); 
				app.ext.store_checkout.calls.appPaymentMethods.init();
				app.ext.convertSessionToOrder.u.handlePanel('chkoutPayOptions');
				app.model.dispatchThis('immutable');
				}, //handleGiftcardSubmit
			

			handleChangeFromPayPalEC : function()	{
				app.ext.store_checkout.u.nukePayPalEC(); //kills all local and session paypal payment vars
				app.ext.convertSessionToOrder.u.handlePanel('chkoutPayOptions');
				app.ext.convertSessionToOrder.u.handlePanel('chkoutBillAddress');
				app.ext.convertSessionToOrder.u.handlePanel('chkoutShipAddress');
				app.ext.convertSessionToOrder.u.handlePanel('chkoutShipMethods');
				app.ext.convertSessionToOrder.calls.showCheckoutForm.init();  //handles all calls.
				app.model.dispatchThis('immutable');
				},




//run when a payment method is selected. updates cart/session and adds a class to the radio/label. does NOT generate the list of radio buttons.
//will also display additional information based on the payment type (ex: purchase order will display PO# prompt and input)
			updatePayDetails : function(paymentID)	{
//				app.u.dump(" -> PAYID = "+paymentID);
//				var paymentID = $("[name='want/payby']:checked").val(), o = '';
				$('#chkoutPayOptionsFieldsetErrors').empty().hide(); //clear any existing errors from previously selected payment method.
				$('#chkout-payOptions li .paycon').removeClass('ui-state-active ui-corner-top ui-corner-bottom');
				$('#chkout-payOptions .paybySupplemental').hide(); //hide all other payment messages/fields.
				$('#payby_'+paymentID+' .paycon').addClass('ui-state-active ui-corner-top');
				$('#paybySupplemental_'+paymentID).show();
				
				var $selectedPayment = $('#paybySupplemental_'+paymentID);
//only add the 'subcontents' once. if it has already been added, just display it (otherwise, toggling between payments will duplicate all the contents)
				if($selectedPayment.length == 0)	{
//					app.u.dump(" -> supplemental is empty. add if needed.");
					var supplementalOutput = app.u.getSupplementalPaymentInputs(paymentID,app.ext.convertSessionToOrder.vars); //this will either return false if no supplemental fields are required, or a jquery UL of the fields.
//					app.u.dump("typeof supplementalOutput: "+typeof supplementalOutput);
					if(typeof supplementalOutput == 'object')	{
//						app.u.dump(" -> getSupplementalPaymentInputs returned an object");
						supplementalOutput.addClass(' noPadOrMargin noListStyle ui-widget-content ui-corner-bottom');
						$('#payment-mm, #payment-cc, #payment-yy, #payment-cv, #payment-po, #paymentea, #paymenter, #paymenten, #paymenteb, #paymentes, #paymentei',supplementalOutput).change(function(){
							app.ext.convertSessionToOrder.vars[$(this).attr('name')] = $(this).val(); //use name (which conforms to cart var, not id, which is websafe and slightly different 
							})
						$('#payby_'+paymentID).append(supplementalOutput);
						}
					}

	//			app.u.dump('END app.ext.convertSessionToOrder.u.updatePayDetails. paymentID = '+paymentID);			
_gaq.push(['_trackEvent','Checkout','User Event','Payment method selected ('+paymentID+')']);
				}, //updatePayDetails


//used to display errors that are returned on the validateCheckout call if validation fails. 



//panel value could be:  chkoutBillAddress, chkoutShipAddress
//the legend and error ul are here because this is what is used to set the panels to 'loading' when a request is made.
//adding the error container allows errors to be added while the ajax request is still in progress or finished but content hasn't been added yet.
//basically, guarantees the existence of the error container.
			handlePanel : function(panel,hidden)	{
//				app.u.dump("BEGIN convertSessionToOrder.panels.handlePanel");
//				app.u.dump(" -> panel: "+panel);
//				app.u.dump(" -> hidden: "+hidden);
				var cssClass = hidden == true ? 'displayNone' : ''; //if hidden is enabled, add the displayNone class. used for ship address, for example 

//here for troubleshooting.

//				app.u.dump('BEGIN app.ext.convertSessionToOrder.u.handlePanel.');
//				app.u.dump(' -> panel = '+panel);
//				app.u.dump(' -> hidden = '+hidden);
//				app.u.dump(' -> cssClass = '+cssClass);

//output which is automatically added to each panel. Used for title and error handling.
				var o = "<legend id='"+panel+"Legend' class='ui-widget-header ui-corner-all'>"+app.ext.convertSessionToOrder.vars.legends[panel]+"<\/legend>";
				o += "<div id='"+panel+"FieldsetErrors'><\/div>";
//if the panel doesn't already exist, create it.
				if(!$('#'+panel+'Fieldset').length > 0) {
//					app.u.dump(' -> panel does not exist');
					$('#zCheckoutFrm').append("<fieldset id='"+panel+"Fieldset' class='ui-widget ui-widget-content ui-corner-all loadingBG "+cssClass+"'>"+o+"<\/fieldset>");
					}
				else{
//					app.u.dump(' -> panel exists');
					$('#'+panel+'Fieldset').empty().addClass(' ui-widget ui-widget-content ui-corner-all loadingBG '+cssClass).append(o);
					}
//				app.u.dump('END app.ext.convertSessionToOrder.u.handlePanel.');				
				}, //handlePanel






//run when a shipping method is selected. updates cart/session and adds a class to the radio/label
//the dispatch occurs where/when this function is executed, NOT as part of the function itself.
			updateShipMethod : function(shipID,safeID)	{
				app.u.dump('BEGIN app.ext.convertSessionToOrder.u.');	
				app.u.dump('value = '+shipID);	
				app.calls.cartSet.init({'want/shipping_id':shipID});
				app.calls.refreshCart.init({"callback":"updateCheckoutOrderContents","extension":"convertSessionToOrder"},'immutable'); //update cart totals to reflect new ship method selected.
				app.ext.convertSessionToOrder.u.handlePanel('chkoutPayOptions');  //empty panel and set to loading
				app.ext.store_checkout.calls.appPaymentMethods.init("updateCheckoutPayOptions"); //updates payment panel (pay methods may change based on shipping method)
//on radio buttons, a safe id is passed in reference to the container li for style manipulation.
//if the safeid isn't passed, we're likely in a select list or some other format where style changes are not needed.
				if(safeID)	{
					$("#chkout-shipMethods li").removeClass("selected ui-state-active ui-corner-all");
					$('.shipcon_'+safeID).addClass('selected ui-state-active ui-corner-all');
					}

_gaq.push(['_trackEvent','Checkout','User Event','Shipping method selected ('+shipID+')']);


//				app.u.dump('END app.checkoutFunctions.ShipMethod. shipID = '+shipID);			
				}, //updateShipMethod





//executed when the 'bill to ship' checkbox is checked (either on or off)
			toggleShipAddressPanel : function()	{
				app.u.dump('BEGIN app.ext.convertSessionToOrder.u.toggleShipAddressPanel');
//ship to billing
				if($('#want-bill_to_ship_cb').is(':checked')) {
					app.u.dump(' -> bill to ship IS checked (hide shipping address panel)');
					$('#chkoutShipAddressFieldset').toggle(false); //disable display of ship address panel.
					$('#want-bill_to_ship').val('1');  //update hidden input. this is what is actually used in ajax request.
					app.ext.store_checkout.u.setShipAddressToBillAddress(); //update all shipping address fields from bill address.
					app.ext.convertSessionToOrder.calls.saveCheckoutFields.init(); //update session. all fields are updated because shipping address fields were populated.
					app.ext.convertSessionToOrder.u.handlePanel('chkoutShipMethods');  //empties panel. sets to loading.
					app.ext.store_checkout.calls.cartShippingMethodsWithUpdate.init("updateCheckoutShipMethods"); //update shipping methods and shipping panel
					app.calls.refreshCart.init({"callback":"updateCheckoutOrderContents","extension":"convertSessionToOrder"},'immutable');  //updates cart object and reloads order contents panel.
					}
//do not ship to billing
				else {
					app.u.dump('bill to ship is NOT checked (show shipping address panel)');
					app.ext.convertSessionToOrder.u.handlePanel('chkoutShipAddress');  //empties panel. sets to loading.
					$('#chkoutShipAddressFieldset').toggle(true);  //make sure panel is visible.
					app.ext.convertSessionToOrder.panelContent.shipAddress(); //populate panel.
					$('#want-bill_to_ship').val("0");  //update hidden input. this is what is actually used in ajax request.
					app.calls.cartSet.init({"want/bill_to_ship":"0"}); //update session.
					};
				app.model.dispatchThis('immutable');
				}, //toggleShipAddressPanel

/*
CHANGE LOG: 2012-04-04
addressFieldUpdated was changed in such a way that the zip and country inputs should NOT have recalculateShipMethods on them anymore IF addressFieldUpdated is present (bill inputs).
ship inputs or other inputs that do NOT have the addressFieldUpdated function executed can still use recalculateShipMethods directly. SUCR should be blank or false for these instances.

addressFieldUpdated should now also have the fieldID passed in. ex:
app.ext.convertSessionToOrder.u.addressFieldUpdated(this.id);

this change was made to reduce duplicate requests AND solve an issue where the session wasn't being updated prior to new ship/pay methods being requested.
recalculateShipMethods function was also modified to support SUCR var.
handleBill2Ship function added.
*/


//executed when any billing address field is updated so that tax is accurately computed/recomputed and displayed in the totals area.
			addressFieldUpdated : function(fieldID)	{
//				app.u.dump("BEGIN app.ext.convertSessionToOrder.u.addressFieldUpdated");
				var SUCR = false; //Sesion Updated. Cart Requested. set to true if these conditions are met so that no duplicate calls are created.
//these changes need to be made before				

				this.handleBill2Ship(); //will set ship vars if bill to ship is checked.
				if(app.ext.store_checkout.u.taxShouldGetRecalculated())	{
//					app.u.dump(" -> saveCheckoutFields originated from addressFieldUpdated");
					app.ext.convertSessionToOrder.calls.saveCheckoutFields.init(); //update session with ALL populated fields.
					app.calls.refreshCart.init({"callback":"updateCheckoutOrderContents","extension":"convertSessionToOrder"},'immutable');
					SUCR = true;
					}
//when zip or country is updated, we may need to recalculate the ship methods.
				if(fieldID.indexOf('zip') > 0 || fieldID.indexOf('country') > 0)	{
					var TYPE = fieldID.indexOf('ship') > 0 ? 'ship' : 'bill';
//					app.u.dump(" -> type: "+TYPE);
					this.recalculateShipMethods(TYPE,SUCR);
					}

				
				}, //addressFieldUpdated

//if bill to ship is true, then the ship zip and country fields are updated to make sure API doesn't get confused.
//ok. odd. bill_to_ship is checkout var, but shouldn't it be ship to bill? I'll leave my var as is to be consistent.
			handleBill2Ship : function()	{
				var billToShip = ($('#want-bill_to_ship').val())*1;
				if(billToShip) {
					app.u.dump(" -> billToShip is true. update ship inputs with current zip/country.");
					app.ext.store_checkout.u.setShipAddressToBillAddress(); //update all shipping address fields from bill address.
//					$('#data-ship_zip').val($('#data-bill_zip').val());
//					$('#data-ship_country').val($('#data-bill_country').val());
					}
				app.u.dump(" -> handleBill2Ship val: "+billToShip);
				return billToShip;
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
//			app.u.dump("BEGIN convertSessionToOrder.u.handlePaypalFormManipulation ");
			if(app.data.cartPaypalGetExpressCheckoutDetails && app.data.cartPaypalGetExpressCheckoutDetails['_msgs'])	{
				//an error occured. error message is displayed as part of callback.
				}
			else	{
			$('#returnFromThirdPartyPayment').show();
//when paypal redirects back to checkout, these two vars will be on URI: token=XXXX&PayerID=YYYY

//uncheck the bill to ship option so that user can see the paypal-set shipping address.
//
var $billToShipCB = $('#want-bill_to_ship_cb');
$billToShipCB.attr('disabled','disabled')
if($billToShipCB.is(':checked'))	{
//code didn't like running a .click() here. the trigered function registered the checkbox as checked.
	$billToShipCB.removeAttr("checked");
	app.ext.convertSessionToOrder.u.toggleShipAddressPanel();
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
$('#want-payby_PAYPALEC').click(); //payby is not set by default, plus the 'click' is needed to open the subpanel
$('#chkoutPayOptionsFieldset input[type=radio]').attr('disabled','disabled');

//disable all ship methods.
$('#chkoutShipMethodsFieldset input[type=radio]').attr('disabled','disabled');

//disable giftcards
$('#giftcardMessaging').text('PayPal not compatible with giftCards');
//$('#couponMessaging').show().text('PayPal is not compatible with Coupons');
$('#giftcardCode').attr('disabled','disabled'); //, #couponCode
$('#addGiftcardBtn').attr('disabled','disabled').addClass('ui-state-disabled'); //, #addCouponBtn

$('#paybySupplemental_PAYPALEC').empty().append("<a href='#top' onClick='app.ext.store_checkout.u.nukePayPalEC();'>Choose Alternate Payment Method<\/a>");
					}
				},
				


//Executed when the bill or ship fields for zip or country are updated.
//will always update the cart object with both the billing and shipping zip and country
//will use billing zip/country to update shipping if ship to billing is checked.
//ship is updated also to make sure we always get the correct shipping rates.
			recalculateShipMethods : function(TYPE,SUCR)	{
				
				var billToShip = this.handleBill2Ship(); //will return a 1 if billToShip is checked.

				if(TYPE == 'bill' && billToShip == 0)	{
//when billing is updated and bill to ship is NOT checked, no need to do any ajax update or panel update.
					app.u.dump(" -> bill zip/country changed, but ship to billing is NOT checked, so no update needed.");
					}
				else	{
//to get here, type = ship OR (type = bill AND ship to bill is checked)
					app.u.dump(" -> zip/country changed (type = "+TYPE+"). ship to bill = "+billToShip+" and typeof billToShop (should be number) = "+typeof billToShip);
					
/*
in the list of calls below, sequence is important.  The session must be updated first so that all the other calls have accurate data to work with.
the refreshCart call can come second because none of the following calls are updates, just gets.
*/

//save all the checkout fields.  This is cheaper (server side) than doing setSession for several fields according to BH (2012-12-29)
					if(!SUCR)	{
						app.u.dump(" -> saveCheckoutFields originated from recalculateShipMethods");
						app.ext.convertSessionToOrder.calls.saveCheckoutFields.init();
						app.calls.refreshCart.init({"callback":"updateCheckoutOrderContents","extension":"convertSessionToOrder"},'immutable');
						}

//the saveCheckoutFields above this if statement needs to be put in the q prior to the appPaymentMethods below.
					if(billToShip) {
						app.ext.convertSessionToOrder.u.handlePanel('chkoutPayOptions'); //empties panel. sets to loading.
						app.ext.store_checkout.calls.appPaymentMethods.init("updateCheckoutPayOptions");
						}

					app.ext.convertSessionToOrder.u.handlePanel('chkoutShipMethods'); //empties panel. sets to loading.
					app.ext.store_checkout.calls.cartShippingMethodsWithUpdate.init("updateCheckoutShipMethods");
					
				
					}
				} //recalculateShipMethods

			},







////////////////////////////////////   						renderFormats			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\







		renderFormats : {

			shipMethodsAsRadioButtons : function($tag,data)	{
//				app.u.dump('BEGIN store_cart.renderFormat.shipMethodsAsRadioButtons');
				var o = '';
				var shipName,id,isSelectedMethod,safeid;  // id is actual ship id. safeid is id without any special characters or spaces. isSelectedMethod is set to true if id matches cart shipping id selected.;
				var L = data.value.length;
				for(var i = 0; i < L; i += 1)	{
					id = data.value[i].id; //shortcut of this shipping methods ID.
					isSelectedMethod = (id == app.data.cartDetail['want'].shipping_id) ? true : false; //is this iteration for the method selected.
					safeid = app.u.makeSafeHTMLId(data.value[i].id);
					shipName = app.u.isSet(data.value[i].pretty) ? data.value[i].pretty : data.value[i].name
					o += "<li class='shipcon "
					if(isSelectedMethod)
						o+= ' selected ';
					o += "shipcon_"+safeid; 
					o += "'><label><input type='radio' name='want/shipping_id' value='"+id+"' onClick='app.ext.convertSessionToOrder.u.updateShipMethod(this.value,\""+safeid+"\"); app.model.dispatchThis(\"immutable\"); '";
					if(isSelectedMethod)
						o += " checked='checked' "
					o += "/>"+shipName+": <span >"+app.u.formatMoney(data.value[i].amount,'$','',false)+"<\/span><\/label><\/li>";
					}
				$tag.html(o);
				}, //shipMethodsAsRadioButtons
			




			payMethodsAsRadioButtons : function($tag,data)	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.renderFormats.payOptionsAsRadioButtons');
//				app.u.dump(data);
				var L = data.value.length;
				var o = "";
				var id = '';
				var isSelectedMethod = false;
//				app.u.dump(" -> # payment options (L): "+L);
				if(L > 0)	{
					for(var i = 0; i < L; i += 1)	{
						id = data.value[i].id;
	//					app.u.dump(" -> i: "+i+" ["+id+"]");
						o += "<li class='paycon_"+id+"' id='payby_"+id+"'><div class='paycon'><input type='radio' name='want/payby' id='want-payby_"+id+"' value='"+id+"' onClick='app.ext.convertSessionToOrder.u.updatePayDetails(\""+id+"\"); app.ext.convertSessionToOrder.vars[\"want/payby\"] = $(this).val(); $(\"#chkoutPayOptionsFieldsetErrors\").addClass(\"displayNone\");' ";
						
						if(id == app.ext.convertSessionToOrder.vars['want/payby'] || L == 1)	{
							isSelectedMethod = id;
							}					
						
						o += "/><label for='want-payby_"+id+"'>"+data.value[i].pretty+"<\/label></div><\/li>";
						}
	
					$tag.html(o);
					if(app.ext.convertSessionToOrder.vars['want/payby'])	{
						$('#want-payby_'+app.ext.convertSessionToOrder.vars['want/payby']).click(); //trigger after adding to tag, or id doesn't exist on the DOM yet.
						}
					}
				else	{
					app.u.dump("No payment methods are available. This happens if the session is non-secure and CC is the only payment option. Other circumstances could likely cause this to happen too.");
					
					$tag.append("It appears no payment options are currently available.");
					if(document.location.protocol != "https:")	{
						$tag.append("This is not a secure session, so credit card payment is not available.");
						}
					}
				} //payMethodsAsRadioButtons
			
			
			}




		}
	return r;
	}