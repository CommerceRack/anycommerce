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


var google_analytics = function(_app) {
	var r = {
		
		vars : {
//GA records an app visit/departure as a bounce unless an event is fired triggering the opt_noninteraction option.
//so we fire one off after the page changes once. This var is used to track it so that we don't fire it off multiple times.
			triggeredBounceCode : false //Need to fire some event after app inits and after page change to get google to track bounces correc
			},

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		callbacks : {
			init : {
				onSuccess : function()	{
					
/*
To keep this extension as self-contained as possible, it loads it's own script.
the callback is handled in the extension loader. It will handle sequencing for the most part.
The startExtension will re-execute if this script isn't loaded until it has finished loading.
*/
					_app.u.loadScript(('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.google-analytics.com/ga.js');
					if(zGlobals.checkoutSettings.googleCheckoutMerchantId)	{
						_app.u.loadScript(('https:' == document.location.protocol ? 'https://' : 'http://') + 'checkout.google.com/files/digital/ga_post.js'); //needed 4 tracking google wallet orders in GA.
						}

					return true;
					},
				onError : function()	{
	//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
	//you may or may not need it.
					_app.u.dump('BEGIN _app.ext.google_analytics.callbacks.init.onError');
					}
				},

			startExtension : {
				onSuccess : function(){
//					_app.u.dump("BEGIN google_analytics.callbacks.startExtension.onSuccess");

//make sure that not only has myRIA been loaded, but that the createTemplateFunctions has executed
					if(_app.templates && _app.templates.productTemplate && typeof _gaq == 'object')	{

//_app.u.dump(" -> adding triggers");
_app.templates.homepageTemplate.on('complete.googleanalytics',function($ele,P) {_gaq.push(['_trackPageview', '/index.html']); _app.ext.google_analytics.u.handleAntiBounceEvent(P);})
_app.templates.categoryTemplate.on('complete.googleanalytics',function($ele,P) {_gaq.push(['_trackPageview', '/category/'+P.navcat]); _app.ext.google_analytics.u.handleAntiBounceEvent(P);})
_app.templates.productTemplate.on('complete.googleanalytics',function($ele,P) {_gaq.push(['_trackPageview', '/product/'+P.pid]); _app.ext.google_analytics.u.handleAntiBounceEvent(P);})
_app.templates.companyTemplate.on('complete.googleanalytics',function($ele,P) {_gaq.push(['_trackPageview', '/company/'+P.show]); _app.ext.google_analytics.u.handleAntiBounceEvent(P);})
_app.templates.customerTemplate.on('complete.googleanalytics',function($ele,P) {_gaq.push(['_trackPageview', '/customer/'+P.show]); _app.ext.google_analytics.u.handleAntiBounceEvent(P);}) 
_app.templates.checkoutTemplate.on('init.googleanalytics',function($ele,P) {_gaq.push(['_trackPageview', '/checkout']); _app.ext.google_analytics.u.handleAntiBounceEvent(P);}) 

_app.templates.searchTemplate.on('init.googleanalytics',function($ele,P) {
	_gaq.push('_trackPageview','/search?KEYWORDS='+P.KEYWORDS);
	_app.ext.google_analytics.u.handleAntiBounceEvent(P);
	}) 
//404's don't execute the anti-bounce event because if you go homepage then 404 and leave, it should register as a bounce.
_app.templates.pageNotFoundTemplate.on('complete.googleanalytics',function(P) {_gaq.push(['_trackPageview', '/404.html?page=' + document.location.pathname + document.location.search + '&from=' + document.referrer]);})


//for GoogleTrustedStores.
_app.ext.order_create.checkoutCompletes.push(function(P){
	if(typeof window.GoogleTrustedStore)	{
		if(P && P.datapointer && _app.data[P.datapointer] && _app.data[P.datapointer].order)	{
			var order = _app.data[P.datapointer].order,
			$div = $("<div \/>",{'id':'gts-order'}),
			L = order['@ITEMS'].length, hasPreBack = 'N', discounts = 0;
			
			for(var i = 0; i < L; i += 1)	{
				if(order['@ITEMS'][i].sku.charAt(0) == '%')	{discounts += Number(order['@ITEMS'][i].extended)}
				}
			
			$("<span \/>",{'id':'gts-o-id'}).text(P.orderID).appendTo($div);
			$("<span \/>",{'id':'gts-o-domain'}).text(document.domain).appendTo($div); //sdomain
			$("<span \/>",{'id':'gts-o-email'}).text(order.customer.login || order.bill.email).appendTo($div);
			$("<span \/>",{'id':'gts-o-country'}).text(order.bill.countrycode).appendTo($div);
			$("<span \/>",{'id':'gts-o-total'}).text(order.sum.order_total).appendTo($div);
			$("<span \/>",{'id':'gts-o-currency'}).text('USD').appendTo($div);
			$("<span \/>",{'id':'gts-o-discounts'}).text(discounts).appendTo($div);
			$("<span \/>",{'id':'gts-o-shipping-total'}).text(order.sum.ship_total).appendTo($div);
			$("<span \/>",{'id':'gts-o-tax-total'}).text(order.sum.tax_total).appendTo($div);
			//$("<span \/>",{'id':'gts-o-est-ship-date'}).text("").appendTo($div); //!!! needs to be set.
			$("<span \/>",{'id':'gts-o-has-preorder'}).text(hasPreBack).appendTo($div); //set in loop above.
			$("<span \/>",{'id':'gts-o-has-digital'}).text('N').appendTo($div);
			
			$div.appendTo('body');

//delete existing object or gts conversion won't load right.
			delete window.GoogleTrustedStore; 
//this function will re-load the gts code. The spans above tell the GTS store to treat this as a conversion.
//so it's important those spans are added to the DOM prior to this code being run.
			(function() {
			var scheme = (("https:" == document.location.protocol) ? "https://" : "http://");
			var gts = document.createElement("script");
			gts.type = "text/javascript";
			gts.async = true;
			gts.src = scheme + "www.googlecommerce.com/trustedstores/gtmp_compiled.js";
			var s = document.getElementsByTagName("script")[0];
			s.parentNode.insertBefore(gts, s);
			})();


			}
		else	{
			//unable to determine order contents.
			}
		}
	});


_app.ext.order_create.checkoutCompletes.push(function(P){
	_app.u.dump("BEGIN google_analytics code pushed on order_create.checkoutCompletes");
	if(P && P.datapointer && _app.data[P.datapointer] && _app.data[P.datapointer].order)	{
		var order = _app.data[P.datapointer].order;
		_gaq.push(['_addTrans',
			  P.orderID,           // order ID - required
			  '', // affiliation or store name
			  order.sum.order_total,          // total - required
			  order.sum.tax_total,           // tax
			  order.sum.ship_total,          // shipping
			  order.sum.city,       // city
			  order.sum.region,     // state or province
			  order.sum.countrycode             // country
		   ]);
	
		var L = order['@ITEMS'].length;
		_app.u.dump(" -> "+L+" items in @ITEMS");
	
		for(var i = 0; i < L; i += 1)	{
			_gaq.push(['_addItem',
				P.orderID,         // order ID - necessary to associate item with transaction
				order['@ITEMS'][i].product,         // SKU/code - required
				order['@ITEMS'][i].prod_name,      // product name - necessary to associate revenue with product
				order['@ITEMS'][i].stid, // category or variation
				order['@ITEMS'][i].base_price,        // unit price - required
				order['@ITEMS'][i].qty             // quantity - required
				]);
			}
		_gaq.push(['_trackTrans']);
		}
	else	{
		//unable to determine order contents.
		}
	}); // end .push					

						}
					else	{
						setTimeout(function(){_app.ext.google_analytics.callbacks.startExtension.onSuccess()},250);
						}

					},
				onError : function(){}
				}
			}, //callbacks
			u : {
				handleAntiBounceEvent : function(P)	{
//see comment up by var triggerBounceCode for what this is for.
					if(!_app.ext.google_analytics.vars.triggeredBounceCode)	{
						_gaq.push(['_trackEvent','pageView','navigate','','',false]);
						_app.ext.google_analytics.vars.triggeredBounceCode = true;
						}
					else	{
						//catch. 
						}
					}
				} //util
		} //r object.
	return r;
	}