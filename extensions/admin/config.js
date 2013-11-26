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
		'paymentWallet_amzpay',
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
		'shippingBlacklistTemplate',
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
		'ruleBuilderRowTemplate_shipping',
		'rulesInputsTemplate_shipping',
		
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

			showEmailAuth : function($target)	{
				//app vars is passed in so the email input can be prepopulated w/ the domain in focus.
				$target.empty().append($("<div \/>").anycontent({'templateID':'emailAuthenticationPageTemplate','data':app.vars}).anydelegate());
				app.u.handleButtons($target);
				},

			showNotifications : function($target)	{
				$target.intervaledEmpty();
				$target.append($("<div \/>").anycontent({
					'templateID' : 'notificationPageTemplate'
					}).anydelegate({'trackEdits':true}));
				app.u.handleButtons($target);
				app.model.addDispatchToQ({
					'_cmd':'adminConfigDetail',
					'notifications' : true,
					'_tag':	{
						'datapointer' : 'adminConfigDetail|notifications',
						'callback':'anycontent',
						'translateOnly' : true,
						'jqObj' : $target.find("div:first")
						}
					},'mutable');
				app.model.dispatchThis('mutable');

				},

			showBillingHistory : function($target)	{
				$target.empty();
				$target.anycontent({'templateID':'billingHistoryTemplate','showLoading':false});
				$("[data-app-role='billingHistory']",$target).anydelegate({'trackEdits':true});
				app.u.handleCommonPlugins($target);
//				app.u.handleEventDelegation($target);
				app.u.handleButtons($target);
// 201346 -> replaced by anydelegate
/*				$('form',$target).each(function(){
					app.ext.admin.u.handleFormConditionalDelegation($(this));
					app.ext.admin.u.applyEditTrackingToInputs($(this));
					});
*/
				var $tabContent = $("[data-anytab-content='invoices']",$target);
				$tabContent.showLoading({'message':'Fetching invoice list'});

				app.model.addDispatchToQ({
					'_cmd':'billingInvoiceList',
					'_tag':{
						'callback': 'anycontent',
						'jqObj' : $tabContent,
						'skipAppEvents' : true, 
						'datapointer':'billingTransactions'
					}
				},'mutable');
				app.model.dispatchThis('mutable');
				},
		
			showPluginManager : function($target)	{
				$target.empty().showLoading({'message':'Fetching Your Integration Data'});

				app.model.addDispatchToQ({
					'_cmd':'adminConfigDetail',
					'plugins':1,
					'_tag':{
						'callback': function(rd)	{
							if(app.model.responseHasErrors(rd)){
								$target.anymessage({'message':rd});
								}
							else	{
								$target.anycontent({'templateID' : 'pluginManagerPageTemplate','datapointer':rd.datapointer});
								app.u.handleAppEvents($target);
								$("[data-app-role='slimLeftNav']",$target).accordion();
								}
							},
						'datapointer':'adminConfigDetail|plugins'
					}
				},'mutable');
				app.model.dispatchThis('mutable');

				},
			
			showPlugin : function($target,vars)	{
				vars = vars || {};
				
				if($target instanceof jQuery && vars.plugin)	{
//					app.u.dump(' -> templateID: '+'pluginTemplate_'+vars.plugintype+'_'+vars.plugin);
					$target.empty().anycontent({'templateID':'pluginTemplate_'+vars.plugin,'data':app.ext.admin_config.u.getPluginData(vars.plugin)});
					$('.applyAnycb',$target).anycb();
					$target.parent().find('.buttonset').show();
//					app.u.dump(" -> $target.closest('form').length: "+$target.closest('form').length);
					app.ext.admin.u.applyEditTrackingToInputs($target.closest('form'));
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_config.a.showPlugin, $target was not set or is not an instance of jQuery or vars.plugin ["+vars.plugin+"] no set.","gMessage":true});
					}
				},
			
			showGlobalSettings : function($target)	{
				$target.empty();
				var $div = $("<div \/>").appendTo($target);
				$div.showLoading({"message":"Fetching Global Settings"});
				$div.anydelegate({
					'trackEdits':true,
					trackSelector:'form'
					})
				app.model.addDispatchToQ({
					'_cmd':'adminConfigDetail',
					'order' : true, 'wms' : true, 'erp' : true, 'inventory' : true,
					'_tag':	{
						'skipAppEvents' : true,
						'datapointer' : 'adminConfigDetail|General',
						'callback':'anycontent',
						'templateID':'globalSettingsTemplate',
						'jqObj' : $div
						}
					},'mutable');
				app.model.dispatchThis('mutable');
				},
			
			showPaymentManager : function($target)	{
				$target.showLoading({'message':'Fetching Your Active Payment Methods'});
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
				}, //showPaymentManager
			
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
				}, //showPaymentTypeEditorByTender


			showContactInformation : function($target)	{
				$target.showLoading({'message':'Fetching Contact Details'});
				app.model.destroy('adminConfigDetail|account|'+app.vars.partition);
				app.ext.admin.calls.adminConfigDetail.init({'account':true},{'templateID':'contactInformationTemplate','datapointer' : 'adminConfigDetail|account|'+app.vars.partition, 'callback' : 'anycontent','jqObj':$target},'mutable');
				app.model.dispatchThis('mutable');
				}, //showContactInformation


			showTaxConfig : function($target)	{
				$target.empty().showLoading({'message':'Fetching tax details'});
				var datapointer = 'adminConfigDetail|taxes|'+app.vars.partition

				app.model.destroy(datapointer);
				app.ext.admin.calls.adminConfigDetail.init({'taxes':true},{'datapointer' : datapointer, 'callback' : function(rd){
					if(app.model.responseHasErrors(rd)){
						$('#globalMessaging').anymessage({'message':rd});
						}
					else	{
						$target.hideLoading();
						$target.append($("<div \/>").anycontent({'templateID':'taxConfigTemplate','datapointer':rd.datapointer}).anydelegate());
						app.u.handleButtons($target);
						app.u.handleCommonPlugins($target);
						$("[name='expires']",$target).datepicker({
							changeMonth: true,
							changeYear: true,
							minDate: 0,
							dateFormat : "yymmdd"
							});
						
						app.u.handleAppEvents($target,{'$form':$("[data-app-role='taxTableExecForm']",$target),'$container':$("[data-app-role='taxTableInputForm']",$target),'$dataTbody':$("[data-app-role='dataTableTbody']",$target)});
						}

					}},'mutable');
				app.model.dispatchThis('mutable');
				}, //showTaxConfig


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
							'data':$.extend(true,{},app.data['adminConfigDetail|shipping|'+app.vars.partition],app.data['adminConfigDetail|shipmethods|'+app.vars.partition])
							});

						var shipmethods = new Array();
						if(app.data['adminConfigDetail|shipmethods|'+app.vars.partition] && app.data['adminConfigDetail|shipmethods|'+app.vars.partition]['@SHIPMETHODS'])	{
							shipmethods = app.data['adminConfigDetail|shipmethods|'+app.vars.partition]['@SHIPMETHODS'];
							}

						var
							L = shipmethods.length,
							$flexUL = $("[data-app-role='shipMethodsByFlex']",$target);
//genrate the list of flex methods.
//disabled methods will get a class to help indicate they're disabled.
						for(var i = 0; i < L; i += 1)	{
							if(shipmethods[i].provider.indexOf('FLEX:') === 0)	{
//								app.u.dump("shipmethods[i].enabled: "+shipmethods[i].enable);
								var $li = $("<li \/>");
								$li.data('provider',shipmethods[i].provider)
								$li.text(shipmethods[i].name);
								if(shipmethods[i].handler)	{$li.append(" ["+shipmethods[i].handler.toLowerCase()+"]")}
								$li.addClass((shipmethods[i].enable == 1) ? '' :'opacity50');
								$li.appendTo($flexUL)
								}
							}
						
						
						
						app.u.handleAppEvents($target);
						
						var
							$leftColumn = $("[data-app-role='slimLeftNav']",$target),
							$contentColumn = $("[data-app-role='slimLeftContent']",$target);

//add classes to fedex,ups and usps to indicate they are enabled/disabled.
						
