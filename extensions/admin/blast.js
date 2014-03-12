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


var admin_blast = function(_app) {
	var theseTemplates = new Array('blastManagerTemplate','blastMessageAddTemplate','blastMessageSendTestTemplate','blastMessageDetailTemplate','blastToolTemplate','blastMacroRowTemplate','adminBlastMacroCreateUpdateTemplate','blastMacroProperyEditorTemplate');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				_app.model.fetchNLoadTemplates(_app.vars.baseURL+'extensions/admin/blast.html',theseTemplates);
				//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
				_app.formatRules.blastMacroMacroID = function($input,$err){
					var val = $input.val(), valid = true;
					dump(" -> val.charAt(val.length - 1): "+val.charAt(val.length - 1));
					if(val.charAt(0) == '%' && val.charAt(val.length - 1) == '%')	{
						if(/^[a-zA-Z0-9%]*$/.test(val) == true) {
							valid = true;
							}
						else	{
							$err.append('spaces and special characters not allowed.');
							valid = false;
							}
						}
					else	{
						$err.append('The macro id must begin and end with a %');
						valid = false;
						}
					return valid;
					}
				
				return true;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				_app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
		a : {
			//shows the lists of all blast messages and the means to edit each one individually.
			blastMessagesList : function($target,params)	{
				$target.showLoading({"message":"Fetching list of messages"});
				$target.tlc({'templateid':'blastManagerTemplate','verb':'template'});
				_app.u.addEventDelegation($target);
				_app.u.handleButtons($target);
				$(".slimLeftNav .accordion",$target).accordion({
					heightStyle: "content"
					});
				_app.model.addDispatchToQ({
					"_cmd":"adminBlastMsgList",
					"_tag":{
						"datapointer":"adminBlastMsgList|"+_app.vars.partition,
						"callback":function(rd)	{
							$target.hideLoading();
							if(_app.model.responseHasErrors(rd)){
								$('#globalMessaging').anymessage({'message':rd});
								}
							else	{
								var msgs = _app.data[rd.datapointer]['@MSGS'];
								for(var i = 0, L = msgs.length; i < L; i += 1)	{
									if(msgs[i].OBJECT != 'PRODUCT' && msgs[i].OBJECT != 'ACCOUNT' && msgs[i].OBJECT != 'ORDER')	{dump(msgs[i].OBJECT);}
									if(msgs[i].OBJECT)	{
										$("[data-app-role='blastmessages_"+msgs[i].OBJECT+"']",$target).append("<li class='lookLikeLink' data-app-click='admin_blast|msgDetailView' data-msgid="+msgs[i].MSGID+">"+(msgs[i].SUBJECT || msgs[i].MSGID.substring(msgs[i].MSGID.indexOf('.')+1).toLowerCase())+"<\/li>");
										}
									}
								//when the accordion is originally generated, there's no content, so the accordion panels have no height. this corrects.
								// the accordion does get initiated here because the left column looked out of place for too long.
								$(".slimLeftNav .accordion",$target).accordion('refresh');
								}
							}
						}
					},"mutable");
				_app.model.dispatchThis("mutable");
				}, //blastMessagesList

			//used in the blast message list tool for editing a specific message.			
			//can be used outside that interface by calling directly.
			blastMessagesDetail : function($target,params)	{
				$target.showLoading({"message":"Fetching message detail"});
				_app.model.addDispatchToQ({"_cmd":"adminBlastMsgDetail","MSGID":params.msgid,"_tag":{
					"datapointer":"blastMessagesDetail|"+params.msgid,
					"jqObj" : $target,
					"trackEdits" : true,
					"templateid" : "blastMessageDetailTemplate",
					"callback":'tlc'}
					},"mutable");
				_app.model.dispatchThis("mutable");
				}, //blastMessageDetail

			// opens a 'send message' tool. can be sent via email for now. later will support SMS, push notification, etc.
			//params wants an 'object' and a 'partition'. Partition is passed because, in the case of orders, you may be working with an order from another partition.
			blastTool : function($target,params)	{
				params = params || {};
//				dump("BEGIN blast.a.blastTool"); dump(params);
				_app.u.addEventDelegation($target);
				if($target.closest('.ui-dialog-content').length){} //in a dialog, no extra styling necessary.
				else	{
					$target.addClass('ui-widget ui-widget-content stdPadding');
					}
				if(params.OBJECT && Number(params.PRT) >= 0)	{
//listType must match one of these. an array is used because there will be more types:
//  'TICKET','PRODUCT','ACCOUNT','SUPPLY','INCOMPLETE'
					var validObjects = ['ORDER','CUSTOMER','TICKET','PRODUCT','SUPPLY']; 
					if($.inArray(params.OBJECT,validObjects) >= 0)	{

						$target.showLoading({'message':'Fetching list of email messages/content'});
// ### TODO -> support caching on this datapointer.
						_app.model.addDispatchToQ({
							"_cmd":"adminBlastMsgList",
							"_tag":{
								"datapointer":"adminBlastMsgList|"+params.partition,
								"jqObj" : $target,
								"templateid" : "blastToolTemplate",
								"dataset" : params,
								"onComplete" : function(){
									$("[name='MSGID']",$target)
										.val('BLANK') //for some reason, the tlcFormat is selecting the last option added as 'selected'.
										.find('option').not("[value='BLANK']").each(function(){
											//filter out objects that don't match.
											var msgObject = $(this).val().split('.')[0];
											if(msgObject != params.OBJECT)	{$(this).hide();}
											});
									},
								"callback":'tlc'}
							},"mutable");
						_app.model.dispatchThis("mutable");
						}
					else	{
						$('#globalMessaging').anymessage({'gMessage':true,'message':'In admin_blast.a.blastTool, invalid OBJECT ['+params.OBJECT+'] specified.'})
						}
					}
				else	{
					$('#globalMessaging').anymessage({'gMessage':true,'message':'In admin_blast.a.blastTool, vars.OBJECT ['+params.OBJECT+'] or partition ['+params.PRT+'] not specified.'})
					}
				}, //blastTool

			blastMacroProperyEditor : function($target,params)	{
				if($target.closest('.ui-dialog-content').length)	{}
				else	{$target.addClass('ui-widget ui-widget-content stdPadding ui-corner-all')}
				$target.showLoading({"message":"Fetching macro properties"});
				_app.model.addDispatchToQ({"_cmd":"adminBlastMacroPropertyDetail","_tag":{"datapointer":"adminBlastMacroPropertyDetail","callback":"tlc","templateid":"blastMacroProperyEditorTemplate","jqObj":$target,"trackChanges":true}},"mutable");
				_app.model.dispatchThis("mutable");
				_app.u.addEventDelegation($target);
				},

			blastMacroEditor : function($target,params)	{
				var $table = _app.ext.admin.i.DMICreate($target,{
					'header' : 'Blast Macro Editor',
					'className' : 'blastMacroManager',
					'buttons' : ["<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh<\/button>","<button data-app-click='admin_blast|blastMacroProperyEditorShow' class='applyButton' data-icon-primary='ui-icon-pencil'>Global Properties</button>","<button class='applyButton' data-icon-primary='ui-icon-circle-plus' data-app-click='admin_blast|blastMacroAddShow'>Add Macro<\/button>"],
					'thead' : ['Title','Macro','Created','User',''],
					'tbodyDatabind' : "var: users(@MACROS); format:processList; loadsTemplate:blastMacroRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminBlastMacroList', //this is partition specific. if we start storing this locally, add prt to datapointer.
						'_tag' : {
							'datapointer' : 'adminBlastMacroList'},
							}
						});
				_app.u.handleButtons($target);
				_app.model.dispatchThis('mutable');
				}, //blastMacroEditor
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//renderFormats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		tlcFormats : {

//used for adding email message types to a select menu.
			msgsasoptions : function(data,thisTLC)	{
				var val = data.globals.binds[data.globals.focusBind];
				if(val)	{
					var L = val.length;
					var $tmp = $("<select>");
		//adminEmailListIndex below is used to lookup by index the message in the list object.
					for(var i = 0; i < L; i += 1)	{
						$tmp.append($("<option \/>").val(val[i].MSGID).text(val[i].MSGTITLE || val[i].MSGID.substring(val[i].MSGID.indexOf('.')+1).toLowerCase()));
						}
					data.globals.binds[data.globals.focusBind] = $tmp.children();
					}
				else	{
					}
				return true;
				} //msgsasoptions

			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
			showBlastToolInDialog : function(params)	{
				var $D = _app.ext.admin.i.dialogCreate({
					title : params.title || "Send Blast",
					anycontent : false, //the dialogCreate params are passed into anycontent
					handleAppEvents : false //defaults to true
					});
				$D.dialog('open');
				_app.ext.admin_blast.a.blastTool($D,params); ///###TODO -> need to get partition.
				
				}
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
//exexuted in the message list view.
//will bring a message into focus in the content area in an editor.
			msgDetailView : function($ele,P)	{
				$ele.closest('.slimLeftNav').find('.ui-state-focus').removeClass('ui-state-focus');
				if($ele.data('msgid'))	{
					$ele.addClass('ui-state-focus');
					_app.ext.admin_blast.a.blastMessagesDetail($ele.closest("[data-app-role='slimLeftContainer']").find("[data-app-role='slimLeftContentContainer']").empty(),{'msgid':$ele.data('msgid')});
					}
				else	{
					$("#globalMessaging").anymessage({"message":"In admin_blast.e.msgDetailView, no data.msgid set on trigger element.","gMessage":true});
					}
				}, //msgDetailView

			adminBlastMsgSendTestShow : function($ele,P)	{
				var $D = _app.ext.admin.i.dialogCreate({
					title : "Send Blast Test",
					tlc : {'templateid' : 'blastMessageSendTestTemplate','verb':'template'},
					handleAppEvents : false //defaults to true
					});
				$('form',$D).append("<input type='hidden' name='MSGID' value='"+($ele.closest('form').find("[name='MSGID']").val())+"' />");
				$D.dialog('option','width',($(document.body).width() < 350 ? '90%' : 350));
				$D.dialog('open');
				},

			adminBlastMsgCreateExec : function($ele,P)	{
				var $form = $ele.closest('form');
				if(_app.u.validateForm($form))	{
					var sfo = $form.serializeJSON();
					_app.model.addDispatchToQ({"_cmd":"adminBlastMsgCreate","MSGID" : sfo.msgtype+"."+sfo.msgid, "_tag":{"callback":function(rd){
						if(_app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							//sample action. success would go here.
							$('#globalMessaging').anymessage(_app.u.successMsgObject('The message has been added.'));
							$ele.closest('.ui-dialog-content').dialog('close');
							navigateTo("#!ext/admin_blast/blastMessagesList");
							}
						}}},"immutable");
					_app.model.dispatchThis("immutable");
					}
				else	{
					//validateForm will handle error display.
					}
				return false;
				},

			adminBlastCustomerFind : function($ele,P)	{
				var $form = $ele.closest('form'); //used for context.
				_app.ext.admin_customer.a.customerSearch({'searchfor':$("input[name='emailForSearch']",$form).val(),'scope':'EMAIL'},function(customer){
					$("input[name='CID']",$form).val(customer.CID);
					});
				},

			adminBlastMsgCreateShow : function($ele,P)	{
				if($ele.data('msgtype'))	{
					var $D = _app.ext.admin.i.dialogCreate({
						title : "Create New Blast Message",
						tlc : {'templateid':'blastMessageAddTemplate',dataset : {'msgtype':$ele.data('msgtype')}},
						anycontent : false, //the dialogCreate params are passed into anycontent
						handleAppEvents : false //defaults to true
						});
					$D.dialog('option','width',($(document.body).width() < 350 ? '90%' : 350));
					$D.dialog('open');
					}
				else	{
					$("#globalMessaging").anymessage({"message":"In admin_blast.e.msgTestShow, no data.receiver set on trigger element.","gMessage":true});
					}
				return false;
				},

//applied to the select list that contains the list of messages in the blast tool. on change, it puts the message body into the textarea.
			updateBlastInputsBySource : function($ele,P)	{
				var
					msgid = $("option:selected",$ele).val(),
					$form = $ele.closest('form');

				if(msgid == 'BLANK')	{
					$form.find("[name='body']").val(""); //clear the form.
					$form.find("[name='updateSystemMessage']").attr({'disabled':'disabled','checked':false}); //can't update 'blank'.
					$(".msgType",$form).empty();
					}
				else	{
					_app.model.addDispatchToQ({"_cmd":"adminBlastMsgDetail","MSGID":msgid,"_tag":{
						"datapointer":"adminBlastMsgDetail|"+msgid,
						"callback":'tlc',
						"verb" : "translate",
						'jqObj':$("[data-app-role='blastToolMsgContent']",$form).showLoading({"message":"Fetching message detail"})
						}},"mutable");
					_app.model.dispatchThis("mutable");
//					$form.find("[name='BODY']").val(_app.data[datapointer]['@MSGS'][$option.data('adminEmailListIndex')].MSGBODY);
//					$form.find("[name='SUBJECT']").val(_app.data[datapointer]['@MSGS'][$option.data('adminEmailListIndex')].MSGSUBJECT);
					$form.find("[name='updateSystemMessage']").removeAttr('disabled');
					$(".msgType",$form).text(msgid);
					}
				}, //orderEmailCustomChangeSource

//vars needs to include listType as well as any list type specific variables (CID for CUSTOMER, ORDERID for ORDER)
			msgBlastSendExec : function($ele,P){
				P = P || {};
				P.preventDefault();
				var $form = $ele.closest('form');

				if(_app.u.validateForm($form))	{
					alert('not done yet');
//					_app.model.addDispatchToQ($.extend($form.serializeJSON(),{"_cmd":"adminBlastMsgSend","_tag":{"callback":"showMessaging","message":"Your message has been sent.","jqObj":$form,"jqObjEmpty":true}}),"immutable");
//					_app.model.dispatchThis("immutable");
					}
				else	{
					//validate form handles error display.
					}
				}, //msgBlastSendExec

/* blast macro */

			blastMacroProperyEditorShow : function()	{

				var $D = _app.ext.admin.i.dialogCreate({
					title : "Add Macro",
					'showLoading' : false,
					handleAppEvents : false //defaults to true
					});
				
				$D.dialog('open');
				_app.ext.admin_blast.a.blastMacroProperyEditor($D);
				

				
				},

			blastMacroDeleteConfirm : function($ele,P)	{
				var macroid = $ele.closest('tr').data('macroid');
				var $D = _app.ext.admin.i.dialogConfirmRemove({
					"message" : "Are you sure you want to delete macro "+macroid+"? There is no undo for this action.",
					"removeButtonText" : "Remove", //will default if blank
					"title" : "Remove Macro "+macroid, //will default if blank
					removeFunction : function()	{
						_app.model.addDispatchToQ({"_cmd":"adminBlastMacroRemove","MACROID":macroid,"_tag":{"callback":function(rd){
							//if the macro has a panel open, close it.
							var $panel = $(_app.u.jqSelector('#','macro_'+macroid));
							if($panel.length)	{
								$panel.anypanel('destroy'); //make sure there is no editor for this warehouse still open.
								}
							
							$D.dialog('close'); 
							$("#globalMessaging").anymessage({"message":"The macro has been deleted.","errtype":"success"});
							//hide the row. no need to refresh the whole list.
							$ele.closest('tr').slideUp();
							
							}}},"immutable");
						_app.model.dispatchThis("immutable");
						}
					});
				},

			blastMacroUpdateShowPanel : function($ele,P)	{
				var macroid = $ele.closest('tr').data('macroid');
				var $panel = _app.ext.admin.i.DMIPanelOpen($ele,{
					'templateID' : 'adminBlastMacroCreateUpdateTemplate',
					'panelID' : 'macro_'+macroid,
					'header' : 'Edit Macro: '+macroid,
					'handleAppEvents' : false,
					'data' : {}
					});
				$panel.tlc({'verb':'translate','dataset':_app.ext.admin.u.getValueByKeyFromArray(_app.data['adminBlastMacroList']['@MACROS'],'MACROID',macroid)});
				$('form',$panel).append("<input type='hidden' name='_cmd' value='adminBlastMacroUpdate' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/message' value='The macro has been updated.' /><input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
				$("input[name='MACROID']",$panel).prop('disabled','disabled');
				_app.u.handleCommonPlugins($panel);
				_app.u.handleButtons($panel);
				},

			blastMacroAddShow : function($ele,P)	{
				var $D = _app.ext.admin.i.dialogCreate({
					title : "Add Macro",
					'templateID' : 'adminBlastMacroCreateUpdateTemplate',
					'showLoading' : false,
					anycontent : false, //the dialogCreate params are passed into anycontent
					handleAppEvents : false //defaults to true
					});
				$('form',$D).append("<input type='hidden' name='_cmd' value='adminBlastMacroCreate' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/message' value='The macro has been created' /><input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' /><input type='hidden' name='_tag/jqObjEmpty' value='true' /><input type='hidden' name='_tag/persistent' value='true' />");
				$D.dialog('open');
				}


			} //e [app Events]
		} //r object.
	return r;
	}