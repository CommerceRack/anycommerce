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
An extension for acquiring and displaying 'lists' of categories.
The functions here are designed to work with 'reasonable' size lists of categories.
*/



var admin_medialib = function() {
	var theseTemplates = new Array('mediaLibTemplate','mediaLibFolderTemplate','mediaFileTemplate','mediaLibFileDetailsTemplate');
	var r = {

////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		

	calls : {

		adminImageDelete : {
			init : function(obj,tagObj,Q)	{
				this.dispatch(obj,tagObj,Q);
				},
			dispatch : function(obj,tagObj,Q)	{
				obj._tag =  tagObj || {};
				obj._cmd = "adminImageDelete"
				app.model.addDispatchToQ(obj,Q);	
				}
			}, //adminImageDelete

//f is filename
		adminImageDetail : {
			init : function(f,tagObj,Q)	{
				this.dispatch(f,tagObj,Q);
				},
			dispatch : function(f,tagObj,Q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminImageDetail|"+f
				app.model.addDispatchToQ({"_cmd":"adminImageDetail","file":f,"_tag" : tagObj},Q);	
				}
			}, //adminImageDetail

		adminImageFolderCreate : {
			init : function(f,tagObj,Q)	{
				this.dispatch(f,tagObj,Q);
				},
			dispatch : function(f,tagObj,Q)	{
				tagObj = tagObj || {};
				app.model.addDispatchToQ({"_cmd":"adminImageFolderCreate","folder":f,"_tag" : tagObj},Q);	
				}
			}, //adminImageFolderCreate

		adminImageFolderDelete : {
			init : function(f,tagObj,Q)	{
				this.dispatch(f,tagObj,Q);
				},
			dispatch : function(f,tagObj,Q)	{
				tagObj = tagObj || {};
				app.model.addDispatchToQ({"_cmd":"adminImageFolderDelete","folder":f,"_tag" : tagObj},Q);	
				}
			}, //adminImageFolderDelete


//f is filename
		adminImageFolderDetail : {
			init : function(f,tagObj,Q)	{
				app.u.dump("BEGIN admin_medialib.calls.adminImageFolderDetail.init");
				app.u.dump(" -> Q: "+Q);
//				app.u.dump(" -> tagObj: "); app.u.dump(tagObj);
				tagObj = tagObj || {};
				tagObj.datapointer = "adminImageFolderDetail|"+f
				if(tagObj.forceRequest)	{
					app.u.dump(" -> force request is true");
					r = 1;
					this.dispatch(f,tagObj,Q);
					}
				else if(app.model.fetchData(tagObj.datapointer) == false)	{
					app.u.dump(" -> data is NOT local");
					r = 1;
					this.dispatch(f,tagObj,Q);
					}
				else	{
					app.u.dump(" -> data IS local");
					app.u.handleCallback(tagObj);
					}
				},
			dispatch : function(f,tagObj,Q)	{
				app.u.dump(" -> adding dispatch to "+Q+" queue");
				app.model.addDispatchToQ({"_cmd":"adminImageFolderDetail","folder":f,"_tag" : tagObj},Q);	
				}
			}, //adminImageDetail


		adminImageFolderList : {
			init : function(tagObj,Q)	{

tagObj = tagObj || {};
tagObj.datapointer = 'adminImageFolderList';
if(tagObj.forceRequest)	{
	r = 1;
	this.dispatch(tagObj,Q);
	}
if(app.model.fetchData(tagObj.datapointer) == false)	{
	r = 1;
	this.dispatch(tagObj,Q);
	}
else	{
	app.u.handleCallback(tagObj);
	}
				},
			dispatch : function(tagObj,Q)	{
				tagObj = tagObj || {};
				tagObj.datapointer = "adminImageFolderList"
				app.model.addDispatchToQ({"_cmd":"adminImageFolderList","_tag" : tagObj},Q);	
				}
			}, //adminImageFolderList

//obj should contain verb and src. for save, should include IMG
		adminUIMediaLibraryExecute : {
			init : function(obj,tagObj)	{
				this.dispatch(obj,tagObj);
				},
			dispatch : function(obj,tagObj)	{
				obj._cmd = "adminUIMediaLibraryExecute"
				obj._tag = tagObj || {};
				obj._tag.datapointer = 'adminUIMediaLibraryExecute|'+obj.verb;
				app.model.addDispatchToQ(obj,'immutable');	
				}
			}

		}, //calls




////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).


				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/resources/jquery.fileupload-ui.css','admin_medialib_fileupload_ui']); //CSS to style the file input field as button and adjust the jQuery UI progress bars
				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/resources/jquery.image-gallery.min.css','admin_medialib_imagegallery_ui']); //CSS to style the file input field as button and adjust the jQuery UI progress bars
				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/medialib.css','admin_medialib']); //our native css for presentation.

				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/canvas-to-blob.min.js']); //
				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jquery.fileupload.js']); //
				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jquery.fileupload-fp.js']); //The File Upload file processing plugin
				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jquery.fileupload-ui.js']); //The File Upload user interface plugin
				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jquery.iframe-transport.js']); //The Iframe Transport is required for browsers without support for XHR file uploads
				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jquery.image-gallery.min.js']); //The Canvas to Blob plugin is included for image resizing functionality
//				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/load-image.min.js']); //The Canvas to Blob plugin is included for image resizing functionality
//				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/tmpl.min.js']); //The Templates plugin is included to render the upload/download listings
				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jquery.fileupload-jui.js']); //The File Upload jqueryui plugin
				
				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/medialib.html',theseTemplates);
				
				window.mediaLibrary = app.ext.admin_medialib.a.uiShowMediaLib
				
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}, //init

		showMediaLibrary : {
			
			onSuccess : function(tagObj){
				$('#'+tagObj.parentID).removeClass('loadingBG') //.append(app.renderFunctions.transmogrify({},tagObj.templateID,app.data[tagObj.datapointer]));
				app.renderFunctions.translateTemplate(app.data[tagObj.datapointer],tagObj.parentID);
				app.ext.admin_medialib.u.convertFormToJQFU('#mediaLibUploadForm');
				}
			
			}, //showMediaLibrary
			
		handleMediaLibUpdate : {
			onSuccess : function(tagObj){
				$('#mediaModal').dialog('close');
				}
			}//handleMediaLibUpdate
		}, //callbacks




