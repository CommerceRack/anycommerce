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


/*!
 * isFontFaceSupported - v0.9 - 12/19/2009
 * http://paulirish.com/2009/font-face-feature-detection/
 * 
 * Copyright (c) 2009 Paul Irish
 * MIT license
 */

var isFontFaceSupported = (function(){
var
sheet, doc = document,
head = doc.head || doc.getElementsByTagName('head')[0] || docElement,
style = doc.createElement("style"),
impl = doc.implementation || { hasFeature: function() { return false; } };

style.type = 'text/css';
head.insertBefore(style, head.firstChild);
sheet = style.sheet || style.styleSheet;

var supportAtRule = impl.hasFeature('CSS2', '') ?
        function(rule) {
            if (!(sheet && rule)) return false;
            var result = false;
            try {
                sheet.insertRule(rule, 0);
                result = !(/unknown/i).test(sheet.cssRules[0].cssText);
                sheet.deleteRule(sheet.cssRules.length - 1);
            } catch(e) { }
            return result;
        } :
        function(rule) {
            if (!(sheet && rule)) return false;
            sheet.cssText = rule;

            return sheet.cssText.length !== 0 && !(/unknown/i).test(sheet.cssText) &&
              sheet.cssText
                    .replace(/\r+|\n+/g, '')
                    .indexOf(rule.split(' ')[0]) === 0;
        };

return supportAtRule('@font-face { font-family: "font"; src: "font.ttf"; }');
})();



