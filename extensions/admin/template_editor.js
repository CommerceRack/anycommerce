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


var admin_template = function(_app) {
	
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
					// _app.model.fetchNLoadTemplates(_app.vars.baseURL+'extensions/admin/template_editor.html',theseTemplates);
					_app.ext.admin_template.u.declareMagicFunctions(); //adds some global functions to the dom. shortcuts for template editing.
					return r;
					},
				onError : function()	{
	//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
	//you may or may not need it.
					_app.u.dump('BEGIN admin_orders.callbacks.init.onError');
					}
				} //init
			}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		a : {


			showTemplateEditor : function($target, vars){
				vars = vars || {};
				if($target instanceof jQuery)	{
					if(vars.mode)	{
						if(!_app.ext.admin_template.u.missingParamsByMode(vars.mode,vars))	{
//everything that is necessary is now confirmed to be present.

//make sure that no previous template editor data is on the target.					
							$target.removeData('profile campaignid domain mode');
							
							var taID = 'textarea_'+_app.ext.admin_template.u.buildTemplateEditorID(vars); //added to textarea dynamically. if already on DOM, do no open another instance of editor.

							if(taID)	{
								var $textarea = $(_app.u.jqSelector('#',taID));
								if($textarea.length)	{
									$target.anymessage({"message":"You are attempting to open an instance of a template which is already open ("+_app.ext.admin_template.u.buildTemplateEditorTitle+") in "+($textarea.closest('.tabContent').data('section'))+". To reduce the likelyhood of inadvertantly saving over changes, only one copy of a template may be edited at a time.","errtype":"halt","persistent":true});
									}
								else	{
									//check to see if this editor has already been opened and, if so, remove instance.
									//if a tinymce instance is opened and not properly removed, opening it again will not work. the 'exit' button in the editor does properly remove.
									if(_app.u.thisNestedExists("tinymce.editors."+taID)){
										delete tinymce.editors[taID];
										};
									$target.prepend("<h1>"+_app.ext.admin_template.u.buildTemplateEditorTitle(vars)+"<\/h1>");
									$target.attr({'data-app-role':'templateEditor','data-templateeditor-role':'container','id':'TE_'+_app.ext.admin_template.u.buildTemplateEditorID(vars)});

									$target.data(vars); //vars.profile is used in the media lib to get the profile. don't change it.

									$target.showLoading({"message":"Fetching template HTML"});
									var callback = function(rd){
										$target.hideLoading();
										if(_app.model.responseHasErrors(rd)){
											$target.anymessage({'message':rd});
											}
										else	{
											_app.u.dump(' -> template contents obtained');
								//this is in the callback so that if the call fails, a blank/broken editor doesn't show up.
											$target.anycontent({'templateID':'templateEditorTemplate','showLoading':false,'data':{}}); //pass in a blank data so that translation occurs for loads-template
											$target.anyform();
											_app.u.addEventDelegation($target);
											_app.u.handleCommonPlugins($target);
											_app.u.handleButtons($target);
	
											var $objectInspector = $("[data-app-role='templateObjectInspectorContent']",$target), $textarea = $("textarea[data-app-role='templateEditorTextarea']:first",$target);

											$("[data-app-role='templateObjectInspectorContainer']",$target).anypanel({
												'state' : 'persistent',
												showClose : false, //set to false to disable close (X) button.
												wholeHeaderToggle : true, //set to false if only the expand/collapse button should toggle panel (important if panel is draggable)
												extension : 'template_editor', //used in conjunction w/ persist.
												name : 'templateEditorObjectInspector', //used in conjunction w/ persist.
												persistentStateDefault : 'collapse',
												persistent : true
												});
											
											$textarea.attr('id',taID);

	// ### TODO -> here, if mode == site, a modified version of the editor needs to get run. each 'template' within the site get's it's own editor. Prob. put all these in an accordion.
	// old. 	_app.ext.admin_template.u.handleTemplateModeSpecifics(vars.mode,vars,$iframeBody,$target); //needs to be after iframe is added to the DOM.
											if(vars.mode == 'Site')	{
												$textarea.hide(); //the default text area isn't used.
												_app.ext.admin_template.u.buildSupplementalSiteEditors($target,$(_app.ext.admin_template.u.preprocessTemplate(vars.mode,vars,_app.data[rd.datapointer]['body'])));
												}
											else	{
												$textarea.val(_app.ext.admin_template.u.preprocessTemplate(vars.mode,vars,_app.data[rd.datapointer]['body']).html());
												$textarea.show();
												$textarea.tinymce({
													init_instance_callback : function(editor)	{
														var $iframe = $("iframe:first",$(editor.getContentAreaContainer()));
														var $iframeBody = $iframe.contents().find('body');
														var $meta = $iframeBody.find("meta[name='wizard']");
														if($meta.length >- 1)	{
															$("button[data-app-role='startWizardButton']:first").data('wizardContent',$meta.attr('content')).button('enable');
															}
														else	{
															$("button[data-app-role='startWizardButton']:first").button('disable');
															}
														_app.ext.admin_template.u.handleWizardObjects($iframeBody,$objectInspector);
														},
													valid_children : "head[style|meta|base],+body[style|meta|base]", //,body[style|meta|base] -> this seems to cause some dropped lines after an inline 'style'
													valid_elements: "*[*]",
													esxtended_valid_elements : "@[class]",
													menubar : 'edit insert view format table tools',
													height : ($(document.body).height() - $('#mastHead').outerHeight() - 200),
													visual: false, //turn off visual aids by default. menu choice will still show up.
													keep_styles : true,
													image_list: [],
													plugins: [
														"_image _wizblocks advlist autolink lists link charmap print preview anchor",
														"searchreplace visualblocks code fullscreen fullpage", //fullpage is what allows for the doctype, head, body tags, etc.
														"media table contextmenu paste"
														],
													toolbar: "undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link _image | code"
													});
												}

											}
										} //ends callback.

									var cmdObj = {
										'_cmd':'admin'+vars.mode+'FileContents',
										'FILENAME' : 'index.html',
										'_tag' : {
											'callback' : callback
											}
										}
									
									if(vars.mode == 'EBAYProfile')	{
										cmdObj.PROFILE = vars.profile;
										cmdObj._tag.datapointer = 'adminEBAYProfileFileContents|'+vars.profile;
										}
									else if(vars.mode == 'Campaign')	{
										cmdObj.CAMPAIGNID = vars.campaignid;
										cmdObj._tag.datapointer = 'adminCampaignFileContents|'+vars.campaignid;
										}
									else if(vars.mode == 'Site')	{
										cmdObj.DOMAIN = vars.domain;
										cmdObj._tag.datapointer = 'adminSiteFileContents|'+vars.domain;
										}
									else	{
										} //should never get this far. the if check at the top verifies valid mode. This is just a catch all.
								
									_app.model.addDispatchToQ(cmdObj,'mutable');
									_app.model.dispatchThis('mutable');

									}
								}
							else	{
								//to get here, taID is false. buildTemplateEditorID will handle the error display.
								}
							}
						else	{
							$target.anymessage({"message":"In admin_template.a.showTemplateEditor, "+_app.ext.admin_template.u.missingParamsByMode(vars.mode,vars),"gMessage":true});
							}	
						}
					else	{
						$target.anymessage({"message":"In admin_template.a.showNewTemplateEditor, vars.mode was not set and it is required","gMessage":true})
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_template.a.showNewTemplateEditor, $target was not a valid jquery instance.","gMessage":true})
					}
				},

			showTemplateChooserInModal : function(vars)	{
				vars = vars || {};
				if(!_app.ext.admin_template.u.missingParamsByMode(vars.mode,vars))	{

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

					var $D = _app.ext.admin.i.dialogCreate(dialogObject); //using dialogCreate ensures that the div is 'removed' on close, clearing all previously set data().
					$D.attr('id','templateChooser').data(vars).anyform().dialog('open');
					$D.showLoading();
					
					vars._tag = {
						'callback' : 'anycontent',
						"templateID" : "templateChooserTemplate",
						'datapointer' : vars._cmd,
						'jqObj' : $D
						}
					
					if(_app.model.fetchData(vars._tag.datapointer))	{
						_app.u.handleCallback(vars._tag);
						}
					else	{
//						_app.u.dump(" vars: "); _app.u.dump(vars);
						_app.model.addDispatchToQ(vars,'mutable');
						_app.model.dispatchThis('mutable');
						}
					
					

					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_marketplace.a.showTemplateChooserInModal, "+_app.ext.admin_template.u.missingParamsByMode(vars.mode,vars)+".","gMessage":true});
					}
				}, //showTemplateChooserInModal

			initWizard : function($wizardForm)	{
				
//the success fieldset, which is last in the list.
				$wizardForm.find('fieldset:last').after("<fieldset class='wizardCompleted' class='displayNone'>Congrats! You have completed the wizard for this template.<\/fieldset>");
				
				var
					$fieldsets = $('fieldset',$wizardForm),
					$templateEditor = $wizardForm.closest("[data-templateeditor-role='container']"), //referenced for context on multiple occasions.
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
//					_app.u.dump("Click registered in the wizard panel");
					var $target = $(e.target); //the element that was clicked.
					
//					_app.u.dump(" -> $target.is('button'): "+$target.is('button'));
//					_app.u.dump(" -> $target.data('button-action'): "+$target.data('button-action'));
//					_app.u.dump(" -> e.target.nodeNam: "+e.target.nodeNam);

//in chrome, the click event is triggered on the child span of the button, not the button itself.
					if(e.target.nodeName.toLowerCase() == 'span' && $target.parent().hasClass('ui-button'))	{
						$target = $target.parent();
						}
					
					if($target.is('button') && $target.data('button-action'))	{
//						_app.u.dump(" -> click is on a button");
						e.preventDefault(); //disable the default action.

						
//						_app.u.dump(" -> $target.data('button-action'): "+$target.data('button-action'));
						$target.data('button-action') == 'previous' ? $('fieldset:visible',$wizardForm).hide().prev('fieldset').show() : $('fieldset:visible',$wizardForm).hide().next('fieldset').show();
						
						
						var $focusFieldset = $('fieldset:visible',$wizardForm);
						fieldsetVerifyAndExecOnfocus($focusFieldset);
_app.u.dump(" -> $focusFieldset.index(): "+$focusFieldset.index());
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
						_app.ext.admin_template.u.handleWizardProgressBar($("[data-app-role='progressBar']",$templateEditor));
						}
					});
				}, //initWizard

			invoiceEditor : function($target,params)	{
				$target.addClass('ui-widget');
				var $textarea = $("<textarea \/>").val("<b>Some Content</b>").appendTo($target);
	//will need to make a resource call here and then load this as the callback, putting the body of the resource into the textarea.
				var $buttonset = $("<div \/>").addClass('buttonset alignRight smallPadding ui-widget-content');
				$("<button \/>").text('Cancel Changes').button().on('click',function(){
					navigateTo("/ext.admin_template.invoiceEditor");
					}).appendTo($buttonset);

				$("<button \/>").text('Save Changes').button().on('click',function(){
					// ### TODO -> 
					}).appendTo($buttonset);

				$buttonset.prependTo($target); //add this to DOM after all the buttons have been added. minimized DOM updates.
				
				$textarea.tinymce({
					valid_children : "head[style|meta|base],+body[style|meta|base]", //,body[style|meta|base] -> this seems to cause some dropped lines after an inline 'style'
					valid_elements: "*[*]",
					extended_valid_elements : "@[class]",
					menubar : 'edit insert view format table tools',
					height : ($(document.body).height() - $('#mastHead').outerHeight() - 200),
					visual: false, //turn off visual aids by default. menu choice will still show up.
					keep_styles : true,
					image_list: [],
					plugins: [
						"_image advlist autolink lists link charmap print preview anchor",
						"searchreplace visualblocks code fullscreen fullpage", //fullpage is what allows for the doctype, head, body tags, etc.
						"media table contextmenu paste"
						],
					toolbar: "undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link _image | code"
					});	
				
				}

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
						if($.inArray(mode,_app.ext.admin_template.vars.templateModes) > -1)	{
							if(mode == 'EBAYProfile' && !data.profile)	{
								r = "In admin_template.u.missingParamsByMode, mode set to EBAYProfile but no profile passed."
								}
							else if(mode == 'Site' && !data.domain)	{
								r = "In admin_template.u.missingParamsByMode, mode set to Site but no domain passed."
								}
							else if(mode == 'Campaign' && !data.campaignid)	{
								r = "In admin_template.u.missingParamsByMode, mode set to Campaign but no campaignid passed."
								}
							else	{
								//Success.
								}
							}
						else	{
							r = "In admin_template.u.missingParamsByMode, Invalid mode ["+mode+"] passed."
							}
						}
					else	{
						r = "In admin_template.u.missingParamsByMode, no mode passed or data was empty."
						}
					return r;
					},