////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {

//media library gets used a lot.  
// -> builder.
// -> product editor.
// -> setup tab.

			showMediaLib : function(P){
				var $target = $('#mediaModal');
				if($target.length)	{} //media lib has already been created.
//media library hasn't been opened yet. Add to dom and add properties that only get added once.
				else	{
					$target = $("<div \/>").attr({'id':'mediaModal','title':'Media Library'}).addClass('loadingBG').appendTo('body');
//by adding the template instance only once, the media lib will re-open showing last edited folder. 
					$target.append(app.renderFunctions.createTemplateInstance('mediaLibTemplate'));
					$target.dialog({'autoOpen':false,'modal':true, width:'90%', height: 500});
					
					app.ext.admin_medialib.u.handleMediaLibButtons($target)
					
					app.ext.admin_medialib.calls.adminImageFolderList.init({'callback':'showMediaLibrary','extension':'admin_medialib','parentID':'mediaModal','templateID':'mediaLibTemplate'},'mutable');
					app.model.dispatchThis();

					}
//				app.u.dump("Media library setting data: "); app.u.dump(P);
				$target.data(P);
				$target.dialog('open');
				}, //showMediaLib

//first param is thumbnail object
//second param is string (mode in api call) or object (ref to text input, hidden, something). must determine
//third param is The title.
			uiShowMediaLib : function($image,strOrObj,title){

//P is added to media library instance using data, and I didn't want an entire jq object there (or two, potentially)
				var imageID; 
				if($image.attr('id'))	{imageID = $image.attr('id')}
				else	{
					imageID = 'image_'+app.u.guidGenerator()
					$image.attr('id',imageID)
					}

				var P = {'imageID':'#'+imageID,'title':title};
//see note about imageID on why this isn't being passed straight through.
//also, because this is passed into the media library as a string, the string or object distinction is done here and passed in with different keys.
//selector is passed instead of ID to be more versatile. The mediaLib itself may end up using a class.
				if(typeof strOrObj == 'object')	{
					if(strOrObj.attr('id'))	{P.eleSelector = '#'+strOrObj.attr('id')}
					else	{
						P.eleSelector = '#input_'+app.u.guidGenerator();
						strOrObj.attr('id',P.eleSelector);
						}
					}
				else if(typeof strOrObj == 'string')	{P.mode = strOrObj;}
				app.ext.admin_medialib.a.showMediaLib(P);
				}, //uiShowMediaLib

