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
Task Manager overview and definition of 'terms'.

TaskManager refers to the app, specifically the 'list' of tasks and the 'edit' panels.
There are two modes:
 1: 'list', which is the default. This mode puts the app emphasis on the list of tasks.
 2: 'edit', which is when the edit column is expanded. the list portion is still viewable, but in a minimal display.
 -> individual task editors are referred to as a taskEditPanel.

Create is supported, but opens a modal so there's no specific mode or mode change when it occurs.

The 'modify' for tag or delete also opens in a modal, so no specific mode change is needed.

Questions:
 -> there was a start to a detail call, then nothing. not needed cuz everything is in list?

Planned Features/UI enhancements:
 on taskEditPanel close, check # children and if zero, change mode to list.
*/



var admin_task = function() {
	var theseTemplates = new Array('taskListRowTemplate','taskListCreateEditTemplate','taskListEditPanelTemplate','taskListCreateTemplate');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/task.html',theseTemplates);

//used for the add new modal.
$('body').append("<div id='createTaskModal' class='displayNone' title='Create a new task'></div>");
$('#createTaskModal').dialog({'autoOpen':false,'modal':true,'width':500});

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			},

		adminTaskCreate : {
			onSuccess : function(tagObj){
//hideLoading is handled by the updateTaskList call 
				$('#createTaskModal').dialog('close');
				app.u.throwMessage(app.u.successMsgObject("Your task has been created."));
				},
			onError : function(tagObj){
//hideLoading is handled by the updateTaskList call 
				tagObj.targetID = 'createTaskModal'; //sets where to put the error messages.
				app.u.throwMessage(app.data[tagObj.datapointer]);
				}
			}, //adminTaskCreate

//this callback gets used by the DMI. the tasks response gets a little massaging before it's displayed.
// jqObj should always be  data-app-role="dualModeContainer", not the tbody.
// this code will empty the table, so no need to do it before (means previous results will still show if an error occurs).
		updateTaskList : {
			onSuccess : function(tagObj){
				app.u.dump("BEGIN admin_task.callbacks.updateTaskList.onSuccess");
				//limit the number of results.  This is to keep the browser from crashing on HUGE tasks lists.
				var inc = 0;
				var tasks = app.data[tagObj.datapointer]['@TASKS'];
				var filteredTasks = new Array();
				var L = tasks.length;
				
				for(var i = (L-1); i >= 0; i--)	{
					if(Number(tasks[i].completed_gmt) > 0 && (app.u.unixNow() - Number(tasks[i].completed_gmt)) > (60*60*24*3)){
						app.u.dump("completed more than three days ago");
						} //don't include tasks completed more than a few days ago
					else	{
						//tasks completed in the last 3 days do not count against the 100 task max. so the user gets 100 active tasks.
						if(Number(tasks[i].completed_gmt) > 0)	{}
						else	{
							inc++;
							}
						filteredTasks.push(tasks[i])
						}
					if(inc >= 100)	{break;} //exit after 100. limits displayed tasks to 100.
					}
				tagObj.jqObj.hideLoading();
				$("[data-app-role='dualModeListTbody']",tagObj.jqObj).empty().anycontent({'translateOnly':true,'data':{'@TASKS':filteredTasks}});
				app.u.handleButtons(tagObj.jqObj);
				tagObj.jqObj.find("[data-app-click='admin|checkAllCheckboxesExec']").data('selected',false);
				},
			onError : function(responseData, uuid)	{
				app.u.throwMessage(responseData);
				$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).hideLoading();
				}
			} //updateTaskList

		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
