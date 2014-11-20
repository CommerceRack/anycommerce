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


var admin_marketplace = function(_app) {
	var theseTemplates = new Array(
	'pageSyndicationTemplate',
	'syndicationDetailTemplate',
	'syndicationFilesRowTemplate',
	'syndicationErrorsRowTemplate',
	'globalCPCInputs'
	//all the DST specific templates are intentionally NOT included here. They'll get loaded as needed.
	);
	var r = {
	
	vars : {
		ebayXSL : null
		},

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
//the list of templates in theseTemplate intentionally has a lot of the templates left off.  This was done intentionally to keep the memory footprint low. They'll get loaded on the fly if/when they are needed.
				// _app.model.fetchNLoadTemplates(_app.vars.baseURL+'extensions/admin/marketplace.html',theseTemplates);

				r = true;

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				_app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}, //init
//when this macro response syntax gets adopted elsewhere, move this to admin extension.
// this was not the method that got implemented. processForm was.
		handleMacroUpdate : {
			onSuccess : function(_rtag,macroResponses)	{
				_app.u.dump("BEGIN admin_marketplace.callbacks.handleMacroUpdate.onSuccess");
//				_app.u.dump(" -> typeof _rtag.jqObj: "+typeof _rtag.jqObj);
				var $target;
				if(_rtag && _rtag.jqObj && typeof _rtag.jqObj === 'object')	{
					$target = _rtag.jqObj
					$target.hideLoading();
					_app.u.handleAppEvents($target);  //re-execute these so that changes to the marketplace lock/unlock buttons as needed.
					}
				else	{
					$target = $('#globalMessaging');
					}
				
				
				if(macroResponses && macroResponses['@RESPONSES'])	{
					macroResponses.persistent = true; //leave messages open.
					$target.anymessage(macroResponses);
					}
				else	{
					$target.anymessage(_app.u.successMsgObject('Your changes have been saved')); //generic success message if no @RESPONSES are set.
					}
//				
//				_app.u.dump(" -> _rtag"); _app.u.dump(_rtag);

//if everything was successful, revert the form to a pre-change state.
				$("[data-app-role='saveButton']",$target).button('disable').find('.numChanges').text(""); //make save buttons not clickable.
				$('.edited',$target).removeClass('edited'); //revert inputs to non-changed state.

				
				},
			onError : function(rd)	{
				_app.u.dump("BEGIN admin_marketplace.callbacks.handleMacroUpdate.onError");
				var $target;
				if(rd && rd._rtag && rd._rtag.jqObj && typeof rd._rtag.jqObj=== 'object')	{
					$target = rd._rtag.jqObj;
					$target.hideLoading();
					}
				else	{
					$target = $('#globalMessaging');
					}
				$target.anymessage({'message':rd})
				}
			},

//ebay requires a registration process. Until that's done, the ebay setup page is not displayed and a register template is displayed instead.
		handleEBAY : {
			onSuccess : function(_rtag)	{
//				_app.u.dump("BEGIN callbacks.anycontent");

				if(_rtag && _rtag.jqObj && typeof _rtag.jqObj == 'object')	{
					if(_app.data[_rtag.datapointer].enable)	{
						_app.ext.admin_marketplace.callbacks.anycontentPlus.onSuccess(_rtag); //this is how all the other marketplaces (which don't require auth) are handled.
						}
					else	{
						_rtag.jqObj.hideLoading();
						_rtag.jqObj.anycontent({'templateID':'syndication_register_ebf','showLoading':false});
						_app.u.handleAppEvents(_rtag.jqObj);
						_app.u.handleButtons(_rtag.jqObj);
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin.callbacks.anycontent, jqOjb not set or not an object ['+typeof _rtag.jqObj+'].','gMessage':true});
					}


				
				}
			},
		// ### TODO -> get rid of this. use anycontent and 'extendByDatapointers' : ['adminPriceScheduleList'],
		anycontentPlus : {
			onSuccess : function(_rtag)	{
//				_app.u.dump("BEGIN callbacks.anycontentPlus");

				if(_rtag && _rtag.jqObj && typeof _rtag.jqObj == 'object')	{
					
					var $target = _rtag.jqObj; //shortcut
//need both the data in the response and the wholesaleScheduleList for 'settings' page.
					$target.anycontent({data: $.extend(true,{},_app.data[_rtag.datapointer],_app.data.adminPriceScheduleList),'templateID':_rtag.templateID});

					_app.u.handleCommonPlugins($target);

					_app.u.handleAppEvents($target);

					if(_rtag.applyEditTrackingToInputs)	{
						_app.ext.admin.u.applyEditTrackingToInputs($target);
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
			} //anycontentPlus


		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		a : {
//opens the ebay category chooser in a modal.  
//$input is a jquery object of an input where the category value selected will be set using val();
//vars is an object that needs to contain a pid and a categoryselect.
//eBay allows for a primary and secondary category to be set, however attributes are only set on the primary, so that mode is important.
//var keys are all lower case to allow for easy set via 'data' and consistency.
//$path is an optional param which, if set, will have the path of the selected category set.
			showEBAYCategoryChooserInModal : function($input,vars,$path)	{
				_app.u.dump("BEGIN admin_marketplace.a.showEBAYCategoryChooserInModal");
				vars = vars || {};
				if($input && $input instanceof jQuery)	{
					if(vars.pid && vars.categoryselect == 'primary' || vars.categoryselect == 'secondary')	{
						vars.inputid = null;
						
						var $D = $('#ebayCategoryChooser');
						var $ItemSpecificsArea = $("[data-app-role='ebayItemSpecificsContainer']",$D);
						if($D.length)	{
							//$("[data-app-role='ebayCategoryChooserXSLContainer']",$D).empty(); //remove old content.
							//$("[data-app-role='ebayCategoryChooserItemSpecificsFieldset']",$D).find(".inputContainer").empty().remove();
							$ItemSpecificsArea.empty();
							$("[data-app-role='ebayCategoryList']",$D).empty(); //clear categories. they get re-fetched if it's a new product and if not, they'll be in memory.
							$D.removeData('categoryselect inputid pathid pid categoryid'); //clear old values from previous product/category selection
							}
						else	{
							$D = $("<div \/>",{'title':'eBay Category Chooser','id':'ebayCategoryChooser'});
							$D.dialog({
								'modal':true,
								'width' : '90%',
								'height':($(window).height() - 100),
								'autoOpen' : false
								});
							$D.anycontent({
								'templateID' : 'ebayCategoryChooserTemplate',
								'showLoadingMessage' : 'Fetching eBay category list'
								});
							}

//if one doesn't already exist, add an id to both the input and path elements.  The ID's are used to look up the elements later.
						$D.dialog('open');
						if(vars.inputid = $input.attr('id'))	{} //value for input id is set in if.
						else	{
							vars.inputid = 'ebaycat_'+_app.u.guidGenerator();
							$input.attr('id',vars.inputid)
							}

						if($path)	{
							if(vars.pathid = $path.attr('id'))	{} //value for input id is set in if.
							else	{
								vars.pathid = 'span_'+_app.u.guidGenerator();
								$path.attr('id',vars.pathid)
								}
							}

//						_app.u.dump(" -> vars: "); _app.u.dump(vars);
						$D.data(vars); //set on dialog so they can be easily located later (on save).
//						_app.u.dump(" -> $D.data():"); _app.u.dump($D.data());
						_app.ext.admin.calls.adminEBAYCategory.init({'categoryid':'0','pid':vars.pid},{'callback':function(rd){
							_app.u.dump("BEGIN callback for adminEBAYCategory catid 0 and pid: "+vars.pid);
							$D.hideLoading();
							if(_app.model.responseHasErrors(rd)){
								$D.anymessage({'message':rd})
								}
							else	{
								if($input.val())	{
									_app.ext.admin_marketplace.u.ebayShowTreeByChild($input.val());
									}
								$("[data-app-role='ebayCategoryChooserTable']",$D).anycontent(rd);
								_app.u.handleAppEvents($D);
								// _app.u.dump(" -> item specifics: "+_app.data[rd.datapointer]['ebay:itemspecifics']);
								}
							}},'mutable');
						_app.model.dispatchThis('mutable');
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In admin.a.showEBAYCategoryChooserInModal, categorySelect ["+vars.categorySelect+"] was set to an invalid value or no pid ["+vars.pid+"] was passed. categoryselect must be primary or secondary.","gMessage":true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.a.showEBAYCategoryChooserInModal, $input was either not passed or does not exist on the dom","gMessage":true});
					}
				},

			showSyndication : function($target)	{
				_app.ext.admin.calls.adminPriceScheduleList.init({},'mutable'); //most syndication 'settings' use this. have it handy

				$target.empty();
				$target.anycontent({'templateID':'pageSyndicationTemplate',data:{}});
				$("[data-app-role='slimLeftNav']",$target).first().accordion();
				_app.u.handleAppEvents($target);
				
				_app.ext.admin_reports.u.getChartData($(".syndicationSummaryChartOne",$target).show().addClass("graphType_pie"),{"function":"sum","graph":"pie","period":"days.7","grpby":"none","dataColumns":"dynamic","column":"gms","ddataset":"MARKETS","datasetGrp":"","title":"7 Day Gross Sales Summary by Integrations","collection":"collection/graph location","@datasets":["MARKETS"],"_cmd":"adminKPIDBDataQuery"});
				_app.model.dispatchThis('mutable');
				}, //showSyndication

			showAmzRegisterModal : function(){
				var $D = $("<div \/>").attr('title',"Approve Amazon Create/Verify your MWS Token").append("<p><b>Welcome back!<\/b>. To complete this process, please push the 'complete activation' button below.<\/p><p class='hint'>You were given this notice because we detected you just returned from Amazon to Create/Verify your MWS Token. If you are not returning directly from Amazon, please do not push the complete activation button..<\/p>");
				$D.dialog({
					modal: true,
					width: ($('body').width() > 400) ? 400 : '90%',
					autoOpen: false,
					close: function(event, ui)	{
						$(this).dialog('destroy').remove();
						},
					buttons: [ 
						{text: 'Cancel', click: function(){
							$D.dialog('close');
							}},
						{text: 'Complete Activation', click: function(){
							if(window.location.href.indexOf('?') > 0)	{
								var uriParams = _app.u.kvp2Array(window.location.href.split('?')[1]);
								_app.ext.admin.calls.adminSyndicationMacro.init("AMZ",["AMZ-TOKEN-UPDATE?marketplaceId="+uriParams.marketplaceId+"&merchantId="+uriParams.merchantId+"&amazon-token="+uriParams['amazon-token']],{'callback':function(rd){
									if(_app.model.responseHasErrors(rd)){
										$D.anymessage({'message':rd})
										}
									else	{
										$D.empty().anymessage(_app.u.successMsgObject('Activation successful!'));
										$D.dialog({ buttons: [ { text: "Close", click: function() { $( this ).dialog( "close" ); } } ] });
										}
									}},'immutable');
								_app.model.dispatchThis('immutable');
								}
							else	{
								$D.anymessage({"message":"URL contains no question mark with params. expecting marketplaceId and merchantId.",'gMessage':true});
								}
							}}	
						]
					});
				$D.dialog('open');
				}, //showAmzRegisterModal


			showEBAY : function($target)	{
				$target.empty().showLoading({'message':'Fetching eBay data'});
				
				var
					$slimLeftContent = $target.closest("[data-app-role='slimLeftContentSection']"),
					$extrasTab = $("[data-app-role='extrasTab']",$slimLeftContent),
					$extrasTabContent = $("[data-anytab-content='extras']",$slimLeftContent);
					
				
				$extrasTab.show().find('a').text('Tokens & Profiles');
				
				//ebayTokensAndProfilesTemplate
				//ebay takes a very different path at this point.  
				_app.model.addDispatchToQ({"_cmd":"adminSyndicationDetail","DST":"EBF","_tag":{"datapointer":"adminSyndicationDetail|EBF"}},"mutable");
				_app.model.addDispatchToQ({'_cmd':'adminEBAYProfileList','_tag': {'datapointer':'adminEBAYProfileList'}},'mutable');
				_app.model.addDispatchToQ({'_cmd':'adminEBAYTokenList','_tag': {'datapointer':'adminEBAYTokenList','callback' : function(rd){
					$target.hideLoading();
					if(_app.model.responseHasErrors(rd)){
						$target.anymessage({'message':rd});
						}
					else	{
						if(_app.data[rd.datapointer]['@ACCOUNTS'].length)	{
				//populate syndication tab
							$target.anycontent({
								'templateID':'syndication_ebf',
								'data' : _app.data['adminSyndicationDetail|EBF'],
								'dataAttribs':{'dst':'EBF'}
								});
							_app.u.handleAppEvents($target);
							_app.u.addEventDelegation($target);
							_app.u.handleCommonPlugins($target);
							_app.u.handleButtons($target.anyform());
							_app.ext.admin.u.applyEditTrackingToInputs($target);

							$('.applyAnytabs:first',$slimLeftContent).find("li[data-app-role='extrasTab']:first").trigger('click'); //make tokens and profiles tab active.
//populate 'extras' tab, which is used for tokens and profiles.
							$extrasTabContent.anycontent({
								'templateID' : 'ebayTokensAndProfilesTemplate',
								'data' : $.extend(true,{},_app.data['adminSyndicationDetail|EBF'],_app.data.adminEBAYProfileList,_app.data.adminEBAYTokenList)
								});
							$('table',$extrasTabContent).anytable();
							_app.u.handleAppEvents($extrasTabContent);
							}
						else	{
							$target.anycontent({'templateID':'syndication_register_ebf','showLoading':false,'dataAttribs':{'dst':'EBF'}});
							_app.u.handleAppEvents($target);
							_app.u.handleButtons($target);
							}
						}
					}}},'mutable');
				_app.model.dispatchThis('mutable');


				}, //showEBAY
		
			showEBAYLaunchProfileEditor : function($target,profile,vars)	{
				vars = vars || {};
				if($target instanceof jQuery && profile)	{

					var $profileContent = $("<div \/>").css('min-height','200').addClass('clearfix'); /* minheight is for showloading */
					if(vars.fromupgrade)	{$profileContent.addClass('conditionMet')}
//instead of applying anycontent to the tab itself, it's applied to a child element. avoids potential conflicts down the road.
					$target.empty().append($profileContent);
					$target.showLoading({'message':'Fetching launch profile details for '+profile});
					_app.u.addEventDelegation($target);
	
					_app.model.addDispatchToQ({
						'_cmd':'adminEBAYProfileDetail',
						'PROFILE' : profile,
						'_tag' : {
							'datapointer' : 'adminEBAYProfileDetail|'+profile,
							'callback' : function(rd){
								$target.hideLoading();
								if(_app.model.responseHasErrors(rd)){
									$target.anymessage({'message':rd})
									}
								else	{
//									_app.u.dump(" -> _app.data["+rd.datapointer+"]: "); _app.u.dump(_app.data[rd.datapointer]);
									$profileContent.anycontent({'templateID':'ebayProfileCreateUpdateTemplate',data : $.extend(true,{},_app.data[rd.datapointer],_app.data.adminEBAYTemplateList,_app.data.adminEBAYTokenList)});
									_app.u.handleButtons($profileContent);
									_app.u.handleCommonPlugins($profileContent);

									$("[name='PROFILE']",$profileContent).closest('label').hide(); //field is not editable.

									$("[data-panelname]",$profileContent).each(function(){
										var $fieldset = $(this);
//										_app.u.dump(" -> $fieldset.data('panelname'): "+$fieldset.data('panelname'));
										$fieldset.anypanel({
											'showClose': false,
											'extension' : 'admin_marketplace',
											'state' : 'persistent',
											'persistent' : true,
											'name' : $fieldset.data('panelname')
											});
										$fieldset.addClass('marginBottom');
										})
									_app.u.handleAppEvents($profileContent);
									_app.ext.admin.u.applyEditTrackingToInputs($('form',$profileContent));
									$('.gridTable tbody',$profileContent).sortable({'items':'tr'});
									}
								}
							}
						},'mutable');
					_app.model.dispatchThis('mutable');

					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_marketplace.a.showEBAYLaunchProfileEditor, either $target not a valid jquery object ["+($target instanceof jQuery)+"] or profile ["+profile+"] is blank.","gMessage":true});
					
					}
				}, //showEBAYLaunchProfileEditor

//shows the editor for a given marketplace, by DST code.
			showDSTDetails : function($target,vars)	{
//				_app.u.dump("BEGIN admin_marketplace.a.showDSTDetails");
				vars = vars || {}
				_app.ext.admin.calls.adminPriceScheduleList.init({},'passive'); //most syndication 'settings' use this. have it handy
				_app.model.dispatchThis('passive');

				if($target instanceof jQuery && vars.DST)	{
					var DST = vars.DST;
//					_app.u.dump(" -> $target and DST are set ");

					$target.empty();
					$target.anycontent({'templateID':'syndicationDetailTemplate','data':{},'dataAttribs':{'dst':DST}});
	
						
					_app.u.handleCommonPlugins($target);
//there is a bug either in the tab script or the browser. Even though the container is emptied (i even destroyed the tabs at one point) 
// when the new editor appears, whichever tab was previously selected stays selected. The code below triggers a tab click but not the request code.
					
					
					var $form = $("[data-anytab-content='settings'] form:first",$target);
					$form.showLoading({'message':'Fetching Marketplace Details'});
					$form.anyform({'trackEdits':true});

					_app.u.handleAppEvents($("[data-anytab-content='diagnostics']",$target));
				

					if(DST == 'EBF')	{
						_app.ext.admin_marketplace.a.showEBAY($form);
						}
					else	{
						_app.model.addDispatchToQ({"_cmd":"adminSyndicationDetail","DST":DST,"_tag":{
							"datapointer":"adminSyndicationDetail|"+DST,
							'extendByDatapointers' : ['adminPriceScheduleList'],
							'callback' : 'anycontent',
							'templateID':'syndication_'+DST.toLowerCase(),
							'jqObj':$form
							}},"mutable");
						}
						_app.model.dispatchThis('mutable');
	
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
								_app.u.dump("UH OH!  got someplace we shouldn't get. In admin.a.showDSTDetails");
								} //unsupported role. shouldn't get here based on the selector to get into this loop.
						
							if($tab.data('haveContent'))	{} //do nothing. content has already been fetched.
							else if(cmd)	{
								$tab.data('haveContent',true);
								$tabContent.showLoading({'message':'Fetching File List'});
								_app.model.addDispatchToQ({
									"_cmd":cmd,
									"DST" : DST,
									"_tag":{
										datapointer : cmd+"|"+DST,
										extendByDatapointers : ['adminPriceScheduleList'],
										callback : 'anycontent',
										jqObj : $tabContent,
										translateOnly : true
										}},"mutable");

								_app.model.dispatchThis('mutable');
								}
							else	{
								//should never get here.
								$('#globalMessaging').anymessage({'message':'In showDSTDetails, the click event added to the tab has an invalid app-role (no cmd could be determined)'});
								}
							});

					}
				else if($target instanceof jQuery)	{
					$target.anymessage({"message":"In admin.a.showDSTDetails, no DST specified.",'gMessage':true});
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.a.showDSTDetails, no vars.DST ["+vars.DST+"] or $target is not an instanceof jQuery ["+($target instanceof jQuery)+"] specified.",'gMessage':true});
					}
				
				} //showDSTDetails
			
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
				
				}, //handleDetailSaveButton

/*executed when an ebay store category is clicked.
If the category is NOT a leaf, it will load the children.
if the category IS a leaf:
   it will show the item specifics if categoryselect is primary. 
   if categoryselect is secondary, it will update the product record and close the modal.
pass in an LI.  expects certain data params to be set on the li itself. specifically 
*/
			handleEBAYChild : function($li)	{
				_app.u.dump("BEGIN admin_marketplace.u.handleEBAYChild");
				if($li && $li.length && $li.data('categoryid'))	{
					var
						categoryid = $li.data('categoryid'),
						$chooser = $('#ebayCategoryChooser'),
						$ItemSpecificsArea = $chooser.find("[data-app-role='ebayItemSpecificsContainer']"),
						data = $chooser.data();
						
						// if eBay site=0 just save categoryid (176984)
						// if eBay site!=0 (ebay motors site=100), save categoryid.site (38627.100)
						if($li.data('site')) { 
							categoryid = categoryid+'.'+$li.data('site');
							}
							
							
//categoryselect is necessary so that it can be determined whether or not items specifics should be displayed.
					if(data.categoryselect) 	{

//					_app.u.dump(" -> categoryid: "+categoryid); _app.u.dump(" -> data: "); _app.u.dump(data);
						
					
//if the children have already been generated, just toggle them on click (display on/off).
						if($('ul',$li).length)	{
							_app.u.dump(" -> toggle");
							//on a toggle, ebayItemSpecificsContainer is not emptied (at this time).
							//already have categories. toggle ul
							$('ul',$li).first().toggle();
							}

						else if(Number($li.data('leaf')) >= 1 && data.categoryselect == 'secondary')	{
							_app.model.addDispatchToQ({
								'_cmd' : 'adminProductUpdate',
								'@updates' : ["SET-EBAY?category2="+categoryid],
								'pid' : data.pid
								},'passive');			
							_app.model.dispatchThis('passive');
							if(data.pathid)	{
								var path = _app.ext.admin_marketplace.u.buildEBAYCategoryPath(categoryid);
								if(path)	{$(_app.u.jqSelector('#',data.pathid)).text(path)}
								else	{
									$('.appMessaging').anymessage({"message":"In admin.u.handleEBAYChildren, unable to determine path for categoryid. As long as the category ID populated the form as needed, this is not a big deal. Dev: see console for details."});
									}
								}
							if(data.inputid)	{
								//This 'update' is triggered when a leaf is selected that has no item specifics.
								$(_app.u.jqSelector('#',data.inputid)).val(categoryid).effect('highlight', {}, 2500).addClass('edited');
								_app.ext.admin.u.handleSaveButtonByEditedClass($(_app.u.jqSelector('#',data.inputid)).closest('form')); //updates the save button change count.
								$chooser.dialog('close');
								}
							else	{
								$('.appMessaging').anymessage({"message":"In admin.u.handleEBAYChildren, unable to determine inputid. Should be set on $(#ebayCategoryChooser).data() "});
								}
							}

						else if(Number($li.data('leaf')) >= 1)	{
							_app.u.dump(" -> leaf!");
							//_app.u.dump(data);
							
							$chooser.data('categoryid',categoryid); //only set the category ID if a leaf. prohibits a non-leaf category from being selected accidentally.
							$('.activeListItem',$chooser).removeClass('activeListItem');
							$li.addClass('activeListItem');
							
							$chooser.showLoading({'message':'Fetching item specifics data'});
							
							var dispatch = _app.ext.admin_marketplace.u.fetchEBAYRecommendationsCmd(categoryid,data.pid);
							dispatch._tag.callback = function(rd){
								$chooser.hideLoading();
								if(_app.model.responseHasErrors(rd)){
									$ItemSpecificsArea.anymessage({'message':rd})
									}
								else	{
									$ItemSpecificsArea.ebaySpecificsFormBuild(_app.data[rd.datapointer]);
									//$ItemSpecificsArea.ebaySpecificsFormBuild(_app.data[rd.datapointer]);
									//_app.u.dump(_app.data[rd.datapointer]);
									$('form[name=APIForm]').show(); //form is hidden by default
									// chooser block can become long when you browse the category tree
									// and ItemSpecificsForm appears on the top -> scroll there
									$('#ebayCategoryChooser').animate({ scrollTop:0 }, 600);
									
									_app.u.handleAppEvents($chooser);
									}
								}
							_app.model.addDispatchToQ(dispatch,'mutable');
							_app.model.dispatchThis('mutable');
							}

						else	{
//							_app.u.dump(" -> get subcats");
							$ItemSpecificsArea.empty(); //this will get re-populated on another leaf click.
							$('form[name=APIForm]').hide(); //cleans up the ui to hide this. inappropriate buttons are hidden.
							var $ul = $("<ul \/>",{'id':'children4_'+$li.data('categoryid'),'data-bind':'var: ebay(@CHILDREN); format: processList; loadsTemplate:ebayCategoryListitemTemplate;'});
							$ul.addClass('noPadOrMargin marginLeft').appendTo($li)
							$ul.showLoading({'message':'Fetching Categories...'});
							_app.ext.admin.calls.adminEBAYCategory.init({
								'categoryid':$li.data('categoryid')
//								'pid' : data.pid //don't get pid here. tweeners (non leaf or root) can use localstorage.
								},{'callback':'anycontent','jqObj':$ul},'mutable');
							_app.model.dispatchThis('mutable');
							}
						}
					else	{
						$('.appMessaging').anymessage({"message":"In admin.u.loadEBAYChildren, unable to determine categoryselect mode. should be primary or secondary and set on $(#ebayCategoryChooser).data() "});
						}
					
					}
				else	{
					$('.appMessaging').anymessage({"message":"In admin.u.loadEBAYChildren, $li was either not passed, has no length or li.data('id') has no value. DEV: see console for details.","gMessage":true});
					_app.u.dump("What follows this is the $li value passed into loadEBAYChildren: "); _app.u.dump($li);
					}
				}, //handleEBAYChild

			buildEBAYCategoryPath : function(categoryid)	{
				var r = '', site=0;
				categoryid = categoryid.toString();
				// if categoryid looks like '1234.100' - split it on catID + siteID
				if(categoryid.search(/\./) != -1) {
					var data = categoryid.split(/\./);
					categoryid = data[0];
					site = data[1];
					}
					
				// iterate category tree DOM and build full eBay category path - as a readable string
				if(categoryid && $('li[data-categoryid="'+categoryid+'"][data-site="'+site+'"]').length) {
					var $el = $('li[data-categoryid="'+categoryid+'"][data-site="'+site+'"]');
					r = '/' + $el.attr('data-name');
					while($el && $el.attr('data-parent_id')) {
						$el = $('li[data-categoryid="'+$el.attr('data-parent_id')+'"]');
						r = '/' + $el.attr('data-name') + r;
						}
					}
				else	{
					_app.u.dump("In admin_marketplace.u.buildEBAYCategoryPath, unable to build category path for ["+categoryid+"]");
					}
				return r;
				}, //buildEBAYCategoryPath

			fetchEBAYRecommendationsCmd : function(categoryid,pid)	{
				return {
					"_cmd" : "adminEBAYCategory",
					"pid" : pid,
					"categoryid" : categoryid,
					"_tag" : {
						'datapointer' : 'adminEBAYCategory|'+_app.model.version+'|'+categoryid
						}
					}
				}, //fetchEBAYRecommendationsCmd (old buildEBAYXSLCmd)


			ebayShowTreeByChild : function(categoryid)	{
//					_app.u.dump("BEGIN admin_marketplace.u.ebayShowTreeByChild");
//					_app.u.dump(' -> categoryid: '+categoryid);
					//_app.u.dump(vars);
					$('form[name=APIForm]').show(); //make sure form is visible.
					var $chooser = $('#ebayCategoryChooser');
					var $ItemSpecificsArea = $("[data-app-role='ebayItemSpecificsContainer']",$chooser);
					$chooser.data('categoryid',categoryid); //update the 'global' data object to reference the category now in focus.
					
					var	
						data = $chooser.data() || {},
						$messageDiv = $chooser.find("[data-app-role='eBayCatChooserMessaging']:first");

					if(categoryid)	{

$chooser.showLoading({'message':'Fetching eBay category tree data'});
$('.activeListItem',$chooser).removeClass('activeListItem');
if(categoryid && data.pid)	{
//						_app.u.dump(" -> categoryid ["+categoryid+"] and pid ["+data.pid+"] both obtained.");
//fetch detail on the recently viewed category. This will contain a list of parents orders from closest to leaf (at zero spot) to top-most.
//xsl is set so that the request doesn't have to be made again.
	_app.ext.admin.calls.adminEBAYCategory.init({
		'categoryid':categoryid,
		'pid' : data.pid,
		},{'callback' : function(rd){

			if(_app.model.responseHasErrors(rd)){
				$chooser.hideLoading();
				$messageDiv.anymessage({'message':rd})
				}
			else	{
				_app.u.dump(" -> successfully retrieved data for leaf ["+categoryid+"].");
				var
					leafData = _app.data[rd.datapointer], //gets used much later after rd... has been overwritten in other requests.
					parents = leafData['@PARENTS'],
					L = parents.length;
				
			//	_app.u.dump(" -> leaf has "+L+" parents");
				//get the category detail for each branch in the tree handy.
				for(var i = 0; i < L; i += 1)	{
					_app.ext.admin.calls.adminEBAYCategory.init({'categoryid':categoryid,'pid' : data.pid},{},'mutable');
					}
				_app.calls.ping.init({'callback':function(rd){
					if(_app.model.responseHasErrors(rd)){
						$chooser.hideLoading();
						$messageDiv.anymessage({'message':rd})
						}
					else	{
//All the data is available at this point, right down to the leaf, so trigger a click on each branch, starting at the top (last item in parents array).
//this only triggers the clicks on the parents, not on the leaf itself. We already have that data from our original request to get the parents.
						for(var i = (L-1); i >= 0; i -= 1)	{
//							_app.u.dump(i+"). "+parents[i].categoryid+" "+parents[i].name);
							var $li = $("[data-categoryid='"+parents[i].categoryid+"']:first",$chooser)
							if($('ul',$li).length)	{$li.show();} //if the chooser has already been opened, this category may already be loaded.
							else	{$li.find('span:first').trigger('click');} //category hasn't been loaded yet, trigger a click.
							}
						$chooser.hideLoading();
						if($chooser.data('categoryselect') == 'primary') {
							$ItemSpecificsArea.ebaySpecificsFormBuild(leafData);
							_app.u.handleAppEvents($chooser);
							$("[data-categoryid='"+categoryid+"']:first",$chooser).addClass('activeListItem');
							$('form[name=APIForm]').show(); //form is hidden by default
							// chooser block can become long when you browse the category tree
							// and ItemSpecificsForm appears on the top -> scroll there
							$('#ebayCategoryChooser').animate({ scrollTop:0 }, 600);
							}
						}
					}},'mutable');
				_app.model.dispatchThis('mutable');
				}
			}},'mutable');
	_app.model.dispatchThis('mutable');
	}
else if(!data.pid)	{
	$messageDiv.anymessage({'message':'In admin_marketplace.u.ebayShowTreeByChild, unable to ascertain data.pid. Expected on $(#ebayCategoryChooser).data(pid).','gMessage':true});
	_app.u.dump("This is data() from $(#ebayCategoryChooser): "); _app.u.dump(data);
	}
else	{
	$messageDiv.anymessage({'message':'Please choose a category from the list.'})
	}


						}
					else	{
						
						$messageDiv.anymessage({'message':'In admin_marketplace.u.ebayShowTreeByChild,no categoryid passed.','gMessage':true});
						
						}
					}, //ebayShowTreeByChild

			ebayKISSInspectObject : function($object,$objectInspector)	{
				if($object instanceof jQuery && $objectInspector instanceof jQuery)	{

					var data = $object.data(), r = "<ul class='listStyleNone noPadOrMargin'>";

					if(data.object)	{
						for(index in data)	{
							r += "<li>"+index+": "+data[index]+"<\/li>";
							}
						}
					else	{
						r += "<li>This object is not dynamic<\/li>";
						}
					
					r += "<li>tag type: "+$object.get(0).tagName+"<\/li>";

					if($object.is('img'))	{
						r += "<li>width: "+($object.attr('width') || $object.width())+"<\/li>";
						r += "<li>height: "+($object.attr('height') || $object.height())+"<\/li>";
						}

					$objectInspector.empty().append(r)
					r += "<\/ul>";

					}
				else	{
					$('#globalMessaging').anymessage({'message':"In admin_marketplace.u.handleWizardProgressBar, either object ["+$object instanceof jQuery+"] or objectInspector ["+$objectInspector instanceof jQuery+"] were not valid jquery objects.",'gMessage':true});
					}
				},


			
//executed when 'save' or 'test' is pushed in the ebay launch profile editor.
//loads all the data from the form into a json object, including proper formatting of the data-tables for shipping services.
//NOTE - 'update' is a destructive process in this case.
			ebayProfileUpdateOrTest : function(mode,$form)	{


if(mode == 'test' || mode == 'update')	{

	var
		CMD = (mode == 'test') ? 'adminEBAYProfileTest' : 'adminEBAYProfileUpdate',
		$tab = $(_app.u.jqSelector('#',_app.ext.admin.vars.tab+'Content')),
		sfo = $form.serializeJSON({'cb':true});

					$tab.showLoading({'message':(mode == 'test' ? 'Testing Launch Profile Settings' : 'Saving Launch Profile')});

					//the domestic and international shipping sections use the 'data table' technology.
					//their contents need formatted and saved to the serialized form object.
					function setShippingServices(type)	{
						//type needs to be 'dom' or 'int'
						// @ship_domservices  @ship_intservices
						var $shipping = $("[data-app-role='ebayShippingTbody_"+type+"']:first",$form).find('tr');
						if($shipping.length)	{
							sfo['@ship_'+type+'services'] = new Array();
							$shipping.each(function(index){
//								_app.u.dump(" -> index: "+index);
								var
									$tr = $(this),
									data = $tr.data();
									obj = {
										"service" : data.service,
										"free" : data.free,
										"cost" : data.cost,
										"addcost" : data.addcost
										}
								
								
//international has no farcost (AK+HI)
								if(type == 'dom')	{
									obj.farcost = data.farcost
									}
								
								if(!$tr.hasClass("rowTaggedForRemove")) {sfo['@ship_'+type+'services'].push(obj);}
								if(sfo['@ship_'+type+'services'].length >= 4)	{return false} //exit now. only 4 allowed.
								})
							}
						}
					
					setShippingServices('dom');
					if(sfo['InternationalShipping\\@BOOLEAN'] == 1)	{
						setShippingServices('int');
						}
					else	{
//international shipping is disabled, so nuke all international settings. This is how eBay wants the data (empty if disabled)
						sfo['Item\\ShipToLocations\\@ARRAY'] = [];
						sfo['Item\\ShippingDetails\\InternationalInsuranceDetails\\InsuranceOption'] = "";
						sfo['Item\\ShippingDetails\\InternationalInsuranceDetails\\InsuranceFee@CURRENCY'] = "";
						sfo['@ship_intservices'] = [];
						}
//form inputs used in shipping. shouldn't be saved into the profile. Won't hurt, but let's keep it clean.
delete sfo.cost
delete sfo.farcost
delete sfo.service
delete sfo.addcost
delete sfo.free

//_app.u.dump('sfo["Item\\DisableBuyerRequirements\\@BOOLEAN"]: '+sfo["Item\\DisableBuyerRequirements\\@BOOLEAN"]); _app.u.dump(sfo);
if(sfo["Item\\DisableBuyerRequirements\\@BOOLEAN"] == 0)	{
	for(index in sfo)	{
		if(index.indexOf('BuyerRequirementDetails') >= 0)	{
			delete sfo[index];
			}
		}
	}
// _app.u.dump(sfo);
					sfo._cmd = CMD;
					sfo._tag = {
						'callback' : function(rd)	{
							var dp = rd.datapointer;
							if(!dp && rd._rtag)	{dp = rd._rtag.datapointer}; //depending on whether @msgs has errors, the response format changes.
							$tab.hideLoading();
//for test mode, don't check for errors in the response. the mechanism used to return the profile errors is the same as a potential api error.
//which means rd may be the exact response and data[datapointer] may not be set or the opposite.
								if(mode == 'test')	{
									var
										$D = $("<div \/>",{'title':'Profile '+sfo.PROFILE+' Error Report'}),
										$ul = $("<ul \/>"),
										errs = rd['@MSGS'] || _app.data[dp]['@MSGS'],
										L = errs.length

									for(var i = 0; i < L; i += 1)	{
										$ul.append("<li>"+errs[i]['!']+" "+errs[i]['+']+"<\/li>");
										}
									$ul.appendTo($D);
									$D.append("<p class='hint'>This window can remain open while you make your updates.<\/p>");
									$D.dialog();
									
									}
								else	{
									if(_app.model.responseHasErrors(rd)){
										$('#globalMessaging').anymessage({'message':rd});
										}
									else	{
										_app.ext.admin_marketplace.a.showEBAYLaunchProfileEditor($tab,sfo.PROFILE);
										$('#globalMessaging').anymessage(_app.u.successMsgObject('Your changes have been saved'));
									}
								}
							}
						}
					if(mode == 'test')	{sfo._tag.datapointer = 'adminEBAYProfileTest'}
					_app.model.addDispatchToQ(sfo,'immutable');
					_app.model.dispatchThis('immutable');





	}
else	{
	$('#globalMessaging').anymessage({"message":"In admin_marketplace.u.ebayProfileUpdateOrTest, mode ["+mode+"] is invalid (must be test or update).","gMessage":true});
	}



				}
			
			

			}, //u [utilities]

		e : {


/*
let ebay compute costs
-> show option for FEDEX UPS or USPS
if checked hide cost, addcost, farcost
if unchecked AND UPS|FEDEX show cost, addcost, farcost
if unchecked AND USPS show cost, addcost   (there is no farcost for USPS)
[11:58:58 AM] Brian Horakh: if anyother service is selected then show cost, addcost, farcost
*/
		EBAYShipServiceChange : function($ele)	{
			$ele.off('change.EBAYShipServiceChangeToggle').on('change.EBAYShipServiceChangeToggle',function(){
				var $option = $('option:selected',$ele);
				if($option.data('ebay-carrier') == 'UPS' || $option.data('ebay-carrier') == 'USPS' || $option.data('ebay-carrier') == 'FEDEX'){
					$("[name='costComputation']",$ele.closest('fieldset')).attr('disabled','').removeAttr('disabled');
					if($option.data('ebay-carrier') == 'USPS')	{
						$("input[name='farcost']",$ele.closest('fieldset')).attr('disabled','disabled');
						}
					//
					}
				else	{
					$("[name='costComputation']",$ele.closest('fieldset')).attr('disabled','disabled').val('custom').trigger('change'); //disable the selector, but set selected val to custom to indicate further data entry necessary.
					$("input[name='farcost']",$ele.closest('fieldset')).attr('disabled','').removeAttr('disabled'); //this may have been hidden if USPS had been selected.
					}
				});
			},

		EBAYShipcostComputationChange : function($ele)	{
			$ele.off('change.EBAYShipServiceChangeToggle').on('change.EBAYShipServiceChangeToggle',function(){
				if($ele.val() == 'ebay' || $ele.val() == 'product')	{
					$("[data-app-role='addlCostInputContainer']",$ele.closest('fieldset')).hide();
					if($ele.val() == 'product')	{
						$("[name='cost']",$ele.closest('fieldset')).val('-1');
						$("[name='addcost']",$ele.closest('fieldset')).val('-1');
						}
					else if($ele.val() == 'ebay')	{
						$("[name='cost']",$ele.closest('fieldset')).val('');
						$("[name='addcost']",$ele.closest('fieldset')).val('');
						}
					}
				else	{
					$("[data-app-role='addlCostInputContainer']",$ele.closest('fieldset')).show();
					}
				});
			},

/*
run when the 'save' button is pushed in the ebay category/item specifics modal.
 1. jquery.ebay-specifics-form.js -> ebaySpecificsFormSave() is launched - validates the whole form and returns
    a string ready-to-save into ebay:itemspecifics
 2. specifics string is passed to adminProductUpdate -> ebay:itemspecifics
 3. the category id is set.
after that cmd is sent, the modal is closed and the original input is updated. If path was passed as the third param in showEBAYCategoryChooserInModal, it is also updated.
*/			
			ebaySaveCatAndUpdateItemSpecifics : function($btn)	{
				$btn.button();
				$btn.off('click.ebayUpdateItemSpecifics').on('click.ebayUpdateItemSpecifics',function(){
					var
						$chooser = $('#ebayCategoryChooser'),
						data = $chooser.data(),
						categoryid = $chooser.data('categoryid'),
						$form = $btn.closest('form');
					var $ItemSpecificsArea = $("[data-app-role='ebayItemSpecificsContainer']",$chooser);
					
					var res = $ItemSpecificsArea.ebaySpecificsFormSave();

					if(data.pid && data.categoryselect && data.inputid && categoryid && !res.error)	{
						
						// let say - previously user saved something to ebay:itemspecifics
						// and now he reviews and wants to save the *empty* item specifics, but
						// if we just pass "SET-EBAY?itemspecifics=" to adminProductUpdate - nothing happens...
						// so let's pass "SET-EBAY?itemspecifics=\n" there (URI encoded of course)
						if(!res.specificsStr || !res.specificsStr.length) { res.specificsStr = "\n"; }
						
						$chooser.showLoading({'message':'Saving changes'});
						var obj = {
							'_cmd' : 'adminProductUpdate',
							'@updates' : new Array(),
							'pid' : data.pid,
							'_tag' : {
								'callback' : function(responseData){ //didn't use rd as param name here just to avoid confusion.
									if(_app.model.responseHasErrors(responseData)){
										$form.anymessage({'message':responseData})
										}
									else	{
										$('#ebayCategoryChooser').dialog('close');
										}
									}
								}
							}

						/*if($("[data-app-role='ebayCategoryChooserItemSpecificsFieldset']",$form).find('.inputContainer').length)	{
							_app.u.dump(" -> there are item specifics. add a macro.");
							obj['@updates'].push(_app.ext.admin_marketplace.u.buildItemSpecificsMacro());
							}*/
						
						//set the category.
						obj['@updates'].push("SET-EBAY?category"+(data.categoryselect == 'primary' ? '' : 2)+"="+categoryid);
						
						// set ebay:itemspecifics
						obj['@updates'].push("SET-EBAY?itemspecifics="+encodeURIComponent(res.specificsStr));

						if(data.pathid)	{
							var path = _app.ext.admin_marketplace.u.buildEBAYCategoryPath(categoryid);
							if(path)	{ 
								$(_app.u.jqSelector('#',data.pathid)).text(path);
								}
							else	{
								$('.appMessaging').anymessage({"message":"In admin.u.handleEBAYChildren, unable to determine path for categoryid. As long as the category ID populated the form as needed, this is not a big deal. Dev: see console for details."});
								}
							}

						//update the original input.
						$(_app.u.jqSelector('#',data.inputid)).val(categoryid).addClass('edited');
						_app.ext.admin.u.handleSaveButtonByEditedClass($(_app.u.jqSelector('#',data.inputid)).closest('form')); //updates the save button change count.
						
						_app.model.destroy("adminEBAYCategory|"+_app.model.version+"|"+data.pid+"|0"); //this data changes as a result of the product update.
						// ^ this works??
						
						// Bl***dy h*ll, CACHING!!! I saved the form, returned to review it - and OLD data is there!
						// because it sits in localStorage and _app.data as 'adminEBAYCategory|cat|cat|pid'
						if(window.localStorage) {
							$.each(window.localStorage, function(key,value) {
									if(key.search(/adminEBAYCategory/i) != -1) {
										delete window.localStorage[key];
										}
								});
							}
						if(_app.data) {
							$.each(_app.data, function(key,value) {
									if(key.search(/adminEBAYCategory/i) != -1) {
										delete _app.data[key];
										}
								});
							}

						//_app.u.dump(" OBJ: "); _app.u.dump(obj);
						_app.model.addDispatchToQ(obj,'immutable');			
						_app.model.dispatchThis('immutable');
						}
					else if(!data.pid || !data.categoryselect || !data.inputid || !categoryid)	{
						$form.anymessage({'message':'In admin_marketplace.e.ebaySaveCatAndUpdateItemSpecifics, unable to ascertain the pid ['+data.pid+'] and/or categoryselect ['+data.categoryselect+'] and/or categoryid ['+categoryid+'] , expected to find them on $(\'#ebayCategoryChooser\').data()','gMessage':true});
						}
					});
				}, //ebaySaveCatAndUpdateItemSpecifics
			
			ebayLaunchProfileDeleteConfirm : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.ebayLaunchProfileDeleteConfirm').on('click.ebayLaunchProfileDeleteConfirm',function(event){
					event.preventDefault();
					var 
						$tr = $btn.closest('tr'),
						data = $tr.data();

					_app.ext.admin.i.dialogConfirmRemove({
						"title" : "Delete Profile "+data.profile,
						"removeButtonText" : "Delete Profile",
						"message" : "Please confirm that you want to delete the  launch  profile: "+data.profile+" . There is no undo for this action.",

						'removeFunction':function(vars,$D){
							$D.showLoading({"message":"Deleting Launch Profile "+data.profile});
							_app.model.addDispatchToQ({
								'_cmd':'adminEBAYProfileRemove',
								'PROFILE': data.profile,
								'_tag':	{
									'callback':function(rd){
									$D.hideLoading();
									if(_app.model.responseHasErrors(rd)){
										$('#globalMessaging').anymessage({'message':rd});
										}
									else	{
										$D.dialog('close');
										$('#globalMessaging').anymessage(_app.u.successMsgObject('The profile has been removed.'));
										$tr.empty().remove(); //removes row for list.
										}
									}
								}
							},'immutable');
							_app.model.dispatchThis('immutable');
							}
						});
					});
				}, //ebayLaunchProfileDeleteConfirm

			ebayLaunchProfileCreateShow : function($btn)	{
				$btn.button();
				$btn.off('click.ebayLaunchProfileCreateShow').on('click.ebayLaunchProfileCreateShow',function(event){
					event.preventDefault();
					var $D = _app.ext.admin.i.dialogCreate({
						'title' : 'Create new eBay Launch Profile'
						});
					
					$D.dialog('option','width','350');
					var 
						$input = $("<input name='PROFILE' placeholder='profile name' value='' maxlength='8' type='text' \/>"),
						$button = $("<button>Create<\/button>").button();

					$input
						.on('keyup',function(){
							$(this).val($(this).val().toUpperCase()); //value needs to be uppercase.
							})
						.off('keypress.alphaNumeric').on('keypress.alphaNumeric',function(event){
							return _app.u.alphaNumeric(event); //disable all special characters
							})
						.addClass('marginBottom');

					$button.on('click',function(event){
						event.preventDefault();
						if($D.find('.ui-widget-anymessage').length)	{$D.anymessage('close')} //clear any existing error messages.
						if($input.val())	{
							var profile = $input.val();
							if(profile.length < 9 && profile.length > 3)	{
								$D.showLoading({'message':'Creating profile '+profile});
								_app.model.addDispatchToQ({
									'_cmd' : 'adminEBAYProfileCreate',
									'PROFILE' : profile,
									'_tag' : {
										'callback' : function(rd){
											if(_app.model.responseHasErrors(rd)){
												$D.anymessage({'message':rd});
												}
											else	{
												$D.hideLoading();
												$D.dialog('close');
												_app.ext.admin_marketplace.a.showEBAYLaunchProfileEditor($(_app.u.jqSelector('#',_app.ext.admin.vars.tab+'Content')),profile);
												}
											}
										}
									},'immutable');
								_app.model.dispatchThis('immutable');	
								}
							else	{
								$D.anymessage({"message":"Profile name must be between 4 and 8 characters."});
								}
							}
						else	{
							$D.anymessage({"message":"Please enter a profile name"});
							}
						});
					
					$("<form \/>").append($input).append("<span class='hint'>4-8 characters<\/span><br>").append($button).appendTo($D);
					
					$D.dialog('open');
					});
				}, //ebayLaunchProfileCreateShow

			ebayLaunchProfileRefreshListingsExec : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-refresh"},text: false});
				$btn.off('click.ebayLaunchProfileRefreshListingsExec').on('click.ebayLaunchProfileRefreshListingsExec',function(){

					_app.ext.admin_batchjob.a.adminBatchJobCreate({
						'guid' : _app.u.guidGenerator(),
						'profile' : $btn.closest('tr').data('profile'),
						'function' : 'refresh',
						'type':'UTILITY/EBAY_UPDATE',
						'%vars':{'function':'refresh','profile':$btn.closest('tr').data('profile')}
						});	

					})
				}, //ebayLaunchProfileRefreshListingsExec


			ebayRefreshStoreCategoriesExec : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-refresh"},text: false});
				$btn.off('click.ebayRefreshStoreCategoriesExec').on('click.ebayRefreshStoreCategoriesExec',function(){
					var $tab = $(_app.u.jqSelector('#',_app.ext.admin.vars.tab+'Content'));
					$tab.showLoading({'message':'Fetching catgories from eBay'});
					_app.model.addDispatchToQ({
						'_cmd' : 'adminEBAYMacro',
						'@updates' : ["LOAD-STORE-CATEGORIES?eias="+$btn.closest('tr').data('ebay_eias')],
						'_tag' : {
							'callback' : 'showMessaging',
							'jqObj' : $tab,
							'message' : 'Your eBay store categories have been updated.'
							}
						},'immutable');
					_app.model.dispatchThis('immutable');	
					});
				}, //ebayRefreshStoreCategoriesExec


