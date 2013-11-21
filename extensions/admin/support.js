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


var admin_support = function() {
	var theseTemplates = new Array('supportFileUploadTemplate','supportManagerControls','supportTicketRowTemplate','supportTicketCreateTemplate','supportTicketDetailTemplate','supportTicketFollowupTemplate','helpPageTemplate','helpDocumentTemplate','helpSearchResultsTemplate');
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
//				app.u.dump("BEGIN admin_support.a.showTicketManager");
				var $DMI = app.ext.admin.i.DMICreate($target,{
					'header' : 'Ticket Manager',
					'className' : 'adminTicketList', //applies a class on the DMI, which allows for css overriding for specific use cases.
					'thead' : ['Status','Ticket #','Opened','Last Update','Subject','User','Date Closed',''], //leave blank at end if last row is buttons.
					'tbodyDatabind' : "var: tickets(@TICKETS); format:processList; loadsTemplate:supportTicketRowTemplate;",
					'buttons' : ["<button data-app-event='admin|refreshDMI'>Refresh<\/button><button data-app-click='admin_support|adminTicketCreateShow' class='applyButton hideInDetailMode' data-text='true' data-icon-primary='ui-icon-circle-plus'>Create A New Ticket</button>"],	
					'controls' : app.templates.supportManagerControls,
					'cmdVars' : {
						'_cmd' : 'adminTicketList',
						'disposition' : 'open',
						'limit' : '50', //not supported for every call yet.
						'_tag' : {
							'datapointer':'adminTicketList'
							}
						}
					});
				app.u.handleButtons($target);
				$DMI.closest("[data-app-role='dualModeContainer']").anydelegate();
				app.model.dispatchThis('mutable');
				},



			showPlatformInfo : function()	{
				//if the current release has a video, give it a special pointer so that it can be loaded inline.
				
				var $D = app.ext.admin.i.dialogCreate({
					'title':'Platform Information',
					'templateID':'platformInfoTemplate',
					'data' : app.ext.admin.vars.versionData
					}).addClass('objectInspector');
				$D.attr('id','platformInformation');
//populate the video section w/ the current release data.
				$("[data-app-role='platformInfoVideoContainer']").anycontent({
					data : app.ext.admin.vars.versionData[0]
					})
				
				var $platInfo = $("[data-app-role='platformInfoContainer']",$D);
				$platInfo.showLoading({'message':'Fetching platform data'});
				app.model.addDispatchToQ({'_cmd':'platformInfo','_tag':	{'datapointer' : 'info','callback':function(rd){
					$platInfo.hideLoading();
					if(app.model.responseHasErrors(rd)){
						$D.anymessage({'message':rd});
						}
					else	{
						//add platform info to the top of the section.
						$("[data-app-role='platformInfoDetailsContainer']",$platInfo).prepend(app.ext.admin_tools.u.objExplore($.extend({},app.u.getBlacklistedObject(app.data[rd.datapointer],['ts','_uuid','_rtag','_rcmd']),{'app release':app.vars.release}))).prepend("<h3>Platform Information<\/h3>");
						
						}
					}}},'mutable');
				app.model.dispatchThis('mutable');
				$D.dialog('option','modal',false);
				$D.anydelegate();
				$D.dialog('open');
				},

			showHelpInterfaceInDialog : function()	{
				var $container = $('#helpDialog');
				if($container.length)	{
					$container.dialog('open'); //do nothing but open, as the help dialog has been opened before. this will show last search.
					}
				else	{
					$container = $("<div \/>",{'id':'helpDialog','title':'Webdoc'}).appendTo('body');
					$container.dialog({'width':'90%','height':($(window).height() - 100)});
					this.showHelpInterface($container);
					}
				},

//will open help interface within $target.
			showHelpInterface : function($target){
				if($("[data-app-role='dualModeContainer']",$target).length)	{
					$target.show();
					} //already an instance of help open in this target. leave as is.
				else	{
					$target.anycontent({'templateID':'helpPageTemplate','showLoading':false}); //clear contents and add help interface
					app.ext.admin.u.handleAppEvents($target);
					$('.gridTable',$target).anytable();
					}
				},




