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
	var theseTemplates = new Array(
		'organizationManagerPageTemplate',
		'organizationManagerOrgCreateUpdateTemplate',
		'organizationManagerOrgRowTemplate'
/*		
		'supplierAddTemplate',
		'supplierManagerTemplate',
		'supplierListItemTemplate',
		'supplierUpdateTemplate',
		'supplierOrderListTemplate',
		'supplierOrderListItemTemplate'
*/		
		);
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
				app.u.dump('BEGIN admin_wholesale.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION [a]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
			
			showWarehouseManager : function($target)	{
				$target.empty();

				app.ext.admin.i.DMICreate($target,{
					'header' : 'Warehouse Manager',
					'className' : 'warehouseManager',
//add button doesn't use admin|createDialog because extra inputs are needed for cmd/tag and the template is shared w/ update.
					'buttons' : [
						"<button data-app-event='admin|refreshDMI'>Refresh Coupon List<\/button>",
						"<button data-app-event='admin_wholesale|warehouseCreateShow' data-title='Create a New Warehouse'>Add Warehouse</button>"
						],
					'thead' : ['ID','Code','Title','State','Zip','Latency','Cutoff','Created',''],
					'tbodyDatabind' : "var: users(@WAREHOUSES); format:processList; loadsTemplate:warehouseResultsRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminWarehouseList',
						'_tag' : {
							'datapointer':'adminWarehouseList'
							}
						}
					});
				app.model.dispatchThis('mutable');
				},

			
			showPriceSchedules : function($target)	{
				$target.empty();
				app.ext.admin.i.DMICreate($target,{
					'header' : 'Price Schedules',
					'className' : 'priceSchedules',
//add button doesn't use admin|createDialog because extra inputs are needed for cmd/tag and the template is shared w/ update.
					'buttons' : [
						"<button data-app-event='admin|refreshDMI'>Refresh Coupon List<\/button>",
						"<button data-app-event='admin_wholesale|priceScheduleCreateShow' data-title='Create a New Price Schedule'>Add New Schedule</button>"
						],
					'thead' : ['ID','Name','Currency','Discount',''],
					'tbodyDatabind' : "var: users(@SCHEDULES); format:processList; loadsTemplate:priceScheduleResultsRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminPriceScheduleList',
						'_tag' : {
							'datapointer':'adminPriceScheduleList'
							}
						}
					});
				app.model.dispatchThis('mutable');
				},
			
			
			showOrganizationManager : function($target,vars)	{
//				app.u.dump("BEGIN admin_wholesale.a.showOrganizationManager");
				vars = vars || {};
				app.ext.admin.calls.adminPriceScheduleList.init({},'mutable'); //need this for add and edit.
				if($target && $target.length)	{
					$target.empty();
					$target.anycontent({'templateID':'organizationManagerPageTemplate','data':{}});
					app.u.handleAppEvents($target);
					if(vars.searchby && vars.keywords)	{
						$("[name='searchby']",$target).val(vars.searchby);
						$("[name='keywords']",$target).val(vars.keywords);
						$("[data-app-event='admin_wholesale|execOrganizationSearch']",$target).trigger('click');
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_wholesale.a.showOrganizationManager, $target either not specified or has not length.','gMessage':true});
					}
				
				}, //showOrganizationManager
			
			showOrganizationEditor : function($target,vars)	{
				app.u.dump("BEGIN admin_wholesale.a.showOrganizationEditor");
				if($target && vars && vars.orgID)	{
					$target.empty();
					$target.showLoading({'message':'Fetching Data for Organization '+vars.orgID});
					app.ext.admin.calls.adminPriceScheduleList.init({},'mutable');
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
							$('.buttonset',$target).append("<button data-app-event='admin_wholesale|execOrganizationUpdate' data-app-role='saveButton'>Save Changes</button>");
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
			showSupplierManager : function($target)	{
				app.ext.admin.calls.adminPriceScheduleList.init({},'mutable'); //need this for create and update.
				app.ext.admin.i.DMICreate($target,{
					'header' : 'Supplier Manager',
					'className' : 'supplierManager',
//add button doesn't use admin|createDialog because extra inputs are needed for cmd/tag and the template is shared w/ update.
					'buttons' : [
						"<button data-app-event='admin|refreshDMI'>Refresh Supplier List<\/button>",
						"<button class='marginLeft' data-app-event='admin_wholesale|adminSupplierUnorderedItemListShow' data-mode='all'>Unordered Items</button>",
						"<button class='marginLeft' data-app-event='admin_wholesale|adminSupplierCreateShow'>Add Supplier</button>"
						],
					'thead' : ['Name','ID','Type','Mode',''],
					'tbodyDatabind' : "var: users(@SUPPLIERS); format:processList; loadsTemplate:supplierListItemTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminSupplierList',
						'_tag' : {
							'datapointer':'adminSupplierList'
							}
						}
					});
				app.model.dispatchThis('mutable');
				}, //showSupplierManager

			showSupplierEditor : function($editorContainer,VENDORID) {
				if($editorContainer instanceof jQuery && VENDORID)	{
$editorContainer.showLoading({"message":"Fetching supplier details"});
app.model.addDispatchToQ({
	'_cmd':'adminSupplierDetail',
	'VENDORID' : VENDORID,
	'_tag':	{
		'datapointer' : 'adminSupplierDetail|'+VENDORID,
		'callback':function(rd)	{
			$editorContainer.hideLoading();
			if(app.model.responseHasErrors(rd)){
				$editorContainer.anymessage({'message':rd})
				}
			else	{
				$editorContainer.anycontent({'templateID':'supplierUpdateTemplate','datapointer':rd.datapointer,'showLoading':false,'dataAttribs':{'vendorid':VENDORID}});
				app.ext.admin.u.handleAppEvents($editorContainer);
				$(".applyAnycb",$editorContainer).parent().anycb(); //anycb gets executed on the labels, not the checkbox.
				
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
			
				app.ext.admin_wholesale.u.handleFormConditionalDelegation($('form',$editorContainer));
				}

			}
		}
	},'mutable');
app.model.dispatchThis('mutable');
					}
				else	{
					$("#globalMessaging").anymessage({'message':'In admin_wholesale.a.showSupplierEditor, either $editorContainer ['+typeof $editorContainer+'] or VENDORID ['+VENDORID+'] undefined','gMessage':true});
					}
				} //showSupplierEditor


			}, //a [actions]

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			wholesaleScheduleSelect : function($tag,data)	{
				if(!app.data.adminPriceScheduleList)	{$tag.anymessage({'message':'Unable to fetch wholesale list'})}
				else if(!app.data.adminPriceScheduleList['@SCHEDULES'])	{
					$tag.anymessage({'message':'You have not created any schedules yet.'})
					}
				else if(!data.value)	{$tag.anymessage({'message':'No data passed into wholesaleScheduleSelect renderFormat'})}
				else	{
					var $select = $("<select \/>",{'name':'SCHEDULE'}),
					schedules =app.data.adminPriceScheduleList['@SCHEDULES'], //shortcut
					L = app.data.adminPriceScheduleList['@SCHEDULES'].length
					list = null;
					$select.append($("<option \/>",{'value':''}).text('none'));
					for(var i = 0; i < L; i += 1)	{
						$select.append($("<option \/>",{'value':schedules[i].SID}).text(schedules[i].SID));
						}
					
					$select.appendTo($tag);
					if(data.value.ORG && data.value.ORG.SCHEDULE)	{$select.val(data.value.ORG.SCHEDULE)} //preselect schedule, if set.

					}
				} //wholesaleScheduleSelect
			}, //renderFormats
		
		
		
