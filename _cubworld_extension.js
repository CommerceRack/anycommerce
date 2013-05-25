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
 
	$.fn.shuffle = function () {
        var j;
        for (var i = 0; i < this.length; i++) {
            j = Math.floor(Math.random() * this.length);
            $(this[i]).before($(this[j]));
        }
        return this;
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
				
				app.rq.push(['templateFunction','categoryTemplateGroupSales','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#', P.parentID));
					$('.slideshow', $context).each(function(){
						if(!$(this).hasClass('slideshowRunning')){
							$(this).addClass('slideshowRunning').cycle({
								fx:     'fade',
								timeout: 3000,
								});
							}
						
						})
					
					}]);
				app.rq.push(['templateFunction','categoryTemplateFeaturedPlayer','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#', P.parentID));
					var $jerseyList = $('.jerseyList', $context);
					var $shirtList = $('.shirtList', $context);
					
					var jerseyObj = app.ext.store_search.u.buildElasticRaw({
						'query' : {
							'query_string' : {
								'query' : playername+ " jersey",
								'fields' : ['prod_name']
								}
							}
						});
					jerseyObj.size = 15;
					var jersey_tag = {
						'datapointer' : 'featuredPlayerSearch|jersey|'+playername,
						'callback' : function(rd){
							$jerseyList.anycontent({'templateID':'featuredPlayerListTemplate', 'datapointer':rd.datapointer})
							}
						};
					
					var playername = $jerseyList.parent().attr('data-playername');
					
					var shirtObj = app.ext.store_search.u.buildElasticRaw({
						'query' : {
							'query_string' : {
								'query' : playername+ " shirt",
								'fields' : ['prod_name']
								}
							}
						});
					shirtObj.size = 15;
					var shirt_tag = {
						'datapointer' : 'featuredPlayerSearch|shirt|'+playername,
						'callback' : function(rd){
							$shirtList.anycontent({'templateID':'featuredPlayerListTemplate', 'datapointer':rd.datapointer})
							}
						};
					
					app.ext.store_search.calls.appPublicSearch.init(shirtObj, shirt_tag, 'mutable');
					app.ext.store_search.calls.appPublicSearch.init(jerseyObj, jersey_tag, 'mutable');
					app.model.dispatchThis('mutable');
					
					}]);
				app.rq.push(['templateFunction','categoryTemplateSitemap','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#', P.parentID));
					var _tag={
						'callback' : function(responseData){
							app.u.dump(app.data[responseData.datapointer])
							$context.anycontent({'templateID':'categoryTemplateSitemapList','datapointer':responseData.datapointer});
							}
						};
					
					app.ext.store_navcats.calls.appCategoryDetailMax.init('.', _tag, 'mutable');
					app.model.dispatchThis('mutable');
					}]);
				app.rq.push(['templateFunction', 'homepageTemplate','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));
					
					app.ext.cubworld.u.showHomepageSlideshow();
					
					$('.randomList', $context).each(function(){
						app.ext.cubworld.u.randomizeList($(this));
						});
					}]);
					
				
				var funcTemplates = [
					'categoryTemplate',
					'categoryTemplateCuties',
					'categoryTemplateHTML',
					'categoryTemplateInquiry',
					'categoryTemplateAffiliates',
					'categoryTemplateGroupSales',
					'categoryTemplateFeaturedPlayer',
					'categoryTemplateSitemap',
					'categoryTemplateRewards',
					'categoryTemplateTickets',
					'categoryTemplateSWConnect',
					'categoryTemplateEarthCam',
					'productTemplate',
					'companyTemplate',
					'customerTemplate',
					'homepageTemplate',
					'searchTemplate',
					'checkoutTemplate',
					'pageNotFoundTemplate'
					]
				for(var t in funcTemplates){
					app.rq.push(['templateFunction', funcTemplates[t],'onCompletes',function(P){
						var $context = $(app.u.jqSelector('#',P.parentID));
						if(!$context.data('columncontent')){
							app.ext.cubworld.u.hideColumnContent();
							}
						else {
							app.ext.cubworld.u.showColumnContent($context.data('columncontent'));
							}
						}]);
					}
				$('#variableColumn > div').hide();
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
				if(app.ext.store_navcats){
//Dispatches a call to get the productList for the hotItems List
					app.ext.store_navcats.calls.appNavcatDetail.init('$hot_items', {'callback':'populateHotItemsList','extension':'cubworld', 'parentID':'hotItemList'});
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
				
				//app.data[tagObj.datapointer]['@products'] = app.data[tagObj.datapointer]['@products'].slice(0,10);
				
				//var tmp = {};
				//tmp[tagObj.list] = app.data['appNavcatDetail|'+tagObj.list];
				var startTime = (new Date()).getTime();
				var endTime = (new Date()).getTime();
				app.u.dump(endTime-startTime);
				//app.renderFunctions.translateTemplate(tmp,tagObj.parentID);
				setTimeout(function(){
					$("#"+tagObj.parentID).anycontent({'datapointer':tagObj.datapointer});
					app.ext.cubworld.u.startHotItemSlideshow();
					}, 1000);
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
					var _tag = {
						callback : function(){
							$('#rma-form').dialog('close');
							app.u.throwMessage(app.u.successMsgObject("Thank you, your request has been submitted. Please enclose your printed RMA-form with your package!"));
							//app.u.printByjqObj($form);
							}
						};
					app.calls.appSendMessage.init(obj, _tag, 'mutable');
					app.model.dispatchThis('mutable');
					}
				else {
					var message = $("<ul></ul>");
					for(var e in errors){
						message.append($("<li>"+e+"/<li>"));
					}
					$('#RMAFormMessaging', $form).anymessage({'message' : message.html()});
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
				
				var formJSON = $form.serializeJSON();
				
				obj = {
					'sender' : formJSON.sender,
					'subject' : 'Player Inquiry Form Submission',
					'body' : 'Player: '+formJSON.playername+"\n"
							+'Team: '+formJSON.team+"\n"
							+'Message:\n'+formJSON.body
					};
				app.calls.appSendMessage.init(obj,{}, 'mutable');
				app.model.dispatchThis('mutable');
				},
			sendGroupRequest : function($form){
				var formJSON = $form.serializeJSON();
				
				obj = {
					'sender' : formJSON.sender,
					'subject' : formJSON.subject,
					'body' : 'Name: '+formJSON.fullname+"\n"
							+'Event Date: '+formJSON.eventdate+"\n"
							+'Message:\n'+formJSON.body
					};
				app.calls.appSendMessage.init(obj,{}, 'mutable');
				app.model.dispatchThis('mutable');
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
				$list.children().shuffle();
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
				'.mlb.arizona_diamondbacks.z_adam_eaton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_aj_pollock' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_barry_enright' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_brad_snyder' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_brad_ziegler' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_brandon_mccarthy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_chris_johnson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_chris_young' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_cliff_pennington' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_cody_ransom' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_cole_gillespie' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_craig_breslow' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_daniel_hudson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_daniel_stange' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_david_hernandez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_eric_chavez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_esmerling_vasquez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_geoff_blum' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_gerardo_parra' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_heath_bell' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_henry_blanco' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_ian_kennedy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_j.j._putz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_jason_kubel' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_jason_marquis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_jj_putz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_joe_paterson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_joe_saunders' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_john_hester' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_john_mcdonald' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_josh_collmenter' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_juan_gutierrez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_juan_miranda' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_justin_upton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_kam_mickolio' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_kevin_mulvey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_kirk_gibson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_lyle_overbay' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_mark_teahen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_matt_lindstrom' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_matt_reynolds' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_matt_williams' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_micah_owings' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_miguel_montero' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_patrick_corbin' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_paul_goldschmidt' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_ryan_roberts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_sam_demel' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_sean_burroughs' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_stephen_drew' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_takashi_saito' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_tony_sipp' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_trevor_cahill' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_tyler_skaggs' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_wade_miley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_willie_bloomquist' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_xavier_nady' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_zach_kroenke' : 'categoryTemplateFeaturedPlayer',
				'.mlb.arizona_diamondbacks.z_zack_duke' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_alex_gonzalez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_andrelton_simmons' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_anthony_varvaro' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_antoan_richardson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_bj_upton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_brandon_beachy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_brian_mccann' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_chipper_jones' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_chris_johnson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_christian_bethancourt' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_cory_gearrin' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_craig_kimbrel' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_cristhian_martinez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_dan_uggla' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_david_carpenter' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_david_hale' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_david_ross' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_derek_lowe' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_diory_hernandez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_eric_hinske' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_eric_oflaherty' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_ernesto_mejia' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_freddie_freeman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_fredi_gonzalez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_gerald_laird' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_jack_wilson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_jair_jurrjens' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_jairo_asencio' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_jason_heyward' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_jonny_venters' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_jordan_schafer' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_jordan_walden' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_jose_constanza' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_juan_francisco' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_julio_teheran' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_justin_upton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_kenshin_kawakami' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_kris_medlen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_luis_avilan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_martin_prado' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_matt_diaz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_matt_young' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_michael_bourn' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_mike_minor' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_nate_mclouth' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_paul_janish' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_paul_maholm' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_peter_moylan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_ramiro_pena' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_reed_johnson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_scott_linebrink' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_scott_proctor' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_tim_hudson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_tommy_hanson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_tyler_pastornicky' : 'categoryTemplateFeaturedPlayer',
				'.mlb.atlanta_braves.z_wes_helms' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_adam_jones' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_alfredo_simon' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_armando_gabino' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_armando_galarraga' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_brad_bergesen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_brandon_snyder' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_brian_matusz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_brian_roberts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_buck_showalter' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_chris_davis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_chris_tillman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_craig_tatum' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_david_riske' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_felix_pie' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_j.j._hardy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_jake_arrieta' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_jake_fox' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_jason_berken' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_jeremy_accardo' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_jeremy_guthrie' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_jim_johnson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_jim_thome' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_jj_hardy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_joe_saunders' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_jojo_reyes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_josh_rupe' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_justin_duchscherer' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_kevin_gregg' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_kyle_hudson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_luke_scott' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_mark_hendrickson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_mark_reynolds' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_matt_angle' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_matt_wieters' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_mike_gonzalez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_nick_markakis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_nolan_reimold' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_pedro_florimon' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_pedro_viola' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_rick_vandenhurk' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_robert_andino' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_tommy_hunter' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_troy_patton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_vladimir_guerrero' : 'categoryTemplateFeaturedPlayer',
				'.mlb.baltimore_orioles.z_zach_britton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_aaron_cook' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_alfredo_aceves' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_andrew_bailey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_andrew_miller' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_bobby_jenks' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_bobby_valentine' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_carl_crawford' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_clay_buchholz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_cody_ross' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_conor_jackson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_daisuke_matsuzaka' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_dan_wheeler' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_daniel_bard' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_darnell_mcdonald' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_david_ortiz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_dennys_reyes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_drew_sutton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_dustin_pedroia' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_felix_doubront' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_franklin_morales' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_graham_godfrey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_hideki_okajima' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_j.d._drew' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_jacoby_ellsbury' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_james_loney' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_jarrod_saltalamacchia' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_jason_repko' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_jason_varitek' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_jd_drew' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_john_lackey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_jon_lester' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_jose_iglesias' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_josh_beckett' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_junichi_tazawa' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_kelly_shoppach' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_kevin_youkilis_' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_matt_albers' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_matt_fox' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_michael_bowden' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_mike_aviles' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_nick_punto' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_rich_hill' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_ryan_lavarnway' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_ryan_sweeney' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_scott_atchison' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_shane_victorino' : 'categoryTemplateFeaturedPlayer',
				'.mlb.boston_red_sox.z_vincente_padilla' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.adrian_cardenas_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.alex_hinshaw_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.alfonso_soriano_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.andre_dawson_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.anthony_rizzo_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.blake_parker_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.brett_jackson_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.bryan_lahair_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.carlos_marmol_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.carlos_villanueva' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.casey_coleman_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.chris_volstad_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.dale_sveum_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.darwin_barney_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.david_dejesus_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.edwin_jackson_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.ernie_banks_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.ian_stewart_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.james_russell_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.jeff_samardzija_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.joe_mather_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.josh_vitters_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.kerry_wood_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.kyuji_fujikawa' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.lendy_castillo_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.luis_valbuena_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.manuel_corpas_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.marcos_mateo_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.matt_garza_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.michael_bowden_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.nate_schierholtz_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.randy_wells_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.robert_coello_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.ron_santo_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.ryne_sandberg_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.scott_maine_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.shawn_camp_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.starlin_castro_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.steve_clevenger_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.test_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.theo_epstein_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.tony_campana_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.travis_wood_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_cubs.wellington_castillo_jerseys_shirts' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_a.j._pierzynski' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_adam_dunn' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_addison_reed' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_aj_pierzynski' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_alejandro_deaza' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_alex_rios' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_alexei_ramirez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_brent_morel' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_brett_myers' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_chris_sale' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_conor_jackson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_dayan_viciedo' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_dewayne_wise' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_donnie_veal' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_donny_lucy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_erick_threets' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_francisco_liriano' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_gavin_floyd' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_gordon_beckham' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_gregory_infante' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_hector_santiago' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_jake_peavy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_jessie_crain' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_john_danks' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_jordan_danks' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_jose_lopez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_jose_quintana' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_kevin_youkilis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_kosuke_fukudome' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_lastings_milledge' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_matt_thornton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_nate_jones' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_orlando_hudson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_paul_konerko' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_philip_humber' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_ramon_castro' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_randy_williams' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_robin_ventura' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_tony_pena' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_tyler_flowers' : 'categoryTemplateFeaturedPlayer',
				'.mlb.chicago_white_sox.z_will_ohman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_aroldis_chapman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_bill_bray' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_brandon_phillips' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_bronson_arroyo' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_carlos_fisher' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_chad_reineke' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_chris_heisey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_chris_valaika' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_corky_miller' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_dioner_navarro' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_drew_stubbs' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_dusty_baker' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_edgar_renteria' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_edinson_volquez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_francisco_cordero' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_homer_bailey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_jay_bruce' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_joey_votto' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_johnny_cueto' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_jordan_smith' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_jose_arredondo' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_juan_francisco' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_logan_ondrusek' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_mat_latos' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_matt_maloney' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_miguel_cairo' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_mike_leake' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_nick_masset' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_paul_janish' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_ryan_hanigan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_ryan_ludwick' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_ryan_madson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_sam_lecure' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_scott_rolen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_sean_marshall' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_todd_frazier' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_willie_harris' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_wilson_valdez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cincinnati_reds.z_zack_cozart' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_asdrubal_cabrera' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_carlos_carrasco' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_carlos_santana' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_casey_kotchman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_chris_perez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_corey_kluber' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_derek_lowe' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_drew_stubbs' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_frank_herrmann' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_grady_sizemore' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_jack_hannahan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_jason_donald' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_jason_kipnis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_jeanmar_gomez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_joe_smith' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_johnny_damon' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_josh_tomlin' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_justin_masterson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_kevin_slowey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_lonnie_chisenhall' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_lou_marson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_manny_acta' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_mark_reynolds' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_matt_carson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_matt_laporta' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_michael_brantley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_mike_aviles' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_mitch_talbot' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_nick_swisher' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_rafael_perez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_ryan_spilborghs' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_shelley_duncan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_shin-soo_choo' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_terry_francona' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_tony_sipp' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_travis_hafner' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_ubaldo_jimenez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_vinnie_pestano' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_yan_gomes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.z_zach_mcallister' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.zz_ricky_vaughn' : 'categoryTemplateFeaturedPlayer',
				'.mlb.cleveland_indians.zz_willie__mays__hayes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_adam_ottavino' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_alex_white' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_andrew_brown' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_carlos_gonzalez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_casey_blake' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_charlie_blackmon' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_chris_nelson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_christian_friedrich' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_dexter_fowler' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_dj_lemahieu' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_drew_pomeranz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_eric_young' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_esmil_rogers' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_j.c._romero' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_jason_giambi' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_jeremy_guthrie' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_jhoulys_chacin' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_jim_tracy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_jonathan_herrera' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_jonathan_sanchez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_jordan_pacheco' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_jorge_de_la_rosa' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_jorge_delarosa' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_josh_roenicke' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_josh_rutledge' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_juan_nicasio' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_kevin_millwood' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_manny_corpas' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_marco_scutaro' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_matt_belisle' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_matt_mcbride' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_matt_reynolds' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_michael_cuddyer' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_paul_phillips' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_rafael_betancourt' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_ramon_hernandez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_rex_brothers' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_todd_helton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_troy_tulowitzki' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_tyler_chatwood' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_tyler_colvin' : 'categoryTemplateFeaturedPlayer',
				'.mlb.colorado_rockies.z_wilin_rosario' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_al_alburquerque' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_alex_avila' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_andy_dirks' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_anibal_sanchez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_austin_jackson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_avisail_garcia' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_brad_penny' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_brandon_inge' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_brayan_villarreal' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_brennan_boesch' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_bryan_holaday' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_carlos_guillen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_daniel_schlereth' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_danny_worth' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_darin_downs' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_david_pauley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_delmon_young' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_don_kelly' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_doug_fister' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_drew_smyly' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_gerald_laird' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_jhonny_peralta' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_jim_leyland' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_joaquin_benoit' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_jose_valverde' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_justin_verlander' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_luis_marte' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_luke_putkonen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_magglio_ordonez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_max_scherzer' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_miguel_cabrera' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_octavio_dotel' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_omar_infante' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_phil_coke' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_prince_fielder' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_quintin_berry' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_ramon_santiago' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_rick_porcello' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_ryan_perry' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_ryan_raburn' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_torii_hunter' : 'categoryTemplateFeaturedPlayer',
				'.mlb.detroit_tigers.z_victor_martinez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_angel_sanchez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_armando_galarraga' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_boddy_meacham' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_brandon_barnes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_brandon_laird' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_brandon_lyon' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_brett_myers' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_brett_wallace' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_brian_bogusevic' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_bud_norris' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_carlos_lee' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_carlos_pena' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_chris_johnson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_chris_snyder' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_dallas_keuchel' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_diory_hernandez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_enerio_del_rosario' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_enerio_delrosario' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_fernando_abad' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_fernando_rodriguez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_francisco_cordero' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_hector_ambriz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_humberto_quintero' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_j.a._happ' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_j.r._towles' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_ja_happ' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_jack_cust' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_jason_bourgeois' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_jason_castro' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_jd_martinez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_jed_lowrie' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_jimmy_paredes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_jordan_lyles' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_jordan_schafer' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_jose_altuve' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_jose_veras' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_justin_maxwell' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_justin_ruggiano' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_kyle_weiland' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_lucas_harrell' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_matt_dominguez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_matt_downs' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_philip_humber' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_rhiner_cruz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_rick_ankiel' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_travis_buck' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_tyler_greene' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_wandy_rodriguez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_wesley_wright' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_wilton_lopez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.houston_astros.z_zack_duke' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_aaron_crow' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_adam_moore' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_alcides_escobar' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_alex_gordon' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_billy_butler' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_blake_wood' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_brayan_pena' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_bret_saberhagen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_bruce_chen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_chris_getz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_clint_robinson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_danny_duffy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_david_lough' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_derrick_robinson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_eric_hosmer' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_everett_teaford' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_felipe_paulino' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_francisley_bueno' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_george_brett' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_greg_holland' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_harmon_killebrew' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_irving_falu' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_jake_odorizzi' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_james_shields' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_jarrod_dyson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_jason_bourgeois' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_jason_kendall' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_jeff_francis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_jeff_francoeur' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_jeff_suppan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_jeremy_guthrie' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_jeremy_jeffress' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_jesse_chavez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_joakim_soria' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_johnny_giavotella' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_jonathan_broxton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_jonathan_sanchez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_kanekoa_texeira' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_kelvin_herrera' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_kevin_kouzmanoff' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_kyle_davies' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_lorenzo_cain' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_louis_coleman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_luis_mendoza' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_luke_hochevar' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_manny_pina' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_matt_treanor' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_melky_cabrera' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_mike_moustakas' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_mitch_maier' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_nathan_adcock' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_ned_yost' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_noel_arguelles' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_pedro_feliz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_robinson_tejeda' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_ryan_verdugo' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_salvador_perez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_sean_osullivan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_tim_collins' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_tommy_hottovy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_tony_abreu' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_victor_marte' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_vin_mazzaro' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_wade_davis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_will_smith' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_willie_wilson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.kansas_city_royals.z_yuniesky_betancourt' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_albert_pujols' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_alberto_callaspo' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_andrew_romine' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_bobby_cassevah' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_bobby_wilson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_chris_iannetta' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_cj_wilson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_dan_haren' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_erick_aybar' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_ervin_santana' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_francisco_rodriguez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_hank_conger' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_hisanori_takahashi' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_howie_kendrick' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_jason_isringhausen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_jeff_mathis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_jered_weaver' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_jeremy_moore' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_jordan_walden' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_jorge_cantu' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_josh_hamilton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_kendry_morales' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_kevin_jepsen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_latroy_hawkins' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_maicer_izturis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_mark_trumbo' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_michael_kohn' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_mike_scioscia' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_mike_trout' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_peter_bourjos' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_reggie_willits' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_rich_thompson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_russell_branyan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_scott_downs' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_torii_hunter' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_trevor_bell' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_vernon_wells' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_angels.z_zack_greinke' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_a.j._ellis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_aaron_harang' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_adrian_gonzalez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_aj_ellis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_andre_ethier' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_blake_hawksworth' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_brandon_league' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_carl_crawford' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_chad_billingsley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_chris_capuano' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_clayton_kershaw' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_dee_gordon' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_don___mattingly' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_hanley_ramirez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_james_loney' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_jamey_wright' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_jerry_sands' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_joe_blanton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_john_grabow' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_josh_beckett' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_juan_rivera' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_juan_uribe' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_justin_sellers' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_kenley_jansen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_mark_ellis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_matt_angle' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_matt_guerrier' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_matt_kemp' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_mike_macdougal' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_nick_punto' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_ramon_troncoso' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_russell_mitchell' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_scott_elbert' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_shane_victorino' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_ted_lilly' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_tim_federowicz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_todd_coffey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_tony_gwynn' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_trent_oeltjen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.los_angeles_dodgers.z_zack_greinke' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_alex_sanabia' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_anibal_sanchez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_austin_kearns' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_brett_hayes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_brian_barden' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_brian_sanches' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_carlos_lee' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_carlos_zambrano' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_chris_hatcher' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_donnie_murphy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_edward_mujica' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_emilio_bonifacio' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_gaby_sanchez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_greg_dobbs' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_hanley_ramirez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_heath_bell' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_john_buck' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_jose_ceda' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_jose_reyes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_josh_johnson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_leo_nunez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_logan_morrison' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_mark_buehrle' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_michael_dunn' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_mike_stanton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_omar_infante' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_ozzie_guillen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_ricky_nolasco' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_ryan_webb' : 'categoryTemplateFeaturedPlayer',
				'.mlb.miami_marlins.z_sean_west' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_alex_gonzalez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_aramis_ramirez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_brandon_kintzler' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_carlos_gomez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_chris_narveson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_corey_hart' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_craig_counsell' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_eric_farris' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_francisco_rodriguez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_george_kottaras' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_john_axford' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_jonathan_lucroy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_jose_veras' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_josh_butler' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_kameron_loe' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_logan_schafer' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_luis_cruz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_manny_parra' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_marco_estrada' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_mark_rogers' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_mat_gamel' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_mike_mcclendon' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_norichika_aoki' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_nyjer_morgan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_randy_wolf' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_rickie_weeks' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_ryan_braun' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_shaun_marcum' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_taylor_green' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_tim_dillard' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_yovani_gallardo' : 'categoryTemplateFeaturedPlayer',
				'.mlb.milwaukee_brewers.z_zach_braddock' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_alex_burnett' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_alexi_casilla' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_ben_revere' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_brian_duensing' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_carl_pavano' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_danny_valencia' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_denard_span' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_drew_butera' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_francisco_liriano' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_glen_perkins' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_jamey_carroll' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_jason_kubel' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_jeff_manship' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_jim_hoey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_joe_mauer' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_joel_zumaya' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_john_rauch' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_jose_mijares' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_justin_morneau' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_luke_hughes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_matt_capps' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_matt_tolbert' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_nick_blackburn' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_ron__gardenhire' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_ryan_doumit' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_scott_baker' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_trevor_plouffe' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_tsuyoshi_nishioka' : 'categoryTemplateFeaturedPlayer',
				'.mlb.minnesota_twins.z_vance_worley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_andres_torres' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_bobby_parnell' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_chris_young' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_d.j._carrasco' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_daniel_murphy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_david_wright' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_dillon_gee' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_dj_carrasco' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_elmer_dessens' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_frank_francisco' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_ike_davis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_jason_bay' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_jenrry_mejia' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_johan_santana' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_jon_niese' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_jon_rauch' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_josh_thole' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_justin_turner' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_lucas_duda' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_mike_baxter' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_mike_pelfrey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_pedro_beato' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_r.a._dickey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_ra_dickey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_ramon_ramirez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_ronny_cedeno' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_ruben_tejada' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_scott_hairston' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_sean_green' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_taylor_buchholz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_taylor_tankersley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_mets.z_tim_byrdak' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_alex_rodriguez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_andruw_jones' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_boone_logan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_brett_gardner' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_casey_mcgehee' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_cc_sabathia' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_chris_dickerson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_cory_wade' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_curtis_granderson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_damaso_marte' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_david_robertson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_dellin_betances' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_derek_jeter' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_derek_lowe' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_eduardo_nunez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_eric_chavez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_francisco_cervelli' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_freddy_garcia' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_hideki_okajima' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_ichiro_suzuki' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_ivan_nova' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_joba_chamberlain' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_joe_girardi' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_jorge_posada' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_mariano_rivera' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_mark_teixeira' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_michael_pineda' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_nick_swisher' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_pedro_feliciano' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_phil_hughes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_rafael_soriano' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_ramiro_pena' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_robinson_cano' : 'categoryTemplateFeaturedPlayer',
				'.mlb.new_york_yankees.z_russell_martin' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_adam_rosales' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_aj_griffin' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_andrew_carignan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_bartolo_colon' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_bob_melvin' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_brandon_hicks' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_brandon_inge' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_brandon_mccarthy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_brandon_moss' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_brett_anderson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_brian_fuentes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_chris_carter' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_cliff_pennington' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_coco_crisp' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_collin_cowgill' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_dallas_braden' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_dan_straily' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_daric_barton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_derek_norris' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_edgar_gonzalez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_eric_sogard' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_evan_scribner' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_george_kottaras' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_grant_balfour' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_hideki_matsui' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_jarrod_parker' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_jemile_weeks' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_jeremy_hermida' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_jerry_blevins' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_joey_devine' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_jonny_gomes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_jordan_norberto' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_josh_donaldson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_josh_reddick' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_kurt_suzuki' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_landon_powell' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_michael_wuertz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_pat_neshek' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_pedro_figueroa' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_rich_harden' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_ryan_cook' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_scott_sizemore' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_sean_doolittle' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_seth_smith' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_stephen_drew' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_tom_milone' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_travis_blackley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_tyson_ross' : 'categoryTemplateFeaturedPlayer',
				'.mlb.oakland_athletics.z_yoennis_cespedes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_antonio_bastardo' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_brian_schneider' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_carlos_ruiz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_chad_qualls' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_charlie_manuel' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_chase_utley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_cliff_lee' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_cole_hamels' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_david_herndon' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_david_purcey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_domonic_brown' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_dontrelle_willis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_erik_kratz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_freddy_galvis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_hunter_pence' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_jim_thome' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_jimmy_rollins' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_joe_blanton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_joe_savery' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_john_bowker' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_john_mayberry' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_jonathan_papelbon' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_jose_contreras' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_juan_pierre' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_kyle_kendrick' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_laynce_nix' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_michael_martinez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_michael_schwimer' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_michael_stutes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_michael_young' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_pete_mackanin' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_pete_orr' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_placido_polanco' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_richard_dubee' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_ronnie_belliard' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_roy_halladay' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_ryan_howard' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_samuel_perlozzo' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_scott_mathieson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_shane_victorino' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_ty_wigginton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.philadelphia_phillies.z_vance_worley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_aj_burnett' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_alex_presley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_andrew_mccutchen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_brad_lincoln' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_brian_burres' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_casey_mcgehee' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_charlie_morton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_chris_leroux' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_chris_resop' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_clint_barmes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_clint_hurdle' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_daniel_mccutchen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_daniel_moskos' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_evan_meek' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_gaby_sanchez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_garrett_jones' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_james_mcdonald' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_jeff_karstens' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_joel_hanrahan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_jose_morales' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_jose_tabata' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_josh_harrison' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_juan_cruz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_kevin_correia' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_matt_hague' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_michael_mckenry' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_nate_mclouth' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_neil_walker' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_pedro_alvarez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_rod_barajas' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_tony_watson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.pittsburgh_pirates.z_travis_snider' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_aaron_cunningham' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_andy_parrino' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_anthony_bass' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_bud_black' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_cameron_maybin' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_carlos_quentin' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_chase_headley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_chris_denorfia' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_clayton_richard' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_cory_luebke' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_dustin_moseley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_edinson_volquez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_ernesto_frieri' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_everth_cabrera' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_guillermo_quiroz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_huston_street' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_jason_bartlett' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_jeff_suppan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_jesus_guzman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_joe_thatcher' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_kyle_blanks' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_luke_gregerson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_mark_kotsay' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_matt_antonelli' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_nick_hundley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_orlando_hudson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_tim_stauffer' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_trevor_hoffman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_will_venable' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_diego_padres.z_yonder_alonso' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_aaron_rowand' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_angel_pagan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_aubrey_huff' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_barry_zito' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_brad_penny' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_brandon_belt' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_brandon_crawford' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_brett_pill' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_brian_wilson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_bruce_bochy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_buster_posey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_clay_hensley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_dan_otero' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_dan_runzler' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_duane_kuiper' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_eli_whiteside' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_emmanuel_burriss' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_freddy_sanchez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_george_kontos' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_gregor_blanco' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_guillermo_mota' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_hector_sanchez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_hunter_pence' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_javier_lopez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_jeremy_affeldt' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_joaquin_arias' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_jose_mijares' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_justin_christian' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_madison_bumgarner' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_marco_scutaro' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_matt_cain' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_melky_cabrera' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_miguel_tejada' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_mike_krukow' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_nate_schierholtz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_pablo_sandoval' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_roger_kieschnick' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_ryan_theriot' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_ryan_vogelsong' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_santiago_casilla' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_sergio_romo' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_shane_loux' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_steve_edlefsen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_tim_lincecum' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_willie_mays' : 'categoryTemplateFeaturedPlayer',
				'.mlb.san_francisco_giants.z_xavier_nady' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_aaron_heilman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_adam_kennedy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_adam_moore' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_alex_liddi' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_blake_beavan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_brandon_league' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_brendan_ryan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_carlos_peguero' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_casper_wells' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_charlie_furbush' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_chone_figgins' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_david_aardsma' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_dustin_ackley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_eric_thames' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_felix_hernandez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_franklin_gutierrez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_george_sherrill' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_greg_halman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_hisashi_iwakuma' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_hongchih_kuo' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_jamey_wright' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_jason_vargas' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_jeff_gray' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_jesus_montero' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_john_jaso' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_josh_bard' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_justin_smoak' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_kevin_millwood' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_kyle_seager' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_lucas_luetge' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_michael_saunders' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_miguel_olivo' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_mike_carp' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_munenori_kawasaki' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_shawn_kelley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_steve_delabar' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_tom_wilhelmsen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.seattle_mariners.z_trayvon_rovinson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_adam_wainwright' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_adron_chambers' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_allen_craig' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_arthur_rhodes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_barret_browning' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_bryan_anderson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_carlos_beltran' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_chris_carpenter' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_corey_patterson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_daniel_descalso' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_david_freese' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_eduardo_sanchez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_edward_mujica' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_edwin_jackson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_fernando_salas' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_gerald_laird' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_jaime_garcia' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_jake_westbrook' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_jason_motte' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_joe_kelly' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_jon_jay' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_kyle_lohse' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_kyle_mcclellan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_lance_berkman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_lance_lynn' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_marc_rzepczynski' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_mark_hamilton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_matt_adams' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_matt_carpenter' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_matt_holliday' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_mike_matheny' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_mitchell_boggs' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_nick_punto' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_pete_kozma' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_rafael_furcal' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_ryan_theriot' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_sam_freeman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_shelby_miller' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_skip_schumaker' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_steven_hill' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_tony_cruz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_trevor_rosenthal' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_tyler_greene' : 'categoryTemplateFeaturedPlayer',
				'.mlb.st_louis_cardinals.z_yadier_molina' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_b.j._upton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_ben_zobrist' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_bj_upton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_brandon_gomes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_brandon_guyer' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_carlos_pena' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_casey_kotchman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_cesar_ramos' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_david_price' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_desmond_jennings' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_elliot_johnson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_evan_longoria' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_fernando_rodney' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_j.p._howell' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_jake_mcgee' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_james_shields' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_jeff_niemann' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_jeremy_hellickson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_joe___maddon' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_john_jaso' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_jose_molina' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_jp_howell' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_juan_cruz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_justin_ruggiano' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_kyle_farnsworth' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_matt_joyce' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_matt_moore' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_reid_brignac' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_sam_fuld' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_sean_rodriguez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_wade_davis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.tampa_bay_rays.z_will_rhymes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_adrian_beltre' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_alexi_ogando' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_andres_blanco' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_bengie_molina' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_brad_hawpe' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_brandon_webb' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_brett_tomko' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_c.j._wilson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_cody_eppley' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_colby_lewis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_craig_gentry' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_darren_oday' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_dave_bush' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_david_murphy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_derek_holland' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_elvis_andrus' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_endy_chavez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_geovany_soto' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_ian_kinsler' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_joe_nathan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_josh_hamilton' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_josh_lindblom' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_julio_borbon' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_koji_uehara' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_mark_lowe' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_matt_harrison' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_michael_kirkman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_michael_young' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_mike_adams' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_mike_napoli' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_mitch_moreland' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_neftali_feliz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_nelson_cruz' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_ron_washington' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_ryan_dempster' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_scott_feldman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_taylor_teagarden' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_yorvit_torrealba' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_yoshinori_tateyama' : 'categoryTemplateFeaturedPlayer',
				'.mlb.texas_rangers.z_yu_darvish' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_adam_lind' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_ben_francisco' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_brandon_morrow' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_brett_cecil' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_brett_lawrie' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_brian_jeroloman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_carlos_villanueva' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_casey_janssen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_chris_woodward' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_colby_rasmus' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_darren_oliver' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_dustin_mcgowan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_edwin_encarnacion' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_emilio_bonifacio' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_eric_thames' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_francisco_cordero' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_henderson_alvarez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_j.p._arencibia' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_jesse_litsch' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_john_buck' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_john_farrell' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_jose_bautista' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_jose_reyes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_josh_johnson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_jp_arencibia' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_kelly_johnson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_kyle_drabek' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_mark_buehrle' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_melky_cabrera' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_mike_mccoy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_nelson_figueroa' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_omar_vizquel' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_ra_dickey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_rajai_davis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_ricky_romero' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_scott_richmond' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_sergio_santos' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_travis_snider' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_trystan_magnuson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.toronto_blue_jays.z_yunel_escobar' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_adam_laroche' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_alex_cora' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_bo_porter' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_brad_lidge' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_bryce_harper' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_cesar_izturis' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_chad_tracy' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_chien-ming_wang' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_collin_balester' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_corey_brown' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_craig_stammen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_danny_espinosa' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_davey_johnson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_david_eckstein' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_drew_storen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_edwin_jackson' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_gio_gonzalez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_henry_rodriguez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_ian_desmond' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_ivan_rodriguez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_jason_michaels' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_jayson_werth' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_jeff_frazier' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_jesus_flores' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_jhonathan_solano' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_john_lannan' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_jonathan_vanevery' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_jonny_gomes' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_jordan_zimmermann' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_kurt_suzuki' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_livan_hernandez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_mark_derosa' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_mark_teahen' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_michael_gonzalez' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_mike_morse' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_rick_ankiel' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_roger_bernadina' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_ross_detwiler' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_ryan_mattheus' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_ryan_zimmerman' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_sandy_leon' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_sean_burnett' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_stephen_strasburg' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_steve_lombardozzi' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_todd_coffey' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_tom_gorzelanny' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_tyler_clippard' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_tyler_moore' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_waldis_joaquin' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_wilson_ramos' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_xavier_nady' : 'categoryTemplateFeaturedPlayer',
				'.mlb.washington_nationals.z_yunesky_maya' : 'categoryTemplateFeaturedPlayer',
				
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
				
				'.affiliates' : 'categoryTemplateAffiliates',
				'.test.signup' : 'categoryTemplateAffiliates',
				
				'.group_sales' : 'categoryTemplateGroupSales',
				
				'.sitemap' : 'categoryTemplateSitemap',
				
				'.rewards_program' : 'categoryTemplateRewards',
				'.rewards_program.terms___conditions' : 'categoryTemplateRewards',
				
				'.aa' : 'categoryTemplateTickets',
				'.zzzzz_extra_innings.mlb_tickets' : 'categoryTemplateTickets',
				
				'.sports_world_connect' : 'categoryTemplateSWConnect',
				
				'.wrigley_field_cam' : 'categoryTemplateEarthCam',
				
				'.zzzzz_extra_innings.cubs_cuttie_contest' : 'categoryTemplateCuties'
				}
			}
		} //r object.
		
	return r;
	}