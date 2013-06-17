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
				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/syndication.html',theseTemplates);
				var ebayxsl = $.ajax(app.vars.baseURL+'extensions/admin/resources/syi_attributes.xsl',{
					success : function(data,b,c)	{
						app.ext.admin_syndication.vars.ebayXSL = c.responseText;
						},
					error : function(a,b,c)	{
						app.u.dump("GOT HERE!!!!!!!!!!!!!!!!!");
						app.u.dump(a);
						app.u.dump(b);
						app.u.dump(c);
						}
					})
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
				app.u.dump("BEGIN admin_syndication.callbacks.handleMacroUpdate.onSuccess");
				app.u.dump(" -> typeof _rtag.jqObj: "+typeof _rtag.jqObj);
				var $target;
				if(_rtag && _rtag.jqObj && typeof _rtag.jqObj === 'object')	{
					$target = _rtag.jqObj
					$target.hideLoading();
					}
				else	{
					$target = $('#globalMessaging');
					}
				
				$target.anymessage(app.u.successMsgObject('Your changes have been saved'))

//if everything was successful, revert the form to a pre-change state.
				$("[data-app-role='saveButton']",$target).button('disable').find('.numChanges').text(""); //make save buttons not clickable.
				$('.edited',$target).removeClass('edited'); //revert inputs to non-changed state.

				
				},
			onError : function(rd)	{
				app.u.dump("BEGIN admin_syndication.callbacks.handleMacroUpdate.onError");
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


		a : {
//opens the ebay category chooser in a modal.  
//$input is a jquery object of an input where the category value selected will be set using val();
//vars is an object that needs to contain a pid and a categoryselect.
//eBay allows for a primary and secondary category to be set, however attributes are only set on the primary, so that mode is important.
//var keys are all lower case to allow for easy set via 'data' and consistency.
			showEBAYCategoryChooserInModal : function($input,vars)	{
				vars = vars || {};
				if($input && $input instanceof jQuery)	{
					if(vars.pid && vars.categoryselect == 'primary' || vars.categoryselect == 'secondary')	{
						vars.inputid = null;
						var $D = app.ext.admin.i.dialogCreate({
							'title':'eBay Category Chooser',
							'anycontent' : false
							});

						$D.dialog('open');

						if(vars.inputid = $input.attr('id'))	{} //value for input id is set in if.
						else	{
							vars.inputid = 'ebaycat_'+app.u.guidGenerator();
							$input.attr('id',vars.inputid)
							}
						
						$D.data(vars); //set on dialog so they can be easily located later (on save).
						app.ext.admin.calls.adminEBAYCategory.init({'categoryid':'0','pid':vars.pid},{'callback':'anycontent','jqObj':$D,'templateID' : 'ebayCategoryChooserTemplate'},'mutable');
						app.model.dispatchThis('mutable');
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
				app.ext.admin.calls.adminWholesaleScheduleList.init({},'passive'); //most syndication 'settings' use this. have it handy
				app.model.dispatchThis('passive');

				$target.empty();
				$target.anycontent({'templateID':'pageSyndicationTemplate',data:{}});
				$("[data-app-role='slimLeftNav']",$target).first().accordion();
				app.u.handleAppEvents($target);
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
								var uriParams = app.u.kvp2Array(window.location.href.split('?')[1]);
								app.ext.admin.calls.adminSyndicationMacro.init("AMZ",["AMZ-TOKEN-UPDATE?marketplaceId="+uriParams.marketplaceId+"&merchantId="+uriParams.merchantId+"&amazon-token="+uriParams['amazon-token']],{'callback':function(rd){
									if(app.model.responseHasErrors(rd)){
										$D.anymessage({'message':rd})
										}
									else	{
										$D.empty().anymessage(app.u.successMsgObject('Activation successful!'));
										$D.dialog({ buttons: [ { text: "Close", click: function() { $( this ).dialog( "close" ); } } ] });
										}
									}},'immutable');
								app.model.dispatchThis('immutable');
								}
							else	{
								$D.anymessage({"message":"URL contains no question mark with params. expecting marketplaceId and merchantId.",'gMessage':true});
								}
							}}	
						]
					});
