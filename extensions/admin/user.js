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
	var theseTemplates = new Array('userManagerUserRowTemplate','userManagerRoleRowTemplate','userManagerUserCreateUpdateTemplate');
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

			showUserManager : function($target)	{
				app.u.dump("BEGIN admin_user.a.showUserManager 2.0");

				$target.intervaledEmpty();
				var $DMI = app.ext.admin.i.DMICreate($target,{
					'header' : 'User Manager',
					'className' : 'userManager', //applies a class on the DMI, which allows for css overriding for specific use cases.
					'thead' : ['id','Username','Name','Email','Roles','Created',''], //leave blank at end if last row is buttons.
					'tbodyDatabind' : "var: tickets(@USERS); format:processList; loadsTemplate:userManagerUserRowTemplate;",
					'buttons' : ["<button data-app-event='admin|refreshDMI'>Refresh<\/button><button class='applyButton' data-text='true' data-icon-primary='ui-icon-circle-plus' data-app-click='admin_user|bossUserCreateShow'>Create A New User</button>"],	
					'cmdVars' : {
						'_cmd' : 'bossUserList',
						'limit' : '50', //not supported for every call yet.
						'_tag' : {
							'datapointer':'bossUserList'
							}
						}
					});
				//only need to fetch the boss role list once. Doesn't change much.
				if(app.data.bossRoleList)	{}
				else	{
					app.model.addDispatchToQ({'_cmd':'bossRoleList','_tag':	{'datapointer' : 'bossRoleList'}},'mutable'); //have this handy.
					}
				app.model.dispatchThis('mutable');
				
				app.u.handleButtons($DMI.closest("[data-app-role='dualModeContainer']").anydelegate());

				}			
				
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {

/*
not necessary in users 2.0
			resetUsersTable : function()	{
				var $table = $("[data-app-role='dualModeListContents']","#userManagerContent")
				$table.empty();
				app.renderFunctions.translateSelector("#userManagerContent [data-app-role='dualModeList']",app.data.bossUserList);
				app.ext.admin.u.handleAppEvents($table);
				app.ext.admin.u.toggleDualMode($('#userManagerContent'),$('#userManagerContent').data('app-mode'));
				},
*/
			getRoleCheckboxesAsArray : function($parent)	{
				var roles = new Array();
				if($parent && $parent.length)	{
					$(":checkbox",$parent).each(function(){
						var $cb = $(this);
						if($cb.is(':checked'))	{roles.push($cb.attr('name'))}
						else	{} //not checked. do nothing.
						});
					}
				else	{
					roles = false;
					app.u.throwGMessage("In admin_users,u.getRoleCheckboxesAsArray, $parent not specified or does not exist on the DOM.");					
					}
				return roles;
				}
			}, //u

		macrobuilders : {

			'bossUserCreate' : function(sfo,$form)	{
				app.u.dump("BEGIN admin_support.macrobuilders.bossUserCreate");
				sfo.roles = app.ext.admin_user.u.getRoleCheckboxesAsArray($form);
				sfo._cmd = "bossUserCreate"
//clean up sfo to minimize the request.
				$(":checkbox",$form).each(function(){
					delete sfo[$(this).attr('name')]; //remove from serialized form object. params are/may be whitelisted.
					});
app.u.dump(" -> sfo: "); app.u.dump(sfo);
				return sfo;
				} //adminGiftcardMacro			
			
			},

		e : {



			"bossUserCreateShow" : function($ele,p){

				var $D = app.ext.admin.i.dialogCreate({
					'title' : 'Create New User',
					'templateID':'userManagerUserCreateUpdateTemplate',
					'data':$ele.data(),
					'extendByDatapointers' : ['bossRoleList']
					});
//create and update share a template.  The inputs below are for the callback.
				$('form',$D).append("<input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/restoreInputsFromTrackingState' value='1' /><input type='hidden' name='_tag/jqObjEmpty' value='true' /><input type='hidden' name='_tag/message' value='The user has been created.' /><input type='hidden' name='_macrobuilder' value='admin_user|bossUserCreate' />");

				$('form',$D).append("<div class='buttonset alignRight'><button data-app-click='admin|submitForm' class='applyButton' data-text='true' data-icon-primary='ui-icon-circle-plus'>Create User</button></div>");

				app.u.handleButtons($D.anydelegate());
				$D.dialog('open');
				$("[data-app-role='roleListTbody']",$D).sortable();
				},



//on a user update, only the fields that have changed are sent and roles are always sent.
// so the form object is serialized for validation, but not sent.
			"bossUserUpdateSave" : function($btn)	{
				$btn.button();
				$btn.off('click.bossUserUpdateSave').on('click.bossUserUpdateSave',function(event){
					event.preventDefault();
					app.u.dump("BEGIN admin_user.e.bossUserUpdateSave");
					var $panel = $btn.closest('.ui-widget-anypanel'),
					frmObj = $btn.closest('form').serializeJSON();
					
					if($panel.length == 0)	{app.u.throwGMessage("In admin_user.e.bossUserUpdateSave, unable to determine $panel [$panel.length = "+$panel.length+"].");}
					else if($.isEmptyObject(frmObj))	{app.u.throwGMessage("In admin_user.e.bossUserUpdateSave, the serialized form object was empty.");}
					else if(!frmObj.email || !frmObj.fullname )	{
						var msg = 'Please populate the following fields:<ol>';
						if(!frmObj.email)	{msg += "<li>email<\/li>"}
						if(!frmObj.fullname)	{msg += "<li>fullname<\/li>"}
						msg += "<\/ol>";
						var msgObj = app.u.errMsgObject(msg);
						app.u.throwMessage(msgObj,true);
						}
					else	{
//						app.u.dump(" -> frmObj: "); app.u.dump(frmObj);
						var update = {};
						update.login = frmObj.login; //for now, set both luser and login. Eventually, we'll use one or the other.
						update.luser = frmObj.login;

						update['@roles'] = app.ext.admin_user.u.getRoleCheckboxesAsArray($panel);
//add all CHANGED attributes to the update object.
						$(".edited",$panel).each(function(){
							update[$(this).attr('name')] = $(this).val();
							});

//the call will return a 1 if it's going to request and a zero if an error occured. only proceed if no errors.
						if(app.ext.admin.calls.bossUserUpdate.init(update,{},'immutable'))	{
							$('body').showLoading({'message':'Saving your changes for '+update.login});

//to ensure new copies of the data, destroy the old.						
							app.model.destroy('bossUserList');
							app.model.destroy('bossUserDetail|'+update.luser);

							app.ext.admin.calls.bossUserDetail.init(update.luser,{},'immutable');
							app.ext.admin.calls.bossUserList.init({
								'callback': function(rd)	{
									$('body').hideLoading();
									if(app.model.responseHasErrors(rd)){
										app.u.throwMessage(rd);
										}
									else	{
										app.ext.admin_user.u.resetUsersTable();  //empty list of users so that changes are reflected.
										$panel.anypanel('destroy');
										$("[data-luser='"+update.luser+"'] .editUser",'#userManagerContent').trigger('click');
										}
									}},'immutable');
							app.model.dispatchThis('immutable');
							}
						else	{} //error handling handled by call in if statement.
						}
					
					});
				}, //bossUserUpdateSave


			
			"bossUserDetail" : function($btn){
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false}); //ui-icon-pencil
				$btn.addClass('editUser'); //used for triggering click after user update.
				$btn.off('click.bossUserUpdate').on('click.bossUserUpdate',function(event){
					event.preventDefault();
//					app.u.dump("BEGIN admin_user.e.bossUserUpdate click event");

					var $target = $("[data-app-role='dualModeDetail']","#userManagerContent"),
					index = $(this).closest('tr').data('obj_index');
					user = app.data.bossUserList['@USERS'][index];
					user['@ROLES'] = {};

					$.extend(user['@ROLES'],app.data.bossRoleList['@ROLES']);

//					app.u.dump(" -> user object["+index+"]: "); app.u.dump(user);
					if(!$.isEmptyObject(user))	{
					//see bossUserCreateUpdateSave app event to see what usermode is used for.

var panelID = app.u.jqSelector('','userDetail_'+user.luser),
$panel = $("<div\/>").data('luser',user.luser).hide().anypanel({
	'header':'Edit: '+user.luser,
	'templateID':'userManagerUserCreateUpdateTemplate',
//	'data':user, //data not passed because it needs req and manipulation prior to translation.
	'dataAttribs': {'id':panelID,'luser':user.luser,'usermode':'update'}
	}).prependTo($target);

$('.passwordContainer',$panel).append("<div class='hint'>leave password blank for no change<\/div>"); //password not editable from here.

//adds the save button to the bottom of the form. not part of the template because the template is shared w/ create.
var $saveButton = $("<button \/>").attr('data-app-event','admin_user|bossUserUpdateSave').html("Save <span class='numChanges'></span> Changes").button({'disabled':true});

$('form',$panel).append($saveButton);
app.ext.admin.u.handleAppEvents($panel);

		$panel.showLoading({'message':'Gathering nuts, berries and user details.'});
		$panel.slideDown('fast');


if(app.ext.admin.calls.bossUserDetail.init(user.luser,{
	'callback':function(rd){
//		app.u.dump("BEGIN admin_user.e.bossUserUpdate anonymous callback");
//		app.u.dump(" -> panelID: "+panelID);
//		app.u.dump(" -> user.luser: "+user.luser);
		if(app.model.responseHasErrors(rd)){
			app.u.throwMessage(rd);
			}
		else	{		
			
			var userData = $.extend(app.data[rd.datapointer],app.data.bossRoleList);
			
//			app.u.dump(" -> userData:"); app.u.dump(userData);
			app.renderFunctions.translateSelector('#'+panelID,userData);
//the list is already sortable by an app event. this just makes sure a change in role order increments # of changes and allows a save.
			$("[data-app-role='roleList']",$panel).on("sortupdate",function(evt,ui){
				ui.item.find(':checkbox').addClass('edited');
				$('.numChanges',$panel).text($(".edited",$panel).length);
				$saveButton.button('enable').addClass('ui-state-highlight');
				});

			$(":input",$panel).off('change.trackChange').on('change.trackChange',function(){
				$(this).addClass('edited');
				$('.numChanges',$panel).text($(".edited",$panel).length);
				$saveButton.button('enable').addClass('ui-state-highlight');
				});
			$("[name='login']",$panel).attr('readonly','readonly').css({'border':'none','background':'none'}); //NOTE - if attr disabled is set, serializeJSON does NOT include that field.
			var L = userData['@roles'].length;
//loop backwards so that each row can be moved to the top but the original order will be preserved.
			for(var i = (L-1); i >= 0; i -= 1)	{
//				app.u.dump(" -> userData['@roles'][i]: "+userData['@roles'][i]);
				$("[name='"+userData['@roles'][i]+"']",$panel).attr('checked','checked');
				$("[name='"+userData['@roles'][i]+"']",$panel).closest('tr').insertBefore($("[data-app-role='roleList'] > tbody > tr:first",$panel)); //move checked roles to top of list.
				}
			$panel.hideLoading();
			}
		}
	},'mutable'))	{
//showloading is run AFTER the animation so that it places itself correctly over the target.
		app.model.dispatchThis('mutable');
		}
	else	{
//no dispatch is occuring. Don't do a showLoading cuz the data will be added immediately.
		$panel.slideDown('fast');
		}

						}
//append detail children before changing modes. descreases 'popping'.
					app.ext.admin.u.toggleDualMode($('#userManagerContent'),'detail');

					});
				},
			
			"bossUserDelete" : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.bossUserCreate').on('click.bossUserCreate',function(event){
					event.preventDefault();
					var data = $(this).closest('tr').data(),
					$D = $("<div \/>").attr('title','Delete User').append("Are you sure you want to delete user <b>"+(data.fullname || data.luser)+"<\/b>? This action can not be undone.");

					$D.dialog({
resizable: false,
modal: true,
buttons: {
	"Delete User": function() {
		$D.dialog('close');
		$('body').showLoading({'message':'Deleting User'});
		app.model.destroy('bossUserList'); //clear local so a dispatch occurs.
		app.ext.admin.calls.bossUserDelete.init(data.luser,{},'immutable');
		app.ext.admin.calls.bossUserList.init({'callback':function(rd){
			if(app.model.responseHasErrors(rd)){
				app.u.throwMessage(rd);
				}
			else	{
				app.ext.admin_user.u.resetUsersTable();  //empty list of users so that changes are reflected.
				}
			$('body').hideLoading();
			}},'immutable');
		app.model.dispatchThis('immutable');
		},
	Cancel: function() {$( this ).dialog( "close" ).empty().remove();}
	}
        });
					});
				
				}
			

			}
		} //r object.
	return r;
	}