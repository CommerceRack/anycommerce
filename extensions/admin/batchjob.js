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
				if(tagObj.parentID)	{
					$(app.u.jqSelector('#',tagObj.parentID)).hideLoading();
					}
				else if(tagObj.jqObj && typeof tabgbj.jqObj === 'object')	{
					tabgbj.jqObj.hideLoading();
					}
				else	{} //nothing to hideloading on.
//error handling for no jobid is handled inside this function.
				app.ext.admin_batchJob.a.showBatchJobStatus(app.data[tagObj.datapointer].jobid);
				},
			onError : function(responseData)	{
				var $target = $(app.u.jqSelector('#',responseData._rtag.parentID));
				$target.hideLoading();
				$target.anymessage({'message':responseData,'persistent':true});
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
						$(".gridTable",$tabContent).anytable({'inverse':true}); //inverse will sort high to low.
						$(".gridTable",$tabContent).find('th').first().trigger('click'); //sort by batch job.
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
						$target = $("<div \/>").attr({'id':'batchJobStatusModal','title':'Batch Job Status: '+jobid}).appendTo('body');
						$target.dialog({'modal':true,'width':500,'height':300,'autoOpen':false});
						}
					$target.dialog('open');
					$target.showLoading({'message':'Fetching Batch Job Details'});
					app.ext.admin.calls.adminBatchJobStatus.init(jobid,{'callback':'anycontent','jqObj':$target,'templateID':'batchJobStatusTemplate','dataAttribs': {'jobid':jobid}},'immutable');
					app.model.dispatchThis('immutable');
					}
				else	{
					app.u.throwMessage("No jobid specified in admin_batchJob.a.showBatchJobStatus");
					}
				}, //showTaskManager

			showReport : function($target,vars)	{
//				app.u.dump("BEGIN admin_batchjob.a.showReport");
				if($target && vars && vars.guid)	{
					$target.empty();
					$target.showLoading({'message':'Generating Report'}); //run after the empty or the loading gfx gets removed.
//					app.u.dump(" -> $target and vars.guid are set.");
					app.ext.admin.calls.adminReportDownload.init(vars.guid,{'callback':function(rd)	{
						if(app.model.responseHasErrors(rd)){
							$target.hideLoading();
							$target.anymessage({'message':rd});
							}
						else	{
							var L = app.data[rd.datapointer]['@HEAD'].length,
							reportElementID = 'batchReport_'+vars.guid
							tableHeads = new Array();
							
							if(app.data[rd.datapointer]['@BODY'] && app.data[rd.datapointer]['@BODY'].length)	{
//google visualization will error badly if the # of columns in the each body row doesn't match the # of columns in the head.
app.u.dump(" -> app.data[rd.datapointer]['@BODY'][0].length: "+app.data[rd.datapointer]['@BODY'][0].length);
app.u.dump(" -> app.data[rd.datapointer]['@HEAD'][0].length: "+app.data[rd.datapointer]['@HEAD'][0].length);
								if(app.data[rd.datapointer]['@BODY'][0].length == app.data[rd.datapointer]['@HEAD'].length)	{
//@HEAD is returned with each item as an object. google visualization wants a simple array. this handles the conversion.							
									for(var i = 0; i < L; i += 1)	{
										tableHeads.push(app.data[rd.datapointer]['@HEAD'][i].name);
										}

									var $expBtn = $("<button \/>").text('Export Page to CSV').button().on('click',function(){
										$('.google-visualization-table-table').toCSV();
										}).appendTo($target);


									$target.append("<h1>"+app.data[rd.datapointer].title || ""+"<\/h1>");
									$target.append("<h2>"+app.data[rd.datapointer].subtitle || ""+"<\/h2>");
									$target.append($("<div \/>",{'id':reportElementID+"_toolbar"})); //add element to dom for visualization toolbar
									$target.append($("<div \/>",{'id':reportElementID}).addClass('smallTxt')); //add element to dom for visualization table
									

									app.ext.admin_reports.u.drawTable(reportElementID,tableHeads,app.data[rd.datapointer]['@BODY']);
									app.ext.admin_reports.u.drawToolbar(reportElementID+"_toolbar");
									
									}
								else	{
									var errorDetails = "";
									for(index in vars)	{
										errorDetails += "<br>"+index+": "+vars[index];
										}
									$target.anymessage({'message':'The number of columns in the data do not match the number of columns in the head. This is likely due to an old report being opened in the new report interface. <b>Please re-run the report and open the new copy.</b>  If the error persist, please report to support with the following error details:'+errorDetails,'persistent':true});
									}
								
								
								}
							else	{
								$target.anymessage({'message':'There are no rows/data in this report.','persistent':true});
								}
							
							$target.hideLoading(); //this is after drawTable, which may take a moment.
							}
						}},'mutable'); app.model.dispatchThis('mutable');
					app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_batchjob.a.showReport, either $target ['+typeof $target+'] or batchGUID ['+vars.guid+'] not set.','gMessage':true});
					}
				
				}

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			}, //renderFormats


