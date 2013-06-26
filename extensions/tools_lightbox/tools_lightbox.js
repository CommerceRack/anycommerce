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



//	Intended as a free, open source alternative to 3rd party plugins like Magic Zoom Plus.
//	Utilizes the Lightbox 2 jQuery plugin: http://lokeshdhakar.com/projects/lightbox2/

var tools_lightbox = function() {
	var r = {
	callbacks : {
		init : {
			onSuccess : function()	{
				var r = false;
				
				app.u.loadResourceFile(['script',0,'extensions/tools_lightbox/lightbox/js/lightbox.js']);
				app.u.loadResourceFile(['css',0,'extensions/tools_lightbox/lightbox/css/lightbox.css','lightbox']);
				app.u.loadResourceFile(['css',0,'extensions/tools_lightbox/lightbox/css/screen.css','lightbox-screen']);
				
				r = true;

				return r;
				},
			onError : function()	{
				app.u.dump('BEGIN tools_lightbox.callbacks.init.onError');
				}
			}
		}, //callbacks

		a : {

			}, //a [actions]

		renderFormats : {

			}, //renderFormats

		u : {
			} //u [utilities]

		} //r object.
	return r;
	}