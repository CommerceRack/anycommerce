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


var jerseypreview = function() {
	var r = {
////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).

				//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
				r = true;
				app.rq.push(['templateFunction','productTemplate','onCompletes',function(P){
					var $context = app.u.jqSelector('#', P.parentID);
					$('input[name=B5], input[name=B6]', $context).keyup(function(){
						if($(this).data('timer')){
							clearTimeout($(this).data('timer'));
							}
						$(this).data('timer', setTimeout(function(){
							app.ext.jerseypreview.u.updatePreview($context);
							}, 600));
						});
					}]);
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN app.ext.cubworld.callbacks.init.onError');
				}
			}
			
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
		a : {
			
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//renderFormats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		renderFormats : {
			assignPreviewerData : function($tag, data){
				if(data.value['%attribs'] && 
					data.value['%attribs']['user:prod_flashparams_jersey'] && 
					data.value['%attribs']['zoovy:prod_image8']){
					//var obj = app.u.kvp2Array("font="+data.value['%attribs']['user:prod_flashparams_jersey']);
					//obj.font = obj.font.split('.')[0];
					var obj = {
						font : data.value["%attribs"]["user:preview_font"] || "LHFoldblockCONDMED",
						name : {
							size : data.value["%attribs"]["user:preview_name_text_size"] || 30,
							color : data.value["%attribs"]["user:preview_name_color"] || "28489B",
							strokeColor : data.value["%attribs"]["user:preview_name_outline_color"] || "DB2321",
							strokeThickness : data.value["%attribs"]["user:preview_name_outline_thickness"] || 1,
							x : data.value["%attribs"]["user:preview_name_xloc"] || "-1",
							y : data.value["%attribs"]["user:preview_name_yloc"] || 30
							},
						number : {
							size : data.value["%attribs"]["user:preview_number_text_size"] || 85,
							color : data.value["%attribs"]["user:preview_number_color"] || "28489B",
							strokeColor : data.value["%attribs"]["user:preview_number_outline_color"] || "DB2321",
							strokeThickness : data.value["%attribs"]["user:preview_number_outline_thickness"] || 3,
							x : data.value["%attribs"]["user:preview_number_xloc"] || "-1",
							y : data.value["%attribs"]["user:preview_number_yloc"] || 50
							},
						img : $(app.u.makeImage({
							name : data.value['%attribs']['zoovy:prod_image8'],
							w : $tag.attr('width'),
							h : $tag.attr('height'),
							b : "FFFFFF",
							tag : 1
							})).get(0)					
						};
					$tag.data('preview-params', obj);
					}
				else {
					//We are not needed here
					$tag.remove();
					}
				}
			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
			updatePreview : function($context){
				//app.u.dump(name+" "+number);
				var $canvas = $('canvas.prodPreviewer', $context);
				if($canvas.length != 0){
					var name = $('input[name=B5]', $context).val().toUpperCase();
					var number = $('input[name=B6]', $context).val().toUpperCase();
					if(name != "" && number != ""){
						var context = $canvas.get(0).getContext('2d');
						var params = $canvas.data('preview-params');
						var w = $canvas.innerWidth();
						var h = $canvas.innerHeight();
						
						context.fillStyle = "#ffffff";
						context.clearRect(0,0,w,h);
						context.fillRect(0,0,w,h);
						
						//scratchpads
						var textSize;
						var x;
						//draw image to canvas
						context.drawImage(params.img, 0, 0);
						
						//draw number to canvas
						context.font = params.number.size+"px "+params.font;
						context.fillStyle = "#"+params.number.color;
						context.strokeStyle = "#"+params.number.strokeColor;
						context.lineWidth = params.number.strokeThickness;
						
						textSize = context.measureText(number);
						x = (params.number.x < 0 ? w/2 : params.number.x) - textSize.width/2;
						
						context.fillText(number, x, params.number.y+params.number.size);
						context.strokeText(number, x, params.number.y+params.number.size);
						
						//draw name to canvas
						context.font = params.name.size+"px "+params.font;
						context.fillStyle = "#"+params.name.color;
						context.strokeStyle = "#"+params.name.strokeColor;
						context.lineWidth = params.name.strokeThickness;
						
						textSize = context.measureText(name);
						x = (params.name.x < 0 ? w/2 : params.name.x) - textSize.width/2;
						
						context.fillText(name, x, params.name.y+params.name.size);
						context.strokeText(name, x, params.name.y+params.name.size);
						
						if($canvas.hasClass('displayNone')){
							$canvas.fadeIn();
							$canvas.removeClass('displayNone');
							}
						}
					else  if(!$canvas.hasClass('displayNone')){
						$canvas.fadeOut();
						$canvas.addClass('displayNone');					
						}
					else {
						//Nothing to update and canvas is already hidden.  Do nothing.
						}
					}
				}
				
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			}, //e [app Events]
		vars : {
			}
		} //r object.
		
	return r;
	}