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
	var theseTemplates = new Array('wholesaleSupplierAddTemplate','wholesaleSupplierManagerTemplate','wholesaleSupplierListTemplate','wholesaleSupplierUpdateTemplate');
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

			showSupplierEditor : function($editorContainer,VENDORID) {
				if($editorContainer && VENDORID)	{
					app.ext.admin.calls.adminSupplierDetail.init(VENDORID,{'callback':function(rd){

if(app.model.responseHasErrors(rd)){$editorContainer.anymessage({'message':rd})}
else	{
	$editorContainer.anycontent({'templateID':'wholesaleSupplierUpdateTemplate','datapointer':rd.datapointer,'dataAttribs':{'vendorid':VENDORID}});
	app.ext.admin.u.handleAppEvents($editorContainer);
	app.u.dump(" -> checkboxes.length: "+$("[type='checkbox']",$editorContainer).length);
	$("[type='checkbox']",$editorContainer).parent().anycb(); //anycb gets executed on the labels, not the checkbox.
	
//make into anypanels.
	$("div.panel",$editorContainer).each(function(){
		var PC = $(this).data('app-role'); //panel content (general, productUpdates, etc)
		$(this).data('vendorid',VENDORID).anypanel({'wholeHeaderToggle':false,'showClose':false,'state':'persistent','extension':'admin_wholesale','name':PC,'persistent':true});
		});

//make inputs 'know' when they've been added and update the button.
app.ext.admin.u.applyEditTrackingToInputs($editorContainer);

//make panels draggable
	var sortCols = $('.twoColumn').sortable({  
		connectWith: '.twoColumn',
		handle: 'h2',
		cursor: 'move',
		placeholder: 'placeholder',
		forcePlaceholderSize: true,
		opacity: 0.4,
//the 'stop' below is to stop panel content flicker during drag, caused by mouseover effect for configuration options.
		stop: function(event, ui){
			$(ui.item).find('h2').click();
			var dataObj = new Array();
			sortCols.each(function(){
				var $col = $(this);
				dataObj.push($col.sortable( "toArray",{'attribute':'data-app-role'} ));
				});
			app.ext.admin.u.dpsSet('admin_wholesale','editorPanelOrder',dataObj); //update the localStorage session var.
//			app.u.dump(' -> dataObj: '); app.u.dump(dataObj);
			}
		});


	}

						}},'mutable');
					app.model.dispatchThis('mutable');
/*

*/
					}
				else	{
					$("#globalMessaging").anymessage({'message':'In admin_wholesale.a.showSupplierEditor, either $editorContainer ['+typeof $editorContainer+'] or VENDORID ['+VENDORID+'] undefined','gMessage':true});
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

		buildMacros : {
			general : function($form)	{
				if($form)	{
					var formObj = $form.serializeJSON(),
					vendorID = $form.closest("[data-vendorid]").data('vendorid');
					
					$('input',$form).each(function(){
						var $ele = $(this);
						if($ele.is(':checkbox') && ($ele.is(':checked')))	{
							formObj[$ele.attr('name')] = 1;
							}
						else if($ele.is(':checkbox'))	{ //if it isn't checked, it's disabled.
							formObj[$ele.attr('name')] = 0;
							}
						else	{} //currently, only checkboxes need special treatment.
						});
					
					if(vendorID)	{
						macro = "COMPANYSET?"+decodeURIComponent($.param(formObj));
//						app.ext.admin.calls.adminSupplierUpdate.init(vendorID, [macro],{},'immutable');
						app.u.dump(macro);
						}
					else	{
						$form.anymessage({'message':'In admin_wholesale.e.execSupplierUpdate, unable to ascertain vendorID.','gMessage':true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_wholesale.buildMacros.general, $form not set or not a jquery object.","gMessage":true})
					}
				},
				
			shippingCalculations : function($form)	{
				
				},
			}, //buildMacros

////////////////////////////////////   EVENTS [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\                    

		e : {

//executed within the create new supplier form. actually creates the new supplier.
			execSupplierCreate : function($btn,obj)	{
				$btn.button();
				$btn.off('click.execSupplierCreate').on('click.execSupplierCreate',function(){
					var $form = $btn.closest('form'),
					formObj = $form.serializeJSON();
					formObj.VENDORID = formObj.VENDORID.toUpperCase(); //codes are all uppercase.
					if(app.ext.admin.u.validateForm($form))	{
						$('body').showLoading({'message':'Adding new supplier '+formObj.VENDORID});
						app.model.destroy('adminSupplierList');

//Attempt to create new user and update the modal w/ appropriate messaging.
						app.ext.admin.calls.adminSupplierCreate(formObj,{'callback':function(rd){
							$('body').hideLoading();
							if(app.model.responseHasErrors(rd)){$smTarget.anymessage({'message':rd})}
							else	{
								$form.parent().empty().anymessage({'message':'Thank you, supplier '+formObj.VENDORID+' has been created.','iconClass':'ui-icon-z-success'})
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

			execSupplierUpdate : function($btn)	{
				$btn.button();
				$btn.button('disable');
				$btn.off('click.execSupplierUpdate').on('click.execSupplierUpdate',function(){
					var $form =  $btn.closest('form'),
					panel = $form.closest('.panel').data('app-role');
					
					if($form && panel)	{
		
						var formObj = $form.serializeJSON(),
						vendorID = $form.closest("[data-vendorid]").data('vendorid');
						
						$('input',$form).each(function(){
							var $ele = $(this);
							if($ele.is(':checkbox') && ($ele.is(':checked')))	{
								formObj[$ele.attr('name')] = 1;
								}
							else if($ele.is(':checkbox'))	{ //if it isn't checked, it's disabled.
								formObj[$ele.attr('name')] = 0;
								}
							else	{} //currently, only checkboxes need special treatment.
							});
						
						if(vendorID)	{
							macro = "COMPANYSET?"+decodeURIComponent($.param(formObj));
		//						app.ext.admin.calls.adminSupplierUpdate.init(vendorID, [macro],{},'immutable');
							app.u.dump(macro);
							}
						else	{
							$form.anymessage({'message':'In admin_wholesale.e.execSupplierUpdate, unable to ascertain vendorID.','gMessage':true});
							}



						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_wholesale.e.execSupplierUpdate, either $form or panel not set.'});
						}
					
					}); //$btn.on
				},

//apply to a select list and, on change, a corresponding fieldset will be turned on (and any other fieldsets will be turned off)
			showConnectorFieldset : function($select)	{
				
//change event toggles which panel is displayed.
				$select.off('change.showOrderFieldset').on('change.showConnectorFieldset',function(){
					$select.closest('.panel').find("[data-app-role='connectorFieldsetContainer'] fieldset").each(function(){
						var $fieldset = $(this);
//						app.u.dump(" -> $fieldset.data('app-role'): "+$fieldset.data('app-role'));
						if($select.val() == $fieldset.data('app-role'))	{$fieldset.show()}
						else	{$fieldset.hide();}
						})
					});
				$select.trigger('change');
				}, //showConnectorFieldset

//applied to 'create user' button. just opens the modal.
			showSupplierCreate : function($btn)	{
				$btn.button();
				$btn.off('click.showSupplierCreate').on('click.showSupplierCreate',function(){
					app.ext.admin_wholesale.a.showSupplierCreateModal({"$context":$btn.closest("[data-app-role='supplierManager']").parent()});
					})
				}, //showSupplierCreate

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
						$("#globalMessaging").anymessage({'message':'In admin_wholesale.e.showSupplierEditor, unable to ascertain VENDORID','gMessage':true});
						}
					});
				}, //showSupplierEditor

			showSupplierItemList : function($btn)	{
				
				$btn.off('click.showSupplierItemList').on('click.showSupplierItemList',function(){
					app.ext.admin.calls.adminSupplierItemList.init($btn.closest("[data-code]").data('code'),{},'mutable');
					app.model.dispatchThis('mutable');
					});
				}, //showSupplierItemList

			showSupplierOrderList : function($btn)	{
				
				$btn.off('click.showSupplierItemList').on('click.showSupplierItemList',function(){
					app.ext.admin.calls.adminSupplierOrderList.init({'VENDORID':$btn.closest("[data-code]").data('code'),'FILTER':'RECENT'},{},'mutable');
					app.model.dispatchThis('mutable');
					});
				}
			} //e [app Events]

		} //r object.
	return r;
	}