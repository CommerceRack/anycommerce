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




var admin_wholesale = function(_app) {
	var theseTemplates = new Array(
		'orgManagerControls', //needs to be defined for orgManager DMI
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
				// _app.model.fetchNLoadTemplates(_app.vars.baseURL+'extensions/admin/wholesale.html',theseTemplates);
				var $wm = $("<div \/>",{'id':'wholesaleModal'}).appendTo('body'); //a recycleable element for modals.
				$wm.dialog({'autoOpen':false,'modal':true,'width':500,'height':500});
				
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				_app.u.dump('BEGIN admin_wholesale.callbacks.init.onError');
				}
			}, //INIT

//used for WHIM
		wholesaleSearchResults: {
			onSuccess : function(_rtag)	{
				if(_rtag.jqObj)	{
					if(_rtag.datapointer && _app.data[_rtag.datapointer])	{
						if(_app.data[_rtag.datapointer]['@ROWS'].length)	{
							_rtag.jqObj.anycontent(_rtag);
							_app.u.handleButtons(_rtag.jqObj);
							}
						else	{
							$('#globalMessaging').anymessage({"message":"There were zero items returns in your search of warehouse "+_rtag.jqObj.closest("[data-app-role='slimLeftContainer']").data("geo")+"."});
							}
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In admin_wholesale.callbacks.wholesaleSearchResults, either _rtag.datapointer ["+_rtag.datapointer+"] is empty or _app.data[rd.datapointer] [typeof: "+typeof _app.data[rd.datapointer]+"] is empty.","gMessage":true});
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
				_app.ext.admin.i.DMICreate($target,{
					'header' : 'Warehouse Manager',
					'className' : 'warehouseManager',
//add button doesn't use admin|createDialog because extra inputs are needed for cmd/tag and the template is shared w/ update.
					'buttons' : [
						"<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh<\/button>",
						"<button data-app-click='admin_wholesale|warehouseCreateShow' data-title='Create a New Warehouse' class='applyButton' data-text='true' data-icon-primary='ui-icon-circle-plus'>Add Warehouse</button>"
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
				_app.u.handleButtons($target.anyform());
				_app.model.dispatchThis('mutable');
				}, //showWarehouseManager

			showWarehouseUtilities : function($target){
				$target.intervaledEmpty();
				$target.anycontent({'templateID':'whimInterfaceTemplate','data':{}});
				$target.showLoading({'message':'Fetching list of warehouses'});
				_app.model.addDispatchToQ({
						'_cmd' : 'adminWarehouseList',
						'_tag' : {
							'datapointer':'adminWarehouseList',
							'callback': function(rd)	{
								if(_app.model.responseHasErrors(rd)){
									$target.anymessage({'message':rd});
									}
								else	{
									$target.anycontent(rd);
									var whim = _app.model.dpsGet('admin_wholesale','whim') || {};
								//	_app.u.dump(" -> dps.whim: "); _app.u.dump(whim);
									if(whim.geo)	{
										$("[data-geo='666']",$target).trigger('click',{'skipDPSUpdate':true})
										}
									}

								},
							'translateOnly' : true,
							'jqObj' : $target
							}
						},'mutable');
				_app.model.dispatchThis('mutable');
				
				$("[data-app-role='slimLeftNav']",$target).accordion();
				//target is likely a tab and I don't want to delegate to a tab at this time.
				_app.u.addEventDelegation($("[data-app-role='slimLeftNav']",$target).anyform());
				_app.u.addEventDelegation($("[data-app-role='slimLeftContentSection']",$target).anyform());
				},

			showPriceSchedules : function($target)	{
				$target.empty();
				_app.ext.admin.i.DMICreate($target,{
					'header' : 'Price Schedules',
					'className' : 'priceSchedules',
//add button doesn't use admin|createDialog because extra inputs are needed for cmd/tag and the template is shared w/ update.
					'buttons' : [
						"<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh<\/button>",
						"<button data-app-click='admin_wholesale|priceScheduleCreateShow' data-title='Create a New Price Schedule'  class='applyButton' data-text='true' data-icon-primary='ui-icon-circle-plus'>Add New Schedule</button>"
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
				_app.u.handleButtons($target.anyform());
				_app.model.dispatchThis('mutable');
				},

			showOrganizationManager : function($target,vars)	{
//				_app.u.dump("BEGIN admin_wholesale.a.showOrganizationManager");
				_app.ext.admin.calls.adminPriceScheduleList.init({},'mutable'); //need this for add and edit.
				dump(" -> vars: "); dump(vars);
				var $DMI = _app.ext.admin.i.DMICreate($target,{
					'header' : 'Organization Manager',
					'handleAppEvents' : false,
					'className' : 'organizationManager', //applies a class on the DMI, which allows for css overriding for specific use cases.
					'thead' : ['','ID','Company','Domain','Email','Account Manager','Billing Phone','Billing Contact',''], //leave blank at end if last row is buttons.
					'tbodyDatabind' : "var: tickets(@ORGANIZATIONS); format:processList; loadsTemplate:organizationManagerOrgRowTemplate;",
					'buttons' : [
						"<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh<\/button>",
						"<button data-app-click='admin_wholesale|showOrganizationCreate' class='applyButton' data-text='true' data-icon-primary='ui-icon-circle-plus'>Add Organization</button>"],	
					'controls' : _app.templates.orgManagerControls,
					data : vars,
					'cmdVars' : {
						'_cmd' : 'adminCustomerOrganizationSearch',
						searchby : vars.searchby,
						keywords : vars.keywords,
						'PHONE' : '', //update by changing $([data-app-role="dualModeContainer"]).data('cmdVars').STATUS
						'limit' : '50', //not supported for every call yet.
						'_tag' : {
							'datapointer':'adminCustomerOrganizationSearch'
							}
						}
					});
				_app.u.handleButtons($target.anyform());
				// do not fetch templates at this point. That's a heavy call and they may not be used.
				_app.model.dispatchThis();
				}, //showOrganizationManager

			showOrganizationEditor : function($target,vars)	{
				_app.u.dump("BEGIN admin_wholesale.a.showOrganizationEditor");
				if($target && vars && vars.orgID)	{

					$target.anycontent({'templateID':'organizationManagerOrgCreateUpdateTemplate'}).anyform({'trackEdits':true}); //.showLoading({'message':'Fetching Data for Organization '+vars.orgID});
					_app.u.addEventDelegation($target);
					$('.buttonset',$target).append("<button data-app-click='admin_wholesale|adminCustomerOrganizationUpdateExec' disabled='disabled' class='applyButton' data-app-role='saveButton'>Save <span class='numChanges'></span> Changes</button>");
					$('form',$target).append("<input type='hidden' name='ORGID' value='"+vars.orgID+"' />");
					_app.u.handleButtons($target);
					_app.u.handleCommonPlugins($target);
					_app.ext.admin.calls.adminPriceScheduleList.init({},'mutable');
					_app.model.addDispatchToQ({'_cmd':'adminCustomerOrganizationDetail','ORGID' : vars.orgID,'_tag':	{
						'datapointer' : 'adminCustomerOrganizationDetail|'+vars.orgID,
						'callback': 'anycontent',
						'translateOnly' : true,
						'jqObj' : $target
						}},'mutable');
					_app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_wholesale.e.showOrganizationUpdate, unable to determine orgID.','gMessage':true});
					}
				},

			//smTarget (supply manager target) is the jquery object of where it should be placed, ususally a tab.
			showSupplierManager : function($target)	{
				_app.ext.admin.calls.adminPriceScheduleList.init({},'mutable'); //need this for create and update.
				var $DMI = _app.ext.admin.i.DMICreate($target,{
					'header' : 'Supplier Manager',
					'className' : 'supplierManager',
					'handleAppEvents' : false,
//add button doesn't use admin|createDialog because extra inputs are needed for cmd/tag and the template is shared w/ update.
					'buttons' : [
						"<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh<\/button>",
						"<button data-app-click='admin_wholesale|adminSupplierUnorderedItemListShow' data-mode='all' class='applyButton' data-text='true'>Unordered Items</button>",
						"<button data-app-click='admin_wholesale|adminSupplierCreateShow' class='applyButton' data-text='true' data-icon-primary='ui-icon-circle-plus'>Add Supplier</button>"
						],
					'thead' : ['','Name','ID','Type',''],
					'controls' : "<button data-app-click='admin|checkAllCheckboxesExec' class='applyButton marginRight'>Select All<\/button><span class='applyButtonset smallButton'>Modify Selected:	<button data-app-click='admin_wholesale|supplierBatchExec' data-verb='INVENTORY'>Get Inventory</button><button data-app-click='admin_wholesale|supplierBatchExec' data-verb='PROCESS' title='Will cause any pending orders to be set to a supplier'>Process Orders</button><button data-app-click='admin_wholesale|supplierBatchExec' data-verb='TRACKING'>Update Tracking</button><\/span>",
					'tbodyDatabind' : "var: users(@SUPPLIERS); format:processList; loadsTemplate:supplierListItemTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminSupplierList',
						'_tag' : {
							'datapointer':'adminSupplierList'
							}
						}
					});
				_app.u.handleButtons($target.anyform());
				
				_app.model.dispatchThis('mutable');
				}, //showSupplierManager

			showSupplierEditor : function($editorContainer,VENDORID) {
				_app.u.dump("BEGIN admin_wholesale.a.showSupplierEditor");
				if($editorContainer instanceof jQuery && VENDORID)	{

					$editorContainer.showLoading({"message":"Fetching supplier details"});

					_app.model.addDispatchToQ({
						'_cmd':'adminSupplierDetail',
						'VENDORID' : VENDORID,
						'_tag':	{
							'datapointer' : 'adminSupplierDetail|'+VENDORID,
							'callback':function(rd)	{
								$editorContainer.hideLoading();
								if(_app.model.responseHasErrors(rd)){
									$editorContainer.anymessage({'message':rd})
									}
								else	{
									$editorContainer.anycontent({'templateID':'supplierUpdateTemplate','datapointer':rd.datapointer,'showLoading':false,'dataAttribs':{'vendorid':VENDORID}});
									_app.u.handleButtons($editorContainer);
									_app.u.addEventDelegation($editorContainer);
									$editorContainer.anyform({'trackEdits':true});

//for FBA, most panel inputs get 'locked'
									if(_app.data[rd.datapointer].FORMAT == 'FBA' || _app.data[rd.datapointer].CODE == 'FBA')	{
										$(".panel[data-panel-id='supplierOurFBAConfig']",$editorContainer).show()
										$('.panel',$editorContainer).not("[data-panel-id='supplierOurFBAConfig']").find(":input").attr('disabled','disabled');
										$("select[name='FORMAT']",$editorContainer).val('FBA');
										$('select[name="INVENTORY_CONNECTOR"]',$editorContainer).prop('disabled','').removeProp('disabled').find("option[value='GENERIC']").hide();
										
										$("input[name='PREFERENCE']",$editorContainer).prop('disabled','').removeProp('disabled');
//to compensate for a bug where FORMAT was getting dropped.
//if code is FBA, force format to FBA. this is a reserved name (user formats are more characters).
										if(!_app.data[rd.datapointer].FORMAT)	{
											$("select[name='FORMAT']",$editorContainer).val('FBA').addClass('edited');
											}
										}
//format can not change once set.
									else if(_app.data[rd.datapointer].FORMAT)	{
										$("select[name='FORMAT']",$editorContainer).prop('disabled','disabled');
										}
//disallow FBA except for the reserved code.
									else if(_app.data[rd.datapointer].CODE != 'FBA')	{
										$("select[name='FORMAT'] option[value='FBA']",$editorContainer).prop('disabled','disabled');
										}
									else	{}

								//make into anypanels.
									$("div.panel",$editorContainer).each(function(){
										var PC = $(this).data('app-role'); //panel content (general, productUpdates, etc)
										$(this).data('vendorid',VENDORID).anypanel({'wholeHeaderToggle':false,'showClose':false,'state':'persistent','extension':'admin_wholesale','name':PC,'persistent':true});
										});
								//### the panels are sortable, BUT this code doesn't allow for persistance. address when time permits.
								
								//run after the FBA code so that if the cb's are disabled, the aesthetic is right.
								_app.u.handleCommonPlugins($editorContainer);
									
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
											_app.model.dpsSet('admin_wholesale','editorPanelOrder',dataObj); //update the localStorage session var.
								//			_app.u.dump(' -> dataObj: '); _app.u.dump(dataObj);
											}
										});

									}
					
								}
							}
						},'mutable');
					_app.model.dispatchThis('mutable');
					}
				else	{
					$("#globalMessaging").anymessage({'message':'In admin_wholesale.a.showSupplierEditor, either $editorContainer ['+typeof $editorContainer+'] or VENDORID ['+VENDORID+'] undefined','gMessage':true});
					}
				} //showSupplierEditor

			}, //a [actions]

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			wholesaleScheduleSelect : function($tag,data)	{
				if(!_app.data.adminPriceScheduleList)	{$tag.closest('label').anymessage({'message':'Unable to fetch wholesale list'})}
				else if(!_app.data.adminPriceScheduleList['@SCHEDULES'])	{
					$tag.closest('label').anymessage({'message':'You have not created any schedules yet.'})
					}
//* 201402 -> if data.value isn't set (ex: a merchant hasn't selected one for the marketplace) then the list wouldn't generate.
//				else if(!data.value)	{$tag.closest('label').anymessage({'message':'No data passed into wholesaleScheduleSelect renderFormat'})}
				else	{
					var $select = $("<select \/>",{'name':'SCHEDULE'}),
					schedules =_app.data.adminPriceScheduleList['@SCHEDULES'], //shortcut
					L = _app.data.adminPriceScheduleList['@SCHEDULES'].length
					list = null;
					$select.append($("<option \/>",{'value':''}).text('none'));
					for(var i = 0; i < L; i += 1)	{
						$select.append($("<option \/>",{'value':schedules[i].SID}).text(schedules[i].SID));
						}
					
					$select.appendTo($tag);
					if(data.value)	{$select.val(data.value)}
//					if(data.value.ORG && data.value.ORG.SCHEDULE)	{$select.val(data.value.ORG.SCHEDULE)} //preselect schedule, if set.

					}
				}, //wholesaleScheduleSelect

			warehouseCodeOrZone : function($tag,data)	{
//			_app.u.dump(data.value); 
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
				_app.u.dump("BEGIN admin_wholesale.macrobuilders.warehouse-create");
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
//				_app.u.dump(" -> newSfo:"); _app.u.dump(newSfo);
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
						newSfo['@updates'].push('ZONE-POSITIONS-DELETE?'+$.param(_app.u.getWhitelistedObject($tr.data(),['uuid'])));
						}
					else	{
						if(!$tr.data('uuid')){$tr.data('uuid',_app.u.guidGenerator())}
						newSfo['@updates'].push('ZONE-POSITIONS-ADD?'+$.param(_app.u.getWhitelistedObject($tr.data(),['row','shelf','shelf_end','slot','slot_end','uuid'])));
						}
					});
				
//				_app.u.dump(" -> newSfo:"); _app.u.dump(newSfo);
				return newSfo;
				
				},

			'WAREHOUSE-UPDATE' : function(sfo)	{
				_app.u.dump("BEGIN admin_wholesale.macrobuilders.warehouse-update");
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
//				_app.u.dump(" -> newSfo:"); _app.u.dump(newSfo);
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
							//SANITY!!! -> MUST pull value from SFO, not from val(), so that checkboxes are saves as 1/0 not on/off. If the line below changes, compensate for that.
							newSfo['@updates'].push((($(this).attr('name').indexOf('CONNECTOR') > -1) ? 'SET' : cmds[i])+"?"+$(this).attr('name')+"="+encodeURIComponent(sfo[$(this).attr('name')])); //encodeURIComponent($.param($fieldset.serializeJSON({'cb':true})))
							})
						
						}
					}
				
				//ourset data is destructive, so EVERY field in the fieldset gets updated if anything has changed.
				var $oursetFieldset = $("fieldset[data-app-role='OURSET']",$form);
				if($('.edited',$oursetFieldset).length)	{
					newSfo['@updates'].push("OURSET?"+$.param($oursetFieldset.serializeJSON({'cb':true})));
					}
				else	{} //no changes.

