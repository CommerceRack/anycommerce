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
			
			showProductExport : function($target)	{
				$target.empty().anycontent({'templateID':'productExportToolTemplate','showLoading':false});
				$(':checkbox',$target).anycb(); //run before picker added to dom so that picker isn't affected.

				var $picker = $("[data-app-role='pickerContainer']:first",$target);
				$picker.append(app.ext.admin.a.getPicker({'templateID':'pickerTemplate','mode':'product'}));
				
				
				$('.toolTip',$target).tooltip();
				app.u.handleAppEvents($target);
				},

			showAccountUtilities : function($target)	{
				$target.empty().anycontent({'templateID':'accountUtilitiesTemplate','showLoading':false});
//need to apply datepicker to date inputs.
				$('button',$target).button();
				app.u.handleAppEvents($target);
				},
			
			showPrivateFiles : function($target)	{

				$target.empty();
				app.ext.admin.i.DMICreate($target,{
					'header' : 'Private Files',
					'className' : 'privatefiles', //applies a class on the DMI, which allows for css overriding for specific use cases.
					'thead' : ['Created','Filename','Type','Size','Expiration','Creator'],
					'tbodyDatabind' : "var: users(@FILES); format:processList; loadsTemplate:privatefilesRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminPrivateSearch',
						'_tag' : {
							'datapointer':'adminPrivateSearch'
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

			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
			pickerSelection2KVP : function($context)	{
				app.u.dump("BEGIN admin_tools.u.pickerSelection2KVP");
				var r = ""; //what is returned. line separated w/ each line as  'navcat=.safe.name' or 'vendor=XYZ'
				var sfo = $context.serializeJSON({'cb':true});
//				app.u.dump(" -> sfo: "); app.u.dump(sfo);
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
						else if(index.indexOf('SUBSCRIBERLIST') === 0)	{handleIt('SUBSCRIBERLIST');}
						else	{} //do nada. isn't a checkbox list.
						}
					
					if(sfo.rstart && sfo.rend)	{
						r += "range?"+sfo.rstart+"|"+sfo.rend+"\n";
						}

					if(sfo.createstart && sfo.createend)	{
						r += "created?"+sfo.createstart+"|"+sfo.createend+"\n";
						}
					
					if(sfo.csv)	{
						r += "csv?"+sfo.csv.replace(/\n/,"")+"\n";
						}
					}
				app.u.dump(" -> r: "+r);
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
				$('tr',$tbody).each(function(){
					var
						data = $(this).data(),
						verb = data.verb;
						
					delete data.verb;
					r += verb+"?"+app.ext.admin.u.getSanitizedKVPFromObject(data);
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
			
			
			powerToolBatchJobExec : function($btn)	{
				$btn.button();
				$btn.off('click.powerToolAttribChange').on('click.powerToolAttribChange',function(event){
					event.preventDefault();
					app.u.dump("BEGIN powerToolBatchJobExec click event.");
					var	$form = $btn.closest('form');
						obj = {
							'%vars' : {
								'GUID' : app.u.guidGenerator(),
								'APP' : 'PRODUCT_POWERTOOL',
								'product_selectors' : app.ext.admin_tools.u.pickerSelection2KVP($("[data-app-role='pickerContainer']",$form)),
								'actions' : app.ext.admin_tools.u.powertoolActions2KVP($('#powerToolActionListTbody'))
								},
							'type' : 'UTILITY'
							}
//					console.clear();
//					app.u.dump(" -> actions: "+obj['%vars'].actions);
//					app.u.dump(" -> obj: "); app.u.dump(obj); 
					app.ext.admin_batchJob.a.adminBatchJobCreate(obj);
					
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
					app.u.dump('got here');
					$('input',$fieldset)
						.not("[app-data-role='powerToolConditionalContainer'] input") //skip the conditional inputs
						.not(':radio') //don't lock the radios or verb can't be changed.
						.attr('disabled','disabled')  //disable all other inputs. helps clearly indicate what's required.
						.attr('required','').removeAttr('required').val(""); //make sure input isn't required. empty any value that was set to avoid confusion.
					$radio.closest('tr').find('input').attr('disabled','').removeAttr('disabled').attr('required','required'); //enable input(s) related to this verb.
					});
				}, //powerToolVerbChange


			productExportBatchJobCreateExec : function($btn)	{
				$btn.button();
				$btn.off('click.productExportBatchJobCreateExec').on('click.productExportBatchJobCreateExec',function(){
					var $form = $btn.closest('form');
					if($("[data-app-role='pickerContainer'] :checkbox:checked",$form).length)	{
						var sfo = $form.serializeJSON({'cb':true});
						if(sfo.attributes == 'specify' && !sfo.fields)	{
							$form.anymessage({"message":"For attributes, you selected 'specify', which requires at least one attribute in the attribute list textarea."});
							}
						else	{
							app.ext.admin_batchJob.a.adminBatchJobCreate({'verb':'EXPORT_REDIRECT','%vars':sfo,'guid':app.u.guidGenerator(),'type':'UTILITY'});
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
				} //agentRemoveConfirm

			} //e [app Events]
		} //r object.
	return r;
	}