//does everything. pass in a docid and this 'll handle the call, request and display.
//will check to see if a dom element already exists and , if so, just open that and make it flash. 
			showHelpDocInDialog : function(docid)	{
				if(docid)	{
					var targetID = 'helpfile_'+docid
					var $target = $(app.u.jqSelector('#',targetID));
//already on the dom. just open it.
					if($target.length)	{
						$target.dialog('open')
						$target.effect("highlight", {}, 1500);
						}
					else	{
						$target = $("<div \/>",{'id':targetID,'title':'help doc: '+docid}).attr('docid',docid).addClass('helpDoc').appendTo('body');
						$target.dialog({width:500, height:500});
						$target.showLoading({'message':'Fetching help documentation...'});

						app.ext.admin.calls.helpDocumentGet.init(docid,{'callback':function(rd){
							app.u.dump(" -> RD: "); app.u.dump(rd);
							$target.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$target.anymessage({'message':rd});
								}
							else	{
								$target.anycontent({'templateID':'helpDocumentTemplate','datapointer':rd.datapointer});
								app.u.handleAppEvents($target);
								app.ext.admin_support.u.handleHelpDocOverwrites($target);
								}
							}},'mutable');
						app.model.dispatchThis('mutable');
						}
					}
				else	{
					app.u.throwMessage("In admin.u.showHelpInModal, no docid specified.");
					}
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
						$target.dialog({'autoOpen':false,'width':'90%','height':550,'modal':true});
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
				else if($tag.data('disposition') == 'waiting')	{
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
				r += "\ndomain: "+location.domain;
				r += "\nbrowser and OS: "+app.vars.passInDispatchV;
				r += "\n\nuserAgent: "+navigator.userAgent;
				r += "\nappVersion: "+navigator.appVersion;
				r += "\noscpu: "+navigator.oscpu;
				r += "\nscreen size: "+screen.width+" X "+screen.height;
				r += "\nbrowser size: "+$('body').width()+" X "+$('body').height();
				
				var info = app.u.getBlacklistedObject(app.data.info,['server-time','ts','_uuid','_rtag','_rcmd']);
				for(var index in info)	{r+= index+": "+info[index]}
				
				return r;
				},

//overwrite the linkdoc links.  In the future, this will probably do more.
			handleHelpDocOverwrites : function($target)	{
				app.u.dump("BEGIN admin_support.u.handleHelpDocOverwrites");
				app.u.dump("$('.linkdoc',$target).length: "+$('.linkdoc',$target).length);
				//syllabus_product_basics -> good place to test linkdoc
				// !!! link this to a search, not an individual docs.  build in support for passing keywords in showUI obj var. set as val of keywords in put and submit form.
				$('.linkdoc',$target).each(function(){
					var $a = $(this),
					docID = $a.attr('href').split('=')[1];
					$a.on('click',function(event){
						event.preventDefault();
						app.u.dump(" -> Click got registered.");
						app.ext.admin_support.a.showHelpDocInDialog(docID);
						});
					});
				},