////////////////////////////////////   MACROBUILDERS   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		macrobuilders : {
			
			
			'WAREHOUSE-CREATE' : function(sfo)	{
				app.u.dump("BEGIN admin_wholesale.macrobuilders.warehouse-create");
				sfo = sfo || {};
//a new object, which is sanitized and returned.
				var newSfo = {
					'_cmd':'adminWarehouseMacro',
					'WAREHOUSE' : sfo.CODE,
					'_tag':sfo._tag,
					'@updates':new Array()
					}; 
				delete sfo._tag; //removed from original object so serialization into key value pair string doesn't include it.
				delete sfo._macrobuilder;
				newSfo['@updates'].push('WAREHOUSE-CREATE?'+$.param(sfo));  // 'code/warehouse' is passed on the outer level.
//				app.u.dump(" -> newSfo:"); app.u.dump(newSfo);
				return newSfo;
				}, //adminWarehouseMacroCreate
			'ZONE-CREATE-LOCATIONS' : function(sfo)	{
				die()
				},
			'WAREHOUSE-UPDATE' : function(sfo)	{
				app.u.dump("BEGIN admin_wholesale.macrobuilders.warehouse-update");
				sfo = sfo || {};
//a new object, which is sanitized and returned.
				var newSfo = {
					'_cmd':'adminWarehouseMacro',
					'WAREHOUSE' : sfo.CODE,
					'_tag':sfo._tag,
					'@updates':new Array()
					}; 
				delete sfo._tag; //removed from original object so serialization into key value pair string doesn't include it.
				delete sfo._macrobuilder;
				newSfo['@updates'].push('WAREHOUSE-UPDATE?'+$.param(sfo));
//				app.u.dump(" -> newSfo:"); app.u.dump(newSfo);
				return newSfo;
				}, //adminWarehouseMacroCreate


	