//This is how the task manager is opened. Just execute this function.
// later, we may add the ability to load directly into 'edit' mode and open a specific task. not supported just yet.
			showTaskManager : function($target) {
//				app.u.dump("BEGIN admin_task.a.showTaskManager");

				$target.intervaledEmpty();
				var $DMI = app.ext.admin.i.DMICreate($target,{
					'header' : 'Task Manager',
					'className' : 'taskManager', //applies a class on the DMI, which allows for css overriding for specific use cases.
					'thead' : ['','Created','Task','Due Date','Priority','Type','Assigned To',''], //leave blank at end if last row is buttons.
					'tbodyDatabind' : "var: tasks(@TASKS); format:processList; loadsTemplate:taskListRowTemplate;",
					'buttons' : ["<button data-app-event='admin|refreshDMI'>Refresh<\/button><button class='applyButton' data-text='true' data-icon-primary='ui-icon-circle-plus' data-app-click='admin_task|adminTaskCreateShow'>Add Task<\/button>"],	
					'controls' : "<button data-app-click='admin|checkAllCheckboxesExec' class='applyButton marginRight'>Select All<\/button><span class='applyButtonset smallButton'>Modify Selected:	<button data-app-click='admin_task|adminTaskCompletedBulkExec'>Tag as Completed</button><button data-app-click='admin_task|adminTaskRemoveBulkConfirm'>Deleted</button><\/span>",
					'cmdVars' : {
						'_cmd' : 'adminTaskList',
						'limit' : '50', //not supported for every call yet.
						'_tag' : {
							'datapointer':'adminTaskList',
							'extension' : 'admin_task',
							'callback' : 'updateTaskList'
							}
						}
					});
				$("[data-app-role='dualModeContainer']:first",$target).anydelegate();
				app.model.dispatchThis('mutable');
				app.u.handleButtons($target);
				$('.applyButtonset',$target).buttonset().off('change.handleModifyTasks').on('change.handleModifyTasks',function(){
					app.ext.admin_task.u.handleModifyTasks(this);
					});

				}, //showTaskManager

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			taskClass : function($tag,data)	{
				if(Number(data.value.completed_gmt))	{
					if((app.u.unixNow() - Number(data.value.completed_gmt)) > (60*60*24*7)){$tag.addClass('displayNone')} //hide tasks that were completed more than a week ago.
					else	{} //do nothing.
					}
				else if(Number(data.value.due_gmt))	{
					app.u.dump(" -> has a due date. Number(data.value.due_gmt) - app.u.unixNow(): "+(Number(data.value.due_gmt) - app.u.unixNow()));
					if(app.u.unixNow() > Number(data.value.due_gmt)) {$tag.addClass('red');} //past due date.
					else if ((Number(data.value.due_gmt) - app.u.unixNow()) < (60*60*24*2)){$tag.addClass('orange')} //due within 2 days. highlight.
					else	{} //not past due or too close to due date.
					}
				else	{} // no due data and not completed. do nothing.
				}
			}, //renderFormats