//adds some global functions for easy reference from the supporting html file for the wizard
				declareMagicFunctions : function()	{

// NOTE -> the way the magic functions were originally written there was only one instance open at a time, so 'instance' was not pertinent, there was only 1.
// now, however, there are (potentially) more than one open at a time, so we get the instance within the tab in focus. If a dialog or 'full screen' version of this are ever available, we'll need to rethink magic.
// getContext was created so that, down the road, when a better method is available, it'll be easy to search and replace or to update.	
//also, media library (search for kissTemplate) uses a selector similar to this.
	function getContext()	{
		return $("[data-templateeditor-role='container']",_app.u.jqSelector('#',_app.ext.admin.vars.tab+'Content'));
		}
	
	function getTarget(selector,functionName){
//		_app.u.dump("getTarget selector: "+selector);
		var r = false
		if(selector)	{
			var $templateEditor = getContext();
//jqSelector doesn't play well using : or [ as first param.
			var $target = $('iframe',$templateEditor).contents().find((selector.indexOf('#') == 0 || selector.indexOf('.') == 0) ? _app.u.jqSelector(selector.charAt(0),selector.substring(1)) : _app.u.jqSelector("",selector));
			if($target.length)	{
				r = $target;
				}
			else	{
				$("[data-app-role='wizardMessaging']",$templateEditor).anymessage({'message':'The element selector ['+selector+'] passed into '+functionName+' does not exist within the template. This is likely the result of an error in the wizard.js file.'});
				}
			}
		else	{
			$("[data-app-role='wizardMessaging']",$templateEditor).anymessage({'message':'No element selector passed into '+functionName+'. This is likely the result of an error in the wizard.js file.'});
			}
		return r;	
		}

	if(typeof window.magic === 'object')	{}
	else	{
		window.magic = {};
		
//selector is, most likely, a hidden form element within the wizard.
//This function will populate the hidden input with a csv of product once the 'apply' button in the picker is pushed.
		window.magic.conjureProduct = function(ID){

var $D = _app.ext.admin.i.dialogCreate({
	'title' : 'Select Product'
	});
var $input = $(_app.u.jqSelector('#',ID));
//_app.u.dump(" -> _app.u.jqSelector('#',ID): "+_app.u.jqSelector('#',ID));
//_app.u.dump(" -> $input.length: "+$input.length);

	$("<form>").append($("<fieldset data-app-role='pickerContainer'>").append(_app.ext.admin.a.getPicker({'templateID':'pickerTemplate','mode':'product'}))).appendTo($D);
	$D.dialog({ buttons: [ { text: "Apply Product", click: function() {
		$D.showLoading({'message':'Fetching product list'});

		_app.model.addDispatchToQ({
			'_cmd':'appProductSelect',
			'product_selectors' : _app.ext.admin_tools.u.pickerSelection2KVP($('form:first',$D)),
			'_tag':	{
				'datapointer' : 'appProductSelect',
				'callback' : function(rd)	{
					$D.hideLoading();
					if(_app.model.responseHasErrors(rd)){
						$D.anymessage({'message':rd});
						}
					else	{
						if(_app.data[rd.datapointer] && _app.data[rd.datapointer]['@products'] && _app.data[rd.datapointer]['@products'].length)	{
							$input.val(_app.data[rd.datapointer]['@products'].join());
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
		_app.model.dispatchThis('mutable');
		}}]});

	$D.dialog('open');

			}
		
		window.magic.prodlist = function(selector,prodlist,vars)	{
			var $target = getTarget(selector,'magic.prodlist');
			
			vars = vars || {};
			
			if(vars.templateID)	{
//				$target.append("<br><h2>JT WAS HERE</h2><br>");
				var $prodlistTemplate = $(_app.u.jqSelector('#',vars.templateID));
				if($prodlistTemplate.length)	{
					//success content goes here.
					$target = getTarget(selector,'magic.prodlist'); //have to redeclare target. 'focus' of target in iframe was getting lost. for expediency's sake, this was quickest solution.
//						_app.u.dump("$target.length: "+$target.length);
//						$target.append("<br><h2>And Here Too!</h2><br>");
					if(prodlist)	{
						var $prodlistContainer = $prodlistTemplate.clone();
//							_app.u.dump(" -> $prodlistContainer.length: "+$prodlistContainer.length);
						$prodlistContainer.attr('id','WIZ_PL_'+_app.u.guidGenerator().substring(0,10)); //change the ID so it's unique.
						$prodlistContainer.appendTo($target);
						
						$prodlistContainer.anycontent({'data':{'@products':prodlist}});
						}
					else	{
						$D.anymessage({'message':'Your selectors returned zero product.'});
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'vars.templateID was passed into magic.prodlist but element does not exist on the DOM.'});
					}

				}
			else	{
				$('#globalMessaging').anymessage({'message':'vars.templateID was not passed into magic.prodlist.'});
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
			var $templateEditor = getContext();
			r = null;
			if($target)	{
				_app.ext.admin_template.u.showObjectInInspector($target,$("[data-app-role='templateObjectInspectorContent']",$templateEditor));
				r = $target;
				}
			else	{} //getTarget handles error display.
			return r;
			}
		
		window.magic.medialib = function(ID)	{
			var $target = getTarget(ID,'magic.medialib');
			if($target)	{
				_app.ext.admin_medialib.a.showMediaLib({
					'imageID':_app.u.jqSelector('#',ID.substring(1)),
					'mode':'kissTemplate'//,
		//			'src':$target.data('filepath') //doesn't work like we want. uses some legacy UI code.
					}); //filepath is the path of currently selected image. oldfilepath may also be set.
				}
			else	{} //getTarget handles error display.
			}

//gets run when a fieldset in the wizard is loaded.  Will check the value on all fieldset inputs for data-target (which should be a selector) and will check to make sure it exists in the template itself.
//if one failure occurs, the entire panel is locked. The user can still proceed forward and backward through the rest of the editor.
		window.magic.fieldset_verify = function($fieldset)	{
			_app.u.dump("BEGIN fieldset_verify");
			var numMatchedSelectors = 0;  //what is returned if pass is false. will increment w/ the length of each data-target.length
			var pass = true;
			if($fieldset instanceof jQuery)	{
//				_app.u.dump(" -> $('[data-target]',$fieldset).length: "+$("[data-target]",$fieldset).length);
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
					_app.u.dump(" -> a fail occurd in magic.verify");
					$('select, textarea, input',$fieldset).attr('disabled','disabled'); //unable to find all selectors, so disable entire panel.
					$('button',$fieldset).prop('disabled','disabled'); //expand later to check for ui-button and handle them differently.
					} //do nothing,
				}
			else	{
				pass = false;
				$("#globalMessaging").anymessage({'message':'Invalid fieldset ['+($fieldset instanceof jQuery)+'] not passed into magic.exists.'});
				}
			_app.u.dump(" -> verify pass: "+pass);
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
							$("#globalMessaging").anymessage({'message':'Method ['+method+'] passed into magic.modify passed validation but is not declared in switch.','gMessage':true});
						}
		
		
					}
				else	{} //getTarget handles error display.
				}
			else	{
				$("#globalMessaging").anymessage({'message':'Invalid or blank method ['+method+'] passed into magic.modify. This is likely the result of an error in the wizard.js file.'});
				}
			}
		}

					}, //declareMagicFunctions
	
//updates the progress bar based on the number of fieldsets and the index of the fieldset in view (yes, going backwards means progress bar regresses)
				handleWizardProgressBar : function($pbar)	{
					if($pbar instanceof jQuery)	{
						var $wizardForm = $pbar.closest("[data-templateeditor-role='wizardContainer']").find("form[data-templateeditor-role='wizardForm']");
						var $fieldsets = $("fieldset",$wizardForm);
						if($fieldsets.length)	{
							// * 201334 -> better handling if animation is in progress.
							//if the animation is in progress already, don't mess w/ it. let it wrap up, but adjust the progress.
							var progress = Math.round((($("fieldset:visible",$wizardForm).index() / $fieldsets.length ) * 100));
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
						$('#globalMessaging').anymessage({'message':"In admin_template.u.handleWizardProgressBar, pbar ["+$pbar instanceof jQuery+"] is not a valid jquery object.",'gMessage':true});
						}
					},

//delegates a click event on the template container which updates the object inspector w/ information about the clicked element.
				handleWizardObjects : function($iframeBody,$objectInspector)	{
//					_app.u.dump("$iframeBody.length: "+$iframeBody.length+" and $objectInspector.length: "+$objectInspector.length);
					if($iframeBody instanceof jQuery && $objectInspector instanceof jQuery)	{
						$iframeBody.on('click.objectInspector',function(e){
							var $target = $(e.target);
	//						_app.u.dump(" -> $target.id: "+$target.attr('id'));
							_app.ext.admin_template.u.showObjectInInspector($target,$objectInspector); //updates object inspector when any element is clicked.
							});
						}
					else	{
						$('#globalMessaging').anymessage({'message':"In admin_template.u.handleWizardProgressBar, either iframeBody ["+$iframeBody instanceof jQuery+"] or objectInspector ["+$objectInspector instanceof jQuery+"] were not valid jquery objects.",'gMessage':true});
						}
					},


//removes the editor classes from the template. executed on save.
				postprocessTemplate : function(template,mode)	{
					var $template = $("<html>"); //need a parent container.
					$template.append(template);
					var $head = $("head",$template);
					//move all meta and style tags from the body to the head where they belong.
					$("body meta, body style",$template).each(function(){
						$(this).appendTo($head);
						})
					return $template.html();
					}, //postprocessTemplate

//This will add a style tag (classes) used by the editor. They're added to the template (stripped on save).
// it will also add some classes on data-object elements. These stay (they do no harm)
				preprocessTemplate : function(mode,vars,template)	{
					_app.u.dump("BEGIN admin_template.u.preprocessTemplate");
//					_app.u.dump(" -> mode: "+mode); _app.u.dump(" -> vars: "); _app.u.dump(vars);
					var $template = $("<html>"); //need a parent container.
					$template.append(template);
					
					if(mode == 'Site')	{
//						_app.u.dump(" -> Is a Site template");
						$('base',$template).attr('href','http://www.'+vars.domain); //### TODO -> this is temporary. Need a good solution for protocol and domain prefix/host.
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

					return $template;
					}, //preprocessTemplate


//$template is a jquery instance of the original template, BEFORE it's been added a text area.
				buildSupplementalSiteEditors : function($templateEditor,$template)	{
					if($templateEditor instanceof jQuery && $template instanceof jQuery)	{
						var
							$supp = $("[data-app-role='templateEditorSupplementalContent']:first",$templateEditor),
							taID = 'textarea_'+_app.ext.admin_template.u.buildTemplateEditorID($templateEditor.data());
						if(taID)	{
							$("[data-wizard]",$template).each(function(){
								var $wizele = $(this);
								$supp.append($("<h3 \/>").text($wizele.attr('data-wizard-title') || $wizele.data('wizard')).data('wizard',$wizele.data('wizard')));
	//create an MD5 for the contents of the element which can be used to compare later to see if any changes occured.
								var $textarea = $("<textarea \/>",{'id':taID+"_"+$wizele.data('wizard')}).attr({
									'data-md5':Crypto.MD5($wizele.html()),
									'data-elementid':$wizele.attr('id')
									}).addClass('isTinymceTextarea').val($wizele.html()); //isTinymceTextarea is used as selector in 'exit'.
								$supp.append($("<div \/>").append($textarea));
								});
							
							if($supp.children().length)	{
								// #### TODO -> this needs to trigger the wizard.
								//note -> could use tinymce.FocusEvent if need be. http://www.tinymce.com/wiki.php/api4:class.tinymce.FocusEvent
								$supp.accordion({
									heightStyle: "content",
									beforeActivate : function(event,ui)	{
										_app.u.dump("accordian beforeActivate. wizard: "+ui.newHeader.data('wizard'));
										$("button[data-app-role='startWizardButton']:first",$(_app.u.jqSelector('#',_app.ext.admin.vars.tab+'Content'))).data('wizardContent','wizard-'+ui.newHeader.data('wizard')+'.html').button('enable');
										}
									});
// ### TODO -> need to trigger the beforeActivate code on the first header to enable the wizard button.
								$("textarea",$supp).tinymce({
									init_instance_callback : function(editor)	{
										var $iframe = $("iframe:first",$(editor.getContentAreaContainer()));
										var $iframeBody = $iframe.contents().find('body');
										_app.ext.admin_template.u.handleWizardObjects($iframeBody,$("[data-app-role='templateObjectInspectorContent']",$templateEditor));										
										},
//									setup : function(editor) {editor.on('focus', function(e) {});editor.on('change', function(e) {});},
									valid_elements: "*[*]",
//									extended_valid_elements : "@[class]",
									menubar : 'edit insert view format table tools',
									height : 200,
									visual: false, //turn off visual aids by default. menu choice will still show up.
									keep_styles : false, //for sites, no inline styles are allowed.
									image_list: [],
									plugins: [
										"_image _wizblocks advlist autolink lists link charmap print preview anchor",
										"searchreplace visualblocks code fullscreen",
										"media table contextmenu paste"
										],
									toolbar: "undo redo | styleselect | bold italic | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link _image | code"
									});

								}
							else	{
								$supp.anymessage({"message":"","errtype":"halt","persistent":true});
								}

							}
						else	{
							//taID didn't generate. builderTemplateEditorID will throw the error.
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_template.u.handleSiteTemplateEditor, either $templateEditor ['+($templateEditor instanceof jQuery)+'] or $template ['+($template instanceof jQuery)+'] were not valid instances of jQuery.','gMessage':true});
						}
					},

				summonWizard : function($context,filename)	{
					if($context instanceof jQuery && filename)	{
						var $wizardForm = $("[data-templateeditor-role='wizardForm']",$context);
						$wizardForm.showLoading({"message":"Summoning Wizard..."});

						var editorData = $context.data();
						if(!_app.ext.admin_template.u.missingParamsByMode(editorData.mode,editorData))	{
							var cmdObj = {
								'FILENAME':filename,
								'_tag':	{
									'datapointer' : 'admin'+editorData.mode+'FileContents|'+filename,
									'callback':function(rd){
										if(_app.model.responseHasErrors(rd)){
											$("[data-app-role='wizardMessaging']",$context).anymessage({'message':rd});
											}
										else	{
											$wizardForm.html(_app.data[rd.datapointer].body)
											_app.ext.admin_template.a.initWizard($wizardForm);
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
		
							_app.model.addDispatchToQ(cmdObj,'mutable');
							_app.model.dispatchThis('mutable');
							}
						else	{
							$context.anymessage({'message':'In admin_template.u.summonWizard, '+_app.ext.admin_template.u.missingParamsByMode(editorData.mode,editorData),'gMessage':true});
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_template.a.summonWizard, either $context is not a jquery instance ['+($context instanceof jQuery)+'] or filename ['+filename+'] was not passed.','gMessage':true});
						}
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
//							_app.u.dump(" -> $parentDataObject.length: "+$parentDataObject.length);
							if($parentDataObject.length)	{
								$objectInspector.append("<h2>Parent Dynamic Element</h2>");
								$objectInspector.append(getObjectData($parentDataObject));
								}
							}
	
						}
					else	{
						$('#globalMessaging').anymessage({'message':"In admin_template.u.handleWizardProgressBar, either object ["+$object instanceof jQuery+"] or objectInspector ["+$objectInspector instanceof jQuery+"] were not valid jquery objects.",'gMessage':true});
						}
					},

//does not and SHOULD not dispatch.  Allows this to be used w/ test in campaigns.
				handleTemplateSave : function($templateEditor)	{

					if($templateEditor instanceof jQuery)	{
						var mode = $templateEditor.data('mode');
						if(!_app.ext.admin_template.u.missingParamsByMode(mode,$templateEditor.data()))	{
	
							$templateEditor.showLoading({'message':'Saving changes'});
							var docBody;
							if(mode == 'Site')	{
								var dp = 'adminSiteFileContents|'+$templateEditor.data('domain')
								if(_app.data[dp] && _app.data[dp].body)	{
									var $oTemplate = $("<html>").html(_app.data[dp].body); //the original instance of the template.
					
									$("[data-app-role='templateEditorSupplementalContent']:first",$templateEditor).find('textarea').each(function(){
										var $te = $(this);
										if($te.data('md5') && $te.data('elementid'))	{
											var $thisTemplate = magic.inspect(_app.u.jqSelector('#',$te.data('elementid')));
//											_app.u.dump(" -> $thisTemplate.length: "+$thisTemplate.length);
//											_app.u.dump(" -> old md5 : "+$option.data('md5'));
//											_app.u.dump(" -> new md5 : "+Crypto.MD5($thisTemplate.html()));
											$thisTemplate.css('display','');  //the editor uses show/hide which adds inline styles. These need to be removed.
											if(!$thisTemplate.attr('style'))	{
												$thisTemplate.removeAttr('style'); //if no styles are set, remove the empty tag. that way the md5 'should' match if no change occured.
												}

											if(Crypto.MD5($thisTemplate.html()) != $te.data('md5'))	{
												_app.u.dump(" -> save occuring for element "+$option.data('elementid'));
												$(_app.u.jqSelector('#',$option.data('elementid')),$oTemplate).replaceWith($thisTemplate);
												}
											}
										else	{} //no md5 set. probably the default 'choose';
										
										});

									docBody = "<html>\n<!DOCTYPE html>\n"+$.trim($oTemplate.html())+"/n</html>"; //putting the template body into a jquery object strips the html and doctype tags.
									}
								else	{
									$templateEditor.anymessage({'message':'In admin_template.u.handleTemplateSave, unable to obtain original template body in _app.data'+dp,'gMessage':true});
									}
								}
							else	{
								var $textarea = $("textarea[data-app-role='templateEditorTextarea']:first",$templateEditor)
								docBody = _app.ext.admin_template.u.postprocessTemplate($textarea.tinymce().getContent());
//								var taID = "textarea_"+_app.ext.admin_template.u.buildTemplateEditorID($templateEditor.data('mode'));
//								$textarea = $(_app.u.jqSelector('#',taID))
//								docBody = _app.ext.admin_template.u.postprocessTemplate($('iframe:first',$templateEditor).contents().find('html').html(),mode);
								}
							var dObj = {
								'_cmd' : 'admin'+mode+'FileSave',
								'FILENAME' : 'index.html',
								'_tag' : {
									'callback' : function(responseData)	{
										$templateEditor.hideLoading();
										if(_app.model.responseHasErrors(responseData)){
											$templateEditor.anymessage({'message':responseData})
											}
										else	{
											$templateEditor.anymessage(_app.u.successMsgObject('Your changes have been saved.'));
											}
										}
									},
								'body' : docBody
								}
	
							if(mode == 'EBAYProfile')	{
								dObj.PROFILE = $templateEditor.data('profile');
								}
							else if(mode == 'Campaign')	{
								dObj.CAMPAIGNID = $templateEditor.data('campaignid');
								}
							else if(mode == 'Site')	{
								dObj.DOMAIN = $templateEditor.data('domain');
								}
							else	{} //shouldn't get here. mode is verified earlier to be a supported mode.
//							_app.u.dump(" -> cmd: "); _app.u.dump(dObj);
							_app.model.addDispatchToQ(dObj,'immutable');
								
							}
						else	{
							$templateEditor.anymessage({'message':_app.ext.admin_template.u.missingParamsByMode(mode,$templateEditor.data())});
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_template.u.handleTemplateSave, object passed in not a valid jquery object.','gMessage':true});
						}
					},

//Copies a template into a profile or campaign (or whatever as more get added).
//vars needs to include SUBDIR and PROJECTID.  Vars is most likely passed from an li.data(), but doesn't have to be.
				handleTemplateSelect : function(vars)	{
					vars = vars || {};
					var $TC = $('#templateChooser');
					var mode = $TC.data('mode'); //should never get changed through this code.
					
					if(!_app.ext.admin_template.u.missingParamsByMode(mode,vars))	{
						if(vars.SUBDIR)	{
							vars.mode = mode; //used when passed into navigateTo
							//all is well at this point. proceed.
							$TC.showLoading({'message':'One moment please. Copying files into directory.'});
							var dObj = {
								_tag : {
									'callback' : function(rd)	{
										$TC.hideLoading();
										if(_app.model.responseHasErrors(rd)){
											$TC.anymessage({'message':rd})
											}
										else	{
											$TC.dialog('close');
											$('#globalMessaging').anymessage(_app.u.successMsgObject("Thank you, the template "+vars.SUBDIR+" has been copied."));
											navigateTo('/ext/admin_template/showTemplateEditor',_app.u.getWhitelistedObject(vars,['domain','campaignid','profile','mode']));
											}
										}
									}	
								}
							
							dObj.SUBDIR = vars.SUBDIR;
							dObj.PROJECTID = vars.PROJECTID;
							
							
							if(mode == 'EBAYProfile')	{
								dObj._cmd = 'adminEBAYTemplateInstall';
								dObj.PROFILE = $TC.data('profile');
								_app.model.addDispatchToQ({
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

							_app.model.addDispatchToQ(dObj,'immutable'); //_app.model.dispatchThis('immutable');
							_app.model.dispatchThis('immutable');
							}
						else	{
							$TC.anymessage({"message":"In admin_template.u.handleTemplateSelect, SUBDIR not passed in.","gMessage":true});
							}
						
						}
					else	{
						$TC.anymessage({"message":"In admin_template.u.handleTemplateSelect, "+_app.ext.admin_template.u.missingParamsByMode(mode,vars),"gMessage":true});
						}

					}, //handleTemplateSelect

/*
### FUTURE -> 	these will need to be brought forward.
				for the product one, consider some form of integration w/ flexedit.

				getEditorButtonNativeApp : function(vars,$templateEditor){
					return {
						css : 'nativeappinputsshow',
						'text' : 'Native App Settings',
						action: function () {
						
							var $metaTags = _app.ext.admin_template.u.pluckObjectFromTemplate('meta',$templateEditor);
							var data = {};

//							_app.u.dump(" -> $metaTags.length: "+$metaTags.length); _app.u.dump($metaTags instanceof jQuery);
							
							$metaTags.each(function(){
								data[$(this).attr('name')] = $(this).attr('content');
								})

//							_app.u.dump("meta data: "); _app.u.dump(data);

							var $D = _app.ext.admin.i.dialogCreate({
								'title' : 'Native App Settings (iOS and Android)',
								'templateID' : 'nativeAppCampaignSettingsTemplate',
								'data' : data
								});
							$D.dialog('option','width','500');
							$D.dialog({ buttons: [
								{ text: "Close", click: function() { $( this ).dialog( "close" ); } },
								{ text: "Apply", click: function() {
									var sfo = $('form',$D).serializeJSON();
									var $templateHead = _app.ext.admin_template.u.pluckObjectFromTemplate('head',$templateEditor);
//									_app.u.dump(" -> sfo: "); _app.u.dump(sfo);

									$D.showLoading({"message":"Applying Changes"});
									for(index in sfo)	{
										var $meta = _app.ext.admin_template.u.pluckObjectFromTemplate("meta[name='"+index+"']",$templateEditor);
										//update meta if it already exists.
										if($meta.length)	{ //data is a list of meta tags that existed at the outset of this operation. if it's here, it exists as a meta in the template already.
//											_app.u.dump(" --> MATCH!");
											$meta.attr('content',sfo[index]);
											}
										//add meta if it doesn't already exist.
										else	{
//											_app.u.dump(" --> NO match!");
											$templateHead.prepend("<meta name='"+index+"' content='"+sfo[index]+"' />");
											}
										}
									$D.hideLoading();
									$( this ).dialog( "close" );
//									$D.anymessage(_app.u.successMsgObject('Changes applied.'));
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
							var $D = _app.ext.admin.i.dialogCreate({
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

							_app.ext.admin_template.u.appendAttributeListTo($D,jhtml,attributes);
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
							var $D = _app.ext.admin.i.dialogCreate({
								'title' : 'Add Buyer Attribute'
								});
							$D.dialog('open');
							
							var attributes = [
								{attribute: 'buyer:firstname', data : {'input-cols':'100','input-type':'TEXTBOX','label':'First name','object':'BUYER'},'id':'BUYER_FIRSTNAME'},
								{attribute: 'buyer:email', data : {'input-cols':'50','input-type':'TEXTBOX','label':'Email address','object':'BUYER'},'id':'PROD_EMAIL' }
								]

							_app.ext.admin_template.u.appendAttributeListTo($D,jhtml,attributes);
							}
						}
					}, //getEditorButton_prodattributeadd

				//only used in the now dead getEditorButton functions.
				pluckObjectFromTemplate : function(selector,$templateEditor)	{
					return $('.jHtmlArea iframe:first',$templateEditor).contents().find(selector);
					},
				


*/

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
	//								_app.u.dump(" -> attributes[i]"); _app.u.dump(attributes[$target.data('attributeIndex')]);
							if(_app.ext.admin_template.u.applyElementToTemplate(jhtml,attributes[$target.data('attributeIndex')]))	{
								$D.dialog('close');
								}
							else	{
								$D.anymessage({"message":"Uh Oh! Something went wrong. Please try that again or try again later. dev: see console for details."});
								}
							});
						}
					else if(!jhtml)	{
						r = false;
						_app.u.dump("In admin_template.u.applyElementToTemplate, jhtml was not defined and it is required.");
						}
					else	{
						r = false;
						_app.u.dump("In admin_template.u.applyElementToTemplate, attObj was empty/missing vars. attObj requires data, attribute and data.object. attObj: "); _app.u.dump(attObj);
						}
					return (r === true) ? $ul : false;
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
							_app.u.dump("In admin_template.u.applyElementToTemplate, either  data-type ["+attObj.data['input-type']+"] is invalid or data-format ["+attObj.data.format+"] is invalid. attObj:"); _app.u.dump(attObj);
							r = false;
							}
						
						if(r)	{jhtml.pasteHTML(html)}
						
						}
					else if(!jhtml)	{
						_app.u.dump("In admin_template.u.applyElementToTemplate, jhtml was not defined and it is required.");
						}
					else	{
						_app.u.dump("In admin_template.u.applyElementToTemplate, attObj was empty/missing vars. attObj requires data, attribute and data.object. attObj: "); _app.u.dump(attObj);
						r = false;
						}
					return r;
					},
				//vars should contain mode and any mode-specific vars (campaignid if mode is Campaign)
				//will concatonate mode and mode specific vars.
				buildTemplateEditorID : function(vars)	{
					var r = "";
					if(!_app.ext.admin_template.u.missingParamsByMode(vars.mode,vars))	{
						r += vars.mode+"_";
						switch(vars.mode)	{
							case 'Campaign':
								r += vars.campaignid;
								break;
							case 'EBAYProfile':
								r += vars.profile;
								break;
							case 'Site':
								r += vars.domain;
								break;
							default:
								$('#globalMessaging').anymessage({"message":"In admin_templates.u.buildTemplateEditorID, vars passed 'missingParamsByMode' but failed to find a valid case in the switch statement.","gMessage":true});
								//shouldn't get here. missingParamsByMode should validate mode.
								r = false;
								break;
							}
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In admin_templates.u.buildTemplateEditorID, "+_app.ext.admin_template.u.missingParamsByMode(vars.mode,vars),"gMessage":true});
						}
						
					return r;
					},

				buildTemplateEditorMediaFolderName : function(vars)	{
					var r = "";
					if(!_app.ext.admin_template.u.missingParamsByMode(vars.mode,vars))	{
						r += "_"+(vars.mode == 'EBAYProfile' ? 'ebay' : vars.mode.toLowerCase())+"/";
						switch(vars.mode)	{
							case 'Campaign':
								r += vars.campaignid;
								break;
							case 'EBAYProfile':
								r += vars.profile;
								break;
							case 'Site':
								r += vars.domain;
								break;
							default:
								$('#globalMessaging').anymessage({"message":"In admin_templates.u.buildTemplateEditorID, vars passed 'missingParamsByMode' but failed to find a valid case in the switch statement.","gMessage":true});
								//shouldn't get here. missingParamsByMode should validate mode.
								r = false;
								break;
							}
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In admin_templates.u.buildTemplateEditorID, "+_app.ext.admin_template.u.missingParamsByMode(vars.mode,vars),"gMessage":true});
						}
						
					return r;
					},
				//vars should contain mode and any mode-specific vars (campaignid if mode is Campaign)
				//will concatonate mode and mode specific vars.
				buildTemplateEditorTitle : function(vars)	{
					var r = '';
					if(!_app.ext.admin_template.u.missingParamsByMode(vars.mode,vars))	{
						r += "Template Editor for ";
						switch(vars.mode)	{
							case 'Campaign':
								r += 'Campaign '+vars.campaignid;
								break;
							case 'EBAYProfile':
								r += 'eBay Profile ' + vars.profile;
								break;
							case 'Site':
								r += 'Site/Domain '+vars.domain;
								break;
							default:
								$('#globalMessaging').anymessage({"message":"In admin_templates.u.buildTemplateEditorTitle, vars passed 'missingParamsByMode' but failed to find a valid case in the switch statement.","gMessage":true});
								//shouldn't get here. missingParamsByMode should validate mode.
								r = false;
								break;
							}
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In admin_templates.u.buildTemplateEditorTitle, "+_app.ext.admin_template.u.missingParamsByMode(vars.mode,vars),"gMessage":true});
						}
						
					return r;
					}

			}, //u [utilities]



////////////////////////////////////   EVENTS [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



			e : {

				adminSaveAsTemplateExec : function($ele)	{
					var
						$D = $ele.closest("[data-templateeditor-role='container']"),
						templateName = $("[input[name='template']",$D).val(),
						mode = $D.data('mode');
					
					if(!_app.ext.admin_template.u.missingParamsByMode(mode,$D.data()))	{

						$D.showLoading({'message':'Saving as new template: '+templateName});
						var dObj = {
							'SUBDIR' : templateName,
//								'PROJECTID' : $D.data('PROJECTID'), //not passed cuz the user doesnt 'choose' the projectid. it'll be set to TEMPLATES
							'_tag' : {
								'callback' : function(responseData)	{
									$D.hideLoading();
									if(_app.model.responseHasErrors(responseData)){
										$D.anymessage({'message':responseData})
										}
									else	{
										$D.anymessage(_app.u.successMsgObject('The contents have been saved as a template.'));
										}
									}
								}
							}

						dObj._cmd = (mode == 'EBAYProfile') ? 'adminEBAYTemplateCreateFrom' : 'admin'+mode+'TemplateCreateFrom';

						if(mode == 'EBAYProfile')	{dObj.PROFILE = $D.data('profile');}
						else if(mode == 'Campaign')	{dObj.CAMPAIGNID = $D.data('campaignid');}
						else	{} //shouldn't ever get here.

						_app.model.addDispatchToQ(dObj,'immutable');
						_app.model.dispatchThis('immutable');

						}
					else	{
						$D.anymessage({'message':_app.ext.admin_template.u.missingParamsByMode(mode,$D.data())});
						}
					},
					
//executed when a template is selected.
				templateChooserExec : function($ele,P)	{
					P.preventDefault();
					_app.ext.admin_template.u.handleTemplateSelect($.extend(true,{},$('#templateChooser').data(),$ele.closest("[data-app-role='templateDetail']").data()));
					},

//$ele is probably an li.  This is exectued when a template preview is clicked. It'll open a detail template.
//a 'choose' button will be present within the detail pane.
				templateChooserPreview : function($ele,P)	{
					P.preventDefault();
//					_app.u.dump("BEGIN admin_template.e.templateChooserPreview");
					var $chooser = $("#templateChooser");
					var $panelContainer = $("[data-app-role='appPreviewPanel']",$chooser);
					var mode = $chooser.data('mode');
					
					if(mode)	{
//						_app.u.dump(" --> mode is set ("+mode+")");
						var listDP = (mode == 'EBAYProfile') ? 'adminEBAYTemplateList' : 'admin'+mode+'TemplateList'; //ebay is ebayprofile most of the time, but sometimes just ebay. handy.
						if(_app.data[listDP] && _app.data[listDP]['@TEMPLATES'] && _app.data[listDP]['@TEMPLATES'][$ele.data('obj_index')])	{
							var templateData = _app.data[listDP]['@TEMPLATES'][$ele.data('obj_index')];
							var $panel = $("[data-subdir='"+templateData.SUBDIR+"']",$panelContainer);
							if($panel.length)	{} //panel is already on the dom (li already clicked once). do nothing just yet.
							else	{
//								_app.u.dump(" --> panel is NOT generated (first time click). build new panel");
								$panel = $("<div \/>").hide().attr('data-app-role','templateDetail').anycontent({'templateID':'templateChooserDetailTemplate','data':templateData});
								$panel.attr('data-subdir',templateData.SUBDIR);
								$panel.data(_app.u.getBlacklistedObject(templateData,['@PREVIEWS','%info','MID']));
								$panel.appendTo($panelContainer);
								_app.u.handleButtons($panel);
								}

							//set all preview li's to default state then the new active one to active.
							$ele.parent().find('li').each(function(){$(this).removeClass('ui-state-active').addClass('ui-state-default')});
							$ele.addClass('ui-state-active').removeClass('ui-state-default');
							if($panel.is(':visible'))	{} //panel already in focus. do nothing.
							else if($panelContainer.children().length > 1)	{
								_app.u.dump(" --> more than 1 child. transition between them");
//hide the current preview and show the new one.					
								$("[data-app-role='templateDetail']:visible",$panelContainer).first().hide('scale',function(){
									$panel.show('scale');
									});
								}
							else	{
								_app.u.dump(" --> only 1 panel. just expand.");
								$panel.show('scale',function(){
									_app.u.dump(' --> now recenter the dialog');
									//after the first preview is displayed, resize and recenter the modal.
									$chooser.dialog("option", "position", "center");
									$chooser.dialog('option','height',($('body').height() - 100));
									});
								}
							}
						else	{
							$chooser.anymessage({'message':'In admin_template.e.templateChooserPreview, could not obtain data (_app.data.admin'+mode+'TemplateList or @TEMPLATES within that or ['+$ele.data('obj_index')+'] within that was unavailable.','gMessage':true})
							}
						}
					else	{
						$chooser.anymessage({'message':'In admin_template.e.templateChooserPreview, unable to ascertain mode from templateChooser.','gMessage':true})
						}
					},
			
// used to download a zip file of a 'container' (which is a template saved into a profile or campaign).
				containerZipDownloadExec : function($ele,P)	{
					P.preventDefault();
					var mode = $ele.data('mode'), data = $ele.closest('.buttonset').data();
					if(!_app.ext.admin_template.u.missingParamsByMode(mode,data))	{
						$(_app.u.jqSelector('#',_app.ext.admin.vars.tab+'Content')).showLoading({'message':'Building a zip file. One moment please...'});
						var dObj = {
							'_cmd' : 'admin'+mode+'ZipDownload',
							'base64' : true,
							'_tag' : {
								'callback':'fileDownloadInModal',
								'datapointer':'templateZipDownload',
								'jqObj' : $(_app.u.jqSelector('#',_app.ext.admin.vars.tab+'Content'))
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
						
						_app.model.addDispatchToQ(dObj,'immutable');
						_app.model.dispatchThis('immutable');							
						
						}
					else	{
						$('#globalMessaging').anymessage({'message':"In admin_template.e.containerZipDownloadExec, "+_app.ext.admin_template.u.missingParamsByMode(mode,data)+". The required params should be on the .buttonset around the download button"});
						}
					}, //containerZipDownloadExec

				adminTemplateEditorExit : function($ele,P)	{
					var $templateEditor = $ele.closest("[data-app-role='templateEditor']"), data = $templateEditor.data();
					if(data.mode == 'Campaign')	{
						$("textarea[data-app-role='templateEditorTextarea']:first",$templateEditor).tinymce().remove();
						navigateTo('/ext/admin_customer/showCampaignManager',{'campaignid':data.campaignid});
						}
					else if(data.mode == 'EBAYProfile')	{
						$("textarea[data-app-role='templateEditorTextarea']:first",$templateEditor).tinymce().remove();
						navigateTo('/syndication',{'mkt':'EBF','profile':data.profile});
						}
					else if(data.mode == 'Site')	{
						$(".isTinymceTextarea",$templateEditor).tinymce().remove();
						navigateTo('/ext/admin_sites/showDomainConfig',{'domain':data.domain});
						}
					else	{
						$("#globalMessaging").anymessage({"message":"In admin_template.e.adminTemplateEditorExit, unrecognize or missing mode ["+data.mode+"] set on template editor.","gMessage":true});
						}
					}, //adminTemplateCampaignExit

				adminTemplateCampaignTestShow : function($ele,P)	{
					var $D = _app.ext.admin.i.dialogCreate({"title":"Send a Test Email for this Campaign"});
					var $input = $("<input \/>",{'name':'email','type':'email','placeholder':'email address'}).appendTo($D);
					
					$D.dialog('option','width','350');
					$D.dialog({ buttons: [ { text: "Send Test", click: function() { 
						if(_app.u.isValidEmail($input.val()))	{
							$D.showLoading({'message':'Sending Test Email'});
							var $templateEditor = $ele.closest("[data-templateeditor-role='container']");
							_app.ext.admin_template.u.handleTemplateSave($templateEditor);
							_app.model.addDispatchToQ({
								'_cmd':'adminCampaignTest',
								'CAMPAIGNID' : $templateEditor.data('campaignid'),
								'RECIPIENTS' : "emails="+$input.val()+"\n",
								'_tag':	{
									'callback':function(rd)	{
										$D.hideLoading();
										if(_app.model.responseHasErrors(rd)){
											$D.anymessage({'message':rd});
											}
										else	{
											$D.anymessage(_app.u.successMsgObject('Test email has been sent'));
											$D.dialog({ buttons: [ { text: "Close", click: function() {$D.dialog('close')}}]});
											}
										}
									}
								},'immutable');
							_app.model.dispatchThis('immutable');
							}
						else	{
							$D.anymessage({'message':'Please enter a valid email address.'});
							}
					 } } ] });
					$D.dialog('open');
					},

				adminEBAYProfilePreviewShow : function($ele,p)	{
					p.preventDefault();
						var $D = _app.ext.admin.i.dialogCreate({"title":"HTML Listing Preview"});
						$D.dialog('open');
//this is used in the product editor 
var pid = $ele.closest("[data-pid]").data('pid');
var profile = $ele.closest('form').find("[name='zoovy:profile']").val();

if(profile && pid)	{

	_app.model.addDispatchToQ({
		'_cmd':'adminEBAYProfilePreview',
		'pid' : pid,
		'PROFILE' : profile,
		'_tag':	{
			'datapointer' : 'adminEBAYProfilePreview',
			'callback':function(rd)	{
				$D.hideLoading();
				if(_app.model.responseHasErrors(rd)){
					$D.anymessage({'message':rd});
					}
				else	{
					$D.append(_app.data[rd.datapointer].html);
					$D.dialog('option', 'height', ($('body').height() - 100));
					$D.dialog('option', 'position', 'center');
					}
				}
			}
		},'immutable');
	_app.model.dispatchThis('immutable');
	}
else	{
	$('#globalMessaging').anymessage({"message":"In admin_template.e.adminEBAYProfilePreviewShow, either pid ["+pid+"] or profile ["+profile+"] not set. Both are required.","gMessage":true});
	}

					},

				templateEditorIframeResizeExec : function($ele)	{
					var $templateEditor = $ele.closest("[data-templateeditor-role='container']");
					var $iframe = $('.jHtmlArea iframe:first',$templateEditor);
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

				templateEditorIframeRotateExec : function($ele,P)	{
					var $templateEditor = $ele.closest("[data-templateeditor-role='container']");
					var $iframe = $('.jHtmlArea iframe:first',$templateEditor);
					var W = $iframe.width();
					$iframe.width($iframe.height()).height(W);
					$iframe.parent().find('.device ,iframe').toggleClass('portrait landscape');
					},

				templateChooserShow : function($ele,p)	{
					p.preventDefault();
					if($ele.data('mode') == 'Campaign')	{
						_app.ext.admin_template.a.showTemplateChooserInModal({"mode":"Campaign","campaignid":$ele.closest("[data-campaignid]").data('campaignid')});
						}
					else if ($ele.data('mode') == 'Site')	{
						var domainname = $ele.closest("[data-domainname]").data('domainname');
						var hostname = $ele.closest("[data-hostname]").attr('data-hostname');
						if(hostname && domainname)	{
							_app.ext.admin_template.a.showTemplateChooserInModal({"mode":"Site","domain":hostname.toLowerCase()+'.'+domainname});
							}
						else	{
							$('#globalMessaging').anymessage({'message':'In admin_template.e.templateChooserShow, unable to resolve domain name ['+domainname+'] and/or host name ['+hostname+'].','gMessage':true});
							}
						}
					else if ($ele.data('mode') == 'EBAYProfile')	{
						_app.ext.admin_template.a.showTemplateChooserInModal({"mode":"EBAYProfile","profile":$ele.closest("[data-profile]").data('profile')});
						}
					else	{
						//invalid mode set.
						$('#globalMessaging').anymessage({"message":"In admin_template.e.templateChooserShow, invalid mode ["+$ele.data('mode')+"] set on button.","gMessage":true});
						}
					}, //templateChooserShow

				templateEditorShow : function($ele,p)	{
					p.preventDefault();
					var pass = true;
					if($ele.data('mode') == 'Campaign')	{
						navigateTo('/ext/admin_template/showTemplateEditor',{'campaignid':$ele.closest("[data-campaignid]").data('campaignid'),'mode':'Campaign'});
						}
					else if ($ele.data('mode') == 'EBAYProfile')	{
						navigateTo('/ext/admin_template/showTemplateEditor',{'profile':$ele.closest("[data-profile]").data('profile'),'mode':'EBAYProfile'});
						}
					else if ($ele.data('mode') == 'Site')	{
						
						var domainname = $ele.closest("[data-domainname]").data('domainname');
						var hostname = $ele.closest("[data-hostname]").attr('data-hostname');
						
						if(hostname && domainname)	{
							navigateTo('/ext/admin_template/showTemplateEditor',{'domain':hostname.toLowerCase()+'.'+domainname,'mode':'Site'});
							}
						else	{
							$('#globalMessaging').anymessage({'message':'In admin_template.e.templateEditorShow, unable to resolve domain name ['+domainname+'] and/or host name ['+hostname+'].','gMessage':true});
							}
						}
					else	{
						//invalid mode set.
						$('#globalMessaging').anymessage({"message":"In admin_template.e.templateEditorShow, invalid mode ["+$ele.data('mode')+"] set on button.","gMessage":true});
						}
					}, //templateEditorShow
					
				containerFileUploadShow : function($ele,p)	{
					p.preventDefault();
					var mode = $ele.data('mode');
					var data = $ele.closest('.buttonset').data();
					
					var $D = _app.ext.admin.i.dialogCreate({
						'title' : 'Template File Upload',
						'templateID' : 'templateFileUploadTemplate',
						data : {} //blank data because translation needs to occur (template calls another template)
						});
					$D.dialog('option','height','400');
					$D.dialog('open');
					
					if(!_app.ext.admin_template.u.missingParamsByMode(mode,data))	{
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
						
						_app.ext.admin_medialib.u.convertFormToJQFU($('form',$D),'adminFileUpload');	
						}
					else	{
						$D.anymessage({'message':_app.ext.admin_template.u.missingParamsByMode(mode,data)});
						}
					}, //containerFileUploadShow

				startWizardExec : function($ele,P)	{
					P.preventDefault();
					var
						$templateEditor = $ele.closest("[data-templateeditor-role='container']"),
						editorData = $templateEditor.data(); 

					if($ele.data('wizardContent'))	{
						_app.u.dump(" -> $ele.data()"); _app.u.dump($ele.data());
						_app.ext.admin_template.u.summonWizard($ele.closest("[data-templateeditor-role='container']"),$ele.data('wizardContent'));
						}
					else	{
						$templateEditor.anymessage({"message":"In admin_template.e.startWizardExec, trigger element did not have data('wizardContent') set on it.","gMessage":true});
						}
					},

				adminTemplateSaveExec : function($ele,P)	{
					_app.u.dump("GOT HERE");
					var $templateEditor = $ele.closest("[data-templateeditor-role='container']");
					if(!_app.ext.admin_template.u.missingParamsByMode($templateEditor.data('mode'),$templateEditor.data()))	{
						_app.ext.admin_template.u.handleTemplateSave($templateEditor); 
						_app.model.dispatchThis('immutable');
						}
					else	{
						$templateEditor.anymessage({'message':_app.ext.admin_template.u.missingParamsByMode(mode,$templateEditor.data())});
						}
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