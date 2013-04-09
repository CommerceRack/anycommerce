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

var orderCreate = function() {
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
				app.u.dump('BEGIN app.ext.orderCreate.init.onSuccess');
//1PC can't load the templates remotely. causes XSS issue.
				if(app.vars._clientid == '1pc')	{
					app.u.dump(" -> _cliendID = 1pc. load templates from TOXML file");
					app.model.loadTemplates(theseTemplates); //loaded from local file (main.xml)
					}
				else {
					app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/checkout_mobile/templates.html',theseTemplates);
					}
				var r; //returns false if checkout can't load due to account config conflict.
				
				if(typeof _gaq === 'undefined')	{
//					app.u.dump(" -> _gaq is undefined");
					$('#globalMessaging').anymessage({'message':'It appears you are not using the Asynchronous version of Google Analytics. It is required to use this checkout.','uiClass':'error','uiIcon':'alert'});
					r = false;					
					}
//messaging for the test harness 'success'.
				else if(app.u.getParameterByName('_testharness'))	{
					$('#globalMessaging').anymessage({'message':'<strong>Excellent!<\/strong> Your store meets the requirements to use this one page checkout extension.','uiIcon':'circle-check','uiClass':'success'});
					$('#'+app.ext.orderCreate.vars.containerID).append("");
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
//				app.u.dump('END app.ext.orderCreate.init.onSuccess');
				},
			onError : function()	{
				app.u.dump('BEGIN app.ext.orderCreate.callbacks.init.error');
				//This would be reached if a templates was not defined in the view.
				$('#'+app.ext.orderCreate.vars.containerID);
				}
			}, //init

		startCheckout : {
			onSuccess : function(tagObj)	{
				//used for one page checkout only.
				app.u.dump("BEGIN startcheckout callback for legacy 1PC");
				app.ext.orderCreate.a.startCheckout($('#zContent'));
				}
			},

		handleCartPaypalSetECResponse : {
			onSuccess : function(tagObj)	{
				app.u.dump('BEGIN orderCreate[nice].callbacks.handleCartPaypalSetECResponse.onSuccess');
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
				app.u.dump('BEGIN orderCreate[nice].callbacks.handlePayPalIntoPaymentQ.onSuccess');
				app.ext.orderCreate.calls.showCheckoutForm.init();
				app.model.dispatchThis('immutable');
				},
			onError : function(responseData,uuid)	{
				app.u.dump('BEGIN orderCreate[nice].callbacks.handlePayPalIntoPaymentQ.onError');
				responseData['_msg_1_txt'] = "It appears something went wrong with the PayPal payment:<br \/>err: "+responseData['_msg_1_txt'];
				responseData.persistant = true;
				app.u.throwMessage(responseData);
//nuke vars so user MUST go thru paypal again or choose another method.
//nuke local copy right away too so that any cart logic executed prior to dispatch completing is up to date.
				app.ext.cco.u.nukePayPalEC();
				app.ext.orderCreate.calls.showCheckoutForm.init();
				app.model.dispatchThis('immutable');
				}
			},		

