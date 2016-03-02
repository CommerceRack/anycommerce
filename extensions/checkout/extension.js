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

var order_create = function(_app) {
	var theseTemplates = new Array(
	'checkoutTemplate', //container for whole checkout page.
	'chkoutPreflightTemplate',
	'chkoutCartContentsTemplate', //cart contents
	'chkoutCartItemTemplate', //cart contents list item template
	'chkoutCartSummaryTemplate', //panel for order summary (subtotal, shipping, etc)
	'chkoutAddressBillTemplate', //billing address
	'chkoutAddressShipTemplate', //duh
	'chkoutMethodsShipTemplate',
	'chkoutNotesTemplate',
	'chkoutBuyerAddressTemplate',
	'chkoutBuyerWalletListItem', //used for each wallet in the stored payments section.
	'chkoutMethodsPayTemplate', //payment option panel
	'chkoutCompletedTemplate', //used after checkout to display order information.
	'chkoutInvoiceItemTemplate'
	);
	var r = {
	vars : {
		willFetchMyOwnTemplates : true, //1pc loads it's templates locally to avoid XSS issue.
//though most extensions don't have the templates specified, checkout does because so much of the code is specific to these templates.
		templates : theseTemplates
		},

					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\




	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
		init : {
			onSuccess : function()	{
//				_app.u.dump('BEGIN _app.ext.order_create.init.onSuccess');

				_app.u.loadCSSFile(_app.vars.baseURL+"extensions/checkout/styles.css","checkoutCSS");
				if(_app.vars._clientid == '1pc')	{
					_app.u.loadCSSFile(_app.vars.baseURL+"extensions/checkout/opc_styles.css","opcCheckoutCSS"); //loaded after checkoutCSS so that overrides can be set, if need be.
					}
				//_app.model.fetchNLoadTemplates(_app.vars.baseURL+'extensions/checkout/'+_app.vars.checkoutAuthMode+'.html');

				var r = true; //returns false if checkout can't load due to account config conflict.

//messaging for the test harness 'success'.
				if(_app.u.getParameterByName('_testharness'))	{
					$('#globalMessaging').anymessage({'message':'<strong>Excellent!<\/strong> Your store meets the requirements to use this one page checkout extension.','uiIcon':'circle-check','uiClass':'success'});
					$('#'+_app.ext.order_create.vars.containerID).append("");
					r = true;
					}
				else if(!_app.vars.checkoutAuthMode)	{
					r = false;
					$('#globalMessaging').anymessage({'message':'<strong>Uh Oh!<\/strong> _app.vars.checkoutAuthMode is not set. should be set to passive, required or active (depending on the checkout behavior desired).'});
					}
				else if(_app.vars.thisSessionIsAdmin)	{
					r = true;
					//don't execute a localStorage.clear() on an admin session cuz it'll nuke the session ID and the carts.
					}
				else	{
					r = true;
					if(document.domain.indexOf('app-hosted.com') >= 0)	{
						if(jQuery.support.localStorage)	{
							window.localStorage.clear();
							}
						} //clear localStorage for shared domain to avoid cross-store contamination.
					}

				if(r == false)	{
//execute error handling for the extension.
//errors are reported to the screen, but 'other' actions may need to be taken.
					this.onError();
					}
				return r;
//				_app.u.dump('END _app.ext.order_create.init.onSuccess');
				},
			onError : function()	{
				_app.u.dump('BEGIN _app.ext.order_create.callbacks.init.error');
				}
			}, //init

		updateAllPanels : {
			onSuccess : function(tagObj)	{
				//used for one page checkout only.
//				_app.u.dump("BEGIN adminCustomerDetail callback for 1PC");
				if(tagObj.jqObj instanceof jQuery)	{
					tagObj.jqObj.hideLoading();
					_app.ext.order_create.u.handlePanel(tagObj.jqObj,'chkoutPreflight',['empty','translate','handleDisplayLogic']);
					_app.ext.order_create.u.handlePanel(tagObj.jqObj,'chkoutAddressBill',['empty','translate','handleDisplayLogic']);
					_app.ext.order_create.u.handlePanel(tagObj.jqObj,'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
					_app.ext.order_create.u.handlePanel(tagObj.jqObj,'chkoutMethodsShip',['empty','translate','handleDisplayLogic']);
					_app.ext.order_create.u.handlePanel(tagObj.jqObj,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
					_app.ext.order_create.u.handlePanel(tagObj.jqObj,'chkoutCartItemsList',['empty','translate','handleDisplayLogic']);
					_app.ext.order_create.u.handlePanel(tagObj.jqObj,'chkoutCartSummary',['empty','translate','handleDisplayLogic']);
					}
				else	{
					$("#globalMessaging").anymessage({"message":"In order_create.callbacks.updateAllPanels.onSuccess, tagObj.jqObj was NOT an instanceof jQuery. See Console for some details.","gMessage":true});
					dump(" -> tagObj.jqObj (which SHOULD be a jquery instance but isn't"); dump(tagObj.jqObj);
					}
				}
			},



//Rather than a call to see if transaction is authorized, then another call to add to q, we go straight into adding to the paymentQ
//if the transaction failed, then we remove the transaction from the payment q.
//this gives us a 1 call model for success and 2 calls for failure (instead of 2 and 2).
		handlePayPalIntoPaymentQ : {
			onSuccess : function(tagObj)	{
				_app.u.dump('BEGIN order_create[nice].callbacks.handlePayPalIntoPaymentQ.onSuccess');
				//this is the callback AFTER the payment is added to the Q, so no success is needed, only specific error handling.
				},
			onError : function(responseData,uuid)	{
				$('body').showLoading({'message':'Updating order...'});
				responseData['_msg_1_txt'] = "It appears something went wrong with the PayPal payment:<br \/>err: "+responseData['_msg_1_txt'];
				$('#globalMessaging').anymessage({'message':responseData,'persistent':true});
//nuke vars so user MUST go thru paypal again or choose another method.
//nuke local copy right away too so that any cart logic executed prior to dispatch completing is up to date.
				_app.ext.cco.u.nukePayPalEC({'callback':function(rd){
//suppress errors but unlock all the panels.
$('body').hideLoading();
var $context = responseData._rtag.jqObj;

_app.ext.order_create.u.handlePanel($context,'chkoutAddressBill',['empty','translate','handleDisplayLogic']);
_app.ext.order_create.u.handlePanel($context,'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
_app.ext.order_create.u.handlePanel($context,'chkoutMethodsShip',['empty','translate','handleDisplayLogic']);
_app.ext.order_create.u.handlePanel($context,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
					}});
				var cartid = $context.closest("[data-app-role='checkout']").data('cartid');
				_app.model.destroy('cartDetail|'+cartid);
				_app.calls.cartDetail.init(cartid,{},'immutable');
				_app.ext.cco.calls.appPaymentMethods.init({_cartid:cartid},{},'immutable');
				_app.model.dispatchThis('immutable');
				}
			},		 //handlePayPalIntoPaymentQ


//executing this will not only return which items have had an inventory update (in a pretty format) but also create the dispatches
// to update the cart and then to actually update it as well.
// the individual cart update posts (there may be multiple) go without the callback. If callback is added, a ping to execute it is run.
		handleInventoryUpdate : {

			onSuccess : function(_rtag)	{
				var r = false; //if false is returned, then no inventory update occured.
				if(_app.data[_rtag.datapointer] && !$.isEmptyObject(_app.data[_rtag.datapointer]['%changes']))	{
					var $form = _rtag.jqObj.find('form:first'), cartid = $form.closest("[data-app-role='checkout']").data('cartid');
					r = "<p>It appears that some inventory adjustments needed to be made:<ul>";
					for(var key in _app.data[_rtag.datapointer]['%changes']) {
						r += "<li>sku: "+key+" was set to "+_app.data[_rtag.datapointer]['%changes'][key]+" due to availability<\/li>";
						_app.ext.cco.calls.cartItemUpdate.init({'_cartid':cartid,'stid':key,'quantity':_app.data[_rtag.datapointer]['%changes'][key]}); //## TODO -> this probably needs a cartid.
						}
					_app.u.dump(" -> SANITY: an extra cartDetail call is occuring because inventory availability required some cartUpdates to occur.");
					_app.model.destroy('cartDetail|'+cartid);
					_app.calls.cartDetail.init(cartid,{'callback':function(rd){
						if(_app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							_app.u.dump(" -> inventory adjustment has occurred. update panels to reflect change.");
							_app.ext.order_create.u.handlePanel($form,'chkoutCartItemsList',['empty','translate','handleDisplayLogic']);
							_app.ext.order_create.u.handlePanel($form,'chkoutCartSummary',['empty','translate','handleDisplayLogic']);
							_app.ext.order_create.u.handlePanel($form,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
							_app.ext.order_create.u.handlePanel($form,'chkoutMethodsShip',['empty','translate','handleDisplayLogic']);
							}
						}},'immutable');
					_app.model.dispatchThis('immutable');
					r += "<\/ul><\/p>";
					$('#globalMessaging').anymessage({'message':r,'persistent':true});
					}
				return r;
				}
			},	//handleInventoryUpdate


//callback executed on the cartOrderCreate AND subsequent cartOrderStatus calls.

		cartOrderStatus : {
			onSuccess : function(_rtag)	{
				dump("BEGIN order_create.callbacks.cartOrderStatus.onSuccess");
				if(_app.data[_rtag.datapointer].finished)	{
					_app.ext.order_create.a.checkoutComplete(_rtag);
					}
				else	{
					_rtag.attempt = _rtag.attempt || 1;
					
					//when the cartOrderCreate response comes back, update the loading text to show the order id.
					if(_rtag.datapointer.indexOf('cartOrderCreate') >= 0)	{
						$('#checkoutContainer').showLoading({'message':'Your order is being created.  For security reasons, the page will reload when it has finished.'});
						}
					
					/*
					Handled in the callback for checkout, after the order has been processed
					if(_rtag.attempt === 1)	{
						if(_app.data[_rtag.datapointer]['previous-cartid'])	{
							dump(" -> removing the cartID from the session.");
							//first attempt. To get here, the 'cart' has been received by the API and is in memory and being processed. Pull the cart out of memory.
							_app.model.removeCartFromSession(_app.data[_rtag.datapointer]['previous-cartid']);
							}
						} 
					*/
//Continue polling till order is finished.
					setTimeout(function(){
						var cartid = _app.data[_rtag.datapointer]['status-cartid']
						_app.model.addDispatchToQ({"_cmd":"cartOrderStatus","_cartid":cartid,"_tag":{"datapointer":"cartOrderStatus|"+cartid,"parentID":_rtag.parentID,"attempt" :(_rtag.attempt+1), "callback":"cartOrderStatus","extension":"order_create", "refresh" : true}},"mutable");
						dump(" -------------> timeout triggered. dispatch cartOrderStatus. attempt: "+_rtag.attempt);
						_app.model.dispatchThis("mutable");
						},2000);
					}
				},
			onError : function(rd)	{
				dump("BEGIN order_create.callbacks.cartOrderStatus.onError");
				//could get here from cartOrderStatus inquiry OR cartOrderCreate response.
				//if a cart id is set, keep polling. could mean that one orderStatus call failed for some reason.
				//but no order id likely means the cartOrderCreate call failed. show the errors.
//				dump(" -> rd: "); dump(rd);
				
				function handleError()	{
					$(document.body).hideLoading();
					$("#globalMessaging").anymessage({"message":rd,"gMessage":true,"persistent":true}); //error messaging is persistent so that buyer has adequate time to read/copy it.
					}
				
				if(rd._rtag && rd._rtag.datapointer)	{
					if(_app.data[rd._rtag.datapointer] && _app.data[rd._rtag.datapointer].finished)	{
						_app.ext.order_create.a.checkoutComplete(_rtag);
						}
					else if(_app.data[rd._rtag.datapointer] && _app.data[rd._rtag.datapointer]['status-cartid'])	{
						rd._rtag.attempt = rd._rtag.attempt || 0; //start at zero for an error. so '1' is hit next time.
						setTimeout(function(){
							_app.model.addDispatchToQ({"_cmd":"cartOrderStatus","_cartid":_app.data[rd._rtag.datapointer]['status-cartid'],"_tag":{"datapointer":"cartOrderStatus","parentID":rd._rtag.parentID,"attempt" : rd._rtag.attempt++, "callback":"cartOrderStatus","extension":"order_create", "refresh":true}},"mutable");
							_app.model.dispatchThis("mutable");
							},2000);
						}
					else if(rd._rtag.datapointer.indexOf('cartOrderCreate') >= 0)	{
						//if the error came back as part of cartOrderCreate, then we should show checkout again so the user has the chance to resubmit.
						if(rd._rtag.parentID)	{
							handleError();
							$(_app.u.jqSelector('#',rd._rtag.parentID)).show();
							}
						else	{
							handleError();
							}
						}
					else	{
						handleError()
						}
					}
				else	{
					//if rd._rtag is not set, the error is pretty big, probably an ISE or ISEERR
					handleError()
					}
				}
			}

		}, //callbacks





////////////////////////////////////   						validation				    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\




	validate : {

//runs individual panel/fieldset validation and returns whether or not all checkout fields are populated/valid.
//the individual fieldset validator returns a 1/0 depending on whether it passes/fails the validation.
//order notes is NOT validated
//there are six validated fields, so summing up the values will = 6 if all panels pass.
			checkout : function($form)	{
				var r = false; //what is returned. Either true or false.
				if($form)	{

					var
						formObj = $form.serializeJSON(), //done here and passed into validation funcitons so serialization only occurs once. (more efficient)
						$fieldsets = $('fieldset[data-app-role]',$form), //The number of fieldsets. must match value of sum to be valid.
						sum = 0,
						errors = "";

//nuke any exising anymessage errors within the form. otherwise, a report of "you didn't select..." would stay present and be confusing.
					$(".ui-widget-anymessage",$form).each(function(){
						$(this).empty().remove();
						});	

					$fieldsets.each(function(){
						
						var $fieldset = $(this),
						role = $(this).data('app-role');
						
						if(role && typeof _app.ext.order_create.validate[role] === 'function')	{
							sum += _app.ext.order_create.validate[role]($fieldset,formObj);
							}
						else	{
							errors += "<div>validate role ["+role+"] is not a function<\/div>";
							}
						});
					
					//errors would only be set if something went wrong in validation, not for missing fields which are handled within the individual panel validation.
					if(errors != '')	{
						r = false;
						$('#globalMessaging').anymessage({'message':'In order_create.validate.checkout, the following errors occured:<br>'+errors,'gMessage':true});
						}
					else if(sum == $fieldsets.length)	{
						r = true;
						}
					else	{
						r = false;
						}
					
					}
				else	{
					r = false;
					$('#globalMessaging').anymessage({'message':'In order_create.validate.checkout, $form was not passed.','gMessage':true});
					}
				_app.u.dump("validate.checkout: "+r);
				return r;
				}, //isValid
//validation function should be named the same as the data-app-role of the fieldset. 

			chkoutPreflight : function($fieldset,formObj)	{
				var valid = 0; //used to return validation state. 0 = false, 1 = true. integers used to sum up panel validation.
				
				if($fieldset && formObj)	{
					if(_app.u.validateForm($fieldset))	{valid = 1;} //the validateForm field takes care of highlighting necessary fields and hints.
					else {valid = 0}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In order_create.validate.chkoutPreflight, $form or formObj not passed.','gMessage':true});
					}
				if(!valid)	{
					_app.u.dump(" -> order_create.validate.chkoutPreflight: "+valid);
					}
				return valid;
				}, //chkoutPreflightFieldset

			chkoutAccountCreate : function($fieldset,formObj)	{
				var valid = 0; //used to return validation state. 0 = false, 1 = true. integers used to sum up panel validation.
				
				if($fieldset && formObj)	{
					if(!formObj['want/create_customer'])	{valid = 1}
					else if(_app.u.validateForm($fieldset))	{
						if(formObj['want/new_password'] == formObj['want/new_password2'])	{valid = 1;}
						else	{
							valid = 0;
							$fieldset.anymessage({'persistent':true,'message':'Password and verify password must match'});
							}
						} //the validateForm field takes care of highlighting necessary fields and hints.
					else	{valid = 0;} //didn't pass the basic validation.
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In order_create.validate.chkoutAccountCreate, $form or formObj not passed.','gMessage':true});
					}
				if(!valid)	{
					_app.u.dump(" -> order_create.validate.chkoutAccountCreate: "+valid);
					}
				return valid;
				}, //validate.chkoutAccountInfoFieldset
				
//make sure a shipping method is selected
			chkoutMethodsShip : function($fieldset,formObj)	{
				var valid = 0;
				if($fieldset && formObj)	{
					if(_app.ext.cco.u.thisSessionIsPayPal())	{valid = 1} //ship address comes back from paypal. panel is hidden. auto-approve.
					else if($("[name='want/shipping_id']:checked").length)	{
						if(_app.u.validateForm($fieldset)){valid = 1;}
						else	{valid = 0;}
						}
					else	{
						valid = 0;
						$fieldset.anymessage({'message':'Please select a shipping method','persistent':true})
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In order_create.validate.chkoutMethodsShip, $form or formObj not passed.','gMessage':true});
					}
				if(!valid)	{
					_app.u.dump(" -> order_create.validate.chkoutMethodsShip: "+valid);
					}
				return valid;
				}, //validate.chkoutShipMethodsFieldset

//in addition to selecting a pay option, certain extra fields may be present and must be checked for.
			chkoutMethodsPay : function($fieldset,formObj)	{
				var valid = 0;
				var cartID = $fieldset.closest("[data-app-role='checkout']").data('cartid');
				if($fieldset && formObj)	{
					if(_app.ext.cco.u.thisSessionIsPayPal() && _app.ext.cco.u.aValidPaypalTenderIsPresent())	{valid = 1;} //if paypal
//should only get match here for expired paypal payments or some unexpected paypal related issue.
					else if(_app.ext.cco.u.thisSessionIsPayPal()){
						$fieldset.anymessage({'message':"It appears something has gone wrong with your paypal authorization. Perhaps it expired. Please click the 'choose alternate payment method' link and either re-authorize through paypal or choose an alternate payment method. We apologize for the inconvenience. "})
						}
					//if the balance is zero, no payment method is necessary.
					else if(_app.u.thisNestedExists("data.cartDetail|"+cartID+".sum.balance_due_total",_app) && Number(_app.data["cartDetail|"+cartID].sum.balance_due_total) <= 0)	{
						valid = 1;
						}
					else if($('[name="want/payby"]:checked',$fieldset).length)	{
						if(_app.u.validateForm($fieldset))	{valid = 1;}
						else	{valid = 0}
						}
					else	{
						valid = 0;
						$fieldset.anymessage({'message':'Please select a payment method','persistent':true})
						}
					}
				else	{
					valid = 0;
					$('#globalMessaging').anymessage({'message':'In order_create.validate.chkoutMethodsPay, $form or formObj not passed.','gMessage':true});
					}
				if(!valid)	{
					_app.u.dump(" -> order_create.validate.chkoutMethodsPay: "+valid);
					}
				return valid;
				}, //chkoutPayOptionsFieldset

			chkoutAddressBill: function($fieldset,formObj)	{
				var valid = 0,  cartID = $fieldset.closest("[data-app-role='checkout']").data('cartid'), CID;
				
				if(_app.u.thisNestedExists("data.cartDetail|"+cartID+".customer.cid",_app) && _app.data['cartDetail|'+cartID].customer.cid > 0)	{
					CID = _app.data['cartDetail|'+cartID].customer.cid;
					}
				if($fieldset && formObj)	{
// *** 201338 -> some paypal orders not passing validation due to address wonkyness returned from paypal.
//paypal address gets returned with as much as paypal needs/wants. trust what we already have (which may not be enough for OUR validation)
					if(_app.ext.cco.u.thisSessionIsPayPal())	{
						valid = 1;
						}
//if the buyer is logged in AND has pre-existing billing addresses, make sure one is selected.
					else if(_app.u.buyerIsAuthenticated() && _app.data.buyerAddressList && _app.data.buyerAddressList['@bill'] && _app.data.buyerAddressList['@bill'].length)	{
						if(formObj['bill/shortcut'])	{valid = 1}
						else	{
							$fieldset.anymessage({'message':'Please select the address you would like to use (push the checkmark button)'});
							}
						}
//in an admin session w/ an existing user, make sure the address has been selected IF the buyer has pre-defined addresses.
					else if(_app.u.thisIsAnAdminSession() && CID  && _app.u.thisNestedExists("data.adminCustomerDetail|"+CID+".@BILL",_app) && _app.data['adminCustomerDetail|'+CID]['@BILL'].length ) {
						if(formObj['bill/shortcut'])	{valid = 1}
						else	{
							$fieldset.anymessage({'message':'Please select the address you would like to use (push the checkmark button)'});
							}
						}
					else	{

//handle phone number input based on zGlobals setting.

						if(!_app.u.thisIsAnAdminSession() && zGlobals && zGlobals.checkoutSettings && zGlobals.checkoutSettings.chkout_phone == 'REQUIRED')	{
							$("input[name='bill/phone']",$fieldset).attr('required','required');
							}
						else	{
							$("input[name='bill/phone']",$fieldset).removeAttr('required');
							}

//postal and region are only required for domestic orders.
// * 201314 -> minlength was added to ensure a proper zip supplied.
						if(formObj['bill/countrycode'] == "US" || !formObj['bill/countrycode'])	{
							$("input[name='bill/postal']",$fieldset).attr('required','required').attr('data-minlength',5);
							$("input[name='bill/region']",$fieldset).attr('required','required');
							}
						else	{
//							$("input[name='bill/postal']",$fieldset).removeAttr('required').removeAttr('data-minlength');
//							$("input[name='bill/region']",$fieldset).removeAttr('required');
// *** 201324 -> best practice is to empty the attrib before removing it. (fixed an issue for Clinton)
							$("input[name='bill/postal']",$fieldset).attr('required','').removeAttr('required').removeAttr('data-minlength');
							$("input[name='bill/region']",$fieldset).attr('required','').removeAttr('required');
							}
						
						if(_app.u.validateForm($fieldset))	{valid = 1;} //the validateForm field takes care of highlighting necessary fields and hints.
						else {valid = 0}
						}
					}
				else	{
					valid = 0;
					$('#globalMessaging').anymessage({'message':'In order_create.validate.chkoutAddressBill, $form or formObj not passed.','gMessage':true});
					}
				if(!valid)	{
					_app.u.dump(" -> order_create.validate.chkoutAddressBill: "+valid);
					}
				return valid;
				}, //chkoutBillAddressFieldset

			chkoutAddressShip: function($fieldset,formObj)	{
				dump("BEGIN ship address validation");
				var valid = 0, cartID = $fieldset.closest("[data-app-role='checkout']").data('cartid');

				if($fieldset && formObj)	{
					
					if(formObj['want/bill_to_ship'])	{dump(" -> Bill to ship is enabled."); valid = 1;}
// *** 201338 -> some paypal orders not passing validation due to address wonkyness returned from paypal.
//paypal address gets returned with as much as they need/want. trust what we already have (which may not be enough for OUR validation)
					else if(_app.ext.cco.u.thisSessionIsPayPal())	{
						valid = 1;
						}
//if the buyer is logged in AND has pre-existing billing addresses, make sure one is selected.
					else if(_app.u.buyerIsAuthenticated() && _app.data.buyerAddressList && _app.data.buyerAddressList['@ship'] && _app.data.buyerAddressList['@ship'].length)	{
						dump(" -> user is authenticated and has ship address(es) defined");
						if(formObj['ship/shortcut'])	{valid = 1}
						else	{
							$fieldset.anymessage({'message':'Please select the address you would like to use (push the checkmark button)'});
							}
						}
//in an admin session w/ an existing user, make sure the address has been selected.
					else if(_app.u.thisIsAnAdminSession() && _app.u.thisNestedExists("data.cartDetail|"+cartID+".customer.cid",_app) && _app.data['cartDetail|'+cartID].customer.cid > 0) {
						if(formObj['ship/shortcut'])	{valid = 1}
						else	{
							$fieldset.anymessage({'message':'Please select the address you would like to use (push the checkmark button)'});
							}
						}
					else	{

//postal and region are only required for domestic orders.
// * 201314 -> minlength was added to ensure a proper zip supplied. Also provides a low-level of attempting shipping fraud (setting US for Int. shipping addresses)
						if(formObj['ship/countrycode'] == "US")	{
							$("input[name='ship/postal']",$fieldset).attr('required','required').attr('data-minlength',5);
							$("input[name='ship/region']",$fieldset).attr('required','required');
							}
						else	{
//							$("input[name='bill/postal']",$fieldset).removeAttr('required').removeAttr('data-minlength');
//							$("input[name='bill/region']",$fieldset).removeAttr('required');
// *** 201324 -> best practice is to empty the attrib before removing it. (fixed an issue for Clinton)
							$("input[name='bill/postal']",$fieldset).attr('required','').removeAttr('required').removeAttr('data-minlength');
							$("input[name='bill/region']",$fieldset).attr('required','').removeAttr('required');
							}
						
						if(_app.u.validateForm($fieldset))	{valid = 1;} //the validateForm field takes care of highlighting necessary fields and hints.
						else {valid = 0}
						}
					}
				else	{
					valid = 0;
					$('#globalMessaging').anymessage({'message':'In order_create.validate.chkoutAddressShip, $form or formObj not passed.','gMessage':true});
					}
				if(!valid)	{
					_app.u.dump(" -> cs2o.validate.chkoutAddressShip: "+valid);
					}
				return valid;
				}, //chkoutBillAddressFieldset				

//Some fieldsets have a 'role', but no validation logic. They still get functions so that validation can be overridden if need be (and also to fit nicely into the checkout function 'each' loop and count)
			chkoutNotes : function($fieldset,formObj)	{
				return 1;
				},
			chkoutCartItemsList : function($fieldset,formObj)	{
				return 1;
				},
			chkoutCartSummary : function($fieldset,formObj)	{
				return 1;
				}
				
			}, //validate
		


////////////////////////////////////   						panelDisplayLogic			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





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
//				_app.u.dump("BEGIN order_create.panelDisplayLogic.chkoutPreflight");
//If the user is logged in, no sense showing password or create account prompts.
				$("[data-app-role='buyerLogout']").hide(); //make sure this is hidden. Will be shown when necessary.
				if(_app.u.buyerIsAuthenticated() || _app.ext.cco.u.thisSessionIsPayPal())	{
					_app.u.dump(" -> session is authenticated OR this is an authorized paypal transaction.");
					$("[data-app-role='login']",$fieldset).hide();
					$("[data-app-role='username']",$fieldset).show();
//if the user is logged in, show the 'not you?' feature. However, don't show it if this is already paypal (at that point, they are who they say they are)
					if(!_app.ext.cco.u.thisSessionIsPayPal())	{
						$("[data-app-role='buyerLogout']").show();
						}
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
				// ** 201402
				//if the user is logged in, make sure the 'create account' checkbox is NOT checked.
				//otherwise, if checked=checked is set to enable account create by default and a user logs in, the checked box will cause validation error on a hidden panel.
				if(_app.u.buyerIsAuthenticated())	{
					$("input[name='want/create_customer']",$fieldset).prop('checked',false);
					}
				
				_app.ext.order_create.u.handlePlaceholder($fieldset);
				}, //preflight

			chkoutAccountCreate : function(formObj,$fieldset)	{
//				_app.u.dump('BEGIN order_create.panelDisplayLogic.chkoutAccountCreate');
				
				var authState = _app.u.determineAuthentication(),
				createCustomer = formObj['want/create_customer'];
				
				if(_app.u.buyerIsAuthenticated())	{
					$fieldset.hide();
					}
				else if(authState == 'thirdPartyGuest'  || _app.ext.cco.u.thisSessionIsPayPal())	{
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
				_app.ext.order_create.u.handlePlaceholder($fieldset);
				}, //chkoutAccountCreate
				
/*
a guest checkout gets just a standard address entry. 
an existing user gets a list of previous addresses they've used and an option to enter a new address.
*/
			chkoutAddressBill : function(formObj,$fieldset)	{
//				_app.u.dump("BEGIN displayLogic.chkoutAddressBill");
				var checkoutMode = $fieldset.closest('form').data('app-checkoutmode'), //='required'
				isAuthenticated = _app.u.buyerIsAuthenticated(),
				cartID = $fieldset.closest("[data-app-role='checkout']").data('cartid');
				
				if(!isAuthenticated && checkoutMode == 'required')	{
					//do nothing. panel is hidden by default, so no need to 'show' it.
					}
				else if(_app.ext.cco.u.thisSessionIsPayPal()){
					_app.u.dump("This is a paypal session");
					$fieldset.show(); //make sure panel is visible.
					$("[data-app-role='addressExists']",$fieldset).hide();
					$("[data-app-role='addressNew']",$fieldset).show();
					$("[data-app-role='billToShipContainer']").hide(); //though locked below, we hide this to avoid confusion.
					$("[name='want/bill_to_ship']",$fieldset).attr({'disabled':'disabled'}).removeAttr('checked'); //set val 
					//name is provided by paypal and can't be changed.
					$("[name='bill/firstname'], [name='bill/lastname']",$fieldset).attr('disabled','disabled');
					}
//displayLogic is executed AFTER the translation has occured, so use the # of <address> tags to determine if any addresses are present.
				else if($("address",$fieldset).length >= 1)	{
					$fieldset.show(); //make sure panel is visible.
					$("[data-app-role='addressExists']",$fieldset).show();
					$("[data-app-role='addressNew']",$fieldset).hide();
					$("address button[data-app-click='order_create|execBuyerAddressSelect']",$fieldset).removeClass('ui-state-highlight').button({icons: {primary: "ui-icon-check"},text:false}); //content was likely cleared, so button() these again.
					if(formObj['bill/shortcut'])	{
						_app.u.dump("Bill shortcut is set: "+formObj['bill/shortcut']);
//highlight the checked button of the address selected.<<
						var $button = $("[data-_id='"+formObj['bill/shortcut']+"'] button[data-app-click='order_create|execBuyerAddressSelect']",$fieldset).addClass('ui-state-highlight').button( "option", "icons", { primary: "ui-icon-check"} );
						}
					}
				else	{
					$fieldset.show(); //make sure panel is visible.
					$("[data-app-role='addressExists']",$fieldset).hide();
					$("[data-app-role='addressNew']",$fieldset).show();
//from a usability perspective, we don't want a single item select list to show up. so hide if only 1 or 0 options are available.
					if(_app.data['appCheckoutDestinations|'+cartID] && _app.data['appCheckoutDestinations|'+cartID]['@destinations'] && _app.data['appCheckoutDestinations|'+cartID]['@destinations'].length < 2)	{
						$("[data-app-role='billCountry']",$fieldset).hide();
						}
//The template used for address input is shared w/ address edit for authenticated users. In edit, certain events are not desired. So the events are added here.
					$("input[name='bill/address1'], input[name='bill/address2'], input[name='bill/city'], input[name='bill/region'], input[name='bill/postal']",$fieldset).attr('data-app-blur','order_create|execAddressUpdate');
					$("select[name='bill/countrycode']",$fieldset).attr('data-app-change','order_create|execCountryUpdate');
					}
				_app.ext.order_create.u.handlePlaceholder($fieldset);
				}, //chkoutAddressBill

			chkoutAddressShip : function(formObj,$fieldset)	{
				var checkoutMode = $fieldset.closest('form').data('app-checkoutmode'), //='required'
				isAuthenticated = _app.u.buyerIsAuthenticated(),
				cartID = $fieldset.closest("[data-app-role='checkout']").data('cartid');

//determine if panel should be visible or not.
				if(formObj['want/bill_to_ship'] == 'on' && !_app.ext.cco.u.thisSessionIsPayPal())	{$fieldset.hide()}
				else if(!isAuthenticated && checkoutMode == 'required')	{} //do nothing. panel is hidden by default in required mode.
				else	{$fieldset.show()}

//update display of panel contents.				
				if(_app.ext.cco.u.thisSessionIsPayPal()){
					$("[data-app-role='addressExists']",$fieldset).hide();
					$("[data-app-role='addressNew']",$fieldset).show();
//disable all shipping address inputs that are populated (by paypal) and select lists
					$("input,select",$fieldset).each(function(){
						if($(this).val() != '')	{
							$(this).attr('disabled','disabled')
							}
						});
					}
//displayLogic is executed AFTER the translation has occured, so use the # of <address> tags to determine if any addresses are present.
				else if($("address",$fieldset).length >= 1)	{
					$("[data-app-role='addressExists']",$fieldset).show();
					$("[data-app-role='addressNew']",$fieldset).hide();
					$("address button[data-app-click='order_create|execBuyerAddressSelect']",$fieldset).removeClass('ui-state-highlight').button({icons: {primary: "ui-icon-check"},text:false}); //content was likely cleared, so button() these again.
					if(formObj['ship/shortcut'])	{
						_app.u.dump("Ship shortcut is set: "+formObj['ship/shortcut']);
//highlight the checked button of the address selected.<<
						var $button = $("[data-_id='"+formObj['ship/shortcut']+"'] button[data-app-click='order_create|execBuyerAddressSelect']",$fieldset).addClass('ui-state-highlight').button( "option", "icons", { primary: "ui-icon-check"} );
						}
					}
				else	{
					$("[data-app-role='addressExists']",$fieldset).hide();
					$("[data-app-role='addressNew']",$fieldset).show();
//from a usability perspective, we don't want a single item select list to show up. so hide if only 1 or 0 options are available.
					if(_app.data['appCheckoutDestinations|'+cartID] && _app.data['appCheckoutDestinations|'+cartID]['@destinations'] && _app.data['appCheckoutDestinations|'+cartID]['@destinations'].length < 2)	{
						$("[data-app-role='shipCountry']",$fieldset).hide();
						}
//The template used for address input is shared w/ address edit for authenticated users. In edit, certain events are not desired. So the events are added here.
					$("input[name='ship/address1'], input[name='ship/address2'], input[name='ship/city'], input[name='ship/region'], input[name='ship/postal']",$fieldset).attr('data-app-blur','order_create|execAddressUpdate');
					$("select[name='ship/countrycode']",$fieldset).attr('data-app-change','order_create|execCountryUpdate');
					}
				_app.ext.order_create.u.handlePlaceholder($fieldset);
				}, //chkoutAddressShip

			chkoutMethodsShip : function(formObj,$fieldset)	{
//				_app.u.dump('BEGIN _app.ext.order_create.panelContent.shipMethods');
//close any existing error messages
				if($('.ui-widget-anymessage',$fieldset).length)	{
					$fieldset.anymessage('close');
					}
					
				var checkoutMode = $fieldset.closest('form').data('app-checkoutmode'), //='required'
				isAuthenticated = _app.u.buyerIsAuthenticated(),
				cartID = $fieldset.closest("[data-app-role='checkout']").data('cartid'),
				shipMethods = (_app.data['cartDetail|'+cartID]) ? _app.data['cartDetail|'+cartID]['@SHIPMETHODS'] : [],
				L = (shipMethods) ? shipMethods.length : 0;
				
//				_app.u.dump(' -> shipMethods.length: '+L); // _app.u.dump(shipMethods);
				
				
//WARNING -> if you decide not to hide the panel, the radio buttons must be locked/disabled instead.
				if(!isAuthenticated && checkoutMode == 'required')	{
					//do nothing. panel is hidden by default, so no need to 'show' it.
					}
				else if(_app.ext.cco.u.thisSessionIsPayPal())	{
					$fieldset.hide();
					}
				else	{
					$fieldset.show();
					}
//add the click event so that a change updates the cart/panels as needed.
//not in the render format itself so that it can be recycled.
				$(":radio",$fieldset).each(function(){
					$(this).attr('data-app-change','order_create|shipOrPayMethodSelectExec');
					})

//must appear after panel is loaded because otherwise the divs don't exist.
//per brian, use shipping methods in cart, not in shipping call.
// the panel content IS rendered even if not shown. ship method needs to be set for paypal
				if(L >= 1)	{
//					_app.u.dump(" -> Shipping methods are present.");
//if the method selected is UPS AND the merchant has rules enabled for that method, UPS requires the disclaimer to be shown.
					for(var i = 0; i < L; i += 1)	{
						if(shipMethods[i].id == formObj['want/shipping_id'])	{
							if(shipMethods[i]._carrier == 'UPS' && shipMethods[i].rules)	{
								$("[data-app-role='upsShipRulesDisclaimer']",$fieldset).show();
								}
							break; //exit early once a match is found.
							}
						}
					}
				else if(_app.vars.thisSessionIsAdmin && !_app.data['cartDetail|'+cartID]['@ITEMS'].length)	{
					$fieldset.anymessage({"message":"<p>An item must be added to the cart before shipping can be displayed.</p>","persistent":true});
					}
//no shipping methods and buyer is logged in.
				else if(_app.u.buyerIsAuthenticated())	{
					var hasPredefBillAddr = _app.ext.cco.u.buyerHasPredefinedAddresses('bill'),
					hasPredefShipAddr = _app.ext.cco.u.buyerHasPredefinedAddresses('ship');
					
					if(formObj['want/bill_to_ship'] && hasPredefBillAddr && formObj['bill/shortcut']){
						$fieldset.anymessage({"message":"<p>No shipping methods are available.</p>","persistent":true});
						}
					else if(!formObj['want/bill_to_ship'] && _app.ext.cco.u.buyerHasPredefinedAddresses('ship') == true && formObj['ship/shortcut']){
						$fieldset.anymessage({"message":"<p>No shipping methods are available.</p>","persistent":true});
						}
					else	{
						$fieldset.anymessage({"message":"<p>Please enter/select an address for a list of shipping options.</p>","persistent":true});
						}
					}
//no shipping methods present and buyer is logged out.
				else {
					if(formObj['want/bill_to_ship'] && !formObj['bill/postal'])	{
						$fieldset.anymessage({"message":"<p>Please enter a billing/shipping zip code for a list of shipping options.</p>","persistent":true});
						}
					else if(!formObj['want/bill_to_ship'] && !formObj['ship/postal'])	{
						$fieldset.anymessage({"message":"<p>Please enter a shipping zip code for a list of shipping options.</p>","persistent":true});
						}
					else	{
						$fieldset.anymessage({"message":"<p>No shipping methods are available.</p>","persistent":true});
						}
					}
				}, //chkoutMethodsShip

			chkoutCartItemsList : function(formObj,$fieldset){
				var checkoutMode = $fieldset.closest('form').data('app-checkoutmode'), //='required'
				isAuthenticated = _app.u.buyerIsAuthenticated();
				if(!isAuthenticated && checkoutMode == 'required')	{
					//do nothing. panel is hidden by default, so no need to 'show' it.
					}
				else	{
					$fieldset.show();
					}
				}, //chkoutCartItemsList

			chkoutCartSummary : function(formObj,$fieldset)	{
				var checkoutMode = $fieldset.closest('form').data('app-checkoutmode'), //='required'
				isAuthenticated = _app.u.buyerIsAuthenticated();
				if(!isAuthenticated && checkoutMode == 'required')	{
					//do nothing. panel is hidden by default, so no need to 'show' it.
					}
				else	{
					$fieldset.show();
//The reference # only shows up IF company is populated and payby isn't PO.
//The input isn't shown till a payment is selected to avoid displaying it, then hiding it.
//the input is removed entirely because the field name is used if payment type = PO.
					if(formObj['bill/company'] && formObj['want/payby'] && formObj['want/payby'] != "PO")	{
						$("[data-app-role='referenceNumber']",$fieldset).show();
						}
					else	{
						$("[data-app-role='referenceNumber']",$fieldset).empty().remove();
						}
					}
				}, //chkoutCartSummary

			chkoutMethodsPay : function(formObj,$fieldset,cartData)	{
//the renderformat will handle the checked=checked. however some additional payment inputs may need to be added. that happens here.
				var
					checkoutMode = $fieldset.closest('form').data('app-checkoutmode'), //='required'
					isAuthenticated = _app.u.buyerIsAuthenticated(),
					cartID = $fieldset.closest("[data-app-role='checkout']").data('cartid');
				
				if(!isAuthenticated && checkoutMode == 'required')	{
					//do nothing. panel is hidden by default, so no need to 'show' it.
					}
				else if(_app.ext.cco.u.thisSessionIsPayPal())	{
					$fieldset.show();
//this is a paypal session. payment methods are not available any longer. stored payments are irrelevant. show paymentQ
//also show a message to allow the merchant to remove the paypal payment option and use a different method?
					$("[data-app-role='giftcardContainer']",$fieldset).hide();
					$("[data-app-role='paymentOptionsContainer']",$fieldset).hide();
					$("[data-app-click='order_create|execChangeFromPayPal']",$fieldset).show();
					}
				else	{
					$fieldset.show();


//if the user is logged in and has giftcards, show a message about partial GC payments.
					if(_app.u.buyerIsAuthenticated() && _app.ext.cco.u.paymentMethodsIncludesGiftcard('appPaymentMethods|'+$fieldset.closest("[data-app-role='checkout']").data('cartid'))){
						$("[data-app-role='giftcardHint']",$fieldset).show();
						}
					else {} //user is not logged in.
				//if the balance is zero, hide the payment inputs to avoid confusion.
					if(_app.u.thisNestedExists("data.cartDetail|"+cartID+".sum.balance_due_total",_app) && Number(_app.data["cartDetail|"+cartID].sum.balance_due_total) <= 0)	{
						$("[data-app-role='paymentOptionsContainer']",$fieldset).hide();
						}
					else	{
//detect # of wallets and behave accordingly.
						if($("[data-app-role='storedPaymentsContent']",$fieldset).children().length >= 1)	{
							var cartID = $fieldset.closest("[data-app-role='checkout']").data('cartid');
							$("[data-app-role='storedPaymentsHeader']",$fieldset).show();
							$("[data-app-role='storedPaymentsContent']",$fieldset).show();
							$("[data-app-role='nonStoredPaymentsHeader']",$fieldset).show();
							$("[data-app-role='nonStoredPaymentsContent']",$fieldset).show();
							
							$("[data-app-role='paymentOptionsContainer']",$fieldset).accordion({
								heightStyle: "content",
								active: (_app.data['cartDetail|'+cartID] && _app.data['cartDetail|'+cartID].want && _app.data['cartDetail|'+cartID].want.payby && _app.data['cartDetail|'+cartID].want.payby.indexOf('WALLET') == -1) ? 0 : 1 //unless a buyer has already selected a non-wallet payment method, show stores payments as open.
								});
							}
						else	{
							$("[data-app-role='storedPaymentsHeader']",$fieldset).hide();
							$("[data-app-role='storedPaymentsContent']",$fieldset).hide();
							$("[data-app-role='nonStoredPaymentsHeader']",$fieldset).hide(); //header only needed if stored payments are present.
							$("[data-app-role='nonStoredPaymentsContent']",$fieldset).show();
							}
						}

//if a payment method has been selected, show the supplemental inputs and check the selected payment.
//additionally, if the payment is NOT Purchase Order AND the company field is populated, show the reference # input.
//* 201405 -> issue w/ IE8 not recognizing want/payby being set after selecting/changing payment methods.
					var payby = formObj['want/payby'];
					if(!payby && _app.u.thisNestedExists("want.payby",cartData))	{
						payby = cartData.want.payby;
						}
					if(payby)	{
						var $radio = $("input[value='"+payby+"']",$fieldset);
						if($radio.length > 0){
							var $supplemental = _app.ext.order_create.u.showSupplementalInputs($radio,_app.ext.order_create.vars);
							if($supplemental)	{
								_app.u.dump(" -> payment method ["+payby+"] HAS supplemental inputs");
								$radio.closest("[data-app-role='paymentMethodContainer']").append($supplemental);
								}
							}
						//the 'loop' renderformat for wallet display only accepts one piece of data. in this case, the walley payment method.
						//so the 'cart' isn't available to load payby. crappy. a better long term solution would be a tlcFormat 
						if(payby.indexOf('WALLET') >= 0)	{
							$radio.prop('checked','checked')
							}
						}
					else	{
//no payment method selected yet.
						}

					}

				}, //chkoutMethodsPay

			chkoutNotes : function(formObj,$fieldset)	{
				var checkoutMode = $fieldset.closest('form').data('app-checkoutmode'), //='required'
				isAuthenticated = _app.u.buyerIsAuthenticated();
				if(!isAuthenticated && checkoutMode == 'required')	{
					//do nothing. panel is hidden by default, so no need to 'show' it.
					}
				else if(_app.u.thisIsAnAdminSession() || zGlobals.checkoutSettings.chkout_order_notes)	{$fieldset.show()}
				else	{$fieldset.hide()}
				} //chkoutNotes

			}, //panelDisplayLogic
	
//push onto this (order_create.checkoutCompletes.push(function(P){});
//after checkout, these will be iterated thru and executed.
/*
Parameters included are as follows:
P.orderID
P.cartID (this would be the cartID associated w/ the order. immediately after checkout, this is dumped by the mvc and a new cart id is generated/used)
P.datapointer - pointer to cartOrderCreate

note - the order object is available at _app.data['order|'+P.orderID]
*/
		checkoutCompletes : [],



		a : {
			//used in the admin UI for creating a new cart.
			appCartCreate : function($target)	{
				_app.calls.appCartCreate.init({'datapointer':'appCartCreate','callback':function(rd){
					if(_app.model.responseHasErrors(rd)){
						$target.anymessage({'message':rd});
						}
					else	{
//appCartCreate will automatically update the carts object in localstorage
						_app.ext.order_create.a.startCheckout($target,_app.data[rd.datapointer]._cartid);
						//do NOT set a host here.
						_app.model.addDispatchToQ({'_cmd':'cartSet','_cartid':_app.data[rd.datapointer]._cartid,'our/domain':_app.vars.domain},'immutable');
						_app.model.dispatchThis('immutable');
						}
				}},'immutable');
				_app.model.dispatchThis('immutable');
				},
// ### FUTURE -> get rid of this. startCheckout should support an object instead of a single param.
			editCart : function($target,P)	{
				_app.require('cco',function(){
					this.startCheckout($target,P.cartid);
					});
				},

//don't execute this UNTIL you have a valid cart id.
			startCheckout : function($chkContainer,cartID)	{
				_app.u.dump("BEGIN order_create.a.startCheckout. cartID: "+cartID);
//				_app.u.dump(" -> _app.u.buyerIsAuthenticated(): "+_app.u.buyerIsAuthenticated());

				if($chkContainer && $chkContainer.length && cartID)	{
					_app.u.dump(" -> startCheckout cartid: "+cartID);
					$chkContainer.empty();
								
					_app.u.addEventDelegation($chkContainer);
					$chkContainer.anyform({
						trackEdits : _app.u.thisIsAnAdminSession() //edits are only tracked in the admin interface
						});
					$chkContainer.css('min-height','300'); //set min height so loading shows up.

					$chkContainer.showLoading({'message':'Fetching cart contents and payment options'});

					if(_app.u.buyerIsAuthenticated())	{
						_app.calls.buyerAddressList.init({'callback':'suppressErrors'},'immutable'); //will check localStorage.
						_app.model.addDispatchToQ({'_cmd':'buyerWalletList','_tag':	{'datapointer' : 'buyerWalletList','callback':'suppressErrors'}},'immutable'); //always obtain clean copy of wallets.
						}

					_app.ext.order_create.vars[cartID] = _app.ext.order_create.vars[cartID] || {'payment':{}};

					_app.ext.order_create.u.handlePaypalInit($chkContainer, cartID); //handles paypal code, including paymentQ update. should be before any callbacks.
					_app.ext.cco.calls.appPaymentMethods.init({_cartid:cartID},{},'immutable');
					_app.ext.cco.calls.appCheckoutDestinations.init(cartID,{},'immutable');
					
					_app.model.destroy('cartDetail|'+cartID);
					
					_app.calls.cartDetail.init(cartID,{'callback':function(rd){
						$chkContainer.hideLoading(); //always hideloading, errors or no, so interface is still usable.
						if(_app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
//							_app.u.dump(" -> cartDetail callback for startCheckout reached.");
							if(_app.data[rd.datapointer]['@ITEMS'].length || _app.u.thisIsAnAdminSession())	{
								_app.u.dump(" -> cart has items or this is an admin session. cartID: "+cartID);
//								var $checkoutContents = _app.renderFunctions.transmogrify({},'checkoutTemplate',_app.ext.order_create.u.extendedDataForCheckout(cartID));
								var $checkoutContents = new tlc().runTLC({'templateid':'checkoutTemplate','dataset':_app.ext.order_create.u.extendedDataForCheckout(cartID)})
								
								$checkoutContents.data('cartid',cartID);

								if($checkoutContents.attr('id'))	{}
								else	{
									$checkoutContents.attr('id','ordercreate_'+_app.u.guidGenerator()); //add a random/unique id for use w/ dialogs and callbacks.
									}								

								$chkContainer.append($checkoutContents);
_app.u.handleButtons($chkContainer); //will handle buttons outside any of the fieldsets.
								$("fieldset[data-app-role]",$chkContainer).each(function(index, element) {
									var $fieldset = $(element),
									role = $fieldset.data('app-role');
									
									$fieldset.addClass('ui-corner-all');
									$("legend",$fieldset).addClass('ui-widget-header ui-corner-all');
									_app.ext.order_create.u.handlePanel($chkContainer,role,['handleDisplayLogic']);
									});
//								_app.u.dump(" -> handlePanel has been run over all fieldsets.");
								if(_app.u.thisNestedExists("zGlobals.globalSettings.inv_mode") && Number(zGlobals.globalSettings.inv_mode) > 1 && !_app.u.thisIsAnAdminSession())	{
									_app.u.dump(" -> inventory mode set in such a way that an inventory check will occur.");
									_app.ext.cco.calls.cartItemsInventoryVerify.init(cartID,{'callback':'handleInventoryUpdate','extension':'order_create','jqObj':$checkoutContents});
									_app.model.dispatchThis('immutable');
									}
								else if(_app.u.thisIsAnAdminSession() && _app.data[rd.datapointer].customer.cid)	{
									//in the admin interface, the quirksmode bug won't be an issue because it only happens at app init and we're well past that by now.
									// context must NOT be $checkoutContainer because that is 'higher' than the data-app-role='checkout' that is used by the panels to ascertain the cart id.
									$checkoutContents.showLoading({'message':'Fetching customer record'});
									_app.ext.admin.calls.adminCustomerDetail.init({'CID':_app.data[rd.datapointer].customer.cid,'rewards':1,'notes':1,'orders':1,'organization':1,'wallets':1},{'callback' : 'updateAllPanels','extension':'order_create','jqObj':$checkoutContents},'mutable');
									_app.model.dispatchThis('mutable');
									}
								else if(document.compatMode == 'CSS1Compat')	{}
								else	{
									_app.u.dump(" -> Quirks mode detected. Re-render the panels after a short delay. this is to correct an issue w/ quirks and jquery ui button()",'warn');
									setTimeout(function(){
										_app.ext.order_create.u.handlePanel($checkoutContents,'chkoutCartSummary',['empty','translate','handleDisplayLogic']);
										_app.ext.order_create.u.handlePanel($checkoutContents,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
										_app.ext.order_create.u.handlePanel($checkoutContents,'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
										_app.ext.order_create.u.handlePanel($checkoutContents,'chkoutAddressBill',['empty','translate','handleDisplayLogic']);
										_app.ext.order_create.u.handlePanel($checkoutContents,'chkoutAccountCreate',['empty','translate','handleDisplayLogic']);
										_app.ext.order_create.u.handlePanel($checkoutContents,'chkoutPreflight',['empty','translate','handleDisplayLogic']);
										},1000);
									}
								}
							else	{
								$chkContainer.anymessage({'message':'It appears your cart is empty. If you think you are receiving this message in error, please refresh the page or contact us.'});
								}
							}
						}},'immutable');
//					_app.u.dump(" -> made it past adding calls to Q for startCheckout. now dispatch.");
					_app.model.dispatchThis('immutable');
					}
				else	{
					$('#globalMessaging').anymessage({'message':'in order_create.a.startCheckout, no $chkContainer [jQuery instance: '+($chkContainer instanceof jQuery)+'] not passed or does not exist or cartid ['+cartID+'] not passed.','gMessage':true});
					}
				}, //startCheckout
			showInvoice : function($container, cartid){
				var parentID = 'invoiceContainer-'+cartid.replace(/[^a-zA-Z0-9]+/g, '-');
				$container.attr('id', parentID);
				_app.model.addDispatchToQ({
					'_cmd':'cartOrderStatus',
					'_cartid' : cartid,
					'_tag' : {
						'attempt' : 1,
						'callback' : 'cartOrderStatus',
						'extension' : 'order_create',
						'datapointer' : 'cartOrderCreate|'+cartid,
						'parentID' : parentID
						}
					}, 'mutable');
				_app.model.dispatchThis('mutable');
				},
			//When this gets run, the datapointer in _rtag will be cartOrderStatus. 
			checkoutComplete : function(_rtag)	{
				_app.u.dump('BEGIN order_create.a.checkoutComplete. _rtag: '); dump(_rtag);
				//getting here is not a guarantee checkout was successful.  Check _rtag for errors.
				//could be that a max. # of polls was reached or some other error occured.
				if(_app.model.responseHasErrors(_rtag)){
					$('#globalMessaging').anymessage({'message':_rtag});
					}
				else if(_rtag.refresh){
					var cartid = _app.data[_rtag.datapointer]['status-cartid'];
					window.location = zGlobals.appSettings.https_app_url + "invoice/?cartid="+cartid;
					}
				else {
					$('#'+_rtag.parentID).hideLoading();
					
					var $checkout = $(_app.u.jqSelector('#',_rtag.parentID));
					var checkoutData = _app.data[_rtag.datapointer] || {};
					
					if($checkout instanceof jQuery && $checkout.length)	{
						var orderID = checkoutData.orderid,
						previousCartid = checkoutData.order.cart.cartid;
//show post-checkout invoice and success messaging.
						$checkout.empty().show();
						$checkout.tlc({'templateid':'chkoutCompletedTemplate',dataset: checkoutData}); //show invoice
		
		
//This will add a cart message. handy if the buyer and merchant are dialoging.
						if(typeof cartMessagePush === 'function')	{
							cartMessagePush(previousCartid,'cart.orderCreate',{'vars':{'orderid':orderID,'description':'Order created.'}});
							}
// * 201403 -> duplicate of cartMessagePush above.		
//if a cart messenger is open, log the cart update.
//						if(_app.u.thisNestedExists('ext.cart_message.vars.carts.'+previousCartid,_app))	{
//							_app.model.addDispatchToQ({'_cmd':'cartMessagePush','what':'cart.update','orderid':orderID,'description':'Order created.','_cartid':previousCartid},'immutable');
//							}
		
						_app.u.handleButtons($checkout);
						
						if(_app.u.thisIsAnAdminSession() || _app.vars._clientid == '1pc')	{} //no need to get a new cart id for an admin session or 1PC. handle any third party display code.
						else	{
	
//cartDetail call in a callback to the appCartCreate call because that cartDetail call needs a cart id
//			passed to it in order to know which cart to fetch (no longer connected to the session!).  This resulted in a bug that multiple
//			orders placed from the same computer in multiple sessions could have the same cart id attached.  Very bad.
							_app.model.removeCartFromSession(previousCartid);
							_app.calls.appCartCreate.init({
								"datapointer" : "appCartCreate",
								"callback" : function(rd){
//									dump(" -----------> rd: "); dump(rd);
									if(_app.model.responseHasErrors(rd)){
										_app.u.throwMessage(rd);
										}
									else if(_app.data[rd.datapointer] && _app.data[rd.datapointer]._cartid) {
										_app.calls.cartDetail.init(_app.data[rd.datapointer]._cartid,{},'immutable');
										_app.model.dispatchThis('immutable');
										}
									else	{
										//something went wrong.  no cart id in the appcartcreate.
										}
									}
								}); //!IMPORTANT! after the order is created, a new cart needs to be created and used. the old cart id is no longer valid.
							
							} //ends the not admin/1pc if.
		
						window[_app.vars.analyticsPointer]('send','event','Checkout','App Event','Order created');
						window[_app.vars.analyticsPointer]('send','event','Checkout','User Event','Order created ('+orderID+')');
							
		
						if(_app.ext.order_create.checkoutCompletes)	{
							var L = _app.ext.order_create.checkoutCompletes.length;
							for(var i = 0; i < L; i += 1)	{
								_app.ext.order_create.checkoutCompletes[i]({'cartID':previousCartid,'orderID':orderID,'datapointer':_rtag.datapointer},$checkout);
								}
							}

//This will handle the @trackers code. Doesn't get run in admin.
						if(!_app.u.thisIsAnAdminSession())	{
							_app.ext.order_create.u.scripts2iframe(checkoutData['@TRACKERS']);
							}

// ### TODO -> move this out of here. move it into the appropriate app init.
						if(_app.vars._clientid == '1pc')	{
						//GTS for apps is handled in google extension
// * 201405 -> IE8 didn't like this delete. changed how the check occurs and the delete itself.
							if('GoogleTrustedStore' in window)	{
								try	{
									delete GoogleTrustedStore; //delete existing object or gts conversion won't load right.
						//running this will reload the script. the 'span' will be added as part of html:roi
						//if this isn't run in the time-out, the 'span' w/ order totals won't be added to DOM and this won't track as a conversion.
									(function() {
										var scheme = (("https:" == document.location.protocol) ? "https://" : "http://");
										var gts = document.createElement("script");
										gts.type = "text/javascript";
										gts.async = true;
										gts.src = scheme + "www.googlecommerce.com/trustedstores/gtmp_compiled.js";
										var s = document.getElementsByTagName("script")[0];
										s.parentNode.insertBefore(gts, s);
										})();
									}
								catch(e)	{
									dump("Was unable to delete GoogleTrustedStore from window. conversion may not track properly. error: ",'warn'); dump(e);
									}

								}
							}
						else if(_app.u.thisIsAnAdminSession())	{
							//no special handling here.
							}
						else	{
							//this is an 'app'.
//								_app.u.dump("Not 1PC.");
//								_app.u.dump(" -> [data-app-role='paymentMessaging'],$checkout).length: "+("[data-app-role='paymentMessaging']",$checkout).length);
							
							//MUST destroy the cart. it has data-cartid set that would point to the wrong cart.
							$('#modalCart').empty().remove(); 
							$('#mainContentArea_cart').empty().remove();

							//the code below is to disable any links in the payment messaging for apps. there may be some legacy links depending on the message.
							$("[data-app-role='paymentMessaging'] a",$checkout).on('click',function(event){
								event.preventDefault();
								});
							$("[data-app-role='paymentMessaging']",$checkout).on('click',function(event){
								event.preventDefault();
								//cart and order id are in uriParams to keep data locations in sync in showCustomer. uriParams is where they are when landing on this page directly.
								showContent('customer',{'show':'invoice','uriParams':{'cartid':previousCartid,'orderid':orderID}});
								});
		
							}
						//outside the if/else above so that cartMessagesPush and cartCreate can share the same pipe.
						_app.model.dispatchThis('immutable'); //these are auto-dispatched because they're essential.	
						}
					else	{
						//something went wrong. $checkout is not a valid jquery instance or has no length.
						$('#globalMessaging').anymessage({'message':'Your order ('+checkoutData.orderid+') was created, but something went amiss along the way and the invoice can not be displayed. Please go to my account and order history to view your invoice.  A copy was also mailed to you.','persistent':true});
						}
					}
				}
			
			
			}, //a


////////////////////////////////////   						appEvents [e]			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		e : {

			adminCustomerLookup : function($ele,p)	{
				p.preventDefault();
				var
					$context = $ele.closest("[data-app-role='checkout']"),
					email = $ele.closest('fieldset').find("[name='bill/email']").val(), //save to var before handleing panel or val is gone.
					cartid = $context.data('cartid');
				if(email)	{
					_app.ext.admin_customer.a.customerSearch({'searchfor':email,'scope':'EMAIL'},function(customer){
						_app.ext.order_create.u.handlePanel($context,'chkoutPreflight',['empty','showLoading']);
						_app.ext.order_create.u.handlePanel($context,'chkoutAddressBill',['empty','showLoading']);
						_app.ext.order_create.u.handlePanel($context,'chkoutAddressShip',['empty','showLoading']);
						
						_app.ext.cco.calls.cartSet.init({'_cartid':cartid,'bill/email':customer.EMAIL});
						_app.model.addDispatchToQ({
							'_cmd':'adminCartMacro',
							'_cartid' : cartid,
							'_tag' : {
								'callback' : 'showMessaging',
								'jqObj' : $('#globalMessaging'),
								'message' : 'Customer '+customer.EMAIL+' assigned to this cart'
								},
							"@updates" : ["LINK-CUSTOMER-ID?CID="+customer.CID]
							},'immutable');
						_app.model.destroy('cartDetail|'+cartid);
						_app.model.destroy('appPaymentMethods|'+cartid);
//get a clean copy of the customer record for 2 reason. 1 to make sure it's up to date. 2 because cartDetail just got nuked from memory so callback on customerDetail would load a blank cart.
						_app.model.destroy('adminCustomerDetail|'+customer.CID); 
						_app.calls.cartDetail.init(cartid,{},'immutable');
						_app.ext.cco.calls.appPaymentMethods.init({_cartid:cartid},{},'immutable'); //update pay and ship anytime either address changes.
						_app.ext.admin.calls.adminCustomerDetail.init({'CID':customer.CID,'rewards':1,'notes':1,'orders':1,'organization':1,'wallets':1},{'callback' : 'updateAllPanels','extension':'order_create','jqObj':$context},'immutable');
						_app.model.dispatchThis('immutable');
						});
					}
				else	{
					_app.u.validateForm($ele.closest('fieldset')); //this will handle the error display.
					}
				return false;
				},
			
			adminAddressCreateUpdateShow : function($ele,p)	{
				p.preventDefault();
				var
					$checkout = $ele.closest("[data-app-role='checkout']"),
					addressType = $ele.closest("[data-app-addresstype]").attr('data-app-addresstype'),
					CID = _app.data['cartDetail|'+$checkout.data('cartid')].customer.cid,
					vars = {
						'mode' : $ele.data('mode'), //will b create or update.
						'show' : 'dialog',
						'TYPE' : addressType,
						'CID' : CID,
						'editorID' : $checkout.attr('id')
						};
				
				
				_app.ext.admin_customer.a.addressCreateUpdateShow(vars,function(v,addrObj){
					
					_app.ext.order_create.u.handlePanel($checkout,'chkoutPreflight',['empty','translate','handleDisplayLogic']);
					_app.ext.order_create.u.handlePanel($checkout,'chkoutAddressBill',['empty','translate','handleDisplayLogic']);
					_app.ext.order_create.u.handlePanel($checkout,'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
					_app.ext.order_create.u.handlePanel($checkout,'chkoutMethodsShip',['empty','translate','handleDisplayLogic']);
					_app.ext.order_create.u.handlePanel($checkout,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
					_app.ext.order_create.u.handlePanel($checkout,'chkoutCartItemsList',['empty','translate','handleDisplayLogic']);
					if($ele.data('mode') == 'update')	{
					//can't use $ele to trigger the click on the address select after updating the panels, because $ele is no longer on the dom, so $checkout, which is a constant, is used to find the address/button
						$("fieldset[data-app-addresstype='"+addressType+"']",$checkout).find("address[data-_id='"+addrObj.SHORTCUT+"'] button[data-app-role='addressSelectButton']").trigger('click');
						}
					},_app.ext.cco.u.getAndRegularizeAddrObjByID(_app.data['adminCustomerDetail|'+CID]['@'+vars.TYPE.toUpperCase()],$ele.closest("[data-_id]").data('_id'),vars.TYPE,false));
				return false;
				},

			adminCartRemoveFromSession : function($ele,p)	{
				p.preventDefault();
				_app.model.removeCartFromSession($ele.closest("[data-app-role='checkout']").data('cartid'));
				navigateTo("#!tab/orders");
				return false;
				},
			adminOrderDetailShow : function($ele,p)	{
				p.preventDefault();
				var orderID = $ele.closest("[data-orderid]").data('orderid');
				if(orderID)	{
					var $orderContent = $("[data-app-role='orderContents']:first",$ele.closest("[data-app-role='orderContainer']")).show();
					_app.ext.admin.calls.adminOrderDetail.init(orderID,{
						'callback' : 'tlc',
						'jqObj' : $orderContent,
						'verb' : 'translate'
						},'mutable');
					_app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In order_create.e.adminOrderDetailShow, unable to ascertain orderid.","gMessage":true});
					}
				return false;
				},

			buyerLogout : function($ele,p)	{
				p.preventDefault;
//				_app.u.dump(" BEGIN order_create.e.buyerLogout");
//					_app.u.dump(" -> order_create.e.buyerLogout (Click!)");
				_app.calls.buyerLogout.init({'callback':function(rt){
					_app.ext.order_create.u.handlePanel($ele.closest('form'),'chkoutPreflight',['empty','translate','handleDisplayLogic']);
					_app.ext.order_create.u.handlePanel($ele.closest('form'),'chkoutAddressBill',['empty','translate','handleDisplayLogic']);
					_app.ext.order_create.u.handlePanel($ele.closest('form'),'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
					_app.ext.order_create.u.handleCommonPanels($ele.closest('form'));
					_app.model.dispatchThis('immutable');
					}});
				_app.model.dispatchThis('immutable');
				$('body').removeClass('buyerLoggedIn'); //allows for css changes to occur based on authentication
				return false;
				},

			cartItemAppendSKU : function($ele,p)	{
				p.preventDefault();
				p.skuArr = [$ele.closest("[data-sku]").data('sku')];
				this.cartItemAppendAllSKUsFromOrder($ele,p);
				return false;
				},

			//SKU/STID required (fully qualified, w/ variations et all);
			cartItemAppendAllSKUsFromOrder : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					var $container = $ele.closest("[data-app-role='orderContainer']"), orderID = $container.data('orderid');
					if(orderID)	{
						var $checkout = $ele.closest("[data-app-role='checkout']"), cartID = $checkout.data('cartid');
						_app.ext.cco.u.appendOrderItems2Cart({'orderid':orderID,'cartid':cartID},function(rd){
	//run an inventory check. However, do NOT auto-adjust. Merchants should be allowed to over-order if desired.
	//throw a fatty warning tho to make sure it isn't missed.
							_app.ext.cco.calls.cartItemsInventoryVerify.init(cartID,{'callback':'adminInventoryDiscrepencyDisplay','extension':'cco','jqObj':$container});
							_app.ext.order_create.u.handleCommonPanels($checkout);
							_app.model.dispatchThis('immutable');

							},p.skuArr || []);
						}
					else	{
						
						}
					});
				return false;
				},

			//updates line item in cart. This event can be fired on an element (input, button, etc) within the scope of the line item template.
			cartItemUpdateExec : function($ele,p){
				p.preventDefault();
				var
					$container = $ele.closest('[data-stid]'),
					cartid = $ele.closest(":data(cartid)").data('cartid'),
					vars = {
						stid : $container.data('stid'),
						uuid : $container.attr('data-uuid'),
						qty : $("input[name='qty']",$container).val(), //admin wants qty.
						quantity : $("input[name='qty']",$container).val() //cartItemUpdate wants quantity
						}
				
				if($("input[name='price']",$container).val() && _app.u.thisIsAnAdminSession())	{
					vars.price = $("input[name='price']",$container).val();
					}
				
				if(_app.ext.cco.u.cartItemUpdate(cartid,vars,{'callback' : 'updateAllPanels','extension':'order_create','jqObj':$ele.closest('form')}))	{
					_app.model.destroy('cartDetail|'+cartid);
					_app.calls.cartDetail.init(cartid,{},'immutable');
					_app.model.dispatchThis('immutable');
					}
				else	{
					//cartItemUpdate will handle error display.
					}
				return false;
				}, //cartItemUpdateExec


			cartShippingSave : function($ele,p)	{
				p.preventDefault();
				var
					$container = $ele.closest("[data-app-role='customShipMethodContainer']"),
					cartid = $ele.closest(":data(cartid)").data('cartid'),
					sfo = $container.serializeJSON();
				$('.ui-state.error',$container).removeClass('ui-state-error'); //remove any previous errors.
				if(sfo['sum/shp_carrier'] && sfo['sum/shp_method'] && sfo['sum/shp_total'])	{
					_app.model.addDispatchToQ({
						'_cmd':'adminCartMacro',
						'_cartid' : cartid,
						'_tag' : {},
						"@updates" : ["SETSHIPPING?"+_app.u.hash2kvp(sfo)]
						},'immutable');
					_app.ext.order_create.u.handleCommonPanels($ele.closest('form'));
					_app.model.dispatchThis('immutable');
					}
				else	{
					//handle errors.
					if($("[name='sum/shp_carrier']",$container).val())	{}
					else	{$("[name='sum/shp_carrier']",$container).addClass('ui-state-error')}

					if($("[name='sum/shp_method']",$container).val())	{}
					else	{$("[name='sum/shp_method']",$container).addClass('ui-state-error')}

					if($("[name='sum/shp_total']",$container).val())	{}
					else	{$("[name='sum/shp_total']",$container).addClass('ui-state-error')}
					}
				return false;
				}, //orderSummarySave


			cartItemAddFromForm : function($ele,p)	{
				p.preventDefault();
				_app.require(['cco','store_product'], function(){
					var $chkoutForm	= $ele.closest("[data-add2cart-role='container']"), $checkout = $ele.closest("[data-app-role='checkout']");
					_app.ext.store_product.u.handleAddToCart($chkoutForm,{'callback': function(){
						_app.model.destroy('cartDetail|'+$checkout.data('cartid'));
						_app.model.destroy('appPaymentMethods|'+$checkout.data('cartid'));
						_app.ext.cco.calls.appPaymentMethods.init({_cartid:$checkout.data('cartid')},{},'immutable');
						_app.calls.cartDetail.init($checkout.data('cartid'),{
							'callback':function(rd){
								if(_app.model.responseHasErrors(rd)){
									$ele.closest('fieldset').anymessage({'message':rd});
									}
								else	{
									_app.ext.order_create.u.handlePanel($checkout,'chkoutCartItemsList',['empty','translate','handleDisplayLogic']); //for toggling display of ref. # field.
									_app.ext.order_create.u.handlePanel($checkout,'chkoutCartSummary',['empty','translate','handleDisplayLogic']); //for toggling display of ref. # field.
									_app.ext.order_create.u.handlePanel($checkout,'chkoutMethodsShip',['empty','translate','handleDisplayLogic']);
									_app.ext.order_create.u.handlePanel($checkout,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
									_app.ext.order_create.u.handlePanel($checkout,'chkoutCartSummary',['empty','translate','handleDisplayLogic']);
									}
								}
							},'immutable'); //update cart so that if successful, the refresh on preflight panel has updated info.
						_app.model.dispatchThis('immutable');
						}});
					});
				return false;
				}, //cartItemAddFromForm

			cartItemAddWithChooser : function($ele,p)	{
				p.preventDefault();
				_app.require(['cco','store_product'], function(){
	//$button is passed into the showFinder function. This is the button that appears IN the chooser/finder for adding to the cart/order.	
					var $chkoutForm	= $ele.closest('form'), $checkout = $ele.closest("[data-app-role='checkout']")
					var $button = $("<button>").text("Add to Cart").button().on('click',function(event){
						event.preventDefault();
						$(this).button('disable'); //prevent doubleclick.
						var $form = $('form','.chooserResultContainer');
						if($form && $form.length)	{
	//						_app.u.dump(" -> found form");
							$form.append("<input type='hidden' name='_cartid' value='"+$checkout.data('cartid')+"' \/>");
							var sfo = $form.serializeJSON(); //Serialized Form Object.
							var pid = sfo.sku;  //shortcut
							sfo.product_id = pid; //
	//						_app.u.dump(" -> sfo: "); _app.u.dump(sfo);
							if(_app.ext.store_product.validate.addToCart(pid,$form))	{
								_app.u.dump(" -> passed validation");
								_app.ext.store_product.u.handleAddToCart($form,{'callback' : function(){

									_app.model.destroy('cartDetail|'+$checkout.data('cartid'));
									_app.model.destroy('appPaymentMethods|'+$checkout.data('cartid'));
									_app.ext.cco.calls.appPaymentMethods.init({_cartid:$checkout.data('cartid')},{},'immutable');
									_app.calls.cartDetail.init($checkout.data('cartid'),{
										'callback':function(rd){
											if(_app.model.responseHasErrors(rd)){
												$('#prodFinder').anymessage({'message':rd});
												}
											else	{
												$('#prodFinder').dialog('close');
		//										dump(" ----> $chkoutForm.length: "+$chkoutForm.length);
												_app.ext.order_create.u.handlePanel($chkoutForm,'chkoutCartItemsList',['empty','translate','handleDisplayLogic']); //for toggling display of ref. # field.
												_app.ext.order_create.u.handlePanel($chkoutForm,'chkoutCartSummary',['empty','translate','handleDisplayLogic']); //for toggling display of ref. # field.
												_app.ext.order_create.u.handlePanel($chkoutForm,'chkoutMethodsShip',['empty','translate','handleDisplayLogic']);
												_app.ext.order_create.u.handlePanel($chkoutForm,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
												_app.ext.order_create.u.handlePanel($chkoutForm,'chkoutCartSummary',['empty','translate','handleDisplayLogic']);
												}
											}
										},'immutable'); //update cart so that if successful, the refresh on preflight panel has updated info.
									//an issue w/ the API maybe? the cartDetail is coming back w/out the updated items list. ### FUTURE -> address this.
									setTimeout(function(){
										_app.model.dispatchThis('immutable');
										},500);
									}});

								}
							else	{
								_app.u.dump("Chooser add to cart did not pass validation",'warn');
								$(this).button('enable'); //prevent doubleclick.
								}
							}
						else	{
							$('#productFinderContents').anymessage({"message":"In order_create.e.cartItemAddWithChooser, .chooserResultContainer had no length.","gMessage":true});
							$(this).button('enable');
							}
						});
					_app.ext.admin.a.showFinderInModal('CHOOSER','','',{'$buttons' : $button});
					});
				return false;
				},

//ele is likely a div or section. the element around all the inputs.
			addTriggerPayMethodUpdate : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					var $fieldset = $ele.closest('fieldset');
					$("input[type='radio']",$ele).each(function(){
						var $input = $(this);
						$input.off("change.addTriggerPayMethodUpdate").on("change.addTriggerPayMethodUpdate", function(){
							_app.ext.cco.calls.cartSet.init({'_cartid':$ele.closest("[data-app-role='checkout']").data('cartid'),'want/payby':$input.val()});
							_app.model.dispatchThis('immutable'); //any reason to obtain a new cart object here? don't think so.
							_app.ext.order_create.u.showSupplementalInputs($input);
							_app.ext.order_create.u.handlePanel($input.closest('form'),'chkoutCartSummary',['empty','translate','handleDisplayLogic']); //for toggling display of ref. # field.
							});
						});
					});
				return false;
				}, //addTriggerPayMethodUpdate
			
			shipOrPayMethodSelectExec : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					var obj = {};
					obj[$ele.attr('name')] = $ele.val();
					if($ele.data('updatemode') == 'cart')	{
						obj._cartid = $ele.closest("[data-template-role='cart']").data('cartid');
						}
					else	{}
					obj._cartid = $ele.closest("[data-app-role='checkout']").data('cartid');
					_app.ext.cco.calls.cartSet.init(obj);
	//destroys cart and updates big three panels (shipping, payment and summary)
					_app.ext.order_create.u.handleCommonPanels($ele.closest('form'));
					_app.model.dispatchThis("immutable");
					});
				return false;
				},
			

//triggered on specific address inputs. When an address is updated, several things could be impacted, including tax, shipping options and payment methods.
			execAddressUpdate : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					var obj = {};
					obj[$ele.attr('name')] = $ele.val();
					//if bill/ship are the same, duplicate data in both places OR shipping methods won't update.
					if($ele.closest('form').find("input[name='want/bill_to_ship']").is(':checked') && $ele.attr('name').indexOf('bill/') >= 0)	{
						obj[$ele.attr('name').replace('bill/','ship/')] = $ele.val();
						}
					obj._cartid = $ele.closest("[data-app-role='checkout']").data('cartid');
					_app.ext.cco.calls.cartSet.init(obj); //update the cart
					_app.ext.order_create.u.handleCommonPanels($ele.closest('form'));
					_app.model.dispatchThis('immutable');
					});
				return false
				}, //execAddressUpdate

//executed when an predefined address (from a buyer who is logged in) is selected.
			execBuyerAddressSelect : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					var
						addressType = $ele.closest('fieldset').data('app-addresstype'), //will be ship or bill.
						$form = $ele.closest('form'),
						addressID = $ele.closest('address').data('_id'),
						$checkout = $ele.closest("[data-app-role='checkout']");
						

	// For an incomplete address, the edit dialog will open automatically and prompt for invalid fields. The intent to select the address will also update the cart.
	// ### FUTURE -> this could be optimized. some vars declared at the top and lookups still occur later.
					if(addressType && addressID)	{
						$ele.closest('fieldset').find('.ui-button.ui-state-highlight').removeClass('ui-state-highlight');
						$ele.addClass('ui-state-highlight');
						//even if the address doesn't pass validation, set the shortcut to this id. checkout won't let them proceed, but this way their intent is still saved.
						//and after the update occurs, this address will be selected.
						$("[name='"+addressType+"/shortcut']",$form).val(addressID);
						var cartUpdate = {};
						cartUpdate[addressType+"/shortcut"] = addressID;
						cartUpdate._cartid = $ele.closest("[data-app-role='checkout']").data('cartid');
						
						var addrObj = _app.u.thisIsAnAdminSession() ? _app.ext.cco.u.getAndRegularizeAddrObjByID(_app.data['adminCustomerDetail|'+_app.data['cartDetail|'+$checkout.data('cartid')].customer.cid]['@'+addressType.toUpperCase()],addressID,addressType,true) : _app.ext.cco.u.getAddrObjByID(addressType,addressID); //will return address object.

						if(_app.ext.cco.u.verifyAddressIsComplete(addrObj,addressType))	{
							
							if(addressType == 'bill' && $ele.closest('form').find("input[name='want/bill_to_ship']").is(':checked'))	{
	//							_app.u.dump("Ship to billing address checked. set fields in billing.");
	//copy the address into the shipping fields so shipping rates update.
								if(!$.isEmptyObject(addrObj))	{
									for(var index in addrObj)	{
	//At the time this is being written, buyer calls return the address with bill/ and admin calls return bill_. convenient. 
										cartUpdate[index.replace('bill/','ship/')] = addrObj[index]; 
										}
									}
								}
	//there was a callback on this, but no clear reason why it was necessary. removed for now (will test prior to deleting this code)
	//						_app.ext.cco.calls.cartSet.init(cartUpdate,{'callback':function(){
	//							_app.ext.order_create.u.handlePanel($form,(addressType == 'bill') ? 'chkoutAddressBill' : 'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
	//							}}); //no need to populate address fields, shortcut handles that.
							_app.ext.cco.calls.cartSet.init(cartUpdate)
							_app.ext.order_create.u.handleCommonPanels($form);
							_app.model.dispatchThis('immutable');
							}
						else	{
							_app.ext.cco.calls.cartSet.init(cartUpdate,{},'passive');
							_app.model.dispatchThis('passive');
							$ele.closest('address').find("[data-app-role='addressEditButton']").data('validate-form',true).trigger('click');
							}
						}
					else	{
						$ele.closest('fieldset').anymessage({'message':'In order_create.e.execBuyerAddressSelect, either addressType ['+addressType+'] and/or addressID ['+addressID+'] not set. Both are required.','gMessage':true});
						}
					});
				return false;
				}, //execBuyerAddressSelect

