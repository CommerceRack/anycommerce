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
					app.ext.admin_templateEditor.u.declareKissTemplateFunctions(); //adds some global functions to the dom. shortcuts for template editing.
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
	$D.removeData('profile');
	$D.removeData('mode');
	$D.empty();
	}
else	{
	$D = $("<div \/>",{'id':'templateEditor','title':'Edit '+mode+' Template'});
	$D.dialog({
		'modal':true,
		'autoOpen':false,
		'width':'90%',
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
	$('#globalMessaging').anymessage({"message":"In admin_templateEditor.a.showTemplateEditorInModal, mode is ebay but vars.profile was not set and is requird.","gMessage":true});
	} //error
else if(mode == 'campaign' && !vars.campaignID)	{
	$('#globalMessaging').anymessage({"message":"In admin_templateEditor.a.showTemplateEditorInModal, mode is campaign but vars.campaignID was not set and is requird.","gMessage":true});
	}
else	{
	$D.data('mode',mode);
	$D.data(vars); //vars.profile is used in the media lib to get the profile. don't change it.
	$D.dialog('option','height',($(window).height() - 100));
	$D.anycontent({'templateID':'templateEditorTemplate','showLoading':false,'data':{}}); //pass in a blank data so that translation occurs 
	$D.dialog('open');
	$D.showLoading({"message":"Fetching template HTML"});

	var callback = function(rd){
		$D.hideLoading();
		if(app.model.responseHasErrors(rd)){
			$D.anymessage({'message':rd})
			}
		else	{
	
			$("[data-app-role='templateObjectInspectorContainer']").anypanel({
				'state' : 'persistent',
				showClose : false, //set to false to disable close (X) button.
				wholeHeaderToggle : true, //set to false if only the expand/collapse button should toggle panel (important if panel is draggable)
				extension : 'template_editor', //used in conjunction w/ persist.
				name : 'templateEditorObjectInspector', //used in conjunction w/ persist.
				persistentStateDefault : 'collapse',
				persistent : true
				});
			var $objectInspector = $("[data-app-role='templateObjectInspectorContent']",$D);
			
	//								app.u.dump(app.ext.admin_templateEditor.u.getEBAYToolbarButtons());
			$("textarea:first",$D)
				.height($D.height() - 100)
				
				.css('width','75%')
				.val(app.ext.admin_templateEditor.u.preprocessTemplate(app.data[rd.datapointer]['body']))
				.htmlarea({
					// Override/Specify the Toolbar buttons to show
					toolbar: app.ext.admin.u.buildToolbarForEditor(app.ext.admin_templateEditor.u.getEBAYToolbarButtons())
					});
			
		
		// event needs to be delegated to the body so that toggling between html and design mode don't drop events and so that newly created events are eventful.
		var $iframeBody = $('iframe',$D).width($('td:first',$D).width() - 30).contents().find('body');
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
		// coming soon...
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


			initWizard : function()	{
				var	$wizardForm = $('#wizardForm');
//the success fieldset, which is last in the list.
				$wizardForm.append("<fieldset class='wizardCompleted'>Congrats! You have completed the wizard for this template.<\/fieldset>");
				
				var
					$fieldsets = $('fieldset',$wizardForm),
					$templateEditor = $('#templateEditor'), //referenced for context on multiple occasions.
					$iframeBody = $('iframe',$templateEditor).contents().find('body');

				

				$fieldsets.hide(); //hide all the fieldsets.
				$('fieldset:first',$wizardForm).show(); //show just the first.
				$wizardForm.closest('.ui-widget-content').addClass('positionRelative'); //necessary for button positioning.
				
				$('button',$fieldsets).button(); //applied to all buttons within fieldsets.
				
				//add the next/previous buttons.  The action on the button is controlled through a delegated event on the form itself.
				$("<button data-button-action='previous'>Previous<\/button>").button({icons: {primary: "ui-icon-circle-triangle-w"},text: false}).css({'position':'absolute','top':'30px','left':'-20px'}).button('disable').appendTo($wizardForm);
				$("<button data-button-action='next'>Next<\/button>").button({icons: {primary: "ui-icon-circle-triangle-e"},text: false}).css({'position':'absolute','top':'30px','right':'-20px'}).appendTo($wizardForm);
				
				$wizardForm.prepend("<div class='marginBottom alignCenter'><progress value='0' max='"+$fieldsets.length+"'></progress></div>");
				
				//handles the wizard nav button click events (and any other buttons we add later will get controlled here too)
				$wizardForm.on('click.templatewizard',function(e){
					var $target = $(e.target); //the element that was clicked.
					if($target.is('button') && $target.data('button-action'))	{
						e.preventDefault(); //disable the default action.

						

						$target.data('button-action') == 'previous' ? $('fieldset:visible',$wizardForm).hide().prev('fieldset').show() : $('fieldset:visible',$wizardForm).hide().next('fieldset').show();
						
						
						var $focusFieldset = $('fieldset:visible',$wizardForm);
						if($focusFieldset.data('onfocus'))	{
//							$focusFieldset.data('onfocus')() //does not work.
							setTimeout($focusFieldset.data('onfocus'),100); //works.
//							eval($focusFieldset.data('onfocus')); //works.
//							$focusFieldset.append("<script type='text/javascript'>"+$focusFieldset.data('onfocus')+"<\/script>"); //works.
							}
//						app.u.dump("index of new visible fieldset: "+$('fieldset:visible',$wizardForm).index());
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

			}, //renderFormats




////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
			u : {

//adds some global functions for easy reference from the supporting html file for the wizard
				declareKissTemplateFunctions : function()	{
	
	
	function getTarget(selector,functionName){
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
	
	//selector is an element within the wizard itself.
	window.kiss_inspect = function(selector)	{
		var $target = getTarget(selector,'kiss_inspect');
		r = null;
		if($target)	{
			app.ext.admin_templateEditor.u.ebayKISSInspectObject($target,$("[data-app-role='templateObjectInspectorContent']",$('#templateEditor')));
			r = $target;
			}
		else	{} //getTarget handles error display.
		return r;
		}
	
	window.kiss_medialib = function(ID)	{
		var $target = getTarget(ID,'kiss_medialib');
		if($target)	{
			app.ext.admin_medialib.a.showMediaLib({
				'imageID':app.u.jqSelector('#',ID.substring(1)),
				'mode':'kissTemplate'//,
	//			'src':$target.data('filepath') //doesn't work like we want. uses some legacy UI code.
				}); //filepath is the path of currently selected image. oldfilepath may also be set.
			}
		else	{} //getTarget handles error display.
		}
	
	window.kiss_verify = function(selector,$fieldset)	{
		var r = 0;  //what is returned. zero if no matches or # of matches.
		var fail = false;
		app.u.dump(' -> kiss_verify selector is a '+typeof selector);
		if(selector && $fieldset instanceof jQuery)	{
			if(typeof selector === 'string')	{
				var $target = getTarget(selector,'kiss_exists');
				if($target)	{r = $target.length}
				else {fail = true}
				}
			else if(typeof selector === 'object')	{
				var L = selector.length;
				for(var i = 0; i < L; i += 1)	{
					var $target = getTarget(selector[i],'kiss_exists');
					if($target)	{r += $target.length}
					else	{fail = true; }
					}
				}
			else	{
				//invalid selector. throw error.
				$("[data-app-role='wizardMessaging']",$('#templateEditor')).anymessage({'message':'Invalid element selector type ['+typeof selector+'] passed into kiss_exists.'});
				}
			if(fail)	{
				app.u.dump(" -> a fail occurd in kiss_verify");
				$('select, textarea, input',$fieldset).attr('disabled','disabled'); //unable to find all selectors, so disable entire panel.
				$('button',$fieldset).button('disable');
				} //do nothing,
			}
		else	{
			$("[data-app-role='wizardMessaging']",$('#templateEditor')).anymessage({'message':'Invalid element selector type ['+typeof selector+'] or fieldset ['+($fieldset instanceof jQuery)+'] not passed into kiss_exists.'});
			}
		return r;
		}
	
	window.kiss_modify = function(selector,method,vars)	{
		vars = vars || {};
		
		var methods = new Array("set-attribs","empty","hide","show","set-value","append");
		
		if(methods.indexOf(method) >= 0)	{
			var $target = getTarget(selector,'kiss_implement');
			if($target)	{
	
				switch(method)	{
					case 'set-attribs':
						$target.attr(vars.attribs)
						break;
					case 'append':
						$target.append(vars.html)
						break;
					case 'set-value':
						$target.html(vars['$input'].val())
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
						$("[data-app-role='wizardMessaging']",$('#templateEditor')).anymessage({'message':'Method ['+method+'] passed into kiss_implement passed validation but is not declared in switch.','gMessage':true});
					}
	
	
				}
			else	{} //getTarget handles error display.
			}
		else	{
			$("[data-app-role='wizardMessaging']",$('#templateEditor')).anymessage({'message':'Invalid or blank method ['+method+'] passed into kiss_implement. This is likely the result of an error in the wizard.js file.'});
			}
		}
	
					},
	
//updates the progress bar based on the number of fieldsets and the index of the fieldset in view (yes, going backwards means progress bar regresses)
				handleWizardProgressBar : function($pbar)	{
					if($pbar instanceof jQuery)	{
						var $kisses = $("fieldset",'#wizardForm');
						if($kisses.length)	{
							$pbar.val($("fieldset:visible",'#wizardForm').index());
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':"In admin_templateEditor.u.handleWizardProgressBar, pbar ["+$pbar instanceof jQuery+"] is not a valid jquery object.",'gMessage':true});
						}
					},

				handleWizardObjects : function($iframeBody,$objectInspector)	{
					if($iframeBody instanceof jQuery && $objectInspector instanceof jQuery)	{
						// .addClass('showHighlights_PRODUCT showHighlights_KISS') -> add to iframeBody to start w/ highlights on.
						$iframeBody.on('click',function(e){
							var $target = $(e.target);
	//						app.u.dump(" -> $target.id: "+$target.attr('id'));
							app.ext.admin_templateEditor.u.ebayKISSInspectObject($target,$objectInspector); //updates object inspector when any element is clicked.
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
						$('#globalMessaging').anymessage({'message':"In admin_templateEditor.u.handleWizardProgressBar, either object ["+$object instanceof jQuery+"] or objectInspector ["+$objectInspector instanceof jQuery+"] were not valid jquery objects.",'gMessage':true});
						}
					},

//returns an array that gets appended to the html editor toolbar.
				getEBAYToolbarButtons : function()	{
	
	return [{
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
				}	,	{
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
				},{
				css : 'prodattributeadd',
				'text' : 'Add a Product Attribute',
				action: function (btn) {
					var jhtml = this; //the jhtml object.
					var $D = app.ext.admin.i.dialogCreate({
						'title' : 'Add Product Attribute'
						});
					$D.dialog('open');
					$ul = $("<ul class='lookLikeLink' \/>");
	
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
		jhtml.pasteHTML("<span class='actbProductAttribute' data-attrib='zoovy:prod_image5' data-if='BLANK' data-object='PRODUCT' data-then='REMOVE' id='IMAGE5'><a class='actbProductAttribute' data-attrib='zoovy:prod_image5' data-format='img' data-img-bgcolor='ffffff' data-img-border='0' data-img-data='product:zoovy:prod_image5' data-img-height='' data-img-width='200' data-img-zoom='1' data-label='Image5' data-object='PRODUCT' id='IMAGE5' width='200'><img class='actbProductAttribute' data-attrib='zoovy:prod_image5' data-format='img' data-img-bgcolor='ffffff' data-img-border='0' data-img-data='product:zoovy:prod_image5' data-img-zoom='1' data-label='Image5 (200 by X)' data-object='PRODUCT' id='IMAGE5' src='placeholder-2.png' width='200'></a></span>");
		$D.dialog('close');
		}).appendTo($ul);
	$ul.appendTo($D);
	
					}
				}]
					} //getEBAYToolbarButtons

			}, //u [utilities]



////////////////////////////////////   EVENTS [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



			e : {

				adminSaveAsTemplateExec : function($btn)	{
					$btn.button();
					$btn.off('click.adminSaveAsTemplateExec').on('click.adminSaveAsTemplateExec',function(){
						var templateName = $('#templateName').val();
						if(templateName && templateName.length > 5)	{
							var $D = $btn.closest('.ui-dialog-content');
							$D.showLoading({'message':'Saving as new template: '+templateName});
							var mode = $('#templateEditor').data('mode');
							if(mode == 'ebay')	{
								app.model.addDispatchToQ({
									'_cmd' : 'adminEBAYMacro',
									'@updates' : ["PROFILE-SAVEAS-TEMPLATE?PROFILE="+profile+"&template="+templateName],
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
										},
									'body' : $('.jHtmlArea iframe:first',$D).contents().find('body').html()
									},'mutable');
								}
							else if(mode == 'campaign')	{}
							else	{
								$D.anymessage({"message":"In admin_templateEditor.e.adminSaveAsTemplateExec, mode ["+mode+"] was either invalid (must be ebay or campaign) or unable to ascertain value.","gMessage":true})
								}
							app.model.dispatchThis('mutable');
							}
						else	{
							$D.anymessage({"message":"Please enter a template name of at least 6 characters."});
							}				
						});
					},

				startWizardExec : function($btn)	{
					$btn.button();
					var $meta = $('.jHtmlArea iframe:first',$('#templateEditor')).contents().find("meta[name='wizard']");
					if($meta.length == 0)	{$btn.button('disable')}
					else	{
						$btn.off('click.startWizardExec').on('click.startWizardExec',function(event){
							event.preventDefault();
							$('#wizardForm').load($meta.attr('content'),function(){ //'app-admin/working/sample_kisswizard.html'
								app.ext.admin_templateEditor.a.initWizard();
								});
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
						var $D = $btn.closest('.ui-dialog-content');
						$D.showLoading({'message':'Saving changes'});
						app.model.addDispatchToQ({
							'_cmd' : 'adminEBAYProfileFileSave',
							'PROFILE' : $D.data('profile'),
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
							},'immutable');
						app.model.dispatchThis('immutable');
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