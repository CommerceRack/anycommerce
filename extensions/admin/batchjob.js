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


var admin_batchJob = function() {
	var theseTemplates = new Array();
	var r = {

////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	calls : {
		
		adminBatchJobList : {
			init : function(status,tagObj,q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminBatchJobList|"+status;
				if(app.model.fetchData(tagObj.datapointer) == false)	{
					r = 1;
					this.dispatch(status,tagObj,q);
					}
				else	{
					app.u.handleCallback(tagObj);
					}
				},
			dispatch : function(status,tagObj,q)	{
				app.model.addDispatchToQ({"_cmd":"adminBatchJobList","status":status,"_tag":tagObj},q);	
				}
			}, //adminBatchJobList


		adminBatchJobStatus : {
			init : function(guid,tagObj,q)	{
				this.dispatch(guid,tagObj,q);
				},
			dispatch : function(guid,tagObj,q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminBatchJobStatus|"+guid;
				app.model.addDispatchToQ({"_cmd":"adminBatchJobStatus","_tag":tagObj,"guid":guid},q);	
				}
			}, //adminBatchJobStatus

//Generate a unique guid per batch job.
//if a request/job fails and needs to be resubmitted, use the same guid.
		adminBatchJobCreate : {
			init : function(guid,tagObj,q)	{
				this.dispatch(guid,tagObj,q);
				},
			dispatch : function(guid,tagObj,q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminBatchJobCreate|"+guid;
				app.model.addDispatchToQ({"_cmd":"adminBatchJobCreate","_tag":tagObj,"guid":guid},q);	
				}
			}, //adminBatchJobCreate


		adminBatchJobCleanup : {
			init : function(guid,tagObj,q)	{
				this.dispatch(status,tagObj,q);
				},
			dispatch : function(guid,tagObj,q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminBatchJobCleanup|"+guid;
				app.model.addDispatchToQ({"_cmd":"adminBatchJobStatus","_tag":tagObj},q);	
				}
			} //adminBatchJobStatus



		}, //calls




////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

//				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/batchjob.html',theseTemplates);

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
			
			showBatchJobManager : function(){},
			
			showBatchJobStatus : function(jobid,opts) {
				if(jobid)	{}
				else	{
					app.u.throwMessage("No jobid specified in admin_batchJob.a.showBatchJobStatus");
					}
				} //showTaskManager

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {}, //renderFormats


////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {} //u


		} //r object.
	return r;
	}