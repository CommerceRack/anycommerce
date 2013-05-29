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


var admin_syndication = function() {
	var theseTemplates = new Array(
	'pageSyndicationTemplate',
	'syndicationDetailTemplate',
	'syndicationFilesRowTemplate'
	//all the DST specific templates are intentionally NOT included here. They'll get loaded as needed.
	);
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
//the list of templates in theseTemplate intentionally has a lot of the templates left off.  This was done intentionally to keep the memory footprint low. They'll get loaded on the fly if/when they are needed.
				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/syndication.html',theseTemplates);
				r = true;

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			},
//when this macro response syntax gets adopted elsewhere, move this to admin extension.
		handleMacroUpdate : {
			onSuccess : function(_rtag)	{
				app.u.dump("BEGIN admin_syndication.callbacks.handleMacroUpdate");
				app.u.dump(" -> typeof _rtag.jqObj: "+typeof _rtag.jqObj);
				var $target;
				if(_rtag && _rtag.jqObj && typeof _rtag.jqObj === 'object')	{
					$target = _rtag.jqObj
					}
				else	{
					$target = $('#globalMessaging');
					}


if(_rtag && _rtag.datapointer && app.data[_rtag.datapointer] && app.data[_rtag.datapointer]['@RESPONSES'])	{
	var
		responses = app.data[_rtag.datapointer]['@RESPONSES'], //shortcut
		L = responses.length,
		errors = "";
		
	for(var i = 0; i < L; i += 1)	{
		if(responses[i]['msgtype'] == 'ERROR')	{
			errors += responses[i]['msg']+"<br \/>";
			}
		}

	if(errors)	{
		$target.anymessage({"message":errors});
		}
	
	} 
//if everything was successful, revert the form to normal.			
//				$("[data-app-role='saveButton']",$form).button('disable').find('.numChanges').text(""); //make save buttons not clickable.
//				$('.edited',$target).removeClass('edited'); //revert inputs to non-changed state.

				
				}
			},


		anycontentPlus : {
			onSuccess : function(_rtag)	{
//				app.u.dump("BEGIN callbacks.anycontent");

				if(_rtag && _rtag.jqObj && typeof _rtag.jqObj == 'object')	{
					
					var $target = _rtag.jqObj; //shortcut
//need both the data in the response and the wholesaleScheduleList for 'settings' page.
					$target.anycontent({data: $.extend(true,{},app.data[_rtag.datapointer],app.data.adminWholesaleScheduleList),'templateID':_rtag.templateID});

					$('.toolTip',$target).tooltip();
					$(':checkbox.applyAnycb',$target).anycb();
					$('table.applyAnytable',$target).anytable();
					$('.applyAnytabs',$target).anytabs();

					app.u.handleAppEvents($target);

					if(_rtag.applyEditTrackingToInputs)	{
						app.ext.admin.u.applyEditTrackingToInputs($target);
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin.callbacks.anycontent, jqOjb not set or not an object ['+typeof _rtag.jqObj+'].','gMessage':true});
					}


				
				},
			onError : function(rd)	{
				if(rd._rtag && rd._rtag.jqObj && typeof rd._rtag.jqObj == 'object'){
					rd._rtag.jqObj.hideLoading().anymessage({'message':rd});
					}
				else	{
					$('#globalMessage').anymessage({'message':rd});
					}
				}
			}, //translateSelector


		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
		a : {
			showSyndication : function($target)	{
				app.ext.admin.calls.adminWholesaleScheduleList.init({},'passive'); //most syndication 'settings' use this. have it handy
				app.model.dispatchThis('passive');

				$target.empty();
				$target.anycontent({'templateID':'pageSyndicationTemplate',data:{}});
				$("[data-app-role='slimLeftNav']",$target).first().accordion();
				app.u.handleAppEvents($target);
				},

			showDSTDetails : function(DST,$target)	{

				app.ext.admin.calls.adminWholesaleScheduleList.init({},'passive'); //most syndication 'settings' use this. have it handy
				app.model.dispatchThis('passive');

				if($target && DST)	{
					$target.empty();
					$target.anycontent({'templateID':'syndicationDetailTemplate','data':{},'dataAttribs':{'dst':DST}});
					$('.anytabsContainer',$target).anytabs();
					var $form = $("[data-anytab-content='settings'] form:first",$target);
					$form.showLoading({'message':'Fetching Marketplace Details'});
					
					app.u.handleAppEvents($("[data-anytab-content='diagnostics']",$target));
					
					app.ext.admin.calls.adminSyndicationDetail.init(DST,{callback : 'anycontentPlus','applyEditTrackingToInputs':true,'extension':'admin_syndication','templateID':'syndication_'+DST.toLowerCase(),'jqObj':$form},'mutable');
					app.model.dispatchThis();

//add an action to the tab click. the tab code itself already opens the associated content area.
$("[data-app-role='filesTab'], [data-app-role='historyTab'], [data-app-role='errorsTab']").on('click.fetchData',function(){
	var
		$tab = $(this),
		$tabContent,
		cmd = "" 

	if($tab.data('app-role') == 'filesTab')	{
		cmd = "adminSyndicationListFiles";
		$tabContent = $("[data-anytab-content='files']",$target);
		}
	else if($tab.data('app-role') == 'historyTab')	{
		cmd = "adminSyndicationHistory";
		$tabContent = $("[data-anytab-content='history']",$target);
		}
	else if($tab.data('app-role') == 'errorsTab')	{
		cmd = "adminSyndicationFeedErrors";
		$tabContent = $("[data-anytab-content='errors']",$target);
		}
	else	{
		app.u.dump("UH OH!  got someplace we shouldn't get. In admin.a.showDSTDetails");
		} //unsupported role. shouldn't get here based on the selector to get into this loop.
	
	

	if($tab.data('haveContent'))	{} //do nothing. content has already been fetched.
	else if(cmd)	{
		$tab.data('haveContent',true);
		$tabContent.showLoading({'message':'Fetching File List'});
		app.ext.admin.calls[cmd].init(DST,{callback : 'anycontentPlus','extension':'admin_syndication','jqObj':$tabContent},'mutable');
		app.model.dispatchThis('mutable');
		}
	else	{
		//should never get here.
		$('#globalMessaging').anymessage({'message':'In showDSTDetails, the click event added to the tab has an invalid app-role (no cmd could be determined)'});
		}
	app.u.dump(" -> Tab Click: "+cmd);
	app.u.dump(" -> $tabContent.length: "+$tabContent.length);
	});


					}
				else if($target)	{
					$target.anymessage({"message":"In admin.a.showDSTDetails, no DST specified.",'gMessage':true});
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.a.showDSTDetails, no DST or target specified.",'gMessage':true});
					}
				
				},
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

//this doesn't impact what the action on the button is, just whether or not the button is enabled/disabled and what class is applied.
			handleDetailSaveButton : function($ele)	{
				
				var
					$settingsContainer = $ele.closest("[data-anytab-content='settings']"),
					$form = $('form',$settingsContainer).first(),
					$button = $settingsContainer.find("[data-app-role='saveButton']"),
					numChanges = $('.edited',$form).length;
				
				if(numChanges)	{
					$button.addClass('ui-state-highlight').button('enable');
					$('.numChanges',$button).text(numChanges);
					}
				else	{
					$("[data-app-role='saveButton']",$form).button('disable').find('.numChanges').text(""); //make save buttons not clickable.
					}
				
				}
			
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			
			showDSTDetail : function($ele)	{
				$ele.off('click.showDSTDetail').on('click.showDSTDetail',function(){
					var $mktContainer = $ele.closest("[data-app-role='syndicationContainer']").find("[data-app-role='slimLeftContentSection']").first();
					if($ele.data('mkt'))	{
						app.ext.admin_syndication.a.showDSTDetails($ele.data('mkt'),$mktContainer)
						}
					else	{
						$mktContainer.anymessage({"message":"In admin_syndication.e.showDSTDetail, unable to determine mkt.","gMessage":true});
						}
					});
				}, //showDSTDetail
			
			adminSyndicationMacroExec : function($btn)	{
				$btn.button();
				$btn.off('click.adminSyndicationMacroExec').on('click.adminSyndicationMacroExec',function(){
					var $form = $btn.closest('form');
					if(app.u.validateForm($form))	{
						
						var macros = new Array(),
						saveMacro = "",
						DST = $("[name='DST']",$form).val();
						
						$('.edited',$form).each(function(){
							var $input = $(this);
							
							if($input.attr('name') == 'ENABLE')	{
								if($input.is(':checked'))	{macros.push("ENABLE")}
								else	{macros.push("DISABLE")}							
								}
//amazon has a thesaurus table
							else if(DST == 'AMZ' && $input.is('tr'))	{

								if($input.hasClass('rowTaggedForRemove') && $input.hasClass('isNewRow'))	{
									//if it's a new row that was deleted before a save occured, no macro needed to remove it.
									}
								else if($input.hasClass('rowTaggedForRemove'))	{
									macros.push("AMZ-THESAURUS-DELETE?ID="+$input.data('thid'));
									}
								else if($input.hasClass('isNewRow'))	{
									macros.push("AMZ-THESAURUS-SAVE?"+app.ext.admin.u.getSanitizedKVPFromObject($input.data()));
									}
								else	{
									//HUH! shouldn't have gotten here.
									$('#globalMessaging').anymessage({'message':'in admin_syndication.e.adminSyndicationMacroExec, unknown case for amazon thesaurus. Does not appear to be new or delete, why is it flagged as edited?','gMessage':true});
									}
								}
							else if($input.is(':checkbox'))	{
								saveMacro += $input.attr('name')+"="+($input.is(':checked') ? 1 : 0)+"&"
								}
							else	{
								saveMacro += $input.attr('name')+"="+encodeURIComponent($input.val())+"&"
								}
							});
						
						if(saveMacro)	{
							macros.push("SAVE?"+saveMacro);
							}
						
						if(DST && macros.length)	{
							app.ext.admin.calls.adminSyndicationMacro.init(DST,macros,{'callback':'handleMacroUpdate','extension':'admin_syndication'},'immutable');
							app.model.dispatchThis('immutable');
							}
						else	{
							$form.anymessage({"message":"In admin_syndication.u.handleDSTDetailSave, unable to determine DST ["+DST+"] or macros ["+macros.length+"] was empty","gMessage":true});
							}
						
						}
					else	{} //validateForm handles error display.
					});
				}, //adminSyndicationMacroExec
			
			adminSyndicationUnsuspendMacro : function($btn)	{
				$btn.button();
				$btn.off('click.adminSyndicationUnsuspendMacro').on('click.adminSyndicationUnsuspendMacro',function(){
					DST = btn.closest("[data-dst]").data('dst');
					if(DST)	{
						app.ext.admin.calls.adminSyndicationMacro.init(DST,['UNSUSPEND'],{},'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{
						$form.anymessage({"message":"In admin_syndication.u.handleDSTDetailSave, unable to determine DST ["+DST+"] or macros ["+macros.length+"] was empty","gMessage":true});
						}
					});
				},			
			adminSyndicationUnsuspendAndClearErrorMacro : function($btn)	{
				$btn.button();
				$btn.off('click.adminSyndicationUnsuspendMacro').on('click.adminSyndicationUnsuspendMacro',function(){
					DST = btn.closest("[data-dst]").data('dst');
					if(DST)	{
						app.ext.admin.calls.adminSyndicationMacro.init(DST,['UNSUSPEND','CLEAR-FEED-ERRORS'],{},'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{
						$form.anymessage({"message":"In admin_syndication.u.handleDSTDetailSave, unable to determine DST ["+DST+"] or macros ["+macros.length+"] was empty","gMessage":true});
						}
					});
				},
			
			amazonThesaurusAddShow : function($btn)	{
				$btn.button();
				$btn.off('click.amazonThesaurusAddShow').on('click.amazonThesaurusAddShow',function(event){
					event.preventDefault();
					var $D = $("<div \/>").attr('title',"Add Thesaurus");
					$D.anycontent({'templateID':'syndicationAmazonThesaurasAdd','data':{}});
					$D.addClass('displayNone').appendTo('body'); 
					$D.dialog({
						modal: true,
						width: '90%',
						autoOpen: false,
						close: function(event, ui)	{
							$(this).dialog('destroy').remove();
							}
						});
//					$(':checkbox',$D).anycb(); //{'text' : {'on' : 'yes','off':'no'}} //not working in a dialog for some reason.
					$D.dialog('open');

					});
//				
				},
			
			adminSyndicationDebugExec : function($btn)	{
				$btn.button();
				$btn.off('click.adminSyndicationDebugExec').on('click.adminSyndicationDebugExec',function(){
					var
						$form = $btn.closest('form'),
						$container = $btn.closest("[data-app-role='syndicationDetailContainer']"),
						DST = $btn.closest("[data-dst]").data('dst');
					
					if(DST)	{
						if(app.u.validateForm($form))	{
							app.ext.admin.calls.adminSyndicationDebug.init(DST,$form.serializeJSON(),{callback : function(rd){
if(app.model.responseHasErrors(rd)){
	$container.anymessage({'message':rd})
	}
else	{
	$("[data-app-role='diagnosticsResultsContainer']",$container).html(app.data[rd.datapointer]['HTML']);
	}
								}},'mutable');
							app.model.dispatchThis('mutable');
							}
						else	{
							//validateForm handles error display.
							}
						}
					else	{
						$form.anymessage({"message":"In admin.e.adminSyndicationDebugExec, unable to ascertain DST, which is required to proceed.","gMessage":true});
						}
					});
				}
			
			
			} //e [app Events]
		} //r object.
	return r;
	}