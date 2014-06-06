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

var store_swc = function(_app) {
	var r = {
	pages : {
		".aa" : "ticketsTemplate"
		},
	vars : {
		templates : [
			"filteredSearchTemplate",
			"fieldcamTemplate"
			],
		customPrompt : "I understand it takes 3-14 business days to customize my item. This item is not returnable / exchangeable as it is considered customized. Once this order is placed, no changes or cancellations are permitted.",
		elasticFields : {},
		/*
		userTeams : {
			app_nba : [],
			app_mlb : [],
			app_nfl : [],
			app_nhl : []
			}
		*/
		userTeam : {}
		},
////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				$(window).on('mousemove.swc', function(e){
					if(e.clientY > .8*$(this).outerHeight()){
						$('#appView').addClass('peekFooter');
						}
					else {
						$('#appView').removeClass('peekFooter');
						}
					});
				_app.ext.store_swc.u.loadBanners();
				
				_app.model.addDispatchToQ({"_cmd":"appResource","filename":"elastic_public.json","_tag":{"datapointer":"appResource|elastic_public", "callback":"handleElasticFields","extension":"store_swc"}},'mutable');
				_app.model.dispatchThis('mutable');
				
				/*
				var userTeams = false;
				if(userTeams = _app.model.readLocal('swcUserTeams')){
					for(var i in _app.ext.store_swc.vars.userTeams){
						if(userTeams[i].length){
							_app.ext.store_swc.u.setUserTeams(i, userTeams[i]);
							}
						}
					}
				else {
					_app.ext.store_swc.u.setUserTeams('app_mlb',['chicago_cubs']);
					//_app.ext.store_swc.u.setUserTeams('app_mlb',[{p:"Chicago Cubs",v:"chicago_cubs","checked":"checked"}]);
					$('#globalMessaging').anymessage({'message' : "It looks like this is your first time here!  We've added the Chicago Cubs to your Team list- to add or remove teams go <a href='#' onClick='return false;' data-app-click='store_swc|showMyTeamChooser'>here!</a>", timeout:30000});
					}
				*/
				var userTeam = _app.model.readLocal('swcUserTeam');
				if(userTeam){
					_app.ext.store_swc.u.setUserTeam(userTeam);
					}
				else {
					_app.ext.store_swc.u.setUserTeam({sport:'app_mlb',team:'chicago_cubs'});
					$('#globalMessaging').anymessage({'message' : "It looks like this is your first time here!  We've set your team to the Chicago Cubs, but you can follow a different team <a href='#' onClick='return false;' data-app-click='store_swc|showMyTeamChooser'>here!</a>", timeout:30000});
					}
				
				/*
				_app.router.appendHash({'type':'exact','route':'shop-by-player/','callback':function(routeObj){
					showContent('static',{dataset:_app.ext.store_swc.vars.userTeams, 'templateID':'shopByPlayerTemplate'});
					}});
				*/
				_app.router.appendHash({'type':'exact','route':'fieldcam/','callback':function(routeObj){
					showContent('static',{dataset:_app.ext.store_swc.staticData.fieldcam, 'templateID':'fieldcamTemplate'})
					}});
				_app.router.appendHash({'type':'exact','route':'affiliates/','callback':function(routeObj){
					showContent('static',{'templateID':'affiliatesTemplate'})
					}});
				_app.router.appendHash({'type':'exact','route':'careers/','callback':function(routeObj){
					showContent('category',{'navcat':'.careers','templateID':'categoryTemplateHTML'})
					}});
				_app.router.appendHash({'type':'exact','route':'inquiry/','callback':function(routeObj){
					showContent('category',{'navcat':'.help_desk.player-inquiry','templateID':'inquiryTemplate'})
					}});
				_app.router.appendHash({'type':'exact','route':'rewards/','callback':function(routeObj){
					showContent('category',{'navcat':'.rewards_program','templateID':'rewardsTemplate'})
					}});
				_app.router.appendHash({'type':'exact','route':'group_sales/','callback':function(routeObj){
					showContent('category',{'navcat':'.group_sales','templateID':'groupSalesTemplate'})
					}});
				_app.router.appendHash({'type':'match','route':'search/manufacturer/{{mfg}}*','callback':function(routeObj){
					showContent('search',{'elasticsearch':{"query" : {"query_string" : {"query" : decodeURIComponent(routeObj.params.mfg), "fields" : ["prod_mfg"]}}}});
					}});
				_app.router.appendHash({'type':'match','route':'filter/{{id}}*','callback':function(routeObj){
					if(_app.ext.store_swc.filterData[routeObj.params.id]){
						routeObj.params.templateID = "filteredSearchTemplate";
						//dump(routeObj);
						routeObj.params.dataset = $.extend(true, {}, _app.ext.store_swc.filterData[routeObj.params.id]);
						if(routeObj.params.dataset.onEnter){
							routeObj.params.dataset.onEnter();
							}
						var optStrs = routeObj.params.dataset.optionList;
						routeObj.params.dataset.options = routeObj.params.dataset.options || {};
						for(var i in optStrs){
							var o = optStrs[i];
							if(_app.ext.store_swc.vars.elasticFields[o]){
								routeObj.params.dataset.options[o] = _app.ext.store_swc.vars.elasticFields[o];
								}
							else {
								dump("Unrecognized option "+o+" on filter page "+routeObj.params.id);
								}
							}
						/*
						routeObj.params.dataset.userTeams = {};
						for(var sport in _app.ext.store_swc.validTeams){
							routeObj.params.dataset.userTeams[sport] = $.grep(_app.ext.store_swc.validTeams[sport], function(e, i){ return $.inArray(e.v, _app.ext.store_swc.vars.userTeams[sport]) >= 0});
							$.map(routeObj.params.dataset.userTeams[sport], function(e){e.checked = "checked";});
							}
						*/
						routeObj.params.dataset.userTeam = _app.ext.store_swc.vars.userTeam;
						showContent('static',routeObj.params)
						}
					else {
						showContent('404');
						}
					}});
				
				
				//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
				r = true;

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				_app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			},
		attachHandlers : {
			onSuccess : function(){
				_app.templates.productTemplate.on('complete.swc', function(event, $context, infoObj){
					var data = _app.data['appProductGet|'+infoObj.pid];
					var variations = data['@variations'];
					if(variations.length == 1 && variations[0].id.match(/A[BDEFGHM]/) ){
						var id = variations[0].id;
						$('select[name='+id+'] option', $context).each(function(){
							var sku = infoObj.pid+":"+id+""+$(this).attr("value");
							//dump(sku);
							//dump(data["@inventory"][sku]);
							if(data["@inventory"][sku] && data["@inventory"][sku].AVAILABLE <= 0){
								$(this).attr("disabled","disabled");
								}
							});
						}
					});
				_app.templates.homepageTemplate.on('complete.swc', function(event, $context, infoObj){
					_app.ext.store_swc.u.showHomepageSlideshow();
					});
				_app.templates.filteredSearchTemplate.on('complete.swc', function(event, $context, infoObj){
					$('.closeButton', $context).button({'icons':{"primary":"ui-icon-closethick"}, "text":false});
					$('form.filterList', $context).trigger('submit');
					});
				_app.templates.fieldcamTemplate.on('depart.swc', function(event, $context, infoObj){
					$context.empty().remove();
					});
				_app.ext.store_search.vars.universalFilters.push({"has_child":{"type":"sku","query":{"range":{"available":{"gte":1}}}}});
				_app.ext.store_search.vars.universalFilters.push({"not":{"term":{"tag":"IS_DISCONTINUED"}}});
				$.merge(_app.ext.seo_robots.vars.pages, [
					"#!company/about/",
					"#!company/contact/",
					"#!company/faq/",
					"#!company/shipping/",
					"#!company/privacy/",
					//"#!shop-by-player/",
					"#!fieldcam/",
					"#!affiliates/",
					"#!careers/",
					"#!rewards/",
					"#!inquiry/",
					"#!filter/100_years_of_wrigley_field/",
					"#!filter/chicago/",
					"#!filter/blackhawks/",
					"#!filter/shirts/",
					"#!filter/jerseys/",
					"#!filter/personalized_jerseys/",
					"#!filter/sweatshirts/",
					"#!filter/hats/",
					"#!filter/souvenirs/"
					]);
				
				
				var dismissNav = function(){
					_app.ext.store_swc.e.dismissNav(null, {preventDefault : function(){}});
					}
				for(var i in _app.templates){
					_app.templates[i].on('complete.swc', dismissNav);
					}
				$('#appTemplates').children().each(function(){
					$(this).on('complete.swc', dismissNav);
					});
				
				setTimeout(function(){_app.ext.store_swc.e.toggleFooter(null, {preventDefault : function(){}});}, 1200);
				_app.ext.store_swc.u.renderMyTeams();
				},
			onError : function(){}
			},
		handleElasticFields : {
			onSuccess : function(rd){
				var data = _app.data[rd.datapointer];
				for(var i in data.contents['@products']){
					var field = data.contents['@products'][i];
					_app.ext.store_swc.vars.elasticFields[field.id] = field;
					}
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
		tlcFormats : {
			imageurl : function(data,thisTLC){
				var args = thisTLC.args2obj(data.command.args, data.globals);
				data.globals.binds[data.globals.focusBind] = _app.u.makeImage(args);
				return true;
				},
			extend : function(data,thisTLC){
				var args = thisTLC.args2obj(data.command.args, data.globals);
				if(args.by){
					data.globals.binds[data.globals.focusBind] = $.extend(true, {}, data.globals.binds[data.globals.focusBind], args.by);
					}
				else {
					return false;
					}
				},
			merge : function(data,thisTLC){
				var args = thisTLC.args2obj(data.command.args, data.globals);
				if(args.by){
					data.globals.binds[data.globals.focusBind] = $.merge(data.globals.binds[data.globals.focusBind], args.by);
					}
				else {
					return false;
					}
				},
			filterrange : function(data, thisTLC){
				var args = thisTLC.args2obj(data.command.args, data.globals);
				if(typeof args.filterType === "undefined"){
					args.filterType = 'range';
					}
				if(args.index){
					
					var range = data.globals.binds[data.globals.focusBind];
					range.min = range.min || 0;
					range.step = range.step || 1;
					var $tag = data.globals.tags[data.globals.focusTag];

					$tag.attr('data-filter-index',args.index);
					$tag.attr('data-filter-type',args.filterType);
					
					$tag.slider({
						range : true,
						min : range.min,
						max : range.max,
						step : range.step,
						values : [range.min, range.max],
						change : function(event, ui){_app.ext.store_swc.e.execFilteredSearch($(this), event);},
						slide : function(event, ui){$('.sliderVal', ui.handle).text(ui.value);},
						create : function(event, ui){
							$(this).find(".ui-slider-handle").each(function(i){
								var vals = $tag.slider('values');
								var $tooltip = $('<span class="sliderValContainer ui-state-default">$<span class="sliderVal">'+vals[i]+'</span></span>');
								$(this).append($tooltip);
								});
							}
						})
					}
				else {
					return false;
					}
				return true;
				},
			filtercheckboxlist : function(data, thisTLC){
				var args = thisTLC.args2obj(data.command.args, data.globals);
				if(typeof args.filterType === "undefined"){
					args.filterType = 'checkboxList';
					}
				if(args.index){
					var list = data.globals.binds[data.globals.focusBind];
					var $tag = data.globals.tags[data.globals.focusTag];
					if(args.filterType){
						$tag.attr('data-filter-type',args.filterType);
						}
					$tag.attr('data-filter-index',args.index);
					for(var i in list){
						var o = list[i];
						var $t = $('<div data-filter="inputContainer"></div>');
						$t.append('<label><input data-filter="filterCheckbox" type="checkbox" name="'+o.v+'" '+(o.checked ? 'checked="checked"' : '')+' />'+o.p+' <span data-filter="count"></span></label>');
						$('input', $t).on('change', function(event){
							_app.ext.store_swc.e.execFilteredSearch($(this), event);
							});
						if(o.hidden){$t.addClass('displayNone');}
						$tag.append($t);
						}
					return true;
					} 
				else {
					return false;
					}
				},
			myteamcheckbox : function(data, thisTLC){
				var args = thisTLC.args2obj(data.command.args, data.globals);
				if(args.index){
					var team = data.globals.binds[data.globals.focusBind];
					var $tag = data.globals.tags[data.globals.focusTag];
					dump(team);
					$tag.attr('data-filter-index',args.index);
					
					var $t = $('<div data-filter="inputContainer"></div>');
					$t.append('<label><input data-filter="filterCheckbox" type="checkbox" name="'+team.v+'" '+(team.checked ? 'checked="checked"' : '')+' />'+team.p+' <span data-filter="count"></span></label>');
					$('input', $t).on('change', function(event){
						_app.ext.store_swc.e.execFilteredSearch($(this), event);
						});
					if(team.hidden){$t.addClass('displayNone');}
					
					var $p = $('<div class="playerFilterList"></div>');
					if(team.players){
						for(var i in team.players){
							var p = team.players[i];
							$p.append('<div><label><input data-filter="playerFilterCheckbox" type="checkbox" name="'+p+'" />'+p+'</label></div>');
							}
						$('input', $p).on('change', function(event){
							_app.ext.store_swc.e.execFilteredSearch($(this), event);
							});
						if(team.catlink){
							$p.append('<div class="alignRight"><a class="white" href="'+team.catlink+'">more players</div>');
							}
						}
					else {
						if(team.catlink){
							$p.append('<div class="alignRight"><a class="white" href="'+team.catlink+'">browse by player</div>');
							}
						}
					$t.append($p);
					
					$tag.append($t);
					return true;
					} 
				else {
					return false;
					}
				},
			filterlink : function(data,thisTLC){
				var id = data.value;
				data.globals.binds[data.globals.focusBind] = "#!filter/"+id+"/"
				return true;
				},
			filtertitle : function(data,thisTLC){
				var id = data.value;
				data.globals.binds[data.globals.focusBind] = _app.ext.store_swc.filterData[id].title;
				return true;
				},
			relatedproducts : function(data,thisTLC){
				var lt = data.value['%attribs']['zoovy:prod_name'];
				lt += " "+data.value['%attribs']['zoovy:keywords'];
				lt += " "+data.value['%attribs']['zoovy:prod_desc'];
				
				
				var search = {
					"query" : {
						"more_like_this" : {
							"fields" : ["prod_name", "keywords", "description"],
							"like_text" : lt
							}
						}
					}
				var _tag = {
					"callback":"handleElasticResults",
					"datapointer":"relatedProducts|"+data.value.pid,
					"extension":"store_search",
					"list":data.globals.tags[data.globals.focusTag],
					"templateID":"productListTemplateResults"
					}
				es = _app.ext.store_search.u.buildElasticRaw(search);
				es.size = 3;
				_app.ext.store_search.calls.appPublicSearch.init(es, _tag, 'immutable');
				//_app.model.addDispatchToQ(reqObj, 'immutable');
				_app.model.dispatchThis('immutable');
				return true;
				},
			morefromteamlink : function(data,thisTLC){
				var args = thisTLC.args2obj(data.command.args, data.globals);
				var team = $.grep(_app.ext.store_swc.validTeams[args.sport], function(e,i){
					return e.v == args.team;
					})[0];
				data.globals.binds[data.globals.focusBind] = team.catlink;
				return true;
				},
			dump : function(data,thisTLC){
				dump("store_swc#dump");
				dump(data);
				return true;
				}
			},
		renderFormats : {
			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
			fetchTemplateForPage : function(navcat){
				var r = false;
				if(_app.ext.store_swc.pages[navcat]){
					r = _app.ext.store_swc.pages[navcat];
					}
				else if((/\.mlb\.[^.]+\.[^.]+/).test(navcat)){
					r = 'categoryTemplatePlayer';
					}
				else if(navcat.indexOf('.aa.')==0){
					r = 'categoryTemplateHTML';
					}
				
				return r;
				},
			loadBanners : function(){
				_app.u.dump("loadbanners");
				$.getJSON("_banners.json?_v="+(new Date()).getTime(), function(json){
					_app.ext.store_swc.vars.homepageBanners = json;
					}).fail(function(){
						_app.u.dump("BANNERS FAILED TO LOAD");
						});
				},
			showHomepageSlideshow : function(){
				if(_app.ext.store_swc.vars.homepageBanners){
					var $slideshow = $('#homeSlideshow');
					if($slideshow.data('slideshow') !== 'true'){
						for(var i=0; i<_app.ext.store_swc.vars.homepageBanners.length; i++){
							//_app.u.dump(_app.ext.store_swc.vars.homepageBanners[i]);
							var b = _app.ext.store_swc.vars.homepageBanners[i];
							var $banner = $('<a href="'+b.href+'"></a>'); 
							$banner.append('<span class="vAlignHelper"></span>');
							$banner.append(_app.u.makeImage({
								"name" : b.src,
								"title" : b.title,
								"alt" : b.alt,
								"b" : "tttttt",
								"tag" : 1
								}));
							$slideshow.append($banner);
							}
						
						$slideshow.data('slideshow','true').cycle({
							fx:     'fade',
							speed:  'slow',
							timeout: 5000,
							//pager:  '#slideshowNav',
							slides : 'a'
							});
						}
					}
				else {
					setTimeout(function(){_app.ext.store_swc.u.showHomepageSlideshow();}, 250);
					}
				},
			showSizeChart : function(){
				$('#size-chart').dialog({'modal':'true', 'title':'Sizing Chart','width':Math.min($(window).innerWidth() - 20, 800), height:Math.min($(window).innerHeight()-20, 550)});
				},
			lazyload : function($tag){
				var $img = $($('img[data-src]', $tag).get(0));
				$img.attr('src', $img.attr('data-src'));
				$img.removeAttr('data-src');
				setTimeout(function(){
					_app.ext.store_swc.u.lazyload($tag);
					}, 0);
				},
			/*
			setUserTeams : function(sport, teamsArr){
				if(typeof _app.ext.store_swc.vars.userTeams[sport] !== "undefined"){
					_app.ext.store_swc.vars.userTeams[sport] = teamsArr;
					this.saveUserTeams();
					if($('#myTeamChooser').hasClass('active')){
						_app.ext.store_swc.u.renderMyTeams();
						_app.ext.store_swc.u.lazyload($('#myTeamChooser'));
						} 
					else{
						setTimeout(function(){
							_app.ext.store_swc.u.renderMyTeams();
							}, 3000);
						
						}
					}
				},
			*/
			setUserTeam : function(team){
				dump(team);
				var fullTeamObj = $.grep(_app.ext.store_swc.validTeams[team.sport], function(e, i){ return e.v == team.team})[0];
				if(fullTeamObj){
					_app.ext.store_swc.vars.userTeam = $.extend(true, {"checked":"checked", "sport":team.sport}, fullTeamObj);
					this.saveUserTeam(team);
					}
				else {
					_app.u.throwMessage(_app.u.errorMsgObject("An error has occured- could not set user team to: "+team.team));
					}
				},
			/*
			saveUserTeams : function(){
				$('#appView .myTeamsFilter').each(function(){
					$(this).empty().tlc({'verb':'translate','dataset':{userTeams:_app.ext.store_swc.vars.userTeams}});
					});
				$('#appView .filteredSearchPage').each(function(){
					$(this).intervaledEmpty().remove();
					}); //These will all need to be re-rendered with the new teams.  This is a bit of a heavy handed approach that could be tuned later.
				$('#appView #shopByPlayerTemplate_').intervaledEmpty().remove();
				if($('#appView #mainContentArea :visible').length < 1){
					_app.router.handleHashChange();
					}
				_app.model.writeLocal('swcUserTeams', _app.ext.store_swc.vars.userTeams);
				},
			*/
			saveUserTeam : function(team){
				$('#appView .myTeamsFilter').each(function(){
					$(this).empty().tlc({'verb':'translate','dataset':{userTeams:_app.ext.store_swc.vars.userTeams}});
					});
				$('#appView .filteredSearchPage').each(function(){
					$(this).intervaledEmpty().remove();
					}); //These will all need to be re-rendered with the new teams.  This is a bit of a heavy handed approach that could be tuned later.
				$('#appView #shopByPlayerTemplate_').intervaledEmpty().remove();
				if($('#appView #mainContentArea :visible').length < 1){
					window.location = "#!";
					}
				_app.model.writeLocal('swcUserTeam', team);
				},
			/*
			renderMyTeams : function(){
				//console.log("rendering My Teams");
				var $teams = $('#myTeamChooser');
				var data = {
					userTeams : {},
					validTeams : {}
					};
				for(var sport in _app.ext.store_swc.validTeams){
					var ut = _app.ext.store_swc.vars.userTeams[sport];
					dump(ut);
					data.validTeams[sport] = [];
					data.userTeams[sport] = [];
					for(var i in _app.ext.store_swc.validTeams[sport]){
						var t = _app.ext.store_swc.validTeams[sport][i];
						if($.inArray(t.v,ut) >= 0){
							data.userTeams[sport].push(t);
							}
						else {
							data.validTeams[sport].push(t);
							}
						}
					}
				//var now = new Date().getTime();
				$teams.intervaledEmpty().tlc({dataset:data, templateid:$teams.attr('data-templateid')});
				//dump("TLC took: "+(new Date().getTime() - now));
				$('.closeButton', $teams).button({'icons':{"primary":"ui-icon-closethick"}, "text":false});
				$('.myTeamPopupContainer form button').button({"text":"OK"});
				$('.backButton', $teams).button({'icons':{"primary":"ui-icon-arrowreturnthick-1-w"}, "text":false});
				},
			*/
			renderMyTeams : function(){
				var $teams = $('#myTeamChooser');
				var data = _app.ext.store_swc.validTeams;
				$teams.intervaledEmpty().tlc({dataset:data, templateid:$teams.attr('data-templateid')});
				$('.closeButton', $teams).button({'icons':{"primary":"ui-icon-closethick"}, "text":false});
				$('.myTeamPopupContainer form button').button({"text":"OK"});
				$('.backButton', $teams).button({'icons':{"primary":"ui-icon-arrowreturnthick-1-w"}, "text":false});
				},
			showRMAForm : function(){
				$('#rma-form').dialog({'modal':'true', 'title':'RMA Form','width':Math.min($(window).innerWidth() - 20, 800), height:Math.min($(window).innerHeight()-20, 550)});
				},
			addRMAItem : function(){
				var index = $("#rmaItems .rmaItem").length + 1;
				var $rmaItem = $('<div class="rmaItem"></div>');
				$rmaItem.append($('<label class="col1">'+index+'</label>'));
				$rmaItem.append($('<input class="col2" type="text" value="" name="returnid_'+index+'" id="returnid_'+index+'" />'));
				$rmaItem.append($('<input class="col3" type="radio" name="retex_'+index+'" id="retex_'+index+'" value="refund" />'));
				$rmaItem.append($('<input class="col4" type="radio" name="retex_'+index+'" id="retex_'+index+'" value="exchange" />'));
				$rmaItem.append($('<input class="col5" type="text" name="exchangeid_'+index+'" id="exchangeid_'+index+'" value="" />'));
				$rmaItem.append($('<button onClick="myApp.ext.store_swc.u.removeRMAItem($(this).parent()); return false;" class="ui-button ui-widget ui-state-default ui-corner-all ui-button-icon-only"><span class="ui-button-icon-primary ui-icon ui-icon-closethick"></span></button>'));
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
				obj.OID = $('#RMAFormOID',$form).val();
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
						_app.u.dump("ERROR"+i);
						errors.push("Item number "+i+" contained errors");
						}
					i++;
					});
				
				//_app.u.dump(obj);
				//_app.u.dump(errors);
				if(errors.length == 0){
					var _tag = {
						callback : function(){
							$('#rma-form').dialog('close');
							_app.u.throwMessage(_app.u.successMsgObject("Thank you, your request has been submitted. Please enclose your printed RMA-form with your package!"));
							//app.u.printByjqObj($form);
							}
						};
					obj._cmd = "appSendMessage";
					obj.msgtype = "feedback";
					obj._tag = _tag;
					_app.model.addDispatchToQ(obj, 'mutable');
					_app.model.dispatchThis('mutable');
					}
				else {
					var message = $("<ul></ul>");
					for(var e in errors){
						message.append($("<li>"+errors[e]+"</li>"));
					}
					$('#RMAFormMessaging', $form).anymessage({'message' : message.html()});
					}
				}
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			execFilteredSearch : function($form, p){
				$('.filterList',$form.closest('.filteredSearchPage')).removeClass('active');
				$form = $form.closest('form');
				p.preventDefault();
				var $resultsContainer = $form.closest('[data-filter-page=parent]').find('.filterResults');
				var filterBase = JSON.parse($form.attr('data-filter-base'));
				var elasticsearch = {
					"filter" : {
						"and" : [filterBase]
						},
					"facets" : {}
					}
				var countFilters = [];
				$('[data-filter-type=sort]', $form).each(function(){
					var $selectedOption = $('option:selected',$(this));
					if($selectedOption.attr('data-filter-sort-attribute')){
						elasticsearch.sort = elasticsearch.sort || [];
						var sort = {};
						sort[$selectedOption.attr('data-filter-sort-attribute')] = {"order":$selectedOption.attr('data-filter-sort-direction')};
						elasticsearch.sort.push(sort);
						}
					});
				$('[data-filter-type=range]', $form).each(function(){
					var f = {"range" : {}};
					var vals = $(this).slider('values');
					var m =$(this).attr('data-filter-range-mult')
					if(m){
						vals = $.map(vals, function(e, i){ return e*m; });
						}
					f.range[$(this).attr('data-filter-index')] = {
						"gte" : vals[0],
						"lte" : vals[1]
						}
					elasticsearch.filter.and.push(f);
					});
				$('[data-filter-type=checkboxList]', $form).each(function(){
					var filter = {"or" : []};
					$('[data-filter=count]', $(this)).empty();
					$('input[data-filter=filterCheckbox]', $(this)).each(function(){
						var index = $(this).closest('[data-filter-index]').attr('data-filter-index');
						if(!elasticsearch.facets[index]){
							elasticsearch.facets[index] = {"terms" : {"field":index}}
							}
						if($(this).is(":checked")){
							var f = {"term" : {}};
							f.term[index] = $(this).attr('name');
							filter.or.push(f);
							}
						});
					
					if(filter.or.length > 0){
						elasticsearch.filter.and.push(filter);
						}
					else {
						}
					});
				var playerFilters = {"or" : []}
				$('input[data-filter=playerFilterCheckbox]', $form).each(function(){
					if($(this).is(":checked")){
						var f = {
							"query" : {
								"query_string" : {
									"query" : '"'+$(this).attr('name')+'"',
									"fields" : ["prod_name"]
									}
								}
							};
						playerFilters.or.push(f);
						}
					});
				if(playerFilters.or.length){
					elasticsearch.filter.and.push(playerFilters);
					}
				var es;
				if(!elasticsearch.sort){
					var tmp = {
						"query" :{
							"function_score" : {"filter":elasticsearch.filter}
							},
						"facets" : elasticsearch.facets
						}
					tmp.query.function_score.boost_mode = "sum";
					tmp.query.function_score.script_score = {"script":"doc['boost'].value"};
					es = _app.ext.store_search.u.buildElasticRaw(tmp);
					}
				else {
					es = _app.ext.store_search.u.buildElasticRaw(elasticsearch);
					}
				es.size = 30;
				$resultsContainer.empty();
				
				_app.ext.store_search.u.updateDataOnListElement($resultsContainer,_app.u.getBlacklistedObject(es, ["facets"]),1);
				//dump(es);
				_app.model.dispatchThis();
				_app.ext.store_search.calls.appPublicSearch.init(es, {'callback':function(rd){
					if(_app.model.responseHasErrors(rd)){
						_app.u.throwMessage(rd);
						}
					else {
						_app.ext.prodlist_infinite.callbacks.handleInfiniteElasticResults.onSuccess(rd);
						if(_app.data[rd.datapointer].facets){
							$('[data-filter-type=checkboxList]',rd.filterList).each(function(){
								$('input', $(this)).each(function(){
									var index = $(this).closest('[data-filter-index]').attr('data-filter-index');
									var val = $(this).attr('name');
									
									var $fg = $(this).closest('.filterGroup')
									var $ic = $(this).closest('[data-filter=inputContainer]');
									
									var summary = $.grep(_app.data[rd.datapointer].facets[index].terms, function(e, i){
										return e.term === val;
										})[0];
									if(summary){
										$fg.show();
										$ic.show();
										$('[data-filter=count]', $ic).text("("+summary.count+")");
										}
									else {
										if($fg.hasClass('countHideImmune')){/*Don't hide it if it's immune*/}
										else {
											$ic.hide();
											$(this).prop('checked',false);
											if($('[data-filter=inputContainer]:visible',$fg).length < 1){
												$fg.hide();
												}
											}
										}
									});
								
								});
							}
						}
					}, 'datapointer':'appFilteredSearch','templateID':'productListTemplateResults','list':$resultsContainer, 'filterList' : $form});
				_app.model.dispatchThis();
				
				},
			/*
			clearTeams : function($btn, p){
				p.preventDefault();
				var sport = $btn.closest('[data-swc-sport]').attr('data-swc-sport');
				_app.ext.store_swc.u.setUserTeams(sport, []);
				},
			addteam : function($btn, p){
				p.preventDefault();
				var team = $btn.closest('[data-swc-team]').attr('data-swc-team');
				team.checked = "checked";
				var sport = $btn.closest('[data-swc-sport]').attr('data-swc-sport');
				var teams = _app.ext.store_swc.vars.userTeams[sport];
				teams.push(team);
				_app.ext.store_swc.u.setUserTeams(sport, teams);
				},
			removeteam : function($btn, p){
				p.preventDefault();
				var team = $btn.closest('[data-swc-team]').attr('data-swc-team');
				var sport = $btn.closest('[data-swc-sport]').attr('data-swc-sport');
				var teams = $.grep(_app.ext.store_swc.vars.userTeams[sport], function(e,i){
					return !(e === team);
					});
				_app.ext.store_swc.u.setUserTeams(sport, teams);
				},
			bumpTeamUp : function($btn, p){
				p.preventDefault();
				var team = $btn.closest('[data-swc-team]').attr('data-swc-team');
				var sport = $btn.closest('[data-swc-sport]').attr('data-swc-sport');
				var teams = _app.ext.store_swc.vars.userTeams[sport];
				for(var i in teams){
					if(i>0 && teams[i] === team){
						teams.splice(i-1, 0, teams.splice(i, 1)[0]);
						}
					}
				_app.ext.store_swc.u.setUserTeams(sport, teams);
				},
			bumpTeamDown : function($btn, p){
				p.preventDefault();
				var team = $btn.closest('[data-swc-team]').attr('data-swc-team');
				var sport = $btn.closest('[data-swc-sport]').attr('data-swc-sport');
				var teams = _app.ext.store_swc.vars.userTeams[sport];
				for(var i in teams){
					if(i<teams.length && teams[i] === team){
						teams.splice(i+1, 0, teams.splice(i, 1)[0]);
						}
					}
				_app.ext.store_swc.u.setUserTeams(sport, teams);
				},
			*/
			selectUserTeam : function($ele, p){
				p.preventDefault();
				var team = $ele.closest('[data-swc-team]').attr('data-swc-team');
				var sport = $ele.closest('[data-swc-sport]').attr('data-swc-sport');
				_app.ext.store_swc.u.setUserTeam({sport:sport, team:team});
				var $selectedContainer = $('#myTeamChooser .myTeamSelectedContainer');
				$selectedContainer.tlc({verb:'transmogrify', dataset:_app.ext.store_swc.vars.userTeam, templateid:$selectedContainer.attr('data-templateid')});
				$('#myTeamChooser').addClass('selected');
				},
			productAdd2Cart : function($form, p){
				p.preventDefault();
				if($form.attr('data-swc-custom-notice')){
					var $notice = $('<div><div>'+_app.ext.store_swc.vars.customPrompt+'</div></div>');
						
					var $button = $('<div class="alignRight"><button class="ui-button ui-widget ui-state-default ui-corner-all ui-button-text-only"><span class="ui-button-text">I agree</span></button></div>');
					$button.bind('click',function(){
						$notice.dialog('close');
						_app.ext.quickstart.e.productAdd2Cart($form,p);
						});
						
					$notice.append($button);
					
					$notice.dialog({'modal':'true','title':'Custom Product Agreement', 'width':400});
					}
				else {
					_app.ext.quickstart.e.productAdd2Cart($form,p);
					}
				},
			showMyTeamChooser : function($ele, p){
				p.preventDefault();
				this.selectSport($ele,p);
				$('#myTeamChooser').addClass('active');
				_app.ext.store_swc.u.lazyload($('#myTeamChooser'));
				if(!_app.ext.store_swc.vars.hasOpenedMyTeams && !_app.model.readLocal('myTeamPermaDismiss')){
					_app.ext.store_swc.vars.hasOpenedMyTeams = true;
					$('#myTeamChooser').addClass('popup');
					}
				},
			dismissMyTeamsPopup : function($ele,p){
				var permaDismiss = $ele.serializeJSON().permaDismiss;
				if(permaDismiss){
					_app.model.writeLocal('myTeamPermaDismiss', "1");
					}
				$('#myTeamChooser').removeClass('popup');
				},
			hideMyTeamChooser : function($ele,p){
				//p.preventDefault();
				$('#myTeamChooser').removeClass('selected');
				$('#myTeamChooser').removeClass('active');
				},
			selectSport : function($ele, p){
				p.preventDefault();
				if($ele.attr('data-swc-sport')){
					$('#myTeamChooser').attr('data-swc-sport', $ele.attr('data-swc-sport'));
					}
				else {
					$('#myTeamChooser').removeAttr('data-swc-sport');
					}
				},
			showPhoneOrderForm : function($ele, p){
				p.preventDefault();
				var pid = $ele.attr('data-pid');
				$('#phone-order-form').dialog({'modal':true, 'title':'Contact to purchase '+pid});
				$('#phone-order-form input[name=pid]').val(pid);
				},
			submitPhoneOrderForm : function($ele, p){
				p.preventDefault();
				var form = $ele.serializeJSON();

				if(form.name && form.email && form.pid){
					var obj = {};
					obj.sender = form.email;
					obj.subject = "Phone order message for pid: "+form.pid
					obj.body = 
							"Name: "+form.name+"\n"
						+	"Email: "+form.email+"\n";
					if(form.phone){
						obj.body += "Phone: "+form.phone+"\n";
						}
					obj.body += "Product: "+form.pid+"\n";
					if(form.message){
						obj.body += "Message:\n"+form.message+"\n";
						}
					
					obj._tag = {
						"callback" : function(){
							$('#phone-order-form').dialog('close');
							_app.u.throwMessage(_app.u.successMsgObject("Thank you, your request has been submitted"));
							}
						}
					obj._cmd = "appSendMessage"
					obj.msgtype = "feedback"
					
					_app.model.addDispatchToQ(obj, 'mutable');
					_app.model.dispatchThis('mutable');
					}
				else {
					_app.u.dump(form);
					$form.anymessage(_app.u.errMsgObject("You must provide a name and email!"));
					}
				},
			sendInquiry : function($form, p){
				p.preventDefault();
				var formJSON = $form.serializeJSON();
				
				obj = {
					'sender' : formJSON.sender,
					'subject' : 'Player Inquiry Form Submission',
					'body' : 'Player: '+formJSON.playername+"\n"
							+'Team: '+formJSON.team+"\n"
							+'Message:\n'+formJSON.body
					};
				obj._tag = {
					"callback":function(rd){
						if(_app.model.responseHasErrors(rd)){
							}
						else {
							_app.u.throwMessage(_app.u.successMsgObject("Thank you, your request has been submitted!"));
							}
						}
					};
				obj._cmd = "appSendMessage";
				obj.msgtype = "feedback";
				_app.model.addDispatchToQ(obj,'mutable');
				_app.model.dispatchThis('mutable');
				},
			toggleFooter : function($ele, p){
				p.preventDefault();
				$('#appView').toggleClass('showFooter');
				},
			accountLoginSubmit : function($ele,p)	{
				p.preventDefault();
				if(_app.u.validateForm($ele))	{
					var sfo = $ele.serializeJSON();
					_app.ext.cco.calls.cartSet.init({"bill/email":sfo.login,"_cartid":_app.model.fetchCartID()}) //whether the login succeeds or not, set bill/email in the cart.
					sfo._cmd = "appBuyerLogin";
					sfo.method = 'unsecure';
					sfo._tag = {"datapointer":"appBuyerLogin",'callback':'authenticateBuyer','extension':'quickstart', jqMsgContainer:$ele}
					_app.model.addDispatchToQ(sfo,"immutable");
					_app.calls.refreshCart.init({},'immutable'); //cart needs to be updated as part of authentication process.
					_app.model.dispatchThis('immutable');
					}
				else	{} //validateForm will handle the error display.
				return false;
				},
			newsletterSignup : function($ele, p){
				p.preventDefault();
				var sfo = $ele.serializeJSON();
				sfo._cmd = "appBuyerCreate";
				sfo._tag = {
					datapointer :"appBuyerCreate",
					callback : function(rd){
						if(_app.model.responseHasErrors(rd)){
							$ele.anymessage({message:rd});
							}
						else {
							$ele.anymessage(_app.u.successMsgObject("Thank you, you are now subscribed"));
							}
						}
					}
				_app.model.addDispatchToQ(sfo, 'immutable');
				_app.model.dispatchThis('immutable');
				},
			sendGroupRequest : function($form, p){
				var formJSON = $form.serializeJSON();
				
				obj = {
					'sender' : formJSON.sender,
					'subject' : formJSON.subject,
					'body' : 'Name: '+formJSON.fullname+"\n"
							+'Event Date: '+formJSON.eventdate+"\n"
							+'Message:\n'+formJSON.body
					};
				obj._tag = {
					"callback":function(rd){
						if(_app.model.responseHasErrors(rd)){
							}
						else {
							_app.u.throwMessage(_app.u.successMsgObject("Thank you, your request has been submitted!"));
							}
						}
					};
				obj._cmd = "appSendMessage";
				obj.msgtype = "feedback"
				_app.model.addDispatchToQ(obj, 'mutable');
				_app.model.dispatchThis('mutable');
				},
			wholesalesignup : function($form, p){
				p.preventDefault();
				var obj = $form.serializeJSON();
				obj._script = "wholesale";
				
				obj.todonote  = obj.firstname+" "+obj.lastname+"\n";
				obj.todonote += obj.email+"\n";
				obj.todonote += obj.address1+"\n";
				if(obj.address2 && obj.address2 !== ""){
					obj.todonote += obj.address2+"\n";
					}
				obj.todonote += obj.city+","+obj.region+" "+obj.postal+"\n";
				obj.todonote += "Referred By (or Rooftop): "+obj.referred_by+"\n";
				obj.todonote += "Date Created: "+(new Date()).toDateString();
				
				obj._tag = {
					'callback':function(rd){
						if(_app.model.responseHasErrors(rd)){
							_app.u.throwMessage(rd);
							}
						else {
							//showContent('customer',{'show':'accountCreateConfirmation'});
							_app.u.throwMessage(_app.u.successMsgObject("Your account has been created and is pending approval!"));
							}
						},
					'datapointer' : "appBuyerCreate"
					}
				obj._cmd = "appBuyerCreate";
				dump(obj);
				_app.model.addDispatchToQ(obj, 'immutable');
				_app.model.dispatchThis('immutable');
				},
			toggleNav : function($ele, e){
				e.preventDefault();
				$('#nav').toggleClass('expand');
				},
			expandNav : function($ele, e){
				e.preventDefault();
				$('#nav').addClass('expand');
				},
			dismissNav : function($ele, e){
				e.preventDefault();
				$('#nav').removeClass('expand');
				}
			}, //e [app Events]
		filterData : {
			'100_years_of_wrigley_field' : {
				noteams : true,
				title : "100 Years of Wrigley Field",
				baseFilter : {
					"term" : {"app_promo":"wrigley100"}
					},
				optionList : [
					"user:app_department",
					"user:app_sub_department",
					"user:app_prod_demographic",
					"user:app_t_shirts",
					"user:app_souvenirs",
					"user:app_jerseys",
					"user:app_brands"
					]
				},
			'chicago' : {
				title : "Chicago",
				noteams : true,
				baseFilter : {
					"term" : {"app_promo":"chicago"}
					},
				optionList : [
					"user:app_department",
					"user:app_sub_department",
					"user:app_t_shirts",
					"user:app_souvenirs",
					"user:app_brands"
					]
				},
			'blackhawks' : {
				title : "Chicago Blackhawks",
				onEnter : function(){
					var team = "chicago_blackhawks";
					if($.inArray(team, _app.ext.store_swc.vars.userTeams.app_nhl) < 0){
						_app.ext.store_swc.vars.userTeams.app_nhl.push(team);
						_app.ext.store_swc.u.setUserTeams('app_nhl', _app.ext.store_swc.vars.userTeams.app_nhl);
						_app.u.throwMessage(_app.u.successMsgObject('Due to your interest in the Stanley Cup, the Chicago Blackhawks have been added to your teams!  To edit your teams, <a href="#" onClick="return false;" data-app-click="store_swc|showMyTeamChooser">click here</a>.'));
						}
					},
				noteams : true,
				baseFilter : {
					"term" : {"app_nhl":"chicago_blackhawks"}
					},
				optionList : [
					"user:app_department",
					"user:app_sub_department",
					"user:app_t_shirts",
					"user:app_souvenirs",
					"user:app_brands"
					]
				},
			'shirts' : {
				title : "Shirts",
				baseFilter : {
					"and" : [
						{"term":{"app_department":"t_shirt"}}
						]
					},
				optionList : [
					"user:app_prod_demographic",
					"user:app_t_shirts",
					"user:app_brands"
					]
				},
			'jerseys' : {
				title : "Jerseys",
				baseFilter : {
					"and" : [
						{"term":{"app_department":"jersey"}}
						]
					},
				options : {
					"base_price" : {
						"min":0,
						"max":300
						}
					},
				optionList : [
					"user:app_prod_demographic",
					"user:app_jerseys",
					"user:app_jerseys_style",
					"user:app_jerseys_kind",
					"user:app_brands"
					]
				},
			'personalized_jerseys' : {
				title : "Personalized Jerseys",
				baseFilter : {
					"and" : [
						{"term":{"app_department":"jersey"}},
						{"term":{"app_jerseys":"custom_personalized"}}
						]
					},
				options : {
					"base_price" : {
						"min":0,
						"max":300
						}
					},
				optionList : [
					"user:app_prod_demographic",
					"user:app_jerseys",
					"user:app_jerseys_kind",
					"user:app_brands"
					]
				},
			'sweatshirts' : {
				title : "Sweatshirts and Jackets",
				baseFilter : {
					"and" : [
						{"term":{"app_department":"sweatshirt_jacket"}}
						]
					},
				optionList : [
					"user:app_prod_demographic",
					"user:app_brands"
					]
				},
			'hats' : {
				title : "Hats",
				baseFilter : {
					"term" : {"app_department":"hat"}
					},
				optionList : [
					"user:app_prod_demographic",
					"user:app_sub_department",
					"user:app_brands"
					]
				},
			'souvenirs' : {
				title : "Souvenirs",
				baseFilter : {
					"term" : {"app_department":"souvenir"}
					},
				optionList : [
					"user:app_souvenirs",
					"user:app_brands"
					]
				}
			},
		validTeams : {
			//These values taken from flex field setup, and should be adjusted when / if these are expanded
			'app_nba' : [{"p": "Atlanta Hawks","v": "atlanta_hawks", "img":"nbahats/atlanta_hawks_hat.jpg"},
						{"p": "Boston Celtics","v": "boston_celtics", "img":"nbahats/boston_celtics_hat.jpg"},
						{"p": "Brooklyn Nets","v": "brooklyn_nets", "img":"nbahats/brooklyn_nets_hat1.jpg"},
						{"p": "Charlotte Bobcats","v": "charlotte_hornets", "img":"nbahats/charlotte_bobcats_hat.jpg"},
						{"p": "Chicago Bulls","v": "chicago_bulls", "img":"/nbahats/chicago_bulls_hat.jpg"},
						{"p": "Cleveland Cavaliers","v": "cleveland_cavaliers", "img":"nbahats/cleveland_cavaliers_hat.jpg"},
						{"p": "Dallas Mavericks","v": "dallas_mavericks", "img":"nbahats/dallas_mavericks_hat.jpg"},
						{"p": "Denver Nuggets","v": "denver_nuggets", "img":"nbahats/denver_nuggets_hat.jpg"},
						{"p": "Detroit Pistons","v": "detroit_pistons", "img":"nbahats/detroit_pistons_hat.jpg"},
						{"p": "Golden State Warriors","v": "golden_state_warriors", "img":"nbahats/golden_state_warriors_hat.jpg"},
						{"p": "Houston Rockets","v": "houston_rockets", "img":"nbahats/houston_rockets_hat.jpg"},
						{"p": "Indiana Pacers","v": "indiana_pacers", "img":"nbahats/indiana_pacers_hat.jpg"},
						{"p": "Los Angeles Clippers","v": "los_angeles_clippers", "img":"nbahats/los_angeles_clippers_hat.jpg"},
						{"p": "Los Angeles Lakers","v": "los_angeles_lakers", "img":"nbahats/los_angeles_lakers_hat.jpg"},
						{"p": "Memphis Grizzlies","v": "memphis_grizzlies", "img":"nbahats/memphis_grizzlies_hat.jpg"},
						{"p": "Miami Heat","v": "miami_heat", "img":"nbahats/miami_heat_hat.jpg"},
						{"p": "Milwaukee Bucks","v": "milwaukee_bucks", "img":"nbahats/milwaukee_bucks_hat.jpg"},
						{"p": "Minnesota Timberwolves",	"v": "minnesota_timberwolves", "img":"nbahats/minnesota_timberwolves_hat.jpg"},
						{"p": "New Orleans Pelicans","v": "new_orleans_pelicans", "img":"nbahats/new_orleans_pelicans_hat.jpg"},
						{"p": "New York Knicks","v": "new_york_knicks", "img":"nbahats/new_york_knicks_hat.jpg"},
						{"p": "Oklahoma City Thunder",	"v": "oklahoma_city_thunder", "img":"nbahats/oklahoma_city_thunder_hat.jpg"},
						{"p": "Orlando Magic","v": "orlando_magic", "img":"nbahats/orlando_magic_hat.jpg"},
						{"p": "Philadelphia 76ers","v": "philadelphia_76ers", "img":"nbahats/philadelphia_76ers_hat.jpg"},
						{"p": "Phoenix Suns","v": "phoenix_suns", "img":"nbahats/phoenix_suns_hat.jpg"},
						{"p": "Portland Trailblazers","v": "portland_trailblazers", "img":"nbahats/portland_trailblazers_hat.jpg"},
						{"p": "Sacramento Kings","v": "sacramento_kings", "img":"nbahats/sacramento_kings_hat.jpg"},
						{"p": "San Antonio Spurs","v": "san_antonio_spurs", "img":"nbahats/san_antonio_spurs_hat.jpg"},
						{"p": "Toronto Raptors","v": "toronto_raptors", "img":"nbahats/toronto_raptors_hat.jpg"},
						{"p": "Utah Jazz","v": "utah_jazz", "img":"nbahats/utah_jazz_hat.jpg"},
						{"p": "Washington Wizards","v": "washington_wizards", "img":"nbahats/washington_wizards_hat.jpg"}],
			'app_mlb' : [{"p":"Arizona Diamondbacks","v":"arizona_diamondbacks", "img":"mlbhats/arizona_diamondbacks_game_47_franchise_cap6.jpg", "catlink":"#!category/.mlb.arizona_diamondbacks/Arizona%20Diamondbacks", "players" : ["Brandon McCarthy","Bronson Arroyo","Paul Goldschmidt"]},
						{"p":"Atlanta Braves","v":"atlanta_braves", "img":"mlbhats/atlanta_braves_home_cap.jpg", "catlink":"#!category/.mlb.atlanta_braves/Atlanta%20Braves", "players" : ["Brandon Beachy","Craig Kimbrel","Jason Heyward"]},
						{"p":"Baltimore Orioles","v":"baltimore_orioles", "img":"mlbhats/baltimore_orioles_alternate_47_franchise_cap6.jpg", "catlink":"#!category/.mlb.baltimore_orioles/Baltimore%20Orioles", "players" : ["Adam Jones","Manny Machado","Nick Markakis"]},
						{"p":"Boston Red Sox","v":"boston_red_sox", "img":"mlbhats/boston_red_sox_game_47_franchise_cap6.jpg", "catlink":"#!category/.mlb.boston_red_sox/Boston%20Red%20Sox", "players" : ["David Ortiz","Dustin Pedroia","Xander Bogaerts"], "filters" : ["shirts","jerseys","sweatshirts","hats","souveniers"]},
						{"p":"Chicago Cubs","v":"chicago_cubs", "img":"47brand/chicago_cubs_royal_franchise_cap_by__47_brand.jpg", "catlink":"#!category/.mlb.chicago_cubs/Chicago%20Cubs", "players" : ["Anthony Rizzo","Jeff Samardzija","Starlin Castro"]},
						{"p":"Chicago White Sox","v":"chicago_white_sox", "img":"mlbhats/chicago_white_sox_game_47_franchise_cap6.jpg", "catlink":"#!category/.mlb.chicago_white_sox/Chicago%20White%20Sox", "players" : ["Chris Sale","Jose Abreu","Paul Konerko"]},
						{"p":"Cincinnati Reds","v":"cincinnati_reds", "img":"mlbhats/cincinnati_reds_home_47_franchise_cap5.jpg", "catlink":"#!category/.mlb.cincinnati_reds/Cincinnati%20Reds", "players" : ["Aroldis Chapman","Brandon Phillips","Joey Votto"]},
						{"p":"Cleveland Indians","v":"cleveland_indians", "img":"mlbhats/cleveland_indians_alternate_road_47_franchise_cap6.jpg", "catlink":"#!category/.mlb.cleveland_indians/Cleveland%20Indians", "players" : ["Jason Kipnis","Michael Bourn","Nick Swisher"]},
						{"p":"Colorado Rockies","v":"colorado_rockies", "img":"mlbhats/colorado_rockies_game_47_franchise_cap5.jpg", "catlink":"#!category/.mlb.colorado_rockies/Colorado%20Rockies", "players" : ["Boone Logan","Michael Cuddyer","Todd Helton"]},
						{"p":"Detroit Tigers","v":"detroit_tigers", "img":"mlbhats/detroit_tigers_home_47_franchise_cap5.jpg", "catlink":"#!category/.mlb.detroit_tigers/Detroit%20Tigers", "players" : ["Justin Verlander","Max Scherzer","Miguel Cabrera"]},
						{"p":"Houston Astros","v":"houston_astros", "img":"mlbhats/houston_astros_adjustable_clean_up_hat8.jpg", "catlink":"#!category/.mlb.houston_astros/Houston%20Astros", "players" : ["Dexter Fowler","Kevin Chapman","Scott Feldman"]},
						{"p":"Kansas City Royals","v":"kansas_city_royals", "img":"mlbhats/kansas_city_royals_game_47_franchise_cap6.jpg", "catlink":"#!category/.mlb.kansas_city_royals/Kansas%20City%20Royals", "players" : ["Billy Butler","Eric Hosmer","Mike Moustakas"]},
						{"p":"L.A. Angels of Anaheim","v":"la_angels_of_anaheim", "img":"mlbhats/los_angeles_angels_of_anaheim_game_47_franchise_cap.jpg", "catlink":"#!category/.mlb.los_angeles_angels/L.A.%20Angels%20of%20Anaheim", "players" : ["Albert Pujols","C.J. Wilson","Josh Hamilton"]},
						{"p":"Los Angeles Dodgers","v":"los_angeles_dodgers", "img":"mlbhats/los_angeles_dodgers_royal_franchise_cap5.jpg", "catlink":"#!category/.mlb.los_angeles_dodgers/Los%20Angeles%20Dodgers", "players" : ["Adrian Gonzalez","Clayton Kershaw","Yasiel Puig"]},
						{"p":"Miami Marlins","v":"miami_marlins", "img":"mlbhats/miami_marlins_game_47_franchise_cap.jpg", "catlink":"#!category/.mlb.miami_marlins/Miami%20Marlins", "players" : ["Saltalamacchia","Justin Ruggiano","Ty Wigginton"]},
						{"p":"Milwaukee Brewers","v":"milwaukee_brewers", "img":"mlbhats/milwaukee_brewers_franchise_cap5.jpg", "catlink":"#!category/.mlb.milwaukee_brewers/Milwaukee%20Brewers", "players" : ["Matt Garza","Rickie Weeks","Ryan Braun"]},
						{"p":"Minnesota Twins","v":"minnesota_twins", "img":"mlbhats/minnesota_twins_alternate_47_franchise_cap6.jpg", "catlink":"#!category/.mlb.minnesota_twins/Minnesota%20Twins", "players" : ["Brian Dozier","Jason Kubel","Joe Mauer"]},
						{"p":"New York Mets","v":"new_york_mets", "img":"mlbhats/new_york_mets_game_47_franchise_cap6.jpg", "catlink":"#!category/.mlb.new_york_mets/New%20York%20Mets", "players" : ["Curtis Granderson","Daniel Murphy","David Wright"]},
						{"p":"New York Yankees","v":"new_york_yankees", "img":"mlbhats/new_york_yankees_game_47_franchise_cap6.jpg", "catlink":"#!category/.mlb.new_york_yankees/New%20York%20Yankees", "players" : ["Derek Jeter","Ichiro Ichiro","Masahiro Tanaka"]},
						{"p":"Oakland Athletics","v":"oakland_athletics", "img":"mlbhats/oakland_athletics_road_47_franchise_cap6.jpg", "catlink":"#!category/.mlb.oakland_athletics/Oakland%20Athletics", "players" : ["Eric Sogard","Jed Lowrie","Yoenis Cespedes"]},
						{"p":"Philadelphia Phillies","v":"philadelphia_phillies", "img":"mlbhats/philadelphia_phillies_adjustable_clean_up_hat5.jpg", "catlink":"#!category/.mlb.philadelphia_phillies/Philadelphia%20Phillies", "players" : ["Cliff Lee","Cole Hamels","Ryan Howard"]},
						{"p":"Pittsburgh Pirates","v":"pittsburgh_pirates", "img":"mlbhats/pittsburgh_pirates_adjustable_clean_up_hat8.jpg", "catlink":"#!category/.mlb.pittsburgh_pirates/Pittsburgh%20Pirates", "players" : ["Andrew McCutchen","Gerrit Cole","Jeff Locke"]},
						{"p":"San Diego Padres","v":"san_diego_padres", "img":"mlbhats/san_diego_padres_game_47_franchise_cap6.jpg", "catlink":"#!category/.mlb.san_diego_padres/San%20Diego%20Padres", "players" : ["Cameron Maybin","Cory Luebke","Everth Cabrera"]},
						{"p":"San Francisco Giants","v":"san_francisco_giants", "img":"mlbhats/san_francisco_giants_black_franchise_cap6.jpg", "catlink":"#!category/.mlb.san_francisco_giants/San%20Francisco%20Giants", "players" : ["Brandon Belt","Brandon Crawford","Marco Scutaro"]},
						{"p":"Seattle Mariners","v":"seattle_mariners", "img":"mlbhats/seattle_mariners_game_47_franchise_cap7.jpg", "catlink":"#!category/.mlb.seattle_mariners/Seattle%20Mariners", "players" : ["Justin Smoak","Kyle Seager","Robinson Cano"]},
						{"p":"St. Louis Cardinals","v":"st_louis_cardinals", "img":"mlbhats/st__louis_cardinals_scarlet_franchise_cap6.jpg", "catlink":"#!category/.mlb.st_louis_cardinals/St.%20Louis%20Cardinals", "players" : ["Adam Wainwright","Chris Carpenter","Jason Motte"]},
						{"p":"Tampa Bay Rays","v":"tampa_bay_rays", "img":"mlbhats/tampa_bay_rays_game_47_franchise_cap6.jpg", "catlink":"#!category/.mlb.tampa_bay_rays/Tampa%20Bay%20Rays", "players" : ["Ben Zobrist","David Price","Evan Longoria"]},
						{"p":"Texas Rangers","v":"texas_rangers", "img":"mlbhats/texas_rangers_adjustable_clean_up_hat5.jpg", "catlink":"#!category/.mlb.texas_rangers/Texas%20Rangers", "players" : ["Adrian Beltre","Michael Young","Prince Fielder"]},
						{"p":"Toronto Blue Jays","v":"toronto_blue_jays", "img":"mlbhats/toronto_blue_jays_game_47_franchise_cap6.jpg", "catlink":"#!category/.mlb.toronto_blue_jays/Toronto%20Blue%20Jays", "players" : ["Jose Bautista","Mark Buehrle","Roy Halladay"]},
						{"p":"Washington Nationals","v":"washington_nationals", "img":"mlbhats/washington_nationals_game_47_franchise_cap7.jpg", "catlink":"#!category/.mlb.washington_nationals/Washington%20Nationals", "players" : ["Adam Laroche","Bryce Harper","Tyler Clippard"]}],
			'app_nfl' : [{"p":"Arizona Cardinals","v":"arizona_cardinals", "img":"nfl/arizona_carinals_cap2.jpg"},
						{"p":"Atlanta Falcons","v":"atlanta_falcons", "img":"nfl/atlanta_falcons_cap.jpg"},
						{"p":"Baltimore Ravens","v":"baltimore_ravens", "img":"nfl/baltimore_orioles_cap.jpg"},
						{"p":"Buffalo Bills","v":"buffalo_bills", "img":"nfl/buffalo_bills_cap.jpg"},
						{"p":"Carolina Panthers","v":"carolina_panthers", "img":"nfl/carolina_panthers_cap.jpg"},
						{"p":"Chicago Bears","v":"chicago_bears", "img":"nfl/chicago_bears_cap.jpg"},
						{"p":"Cincinnati Bengals","v":"cincinnati_bengals", "img":"nfl/cincinnati_bengals_cap.jpg"},
						{"p":"Cleveland Browns","v":"cleveland_browns", "img":"nfl/cleveland_browns_cap.jpg"},
						{"p":"Dallas Cowboys","v":"dallas_cowboys", "img":"nfl/dallas_cowboys_cap.jpg"},
						{"p":"Denver Broncos","v":"denver_broncos", "img":"nfl/denver_broncos_cap.jpg"},
						{"p":"Detroit Lions","v":"detroit_lions", "img":"nfl/detroit_lions_cap.jpg"},
						{"p":"Green Bay Packers","v":"green_bay_packers", "img":"nfl/green_bay_packers_cap.jpg"},
						{"p":"Houston Texans","v":"houston_texans", "img":"nfl/houston_texas_cap.jpg"},
						{"p":"Indianapolis Colts","v":"indianapolis_colts", "img":"nfl/indianapolis_colts_cap.jpg"},
						{"p":"Jacksonville Jaguars","v":"jacksonville_jaguars", "img":"nfl/jacksonville_jaguars_cap.jpg"},
						{"p":"Kansas City Chiefs","v":"kansas_city_chiefs", "img":"nfl/kansas_city_chiefs_cap.jpg"},
						{"p":"Miami Dolphins","v":"miami_dolphins", "img":"nfl/miami_dolphins_cap.jpg"},
						{"p":"Minnesota Vikings","v":"minnesota_vikings", "img":"nfl/minnesota_vikings_cap.jpg"},
						{"p":"New England Patriots","v":"new_england_patriots", "img":"nfl/new_england_patriots_cap.jpg"},
						{"p":"New York Giants","v":"new_york_giants", "img":"nfl/new_york_giants_cap.jpg"},
						{"p":"New Orleans Saints","v":"new_orleans_saints", "img":"nfl/new_orleans_saints_cap.jpg"},
						{"p":"New York Jets","v":"new_york_jets", "img":"nfl/new_york_jets_cap.jpg"},
						{"p":"Oakland Raiders","v":"oakland_raiders", "img":"nfl/oakland_raiders_cap.jpg"},
						{"p":"Philadelphia Eagles","v":"philadelphia_eagles", "img":"nfl/philadelphia_eagles_cap2.jpg"},
						{"p":"Pittsburgh Steelers","v":"pittsburgh_steelers", "img":"nfl/pittsburgh_steelers_cap.jpg"},
						{"p":"San Diego Chargers","v":"san_diego_chargers", "img":"nfl/san_diego_chargers_cap2.jpg"},
						{"p":"San Francisco 49ers","v":"san_francisco_49ers", "img":"nfl/san_francisco_49ers_cap.jpg"},
						{"p":"Seattle Seahawks","v":"seattle_seahawks", "img":"nfl/seattle_seahawks_cap.jpg"},
						{"p":"St. Louis Rams","v":"st_louis_rams", "img":"nfl/st_louis_rams_cap.jpg"},
						{"p":"Tampa Bay Buccaneers","v":"tampa_bay_buccaneers", "img":"nfl/tampa_bay_buccaneers_cap.jpg"},
						{"p":"Tennessee Titans","v":"tennessee_titans", "img":"nfl/tennessee_titans_cap.jpg"},
						{"p":"Washington Redskins","v":"washington_redskins", "img":"nfl/washington_redskins_cap.jpg"}],
			'app_nhl' : [{"p":"Anaheim Ducks","v":"anaheim_ducks", "img":"nhlhats/anaheim_ducks_hat.jpg"},
						{"p":"Boston Bruins","v":"boston_bruins", "img":"nhlhats/boston_bruins_hat.jpg"},
						{"p":"Buffalo Sabres","v":"buffalo_sabres", "img":"nhlhats/buffalo_sabres_hat.jpg"},
						{"p":"Calgary Flames","v":"calgary_flames", "img":"nhlhats/calgary_flames_hat.jpg"},
						{"p":"Carolina Hurricanes","v":"carolina_hurricanes", "img":"nhlhats/carolina_hurricanes_hat.jpg"},
						{"p":"Chicago Blackhawks","v":"chicago_blackhawks", "img":"nhlhats/chicago_blackhawks_hat.jpg"},
						{"p":"Colorado Avalanche","v":"colorado_alavanche", "img":"nhlhats/colorado_avalanche_hat.jpg"},
						{"p":"Columbus Blue Jackets","v":"columbus_blue_jackets", "img":"nhlhats/columbus_blue_jackets_hat.jpg"},
						{"p":"Dallas Stars","v":"dallas_stars", "img":"nhlhats/dallas_stars_hat.jpg"},
						{"p":"Detroit Red Wings","v":"detroit_red_wings", "img":"nhlhats/detroit_red_wings_hat.jpg"},
						{"p":"Edmonton Oilers","v":"edmonton_oilers", "img":"nhlhats/edmonton_oilers_hat.jpg"},
						{"p":"Florida Panthers","v":"florida_panthers", "img":"nhlhats/florida_panthers_hat.jpg"},
						{"p":"Los Angeles Kings","v":"los_angeles_kings", "img":"nhlhats/los_angeles_kings_hat.jpg"},
						{"p":"Minnesota Wild","v":"minnesota_wild", "img":"nhlhats/minnesota_wild_hat.jpg"},
						{"p":"Montreal Canadiens","v":"montreal_canadiens", "img":"nhlhats/montreal_canadiens_hat.jpg"},
						{"p":"Nashville Predators","v":"nashville_predators", "img":"nhlhats/nashville_predators_hat.jpg"},
						{"p":"New Jersey Devils","v":"new_jersey_devils", "img":"nhlhats/new_jersey_devils_hat.jpg"},
						{"p":"New York Islanders","v":"new_york_islanders", "img":"nhlhats/new_york_islanders_hat.jpg"},
						{"p":"New York Rangers","v":"new_york_rangers", "img":"nhlhats/new_york_rangers_hat1.jpg"},
						{"p":"Ottawa Senators","v":"ottawa_senators", "img":"nhlhats/ottawa_senators_hat.jpg"},
						{"p":"Philadelphia Flyers","v":"philadelphia_flyers", "img":"nhlhats/philadelphia_flyers_hat.jpg"},
						{"p":"Phoenix Coyotes","v":"phoenix_coyotes", "img":"nhlhats/phoenix_coyotes_hat.jpg"},
						{"p":"Pittsburgh Penguins","v":"pittsburgh_penguins", "img":"nhlhats/pittsburgh_penguins_hat.jpg"},
						{"p":"San Jose Sharks","v":"san_jose_sharks", "img":"nhlhats/san_jose_sharks_hat.jpg"},
						{"p":"St. Louis Blues","v":"st_louis_blues", "img":"nhlhats/st__louis_blues_hat.jpg"},
						{"p":"Tampa Bay Lightning","v":"tampa_bay_lightning", "img":"nhlhats/tampa_bay_lightning_hat.jpg"},
						{"p":"Toronto Maple Leafs","v":"toronto_maple_leafs", "img":"nhlhats/toronto_maple_leafs_hat.jpg"},
						{"p":"Vancouver Canucks","v":"vancouver_canucks", "img":"nhlhats/vancouver_canucks_hat.jpg"},
						{"p":"Washington Capitals","v":"washington_capitals", "img":"nhlhats/washington_capitals_hat.jpg"},
						{"p":"Winnipeg Jets","v":"winnipeg_jets", "img":"nhlhats/winnipeg_jets_hat.jpg"}],
				},


staticData : {
"fieldcam" : {
"cam1" : '<iframe width="650" scrolling="no" height="366" frameborder="0" src="http://www.earthcam.com/js/cubworld.php" marginwidth="0" marginheight="0"></iframe>',
"cam2" : '<object width="600" height="480" align="middle" id="metro_cam_player_01" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=7,0,0,0" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"><param value="sameDomain" name="allowScriptAccess"><param value="http://www.earthcam.com/swf/dotcom_live_viewer_multi_size.swf?http://images.earthcam.com/ec_metros/ourcams/rosensports.jpg,50,1000" name="movie"><param value="high" name="quality"><param value="#000000" name="bgcolor"><embed width="600" height="480" align="middle" pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash" allowscriptaccess="sameDomain" name="metro_cam_player_01" bgcolor="#000000" quality="high" src="http://www.earthcam.com/swf/dotcom_live_viewer_multi_size.swf?http://images.earthcam.com/ec_metros/ourcams/rosensports.jpg,50,1000"></object>'
}
}
} //r object.
return r;
}
