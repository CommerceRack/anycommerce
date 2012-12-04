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

/*
An extension for acquiring, editing and displaying the shopping cart.
*/


var store_cart = function() {
	var r = {
		
	vars : {
		"cartAccessories" : [] //saved here in the displayCart callback. a list of accessories for items in the cart.
		},




					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



	calls : {
/*
the calls for 'cartDetail' and 'getCartContents' are similar. the main difference is:
1. getCartContents will always make a request. cartDetail will check local first.
2. getCartContents uses the priority dispatch q, cartDetail doesn't.

use cartDetail if a user is just viewing the cart.
use getCartContents if they're modifying the cart (changing quantities, setting shipping, selecting a zip, etc)

formerly showCart
*/
		cartDetail : {
			init : function(tagObj)	{
//				app.u.dump('BEGIN app.ext.store_cart.calls.cartDetail.init');
				var r = 0;

//if datapointer is fixed (set within call) it needs to be added prior to executing handleCallback (which will likely need datapointer to be set).
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
				tagObj.datapointer = "cartDetail";
					
				if(app.model.fetchData('cartDetail') == false)	{
					app.u.dump(" -> cartDetail is not local. go get her Ray!");
					r = 1;
					this.dispatch(tagObj);
					}
				else	{
//					app.u.dump(' -> data is local');
					app.u.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(tagObj)	{
//				app.u.dump('BEGIN app.ext.store_cart.calls.cartDetail.dispatch');
				app.model.addDispatchToQ({"_cmd":"cartDetail","_tag": tagObj});
				}
			},

		getCartContents : {
			init : function(tagObj,Q)	{
//				app.u.dump('BEGIN app.ext.store_cart.calls.getCartContents. callback = '+callback)
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
				Q = Q ? Q : 'immutable'; //allow for muted request, but default to immutable. it's a priority request.
				tagObj.datapointer = "cartDetail";
				this.dispatch(tagObj,Q);
				return 1;
				},
			dispatch : function(tagObj,Q)	{
//				app.u.dump(' -> adding to PDQ. callback = '+callback)
				app.model.addDispatchToQ({"_cmd":"cartDetail","_tag": tagObj},Q);
				}
			},//getCartContents


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
				app.calls.cartSet.init({'payment-pt':null}); //nuke paypal token anytime the cart is updated.
				}
			 },
// formerly getShippingRates
// checks for local copy first. used in showCartInModal.
		cartShippingMethods : {
			init : function(tagObj,Q)	{
				var r = 0
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; //makesure tagObj is an object so that datapointer can be added w/o causing a JS error
				tagObj.datapointer = "cartShippingMethods";
				
				if(app.model.fetchData('cartShippingMethods') == false)	{
					app.u.dump(" -> cartShippingMethods is not local. go get her Ray!");
					r = 1;
					Q = Q ? Q : 'immutable'; //allow for muted request, but default to immutable. it's a priority request.
					this.dispatch(tagObj,Q);
					}
				else	{
//					app.u.dump(' -> data is local');
					app.u.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(tagObj,Q)	{
				app.model.addDispatchToQ({"_cmd":"cartShippingMethods","_tag": tagObj},Q);
				}
			}, //cartShippingMethods

//update will modify the cart. only run this when actually selecting a shipping method (like during checkout). heavier call.
// formerly getShippingRatesWithUpdate
		cartShippingMethodsWithUpdate : {
			init : function(tagObj)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; //makesure tagObj is an object so that datapointer can be added w/o causing a JS error
				tagObj.datapointer = "cartShippingMethods";
				this.dispatch(tagObj);
				return 1;
				},
			dispatch : function(tagObj)	{
				app.model.addDispatchToQ({"_cmd":"cartShippingMethods","update":"1","trace":"1","_tag": tagObj},'immutable');
				}
			}, //cartShippingMethodsWithUpdate

//formerly addGiftcardToCart
		cartGiftcardAdd : {
			init : function(giftcard,tagObj)	{
				this.dispatch(giftcard,tagObj);
				return 1; 
				},
			dispatch : function(giftcard,tagObj)	{
				app.model.addDispatchToQ({"_cmd":"cartGiftcardAdd","giftcard":giftcard,"_tag" : tagObj},'immutable');	
				}			
			}, //cartGiftcardAdd
//formerly addCouponToCart
		cartCouponAdd : {
			init : function(coupon,tagObj)	{
				this.dispatch(coupon,tagObj);
				return 1; 
				},
			dispatch : function(coupon,tagObj)	{
				app.model.addDispatchToQ({"_cmd":"cartCouponAdd","coupon":coupon,"_tag" : tagObj},'immutable');	
				}			
			}, //cartCouponAdd


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
"CancelUrl":zGlobals.appSettings.https_app_url+"cart.cgis?sessionid="+app.sessionId,
"ReturnUrl":zGlobals.appSettings.https_app_url,
"YourAccountUrl": zGlobals.appSettings.https_app_url+"customer/orders/",
'_tag':tagObj},'immutable');
				}
			} //cartAmazonPaymentParams	

		}, //calls




					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration. Use this for any config dependencies that need to occur.
