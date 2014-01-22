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


var admin_batchjob = function() {
	var theseTemplates = new Array('batchJobStatusTemplate','batchJobRowTemplate');
	var r = {

		vars : {
			dialogInterval : "" //stores the setInterval for the batchJob status dialog
			},
////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/batchjob.html',theseTemplates);

				var $target = $("<div \/>").attr({'id':'batchJobStatusModal'}).appendTo('body');
				$target.dialog({'modal':false,'autoOpen':false});

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
				app.ext.admin_batchjob.a.showBatchJobStatus(app.data[tagObj.datapointer].jobid);
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

				var $table = app.ext.admin.i.DMICreate($target,{
					'header' : 'Batch Jobs',
					'className' : 'batchjobManager',
					'buttons' : ["<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh<\/button>",],
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
				app.u.handleButtons($target.anydelegate());
				app.model.dispatchThis('mutable');
				},

//called by brian in the legacy UI. creates a batch job and then opens the job status.
			adminBatchJobCreate : function(opts,vars){
				vars = vars || {};
				$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).showLoading({'message':'Registering Batch Job'});
//parentID is specified for error handling purposes. That's where error messages should go and also what the hideLoading() selector should be.
				app.model.addDispatchToQ($.extend(true,{
					'_cmd':'adminBatchJobCreate',
					'_tag':	{'callback':'showBatchJobStatus',
					'extension':'admin_batchjob',
					'parentID':app.ext.admin.vars.tab+"Content",
					datapointer : opts.guid ? "adminBatchJobCreate|"+opts.guid : "adminBatchJobCreate"}
					},opts),'immutable');
				if(vars.jobCreate)	{
					if(vars.TITLE && vars.BATCH_EXEC && opts['%vars'])	{
						app.model.addDispatchToQ({
							'_cmd':'adminBatchJobParametersCreate',
							'UUID' : app.u.guidGenerator(),
							'TITLE' : vars.TITLE,
							'BATCH_EXEC' : vars.BATCH_EXEC,
							'PRIVATE' : vars.PRIVATE,
							'%vars' : opts['%vars'],
							'_tag':	{
								'datapointer' : 'adminBatchJobParametersCreate',
								'callback':'showMessaging',
								'message' : 'Job saved as '+vars.TITLE
								}
							},'immutable');
						}
					else	{
						$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).anymessage({
							'message':'In admin_batchjob.a.adminBatchJobCreate, vars.jobCreate was true, but either TITLE ['+vars.TITLE+'], BATCH_EXEC ['+vars.BATCH_EXEC+'] or %var ['+(typeof opts['%vars'])+'] was missing and all are required.'
							});
						}
					}
				app.model.dispatchThis('immutable');
				},

			showBatchJobStatus : function(jobid,opts) {
				if(jobid)	{
					//get job details.
					var $target = $('#batchJobStatusModal'); //modal created in init.
					$target.intervaledEmpty();
					$target.dialog('option','title','Batch Job Status: '+jobid);
					$target.dialog('open');
					if(app.ext.admin_batchjob.vars.dialogInterval)	{clearInterval(app.ext.admin_batchjob.vars.dialogInterval)}
					$target.showLoading({'message':'Fetching Batch Job Details'});
					app.model.addDispatchToQ({
						'_cmd':'adminBatchJobStatus',
						'jobid':jobid,
						'_tag':	{
							'callback':'anycontent',
							'datapointer':'adminBatchJobStatus|'+jobid,
							'jqObj':$target,
							'mode' : 'dialog',
							'templateID':'batchJobStatusTemplate',
							'onComplete' : function(rd)	{
								app.ext.admin_batchjob.u.initBatchTimer(rd);
								},
							'dataAttribs': {'jobid':jobid}}
						},'mutable');
					app.model.dispatchThis('mutable');
					}
				else	{
					app.u.throwMessage("No jobid specified in admin_batchjob.a.showBatchJobStatus");
					}
				}, //showTaskManager

			showReport : function($target,vars)	{
				vars = vars || {};
//				app.u.dump("BEGIN admin_batchjob.a.showReport");
				if($target instanceof jQuery && vars.guid)	{
					$target.intervaledEmpty();
					$target.showLoading({'message':'Generating Report'}); //run after the empty or the loading gfx gets removed.
//					app.u.dump(" -> $target and vars.guid are set.");
					app.ext.admin.calls.adminReportDownload.init(vars.guid,{'callback':'showReport','jqObj':$target,'extension':'admin_batchjob'},'mutable');
					app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_batchjob.a.showReport, either $target not a jQuery instance ['+($target instanceof jQuery)+'] or batchGUID ['+vars.guid+'] not set.','gMessage':true});
					}
				
				}

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			handleButtonDisplay : function($tag,data)	{
				if(data.bindData.exec)	{
					if(data.value.BATCH_EXEC && data.value.BATCH_EXEC.split('/')[0] == data.bindData.exec && data.value.STATUS && data.value.STATUS.indexOf('END') >= 0)	{
						$tag.show().removeClass('displayNone');
						}
					}
				},
			
			batchJobParametersList : function($tag,data)	{
				var exec = data.bindData.batch_exec;
				if(exec)	{
					app.model.addDispatchToQ({
						'_cmd':'adminBatchJobParametersList',
						'BATCH_EXEC' : exec,
						'_tag':	{
							'datapointer' : 'adminBatchJobParametersList|'+exec,
							'callback' : function(rd){
								if(app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									if(app.data[rd.datapointer]['@PARAMETERS'])	{
										var data = app.data[rd.datapointer]['@PARAMETERS'];
										if(data.length)	{
											var $o = $("<div \/>"); //$o is output. list is saved here, then added to $tag. means DOM is only updated once.
											for(var i = 0, L = data.length; i < L; i += 1)	{
												var job = data[i];
												$o.append("<p data-app-role='batchContainer'><a href='#' onClick=\"app.ext.admin_batchjob.a.adminBatchJobCreate({'parameters_uuid':'"+job.UUID+"','type':'"+job.BATCH_EXEC+"'}); return false;\">"+job.TITLE+"</a><br>(last run: "+job.LASTRUN_TS+")<br><a href='#' data-app-click='admin_batchjob|adminBatchJobParametersRemoveConfirm' data-uuid='"+job.UUID+"'>Remove<\/a><\/p>");
												}
											$tag.append($o.children());
											}
										}
									}
								}
							}
						},'mutable');
					app.model.dispatchThis();					
					}
				else	{
					$tag.anymessage({'message':'In admin_batchjob.renderFormats.batchJobParametersList, data-bind contained no "batch_exec" key/value pair, which is required.'});
					}
				}
			
			}, //renderFormats


