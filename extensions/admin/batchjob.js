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
	var theseTemplates = new Array('batchJobStatusTemplate','batchJobRowTemplate');
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
		
		showReport : {
			onSuccess : function(_rtag){
				if(_rtag.jqObj && _rtag.jqObj instanceof jQuery)	{



var 
	L = app.data[_rtag.datapointer]['@HEAD'].length,
	reportElementID = 'batchReport_'+app.data[_rtag.datapointer].guid
	tableHeads = new Array();

if(app.data[_rtag.datapointer]['@BODY'] && app.data[_rtag.datapointer]['@BODY'].length)	{
//google visualization will error badly if the # of columns in the each body row doesn't match the # of columns in the head.
//								app.u.dump(" -> app.data[_rtag.datapointer]['@BODY'][0].length: "+app.data[_rtag.datapointer]['@BODY'][0].length);
//								app.u.dump(" -> app.data[_rtag.datapointer]['@HEAD'][0].length: "+app.data[_rtag.datapointer]['@HEAD'][0].length);
	if(app.data[_rtag.datapointer]['@BODY'][0].length == app.data[_rtag.datapointer]['@HEAD'].length)	{
//@HEAD is returned with each item as an object. google visualization wants a simple array. this handles the conversion.							
		for(var i = 0; i < L; i += 1)	{
			tableHeads.push(app.data[_rtag.datapointer]['@HEAD'][i].name);
			}

		var $expBtn = $("<button \/>").text('Export to CSV').button().addClass('floatRight').on('click',function(){
//										$('.google-visualization-table-table').toCSV();  //exports just the page in focus.
			var L = app.data[_rtag.datapointer]['@BODY'].length;
			//first row of CSV is the headers.
			var csv = $.map(app.data[_rtag.datapointer]['@HEAD'],function(val){
					return '"'+val.name+'"';
					})

			for(var i = 0; i < L; i += 1)	{
				csv += "\n"+$.map(app.data[_rtag.datapointer]['@BODY'][i],function(val){
//												return '"'+((val == null) ? '' : escape(val))+'"';
					return '"'+((val == null) ? '' : val.replace(/"/g,'""'))+'"'; //don't return 'null' into report.
					})
				}
			
			app.u.fileDownloadInModal({
				'skipDecode':true,
				'filename':app.data[_rtag.datapointer].title+'.csv',
				'mime_type':'text/csv',
				'body':csv});
			}).appendTo(_rtag.jqObj);


		_rtag.jqObj.append("<h1>"+(app.data[_rtag.datapointer].title || "")+"<\/h1>");
		_rtag.jqObj.append("<h2>"+(app.data[_rtag.datapointer].subtitle || "")+"<\/h2>");
		_rtag.jqObj.append($("<div \/>",{'id':reportElementID+"_toolbar"})); //add element to dom for visualization toolbar
		_rtag.jqObj.append($("<div \/>",{'id':reportElementID}).addClass('smallTxt')); //add element to dom for visualization table
		

		app.ext.admin_reports.u.drawTable(reportElementID,tableHeads,app.data[_rtag.datapointer]['@BODY']);
		app.ext.admin_reports.u.drawToolbar(reportElementID+"_toolbar");
		
		}
	else	{
		var errorDetails = "";
		_rtag.jqObj.anymessage({'message':'The number of columns in the data do not match the number of columns in the head. This is likely due to an old report being opened in the new report interface. <b>Please re-run the report and open the new copy.</b>  If the error persist, please report to support with batch ID.','persistent':true});
		}
	
	
	}
else	{
	_rtag.jqObj.anymessage({'message':'There are no rows/data in this report.','persistent':true});
	}

_rtag.jqObj.hideLoading(); //this is after drawTable, which may take a moment.




					}
				else	{
					// throw warning here.
					}
				}
			},
		
		showBatchJobStatus : {
			onSuccess : function(tagObj){
				if(tagObj.parentID)	{
					$(app.u.jqSelector('#',tagObj.parentID)).hideLoading();
					}
				else if(tagObj.jqObj && typeof tagObj.jqObj === 'object')	{
					tagObj.jqObj.hideLoading();
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
			
			showBatchJobManager : function($target){
				$target.empty();
				var $table = app.ext.admin.i.DMICreate($target,{
					'header' : 'Batch Jobs',
					'className' : 'batchjobManager',
					'buttons' : ["<button data-app-event='admin|refreshDMI'>Refresh List<\/button>"],
					'thead' : ['ID','Job Name','Job Type','User','Create','Status',''],
					'tbodyDatabind' : "var: users(@JOBS); format:processList; loadsTemplate:batchJobRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminBatchJobList',
						'_tag' : {
							'anytable' : {
								'inverse' : true,
								'defaultSortColumn' : 1
								},
							'datapointer' : 'adminBatchJobList'},
							}
						});
				app.model.dispatchThis('mutable');
				},

//called by brian in the legacy UI. creates a batch job and then opens the job status.
			adminBatchJobCreate : function(opts){
				$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).showLoading({'message':'Registering Batch Job'});
//parentID is specified for error handling purposes. That's where error messages should go and also what the hideLoading() selector should be.
				app.model.addDispatchToQ($.extend(true,{
					'_cmd':'adminBatchJobCreate',
					'_tag':	{'callback':'showBatchJobStatus',
					'extension':'admin_batchJob',
					'parentID':app.ext.admin.vars.tab+"Content",
					datapointer : opts.guid ? "adminBatchJobCreate|"+opts.guid : "adminBatchJobCreate"}
					},opts),'immutable');
				app.model.dispatchThis('immutable');
				},

			showBatchJobStatus : function(jobid,opts) {
				if(jobid)	{
					//get job details.
					var $target = $('#batchJobStatusModal'); //modal id.
					if($target.length)	{$target.empty()}
					else	{
						$target = $("<div \/>").attr({'id':'batchJobStatusModal'}).appendTo('body');
						$target.dialog({'modal':true,'width':500,'height':300,'autoOpen':false});
						}
					$target.dialog('option','title','Batch Job Status: '+jobid);
					$target.dialog('open');
					$target.showLoading({'message':'Fetching Batch Job Details'});
app.model.addDispatchToQ({
	'_cmd':'adminBatchJobStatus',
	'jobid':jobid,
	'_tag':	{'callback':'anycontent','datapointer':'adminBatchJobStatus|'+jobid,'jqObj':$target,'templateID':'batchJobStatusTemplate','dataAttribs': {'jobid':jobid}}
	},'mutable');
app.model.dispatchThis('mutable');
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
					app.ext.admin.calls.adminReportDownload.init(vars.guid,{'callback':'showReport','jqObj':$target,'extension':'admin_batchJob'},'mutable'); app.model.dispatchThis('mutable');
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


			adminBatchJobParametersRemoveConfirm : function($ele,p)	{
				if($ele.data('uuid'))	{

					app.ext.admin.i.dialogConfirmRemove({
						"message" : "Are you sure you want to delete this saved batch process? There is no undo for this action.",
						"removeButtonText" : "Remove", //will default if blank
						"title" : "Remove Saved Batch Process", //will default if blank
						"removeFunction" : function(vars,$D){
							$D.showLoading({"message":"Deleting saved batch process"});
							app.model.addDispatchToQ({
								'_cmd':'adminBatchJobParametersRemove',
								'UUID' : $ele.data('uuid'),
								'_tag':	{
									'callback':function(rd){
										$D.hideLoading();
										if(app.model.responseHasErrors(rd)){
											$D.anymessage({'message':rd});
											}
										else	{
											//success content goes here.
											$ele.closest("[data-app-role='batchContainer']").empty().remove();
											$D.dialog('close');
											}
										}
									}
								},'mutable');
							app.model.dispatchThis('mutable');
							//now go delete something.
							}
						})
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_reports.e.adminBatchJobParametersRemove, data-uuid not set on trigger element.","gMessage":true});
					}
				},


			batchJobExec : function($btn)	{
				if($btn.is('button'))	{
					$btn.button({text: false,icons: {primary: $btn.attr('data-icon-primary') || "ui-icon-refresh"}})
					}
				$btn.off('click.batchJobExec').on('click.batchJobExec',function(event){
					event.preventDefault();
					var data = $btn.closest("[data-element]").data();
					if(data && $btn.data('whitelist') && $btn.data('type'))	{
						var whitelist = $btn.data('whitelist').split(',');
						var vars = app.u.getWhitelistedObject(data,whitelist) || {};
						vars.GUID = app.u.guidGenerator();
						app.ext.admin_batchJob.a.adminBatchJobCreate({'type':$btn.data('type'), '%vars':vars});
						}
//allows for simple (no vars) batch jobs to be created.
					else if($btn.data('type')){
						app.ext.admin_batchJob.a.adminBatchJobCreate({'type':$btn.data('type'), '%vars':{'GUID':app.u.guidGenerator()}});
						}
					else	{
						$('#globalMessaging').anymessage({"message":"in admin_batchJobs.e.batchJobExec, either no data found ["+(typeof data)+"] or data-whitelist ["+$btn.data('whitelist')+"] not set and/or data-type ["+$btn.data('type')+"] not set","gMessage":true});}
					});
				},
	
//NOTE -> the batch_exec will = REPORT for reports.
			showReport : function($btn)	{

				if($btn.closest('tr').data('batch_exec').split('/')[0] == 'REPORT' && $btn.closest('tr').data('status').indexOf('END') >= 0)	{
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
				}, //showReport


			showDownload : function($btn)	{
				if($btn.closest('tr').data('batch_exec').split('/')[0] == 'EXPORT' && $btn.closest('tr').data('status').indexOf('END-SUCCESS') >= 0)	{
					$btn.button({text: false,icons: {primary: "ui-icon-arrowthickstop-1-s"}}).show();
					$btn.off('click.showDownload').on('click.showDownload',function(event){
						event.preventDefault();
app.model.addDispatchToQ({
	'_cmd':'adminBatchJobDownload',
	'guid':$btn.closest('tr').data('guid'),
	'base64' : '1',
	'_tag':	{
		'datapointer' : 'adminBatchJobDownload', //big dataset returned. only keep on in memory.
		'callback' : 'fileDownloadInModal'
		}
	},'mutable');
app.model.dispatchThis('mutable');
						
						});
					}
				else	{
//btn hidden by default. no action needed.
					}
				}, //showDownload
			
			adminBatchJobCleanupExec : function($btn)	{
				
				$btn.button({text: false,icons: {primary: "ui-icon-trash"}}); //daisy-chaining the button on the show didn't work. button didn't get classes.
				$btn.off('click.adminBatchJobCleanupExec').on('click.adminBatchJobCleanupExec',function(){
					var jobid = $btn.closest('[data-jobid]').data('jobid');
					if(jobid)	{
						var _tag = {};
						if($btn.data('mode') == 'list')	{
							$btn.button('option','icons',{primary:"wait"}).find('ui-icon').removeClass('ui-icon').end().button('disable');
							_tag.callback = function(rd)	{
								if(app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									$btn.closest('tr').hide();
									}
								}
							}
						else	{
							_tag.callback = 'showMessaging';
							_tag.message = 'Batch job '+jobid+' has been cleaned up';
							_tag.jqObj = $('#batchJobStatusModal').empty().showLoading({"message":"Deleting batch job "+jobid})
							}
						app.model.addDispatchToQ({
							'_cmd':'adminBatchJobCleanup',
							'jobid' : jobid,
							'_tag':	_tag
							},'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{
						$('.appMessaging').anymessage({'message':'In admin_batchJob.e.adminBatchJobCleanupExec, unable to ascertain jobID from DOM tree.','gMessage':true});
						}
					});
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