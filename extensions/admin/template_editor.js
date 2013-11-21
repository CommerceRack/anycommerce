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


var admin_templateEditor = function() {
	
	var theseTemplates = new Array('templateEditorTemplate');
	
	var r = {

		vars : {
			templateModes : new Array('EBAYProfile','Campaign','Site') //be sure to update u.missingParamsByMode function when adding a new mode.
			},

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


	
		callbacks : {
	//executed when extension is loaded. should include any validation that needs to occur.
			init : {
				onSuccess : function()	{
					var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
	//the list of templates in theseTemplate intentionally has a lot of the templates left off.  This was done intentionally to keep the memory footprint low. They'll get loaded on the fly if/when they are needed.
					app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/template_editor.html',theseTemplates);
					app.ext.admin_templateEditor.u.declareMagicFunctions(); //adds some global functions to the dom. shortcuts for template editing.
					return r;
					},
				onError : function()	{
	//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
	//you may or may not need it.
					app.u.dump('BEGIN admin_orders.callbacks.init.onError');
					}
				} //init
			}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		a : {

//for mode = ebay, vars.profile is required.
			showTemplateEditor : function(mode,vars)	{

				vars = vars || {};
//				app.u.dump(" -> vars: "); app.u.dump(vars);
				//will be false if it is not missing params
				if(!app.ext.admin_templateEditor.u.missingParamsByMode(mode,vars))	{
//By here, we know that we have a valid mode and that any requirements in 'vars' based on the mode ARE present.

					var $D = $('#templateEditor');
						
					if($D.length)	{
						$('#globalMessaging').anymessage({'message':'The template editor was already open for '+$D.data('mode')+'. That editor was closed'})
						//template editor has been opened before. nuke the template vars so nothing carries over.
						$D.removeData('profile');
						$D.removeData('campaignid');
						$D.removeData('domain');
						$D.removeData('mode');
						$D.empty().remove();
						}


					$D = $("<div \/>",{'id':'templateEditor','title':'Edit '+mode+' template'}).attr('data-app-role','templateEditor');
					

					vars.editor = 'inline'; //hard coded for now. may change later. support for dialog, fullscreen are also present.
					var iframeHeight = 'auto';
					
					if(vars.editor == 'inline')	{
						$(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')).empty().append($D);
						iframeHeight = $(window).height() - $('#mastHead').height() - 100;
						}
					else if(vars.editor == 'fullscreen')	{
						$D.appendTo('body');
						$('#templateEditor').fullScreen({
							'background' : '#ffffff',
							'callback' : function(state)	{}
							});
						iframeHeight = $(window).height() - 100;
						}
					else if (vars.editor == 'dialog')	{
//must scroll to top of body/html first or issues with modal placement and lack of browser scrollbars.						
						$('html, body').animate({scrollTop:0}, 'fast');

						$D.dialog({
							'modal':true,
							'autoOpen':false,
							'width':'96%',
							close: function(event, ui)	{
								$('body').css({'height':'auto','overflow':'auto'}) //bring browser scrollbars back.
//if the css editor was opened, close it.
								if($('#templateEditorCSSDialog').length && $('#templateEditorCSSDialog').hasClass('ui-dialog-content'))	{
									$('#templateEditorCSSDialog').dialog('close');
									}
								},
							open : function(event,ui)	{
								$('body').css({'height':'100%','overflow':'hidden'}) //get rid of browser scrollbars.
								}
							});
						$D.dialog("option", "position", "center");
						$D.dialog('option','height',($(window).height() - 100));
						
						$D.dialog('open');


						}
					else	{
						$('#globalMessaging').anymessage({'message':'No editor mode passed.'});
						}

					if(vars.editor)	{
						
	
						$D.data(vars); //vars.profile is used in the media lib to get the profile. don't change it.
						$D.data('mode',mode);
					
						$D.showLoading({"message":"Fetching template HTML"});
						app.u.dump(' -> go get template contents ');
						var callback = function(rd){
							$D.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$D.anymessage({'message':rd})
								}
							else	{
								app.u.dump(' -> template contents obtained');
								//this is in the callback so that if the call fails, a blank/broken editor doesn't show up.
//								app.u.dump(" -> $D.length: "+$D.length);
								$D.anycontent({'templateID':'templateEditorTemplate','showLoading':false,'data':{}}); //pass in a blank data so that translation occurs for loads-template 
//								app.u.dump(" -> $D.children().length: "+$D.children().length); app.u.dump($D);

								$("[data-app-role='templateObjectInspectorContainer']",$D).anypanel({
									'state' : 'persistent',
									showClose : false, //set to false to disable close (X) button.
									wholeHeaderToggle : true, //set to false if only the expand/collapse button should toggle panel (important if panel is draggable)
									extension : 'template_editor', //used in conjunction w/ persist.
									name : 'templateEditorObjectInspector', //used in conjunction w/ persist.
									persistentStateDefault : 'collapse',
									persistent : true
									});
								var $objectInspector = $("[data-app-role='templateObjectInspectorContent']",$D);
								
								var toolbarButtons = app.ext.admin.u.buildToolbarForEditor([
									"|", 
									app.ext.admin_templateEditor.u.getEditorButton_imageadd(),
									app.ext.admin_templateEditor.u.getEditorButton_image()
									]);

//handle some mode specifics.
								$('.ebay, .campaign, .site').hide(); // hide all 'specifics' by default. show as needed.
								if(mode == 'EBAYProfile')	{
									toolbarButtons.push("|");
									toolbarButtons.push(app.ext.admin_templateEditor.u.getEditorButton_prodattributeadd())
									$(".ebay",$D).show();
									}
								if(mode == 'Site')	{
									toolbarButtons.push("|");
									$(".site",$D).show();
									}
								else if(mode == 'Campaign')	{
									toolbarButtons.push("|");
									toolbarButtons.push(app.ext.admin_templateEditor.u.getEditorButton_style());
									toolbarButtons.push("|");
									toolbarButtons.push(app.ext.admin_templateEditor.u.getEditorButton_buyerattributeadd());
									toolbarButtons.push("|");
									toolbarButtons.push(app.ext.admin_templateEditor.u.getEditorButtonNativeApp());
									$(".campaign",$D).show();
									}
								else	{}
//								app.u.dump(" -> toolbarButtons: "); app.u.dump(toolbarButtons);
								
								
								$("textarea:first",$D)
									.show()
									.width('95%')
									.height($D.height() - 100)
									.css('width','95%')
									.val(app.ext.admin_templateEditor.u.preprocessTemplate(mode,vars,app.data[rd.datapointer]['body']))
									.htmlarea({
										// Override/Specify the Toolbar buttons to show
										toolbar: toolbarButtons // 
										});
								
							
								// event needs to be delegated to the body so that toggling between html and design mode don't drop events and so that newly created events are eventful.
								$("div.jHtmlArea, div.ToolBar",$D).width('97%'); //having issue with toolbar collapsing.
								var $iframeBody = $('iframe',$D).width('97%').height(iframeHeight).contents().find('body');
								app.ext.admin_templateEditor.u.handleWizardObjects($iframeBody,$objectInspector);
								
								app.ext.admin_templateEditor.u.handleTemplateModeSpecifics(mode,vars,$iframeBody); //needs to be after iframe is added to the DOM.
								
								app.u.handleAppEvents($D);
								$('.toolTip',$D).tooltip();
								}
							}

						var cmdObj = {
							'_cmd':'admin'+mode+'FileContents',
							'FILENAME' : 'index.html',
							'_tag' : {
								'callback' : callback
								}
							}
						
							if(mode == 'EBAYProfile')	{
								cmdObj.PROFILE = vars.profile;
								cmdObj._tag.datapointer = 'adminEBAYProfileFileContents|'+vars.profile;
								}
							else if(mode == 'Campaign')	{
								cmdObj.CAMPAIGNID = vars.campaignid;
								cmdObj._tag.datapointer = 'adminCampaignFileContents|'+vars.campaignid;
								}
							else if(mode == 'Site')	{
								cmdObj.DOMAIN = vars.domain;
								cmdObj._tag.datapointer = 'adminSiteFileContents|'+vars.domain;
								}
							else	{
								} //should never get this far. the if check at the top verifies valid mode. This is just a catch all.

							app.model.addDispatchToQ(cmdObj,'mutable');
							app.model.dispatchThis('mutable');
						}
					
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_templateEditor.a.showTemplateEditor, "+app.ext.admin_templateEditor.u.missingParamsByMode(mode,vars),"gMessage":true});
					}				
				
				}, //showTemplateEditor

			showTemplateChooserInModal : function(vars)	{
				vars = vars || {};
				if(!app.ext.admin_templateEditor.u.missingParamsByMode(vars.mode,vars))	{

					var dialogObject = {'showLoading':false};
					vars._cmd = 'admin'+vars.mode+'TemplateList';
					if(vars.mode == 'Campaign')	{
						dialogObject.title = 'Campaign Template Chooser';
						dialogObject.dataAttribs = {'campaignid':vars.campaignid,'mode':vars.mode};
						}
					else if(vars.mode == 'Site')	{
						dialogObject.title = 'Site App Template Chooser';
						dialogObject.dataAttribs = {'domain':vars.domain,'mode':vars.mode};
						}
					else if(vars.mode == 'EBAYProfile')	{
						dialogObject.title = 'eBay Template Chooser';
						vars._cmd = "adminEBAYTemplateList"; //cmd keyword varies slightly from mode.
						}
					else	{} //shouldn't get here.

					var $D = app.ext.admin.i.dialogCreate(dialogObject); //using dialogCreate ensures that the div is 'removed' on close, clearing all previously set data().
					$D.attr('id','templateChooser').data(vars);
					$D.dialog('open');
					$D.showLoading();
					
					vars._tag = {
						'callback' : 'anycontent',
						"templateID" : "templateChooserTemplate",
						'datapointer' : vars._cmd,
						'jqObj' : $D
						}
					
					if(app.model.fetchData(vars._tag.datapointer))	{
						app.u.handleCallback(vars._tag);
						}
					else	{
//						app.u.dump(" vars: "); app.u.dump(vars);
						app.model.addDispatchToQ(vars,'mutable');
						app.model.dispatchThis('mutable');
						}
					
/*					$D.imagegallery({
						selector: 'a[data-gallery="gallery"]',
						show: 'fade',
						hide: 'fade',
						fullscreen: false,
						slideshow: false
						});
*/
//					app.u.dump(" -> $D.data()"); app.u.dump($D.data());
					app.u.handleAppEvents($D);
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_syndication.a.showTemplateChooserInModal, "+app.ext.admin_templateEditor.u.missingParamsByMode(vars.mode,vars)+".","gMessage":true});
					}
				}, //showTemplateChooserInModal

			initWizard : function()	{
				var	$wizardForm = $('#wizardForm');
//the success fieldset, which is last in the list.
				$wizardForm.find('fieldset:last').after("<fieldset class='wizardCompleted' class='displayNone'>Congrats! You have completed the wizard for this template.<\/fieldset>");
				
				var
					$fieldsets = $('fieldset',$wizardForm),
					$templateEditor = $('#templateEditor'), //referenced for context on multiple occasions.
					$iframeBody = $('iframe',$templateEditor).contents().find('body');

				

				$fieldsets.hide(); //hide all the fieldsets.
				var $firstFieldset = $('fieldset:first',$wizardForm);
				$firstFieldset.show(); //show just the first.
				
				function fieldsetVerifyAndExecOnfocus($fieldset)	{
					if(window.magic.fieldset_verify($fieldset))	{
						if($fieldset.data('onfocus'))	{
							setTimeout($fieldset.data('onfocus'),100); //setTimeout is a workaround (to avoid eval) to execute the value of data-onfocus as script.
							}
						}
					}
				
				fieldsetVerifyAndExecOnfocus($firstFieldset);
				$wizardForm.closest('.ui-widget-content').addClass('positionRelative'); //necessary for button positioning.
				
				$('button',$fieldsets).button(); //applied to all buttons within fieldsets.
				
				$("<div class='clearfix marginBottom' \/>").appendTo($wizardForm);
				//add the next/previous buttons.  The action on the button is controlled through a delegated event on the form itself.
				$("<button data-button-action='previous'>Previous<\/button>").addClass('smallButton').button({icons: {primary: "ui-icon-circle-triangle-w"},text: true}).button('disable').width('40%').addClass('floatLeft').appendTo($wizardForm);
				$("<button data-button-action='next'>Next<\/button>").addClass('smallButton ui-state-focus').button({icons: {primary: "ui-icon-circle-triangle-e"},text: true}).width('40%').addClass('floatRight').appendTo($wizardForm);
				$("<div class='clearfix' \/>").appendTo($wizardForm);
				$wizardForm.prepend("<div class='marginBottom ui-widget-content ui-corner-bottom smallPadding displayNone'><div class='alignCenter' data-app-role='progressBar'><div class='progress-label'>% Completed</div></div></div>"); //at B's request, do NOT use a progress bar here. no animation in slider desired.
				
				//handles the wizard nav button click events (and any other buttons we add later will get controlled here too)
				$wizardForm.off('click.templatewizard').on('click.templatewizard',function(e){
//					app.u.dump("Click registered in the wizard panel");
					var $target = $(e.target); //the element that was clicked.
					
//					app.u.dump(" -> $target.is('button'): "+$target.is('button'));
//					app.u.dump(" -> $target.data('button-action'): "+$target.data('button-action'));
//					app.u.dump(" -> e.target.nodeNam: "+e.target.nodeNam);

//in chrome, the click event is triggered on the child span of the button, not the button itself.
					if(e.target.nodeName.toLowerCase() == 'span' && $target.parent().hasClass('ui-button'))	{
						$target = $target.parent();
						}
					
					if($target.is('button') && $target.data('button-action'))	{
//						app.u.dump(" -> click is on a button");
						e.preventDefault(); //disable the default action.

						
//						app.u.dump(" -> $target.data('button-action'): "+$target.data('button-action'));
						$target.data('button-action') == 'previous' ? $('fieldset:visible',$wizardForm).hide().prev('fieldset').show() : $('fieldset:visible',$wizardForm).hide().next('fieldset').show();
						
						
						var $focusFieldset = $('fieldset:visible',$wizardForm);
						fieldsetVerifyAndExecOnfocus($focusFieldset);
app.u.dump(" -> $focusFieldset.index(): "+$focusFieldset.index());
						//SANITY -> index() starts at 1, not zero.
						if($focusFieldset.index() == 1)	{
							$("[data-button-action='next']",$wizardForm).button('enable');
							$("[data-button-action='previous']",$wizardForm).button('disable');
							}
						else if($focusFieldset.index() >= $fieldsets.length)	{
							$("[data-button-action='next']",$wizardForm).button('disable');
							$("[data-button-action='previous']",$wizardForm).button('enable');
							}
						else	{
							$("[data-button-action]").button('enable');
							}
						//last so last fieldset shows up as 100% complete.
						var $progressBar = $("[data-app-role='progressBar']",$templateEditor);
						$progressBar.progressbar({
							'change' : function(event,ui){
								$('.progress-label',$progressBar).text($progressBar.progressbar("value")+"% Completed")
								},
							'complete' : function(){}
							}).parent().css({top:'-13px','position':'relative'});
						app.ext.admin_templateEditor.u.handleWizardProgressBar($("[data-app-role='progressBar']",$templateEditor));
						}
					});
				} //initWizard
			
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//renderFormats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		renderFormats : {
				templateThumb : function($tag,data)	{
					$tag.attr('src',"data:"+data.value[0].type+";base64,"+data.value[0].base64);
					$tag.wrap("<a href='data:"+data.value[0].type+";base64,"+data.value[0].base64+"' >"); //data-gallery='gallery'
					}
			}, //renderFormats




////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
			u : {

//this will return false if we have everything we need. 
//if something is missing, will return the error message.
				missingParamsByMode : function(mode,data)	{
					var r = false;
					if(mode && !$.isEmptyObject(data))	{
						if($.inArray(mode,app.ext.admin_templateEditor.vars.templateModes) > -1)	{
							if(mode == 'EBAYProfile' && !data.profile)	{
								r = "In admin_templateEditor.u.missingParamsByMode, mode set to EBAYProfile but no profile passed."
								}
							else if(mode == 'Site' && !data.domain)	{
								r = "In admin_templateEditor.u.missingParamsByMode, mode set to Site but no domain passed."
								}
							else if(mode == 'Campaign' && !data.campaignid)	{
								r = "In admin_templateEditor.u.missingParamsByMode, mode set to Campaign but no campaignid passed."
								}
							else	{
								//Success.
								}
							}
						else	{
							r = "In admin_templateEditor.u.missingParamsByMode, Invalid mode ["+mode+"] passed."
							}
						}
					else	{
						r = "In admin_templateEditor.u.missingParamsByMode, no mode passed or data was empty."
						}
					return r;
					},

//adds some global functions for easy reference from the supporting html file for the wizard
				declareMagicFunctions : function()	{
	
	
	function getTarget(selector,functionName){
//		app.u.dump("getTarget selector: "+selector);
		var r = false
		if(selector)	{
//jqSelector doesn't play well using : or [ as first param.
			var $target = $('iframe',$('#templateEditor')).contents().find((selector.indexOf('#') == 0 || selector.indexOf('.') == 0) ? app.u.jqSelector(selector.charAt(0),selector.substring(1)) : app.u.jqSelector("",selector));
			if($target.length)	{
				r = $target;
				}
			else	{
				$("[data-app-role='wizardMessaging']",$('#templateEditor')).anymessage({'message':'The element selector ['+selector+'] passed into '+functionName+' does not exist within the template. This is likely the result of an error in the wizard.js file.'});
				}
			}
		else	{
			$("[data-app-role='wizardMessaging']",$('#templateEditor')).anymessage({'message':'No element selector passed into '+functionName+'. This is likely the result of an error in the wizard.js file.'});
			}
		return r;	
		}

	if(typeof window.magic === 'object')	{}
	else	{
		window.magic = {};
		
//selector is, most likely, a hidden form element within the wizard.
//This function will populate the hidden input with a csv of product once the 'apply' button in the picker is pushed.
		window.magic.conjureProduct = function(ID){

var $D = app.ext.admin.i.dialogCreate({
	'title' : 'Select Product'
	});
var $input = $(app.u.jqSelector('#',ID));
//app.u.dump(" -> app.u.jqSelector('#',ID): "+app.u.jqSelector('#',ID));
//app.u.dump(" -> $input.length: "+$input.length);

	$("<form>").append($("<fieldset data-app-role='pickerContainer'>").append(app.ext.admin.a.getPicker({'templateID':'pickerTemplate','mode':'product'}))).appendTo($D);
	$D.dialog({ buttons: [ { text: "Apply Product", click: function() {
		$D.showLoading({'message':'Fetching product list'});

		app.model.addDispatchToQ({
			'_cmd':'appProductSelect',
			'product_selectors' : app.ext.admin_tools.u.pickerSelection2KVP($('form:first',$D)),
			'_tag':	{
				'datapointer' : 'appProductSelect',
				'callback' : function(rd)	{
					$D.hideLoading();
					if(app.model.responseHasErrors(rd)){
						$D.anymessage({'message':rd});
						}
					else	{
						if(app.data[rd.datapointer] && app.data[rd.datapointer]['@products'] && app.data[rd.datapointer]['@products'].length)	{
							$input.val(app.data[rd.datapointer]['@products'].join());
							$input.triggerHandler("change"); //runs focus event w/out bringing 'focus' to input.
							$D.dialog('close');
							}
						else	{
							$D.anymessage({'message':'Your selectors returned zero product.'});
							}
						}
					}
				}
			},'mutable');
		app.model.dispatchThis('mutable');
		}}]});

	$D.dialog('open');

			}
		
		window.magic.prodlist = function(selector,prodlist,vars)	{
			var $target = getTarget(selector,'magic.prodlist');
			
			vars = vars || {};
			
			if(vars.templateID)	{
//				$target.append("<br><h2>JT WAS HERE</h2><br>");
				var $prodlistTemplate = $(app.u.jqSelector('#',vars.templateID));
				if($prodlistTemplate.length)	{


						//success content goes here.
						$target = getTarget(selector,'magic.prodlist'); //have to redeclare target. 'focus' of target in iframe was getting lost. for expediency's sake, this was quickest solution.
//						app.u.dump("$target.length: "+$target.length);
//						$target.append("<br><h2>And Here Too!</h2><br>");
						if(prodlist)	{
							
							var $prodlistContainer = $prodlistTemplate.clone();
//							app.u.dump(" -> $prodlistContainer.length: "+$prodlistContainer.length);
							$prodlistContainer.attr('id','WIZ_PL_'+app.u.guidGenerator().substring(0,10)); //change the ID so it's unique.
							$prodlistContainer.appendTo($target);
							
							$prodlistContainer.anycontent({'data':{'@products':prodlist}});
							}
						else	{
							$D.anymessage({'message':'Your selectors returned zero product.'});
							}




					}
				else	{
					$("[data-app-role='wizardMessaging']",$('#templateEditor')).anymessage({'message':'vars.templateID was passed into magic.prodlist but element does not exist on the DOM.'});
					}

				}
			else	{
				$("[data-app-role='wizardMessaging']",$('#templateEditor')).anymessage({'message':'vars.templateID was not passed into magic.prodlist.'});
				}
			} //magic.prodlist
		
		window.magic.siteArticleFocus = function(ID,containerID)	{
			var $container = getTarget(containerID,'magic.siteArticleFocus');
			if($container)	{
				$container.find('.textContentArea').hide();
				var $target = getTarget(ID,'magic.siteArticleFocus').show(); //if an error occurs in getTarget, it'll handle it's own error display.
				}
			else	{}  //getTarget handles error display.
			}
		
		window.magic.siteTemplateFocus = function(ID)	{
			var $target = getTarget(ID,'magic.templateFocus');
			var $body = getTarget('body','magic.templateFocus');
			if($target)	{
				$body.children().hide();
				$target.show().appendTo($body); //move template to root level and make visible.
				}
			else	{}  //getTarget handles error display.
			}
		
		//selector is an element within the wizard itself.
		window.magic.inspect = function(selector)	{
			var $target = getTarget(selector,'magic.inspect');
			r = null;
			if($target)	{
				app.ext.admin_templateEditor.u.showObjectInInspector($target,$("[data-app-role='templateObjectInspectorContent']",$('#templateEditor')));
				r = $target;
				}
			else	{} //getTarget handles error display.
			return r;
			}
		
		window.magic.medialib = function(ID)	{
			var $target = getTarget(ID,'magic.medialib');
			if($target)	{
				app.ext.admin_medialib.a.showMediaLib({
					'imageID':app.u.jqSelector('#',ID.substring(1)),
					'mode':'kissTemplate'//,
		//			'src':$target.data('filepath') //doesn't work like we want. uses some legacy UI code.
					}); //filepath is the path of currently selected image. oldfilepath may also be set.
				}
			else	{} //getTarget handles error display.
			}

//gets run when a fieldset in the wizard is loaded.  Will check the value on all fieldset inputs for data-target (which should be a selector) and will check to make sure it exists in the template itself.
//if one failure occurs, the entire panel is locked. The user can still proceed forward and backward through the rest of the editor.
		window.magic.fieldset_verify = function($fieldset)	{
			app.u.dump("BEGIN fieldset_verify");
			var numMatchedSelectors = 0;  //what is returned if pass is false. will increment w/ the length of each data-target.length
			var pass = true;
			if($fieldset instanceof jQuery)	{
//				app.u.dump(" -> $('[data-target]',$fieldset).length: "+$("[data-target]",$fieldset).length);
				$("[data-target]",$fieldset).each(function(){
					var $target = getTarget($(this).data('target'),'magic.exists');
					if($target)	{
						numMatchedSelectors = $target.length;
						}
					else {
						pass = false; //one mismatch triggers a fail.
						}
					});
				if(pass)	{
					if($fieldset.data('onfocus'))	{
						setTimeout($fieldset.data('onfocus'),100); //this executes the fieldset data-onfocus code. in a timeout to treat like an eval without running an eval.
						}
					} //woot! all elements are in the template.
				else	{
					app.u.dump(" -> a fail occurd in magic.verify");
					$('select, textarea, input',$fieldset).attr('disabled','disabled'); //unable to find all selectors, so disable entire panel.
					$('button',$fieldset).prop('disabled','disabled'); //expand later to check for ui-button and handle them differently.
					} //do nothing,
				}
			else	{
				pass = false;
				$("[data-app-role='wizardMessaging']",$('#templateEditor')).anymessage({'message':'Invalid fieldset ['+($fieldset instanceof jQuery)+'] not passed into magic.exists.'});
				}
			app.u.dump(" -> verify pass: "+pass);
			return (pass === true) ? r : 0;
			}
		
		window.magic.modify = function(selector,method,vars)	{
			vars = vars || {};
			
			var methods = new Array("set-attribs","empty","hide","show","set-value","append","replace","prepend");
			
			if(methods.indexOf(method) >= 0)	{
				var $target = getTarget(selector,'magic.modify');
				if($target)	{
		
					switch(method)	{
						case 'set-attribs':
							$target.attr(vars.attribs)
							break;
						case 'append':
							$target.append(vars.html)
							break;
						case 'prepend':
							$target.prepend(vars.html)
							break;

						case 'replace':
							$target.html(vars.html)
							break;
					
						case 'show':
							$target.show();
							break;
						
						case 'hide':
							$target.hide();
							break;
						
						case 'empty':
							$target.empty();
							break;
						
						default:
							$("[data-app-role='wizardMessaging']",$('#templateEditor')).anymessage({'message':'Method ['+method+'] passed into magic.modify passed validation but is not declared in switch.','gMessage':true});
						}
		
		
					}
				else	{} //getTarget handles error display.
				}
			else	{
				$("[data-app-role='wizardMessaging']",$('#templateEditor')).anymessage({'message':'Invalid or blank method ['+method+'] passed into magic.modify. This is likely the result of an error in the wizard.js file.'});
				}
			}
		}
					},
	
//updates the progress bar based on the number of fieldsets and the index of the fieldset in view (yes, going backwards means progress bar regresses)
				handleWizardProgressBar : function($pbar)	{
					if($pbar instanceof jQuery)	{
						var $fieldsets = $("fieldset",'#wizardForm');
						if($fieldsets.length)	{
							// * 201334 -> better handling if animation is in progress.
							//if the animation is in progress already, don't mess w/ it. let it wrap up, but adjust the progress.
							var progress = Math.round((($("fieldset:visible",'#wizardForm').index() / $fieldsets.length ) * 100));
							if($pbar.is(':animated'))	{
								$pbar.progressbar('option','value',progress);
								}
							else	{
								$pbar.parent().slideDown('slow',function(){
									$pbar.progressbar('option','value',progress);
									setTimeout(function(){
										$pbar.parent().slideUp('slow');
										},2000);
									});
								}
							
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':"In admin_templateEditor.u.handleWizardProgressBar, pbar ["+$pbar instanceof jQuery+"] is not a valid jquery object.",'gMessage':true});
						}
					},

//delegates a click event on the template container which updates the object inspector w/ information about the clicked element.
				handleWizardObjects : function($iframeBody,$objectInspector)	{
					if($iframeBody instanceof jQuery && $objectInspector instanceof jQuery)	{
						$iframeBody.on('click',function(e){
							var $target = $(e.target);
	//						app.u.dump(" -> $target.id: "+$target.attr('id'));
							app.ext.admin_templateEditor.u.showObjectInInspector($target,$objectInspector); //updates object inspector when any element is clicked.
							});
						}
					else	{
						$('#globalMessaging').anymessage({'message':"In admin_templateEditor.u.handleWizardProgressBar, either iframeBody ["+$iframeBody instanceof jQuery+"] or objectInspector ["+$objectInspector instanceof jQuery+"] were not valid jquery objects.",'gMessage':true});
						}
					},

//adds some classes to the template.  These classes are removed on save.
				buildTemplateStyleSheet : function()	{
					var r = "<div id='templateBuilderCSS'>\n<style type='text/css'>\n"
						+ "	.showHighlights_PRODUCT .attributeContainer_PRODUCT {background-color:#efefef; border:1px dashed #cccccc;}\n" //used on all non-href product elements
//						+ "	.showHighlights_PRODUCT .actbHref {background-color:#00cc00; border:1px solid #cccccc;}\n" //used on product href elements.
						+ "	.showHighlights_BUYER .attributeContainer_BUYER {background-color:#cee1cc; border:1px dashed #abc2a8;}\n" //used on all non-href product elements
//						+ "	.showHighlights_BUYER .actbHref {background-color:#abc2a8; border:1px solid #abc2a8;}\n" //used on product href elements.
						+ "	.showHighlights_KISS .wizardificated {background-color:#e2eee1; border:1px dashed #bdd1bd;}\n"
						+ "	.showHighlights_KISS .unwizardificated {background-color:#f0f5fb; border:1px dashed #b9d6fc;}\n"
						+ "<\/style></div>"
					return r;
					}, //buildTemplateStyleSheet

//removes the editor classes from the template. executed on save.
				postprocessTemplate : function(template,mode)	{
					var $template = $("<html>"); //need a parent container.
					$template.append(template);
					$('#templateBuilderCSS',$template).empty().remove();
					return $template.html();
					}, //postprocessTemplate

//This will add a style tag (classes) used by the editor. They're added to the template (stripped on save).
// it will also add some classes on data-object elements. These stay (they do no harm)
				preprocessTemplate : function(mode,vars,template)	{
					app.u.dump("BEGIN admin_templateEditor.u.preprocessTemplate");
//					app.u.dump(" -> mode: "+mode); app.u.dump(" -> vars: "); app.u.dump(vars);
					var $template = $("<html>"); //need a parent container.
					$template.append(template);
					
					if(mode == 'Site')	{
//						app.u.dump(" -> Is a Site template");
						$('base',$template).attr('href','http://www.'+vars.domain); //!!! this is temporary. Need a good solution for protocol and domain prefix/host.
						$('script',$template).remove(); //make sure the app template doesn't instantiate itself.
						}
					
					$("[data-object]",$template).each(function(){
						var $ele = $(this);
						if($ele.data('object') == 'PRODUCT' || $ele.data('object') == 'BUYER')	{
							if(!$ele.hasClass('attributeContainer_'+$ele.data('object')))	{
								$ele.addClass('attributeContainer_'+$ele.data('object'))
								}
							else	{} //not an anchor and already has product attribute class.
							}
						else if($ele.data('object') == 'KISS')	{
							if($ele.data('wizardificated') && !$ele.hasClass('wizardificated'))	{$ele.addClass('wizardificated')}
							else if(!$ele.hasClass('unwizardificated'))	{$ele.addClass('unwizardificated')}
							else	{} //class has already been added.
							}
						})
	
					$template.append(app.ext.admin_templateEditor.u.buildTemplateStyleSheet())
					return $template.html();
					}, //preprocessTemplate

				handleTemplateModeSpecifics : function(mode,vars,$iframeContents)	{
					if(!app.ext.admin_templateEditor.u.missingParamsByMode(mode,vars))	{
						if($iframeContents instanceof jQuery)	{
							if(mode == 'Site')	{
								$("[data-app-role='saveButton']",$("#templateEditor")).text("Save Templates");
								$("[data-app-role='templateEditorSaveAsTemplate']",$('#templateEditor')).hide();
								$iframeContents.children().hide();
//build the list of templates that are editable and update the select list.
//								app.u.dump("# of wizards: "+$("[data-wizard]",$template).length);
								var $select = $("[data-app-role='siteTemplateSelect']",$('#templateEditor'));
								$("[data-wizard]",$iframeContents).each(function(){
									var $ele = $(this);
									//create an MD5 for the contents of the element which can be used to compare later to see if any changes occured.
									$select.append($("<option \/>").text($ele.data('wizard')).val($ele.data('wizard')).attr({'data-md5':Crypto.MD5($(app.u.jqSelector('#',$ele.attr('id')),$iframeContents).html()),'data-elementid':$ele.attr('id')}));
									})
								}
							}
						else	{
							$('#globalMessaging').anymessage({'message':'In admin_templateEditor.u.handleTemplateModeSpecifics, $iframeContents is not a valid jQuery instance ['+($iframeContents instanceof jQuery)+'].','gMessage':true});
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_templateEditor.u.handleTemplateModeSpecifics, '+app.ext.admin_templateEditor.u.missingParamsByMode(mode,vars),'gMessage':true});
						}
					//data-app-role='siteTemplateSelect'
					},

				summonWizard : function(filename)	{

					$('#wizardForm').showLoading({"message":"Summoning Wizard..."});

					var editorData = $('#templateEditor').data();
					var cmdObj = {
						'FILENAME':filename,
						'_tag':	{
							'datapointer' : 'admin'+editorData.mode+'FileContents|'+filename,
							'callback':function(rd){
								if(app.model.responseHasErrors(rd)){
									$("[data-app-role='wizardMessaging']",$('#templateEditor')).anymessage({'message':rd});
									}
								else	{
									$('#wizardForm').html(app.data[rd.datapointer].body)
									app.ext.admin_templateEditor.a.initWizard();
									}
								}
							}
						}

					if(editorData.mode == 'EBAYProfile')	{
						cmdObj._cmd = 'adminEBAYProfileFileContents'
						cmdObj.PROFILE = editorData.profile
						}
					else if(editorData.mode == 'Campaign')	{
						cmdObj._cmd = 'adminCampaignFileContents'
						cmdObj.CAMPAIGNID = editorData.campaignid
						}
					else if(editorData.mode == 'Site')	{
						cmdObj._cmd = 'adminSiteFileContents'
						cmdObj.DOMAIN = editorData.domain
						}
					else	{
						//throw error.
						}

					app.model.addDispatchToQ(cmdObj,'mutable');
					app.model.dispatchThis('mutable');

					},


//will display $object details in the $objectInspector element.
				showObjectInInspector : function($object,$objectInspector)	{
					if($object instanceof jQuery && $objectInspector instanceof jQuery)	{
						
						function getObjectData($object)	{

							var data = $object.data(), r = "<ul class='listStyleNone noPadOrMargin clearfix marginBottom'>";
	
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
							r += "<\/ul>";
							
							return r;
				
							}
	
						$objectInspector.empty().append(getObjectData($object));
						
						if($object.data('object'))	{} //is a data-object
						else	{
//find closest parent data-object and display it's info.
							var $parentDataObject = $object.closest("[data-object]");
//							app.u.dump(" -> $parentDataObject.length: "+$parentDataObject.length);
							if($parentDataObject.length)	{
								$objectInspector.append("<h2>Parent Dynamic Element</h2>");
								$objectInspector.append(getObjectData($parentDataObject));
								}
							}
	
						}
					else	{
						$('#globalMessaging').anymessage({'message':"In admin_templateEditor.u.handleWizardProgressBar, either object ["+$object instanceof jQuery+"] or objectInspector ["+$objectInspector instanceof jQuery+"] were not valid jquery objects.",'gMessage':true});
						}
					},

//does not and SHOULD not dispatch.  Allows this to be used w/ test in campaigns.
				handleTemplateSave : function($D)	{

					if($D instanceof jQuery)	{
						var mode = $D.data('mode');
						if(!app.ext.admin_templateEditor.u.missingParamsByMode(mode,$D.data()))	{
	
							$D.showLoading({'message':'Saving changes'});
							var docBody;
							if(mode == 'Site')	{
								var dp = 'adminSiteFileContents|'+$D.data('domain')
								if(app.data[dp] && app.data[dp].body)	{
									var $oTemplate = $("<html>").html(app.data[dp].body); //the original instance of the template.
					
									$("[data-app-role='siteTemplateSelect']",$('#templateEditor')).first().find('option').each(function(){
										var $option = $(this);
										if($option.data('md5') && $option.data('elementid'))	{
											var $thisTemplate = magic.inspect(app.u.jqSelector('#',$option.data('elementid')));
//											app.u.dump(" -> $thisTemplate.length: "+$thisTemplate.length);
//											app.u.dump(" -> old md5 : "+$option.data('md5'));
//											app.u.dump(" -> new md5 : "+Crypto.MD5($thisTemplate.html()));
											$thisTemplate.css('display','');  //the editor uses show/hide which adds inline styles. These need to be removed.
											if(!$thisTemplate.attr('style'))	{
												$thisTemplate.removeAttr('style'); //if no styles are set, remove the empty tag. that way the md5 'should' match if no change occured.
												}

											if(Crypto.MD5($thisTemplate.html()) != $option.data('md5'))	{
												app.u.dump(" -> save occuring for element "+$option.data('elementid'));
												$(app.u.jqSelector('#',$option.data('elementid')),$oTemplate).replaceWith($thisTemplate);
												}
											}
										else	{} //no md5 set. probably the default 'choose';
										
										});

									docBody = "<html>\n<!DOCTYPE html>\n"+$.trim($oTemplate.html())+"/n</html>"; //putting the template body into a jquery object strips the html and doctype tags.
									}
								else	{
									$D.anymessage({'message':'In admin_templateEditor.u.handleTemplateSave, unable to obtain original template body in app.data'+dp,'gMessage':true});
									}
								}
							else	{
								docBody = app.ext.admin_templateEditor.u.postprocessTemplate($('.jHtmlArea iframe:first',$D).contents().find('html').html(),mode);
								}
							var dObj = {
								'_cmd' : 'admin'+mode+'FileSave',
								'FILENAME' : 'index.html',
								'_tag' : {
									'callback' : function(responseData)	{
										$D.hideLoading();
										if(app.model.responseHasErrors(responseData)){
											$D.anymessage({'message':responseData})
											}
										else	{
											if($D.data('editor') == 'dialog')	{$D.dialog('close');}
											$('#globalMessaging').anymessage(app.u.successMsgObject('Your changes have been saved.'));
											}
										}
									},
								'body' : docBody
								}
	
							if(mode == 'EBAYProfile')	{
								dObj.PROFILE = $D.data('profile');
								}
							else if(mode == 'Campaign')	{
								dObj.CAMPAIGNID = $D.data('campaignid');
								}
							else if(mode == 'Site')	{
								dObj.DOMAIN = $D.data('domain');
								}
							else	{} //shouldn't get here. mode is verified earlier to be a supported mode.
//							app.u.dump(" -> cmd: "); app.u.dump(dObj);
							app.model.addDispatchToQ(dObj,'immutable');
								
							}
						else	{
							$D.anymessage({'message':app.ext.admin_templateEditor.u.missingParamsByMode(mode,$D.data())});
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_templateEditor.u.handleTemplateSave, object passed in not a valid jquery object.','gMessage':true});
						}
					},

//Used to copy a template into a profile or campaign (or whatever as more get added).
//vars needs to include SUBDIR and PROJECTID.  Vars is most likely passed from an li.data(), but doesn't have to be.
				handleTemplateSelect : function(vars)	{
					vars = vars || {};
					var $TC = $('#templateChooser');
					var mode = $TC.data('mode'); //should never get changed through this code.
					
					if(!app.ext.admin_templateEditor.u.missingParamsByMode(mode,vars))	{
						if(vars.SUBDIR)	{
							//all is well at this point. proceed.
							$TC.showLoading({'message':'One moment please. Copying files into directory.'});
							var dObj = {
								_tag : {
									'callback' : function(rd)	{
										$TC.hideLoading();
										if(app.model.responseHasErrors(rd)){
											$TC.anymessage({'message':rd})
											}
										else	{
											$TC.dialog('close');
											$('#globalMessaging').anymessage(app.u.successMsgObject("Thank you, the template "+vars.SUBDIR+" has been copied."));
//											$(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')).find("[data-app-role='templateOrigin']:first").text(vars.SUBDIR);
//app.u.dump("vars: "); app.u.dump(vars);
//app.u.dump("whitelist: "); app.u.dump(app.u.getWhitelistedObject(vars,['domain','templateid','profile']));

											app.ext.admin_templateEditor.a.showTemplateEditor(mode,app.u.getWhitelistedObject(vars,['domain','campaignid','profile']));
											}
										}
									}	
								}
							
							dObj.SUBDIR = vars.SUBDIR;
							dObj.PROJECTID = vars.PROJECTID;
							
							
							if(mode == 'EBAYProfile')	{
								dObj._cmd = 'adminEBAYTemplateInstall';
								dObj.PROFILE = $TC.data('profile');
								app.model.addDispatchToQ({
									'_cmd':'adminEBAYProfileUpdate',
									'template_origin':vars.SUBDIR,
									'PROFILE' : $TC.data('profile')
									},'immutable');
								}
							else if(mode == 'Site')	{
								dObj._cmd = 'adminSiteTemplateInstall';
								dObj.DOMAIN = $TC.data('domain');
								}
							else if(mode == 'Campaign')	{
								dObj._cmd = 'adminCampaignTemplateInstall';
								dObj.CAMPAIGNID = $TC.data('campaignid');
								}
							else	{} //should never get here.

							app.model.addDispatchToQ(dObj,'immutable'); //app.model.dispatchThis('immutable');
							app.model.dispatchThis('immutable');
							}
						else	{
							$TC.anymessage({"message":"In admin_templateEditor.u.handleTemplateSelect, SUBDIR not passed in.","gMessage":true});
							}
						
						}
					else	{
						$TC.anymessage({"message":"In admin_templateEditor.u.handleTemplateSelect, "+app.ext.admin_templateEditor.u.missingParamsByMode(mode,vars),"gMessage":true});
						}

					}, //handleTemplateSelect
				
				getEditorButton_imageadd : function()	{
					return {
						css : 'imageadd',
						'text' : 'Upload New Image to Profile',
						action: function (btn) {
							var $D = $("<div \/>");
							$D.dialog({
								'modal':true,
								'width':500,
								height : 500,
								'autoOpen' : false
								});
							$D.anycontent({'templateID':'ebayTemplateEditorImageUpload',data : {}});
							$D.dialog('open');
							app.ext.admin_medialib.u.convertFormToJQFU($('form',$D),'ebayTemplateMediaUpload');
							}
						}
					}, //getEditorButton_imageadd
					
				getEditorButton_image : function()	{
					return {
						css: 'image',
						text: 'Place Image',
						action: function (btn) {
							var 
								$D = $('#ebayTemplateEditorImageListModal'),
								profile = $('#templateEditor').data('profile'),
								jhtmlobject = this; //'this' is set by jhtmlarea to the iframe.
							if($D.length)	{
								$D.empty(); //clear contents
								}
							else	{
								$D = $("<div \/>",{'id':'ebayTemplateEditorImageListModal'});
								$D.dialog({
									'title' : 'Select Media',
									'modal':true,
									'width':'60%',
									'autoOpen' : false
									});
								}
							$D.append("<ul class='listStyleNone' data-bind='var: media(@images); format:processList; loadsTemplate:ebayTemplateEditorMediaFileTemplate;' \/>");
							$D.dialog('open');
							$D.showLoading({'message':'Updating File List'});
							app.ext.admin_medialib.calls.adminImageFolderDetail.init('_ebay/'+profile,{'callback' : function(rd){
								if(app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									//success content goes here.
									var L = app.data[rd.datapointer]['@images'].length;
			//need a 'path' set for the data-bind to render.
									for(var i = 0; i < L; i += 1)	{
										app.data[rd.datapointer]['@images'][i]['path'] = "_ebay/"+profile+"/"+app.data[rd.datapointer]['@images'][i]['Name']
										}
									$D.anycontent({'datapointer':rd.datapointer});
									app.u.handleAppEvents($D,{'btn':btn,'jhtmlobject':jhtmlobject});
									$D.imagegallery({
										selector: 'a[data-gallery="gallery"]',
										show: 'fade',
										hide: 'fade',
										fullscreen: false,
										slideshow: false
										});
									$D.dialog("option", "position", "center");
									}
								}},'mutable');
							app.model.dispatchThis('mutable');
							}
						}
					}, //getEditorButton_image



				getEditorButton_style : function(){
					return {
						css : 'styletagedit',
						'text' : 'Style Tags',
						action: function (btn) {
							var jhtml = this; //the jhtml object.
							var $D = app.ext.admin.i.dialogCreate({
								'title' : 'Add/Update CSS Classes'
								});
							$D.attr('id','templateEditorCSSDialog');

							$D.dialog('option','width','500');
//							$D.dialog('option','modal',false); warning - toggling between css editor as a dialog caused template iframe body to empty. odd.
							
							var $style = $('.jHtmlArea iframe:first',$('#templateEditor')).contents().find("style:first");
//templatebuildercss is not editable. it's what the app adds for highlighting classes and it is nuked on save.
//if that's the first style on the page, append a new style tag to the head of the template for future use.
							if($style.parent().attr('id') == 'templateBuilderCSS')	{
								app.u.dump("First style tag is the templateBuilderCSS. Don't use it.");
								$style = $("<style \/>"); 
								$('.jHtmlArea iframe:first',$('#templateEditor')).contents().find("head").append($style);
								}

							$("<textarea \/>").width('100%').height('350px').on('blur',function(){
								$style.text($(this).val())
								}).val($style.html()).appendTo($D);
							$D.dialog('open');
							}
						}
					}, //getEditorButton_style

				getEditorButtonNativeApp : function(){
					return {
						css : 'nativeappinputsshow',
						'text' : 'Native App Settings',
						action: function () {
						
							var $metaTags = app.ext.admin_templateEditor.u.pluckObjectFromTemplate('meta')
							var data = {};

//							app.u.dump(" -> $metaTags.length: "+$metaTags.length); app.u.dump($metaTags instanceof jQuery);
							
							$metaTags.each(function(){
								data[$(this).attr('name')] = $(this).attr('content');
								})

//							app.u.dump("meta data: "); app.u.dump(data);

							var $D = app.ext.admin.i.dialogCreate({
								'title' : 'Native App Settings (iOS and Android)',
								'templateID' : 'nativeAppCampaignSettingsTemplate',
								'data' : data
								});
							$D.dialog('option','width','500');
							$D.dialog({ buttons: [
								{ text: "Close", click: function() { $( this ).dialog( "close" ); } },
								{ text: "Apply", click: function() {
									var sfo = $('form',$D).serializeJSON();
									var $templateHead = app.ext.admin_templateEditor.u.pluckObjectFromTemplate('head');
//									app.u.dump(" -> sfo: "); app.u.dump(sfo);

									$D.showLoading({"message":"Applying Changes"});
									for(index in sfo)	{
										var $meta = app.ext.admin_templateEditor.u.pluckObjectFromTemplate("meta[name='"+index+"']");
										//update meta if it already exists.
										if($meta.length)	{ //data is a list of meta tags that existed at the outset of this operation. if it's here, it exists as a meta in the template already.
//											app.u.dump(" --> MATCH!");
											$meta.attr('content',sfo[index]);
											}
										//add meta if it doesn't already exist.
										else	{
//											app.u.dump(" --> NO match!");
											$templateHead.prepend("<meta name='"+index+"' content='"+sfo[index]+"' />");
											}
										}
									$D.hideLoading();
									$( this ).dialog( "close" );
//									$D.anymessage(app.u.successMsgObject('Changes applied.'));
									} } ] });

						$('.applyDatetimepicker',$D).datetimepicker({
							changeMonth: true,
							changeYear: true,
							minDate : 0, //can't start before today.
							dateFormat : 'yymmdd',
							timeFormat:"HHmm00", //HH vs hh gives you military vs standard time (respectivly)
							stepMinute : 60
							});
						$('.ui_tpicker_second',$D).hide(); //don't show second chooser, but have it so the seconds are added to the input.

							$D.dialog('open');
							}
						}
					}, //getEditorButton_ios


//returns an array that gets appended to the html editor toolbar.
				getEditorButton_prodattributeadd : function()	{
	
					return {
						css : 'prodattributeadd',
						'text' : 'Add a Product Attribute',
						action: function (btn) {
							var jhtml = this; //the jhtml object.
							var $D = app.ext.admin.i.dialogCreate({
								'title' : 'Add Product Attribute'
								});
							$D.dialog('open');
							
							var attributes = [
								{attribute: 'zoovy:prod_name', data : {'input-cols':'100','input-type':'TEXTBOX','label':'Name','object':'PRODUCT'},'id':'PROD_NAME'},
								{attribute: 'zoovy:prod_mfg', data : {'input-cols':'50','input-type':'TEXTBOX','label':'Manufacturer','object':'PRODUCT'},'id':'PROD_MFG' },
								{attribute: 'zoovy:prod_mfgid', data : {'input-cols':'50','input-type':'TEXTBOX','label':'Manufacturer\'s ID','object':'PRODUCT'},'id':'PROD_MFGID' },
								{attribute:'zoovy:prod_desc', data : {'input-cols':'80','input-rows':'5','input-type':'TEXTAREA','label':'Description','object':'PRODUCT'},'id':'PROD_DESC' },
								{attribute:'zoovy:prod_detail', data : {'input-cols':'80','input-rows':'5','input-type':'TEXTAREA','label':'Specifications','object':'PRODUCT'},'id':'PROD_DETAIL' },
								{attribute:'zoovy:prod_features', data : {'input-cols':'80','input-rows':'5','input-type':'TEXTAREA','label':'Features','object':'PRODUCT'},'id':'PROD_FEATURES' },
								]
							//add ten images to the end of the attributes list.
							for(var i = 1; i <= 10; i += 1)	{
								attributes.push({attribute:'zoovy:prod_image'+i, data : {'label':'Image '+i,'object':'PRODUCT','format':'img'},'id':'PROD_IMAGE'+i });
								}

							app.ext.admin_templateEditor.u.appendAttributeListTo($D,jhtml,attributes);
							}
						}
					}, //getEditorButton_prodattributeadd

//returns an array that gets appended to the html editor toolbar.
				getEditorButton_buyerattributeadd : function()	{
	
					return {
						css : 'buyerattributeadd',
						'text' : 'Add a Buyer Attribute',
						action: function (btn) {
							var jhtml = this; //the jhtml object.
							var $D = app.ext.admin.i.dialogCreate({
								'title' : 'Add Buyer Attribute'
								});
							$D.dialog('open');
							
							var attributes = [
								{attribute: 'buyer:firstname', data : {'input-cols':'100','input-type':'TEXTBOX','label':'First name','object':'BUYER'},'id':'BUYER_FIRSTNAME'},
								{attribute: 'buyer:email', data : {'input-cols':'50','input-type':'TEXTBOX','label':'Email address','object':'BUYER'},'id':'PROD_EMAIL' }
								]

							app.ext.admin_templateEditor.u.appendAttributeListTo($D,jhtml,attributes);
							}
						}
					}, //getEditorButton_prodattributeadd
				
				appendAttributeListTo : function($D,jhtml,attributes)	{
					var r = true; //set to false if error occurs. Otherwise true. I used to determine what is returned.
					if($D && jhtml && attributes)	{
						var $ul = $("<ul \/>");
						var L = attributes.length;
						for(var i = 0; i < L; i += 1)	{
							$("<li \/>").addClass('lookLikeLink').text(attributes[i].data.label).data('attributeIndex',i).appendTo($ul);
							}

						$ul.appendTo($D);
						$ul.on('click',function(e){
							var $target = $(e.target); //the element that was clicked.
	//								app.u.dump(" -> attributes[i]"); app.u.dump(attributes[$target.data('attributeIndex')]);
							if(app.ext.admin_templateEditor.u.applyElementToTemplate(jhtml,attributes[$target.data('attributeIndex')]))	{
								$D.dialog('close');
								}
							else	{
								$D.anymessage({"message":"Uh Oh! Something went wrong. Please try that again or try again later. dev: see console for details."});
								}
							});
						}
					else if(!jhtml)	{
						r = false;
						app.u.dump("In admin_templateEditor.u.applyElementToTemplate, jhtml was not defined and it is required.");
						}
					else	{
						r = false;
						app.u.dump("In admin_templateEditor.u.applyElementToTemplate, attObj was empty/missing vars. attObj requires data, attribute and data.object. attObj: "); app.u.dump(attObj);
						}
					return (r === true) ? $ul : false;
					},

//this function does NOT escape the selector, so any selector that is a variable and needs escaping should be escaped before it's dumped in.
				pluckObjectFromTemplate : function(selector)	{
					return $('.jHtmlArea iframe:first',$('#templateEditor')).contents().find(selector);
					},
				
				applyElementToTemplate : function(jhtml,attObj){
					var r = true; //what is returned. true or false if element inserted successfully.
					if(jhtml && attObj && attObj.data && attObj.attribute && attObj.data.object && (attObj.data['input-type'] || attObj.data.format))	{
						var html = ''; //html to be inserted into template.
						
						function data2Attribs(data)	{
							var attribs = " ";
							for(index in data)	{
								attribs += index+"='"+data[index]+"' ";
								}
							return attribs;
							}
						
						
						if(attObj.data.format == 'img')	{
							html = "<span class='attributeContainer_"+attObj.data.object+"' data-attrib='"+
								attObj.attribute
								+"' data-if='BLANK' data-object='"+attObj.data.object+"' data-then='REMOVE' id='"+
								attObj.ID
								+"_CONTAINER'><a data-attrib='"+
								attObj.attribute
								+"' data-format='img' data-img-bgcolor='ffffff' data-img-border='0' data-img-data='"+attObj.data.object.toLowerCase()+":"+
								attObj.attribute
								+"' data-img-zoom='1' data-label='"+
								attObj.data.label
								+"' data-object='"+attObj.data.object+"' id='"+
								attObj.ID
								+"_HREF' width='200'><img data-attrib='"+
								attObj.attribute
								+"' data-format='img' data-img-bgcolor='ffffff' data-img-border='0' data-img-data='"+attObj.data.object.toLowerCase()+":"+
								attObj.attribute
								+"' data-img-zoom='1' data-label='"+
								attObj.data.label
								+"' data-object='"+attObj.data.object+"' id='"+
								attObj.ID
								+"' src='placeholder-2.png' width='200'></a></span>"
							}
						else if(attObj.data['input-type'] == 'TEXTBOX' || attObj.data['input-type'] == 'TEXTAREA')	{
							html = "<span class='attributeContainer_"+attObj.data.object+"' data-attrib='"+attObj.attribute+"' data-input-data='"+attObj.data.object.toLowerCase()+":"+attObj.attribute;
							html += data2Attribs(attObj.data);
							html += "id='"+attObj.ID+"'>"+attObj.data.label+" ";
							if(attObj.data['input-type'] == 'TEXTAREA')	{
								html += "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Mauris metus tortor, tincidunt eu commodo ac, tristique eget magna. Ut ante ante, tempus id condimentum non, eleifend in tellus. Fusce vitae tellus vestibulum, dapibus turpis laoreet, dapibus enim. Vivamus in lorem aliquam, consequat enim nec, laoreet nulla. Proin sapien enim, ultrices at nunc id, dictum blandit sapien. Mauris sit amet arcu auctor, aliquam eros laoreet, venenatis erat. Nunc ut elementum nulla, at imperdiet turpis. Nulla nec nunc consequat, commodo dui id, varius lacus. Cras ultricies metus eu justo placerat bibendum. Duis non risus accumsan, vehicula leo non, feugiat odio. Nullam lacinia tempor enim suscipit auctor. Praesent nunc purus, sodales at rutrum vitae, blandit quis dolor. Etiam vehicula justo ac massa accumsan mollis in ut purus. Donec id sagittis sapien."
								}
							html += "</span>"
							}
						else	{
							app.u.dump("In admin_templateEditor.u.applyElementToTemplate, either  data-type ["+attObj.data['input-type']+"] is invalid or data-format ["+attObj.data.format+"] is invalid. attObj:"); app.u.dump(attObj);
							r = false;
							}
						
						if(r)	{jhtml.pasteHTML(html)}
						
						}
					else if(!jhtml)	{
						app.u.dump("In admin_templateEditor.u.applyElementToTemplate, jhtml was not defined and it is required.");
						}
					else	{
						app.u.dump("In admin_templateEditor.u.applyElementToTemplate, attObj was empty/missing vars. attObj requires data, attribute and data.object. attObj: "); app.u.dump(attObj);
						r = false;
						}
					return r;
					}

			}, //u [utilities]



////////////////////////////////////   EVENTS [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



			e : {
//a site index.html file may contain several editable 'templates', each with their own wizard.
//a dropdown is added to the template editor to allow the user to select a given template. The wizard file is then loaded.
				adminSiteTemplateEdit : function($ele)	{
					
					$ele.off('change.adminSiteTemplateEdit').on('change.adminSiteTemplateEdit',function(){
						//when a template is changed, all that needs to be done is to load the wizard. the wizard should take care of everything.
						app.ext.admin_templateEditor.u.summonWizard("wizard-"+$(this).val()+".html")
						});
					
					},

				adminSaveAsTemplateExec : function($btn)	{
					$btn.button();
					$btn.off('click.adminSaveAsTemplateExec').on('click.adminSaveAsTemplateExec',function(){
						var
							templateName = $('#templateName').val(),
							$D = $('#templateEditor');
						var mode = $D.data('mode');
						
						if(!app.ext.admin_templateEditor.u.missingParamsByMode(mode,$D.data()))	{

							$D.showLoading({'message':'Saving as new template: '+templateName});
							var dObj = {
								'SUBDIR' : templateName,
//								'PROJECTID' : $D.data('PROJECTID'), //not passed cuz the user doesnt 'choose' the projectid. it'll be set to TEMPLATES
								'_tag' : {
									'callback' : function(responseData)	{
										$D.hideLoading();
										if(app.model.responseHasErrors(responseData)){
											$D.anymessage({'message':responseData})
											}
										else	{
											$D.anymessage(app.u.successMsgObject('The contents have been saved as a template.'));
											}
										}
									}
								}

							dObj._cmd = (mode == 'EBAYProfile') ? 'adminEBAYTemplateCreateFrom' : 'admin'+mode+'TemplateCreateFrom';

							if(mode == 'EBAYProfile')	{dObj.PROFILE = $D.data('profile');}
							else if(mode == 'Campaign')	{dObj.CAMPAIGNID = $D.data('campaignid');}
							else	{} //shouldn't ever get here.

							app.model.addDispatchToQ(dObj,'immutable');
							app.model.dispatchThis('immutable');

							}
						else	{
							$D.anymessage({'message':app.ext.admin_templateEditor.u.missingParamsByMode(mode,$D.data())});
							}
						});
					},
					
//executed when a template is selected.
				templateChooserExec : function($ele)	{
					if($ele.is('button'))	{$ele.button();}
					$ele.off('click.templateChooserExec').on('click.templateChooserExec',function(event){
						event.preventDefault();
						app.ext.admin_templateEditor.u.handleTemplateSelect($.extend(true,{},$('#templateChooser').data(),$ele.closest("[data-app-role='templateDetail']").data()));
						});
					},



//$ele is probably an li.  This is exectued when a template preview is clicked. It'll open a detail template.
//a 'choose' button will be present within the detail pane.
			templateChooserPreview : function($ele)	{
				$ele.off('click.appChooserAppChoose').on('click.appChooserAppChoose',function(event){
					
					event.preventDefault();
					app.u.dump("BEGIN admin_templateEditor.e.templateChooserPreview");
					var $chooser = $("#templateChooser");
					var $panelContainer = $("[data-app-role='appPreviewPanel']",$chooser);
					var mode = $chooser.data('mode');
					
					if(mode)	{
						app.u.dump(" --> mode is set ("+mode+")");
						var listDP = (mode == 'EBAYProfile') ? 'adminEBAYTemplateList' : 'admin'+mode+'TemplateList'; //ebay is ebayprofile most of the time, but sometimes just ebay. handy.
						if(app.data[listDP] && app.data[listDP]['@TEMPLATES'] && app.data[listDP]['@TEMPLATES'][$ele.data('obj_index')])	{
							var templateData = app.data[listDP]['@TEMPLATES'][$ele.data('obj_index')];
							var $panel = $("[data-subdir='"+templateData.SUBDIR+"']",$panelContainer);
							
//							app.u.dump(" -> $chooser.length: "+$chooser.length);
//							app.u.dump(" -> $panelContainer.length: "+$panelContainer.length);
//							app.u.dump(" -> $panel already exists: "+$panel.length);
							
							if($panel.length)	{} //panel is already on the dom (li already clicked once). do nothing just yet.
							else	{
								app.u.dump(" --> panel is NOT generated (first time click). build new panel");
								$panel = $("<div \/>").hide().attr('data-app-role','templateDetail').anycontent({'templateID':'templateChooserDetailTemplate','data':templateData});
								$panel.attr('data-subdir',templateData.SUBDIR);
								$panel.data(app.u.getBlacklistedObject(templateData,['@PREVIEWS','%info','MID']));
								$panel.appendTo($panelContainer);
								app.u.handleAppEvents($panel);
								}

							//set all preview li's to default state then the new active one to active.
							$ele.parent().find('li').each(function(){$(this).removeClass('ui-state-active').addClass('ui-state-default')});
							$ele.addClass('ui-state-active').removeClass('ui-state-default');
							if($panel.is(':visible'))	{} //panel already in focus. do nothing.
							else if($panelContainer.children().length > 1)	{
								app.u.dump(" --> more than 1 child. transition between them");
//hide the current preview and show the new one.					
								$("[data-app-role='templateDetail']:visible",$panelContainer).first().hide('scale',function(){
									$panel.show('scale');
									});
								}
							else	{
								app.u.dump(" --> only 1 panel. just expand.");
								$panel.show('scale',function(){
									app.u.dump(' --> now recenter the dialog');
									//after the first preview is displayed, resize and recenter the modal.
									$chooser.dialog("option", "position", "center");
									$chooser.dialog('option','height',($('body').height() - 100));
									});
								}
							}
						else	{
							$chooser.anymessage({'message':'In admin_templateEditor.e.templateChooserPreview, could not obtain data (app.data.admin'+mode+'TemplateList or @TEMPLATES within that or ['+$ele.data('obj_index')+'] within that was unavailable.','gMessage':true})
							}
						}
					else	{
						$chooser.anymessage({'message':'In admin_templateEditor.e.templateChooserPreview, unable to ascertain mode from templateChooser.','gMessage':true})
						}
					});
				},


//used to upload a file (img, zip, .html, etc) into a profile or campaign.				
				containerFileUploadShow : function($btn){
					if($btn.is('button'))	{
						$btn.button({icons: {primary: "ui-icon-arrowthickstop-1-n"},text: ($btn.data('hidebuttontext')) ? false : true});
						}

					if($btn.data('mode') == 'Site')	{
						var domainname = $btn.closest("[data-domainname]").data('domainname');
						if(app.data['adminDomainDetail|'+domainname])	{
							if(app.data['adminDomainDetail|'+domainname].PROJECTID)	{
								//this domain has a project. open the editor. that occurs later as long as pass=true.
								}
							else	{
								$btn.hide();
								}
							}
						else 	{
							$btn.hide();
							}	
						}

					$btn.off('click.containerFileUploadShow').on('click.containerFileUploadShow',function(){
						var mode = $btn.data('mode');
						var data = $btn.closest('.buttonset').data();
						
						var $D = app.ext.admin.i.dialogCreate({
							'title' : 'Template File Upload',
							'templateID' : 'templateFileUploadTemplate',
							data : {} //blank data because translation needs to occur (template calls another template)
							});
						$D.dialog('option','height','400');
						$D.dialog('open');
						
						if(!app.ext.admin_templateEditor.u.missingParamsByMode(mode,data))	{
							$('form',$D).append("<input type='hidden' name='mode' value='"+mode+"' \/>");
							if(mode == 'EBAYProfile')	{
								$('form',$D).append("<input type='hidden' name='profile' value='"+data.profile+"' \/>");
								}
							else if(mode == 'Campaign')	{
								$('form',$D).append("<input type='hidden' name='campaignid' value='"+data.campaignid+"' \/>");
								}
							else if(mode == 'Site')	{
								$('form',$D).append("<input type='hidden' name='domain' value='"+data.domainname+"' \/>");
								}
							else	{}
							
							app.ext.admin_medialib.u.convertFormToJQFU($('form',$D),'adminFileUpload');	
							}
						else	{
							$D.anymessage({'message':app.ext.admin_templateEditor.u.missingParamsByMode(mode,data)});
							}
						});
					}, //containerFileUploadShow
				
// used to download a zip file of a 'container' (which is a template saved into a profile or campaign).
				containerZipDownloadExec : function($btn)	{
					$btn.button({icons: {primary: "ui-icon-arrowthickstop-1-s"},text: ($btn.data('hidebuttontext')) ? false : true});
//lock button for 'site' if no projectid is set or it's unavailable.
					if($btn.data('mode') == 'Site')	{
						var domainname = $btn.closest(".buttonset").data('domain');
						if(app.data['adminDomainDetail|'+domainname])	{
							if(app.data['adminDomainDetail|'+domainname].PROJECTID)	{
								//this domain has a project. do nothing to the button.
								}
							else	{
								$btn.button('disable').attr('title','Download not available because no project exists for this domain.');
								}
							}
						else 	{
							$btn.button('disable').attr('title','Download not available because domain ['+domainname+'] data not in memory.');
							}	
						}


					$btn.off('click.containerZipDownloadExec').on('click.containerZipDownloadExec',function(){

						var mode = $btn.data('mode');
						var data = $btn.closest('.buttonset').data();
app.u.dump(" -> data: "); app.u.dump(data);
						if(!app.ext.admin_templateEditor.u.missingParamsByMode(mode,data))	{
							$(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')).showLoading({'message':'Building a zip file. One moment please...'});
							var dObj = {
								'_cmd' : 'admin'+mode+'ZipDownload',
								'base64' : true,
								'_tag' : {
									'callback':'fileDownloadInModal',
									'datapointer':'templateZipDownload',
									'jqObj' : $(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content'))
									}
								}
							
							if(mode == 'EBAYProfile')	{
								dObj.PROFILE = data.profile;
								}
							else if(mode == 'Campaign')	{
								dObj.CAMPAIGNID = data.campaignid;
								}
							else if(mode == 'Site')	{
								dObj.DOMAIN = data.domain;
								}
							else	{} //shouldn't get here.
							
							app.model.addDispatchToQ(dObj,'immutable');
							app.model.dispatchThis('immutable');							
							
							}
						else	{
							$('#globalMessaging').anymessage({'message':"In admin_templateEditor.e.containerZipDownloadExec, "+app.ext.admin_templateEditor.u.missingParamsByMode(mode,data)+". The required params should be on the .buttonset around the download button"});
							}
						});
					}, //containerZipDownloadExec

				adminTemplateCampaignExit : function($btn)	{
					$btn.button();
					$btn.off('click.adminTemplateCampaignExit').on('click.adminTemplateCampaignExit',function(){
var data = $btn.closest("[data-app-role='templateEditor']").data();
if(data.editor='dialog')	{
	//we're in a dialog, just close it.
	$btn.closest('.ui-content-dialog').dialog('close');
	}
else	{
	if(data.mode == 'Campaign')	{
		app.ext.admin_customer.a.showCampaignEditor($(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")),data.campaignid);
		}
	else if(data.mode == 'EBAYProfile')	{
		app.ext.admin_syndication.a.showEBAYLaunchProfileEditor($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')),data.profile);
		}
	else	{
		
		}
	}
						})

					}, //adminTemplateCampaignExit

				adminTemplateCampaignTestShow : function($btn)	{
					$btn.button();

					$btn.off('click.adminTemplateCampaignTestShow').on('click.adminTemplateCampaignTestShow',function(){
						var $D = app.ext.admin.i.dialogCreate({"title":"Send a Test Email for this Campaign"});
						var $input = $("<input \/>",{'name':'email','type':'email','placeholder':'email address'}).appendTo($D);
						
						$D.dialog('option','width','350');
						$D.dialog({ buttons: [ { text: "Send Test", click: function() { 
							if(app.u.isValidEmail($input.val()))	{
								$D.showLoading({'message':'Sending Test Email'});
								app.ext.admin_templateEditor.u.handleTemplateSave($('#templateEditor'));
								app.model.addDispatchToQ({
									'_cmd':'adminCampaignTest',
									'CAMPAIGNID' : $('#templateEditor').data('campaignid'),
									'RECIPIENTS' : "emails="+$input.val()+"\n",
									'_tag':	{
										'callback':function(rd)	{
											$D.hideLoading();
											if(app.model.responseHasErrors(rd)){
												$D.anymessage({'message':rd});
												}
											else	{
												$D.anymessage(app.u.successMsgObject('Test email has been sent'));
												$D.dialog({ buttons: [ { text: "Close", click: function() {$D.dialog('close')}}]});
												}
											}
										}
									},'immutable');
								app.model.dispatchThis('immutable');
								}
							else	{
								$D.anymessage({'message':'Please enter a valid email address.'});
								}
						 } } ] });
						$D.dialog('open');
						});
					
					},
//USES DELEGATED EVENTS
				adminEBAYProfilePreviewShow : function($ele,p)	{
						var $D = app.ext.admin.i.dialogCreate({"title":"HTML Listing Preview"});
						$D.dialog('open');
//this is used in the product editor 
var pid = $ele.closest("[data-pid]").data('pid');
var profile = $ele.closest('form').find("[name='zoovy:profile']").val();

if(profile && pid)	{

	app.model.addDispatchToQ({
		'_cmd':'adminEBAYProfilePreview',
		'pid' : pid,
		'PROFILE' : profile,
		'_tag':	{
			'datapointer' : 'adminEBAYProfilePreview',
			'callback':function(rd)	{
				$D.hideLoading();
				if(app.model.responseHasErrors(rd)){
					$D.anymessage({'message':rd});
					}
				else	{
					$D.append(app.data[rd.datapointer].html);
					$D.dialog('option', 'height', ($('body').height() - 100));
					$D.dialog('option', 'position', 'center');
					}
				}
			}
		},'immutable');
	app.model.dispatchThis('immutable');
	}
else	{
	$('#globalMessaging').anymessage({"message":"In admin_templateEditor.e.adminEBAYProfilePreviewShow, either pid ["+pid+"] or profile ["+profile+"] not set. Both are required.","gMessage":true});
	}

					},

				templateEditorIframeResizeExec : function($ele)	{
					var $iframe = $('.jHtmlArea iframe:first',$('#templateEditor'));
					$iframe.data('originalHeight',$iframe.height());
					$iframe.parent().removeClass()
					$iframe.parent().find('.device').remove(); //remove all css classes from parent, then any 'device' elements used for bg's 
					$iframe.parent().addClass('templatePreviewContainer');
					$ele.off('change.templateEditorIframeResizeExec').on('change.templateEditorIframeResizeExec',function(){
						if($ele.val() == 'default')	{
							$iframe.width('100%').height($iframe.data('originalHeight'));
							$iframe.parent().addClass('default').append($("<div class='device default' \/>"));
							}
						else if($ele.val().indexOf('x') > -1)	{
							$iframe.width($ele.val().split('x')[0]).height($ele.val().split('x')[1]);
							var $option = $('option:selected',$ele);
							if($option.data('deviceclass'))	{
								$iframe.addClass('portrait').parent().addClass($option.data('deviceclass')).append($("<div class='device "+$option.data('deviceclass')+" portrait' \/>"));
								}
							}
						else	{
							$ele.parent().anymessage({'message':'An unknown size was selected.'});
							}

						});
					},

				templateEditorIframeRotateExec : function($btn)	{
					$btn.button();
					var $iframe = $('.jHtmlArea iframe:first',$('#templateEditor'));
					$btn.off('click.templateEditorIframeResizeExec').on('click.templateEditorIframeResizeExec',function(){
//						app.u.dump("rotate click event triggered. iframe.length: "+$iframe.length);
						var W = $iframe.width();
						$iframe.width($iframe.height()).height(W);
						$iframe.parent().find('.device ,iframe').toggleClass('portrait landscape');
						});
					},

//opens the template chooser interface.
				templateChooserShow : function($btn)	{
					if($btn.is('button'))	{
						$btn.button({icons: {primary: "ui-icon-power"},text: ($btn.data('hidebuttontext')) ? false : true}); //text defaults to on.
						}
					$btn.off('click.templateChooserShow').on('click.templateChooserShow',function(){

						if($btn.data('mode') == 'Campaign')	{
							app.ext.admin_templateEditor.a.showTemplateChooserInModal({"mode":"Campaign","campaignid":$btn.closest("[data-campaignid]").data('campaignid')});
							}
						else if ($btn.data('mode') == 'Site')	{
							var domainname = $btn.closest("[data-domainname]").data('domainname');
							var hostname = $btn.closest("[data-hostname]").attr('data-hostname');
							if(hostname && domainname)	{
								app.ext.admin_templateEditor.a.showTemplateChooserInModal({"mode":"Site","domain":hostname.toLowerCase()+'.'+domainname});
								}
							else	{
								$('#globalMessaging').anymessage({'message':'In admin_templateEditor.e.templateEditorShow, unable to resolve domain name ['+domainname+'] and/or host name ['+hostname+'].','gMessage':true});
								}
							}
						else if ($btn.data('mode') == 'EBAYProfile')	{
							app.ext.admin_templateEditor.a.showTemplateChooserInModal({"mode":"EBAYProfile","profile":$btn.closest("[data-profile]").data('profile')});
							}
						else	{
							//invalid mode set.
							$('#globalMessaging').anymessage({"message":"In admin_templateEditor.e.templateChooserShow, invalid mode ["+$btn.data('mode')+"] set on button.","gMessage":true});
							}
						});
					}, //templateChooserShow

				templateEditorShow : function($btn)	{
//					app.u.dump(" -> $btn.data('buttontext'): "+$btn.data('buttontext'));
					if($btn.is('button'))	{
						$btn.button({icons: {primary: "ui-icon-wrench"},text: ($btn.data('hidebuttontext')) ? false : true}); //text defaults to on.
						}
				
					$btn.off('click.templateEditorShow').on('click.templateEditorShow',function(){
						var pass = true;
						if($btn.data('mode') == 'Campaign')	{
							app.ext.admin_templateEditor.a.showTemplateEditor('Campaign',{"campaignid":$btn.closest("[data-campaignid]").data('campaignid')});
							}
						else if ($btn.data('mode') == 'EBAYProfile')	{
							app.ext.admin_templateEditor.a.showTemplateEditor('EBAYProfile',{"profile":$btn.closest("[data-profile]").data('profile')});
							}
						else if ($btn.data('mode') == 'Site')	{
							
							var domainname = $btn.closest("[data-domainname]").data('domainname');
							var hostname = $btn.closest("[data-hostname]").attr('data-hostname');
							
							if(hostname && domainname)	{
								app.ext.admin_templateEditor.a.showTemplateEditor('Site',{"domain":hostname.toLowerCase()+'.'+domainname});
								}
							else	{
								$('#globalMessaging').anymessage({'message':'In admin_templateEditor.e.templateEditorShow, unable to resolve domain name ['+domainname+'] and/or host name ['+hostname+'].','gMessage':true});
								}
							}
						else	{
							//invalid mode set.
							$('#globalMessaging').anymessage({"message":"In admin_templateEditor.e.templateEditorShow, invalid mode ["+$btn.data('mode')+"] set on button.","gMessage":true});
							}
						});
					}, //templateEditorShow

				startWizardExec : function($btn)	{
					$btn.button();
					var $meta = $('.jHtmlArea iframe:first',$('#templateEditor')).contents().find("meta[name='wizard']");
					var editorData = $('#templateEditor').data(); 
					
					if($meta.length == 0)	{$btn.button('disable')}
					else	{
//						app.u.dump(" -> $meta.attr('content'): "+$meta.attr('content'));
						$btn.off('click.startWizardExec').on('click.startWizardExec',function(event){
							$btn.button('disable').hide();
							event.preventDefault();
							app.ext.admin_templateEditor.u.summonWizard($meta.attr('content'));
							});
						}
					},

				templateHighlightToggle : function($cb)	{
					$cb.anycb();
					$cb.on('change',function(){
						if($cb.is(':checked'))	{
							$('iframe',$cb.closest("[data-app-role='templateEditor']")).contents().find('body').addClass('showHighlights_'+$cb.data('objecttype'));
							}
						else	{
							$('iframe',$cb.closest("[data-app-role='templateEditor']")).contents().find('body').removeClass('showHighlights_'+$cb.data('objecttype'));
							}
						});
					},

				adminTemplateSaveExec : function($btn)	{
					$btn.button();
					$btn.off('click.adminTemplateSaveExec').on('click.adminTemplateSaveExec',function(){
						var $D = $('#templateEditor');
						if(!app.ext.admin_templateEditor.u.missingParamsByMode($D.data('mode'),$D.data()))	{
							app.ext.admin_templateEditor.u.handleTemplateSave($D); 
							app.model.dispatchThis('immutable');
							}
						else	{
							$D.anymessage({'message':app.ext.admin_templateEditor.u.missingParamsByMode(mode,$D.data())});
							}
						});
	
					},

//executed on click in file chooser portion of the template editor (in jhtml toolbar add image)
				ebayHTMLEditorAddImage : function($ele,vars)	{
					$ele.off('click.ebayHTMLEditorAddImage').on('click.ebayHTMLEditorAddImage',function(){
	 // Insert an Image by URL
						vars.jhtmlobject.image($ele.closest("[data-name]").data('Name'));
						$('#ebayTemplateEditorImageListModal').dialog('close');
						});
					}
		
			} //e [app Events]
		} //r object.
	return r;
	}