//jquery object of image container. properties for data-fid and some others will be set.
			selectThisMedia : function($obj){
				var fileInfo = $obj.closest('li').data(); //the image is what's clickable. data is in parent li. don't just check parent().data() because template may change and img could be nested lower.
				var $medialib = $('#mediaModal');
				var mediaData = $medialib.data();
//				app.u.dump("mediaData: "); app.u.dump(mediaData);
//				app.u.dump("fileInfo: "); app.u.dump(fileInfo);
				var error = false;
//imageID should always be set. And the presence of eleSelector or mode determines the action.
//eleSelector just updates some form on the page.
//mode requires an API call.
				if(mediaData.imageID && ( mediaData.eleSelector ||  mediaData.mode))	{
//update the image on the page to show what has been selected.
					if(mediaData.imageID)	{
						var $image = $(mediaData.imageID);
						app.u.dump(app.u.makeImage({'tag':0,'w':$image.attr('width'),'h':$image.attr('height'),'name':fileInfo.path,'b':'ffffff'}));
						$image.attr({
							'src':app.u.makeImage({'tag':0,'w':$image.attr('width'),'h':$image.attr('height'),'name':fileInfo.path,'b':'ffffff'}),
							'alt':fileInfo.Name
							});
						}
//update form element
					if(mediaData.eleSelector){
						$(eleSelector).val(fileInfo.path);
						$medialib.dialog('close');
						}
//selector OR mode WILL be set by the time we get here.
					else	{
						app.ext.admin_medialib.calls.adminUIMediaLibraryExecute.init({'verb':'SAVE','src':mediaData.mode,'IMG':fileInfo.path},{'callback':'handleMediaLibUpdate','extension':'admin_medialib'});
						app.model.dispatchThis('immutable');
						}
					}
				else	{
					error = true;
					app.u.throwGMessage("WARNING! Required params for admin_medialib.selectThisMedia not available.");
					app.u.dump(" -> imageID or eleSelector must be set:"); app.u.dump(mediaData);
					app.u.dump(" -> path must be set. Name would be nice"); app.u.dump(fileInfo);
					} //something is amiss. required params not avail.
				}, //selectThisMedia

			showFoldersFor : function(P)	{
				if(P.targetID && P.templateID)	{
					P.parentFID = P.parentFID || "0"; //default to showing root level folders.
					$('#'+P.targetID).append(app.ext.admin_medialib.u.showFoldersByParentFID(P.parentFID,P.templateID));
					}
				else	{
					//required params missing.
					app.u.throwGMessage("WARNING! some required params for admin_medialib.a.showFoldersFor were missing. targetID and templateID are required. Params follow:");
					app.u.dump(P);
					}
				}, //showFoldersFor
			
			showMediaDetailsInDialog : function(P){
				if(P.name)	{
					var safeID = 'mediaFileDetails_'+app.u.makeSafeHTMLId(P.name)
					var $target = $('#'+safeID);
					if($target.length){} //contents already created. do nothing.
//contents not generated yet. Create them.
					else	{
						$target = $("<div \/>").attr({'id':safeID,'title':P.name}).appendTo('body');
						$target.dialog({autoOpen:false,width:500,height:350,modal:true});
						$target.append(app.renderFunctions.createTemplateInstance('mediaLibFileDetailsTemplate'));
						app.ext.admin_medialib.calls.adminImageDetail.init(P.path,{'callback':'translateTemplate','parentID':safeID});
						app.model.dispatchThis();
						}
					$target.dialog('open');
					}
				else	{
					app.u.throwGMessage("WARNING! params required for admin_medialib.a.showMediaDetailsInDialog missing. name is required:");
					app.u.dump(P);
					}
				}, //showMediaDetailsInDialog
			
			showMediaAndSubs : function(FID){
				var $mediaTarget = $('#mediaLibFileList ul');
				var folderProperties = app.ext.admin_medialib.u.getFolderInfoFromPID(FID);
				//show sub folders.
				var $folderTarget = $('#mediaChildren_'+FID); //ul for folder children.
				$folderTarget.toggle(); //allows folders to be opened and closed.
				
//updates the text in the folder dropdown to allow the user to make the selection for where a new folder is created.
				$('#mediaLibActionsBar .selectAddFolderChoices li:last').show().trigger('click').text("As child of "+folderProperties.FName).data('path',folderProperties.FName);

//updates the delete folder button with attributes of what folder is in focus so the button knows what folder to delete.
				$('#mediaLibActionsBar .deleteFolderBtn').button('enable').data({'focus-folder-id':FID,'focus-folder-name':folderProperties.FName})
				$('#mediaLibActionsBar .deleteFolderBtn .folderid').text(folderProperties.FName);

				if($folderTarget.children().length)	{} //children have already been added. don't duplicate.
				else	{
					$folderTarget.append(app.ext.admin_medialib.u.showFoldersByParentFID(FID,'mediaLibFolderTemplate'));
					}
					
				
				//show files.
				if(folderProperties && folderProperties.FName)	{
					$mediaTarget.attr({'data-fid':FID,'data-fname':folderProperties.FName});
					app.ext.admin_medialib.u.showMediaFor({'FName':folderProperties.FName,'selector':'#mediaLibFileList'});
					app.model.dispatchThis();
					}
				else	{
					app.u.throwGMessage("WARNING! unable to determine FName from FID ["+FID+"] in admin_medialib.a.showMediaAndSubs.");
					app.u.dump(folderProperties);
					}
				
				} //showMediaAndSubs

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			showChildFolders : function($tag,data){
				app.u.dump("BEGIN admin_medialib.renderFormats.showChildFolders");
				$tag.append(app.ext.admin_medialib.u.showFoldersByParentFID(data.value,data.bindData.loadsTemplate));
				}, //showChildFolders