//						$("[data-provider='FEDEX']",$leftColumn).addClass(app.ext.admin_config.u.getShipMethodByProvider('FEDEX')['enable'] == 1 ? '' : 'opacity50');
//						$("[data-provider='UPS']",$leftColumn).addClass(app.ext.admin_config.u.getShipMethodByProvider('UPS')['enable'] == 1 ? '' : 'opacity50');
//						$("[data-provider='USPS']",$leftColumn).addClass(app.ext.admin_config.u.getShipMethodByProvider('USPS')['enable'] == 1 ? '' : 'opacity50');
						
 
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
				}, //showShippingManager


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
				}, //showAddFlexShipment


			showShipMethodEditorByProvider : function(provider,$target)	{
				
				if(provider && $target)	{
					$target.empty();
					$target.closest('form').find('.buttonset').hide(); //turn this off always. turn on when needed.
					
					if(provider == 'GENERAL')	{
						$target.anycontent({
							'templateID':'shippingGeneralTemplate',
							'data':$.extend(true,{},app.data['adminConfigDetail|shipping|'+app.vars.partition],app.data['adminConfigDetail|shipmethods|'+app.vars.partition],app.data['appResource|shipcountries.json'])
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
				
				}, //showShipMethodEditorByProvider
				
				
			showDomainManager : function($target)	{
				
				$target.empty();
				
				app.ext.admin.i.DMICreate($target,{
					'header' : 'Domain Manager', //left off because the interface is in a tab.
					'className' : 'domainManager',
					'buttons' : [
						"<button data-app-event='admin|refreshDMI'>Refresh Domain List<\/button>",
						"<button data-app-event='admin_config|adminDomainCreateShow'>Add Domain<\/button>"
						],
					'thead' : ['Logo','Domain','Partition',''],
					'tbodyDatabind' : "var: users(@DOMAINS); format:processList; loadsTemplate:domainManagerRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminDomainList',
						'_tag' : {'datapointer' : 'adminDomainList'}
						}
					});
// * 201336 -> moved this so templates are not requested till template chooser is opened.
//				app.model.addDispatchToQ({'_cmd':'adminSiteTemplateList','_tag':{'datapointer' : 'adminSiteTemplateList'}},'mutable');
				app.model.dispatchThis('mutable');

				},//showCouponManager				
				
			showCouponManager : function($target)	{
				
				$target.empty();
				
				app.ext.admin.i.DMICreate($target,{
					'header' : 'Coupon Manager', //left off because the interface is in a tab.
					'className' : 'couponManager',
					'buttons' : [
						"<button data-app-event='admin|refreshDMI'>Refresh Coupon List<\/button>",
						"<button data-app-event='admin_config|couponCreateShow'>Add Coupon<\/button>"
						],
					'thead' : ['Disabled','Code','Title','Auto','Created','Begins','Expires',''],
					'tbodyDatabind' : "var: users(@COUPONS); format:processList; loadsTemplate:couponsResultsRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminConfigDetail',
						'coupons' : true,
						'_tag' : {'datapointer' : 'adminConfigDetail|coupons|'+app.vars.partition}
						}
					});
				app.model.dispatchThis();

				},//showCouponManager

				
			showPartitionManager : function($target)	{
				$target.empty();
				app.ext.admin.i.DMICreate($target,{
					'header' : 'Partition Manager', //left off because the interface is in a tab.
					'className' : 'partitionManager',
					'buttons' : [
						"<button data-app-event='admin|refreshDMI'>Refresh Partition List<\/button>",
						"<button data-app-event='admin_config|partitionCreateShow'>Add Partition<\/button>"
						],
					'thead' : ['ID','Name','Profile','Customers','Navcats','Language','Currency'],
					'tbodyDatabind' : "var: users(@PRTS); format:processList; loadsTemplate:partitionManagerRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminConfigDetail',
						'prts' : true,
						'_tag' : {'datapointer' : 'adminConfigDetail|prts'}
						}
					});
				app.model.dispatchThis();

				},//showCouponManager

//will open the rules builder in a modal.
//vars.rulesmode is REQUIRED.  should be set to shipping or coupons.
//if shipping, vars.provided is also required.
//vars will be passed as param 2 (vars) into handleAppEvents so that the button events will know what mode to use.

			showRulesBuilderInModal : function(vars)	{
//				app.u.dump("BEGIN admin_config.a.showRulesBuilderInModal");
//				app.u.dump("vars: "); app.u.dump(vars);
				vars = vars || {};

				if(vars.table && ((vars.rulesmode == 'shipping' && vars.provider) || (vars.rulesmode == 'coupons' && vars.couponCode)))	{



					var $D = app.ext.admin.i.dialogCreate({
						'title' : 'Rules Builder',
						});
					
					$D.dialog('option','buttons',[ 
						{text: 'Cancel', click: function(){
							$D.dialog('close');
							if(typeof vars.closeFunction === 'function')	{
								vars.closeFunction($(this));
								}
							}}	
						]);
					$D.dialog('open').anydelegate();
					
					//these will be tailored based on which set of rules is showing up, then passed into the DMICreate function.
					var DMIVars = {
						'header' : 'Rules Editor',
						'buttons' : ["<button data-app-event='admin_config|ruleBuilderAddShow'>Add Rule<\/button>","<button disabled='disabled' data-app-event='admin_config|ruleBuilderUpdateExec' data-app-role='saveButton'>Save <span class='numChanges'><\/span> Changes<\/button>"]
						}; 
					app.u.dump(" -> vars.TABLE: "+vars.table);
					//set the mode specific variables for DMI create and add any 'data' attribs to the modal, if necessary.
					if(vars.rulesmode == 'shipping')	{
						DMIVars.thead = ['','Code','Name','Created','Exec','Match','Schedule','Value',''];
						DMIVars.tbodyDatabind = 'var: rules(@'+vars.table+'); format:processList; loadsTemplate:ruleBuilderRowTemplate_shipping;';
						DMIVars.showLoading = true; //need to get schedules before allowing use of interface.
						$D.attr('data-provider',vars.provider);
						}
					else if(vars.rulesmode == 'coupons')	{
						DMIVars.thead = ['','hint','Exec','Match','Match Value','Value','']; //first empty is for drag icon. last one is for buttons.
						DMIVars.showLoading = false; //There's no data request required. this allows immediate editing.
						DMIVars.tbodyDatabind = 'var: rules(@RULES); format:processList; loadsTemplate:ruleBuilderRowTemplate_coupons;'
						}
					else	{}
					
					var $DMI = app.ext.admin.i.DMICreate($D,DMIVars);
					$DMI.attr({'data-table':vars.table,'data-rulesmode' : vars.rulesmode})
					
					$("[data-app-role='dualModeListTbody']",$D).sortable().on("sortupdate",function(evt,ui){
						ui.item.addClass('edited');
						app.ext.admin.u.handleSaveButtonByEditedClass($D);
						});
					
					
					
					if(vars.rulesmode == 'shipping')	{
					//need pricing schedules. This is for shipping.
						var numDispatches = app.ext.admin.calls.adminPriceScheduleList.init({},'mutable');
					//if making a request for the wholesale list, re-request shipmethods too. callback is on shipmethods
						if(numDispatches)	{
							app.model.destroy('adminConfigDetail|shipmethods|'+app.vars.partition);
							}
						app.ext.admin.calls.adminConfigDetail.init({'shipmethods':true},{datapointer : 'adminConfigDetail|shipmethods|'+app.vars.partition,callback : function(rd){
							$DMI.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$D.anymessage({'message':rd});
								}
							else	{
					//			app.u.dump("Exec showRulesBuilderInModal callback for new shipmethods.");
					//			app.u.dump(" -> app.ext.admin_config.u.getShipMethodByProvider(vars.provider): "); app.u.dump(app.ext.admin_config.u.getShipMethodByProvider(vars.provider));
								$D.anycontent({'data':app.ext.admin_config.u.getShipMethodByProvider(vars.provider)});
								app.u.handleAppEvents($D,vars); //needs to happen after request, because that's when the row contents are populated.
								}
							}},'mutable');
						app.model.dispatchThis('mutable');
						}
					else if(vars.rulesmode == 'coupons')	{
						var data = app.ext.admin.u.getValueByKeyFromArray(app.data['adminConfigDetail|coupons|'+app.vars.partition]['@COUPONS'],'id',vars.couponCode);
						if(data)	{
							$D.anycontent({'data': data});
							app.u.handleAppEvents($D,vars);
							}
						else	{} //getValueByKeyFromArray (used to set the data) will return false and display an error message.
						}
					else	{
						 //should never get here. if statement above accounts for mode being shipping or coupons. failsafe.
						$('.dualModeListMessaging',$DMI).anymessage({'message':'In admin_config.a.showRulesBuilderInModal, rulesmode value is not valid ['+vars.rulesmode+']. must be shipping or coupons','gMessage':true});
						}

					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_config.a.showRulesBuilderInModal, invalid/no mode ['+vars.rulesmode+'] was passed or a required param based on mode was not set. see console for vars.','gMessage':true});
					app.u.dump("admin_config.a.showRulesBuilderInModal vars: "); app.u.dump(vars);
					}

				}, //showRulesBuilderInModal


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
				}, //showUPSOnlineToolsRegInModal
			
			showFedExMeterInModal : function(vars)	{

vars = vars || {}; //may include supplier
var $D = app.ext.admin.i.dialogCreate({'title':'Renew FedEx Meter','templateID':'shippingFedExRegTemplate','data':(vars.vendorid) ? {} : app.ext.admin_config.u.getShipMethodByProvider('FEDEX')});
$D.data(vars);
app.u.handleAppEvents($D);
$D.addClass('labelsAsBreaks alignedLabels');
$D.dialog('open');	
				} //showFedExMeterInModal

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		renderFormats : {
			blacklistedCountries : function($tag,data)	{
				if(data.bindData.loadsTemplate)	{
					for(var i in data.value)	{
						$tag.append(app.renderFunctions.transmogrify({'country':data.value[i]},data.bindData.loadsTemplate,{'country':data.value[i]}));
						}
					}
				else	{
					$tag.anymessage({'message':'Unable to render list item - no loadsTemplate specified.','persistent':true});
					}
				},
//for coupons, disabled=1 is returned, as opposed to enabled=1. so we look for an absolute zero value.
			isDisabled : function($tag,data)	{
				if(Number(data.value) === 1)	{
					$tag.append("<span class='ui-icon ui-icon-closethick' />");
					}
				else	{}
				}
			
			}, //renderFormats





