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
					tagObj.datapointer = 'atc_'+myControl.util.unixNow(); //unique datapointer for callback to work off of, if need be.
					this.dispatch({'product_id':pid,'quantity':'1'},tagObj);
					return 1;
					},
				dispatch : function(obj,tagObj)	{
					obj["_cmd"] = "cartItemsAdd"; //cartItemsAddSerialized
					obj["_zjsid"] = myControl.sessionId; 
					obj["_tag"] = tagObj;
					myControl.model.addDispatchToQ(obj,'immutable');
					myControl.calls.cartSet.init({'payment-pt':null}); //nuke paypal token anytime the cart is updated.
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
					myControl.util.dump('BEGIN myControl.ext.myRIA.callbacks.init.onError');
					}
				},
//this is the callback defined to run after extension loads.
			startMyProgram : {
				onSuccess : function()	{

/*
To minimize the footprint on the storefront, the templates are stored in an external html file, loaded via ajax.
If the templates file does not successfully load
*/

var $templateDiv = $('<div \/>')
$templateDiv.attr('id','adminTemplates').hide().appendTo('body');
// /biz/ajax/zmvc/201211/admin_templates.html
var protocol = document.location.protocol == 'https:' ? 'https:' : 'http:' //sometimes the protocol may be file:, so default to http unless secure.
var templateURL = protocol+'//static.zoovy.com/graphics/general/jslib/zmvc/201217/examples/addtocart-hijack/templates.html';

var result = $.ajax({
		type: "GET",
		url: templateURL,
		async: false,
		dataType:"html"
		});	
result.error(function(){alert('An error occured while trying to load the admin templates.')});
result.success(function(data){
	$templateDiv.append(data);
	$templateDiv.children().each(function(){
		var id = false;
		if(id = $(this).attr('id')){}  //set's id to element id for cloning. 
		else if($(this).is('table')){
			id = $(this).find("tr:first").attr('id')
			}
//certain element types, such as li or tr have the id on the li or tr, but require a parent element in the definition file for IE support.
		else if(id = $(this).children(":first").attr('id'))	{}
		if(id)	{
//				myControl.util.dump(" -> clone id: "+id);
			myControl.templates[id] = $('#'+id).clone();
//remove original template so duplicate ID's don't occur (may cause jquery confusion).
//leave sections that didn't become templates for troubleshooting purposes. 
			$(this).empty().remove();
			}
		})
//actually starts the hijack process.
var pid = $('#ProductIndexID').val();
if(pid)	{
	myControl.ext.store_product.calls.appProductGet.init(pid,{'callback':'commenceAC','extension':'myRIA'});
	myControl.model.dispatchThis();
	}

$cartLink = $('#menu-cart');
$cartLink.attr('href','#').unbind(); //disable and unbind any actions on cart link.
$cartLink.click(function(){
	myControl.ext.store_cart.util.showCartInModal('cartViewer');
	return false;
	});


myControl.ext.myRIA.util.annexListATC(); //goes through product lists, such as recently viewed and accessories.


	})



					},
				onError : function(responseData,uuid)	{
//error handling is a case where the response is delivered (unlike success where datapointers are used for recycling purposes)
					myControl.util.handleErrors(responseData,uuid); //a default error handling function that will try to put error message in correct spot or into a globalMessaging element, if set. Failing that, goes to modal.
					}
				},
				
			
			commenceAC : {
				onSuccess : function(tagObj)	{
var pid = myControl.data[tagObj.datapointer].pid;
myControl.util.dump(" -> commence hijack for pid: "+pid);
var $form = $('#kb_form');
myControl.util.dump(" -> kb_form.length: "+$form.length);

$form.unbind().attr('action','#'); //remove existing action/onsubmit
$form.bind('submit',function(event){
//	alert('woot!');
	myControl.ext.myRIA.util.handleAddToCart($form.attr('id'));
	return false;
	});  //add new submit handler.

$('#product-page-buy-qty').empty().remove(); //get rid of existing quantity input box.
$('<input>').attr({'id':$form.attr('id')+'_product_id','name':'product_id','type':'hidden'}).val(pid).appendTo($form);



//will add options and quantity input box.
$('#add-to-cart-button').before(myControl.renderFunctions.transmogrify({'id':'something'},'addToCartTemplate',myControl.data[tagObj.datapointer]))
$('#add-to-cart-button').before($("<div>").attr('id','atcMessaging_'+pid))

$('#kb_form :button').each(function(index){
	var $button = $(this);
	var buttonText = $button.attr('value');
	if(buttonText.toLowerCase() == 'write a review')	{
		myControl.util.dump(" -> match on write a review button");
		$button.unbind('click').attr('onclick','#'); //unbind wasn't working right.
		$button.bind('click',function(event){
			event.preventDefault();
			myControl.ext.store_crm.util.showReviewFrmInModal({"pid":pid,"templateID":"reviewFrmTemplate"});
			return false;
			});
		}
	})

					},
				onError : function(responseData,uuid)	{
//error handling is a case where the response is delivered (unlike success where datapointers are used for recycling purposes)
					myControl.util.handleErrors(responseData,uuid); //a default error handling function that will try to put error message in correct spot or into a globalMessaging element, if set. Failing that, goes to modal.
					}
				},



			itemAddedToCart :	{
				onSuccess : function(tagObj)	{
					myControl.util.dump('BEGIN myControl.ext.store_product.callbacks.itemAddedToCart.onSuccess');
					$('.atcButton').removeAttr('disabled').removeClass('disabled'); //makes all atc buttons clickable again.
					var htmlid = 'atcMessaging_'+myControl.data[tagObj.datapointer].product1;
					$('#atcMessaging_'+myControl.data[tagObj.datapointer].product1).append(myControl.util.formatMessage({'message':'Item Added','htmlid':htmlid,'uiIcon':'check','timeoutFunction':"$('#"+htmlid+"').slideUp(1000);"}));
					},
				onError : function(responseData,uuid)	{
					myControl.util.dump('BEGIN myControl.ext.store_product.callbacks.init.onError');
					$('.atcButton').removeAttr('disabled'); //remove the disabling so users can push the button again, if need be.
					$('#atcMessaging_'+myControl.data[responseData['_rtag'].datapointer].product1).append(myControl.util.getResponseErrors(responseData))
					}
				}, //itemAddedToCart
	

	//executed when the cart is changed, such as a zip entered or a country selected.
			cartUpdated :	{
				onSuccess : function(tagObj)	{
					myControl.util.dump("BEGIN myRIA.callbacks.cartUpdated.onSuccess");
					var itemCount = myControl.util.isSet(myControl.data[tagObj.datapointer].cart['data.item_count']) ? myControl.data[tagObj.datapointer].cart['data.item_count'] : myControl.data[tagObj.datapointer].cart['data.add_item_count']
	//				myControl.util.dump(" -> itemCount: "+itemCount);
					$('#menu-cart').text('My Cart ('+itemCount+')');
					myControl.ext.store_cart.util.showCartInModal('cartViewer'); 
					},
				onError : function(responseData,uuid)	{
					myControl.util.handleErrors(responseData,uuid)
					}
				}


			}, //callbacks


		util : {
//for adding items to the cart where qty always = 1 (for the add, can b modified in cart later) and product does NOT have variations/options.
			quickATC : function(pid)	{
				myControl.util.dump("BEGIN myRIA.util.quickATC");
				if(!pid)	{}
				else	{
					myControl.ext.myRIA.calls.quickAdd.init(pid,{'callback':'itemAddedToCart','extension':'myRIA'});
					myControl.calls.refreshCart.init({'callback':'cartUpdated','extension':'myRIA'},'immutable');
					myControl.ext.store_cart.calls.cartShippingMethods.init({},'immutable'); //get shipping methods into memory for quick use.
					myControl.model.dispatchThis('immutable');
					}
				},
			handleAddToCart : function(formID)	{
myControl.util.dump("BEGIN store_product.calls.cartItemsAdd.init")
if(!formID)	{
//	alert('form id NOT set');
	}
else	{
	var pid = $('#'+formID+'_product_id').val();
	if(myControl.ext.store_product.validate.addToCart(pid))	{
		myControl.ext.store_product.calls.cartItemsAdd.init(formID,{'callback':'itemAddedToCart','extension':'myRIA'});
		myControl.calls.refreshCart.init({'callback':'cartUpdated','extension':'myRIA'},'immutable');
		myControl.ext.store_cart.calls.cartShippingMethods.init({},'immutable'); //get shipping methods into memory for quick use.
		myControl.model.dispatchThis('immutable');
		}
	else	{
		$('#'+formID+' .atcButton').removeClass('disabled').removeAttr('disabled');
		}
	}
return r;				
				}, //handleAddToCart


			annexListATC : function()	{
myControl.util.dump("BEGIN myRIA.util.annexListATC");
$('a').each(function(index){	{
	var $link = $(this)
	if($link.attr('onclick') && $link.attr('onclick').indexOf('add_to_cart_direct') >= 0)	{
//		myControl.util.dump(" MATCH! ");
		var pid = $link.attr('onclick').replace(/.*\(|\)/gi,'');
		myControl.util.dump(" -> pid: "+pid);
		
		$link.attr({'href':'#','onclick':''}).unbind();
		$link.click(function(){
			myControl.util.dump("Click!");
//if the pid isn't in memory yet, open modal (which will get product data).
			if(myControl.data['appProductGet|'+pid] && $.isEmptyObject(myControl.data['appProductGet|'+pid]['@variations']))	{
				myControl.ext.myRIA.util.quickATC(pid);
				}
//item has variations or isn't in memory yet. catch all. show item in modal.
			else	{
				myControl.ext.store_product.util.prodDataInModal({'pid':pid,'templateID':'prodViewerTemplate'});
				}
			return false;
			});

		myControl.ext.store_product.calls.appProductGet.init(pid);
		}
	}})
myControl.model.dispatchThis();
				}
			
			} //util


		} //r object.
	return r;
	}