/*
macros:
SET
OURSET
ORDERSET -> 
SHIPSET ->
INVENTORYSET ->
TRACKINGSET ->

*/
			
			
			adminSupplierMacro : function(sfo,$form)	{
				sfo = sfo || {};
				var newSfo = {
					'_cmd':'adminSupplierMacro',
					'VENDORID' : sfo.VENDORID,
					'_tag':sfo._tag,
					'@updates':new Array()
					}
				
				var
					cmds = new Array("SET","OURSET","ORDERSET","SHIPSET","INVENTORYSET","TRACKINGSET"),
					L = cmds.length;
				
				for(var i = 0; i < L; i += 1)	{
//go through each fieldset and, if any fieldsets are edited, update them.
					var $fieldset = $("fieldset[data-app-role='"+cmds[i]+"']",$form);
					if($('.edited',$fieldset).length)	{
						$('.edited',$fieldset).each(function(){
							//connectors are 'set' for macro. all other fields are what's set in cmd array.
							newSfo['@updates'].push((($(this).attr('name').indexOf('CONNECTOR') > -1) ? 'SET' : cmds[i])+"?"+$(this).attr('name')+"="+encodeURIComponent($(this).val())); //encodeURIComponent($.param($fieldset.serializeJSON({'cb':true})))
							})
						
						}
					}
				return newSfo
				}
			}, //macroBuilders

////////////////////////////////////   EVENTS [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\                    

		e : {

//can't use defualt createDialog app event because we need to add a few params to the form.
			warehouseCreateShow : function($btn,vars)	{
				$btn.button();
				$btn.off('click.warehouseCreateShow').on('click.warehouseCreateShow',function(event){
					event.preventDefault();
					var $D = app.ext.admin.i.dialogCreate({
						'title':'Add New Warehouse',
						'templateID':'warehouseAddUpdateTemplate',
						'showLoading':false //will get passed into anycontent and disable showLoading.
						});
					$D.dialog('open');
//These fields are used for processForm on save.
					$('form',$D).first().append("<input type='hidden' name='_macrobuilder' value='admin_wholesale|WAREHOUSE-CREATE'  \/><input type='hidden' name='_tag/callback' value='showMessaging' \/><input type='hidden' name='_tag/message' value='The warehouse has been successfully created.' \/><input type='hidden' name='_tag/updateDMIList' value='"+$btn.closest("[data-app-role='dualModeContainer']").attr('id')+"' /><input type='hidden' name='_tag/jqObjEmpty' value='true' \/>");
					});
				}, //warehouseCreateShow

			warehouseDetailDMIPanel : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				$btn.off('click.warehouseDetailDMIPanel').on('click.warehouseDetailDMIPanel',function(event){
					event.preventDefault();
					var	CODE = $btn.closest('tr').data('warehouse_code');
					
					var $panel = app.ext.admin.i.DMIPanelOpen($btn,{
						'templateID' : 'warehouseAddUpdateTemplate',
						'panelID' : 'warehouse_'+CODE,
						'header' : 'Edit Warehouse: '+CODE,
						'data' : app.data.adminWarehouseList['@WAREHOUSES'][$btn.closest('tr').data('obj_index')],
						'handleAppEvents' : false
						});
					$("[name='CODE']",$panel).closest('label').hide(); //warehouse code isn't editable. hide it. setting 'disabled' will remove from serializeJSON.
					$('form',$panel).append("<input type='hidden' name='_macrobuilder' value='admin_wholesale|WAREHOUSE-UPDATE' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/message' value='The warehouse has been successfully updated.' /><input type='hidden' name='_tag/updateDMIList' value='"+$panel.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
//					$('.buttonset',$panel).prepend("<button data-app-event='admin_wholesale|warehouseZoneCreateShow'>Add Zone<\/button>");
					app.u.handleAppEvents($panel);
					});
				}, //warehouseDetailDMIPanel

			warehouseRemoveConfirm : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.warehouseRemoveExec').on('click.warehouseRemoveExec',function(event){
					event.preventDefault();
					
					var CODE = $btn.closest('tr').data('warehouse_code');
					var $D = app.ext.admin.i.dialogConfirmRemove({
						'message':'Are you sure you want to delete warehouse '+CODE+'? There is no undo for this action.',
						'removeButtonText' : 'Delete Warehouse',
						'removeFunction':function(vars,$modal){
							var $panel = $(app.u.jqSelector('#','warehouse_'+CODE));
							if($panel.length)	{
								$panel.anypanel('destroy'); //make sure there is no editor for this warehouse still open.
								}
							app.model.addDispatchToQ({'_cmd':'adminWarehouseMacro','WAREHOUSE':CODE,'@updates':["WAREHOUSE-DELETE"]},'immutable');
							app.model.addDispatchToQ({'_cmd':'adminWarehouseList','_tag':{'datapointer':'adminWarehouseList','callback':'DMIUpdateResults','extension':'admin','jqObj':$btn.closest("[data-app-role='dualModeContainer']")}},'immutable');
							app.model.dispatchThis('immutable');
							$modal.dialog('close');
							}
						});
					

					});
				}, //warehouseRemoveConfirm

			warehouseZoneCreateShow : function($btn,vars)	{
				$btn.button();
				$btn.off('click.warehouseZoneCreateShow').on('click.warehouseZoneCreateShow',function(event){
					event.preventDefault();
					
					var CODE = $btn.closest('form').find("[name='CODE']").val();
					
					var $D = app.ext.admin.i.dialogCreate({
						'title':'Add New Zone For Warehouse '+CODE,
						'templateID':'warehouseZoneCreateUpdateTemplate',
						'showLoading':false //will get passed into anycontent and disable showLoading.
						});
					$D.dialog('open');
//These fields are used for processForm on save.
					$('form',$D).first().append("<input type='hidden' name='CODE' value='"+CODE+"' \/><input type='hidden' name='_macrobuilder' value='admin_wholesale|ZONE-CREATE-LOCATIONS'  \/><input type='hidden' name='_tag/callback' value='showMessaging' \/><input type='hidden' name='_tag/message' value='The zone has been successfully created.' \/><input type='hidden' name='_tag/jqObjEmpty' value='true' \/>");
					});
				}, //warehouseZoneCreateShow


