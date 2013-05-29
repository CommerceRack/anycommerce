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



//    !!! ->   TODO: replace 'username' in the line below with the merchants username.     <- !!!

var admin_config = function() {
	var theseTemplates = new Array(
		'paymentManagerPageTemplate',
/*		
		'paymentAvailabilityTemplate',
		'paymentHandlingFeeTemplate',
		'paymentTransferInstructionsTemplate',
		'paymentCCTemplate',
		'paymentEcheckTemplate',
		'paymentWallet_google',
		'paymentWallet_paypalec',
		'paymentWallet_amzcba',
		'paymentSuppInputsTemplate_manual',
		'paymentSuppInputsTemplate_paypalwp',
		'paymentSuppInputsTemplate_verisign',
		'paymentSuppInputsTemplate_authorizenet',
		'paymentSuppInputsTemplate_linkpoint',
		'paymentSuppInputsTemplate_echo',
		'paymentSuppInputsTemplate_skipjack',
*/		
		'shippingManagerPageTemplate',
/*		
		'shippingZone_fedex',
		'shippingZone_usps',
		'shippingZone_ups',
		
		'shippingGlobal_handling',
		'shippingGlobal_insurance',
		
		'shippingFlex_shared',
		'shippingFlex_fixed',
		'shippingFlex_local',
		'shippingFlex_local_canada',
		'shippingFlex_free',
		'shippingFlex_simple',
		'shippingFlex_weight',
		'shippingFlex_price',
		
		'shippingLocalRowTemplate',
		'shippingWeightRowTemplate',
		'shippingPriceRowTemplate',
*/		
		'ruleBuilderTemplate',
		'ruleBuilderRowTemplate',
		'rulesFieldset_shipping',
		
		'contactInformationTemplate',
		'taxConfigTemplate',
		'taxConfigRuleRowTemplate'
		);
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
//the list of templates in theseTemplate intentionally has a lot of the templates left off.  This was done intentionally to keep the memory footprint low. They'll get loaded on the fly if/when they are needed.
				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/config.html',theseTemplates);
				r = true;

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
			showPaymentManager : function($target)	{
				$target.showLoading({'message':'Fetching your Active Payment Methods'});
				app.model.destroy('adminConfigDetail|payment');
				app.ext.admin.calls.adminConfigDetail.init({'payment':true},{datapointer : 'adminConfigDetail|payment',callback : function(rd){
					if(app.model.responseHasErrors(rd)){
						$('#globalMessaging').anymessage({'message':rd});
						}
					else	{
						$target.hideLoading();
						$target.anycontent({'templateID':'paymentManagerPageTemplate',data:{}});
						app.u.handleAppEvents($target);
						
						var
							$leftColumn = $("[data-app-role='slimLeftNav']",$target),
							$contentColumn = $("[data-app-role='slimLeftContent']",$target);
						
						$leftColumn.find('li').each(function(){
							var $li = $(this);
							$li.addClass('ui-corner-none pointer').on('click',function(){
								$('.ui-state-focus',$leftColumn).removeClass('ui-state-focus');
								$li.addClass('ui-state-focus');
								$("[data-app-role='slimLeftContentSection'] .heading",$target).text("Edit: "+$li.text());
								app.ext.admin_config.a.showPaymentTypeEditorByTender($li.data('tender'),$contentColumn)
								app.u.handleAppEvents($contentColumn);
								});
							});
						}
					}},'mutable');
				app.model.dispatchThis('mutable');
				},
			
			showPaymentTypeEditorByTender : function(tender,$target){
				if(tender && $target)	{
					$target.empty();
					var payData = app.ext.admin_config.u.getPaymentByTender(tender);
					app.u.dump(" -> payData: "); app.u.dump(payData);
					switch(tender){
/* offline payment types */
						case 'CASH':
						case 'GIFTCARD':
						case 'PO':
						case 'MO':
						case 'PICKUP':
							$target.anycontent({'templateID':'paymentAvailabilityTemplate',data : payData});
							break;
						
						
						case 'CHECK':
						case 'COD':
						case 'CHKOD':
							$("<div \/>").anycontent({'templateID':'paymentAvailabilityTemplate',data : payData}).appendTo($target);
							$("<div \/>").anycontent({'templateID':'paymentHandlingFeeTemplate',data : payData}).appendTo($target);
							break;
						
						case 'WIRE':
							$("<div \/>").anycontent({'templateID':'paymentAvailabilityTemplate',data : payData}).appendTo($target);
							$("<div \/>").anycontent({'templateID':'paymentHandlingFeeTemplate',data : payData}).appendTo($target);
							$("<div \/>").anycontent({'templateID':'paymentTransferInstructionsTemplate',data : payData}).appendTo($target);
						
							break;

/* gateways */
						case 'ECHECK':
							$("<div \/>").anycontent({'templateID':'paymentAvailabilityTemplate',data : payData}).appendTo($target);
							$("<div \/>").anycontent({'templateID':'paymentEcheckTemplate',data : payData}).appendTo($target);
							break;

						case 'CC':
							$("<div \/>").anycontent({'templateID':'paymentAvailabilityTemplate',data : payData}).appendTo($target);
							$("<div \/>").anycontent({'templateID':'paymentCCTemplate',data : payData}).appendTo($target);
							break;


/* wallets/third party payments */
						case 'GOOGLE':
						case 'PAYPALEC':
						case 'AMZCBA':
							$target.anycontent({'templateID':'paymentWallet_'+tender.toLowerCase(),data : payData});
							break;


						default:
							$target.anymessage({'message':'In admin_config.a.showPaymentTypeEditorByTender, unrecognized tender: '+tender+'.','gMessage':true});
						}

					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_config.a.showPaymentTypeEditorByTender, both $target ['+typeof $target+'] and tender ['+tender+'] are required.','gMessage':true});
					}
				},
				
			showContactInformation : function($target)	{
				$target.showLoading({'message':'Fetching Contact Details'});
//				app.model.destroy('adminConfigDetail|account|'+app.vars.partition);
				app.ext.admin.calls.adminConfigDetail.init({'account':true},{'templateID':'contactInformationTemplate','datapointer' : 'adminConfigDetail|account|'+app.vars.partition, 'callback' : 'anycontent','jqObj':$target},'mutable');
				app.model.dispatchThis('mutable');
				},
		
			showTaxConfig : function($target)	{
				$target.empty().showLoading({'message':'Fetching Tax Details'});
				var datapointer = 'adminConfigDetail|taxes|'+app.vars.partition
				app.model.destroy(datapointer);
				app.ext.admin.calls.adminConfigDetail.init({'taxes':true},{'datapointer' : datapointer, 'callback' : function(rd){
if(app.model.responseHasErrors(rd)){
	$('#globalMessaging').anymessage({'message':rd});
	}
else	{
	$target.hideLoading();
	$target.anycontent({'templateID':'taxConfigTemplate','datapointer':rd.datapointer});
	
	$('.gridTable',$target).anytable();
	$('.toolTip',$target).tooltip();
	$(':checkbox',$target).anycb();
	$("[name='expires']",$target).datepicker({
		changeMonth: true,
		changeYear: true,
		minDate: 0,
		dateFormat : "yymmdd"
		});
	
	app.u.handleAppEvents($target);
	}

					}},'mutable');
				app.model.dispatchThis('mutable');
				},
			
			showShippingManager : function($target)	{
				$target.showLoading({'message':'Fetching your Active Shipping Methods'});
				app.model.destroy('adminConfigDetail|shipmethods|'+app.vars.partition);
				app.ext.admin.calls.adminConfigDetail.init({'shipmethods':true},{datapointer : 'adminConfigDetail|shipmethods|'+app.vars.partition,callback : function(rd){
					if(app.model.responseHasErrors(rd)){
						$('#globalMessaging').anymessage({'message':rd});
						}
					else	{
						$target.hideLoading();
						$target.anycontent({'templateID':'shippingManagerPageTemplate',data:{}});
						var shipmethods = new Array();
						if(app.data['adminConfigDetail|shipmethods|'+app.vars.partition] && app.data['adminConfigDetail|shipmethods|'+app.vars.partition]['@SHIPMETHODS'])	{
							shipmethods = app.data['adminConfigDetail|shipmethods|'+app.vars.partition]['@SHIPMETHODS'];
							}

						var
							L = shipmethods.length,
							$flexUL = $("[data-app-role='shipMethodsByFlex']",$target);
						
						for(var i = 0; i < L; i += 1)	{
							if(shipmethods[i].provider.indexOf('FLEX:') === 0)	{
								$("<li \/>").data('provider',shipmethods[i].provider).text(shipmethods[i].name).appendTo($flexUL);
								}
							}
						
						app.u.handleAppEvents($target);
						
						var
							$leftColumn = $("[data-app-role='slimLeftNav']",$target),
							$contentColumn = $("[data-app-role='slimLeftContent']",$target);
						// 
						$("[data-app-role='shipMethodsByZone']:first, [data-app-role='shipMethodsGlobal']:first, [data-app-role='shipMethodsByFlex']:first",$leftColumn).find('li').each(function(){
							var $li = $(this);
							$li.addClass('ui-corner-none pointer').on('click',function(){
								$('.ui-state-focus',$leftColumn).removeClass('ui-state-focus');
								$li.addClass('ui-state-focus');
								$("[data-app-role='slimLeftContentSection'] .heading",$target).text("Edit: "+$li.text());
								app.ext.admin_config.a.showShipMethodEditorByProvider($li.data('provider'),$contentColumn)
								app.u.handleAppEvents($contentColumn);
								});
							});
						}
					}},'mutable');
				app.model.dispatchThis('mutable');
				},

			showAddFlexShipment : function(shipmethod,$target)	{
				if(shipmethod && $target)	{
					$target.empty();
					$("<div \/>").anycontent({'templateID':'shippingFlex_shared',data:{}}).appendTo($target);
					$("[data-app-role='rulesFieldset']",$target).hide(); //disallow rule creation till after ship method is created.
					$target.append("<p><b>Once you save the ship method, more specific inputs and rules will be available.<\/b><\/p>");
					$target.append("<button>save<\/button>");
//					$("<div \/>").anycontent({'templateID':'shippingFlex_'+shipmethod.toLowerCase(),data:{}}).appendTo($target);
					}
				else if($target)	{
					$target.anymessage({'message':'In admin_config.a.showAddFlexShipment, shipmethod not passed.','gMessage':true});
					}
				else	{
					$("#globalMessaging").anymessage({'message':'In admin_config.a.showAddFlexShipment, shipmethod and target not passed.','gMessage':true});
					}
				},

			showShipMethodEditorByProvider : function(provider,$target)	{
				
				if(provider && $target)	{
					$target.empty();
					var shipData = app.ext.admin_config.u.getShipMethodByProvider(provider);
					
					$target.closest('form').find('.buttonset').show();
					app.ext.admin.u.handleSaveButtonByEditedClass($target.closest('form')); //reset the save button.
					
					if(provider.indexOf('FLEX:') === 0 && shipData.handler)	{
						$("<div \/>").anycontent({'templateID':'shippingFlex_shared',data:shipData}).appendTo($target);
						$("<div \/>").anycontent({'templateID':'shippingFlex_'+shipData.handler.toLowerCase(),data:shipData}).appendTo($target);
						}
					else if(provider == 'FEDEX' || provider == 'UPS' || provider == 'USPS')	{
						$target.anycontent({'templateID':'shippingZone_'+provider.toLowerCase(),data:shipData});
						}
					else if(provider == 'INSURANCE' || provider == 'HANDLING')	{
						$target.anycontent({'templateID':'shippingGlobal_'+provider.toLowerCase(),data:shipData});
						}
					else	{
						$target.anymessage({'message':'In admin_config.a.showShipMethodEditorByProvider, unrecognized provider ['+provider+'] passed and/or handler for shipping method could not be determined.','gMessage':true});
						}
					
					$('label :checkbox',$target).anycb();
					$('.toolTip',$target).tooltip();
					app.ext.admin.u.applyEditTrackingToInputs($target.closest('form'));
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_config.a.showShipMethodEditorByProvider, both $target ['+typeof $target+'] and provider ['+provider+'] are required.','gMessage':true});
					}
				
				},
			
			showRulesBuilderInModal : function(vars)	{
				vars = vars || {};

				if((vars.mode == 'shipping' && vars.provider && vars.table) || vars.mode == 'promotions')	{


var $D = $("<div \/>").attr('title',"Rule Builder: "+vars.mode);
if(vars.mode == 'shipping')	{
	$D.attr({'data-provider':vars.provider,'data-table':vars.table})
	}
$D.addClass('displayNone').appendTo('body'); 

$D.dialog({
	width : '90%',
	modal: true,
	autoOpen: false,
	close: function(event, ui)	{
		$(this).dialog('destroy').remove();
		},
	buttons: [ 
		{text: 'Cancel', click: function(){
			$D.dialog('close');
			if(typeof vars.closeFunction === 'function')	{
				vars.closeFunction($(this));
				}
			}}	
		]
	});
$D.dialog('open');


//need pricing schedules. This is for shipping.
app.ext.admin.calls.adminWholesaleScheduleList.init({},'mutable');
app.ext.admin.calls.adminConfigDetail.init({'shipmethods':true},{datapointer : 'adminConfigDetail|shipmethods|'+app.vars.partition,callback : function(rd){
	$D.hideLoading();
	if(app.model.responseHasErrors(rd)){
		$D.anymessage({'message':rd});
		}
	else	{
		$D.anycontent({'templateID':'ruleBuilderTemplate','data':app.ext.admin_config.u.getShipMethodByProvider(vars.provider)});
		$("[data-app-role='dualModeListContents']",$D).sortable().on("sortupdate",function(evt,ui){
				ui.item.addClass('edited');
				app.ext.admin.u.handleSaveButtonByEditedClass(ui.item.closest('form'));
				});;
		app.u.handleAppEvents($D);
		}
	}},'mutable');
app.model.dispatchThis('mutable');

					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_config.a.showRulesBuilderInModal, invalid/no mode ['+vars.mode+'] was passed or a required param based on mode was not set. see console for vars.','gMessage':true});
					app.u.dump("admin_config.a.showRulesBuilderInModal vars: "); app.u.dump(vars);
					}
				var $dialog = $("<div \/>");
				}
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		renderFormats : {

			}, //renderFormats

////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		u : {
			
	
			getPaymentByTender : function(tender)	{
				var r = false; //returns false if an error occurs. If no error, either an empty object OR the payment details are returned.
				if(tender)	{
					if(app.data['adminConfigDetail|payment'] && app.data['adminConfigDetail|payment']['@PAYMENTS'])	{
						r = {};
						var payments = app.data['adminConfigDetail|payment']['@PAYMENTS'], //shortcut
						L = payments.length;
						
						for(var i = 0; i < L; i += 1)	{
							if(payments[i].tender == tender)	{
								r = payments[i];
								break; //have a match. exit early.
								}
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_config.u.getPaymentByTender, adminConfigDetail|payment not in memory and is required.','gMessage':true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_config.u.getPaymentByTender, no tender passed.','gMessage':true});
					}
				return r;
				},

			getShipMethodByProvider : function(provider)	{
				var r = false; //returns false if an error occurs. If no error, either an empty object OR the payment details are returned.
				if(provider)	{
					if(app.data['adminConfigDetail|shipmethods|'+app.vars.partition] && app.data['adminConfigDetail|shipmethods|'+app.vars.partition]['@SHIPMETHODS'])	{
						r = {};
						var
							shipmethods = app.data['adminConfigDetail|shipmethods|'+app.vars.partition]['@SHIPMETHODS'], //shortcut
							L = shipmethods.length;
						
						for(var i = 0; i < L; i += 1)	{
							if(shipmethods[i].provider == provider)	{
								r = shipmethods[i];
								break; //have a match. exit early.
								}
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_config.u.getShipMethodByProvider, adminConfigDetail|shipmethods not in memory and is required.','gMessage':true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_config.u.getShipMethodByProvider, no provider passed.','gMessage':true});
					}
				return r;
				}
			
			}, //u [utilities]

