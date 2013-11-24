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
			}, //INIT


		wholesaleSearchResults: {
			onSuccess : function(_rtag)	{
				if(_rtag.jqObj)	{
					if(_rtag.datapointer && app.data[_rtag.datapointer])	{
						if(app.data[_rtag.datapointer]['@ROWS'].length)	{
							_rtag.jqObj.anycontent(_rtag);
							}
						else	{
							$('#globalMessaging').anymessage({"message":"There were zero items returns in your search of warehouse "+_rtag.jqObj.closest("[data-app-role='slimLeftContainer']").data("geo")+"."});
							}
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In admin_wholesale.callbacks.wholesaleSearchResults, either _rtag.datapointer ["+_rtag.datapointer+"] is empty or app.data[rd.datapointer] [typeof: "+typeof app.data[rd.datapointer]+"] is empty.","gMessage":true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_wholesale.callbacks.wholesaleSearchResults, no jqObj specified in _tag/_rtag.","gMessage":true});
					}
				}
			} //wholesaleSearchResults
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
					'thead' : ['Code','Zone','Title','Zone Type','Preference','# Positions',''],
					'tbodyDatabind' : "var: users(@ROWS); format:processList; loadsTemplate:warehouseResultsRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminWarehouseList',
						'zones' : 1,
						'_tag' : {
							'datapointer':'adminWarehouseList'
							}
						}
					});
				app.model.dispatchThis('mutable');
				}, //showWarehouseManager

			showWarehouseUtilities : function($target){
				$target.intervaledEmpty();
				$target.anycontent({'templateID':'whimInterfaceTemplate','data':{}});
				$target.showLoading({'message':'Fetching list of warehouses'})
				app.model.addDispatchToQ({
						'_cmd' : 'adminWarehouseList',
						'_tag' : {
							'datapointer':'adminWarehouseList',
							'callback': function(rd)	{
if(app.model.responseHasErrors(rd)){
	$target.anymessage({'message':rd});
	}
else	{
	$target.anycontent(rd);
	var whim = app.model.dpsGet('admin_wholesale','whim') || {};
//	app.u.dump(" -> dps.whim: "); app.u.dump(whim);
	if(whim.geo)	{
		$("[data-geo='666']",$target).trigger('click',{'skipDPSUpdate':true})
		}
	}

								},
							'translateOnly' : true,
							'jqObj' : $target
							}
						},'mutable');
				app.model.dispatchThis('mutable');
				
				$("[data-app-role='slimLeftNav']",$target).accordion();
				//target is likely a tab and I don't want to delegate to a tab at this time.
				app.u.handleEventDelegation($("[data-app-role='slimLeftNav']",$target));
				app.u.handleEventDelegation($("[data-app-role='slimLeftContentSection']",$target));
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
				var $DMI = app.ext.admin.i.DMICreate($target,{
					'header' : 'Supplier Manager',
					'className' : 'supplierManager',
//add button doesn't use admin|createDialog because extra inputs are needed for cmd/tag and the template is shared w/ update.
					'buttons' : [
						"<button data-app-event='admin|refreshDMI'>Refresh Supplier List<\/button>",
						"<button class='marginLeft' data-app-event='admin_wholesale|adminSupplierUnorderedItemListShow' data-mode='all'>Unordered Items</button>",
						"<button class='marginLeft' data-app-event='admin_wholesale|adminSupplierCreateShow'>Add Supplier</button>"
						],
					'thead' : ['','Name','ID','Type','Mode',''],
					'controls' : "<button data-app-click='admin|checkAllCheckboxesExec' class='applyButton marginRight'>Select All<\/button><span class='applyButtonset smallButton'>Modify Selected:	<button data-app-click='admin_wholesale|supplierBatchExec' data-verb='INVENTORY'>Get Inventory</button><button data-app-click='admin_wholesale|supplierBatchExec' data-verb='PROCESS' title='Will cause any pending orders to be set to a supplier'>Process Orders</button><button data-app-click='admin_wholesale|supplierBatchExec' data-verb='TRACKING'>Update Tracking</button><\/span>",
					'tbodyDatabind' : "var: users(@SUPPLIERS); format:processList; loadsTemplate:supplierListItemTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminSupplierList',
						'_tag' : {
							'datapointer':'adminSupplierList'
							}
						}
					});
				app.u.handleButtons($DMI.closest('.dualModeContainer').anydelegate());
				
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

