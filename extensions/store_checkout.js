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
//SCO = Shared Checkout Object
var store_checkout = function() {
	var r = {
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

//update will modify the cart. only run this when actually selecting a shipping method (like during checkout). heavier call.
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
					"edit_cart_url" : zGlobals.appSettings.https_app_url+"#cart?show=cart&sessionId="+myControl.sessionId,
					"continue_shopping_url" : zGlobals.appSettings.https_app_url+"?sessionId="+myControl.sessionId,
					'_tag':{'callback':'proceedToGoogleCheckout','extension':'convertSessionToOrder','datapointer':'cartGoogleCheckoutURL'}
					},'immutable');
				}
			}, //cartGoogleCheckoutURL	

		cartPaypalSetExpressCheckout : {
			init : function()	{
				var getBuyerAddress = 0;
				if(myControl.ext.store_checkout.util.taxShouldGetRecalculated())
					getBuyerAddress = 1;
				this.dispatch(getBuyerAddress);
				return 1;
				},
			dispatch : function(getBuyerAddress)	{
				var tagObj = {'callback':'handleCartPaypalSetECResponse',"datapointer":"cartPaypalSetExpressCheckout","extension":"convertSessionToOrder"}
				myControl.model.addDispatchToQ({"_cmd":"cartPaypalSetExpressCheckout","cancelURL":zGlobals.appSettings.https_app_url+"#cart?show=cart&sessionId="+myControl.sessionId,"returnURL":zGlobals.appSettings.https_app_url+"#checkout?show=checkout&sessionId="+myControl.sessionId,"getBuyerAddress":getBuyerAddress,'_tag':tagObj},'immutable');
				}
			}, //cartPaypalSetExpressCheckout	


// obj.token and obj.payerid are required.
//this gets executed after a user is returned to checkout from paypal
		cartPaypalGetExpressCheckoutDetails : {
			init : function(obj)	{
//				myControl.util.dump("BEGIN store_checkout.calls.cartPaypalGetExpressCheckoutDetails.init");
//				myControl.util.dump(obj);
				this.dispatch(obj);
				return 1;
				},
			dispatch : function(obj)	{
				var tagObj = {"datapointer":"cartPaypalGetExpressCheckoutDetails","extension":"convertSessionToOrder","callback":"handleCartPaypalGetECDetails"};
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


//formerly createOrder
// !!! this needs to be updated to pass in the formID.
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
// cc info is saved in memory so that if payment panel is reloaded, cc# is available. so that reference is used for cc and cv.
				payObj['payment.cc'] = $('#payment-cc').val();
				payObj['payment.cv'] = $('#payment-cv').val();
				payObj['payment.yy'] = $('#payment-yy').val();
				payObj['payment.mm'] = $('#payment-mm').val();
				payObj['_cmd'] = 'cartOrderCreate';
				payObj['_tag'] = {"callback":callback,"extension":"convertSessionToOrder","datapointer":"cartOrderCreate"}
				
//				myControl.util.dump("PayObj to follow:");
//				myControl.util.dump(payObj);

				myControl.model.addDispatchToQ(payObj,'immutable');
				}
			},//cartOrderCreate

			
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
//no templates or significant checks should occur in this init. templates are app specific (checkout_nice has different templates than checkout_passive)
		init : {
			onSuccess : function()	{
				var r; //returns false if checkout can't load due to account config conflict.
				return r;
				},
			onError : function()	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.init.error');
				//This would be reached if a templates was not defined in the view.
				$('#'+myControl.ext.convertSessionToOrder.vars.containerID).removeClass('loadingBG');
				}
			}, //init

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
				myControl.util.dump('BEGIN convertSessionToOrder[nice].callbacks.handleCartPaypalSetECResponse.onSuccess');
				window.location = myControl.data[tagObj.datapointer].URL
				},
			onError : function(responseData,uuid)	{
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled'); // re-enable checkout button on cart page.
				myControl.util.handleErrors(responseData,uuid);
				}
			},

//mostly used for the error handling.
		handleCartPaypalGetECDetails : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump('BEGIN convertSessionToOrder[nice].callbacks.handleCartPaypalGetECDetails.onSuccess');