//					$(':checkbox',$D).anycb(); //{'text' : {'on' : 'yes','off':'no'}} //not working in a dialog for some reason.
				$D.dialog('open');
				}, //showAmzRegisterModal

//shows the editor for a given marketplace, by DST code.
			showDSTDetails : function(DST,$target)	{
//				app.u.dump("BEGIN admin_syndication.a.showDSTDetails"); 
				app.ext.admin.calls.adminWholesaleScheduleList.init({},'passive'); //most syndication 'settings' use this. have it handy
				app.model.dispatchThis('passive');

				if($target && DST)	{
//					app.u.dump(" -> $target and DST are set ");

					$target.empty();
					$target.anycontent({'templateID':'syndicationDetailTemplate','data':{},'dataAttribs':{'dst':DST}});

					
					$('.anytabsContainer',$target).anytabs();
//there is a bug either in the tab script or the browser. Even though the container is emptied (i even destroyed the tabs at one point) 
// when the new editor appears, whichever tab was previously selected stays selected. The code below triggers a tab click but not the request code.
					$('.anytabsContainer',$target).find('li:first a').trigger('click.anytabs');
					
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
//	app.u.dump(" -> Tab Click: "+cmd);
//	app.u.dump(" -> $tabContent.length: "+$tabContent.length);
	});


					}
				else if($target)	{
					$target.anymessage({"message":"In admin.a.showDSTDetails, no DST specified.",'gMessage':true});
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.a.showDSTDetails, no DST or target specified.",'gMessage':true});
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
				
				},

//executed when an ebay store category is clicked. It will either load the children or, if the category is a leaf, load the item specifics editor.
//pass in an LI.  expects certain data params to be set on the li itself. specifically 
			handleEBAYChild : function($li)	{
				app.u.dump("BEGIN admin_syndication.u.handleEBAYChild");
				if($li && $li.length && $li.data('categoryid'))	{
					var
						categoryID = $li.data('categoryid'),
						$XSLContentArea = $li.closest("[data-app-role='ebayCategoryChooserTable']").find("[data-app-role='ebayCategoryChooserXSLContainer']"),
						data = $XSLContentArea.closest('.ui-dialog-content').data();
//categoryselect is necessary so that it can be determined whether or not items specifics should be displayed.
					if(data.categoryselect) 	{

//					app.u.dump(" -> categoryID: "+categoryID); app.u.dump(" -> data: "); app.u.dump(data);
						$XSLContentArea.data('categoryid',categoryID);
					
//if the children have already been generated, just toggle them on click (display on/off).
						if($('ul',$li).length)	{
							app.u.dump(" -> toggle");
							//on a toggle, XSLContentArea is not emptied (at this time).
							//already have categories. toggle ul
							$('ul',$li).first().toggle();
							}
						else if(Number($li.data('leaf')) >= 1 && data.categoryselect == 'secondary')	{
							if(data.inputid)	{
								$(app.u.jqSelector('#',data.inputid)).val(categoryID).effect('highlight', {}, 2500);;
								$XSLContentArea.closest('.ui-dialog-content').dialog('close');
								}
							else	{
								$('.appMessaging').anymessage({"message":"In admin.u.loadEBAYChildren, unable to determine inputid. Should be set on XSLContentArea.closest(.ui-dialog-content).data() "});
								}
							}
						else if(Number($li.data('leaf')) >= 1)	{
							app.u.dump(" -> leaf!");
							$('#APIForm').show();
							$XSLContentArea.empty().showLoading({'message':'Fetching item specifics data'});
							app.ext.admin.calls.adminEBAYCategory.init({
								'categoryid' : categoryID,
								'pid' : data.pid,
								'xsl' : app.ext.admin_syndication.vars.ebayXSL
								},{'callback':function(rd){
									if(app.model.responseHasErrors(rd)){
										$XSLContentArea.anymessage({'message':rd})
										}
									else	{
										$XSLContentArea.hideLoading();
										$XSLContentArea.append(app.data[rd.datapointer].html);
										}
									}
								},'mutable');
							app.model.dispatchThis('mutable');
							}
						else	{
							app.u.dump(" -> get subcats");
							$('#APIForm').hide(); //hide item specifics container to avoid confusion.
							$XSLContentArea.empty(); //this will get re-populated on another leaf click.
							var $ul = $("<ul \/>",{'id':'children4_'+$li.data('categoryid'),'data-bind':'var: ebay(@CHILDREN); format: processList; loadsTemplate:ebayCategoryListitemTemplate;'});
							$ul.addClass('noPadOrMargin marginLeft').appendTo($li).showLoading({'message':'Fetching Categories...'});
							app.ext.admin.calls.adminEBAYCategory.init({
								'categoryid':$li.data('categoryid'),
								'pid' : data.pid
								},{'callback':'anycontent','jqObj':$ul},'mutable');
							app.model.dispatchThis('mutable');
							}

						
						}
					else	{
						$('.appMessaging').anymessage({"message":"In admin.u.loadEBAYChildren, unable to determine categoryselect mode. should be primary or secondary and set on XSLContentArea.closest(.ui-dialog-content).data() "});
						}
					
					}
				else	{
					$('.appMessaging').anymessage({"message":"In admin.u.loadEBAYChildren, $li was either not passed, has no length or li.data('id') has no value. DEV: see console for details.","gMessage":true});
					app.u.dump("What follows this is the $li value passed into loadEBAYChildren: "); app.u.dump($li);
					}
				},
			
			
			getUpdatedItemSpecificsForm : function($form)	{
				app.u.dump("BEGIN admin_syndication.u.updateSpecifics");

				var $XSLContentArea = $("[data-app-role='ebayCategoryChooserXSLContainer']",$form);
				
				if($form && $XSLContentArea&& $XSLContentArea.data('categoryid'))	{
				
					$XSLContentArea.showLoading({'message':'Updating item specifics'});



					app.model.addDispatchToQ({
						"_cmd" : "adminEBAYCategory",
						"categoryid" : $XSLContentArea.data('categoryid'),
						"xsl" : app.ext.admin_syndication.vars.ebayXSL,
						"form" : $form.serialize(), //sent as KvP cuz all the checkboxes have the same name. why wouldn't they? #@!%ing ebay.
						"_tag" : {
							'datapointer' : 'adminEBAYCategory|'+app.model.version+'|'+$XSLContentArea.data('categoryid'),
							'callback' : function(rd){
								$XSLContentArea.hideLoading();
								$XSLContentArea.html(app.data[rd.datapointer].html)
								}
							}
						},'mutable');

					app.model.dispatchThis('mutable');
					}
				else	{
					$('#APIForm').anymessage({'message':'In admin_syndication.u.getUpdatedItemSpecificsForm, either $form ['+typeof $form+'] not passed or unable to determine categoryID from XSL content area ['+typeof $XSLContentArea+']','gMessage':true});
					}
				}, //getUpdatedItemSpecificsForm

