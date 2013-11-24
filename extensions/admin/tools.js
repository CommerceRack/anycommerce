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


var admin_tools = function() {
	var theseTemplates = new Array('productPowerToolTemplate');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/tools.html',theseTemplates);
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

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
		a : {
			showPPT : function($target)	{
				$target.empty().anycontent({'templateID':'productPowerToolTemplate','showLoading':false});
				$('.toolTip',$target).tooltip();
				var $picker = $("[data-app-role='pickerContainer']:first",$target);
				$picker.append(app.ext.admin.a.getPicker({'templateID':'pickerTemplate','mode':'product'}));
				$('.applyDatepicker',$picker).datepicker({
					changeMonth: true,
					changeYear: true,
					maxDate : 0,
					dateFormat : 'yymmdd'
					});
				app.u.handleAppEvents($target,{'$form':$('#productPowerToolForm'),'$dataTbody':$("[data-app-role='powertoolSelectedActionsContainer'] tbody",$target)});
//				$("input",$picker).each(function(){});
				},
			
			siteDebugger : function()	{
				var $SD = $('#storeDebugger');
				if($SD.length)	{
					$SD.dialog('open');
					}
				else	{
					$SD = $("<div \/>").attr('title','Site Debug Tools').anycontent({'templateID':'siteDebugTemplate','showLoading':false}).dialog();
					app.u.handleButtons($SD);
					app.u.handleCommonPlugins($SD);
					app.u.handleEventDelegation($SD);
					app.ext.admin.u.handleFormConditionalDelegation($('form',$SD));
					}
				},
			
			showManageFlexedit : function($target)	{
				$target.empty();
				$target.append($("<div \/>").anycontent({'templateID':'manageFlexeditTemplate',data:{}}));
				
				var $enabled = $("[data-app-role='flexeditEnabledListContainer']",$target);
				$enabled.showLoading({'message':'Fetching your list of enabled fields'})
				
				var $master = $("[data-app-role='flexeditMasterListContainer']",$target);
				$master.showLoading({'message':'Fetching list of popular fields'})

				$('tbody',$enabled).sortable();

				//the connection is one way for now.
				$('tbody',$master).sortable({
					connectWith: $('.connectMe',$target),
					stop : function(event,ui)	{
						//if the item ends up in the enabled list, change from left/right arrows to up/down. also tag row to denote it's new (for save later).
						if($(ui.item).closest('tbody').hasClass('connectMe'))	{
							$(ui.item).addClass('edited isNewRow').data({'isFromMaster':true}).attr({'data-guid':app.u.guidGenerator(),'data-id':$(ui.item).data('obj_index')})
							app.u.handleAppEvents($(ui.item)); //handled here instead of when right list is generated for efficiency.
							}
						}
					});

				app.model.addDispatchToQ({'_cmd':'adminConfigDetail','flexedit':'1','_tag':{'callback':'anycontent','datapointer':'adminConfigDetail|flexedit','jqObj':$enabled}},'mutable');
				app.ext.admin.calls.appResource.init('product_attribs_all.json',{},'immutable'); //have these handy for editor.
				app.model.addDispatchToQ({'_cmd':'appResource','filename':'product_attribs_popular.json','_tag':{'callback':function(rd){
					$master.hideLoading();
					$('tr',$enabled).each(function(){$(this).attr('data-guid',app.u.guidGenerator())}); //has to be an attribute (as opposed to data()) so that dataTable update see's the row exists already.
					if(app.model.responseHasErrors(rd)){
						$('#globalMessaging').anymessage({'message':rd});
						}
					else	{
						$master.anycontent({'datapointer':rd.datapointer});
						app.u.handleAppEvents($master);
						}
					},'datapointer':'appResource|product_attribs_popular.json'}},'mutable');
//				app.u.handleAppEvents($target);
				app.model.dispatchThis('mutable');
//manageFlexeditorTemplate

				},
			
			showProductExport : function($target)	{
				$target.empty().anycontent({'templateID':'productExportToolTemplate','showLoading':false});
				$(':checkbox',$target).anycb(); //run before picker added to dom so that picker isn't affected.

				var $picker = $("[data-app-role='pickerContainer']:first",$target);
				$picker.append(app.ext.admin.a.getPicker({'templateID':'pickerTemplate','mode':'product'}));
				
				
				$('.toolTip',$target).tooltip();
				app.u.handleAppEvents($target);
				},

			showAccountUtilities : function($target)	{
				$target.empty().anycontent({'templateID':'accountUtilitiesTemplate','showLoading':false,'datapointer':'info'});
//need to apply datepicker to date inputs.
				$('button',$target).button();
				app.u.handleAppEvents($target);
				$target.anydelegate();

				app.model.addDispatchToQ({
					'_cmd':'adminPlatformLogList',
					'_tag' : {
						'callback':'anycontent',
						'datapointer': 'adminPlatformLogList',
						'jqObj' : $("[data-app-role='accountUtilityLogContainer']:first",$target)
						}
					},'mutable');
				app.model.dispatchThis('mutable');
				},
			
			showPrivateFiles : function($target)	{

				$target.empty();
				app.ext.admin.i.DMICreate($target,{
					'header' : 'Private Files',
					'className' : 'privatefiles', //applies a class on the DMI, which allows for css overriding for specific use cases.
					'thead' : ['Created','Filename','Type','Expiration','Creator',''],
					'tbodyDatabind' : "var: users(@files); format:processList; loadsTemplate:privateFilesRowTemplate;",
					'controls' : "<button data-app-event='admin_tools|adminPrivateFileRemoveConfirm' class='floatRight'>Delete Selected</button><form class='floatLeft'><label>Filter<\/label> <select name='type' class='marginLeft marginRight'><option value=''>none<\/option><option value='REPORT'>Report<\/option><option value='SYNDICATION'>Syndication<\/option><option value='CSV'>CSV<\/option><\/select><button data-app-event='admin|refreshDMI' data-serializeform='1'><\/button><\/form>",
					'cmdVars' : {
						'_cmd' : 'adminPrivateFileList',
						'limit' : '50',
						'_tag' : {
							'datapointer':'adminPrivateFileList'
							}
						}
					});
				app.model.dispatchThis('mutable');
				},
			
			showBillingHistory : function($target)	{
				
				$target.empty();

				app.ext.admin.i.DMICreate($target,{
					'header' : 'Billing History',
					'className' : 'billingHistory', //applies a class on the DMI, which allows for css overriding for specific use cases.
					'buttons' : [
						"<button data-app-event='admin|refreshDMI'>Refresh List<\/button>",
						"<button>Add Payment<\/button>"
						],
					'thead' : ['Invoice #','Created','Payment','Amount',''], //the blank at the end is for the th tag for the buttons.
					'tbodyDatabind' : "var: users(@INVOICES); format:processList; loadsTemplate:billingHistoryInvoiceRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'billingInvoiceList',
						'_tag' : {
							'datapointer':'billingInvoiceList'
							}
						}
					});

$target.append("<br \/>");

				app.ext.admin.i.DMICreate($target,{
					'header' : 'Pending Transactions',
					'className' : 'billingTransactions', //applies a class on the DMI, which allows for css overriding for specific use cases.
					'buttons' : [
						"<button data-app-event='admin|refreshDMI'>Refresh List<\/button>"
						],
					'thead' : ['Date','Class','Type','Description','amount',''], //the blank at the end is for the th tag for the buttons.
					'tbodyDatabind' : "var: users(@TRANSACTIONS); format:processList; loadsTemplate:billingHistoryInvoiceRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'billingTransactions',
						'_tag' : {
							'datapointer':'billingTransactions'
							}
						}
					});



				app.model.dispatchThis('mutable');
				},

			
			showciEngineAgentManager : function($target)	{
				
				$target.empty();
				app.ext.admin.i.DMICreate($target,{
					'header' : 'Agent Manager',
					'className' : 'agentsManager', //applies a class on the DMI, which allows for css overriding for specific use cases.
					'buttons' : [
						"<button data-app-event='admin|refreshDMI'>Refresh Coupon List<\/button>",
						"<button data-app-event='admin_tools|agentCreateShow'>Add Agent<\/button>"
						],
					'thead' : ['ID','Revision#','Lines','Interface','Created',''], //the blank at the end is for the th tag for the buttons.
					'tbodyDatabind' : "var: users(@AGENTS); format:processList; loadsTemplate:CIE_DSA_rowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminCIEngineAgentList',
						'_tag' : {
							'datapointer':'adminCIEngineAgentList'
							}
						}
					});
				app.model.dispatchThis('mutable');
				}
			
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//renderFormats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		renderFormats : {

			objExplore : function($tag,data)	{
				$tag.append(app.ext.admin_tools.u.objExplore(objExplore));
				}


			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {

			objExplore : function(obj)	{
// 				app.u.dump("BEGIN analyzer.u.objExplore");
				var keys = new Array();
				for (var n in obj) {
					keys.push(n);
					}
				keys.sort();
				var L = keys.length;
				var $ul = $("<ul \/>").addClass('objectInspector');

				for(var i = 0; i < L; i += 1)	{
					var $li = $('<li>');
					var $value;
					$('<span>').addClass('prompt').text(keys[i]).appendTo($li);
					
					if(typeof obj[keys[i]] == 'object')	{
						$value = app.ext.admin_tools.u.objExplore(obj[keys[i]]);
						}
					else	{
						$value = $('<span>').addClass('value').text(obj[keys[i]]);
						}
					$value.appendTo($li);
					$li.appendTo($ul);
					}

				return $ul;
				},
			
			pickerSelection2KVP : function($context)	{
//				app.u.dump("BEGIN admin_tools.u.pickerSelection2KVP");
				var r = ""; //what is returned. line separated w/ each line as  'navcat=.safe.name' or 'vendor=XYZ'
				var sfo = $context.serializeJSON({'cb':true});
				app.u.dump(" -> sfo: "); app.u.dump(sfo);
				if(Number(sfo.SELECTALL) === 1)	{
					r = 'all'
					}
				else	{
					function handleIt(type)	{
//						app.u.dump(" -> handle it for "+type);
						if(Number(sfo[index]) === 1)	{
							r += index.replace('+','=')+"\n"; // input name is navcat+.something, so simply changing + to = makes it macroesque-ready.
							}
						}
				
					for(index in sfo)	{
						if(index.indexOf('NAVCAT') === 0)	{handleIt('NAVCAT');}
						else if(index.indexOf('SUPPLIER') === 0)	{handleIt('SUPPLIER');}
						else if(index.indexOf('MANAGECAT') === 0)	{handleIt('MANAGECAT');}
						else if(index.indexOf('PROFILE') === 0)	{handleIt('PROFILE');}
						else if(index.indexOf('SUBLIST') === 0)	{handleIt('SUBLIST');}
						else	{} //do nada. isn't a checkbox list.
						}
					
					if(sfo.rstart && sfo.rend)	{
						r += "range="+sfo.rstart+"|"+sfo.rend+"\n";
						}

					if(sfo.createstart && sfo.createend)	{
						r += "created="+sfo.createstart+"|"+sfo.createend+"\n";
						}

					if(sfo.csv)	{
						r += "csv="+sfo.csv.replace(/[\s\t\r\n]+/g,",")+"\n"; //strip out all whitespace of any kind and replace with a comma. adjacent whitespace will only get 1 comma
//						app.u.dump(" -> r: "); app.u.dump(r);
						}
					}
//				app.u.dump(" -> r: "+r);
				return r;
				},

//will return an array of macro-esque values
//context could be the fieldset or the parent form.
			pickerSelection2Array : function($context)	{
				app.u.dump("BEGIN admin_tools.u.pickerSelection2Array");
				var r = new Array(); //what is returned. array w/ each entry formatted as: 'navcat=.safe.name' or 'vendor=XYZ'
				var sfo = $context.serializeJSON({'cb':true});
				
//				app.u.dump(" -> sfo: "); app.u.dump(sfo);
				function handleIt(type)	{
					if(Number(sfo[index]) === 1)	{
						r.push(index.replace('+','=')); // input name is navcat+.something, so simply changing + to = makes it macroesque-ready.
						}
					}

				if($("[name='SELECTALL']",$context).is(':checked'))	{
					r.push('all')
					}
				else	{
				
					for(index in sfo)	{
						if(index.indexOf('navcat') === 0)	{handleIt('navcat');}
						else if(index.indexOf('supplier') === 0)	{handleIt('supplier');}
						else if(index.indexOf('managecat') === 0)	{app.u.dump(" -> managecat");handleIt('managecat');}
						else if(index.indexOf('launchprofile') === 0)	{handleIt('mancat');}
						else	{} //do nada. isn't a checkbox list.
						}
					
					if($("[name='rstart']",$context).val() && $("[name='rend']",$context).val())	{
						r.push("range?"+encodeURIComponent($("[name='rstart']",$context).val()+"|"+$("[name='rend']",$context).val()))
						}
					
					if($("[name='csv']",$context).val())	{
						r.push("csv?"+encodeURIComponent($("[name='csv']",$context).val()));
						}
					
					}
				
				return r;
				},

			powertoolActions2Array : function($tbody)	{
				var r = new Array();
				$('tr',$tbody).each(function(){
					var
						data = $(this).data(),
						verb = data.verb;
					delete data.verb;
					r.push(verb+"?"+app.ext.admin.u.getSanitizedKVPFromObject(data));
					});
				return r;
				},

			powertoolActions2KVP : function($tbody)	{
				var r = "";
				$('tr',$tbody).not('.rowTaggedForRemove').each(function(){
					var
						data = $.extend({},$(this).data()),
						verb = data.verb;

					if(data.attrib == '_')	{
						data.attrib = data.attrib_custom;
						delete attrib_custom;
						}
					
					if(data.when == 'when-attrib-contains')	{
						//data() stores keys without dashes. so some-key is converted to someKey. 
						data['when-attrib'] = data.whenAttrib;
						data['when-attrib-operator'] = data.whenAttribOperator;
						data['when-attrib-contains'] = data.whenAttribContains;
						}
					
					r += verb+"?"+$.param(app.u.getWhitelistedObject(data,['attrib','when','when-attrib','when-attrib-operator','when-attrib-contains'])); //verb not passed because it is macro
					switch(verb)
						{
						case 'replace':
							r += '&replace-value='+encodeURIComponent(data.searchval);
							r += '&replace-with='+encodeURIComponent(data.replaceval);
						break;
					
						case 'add':
						case 'set':
						case 'copy':
						case 'copyfrom':
							r += '&'+verb+'-value='+encodeURIComponent(data[verb+'val']);
							break;
						default:
					//the rest of the verbs don't have a value.
						}
					r += "\n";
					
					});
				return r;
				}

			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			
			rawJSONRequestExec : function($btn)	{
				$btn.button();
				$btn.off('click.rawJSONRequestExec').on('click.rawJSONRequestExec',function(event){
					event.preventDefault();
					var JSONString = $btn.closest('form').find("[name='JSON']").val();
					app.u.dump(" -> myJSON: "+JSONString);
					var validJSON = false;
					try	{
//						app.u.dump(" -> attempting to validate json");
						app.u.dump(" -> JSON.parse(JSONString): "+JSON.parse(JSONString));
					//Run some code here
						validJSON = JSON.parse(JSONString);
						}
					catch(err) {
					//Handle errors here
						}
//					app.u.dump(" -> jsonParse(myJSON): "); app.u.dump(validJSON);
					if(typeof validJSON === 'object')	{
						if(app.model.addDispatchToQ(validJSON,'mutable'))	{
							app.model.dispatchThis('mutable');
							}
						else	{
							$btn.closest('form').anymessage({"message":"The query could not be dispatched. Be sure you have a _cmd set in your query."})
							}
						
						}
					else	{
						$btn.closest('form').anymessage({"message":"The query is not a valid json object. Use a service like jsonLint to validate your JSON if necessary.<br>hint: You must use double quotes around your values."})
						}
				});
			},
			
			inspectorExec : function($btn)	{
				$btn.button();
				$btn.off('click.inspectorExec').on('click.inspectorExec',function(event){
					event.preventDefault();
					if(app.u.validateForm($btn.closest('form')))	{
						var
							cmdObj = $btn.closest('form').serializeJSON({'cb':true}),
							valid = true;
							
							cmdObj._tag = {};
							
						if($btn.data('inspect') == 'order' && cmdObj.orderid)	{
							cmdObj._cmd = "adminOrderDetail";
							cmdObj._tag.datapointer = "adminOrderDetail|"+cmdObj.orderid;
							}
						else if($btn.data('inspect') == 'product' && cmdObj.pid)	{
							cmdObj._cmd = "appProductGet";
							cmdObj.withVariations = 1;
							cmdObj.withInventory = 1;
							cmdObj._tag.datapointer = "appProductGet|"+cmdObj.pid;
							}
						else if($btn.data('inspect') == 'shipmethods')	{
							cmdObj._cmd = "adminConfigDetail";
							cmdObj.shipmethods = true;
							cmdObj._tag.datapointer = "adminConfigDetail|shipmethods|"+app.vars.partition;
							}
						else if($btn.data('inspect') == 'cart' && cmdObj.cartid)	{
							cmdObj._cmd = "cartDetail";
							cmdObj._tag.datapointer = "cartDetail|"+cmdObj.cartid;
							}
						else	{
							valid = false;
							$('#globalMessaging').anymessage({"message":"In admin_tools.e.inspectExec, either inspect ["+$btn.data('inspect')+"] was invalid (only product, order and cart are valid) or inspect was valid, but was missing corresponding data (ex: inspect=order but no orderid specified in form);","gMessage":true});
							}
						
						
						if(valid)	{
							var $D = app.ext.admin.i.dialogCreate({
								'title':'Inspector'
								})
							$D.dialog('open');
							cmdObj._tag.callback = function(rd)	{
								$D.hideLoading();
								if(app.model.responseHasErrors(rd)){
									$D.anymessage({'message':rd});
									}
								else	{
									//sanitize a little...
									delete app.data[rd.datapointer]._rcmd;
									delete app.data[rd.datapointer]._msgs;
									delete app.data[rd.datapointer]._msg_1_id;
									delete app.data[rd.datapointer]._msg_1_txt;
									delete app.data[rd.datapointer]._msg_1_type;
									delete app.data[rd.datapointer]._rtag;
									delete app.data[rd.datapointer]._uuid;
									delete app.data[rd.datapointer].ts
									
									$D.append(app.ext.admin_tools.u.objExplore(app.data[rd.datapointer]));
									}
								}
							app.model.addDispatchToQ(cmdObj,'mutable');
							app.model.dispatchThis('mutable');
							}
						else	{} //error messaging already handled.
						
						}
					else	{}
					});
				},
			
			powerToolBatchJobExec : function($btn)	{
				$btn.button();
				$btn.off('click.powerToolAttribChange').on('click.powerToolAttribChange',function(event){
					event.preventDefault();
//					app.u.dump("BEGIN powerToolBatchJobExec click event.");
					var	$form = $btn.closest('form');
					
					if(app.ext.admin.u.validatePicker($form))	{
						if($('#powerToolActionListTbody tr').not('.rowTaggedForRemove').length)	{
							obj = {
								'%vars' : {
									'GUID' : app.u.guidGenerator(),
									'product_selectors' : app.ext.admin_tools.u.pickerSelection2KVP($("[data-app-role='pickerContainer']",$form)),
									'actions' : app.ext.admin_tools.u.powertoolActions2KVP($('#powerToolActionListTbody'))
									},
								'type' : 'UTILITY/PRODUCT_POWERTOOL'
								}
//						console.clear();
//						app.u.dump(" -> actions: "+obj['%vars'].actions);
//						app.u.dump(" -> obj: "); app.u.dump(obj); 
							app.ext.admin_batchJob.a.adminBatchJobCreate(obj);
							}
						else	{
							$form.anymessage({'message':'Please specify at least one attribute/action in step 2.'})
							}	
						}
					else	{
						$form.anymessage({'message':'Please make at least one selection in Step 1.'})
						}
					
					
					})
				},
			
			powerToolAttribChange : function($ele)	{
				$ele.off('change.powerToolAttribChange').on('change.powerToolAttribChange',function(){
					var $fieldset = $ele.closest('fieldset');
					if($ele.val() == '_')	{
						$("[name='attrib_custom']",$fieldset).attr('required','required').parent('label').show();
						}
					else	{
						$("[name='attrib_custom']",$fieldset).attr('required','').removeAttr('required').parent('label').hide();
						}
					});
				}, //powerToolAttribChange

			powerToolConditionalChange : function($ele)	{
				$ele.off('click.powerToolAttribChange').on('click.powerToolAttribChange',function(){
					var $fieldset = $ele.closest('fieldset');
					if($ele.val() == 'when-attrib-contains')	{
						$("[data-app-role='conditionalsContainer']:first",$fieldset).show();
						}
					else	{
						$("[data-app-role='conditionalsContainer']:first",$fieldset).hide();
						}
					});
				}, //powerToolConditionalChange

			
			powerToolVerbChange : function($radio)	{
				$radio.off('click.powerToolVerbChange').on('click.powerToolVerbChange',function(){
					var $fieldset = $radio.closest('fieldset');
					$('input.lockOnVerbChange',$fieldset)
						.attr('disabled','disabled')  //disable all other inputs. helps clearly indicate what's required.
						.attr('required','').removeAttr('required').val(""); //make sure input isn't required. empty any value that was set to avoid confusion.
					$radio.closest('tr').find('input').attr('disabled','').removeAttr('disabled').attr('required','required'); //enable input(s) related to this verb.
					});
				}, //powerToolVerbChange


			productExportBatchJobCreateExec : function($btn)	{
				$btn.button();
				$btn.off('click.productExportBatchJobCreateExec').on('click.productExportBatchJobCreateExec',function(){
					var $form = $btn.closest('form');
					if(app.ext.admin.u.validatePicker($form))	{
						var sfo = $("[data-app-role='exportConfiguration']",$form).serializeJSON();
						sfo.product_selectors = app.ext.admin_tools.u.pickerSelection2KVP($("[data-app-role='pickerContainer']",$form));
						if(sfo.attributes == 'specify' && !sfo.fields)	{
							$form.anymessage({"message":"For attributes, you selected 'specify', which requires at least one attribute in the attribute list textarea."});
							}
						else	{
							app.ext.admin_batchJob.a.adminBatchJobCreate({'%vars':sfo,'guid':app.u.guidGenerator(),'type':'EXPORT/PRODUCTS'});
							}
						}
					else	{
						$form.anymessage({"message":"Please make at least one selection in 'Step 1'."});
						}
					})
				},

			productExportAttributeSrcChange : function($ele)	{
				
				$ele.off('change.productExportAttributeSrcChange').on('change.productExportAttributeSrcChange',function(){
					if($ele.val() == 'all')	{
						$ele.closest('fieldset').find("[data-app-role='exportToolAttributeListContainer']").hide();
						}
					else	{
						$ele.closest('fieldset').find("[data-app-role='exportToolAttributeListContainer']").show();
						}
					})
				
				},

			agentDetailDMIPanel : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				$btn.off('click.agentDetailDMIPanel').on('click.agentDetailDMIPanel',function(event){
					event.preventDefault();
					var
						data = $btn.closest('tr').data()

					var $panel = app.ext.admin.i.DMIPanelOpen($btn,{
						'templateID' : 'CIE_DSA_AddUpdateTemplate',
						'panelID' : 'agent_'+data.agentid,
						'header' : 'Edit agent: '+data.agentid,
						'handleAppEvents' : true
						});

//					$panel.showLoading({'message':'Fetching Agent Details'});
					$('form',$panel)
						.append("<input type='hidden' name='_cmd' value='adminCIEngineAgentUpdate' /><input type='hidden' name='_tag/updateDMIList' value='"+$panel.closest("[data-app-role='dualModeContainer']").attr('id')+"' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/message' value='The agent has been successfully updated.' />")
						.find("[name='AGENTID']")
						.closest('label').hide(); //agent id is not editable, once set.
					
					app.model.addDispatchToQ({'AGENTID':data.agentid,'_cmd':'adminCIEngineAgentDetail','_tag':{'callback':'anycontent','jqObj':$panel,'datapointer':'adminCIEngineAgentDetail|'+data.agentid}},'mutable');
					app.model.dispatchThis('mutable');
					});
				}, //agentDetailDMIPanel

			agentCreateShow : function($btn)	{

				$btn.button();
				$btn.off('click.agentCreateShow').on('click.agentCreateShow',function(event){

					event.preventDefault();
					var $D = app.ext.admin.i.dialogCreate({
						'title':'Add New Agent',
						'templateID':'CIE_DSA_AddUpdateTemplate',
						'data' : {'GUID':app.u.guidGenerator()},
						'showLoading':false //will get passed into anycontent and disable showLoading.
						});
					$D.dialog('open');
//These fields are used for processForm on save.
					$('form',$D).first().append("<input type='hidden' name='_cmd' value='adminCIEngineAgentCreate' /><input type='hidden' name='_tag/jqObjEmpty' value='true' /><input type='hidden' name='_tag/updateDMIList' value='"+$btn.closest("[data-app-role='dualModeContainer']").attr('id')+"' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/message' value='Thank you, your agent has been created.' />");

					});
				}, //agentCreateShow


			flexeditAttributesFullListShow : function($btn)	{
				$btn.button();
				$btn.off('click.flexeditAttributesFullListShow').on('click.flexeditAttributesFullListShow',function(event){
					event.preventDefault();
					var $tbody = $btn.closest("[data-app-role='flexeditMasterListContainer']").find("[data-app-role='flexeditAttributeListTbody']");
					$tbody.empty()
					$tbody.parent().showLoading({'message':'Fetching full attribute list'});

					app.ext.admin.calls.appResource.init('product_attribs_all.json',{
						'callback' : function(rd){
							$tbody.parent().hideLoading();
							
							if(app.model.responseHasErrors(rd)){
								$('#globalMessaging').anymessage({'message':rd});
								}
							else	{
								$tbody.anycontent({'datapointer':rd.datapointer});
								$('tr',$tbody).each(function(){
									$(this).attr('data-guid',app.u.guidGenerator())
									}); //has to be an attribute (as opposed to data()) so that dataTable update see's the row exists already.
//started implementing a button for 'move this to enabled list'.  Worked fine on the short list of attribs. dies on the full list.
//the issue is handleAppEvents.  Once this uses delegated events, it should work fine (handlebuttons did run w/out dying).
//however, can't migrate this yet because the data-table format uses app events, not delegated, and I don't want two copies of that.
//								app.u.handleButtons($tbody);
								}
							},
						'datapointer':'appResource|product_attribs_all.json'
						},'mutable'); //total sales
				app.model.dispatchThis('mutable');


					});
				},

			flexeditAttributeAdd2EnabledList : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-arrowthick-1-w"},text: false}).off('click.flexeditAttributeUpdateShow').on('click.flexeditAttributeUpdateShow',function(event){
					event.preventDefault();
					var $tr = $btn.closest('tr');
