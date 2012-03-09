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
the calls for 'showCart' and 'getCartContents' are similar. the main difference is:
1. getCartContents will always make a request. showCart will check local first.
2. getCartContents uses the priority dispatch q, showCart doesn't.

use showCart if a user is just viewing the cart.
use getCartContents if they're modifying the cart (changing quantities, setting shipping, selecting a zip, etc)
*/
		showCart : {
			init : function(tagObj)	{
//				myControl.util.dump('BEGIN myControl.ext.store_cart.calls.showCart.init');
				var r = 0;

//if datapointer is fixed (set within call) it needs to be added prior to executing handleCallback (which will likely need datapointer to be set).
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
				tagObj.datapointer = "showCart";
					
				if(myControl.model.fetchData('showCart') == false)	{
					myControl.util.dump(" -> showCart is not local. go get her Ray!");
					r = 1;
					this.dispatch(tagObj);
					}
				else	{
//					myControl.util.dump(' -> data is local');
					myControl.util.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(tagObj)	{
//				myControl.util.dump('BEGIN myControl.ext.store_cart.calls.showCart.dispatch');
				myControl.model.addDispatchToQ({"_cmd":"showCart","_zjsid":myControl.sessionId,"_tag": tagObj});
				}
			},

		getCartContents : {
			init : function(tagObj,Q)	{
//				myControl.util.dump('BEGIN myControl.ext.store_cart.calls.getCartContents. callback = '+callback)
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
				Q = Q ? Q : 'immutable'; //allow for muted request, but default to immutable. it's a priority request.
				tagObj.datapointer = "showCart";
				this.dispatch(tagObj,Q);
				return 1;
				},
			dispatch : function(tagObj,Q)	{
//				myControl.util.dump(' -> adding to PDQ. callback = '+callback)
				myControl.model.addDispatchToQ({"_cmd":"showCart","_zjsid":myControl.sessionId,"_tag": tagObj},Q);
				}
			},//getCartContents



		updateCartQty : {
			init : function(stid,qty,tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.store_cart.calls.updateCartQty.');
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
				var r = 0;
				if(!stid || isNaN(qty))	{
					myControl.util.dump(" -> updateCartQty requires both a stid ("+stid+") and a quantity as a number("+qty+")");
					}
				else	{
					r = 1;
					this.dispatch(stid,qty,tagObj);
					}
				return r;
				},
			dispatch : function(stid,qty,tagObj)	{
//				myControl.util.dump(' -> adding to PDQ. callback = '+callback)
				myControl.model.addDispatchToQ({"_cmd":"updateCart","stid":stid,"quantity":qty,"_zjsid":myControl.sessionId,"_tag": tagObj},'immutable');
				}
			 },

		getShippingRates : {
			init : function(tagObj,Q)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; //makesure tagObj is an object so that datapointer can be added w/o causing a JS error
				Q = Q ? Q : 'immutable'; //allow for muted request, but default to immutable. it's a priority request.
				tagObj.datapointer = "getShippingRates";
				this.dispatch(tagObj,Q);
				return 1;
				},
			dispatch : function(tagObj,Q)	{
				myControl.model.addDispatchToQ({"_cmd":"getShippingRates","_tag": tagObj},Q);
				}
			}, //getShippingRatesWithUpdate

//update will modify the cart. only run this when actually selecting a shipping method (like during checkout). heavier call.
		getShippingRatesWithUpdate : {
			init : function(tagObj)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; //makesure tagObj is an object so that datapointer can be added w/o causing a JS error
				tagObj.datapointer = "getShippingRates";
				this.dispatch(tagObj);
				return 1;
				},
			dispatch : function(tagObj)	{
				myControl.model.addDispatchToQ({"_cmd":"getShippingRates","update":"1","trace":"1","_tag": tagObj},'immutable');
				}
			}, //getShippingRatesWithUpdate


		addGiftcardToCart : {
			init : function(giftcard,tagObj)	{
				this.dispatch(giftcard,tagObj);
				return 1; 
				},
			dispatch : function(giftcard,tagObj)	{
				myControl.model.addDispatchToQ({"_cmd":"addGiftcardToCart","giftcard":giftcard,"_tag" : tagObj},'immutable');	
				}			
			}, //addGiftcardToCart

		addCouponToCart : {
			init : function(coupon,tagObj)	{
				this.dispatch(coupon,tagObj);
				return 1; 
				},
			dispatch : function(coupon,tagObj)	{
				myControl.model.addDispatchToQ({"_cmd":"addCouponToCart","coupon":coupon,"_tag" : tagObj},'immutable');	
				}			
			}, //addCouponToCart


		}, //calls




					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration. Use this for any config dependencies that need to occur.
