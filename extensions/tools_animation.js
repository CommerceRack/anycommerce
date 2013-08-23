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




var tools_animation = function() {
	var theseTemplates = new Array('');
	var r = {
	
	vars : {
		},
	
	metrics : {
		lastTime : 0,
		lastFPSTime : 0,
		frames : 0,
		fps : 0,
		dumpMetrics : false
		},
////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	callbacks : {
		init : {
			onSuccess : function()	{
				var r = false; 
				app.ext.tools_animation.vars.anims = {};
				app.ext.tools_animation.aq = {};
				//Must be accessed from the window namespace
				window.animFrame = window.requestAnimationFrame ||
					window.webkitRequestAnimationFrame ||
					window.mozRequestAnimationFrame    ||
					window.oRequestAnimationFrame      ||
					window.msRequestAnimationFrame     ||
					function(callback){
						window.setTimeout(callback, 1000/60);
						};
				app.ext.tools_animation.u.animLoop();
				
				r = true;

				return r;
				},
			onError : function()	{
				app.u.dump('BEGIN tools_animation.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {

			}, //renderFormats

////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			update : function(animation, time, delta){
				animation.nextUpdate = animation.nextUpdate || time + animation.frameDur;
				if(time > animation.nextUpdate){
					animation.nextUpdate += animation.frameDur;
					animation.currFrame = (animation.currFrame+1) % animation.frameCount;
					var xpos = animation.x1 + animation.currFrame * (animation.width + animation.xGap);
					animation.$tag.css('background-position', (-1*xpos)+'px '+(-1*animation.y)+'px');
					}
				},
			
			startAnim : function(animation){
				if(app.ext.tools_animation.vars.anims[animation]){
					app.ext.tools_animation.aq[animation] = app.ext.tools_animation.vars.anims[animation];
					}
				else {
					app.u.dump("-> ERROR app.ext.tools_animation.u.startAnim: Animation "+animation+" has not yet been loaded!");
					}
				},
				
			stopAnim : function(animation){
				delete app.ext.tools_animation.aq[animation];
				},
			
			loadAnim : function($tag, name, params){
				if($tag &&
					name &&
					params.frameCount && 
					params.imgsrc &&
					params.width &&
					params.height &&
					typeof params.x1 !== 'undefined' &&
					typeof params.y !== 'undefined' ){
					var animation = {
						$tag : $tag,
						currFrame : 0,
						frameCount : params.frameCount,
						imgsrc : params.imgsrc,
						frameDur : params.frameDur || 100,
						width : params.width,
						height : params.height,
						x1 : params.x1,
						xGap : params.xGap || 0,
						y : params.y
						};
					var xpos = animation.x1 + animation.currFrame * (animation.width + animation.xGap);
					animation.$tag.css('background', 'url('+animation.imgsrc+') no-repeat '+(-1*xpos)+'px '+(-1*animation.y)+'px');
						
					app.ext.tools_animation.vars.anims[name] = animation;
					}
				else {
					app.u.dump("-> ERROR app.ext.tools_animation.u.loadAnim: Some required parameters were left out");
					}
				},
			
			animLoop : function(){
				//Wake from our slumber
				var newTime = app.ext.tools_animation.u.now();
				if(!app.ext.tools_animation.metrics.lastFPSTime){
					app.ext.tools_animation.metrics.lastFPSTime = newTime;
					}
				//Delta in millis, so that frame duration can be specified in millis also
				var delta = newTime - app.ext.tools_animation.metrics.lastTime
				
				//Run the animations
				for(var anim in app.ext.tools_animation.aq){
					app.ext.tools_animation.u.update(app.ext.tools_animation.aq[anim], newTime, delta);
					}
				
				//Update an report metrics
				app.ext.tools_animation.metrics.frames++
				app.ext.tools_animation.metrics.lastTime = newTime;
				
				if(newTime - app.ext.tools_animation.metrics.lastFPSTime >= 1000){
					app.ext.tools_animation.metrics.fps = app.ext.tools_animation.metrics.frames;
					app.ext.tools_animation.metrics.frames = 0;
					app.ext.tools_animation.metrics.lastFPSTime = newTime;
					if(app.ext.tools_animation.metrics.dumpMetrics){
						app.u.dump("-> app.ext.tools_animation.metrics.fps at "+newTime+": "+app.ext.tools_animation.metrics.fps);
						}
					}
				
				window.animFrame(app.ext.tools_animation.u.animLoop);
				},
				
			now : function(){
				if(typeof window.performance.now === "function"){
					return window.performance.now();
					}
				else if(typeof Date.now === "function"){
					return Date.now();
					}
				else {
					return (new Date()).getTime();
					}
				}
			}, //u [utilities]

		e : {
			} //e [app Events]
		} //r object.
	return r;
	}