//immediately update cart anytime the email address is added/changed. for remarketing purposes.
//no need to refresh the cartDetail here.

			execBuyerEmailUpdate : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					if(_app.u.isValidEmail($ele.val()))	{
						_app.ext.cco.calls.cartSet.init({'_cartid':$ele.closest("[data-app-role='checkout']").data('cartid'),'bill/email':$ele.val()},{},'immutable');
						_app.model.dispatchThis('immutable');
						}
					});
				return false;
				}, //execBuyerEmailUpdate

			execBuyerLogin : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					var $fieldset = $ele.closest('fieldset'),
					$email = $("[name='bill/email']",$fieldset),
					$password = $("[name='password']",$fieldset),
					$checkout = $ele.closest("[data-app-role='checkout']");

					if($email.val() && $password.val())	{
						$('body').showLoading({'message':'Verifying username and password...'});
						//we have want we need. attempt login.

						_app.model.destroy('buyerAddressList');
						_app.model.destroy('buyerWalletList');
						_app.model.destroy('cartDetail|'+$checkout.data('cartid'));

						_app.ext.cco.calls.cartSet.init({"bill/email":$email.val(),"_cartid":$checkout.data('cartid')}) //whether the login succeeds or not, set bill/email in the cart.
						_app.model.addDispatchToQ({"_cmd":"appBuyerLogin","login":$email.val(),"password":$password.val(),'method':'unsecure',"_tag":{"datapointer":"appBuyerLogin","callback":function(rd){
							$('body').hideLoading();
							if(_app.model.responseHasErrors(rd)){$fieldset.anymessage({'message':rd})}
							else	{
								_app.u.dump(" -> no errors. user is logged in.");
								$('body').addClass('buyerLoggedIn'); //allows for css changes based on auth.
								var $form = $fieldset.closest('form'),
								$fieldsets = $('fieldset',$form);
	//set all panels to loading.
								$fieldsets.each(function(){
									_app.ext.order_create.u.handlePanel($form,$(this).data('app-role'),['showLoading']);
									});

	//can't piggyback these on login because they'll error at the API side (and will kill the login request)

								_app.calls.buyerAddressList.init({'callback':function(){
	//no error handling needed. if call fails or returns zero addesses, the panels still need to be rendered.
	//re-render all panels. each could be affected by a login (either just on the display side or new/updated info for discounts, addresses, giftcards, etc)
									$fieldsets.each(function(){
										_app.ext.order_create.u.handlePanel($form,$(this).data('app-role'),['empty','translate','handleDisplayLogic']);
										});
									}},'immutable');

								_app.model.addDispatchToQ({'_cmd':'buyerWalletList','_tag':	{'datapointer' : 'buyerWalletList','callback':''}},'immutable');
								_app.model.dispatchThis('immutable');
								$fieldset.anymessage({'message':'Thank you, you are now logged in.','_msg_0_type':'success'});
								}						
							}}},"immutable");
						_app.calls.cartDetail.init($checkout.data('cartid'),{},'immutable'); //update cart so that if successful, the refresh on preflight panel has updated info.
						_app.model.dispatchThis('immutable');
						}
					else {
					$fieldset.anymessage({'message':'Please fill out the fields indicated below:'});
						if(!_app.u.isValidEmail($email.val()))	{
							//email is blank or invalid
							$email.addClass('ui-state-error');
							}
						if(!$password.val())	{
							$password.addClass('ui-state-error');
							}
						}
					});
				return false;
				}, //execBuyerLogin

			cartOrderSave : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					var $form = $ele.closest('form');
					_app.ext.cco.u.sanitizeAndUpdateCart($form,{
						callback : 'showMessaging',
						message : 'Your changes have been saved',
						jqObj : $form,
						restoreInputsFromTrackingState : true
						});
					_app.model.dispatchThis('immutable');
					});
				return false;
				},

			execCartOrderCreate : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					var $form = $ele.closest('form');
					
	//if paypalEC is selected, skip validation and go straight to paypal. Upon return, bill and ship will get populated automatically.
					if($("input[name='want/payby']:checked",$form).val() == 'PAYPALEC' && !_app.ext.cco.u.thisSessionIsPayPal())	{
						$('body').showLoading({'message':'Transferring you to PayPal payment authorization'});
	//***201402 Must pass cartid parameter on the call itself -mc
						var cartid = $ele.closest("[data-app-role='checkout']").data('cartid');
						_app.ext.cco.calls.cartPaypalSetExpressCheckout.init({
							'getBuyerAddress': (_app.u.buyerIsAuthenticated()) ? 0 : 1, 
							'_cartid':cartid,
							'useMobile':($(document.body).width() < 500 ? 1 : 0)
							},{'callback':function(rd){
							if(_app.model.responseHasErrors(rd)){
								$('body').hideLoading();
								$('html, body').animate({scrollTop : $fieldset.offset().top},1000); //scroll to first instance of error.
								$fieldset.anymessage({'message':rd});
								}
							else	{
								window.location = _app.data[rd.datapointer].URL+'&useraction=commit'; //commit returns user to website for order confirmation. otherwise they stay on paypal.
								}
							},"extension":"order_create",'parentID': $ele.closest("[data-app-role='checkout']").attr('id')},'immutable');
						_app.model.dispatchThis('immutable');
						}
					else	{
						if(_app.ext.order_create.validate.checkout($form))	{
							var $checkout = $form.closest("[data-app-role='checkout']");
							$checkout.slideUp('fast',function(){
								//$('body').showLoading({'message':'Creating order...'});
								});
							_app.ext.cco.u.sanitizeAndUpdateCart($form);
							var cartid = $ele.closest("[data-app-role='checkout']").data('cartid'), payments;
	//paypal payments are added to the q as soon as the user returns from paypal.
	//This will solve the double-add to the payment Q
	//payment method validation ensures a valid tender is present.
							if(_app.ext.cco.u.thisSessionIsPayPal())	{}
							else	{
								payments = _app.ext.cco.u.getPaymentQArray($form,cartid);
								}
	//						_app.ext.cco.calls.cartOrderCreate.init(cartid,{'callback':'cart2OrderIsComplete','extension':'order_create','jqObj':$form});
							_app.model.addDispatchToQ({
								'_cartid':cartid,
								'_cmd':'cartOrderCreate',
								'@PAYMENTS' : payments,
								'async' : 1,
								'_tag':{'datapointer':'cartOrderCreate|'+cartid,'callback':'cartOrderStatus','extension':'order_create','parentID':$checkout.attr('id')},
								'iama':_app.vars.passInDispatchV, 
								'domain' : (_app.vars.thisSessionIsAdmin ? 'www.'+_app.vars.domain : '')
								},'immutable');
							_app.model.dispatchThis('immutable');						
							
							}
						else	{
							//even though validation failed, take this opportunity to update the cart on the server.
							_app.ext.cco.u.sanitizeAndUpdateCart($form);
							_app.model.dispatchThis('immutable');
							//scrolls up to first instance of an error.
							$('html, body').animate({scrollTop : $('.formValidationError, .ui-widget-anymessage, .ui-state-error',$form).first().offset().top},1000); //scroll to first instance of error.
							}
						}
					});
				return false;
				}, //execCartOrderCreate

