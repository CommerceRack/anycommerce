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

//formerly getCustomerAddresses
		buyerAddressList : {
			init : function(callback)	{
				this.dispatch(callback);
				return 1;
				},
			dispatch : function(callback)	{
				app.model.addDispatchToQ({"_cmd":"buyerAddressList","_tag": {"datapointer":"buyerAddressList","callback":callback,"extension":"convertSessionToOrder"}},'immutable');
				}
			}, //buyerAddressList	


		buyerWalletList : {
			init : function(tagObj,Q)	{
//always get fresh copy.
				this.dispatch(tagObj,Q);
				return 1;
				},
			dispatch : function(tagObj,Q)	{
				if(!Q)	{Q = 'mutable'}
				if(typeof tagObj != 'object')	{tagObj = {}}
				tagObj.datapointer = "buyerWalletList";
				app.model.addDispatchToQ({"_cmd":"buyerWalletList","_tag": tagObj},Q);
				}			
			},
//each time the cart changes, so does the google checkout url.
		cartGoogleCheckoutURL : {
			init : function()	{
				this.dispatch();
				return 1;
				},
			dispatch : function()	{
				app.model.addDispatchToQ({
					"_cmd":"cartGoogleCheckoutURL",
					"analyticsdata":"", //must be set, even if blank.
					"edit_cart_url" : zGlobals.appSettings.https_app_url+"#cart?show=cart&sessionId="+app.sessionId,
					"continue_shopping_url" : zGlobals.appSettings.https_app_url+"?sessionId="+app.sessionId,
					'_tag':{'callback':'proceedToGoogleCheckout','extension':'store_checkout','datapointer':'cartGoogleCheckoutURL'}
					},'immutable');
				}
			}, //cartGoogleCheckoutURL	
			
			
//cmdObj - see http://www.zoovy.com/webdoc/?VERB=DOC&DOCID=51609 for details.
		cartPaymentQ : 	{
			init : function(cmdObj,tagObj)	{
//make sure id is set for inserts.
				if(cmdObj.cmd == 'insert' && !cmdObj.ID)	{cmdObj.ID = "201210"+app.u.guidGenerator().substring(0,8)}
				cmdObj['_cmd'] = "cartPaymentQ";
				cmdObj['_tag'] = tagObj;
				this.dispatch(cmdObj);
				return 1;
				},
			dispatch : function(cmdObj)	{
				app.model.addDispatchToQ(cmdObj,'immutable');
				}
			}, //cartPaymentQ

		cartPaypalSetExpressCheckout : {
			init : function()	{
				var getBuyerAddress = 0;
				if(app.ext.store_checkout.u.taxShouldGetRecalculated())
					getBuyerAddress = 1;
				this.dispatch(getBuyerAddress);
				return 1;
				},
			dispatch : function(getBuyerAddress)	{
				var tagObj = {'callback':'handleCartPaypalSetECResponse',"datapointer":"cartPaypalSetExpressCheckout","extension":"convertSessionToOrder"}
				app.model.addDispatchToQ({"_cmd":"cartPaypalSetExpressCheckout","cancelURL":zGlobals.appSettings.https_app_url+"#cart?show=cart&sessionId="+app.sessionId,"returnURL":zGlobals.appSettings.https_app_url+"#checkout?show=checkout&sessionId="+app.sessionId,"getBuyerAddress":getBuyerAddress,'_tag':tagObj},'immutable');
				}
			}, //cartPaypalSetExpressCheckout	


//update will modify the cart. only run this when actually selecting a shipping method (like during checkout). heavier call.
		cartShippingMethodsWithUpdate : {
			init : function(callback)	{
				this.dispatch(callback);
				return 1;
				},
			dispatch : function(callback)	{
//,"trace":"1"
				app.model.addDispatchToQ({"_cmd":"cartShippingMethods","update":"1","_tag": {"datapointer":"cartShippingMethods","callback":callback,"extension":"convertSessionToOrder"}},'immutable');
				}
			}, //cartShippingMethodsWithUpdate