//the init callback is auto-executed as part of the extensions loading process.
//dependencies for other extensions should be listed in vars.dependencies as ['store_prodlist','store_navcats'] and so forth.
		init : {
			onSuccess : function()	{
//				myControl.util.dump('BEGIN myControl.ext.simple_sample.init.onSuccess ');
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				myControl.util.dump('BEGIN myControl.ext.simple_sample.callbacks.init.onError');
				}
			}, //init
		displayCart :  {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.store_cart.callbacks.displayCart.onSuccess');
				myControl.ext.store_cart.vars.cartAccessories = myControl.ext.store_cart.util.getCSVOfAccessories();
				myControl.util.dump(' -> '+tagObj.parentID);
				myControl.renderFunctions.translateTemplate(myControl.data.showCart.cart,tagObj.parentID);
				$parent = $('#'+tagObj.parentID);
//generates the list of lineitems.
				myControl.ext.store_cart.util.showStuff({"parentID":"cartViewerContents","templateID":"cartViewerProductTemplate"});
//update summaries.
//displays subtotals.
				$('#cartSummaryTotals').append(myControl.renderFunctions.createTemplateInstance('cartSummaryTemplate','cartSummary'));
				myControl.renderFunctions.translateTemplate(myControl.data.showCart.cart,'cartSummary');
				
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.store_cart.callbacks.displayCart.onError');
				$('#modalCart').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},



		updateCartLineItem :  {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.store_cart.callbacks.updateCartLineItem.onSuccess');
				
				myControl.renderFunctions.translateTemplate(myControl.data.showCart.cart.stuff[myControl.ext.store_cart.util.getStuffIndexBySTID($('#'+tagObj.parentID).attr('data-pid'))],tagObj.parentID);
				},
			onError : function(d)	{
				targetID = d['_rtag'].parentID ? d['_rtag'].parentID : "globalMessaging";
				$('#'+d['_rtag'].parentID).prepend(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}
		}, //callbacks