////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\






		u : {

			getPluginData : function(plugin)	{
//				app.u.dump("BEGIN admin_config.u.getPluginData");
				var r = {}; //what is returned.
				if(plugin)	{
//					app.u.dump(" -> plugin: "+plugin);
					if(app.data['adminConfigDetail|plugins'] && app.data['adminConfigDetail|plugins']['@PLUGINS'])	{
						var L = app.data['adminConfigDetail|plugins']['@PLUGINS'].length;
						for(var i = 0; i < L; i += 1)	{
							if(app.data['adminConfigDetail|plugins']['@PLUGINS'][i].plugin == plugin)	{
								r = app.data['adminConfigDetail|plugins']['@PLUGINS'][i];
								break; //match! exit early.
								}
							}
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In admin_config.u.getPluginData, app.data['adminConfigDetail|plugins'] or app.data['adminConfigDetail|plugins']['@PLUGINS'] are empty and are required.","gMessage":true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_config.u.getPluginData, plugin ["+plugin+"] not set.","gMessage":true});
					}
//				app.u.dump(" -> r: "); app.u.dump(r);
				return r;
				}, //getPluginData

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
				}, //getShipMethodByProvider

//mode is required and can be create or update.
//form is pretty self-explanatory.
//$domainEditor is the PARENT context of the original button clicked to open the host editor. ex: the anypanel. technically, this isn't required but will provide a better UX.
			domainAddUpdateHost : function(mode,$form,$domainEditor)	{
				if(mode == 'create' || mode == 'update' && $form instanceof jQuery)	{

					var sfo = $form.serializeJSON({'cb':true});
					$form.showLoading({"message":"Updating host..."});
					var cmdObj = {
						_cmd : 'adminDomainMacro',
						_tag : {
							jqObj : $form,
							message : 'Your changes have been saved',
							callback : 'showMessaging',
							persistent : true
							},
						'DOMAINNAME' : sfo.DOMAINNAME,
						'@updates' : new Array()
						}

					if(mode == 'create')	{
						cmdObj['@updates'].push("HOST-ADD?HOSTNAME="+sfo.HOSTNAME);
						}

					var hostSet = "HOST-SET?"+$.param(app.u.getWhitelistedObject(sfo,['HOSTNAME','HOSTTYPE']));

					if(sfo.HOSTTYPE == 'VSTORE')	{
						$("[data-app-role='domainRewriteRulesTbody'] tr",$form).each(function(){
							var $tr = $(this);
							if($tr.hasClass('rowTaggedForRemove'))	{
								cmdObj['@updates'].push("VSTORE-KILL-REWRITE?PATH="+$tr.data('path'));
								}
							else if($tr.hasClass('isNewRow'))	{
								cmdObj['@updates'].push("VSTORE-ADD-REWRITE?PATH="+$tr.data('path')+"&TARGETURL="+$tr.data('targeturl'));
								}
							else	{} //unchanged row. this is a non-destructive process, so existing rules don't need to be re-added.
							})
						}
					else if(sfo.HOSTTYPE == 'SITE')	{
						hostSet += "&force_https="+sfo.force_https;
						}
					else if(sfo.HOSTTYPE == 'SITEPTR')	{
						hostSet += "&PROJECT="+sfo.PROJECT+"&force_https="+sfo.force_https;
						}
					else if(sfo.HOSTTYPE == 'REDIR')	{
						hostSet += "&URI="+sfo.URI+"&REDIR="+sfo.REDIR;
						}
					else if(sfo.HOSTTYPE == 'CUSTOM')	{
						//supported. no extra params needed.
						}
					else {
						hostSet = false;
						} //catch. some unsupported type.
					
					if(hostSet)	{
						cmdObj['@updates'].push(hostSet);
						}
					else	{
						$form.anymessage({'message':'The host type was not a recognized type. We are attempting to save the rest of your changes.'});
						}
					
//					app.u.dump(" -> cmdObj: "); app.u.dump(cmdObj);
					app.model.addDispatchToQ(cmdObj,'mutable');
					app.model.dispatchThis('mutable');
					
					}
				else if($form instanceof jQuery)	{
					$form.anymessage({"message":"In admin_config.u.domainAddUpdateHost, mode ["+mode+"] was invalid. must be create or update.","gMessage":true});
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_config.u.domainAddUpdateHost, $form was not passed or is not a valid jquery instance.","gMessage":true});
					}
				} //domainAddUpdateHost
			}, //u [utilities]

//this is used in conjunction w/ admin.a.processForm.
//in the form, set _tag/macrobuilder='extension/name' where name is the name of the function in mb. should be same or derive from macro cmd.
		macrobuilders : {


/*
This is a destructive update.
when an event type is changed, all the event types are dropped, then re-added.

*/
			
			"NOTIFICATION/DATATABLE" : function(sfo,$form)	{
				sfo = sfo || {};

//a new object, which is sanitized and returned.
				var newSfo = {
					'_cmd':'adminConfigMacro',
					'_tag':sfo._tag,
					'@updates':new Array()
					};


				var updatedEvents = new Array(); //each time an event type is updated, add it here. This'll be used to make sure duplicate updates don't occur. one edit from an 'event type' updates all
				var $tbody = $("[data-app-role='dataTable'] tbody",$form);
				$("[data-app-role='dataTable'] tbody tr.edited",$form).each(function(index){
					app.u.dump(" -> index: "+index);
					var $tr = $(this);
					var eventType = $tr.data('event');
					if(eventType)	{
						if($.inArray(eventType,updatedEvents) == -1)	{
							updatedEvents.push(eventType);
							newSfo['@updates'].push("NOTIFICATION/DATATABLE-EMPTY?event="+eventType);
							//yes, i know. loops in loops, what are you thinking? we're talking about a pretty small data-set here. If this changes, re-evaluate this code.
							$("tr[data-event='"+$tr.data('event')+"']").each(function(){
								var $updateTR = $(this);
								if($updateTR.hasClass('rowTaggedForRemove'))	{} //ignore this row, it's being deleted.
								else	{
									newSfo['@updates'].push("NOTIFICATION/DATATABLE-INSERT?"+$.param(app.u.getWhitelistedObject($updateTR.data(),['event','verb','url','email'])));
									}
								});
							
							} 
						else	{
							//this event has already been updated.
							}
						}
					else	{
						//no event type on row. That's not valid.
						}
					});

				return newSfo;
				},
			
			
			"adminConfigMacro" : function(sfo)	{
				sfo = sfo || {};
//a new object, which is sanitized and returned.
				var newSfo = {
					'_cmd':'adminConfigMacro',
					'_tag':sfo._tag,
					'@updates':new Array()
					};
				
				delete sfo._tag; //removed from original object so serialization into key value pair string doesn't include it.
				delete sfo._macrobuilder;
				newSfo['@updates'].push(newSfo._tag.macrocmd+"?"+$.param(sfo));
//				app.u.dump(" -> newSfo:"); app.u.dump(newSfo);
				return newSfo;
				}, //adminConfigMacro
			
			billingPaymentMacro : function(sfo,$form)	{
				var newSfo = {
					'_cmd':'billingPaymentMacro',
					'_tag':sfo._tag,
					'@updates':[]
					};
/*
				if($(':input.edited',$form).length)	{
					newSfo['@updates'].push("ACCOUNT-ORG-SET?"+$.param($form.serializeJSON({'selector':':input.edited'})));
					}
*/
				var $tBody = $("tbody[data-app-role='paymentMethodTbody']:first",$form);
//				app.u.dump(" -> $tBody.length: "+$tBody.length);
//				app.u.dump(" -> $tBody.children().length: "+$tBody.children().length);
				if($tBody.length && $tBody.children().length)	{
					$("tr.edited",$tBody).each(function(){
						var $tr = $(this);
						if($tr.hasClass('isNewRow') && $tr.hasClass('rowTaggedForRemove'))	{
							//is new and tagged for delete. do nothing.
							}
						else if($tr.hasClass('isNewRow'))	{
//							app.u.dump(" -> $tr.data(): "); app.u.dump($tr.data());
							if($tr.data('paymethod') == 'CREDIT')	{
								//cant just whitelist data cuz the params are UC and data-table applies them as attributes which get lowercased.
								newSfo['@updates'].push("METHOD-CREDITCARD-ADD?CC="+$tr.data('cc')+"&YY="+$tr.data('yy')+"&MM="+$tr.data('mm'));
								}
							else if($tr.data('paymethod') == 'ECHECK')	{
								newSfo['@updates'].push("METHOD-ECHECK-ADD?EB="+$tr.data('eb')+"&EA="+$tr.data('ea')+"&ER="+$tr.data('er')); //"+$.param(app.u.getWhitelistedObject($tr.data(),['EB','EA','ER'])));
								}
							else	{
								//unsupported payment type
								$tr.closest('fieldset').anymessage({"message":"In admin_config.macrobuilders.billingPaymentMacro, an invalid paymethod ["+$tr.data('paymethod')+"] was passed thru the data table.","gMessage":true});
								}
								
							}
						else if($tr.hasClass('rowTaggedForRemove'))	{
							newSfo['@updates'].push("METHOD-DELETE?ID="+$tr.data('id'));
							}
						else	{
							//unexpected condition
							}
						})
					}
//				app.u.dump(" -> billingPayments newSFO: "); app.u.dump(newSfo);
				return newSfo;
				},
			
			//executed from within the 'create new domain' interface.
			adminDomainMacroCreate : function(sfo,$form)	{
				sfo = sfo || {};
//a new object, which is sanitized and returned.
				var newSfo = {
					'_cmd':'adminDomainMacro',
					'_tag':sfo._tag,
					'@updates':[]
					};
				if(sfo.domaintype == 'DOMAIN-DELEGATE')	{
					newSfo.DOMAINNAME = sfo.DOMAINNAME;
					newSfo['@updates'].push("DOMAIN-DELEGATE");
					}
				else if(sfo.domaintype == 'DOMAIN-RESERVE')	{
					newSfo['@updates'].push("DOMAIN-RESERVE")					
					}
				else	{
					newSfo = false;
					}
				return newSfo;
				},

//executed when save is pressed in the email tab of the domain editor.
			adminDomainMacroEmail : function(sfo,$form)	{
				sfo = sfo || {};
//a new object, which is sanitized and returned.
				var newSfo = {
					'_cmd':'adminDomainMacro',
					'_tag':sfo._tag,
					'DOMAINNAME':sfo.DOMAINNAME,
					'@updates': new Array()
					};
				
				newSfo['@updates'].push("EMAIL-SET?"+$.param(app.u.getWhitelistedObject(sfo,['MX1','MX2','TYPE'])));
//				app.u.dump(" -> domainMacroEmail: "); app.u.dump(newSfo);
				return newSfo;
				},

			//executed when save is pressed within the general panel of editing a domain.
			adminDomainMacroGeneral : function(sfo,$form)	{
				sfo = sfo || {};
//a new object, which is sanitized and returned.
				var newSfo = {
					'_cmd':'adminDomainMacro',
					'DOMAINNAME':sfo.DOMAINNAME,
					'_tag':sfo._tag,
					'@updates': new Array()
					};
				
				newSfo['@updates'].push("DOMAIN-SET-PRIMARY?IS="+sfo.IS_PRIMARY);
				newSfo['@updates'].push("DOMAIN-SET-SYNDICATION?IS="+sfo.IS_SYNDICATION);
			
				
				
				if($("input[name='LOGO']",$form).hasClass('edited'))	{
					newSfo['@updates'].push("DOMAIN-SET-LOGO?LOGO="+sfo.LOGO || ""); //set to value of LOGO. if not set, set to blank (so logo can be cleared).
					}				
				
				if($("select[name='PRT']",$form).hasClass('edited'))	{
					newSfo['@updates'].push("DOMAIN-SET-PRT?PRT="+sfo.PRT);
					}
				
				$("[data-app-role='domainsHostsTbody'] tr",$form).each(function(){
					if($(this).hasClass('rowTaggedForRemove'))	{
						newSfo['@updates'].push("HOST-KILL?HOSTNAME="+$(this).data('hostname'));
						}
					else	{} //do nothing. new hosts are added in modal.
					});
//				app.u.dump(" -> new sfo for domain macro general: "); app.u.dump(newSfo);
				return newSfo;
				}
			
			
			},