//update the cart. no callbacks or anything like that, just get the data to the api.
//used on notes and could be recyled if needed.
			execCartSet : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					var obj = {};
					obj[$ele.attr('name')] = $ele.val();
					obj._cartid = $ele.closest("[data-app-role='checkout']").data('cartid');
					_app.ext.cco.calls.cartSet.init(obj);
					_app.model.dispatchThis('immutable');
					});
				return false;
				}, //execCartSet

			execChangeFromPayPal : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					_app.ext.cco.u.nukePayPalEC();
					var $form = $ele.closest('form');
					_app.ext.order_create.u.handleCommonPanels($form);
					_app.calls.ping.init({callback:function(){
						_app.ext.order_create.u.handlePanel($form,'chkoutAddressBill',['empty','translate','handleDisplayLogic']);
						_app.ext.order_create.u.handlePanel($form,'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
						}},'immutable');
					_app.model.dispatchThis('immutable');
					});
				return false;
				},

			execCountryUpdate : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					//recalculate the shipping methods and payment options.
					var obj = {}, $form = $ele.closest('form');
	//temporary workaround. setting bill country to int isn't updating ship methods correctly.
	//if bill to ship is enabled, must update ship country or shipping won't update.
					if($ele.attr('name') == 'bill/countrycode' && $("[name='want/bill_to_ship']",$form).is(':checked'))	{
						obj['ship/countrycode'] = $ele.val();
						}
					
					obj[$ele.attr('name')] = $ele.val();
					obj._cartid = $ele.closest("[data-app-role='checkout']").data('cartid');
					_app.ext.cco.calls.cartSet.init(obj); //update the cart w/ the country.
					_app.ext.order_create.u.handleCommonPanels($form);
					_app.model.dispatchThis('immutable');
					});
				return false;
				}, //execCountryUpdate

			execCouponAdd : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					var $fieldset = $ele.closest('fieldset'),
					$form = $ele.closest('form'),
					cartid = $ele.closest("[data-app-role='checkout']").data('cartid'),
					$input = $("[name='coupon']",$fieldset);
					
					if($ele.is('button')){$ele.button('disable');}

	//update the panel only on a successful add. That way, error messaging is persistent. success messaging gets nuked, but coupon will show in cart so that's okay.
					_app.ext.cco.calls.cartCouponAdd.init($input.val(),cartid,{"callback":function(rd){
						if(_app.model.responseHasErrors(rd)){
							$fieldset.anymessage({'message':rd});
							}
						else	{
							// !!! THIS IS A HACK AND SHOULD BE FIXED !!!
							//Has to run asynchronously because the cartDetail call is sent in handleCommonPanels- There won't be a cart in the data until after
							//that has a chance to run.  Since it's in the same pipeline, this has to delay.
							setTimeout(function(){
								$input.val(''); //reset input only on success.  allows for a typo to be corrected.
								$fieldset.anymessage(_app.u.successMsgObject('Your coupon has been added.'));
								_app.ext.order_create.u.handlePanel($form,'chkoutCartItemsList',['empty','translate','handleDisplayLogic']);
		//if a cart messenger is open, log the cart update.
								if(cartid && _app.u.thisNestedExists('ext.cart_message.vars.carts.'+cartid,_app))	{
									_app.model.addDispatchToQ({'_cmd':'cartMessagePush','what':'cart.update','description':'Coupon added','_cartid':cartid},'passive');
									_app.model.dispatchThis('passive');
									}
								window[_app.vars.analyticsPointer]('send', 'event','Checkout','User Event','Cart updated - coupon added');
								}, 0);
							}
						}});
					
					_app.ext.order_create.u.handleCommonPanels($form);
					_app.model.dispatchThis('immutable');
					});
				return false;
				}, //execCouponAdd