//					app.u.dump(" -> $btn.closest('form').find(tbody[data-app-role='flexeditEnabledListTbody']:first): "+$btn.closest('form').find("[data-app-role='flexeditEnabledListTbody']:first").length);
					$btn.closest("[data-app-role='flexeditManager']").find("tbody[data-app-role='flexeditEnabledListTbody']:first").append($tr)
					});
				},
/*
till events support multiple actions, can't implement this.
need the 'apply' button to run both the apply code AND this code.
uncomment this, the two lines in flexeditAttributeCreateUpdateShow for button(disable) and the cancel button to proceed w/ this.
OR, since old app events are still in play, could use data-app-click to trigger this and the app event code to trigger the data-table save. could be good temporary work around.
			flexDataTableAddEditCancel : function($btn)	{
				$btn.button().off('click.flexDataTableAddEditCancel').on('click.flexDataTableAddEditCancel',function(event){
					event.preventDefault();
					$btn.closest('[data-app-role="flexeditManager"]').find("[data-app-event='admin_tools|flexeditAttributeCreateUpdateShow'], [data-app-event='admin_tools|flexeditAttributeCreateUpdateShow']").button('enable');
					$btn.closest("[data-app-role='flexeditAttributeAddUpdateContainer']").slideUp();
					})
				},
*/			flexeditAttributeCreateUpdateShow : function($btn)	{
				
				if($btn.data('mode') == 'update')	{
					$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
					}
				
				$btn.button().off('click.flexeditAttributeUpdateShow').on('click.flexeditAttributeUpdateShow',function(){
					var $inputContainer = $btn.closest('form').find("[data-app-role='flexeditAttributeAddUpdateContainer']");
//disable the add and edit buttons so as to not accidentally lose data while it's being entered (form would clear or populate w/ 'edit' contents )
//					$btn.button('disable');
//					$btn.closest('[data-app-role="flexeditManager"]').find("[data-app-event='admin_tools|flexeditAttributeCreateUpdateShow']").button('disable');
					
//need to make sure form input area is 'on screen'. scroll to it.
					$('html, body').animate({
						scrollTop: $inputContainer.offset().top
						}, 1000);
					
					if($btn.data('mode') == 'update')	{
						$inputContainer.show();
						$inputContainer.anycontent({'data':$.extend({},$btn.closest('tr').data(),app.data["appResource|product_attribs_all.json"].contents[$btn.closest('tr').data('id')])})
						app.u.dump(" -> bunch o data: "); app.u.dump($.extend({},$btn.closest('tr').data(),app.data["appResource|product_attribs_all.json"].contents[$btn.closest('tr').data('id')]))
						}
					else if($btn.data('mode') == 'create')	{
						$('input, select',$inputContainer).val(''); //clear all the inputs
						$inputContainer.show();
						}
					else	{
						$btn.closest('form').anymessage({"message":"In admin_tools.e.flexeditAttributeAddUpdateShow, mode not valid. only create or update are accepted.","gMessage":true});
						}
					
					});
				},
			
			flexeditSaveExec : function($btn)	{
				$btn.button();
				$btn.off('click.flexeditSaveExec').on('click.flexeditSaveExec',function(event){
					event.preventDefault();
					var json = new Array();
					var keys = new Array();
					$btn.closest('form').find('tbody tr').not('.rowTaggedForRemove').each(function(){

						if($.inArray($(this).data('id'),keys) >= 0)	{
							//if an id is already in keys, it's already added to the flex json. This keeps duplicate id's from being added.
							}
						else	{
							keys.push($(this).data('id'));
							json.push(app.u.getWhitelistedObject($(this).data(),['id','title','index','type','options']));
							}
						})
					app.model.addDispatchToQ({
						'_cmd':'adminConfigMacro',
						'@updates':["GLOBAL/FLEXEDIT-SAVE?json="+encodeURIComponent(JSON.stringify(json))],
						'_tag':	{
							'callback' : 'showMessaging',
							'jqObj' : $btn.closest('form'),
							'removeFromDOMItemsTaggedForDelete' : true,
							'restoreInputsFromTrackingState' : true,
							'message':'Your changes have been saved'
							}
						},'immutable');
					app.model.addDispatchToQ({'_cmd':'adminConfigDetail','flexedit':'1','_tag':{'datapointer':'adminConfigDetail|flexedit'}},'immutable');
					app.model.dispatchThis('immutable');

					});
				//FLEXEDIT-SAVE
				},
			
			adminPrivateFileDownloadExec : function($btn)	{
				$btn.button({text: false,icons: {primary: "ui-icon-arrowthickstop-1-s"}});
				$btn.off('click.adminPrivateFileDownloadExec').on('click.adminPrivateFileDownloadExec',function(event){
					event.preventDefault();
					app.model.addDispatchToQ({
						'_cmd':'adminPrivateFileDownload',
						'GUID':$btn.closest('tr').data('guid'),
						'_tag':	{
							'datapointer' : 'adminPrivateFileDownload', //big dataset returned. only keep on in memory.
							'callback' : 'fileDownloadInModal',
							'skipDecode' : true //contents are not base64 encoded (feature not supported on this call)
							}
						},'mutable');
					app.model.dispatchThis('mutable');
					});
				},
			
			adminPlatformLogDownloadExec : function($btn)	{
				$btn.button({text: false,icons: {primary: "ui-icon-arrowthickstop-1-s"}});
				$btn.off('click.adminPlatformLogDownloadExec').on('click.adminPlatformLogDownloadExec',function(event){
					event.preventDefault();
					app.model.addDispatchToQ({
						'_cmd':'adminPlatformLogDownload',
						'GUID':$btn.closest('tr').data('guid'),
						'_tag':	{
							'datapointer' : 'adminPlatformLogDownload', //big dataset returned. only keep on in memory.
							'callback' : 'fileDownloadInModal',
							'skipDecode' : true //contents are not base64 encoded (feature not supported on this call)
							}
						},'mutable');
					app.model.dispatchThis('mutable');
					});
				},


			adminPrivateFileRemoveConfirm : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: true});
				$btn.off('click.adminPrivateFileRemoveConfirm').on('click.adminPrivateFileRemoveConfirm',function(event){
					event.preventDefault();
					var $rows = $btn.closest('.dualModeContainer').find("[data-app-role='dualModeListTbody'] tr.rowTaggedForRemove");
					if($rows.length)	{

						var $D = app.ext.admin.i.dialogConfirmRemove({
							'message':'Are you sure you want to remove '+$rows.length+' file(s)? There is no undo for this action.',
							'removeButtonText' : 'Remove',
							'removeFunction':function(rd){
								$D.parent().showLoading({"message":"Deleting "+$rows.length+" file(s)"});
								$rows.each(function(){
									app.model.addDispatchToQ({
										'_cmd':'adminPrivateFileRemove',
										'GUID':$(this).data('guid'),
										'_tag':	{
											'datapointer' : 'adminPrivateFileRemove', //big dataset returned. only keep on in memory.
											'callback' : function(rd){
												if(app.model.responseHasErrors(rd)){
													$D.anymessage({'message':rd});
													}
												else	{
													//only report failures.
													}
												}
											}
										},'immutable');	
										$(this).empty().remove(); //at the end so the dispatch can use data off of <tr>.							
									});

								app.model.addDispatchToQ({
									'_cmd':'ping',
									'_tag':	{
										'datapointer' : 'adminPrivateFileRemove', //big dataset returned. only keep on in memory.
										'callback' : function(rd){
											$D.parent().hideLoading();
											$D.empty();
											$D.dialog({ buttons: [ { text: "Close", click: function() { $( this ).dialog( "close" ); } } ] });
											if(app.model.responseHasErrors(rd)){
												$D.anymessage({'message':rd});
												}
											else	{
												$D.anymessage({"message":"Removal process completed."});
												//only report failures.
												}
											}
										}
									},'immutable');	
		
								app.model.dispatchThis('immutable');
								
								}
							});	

						}
					else	{
						$('#globalMessaging').anymessage({"message":"Please tag at least one file for removal (click the trash can icon)."});
						}
					})
				}, //agentRemoveConfirm,


			agentRemoveConfirm : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.agentRemoveConfirm').on('click.agentRemoveConfirm',function(event){
					event.preventDefault();
					var 
						$tr = $btn.closest('tr'),
						data = $tr.data(),
						$D;

					$D = app.ext.admin.i.dialogConfirmRemove({'removeFunction':function(){
						$D.showLoading({"message":"Deleting Agent"});
						app.model.addDispatchToQ({'AGENTID':data.agentid,'_cmd':'adminCIEngineAgentRemove','_tag':{'callback':function(rd){
							$D.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$('#globalMessaging').anymessage({'message':rd});
								}
							else	{
								$D.dialog('close');
								$('#globalMessaging').anymessage(app.u.successMsgObject('Agent '+data.agentid+' has been removed.'));
								$tr.empty().remove(); //removes row from list. no need to refetch entire list.
								
								var $panel = $(app.u.jqSelector('#','agent_'+data.agentid));
								
								if($panel.length)	{
									$panel.anypanel('destroy');
									}
								}
							}}},'immutable');
						app.model.dispatchThis('immutable');
						}});
					})
				}, //agentRemoveConfirm

			siteDebugExec : function($ele,p)	{
				var cmdObj = $ele.closest('form').serializeJSON();
				cmdObj._tag = {
					'datapointer' : cmdObj.siteDebug
					};
				app.u.dump(cmdObj);
				app.model.addDispatchToQ(cmdObj,'mutable');
				app.model.dispatchThis('mutable');
				},

			//for forcing a product into the product task list
			forcePIDIntoPTL : function($ele,p)	{
				app.ext.admin_prodEdit.u.addProductAsTask({'pid':$ele.closest('form').find("[name='pid']").val(),'tab':'product','mode':'add'});
				}
				
			} //e [app Events]
		} //r object.
	return r;
	}