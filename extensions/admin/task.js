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
TODO:
mode = edit
 -> Add icons to headers for collapse and close.
 -> add save button and save functionality.
 -> when a task edit is collapsed, change 'collapse' to 'expand'
    -> if mode = list and 'expand' is clicked, switch to mode = edit.

Change mode 'list' to 'manage'

mode = manage
 -> add 'add new' functionality.
 -> modify selection section is not working yet.
*/



var admin_task = function() {
	var theseTemplates = new Array('taskListPageTemplate','taskListRowTemplate','taskListCreateEditTemplate','taskListEditTemplate','taskListCreateTemplate');
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
			init : function(obj,tagObj,q)	{
				this.dispatch(obj,tagObj,q);
				},
			dispatch : function(obj,tagObj,q)	{
				obj._cmd = "adminTaskCreate"
				obj._tag = tagObj || {};
				obj._tag.datapointer = "adminTaskCreate";
				app.model.addDispatchToQ(obj,q);	
				}
			}, //adminTaskCreate
		
		adminTaskRemove : {
			init : function(taskid, tagObj,q)	{
				this.dispatch(taskid, tagObj,q);
				},
			dispatch : function(taskid, tagObj,q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminTaskRemove";
				app.model.addDispatchToQ({"taskid":taskid, "_cmd":"adminTaskRemove","_tag":tagObj},q);	
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
			} //adminTaskUpdate
/*		adminTaskDetail : {
			init : function(taskid,tagObj,q)	{
				this.dispatch(taskid,tagObj,q);
				},
			dispatch : function(taskid,tagObj,q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminTaskDetail";
				app.model.addDispatchToQ({"_cmd":"adminTaskDetail","taskid":taskid,"_tag":tagObj},q);	
				}
			} //adminTaskDetail
*/		
		}, //calls




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

		adminTaskCreate : {
			onSuccess : function(tagObj){
//hideLoading is handled by the updateTaskList call 
				$('#createTaskModal').dialog('close');
				app.u.throwMessage(app.data[tagObj.datapointer]);
				}
			},
		updateTaskList : {
			onSuccess : function(tagObj){
				app.renderFunctions.translateSelector(app.u.jqSelector('#',tagObj.targetID),app.data[tagObj.datapointer]); //populate content.
				$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).hideLoading();
				app.ext.admin_task.u.handleButtons($('#taskListTbody')); //buttons outside tbody already have actions, this is just for the tasks.
				},
			onError : function(responseData, uuid)	{
				app.u.throwMessage(responseData);
				$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).hideLoading();
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
			
			showTaskManager : function() {

				var $target = $(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content"));
//generate some of the task list content right away so the user knows something is happening.
				$target.empty().showLoading();
				$target.append(app.renderFunctions.transmogrify({},'taskListPageTemplate',{})); //populate content.
				app.ext.admin_task.u.handleButtons($target);
//tasklistcontainer is the id, not the tbody, because the translateSelector exectuted in the callback only translates the children, not the target itself.
				app.ext.admin_task.calls.adminTaskList.init({'callback':'updateTaskList','extension':'admin_task','targetID':'taskListContainer'},'immutable');
				app.model.dispatchThis('immutable');
				},

			showCreateTaskModal : function(){
				var $target = $('#createTaskModal'); //created as part of init process.
				$target.empty().append(app.renderFunctions.transmogrify({'id':'addTaskFormContainer'},'taskListCreateTemplate',{}));
				$('button',$target).button(); //make the buttons look like jqueryui buttons.
//apply the onsubmit action for the form.
//processForm handles the request creation.
				$('form',$target).on('submit.adminCreateTask',function(event){
					event.preventDefault();
					$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).hideLoading();
					app.ext.admin.a.processForm($(this).parent(),'immutable');
					app.ext.admin_task.calls.adminTaskList.init({'callback':'updateTaskList','extension':'admin_task','targetID':'taskListContainer'},'immutable');
					app.model.dispatchThis('immutable');
					});
				$target.dialog('open');
//				app.ext.admin_task.u.handleButtons($target);
				},

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
				}

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
//panelFocus can = list or edit. if list, left column (list of tasks) gets bigger. if 'edit', right column (list of edits) gets bigger.
			handlePanelResize : function(panelFocus)	{
				app.u.dump("BEGIN admin_task.u.handlePanelResize. panelFocus: "+panelFocus);
				$('.togglePanelResize').show(); //the toggle button is hidden by default. show once the panel sizes change.
				var $list = $('#taskListContainer');
				var $edit = $('#taskEditorContainer');
				
				if(panelFocus == $list.data('mode')){} //already in the correct state. do nothing.
//collapse the active tasks panel. show the edit panel.
				else if(panelFocus == 'edit')	{
					$list.data('mode','edit');
//edit is getting big and list is getting small. show/hide elements accordingly.
					$('.hideInMinifyMode',$list).hide(); //adjust list side for minification.
					$('.hideInMinifyMode',$edit).show(); //adjust edit side for maxification.
					$('.ui-widget-content',$edit).slideDown(1000);
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
					$list.animate({width:"80%"},1000);
					$edit.animate({width:"18%"},1000);
					$('.togglePanelResize').button('destroy').button({icons: {primary: "ui-icon-seek-prev"},text: false}); //change icon to indicate a click will shrink the panel
					}
				else	{
					$list.data('mode','error');
					app.u.throwGMessage("Error: panelFocus ['"+panelFocus+"'] is not valid or undefined in admin_task.u.handleManagerResize");
					}
				},
			
