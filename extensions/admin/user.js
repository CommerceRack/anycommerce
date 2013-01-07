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





var admin_user = function() {
	var theseTemplates = new Array('userManagerPageTemplate','userManagerUserRowTemplate','userManagerRoleRowTemplate','userManagerUserCreateUpdateTemplate');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/user.html',theseTemplates);
				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/user.css','user_styles']);

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
//This is how the task manager is opened. Just execute this function.
// later, we may add the ability to load directly into 'edit' mode and open a specific task. not supported just yet.
			showUserManager : function() {
				app.u.dump("BEGIN admin_user.a.showUserManager");
				var $tabContent = $(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content"));
//generate some of the task list content right away so the user knows something is happening.
				$tabContent.empty();
				$tabContent.append(app.renderFunctions.createTemplateInstance('userManagerPageTemplate',{'id':'userManagerContent'})); //placeholder
				$('#userManagerContent').showLoading();
				app.ext.admin.calls.bossRoleList.init({},'mutable'); //have this handy.
				app.ext.admin.calls.bossUserList.init({'callback':'translateSelector','extension':'admin','selector':'#userManagerContent'},'mutable');
				app.model.dispatchThis('mutable');
				} //showTaskManager
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
//mode is optional.  If not passed, it'll toggle. valid modes are list and detail.
//list mode will toggle the detail column OFF and expand the list column to 100%.
//detail mode will toggle the detail column ON and shrink the list column to 65%.
			toggleDualMode : function($parent,mode)	{
				var $L = $("[data-app-role='dualModeList']",$parent), //List column
				$D = $("[data-app-role='dualModeDetail']",$parent), //detail column
				numDetailPanels = $D.children().length,
				$btn = $("[data-app-event='admin_user|toggleDualMode']",$parent);
				
				if(mode && (mode == 'list' || mode == 'detail'))	{
//go into detail mode. This expands the detail column and shrinks the list col. 
//this also toggles a specific class in the list column off
					if(mode == 'detail' || $L.data('app-mode') == 'list')	{
						$L.animate({width:"49%"},1000); //shrink list side.
						$D.show().animate({width:"49%"},1000); //expand detail side.
						$btn.show();
						$L.data('app-mode') = 'detail';
						$('.hideInDetailMode',$L).hide(); //adjust list for minification.
						}
					else	{
//if there are detail panels open, shrink them down but show the headers.
						if(numDetailPanels)	{
							$L.animate({width:"84%"},1000); //shrink list side.
							$D.show().animate({width:"14%"},1000); //expand detail side.
							}
//there are no panels open in the detail column, so expand list to 100%.
						else	{
							$L.animate({width:"100%"},1000); //shrink list side.
							$D.show().animate({width:0},1000); //expand detail side.
							$btn.hide();
							}
						$('.hideInDetailMode',$L).show(); //adjust list for minification.
						}
					}
				else	{
					app.u.throwGMessage("In admin_user.u.toggleDisplayMode, invalid mode ["+mode+"] passed. only list or detail are supported.");
					}
				
				}
			}, //u

		e : {
			
			
			"toggleDualMode" : function($btn)	{
				$btn.button();
				},
			
			"roleListEdit" : function($this)	{
				app.u.dump("BEGIN admin_users.e.roleListEdit");
				$this.sortable({ handle: ".handle" });
				},

/*
the create and update template is recycled. the button has the same app event, but performs a different action based on whether or not a save or update is being perfomed.
Whether it's a create or update is based on the data-usermode on the parent.
*/
			"bossUserCreateUpdateSave" : function($btn){
				$btn.button();
				$btn.off('click.bossUserCreateUpdateSave').on('click.bossUserCreateUpdateSave',function(event){
					event.preventDefault();
					app.u.dump("BEGIN admin_user.e.bossUserCreateUpdateSave");
					var $parent = $(this).closest("[data-usermode]"),
					mode = $parent.data('usermode'),
					frmObj = $(this).closest("form").serializeJSON();
					
					frmObj.roles = new Array();
					$(":checkbox",$parent).each(function(){
						var $cb = $(this);
						if($cb.is(':checked'))	{frmObj.roles.push($cb.attr('name'))}
						else	{} //not checked. do nothing.

						delete frmObj[$cb.attr('name')]; //remove from serialized form object. params are/may be whitelisted.
						});

					app.u.dump(" -> mode: "+mode);

					if($.isEmptyObject(frmObj))	{
						app.u.throwGMessage('In admin_user.e.bossUserCreateUpdateSave, unable to locate form object for serialization or serialized object is empty.');
						}
					else if(mode == 'update')	{
						app.ext.admin.calls.bossUserUpdate.init(frmObj,{},'immutable');
						app.model.dispatchThis('immutable');
						}
					else if(mode == 'create')	{
						app.model.destroy('bossUserList');
						app.ext.admin.calls.bossUserCreate.init(frmObj,{},'immutable');
						app.ext.admin.calls.bossUserList.init({},'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{
						app.u.throwGMessage('In admin_user.e.bossUserCreateUpdateSave, unable to determine mode.');
						}
					});
				},
			
			"bossUserUpdate" : function($btn){
				$btn.button();
				$btn.off('click.bossUserUpdate').on('click.bossUserUpdate',function(event){
					event.preventDefault();
					var $target = $('#bossUserUpdateModal');
					if($target.length)	{$target.empty();}
					else	{
						$target = $("<div \/>").attr('id','bossUserUpdateModal');
						$target.appendTo("body");
						$target.dialog({width:'90%',height:600,autoOpen:false,modal:true});
						}
					$target.dialog('open');
					//see bossUserCreateUpdateSave app event to see what usermode is used for.
					$target.append(app.renderFunctions.transmogrify('userManagerUserCreateUpdateTemplate',{'id':'bossUserUpdateContent','usermode':'update'})); //populate content.
					app.ext.admin.u.handleAppEvents($target);
					});
				},
			
			"bossUserCreate" : function($btn){
				$btn.button();
				$btn.off('click.bossUserCreate').on('click.bossUserCreate',function(event){
					event.preventDefault();
					var $target = $('#bossUserCreateModal');
					if($target.length)	{$target.empty();}
					else	{
						$target = $("<div \/>").attr({'id':'bossUserCreateModal','title':'Create User'});
						$target.appendTo("body");
						$target.dialog({width:500,height:600,autoOpen:false,modal:true});
						}
					$target.dialog('open');
					//see bossUserCreateUpdateSave app event to see what usermode is used for.
					$target.append(app.renderFunctions.transmogrify({'id':'bossUserCreateContent','usermode':'create'},'userManagerUserCreateUpdateTemplate',app.data.bossRoleList)); //populate content.
					app.ext.admin.u.handleAppEvents($target);
					});
				}
			}
		} //r object.
	return r;
	}