//executed on click in file chooser portion of the template editor (in jhtml toolbar add image)
			ebayHTMLEditorAddImage : function($ele,vars)	{
				$ele.off('click.ebayHTMLEditorAddImage').on('click.ebayHTMLEditorAddImage',function(){
 // Insert an Image by URL
       				vars.jhtmlobject.image($ele.closest("[data-name]").data('Name'));
					$('#ebayTemplateEditorImageListModal').dialog('close');
					});
				},


			ebayLaunchProfileUpdateTestExec : function($btn)	{
				$btn.button();
				$btn.off('click.ebayLaunchProfileUpdateTestExec').on('click.ebayLaunchProfileUpdateTestExec',function(event){
					event.preventDefault();
					_app.ext.admin_marketplace.u.ebayProfileUpdateOrTest($btn.data('mode'),$btn.closest('form'))
					});
				}, //ebayLaunchProfileCreateUpdateExec

			ebayLaunchProfileUpdateShow : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				if(Number($btn.closest('tr').data('v')) === 0)	{
					$btn.button('disable');
					}
				$btn.off('click.ebayLaunchProfileUpdateShow').on('click.ebayLaunchProfileUpdateShow',function(){
					var $table = $btn.closest('table');
//build the stickytab, if necessary.
					if($btn.closest('.ui-widget-stickytab-content').length)	{} //already in a sticky tab
					else if($('#stickytabs').children().length)	{} //not clicked from the sticky tab, but the tab is already open.
					else	{
//make sure buttons and links in the stickytab content area close the sticktab on click. good usability.
						$table.stickytab({'tabtext':'Launch Profiles','tabID':'launchProfilesStickyTab'});
						$table.off('click.stickytab').on('click.stickytab','button, a',function(e){
							e.preventDefault();
							$table.stickytab('close');
							})
						}
//now show the editor.  This must happen after stickytab generation or the click events on the row buttons in the table get dropped.
					_app.ext.admin_marketplace.a.showEBAYLaunchProfileEditor($(_app.u.jqSelector('#',_app.ext.admin.vars.tab+'Content')),$btn.closest('tr').data('profile'));
					
					});
				}, //ebayLaunchProfileUpdateShow
