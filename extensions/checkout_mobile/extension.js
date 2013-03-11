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

CHECOUT_NICE.JS (just here to make it easier to know which extension is open)

************************************************************** */

var convertSessionToOrder = function() {
	var theseTemplates = new Array(
	'checkoutTemplate', //container for whole checkout page.
	'chkoutPreflightTemplate',
	'chkoutCartContentsTemplate', //cart contents
	'chkoutCartItemTemplate', //cart contents product template
	'chkoutCartSummaryTemplate', //panel for order summary (subtotal, shipping, etc)
	'chkoutAddressBillTemplate', //billing address
	'chkoutAddressShipTemplate', //duh
	'chkoutMethodsShipTemplate',
	'chkoutNotesTemplate',
	'chkoutBuyerAddressTemplate',
	'chkoutMethodsPayTemplate' //payment option panel
	);
	var r = {
	vars : {
		willFetchMyOwnTemplates : true, //1pc loads it's templates locally to avoid XSS issue.
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
		startCheckout : {
			init : function(containerID)	{
				var r = 0;

				app.ext.convertSessionToOrder.u.createProcessCheckoutModal();

				

					
_gaq.push(['_trackEvent','Checkout','App Event','Checkout Initiated']);

				return r; 
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
				$('#chkoutSummaryErrors').empty(); //clear any existing global errors. //blank out any existing global errors so that only new error appear.
				$('#returnFromThirdPartyPayment').hide(); //clear previous third party messaging.
				$('#chkoutPlaceOrderBtn').attr('disabled','disabled').addClass('ui-state-disabled '); //disable the button to avoid double-click.
//				return; //die here to test

				// !!!! 201308. need to get $form set. by here.
//the buyer could be directed away from the store at this point, so save everything to the session/cart.
				app.ext.convertSessionToOrder.u.saveAllCheckoutFields($form);

//if paypalEC is selected, skip validation and go straight to paypal. Upon return, bill and ship will get populated automatically.
				if($("#want-payby_PAYPALEC").is(':checked') && !app.ext.convertSessionToOrder.vars['payment-pt'])	{
					$('#modalProcessCheckout').append("<h2>Redirecting to PayPal...</h2>");
					app.ext.cco.calls.cartPaypalSetExpressCheckout.init();
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


_gaq.push(['_trackEvent','Checkout','User Event','Create order button pushed']);
				
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
//1PC can't load the templates remotely. causes XSS issue.
				if(app.vars._clientid == '1pc')	{
					app.model.loadTemplates(theseTemplates); //loaded from local file (main.xml)
					}
				else {
					app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/checkout_mobile/templates.html',theseTemplates);
					}
				var r; //returns false if checkout can't load due to account config conflict.
				
				if(typeof _gaq === 'undefined')	{
//					app.u.dump(" -> _gaq is undefined");
					$('#globalMessaging').toggle(true).append(app.u.formatMessage({'message':'<strong>Uh Oh!<\/strong> It appears you are not using the Asynchronous version of Google Analytics. It is required to use this checkout.','uiClass':'error','uiIcon':'alert'}));
					r = false;					
					}
//messaging for the test harness 'success'.
				else if(app.u.getParameterByName('_testharness'))	{
					$('#globalMessaging').toggle(true).append(app.u.formatMessage({'message':'<strong>Excellent!<\/strong> Your store meets the requirements to use this one page checkout extension.','uiIcon':'circle-check','uiClass':'success'}));
					$('#'+app.ext.convertSessionToOrder.vars.containerID).append("");
					r = true;
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
//				app.u.dump('END app.ext.convertSessionToOrder.init.onSuccess');
				},
			onError : function()	{
				app.u.dump('BEGIN app.ext.convertSessionToOrder.callbacks.init.error');
				//This would be reached if a templates was not defined in the view.
				$('#'+app.ext.convertSessionToOrder.vars.containerID);
				}
			}, //init


//SET THIS AS THE CALLBACK ON THE EXTENSION LOADER IF YOU WANT TO IMMEDIATELY START CHECKOUT
		startCheckout : {
			onSuccess : function() {
				app.ext.convertSessionToOrder.calls.startCheckout.init('zContent');
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
			onError : function(esponseData,uuid)	{
				app.u.dump('BEGIN app.ext.convertSessionToOrder.callbacks.updateCheckoutShipMethods.onError - ERROR!');
				app.ext.convertSessionToOrder.panelContent.shipMethods(); //reload ship panel or just error shows and there is no way to continue.
				responseData.parentID = 'chkoutShipMethodsFieldsetErrors'
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
				app.ext.cco.u.nukePayPalEC();
				app.ext.convertSessionToOrder.calls.showCheckoutForm.init();
				app.model.dispatchThis('immutable');
				}
			},		




		addGiftcardToCart : {
			onSuccess : function(tagObj)	{
				app.u.dump('BEGIN convertSessionToOrder.callbacks.addGiftcardToCart.onSuccess');
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
				app.u.dump('BEGIN convertSessionToOrder.callbacks.addGiftcardToCart.onError');
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
var msg = app.u.successMsgObject('Your coupon has been added.');
msg.parentID = 'couponMessaging'
app.u.throwMessage(msg);

_gaq.push(['_trackEvent','Checkout','User Event','Cart updated - coupon added']);

//update the panel only on a successful add. That way, error messaging is persistent. success messaging gets nuked, but coupon will show in cart so that's okay.
				app.calls.refreshCart.init({"callback":"updateCheckoutOrderContents","extension":"convertSessionToOrder"},'immutable');
				app.model.dispatchThis('immutable');

				},
			onError : function(responseData,uuid)	{
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
					app.u.dump("handleInventoryUpdate.error");
					app.ext.convertSessionToOrder.panelContent.paymentOptions();
//global errors are emptied when 'complete order' is pushed, so do not empty in the responses or any other errors will be lost.
					app.u.throwMessage(responseData);
					}
				},	//handleInventoryUpdate


		updateCheckoutPayOptions : {
			onSuccess : function(tagObj)	{
				app.u.dump('BEGIN convertSessionToOrder.callbacks.updateCheckoutPayOptions.success');
				app.ext.convertSessionToOrder.u.handlePanel('chkoutPayOptions'); //empties panel. //ensures no double content loading.
				app.ext.convertSessionToOrder.panelContent.paymentOptions();
				},
			onError : function(responseData,uuid)	{
				app.u.dump('BEGIN convertSessionToOrder.callbacks.updateCheckoutPayOptions.onError');
				app.ext.convertSessionToOrder.panelContent.paymentOptions();  //reload panel or just error shows and user can't proceed.
				responseData.parentID = 'chkoutPayOptionsFieldsetErrors'
				app.u.throwMessage(responseData);
				}
			}, //updateCheckoutPayOptions


		updateCheckoutOrderContents : {
			onSuccess : function(){
				app.ext.convertSessionToOrder.panelContent.cartContents();
				},
			onError : function(responseData)	{
				app.ext.convertSessionToOrder.panelContent.cartContents();  //reload panel so more than just error shows up and user can proceed/try again.
				responseData.parentID = 'chkoutSummaryErrors'
				app.u.throwMessage(responseData);
				}
			}, //updateCheckoutOrderContents
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
				app.ext.cco.u.buildPaymentQ();
				app.ext.cco.calls.cartOrderCreate.init("checkoutSuccess");
				app.model.dispatchThis('immutable');


_gaq.push(['_trackEvent','Checkout','App Event','Server side validation passed']);


				},
			onError : function(responseData,uuid)	{
				$('#modalProcessCheckout').dialog('close');
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled '); //make place order button appear and be clickable.
				responseData['_rtag'] = $.isEmptyObject(responseData['_rtag']) ? {} : responseData['_rtag'];
				responseData['_rtag'].targetID = 'chkoutSummaryErrors';
				app.ext.cco.u.showServerErrors(responseData,uuid);
				
_gaq.push(['_trackEvent','Checkout','App Event','Server side validation failed']);


				}
			}, //finishedValidatingCheckout



		loadPanelContent : {
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN convertSessionToOrder(nice).callbacks.loadPanelContent.onSuccess');
//had some issues using length. these may have been due to localStorage/expired cart issue. countProperties is more reliable though, so still using that one.			
				var itemsCount = app.model.countProperties(app.data.cartDetail['@ITEMS']);

				if(itemsCount > 0)	{
//					app.u.dump(" -> into itemsCount IF");
					app.ext.convertSessionToOrder.panelContent.preflight();
//					app.u.dump(" -> GOT HERE!");
					var auth = app.u.determineAuthentication();
					app.u.dump(" -> auth: "+auth);
//until it's determined whether shopper is a registered user or a guest, only show the preflight panel.
//currently, admin during checkout isn't 'supported'. meaning nothing special happens but if we don't discount it, only passive checkout is avail
					if(auth != 'none' && auth != 'admin')	{
//						app.u.dump(' -> authentication passed. Showing panels.');
//						app.u.dump(' -> want/bill_to_ship = '+app.data.cartDetail['want/bill_to_ship']);
//create panels. notes and ship address are hidden by default.
//ship address will make itself visible if user is authenticated.
						app.ext.convertSessionToOrder.u.handlePanel('chkoutAccountInfo');
						app.ext.convertSessionToOrder.u.handlePanel('chkoutBillAddress');

//bill to ship will be set to zero if user has disabled it, otherwise it will be 1 or undef.
						app.ext.convertSessionToOrder.u.handlePanel('chkoutShipAddress',Number(app.data.cartDetail['want/bill_to_ship']) == 0 ? false : true)

						app.ext.convertSessionToOrder.u.handlePanel('chkoutShipMethods'); 
						app.ext.convertSessionToOrder.u.handlePanel('chkoutPayOptions');
						app.ext.convertSessionToOrder.u.handlePanel('chkoutOrderNotes',true);						
//populate panels.						
						app.ext.convertSessionToOrder.panelContent.cartContents();
						app.ext.convertSessionToOrder.panelContent.billAddress();
						app.ext.convertSessionToOrder.panelContent.accountInfo();
						app.ext.convertSessionToOrder.panelContent.shipAddress();
						app.ext.convertSessionToOrder.panelContent.shipMethods();
						app.u.dump(" -> in loadPanelContent");
						app.ext.convertSessionToOrder.panelContent.paymentOptions();
//if order notes is on, show panel and populate content.
						if(zGlobals.checkoutSettings.chkout_order_notes == true)	{
							app.ext.convertSessionToOrder.panelContent.orderNotes();
							$('#chkoutOrderNotes').toggle(true); 
							}

_gaq.push(['_trackEvent','Checkout','Milestone','Valid email address obtained']);


						}
					else	{
						app.u.dump(' -> authentication == none. panels not displayed (except preflight)');
						}

					}//ends 'if' for whether cart has more than zero items in it.
				else	{
					app.u.dump(" -> Did not get past itemsCount > 0");
					_gaq.push(['_trackEvent','Checkout','App Event','Empty Cart Message Displayed']);
					app.u.throwMessage("It appears your cart is empty. If you think you are receiving this message in error, please contact the site administrator.");				
					}
				$('#'+app.ext.convertSessionToOrder.vars.containerID);
				
//will lock many input fields so they match the paypal response (ship address, shipping, etc).
//needs to executed in here instead of in a callback for the payalget because the get is only run once per cart/session (unless cart is changed)
//but checkout may get load/reloaded and if the cart hasn't changed, the forms still need to be 'locked'.
//needs to run at the end here so that all the dom manipulating is done prior so function can 'lock' fields
				if(app.ext.cco.u.thisSessionIsPayPal())	{
					app.ext.convertSessionToOrder.u.handlePaypalFormManipulation();
					}				
				
				
				},
			onError : function(responseData,uuid)	{
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
//nuke old form content. not needed anymore. gets replaced with invoice-ish content.
				var $zContent = $('#'+app.ext.convertSessionToOrder.vars.containerID).empty();
				var oldSession = app.sessionId;
				var orderID = app.data[tagObj.datapointer].orderid;

				app.u.jumpToAnchor(app.ext.convertSessionToOrder.vars.containerID);
//this generates the post-checkout message from the template in the view file.
				$zContent.append(app.renderFunctions.createTemplateInstance('checkoutSuccess','checkoutSuccessContent')); 
				app.renderFunctions.translateTemplate(app.data[tagObj.datapointer],'checkoutSuccessContent');
				$('#modalProcessCheckout').dialog('close');

/*
note - the click prevent default is because the renderFormat adds an onclick that passes both order and cart id.
*/
				$('.paymentRequired').append(app.data[tagObj.datapointer].payment_status_detail).find('a').click(function(event){event.preventDefault();});

//				$('.paymentRequired').append(app.ext.cco.u.checkoutSuccessPaymentFailure(app.data[tagObj.datapointer].payment_success,app.data['order|'+orderID].cart['want/payby']));
				
				
				
				var cartContentsAsLinks = encodeURI(app.ext.cco.u.cartContentsAsLinks('order|'+orderID))
				
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
				app.model.destroy('cartDetail');
				app.calls.appCartCreate.init(); //!IMPORTANT! after the order is created, a new cart needs to be created and used. the old cart id is no longer valid. 
				app.calls.refreshCart.init({},'immutable'); //!IMPORTANT! will reset local cart object. 
				app.model.dispatchThis('immutable'); //these are auto-dispatched because they're essential.

_gaq.push(['_trackEvent','Checkout','App Event','Order created']);
_gaq.push(['_trackEvent','Checkout','User Event','Order created ('+orderID+')']);

				var L = app.ext.cco.checkoutCompletes.length;
				for(var i = 0; i < L; i += 1)	{
					app.ext.cco.checkoutCompletes[i]({'sessionID':oldSession,'orderID':orderID,'datapointer':tagObj.datapointer});
					}


				$('#invoiceContainer').append(app.renderFunctions.transmogrify({'id':'invoice_'+orderID,'orderid':orderID},'invoiceTemplate',app.data['order|'+orderID]));

if(app.vars._clientid == '1pc')	{
//add the html roi to the dom. this likely includes tracking scripts. LAST in case script breaks something.
	setTimeout("$('#"+app.ext.convertSessionToOrder.vars.containerID+"').append(app.data['"+tagObj.datapointer+"']['html:roi']); app.u.dump('wrote html:roi to DOM.');",2000); 
	}
else	{
	//roi code should be handled by the app itself, not use the output from the UI
	}

				},
			onError : function(responseData,uuid)	{
				$('#modalProcessCheckout').dialog('close');
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled '); //make place order button appear and be clickable.
				responseData['_rtag'] = $.isEmptyObject(responseData['_rtag']) ? {} : responseData['_rtag'];
				responseData['_rtag'].targetID = 'chkoutSummaryErrors';
				app.u.throwMessage(responseData,uuid); //!!! test this to make sure it works.

_gaq.push(['_trackEvent','Checkout','App Event','Order NOT created. error occured. ('+d['_msg_1_id']+')']);

				}
			} //checkoutSuccess

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
				sum += this.chkoutPreflightFieldset(); //app.u.dump('preflight done. sum = '+sum);
				sum += this.chkoutShipMethodsFieldset(); //app.u.dump('ship methods done. sum = '+sum);
				sum += this.chkoutPayOptionsFieldset(); //app.u.dump('pay options done. sum = '+sum);
				sum += this.chkoutBillAddressFieldset(); //app.u.dump('bill address done. sum = '+sum);
				sum += this.chkoutShipAddressFieldset(); //app.u.dump('ship address done. sum = '+sum);
				sum += this.chkoutAccountInfoFieldset(); //app.u.dump('chkoutAccountInfo address done. sum = '+sum);

//				app.u.dump('END app.ext.convertSessionToOrder.validate.isValid. sum = '+sum);
				if(sum != 6)	{
					r = false;
					$globalErrors.append(app.u.formatMessage({"message":"Some required fields were left blank or contained errors. (please scroll up)","uiClass":"error","uiIcon":"alert"})).toggle(true);
					}
//				r = true; //for testing error handling. do not deploy with this line uncommented.
				return r;
				}, //isValid
//validation function should be named the same as the id of the fieldset. 

			chkoutPreflightFieldset : function()	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.validation.chkoutPreflightFieldset');
				var valid = 1; //used to return validation state. 0 = false, 1 = true. integers used to sum up panel validation.
				var $errorDiv = $('#chkoutPreflightFieldsetErrors').empty().toggle(false); //clear all existing errors.

					
	//if the user is authenticated already (logged in) the email input may not even appear, so no need to validate.
				if(app.u.determineAuthentication() != 'authenticated')	{
//					app.u.dump(' -> validating');
					var $email = $('#data-bill_email');
//					app.u.dump(' -> validating. email = '+$email.val());
					if($email.val() == '')	{
//						app.u.dump(' -> email is blank');
						$email.addClass('mandatory');
						$errorDiv.append(app.u.formatMessage("Please provide an email address")).toggle(true);
						app.ext.convertSessionToOrder.vars.validPreflight = 0;
						$('#chkoutPreflightFieldset').removeClass('validatedFieldset');
						valid = 0;
						}
					else if(!app.u.isValidEmail($email.val()))	{
//						app.u.dump(' -> email is not valid');
						$errorDiv.append(app.u.formatMessage("An invalid email address was used, please try again.")).toggle(true);
						$email.addClass('mandatory');
						$('#chkoutPreflightFieldset').removeClass('validatedFieldset');
						valid = 0;
						}
					else	{
//						app.u.dump(' -> email validated');
						$email.removeClass('mandatory'); //removed in case it was on from previous attempt
						$('#chkoutPreflightFieldset').addClass('validatedFieldset');
						}
					}
				else	{
					
					app.u.dump(' -> did not validate preflight panel because user is authenticated. authentication = '+app.u.determineAuthentication());
					
					}
//				app.u.dump('END app.ext.convertSessionToOrder.validation.chkoutPreflightFieldset');
				

				
				return valid;
				}, //chkoutPreflightFieldset

//no validation occurs here by default, but function exists so it can be overridden AND because there's some automated scripting which validates each panel as the user moves on.
			chkoutOrderNotesFieldset : function()	{
				
				},

			chkoutAccountInfoFieldset : function()	{
				app.u.dump('BEGIN app.ext.convertSessionToOrder.validation.chkoutAccountInfoFieldset');
				var valid = 1;
				var $fieldsetErrors = $('#chkoutAccountInfoFieldsetErrors').empty().toggle(false);
				
				var authState = app.u.determineAuthentication();
				app.u.dump('authState = '+authState);
				if(authState == 'authenticated' || authState == 'thirdPartyGuest')	{
					app.u.dump(' -> user is logged in, authentication not needed.');
					$('#want-create_customer').val("0"); //make sure 'create account' is disabled.
					}
				else if($('#want-create_customer').val() == 0)	{
					//do nothing.
					app.u.dump(' -> create account disabled or not available.');
					}
				else	{
					app.u.dump(' -> create account enabled. validating...');
					var errMsg = "";
					var $pass = $('#want-new_password')
					var $pass2 = $('#want-new_password2');
					var $hintQ = $('#want-recovery_hint');
					var $hintA = $('#want-recovery_answer');

					$pass.parent().removeClass('mandatory');
					$pass2.parent().removeClass('mandatory');
					$hintQ.parent().removeClass('mandatory');
					$hintA.parent().removeClass('mandatory');
//IE7 wants pass.val to have a value before checking length.
					if(!$pass.val() || $pass.val().length < 8)	{
						valid = 0;
						$pass.parent().addClass('mandatory');
						$pass2.parent().addClass('mandatory');
						errMsg += '<li>Please enter a password of at least 8 characters<\/li>';
						}
					else if($pass.val() != $pass2.val())	{
						valid = 0;
						errMsg += '<li>Your password and verify password do not match<\/li>';
						}
					
					if(!$hintQ.val())	{
						valid = 0;
						$hintQ.parent().addClass('mandatory');
						errMsg += '<li>Please select a recovery question <span class="zhint">(in case you need to recover your password)<\/span><\/li>';
						}
					if(!$hintA.val())	{
						valid = 0;
						$hintA.parent().addClass('mandatory');
						errMsg += '<li>Please select a recovery answer <\/li>';
						}

					if(valid == 0)	{
						$fieldsetErrors.toggle(true).append(app.u.formatMessage("<ul>"+errMsg+"<\/ul>"));
						}
					}
//				app.u.dump(' -> accountInfo valid = '+valid);
				return valid;
				}, //validate.chkoutAccountInfoFieldset
				
//make sure a shipping method is selected
			chkoutShipMethodsFieldset : function()	{
				var valid = 1;
				var $shipMethod = $("[name='want/shipping_id']:checked");
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
				var $payMethod = $('[name="want/payby"]:checked');
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
					app.ext.cco.u.setShipAddressToBillAddress();
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
each of these functions impacts display of it's panel (ONLY IT'S PANEL AND ONLY DISPLAY). 
all logic should be in the panel itself. That'll make it easier to maintain.
These functions should ONLY affect display. toggling the panel itself on or off, or specific contents.
ex: the displayLogic function for the shipping panel gets executed when ship to bill is checked/unchecked. some other function may ALSO get executed to do other things, such as update the shipping options panel
*/ 
		panelDisplayLogic : {

/*
the authstate determines what shows in the preflight panel. It could be email and facebook login with a link for existing users
or if the user is already logged in, it could just be their email address printed out (no changing it).
after a login occurs, all the panels are updated because the users account could effect just about anything, including shipping options, 
payment options, pricing, etc
*/
			chkoutPreflight : function(formObj,$fieldset)	{
				app.u.dump("BEGIN convertSessionToOrder.panelDisplayLogic.chkoutPreflight");
//If the user is logged in, no sense showing password or create account prompts.
				if(app.u.buyerIsAuthenticated())	{
					app.u.dump(" -> user is authenticated");
					$("[data-app-role='login']",$fieldset).hide();
					$("[data-app-role='username']",$fieldset).show();
					}
//hide the password input
				else if(formObj['want/create_customer'] == 'on')	{
					$("[data-app-role='login']",$fieldset).show();
					$("[data-app-role='username']",$fieldset).hide();
					$("[data-app-role='loginPasswordContainer']",$fieldset).hide();
					}
				else	{
					$("[data-app-role='login']",$fieldset).show();
					$("[data-app-role='username']",$fieldset).hide();
					$("[data-app-role='loginPasswordContainer']",$fieldset).show();
					}
				}, //preflight

			chkoutAccountCreate : function(formObj,$fieldset)	{
//				app.u.dump('BEGIN convertSessionToOrder.panelDisplayLogic.chkoutAccountCreate');
				
				var authState = app.u.determineAuthentication(),
				createCustomer = formObj['want/create_customer'];

				if(authState == 'authenticated' || authState == 'thirdPartyGuest')	{
					$fieldset.hide();
					}
				else {
//though it may not be visible, the panel is still rendered and then toggled on/off based on the create account checkbox.
					if(createCustomer == 'on')	{
						$fieldset.show();
						}
					else	{
						$fieldset.hide();
						}
					}
				}, //chkoutAccountCreate
				
/*
a guest checkout gets just a standard address entry. 
an existing user gets a list of previous addresses they've used and an option to enter a new address.
*/
			chkoutAddressBill : function(formObj,$fieldset)	{
				if(app.u.buyerIsAuthenticated() && app.ext.cco.u.buyerHasPredefinedAddresses('bill') == true)	{
					$("[data-app-role='addressSelect']",$fieldset).show();
					$("[data-app-role='addressNew']",$fieldset).hide();
					if(formObj['bill/shortcut'])	{
						$("[data-_id='"+formObj['bill/shortcut']+"'] button",$fieldset).addClass('ui-state-highlight');
						}
					}
				else	{
					$("[data-app-role='addressSelect']",$fieldset).hide();
					$("[data-app-role='addressNew']",$fieldset).show();
//from a usability perspective, we don't want a single item select list to show up. so hide if only 1 or 0 options are available.
					if(app.data.appCheckoutDestinations['@destinations'].length < 2)	{
						$("[data-app-role='billCountry']",$fieldset).hide();
						}
					}
				}, //chkoutAddressBill

			chkoutAddressShip : function(formObj,$fieldset)	{
				if(formObj['want/bill_to_ship'] == 'on')	{$fieldset.hide()}
				else	{$fieldset.show()}
				
				if(app.u.buyerIsAuthenticated() && app.ext.cco.u.buyerHasPredefinedAddresses('ship') == true)	{
					$("[data-app-role='addressSelect']",$fieldset).show();
					//need logic here to select address if only 1 predefined exists.
					$("[data-app-role='addressNew']",$fieldset).hide();
					if(formObj['ship/shortcut'])	{
						$("[data-_id='"+formObj['bill/shortcut']+"'] button",$fieldset).addClass('ui-state-highlight');
						}
					}
				else	{
					$("[data-app-role='addressSelect']",$fieldset).hide();
					$("[data-app-role='addressNew']",$fieldset).show();
//from a usability perspective, we don't want a single item select list to show up. so hide if only 1 or 0 options are available.
					if(app.data.appCheckoutDestinations['@destinations'].length < 2)	{
						$("[data-app-role='shipCountry']",$fieldset).hide();
						}
					}
				}, //chkoutAddressShip

			chkoutMethodsShip : function(formObj,$fieldset)	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.panelContent.shipMethods');
// REMINDER - the messaging for 'enter a zip' and whatnot should disappear if predefined addresses are present.
				var $panelFieldset = $("#chkoutShipMethodsFieldset"),
				shipMethods = app.data.cartDetail['@SHIPMETHODS'],
				L = shipMethods.length;
				$panelFieldset.append(app.renderFunctions.createTemplateInstance('checkoutTemplateShipMethods','shipMethodsContainer'));
				app.renderFunctions.translateTemplate(app.data.cartDetail,'shipMethodsContainer');

//must appear after panel is loaded because otherwise the divs don't exist.
//per brian, use shipping methods in cart, not in shipping call.
				if(L == 0)	{
					$('#noShipMethodsAvailable').toggle(true);
					}
				else if(!$('#data-bill_zip').val() && !$('ship_zip').val()) {
					$('#noZipShipMessage').toggle(true);
					}

/*
it's possible that a ship method is set in the cart that is no longer available.
this could happen if 'local pickup' is selected, then country,zip,state, etc is changed to a destination where local pickup is not available.
in these instances, the selected method in the cart/memory/local storage must get nuked.
Of course, this should only happen IF a method was selected previously.
*/
				var foundMatchingShipMethodId = false; 
				
				for(var i = 0; i < L; i += 1)	{
					if(shipMethods[i].id == app.data.cartDetail['want/shipping_id'])	{
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
					
				}, //chkoutMethodsShip

			chkoutCartItemsList : function(formObj,$fieldset){}, //chkoutCartItemsList

			chkoutCartSummary : function(formObj,$fieldset)	{
//The reference # only shows up IF company is populated and payby isn't PO.
//The input isn't shown till a payment is selected to avoid displaying it, then hiding it.
//the input is removed entirely because the field name is used if payment type = PO.

				if(formObj['bill/company'] && formObj['want/payby'] && formObj['want/payby'] != "PO")	{
					$("[data-app-role='referenceNumber']",$fieldset).show();
					}
				else	{
					$("[data-app-role='referenceNumber']",$fieldset).empty().remove();
					}
				
				}, //chkoutCartSummary

			chkoutMethodsPay : function(formObj,$fieldset)	{

if(app.ext.cco.u.thisSessionIsPayPal())	{
	//this is a paypal session. payment methods are not available any longer. stored payments are irrelevant. show paymentQ
	//also show a message to allow the merchant to remove the paypal payment option and use a different method?
	}


//if the user is logged in and has wallets, they are displayed in a tabbed format.
if(app.u.buyerIsAuthenticated() && app.data.buyerWalletList && app.data.buyerWalletList['@wallets'].length)	{
	$("[data-app-role='paymentOptionsContainer']",$fieldset).anytabs();
	}
else	{
	$("[data-anytab-content='storedPaymentsContainer']").hide();
	}

/*
//thisSessionIsPayPal

//if wallets exist, then tabs are created, putting wallets in open panel and everything else hidden away in tab 2.
//the ul for the tabs is hidden by default so that when no wallets are present, no tabs show up.
				if(app.data.buyerWalletList && app.data.buyerWalletList['@wallets'].length)	{
					$('#paymentOptionsContainer ul').show();
//if a payment type not wallet has already been selected, be sure to open that tab when panel reloads.
					$('#paymentOptionsContainer').tabs({
						selected: ((app.ext.convertSessionToOrder.vars['want/payby'] && app.ext.convertSessionToOrder.vars['want/payby'].indexOf('WALLET') == 0) || !app.ext.convertSessionToOrder.vars['want/payby']) ? 0 : 1
						});
					app.renderFunctions.translateTemplate(app.data.buyerWalletList,'storedPaymentsContainer');
					}
				$('[type="radio"]',$panelFieldset).click(function(){
					var val = $(this).val();
					app.ext.convertSessionToOrder.u.updatePayDetails(val);
					app.ext.convertSessionToOrder.vars["want/payby"] = val;
					$("#chkoutPayOptionsFieldsetErrors").addClass("displayNone");
					})
				app.u.dump(" -> app.ext.convertSessionToOrder.vars['want/payby']: "+app.ext.convertSessionToOrder.vars['want/payby'])

				app.renderFunctions.translateSelector('#paymentQContainer',app.data.cartDetail);  //used for translating paymentQ

//				app.ext.convertSessionToOrder.u.updatePayDetails(app.ext.convertSessionToOrder.vars['want/payby']);
*/				}, //chkoutMethodsPay

			chkoutNotes : function(formObj,$fieldset)	{

				} //chkoutNotes

			}, //panelContent
	
//push onto this (cco.checkoutCompletes.push(function(P){});
//after checkout, these will be iterated thru and executed.
/*
Parameters included are as follows:
P.orderID
P.sessionID (this would be the sessionID associated w/ the order, not the newly generated session/cart id - reset immediately after checkout )
P.datapointer - pointer to cartOrderCreate

note - the order object is available at app.data['order|'+P.orderID]
*/
		checkoutCompletes : [],



		a : {
			
			startCheckout : function($chkContainer)	{
				app.u.dump("BEGIN convertSessionToOrder.a.startCheckout");
				if($chkContainer && $chkContainer.length)	{
					$chkContainer.empty();
					$chkContainer.showLoading({'message':'Fetching cart contents and payment options'});

					app.u.dump(" -> app.u.buyerIsAuthenticated(): "+app.u.buyerIsAuthenticated());

					if(app.u.buyerIsAuthenticated())	{
						
						app.ext.cco.calls.buyerAddressList.init({'callback':'suppressErrors'},'immutable');
						app.ext.cco.calls.buyerWalletList.init({'callback':'suppressErrors'},'immutable');
						
						}

					app.ext.cco.calls.appPaymentMethods.init({},{},'immutable');
					app.ext.cco.calls.appCheckoutDestinations.init({},'immutable');
					
					app.model.destroy('cartDetail');
					
					app.ext.convertSessionToOrder.u.handlePaypalInit(); //handles paypal code, including paymentQ update.
					
					app.calls.cartDetail.init({'callback':function(rd){
						$chkContainer.hideLoading(); //always hideloading, errors or no, so interface is still usable.
						if(app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							if(app.data.cartDetail['@ITEMS'].length)	{
//NOTE - this should only be done once. panels should be updated individually from there forward.
								$chkContainer.anycontent({'templateID':'checkoutTemplate',data: app.ext.convertSessionToOrder.u.extendedDataForCheckout()}); 
								$("fieldset[data-app-role]",$chkContainer).each(function(index, element) {
									var $fieldset = $(element),
									role = $fieldset.data('app-role');
									
									$fieldset.addClass('ui-corner-all');
									$("legend",$fieldset).addClass('ui-widget-header ui-corner-all');
									app.ext.convertSessionToOrder.u.handlePanel($chkContainer,role,['handleDisplayLogic','handleAppEvents']);
									});
								}
							else	{
								$chkContainer.anymessage({'message':'It appears your cart is empty. If you think you are receiving this message in error, please refresh the page or contact us.'});
								}
							}
						}},'immutable');

					app.model.dispatchThis('immutable');
					}
				else	{
					$('#globalMessaging').anymessage({'message':'in convertSessionToOrder.a.startCheckout, no $chkContainer not passed or does not exist.'});
					}
				} //startCheckout
			
			},


////////////////////////////////////   						appEvents [e]			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		e : {
//triggered on buyer bill address update. will recalculate tax.
			execAddressUpdate : function($input)	{
				$input.off('blur.execAddressUpdate').on('blur.execAddressUpdate',function(){
					var $form = $input.closest('form');
					if(app.ext.cco.u.taxShouldGetRecalculated($form.serializeJSON()))	{
//enough of the billing info was updated to justify recalculating tax. get updated ship and pay too.
						app.ext.convertSessionToOrder.u.handleCommonPanels($form);
						app.model.dispatchThis();
						}
					else	{} // not enough fields for accurately calculating tax are present.
					})
				},

//immediately update cart anytime the email address is added/changed. for remarketing purposes.
//no need to refresh the cartDetail here.
			execBuyerEmailUpdate : function($input)	{
				$input.off('blur.execEmailUpdate').on('blur.execEmailUpdate',function(){
					if(app.u.isValidEmail($input.val()))	{
						app.ext.cco.calls.cartSet.init({'bill/email':$input.val()},{},'immutable');
						app.model.dispatchThis('immutable');
						}
					});
				},
			
//executed when an predefined address (from a buyer who is logged in) is selected.
			execBuyerAddressSelect : function($btn)	{
				$btn.button();
				$btn.off('click.execBuyerAddressUpdate').on('click.execBuyerAddressUpdate',function(event){
					event.preventDefault();
					var addressType = $btn.closest('fieldset').data('app-addresstype'), //will be ship or bill.
					$form = $btn.closest('form');
					addressID = $btn.closest('address').data('_id');
					
					if(addressType && addressID)	{
						$btn.closest('fieldset').find('button').removeClass('ui-state-highlight'); //remove highlight from all the select buttons
						$btn.addClass('ui-state-highlight');
						$("[name='"+addressType+"/shortcut']",$form).val(addressID);
						var cartUpdate = {};
						cartUpdate[addressType+"/shortcut"] = addressID; 
						app.calls.cartSet.init(cartUpdate); //no need to populate address fields, shortcut handles that.
						app.ext.convertSessionToOrder.u.handleCommonPanels($form);
						app.model.dispatchThis('immutable');
						}
					else	{
						$btn.closest('fieldset').anymessage({'message':'In convertSessionToOrder.e.execBuyerAddressSelect','gMessage':true});
						}
					});
				},
			
			execBuyerLogin : function($btn)	{
				$btn.button();
				$btn.off('click.execBuyerLogin').on('click.execBuyerLogin',function(event){
					event.preventDefault();
					var $fieldset = $btn.closest('fieldset'),
					$email = $("[name='bill/email']",$fieldset),
					$password = $("[name='password']",$fieldset);

					if($email.val() && $password.val())	{
						$('body').showLoading({'message':'Verifying username and password...'});
						//we have want we need. attempt login.

						app.model.destroy('buyerAddressList');
						app.model.destroy('buyerWalletList');

						app.calls.appBuyerLogin.init({"login":$email.val(),"password":$password.val()},{'callback':function(rd){
//							app.u.dump("BEGIN exeBuyerLogin anonymous callback");
							$('body').hideLoading();
							if(app.model.responseHasErrors(rd)){$fieldset.anymessage({'message':rd})}
							else	{
								app.u.dump(" -> no errors. user is logged in.");
								var $form = $fieldset.closest('form');

//can't piggyback these on login because they'll error at the API side (and will kill the login request)

							app.ext.cco.calls.buyerAddressList.init({'callback':function(){
//no error handling needed. if call fails or returns zero addesses, the function below will just show the new address form.
								app.ext.convertSessionToOrder.u.handlePanel($form,'chkoutAddressBill',['empty','translate','handleDisplayLogic','handleAppEvents']);
								app.ext.convertSessionToOrder.u.handlePanel($form,'chkoutAddressShip',['empty','translate','handleDisplayLogic','handleAppEvents']);
								}},'immutable');

							app.ext.cco.calls.buyerWalletList.init({'callback':function(){
//no error handling needed. if call fails or returns zero wallets, the function below will just show the new default payment options.
								app.ext.convertSessionToOrder.u.handlePanel($form,'chkoutMethodsPay',['empty','translate','handleDisplayLogic','handleAppEvents']);
								}},'immutable');
							app.model.dispatchThis('immutable');

//no content changes here, but potentially some display changes.
								app.ext.convertSessionToOrder.u.handlePanel($form,'chkoutAccountCreate',['handleDisplayLogic']);
//here, content does change. the cart will now contain a username, which is needed on the display.
								app.ext.convertSessionToOrder.u.handlePanel($form,'chkoutPreflight',['empty','translate','handleDisplayLogic','handleAppEvents']);
								$fieldset.anymessage({'message':'Thank you, you are now logged in.','_msg_0_type':'success'});
								}
							}});
						app.model.dispatchThis('immutable');
						}
					else {
					$fieldset.anymessage({'message':'Please fill out the fields indicated below:'});
						if(!app.u.isValidEmail($email.val()))	{
							//email is blank or invalid
							$email.addClass('ui-state-error');
							}
						if(!$password.val())	{
							$password.addClass('ui-state-error');
							}
						}
					})
				}, //execBuyerLogin

			execCartOrderCreate : function($btn)	{
//				$btn.button();
				$btn.off('click.execCartOrderCreate').on('click.execCartOrderCreate',function(event){
					event.preventDefault();
					//app.ext.convertSessionToOrder.calls.processCheckout.init('finishedValidatingCheckout'); app.model.dispatchThis('immutable');
					})
				}, //execCartOrderCreate

			execCountryUpdate : function($sel)	{
				//recalculate the shipping methods and payment options.
				},

			execCouponAdd : function($btn)	{
//				$btn.button();
				$btn.off('click.execCouponAdd').on('click.execCouponAdd',function(event){
					event.preventDefault();
					//app.ext.convertSessionToOrder.u.handleCouponSubmit();
					})
				},

			execGiftcardAdd : function($btn)	{
//				$btn.button();
				$btn.off('click.execGiftcardAdd').on('click.execGiftcardAdd',function(event){
					event.preventDefault();
					//app.ext.convertSessionToOrder.u.handleGiftcardSubmit();
					})
				},

			execShipMethodUpdate : function($ul)	{
				$("input",$ul).each(function(){
					
					var $rb = $(this), //Radio Button
					shipID = $(this).val(),
					$context = $rb.closest('form');
					
					$rb.off("change.execShipMethodUpdate").on("change.execShipMethodUpdate", function(){
						$('.ui-state-active',$ul).removeClass('ui-state-active'); //un highlight all ship methods.
						$rb.closest('li').addClass("ui-state-active ui-corner-all"); //highlight selected ship method.
						app.calls.cartSet.init({'want/shipping_id':shipID}); 
						app.model.destroy('cartDetail');
app.ext.convertSessionToOrder.u.handlePanel($context,'chkoutMethodsPay',['showLoading']);
app.ext.convertSessionToOrder.u.handlePanel($context,'chkoutCartSummary',['showLoading']);
						app.calls.cartDetail.init({'callback':function(rd){
							if(app.model.responseHasErrors(rd)){
								$('#globalMessaging').anymessage({'message':rd});
								}
							else	{
//shipping method 'could' impact payment options
app.ext.convertSessionToOrder.u.handlePanel($context,'chkoutMethodsPay',['hideLoading','empty','translate','handleDisplayLogic','handleAppEvents']);
//shipping method undoubtedly affected the shipping price
app.ext.convertSessionToOrder.u.handlePanel($context,'chkoutCartSummary',['hideLoading','empty','translate','handleDisplayLogic','handleAppEvents']);
								}
							}},'immutable');
						app.ext.cco.calls.appPaymentMethods.init({},{},'immutable');
						app.model.dispatchThis("immutable");
						});
					})
				},

			execPayMethodUpdate : function($context)	{
				$("input",$context).each(function(){
					$(this).off("change.execPayMethodUpdate").on("change.execPayMethodUpdate", function(){
						$('.ui-state-active',$context).removeClass('ui-state-active ui-corner-all');
						$(this).parent().addClass("ui-state-active");
						app.u.dump("execPayMethodUpdate does not do anything yet.",'warn');
						});
					})
				},

			tagAsAccountCreate : function($cb)	{
//				$cb.anycb;
				$cb.off('change.tagAsAccountCreate').on('change.tagAsAccountCreate',function()	{
					app.ext.cco.calls.cartSet.init({'want/create_customer': $cb.is(':checked') ? 1 : 0}); //val of a cb is on or off, but we want 1 or 0.
					app.ext.convertSessionToOrder.u.handlePanel($cb.closest('form'),'chkoutAccountCreate',['handleDisplayLogic']);
					});
				},
			
			tagAsBillToShip : function($cb)	{
				$cb.anycb();
				$cb.off('change.tagAsBillToShip').on('change.tagAsBillToShip',function()	{
					app.ext.convertSessionToOrder.u.handlePanel($cb.closest('form'),'chkoutAddressShip',['handleDisplayLogic']);
					app.calls.cartSet.init({'want/bill_to_ship':($cb.is(':checked')) ? 1 : 0},{},'immutable'); //adds dispatches.
					app.model.dispatchThis('immutable');
					});
				}
			},


////////////////////////////////////   						util [u]			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
			
			
			extendedDataForCheckout : function()	{
//				app.u.dump("app.data.cartDetail:"); app.u.dump(app.data.cartDetail);
				if(app.u.buyerIsAuthenticated())	{
					var obj = $.extend(true,app.data.appPaymentMethods,app.data.appCheckoutDestinations,app.data.buyerAddressList,app.data.buyerWalletList,app.data.cartDetail);
					}
				else	{
					var obj = $.extend(true,app.data.appPaymentMethods,app.data.appCheckoutDestinations,app.data.cartDetail);
					}
				return obj;
				},
			
//$content could be the parent form or the forms container. just something around this checkout. (so that multiple checkout forms are possible. imp in UI
//role is the value of data-app-role on the fieldset.
//actions is what needs to happen. an array.  accepted values are empty, showLoading, addAppEvents, translate and handleDisplayLogic. ex: ['translate','handleDisplayLogic']
//actions are rendered in the order they're passed.

			handlePanel : function($context, role, actions)	{
				if($context && role && actions && typeof actions === 'object')	{
					app.u.dump("BEGIN handlePanel for role: "+role); //app.u.dump(actions);
					var L = actions.length,
					formObj = $context.is('form') ? $context.serializeJSON() : $("form",$context).serializeJSON(),
					$fieldset = $("[data-app-role='"+app.u.jqSelector('',role)+"']",$context),
					ao = {};

					ao.showLoading = function (formObj, $fieldset){$(".panelContent",$fieldset).showLoading({'message':'Fetching updated content'})},
					ao.hideLoading = function (formObj, $fieldset){$(".panelContent",$fieldset).hideLoading()},
					ao.empty = function(formObj, $fieldset){app.u.dump(" -> emptying "+role);$(".panelContent",$fieldset).empty()},
					ao.handleAppEvents = function(formObj, $fieldset){app.u.handleAppEvents($fieldset)},
					ao.handleDisplayLogic = function(formObj, $fieldset){
						if(typeof app.ext.convertSessionToOrder.panelDisplayLogic[role] === 'function')	{
							app.ext.convertSessionToOrder.panelDisplayLogic[role](formObj,$fieldset);
							}
						else	{
							$fieldset.anymessage({'message':'In convertSessionToOrder.u.handlePanel, panelDisplayLogic['+role+'] not a function','gMessage':true});
							}
						}, //perform things like locking form fields, hiding/showing the panel based on some setting. never pass in the setting, have it read from the form or cart.
					ao.translate = function(formObj, $fieldset)	{
						app.u.dump(" -> translating "+role);
//						app.u.dump("app.ext.convertSessionToOrder.u.extendedDataForCheckout()"); app.u.dump(app.ext.convertSessionToOrder.u.extendedDataForCheckout());
						$fieldset.anycontent({'data' : app.ext.convertSessionToOrder.u.extendedDataForCheckout()});
						} //populates the template.
					
					for(var i = 0; i < L; i += 1)	{
						if(typeof ao[actions[i]] === 'function'){
							ao[actions[i]](formObj, $fieldset);
							}
						else	{
							$('#globalMessaging').anymessage({'message':"In convertSessionToOrder.u.handlePanel, undefined action ["+actions[i]+"]",'gMessage':true});
							}
						}
					
					}
				else	{
					$('#globalMessaging').anymessage({'message':"In convertSessionToOrder.u.handlePanel, either $context ["+typeof $context+"], role ["+role+"] or actions ["+actions+"] not defined or not an object ["+typeof actions+"]",'gMessage':true});
					}
				},

//this code was executed often enough to justify putting it into a function for recycling.
//sets payment options, shipping options and cart summary to loading, then adds immutable dispatches/callbacks/etc for updating.
//does NOT dispatch. That way, other requests can be piggy-backed.
			handleCommonPanels : function($context)	{
				app.ext.convertSessionToOrder.u.handlePanel($context,'chkoutMethodsShip',['showLoading']);
				app.ext.convertSessionToOrder.u.handlePanel($context,'chkoutMethodsPay',['showLoading']);
				app.ext.convertSessionToOrder.u.handlePanel($context,'chkoutCartSummary',['showLoading']);
				
				app.model.destroy('cartDetail');
				app.ext.cco.calls.appPaymentMethods.init({},{},'immutable'); //update pay and ship anytime either address changes.
				app.calls.cartDetail.init({'callback':function(){
					app.ext.convertSessionToOrder.u.handlePanel($context,'chkoutMethodsShip',['empty','translate','handleDisplayLogic','handleAppEvents']);
					app.ext.convertSessionToOrder.u.handlePanel($context,'chkoutMethodsPay',['empty','translate','handleDisplayLogic','handleAppEvents']);
					app.ext.convertSessionToOrder.u.handlePanel($context,'chkoutCartSummary',['empty','translate','handleDisplayLogic','handleAppEvents']);
					}},'immutable');
				},


			handlePaypalInit : function()	{

//paypal code need to be in this startCheckout and not showCheckoutForm so that showCheckoutForm can be 
// executed w/out triggering the paypal code (which happens when payment method switches FROM paypal to some other method) because
// the paypalgetdetails cmd only needs to be executed once per session UNLESS the cart contents change.
//calls are piggybacked w/ this. do not add dispatch here.
				var token = app.u.getParameterByName('token');
				var payerid = app.u.getParameterByName('PayerID');
				if(token && payerid)	{
					app.u.dump("It appears we've just returned from PayPal.");
					app.ext.convertSessionToOrder.vars['payment-pt'] = token;
					app.ext.convertSessionToOrder.vars['payment-pi'] = payerid;
					app.ext.cco.calls.cartPaymentQ.init({"cmd":"insert","PT":token,"PI":payerid,"TN":"PAYPALEC"},{"extension":"convertSessionToOrder","callback":"handlePayPalIntoPaymentQ"});
					}
//if token and/or payerid is NOT set on URI, then this is either not yet a paypal order OR is/was paypal and user left checkout and has returned.
				else if(app.ext.cco.u.thisSessionIsPayPal())	{
					if(!app.ext.cco.u.aValidPaypalTenderIsPresent())	{app.ext.cco.u.nukePayPalEC();}
					}
				else	{
					//do nothing.
					}
				}, //handlePaypalInit









//when a country is selected, the required attribute must be added or dropped from state/province.
//this is important because the browser itself will indicate which fields are required.
//some countries do not have state/province, so for international it is automatically not required.
			countryChange : function(type,country)	{
				
				if(country == 'US')	{
					$('#data-'+type+'_state').attr('required','required');
					}
				else	{
					app.u.dump(' -> got here: '+type);
					$('#data-'+type+'_state').removeAttr('required').parent().removeClass('mandatory');
					}
				}, //countryChange

//201308 added to replace call: saveCheckoutFields
//may need to sanitize out payment vars.
			saveAllCheckoutFields : function($form,_tag)	{
				if($form)	{
					_tag = _tag || {};
					var formObj = $form.serializeJSON();
//po number is used for purchase order payment method, but also allowed for a reference number (if company set and po not payment method).
					if(app.ext.convertSessionToOrder.vars['want/payby'] != "PO" && formObj['want/reference_number'])	{
						formObj['want/po_number'] = formObj['want/reference_number'];
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
					delete formObj['coupon'];	

					app.calls.cartSet.init(formObj,_tag); //adds dispatches.
					}
				}, //saveAllCheckoutFields

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
			
				}, //createProcessCheckoutModal

//executed when a coupon is submitted. handles ajax call for coupon and also updates cart.
			handleCouponSubmit : function()	{
				$('#chkoutSummaryErrors').empty(); //remove any existing errors.
				$('#addCouponBtn').attr('disabled','disabled').addClass('ui-state-disabled ');
				app.ext.cco.calls.cartCouponAdd.init($('#couponCode').val(),{"callback":'addCouponToCart',"extension":"convertSessionToOrder"}); 
				app.model.dispatchThis('immutable');
				}, //handleCouponSubmit

//executed when a giftcard is submitted. handles ajax call for giftcard and also updates cart.
//no 'loadingbg' is needed on button because entire panel goes to loading onsubmit.
//panel is reloaded in case the submission of a gift card changes the payment options available.
			handleGiftcardSubmit : function()	{
				app.ext.cco.calls.cartGiftcardAdd.init($('#giftcardCode').val(),{"callback":'addGiftcardToCart',"extension":"convertSessionToOrder"}); 
				app.ext.cco.calls.appPaymentMethods.init();
				app.ext.convertSessionToOrder.u.handlePanel('chkoutPayOptions');
				app.model.dispatchThis('immutable');
				}, //handleGiftcardSubmit



			handleChangeFromPayPalEC : function()	{
//				app.ext.cco.u.nukePayPalEC(); //kills all local and session paypal payment vars
				app.ext.convertSessionToOrder.u.handlePanel('chkoutPayOptions');
				app.ext.convertSessionToOrder.u.handlePanel('chkoutBillAddress');
				app.ext.convertSessionToOrder.u.handlePanel('chkoutShipAddress');
				app.ext.convertSessionToOrder.u.handlePanel('chkoutShipMethods');
				app.ext.convertSessionToOrder.calls.showCheckoutForm.init();  //handles all calls.
				app.model.dispatchThis('immutable');
				}, //handleChangeFromPayPalEC


//run when a payment method is selected. updates memory and adds a class to the radio/label.
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
						supplementalOutput.addClass(' noPadOrMargin listStyleNone ui-widget-content ui-corner-bottom');
//save values of inputs into memory so that when panel is reloaded, values can be populated.
						$('input[type=text], select',supplementalOutput).change(function(){
							app.ext.convertSessionToOrder.vars[$(this).attr('name')] = $(this).val(); //use name (which coforms to cart var, not id, which is websafe and slightly different 
							})

						$('#payby_'+paymentID).append(supplementalOutput);
						}
					}

	//			app.u.dump('END app.ext.convertSessionToOrder.u.updatePayDetails. paymentID = '+paymentID);			