//for FBA, most panel inputs get 'locked'
									if(app.data[rd.datapointer].FORMAT == 'FBA' || app.data[rd.datapointer].CODE == 'FBA')	{
										$(".panel[data-panel-id='supplierOurFBAConfig']",$editorContainer).show()
										$('.panel',$editorContainer).not("[data-panel-id='supplierOurFBAConfig']").find(":input").attr('disabled','disabled');
										$("select[name='FORMAT']",$editorContainer).val('FBA');
										$('select[name="INVENTORY_CONNECTOR"]',$editorContainer).prop('disabled','').removeProp('disabled').find("option[value='GENERIC']").hide();
										
										$("input[name='PREFERENCE']",$editorContainer).prop('disabled','').removeProp('disabled');
//to compensate for a bug where FORMAT was getting dropped.
//if code is FBA, force format to FBA. this is a reserved name (user formats are more characters).
										if(!app.data[rd.datapointer].FORMAT)	{
											$("select[name='FORMAT']",$editorContainer).val('FBA').addClass('edited');
											}
										}
//format can not change once set.
									else if(app.data[rd.datapointer].FORMAT)	{
										$("select[name='FORMAT']",$editorContainer).prop('disabled','disabled');
										}
//disallow FBA except for the reserved code.
									else if(app.data[rd.datapointer].CODE != 'FBA')	{
										$("select[name='FORMAT'] option[value='FBA']",$editorContainer).prop('disabled','disabled');
										}
									else	{}

								//make into anypanels.
									$("div.panel",$editorContainer).each(function(){
										var PC = $(this).data('app-role'); //panel content (general, productUpdates, etc)
										$(this).data('vendorid',VENDORID).anypanel({'wholeHeaderToggle':false,'showClose':false,'state':'persistent','extension':'admin_wholesale','name':PC,'persistent':true});
										});
								//### the panels are sortable, BUT this code doesn't allow for persistance. address when time permits.
								
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
											app.model.dpsSet('admin_wholesale','editorPanelOrder',dataObj); //update the localStorage session var.
								//			app.u.dump(' -> dataObj: '); app.u.dump(dataObj);
											}
										});

									

									app.ext.admin.u.handleFormConditionalDelegation($('form',$editorContainer));
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
				}, //wholesaleScheduleSelect

			warehouseCodeOrZone : function($tag,data)	{
//			app.u.dump(data.value); 
				if(data.value._OBJECT == 'GEO')	{
					$tag.text(data.value.GEO);
					}
				else if(data.value._OBJECT == 'ZONE')	{
					$tag.append("<span class='ui-icon ui-icon-arrow-1-e marginLeft'></span>")
					}
				else	{
					$tag.text("Unrecognized _object");// something new?
					}
				}
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

			'ZONE-CREATE' : function(sfo)	{
				sfo = sfo || {};
//a new object, which is sanitized and returned.
				var newSfo = {
					'_cmd':'adminWarehouseMacro',
					'GEO' : sfo.GEO,
					'_tag':sfo._tag,
					'@updates':new Array()
					};
				delete sfo.GEO;
				delete sfo._tag; //removed from original object so serialization into key value pair string doesn't include it.
				delete sfo._macrobuilder;
				newSfo['@updates'].push('ZONE-CREATE?'+$.param(sfo));
				
				return newSfo;
				}, //ZONE-CREATE

			'ZONE-POSITIONS' : function(sfo,$form)	{
				sfo = sfo || {};
//a new object, which is sanitized and returned.
				var newSfo = {
					'_cmd':'adminWarehouseMacro',
					'GEO' : sfo.GEO,
					'ZONE' : sfo.ZONE, //alertnatively, ZONE 'can' be specified on the update itself, if multiple zones are being updated in the same place.
					'_tag':sfo._tag,
					'@updates':new Array()
					}; 
				delete sfo._tag; //removed from original object so serialization into key value pair string doesn't include it.
				delete sfo._macrobuilder;
			
				$("[data-table='ZONE_STANDARD'] tbody",$form).find('tr.edited').each(function(){
					var $tr = $(this);
					if($tr.hasClass('rowTaggedForRemove') && $tr.hasClass('isNewRow'))	{
						//is a new row that is tagged for delete. don't do anything with it.
						}
					else if($tr.hasClass('rowTaggedForRemove'))	{
						newSfo['@updates'].push('ZONE-POSITIONS-DELETE?'+$.param(app.u.getWhitelistedObject($tr.data(),['uuid'])));
						}
					else	{
						if(!$tr.data('uuid')){$tr.data('uuid',app.u.guidGenerator())}
						newSfo['@updates'].push('ZONE-POSITIONS-ADD?'+$.param(app.u.getWhitelistedObject($tr.data(),['row','shelf','shelf_end','slot','slot_end','uuid'])));
						}
					});
				
//				app.u.dump(" -> newSfo:"); app.u.dump(newSfo);
				return newSfo;
				
				},

			'WAREHOUSE-UPDATE' : function(sfo)	{
				app.u.dump("BEGIN admin_wholesale.macrobuilders.warehouse-update");
				sfo = sfo || {};
//a new object, which is sanitized and returned.
				var newSfo = {
					'_cmd':'adminWarehouseMacro',
					'GEO' : sfo.GEO,
					'_tag':sfo._tag,
					'@updates':new Array()
					}; 
				delete sfo._tag; //removed from original object so serialization into key value pair string doesn't include it.
				delete sfo._macrobuilder;
				newSfo['@updates'].push('WAREHOUSE-UPDATE?'+$.param(sfo));
//				app.u.dump(" -> newSfo:"); app.u.dump(newSfo);
				return newSfo;
				}, //WAREHOUSE-UPDATE
			
			adminSupplierMacro : function(sfo,$form)	{
				sfo = sfo || {};
				var newSfo = {
					'_cmd':'adminSupplierMacro',
					'VENDORID' : sfo.VENDORID,
					'_tag':sfo._tag,
					'@updates':new Array()
					}
				
				var
					cmds = new Array("SET","ORDERSET","SHIPSET","INVENTORYSET","TRACKINGSET"), //The list of valid fieldsets to save. OURSET is left out intentionally. see below.
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
				
				//ourset data is destructive, so EVERY field in the fieldset gets updated if anything has changed.
				var $oursetFieldset = $("fieldset[data-app-role='OURSET']",$form);
				if($('.edited',$oursetFieldset).length)	{
					newSfo['@updates'].push("OURSET?"+$.param($oursetFieldset.serializeJSON({'cb':true})));
					}
				else	{} //no changes.

//				app.u.dump(newSfo['@updates']);
				return newSfo
				} //adminSupplierMacro
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
					$(".hideForCreate",$D).hide();
					$D.dialog('open');
