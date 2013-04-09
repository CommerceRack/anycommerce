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

(function($){
 
    $.fn.shuffle = function() {
 
        var allElems = this.get(),
            getRandom = function(max) {
                return Math.floor(Math.random() * max);
            },
            shuffled = $.map(allElems, function(){
                var random = getRandom(allElems.length),
                    randEl = $(allElems[random]).clone(true)[0];
                allElems.splice(random, 1);
                return randEl;
           });
 
        this.each(function(i){
            $(this).replaceWith($(shuffled[i]));
        });
 
        return $(shuffled);
 
    };
 
})(jQuery);

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
				//app.u.dump(typeof jQuery.fn.cycle);
				if(app.ext.myRIA && app.ext.myRIA.template && typeof jQuery.fn.cycle === 'function'){
					app.ext.myRIA.template.homepageTemplate.onCompletes.push(function(P) {
						var $context = $(app.u.jqSelector('#',P.parentID));
						
						app.ext.cubworld.u.showHomepageSlideshow();
						
						$('.randomList', $context).each(function(){
							app.ext.cubworld.u.randomizeList($(this));
						});
						});
					if($("#appView #homepageTemplate_").length > 0){
						app.ext.cubworld.u.showHomepageSlideshow();
						}
						
					for(var template in app.ext.myRIA.template){
						if(template !== 'cartTemplate'){
							app.ext.myRIA.template[template].onCompletes.push(function(P){
								var $context = $(app.u.jqSelector('#',P.parentID));
								if(!$context.data('columncontent')){
									app.ext.cubworld.u.hideColumnContent();
								} else {
									app.ext.cubworld.u.showColumnContent($context.data('columncontent'));
								}
							});
						}
					}
					$('#variableColumn > div').hide();
					if($('#mainContentArea > div:visible').length === 1){
						app.u.dump($('#mainContentArea div:visible').attr('id'));
						if(!$('#mainContentArea div:visible').data('columncontent')){
							app.ext.cubworld.u.hideColumnContent();
						} else {
							app.ext.cubworld.u.showColumnContent($('#mainContentArea div:visible').data('columncontent'));
						}
					} else {
						app.u.dump("WARNING: not finding a single visible area in mainContentArea to populate column content.  Showing hotItemList by default.")
						app.ext.cubworld.u.showColumnContent('hotItemList');
					}
					
//Dispatches a call to get the productList for the hotItems List
					app.ext.store_navcats.calls.appNavcatDetail.init('$hot_items', {'list':'$hot_items','callback':'populateHotItemsList','extension':'cubworld', 'parentID':'hotItemList'});
					app.model.dispatchThis();
					
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
			},
			
		populateHotItemsList : {
			onSuccess : function(tagObj){
				app.u.dump('BEGIN app.ext.cubworld.callbacks.populateHotItemsList.onSuccess');
				app.u.dump(tagObj);
				var tmp = {};
				tmp[tagObj.list] = app.data['appNavcatDetail|'+tagObj.list];
				
				app.renderFunctions.translateTemplate(tmp,tagObj.parentID);
				setTimeout(function(){
					app.ext.cubworld.u.startHotItemSlideshow()
					}, 250);
				},
			onError : function(){
				app.u.dump('BEGIN app.ext.cubworld.callbacks.populateHotItemsList.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
		a : {
			showSizeChart : function(){
				$('#size-chart').dialog({'modal':'true', 'title':'Sizing Chart','width':800, height:550});
				},
			showRMAForm : function(){
				$('#rma-form').dialog({'modal':'true', 'title':'RMA Form','width':800, height:550});
				},
			addRMAItem : function(){
				var index = $("#rmaItems .rmaItem").length + 1;
				var $rmaItem = $('<div class="rmaItem"></div>');
				$rmaItem.append($('<label class="col1">'+index+'</label>'));
				$rmaItem.append($('<input class="col2" type="text" value="" name="returnid_'+index+'" id="returnid_'+index+'" />'));
				$rmaItem.append($('<input class="col3" type="radio" name="retex_'+index+'" id="retex_'+index+'" value="refund" />'));
				$rmaItem.append($('<input class="col4" type="radio" name="retex_'+index+'" id="retex_'+index+'" value="exchange" />'));
				$rmaItem.append($('<input class="col5" type="text" name="exchangeid_'+index+'" id="exchangeid_'+index+'" value="" />'));
				$rmaItem.append($('<button onClick="app.ext.cubworld.a.removeRMAItem($(this).parent()); return false;" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only"><span class="ui-button-icon-primary ui-icon ui-icon-closethick"></span></button>'));
				$('#rmaItems').append($rmaItem);
				},
			removeRMAItem : function($rmaItem){
				$rmaItem.remove();
				var index = 1;
				$("#rmaItems .rmaItem").each(function(){
					var $this = $(this);
					$('.col1',$this).text(index);
					$('.col2',$this).attr('name','returnid_'+index);
					$('.col2',$this).attr('id','returnid_'+index);
					$('.col3',$this).attr('name','retex_'+index);
					$('.col3',$this).attr('id','retex_'+index);
					$('.col4',$this).attr('name','retex_'+index);
					$('.col4',$this).attr('id','retex_'+index);
					$('.col5',$this).attr('name','exchangeid_'+index);
					$('.col5',$this).attr('id','exchangeid_'+index);
					index++;
					});
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
			showReviewLink : function($tag, data){
				if(data.value && data.value > 0){
					$tag.hide();
					}
				}
			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
			
			showHomepageSlideshow : function(){
				if($('#wideSlideshow').data('slideshow') !== 'true'){
					$('#wideSlideshow').data('slideshow','true').cycle({
						fx:     'fade',
						speed:  'slow',
						timeout: 5000,
						pager:  '#slideshowNav',
						slideExpr: 'li'
						});
					}
				},
			startHotItemSlideshow : function(){
				if($('#hotItemSpotlightContainer ul').children().length > 0){
					var $itemList = $('#hotItemSpotlightContainer ul')
					app.ext.cubworld.u.randomizeList($itemList);
					$itemList.cycle({
						fx:     'fade',
						speed:  'slow',
						timeout: 5500,
						pause : 1
						});
					}
				else {
					setTimeout(function(){
						app.ext.cubworld.u.startHotItemSlideshow()
						}, 250);
					}
				},
			hideColumnContent : function(){
				if(!$('.thinColumn').hasClass('hiddenColumn')){
					$('.thinColumn').animate({'width':'0'}, 500).addClass('hiddenColumn');
					setTimeout(function(){$('.thinColumn').hide();}, 500);
					$('.wideColumn').animate({'width':'1007'},550);
					}
				},
			showColumnContent : function(content){
				app.u.dump('Showing column content: '+content);
				if($('.thinColumn').hasClass('hiddenColumn')){
					$('.wideColumn').animate({'width':'789'},550);
					$('.thinColumn').show().animate({'width':'215'}, 550).removeClass('hiddenColumn');
					}
				var $colContainer = $('#variableColumn');
				var $prevCol = $('.activeColumn', $colContainer);
				if($prevCol.attr('id') !== content){
					var $nextCol = $('#'+content, $colContainer);
					
					$colContainer.animate({'height':$nextCol.outerHeight()}, 500);
					if($prevCol.length > 0){
						$prevCol.fadeOut(500).removeClass('activeColumn');
					}
					setTimeout(function(){
						if(typeof app.ext.cubworld.u.columnCompletes[$nextCol.attr('id')] === 'function'){
							app.ext.cubworld.u.columnCompletes[$nextCol.attr('id')]();
							}
						$nextCol.fadeIn(500).addClass('activeColumn');
						}, 500);
					}
				},
			columnCompletes : {
				hotItemList : function(){
					app.ext.cubworld.u.randomizeList($("#hotItemList .hotLineItemList"));
					}
				},
			randomizeList : function($list){
				var $tmp = $list.children().shuffle();
				$list.empty().append($tmp)
				}
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