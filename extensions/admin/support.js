/* **************************************************************

   Copyright 2011 Zoovy, Inc.

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

/*
An extension for managing the media library in addition to ALL other file uploads,including, but not limited to: csv and zip.
*/



var admin_support = function() {
	var theseTemplates = new Array('supportFileUploadTemplate','supportPageTemplate','supportTicketRowTemplate','supportTicketCreateTemplate','supportTicketDetailTemplate','supportTicketFollowupTemplate');
	var r = {

////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	calls : {
// in next odd release, move this to admin. !!!
		adminTicketFileAttach : {
			init : function(obj,tagObj)	{
				this.dispatch(obj,tagObj);
				},
			dispatch : function(obj,tagObj)	{
				var obj = obj || {};
				obj['_tag'] = tagObj || {};
				obj._tag.datapointer = "adminTicketFileAttach|"+obj.ticket;
				obj['_cmd'] = "adminTicketFileAttach";
				app.model.addDispatchToQ(obj,'immutable');	
				}
			} //adminNavcatProductDelete
		
		}, //calls




////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/support.html',theseTemplates);

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}, //init
		
		handleAdminTicketFileAttach : {
			onSuccess : function(tagObj){
				//the media uploader handles showing a successful upload. however, if any additional actions are needed, add them here.
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
			
			showTicketManager : function($target)	{
				app.u.dump("BEGIN admin_support.a.showTicketManager");
				$target.css('min-height',300); //so showLoading has a little room.
				$target.showLoading({'message':'Fetching list of open tickets'});
				app.model.destroy('adminTicketList');
				app.ext.admin.calls.adminTicketList.init({'detail':'open'},{callback : function(rd){
					if(app.model.responseHasErrors(rd)){
						$target.anymessage({'message':rd});
						}
					else	{
						$target.anycontent({templateID:'supportPageTemplate','datapointer':rd.datapointer});
						app.u.handleAppEvents($target);
						$('.gridTable',$target).anytable();
						}
					}},'mutable');
				app.model.dispatchThis('mutable');
				
				},
			
			addSupportFileUploadToID : function(id,ticketid,uuid)	{
				var $target = $(app.u.jqSelector('#',id));
				$target.empty(); //clear any previous instantiations of the uploader. (in case of doubleclick)
				$target.append(app.renderFunctions.transmogrify({'ticketid':ticketid,'uuid':uuid},'supportFileUploadTemplate',{}));
				$('#supportFileUploadForTicket').append("<input type='hidden' name='domain' value='"+app.vars.domain+"' \/>"); //file upload wants domain specified.
				$('#supportFileUploadForTicket').append("<input type='hidden' name='ticketid' value='"+ticketid+"' \/>"); //file upload wants domain specified.
				$('#supportFileUploadForTicket').append("<input type='hidden' name='uuid' value='"+uuid+"' \/>"); //file upload wants domain specified.
				app.ext.admin_medialib.u.convertFormToJQFU('#supportFileUploadForTicket','adminTicketFileAttach');
				},
			
			showFileUploadInModal : function(ticketid,uuid){
				if((ticketid === 0 || ticketid) && uuid)	{
					var $target = $('#ticketFileUploadModal');
	//To avoid confusion (like showing uploads from a previously edited ticket) the file upload div is emptied and the entire contents regenerated afresh.
					if($target.length){$target.empty();}
					else	{
						$target = $("<div \/>").attr('id','ticketFileUploadModal').appendTo('body');
						$target.dialog({'autoOpen':false,'width':'90%','height':550});
						}
					$target.attr('data-ticketid',ticketid);
					$('.ui-dialog-title',$target.parent()).text("File upload for ticket "+ticketid);
					$target.append(app.renderFunctions.transmogrify({},'supportFileUploadTemplate',{'ticketid':ticketid,'uuid':uuid})).dialog('open');
					$('#supportFileUploadForTicket').append("<input type='hidden' name='domain' value='"+app.vars.domain+"' \/>"); //file upload wants domain specified.
					$('#supportFileUploadForTicket').append("<input type='hidden' name='ticketid' value='"+ticketid+"' \/>"); //file upload wants domain specified.
					$('#supportFileUploadForTicket').append("<input type='hidden' name='uuid' value='"+uuid+"' \/>"); //file upload wants domain specified.
					app.ext.admin_medialib.u.convertFormToJQFU('#supportFileUploadForTicket','adminTicketFileAttach');
					
					}
				else	{
					app.u.throwGMessage("Warning! Either ticketid ["+ticketid+"] or uuid ["+uuid+"] not specified in admin_support.a.showFileUploadInModal. Both are required.");
					}
				
				}
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
//adds a class to the row in list format to make high priority and waiting stand out a bit.
			ticketRowClass : function($tag, data)	{
				if(Number($tag.data('is_highpriority')) == 1)	{
					$tag.addClass('alert');
					}
				else if($tag.data('disposition') == 'WAITING')	{
					$tag.addClass('warning');
					}
				else	{}
				}
			
			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {

//gather some information about the browser/computer that submitted the ticket.
			gatherIntel : function()	{
				var r = "" //what is returned.
				r += "\n\n ##### The following information is for the admin interface and user computer, not necessarily what was used in the issue of the ticket\n";
				
				r += "MVC version: "+app.model.version;
				r += "\nMVC release: "+app.vars.release;
				r += "\ndevice id: "+app.vars.deviceid;
				r += "\nuser id: "+app.vars.userid;
				r += "\nlogged in to: "+app.vars.domain;
				r += "\nbrowser and OS: "+app.vars.passInDispatchV;
				r += "\n\nuserAgent: "+navigator.userAgent;
				r += "\nappVersion: "+navigator.appVersion;
				r += "\noscpu: "+navigator.oscpu;
				r += "\nscreen size: "+screen.width+" X "+screen.height;
				r += "\nbrowser size: "+$('body').width()+" X "+$('body').height();
				return r;
				},

			reloadTicketList : function($tbody,disposition,Q)	{
				app.u.dump("BEGIN admin_support.u.reloadTicketList");
				if($tbody && disposition)	{
					app.u.dump(" -> tbody and disposition ["+disposition+"] are both set.");
					app.u.dump(" -> Q: "+Q);
					$tbody.showLoading({'message':'Fetching updated ticket list.'});
					app.ext.admin.calls.adminTicketList.init({'detail':disposition},{callback : function(rd){
						$tbody.hideLoading();
						if(app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							$tbody.empty();
							$tbody.anycontent({'datapointer':rd.datapointer});
							app.u.handleAppEvents($tbody);
							}
						}},Q || 'mutable');
					}
				else	{
					$('#globalMessaging').anymessage({'message':"In admin_support.u.reloadTicketList, either tbody ["+typeof $tbody+"] or disposition ["+disposition+"] not defined.",'gMessage':true});
					}
				}
			
			}, //u


		e : {

			execTicketCreate : function($btn,vars)	{
				$btn.button({icons: {primary: "ui-icon-circle-arrow-e"}});
//					app.u.dump("-> vars: "); app.u.dump(vars)
				$btn.off('click.showTicketCreate').on('click.showTicketCreate',function(event){
					event.preventDefault();
					var $form = $btn.closest('form');
					
					if(app.u.validateForm($form))	{
						$form.showLoading({'message':'Creating a new ticket'});
						var sfo = $form.serializeJSON(),
						uuid = $btn.closest('.ui-dialog-content').data('uuid'),
						messageBody = sfo.description; //NOTE -> the user inputted message body should always be first. That way it's at the top of a high priority SMS/page.
						for(index in sfo)	{
							//only pass populated fields and don't pass description again (see above).
							if(sfo[index] && index != 'description'){messageBody += "\n"+index+": "+sfo[index]}
							}
						messageBody += app.ext.admin_support.u.gatherIntel();
						
						app.ext.admin.calls.adminTicketCreate.init({
							'body' : messageBody,
							'subject' : sfo.subject,
							'UUID' : uuid,
							'phone' : sfo.phone,
							'priority' : sfo.priority
							},{
							'callback' : function(rd){
								$form.hideLoading();
								if(app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									$form.empty().anymessage({'message':app.u.successMsgObject("Thank you, your ticket has been created.")});
									$("<button \/>").text('Close Window').button({icons: {primary: "ui-icon-circle-close"}}).on('click',function(event){event.preventDefault(); $(this).closest('ui-dialog-content').dialog('close')}).appendTo($form);
									
									if(app.data[rd.datapointer] && app.data[rd.datapointer].TICKETID)	{
										$("<button \/>").text('Add File(s) To Ticket').button({icons: {primary: "ui-icon-circle-plus"}}).on('click',function(event){
											event.preventDefault();
											app.ext.admin_support.a.showFileUploadInModal(app.data[rd.datapointer].TICKETID,app.data[rd.datapointer].UUID);
											}).appendTo($form);
										}

									}
								}	
							},'immutable');
//if a context is passed thru the app event, then the list of tickets is updated.
						if(vars && vars['$context'])	{
							app.u.dump(" -> context passed. reloading ticket list.");
							app.model.destroy('adminTicketList');
							app.ext.admin_support.u.reloadTicketList($("[data-app-role='dualModeListContents']",vars['$context']),$("[name='disposition']",vars['$context']).val(),'immutable');
							}
						app.model.dispatchThis('immutable');
						}
					else	{} //validation handles error display
					});
				},

			execTicketClose : function($btn)	{
				
				var ticketData = $btn.closest('tr').data();
				
				if(ticketData.closed_gmt != '' || ticketData.disposition == 'closed')	{
					//ticket is already closed. hide the button.
					$btn.hide();
					}
				else	{
				
					$btn.button({icons: {primary: "ui-icon-close"},text: false});
					$btn.off('click.execTicketClose').on('click.execTicketClose',function(event){
						event.preventDefault();
						
						var $tbody = $btn.closest("[data-app-role='dualModeList']").find("[data-app-role='dualModeListContents']"),
						ticketID = $btn.closest('tr').data('id');
						
						app.model.destroy('adminTicketList');
						app.ext.admin.calls.adminTicketMacro.init(ticketID,new Array('CLOSE'),{},'immutable');
						app.ext.admin_support.u.reloadTicketList($tbody,$btn.closest("[data-app-role='dualModeList']").find("[name='disposition']").val(),'immutable'); //handles showloading
						app.model.dispatchThis('immutable');
						});
					}
				}, //execTicketClose

			execTicketListDispositionChange : function($ele)	{
				$ele.off('change.execDispositionChange').on('change.execDispositionChange',function(){
					var $tbody = $ele.closest("[data-app-role='dualModeList']").find("[data-app-role='dualModeListContents']");
					app.model.destroy('adminTicketList');
					app.ext.admin_support.u.reloadTicketList($tbody,$ele.val(),'mutable');
					app.model.dispatchThis('mutable');
					});
				}, //execTicketListDispositionChange

			execTicketUpdate : function($btn)	{
				$btn.button();
				$btn.off('click.execTicketUpdate').on('click.execTicketUpdate',function(event){
					event.preventDefault();
					var $form = $btn.closest('form');
					$panelContents = $btn.closest('.ui-widget-content');
					
					if(app.u.validateForm($form))	{
						$panelContents.showLoading({'message':'Updateing ticket'});
						app.ext.admin.calls.adminTicketMacro.init($panelContents.data('ticketid'),['APPEND?note='+encodeURIComponent($("[name='note']",$form).val())],{'callback':function(rd){
							$panelContents.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$form.anymessage({'message':rd});
								}
							else	{
								$form.empty().anymessage({'message':app.u.successMsgObject('Ticket '+$panelContents.data('ticketid')+' has been updated')})
								}
							}},'immutable');
							app.model.dispatchThis('immutable');
						}
					else	{} //validateForm handles displaying errors.
					});
				}, //execTicketUpdate


			showFileAttachmentModal : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-circle-plus"}});
				$btn.off('click.showFileAttachmentModal').on('click.showFileAttachmentModal',function(event){
					event.preventDefault();
					var $panelContents = $(this).closest('.ui-widget-content');
					if($panelContents && $panelContents.data('ticketid') && $panelContents.data('uuid'))	{
						app.ext.admin_support.a.showFileUploadInModal($panelContents.data('ticketid'),$panelContents.data('uuid')); 
						}
					else if($panelContents)	{
						$btn.parent().anymessage({'message':"In admin_support.e.showFileAttachmentModal, unable to determine ticketid ["+$panelContents.data('ticketid')+"] and/or uuid ["+$panelContents.data('uuid')+"]",'gMessage':true});
						}
					else	{
						$btn.parent().anymessage({'message':"In admin_support.e.showFileAttachmentModal, unable to locate panelContents container",'gMessage':true});
						}
					});
				}, //showFileAttachmentModal

			showTicketLastUpdate : function($ele)	{
				if($ele.text().charAt(0) == '0')	{} //value will be 00:00: etc if no update has occured.
				else	{
					$ele.off('click.showTicketLastUpdate').on('click.showTicketLastUpdate',function(){
						var $tr = $ele.closest('tr'),
						ticketID = $tr.data('id');
						
						$ele.addClass('lookLikeLink');
						$tr.closest('tbody').showLoading({'message':'Retrieving last message for ticket '+ticketID});
						app.ext.admin.calls.adminTicketDetail.init(ticketID,{'callback':function(rd){
							$tr.closest('tbody').hideLoading();
							if(app.model.responseHasErrors(rd)){
								$('#globalMessaging').anymessage({'message':rd});
								}
							else	{
								$ele.off('click.showTicketLastUpdate').removeClass('lookLikeLink');
								if(app.data[rd.datapointer] && app.data[rd.datapointer]['@FOLLOWUPS'] && app.data[rd.datapointer]['@FOLLOWUPS'].length)	{
									$tr.after("<tr class='hideInMinimalMode'><td class='alignRight'><span class='ui-icon ui-icon-arrowreturnthick-1-e'><\/span><\/td><td colspan='7'><pre class='preformatted'>"+app.data[rd.datapointer]['@FOLLOWUPS'][(app.data[rd.datapointer]['@FOLLOWUPS'].length - 1)].txt+"<\/pre><\/td><\/tr>"); //responses are in chronological order, so zero is always the first post.
									}
								else	{} //no followups. "shouldn't" get here cuz link won't appear if there an update hasn't occured.
								}
							}},'mutable');
						app.model.dispatchThis('mutable');
						});
					}
				}, //showTicketLastUpdate

			showTicketCreate : function($btn)	{
				$btn.button();
				$btn.off('click.showTicketCreate').on('click.showTicketCreate',function(event){
					event.preventDefault();
					var $target = $("<div \/>",{'title':'Create a new support ticket'}).data('uuid',app.u.guidGenerator()).appendTo('body');
					$target.anycontent({data:{},'templateID':'supportTicketCreateTemplate'});
					$target.dialog({'width':'75%','height':500});
					app.u.handleAppEvents($target,{'$context':$btn.closest("[data-app-role='dualModeList']")});
					});
				}, //showTicketCreate

			showTicketDetail : function($btn)	{

				$btn.button({icons: {primary: "ui-icon-pencil"},text: false}); //ui-icon-pencil
				$btn.off('click.showTicketDetail').on('click.showTicketDetail',function(event){
					event.preventDefault();
//					app.u.dump("BEGIN admin_user.e.bossUserUpdate click event");

					var $target = $btn.closest("[data-app-role='dualModeContainer']").find("[data-app-role='dualModeDetail']").first(),
					$tr = $btn.closest('tr'),
					ticketID = $tr.data('id'),
					uuid = $tr.data('uuid');

//					app.u.dump(" -> user object["+index+"]: "); app.u.dump(user);
					if(ticketID && uuid)	{
					//see bossUserCreateUpdateSave app event to see what usermode is used for.

						var panelID = app.u.jqSelector('','ticketDetail_'+ticketID),
						$panel = $("<div\/>").data({'ticketid':ticketID, 'uuid':uuid}).hide().anypanel({
							'header':'Ticket: '+ticketID,
							'templateID':'supportTicketDetailTemplate',
						//	'data':user, //data not passed because it needs req and manipulation prior to translation.
							'dataAttribs': {'id':panelID,'ticketid':ticketID,'uuid':uuid}
							}).prependTo($target);
						
						app.ext.admin.u.toggleDualMode($btn.closest("[data-app-role='dualModeContainer']"),'detail');
						
						app.ext.admin.calls.adminTicketDetail.init(ticketID,{
							'callback':function(rd){
								if(app.model.responseHasErrors(rd)){
									app.u.throwMessage(rd);
									}
								else	{		
									$panel.anycontent({'datapointer':rd.datapointer});
									app.u.handleAppEvents($panel);
									}
								}
							},'mutable')
							$panel.slideDown('fast',function(){$panel.showLoading({'message':'Gathering nuts, berries and user details.'});});
							app.model.dispatchThis('mutable');


						}
					else	{
						$('#globalMessaging').anymessage({'message':"In admin_support.e.showTicketDetail, unable to determine ticketid ["+ticketid+"] and/or uuid ["+uuid+"]",'gMessage':true});
						}
//append detail children before changing modes. descreases 'popping'.
					app.ext.admin.u.toggleDualMode($('#userManagerContent'),'detail');

					});

				}, //showTicketDetail

			showTopicInputs : function($select)	{
				app.u.dump(" -> event showTopicInputs has been added.");
				$select.off('change.showTopicInputs').on('change.showTopicInputs',function(event){
					event.preventDefault();
					var $form = $select.closest('form');
					$('fieldset.topicInputs',$form).hide(); //hide all the other topic input fields.
					$("fieldset[data-app-role='"+$select.val()+"_inputs']",$form).show();
					});
				
				}, //showTopicInputs

			tagAsPriority : function($ele)	{

				$ele.off('change.tagAsPriorityHigh').on('change.tagAsPriorityHigh',function(){
					var $phoneFieldset = $ele.closest('form').find("[data-app-role='phoneFieldset']");
					
					app.u.dump(" -> got into change code");

					if($ele.val() == 'HIGH')	{
						$phoneFieldset.show();
						}
					else	{
						$phoneFieldset.hide();
						}
					});
				} //tagAsPriority
			
			}

		} //r object.
	return r;
	}