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
An extension for acquiring and displaying 'lists' of categories.
The functions here are designed to work with 'reasonable' size lists of categories.
*/


var buysafe_guarantee = function(_app) {
	var r = {
		
		vars : {
			"dependAttempts" : 0,  //used to count how many times loading the dependencies has been attempted.
			"dependencies" : ['myRIA'] //a list of other extensions (just the namespace) that are required for this one to load
			},

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		callbacks : {
			init : {
				onSuccess : function()	{
					_app.u.dump('BEGIN _app.ext.buysafe_guarantee.onSuccess');
/*
To keep this extension as self-contained as possible, it loads it's own script.
the callback is handled in the extension loader. It will handle sequencing for the most part.
The startExtension will re-execute if this script isn't loaded until it has finished loading.
*/
					_app.u.loadScript('https://seal.buysafe.com/private/rollover/rollover.js');
					return true; //return false if extension won't load for some reason (account config, dependencies, etc).
					},
				onError : function()	{
	//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
	//you may or may not need it.
					_app.u.dump('BEGIN _app.ext.store_navcats.callbacks.init.onError');
					}
				},

			startExtension : {
				onSuccess : function(){

_app.u.dump("BEGIN buysafe_guarantee.startExtension.onSuccess.");

//make sure the templates have been loaded. all the myRIA templates are loaded at the same time.
					if(_app.templates && _app.templates.productTemplate && typeof WriteBuySafeKickers == 'function' && typeof buySAFE == 'object')	{

//http://developer.buysafe.com/bsg_overview.php
//http://www.buysafe.com/web/general/kickerpreview.aspx
buySAFE.Hash = ''; //ADD HASH HERE.

if(buySAFE.Hash.length > 0)	{
	//the showContent function may have already executed prior to startExtension getting executed.
	WriteBuySafeKickers();

	_app.templates.productTemplate.on('complete.buysafe',function($ele,P) {
//		_app.u.dump("Execute WriteBuySafeKicker");
		//buysafe trigger goes here.
		WriteBuySafeKickers();
		})
	_app.templates.cartTemplate.on('complete.buysafe',function($ele,P) {
		//buysafe trigger goes here.
		WriteBuySafeKickers();
		})
	
								
	_app.templates.checkoutTemplate.on('complete.buysafe',function($ele,P){
		
		_app.u.dump("BEGIN buysafe_guarantee code pushed on order_create.checkoutCompletes");
		var order = _app.data['order|'+P.orderID].cart;
	
	   buySAFE.Guarantee.order = P.orderID;
	   buySAFE.Guarantee.subtotal = order['sum/items_total'];
	   buySAFE.Guarantee.email = order['bill/email'];
	   WriteBuySafeGuarantee("JavaScript");
	
		}); // end .push					
	}
else	{
	_app.u.dump("WARNING! buySAFE.Hash not set/valid ["+buySAFE.Hash+"]");
	}
						}
					else	{
						setTimeout(function(){_app.ext.buysafe_guarantee.callbacks.startExtension.onSuccess()},250);
						}

					},
				onError : function(){}
				}
			} //r object.
		}
	return r;
	}