//These fields are used for processForm on save.
					$('form',$D).first().append("<input type='hidden' name='_macrobuilder' value='admin_wholesale|WAREHOUSE-CREATE'  \/><input type='hidden' name='_tag/callback' value='showMessaging' \/><input type='hidden' name='_tag/message' value='The warehouse has been successfully created.' \/><input type='hidden' name='_tag/updateDMIList' value='"+$btn.closest("[data-app-role='dualModeContainer']").attr('id')+"' /><input type='hidden' name='_tag/jqObjEmpty' value='true' \/>");
					});
				}, //warehouseCreateShow



			wholesaleZoneAddRow : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-plus"},text: true});
				$btn.off('click.wholesaleZoneAddRow').on('click.wholesaleZoneAddRow',function(event){
					event.preventDefault();
					if($btn.data('loadstemplate'))	{
						var $tr = app.renderFunctions.createTemplateInstance($btn.data('loadstemplate'));
						$btn.closest('table').find('tbody:first').append($tr);
						app.u.handleAppEvents($tr);
						}
					else	{
						$btn.closest('form').anymessage({"message":"In admin_wholesale.e.wholesaleZoneAddRow, no data-loadstemplate specified on trigger element.",'gMessage':true})
						}
					});
				}, //wholesaleZoneAddRow

			warehouseDetailDMIPanel : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				
				if($btn.closest('tr').data('zone_type') == 'RECEIVING' || $btn.closest('tr').data('zone_type') == 'UNSTRUCTURED')	{
					$btn.hide();
					}
				else	{
					$btn.off('click.warehouseDetailDMIPanel').on('click.warehouseDetailDMIPanel',function(event){
						event.preventDefault();
						var data = $btn.closest('tr').data();
					
						if(data._object == 'GEO' || data._object == 'ZONE')	{
	//these are the shared values for the DMI panel.
							var panelObj = {
								'panelID' : 'warehouse_'+data.geo,
								'handleAppEvents' : true
								}
	
							if(data._object == 'ZONE')	{
								panelObj.templateID = 'warehouseZoneStandardTemplate';
								panelObj.header = 'Edit Zone: '+data.zone;
								}
							else	{
								panelObj.templateID = 'warehouseAddUpdateTemplate';
								panelObj.header = 'Edit Warehouse: '+data.geo;
								}
							
							var $panel = app.ext.admin.i.DMIPanelOpen($btn,panelObj);
	
							if(data._object == 'GEO')	{
								$("[name='GEO']",$panel).closest('label').hide().val(data.geo); //warehouse code isn't editable. hide it. setting 'disabled' will remove from serializeJSON.
								$('form',$panel).append("<input type='hidden' name='_macrobuilder' value='admin_wholesale|WAREHOUSE-UPDATE' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/message' value='The warehouse has been successfully updated.' /><input type='hidden' name='_tag/updateDMIList' value='"+$panel.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
								}
							else	{
								$('form',$panel).append("<input type='hidden' name='GEO' value='"+data.geo+"' />");
								$('form',$panel).append("<input type='hidden' name='ZONE' value='"+data.zone+"' />");
								}
							$panel.showLoading({'message':'Fetching warehouse details'});
							app.model.addDispatchToQ({
								'_cmd':'adminWarehouseDetail',
								'GEO' : data.geo,
								'_tag':	{
									'datapointer' : 'adminWarehouseDetail|'+data.geo,
									'callback':function(rd)	{
										if(app.model.responseHasErrors(rd)){
											$('#globalMessaging').anymessage({'message':rd});
											}
										else	{
											//success content goes here.
											if(data._object == 'GEO')	{
												$panel.anycontent({'translateOnly':true,'datapointer':rd.datapointer});
												}
											else	{
												$panel.anycontent({
													'translateOnly':true,
													'data':app.data[rd.datapointer]['%ZONES'][data.zone]
													});
												app.u.handleAppEvents($panel);
												}
											}
										}
									}
								},'mutable');
							app.model.dispatchThis('mutable');
							}
						else	{
							$('#globalMessaging').anymessage({"message":"In admin_wholesale.e.warehouseDetailDMIPanel, unrecognized data._object ["+data._object+"]. Must be GEO or ZONE.","gMessage":true});
							}
	
	
						});
					}
				}, //warehouseDetailDMIPanel

			warehouseRemoveConfirm : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.warehouseRemoveExec').on('click.warehouseRemoveExec',function(event){
					event.preventDefault();
					
					var $tr = $btn.closest('tr');
					var GEO = $tr.data('geo');
					var $D = app.ext.admin.i.dialogConfirmRemove({
						'message':'Are you sure you want to delete '+($tr.data('_object') == 'GEO' ? (" warehouse "+GEO) : (" zone "+$tr.data('zone')))+'? There is no undo for this action.',
						'removeButtonText' : 'Delete',
						'removeFunction':function(vars,$modal){
							var $panel = $(app.u.jqSelector('#','warehouse_'+GEO));
							if($panel.length)	{
								$panel.anypanel('destroy'); //make sure there is no editor for this warehouse still open.
								}
							
							if($tr.data('_object') == 'ZONE')	{
								app.model.addDispatchToQ({
									'_cmd':'adminWarehouseMacro',
									'GEO' : GEO,
									'_tag': {
										'callback' : 'showMessaging',
										'jqObj' : $('#globalMessaging'),
										'message' : 'Zone '+$tr.data('zone')+' has been deleted.'
										},
									'@updates':["ZONE-DELETE?ZONE="+$tr.data('zone')]
									},'immutable');
								}
							else	{
								app.model.addDispatchToQ({
									'_cmd':'adminWarehouseMacro',
									'GEO':GEO,
									'_tag': {
										'callback' : 'showMessaging',
										'jqObj' : $('#globalMessaging'),
										'message' : 'Warehouse '+GEO+' has been deleted.'
										},
									'@updates':["WAREHOUSE-DELETE"]},'immutable');
								}
							
							
							app.model.addDispatchToQ({'_cmd':'adminWarehouseList','_tag':{'datapointer':'adminWarehouseList','callback':'DMIUpdateResults','extension':'admin','jqObj':$btn.closest("[data-app-role='dualModeContainer']")}},'immutable');
							app.model.dispatchThis('immutable');
							$modal.dialog('close');
							}
						});
					

					});
				}, //warehouseRemoveConfirm

			warehouseZoneCreateShow : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-plus"},text: true});
				$btn.off('click.wholesaleZoneCreateShow').on('click.wholesaleZoneCreateShow',function(event){
					event.preventDefault();
					var GEO = $btn.closest('form').find("input[name='GEO']").val();
					if(GEO)	{
						var $D = app.ext.admin.i.dialogCreate({
							'title' : 'Add a New Zone',
							'templateID' : 'warehouseAddLocationTemplate',
							'data' : {'GEO':GEO},
							appendTo : $btn.closest('.ui-anypanel-content'), //This adds the dialog as a child to the anypanel content. That means the dialog can look up the DOM tree to 'find' things.
							'showLoading' : false
							});
						$D.dialog('open');
						
						$('form',$D).append("<input type='hidden' name='_tag/updateDMIList' value='"+$btn.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
						}
					else	{
						$btn.closest('form').anymessage({"message":"In admin_wholesale.e.wholesaleZoneCreateShow, unable to ascertain the warehouse code.",'gMessage':true});
						}
					});
				}, //warehouseZoneCreateShow