//do NOT execute handlePaypalFormManipulation here. It's run in panel view.
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid);
//nuke vars so user MUST go thru paypal again or choose another method.
//nuke local copy right away too so that any cart logic executed prior to dispatch completing is up to date.
				myControl.data.cartItemsList.cart['payment-pt'] = null;
				myControl.data.cartItemsList.cart['payment-pi'] = null;
				myControl.calls.cartSet.init({'payment-pt':null,'payment-pi':null}); 
				myControl.calls.refreshCart.init({},'immutable');
				myControl.model.dispatchThis('immutable');
//### for expediency. this is a set timeout. Need to get this into the proper sequence. needed a quick fix for a production bug tho
				setTimeout("$('#paybySupplemental_PAYPALEC').empty().addClass('ui-state-highlight').append(\"It appears something went wrong with PayPal. Please <a href='#' onClick='myControl.ext.convertSessionToOrder.utilities.handleChangeFromPayPalEC();'>Click Here</a> to choose an alternate payment method.\")",2000);
				}
			},		


//executing this will not only return which items have had an inventory update (in a pretty format) but also create the dispatches
// to update the cart and then to actually update it as well.
// the individual cart update posts (there may be multiple) go without the callback. If callback is added, a ping to execute it is run.
// !!! is this necessary? Doesn't the inventory check actually modify the cart? look in to this.
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
							myControl.ext.convertSessionToOrder.calls.cartItemUpdate.init({"stid":key,"quantity":myControl.data[tagObj.datapointer]['%changes'][key]});
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
					myControl.ext.store_checkout.calls.cartPaypalSetExpressCheckout.init();
					}
				else	{
					myControl.ext.store_checkout.calls.cartOrderCreate.init("checkoutSuccess");
					}
				myControl.model.dispatchThis('immutable');


_gaq.push(['_trackEvent','Checkout','App Event','Server side validation passed']);


				},
			onError : function(responseData,uuid)	{
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled loadingButtonBg'); //make place order button appear and be clickable.
				responseData['_rtag'] = $.isEmptyObject(responseData['_rtag']) ? {} : responseData['_rtag'];
				responseData['_rtag'].targetID = 'chkoutSummaryErrors';
				myControl.ext.store_checkout.util.showServerErrors(responseData,uuid);
				
_gaq.push(['_trackEvent','Checkout','App Event','Server side validation failed']);


				}
			}

		}, //callbacks

		
//push onto this (store_checkout.checkoutCompletes.push(function(P){});
//after checkout, these will be iterated thru and executed.
/*
Parameters included are as follows:
P.orderID
P.sessionID (this would be the sessionID associated w/ the order, not the newly generated session/cart id - reset immediately after checkout )
P.datapointer - pointer to cartOrderCreate

note - the order object is available at myControl.data['order|'+P.orderID]
*/
		checkoutCompletes : [],


////////////////////////////////////   						utilities			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		util : {
//when a country is selected, the required attribute must be added or dropped from state/province.
//this is important because the browser itself will indicate which fields are required.
//some countries do not have state/province, so for international it is automatically not required.
			countryChange : function(type,country)	{
//				myControl.util.dump('BEGIN convertSessionToOrder.utilities.countryChange. type: '+type+' and country: '+country)
				if(country == 'US')	{
					$('#data-'+type+'_state').attr('required','required');
					}
				else	{
					$('#data-'+type+'_state').removeAttr('required').parent().removeClass('mandatory');
					}
				}, //countryChange

//pass in either 'bill' or 'ship' to determine if any predefined addresses for that type exist.
//buyerAddressList data should already have been retrieved by the time this is executed.
			buyerHasPredefinedAddresses : function(TYPE)	{
				var r; //What is returned. TFU.  U = unknown (no TYPE)
				if(TYPE)	{
					if(myControl.data.buyerAddressList && !$.isEmptyObject(myControl.data.buyerAddressList['@'+TYPE]))	{r = true}
					else	{r = false}
					}
				return r;
				},