//				_app.u.dump(newSfo['@updates']);
				return newSfo
				} //adminSupplierMacro
			}, //macroBuilders

////////////////////////////////////   EVENTS [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\                    

		e : {

			warehouseCreateShow : function($ele,P)	{
				P.preventDefault();
				var $D = _app.ext.admin.i.dialogCreate({
					'title':'Add New Warehouse',
					'templateID':'warehouseAddUpdateTemplate',
					'showLoading':false //will get passed into anycontent and disable showLoading.
					});
				$(".hideForCreate",$D).hide();
				_app.u.handleButtons($D);
				$D.anyform().dialog('open');
//These fields are used for processForm on save.
				$('form',$D).first().append("<input type='hidden' name='_macrobuilder' value='admin_wholesale|WAREHOUSE-CREATE'  \/><input type='hidden' name='_tag/callback' value='showMessaging' \/><input type='hidden' name='_tag/message' value='The warehouse has been successfully created.' \/><input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' /><input type='hidden' name='_tag/jqObjEmpty' value='true' \/>");
				}, //warehouseCreateShow

			warehouseDetailDMIPanel : function($ele,P)	{
				P.preventDefault();
				var data = $ele.closest('tr').data();			
			
				if(data._object == 'GEO' || (data._object == 'ZONE' && (data.zone_type == 'RECEIVING' || data.zone_type == 'UNSTRUCTURED' || data.zone_type == 'STANDARD')))	{
//these are the shared values for the DMI panel.
					var panelObj = {
						'handleAppEvents' : false
						}

					if(data._object == 'ZONE')	{
						panelObj.templateID = 'warehouseZoneStandardTemplate';
						panelObj.panelID = 'warehouse_'+data.geo+'_'+data.id;
						panelObj.header = 'Edit Zone: '+data.zone;
						}
					else	{
						panelObj.panelID = 'warehouse_'+data.geo;
						panelObj.templateID = 'warehouseAddUpdateTemplate';
						panelObj.header = 'Edit Warehouse: '+data.geo;
						}
					panelObj.showLoading = false;
					var $panel = _app.ext.admin.i.DMIPanelOpen($ele,panelObj);

					if(data._object == 'GEO')	{
						$("[name='GEO']",$panel).closest('label').hide().val(data.geo); //warehouse code isn't editable. hide it. setting 'disabled' will remove from serializeJSON.
						$('form',$panel).append("<input type='hidden' name='_macrobuilder' value='admin_wholesale|WAREHOUSE-UPDATE' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/message' value='The warehouse has been successfully updated.' /><input type='hidden' name='_tag/updateDMIList' value='"+$panel.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
						}
					else	{
						$('form',$panel).append("<input type='hidden' name='GEO' value='"+data.geo+"' />");
						$('form',$panel).append("<input type='hidden' name='ZONE' value='"+data.zone+"' />");
						}
					$panel.showLoading({'message':'Fetching warehouse details'});
					_app.model.addDispatchToQ({
						'_cmd':'adminWarehouseDetail',
						'GEO' : data.geo,
						'_tag':	{
							'datapointer' : 'adminWarehouseDetail|'+data.geo,
							'callback':function(rd)	{
								if(_app.model.responseHasErrors(rd)){
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
											'data':_app.data[rd.datapointer]['%ZONES'][data.zone]
											});
										}
									_app.u.handleButtons($panel);
									_app.u.handleCommonPlugins($panel);
									}
								}
							}
						},'mutable');
					_app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_wholesale.e.warehouseDetailDMIPanel, either unrecognized data._object ["+data._object+"] (must be GEO or ZONE) or _object is set to zone and data.zone_type is unrecognized ["+data.zone_type+"] (must be RECEIVING, STANDARD or UNSTRUCTURED).","gMessage":true});
					}
				}, //warehouseDetailDMIPanel

			warehouseRemoveConfirm : function($ele,P)	{
				P.preventDefault();
				
				var $tr = $ele.closest('tr');
				var GEO = $tr.data('geo');
				var $D = _app.ext.admin.i.dialogConfirmRemove({
					'message':'Are you sure you want to delete '+($tr.data('_object') == 'GEO' ? (" warehouse "+GEO) : (" zone "+$tr.data('zone')))+'? There is no undo for this action.',
					'removeButtonText' : 'Delete',
					'removeFunction':function(vars,$modal){
						var $panel = $(_app.u.jqSelector('#','warehouse_'+GEO));
						if($panel.length)	{
							$panel.anypanel('destroy'); //make sure there is no editor for this warehouse still open.
							}
						
						if($tr.data('_object') == 'ZONE')	{
							_app.model.addDispatchToQ({
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
							_app.model.addDispatchToQ({
								'_cmd':'adminWarehouseMacro',
								'GEO':GEO,
								'_tag': {
									'callback' : 'showMessaging',
									'jqObj' : $('#globalMessaging'),
									'message' : 'Warehouse '+GEO+' has been deleted.'
									},
								'@updates':["WAREHOUSE-DELETE"]},'immutable');
							}
						
						
						_app.model.addDispatchToQ({'_cmd':'adminWarehouseList','_tag':{'datapointer':'adminWarehouseList','callback':'DMIUpdateResults','extension':'admin','jqObj':$ele.closest("[data-app-role='dualModeContainer']")}},'immutable');
						_app.model.dispatchThis('immutable');
						$modal.dialog('close');
						}
					});
				}, //warehouseRemoveConfirm

			warehouseZoneCreateShow : function($ele,P)	{
				P.preventDefault();
				var GEO = $ele.closest('form').find("input[name='GEO']").val();
				if(GEO)	{
					var $D = _app.ext.admin.i.dialogCreate({
						'title' : 'Add a New Zone',
						'templateID' : 'warehouseAddLocationTemplate',
						'data' : {'GEO':GEO},
						appendTo : $ele.closest('.ui-anypanel-content'), //This adds the dialog as a child to the anypanel content. That means the dialog can look up the DOM tree to 'find' things.
						'showLoading' : false
						});
					$D.dialog('open');
					
					$('form',$D).append("<input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
					}
				else	{
					$ele.closest('form').anymessage({"message":"In admin_wholesale.e.wholesaleZoneCreateShow, unable to ascertain the warehouse code.",'gMessage':true});
					}
				}, //warehouseZoneCreateShow



////////////////  WMS UTILITIES AKA:			 		WHIM



			whimWarehouseSelect : function($ele,p)	{
//				_app.u.dump(" -> $ele.data('geo'): "+$ele.data('geo'));
				p = p || {};
				if($ele.data('geo'))	{
					$ele.closest("[data-app-role='slimLeftContainer']").data("geo",$ele.data('geo')).find("h1").text("Warehouse "+$ele.data('geo')); //set the geo attribute to the warehouse id. this is used for all the warehouse utilities till changed.
					$ele.parent().find('.ui-selected').removeClass('ui-selected');
					$ele.addClass('ui-selected');
// a click is triggered when the page is loaded on the warehouse last opened. In that case, we want all code executed except a dpsSet
// it's already set because dps is where the page load got the geo from in the firstplace
					if(p.skipDPSUpdate)	{}
					else	{
						var whim = _app.model.dpsGet('admin_wholesale',"whim") || {};
						whim.geo = $ele.data('geo');
						_app.model.dpsSet('admin_wholesale',"whim",whim);
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

				if(_app.u.validateForm($form))	{
					_app.model.addDispatchToQ({
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
					_app.model.dispatchThis('mutable');
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
							_app.u.handleCommonPlugins($target);
							_app.u.handleButtons($target);
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
				if(_app.u.validateForm($form))	{
					var sfo = $form.serializeJSON();
					sfo.UUID = _app.u.guidGenerator();
					var $li = $("<li \/>");
					var $ul = $ele.closest("[data-app-role='whimContainer']").find("[data-app-role='whimLocationUpdateLog']");
					$li.html("<span class='wait floatLeft marginRight'></span> "+ sfo.SKU + " + "+sfo.QTY+" " + sfo.LOC).prependTo($ul);

					var updates = new Array();
					updates.push("SKU-LOCATION-ADD?"+$.param(sfo));
					
					_app.model.addDispatchToQ({
						'_cmd':'adminWarehouseMacro',
						'GEO' : $ele.closest("[data-app-role='slimLeftContainer']").data("geo"),
						'@updates' : updates,
						'_tag':	{
							'callback':function(rd)	{
								$('.wait',$li).addClass('ui-icon').removeClass('wait')
								if(_app.model.responseHasErrors(rd)){
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
					_app.model.dispatchThis('immutable');

					}
				else	{
					//form validation 
					}
				},

//////////////////// SUPPLIERS


			adminSupplierInventoryAddShow : function($ele,P)	{
				P.preventDefault();
				var vendor = $ele.closest("[data-code]").data('code');
				if(vendor)	{
					var $D = _app.ext.admin.i.dialogCreate({
						'title':'Add Inventory for supplier '+vendor,
						'templateID':'supplierInventoryAddTemplate',
						'showLoading':false //will get passed into anycontent and disable showLoading.
						});
					$D.find('form').append("<input type='hidden' name='vendor' value='"+vendor+"' />")
					$D.dialog('open');
					$D.anyform();
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_wholesale.e.adminSupplierInventoryAddShow, unable to ascertain vendor id.","gMessage":true});
					}
				return false;
				},

// There is a function in WHIM that is VERY similar to this.  Once supplier is using delegated events instead of appevents, combine the two ###
			adminSupplierInventoryAddExec : function($ele,P)	{
				P.preventDefault();
				var $form = $ele.closest('form');
				if(_app.u.validateForm($form))	{
					var
						sfo = $form.serializeJSON(),
						$li = $("<li \/>");

					if(sfo.vendor)	{
						sfo.UUID = _app.u.guidGenerator();
						$li.html("<span class='wait floatLeft marginRight'></span> "+ sfo.SKU + " + "+sfo.QTY).prependTo($ele.closest("[data-app-role='supplierInventoryUpdateContainer']").find("[data-app-role='supplierInventoryUpdateLog']"));
						
						_app.model.addDispatchToQ({
							'_cmd':'adminSupplierAction',
							'VENDORID' : sfo.vendor,
							'@updates' : ["SKU:LINK?"+$.param(sfo)],
							'_tag':	{
								'callback':function(rd)	{
									$('.wait',$li).addClass('ui-icon').removeClass('wait')
									if(_app.model.responseHasErrors(rd)){
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
						_app.model.dispatchThis('immutable');
						}
					else	{
						$form.anymessage({"message":"In admin_wholesale.e.adminSupplierInventoryAddExec, unable to ascertain vendor (should be a hidden input in form)","gMessage":"true"})
						}

					}
				else	{
					//form validation 
					}
				return false;			
				},

//executed from within the 'list' mode (most likely) and will prompt the user in a modal to confirm, then will delete the user */
			adminSupplierRemoveExec : function($ele,P)	{
				P.preventDefault();
				
				var VENDORID = $ele.closest("[data-code]").data('code');
				var $DMI = $ele.closest("[data-app-role='dualModeContainer']");
				
				var $D = _app.ext.admin.i.dialogConfirmRemove({
					'message':'Are you sure you want to delete vendor '+VENDORID+'? There is no undo for this action.',
					'removeButtonText' : 'Delete Vendor',
					'removeFunction':function(vars,$modal){
						$DMI.showLoading({"message":"removing vendor "+VENDORID});
						_app.model.addDispatchToQ({'_cmd':'adminSupplierRemove','VENDORID':VENDORID,'_tag':{'callback':'showMessaging','message':'The vendor '+VENDORID+' has been deleted','jqObj':$DMI}},'immutable');
						_app.model.addDispatchToQ({'_cmd':'adminSupplierList','_tag':{'datapointer':'adminSupplierList','callback':'DMIUpdateResults','extension':'admin','jqObj':$DMI}},'immutable');
						_app.model.dispatchThis('immutable');
						$modal.dialog('close');
						}
					});
				return false;
				}, //adminSupplierRemoveExec

//applied to 'create user' button. just opens the modal.
			adminSupplierCreateShow : function($ele,P)	{
				P.preventDefault();
				var $D = _app.ext.admin.i.dialogCreate({
					'title':'Add New Supplier',
					'templateID':'supplierAddTemplate',
					'showLoading':false //will get passed into anycontent and disable showLoading.
					});
				$D.dialog('open');
//These fields are used for processForm on save.
//They're here instead of in the form directly so that the form/template can be recycled for edit.
				$('form:first',$D).anyform({'trackEdits':true}).append("<input type='hidden' name='DMIID' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' \/>");
				_app.u.handleButtons($D);
				_app.u.handleCommonPlugins($D);
				return false;
				}, //showSupplierCreate

//applied to 'create user' button. just opens the modal.
			adminSupplierCreateExec : function($ele,P)	{
				P.preventDefault();
				var $form = $ele.closest('form');
				if(_app.u.validateForm($form))	{

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
					_app.model.addDispatchToQ(sfo,'immutable');
					_app.model.dispatchThis('immutable');	

					}
				else	{}//validation handles display logic too
				return false;
				}, //showSupplierCreate


//this button action is applied to the order list in both 'orders' and 'unordered items'.
//it'll validate to make sure an action is chosen as well as at least one order.
//It'll then update those orders w/ the chosen action.
//All things being equal, it'll then refresh the list of orders.
			adminSupplierActionOrder : function($ele,P)	{

				_app.u.dump("BEGIN admin_wholesale.e.adminSupplierActionOrder click event");
				var
					$D = $ele.closest('.ui-dialog-content'), 
					$form = $ele.closest('form');

				if(_app.u.validateForm($form))	{
					
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
						
						_app.model.addDispatchToQ(sfo,'immutable');
						
						if($D.data('mode'))	{
							if($D.data('mode') == 'adminSupplierUnorderedItemList')	{
								$('tbody',$form).empty().showLoading({"message":"Performing action and fetching updated list of orders"})
								_app.model.addDispatchToQ({
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
								_app.model.addDispatchToQ({
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
							
						_app.model.dispatchThis('immutable'); //dispatch for update runs whether 'list' updated or not.
						}
					else	{
						$form.anymessage({"message":"Please select at least one order to perform this action on."})
						}

					}
				else	{} //validate form handles error display.


				},


			adminSupplierActionDeAssociate : function($ele,P)	{
				var
					$form = $ele.closest('form'),
					VENDORID = $ele.closest('.ui-dialog-content').data('vendorid'),
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
					_app.model.addDispatchToQ(cmdObj,'immutable');
					_app.model.addDispatchToQ({
						_cmd : 'adminSupplierInventoryList',
						FILTER : 'OPEN',
						VENDORID : VENDORID,
						_tag : {
							datapointer : 'adminSupplierInventoryList|'+VENDORID,
							callback : 'anycontent',
							jqObj : $('tbody',$form)
							}
						},'immutable');
					_app.model.dispatchThis('immutable');
					}
				else	{
					$D.anymessage({'message':'Please select at least one product from the list below.'});
					}
				},


			adminSupplierAction : function($ele,P)	{
				//the thought here is that someday more actions will be present.
				if($ele.data('action') == 'INVENTORY:UPDATE')	{
					var $fieldset = $ele.closest('fieldset');
					if(_app.u.validateForm($fieldset))	{
						$fieldset.showLoading({"message":"Fetching inventory from supplier"});
						_app.model.addDispatchToQ({'_cmd':'adminSupplierAction','@updates':["INVENTORY:UPDATE"],'VENDORID':$ele.closest("[data-code]").data('code'),'_tag':{'callback':function(rd){
							$fieldset.hideLoading();
							if(_app.model.responseHasErrors(rd)){
								$fieldset.anymessage({'message':rd});
								}
							else	{
								$fieldset.anymessage(_app.u.successMsgObject('File imported'));
								}
						}}},'mutable');
						_app.model.dispatchThis('mutable');
						}
					else	{}
					}
				else	{
					$("#globalMessaging").anymessage({"message":"In admin_wholesale.e.adminSupplierAction, invalid data-action ["+$ele.data('action')+"] set on trigger element.","gMessage":true});
					}
				},

//applied to 'edit user' button and the link in the list (name). opens the editor.
			showSupplierEditor : function($ele,P)	{
				P.preventDefault()
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

					_app.u.addEventDelegation($table);

					var $editorContainer = $(_app.u.jqSelector('#',_app.ext.admin.vars.tab+'Content'))
					$editorContainer.empty();
					_app.ext.admin_wholesale.a.showSupplierEditor($editorContainer,$row.data('code'));
					}
				else	{
					$("#globalMessaging").anymessage({'message':'In admin_wholesale.e.showSupplierEditor, unable to ascertain VENDORID','gMessage':true});
					}
				return false;
				}, //showSupplierEditor
	
			supplierBatchExec : function($ele,p)	{
//				_app.u.dump(" -> BEGIN admin_wholesale.e.supplierBatchExec");
				if($ele.data('verb'))	{
					_app.u.dump(" -> verb: "+$ele.data('verb'));
					$ele.closest('.dualModeContainer').find(":checked").each(function(){
						var $row = $(this).closest('tr');
						_app.u.dump(" -> $row.data('code'): "+$row.data('code'));
						if($row.data('code'))	{
							_app.ext.admin_batchjob.a.adminBatchJobCreate({'type':'SUPPLIER/'+$row.data('code')+'/'+$ele.data('verb')});
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
	
			adminSupplierUnorderedItemListShow : function($ele,P)	{
				P.preventDefault();
				var VENDORID = $ele.closest("[data-code]").data('code');
				var $D = _app.ext.admin.i.dialogCreate({
					'templateID': "supplierUnorderedItemsTemplate",
					'title': $ele.data('mode') == 'vendor' ? "Unordered Items for "+VENDORID : "Unordered Items",
					"showLoading" : false
					});
				
				$D.dialog('option','width','70%');
				$D.dialog('option','modal',false);

				$D.dialog( "option", "appendTo", $ele.closest("[data-app-role='dualModeContainer']")); //jq v 1.10. must be before open
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

				if($ele.data('mode') == 'vendor')	{
					$D.data({'vendorid':VENDORID,'mode':'adminSupplierUnorderedItemList'});
					cmdObj.VENDORID = VENDORID
					cmdObj._tag.datapointer = "adminSupplierUnorderedItemList|"+cmdObj.VENDORID;
					}
				else if	($ele.data('mode') == 'all'){
					$D.data({'vendorid':VENDORID,'mode':'adminSupplierUnorderedItemList','vendorid':''});
					cmdObj._tag.datapointer = "adminSupplierUnorderedItemList";
					}
				else	{} //unrecognized mode.
				//no datapointer will be set if invalid mode set.

				if(cmdObj._tag.datapointer)	{
					_app.model.addDispatchToQ(cmdObj,'mutable');
					_app.model.dispatchThis('mutable');
					}
				return false;
				},

//This code opens either the supplier specific inventory or order list.
//the button is present both in the 'list' and in the 'detail'.
//The vendorid is ascertained using 'code' because that's what comes in the list response.
// and it uses closest data- instead of closest tr because in detail mode, the buttons aren't in a tr.
//the code that uses this still uses app events. The dialog this opens uses delegated events.
			adminSupplierProdOrderListShow : function($ele,P)	{
				P.preventDefault();
				if($ele.data('mode') == 'product' || $ele.data('mode') == 'order')	{
					var VENDORID = $ele.closest("[data-code]").data('code');
					
					if(VENDORID)	{
				
						var $D = _app.ext.admin.i.dialogCreate({
							'templateID': ($ele.data('mode') == 'order') ? 'supplierOrderListTemplate' : 'supplierItemListTemplate',
							'title': $ele.data('mode')+" list for vendor "+VENDORID,
							'showLoading' : false,
							'skipDelegation' : true //the dialog is being appended to a parent element which already has delegation on it.
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
								'skipAppEvents' : true,
								'addEventDelegation' : false, //the dialog is being appended to a parent element which already has delegation on it.
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
					
						_app.u.addEventDelegation($D);
						_app.model.addDispatchToQ(cmdObj,'mutable');
						_app.model.dispatchThis('mutable');
				
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_wholesale.e.adminSupplierProdOrderListShow, unable to determine vendorID.','gMessage':true})
						}					
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_wholesale.e.adminSupplierProdOrderListShow, no data-mode set on trigger element.","gMessage":true})
					}
				return false;
				}, //adminSupplierOrderListShow




//////////////////// SCHEDULES


			priceScheduleUpdateShow : function($ele,P)	{
				var SID = $ele.closest('tr').data('sid'); //schedule id
				
				var $panel = _app.ext.admin.i.DMIPanelOpen($ele,{
					'templateID' : 'priceScheduleUpdateTemplate',
					'panelID' : 'schedule_'+SID,
					'header' : 'Edit Price Schedule: '+SID,
					'data' : $ele.closest('tr').data()
					});
				$('form',$panel).append("<input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' \/>");
				_app.u.handleButtons($panel);
				_app.model.dispatchThis('mutable');
				}, //priceScheduleUpdateShow


			priceScheduleCreateShow : function($ele,P)	{
				P.preventDefault();
				
				var $D = _app.ext.admin.i.dialogCreate({
					'title':'Add New Schedule',
					'showLoading':false //will get passed into anycontent and disable showLoading.
					});
			
				$D.anyform().append("<label>Schedule ID <input type='text' size='3' data-minlength='3' maxlength='3' name='SID' value='' data-input-keyup='input-format' data-input-format='alphanumeric uppercase' \/><\/label><br />");
				
				$("<button>Create Schedule<\/button>").button().on('click',function(event){
					event.preventDefault();
					if(_app.u.validateForm($D))	{
						_app.model.addDispatchToQ({
							'_cmd':'adminPriceScheduleCreate',
							'SID': $(this).parent().find("[name='SID']").val(),
							'_tag':	{
								'callback':'showMessaging',
								'jqObj' : $D,
								'jqObjEmpty' : true,
								'message' : 'Your price schedule has been created.'
								}
							},'immutable');
						_app.model.addDispatchToQ({'_cmd':'adminPriceScheduleList','_tag':{'datapointer':'adminPriceScheduleList','callback':'DMIUpdateResults','extension':'admin','jqObj':$ele.closest("[data-app-role='dualModeContainer']")}},'immutable');
						_app.model.dispatchThis('immutable');						
						}
					else	{
						
						}
					}).appendTo($D);
				
				$D.dialog('open');
				},

			priceScheduleRemoveConfirm : function($ele,P)	{
				var SID = $ele.closest('tr').data('sid');
				var $D = _app.ext.admin.i.dialogConfirmRemove({
					'message':'Are you sure you want to delete schedule '+SID+'? There is no undo for this action.',
					'removeButtonText' : 'Delete Price Schedule',
					'removeFunction':function(vars,$modal){
						var $panel = $(_app.u.jqSelector('#','schedule_'+SID));
						if($panel.length)	{
							$panel.anypanel('destroy'); //make sure there is no editor for this schedule still open.
							}
						$ele.closest("[data-app-role='dualModeContainer']").showLoading({"message":"Removing price schedule "+SID});
						_app.model.addDispatchToQ({'_cmd':'adminPriceScheduleRemove','SID':SID},'immutable');
						_app.model.addDispatchToQ({'_cmd':'adminPriceScheduleList','_tag':{'datapointer':'adminPriceScheduleList','callback':'DMIUpdateResults','extension':'admin','jqObj':$ele.closest("[data-app-role='dualModeContainer']")}},'immutable');
						_app.model.dispatchThis('immutable');
						$modal.dialog('close');
						}
					});
				}, //execTicketClose




//////////////////// ORGANIZATIONS


			showMediaLib4OrganizationLogo : function($ele)	{
				var $context = $ele.closest('fieldset');
				mediaLibrary($("[data-app-role='organizationLogo']",$context),$("[name='LOGO']",$context),'Choose Dropship Logo');
				}, //showMediaLib4OrganizationLogo

			execOrganizationSearch : function($ele,P){
				P.preventDefault();
				$('.dualModeListMessaging').empty(); //clear existing messaging.
				var
					$form = $ele.closest('form'),
					sfo = $form.serializeJSON(),
					$dualModeContainer = $form.closest("[data-app-role='dualModeContainer']"),
					$table = $("[data-app-role='dualModeListTable']",$dualModeContainer);
				
				_app.u.dump(" -> $dualModeContainer.length: "+$dualModeContainer.length);
				_app.u.dump(" -> $table.length: "+$table.length);
				
				$("[data-app-role='dualModeResultsTable']",$dualModeContainer).show();
				$("[data-app-role='dualModeDetailContainer']",$dualModeContainer).hide();
/* keywords and searchby are NOT required. if empty, a list of recent orgs will be returned */
				if(sfo)	{
//						_app.u.dump(" -> sfo: "); _app.u.dump(sfo);
					$('tbody',$table).empty(); //clear previous search results.
					$dualModeContainer.showLoading("Searching organizations by "+sfo.searchby+" for "+sfo.keywords);
					
					sfo[sfo.searchby] = sfo.keywords;
					delete sfo.keywords; delete sfo.searchby; //sanitize before sending to API.
					
					sfo._cmd = 'adminCustomerOrganizationSearch';
					sfo._tag = {
						'datapointer' : 'adminCustomerOrganizationSearch',
						'callback' : function(rd){
							$dualModeContainer.hideLoading();

							if(_app.model.responseHasErrors(rd)){
								$form.anymessage({'message':rd})
								}
							else if(_app.data[rd.datapointer] && _app.data[rd.datapointer]['@ORGANIZATIONS'].length === 0){
								$('.dualModeListMessaging').anymessage({'message':'There were no results for your search.'}); //clear existing messaging.
								}
							else	{
								$table.show();
								$table.anycontent({'datapointer':rd.datapointer});
								_app.u.handleCommonPlugins($form);
								_app.u.handleButtons($form);
								}
							}
						};
					_app.model.addDispatchToQ(sfo,'mutable');
					_app.model.dispatchThis('mutable');
					}
				else if (!sfo)	{
					$('#globalMessaging').anymessage({'message':'In admin_wholesale.e.execOrganizationSearch, unable to find form OR to serialize as JSON.','gMessage':true});
					}
				else	{
// never reached, blank search shows last 50 results 
					$('#globalMessaging').anymessage({'message':'Either keywords ['+sfo.keywords+'] or searchby ['+sfo.searchby+'] left blank.'});
					}
				}, //execOrganizationSearch

			execOrganizationRemove : function($ele,P)	{

				P.preventDefault();
				var 
					orgID = $ele.closest('tr').data('orgid');
					$D = _app.ext.admin.i.dialogConfirmRemove({
						message : "Are you sure you want to delete this organization? There is no undo for this action.",
						title : "Permanently Remove Organization",
						removeButtonText : "Remove",
						removeFunction : function()	{
							$D.parent().showLoading({"message":"Deleting Organization..."});
							_app.model.destroy('adminCustomerOrganizationDetail|'+orgID); //nuke this so the org editor can't be opened for a nonexistant org.
							_app.model.addDispatchToQ({
								'_cmd':'adminCustomerOrganizationRemove',
								'ORGID' : orgID,
								'_tag':	{
									'datapointer' : 'adminCustomerOrganizationRemove',
									'callback':function(rd){
										$D.parent().hideLoading();
										if(_app.model.responseHasErrors(rd)){$D.anymessage({'message':rd})}
										else	{
											$D.empty();
											$D.anymessage(_app.u.successMsgObject('The organization has been removed.'));
											$ele.closest('tr').empty().remove(); //remove row in results list.
											$D.dialog( "option", "buttons", [ {text: 'Close', click: function(){$D.dialog('close')}} ] );
											}
										}
									}
								},'immutable');
							_app.model.dispatchThis('immutable');
				
							}
						});
				$D.dialog('open');

				}, //execOrganizationRemove

			adminCustomerOrganizationUpdateExec : function($ele,P)	{
				P.preventDefault();
				var	$form = $ele.closest('form');
				if(_app.u.validateForm($form))	{
					var sfo = $form.serializeJSON({cb:true})
					$form.showLoading({'message':'Saving Changes'});
					if(sfo.DOMAIN)	{
						sfo.DOMAIN = _app.u.getDomainFromURL(sfo.DOMAIN); //cleans off protocol and www.
						}
					_app.model.destroy('adminCustomerOrganizationDetail|'+sfo.ORGID);
					sfo._cmd = 'adminCustomerOrganizationUpdate';
					sfo._tag = {
						'callback' : 'showMessaging',
						'jqObj' : $form,
						'message' : 'Your changes have been saved.'
						};
					_app.model.addDispatchToQ(sfo,'immutable');
					_app.model.dispatchThis('immutable');
					}
				else	{
					//validateForm handles error display
					}
				}, //adminCustomerOrganizationUpdateExec

			adminOrganizationSearchShowUI : function($ele,P)	{
				if($ele.data('searchby') && $ele.data('keywords'))	{
					navigateTo("/ext/admin_wholesale/showOrganizationManager",{'searchby':$ele.data('searchby'),'keywords':$ele.data('keywords')});
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_wholesale.e.adminOrganizationSearchShowUI, either searchby ["+$ele.data('searchby')+"] or keywords  ["+$ele.data('keywords')+"] not set on trigger element.","gMessage":true});
					}
				},



			showOrganizationUpdate : function($ele,P)	{
				P.preventDefault();
				var orgID = $ele.closest('tr').data('orgid');
				if(orgID)	{
					navigateTo("/ext/admin_wholesale/showOrganizationEditor",{'orgID':orgID});
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_wholesale.e.showOrganizationUpdate, unable to ascertain orgID.","gMessage":true});
					}
				}, //showOrganizationUpdate

//triggered within the organization create modal when save is pushed.
			execOrganizationCreate : function($ele,P){
				P.preventDefault();
				var
					$form = $ele.closest('form'),
					sfo = $form.serializeJSON({'cb':true});
				
				if(_app.u.validateForm($form))	{
					$form.showLoading({'message':'Creating New Organization'});
					if(sfo.DOMAIN)	{
						sfo.DOMAIN = _app.u.getDomainFromURL(sfo.DOMAIN); //cleans off protocol and www.
						}
					sfo._cmd = 'adminCustomerOrganizationCreate';
					sfo._tag = {
						'datapointer' : 'adminCustomerOrganizationCreate',
						'callback' : function(rd)	{
							if(_app.model.responseHasErrors(rd)){
								$form.anymessage({'message':rd});
								}
							else	{
								$form.empty().anymessage(_app.u.successMsgObject('The organization has been saved.'));
								$form.append("<h2>What would you like to do next?<\/h2>");
								//sample action. success would go here.
								$form.append($("<button>").text('Edit Org').button().on('click',function(){
									$(this).closest('.ui-dialog-content').dialog('close');
									navigateTo("/ext/admin_wholesale/showOrganizationEditor",{'orgID':_app.data[rd.datapointer].ORGID});
									}));
								$form.append($("<button>").text('Back to Org Manager').button().on('click',function(){
									$(this).closest('.ui-dialog-content').dialog('close');
									}));
								}
							}
						};
					_app.model.addDispatchToQ(sfo,'immutable');
					_app.model.dispatchThis('immutable');
					}
				else	{} //form validation handles error display.
				}, //execOrganizationCreate

//triggered in the editor to show the organiation create form/modal.
			showOrganizationCreate : function($ele,P)	{
				P.preventDefault();
				var $D = _app.ext.admin.i.dialogCreate({
					title : "Add a New Organization",
					anycontent : true, //the dialogCreate params are passed into anycontent
					handleAppEvents : false //defaults to true
					});
				$D.anycontent({'templateID':'organizationManagerOrgCreateUpdateTemplate','data':{}}).anyform();
				$('.buttonset',$D).append("<button data-app-click='admin_wholesale|execOrganizationCreate' class='applyButton'>Create Organization</button>");
				$D.dialog('open');
				_app.u.handleCommonPlugins($D);
				_app.u.handleButtons($D);
				} //showOrganizationCreate

			}, //e [app Events]


		u : {




			}

		} //r object.
	return r;
	}