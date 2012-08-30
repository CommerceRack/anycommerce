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


var analytics_google = function() {
	var r = {
		
		vars : {
			"dependAttempts" : 0,  //used to count how many times loading the dependencies has been attempted.
			"dependencies" : ['myRIA'] //a list of other extensions (just the namespace) that are required for this one to load
			},

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		callbacks : {
			init : {
				onSuccess : function()	{
/*
To keep this extension as self-contained as possible, it loads it's own script.
the callback is handled in the extension loader. It will handle sequencing for the most part.
The addTriggers will re-execute if this script isn't loaded until it has finished loading.
*/
					app.u.loadScript(('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js');
					return true;
					},
				onError : function()	{
	//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
	//you may or may not need it.
					app.u.dump('BEGIN app.ext.store_navcats.callbacks.init.onError');
					}
				},

			addTriggers : {
				onSuccess : function(){
//make sure that not only has myRIA been loaded, but that the createTemplateFunctions has executed
					if(app.ext.myRIA && app.ext.myRIA.template && typeof _gaq == 'object')	{

app.u.dump("BEGIN analytics_google.callbacks.addTriggers");
app.ext.myRIA.template.homepageTemplate.onCompletes.push(function(P) {_gaq.push(['_trackPageview', '/index.html']);})
app.ext.myRIA.template.categoryTemplate.onCompletes.push(function(P) {_gaq.push(['_trackPageview', '/category/'+P.navcat]);})
app.ext.myRIA.template.productTemplate.onCompletes.push(function(P) {_gaq.push(['_trackPageview', '/product/'+P.pid]);})
app.ext.myRIA.template.companyTemplate.onCompletes.push(function(P) {_gaq.push(['_trackPageview', '/company/'+P.show]);})
app.ext.myRIA.template.customerTemplate.onCompletes.push(function(P) {_gaq.push(['_trackPageview', '/customer/'+P.show]);}) 
app.ext.myRIA.template.checkoutTemplate.onInits.push(function(P) {_gaq.push(['_trackPageview', '/checkout']);}) 
app.ext.myRIA.template.pageNotFoundTemplate.onCompletes.push(function(P) {_gaq.push(['_trackPageview', '/404.html?page=' + document.location.pathname + document.location.search + '&from=' + document.referrer]);})
							
app.ext.store_checkout.checkoutCompletes.push(function(P){
	
	app.u.dump("BEGIN analytics_google code pushed on store_checkout.checkoutCompletes");
	var order = app.data['order|'+P.orderID].cart;
	_gaq.push(['_addTrans',
		  P.orderID,           // order ID - required
		  '', // affiliation or store name
		  order['data.order_total'],          // total - required
		  order['data.tax_total'],           // tax
		  order['ship.selected_price'],          // shipping
		  order['data.ship_city'],       // city
		  order['data.ship_state'],     // state or province
		  order['data.ship_country']             // country
	   ]);

	var L = order.stuff.length;
	app.u.dump(" -> "+L+" items in stuff");

	for(var i = 0; i < L; i += 1)	{
//		app.u.dump(" -> "+i+": stid = "+order.stuff[i].stid+" and qty = "+order.stuff[i]['qty']);
		_gaq.push(['_addItem',
			P.orderID,         // order ID - necessary to associate item with transaction
			order.stuff[i].product,         // SKU/code - required
			order.stuff[i].prod_name,      // product name - necessary to associate revenue with product
			order.stuff[i].stid, // category or variation
			order.stuff[i].base_price,        // unit price - required
			order.stuff[i].qty             // quantity - required
			]);
		}
	_gaq.push(['_trackTrans']);

	}); // end .push					

						}
					else	{
						setTimeout(function(){app.ext.analytics_google.callbacks.addTriggers.onSuccess()},250);
						}

					},
				onError : function(){}
				}
			} //r object.
		}
	return r;
	}