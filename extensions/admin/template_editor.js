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
	
		vars : {},

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
			showTemplateEditorInModal : function(mode,vars)	{
				
				vars = vars || {};
				if(mode == 'ebay' || mode == 'campaign')	{
					var $D = $('#templateEditor');
					if($D.length)	{
						//template editor has been opened before. nuke the template vars so nothing carries over.
						$D.removeData('profile');
						$D.removeData('campaignid');
						$D.removeData('mode');
						$D.empty();
						}
					else	{
						$D = $("<div \/>",{'id':'templateEditor','title':'Edit '+mode+' template'});
						$D.dialog({
							'modal':true,
							'autoOpen':false,
							'width':'94%',
							close: function(event, ui)	{
								$('body').css({'height':'auto','overflow':'auto'}) //bring browser scrollbars back.
								},
							open : function(event,ui)	{
								$('body').css({'height':'100%','overflow':'hidden'}) //get rid of browser scrollbars.
								}
							});
						$D.dialog("option", "position", "center");
						}					
					
					if(mode == 'ebay' && !vars.profile)	{
						$('#globalMessaging').anymessage({"message":"In admin_templateEditor.a.showTemplateEditorInModal, mode is ebay but vars.profile was not set and is required.","gMessage":true});
						} //error
					else if(mode == 'campaign' && !vars.campaignid)	{
						$('#globalMessaging').anymessage({"message":"In admin_templateEditor.a.showTemplateEditorInModal, mode is campaign but vars.campaignID was not set and is required.","gMessage":true});
						}
					else	{

						$D.data('mode',mode);
						$D.data(vars); //vars.profile is used in the media lib to get the profile. don't change it.
						$D.dialog('option','height',($(window).height() - 100));
						$D.anycontent({'templateID':'templateEditorTemplate','showLoading':false,'data':{}}); //pass in a blank data so that translation occurs 
						$D.showLoading({"message":"Fetching template HTML"});
//must scroll to top of body/html first or issues with modal placement and lack of browser scrollbars.						
						$('html, body').animate({scrollTop:0}, 'fast', function(){
							$D.dialog('open');
							});
						
					
						var callback = function(rd){
							$D.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$D.anymessage({'message':rd})
								}
							else	{
						
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
								if(mode == 'ebay')	{
									toolbarButtons.push("|");
									toolbarButtons.push(app.ext.admin_templateEditor.u.getEditorButton_prodattributeadd())
									$("[data-app-role='highlightContainer_product']",$D).show();
									}
								else if(mode == 'campaign')	{
									$("[data-app-role='highlightContainer_buyer']",$D).show();
									}
//								app.u.dump(" -> toolbarButtons: "); app.u.dump(toolbarButtons);
						
								$("textarea:first",$D)
									.height($D.height() - 100)
									
									.css('width','95%')
									.val(app.ext.admin_templateEditor.u.preprocessTemplate(app.data[rd.datapointer]['body']))
									.htmlarea({
										// Override/Specify the Toolbar buttons to show
										toolbar: toolbarButtons // 
										});
								
							
								// event needs to be delegated to the body so that toggling between html and design mode don't drop events and so that newly created events are eventful.
								var $iframeBody = $('iframe',$D).css({'min-height':'400px','min-width':'500px'}).width('100%').contents().find('body');
								app.ext.admin_templateEditor.u.handleWizardObjects($iframeBody,$objectInspector);
							
								app.u.handleAppEvents($D);
								$('.toolTip',$D).tooltip();
								}
							}
					
						if(mode == 'ebay')	{
							app.model.addDispatchToQ({
								'_cmd':'adminEBAYProfileFileContents',
								'PROFILE' : vars.profile,
								'FILENAME' : 'index.html',
								'_tag' : {
									'datapointer' : 'adminEBAYProfileFileContents|'+vars.profile,
									'callback' : callback
									}
								},'immutable');
							}
						else if(mode == 'campaign')	{

							app.model.addDispatchToQ({
								'_cmd':'adminCampaignFileContents',
								'CAMPAIGNID' : vars.campaignid,
								'FILENAME' : 'index.html',
								'_tag' : {
									'datapointer' : 'adminCampaignFileContents|'+vars.campaignid,
									'callback' : callback
									}
								},'immutable');

							}
						else	{
							$D.anymessage({"message":"In admin_templateEditor.a.showTemplateEditorInModal, mode ["+mode+"] passed initial validation but failed at dispatch add.","gMessage":true});
							} //should never get this far. the if check at the top verifies valid mode. This is just a catch all.
					
						app.model.dispatchThis('immutable');
						}



					
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_templateEditor.a.showTemplateEditorInModal, mode ["+mode+"] was blank or invalid.","gMessage":true});
					}				
				
				}, //showTemplateEditorInModal

			showTemplateChooserInModal : function(vars)	{
				vars = vars || {};				
				if((vars.mode == 'campaign' && vars.campaignid) || (vars.mode == 'ebay' && vars.profile))	{

					var dialogObject = {"templateID" : "templateChooserTemplate"};

					if(vars.mode == 'campaign')	{
						dialogObject.title = 'Campaign Template Chooser';
						dialogObject.data = app.data.adminCampaignTemplateList;
						dialogObject.dataAttribs = {'campaignid':vars.campaignid,'mode':vars.mode};
						}
					else if(vars.mode == 'ebay')	{
						dialogObject.title = 'eBay Template Chooser';
						dialogObject.data = app.data.adminEBAYTemplateList;
						dialogObject.dataAttribs = {'profile':vars.profile,'mode':vars.mode};
						}
					else	{} //shouldn't get here.

					var $D = app.ext.admin.i.dialogCreate(dialogObject); //using dialogCreate ensures that the div is 'removed' on close, clearing all previously set data().
					$D.attr('id','templateChooser');
					$D.dialog('open');
					
					$D.imagegallery({
						selector: 'a[data-gallery="gallery"]',
						show: 'fade',
						hide: 'fade',
						fullscreen: false,
						slideshow: false
						});
//					app.u.dump(" -> $D.data()"); app.u.dump($D.data());
					app.u.handleAppEvents($D);
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_syndication.a.showTemplateChooserInModal, either mode ["+mode+"] is invalid or based on mode, either profile or campaignid is not set.","gMessage":true});
					}
				}, //showTemplateChooserInModal

			initWizard : function()	{
				var	$wizardForm = $('#wizardForm');
//the success fieldset, which is last in the list.
				$wizardForm.append("<fieldset class='wizardCompleted' class='displayNone'>Congrats! You have completed the wizard for this template.<\/fieldset>");
				
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
							setTimeout($fieldset.data('onfocus'),100);
							}
						}
					}
				
				fieldsetVerifyAndExecOnfocus($firstFieldset);
				$wizardForm.closest('.ui-widget-content').addClass('positionRelative'); //necessary for button positioning.
				
				$('button',$fieldsets).button(); //applied to all buttons within fieldsets.
				
				//add the next/previous buttons.  The action on the button is controlled through a delegated event on the form itself.
				$("<button data-button-action='previous'>Previous<\/button>").button({icons: {primary: "ui-icon-circle-triangle-w"},text: false}).css({'position':'absolute','top':'30px','left':'-20px'}).button('disable').appendTo($wizardForm);
				$("<button data-button-action='next'>Next<\/button>").button({icons: {primary: "ui-icon-circle-triangle-e"},text: false}).css({'position':'absolute','top':'30px','right':'-20px'}).appendTo($wizardForm);
				
				$wizardForm.prepend("<div class='marginBottom alignCenter'><progress value='0' max='"+$fieldsets.length+"'></progress></div>");
				
				//handles the wizard nav button click events (and any other buttons we add later will get controlled here too)
				$wizardForm.on('click.templatewizard',function(e){
//					app.u.dump("Click registered in the wizard panel");
					var $target = $(e.target); //the element that was clicked.
					
//					app.u.dump(" -> $target.is('button'): "+$target.is('button'));
//					app.u.dump(" -> $target.data('button-action'): "+$target.data('button-action'));
//					app.u.dump(" -> e.target.nodeNam: "+e.target.nodeNam);
//in chrome, the click event is triggered on the child span of the button, not the button itself.
					if(e.target.nodeName.toLowerCase() == 'span')	{
						$target = $target.parent();
						}
					
					if($target.is('button') && $target.data('button-action'))	{
//						app.u.dump(" -> click is on a button");
						e.preventDefault(); //disable the default action.

						
//						app.u.dump(" -> $target.data('button-action'): "+$target.data('button-action'));
						$target.data('button-action') == 'previous' ? $('fieldset:visible',$wizardForm).hide().prev('fieldset').show() : $('fieldset:visible',$wizardForm).hide().next('fieldset').show();
						
						
						var $focusFieldset = $('fieldset:visible',$wizardForm);
						fieldsetVerifyAndExecOnfocus($focusFieldset);

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
						app.ext.admin_templateEditor.u.handleWizardProgressBar($('progress:first',$templateEditor));
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
					$tag.wrap("<a href='data:"+data.value[0].type+";base64,"+data.value[0].base64+"' data-gallery='gallery'>");
					}
			}, //renderFormats




////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
			u : {

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
						setTimeout($fieldset.data('onfocus'),100);
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
							$pbar.val($("fieldset:visible",'#wizardForm').index());
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':"In admin_templateEditor.u.handleWizardProgressBar, pbar ["+$pbar instanceof jQuery+"] is not a valid jquery object.",'gMessage':true});
						}
					},

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

				buildTemplateStyleSheet : function()	{
					var r = "<div id='templateBuilderCSS'>\n<style type='text/css'>\n"
						+ "	.showHighlights_PRODUCT .actbProductAttribute {background-color:#efefef; border:1px dashed #cccccc;}\n" //used on all non-href product elements
						+ "	.showHighlights_PRODUCT .actbHref {background-color:#00cc00; border:1px solid #cccccc;}\n" //used on product href elements.
						+ "	.showHighlights_KISS .wizardificated {background-color:#e2eee1; border:1px dashed #bdd1bd;}\n"
						+ "	.showHighlights_KISS .unwizardificated {background-color:#f0f5fb; border:1px dashed #b9d6fc;}\n"
						+ "<\/style></div>"
					return r;
					}, //buildTemplateStyleSheet

				postprocessTemplate : function(template)	{
					var $template = $("<html>"); //need a parent container.
					$template.append(template);
					$('#templateBuilderCSS',$template).empty().remove();
					return $template.html();
					}, //postprocessTemplate

				preprocessTemplate : function(template)	{
					var $template = $("<html>"); //need a parent container.
					$template.append(template);
					$("[data-object]",$template).each(function(){
						var $ele = $(this);
						if($ele.data('object') == 'PRODUCT')	{
							if($ele.is('a') && !$ele.hasClass('actbHref'))	{
								$ele.addClass('actbHref');
								}
							else if(!$ele.is('a') && !$ele.hasClass('actbProductAttribute'))	{
								$ele.addClass('actbProductAttribute')
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

				showObjectInInspector : function($object,$objectInspector)	{
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
						$('#globalMessaging').anymessage({'message':"In admin_templateEditor.u.handleWizardProgressBar, either object ["+$object instanceof jQuery+"] or objectInspector ["+$objectInspector instanceof jQuery+"] were not valid jquery objects.",'gMessage':true});
						}
					},

//Used to copy a template into a profile or campaign (or whatever as more get added).
//vars needs to include SUBDIR and PROJECTID.  Vars is most likely passed from an li.data(), but doesn't have to be.
				handleTemplateSelect : function(vars)	{
					vars = vars || {};
					var $TC = $('#templateChooser');
					const mode = $TC.data('mode'); //should never get changed through this code.
					
					if(mode)	{
						if((mode == 'campaign' && $TC.data('campaignid')) || (mode == 'ebay' && $TC.data('profile')))	{
							if(vars.SUBDIR)	{
								//all is well at this point. proceed.
								$TC.showLoading({'message':'One moment please. Copying files into directory.'});
								var dObj = {
									_tag : {
										'callback' : function(rd)	{
											if(app.model.responseHasErrors(rd)){
												$form.anymessage({'message':rd})
												}
											else	{
												$TC.dialog('close');
												$('#globalMessaging').anymessage(app.u.successMsgObject("Thank you, the template "+vars.SUBDIR+" has been copied."));
												$(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')).find("[data-app-role='templateOrigin']:first").text(vars.SUBDIR);
												}
											}
										}	
									}
								
								dObj.SUBDIR = vars.SUBDIR;
								dObj.PROJECTID = vars.PROJECTID;
								
								
								if(mode == 'ebay')	{
									dObj._cmd = 'adminEBAYTemplateInstall';
									dObj.PROFILE = $TC.data('profile');
									app.model.addDispatchToQ({
										'_cmd':'adminEBAYProfileUpdate',
										'template_origin':vars.SUBDIR,
										'PROFILE' : $TC.data('profile')
										},'immutable');
									}
								else if(mode == 'campaign')	{
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
							$TC.anymessage({"message":"In admin_templateEditor.u.handleTemplateSelect, either mode ["+mode+"] is invalid (must be ebay or campaign) or a supporting/required value (profile ["+$TC.data('profile')+"] for ebay or campaignid ["+$TC.data('campaignid')+"] for campaign) was unable to be ascertained. ","gMessage":true});
							}
						}
					else	{
						$TC.anymessage({"message":"In admin_templateEditor.u.handleTemplateSelect, unable to determine 'mode' from #templateChooser.","gMessage":true});
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
							$ul = $("<ul \/>");
					
//eww.  but it got me here quick for a practical demo.  Probably want to do this as a json object. could we load flexedit? may be suicidal.
							
							$("<li \/>").text('Product Name').on('click',function(){
								jhtml.pasteHTML("<span class='actbProductAttribute' data-attrib='zoovy:prod_name' data-input-cols='100' data-input-data='product:zoovy:prod_name' data-input-type='TEXTBOX' data-label='Product Name' data-object='PRODUCT' id='PROD_NAME'>Product name</span>");
								$D.dialog('close');
								}).appendTo($ul);
							
							$("<li \/>").text('Product Manufacturer').on('click',function(){
								jhtml.pasteHTML("<span class='actbProductAttribute' data-attrib='zoovy:prod_mfg' data-input-cols='100' data-input-data='product:zoovy:prod_mfg' data-input-type='TEXTBOX' data-label='Product Manufacturer' data-object='PRODUCT' id='PROD_MFG'>Product Manufacturer</span>");
								$D.dialog('close');
								}).appendTo($ul);
							
							$("<li \/>").text('Product Description').on('click',function(){
								jhtml.pasteHTML("<span class='actbProductAttribute' data-attrib='zoovy:prod_desc' data-input-cols='80' data-input-data='product:zoovy:prod_desc' data-input-rows='5' data-input-type='TEXTAREA' data-label='Product Description (shared)' data-object='PRODUCT' id='PROD_DESC'>Product Description</span>");
								$D.dialog('close');
								}).appendTo($ul);
							
							$("<li \/>").text('Product Features').on('click',function(){
								jhtml.pasteHTML("<span class='actbProductAttribute' data-attrib='zoovy:prod_features' data-input-cols='80' data-input-data='product:zoovy:prod_features' data-input-rows='5' data-input-type='TEXTAREA' data-label='Product Features (shared)' data-object='PRODUCT' id='PROD_FEATURES'>Product Features</span>");
								$D.dialog('close');
								}).appendTo($ul);
							
							$("<li \/>").text('Product Image 5').on('click',function(){
								jhtml.pasteHTML("<span class='actbProductAttribute' data-attrib='zoovy:prod_image5' data-if='BLANK' data-object='PRODUCT' data-then='REMOVE' id='IMAGE5_CONTAINER'><a class='actbProductAttribute' data-attrib='zoovy:prod_image5' data-format='img' data-img-bgcolor='ffffff' data-img-border='0' data-img-data='product:zoovy:prod_image5' data-img-height='' data-img-zoom='1' data-label='Image5' data-object='PRODUCT' id='IMAGE5_HREF' width='200'><img class='actbProductAttribute' data-attrib='zoovy:prod_image5' data-format='img' data-img-bgcolor='ffffff' data-img-border='0' data-img-data='product:zoovy:prod_image5' data-img-zoom='1' data-label='Image 5' data-object='PRODUCT' id='IMAGE5' src='placeholder-2.png' width='200'></a></span>");
								$D.dialog('close');
								}).appendTo($ul);
							$("li",$ul).addClass('lookLikeLink');
							$ul.appendTo($D);
							
							}
						}
					} //getEditorButton_prodattributeadd

			}, //u [utilities]



////////////////////////////////////   EVENTS [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



			e : {

				adminSaveAsTemplateExec : function($btn)	{
					$btn.button();
					$btn.off('click.adminSaveAsTemplateExec').on('click.adminSaveAsTemplateExec',function(){
						var
							templateName = $('#templateName').val(),
							$D = $('#templateEditor');
						const mode = $D.data('mode');
						
						if(templateName && templateName.length > 5 )	{
							if((mode == 'campaign' && $D.data('campaignid')) || (mode == 'ebay' && $D.data('profile')))	{
								$D.showLoading({'message':'Saving as new template: '+templateName});
								var dObj = {
									'SUBDIR' : templateName,
//									'PROJECTID' : $D.data('PROJECTID'), //not passed cuz the user doesnt 'choose' the projectid. it'll be set to TEMPLATES
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
//									'body' : $('.jHtmlArea iframe:first',$D).contents().find('body').html()
									}
								
								if(mode == 'ebay')	{
									dObj._cmd = 'adminEBAYTemplateCreateFrom';
									dObj.PROFILE = $D.data('profile');
									// !!! save original template prior to createFrom execution.
									}
								else if(mode == 'campaign')	{
									dObj._cmd = 'adminCampaignTemplateCreateFrom';
									dObj.CAMPAIGNID = $D.data('campaignid');
									// !!! save original template prior to createFrom execution.
									}
								else	{} //shouldn't ever get here.

								app.model.addDispatchToQ(dObj,'immutable');
								app.model.dispatchThis('immutable');
								}
							else	{
								$D.anymessage({"message":"In admin_syndication.e.adminSaveAsTemplateExec, either mode ["+mode+"] is invalid or, based on mode, either profile or campaignid is not set.","gMessage":true});
								}
							}
						else	{
							$D.anymessage({"message":"Please enter a template name of at least 6 characters."});
							}
						});
					},
					
//executed when a template is selected.
				templateChooserExec : function($ele)	{
					$ele.off('click.templateChooserShow').on('click.templateChooserShow',function(){
						app.ext.admin_templateEditor.u.handleTemplateSelect($ele.closest('li').data());
						});
					},
				
//used to upload a file (img, zip, .html, etc) into a profile or campaign.				
				containerFileUploadShow : function($btn){

					$btn.button();
					$btn.off('click.containerFileUploadShow').on('click.containerFileUploadShow',function(){


						const mode = $btn.data('mode');

						if((mode == 'campaign' && $btn.closest("[data-campaignid]").data('campaignid')) || (mode == 'ebay' && $btn.closest("[data-profile]").data('profile')))	{
							var $D = app.ext.admin.i.dialogCreate({
								'title' : 'Template File Upload',
								'templateID' : 'templateFileUploadTemplate',
								data : {} //blank data because translation needs to occur (template calls another template)
								});

							$D.dialog('option','height','400');
							if(mode == 'ebay')	{
								$('form',$D).append("<input type='hidden' name='profile' value='"+$D.data('profile')+"' \/>");
								}
							else if(mode == 'campaign')	{
								$('form',$D).append("<input type='hidden' name='campaignid' value='"+$D.data('campaignid')+"' \/>");
								}
							$D.dialog('open');
							app.ext.admin_medialib.u.convertFormToJQFU($('form',$D),'adminEBAYProfileFileUpload');
							}
						else	{
							$D.anymessage({"message":"In admin_syndication.e.adminSaveAsTemplateExec, either mode ["+mode+"] is invalid or, based on mode, either profile or campaignid is not set.","gMessage":true});
							}
						});

					},
				
// used to download a zip file of a 'container' (which is a template saved into a profile or campaign).
				containerZipDownloadExec : function($btn)	{
					$btn.button();
					$btn.off('click.containerZipDownloadExec').on('click.containerZipDownloadExec',function(){

						const mode = $btn.data('mode');

						if((mode == 'campaign' && $btn.closest("[data-campaignid]").data('campaignid')) || (mode == 'ebay' && $btn.closest("[data-profile]").data('profile')))	{
							
							$(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')).showLoading({'message':'Building a zip file. One moment please...'});
							var dObj = {
								'base64' : true,
								'_tag' : {
									'callback':'fileDownloadInModal',
									'extension':'admin',
									'datapointer':'templateZipDownload',
									'jqObj' : $(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content'))
									}
								}
							
							if(mode == 'ebay')	{
								var profile = $btn.closest("[data-profile]").data('profile');
								dObj._cmd = 'adminEBAYProfileZipDownload';
								dObj.FILENAME = 'ebay_'+profile+'.zip';
								dObj.PROFILE = profile;
								}
							else if(mode == 'campaign')	{
								var campaignid =  $btn.closest("[data-campaignid]").data('campaignid')
								dObj._cmd = 'adminCampaignZipDownload';
								dObj.FILENAME = "campaign_"+campaignid+'.zip';
								dObj.CAMPAIGNID = campaignid;
								}
							else	{}
							
							app.model.addDispatchToQ(dObj,'immutable');
							app.model.dispatchThis('immutable');							
							}
						else	{
							$D.anymessage({"message":"In admin_syndication.e.adminSaveAsTemplateExec, either mode ["+mode+"] is invalid or, based on mode, either profile or campaignid is not set.","gMessage":true});
							}
						
					

						});
					}, //containerZipDownloadExec




//opens the template chooser interface.
				templateChooserShow : function($btn)	{
					$btn.button();
					$btn.off('click.templateChooserShow').on('click.templateChooserShow',function(){

						if($btn.data('mode') == 'campaign')	{
							app.ext.admin_templateEditor.a.showTemplateChooserInModal({"mode":"campaign","campaignid":$btn.closest("[data-campaignid]").data('campaignid')});
							}
						else if ($btn.data('mode') == 'ebay')	{
							app.ext.admin_templateEditor.a.showTemplateChooserInModal({"mode":"ebay","profile":$btn.closest("[data-profile]").data('profile')});
							}
						else	{
							//invalid mode set.
							$('#globalMessaging').anymessage({"message":"In admin_templateEditor.e.templateChooserShow, invalid mode ["+$btn.data('mode')+"] set on button.","gMessage":true});
							}
						
						});
					}, //templateChooserShow
					
				templateEditorShow : function($btn)	{
					$btn.button();
					$btn.off('click.templateEditorShow').on('click.templateEditorShow',function(){

						if($btn.data('mode') == 'campaign')	{
							app.ext.admin_templateEditor.a.showTemplateEditorInModal("campaign",{"campaignid":$btn.closest("[data-campaignid]").data('campaignid')});
							}
						else if ($btn.data('mode') == 'ebay')	{
							app.ext.admin_templateEditor.a.showTemplateEditorInModal("ebay",{"profile":$btn.closest("[data-profile]").data('profile')});
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
					if($meta.length == 0)	{$btn.button('disable')}
					else	{
						app.u.dump(" -> $meta.attr('content'): "+$meta.attr('content'));
						$btn.off('click.startWizardExec').on('click.startWizardExec',function(event){
							$btn.button('disable').hide();
							event.preventDefault();
							$('#wizardForm').showLoading({"message":"Summoning Wizard..."});
							app.model.addDispatchToQ({
								'_cmd':'adminEBAYProfileFileContents',
								'FILENAME':$meta.attr('content'),
								'PROFILE': $('#templateEditor').data('profile'),
								'_tag':	{
									'datapointer' : 'adminEBAYProfileFileContents|'+$meta.attr('content'),
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
								},'mutable');
							app.model.dispatchThis('mutable');
							});
						}
					},

				templateHighlightToggle : function($cb)	{
					$cb.anycb();
					$cb.on('change',function(){
						if($cb.is(':checked'))	{
							$('iframe',$cb.closest('.ui-dialog-content')).contents().find('body').addClass('showHighlights_'+$cb.data('objecttype'));
							}
						else	{
							$('iframe',$cb.closest('.ui-dialog-content')).contents().find('body').removeClass('showHighlights_'+$cb.data('objecttype'));
							}
						});
					},

				adminTemplateSaveExec : function($btn)	{
					$btn.button();
					$btn.off('click.adminTemplateSaveExec').on('click.adminTemplateSaveExec',function(){
						
						var $D = $('#templateEditor');
						const mode = $D.data('mode');
						
						if((mode == 'campaign' && $D.data('campaignid')) || (mode == 'ebay' && $D.data('profile')))	{
							$D.showLoading({'message':'Saving changes'});

							var dObj = {
								'FILENAME' : 'index.html',
								'_tag' : {
									'callback' : function(responseData)	{
										$D.hideLoading();
										if(app.model.responseHasErrors(responseData)){
											$D.anymessage({'message':responseData})
											}
										else	{
											$D.dialog('close');
											$('#globalMessaging').anymessage(app.u.successMsgObject('Your changes have been saved.'));
											}
										}
									},
								'body' : app.ext.admin_templateEditor.u.postprocessTemplate($('.jHtmlArea iframe:first',$D).contents().find('html').html())
								}

							if(mode == 'ebay')	{
								dObj._cmd = 'adminEBAYProfileFileSave';
								dObj.PROFILE = $D.data('profile');
								}
							else if(mode == 'campaign')	{
								dObj._cmd = 'adminCampaignFileSave';
								dObj.CAMPAIGNID = $D.data('campaignid');
								}
							else	{} //shouldn't get here. mode is verified earlier to be a supported mode.
	
	
							app.model.addDispatchToQ(dObj,'immutable');
							app.model.dispatchThis('immutable');							
							}
						else	{
							$D.anymessage({"message":"In admin_syndication.e.adminTemplateSaveExec, either mode ["+mode+"] is invalid or, based on mode, either profile or campaignid is not set.","gMessage":true});
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