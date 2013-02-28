/* **************************************************************

   Copyright 2013 Zoovy, Inc.

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




var admin_wholesale = function() {
	var theseTemplates = new Array('wholesaleSupplierAddTemplate','wholesaleSupplierManagerTemplate','wholesaleSupplierListTemplate');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/wholesale.html',theseTemplates);
				var $wm = $("<div \/>",{'id':'wholesaleModal'}).appendTo('body'); //a recycleable element for modals.
				$wm.dialog({'autoOpen':false,'modal':true,'width':500,'height':500});
				
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION [a]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
			//smTarget (supply manager target) is the jquery object of where it should be placed, ususally a tab.
			showSupplierManager : function($smTarget)	{
				$smTarget.showLoading({'message':'Fetching supplier list'});
				
				app.ext.admin.calls.adminSupplierList.init({'callback':function(rd){
					$smTarget.hideLoading();
					if(app.model.responseHasErrors(rd)){$smTarget.anymessage({'message':rd})}
					else	{
						$smTarget.anycontent({'templateID':'wholesaleSupplierManagerTemplate','datapointer':rd.datapointer});
						app.ext.admin.u.handleAppEvents($smTarget);
						$("[app-data-role='wholesaleSupplierList']",$smTarget).anytable();
						}
					}},'mutable');
				app.model.dispatchThis('mutable');
				
				
				}, //showSupplierManager
			
			showSupplierEditor : function($editorContainer,SID) {
				if($editorContainer && SID)	{
					app.ext.admin.calls.adminSupplierDetail.init(SID,{},'mutable');
					app.model.dispatchThis('mutable');
/*
//make into anypanels.
	$("div.panel",$custEditorTarget).each(function(){
		var PC = $(this).data('app-role'); //panel content (general, wholesale, etc)
		$(this).data('cid',obj.CID).anypanel({'wholeHeaderToggle':false,'showClose':false,'state':'persistent','extension':'admin_customer','name':PC,'persistent':true});
		})
*/
					}
				else	{
					$("#globalMessaging").anymessage({'message':'In admin_wholesale.a.showSupplierEditor, either $editorContainer ['+typeof $editorContainer+'] or SID ['+SID+'] undefined','gMessage':true});
					}
				}, //showSupplierEditor

//optParams = optional paramaters that will be passed into the app events.
//$context is used from the editor so that, on save, the list of suppliers is updated.
//potentially allows for a custom callback if we ever need the add supplier button someplace else.
			showSupplierCreateModal : function(optParams){
				var $wm = $('#wholesaleModal'),
				optParams = optParams || {}; //optional params dumped into app events. allows for parent form of editor to be passed into modal.
				$('.ui-dialog-title',$wm.parent()).text('Add New Supplier');
				$wm.empty().dialog('open').anycontent({'templateID':'wholesaleSupplierAddTemplate','showLoading':false});
				app.ext.admin.u.handleAppEvents($wm,optParams);
				} //showSupplierCreateModal
			}, //a [actions]

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {

			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			}, //u [utilities]