//the click event is added to the image, not the li. Otherwise, any elements added (such as the delete checkbox), the click event would trickle to.
//The data is set on the li though, so that any elements added, such as the checkbox, could look up that info easily through closest(li).data()
			mediaList : function($tag,data)	{

//				app.u.dump("BEGIN renderFormats.array2Template");
//				app.u.dump(data.value);
				var L = data.value.length;
//				app.u.dump(" -> L: "+L);
				$tag.removeClass('loadingBG');

				var val; //recycled. set to path/filename.
				var FName = $tag.closest('[data-fname]').attr('data-fname');
				if(FName && data.bindData.loadsTemplate)	{
					for(var i = 0; i < L; i += 1)	{
//update data.value[i] with path and id, then pass this entire object into transmogrify so all the values are stored in data for use later on
//SANITY - FName is set to be consistent when this data is passed for interpolation (transmogrify param 3), but when data- is set (param 1) lowercase is used for browser compatiblity.
						data.value[i].path = FName+"/"+data.value[i].Name;
						data.value[i].FName = FName;
						data.value[i].id = 'mediaFile_'+i;
						$tag.append(app.renderFunctions.transmogrify(data.value[i],data.bindData.loadsTemplate,data.value[i])); 
						}
//manage mode would be if you went straight into the media library, not trying to edit something (setup > media library).
					if($tag.data('mode') != 'manage')	{
						$('img',$tag).addClass('pointer').click(function(){
							app.ext.admin_medialib.a.selectThisMedia($(this));
							});
						}
					$("li button",$tag).each(function(){
var $button = $(this);
if($button.data('btn-action') == 'delete')	{
	$button.addClass('btnDelete').button({text:false,icons: {primary: "ui-icon-trash"}}).click(function(){$(this).toggleClass('ui-state-highlight'); })
	}
else if($button.data('btn-action') == 'select')	{
	$button.addClass('btnSelect').button({text:false,icons: {primary: "ui-icon-check"}}).click(function(){$(this).closest('li').find('img').click(); })
	}
else if($button.data('btn-action') == 'details')	{
	$button.addClass('btnDetails').button({text:false,icons: {primary: "ui-icon-info"}}).click(function(){
		app.ext.admin_medialib.a.showMediaDetailsInDialog($(this).closest('li').data())
		})
	}
else if($button.data('btn-action') == 'download')	{
	$button.addClass('btnDownload').button({text:false,icons: {primary: "ui-icon-image"}}).click(function(){
		window.open(app.u.makeImage({'name':$(this).closest('li').data('path')}));
		})
	}
else	{
	//unknown type. do nothing to it (no .button) so it's easily identified.
	}
						});
					}
				else	{
					app.u.throwGMessage("admin_medialib.renderFormats.mediaList unable to determine folder name (hint: should be set on parent ul as data-fname) or templateid [data.bindData.loadsTemplate: "+data.bindData.loadsTemplate+"].");
					}
				} //mediaList
			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
//P is the object/params that get passed into showMediaLib
			handleFilesButtonDisplay : function(P)	{
				$parent = $('#mediaLibFileList')
				$parent.removeClass('hideBtnDelete').removeClass('hideBtnSave').removeClass('hideBtnDetails').removeClass('hideBtnDownload');
				
				//in 'manage' interface, no select button is needed.
				if(P.mode == 'manage'){
					$parent.addClass('hideBtnSave');
					}
				}, //handleFilesButtonDisplay
			