/*
// ### FUTURE -> at 201412ish, remove this. legacy launch profile support was 201346
			ebayLaunchProfileUpgradeConfirm : function($btn)	{
				var data = $btn.closest('tr').data();
				if(Number(data.v) === 0)	{
					$btn.button();
					$btn.off('click.ebayTokenDeleteConfirm').on('click.ebayTokenDeleteConfirm',function(event){
						//confirm dialog goes here.
						event.preventDefault();
						
						
	
						_app.ext.admin.i.dialogConfirmRemove({
							"title" : "Upgrade launch profile: "+data.profile,
							"removeButtonText" : "Upgrade Profile",
							"message" : "The upgrade process is new. Please perform this on a launch profile that is infrequently used or create a new profile and point your product to that one. Immediately test after upgrade.",
							'removeFunction':function(vars,$D){
								$D.showLoading({"message":"Upgrading profile "+data.profile});
								_app.model.addDispatchToQ({
									'_cmd':'adminEBAYMacro',
									'@updates': ["PROFILE-UPGRADE?PROFILE="+data.profile],
									'_tag':	{
										'callback':function(rd){
										$D.hideLoading();
										if(_app.model.responseHasErrors(rd)){
											$('#globalMessaging').anymessage({'message':rd});
											}
										else	{
											$D.dialog('close');
											_app.ext.admin_marketplace.a.showEBAYLaunchProfileEditor($(_app.u.jqSelector('#',_app.ext.admin.vars.tab+'Content')),data.profile,{'fromupgrade':true});
//											_app.ext.admin_marketplace.a.showEBAY($btn.closest("[data-app-role='slimLeftContentSection']"));
											}
										}
									}
								},'immutable');
								_app.model.dispatchThis('immutable');
								}
							});
						});
					}
				else	{
					$btn.hide();
					} //already upgraded. don't show button.
				}, //ebayLaunchProfileUpgradeConfirm
			*/
			ebayAddCustomDetailShow : function($btn)	{

				$btn.button();
				$btn.off('click.ebayAddCustomDetailShow').on('click.ebayAddCustomDetailShow',function(){
					var
						$fieldset = $btn.closest('fieldset'),
						numInputs = $('.inputContainer',$fieldset).length || 0;
					
					$btn.after("<div class='inputContainer marginTop'><input type='text' placeholder='Detail Title' value='' name='cs_name"+numInputs+"' class='marginRight' \/><input type='text' placeholder='Detail Value' value='' name='cs_value"+numInputs+"' \/><\/div>");
					});

				}, //ebayAddCustomDetailShow
				
			ebayShowTreeByChild : function($ele)	{
				$ele.children().first().attr({'disabled':'disabled','selected':'selected'});
				$ele.off('change.ebayShowTreeByChild').on('change.ebayShowTreeByChild',function(){
					_app.ext.admin_marketplace.u.ebayShowTreeByChild($ele.val());
					});
				}, //ebayShowTreeByChild

			ebayTokenDeleteConfirm : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.ebayTokenDeleteConfirm').on('click.ebayTokenDeleteConfirm',function(event){
					//confirm dialog goes here.
					event.preventDefault();
					
					var data = $btn.closest('tr').data();

					_app.ext.admin.i.dialogConfirmRemove({
						"title" : "Delete Token for "+data.ebay_username,
						"removeButtonText" : "Delete Token",
						"message" : "Please confirm that you want to delete the token. There is no undo for this action.",
						'removeFunction':function(vars,$D){
							$D.showLoading({"message":"Deleting eBay token "+data.ebay_eias});
							_app.model.addDispatchToQ({
								'_cmd':'adminEBAYMacro',
								'@updates': ["TOKEN-REMOVE?eias="+data.ebay_eias],
								'_tag':	{
									'callback':function(rd){
									$D.hideLoading();
									if(_app.model.responseHasErrors(rd)){
										$('#globalMessaging').anymessage({'message':rd});
										}
									else	{
										$D.dialog('close');
										$('#globalMessaging').anymessage(_app.u.successMsgObject('Your token has been removed.'));
										_app.ext.admin_marketplace.a.showEBAY($ele.closest("[data-app-role='slimLeftContentSection']"));
										}
									}
								}
							},'immutable');
							_app.model.dispatchThis('immutable');
							}
						});


					});
			
				}, //ebayTokenDeleteConfirm
			
			ebayTokenDeleteButtonset : function($ele)	{
				
				$('button',$ele).button();
				var $menu = $ele.next('ul');
				$menu.css({'position':'absolute','width':'200'}).menu().hide();
				
				$('button:first',$ele).off('click.ebayTokenDeleteConfirm').on('click.ebayTokenDeleteConfirm',function(event){
					event.preventDefault();
					$(this).next('button').trigger('click');
					return false; //here so that the 'one' in the next button doesn't get triggered by this click.
					})
				$('button:last',$ele).button({'text' : false, icons : {'primary':'ui-icon-triangle-1-s'}}).off('click.ebayTokenDeleteConfirm').on('click.ebayTokenDeleteConfirm',function(event){
					event.preventDefault();
					_app.u.dump("Click triggered.");
					$menu.show().position({
						my: "right top",
						at: "right bottom",
						of: this
						});
					$(document).one( "click", function() {
						$menu.hide();
						});
					return false;
					});
				$ele.buttonset();
				
				}, //ebayTokenDeleteButtonset

			ebayTokenVerify : function($btn)	{
				$btn.button();
				$btn.off('click.ebayTokenVerify').on('click.ebayTokenVerify',function(){
					//get a token and use that in the redirect to ebay.					
					_app.model.addDispatchToQ({
						'_cmd':'adminPartnerSet',
						'partner' : 'EBAY',
						'SessionID' : _app.data.adminPartnerGet.SessionID,
						'RuName' : _app.data.adminPartnerGet.RuName,
						'_tag':	{
							'datapointer' : 'adminPartnerSet',
							'callback':function(rd){
								if(_app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									$('#globalMessaging').anymessage({'message':'eBay authorization is now complete.','errtype':'success'});
									//reload the ebay interface so that presence of valid token enables UI as needed.
									_app.ext.admin_marketplace.a.showDSTDetails($btn.closest("[data-app-role='slimLeftContentSection']"),{'DST':'EBF'})
									}
								}
							}
						},'mutable');
					_app.model.dispatchThis('mutable');						
					})
				},


			ebayTokenLinkTo : function($btn)	{
				$btn.button();
				$btn.off('click.ebayGetToken').on('click.ebayGetToken',function(){
//get a token and use that in the redirect to ebay.					
_app.model.addDispatchToQ({
	'_cmd':'adminPartnerGet',
	'partner' : 'EBAY',
	'_tag':	{
		'datapointer' : 'adminPartnerGet',
		'callback':function(rd){
			if(_app.model.responseHasErrors(rd)){
				$('#globalMessaging').anymessage({'message':rd});
				}
			else	{
				if(_app.data[rd.datapointer].SessionID && _app.data[rd.datapointer].RuName)	{
				//show the button the user needs to click. disable the rest to avoid confusion.
					$btn.parent().find('button').button('disable').end().find("button[data-app-event='admin_marketplace|ebayTokenVerify']").button('enable').show().end().anymessage({'message':'Upon returning from eBay, you MUST push the complete authorization button below to finish the process','errtype':'todo','persistent':true});
					//no, that's not a typo, ebay is expecting SessID. We left it as SessionID because that's how it is referred to EVERYWHERE else.
					linkOffSite(($btn.data('sandbox') == 1 ? 'https://signin.sandbox.ebay.com' : 'https://signin.ebay.com') + '/ws/eBayISAPI.dll?SignIn&RuName='+_app.data[rd.datapointer].RuName+'&SessID='+encodeURIComponent(_app.data[rd.datapointer].SessionID),'ebay.com to continue this registration process','',true);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'The response for appPartnerGet did not include SessionID ['+_app.data[rd.datapointer].SessionID+'] and/or RuName ['+_app.data[rd.datapointer].RuName+']. Both are required.','gMessage':true,'errtype':'fail-soft'});
					}
				}
			}
		}
	},'mutable');
_app.model.dispatchThis('mutable');					

					});
				}, //ebayTokenLinkTo

			amazonMWSLinkTo : function($btn)	{
				$btn.button();
				$btn.off('click.amazonMWSLinkTo').on('click.amazonMWSLinkTo',function(event){
					event.preventDefault();
					window.location = "https://sellercentral.amazon.com/gp/maws/maws-registration.html?ie=UTF8&amp;id=APF889O5V4GVL&amp;userType=web&amp;returnUrl="
					+ encodeURIComponent(window.location.href.split('?')[0]+"?linkFrom=amazon-token&PRT="+_app.vars.partition)
					});
				}, //amazonMWSLinkTo

