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


var admin_config = function(_app) {
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
				// _app.model.fetchNLoadTemplates(_app.vars.baseURL+'extensions/admin/config.html',theseTemplates);
				r = true;

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				_app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		a : {

			showEmailAuth : function($target)	{
				//app vars is passed in so the email input can be prepopulated w/ the domain in focus.
				$target.empty().append(_app.u.addEventDelegation($("<div \/>").anycontent({'templateID':'emailAuthenticationPageTemplate','data':_app.vars})));
				_app.u.handleButtons($target);
				},

			passwordUpdate : function($target,P)	{
				$target.tlc({'templateid':'passwordUpdateTemplate','verb':'template'});
				_app.u.handleButtons($target);
				_app.u.addEventDelegation($target);
				},


			//shows the lists of all notifications and the means to edit each one individually.
			showNotifications : function($target,params)	{
				$target.showLoading({"message":"Fetching notifications"});
				$target.tlc({'templateid':'notificationPageTemplate','verb':'template'});
				_app.u.addEventDelegation($target);
				_app.u.handleButtons($target);
				$(".slimLeftNav .accordion",$target).accordion({
					heightStyle: "content"
					});

				_app.model.addDispatchToQ({'_cmd':'adminConfigDetail','notifications':1,'_tag':{'datapointer':'adminConfigDetail|'+_app.vars.partition+'|notifications',callback : function(rd){

					$target.hideLoading();
					if(_app.model.responseHasErrors(rd)){
						$target.anymessage({'message':rd});
						}
					else	{

						var notes = _app.data[rd.datapointer]['@NOTIFICATIONS'];
						
						for(var i = 0, L = notes.length; i < L; i += 1)	{
							var e = (notes[i].event ? notes[i].event.split('.')[0] : '');
							if(e && notes[i])	{
								$("[data-app-role='notifications_"+e+"']",$target).append("<li data-app-click='admin_config|notificationUpdateShow' class='lookLikeLink' data-event="+notes[i]['event']+"><b>"+notes[i]['event'] +" <\/li>");
								}
							else	{
								//either no verb set or @VERBS was empty.
								}
							}
						//when the accordion is originally generated, there's no content, so the accordion panels have no height. this corrects.
						// the accordion does get initiated here because the left column looked out of place for too long.
						$(".slimLeftNav .accordion",$target).accordion('refresh');
						//handle loading the content. 
						if(params.msgid)	{
							$("[data-msgid='"+_app.u.jqSelector('',params.msgid)+"']",$target).trigger('click').closest('.ui-accordion-content').prev('.ui-accordion-header').trigger('click');
							}
						else if(params.setting)	{
							$("[data-setting='"+_app.u.jqSelector('',params.setting)+"']",$target).trigger('click');
							}
						else	{
							$("[data-setting='general']",$target).trigger('click');
							}
						}

					}}},'mutable');

				_app.model.dispatchThis("mutable");
				}, //blastMessagesList

			showBillingHistory : function($target)	{
				$target.empty();
				$target.anycontent({'templateID':'billingHistoryTemplate','showLoading':false});
				_app.u.addEventDelegation($target);
				$("[data-app-role='billingHistory']",$target).anyform({'trackEdits':true});
				_app.u.handleCommonPlugins($target);
				_app.u.handleButtons($target);
				var $tabContent = $("[data-anytab-content='invoices']",$target);
				$tabContent.showLoading({'message':'Fetching invoice list'});

				_app.model.addDispatchToQ({
					'_cmd':'billingInvoiceList',
					'_tag':{
						'callback': 'anycontent',
						'jqObj' : $tabContent,
						'skipAppEvents' : true, 
						'datapointer':'billingTransactions'
					}
				},'mutable');
				_app.model.dispatchThis('mutable');
				},
		
			showPluginManager : function($target,p)	{
				$target.showLoading({'message':'Fetching Your Integration Data'});
				_app.u.addEventDelegation($target);
				_app.model.addDispatchToQ({
					'_cmd':'adminConfigDetail',
					'plugins':1,
					'_tag':{
						'callback': 'tlc',
						'templateID' : 'pluginManagerPageTemplate',
						'jqObj' : $target,
						'onComplete' : function(rd)	{
							var plugs = _app.data[rd.datapointer]['@PLUGINS'];
							var $nav = $("[data-app-role='slimLeftNav']",$target); //used to get narrow context.
							var $tmp = $("<ul>");
							for(var i = 0, L = plugs.length; i < L; i += 1)	{
								if($("li[data-plugin='"+plugs[i].plugin+"']",$nav).length)	{}
								else	{
									$tmp.append("<li data-plugin='"+plugs[i].plugin+"' data-app-click='admin_config|pluginUpdateShow' class='lookLikeLink'>"+plugs[i].plugin+"</li>");
									}
								}
							if($tmp.children().length)	{$("[data-app-role='pluginOtherList']",$nav).append($tmp.children())}
							$("[data-app-role='slimLeftNav']",$target).accordion({heightStyle: "content"});
							if(p.plugin)	{
								$("li[data-plugin='"+p.plugin+"']:first").trigger('click').closest('ul').prev().trigger('click');
								}
							},
						'datapointer':'adminConfigDetail|plugins'
					}
				},'mutable');
				_app.model.dispatchThis('mutable');
				},
			
			showPlugin : function($target,vars)	{
				vars = vars || {};
				if($target instanceof jQuery && (vars.plugin || vars.verb == 'create'))	{
					var dataset, $template;
					vars.scope='PRT'
					
					if(vars.verb == 'create')	{
						dataset = {};
						$template = new tlc().getTemplateInstance('pluginTemplate_generic');
						}
					else	{
						//we get a template here for two reasons. 1 is to see if it exists. 2 is because if it does exist, it may have attributes we need for 'settings'
						$template = new tlc().getTemplateInstance('pluginTemplate_'+vars.plugin);
						//verify whether or not a specific template exists for this partner. if so, use it. otherwise, defualt to the generic one.
						if($template instanceof jQuery)	{
							vars.scope = $template.attr('data-plugin-scope') || 'PRT';
							}
						else	{
							$template = new tlc().getTemplateInstance('pluginTemplate_generic');
							}
						dataset = $.extend({},vars,_app.vars,_app.ext.admin_config.u.getPluginData(vars.plugin));
						}

					$target.empty().append($template);
					//need to translate the plugin container so that the 'edit' and button tlc is translated.
					$target.closest("[data-app-role='slimLeftContentSection']").tlc({'verb':'translate','dataset':dataset}).find('.buttonset').show();
					$target.closest('form').anyform({'trackEdits':true}).data({'verb':vars.verb,'scope':vars.scope.toUpperCase()});

					_app.u.handleCommonPlugins($target);
					_app.u.handleButtons($target);
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_config.a.showPlugin, $target was not set or is not an instance of jQuery or vars.plugin ["+vars.plugin+"] no set.","gMessage":true});
					}
				},
			
			showGlobalSettings : function($target)	{
				$target.empty();
				var $div = $("<div \/>").appendTo($target);
				$div.showLoading({"message":"Fetching Global Settings"});
				_app.u.addEventDelegation($div);
				$div.anyform({
					'trackEdits':true,
					trackSelector:'form'
					})
				_app.model.addDispatchToQ({
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
				_app.model.dispatchThis('mutable');
				},
			
			showPaymentManager : function($target)	{
				$target.showLoading({'message':'Fetching your payment method settings'});
				_app.model.destroy('adminConfigDetail|payment|'+_app.vars.partition);
				_app.u.addEventDelegation($target);
				_app.ext.admin.calls.adminConfigDetail.init({'payment':true},{
					'callback' : 'anycontent',
					'datapointer' : 'adminConfigDetail|payment|'+_app.vars.partition,
					'templateID' : 'paymentManagerPageTemplate',
					'onComplete' : function(){
						$("li[data-tender='CC']",$target).trigger('click');
						_app.u.handleCommonPlugins($target);
						$target.anyform({'trackEdits':true});
						},
					jqObj : $target
					},'mutable');
				_app.model.dispatchThis('mutable');
				}, //showPaymentManager
			
			showPaymentTypeEditorByTender : function(tender,$target){
//				_app.u.dump("BEGIN showPaymentTypeEditorByTender ["+tender+"]");
				if(tender && $target)	{
					$target.empty();
					$target.closest('form').find('.buttonset:first').show().find('button').button('disable').find('.numChanges').text("");
					var payData = _app.ext.admin_config.u.getPaymentByTender(tender);
//					_app.u.dump(" -> payData: "); _app.u.dump(payData);
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
						// ** 201402 -> these payment types no longer support a handling fee.
						case 'COD':
						case 'CHKOD':
							$target.append($("<input \/>",{'name':'tenderGroup','type':'hidden'}).val('OFFLINE'));
							$("<div \/>").anycontent({'templateID':'paymentAvailabilityTemplate',data : payData}).appendTo($target);
							break;
						
						case 'CHECK':
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
					_app.u.addEventDelegation($target);
					$target.anyform({'trackEdits':true});
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_config.a.showPaymentTypeEditorByTender, both $target ['+typeof $target+'] and tender ['+tender+'] are required.','gMessage':true});
					}
				}, //showPaymentTypeEditorByTender


			showContactInformation : function($target)	{
//				$target.showLoading({'message':'Fetching Contact Details'});
				_app.model.destroy('adminConfigDetail|account|'+_app.vars.partition);
				_app.u.addEventDelegation($target);

				$target.anycontent({'templateID':'contactInformationTemplate'}).anyform({'trackEdits':true});

				_app.ext.admin.calls.adminConfigDetail.init({'account':true},{
					'datapointer' : 'adminConfigDetail|account|'+_app.vars.partition,
					'callback' : 'anycontent',
					'translateOnly' : true,
					'jqObj':$target},'mutable');
				_app.model.dispatchThis('mutable');
				}, //showContactInformation


			showTaxConfig : function($target)	{
//				_app.u.dump("BEGIN admin_config.a.showTaxConfig");
				$target.anycontent({
					'templateID':'taxConfigTemplate',
					'showLoadingMessage' : 'Fetching tax details'
					}).anyform();
				_app.u.addEventDelegation($target);
				$("[data-app-role='taxTableExecForm']",$target).anyform({'trackEdits':true});
				$("[name='expires']",$target).datepicker({
					changeMonth: true,
					changeYear: true,
					minDate: 0,
					dateFormat : "yymmdd"
					});

				var datapointer = 'adminConfigDetail|taxes|'+_app.vars.partition
				_app.model.destroy(datapointer);
				_app.ext.admin.calls.adminConfigDetail.init({'taxes':true},{
					'datapointer' : datapointer,
					'callback' : 'anycontent',
					'translateOnly' : true,
					'skipAppEvents' : true,
					'jqObj' : $target
					},'mutable');
				_app.model.dispatchThis('mutable');
				}, //showTaxConfig


			showShippingManager : function($target,P)	{
				P = P || {};
				$target.showLoading({'message':'Fetching your active shipping methods'});
//				dump(" ->>>> params: "); dump(P,'debug');
				
				_app.model.destroy('adminConfigDetail|shipping|'+_app.vars.partition);
				_app.model.destroy('adminConfigDetail|shipmethods|'+_app.vars.partition);
				
				_app.ext.admin.calls.appResource.init('shipcountries.json',{},'mutable');
				_app.ext.admin.calls.adminConfigDetail.init({'shipping':true},{datapointer : 'adminConfigDetail|shipping|'+_app.vars.partition},'mutable');
				_app.ext.admin.calls.adminConfigDetail.init({'shipmethods':true},{datapointer : 'adminConfigDetail|shipmethods|'+_app.vars.partition,callback : function(rd){
					if(_app.model.responseHasErrors(rd)){
						$target.hideLoading();
						$('#globalMessaging').anymessage({'message':rd});
						}
					else	{
						
						$target.anycontent({
							'templateID':'shippingManagerPageTemplate',
							'data':$.extend(true,{},_app.data['adminConfigDetail|shipping|'+_app.vars.partition],_app.data['adminConfigDetail|shipmethods|'+_app.vars.partition])
							});

						var shipmethods = new Array();
						if(_app.data['adminConfigDetail|shipmethods|'+_app.vars.partition] && _app.data['adminConfigDetail|shipmethods|'+_app.vars.partition]['@SHIPMETHODS'])	{
							shipmethods = _app.data['adminConfigDetail|shipmethods|'+_app.vars.partition]['@SHIPMETHODS'];
							}

						var
							L = shipmethods.length,
							$flexUL = $("[data-app-role='shipMethodsByFlex']",$target);
//genrate the list of flex methods.
//disabled methods will get a class to help indicate they're disabled.
						for(var i = 0; i < L; i += 1)	{
							if(shipmethods[i].provider.indexOf('FLEX:') === 0)	{
//								_app.u.dump("shipmethods[i].enabled: "+shipmethods[i].enable);
								var $li = $("<li \/>");
								$li.attr('data-provider',shipmethods[i].provider) //needs to be an attribute. is used as a selector later.
								$li.text(shipmethods[i].name);
								if(shipmethods[i].handler)	{$li.append(" ["+shipmethods[i].handler.toLowerCase()+"]")}
								$li.addClass((shipmethods[i].enable == 1) ? '' :'opacity50');
								$li.appendTo($flexUL)
								}
							}

						_app.u.handleButtons($target);
						_app.u.addEventDelegation($target);
						$target.anyform();
						var
							$leftColumn = $("[data-app-role='slimLeftNav']",$target),
							$contentColumn = $("[data-app-role='slimLeftContent']",$target);
 
						$("[data-app-role='shipMethodsByZone']:first, [data-app-role='shipMethodsGlobal']:first, [data-app-role='shipMethodsByFlex']:first",$leftColumn).find('li').each(function(){
							$(this).addClass('ui-corner-none pointer').attr('data-app-click','admin_config|shipMethodUpdateShow');
							});
						if(!P.provider)	{P.provider = 'GENERAL'} //load the general settings by default.
						if($("li[data-provider='"+P.provider+"']",$leftColumn).length)	{
							$("li[data-provider='"+P.provider+"']",$leftColumn).trigger('click');
							}
						else	{
							$target.anymessage({"message":"The shipping provider "+P.provider+" does not exist","gMessage":true});
							}
						}
					}},'mutable');
				_app.model.dispatchThis('mutable');
				}, //showShippingManager


			showAddFlexShipment : function(shipmethod,$target)	{
				if(shipmethod && $target)	{
					$target.empty();
					$target.closest('form').find('.buttonset:first').hide() //this contains the buttons for the editor. create has it's own button.
					$("<div \/>").anycontent({'templateID':'shippingFlex_shared',data:{'provider':"FLEX:"+shipmethod+"_"+Math.round(+new Date()/1000)}}).appendTo($target);
					$("[data-app-role='rulesFieldset']",$target).hide(); //disallow rule creation till after ship method is created.
					$target.append("<p><b>Once you save the ship method, more specific inputs and rules will be available.<\/b><\/p>");
					$target.append("<button data-app-click='admin_config|shipmethodAddUpdateExec' data-mode='insert' data-handler='"+shipmethod+"' class='applyButton'>Save<\/button>");
					_app.u.handleButtons($target);
					_app.u.handleCommonPlugins($target);
					}
				else if($target)	{
					$target.anymessage({'message':'In admin_config.a.showAddFlexShipment, shipmethod not passed.','gMessage':true});
					}
				else	{
					$("#globalMessaging").anymessage({'message':'In admin_config.a.showAddFlexShipment, shipmethod and target not passed.','gMessage':true});
					}
				}, //showAddFlexShipment


			showShipMethodEditorByProvider : function(provider,$target)	{
				dump("BEGIN showShipMethodEditorByProvider --------------");
				if(provider && $target instanceof jQuery)	{
					$target.empty();
					$target.closest('form').find('.buttonset').hide(); //turn this off always. turn on when needed.
					
					if(provider == 'GENERAL')	{
						$target.anycontent({
							'templateID':'shippingGeneralTemplate',
							'data':$.extend(true,{},_app.data['adminConfigDetail|shipping|'+_app.vars.partition],_app.data['adminConfigDetail|shipmethods|'+_app.vars.partition],_app.data['appResource|shipcountries.json'])
							});
						}
					else	{
						var shipData = _app.ext.admin_config.u.getShipMethodByProvider(provider);
//						dump(" ->>>> shipData: "); dump(shipData,'debug');
						if(!$.isEmptyObject(shipData))	{
							_app.ext.admin.u.handleSaveButtonByEditedClass($target.closest('form')); //reset the save button.
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
						else	{
							$target.anymessage({"message":"In admin_config.a.showShipMethodEditorByProvider, the provider ["+provider+"] was not found in the shipmethods object.","gMessage":true});
							}
						
						}

					_app.u.handleCommonPlugins($target);
					_app.u.handleButtons($target);
					_app.ext.admin.u.applyEditTrackingToInputs($target.closest('form'));


					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_config.a.showShipMethodEditorByProvider, both $target (as an instanceof jQuery) ['+($target instanceof jQuery)+'] and provider ['+provider+'] are required.','gMessage':true});
					}
				
				}, //showShipMethodEditorByProvider
				
			showCouponManager : function($target)	{
				_app.ext.admin.i.DMICreate($target,{
					'header' : 'Coupon Manager', //left off because the interface is in a tab.
					'className' : 'couponManager',
					'buttons' : [
						"<button data-app-click='admin_tools|siteDebugDialog' data-verb='adminDebugPromotion' class='applyButton'>Debug</button>",
						"<button data-app-click='admin_batchjob|adminBatchJobExec' data-type='EXPORT/RULES' data-element data-export='coupon' data-whitelist='export' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowthickstop-1-s'>Download Coupon Rules<\/button>",
						"<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh Coupon List<\/button>",
						"<button data-app-click='admin_config|couponCreateShow' data-text='true' data-icon-primary='ui-icon-plus' class='applyButton'>Add Coupon<\/button>"
						],
					'thead' : ['Disabled','Code','Title','Auto','Created','Begins','Expires',''],
					'tbodyDatabind' : "var: users(@COUPONS); format:processList; loadsTemplate:couponsResultsRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminConfigDetail',
						'coupons' : true,
						'_tag' : {'datapointer' : 'adminConfigDetail|coupons|'+_app.vars.partition}
						}
					});
				_app.u.handleButtons($target);
				$target.anyform();
				_app.model.dispatchThis();

				},//showCouponManager
				
			showPartitionManager : function($target)	{
				_app.ext.admin.i.DMICreate($target,{
					'header' : 'Partition Manager', //left off because the interface is in a tab.
					'className' : 'partitionManager',
					'buttons' : [
						"<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh Partition List<\/button>",
						"<button data-app-click='admin_config|partitionCreateShow' class='applyButton' data-text='true' data-icon-primary='ui-icon-circle-plus'>Add Partition<\/button>"
						],
					'thead' : ['ID','Name','Profile','Customers','Navcats','Language','Currency'],
					'tbodyDatabind' : "var: users(@PRTS); format:processList; loadsTemplate:partitionManagerRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminConfigDetail',
						'prts' : true,
						'_tag' : {'datapointer' : 'adminConfigDetail|prts'}
						}
					});
				_app.u.handleButtons($target);
				_app.model.dispatchThis();
				},//showCouponManager

//will open the rules builder in a modal.
//vars.rulesmode is REQUIRED.  should be set to shipping or coupons.
//if shipping, vars.provided is also required.

			showRulesBuilderInModal : function(vars)	{
//				_app.u.dump("BEGIN admin_config.a.showRulesBuilderInModal");
//				_app.u.dump("vars: "); _app.u.dump(vars);
				vars = vars || {};

				if(vars.table && ((vars.rulesmode == 'shipping' && vars.provider) || (vars.rulesmode == 'coupons' && vars.couponCode)))	{

					var $D = _app.ext.admin.i.dialogCreate({
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
					$D.dialog('open').anyform();
					
					//these will be tailored based on which set of rules is showing up, then passed into the DMICreate function.
					var DMIVars = {
						'header' : 'Rules Editor',
						'handleAppEvents' : false,
						'anytable' : false, //do NOT apply sorting to these tables. The rows order is important to rule processing.
						'buttons' : [
							"<button data-app-click='admin_config|ruleBuilderAddShow' data-rulesmode='"+vars.rulesmode+"' class='applyButton'>Add Rule<\/button>",
							"<button disabled='disabled' data-app-click='admin_config|ruleBuilderUpdateExec' class='applyButton' data-app-role='saveButton'>Save <span class='numChanges'><\/span> Changes<\/button>"]
						}; 
//					_app.u.dump(" -> vars.TABLE: "+vars.table);
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
					var $DMI = _app.ext.admin.i.DMICreate($D,DMIVars);
					//rules are nearly entirely updated to delegated events. this is here for the DMI toggle button. DMI is not entirely updated yet.
//					_app.u.handleAppEvents($D); //for toggle and save button.  ### FUTURE -> get rid of this once toggle
					$DMI.closest("[data-app-role='dualModeContainer']").data({'dataTable':vars});
					
					$("[data-app-role='dualModeListTbody']",$D).sortable().on("sortupdate",function(evt,ui){
						ui.item.addClass('edited');
						_app.ext.admin.u.handleSaveButtonByEditedClass($D);
						});
				
//add data-table attributes.
					$D.attr('data-table-role','container');
					$("tbody[data-app-role='dualModeListTbody']:first",$D).attr('data-table-role','content');
					
					
					if(vars.rulesmode == 'shipping')	{
					//need pricing schedules. This is for shipping.
						var numDispatches = _app.ext.admin.calls.adminPriceScheduleList.init({},'mutable');
					//if making a request for the wholesale list, re-request shipmethods too. callback is on shipmethods
						if(numDispatches)	{
							_app.model.destroy('adminConfigDetail|shipmethods|'+_app.vars.partition);
							}
						_app.ext.admin.calls.adminConfigDetail.init({'shipmethods':true},{datapointer : 'adminConfigDetail|shipmethods|'+_app.vars.partition,callback : function(rd){
							$DMI.hideLoading();
							if(_app.model.responseHasErrors(rd)){
								$D.anymessage({'message':rd});
								}
							else	{
								$D.anycontent({'data':_app.ext.admin_config.u.getShipMethodByProvider(vars.provider)});
								_app.u.handleButtons($D);
								}
							}},'mutable');
						_app.model.dispatchThis('mutable');
						}
					else if(vars.rulesmode == 'coupons')	{
						var data = _app.ext.admin.u.getValueByKeyFromArray(_app.data['adminConfigDetail|coupons|'+_app.vars.partition]['@COUPONS'],'id',vars.couponCode);
						if(data)	{
							$D.anycontent({'data': data});
							_app.u.handleButtons($D);
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
					_app.u.dump("admin_config.a.showRulesBuilderInModal vars: "); _app.u.dump(vars);
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
				_app.u.handleButtons($D); _app.u.handleCommonPlugins($D);
				_app.u.addEventDelegation($D);
				$D.anyform();
				$D.dialog('open');	
				}, //showUPSOnlineToolsRegInModal
			
			showFedExMeterInModal : function(vars)	{
				vars = vars || {}; //may include supplier
				var $D = _app.ext.admin.i.dialogCreate({'title':'Renew FedEx Meter','templateID':'shippingFedExRegTemplate','data':(vars.vendorid) ? {} : _app.ext.admin_config.u.getShipMethodByProvider('FEDEX')});
				$D.data(vars);
				$D.anyform();
				_app.u.handleButtons($D);
				$D.addClass('labelsAsBreaks alignedLabels');
				$D.dialog('open');	
				} //showFedExMeterInModal

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		renderFormats : {
			blacklistedCountries : function($tag,data)	{
				if(data.bindData.loadsTemplate)	{
					for(var i in data.value)	{
						$tag.append(_app.renderFunctions.transmogrify({'country':data.value[i]},data.bindData.loadsTemplate,{'country':data.value[i]}));
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
				_app.u.dump("BEGIN admin_config.u.getPluginData");
				var r = false; //what is returned.
				if(plugin)	{
//					_app.u.dump(" -> plugin: "+plugin);
					if(_app.data['adminConfigDetail|plugins'] && _app.data['adminConfigDetail|plugins']['@PLUGINS'])	{
						var matches = new Array(); //matches for plugin
						for(var i = 0,L = _app.data['adminConfigDetail|plugins']['@PLUGINS'].length; i < L; i += 1)	{
							if(_app.data['adminConfigDetail|plugins']['@PLUGINS'][i].plugin == plugin)	{
								matches.push(_app.data['adminConfigDetail|plugins']['@PLUGINS'][i]);
								}
							}
						if(matches.length == 1)	{
							r = matches[0];
							}
						else if(matches.length > 1)	{
							r = {
								'plugin' : plugin,
								'@hosts' : matches
								};
							}
						else	{
							r = false;
							}
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In admin_config.u.getPluginData, _app.data['adminConfigDetail|plugins'] or _app.data['adminConfigDetail|plugins']['@PLUGINS'] are empty and are required.","gMessage":true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_config.u.getPluginData, plugin ["+plugin+"] not set.","gMessage":true});
					}
//				_app.u.dump(" -> r: "); _app.u.dump(r);
				return r;
				}, //getPluginData

			getPaymentByTender : function(tender)	{
				var r = false; //returns false if an error occurs. If no error, either an empty object OR the payment details are returned.
				if(tender)	{
					if(_app.data['adminConfigDetail|payment|'+_app.vars.partition] && _app.data['adminConfigDetail|payment|'+_app.vars.partition]['@PAYMENTS'])	{
						r = {};
						var payments = _app.data['adminConfigDetail|payment|'+_app.vars.partition]['@PAYMENTS'], //shortcut
						L = payments.length;
						
						for(var i = 0; i < L; i += 1)	{
							if(payments[i].tender == tender)	{
								r = payments[i];
								break; //have a match. exit early.
								}
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_config.u.getPaymentByTender, adminConfigDetail|payment|'+_app.vars.partition+' not in memory and is required.','gMessage':true});
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
					if(_app.data['adminConfigDetail|shipmethods|'+_app.vars.partition] && _app.data['adminConfigDetail|shipmethods|'+_app.vars.partition]['@SHIPMETHODS'])	{
						r = {};
						var
							shipmethods = _app.data['adminConfigDetail|shipmethods|'+_app.vars.partition]['@SHIPMETHODS'], //shortcut
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
				} //getShipMethodByProvider


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
//					_app.u.dump(" -> index: "+index);
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
									newSfo['@updates'].push("NOTIFICATION/DATATABLE-INSERT?"+$.param(_app.u.getWhitelistedObject($updateTR.data(),['event','verb','url','email','assignto'])));
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

				newSfo['_tag'].onComplete = function(){
					// refresh the data
					navigateTo('/ext/admin_config/showNotifications');
					};
					
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
//				_app.u.dump(" -> newSfo:"); _app.u.dump(newSfo);
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
//				_app.u.dump(" -> $tBody.length: "+$tBody.length);
//				_app.u.dump(" -> $tBody.children().length: "+$tBody.children().length);
				if($tBody.length && $tBody.children().length)	{
					$("tr.edited",$tBody).each(function(){
						var $tr = $(this);
						if($tr.hasClass('isNewRow') && $tr.hasClass('rowTaggedForRemove'))	{
							//is new and tagged for delete. do nothing.
							}
						else if($tr.hasClass('isNewRow'))	{
//							_app.u.dump(" -> $tr.data(): "); _app.u.dump($tr.data());
							if($tr.data('paymethod') == 'CREDIT')	{
								//cant just whitelist data cuz the params are UC and data-table applies them as attributes which get lowercased.
								newSfo['@updates'].push("METHOD-CREDITCARD-ADD?CC="+$tr.data('cc')+"&YY="+$tr.data('yy')+"&MM="+$tr.data('mm'));
								}
							else if($tr.data('paymethod') == 'ECHECK')	{
								newSfo['@updates'].push("METHOD-ECHECK-ADD?EB="+$tr.data('eb')+"&EA="+$tr.data('ea')+"&ER="+$tr.data('er')); //"+$.param(_app.u.getWhitelistedObject($tr.data(),['EB','EA','ER'])));
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
//				_app.u.dump(" -> billingPayments newSFO: "); _app.u.dump(newSfo);
				return newSfo;
				}
			
			},


////////////////////////////////////   EVENTS [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		e : {
			

			payMethodEditorShow : function($ele,p)	{
				if($ele.data('tender'))	{
					var
						$target = $ele.closest("[data-app-role='slimLeftContainer']"),
						$leftColumn = $ele.closest("[data-app-role='slimLeftNav']"),
						$contentColumn = $("[data-app-role='slimLeftContent']",$target);
					
					$('.ui-state-focus',$leftColumn).removeClass('ui-state-focus');
					$ele.addClass('ui-state-focus');
					$("[data-app-role='slimLeftContentSection'] .heading",$target).text("Edit: "+$ele.text());
					_app.ext.admin_config.a.showPaymentTypeEditorByTender($ele.data('tender'),$contentColumn);
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_config.e.payMethodEditorShow, data-tender not set on trigger element.","gMessage":true});
					}
				},
//used in supllier interface.
			shipMeterDetailInModal : function($ele,P)	{
				if($ele.data('provider') == 'UPS'){
					_app.ext.admin_config.a.showUPSOnlineToolsRegInModal({'vendorid':$(this).closest('.ui-widget-anypanel').data('vendorid')});
					}
				else if($ele.data('provider') == 'FEDEX'){
					_app.ext.admin_config.a.showFedExMeterInModal({'vendorid':$(this).closest('.ui-widget-anypanel').data('vendorid')});
					}
				else	{
					$ele.closest('.ui-widget-anypanel').anymessage({'message':'In admin_wholesale.e.shipMeterDetailInModal, no/invalid provider ['+$ele.data('provider')+'] on button','gMessage':true})
					}
				}, //shipMeterDetailInModal
		
			couponDetailDMIPanel : function($ele)	{
				var couponCode = $ele.closest('tr').data('coupon');
				if(couponCode)	{
					var $panel = _app.ext.admin.i.DMIPanelOpen($ele,{
						'templateID' : 'couponAddUpdateContentTemplate',
						'panelID' : 'coupon_'+couponCode,
						'header' : 'Edit Coupon: '+couponCode,
						'handleAppEvents' : false,
						'data' : _app.ext.admin.u.getValueByKeyFromArray(_app.data['adminConfigDetail|coupons|'+_app.vars.partition]['@COUPONS'],'id',couponCode)
						});
						
					$panel.attr('data-couponcode',couponCode);
					$('form',$panel)
						.append("<input type='hidden' name='_macrobuilder' value='admin_config|adminConfigMacro' \/><input type='hidden' name='_tag/macrocmd' value='COUPON/INSERT' \/><input type='hidden' name='_tag/extension' value='admin' \/><input type='hidden' name='_tag/callback' value='showMessaging' \/><input type='hidden' name='_tag/message' value='The coupon has been successfully updated.' \/><input type='hidden' name='_tag/updateDMIList' value='"+$panel.closest("[data-app-role='dualModeContainer']").attr('id')+"' \/>")
						.find(".applyDatepicker").datetimepicker({
							changeMonth: true,
							dateFormat : 'yymmdd',
							timeFormat: 'HHmmss',
							changeYear: true,
							separator : '' //get rid of space between date and time.
							})
						.end()
						.find("[name='coupon']").closest('label').hide(); //code is only editable at create.
					_app.u.handleCommonPlugins($panel);
					_app.u.handleButtons($panel);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_config.e.couponDetailDMIPanel, unable to ascertain coupon code.','gMessage':true});
					}
				}, //couponDetailDMIPanel

			couponCreateShow : function($ele,P)	{
				P.preventDefault();
				var $D = _app.ext.admin.i.dialogCreate({
					'title':'Add New Coupon',
					'handleAppEvents' : false,
					'templateID':'couponAddUpdateContentTemplate',
					'showLoading':false //will get passed into anycontent and disable showLoading.
					});
				$D.dialog('open');
//These fields are used for processForm on save.
				$('form',$D).first().append("<input type='hidden' name='_macrobuilder' value='admin_config|adminConfigMacro' \/><input type='hidden' name='_tag/macrocmd' value='COUPON/INSERT' \/><input type='hidden' name='_tag/callback' value='showMessaging' \/><input type='hidden' name='_tag/jqObjEmpty' value='true' \/><input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' \/><input type='hidden' name='_tag/message' value='Thank you, your coupon has been created.' \/>");

				$("[data-app-click='admin_config|ruleBuilderShow']",$D).hide(); //hide rule builder till after coupon is saved.
				$( ".applyDatepicker",$D).datetimepicker({
						changeMonth: true,
						dateFormat : 'yymmdd',
						timeFormat: 'HHmmss',
						changeYear: true,
						separator : '' //get rid of space between date and time.
						});
				_app.u.handleCommonPlugins($D);
				_app.u.handleButtons($D);
				$D.anyform();
				},	//couponCreateShow

			couponRemoveConfirm : function($ele)	{
				var 
					$tr = $ele.closest('tr'),
					data = $tr.data(),
					$D = $ele.closest('.ui-dialog-content');

				_app.ext.admin.i.dialogConfirmRemove({
					'removeFunction':function(vars,$D){
						$D.showLoading({"message":"Deleting Coupon"});
						_app.model.addDispatchToQ({'_cmd':'adminConfigMacro','@updates':["COUPON/REMOVE?coupon="+data.coupon],'_tag':{'callback':function(rd){
							$D.hideLoading();
							if(_app.model.responseHasErrors(rd)){
								$('#globalMessaging').anymessage({'message':rd});
								}
							else	{
								$D.dialog('close');
								$('#globalMessaging').anymessage(_app.u.successMsgObject('The coupon has been removed.'));
								$tr.empty().remove(); //removes row for list.
								}
							}
						}
					},'immutable');
					_app.model.addDispatchToQ({'_cmd':'adminConfigDetail','coupons':true,'_tag':{'datapointer' : 'adminConfigDetail|coupons|'+_app.vars.partition}},'immutable'); //update coupon list in memory.
					_app.model.dispatchThis('immutable');
					}});
				},

			shippingProviderCreateShow : function($ele,p)	{
				var $pageContainer = $ele.closest("[data-app-role='slimLeftContainer']");
				$("h3.heading:first",$pageContainer).text("Add New Flex Shipmethod: "+$ele.text());
				_app.ext.admin_config.a.showAddFlexShipment($ele.data('shipmethod'),$("[data-app-role='slimLeftContent']:first",$pageContainer));				
				}, //shippingProviderCreateShow

			shippingPartnerRegExec : function($ele,P)	{
				var $form = $ele.closest('form');
				if(_app.u.validateForm($form))	{
					
					var sfo = $form.serializeJSON({'cb':true});
				//supplier 'may' be set on the parent container. This is used in supply chain.
					if($ele.closest("[data-app-role='shippingPartnerRegContainer']").data('supplier'))	{
						sfo.supplier = $ele.closest("[data-app-role='shippingPartnerRegContainer']").data('supplier');
						}
					
					if(sfo.provider == 'FEDEX' || sfo.provider == 'UPS')	{
//vendorid gets passed as part of supply chain shipping configuration.
						if($ele.closest('.ui-dialog-content').data('vendorid'))	{
							sfo.VENDORID = $ele.closest('.ui-dialog-content').data('vendorid');
							}
						$form.showLoading({'message':'Registering account. This may take a few moments.'});
						var macroCmd = (sfo.provider == 'FEDEX') ? "FEDEX-REGISTER" : "UPSAPI-REGISTER";

						_app.ext.admin.calls.adminConfigMacro.init(["SHIPMETHOD/"+macroCmd+"?"+$.param(sfo)],{'callback':function(rd){
							$form.hideLoading();
							if(_app.model.responseHasErrors(rd)){
								$form.anymessage({'message':rd});
								}
							else	{
								if($ele.closest('.ui-dialog-content').length)	{
									$ele.closest('.ui-dialog-content').dialog('close');
									}
								else	{
									$form.parent().empty();
									}
//* 201324 -> made parent empty, not just form, so all the 'you are about...' text goes away too. editor now opens as well.
								_app.ext.admin_config.a.showShipMethodEditorByProvider(sfo.provider,$("[data-app-role='slimLeftContent']",$(_app.u.jqSelector('#',_app.ext.admin.vars.tab+"Content"))));
								$('#globalMessaging').anymessage(_app.u.successMsgObject('Activation successful!'));
								}
							}},'immutable');
						_app.model.addDispatchToQ({'_cmd':'adminConfigDetail','shipmethods':true,'_tag':{'datapointer' : 'adminConfigDetail|shipmethods|'+_app.vars.partition}},'immutable');
						_app.model.dispatchThis('immutable');

						}
					else	{
						$form.anymessage({"message":"In admin_config.e.shippingPartnerRegExec, unable to ascertain provider. Was expecting it in the serialized form.","gMessage":true});
						}
					}
				else	{} //validateForm handles error display.
				}, //shippingPartnerRegExec

			shippingGeneralUpdateExec : function($ele,P)	{
				var $form = $ele.closest('form');
				if(_app.u.validateForm($form))	{
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
//						_app.u.dump("macros: "); _app.u.dump(macros);
					_app.ext.admin.calls.adminConfigMacro.init(macros,{'callback':'showMessaging','jqObj':$form,'message':'Your changes have been saved.','restoreInputsFromTrackingState':true,'removeFromDOMItemsTaggedForDelete':true},'immutable');
					_app.model.destroy('adminConfigDetail|shipping|'+_app.vars.partition);
					_app.ext.admin.calls.adminConfigDetail.init({'shipping':true},{datapointer : 'adminConfigDetail|shipping|'+_app.vars.partition},'immutable');
					_app.model.dispatchThis('immutable');


					}
				else	{} //validateForm handles error display
				}, //shippingGeneralUpdateExec

			shipMethodUpdateShow : function($ele,p)	{
				if($ele.data('provider'))	{
					var
						$leftColumn = $ele.closest("[data-app-role='slimLeftNav']"),
						$contentColumn = $ele.closest("[data-app-role='slimLeftContainer']").find("[data-app-role='slimLeftContent']:first");
					$("h3.heading:first",$ele.closest("[data-app-role='slimLeftContainer']")).text("Edit: "+$ele.text());
					$('.ui-state-focus',$leftColumn).removeClass('ui-state-focus');
					$ele.addClass('ui-state-focus');
					_app.ext.admin_config.a.showShipMethodEditorByProvider($ele.data('provider'),$contentColumn);
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_config.e.shipMethodUpdateShow, trigger element did not specify data-provider, which is required.","gMessage":true});
					}
				return false;
				},

//deletes a given shipmethod/provider. then reloads shippingManager.
			shipMethodRemoveConfirm : function($ele,p)	{
				p.preventDefault();
				var
					$form = $ele.closest('form'),
					provider = $("[name='provider']",$form).val();

				if(provider)	{
					var $D = _app.ext.admin.i.dialogConfirmRemove({
						"message" : "Are you sure you want to delete Shipping Method "+provider+"? There is no undo for this action.",
						"removeButtonText" : "Remove", //will default if blank
						"title" : "Remove Shipping Method", //will default if blank
						"removeFunction" : function(vars,$D){
							$D.parent().showLoading({"message":"Deleting Ship Method "+provider});
							_app.model.destroy('adminConfigDetail|shipmethods|'+_app.vars.partition);
							_app.ext.admin.calls.adminConfigMacro.init(["SHIPMETHOD/REMOVE?provider="+provider],{'callback':function(rd){
								$D.parent().hideLoading();
								if(_app.model.responseHasErrors(rd)){
									$D.anymessage({'message':rd});
									}
								else	{
									$D.dialog('close');
									_app.ext.admin_config.a.showShippingManager($(_app.u.jqSelector('#',_app.ext.admin.vars.tab+"Content")).empty());
									}
								}},'immutable');
							_app.model.dispatchThis('immutable');
							}
						})
//					$D.dialog('open');
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_config.e.shipMethodRemoveExec, unable to ascertain provider for ship method to be deleted.','gMessage':true});
					}

				}, //shipMethodRemoveExec

//saves the changes for a shipmethod/provider.
//also used for a new flex shipping method. In that case, add a data-mode='insert' to the button to trigger the additional macro.
			shipmethodAddUpdateExec : function($ele,p)	{
				p.preventDefault();
				var
					$form = $ele.closest('form'),
					sfo = $form.serializeJSON({'cb':true}), //cb true returns checkboxes w/ 1 or 0 based on whether it's checked/unchecked, respecticely. strings, not ints.
					$dataTableTbody = $("tbody[data-table-role='content']",$form), //a table used for data such as price breakdowns on a flex priced based ship method (or zip,weight,etc data)
					macros = new Array(),
					callback = 'handleMacroUpdate'; //will be changed if in insert mode. this is in the marketplace extension.
					
				if(_app.u.validateForm($form))	{
					
					if($ele.data('mode') == 'insert')	{
						callback = function(rd){
							navigateTo("/ext/admin_config/showShippingManager",{'provider':sfo.provider});
							}; //when a new method is added, the callback gets changed slightly to refect the update to the list of flex methods.
						macros.push("SHIPMETHOD/INSERT?provider="+sfo.provider+"&handler="+$ele.data('handler'));
						}
					
					//shipping updates are destructive, so the entire form needs to go up.
					macros.push("SHIPMETHOD/UPDATE?"+$.param(sfo));
				
				
				//The following block is for handling data/fee tables.
				
				//currently, handling and insurance have multiple tables, so they get handled slight differently, a table is passed in addition to provider.
					if(sfo.provider == 'HANDLING' || sfo.provider == 'INSURANCE')	{
						$dataTableTbody.each(function(){
							var tableID = $(this).closest('table').attr('data-table');
							macros.push("SHIPMETHOD/DATATABLE-EMPTY?provider="+sfo.provider+"&table="+tableID);
							$('tbody',$(this)).find('tr').each(function(){
								if($(this).hasClass('rowTaggedForRemove'))	{} //row is being deleted. do not add. first macro clears all, so no specific remove necessary.
								else	{
									macros.push("SHIPMETHOD/DATATABLE-INSERT?provider="+sfo.provider+"&table="+tableID+"&"+$.param(_app.u.getWhitelistedObject($(this).data(),['weight','fee','subtotal','guid'])));
									}
								});
							});
						}
				//currently, only insurance and handling have more than one data table. If that changes, the code below will need updating.
				//this is used for ALL ship methods tho, so the whitelist must include all the input names for all the ship method data tables.
					else if($dataTableTbody.length && sfo.provider)	{
						macros.push("SHIPMETHOD/DATATABLE-EMPTY?provider="+sfo.provider);
						$('tr',$dataTableTbody).each(function(){
							if($(this).hasClass('rowTaggedForRemove'))	{ $(this).intervaledEmpty()} //row is being deleted. do not add. first macro clears all, so no specific remove necessary.
							else	{
//								dump(" -> tr.data():"); dump($(this).data());
								macros.push("SHIPMETHOD/DATATABLE-INSERT?provider="+sfo.provider+"&"+$._app.u.hash2kvp(_app.u.getWhitelistedObject($(this).data(),['country','type','match','guid','subtotal','fee','weight','zip1','zip2','postal','text'])));
								}
							});
						}
					else if($dataTableTbody.length)	{
						$form.anymessage({"message":"Something has gone wrong with the save. The rows added to the table could not be updated. Please try your save again and if the error persists, please contact the site administrator. If you made other changes and no error was reported besides this one, they most likely saved. In admin_config.e.shipmethodAddUpdateExec, unable to ascertain provider for datatable update.","gMessage":false});
						}
					else	{} //perfectlynormal to not have a data table.
				
					_app.ext.admin.calls.adminConfigMacro.init(macros,{'callback':callback,'extension':'admin_marketplace','jqObj':$form},'immutable');
//nuke and re-obtain shipmethods so re-editing THIS method shows most up to date info.
//the new callback for navigateTo on the configMacro call will destroy/re-obtain the shipmethods for handling and insurance.
					if(sfo.provider == 'HANDLING' || sfo.provider == 'INSURANCE')	{}
					else	{
						_app.model.destroy('adminConfigDetail|shipmethods|'+_app.vars.partition);
						_app.ext.admin.calls.adminConfigDetail.init({'shipmethods':true},{datapointer : 'adminConfigDetail|shipmethods|'+_app.vars.partition},'immutable');
						
						}
				
				//	_app.u.dump(" -> macros"); _app.u.dump(macros);
					_app.model.dispatchThis('immutable');
					}
				else	{
					//validateForm handles error display
					}
				}, //shipmethodAddUpdateExec




			partitionCreateShow : function($btn)	{

				$btn.button();
				$btn.off('click.couponCreateShow').on('click.couponCreateShow',function(event){

					event.preventDefault();
					var $D = _app.ext.admin.i.dialogCreate({
						'title':'Add New Partition',
						'templateID':'partitionCreateTemplate',
						'showLoading':false //will get passed into anycontent and disable showLoading.
						});
					$D.dialog('open');
					});
				},	//couponCreateShow

			paymentMethodUpdateExec : function($ele)	{
				_app.u.dump(" -> BEGIN admin_config.e.paymentMethodUpdateExec (click!).");
				var
					$form = $ele.closest('form'),
					sfo = $form.serializeJSON({'cb':true}) || {},
					macroCmd;
				
				if(sfo.tender && sfo.tenderGroup)	{
					$form.showLoading({'message':'Updating payment information'});
//						_app.u.dump(" -> tender: "+sfo.tender);
//						_app.u.dump(" -> tenderGroup: "+sfo.tenderGroup);
					
					if(_app.u.validateForm($form))	{
						if(sfo.tenderGroup == 'WALLET')	{
							macroCmd = "PAYMENT/WALLET-"+sfo.tender;
							}
						else	{
							macroCmd = "PAYMENT/"+sfo.tenderGroup;
							}
//							_app.u.dump(" -> macroCmd: "+macroCmd);
						_app.ext.admin.calls.adminConfigMacro.init([macroCmd+"?"+$.param(sfo)],{'callback':'showMessaging','message':'Payment has been updated.','jqObj':$form,'restoreInputsFromTrackingState':true},'immutable');
				
						_app.model.destroy('adminConfigDetail|payment|'+_app.vars.partition);
						_app.ext.admin.calls.adminConfigDetail.init({'payment':true},{datapointer : 'adminConfigDetail|payment|'+_app.vars.partition},'immutable');
						_app.model.dispatchThis('immutable');
						}
					else	{_app.u.dump("Did not pass validation in admin_config.e.paymentMethodUpdateExec");} //validateForm will display the error logic.
					}
				else	{
					$form.anymessage({"message":"In admin_config.e.paymentMethodUpdateExec, either tender ["+sfo.tender+"] or tenderGroup ["+sfo.tenderGroup+"] not set. Expecting these within the form/sfo.","gMessage":true});
					}
				}, //paymentMethodUpdateExec

//This is the event to use for delegated events (as oppsed to app events).
//requires the data-table-role syntax. 
			dataTableAddUpdate : function($ele,P)	{
				var r = false; //what is returned. will be true if data-table passes muster.
//				_app.u.dump("BEGIN admin_config.e.dataTableAddUpdate (Click!)");
				var
					$DTC = $ele.closest("[data-table-role='container']");// Data Table Container. This element should encompass the inputs AND the table itself.
// SANITY -> 201352 changed this from $("[data-table-role='inputs']",$DTC) to closest. that requires that $ele is INSIDE the inputs. If this causes issues (required from shipping/coupons rules), then add a data attribute on $ele to allow for $ele to be outside and use $("[data-table-role='inputs']",$DTC).
					$inputContainer = $ele.closest("[data-table-role='inputs']"), //likely a fieldset, but that's not a requirement. //$("[data-table-role='inputs']",$DTC)
					$dataTbody = $("tbody[data-table-role='content']",$DTC);
//				dump(" -> $inputContainer instanceof jQuery: "+($inputContainer instanceof jQuery));
				if($inputContainer.length && $dataTbody.length)	{
//					_app.u.dump(" -> all necessary jquery objects found.");
					if($dataTbody.data('bind'))	{
//						_app.u.dump(" -> $dataTbody has data-bind.");
	
						if(_app.u.validateForm($inputContainer))	{
							_app.u.dump(" -> form is validated.");
							var 
								bindData = _app.renderFunctions.parseDataBind($dataTbody.attr('data-bind')),
								sfo = $inputContainer.serializeJSON({'cb':true}),
								$tr = _app.renderFunctions.createTemplateInstance(bindData.loadsTemplate,sfo);
							
							$tr.anycontent({data:sfo});
							$tr.addClass('edited');
							$tr.addClass('isNewRow'); //used in the 'save'. if a new row immediately gets deleted, it isn't added.
							_app.u.handleButtons($tr);
//here for backwards compatibility. enabled when dataTableAddUpdate is executed by the older dataTableAddExec
							if(P.handleAppEvents)	{
								_app.u.handleAppEvents($tr);
								}
					
	//if a row already exists with this guid, this is an UPDATE, not an ADD.
	//						_app.u.dump(" -> sfo.guid: "+sfo.guid); _app.u.dump(" -> tr w/ guid length: "+$("tr[data-guid='"+sfo.guid+"']",$dataTbody).length)
							if(sfo.guid && $("tr[data-guid='"+sfo.guid+"']",$dataTbody).length)	{
								$("tr[data-guid='"+sfo.guid+"']",$dataTbody).replaceWith($tr);
								}
							else	{
								$tr.appendTo($dataTbody);
								}
	// by default, the data table inputs are reset on save. This can be disabled as needed by setting data-form-skipreset on the apply button.
							if($ele.data('form-skipreset'))	{
								}
							else	{
								$(':input',$inputContainer).not(':radio').not(":checkbox").val(""); //clear inputs. don't reset radios in this manner or they'll lose their value.
								$(':radio',$inputContainer).prop('checked',false);
								$(':checkbox',$inputContainer).prop('checked',false);
								}
							
							if($ele.attr('data-hide-inputs-onapply'))	{
								$inputContainer.slideUp('fast');
								}
							
							_app.ext.admin.u.handleSaveButtonByEditedClass($ele.closest('form'));

							r = true;
							}
						else	{
							_app.u.dump("form did not validate");
							//validateForm handles error display.
							}
						}
					else	{
						$inputContainer.anymessage({"message":"In admin_config.e.dataTableAddUpdate, data-table-role='contents' has no data-bind set.","gMessage":true});
						}
				//	$('input',$container).attr('required','').removeAttr('required');
					
					}
				else	{
					$ele.closest('form').anymessage({"message":"In admin_config.e.dataTableAddUpdate, either table-role='container' ["+$DTC.length+"] or table-role='content' ["+$dataTbody.length+"] and/or  table-role='inputs' ["+$inputContainer.length+"] not found and all three are required.","gMessage":true});
					_app.u.dump(" -> $DTC.length: "+$DTC.length);
					_app.u.dump(" -> $inputContainer.length: "+$inputContainer.length);
					_app.u.dump(" -> $dataTbody.length: "+$dataTbody.length);
					}	
				return r;
				},

//This is where the magic happens. This button is used in conjunction with a data table, such as a shipping price or weight schedule.
//It takes the contents of the fieldset it is in and adds them as a row in a corresponding table. it will allow a specific table to be set OR, it will look for a table within the fieldset (using the data-app-role='dataTable' selector).
//the 'or' was necessary because in some cases, such as handling, there are several tables on one page and there wasn't a good way to pass different params into the appEvent handler (which gets executed once for the entire page).
// $form = the parent form of the data table. It's used for updating the corresponding 'save' button w/ the number of changes. that form is NOT validated or included in the serialized Form Object.
// $dataTbody = the tbody of the dataTable to be updated (where rows get added when the entry form is saved).
// $container = the fieldset (or some other element) that contains the form inputs used to generate a new row. NOT always it's own form.
			dataTableAddExec : function($btn,vars)	{
				$btn.button();
				var
					$container = vars['$container'] ? vars['$container'] : $btn.closest('fieldset'),
				//tbody can be passed in thru vars or, if not passed, it will look for one within the fieldset. rules engine uses vars approach. shipping doesn't. same for form.
					$dataTbody = (vars['$dataTbody']) ? vars['$dataTbody'] : $("[data-app-role='dataTable'] tbody",$container),
					$form = (vars['$form']) ? vars['$form'] : $container.closest('form');
				
//Bring the data-table up to delegated events standards. This is a program by contract model, where thre data-table-role's are specified.
//this occurs outside the click so that it only happens once, at the time the app event is applied.
				$container.attr("data-table-role","inputs");
				$dataTbody.attr("data-table-role","content");
				$form.attr("data-table-role","container");

				$btn.off('click.dataTableAddExec').on('click.dataTableAddExec',function(event){
					event.preventDefault();
					event.handleAppEvents = true;
					_app.ext.admin_config.e.dataTableAddUpdate($btn,event);
					return false;
					});
				}, //dataTableAddExec

//a generic app event for updating a dataTable. This button would go on the fieldset and would search withing that fieldset for a dataTable, then use data-guid to find a match in that table.
//this isn't necessary.  dataTableAddExec already does this.  Left here so next time I come to write this, I'm reminded I've already done it. 
//			dataTableUpdateExec : function($btn,vars)	{},





			taxTableUpdateExec : function($ele,p)	{
				p.preventDefault();
//updating the tax table is a destructive update, meaning the entire table is emptied and then rebuilt.
				var $container = $ele.closest("[data-app-role='taxConfigContainer']"), macros = new Array();
				macros.push("TAXRULES/EMPTY");

//build an array of the form input names for a whitelist.
//need a whitelist because the tr.data() may have a lot of extra kvp in it
//201404 -> enable is intentionally NOT in the whitelist. It's added to the update through a checkbox.
				var whitelist = new Array('type','state','citys','city','zipstart','zipend','zip4','country','ipcountry','ipstate','izcountry','izzip','rate','shipping','handling','insurance','special','zone','expires','group','guid');

				$ele.closest('form').find('tbody tr').each(function(index){ //tbody needs to be in the selector so that tr in thead isn't included.
					var $tr = $(this);
					if($tr.hasClass('rowTaggedForRemove'))	{} //row tagged for delete. do not insert.
					else	{
						if(!$tr.data('guid'))	{$tr.data('guid',index)} //a newly added rule
						macros.push("TAXRULES/INSERT?enable="+($("input[name='enable']",$tr).is(':checked') ? 1 : 0)+"&"+$.param(_app.u.getWhitelistedObject($tr.data(),whitelist)));
						}
					});
				_app.ext.admin.calls.adminConfigMacro.init(macros,{'callback':'showMessaging','message':'Your rules have been saved.','removeFromDOMItemsTaggedForDelete':true,'restoreInputsFromTrackingState':true,'jqObj':$container},'immutable');
				_app.model.dispatchThis('immutable');

				},




//executed on a manage rules button.  shows the rule builder.
			ruleBuilderShow : function($ele,P)	{
				var rulesMode = $ele.data('rulesmode');
				if($ele.data('table') && (rulesMode == 'shipping' || rulesMode == 'coupons'))	{
					if(rulesMode == 'shipping')	{
						var provider = $ele.closest('form').find("[name='provider']").val();
						if(provider)	{
							_app.ext.admin_config.a.showRulesBuilderInModal({'rulesmode':rulesMode,'provider':provider,'table':$ele.data('table')});
							}
						else	{
							$('#globalMessaging').anymessage({'message':'In admin_config.e.ruleBuilderShow, unable to ascertain provider ['+provider+'] and/or table ['+$ele.data('table')+'].','gMessage':true});
							}
						}
					else if(rulesMode == 'coupons')	{
						_app.ext.admin_config.a.showRulesBuilderInModal({'rulesmode':rulesMode,'table':$ele.data('table'),'couponCode':$ele.closest("[data-couponcode]").data('couponcode')});
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_config.e.ruleBuilderShow, rulesmode value is not valid ['+vars.rulesmode+']. must be shipping or coupons','gMessage':true});
						} //should never get here.
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_config.e.ruleBuilderShow, rulesMode is empty or invalid ['+rulesMode+'] OR no data-table ['+$ele.data('table')+'] set. data-rulesmode should be set as data-rulesmode on the button with the app-event and the value must be coupons or shipping. data-table should likewise be set on the button.','gMessage':true});
					}
				return false;
				}, //ruleBuilderShow


			ruleBuilderAddShow : function($ele,p)	{
				var rulesmode = $ele.data('rulesmode'), $DMI = $ele.closest("[data-app-role='dualModeContainer']"), guid = _app.u.guidGenerator();
				$panel = _app.ext.admin.i.DMIPanelOpen($ele,{
					'templateID' : 'rulesInputsTemplate_'+rulesmode,
					'panelID' : 'newrule_'+guid,
					'header' : 'New rule',
					'data' : ((rulesmode == 'shipping') ? $.extend(true,{'guid':guid},_app.data['adminPriceScheduleList']) : {'guid':guid}),
					'showLoading':false
					});
				_app.u.handleButtons($panel);
				_app.u.handleCommonPlugins($panel);
				},




//executed by the 'save' button once new rules or rule order has changed.
			ruleBuilderUpdateExec : function($ele,P)	{
				P.preventDefault();
				
				var vars = $ele.closest("[data-app-role='dualModeContainer']").data('dataTable');
				//_app.u.dump(" -> vars: "); _app.u.dump(vars);
				
				var
					$dualModeContainer = $ele.closest("[data-app-role='dualModeContainer']"),
					$tbody = $("[data-app-role='dualModeListTbody']",$dualModeContainer).first() || "", //default to blank so .length doesn't error.
					macros = new Array();
				
				
				//need a table and rulesmode. for shipping, provider is also needed.
				if(vars.table && ((vars.rulesmode == 'coupons' && vars.couponCode) || (vars.rulesmode == 'shipping' && vars.provider)))	{
					if($tbody.length)	{
						$ele.closest('.ui-dialog-content').showLoading({'message':'Updating Rules'});
				
				//build the shipping macros.
						if(vars.rulesmode == 'shipping')	{
							macros.push("SHIPMETHOD/RULESTABLE-EMPTY?provider="+vars.provider+"&table="+vars.table);
							$('tr',$tbody).each(function(){
								if($(this).hasClass('rowTaggedForRemove'))	{} //row tagged for delete. do not insert.
								else	{
									macros.push("SHIPMETHOD/RULESTABLE-INSERT?provider="+vars.provider+"&table="+vars.table+"&"+_app.u.hash2kvp(_app.u.getWhitelistedObject($(this).data(),['guid','created','name','match','filter','exec','value','schedule'])));
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
									macros.push("COUPON/RULESTABLE-INSERT?coupon="+vars.couponCode+"&"+$.param(_app.u.getWhitelistedObject($(this).data(),['guid','created','hint','match','matchvalue','filter','exec','value'])));
									}
								});
				
				
							}
						else	{} //catch all. shouldn't get here.
				
//						_app.u.dump(' -> macros: '); _app.u.dump(macros);
				
						_app.ext.admin.calls.adminConfigMacro.init(macros,{'callback':function(rd){
							if(_app.model.responseHasErrors(rd)){
								$('.dualModeListMessaging',$dualModeContainer).anymessage({'message':rd});
								}
							else	{
								$ele.closest('.ui-dialog-content').dialog('close');
								$('#globalMessaging').anymessage(_app.u.successMsgObject('Your rules have been saved.'));
								}
							}},'immutable');
				
				//These subsequents requests need to take place AFTER the configMacro so that the changes set there are reflected in the detail updates below.
						if(vars.rulesmode == 'shipping')	{
							//need to get shipments updated so that the rules for the method are updated in memory. important if the user comes right back into the editor.
							_app.model.destroy('adminConfigDetail|shipmethods|'+_app.vars.partition);
							_app.ext.admin.calls.adminConfigDetail.init({'shipmethods':true},{datapointer : 'adminConfigDetail|shipmethods|'+_app.vars.partition},'immutable');
							}
						else if(vars.rulesmode == 'coupons')	{
							//need to get shipments updated so that the rules for the method are updated in memory. important if the user comes right back into the editor.
							_app.model.addDispatchToQ({'_cmd':'adminConfigDetail','coupons':true,'_tag':{'datapointer' : 'adminConfigDetail|coupons|'+_app.vars.partition}},'immutable');
							}
						else	{} //coupons and shipping are the only two valid modes, so far.
						
						_app.model.dispatchThis('immutable');
						}
					else	{
						$('.dualModeListMessaging',$dualModeContainer).anymessage({'message':'In admin_config.e.ruleBuilderUpdateExec, unable to locate tbody for building rules macro.','gMesage':true})
						}
					}
				else	{
					$('.dualModeListMessaging',$dualModeContainer).anymessage({'message':'In admin_config.e.ruleBuilderUpdateExec, unable to ascertain vars.rulesmode ['+vars.rulesmode+'] vars.table ['+vars.table+'] OR (vars.rulesmode is shipping and vars.provider not found ['+vars.provider+'] OR  vars.rulesmode is coupons and vars.couponCode not found ['+vars.couponCode+']).','gMesage':true})
					}
				},

//opens an editor for an individual rule. uses anypanel/dualmode
			showRuleEditorAsPanel : function($ele,p)	{
				var rulesmode = $ele.data('rulesmode'), $DMI = $ele.closest("[data-app-role='dualModeContainer']");
				if(rulesmode == 'shipping' || rulesmode == 'coupons')	{
					var header, ruleData = $ele.closest('tr').data();
//					if(rulesmode == 'shipping')	{
//						var provider = $ele.closest("[data-provider]").data('provider');
//						}
					
					$panel = _app.ext.admin.i.DMIPanelOpen($ele,{
						'templateID' : 'rulesInputsTemplate_'+rulesmode,
						'panelID' : 'ruleBuilder_'+ruleData.guid,
						'header' : ((rulesmode == 'shipping') ? 'Edit: '+ruleData.name : 'Edit: '+ruleData.hint),
						'data' : ((rulesmode == 'shipping') ? $.extend(true,{},_app.data['adminPriceScheduleList'],ruleData) : ruleData),
						'showLoading':false
						});
					if(ruleData.schedule)	{
						$("[name='SCHEDULE']",$panel).val();
						}
					_app.u.handleButtons($panel);
					$panel.anyform(); //form delegation is already present, but this will trigger the defaults.
					}
				else	{
					$DMI.anymessage({'message':'In admin_config.e.showRuleEditorAsPanel, rulesmode ['+$ele.data('rulesmode')+'] on trigger element is either missing or invalid. Only coupons and shipping are acceptable values.','gMessage':true});
					}
				},

			pluginUpdateExec : function($ele,p)	{
				var $form = $ele.closest('form');
				if(_app.u.validateForm($form))	{
					$form.showLoading({'message':'Saving Changes'});
					var sfo = $form.serializeJSON({'cb':true}), updates = new Array();
					if(sfo.scope == 'HOST')	{
						$("[data-app-role='pluginHostsList']",$form).find('tr').each(function(){
							var $tr = $(this);
							if($tr.hasClass('rowTaggedForRemove'))	{
								updates.push("PLUGIN/REMOVE-HOST?host="+$tr.data('host')+'&plugin='+$tr.data('plugin'));
								$tr.intervaledEmpty();
								}
							else if($('.edited',$tr).length)	{
								updates.push("PLUGIN/SET-HOST?"+_app.u.hash2kvp($tr.serializeJSON({'cb':true})));
								}
							else	{}
							});
						}
					else	{
						updates.push("PLUGIN/SET-"+(sfo.scope || 'PRT')+"?"+_app.u.hash2kvp(sfo));
						}

					_app.model.addDispatchToQ({
						'_cmd':'adminConfigMacro',
						'@updates' : updates,
						'_tag':	{
							'callback':($form.data('verb')) == 'create' ? 'navigateTo' : 'showMessaging',
							'extension':($form.data('verb')) == 'create' ? 'admin' : '',
							'path' : '/ext/admin_config/showPluginManager?plugin='+sfo.plugin, //used when new plugins are added.
							//the following are used w/ showMessaging.
							'restoreInputsFromTrackingState' : true,
							'message' : "Your changes have been saved.",
							'jqObj' : $form
							}
						},'immutable');
					_app.model.dispatchThis('immutable');
					}
				else	{} //validate form will handle the error display.
				},

			pluginHostChooserShow : function($ele,p)	{
				var plugin = $ele.closest('form').find("input[name='plugin']").val();
				if(plugin)	{
					//to switch from a domain specific chooser to ALL hosts, remove the filter.
					//Could also change DOMAINNAME to PRT for partition specific filtering.
					adminApp.ext.admin_sites.u.hostChooser({
						filter : {
							'by' : 'DOMAINNAME',
							'for' : _app.vars.domain
							},
						saveAction : function($chooser)	{
							
							
							if($( ".ui-selected", $chooser ).length)	{
								$chooser.showLoading({'message':'Saving hosts to '+plugin});
								var updates = new Array();
								$( ".ui-selected", $chooser ).each(function() {
									//if this changes from a domain specific chooser to all domains, change _app.vars.domain to $(this).closest("[data-domainname]").data('domainname')
									updates.push("PLUGIN/SET-HOST?plugin="+plugin+"&host="+encodeURIComponent($(this).data('hostname').toLowerCase())+'.'+encodeURIComponent(_app.vars.domain));
									});
								
								_app.model.addDispatchToQ({
									'_cmd':'adminConfigMacro',
									'@updates' : updates,
									'_tag':	{
										'callback':function(rd){
											$chooser.hideLoading();
											if(_app.model.responseHasErrors(rd)){
												$('#globalMessaging').anymessage({'message':rd});
												}
											else	{
												//sample action. success would go here.
												$chooser.closest('.ui-dialog-content').dialog('close');
												navigateTo('/ext/admin_config/showPluginManager?plugin='+plugin)
												}
											}
										}
									},'immutable');
								_app.model.dispatchThis('immutable');
								}
							else	{
								$chooser.anymessage({"message":"Please select at least one host."});
								}


							} //saveAction
						});
					}
				else	{
					$("#globalMessaging").anymessage({"message":"In admin_config.e.pluginHostChooserShow, unable to ascertain plugin (plugin hidden input probably missing).","gMessage":true});
					}
				
				
				},

			pluginAddShow : function($ele,p)	{
				var $target = $ele.closest("[data-app-role='slimLeftContainer']").find("[data-app-role='slimLeftContent']:first");
				_app.ext.admin_config.a.showPlugin($target,{'verb':'create'});
				},

			pluginUpdateShow : function($ele,p)	{
				_app.ext.admin_config.a.showPlugin($ele.closest("[data-app-role='slimLeftContainer']").find("[data-app-role='slimLeftContent']:first"),{'plugin' : $ele.data('plugin')});
				},

//delegated events


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
						var $D = _app.ext.admin.i.dialogCreate({
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
					_app.model.addDispatchToQ(cmdObj,'mutable');
					_app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_config.e.billingInvoiceViewDownload, unable to ascertain invoice #.","gMessage":true});
					}
				
				}, //billingInvoiceViewDownload
			
			buildGUID : function($ele,p)	{
				var $form = $ele.closest('form');
				if($ele.attr('data-input-name') && $("input[name='"+$ele.attr('data-input-name')+"']",$form).length)	{
					$("input[name='"+$ele.attr('data-input-name')+"']",$form).val(_app.u.guidGenerator()).trigger('keyup')
					}
				else	{
					$form.anymessage({"message":"In admin_config.e.buildGUID, either data-input-name ["+$ele.attr('data-input-name')+"] not set on trigger element or no input matching that name found within parent form."});
					}
				},

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
						$('tbody',$tabContent).empty();
						$tabContent.showLoading({'message':'Fetching details'});
						_app.model.addDispatchToQ({
							'_cmd':cmd,
							'_tag':{
								'callback': 'anycontent',
								'skipAppEvents' : true,
								'jqObj' : $tabContent,
								'datapointer':cmd
							}
						},'mutable');
						_app.model.dispatchThis('mutable');
						}
					else	{}
					}
				}, //billingHandleTabContents

			adminPasswordUpdateExec : function($ele,p)	{
				p.preventDefault();
				var  $form = $ele.closest('form'), sfo = $form.serializeJSON();
				
				if(_app.u.validateForm($form))	{
					dump(" -> passed standard validation");
					if(sfo.oldpassword == sfo.newpassword1)	{
						$form.anymessage({'errtype':'youerr','message':'The old password can not match the new password'});
						}
					else if(sfo.newpassword1 != sfo.newpassword2)	{
						$form.anymessage({'errtype':'youerr','message':'The values you entered for the new password do not match. Please make sure the value for password and password again are exactly the same.'});
						}
					else	{
						_app.model.addDispatchToQ({"_cmd":"adminPasswordUpdate","old":sfo.oldpassword,"new":sfo.newpassword1,"_tag":{"callback":"showMessaging","jqObj":$form,"message":"Your password has been changed."}},"immutable");
						_app.model.dispatchThis("immutable");
						}
					}
				else	{} //validate handles error display.
				return false;
				},
			
			notificationUpdateShow : function($ele,p)	{
				p.preventDefault();
				var $target = $ele.closest("[data-app-role='notificationsContainer']").find("[data-app-role='slimLeftContentContainer']");
												
				if($ele.data('event') && _app.u.thisNestedExists("data.adminConfigDetail|"+_app.vars.partition+"|notifications.@NOTIFICATIONS",_app))	{
					var dataset = _app.ext.admin.u.getValueByKeyFromArray(_app.data['adminConfigDetail|'+_app.vars.partition+'|notifications']['@NOTIFICATIONS'],'event',$ele.data('event'));
					$target.empty().anycontent({"templateID":"notificationUpdateTemplate","data":dataset});
					$target.find("[data-app-role='addNotificationContainer']").empty().anycontent({"templateID":"appendNotificationFieldset","data":{}});
					_app.u.handleButtons($target);
					$('form',$target).anyform();
					}
				else if(!$ele.data('event'))	{
					$target.anymessage({"message":"In admin_config.e.notificationsUpdateShow, data-event not set on trigger element.","gMessage":true});
					}
				else	{
					$target.anymessage({"message":"In admin_config.e.notificationsUpdateShow, adminConfigDetail|"+_app.vars.partition+"|notifications is not in memory.","gMessage":true});
					}

			
				$('form',$target).find("input[name='event']").val($ele.data('event'));				
				return false;
				},

			notificationAddNew : function($ele,p)	{
				// the Add new Notification container
				p.preventDefault();
				var $target = $ele.closest("[data-app-role='notificationsContainer']").find("[data-app-role='slimLeftContentContainer']");
				$target.empty().anycontent({"templateID":"notificationAddNewTemplate","data":{}});
				$target.find("[data-app-role='addNotificationContainer']").empty().anycontent({"templateID":"appendNotificationFieldset","data":{}});
				
				_app.u.handleButtons($target);
				_app.u.addEventDelegation($target);
				$('form',$target).anyform();
				//$("[data-app-role='verb_"+($ele.data('event').split('.')[0])+"']",$target).show();
				
				return false;
				}

			} //e [app Events]
		} //r object.
	return r;
	}