//executing this will not only return which items have had an inventory update (in a pretty format) but also create the dispatches
// to update the cart and then to actually update it as well.
// the individual cart update posts (there may be multiple) go without the callback. If callback is added, a ping to execute it is run.
		handleInventoryUpdate : {

			onSuccess : function(_rtag)	{
				var r = false; //if false is returned, then no inventory update occured.
				if(app.data[_rtag.datapointer] && !$.isEmptyObject(app.data[_rtag.datapointer]['%changes']))	{
					var $form = _rtag.jqObj;
					r = "<p>It appears that some inventory adjustments needed to be made:<ul>";
					for(var key in app.data[_rtag.datapointer]['%changes']) {
						r += "<li>sku: "+key+" was set to "+app.data[_rtag.datapointer]['%changes'][key]+" due to availability<\/li>";
						app.calls.cartItemUpdate.init(key,app.data[_rtag.datapointer]['%changes'][key]);
						}
					app.u.dump(" -> SANITY: an extra cartDetail call is occuring because inventory availability required some cartUpdates to occur.");
					app.model.destroy('cartDetail');
					app.calls.cartDetail.init({'callback':function(rd){
						if(app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							app.ext.orderCreate.u.handlePanel($form,'chkoutCartItemsList',['empty','translate','handleDisplayLogic','handleAppEvents']);
							app.ext.orderCreate.u.handlePanel($form,'chkoutCartSummary',['empty','translate','handleDisplayLogic','handleAppEvents']);
							app.ext.orderCreate.u.handlePanel($form,'chkoutMethodsPay',['empty','translate','handleDisplayLogic','handleAppEvents']);
							app.ext.orderCreate.u.handlePanel($form,'chkoutMethodsShip',['empty','translate','handleDisplayLogic','handleAppEvents']);
							}
						}},'immutable');
					app.model.dispatchThis('immutable');
					r += "<\/ul><\/p>";
					$('#globalMessaging').anymessage({'message':r,'persistant':true});
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
//				app.u.dump('BEGIN app.ext.orderCreate.callbacks.checkoutSuccess.onSuccess   datapointer = '+_rtag.datapointer);
				$('body').hideLoading();
//nuke old form content. not needed anymore. gets replaced with invoice-ish content.
				var $checkout = _rtag.jqObj,
				checkoutData = app.data[_rtag.datapointer],
				oldCartID = app.vars.cartID,
				orderID = app.data[_rtag.datapointer].orderid;

// SLIDE UP to top of checkout here.

//show post-checkout invoice and success messaging.
				$checkout.empty();
				$checkout.anycontent({'templateID':'chkoutCompletedTemplate',data: checkoutData}); // $.extend(true,checkoutData,{'invoice':app.data.cartDetail})
				app.u.handleAppEvents($checkout);

				var cartContentsAsLinks = encodeURI(app.ext.cco.u.cartContentsAsLinks('order|'+orderID))
				
				$('.ocmTwitterComment').click(function(){
					window.open('http://twitter.com/home?status='+cartContentsAsLinks,'twitter');
					_gaq.push(['_trackEvent','Checkout','User Event','Tweeted about order']);
					});

//the fb code only works if an appID is set, so don't show banner if not present.				
				if(zGlobals.thirdParty.facebook.appId && typeof FB == 'object')	{
					$('.ocmFacebookComment').click(function(){
						app.thirdParty.fb.postToWall(cartContentsAsLinks);
						_gaq.push(['_trackEvent','Checkout','User Event','FB message about order']);
						});
					}
				else	{$('.ocmFacebookComment').hide()}


//time for some cleanup. Nuke the old cart from memory and local storage, then obtain a new cart.				
				app.model.destroy('cartDetail');
				app.calls.appCartCreate.init(); //!IMPORTANT! after the order is created, a new cart needs to be created and used. the old cart id is no longer valid. 
				app.calls.cartDetail.init({},'immutable');
				app.model.dispatchThis('immutable'); //these are auto-dispatched because they're essential.

_gaq.push(['_trackEvent','Checkout','App Event','Order created']);
_gaq.push(['_trackEvent','Checkout','User Event','Order created ('+orderID+')']);

				if(app.ext.orderCreate.checkoutCompletes)	{
					var L = app.ext.orderCreate.checkoutCompletes.length;
					for(var i = 0; i < L; i += 1)	{
						app.ext.orderCreate.checkoutCompletes[i]({'cartID':oldCartID,'orderID':orderID,'datapointer':_rtag.datapointer});
						}
					}


if(app.vars._clientid == '1pc')	{
//add the html roi to the dom. this likely includes tracking scripts. LAST in case script breaks something.
//this html roi is only generated if clientid = 1PC OR model version is pre 2013. for apps, add code using checkoutCompletes.
	setTimeout(function(){
		$checkout.append(checkoutData['html:roi']);
		app.u.dump('wrote html:roi to DOM.');
		},2000); 
	}
else	{
	//the code below is to disable any links in the payment messaging for apps.
	$("[data-app-role='paymentMessaging'] a",$checkout).on('click',function(event){
		event.preventDefault();
		//cart and order id are in uriParams to keep data locations in sync in showCustomer. uriParams is where they are when landing on this page directly.
		showContent('customer',{'show':'invoice','uriParams':{'cartid':orderCartID,'orderid':orderID}});
		});
	}

				},
			onError : function(rd)	{
				$('body').hideLoading();
				$('#globalMessaging').anymessage(rd);

_gaq.push(['_trackEvent','Checkout','App Event','Order NOT created. error occured. ('+d['_msg_1_id']+')']);

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
				var r = undefined; //what is returned. Either true or false.
				if(app.u.buyerIsAuthenticated())	{r = 1}
				else if($form)	{
					
					var formObj = $form.serializeJSON(), //done here and passed into validation funcitons so serialization only occurs once. (more efficient)
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
						
						if(role && typeof app.ext.orderCreate.validate[role] === 'function')	{
							sum += app.ext.orderCreate.validate[role]($fieldset,formObj);
							}
						else	{
							errors += "<div>validate role ["+role+"] is not a function<\/div>";
							}
						});
					
					
					if(errors != '')	{
						r = false;
						$('#globalMessaging').anymessage({'message':'In orderCreate.validate.checkout, the following errors occured:<br>'+errors,'gMessage':true});
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
					$('#globalMessaging').anymessage({'message':'In orderCreate.validate.checkout, $form was not passed.','gMessage':true});
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
					$('#globalMessaging').anymessage({'message':'In orderCreate.validate.chkoutPreflight, $form or formObj not passed.','gMessage':true});
					}
				app.u.dump(" -> orderCreate.validate.chkoutPreflight: "+valid);
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
					$('#globalMessaging').anymessage({'message':'In orderCreate.validate.chkoutAccountCreate, $form or formObj not passed.','gMessage':true});
					}
				app.u.dump(" -> orderCreate.validate.chkoutAccountCreate: "+valid);
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
					$('#globalMessaging').anymessage({'message':'In orderCreate.validate.chkoutMethodsShip, $form or formObj not passed.','gMessage':true});
					}

				app.u.dump(" -> orderCreate.validate.chkoutMethodsShip: "+valid);
				return valid;
				}, //validate.chkoutShipMethodsFieldset
				
