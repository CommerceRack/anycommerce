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
	var theseTemplates = new Array();
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

//				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/user.html',theseTemplates);
//				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/user.css','user_styles']);

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
			showCustomerManager : function() {
				app.u.dump("BEGIN admin_user.a.showCustomerManager");
				var $tabContent = $(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content"));
//generate some of the task list content right away so the user knows something is happening.
				$tabContent.empty();
				$tabContent.append(app.renderFunctions.createTemplateInstance('userManagerPageTemplate',{'id':'userManagerContent'})); //placeholder
				$('#userManagerContent').showLoading({'message':'Fetching your user list.'});
				app.ext.admin.calls.bossRoleList.init({},'mutable'); //have this handy.
				app.ext.admin.calls.bossUserList.init({'callback':'translateSelector','extension':'admin','selector':'#userManagerContent'},'mutable');
				app.model.dispatchThis('mutable');
				} //showTaskManager
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {}, //u [utilities]

		e : {} //e [app Events]
		} //r object.
	return r;
	}