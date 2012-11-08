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
	var theseTemplates = new Array('mediaLibTemplate','fileUploadTemplate');
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
				app.model.addDispatchToQ({"_cmd":"adminImageDetail","filename":f,"_tag" : tagObj},Q);	
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
				tagObj = tagObj || {};
				tagObj.datapointer = "adminImageFolderDetail|"+f
				if(app.model.fetchData(tagObj.datapointer) == false)	{
					r = 1;
					this.dispatch(f,tagObj,Q);
					}
				else	{
					app.u.handleCallback(tagObj);
					}
				},
			dispatch : function(f,tagObj,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminImageFolderDetail","folder":f,"_tag" : tagObj},Q);	
				}
			}, //adminImageDetail


		adminImageFolderList : {
			init : function(tagObj,Q)	{

tagObj = tagObj || {};
tagObj.datapointer = 'adminImageFolderList';
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


		adminUIMediaLibraryExecute : {
			init : function(tagObj)	{
				this.dispatch(tagObj);
				},
			dispatch : function(tagObj)	{
				tagObj = tagObj || {};
				app.model.addDispatchToQ({"_cmd":"adminUIMediaLibraryExecute","_tag" : tagObj},'immutable');	
				}
			}

		}, //calls




////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).


				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/resources/jquery.fileupload-ui.css','blueimp_fileupload_ui']); //CSS to style the file input field as button and adjust the jQuery UI progress bars
				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/resources/jquery.image-gallery.min.css','blueimp_fileupload_ui']); //CSS to style the file input field as button and adjust the jQuery UI progress bars
				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/medialib.css','medialib']); //our native css for presentation.

				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/canvas-to-blob.min.js']); //
				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jquery.fileupload.js']); //
				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jquery.fileupload-fp.js']); //The File Upload file processing plugin
				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jquery.fileupload-jui.js']); //The File Upload jqueryui plugin
				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jquery.fileupload-ui.js']); //The File Upload user interface plugin
				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jquery.iframe-transport.js']); //The Iframe Transport is required for browsers without support for XHR file uploads
				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jquery.image-gallery.min.js']); //The Canvas to Blob plugin is included for image resizing functionality
				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/load-image.min.js']); //The Canvas to Blob plugin is included for image resizing functionality
				app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/tmpl.min.js']); //The Templates plugin is included to render the upload/download listings
				
				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/medialib.html',theseTemplates);
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			},

		showMediaLibrary : {
			
			onSuccess : function(tagObj){
				$('#'+tagObj.parentID).removeClass('loadingBG') //.append(app.renderFunctions.transmogrify({},tagObj.templateID,app.data[tagObj.datapointer]));
				app.renderFunctions.translateTemplate(app.data[tagObj.datapointer],tagObj.parentID);
				app.ext.admin_medialib.u.convertFormToJQFU('#fileUploadContainer form');
				}
			}

		}, //callbacks




////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {

//media library gets used a lot.  
// -> builder.
// -> product editor.
// -> setup tab.

			showMediaLib : function(P){
//open the media library
				var $target = $('#mediaModal');
				if($target.length)	{}
				else	{
					$target = $("<div \/>").attr({'id':'mediaModal','title':'Media Library'}).addClass('loadingBG').appendTo('body');
//by adding the template instance only once, the media lib will re-open showing last edited folder. 
					$target.append(app.renderFunctions.createTemplateInstance('mediaLibTemplate'));
					$target.dialog({'autoOpen':false,'modal':true, width:'90%', height: 500});

					app.ext.admin_medialib.calls.adminImageFolderList.init({'callback':'showMediaLibrary','extension':'admin_medialib','parentID':'mediaModal','templateID':'mediaLibTemplate'},'mutable');
					app.model.dispatchThis();

					}
				$target.dialog('open');
				},

			showFoldersFor : function(P)	{
				if(P.targetID && P.templateID)	{
					P.parentFID = P.parentFID || "0"; //default to showing root level folders.
					$('#'+P.targetID).append(app.ext.admin_medialib.u.showFoldersByParentFID(P.parentFID,P.templateID))
					}
				else	{
					//required params missing.
					app.u.throwGMessage("WARNING! some required params for admin_medialib.a.showFoldersFor were missing. targetID and templateID are required. Params follow:");
					app.u.dump(P);
					}
				},
			showMediaAndSubs : function(FID){
				$('#mediaLibFileList ul').empty().addClass('loadingBG');
				var folderProperties = app.ext.admin_medialib.u.getFolderInfoFromPID(FID);
				//show sub folders.
				var $target = $('#mediaChildren_'+FID);
				$target.toggle(); //allows folders to be opened and closed.

				if($target.children().length)	{} //children have already been added. don't duplicate.
				else	{
					$target.append(app.ext.admin_medialib.u.showFoldersByParentFID(FID,'mediaLibFolderTemplate'));
					}
				//show files.
				if(folderProperties && folderProperties.FName)	{
					app.ext.admin_medialib.u.showMediaFor({'FName':folderProperties.FName,'selector':'#mediaLibFileList'});
					app.model.dispatchThis();
					}
				else	{
					app.u.throwGMessage("WARNING! unable to determine FName from FID ["+FID+"] in admin_medialib.a.showMediaAndSubs.");
					app.u.dump(folderProperties);
					}
				
				}
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			showChildFolders : function($tag,data){
				app.u.dump("BEGIN admin_medialib.renderFormats.showChildFolders");
				$tag.append(app.ext.admin_medialib.u.showFoldersByParentFID(data.value,data.bindData.loadsTemplate));
				}
			},
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
			
			
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
        window.location.href.replace(
            /\/[^\/]*$/,
            '/cors/result.html?%s'
        )
    );

	$.ajax({
		// Uncomment the following to send cross-domain cookies:
		//xhrFields: {withCredentials: true},
		url: $(selector).fileupload('option', 'url'),
		dataType: 'json',
		context: $(selector)[0]
	}).done(function (result) {
		app.u.dump("");
		if (result && result.length) {
			$(this).fileupload('option', 'done')
				.call(this, null, {result: result});
		}
	});

    // Initialize the Image Gallery widget:
    $(selector + ' .files').imagegallery();

		
				
				},

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
			showMediaFor : function(P)	{
				if(P.selector && P.FName)	{
					P.callback = 'translateSelector'
					app.ext.admin_medialib.calls.adminImageFolderDetail.init(P.FName,P,'mutable');
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
					app.u.dump(" -> L: "+L);
					app.u.dump(" -> FID: "+FID);
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
				app.u.dump(" -> # children: "+$ul.children().length);
				return $ul.children();
				}
			
			} //u


		
		} //r object.
	return r;
	}