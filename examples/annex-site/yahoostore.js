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




var myRIA = function() {
	var r = {
		vars : {
			"templates" : [],
			"dependAttempts" : 0,  //used to count how many times loading the dependencies has been attempted.
			"dependencies" : ['store_cart','store_product','store_crm'] //a list of other extensions (just the namespace) that are required for this one to load
			
			},
		calls : {
			quickAdd : {
				init : function(pid,tagObj)	{
					tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
					tagObj.datapointer = 'atc_'+app.u.unixNow(); //unique datapointer for callback to work off of, if need be.
					this.dispatch({'product_id':pid,'quantity':'1'},tagObj);
					return 1;
					},
				dispatch : function(obj,tagObj)	{
					obj["_cmd"] = "cartItemsAdd"; //cartItemsAddSerialized
					obj["_zjsid"] = app.sessionId; 
					obj["_tag"] = tagObj;
					app.model.addDispatchToQ(obj,'immutable');
					app.calls.cartSet.init({'payment-pt':null}); //nuke paypal token anytime the cart is updated.
					}
				},//addToCart			
			
			}, //calls
		callbacks : {
//run when controller loads this extension.  Should contain any validation that needs to be done. return false if validation fails.
			init : {
				onSuccess : function()	{
					var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
					return r;
					},
				onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
					app.u.dump('BEGIN app.ext.myRIA.callbacks.init.onError');
					}
				},
//this is the callback defined to run after extension loads.
			startMyProgram : {
				onSuccess : function()	{

/*
To minimize the footprint on the storefront, the templates are stored in an external html file, loaded via ajax.
If the templates file does not successfully load
*/

var ajaxRequest = app.model.loadRemoteTemplates("templates.html");

ajaxRequest.error(function(){
	//the templates not loading is pretty much a catastrophic issue. however, we don't want to throw an error in this case so just hide the carousel.
	app.u.dump("ERROR! template file could not load. carousel aborted.");
	});

ajaxRequest.success(function(data){
	$('<div>').attr('id','remotelyLoadedTemplates').appendTo('body').hide().append(data);
	var templateErrors = app.model.loadTemplates(['addToCartTemplate','cartViewer','cartSummaryTemplate','cartViewerProductTemplate','reviewFrmTemplate','subscribeFormTemplate','zCheckoutContainerSpec','chkout-cartSummarySpec','myCheckoutSpec','cartSummaryTotalsSpec','chkout-billAddressSpec','chkout-shipAddressSpec','chkout-shipMethodsSpec','checkout-payOptionsSpec','chkout-orderNotesSpec','checkoutSuccess','billAddressTemplate','shipAddressTemplate','prodViewerTemplate']);

	app.calls.refreshCart.init({'callback':'udpateMinicart','extension':'myRIA'},'mutable');

//actually starts the annex process. only occurs if templates are successfully loaded.
	var pid = $('#ProductIndexID').val();
	if(pid)	{
		app.ext.store_product.calls.appProductGet.init(pid,{'callback':'commenceAC','extension':'myRIA'});
		}
	app.model.dispatchThis();

//handles the cart link.
	$cartLink = $('#menu-cart');
	$cartLink.attr('href','#').unbind(); //disable and unbind any actions on cart link.
	$cartLink.click(function(){
		 app.u.dump("cart link clicked");
		app.ext.store_cart.u.showCartInModal('cartViewer');
		return false;
		});

	app.ext.myRIA.u.annexListATC(); //goes through product lists, such as recently viewed and accessories.
	app.ext.myRIA.u.annexListCheckbox('.wtab_box');	//goes through checkboxes within the passed selector
	$('.price-table :first').hide(); //content would be replaced with product options. may or may not need this line.
	})



					},
				onError : function(responseData,uuid)	{
//error handling is a case where the response is delivered (unlike success where datapointers are used for recycling purposes)
					app.u.handleErrors(responseData,uuid); //a default error handling function that will try to put error message in correct spot or into a globalMessaging element, if set. Failing that, goes to modal.
					}
				},
				
			
			commenceAC : {
				onSuccess : function(tagObj)	{
var pid = app.data[tagObj.datapointer].pid;
app.u.dump(" -> commence hijack for pid: "+pid);
var $form = $('#kb_form');
app.u.dump(" -> kb_form.length: "+$form.length);

$form.unbind().attr('action','#'); //remove existing action/onsubmit
$form.bind('submit',function(event){
//	alert('woot!');
	app.ext.myRIA.u.handleAddToCart($form.attr('id'));
	return false;
	});  //add new submit handler.

$('#product-page-buy-qty').empty().remove(); //get rid of existing quantity input box.
$('<input>').attr({'id':$form.attr('id')+'_product_id','name':'product_id','type':'hidden'}).val(pid).appendTo($form);



//will add options and quantity input box.
$('#add-to-cart-button').before(app.renderFunctions.transmogrify({'id':'something'},'addToCartTemplate',app.data[tagObj.datapointer]))
$('#add-to-cart-button').before($("<div>").attr('id','atcMessaging_'+pid))

$('#kb_form :button').each(function(index){
	var $button = $(this);
	var buttonText = $button.attr('value');
	if(buttonText.toLowerCase() == 'write a review')	{
		app.u.dump(" -> match on write a review button");
		$button.unbind('click').attr('onclick','#'); //unbind wasn't working right.
		$button.bind('click',function(event){
			event.preventDefault();
			app.ext.store_crm.u.showReviewFrmInModal({"pid":pid,"templateID":"reviewFrmTemplate"});
			return false;
			});
		}
	})

					},
				onError : function(responseData,uuid)	{
//error handling is a case where the response is delivered (unlike success where datapointers are used for recycling purposes)
					app.u.handleErrors(responseData,uuid); //a default error handling function that will try to put error message in correct spot or into a globalMessaging element, if set. Failing that, goes to modal.
					}
				},



			itemAddedToCart :	{
				onSuccess : function(tagObj)	{
					app.u.dump('BEGIN app.ext.store_product.callbacks.itemAddedToCart.onSuccess');
					$('.atcButton').removeAttr('disabled').removeClass('disabled'); //makes all atc buttons clickable again.
					var htmlid = 'atcMessaging_'+app.data[tagObj.datapointer].product1;
					$('#atcMessaging_'+app.data[tagObj.datapointer].product1).append(app.u.formatMessage({'message':'Item Added','htmlid':htmlid,'uiIcon':'check','timeoutFunction':"$('#"+htmlid+"').slideUp(1000);"}));
					},
				onError : function(responseData,uuid)	{
					app.u.dump('BEGIN app.ext.store_product.callbacks.init.onError');
					$('.atcButton').removeAttr('disabled'); //remove the disabling so users can push the button again, if need be.
					$('#atcMessaging_'+app.data[responseData['_rtag'].datapointer].product1).append(app.u.getResponseErrors(responseData))
					}
				}, //itemAddedToCart
	

	//executed when the cart is changed, such as a zip entered or a country selected.
			udpateMinicart :	{
				onSuccess : function(tagObj)	{
					var itemCount = app.u.isSet(app.data[tagObj.datapointer].cart['data.item_count']) ? app.data[tagObj.datapointer].cart['data.item_count'] : app.data[tagObj.datapointer].cart['data.add_item_count']
					$('#menu-cart').text('My Cart ('+itemCount+')');
					},
				onError : function(responseData,uuid)	{
					app.u.handleErrors(responseData,uuid)
					}
				}, 
	//executed when the cart is changed, such as a zip entered or a country selected.
			cartUpdated :	{
				onSuccess : function(tagObj)	{
					app.u.dump("BEGIN myRIA.callbacks.cartUpdated.onSuccess");
					var itemCount = app.u.isSet(app.data[tagObj.datapointer].cart['data.item_count']) ? app.data[tagObj.datapointer].cart['data.item_count'] : app.data[tagObj.datapointer].cart['data.add_item_count']
	//				app.u.dump(" -> itemCount: "+itemCount);
					$('#menu-cart').text('My Cart ('+itemCount+')');
					app.ext.store_cart.u.showCartInModal('cartViewer'); 
					},
				onError : function(responseData,uuid)	{
					app.u.handleErrors(responseData,uuid)
					}
				}


			}, //callbacks


		util : {
//for adding items to the cart where qty always = 1 (for the add, can b modified in cart later) and product does NOT have variations/options.
			quickATC : function(pid)	{
				app.u.dump("BEGIN myRIA.u.quickATC");
				if(!pid)	{}
				else	{
					app.ext.myRIA.calls.quickAdd.init(pid,{'callback':'itemAddedToCart','extension':'myRIA'});
					app.calls.refreshCart.init({'callback':'cartUpdated','extension':'myRIA'},'immutable');
					app.ext.store_cart.calls.cartShippingMethods.init({},'immutable'); //get shipping methods into memory for quick use.
					app.model.dispatchThis('immutable');
					}
				},
			handleAddToCart : function(formID)	{
app.u.dump("BEGIN store_product.calls.cartItemsAdd.init")
if(!formID)	{
//	alert('form id NOT set');
	}
else	{
	var pid = $('#'+formID+'_product_id').val();
	if(app.ext.store_product.validate.addToCart(pid))	{
		app.ext.store_product.calls.cartItemsAdd.init(formID,{'callback':'itemAddedToCart','extension':'myRIA'});
		app.calls.refreshCart.init({'callback':'cartUpdated','extension':'myRIA'},'immutable');
		app.ext.store_cart.calls.cartShippingMethods.init({},'immutable'); //get shipping methods into memory for quick use.
		app.model.dispatchThis('immutable');
		}
	else	{
		$('#'+formID+' .atcButton').removeClass('disabled').removeAttr('disabled');
		}
	}
return r;				
				}, //handleAddToCart

			annexListCheckbox : function(selector)	{
//<input type="hidden" name="quantity:PID" value="1">
//<input type="checkbox" name="product_id:PID" value="1">
$(selector + ' :checkbox').each(function(){
	var $checkbox = $(this);
	var pid = $checkbox.val();
	app.u.dump(" -> PID: "+pid);
	$checkbox.attr({'name':'product_id:'+pid,'data-pid':pid}).val(1); //data-pid is kept in case pid is needed again later, it'll be easily accessable.
	var $hidden = $("<input>").attr({'name':'quantity:'+pid,'type':'hidden'}).val(1).after($checkbox);
	});

				}, //annexListCheckbox
			annexListATC : function()	{
app.u.dump("BEGIN myRIA.u.annexListATC");
$('a').each(function(index){	{
	var $link = $(this)
	if($link.attr('onclick') && $link.attr('onclick').indexOf('add_to_cart_direct') >= 0)	{
//		app.u.dump(" MATCH! ");
		var pid = $link.attr('onclick').replace(/.*\(|\)/gi,'');
		app.u.dump(" -> pid: "+pid);
		
		$link.attr({'href':'#','onclick':''}).unbind();
		$link.click(function(){
			app.u.dump("Click!");
//if the pid isn't in memory yet, open modal (which will get product data).
			if(app.data['appProductGet|'+pid] && $.isEmptyObject(app.data['appProductGet|'+pid]['@variations']))	{
				app.ext.myRIA.u.quickATC(pid);
				}
//item has variations or isn't in memory yet. catch all. show item in modal.
			else	{
				app.ext.store_product.u.prodDataInModal({'pid':pid,'templateID':'prodViewerTemplate'});
				}
			return false;
			});

		app.ext.store_product.calls.appProductGet.init(pid);
		}
	}})

app.model.dispatchThis();

				}
			
			} //util


		} //r object.
	return r;
	}