//clicked when editing an option for a 'select' type. resets and populates inputs so option can be edited.
			amazonThesaurasEdit : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});

				$btn.off('click.variationUpdateShow').on('click.variationUpdateShow',function(){
					var $tr = $btn.closest('tr');
//guid is required for 'edit' and dataTable.
					if($tr.data('guid'))	{} //already has a guid, do nothing.
					else	{$tr.attr('data-guid',_app.u.guidGenerator())} 
					
					$btn.closest('fieldset').find('input, textarea').val("");
					$btn.closest('fieldset').find("[data-app-role='thesaurusDataTableInputs']").anycontent({'data':$tr.data()}).find(':checkbox:data(anycb)').anycb('update');
					})
				}, //variationOptionUpdateShow

			showDSTDetail : function($ele)	{
				$ele.off('click.showDSTDetail').on('click.showDSTDetail',function(){
					var $mktContainer = $ele.closest("[data-app-role='syndicationContainer']").find("[data-app-role='slimLeftContentSection']").first();
					$ele.closest("[data-app-role='slimLeftNav']").find('.selectedMarket').removeClass('selectedMarket');
					$ele.addClass('selectedMarket ui-corner-all');

					if($ele.data('mkt'))	{
						_app.ext.admin_marketplace.a.showDSTDetails($mktContainer,{'DST':$ele.data('mkt')})
						}
					else	{
						$mktContainer.anymessage({"message":"In admin_marketplace.e.showDSTDetail, unable to determine mkt.","gMessage":true});
						}
					});
				}, //showDSTDetail


			ebayServiceAddShow : function($ele,P)	{
				$ele.hide().closest('fieldset').find("[data-app-role='addServiceInputs']").slideDown();
				}, //ebayServiceAddShow


			ebayBuyerRequirementsToggle : function($ele)	{
				function handleSelect()	{
					if($ele.val() == 1)	{
						$('.toggleThis',$ele.closest('fieldset')).show();
						}
					else	{
						$('.toggleThis',$ele.closest('fieldset')).hide();
						}
					}
				handleSelect();
				$ele.off('change.ebayBuyerRequirementsToggle').on('change.ebayBuyerRequirementsToggle',function(){
					handleSelect();
					});
				}, //ebayBuyerRequirementsToggle

			ebayInternationalShippingToggle : function($ele)	{
				// I have no idea why this doesn't work.
				function handleClick()	{
					if ($ele.is(":checked"))	{
						$('.eBayIntShippingToggle',$ele.closest('.ui-widget-content')).show();
						}
					else	{
						$('.eBayIntShippingToggle',$ele.closest('.ui-widget-content')).hide();
						$('.eBayItemShipToLocations option:selected',$ele.closest('.ui-widget-content')).prop('selected','');
						}
					}
				handleClick();
				$ele.off('click.ebayInternationalShippingToggle').on('click.ebayInternationalShippingToggle',function(){
					handleClick();
					});
				}, //ebayInternationalShippingToggle

			ebayReturnsToggle : function($ele)	{
				function handleSelect()	{
					if($ele.val() == 'ReturnsAccepted')	{
						$('.toggleThis',$ele.closest('fieldset')).show();
						}
					else	{
						$('.toggleThis',$ele.closest('fieldset')).hide();
						}
					}
				handleSelect();
				$ele.off('click.hideInputsByCheckbox').on('click.hideInputsByCheckbox',function(){
					handleSelect();
					});
				}, //ebayBuyerRequirementsToggle

			ebayAutopayToggle : function($ele)	{
				function handleCB()	{
					if($ele.is(':checked'))	{
						$("[data-app-role='eBayPaymentMethods']",$ele.closest('fieldset')).hide();
						$("[data-app-role='AutoPayPaymentMethods']",$ele.closest('fieldset')).show();
						}
					else	{
						$("[data-app-role='eBayPaymentMethods']",$ele.closest('fieldset')).show();
						$("[data-app-role='AutoPayPaymentMethods']",$ele.closest('fieldset')).hide();
						}
					}
				handleCB();
				$ele.off('click.hideInputsByCheckbox').on('click.hideInputsByCheckbox',function(){
					handleCB();
					});
				}, //ebayBuyerRequirementsToggle
				
				
			ebayTaxToggle : function($ele)	{
				function handleCB()	{
					if($ele.is(':checked'))	{
						$("[data-app-role='ebayTaxToggleContent']",$ele.closest('fieldset')).hide();
						}
					else	{
						$("[data-app-role='ebayTaxToggleContent']",$ele.closest('fieldset')).show();
						}
					}
				handleCB();
				$ele.off('click.hideInputsByCheckbox').on('click.hideInputsByCheckbox',function(){
					handleCB();
					});
				}, //ebayBuyerRequirementsToggle

			adminSyndicationMacroExec : function($btn)	{
				$btn.button();
				$btn.off('click.adminSyndicationMacroExec').on('click.adminSyndicationMacroExec',function(){
					var $form = $btn.closest('form');
					if(_app.u.validateForm($form))	{
						
						var macros = new Array(),
						$form = $btn.closest('form'),
						sfo = $form.serializeJSON({'cb':true}) || {},
						DST = sfo.DST; //shortcut.
						
						if(DST)	{
							for(var index in sfo)	{
								if(index == 'ENABLE')	{
									if(sfo[index] >= 1)	{macros.push("ENABLE")}
									else	{macros.push("DISABLE")}	
									}
								else	{
									//no other special treatment... yet
									}
								}

							macros.push("SAVE?"+$.param(sfo));

							if(DST == 'AMZ')	{
								$('tr.edited',$form).each(function(){
									var $tr = $(this);
									if($tr.hasClass('rowTaggedForRemove') && $tr.hasClass('isNewRow'))	{
										$tr.empty().remove();
										//if it's a new row that was deleted before a save occured, no macro needed to remove it.
										}
									else if($tr.hasClass('rowTaggedForRemove'))	{
										macros.push("AMZ-THESAURUS-DELETE?guid="+$tr.data('guid'));
										$tr.empty().remove();
										}
									else if($tr.hasClass('isNewRow'))	{
										//  getWhitelistedObject
										if(!$tr.data('guid'))	{
											$tr.data('guid',_app.u.guidGenerator())
											}
										macros.push("AMZ-THESAURUS-SAVE?"+$.param(_app.u.getWhitelistedObject($tr.data(),['guid','name','itemtype','isgiftwrapavailable','isgiftmessageavailable','subjectcontent','targetaudience','search_terms']))); //THID is not in whitelist because data saves it as lowercase and we need it upper.
										}
									else	{
										//HUH! shouldn't have gotten here.
										$('#globalMessaging').anymessage({'message':'in admin_marketplace.e.adminSyndicationMacroExec, unknown case for amazon thesaurus. Does not appear to be new or delete, why is it flagged as edited?','gMessage':true});
										}
									});
								}
//							_app.u.dump("macros: "); _app.u.dump(macros);
							$form.showLoading({'message':'Updating Marketplace Settings...'});
							_app.ext.admin.calls.adminSyndicationMacro.init(DST,macros,{'callback':'handleMacroUpdate','extension':'admin_marketplace','jqObj':$form},'immutable');
							_app.model.addDispatchToQ({"_cmd":"adminSyndicationDetail","DST":DST,"_tag":{"datapointer":"adminSyndicationDetail|"+DST}},"mutable");
							_app.model.dispatchThis('immutable');

							}
						else	{
							$form.anymessage({"message":"In admin_marketplace.u.adminSyndicationMacroExec, unable to determine DST ["+DST+"] or macros ["+macros.length+"] was empty","gMessage":true});
							}		
						}
					else	{} //validateForm handles error display.
					});
				}, //adminSyndicationMacroExec

			adminSyndicationUnsuspendMacro : function($btn)	{
				$btn.button();
				$btn.off('click.adminSyndicationUnsuspendMacro').on('click.adminSyndicationUnsuspendMacro',function(){
					DST = $btn.closest("[data-dst]").data('dst');
					if(DST)	{
						_app.ext.admin.calls.adminSyndicationMacro.init(DST,['UNSUSPEND'],{},'immutable');
						_app.model.dispatchThis('immutable');
						}
					else	{
						$form.anymessage({"message":"In admin_marketplace.u.handleDSTDetailSave, unable to determine DST ["+DST+"] or macros ["+macros.length+"] was empty","gMessage":true});
						}
					});
				}, //adminSyndicationUnsuspendMacro

			adminSyndicationUnsuspendAndClearErrorMacro : function($btn)	{
				$btn.button();
				$btn.off('click.adminSyndicationUnsuspendAndClearErrorMacro').on('click.adminSyndicationUnsuspendAndClearErrorMacro',function(){
					var DST = $btn.closest("[data-dst]").data('dst');
					if(DST)	{
						var $tbody = $btn.closest('.ui-tabs-panel').find('tbody')
						$tbody.empty().showLoading({'message':'Clearing errors...'})
						_app.ext.admin.calls.adminSyndicationMacro.init(DST,['UNSUSPEND','CLEAR-FEED-ERRORS'],{'callback' : 'showMessaging','message':'Your errors have been cleared','jqObj':$('#globalMessaging')},'immutable');
						_app.model.addDispatchToQ({"_cmd":"adminSyndicationFeedErrors","DST":DST,"_tag":{
							"datapointer":"adminSyndicationFeedErrors",
							'callback' : 'anycontent',
							'extendByDatapointers' : ['adminPriceScheduleList'],
							'extension':'admin_marketplace',
							'jqObj':$tbody}},"immutable");
						_app.model.dispatchThis('immutable');
						}
					else	{
						$btn.closest('section').anymessage({"message":"In admin_marketplace.u.handleDSTDetailSave, unable to determine DST ["+DST+"] or macros ["+macros.length+"] was empty","gMessage":true});
						}
					});
				}, //adminSyndicationUnsuspendAndClearErrorMacro

			adminSyndicationPublishExec : function($btn)	{
				$btn.button();
				var
					$form = $btn.closest('form'),
					DST = $("[name='DST']",$form).val();
					
//the markeplace must be enabled prior to publishing. That change needs to be saved, then the button will unlock.
//that ensures all information required for syndication is provided.
				if(DST && _app.data['adminSyndicationDetail|'+DST])	{
					if(Number(_app.data['adminSyndicationDetail|'+DST].enable) >= 1)	{
						$btn.button('enable');
						}
					else	{
						$btn.button('disable');
						}
					}
				//"adminSyndicationPublish"
				$btn.off('click.adminSyndicationPublishExec').on('click.adminSyndicationPublishExec',function(){
					var sfo = $form.serializeJSON({'cb':true});
					
					if(sfo.DST)	{
						if(sfo.ENABLE)	{
							if(_app.u.validateForm($form))	{
								$form.showLoading({"message":"Creating batch job for syndication feed publication..."});
								
								_app.model.addDispatchToQ({
									'_cmd' : 'adminSyndicationPublish',
									'DST' : sfo.DST,
									'FEEDTYPE' : 'PRODUCT',
									'_tag' : {
										'callback':'showBatchJobStatus',
										'extension':'admin_batchjob',
										'datapointer' : 'adminBatchJobStatus',
										'jqObj':$form}
									},'immutable');
								_app.model.dispatchThis('immutable');
								}
							else	{} //validate form handles display errors.

							}
						else	{
							$form.anymessage({"message":"Before you can publish to this marketplace you must enable it."});
							}
						}
					else	{
						$form.anymessage({"message":"In admin.e.adminSyndicationPublishExec, unable to ascertain DST, which is required to proceed.","gMessage":true});
						}
					
					})
				}, //adminSyndicationPublishExec

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
					_app.u.handleCommonPlugins($D);
					$D.dialog('open');

					});