////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
			//mode can be set to status (looks in dialog) or list (if list, vars.tab is required)
			initBatchTimer : function(vars)	{
//				app.u.dump("BEGIN admin_batchjob.u.initBatchTimer");
				vars = vars || {};
				var error,$timer,$parent;
				if(vars.mode == 'dialog')	{
					app.u.dump(" -> in dialog mode");
					$parent = $("#batchJobStatusModal");
					$timer = $("[data-app-role='batchJobTimer']",$parent);
					if($timer.length)	{
						var data = app.data[vars.datapointer];
						if(data.status == 'NEW' || data.status == 'QUEUED')	{
							$timer.show().text('30');
							app.ext.admin_batchjob.vars.dialogInterval = setInterval(function(){
								app.ext.admin_batchjob.u.handleBatchTimerUpdate($timer,vars);
								},1000)
							}
						else	{
							$timer.hide(); //job is done, no need for a timer.
							}
						}
					else	{
						error = "In admin_batchjob.u.batchTimer, $timer has no length."
						}
					
					}
//list mode isn't supported yet. There's a refresh button right now. may add it later.
//				else if(mode == list && vars.tab)	{
//					$parent = $(app.u.jqSelector('#',vars.tab+'Content'));
//					}
				else	{
					error = "In admin_batchjob.u.batchTimer, invalid mode ["+mode+"] passed."
					}
				
				if(error)	{
					$parent.anymessage({'message':error})
					}
				},
			handleBatchTimerUpdate : function($timer,vars)	{
//				app.u.dump(" -> timerUpdate jobID: "+$timer.closest("[data-jobid]").data('jobid'));
				if($timer.text() == 0 && $timer.is(':visible'))	{
					clearInterval(app.ext.admin_batchjob.vars.dialogInterval);
					app.ext.admin_batchjob.vars.dialogInterval = ''; //reset to blank. value is used to determine whether or not showBatchJobStatus needs to clear it.
					app.ext.admin_batchjob.a.showBatchJobStatus($timer.closest("[data-jobid]").data('jobid'));
					}
				else if(!$timer.is(':visible'))	{
					//dialog has been closed or tabs have been switched.
					app.ext.admin_batchjob.vars.dialogInterval = ''; //reset to blank. value is used to determine whether or not showBatchJobStatus needs to clear it.
					clearInterval(app.ext.admin_batchjob.vars.dialogInterval);
					}
				else	{
					
					$timer.text(Number($timer.text()) - 1);
					}
				}
			
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
				return false;
				},

			adminBatchJobExec : function($ele,p)	{
				var data = $ele.closest("[data-element]").data();
				if(data && $ele.data('whitelist') && $ele.data('type'))	{
					var whitelist = $ele.data('whitelist').split(',');
					var vars = app.u.getWhitelistedObject(data,whitelist) || {};
					vars.GUID = app.u.guidGenerator();
					app.ext.admin_batchjob.a.adminBatchJobCreate({'type':$ele.data('type'), '%vars':vars});
					app.model.dispatchThis('immutable');
					}
//allows for simple (no vars) batch jobs to be created.
				else if($ele.data('type')){
					app.ext.admin_batchjob.a.adminBatchJobCreate({'type':$ele.data('type'), '%vars':{'GUID':app.u.guidGenerator()}});
					app.model.dispatchThis('immutable');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"in admin_batchjobs.e.batchJobExec, either no data found ["+(typeof data)+"] or data-whitelist ["+$ele.data('whitelist')+"] not set and/or data-type ["+$ele.data('type')+"] not set","gMessage":true});}
				return false;
				},

			batchJobExec : function($btn)	{
				if($btn.is('button'))	{
					$btn.button({text: false,icons: {primary: $btn.attr('data-icon-primary') || "ui-icon-refresh"}})
					}
				$btn.off('click.batchJobExec').on('click.batchJobExec',function(event){
					event.preventDefault();
					app.ext.admin_batchjob.e.adminBatchJobExec($btn);
					});
				return false;
				},
	
