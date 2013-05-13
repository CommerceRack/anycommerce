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
	var theseTemplates = new Array('batchJobStatusTemplate','batchJobManagerPageTemplate','batchJobRowTemplate');
	var r = {


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
			},
		
		showBatchJobStatus : {
			onSuccess : function(tagObj){
				$(app.u.jqSelector('#',tagObj.parentID)).hideLoading();
//error handling for no jobid is handled inside this function.
				app.ext.admin_batchJob.a.showBatchJobStatus(app.data[tagObj.datapointer].jobid);
				},
			onError : function(responseData)	{
				$(app.u.jqSelector('#',tagObj.parentID)).hideLoading();
				app.u.throwMessage(responseData);
				}
			},
		
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
			
			showBatchJobManager : function($tabContent){
				$tabContent.empty();
//generate some of the task list content right away so the user knows something is happening.
				$tabContent.showLoading({'message':'Fetching list of batch jobs'});
				app.ext.admin.calls.adminBatchJobList.init('',{'callback':function(rd){
					$tabContent.hideLoading();
					if(app.model.responseHasErrors(rd)){
						$tabContent.anymessage({'message':rd});
						}
					else	{
						$tabContent.anycontent({'templateID':'batchJobManagerPageTemplate','dataAttribs':{'id':'batchJobManagerContent'},'datapointer':rd.datapointer});
						$(".gridTable",$tabContent).anytable();
						app.u.handleAppEvents($tabContent);
						}
					}},'mutable');
				app.model.dispatchThis('mutable');
				},

//called by brian in the legacy UI. creates a batch job and then opens the job status.
			adminBatchJobCreate : function(opts){
				$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).showLoading({'message':'Registering Batch Job'});
//parentID is specified for error handling purposes. That's where error messages should go and also what the hideLoading() selector should be.
				app.ext.admin.calls.adminBatchJobCreate.init(opts,{'callback':'showBatchJobStatus','extension':'admin_batchJob','parentID':app.ext.admin.vars.tab+"Content"},'immutable');
				app.model.dispatchThis('immutable');
				},

			showBatchJobStatus : function(jobid,opts) {
				if(jobid)	{
					//get job details.
					var $target = $('#batchJobStatusModal'); //modal id.
					if($target.length)	{$target.empty()}
					else	{
						$target = $("<div \/>").attr({'id':'batchJobStatusModal','title':'Batch Job Status'}).appendTo('body');
						$target.dialog({'modal':true,'width':500,'height':300,'autoOpen':false});
						}
					$target.append(app.renderFunctions.createTemplateInstance('batchJobStatusTemplate',{'jobid':jobid}));
					$target.dialog('open');
					app.ext.admin.calls.adminBatchJobStatus.init(jobid,{'callback':'translateSelector','selector':'#batchJobStatusModal'},'immutable');
					app.model.dispatchThis('immutable');
					$target.showLoading();
					}
				else	{
					app.u.throwMessage("No jobid specified in admin_batchJob.a.showBatchJobStatus");
					}
				}, //showTaskManager

			showReport : function($target,vars)	{
				app.u.dump("BEGIN admin_batchjob.a.showReport");
				$target.showLoading({'message':'Generating Report Table'});
				if($target && vars && vars.guid)	{
					$target.empty();
					app.u.dump(" -> $target and batchGUID are set.");
					app.ext.admin.calls.adminReportDownload.init(batchGUID,{'callback':function(rd)	{
						if(app.model.responseHasErrors(rd)){
							$target.hideLoading();
							$target.anymessage({'message':rd});
							}
						else	{
							var L = app.data[rd.datapointer]['@HEAD'].length,
							reportElementID = 'batchReport_'+batchGUID
							tableHeads = new Array();
//@HEAD is returned with each item as an object. google visualization wants a simple array. this handles the conversion.							
							for(var i = 0; i < L; i += 1)	{
								tableHeads.push(app.data[rd.datapointer]['@HEAD'][i].name);
								}

							$target.append($("<div \/>",{'id':reportElementID+"_toolbar"})); //add element to dom for visualization toolbar
							$target.append($("<div \/>",{'id':reportElementID}).addClass('smallTxt')); //add element to dom for visualization table
							
							app.ext.admin_reports.u.drawTable(reportElementID,tableHeads,app.data[rd.datapointer]['@BODY']);
							app.ext.admin_reports.u.drawToolbar(reportElementID+"_toolbar");
							$target.hideLoading(); //this is after drawTable, which may take a moment.
							}
						}},'mutable'); app.model.dispatchThis('mutable');
					app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_batchjob.a.showReport, either $target ['+typeof $target+'] or batchGUID ['+batchGUID+'] not set.','gMessage':true});
					}
				
				}

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
//job status is passed in.
//if status = error, finished or abort should show this button
//button is hidden by default and shown if needed.
			cleanUpButton : function($tag,data)	{
				if(data.value == 'ERROR' || data.value == 'finished' || data.value == 'abort')	{
					$tag.show();
					$tag.button(); //daisy-chaining the button on the show didn't work. button didn't get classes.
					$tag.on('click',function(){
						var jobid = $tag.closest('[data-jobid]').data('jobid');
						if(jobid)	{
							$('#batchJobStatusModal').empty().addClass('loadingBG');
							app.ext.admin.calls.adminBatchJobCleanup.init(jobid,{'callback':'showMessaging','message':'Batch job has been cleaned up','parentID':'batchJobStatus_'+jobid},'immutable');
							app.model.dispatchThis('immutable');
							}
						else	{
							app.u.dump("Unable to ascertain jobid for click action on button in admin_batch.renderFormats.cleanUpButton");
							}
						});
					}
				else	{} //do nothing (do NOT show button.
				}
			
			}, //renderFormats


////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {}, //u
		e : {


			execAdminBatchJobCreate : function($btn)	{
				$btn.button();
				$btn.off('click.execAdminBatchJobCreate').on('click.execAdminBatchJobCreate',function(){
					var $form = $btn.closest('form');
					
					if(app.u.validateForm($form))	{
						
						}
					else	{} //validateForm handles error display.
					});
				},

//NOTE -> the batch_exec will = REPORT for reports.
			showJobDetail : function($btn)	{
				if($btn.closest('tr').data('batch_exec') == 'REPORT')	{
					$btn.button().show();
					$btn.off('click.showJobDetail').on('click.showJobDetail',function(event){
						event.preventDefault();
						var $table = $btn.closest('table');
						
						$table.stickytab({'tabtext':'batch jobs'});
						$('button',$table).removeClass('ui-state-active');
						$btn.addClass('ui-state-active');
						
						app.ext.admin_batchJob.a.showReport($('#utilitiesContent'),$btn.closest('tr').data());
						});
					}
				else	{
//btn hidden by default. no action needed.
					}
				}
			
			} //u


		} //r object.
	return r;
	}