//formerly getCheckoutDestinations
		appCheckoutDestinations : {
			init : function(callback)	{
				this.dispatch(callback);
				return 1;
				},
			dispatch : function(callback)	{
				app.model.addDispatchToQ({"_cmd":"appCheckoutDestinations","_tag": {"datapointer":"appCheckoutDestinations","callback":callback,"extension":"convertSessionToOrder"}},'immutable');
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

				app.model.fetchData('cartDetail'); //will make sure cart is loaded from localStorage (if present) if not in memory.
				if(app.data.cartDetail && app.u.isSet(app.data.cartDetail.sum))	{
					total = app.data.cartDetail.sum.balance_due_total;
					}
				if(country != "US")	{
					// country is defaulted to the form value. If that value is NOT "US", then use it (a country has been selected).
					// if the value is US, then it may be the default setting and the request should w/ country as cart/session value
					// (country may have been set elsewhere) though the form 'should' default correctly, we don't rely on that.
					}
				else if(!$.isEmptyObject(app.data.cartDetail) && app.data.cartDetail.bill && app.data.cartDetail.bill.countrycode)	{
					country = app.data.cartDetail['bill/countrycode']; //use the cart, NOT the form. the form defaults to US. Better to send blank.
					}

				app.model.addDispatchToQ({"_cmd":"appPaymentMethods","_tag": {"datapointer":"appPaymentMethods","callback":callback,"extension":"convertSessionToOrder"},"country":country,"ordertotal":total},'immutable');
				}
			}, //appPaymentMethods	

//formerly addGiftcardToCart
		cartGiftcardAdd : {
			init : function(giftcard,tagObj)	{
				this.dispatch(giftcard,tagObj);
				},
			dispatch : function(giftcard,tagObj)	{
				app.model.addDispatchToQ({"_cmd":"cartGiftcardAdd","giftcard":giftcard,"_tag" : tagObj},'immutable');	
				}			
			}, //cartGiftcardAdd
			