////////////////////////////////////   EVENTS [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\                    

		e : {

//executed within the create new supplier form. actually creates the new supplier.
			execSupplierCreate : function($btn,obj)	{
				$btn.button();
				$btn.off('click.execSupplierCreate').on('click.execSupplierCreate',function(){
					var $form = $btn.closest('form'),
					formObj = $form.serializeJSON();
					formObj.CODE = formObj.CODE.toUpperCase(); //codes are all uppercase.
					if(app.ext.admin.u.validateForm($form))	{
						$('body').showLoading({'message':'Adding new supplier '+formObj.CODE});
						app.model.destroy('adminSupplierList');

//Attempt to create new user and update the modal w/ appropriate messaging.
						app.ext.admin.calls.adminSupplierCreate(formObj,{'callback':function(rd){
							$('body').hideLoading();
							if(app.model.responseHasErrors(rd)){$smTarget.anymessage({'message':rd})}
							else	{
								$form.parent().empty().anymessage({'message':'Thank you, supplier '+formObj.CODE+' has been created.','iconClass':'ui-icon-z-success'})
								}
							}},'immutable');

//if we have a context for the supplier manager, update the list of suppliers.
						if(obj && obj['$context'])	{
							app.ext.admin.calls.adminSupplierList({'callback':function(rd){
								if(app.model.responseHasErrors(rd)){$smTarget.anymessage({'message':rd})}
								else	{
//refresh the entire manager. it won't re-request the supplier list, it'll use what's in memory.
									obj['$context'].empty();
									app.ext.admin_wholesale.a.showSupplierManager(obj['$context']);
									}
								}},'immutable');
							}
						
						app.model.dispatchThis('immutable');
						
						}
					else	{
						//validator handles errors.
						}
					});
				
				}, //execSupplierCreate

//executed from within the 'list' mode (most likely) and will prompt the user in a modal to confirm, then will delete the user */
			execSupplierDelete : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-circle-close"},text: false});
				$btn.off('click.execSupplierDelete').on('click.execSupplierDelete',function(){
					var $wm = $('#wholesaleModal'),
					$row = $btn.closest('tr');

					$wm.dialog('open');
					$('.ui-dialog-title',$wm.parent()).text('Delete Supplier!');
						
					if($row.data('code'))	{
						$wm.empty().html("<p class='clearfix marginBottom'>Are you sure you want to delete supplier $row.data('code')? there is no undo for this action.<\/p>");
						$("<button \/>").text("Cancel").addClass('floatLeft').button().on('click',function(){$wm.dialog('Cancel')}).appendTo($wm);
						$("<button \/>").text("Delete Supplier").addClass('floatLeft ui-state-error').button().on('click',function(){
							
							$('body').showLoading({"message":"Removing supplier and fetching updated supplier list"});
							
							app.ext.admin.calls.adminSupplierRemove($row.data('code'),{callback : function(rd){}},'immutable');
							app.model.destroy('adminSupplierList');
							app.ext.admin.calls.adminSupplierList({'callback':function(rd){
								$('body').hideLoading();
//clear the supplier manager even if the call fails. Otherwise, the removed supplier will still be in the list.
								var $supplierEditorParent = $btn.closest("[data-app-role='supplierManager']").parent();
								$supplierEditorParent.empty();
								if(app.model.responseHasErrors(rd)){$smTarget.anymessage({'message':rd})}
								else	{
//refresh the entire manager. it won't re-request the supplier list, it'll use what's in memory.
									app.ext.admin_wholesale.a.showSupplierManager($supplierEditorParent);
									}
								}},'immutable');
							}).appendTo($wm);
						}

					}); //$btn.on
				}, //execSupplierDelete

//applied to 'create user' button. just opens the modal.
			showSupplierCreate : function($btn)	{
				$btn.button();
				$btn.off('click.showSupplierCreate').on('click.showSupplierCreate',function(){
					app.ext.admin_wholesale.a.showSupplierCreateModal({"$context":$btn.closest("[data-app-role='supplierManager']").parent()});
					})
				},

//applied to 'edit user' button and the link in the list (name). opens the editor.
			showSupplierEditor : function($ele)	{
//event used both on the supplier 'name' and the edit button.
				if($ele.is('button'))	{
					$ele.button({icons: {primary: "ui-icon-pencil"},text: false});
					}
				$ele.off('click.showSupplierEditor').on('click.showSupplierEditor',function(){
					var $row = $ele.closest('tr');
					if($row.data('code'))	{
						var $editorContainer = $ele.closest("[data-app-role='soloModeContentContainer']");
						$editorContainer.empty();
						app.ext.admin_wholesale.a.showSupplierEditor($editorContainer,$row.data('code'));
						}
					else	{
						$("#globalMessaging").anymessage({'message':'In admin_wholesale.e.showSupplierEditor, unable to ascertain SID','gMessage':true});
						}
					});
				}
			} //e [app Events]

		} //r object.
	return r;
	}