////////////////  WMS UTILITIES AKA:			 		WHIM



			whimWarehouseSelect : function($ele,p)	{
//				app.u.dump(" -> $ele.data('geo'): "+$ele.data('geo'));
				p = p || {};
				if($ele.data('geo'))	{
					$ele.closest("[data-app-role='slimLeftContainer']").data("geo",$ele.data('geo')).find("h1").text("Warehouse "+$ele.data('geo')); //set the geo attribute to the warehouse id. this is used for all the warehouse utilities till changed.
					$ele.parent().find('.ui-selected').removeClass('ui-selected');
					$ele.addClass('ui-selected');
// a click is triggered when the page is loaded on the warehouse last opened. In that case, we want all code executed except a dpsSet
// it's already set because dps is where the page load got the geo from in the firstplace
					if(p.skipDPSUpdate)	{}
					else	{
						var whim = app.model.dpsGet('admin_wholesale',"whim") || {};
						whim.geo = $ele.data('geo');
						app.model.dpsSet('admin_wholesale',"whim",whim);
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_wholesale.e.whimWarehouseSelect, geo not set on trigger element.","gMessage":true});
					}
				}, //whimWarehouseSelect

			whimSearchMacroExec : function($ele,p)	{
				var $tbody = $ele.closest("[data-app-role='whimContainer']").find("[data-app-role='whimResultsTbody']");
				var $form =$ele.closest('form');
				$tbody.empty(); //the results should stack w/ each search. clear them.
				$tbody.closest('table').show(); //table is hidden by default so the thead doesn't show up when unnecessary.

				if(app.u.validateForm($form))	{
					app.model.addDispatchToQ({
						'_cmd':'adminWarehouseInventoryQuery',
						'GEO' : $ele.closest("[data-app-role='slimLeftContainer']").data("geo"),
						'SKUS' : $("textarea[name='skus']",$form).val(),
						'_tag':	{
							'datapointer' : 'adminWarehouseInventoryQuery',
							'callback':'wholesaleSearchResults',
							'extension' : 'admin_wholesale',
							jqObj : $tbody
							}
						},'mutable');
					app.model.dispatchThis('mutable');
					}
				else {} //form validation handles error display.
				}, //whimSearchMacroExec

//triggered when one of the li's in the whim nav menu is clicked. opens a specific utility, based on data-utility.
			whimShow : function($ele,p)	{
				var $slimLeft = $ele.closest("[data-app-role='slimLeftContainer']");
				var $target = $ele.closest("[data-app-role='slimLeftContainer']").find("[data-app-role='slimLeftContentSection']");
				
				if($slimLeft.data('geo'))	{

					$ele.closest("[data-app-role='slimLeftNav']").find('li.ui-state-focus').removeClass('ui-state-focus');
					$ele.addClass('ui-state-focus');
					
					if($ele.data('utility'))	{
						$target.slideUp('fast',function(){
							$target.empty().anycontent({
								'templateID' : 'whimTemplate_'+$ele.data('utility'),
								'showLoading' : false
								}).slideDown('fast');
							$('form',$target).append("<input type='hidden' name='GEO' value='"+$ele.closest("[data-app-role='slimLeftContainer']").data("geo")+"' />");
							app.u.handleCommonPlugins($target);
							app.u.handleButtons($target);
							});
						}
					else	{
						$target.anymessage({"message":"In admin_wholesale.e.whimShow, data-utility not set on trigger element.","gMessage":true})
						}
					}
				else	{
					$target.anymessage({"message":"Please select a warehouse from the list below prior to selecting a utility."})
					}
				}, //whimShow

			whimSetSKULocation : function($ele,p)	{
				var $form = $ele.closest('form');
				if(app.u.validateForm($form))	{
					var sfo = $form.serializeJSON();
					sfo.UUID = app.u.guidGenerator();
					var $li = $("<li \/>");
					var $ul = $ele.closest("[data-app-role='whimContainer']").find("[data-app-role='whimLocationUpdateLog']");
					$li.html("<span class='wait floatLeft marginRight'></span> "+ sfo.SKU + " + "+sfo.QTY+" " + sfo.LOC).prependTo($ul);

					var updates = new Array();
					updates.push("SKU-LOCATION-ADD?"+$.param(sfo));
					
					app.model.addDispatchToQ({
						'_cmd':'adminWarehouseMacro',
						'GEO' : $ele.closest("[data-app-role='slimLeftContainer']").data("geo"),
						'@updates' : updates,
						'_tag':	{
							'callback':function(rd)	{
								$('.wait',$li).addClass('ui-icon').removeClass('wait')
								if(app.model.responseHasErrors(rd)){
									$('.ui-icon',$li).addClass('ui-state-error ui-icon-alert');
									$li.anymessage({'message':rd,'persistant':true});
									}
								else	{
									$('input',$form).each(function(){$(this).val("")}); //clear inputs for next sku.
									$('.ui-icon',$li).addClass('ui-icon-check');
									//success content goes here.
									}
								}
							}
						},'immutable');
					app.model.dispatchThis('immutable');

					}
				else	{
					//form validation 
					}
				},

//////////////////// SUPPLIERS


			adminSupplierInventoryAddShow : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-plus"},text: true});
				$btn.off('click.adminSupplierInventoryAddShow').on('click.adminSupplierInventoryAddShow',function(event){
					event.preventDefault();
					var vendor = $btn.closest('tr').data('code');
					if(vendor)	{
						var $D = app.ext.admin.i.dialogCreate({
							'title':'Add Inventory for supplier '+vendor,
							'templateID':'supplierInventoryAddTemplate',
							'showLoading':false //will get passed into anycontent and disable showLoading.
							});
						$D.find('form').append("<input type='hidden' name='vendor' value='"+vendor+"' />")
						$D.dialog('open');
						$D.anydelegate();
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In admin_wholesale.e.adminSupplierInventoryAddShow, unable to ascertain vendor id.","gMessage":true});
						}
					
					});
				},


