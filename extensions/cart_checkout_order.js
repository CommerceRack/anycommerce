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



The intention of this extension is to replace store_checkout and store_cart, since there's a lot of redundant code between them.

************************************************************** */
//SCO = Shared Checkout Object
var cco = function() {
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

//formerly getCheckoutDestinations
		appCheckoutDestinations : {
			init : function(_tag,Q)	{
				this.dispatch(_tag,Q);
				return 1;
				},
			dispatch : function(_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = 'appCheckoutDestinations';
				app.model.addDispatchToQ({"_cmd":"appCheckoutDestinations","_tag": _tag},Q || 'immutable');
				}
			}, //appCheckoutDestinations

		appPaymentMethods : {
			init : function(obj,_tag,Q)	{
				this.dispatch(obj,_tag,Q); //obj could contain country (as countrycode) and order total.
				return 1;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "appPaymentMethods";
				obj._tag = _tag || {};
				obj._tag.datapointer = 'appPaymentMethods';
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			}, //appPaymentMethods

		cartCouponAdd : {
			init : function(coupon,_tag,Q)	{
				this.dispatch(coupon,_tag,Q);
				},
			dispatch : function(coupon,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"cartCouponAdd","coupon":coupon,"_tag" : _tag},Q || 'immutable');	
				}			
			}, //cartCouponAdd

		cartGiftcardAdd : {
			init : function(giftcard,_tag,Q)	{
				this.dispatch(giftcard,_tag,Q);
				},
			dispatch : function(giftcard,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"cartGiftcardAdd","giftcard":giftcard,"_tag" : _tag},Q || 'immutable');	
				}			
			}, //cartGiftcardAdd

//can be used to verify the items in the cart have inventory available.
		cartItemsInventoryVerify : {
			init : function(_tag,Q)	{
				this.dispatch(_tag,Q);
				return 1;
				},
			dispatch : function(_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = "cartItemsInventoryVerify";
				app.model.addDispatchToQ({"_cmd":"cartItemsInventoryVerify","_tag": _tag},Q || 'immutable');
				}
			}, //cartItemsInventoryVerify	

// REMOVE from controller when this extension deploys !!!
		cartItemUpdate : {
			init : function(stid,qty,_tag)	{
//				app.u.dump('BEGIN app.calls.cartItemUpdate.');
				var r = 0;
				if(stid && Number(qty) >= 0)	{
					r = 1;
					this.dispatch(stid,qty,_tag);
					}
				else	{
					app.u.throwGMessage("In calls.cartItemUpdate, either stid ["+stid+"] or qty ["+qty+"] not passed.");
					}
				return r;
				},
			dispatch : function(stid,qty,_tag)	{
//				app.u.dump(' -> adding to PDQ. callback = '+callback)
				app.model.addDispatchToQ({"_cmd":"cartItemUpdate","stid":stid,"quantity":qty,"_tag": _tag},'immutable');
				app.ext.cco.u.nukePayPalEC(); //nuke paypal token anytime the cart is updated.
				}
			 }, //cartItemUpdate

//cmdObj - see http://www.zoovy.com/webdoc/?VERB=DOC&DOCID=51609 for details.
//Q not an option. MUST always be immutable.
		cartPaymentQ : 	{
			init : function(cmdObj,_tag)	{
//make sure id is set for inserts.
				if(cmdObj.cmd == 'insert' && !cmdObj.ID)	{cmdObj.ID = app.model.version+app.u.guidGenerator().substring(0,8)}
				cmdObj['_cmd'] = "cartPaymentQ";
				cmdObj['_tag'] = _tag;
				this.dispatch(cmdObj);
				return 1;
				},
			dispatch : function(cmdObj)	{
				app.model.addDispatchToQ(cmdObj,'immutable');
				}
			}, //cartPaymentQ
			