//executed on a giftcard when it is in the list of payment methods.
			addGiftcardPaymethodAsPayment : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					if($ele.attr('data-giftcard-id'))	{
						$ele.button('disable');
						var $checkout = $ele.closest("[data-app-role='checkout']");
						_app.ext.cco.calls.cartGiftcardAdd.init($ele.attr('data-giftcard-id'),$checkout.data('cartid'),{'jqObj':$checkout},'immutable'); //jqObj passed for error handling. callback handled by cart update.
						_app.model.destroy('cartDetail|'+$checkout.data('cartid'));
						_app.calls.cartDetail.init($checkout.data('cartid'),{'callback':'updateAllPanels','extension':'order_create','jqObj':$checkout},'immutable');
						_app.model.dispatchThis('immutable');
						}
					else	{
						$("#globalMessaging").anymessage({"message":"In order_create.e.addGiftcardPaymethodAsPayment, data-giftcard-id is not set on trigger element.","gMessage":true});
						}
					});
				return false;
				},

			execGiftcardAdd : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					var $fieldset = $ele.closest('fieldset'),
					cartid = $ele.closest("[data-app-role='checkout']").data('cartid'),
					$input = $("[name='giftcard']",$fieldset);
					
					if($ele.is('button')){$ele.button('disable');}
	//update the panel only on a successful add. That way, error messaging is persistent. success messaging gets nuked, but coupon will show in cart so that's okay.
					_app.ext.cco.calls.cartGiftcardAdd.init($input.val(),cartid,{"callback":function(rd){
						if(_app.model.responseHasErrors(rd)){
							$fieldset.anymessage({'message':rd});
							}
						else	{
							$input.val(''); //reset input
							$fieldset.anymessage(_app.u.successMsgObject('Your giftcard has been added.'));
	//if a cart messenger is open, log the cart update.
							if(cartid && _app.u.thisNestedExists('ext.cart_message.vars.carts.'+cartid,_app))	{
								_app.model.addDispatchToQ({'_cmd':'cartMessagePush','what':'cart.update','description':'Giftcard added','_cartid':cartid},'passive');
								_app.model.dispatchThis('passive');
								}
							window[_app.vars.analyticsPointer]('send','event','Checkout','User Event','Cart updated - giftcard added');
							}
						}});
					_app.ext.order_create.u.handleCommonPanels($input.closest('form'));
					_app.model.dispatchThis('immutable');
					});
				return false;
				}, //execGiftcardAdd

			execInvoicePrint : function($ele,p)	{
				p.preventDefault();
				_app.u.printByjqObj($ele.closest("[data-app-role='invoiceContainer']"));
				return false;
				}, //execInvoicePrint

			showBuyerAddressAdd : function($ele,p)	{
				p.preventDefault();
				_app.require(['cco','store_crm','order_create'], function(){
					var
						$checkoutForm = $ele.closest('form'), //used in some callbacks later.
						$checkoutAddrFieldset = $ele.closest('fieldset'),
						addressType = $ele.attr('data-app-addresstype').toLowerCase();
					if(_app.u.thisIsAnAdminSession())	{
						var $D = _app.ext.admin_customer.a.createUpdateAddressShow({'mode':'create','show':'dialog','type':addressType});
						}
					else	{
						_app.ext.store_crm.u.showAddressAddModal({'addressType':addressType},function(rd,serializedForm){
	//by here, the new address has been created.
	//set appropriate address panel to loading.
							_app.ext.order_create.u.handlePanel($checkoutForm,$checkoutAddrFieldset.data('app-role'),['showLoading']);
	//update cart and set shortcut as address.
							var updateObj = {'_cartid':$ele.closest("[data-app-role='checkout']").data('cartid')}
							updateObj[addressType+'/shortcut'] = serializedForm.shortcut;
							_app.ext.cco.calls.cartSet.init(updateObj,{},'immutable');
		
	//update DOM/input for shortcut w/ new shortcut value.
							$("[name='"+addressType+"/shortcut']",$checkoutForm);
		
	//get the updated address list and update the address panel.
							_app.model.destroy('buyerAddressList');
							_app.calls.buyerAddressList.init({'callback':function(rd){
								_app.ext.order_create.u.handlePanel($checkoutForm,$checkoutAddrFieldset.data('app-role'),['empty','translate','handleDisplayLogic']);
								}},'immutable');
		
	//update appropriate address panel plus big three.
							_app.ext.order_create.u.handleCommonPanels($checkoutForm);
							_app.model.dispatchThis('immutable');
							});
						}
					});
				return false;
				}, //showBuyerAddressAdd

			showBuyerAddressUpdate : function($ele,p)	{
				p.preventDefault();
				_app.require(['store_crm','cco'],function(){
					p = p || {};
					var $checkoutForm = $ele.closest('form'), //used in some callbacks later.
					$checkoutAddrFieldset = $ele.closest('fieldset');

					var addressType = $ele.closest("[data-app-addresstype]").data('app-addresstype');
					dump(" ---------> addressType: "+addressType);
					_app.ext.store_crm.u.showAddressEditModal({
						'addressID' : $ele.closest("address").data('_id'),
						'addressType' : addressType,
						'validateForm' : $ele.data('validate-form')
						},function(){
	//by here, the new address has been edited.
	//set appropriate address panel to loading.
	//editing and address does NOT auto-select it.
						_app.ext.order_create.u.handlePanel($checkoutForm,$checkoutAddrFieldset.data('app-role'),['showLoading']);

	//get the updated address list and update the address panel.
						_app.model.destroy('buyerAddressList');
						_app.calls.buyerAddressList.init({'callback':function(rd){
							_app.ext.order_create.u.handlePanel($checkoutForm,$checkoutAddrFieldset.data('app-role'),['empty','translate','handleDisplayLogic']);
							}},'immutable');

						_app.model.dispatchThis('immutable');
						});
					});
				return false;
				}, //showBuyerAddressUpdate

			tagAsAccountCreate : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					var $checkout = $ele.closest("[data-app-role='checkout']");
					_app.ext.cco.calls.cartSet.init({'_cartid':$checkout.data('cartid'),'want/create_customer': $ele.is(':checked') ? 1 : 0}); //val of a cb is on or off, but we want 1 or 0.
					_app.model.destroy('cartDetail|'+$checkout.data('cartid'));
					_app.ext.order_create.u.handlePanel($ele.closest('form'),'chkoutPreflight',['handleDisplayLogic']);
					_app.calls.cartDetail.init($checkout.data('cartid'),{'callback':function(rd){
						_app.ext.order_create.u.handlePanel($ele.closest('form'),'chkoutAccountCreate',['handleDisplayLogic']);
						}},'immutable');
					_app.model.dispatchThis('immutable');
					});
				return false;
				}, //tagAsAccountCreate

			tagAsBillToShip : function($ele,p)	{
				p.preventDefault();
				_app.require('cco',function(){
					var $form = $ele.closest('form');
					_app.ext.cco.calls.cartSet.init({'want/bill_to_ship':($ele.is(':checked')) ? 1 : 0,_cartid : $ele.closest("[data-app-role='checkout']").data('cartid')},{},'immutable'); //adds dispatches.
	//when toggling back to ship to bill, update shipping zip BLANK to re-compute shipping.
	// re-render the panel as well so that if bill to ship is unchecked, the zip has to be re-entered. makes sure ship quotes are up to date.
	// originally, had ship zip change to bill instead of blank, but seemed like there'd be potential for a buyer to miss that change.
					if($ele.is(':checked'))	{
	// -> Sanitize is here to address bug where if ship to bill is disabled, shipping is populated, then ship to bill is re-enabled, bill address is not used for shipping quotes (entered ship address is)
	// all panels get updated because shipping, totals and potentially payment methods can be impacted by ship country.
						_app.ext.cco.u.sanitizeAndUpdateCart($form,{
							'callback':'updateAllPanels',
							'extension' : 'order_create',
							'jqObj' : $form
							});
						}
					else	{
						_app.ext.order_create.u.handlePanel($form,'chkoutAddressShip',['handleDisplayLogic']);
						}
					_app.ext.order_create.u.handleCommonPanels($form);
					_app.model.dispatchThis('immutable');
					});
				return false;
				} //tagAsBillToShip
			},