//in addition to selecting a pay option, certain extra fields may be present and must be checked for.
			chkoutMethodsPay : function($fieldset,formObj)	{
				var valid = undefined;
				if($fieldset && formObj)	{
					if($('[name="want/payby"]:checked',$fieldset).length)	{
						if(app.u.validateForm($fieldset))	{valid = 1;}
						else	{valid = 0}
						}
					else	{
						valid = 0;
						$fieldset.anymessage({'message':'Please select a payment method','persistant':true})
						}
					}
				else	{
					valid = 0;
					$('#globalMessaging').anymessage({'message':'In orderCreate.validate.chkoutMethodsPay, $form or formObj not passed.','gMessage':true});
					}
				app.u.dump(" -> orderCreate.validate.chkoutMethodsPay: "+valid);
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
					$('#globalMessaging').anymessage({'message':'In orderCreate.validate.chkoutAddressBill, $form or formObj not passed.','gMessage':true});
					}

				app.u.dump(" -> orderCreate.validate.chkoutAddressBill: "+valid);
				return valid;
				}, //chkoutBillAddressFieldset
				
			chkoutAddressShip: function($fieldset,formObj)	{
				var valid = undefined;

				if($fieldset && formObj)	{
					
					if(formObj['want/bill_to_ship'])	{valid = 1}
					else if(formObj['ship/shortcut'])	{valid = 1}
					else	{

//postal and region are only required for domestic orders.	
						if(formObj['ship/countrycode'] == "US")	{
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
					$('#globalMessaging').anymessage({'message':'In orderCreate.validate.chkoutAddressShip, $form or formObj not passed.','gMessage':true});
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
//				app.u.dump("BEGIN orderCreate.panelDisplayLogic.chkoutPreflight");
//If the user is logged in, no sense showing password or create account prompts.
				if(app.u.buyerIsAuthenticated() || app.ext.cco.u.thisSessionIsPayPal())	{
					app.u.dump(" -> session is authenticated OR this is an authorized paypal transaction.");
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
//				app.u.dump('BEGIN orderCreate.panelDisplayLogic.chkoutAccountCreate');
				
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
				}, //chkoutAccountCreate
				
/*
a guest checkout gets just a standard address entry. 
an existing user gets a list of previous addresses they've used and an option to enter a new address.
*/
			chkoutAddressBill : function(formObj,$fieldset)	{
				if(app.ext.cco.u.thisSessionIsPayPal()){
					$("[data-app-role='addressExists']",$fieldset).hide();
					$("[data-app-role='addressNew']",$fieldset).show();
					
					$("[name='want/bill_to_ship']",$fieldset).attr({'disabled':'disabled'}).removeAttr('checked'); //!! may want to set this to 0 as part of return from paypal scripts.
					//name is provided by facebook and can't be changed.
					$("[name='bill/firstname'], [name='bill/lastname']",$fieldset).attr('disabled','disabled');

					}
				else if(app.u.buyerIsAuthenticated() && app.ext.cco.u.buyerHasPredefinedAddresses('bill') == true)	{
					$("[data-app-role='addressExists']",$fieldset).show();
					$("[data-app-role='addressNew']",$fieldset).hide();
					$("address button[data-app-event='orderCreate|execBuyerAddressSelect']",$fieldset).removeClass('ui-state-highlight').button({icons: {primary: "ui-icon-check"},text:false}); //content was likely cleared, so button() these again.
					if(formObj['bill/shortcut'])	{
						app.u.dump("Bill shortcut is set: "+formObj['bill/shortcut']);
//highlight the checked button of the address selected.<<
						var $button = $("[data-_id='"+formObj['bill/shortcut']+"'] button[data-app-event='orderCreate|execBuyerAddressSelect']",$fieldset).addClass('ui-state-highlight').button( "option", "icons", { primary: "ui-icon-check"} );
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
				
				if(formObj['want/bill_to_ship'] == 'on' && !app.ext.cco.u.thisSessionIsPayPal())	{$fieldset.hide()}
				else	{$fieldset.show()}
				
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
				else if(app.u.buyerIsAuthenticated() && app.ext.cco.u.buyerHasPredefinedAddresses('ship') == true)	{
					$("[data-app-role='addressExists']",$fieldset).show();
					$("[data-app-role='addressNew']",$fieldset).hide();
					$("address button[data-app-event='orderCreate|execBuyerAddressSelect']",$fieldset).removeClass('ui-state-highlight').button({icons: {primary: "ui-icon-check"},text:false}); //content was likely cleared, so button() these again.
					if(formObj['ship/shortcut'])	{
						app.u.dump("Ship shortcut is set: "+formObj['ship/shortcut']);
//highlight the checked button of the address selected.<<
						var $button = $("[data-_id='"+formObj['ship/shortcut']+"'] button[data-app-event='orderCreate|execBuyerAddressSelect']",$fieldset).addClass('ui-state-highlight').button( "option", "icons", { primary: "ui-icon-check"} );
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
//				app.u.dump('BEGIN app.ext.orderCreate.panelContent.shipMethods');

				var shipMethods = app.data.cartDetail['@SHIPMETHODS'],
				L = shipMethods.length;
//if it is decided not to hide the panel, the radio buttons must be locked/disabled.
				if(app.ext.cco.u.thisSessionIsPayPal())	{
					$fieldset.hide();
					}

//must appear after panel is loaded because otherwise the divs don't exist.
//per brian, use shipping methods in cart, not in shipping call.
				else if(L == 0 && app.u.buyerIsAuthenticated())	{
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

			chkoutCartItemsList : function(formObj,$fieldset){
				
				}, //chkoutCartItemsList

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

				if(app.ext.cco.u.thisSessionIsPayPal())	{
//this is a paypal session. payment methods are not available any longer. stored payments are irrelevant. show paymentQ
//also show a message to allow the merchant to remove the paypal payment option and use a different method?
					$("[data-app-role='giftcardContainer']",$fieldset).hide();
					$("[data-app-role='paymentOptionsContainer']",$fieldset).hide();
					$("[data-app-event='orderCreate|execChangeFromPayPal']").show();
					}
				else	{
//if the user is logged in and has wallets, they are displayed in a tabbed format.
					if(app.u.buyerIsAuthenticated() && app.data.buyerWalletList && app.data.buyerWalletList['@wallets'].length)	{
						
						$("[data-app-role='storedPaymentsHeader']",$fieldset).show();
						$("[data-app-role='storedPaymentsContent']",$fieldset).show();
						$("[data-app-role='nonStoredPaymentsHeader']",$fieldset).show();
						$("[data-app-role='nonStoredPaymentsContent']",$fieldset).show();
						
						$("[data-app-role='paymentOptionsContainer']",$fieldset).accordion({
							heightStyle: "content",
						    active: (app.data.cartDetail && app.data.cartDetail.want && app.data.cartDetail.want.payby && app.data.cartDetail.want.payby.indexOf('WALLET') == -1) ? 0 : 1 //unless a buyer has already selected a non-wallet payment method, show stores payments as open.
							});
						}
					else	{
						$("[data-app-role='storedPaymentsHeader']",$fieldset).hide();
						$("[data-app-role='storedPaymentsContent']",$fieldset).hide();
						$("[data-app-role='nonStoredPaymentsHeader']",$fieldset).hide(); //header only needed if stored payments are present.
						$("[data-app-role='nonStoredPaymentsContent']",$fieldset).show();
						}


//if a payment method has been selected, show the supplemental inputs and check the selected payment.
//additionally, if the payment is NOT Purchase Order AND the company field is populated, show the reference # input.
					if(formObj['want/payby'])	{
						var $radio = $("input[value='"+app.data.cartDetail.want.payby+"']",$fieldset),
						$supplemental = app.ext.orderCreate.u.showSupplementalInputs($radio,app.ext.orderCreate.vars);
						$radio.attr('checked','checked');
						if($supplemental)	{
							app.u.dump(" -> payment method HAS supplemental inputs");
							$radio.closest("[data-app-role='paymentMethodContainer']").append($supplemental);
							}
						
						if(formObj['want/payby'] == 'PO')	{
							$("[data-app-role='referenceNumber']",$fieldset).empty(); //nuke the input. the 'name' is shared w/ PO supplemental input
							}
						else if(formObj['bill/company'])	{
							$("[data-app-role='referenceNumber']",$fieldset).show();
							}
						else	{
							$("[data-app-role='referenceNumber']",$fieldset).hide();
							}
						}




					}

				}, //chkoutMethodsPay

			chkoutNotes : function(formObj,$fieldset)	{
				if(zGlobals.checkoutSettings.chkout_order_notes)	{$fieldset.show()}
				else	{$fieldset.hide()}
				} //chkoutNotes

			}, //panelContent
	
//push onto this (orderCreate.checkoutCompletes.push(function(P){});
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
			
			startCheckout : function($chkContainer)	{
				app.u.dump("BEGIN orderCreate.a.startCheckout");
				app.u.dump(" -> app.u.buyerIsAuthenticated(): "+app.u.buyerIsAuthenticated());

				if($chkContainer && $chkContainer.length)	{
					$chkContainer.empty();
					$chkContainer.showLoading({'message':'Fetching cart contents and payment options'});
					if(Number(zGlobals.globalSettings.inv_mode) > 1)	{
						app.u.dump(" -> inventory mode set in such a way that an inventory check will occur.");
						app.ext.cco.calls.cartItemsInventoryVerify.init({'callback':'handleInventoryUpdate','extension':'orderCreate','jqObj':$chkContainer});
						}
					if(app.u.buyerIsAuthenticated())	{
						
						app.calls.buyerAddressList.init({'callback':'suppressErrors'},'immutable');
						app.calls.buyerWalletList.init({'callback':'suppressErrors'},'immutable');
						
						}

					app.ext.cco.calls.appPaymentMethods.init({},{},'immutable');
					app.ext.cco.calls.appCheckoutDestinations.init({},'immutable');
					
					app.model.destroy('cartDetail');
					
					app.ext.orderCreate.u.handlePaypalInit(); //handles paypal code, including paymentQ update.
					
					app.calls.cartDetail.init({'callback':function(rd){
						$chkContainer.hideLoading(); //always hideloading, errors or no, so interface is still usable.
						if(app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							if(app.data.cartDetail['@ITEMS'].length)	{
//NOTE - this should only be done once. panels should be updated individually from there forward.
								$chkContainer.anycontent({'templateID':'checkoutTemplate',data: app.ext.orderCreate.u.extendedDataForCheckout()}); 
								$("fieldset[data-app-role]",$chkContainer).each(function(index, element) {
									var $fieldset = $(element),
									role = $fieldset.data('app-role');
									
									$fieldset.addClass('ui-corner-all');
									$("legend",$fieldset).addClass('ui-widget-header ui-corner-all');
									app.ext.orderCreate.u.handlePanel($chkContainer,role,['handleDisplayLogic','handleAppEvents']);
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
					$('#globalMessaging').anymessage({'message':'in orderCreate.a.startCheckout, no $chkContainer not passed or does not exist.'});
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
						app.ext.orderCreate.u.showSupplementalInputs($input);
						app.ext.orderCreate.u.handlePanel($input.closest('form'),'chkoutCartSummary',['empty','translate','handleDisplayLogic','handleAppEvents']); //for toggling display of ref. # field.
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
						app.ext.orderCreate.u.handleCommonPanels($ul.closest('form'));
						app.model.dispatchThis("immutable");
						});
					})
				}, //addTriggerShipMethodUpdate

//triggered on specific address inputs. When an address is updated, several things could be impacted, including tax, shipping options and payment methods.
			execAddressUpdate : function($input)	{
				$input.off('blur.execAddressUpdate').on('blur.execAddressUpdate',function(){
					var obj = {};
					obj[$input.attr('name')] = $input.val();
					//if bill/ship are the same, duplicate data in both places OR shipping methods won't update.
					if($input.closest('form').find("input[name='want/bill_to_ship']").is(':checked') && $input.attr('name').indexOf('bill/') >= 0)	{
						obj[$input.attr('name').replace('bill/','ship/')] = $input.val();
						}
					app.calls.cartSet.init(obj); //update the cart
					app.ext.orderCreate.u.handleCommonPanels($input.closest('form'));
					app.model.dispatchThis('immutable');
					})
				}, //execAddressUpdate

//executed when an predefined address (from a buyer who is logged in) is selected.
			execBuyerAddressSelect : function($btn)	{
				$btn.button();
				$btn.off('click.execBuyerAddressUpdate').on('click.execBuyerAddressUpdate',function(event){
					event.preventDefault();
					var addressType = $btn.closest('fieldset').data('app-addresstype'), //will be ship or bill.
					$form = $btn.closest('form');
					addressID = $btn.closest('address').data('_id');
					
					if(addressType && addressID)	{
						$("[name='"+addressType+"/shortcut']",$form).val(addressID);
						var cartUpdate = {};
						cartUpdate[addressType+"/shortcut"] = addressID;
						
						if(addressType == 'bill' && $btn.closest('form').find("input[name='want/bill_to_ship']").is(':checked'))	{
//							app.u.dump("Ship to billing address checked. set fields in billing.");
//copy the address into the shipping fields.
							var addrObj = app.ext.cco.u.getAddrObjByID(addressType,addressID); //will return address object.
							if(!$.isEmptyObject(addrObj))	{
								for(index in addrObj)	{
									cartUpdate[index.replace('bill_','ship/')] = addrObj[index];
									}
								}
							}
						
						
						app.calls.cartSet.init(cartUpdate,{'callback':function(){
							app.ext.orderCreate.u.handlePanel($form,(addressType == 'bill') ? 'chkoutAddressBill' : 'chkoutAddressShip',['empty','translate','handleDisplayLogic','handleAppEvents']);
							}}); //no need to populate address fields, shortcut handles that.
						app.ext.orderCreate.u.handleCommonPanels($form);
						app.model.dispatchThis('immutable');
						}
					else	{
						$btn.closest('fieldset').anymessage({'message':'In orderCreate.e.execBuyerAddressSelect','gMessage':true});
						}
					});
				}, //execBuyerAddressSelect

//immediately update cart anytime the email address is added/changed. for remarketing purposes.
//no need to refresh the cartDetail here.
			execBuyerEmailUpdate : function($input)	{
				$input.off('blur.execEmailUpdate').on('blur.execEmailUpdate',function(){
					if(app.u.isValidEmail($input.val()))	{
						app.ext.cco.calls.cartSet.init({'bill/email':$input.val()},{},'immutable');
						app.model.dispatchThis('immutable');
						}
					});
				}, //execBuyerEmailUpdate
			
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
						app.model.destroy('cartDetail');

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
									app.ext.orderCreate.u.handlePanel($form,'chkoutAddressBill',['empty','translate','handleDisplayLogic','handleAppEvents']);
									app.ext.orderCreate.u.handlePanel($form,'chkoutAddressShip',['empty','translate','handleDisplayLogic','handleAppEvents']);
									}},'immutable');
	
								app.calls.buyerWalletList.init({'callback':function(){
//no error handling needed. if call fails or returns zero wallets, the function below will just show the new default payment options.
									app.ext.orderCreate.u.handlePanel($form,'chkoutMethodsPay',['empty','translate','handleDisplayLogic','handleAppEvents']);
									}},'immutable');
								app.model.dispatchThis('immutable');

//no content changes here, but potentially some display changes.
								app.ext.orderCreate.u.handlePanel($form,'chkoutAccountCreate',['handleDisplayLogic']);
//here, content does change. the cart will now contain a username, which is needed on the display.
								app.ext.orderCreate.u.handlePanel($form,'chkoutPreflight',['empty','translate','handleDisplayLogic','handleAppEvents']);
								$fieldset.anymessage({'message':'Thank you, you are now logged in.','_msg_0_type':'success'});
								}
							}});
						app.calls.cartDetail.init({},'immutable'); //update cart so that if successful, the refresh on preflight panel has updated info.
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
				$btn.addClass('ui-state-highlight').button();

				$btn.off('click.execCartOrderCreate').on('click.execCartOrderCreate',function(event){
					event.preventDefault();
					var $form = $btn.closest('form');
					
//if paypalEC is selected, skip validation and go straight to paypal. Upon return, bill and ship will get populated automatically.
					if($("input[name='want/payby']").val() == 'PAYPALEC' && !app.ext.orderCreate.vars['payment-pt'])	{
						$('body').showLoading({'message':'Transferring you to PayPal to authorize payment'});
						app.ext.cco.calls.cartPaypalSetExpressCheckout.init();
						}
					else	{
					
						if(app.ext.orderCreate.validate.checkout($form))	{
							app.ext.orderCreate.u.saveAllCheckoutFields($form);
							app.ext.cco.u.buildPaymentQ();
							app.ext.cco.calls.cartOrderCreate.init({'callback':'cart2OrderIsComplete','extension':'orderCreate','jqObj':$form});
							app.model.dispatchThis('immutable');						
							
							}
						else	{
							//scrolls up to first instance of an error.
							$('html, body').animate({scrollTop : $('.formValidationError, .ui-widget-anymessage',$form).first().offset().top},1000); //scroll to first instance of error.
							}
						}
					})
				}, //execCartOrderCreate

//update the cart. no callbacks or anything like that, just get the data to the api.
//used on notes and could be recyled if needed.
			execCartSet : function($ele)	{
				$ele.off('blur.execCartSet').on('blur.execCartSet',function(){
					var obj = {};
					obj[$ele.attr('name')] = $ele.val();
					app.calls.cartSet.init(obj);
					app.model.dispatchThis('immutable');
					})
				}, //execCartSet

			execChangeFromPayPal : function($ele)	{
				$ele.off('click.execChangeFromPayPal').on('click.execChangeFromPayPal',function(){
					app.ext.cco.u.nukePayPalEC();
					var $form = $ele.closest('form');
					app.model.destroy('cartDetail');
					app.calls.cartDetail.init({callback:function(){
						app.ext.orderCreate.u.handlePanel($form,'chkoutAddressBill',['empty','translate','handleDisplayLogic','handleAppEvents']);
						app.ext.orderCreate.u.handlePanel($form,'chkoutAddressShip',['empty','translate','handleDisplayLogic','handleAppEvents']);
						app.ext.orderCreate.u.handleCommonPanels($form);
						}},'immutable');
					});
					app.model.dispatchThis('immutable');
				
				},

			execCountryUpdate : function($sel)	{
				//recalculate the shipping methods and payment options.
				$sel.off('change.execCountryUpdate').on('change.execCountryUpdate',function(){
					var obj = {};
					obj[$sel.attr('name')] = $sel.val();
					app.calls.cartSet.init(obj); //update the cart w/ the country.
					app.ext.orderCreate.u.handleCommonPanels($sel.closest('form'));
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
							app.ext.orderCreate.u.handlePanel($form,'chkoutCartItemsList',['empty','translate','handleDisplayLogic','handleAppEvents']);
//							_gaq.push(['_trackEvent','Checkout','User Event','Cart updated - coupon added']);
							}

						}});
					app.ext.orderCreate.u.handleCommonPanels($form);
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
					app.ext.orderCreate.u.handleCommonPanels($input.closest('form'));
					app.model.dispatchThis('immutable');
					})
				}, //execGiftcardAdd

			execInvoicePrint : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-print"},text: false});
				
				$btn.off('click.execInvoicePrint').on('click.execInvoicePrint',function(event){
					event.preventDefault();
					app.u.printByjqObj($btn.closest("[data-app-role='invoiceContainer']"));
					});
				
				},

			showBuyerAddressAdd : function($btn)	{
				$btn.button();
				
				var $checkoutForm = $btn.closest('form'), //used in some callbacks later.
				$checkoutAddrFieldset = $btn.closest('fieldset');
				
				$btn.off('click.showBuyerAddressAdd').on('click.showBuyerAddressAdd',function(event){
					event.preventDefault();
					var addressType = $btn.data('app-addresstype').toLowerCase();
					app.ext.store_crm.u.showAddressAddModal({'addressType':addressType},function(rd,serializedForm){
//by here, the new address has been created.
//set appropriate address panel to loading.
						app.ext.orderCreate.u.handlePanel($checkoutForm,$checkoutAddrFieldset.data('app-role'),['showLoading']);
	//update cart and set shortcut as address.
						var updateObj = {}
						updateObj[addressType+'/shortcut'] = serializedForm.shortcut;
						app.ext.cco.calls.cartSet.init(updateObj,{},'immutable');
	
	//update DOM/input for shortcut w/ new shortcut value.
						$("[name='"+addressType+"/shortcut']",$checkoutForm);
	
	//get the updated address list and update the address panel.
						app.model.destroy('buyerAddressList');
						app.calls.buyerAddressList.init({'callback':function(rd){
							app.ext.orderCreate.u.handlePanel($checkoutForm,$checkoutAddrFieldset.data('app-role'),['empty','translate','handleDisplayLogic','handleAppEvents']);
							}},'immutable');
	
	//update appropriate address panel plus big three.
						app.ext.orderCreate.u.handleCommonPanels($checkoutForm);
						app.model.dispatchThis('immutable');
						});
					})
				},

			showBuyerAddressUpdate : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});

				var $checkoutForm = $btn.closest('form'), //used in some callbacks later.
				$checkoutAddrFieldset = $btn.closest('fieldset');

				$btn.off('click.showBuyerAddressUpdate').on('click.showBuyerAddressUpdate',function(){
					
					var addressType = $btn.closest("[data-app-addresstype]").data('app-addresstype');
					
					app.ext.store_crm.u.showAddressEditModal({
						'addressID' : $btn.closest("address").data('_id'),
						'addressType' : addressType
						},function(){
//by here, the new address has been edited.
//set appropriate address panel to loading.
//editing and address does NOT auto-select it.
						app.ext.orderCreate.u.handlePanel($checkoutForm,$checkoutAddrFieldset.data('app-role'),['showLoading']);
	
	//get the updated address list and update the address panel.
						app.model.destroy('buyerAddressList');
						app.calls.buyerAddressList.init({'callback':function(rd){
							app.ext.orderCreate.u.handlePanel($checkoutForm,$checkoutAddrFieldset.data('app-role'),['empty','translate','handleDisplayLogic','handleAppEvents']);
							}},'immutable');
	
						app.model.dispatchThis('immutable');
						})
					});
				}, //showBuyerAddressUpdate

			tagAsAccountCreate : function($cb)	{
				$cb.anycb();
				$cb.off('change.tagAsAccountCreate').on('change.tagAsAccountCreate',function()	{
					app.ext.cco.calls.cartSet.init({'want/create_customer': $cb.is(':checked') ? 1 : 0}); //val of a cb is on or off, but we want 1 or 0.
					app.model.destroy('cartDetail');
					app.ext.orderCreate.u.handlePanel($cb.closest('form'),'chkoutPreflight',['handleDisplayLogic']);
					app.calls.cartDetail.init({'callback':function(rd){
						app.ext.orderCreate.u.handlePanel($cb.closest('form'),'chkoutAccountCreate',['handleDisplayLogic']);
						}},'immutable');
					app.model.dispatchThis('immutable');
					});
				},
			
			tagAsBillToShip : function($cb)	{
				$cb.anycb();
				$cb.off('change.tagAsBillToShip').on('change.tagAsBillToShip',function()	{
					app.calls.cartSet.init({'want/bill_to_ship':($cb.is(':checked')) ? 1 : 0},{},'immutable'); //adds dispatches.
					app.model.destroy('cartDetail');
					app.calls.cartDetail.init({'callback':function(rd){
						app.ext.orderCreate.u.handlePanel($cb.closest('form'),'chkoutAddressShip',['handleDisplayLogic']);
						}},'immutable');
					app.model.dispatchThis('immutable');
					});
				}
			},