////////////////////////////////////   EVENTS [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		e : {
			showCCSuppInputs : function($ele)	{
				$ele.off('change.showCCSuppInputs').on('change.showCCSuppInputs',function(){
					var
						gateway = $ele.val(),
						$suppContainer = $("[data-app-role='providerSpecificInputs']",$ele.closest('form'));
					$suppContainer.empty();
					if(gateway != 'TESTING' && gateway != 'NONE')	{
						$suppContainer.anycontent({'data':{},'templateID':'paymentSuppInputsTemplate_'+gateway.toLowerCase()});
						}
					});
				}, //showCCSuppInputs
			
			handleAddShipment : function($ele)	{
				var
					$menu = $ele.next('ul')
					$pageContainer = $ele.closest("[data-app-role='slimLeftContainer']");
					
				$menu.menu().hide().css({'width':'200','position':'absolute'});
				$('button:first',$ele).button().off('click.handleAddShipment').on('click.handleAddShipment',function(){
					$(this).next('button').trigger('click'); //trigger the dropdown on the down arrow button.
					});
				$('button:last',$ele).button({text: false,icons: {primary: "ui-icon-triangle-1-s"}}).off('click.handleAddShipment').on('click.handleAddShipment',function(){
					//show the menu for selecting what type of flex method.
					$menu.show().position({
						my: "right top",
						at: "right bottom",
						of: this
						});
//hide the menu if the doc is clicked anywhere else. add w/ timeout so initial 'click' doesn't trigger the one.click.
					setTimeout(function(){
						$( document ).one( "click", function() {
							$menu.hide();
							});
						},500);

					});
				$ele.buttonset();
				
				$('a',$menu).each(function(){
					var $a = $(this);
//					app.u.dump("$a.data('shipmethod'): "+$a.data('shipmethod'));
					$a.on('click',function(event){
						event.preventDefault();
						app.u.dump(" -> add new "+$a.data('shipmethod')+" shipmethod");
						$("h3.heading:first",$pageContainer).text("Add New Flex Shipmethod: "+$a.text());
						app.ext.admin_config.a.showAddFlexShipment($a.data('shipmethod'),$("[data-app-role='slimLeftContent']:first",$pageContainer));
						});
					});
				
				}, //handleAddShipment
			
			dataTableAddExec : function($btn,vars)	{
				$btn.button();
				$btn.off('click.dataTableAddExec').on('click.dataTableAddExec',function(event){
event.preventDefault();

app.u.dump("BEGIN admin_config.e.dataTableAddExec");

var
	$fieldset = $btn.closest('fieldset'),
//tbody can be passed in thru vars or, if not passed, it will look for one within the fieldset. rules engine uses vars approach. shipping doesn't. same for form.
	$dataTbody = (vars['$dataTbody']) ? vars['$dataTbody'] : $("[data-app-role='dataTable'] tbody",$fieldset),
	$form = (vars['$form']) ? vars['$form'] : $fieldset.closest('form');


if($fieldset.length && $dataTbody.length && $dataTbody.data('bind'))	{
	app.u.dump(" -> all necessary jquery objects found. databind set on tbody.");
//none of the table data inputs are required because they're within the parent 'edit' form and in that save, are not required.
//so temporarily make inputs required for validator. then unrequire them at the end. This feels very dirty.
//	$('input',$fieldset).attr('required','required'); 
	if(app.u.validateForm($fieldset))	{
		app.u.dump(" -> form is validated.");
		var 
			bindData = app.renderFunctions.parseDataBind($dataTbody.attr('data-bind')),
			sfo = $fieldset.serializeJSON(),
			$tr = app.renderFunctions.createTemplateInstance(bindData.loadsTemplate,sfo);
		
		$tr.anycontent({data:sfo});
		$tr.addClass('edited');
		$tr.addClass('isNewRow'); //used in the 'save'. if a new row immediately gets deleted, it isn't added.

//if a row already exists with this guid, this is an UPDATE, not an ADD.
		if(sfo.guid && $("tr[data-guid='"+sfo.guid+"']",$dataTbody).length)	{
			$("tr[data-guid='"+sfo.guid+"']",$dataTbody).replaceWith($tr);
			}
		else	{
			$tr.appendTo($dataTbody);
			}
		app.u.handleAppEvents($tr);
//this function will look for .edited in the form and, if present, enable and update the save button.
		app.ext.admin.u.handleSaveButtonByEditedClass($form);
		}
	else	{
		app.u.dump("form did not validate");
		//validateForm handles error display.
		}
//	$('input',$fieldset).attr('required','').removeAttr('required');
	
	}
else	{
	$btn.closest('form').anymessage({"message":"In admin_config.e.dataTableAddExec, unable to ascertain parent fieldset ["+$fieldset.length+"], tbody for data table or that tbody ["+$dataTbody.length+"] has no bind-data.","gMessage":true});
	app.u.dump(" -> $fieldset.length: "+$fieldset.length);
	app.u.dump(" -> $dataTbody.length: "+$dataTbody.length);
	app.u.dump(" -> $dataTbody.data('bind'): "); app.u.dump($dataTbody.data('bind'));
	}


					});
				}, //dataTableAddExec
			
			shipmethodRemoveExec : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: true});
				$btn.off('click.shipmethodRemoveExec').on('click.shipmethodRemoveExec',function(event){
					event.preventDefault();
					var
						$D = $("<div \/>").attr('title',"Delete Shipping Method"),
						$form = $btn.closest('form'),
						provider = $("[name='provider']",$form).val();
					if(provider)	{
						$D.append("<P class='defaultText'>Are you sure you want to delete Shipping Method "+provider+"? There is no undo for this action.<\/P>");
						$D.addClass('displayNone').appendTo('body'); 
						$D.dialog({
							modal: true,
							autoOpen: false,
							close: function(event, ui)	{
								$(this).dialog('destroy').remove();
								},
							buttons: [ 
								{text: 'Cancel', click: function(){$D.dialog('close')}},
								{text: 'Delete Ship Method', click: function(){
									$D.parent().showLoading({"message":"Deleting Ship Method "+provider});
									app.model.destroy('adminConfigDetail|shipmethods|'+app.vars.partition);
									app.ext.admin.calls.adminConfigMacro.init(["SHIPMETHOD/REMOVE?provider="+provider],{'callback':function(){
if(app.model.responseHasErrors(rd)){
	$('#globalMessaging').anymessage({'message':rd});
	}
else	{
	app.ext.admin_config.a.showShippingManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).empty());
	}
										}},'immutable');
									app.model.dispatchThis('immutable');
									}}	
								]
							});
						$D.dialog('open');
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_config.e.shipmethodRemoveExec, unable to ascertain provider for ship method to be deleted.','gMessage':true});
						}
					});
				}, //shipmethodRemoveExec
			
			shipmethodAddUpdateExec : function($btn)	{
				$btn.button();
				$btn.off('click.shipmethodAddUpdateExec').on('click.shipmethodAddUpdateExec',function(){

var
	$form = $btn.closest('form'),
	sfo = $form.serializeJSON({'cb':true}), //cb true returns checkboxes w/ 1 or 0 based on whether it's checked/unchecked, respecticely. strings, not ints.
	$dataTable = $("[data-app-role='dataTable']",$form), //a table used for data such as price breakdowns on a flex priced based ship method (or zip,weight,etc data)
	macros = new Array();

if(app.u.validateForm($form))	{
	//shipping updates are destructive, so the entire form needs to go up.
	macros.push("SHIPMETHOD/UPDATE?"+$.param(sfo));


//The following block is for handling data/fee tables.

//currently, handling and insurance have multiple tables, so they get handled slight differently, a table is passed in addition to provider.
	if(sfo.provider == 'HANDLING' || sfo.provider == 'INSURANCE')	{
		$dataTable.each(function(){
			var tableID = $(this).attr('data-table');
			macros.push("SHIPMETHOD/DATATABLE-EMPTY?provider="+sfo.provider+"&table="+tableID);
			$('tbody',$(this)).find('tr').each(function(){
				if($(this).hasClass('rowTaggedForRemove'))	{} //row is being deleted. do not add. first macro clears all, so no specific remove necessary.
				else	{
					macros.push("SHIPMETHOD/DATATABLE-INSERT?provider="+sfo.provider+"&table="+tableID+"&"+app.ext.admin.u.getSanitizedKVPFromObject($(this).data()));
					}
				});
			});
		}
//currently, only insurance and handling have more than one data table. If that changes, the code below will need updating.
	else if($dataTable.length && sfo.provider)	{
		macros.push("SHIPMETHOD/DATATABLE-EMPTY?provider="+sfo.provider);
		$('tbody',$dataTable).find('tr').each(function(){
			if($(this).hasClass('rowTaggedForRemove'))	{} //row is being deleted. do not add. first macro clears all, so no specific remove necessary.
			else	{
				macros.push("SHIPMETHOD/DATATABLE-INSERT?provider="+sfo.provider+"&"+app.ext.admin.u.getSanitizedKVPFromObject($(this).data()));
				}
			});
		}
	else if($dataTable.length)	{
		$form.anymessage({"message":"Something has gone wrong with the save. The rows added to the table could not be updated. Please try your save again and if the error persists, please contact the site administrator. If you made other changes and no error was reported besides this one, they most likely saved. In admin_config.e.shipmethodAddUpdateExec, unable to ascertain provider for datatable update.","gMessage":false});
		}
	else	{} //perfectlynormal to not have a data table.

//	app.u.dump(" -> macros"); app.u.dump(macros);
	app.ext.admin.calls.adminConfigMacro.init(macros,{'callback':'handleMacroUpdate','extension':'admin_syndication','jqObj':$form},'immutable');
	app.model.dispatchThis('immutable');
	}
else	{
	//validateForm handles error display
	}
					});
				}, //shipmethodAddUpdateExec
			
			ruleBuilderUpdateExec : function($btn)	{
				$btn.button();
				$btn.off('click.ruleBuilderUpdateExec').on('click.ruleBuilderUpdateExec',function(event){
event.preventDefault();

var
	$dualModeContainer = $btn.closest("[data-app-role='dualModeContainer']"),
	$tbody = $("[data-app-role='dualModeListContents']",$dualModeContainer).first(),
	macros = new Array(),
	provider = $btn.closest('[data-provider]').data('provider'),
	table = $btn.closest('[data-table]').data('table');


macros.push("SHIPMETHOD/RULESTABLE-EMPTY?provider="+provider+"&table="+table);
$('tr',$tbody).each(function(){
	if($(this).hasClass('rowTaggedForRemove'))	{} //row tagged for delete. do not insert.
	else	{
		macros.push("SHIPMETHOD/RULESTABLE-INSERT?provider="+provider+"&table="+table+"&"+app.ext.admin.u.getSanitizedKVPFromObject($(this).data()));
		}
	});
//app.u.dump(' -> macros: '); app.u.dump(macros);

app.ext.admin.calls.adminConfigMacro.init(macros,[],'immutable');
app.model.dispatchThis('immutable');

					});
				},
			
			showRuleEditorAsPanel : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				$btn.off('click.showRuleEditorAsPanel').on('click.showRuleEditorAsPanel',function(){

var
	$container = $btn.closest("[data-app-role='dualModeContainer']"),
	data = $btn.closest('tr').data(),
	provider = $btn.closest("[data-provider]").data('provider'),
	$target = $("[data-app-role='dualModeDetail']",$container)
	panelID = app.u.jqSelector('','ruleBuilder_'+data.provider);
app.u.dump(" -> provider: "+provider);
$panel = $("<div\/>").hide().anypanel({
	'header':'Edit: '+data.name,
	data : $.extend(true,{},app.data['adminWholesaleScheduleList'],$btn.closest('tr').data()), //app.ext.admin_config.u.getShipMethodByProvider(provider)['@RULES'][$btn.closest('tr').attr('data-obj_index')]
	'templateID':'rulesFieldset_shipping'
	}).prependTo($target);
app.ext.admin.u.toggleDualMode($container,'detail');
$panel.slideDown('fast');
//the schedule render format doesn't have a good mechanism for pre-checking a value.
if(data.schedule)	{
	$("[name='SCHEDULE']",$panel).val();
	}
app.u.handleAppEvents($panel,{'$dataTbody':$btn.closest('tbody'),'$form':$btn.closest('form')});			
					});
				},
			
			showAddRule : function($btn)	{
//				$btn.button({icons: {primary: "ui-icon-plus"},text: true});
//				$btn.off('click.showAddRule').on('click.showAddRule',function(){});
				}
			} //e [app Events]
		} //r object.
	return r;
	}