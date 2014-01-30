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

var order_create = function() {
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
//				app.u.dump('BEGIN app.ext.order_create.init.onSuccess');

				app.u.loadCSSFile(app.vars.baseURL+"extensions/checkout/styles.css","checkoutCSS");
				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/checkout/'+app.vars.checkoutAuthMode+'.html',theseTemplates);

				var r = true; //returns false if checkout can't load due to account config conflict.

				if(typeof _gaq === 'undefined' && !app.vars.thisSessionIsAdmin)	{
//					app.u.dump(" -> _gaq is undefined");
					$('#globalMessaging').anymessage({'message':'It appears you are not using the Asynchronous version of Google Analytics. It is required to use this checkout.','uiClass':'error','uiIcon':'alert'});
					r = false;					
					}
//messaging for the test harness 'success'.
				else if(app.u.getParameterByName('_testharness'))	{
					$('#globalMessaging').anymessage({'message':'<strong>Excellent!<\/strong> Your store meets the requirements to use this one page checkout extension.','uiIcon':'circle-check','uiClass':'success'});
					$('#'+app.ext.order_create.vars.containerID).append("");
					r = true;
					}
				else if(!app.vars.checkoutAuthMode)	{
					r = false;
					$('#globalMessaging').anymessage({'message':'<strong>Uh Oh!<\/strong> app.vars.checkoutAuthMode is not set. should be set to passive, required or active (depending on the checkout behavior desired).'});
					}
				else if(app.vars.thisSessionIsAdmin)	{
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
//				app.u.dump('END app.ext.order_create.init.onSuccess');
				},
			onError : function()	{
				app.u.dump('BEGIN app.ext.order_create.callbacks.init.error');
				}
			}, //init

		updateAllPanels : {
			onSuccess : function(tagObj)	{
				//used for one page checkout only.
//				app.u.dump("BEGIN adminCustomerDetail callback for 1PC");
				app.ext.order_create.u.handlePanel(tagObj.jqObj,'chkoutPreflight',['empty','translate','handleDisplayLogic']);
				app.ext.order_create.u.handlePanel(tagObj.jqObj,'chkoutAddressBill',['empty','translate','handleDisplayLogic']);
				app.ext.order_create.u.handlePanel(tagObj.jqObj,'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
				app.ext.order_create.u.handlePanel(tagObj.jqObj,'chkoutMethodsShip',['empty','translate','handleDisplayLogic']);
				app.ext.order_create.u.handlePanel(tagObj.jqObj,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
				app.ext.order_create.u.handlePanel(tagObj.jqObj,'chkoutCartItemsList',['empty','translate','handleDisplayLogic']);
				app.ext.order_create.u.handlePanel(tagObj.jqObj,'chkoutCartSummary',['empty','translate','handleDisplayLogic']);
				}
			},



//Rather than a call to see if transaction is authorized, then another call to add to q, we go straight into adding to the paymentQ
//if the transaction failed, then we remove the transaction from the payment q.
//this gives us a 1 call model for success and 2 calls for failure (instead of 2 and 2).
		handlePayPalIntoPaymentQ : {
			onSuccess : function(tagObj)	{
				app.u.dump('BEGIN order_create[nice].callbacks.handlePayPalIntoPaymentQ.onSuccess');
				//this is the callback AFTER the payment is added to the Q, so no success is needed, only specific error handling.
				},
			onError : function(responseData,uuid)	{
				$('body').showLoading({'message':'Updating order...'});
				responseData['_msg_1_txt'] = "It appears something went wrong with the PayPal payment:<br \/>err: "+responseData['_msg_1_txt'];
				$('#globalMessaging').anymessage({'message':responseData,'persistent':true});
//nuke vars so user MUST go thru paypal again or choose another method.
//nuke local copy right away too so that any cart logic executed prior to dispatch completing is up to date.
				app.ext.cco.u.nukePayPalEC({'callback':function(rd){
//suppress errors but unlock all the panels.
$('body').hideLoading();
var $context = responseData._rtag.jqObj;

app.ext.order_create.u.handlePanel($context,'chkoutMethodsShip',['empty','translate','handleDisplayLogic']);
app.ext.order_create.u.handlePanel($context,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
app.ext.order_create.u.handlePanel($context,'chkoutAddressBill',['empty','translate','handleDisplayLogic']);
app.ext.order_create.u.handlePanel($context,'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
					}});
				var cartid = $context.closest("[data-app-role='checkout']").data('cartid');
				app.model.destroy('cartDetail|'+cartid);
				app.calls.cartDetail.init(cartid,{},'immutable');
				app.ext.cco.calls.appPaymentMethods.init({_cartid:cartid},{},'immutable');
				app.model.dispatchThis('immutable');
				}
			},		 //handlePayPalIntoPaymentQ


//executing this will not only return which items have had an inventory update (in a pretty format) but also create the dispatches
// to update the cart and then to actually update it as well.
// the individual cart update posts (there may be multiple) go without the callback. If callback is added, a ping to execute it is run.
		handleInventoryUpdate : {

			onSuccess : function(_rtag)	{
				var r = false; //if false is returned, then no inventory update occured.
				if(app.data[_rtag.datapointer] && !$.isEmptyObject(app.data[_rtag.datapointer]['%changes']))	{
					var $form = _rtag.jqObj, cartid = $form.closest("[data-app-role='checkout']").data('cartid');
					r = "<p>It appears that some inventory adjustments needed to be made:<ul>";
					for(var key in app.data[_rtag.datapointer]['%changes']) {
						r += "<li>sku: "+key+" was set to "+app.data[_rtag.datapointer]['%changes'][key]+" due to availability<\/li>";
						app.ext.cco.calls.cartItemUpdate.init({'stid':key,'quantity':app.data[_rtag.datapointer]['%changes'][key]}); //## TODO -> this probably needs a cartid.
						}
					app.u.dump(" -> SANITY: an extra cartDetail call is occuring because inventory availability required some cartUpdates to occur.");
					app.model.destroy('cartDetail|'+cartid);
					app.calls.cartDetail.init(cartid,{'callback':function(rd){
						if(app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							app.u.dump(" -> inventory adjustment has occurred. update panels to reflect change.");
							app.ext.order_create.u.handlePanel($form,'chkoutCartItemsList',['empty','translate','handleDisplayLogic']);
							app.ext.order_create.u.handlePanel($form,'chkoutCartSummary',['empty','translate','handleDisplayLogic']);
							app.ext.order_create.u.handlePanel($form,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
							app.ext.order_create.u.handlePanel($form,'chkoutMethodsShip',['empty','translate','handleDisplayLogic']);
							}
						}},'immutable');
					app.model.dispatchThis('immutable');
					r += "<\/ul><\/p>";
					$('#globalMessaging').anymessage({'message':r,'persistent':true});
					}

				return r;
				
				}
			},	//handleInventoryUpdate




/*
this callback is executed after a successful checkout.  'success' is defined as an order created, the order may contain 'payment required' warnings.
this is what would traditionally be called an 'invoice' page, but certainly not limited to just showing the invoice.
*/
		cart2OrderIsComplete : {
			onSuccess : function(_rtag)	{
//				app.u.dump('BEGIN app.ext.order_create.callbacks.checkoutSuccess.onSuccess   datapointer = '+_rtag.datapointer);
				$('body').hideLoading();
//nuke old form content. not needed anymore. gets replaced with invoice-ish content.
				var $checkout = _rtag.jqObj,
				checkoutData = app.data[_rtag.datapointer],
				oldCartID = $checkout.closest("[data-app-role='checkout']").data('cartid'),
				orderID = app.data[_rtag.datapointer].orderid;
				
//show post-checkout invoice and success messaging.
				$checkout.empty();
				$checkout.anycontent({'templateID':'chkoutCompletedTemplate',data: checkoutData}); //show invoice

//time for some cleanup. Nuke the old cart from memory and local storage, then obtain a new cart id, if necessary (admin doesn't auto-create a new one).

				app.model.removeCartFromSession(oldCartID); //keep this remove high in code so that if anything else goes wrong, this still gets done.


//if a cart messenger is open, log the cart update.
				if(app.u.thisNestedExists('app.ext.cart_message.vars.carts.'+oldCartID))	{
					app.model.addDispatchToQ({'_cmd':'cartMessagePush','what':'cart.update','orderid':orderID,'description':'Order created.','_cartid':cartid},'immutable');
					}

				
				if(app.u.thisIsAnAdminSession())	{} //no need to get a new cart id for an admin session or handle any third party display code.
				else	{

					var cartContentsAsLinks = encodeURI(app.ext.cco.u.cartContentsAsLinks(oldCartID));
	


//cartDetail call in a callback to the appCartCreate call because that cartDetail call needs a cart id
//			passed to it in order to know which cart to fetch (no longer connected to the session!).  This resulted in a bug that multiple
//			orders placed from the same computer in multiple sessions could have the same cart id attached.  Very bad.
					app.calls.appCartCreate.init({
						"callback" : function(rd){
							if(app.model.responseHasErrors(rd)){
								app.u.throwMessage(rd);
								}
							else {
								app.calls.cartDetail.init(rd._cartid,{},'immutable');
								app.model.dispatchThis('immutable');
								}
							}
						}); //!IMPORTANT! after the order is created, a new cart needs to be created and used. the old cart id is no longer valid.

					if(typeof window._gaq)	{
						_gaq.push(['_trackEvent','Checkout','App Event','Order created']);
						_gaq.push(['_trackEvent','Checkout','User Event','Order created ('+orderID+')']);
						}

					}
				//outside the if/else above so that cartMessagesPush and cartCreate can share the same pipe.
				app.model.dispatchThis('immutable'); //these are auto-dispatched because they're essential.					

				if(app.ext.order_create.checkoutCompletes)	{
					var L = app.ext.order_create.checkoutCompletes.length;
					for(var i = 0; i < L; i += 1)	{
						app.ext.order_create.checkoutCompletes[i]({'cartID':oldCartID,'orderID':orderID,'datapointer':_rtag.datapointer},$checkout);
						}
					}

				app.ext.order_create.u.scripts2iframe(checkoutData['@TRACKERS'])
// ### TODO -> move this out of here. move it into the appropriate app init.
				if(app.vars._clientid == '1pc')	{
//add the html roi to the dom. this likely includes tracking scripts. LAST in case script breaks something.
//this html roi is only generated if clientid = 1PC OR model version is pre 2013. for apps, add code using checkoutCompletes.

// *** -> new method for handling third party checkout scripts.
/*	setTimeout(function(){
		$checkout.append(checkoutData['html:roi']);
		app.u.dump('wrote html:roi to DOM.');
		},1000); 
*/

				//GTS for apps is handled in google extension
					if(typeof window.GoogleTrustedStore)	{
						delete window.GoogleTrustedStore; //delete existing object or gts conversion won't load right.
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
				
					}
				else	{
					app.u.dump("Not 1PC.");
					app.u.dump(" -> [data-app-role='paymentMessaging'],$checkout).length: "+("[data-app-role='paymentMessaging']",$checkout).length);
					//the code below is to disable any links in the payment messaging for apps. there may be some legacy links depending on the message.
					$("[data-app-role='paymentMessaging'] a",$checkout).on('click',function(event){
						event.preventDefault();
						});
					$("[data-app-role='paymentMessaging']",$checkout).on('click',function(event){
						event.preventDefault();
						//cart and order id are in uriParams to keep data locations in sync in showCustomer. uriParams is where they are when landing on this page directly.
						showContent('customer',{'show':'invoice','uriParams':{'cartid':oldCartID,'orderid':orderID}});
						});
					}

				},
			onError : function(rd)	{
				$('body').hideLoading();
				$('#globalMessaging').anymessage({'message':rd});
				if(_gaq)	{
					_gaq.push(['_trackEvent','Checkout','App Event','Order NOT created. error occured. ('+d['_msg_1_id']+')']);
					}

				}
			} //cart2OrderIsComplete

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
						
						if(role && typeof app.ext.order_create.validate[role] === 'function')	{
							sum += app.ext.order_create.validate[role]($fieldset,formObj);
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
				app.u.dump("validate.checkout: "+r);
				return r;
				}, //isValid
//validation function should be named the same as the data-app-role of the fieldset. 

			chkoutPreflight : function($fieldset,formObj)	{
				var valid = 0; //used to return validation state. 0 = false, 1 = true. integers used to sum up panel validation.
				
				if($fieldset && formObj)	{
					if(app.u.validateForm($fieldset))	{valid = 1;} //the validateForm field takes care of highlighting necessary fields and hints.
					else {valid = 0}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In order_create.validate.chkoutPreflight, $form or formObj not passed.','gMessage':true});
					}
				if(!valid)	{
					app.u.dump(" -> order_create.validate.chkoutPreflight: "+valid);
					}
				return valid;
				}, //chkoutPreflightFieldset

			chkoutAccountCreate : function($fieldset,formObj)	{
				var valid = 0; //used to return validation state. 0 = false, 1 = true. integers used to sum up panel validation.
				
				if($fieldset && formObj)	{
					if(!formObj['want/create_customer'])	{valid = 1}
					else if(app.u.validateForm($fieldset))	{
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
					app.u.dump(" -> order_create.validate.chkoutAccountCreate: "+valid);
					}
				return valid;
				}, //validate.chkoutAccountInfoFieldset
				
//make sure a shipping method is selected
			chkoutMethodsShip : function($fieldset,formObj)	{
				var valid = 0;
				if($fieldset && formObj)	{
					if(app.ext.cco.u.thisSessionIsPayPal())	{valid = 1} //ship address comes back from paypal. panel is hidden. auto-approve.
					else if($("[name='want/shipping_id']:checked").length)	{
						if(app.u.validateForm($fieldset)){valid = 1;}
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
					app.u.dump(" -> order_create.validate.chkoutMethodsShip: "+valid);
					}
				return valid;
				}, //validate.chkoutShipMethodsFieldset
				
//in addition to selecting a pay option, certain extra fields may be present and must be checked for.
			chkoutMethodsPay : function($fieldset,formObj)	{
				var valid = 0;
				var cartID = $fieldset.closest("[data-app-role='checkout']").data('cartid');
				if($fieldset && formObj)	{
					if(app.ext.cco.u.thisSessionIsPayPal() && app.ext.cco.u.aValidPaypalTenderIsPresent())	{valid = 1;} //if paypal
//should only get match here for expired paypal payments or some unexpected paypal related issue.
					else if(app.ext.cco.u.thisSessionIsPayPal()){
						$fieldset.anymessage({'message':"It appears something has gone wrong with your paypal authorization. Perhaps it expired. Please click the 'choose alternate payment method' link and either re-authorize through paypal or choose an alternate payment method. We apologize for the inconvenience. "})
						}
					//if the balance is zero, no payment method is necessary.
					else if(app.u.thisNestedExists("app.data.cartDetail|"+cartID+".sum.balance_due_total") && Number(app.data["cartDetail|"+cartID].sum.balance_due_total) <= 0)	{
						valid = 1;
						}
					else if($('[name="want/payby"]:checked',$fieldset).length)	{
						if(app.u.validateForm($fieldset))	{valid = 1;}
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
					app.u.dump(" -> order_create.validate.chkoutMethodsPay: "+valid);
					}
				return valid;
				}, //chkoutPayOptionsFieldset
				
			chkoutAddressBill: function($fieldset,formObj)	{
				var valid = 0;
				var cartID = $fieldset.closest("[data-app-role='checkout']").data('cartid');
				if($fieldset && formObj)	{
// *** 201338 -> some paypal orders not passing validation due to address wonkyness returned from paypal.
//paypal address gets returned with as much as paypal needs/wants. trust what we already have (which may not be enough for OUR validation)
					if(app.ext.cco.u.thisSessionIsPayPal())	{
						valid = 1;
						}
//if the buyer is logged in AND has pre-existing billing addresses, make sure one is selected.
					else if(app.u.buyerIsAuthenticated() && app.data.buyerAddressList && app.data.buyerAddressList['@bill'] && app.data.buyerAddressList['@bill'].length)	{
						if(formObj['bill/shortcut'])	{valid = 1}
						else	{
							$fieldset.anymessage({'message':'Please select the address you would like to use (push the checkmark button)'});
							}
						}
//in an admin session w/ an existing user, make sure the address has been selected.
					else if(app.u.thisIsAnAdminSession() && app.u.thisNestedExists("app.data.cartDetail|"+cartID+".customer.cid") && app.data['cartDetail|'+cartID].customer.cid > 0) {
						if(formObj['bill/shortcut'])	{valid = 1}
						else	{
							$fieldset.anymessage({'message':'Please select the address you would like to use (push the checkmark button)'});
							}
						}
					else	{

//handle phone number input based on zGlobals setting.

						if(!app.u.thisIsAnAdminSession() && zGlobals && zGlobals.checkoutSettings && zGlobals.checkoutSettings.chkout_phone == 'REQUIRED')	{
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
						
						if(app.u.validateForm($fieldset))	{valid = 1;} //the validateForm field takes care of highlighting necessary fields and hints.
						else {valid = 0}
						}
					}
				else	{
					valid = 0;
					$('#globalMessaging').anymessage({'message':'In order_create.validate.chkoutAddressBill, $form or formObj not passed.','gMessage':true});
					}
				if(!valid)	{
					app.u.dump(" -> order_create.validate.chkoutAddressBill: "+valid);
					}
				return valid;
				}, //chkoutBillAddressFieldset
				
			chkoutAddressShip: function($fieldset,formObj)	{
				var valid = 0;

				if($fieldset && formObj)	{
					
					if(formObj['want/bill_to_ship'])	{valid = 1}
// *** 201338 -> some paypal orders not passing validation due to address wonkyness returned from paypal.
//paypal address gets returned with as much as they need/want. trust what we already have (which may not be enough for OUR validation)
					else if(app.ext.cco.u.thisSessionIsPayPal())	{
						valid = 1;
						}
//if the buyer is logged in AND has pre-existing billing addresses, make sure one is selected.
					else if(app.u.buyerIsAuthenticated() && app.data.buyerAddressList && app.data.buyerAddressList['@ship'] && app.data.buyerAddressList['@ship'].length)	{
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
						
						if(app.u.validateForm($fieldset))	{valid = 1;} //the validateForm field takes care of highlighting necessary fields and hints.
						else {valid = 0}
						}
					}
				else	{
					valid = 0;
					$('#globalMessaging').anymessage({'message':'In order_create.validate.chkoutAddressShip, $form or formObj not passed.','gMessage':true});
					}
				if(!valid)	{
					app.u.dump(" -> cs2o.validate.chkoutAddressShip: "+valid);
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
//				app.u.dump("BEGIN order_create.panelDisplayLogic.chkoutPreflight");
//If the user is logged in, no sense showing password or create account prompts.
				$("[data-app-role='buyerLogout']").hide(); //make sure this is hidden. Will be shown when necessary.
				if(app.u.buyerIsAuthenticated() || app.ext.cco.u.thisSessionIsPayPal())	{
					app.u.dump(" -> session is authenticated OR this is an authorized paypal transaction.");
					$("[data-app-role='login']",$fieldset).hide();
					$("[data-app-role='username']",$fieldset).show();
//if the user is logged in, show the 'not you?' feature. However, don't show it if this is already paypal (at that point, they are who they say they are)
					if(!app.ext.cco.u.thisSessionIsPayPal())	{
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
				app.ext.order_create.u.handlePlaceholder($fieldset);
				}, //preflight

			chkoutAccountCreate : function(formObj,$fieldset)	{
//				app.u.dump('BEGIN order_create.panelDisplayLogic.chkoutAccountCreate');
				
				var authState = app.u.determineAuthentication(),
				createCustomer = formObj['want/create_customer'];

				if(authState == 'authenticated' || authState == 'thirdPartyGuest'  || app.ext.cco.u.thisSessionIsPayPal())	{
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
				app.ext.order_create.u.handlePlaceholder($fieldset);
				}, //chkoutAccountCreate
				
/*
a guest checkout gets just a standard address entry. 
an existing user gets a list of previous addresses they've used and an option to enter a new address.
*/
			chkoutAddressBill : function(formObj,$fieldset)	{
//				app.u.dump("BEGIN displayLogic.chkoutAddressBill");
				var checkoutMode = $fieldset.closest('form').data('app-checkoutmode'), //='required'
				isAuthenticated = app.u.buyerIsAuthenticated(),
				cartID = $fieldset.closest("[data-app-role='checkout']").data('cartid');
				
				if(!isAuthenticated && checkoutMode == 'required')	{
					//do nothing. panel is hidden by default, so no need to 'show' it.
					}
				else if(app.ext.cco.u.thisSessionIsPayPal()){
					app.u.dump("This is a paypal session");
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
						app.u.dump("Bill shortcut is set: "+formObj['bill/shortcut']);
//highlight the checked button of the address selected.<<
						var $button = $("[data-_id='"+formObj['bill/shortcut']+"'] button[data-app-click='order_create|execBuyerAddressSelect']",$fieldset).addClass('ui-state-highlight').button( "option", "icons", { primary: "ui-icon-check"} );
						}
					}
				else	{
					$fieldset.show(); //make sure panel is visible.
					$("[data-app-role='addressExists']",$fieldset).hide();
					$("[data-app-role='addressNew']",$fieldset).show();
//from a usability perspective, we don't want a single item select list to show up. so hide if only 1 or 0 options are available.
					if(app.data['appCheckoutDestinations|'+cartID] && app.data['appCheckoutDestinations|'+cartID]['@destinations'] && app.data['appCheckoutDestinations|'+cartID]['@destinations'].length < 2)	{
						$("[data-app-role='billCountry']",$fieldset).hide();
						}
					}
				app.ext.order_create.u.handlePlaceholder($fieldset);
				}, //chkoutAddressBill

			chkoutAddressShip : function(formObj,$fieldset)	{
				var checkoutMode = $fieldset.closest('form').data('app-checkoutmode'), //='required'
				isAuthenticated = app.u.buyerIsAuthenticated(),
				cartID = $fieldset.closest("[data-app-role='checkout']").data('cartid');

//determine if panel should be visible or not.
				if(formObj['want/bill_to_ship'] == 'on' && !app.ext.cco.u.thisSessionIsPayPal())	{$fieldset.hide()}
				else if(!isAuthenticated && checkoutMode == 'required')	{} //do nothing. panel is hidden by default in required mode.
				else	{$fieldset.show()}

//update display of panel contents.				
				if(app.ext.cco.u.thisSessionIsPayPal()){
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
						app.u.dump("Ship shortcut is set: "+formObj['ship/shortcut']);
//highlight the checked button of the address selected.<<
						var $button = $("[data-_id='"+formObj['ship/shortcut']+"'] button[data-app-click='order_create|execBuyerAddressSelect']",$fieldset).addClass('ui-state-highlight').button( "option", "icons", { primary: "ui-icon-check"} );
						}
					}
				else	{
					$("[data-app-role='addressExists']",$fieldset).hide();
					$("[data-app-role='addressNew']",$fieldset).show();
//from a usability perspective, we don't want a single item select list to show up. so hide if only 1 or 0 options are available.
					if(app.data['appCheckoutDestinations|'+cartID] && app.data['appCheckoutDestinations|'+cartID]['@destinations'] && app.data['appCheckoutDestinations|'+cartID]['@destinations'].length < 2)	{
						$("[data-app-role='shipCountry']",$fieldset).hide();
						}
					}
				app.ext.order_create.u.handlePlaceholder($fieldset);
				}, //chkoutAddressShip

			chkoutMethodsShip : function(formObj,$fieldset)	{
//				app.u.dump('BEGIN app.ext.order_create.panelContent.shipMethods');
//close any existing error messages
				if($('.ui-widget-anymessage',$fieldset).length)	{
					$fieldset.anymessage('close');
					}
					
				var checkoutMode = $fieldset.closest('form').data('app-checkoutmode'), //='required'
				isAuthenticated = app.u.buyerIsAuthenticated(),
				cartID = $fieldset.closest("[data-app-role='checkout']").data('cartid'),
				shipMethods = (app.data['cartDetail|'+cartID]) ? app.data['cartDetail|'+cartID]['@SHIPMETHODS'] : [],
				L = (shipMethods) ? shipMethods.length : 0;
				
//				app.u.dump(' -> shipMethods.length: '+L); // app.u.dump(shipMethods);
				
				
//WARNING -> if you decide not to hide the panel, the radio buttons must be locked/disabled instead.
				if(!isAuthenticated && checkoutMode == 'required')	{
					//do nothing. panel is hidden by default, so no need to 'show' it.
					}
				else if(app.ext.cco.u.thisSessionIsPayPal())	{
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
//					app.u.dump(" -> Shipping methods are present.");
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
//no shipping methods and buyer is logged in.
				else if(app.u.buyerIsAuthenticated())	{
					var hasPredefBillAddr = app.ext.cco.u.buyerHasPredefinedAddresses('bill'),
					hasPredefShipAddr = app.ext.cco.u.buyerHasPredefinedAddresses('ship');
					
					if(formObj['want/bill_to_ship'] && hasPredefBillAddr && formObj['bill/shortcut']){
						$fieldset.anymessage({"message":"<p>No shipping methods are available.</p>","persistent":true});
						}
					else if(!formObj['want/bill_to_ship'] && app.ext.cco.u.buyerHasPredefinedAddresses('ship') == true && formObj['ship/shortcut']){
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
				isAuthenticated = app.u.buyerIsAuthenticated();
				if(!isAuthenticated && checkoutMode == 'required')	{
					//do nothing. panel is hidden by default, so no need to 'show' it.
					}
				else	{
					$fieldset.show();
					}
				}, //chkoutCartItemsList

			chkoutCartSummary : function(formObj,$fieldset)	{
				var checkoutMode = $fieldset.closest('form').data('app-checkoutmode'), //='required'
				isAuthenticated = app.u.buyerIsAuthenticated();
				
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

			chkoutMethodsPay : function(formObj,$fieldset)	{
//the renderformat will handle the checked=checked. however some additional payment inputs may need to be added. that happens here.
				var
					checkoutMode = $fieldset.closest('form').data('app-checkoutmode'), //='required'
					isAuthenticated = app.u.buyerIsAuthenticated(),
					cartID = $fieldset.closest("[data-app-role='checkout']").data('cartid');
				
				if(!isAuthenticated && checkoutMode == 'required')	{
					//do nothing. panel is hidden by default, so no need to 'show' it.
					}
				else if(app.ext.cco.u.thisSessionIsPayPal())	{
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
					if(app.u.buyerIsAuthenticated() && app.ext.cco.u.paymentMethodsIncludesGiftcard('appPaymentMethods|'+$fieldset.closest("[data-app-role='checkout']").data('cartid'))){
						$("[data-app-role='giftcardHint']",$fieldset).show();
						}
					else {} //user is not logged in.
				//if the balance is zero, hide the payment inputs to avoid confusion.
					if(app.u.thisNestedExists("app.data.cartDetail|"+cartID+".sum.balance_due_total") && Number(app.data["cartDetail|"+cartID].sum.balance_due_total) <= 0)	{
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
								active: (app.data['cartDetail|'+cartID] && app.data['cartDetail|'+cartID].want && app.data['cartDetail|'+cartID].want.payby && app.data['cartDetail|'+cartID].want.payby.indexOf('WALLET') == -1) ? 0 : 1 //unless a buyer has already selected a non-wallet payment method, show stores payments as open.
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
// ### TODO -> this doesn't work because want/payby is no longer a valid field. Either need a field to temporarily store this in OR need to start using localStorage for this.
					if(formObj['want/payby'])	{
						var
							$radio = $("input[value='"+formObj['want/payby']+"']",$fieldset),
							$supplemental = app.ext.order_create.u.showSupplementalInputs($radio,app.ext.order_create.vars);
						
						$radio.attr('checked','checked');
						if($supplemental)	{
							app.u.dump(" -> payment method ["+formObj['want/payby']+"] HAS supplemental inputs");
							$radio.closest("[data-app-role='paymentMethodContainer']").append($supplemental);
							}
						}

					}

				}, //chkoutMethodsPay

			chkoutNotes : function(formObj,$fieldset)	{
				var checkoutMode = $fieldset.closest('form').data('app-checkoutmode'), //='required'
				isAuthenticated = app.u.buyerIsAuthenticated();
				if(!isAuthenticated && checkoutMode == 'required')	{
					//do nothing. panel is hidden by default, so no need to 'show' it.
					}
				else if(app.u.thisIsAnAdminSession() || zGlobals.checkoutSettings.chkout_order_notes)	{$fieldset.show()}
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

note - the order object is available at app.data['order|'+P.orderID]
*/
		checkoutCompletes : [],



		a : {
			
			appCartCreate : function($target)	{
				app.calls.appCartCreate.init({'datapointer':'appCartCreate','callback':function(rd){
					if(app.model.responseHasErrors(rd)){
						$target.anymessage({'message':rd});
						}
					else	{
//appCartCreate will automatically update the carts object in localstorage
						app.ext.order_create.a.startCheckout($target,app.data[rd.datapointer]._cartid);
						}
				}},'immutable');
				app.model.dispatchThis('immutable');
				},

//don't execute this UNTIL you have a valid cart id.
			startCheckout : function($chkContainer,cartID)	{
//				app.u.dump("BEGIN order_create.a.startCheckout");
//				app.u.dump(" -> app.u.buyerIsAuthenticated(): "+app.u.buyerIsAuthenticated());

				if($chkContainer && $chkContainer.length && cartID)	{
					app.u.dump(" -> startCheckout cartid: "+cartID);
					$chkContainer.empty();
					$chkContainer.anydelegate({
						trackEdits : app.u.thisIsAnAdminSession() //edits are only tracked in the admin interface
						});
					$chkContainer.css('min-height','300'); //set min height so loading shows up.

					$chkContainer.showLoading({'message':'Fetching cart contents and payment options'});
					if(app.u.thisIsAnAdminSession())	{
						}
					else if(Number(zGlobals.globalSettings.inv_mode) > 1)	{
						app.u.dump(" -> inventory mode set in such a way that an inventory check will occur.");
						app.ext.cco.calls.cartItemsInventoryVerify.init(cartID,{'callback':'handleInventoryUpdate','extension':'order_create','jqObj':$chkContainer});
						}

					if(app.u.buyerIsAuthenticated())	{
						app.calls.buyerAddressList.init({'callback':'suppressErrors'},'immutable'); //will check localStorage.
						app.model.addDispatchToQ({'_cmd':'buyerWalletList','_tag':	{'datapointer' : 'buyerWalletList','callback':'suppressErrors'}},'immutable'); //always obtain clean copy of wallets.
						}

					app.ext.order_create.vars[cartID] = app.ext.order_create.vars[cartID] || {'payment':{}};

					app.ext.order_create.u.handlePaypalInit($chkContainer); //handles paypal code, including paymentQ update. should be before any callbacks.
					app.ext.cco.calls.appPaymentMethods.init({_cartid:cartID},{},'immutable');
					app.ext.cco.calls.appCheckoutDestinations.init(cartID,{},'immutable');
					
					app.model.destroy('cartDetail|'+cartID);
					
					
					app.calls.cartDetail.init(cartID,{'callback':function(rd){
						$chkContainer.hideLoading(); //always hideloading, errors or no, so interface is still usable.
						if(app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
//							app.u.dump(" -> cartDetail callback for startCheckout reached.");
							if(app.data[rd.datapointer]['@ITEMS'].length || app.u.thisIsAnAdminSession())	{
//								app.u.dump(" -> cart has items or this is an admin session.");
								var $checkoutContents = app.renderFunctions.transmogrify({},'checkoutTemplate',app.ext.order_create.u.extendedDataForCheckout(cartID));
				
								if($checkoutContents.attr('id'))	{}
								else	{
									$checkoutContents.attr('id','ordercreate_'+app.u.guidGenerator()); //add a random/unique id for use w/ dialogs and callbacks.
									}								
								
								$chkContainer.append($checkoutContents);
								$checkoutContents.data('cartid',cartID);
								$("fieldset[data-app-role]",$chkContainer).each(function(index, element) {
									var $fieldset = $(element),
									role = $fieldset.data('app-role');
									
									$fieldset.addClass('ui-corner-all');
									$("legend",$fieldset).addClass('ui-widget-header ui-corner-all');
									app.ext.order_create.u.handlePanel($chkContainer,role,['handleDisplayLogic']);
									});
//								app.u.dump(" -> handlePanel has been run over all fieldsets.");
								if(app.u.thisIsAnAdminSession() && app.data[rd.datapointer].customer.cid)	{
									//in the admin interface, the quirksmode bug won't be an issue because it only happens at app init and we're well past that by now.
									$chkContainer.showLoading({'message':'Fetching customer record'});
									app.ext.admin.calls.adminCustomerDetail.init({'CID':app.data[rd.datapointer].customer.cid,'rewards':1,'notes':1,'orders':1,'organization':1,'wallets':1},{'callback' : 'updateAllPanels','extension':'order_create','jqObj':$chkContainer},'mutable');
									app.model.dispatchThis('mutable');
									}
								else if(document.compatMode == 'CSS1Compat')	{}
								else	{
									app.u.dump(" -> Quirks mode detected. Re-render the panels after a short delay. this is to correct an issue w/ quirks and jquery ui button()",'warn');
									setTimeout(function(){
										app.ext.order_create.u.handlePanel($chkContainer,'chkoutCartSummary',['empty','translate','handleDisplayLogic']);
										app.ext.order_create.u.handlePanel($chkContainer,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
										app.ext.order_create.u.handlePanel($chkContainer,'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
										app.ext.order_create.u.handlePanel($chkContainer,'chkoutAddressBill',['empty','translate','handleDisplayLogic']);
										app.ext.order_create.u.handlePanel($chkContainer,'chkoutAccountCreate',['empty','translate','handleDisplayLogic']);
										app.ext.order_create.u.handlePanel($chkContainer,'chkoutPreflight',['empty','translate','handleDisplayLogic']);
										},1000);
									}
								}
							else	{
								$chkContainer.anymessage({'message':'It appears your cart is empty. If you think you are receiving this message in error, please refresh the page or contact us.'});
								}
							}
						}},'immutable');
//					app.u.dump(" -> made it past adding calls to Q for startCheckout. now dispatch.");
					app.model.dispatchThis('immutable');
					}
				else	{
					$('#globalMessaging').anymessage({'message':'in order_create.a.startCheckout, no $chkContainer [jQuery instance: '+($chkContainer instanceof jQuery)+'] not passed or does not exist or cartid ['+cartID+'] not passed.','gMessage':true});
					}
				} //startCheckout
			
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
					app.ext.admin_customer.a.customerSearch({'searchfor':email,'scope':'EMAIL'},function(customer){
						app.ext.order_create.u.handlePanel($context,'chkoutPreflight',['empty','showLoading']);
						app.ext.order_create.u.handlePanel($context,'chkoutAddressBill',['empty','showLoading']);
						app.ext.order_create.u.handlePanel($context,'chkoutAddressShip',['empty','showLoading']);
						
						app.ext.cco.calls.cartSet.init({'_cartid':cartid,'bill/email':customer.EMAIL});
						app.model.addDispatchToQ({
							'_cmd':'adminCartMacro',
							'_cartid' : cartid,
							'_tag' : {
								'callback' : 'showMessaging',
								'jqObj' : $('#globalMessaging'),
								'message' : 'Customer '+customer.EMAIL+' assigned to this cart'
								},
							"@updates" : ["LINK-CUSTOMER-ID?CID="+customer.CID]
							},'immutable');
						app.model.destroy('cartDetail|'+cartid);
						app.model.destroy('appPaymentMethods|'+cartid);
//get a clean copy of the customer record for 2 reason. 1 to make sure it's up to date. 2 because cartDetail just got nuked from memory so callback on customerDetail would load a blank cart.
						app.model.destroy('adminCustomerDetail|'+customer.CID); 
						app.calls.cartDetail.init(cartid,{},'immutable');
						app.ext.cco.calls.appPaymentMethods.init({_cartid:cartid},{},'immutable'); //update pay and ship anytime either address changes.
						app.ext.admin.calls.adminCustomerDetail.init({'CID':customer.CID,'rewards':1,'notes':1,'orders':1,'organization':1,'wallets':1},{'callback' : 'updateAllPanels','extension':'order_create','jqObj':$context},'immutable');
						app.model.dispatchThis('immutable');
						});
					}
				else	{
					app.u.validateForm($ele.closest('fieldset')); //this will handle the error display.
					}
				},
			
			adminAddressCreateUpdateShow : function($ele,p)	{
				p.preventDefault();
				var $checkout = $ele.closest("[data-app-role='checkout']");
				var CID = app.data['cartDetail|'+$checkout.data('cartid')].customer.cid;
				var vars = {
					'mode' : $ele.data('mode'), //will b create or update.
					'show' : 'dialog',
					'TYPE' : $ele.closest("[data-app-addresstype]").attr('data-app-addresstype'),
					'CID' : CID,
					'editorID' : $checkout.attr('id')
					};
				
				app.ext.admin_customer.a.addressCreateUpdateShow(vars,function(v){
					app.ext.order_create.u.handlePanel($checkout,'chkoutPreflight',['empty','translate','handleDisplayLogic']);
					app.ext.order_create.u.handlePanel($checkout,'chkoutAddressBill',['empty','translate','handleDisplayLogic']);
					app.ext.order_create.u.handlePanel($checkout,'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
					app.ext.order_create.u.handlePanel($checkout,'chkoutMethodsShip',['empty','translate','handleDisplayLogic']);
					app.ext.order_create.u.handlePanel($checkout,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
					app.ext.order_create.u.handlePanel($checkout,'chkoutCartItemsList',['empty','translate','handleDisplayLogic']);
					},app.ext.cco.u.getAndRegularizeAddrObjByID(app.data['adminCustomerDetail|'+CID]['@'+vars.TYPE.toUpperCase()],$ele.closest("[data-_id]").data('_id'),vars.TYPE,false));
				},

			adminCartRemoveFromSession : function($ele,p)	{
				app.model.removeCartFromSession($ele.closest("[data-app-role='checkout']").data('cartid'));
				navigateTo("#!orders");
				},
			adminOrderDetailShow : function($ele,p)	{
				var orderID = $ele.closest("[data-orderid]").data('orderid');
				if(orderID)	{
					var $orderContent = $("[data-app-role='orderContents']:first",$ele.closest("[data-app-role='orderContainer']")).show();
					app.ext.admin.calls.adminOrderDetail.init(orderID,{
						'callback' : 'anycontent',
						'jqObj' : $orderContent,
						'translateOnly' : true
						},'mutable');
					app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In order_create.e.adminOrderDetailShow, unable to ascertain orderid.","gMessage":true});
					}
				},

			buyerLogout : function($ele,p)	{
//				app.u.dump(" BEGIN order_create.e.buyerLogout");
//					app.u.dump(" -> order_create.e.buyerLogout (Click!)");
				app.calls.buyerLogout.init({'callback':function(rt){
					app.ext.order_create.u.handlePanel($ele.closest('form'),'chkoutPreflight',['empty','translate','handleDisplayLogic']);
					app.ext.order_create.u.handlePanel($ele.closest('form'),'chkoutAddressBill',['empty','translate','handleDisplayLogic']);
					app.ext.order_create.u.handlePanel($ele.closest('form'),'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
					app.ext.order_create.u.handleCommonPanels($ele.closest('form'));
					app.model.dispatchThis('immutable');
					}});
				app.model.dispatchThis('immutable');
				},

			cartItemAppendSKU : function($ele,p)	{
				p.skuArr = [$ele.closest("[data-sku]").data('sku')];
				this.cartItemAppendAllSKUsFromOrder($ele,p);
				},

			//SKU/STID required (fully qualified, w/ variations et all);
			cartItemAppendAllSKUsFromOrder : function($ele,p)	{
				var $container = $ele.closest("[data-app-role='orderContainer']"), orderID = $container.data('orderid');
				if(orderID)	{
					var $checkout = $ele.closest("[data-app-role='checkout']"), cartID = $checkout.data('cartid');
					app.ext.cco.u.appendOrderItems2Cart({'orderid':orderID,'cartid':cartID},function(rd){
//run an inventory check. However, do NOT auto-adjust. Merchants should be allowed to over-order if desired.
//throw a fatty warning tho to make sure it isn't missed.
						app.ext.cco.calls.cartItemsInventoryVerify.init(cartID,{'callback':'adminInventoryDiscrepencyDisplay','extension':'cco','jqObj':$container});
						app.ext.order_create.u.handleCommonPanels($checkout);
						app.model.dispatchThis('immutable');

						},p.skuArr || []);
					}
				else	{
					
					}
				},

			//updates line item in cart. This event can be fired on an element (input, button, etc) within the scope of the line item template.
			cartItemUpdateExec : function($ele,p){
				var
					$container = $ele.closest('[data-stid]'),
					cartid = $ele.closest(":data(cartid)").data('cartid'),
					vars = {
						stid : $container.data('stid'),
						uuid : $container.data('uuid'),
						qty : $("input[name='qty']",$container).val(), //admin wants qty.
						quantity : $("input[name='qty']",$container).val() //cartItemUpdate wants quantity
						}
				
				if($("input[name='price']",$container).val() && app.u.thisIsAnAdminSession())	{
					vars.price = $("input[name='price']",$container).val();
					}
				
				if(app.ext.cco.u.cartItemUpdate(cartid,vars,{'callback' : 'updateAllPanels','extension':'order_create','jqObj':$ele.closest('form')}))	{
					app.model.destroy('cartDetail|'+cartid);
					app.calls.cartDetail.init(cartid,{},'immutable');
					app.model.dispatchThis('immutable');
					}
				else	{
					//cartItemUpdate will handle error display.
					}
				}, //cartItemUpdateExec

			cartItemAddFromForm : function($ele,p)	{
				var $chkoutForm	= $ele.closest("[data-add2cart-role='container']"), $checkout = $ele.closest("[data-app-role='checkout']");
				app.ext.store_product.u.handleAddToCart($chkoutForm);
				app.model.destroy('cartDetail|'+$checkout.data('cartid'));
				app.model.destroy('appPaymentMethods|'+$checkout.data('cartid'));
				app.ext.cco.calls.appPaymentMethods.init({_cartid:$checkout.data('cartid')},{},'immutable');
				app.calls.cartDetail.init($checkout.data('cartid'),{
					'callback':function(rd){
						if(app.model.responseHasErrors(rd)){
							$ele.closest('fieldset').anymessage({'message':rd});
							}
						else	{
							app.ext.order_create.u.handlePanel($checkout,'chkoutCartItemsList',['empty','translate','handleDisplayLogic']); //for toggling display of ref. # field.
							app.ext.order_create.u.handlePanel($checkout,'chkoutCartSummary',['empty','translate','handleDisplayLogic']); //for toggling display of ref. # field.
							app.ext.order_create.u.handlePanel($checkout,'chkoutMethodsShip',['empty','translate','handleDisplayLogic']);
							app.ext.order_create.u.handlePanel($checkout,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
							app.ext.order_create.u.handlePanel($checkout,'chkoutCartSummary',['empty','translate','handleDisplayLogic']);
							}
						}
					},'immutable'); //update cart so that if successful, the refresh on preflight panel has updated info.
				app.model.dispatchThis('immutable');
				}, //cartItemAddFromForm

			cartItemAddWithChooser : function($ele,p)	{
				p.preventDefault();
//$button is passed into the showFinder function. This is the button that appears IN the chooser/finder for adding to the cart/order.	
				var $chkoutForm	= $ele.closest('form'), $checkout = $ele.closest("[data-app-role='checkout']")
				var $button = $("<button>").text("Add to Cart").button().on('click',function(event){
					event.preventDefault();
					$(this).button('disable'); //prevent doubleclick.
					var $form = $('form','#chooserResultContainer');
					if($form && $form.length)	{
						app.u.dump(" -> found form");
						$form.append("<input type='hidden' name='_cartid' value='"+$checkout.data('cartid')+"' \/>");
						var sfo = $form.serializeJSON(); //Serialized Form Object.
						var pid = sfo.sku;  //shortcut
						sfo.product_id = pid; //
//						app.u.dump(" -> sfo: "); app.u.dump(sfo);
						if(app.ext.store_product.validate.addToCart(pid,$form))	{
							app.u.dump(" -> passed validation");
							app.ext.store_product.u.handleAddToCart($form);
							app.model.destroy('cartDetail|'+$checkout.data('cartid'));
							app.model.destroy('appPaymentMethods|'+$checkout.data('cartid'));
							app.ext.cco.calls.appPaymentMethods.init({_cartid:$checkout.data('cartid')},{},'immutable');
							app.calls.cartDetail.init($checkout.data('cartid'),{
								'callback':function(rd){
									if(app.model.responseHasErrors(rd)){
										$('#prodFinder').anymessage({'message':rd});
										}
									else	{
										$('#prodFinder').dialog('close');
										app.ext.order_create.u.handlePanel($chkoutForm,'chkoutCartItemsList',['empty','translate','handleDisplayLogic']); //for toggling display of ref. # field.
										app.ext.order_create.u.handlePanel($chkoutForm,'chkoutCartSummary',['empty','translate','handleDisplayLogic']); //for toggling display of ref. # field.
										app.ext.order_create.u.handlePanel($chkoutForm,'chkoutMethodsShip',['empty','translate','handleDisplayLogic']);
										app.ext.order_create.u.handlePanel($chkoutForm,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
										app.ext.order_create.u.handlePanel($chkoutForm,'chkoutCartSummary',['empty','translate','handleDisplayLogic']);
										}
									}
								},'immutable'); //update cart so that if successful, the refresh on preflight panel has updated info.
							app.model.dispatchThis('immutable');
							}
						else	{
							app.u.dump("Chooser add to cart did not pass validation",'warn');
							$(this).button('enable'); //prevent doubleclick.
							}
						}
					else	{
						$('#productFinderContents').anymessage({"message":"In order_create.e.cartItemAddWithChooser, #chooserResultContainer had no length.","gMessage":true});
						$(this).button('enable');
						}
					});
				app.ext.admin.a.showFinderInModal('CHOOSER','','',{'$buttons' : $button});
				},

//ele is likely a div or section. the element around all the inputs.
			addTriggerPayMethodUpdate : function($ele,p)	{
				var $fieldset = $ele.closest('fieldset');
				$("input[type='radio']",$ele).each(function(){
					var $input = $(this);
					$input.off("change.addTriggerPayMethodUpdate").on("change.addTriggerPayMethodUpdate", function(){
						app.ext.cco.calls.cartSet.init({'_cartid':$ele.closest("[data-app-role='checkout']").data('cartid'),'want/payby':$input.val()});
						app.model.dispatchThis('immutable'); //any reason to obtain a new cart object here? don't think so.
						app.ext.order_create.u.showSupplementalInputs($input);
						app.ext.order_create.u.handlePanel($input.closest('form'),'chkoutCartSummary',['empty','translate','handleDisplayLogic']); //for toggling display of ref. # field.
						});
					})
				}, //addTriggerPayMethodUpdate
			
			shipOrPayMethodSelectExec : function($ele,p)	{
				app.u.dump("BEGIN order_create.e.shipOrPayMethodSelectExec");
				var obj = {};
				obj[$ele.attr('name')] = $ele.val();
				if($ele.data('updatemode') == 'cart')	{
					obj._cartid = $ele.closest("[data-template-role='cart']").data('cartid');
					}
				else	{}
				obj._cartid = $ele.closest("[data-app-role='checkout']").data('cartid');
				app.ext.cco.calls.cartSet.init(obj);
//destroys cart and updates big three panels (shipping, payment and summary)
				app.ext.order_create.u.handleCommonPanels($ele.closest('form'));
				app.model.dispatchThis("immutable");
				},
			

//triggered on specific address inputs. When an address is updated, several things could be impacted, including tax, shipping options and payment methods.
			execAddressUpdate : function($ele,p)	{
				var obj = {};
				obj[$ele.attr('name')] = $ele.val();
				//if bill/ship are the same, duplicate data in both places OR shipping methods won't update.
				if($ele.closest('form').find("input[name='want/bill_to_ship']").is(':checked') && $ele.attr('name').indexOf('bill/') >= 0)	{
					obj[$ele.attr('name').replace('bill/','ship/')] = $ele.val();
					}
				obj._cartid = $ele.closest("[data-app-role='checkout']").data('cartid');
				app.ext.cco.calls.cartSet.init(obj); //update the cart
				app.ext.order_create.u.handleCommonPanels($ele.closest('form'));
				app.model.dispatchThis('immutable');
				}, //execAddressUpdate

//executed when an predefined address (from a buyer who is logged in) is selected.
			execBuyerAddressSelect : function($ele,p)	{
				p.preventDefault();
				var
					addressType = $ele.closest('fieldset').data('app-addresstype'), //will be ship or bill.
					$form = $ele.closest('form'),
					addressID = $ele.closest('address').data('_id'),
					$checkout = $ele.closest("[data-app-role='checkout']");
					

// For an incomplete address, the edit dialog will open automatically and prompt for invalid fields. The intent to select the address will also update the cart.
				if(addressType && addressID)	{
					$ele.closest('fieldset').find('.ui-button.ui-state-focus').removeClass('ui-state-focus');
					$ele.addClass('ui-state-focus');
					//even if the address doesn't pass validation, set the shortcut to this id. checkout won't let them proceed, but this way their intent is still saved.
					//and after the update occurs, this address will be selected.
					$("[name='"+addressType+"/shortcut']",$form).val(addressID);
					var cartUpdate = {};
					cartUpdate[addressType+"/shortcut"] = addressID;
					cartUpdate._cartid = $ele.closest("[data-app-role='checkout']").data('cartid');
					
					var addrObj = app.u.thisIsAnAdminSession() ? app.ext.cco.u.getAndRegularizeAddrObjByID(app.data['adminCustomerDetail|'+app.data['cartDetail|'+$checkout.data('cartid')].customer.cid]['@'+addressType.toUpperCase()],addressID,addressType,true) : app.ext.cco.u.getAddrObjByID(addressType,addressID); //will return address object.

					if(app.ext.cco.u.verifyAddressIsComplete(addrObj,addressType))	{
						
						if(addressType == 'bill' && $ele.closest('form').find("input[name='want/bill_to_ship']").is(':checked'))	{
//							app.u.dump("Ship to billing address checked. set fields in billing.");
//copy the address into the shipping fields so shipping rates update.
							if(!$.isEmptyObject(addrObj))	{
								for(var index in addrObj)	{
//At the time this is being written, buyer calls return the address with bill/ and admin calls return bill_. convenient. 
									cartUpdate[index.replace('bill/','ship/')] = addrObj[index]; 
									}
								}
							}
//there was a callback on this, but no clear reason why it was necessary. removed for now (will test prior to deleting this code)
//						app.ext.cco.calls.cartSet.init(cartUpdate,{'callback':function(){
//							app.ext.order_create.u.handlePanel($form,(addressType == 'bill') ? 'chkoutAddressBill' : 'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
//							}}); //no need to populate address fields, shortcut handles that.
						app.ext.cco.calls.cartSet.init(cartUpdate)
						app.ext.order_create.u.handleCommonPanels($form);
						app.model.dispatchThis('immutable');
						}
					else	{
						app.ext.cco.calls.cartSet.init(cartUpdate,{},'passive');
						app.model.dispatchThis('passive');
						$ele.closest('fieldset').find("[data-app-role='addressEditButton']").data('validate-form',true).trigger('click');
						}
					}
				else	{
					$ele.closest('fieldset').anymessage({'message':'In order_create.e.execBuyerAddressSelect, either addressType ['+addressType+'] and/or addressID ['+addressID+'] not set. Both are required.','gMessage':true});
					}

				}, //execBuyerAddressSelect

//immediately update cart anytime the email address is added/changed. for remarketing purposes.
//no need to refresh the cartDetail here.

			execBuyerEmailUpdate : function($ele,p)	{
				if(app.u.isValidEmail($ele.val()))	{
					app.ext.cco.calls.cartSet.init({'_cartid':$ele.closest("[data-app-role='checkout']").data('cartid'),'bill/email':$ele.val()},{},'immutable');
					app.model.dispatchThis('immutable');
					}
				}, //execBuyerEmailUpdate

			execBuyerLogin : function($ele,p)	{
				var $fieldset = $ele.closest('fieldset'),
				$email = $("[name='bill/email']",$fieldset),
				$password = $("[name='password']",$fieldset),
				$checkout = $ele.closest("[data-app-role='checkout']");

				if($email.val() && $password.val())	{
					$('body').showLoading({'message':'Verifying username and password...'});
					//we have want we need. attempt login.

					app.model.destroy('buyerAddressList');
					app.model.destroy('buyerWalletList');
					app.model.destroy('cartDetail|'+$checkout.data('cartid'));

					app.ext.cco.calls.cartSet.init({"bill/email":$email.val(),"_cartid":$checkout.data('cartid')}) //whether the login succeeds or not, set bill/email in the cart.
					app.calls.appBuyerLogin.init({"login":$email.val(),"password":$password.val()},{'callback':function(rd){
//							app.u.dump("BEGIN exeBuyerLogin anonymous callback");
						$('body').hideLoading();
						if(app.model.responseHasErrors(rd)){$fieldset.anymessage({'message':rd})}
						else	{
							app.u.dump(" -> no errors. user is logged in.");
							var $form = $fieldset.closest('form'),
							$fieldsets = $('fieldset',$form);
//set all panels to loading.
							$fieldsets.each(function(){
								app.ext.order_create.u.handlePanel($form,$(this).data('app-role'),['showLoading']);
								});

//can't piggyback these on login because they'll error at the API side (and will kill the login request)

							app.calls.buyerAddressList.init({'callback':function(){
//no error handling needed. if call fails or returns zero addesses, the panels still need to be rendered.
//re-render all panels. each could be affected by a login (either just on the display side or new/updated info for discounts, addresses, giftcards, etc)
								$fieldsets.each(function(){
									app.ext.order_create.u.handlePanel($form,$(this).data('app-role'),['empty','translate','handleDisplayLogic']);
									});
								}},'immutable');

							app.model.addDispatchToQ({'_cmd':'buyerWalletList','_tag':	{'datapointer' : 'buyerWalletList','callback':''}},'immutable');
							app.model.dispatchThis('immutable');
							$fieldset.anymessage({'message':'Thank you, you are now logged in.','_msg_0_type':'success'});
							}
						}});
					app.calls.cartDetail.init($checkout.data('cartid'),{},'immutable'); //update cart so that if successful, the refresh on preflight panel has updated info.
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
				}, //execBuyerLogin

			cartOrderSave : function($ele,p)	{
				var $form = $ele.closest('form');
				app.ext.cco.u.sanitizeAndUpdateCart($form);
				
				app.model.dispatchThis('immutable');
				},

			execCartOrderCreate : function($ele,p)	{
				var $form = $ele.closest('form');
				
//if paypalEC is selected, skip validation and go straight to paypal. Upon return, bill and ship will get populated automatically.
				if($("input[name='want/payby']:checked",$form).val() == 'PAYPALEC' && !app.ext.cco.u.thisSessionIsPayPal())	{
					$('body').showLoading({'message':'Transferring you to PayPal payment authorization'});
					app.ext.cco.calls.cartPaypalSetExpressCheckout.init({'getBuyerAddress': (app.u.buyerIsAuthenticated()) ? 0 : 1},{'callback':function(rd){
						if(app.model.responseHasErrors(rd)){
							$('body').hideLoading();
							$('html, body').animate({scrollTop : $fieldset.offset().top},1000); //scroll to first instance of error.
							$fieldset.anymessage({'message':rd});
							}
						else	{
							window.location = app.data[rd.datapointer].URL
							}
						},"extension":"order_create",'parentID': $ele.closest("[data-app-role='checkout']").attr('id')},'immutable');
					app.model.dispatchThis('immutable');
					}
				else	{
				
					if(app.ext.order_create.validate.checkout($form))	{
						$('body').showLoading({'message':'Creating order...'});
						app.ext.cco.u.sanitizeAndUpdateCart($form);
						var cartid = $ele.closest("[data-app-role='checkout']").data('cartid');
//paypal payments are added to the q as soon as the user returns from paypal.
//This will solve the double-add to the payment Q
//payment method validation ensures a valid tender is present.
						if(app.ext.cco.u.thisSessionIsPayPal())	{}
						else	{
							app.ext.cco.u.buildPaymentQ($form,cartid);
							}
						app.ext.cco.calls.cartOrderCreate.init(cartid,{'callback':'cart2OrderIsComplete','extension':'order_create','jqObj':$form});
						app.model.dispatchThis('immutable');						
						
						}
					else	{
						//even though validation failed, take this opportunity to update the cart on the server.
						app.ext.cco.u.sanitizeAndUpdateCart($form);
						app.model.dispatchThis('immutable');
						//scrolls up to first instance of an error.
						$('html, body').animate({scrollTop : $('.formValidationError, .ui-widget-anymessage, .ui-state-error',$form).first().offset().top},1000); //scroll to first instance of error.
						}
					}
				}, //execCartOrderCreate

//update the cart. no callbacks or anything like that, just get the data to the api.
//used on notes and could be recyled if needed.
			execCartSet : function($ele,p)	{
				var obj = {};
				obj[$ele.attr('name')] = $ele.val();
				obj._cartid = $ele.closest("[data-app-role='checkout']").data('cartid');
				app.ext.cco.calls.cartSet.init(obj);
				app.model.dispatchThis('immutable');
				}, //execCartSet

			execChangeFromPayPal : function($ele,p)	{
				app.ext.cco.u.nukePayPalEC();
				var $form = $ele.closest('form');
				app.ext.order_create.u.handleCommonPanels($form);
				app.calls.ping.init({callback:function(){
					app.ext.order_create.u.handlePanel($form,'chkoutAddressBill',['empty','translate','handleDisplayLogic']);
					app.ext.order_create.u.handlePanel($form,'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
					}},'immutable');
				app.model.dispatchThis('immutable');
				},

			execCountryUpdate : function($ele,p)	{
				//recalculate the shipping methods and payment options.
				var obj = {}, $form = $ele.closest('form');
//temporary workaround. setting bill country to int isn't updating ship methods correctly.
//if bill to ship is enabled, must update ship country or shipping won't update.
				if($ele.attr('name') == 'bill/countrycode' && $("[name='want/bill_to_ship']",$form).is(':checked'))	{
					obj['ship/countrycode'] = $ele.val();
					}
				
				obj[$ele.attr('name')] = $ele.val();
				obj._cartid = $ele.closest("[data-app-role='checkout']").data('cartid');
				app.ext.cco.calls.cartSet.init(obj); //update the cart w/ the country.
				app.ext.order_create.u.handleCommonPanels($form);
				app.model.dispatchThis('immutable');
				}, //execCountryUpdate

			execCouponAdd : function($ele,p)	{
				var $fieldset = $ele.closest('fieldset'),
				$form = $ele.closest('form'),
				cartid = $ele.closest("[data-app-role='checkout']").data('cartid'),
				$input = $("[name='coupon']",$fieldset);
				
				if($ele.is('button')){$ele.button('disable');}

//update the panel only on a successful add. That way, error messaging is persistent. success messaging gets nuked, but coupon will show in cart so that's okay.
				app.ext.cco.calls.cartCouponAdd.init($input.val(),cartid,{"callback":function(rd){
					if(app.model.responseHasErrors(rd)){
						$fieldset.anymessage({'message':rd});
						}
					else	{
						$input.val(''); //reset input only on success.  allows for a typo to be corrected.
						$fieldset.anymessage(app.u.successMsgObject('Your coupon has been added.'));
						app.ext.order_create.u.handlePanel($form,'chkoutCartItemsList',['empty','translate','handleDisplayLogic']);
//if a cart messenger is open, log the cart update.
						if(cartid && app.u.thisNestedExists('app.ext.cart_message.vars.carts.'+cartid))	{
							app.model.addDispatchToQ({'_cmd':'cartMessagePush','what':'cart.update','description':'Coupon added','_cartid':cartid},'passive');
							app.model.dispatchThis('passive');
							}
						if(_gaq)	{
							_gaq.push(['_trackEvent','Checkout','User Event','Cart updated - coupon added']);
							}
						}
					}});
				
				app.ext.order_create.u.handleCommonPanels($form);
				app.model.dispatchThis('immutable');
				}, //execCouponAdd

			execGiftcardAdd : function($ele,p)	{
				var $fieldset = $ele.closest('fieldset'),
				cartid = $ele.closest("[data-app-role='checkout']").data('cartid'),
				$input = $("[name='giftcard']",$fieldset);
				
				if($ele.is('button')){$ele.button('disable');}
//update the panel only on a successful add. That way, error messaging is persistent. success messaging gets nuked, but coupon will show in cart so that's okay.
				app.ext.cco.calls.cartGiftcardAdd.init($input.val(),cartid,{"callback":function(rd){
					if(app.model.responseHasErrors(rd)){
						$fieldset.anymessage({'message':rd});
						}
					else	{
						$input.val(''); //reset input
						$fieldset.anymessage(app.u.successMsgObject('Your giftcard has been added.'));
//if a cart messenger is open, log the cart update.
						if(cartid && app.u.thisNestedExists('app.ext.cart_message.vars.carts.'+cartid))	{
							app.model.addDispatchToQ({'_cmd':'cartMessagePush','what':'cart.update','description':'Giftcard added','_cartid':cartid},'passive');
							app.model.dispatchThis('passive');
							}
						if(_gaq)	{
							_gaq.push(['_trackEvent','Checkout','User Event','Cart updated - giftcard added']);
							}
						}
					}});
				app.ext.order_create.u.handleCommonPanels($input.closest('form'));
				app.model.dispatchThis('immutable');
				}, //execGiftcardAdd

			execInvoicePrint : function($ele,p)	{
				app.u.printByjqObj($ele.closest("[data-app-role='invoiceContainer']"));
				}, //execInvoicePrint

			showBuyerAddressAdd : function($ele)	{
				var
					$checkoutForm = $ele.closest('form'), //used in some callbacks later.
					$checkoutAddrFieldset = $ele.closest('fieldset'),
					addressType = $ele.data('app-addresstype').toLowerCase();
				if(app.u.thisIsAnAdminSession())	{
					var $D = app.ext.admin_customer.a.createUpdateAddressShow({'mode':'create','show':'dialog','type':addressType});
					}
				else	{
					app.ext.store_crm.u.showAddressAddModal({'addressType':addressType},function(rd,serializedForm){
//by here, the new address has been created.
//set appropriate address panel to loading.
					app.ext.order_create.u.handlePanel($checkoutForm,$checkoutAddrFieldset.data('app-role'),['showLoading']);
//update cart and set shortcut as address.
					var updateObj = {'_cartid':$ele.closest("[data-app-role='checkout']").data('cartid')}
					updateObj[addressType+'/shortcut'] = serializedForm.shortcut;
					app.ext.cco.calls.cartSet.init(updateObj,{},'immutable');

//update DOM/input for shortcut w/ new shortcut value.
					$("[name='"+addressType+"/shortcut']",$checkoutForm);

//get the updated address list and update the address panel.
					app.model.destroy('buyerAddressList');
					app.calls.buyerAddressList.init({'callback':function(rd){
						app.ext.order_create.u.handlePanel($checkoutForm,$checkoutAddrFieldset.data('app-role'),['empty','translate','handleDisplayLogic']);
						}},'immutable');

//update appropriate address panel plus big three.
					app.ext.order_create.u.handleCommonPanels($checkoutForm);
					app.model.dispatchThis('immutable');
					});
					}
				}, //showBuyerAddressAdd

			showBuyerAddressUpdate : function($ele,p)	{
				p = p || {};
				var $checkoutForm = $ele.closest('form'), //used in some callbacks later.
				$checkoutAddrFieldset = $ele.closest('fieldset');

				var addressType = $ele.closest("[data-app-addresstype]").data('app-addresstype');
				
				app.ext.store_crm.u.showAddressEditModal({
					'addressID' : $ele.closest("address").data('_id'),
					'addressType' : addressType,
					'validateForm' : $ele.data('validate-form')
					},function(){
//by here, the new address has been edited.
//set appropriate address panel to loading.
//editing and address does NOT auto-select it.
					app.ext.order_create.u.handlePanel($checkoutForm,$checkoutAddrFieldset.data('app-role'),['showLoading']);

//get the updated address list and update the address panel.
					app.model.destroy('buyerAddressList');
					app.calls.buyerAddressList.init({'callback':function(rd){
						app.ext.order_create.u.handlePanel($checkoutForm,$checkoutAddrFieldset.data('app-role'),['empty','translate','handleDisplayLogic']);
						}},'immutable');

					app.model.dispatchThis('immutable');
					})
				}, //showBuyerAddressUpdate

			tagAsAccountCreate : function($ele,p)	{
				var $checkout = $ele.closest("[data-app-role='checkout']");
				app.ext.cco.calls.cartSet.init({'_cartid':$checkout.data('cartid'),'want/create_customer': $ele.is(':checked') ? 1 : 0}); //val of a cb is on or off, but we want 1 or 0.
				app.model.destroy('cartDetail|'+$checkout.data('cartid'));
				app.ext.order_create.u.handlePanel($ele.closest('form'),'chkoutPreflight',['handleDisplayLogic']);
				app.calls.cartDetail.init($checkout.data('cartid'),{'callback':function(rd){
					app.ext.order_create.u.handlePanel($ele.closest('form'),'chkoutAccountCreate',['handleDisplayLogic']);
					}},'immutable');
				app.model.dispatchThis('immutable');
				}, //tagAsAccountCreate

			tagAsBillToShip : function($ele,p)	{
				var $form = $ele.closest('form');
				app.ext.cco.calls.cartSet.init({'want/bill_to_ship':($ele.is(':checked')) ? 1 : 0,_cartid : $ele.closest("[data-app-role='checkout']").data('cartid')},{},'immutable'); //adds dispatches.
//when toggling back to ship to bill, update shipping zip BLANK to re-compute shipping.
// re-render the panel as well so that if bill to ship is unchecked, the zip has to be re-entered. makes sure ship quotes are up to date.
// originally, had ship zip change to bill instead of blank, but seemed like there'd be potential for a buyer to miss that change.
				if($ele.is(':checked'))	{
// -> Sanitize is here to address bug where if ship to bill is disabled, shipping is populated, then ship to bill is re-enabled, bill address is not used for shipping quotes (entered ship address is)
// all panels get updated because shipping, totals and potentially payment methods can be impacted by ship country.
					app.ext.cco.u.sanitizeAndUpdateCart($form,{
						'callback':'updateAllPanels',
						'extension' : 'order_create'
						});
					}
				else	{
					app.ext.order_create.u.handlePanel($form,'chkoutAddressShip',['handleDisplayLogic']);
					}
				app.ext.order_create.u.handleCommonPanels($form);
				app.model.dispatchThis('immutable');
				} //tagAsBillToShip
			},


////////////////////////////////////   						util [u]			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
			
//Combines the various data objects into one, so that they can be fed into the translator and rendered in one pass.
			extendedDataForCheckout : function(cartID)	{
//				app.u.dump("BEGIN order_create.u.extendedDataForCheckout - 2013-04-13");
//				app.u.dump("app.data.cartDetail:"); app.u.dump(app.data.cartDetail);
				var obj = {};
				if(cartID)	{
					if(app.u.thisIsAnAdminSession())	{
						//can skip all the paypal code in an admin session. it isn't a valid payment option.
						if(app.data['cartDetail|'+cartID] && app.data['cartDetail|'+cartID].customer && app.data['cartDetail|'+cartID].customer.cid && app.data['adminCustomerDetail|'+app.data['cartDetail|'+cartID].customer.cid])	{
							//change this so object stores the data how buyerAddressList and buyerWalletList would.
							obj = app.data['adminCustomerDetail|'+app.data['cartDetail|'+cartID].customer.cid];
							}
						$.extend(true,obj,app.data['appPaymentMethods|'+cartID],app.data['appCheckoutDestinations|'+cartID],app.data['cartDetail|'+cartID]);
						}
					else	{
						if(app.u.buyerIsAuthenticated())	{
		//					app.u.dump(" -> buyer is authenticated");
							$.extend(true,obj,app.data['appPaymentMethods|'+cartID],app.data['appCheckoutDestinations|'+cartID],app.data.buyerAddressList,app.data.buyerWalletList,app.data['cartDetail|'+cartID]);
							}
						else	{
		//					app.u.dump(" -> buyer is not authenticated.");
							$.extend(true,obj,app.data['appPaymentMethods|'+cartID],app.data['appCheckoutDestinations|'+cartID],app.data['cartDetail|'+cartID]);
							}

//when a buyer returns from paypal, the shipping is populated, but the billing is not always.
//this will put the ship info into the bill fields if they're blank.
						if(app.ext.cco.u.thisSessionIsPayPal())	{
		//					app.u.dump(" -> session is paypal. copy some data around.");
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
//				app.u.dump("END order_create.u.extendedDataForCheckout");
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
//actions is what needs to happen. an array.  accepted values are empty, showLoading, addAppEvents, translate and handleDisplayLogic. ex: ['translate','handleDisplayLogic']
//actions are rendered in the order they're passed.

			handlePanel : function($context, role, actions)	{
//				app.u.dump("BEGIN handlePanel"); //app.u.dump(actions);

				if($context && role && actions && typeof actions === 'object')	{
//					app.u.dump(" -> role: "+role);
					var L = actions.length,
					formObj = $context.is('form') ? $context.serializeJSON() : $("form",$context).serializeJSON(),
					cartID = $context.closest("[data-app-role]").data('cartid'),
					$fieldset = $("[data-app-role='"+app.u.jqSelector('',role)+"']",$context),
					ao = {};

					ao.showLoading = function (formObj, $fieldset){$(".panelContent",$fieldset).showLoading({'message':'Fetching updated content'})},
					ao.hideLoading = function (formObj, $fieldset){$(".panelContent",$fieldset).hideLoading()},
					ao.empty = function(formObj, $fieldset){$(".panelContent",$fieldset).empty()},
					ao.handleDisplayLogic = function(formObj, $fieldset){
						if(typeof app.ext.order_create.panelDisplayLogic[role] === 'function')	{
							app.ext.order_create.panelDisplayLogic[role](formObj,$fieldset);
							}
						else	{
							$fieldset.anymessage({'message':'In order_create.u.handlePanel, panelDisplayLogic['+role+'] not a function','gMessage':true});
							}
						}, //perform things like locking form fields, hiding/showing the panel based on some setting. never pass in the setting, have it read from the form or cart.
					ao.translate = function(formObj, $fieldset)	{
//						app.u.dump(" -> translating "+role);
//						app.u.dump("app.ext.order_create.u.extendedDataForCheckout()"); app.u.dump(app.ext.order_create.u.extendedDataForCheckout());
						$fieldset.anycontent({'data' : app.ext.order_create.u.extendedDataForCheckout(cartID)});
						} //populates the template.
					
					for(var i = 0; i < L; i += 1)	{
						if(typeof ao[actions[i]] === 'function'){
							ao[actions[i]](formObj, $fieldset);
							}
						else	{
							$('#globalMessaging').anymessage({'message':"In order_create.u.handlePanel, undefined action ["+actions[i]+"]",'gMessage':true});
							}
						app.u.handleButtons($fieldset);
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
//				app.u.dump(" -> handleCommonPanels cartID: "+cartid);
				if(cartid)	{
					app.ext.order_create.u.handlePanel($context,'chkoutMethodsShip',['showLoading']);
					app.ext.order_create.u.handlePanel($context,'chkoutMethodsPay',['showLoading']);
					app.ext.order_create.u.handlePanel($context,'chkoutCartSummary',['showLoading']);
					
					app.model.destroy('cartDetail|'+cartid);
					app.ext.cco.calls.appPaymentMethods.init({_cartid:cartid},{},'immutable'); //update pay and ship anytime either address changes.
					app.calls.cartDetail.init(cartid,{'callback':function(){
	//					app.u.dump('cartDetail: '); app.u.dump(app.data.cartDetail);
						app.ext.order_create.u.handlePanel($context,'chkoutMethodsShip',['empty','translate','handleDisplayLogic']);
						app.ext.order_create.u.handlePanel($context,'chkoutMethodsPay',['empty','translate','handleDisplayLogic']);
						app.ext.order_create.u.handlePanel($context,'chkoutCartSummary',['empty','translate','handleDisplayLogic']);
						//in an admin session, the cart contents are updated much more frequently because the 'cart' is editable.
						//if a storefront offers an editable cart within checkout, then remove the if around the chkoutCartItemsList update.
						if(app.u.thisIsAnAdminSession())	{
							app.ext.order_create.u.handlePanel($context,'chkoutCartItemsList',['empty','translate','handleDisplayLogic']);
							}
						}},'immutable');
					}
				else	{
					$context.anymessage({'message':'In order_create.u.handleCommonPanels, unable to ascertain cartid [closest(data-app-role="checkout").length: '+$context.closest("[data-app-role='checkout']").length+'] ','gMessage':true})
					}
				}, //handleCommonPanels



			handlePaypalInit : function($context)	{
//				app.u.dump("BEGIN order_create.u.handlePaypalInit");
//paypal code need to be in this startCheckout and not showCheckoutForm so that showCheckoutForm can be 
// executed w/out triggering the paypal code (which happens when payment method switches FROM paypal to some other method) because
// the paypalgetdetails cmd only needs to be executed once per session UNLESS the cart contents change.
//calls are piggybacked w/ this. do not add dispatch here.
				var token = app.u.getParameterByName('token');
				var payerid = app.u.getParameterByName('PayerID');
//				app.u.dump(" -> aValidPaypalTenderIsPresent(): "+app.ext.cco.u.aValidPaypalTenderIsPresent());
				if(token && payerid)	{
//					app.u.dump(" -> both token and payerid are set.");
					if(app.ext.cco.u.aValidPaypalTenderIsPresent())	{
						app.u.dump(" -> token and payid are set but a valid paypal tender is already present.");
						} //already have paypal in paymentQ. could be user refreshed page. don't double-add to Q.
					else	{
						$context.anymessage({'message':'Welcome Back! you are almost done. Simply verify the information below and push the place order button to complete your transaction.','iconClass':'ui-icon-check','containerClass':'ui-state-highlight ui-state-success'});
						app.u.dump("It appears we've just returned from PayPal.");
						app.ext.order_create.vars['payment-pt'] = token;
						app.ext.order_create.vars['payment-pi'] = payerid;
						
						app.ext.cco.calls.cartPaymentQ.init({"cmd":"insert","PT":token,"ID":token,"PI":payerid,"TN":"PAYPALEC",'_cartid':$context.closest("[data-app-role='checkout']").data('cartid')},{"extension":"order_create","callback":"handlePayPalIntoPaymentQ",'jqObj':$context});
						}
					}
//if token and/or payerid is NOT set on URI, then this is either not yet a paypal order OR is/was paypal and user left checkout and has returned.
				else if(app.ext.cco.u.thisSessionIsPayPal())	{
					app.u.dump(" -> no token or payerid set. nuke all paypal if present.");
					if(!app.ext.cco.u.aValidPaypalTenderIsPresent())	{
						app.u.dump(" -> validPayalTender found. Nuke it.");
						app.ext.cco.u.nukePayPalEC();
						//update the panels too so that the ship/billing is 'unlocked' and payments get updated.
						app.ext.order_create.u.handleCommonPanels($form);
						app.calls.ping.init({callback:function(){
							app.ext.order_create.u.handlePanel($form,'chkoutAddressBill',['empty','translate','handleDisplayLogic']);
							app.ext.order_create.u.handlePanel($form,'chkoutAddressShip',['empty','translate','handleDisplayLogic']);
							}},'immutable');
						app.model.dispatchThis('immutable');
						}
					app.u.dump(" -> paypal nuked ");
					}
				else	{
					//do nothing.
					}
//				app.u.dump("END order_create.u.handlePaypalInit");
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
					
					var $supplementalOutput = app.ext.cco.u.getSupplementalPaymentInputs($input.val(),app.ext.order_create.vars[cartID].payment);
					if($supplementalOutput)	{
						$label.addClass("ui-state-active ui-corner-top");
						$supplementalOutput.addClass('ui-corner-bottom ui-widget ui-widget-content').appendTo($pmc);
						}
					else	{
						$label.addClass("ui-state-active ui-corner-all");
						}
					app.ext.order_create.u.handlePlaceholder($pmc);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In cco.u.showSupplementalInputs, $input not defined or not a jquery object.','gMessage':true});
					}

				}, //showSupplementalInputs
			
		
// *** 201338 -> new means for executing ROI tracking codes.
			//pass in what is returned after order create in @TRACKERS
			scripts2iframe : function(arr)	{
				app.u.dump('running scripts2iframe');
				if(typeof window.scriptCallback == 'function')	{}
				else	{
					window.scriptCallback = app.ext.order_create.u.scriptCallback; //assigned global scope to reduce likely hood of any errors resulting in callback.
					app.u.dump(" -> typeof window.scriptCallback: "+typeof window.scriptCallback);
					}
				if(typeof arr == 'object' && !$.isEmptyObject(arr))	{

	var L = arr.length;
	for(var i = 0; i < L; i++)	{
//adding to iframe gives us an isolation layer
//data-script-id added so the iframe can be removed easily later.
		arr[i].id = 'iframe_3ps_'+i
		$("<iframe \/>",{'id':arr[i].id}).attr({'data-script-id':arr[i].owner,'height':1,'width':1}).css({'display':'none'}).appendTo('body'); // -> commented out for testing !!!
/*
the timeout is added for multiple reasons.
1.  jquery needed a moment between adding the iframe to the DOM and accessing it's contents.
2.  by adding some time between each interation (100 * 1), if there's a catastrophic error, the next code will still run.
*/
  		setTimeout(function(thisArr){
			var $iframe = $('#'+thisArr.id).contents().find("html");
			$iframe.append(thisArr.script);
/// hhhmmm... some potential problems with this. non-script based output. sequence needs to be preserved for includes and inline.

/*			var $div = $("<div \/>").append(thisArr.script); //may contain multiple scripts.
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
*/			},(100 * (i + 1)),arr[i])
		} 
					}
				else	{
					//didn't get anything or what we got wasn't an array.
					}
				},

//is executed if one of the ROI scripts contains a javascript error (fails in the 'try').
			scriptCallback : function(owner,err)	{
app.u.dump("The script for "+owner+" Contained an error and most likely did not execute properly. (it failed the 'try').","warn");
app.model.addDispatchToQ({
	'_cmd':'appAccidentDataRecorder',
	'owner' : owner,
	'app' : '1pc', //if the API call logs the clientid, this won't be necessary.
	'category' : '@TRACKERS',
	'scripterr' : err,
	'_tag':	{
		'callback':'suppressErrors'
		}
	},'passive');
app.model.dispatchThis('passive');
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
	//onClick event is added through an app-event. allows for app-specific events.
							$r.append("<div class='headerPadding' data-app-role='paymentMethodContainer'><label><input type='radio' name='want/payby' value='"+pMethods[i].id+"' />"+pMethods[i].pretty+"<\/label></div>");
							}
						}
					else	{
						app.u.dump("No payment methods are available. This happens if the session is non-secure and CC is the only payment option. Other circumstances could likely cause this to happen too.",'warn');
						
						$r.append("<p>It appears no payment options are currently available.<\/p>");
						if(document.location.protocol != "https:")	{
							$r.append("This session is <b>not secure</b>, so credit card payment is not available.");
							}
						}
					if(payby)	{
						$("input[value='"+payby+"']",$r).prop('checked','checked').closest('label').addClass('selected ui-state-active')
						}	
				return $r.children();
				}


			}, // u/utilities




////////////////////////////////////   						renderFormats			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



		renderFormats : {
//pass the cart(cart/cartid); in for the databind var. Multiple pieces of data are required for this render format (want/shipping_id and @SHIPMETHODS).
			shipMethodsAsRadioButtons : function($tag,data)	{
				var o = '',sMethods,L;
				sMethods = data.value['@SHIPMETHODS'];
				if(sMethods && sMethods.length)	{
					L = sMethods.length;
					for(var i = 0; i < L; i += 1)	{
						o += "<li class='headerPadding'><label><input type='radio'  name='want/shipping_id' value='"+sMethods[i].id+"' ";
						o += "/>"+(sMethods[i].pretty ? sMethods[i].pretty : sMethods[i].name)+": <span >"+app.u.formatMoney(sMethods[i].amount,'$','',false)+"<\/span><\/label><\/li>";
						}
					}
				else	{
					//Currently, checkout handles this on it's own. if something is added here, test checkout to make sure warnings are not appearing twice.
					}
				$tag.html(o);
				if(data.value.want && data.value.want.shipping_id)	{
					$("input[value='"+data.value.want.shipping_id+"']",$tag).prop('checked','checked').closest('li').addClass('selected ui-state-active');
					}
				}, //shipMethodsAsRadioButtons

			payMethodsAsRadioButtons : function($tag,data)	{
//				app.u.dump('BEGIN app.ext.order_create.renderFormats.payOptionsAsRadioButtons');
//				app.u.dump(data);
				var o = '', cartData,pMethods;
				if(app.data['cartDetail|'+data.value] && app.data['appPaymentMethods|'+data.value])	{
					cartData = app.data['cartDetail|'+data.value];
					pMethods = app.data['appPaymentMethods|'+data.value]['@methods'];
					o = app.ext.order_create.u.buildPaymentOptionsAsRadios(pMethods,cartData.want.payby);
					$(":radio",o).each(function(){
						$(this).attr('data-app-change','order_create|shipOrPayMethodSelectExec');
						});
					}
				else	{
					o = $("<div \/>").anymessage({'persistent':true,'message':'In order_create.renderFormats.payMethodsAsRadioButtons, cartDetail|'+data.value+' ['+( typeof app.data['cartDetail|'+data.value] )+'] and/or appPaymentMethods|'+data.value+' ['+( typeof app.data['appPaymentMethods|'+data.value] )+'] not found in memory. Both are required.','gMessage':true});
					}
				$tag.html(o);
				} //payMethodsAsRadioButtons
			

			
			} //renderFormats

		
		}
	return r;
	}