_gaq.push(['_trackEvent','Checkout','User Event','Payment method selected ('+paymentID+')']);
				}, //updatePayDetails


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
			app.u.dump("BEGIN convertSessionToOrder.u.handlePaypalFormManipulation ");
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

$('#paybySupplemental_PAYPALEC').empty().append("<a href='#top' onClick='app.ext.cco.u.nukePayPalEC();'>Choose Alternate Payment Method<\/a>");
					}
				},
				

//executed when any billing address field is updated so that tax is accurately computed/recomputed and displayed in the totals area.
			addressFieldUpdated : function(fieldID)	{
				app.u.dump("BEGIN app.ext.convertSessionToOrder.u.addressFieldUpdated");
				var SUCR = false; //Sesion Updated. Cart Requested. set to true if these conditions are met so that no duplicate calls are created.
//these changes need to be made before				

				this.handleBill2Ship(); //will set ship vars if bill to ship is checked.
				if(app.ext.cco.u.taxShouldGetRecalculated())	{
					app.u.dump(" -> saveCheckoutFields originated from addressFieldUpdated");
					app.ext.convertSessionToOrder.calls.saveCheckoutFields.init(); //update session with ALL populated fields.
					app.calls.refreshCart.init({"callback":"updateCheckoutOrderContents","extension":"convertSessionToOrder"},'immutable');
					SUCR = true;
					}
//when zip or country is updated, we may need to recalculate the ship methods.
//NOTE -> need to recalculate shipping upon address1 change too. in case it changes to a PO box or something like that.
				if(fieldID.indexOf('zip') > 0 || fieldID.indexOf('country') > 0)	{
					var TYPE = fieldID.indexOf('ship') > 0 ? 'ship' : 'bill';
					app.u.dump(" -> type: "+TYPE);
					this.recalculateShipMethods(TYPE,SUCR);
					}

				
				}, //addressFieldUpdated

