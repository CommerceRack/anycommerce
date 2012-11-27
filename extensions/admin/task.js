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
An extension for managing the media library in addition to ALL other file uploads,including, but not limited to: csv and zip.
*/



var admin_task = function() {
	var theseTemplates = new Array('taskListPageTemplate','taskListRowTemplate');
	var r = {

////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	calls : {
		
		adminTaskList : {
			init : function(tagObj,q)	{
				this.dispatch(tagObj,q);
				},
			dispatch : function(tagObj,q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminTaskList";
				app.model.addDispatchToQ({"_cmd":"adminTaskList","_tag":tagObj},q);	
				}
			}, //adminTaskList
		
		adminTaskCreate : {
			init : function(tagObj,q)	{
				this.dispatch(tagObj,q);
				},
			dispatch : function(tagObj,q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminTaskCreate";
				app.model.addDispatchToQ({"_cmd":"adminTaskCreate","_tag":tagObj},q);	
				}
			}, //adminTaskCreate
		
		adminTaskRemove : {
			init : function(tagObj,q)	{
				this.dispatch(tagObj,q);
				},
			dispatch : function(tagObj,q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminTaskRemove";
				app.model.addDispatchToQ({"_cmd":"adminTaskRemove","_tag":tagObj},q);	
				}
			}, //adminTaskRemove
		
		adminTaskUpdate : {
			init : function(tagObj,q)	{
				this.dispatch(tagObj,q);
				},
			dispatch : function(tagObj,q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminTaskUpdate";
				app.model.addDispatchToQ({"_cmd":"adminTaskUpdate","_tag":tagObj},q);	
				}
			}, //adminTaskUpdate
		adminTaskDetail : {
			init : function(tagObj,q)	{
				this.dispatch(tagObj,q);
				},
			dispatch : function(tagObj,q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminTaskDetail";
				app.model.addDispatchToQ({"_cmd":"adminTaskDetail","_tag":tagObj},q);	
				}
			} //adminTaskDetail
		
		}, //calls




////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/task.html',theseTemplates);

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
			
			showTaskList : function() {
//generate some of the task list content right away so the user knows something is happening.
				$(app.u.jqSelector('#',app.ext.admin.vars.focusTabID)).empty().append(app.renderFunctions.createTemplateInstance('taskListPageTemplate',{}));
				app.ext.admin_task.calls.adminTaskList.init({'callback':'translateTemplate','parentID':app.ext.admin.vars.focusTabID},'immutable');
				app.model.dispatchThis('immutable');
				}
			
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {} //u


		} //r object.
	return r;
	}