////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





		renderFormats : {
			
			cartItemQty : function($tag,data)	{
				$tag.val(data.bindData.cleanValue).attr('data-stid',data.attributes.stid);
//disable quantities on coupons.
				if(data.attributes.stid[0] == '%')
					$tag.attr('disabled','disabled');
				},
			removeItemBtn : function($tag,data)	{
//nuke remove button for coupons.
				if(data.value[0] == '%')	{$tag.remove()}
				else	{
//the click event handles all the requests needed, including updating the totals panel and removing the stid from the dom.
$tag.click(function(){
	myControl.ext.store_cart.util.updateCartQty(data.value,0);
	myControl.model.dispatchThis('immutable');
	});
					}
				},
//for displaying order balance in checkout order totals.				
			orderBalance : function($tag,data)	{
				var o = '';
				var amount = data.bindData.cleanValue;
//				myControl.util.dump('BEGIN myControl.renderFunctions.format.orderBalance()');
//				myControl.util.dump('amount * 1 ='+amount * 1 );
//if the total is less than 0, just show 0 instead of a negative amount. zero is handled here too, just to avoid a formatMoney call.
//if the first character is a dash, it's a negative amount.  JS didn't like amount *1 (returned NAN)
				
				o += data.bindData.pretext ? data.bindData.pretext : '';
				
				if(amount * 1 <= 0){
//					myControl.util.dump(' -> '+amount+' <= zero ');
					o += data.bindData.currencySign ? data.bindData.currencySign : '$';
					o += '0.00';
					}
				else	{
//					myControl.util.dump(' -> '+amount+' > zero ');
					o += myControl.util.formatMoney(amount,data.bindData.currencySign,'',data.bindData.hideZero);
					}
				
				o += data.bindData.posttext ? data.bindData.posttext : '';
				
				$tag.text(o);  //update DOM.
//				myControl.util.dump('END myControl.renderFunctions.format.orderBalance()');
				}, //orderBalance

//displays the shipping method followed by the cost.
//is used in cart summary total during checkout.
			shipInfoById : function($tag,data)	{
				var o = '';
//				myControl.util.dump('BEGIN myControl.renderFormats.shipInfo. (formats shipping for minicart)');
//				myControl.util.dump(data);
				var L = myControl.data.getShippingRates['@methods'].length;
				for(var i = 0; i < L; i += 1)	{
//					myControl.util.dump(' -> method '+i+' = '+myControl.data.getShippingRates['@methods'][i].id);
					if(myControl.data.getShippingRates['@methods'][i].id == data.value)	{
						var pretty = myControl.util.isSet(myControl.data.getShippingRates['@methods'][i]['pretty']) ? myControl.data.getShippingRates['@methods'][i]['pretty'] : myControl.data.getShippingRates['@methods'][i]['name'];  //sometimes pretty isn't set. also, ie didn't like .pretty, but worked fine once ['pretty'] was used.
						o = "<span class='orderShipMethod'>"+pretty+": <\/span>";
//only show amount if not blank.
						if(myControl.data.getShippingRates['@methods'][i].amount)	{
							o += "<span class='orderShipAmount'>"+myControl.util.formatMoney(myControl.data.getShippingRates['@methods'][i].amount,' $',2,false)+"<\/span>";
							}
						break; //once we hit a match, no need to continue. at this time, only one ship method/price is available.
						}
					}
				$tag.html(o);
				}, //shipInfoById


			shipMethodsAsRadioButtons : function($tag,data)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.formats.shipMethodsAsRadioButtons');
				var o = '';
				var shipName;
				var L = data.value.length;


				var id,isSelectedMethod,safeid;  // id is actual ship id. safeid is id without any special characters or spaces. isSelectedMethod is set to true if id matches cart shipping id selected.
				for(var i = 0; i < L; i += 1)	{
					isSelectedMethod = false;
					safeid = myControl.util.makeSafeHTMLId(data.value[i].id);
					id = data.value[i].id;

//whether or not this iteration is for the selected method should only be determined once, but is used on a couple occasions, so save to a var.
					if(id == myControl.data.showCart.cart['ship.selected_id'])	{
						isSelectedMethod = true;
						}

//myControl.util.dump(' -> id = '+id+' and ship.selected_id = '+myControl.data.showCart.cart['ship.selected_id']);
					
					shipName = myControl.util.isSet(data.value[i].pretty) ? data.value[i].pretty : data.value[i].name
					
					o += "<li class='shipcon "
					if(isSelectedMethod)
						o+= ' selected ';
					o += "shipcon_"+safeid; 
					o += "'><input type='radio' name='ship.selected_id' id='ship-selected_id_"+safeid+"' value='"+id+"' onClick='myControl.ext.store_cart.util.shipMethodSelected(this.value,\""+safeid+"\"); myControl.model.dispatchThis(\"immutable\"); '";
					if(isSelectedMethod)
						o += " checked='checked' "
					o += "/><label for='ship-selected_id_"+safeid+"'>"+shipName+": <span >"+myControl.util.formatMoney(data.value[i].amount,'$','',false)+"<\/span><\/label><\/li>";
					}
				$tag.html(o);
				}


			},