//executed from within the 'list' mode (most likely) and will prompt the user in a modal to confirm, then will delete the user */
			adminSupplierRemoveExec : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.adminSupplierRemoveExec').on('click.adminSupplierRemoveExec',function(event){

					event.preventDefault();
					
					const VENDORID = $btn.closest('tr').data('code');
					var $DMI = $btn.closest("[data-app-role='dualModeContainer']");
					
					var $D = app.ext.admin.i.dialogConfirmRemove({
						'message':'Are you sure you want to delete vendor '+VENDORID+'? There is no undo for this action.',
						'removeButtonText' : 'Delete Vendor',
						'removeFunction':function(vars,$modal){
							$DMI.showLoading({"message":"removing vendor "+VENDORID});
							app.model.addDispatchToQ({'_cmd':'adminSupplierRemove','VENDORID':VENDORID,'_tag':{'callback':'showMessaging','message':'The vendor '+VENDORID+' has been deleted','jqObj':$DMI}},'immutable');
							app.model.addDispatchToQ({'_cmd':'adminSupplierList','_tag':{'datapointer':'adminSupplierList','callback':'DMIUpdateResults','extension':'admin','jqObj':$DMI}},'immutable');
							app.model.dispatchThis('immutable');
							$modal.dialog('close');
							}
						});

					}); //$btn.on
				}, //adminSupplierRemoveExec






//applied to 'create user' button. just opens the modal.
			adminSupplierCreateShow : function($btn)	{
				$btn.button();
				$btn.off('click.showSupplierCreate').on('click.showSupplierCreate',function(event){
					event.preventDefault();
					var $D = app.ext.admin.i.dialogCreate({
						'title':'Add New Supplier',
						'templateID':'supplierAddTemplate',
						'showLoading':false //will get passed into anycontent and disable showLoading.
						});
					$D.dialog('open');
//These fields are used for processForm on save.
//They're here instead of in the form directly so that the form/template can be recycled for edit.
					$('form',$D).first().append("<input type='hidden' name='_tag/updateDMIList' value='"+$btn.closest("[data-app-role='dualModeContainer']").attr('id')+"' \/>");
					app.ext.admin_wholesale.u.handleFormConditionalDelegation($('form',$D));
					app.u.handleAppEvents($D,{"$context":$btn.closest("[data-app-role='supplierManager']").parent()})
					})
				}, //showSupplierCreate