////////////////////////////////////   EVENTS [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		e : {
			

			shipMeterDetailInModal : function($btn)	{
				$btn.button();
				$btn.off('click.shipMeterDetailInModal').on('click.shipMeterDetailInModal',function(event){
					if($btn.data('provider') == 'UPS'){
						app.ext.admin_config.a.showUPSOnlineToolsRegInModal({'vendorid':$(this).closest('.ui-widget-anypanel').data('vendorid')});
						}
					else if($btn.data('provider') == 'FEDEX'){
						app.ext.admin_config.a.showFedExMeterInModal({'vendorid':$(this).closest('.ui-widget-anypanel').data('vendorid')});
						}
					else	{
						$btn.closest('.ui-widget-anypanel').anymessage({'message':'In admin_wholesale.e.shipMeterDetailInModal, no/invalid provider ['+$btn.data('provider')+'] on button','gMessage':true})
						}
					});
				}, //shipMeterDetailInModal

			adminDomainCreateShow : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-circle-plus"},text: true});
				$btn.off('click.adminDomainCreateShow').on('click.adminDomainCreateShow',function(event){

					event.preventDefault();
					var $D = app.ext.admin.i.dialogCreate({
						'title':'Add New Domain',
						'templateID':'domainCreateTemplate',
						'showLoading':false //will get passed into anycontent and disable showLoading.
						});
					$('form',$D).append("<input type='hidden' name='_tag/updateDMIList' value='"+$btn.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
					app.ext.admin.u.handleFormConditionalDelegation($('form',$D));
					$D.dialog('option','width','350');
					$D.dialog('open');
					});
				}, //adminDomainCreateShow

			adminDomainToggleFavoriteExec : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-tag"},text: false});
				if($btn.closest("[data-is_favorite]").data('is_favorite') == 1)	{$btn.addClass('ui-state-highlight')}
				$btn.off('click.adminDomainToggleFavoriteExec').on('click.adminDomainToggleFavoriteExec',function(event){
					$btn.toggleClass('ui-state-highlight');
					var domainname = $btn.closest("[data-domainname]").data('domainname');
					app.model.addDispatchToQ({
						'_tag':{
							'callback' : 'showMessaging',
							'message' : domainname+' has been '+($btn.hasClass('ui-state-highlight') ? 'tagged as a favorite. It will now show at the top of some domain lists.' : 'removed from your favorites')
							},
						'_cmd':'adminDomainMacro',
						'DOMAINNAME':domainname,
						'@updates':["DOMAIN-SET-FAVORITE?IS="+($btn.hasClass('ui-state-highlight') ? 1 : 0)]
						},'passive');
					app.model.dispatchThis('passive');
					});
				}, //adminDomainToggleFavoriteExec

			adminDomainCreateUpdateHostShow : function($btn)	{
				if($btn.data('mode') == 'create')	{
					$btn.button({icons: {primary: "ui-icon-circle-plus"},text: true});
					}
				else if($btn.data('mode') == 'update')	{
					$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
					}
				else	{
					$btn.button();
					$btn.button('disable').attr('title','Invalid mode set on button');
					}

				$btn.off('click.adminDomainCreateUpdateHostShow').on('click.adminDomainCreateUpdateHostShow',function(event){
					event.preventDefault();
					var domain = $btn.closest('[data-domain]').data('domain');

					if(domain)	{
						var $D = app.ext.admin.i.dialogCreate({
							'title': $btn.data('mode') + '  host',
							'data' : (($btn.data('mode') == 'create') ? {'DOMAINNAME':domain} : $.extend({},app.data['adminDomainDetail|'+domain]['@HOSTS'][$btn.closest('tr').data('obj_index')],{'DOMAINNAME':domain})), //passes in DOMAINNAME and anything else that might be necessary for anycontent translation.
							'templateID':'domainAddUpdateHostTemplate',
							'showLoading':false //will get passed into anycontent and disable showLoading.
							});
//get the list of projects and populate the select list.  If the host has a project set, select it in the list.
						var _tag = {'datapointer' : 'adminProjectList','callback':function(rd){
							if(app.model.responseHasErrors(rd)){
								$("[data-panel-id='domainNewHostTypeSITEPTR']",$D).anymessage({'message':rd});
								}
							else	{
								//success content goes here.
								$("[data-panel-id='domainNewHostTypeSITEPTR']",$D).anycontent({'datapointer':rd.datapointer});
								if($btn.data('mode') == 'update')	{
//									app.u.dump(" -> $('input[name='PROJECT']',$D): "+$("input[name='PROJECT']",$D).length);
//									app.u.dump(" -> Should select this id: "+app.data['adminDomainDetail|'+domain]['@HOSTS'][$btn.closest('tr').data('obj_index')].PROJECT);
									$("input[name='PROJECT']",$D).val(app.data['adminDomainDetail|'+domain]['@HOSTS'][$btn.closest('tr').data('obj_index')].PROJECT)
									}
								}
						
							
							}};
						if(app.model.fetchData(_tag.datapointer) == false)	{
							app.model.addDispatchToQ({'_cmd':'adminProjectList','_tag':	_tag},'mutable'); //necessary for projects list in app based hosttypes.
							app.model.dispatchThis();
							}
						else	{
							app.u.handleCallback(_tag);
							}




						app.ext.admin.u.handleFormConditionalDelegation($('form',$D));
//hostname isn't editable once set.					
						if($btn.data('mode') == 'update')	{
							$("input[name='HOSTNAME']",$D).attr('disabled','disabled');
							}
						
						$("form",$D).append(
							$("<button>Save<\/button>").button().on('click',function(event){
								event.preventDefault();
								app.ext.admin_config.u.domainAddUpdateHost($btn.data('mode'),$('form',$D),$btn.closest('.ui-widget-anypanel'));
								})
							)
						
						$D.dialog('option','width',($('body').width() < 500) ? '100%' : '50%');
						$D.dialog('open');
						}
					else	{
						$btn.closest('.ui-widget-content').anymessage({'message':'In admin_config.e.adminDomainCreateUpdateHostShow, unable to ascertain domain.','gMessage':true});
						}
					});
				}, //adminDomainCreateUpdateHostShow

			domainRemoveConfirm : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.domainRemoveConfirm').on('click.domainRemoveConfirm',function(event){
					event.preventDefault();
					var $tr = $btn.closest('tr');

					app.ext.admin.i.dialogConfirmRemove({
						'removeFunction':function(vars,$D){
							$D.showLoading({"message":"Deleting Domain"});
							app.model.addDispatchToQ({'_cmd':'adminDomainMacro','DOMAINNAME':$tr.data('DOMAINNAME'),'@updates':["DOMAIN-REMOVE"],'_tag':{'callback':function(rd){
								$D.hideLoading();
								if(app.model.responseHasErrors(rd)){
									$D.anymessage({'message':rd});
									}
								else	{
									$D.dialog('close');
									$('#globalMessaging').anymessage(app.u.successMsgObject('The domain has been removed.'));
									$tr.empty().remove(); //removes row for list.
									}
								}
							}
						},'immutable');
						app.model.dispatchThis('immutable');
						}});
					})
				}, //domainRemoveConfirm

			adminDomainDetailShow : function($btn)	{
				if($btn.data('mode') == 'dialog')	{$btn.button({icons: {primary: "ui-icon-pencil"},text: false});}
				else	{$btn.button({icons: {primary: "ui-icon-pencil"},text: false});}

				var domainname = $btn.closest("[data-domainname]").data('domainname');
				
				if(domainname)	{
					if($btn.data('mode') == 'panel' || $btn.data('mode') == 'dialog')	{
						$btn.off('click.adminDomainDetailShow').on('click.adminDomainDetailShow',function(event){
							event.preventDefault();
							
							var $panel;							
							if($btn.data('mode') == 'panel')	{
								$panel = app.ext.admin.i.DMIPanelOpen($btn,{
									'templateID' : 'domainUpdateTemplate',
									'panelID' : 'domain_'+domainname,
									'header' : 'Edit Domain: '+domainname,
									'handleAppEvents' : false
									});								
								}
							else	{
								$panel = app.ext.admin.i.dialogCreate({
									'title':'Edit Domain: '+domainname,
									'templateID':'domainUpdateTemplate',
									'showLoading':false //will get passed into anycontent and disable showLoading.
									});
								$panel.dialog('open');
								}

							$panel.attr({'data-domainname':domainname,'data-domain':domainname}); //### start using domainname instead of domain as much as possible. format in reponse changed.
							
							app.model.addDispatchToQ({'_cmd':'adminConfigDetail','prts':1,'_tag':{'datapointer':'adminConfigDetail|prts'}},'mutable');
	
							app.model.addDispatchToQ({
								'_cmd':'adminDomainDetail',
								'DOMAINNAME':domainname,
								'_tag':	{
									'datapointer' : 'adminDomainDetail|'+domainname,
									'extendByDatapointers' : ['adminConfigDetail|prts'],
									'callback':function(rd){
										if(app.model.responseHasErrors(rd)){
											$panel.anymessage({'message':rd});
											}
										else	{
											//success content goes here.
											rd.translateOnly = true;
											$panel.anycontent(rd);
											//in an each because passing in 'form',$panel selector 'joined' them so updating one form effected all the buttons..
											$('form',$panel).each(function(){
												app.ext.admin.u.applyEditTrackingToInputs($(this)); //applies 'edited' class when a field is updated. unlocks 'save' button.
												});

											app.ext.admin.u.handleFormConditionalDelegation($panel); //enables some form conditional logic 'presets' (ex: data-panel show/hide feature). applied to ALL forms in panel.
											
											app.u.handleAppEvents($panel);
										
											$('.toolTip',$panel).tooltip();
											$('.applyAnycb',$panel).anycb();
											$('.applyAnytable',$panel).each(function(){$(this).anytable()});
											$('.applyAnytabs',$panel).anytabs();
										
											//preselect the partition. can't use a databind because that's being used to generate the list of options. it's for that reason this isn't run through anycontent as a callback directly.
										//	app.u.dump(" -> $(select[name='PRT'],$panel).length: "+$("select[name='PRT']",$panel).length);
										//	app.u.dump(" -> app.data["+rd.datapointer+"].PRT: "+app.data[rd.datapointer].PRT);
											$("select[name='PRT']",$panel).val(app.data[rd.datapointer].PRT);
											}
										}
									}
								},'mutable');
							app.model.dispatchThis('mutable');
	
							}); //
						}
					else	{
						$btn.button('disable').attr('title','Invalid mode set on button. must be panel or dialog.');
						}
					}
				else	{
					$btn.button('disable').attr('title','Unable to ascertain the domain');
					}
				}, //adminDomainDetailShow
			
			couponDetailDMIPanel : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				var couponCode = $btn.closest('tr').data('coupon');
				
				if(couponCode)	{
					
					$btn.off('click.couponDetailDMIPanel').on('click.couponDetailDMIPanel',function(event){
						event.preventDefault();
						var $panel = app.ext.admin.i.DMIPanelOpen($btn,{
								'templateID' : 'couponAddUpdateContentTemplate',
								'panelID' : 'coupon_'+couponCode,
								'header' : 'Edit Coupon: '+couponCode,
								'handleAppEvents' : true,
								'data' : app.ext.admin.u.getValueByKeyFromArray(app.data['adminConfigDetail|coupons|'+app.vars.partition]['@COUPONS'],'id',couponCode)
								});
							
						$panel.attr('data-couponcode',couponCode);
						$('form',$panel)
							.append("<input type='hidden' name='_macrobuilder' value='admin_config|adminConfigMacro' \/><input type='hidden' name='_tag/macrocmd' value='COUPON/INSERT' \/><input type='hidden' name='_tag/extension' value='admin' \/><input type='hidden' name='_tag/callback' value='showMessaging' \/><input type='hidden' name='_tag/message' value='The coupon has been successfully updated.' \/><input type='hidden' name='_tag/updateDMIList' value='"+$panel.closest("[data-app-role='dualModeContainer']").attr('id')+"' \/>")
							.find(".applyDatepicker").datetimepicker({
								changeMonth: true,
								dateFormat : 'yymmdd',
								timeFormat: 'hhmmss',
								changeYear: true,
								separator : '' //get rid of space between date and time.
								})
							.end()
							.find("[name='coupon']").closest('label').hide(); //code is only editable at create.
						}); //
					}
				else	{
					$btn.button('disable');
					}
				}, //couponDetailDMIPanel

			couponCreateShow : function($btn)	{

				$btn.button();
				$btn.off('click.couponCreateShow').on('click.couponCreateShow',function(event){

					event.preventDefault();
					var $D = app.ext.admin.i.dialogCreate({
						'title':'Add New Coupon',
						'templateID':'couponAddUpdateContentTemplate',
						'showLoading':false //will get passed into anycontent and disable showLoading.
						});
					$D.dialog('open');
//These fields are used for processForm on save.
					$('form',$D).first().append("<input type='hidden' name='_macrobuilder' value='admin_config|adminConfigMacro' \/><input type='hidden' name='_tag/macrocmd' value='COUPON/INSERT' \/><input type='hidden' name='_tag/callback' value='showMessaging' \/><input type='hidden' name='_tag/jqObjEmpty' value='true' \/><input type='hidden' name='_tag/updateDMIList' value='"+$btn.closest("[data-app-role='dualModeContainer']").attr('id')+"' \/><input type='hidden' name='_tag/message' value='Thank you, your coupon has been created.' \/>");
					$("[data-app-event='admin_config|ruleBuilderShow']",$D).hide(); //hide rule builder till after coupon is saved.
					 $( ".applyDatepicker",$D).datepicker({
						changeMonth: true,
						changeYear: true,
						dateFormat : 'yymmdd'
						});
					$('.applyAnycb').anycb();
					});
				},	//couponCreateShow

			couponRemoveConfirm : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.couponRemoveConfirm').on('click.couponRemoveConfirm',function(event){
					event.preventDefault();
					var 
						$tr = $btn.closest('tr'),
						data = $tr.data(),
						$D = $btn.closest('.ui-dialog-content');

					app.ext.admin.i.dialogConfirmRemove({
						'removeFunction':function(vars,$D){
							$D.showLoading({"message":"Deleting Coupon"});
							app.model.addDispatchToQ({'_cmd':'adminConfigMacro','@updates':["COUPON/REMOVE?coupon="+data.coupon],'_tag':{'callback':function(rd){
								$D.hideLoading();
								if(app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									$D.dialog('close');
									$('#globalMessaging').anymessage(app.u.successMsgObject('The coupon has been removed.'));
									$tr.empty().remove(); //removes row for list.
									}
								}
							}
						},'immutable');
						app.model.addDispatchToQ({'_cmd':'adminConfigDetail','coupons':true,'_tag':{'datapointer' : 'adminConfigDetail|coupons|'+app.vars.partition}},'immutable'); //update coupon list in memory.
						app.model.dispatchThis('immutable');
						}});
					})
				},

			showCCSuppInputs : function($ele)	{
				var
					$suppContainer = $("[data-app-role='providerSpecificInputs']",$ele.closest('form')),
					data = app.ext.admin.u.getValueByKeyFromArray(app.data['adminConfigDetail|payment|'+app.vars.partition]['@PAYMENTS'],'tender','CC'); //gathered outside 'click' so only executed once. supplies content to supplemental inputs (to pre-populate).

				$ele.off('change.showCCSuppInputs').on('change.showCCSuppInputs',function(){
					var gateway = $ele.val();
					$suppContainer.empty();
//the contents are emptied rather than having several hidden fieldsets so that no extra/unnecesary data is sent on the post (and no white/blacklisting needs to be done).
					if(gateway != 'TESTING' && gateway != 'NONE')	{
						$suppContainer.anycontent({'data':data ,'templateID':'paymentSuppInputsTemplate_'+gateway.toLowerCase()});
						}
					});
				$ele.trigger('change.showCCSuppInputs'); //trigger the change to show the selected fieldset (for initial load)
				}, //showCCSuppInputs

