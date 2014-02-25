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
	var theseTemplates = new Array('blastManagerTemplate','blastMessageDetailTemplate','blastToolTemplate');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				_app.model.fetchNLoadTemplates(_app.vars.baseURL+'extensions/admin/blast.html',theseTemplates);
				//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
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

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
		a : {
			blastMessagesList : function($target,params)	{
				$target.showLoading({"message":"Fetching list of messages"});
				$target.tlc({'templateid':'blastManagerTemplate','verb':'template'});
				_app.u.addEventDelegation($target);
				
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
									if(msgs[i].OBJECT)	{
										$("[data-app-role='blastmessages_"+msgs[i].OBJECT+"']",$target).append("<li class='lookLikeLink' data-app-click='admin_blast|msgDetailView' data-msgid="+msgs[i].MSGID+">"+msgs[i].MSGID.substr(msgs[i].OBJECT.length + 1).toLowerCase()+"<\/li>")	
										}
									}
								$(".slimLeftNav",$target).accordion();
								}
							}
						}
					},"mutable");
				_app.model.dispatchThis("mutable");
				},
			
			blastMessagesDetail : function($target,params)	{
				dump(" -> params: "); dump(params);
				_app.model.addDispatchToQ({"_cmd":"adminBlastMsgDetail","MSGID":params.msgid,"_tag":{
					"datapointer":"blastMessagesDetail|"+params.msgid,
					"jqObj" : $target,
					"callback":'tlc'}
					},"mutable");
				_app.model.dispatchThis("mutable");
				},


			// opens a 'send message' tool. can be sent via email for now. later will support SMS, push notification, etc.
			//params wants an 'object' and a 'partition'. Partition is passed because, in the case of orders, you may be working with an order from another partition.
			blastTool : function($target,params)	{
				params = params || {};
				if(params.object && Number(params.partition) >= 0)	{
//listType must match one of these. an array is used because there will be more types:
//  'TICKET','PRODUCT','ACCOUNT','SUPPLY','INCOMPLETE'
					var validObjects = ['ORDER','CUSTOMER']; 
					if($.inArray(params.object,validObjects) >= 0)	{

						$target.showLoading({'message':'Fetching list of email messages/content'});

						_app.model.addDispatchToQ({
							"_cmd":"adminBlastMsgList",
							"_tag":{
								"datapointer":"adminBlastMsgList|"+params.partition,
								"jqObj" : $target,
								"templateid" : "blastToolTemplate",
								"callback":'tlc'}
							},"mutable");
						_app.model.dispatchThis("mutable");
						
						}
					else	{
						$('#globalMessaging').anymessage({'gMessage':true,'message':'In admin_blast.a.blastTool, invalid object ['+params.object+'] specified.'})
						}
				
					}
				else	{
					$('#globalMessaging').anymessage({'gMessage':true,'message':'In admin_blast.a.blastTool, vars.object ['+params.object+'] or partition ['+params.partition+'] not specified.'})
					}
				
				
				}



			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//renderFormats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		tlcFormats : {

//used for adding email message types to a select menu.
//designed for use with the vars object returned by a adminEmailList _cmd
			msgsasoptions : function(data,thisTLC)	{
				var val = data.globals.binds[data.globals.focusBind];
				dump(" -> val: "); dump(val);
				var L = val.length;
				var $tmp = $("<select>");
	//adminEmailListIndex below is used to lookup by index the message in the list object.
				for(var i = 0; i < L; i += 1)	{
					$tmp.append($("<option \/>").val(val[i].MSGID).text(val[i].MSGTITLE || val[i].MSGID).data({'MSGID':val[i].MSGID,'adminEmailListIndex':i}));
					}
				return $tmp.children();
				}

			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			
			msgDetailView : function($ele,P)	{
				if($ele.data('msgid'))	{
					_app.ext.admin_blast.a.blastMessagesDetail($ele.closest("[data-app-role='slimLeftContainer']").find("[data-app-role='slimLeftContentSection']"),{'msgid':$ele.data('msgid')});
					}
				else	{
					$("#globalMessaging").anymessage({"message":"In admin_blast.e.msgDetailView, no data.msgid set on trigger element.","gMessage":true});
					}
				}, //msgDetailView

//applied to the select list that contains the list of email messages. on change, it puts the message body into the textarea.
			toggleEmailInputValuesBySource : function($ele)	{
					var
						$option = $("option:selected",$ele),
						datapointer = $option.closest("[data-adminemaillist-datapointer]").data('adminemaillist-datapointer'),
						$form = $option.closest('form');

					if($option.val() == 'BLANK')	{
						$form.find("[name='body']").val(""); //clear the form.
						$form.find("[name='updateSystemMessage']").attr({'disabled':'disabled','checked':false}); //can't update 'blank'.
						$(".msgType",$form).empty();
						}
					else if(datapointer && _app.data[datapointer])	{
						$form.find("[name='BODY']").val(_app.data[datapointer]['@MSGS'][$option.data('adminEmailListIndex')].MSGBODY);
						$form.find("[name='SUBJECT']").val(_app.data[datapointer]['@MSGS'][$option.data('adminEmailListIndex')].MSGSUBJECT);
						$form.find("[name='updateSystemMessage']").removeAttr('disabled');
						$(".msgType",$form).text($form.find("[name='MSGID']").val());
						}
					else	{
						$form.anymessage({'gMessage':true,'message':"In admin.e.orderEmailCustomChangeSource, either unable to determine datapointer ["+datapointer+"] or _app.data[datapointer] is undefined ["+typeof _app.data[datapointer]+"]."});
						}
				}, //orderEmailCustomChangeSource

//vars needs to include listType as well as any list type specific variables (CID for CUSTOMER, ORDERID for ORDER)
			execBlastToolSend : function($btn,vars){
				$btn.button();
				$btn.off('click.execMailToolSend').on('click.execMailToolSend',function(event){
					event.preventDefault();
					vars = vars || {};
					var $form = $btn.closest('form');

					if(vars.listType)	{
						if(_app.u.validateForm($form))	{
							_app.ext.admin.u.sendEmail($form,vars);	

//handle updating the email message default if it was checked. this runs independant of the email send (meaning this may succeed but the send could fail).
							if($("[name='updateSystemMessage']",$form).is(':checked') && $("[name='MSGID']",$form).val() != 'BLANK')	{
								frmObj.PRT = vars.partition;
								frmObj.TYPE = vars.listType; //Don't pass a blank FORMAT, must be set to correct type.
								delete frmObj.updateSystemMessage; //clean up obj for _cmd var whitelist.
								_app.ext.admin.calls.adminEmailSave.init(frmObj,{'callback':function(rd){
									if(_app.model.responseHasErrors(rd)){
										$form.anymessage({'message':rd});
										}
									else	{
										$form.anymessage(_app.u.successMsgObject(frmObj.MSGID+" message has been updated."));
										}
									}},'immutable');
								}
							
							_app.model.dispatchThis('immutable');
							}
						else	{} //validateForm handles error display.

						}
					else	{
						$form.anymessage({'message':'In admin.e.execMailToolSend, no list type specified in vars for app event.'});
						}
					});
				}


			
			} //e [app Events]
		} //r object.
	return r;
	}