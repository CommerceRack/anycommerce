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


var store_search = function() {
	var r = {
		

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		callbacks : {
			init : {
				onSuccess : function()	{
	//				myControl.util.dump('BEGIN myControl.ext.store_navcats.init.onSuccess ');
					var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
					if(typeof _gaq == 'object')	{
myControl.ext.myRIA.template.homepageTemplate.onCompletes.push(function(P) {_gaq.push(['_trackPageview', '/index.html']);})
myControl.ext.myRIA.template.categoryTemplate.onCompletes.push(function(P) {_gaq.push(['_trackPageview', '/category/'+P.navcat]);})
myControl.ext.myRIA.template.productTemplate.onCompletes.push(function(P) {_gaq.push(['_trackPageview', '/product/'+P.pid]);})
myControl.ext.myRIA.template.companyTemplate.onCompletes.push(function(P) {_gaq.push(['_trackPageview', '/company/'+P.show]);})
myControl.ext.myRIA.template.customerTemplate.onCompletes.push(function(P) {_gaq.push(['_trackPageview', '/customer/'+P.show]);}) 
myControl.ext.myRIA.template.checkoutTemplate.onInits.push(function(P) {_gaq.push(['_trackPageview', '/checkout']);}) 
myControl.ext.myRIA.template.pageNotFoundTemplate.onCompletes.push(function(P) {_gaq.push(['_trackPageview', '/404.html?page=' + document.location.pathname + document.location.search + '&from=' + document.referrer]);})
							
myControl.ext.store_checkout.checkoutCompletes.push(function(P){
var order = myControl.data['order|'+P.orderID].cart;
_gaq.push(['_addTrans',
      P.orderID,           // order ID - required
      'Womens Apparel', // affiliation or store name
      order['data.order_total'],          // total - required
      order['data.tax_total'],           // tax
      order['ship.selected_price'],          // shipping
      order['data.ship_city'],       // city
      order['data.ship_state'],     // state or province
      order['data.ship_country']             // country
   ]);
/*
var L = order.stuff.length;
for(var i = 0; i < L; i +1)	{
_gaq.push(['_addItem',
		P.orderID,         // order ID - necessary to associate item with transaction
		P.stuff[i].product,         // SKU/code - required
		P.stuff[i].prod_name,      // product name - necessary to associate revenue with product
		P.stuff[i].stid, // category or variation
		P.stuff[i].base_price,        // unit price - required
		P.stuff[i].qty             // quantity - required
		]);
	}
*/
_gaq.push(['_trackTrans']);

	}); // end .push					
						
						}
					else	{
						r = false;
						}
					return r;
					},
				onError : function()	{
	//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
	//you may or may not need it.
					myControl.util.dump('BEGIN myControl.ext.store_navcats.callbacks.init.onError');
					}
				}
			} //r object.
		}
	return r;
	}