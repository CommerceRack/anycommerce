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

************************************************************** */



/*
Description: 
An alternative action for cart display after adding an item to the cart. 
Instead of the full-blown cart modal, this will animate a small element in from the right and display either the item added (if successful) or the error message.
Also will auto-retract after five seconds and includes a shop more button (which also retracts the element) and a checkout button.

Dependencies:  
store_product (for add to cart validation).

To implement, change the action on the productTemplate Add to cart to this:
onSubmit="_app.ext.cart_quickadd.a.addItemToCart($(this)); return false;"

OR, if app events are supported in the product layout (they are not at this time, but it's anticipated):
<form data-app-event="cart_quickadd|execQuickaddCartAppend"...

*/


var cart_quickadd = function(_app) {
	
	var theseTemplates = new Array('cartQuickaddTemplate');
	var r = {

	vars : {
		willFetchMyOwnTemplates : true, //set to false if you move the template to your view. more efficient that way.
		templates : theseTemplates
		},

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				if(_app.ext.cart_quickadd.vars.willFetchMyOwnTemplates)	{
					_app.model.fetchNLoadTemplates(_app.vars.baseURL+'extensions/cart_quickadd/templates.html');
					}
				//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
				r = true;

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				_app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
		a : {
			//add this as the action on your form
			addItemToCart : function($form)	{

				var quickAddCallback = function(rd){
					var $QC = $("#quickaddCart")
					$QC.hideLoading(); //only close on error. otherwise leave for removal in subsequent call.
					if(_app.model.responseHasErrors(rd)){
						$QC.anymessage({'message':rd});
						}
					else	{
						$QC.anycontent({'templateID':'cartQuickaddTemplate',data:_app.data['appProductGet|'+$("input[name='sku']",$form).val()]});
						_app.u.handleAppEvents($QC);
						}
//close panel whether a success or error is shown.
					setTimeout(function(){
						if($QC.is(':visible'))	{
							_app.ext.cart_quickadd.u.cartHide();
							}
						else	{} //already minimized, do nothing.
						},5000);
					}
				//the handle add to cart will take care of variations validation and error display.
				if(_app.ext.store_product.u.handleAddToCart($form,{'callback':quickAddCallback}))	{
					_app.ext.cart_quickadd.u.cartShow(); //opens the cart and goes into a 'loading' state.
					}
				else {} //no default 'fail' action. the function above handles it.
				} //addItemToCart
			}, //Actions

////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		u : {

			cartShow : function()	{
				_app.u.dump("BEGIN cart_quickadd.u.cartShow");
				var $QC = $("#quickaddCart");
				if($QC.length)	{$QC.empty()}
				else	{
					$QC = $("<div \/>",{'id':'quickaddCart'}).css({'display':'none','position':'fixed','font-size':'.75em','top':100,'right':-250,'z-index':10000,'min-height':100,'width':270}).addClass('ui-widget ui-widget-content ui-corner-left');
					$QC.appendTo('body');
					}
				
				
				if($QC.is(':visible'))	{} //already visible. no animation necessary.
				else	{
					$QC.show();
					$QC.animate({right: -10}, 'slow');
					}
				$QC.showLoading({'message':'Adding Item To Cart'});
				
				}, //cartShow
				
			cartHide : function()	{
				var $QC = $("#quickaddCart");
				if($QC.is(':animated'))	{} //already animating. do nothing.
				else	{
					$QC.animate({right: -250}, 'slow',function(){$QC.hide()});
					}
				} //cartHide
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			execQuickaddCartHide : function($btn)	{
				$btn.button();
				$btn.off('click.execQuickaddCartHide').on('click.execQuickaddCartHide',function(event){
					event.preventDefault();
					_app.ext.cart_quickadd.u.cartHide();
					});
				}, //execQuickaddCartHide

			execQuickaddCartAppend : function($form)	{
				$form.off('submit.execQuickaddCartAppend').on('submit.execQuickaddCartAppend',function(event){
					event.preventDefault();
					_app.ext.cart_quickadd.a.addItemToCart($form);
					});
				}, //execQuickaddCartAppend

			execCheckoutShow : function($btn)	{
				$btn.button();
				$btn.off('click.execCheckout').on('click.execCheckout',function(event){
					event.preventDefault();
					_app.ext.cart_quickadd.u.cartHide();
					showContent('checkout',{'show':'checkout'});
					});
				} //execCheckoutShow

			} //e [app Events]
		} //r object.
	return r;
	}