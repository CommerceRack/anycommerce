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

var google_adwords = function(_app) {
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
					_app.u.dump('BEGIN _app.ext.google_adwords.callbacks.init.onError');
				}
			},
			
			startExtension : {
				onSuccess : function (){
					if(_app.templates && _app.templates.checkoutTemplate){
						_app.templates.checkoutTemplate.on('complete.googleadwords',function($ele,P){
							var order = _app.data['order|'+P.orderID];
							google_conversion_value = order.sum.items_total;
							_app.u.loadScript(('https:' == document.location.protocol ? 'https://ssl' : 'http://www') + '.googleadservices.com/pagead/conversion.js');
						});
					} else	{
						setTimeout(function(){_app.ext.google_adwords.callbacks.startExtension.onSuccess()},250);
					}
				},
				onError : function (){
					_app.u.dump('BEGIN _app.ext.google_adwords.callbacks.startExtension.onError');
				}
			}
		}
	}
	return r;
}