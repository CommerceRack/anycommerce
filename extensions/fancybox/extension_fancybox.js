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


var fancybox = function() {
	var theseTemplates = new Array('');
	var r = {
	callbacks : {
		init : {
			onSuccess : function()	{
				var r = true;
				return r;
				},
			onError : function()	{
				app.u.dump('BEGIN fancybox.callbacks.init.onError');
				}
			},
		startExtension : {
			onSuccess : function()	{
				app.rq.push(['css',0,'extensions/fancybox/jquery.fancybox.css','fancyboxStylesheet']);
				app.rq.push(['script',0,'extensions/fancybox/jquery.fancybox.js',function(){
					app.rq.push(['templateFunction','productTemplate','onCompletes',function(P) {
						var $context = $(app.u.jqSelector('#',P.parentID)); 
						$('.fancybox', $context).fancybox({
							'helpers': {
								'overlay' : {
									'css' : {
										'background': 'rgba(0,38,117,.45)'
										}
									}
								}
							});
						}]);
					app.rq.push(['templateFunction','categoryTemplateCuties','onCompletes',function(P) {
						var $context = $(app.u.jqSelector('#',P.parentID)); 
						$('.fancybox', $context).fancybox({
							'helpers': {
								'overlay' : {
									'css' : {
										'background': 'rgba(0,38,117,.45)'
										}
									}
								}
							});
						}]);
					}]);
				},
			onError : function()	{

				app.u.dump('BEGIN fancybox.callbacks.startExtension.onError');
				}
			}
		}, //callbacks


		renderFormats : {
			fancybox : function($tag, data){
				var bgcolor = data.bindData.bgcolor ? data.bindData.bgcolor : 'ffffff'
				if(data.value)	{
					var imgSrc = app.u.makeImage({'tag':0,'w':$tag.attr('width'),'h':$tag.attr('height'),'name':data.value,'b':bgcolor});
					app.u.dump('ID => '+$tag.attr('id'));
					
					$tag.addClass('fancybox');
					$tag.attr('src',imgSrc);
					$tag.attr('data-fancybox-href', app.u.makeImage({'tag':0,'name':data.value,'b':bgcolor}));
					if($tag.parent().data('pid')){
						$tag.attr('data-fancybox-group', 'prodGallery_'+$tag.parent().data('pid'));
						}
					}
				else	{
					$tag.style('display','none'); //if there is no image, hide the src.  !!! added 1/26/2012. this a good idea?
					}
				}
			}, //renderFormats
			
		}	
	return r;
	}