////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {}, //u

		e : {



			adminTaskCreateShow : function($ele,p)	{

				var $target = $('#createTaskModal'); //created as part of init process.
				$target.empty().anycontent({
					'templateID' : 'taskListCreateTemplate',
					'data' : {}, //pass empty data set so translation occurs and the loadsTemplate within this template gets run.
					'showLoading' : false
					});
				$('form',$target).anydelegate({'trackEdits':true}).append("<input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
				$('.datepicker',$target).datepicker({
					'dateFormat':'@',
					'onClose' : function(dateText,object)	{
//						app.u.dump(" -> this:");	app.u.dump(this);
						if(this.defaultValue == this.value)	{
							//value did not change.
							}
						else	{
							this.value = (parseInt(this.value) / 1000);
							}
						}
					}); //@ sets the format to epoch.
				app.u.handleButtons($target);
				$target.dialog('open');
				}, //adminTaskCreateShow
			
			adminTaskRemoveBulkConfirm : function($ele,p)	{
				var $checked = $ele.closest("[data-app-role='dualModeContainer']").find(':checkbox:checked');
				if($checked.length)	{

				app.ext.admin.i.dialogConfirmRemove({
					"message" : "Are you sure you wish to delete "+$checked.length+" task(s)? There is no undo for this action.",
					"removeButtonText" : "Remove Tasks", //will default if blank
					"title" : "Remove "+$checked.length+" Task(s)", //will default if blank
					"removeFunction" : function(vars,$D){
						$D.showLoading({"message":"Deleting "});
						$checked.each(function(index){
							var taskID = $(this).closest('[data-id]').data('id');
							if($(app.u.jqSelector('#','task_'+taskID).length))	{
								var $panel = $(app.u.jqSelector('#','task_'+taskID));
								if($panel.is(':visible'))	{
									$panel.slideUp('fast',function(){
										$panel.remove();
										})
									}
								else	{
									$panel.remove();
									}
								}
							app.model.addDispatchToQ({
								'_cmd':'adminTaskRemove',
								"taskid":taskID,
								"_tag" : {
//add a callback to the last remove to display errors/close the dialog.
//have a negative check here because having the function at the end of the line reads easier.
									callback : (index != ($checked.length - 1)) ? '' : function(rd){ 
										$D.hideLoading();
										if(app.model.responseHasErrors(rd)){
											$D.anymessage({'message':rd});
											}
										else	{
											$D.dialog('close');
											$ele.closest(".dualModeContainer").find("[data-app-click='admin|checkAllCheckboxesExec']").data('selected',false); //resets 'select all' button to false so a click selects everything.
											}
										}
									}
								},'immutable');
							});
				
						app.model.addDispatchToQ({
							'_cmd' : 'adminTaskList',
							'limit' : '50', //not supported for every call yet.
							'_tag' : {
								'datapointer':'adminTaskList',
								'extension' : 'admin_task',
								'callback' : 'updateTaskList',
								'jqObj' : $ele.closest("[data-app-role='dualModeContainer']")
								}
							},'immutable');
						app.model.dispatchThis('immutable');
				
						}
					})

					}
				else	{
					$('#globalMessaging').anymessage({"message":"Please select at least on task from the list below for modification.",'errtype':'youerr'});
					}
				
				}, //adminTaskRemoveBulkConfirm
			
			adminTaskCompletedBulkExec : function($ele,p)	{
				var $checked = $ele.closest("[data-app-role='dualModeContainer']").find(':checkbox:checked');
				if($checked.length)	{
					$checked.each(function(){
						app.model.addDispatchToQ({'_cmd':'adminTaskComplete',"taskid":$(this).closest('[data-id]').data('id')},'immutable');
						});
					app.model.addDispatchToQ({
						'_cmd' : 'adminTaskList',
						'limit' : '50', //not supported for every call yet.
						'_tag' : {
							'datapointer':'adminTaskList',
							'extension' : 'admin_task',
							'callback' : 'updateTaskList',
							'jqObj' : $ele.closest("[data-app-role='dualModeContainer']")
							}
						},'immutable');
					app.model.dispatchThis('immutable');
					
					}
				else	{
					$('#globalMessaging').anymessage({"message":"Please select at least on task from the list below for modification.",'errtype':'youerr'});
					}
				}, //adminTaskCompletedBulkExec

			adminTaskUpdateShow : function($ele,p)	{

				var taskID = $ele.closest("[data-id]").data('id');
				$panel = app.ext.admin.i.DMIPanelOpen($ele,{
					'templateID' : 'taskListEditPanelTemplate',
					'panelID' : 'task_'+taskID,
					'header' : 'Edit Task: '+taskID,
					'data' : $ele.closest("[data-id]").data(),
					'showLoading':false
					});
				$('form',$panel).anydelegate({'trackEdits':true}).append("<input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
				$('.datepicker',$panel).datepicker({
					'dateFormat':'@',
					'onClose' : function(dateText,object)	{
//						app.u.dump(" -> this:");	app.u.dump(this);
						if(this.defaultValue == this.value)	{
							//value did not change.
							}
						else	{
							this.value = (parseInt(this.value) / 1000);
							$(this).addClass('edited').closest('form').anydelegate('updateChangeCounts');
							}
						}
					}); //@ sets the format to epoch.
				app.u.handleButtons($panel);
				} //adminTaskUpdateShow
			} //events

		} //r object.
	return r;
	}