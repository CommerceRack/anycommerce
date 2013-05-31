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
		'shippingGeneralTemplate',
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
				app.model.destroy('adminConfigDetail|payment|'+app.vars.partition);
				app.ext.admin.calls.adminConfigDetail.init({'payment':true},{datapointer : 'adminConfigDetail|payment|'+app.vars.partition,callback : function(rd){
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
								app.u.handleAppEvents($contentColumn); //handles app events outside the content area.
								app.ext.admin_config.a.showPaymentTypeEditorByTender($li.data('tender'),$contentColumn);
								});
							});
						}
					}},'mutable');
				app.model.dispatchThis('mutable');
				},
			
			showPaymentTypeEditorByTender : function(tender,$target){
//				app.u.dump("BEGIN showPaymentTypeEditorByTender ["+tender+"]");
				if(tender && $target)	{
					$target.empty();
					$target.closest('form').find('.buttonset:first').show().find('button').button('disable').find('.numChanges').text("");
					var payData = app.ext.admin_config.u.getPaymentByTender(tender);
//					app.u.dump(" -> payData: "); app.u.dump(payData);
					$target.append($("<input \/>",{'name':'tender','type':'hidden'}).val(tender));
					switch(tender){
/* offline payment types */
						case 'CASH':
						case 'GIFTCARD':
						case 'PO':
						case 'MO':
						case 'PICKUP':
							$target.append($("<input \/>",{'name':'tenderGroup','type':'hidden'}).val('OFFLINE'));
							$target.anycontent({'templateID':'paymentAvailabilityTemplate',data : payData});
							break;
						
						
						case 'CHECK':
						case 'COD':
						case 'CHKOD':
							$target.append($("<input \/>",{'name':'tenderGroup','type':'hidden'}).val('OFFLINE'));
							$("<div \/>").anycontent({'templateID':'paymentAvailabilityTemplate',data : payData}).appendTo($target);
							$("<div \/>").anycontent({'templateID':'paymentHandlingFeeTemplate',data : payData}).appendTo($target);
							break;
						
						case 'WIRE':
							$target.append($("<input \/>",{'name':'tenderGroup','type':'hidden'}).val('OFFLINE'));
							$("<div \/>").anycontent({'templateID':'paymentAvailabilityTemplate',data : payData}).appendTo($target);
							$("<div \/>").anycontent({'templateID':'paymentHandlingFeeTemplate',data : payData}).appendTo($target);
							$("<div \/>").anycontent({'templateID':'paymentTransferInstructionsTemplate',data : payData}).appendTo($target);
						
							break;

/* gateways */
						case 'ECHECK':
							$target.append($("<input \/>",{'name':'tenderGroup','type':'hidden'}).val('GATEWAY'));
							$("<div \/>").anycontent({'templateID':'paymentAvailabilityTemplate',data : payData}).appendTo($target);
							$("<div \/>").anycontent({'templateID':'paymentEcheckTemplate',data : payData}).appendTo($target);
							break;

						case 'CC':
							$target.append($("<input \/>",{'name':'tenderGroup','type':'hidden'}).val('GATEWAY'));
							$("<div \/>").anycontent({'templateID':'paymentAvailabilityTemplate',data : payData}).appendTo($target);
							$("<div \/>").anycontent({'templateID':'paymentCCTemplate',data : payData}).appendTo($target);
							break;


/* wallets/third party payments */
						case 'GOOGLE':
						case 'PAYPALEC':
						case 'AMZCBA':
							$target.append($("<input \/>",{'name':'tenderGroup','type':'hidden'}).val('WALLET'));
							$target.anycontent({'templateID':'paymentWallet_'+tender.toLowerCase(),data : payData});
							break;


						default:
							$target.anymessage({'message':'In admin_config.a.showPaymentTypeEditorByTender, unrecognized tender: '+tender+'.','gMessage':true});
						}
					app.u.handleAppEvents($target);
					app.ext.admin.u.applyEditTrackingToInputs($target.closest('form'));
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
				
				app.model.destroy('adminConfigDetail|shipping|'+app.vars.partition);
				app.model.destroy('adminConfigDetail|shipmethods|'+app.vars.partition);
				app.ext.admin.calls.appResource.init('shipcountries.json',{},'mutable');
				app.ext.admin.calls.adminConfigDetail.init({'shipping':true},{datapointer : 'adminConfigDetail|shipping|'+app.vars.partition},'mutable');
				app.ext.admin.calls.adminConfigDetail.init({'shipmethods':true},{datapointer : 'adminConfigDetail|shipmethods|'+app.vars.partition,callback : function(rd){
					if(app.model.responseHasErrors(rd)){
						$target.hideLoading();
						$('#globalMessaging').anymessage({'message':rd});
						}
					else	{
						
						$target.anycontent({
							'templateID':'shippingManagerPageTemplate',
							'data':$.extend(true,{},app.data['adminConfigDetail|shipping|'+app.vars.partition],app.data['adminConfigDetail|shipmethods|'+app.vars.partition],app.data['appResource|shipcountries.json'])
							});

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
								
								});
							});
						
						app.ext.admin_config.a.showShipMethodEditorByProvider('GENERAL',$contentColumn);
						
						}
					}},'mutable');
				app.model.dispatchThis('mutable');
				},

			showAddFlexShipment : function(shipmethod,$target)	{
				if(shipmethod && $target)	{
					$target.empty();
					$target.closest('form').find('.buttonset:first').hide() //this contains the buttons for the editor. create has it's own button.
					$("<div \/>").anycontent({'templateID':'shippingFlex_shared',data:{'provider':"FLEX:"+shipmethod+"_"+Math.round(+new Date()/1000)}}).appendTo($target);
					$("[data-app-role='rulesFieldset']",$target).hide(); //disallow rule creation till after ship method is created.
					$target.append("<p><b>Once you save the ship method, more specific inputs and rules will be available.<\/b><\/p>");
					$target.append("<button data-app-event='admin_config|shipmethodAddUpdateExec'>save<\/button>");
//					$("<div \/>").anycontent({'templateID':'shippingFlex_'+shipmethod.toLowerCase(),data:{}}).appendTo($target);
					app.u.handleAppEvents($target,{'handler':shipmethod,'mode':'insert'});
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
					$target.closest('form').find('.buttonset').hide(); //turn this off always. turn on when needed.
					
					if(provider == 'GENERAL')	{
						$target.anycontent({
							'templateID':'shippingGeneralTemplate',
							'data':$.extend(true,{},app.data['adminConfigDetail|shipping|'+app.vars.partition],app.data['adminConfigDetail|shipmethods|'+app.vars.partition])
							});
						}
					else	{
						var shipData = app.ext.admin_config.u.getShipMethodByProvider(provider);
						
						app.ext.admin.u.handleSaveButtonByEditedClass($target.closest('form')); //reset the save button.
						
						if(provider.indexOf('FLEX:') === 0 && shipData.handler)	{
							$target.closest('form').find('.buttonset').show();
							$("<div \/>").anycontent({'templateID':'shippingFlex_shared',data:shipData}).appendTo($target);
							$("<div \/>").anycontent({'templateID':'shippingFlex_'+shipData.handler.toLowerCase(),data:shipData}).appendTo($target);
							}
						else if(provider == 'FEDEX' && !shipData.meter)	{
//the fedex account has not been registered through us yet. show reg form.
							$target.anycontent({'templateID':'shippingFedExRegTemplate',data:{}});
							}
						else if(provider == 'UPS' && !shipData.shipper_number)	{
//the UPS account has not been registered through us yet. show reg form.
							$target.anycontent({'templateID':'shippingUPSOnlineToolsRegTemplate',data:{}});
							}
						
						else if(provider == 'FEDEX' || provider == 'UPS' || provider == 'USPS')	{
							$target.closest('form').find('.buttonset').show();
							$target.anycontent({'templateID':'shippingZone_'+provider.toLowerCase(),data:shipData});
							}
						else if(provider == 'INSURANCE' || provider == 'HANDLING')	{
							$target.closest('form').find('.buttonset').show();
							$target.anycontent({'templateID':'shippingGlobal_'+provider.toLowerCase(),data:shipData});
							}
						else	{
							$target.anymessage({'message':'In admin_config.a.showShipMethodEditorByProvider, unrecognized provider ['+provider+'] passed and/or handler for shipping method could not be determined.','gMessage':true,'persistent':true});
							}
						
						}

					$('label :checkbox',$target).anycb();
					$('.toolTip',$target).tooltip();
					app.u.handleAppEvents($target);
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
				},
			
			showUPSOnlineToolsRegInModal : function(vars)	{
vars = vars || {}; //may include supplier
var $D = $("<div \/>").attr('title',"Apply for UPS onLine Tools / Change Shipper Number")
$D.anycontent({'templateID':'shippingUPSOnlineToolsRegTemplate','data':{},'dataAttribs' : vars });
$D.dialog({
	width : '90%',
	modal: true,
	autoOpen: false,
	close: function(event, ui)	{
		$(this).dialog('destroy').remove();
		}
	});
app.u.handleAppEvents($D);
$D.dialog('open');	
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
					if(app.data['adminConfigDetail|payment|'+app.vars.partition] && app.data['adminConfigDetail|payment|'+app.vars.partition]['@PAYMENTS'])	{
						r = {};
						var payments = app.data['adminConfigDetail|payment|'+app.vars.partition]['@PAYMENTS'], //shortcut
						L = payments.length;
						
						for(var i = 0; i < L; i += 1)	{
							if(payments[i].tender == tender)	{
								r = payments[i];
								break; //have a match. exit early.
								}
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_config.u.getPaymentByTender, adminConfigDetail|payment|'+app.vars.partition+' not in memory and is required.','gMessage':true});
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
//the contents are emptied rather than having several hidden fieldsets so that no extra/unnecesary data is sent on the post (and no white/blacklisting needs to be done).
					if(gateway != 'TESTING' && gateway != 'NONE')	{
						$suppContainer.anycontent({'data':{},'templateID':'paymentSuppInputsTemplate_'+gateway.toLowerCase()});
						}
					});
				$ele.trigger('change.showCCSuppInputs'); //trigger the change to show the selected fieldset (for initial load)
				}, //showCCSuppInputs

//this is applied to the 'add flex method' shipping button.  It adds the dropdown for choosing the method type and also the click events.
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

			shippingPartnerRegExec : function($btn)	{
				$btn.button();
				$btn.off('click.shippingPartnerRegExec').on('click.shippingPartnerRegExec',function(){
					var $form = $btn.closest('form');
					if(app.u.validateForm($form))	{
						
						var sfo = $form.serializeJSON({'cb':true});
					//supplier 'may' be set on the parent container. This is used in supply chain.
						if($btn.closest("[data-app-role='shippingPartnerRegContainer']").data('supplier'))	{
							sfo.supplier = $btn.closest("[data-app-role='shippingPartnerRegContainer']").data('supplier');
							}
						
						if(sfo.provider == 'FEDEX' || sfo.provider == 'UPS')	{
							$form.showLoading({'message':'Registering account. This may take a few moments.'});
							var macroCmd = (sfo.provider == 'FEDEX') ? "FEDEX-REGISTER" : "UPSAPI-REGISTER";
							app.ext.admin.calls.adminConfigMacro.init(["SHIPMETHOD/"+macroCmd+"?"+$.param(sfo)],{'callback':function(rd){
								$form.hideLoading();
								if(app.model.responseHasErrors(rd)){
									$form.anymessage({'message':rd});
									}
								else	{
									$form.empty().anymessage(app.u.successMsgObject('Activation successful!'));
									}
								}},'immutable');
							app.model.dispatchThis('immutable');

							}
						else	{
							$form.anymessage({"message":"In admin_config.e.shippingPartnerRegExec, unable to ascertain provider. Was expecting it in the serialized form.","gMessage":true});
							}
						}
					else	{} //validateForm handles error display.
					});
				},

			paymentMethodUpdateExec : function($btn)	{
				$btn.button();
				$btn.off('click.paymentMethodUpdateExec').on('click.paymentMethodUpdateExec',function(){
					app.u.dump(" -> BEGIN click.paymentMethodUpdateExec (admin_config).");
					var
						$form = $btn.closest('form'),
						sfo = $form.serializeJSON({'cb':true}) || {},
						macroCmd;
					
					if(sfo.tender && sfo.tenderGroup)	{
						
						app.u.dump(" -> tender: "+sfo.tender);
						app.u.dump(" -> tenderGroup: "+sfo.tenderGroup);
						
						if(app.u.validateForm($form))	{
							if(sfo.tenderGroup == 'WALLET')	{
								macroCmd = "PAYMENT/WALLET-"+sfo.tender;
								}
							else	{
								macroCmd = "PAYMENT/"+sfo.tenderGroup;
								}
							app.u.dump(" -> macroCmd: "+macroCmd);
							app.ext.admin.calls.adminConfigMacro.init([macroCmd+"?"+$.param(sfo)],{'callback':'showMessaging','message':'Payment has been updated.','jqObj':$form},'immutable');
					
							app.model.destroy('adminConfigDetail|payment|'+app.vars.partition);
							app.ext.admin.calls.adminConfigDetail.init({'payment':true},{datapointer : 'adminConfigDetail|payment|'+app.vars.partition},'immutable');
							app.model.dispatchThis('immutable');
							}
						else	{app.u.dump("Did not pass validation in admin_config.e.paymentMethodUpdateExec");} //validateForm will display the error logic.
						}
					else	{
						$form.anymessage({"message":"In admin_config.e.paymentMethodUpdateExec, either tender ["+sfo.tender+"] or tenderGroup ["+sfo.tenderGroup+"] not set. Expecting these within the form/sfo.","gMessage":true});
						}
					});
				},
//This is where the magic happens. This button is used in conjunction with a data table, such as a shipping price or weight schedule.
//It takes the contents of the fieldset it is in and adds them as a row in a corresponding table. it will allow a specific table to be set OR, it will look for a table within the fieldset
//the 'or' was necessary because in some cases, such as handling, there are several tables on one page and there wasn't a good way to pass different params into the appEvent handler (which gets executed once for the entire page).
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

//deletes a given shipmethod/provider. then reloads shippingManager.
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

//saves the changes for a shipmethod/provider.
//also used for a new flex shipping method. In that case, add a data-mode='insert' to the button to trigger the additional macro.
			shipmethodAddUpdateExec : function($btn,vars)	{
				$btn.button();
				vars = vars || {};
				$btn.off('click.shipmethodAddUpdateExec').on('click.shipmethodAddUpdateExec',function(){

					var
						$form = $btn.closest('form'),
						sfo = $form.serializeJSON({'cb':true}), //cb true returns checkboxes w/ 1 or 0 based on whether it's checked/unchecked, respecticely. strings, not ints.
						$dataTable = $("[data-app-role='dataTable']",$form), //a table used for data such as price breakdowns on a flex priced based ship method (or zip,weight,etc data)
						macros = new Array(),
						callback = 'handleMacroUpdate'; //will be changed if in insert mode.
					
					if(app.u.validateForm($form))	{
						
						if(vars.mode == 'insert')	{
							callback = function(rd){
								app.ext.admin_config.a.showShipMethodEditorByProvider(sfo.provider,$btn.closest("[data-app-role='slimLeftContent']"))
								}; //
							macros.push("SHIPMETHOD/INSERT?provider="+sfo.provider+"&handler="+vars.handler);
							}
						
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
					
						app.ext.admin.calls.adminConfigMacro.init(macros,{'callback':callback,'extension':'admin_syndication','jqObj':$form},'immutable');
					//nuke and re-obtain shipmethods so re-editing THIS method shows most up to date info.
						app.model.destroy('adminConfigDetail|shipmethods|'+app.vars.partition);
						app.ext.admin.calls.adminConfigDetail.init({'shipmethods':true},{datapointer : 'adminConfigDetail|shipmethods|'+app.vars.partition},'immutable');
					
					//	app.u.dump(" -> macros"); app.u.dump(macros);
						app.model.dispatchThis('immutable');
						}
					else	{
						//validateForm handles error display
						}
					});
				}, //shipmethodAddUpdateExec

//executed on a mange rules button.  shows the rule builder.
			ruleBuilderShow : function($btn)	{
				$btn.button();
				$btn.off('click.ruleBuilderShow').on('click.ruleBuilderShow',function(event){
					event.preventDefault();
					var provider = $btn.closest('form').find("[name='provider']").val();
					if(provider && $btn.data('table'))	{
						app.ext.admin_config.a.showRulesBuilderInModal({'mode':'shipping','provider':provider,'table':$btn.data('table')});
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_config.e.ruleBuilderShow, unable to ascertain provider ['+provider+'] and/or table ['+$btn.data('table')+'].','gMessage':true});
						}
					});
// return false;				
				},

//executed by the 'add new rule' button. opens a dialog and, on save, updates the tbody of the rule builder.
//the rule is NOT actually saved until the 'save' button is pushed.
			ruleBuilderAddShow : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-plus"},text: true});
				$btn.off('click.ruleBuilderAddShow').on('click.ruleBuilderAddShow',function(){
					var $D = $("<div \/>").attr('title',"Add New Rule");
//					$D.addClass('displayNone').appendTo('body'); 
//on a new rule, guid needs to be set. there's a hidden input in the form that, by passing it in thru data, will get populated.
//this allows for the editing of a new rule before it is saved.
					$D.anycontent({'templateID':'rulesFieldset_shipping','data': $.extend(true,{'guid':app.u.guidGenerator()},app.data['adminWholesaleScheduleList'])});
					$D.dialog({
						width : '90%',
						modal: true,
						autoOpen: false,
						close: function(event, ui)	{
							$(this).dialog('destroy').remove();
							}
						});
					$D.dialog('open');
					app.u.handleAppEvents($D,{'$form':$btn.closest('form'),'$dataTbody':$btn.closest('form').find("[data-app-role='dualModeListContents']")});
//add an extra event to the rule button to close the modal. The template is shared w/ the rule edit panel, so the action is not hard coded into the app event.
					$("[data-app-event='admin_config|dataTableAddExec']",$D).on('click.closeModal',function(){
						$D.dialog('close');
						})			
					})
				},

