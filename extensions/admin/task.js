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
	var theseTemplates = new Array('taskListPageTemplate','taskListRowTemplate','taskListCreateEditTemplate','taskListEditPanelTemplate','taskListCreateTemplate');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/task.html',theseTemplates);

//used for the delete confirmation dialog.
$('body').append("<div id='removeTaskConfirmModal' class='displayNone' title='Please confirm delete'><p><span class='ui-icon ui-icon-alert floatLeft marginRight marginBottom'></span>These tasks will be permanently deleted and cannot be recovered. Are you sure?</p></div>");
//used for the delete confirmation dialog.
$('body').append("<div id='updateTaskModal' class='displayNone' title='Update selected tasks'><p><span class='ui-icon ui-icon-pencil floatLeft marginRight marginBottom'></span>Setting the fields below will update ALL of the selected tasks.</p></div>");
$('#updateTaskModal').dialog({'autoOpen':false,'modal':true,'width':500});

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

		adminTaskUpdate : {
			onSuccess : function(tagObj){
				app.u.dump("BEGIN admin_task.callbacks.adminTaskUpdate");
				var msgObj = app.u.successMsgObject("The task updates have been saved.");
				msgObj.targetID = tagObj.targetID;
				app.u.throwMessage(msgObj);
				},
			onError : function(tagObj){
//hideLoading is handled by the updateTaskList call 
				tagObj.targetID = 'createTaskModal'; //sets where to put the error messages.
				app.u.throwMessage(app.data[tagObj.datapointer]);
				}
			}, //adminTaskUpdate


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
//this callback gets used a lot, both on initial load AND when the list is updated.
//after an update occurs, need to see if mode=edit and if so, hide the stuff that should be hidden.
		updateTaskList : {
			onSuccess : function(tagObj){
				app.u.dump("BEGIN admin_task.callbacks.updateTaskList.onSuccess");
				app.renderFunctions.translateSelector(app.u.jqSelector('#',tagObj.targetID),app.data[tagObj.datapointer]); //populate content.
				$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).hideLoading();
				app.ext.admin_task.u.handleListButtons($('#taskListTbody')); //buttons outside tbody already have actions, this is just for the tasks.
				var $list = $('#taskListContainer');
				if($list.data('mode') == 'edit')	{
					$('.hideInMinifyMode',$list).hide(); //adjust display for minification.
					}
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
			showTaskManager : function() {
				app.u.dump("BEGIN admin_task.a.showTaskManager");
				var $target = $(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content"));
//generate some of the task list content right away so the user knows something is happening.
				$target.empty().showLoading();
				$target.append(app.renderFunctions.transmogrify({},'taskListPageTemplate',{})); //populate content.
				app.ext.admin_task.u.handleListButtons($target);
//tasklistcontainer is the id, not the tbody, because the translateSelector exectuted in the callback only translates the children, not the target itself.
				app.ext.admin.calls.adminTaskList.init({'callback':'updateTaskList','extension':'admin_task','targetID':'taskListContainer'},'immutable');
				app.model.dispatchThis('immutable');
				}, //showTaskManager

			showCreateTaskModal : function(){
				var $target = $('#createTaskModal'); //created as part of init process.
				$target.empty().append(app.renderFunctions.transmogrify({'id':'addTaskFormContainer'},'taskListCreateTemplate',{}));
				$('button',$target).button(); //make the buttons look like jqueryui buttons.
				$('.datepicker',$target).datepicker({'dateFormat':'@'}); //@ sets the format to epoch.
//apply the onsubmit action for the form.
//processForm handles the request creation.
				$('form',$target).off('submit.adminTaskCreate').on('submit.adminTaskCreate',function(event){
					event.preventDefault();
					app.ext.admin.a.processForm($(this),'immutable');
					app.ext.admin_task.u.clearAndUpdateTaskManager();
					app.model.dispatchThis('immutable');
					});
				$target.dialog('open');
//				app.ext.admin_task.u.handleListButtons($target);
				}, //showCreateTaskModal

//A function for showing just the tasks. template ID can be passed in. Think landing page or for Pekonens messaging panel.
//should return the content as a jquery object.
			showTaskList : function(opts)	{
				var $o = undefined; //output. what is returned.
				if(opts && opts.templateID)	{
					alert('do something'); //!! not done yet.
					}
				else	{
					app.u.throwGMessage("Error: no template id passed into admin_task.a.showTaskList");
					}
				return $o;
				} //showTaskList

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
//panelFocus can = list or edit. if list, left column (list of tasks) gets bigger. if 'edit', right column (list of edits) gets bigger.
			handleTaskManagerModeChange : function(panelFocus)	{
//				app.u.dump("BEGIN admin_task.u.handleTaskManagerModeChange. panelFocus: "+panelFocus);
				$('.togglePanelResize').show(); //the toggle button is hidden by default. show once the panel sizes change.
				var $list = $('#taskListContainer');
				var $edit = $('#taskEditPanelsContainer');
				var numTaskEditPanels = $edit.children().length;
				if(panelFocus == $list.data('mode')){} //already in the correct state. do nothing.
//collapse the active tasks panel. show the edit panel.
				else if(panelFocus == 'edit')	{
					$list.data('mode','edit');
//edit is getting big and list is getting small. show/hide elements accordingly.
					$('.hideInMinifyMode',$list).hide(); //adjust list side for minification.
					$('.hideInMinifyMode',$edit).show(); //adjust edit side for maxification.
					
					if(numTaskEditPanels)	{
						$('.taskEditPanel',$edit).each(function(){
							var $panel = $(this);
							if($panel.data('panel-state') == 'open' ){
								app.ext.admin_task.u.toggleTaskEditPanel($panel,'open');
								}
							});
						}
					else	{} //no taskEditPanels exist so nothing needs to be opened.
					
					$list.animate({width:"49%"},1000); //shrink list side.
					$edit.show().animate({width:"49%"},1000); //expand edit side.
					$('.togglePanelResize').button({icons: {primary: "ui-icon-seek-next"},text: false}); //change icon to indicate a click will expand the panel
					}
//collapse the edit panel. show the active tasks panel.
				else if(panelFocus == 'list'){
					$list.data('mode','list');
//edit is getting small and list is getting big. show/hide elements accordingly.
					$('.hideInMinifyMode',$list).show();
					$('.hideInMinifyMode',$edit).hide();
					$('.ui-widget-content',$edit).slideUp(1000);
					$list.animate({width: (numTaskEditPanels) ? '80%': '98%'},1000); //if the edit column has children, leave some space for taskEditPanel headers.
					$edit.animate({width: (numTaskEditPanels) ? '18%': '1%'},1000); //close right column if no taskEditPanels are present.
					$('.togglePanelResize').button('destroy').button({icons: {primary: "ui-icon-seek-prev"},text: false}); //change icon to indicate a click will shrink the panel
					}
				else	{
					$list.data('mode','error');
					app.u.throwGMessage("Error: panelFocus ['"+panelFocus+"'] is not valid or undefined in admin_task.u.handleManagerResize");
					}
				}, //handleTaskManagerModeChange


//when an update, delete or save occurs, the manager is going to get updated. This function should be run.
//it'll empty the tasks, create the call and add showLoading to the tab in focus.
			clearAndUpdateTaskManager : function()	{
				app.model.destroy('adminTaskList'); //clear task list from localstorage and memory (forces request for new data)
				app.ext.admin.calls.adminTaskList.init({'callback':'updateTaskList','extension':'admin_task','targetID':'taskListContainer'},'immutable');
				$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).showLoading();
				$('#taskListTbody').empty();
				}, //clearAndUpdateTaskManager
			
/*


panel-state is only set when the button is clicked.  That way, when toggle is run because switching to/from  list/edit mode, the panel-state can be used to restore the previous state.
*/
			toggleTaskEditPanel : function($panel,state){
//				app.u.dump("BEGIN admin_task.u.toggleTaskEditPanel");
				app.ext.admin_task.u.handleTaskManagerModeChange('edit'); //make sure manager is in edit mode.
				var $btn = $panel.find("[data-btn-action='toggleTaskEditPanel']");
				if($panel.length && $btn.length)	{
//panel is visible, minimize it.
					if(state == 'close')	{
//						app.u.dump(" -> hide panel.");
						$btn.attr('title','Maximize Panel').button('destroy').button({icons: {primary: "ui-icon-triangle-1-s"},text: false}).off('click.toggleTaskEditPanel').on('click.toggleTaskEditPanel',function(){
							app.ext.admin_task.u.toggleTaskEditPanel($(this).closest('.taskEditPanel'),'open');
							$($panel).data('panel-state','closed'); 
							}); //change button icon.
						$('.ui-widget-content',$panel).slideUp(1000);
						}
					else if (state == 'open')	{
//						app.u.dump(" -> show panel.");
						$btn.attr('title','Minimize Panel').button('destroy').button({icons: {primary: "ui-icon-triangle-1-n"},text: false}).off('click.toggleTaskEditPanel').on('click.toggleTaskEditPanel',function(){
							app.ext.admin_task.u.toggleTaskEditPanel($(this).closest('.taskEditPanel'),'close');
							$($panel).data('panel-state','open');
							}); //change button icon.
						$('.ui-widget-content',$panel).slideDown(1000);
						}
					else	{
						app.u.throwGMessage("Error: invalid state["+state+"] for admin_task.u.toggleTaskEditPanel");
						}
					}
				else	{
					app.u.throwGMessage("Error: no panel and/or button ["+$panel.length+"/"+$btn.length+"] for admin_task.u.toggleTaskEditPanel");
					}
				}, //toggleTaskEditPanel

//dataObj will be info about the task. everything in the original task list object, however it gets lowercased so just use it to reference original data.
//this allows the add and edit templates to be recycled (maintaining case).
			addTaskEditPanel : function(dataObj)	{
//				app.u.dump("admin_task.u.addTaskEditPanel dataObj: "); app.u.dump(dataObj);
				//check to see if template is already rendered and, if so, just highlight it (maybe jump to it?)
//				dataObj.taskid = dataObj.id;
//				dataObj.id = "taskEditor_"+dataObj.taskid;
				if(dataObj && dataObj.id)	{
					var $panel = $('#taskUpdatePanel_'+dataObj.id);
//if the panel already exists, make sure it' open.
					if($panel.length)	{
						$panel.data('panel-state','open')
						app.ext.admin_task.u.toggleTaskEditPanel($panel,'open');
						}
//the panel does not exist yet, create it.
					else	{

var $panel = app.renderFunctions.transmogrify(dataObj,'taskListEditPanelTemplate',dataObj);
$panel.data('panel-state','open');
$panel.attr('id','taskUpdatePanel_'+dataObj.id)
$('.datepicker',$panel).datepicker({'dateFormat':'@'});
$('.datepicker',$panel).change(function(){$(this).val(parseInt($(this).val()) / 1000);}); //strip milliseconds from epoch
	
$('#taskEditPanelsContainer').prepend($panel);

$('button',$panel).each(function(){
	var $btn = $(this);
	$btn.button(); //make the buttons look like jqueryui buttons.
	var action = $btn.data('btn-action');
	if(action == 'closeTaskEditPanel'){
		$btn.attr('title','Close Panel').button({icons: {primary: "ui-icon-closethick"},text: false}).on('click',function(){
			$(this).closest('.taskEditPanel').empty().remove()
			}); //change button icon.
		}
	else if(action == 'saveTaskEditPanel'){} //the button submits the form, so no action is necessary. must be declared tho to avoid error.
	else if(action == 'toggleTaskEditPanel'){
		$btn.attr('title','Minimize Panel').button({icons: {primary: "ui-icon-triangle-1-n"},text: false}).off('click.toggleTaskEditPanel').on('click.toggleTaskEditPanel',function(){
			$panel.data('panel-state','close')
			app.ext.admin_task.u.toggleTaskEditPanel($(this).closest('.taskEditPanel'),'close'); //panels open by default, so first action will be to close it.
			});
		}
	else	{app.u.throwGMessage('Error: invalid btn-action set in admin_task.u.addTaskEditPanel. btn-action: ["+action+"] (blank is not a valid value)')}
	});

$('form',$panel).off('submit.adminTaskUpdate').on('submit.adminTaskUpdate',function(event){
	event.preventDefault();
	app.ext.admin.a.processForm($(this),'immutable');
	app.ext.admin_task.u.clearAndUpdateTaskManager();
	app.model.dispatchThis('immutable');
	});


						
						}			
					}
				else	{
					app.u.throwGMessage("Error: invalid object or obj.id not specified in admin_task.a.addTaskEditPanel.");
					app.u.dump("admin_task.a.addTaskEditPanel dataObj: "); app.u.dump(dataObj);
					}

				}, //addTaskEditPanel
			
//run when 1 or more checkboxes are checked and one of the 'modify tasks' radios is changed (completed or delete are currently supported).
			handleModifyTasks : function(t)	{
app.u.dump("BEGIN admin_task.u.handleModifyTasks");
var $radio = $(':radio:checked',$(t));
var cmd = $radio.val();
var numChecked = $('#taskListContainer .taskManagerListTable input:checkbox:checked').length

app.u.dump(" -> cmd: "+cmd+" and num checked: "+numChecked);

if(numChecked)	{
	if(cmd == 'adminTaskRemove')	{
		app.u.dump(" -> adminTaskRemove button clicked.");
		var $dialog = $( "#removeTaskConfirmModal" );
		$dialog.dialog({
			resizable: false,
			height:200,
			autoOpen:false,
			modal: true,
			buttons: {
				"Delete selected tasks": function() {
					$('#taskListContainer .taskManagerListTable input:checkbox:checked').each(function(){
						app.u.dump(" -> checked task ID: "+$(this).closest('[data-id]').data('id'));
						app.ext.admin.calls.adminTaskRemove.init($(this).closest('[data-id]').data('id'),{},'immutable');
						});
					app.ext.admin_task.u.clearAndUpdateTaskManager();
					app.model.dispatchThis('immutable');
					$(this).dialog( "close" );
					},
				"Cancel" : function() {
					$(this).dialog( "close" );
					}
				}
			});
		$dialog.dialog('open');
		}
	else if(cmd == 'adminTaskComplete')	{
		$('#taskListContainer .taskManagerListTable input:checkbox:checked').each(function(){
			app.ext.admin.calls.adminTaskComplete.init($(this).closest('[data-id]').data('id'),{},'immutable');
			});
		app.ext.admin_task.u.clearAndUpdateTaskManager();
		app.model.dispatchThis('immutable');
		}
//not supported just yet
//	else if(cmd == 'adminTaskUpdate'){
//		alert('do something');
//		}
	else	{
		app.u.throwGMessage("Error: unknown cmd set in admin_task.u.handleModifyTasks");
		}
	}
else	{
	alert("Please select at least 1 task from the list.");
	}
//whether a success or failure, we always want the modify buttons to revert to their normal state so one doesn't look clicked.
//also have to uncheck the radio buttons or they can't be enabled again till another selection is made.
$('#taskListContainer .taskListButtonRow .ui-state-active').removeClass('ui-state-active');
$('#taskListContainer .taskListButtonRow :radio').prop('checked',false);
				},


			handleListButtons : function($target){
$("button",$target).each(function(){
	var $btn = $(this);
	$btn.button();
	$btn.on('click.prevent',function(event){event.preventDefault();}); //precent default submit action

	var btnAction = $btn.data('btn-action');

	if(btnAction == 'editTask')	{
		$btn.on('click.task-action',function(){
			app.ext.admin_task.u.handleTaskManagerModeChange('edit');
			app.ext.admin_task.u.addTaskEditPanel($btn.closest('tr').data());
			});
		}
	else if(btnAction == 'addNewTask')	{
		$btn.button({icons:{primary: "ui-icon-circle-plus"}}); //add plus sign icon.
		$btn.on('click.task-action',function(){
			app.ext.admin_task.a.showCreateTaskModal();
			});
		}
	else if(btnAction == 'togglePanelResize')	{
		$btn.on('click.task-action',function(){
			var mode = $('#taskListContainer').data('mode');
			if(mode == 'list'){
				app.ext.admin_task.u.handleTaskManagerModeChange('edit');
				}
			else if(mode == 'edit'){
				app.ext.admin_task.u.handleTaskManagerModeChange('list');
				}
			else	{}
			
			});
		}
	else	{
		app.u.throwGMessage("Unknown btn-action specified for button. admin_task.u.handleListButtons ['"+btnAction+"']");
		}

	});
//don't use a click event here, it gets double executed. change worked properly.
//run an off first to make sure action isn't double added if this function is re-run.
$('.taskListButtonRow .buttonSet').buttonset().off('change.handleModifyTasks').on('change.handleModifyTasks',function(){
	app.ext.admin_task.u.handleModifyTasks(this);
	});

				}
			
			} //u


		} //r object.
	return r;
	}