// There is a function in WHIM that is VERY similar to this.  Once supplier is using delegated events instead of appevents, combine the two ###
			adminSupplierInventoryAddExec : function($btn)	{
				
				$btn.button({icons: {primary: "ui-icon-plus"},text: true});
				$btn.off('click.adminSupplierInventoryAddShow').on('click.adminSupplierInventoryAddShow',function(event){
					event.preventDefault();

					var $form = $btn.closest('form');
					if(app.u.validateForm($form))	{
						
						var
							sfo = $form.serializeJSON(),
							$li = $("<li \/>");

						if(sfo.vendor)	{
							sfo.UUID = app.u.guidGenerator();
							$li.html("<span class='wait floatLeft marginRight'></span> "+ sfo.SKU + " + "+sfo.QTY).prependTo($btn.closest("[data-app-role='supplierInventoryUpdateContainer']").find("[data-app-role='supplierInventoryUpdateLog']"));
							
							app.model.addDispatchToQ({
								'_cmd':'adminSupplierAction',
								'VENDORID' : sfo.vendor,
								'@updates' : ["SKU:LINK?"+$.param(sfo)],
								'_tag':	{
									'callback':function(rd)	{
										$('.wait',$li).addClass('ui-icon').removeClass('wait')
										if(app.model.responseHasErrors(rd)){
											$('.ui-icon',$li).addClass('ui-state-error ui-icon-alert');
											$li.anymessage({'message':rd,'persistant':true});
											}
										else	{
											$(".resetMeOnComplete",$form).each(function(){$(this).val("")}); //clear inputs for next sku. only target class so hiddens et all don't get nuked.
											$('.ui-icon',$li).addClass('ui-icon-check');
											//success content goes here.
											}
										}
									}
								},'immutable');
							app.model.dispatchThis('immutable');
							}
						else	{
							$form.anymessage({"message":"In admin_wholesale.e.adminSupplierInventoryAddExec, unable to ascertain vendor (should be a hidden input in form)","gMessage":"true"})
							}
	
						}
					else	{
						//form validation 
						}				
					
					});
				
				},


