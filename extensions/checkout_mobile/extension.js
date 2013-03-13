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
			checkout : function($form)	{
				var r = undefined; //what is returned. Either true or false.
				if($form)	{
					
					var formObj = $form.serializeJSON(), //done here and passed into validation funcitons so serialization only occurs once. (more efficient)
					$fieldsets = $('fieldset[data-app-role]',$form), //The number of fieldsets. must match value of sum to be valid.
					sum = 0,
					errors = "";
					
					$fieldsets.each(function(){
						
						var $fieldset = $(this),
						role = $(this).data('app-role');
						
						if(role && typeof app.ext.convertSessionToOrder.validate[role] === 'function')	{
							sum += app.ext.convertSessionToOrder.validate[role]($fieldset,formObj);
							}
						else	{
							errors += "<div>validate role ["+role+"] is not a function<\/div>";
							}
						});
					
					
					if(errors != '')	{
						r = false;
						$('#globalMessaging').anymessage({'message':'In convertSessionToOrder.validate.checkout, the following errors occured:<br>'+errors,'gMessage':true});
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
					$('#globalMessaging').anymessage({'message':'In convertSessionToOrder.validate.checkout, $form was not passed.','gMessage':true});
					}

				return r;
				}, //isValid
//validation function should be named the same as the data-app-role of the fieldset. 

			chkoutPreflight : function($fieldset,formObj)	{
				var valid = undefined; //used to return validation state. 0 = false, 1 = true. integers used to sum up panel validation.
				
				if($fieldset && formObj)	{
					if(app.u.validateForm($fieldset))	{valid = 1;} //the validateForm field takes care of highlighting necessary fields and hints.
					else {valid = 0}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In convertSessionToOrder.validate.chkoutPreflight, $form or formObj not passed.','gMessage':true});
					}
				app.u.dump(" -> cs2o.validate.chkoutPreflight: "+valid);
				return valid;
				}, //chkoutPreflightFieldset


			chkoutAccountCreate : function($fieldset,formObj)	{
				var valid = undefined; //used to return validation state. 0 = false, 1 = true. integers used to sum up panel validation.
				
				if($fieldset && formObj)	{
					if(!formObj['want/create_customer'])	{valid = 1}
					else if(app.u.validateForm($fieldset))	{
						if(formObj['want/new_password'] == formObj['want/new_password2'])	{valid = 1;}
						else	{
							valid = 0;
							$fieldset.anymessage({'persistant':true,'message':'Password and verify password must match'});
							}
						} //the validateForm field takes care of highlighting necessary fields and hints.
					else	{valid = 0;} //didn't pass the basic validation.
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In convertSessionToOrder.validate.chkoutAccountCreate, $form or formObj not passed.','gMessage':true});
					}
				app.u.dump(" -> cs2o.validate.chkoutAccountCreate: "+valid);
				return valid;
				}, //validate.chkoutAccountInfoFieldset
				
//make sure a shipping method is selected
			chkoutMethodsShip : function($fieldset,formObj)	{
				var valid = undefined;
				if($fieldset && formObj)	{
					if($("[name='want/shipping_id']:checked").length)	{
						if(app.u.validateForm($fieldset)){valid = 1;}
						else	{valid = 0;}
						}
					else	{
						valid = 0;
						$fieldset.anymessage({'message':'Please select a shipping method','persistant':true})
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In convertSessionToOrder.validate.chkoutMethodsShip, $form or formObj not passed.','gMessage':true});
					}

				app.u.dump(" -> cs2o.validate.chkoutMethodsShip: "+valid);
				return valid;
				}, //validate.chkoutShipMethodsFieldset
				
//in addition to selecting a pay option, certain extra fields may be present and must be checked for.
			chkoutMethodsPay : function($fieldset,formObj)	{
				var valid = undefined;
				if($fieldset && formObj)	{
					if($('[name="want/payby"]:checked',$fieldset).length)	{
						valid = 1;
						}
					else	{
						valid = 0;
						$fieldset.anymessage({'message':'Please select a payment method','persistant':true})
						}
					}
				else	{
					valid = 0;
					$('#globalMessaging').anymessage({'message':'In convertSessionToOrder.validate.chkoutMethodsPay, $form or formObj not passed.','gMessage':true});
					}
				app.u.dump(" -> cs2o.validate.chkoutMethodsPay: "+valid);
				return valid;
				}, //chkoutPayOptionsFieldset
				
			chkoutAddressBill: function($fieldset,formObj)	{
				var valid = undefined;

				if($fieldset && formObj)	{
					
					if(formObj['bill/shortcut'])	{valid = 1}
					else	{

//handle phone number input based on zGlobals setting.
						if(zGlobals && zGlobals.checkoutSettings && zGlobals.checkoutSettings.chkout_phone == 'REQUIRED')	{
							$("input[name='bill/phone']",$fieldset).attr('required','required');
							}
						else	{
							$("input[name='bill/phone']",$fieldset).removeAttr('required');
							}

//postal and region are only required for domestic orders.	
						if($("input[name='bill/countrycode']",$fieldset).val == "US")	{
							$("input[name='bill/postal']",$fieldset).attr('required','required');
							$("input[name='bill/region']",$fieldset).attr('required','required');
							}
						else	{
							$("input[name='bill/postal']",$fieldset).removeAttr('required');
							$("input[name='bill/region']",$fieldset).removeAttr('required');
							}
						
						if(app.u.validateForm($fieldset))	{valid = 1;} //the validateForm field takes care of highlighting necessary fields and hints.
						else {valid = 0}
						}
					}
				else	{
					valid = 0;
					$('#globalMessaging').anymessage({'message':'In convertSessionToOrder.validate.chkoutAddressBill, $form or formObj not passed.','gMessage':true});
					}

				app.u.dump(" -> cs2o.validate.chkoutAddressBill: "+valid);
				return valid;
				}, //chkoutBillAddressFieldset
				
			chkoutAddressShip: function($fieldset,formObj)	{
				var valid = undefined;

				if($fieldset && formObj)	{
					
					if(formObj['want/bill_to_ship'])	{valid = 1}
					else if(formObj['ship/shortcut'].val())	{valid = 1}
					else	{

//postal and region are only required for domestic orders.	
						if($("input[name='ship/countrycode']",$fieldset).val == "US")	{
							$("input[name='ship/postal']",$fieldset).attr('required','required');
							$("input[name='ship/region']",$fieldset).attr('required','required');
							}
						else	{
							$("input[name='ship/postal']",$fieldset).removeAttr('required');
							$("input[name='ship/region']",$fieldset).removeAttr('required');
							}
						
						if(app.u.validateForm($fieldset))	{valid = 1;} //the validateForm field takes care of highlighting necessary fields and hints.
						else {valid = 0}
						}
					}
				else	{
					valid = 0;
					$('#globalMessaging').anymessage({'message':'In convertSessionToOrder.validate.chkoutAddressShip, $form or formObj not passed.','gMessage':true});
					}

				app.u.dump(" -> cs2o.validate.chkoutAddressShip: "+valid);
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
				},				
				
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
					$("[data-app-role='addressExists']",$fieldset).show();
					$("[data-app-role='addressNew']",$fieldset).hide();
					if(formObj['bill/shortcut'])	{
//highlight the checked button of the address selected.<<
						$("[data-_id='"+formObj['bill/shortcut']+"'] button",$fieldset).addClass('ui-state-highlight'); 
						}
					}
				else	{
					$("[data-app-role='addressExists']",$fieldset).hide();
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
					$("[data-app-role='addressExists']",$fieldset).show();
					//need logic here to select address if only 1 predefined exists.
					$("[data-app-role='addressNew']",$fieldset).hide();
					if(formObj['ship/shortcut'])	{
						$("[data-_id='"+formObj['bill/shortcut']+"'] button",$fieldset).addClass('ui-state-highlight');
						}
					}
				else	{
					$("[data-app-role='addressExists']",$fieldset).hide();
					$("[data-app-role='addressNew']",$fieldset).show();
//from a usability perspective, we don't want a single item select list to show up. so hide if only 1 or 0 options are available.
					if(app.data.appCheckoutDestinations['@destinations'].length < 2)	{
						$("[data-app-role='shipCountry']",$fieldset).hide();
						}
					}
				}, //chkoutAddressShip

			chkoutMethodsShip : function(formObj,$fieldset)	{
//				app.u.dump('BEGIN app.ext.convertSessionToOrder.panelContent.shipMethods');

				var shipMethods = app.data.cartDetail['@SHIPMETHODS'],
				L = shipMethods.length;

//must appear after panel is loaded because otherwise the divs don't exist.
//per brian, use shipping methods in cart, not in shipping call.
				if(L == 0 && app.u.buyerIsAuthenticated())	{
					if(formObj['want/bill_to_ship'] && app.ext.cco.u.buyerHasPredefinedAddresses('bill') == true){
						$fieldset.prepend("<p>Please select an address for a list of shipping options.</p>");
						}
					else if(!formObj['want/bill_to_ship'] && app.ext.cco.u.buyerHasPredefinedAddresses('ship') == true){
						$fieldset.prepend("<p>Please select an address for a list of shipping options.</p>");
						}
					else	{
						$fieldset.prepend("<p>Please enter an address for a list of shipping options.</p>");
						}
					}
				else if(L == 0) {
					$fieldset.prepend("<p>Please enter an address for a list of shipping options.</p>");
					}
				else	{
					//can only get here if shipping options are available.
					//the renderformat handles selecting the shipping option.
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
//the renderformat will handle the checked=checked. however some additional payment inputs may need to be added. that happens here.
				if(formObj['want/payby'])	{
					
					}
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
				app.u.dump(" -> app.u.buyerIsAuthenticated(): "+app.u.buyerIsAuthenticated());

				if($chkContainer && $chkContainer.length)	{
					$chkContainer.empty();
					$chkContainer.showLoading({'message':'Fetching cart contents and payment options'});

					if(app.u.buyerIsAuthenticated())	{
						
						app.calls.buyerAddressList.init({'callback':'suppressErrors'},'immutable');
						app.calls.buyerWalletList.init({'callback':'suppressErrors'},'immutable');
						
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


//applied to inputs like coupon and giftcard so that when 'enter' is pushed, it triggers a click on the corresponding button.
			addTriggerButtonClick : function($input)	{
				$input.off('keypress.addTriggerButtonClick').on('keypress.addTriggerButtonClick',function(event){
					if(event.keyCode==13){$input.parent().find('button').first().trigger('click')}
					})
				}, //addTriggerButtonClick

//ele is likely a div or section. the element around all the inputs.
			addTriggerPayMethodUpdate : function($ele)	{
				var $fieldset = $ele.closest('fieldset');
				$("input[type='radio']",$ele).each(function(){
					var $input = $(this);
					
					$input.off("change.addTriggerPayMethodUpdate").on("change.addTriggerPayMethodUpdate", function(){
						app.ext.cco.calls.cartSet.init({'want/payby':$input.val()});
						app.model.dispatchThis('immutable'); //any reason to obtain a new cart object here? don't think so.
						app.ext.convertSessionToOrder.u.showSupplementalInputs($input);
						
						});
					})
				}, //addTriggerPayMethodUpdate

			addTriggerShipMethodUpdate : function($ul)	{
				$("input",$ul).each(function(){

					var $rb = $(this), //Radio Button
					shipID = $(this).val();
					
					$rb.off("change.addTriggerShipMethodUpdate").on("change.addTriggerShipMethodUpdate", function(){
						app.calls.cartSet.init({'want/shipping_id':shipID}); 
						//destroys cart and updates big three panels (shipping, payment and summary)
						app.ext.convertSessionToOrder.u.handleCommonPanels($ul.closest('form'));
						app.model.dispatchThis("immutable");
						});
					})
				}, //addTriggerShipMethodUpdate

//triggered on specific address inputs. When an address is updated, several things could be impacted, including tax, shipping options and payment methods.
			execAddressUpdate : function($input)	{
				$input.off('blur.execAddressUpdate').on('blur.execAddressUpdate',function(){
					var obj = {};
					obj[$input.attr('name')] = $input.val();
					app.calls.cartSet.init(obj); //update the cart
					app.ext.convertSessionToOrder.u.handleCommonPanels($input.closest('form'));
					app.model.dispatchThis('immutable');
					})
				}, //execAddressUpdate

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

							app.calls.buyerAddressList.init({'callback':function(){
//no error handling needed. if call fails or returns zero addesses, the function below will just show the new address form.
								app.ext.convertSessionToOrder.u.handlePanel($form,'chkoutAddressBill',['empty','translate','handleDisplayLogic','handleAppEvents']);
								app.ext.convertSessionToOrder.u.handlePanel($form,'chkoutAddressShip',['empty','translate','handleDisplayLogic','handleAppEvents']);
								}},'immutable');

							app.calls.buyerWalletList.init({'callback':function(){
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
					var $form = $btn.closest('form'),
					isValid = app.ext.convertSessionToOrder.validate.checkout($form);
					
					if(isValid)	{alert('do something')}
					else	{
						$('.formValidationError',$form).first().animate({scrollTop : 0},1000); //scroll to first instance of error.
						}
					//app.ext.convertSessionToOrder.calls.processCheckout.init('finishedValidatingCheckout'); app.model.dispatchThis('immutable');
					})
				}, //execCartOrderCreate

			execCountryUpdate : function($sel)	{
				//recalculate the shipping methods and payment options.
				var obj = {};
				obj[$sel.attr('name')] = $sel.val();
				app.calls.cartSet.init(obj); //update the cart w/ the country.
				$sel.off('change.execCountryUpdate').on('change.execCountryUpdate',function(){
					app.ext.convertSessionToOrder.u.handleCommonPanels($sel.closest('form'));
					app.model.dispatchThis('immutable');
					})
				}, //execCountryUpdate

			execCouponAdd : function($btn)	{
				$btn.button();
				$btn.off('click.execCouponAdd').on('click.execCouponAdd',function(event){
					event.preventDefault();
					
					var $fieldset = $btn.closest('fieldset'),
					$form = $input.closest('form'),
					$input = $("[name='coupon']",$fieldset);
					
					$btn.button('disable');
					

//update the panel only on a successful add. That way, error messaging is persistent. success messaging gets nuked, but coupon will show in cart so that's okay.
				
					app.ext.cco.calls.cartCouponAdd.init($input.val(),{"callback":function(rd){

						if(app.model.responseHasErrors(rd)){
							$fieldset.anymessage({'message':rd});
							}
						else	{
							$input.val(''); //reset input only on success.  allows for a typo to be corrected.
							$fieldset.anymessage(app.u.successMsgObject('Your coupon has been added.'));
							app.ext.convertSessionToOrder.u.handlePanel($form,'chkoutCartItemsList',['empty','translate','handleDisplayLogic','handleAppEvents']);
//							_gaq.push(['_trackEvent','Checkout','User Event','Cart updated - coupon added']);
							}

						}});
					app.ext.convertSessionToOrder.u.handleCommonPanels($form);
					app.model.dispatchThis('immutable');
					})
				}, //execCouponAdd

			execGiftcardAdd : function($btn)	{
				$btn.button();
				$btn.off('click.execGiftcardAdd').on('click.execGiftcardAdd',function(event){
					event.preventDefault();
					
					var $fieldset = $btn.closest('fieldset'),
					$input = $("[name='giftcard']",$fieldset);
					
					$btn.button('disable');
					

//update the panel only on a successful add. That way, error messaging is persistent. success messaging gets nuked, but coupon will show in cart so that's okay.
				
					app.ext.cco.calls.cartGiftcardAdd.init($input.val(),{"callback":function(rd){

						if(app.model.responseHasErrors(rd)){
							$fieldset.anymessage({'message':rd});
							}
						else	{
							$input.val(''); //reset input
							$fieldset.anymessage(app.u.successMsgObject('Your giftcard has been added.'));
//							_gaq.push(['_trackEvent','Checkout','User Event','Cart updated - giftcard added']);
							}

						}});
					app.ext.convertSessionToOrder.u.handleCommonPanels($input.closest('form'));
					app.model.dispatchThis('immutable');
					})
				}, //execGiftcardAdd

			showBuyerAddressAdd : function($btn)	{
				console.warn("THIS IS NOT DONE YET. not tested. the cartSet needs a callback to handle the appropriate address panel (which is already in a showLoading state) and clear/populate/etc it. then test.");
				$btn.button();
				
				var $checkoutForm = $btn.closest('form'), //used in some callbacks later.
				$checkoutAddrFieldset = $btn.closest('fieldset');
				
				$btn.off('click.showBuyerAddressAdd').on('click.showBuyerAddressAdd',function(){
					var $addrModal = $('#buyerAddressAdd'),
					addrType = $btn.data('app-addresstype');
					if(addrType && (addrType == 'ship' || addrType == 'bill'))	{
						if($addrModal.length)	{
							$addrModal.empty();
							}
						else	{
							$addrModal = $("<div \/>",{'id':'buyerAddressAdd','title':'Add a new address'}).appendTo('body');
							$addrModal.dialog({autoOpen:false, width:($('body').width < 500) ? '100%' : 500,height:400});
							}
							
						$addrModal.append("<input type='text' maxlength='6' data-minlength='6' name='shortcut' placeholder='address id (6 characters)' \/>");
//checkout destinations passed in so country list populates. nothing else should populate.
//NOTE - the address entry form is the same template used by checkout. do NOT run app-events over it or some undesired behaviors may result.
						$addrModal.anycontent({'templateID':(addrType == 'bill') ? 'chkoutAddressBillTemplate' : 'chkoutAddressShipTemplate','showLoading':'false',data:app.data.appCheckoutDestinations}); 
						$addrModal.wrap("<form>");
						$("<button \/>").text('Save').button().on('click',function(event){
							event.preventDefault();
							var $form = $(this).closest('form'),
							formObj = $form.serializeJSON();
							updateObj = {};
							if(app.u.validateForm($form))	{
								$('body').showLoading({'message':'Adding new address.'});
//create a new address.
								app.calls.buyerAddressAddUpdate.init(formObj,{'callback':function(rd){
									if(app.model.responseHasErrors(rd)){
										$addrModal.anymessage({'message':rd});
										}
									else	{
//by here, the new address has been created.
//set appropriate address panel to loading.
										app.ext.convertSessionToOrder.u.handlePanel($checkoutForm,$checkoutAddrFieldset.data('app-role'),['showLoading']);
//update cart and set shortcut as address.
										updateObj[addrType+'/shortcut'] = formObj.shortcut;
										app.ext.cco.calls.cartSet.init(updateObj,{'callback':function(rd){
											app.ext.convertSessionToOrder.u.handlePanel($checkoutForm,$checkoutAddrFieldset.data('app-role'),['empty','translate','handleDisplayLogic','handleAppEvents']);
											}});

//update DOM/input for shortcut w/ new shortcut value.
										$("[name='"+addrType+"/shortcut']",$checkoutForm);

//update appropriate address panel plus big three.
										app.ext.convertSessionToOrder.u.handleCommonPanels($checkoutForm);
										app.model.dispatchThis('immutable');
//close modal.
										$addrModal.dialog('close');
										
										}
									}},'immutable');
								
								app.model.dispatchThis('immutable'); //send dispatch to create address.

								}
							else	{} //validateForm will display issues.
							}).appendTo($addrModal)
						
						$addrModal.dialog('open');
						}
					else	{
						$btn.closest('fieldset').anymessage({'message':'In convertSessionToOrder.e.showBuyerAddressAdd, addrType is either undefined or an unsupported value ['+addrType+']','gMessage':true});
						}
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
//					app.u.dump("BEGIN handlePanel for role: "+role); //app.u.dump(actions);
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

//run when a payment method is selected or when payment panel is re-rendered.
//Does nothing but handle display.  NO UPDATES. those occur in the app-event on the radio button (which triggers this).
//they don't happen here because this code is executed when the panel is transmogrified.
			showSupplementalInputs : function($input)	{
				if($input && typeof $input === 'object')	{
					$label = $input.closest('label'),
					$fieldset = $input.closest('fieldset'),
					$pmc = $input.closest("[data-app-role='paymentMethodContainer']"); //payment method container. an li or div or row. who knows.
	
	//handle the previously selected payment method.
					$('.ui-state-active',$fieldset).removeClass('ui-state-active ui-corner-top ui-corner-all');
					$("[data-app-role='supplementalPaymentInputsContainer']",$fieldset).empty().remove(); //must be removed so form inputs are not present.
					
					var $supplementalOutput = app.ext.cco.u.getSupplementalPaymentInputs($input.val(),app.ext.convertSessionToOrder.vars);
					if($supplementalOutput)	{
						$label.addClass("ui-state-active ui-corner-top");
						$supplementalOutput.addClass('ui-corner-bottom ui-widget ui-widget-content').appendTo($pmc);
						}
					else	{
						$label.addClass("ui-state-active ui-corner-all");
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In cco.u.showSupplementalInputs, $input not defined or not a jquery object.','gMessage':true});
					}
						
				
//_gaq.push(['_trackEvent','Checkout','User Event','Payment method selected ('+paymentID+')']);
				}, //showSupplementalInputs


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


			handleChangeFromPayPalEC : function()	{
//				app.ext.cco.u.nukePayPalEC(); //kills all local and session paypal payment vars
				app.ext.convertSessionToOrder.u.handlePanel('chkoutPayOptions');
				app.ext.convertSessionToOrder.u.handlePanel('chkoutBillAddress');
				app.ext.convertSessionToOrder.u.handlePanel('chkoutShipAddress');
				app.ext.convertSessionToOrder.u.handlePanel('chkoutShipMethods');
				app.ext.convertSessionToOrder.calls.showCheckoutForm.init();  //handles all calls.
				app.model.dispatchThis('immutable');
				}, //handleChangeFromPayPalEC




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
					if(app.data.cartDetail && app.data.cartDetail.want && app.data.cartDetail.want.shipping_id == id)	{isSelectedMethod =  true;}
					else	{isSelectedMethod =  false;}

					safeid = app.u.makeSafeHTMLId(data.value[i].id);
					shipName = app.u.isSet(data.value[i].pretty) ? data.value[i].pretty : data.value[i].name
					o += "<li class='headerPadding "
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

				var L = data.value.length,
				o = "", //the output appended to $tag
				isSelectedMethod, //toggle t/f in loop based on if iteration is for selected payment method.
				id = ''; //recycled.

//ZERO will be in the list of payment options if customer has a zero due (giftcard or paypal) order.
				if(data.value[0].id == 'ZERO')	{
					$tag.hide(); //hide payment options.
					$tag.append("<div ><input type='radio' name='want/payby'  value='ZERO' checked='checked' \/>"+data.value[i].pretty+"<\/div>");
					}
				else if(L > 0)	{
					for(var i = 0; i < L; i += 1)	{
						id = data.value[i].id;

						if(app.data.cartDetail && app.data.cartDetail.want && app.data.cartDetail.want.payby == id)	{isSelectedMethod =  true;}
						else	{isSelectedMethod =  false;}


//onClick event is added through an app-event. allows for app-specific events.
						o += "<div class='headerPadding' data-app-role='paymentMethodContainer'><label><input type='radio' name='want/payby' value='"+id+"' ";
						if(app.data.cartDetail && app.data.cartDetail.want && app.data.cartDetail.want.payby == id)	{ o += " checked='checked' "}
						o += " />"+data.value[i].pretty+"<\/label></div>";
						}
					$tag.html(o);

//if a payment method has been selected, show the supplemental inputs.
					if(app.data.cartDetail && app.data.cartDetail.want && app.data.cartDetail.want.payby)	{
						var $radio = $("input[value='"+app.data.cartDetail.want.payby+"']",$tag),
						$supplemental = app.ext.convertSessionToOrder.u.showSupplementalInputs($radio,app.ext.convertSessionToOrder.vars);
						
						app.u.dump(" -> $radio.length: "+$radio.length);
						app.u.dump(" -> $supplemental: "+$supplemental);
						if($supplemental)	{
							app.u.dump(" -> payment method HAS supplemental inputs");
							$radio.closest("[data-app-role='paymentMethodContainer']").append($supplemental);
							}
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