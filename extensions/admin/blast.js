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
										$("[data-app-role='blastmessages_"+msgs[i].OBJECT+"']",$target).append("<li class='lookLikeLink' data-app-click='admin_blast|msgDetailView' data-msgid="+msgs[i].MSGID+">"+(msgs[i].TITLE || msgs[i].MSGID.substring(msgs[i].MSGID.indexOf('.')+1).toLowerCase())+"<\/li>")	
										}
									}
								$(".slimLeftNav",$target).accordion();
								}
							}
						}
					},"mutable");
				_app.model.dispatchThis("mutable");
				},
//used in the blast message list tool for editing a specific message.			
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
				_app.u.addEventDelegation($target);
				if(params.OBJECT && Number(params.PRT) >= 0)	{
//listType must match one of these. an array is used because there will be more types:
//  'TICKET','PRODUCT','ACCOUNT','SUPPLY','INCOMPLETE'
					var validObjects = ['ORDER','CUSTOMER']; 
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
				if(val)	{
					var L = val.length;
					var $tmp = $("<select>");
		//adminEmailListIndex below is used to lookup by index the message in the list object.
					for(var i = 0; i < L; i += 1)	{
						$tmp.append($("<option \/>").val(val[i].MSGID).text(val[i].MSGTITLE || val[i].MSGID.substring(val[i].MSGID.indexOf('.')+1).toLowerCase()));
						}
					globals.binds[globals.focusBind] = $tmp.children();
					}
				else	{
					}
				return true;
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
					msgid = $("option:selected",$ele).val(),
					$form = $ele.closest('form');

				if(msgid == 'BLANK')	{
					$form.find("[name='body']").val(""); //clear the form.
					$form.find("[name='updateSystemMessage']").attr({'disabled':'disabled','checked':false}); //can't update 'blank'.
					$(".msgType",$form).empty();
					}
				else	{
					_app.model.addDispatchToQ({"_cmd":"adminBlastMsgDetail","MSGID":msgid,"_tag":{"datapointer":"adminBlastMsgDetail|"+msgid,"callback":'tlc','jqObj':$form}},"mutable");
					_app.model.dispatchThis("mutable");
//					$form.find("[name='BODY']").val(_app.data[datapointer]['@MSGS'][$option.data('adminEmailListIndex')].MSGBODY);
//					$form.find("[name='SUBJECT']").val(_app.data[datapointer]['@MSGS'][$option.data('adminEmailListIndex')].MSGSUBJECT);
					$form.find("[name='updateSystemMessage']").removeAttr('disabled');
					$(".msgType",$form).text(msgid);
					}
				}, //orderEmailCustomChangeSource

			execMsgBlastUpdateExec : function($ele,P)	{
				alert('not done yet');
				},

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


//							_app.ext.admin.u.sendEmail($form,vars);	
				} //msgBlastSendExec
			} //e [app Events]
		} //r object.
	return r;
	}