//executed from within the 'list' mode (most likely) and will prompt the user in a modal to confirm, then will delete the user */
			adminSupplierRemoveExec : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.adminSupplierRemoveExec').on('click.adminSupplierRemoveExec',function(event){

					event.preventDefault();
					
					var VENDORID = $btn.closest('tr').data('code');
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
					$('form',$D).first().append("<input type='hidden' name='DMIID' value='"+$btn.closest("[data-app-role='dualModeContainer']").attr('id')+"' \/>");
					app.ext.admin.u.handleFormConditionalDelegation($('form',$D));
					app.u.handleAppEvents($D,{"$context":$btn.closest("[data-app-role='supplierManager']").parent()})
					})
				}, //showSupplierCreate


//applied to 'create user' button. just opens the modal.
			adminSupplierCreateExec : function($btn)	{
				$btn.button();
				$btn.off('click.showSupplierCreate').on('click.showSupplierCreate',function(event){
					event.preventDefault();
					var $form = $btn.closest('form');
					if(app.u.validateForm($form))	{

var sfo = $form.serializeJSON();
sfo._cmd = 'adminSupplierCreate'

if(sfo['INIT-DEFAULTS'])	{
	sfo['@updates'] = ["INIT-DEFAULTS"];
	delete sfo['INIT-DEFAULTS']
	}

if(sfo.FORMAT == 'FBA')	{sfo.VENDORID = 'FBA'}

sfo._tag =	{
	'callback':'showMessaging',
	'jqObj' : $form,
	'jqObjEmpty' : true,
	'updateDMIList' : sfo.DMIID,
	'message' : 'Thank you, the supplier has been added.'
	}
delete sfo.DMIID; //is no longer necessary.
if(sfo.FORMAT == 'FBA')	{
	sfo.NAME = "Fulfillment by Amazon"
	}
app.model.addDispatchToQ(sfo,'immutable');

//after the initial dispatch so that the VENDOR is created by the time the macro is run.
/*
if(sfo.FORMAT == 'FBA')	{
	app.model.addDispatchToQ({
		'_cmd' : 'adminSupplierMacro',
		'VENDOR' : 'FBA',
		'@updates' : []
		},'immutable');
	}
*/
app.model.dispatchThis('immutable');	

						}
					else	{}//validation handles display logic too
					});
				}, //showSupplierCreate


