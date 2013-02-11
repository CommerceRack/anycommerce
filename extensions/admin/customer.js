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





var admin_customer = function() {
	var theseTemplates = new Array('customerSearchResultsTemplate','CustomerPageTemplate','customerEditorGeneralTemplate');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/customer.html',theseTemplates);
//				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/customer.css','user_styles']);

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
//This is how the task manager is opened. Just execute this function.
// later, we may add the ability to load directly into 'edit' mode and open a specific user. not supported just yet.
			showCustomerManager : function($target) {

				if($("[data-app-role='dualModeContainer']",$target).length)	{$target.show()} //already an instance of help open in this target. leave as is.
				else	{
					$target.anycontent({'templateID':'CustomerPageTemplate','showLoading':false}); //clear contents and add help interface
					app.ext.admin.u.handleAppEvents($target);
					}
				
//if the target is a tab, bring that tab/content into focus.
				if($target.data('section'))	{
					app.ext.admin.u.bringTabIntoFocus($target.data('section'));
					app.ext.admin.u.bringTabContentIntoFocus($target);
					}

				} //showCustomerManager
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {}, //u [utilities]

		e : {
			'customerManager' : function(){
				
				}
			} //e [app Events]
		} //r object.
	return r;
	}