////////////////////////////////////   UTIL    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





		util : {
/*
Guess what this does?  Yep, shows the cart in a modal. shocking, no?
In this case, the id is hard coded because we only want one instantation of the cart at a time.
It also allows us to nuke it during checkout, if need be (ensure no duplicate id's)

//put the loadingBG class into the template, not onto the div created here (jqueryUI classes will override it).
*/
			showCartInModal : function(templateID)	{
				var $parent = $('#modalCart');
//if the parent doesn't already exist, add it to the dom.
				if($parent.length == 0)	{
					$parent = $("<div \/>").attr({"id":"modalCart","title":"Your Shopping Cart"}).appendTo(document.body);
					}
				else	{
//empty the existing cart and add a loadingBG so that the user sees something is happening.
					$parent.empty();
					}
//populate the modal with the template (which includes 'loadingBG'.
				$parent.append(myControl.renderFunctions.createTemplateInstance(templateID,"modalCartContents"));
				if(myControl.ext.store_cart.calls.showCart.init({"callback":"displayCart","templateID":templateID,"parentID":"modalCartContents","extension":"store_cart"})){
					myControl.model.dispatchThis();
					}
//show modal, even though pretty much empty. Allows for something to happen right away so user knows the app is working on it.
				$parent.dialog({modal: true,width:$(window).width() - 48,height:$(window).height() - 48});
				
				}, //showCartInModal

//executed when a giftcard is submitted. handles ajax call for giftcard and also updates cart.
//no 'loadingbg' is needed on button because entire panel goes to loading onsubmit.
//panel is reloaded in case the submission of a gift card changes the payment options available.
			handleGiftcardSubmit : function(v,parentID)	{
				myControl.ext.store_cart.calls.addGiftcardToCart.init(v,{"parentID":parentID,"message":"Giftcard Added!","callback":"showMessaging"});
				this.updateCartSummary();
				if(parentID)
					$('#'+parentID+' .zMessage').empty().remove(); //get rid of any existing messsaging.
				}, //handleGiftcardSubmit



//run when a shipping method is selected. updates cart/session and adds a class to the radio/label
//the dispatch occurs where/when this function is executed, NOT as part of the function itself.
			shipMethodSelected : function(shipID,safeID)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.utilities.');	
//				myControl.util.dump('value = '+shipID);	
				myControl.calls.setSessionVars.init({'ship.selected_id':shipID});
				myControl.ext.store_cart.calls.getShippingRatesWithUpdate.init(); //updates shiping rates AND updates cart (though doesn't request cart).
				this.updateCartSummary();
//				myControl.util.dump('END myControl.checkoutFunctions.ShipMethod. shipID = '+shipID);			
				}, //updateShipMethod


//executed when a coupon is submitted. handles ajax call for coupon and also updates cart.
			handleCouponSubmit : function(v,parentID)	{
				myControl.ext.store_cart.calls.addCouponToCart.init(v,{"parentID":parentID,"message":"Coupon Added!","callback":"showMessaging"}); 
				this.updateCartSummary();
				if(parentID)
					$('#'+parentID+' .zMessage').empty().remove(); //get rid of any existing messsaging.
				}, //handleCouponSubmit

			updateCartSummary : function()	{
				$('#cartSummaryTotals').empty().append(myControl.renderFunctions.createTemplateInstance('cartSummaryTemplate','cartSummary'));
				myControl.ext.store_cart.calls.getCartContents.init({'callback':'translateTemplate','parentID':'cartSummary'},'immutable');
//don't set this up with a getShipping because we don't always need it.  Add it to parent functions when needed.
				},
/*
running showStuff will display a list of the items that are in the cart.
Parameters expected are:
	parentID = the name of the container html element (each stid is added as a child to this).
	templateID = the name of the template to use.
*/
			showStuff : function(P)	{
//				myControl.util.dump("BEGIN store_cart.util.showStuff");
				if(!P.parentID || !P.templateID)	{
					myControl.util.dump(" -> parentID ("+P.parentID+") and/or TemplateID ("+P.templateID+") blank. both are required.");
					}
				else	{
					$parent = $('#'+P.parentID);
					var L = myControl.data.showCart.cart.stuff.length;
					var stid; //stid for item in loop.
					myControl.util.dump(" -> items in stuff = "+L);
					
					for(var i = 0; i < L; i += 1)	{
						stid = myControl.data.showCart.cart.stuff[i].stid
						myControl.util.dump(" -> stid["+i+"] = "+stid);
						$parent.append(myControl.renderFunctions.createTemplateInstance(P.templateID,{"id":"cartViewer_"+stid,"pid":stid}));
						myControl.renderFunctions.translateTemplate(myControl.data.showCart.cart.stuff[i],"cartViewer_"+stid);
						}
					}
				}, //showStuff
				