//this button action is applied to the order list in both 'orders' and 'unordered items'.
//it'll validate to make sure an action is chosen as well as at least one order.
//It'll then update those orders w/ the chosen action.
//All things being equal, it'll then refresh the list of orders.
			adminSupplierActionOrder : function($btn)	{
				$btn.button();
				$btn.off('click.adminSupplierActionOrder').on('click.adminSupplierActionOrder',function(){
app.u.dump("BEGIN admin_wholesale.e.adminSupplierActionOrder click event");
					var
						$D = $btn.closest('.ui-dialog-content'), 
						$form = $btn.closest('form');

					if(app.u.validateForm($form))	{
						
						var
							sfo = $form.serializeJSON(),
							VENDORID = $btn.closest('.ui-dialog-content').data('vendorid'); 

						sfo._cmd = 'adminSupplierAction';
						sfo['@updates'] = new Array();
						sfo._tag = {
							callback : 'showMessaging',
							message : 'Your changes have been saved.',
							jqObj : $D
							}


						for(index in sfo)	{
							if(index.indexOf('orderid_') == 0)	{
								sfo['@updates'].push(sfo.action+"?orderid="+index.substring(8));
								}
							}
						
						
						
						if(sfo['@updates'].length)	{
							
							app.model.addDispatchToQ(sfo,'immutable');
							
							if($D.data('mode'))	{
								if($D.data('mode') == 'adminSupplierUnorderedItemList')	{
									$('tbody',$form).empty().showLoading({"message":"Performing action and fetching updated list of orders"})
									app.model.addDispatchToQ({
										_cmd : 'adminSupplierUnorderedItemList',
										FILTER : 'OPEN',
										VENDORID : VENDORID,
										_tag : {
											datapointer : 'adminSupplierOrderList|'+VENDORID,
											callback : 'anycontent',
											jqObj : $('tbody',$form)
											}
										},'immutable')					
									}
								else if($D.data('mode') == 'adminSupplierOrderList')	{
									$('tbody',$form).empty().showLoading({"message":"Performing action and fetching updated list of orders"})
									app.model.addDispatchToQ({
										_cmd : 'adminSupplierOrderList',
										FILTER : 'RECENT',
										VENDORID : VENDORID,
										_tag : {
											datapointer : 'adminSupplierOrderList|'+VENDORID,
											callback : 'anycontent',
											jqObj : $('tbody',$form)
											}
										},'immutable')					
									}
								else	{
									$D.anymessage({'message':'Invalid mode for this viewer. The request to change order status is still being attempted, but this list will not auto-refresh after that request finishes.'});
									}
								
				
								
								}
							else	{
								$D.anymessage({'message':'Unable to ascertain a mode for this viewer. The request to change order status is still being attempted, but this list will not auto-refresh after that request finishes.'});
								}
								
							app.model.dispatchThis('immutable'); //dispatch for update runs whether 'list' updated or not.
							}
						else	{
							$form.anymessage({"message":"Please select at least one order to perform this action on."})
							}

						}
					else	{} //validate form handles error display.
					});



				},


			adminSupplierActionDeAssociate : function($btn)	{
				$btn.button();
				$btn.off('click.adminSupplierActionDeAssociate').on('click.adminSupplierActionDeAssociate',function(){

					var
						$form = $btn.closest('form'),
						VENDORID = $btn.closest('.ui-dialog-content').data('vendorid'),
						cmdObj = {
						_cmd : 'adminSupplierAction',
						'@updates' : new Array(),
						VENDORID : VENDORID,
						_tag : {
							callback : 'showMessaging',
							message : 'Your changes have been saved.',
							jqObj : $form
							}
						}

					$(":checkbox:checked",$form).each(function(){
						cmdObj['@updates'].push("PRODUCT:DELINK?sku="+$(this).attr('name'));
						})
					
					if(cmdObj['@updates'].length)	{
						$form.showLoading({"message":"De-associating product and fetching updated list"});
						('tbody',$form).empty();
						app.model.addDispatchToQ(cmdObj,'immutable');
						app.model.addDispatchToQ({
							_cmd : 'adminSupplierProductList',
							FILTER : 'OPEN',
							VENDORID : VENDORID,
							_tag : {
								datapointer : 'adminSupplierProductList|'+VENDORID,
								callback : 'anycontent',
								jqObj : $('tbody',$form)
								}
							},'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{
						$D.anymessage({'message':'Please select at least one product from the list below.'});
						}

					});



				},


			adminSupplierAction : function($btn)	{
				$btn.button();
				if($btn.data('action'))	{
					
					if($btn.data('action') == 'INVENTORY:UPDATE')	{}
					else	{
						$btn.button('disable').attr('title','Invalid action specified on button.');
						}
					
					$btn.off('click.adminSupplierAction').on('click.adminSupplierAction',function(event){
						event.preventDefault();
						if($btn.data('action') == 'INVENTORY:UPDATE')	{
							var $fieldset = $btn.closest('fieldset');
							
							if(app.u.validateForm($fieldset))	{
								$fieldset.showLoading({"message":"Fetching inventory from supplier"});
								app.model.addDispatchToQ({'_cmd':'adminSupplierAction','@updates':["INVENTORY:UPDATE"],'VENDORID':$btn.closest("[data-code]").data('code'),'_tag':{'callback':function(rd){
									$fieldset.hideLoading();
									if(app.model.responseHasErrors(rd)){
										$fieldset.anymessage({'message':rd});
										}
									else	{
										$fieldset.anymessage(app.u.successMsgObject('File imported'));
										}
								}}},'mutable');
								app.model.dispatchThis('mutable');
								}
							else	{}
							}
						else	{} //shouldn't get here. actions have already been validated.
						});
					
					
					}
				else	{
					$btn.button('disable').attr('title','No action specified on button.');
					}
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

						var $table = $ele.closest('table');
						
						$table.stickytab({'tabtext':'vendors','tabID':'batchJobsStickyTab'}).addClass('small');
						$('button',$table).removeClass('ui-state-focus'); //removes class added by jqueryui onclick.
						$('button',$table).removeClass('ui-state-highlight');
						$ele.addClass('ui-state-highlight');
//make sure buttons and links in the stickytab content area close the sticktab on click. good usability.
						$('button, a',$table).each(function(){
							$(this).off('close.stickytab').on('click.closeStickytab',function(){
								$table.stickytab('close');
								})
							})


						var $editorContainer = $(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content'))
						$editorContainer.empty();
						app.ext.admin_wholesale.a.showSupplierEditor($editorContainer,$row.data('code'));
						}
					else	{
						$("#globalMessaging").anymessage({'message':'In admin_wholesale.e.showSupplierEditor, unable to ascertain VENDORID','gMessage':true});
						}
					});
				}, //showSupplierEditor

	
			adminSupplierUnorderedItemListShow : function($btn)	{
				$btn.button();
				
				$btn.off('click.adminSupplierUnorderedItemListShow').on('click.adminSupplierUnorderedItemListShow',function(){

					var VENDORID = $btn.closest("[data-code]").data('CODE');
					var $D = app.ext.admin.i.dialogCreate({
						'templateID': "supplierUnorderedItemsTemplate",
						'title': $btn.data('mode') == 'vendor' ? "Unordered Items for "+VENDORID : "Unordered Items",
						"showLoading" : false
						});
					
					$D.dialog('option','width','70%');
					$D.dialog('option','modal',false);

					$D.dialog( "option", "appendTo", $btn.closest("[data-app-role='dualModeContainer']")); //jq v 1.10. must be before open
//d.data is used by button on form submit. form template also used by order list
					
					$D.dialog('open');
					
					$('tbody',$D).showLoading({'message':'Fetching unordered item list...'});


					var cmdObj = {
						_cmd : 'adminSupplierUnorderedItemList',
						FILTER : 'OPEN',
						_tag : {
							callback : 'anycontent',
							jqObj : $('tbody',$D)
							}
						}

					if($btn.data('mode') == 'vendor')	{
						$D.data({'vendorid':VENDORID,'mode':'adminSupplierUnorderedItemList'});
						cmdObj.VENDORID = VENDORID
						cmdObj._tag.datapointer = "adminSupplierUnorderedItemList|"+cmdObj.VENDORID;
						}
					else if	($btn.data('mode') == 'all'){
						$D.data({'vendorid':VENDORID,'mode':'adminSupplierUnorderedItemList','vendorid':''});
						cmdObj._tag.datapointer = "adminSupplierUnorderedItemList";
						}
					else	{} //unrecognized mode.
					//no datapointer will be set if invalid mode set.

					if(cmdObj._tag.datapointer)	{
						app.model.addDispatchToQ(cmdObj,'mutable');
						app.model.dispatchThis('mutable');
						}
					
					});
				},