//is a separate function because it's called by both the ticket DMI and the media library.
			loadTicketContent : function($context,ticketID,uuid,q)	{
				
				if($context instanceof jQuery)	{
					if(ticketID && uuid)	{
	
						$context.showLoading({'message':'Fetching ticket details'}).data({'ticketid':ticketID, 'uuid':uuid});

//Clear the follows and attachment lists, but not the rest of the panel.  That way, anything in the message input is preserved.
						$("[data-app-role='ticketAttatchmentList']",$context).empty();
						$("[data-app-role='ticketFollowupList']",$context).empty();
						
						app.model.addDispatchToQ({'_cmd':'adminTicketFileList','ticketid':ticketID,'_tag':	{'datapointer' : 'adminTicketFileList|'+ticketID}},'mutable');
						app.model.addDispatchToQ({
							'_cmd':'adminTicketDetail',
							'ticketid':ticketID,
							'_tag':	{
								'datapointer' : 'adminTicketDetail|'+ticketID,
								'callback': 'anycontent',
								'translateOnly' : true,
								'jqObj' : $context,
								'extendByDatapointers' : ['adminTicketFileList|'+ticketID]
								}
							},q);
						}
					else	{
						$context.anymessage({"message":"In admin_support.e.adminTicketDetailShow, unable to ascertain ticketID ["+ticketID+"] and/or UUID ["+uuid+"], both of which are required.","gMessage":true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_support.e.adminTicketDetailShow, $context in not a valid jquery instance.","gMessage":true});
					}

				},

			
			}, //u


		e : {

			platformInfoWatchVideo : function($ele,p)	{
				var data = $ele.closest("[data-youtubevideoid]").data();
				if(data.youtubevideoid)	{
					$ele.closest("[data-app-role='platformInfoContainer']").find("[data-app-role='platformInfoVideoContainer']").empty().anycontent({
						data : data,
						translateOnly: true
						});
					}
				else	{
					$ele.closest("[data-app-role='platformInfoContainer']").find("[data-app-role='platformInfoVideoContainer']").empty().show().anymessage({
						'message' : 'No video present for this release',
						'errtype' : 'warn',
						'showCloseButton' : false,
						'persistent' : true
						})
					}
				},
			
			platformInfoViewChangelog : function($ele,p)	{
				linkOffSite('https://raw.github.com/zoovy/AnyCommerce-Development/'+$ele.closest('tr').data('branch')+'/changelog.txt','',true)
				},

			adminTicketCreateShow : function($ele,p)	{
				var $D = app.ext.admin.i.dialogCreate({
					'title' : 'Create a New Ticket',
					'templateID' : 'supportTicketCreateTemplate',
					'data' : {
						'domain' : 'http://'+app.vars.domain
						},
					});
				
				$('form',$D).append("<input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
				$D.dialog('open');
				$D.data({'ticketid':'0','uuid':app.u.guidGenerator()}); //necessary for file attachment.
				$D.anydelegate();
				app.u.handleButtons($D);
				},

			adminTicketCreateExec : function($ele,p)	{
				var $form = $ele.closest('form');
				if(app.u.validateForm($form))	{
					$form.showLoading({'message':'Creating a new ticket'});
					var sfo = $form.serializeJSON();
					$form.append("<input type='hidden' name='UUID' value='"+$ele.closest('.ui-dialog-content').data('uuid')+"' \/>");

					var messagebody = sfo.description+"\n"; //NOTE -> the user inputted message body should always be first. That way it's at the top of a high priority SMS/page.

					for(var index in sfo)	{
						//only pass populated fields and don't pass description again (see above).
						if(sfo[index] && index != 'description' && index.indexOf('_tag') < 0){messagebody += "\n"+index+": "+sfo[index]}
						}
					messagebody += app.ext.admin_support.u.gatherIntel();
// ** 201346 -> w/ a hidden input, if an apostrophe is in messagebody, everything after it gets dropped.
//					$form.append("<input type='hidden' name='body' value='"+messagebody+"' \/>");
					$form.append($("<textarea \/>").attr('name','body').val(messagebody).hide());
					app.ext.admin.a.processForm($form,'immutable');
					app.model.dispatchThis('immutable');

					}
				else	{} //validation handles error display				
				},
			
			
			//this event is used both in create and edit.
			fileAttach2TicketShow : function($ele,p)	{
				p.preventDefault();
				var $panelContents = $ele.closest('.ui-widget-anypanel'); //in create, the dialog body get this same class, so the selector works in both places.
				if($panelContents instanceof jQuery && $panelContents.length && $panelContents.data('ticketid') && $panelContents.data('uuid'))	{
					app.ext.admin_support.a.showFileUploadInModal($panelContents.data('ticketid'),$panelContents.data('uuid')); 
					}
				else if($panelContents)	{
					$ele.parent().anymessage({'message':"In admin_support.e.showFileAttachmentModal, unable to determine ticketid ["+$panelContents.data('ticketid')+"] and/or uuid ["+$panelContents.data('uuid')+"]",'gMessage':true});
					}
				else	{
					$ele.parent().anymessage({'message':"In admin_support.e.showFileAttachmentModal, unable to locate panelContents container",'gMessage':true});
					}
				}, //showFileAttachmentModal
				
			adminTicketMacroCloseShow : function($ele,p){
				var ticketID = $ele.closest("[data-id]").data('id');
				p.preventDefault();
				var $D = app.ext.admin.i.dialogConfirmRemove({
					'message':'Are you sure you want to close this ticket?',
					'removeButtonText' : 'Close Ticket',
					'removeFunction':function(rd){
						app.ext.admin.calls.adminTicketMacro.init(ticketID,new Array('CLOSE'),{},'immutable');
						app.model.dispatchThis('immutable');
						$ele.closest("[data-app-role='dualModeContainer']").find("button[data-app-event='admin|refreshDMI']:first").trigger('click');
						$D.dialog('close');
						}
					});
				},

			adminTicketMacroUpdateExec : function($ele,p)	{
				p.preventDefault();
				var
					$form = $ele.closest('form'),
					$panel = $ele.closest('.ui-widget-anypanel');
				
				if(app.u.validateForm($form))	{
					$panel.showLoading({'message':'Updating ticket'});
					app.ext.admin.calls.adminTicketMacro.init($panel.data('ticketid'),['APPEND?note='+encodeURIComponent($("[name='note']",$form).val())],{'callback':function(rd){
						$panel.hideLoading();
						if(app.model.responseHasErrors(rd)){
							$form.anymessage({'message':rd});
							}
						else	{
							$form.anymessage({'message':app.u.successMsgObject('Ticket '+$panel.data('ticketid')+' has been updated')});
							$("textarea",$form).val(''); //clear the values from the text areas.
							}
						}},'immutable');
					//refresh the ticket.
					app.ext.admin_support.u.loadTicketContent($panel,$panel.data('ticketid'),$panel.data('uuid'),'immutable');
					app.model.dispatchThis('immutable');
					}
				else	{} //validateForm handles displaying errors.
				
				},

//executed when the download button for a file is clicked.
			adminTicketFileGetExec : function($ele,p)	{
				p.preventDefault();
				var ticketID = $ele.closest(".ui-widget-anypanel").data('ticketid');
				$ele.button('disable');
				if(ticketID)	{
					$(document.body).showLoading({'message':'Fetching file contents'});
					app.model.addDispatchToQ({
						'_cmd':'adminTicketFileGet',
						'ticketid' : ticketID,
						'remote' : $ele.closest('tr').data('remote'),
						'base64' : 1,
						'_tag':	{
							'callback':'fileDownloadInModal',
							'datapointer':'adminTicketFileGet',
							'jqObj' : $(document.body), //used for hideLoading
							'button' : $ele //used to re-enable the download button
							}
						},'mutable');
					app.model.dispatchThis('mutable');
					}
				else	{
					$ele.parent().anymessage({"message":'In admin_support.e.admiNTicketFileGetExec, unable to ascertain ticket ID.','gMessage':true});
					}
				},

			adminTicketLastUpdateShow : function($ele,p)	{

var
	$tr = $ele.closest('tr'),
	ticketID = $tr.data('id');

$tr.closest('tbody').showLoading({'message':'Retrieving last message for ticket '+ticketID});
app.model.addDispatchToQ({
	'_cmd':'adminTicketDetail',
	'ticketid':ticketID,
	'_tag':	{
		'datapointer' : 'adminTicketDetail|'+ticketID,
		'callback':function(rd){
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
			}
		}
	},'mutable');
app.model.dispatchThis('mutable');

				
				},

			adminTicketDetailShow : function($ele,p)	{

				var
					ticketID = $ele.closest("[data-id]").data('id'),
					uuid = $ele.closest("[data-id]").data('uuid');
				if(ticketID && uuid)	{

					$panel = app.ext.admin.i.DMIPanelOpen($ele,{
						'templateID' : 'supportTicketDetailTemplate',
						'panelID' : 'ticket_'+ticketID,
						'header' : 'Edit Ticket: '+ticketID
						});

					app.ext.admin_support.u.loadTicketContent($panel,ticketID,uuid,'mutable');
					app.model.dispatchThis('mutable');

					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_support.e.adminTicketDetailShow, unable to ascertain ticketID ["+ticketID+"] and/or UUID ["+uuid+"], both of which are required.","gMessage":true});
					}
				},


//used in the support utilites.
			ping : function($btn)	{
				$btn.button();
				$btn.off('click.ping').on('click.ping',function(){
					var start = new Date().getTime();
app.model.addDispatchToQ({
	'_cmd':'ping',
	'_tag':	{
		'callback':function(rd){
if(app.model.responseHasErrors(rd)){
	$('#platformInformation').anymessage({'message':rd});
	}
else	{
	var end = new Date().getTime();
	alert("Pong! took "+(end - start) / 1000+" seconds")
	}
			}
		}
	},'mutable');
app.model.dispatchThis('mutable');
					});
				},




/***************			WEBDOC 			******************/



			execHelpDetailEdit : function($btn)	{
				$btn.button();
				$btn.off('click.execHelpDetailEdit').on('click.execHelpDetailEdit',function(){
					var docID = $btn.closest("[data-docid]").data('docid');
					if(docID)	{
						window.open('https://github.com/zoovy/documentation/blob/master/'+docID+'.html');
						}
					else	{
						$btn.parent().after().anymessage({'message':'In admin_support.e.execHelpDetailHistory, unable to determine docid','gMessage':true});
						}
					});
				}, //execHelpDetailEdit
				
			execHelpDetailHistory : function($btn)	{
				$btn.button();
				$btn.off('click.execHelpDetailHistory').on('click.execHelpDetailHistory',function(){
					var docID = $btn.closest("[data-docid]").data('docid');
					if(docID)	{
						window.open('https://github.com/zoovy/documentation/commits/master/'+docID+'.html');
						}
					else	{
						$btn.parent().after().anymessage({'message':'In admin_support.e.execHelpDetailHistory, unable to determine docid','gMessage':true});
						}
					});
				}, //execHelpDetailHistory

			execHelpSearch : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-search"},text: false});
				$btn.off('click.helpSearch').on('click.helpSearch',function(event){
					
					var $parent = $btn.closest("[data-app-role='dualModeContainer']"),
					$form = $("[data-app-role='helpSearch']",$parent).first(),
					keywords = $("[name='keywords']",$parent).val();

//					app.u.dump(" -> $parent.length: "+$parent.length);
//					app.u.dump(" -> $form.length: "+$form.length);
//					app.u.dump(" -> formObj: "); app.u.dump(formObj);
//					app.u.dump(" -> keywords: "+keywords);

					if(keywords)	{
						$('.dualModeListMessaging',$parent).first().empty().hide();
						var $contentArea = $('.gridTable',$parent).first();
						$contentArea.show().find('tbody').empty(); //empty any previous search results.
						$contentArea.showLoading({"message":"Searching for help files"});
						app.ext.admin.calls.helpSearch.init(keywords,{'callback':'anycontent','jqObj':$contentArea},'mutable');
						app.model.dispatchThis('mutable');
						}
					else	{
						$('.dualModeListMessaging',$parent).first().empty().show().anymessage({'message':'Please enter some keywords into the form input above to search for.'});
						$("[data-app-role='dualModeListContents']",$parent).first().hide();
						}
					event.preventDefault();
					});
				}, //execHelpSearch



//uses new delegated events model.
			showHelpDocInDialog : function($ele,p)	{
				var docID = $ele.data('docid');
				if(docID)	{
					app.ext.admin_support.a.showHelpDocInDialog(docID);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_support.e.showHelpDetailInDialog, unable to determine docID.','gMessage':true});
					}
				},


//used on a button in the search interface. allows merchant to open the doc in a dialog, for portability.
//button should be hidden when webdoc itself opened in dialog.
			showHelpDetailInDialog : function($ele)	{
				if($ele.is('button'))	{$ele.button({icons: {primary: "ui-icon-newwin"}});}
				$ele.off('click.showHelpDetailInDialog').on('click.showHelpDetailInDialog',function(event){
					event.preventDefault();
					var docID = $ele.closest('tr').data('docid');
					if(docID)	{
						app.ext.admin_support.a.showHelpDocInDialog(docID);
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_support.e.showHelpDetailInDialog, unable to determine docID.','gMessage':true});
						}
					});
				}, //showHelpDetailInDialog

//in this case, the event may be applied to a btn OR some text.
			showHelpDetail : function($ele)	{
				
				if($ele.is('button'))	{$ele.button({icons: {primary: "ui-icon-circle-arrow-e"}});}
				$ele.off('click.showHelpDetail').on('click.showHelpDetail',function(event){
					event.preventDefault();
					var docID = $ele.closest('tr').data('docid');
					if(docID)	{

var $dualModeDetail = $ele.closest("[data-app-role='dualModeContainer']").find("[data-app-role='dualModeDetail']").first(),
panelID = app.u.jqSelector('','helpDetail_'+docID),
$panel = $("<div\/>").data('docid',docID).hide().anypanel({
	'header':'Help file: '+docID,
	'templateID':'helpDocumentTemplate',
	'dataAttribs': {'id':panelID,'docid':docID}
	}).prependTo($dualModeDetail);

app.ext.admin.u.toggleDualMode($dualModeDetail.closest("[data-app-role='dualModeContainer']"),'detail');

app.ext.admin.calls.helpDocumentGet.init(docID,{
	'callback':function(rd){
		if(app.model.responseHasErrors(rd)){
			app.u.throwMessage(rd);
			}
		else	{
			$panel.anycontent({'datapointer':rd.datapointer});
			app.u.handleAppEvents($panel);
			app.ext.admin_support.u.handleHelpDocOverwrites($panel);
			}
		}
	},'mutable');

$panel.slideDown('fast',function(){$panel.showLoading({'message':'Fetching Help Document.'});});
app.model.dispatchThis('mutable');


						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_support.e.showHelpDetail, unable to determine docID.','gMessage':true});
						}
					});
				
				}





/*
not needed in support 2
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
*/			
			}

		} //r object.
	return r;
	}