//NOTE -> the batch_exec will = REPORT for reports.
			showReport : function($ele,p)	{
				var $table = $ele.closest('table');
				$table.stickytab({'tabtext':'batch jobs','tabID':'batchJobsStickyTab'});
				$('button',$table).removeClass('ui-state-focus'); //removes class added by jqueryui onclick.
				$('button',$table).removeClass('ui-state-highlight');
				$ele.addClass('ui-state-highlight');
				app.ext.admin_batchjob.a.showReport($(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")),$ele.closest('tr').data());
//make sure buttons and links in the stickytab content area close the sticktab on click. good usability.
				$table.off('close.stickytab').on('click.closeStickytab','button, a',function(){
					$(this).closest('table').stickytab('close');
					})
				return false;
				}, //showReport

			showDownload : function($ele,p)	{
				app.model.addDispatchToQ({
					'_cmd':'adminBatchJobDownload',
					'guid':$ele.closest('tr').data('guid'),
					'base64' : '1',
					'_tag':	{
						'datapointer' : 'adminBatchJobDownload', //big dataset returned. only keep on in memory.
						'callback' : 'fileDownloadInModal'
						}
					},'mutable');
				app.model.dispatchThis('mutable');
				return false;
				}, //showDownload
			
			adminBatchJobCleanupExec : function($ele,p)	{
				var jobid = $ele.closest('[data-jobid]').data('jobid');
				if(jobid)	{
					var _tag = {};
					if($ele.data('mode') == 'list')	{
						$ele.button('option','icons',{primary:"wait"}).find('ui-icon').removeClass('ui-icon').end().button('disable');
						_tag.callback = function(rd)	{
							if(app.model.responseHasErrors(rd)){
								$('#globalMessaging').anymessage({'message':rd});
								}
							else	{
								$ele.closest('tr').hide();
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
					$('.appMessaging').anymessage({'message':'In admin_batchjob.e.adminBatchJobCleanupExec, unable to ascertain jobID from DOM tree.','gMessage':true});
					}
				return false;
				},
			
			adminBatchJobStatus : function($ele,p)	{
				app.ext.admin_batchjob.a.showBatchJobStatus($ele.closest("tr").data('id'));
				return false;
				},
			
			showBatchDetail : function($btn)	{
				$btn.button({text: false,icons: {primary: "ui-icon-info"}});
				$btn.off('click.showBatchDetail').on('click.showBatchDetail',function(event){
					event.preventDefault();
					app.ext.admin_batchjob.e.adminBatchJobStatus($btn);
					});
				}
			
			} //e


		} //r object.
	return r;
	}