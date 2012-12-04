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
	var theseTemplates = new Array('batchJobStatusTemplate');
	var r = {

////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	calls : {
		
		adminBatchJobList : {
			init : function(status,tagObj,q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminBatchJobList|"+status;
//comment out local storage for testing.
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
			init : function(jobid,tagObj,q)	{
				this.dispatch(jobid,tagObj,q);
				},
			dispatch : function(jobid,tagObj,q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminBatchJobStatus|"+jobid;
				app.model.addDispatchToQ({"_cmd":"adminBatchJobStatus","_tag":tagObj,"jobid":jobid},q);
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
		
		adminBatchJobRemove : {
			init : function(jobid,tagObj,q)	{
				this.dispatch(jobid,tagObj,q);
				},
			dispatch : function(jobid,tagObj,q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminBatchJobRemove|"+jobid;
				app.model.addDispatchToQ({"_cmd":"adminBatchJobRemove","_tag":tagObj,"jobid":jobid},q);	
				}
			}, //adminBatchJobCreate


		adminBatchJobCleanup : {
			init : function(jobid,tagObj,q)	{
				this.dispatch(jobid,tagObj,q);
				},
			dispatch : function(jobid,tagObj,q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminBatchJobCleanup|"+jobid;
				app.model.addDispatchToQ({"_cmd":"adminBatchJobStatus","jobid":jobid,"_tag":tagObj},q);	
				}
			} //adminBatchJobStatus

//341681

		}, //calls




////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/batchjob.html',theseTemplates);

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
				if(jobid)	{
					//get job details.
					var $target = $('#batchJobStatusModal'); //modal id.
					var targetID = 'batchJobStatus_'+jobid; //content id. applied to template when it is added. needed for translate on callback.
					if($target.length)	{}
					else	{
						$target = $("<div \/>").attr({'id':'batchJobStatusModal','title':'Batch Job Status'}).appendTo('body');
						$target.dialog({'modal':true,'width':500,'height':500,'autoOpen':false});
						}
					$target.append(app.renderFunctions.createTemplateInstance('batchJobStatusTemplate',{'id':targetID,'jobid':jobid}));
					$target.dialog('open');
					app.ext.admin_batchJob.calls.adminBatchJobStatus.init(jobid,{'callback':'translateTemplate','targetID':targetID},'immutable');
					app.model.dispatchThis('immutable');
					$target.showLoading();
					}
				else	{
					app.u.throwMessage("No jobid specified in admin_batchJob.a.showBatchJobStatus");
					}
				} //showTaskManager

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
//job status is passed in.
//if status = error, finished or abort should show this button
//button is hidden by default and shown if needed.
			cleanUpButton : function($tag,data)	{
				if(data.value == 'error' || data.value == 'finished' || data.value == 'abort')	{
					$tag.show();
					$tag.on('click',function(){
						var jobid = $tag.closest('[data-jobid]').data('jobid');
						app.ext.admin_batchJob.calls.adminBatchJobCleanup.init(jobid,{'callback':'showMessaging','message':'Batch job has been cleaned up'},'immutable');
						app.model.dispatchThis('immutable');
						});
					
					}
				else	{} //do nothing (do NOT show button.
				}
			}, //renderFormats


////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {} //u


		} //r object.
	return r;
	}