////////////////////////////////////   						util [u]			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
			
//Combines the various data objects into one, so that they can be fed into the translator and rendered in one pass.
			extendedDataForCheckout : function()	{
//				app.u.dump("app.data.cartDetail:"); app.u.dump(app.data.cartDetail);
				if(app.u.buyerIsAuthenticated())	{
					var obj = $.extend(true,app.data.appPaymentMethods,app.data.appCheckoutDestinations,app.data.buyerAddressList,app.data.buyerWalletList,app.data.cartDetail);
					}
				else	{
					var obj = $.extend(true,app.data.appPaymentMethods,app.data.appCheckoutDestinations,app.data.cartDetail);
					}
				return obj;
				}, //extendedDataForCheckout
			
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
					ao.empty = function(formObj, $fieldset){$(".panelContent",$fieldset).empty()},
					ao.handleAppEvents = function(formObj, $fieldset){app.u.handleAppEvents($fieldset)},
					ao.handleDisplayLogic = function(formObj, $fieldset){
						if(typeof app.ext.orderCreate.panelDisplayLogic[role] === 'function')	{
							app.ext.orderCreate.panelDisplayLogic[role](formObj,$fieldset);
							}
						else	{
							$fieldset.anymessage({'message':'In orderCreate.u.handlePanel, panelDisplayLogic['+role+'] not a function','gMessage':true});
							}
						}, //perform things like locking form fields, hiding/showing the panel based on some setting. never pass in the setting, have it read from the form or cart.
					ao.translate = function(formObj, $fieldset)	{
//						app.u.dump(" -> translating "+role);
//						app.u.dump("app.ext.orderCreate.u.extendedDataForCheckout()"); app.u.dump(app.ext.orderCreate.u.extendedDataForCheckout());
						$fieldset.anycontent({'data' : app.ext.orderCreate.u.extendedDataForCheckout()});
						} //populates the template.
					
					for(var i = 0; i < L; i += 1)	{
						if(typeof ao[actions[i]] === 'function'){
							ao[actions[i]](formObj, $fieldset);
							}
						else	{
							$('#globalMessaging').anymessage({'message':"In orderCreate.u.handlePanel, undefined action ["+actions[i]+"]",'gMessage':true});
							}
						}
					
					}
				else	{
					$('#globalMessaging').anymessage({'message':"In orderCreate.u.handlePanel, either $context ["+typeof $context+"], role ["+role+"] or actions ["+actions+"] not defined or not an object ["+typeof actions+"]",'gMessage':true});
					}
				},