//				
				}, //amazonThesaurusAddShow

			adminSyndicationDebugExec : function($btn)	{
				$btn.button();
				$btn.off('click.adminSyndicationDebugExec').on('click.adminSyndicationDebugExec',function(){
					var
						$form = $btn.closest('form'),
						$container = $btn.closest("[data-app-role='syndicationDetailContainer']"),
						DST = $btn.closest("[data-dst]").data('dst');
					
					if(DST)	{
						if(_app.u.validateForm($form))	{
							var sfo = $form.serializeJSON();
							sfo._cmd = 'adminSyndicationDebug';
							sfo.DST = DST;
							sfo._tag = {
								'datapointer' : 'adminSyndicationDebug', //no need to keep a DST specific debug in memory at this time.
								'callback' : function(rd){
									if(_app.model.responseHasErrors(rd)){
										$container.anymessage({'message':rd})
										}
									else	{
										$("[data-app-role='diagnosticsResultsContainer']",$container).html(_app.data[rd.datapointer]['HTML']);
										}
									}
								}
							_app.model.addDispatchToQ(sfo,"mutable");
							_app.model.dispatchThis('mutable');
							}
						else	{
							//validateForm handles error display.
							}
						}
					else	{
						$form.anymessage({"message":"In admin.e.adminSyndicationDebugExec, unable to ascertain DST, which is required to proceed.","gMessage":true});
						}
					});
				} //adminSyndicationDebugExec
			
			} //e [app Events]
		} //r object.
	return r;
	}