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
An extension for Google Adwords conversion tracking. 

This extension is untested.

*/

var google_adwords = function() {
	var r= {
		vars : {

		},
		
		callbacks : {
			init : {
				onSuccess : function(){
					//nothing needs to be loaded except on conversion.
					return true;
				},
				onError : function() {
					app.u.dump('BEGIN app.ext.google_adwords.callbacks.init.onError');
				}
			},
			
			startExtension : {
				onSuccess : function (){
					if(app.ext.myRIA && app.ext.myRIA.template){
						app.ext.store_checkout.checkoutCompletes.push(function(P){
							app.u.dump("BEGIN google_adwords code pushed on store_checkout.checkoutCompletes");
							var order = app.data['order|'+P.orderID];
							google_conversion_value = order.sum.items_total;
							app.u.loadScript(('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.googleadservices.com/pagead/conversion.js');
						});
					} else	{
						setTimeout(function(){app.ext.google_adwords.callbacks.startExtension.onSuccess()},250);
					}
				},
				onError : function (){
					app.u.dump('BEGIN app.ext.google_adwords.callbacks.startExtension.onError');
				}
			}
		}
	}
	return r;
}