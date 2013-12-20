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
//	Utilizes the Magnific Popup jQuery plugin: http://dimsemenov.com/plugins/magnific-popup/

var tools_magnificpopup = function() {
	var r = {
	callbacks : {
		init : {
			onSuccess : function()	{
				var r = false;
				
				app.u.loadResourceFile(['script',0,'extensions/tools_magnificpopup/magnificpopup/jquery.magnificpopup.js']);
				app.u.loadResourceFile(['css',0,'extensions/tools_magnificpopup/magnificpopup/magnificpopup.css','css-magnificpopup']);
				
				app.rq.push (['templateFunction', 'productTemplate', 'onCompletes', function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));
					app.ext.tools_magnificpopup.u.callMagnificPopup($context);
				}]);
				
				r = true;

				return r;
				},
			onError : function()	{
				app.u.dump('BEGIN tools_magnificpopup.callbacks.init.onError');
				}
			}
		}, //callbacks

		a : {

			}, //a [actions]

		renderFormats : {
			imageURL2Href : function($tag, data){
				app.renderFormats.imageURL2Href($tag,data);
				
				$tag.attr('data-magnificpopup','imgLink');
				}
			}, //renderFormats

		u : {
			callMagnificPopup : function($context, attempts){
				attempts = attempts || 0; 
				if(typeof $.fn.magnificPopup !== "undefined"){
					
					var $imgContainer = $('[data-magnificpopup=imgContainer]', $context);
					$imgContainer.magnificPopup({
						delegate: 'a[data-magnificpopup=imgLink]',
						type: 'image',
						gallery: {enabled:true}
					});
					
					var $imgContainer = $('[data-magnificpopup=imgContainerResponsive]', $context);
					$imgContainer.magnificPopup({
						delegate: 'a[data-magnificpopup=imgLink]',
						type: 'image',
						gallery: {enabled:true}
					});
				}
				else {
					if(attempts > 40){
						app.u.dump("Magnific Popup FAILED ");
					}
					else {
						setTimeout(function(){app.ext.tools_magnificpopup.u.callMagnificPopup($context, attempts+1);}, 250);
					}
				}
			}
		
			} //u [utilities]

		} //r object.
	return r;
	}