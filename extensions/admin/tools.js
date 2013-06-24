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
				$("[data-app-role='pickerContainer']:first",$target).append(app.ext.admin.a.getPicker());
				app.u.handleAppEvents($target,{'$form':$('#productPowerToolForm'),'$dataTbody':$("[data-app-role='powertoolSelectedActionsContainer'] tbody",$target)});

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
			pickerSelection2CSV : function(sfo)	{
sfo.navcat = "";
sfo.supplier = "";
sfo.mancat = "";
function handleIt(type)	{
	if(index.indexOf(type+'_') === 0)	{
		if(Number(sfo[index]) === 1)	{
			sfo[type] += index.substring(type.length + 1)+','; //the substring strips the 'type' indicator and the underscore (the +1) from the front of the index. (makes navcat_.safeid into .safeid)
			}
		delete sfo[index]; //trim the fat off of the object.
		}
	}


for(index in sfo)	{
	handleIt('navcat');
	handleIt('supplier');
	handleIt('mancat');
	}
				}/*,
			powerToolGetValue : function(sfo)	{
				var value = ""; //what is returned. based on what verb is set.
				switch(sfo.verb)	{
					case 'set':
					  r = sfo.setval;
					  break;
					case 'add':
					  r = sfo.addval;
					case 'replace':
					  r = sfo.searchval;
					  
					  break;
					default:
					  
					}
				}
*/			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			
			powerToolAddAction : function($btn)	{
				$btn.button();
				$btn.off('click.powerToolAddAction').on('click.powerToolAddAction',function(){
					var $form = $btn.closest('form');
					var sfo = $form.serializeJSON({'cb':true});

					if(app.u.validateForm($form) && sfo.verb)	{
						app.ext.admin_tools.u.pickerSelection2CSV(sfo); //manipulate the data. drop supperfluous inputs.

						var 
							$dataTbody = $('#powerToolActionListTbody'),
							bindData = app.renderFunctions.parseDataBind($dataTbody.attr('data-bind')),
							$tr = app.renderFunctions.createTemplateInstance(bindData.loadsTemplate,sfo);

							$tr.anycontent({'data':sfo}).appendTo($dataTbody);
							$tr.addClass('edited');
							$tr.addClass('isNewRow'); //used in the 'save'. if a new row immediately gets deleted, it isn't added.

							app.u.handleAppEvents($tr); //vars are passed through so that buttons in list can inheret. rules uses this.
						}
					else	{
						//validateForm will handle most error display.
						if(!sfo.verb)	{
							$form.anymessage({'message':"Please choose an action in the 'now what to do' section."})
							}
						} 
					});
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
						.attr('required','').removeAttr('required'); //make sure input isn't required.
					$radio.closest('tr').find('input').attr('disabled','').removeAttr('disabled').attr('required','required'); //enable input(s) related to this verb.
					});
				}, //powerToolVerbChange

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