//this is what 'was' in main.js for jquery file upload. but it was too specific and I needed one where I could set the selector.
//JQFU = JQuery File Upload
			convertFormToJQFU : function(selector)	{
				
'use strict';

// Initialize the jQuery File Upload widget:
$(selector).fileupload({
	// Uncomment the following to send cross-domain cookies:
	//xhrFields: {withCredentials: true},
	url: 'https://www.zoovy.com/webapi/jquery/fileupload.cgi/'
	});

// Enable iframe cross-domain access via redirect option:
$(selector).fileupload(
	'option',
	'redirect',
	window.location.href.replace(/\/[^\/]*$/,'/cors/result.html?%s')
	);

	// Load existing files:
	$.ajax({
		// Uncomment the following to send cross-domain cookies:
		//xhrFields: {withCredentials: true},
		url: $(selector).fileupload('option', 'url'),
		dataType: 'json',
		context: $(selector)[0]
	}).done(function (result) {
		if (result && result.length) {
			$(this).fileupload('option', 'done')
				.call(this, null, {result: result});
		}
	});

// Initialize the Image Gallery widget:
$(selector + ' .files').imagegallery();

//$('.btn-success',$(selector)).on('click', function(){$(".fileUploadButtonBar").show()});
				
				}, //convertFormToJQFU

			getFolderInfoFromPID : function(FID)	{
				var r = false; //what is returned. Will be an object if FID is a valid folder id.
				var L = app.data.adminImageFolderList['@folders'].length;
				for(var i = 0; i < L; i += 1)	{
					if(app.data.adminImageFolderList['@folders'][i].FID == FID){
						r = app.data.adminImageFolderList['@folders'][i]
						break
						}
					}
				return r;
				}, //getFolderInfoFromPID

//Will show the images for a given folder. Handles requesting the data.
// selector is a jquery selector (#something) of what gets translated. the entire selector gets translated.
//FName is the folder name (pretty). FID won't work.
			showMediaFor : function(P,Q)	{
				if(P.selector && P.FName)	{
					$(P.selector + ' ul').empty().addClass('loadingBG');
					P.callback = 'translateSelector'
					app.ext.admin_medialib.calls.adminImageFolderDetail.init(P.FName,P,Q || 'mutable');
//					$('#'+P.targetID).append(app.ext.admin_medialib.u.showMediaForFolder(P.parentName,P.templateID))
					}
				else	{
					//required params missing.
					app.u.throwGMessage("WARNING! some required params for admin_medialib.a.showMediaFor were missing. selector and FName are required. Params follow:");
					app.u.dump(P);
					}
				}, //showMediaFor

			showFoldersByParentFID : function(FID,templateID){
//				app.u.dump("BEGIN admin_medialib.u.showFoldersByParentFID");
				var $ul = $("<ul \/>"); //used to store the translated templates so that the dom can be updated just once. children are returned. 0 for none.
				if(FID && templateID)	{
					var L = app.data.adminImageFolderList['@folders'].length;
//					app.u.dump(" -> L: "+L);
//					app.u.dump(" -> FID: "+FID);
	//loop through all the folders and translate a template for each where the parentName matches the value passed in (which is the parentFID).
					for(var i = 0; i < L; i += 1)	{
						if(app.data.adminImageFolderList['@folders'][i].ParentFID == FID)	{
							$ul.append(app.renderFunctions.transmogrify({'folderid':app.data.adminImageFolderList['@folders'][i].FID,'id':'mediaLibFolder_'+app.data.adminImageFolderList['@folders'][i].FID},templateID,app.data.adminImageFolderList['@folders'][i]));
							}
						else	{
							//no match. do nothing.
							}
						}
					}
				else	{
					app.u.throwGMessage("WARNING! params required for admin_medialib.u.showFoldersByName not set.");
					app.u.dump(" -> FID: "+FID);
					app.u.dump(" -> templateID: "+templateID);
					}
//				app.u.dump(" -> # children: "+$ul.children().length);
				return $ul.children();
				}, //showFoldersByParentFID
			
			buildDeleteMediaRequests : function(){
				$('#mediaLibFileList .btnDelete').each(function(){
					if($(this).hasClass('ui-state-highlight'))	{
						var data = $(this).closest('li').data();
						app.u.dump(data);
						app.ext.admin_medialib.calls.adminImageDelete.init({'folder':data.fname,'file':data.name},{},'immutable');
						}
					else	{} //do nothing.
					});
				}, //buildDeleteMediaRequests