var jerseypreview = function(_app) {
	var r = {
////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


	vars : {
		paramsByPID : {
			
			},
		whitelist : [
			"974",
			"974CB",
			"6200-CUBA-EJ-PER",
			"6200-CUBR-EJ-PER",
			"6300-CUBA-EJ-PER",
			"6300-CUBD-EJ-PER",
			"6300-CUBR-EJ-PER",
			"6700-CUBD-EJ-PR1",
			"6700-CUBH-EJ-PER",
			"6200-CUBH-EJ-PER",
			"6700-CUBR-EJ-PR1",
			"6700-PDRH-DRS-PER",
			"blank",
			"CHIC24",
			"CUBS81",
			"CUBS598CUST",
			"CUBSCUSTWRJ",
			"M952-NLAN-NTL-PSG",
			"M952-EJMN-EJ-PER",
			"M958-EJMN-EJ-PER",
			"M952-EJMR-EJ-PER",
			"BHAWKBCPJ",
			"sample"
			]
		},

	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).

				//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
				r = true;
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				_app.u.dump('BEGIN _app.ext.cubworld.callbacks.init.onError');
				}
			},
		attachHandlers : {
			onSuccess : function(){
				_app.templates.productTemplate.on('complete.jerseypreview', function(event, $context, infoObj){
					var pid = infoObj.pid;
					if($.inArray(pid, _app.ext.jerseypreview.vars.whitelist) >= 0 && typeof _app.ext.jerseypreview.vars.paramsByPID[pid] === 'undefined'){
						$.getJSON("extensions/jerseypreview/products/"+pid+".json?_="+(new Date().getTime()))
							.done(function(data, textStatus, jqXHR){
								_app.u.dump("Checking font face support");
								if(isFontFaceSupported){
									_app.u.dump("Font Face Supported");
									if(_app.data[infoObj.datapointer]["%attribs"]["user:jerseypreview_image"]){
										font = data.font;
										if(font){
											$context.append($("<div class='"+font+"'>Some Text</div>").css({"height": "0px", "overflow":"hidden"}));
											}
										
										data.img = $(_app.u.makeImage({
											name : _app.data[infoObj.datapointer]["%attribs"]["user:jerseypreview_image"],
											b : "FFFFFF",
											tag : 1
											})).get(0);
										_app.ext.jerseypreview.vars.paramsByPID[pid] = data;
										}
									else {
										_app.ext.jerseypreview.vars.paramsByPID[pid] = "Supported, but no Image Found";
										}
									}
								else {
									_app.u.throwMessage("Custom Jersey Previews are not available in your browser's version, sorry!");
									_app.ext.jerseypreview.vars.paramsByPID[pid] = "Font Face Not Supported";
									}
								})
							.fail(function(datajqXHR, textStatus, errorThrown){
								_app.ext.jerseypreview.vars.paramsByPID[pid] = "JSON failed to load";
								_app.u.dump("JSON failed to load");
								//report failure?
								});
						}
						
					$('input[name=B5], input[name=B6]', $context).keyup(function(){
						if($(this).data('timer')){
							clearTimeout($(this).data('timer'));
							}
						$(this).data('timer', setTimeout(function(){
							_app.ext.jerseypreview.u.updatePreview($context);
							}, 600));
						});
					});
				},
			onError : function(){}
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
			//uses pid to grab from map in vars, adds img tag from img8
			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
			updatePreview : function($context){
				//_app.u.dump(name+" "+number);
				var $canvas = $('canvas.prodPreviewer', $context);
				if($canvas.length != 0){
					$canvas.get(0).width = $canvas.parent().innerWidth();
					$canvas.get(0).height = $canvas.parent().innerHeight();
					var name = $('input[name=B5]', $context).val().toUpperCase();
					var number = $('input[name=B6]', $context).val().toUpperCase();
					if(name != "" && number != ""){
						var context = $canvas.get(0).getContext('2d');
						var params = _app.ext.jerseypreview.vars.paramsByPID[$canvas.attr('data-pid')];
						var w = $canvas.innerWidth();
						var h = $canvas.innerHeight();
						var ratio = w / 296;
						dump(ratio);
						context.fillStyle = "#ffffff";
						context.clearRect(0,0,w,h);
						context.fillRect(0,0,w,h);
						
						//scratchpads
						var textSize;
						var x;
						//draw image to canvas
						context.drawImage(params.img, 0, 0, w, h);
						
						//draw number to canvas
						context.font = (params.number.size*ratio)+"px "+params.font+","+params.font+"2";
						context.fillStyle = "#"+params.number.color;
						context.strokeStyle = "#"+params.number.strokeColor;
						context.lineWidth = (params.number.strokeThickness*ratio);
						context.textAlign = "center";
						
						x = w/2 + params.number.xOffset*ratio;
						
						context.fillText(number, x, (params.number.y+params.number.size)*ratio);
						context.strokeText(number, x, (params.number.y+params.number.size)*ratio);
						
						//draw name to canvas
						
						context.font = (params.name.size*ratio)+"px "+params.font+","+params.font+"2";
						context.fillStyle = "#"+params.name.color;
						context.strokeStyle = "#"+params.name.strokeColor;
						context.lineWidth = params.name.strokeThickness*ratio;
						
						x = w/2 + params.name.xOffset*ratio;
						this.drawTextAlongArc(context, name, x, (params.name.y+params.name.radius)*ratio, params.name.radius*ratio, params.name.charSize*ratio);
						
						if(!$canvas.is(':visible')){
							$canvas.fadeIn();
							}
						}
					else  if($canvas.is(':visible')){
						$canvas.fadeOut();				
						}
					else {
						//Nothing to update and canvas is already hidden.  Do nothing.
						}
					}
				},
			drawTextAlongArc : function(context, str, centerX, centerY, radius, charSize) {
				var len = str.length, s;
				context.save();
				context.translate(centerX, centerY);
				//angle is in radians (terms of pi) so string length times charSize is the length of the arc,
				//divide by circumference for a percentage, multiply again by 2pi for rads- so just divide by radius
				var angle = (str.length * charSize) / radius
				
				context.rotate(-1 * angle / 2);
				context.rotate(-1 * (angle / len) / 2);
				for(var n = 0; n < len; n++) {
				  context.rotate(angle / len);
				  context.save();
				  context.translate(0, -1 * radius);
				  s = str[n];
				  context.fillText(s, 0, 0);
				  context.strokeText(s, 0, 0);
				  context.restore();
				}
				context.restore();
			  }
				
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			}, //e [app Events]
		} //r object.
		
	return r;
	}