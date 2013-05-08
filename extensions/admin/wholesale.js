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
	var theseTemplates = new Array('organizationManagerPageTemplate','organizationManagerOrgCreateUpdateTemplate','organizationManagerOrgRowTemplate','wholesaleSupplierAddTemplate','wholesaleSupplierManagerTemplate','wholesaleSupplierListTemplate','wholesaleSupplierUpdateTemplate');
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
			
			
			showOrganizationManager : function($target)	{
				app.u.dump("BEGIN admin_wholesale.a.showOrganizationManager");
				app.ext.admin.calls.adminWholesaleScheduleList.init({},'mutable'); //need this for add and edit.
				if($target && $target.length)	{
					$target.empty();
					$target.anycontent({'templateID':'organizationManagerPageTemplate','data':{}});
					app.u.handleAppEvents($target);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_wholesale.a.showOrganizationManager, $target either not specified or has not length.','gMessage':true});
					}
				
				}, //showSupplierManager
			
			showOrganizationEditor : function($target,vars)	{
				app.u.dump("BEGIN admin_wholesale.a.showOrganizationEditor");
				if($target && vars && vars.orgID)	{
					$target.empty();
					$target.showLoading({'message':'Fetching Data for Organization '+vars.orgID});
					app.ext.admin.calls.adminWholesaleScheduleList.init({},'mutable');
					app.ext.admin.calls.adminCustomerOrganizationDetail.init(vars.orgID,{'callback':function(rd){
						$target.hideLoading();
						if(app.model.responseHasErrors(rd)){$target.anymessage({'message':rd})}
						else	{
							$target.anycontent({'templateID':'organizationManagerOrgCreateUpdateTemplate',datapointer:rd.datapointer});
							$('form',$target).data('orgid',vars.orgID);
							$("input",$target).each(function(){
								var $input = $(this);
								$input.attr('title',$input.attr('placeholder')); //add the placeholder of the input as the title so mouseover is indicative of what the field wants.
								if($input.is(':checkbox'))	{
									$input.anycb();
									}
								});
							$('.buttonset',$target).append("<button data-app-event='admin_wholesale|execOrganizationUpdate'>Save Changes</button>");
							app.u.handleAppEvents($target);
							}
						}},'mutable');
					app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_wholesale.e.showOrganizationUpdate, unable to determine orgID.','gMessage':true});
					}
				},
			
			//smTarget (supply manager target) is the jquery object of where it should be placed, ususally a tab.
			showSupplierManager : function($smTarget)	{
				$smTarget.showLoading({'message':'Fetching supplier list'});
				
				app.ext.admin.calls.adminSupplierList.init({'callback':function(rd){
					$smTarget.hideLoading();
					if(app.model.responseHasErrors(rd)){$smTarget.anymessage({'message':rd})}
					else	{
						$smTarget.anycontent({'templateID':'wholesaleSupplierManagerTemplate','datapointer':rd.datapointer});
						app.ext.admin.u.handleAppEvents($smTarget);
						$("[data-app-role='wholesaleSupplierList']",$smTarget).anytable();
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
				app.ext.admin.calls.adminWholesaleScheduleList.init({'callback':function(rd)	{
					if(app.model.responseHasErrors(rd)){$smTarget.anymessage({'message':'An unknown error occured and the list of pricing schedules could not be obtained. Add the schedule in the organization editor at a later time. Sorry for any inconvenience.'})}
					$wm.empty().dialog('open').anycontent({'templateID':'wholesaleSupplierAddTemplate','showLoading':false});
					app.ext.admin.u.handleAppEvents($wm,optParams);
					}},'mutable');
				} //showSupplierCreateModal

			}, //a [actions]

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			wholesaleScheduleSelect : function($tag,data)	{
				if(!app.data.adminWholesaleScheduleList)	{$tag.anymessage({'message':'Unable to fetch wholesale list'})}
				else if(!app.data.adminWholesaleScheduleList['@SCHEDULES'])	{
					$tag.anymessage({'message':'You have not created any schedules yet.'})
					}
				else if(!data.value)	{$tag.anymessage({'message':'No data passed into wholesaleScheduleSelect renderFormat'})}
				else	{
					var $select = $("<select \/>",{'name':'SCHEDULE'}),
					schedules =app.data.adminWholesaleScheduleList['@SCHEDULES'], //shortcut
					L = app.data.adminWholesaleScheduleList['@SCHEDULES'].length
					list = null;
					$select.append($("<option \/>",{'value':''}).text('none'));
					for(var i = 0; i < L; i += 1)	{
						$select.append($("<option \/>",{'value':schedules[i].id}).text(schedules[i].id));
						}
					
					$select.appendTo($tag);
					if(data.value.ORG && data.value.ORG.SCHEDULE)	{$select.val(data.value.ORG.SCHEDULE)} //preselect schedule, if set.

					}
				} //wholesaleScheduleSelect
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
					if(app.u.validateForm($form))	{
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
				$btn.off('click.showSupplierCreate').on('click.showSupplierCreate',function(event){
					event.preventDefault();
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
				
				$btn.off('click.showSupplierItemList').on('click.showSupplierItemList',function(event){
					event.preventDefault();
					app.ext.admin.calls.adminSupplierItemList.init($btn.closest("[data-code]").data('code'),{},'mutable');
					app.model.dispatchThis('mutable');
					});
				}, //showSupplierItemList

			showSupplierOrderList : function($btn)	{
				
				$btn.off('click.showSupplierItemList').on('click.showSupplierItemList',function(event){
					event.preventDefault();
					var vendorID = $btn.closest("[data-code]").data('code');
					
					if(vendorID)	{
						app.ext.admin.calls.adminSupplierOrderList.init({'VENDORID':vendorID,'FILTER':'RECENT'},{'callback':function(rd){
							if(app.model.responseHasErrors(rd)){$('#globalMessaging').anymessage({'message':rd})}
							else	{
								var $D = $("<div \/>").attr({'title':"Order list for vendor "+vendorID,'id':rd.datapointer});
								$D.anycontent({datapointer:rd.datapointer,'templateID':'supplierOrderViewTemplate'});
								$D.appendTo('body');
								}
							}},'mutable');
						app.model.dispatchThis('mutable');
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_wholesale.e.showSupplierOrderList, unable to determine vendorID.','gMessage':true})
						}
					});
				},

			showMediaLib4OrganizationLogo : function($ele)	{
				$ele.off('click.mediaLib').on('click.mediaLib',function(event){
					event.preventDefault();
					var $context = $ele.closest('fieldset');
					mediaLibrary($("[data-app-role='organizationLogo']",$context),$("[name='LOGO']",$context),'Choose Dropship Logo');
					});
				},


			execOrganizationSearch : function($btn){
				
				$btn.button({icons: {primary: "ui-icon-search"},text: true});
				$btn.off('click.execOrganizationCreate').on('click.execOrganizationCreate',function(event)	{
					event.preventDefault();
					$('.dualModeListMessaging').empty(); //clear existing messaging.
					var
						$form = $btn.closest('form'),
						sfo = $form.serializeJSON(),
						$dualModeContainer = $form.closest("[data-app-role='dualModeContainer']"),
						$table = $("[data-app-role='dualModeListContents']",$dualModeContainer).closest('table');
					
					$("[data-app-role='dualModeResultsTable']",$dualModeContainer).show();
					$("[data-app-role='dualModeDetailContainer']",$dualModeContainer).hide();
					
					if(sfo && sfo.keywords != '' && sfo.searchby)	{
//						app.u.dump(" -> sfo: "); app.u.dump(sfo);
						$('tbody',$table).empty(); //clear previous search results.
						$dualModeContainer.showLoading("Searching organizations by "+sfo.searchby+" for "+sfo.keywords);
						
						sfo[sfo.searchby] = sfo.keywords;
						delete sfo.keywords; delete sfo.searchby; //sanitize before sending to API.
						
						app.ext.admin.calls.adminCustomerOrganizationSearch.init(sfo,{'callback':function(rd){
							$dualModeContainer.hideLoading();

							if(app.model.responseHasErrors(rd)){$form.anymessage({'message':rd})}
							else if(app.data[rd.datapointer] && app.data[rd.datapointer]['@ORGANIZATIONS'].length === 0){
								$('.dualModeListMessaging').anymessage({'message':'There were no results for your search.'}); //clear existing messaging.
								}
							else	{
								$table.show();
								$table.anycontent({'datapointer':rd.datapointer});
								$table.anytable();
								app.u.handleAppEvents($table,{'$context':$dualModeContainer});
								}

							}},'mutable');
						app.model.dispatchThis();
						}
					else if (!sfo)	{
						$('#globalMessaging').anymessage({'message':'In admin_wholesale.e.execOrganizationSearch, unable to find form OR to serialize as JSON.','gMessage':true});
						}
					else	{
						$('#globalMessaging').anymessage({'message':'Either keywords ['+sfo.keywords+'] or searchby ['+sfo.searchby+'] left blank.'});
						}
					
					
					});
				},

			execOrganizationRemove : function($btn)	{
				
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.execOrganizationRemove').on('click.execOrganizationRemove',function(event){
					event.preventDefault();
					var
						$D = $("<div \/>").attr('title',"Permanently Remove Organization"),
						orgID = $btn.closest('tr').data('orgid');

					$D.append("<P>Are you sure you want to delete this organization? There is no undo for this action.<\/P>");
					$D.addClass('displayNone').appendTo('body'); 
					$D.dialog({
						modal: true,
						autoOpen: false,
						close: function(event, ui)	{
							$(this).dialog('destroy').remove();
							},
						buttons: [ 
							{text: 'Cancel', click: function(){$D.dialog('close')}},
							{text: 'Delete Organization', click: function(){
								$D.parent().showLoading({"message":"Deleting Organization..."});
								app.model.destroy('adminCustomerOrganizationDetail|'+orgID); //nuke this so the org editor can't be opened for a nonexistant org.
								app.ext.admin.calls.adminCustomerOrganizationRemove.init(orgID,{'callback':function(rd){
									$D.parent().hideLoading();
									if(app.model.responseHasErrors(rd)){$D.anymessage({'message':rd})}
									else	{
										$D.anymessage(app.u.successMsgObject('The organization has been removed.'));
										$btn.closest('tr').empty().remove(); //remove row in results list.
										$D.dialog( "option", "buttons", [ {text: 'Close', click: function(){$D.dialog('close')}} ] );
										}
									}},'immutable');
								app.model.dispatchThis('immutable');
								}}	
							]
						});
					$D.dialog('open');
					})
				},

			execOrganizationUpdate : function($btn)	{
				$btn.button();
				$btn.off('click.execOrganizationUpdate').on('click.execOrganizationUpdate',function(event){
					event.preventDefault();
					var
						$form = $btn.closest('form'),
						sfo = $form.serializeJSON();
					
					$form.showLoading({'message':'Saving Changes'});
					sfo.ORGID = $form.data('orgid');
					if(sfo.DOMAIN)	{
						sfo.DOMAIN = app.u.getDomainFromURL(sfo.DOMAIN); //cleans off protocol and www.
						}
//checkbox values need to be set as 1/0, not ON/OFF
					$(':checkbox',$form).each(function(){
						var $CB = $(this);
						sfo[$CB.attr('name')] = ($CB.is(':checked')) ? 1 : 0;
						});


					app.model.destroy('adminCustomerOrganizationDetail|'+sfo.ORGID)
					app.ext.admin.calls.adminCustomerOrganizationUpdate.init(sfo,{'callback':function(rd){
						$form.hideLoading();
						if(app.model.responseHasErrors(rd)){$form.anymessage({'message':rd})}
						else	{
							$form.anymessage(app.u.successMsgObject('Your changes have been saved.'));
							}
						}},'immutable');
					app.model.dispatchThis('immutable');
					});
				},

			showOrganizationUpdate : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				$btn.off('click.showOrganizationUpdate').on('click.showOrganizationUpdate',function(event){
					event.preventDefault();
					app.u.dump('showOrganizationUpdate has been triggered.');
					var
						$dualModeContainer = $btn.closest("[data-app-role='dualModeContainer']"),
						orgID = $btn.closest('tr').data('orgid');
					
					app.u.dump('vars have been defined');

					$("[data-app-role='dualModeResultsTable']",$dualModeContainer).hide();
					$("[data-app-role='dualModeDetailContainer']",$dualModeContainer).show();
					app.u.dump('results/content area display changes have occured.');
					app.ext.admin_wholesale.a.showOrganizationEditor($("[data-app-role='dualModeDetailContainer']",$dualModeContainer),{'orgID':orgID});
					app.u.dump('showOrganizationEditor has executed.');
					});
				},
//triggered within the organization create modal when save is pushed.
			execOrganizationCreate : function($btn){
				$btn.button();
				$btn.off('click.execOrganizationCreate').on('click.execOrganizationCreate',function(event)	{
					event.preventDefault();
					var
						$form = $btn.closest('form'),
						sfo = $form.serializeJSON();
					
					if(app.u.validateForm($form))	{

						$form.showLoading({'message':'Creating New Organization'});

						if(sfo.DOMAIN)	{
							sfo.DOMAIN = app.u.getDomainFromURL(sfo.DOMAIN); //cleans off protocol and www.
							}
							
//checkbox values need to be set as 1/0, not ON/OFF
						$(':checkbox',$form).each(function(){
							var $CB = $(this);
							sfo[$CB.attr('name')] = ($CB.is(':checked')) ? 1 : 0;
							});
						
						app.ext.admin.calls.adminCustomerOrganizationCreate.init(sfo,{callback : function(rd){
							$form.hideLoading();
							if(app.model.responseHasErrors(rd)){$form.anymessage({'message':rd})}
							else	{
								$form.empty().anymessage(app.u.successMsgObject('The organization has been created.'));
//								$form.append("<button>Close Window<\/button><button>Edit Organization<\/button><button>Add New Organization<\/button>");
								}
							}},'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{} //form validation handles error display.
					});
				},

//triggered in the editor to show the organiation create form/modal.
			showOrganizationCreate : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-circle-plus"},text: true});
				$btn.off('click.showOrganizationCreate').on('click.showOrganizationCreate',function(event){
					event.preventDefault();

//by now, we know we have a valid mode and if that mode is edit, uuid is set.
					var $D = $("<div \/>").attr('title',"Add a New Organization");
//guid created at time modal is open. that way the guid of an edit can be added in same way and save button won't care if it's an edit or add.
					$D.addClass('displayNone').appendTo('body'); 
//add the content prior to turning it into a dialog so that width is properly calculated
					$D.anycontent({'templateID':'organizationManagerOrgCreateUpdateTemplate','data':{}});
					$D.dialog({
						modal: true,
						width:  '90%',
						autoOpen: false,
						close: function(event, ui)	{
							$(this).dialog('destroy').remove();
							}
						});
					$D.dialog('open');

					$("input",$D).each(function(){
						var $input = $(this);
						$input.attr('title',$input.attr('placeholder')); //add the placeholder of the input as the title so mouseover is indicative of what the field wants.
						if($input.is(':checkbox'))	{
							$input.parent().anycb({text : {'on':'yes','off':'no'}});
							}
						});
					$('.buttonset',$D).append("<button data-app-event='admin_wholesale|execOrganizationCreate'>Create Organization</button>");
					app.u.handleAppEvents($D);
					
					});
				}
			} //e [app Events]

		} //r object.
	return r;
	}