// REMOVE from controller when this extension deploys !!!
		cartSet : {
			init : function(obj,_tag,Q)	{
				this.dispatch(obj,_tag,Q);
				return 1;
				},
			dispatch : function(obj,_tag,Q)	{
				obj["_cmd"] = "cartSet";
				obj._tag = _tag || {};
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			}, //cartSet


//uses the cart ID, which is passed on the parent/headers.
//always immutable.
		cartOrderCreate : {
			init : function(_tag)	{
				this.dispatch(_tag);
				return 1;
				},
			dispatch : function(_tag)	{
				_tag = _tag || {};
				_tag.datapointer = "cartOrderCreate";
				app.model.addDispatchToQ({'_cmd':'cartOrderCreate','_tag':_tag},'immutable');
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
				obj._cmd = "cartPaypalSetExpressCheckout";
				obj.cancelURL = (app.vars._clientid == '1pc') ? zGlobals.appSettings.https_app_url+"c="+app.vars.cartID+"/cart.cgis?parentID="+parentID : zGlobals.appSettings.https_app_url+"?_session="+app.vars._session+"parentID="+parentID+"&cartID="+app.vars.cartID+"#cart?show=inline";
				obj.returnURL =  (app.vars._clientid == '1pc') ? zGlobals.appSettings.https_app_url+"c="+app.vars.cartID+"/checkout.cgis?parentID="+parentID : zGlobals.appSettings.https_app_url+"?_session="+app.vars._session+"parentID="+parentID+"&cartID="+app.vars.cartID+"#checkout?show=checkout";
				
				obj._tag.datapointer = "cartPaypalSetExpressCheckout";
				
				app.model.addDispatchToQ(obj,Q || 'immutable');
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
				app.model.addDispatchToQ({
					"_cmd":"cartGoogleCheckoutURL",
					"analyticsdata":"", //must be set, even if blank.
					"edit_cart_url" : (app.vars._clientid == '1pc') ? zGlobals.appSettings.https_app_url+"c="+app.vars.cartID+"/cart.cgis" : zGlobals.appSettings.https_app_url+"?cartID="+app.vars.cartID+"#cart?show=cart",
					"continue_shopping_url" : (app.vars._clientid == '1pc') ? zGlobals.appSettings.https_app_url+"c="+app.vars.cartID+"/" : zGlobals.appSettings.https_app_url+"?cartID="+app.vars.cartID,
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
				var tagObj = {'callback':'',"datapointer":"cartAmazonPaymentURL","extension":"store_cart"}
				app.model.addDispatchToQ({
"_cmd":"cartAmazonPaymentURL",
"shipping":1,
"CancelUrl":zGlobals.appSettings.https_app_url+"cart.cgis?cartID="+app.vars.cartID,
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
				var r; //returns false if checkout can't load due to account config conflict.
				return r;
				},
			onError : function()	{
				app.u.dump('BEGIN app.ext.orderCreate.callbacks.init.error');
				//This would be reached if a templates was not defined in the view.
				}
			}, //init

		proceedToGoogleCheckout : {
			onSuccess : function(tagObj)	{
				app.u.dump('BEGIN cco.callbacks.proceedToGoogleCheckout.onSuccess');
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
			}
		}, //callbacks

		

//Pass in an object (typically based on $form.serializeJSON) and 
//this will make sure that specific fields are populated based on tender type.
//rather than returning specific error messages (which may need to change based on where this is used, an array of which fields are missing is returned
//plus, this allows for the attribute/fields to be modified w/ css, whereas returning messages wouldn't allow for that.
		validate : {
			
			CREDIT : function(vars)	{
				if(vars && typeof vars == 'object')	{
					var errors = new Array(); // what is returned. an array of the payment fields that are not correct.
					if(vars['payment/CC'] && app.u.isValidCC(vars['payment/CC']))	{} else	{errors.push("payment/CC");}
					if(vars['payment/MM'] && app.u.isValidMonth(vars['payment/MM']))	{} else {errors.push("payment/MM");}
					if(vars['payment/YY'] && app.u.isValidCCYear(vars['payment/YY']))	{} else {errors.push("payment/YY");}
					if(vars['payment/CV'] && vars['payment/CV'].length > 2){} else {errors.push("payment/CV")}
					return (errors.length) ? errors : false;
					}
				else	{
					app.u.throwGMessage("in cco.u.validate.CREDIT, vars is empty or not an object.");
					return false;
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


////////////////////////////////////   						util [u]			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {

//NOTE TO SELF:
//use if/elseif for payments with special handling (cc, po, etc) and then the else should handle all the other payment types.
//that way if a new payment type is added, it's handled (as long as there's no extra inputs).
			buildPaymentQ : function($form)	{
				app.u.dump("BEGIN cco.u.buildPaymentQ");
				var sfo = $form.serializeJSON() || {},
				payby = sfo["want/payby"];
				app.u.dump(" -> payby: "+payby);
				if(payby)	{
					if(payby.indexOf('WALLET') == 0)	{
						app.ext.cco.calls.cartPaymentQ.init($.extend({'cmd':'insert'},app.ext.cco.u.getWalletByID(payby)));
						}
					else if(payby == 'CREDIT')	{
						app.ext.cco.calls.cartPaymentQ.init({"cmd":"insert","TN":"CREDIT","CC":sfo['payment/CC'],"CV":sfo['payment/CV'],"YY":sfo['payment/YY'],"MM":sfo['payment/MM']});
						}				
					else if(payby == 'PO')	{
						app.ext.cco.calls.cartPaymentQ.init({"cmd":"insert","TN":"PO","PO":sfo['payment/PO']});
						}				
					else if(payby == 'ECHECK')	{
						app.ext.cco.calls.cartPaymentQ.init({
	"cmd":"insert",
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
						app.ext.cco.calls.cartPaymentQ.init({"cmd":"insert","TN":payby });
						}
					}
					else	{
						$('#globalMessaging').anymessage({'message':'In cco.u.buildPaymentQ, unable to determine payby value','gMessage':true});
						}
				},


			paymentMethodsIncludesGiftcard : function(datapointer)	{
				var r = false;
				if(app.data[datapointer] && app.data[datapointer]['@methods'] && app.data[datapointer]['@methods'].length)	{
					var payMethods = app.data[datapointer]['@methods'],
					L = app.data[datapointer]['@methods'].length;

					for(var i = 0; i < L; i += 1)	{
						if(payMethods[i].id.indexOf('GIFTCARD:') === 0)	{
							r = true;
							break;
							}
						}
					}
				else	{
					//app.data.datapointer is empty
					}
				return r;
				},


//A simple check to make sure that all the required inputs are populated for a given address.  
//returns boolean
//this is used in checkout for pre-existing addresses, to make sure they're complete.
			verifyAddressIsComplete : function(addressType,addressID)	{
				var r = true;
				if(addressType && addressID)	{
					var addrObj = app.ext.cco.u.getAddrObjByID(addressType,addressID);
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
					$('#globalMessaging').anymessage({'message':'In cco.u.verifyAddressIsComplete, either addressType ['+addressType+'] or addressID ['+addressID+'] not set','gMessage':true});
					}
				return r;
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

//will get the items from a cart and return them as links. used for social marketing.
			cartContentsAsLinks : function(datapointer)	{
//				app.u.dump('BEGIN cco.u.cartContentsAsLinks.');
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

//This will tell if there's a paypal tender in the paymentQ. doesn't check validity or anything like that. a quick function to be used when re-rendering panels.
			thisSessionIsPayPal : function()	{
				return (this.modifyPaymentQbyTender('PAYPALEC',null)) ? true : false;
				},

//Will check the payment q for a valid paypal transaction. Used when a buyer leaves checkout and returns during the checkout init process.
//according to B, there will be only 1 paypal tender in the paymentQ.
			aValidPaypalTenderIsPresent : function()	{
//				app.u.dump("BEGIN cco.aValidPaypalTenderIsPresent");
				return this.modifyPaymentQbyTender('PAYPALEC',function(PQI){
					return (Math.round(+new Date(PQI.TIMESTAMP)) > +new Date()) ? true : false;
					});
				},
/*
once paypalEC has been approved by paypal, a lot of form fields lock down, but the user may decide to change
payment methods or they may add something new to the cart. If they do, execute this function. It will remove the paypal params from the session/cart and the re-initiate checkout. Be sure to do an immutable dispatch after executing this if value returned is > 0.
note - dispatch isn't IN the function to give more control to developer. (you may want to execute w/ a group of updates)
*/
			nukePayPalEC : function(_tag) {
//				app.u.dump("BEGIN cco.u.nukePayPalEC");
				app.ext.orderCreate.vars['payment-pt'] = null;
				app.ext.orderCreate.vars['payment-pi'] = null;
				app.calls.cartSet.init({'want/payby':""}); //adds dispatches.
				return this.modifyPaymentQbyTender('PAYPALEC',function(PQI){
					app.ext.cco.calls.cartPaymentQ.init({'cmd':'delete','ID':PQI.ID},_tag || {'callback':'suppressErrors'}); //This kill process should be silent.
					});
				},

//pass in a tender/TN [CASH, PAYPALEC, CREDIT] and an array of matching id's is returned.
//used for when a paypal EC payment exists and has to be removed.
//if someFunction is set then that function will get executed over each match.
//the value returned gets added to an array, which is returned by this function.
//the entire lineitem in the paymentQ is passed in to someFunction.
			modifyPaymentQbyTender : function(tender,someFunction){
//				app.u.dump("BEGIN cco.u.modifyPaymentQbyTender");
				var inc = 0, //what is returned if someFunction not present. # of items in paymentQ affected.
				r = new Array(), //what is returned if someFunction returns anything.
				returned; //what is returned by this function.
				
				if(tender && app.data.cartDetail && app.data.cartDetail['@PAYMENTQ'])	{
					if(app.data.cartDetail['@PAYMENTQ'].length)	{
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
						returned = (typeof someFunction == 'function') ? r : inc;
						}
					else	{
						returned = inc;
						} //paymentQ is empty. no error or warning.
					}
				else	{
					app.u.dump("WARNING! getPaymentQidByTender failed because tender ["+tender+"] not set or @PAYMENTQ does not exist.");
					}
//				app.u.dump(" -> num tender matches: "+r);
				return returned;
				},
			
			getAddrObjByID : function(type,id)	{
				var r = false; //what is returned.
				if(type && id)	{
					if(app.data.buyerAddressList && app.data.buyerAddressList['@'+type] && app.data.buyerAddressList['@'+type].length)	{
						var L = app.data.buyerAddressList['@'+type].length;
						for(var i = 0; i < L; i += 1)	{
							if(app.data.buyerAddressList['@'+type][i]._id == id)	{
								r = app.data.buyerAddressList['@'+type][i];
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

//paymentID is the payment that is selected.
//data is a data object, such as cartDetail or an invoice.
//isAdmin is used to determine if additional output is included (flag as paid checkbox and some other inputs)
// SANITY -> checkout uses the required attribute for validation. do not remove!
// when switching between payment types and supplemental inputs, always REMOVE the old supplemental inputs. keeps it clean & checkout doesn't like extra vars.
			getSupplementalPaymentInputs : function(paymentID,data,isAdmin)	{
//				app.u.dump("BEGIN control.u.getSupplementalPaymentInputs ["+paymentID+"]");
//				app.u.dump(" -> data:"); app.u.dump(data);
				
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

						tmp += "<div><label>Credit Card #<input type='text' size='30' name='payment/CC' class=' creditCard' value='";
						if(data['payment/CC']){tmp += data['payment/CC']}
						tmp += "' onKeyPress='' required='required' /><\/label><\/div>";
						
						tmp += "<div><label>Expiration<\/label><select name='payment/MM' class='creditCardMonthExp' required='required'><option><\/option>";
						tmp += app.u.getCCExpMonths(data['payment/MM']);
						tmp += "<\/select>";
						tmp += "<select name='payment/YY' class='creditCardYearExp'  required='required'><option value=''><\/option>"+app.u.getCCExpYears(data['payment/YY'])+"<\/select><\/div>";
						
						tmp += "<div><label for='payment/CV'>CVV/CID<input type='text' size='4' name='payment/CV' class=' creditCardCVV' onKeyPress='return app.u.numbersOnly(event);' value='";
						if(data['payment/CV']){tmp += data['payment/CV']}
						tmp += "'  required='required' /><\/label> <span class='ui-icon ui-icon-help creditCardCVVIcon' onClick=\"$('#cvvcidHelp').dialog({'modal':true,height:400,width:550});\"></span><\/div>";
						
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
					$('input, select',$o).each(function(){
						$(this).off('change.save').on('change.save',function(){
							data[$(this).attr('name')] = $(this).val();
							});
						});
					} //put the li contents into the ul for return.
				return $o;
//				app.u.dump(" -> $o:");
//				app.u.dump($o);
			},



/*
executing when quantities are adjusted for a given cart item.
call is made to update quantities.
When a cart item is updated, it'll end up getting re-rendered, so data-request-state doesn't need to be updated after the request.
Since theres no 'submit' or 'go' button on the form, there was an issue where the 'enter' keypress would double-execute the onChange event.
so now, the input is disabled the first time this function is executed and a disabled class is added to the element. The presence of this class
allows us to check and make sure no request is currently in progress.
*/
			updateCartQty : function($input,_tag)	{
				
				var stid = $input.attr('data-stid');
				var qty = $input.val();
				
				if(stid && qty && !$input.hasClass('disabled'))	{
					$input.attr('disabled','disabled').addClass('disabled').addClass('loadingBG');
					app.u.dump('got stid: '+stid);
//some defaulting. a bare minimum callback needs to occur. if there's a business case for doing absolutely nothing
//then create a callback that does nothing. IMHO, you should always let the user know the item was modified.
//you can do something more elaborate as well, just by passing a different callback.
					_tag = _tag || {};
					_tag.callback = _tag.callback ? _tag.callback : 'updateCartLineItem';
					_tag.extension = _tag.extension ? _tag.extension : 'store_cart';
					_tag.parentID = 'cartViewer_'+app.u.makeSafeHTMLId(stid);
/*
the request for quantity change needs to go first so that the request for the cart reflects the changes.
the dom update for the lineitem needs to happen last so that the cart changes are reflected, so a ping is used.
*/
					app.ext.store_cart.calls.cartItemUpdate.init(stid,qty);
					this.updateCartSummary();
//lineitem template only gets updated if qty > 1 (less than 1 would be a 'remove').
					if(qty >= 1)	{
						app.calls.ping.init(_tag,'immutable');
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
//run this just prior to creating an order.
//will clean up cart object.
			sanitizeAndUpdateCart : function($form,_tag)	{
				if($form)	{
					_tag = _tag || {};
					var formObj = $form.serializeJSON();
//po number is used for purchase order payment method, but also allowed for a reference number (if company set and po not payment method).
					if(app.ext.orderCreate.vars['want/payby'] != "PO" && formObj['want/reference_number'])	{
						formObj['want/po_number'] = formObj['want/reference_number'];
						}
// to save from bill to bill, pass bill,bill. to save from bill to ship, pass bill,ship
					var populateAddressFromShortcut = function(fromAddr,toAddr)	{
						var addr = app.ext.cco.u.getAddrObjByID(fromAddr,formObj[fromAddr+'/shortcut']);
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
//regularize checkbox data.
					if(formObj['want/bill_to_ship'] == 'ON')	{formObj['want/bill_to_ship'] = 1} 
					if(formObj['want/create_customer'] == 'ON')	{formObj['want/create_customer'] = 1}

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
				} //sanitizeAndUpdateCart



			}, //util






////////////////////////////////////   						renderFormats			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\







		renderFormats : {
//value is set to ISO and sent to API that way. however, cart object returned is in 'pretty'.
//so a check occurs to set selectedCountry to the selected ISO value so it can be 'selected'
			countriesAsOptions : function($tag,data)	{
//				app.u.dump("BEGIN app.ext.cco.renderFormats.countriesAsOptions");
//				app.u.dump(" -> Country: "+data.value);
				var r = '';
				var L = app.data.appCheckoutDestinations['@destinations'].length;
//				app.u.dump(" -> number of countries = "+L);
				for(var i = 0; i < L; i += 1)	{
					r += "<option value='"+app.data.appCheckoutDestinations['@destinations'][i].ISO+"' ";
					if(data.value == app.data.appCheckoutDestinations['@destinations'][i].ISO)	{
						r += " selected='selected' ";
						}
					r += ">"+app.data.appCheckoutDestinations['@destinations'][i].Z+"</option>";
					}
				
				$tag.html(r);
				},



//data.value should be the item object from the cart.
			cartItemRemoveButton : function($tag,data)	{

				if(data.value.stid[0] == '%')	{$tag.remove()} //no remove button for coupons.
				else if(data.value.asm_master)	{$tag.remove()} //no remove button for assembly 'children'
				else	{
if($tag.is('button')){$tag.button({icons: {primary: "ui-icon-closethick"},text: false})}
$tag.attr({'data-stid':data.value.stid}).val(0); //val is used for the updateCartQty

//the click event handles all the requests needed, including updating the totals panel and removing the stid from the dom.
$tag.one('click',function(event){
	event.preventDefault();
	app.ext.store_cart.u.updateCartQty($tag);
	app.model.dispatchThis('immutable');
	});
					}
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
				}, //orderBalance

			secureLink : function($tag,data)	{
//				app.u.dump('BEGIN app.ext.cco.renderFormats.secureLink');
//				app.u.dump(" -> data.windowName = '"+data.windowName+"'");
//if data.windowName is set, the link will open a new tab/window. otherwise, it just changes the page/tab in focus.
				if(app.u.isSet(data.windowName))
					$tag.click(function(){window.open(zGlobals.appSettings.https_app_url+$.trim(data.value)),data.windowName});
				else
					$tag.click(function(){window.location = zGlobals.appSettings.https_app_url+$.trim(data.value)});
				}, //secureLink

//displays the shipping method followed by the cost.
//is used in cart summary total during checkout.
			shipInfoById : function($tag,data)	{
				var o = '';
//				app.u.dump('BEGIN app.renderFormats.shipInfo. (formats shipping for minicart)');
//				app.u.dump(data);
				var shipMethods = app.data.cartDetail['@SHIPMETHODS'],
				L = shipMethods.length;
				for(var i = 0; i < L; i += 1)	{
//					app.u.dump(' -> method '+i+' = '+app.data.cartShippingMethods['@methods'][i].id);
					if(shipMethods[i].id == data.value)	{
						var pretty = app.u.isSet(shipMethods[i]['pretty']) ? shipMethods[i]['pretty'] : shipMethods[i]['name'];  //sometimes pretty isn't set. also, ie didn't like .pretty, but worked fine once ['pretty'] was used.
						o = "<span class='orderShipMethod'>"+pretty+": <\/span>";
//only show amount if not blank.
						if(shipMethods[i].amount)	{
							o += "<span class='orderShipAmount'>"+app.u.formatMoney(shipMethods[i].amount,' $',2,false)+"<\/span>";
							}
						break; //once we hit a match, no need to continue. at this time, only one ship method/price is available.
						}
					}
				$tag.html(o);
				}, //shipInfoById

			shipMethodsAsOptions : function($tag,data)	{
//				app.u.dump('BEGIN app.ext.cco.formats.shipMethodsAsOptions');
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
					o += " value = '"+id+"' >"+shipName+" - "+app.u.formatMoney(data.value[i].amount,'$','',false)+"<\/option>";
					}
				$tag.html(o);
				},

			walletName2Icon : function($tag,data)	{
				$tag.addClass('paycon_'+data.value.substring(0,4).toLowerCase());
				}

			} //renderFormats
		
		} // r
	return r;
	}