//the init callback is auto-executed as part of the extensions loading process.
//dependencies for other extensions should be listed in vars.dependencies as ['store_prodlist','store_navcats'] and so forth.
		init : {
			onSuccess : function()	{
//				app.u.dump('BEGIN app.ext.simple_sample.init.onSuccess ');
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN app.ext.simple_sample.callbacks.init.onError');
				}
			}, //init
		displayCart :  {
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN app.ext.store_cart.callbacks.displayCart.onSuccess');
				app.renderFunctions.translateTemplate(app.data.cartDetail,tagObj.parentID);
				}
			},



		updateCartLineItem :  {
			onSuccess : function(tagObj)	{
				app.u.dump('BEGIN app.ext.store_cart.callbacks.updateCartLineItem.onSuccess');
				var stid = app.ext.store_cart.u.getStuffIndexBySTID($('#'+tagObj.parentID).attr('data-stid'));
				app.u.dump(" -> stid: "+stid);
				app.u.dump(" -> tagObj.parentID: "+tagObj.parentID);
				app.renderFunctions.translateTemplate(app.data.cartDetail['@ITEMS'][stid],tagObj.parentID);
				}
			}
		}, //callbacks







////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





		renderFormats : {
			
			cartItemQty : function($tag,data)	{
//				app.u.dump("BEGIN store_cart.renderFormats.cartItemQty");
//				app.u.dump(data);
				var stid = $tag.closest('[data-stid]').attr('data-stid'); //get the stid off the parent container.
//				app.u.dump(stid);
				$tag.val(data.value).attr('data-stid',stid);
				},
				
				
			removeItemBtn : function($tag,data)	{
//nuke remove button for coupons.
				if(data.value[0] == '%')	{$tag.remove()}
				else	{
$tag.attr({'data-stid':data.value}).val(0); //val is used for the updateCartQty
//the click event handles all the requests needed, including updating the totals panel and removing the stid from the dom.
$tag.click(function(){
	app.ext.store_cart.u.updateCartQty($tag);
	app.model.dispatchThis('immutable');
	});
					}
				},
//for displaying order balance in checkout order totals.				
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


			shipMethodsAsRadioButtons : function($tag,data)	{
				app.u.dump('BEGIN store_cart.renderFormat.shipMethodsAsRadioButtons');
				var o = '';
				var shipName,id,isSelectedMethod,safeid;  // id is actual ship id. safeid is id without any special characters or spaces. isSelectedMethod is set to true if id matches cart shipping id selected.;
				var L = data.value.length;
				for(var i = 0; i < L; i += 1)	{
					id = data.value[i].id; //shortcut of this shipping methods ID.
					isSelectedMethod = (id == app.data.cartDetail['want'].shipping_id) ? true : false; //is this iteration for the method selected.
					safeid = app.u.makeSafeHTMLId(data.value[i].id);
					app.u.dump(" -> id: "+id+" and isSelected: "+isSelectedMethod);

//app.u.dump(' -> id = '+id+' and want/shipping_id = '+app.data.cartDetail['want/shipping_id']);
					
					shipName = app.u.isSet(data.value[i].pretty) ? data.value[i].pretty : data.value[i].name
					
					o += "<li class='shipcon "
					if(isSelectedMethod)
						o+= ' selected ';
					o += "shipcon_"+safeid; 
					o += "'><label><input type='radio' name='want/shipping_id' value='"+id+"' onClick='app.ext.store_cart.u.shipMethodSelected(this.value); app.model.dispatchThis(\"immutable\"); '";
					if(isSelectedMethod)
						o += " checked='checked' "
					o += "/>"+shipName+": <span >"+app.u.formatMoney(data.value[i].amount,'$','',false)+"<\/span><\/label><\/li>";
					}
				$tag.html(o);
				} //shipMethodsAsRadioButtons


			},





