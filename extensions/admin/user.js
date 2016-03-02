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





var admin_user = function(_app) {
	var theseTemplates = new Array('userManagerUserRowTemplate','userManagerRoleRowTemplate','userManagerUserCreateUpdateTemplate');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				// _app.model.fetchNLoadTemplates(_app.vars.baseURL+'extensions/admin/user.html',theseTemplates);
				_app.rq.push(['css',0,_app.vars.baseURL+'extensions/admin/user.css','user_styles']);

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				_app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {

			showUserManager : function($target)	{
				_app.u.dump("BEGIN admin_user.a.showUserManager 2.0");
				var $DMI = _app.ext.admin.i.DMICreate($target,{
					'header' : 'User Manager',
					'className' : 'userManager', //applies a class on the DMI, which allows for css overriding for specific use cases.
					'thead' : ['id','Username','Name','Email','Roles','Created',''], //leave blank at end if last row is buttons.
					'tbodyDatabind' : "var: tickets(@USERS); format:processList; loadsTemplate:userManagerUserRowTemplate;",
					'buttons' : [
						"<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh<\/button>",
						"<button class='applyButton' data-text='true' data-icon-primary='ui-icon-circle-plus' data-app-click='admin_user|bossUserCreateShow'>Create A New User</button>"],	
					'cmdVars' : {
						'_cmd' : 'bossUserList',
						'limit' : '50', //not supported for every call yet.
						'_tag' : {
							'datapointer':'bossUserList'
							}
						}
					});
				//only need to fetch the boss role list once. Doesn't change much.
				if(_app.data.bossRoleList)	{}
				else	{
					_app.model.addDispatchToQ({'_cmd':'bossRoleList','_tag':	{'datapointer' : 'bossRoleList'}},'mutable'); //have this handy.
					}
				_app.u.handleButtons($target.anyform({'trackEdits':true}));
				_app.model.dispatchThis('mutable');
				}			
				
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {}, //renderFormats

////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {


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
					_app.u.throwGMessage("In admin_users,u.getRoleCheckboxesAsArray, $parent not specified or does not exist on the DOM.");					
					}
				return roles;
				}

			}, //u

		macrobuilders : {

			'bossUserCreateUpdate' : function(sfo,$form)	{
				_app.u.dump("BEGIN admin_support.macrobuilders.bossUserCreate");
				sfo['@roles'] = _app.ext.admin_user.u.getRoleCheckboxesAsArray($form);
//asdf				sfo._cmd = "bossUserCreate"
//clean up sfo to minimize the request.
				$(":checkbox",$form).each(function(){
					delete sfo[$(this).attr('name')]; //remove from serialized form object. params are/may be whitelisted.
					});
				return sfo;
				} //adminGiftcardMacro			
			
			},

		e : {



			bossUserCreateShow : function($ele,p){

				var $D = _app.ext.admin.i.dialogCreate({
					'title' : 'Create New User',
					'templateID':'userManagerUserCreateUpdateTemplate',
					'data':$ele.data(),
					'extendByDatapointers' : ['bossRoleList']
					});
//create and update share a template.  The inputs below are for the callback.
				$('form',$D).append("<input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' /><input type='hidden' name='_cmd' value='bossUserCreate' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/restoreInputsFromTrackingState' value='1' /><input type='hidden' name='_tag/jqObjEmpty' value='true' /><input type='hidden' name='_tag/message' value='The user has been created.' /><input type='hidden' name='_macrobuilder' value='admin_user|bossUserCreateUpdate' />");

				$('form',$D).append("<div class='buttonset alignRight'><button data-app-click='admin|submitForm' class='applyButton' data-text='true' data-icon-primary='ui-icon-circle-plus'>Create User</button></div>");

				_app.u.handleButtons($D.anyform());
				$D.dialog('open');
				$("[data-app-role='roleListTbody']",$D).sortable();
				},


			bossUserDetailShow : function($ele,p)	{
				
				var
					userID = $ele.closest("[data-uid]").data('uid'),
					luser = $ele.closest("[data-luser]").data('luser');
					
				if(userID && luser)	{

					var $panel = _app.ext.admin.i.DMIPanelOpen($ele,{
						'templateID' : 'userManagerUserCreateUpdateTemplate',
						'showLoading' : false,
						'panelID' : 'user_'+userID,
						'header' : 'Edit User: '+luser
						});
					$panel.showLoading({'message':'Fetching user details'}).attr({'data-uid':userID,'data-luser':luser});

					$('form',$panel).append("<input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' /><input type='hidden' name='_cmd' value='bossUserUpdate' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/restoreInputsFromTrackingState' value='1' /><input type='hidden' name='_tag/message' value='The user has been updated.' /><input type='hidden' name='_macrobuilder' value='admin_user|bossUserCreateUpdate' />");

					_app.model.addDispatchToQ({
						'_cmd':'bossUserDetail',
						'login':luser,
						'_tag':	{
							'callback' : 'anycontent',
							'datapointer' : 'bossUserDetail|'+userID,
							'onComplete': function(rd){
								//now handle role checkboxes.
								var userData = _app.data[rd.datapointer];
								var L = userData['@roles'].length;
							//loop backwards so that each row can be moved to the top but the original order will be preserved.
								for(var i = (L-1); i >= 0; i -= 1)	{
									$("[name='"+userData['@roles'][i]+"']",$panel).prop('checked','checked');
									$("[name='"+userData['@roles'][i]+"']",$panel).closest('tr').insertBefore($("[data-app-role='roleList'] > tbody > tr:first",$panel)); //move checked roles to top of list.
									}
//adds the save button to the bottom of the form. not part of the template because the template is shared w/ create.
								$("<button \/>").attr({'data-app-click':'admin|submitForm','data-app-role':'saveButton'}).append("Save <span class='numChanges'></span> Changes").button({'disabled':'disabled'}).appendTo($('form',$panel));
			
								$("[data-app-role='roleListTbody']",$panel).sortable({
									stop : function(event,ui)	{
										$(":checkbox",ui.item).addClass('edited');
										_app.u.dump(" -> ui.item.closest('.anyformEnabled').length: "+ui.item.closest('.anyformEnabled').length);
										ui.item.closest('.anyformEnabled').anyform('updateChangeCounts');
										}
									});
			
								$("[name='login']",$panel).attr('readonly','readonly').css({'border':'none','background':'none'}); //NOTE - if attr disabled is set, serializeJSON does NOT include that field.
								$("[name='password']",$panel).prop('required','').removeProp('required');
								$('.passwordContainer',$panel).append("<div class='hint'>leave password blank for no change<\/div>"); //password not editable from here.
								},
							'translateOnly' : true,
							'jqObj' : $panel,
							'extendByDatapointers' : ['bossRoleList']
							}
						},'mutable');
					_app.model.dispatchThis('mutable');
					}
				else	{
					//missing some required params. throw error.
					$('#globalMessaging').anymessage({"message":"In admin_user.e.bossUserDetailShow, either user "+luser+" or uid "+userID+" not found and both are required.","gMessage":true});
					}
				},

			bossUserDeleteConfirm : function($ele,p)	{
				var luser = $ele.closest("[data-luser]").data('luser');
				if(luser)	{
					var $D = _app.ext.admin.i.dialogConfirmRemove({
						"message" : "Are you sure you wish to delete user "+luser+"? There is no undo for this action.",
						"removeButtonText" : "Remove User", //will default if blank
						"title" : "Remove user: "+luser, //will default if blank
						"removeFunction" : function(vars,$D){
							$D.showLoading({"message":"Deleting user "+luser});
							_app.model.addDispatchToQ({
								'_cmd':'bossUserDelete',
								'login' : luser,
								'_tag':	{
									'callback':function(rd){
										$D.hideLoading();
										if(_app.model.responseHasErrors(rd)){
											$D.anymessage({'message':rd});
											}
										else	{
											$D.dialog('close');
											$ele.closest("[data-app-role='dualModeContainer']").find("[data-app-click='admin|refreshDMI']").trigger('click');
											}
										}
									}
								},'mutable');
							_app.model.dispatchThis('mutable');
							}
						})
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_users.e.bossUserDeleteConfirm, unable to ascertain L-user name.","gMessage":true});}
				} //bossUserDeleteConfirm
			} //E/events
		} //r object.
	return r;
	}