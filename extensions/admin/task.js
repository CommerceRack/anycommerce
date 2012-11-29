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
	var theseTemplates = new Array('taskListPageTemplate','taskListRowTemplate','taskListCreateEditTemplate','taskListEditTemplate','taskListAddTemplate');
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
			
			showTaskManager : function() {
				var $target = $(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content"));
//generate some of the task list content right away so the user knows something is happening.
				$target.empty().showLoading();
				app.ext.admin_task.calls.adminTaskList.init({'callback':function(_tag){
					var data = app.data[_tag.datapointer]; //shortcut to data. the data saved is identical to the response w/ _tag/_rtag added back in.
					if(app.model.responseHasErrors(data))	{
						app.u.throwMessage(data);
						}
					else	{
						$target.append(app.renderFunctions.transmogrify({},'taskListPageTemplate',data)); //populate content.
						$target.hideLoading();
						app.ext.admin_task.u.handleButtons($target);
						}
					}},'immutable');
				app.model.dispatchThis('immutable');
				},

			showAddTaskModal : function(){
				var $target = $('#taskLiskCreateModal');
				if($target.length)	{
					$target.empty();
					}
				else	{
					$target = $("<div \/>").attr('id','taskLiskCreateModal').appendTo('body');
					$target.dialog({'width': 500, 'height':500, 'autoOpen':false, 'modal':true});
					}
				$target.dialog('open');
				$target.append(app.renderFunctions.transmogrify({'id':'addTaskFormContainer'},'taskListCreateEditTemplate',{}));
				},

//A function for showing just the tasks. template ID can be passed in. Think landing page or for some panel.
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
				$('#taskEditorContainer').append(app.renderFunctions.transmogrify(dataObj,'taskListEditTemplate',app.data.adminTaskList['@TASKS'][dataObj.obj_index]));
				},
			
			
			handleButtons : function($target){
$("button",$target).each(function(){
	var $btn = $(this);
	$btn.button();
	$btn.on('click.prevent',function(event){event.preventDefault();}); //precent default submit action

	if($btn.data('btn-action') == 'editTask')	{
		$btn.on('click.task-action',function(){
			app.ext.admin_task.u.handlePanelResize('edit');
			app.ext.admin_task.u.addEditorFor($btn.closest('tr').data());
			});
		}
	else if($btn.data('btn-action') == 'togglePanelResize')	{
		$btn.button({icons: {primary: "ui-icon-seek-next"},text: false}); //change icon to indicate a click will expand the panel. set here for initial button display.
		$btn.on('click.task-action',function(){
			var mode = $('#taskListContainer').data('mode');
			if(mode == 'list'){
				$btn.button('destroy').button({icons: {primary: "ui-icon-seek-next"},text: false}); //change icon to indicate a click will shrink the panel
				app.ext.admin_task.u.handlePanelResize('edit');
				}
			else if(mode == 'edit'){
				$btn.button('destroy').button({icons: {primary: "ui-icon-seek-prev"},text: false}); //change icon to indicate a click will expand the panel
				app.ext.admin_task.u.handlePanelResize('list');
				}
			else	{}
			
			});
		}
	else	{
		app.u.throwGMessage("Error: unknown btn-action specified for button. admin_task.u.handleButtons");
		}

	});
$('.taskListButtonRow .buttonSet').buttonset();

				}
			
			} //u


		} //r object.
	return r;
	}