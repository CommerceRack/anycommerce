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

in index.html, set the following vars for this to work properly:

seller_id =  #####;

*/


var resellerratings_survey = function(_app) {
	var r = {
		
		vars : {
			},

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		callbacks : {
			init : {
				onSuccess : function()	{
					_app.rq.push(['css',0,'https://www.resellerratings.com/images/js/dhtml_survey.css','resellerratings_styles']);
					return true;
					},
				onError : function()	{
	//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
	//you may or may not need it.
					_app.u.dump('BEGIN _app.ext.store_navcats.callbacks.init.onError');
					}
				},

			startExtension : {
				onSuccess : function(){
							
_app.ext.order_create.checkoutCompletes.push(function(P){
	//declared as window. to indicate they should be global.
	window.__rr_inv = P.orderID;
	window.__rr_email_pass = P.bill.email;
	_app.u.loadScript('https://www.resellerratings.com/images/js/popup_include.js');
	}); // end .push

					},
				onError : function(){}
				}
			} //callbacks
		} //r object.
	return r;
	}