//this button action is applied to the order list in both 'orders' and 'unordered items'.
//it'll validate to make sure an action is chosen as well as at least one order.
//It'll then update those orders w/ the chosen action.
//All things being equal, it'll then refresh the list of orders.
			adminSupplierActionOrder : function($ele,P)	{

				app.u.dump("BEGIN admin_wholesale.e.adminSupplierActionOrder click event");
				var
					$D = $ele.closest('.ui-dialog-content'), 
					$form = $ele.closest('form');

				if(app.u.validateForm($form))	{
					
					var
						sfo = $form.serializeJSON(),
						VENDORID = $ele.closest('.ui-dialog-content').data('vendorid'); 

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


				},


			adminSupplierActionDeAssociate : function($btn)	{
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
					cmdObj['@updates'].push("SKU:UNLINK?SKU="+$(this).closest("[data-sku]").attr('data-sku'));
					})
				if(cmdObj['@updates'].length)	{
					$form.showLoading({"message":"De-associating product and fetching updated list"});
					('tbody',$form).empty();
					app.model.addDispatchToQ(cmdObj,'immutable');
					app.model.addDispatchToQ({
						_cmd : 'adminSupplierInventoryList',
						FILTER : 'OPEN',
						VENDORID : VENDORID,
						_tag : {
							datapointer : 'adminSupplierInventoryList|'+VENDORID,
							callback : 'anycontent',
							jqObj : $('tbody',$form)
							}
						},'immutable');
					app.model.dispatchThis('immutable');
					}
				else	{
					$D.anymessage({'message':'Please select at least one product from the list below.'});
					}
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

	
			supplierBatchExec : function($ele,p)	{
				app.u.dump(" -> BEGIN admin_wholesale.e.supplierBatchExec");
				if($ele.data('verb'))	{
					app.u.dump(" -> verb: "+$ele.data('verb'));
					$ele.closest('.dualModeContainer').find(":checked").each(function(){
						var $row = $(this).closest('tr');
						app.u.dump(" -> $row.data('code'): "+$row.data('code'));
						if($row.data('code'))	{
							app.ext.admin_batchJob.a.adminBatchJobCreate({'type':'SUPPLIER/'+$row.data('code')+'/'+$ele.data('verb')});
							}
						else	{
							$('#globalMessaging').anymessage({"message":"In admin_wholesale.e.supplierBatchExec, unable to ascertain vendor code.","gMessage":true});
							}
						});
					}
				else	{
					//no data-verb
					$('#globalMessaging').anymessage({"message":"In admin_wholesale.e.supplierBatchExec, no data-verb set on trigger element.","gMessage":true});
					}
				},
	
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