//these are the actions on the tool bar row of buttons, not the individual photo/media buttons.
			handleMediaLibButtons : function($target){

$('#mediaLibActionsBar button',$target).each(function(){

	var $button = $(this);
	if($button.data('btn-action') == 'deleteSelected')	{
		$button.button({icons: {primary: "ui-icon-trash"}}).click(function(event){
			event.preventDefault(); //keeps button from submitting the form.
			app.ext.admin_medialib.u.buildDeleteMediaRequests();
			app.ext.admin_medialib.u.showMediaFor({'forceRequest':true,'FName':$('#mediaLibFileList ul').attr('data-fname'),'selector':'#mediaLibFileList'},'immutable');
			app.model.dispatchThis('immutable');
			//also re-request this folder detail and reload and set ul to loadingBG.
			//dispatch.
			})
		}
	else if($button.data('btn-action') == 'selectUploads')	{
		$button.button({icons: {primary: "ui-icon-plus"}}).click(function(event){
			event.preventDefault(); //keeps button from submitting the form.
	//		app.u.dump("Uploads Button Pushed.");
			$('.fileUploadButtonBar',$target).show();
			$('[type=file]',$target).click();
			})
		}
	else if($button.data('btn-action') == 'deleteFolder')	{
		$button.addClass('deleteFolderBtn').button({icons: {primary: "ui-icon-trash"}}).click(function(event){
			event.preventDefault(); //keeps button from submitting the form.
			var numMediaFiles = $('#mediaLibFileList ul').children().length;
			var folderInfo = $button.data();
			
			app.u.dump(folderInfo);
			
			if(numMediaFiles > 0)	{
//				alert('if folder has images, display warning, then delete all images and folder on confirm (or abort). if no images, delete folder w/out warning.');
				}
			else	{
				app.ext.admin_medialib.calls.adminImageFolderDelete.init();
				}
			
			app.u.dump("REMINDER: hide the second option in the add folder list and make sure it can't be selected. the folder wont exist so it won't support children.");
			app.u.dump("REMINDER: probably will need to disable the delete button.");
//			app.u.dump($button.data());
			})
		}
	else if($button.data('btn-action') == 'addFolder')	{
		$button.button({icons: {primary: "ui-icon-folder-collapsed"}}).click(function(event){
			event.preventDefault(); //keeps button from submitting the form.
	//		app.u.dump("Uploads Button Pushed.");
			$button.parent().find('ul').hide();
			if($('#mediaLibNewFolderName').val())	{
				var folderName; //uses either the value of the text input or prepends a path to it.
				if($('#mediaLibActionsBar .selectAddFolderChoices .ui-selectee').data('path') != '')	{
					folderName = $('#mediaLibActionsBar .selectAddFolderChoices .ui-selected').data('path')+'/'+$('#mediaLibNewFolderName').val()
					} //create a sub level folder.
				else	{folderName = $('#mediaLibNewFolderName').val()} //create a root level folder.
				$('ul','#mediaLibFolderList').addClass('loadingBG').children().remove(); //folders will be re-added.

				app.ext.admin_medialib.calls.adminImageFolderCreate.init(folderName,{},'immutable');
				app.ext.admin_medialib.calls.adminImageFolderList.init({'callback':'translateSelector','selector':'#mediaLibFolderList','forceRequest':true},'immutable');
				app.model.dispatchThis('immutable');
				}
			else	{
				app.u.throwMessage("please enter a folder name");
				$('#mediaLibNewFolderName').focus();
				}
	
			})
		}
	else if($button.data('btn-action') == 'selectAddFolderDestination')	{
		$button.button({text:false, icons: {primary: "ui-icon-triangle-1-s"}}).click(function(event){
		
			event.preventDefault(); //keeps button from submitting the form.
var menu = $(this).parent().find('ul').toggle().css({position:'absolute','z-index':'1000'}).position({
	my: "right top",
	at: "right bottom",
	of: this
	});
			})
		}
	});
//groups any buttons inside a span as a button set. this is specifically for the add folder feature.
$('#mediaLibActionsBar span',$target).buttonset();
//makes any ul's inside the spans a menu. THey'll appear on click as part of the btn-action code. used, but not limited to, for selectAddFolderDestination
$('#mediaLibActionsBar span ul',$target).hide().menu().selectable();
				} //handleMediaLibButtons
			
			} //u


		
		} //r object.
	return r;
	}