//this is used in the list and also in the detail.
//so the vendorid is ascertained using 'code' because that's what comes in the list response.
// and it uses closest data- instead of closest tr because in detail mode, the buttons aren't in a tr.
			adminSupplierProdOrderListShow : function($btn)	{
				$btn.button();

				if($btn.data('mode') == 'product' || $btn.data('mode') == 'order')	{

$btn.off('click.adminSupplierProdOrderListShow').on('click.adminSupplierProdOrderListShow',function(event){
	event.preventDefault();
	const VENDORID = $btn.closest("[data-code]").data('code');
	
	if(VENDORID)	{

		var $D = app.ext.admin.i.dialogCreate({
			'templateID': ($btn.data('mode') == 'order') ? 'supplierOrderListTemplate' : 'supplierItemListTemplate',
			'title': $btn.data('mode')+" list for vendor "+VENDORID,
			'showLoading' : false
			});
		$D.data('vendorid',VENDORID);
		$D.dialog('option','modal',false);
		$D.dialog('option','width','70%');
		$D.dialog('option','height',($(window).height() / 2));
		$D.dialog( "option", "appendTo", $btn.closest("[data-app-role='dualModeContainer']")); //jq v 1.10. must be before open
		$('form',$D).showLoading({'message':'Fetching '+$btn.data('mode')+' list...'}).append("<input type='hidden' name='VENDORID' value='"+VENDORID+"' \/>");
		$D.dialog('open');
		
		var cmdObj = {
			'VENDORID':VENDORID,
			'_tag':	{
				'callback': 'anycontent',
				'jqObj' : $('form',$D)
				}
			}
		
		if($btn.data('mode') == 'order')	{
			$D.data('mode','adminSupplierOrderList'); //used by button on form submit. form template also used by unordereditems
			cmdObj._cmd = 'adminSupplierOrderList';
			cmdObj.FILTER = 'RECENT';
			cmdObj._tag.datapointer = 'adminSupplierOrderList|'+VENDORID;
			}
		else if($btn.data('mode') == 'product')	{
			cmdObj._cmd = 'adminSupplierProductList';
//			cmdObj.FILTER = 'OPEN';
			cmdObj._tag.datapointer = 'adminSupplierProductList|'+VENDORID;
			}
		else {} //should never get here. unrecognized mode.
		
		app.model.addDispatchToQ(cmdObj,'mutable');
		app.model.dispatchThis('mutable');

		}
	else	{
		$('#globalMessaging').anymessage({'message':'In admin_wholesale.e.adminSupplierProdOrderListShow, unable to determine vendorID.','gMessage':true})
		}
	});

					
					}
				else	{
					$btn.button('disable');
					}
				}, //adminSupplierOrderListShow
				

			showMediaLib4OrganizationLogo : function($ele)	{
				$ele.off('click.mediaLib').on('click.mediaLib',function(event){
					event.preventDefault();
					var $context = $ele.closest('fieldset');
					mediaLibrary($("[data-app-role='organizationLogo']",$context),$("[name='LOGO']",$context),'Choose Dropship Logo');
					});
				}, //showMediaLib4OrganizationLogo


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
/* keywords and searchby are NOT required. if empty, a list of recent orgs will be returned */
					if(sfo)	{
//						app.u.dump(" -> sfo: "); app.u.dump(sfo);
						$('tbody',$table).empty(); //clear previous search results.
						$dualModeContainer.showLoading("Searching organizations by "+sfo.searchby+" for "+sfo.keywords);
						
						sfo[sfo.searchby] = sfo.keywords;
						delete sfo.keywords; delete sfo.searchby; //sanitize before sending to API.
						
						app.ext.admin.calls.adminCustomerOrganizationSearch.init(sfo,{'callback':function(rd){
							$dualModeContainer.hideLoading();

							if(app.model.responseHasErrors(rd)){
								$form.anymessage({'message':rd})
								}
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
// never reached, blank search shows last 50 results 
						$('#globalMessaging').anymessage({'message':'Either keywords ['+sfo.keywords+'] or searchby ['+sfo.searchby+'] left blank.'});
						}
					
					
					});
				}, //execOrganizationSearch

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
				}, //execOrganizationRemove

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
				}, //execOrganizationUpdate


			adminOrganizationSearchShowUI : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-contact"},text: false});
				if($btn.data('searchby') && $btn.data('keywords'))	{
					$btn.attr('title','Search organizations by '+$btn.data('searchby').toLowerCase()+" for '"+$btn.data('keywords').toLowerCase()+"'");
					$btn.off('click.adminOrganizationSearchShowUI').on('click.adminOrganizationSearchShowUI',function(event){
						//later, maybe we add a data-stickytab to the button and, if true, closest table gets sticky.
						app.ext.admin_wholesale.a.showOrganizationManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")),{'searchby':$btn.data('searchby'),'keywords':$btn.data('keywords')});
						});
					}
				else	{
					$btn.button('disable');
					}
				},



			priceScheduleUpdateShow : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				$btn.off('click.priceScheduleUpdateShow').on('click.priceScheduleUpdateShow',function(event){
					event.preventDefault();
					const SID = $btn.closest('tr').data('sid'); //schedule id
					
					var $panel = app.ext.admin.i.DMIPanelOpen($btn,{
						'templateID' : 'priceScheduleUpdateTemplate',
						'panelID' : 'schedule_'+SID,
						'header' : 'Edit Price Schedule: '+SID,
						'data' : $btn.closest('tr').data()
						});
					app.u.handleAppEvents($panel);
					$(":checkbox",$panel).anycb();
					app.model.dispatchThis('mutable');
					});
				}, //priceScheduleUpdateShow


			priceScheduleCreateShow : function($btn)	{
				$btn.button();
				$btn.off('click.priceScheduleUpdateShow').on('click.priceScheduleUpdateShow',function(event){
					event.preventDefault();
					
					var $D = app.ext.admin.i.dialogCreate({
						'title':'Add New Schedule',
						'showLoading':false //will get passed into anycontent and disable showLoading.
						});
					
					$D.append("<label>Schedule ID <input type='text' name='SID' value='' \/><\/label><br />");
					
					$("<button>Create Schedule<\/button>").button().on('click',function(){
						app.model.addDispatchToQ({
							'_cmd':'adminPriceScheduleCreate',
							'SID': $(this).parent().find("[name='SID']").val(),
							'_tag':	{
								'callback':'showMessaging',
								'jqObj' : $D,
								'jqObjEmpty' : true,
								'message' : 'Your price schedule has been created.'
								}
							},'immutable');
						app.model.addDispatchToQ({'_cmd':'adminPriceScheduleList','_tag':{'datapointer':'adminPriceScheduleList','callback':'DMIUpdateResults','extension':'admin','jqObj':$btn.closest("[data-app-role='dualModeContainer']")}},'immutable');
						app.model.dispatchThis('immutable');
						}).appendTo($D);
					
					$D.dialog('open');
					});
				},

			priceScheduleRemoveConfirm : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.priceScheduleRemoveConfirm').on('click.priceScheduleRemoveConfirm',function(event){
					event.preventDefault();
					
					var SID = $btn.closest('tr').data('sid');
					var $D = app.ext.admin.i.dialogConfirmRemove({
						'message':'Are you sure you want to delete schedule '+SID+'? There is no undo for this action.',
						'removeButtonText' : 'Delete Price Schedule',
						'removeFunction':function(vars,$modal){
							var $panel = $(app.u.jqSelector('#','schedule_'+SID));
							if($panel.length)	{
								$panel.anypanel('destroy'); //make sure there is no editor for this schedule still open.
								}
							$btn.closest("[data-app-role='dualModeContainer']").showLoading({"message":"Removing price schedule "+SID});
							app.model.addDispatchToQ({'_cmd':'adminPriceScheduleRemove','SID':SID},'immutable');
							app.model.addDispatchToQ({'_cmd':'adminPriceScheduleList','_tag':{'datapointer':'adminPriceScheduleList','callback':'DMIUpdateResults','extension':'admin','jqObj':$btn.closest("[data-app-role='dualModeContainer']")}},'immutable');
							app.model.dispatchThis('immutable');
							$modal.dialog('close');
							}
						});
					});
				}, //execTicketClose


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
				}, //showOrganizationUpdate

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
				}, //execOrganizationCreate

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
				} //showOrganizationCreate
			}, //e [app Events]


		u : {


			handleFormConditionalDelegation : function($container)	{
				$container.on('keyup',function(e)	{
//					app.u.dump(" -> e.target.nodeName.toLowerCase(): "+e.target.nodeName.toLowerCase());
					if(e.target.nodeName.toLowerCase() == 'input'){
						var $input = $(e.target);
						
						if($input.data('input-format'))	{

							if($input.data('input-format').indexOf('uppercase') > -1)	{
								$input.val($input.val().toUpperCase());
								}
							
							if($input.data('input-format').indexOf('alphanumeric') > -1)	{
								$input.val($input.val().replace(/\W/g, ''));
								}
							
							}
						}
					});
				
				$container.on('click',function(e){
					var $ele = $(e.target);
//					app.u.dump(" -> e.target.nodeName.toLowerCase(): "+e.target.nodeName.toLowerCase());

					
					if(e.target.nodeName.toLowerCase() == 'option' || e.target.nodeName.toLowerCase() == 'select'){
//						app.u.dump('is option or select');
//FF registers a click on the option. Chrome on the select.
//to be consistent, put select into focus.						
						if(e.target.nodeName.toLowerCase() == 'option'){
							$ele = $ele.closest('select');
							}
//						app.u.dump(" -> $ele.is('select'): "+$ele.is('select'));
//						app.u.dump(" -> $ele.data('panel-selector'): "+$ele.data('panel-selector'));
/*
panel-selector:
on a select, set data-panel-selector=".someClass"
on each option, set data-show-panel=""
on each panel, which MUST be within the same form, set data-panel-id="" where the value matches the data-show-panel set in the option.
so when the option with data-show-panel="supplierShippingConnectorGeneric" is selected, the panel with data-panel-id="supplierShippingConnectorGeneric" is displayed
and all .someClass are hidden (value of data-panel-selector)

*/
						if($ele.data('panel-selector'))    {
							var	$form = $ele.closest('form'); //used for context.
				
							$($ele.data('panel-selector'),$form).hide(); //hide all panels w/ matching selector.
							var $option = $('option:selected',$ele);
							if(!$option.data('show-panel'))	{} //no panel defined. do nada
							else if($option.data('show-panel'))	{
								var panels = new Array();
								if($option.data('show-panel').indexOf(','))	{panels = $option.data('show-panel').split(',')}
								else {panels.push($option.data('show-panel'))};
								for(var i = 0; i < panels.length; i += 1)	{
									$("[data-panel-id='"+panels[i]+"']",$form).show(); //panel defined and it exists. show it.
									}
								}
							else	{
								$form.anymessage({'message':"The option selected has a panel defined ["+$option.data('show-panel')+"], but none exists within the form specified.",'gMessage':true}); //panel defined but does not exist. throw error.
								}
							}
						}
					});				
//after adding the listeners, need to trigger some clicks.

//trigger the hide/show panel on select options.
				$("select[data-panel-selector]",$container).each(function(){
					if($('option:selected',$(this)).data('show-panel'))	{
						$('option:selected',$(this)).trigger('click');
						}
					});

				}

			}

		} //r object.
	return r;
	}