//executed by the 'save' button once new rules or rule order has changed.
			ruleBuilderUpdateExec : function($btn)	{
				$btn.button();
				$btn.off('click.ruleBuilderUpdateExec').on('click.ruleBuilderUpdateExec',function(event){
event.preventDefault();

$btn.closest('.ui-dialog-content').showLoading({'message':'Updating Rules'});

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

app.ext.admin.calls.adminConfigMacro.init(macros,{'callback':function(rd){
	if(app.model.responseHasErrors(rd)){
		$('#globalMessaging').anymessage({'message':rd});
		}
	else	{
		$btn.closest('.ui-dialog-content').dialog('close');
		$('#globalMessaging').anymessage(app.u.successMsgObject('Your rules have been saved.'));
		}
	}},'immutable');

//need to get shipments updated so that the rules for the method are updated in memory. important if the user comes right back into the editor.
app.model.destroy('adminConfigDetail|shipmethods|'+app.vars.partition);
app.ext.admin.calls.adminConfigDetail.init({'shipmethods':true},{datapointer : 'adminConfigDetail|shipmethods|'+app.vars.partition},'immutable');


app.model.dispatchThis('immutable');

					});
				},
//opens an editor for an individual rule. uses anypanel/dualmode
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
				}
			} //e [app Events]
		} //r object.
	return r;
	}