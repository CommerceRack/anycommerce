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

CHECKOUT_NICE.JS (just here to make it easier to know which extension is open)

************************************************************** */

var convertSessionToOrder = function() {
	var theseTemplates = new Array("productListTemplateCheckout","checkoutSuccess","checkoutTemplateBillAddress","checkoutTemplateShipAddress","checkoutTemplateOrderNotesPanel","checkoutTemplateCartSummaryPanel","checkoutTemplateShipMethods","checkoutTemplatePayOptionsPanel","checkoutTemplate","checkoutTemplateAccountInfo","invoiceTemplate","productListTemplateInvoice","packslipTemplate","productListTemplatePackslip");
	var r = {
	vars : {
		willFetchMyOwnTemplates : true,
		containerID : '',
		legends : {
			"chkoutAccountInfo" : "Account Information",
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
		startCheckout : {
			init : function(containerID)	{
				var r = 0;
//generates the checkout container div and FORM.
//formerly hardcoded to zContent
				app.ext.convertSessionToOrder.vars.containerID = containerID;
				app.ext.convertSessionToOrder.u.createProcessCheckoutModal();
				var $target = $(app.u.jqSelector('#',containerID));
				$target.append(app.renderFunctions.createTemplateInstance('checkoutTemplate','checkoutContainer')).hideLoading();
				
				app.ext.admin.u.handleAppEvents($target)

				if(app.u.determineAuthentication() == 'authenticated')	{
					app.u.dump(" -> user is logged in. set account creation hidden input to 0");
					$('#want-create_customer').val(0);
					}
				
				r = app.ext.convertSessionToOrder.calls.showCheckoutForm.init();
				app.model.dispatchThis("immutable");

				return r; 
				}			
			},
		

		adminOrderDetail : 	{
			init : function(orderID, tagObj ,Q)	{
				tagObj = tagObj || {}
				tagObj.datapointer = 'adminOrderDetail|'+orderID;
				this.dispatch(orderID, tagObj, Q);
				return 1;
				},
			dispatch : function(orderID, tagObj, Q)	{
				Q = Q || 'immutable';
				app.model.addDispatchToQ({_cmd:'adminOrderDetail',_tag:tagObj,orderid:orderID},Q);
				}			
			},

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
				app.ext.store_checkout.u.nukePayPalEC(); //nuke paypal token anytime the cart is updated.
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
				return this.dispatch();; //at least 5 calls will be made here. maybe 6.
				},
			dispatch : function()	{
//r is set to 5 because five of these calls are fixed.
//yes, I could have done a += for each call, but since they're also a guaranteed request, just hard code this. It'll be faster and can always be changed later.
				var r = 5;  
//Do inventory check if inventory matters.
//multiple inv_mode by 1 to treat as number. inventory only matters if 2 or greater.
				app.u.dump("REMINDER!!! inventory check disabled because zglobals not available.");
//				if((zGlobals.globalSettings.inv_mode * 1) > 1)	{ 
//					r += app.ext.store_checkout.calls.cartItemsInventoryVerify.init("handleInventoryUpdate");
//					}
				app.ext.store_checkout.calls.appPaymentMethods.init();
				app.ext.store_checkout.calls.appCheckoutDestinations.init();
				app.ext.store_checkout.calls.cartShippingMethodsWithUpdate.init();
				app.calls.refreshCart.init({'callback':'loadPanelContent','extension':'convertSessionToOrder'},'immutable');
				return r;
				}
			}, //showCheckoutForm



//sfo is serialized form object.
		cartItemsAdd : {
			init : function(sfo,tagObj)	{
				tagObj = tagObj || {}; 
				tagObj.datapointer = 'atc_'+app.u.unixNow(); //unique datapointer for callback to work off of, if need be.
				this.dispatch(sfo,tagObj);
				return 1; //an add to cart always resets the paypal vars.
				},
			dispatch : function(sfo,tagObj)	{
				sfo["_cmd"] = "cartItemsAdd"; //cartItemsAddSerialized
				sfo["_tag"] = tagObj;
				app.model.addDispatchToQ(sfo,'immutable');

				}
			},//addToCart




//formerly createOrder
		adminOrderCreate : {
			init : function(callback)	{
//serializes just the payment panel, which is required for payment processing to occur (CC numbers can't be store anywhere, even in the session)
//seems safari doesn't like serializing a fieldset. capture individually.
//				var payObj = $('#chkoutPayOptionsFieldset').serializeJSON();
				
				this.dispatch(callback);
				return 1;

				},
			dispatch : function(callback)	{
				var payObj = {};

// initially, was serializing the payment panel only.  Issues here with safari.
// cc info is saved in memory so that if payment panel is reloaded, cc# is available. so that reference is used for cc and cv.

				payObj['_cmd'] = 'adminOrderCreate';
				payObj['_tag'] = {"callback":callback,"extension":"convertSessionToOrder","datapointer":"adminOrderCreate"}
				
//				app.u.dump("PayObj to follow:");
//				app.u.dump(payObj);

				app.model.addDispatchToQ(payObj,'immutable');
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
				app.u.dump('BEGIN app.ext.convertSessionToOrder.calls.processCheckout.init');
				$('#modalProcessCheckout').dialog('open');
				$('#chkoutSummaryErrors').empty(); //clear any existing global errors. //blank out any existing global errors so that only new error appear.
				$('#chkoutPlaceOrderBtn').attr('disabled','disabled').addClass('ui-state-disabled '); //disable the button to avoid double-click.
//				return; //die here to test

//the buyer could be directed away from the store at this point, so save everything to the session/cart.
				var serializedCheckout = $('#zCheckoutFrm').serializeJSON();
//po number is used for purchase order payment method, but also allowed for a reference number (if company set and po not payment method).
				if(app.ext.convertSessionToOrder.vars['want/payby'] != "PO" && serializedCheckout['want/reference_number'])	{
					serializedCheckout['want/po_number'] = serializedCheckout['want/reference_number'];
					}
//these aren't valid checkout field. used only for some logic processing.
				delete serializedCheckout['want/reference_number'];
				delete serializedCheckout['want/bill_to_ship_cb'];
//cc and cv should never go. They're added as part of cartPaymentQ
				delete serializedCheckout['payment/cc'];
				delete serializedCheckout['payment/cv'];

/* these fields are in checkout/order create but not 'supported' fields. don't send them */				
				delete serializedCheckout['giftcard'];
				delete serializedCheckout['want/bill_to_ship_cb'];
				delete serializedCheckout['coupon'];

				app.calls.cartSet.init(serializedCheckout);

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
				
				return 1;
				},
			dispatch : function(callback)	{
				app.model.addDispatchToQ({"_cmd":"cartCheckoutValidate","sender":"ADMIN","_tag" : {"callback":callback,"extension":"convertSessionToOrder"}},'immutable');
				}
			}
		}, //calls









					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\









	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
		init : {
			onSuccess : function()	{
				app.model.fetchNLoadTemplates('extensions/admin/order_create.html',theseTemplates);
				
				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/order_create.css','order_create_styles']);
				
				return true; //no validation (there's no dependencies).
				},
			onError : function()	{
				app.u.dump('BEGIN app.ext.convertSessionToOrder.callbacks.init.error');
				//This would be reached if a templates was not defined in the view.
				$(app.u.jqSelector('#',app.ext.convertSessionToOrder.vars.containerID)).removeClass('loadingBG');
				}
			}, //init


//SET THIS AS THE CALLBACK ON THE EXTENSION LOADER IF YOU WANT TO IMMEDIATELY START CHECKOUT
		startCheckout : {
			onSuccess : function() {
				app.ext.convertSessionToOrder.calls.startCheckout.init(app.ext.admin.vars.tab+'Content');
				},
			onError : function() {
//to get here, something catastrophic would have happened and other error messaging would have handled it.
				}
			},

//executed on the callback of a customer lookup.
		useLookupForCustomerGet : {
			onSuccess : function(tagObj)	{
//				app.u.dump(" -> tagObj:");  app.u.dump(tagObj);
				if(app.data[tagObj.datapointer] && app.data[tagObj.datapointer].CID)	{
					//Match FOund.
					app.calls.cartSet.init({"customer/cid":app.data[tagObj.datapointer].CID});
					app.ext.admin.calls.customer.adminCustomerGet.init(app.data[tagObj.datapointer].CID,{'callback':'startCheckout','extension':'convertSessionToOrder'},'immutable');
					app.model.dispatchThis('immutable');
					}
				else	{
					//no match.
					$('#createOrderButtonBar').show();
					$(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')).hideLoading();
					app.u.throwMessage("No record found for that email address.");
					}
				}
			},


		printById : {
			
			onSuccess : function(tagObj){
				
				var tmpData = {};
				//merge is another data pointer, in this case the profile pointer. both data sets are merged and passed into transmogrify
				//this is because a template only wants to be parsed once.
				if(tagObj.merge)	{
					tmpData = $.extend(app.data[tagObj.datapointer],app.data[tagObj.merge]);
					}
				else	{
					tmpData =app.data[tagObj.datapointer];
					}
				$('#printContainer').append(app.renderFunctions.transmogrify({},tagObj.templateID,tmpData));
//in debug mode, show the print container. This is because in local, you can't print.
//needs to be before the printElementByID because that element has a JS error for local printing.				
				if(app.u.getParameterByName('debug'))	{
					$('#printContainer').show();
					}
				$('body').hideLoading();
				app.u.printByElementID('printContainer');
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




		addGiftcardToCart : {
			onSuccess : function(tagObj)	{
				app.u.dump('got to addGiftcardToCart success');
//after a gift card is entered, update the payment panel as well as the cart/invoice panel.
				app.ext.convertSessionToOrder.panelContent.cartContents();
				app.ext.convertSessionToOrder.panelContent.paymentOptions();
var msg = app.u.successMsgObject('Your gift card has been added.');
msg.parentID = 'giftcardMessaging'
app.u.throwMessage(msg);

//update the panel only on a successful add. That way, error messaging is persistent. success messaging gets nuked, but coupon will show in cart so that's okay.
				app.calls.refreshCart.init({"callback":"updateCheckoutOrderContents","extension":"convertSessionToOrder"},'immutable');
				app.model.dispatchThis('immutable');


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
var msg = app.u.successMsgObject('Your coupon has been added.');
msg.parentID = 'couponMessaging'
app.u.throwMessage(msg);

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
						
						
						$('#appCreateOrderMessaging').toggle(true).append(app.u.formatMessage({'message':r,'uiIcon':'alert'}));

						}

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


		handleBuyerLogin : {
			onSuccess : function(tagObj){
//				app.u.dump('BEGIN convertSessionToOrder.callbacks.handleBuyerLogin.success');
//				app.u.dump(" -> tagObj:"); app.u.dump(tagObj);
				app.ext.convertSessionToOrder.calls.showCheckoutForm.init();
				app.model.dispatchThis('immutable');
				},
			onError : function(responseData)	{
				app.u.throwMessage(responseData);
//login attempt failed, but show checkout form anyway so user can proceed.
				app.ext.convertSessionToOrder.calls.showCheckoutForm.init();
				app.model.dispatchThis('immutable');
				}
			},



		updateCheckoutOrderContents : {
			onSuccess : function(){
				app.ext.convertSessionToOrder.panelContent.cartContents();
				},
			onError : function(responseData)	{
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
				app.ext.convertSessionToOrder.calls.adminOrderCreate.init("checkoutSuccess");
				app.model.dispatchThis('immutable');
				},
			onError : function(responseData,uuid)	{
				$('#modalProcessCheckout').dialog('close');
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled '); //make place order button appear and be clickable.
				responseData['_rtag'] = $.isEmptyObject(responseData['_rtag']) ? {} : responseData['_rtag'];
				responseData['_rtag'].targetID = 'chkoutSummaryErrors';
				app.ext.store_checkout.u.showServerErrors(responseData,uuid);
				}
			},



		loadPanelContent : {
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN convertSessionToOrder(nice).callbacks.loadPanelContent.onSuccess');
//had some issues using length. these may have been due to localStorage/expired cart issue. countProperties is more reliable though, so still using that one.			
				var itemsCount = app.model.countProperties(app.data.cartDetail['@ITEMS']);

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
					app.ext.convertSessionToOrder.panelContent.paymentOptions();
//if order notes is on, show panel and populate content.
app.u.dump("REMINDER! order notes disabled because zglobals not avail. always show, never or some method for obtaining zglobals?");
//						if(zGlobals.checkoutSettings.chkout_order_notes == true)	{
//							app.ext.convertSessionToOrder.panelContent.orderNotes();
//							$('#chkoutOrderNotes').toggle(true); 
//							}

				$(app.u.jqSelector('#',app.ext.convertSessionToOrder.vars.containerID)).removeClass('loadingBG');
				
			
				},
			onError : function(responseData,uuid)	{
				$('#appCreateOrderMessaging').append({"message":"It appears something has gone very wrong. Please try again. If error persists, please contact the site administrator.","uiClass":"error","uiIcon":"alert"})
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
				var $zContent = $(app.u.jqSelector('#',app.ext.convertSessionToOrder.vars.containerID)).empty();
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

				app.calls.appCartCreate.init(); //!IMPORTANT! after the order is created, a new cart needs to be created and used. the old cart id is no longer valid. 
				app.calls.refreshCart.init({},'immutable'); //!IMPORTANT! will reset local cart object. 
				app.model.dispatchThis('immutable'); //these are auto-dispatched because they're essential.

				$('#invoiceContainer').append(app.renderFunctions.transmogrify({'id':'invoice_'+orderID,'orderid':orderID},'invoiceTemplate',app.data['order|'+orderID]));

				},
			onError : function(responseData,uuid)	{
				$('#modalProcessCheckout').dialog('close');
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled '); //make place order button appear and be clickable.
				responseData['_rtag'] = $.isEmptyObject(responseData['_rtag']) ? {} : responseData['_rtag'];
				responseData['_rtag'].targetID = 'chkoutSummaryErrors';
				app.ext.store_checkout.u.showServerErrors(responseData,uuid);


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
				sum += app.data.cartDetail['@ITEMS'].length > 0 ? 1 : function(){$globalErrors.append(app.u.formatMessage("Cart must have at least one item in it")); return 0;}; //cart needs to have at least one item in it.
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
					$('#chkoutShipMethodsFieldsetErrors').toggle(true).append(app.u.formatMessage("Please select a shipping method. Cart must have items in it"));
					$('#chkoutShipMethodsFieldset').removeClass('validatedFieldset');
					}
				if(valid == 1)	{

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

						case 'CREDIT':
							var $paymentCC = $("[name='CC']").removeClass('mandatory');
							var $paymentMM = $("[name='MM']").removeClass('mandatory');
							var $paymentYY = $("[name='YY']").removeClass('mandatory');
							var $paymentCV = $("[name='CV']").removeClass('mandatory');
							if(!app.u.isValidCC($paymentCC.val())){$paymentCC.parent().addClass('mandatory'); valid = 0; errMsg += '<li>please enter a valid credit card #<\/li>'}
							if(!app.u.isValidMonth($paymentMM.val())){$paymentMM.parent().addClass('mandatory'); valid = 0; errMsg += '<li>please select an exipration month<\/li>'}
							if(!app.u.isValidCCYear($paymentYY.val())){$paymentYY.parent().addClass('mandatory'); valid = 0; errMsg += '<li>please select an expiration year<\/li>'}
							if($paymentCV.val().length < 3){$paymentCV.parent().addClass('mandatory'); valid = 0; errMsg += '<li>please enter a cvv/cid #<\/li>'}
							break;

//eCheck has required=required on it, so the browser will validate. if this causes no issues, we'll start moving all forms over to this instead of 
//js validation. browser based validation is new at this point. (2012-06-22)

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
					$("#billAddressUL").show();
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
					$("#shipAddressUL").show();
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
app.u.dump("REMINDER!!! phone number requirements are disabled because zglobals not available.");
/*
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
				
*/				
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
the authstate determines what shows in the preflight panel. It could be email and facebook login with a link for existing users
or if the user is already logged in, it could just be their email address printed out (no changing it).
after a login occurs, all the panels are updated because the users account could effect just about anything, including shipping options, 
payment options, pricing, etc
*/




			accountInfo : function()	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.panelContent.accountInfo.  ');
				var authState = app.u.determineAuthentication();
				var createCustomer = app.data.cartDetail['want/create_customer'] ? app.data.cartDetail['want/create_customer'] : 0;
				
//				app.u.dump(' -> createCustomer = '+createCustomer);


				if(authState == 'authenticated' || authState == 'thirdPartyGuest')	{
//in this case, the account creation panel isn't even rendered.
					createCustomer = 0; //make sure create account is turned off.
					$('#chkoutAccountInfoFieldset').toggle(false); //make sure panel is hidden
//					app.u.dump(' -> user is already logged via zoovy or third party. create account panel not shown.');
					}
				else {
//though it may not be visible, the panel is still rendered and then toggled on/off based on the create account checkbox.
					if(createCustomer == 0)	{
						$("#want-create_customer_cb").removeAttr('checked');  //make sure checkbox is not checked.
						$('#chkoutAccountInfoFieldset').toggle(false); //make sure panel is hidden
//						app.u.dump(' -> createCustomer == 0 (effectively, the create account checkbox is NOT checked). create account panel not shown.');
						}
					else	{
						$('#chkoutAccountInfoFieldset').toggle(true);
//						app.u.dump(' -> createCustomer == 1. Show the panel.');
						}
	
					var o = "";
	
					var $panelFieldset = $("#chkoutAccountInfoFieldset").removeClass("loadingBG")
					$panelFieldset.append(app.renderFunctions.createTemplateInstance('checkoutTemplateAccountInfo','accountInfoContainer'));
					app.renderFunctions.translateTemplate(app.data.cartDetail,'accountInfoContainer');	
	
					$('#want-create_customer').val(createCustomer); //set the hidden form input to appropriate value.
					}
					
				},
				
/*
a guest checkout gets just a standard address entry. 
an existing user gets a list of previous addresses they've used and an option to enter a new address.
*/
			billAddress : function()	{
				app.u.dump('BEGIN convertSessionToOrder.panelContent.billAddress.  ');
				var data = app.data.cartDetail;
				var txt = '';
				var cssClass; //used to hide the form inputs if user is logged in and has predefined addresses. inputs are still generated so user can create a new address.
				var CID = app.ext.convertSessionToOrder.u.getCID();
				var addresses = false
				
				if(CID)	{
//					app.u.dump(" -> CID is set: "+CID);
					addresses = app.ext.convertSessionToOrder.u.getAddressesByType('bill',CID);
//					app.u.dump(" -> addresses: "); app.u.dump(addresses);
					if(addresses)	{
						txt = "Please choose from (click on) billing address(es) below:";
						txt += app.ext.convertSessionToOrder.u.addressListOptions('bill'); // creates pre-defined address blocks.
						cssClass = 'displayNone';
						}
					else{} //creating an order for a user, but no addresses on file.
					}
				else	{} //no cid set. most likely creating order for new user.


//troubleshooting IE issues, so saved to var instead of manipulating directly. may not need this, but test in IE if changed.
				var $panelFieldset = $("#chkoutBillAddressFieldset").removeClass("loadingBG").append("<p>"+txt+"<\/p>");
				$panelFieldset.append(app.renderFunctions.createTemplateInstance('checkoutTemplateBillAddress','billAddressUL'));
				app.renderFunctions.translateTemplate(app.data.cartDetail,'billAddressUL');
				$('#billAddressUL').addClass(cssClass);

//if order create is for an existing user and they have shipping addresses on file, don't show the 'ship to bill', just display both sets of addresses.
				if(CID && app.ext.convertSessionToOrder.u.getAddressesByType('ship',CID))	{
					$("#want-bill_to_ship_cb").removeAttr("checked");
					$("#want-bill_to_ship").val('0');
					$("#want-bill_to_ship_cb_container").hide();
					$('#chkoutShipAddressFieldset').show(); //make sure shipping panel is visible.
					}
				else if(app.data.cartDetail['want/bill_to_ship']*1 == 0)	{
//					app.u.dump(' -> bill to ship is not checked ('+app.data.cartDetail['want/bill_to_ship']+')');
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
//if only one predefined address exists, trigger a click to 'select' it by default.
				if(addresses.length == 1)	{
					$("address:first","#chkoutBillAddressFieldset").trigger('click');
					}
				else	{}
//				app.u.dump('END app.ext.convertSessionToOrder.panelContent.billAddress.');
				}, //billAddress
				
				
			shipAddress : function()	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.panelContent.shipAddress.  ');
				var CID = app.ext.convertSessionToOrder.u.getCID();
				var addresses = false
				var txt = '';
				var cssClass = '';  //used around the form fields. turned off if pre-defined addresses exist, but form is still generated so a new address can be added.
				var $panelFieldset = $("#chkoutShipAddressFieldset");
				
				if(CID)	{
//					app.u.dump(" -> CID is set: "+CID);
					addresses = app.ext.convertSessionToOrder.u.getAddressesByType('ship',CID);
//					app.u.dump(" -> addresses: "); app.u.dump(addresses);
					if(addresses)	{
						txt = "Please choose from (click on) shipping address(es) below:";
						txt += app.ext.convertSessionToOrder.u.addressListOptions('ship'); // creates pre-defined address blocks.
						cssClass = 'displayNone';
						}
					else{} //creating an order for a user, but no addresses on file.
					}
				else	{} //no cid set. most likely creating order for new user.

				$panelFieldset.removeClass('loadingBG').append(txt);

				$panelFieldset.append(app.renderFunctions.createTemplateInstance('checkoutTemplateShipAddress','shipAddressUL'));
				app.renderFunctions.translateTemplate(app.data.cartDetail,'shipAddressUL');
				$('#shipAddressUL').addClass(cssClass);

//from a usability perspective, we don't want a single item select list to show up. so hide if only 1 or 0 options are available.
				if(app.data.appCheckoutDestinations['@destinations'].length < 2)
					$('#shipCountryContainer').toggle(false);
//if only one predefined address exists, trigger a click to 'select' it by default.
				if(addresses.length == 1)	{
					$("address:first","#chkoutShipAddressFieldset").trigger('click');
					}
				}, //shipAddress


			shipMethods : function()	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.panelContent.shipMethods');

				var $panelFieldset = $("#chkoutShipMethodsFieldset").removeClass("loadingBG");
				$panelFieldset.append(app.renderFunctions.createTemplateInstance('checkoutTemplateShipMethods','shipMethodsContainer'));
				app.renderFunctions.translateTemplate(app.data.cartDetail,'shipMethodsContainer');
				var CID = app.ext.convertSessionToOrder.u.getCID();
				
//must appear after panel is loaded because otherwise the divs don't exist.
//per brian, use shipping methods in cart, not in shipping call.
				if(app.data.cartDetail['@SHIPMETHODS'].length == 0)	{
					$('#noShipMethodsAvailable').show();
					}
				else	{
					$('#noShipMethodsAvailable').hide();
					}
//if existing addresses are present, don't show zip code message because zip isn't actually populated in the form.
				if(!$('#data-bill_zip').val() && !$('#data-bill_zip').val() && !CID) {
					$('#noZipShipMessage').show();
					}
				else	{
					$('#noZipShipMessage').hide();
					}

/*
it's possible that a ship method is set in the cart that is no longer available.
this could happen if 'local pickup' is selected, then country,zip,state, etc is changed to a destination where local pickup is not available.
in these instances, the selected method in the cart/memory/local storage must get nuked.
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





//displays the cart contents in a non-editable format in the right column of checkout		
			cartContents : function()	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.panelContent.cartContents');
				$('#chkoutCartSummary').show(); //make sure this is visible.
				var $container = $('#chkoutCartSummaryContainer').show(); //make sure panel is visible.

/*
checkoutCartSummary is the id given once the 'container' template has been rendered. It only needs to be rendered once. 
 -> this is more efficient. This also solves any error handling issues where the dom isn't updated prior to error messaging being added (the div may not exist yet).
two of it's children are rendered each time the panel is updated (the prodlist and cost summary)
*/
				if($('#chkoutCartSummary').length == 0)	{
//					app.u.dump(" -> chkoutCartSummary has no children. render entire panel.");
					$container.append(app.renderFunctions.createTemplateInstance('checkoutTemplateCartSummaryPanel','chkoutCartSummary'));
					}
				$('#checkoutStuffList').empty(); //since the template isn't getting generated empty each time, the list must be manually emptied.
//SANITY -> yes, the template only needs to be added once (above) but it needs to be translated each time this function is executed.
				app.renderFunctions.translateTemplate(app.data.cartDetail,'chkoutCartSummary');
//use the payby var, not radio, because the radio button may not exist on the DOM at this point
//also, don't show it till a payment method is selected. Then it is less likely to appear then disappear because PO was selected.
				if($('#data-bill_company').val() && app.ext.convertSessionToOrder.vars['want/payby'] && app.ext.convertSessionToOrder.vars['want/payby'] != "PO")	{$('#referenceNumberContainer').show()}
				else	{$('#referenceNumberContainer').hide()} //things to change tho, so this hide is here in case it was shown but now needs to be hidden.
				
				}, //cartContents



			paymentOptions : function()	{
				app.u.dump('app.ext.convertSessionToOrder.panelContent.paymentOptions has been executed');
				var $panelFieldset = $("#chkoutPayOptionsFieldset").toggle(true).removeClass("loadingBG")
				$panelFieldset.append(app.renderFunctions.createTemplateInstance('checkoutTemplatePayOptionsPanel','payOptionsContainer'));
				app.renderFunctions.translateTemplate(app.data.appPaymentMethods,'payOptionsContainer');
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
					app.ext.convertSessionToOrder.u.updatePayDetails($panelFieldset);
					app.ext.convertSessionToOrder.vars["want/payby"] = $(this).val();
					$("#chkoutPayOptionsFieldsetErrors").addClass("displayNone");
					})
				app.u.dump(" -> app.ext.convertSessionToOrder.vars['want/payby']: "+app.ext.convertSessionToOrder.vars['want/payby'])
				if(app.ext.convertSessionToOrder.vars['want/payby'])	{
					$(":radio[value='"+app.ext.convertSessionToOrder.vars['want/payby']+"']",$panelFieldset).click();
					}

//				app.ext.convertSessionToOrder.u.updatePayDetails(app.ext.convertSessionToOrder.vars['want/payby']);
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

		a : {
			
			openCreateOrderForm : function(){
				app.calls.appCartCreate.init({'callback':'disableLoading','targetID':app.ext.admin.vars.tab+'Content'},'immutable');
				app.model.dispatchThis('immutable');
				$target = $(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')).empty();
				$target.append("<div id='appCreateOrderMessaging' \/><h1>Create order<\/h1>");
				
				var $buttonBar = $("<div \/>").attr('id','createOrderButtonBar');
				$buttonBar.append($("<button \/>").text("New Customer").button().click(function(){
					$buttonBar.hide();
					$target.showLoading();
					app.ext.convertSessionToOrder.calls.startCheckout.init(app.ext.admin.vars.tab+'Content');
					app.model.dispatchThis('immutable');
					}));
				$buttonBar.append($("<input \/>").attr({'type':'email','id':'customerLookupByEmail'}).val('email address').css('margin','0 5px 0 24px').click(function(){$(this).val('')}));
				$buttonBar.append($("<button \/>").text("Find Customer").button().click(function(){
					$buttonBar.hide();
					$target.showLoading();
					app.ext.admin.calls.customer.adminCustomerLookup.init($('#customerLookupByEmail').val(),{'callback':'useLookupForCustomerGet','extension':'convertSessionToOrder'});
					app.model.dispatchThis();
					}));
				$buttonBar.appendTo($target);
				$target.showLoading();
				},
//currently supported types are packslip and invoice (case sensitive to match template ID's)
			printOrder : function(orderID,P){
//				app.u.dump(" -> P: "); app.u.dump(P);
				$('#printContainer').empty();
				$('body').showLoading(); //indicate to client that button was pressed.
				app.calls.appProfileInfo.init({'profile':P.data.profile},{},'immutable');				
				app.ext.convertSessionToOrder.calls.adminOrderDetail.init(orderID,{'callback':'printById','merge':'appProfileInfo|'+P.data.profile,'extension':'convertSessionToOrder','templateID':P.data.type.toLowerCase()+'Template'});
				app.model.dispatchThis('immutable');
				},
			
			addToCart : function(formObj){
				if(formObj.price != ""){}
				else{delete formObj.price} //if no price is, do not pass blank or the item will be added with a zero price.
				app.ext.convertSessionToOrder.calls.cartItemsAdd.init(formObj,{}); //add the item first. now get data to update panels.
				app.ext.store_checkout.calls.appPaymentMethods.init();
				app.ext.store_checkout.calls.appCheckoutDestinations.init();
				app.ext.store_checkout.calls.cartShippingMethodsWithUpdate.init('updateCheckoutShipMethods');
				app.calls.refreshCart.init({"callback":"updateCheckoutOrderContents","extension":"convertSessionToOrder"},'immutable');
				app.model.dispatchThis('immutable');
				}




			},

////////////////////////////////////   						util [u]			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {

			getCID : function()	{
				var r; //what is returned. false unless customer ID is set.
				if(app.data.adminCustomerLookup && app.data.adminCustomerLookup.CID)	{r = app.data.adminCustomerLookup.CID}
				else {r = false}
				return r;
				},



			getAddressesByType : function(type,CID){
//				app.u.dump("BEGIN convertSessionToOrder.u.getAddressesByType");
				var r = false;
				if(CID && type)	{
					if(app.data['adminCustomerGet|'+CID] && app.data['adminCustomerGet|'+CID]['%CUSTOMER'] && !$.isEmptyObject(app.data['adminCustomerGet|'+CID]['%CUSTOMER']['@'+type.toUpperCase()])){
						r = app.data['adminCustomerGet|'+CID]['%CUSTOMER']['@'+type.toUpperCase()];
						}
					else	{} //no addresses set.
					}
				else	{
					app.u.throwGMessage("WARNING! type["+type+"] and CID ["+CID+"] both required for convertSessionToOrder.u.getAddressesByType");
					}
				return r; 				
				},

//when a country is selected, the required attribute must be added or dropped from state/province.
//this is important because the browser itself will indicate which fields are required.
//some countries do not have state/province, so for international it is automatically not required.
			countryChange : function(type,country)	{
				app.u.dump('BEGIN convertSessionToOrder.u.countryChange. type: '+type+' and country: '+country)
				if(country == 'US')	{
					$('#data-'+type+'_state').attr('required','required');
					}
				else	{
					app.u.dump(' -> got here: '+type);
					$('#data-'+type+'_state').removeAttr('required').parent().removeClass('mandatory');
					}
				},


//pass in either 'bill' or 'ship' to determine if any predefined addresses for that type exist.
			buyerHasPredefinedAddresses : function(TYPE)	{
				var r; //What is returned. TFU.  U = unknown (no TYPE)
				var CID = app.ext.convertSessionToOrder.u.getCID();
				if(CID && app.data['setCustomerRecord'+CID] && !$.isEmptyObject(app.data['setCustomerRecord'+CID]['%CUSTOMER']['@'+TYPE.toUpperCase()]))	{
					r = true
					}
				else	{r = false}
				return r;
				},




/*
executing when quantities are adjusted for a given cart item.
call is made to update quantities.
When a cart item is updated, it'll end up getting re-rendered, so data-request-state doesn't need to be updated after the request.
Since theres no 'submit' or 'go' button on the form, there was an issue where the 'enter' keypress would double-execute the onChange event.
so now, the input is disabled the first time this function is executed and a disabled class is added to the element. The presence of this class
allows us to check and make sure no request is currently in progress.
*/
			updateCartQty : function($input,tagObj)	{
				
				var stid = $input.attr('data-stid');
				var qty = $input.val();
				
				if(stid && qty && !$input.hasClass('disabled'))	{
					$input.attr('disabled','disabled').addClass('disabled');
/*
the request for quantity change needs to go first so that the request for the cart reflects the changes.
the dom update for the lineitem needs to happen last so that the cart changes are reflected, so a ping is used.
*/
					app.ext.store_cart.calls.cartItemUpdate.init(stid,qty);

					app.ext.convertSessionToOrder.u.handlePanel('chkoutShipMethods'); //empty panel. set to loading.
					app.ext.store_checkout.calls.cartShippingMethodsWithUpdate.init("updateCheckoutShipMethods"); //update shipping methods and shipping panel

					app.ext.convertSessionToOrder.u.handlePanel('chkoutPayOptions'); //empty panel. set to loading.
					app.ext.store_checkout.calls.appPaymentMethods.init("updateCheckoutPayOptions");

					app.calls.refreshCart.init({"callback":"updateCheckoutOrderContents","extension":"convertSessionToOrder"},'immutable');  //updates cart object and reloads order contents panel.
	
//lineitem template only gets updated if qty > 1 (less than 1 would be a 'remove').
					if(qty >= 1)	{
						app.calls.ping.init(tagObj,'immutable');
						}
					else	{
						$('#cartViewer_'+app.u.makeSafeHTMLId(stid)).empty().remove();
						}
					app.model.dispatchThis('immutable');
					}
				else	{
					app.u.dump(" -> a stid ["+stid+"] and a quantity ["+qty+"] are required to do an update cart.");
					}
				},



//generate the list of existing addresses (for users that are logged in )
//appends addresses to a fieldset based on TYPE (bill or ship)

			addressListOptions : function(TYPE)	{
				app.u.dump("BEGIN store_checkout.u.addressListOptions ("+TYPE+")");
				var lctype = TYPE.toLowerCase(); //attributes are bill... or ship...
				var CID = app.ext.convertSessionToOrder.u.getCID();
				var r = "";  //used for what is returned
				var addresses = this.getAddressesByType(TYPE,CID); //address object
				if(TYPE && !$.isEmptyObject(addresses))	{
					app.u.dump(" -> addresses present.");
					var L = addresses.length;
					app.u.dump(" -> # addresses: "+L);
					for(var i = 0; i < L; i += 1)	{
						r += "<address class='pointer ui-state-default ";
						r += "' data-addressClass='"+lctype+"' data-addressId='"+addresses[i]['_id']+"' onClick='app.ext.convertSessionToOrder.u.selectPredefinedAddress(this);' id='"+lctype+"_address_"+addresses[i]['_id']+"'>";
						r +=addresses[i][lctype+'_firstname']+" "+addresses[i][lctype+'_lastname']+"<br \/>";
						r +=addresses[i][lctype+'_address1']+"<br \/>";
						if(addresses[i][lctype+'_address2'])	{r +=addresses[i][lctype+'_address2']+"<br \/>"}
						r += addresses[i][lctype+'_city'];
					//state, zip and country may not be populated. check so 'undef' isn't written to screen.
						if(addresses[i][lctype+'_state']) {r += " "+addresses[i][lctype+'_state']+", "}
						if(addresses[i][lctype+'_zip'])	{r +=addresses[i][lctype+'_zip']}
						if(app.u.isSet(addresses[i][lctype+'_country']))	{r += "<br \/>"+addresses[i][lctype+'_country']}
						r += "<\/address>";
						}
					var parentID = (lctype == 'ship') ? 'chkoutShipAddressFieldset' : 'chkoutBillAddressFieldset';
					r += "<address class='pointer' onClick='$(\"#"+lctype+"AddressUL\").toggle(true); app.ext.store_checkout.u.removeClassFromChildAddresses(\""+parentID+"\");'>Enter new address or edit selected address<\/address>";
					
					}
				else	{
					//no predefined addresses. make sure address input is visible.
					$("#"+lctype+"AddressUL").show();
					}
				return r;
				}, //addressListOptions





//is run when an existing address is selected.
//address object is 'this'
//removes 'selected' class from all other addresses in fieldset.
//sets 'selected' class on focus address
//executes call which updates form fields.
//x = element object (this)
			selectPredefinedAddress : function(addressObject)	{
//				app.u.dump("BEGIN app.ext.convertSessionToOrder.u.selectPredefinedAddress");
				var $t = $(addressObject);
				var addressClass = $t.attr('data-addressClass'); //ship or bill

				$("#"+addressClass+"AddressUL").toggle(false); //turns off display of new address form
				
				app.ext.convertSessionToOrder.u.removeClassFromChildAddresses($t.parent().attr('id'));
				$t.addClass('selected  ui-state-active ui-corner-all');
//wtf? when attempting to pass {"data."+addressClass+"_id" : $t.attr('data-addressId')} directly into the setSession function, it barfed. creating the object then passing it in works tho. odd.
				var idObj = {};
				idObj[addressClass+"/shortcut"] = $t.attr('data-addressId');  //for whatever reason, using this as the key in the setsession function caused a js error. set data.bill_id/data.ship_id = DEFAULT (or whatever the address id is)
//add this to the pdq
				app.calls.cartSet.init(idObj);

//copy the billing address from the ID into the form fields.
				app.ext.convertSessionToOrder.u.setAddressFormFromPredefined(addressClass,$t.attr('data-addressId'));

				if(app.data.cartDetail.bill && app.data.cartDetail.bill.email)	{
					$('#data-bill_email').val(app.data.cartDetail['bill/email']);
					}
				else if(app.data.cartDetail.customer && app.data.cartDetail.customer.cid && app.data['adminCustomerGet|'+app.data.cartDetail.customer.cid])	{
					$('#data-bill_email').val(app.data['adminCustomerGet|'+app.data.cartDetail.customer.cid]['%CUSTOMER']._EMAIL);
					}
				else	{}; //no email recorded yet.

//copy all the billing address fields to the shipping address fields, if appropriate.
				if($('#want-bill_to_ship').val() == '1') {
					app.ext.store_checkout.u.setShipAddressToBillAddress();
					}
/*
rather than going through and picking out just the address fields, send everything up.
This was done because it is:
1. lighter
2. one more way of collecting as much of the data as possible in case checkout is abandoned.
*/
				app.ext.convertSessionToOrder.calls.saveCheckoutFields.init(); 

//for billing addresses, the payment panel must be updated.
				if(addressClass == 'bill')	{
					app.ext.convertSessionToOrder.u.handlePanel('chkoutPayOptions'); //empty panel. set to loading.
					app.ext.store_checkout.calls.appPaymentMethods.init("updateCheckoutPayOptions");
					}
//for shipping addresses, the shipping methods panel needs updating. if predefined addresses exist, no 'ship to bill' checkbox appears.
				else if(addressClass == 'ship')	{
					app.ext.convertSessionToOrder.u.handlePanel('chkoutShipMethods'); //empty panel. set to loading.
					app.ext.store_checkout.calls.cartShippingMethodsWithUpdate.init("updateCheckoutShipMethods"); //update shipping methods and shipping panel
					}
				else	{
					app.u.dump(" -> UNKNOWN class for address selection. should be bill or ship. is: "+addressClass);
					}

				app.calls.refreshCart.init({"callback":"updateCheckoutOrderContents","extension":"convertSessionToOrder"},'immutable');  //updates cart object and reloads order contents panel.
				app.model.dispatchThis('immutable');

				}, //selectPredefinedAddress


//allows for setting of 'ship' address when 'ship to bill' is clicked and a predefined address is selected.
			setAddressFormFromPredefined : function(addressType,addressId)	{
//				app.u.dump('BEGIN store_checkout.u.setAddressFormFromPredefined');
//				app.u.dump(' -> address type = '+addressType);
//				app.u.dump(' -> address id = '+addressId);

				var CID = app.ext.convertSessionToOrder.u.getCID();
				var addresses = this.getAddressesByType(addressType,CID); //address object
				var emailAddress = "";
				if(CID && app.data['appCustomerGet|'+CID] && app.data['appCustomerGet|'+CID]['%CUSTOMER'])	{
					emailAddress = app.data['appCustomerGet|'+CID]['%CUSTOMER']._EMAIL;
					}
				var L = addresses.length
				var a;
				var r = false;
//looks through predefined addresses till it finds a match for the address id. sets a to address object.
				for(var i = 0; i < L; i += 1)	{
					if(addresses[i]['_id'] == addressId){
						a = addresses[i];
						r = true;
						break;
						}
					}
				
//				app.u.dump(' -> a = ');
//				app.u.dump(a);
				$('#data-'+addressType+'_email').val(a[addressType+'_email'] || emailAddress);
				$('#data-'+addressType+'_address1').val(a[addressType+'_address1']);
				$('#data-'+addressType+'_company').val(a[addressType+'_company']);
				if(app.u.isSet(a[addressType+'_address2'])){$('#data-'+addressType+'_address2').val(a[addressType+'_address2'])};
				$('#data-'+addressType+'_city').val(a[addressType+'_city']);
				$('#data-'+addressType+'_state').val(a[addressType+'_state']);
				$('#data-'+addressType+'_zip').val(a[addressType+'_zip']);
				$('#data-'+addressType+'_country').val(a[addressType+'_country'] ? a[addressType+'_country'] : "US"); //country is sometimes blank. This appears to mean it's a US company?
				$('#data-'+addressType+'_firstname').val(a[addressType+'_firstname']);
				$('#data-'+addressType+'_lastname').val(a[addressType+'_lastname']);
				if(app.u.isSet(a[addressType+'_phone'])){$('#data-'+addressType+'_phone').val(a[addressType+'_phone'])};
				return r;
				}, //setAddressFormFromPredefined



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


//X will be a 1 or a 0 for checked/not checked, respectively
			handleCreateAccountCheckbox : function(X)	{
				app.u.dump('BEGIN app.ext.convertSessionToOrder.u.handleCreateAccountCheckbox');
				app.u.dump(' -> X = '+X);
				app.u.dump(' -> #chkoutAccountInfoFieldset.length = '+$('#chkoutAccountInfoFieldset').length);
				
				$('#want-create_customer').val(X); //update hidden input value to reflect checkbox state.

/*
when checkout initially loads, the checkbox for 'create account' is present, but the panel is not.
don't toggle the panel till after preflight has occured. preflight is done once an email address is obtained.
*/

				if(app.data.cartDetail.bill && app.data.cartDetail.bill.email)	{
					X ? $('#chkoutAccountInfoFieldset').toggle(true) : $('#chkoutAccountInfoFieldset').toggle(false);
					}
//update session.
				app.calls.cartSet.init({"want/create_customer":X});
				app.calls.cartSet.init({"want/create_customer_cb":X});
				app.model.dispatchThis('immutable');
				
//				app.u.dump('END app.ext.convertSessionToOrder.u.handleCreateAccountCheckbox');
				}, //handleCreateAccountCheckbox



//run when a payment method is selected. updates memory and adds a class to the radio/label.
//will also display additional information based on the payment type (ex: purchase order will display PO# prompt and input)
			updatePayDetails : function($container)	{
//				app.u.dump("BEGIN order_create.u.updatePayDetails.");
				var paymentID = $("[name='want/payby']:checked",$container).val();
//				app.u.dump(" -> paymentID: "+paymentID);
//				app.u.dump(" -> $container.length: "+$container.length);

				var o = '';
				$('.ui-state-active',$container).removeClass('ui-state-active ui-corner-top ui-corner-all ui-corner-bottom');
				$('.paybySupplemental', $container).hide(); //hide all other payment messages/fields.
				var $radio = $("[name='want/payby']:checked",$container);
				
				
//				app.u.dump(" -> $radio.length: "+$radio.length);
				var $supplementalContainer = $("[data-ui-supplemental='"+paymentID+"']",$container);
//only add the 'subcontents' once. if it has already been added, just display it (otherwise, toggling between payments will duplicate all the contents)
				if($supplementalContainer.length == 0)	{
					app.u.dump(" -> supplemental is empty. add if needed.");
					var supplementalOutput = app.u.getSupplementalPaymentInputs2(paymentID,app.ext.convertSessionToOrder.vars); //this will either return false if no supplemental fields are required, or a jquery UL of the fields.
//					app.u.dump("typeof supplementalOutput: "+typeof supplementalOutput);
					if(typeof supplementalOutput == 'object')	{
						$radio.parent().addClass('ui-state-active ui-corner-top'); //supplemental content will have bottom corners
//						app.u.dump(" -> getSupplementalPaymentInputs returned an object");
						supplementalOutput.addClass('ui-widget-content ui-corner-bottom');
//save values of inputs into memory so that when panel is reloaded, values can be populated.
						$('input[type=text], select',supplementalOutput).change(function(){
							app.ext.convertSessionToOrder.vars[$(this).attr('name')] = $(this).val(); //use name (which coforms to cart var, not id, which is websafe and slightly different 
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



//panel value could be: chkoutPreflight, chkoutAccountInfo, chkoutBillAddress, chkoutShipAddress
//the legend and error ul are here because this is what is used to set the panels to 'loading' when a request is made.
//adding the error container allows errors to be added while the ajax request is still in progress or finished but content hasn't been added yet.
//basically, guarantees the existence of the error container.
			handlePanel : function(panel,hidden)	{
//				app.u.dump("BEGIN convertSessionToOrder.panels.handlePanel");
//				app.u.dump(" -> panel: "+panel);
//				app.u.dump(" -> hidden: "+hidden);
				var cssClass = hidden == true ? 'displayNone' : ''; //if hidden is enabled, add the displayNone class. Used on initial load of checkout to hide all but the preflight panel.

//here for troubleshooting.

//				app.u.dump('BEGIN app.ext.convertSessionToOrder.u.handlePanel.');
//				app.u.dump(' -> panel = '+panel);
//				app.u.dump(' -> hidden = '+hidden);
//				app.u.dump(' -> cssClass = '+cssClass);

//output which is automatically added to each panel. Used for title and error handling.
				var o = "<legend id='"+panel+"Legend' class='ui-widget-header ui-corner-all'>"+app.ext.convertSessionToOrder.vars.legends[panel]+"<\/legend>";
				o += "<div id='"+panel+"FieldsetErrors'><\/div>";
//if the panel doesn't already exist, create it.
				if(!$(app.u.jqSelector('#',panel+'Fieldset')).length > 0) {
//					app.u.dump(' -> panel does not exist');
					$('#zCheckoutFrm').append("<fieldset id='"+panel+"Fieldset' class='ui-widget ui-widget-content ui-corner-all loadingBG "+cssClass+"'>"+o+"<\/fieldset>");
					}
				else{
//					app.u.dump(' -> panel exists');
					$(app.u.jqSelector('#',panel+'Fieldset')).empty().addClass(' ui-widget ui-widget-content ui-corner-all loadingBG '+cssClass).append(o);
					}
//				app.u.dump('END app.ext.convertSessionToOrder.u.handlePanel.');				
				}, //handlePanel






//run when a shipping method is selected. updates cart/session and adds a class to the radio/label
//the dispatch occurs where/when this function is executed, NOT as part of the function itself.
			updateShipMethod : function(shipID,safeID)	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.u.');	
//				app.u.dump('value = '+shipID);	
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
				app.u.dump("BEGIN app.ext.convertSessionToOrder.u.addressFieldUpdated");
				var SUCR = false; //Sesion Updated. Cart Requested. set to true if these conditions are met so that no duplicate calls are created.
//these changes need to be made before				

				this.handleBill2Ship(); //will set ship vars if bill to ship is checked.
				if(app.ext.store_checkout.u.taxShouldGetRecalculated())	{
					app.u.dump(" -> saveCheckoutFields originated from addressFieldUpdated");
					app.ext.convertSessionToOrder.calls.saveCheckoutFields.init(); //update session with ALL populated fields.
					app.calls.refreshCart.init({"callback":"updateCheckoutOrderContents","extension":"convertSessionToOrder"},'immutable');
					SUCR = true;
					}
//when zip or country is updated, we may need to recalculate the ship methods.
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
					app.ext.store_checkout.u.setShipAddressToBillAddress(); //update all shipping address fields from bill address.
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
						app.ext.store_checkout.calls.appPaymentMethods.init("updateCheckoutPayOptions");
						}

					app.ext.convertSessionToOrder.u.handlePanel('chkoutShipMethods'); //empties panel. sets to loading.
					app.ext.store_checkout.calls.cartShippingMethodsWithUpdate.init("updateCheckoutShipMethods");
					
				
					}
				}, //recalculateShipMethods



//will remove the selected and ui-state-active classes from all address elements within the passed parent div id.
			removeClassFromChildAddresses : function(parentDivId)	{
				$(app.u.jqSelector('#',parentDivId+' address')).each(function() {
					$(this).removeClass('selected  ui-state-active');
					});				
				} //removeClassFromChildAddresses
			},







////////////////////////////////////   						renderFormats			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\







		renderFormats : {
//This will need to get expanded to support a full blown payment status function, using the resource for payments.
//if the resource isn't loaded, then what's here now can be the fallback.
			paymentStatus : function($tag,data)	{
				if(Number(data.value[0]) === 0)	{$tag.append("Paid");}
				else{$tag.append("Unpaid")}
				},

//data should be the order #, which is used to get the entire order object from memory.
			marketPlaceOrderID : function($tag,data)	{
				var order = app.data['adminOrderDetail|'+data.value];
				var output = "";
				if(order.flow.payment_method == 'AMAZON')	{output = order.mkt.amazon_orderid}
				else if(order.flow.payment_method == 'EBAY')	{output = order.mkt.erefid.split('-')[0]}//splitting at dash shows just the ebay item #
				else if(order.flow.payment_method == 'NEWEGG')	{output = order.mkt.erefid}
				else if(order.flow.payment_method == 'BUY')	{output = order.mkt.erefid}
				else if(order.flow.payment_method == 'SEARS')	{output = order.mkt.sears_orderid}
				else{}
				$tag.append(output);
				},

			shipMethodsAsRadioButtons : function($tag,data)	{
//				app.u.dump('BEGIN store_cart.renderFormat.shipMethodsAsRadioButtons');
				var o = '';
				var shipName,id,isSelectedMethod,safeid;  // id is actual ship id. safeid is id without any special characters or spaces. isSelectedMethod is set to true if id matches cart shipping id selected.;
//				data.value.push({'id':'','shipName':'Use custom shipping amount','amount':''})
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

//not supported yet. eventually wll allow a merchant to set the shipping price, method, etc.
//				o += "<li><label><input type='radio' name='want/shipping_id' value='' onChange=\"if($(this).is(':checked'){$('.customShippingAmountInputs').show()} else {$('.customShippingAmountInputs').hide()}\" />Use custom shipping amount<\/label>";
//any time these inputs are changed, their values get added to the Q for update, but they don't get sent for immediate dispatch. not that urgent.
//they're added to immutable so that they go prior to the next cart change (which always uses immutable in this environment)
//				o += "<li class='customShippingAmountInputs'><div><label>Shipping id: <input type='text' name='cart/shipping_id' \/><\/label><\/div>";
//				o += "<div><label>Shipping Carrier: <input type='text' name='sum/shp_carrier' onChange=\"app.calls.cartSet.init({'sum/sum/shp_carrier':$(this).val()},{},'immutable');\" \/><\/label><\/div>";
//				o += "<div><label>Shipping Method: <input type='text' name='sum/shp_method' onChange=\"app.calls.cartSet.init({'sum/shp_method':$(this).val()},{},'immutable');\" \/><\/label><\/div>";
//				o += "<div><label>Shipping Total: <input type='number' size='5' name='sum/shp_total' onChange=\"app.calls.cartSet.init({'sum/shp_total':$(this).val()},{},'immutable');\" \/><\/label><\/div>";
//				o += "<div><label>Insurance Optional: <input type='checkbox' name='is/ins_optional' onChange=\"app.calls.cartSet.init({'is/ins_optional':$(this).val()},{},'immutable');\" \/><\/label><\/div><\/li>";

				o += "<\/li>";
					
				$tag.html(o);

				}, //shipMethodsAsRadioButtons
			




			payMethodsAsRadioButtons : function($tag,data)	{
				var L = data.value.length, o = "", id = ''; // o is the output, appended to $tag. id is a shortcut, recycled in the loop.
				if(L > 0)	{
					for(var i = 0; i < L; i += 1)	{
						id = data.value[i].id;
//onClick event is added through panelContent.paymentOptions
//setting selected method to checked is also handled there.
						o += "<label><input type='radio' name='want/payby' value='"+id+"' /> "+data.value[i].pretty+"<\/label>";
						}
	
					$tag.html(o);
					}
				else	{
					app.u.dump("No payment methods are available. This happens if the session is non-secure and CC is the only payment option. Other circumstances could likely cause this to happen too.");
					
					$tag.append("It appears no payment options are currently available.");
					if(document.location.protocol != "https:")	{
						$tag.append("This is not a secure session, so credit card payment is not available.");
						}
					}
				} //payMethodsAsRadioButtons
			}, //renderFomrats

		e : {
			
			"cartItemAdd" : function($btn)	{
				$btn.button();
				$btn.off('click.cartItemAdd').on('click.cartItemAdd',function(){
					var $button = $("<button>").text("Add to Order").button().on('click',function(){
						$form = $('form','#chooserResultContainer');
						});
					app.ext.admin.a.showFinderInModal('CHOOSER','','',{'$buttons' : $button})
					});
				}
			}
		}
	return r;
	}