//if bill to ship is true, then the ship zip and country fields are updated to make sure API doesn't get confused.
//ok. odd. bill_to_ship is checkout var, but shouldn't it be ship to bill? I'll leave my var as is to be consistent.
			handleBill2Ship : function()	{
				var billToShip = ($('#want-bill_to_ship').val())*1;
				if(billToShip) {
					app.u.dump(" -> billToShip is true. update ship inputs with current zip/country.");
					app.ext.cco.u.setShipAddressToBillAddress(); //update all shipping address fields from bill address.
//					$('#data-ship_zip').val($('#data-bill_zip').val());
//					$('#data-ship_country').val($('#data-bill_country').val());
					}
				app.u.dump(" -> handleBill2Ship val: "+billToShip);
				return billToShip;
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
						app.ext.cco.calls.appPaymentMethods.init("updateCheckoutPayOptions");
						}

					app.ext.convertSessionToOrder.u.handlePanel('chkoutShipMethods'); //empties panel. sets to loading.
					app.ext.cco.calls.cartShippingMethodsWithUpdate.init("updateCheckoutShipMethods");
					
				
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
					o += "'><label><input type='radio' name='want/shipping_id' value='"+id+"' ";
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
					//ZERO will be in the list of payment options if customer has a zero due (giftcard or paypal) order.
					if(data.value[0].id == 'ZERO')	{
						$tag.hide(); //hide payment options.
						$tag.append("<div><input type='radio' name='want/payby'  value='ZERO' checked='checked' \/>"+data.value[i].pretty+"<\/div>");
						}
					else	{
						$tag.show(); //make sure visible. could be hidden as part of paypal, then paypal could be cancelled.
						for(var i = 0; i < L; i += 1)	{
							id = data.value[i].id;
	//onClick event is added through panelContent.paymentOptions
	//setting selected method to checked is also handled there.
							o += "<div><label><input type='radio' name='want/payby' value='"+id+"' />"+data.value[i].pretty+"<\/label></div>";
							}
						$tag.html(o);
						}
					}
				else	{
					app.u.dump("No payment methods are available. This happens if the session is non-secure and CC is the only payment option. Other circumstances could likely cause this to happen too.",'warn');
					
					$tag.append("It appears no payment options are currently available.");
					if(document.location.protocol != "https:")	{
						$tag.append("This is not a secure session, so credit card payment is not available.");
						}
					}
				} //payMethodsAsRadioButtons
			
			} //renderFormats

		
		}
	return r;
	}