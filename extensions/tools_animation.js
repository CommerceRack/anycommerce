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
				
				//Set up delegated events
				$('body').on('mouseenter.animation', '[data-animation-mouseenter]', function(){
					var args = $(this).attr('data-animation-mouseenter');
					
					var anim = args.split('?')[0];
					var params = app.u.kvp2Array(args.split('?')[1]);
					
					app.ext.tools_animation.u.stopAnim(anim);
					app.ext.tools_animation.u.startAnim(anim, params);
					
					});
				
				$('body').on('mouseout.animation', '[data-animation-mouseout]', function(){
					var args = $(this).attr('data-animation-mouseout');
					
					var anim = args.split('?')[0];
					var params = app.u.kvp2Array(args.split('?')[1]);
					
					app.ext.tools_animation.u.stopAnim(anim);
					app.ext.tools_animation.u.startAnim(anim, params);
					
					});
				
				r = true;

				return r;
				},
			onError : function()	{
				app.u.dump('BEGIN tools_animation.callbacks.init.onError');
				}
			}
		}, //callbacks

	animations : {
		loop : function(animation, time, delta, animKey){
			animation.nextUpdate = animation.nextUpdate || time + animation.frameDur;
			if(time > animation.nextUpdate){
				animation.nextUpdate = time + animation.frameDur;
				animation.currFrame = (animation.currFrame+1) % animation.frameCount;
				var xpos = animation.x1 + animation.currFrame * (animation.width + animation.xGap);
				animation.$tag.css('background-position', (-1*xpos)+'px '+(-1*animation.y)+'px');
				}
			},
		fwd : function(animation, time, delta, animKey){
			animation.nextUpdate = animation.nextUpdate || time + animation.frameDur;
			if(time > animation.nextUpdate){
				animation.nextUpdate = time + animation.frameDur;
				animation.currFrame = (animation.currFrame+1);
				if(animation.currFrame < animation.frameCount){
					var xpos = animation.x1 + animation.currFrame * (animation.width + animation.xGap);
					animation.$tag.css('background-position', (-1*xpos)+'px '+(-1*animation.y)+'px');
					}
				else {
					animation.currFrame = animation.frameCount-1;
					app.ext.tools_animation.u.stopAnim(animKey);
					if(animation.animCallback && typeof animation.animCallback == 'function'){
						animation.animCallback(animation);
						}
					}
				}
			},
		back : function(animation, time, delta, animKey){
			animation.nextUpdate = animation.nextUpdate || time + animation.frameDur;
			if(time > animation.nextUpdate){
				animation.nextUpdate = time + animation.frameDur;
				animation.currFrame = (animation.currFrame-1);
				if(animation.currFrame >=0){
					var xpos = animation.x1 + animation.currFrame * (animation.width + animation.xGap);
					animation.$tag.css('background-position', (-1*xpos)+'px '+(-1*animation.y)+'px');
					}
				else {
					animation.currFrame = 0;
					app.ext.tools_animation.u.stopAnim(animKey);
					if(animation.animCallback && typeof animation.animCallback == 'function'){
						animation.animCallback(animation);
						}
					}
				}
			},
		stop : function(animation, time, delta, animKey){
			app.ext.tools_animation.u.stopAnim(animKey);
			if(animation.animCallback && typeof animation.animCallback == 'function'){
				animation.animCallback(animation);
				}
			} 
		},
	
	animCallbacks : {
		goToLastFrame : function(animation){
			animation.currFrame = (animation.currFrame-1);
			var xpos = animation.x1 + animation.currFrame * (animation.width + animation.xGap);
			animation.$tag.css('background-position', (-1*xpos)+'px '+(-1*animation.y)+'px');
			},
		goToFirstFrame : function(animation){
			animation.currFrame = 0;
			var xpos = animation.x1 + animation.currFrame * (animation.width + animation.xGap);
			animation.$tag.css('background-position', (-1*xpos)+'px '+(-1*animation.y)+'px');
			}
		},
////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {

			}, //renderFormats

////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			//update : function(animation, time, delta){
			//	
			//	},
			
			startAnim : function(animation, params){
				params = params || {};
				if(app.ext.tools_animation.vars.anims[animation]){
					if (params.animFunc && typeof params.animFunc == 'string' && app.ext.tools_animation.animations[params.animFunc]){
						params.animFunc = app.ext.tools_animation.animations[params.animFunc];
						}
					if (params.animCallback && typeof params.animCallback == 'string' && app.ext.tools_animation.animCallbacks[params.animCallback]){
						params.animCallback = app.ext.tools_animation.animCallbacks[params.animCallback];
						}
					if(params.start){
						params.currFrame = Number(params.start);
						delete params.start;
						}
					
					for(var p in params){
						app.ext.tools_animation.vars.anims[animation][p] = params[p];
					}
				
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
						currFrame : Number(params.startFrame) || 0,
						frameCount : Number(params.frameCount),
						imgsrc : params.imgsrc,
						frameDur : Number(params.frameDur) || 100,
						width : Number(params.width),
						height : Number(params.height),
						x1 : Number(params.x1),
						xGap : Number(params.xGap) || 0,
						y : Number(params.y)
						};
						
					if(params.animFunc && typeof params.animFunc == 'function'){
						animation.animFunc = params.animFunc;
						}
					else if (params.animFunc && typeof params.animFunc == 'string' && app.ext.tools_animation.animations[params.animFunc]){
						animation.animFunc = app.ext.tools_animation.animations[params.animFunc];
						}
						
					if(params.animCallback && typeof params.animCallback == 'function'){
						animation.animCallback = params.animCallback;
						}
					else if (params.animCallback && typeof params.animCallback == 'string' && app.ext.tools_animation.animCallbacks[params.animCallback]){
						animation.animCallback = app.ext.tools_animation.animCallbacks[params.animCallback];
						}
						
					var xpos = animation.x1 + (animation.currFrame * (animation.width + animation.xGap));
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
					//app.ext.tools_animation.u.update(app.ext.tools_animation.aq[anim], newTime, delta);
					app.ext.tools_animation.aq[anim].animFunc(app.ext.tools_animation.aq[anim], newTime, delta, anim);
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
				if(window.performance && typeof window.performance.now === "function"){
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