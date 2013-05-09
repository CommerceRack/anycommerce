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
					if($('#mainContentArea > div:visible').length > 0){
						app.u.dump($('#mainContentArea div:visible').attr('id'));
						if(!$('#mainContentArea div:visible').data('columncontent')){
							app.ext.cubworld.u.hideColumnContent();
						} else {
							app.ext.cubworld.u.showColumnContent($('#mainContentArea div:visible').data('columncontent'));
						}
					} else {
						
						//app.u.dump("WARNING: not finding a single visible area in mainContentArea to populate column content.  Showing hotItemList by default.")
						//app.ext.cubworld.u.showColumnContent('hotItemList');
					}
					
//Dispatches a call to get the productList for the hotItems List
					app.ext.store_navcats.calls.appNavcatDetail.init('$hot_items', {'list':'$hot_items','callback':'populateHotItemsList','extension':'cubworld', 'parentID':'hotItemList'});
					app.model.dispatchThis();
					
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
			handleRMAForm : function(){
				var errors = [];
				var obj = {};
				var $form = $('#rma-form form');
				obj.sender = $('#RMAFormEmail',$form).val();
				obj.subject = "RMA Form Submission";
				
				obj.body = "";
				
				obj.body += "Customer: "+$('#RMAFormSender',$form).val() +"\n";
				obj.body += "Order: "+$('#RMAFormOID',$form).val() +"\n";
				obj.body += "Phone: "+$('#RMAFormPhone',$form).val() +"\n";
				obj.body += "Email: "+$('#RMAFormEmail',$form).val() +"\n";
				obj.body += "\n";
				
				obj.body += "Questions/Comments:\n";
				obj.body += $('#RMAFormBody',$form).val()
				obj.body += "\n";
				obj.body += "\n";
				
				obj.body += "Permission to refund/charge card: "+$('input[name=cc_charge_confirm]:checked', $form).val()+"\n";
				obj.body += "\n";
				 var i=1;
				$('#rmaItems .rmaItem', $form).each(function(){
					var $rmaItem = $(this);
					if(typeof $('input[name=returnid_'+i+']',$rmaItem).val() !== "" &&
						typeof $('input[name=retex_'+i+']:checked',$rmaItem).val() !== "" &&
						($('input[name=retex_'+i+']:checked',$rmaItem).val()==="refund"||
							($('input[name=retex_'+i+']:checked',$rmaItem).val()==="exchange" && 
								typeof $('input[name=exchangeid_'+i+']',$rmaItem).val() !== ""))){
						obj.body += "SKU: "+$('input[name=returnid_'+i+']',$rmaItem).val()+"\n";
						obj.body += "Item for "+$('input[name=retex_'+i+']:checked', $rmaItem).val()+"\n";
						if($('input[name=retex_'+i+']:checked',$rmaItem).val()==="exchange"){
							obj.body += "Exchange for: "+$('input[name=exchangeid_'+i+']',$rmaItem).val()+"\n";
							}
						obj.body += "\n";
						}
					else {
						app.u.dump("ERROR"+i);
						errors.push("Item number "+i+" contained errors");
						}
					i++;
					});
				
				app.u.dump(obj);
				app.u.dump(errors);
				if(errors.length == 0){
					//app.ext.store_crm.calls.appSendMessage.init(obj, {});
					}
				else {
					var message = "";
					for(var e in errors){
						message += "<li>"+e+"/<li>";
					}
					$('#RMAFormMessaging', $form).anyMessage({'message' : message});
					}
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
				},
				
			sendInquiry : function($form){
				var formJSON = $form.seralizeJSON();
				obj = {
					'sender' : formJSON.email,
					'subject' : 'Player Inquiry Form Submission',
					'body' : 'Player: '+formJSON.playername+"\n"
							+'Team: '+formJSON.team+"\n"
							+'Message:\n'+formJSON.body
					};
					
				app.ext.store_crm.calls.appSendMessage(obj,{});
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
			}, //e [app Events]
		vars : {
			catTemplates : {
				'.aa.arizona_diamondbacks_tickets' : 'categoryTemplateHTML',
				'.aa.atlanta_braves_tickets' : 'categoryTemplateHTML',
				'.aa.baltimore_orioles_tickets' : 'categoryTemplateHTML',
				'.aa.bears__bulls___blackhawks_tickets.chicago_bears_tickets' : 'categoryTemplateHTML',
				'.aa.bears__bulls___blackhawks_tickets.chicago_blackhawks_tickets' : 'categoryTemplateHTML',
				'.aa.bears__bulls___blackhawks_tickets.chicago_bulls_tickets' : 'categoryTemplateHTML',
				'.aa.boston_red_sox_tickets' : 'categoryTemplateHTML',
				'.aa.chicago_cubs_tickets' : 'categoryTemplateHTML',
				'.aa.chicago_white_sox' : 'categoryTemplateHTML',
				'.aa.cincinnati_reds_tickets' : 'categoryTemplateHTML',
				'.aa.cleveland_indians' : 'categoryTemplateHTML',
				'.aa.colorado_rockies_tickets' : 'categoryTemplateHTML',
				'.aa.detroit_tigers_tickets' : 'categoryTemplateHTML',
				'.aa.florida_marlins_tickets' : 'categoryTemplateHTML',
				'.aa.houston_astros_tickets' : 'categoryTemplateHTML',
				'.aa.kansas_city_royals_tickets' : 'categoryTemplateHTML',
				'.aa.los_angeles_angels_of_anaheim_tickets' : 'categoryTemplateHTML',
				'.aa.los_angeles_dodgers_tickets' : 'categoryTemplateHTML',
				'.aa.milwaukee_brewers_tickets' : 'categoryTemplateHTML',
				'.aa.minnesota_twins_tickets' : 'categoryTemplateHTML',
				'.aa.new_york_mets_tickets' : 'categoryTemplateHTML',
				'.aa.new_york_yankees_tickets' : 'categoryTemplateHTML',
				'.aa.oakland_athletics_tickets' : 'categoryTemplateHTML',
				'.aa.philadelphia_phillies_tickets' : 'categoryTemplateHTML',
				'.aa.pittsburgh_pirates_tickets' : 'categoryTemplateHTML',
				'.aa.san_diego_padres_tickets' : 'categoryTemplateHTML',
				'.aa.san_francsico_giants_tickets' : 'categoryTemplateHTML',
				'.aa.seattle_mariners_tickets' : 'categoryTemplateHTML',
				'.aa.st_louis_cardinals_tickets' : 'categoryTemplateHTML',
				'.aa.tampa_bay_devil_rays_tickets' : 'categoryTemplateHTML',
				'.aa.texas_rangers_tickets' : 'categoryTemplateHTML',
				'.aa.toronto_blue_jays_tickets' : 'categoryTemplateHTML',
				'.aa.washington_nationals_tickets' : 'categoryTemplateHTML',
				'.buysafe' : 'categoryTemplateHTML',
				'.careers' : 'categoryTemplateHTML',
				'.careers.thank_you' : 'categoryTemplateHTML',
				'.chicago-sports-team-apparel.chicago-bears-apparel.tickets' : 'categoryTemplateHTML',
				'.chicago_cubs_trivia_and_quiz' : 'categoryTemplateHTML',
				'.chicago_cubs_trivia_answers' : 'categoryTemplateHTML',
				'.cubs_season_predictions_2011_____in_haiku' : 'categoryTemplateHTML',
				'.help_desk.shipping-schedule' : 'categoryTemplateHTML',
				'.holiday_shipping' : 'categoryTemplateHTML',
				'.holiday_shipping.schedule' : 'categoryTemplateHTML',
				'.in_the_news' : 'categoryTemplateHTML',
				'.in_the_news.big_z_autograph_signing_in_wrigleyville' : 'categoryTemplateHTML',
				'.in_the_news.cubworld_expansion_press_release' : 'categoryTemplateHTML',
				'.in_the_news.cubworld_shows_northwestern_support_at_wrigley_field' : 'categoryTemplateHTML',
				'.in_the_news.cubworld_webcam' : 'categoryTemplateHTML',
				'.in_the_news.cubworldcom_puts_the_eye_on_wrigleyville_with_new_bar_web_cam' : 'categoryTemplateHTML',
				'.in_the_news.cubworldcom_unveils_new_rewards_program' : 'categoryTemplateHTML',
				'.in_the_news.facebook' : 'categoryTemplateHTML',
				'.in_the_news.jersey_sale' : 'categoryTemplateHTML',
				'.in_the_news.mporia' : 'categoryTemplateHTML',
				'.in_the_news.personalized_cubs_jerseys_the_ultimate_gift_for_baseball_fans' : 'categoryTemplateHTML',
				'.in_the_news.sports_world___s_online_store_cubworldcom_changes_name' : 'categoryTemplateHTML',
				'.in_the_news.sports_world_announces_online_custom_apparel_shop' : 'categoryTemplateHTML',
				'.in_the_news.sports_world_chicago_earns_status_as_google_official_store' : 'categoryTemplateHTML',
				'.in_the_news.wrigleyville_retailer_sports_world_chicago_enhances_online_experience' : 'categoryTemplateHTML',
				'.links' : 'categoryTemplateHTML',
				'.mlb.arizona_diamondbacks.arizona_diamondbacks_tickets' : 'categoryTemplateHTML',
				'.mlb.atlanta_braves.atlanta_braves_tickets' : 'categoryTemplateHTML',
				'.mlb.baltimore_orioles.baltimore_orioles_tickets' : 'categoryTemplateHTML',
				'.mlb.boston_red_sox.boston_red_sox_tickets' : 'categoryTemplateHTML',
				'.mlb.chicago_white_sox.chicago_white_sox_tickets' : 'categoryTemplateHTML',
				'.mlb.cincinnati_reds.cincinnati_reds_tickets' : 'categoryTemplateHTML',
				'.mlb.cleveland_indians.cleveland_indians_tickets' : 'categoryTemplateHTML',
				'.mlb.colorado_rockies.colorado_rockies_tickets' : 'categoryTemplateHTML',
				'.mlb.detroit_tigers.detroit_tigers_tickets' : 'categoryTemplateHTML',
				'.mlb.houston_astros.houston_astros_tickets' : 'categoryTemplateHTML',
				'.mlb.kansas_city_royals.kansas_city_royals_tickets' : 'categoryTemplateHTML',
				'.mlb.los_angeles_angels.los_angeles_angels_of_anaheim_tickets' : 'categoryTemplateHTML',
				'.mlb.los_angeles_dodgers.los_angeles_dodgers_tickets' : 'categoryTemplateHTML',
				'.mlb.milwaukee_brewers.milwaukee_brewers_tickets' : 'categoryTemplateHTML',
				'.mlb.minnesota_twins.minnesota_twins_tickets' : 'categoryTemplateHTML',
				'.mlb.new_york_mets.new_york_mets_tickets' : 'categoryTemplateHTML',
				'.mlb.new_york_yankees.new_york_yankees_tickets' : 'categoryTemplateHTML',
				'.mlb.oakland_athletics.oakland_athletics_tickets' : 'categoryTemplateHTML',
				'.mlb.philadelphia_phillies.philadelphia_phillies_tickets' : 'categoryTemplateHTML',
				'.mlb.pittsburgh_pirates.pittsburgh_pirates_tickets' : 'categoryTemplateHTML',
				'.mlb.san_diego_padres.san_diego_padres_tickets' : 'categoryTemplateHTML',
				'.mlb.san_francisco_giants.san_francsico_giants_tickets' : 'categoryTemplateHTML',
				'.mlb.seattle_mariners.seattle_mariners_tickets' : 'categoryTemplateHTML',
				'.mlb.st_louis_cardinals.st_louis_cardinals_tickets' : 'categoryTemplateHTML',
				'.mlb.tampa_bay_rays.tampa_bay_devil_rays_tickets' : 'categoryTemplateHTML',
				'.mlb.texas_rangers.texas_rangers_tickets' : 'categoryTemplateHTML',
				'.mlb.toronto_blue_jays.toronto_blue_jays_tickets' : 'categoryTemplateHTML',
				'.mlb.washington_nationals.washington_nationals_tickets' : 'categoryTemplateHTML',
				'.new-arrivals.z_custom_design_studio' : 'categoryTemplateHTML',
				'.size_chart' : 'categoryTemplateHTML',
				'.sports_apparel_blog' : 'categoryTemplateHTML',
				'.zzzzz_extra_innings.cubs_season_predictions_2011_-_in_haiku_' : 'categoryTemplateHTML',
				'.zzzzz_extra_innings.in-store_discounts' : 'categoryTemplateHTML',
				
				'.help_desk.nfl-phone-order' : 'categoryTemplateInquiry',
				'.help_desk.player-inquiry' : 'categoryTemplateInquiry',

				
				}
			}
		} //r object.
		
	return r;
	}