//generate the list of existing addresses (for users that are logged in )
//appends addresses to a fieldset based on TYPE (bill or ship)

			addressListOptions : function(TYPE)	{
				myControl.util.dump("BEGIN sharedCheckoutUtilities.addressListOptions ("+TYPE+")");

				var r = "";  //used for what is returned
				if(TYPE && this.buyerHasPredefinedAddresses(TYPE))	{

var $a; //a paticular address, set once within the loop. shorter that myControl.data... each reference
var selAddress = false; //selected address. if one has already been selected, it's used. otherwise, _is_default is set as value.
			
//if an address has already been selected, highlight it.  if not, use default.
if(myControl.util.isSet(myControl.data.cartItemsList.cart['data.selected_'+TYPE.toLowerCase()+'_id']))	{
	selAddress = myControl.data.cartItemsList.cart['data.selected_'+TYPE.toLowerCase()+'_id'];								
	}
else	{
	selAddress = myControl.ext.store_checkout.util.determinePreferredAddress(TYPE);
	}

var L = myControl.data.buyerAddressList['@'+TYPE].length;
//myControl.util.dump(" -> # addresses: "+L);
//myControl.util.dump(" -> selectedAddressID = "+selAddress);

for(var i = 0; i < L; i += 1)	{
	a = myControl.data.buyerAddressList['@'+TYPE][i];
//	myControl.util.dump(" -> ID = "+a['_id']);
	r += "<address class='pointer ui-state-default ";
//if an address has already been selected, add appropriate class.
	if(selAddress == a['_id'])	{
//		myControl.util.dump(" -> MATCH!");
		r += ' ui-state-active';
		}
//if no predefined address is selected, add approriate class to account default address
	else if(a['_is_default'] == 1 && selAddress == false)	{
		r += ' ui-state-active ';
//		myControl.util.dump(" -> no address selected. using default. ");
		}
							
	r += "' data-addressClass='"+TYPE+"' data-addressId='"+a['_id']+"' onClick='myControl.ext.store_checkout.util.selectPredefinedAddress(this);' id='"+TYPE+"_address_"+a['_id']+"'>";
	r +=a[TYPE+'_firstname']+" "+a[TYPE+'_lastname']+"<br \/>";
	r +=a[TYPE+'_address1']+"<br \/>";
	if(a[TYPE+'_address2'])	{r +=a[TYPE+'_address2']+"<br \/>"}
	r += a[TYPE+'_city'];
//state, zip and country may not be populated. check so 'undef' isn't written to screen.
	if(a[TYPE+'_state']) {r += " "+a[TYPE+'_state']+", "}
	if(a[TYPE+'_zip'])	{r +=a[TYPE+'_zip']}
	if(myControl.util.isSet(a[TYPE+'_country']))	{r += "<br \/>"+a[TYPE+'_country']}
	r += "<\/address>";
	}
var parentID = (TYPE == 'ship') ? 'chkoutShipAddressFieldset' : 'chkoutBillAddressFieldset';
r += "<address class='pointer' onClick='$(\"#"+TYPE+"AddressUL\").toggle(true); myControl.ext.store_checkout.util.removeClassFromChildAddresses(\""+parentID+"\");'>Enter new address or edit selected address<\/address>";
					
					}
				else	{
					//no predefined addresses. make sure address input is visible.
					$("#"+TYPE+"AddressUL").toggle(true);
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



//will remove the selected and ui-state-active classes from all address elements within the passed parent div id.
			removeClassFromChildAddresses : function(parentDivId)	{
				$('#'+parentDivId+' address').each(function() {
					$(this).removeClass('selected  ui-state-active');
					});				
				}, //removeClassFromChildAddresses
			
//if checkout succeded but payment failed (cash, cc fail, PO, etc) then this function gets executed.
			checkoutSuccessPaymentFailure : function(paycode,payby)	{
				myControl.util.dump('BEGIN store_checkout.util.checkoutSuccessPaymentFailure');
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



//used to display errors that are returned on the validateCheckout call if validation fails. 
//this is executed from a callback. It's here in case it's needed in multiple callbacks.
			showServerErrors : function(responseData,uuid)	{
				if(responseData['@issues'])	{
					var L = responseData['@issues'].length;
	//				myControl.util.dump('BEGIN store_checkout.util.showServerErrors. there are '+L+' errors');
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



//pretty straightforward. If a cid is set, the session has been authenticated.
//if the cid is in the cart/local but not the control, set it. most likely this was a cart passed to us where the user had already logged in or (local) is returning to the checkout page.
//if no cid but email, they are a guest.
//if logged in via facebook, they are a thirdPartyGuest.
//this could easily become smarter to take into account the timestamp of when the session was authenticated.
			
			determineAuthentication : function(){
				var r = 'none';
//was running in to an issue where cid was in local, but user hadn't logged in to this session yet, so now both cid and username are used.
				if(myControl.data.appBuyerLogin && myControl.data.appBuyerLogin.cid)	{r = 'authenticated'}
				else if(myControl.vars.cid && myControl.util.getUsernameFromCart())	{r = 'authenticated'}
				else if(myControl.model.fetchData('cartItemsList') && myControl.util.isSet(myControl.data.cartItemsList.cart.cid))	{
					r = 'authenticated';
					myControl.vars.cid = myControl.data.cartItemsList.cart.cid;
					}
//need to run third party checks prior to default 'guest' check because data.bill_email will get set for third parties
//and all third parties would get 'guest'
				else if(typeof FB != 'undefined' && !jQuery.isEmptyObject(FB) && FB['_userStatus'] == 'connected')	{
					r = 'thirdPartyGuest';
//					myControl.thirdParty.fb.saveUserDataToSession();
					}
				else if(myControl.model.fetchData('cartItemsList') && myControl.data.cartItemsList.cart['data.bill_email'])	{
					r = 'guest';
					}
				else	{
					//catch.
					}
//				myControl.util.dump('myControl.sharedCheckoutUtilities.determineAuthentication run. authstate = '+r); 

				return r;
				},
			
	

/*
sometimes _is_default is set for an address in the list of bill/ship addresses.
sometimes it isn't. sometimes, apparently, it's set more than once.
this function closely mirrors core logic.
*/
			determinePreferredAddress : function(TYPE)	{
//				myControl.util.dump("BEGIN sharedCheckoutUtilities.determinePreferredAddress  ("+TYPE+")");
				var r = false; //what is returned
				if(!TYPE){ r = false}
				else	{
					var L = myControl.data.buyerAddressList['@'+TYPE].length;
//look to see if a default is set. if so, take the first one.
					for(var i = 0; i < L; i += 1)	{
						if(myControl.data.buyerAddressList['@'+TYPE][i]['_is_default'] == 1)	{
							r = myControl.data.buyerAddressList['@'+TYPE][i]['_id'];
							break; //no sense continuing the loop.
							}
						}
//if no default is set, use the first address.
					if(r == false)	{
						r =myControl.data.buyerAddressList['@'+TYPE][0]['_id']
						}
					}
//				myControl.util.dump("address id = "+r);
				
				return r;
				},



	
//is run when an existing address is selected.
//removes 'selected' class from all other addresses in fieldset.
//sets 'selected' class on focus address
//executes call which updates form fields.
//x = element object (this)
			selectPredefinedAddress : function(addressObject)	{
//				myControl.util.dump("BEGIN myControl.ext.convertSessionToOrder.util.selectPredefinedAddress");
				var $x = $(addressObject);
				var addressClass = $x.attr('data-addressClass'); //ship or bill

				$("#"+addressClass+"AddressUL").toggle(false); //turns off display of new address form
				
				myControl.ext.convertSessionToOrder.util.removeClassFromChildAddresses($x.parent().attr('id'));
				$x.addClass('selected  ui-state-active ui-corner-all');
//wtf? when attempting to pass {"data."+addressClass+"_id" : $x.attr('data-addressId')} directly into the setSession function, it barfed. creating the object then passing it in works tho. odd.
				var idObj = {};
				idObj["data.selected_"+addressClass+"_id"] = $x.attr('data-addressId');  //for whatever reason, using this as the key in the setsession function caused a js error. set data.bill_id/data.ship_id = DEFAULT (or whatever the address id is)
				
//				myControl.util.dump(" -> addressClass = "+addressClass);
//				myControl.util.dump(" -> addressID = "+$x.attr('data-addressId'));
//add this to the pdq
				myControl.calls.cartSet.init(idObj);

//copy the billing address from the ID into the form fields.
				myControl.ext.store_checkout.util.setAddressFormFromPredefined(addressClass,$x.attr('data-addressId'));
				$('#data-bill_email').val() == myControl.data.cartItemsList.cart['data.bill_email']; //for passive, need to make sure email is updated too.
//copy all the billing address fields to the shipping address fields, if appropriate.
				if($('#chkout-bill_to_ship').val() == '1') {
					myControl.ext.store_checkout.util.setShipAddressToBillAddress();
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
					myControl.ext.convertSessionToOrder.util.handlePanel('chkoutPayOptions'); //empty panel. set to loading.
					myControl.ext.store_checkout.calls.appPaymentMethods.init("updateCheckoutPayOptions");
					}
//for shipping addresses, the shipping methods panel needs updating. if predefined addresses exist, no 'ship to bill' checkbox appears.
				else if(addressClass == 'ship')	{
					myControl.ext.convertSessionToOrder.util.handlePanel('chkoutShipMethods'); //empty panel. set to loading.
					myControl.ext.store_checkout.calls.cartShippingMethodsWithUpdate.init("updateCheckoutShipMethods"); //update shipping methods and shipping panel
					}
				else	{
					myControl.util.dump(" -> UNKNOWN class for address selection. should be bill or ship. is: "+addressClass);
					}

				myControl.calls.refreshCart.init({"callback":"updateCheckoutOrderContents","extension":"convertSessionToOrder"},'immutable');  //updates cart object and reloads order contents panel.
				myControl.model.dispatchThis('immutable');

_gaq.push(['_trackEvent','Checkout','User Event','Pre-defined address selected ('+addressClass+')']);


				}, //selectPredefinedAddress
				
//sets the values of the shipping address to what is set in the billing address fields.
//can't recycle the setAddressFormFromPredefined here because it may not be a predefined address.
			setShipAddressToBillAddress : function()	{
//				myControl.util.dump('BEGIN sharedCheckoutUtilities.setShipAddressToBillAddress');
				$('#chkoutBillAddressFieldset > ul').children().children().each(function() {
					if($(this).is(':input')){$('#'+this.id.replace('bill_','ship_')).val(this.value)}
					});
				},


//allows for setting of 'ship' address when 'ship to bill' is clicked and a predefined address is selected.
			setAddressFormFromPredefined : function(addressType,addressId)	{
//				myControl.util.dump('BEGIN sharedCheckoutUtilities.setAddressFormFromPredefined');
//				myControl.util.dump(' -> address type = '+addressType);
//				myControl.util.dump(' -> address id = '+addressId);
				
				var L = myControl.data.buyerAddressList['@'+addressType].length
				var a,i;
				var r = false;
//looks through predefined addresses till it finds a match for the address id. sets a to address object.
				for(i = 0; i < L; i += 1)	{
					if(myControl.data.buyerAddressList['@'+addressType][i]['_id'] == addressId){
						a = myControl.data.buyerAddressList['@'+addressType][i];
						r = true;
						break;
						}
					}
				
//				myControl.util.dump(' -> a = ');
//				myControl.util.dump(a);
				$('#data-'+addressType+'_address1').val(a[addressType+'_address1']);
				if(myControl.util.isSet(a[addressType+'_address2'])){$('#data-'+addressType+'_address2').val(a[addressType+'_address2'])};
				$('#data-'+addressType+'_city').val(a[addressType+'_city']);
				$('#data-'+addressType+'_state').val(a[addressType+'_state']);
				$('#data-'+addressType+'_zip').val(a[addressType+'_zip']);
				$('#data-'+addressType+'_country').val(a[addressType+'_country'] ? a[addressType+'_country'] : "US"); //country is sometimes blank. This appears to mean it's a US company?
				$('#data-'+addressType+'_firstname').val(a[addressType+'_firstname']);
				$('#data-'+addressType+'_lastname').val(a[addressType+'_lastname']);
				if(myControl.util.isSet(a[addressType+'_phone'])){$('#data-'+addressType+'_phone').val(a[addressType+'_phone'])};
				return r;
				}, //setAddressFormFromPredefined



//if checkout succeded but payment failed (cash, cc fail, PO, etc) then this function gets executed.
			checkoutSuccessPaymentFailure : function(paycode,payby)	{
				myControl.util.dump('BEGIN myControl.ext.store_checkout.util.checkoutSuccessPaymentFailure');
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
once paypalEC has been approved by paypal, a lot of form fields lock down, but the user may decide to change
payment methods or they may add something new to the cart. If they do, execute this function. It will remove the paypal params from the session/cart and the re-initiate checkout. Be sure to do an immutable dispatch after executing this.
note - dispatch isn't IN the function to give more control to developer. (you may want to execute w/ a group of updates)
*/
			nukePayPalEC : function() {
				if(myControl.data.cartItemsList)	{
					myControl.data.cartItemsList.cart['payment-pt'] = null;
					myControl.data.cartItemsList.cart['payment-pi'] = null;
					}
				myControl.calls.cartSet.init({'payment-pt':null,'payment-pi':null,'chkout.payby':null}); //nuke vars
				return 1;//this is the # of dispatches added to the q.
				},


//for tax to accurately be computed, several fields may be required.
//this function checks to see if they're populated and, if so, returns true.
//also used in cartPaypalSetExpressCheckout call to determine whether or not address should be requested on paypal side or not.
			taxShouldGetRecalculated : function()	{
				myControl.util.dump("BEGIN myControl.ext.store_checkout.util.taxShouldGetRecalculated");
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
//				myControl.util.dump(" -> tax should be recalculated = "+r);
//				myControl.util.dump("END myControl.ext.store_checkout.util.taxShouldGetRecalculated");
				return r;
				} //taxShouldGetRecalculated

			}, //utilities






////////////////////////////////////   						renderFormats			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\







		renderFormats : {
//value is set to ISO and sent to API that way. however, cart object returned is in 'pretty'.
//so a check occurs to set selectedCountry to the selected ISO value so it can be 'selected'
			countriesAsOptions : function($tag,data)	{
//				myControl.util.dump("BEGIN myControl.ext.convertSessionToOrder.renderFormats.countriesAsOptions");
//				myControl.util.dump(" -> Country: "+data.value);
				var r = '';
				var L = myControl.data.appCheckoutDestinations['@destinations'].length;
//				myControl.util.dump(" -> number of countries = "+L);
				for(var i = 0; i < L; i += 1)	{
					r += "<option value='"+myControl.data.appCheckoutDestinations['@destinations'][i].ISO+"' ";
					if(data.value == myControl.data.appCheckoutDestinations['@destinations'][i].Z)
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
					$tag.click(function(){window.open(zGlobals.appSettings.https_app_url+$.trim(data.value)),data.windowName});
				else
					$tag.click(function(){window.location = zGlobals.appSettings.https_app_url+$.trim(data.value)});
				}, //secureLink


			orderStatusLink : function($tag,data)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.renderFormats.orderStatusLink');
				var orderSessionID = myControl.data['order|'+data.value].cart.id;
//				https://ssl.zoovy.com/s=sporks.zoovy.com/customer/order/status?cartid=SESSION&orderid=data.value
				$tag.click(function(){window.location = zGlobals.appSettings.https_app_url+"customer/order/status?cartid="+orderSessionID+"&orderid="+data.value,'orderStatus'});
				
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




//for displaying order balance in checkout order totals.
//changes value to 0 for negative amounts. Yes, this can happen.			
			orderBalance : function($tag,data)	{
				var o = '';
				var amount = data.value;
//				myControl.util.dump('BEGIN myControl.renderFunctions.format.orderBalance()');
//				myControl.util.dump('amount * 1 ='+amount * 1 );
//if the total is less than 0, just show 0 instead of a negative amount. zero is handled here too, just to avoid a formatMoney call.
//if the first character is a dash, it's a negative amount.  JS didn't like amount *1 (returned NAN)
				
				if(amount * 1 <= 0){
//					myControl.util.dump(' -> '+amount+' <= zero ');
					o += data.bindData.currencySign ? data.bindData.currencySign : '$';
					o += '0.00';
					}
				else	{
//					myControl.util.dump(' -> '+amount+' > zero ');
					o += myControl.util.formatMoney(amount,data.bindData.currencySign,'',data.bindData.hideZero);
					}
				
				$tag.text(o);  //update DOM.
//				myControl.util.dump('END myControl.renderFunctions.format.orderBalance()');
				} //orderBalance
			} //renderFormats
		
		} // r
	return r;
	}