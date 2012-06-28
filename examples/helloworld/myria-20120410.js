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




var myRIA = function() {
	var r = {
		vars : { "templates" : ["profileTemplate"]},
		callbacks : {
//run when controller loads this extension.  Should contain any validation that needs to be done. return false if validation fails.
			init : {
				onSuccess : function()	{
					var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
					return r;
					},
				onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
					myControl.util.dump('BEGIN myControl.ext.myRIA.callbacks.init.onError');
					}
				},
//this is the callback defined to run after extension loads.
			startMyProgram : {
				onSuccess : function()	{
//create an instance of the template on the DOM. Will get translated after data loaded.
// note - you don't have to do it this way, but adding it before the request allows for a 'loading' graphic to easily be added
// and for space to be reserved if several pieces of data are being requested (a prodlist for example).

					myControl.util.dump("Create template Instance for profileTemplate"); // will write to console, if console is enabled.
					$('#myContent').append(myControl.renderFunctions.createTemplateInstance('profileTemplate',"newID"));

//request profile data (company name, logo, policies, etc)
					myControl.calls.appProfileInfo.init('DEFAULT',{'callback':'translateTemplate','parentID':'newID'});
					myControl.model.dispatchThis();

	
					},
				onError : function(responseData,uuid)	{
//error handling is a case where the response is delivered (unlike success where datapointers are used for recycling purposes)
					myControl.util.handleErrors(responseData,uuid); //a default error handling function that will try to put error message in correct spot or into a globalMessaging element, if set. Failing that, goes to modal.
					}
				}
			} //callbacks


		} //r object.
	return r;
	}