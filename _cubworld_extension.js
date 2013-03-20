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



//    !!! ->   TODO: replace 'username' in the line below with the merchants username.     <- !!!

var cubworld = function() {
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



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
				app.u.dump('BEGIN app.ext.cubworld.callbacks.init.onError');
				}
			},
			
		startExtension : {
			onSuccess : function() {
				if(app.ext.myRIA && app.ext.myRIA.template){
					app.ext.myRIA.template.homepageTemplate.onCompletes.push(function(P) {
						if($('#wideSlideshow').data('slideshow') !== 'true'){
							$('#wideSlideshow').data('slideshow','true').cycle({
								fx:     'fade',
								speed:  'slow',
								timeout: 5000,
								pager:  '#slideshowNav',
								slideExpr: 'li'
								});
							}							
						});
						
					for(var template in app.ext.myRIA.template){
						app.u.dump("Template: "+template);
						app.ext.myRIA.template[template].onCompletes.push(function(P){
							app.u.dump(app.u.jqSelector('#',P.parentID));
							var $context = $(app.u.jqSelector('#',P.parentID));
							if(!$context.data('columncontent')){
								$context.data('columncontent','helpfulLinks');
							}
							app.u.dump($context.data('columncontent'));
						});
					}
					if($("#appView #homepageTemplate_").length > 0){
						if($('#wideSlideshow').data('slideshow') !== 'true'){
							$('#wideSlideshow').data('slideshow','true').cycle({
								fx:     'fade',
								speed:  'slow',
								timeout: 5000,
								pager:  '#slideshowNav',
								slideExpr: 'li'
								});
							}	
						}
						
					app.u.throwMessage = function(msg,persistant){
			//			app.u.dump("BEGIN app.u.throwMessage");
			//			app.u.dump(" -> msg follows: "); app.u.dump(msg);

						var $target, //where the app message will be appended.
						messageClass = "appMessage_"+this.guidGenerator(), //the class added to the container of the message. message 'may' appear in multiple locations, so a class is used instead of an id.
						r = messageClass, //what is returned. set to false if no good error message found. set to htmlID is error found.
						$container = $("<div \/>").addClass('appMessage clearfix').addClass(messageClass),
						$closeButton = $("<button \/>").text('close message').addClass('floatRight').button({icons: {primary: "ui-icon-circle-close"},text: false}),
						$globalDefault = $('#globalMessaging'); //make sure the good-ole fallback destination for errors exists and is a modal.
						
						$closeButton.on('click.closeMsg',function(){$(this).closest('.appMessage').empty().remove()});
						$container.append($closeButton);

						if($globalDefault.length == 0)	{
							$globalDefault = $("<div \/>").attr({'id':'globalMessaging'}).appendTo('body');
							//$globalDefault.dialog({autoOpen:false,modal:true})
							}

						if(typeof msg === 'string')	{
							if($('.appMessaging:visible').length > 0)	{
			//					app.u.dump(" -> target is appMessaging.");
								$target = $('.appMessaging');
								}
							else	{
			//					app.u.dump(" -> target is globalDefault.");
								$target = $globalDefault;
								//$target.dialog('open');
								}
							$container.append(this.formatMessage(msg)).prependTo($target); //always put new messages at the top.
							}
						else if(typeof msg === 'object')	{
							persistant = persistant || msg.persistant; //global persistence (within this context) gets priority.
							if(msg.errtype == 'iseerr' || msg.errtype == 'ISE')	{persistant = true} //ise errs throw extra info at the user. make persistent.
							msg.messageClass = messageClass;
							var selector = undefined; //used if parentID isn't passed in to attempt to find a location for the message
							if(msg._rtag && (msg._rtag.parentID || msg._rtag.targetID || msg._rtag.selector))	{
								app.u.dump(' -> an id (parent, target or selector) was found.');
								if(msg._rtag.parentID)	{selector = app.u.jqSelector('#',msg._rtag.parentID)}
								else if(msg._rtag.targetID)	{selector = app.u.jqSelector('#',msg._rtag.targetID)}
								else	{
									selector = app.u.jqSelector(msg['_rtag'].selector.charAt(0),msg['_rtag'].selector);
									}
								}

							if(msg.parentID){$target = $(app.u.jqSelector('#',msg.parentID));}
							else if(selector && $(selector).length)	{$target = $(selector);}
							else if($('.appMessaging:visible').length > 0)	{$target = $('.appMessaging'); app.u.dump(" -> using .appMessaging");}
							else	{
								app.u.dump(" -> using globalDefault");
								$target = $globalDefault;
								//$target.dialog('open');
								}
							$container.append(this.formatResponseErrors(msg)).prependTo($target);
							}
						else	{
							app.u.dump("WARNING! - unknown type ["+typeof err+"] set on parameter passed into app.u.throwMessage");
							r = false; //don't return an html id.
							}
						if(persistant !== true)	{
			//the message could be removed manually prior to the callback being executed, so don't animate if that's the case. (avoids popping issue)
							setTimeout(function(){
								if($('.'+messageClass).is(':visible'))	{
									$('.'+messageClass).slideUp(2000);
									}
								},10000); //shrink message after a short display period
							}
			//get rid of all the loading gfx in the target so users know the process has stopped.
						$target.removeClass('loadingBG');
						app.u.dump(" -> $.hideLoading: "+typeof jQuery().hideLoading);
						app.u.dump(" -> $target.attr('id'): "+$target.attr('id'));
						if(typeof jQuery().hideLoading == 'function'){$target.hideLoading()} //used in UI. plan on switching everything applicable to this.
			// 			app.u.dump(" -> $target in error handling: "); app.u.dump($target);
						return r;
						}
					}
				else {
					setTimeout(function(){app.ext.cubworld.callbacks.startExtension.onSuccess()},250);
					}
				},
			onError : function() { 
				app.u.dump('BEGIN app.ext.cubworld.callbacks.startExtension.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
		a : {
			showSizeChart : function(){
				$('#size-chart').dialog({'modal':'true', 'width':800, height:550});
				},
			
			showDropDown : function ($tag) {
				//app.u.dump('showing');
				//console.log($tag.data('timeoutNoShow'));
				if(!$tag.data('timeoutNoShow') || $tag.data('timeoutNoShow')=== "false") {
					var $dropdown = $(".dropdown", $tag);
					var height = 0;
					$dropdown.show();
					if($dropdown.data('height')){
						height = $dropdown.data('height');
					} else{
						$dropdown.children().each(function(){
							height += $(this).outerHeight();
						});
					}
					if($tag.data('timeout') && $tag.data('timeout')!== "false"){
						clearTimeout($tag.data('timeout'));
						$tag.data('timeout','false');
						
					}
					$dropdown.stop().animate({"height":height+"px"}, 500);
					return true;
					}
				return false;
				},
				
			showDropDownClick : function($tag){
				//app.u.dump('showClick');
				if(this.showDropDown($tag)){
					$('.dropdown',$tag).unbind('click');
					$('.dropdown',$tag).click(function(event){event.stopPropagation()});
					$tag.attr('onClick','').unbind('click');
					setTimeout(function(){$('body').click(function(){
						app.ext.cubworld.a.hideDropDownClick($tag);
						});}, 500);
					}
				},
				
			hideDropDown : function ($tag) {
				//app.u.dump('hiding');
				$(".dropdown", $tag).stop().animate({"height":"0px"}, 500);
				if($tag.data('timeout') && $tag.data('timeout')!== "false"){
					$tag.data('timeout')
					$tag.data('timeout','false');
				}
				$tag.data('timeout',setTimeout(function(){$(".dropdown", $tag).hide();},500));
				return true;
				},
				
			hideDropDownClick : function($tag){
				//app.u.dump('hideClick');
				if(this.hideDropDown($tag)){
					$tag.click(function(){app.ext.cubworld.a.showDropDownClick($(this));});
					$('body').unbind('click');
					}
				},
				
			hideDropDownOnSelect : function($tag){
				this.hideDropDown($tag);
				$tag.data('timeoutNoShow', setTimeout(function(){$tag.data('timeoutNoShow', 'false');}, 500));
				}
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//renderFormats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		renderFormats : {

			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			} //e [app Events]
		} //r object.
	return r;
	}