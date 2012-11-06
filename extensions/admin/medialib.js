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
	var theseTemplates = new Array();
	var r = {

////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		

	calls : {


		}, //calls




////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				app.rq.push(['css',0,'http://blueimp.github.com/cdn/css/bootstrap.min.css','blueimp_bootstrap']);
				app.rq.push(['css',0,'http://blueimp.github.com/cdn/css/bootstrap-responsive.min.css','blueimp_bootstrap_responsive']);
				app.rq.push(['css',0,'http://blueimp.github.com/Bootstrap-Image-Gallery/css/bootstrap-image-gallery.min.css','blueimp_bootstrap_imagegal']);
				app.rq.push(['css',0,'https://www.zoovy.com/biz/ajax/jQuery-File-Upload-master/css/jquery.fileupload-ui.css','blueimp_fileupload_ui']);
				
				app.rq.push(['script',0,'https://www.zoovy.com/biz/ajax/jQuery-File-Upload-master/js/vendor/jquery.ui.widget.js']); //
				app.rq.push(['script',0,'http://blueimp.github.com/JavaScript-Templates/tmpl.min.js']); //The Templates plugin is included to render the upload/download listings
				app.rq.push(['script',0,'http://blueimp.github.com/JavaScript-Load-Image/load-image.min.js']); //The Canvas to Blob plugin is included for image resizing functionality
				app.rq.push(['script',0,'http://blueimp.github.com/JavaScript-Canvas-to-Blob/canvas-to-blob.min.js']); //
				app.rq.push(['script',0,'https://www.zoovy.com/biz/ajax/jQuery-File-Upload-master/js/jquery.iframe-transport.js']); //The Iframe Transport is required for browsers without support for XHR file uploads
				app.rq.push(['script',0,'https://www.zoovy.com/biz/ajax/jQuery-File-Upload-master/js/jquery.fileupload.js']); //The basic File Upload plugin
				app.rq.push(['script',0,'https://www.zoovy.com/biz/ajax/jQuery-File-Upload-master/js/jquery.fileupload-fp.js']); //The File Upload file processing plugin
				app.rq.push(['script',0,'https://www.zoovy.com/biz/ajax/jQuery-File-Upload-master/js/jquery.fileupload-ui.js']); //The File Upload user interface plugin
				app.rq.push(['script',0,'https://www.zoovy.com/biz/ajax/jQuery-File-Upload-master/js/main.js']); //The main application script
				
			
				
//				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/product_editor.html',theseTemplates);
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}

		}, //callbacks




////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {},

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {},
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {} //u


		
		} //r object.
	return r;
	}