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


var admin_support = function(_app) {
	var theseTemplates = new Array('supportFileUploadTemplate','supportManagerControls','supportTicketRowTemplate','supportTicketCreateTemplate','supportTicketDetailTemplate','supportTicketFollowupTemplate','helpDocumentTemplate','helpSearchResultsTemplate');
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
				_app.model.addDispatchToQ(obj,'immutable');	
				}
			} //adminNavcatProductDelete
		
		}, //calls




////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				// _app.model.fetchNLoadTemplates(_app.vars.baseURL+'extensions/admin/support.html',theseTemplates);

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				_app.u.dump('BEGIN admin_orders.callbacks.init.onError');
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
			
			showTicketManager : function($target,P)	{
//				_app.u.dump("BEGIN admin_support.a.showTicketManager");
				$target.intervaledEmpty();
				_app.ext.admin_support.a.showHelpInterface($target,P);
				
				$target.append("<div class='clearfix'></div>");
				
				var $DMI = _app.ext.admin.i.DMICreate($target,{
					'header' : 'Ticket Manager',
					'className' : 'adminTicketList', //applies a class on the DMI, which allows for css overriding for specific use cases.
					'thead' : ['Status','Ticket #','Opened','Last Update','Subject','User','Date Closed',''], //leave blank at end if last row is buttons.
					'tbodyDatabind' : "var: tickets(@TICKETS); format:processList; loadsTemplate:supportTicketRowTemplate;",
					"handleAppEvents" : false,
					'buttons' : [
						"<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh<\/button>",
						"<button data-app-click='admin_support|adminTicketCreateShow' class='applyButton hideInDetailMode' data-text='true' data-icon-primary='ui-icon-circle-plus'>Create A New Ticket</button>"],	
					'controls' : _app.templates.supportManagerControls,
					'cmdVars' : {
						'_cmd' : 'adminTicketList',
						'disposition' : 'open',
						'limit' : '50', //not supported for every call yet.
						'_tag' : {
							'datapointer':'adminTicketList'
							}
						}
					});
				_app.u.handleButtons($target.anyform());
				_app.model.dispatchThis('mutable');
				},

			showPlatformInfo : function()	{
				//if the current release has a video, give it a special pointer so that it can be loaded inline.
				
				var $D = _app.ext.admin.i.dialogCreate({
					'title':'Platform Information',
					'templateID':'platformInfoTemplate',
					'data' : _app.ext.admin.vars.versionData
					}).addClass('objectInspector');
				$D.attr('id','platformInformation');
//populate the video section w/ the current release data.
				$("[data-app-role='platformInfoVideoContainer']").anycontent({
					data : _app.ext.admin.vars.versionData[0]
					})
				
				var $platInfo = $("[data-app-role='platformInfoContainer']",$D);
				$platInfo.showLoading({'message':'Fetching platform data'});
				_app.model.addDispatchToQ({'_cmd':'platformInfo','_tag':	{'datapointer' : 'info','callback':function(rd){
					$platInfo.hideLoading();
					if(_app.model.responseHasErrors(rd)){
						$D.anymessage({'message':rd});
						}
					else	{
						//add platform info to the top of the section.
						$("[data-app-role='platformInfoDetailsContainer']",$platInfo).prepend(_app.ext.admin_tools.u.objExplore($.extend({},_app.u.getBlacklistedObject(_app.data[rd.datapointer],['ts','_uuid','_rtag','_rcmd']),{'app release':_app.vars.release}))).prepend("<h3>Platform Information<\/h3>");
						
						}
					}}},'mutable');
				_app.model.dispatchThis('mutable');
				$D.dialog('option','modal',false);
				$D.anyform();
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
// ### FUTURE -> vars.title support started but not finished/tested. add support for vars.title to be passed in and have a search performed.
			showHelpInterface : function($target,vars){
				vars = vars || {};
				
				var $DMI = _app.ext.admin.i.DMICreate($target,{
					'header' : 'Search our Online Documentation', //left off because the interface is in a tab.
					'className' : 'helpDocumentation',
					'buttons' : [],
					'controls' : "<form class='searchBar' data-app-submit='admin_support|execHelpSearch' data-app-role='helpSearch'><input type='text' name='srsearch' value='"+( vars.title ? vars.title : '' )+"' class='hideInDetailMode'  /><button class='hideInDetailMode applyButton' data-text='false' data-icon-primary='ui-icon-search'>Search</button></form>",
					'thead' : ['title','Snippet',''],
					'tbodyDatabind' : "var: users(query.search); format:processList; loadsTemplate:helpSearchResultsTemplate;",
					'skipInitialDispatch' : true,
					'showLoading' : false,
					'cmdVars' : {
						'_cmd' : 'helpSearch',
						'_tag' : {'datapointer' : 'adminConfigDetail|prts'}
						}
					});
				_app.u.handleButtons($target.anyform());
				if(vars.title)	{
					$('form:first',$DMI).trigger('submit');
					}
				},

//does everything. pass in a docid and this 'll handle the call, request and display.
//will check to see if a dom element already exists and , if so, just open that and make it flash. 
			showHelpDocInDialog : function(title)	{
				if(title)	{
					var $D = _app.ext.admin.i.dialogCreate({
						title : title,
						'templateID' : 'helpDocumentTemplate',
						'showLoading' : false,
						anycontent : true, //the dialogCreate params are passed into anycontent
						handleAppEvents : false //defaults to true
						});
					$D.dialog('option','modal',false);
					$D.prepend("<div class='hint alignRight marginBottom'>you can resize this window (drag a corner) or move it (drag the title bar).</div>");
					$D.dialog('open');
					_app.ext.admin_support.u.loadHelpDocInto($D,title);
					}
				else	{
					_app.u.throwMessage("In admin.u.showHelpInModal, no docid specified.");
					}
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
					$target.append(_app.renderFunctions.transmogrify({},'supportFileUploadTemplate',{'ticketid':ticketid,'uuid':uuid})).dialog('open');
					$('form[name=supportFileUploadForTicket]').append("<input type='hidden' name='domain' value='"+_app.vars.domain+"' \/>"); //file upload wants domain specified.
					$('form[name=supportFileUploadForTicket]').append("<input type='hidden' name='ticketid' value='"+ticketid+"' \/>"); //file upload wants domain specified.
					$('form[name=supportFileUploadForTicket]').append("<input type='hidden' name='uuid' value='"+uuid+"' \/>"); //file upload wants domain specified.
					_app.ext.admin_medialib.u.convertFormToJQFU($('form[name=supportFileUploadForTicket]'),'adminTicketFileAttach');
					
					}
				else	{
					_app.u.throwGMessage("Warning! Either ticketid ["+ticketid+"] or uuid ["+uuid+"] not specified in admin_support.a.showFileUploadInModal. Both are required.");
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
				r += "MVC version: "+_app.model.version;
				r += "\nMVC release: "+_app.vars.release;
				r += "\ndevice id: "+_app.vars.deviceid;
				r += "\nuser id: "+_app.vars.userid;
				r += "\nlogged in to: "+_app.vars.domain;
				r += "\ndomain: "+location.domain;
				r += "\nbrowser and OS: "+_app.vars.passInDispatchV;
				r += "\n\nuserAgent: "+navigator.userAgent;
				r += "\nappVersion: "+navigator.appVersion;
				r += "\noscpu: "+navigator.oscpu;
				r += "\nscreen size: "+screen.width+" X "+screen.height;
				r += "\nbrowser size: "+$('body').width()+" X "+$('body').height();
				
				var info = _app.u.getBlacklistedObject(_app.data.info,['server-time','ts','_uuid','_rtag','_rcmd']);
				for(var index in info)	{r+= index+": "+info[index]}
				
				return r;
				},

//overwrite the linkdoc links.  In the future, this will probably do more.
			handleHelpDocOverwrites : function($target)	{
				_app.u.dump("BEGIN admin_support.u.handleHelpDocOverwrites");
				_app.u.dump("$('.linkdoc',$target).length: "+$('.linkdoc',$target).length);
				//syllabus_product_basics -> good place to test linkdoc
				// !!! link this to a search, not an individual docs.  build in support for passing keywords in navigateTo obj var. set as val of keywords in put and submit form.
				$('.linkdoc',$target).each(function(){
					var $a = $(this),
					docID = $a.attr('href').split('=')[1];
					$a.on('click',function(event){
						event.preventDefault();
						_app.u.dump(" -> Click got registered.");
						_app.ext.admin_support.a.showHelpDocInDialog(docID);
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
						
						_app.model.addDispatchToQ({'_cmd':'adminTicketFileList','ticketid':ticketID,'_tag':	{'datapointer' : 'adminTicketFileList|'+ticketID}},'mutable');
						_app.model.addDispatchToQ({
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
						
//						$("[data-app-role='supportFileUploadContainer']",$context).anyupload({'filesChange' : function(files,ui)	{
//							_app.u.dump(" >>>>>>>");
//							}});
						
						}
					else	{
						$context.anymessage({"message":"In admin_support.e.adminTicketDetailShow, unable to ascertain ticketID ["+ticketID+"] and/or UUID ["+uuid+"], both of which are required.","gMessage":true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_support.e.adminTicketDetailShow, $context in not a valid jquery instance.","gMessage":true});
					}

				},

			loadHelpDocInto : function($target,title)	{
				if($target instanceof jQuery && title)	{
					$target.showLoading({"message":"Fetching help doc "+title});
					_app.model.addDispatchToQ({"_cmd":"helpWiki","format":"json","action":"parse","page":title,"_tag":{"datapointer":"helpWikiSearch",'callback':'anycontent','jqObj':$target}},"mutable");
					_app.model.dispatchThis('mutable');
					}
				else if($target instanceof jQuery)	{
					$target.anymessage({"message":"In admin_support.u.loadHelpDocInto, no title specified.","gMessage":true})
					}
				else	{
					$("#globalMessaging").anymessage({"message":"In admin_support.u.loadHelpDocInto, $target is not a valid jQuery instance.","gMessage":true});
					}
//action='parse','page':'title'				
				
				}
			
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
				var $D = _app.ext.admin.i.dialogCreate({
					'title' : 'Create a New Ticket',
					'templateID' : 'supportTicketCreateTemplate',
					'data' : {
						'domain' : 'http://'+_app.vars.domain
						},
					});
				
				$('form',$D).append("<input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
				$D.dialog('open');
				$D.data({'ticketid':'0','uuid':_app.u.guidGenerator()}); //necessary for file attachment.
				$D.anyform();
				_app.u.handleButtons($D);
				},

			adminTicketCreateExec : function($ele,p)	{
				var $form = $ele.closest('form');
				if(_app.u.validateForm($form))	{
					$form.showLoading({'message':'Creating a new ticket'});
					var sfo = $form.serializeJSON();
					$form.append("<input type='hidden' name='UUID' value='"+$ele.closest('.ui-dialog-content').data('uuid')+"' \/>");

					var messagebody = sfo.description+"\n"; //NOTE -> the user inputted message body should always be first. That way it's at the top of a high priority SMS/page.

					for(var index in sfo)	{
						//only pass populated fields and don't pass description again (see above).
						if(sfo[index] && index != 'description' && index.indexOf('_tag') < 0){messagebody += "\n"+index+": "+sfo[index]}
						}
					messagebody += _app.ext.admin_support.u.gatherIntel();
// ** 201346 -> w/ a hidden input, if an apostrophe is in messagebody, everything after it gets dropped.
//					$form.append("<input type='hidden' name='body' value='"+messagebody+"' \/>");
					$form.append($("<textarea \/>").attr('name','body').val(messagebody).hide());
					_app.ext.admin.a.processForm($form,'immutable');
					_app.model.dispatchThis('immutable');

					}
				else	{} //validation handles error display				
				},
			
			
			//this event is used both in create and edit.
			fileAttach2TicketShow : function($ele,p)	{
				p.preventDefault();
				var $panelContents = $ele.closest('.ui-widget-anypanel'); //in create, the dialog body get this same class, so the selector works in both places.
				if($panelContents instanceof jQuery && $panelContents.length && $panelContents.data('ticketid') && $panelContents.data('uuid'))	{
					_app.ext.admin_support.a.showFileUploadInModal($panelContents.data('ticketid'),$panelContents.data('uuid')); 
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
				var $D = _app.ext.admin.i.dialogConfirmRemove({
					'message':'Are you sure you want to close this ticket?',
					'removeButtonText' : 'Close Ticket',
					'removeFunction':function(rd){
						_app.model.addDispatchToQ({"_cmd":"adminTicketMacro","ticketid":ticketID,"@updates":['CLOSE'],"_tag":{"datapointer":"adminTicketMacro"}},"immutable");
						_app.model.dispatchThis('immutable');
						$ele.closest("[data-app-role='dualModeContainer']").find("button[data-app-click='admin|refreshDMI']:first").trigger('click');
						$D.dialog('close');
						}
					});
				},

			adminTicketMacroUpdateExec : function($ele,p)	{
				p.preventDefault();
				var
					$form = $ele.closest('form'),
					$panel = $ele.closest('.ui-widget-anypanel');
				
				if(_app.u.validateForm($form))	{
					$panel.showLoading({'message':'Updating ticket'});
					
					_app.model.addDispatchToQ({"_cmd":"adminTicketMacro","ticketid":$panel.data('ticketid'),"@updates":['APPEND?note='+encodeURIComponent($("[name='note']",$form).val())],"_tag":{
						"datapointer":"adminTicketMacro",
						"callback" : "showMessaging",
						"message" : 'Ticket '+$panel.data('ticketid')+' has been updated',
						"jqObj" : $form
						}},"immutable");
					//refresh the ticket.
					_app.ext.admin_support.u.loadTicketContent($panel,$panel.data('ticketid'),$panel.data('uuid'),'immutable');
					_app.model.dispatchThis('immutable');
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
					_app.model.addDispatchToQ({
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
					_app.model.dispatchThis('mutable');
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
				_app.model.addDispatchToQ({
					'_cmd':'adminTicketDetail',
					'ticketid':ticketID,
					'_tag':	{
						'datapointer' : 'adminTicketDetail|'+ticketID,
						'callback':function(rd){
							$tr.closest('tbody').hideLoading();
							if(_app.model.responseHasErrors(rd)){
								$('#globalMessaging').anymessage({'message':rd});
								}
							else	{
								$ele.off('click.showTicketLastUpdate').removeClass('lookLikeLink');
								if(_app.data[rd.datapointer] && _app.data[rd.datapointer]['@FOLLOWUPS'] && _app.data[rd.datapointer]['@FOLLOWUPS'].length)	{
									$tr.after("<tr class='hideInMinimalMode'><td class='alignRight'><span class='ui-icon ui-icon-arrowreturnthick-1-e'><\/span><\/td><td colspan='7'><pre class='preformatted'>"+_app.data[rd.datapointer]['@FOLLOWUPS'][(_app.data[rd.datapointer]['@FOLLOWUPS'].length - 1)].txt+"<\/pre><\/td><\/tr>"); //responses are in chronological order, so zero is always the first post.
									}
								else	{} //no followups. "shouldn't" get here cuz link won't appear if there an update hasn't occured.
								}
							}
						}
					},'mutable');
				_app.model.dispatchThis('mutable');
				},

			adminTicketDetailShow : function($ele,p)	{

				var
					ticketID = $ele.closest("[data-id]").data('id'),
					uuid = $ele.closest("[data-id]").data('uuid');
				if(ticketID && uuid)	{

					$panel = _app.ext.admin.i.DMIPanelOpen($ele,{
						'templateID' : 'supportTicketDetailTemplate',
						'panelID' : 'ticket_'+ticketID,
						'showLoading' : false,
						'header' : 'Edit Ticket: '+ticketID
						});

					_app.ext.admin_support.u.loadTicketContent($panel,ticketID,uuid,'mutable');
					$("[data-app-role='supportFileUploadContainer']",$panel).anyupload({
						autoUpload : false,
						encode : 'base64', //if this is disabled, change enctype in the dispatch to null.
						ajaxRequest : function(vars,$ele)	{
//							_app.u.dump(vars);
							var $fUpload =  $("[data-app-role='supportFileUploadContainer']",$panel);
							$fUpload.showLoading({"message":"uploading files"});
							_app.model.addDispatchToQ({
								"_cmd":"adminTicketFileAttach",
								"filename" : vars.filename,
								"enctype" : "base64", //must be set if data passed as base64.
								"ticketid" : ticketID,
								"body" : vars.filecontents,
								"_tag":{
									"callback":"showMessaging",
									"jqObj" : $fUpload,
									"onComplete" : function(){
										$(".fileUpload_default",$fUpload).slideUp(); //hide the items that were just uploaded. They'll be in the newly generated filename table.
										_app.model.dispatchThis('mutable');
										},
									"message":"File "+vars.filename+" attached to ticket "+ticketID
									}
								},"mutable");
							_app.model.addDispatchToQ({'_cmd':'adminTicketDetail','ticketid':ticketID,'_tag':	{'datapointer' : 'adminTicketFileList|'+ticketID,'callback':'anycontent','jqObj':$("[data-app-role='ticketAttatchmentList']",$panel).empty()}},'mutable');
							_app.model.dispatchThis("mutable");
							}
						});
					_app.model.dispatchThis('mutable');

					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_support.e.adminTicketDetailShow, unable to ascertain ticketID ["+ticketID+"] and/or UUID ["+uuid+"], both of which are required.","gMessage":true});
					}
				},


//used in the support utilites.
			ping : function($ele,P)	{
				var start = new Date().getTime();
				_app.model.addDispatchToQ({
					'_cmd':'ping',
					'_tag':	{
						'callback':function(rd){
				if(_app.model.responseHasErrors(rd)){
					$('#platformInformation').anymessage({'message':rd});
					}
				else	{
					var end = new Date().getTime();
					alert("Pong! took "+(end - start) / 1000+" seconds")
					}
							}
						}
					},'mutable');
				_app.model.dispatchThis('mutable');
				},




/***************			WEBDOC 			******************/


			execHelpSearch : function($ele,P)	{
		
					var $parent = $ele.closest("[data-app-role='dualModeContainer']"),
					$form = $("[data-app-role='helpSearch']",$parent).first(),
					srsearch = $("[name='srsearch']",$parent).val();

					if(srsearch)	{
						$('.dualModeListMessaging',$parent).first().empty().hide();
						var $contentArea = $('.gridTable',$parent).first();
						$contentArea.show().find('tbody').empty(); //empty any previous search results.
						$contentArea.showLoading({"message":"Searching for help files"});
//docs on the media wiki API can be found here:  http://wiki.commercerack.com/wiki/api.php
						_app.model.addDispatchToQ({"_cmd":"helpWiki","format":"json","list":"search","action":"query","srwhat":"text","srsearch":srsearch,"_tag":{"datapointer":"helpWikiSearch",'callback':'anycontent','jqObj':$contentArea}},"mutable");
						_app.model.dispatchThis('mutable');
						}
					else	{
						$('.dualModeListMessaging',$parent).first().empty().show().anymessage({'message':'Please enter some keywords into the form input above to search for.'});
						$("[data-app-role='dualModeListContents']",$parent).first().hide();
						}
					P.preventDefault();

				}, //execHelpSearch


//<button data-app-click="admin_support|showHelpDocInDialog" class='applyButton' data-title='some_helpdoc_id' data-icon-primary='ui-icon-lightbulb'>Help</button>
//uses new delegated events model.
			showHelpDocInDialog : function($ele,p)	{
				var title = $ele.closest('[data-title]').data('title');
				if(title)	{
					_app.ext.admin_support.a.showHelpDocInDialog(title);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_support.e.showHelpDocInDialog, unable to determine data-title from trigger element.','gMessage':true});
					}
				},

//used in the DMI help interface to open a panel and popupate it w/ contents.
			showHelpDetail : function($ele,P)	{
				P.preventDefault();
				var title = $ele.closest('tr').data('title');
				if(title)	{
					$panel = _app.ext.admin.i.DMIPanelOpen($ele,{
						'templateID' : 'helpDocumentTemplate',
						'panelID' : 'helpdoc_'+title,
						'showLoading' : false,
						'header' : title
						});
					
					_app.ext.admin_support.u.loadHelpDocInto($(".ui-anypanel-content",$panel),title);
					_app.u.handleButtons($panel);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_support.e.showHelpDetail, unable to determine title.','gMessage':true});
					}
				}
		
			}

		} //r object.
	return r;
	}