//useful if you need to reference something in the cart and all you have is the stid.
//returns the index so that you can point to it.
			getStuffIndexBySTID : function(stid)	{
				var L = myControl.data.showCart.cart.stuff.length;
				var r = false;
				for(var i = 0; i < L; i += 1)	{
					if(myControl.data.showCart.cart.stuff[i].stid == stid)	{
						r = i;
						break; //once we have a match, kill the loop.
						}
					}
				return r;
				},
/*
executing when quantities are adjusted for a given cart item.
call is made to update quantities.
since the target/parent already exists and we don't want to create a new one, don't create a new instance.
the callback will update the existing and content will be replaced.  cart totals goes to 'loading' so it's clear
something is happening.

*/
			updateCartQty : function(stid,qty,tagObj)	{
				if(stid)	{
					myControl.util.dump('got stid: '+stid);
//some defaulting. a bare minimum callback needs to occur. if there's a business case for doing absolutely nothing
//then create a callback that does nothing. IMHO, you should always let the user know the item was modified.
//you can do something more elaborate as well, just by passing a different callback.
					tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
					tagObj.callback = tagObj.callback ? tagObj.callback : 'updateCartLineItem';
					tagObj.extension = tagObj.extension ? tagObj.extension : 'store_cart';
					tagObj.parentID = 'cartViewer_'+myControl.util.makeSafeHTMLId(stid);
/*
the request for quantity change needs to go first so that the request for the cart reflects the changes.
the dom update for the lineitem needs to happen last so that the cart changes are reflected, so a ping is used.
*/
					myControl.ext.store_cart.calls.updateCartQty.init(stid,qty);
					this.updateCartSummary();
//lineitem template only gets updated if qty > 1 (less than 1 would be a 'remove').
					if(qty >= 1)	{
						myControl.calls.ping.init(tagObj,'immutable');
						}
					else	{
						$('#cartViewer_'+myControl.util.makeSafeHTMLId(stid)).empty().remove();
						}

					}
				else	{
					myControl.util.dump(' -> a stid is required to do an update cart.');
					}
				},

/*
Will get a csv of accessoreis from items that are in the cart.
will remove any duplicates.
### eventually, it'd be nice if this ordered the array by relevance.
so if an accessory showed up on four items in the cart, it'd be higher in the list (more relevant).
*/

			getCSVOfAccessories : function()	{
//				myControl.util.dump("BEGIN store_cart.util.getCSVOfAccessories");
				var csvArray = new Array(); //what is returned.
				var proda; //product accessories for the item in focus.
				var prodArray = new Array();
				var i,j,L,M; //used in the two loops below. yes, i know loops inside of loops are bad, but these are small datasets we're dealing with.
				M = myControl.data.showCart.cart['stuff'].length;
//				myControl.util.dump(" -> items in cart = "+M);
				for(j = 0; j < M; j += 1)	{
					if(proda = myControl.data.showCart.cart['stuff'][j]['full_product']['zoovy:accessory_products'])	{
//						myControl.util.dump(" -> item has accessories: "+proda);
						prodArray = proda.split(',');
						L = prodArray.length
//						myControl.util.dump(" -> item has "+L+" accessories");
						for(var i = 0; i < L; i += 1)	{
							csvArray.push(prodArray[i])
							}
						prodArray = []; //empty to avoid errors.
						}
					}
//				myControl.util.dump(csvArray);
				csvArray = $.grep(csvArray,function(n){return(n);}); //remove blanks
				return myControl.util.removeDuplicatesFromArray(csvArray);
				} //getCSVOfAccessories
			
			} //util


		
		} //r object.
	return r;
	}