//dataObj will be info about the task. everything in the original task list object, however it gets lowercased so just use it to reference original data.
//this allows the add and edit templates to be recycled (maintaining case).
			addEditorFor : function(dataObj)	{
//				app.u.dump("admin_task.u.addEditorFor dataObj: "); app.u.dump(dataObj);
				//check to see if template is already rendered and, if so, just highlight it (maybe jump to it?)
				$('#taskEditorContainer').prepend(app.renderFunctions.transmogrify(dataObj,'taskListEditTemplate',app.data.adminTaskList['@TASKS'][dataObj.obj_index]));
				},
			
			
			handleModifyTasks : function(t)	{
app.u.dump("BEGIN admin_task.u.handleModifyTasks");
var $radio = $(':radio:checked',$(t));
var action = $radio.val();
app.u.dump(" -> action: "+action);

var numChecked = $('#taskListContainer .taskManagerListTable input:checkbox:checked').length
app.u.dump(" -> num checked: "+numChecked);
if(numChecked)	{
	if(action == 'adminTaskRemove')	{
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
						app.ext.admin_task.calls.adminTaskRemove.init($(this).closest('[data-id]').data('id'),{},'immutable');
						});
					app.ext.admin_task.calls.adminTaskList.init({'callback':'updateTaskList','extension':'admin_task','targetID':'taskListContainer'},'immutable');
					app.model.dispatchThis('immutable');
					$('#taskListTbody').empty(); // clear out all the tasks.
					$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).showLoading();
					$(this).dialog( "close" );
					},
				"Cancel" : function() {
					$(this).dialog( "close" );
					}
				}
			});
		$dialog.dialog('open');
		}
	else if(action == 'adminTaskUpdate'){
		alert('do something');
		}
	else	{
		app.u.throwGMessage("Error: unknown action set in admin_task.u.handleModifyTasks");
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
			
			handleButtons : function($target){
$("button",$target).each(function(){
	var $btn = $(this);
	$btn.button();
	$btn.on('click.prevent',function(event){event.preventDefault();}); //precent default submit action

	var btnAction = $btn.data('btn-action');

	if(btnAction == 'editTask')	{
		$btn.on('click.task-action',function(){
			app.ext.admin_task.u.handlePanelResize('edit');
			app.ext.admin_task.u.addEditorFor($btn.closest('tr').data());
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
				app.ext.admin_task.u.handlePanelResize('edit');
				}
			else if(mode == 'edit'){
				app.ext.admin_task.u.handlePanelResize('list');
				}
			else	{}
			
			});
		}
	else	{
		app.u.throwGMessage("Unknown btn-action specified for button. admin_task.u.handleButtons ['"+btnAction+"']");
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