//This code opens either the supplier specific inventory or order list.
//the button is present both in the 'list' and in the 'detail'.
//The vendorid is ascertained using 'code' because that's what comes in the list response.
// and it uses closest data- instead of closest tr because in detail mode, the buttons aren't in a tr.
//the code that uses this still uses app events. The dialog this opens uses delegated events.
			adminSupplierProdOrderListShow : function($ele,P)	{
				$ele.button();

				if($ele.data('mode') == 'product' || $ele.data('mode') == 'order')	{

$ele.off('click.adminSupplierProdOrderListShow').on('click.adminSupplierProdOrderListShow',function(event){
	event.preventDefault();
	var VENDORID = $ele.closest("[data-code]").data('code');
	
	if(VENDORID)	{

		var $D = app.ext.admin.i.dialogCreate({
			'templateID': ($ele.data('mode') == 'order') ? 'supplierOrderListTemplate' : 'supplierItemListTemplate',
			'title': $ele.data('mode')+" list for vendor "+VENDORID,
			'showLoading' : false
			});
		$D.data('vendorid',VENDORID);
		$D.dialog('option','modal',false);
		$D.dialog('option','width','70%');
		$D.dialog('option','height',($(window).height() / 2));
		$D.dialog( "option", "appendTo", $ele.closest("[data-app-role='dualModeContainer']")); //jq v 1.10. must be before open
		$('form',$D).showLoading({'message':'Fetching '+$ele.data('mode')+' list...'}).append("<input type='hidden' name='VENDORID' value='"+VENDORID+"' \/>");
		$D.dialog('open');
		
		var cmdObj = {
			'VENDORID':VENDORID,
			'_tag':	{
				'callback': 'anycontent',
				'handleEventDelegation' : true,
				'jqObj' : $('form',$D)
				}
			}
		
		if($ele.data('mode') == 'order')	{
			$D.data('mode','adminSupplierOrderList'); //used by button on form submit. form template also used by unordereditems
			cmdObj._cmd = 'adminSupplierOrderList';
			cmdObj.FILTER = 'RECENT';
			cmdObj._tag.datapointer = 'adminSupplierOrderList|'+VENDORID;
			}
		else if($ele.data('mode') == 'product')	{
			cmdObj._cmd = 'adminSupplierInventoryList';
//			cmdObj.FILTER = 'OPEN';
			cmdObj._tag.datapointer = 'adminSupplierInventoryList|'+VENDORID;
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
					$ele.button('disable');
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
					var SID = $btn.closest('tr').data('sid'); //schedule id
					
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




			}

		} //r object.
	return r;
	}