////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
			
			
			
			}, //u
		e : {




//NOTE -> the batch_exec will = REPORT for reports.
			showReport : function($btn)	{
				if($btn.closest('tr').data('batch_exec') == 'REPORT' && $btn.closest('tr').data('status').indexOf('END') >= 0)	{
					$btn.button({text: false,icons: {primary: "ui-icon-image"}}).show();
					$btn.off('click.showReport').on('click.showReport',function(event){
						event.preventDefault();
						var $table = $btn.closest('table');
						
						$table.stickytab({'tabtext':'batch jobs','tabID':'batchJobsStickyTab'});
						$('button',$table).removeClass('ui-state-focus'); //removes class added by jqueryui onclick.
						$('button',$table).removeClass('ui-state-highlight');
						$btn.addClass('ui-state-highlight');
						app.ext.admin_batchJob.a.showReport($(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")),$btn.closest('tr').data());
//make sure buttons and links in the stickytab content area close the sticktab on click. good usability.
						$('button, a',$table).each(function(){
							$(this).off('close.stickytab').on('click.closeStickytab',function(){
								$table.stickytab('close');
								})
							})
						});
					}
				else	{
//btn hidden by default. no action needed.
					}
				},
			
			execBatchCleanup : function($btn)	{
				var $row = $btn.closest('tr');
				if($row.data('status') == 'ERROR' || $row.data('status') == 'finished' || $row.data('status') == 'abort')	{
					$btn.show({text: false,icons: {primary: "ui-icon-trash"}});
					$btn.button(); //daisy-chaining the button on the show didn't work. button didn't get classes.
					$btn.off('click.execBatchCleanup').on('click.execBatchCleanup',function(){
						var jobid = $btn.closest('[data-jobid]').data('jobid');
						if(jobid)	{
							$('#batchJobStatusModal').empty().addClass('loadingBG');
							app.ext.admin.calls.adminBatchJobCleanup.init(jobid,{'callback':'showMessaging','message':'Batch job has been cleaned up','parentID':'batchJobStatus_'+jobid},'immutable');
							app.model.dispatchThis('immutable');
							}
						else	{
							$('.appMessaging').anymessage({'message':'In admin_batchJob.e.execBatchCleanup, unable to ascertain jobID from DOM tree.','gMessage':true});
							}
						});
					}
				else	{
					$btn.hide();
					}
				},
			
			showBatchDetail : function($btn)	{
				$btn.button({text: false,icons: {primary: "ui-icon-info"}});
				$btn.off('click.showBatchDetail').on('click.showBatchDetail',function(event){
					event.preventDefault();
					app.ext.admin_batchJob.a.showBatchJobStatus($btn.closest("tr").data('id'));
					});
				}
			
			} //e


		} //r object.
	return r;
	}