//this is applied to the 'add flex method' shipping button.  It adds the dropdown for choosing the method type and also the click events.
			handleAddShipment : function($ele)	{
				var
					$menu = $ele.next('ul'),
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
//vendorid gets passed as part of supply chain shipping configuration.
							if($btn.closest('.ui-dialog-content').data('vendorid'))	{
								sfo.VENDORID = $btn.closest('.ui-dialog-content').data('vendorid');
								}
							$form.showLoading({'message':'Registering account. This may take a few moments.'});
							var macroCmd = (sfo.provider == 'FEDEX') ? "FEDEX-REGISTER" : "UPSAPI-REGISTER";

							app.ext.admin.calls.adminConfigMacro.init(["SHIPMETHOD/"+macroCmd+"?"+$.param(sfo)],{'callback':function(rd){
								$form.hideLoading();
								if(app.model.responseHasErrors(rd)){
									$form.anymessage({'message':rd});
									}
								else	{
									if($btn.closest('.ui-dialog-content').length)	{
										$btn.closest('.ui-dialog-content').dialog('close');
										}
									else	{
										$form.parent().empty();
										}
//* 201324 -> made parent empty, not just form, so all the 'you are about...' text goes away too. editor now opens as well.
									app.ext.admin_config.a.showShipMethodEditorByProvider(sfo.provider,$("[data-app-role='slimLeftContent']",$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content"))));
									$('#globalMessaging').anymessage(app.u.successMsgObject('Activation successful!'));
									}
								}},'immutable');
							app.model.addDispatchToQ({'_cmd':'adminConfigDetail','shipmethods':true,'_tag':{'datapointer' : 'adminConfigDetail|shipmethods|'+app.vars.partition}},'immutable');
							app.model.dispatchThis('immutable');

							}
						else	{
							$form.anymessage({"message":"In admin_config.e.shippingPartnerRegExec, unable to ascertain provider. Was expecting it in the serialized form.","gMessage":true});
							}
						}
					else	{} //validateForm handles error display.
					});
				}, //shippingPartnerRegExec

			shippingGeneralUpdateExec : function($btn)	{
				$btn.button();
				$btn.off('click.shippingGeneralUpdateExec').on('click.shippingGeneralUpdateExec',function(){
					var $form = $btn.closest('form');
					if(app.u.validateForm($form))	{
						$form.showLoading({"message":"Updating shipping settings"});
						var macros = new Array();
						macros.push("SHIPPING/CONFIG?"+$.param($form.serializeJSON({'cb':true})));

//if any new bans have occured, update the list.
						var $bannedContainer = $("[data-app-role='bannedlistContainer']",$form);
						if($('.edited',$bannedContainer).length)	{
							macros.push("SHIPPING/BANNEDTABLE-EMPTY");
							var countries = "";
							$('tbody tr',$bannedContainer).each(function(){
								var $tr = $(this);
								if($tr.hasClass('rowTaggedForRemove'))	{
									$tr.empty().remove();
									} //row is being deleted. do not add. first macro clears all, so no specific remove necessary.
								else	{
									macros.push("SHIPPING/BANNEDTABLE-INSERT?match="+$tr.data('match')+"&type="+$tr.data('type'));
									}
								});
							}
// COUNTRIES!
//if any changes have occured to the blacklisted countries, update the list.
						var $blacklistContainer = $("[data-app-role='blacklistContainer']",$form);
						if($blacklistContainer.find('.edited').length)	{
							var blacklistMacro = "SHIPPING/CONFIG?blacklist="
							$('tbody tr',$blacklistContainer).each(function(){
								if($(this).hasClass('rowTaggedForRemove'))	{
									$(this).empty().remove();
									} //row is being deleted. do not add. first macro clears all, so no specific remove necessary.
								else	{
									blacklistMacro += $(this).data('country')+',';
									}
								});
							macros.push(blacklistMacro);
							}
//						app.u.dump("macros: "); app.u.dump(macros);
						app.ext.admin.calls.adminConfigMacro.init(macros,{'callback':'showMessaging','jqObj':$form,'message':'Your changes have been saved.','restoreInputsFromTrackingState':true,'removeFromDOMItemsTaggedForDelete':true},'immutable');
						app.model.destroy('adminConfigDetail|shipping|'+app.vars.partition);
						app.ext.admin.calls.adminConfigDetail.init({'shipping':true},{datapointer : 'adminConfigDetail|shipping|'+app.vars.partition},'immutable');
						app.model.dispatchThis('immutable');


						}
					else	{} //validateForm handles error display
					});
				}, //shippingGeneralUpdateExec

			partitionCreateShow : function($btn)	{

				$btn.button();
				$btn.off('click.couponCreateShow').on('click.couponCreateShow',function(event){

					event.preventDefault();
					var $D = app.ext.admin.i.dialogCreate({
						'title':'Add New Partition',
						'templateID':'partitionCreateTemplate',
						'showLoading':false //will get passed into anycontent and disable showLoading.
						});
					$D.dialog('open');
					});
				},	//couponCreateShow

			paymentMethodUpdateExec : function($btn)	{
				$btn.button();
				$btn.off('click.paymentMethodUpdateExec').on('click.paymentMethodUpdateExec',function(){
					app.u.dump(" -> BEGIN click.paymentMethodUpdateExec (admin_config).");
					var
						$form = $btn.closest('form'),
						sfo = $form.serializeJSON({'cb':true}) || {},
						macroCmd;
					
					if(sfo.tender && sfo.tenderGroup)	{
						$form.showLoading({'message':'Updating payment information'});
//						app.u.dump(" -> tender: "+sfo.tender);
//						app.u.dump(" -> tenderGroup: "+sfo.tenderGroup);
						
						if(app.u.validateForm($form))	{
							if(sfo.tenderGroup == 'WALLET')	{
								macroCmd = "PAYMENT/WALLET-"+sfo.tender;
								}
							else	{
								macroCmd = "PAYMENT/"+sfo.tenderGroup;
								}
//							app.u.dump(" -> macroCmd: "+macroCmd);
							app.ext.admin.calls.adminConfigMacro.init([macroCmd+"?"+$.param(sfo)],{'callback':'showMessaging','message':'Payment has been updated.','jqObj':$form,'restoreInputsFromTrackingState':true},'immutable');
					
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
				}, //paymentMethodUpdateExec

//This is the event to use for delegated events (as oppsed to app events).  It is also executed by the app event code.
			dataTableAddUpdate : function($ele,P)	{
//					app.u.dump("BEGIN admin_config.e.dataTableAddUpdate (Click!)");
				
				var
					$container = P['$container'] ? P['$container'] : $ele.closest('fieldset'),
				//tbody can be passed in thru P or, if not passed, it will look for one within the fieldset. rules engine uses P approach. shipping doesn't. same for form.
					$dataTbody = (P['$dataTbody']) ? P['$dataTbody'] : $("[data-app-role='dataTable'] tbody",$container),
					$form = (P['$form']) ? P['$form'] : $container.closest('form');
				
				
				if($container.length && $dataTbody.length && $dataTbody.data('bind'))	{
//						app.u.dump(" -> all necessary jquery objects found. databind set on tbody.");
				//none of the table data inputs are required because they're within the parent 'edit' form and in that save, are not required.
				//so temporarily make inputs required for validator. then unrequire them at the end. This feels very dirty.
				//	$('input',$container).attr('required','required'); 
//				app.u.dump(" -> app.u.validateForm($container): "+app.u.validateForm($container));
					if(app.u.validateForm($container))	{
//							app.u.dump(" -> form is validated.");
						var 
							bindData = app.renderFunctions.parseDataBind($dataTbody.attr('data-bind')),
							sfo = $container.serializeJSON({'cb':true}),
							$tr = app.renderFunctions.createTemplateInstance(bindData.loadsTemplate,sfo);


//							app.u.dump(" -> sfo: "); app.u.dump(sfo);
						
						$tr.anycontent({data:sfo});
						$tr.addClass('edited');
						$tr.addClass('isNewRow'); //used in the 'save'. if a new row immediately gets deleted, it isn't added.
						app.u.handleButtons($tr);
				
//if a row already exists with this guid, this is an UPDATE, not an ADD.
//						app.u.dump(" -> sfo.guid: "+sfo.guid); app.u.dump(" -> tr w/ guid length: "+$("tr[data-guid='"+sfo.guid+"']",$dataTbody).length)
						if(sfo.guid && $("tr[data-guid='"+sfo.guid+"']",$dataTbody).length)	{
							$("tr[data-guid='"+sfo.guid+"']",$dataTbody).replaceWith($tr);
							}
						else	{
							$tr.appendTo($dataTbody);
							}
						app.u.handleAppEvents($tr,P); //P are passed through so that buttons in list can inheret. rules uses this.
// * 201324 -> after add/save, clear the inputs for the next entry.
// * 201330 -> turns out this behavior may not always be desired. caused issues in shipping. can now be disabled.
						if($ele.data('form-skipreset'))	{
							}
						else	{
							$('input, textarea',$container).not(':radio').val(""); //clear inputs. don't reset radios in this manner or they'll lose their value.
							$(':radio').prop('checked',false);
							$('select',$container).val();
							$(':checkbox',$container).prop('checked',false);
							}
						app.ext.admin.u.handleSaveButtonByEditedClass($form);
						}
					else	{
						app.u.dump("form did not validate");
						//validateForm handles error display.
						}
				//	$('input',$container).attr('required','').removeAttr('required');
					
					}
				else	{
					$ele.closest('form').anymessage({"message":"In admin_config.e.dataTableAddExec, unable to ascertain container ["+$container.length+"], tbody for data table or that tbody ["+$dataTbody.length+"] has no bind-data.","gMessage":true});
					app.u.dump(" -> $container.length: "+$container.length);
					app.u.dump(" -> $dataTbody.length: "+$dataTbody.length);
					app.u.dump(" -> $form.length: "+$form.length);
					app.u.dump(" -> $dataTbody.data('bind'): "); app.u.dump($dataTbody.data('bind'));
					}
				},

//This is where the magic happens. This button is used in conjunction with a data table, such as a shipping price or weight schedule.
//It takes the contents of the fieldset it is in and adds them as a row in a corresponding table. it will allow a specific table to be set OR, it will look for a table within the fieldset (using the data-app-role='dataTable' selector).
//the 'or' was necessary because in some cases, such as handling, there are several tables on one page and there wasn't a good way to pass different params into the appEvent handler (which gets executed once for the entire page).
// $form = the parent form of the data table. It's used for updating the corresponding 'save' button w/ the number of changes. that form is NOT validated or included in the serialized Form Object.
// $dataTbody = the tbody of the dataTable to be updated (where rows get added when the entry form is saved).
// $container = the fieldset (or some other element) that contains the form inputs used to generate a new row. NOT always it's own form.
			dataTableAddExec : function($btn,vars)	{
				$btn.button();
				$btn.off('click.dataTableAddExec').on('click.dataTableAddExec',function(event){
					event.preventDefault();
					app.ext.admin_config.e.dataTableAddUpdate($btn,vars);
					return false;
					});
				}, //dataTableAddExec

//a generic app event for updating a dataTable. This button would go on the fieldset and would search withing that fieldset for a dataTable, then use data-guid to find a match in that table.
//this isn't necessary.  dataTableAddExec already does this.  Left here so next time I come to write this, I'm reminded I've already done it. 
//			dataTableUpdateExec : function($btn,vars)	{},




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
									app.ext.admin.calls.adminConfigMacro.init(["SHIPMETHOD/REMOVE?provider="+provider],{'callback':function(rd){
$D.parent().hideLoading();
if(app.model.responseHasErrors(rd)){
	$D.anymessage({'message':rd});
	}
else	{
	$D.dialog('close');
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


			taxTableUpdateExec : function($btn)	{
				$btn.button();
				$btn.off('click.taxTableUpdateExec').on('click.taxTableUpdateExec',function(){

$('body').showLoading({'message':'Updating tax table'});

var macros = new Array();
macros.push("TAXRULES/EMPTY");
$btn.closest('form').find('tbody tr').each(function(){ //tbody needs to be is selector so that tr in thead isn't included.
	if($(this).hasClass('rowTaggedForRemove'))	{} //row tagged for delete. do not insert.
	else	{
//		app.u.dump($(this).data());
		macros.push("TAXRULES/INSERT?"+app.ext.admin.u.getSanitizedKVPFromObject($(this).data()));
		}
	});

//app.u.dump(" -> macros: "); app.u.dump(macros);
app.ext.admin.calls.adminConfigMacro.init(macros,{'callback':function(rd){
	$('body').hideLoading();	
	if(app.model.responseHasErrors(rd)){
		$('#globalMessaging').anymessage({'message':rd});
		}
	else	{
		$('#globalMessaging').anymessage(app.u.successMsgObject('Your rules have been saved.'));
		navigateTo('#!taxConfig');
		}
	}},'immutable');
app.model.dispatchThis('immutable');
					});
				},

//executed on a manage rules button.  shows the rule builder.
			ruleBuilderShow : function($btn)	{
				$btn.button();
				$btn.off('click.ruleBuilderShow').on('click.ruleBuilderShow',function(event){
					event.preventDefault();
					var rulesMode = $btn.data('rulesmode');
					if($btn.data('table') && (rulesMode == 'shipping' || rulesMode == 'coupons'))	{
						if(rulesMode == 'shipping')	{
							var provider = $btn.closest('form').find("[name='provider']").val();
							if(provider)	{
								app.ext.admin_config.a.showRulesBuilderInModal({'rulesmode':rulesMode,'provider':provider,'table':$btn.data('table')});
								}
							else	{
								$('#globalMessaging').anymessage({'message':'In admin_config.e.ruleBuilderShow, unable to ascertain provider ['+provider+'] and/or table ['+$btn.data('table')+'].','gMessage':true});
								}
							}
						else if(rulesMode == 'coupons')	{
							app.ext.admin_config.a.showRulesBuilderInModal({'rulesmode':rulesMode,'table':$btn.data('table'),'couponCode':$btn.closest("[data-couponcode]").data('couponcode')});
							}
						else	{
							$('#globalMessaging').anymessage({'message':'In admin_config.e.ruleBuilderShow, rulesmode value is not valid ['+vars.rulesmode+']. must be shipping or coupons','gMessage':true});
							} //should never get here.
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_config.e.ruleBuilderShow, rulesMode is empty or invalid ['+rulesMode+'] OR no data-table ['+$btn.data('table')+'] set. data-rulesmode should be set as data-rulesmode on the button with the app-event and the value must be coupons or shipping. data-table should likewise be set on the button.','gMessage':true});
						}

					});
// return false;				
				}, //taxTableUpdateExec

//executed by the 'add new rule' button. opens a dialog and, on save, updates the tbody of the rule builder.
//the rule is NOT actually saved until the 'save' button is pushed.
			ruleBuilderAddShow : function($btn,vars)	{
				$btn.button({icons: {primary: "ui-icon-plus"},text: true});
				$btn.off('click.ruleBuilderAddShow').on('click.ruleBuilderAddShow',function(){

//on a new rule, guid needs to be set. there's a hidden input in the form that, by passing it in thru data, will get populated.
//this allows for the editing of a new rule before it is saved.
					var DVars = {
						'title' : 'Add New Rule',
						'data' : {
							'guid':app.u.guidGenerator()
							}
						};
						
					if(vars.rulesmode == 'shipping')	{
						DVars.data = $.extend(true,DVars.data,app.data['adminPriceScheduleList']);
						DVars.templateID = 'rulesInputsTemplate_shipping';
						}
					else if(vars.rulesmode == 'coupons')	{
						DVars.templateID = 'rulesInputsTemplate_coupons';
						}
					
//					app.u.dump(" -> DVars:"); app.u.dump(DVars);
					
					var
						$DMI = $btn.closest("[data-app-role='dualModeContainer']"),
						$D = app.ext.admin.i.dialogCreate(DVars);

					$D.dialog('open');
//					app.u.dump(" -> $D.length: "+$D.length);
//					app.u.dump(" -> $dataTbody.length: "+$("[data-app-role='dualModeListTbody']").length);
//					app.u.dump(" -> $DMI.length: "+$DMI.length);
					app.u.handleAppEvents($D,$.extend(true,{},vars,{'$form':$DMI,'$dataTbody': $("[data-app-role='dualModeListTbody']",$DMI)}));
//add an extra event to the rule button to close the modal. The template is shared w/ the rule edit panel, so the action is not hard coded into the app event.
					$("[data-app-event='admin_config|dataTableAddExec']",$D).on('click.closeModal',function(){
						if(app.u.validateForm($('form',$D)))	{
							$D.dialog('close');
							}
						})			
					})
				}, //ruleBuilderAddShow

//executed by the 'save' button once new rules or rule order has changed.
			ruleBuilderUpdateExec : function($btn,vars)	{
				$btn.button();
				$btn.off('click.ruleBuilderUpdateExec').on('click.ruleBuilderUpdateExec',function(event){
event.preventDefault();


vars = vars || {};
//app.u.dump(" -> vars: "); app.u.dump(vars);

var
	$dualModeContainer = $btn.closest("[data-app-role='dualModeContainer']"),
	$tbody = $("[data-app-role='dualModeListTbody']",$dualModeContainer).first() || "", //default to blank so .length doesn't error.
	macros = new Array();

//need a table and rulesmode. for shipping, provider is also needed.
if(vars.table && ((vars.rulesmode == 'coupons' && vars.couponCode) || (vars.rulesmode == 'shipping' && vars.provider)))	{
	if($tbody.length)	{
		$btn.closest('.ui-dialog-content').showLoading({'message':'Updating Rules'});

//build the shipping macros.
		if(vars.rulesmode == 'shipping')	{
			macros.push("SHIPMETHOD/RULESTABLE-EMPTY?provider="+vars.provider+"&table="+vars.table);
			$('tr',$tbody).each(function(){
				if($(this).hasClass('rowTaggedForRemove'))	{} //row tagged for delete. do not insert.
				else	{
					macros.push("SHIPMETHOD/RULESTABLE-INSERT?provider="+vars.provider+"&table="+vars.table+"&"+app.ext.admin.u.getSanitizedKVPFromObject($(this).data()));
					}
				});
			

			}
		else if(vars.rulesmode == 'coupons')	{
			//unlike shipping, coupon rules are non-destructive. so we only impact codes that were edited, added or deleted.
			macros.push("COUPON/RULESTABLE-EMPTY?coupon="+vars.couponCode);
			$('tr',$tbody).each(function(){
				var $tr = $(this);
				if($tr.hasClass('rowTaggedForRemove'))	{
					//these are being removed. since the entire table was emptied, just don't pass and they'll be nuked.
					}
				else	{
					macros.push("COUPON/RULESTABLE-INSERT?coupon="+vars.couponCode+"&"+app.ext.admin.u.getSanitizedKVPFromObject($tr.data()));
					}
				});


			}
		else	{} //catch all. shouldn't get here.

		app.u.dump(' -> macros: '); app.u.dump(macros);

		app.ext.admin.calls.adminConfigMacro.init(macros,{'callback':function(rd){
			if(app.model.responseHasErrors(rd)){
				$('.dualModeListMessaging',$dualModeContainer).anymessage({'message':rd});
				}
			else	{
				$btn.closest('.ui-dialog-content').dialog('close');
				$('#globalMessaging').anymessage(app.u.successMsgObject('Your rules have been saved.'));
				}
			}},'immutable');

//These subsequents requests need to take place AFTER the configMacro so that the changes set there are reflected in the detail updates below.
		if(vars.rulesmode == 'shipping')	{
			//need to get shipments updated so that the rules for the method are updated in memory. important if the user comes right back into the editor.
			app.model.destroy('adminConfigDetail|shipmethods|'+app.vars.partition);
			app.ext.admin.calls.adminConfigDetail.init({'shipmethods':true},{datapointer : 'adminConfigDetail|shipmethods|'+app.vars.partition},'immutable');
			}
		else if(vars.rulesmode == 'coupons')	{
			//need to get shipments updated so that the rules for the method are updated in memory. important if the user comes right back into the editor.
			app.model.addDispatchToQ({'_cmd':'adminConfigDetail','coupons':true,'_tag':{'datapointer' : 'adminConfigDetail|coupons|'+app.vars.partition}},'immutable');
			}
		else	{} //coupons and shipping are the only two valid modes, so far.
		
		app.model.dispatchThis('immutable');
		}
	else	{
		$('.dualModeListMessaging',$dualModeContainer).anymessage({'message':'In admin_config.e.ruleBuilderUpdateExec, unable to locate tbody for building rules macro.','gMesage':true})
		}
	}
else	{
	$('.dualModeListMessaging',$dualModeContainer).anymessage({'message':'In admin_config.e.ruleBuilderUpdateExec, unable to ascertain vars.rulesmode ['+vars.rulesmode+'] vars.table ['+vars.table+'] OR (vars.rulesmode is shipping and vars.provider not found ['+vars.provider+'] OR  vars.rulesmode is coupons and vars.couponCode not found ['+vars.couponCode+']).','gMesage':true})
	}
					});
				},




//opens an editor for an individual rule. uses anypanel/dualmode
			showRuleEditorAsPanel : function($btn,vars)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				$btn.off('click.showRuleEditorAsPanel').on('click.showRuleEditorAsPanel',function(){

//app.u.dump("BEGIN admin_config.e.showRuleEditorAsPanel click event");

var
	$DMI = $btn.closest("[data-app-role='dualModeContainer']"),
	data = {},
	$target = $("[data-app-role='dualModeDetail']",$DMI),
	header = '', //heading for rules editor.
	templateID = '',
	panelID = '',
	showRules = true; //a boolean used after some error checking.

if(vars.rulesmode)	{
	if(vars.rulesmode == 'shipping')	{
		data = $.extend(true,{},app.data['adminPriceScheduleList'],$btn.closest('tr').data());
		var provider = $btn.closest("[data-provider]").data('provider');
		panelID = 'ruleBuilder_'+data.provider;
		header = 'Edit: '+data.name;
		templateID = 'rulesInputsTemplate_shipping';
		}
	else if(vars.rulesmode == 'coupons')	{
		data = $btn.closest('tr').data();
		header = 'Edit: '+data.hint;
		panelID = 'ruleBuilder_'+data.guid;
		templateID = 'rulesInputsTemplate_coupons';
		}
	else	{
		showRules = false;
		}
	
	if(showRules)	{
		var $panel = $("<div\/>").hide().anypanel({
			'header':header,
			data : data, //app.ext.admin_config.u.getShipMethodByProvider(provider)['@RULES'][$btn.closest('tr').attr('data-obj_index')]
			'templateID':templateID
			}).prependTo($target);
		app.ext.admin.u.toggleDualMode($DMI,'detail');
		$panel.slideDown('fast');
		//the schedule render format doesn't have a good mechanism for pre-checking a value.
		if(data.schedule)	{
			$("[name='SCHEDULE']",$panel).val();
			}
		app.u.handleAppEvents($panel,{'$dataTbody':$btn.closest('tbody'),'$form':$DMI});			
		}
	
	
	}
else {
	$('#globalMessaging').anymessage({'message':'In admin_config.e.showRuleEditorAsPanel, unable to ascertain rulemode. Should be passed into handleAppEvents as param 2 (vars).','gMesage':true})
	}

					});
				},

			pluginUpdateExec : function($btn)	{
				$btn.button();
				$btn.off('click.pluginUpdateExec').on('click.pluginUpdateExec',function(event){
					event.preventDefault();
					var $form = $btn.closest('form');
					$form.showLoading({'message':'Saving Changes'});
					app.model.addDispatchToQ({
	'_cmd':'adminConfigMacro',
	'@updates' : ["PLUGIN/SET?"+$.param($form.serializeJSON({'cb':true}))],
	'_tag':	{
		'callback':'showMessaging',
		'restoreInputsFromTrackingState' : true,
		'message' : "Your changes have been saved.",
		'jqObj' : $form
		}
	},'immutable');
app.model.dispatchThis('immutable');
					});
				},

			pluginUpdateShow : function($ele)	{
				$ele.addClass('lookLikeLink');
				$ele.off('click.pluginUpdateShow').on('click.pluginUpdateShow',function(event){
					event.preventDefault();
					app.ext.admin_config.a.showPlugin($ele.closest("[data-app-role='slimLeftContainer']").find("[data-app-role='slimLeftContent']:first"),{'plugin':$ele.data('plugin')})
					})
				},

//delegated events

			adminDomainDiagnosticsShow : function($ele,p)	{
				if($ele.data('domainname'))	{
					app.model.addDispatchToQ({'_cmd':'adminDomainDiagnostics','DOMAINNAME':$ele.data('domainname'),'_tag':{'datapointer':'adminDomainDiagnostics|'+$ele.data('domainname'),'callback':'anycontent','jqObj':$ele.closest("[data-app-role='tabContainer']").find("[data-anytab-content='domainDiagnostics']:first").showLoading({'message':'Fetching domain diagnostics'})}},'mutable');
					app.model.dispatchThis('mutable');
					}
				else	{
					$ele.closest("[data-app-role='tabContainer']").anymessage({"message":"in admin_config.e.adminDomainDiagnosticsShow, data-domainname not set on element.","gMessage":true});
					}
				}, //adminDomainDiagnosticsShow
//triggered on both the view and download buttons. based on data-mode, will either open a download dialog or show the invoice in a modal.
			billingInvoiceViewDownload : function($ele,p)	{

				var invoice = $ele.closest("[data-invoice]").data('invoice');
				if(invoice)	{
					var cmdObj = {
						'_cmd':'billingInvoiceView',
						'invoice' : invoice,
						'_tag':	{
							'datapointer' : 'billingInvoiceView'
							}
						}
				
					if($ele.data('mode') == 'download')	{
						cmdObj._tag.callback = 'fileDownloadInModal';
						cmdObj._tag.skipDecode = true;
						cmdObj._tag.filename = 'invoice_'+invoice+'.html';
						}
					else	{
						var $D = app.ext.admin.i.dialogCreate({
							'title' : 'Invoice '+invoice
							});
						cmdObj._tag.callback = 'anycontent';
						cmdObj._tag.translateOnly = true;
						cmdObj._tag.jqObj = $D;
						$D.append("<div data-bind='var:invoice(body); format:text;'><\/div>");
						$D.dialog('option','height',($(document.body).height() - 100));
						$D.dialog('open');
						$D.showLoading({'message':'Fetching invoice details'});
						}
					app.model.addDispatchToQ(cmdObj,'mutable');
					app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_config.e.billingInvoiceViewDownload, unable to ascertain invoice #.","gMessage":true});
					}
				
				}, //billingInvoiceViewDownload
			
			billingHandleTabContents : function($ele,p)	{
				var tab = $ele.closest('.ui-tabs-nav').find('.ui-state-active').data('anytabsTab');
				var $tabContent = $ele.closest("[data-app-role='billingHistory']").find("[data-anytab-content='"+tab+"']:first");
				if($tabContent.data('uiAnycontent'))	{} //already request/rendered content
				else	{
					var cmd;
					if(tab == 'paymentMethods')	{
						cmd = 'billingPaymentMethodsList';
						}
					else if(tab == 'pendingTransactions')	{
						cmd = 'billingPendingCharges';
						}
					else	{} //unrecognized tab.
					
					if(cmd)	{
						$tabContent.showLoading({'message':'Fetching details'});
						app.model.addDispatchToQ({
							'_cmd':cmd,
							'_tag':{
								'callback': 'anycontent',
								'skipAppEvents' : true,
								'jqObj' : $tabContent,
								'datapointer':cmd
							}
						},'mutable');
						app.model.dispatchThis('mutable');
						}
					else	{}
					}
				} //billingHandleTabContents


			} //e [app Events]
		} //r object.
	return r;
	}