//formerly addCouponToCart
		cartCouponAdd : {
			init : function(coupon,tagObj)	{
				this.dispatch(coupon,tagObj);
				},
			dispatch : function(coupon,tagObj)	{
				app.model.addDispatchToQ({"_cmd":"cartCouponAdd","coupon":coupon,"_tag" : tagObj},'immutable');	
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
//validation has already occured to make sure all the fields are populated and CC# passed checksum.
				

// initially, was serializing the payment panel only.  Issues here with safari.
// cc info is saved in memory so that if payment panel is reloaded, cc# is available. so that reference is used for cc and cv.

				payObj['_cmd'] = 'cartOrderCreate';
				payObj['_tag'] = {"callback":callback,"extension":"convertSessionToOrder","datapointer":"cartOrderCreate"}
				
//				app.u.dump("PayObj to follow:");
//				app.u.dump(payObj);

				app.model.addDispatchToQ(payObj,'immutable');
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
				app.model.addDispatchToQ({"_cmd":"cartItemsInventoryVerify","_tag": {"datapointer":"cartItemsInventoryVerify","callback":callback,"extension":"convertSessionToOrder"}},'immutable');
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
				app.u.dump('BEGIN app.ext.convertSessionToOrder.callbacks.init.error');
				//This would be reached if a templates was not defined in the view.
				$('#'+app.ext.convertSessionToOrder.vars.containerID).removeClass('loadingBG');
				}
			}, //init

		proceedToGoogleCheckout : {
			onSuccess : function(tagObj)	{
				app.u.dump('BEGIN store_checkout.callbacks.proceedToGoogleCheckout.onSuccess');
//code for tracking the google wallet payment in GA as a conversion.
				_gaq.push(function() {
					var pageTracker = _gaq._getAsyncTracker();
					setUrchinInputCode(pageTracker);
					});
//getUrchinFieldValue is defined in the ga_post.js file. It's included as part of the google analytics plugin.
				document.location= app.data[tagObj.datapointer].URL +"&analyticsdata="+getUrchinFieldValue();
				},
			onError : function(responseData,uuid)	{
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled'); // re-enable checkout button on checkout page.
				app.u.throwMessage(responseData,uuid);
				}
			},

		handleCartPaypalSetECResponse : {
			onSuccess : function(tagObj)	{
				app.u.dump('BEGIN store_checkout.callbacks.handleCartPaypalSetECResponse.onSuccess');
				window.location = app.data[tagObj.datapointer].URL
				},
			onError : function(responseData,uuid)	{
				$('#chkoutPlaceOrderBtn').removeAttr('disabled').removeClass('ui-state-disabled'); // re-enable checkout button on cart page.
				app.u.throwMessage(responseData,uuid);
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

note - the order object is available at app.data['order|'+P.orderID]
*/
		checkoutCompletes : [],


//Pass in an object (typically based on $form.serializeJSON) and 
//this will make sure that specific fields are populated based on tender type.
//rather than returning specific error messages (which may need to change based on where this is used, an array of which fields are missing is returned
//plus, this allows for the attribute/fields to be modified w/ css, whereas returning messages wouldn't allow for that.
		validate : {
			
			CREDIT : function(vars)	{
				var errors = new Array(); // what is returned. an array of the payment fields that are not correct. 
				if(vars.CC && app.u.isValidCC(vars.CC))	{} else	{errors.push("CC");}
				if(vars.MM && app.u.isValidMonth(vars.MM))	{} else {errors.push("MM");}
				if(vars.YY && app.u.isValidCCYear(vars.YY))	{} else {errors.push("YY");}
				if(vars.CV && vars.CV.length > 2){} else {errors.push("CV")}
				return (errors.length) ? errors : false;
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


////////////////////////////////////   						util [u]			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
//when a country is selected, the required attribute must be added or dropped from state/province.
//this is important because the browser itself will indicate which fields are required.
//some countries do not have state/province, so for international it is automatically not required.
			countryChange : function(type,country)	{
//				app.u.dump('BEGIN convertSessionToOrder.uities.countryChange. type: '+type+' and country: '+country)
				if(country == 'US')	{
					$('#data-'+type+'_state').attr('required','required');
					}
				else	{
					$('#data-'+type+'_state').removeAttr('required').parent().removeClass('mandatory');
					}
				}, //countryChange

//NOTE TO SELF:
//use if/elseif for payments with special handling (cc, po, etc) and then the else should handle all the other payment types.
//that way if a new payment type is added, it's handled (as long as there's no extra inputs).
			buildPaymentQ : function()	{
//				app.u.dump("BEGIN store_checkout.u.buildPaymentQ");
				var payby = $('input:radio[name="want/payby"]:checked').val()
				app.u.dump(" -> payby: "+payby);
				if(payby.indexOf('WALLET') == 0)	{
					app.ext.store_checkout.calls.cartPaymentQ.init($.extend({'cmd':'insert'},app.ext.store_checkout.u.getWalletByID(payby)));
//					app.u.dump(app.ext.store_checkout.u.getWalletByID (payby));
					}
				else if(payby == 'CREDIT')	{
					app.ext.store_checkout.calls.cartPaymentQ.init({"cmd":"insert","TN":"CREDIT","CC":$('#payment-cc').val(),"CV":$('#payment-cv').val(),"YY":$('#payment-yy').val(),"MM":$('#payment-mm').val()});
					}				
				else if(payby == 'PO')	{
					app.ext.store_checkout.calls.cartPaymentQ.init({"cmd":"insert","TN":"PO","PO":$('#payment-po').val()});
					}				
				else if(payby == 'ECHECK')	{
					app.ext.store_checkout.calls.cartPaymentQ.init({
"cmd":"insert",
"TN":"ECHECK",
"EA":$('#paymentea').val(),
"ER":$('#paymenter').val(),
"EN":$('#paymenten').val(),
"EB":$('#paymenteb').val(),
"ES":$('#paymentes').val(),
"EI":$('#paymentei').val()
						});
					}
				else	{
					app.ext.store_checkout.calls.cartPaymentQ.init({"cmd":"insert","TN":payby });
					}
				},


//pass in either 'bill' or 'ship' to determine if any predefined addresses for that type exist.
//buyerAddressList data should already have been retrieved by the time this is executed.
			buyerHasPredefinedAddresses : function(TYPE)	{
				var r; //What is returned. TFU.  U = unknown (no TYPE)
				if(TYPE)	{
					if(app.data.buyerAddressList && !$.isEmptyObject(app.data.buyerAddressList['@'+TYPE]))	{r = true}
					else	{r = false}
					}
				return r;
				},

//generate the list of existing addresses (for users that are logged in )
//appends addresses to a fieldset based on TYPE (bill or ship)

			addressListOptions : function(TYPE)	{
//				app.u.dump("BEGIN store_checkout.u.addressListOptions ("+TYPE+")");

				var r = "";  //used for what is returned
				if(TYPE && this.buyerHasPredefinedAddresses(TYPE))	{

var $a; //a paticular address, set once within the loop. shorter that app.data... each reference
var selAddress = false; //selected address. if one has already been selected, it's used. otherwise, _is_default is set as value.
var lctype = TYPE.toLowerCase();
//if an address has already been selected, highlight it.  if not, use default.
if(app.data.cartDetail && app.data.cartDetail[lctype] && app.data.cartDetail[lctype].shortcut)	{
	selAddress = app.data.cartDetail[lctype].shortcut;								
	}
else	{
	selAddress = app.ext.store_checkout.u.determinePreferredAddress(TYPE);
	}

var L = app.data.buyerAddressList['@'+lctype].length;
//app.u.dump(" -> # addresses: "+L);
//app.u.dump(" -> selectedAddressID = "+selAddress);

for(var i = 0; i < L; i += 1)	{
	a = app.data.buyerAddressList['@'+lctype][i];
//	app.u.dump(" -> ID = "+a['_id']);
	r += "<address class='pointer ui-state-default ";
//if an address has already been selected, add appropriate class.
	if(selAddress == a['_id'])	{
//		app.u.dump(" -> MATCH!");
		r += ' ui-state-active';
		}
//if no predefined address is selected, add approriate class to account default address
	else if(a['_is_default'] == 1 && selAddress == false)	{
		r += ' ui-state-active ';
//		app.u.dump(" -> no address selected. using default. ");
		}
							
	r += "' data-addressClass='"+TYPE+"' data-addressId='"+a['_id']+"' onClick='app.ext.store_checkout.u.selectPredefinedAddress(this);' id='"+TYPE+"_address_"+a['_id']+"'>";
	r +=a[TYPE+'_firstname']+" "+a[TYPE+'_lastname']+"<br \/>";
	r +=a[TYPE+'_address1']+"<br \/>";
	if(a[TYPE+'_address2'])	{r +=a[TYPE+'_address2']+"<br \/>"}
	r += a[TYPE+'_city'];
//state, zip and country may not be populated. check so 'undef' isn't written to screen.
	if(a[TYPE+'_state']) {r += " "+a[TYPE+'_state']+", "}
	if(a[TYPE+'_zip'])	{r +=a[TYPE+'_zip']}
	if(app.u.isSet(a[TYPE+'_country']))	{r += "<br \/>"+a[TYPE+'_country']}
	r += "<\/address>";
	}
var parentID = (TYPE == 'ship') ? 'chkoutShipAddressFieldset' : 'chkoutBillAddressFieldset';
r += "<address class='pointer' onClick='$(\"#"+TYPE+"AddressUL\").toggle(true); app.ext.store_checkout.u.removeClassFromChildAddresses(\""+parentID+"\");'>Enter new address or edit selected address<\/address>";
					
					}
				else	{
					//no predefined addresses. make sure address input is visible.
					$("#"+TYPE+"AddressUL").toggle(true);
					}
				return r;
				}, //addressListOptions



//will get the items from a cart and return them as links. used for social marketing.
			cartContentsAsLinks : function(datapointer)	{
//				app.u.dump('BEGIN convertSessionToOrder.uities.cartContentsAsLinks.');
//				app.u.dump(' -> datapointer = '+datapointer);
				var r = "";
				var L = app.model.countProperties(app.data.cartDetail['@ITEMS']);
//				app.u.dump(' -> # items in cart: '+L);
				for(var i = 0; i < L; i += 1)	{
//skip coupons.
					if(app.data[datapointer]['@ITEMS'][i].sku[0] != '%')	{
						r += "http://"+app.vars.sdomain+"/product/"+app.data[datapointer]['@ITEMS'][i].sku+"/\n";
						}
					}
//				app.u.dump('links = '+r);
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
				app.u.dump('BEGIN store_checkout.u.checkoutSuccessPaymentFailure');
				app.u.dump(' -> paycode = '+paycode);
				app.u.dump(' -> payby = '+payby);
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
	//				app.u.dump('BEGIN store_checkout.u.showServerErrors. there are '+L+' errors');
					var $errorDiv = responseData['_rtag'].targetID ? $('#'+responseData['_rtag'].targetID) : $('#chkoutSummaryErrors')
					$errorDiv.empty();
					if($errorDiv.length == 0)
						$errorDiv = $("<p \/>").attr("id","chkoutSummaryErrors").prependTo($('#zCheckoutFrm'));
					var o = "<ul>"; //responseData['_msg_1_txt']+
					
					for(var i = 0; i < L; i += 1)	{
						o += "<li>"+responseData['@issues'][i][3]+"<\/li>";
						}
					o += "<\/ul>";
					$errorDiv.append(app.u.formatMessage({"message":o,"uiClass":"error","uiIcon":"alert"})).toggle(true);
					}
				else	{
					app.u.throwMessage(responseData);
					}
				}, //showServerErrors


	

/*
sometimes _is_default is set for an address in the list of bill/ship addresses.
sometimes it isn't. sometimes, apparently, it's set more than once.
this function closely mirrors core logic.
*/
			determinePreferredAddress : function(TYPE)	{
//				app.u.dump("BEGIN store_checkout.u.determinePreferredAddress  ("+TYPE+")");
				var r = false; //what is returned
				if(!TYPE){ r = false}
				else	{
					var L = app.data.buyerAddressList['@'+TYPE].length;
//look to see if a default is set. if so, take the first one.
					for(var i = 0; i < L; i += 1)	{
						if(app.data.buyerAddressList['@'+TYPE][i]['_is_default'] == 1)	{
							r = app.data.buyerAddressList['@'+TYPE][i]['_id'];
							break; //no sense continuing the loop.
							}
						}
//if no default is set, use the first address.
					if(r == false)	{
						r =app.data.buyerAddressList['@'+TYPE][0]['_id']
						}
					}
//				app.u.dump("address id = "+r);
				
				return r;
				},



	
//is run when an existing address is selected.
//removes 'selected' class from all other addresses in fieldset.
//sets 'selected' class on focus address
//executes call which updates form fields.
//x = element object (this)
			selectPredefinedAddress : function(addressObject)	{
//				app.u.dump("BEGIN app.ext.convertSessionToOrder.u.selectPredefinedAddress");
				var $x = $(addressObject);
				var addressClass = $x.attr('data-addressClass'); //ship or bill

				$("#"+addressClass+"AddressUL").toggle(false); //turns off display of new address form
				
				app.ext.convertSessionToOrder.u.removeClassFromChildAddresses($x.parent().attr('id'));
				$x.addClass('selected  ui-state-active ui-corner-all');
//wtf? when attempting to pass {"data."+addressClass+"_id" : $x.attr('data-addressId')} directly into the setSession function, it barfed. creating the object then passing it in works tho. odd.
				var idObj = {};
				idObj[addressClass+"/shortcut"] = $x.attr('data-addressId');  //for whatever reason, using this as the key in the setsession function caused a js error. set data.bill_id/data.ship_id = DEFAULT (or whatever the address id is)
				
//				app.u.dump(" -> addressClass = "+addressClass);
//				app.u.dump(" -> addressID = "+$x.attr('data-addressId'));
//add this to the pdq
				app.calls.cartSet.init(idObj);

//copy the billing address from the ID into the form fields.
				app.ext.store_checkout.u.setAddressFormFromPredefined(addressClass,$x.attr('data-addressId'));
				$('#data-bill_email').val() == app.data.cartDetail['bill/email']; //for passive, need to make sure email is updated too.
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

_gaq.push(['_trackEvent','Checkout','User Event','Pre-defined address selected ('+addressClass+')']);


				}, //selectPredefinedAddress
				
//sets the values of the shipping address to what is set in the billing address fields.
//can't recycle the setAddressFormFromPredefined here because it may not be a predefined address.
			setShipAddressToBillAddress : function()	{
//				app.u.dump('BEGIN store_checkout.u.setShipAddressToBillAddress');
				$('#chkoutBillAddressFieldset > ul').children().children().each(function() {
					if($(this).is(':input')){$('#'+this.id.replace('bill_','ship_')).val(this.value)}
					});
				},


//allows for setting of 'ship' address when 'ship to bill' is clicked and a predefined address is selected.
			setAddressFormFromPredefined : function(addressType,addressId)	{
//				app.u.dump('BEGIN store_checkout.u.setAddressFormFromPredefined');
//				app.u.dump(' -> address type = '+addressType);
//				app.u.dump(' -> address id = '+addressId);
				
				var L = app.data.buyerAddressList['@'+addressType].length
				var a;
				var r = false;
//looks through predefined addresses till it finds a match for the address id. sets a to address object.
				for(var i = 0; i < L; i += 1)	{
					if(app.data.buyerAddressList['@'+addressType][i]['_id'] == addressId){
						a = app.data.buyerAddressList['@'+addressType][i];
						r = true;
						break;
						}
					}
				
//				app.u.dump(' -> a = ');
//				app.u.dump(a);
				$('#data-'+addressType+'_address1').val(a[addressType+'_address1']);
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



//if checkout succeded but payment failed (cash, cc fail, PO, etc) then this function gets executed.
			checkoutSuccessPaymentFailure : function(paycode,payby)	{
				app.u.dump('BEGIN app.ext.store_checkout.u.checkoutSuccessPaymentFailure');
				app.u.dump(' -> paycode = '+paycode);
				app.u.dump(' -> payby = '+payby);
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



//This will tell if there's a paypal tender in the paymentQ. doesn't check validity or anything like that. a quick function to be used when re-rendering panels.
			thisSessionIsPayPal : function()	{
				return (this.modifyPaymentQbyTender('PAYPALEC',null)) ? true : false;
				},
//Will check the payment q for a valid paypal transaction. Used when a buyer leaves checkout and returns during the checkout init process.
//according to B, there will be only 1 paypal tender in the paymentQ.
			aValidPaypalTenderIsPresent : function()	{
				app.u.dump("BEGIN store_checkout.aValidPaypalTenderIsPresent");
				return this.modifyPaymentQbyTender('PAYPALEC',function(PQI){
					return (Math.round(+new Date(PQI.TIMESTAMP)) > +new Date()) ? true : false;
					});
				},
/*
once paypalEC has been approved by paypal, a lot of form fields lock down, but the user may decide to change
payment methods or they may add something new to the cart. If they do, execute this function. It will remove the paypal params from the session/cart and the re-initiate checkout. Be sure to do an immutable dispatch after executing this if value returned is > 0.
note - dispatch isn't IN the function to give more control to developer. (you may want to execute w/ a group of updates)
*/
			nukePayPalEC : function() {
//				app.u.dump("BEGIN store_checkout.u.nukePayPalEC");
				$('#returnFromThirdPartyPayment').hide(); //used to display a 'welcome back' message. should be hidden if paypal is no longer active payment.
				app.ext.convertSessionToOrder.vars['payment-pt'] = null;
				app.ext.convertSessionToOrder.vars['payment-pi'] = null;
				return this.modifyPaymentQbyTender('PAYPALEC',function(PQI){
					app.ext.store_checkout.calls.cartPaymentQ.init({'cmd':'delete','ID':PQI.ID},{'callback':'suppressErrors'}); //This kill process should be silent.
					});
				},

//pass in a tender/TN [CASH, PAYPALEC, CREDIT] and an array of matching id's is returned.
//used for when a paypal EC payment exists and has to be removed.
//if someFunction is set then that function will get executed over each match.
//the value returned gets added to an array, which is returned by this function.
//the entire lineitem in the paymentQ is passed in to someFunction.
			modifyPaymentQbyTender : function(tender,someFunction){
//				app.u.dump("BEGIN store_checkout.u.modifyPaymentQbyTender");
				var inc = 0; //what is returned if someFunction not present or returns nothing. # of items in paymentQ affected.
				var r = new Array(); //what is returned if someFunction returns anything.
				if(tender && app.data.cartDetail && app.data.cartDetail['@PAYMENTQ'])	{
//					app.u.dump(" -> all vars present. tender: "+tender+" and typeof someFunction: "+typeof someFunction);
					var L = app.data.cartDetail['@PAYMENTQ'].length;
//					app.u.dump(" -> paymentQ.length: "+L);
					for(var i = 0; i < L; i += 1)	{
//						app.u.dump(" -> "+i+" TN: "+app.data.cartDetail['@PAYMENTQ'][i].TN);
						if(app.data.cartDetail['@PAYMENTQ'][i].TN == tender)	{
							inc += 1;
							if(typeof someFunction == 'function')	{
								r.push(someFunction(app.data.cartDetail['@PAYMENTQ'][i]))
								}
							}
						}
					}
				else	{
					app.u.dump("WARNING! getPaymentQidByTender failed because tender ["+tender+"] not set or @PAYMENTQ does not exist.");
					}
//				app.u.dump(" -> num tender matches: "+r);
				return (typeof someFunction == 'function') ? r : inc;
				},
			
			
			getWalletByID : function(ID)	{
				var r = false;
				if(app.data.buyerWalletList && app.data.buyerWalletList['@wallets'].length)	{
					var L = app.data.buyerWalletList['@wallets'].length;
					for(var i = 0; i < L; i += 1)	{
						if(ID == app.data.buyerWalletList['@wallets'][i].ID)	{
							r = app.data.buyerWalletList['@wallets'][i];
							break;
							}
						}
					}
				return r;
				},
			
			
//for tax to accurately be computed, several fields may be required.
//this function checks to see if they're populated and, if so, returns true.
//also used in cartPaypalSetExpressCheckout call to determine whether or not address should be requested on paypal side or not.
			taxShouldGetRecalculated : function()	{
//				app.u.dump("BEGIN app.ext.store_checkout.u.taxShouldGetRecalculated");
				var r = true;//what is returned. set to false if errors > 0
				var errors = 0; //used to track number of fields not populated.
				
				if(!$('#data-bill_address1').val())	{
//					app.u.dump(" -> address is blank");
					errors += 1;
					}
				if(!$('#data-bill_city').val()){
//					app.u.dump(" -> city is blank");
					errors += 1;
					}
				if(!$('#data-bill_state').val()){
//					app.u.dump(" -> state is blank");
					errors += 1;
					}
				if(!$('#data-bill_zip').val()){
//					app.u.dump(" -> zip is blank");
					errors += 1;
					}
				if(!$('#data-bill_country').val()){
//					app.u.dump(" -> country is blank");
					errors += 1;
					}
				if(errors > 0)	{
					r = false;
					}
//				app.u.dump(" -> tax should be recalculated = "+r);
//				app.u.dump("END app.ext.store_checkout.u.taxShouldGetRecalculated");
				return r;
				} //taxShouldGetRecalculated

			}, //util






////////////////////////////////////   						renderFormats			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\







		renderFormats : {
//value is set to ISO and sent to API that way. however, cart object returned is in 'pretty'.
//so a check occurs to set selectedCountry to the selected ISO value so it can be 'selected'
			countriesAsOptions : function($tag,data)	{
//				app.u.dump("BEGIN app.ext.convertSessionToOrder.renderFormats.countriesAsOptions");
//				app.u.dump(" -> Country: "+data.value);
				var r = '';
				var L = app.data.appCheckoutDestinations['@destinations'].length;
//				app.u.dump(" -> number of countries = "+L);
				for(var i = 0; i < L; i += 1)	{
					r += "<option value='"+app.data.appCheckoutDestinations['@destinations'][i].ISO+"' ";
					if(data.value == app.data.appCheckoutDestinations['@destinations'][i].Z)
						r += " selected='selected' ";
					r += ">"+app.data.appCheckoutDestinations['@destinations'][i].Z+"</option>";
					}
				
				$tag.html(r);
				},
				
				
			secureLink : function($tag,data)	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.renderFormats.secureLink');
//				app.u.dump(" -> data.windowName = '"+data.windowName+"'");
//if data.windowName is set, the link will open a new tab/window. otherwise, it just changes the page/tab in focus.
				if(app.u.isSet(data.windowName))
					$tag.click(function(){window.open(zGlobals.appSettings.https_app_url+$.trim(data.value)),data.windowName});
				else
					$tag.click(function(){window.location = zGlobals.appSettings.https_app_url+$.trim(data.value)});
				}, //secureLink


			orderStatusLink : function($tag,data)	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.renderFormats.orderStatusLink');
				var orderCartID = app.data['order|'+data.value].cart.cartid;
//				https://ssl.zoovy.com/s=sporks.zoovy.com/customer/order/status?cartid=SESSION&orderid=data.value
				$tag.click(function(){window.location = zGlobals.appSettings.https_app_url+"customer/order/status?cartid="+orderCartID+"&orderid="+data.value,'orderStatus'});
				
				},

//displays the shipping method followed by the cost.
//is used in cart summary total during checkout.
			shipInfoById : function($tag,data)	{
				var o = '';
//				app.u.dump('BEGIN app.renderFormats.shipInfo. (formats shipping for minicart)');
//				app.u.dump(data);
				var L = app.data.cartShippingMethods['@methods'].length;
				for(var i = 0; i < L; i += 1)	{
//					app.u.dump(' -> method '+i+' = '+app.data.cartShippingMethods['@methods'][i].id);
					if(app.data.cartShippingMethods['@methods'][i].id == data.value)	{
						var pretty = app.u.isSet(app.data.cartShippingMethods['@methods'][i]['pretty']) ? app.data.cartShippingMethods['@methods'][i]['pretty'] : app.data.cartShippingMethods['@methods'][i]['name'];  //sometimes pretty isn't set. also, ie didn't like .pretty, but worked fine once ['pretty'] was used.
						o = "<span class='orderShipMethod'>"+pretty+": <\/span>";
//only show amount if not blank.
						if(app.data.cartShippingMethods['@methods'][i].amount)	{
							o += "<span class='orderShipAmount'>"+app.u.formatMoney(app.data.cartShippingMethods['@methods'][i].amount,' $',2,false)+"<\/span>";
							}
						break; //once we hit a match, no need to continue. at this time, only one ship method/price is available.
						}
					}
				$tag.html(o);
				}, //shipInfoById

			shipMethodsAsOptions : function($tag,data)	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.formats.shipMethodsAsOptions');
				var o = '';
				var L = data.value.length;

				var id,isSelectedMethod,safeid,shipName;  // id is actual ship id. safeid is id without any special characters or spaces. isSelectedMethod is set to true if id matches cart shipping id selected.
				for(var i = 0; i < L; i += 1)	{
					isSelectedMethod = false;
					safeid = app.u.makeSafeHTMLId(data.value[i].id);
					id = data.value[i].id;

//whether or not this iteration is for the selected method should only be determined once, but is used on a couple occasions, so save to a var.
					if(id == app.data.cartDetail['want/shipping_id'])	{
						isSelectedMethod = true;
						}

//app.u.dump(' -> id = '+id+' and want/shipping_id = '+app.data.cartDetail['want/shipping_id']);
					
					shipName = app.u.isSet(data.value[i].pretty) ? data.value[i].pretty : data.value[i].name
					
					o += "<option "
					if(isSelectedMethod)
						o+= " selected='selected' ";
					o += " value = '"+id+"' id='ship-selected_id_"+safeid+"' >"+shipName+" - "+app.u.formatMoney(data.value[i].amount,'$','',false)+"<\/option>";
					}
				$tag.html(o);
				},


			walletName2Icon : function($tag,data)	{
				$tag.addClass('paycon_'+data.value.substring(0,4).toLowerCase());
				},

//for displaying order balance in checkout order totals.
//changes value to 0 for negative amounts. Yes, this can happen.			
			orderBalance : function($tag,data)	{
				var o = '';
				var amount = data.value;
//				app.u.dump('BEGIN app.renderFunctions.format.orderBalance()');
//				app.u.dump('amount * 1 ='+amount * 1 );
//if the total is less than 0, just show 0 instead of a negative amount. zero is handled here too, just to avoid a formatMoney call.
//if the first character is a dash, it's a negative amount.  JS didn't like amount *1 (returned NAN)
				
				if(amount * 1 <= 0){
//					app.u.dump(' -> '+amount+' <= zero ');
					o += data.bindData.currencySign ? data.bindData.currencySign : '$';
					o += '0.00';
					}
				else	{
//					app.u.dump(' -> '+amount+' > zero ');
					o += app.u.formatMoney(amount,data.bindData.currencySign,'',data.bindData.hideZero);
					}
				
				$tag.text(o);  //update DOM.
//				app.u.dump('END app.renderFunctions.format.orderBalance()');
				} //orderBalance
			} //renderFormats
		
		} // r
	return r;
	}