////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





		u : {

			
/*
This will open the cart in a modal. If an update is needed, that must be performed outside this function.
assumes that cart is in memory before it's loaded.
either templateID needs to be set OR showloading must be true. TemplateID will translate the template. showLoading will (you guessed it) show the loading class.
 so you can execute showCartInModal with showLoading set to true, then dispatch a request for a cart and translate the parent ID in the callback.
 can't think of a reason not to use the default parentID, but just in case, it can be set.
*/
			showCartInModal : function(P)	{
//				app.u.dump("BEGIN store_cart.u.showCartInModal");
				if(typeof P == 'object' && (P.templateID || P.showLoading === true)){
					var $modal = $('#modalCart');
//the modal opens as quick as possible so users know something is happening.
//open if it's been opened before so old data is not displayed. placeholder content (including a loading graphic, if set) will be populated pretty quick.
//the cart messaging is OUTSIDE the template. That way if the template is re-rendered, existing messaging is not lost.
					if($modal.length)	{
						$('#modalCartContents',$modal).empty(); //empty to remove any previous content.
						$('.appMessaging',$modal).empty(); //errors are cleared because if the modal is closed before the default error animation occurs, errors become persistent.
						$modal.dialog('open');
						}
					else	{
						$modal = $("<div \/>").attr({"id":"modalCart","title":"Your Shopping Cart"}).appendTo('body');
						$modal.append("<div id='cartMessaging' class='appMessaging'><\/div><div id='modalCartContents'><\/div>");
						$modal.dialog({modal: true,width:'80%',height:$(window).height() - 200});  //browser doesn't like percentage for height
						}

					if(P.showLoading === true)	{
						$('#modalCartContents',$modal).append("<div class='loadingBG' \/>"); //have to add child because the modal classes already have bg assigned
						}
					else	{
						$('#modalCartContents',$modal).append(app.renderFunctions.transmogrify({},P.templateID,app.data['cartDetail']));
						}

					}
				else	{
					app.u.throwGMessage("ERROR! no templateID passed into showCartInModal. P follows: ");
					app.u.dump(P);
					}

				
				}, //showCartInModal

//executed when a giftcard is submitted. handles ajax call for giftcard and also updates cart.
//no 'loadingbg' is needed on button because entire panel goes to loading onsubmit.
//panel is reloaded in case the submission of a gift card changes the payment options available.
			handleGiftcardSubmit : function(v,parentID)	{
				app.ext.store_cart.calls.cartGiftcardAdd.init(v,{"parentID":parentID,"message":"Giftcard Added!","callback":"showMessaging"});
				this.updateCartSummary();
				if(parentID)
					$('#'+parentID+' .zMessage').empty().remove(); //get rid of any existing messsaging.
				}, //handleGiftcardSubmit



//run when a shipping method is selected. updates cart/session and adds a class to the radio/label
//the dispatch occurs where/when this function is executed, NOT as part of the function itself.
			shipMethodSelected : function(shipID)	{
				app.calls.cartSet.init({'want/shipping_id':shipID});
				app.ext.store_cart.calls.cartShippingMethodsWithUpdate.init(); //updates shiping rates AND updates cart (though doesn't request cart).
				this.updateCartSummary();
				}, //updateShipMethod


//executed when a coupon is submitted. handles ajax call for coupon and also updates cart.
			handleCouponSubmit : function(v,parentID)	{
				app.ext.store_cart.calls.cartCouponAdd.init(v,{"parentID":parentID,"message":"Coupon Added!","callback":"showMessaging"}); 
				this.updateCartSummary();
				if(parentID)
					$('#'+parentID+' .zMessage').empty().remove(); //get rid of any existing messsaging.
				}, //handleCouponSubmit

			updateCartSummary : function()	{
				$('#modalCartContents').replaceWith(app.renderFunctions.createTemplateInstance('cartTemplate','modalCartContents'));
				app.calls.refreshCart.init({'callback':'translateTemplate','parentID':'modalCartContents'},'immutable');
//don't set this up with a getShipping because we don't always need it.  Add it to parent functions when needed.
				},
/*
running showStuff will display a list of the items that are in the cart.
Parameters expected are:
	parentID = the name of the container html element (each stid is added as a child to this).
	templateID = the name of the template to use.
*/
			showStuff : function(P)	{
//				app.u.dump("BEGIN store_cart.u.showStuff (parentid = "+P.parentID+")");
				if(!P.parentID || !P.templateID)	{
					app.u.dump(" -> parentID ("+P.parentID+") and/or TemplateID ("+P.templateID+") blank. both are required.");
					}
				else	{
					var $parent = $('#'+P.parentID);
					var L = app.data.cartDetail['@ITEMS'].length;
					var stid; //stid for item in loop.
//					app.u.dump(" -> items in stuff = "+L);
					
					for(var i = 0; i < L; i += 1)	{
						stid = app.data.cartDetail['@ITEMS'][i].stid;
//						app.u.dump(" -> STID: "+stid);
						$parent.append(app.renderFunctions.transmogrify({'id':'cartViewer_'+stid,'stid':stid},P.templateID,app.data.cartDetail['@ITEMS'][i]));
//						app.u.dump(" -> stid["+i+"] = "+stid);
//make any inputs for coupons disabled.
						if(stid[0] == '%')	{$parent.find(':input').attr({'disabled':'disabled'})}
							
						}
					}
				}, //showStuff
				
//useful if you need to reference something in the cart and all you have is the stid.
//returns the index so that you can point to it.
			getStuffIndexBySTID : function(stid)	{
				var L = app.data.cartDetail['@ITEMS'].length;
				var r = false;
				for(var i = 0; i < L; i += 1)	{
					if(app.data.cartDetail['@ITEMS'][i].stid == stid)	{
						r = i;
						break; //once we have a match, kill the loop.
						}
					}
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
					$input.attr('disabled','disabled').addClass('disabled').addClass('loadingBG');
					app.u.dump('got stid: '+stid);
//some defaulting. a bare minimum callback needs to occur. if there's a business case for doing absolutely nothing
//then create a callback that does nothing. IMHO, you should always let the user know the item was modified.
//you can do something more elaborate as well, just by passing a different callback.
					tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
					tagObj.callback = tagObj.callback ? tagObj.callback : 'updateCartLineItem';
					tagObj.extension = tagObj.extension ? tagObj.extension : 'store_cart';
					tagObj.parentID = 'cartViewer_'+app.u.makeSafeHTMLId(stid);
/*
the request for quantity change needs to go first so that the request for the cart reflects the changes.
the dom update for the lineitem needs to happen last so that the cart changes are reflected, so a ping is used.
*/
					app.ext.store_cart.calls.cartItemUpdate.init(stid,qty);
					this.updateCartSummary();
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

/*
Will get a csv of accessoreis from items that are in the cart.
will remove any duplicates.
### eventually, it'd be nice if this ordered the array by relevance.
so if an accessory showed up on four items in the cart, it'd be higher in the list (more relevant).
*/

			getCSVOfAccessories : function()	{
//				app.u.dump("BEGIN store_cart.u.getCSVOfAccessories");
				var csvArray = new Array(); //what is returned.
				var proda; //product accessories for the item in focus.
				var prodArray = new Array();
				var i,j,L,M; //used in the two loops below. yes, i know loops inside of loops are bad, but these are small datasets we're dealing with.
				M = app.data.cartDetail['@ITEMS'].length;
//				app.u.dump(" -> items in cart = "+M);
				for(j = 0; j < M; j += 1)	{
					if(proda = app.data.cartDetail['@ITEMS'][j]['%attribs']['zoovy:accessory_products'])	{
//						app.u.dump(" -> item has accessories: "+proda);
						prodArray = proda.split(',');
						L = prodArray.length
//						app.u.dump(" -> item has "+L+" accessories");
						for(var i = 0; i < L; i += 1)	{
							csvArray.push(prodArray[i])
							}
						prodArray = []; //empty to avoid errors.
						}
					}
//				app.u.dump(csvArray);
				csvArray = $.grep(csvArray,function(n){return(n);}); //remove blanks
				return app.u.removeDuplicatesFromArray(csvArray);
				} //getCSVOfAccessories
			
			} //util


		
		} //r object.
	return r;
	}