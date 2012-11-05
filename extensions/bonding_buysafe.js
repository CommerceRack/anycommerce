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


var bonding_buysafe = function() {
	var r = {
		
		vars : {
			"dependAttempts" : 0,  //used to count how many times loading the dependencies has been attempted.
			"dependencies" : ['myRIA'] //a list of other extensions (just the namespace) that are required for this one to load
			},

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		callbacks : {
			init : {
				onSuccess : function()	{
					app.u.dump('BEGIN app.ext.bonding_buysafe.onSuccess');
/*
To keep this extension as self-contained as possible, it loads it's own script.
the callback is handled in the extension loader. It will handle sequencing for the most part.
The startExtension will re-execute if this script isn't loaded until it has finished loading.
*/
					app.u.loadScript('https://seal.buysafe.com/private/rollover/rollover.js');
					return true; //return false if extension won't load for some reason (account config, dependencies, etc).
					},
				onError : function()	{
	//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
	//you may or may not need it.
					app.u.dump('BEGIN app.ext.store_navcats.callbacks.init.onError');
					}
				},

			startExtension : {
				onSuccess : function(){

app.u.dump("BEGIN bonding_buysafe.startExtension.onSuccess.");

//make sure that not only has myRIA been loaded, but that the createTemplateFunctions has executed
					if(app.ext.myRIA && app.ext.myRIA.template && app.ext.myRIA.template.productTemplate && typeof WriteBuySafeKickers == 'function' && typeof buySAFE == 'object')	{

//http://developer.buysafe.com/bsg_overview.php
//http://www.buysafe.com/web/general/kickerpreview.aspx
buySAFE.Hash = ''; //ADD HASH HERE.

if(buySAFE.Hash.length > 0)	{
	//the showContent function may have already executed prior to startExtension getting executed.
	WriteBuySafeKickers();
	
	//app.u.dump("BEGIN analytics_google.callbacks.addGATriggers");
	app.ext.myRIA.template.productTemplate.onCompletes.push(function(P) {
//		app.u.dump("Execute WriteBuySafeKicker");
		//buysafe trigger goes here.
		WriteBuySafeKickers();
		})
	app.ext.myRIA.template.cartTemplate.onCompletes.push(function(P) {
		//buysafe trigger goes here.
		WriteBuySafeKickers();
		})
	
								
	app.ext.store_checkout.checkoutCompletes.push(function(P){
		
		app.u.dump("BEGIN bonding_buysafe code pushed on store_checkout.checkoutCompletes");
		var order = app.data['order|'+P.orderID].cart;
	
	   buySAFE.Guarantee.order = P.orderID;
	   buySAFE.Guarantee.subtotal = order['sum/items_total'];
	   buySAFE.Guarantee.email = order['bill/email'];
	   WriteBuySafeGuarantee("JavaScript");
	
		}); // end .push					
	}
else	{
	app.u.dump("WARNING! buySAFE.Hash not set/valid ["+buySAFE.Hash+"]");
	}
						}
					else	{
						setTimeout(function(){app.ext.bonding_buysafe.callbacks.startExtension.onSuccess()},250);
						}

					},
				onError : function(){}
				}
			} //r object.
		}
	return r;
	}