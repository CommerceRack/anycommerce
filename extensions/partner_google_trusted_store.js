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


var google_ts = function() {
	var r = {
		
		vars : {},

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		callbacks : {
			init : {
				onSuccess : function()	{

//This is the badge code.
window.gts = gts || [];
gts.push(["id", "66091"]);
gts.push(["google_base_offer_id", "%PRODUCT%"]);
gts.push(["google_base_subaccount_id", "3289549"]);
gts.push(["google_base_country", "US"]);
gts.push(["google_base_language", "EN"]);
app.u.loadScript((("https:" == document.location.protocol) ? "https://" : "http://") + 'www.googlecommerce.com/trustedstores/gtmp_compiled.js');
					return true;
					},
				onError : function()	{
	//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
	//you may or may not need it.
					app.u.dump('BEGIN app.ext.store_navcats.callbacks.init.onError');
					}
				},

			startExtension : {
				onSuccess : function(){
//make sure that not only has myRIA been loaded, but that the createTemplateFunctions has executed
					if(app.ext.store_checkout && app.ext.store_checkout.checkoutCompletes && typeof _gaq == 'object')	{
//executed after checkout.
app.ext.store_checkout.checkoutCompletes.push(function(P){
	var order = app.data['order|'+P.orderID];
	var gts_output = "<!-- START Trusted Stores Order --><div id='gts-order' style='display:none;'><!-- start order and merchant information --> <span id='gts-o-id'>"+order.our.orderID+"</span><span id='gts-o-domain'>"+app.vars.httpURL+"</span><span id='gts-o-email'>"+order.bill.email+"</span><span id='gts-o-country'>"+order.bill.country+"</span><span id='gts-o-currency'>USD</span><span id='gts-o-total'>"+order.sum.order_total+"</span><span id='gts-o-discounts'>0</span><span id='gts-o-shipping-total'>"+order.sum.shp_total+"</span><span id='gts-o-tax-total'>"+order.sum.tax_total+"</span><span id='gts-o-est-ship-date'></span><span id='gts-o-has-preorder'>N</span><span id='gts-o-has-digital'>N</span><!-- end order and merchant information --><!-- start repeated item specific information -->%GOOGLE_TRUSTED_STORES_ITEM_SPANS%<!-- end repeated item specific information -->";
	
	var L = order['@ITEMS'].length;
	for(var i = 0; i < L; i += 1)	{
		gts_output += 	"<span class='gts-item'>"
					+		"<span class='gts-i-name'>"+order['@ITEMS'][i].prod_name+"</span>"
					+		"<span class='gts-i-price'>"+order['@ITEMS'][i].base_price+"</span>"
					+		"<span class='gts-i-quantity'>"+order['@ITEMS'][i].qty+"</span>"
					+	"</span>";
		}
/*
left out of lineitem for now.
<span class="gts-i-prodsearch-id">ITEM_GOOGLE_SHOPPING_ID</span>
<span class="gts-i-prodsearch-store-id">ITEM_GOOGLE_SHOPPING_ACCOUNT_ID</span>
<span class="gts-i-prodsearch-country">ITEM_GOOGLE_SHOPPING_COUNTRY</span>
<span class="gts-i-prodsearch-language">ITEM_GOOGLE_SHOPPING_LANGUAGE</span>
*/	
	gts_output += "</div><!-- END Trusted Stores -->";
	
	$('body').append(gts_output);
	});
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