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
		
		'shippingManagerPageTemplate',
		
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
		
		'ruleBuilderTemplate',
		'ruleBuilderRowTemplate',
		'rulesFieldset_shipping',
		
		'contactInformationTemplate'
		);
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/config.html',theseTemplates);
				//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
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
				app.model.destroy('adminConfigDetail|account|'+app.vars.partition);
				app.ext.admin.calls.adminConfigDetail.init({'account':true},{'templateID':'contactInformationTemplate','datapointer' : 'adminConfigDetail|account|'+app.vars.partition, 'callback' : 'anycontent','jqObj':$target},'mutable');
				app.model.dispatchThis('mutable');
				},
			
			showShippingManager : function($target)	{
				$target.showLoading({'message':'Fetching your Active Shipping Methods'});
				app.model.destroy('adminConfigDetail|shipments|'+app.vars.partition);
				app.ext.admin.calls.adminConfigDetail.init({'shipments':true},{datapointer : 'adminConfigDetail|shipments|'+app.vars.partition,callback : function(rd){
					if(app.model.responseHasErrors(rd)){
						$('#globalMessaging').anymessage({'message':rd});
						}
					else	{
						$target.hideLoading();
						$target.anycontent({'templateID':'shippingManagerPageTemplate',data:{}});
						
						var
							shipments = app.data['adminConfigDetail|shipments|'+app.vars.partition]['@SHIPMENTS'], //shortcut
							L = shipments.length,
							$flexUL = $("[data-app-role='shipMethodsByFlex']",$target);
						
						for(var i = 0; i < L; i += 1)	{
							if(shipments[i].provider.indexOf('FLEX:') === 0)	{
								$("<li \/>").data('provider',shipments[i].provider).text(shipments[i].name).appendTo($flexUL);
								}
							}
						
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
								app.ext.admin_config.a.showShipMethodEditorByProvider($li.data('provider'),$contentColumn)
								app.u.handleAppEvents($contentColumn);
								});
							});
						}
					}},'mutable');
				app.model.dispatchThis('mutable');
				},

			showShipMethodEditorByProvider : function(provider,$target)	{
				
				if(provider && $target)	{
					$target.empty();
					var shipData = app.ext.admin_config.u.getShipMethodByProvider(provider);
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
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_config.a.showShipMethodEditorByProvider, both $target ['+typeof $target+'] and provider ['+provider+'] are required.','gMessage':true});
					}
				
				},
			
			showRulesBuilderInModal : function(vars)	{
				vars = vars || {};

				if(vars.mode == 'shipping' || vars.mode == 'promotions')	{


var $D = $("<div \/>").attr('title',"Rule Builder: "+vars.mode);
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

//need pricing schedules.
$D.showLoading({'message':'Fetching Data'});
app.ext.admin.calls.adminWholesaleScheduleList.init({},'mutable');
app.ext.admin.calls.adminConfigDetail.init({'shipments':true},{datapointer : 'adminConfigDetail|shipments|'+app.vars.partition,callback : function(rd){
	$D.hideLoading();
	if(app.model.responseHasErrors(rd)){
		$D.anymessage({'message':rd});
		}
	else	{
		$D.anycontent({'templateID':'ruleBuilderTemplate','data':app.ext.admin_config.u.getShipMethodByProvider(vars.provider)});
		$("[data-app-role='dualModeListContents']",$D).sortable();
		app.u.handleAppEvents($D);
		//
		}
	}},'mutable');
app.model.dispatchThis('mutable');	
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_config.a.showRulesBuilderInModal, invalid/no mode ['+vars.mode+'] was passed.','gMessage':true});
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
					if(app.data['adminConfigDetail|shipments|'+app.vars.partition] && app.data['adminConfigDetail|shipments|'+app.vars.partition]['@SHIPMENTS'])	{
						r = {};
						var
							shipments = app.data['adminConfigDetail|shipments|'+app.vars.partition]['@SHIPMENTS'], //shortcut
							L = shipments.length;
						
						for(var i = 0; i < L; i += 1)	{
							if(shipments[i].provider == provider)	{
								r = shipments[i];
								break; //have a match. exit early.
								}
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_config.u.getShipMethodByProvider, adminConfigDetail|shipments not in memory and is required.','gMessage':true});
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
				},
			
			showRuleBuilderAsPanel : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				$btn.off('click.showEditRule').on('click.showEditRule',function(){

var
	$container = $btn.closest("[data-app-role='dualModeContainer']"),
	data = $btn.closest('tr').data(),
	$target = $("[data-app-role='dualModeDetail']",$container)
	panelID = app.u.jqSelector('','ruleBuilder_'+data.provider);

$panel = $("<div\/>").hide().anypanel({
	'header':'Edit: '+data.provider,
	data : $.extend(true,{},app.data['adminWholesaleScheduleList'],app.data['adminConfigDetail|shipments|'+app.vars.partition]),
	'templateID':'rulesFieldset_shipping'
	}).prependTo($target);
app.ext.admin.u.toggleDualMode($container,'detail');
$panel.slideDown('fast');
//the schedule render format doesn't have a good mechanism for pre-checking a value.
if(data.schedule)	{
	$("[name='SCHEDULE']",$panel).val();
	}
					
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