//this code was executed often enough to justify putting it into a function for recycling.
//sets payment options, shipping options and cart summary to loading, then adds immutable dispatches/callbacks/etc for updating.
//does NOT dispatch. That way, other requests can be piggy-backed.
			handleCommonPanels : function($context)	{
				app.ext.orderCreate.u.handlePanel($context,'chkoutMethodsShip',['showLoading']);
				app.ext.orderCreate.u.handlePanel($context,'chkoutMethodsPay',['showLoading']);
				app.ext.orderCreate.u.handlePanel($context,'chkoutCartSummary',['showLoading']);
				
				app.model.destroy('cartDetail');
				app.ext.cco.calls.appPaymentMethods.init({},{},'immutable'); //update pay and ship anytime either address changes.
				app.calls.cartDetail.init({'callback':function(){
					app.ext.orderCreate.u.handlePanel($context,'chkoutMethodsShip',['empty','translate','handleDisplayLogic','handleAppEvents']);
					app.ext.orderCreate.u.handlePanel($context,'chkoutMethodsPay',['empty','translate','handleDisplayLogic','handleAppEvents']);
					app.ext.orderCreate.u.handlePanel($context,'chkoutCartSummary',['empty','translate','handleDisplayLogic','handleAppEvents']);
					}},'immutable');
				}, //handleCommonPanels

			handlePaypalInit : function()	{

//paypal code need to be in this startCheckout and not showCheckoutForm so that showCheckoutForm can be 
// executed w/out triggering the paypal code (which happens when payment method switches FROM paypal to some other method) because
// the paypalgetdetails cmd only needs to be executed once per session UNLESS the cart contents change.
//calls are piggybacked w/ this. do not add dispatch here.
				var token = app.u.getParameterByName('token');
				var payerid = app.u.getParameterByName('PayerID');
				if(token && payerid)	{
					app.u.dump("It appears we've just returned from PayPal.");
					app.ext.orderCreate.vars['payment-pt'] = token;
					app.ext.orderCreate.vars['payment-pi'] = payerid;
					app.ext.cco.calls.cartPaymentQ.init({"cmd":"insert","PT":token,"PI":payerid,"TN":"PAYPALEC"},{"extension":"orderCreate","callback":"handlePayPalIntoPaymentQ"});
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
					
					var $supplementalOutput = app.ext.cco.u.getSupplementalPaymentInputs($input.val(),app.ext.orderCreate.vars);
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

				}, //showSupplementalInputs

//201308 added to replace call: saveCheckoutFields
//may need to sanitize out payment vars.
			saveAllCheckoutFields : function($form,_tag)	{
				if($form)	{
					_tag = _tag || {};
					var formObj = $form.serializeJSON();
//po number is used for purchase order payment method, but also allowed for a reference number (if company set and po not payment method).
					if(app.ext.orderCreate.vars['want/payby'] != "PO" && formObj['want/reference_number'])	{
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
				} //saveAllCheckoutFields



				
			}, // u/utilities




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
//				app.u.dump('BEGIN app.ext.orderCreate.renderFormats.payOptionsAsRadioButtons');
//				app.u.dump(data);

				var L = data.value.length,
				o = "", //the output appended to $tag
				id = ''; //recycled.

//ZERO will be in the list of payment options if customer has a zero due (giftcard or paypal) order.
				if(data.value[0].id == 'ZERO')	{
					$tag.hide(); //hide payment options.
					$tag.append("<div ><input type='radio' name='want/payby'  value='ZERO' checked='checked' \/>"+data.value[i].pretty+"<\/div>");
					}
				else if(L > 0)	{
					for(var i = 0; i < L; i += 1)	{
						id = data.value[i].id;

//onClick event is added through an app-event. allows for app-specific events.
						o += "<div class='headerPadding' data-app-role='paymentMethodContainer'><label><input type='radio' name='want/payby' value='"+id+"' ";
						o += " />"+data.value[i].pretty+"<\/label></div>";
						}
					$tag.html(o);
					
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