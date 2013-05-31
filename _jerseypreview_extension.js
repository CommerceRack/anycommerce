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
			showJerseyPreview : function($container){
				var pid = $container.attr('data-pid');
				var $options = $("#jerseyOptions"+pid);
				var name = $('input[name=B5]', $options).val();
				var number = $('input[name=B6]', $options).val();
				if( name != "" && number != ""){
					$('#jerseyPreviewContainer'+pid).dialog({'title':'Jersey Customizer Preview','height':465,'width':438});
					this.setJerseyText(pid,name,number);
					}
				else {
					app.u.throwMessage("Please select a name and number to preview");
					}
				},
			
			setJerseyText : function(pid, name, number, attempts){
				attempts = attempts || 0;
				app.u.dump(attempts);
				if(attempts < 10){
					try{
						app.ext.jerseypreview.u.thisMovie('jerseyPreview'+pid).goHome(name,number);
						}
					catch(err){
						setTimeout(function(){app.ext.jerseypreview.a.setJerseyText(pid,name,number,attempts+1);},250);
						}
					}
				else {
					app.u.throwMessage("Jesey Previewer currently unavailable, try again later!");				
					}
				}
			
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//renderFormats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		renderFormats : {
			jerseypreview : function($tag, data){
				if(data.value['%attribs'] && data.value['%attribs']['user:prod_flashparams_jersey']){
					var swfStr=	"<object classid='clsid:d27cdb6e-ae6d-11cf-96b8-444553540000' codebase='http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=9,0,0,0' width='400' height='400'"
					swfStr +=	" id='jerseyPreview"+data.value.pid+"' align='middle'>"
					swfStr += 	"<param name='allowScriptAccess' value='always' />"
					swfStr += 	"<param name='allowFullScreen' value='true' />"
					swfStr += 	"<param name='movie' value='https://static---cubworld.app-hosted.com/media/merchant/cubworld/_ticket_468079/jersey_builder-400x400-20110908.swf?imagesrc=https://static---cubworld.app-hosted.com/media/img/cubworld/W400-H400-Bffffff/"
					swfStr +=	data.value['%attribs']['zoovy:prod_image8'];
					swfStr +=	"&font=http://static.zoovy.com/merchant/cubworld/_ticket_468079/"
					swfStr +=	data.value['%attribs']['user:prod_flashparams_jersey'];
					swfStr +=	"'/>"
					swfStr += 	"<param name='quality' value='high' />"
					swfStr += 	"<param name='bgcolor' value='#FFFFFF' />"
					swfStr +=	"<embed src='https://static---cubworld.app-hosted.com/media/merchant/cubworld/_ticket_468079/jersey_builder-400x400-20110908.swf?imagesrc=http://static.zoovy.com/img/cubworld/W400-H400-Bffffff/"
					swfStr +=	data.value['%attribs']['zoovy:prod_image8'];
					swfStr +=	"&font=https://static---cubworld.app-hosted.com/media/merchant/cubworld/_ticket_468079/"
					swfStr +=	data.value['%attribs']['user:prod_flashparams_jersey'];
					swfStr +=	"' quality='high' bgcolor='#FFFFFF' width='400' allowFullScreen='true' height='400' name='jerseyPreview"+data.value.pid+"' align='middle' allowScriptAccess='always' type='application/x-shockwave-flash' pluginspage='http://www.macromedia.com/go/getflashplayer' />"
					swfStr += 	"</object>"
					
					$tag.html(swfStr);
					$tag.attr('id','jerseyPreviewContainer'+data.value.pid);
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
			thisMovie : function(movieName) {
				if (navigator.appName.indexOf("Microsoft") != -1) {
					return window[movieName];
					}
				else {
					return document[movieName];
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