//The ebay form has cases where there are multiple inputs w/ the same name. so we serialize it into KvP, which doesn't care about that, then do what's needed.
			updateProductItemSpecifics : function(pid,kvp,$context)	{
				var r = false; //what is returned. will be true if a dispatch is added.
				$context = $context || $('#globalMessaging'); //context is used only for error reporting.
				if(pid && kvp)	{
					r = true;
					console.error('NOT DONE'); //!!!

/*					var obj = {};
					obj._cmd = "adminProductUpdate";
					obj.pid = pid;
					obj['%attribs'] = {'ebay:attributeset' : XML};
					app.u.dump(" -> obj: "); app.u.dump(obj);
					app.model.addDispatchToQ(obj,'immutable');
*/

					}
				else	{
					$context.anymessage({'message':'In admin_syndication.u.updateProductItemSpecifics, pid ['+pid+'] and/or KvP string ['+kvp+'] are empty. Both are required.','gMessage':true});
					}
				} //updateProductItemSpecifics
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			
			ebaySaveCatAndUpdateItemSpecifics : function($btn)	{
				$btn.button();
				$btn.off('click.ebayUpdateItemSpecifics').on('click.ebayUpdateItemSpecifics',function(){

				var
					$form = $btn.closest('form'),
					data = $btn.closest('.ui-dialog-content').data();
					
					if(data.pid && data.categoryselect && data.inputid)	{
						var prodWillUpdate = app.ext.admin_syndication.u.updateProductItemSpecifics(data.pid,$form.serialize(),$form);
						var categoryid = $li.closest("[data-app-role='ebayCategoryChooserXSLContainer']").data('categoryid');
						if(prodWillUpdate && categoryid)	{
							$(app.u.jqSelector('#',data.inputid)).val(categoryid);
							//need to do a dispatch here, for the updateProductItemSpecifics. !!!
							}
						else if(!categoryid)	{
							$form.anymessage({'message':'In admin_syndication.e.ebaySaveCatAndUpdateItemSpecifics, unable to ascertain the ebay category id ['+categoryid+'], it will not be set.','gMessage':true})
							}
						else{
							//the updateProductItemsSpecifics will display it's own error messages.
							}
						}
					else	{
						$form.anymessage({'message':'In admin_syndication.e.ebaySaveCatAndUpdateItemSpecifics, unable to ascertain the pid ['+data.pid+'] and/or categoryselect ['+data.categoryselect+'] , expected to find them on .ui-dialog-content.data()','gMessage':true});
						}

					});
				}, //ebaySaveCatAndUpdateItemSpecifics
			
			ebayAddCustomDetailShow : function($btn)	{

$btn.button();
$btn.off('click.ebayAddCustomDetailShow').on('click.ebayAddCustomDetailShow',function(){
	var
		$fieldset = $btn.closest('fieldset'),
		numInputs = $('.inputContainer',$fieldset).length;
	
	$btn.after("<div class='inputContainer'><input type='text' placeholder='Detail Title' value='' name='cs_name"+num_inputs+"' \/><input type='text' placeholder='Detail Value' value='' name='cs_value"+num_inputs+"' \/><\/div>");
	});

				}, //ebayAddCustomDetailShow
				
			ebayShowTreeByChild : function($ele)	{
				$ele.off('change.ebayShowTreeByChild').on('change.ebayShowTreeByChild',function(){
					app.u.dump("BEGIN admin_syndication.e.ebayShowTreeByChild");
					
					$ele.children().first().attr({'disabled':'disabled','selected':'selected'});
					var
						categoryid = $ele.val(),
						$chooser = $ele.closest("[data-app-role='ebayCategoryChooserTable']"),
						data = $ele.closest('.ui-dialog-content').data() || {},
						$messageDiv = $chooser.find("[data-app-role='eBayCatChooserMessaging']:first"),
						$XSLContentArea = $chooser.find("[data-app-role='ebayCategoryChooserXSLContainer']:first");
					
					$chooser.showLoading({'message':'Fetching eBay category tree data'});
					if(categoryid && data.pid)	{
						app.u.dump(" -> categoryid ["+categoryid+"] and pid ["+data.pid+"] both obtained.");
//fetch detail on the recently viewed category. This will contain a list of parents orders from closest to leaf (at zero spot) to top-most.
//xsl is set so that the request doesn't have to be made again.
						app.ext.admin.calls.adminEBAYCategory.init({
							'categoryid':categoryid,
							'pid' : data.pid,
							'xsl' : app.ext.admin_syndication.vars.ebayXSL
							},{'callback' : function(rd){

if(app.model.responseHasErrors(rd)){
	$chooser.hideLoading();
	$messageDiv.anymessage({'message':rd})
	}
else	{
	app.u.dump(" -> successfully retrieved data for leaf ["+categoryid+"].");
	var
		leafData = app.data[rd.datapointer], //gets used much later after rd... has been overwritten in other requests.
		parents = leafData['@PARENTS'],
		L = parents.length;
	
	app.u.dump(" -> leaf has "+L+" parents");
	//get the category detail for each branch in the tree handy.
	for(var i = 0; i < L; i += 1)	{
		app.ext.admin.calls.adminEBAYCategory.init({'categoryid':categoryid,'pid' : data.pid},{},'mutable');
		}
	app.calls.ping.init({'callback':function(rd){
		$chooser.hideLoading();
		if(app.model.responseHasErrors(rd)){
			$messageDiv.anymessage({'message':rd})
			}
		else	{
			app.u.dump(" -> Ping/Pong");
//All the data is available at this point, right down to the leaf, so trigger a click on each branch, starting at the top (last item in parents array).
//this only triggers the clicks on the parents, not on the leaf itself. We already have that data from our original request to get the parents.
			for(var i = (L-1); i >= 0; i -= 1)	{
				app.u.dump(i+"). "+parents[i].categoryid+" "+parents[i].name);
				$("[data-categoryid='"+parents[i].categoryid+"']:first",$chooser).find('span:first').trigger('click');
				}
			$('#APIForm').show(); //The clicking of parents in the category tree hides this, so unhide after all the click steps.
			$XSLContentArea.empty().append(leafData.html);
			
			}
		}},'mutable');
	app.model.dispatchThis('mutable');
	}

								}},'mutable');
						app.model.dispatchThis('mutable');
						}
					else if(!data.pid)	{
						$messageDiv.anymessage({'message':'In admin_syndication.e.ebayShowTreeByChild, unable to ascertain data.pid. Expected on $ele.closest(.ui-dialog.content).data(pid).','gMessage':true});
						app.u.dump("This is data() from .ui-dialog-content: "); app.u.dump(data);
						}
					else	{
						$messageDiv.anymessage({'message':'Please choose a category from the list.'})
						}
					});
				},
			
			amazonMWSLinkTo : function($btn)	{
				$btn.button();
				$btn.off('click.amazonMWSLinkTo').on('click.amazonMWSLinkTo',function(event){
					event.preventDefault();
					window.location = "https://sellercentral.amazon.com/gp/maws/maws-registration.html?ie=UTF8&amp;id=APF889O5V4GVL&amp;userType=web&amp;returnUrl="
					+ encodeURIComponent(window.location.href.split('?')[0]+"?linkFrom=amazon-token&PRT="+app.vars.partition)
					});
				}, //amazonMWSLinkTo
			
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
										//if it's a new row that was deleted before a save occured, no macro needed to remove it.
										}
									else if($tr.hasClass('rowTaggedForRemove'))	{
										macros.push("AMZ-THESAURUS-DELETE?ID="+$tr.data('thid'));
										}
									else if($tr.hasClass('isNewRow'))	{
										macros.push("AMZ-THESAURUS-SAVE?"+app.ext.admin.u.getSanitizedKVPFromObject($tr.data()));
										}
									else	{
										//HUH! shouldn't have gotten here.
										$('#globalMessaging').anymessage({'message':'in admin_syndication.e.adminSyndicationMacroExec, unknown case for amazon thesaurus. Does not appear to be new or delete, why is it flagged as edited?','gMessage':true});
										}
									});
								}
							app.u.dump("macros: "); app.u.dump(macros);
							$form.showLoading({'message':'Updating Marketplace Settings...'});
							app.ext.admin.calls.adminSyndicationMacro.init(DST,macros,{'callback':'handleMacroUpdate','extension':'admin_syndication','jqObj':$form},'immutable');
							app.ext.admin.calls.adminSyndicationDetail.init(DST,{},'immutable');
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
					DST = $btn.closest("[data-dst]").data('dst');
					if(DST)	{
						app.ext.admin.calls.adminSyndicationMacro.init(DST,['UNSUSPEND'],{},'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{
						$form.anymessage({"message":"In admin_syndication.u.handleDSTDetailSave, unable to determine DST ["+DST+"] or macros ["+macros.length+"] was empty","gMessage":true});
						}
					});
				}, //adminSyndicationUnsuspendMacro
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
				}, //adminSyndicationUnsuspendAndClearErrorMacro
			adminSyndicationPublishExec : function($btn)	{
				$btn.button();
				
				//"adminSyndicationPublish"
				$btn.off('click.adminSyndicationPublishExec').on('click.adminSyndicationPublishExec',function(){
					var
						$form = $btn.closest('form'),
						sfo = $form.serializeJSON({'cb':true});
					
					if(sfo.DST)	{
						if(sfo.enable)	{
$form.showLoading({"message":"Creating batch job for syndication feed publication..."});
app.ext.admin.calls.adminSyndicationPublish.init(sfo.DST,{'callback':'showBatchJobStatus','extension':'admin_batchJob','jqObj':$form},'immutable');
app.model.dispatchThis('immutable');

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
//					$(':checkbox',$D).anycb(); //{'text' : {'on' : 'yes','off':'no'}} //not working in a dialog for some reason.
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
				} //adminSyndicationDebugExec
			
			
			} //e [app Events]
		} //r object.
	return r;
	}