////////////////////////////////////   						util [u]			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
			
//Combines the various data objects into one, so that they can be fed into the translator and rendered in one pass.
			extendedDataForCheckout : function(cartID)	{
//				_app.u.dump("BEGIN order_create.u.extendedDataForCheckout - 2013-04-13");
//				_app.u.dump("_app.data.cartDetail:"); _app.u.dump(_app.data.cartDetail);
				var obj = {};
				if(cartID)	{
					if(_app.u.thisIsAnAdminSession())	{
						//can skip all the paypal code in an admin session. it isn't a valid payment option.
						if(_app.u.thisNestedExists("data.cartDetail|"+cartID+".customer.cid",_app) && _app.data['adminCustomerDetail|'+_app.data['cartDetail|'+cartID].customer.cid])	{
							//change this so object stores the data how buyerAddressList and buyerWalletList would.
							obj = $.extend(true,obj,_app.data['adminCustomerDetail|'+_app.data['cartDetail|'+cartID].customer.cid]); //have to copy the detail record or it gets updated in memory.
							}
						$.extend(obj,_app.data['appPaymentMethods|'+cartID],_app.data['appCheckoutDestinations|'+cartID],_app.data['cartDetail|'+cartID]);
						}
					else	{
						if(_app.u.buyerIsAuthenticated())	{
		//					_app.u.dump(" -> buyer is authenticated");
							$.extend(true,obj,_app.data['appPaymentMethods|'+cartID],_app.data['appCheckoutDestinations|'+cartID],_app.data.buyerAddressList,_app.data.buyerWalletList,_app.data['cartDetail|'+cartID]);
							}
						else	{
		//					_app.u.dump(" -> buyer is not authenticated.");
							$.extend(true,obj,_app.data['appPaymentMethods|'+cartID],_app.data['appCheckoutDestinations|'+cartID],_app.data['cartDetail|'+cartID]);
							}

//when a buyer returns from paypal, the shipping is populated, but the billing is not always.
//this will put the ship info into the bill fields if they're blank.
						if(_app.ext.cco.u.thisSessionIsPayPal())	{
		//					_app.u.dump(" -> session is paypal. copy some data around.");
							if(obj.bill && obj.ship)	{
								if(!obj.bill.company)	{obj.bill.company = obj.ship.company}
								if(!obj.bill.address1)	{obj.bill.address1 = obj.ship.address1}
								if(!obj.bill.address2)	{obj.bill.address2 = obj.ship.address2}
								if(!obj.bill.city)	{obj.bill.city = obj.ship.city}
								if(!obj.bill.region)	{obj.bill.region = obj.ship.region}
								if(!obj.bill.postal)	{obj.bill.postal = obj.ship.postal}
								if(!obj.bill.countrycode)	{obj.bill.countrycode = obj.ship.countrycode}
								}
							}
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In order_create.u.extendedDataForCheckout, no cart id passed.","gMessage":true});
					}
//				_app.u.dump("END order_create.u.extendedDataForCheckout");
				return obj;
				}, //extendedDataForCheckout

//will turn the placeholder into a label for browsers that don't support it.
			handlePlaceholder : function($fieldset)	{
				if(!$.support.placeholder) {
					$('input',$fieldset).each(function(){
						var $input = $(this);
//placeholderIntoLabel is added once this action is performed. Keeps labels from being double added if this is run more than once.
						if($input.attr('placeholder') && !$input.data('placeholderIntoLabel'))	{
							$input.wrap($("<label>"));
							$input.before("<span class='marginRight labelText'>"+$input.attr('placeholder')+":<\/span>");
							$input.data('placeholderIntoLabel',true);
							}
						});
					}
				}, //handlePlaceholder
			
//$content could be the parent form or the forms container. just something around this checkout. (so that multiple checkout forms are possible. imp in UI
//role is the value of data-app-role on the fieldset.
//actions is what needs to happen. an array.  accepted values are empty, showLoading, translate and handleDisplayLogic. ex: ['translate','handleDisplayLogic']
//actions are rendered in the order they're passed.

			handlePanel : function($context, role, actions)	{
//				_app.u.dump("BEGIN handlePanel ["+role+"]."); //_app.u.dump(actions);

				if($context instanceof jQuery && role && actions && typeof actions === 'object')	{
//					_app.u.dump(" -> role: "+role);

					var L = actions.length,
					formObj = $context.is('form') ? $context.serializeJSON() : $("form",$context).serializeJSON(),
					cartID = $context.closest("[data-app-role='checkout']").data('cartid'),
					$fieldset = $("[data-app-role='"+_app.u.jqSelector('',role)+"']",$context),
					ao = {};

					ao.showLoading = function (formObj, $fieldset){$(".panelContent",$fieldset).showLoading({'message':'Fetching updated content'})},
					ao.hideLoading = function (formObj, $fieldset){$(".panelContent",$fieldset).hideLoading()},
					ao.empty = function(formObj, $fieldset){$(".panelContent",$fieldset).empty()},
					ao.handleDisplayLogic = function(formObj, $fieldset){
						if(typeof _app.ext.order_create.panelDisplayLogic[role] === 'function')	{
							_app.ext.order_create.panelDisplayLogic[role](formObj,$fieldset,_app.data['cartDetail|'+cartID]);
							}
						else	{
							$fieldset.anymessage({'message':'In order_create.u.handlePanel, panelDisplayLogic['+role+'] not a function','gMessage':true});
							}
						}, //perform things like locking form fields, hiding/showing the panel based on some setting. never pass in the setting, have it read from the form or cart.
					ao.translate = function(formObj, $fieldset)	{
						$fieldset.tlc({'verb' : 'translate','dataset' : _app.ext.order_create.u.extendedDataForCheckout(cartID)});
						} //populates the template.
					
					for(var i = 0; i < L; i += 1)	{
						if(typeof ao[actions[i]] === 'function'){
							ao[actions[i]](formObj, $fieldset);
							}
						else	{
							$('#globalMessaging').anymessage({'message':"In order_create.u.handlePanel, undefined action ["+actions[i]+"]",'gMessage':true});
							}
						_app.u.handleButtons($fieldset);
						$('.applyAnycb',$fieldset).each(function(){
							$(this).anycb({text : {on : 'yes',off : 'no'}});
							});
						}
					
					}
				else	{
					$('#globalMessaging').anymessage({'message':"In order_create.u.handlePanel, either $context ["+typeof $context+"], role ["+role+"] or actions ["+actions+"] not defined or not an object ["+typeof actions+"]",'gMessage':true});
					}
				}, //handlePanel

//this code was executed often enough to justify putting it into a function for recycling.
//sets payment options, shipping options and cart summary to loading, then adds immutable dispatches/callbacks/etc for updating.
//does NOT dispatch. That way, other requests can be piggy-backed.
			handleCommonPanels : function($context)	{
				var cartid = $context.closest("[data-app-role='checkout']").data('cartid');
//				_app.u.dump(" -> handleCommonPanels cartID: "+cartid);
				if(cartid)	{
					_app.ext.order_create.u.handlePanel($context,'chkoutMethodsShip',['showLoading']);
					_app.ext.order_create.u.handlePanel($context,'chkoutMethodsPay',['showLoading']);
					_app.ext.order_create.u.handlePanel($context,'chkoutCartSummary',['showLoading']);

						if(_app.u.thisIsAnAdminSession())	{
							_app.ext.order_create.u.handlePanel($context,'chkoutCartItemsList',['showLoading']);
							}

					_app.model.destroy('cartDetail|'+cartid);
					//update pay and ship anytime either address changes.
					_app.model.addDispatchToQ({
						'_cmd' : 'appPaymentMethods',
						'_cartid' : cartid,
						'_tag' : {'datapointer':'appPaymentMethods|'+cartid}
						},'immutable');
					_app.calls.cartDetail.init(cartid,{'callback':function(){
	//					_app.u.dump('cartDetail: '); _app.u.dump(_app.data.cartDetail);
						_app.ext.order_create.u.handlePanel($context,'chkoutMethodsShip',['empty','translate','handleDisplayLogic']);
						_app.ext.order_create.u.handlePanel($context,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
						_app.ext.order_create.u.handlePanel($context,'chkoutCartSummary',['empty','translate','handleDisplayLogic']);
						//in an admin session, the cart contents are updated much more frequently because the 'cart' is editable.
						//if a storefront offers an editable cart within checkout, then remove the if around the chkoutCartItemsList update.
						if(_app.u.thisIsAnAdminSession())	{
							_app.ext.order_create.u.handlePanel($context,'chkoutCartItemsList',['empty','translate','handleDisplayLogic']);
							}
						}},'immutable');
					}
				else	{
					$context.anymessage({'message':'In order_create.u.handleCommonPanels, unable to ascertain cartid [closest(data-app-role="checkout").length: '+$context.closest("[data-app-role='checkout']").length+'] ','gMessage':true})
					}
				}, //handleCommonPanels



			handlePaypalInit : function($context, cartID)	{
//				_app.u.dump("BEGIN order_create.u.handlePaypalInit");
//paypal code need to be in this startCheckout and not showCheckoutForm so that showCheckoutForm can be 
// executed w/out triggering the paypal code (which happens when payment method switches FROM paypal to some other method) because
// the paypalgetdetails cmd only needs to be executed once per session UNLESS the cart contents change.
//calls are piggybacked w/ this. do not add dispatch here.
				_app.require('cco',function(){
					var token = _app.u.getParameterByName('token');
					var payerid = _app.u.getParameterByName('PayerID');
	//				_app.u.dump(" -> aValidPaypalTenderIsPresent(): "+_app.ext.cco.u.aValidPaypalTenderIsPresent());
					if(token && payerid)	{
						_app.u.dump(" -> both token and payerid are set.");
						if(_app.ext.cco.u.aValidPaypalTenderIsPresent())	{
							_app.u.dump(" -> token and payid are set but a valid paypal tender is already present.");
							} //already have paypal in paymentQ. could be user refreshed page. don't double-add to Q.
						else	{
							$context.anymessage({'message':'Welcome Back! you are almost done. Simply verify the information below and push the place order button to complete your transaction.','iconClass':'ui-icon-check','containerClass':'ui-state-highlight ui-state-success'});
							_app.u.dump("It appears we've just returned from PayPal.");
							_app.ext.order_create.vars['payment-pt'] = token;
							_app.ext.order_create.vars['payment-pi'] = payerid;
							_app.ext.cco.calls.cartPaymentQ.init({"cmd":"insert","PT":token,"ID":token,"PI":payerid,"TN":"PAYPALEC",'_cartid':cartID},{"extension":"order_create","callback":"handlePayPalIntoPaymentQ", "require":["cco"],'jqObj':$context});
							}
						}
	//if token and/or payerid is NOT set on URI, then this is either not yet a paypal order OR is/was paypal and user left checkout and has returned.
					else if(_app.ext.cco.u.thisSessionIsPayPal())	{
						_app.u.dump(" -> no token or payerid set. nuke all paypal if present.");
						if(!_app.ext.cco.u.aValidPaypalTenderIsPresent())	{
							_app.u.dump(" -> validPayalTender found. Nuke it.");
							_app.ext.cco.u.nukePayPalEC();
							//update the panels too so that the ship/billing is 'unlocked' and payments get updated.
							_app.ext.order_create.u.handleCommonPanels($form);
							_app.calls.ping.init({callback:function(){
								_app.ext.order_create.u.handlePanel($form,'chkoutAddressBill',['empty','translate','handleDisplayLogic']);
								_app.ext.order_create.u.handlePanel($form,'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
								}},'immutable');
							_app.model.dispatchThis('immutable');
							}
						_app.u.dump(" -> paypal nuked ");
						}
					else	{
						//do nothing.
						}
	//				_app.u.dump("END order_create.u.handlePaypalInit");
					});
				}, //handlePaypalInit

//run when a payment method is selected or when payment panel is re-rendered.
//Does nothing but handle display.  NO UPDATES. those occur in the app-event on the radio button (which triggers this).
//they don't happen here because this code is executed when the panel is transmogrified.
			showSupplementalInputs : function($input)	{
				if($input && typeof $input === 'object')	{
					var
						$label = $input.closest('label'),
						$fieldset = $input.closest('fieldset'),
						$pmc = $input.closest("[data-app-role='paymentMethodContainer']"), //payment method container. an li or div or row. who knows.
						cartID = $input.closest("[data-app-role='checkout']").data('cartid');
	
	//handle the previously selected payment method.
					$('.ui-state-active',$fieldset).removeClass('ui-state-active ui-corner-top ui-corner-all');
					$("[data-app-role='supplementalPaymentInputsContainer']",$fieldset).empty().remove(); //must be removed so form inputs are not present.
					
					var $supplementalOutput = _app.ext.cco.u.getSupplementalPaymentInputs($input.val(),_app.ext.order_create.vars[cartID].payment);
					if($supplementalOutput)	{
						$label.addClass("ui-state-active ui-corner-top");
						$supplementalOutput.addClass('ui-corner-bottom ui-widget ui-widget-content').appendTo($pmc);
						}
					else	{
						$label.addClass("ui-state-active ui-corner-all");
						}
					_app.ext.order_create.u.handlePlaceholder($pmc);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In cco.u.showSupplementalInputs, $input not defined or not a jquery object.','gMessage':true});
					}

				}, //showSupplementalInputs
			
		
// *** 201338 -> new means for executing ROI tracking codes.
			//pass in what is returned after order create in @TRACKERS
			scripts2iframe : function(arr)	{
				_app.u.dump('running scripts2iframe');
				if(typeof window.scriptCallback == 'function')	{}
				else	{
					window.scriptCallback = _app.ext.order_create.u.scriptCallback; //assigned global scope to reduce likely hood of any errors resulting in callback.
					_app.u.dump(" -> typeof window.scriptCallback: "+typeof window.scriptCallback);
					}
				if(typeof arr == 'object' && !$.isEmptyObject(arr))	{

/*
the timeout is added for multiple reasons.
1.  jquery needed a moment between adding the iframe to the DOM and accessing it's contents.
2.  by adding some time between each interation (100 * 1), if there's an exception in the tracker, the next code will still run.
*/
						for(var i = 0,  L = arr.length; i < L; i++)	{
							setTimeout(function(thisArr){
								try	{
									$(document.body).append(thisArr.script);
									}
								catch(e)	{
									window.scriptCallback(thisArr.owner,e);
									}
								},(200 * (i + 1)),arr[i]);
							}
						setTimeout(_app.ext.store_swc.u.applyGTS,200*(arr.length+1));
/*
left here in case we want to come back to this. It'll work IF each tracker can run in an isolated environment.
unfortunately, too many of the tracker codes rely on scripts being loaded onLoad in the parent window and are not functioning
 properly when isolated in an iframe.
	var L = arr.length;
	for(var i = 0; i < L; i++)	{
adding to iframe gives us an isolation layer
data-script-id added so the iframe can be removed easily later.
		arr[i].id = 'iframe_3ps_'+i
		$("<iframe \/>",{'id':arr[i].id}).attr({'data-script-id':arr[i].owner,'height':1,'width':1}).css({'display':'none'}).appendTo('body'); // -> commented out for testing !!!
the timeout is added for multiple reasons.
1.  jquery needed a moment between adding the iframe to the DOM and accessing it's contents.
2.  by adding some time between each interation (100 * 1), if there's a catastrophic error, the next code will still run.
 		setTimeout(function(thisArr){
			var $iframe = $('#'+thisArr.id).contents().find("html");
			$iframe.append(thisArr.script);
// hhhmmm... some potential problems with this. non-script based output. sequence needs to be preserved for includes and inline.

			var $div = $("<div \/>").append(thisArr.script); //may contain multiple scripts.
			var scripts = ""; //all the non 'src' based script contents, in one giant lump. it's put into a 'try' to track code errors.
			$div.find('script').each(function(){
				var $s = $(this);
				if($s.attr('src'))	{
					console.log(" -> attempting to add "+$s.attr('src'));
					$iframe.append($s);
					}
				else	{
					scripts += $s.text()+"\n\n";
					}
				});
			$iframe.append("<script>try{"+scripts+"\n window.parent.scriptCallback('"+arr.owner+"','success');} catch(err){window.parent.scriptCallback('"+arr.owner+"','error: '+err);}<\/script>");
			},(100 * (i + 1)),arr[i])
		} 
*/					}
				else	{
					//didn't get anything or what we got wasn't an array.
					}
				},

//is executed if one of the ROI scripts contains a javascript error (fails in the 'try').
			scriptCallback : function(owner,err)	{
_app.u.dump("The script for "+owner+" Contained an error and most likely did not execute properly. (it failed the 'try').","warn");
_app.model.addDispatchToQ({
	'_cmd':'appAccidentDataRecorder',
	'owner' : owner,
	'app' : '1pc', //if the API call logs the clientid, this won't be necessary.
	'category' : '@TRACKERS',
	'scripterr' : err,
	'_tag':	{
		'callback':'suppressErrors'
		}
	},'passive');
_app.model.dispatchThis('passive');
				},
			
			buildPaymentOptionsAsRadios : function(pMethods,payby)	{
				var
					$r = $("<p>"), //the children of R are returned (the P is not).
					L = pMethods.length;

//ZERO will be in the list of payment options if customer has a zero due (giftcard or paypal) order.
					if(pMethods[0].id == 'ZERO')	{
						$r.hide(); //hide payment options.
						$r.append("<div ><input type='radio' name='want/payby' value='ZERO' checked='checked' \/>"+pMethods[0].pretty+"<\/div>");
						}
					else if(L > 0)	{
						for(var i = 0; i < L; i += 1)	{
							var $div = $("<div class='headerPadding' data-app-role='paymentMethodContainer'>");
							var $label = $("<label \/>");
							if(pMethods[i].id.indexOf("GIFTCARD") === 0)	{
								//onClick event is added through an app-event. allows for app-specific events.
								$("<button>Add</button>")
									.attr({'title':'Apply this giftcard towards this purchase','data-giftcard-id':pMethods[i].id.split(':')[1]})
									.button({icons: {primary: "ui-icon-cart"},text: true})
									.addClass('isGiftcard')
									.appendTo($label);
								$label.append(pMethods[i].pretty).appendTo($div);
								}
							else if(!_app.vars.thisSessionIsAdmin && pMethods[i].id.indexOf("WALLET") === 0)	{
								//wallets are in the 'stored payments' section already. If they're shown here too, the input name/value will be duplicated. This duplication causes usability issues.
								}
							else	{
								//onClick event is added through an app-event. allows for app-specific events.
								// ** 201405 -> the 'checked=checked' needs to occur here for IE8.
								$label.append("<input type='radio' name='want/payby' value='"+pMethods[i].id+"' "+(pMethods[i].id == payby ? "checked='checked'" : "")+" />");
								$label.append((pMethods[i].id == 'CREDIT' ? 'Credit Card' : pMethods[i].pretty));
								if(pMethods[i].icons)	{
									$.each(pMethods[i].icons.split(' '),function(){
										$("<span \/>").addClass('paycon '+this).appendTo($label);
										});
									}
								$label.appendTo($div); //keep cc text short. use icons
								}
							$div.appendTo($r);
							}
						}
					else	{
						_app.u.dump("No payment methods are available. This happens if the session is non-secure and CC is the only payment option. Other circumstances could likely cause this to happen too.",'warn');
						
						$r.append("<p>It appears no payment options are currently available.<\/p>");
						if(document.location.protocol != "https:")	{
							$r.append("This session is <b>not secure</b>, so credit card payment is not available.");
							}
						}
					if(payby)	{
						$("input[value='"+payby+"']",$r).closest('label').addClass('selected ui-state-active')
						}	
				return $r.children();
				}


			}, // u/utilities




////////////////////////////////////   						renderFormats			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



		renderFormats : {
//pass the cart(cart/cartid); in for the databind var. Multiple pieces of data are required for this render format (want/shipping_id and @SHIPMETHODS).
			shipmethodsasradiobuttons : function($tag,data)	{
				var o = '',sMethods,L;
				sMethods = data.value['@SHIPMETHODS'];
				if(sMethods && sMethods.length)	{
					L = sMethods.length;
					for(var i = 0; i < L; i += 1)	{
						o += "<li class='headerPadding'><label><input type='radio'  name='want/shipping_id' value='"+sMethods[i].id+"' ";
						o += "/>"+(sMethods[i].pretty ? sMethods[i].pretty : sMethods[i].name)+": <span >"+_app.u.formatMoney(sMethods[i].amount,'$','',false)+"<\/span><\/label><\/li>";
						}
					}
				else	{
					//Currently, checkout handles this on it's own. if something is added here, test checkout to make sure warnings are not appearing twice.
					}
				$tag.html(o);
				if(data.value.want && data.value.want.shipping_id)	{
					$("input[value='"+data.value.want.shipping_id+"']",$tag).prop('checked','checked').closest('li').addClass('selected ui-state-active');
					}
				}, //shipmethodsasradiobuttons

			paymethodsasradiobuttons : function($tag,data)	{
//				_app.u.dump('BEGIN _app.ext.order_create.renderFormats.payOptionsAsRadioButtons');
//				_app.u.dump(data);
				var o = '', cartData,pMethods;
				if(_app.data['cartDetail|'+data.value] && _app.data['appPaymentMethods|'+data.value])	{
					cartData = _app.data['cartDetail|'+data.value];
					pMethods = _app.data['appPaymentMethods|'+data.value]['@methods'];
					o = _app.ext.order_create.u.buildPaymentOptionsAsRadios(pMethods,cartData.want.payby);
					$("button[data-giftcard-id]",o).attr('data-app-click','order_create|addGiftcardPaymethodAsPayment');
					$(":radio",o).each(function(){
						$(this).attr('data-app-change','order_create|shipOrPayMethodSelectExec');
						});
					}
				else	{
					o = $("<div \/>").anymessage({'persistent':true,'message':'In order_create.renderFormats.paymethodsasradiobuttons, cartDetail|'+data.value+' ['+( typeof _app.data['cartDetail|'+data.value] )+'] and/or appPaymentMethods|'+data.value+' ['+( typeof _app.data['appPaymentMethods|'+data.value] )+'] not found in memory. Both are required.','gMessage':true});
					}
				$tag.html(o);
				} //paymethodsasradiobuttons
			

			
			}, //renderFormats
		couplers : {
			addOrderCompleteHandler : function(args){
				if(args.handler && typeof args.handler == 'function'){
					_app.ext.order_create.checkoutCompletes.push(args.handler);
					}
				}
			}
		
		}
	return r;
	}
