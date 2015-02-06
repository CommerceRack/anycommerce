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
		customPrompt : {
			"popup1" : "I understand it takes 3-14 business days to customize my item. This item is not returnable / exchangeable as it is considered customized. Once this order is placed, no changes or cancellations are permitted.",
			"popup2" : "I understand it may take 1-2 business days to customize my Chicago Cubs or Chicago Blackhawks item. This item is not returnable / exchangeable as it is considered customized. Once this order is placed, no changes or cancellations are permitted."
			},
		elasticFields : {},
		elasticFieldsLoaded : false,
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

				var userTeam = _app.model.readLocal('swcUserTeam');
				if(document.location.search.indexOf("team=") >= 0){
					var p = _app.u.kvp2Array(document.location.search.substr(1));
					_app.ext.store_swc.u.setUserTeam({sport:p.sport,team:p.team}, true);
					}
				else if(userTeam){
					_app.ext.store_swc.u.setUserTeam(userTeam, true);
					}
				else {
					_app.ext.store_swc.u.setUserTeam({sport:'app_mlb',team:'chicago_cubs'}, true);
					$('#globalMessaging').anymessage({'message' : "It looks like this is your first time here!  We've set your team to the Chicago Cubs, but you can follow a different team <a href='#' onClick='return false;' data-app-click='store_swc|showMyTeamChooser'>here!</a>", timeout:30000});
					}
				_app.ext.store_swc.u.renderMyTeams();
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
				
				for(var sport in _app.ext.store_swc.validTeams){
					for(var teamIndex in _app.ext.store_swc.validTeams[sport]){
						var team = _app.ext.store_swc.validTeams[sport][teamIndex];
						for(var filterIndex in team.filters){
							var hash = "#!filter/"+team.filters[filterIndex].id+"/?team="+team.v+"&sport="+sport;
							if(sport == "app_mlb")
							_app.ext.seo_robots.vars.pages.push(hash);
							}
						}
					}
				
				
				
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
				_app.ext.store_swc.vars.elasticFieldsLoaded = true;
				},
			onError : function(){}
			},
		handleEmptyResults : {
			onSuccess : function(rd){
				var L = _app.data[rd.datapointer]['_count'] || _app.data[rd.datapointer].hits.hits.length;
				if(L > 0){
					_app.ext.prodlist_infinite.callbacks.handleInfiniteElasticResults.onSuccess(rd);
					}
				else {
					rd.list.empty();
					rd.list.tlc({'dataset':'', 'templateid':'noResultsTemplate', 'verb':'transmogrify'});
					if(rd.deferred){
						rd.deferred.resolve();
						}
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
			resolvedeferred : function(data,thisTLC){
				var deferred = data.globals.binds[data.globals.focusBind];
				if(deferred && typeof deferred.resolve === 'function'){
					deferred.resolve();
					return true;
					}
				else{
					return false;
					}
				},
			sdomain : function(data,thisTLC){
				data.globals.binds[data.globals.focusBind] = zGlobals.appSettings.sdomain;
				},
			producttag : function(data,thisTLC){
				var tag = data.globals.binds[data.globals.focusBind];
				var tagphrase = "";
				switch(tag){
					case "IS_FRESH":
						tagphrase = "NEW";
						break;
					case "IS_BESTSELLER":
						tagphrase = "HOT";
						break;
					case "IS_USER1":
						tagphrase = "YOUTH";
						break;
					case "IS_SALE":
						tagphrase = "SALE";
						break;
					case "IS_SPECIALORDER":
						tagphrase = "CUSTOM";
						break;
					case "IS_PREORDER":
						tagphrase = "PREORDER";
						break;
					case "IS_DISCONTINUED":
					case "IS_OUTOFSTOCK":
						tagphrase = "ALL GONE";
						break;
					case "IS_SHIPFREE":
						tagphrase = "FREE SHIPPING";
						break;
					
					}
				data.globals.binds[data.globals.focusBind] = tagphrase;
				return tagphrase;
				},
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
			leaguefilteranchor : function(data,thisTLC){
				dump(data);
				var href = "/filter/"+data.value.id+"/?sport="+data.value.sport+"&team="+data.value.team;
				data.globals.binds[data.globals.focusBind] = href;
				return true;
				},
			leagueanchor : function(data,thisTLC){
				var navcat = data.globals.binds[data.globals.focusBind].substr(1);
				navcat = navcat.split('.');
				if(navcat.length == 2){
					var href = "/";
					if(navcat[0] == 'mlb'){
						href += "major_league_baseball/";
						}
					else if(navcat[0] == "nfl_teams"){
						href += "national_football_league/";
						}
					else{
						return false;
						}
					href += navcat[1] + "/";
					data.globals.binds[data.globals.focusBind] = href;
					return true;
					}
				return false;
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
				data.globals.binds[data.globals.focusBind] = "/filter/"+id+"/"
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
				
				var pid = data.value.pid;
				
				var search = {
					"query" : {
						"filtered" : {
							"filter" : {
								"not" : {
									"term" : {"pid": pid}
									}
								},
							"query" : {
								"more_like_this" : {
									"fields" : ["prod_name", "keywords", "description"],
									"like_text" : lt
									}
								}
							}
						}
					}
				var _tag = {
					"callback":"handleElasticResults",
					"datapointer":"relatedProducts|"+data.value.pid,
					"extension":"store_search",
					"list":data.globals.tags[data.globals.focusTag],
					"templateID":"productListTemplateRelatedResults"
					}
				es = _app.ext.store_search.u.buildElasticRaw(search);
				es.size = 5;
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
			schemaavailability : function(data, thisTLC){
				// dump(_app.ext.store_product.u.productIsPurchaseable(data.globals.binds[data.globals.focusBind]));
				if(_app.ext.store_product.u.productIsPurchaseable(data.globals.binds[data.globals.focusBind])){
					data.globals.binds[data.globals.focusBind] ="http://schema.org/InStock";
					}
				else {
					data.globals.binds[data.globals.focusBind] ="http://schema.org/OutOfStock";
					}
				// dump(data.globals.binds[data.globals.focusBind]);
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
			applyGTS : function(){
				$('#gts-o-domain').html(window.location.hostname);
				postscribe('#appView', '<script type="text/javascript">'+_app.templates.gtsscript.html()+'</script>');
				
				},
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
			setUserTeam : function(team, homepageOverride){
				var fullTeamObj = $.grep(_app.ext.store_swc.validTeams[team.sport], function(e, i){ return e.v == team.team})[0];
				if(fullTeamObj){
					_app.ext.store_swc.vars.userTeam = $.extend(true, {"checked":"checked", "sport":team.sport}, fullTeamObj);
					this.saveUserTeam(team, homepageOverride);
					}
				else {
					_app.u.throwMessage(_app.u.errMsgObject("An error has occured- could not set user team to: "+team.team));
					}
				},
			promptUserTeam : function(team){
				var fullTeamObj = $.grep(_app.ext.store_swc.validTeams[team.sport], function(e, i){ return e.v == team.team})[0];
				team.prompt = team.prompt || 'Do you want to set your team to the <span class="redText">'+fullTeamObj.p+'</span>?';
				
				var $promptContainer = $('#myTeamChooser .myTeamPromptContainer');
				$promptContainer.tlc({verb:'transmogrify', dataset:team, templateid:$promptContainer.attr('data-templateid')});
				$('.dismiss', $promptContainer).button({"text":"No Thanks"});
				$('.accept', $promptContainer).button({"text":"OK"});
				$('#myTeamChooser').addClass('active');
				_app.ext.store_swc.u.lazyload($('#myTeamChooser'));
				$('#myTeamChooser').addClass('prompt');
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
			saveUserTeam : function(team, homepageOverride){
				$('#appView .filteredSearchPage').closest('[data-app-uri]').each(function(){
					$(this).intervaledEmpty().remove();
					}); //These will all need to be re-rendered with the new teams.  This is a bit of a heavy handed approach that could be tuned later.
				if($('#appView #mainContentArea :visible').length < 1 && !homepageOverride){
					_app.router.handleURIChange('/');
					}
				_app.require('templates.html',function(){
					$('#appView #headerTeam').empty().tlc({'verb':'transmogrify','dataset':_app.ext.store_swc.vars.userTeam, 'templateid':$('#appView #headerTeam').attr('data-templateid')});
					});
				
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
			prodToggleTags : function($ele,e){
				$ele.closest('.productTagsContainer').toggleClass('collapsed');
				},
			checkoutOptionsShow : function($ele, e){
				var $cbc = $ele.closest('.cartButtonContainer');
				$('.optionContainer.cartOptions', $cbc).hide();
				$('.optionContainer.checkoutOptions', $cbc).show();
				},
			addCoupon : function($ele, e){
				_app.ext.cco.calls.cartCouponAdd.init($('input[name=coupon]',$ele).val(),_app.model.fetchCartID(),{"callback":function(rd){
					if(_app.model.responseHasErrors(rd)){
						_app.u.throwMessage(rd);
						}
					else{
						_app.u.throwMessage(_app.u.successMsgObject('Your coupon has been added.'));
						}
					}});
				$ele.closest("[data-template-role='cart']").trigger('fetch',{'Q':'immutable'});
				_app.model.dispatchThis('immutable');
				},
			showRMAForm : function($ele, e){
				dump('showing rma form');
				e.preventDefault();
				_app.ext.store_swc.u.showRMAForm();
				},
			execFilteredSearch : function($form, p){
				p.preventDefault();
				var loadFullList = $form.data('loadFullList');
				var deferred = $form.data('deferred') || {resolve:function(){}};
				dump("Executing Filtered Search");
				if(loadFullList){
					_app.ext.store_swc.vars.filterLoadingComplete = false;
					}
				else {
					_app.ext.store_swc.vars.filterLoadingComplete = true;
					}
				$('.filterList',$form.closest('.filteredSearchPage')).removeClass('active');
				$form = $form.closest('form');
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
				if(loadFullList){
					es.size = 200;
					es.timeout = 60;
					}
				else{
					es.size = 30;
					}
				$resultsContainer.empty();
				_app.ext.store_search.u.updateDataOnListElement($resultsContainer,_app.u.getBlacklistedObject(es, ["facets"]),1);
				_app.model.dispatchThis();
				_app.ext.store_search.calls.appPublicSearch.init(es, {'callback':function(rd){
					if(_app.model.responseHasErrors(rd)){
						_app.u.throwMessage(rd);
						}
					else {
						_app.ext.store_swc.callbacks.handleEmptyResults.onSuccess(rd);
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
					}, 'deferred':deferred, 'require':['store_prodlist','prodlist_infinite'],'datapointer':'appFilteredSearch','templateID':'productListTemplateResults','list':$resultsContainer, 'filterList' : $form, 'loadFullList' : loadFullList});
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
				$('.closeSelectedTeamButton', $selectedContainer).button({'icons':{"primary":"ui-icon-closethick"}, "text":false});
				$('#myTeamChooser').removeClass('prompt');
				$('#myTeamChooser').addClass('selected');
				},
			promptUserTeam : function($ele, p){
				p.preventDefault();
				var team = {
					team : $ele.attr('data-swc-team'),
					sport : $ele.attr('data-swc-sport')
					};
				_app.ext.store_swc.u.promptUserTeam(team);
				},
			dismissSelectedTeamMsg : function($ele, p){
				p.preventDefault();
				$('#myTeamChooser').removeClass('selected');
				},
			dismissPrompt : function($ele, p){
				p.preventDefault();
				$('#myTeamChooser').removeClass('prompt');
				},
			productAdd2Cart : function($form, p){
				p.preventDefault();
				if($form.attr('data-swc-custom-notice')){
					var $notice = $('<div><div>'+_app.ext.store_swc.vars.customPrompt[$form.attr('data-swc-custom-notice')]+'</div></div>');
						
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
				if($('#appView').hasClass('initFooter')){
					$('#appView').removeClass('initFooter');
					}
				else {
					$('#appView').toggleClass('showFooter');
					}
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
				seo_title : "100 Years of Wrigley Field",
				seo_description : "This year marks the 100th anniversary of Wrigley Field! Satisfy all your Chicago Cubs memorabilia needs!",
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
			'all_team_hats' : {
				noteams : true,
				title : "Hats for All Teams",
				seo_title : "Hats for All Teams",
				seo_description : "",
				baseFilter : {
					"term" : {"app_department":"hat"}
					},
				optionList : [
					"user:app_prod_demographic",
					"user:app_sub_department",
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
					//var team = "chicago_blackhawks";
					//_app.ext.store_swc.u.setUserTeam({sport:'app_nhl',team:'chicago_blackhawks'});
					_app.u.throwMessage(_app.u.successMsgObject('Would you like to change your team to the <span class="redText">Chicago Blackhawks</span>? <span class="pointer" data-app-click="store_swc|promptUserTeam" data-swc-team="chicago_blackhawks" data-swc-sport="app_nhl">Click here!</span>'));
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
			'bears' : {
				title : "Chicago Bears",
				onEnter : function(){
					//var team = "chicago_blackhawks";
					//_app.ext.store_swc.u.setUserTeam({sport:'app_nhl',team:'chicago_blackhawks'});
					_app.u.throwMessage(_app.u.successMsgObject('Would you like to change your team to the <span class="redText">Chicago Bears</span>? <span class="pointer" data-app-click="store_swc|promptUserTeam" data-swc-team="chicago_bears" data-swc-sport="app_nfl">Click here!</span>'));
					},
				noteams : true,
				baseFilter : {
					"term" : {"app_nfl":"chicago_bears"}
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
				titleBuilder : function(teamName){
					var str = teamName+" T-Shirts - Mens, Womens";
					return str;
					},
				descriptionBuilder : function(teamName){
					var str = "<h3>"+teamName+" T-Shirts - Mens, Womens & Youth</h3>"
							+ "<p>"+teamName+" fans come from all walks of life and in all shapes and sizes, so we have an expansive "+teamName+" t-shirts collection to match this diversity. The unifying factor: an unwavering love for the "+teamName+".  Our "+teamName+" t-shirts collection includes long-sleeve shirts, short-sleeve and jersey-style varieties. </p>"
							+ "<p>While we carry a ton of shirts for women and men, we can`t forget our little budding "+teamName+" fans-browse our kids shirts section for youth or toddler-sized gear. With SportsWorld`s "+teamName+" t-shirt options, you can truly outfit the whole family.</p>"
							+ "<h3>Ordering Online & Size Questions</h3>"
							+ "<p>Unsure how to place your order for your "+teamName+" t-shirts?  You`ve got a few easy options!  Just give us a call at 844-462-4422 and one of our friendly staff members will be able answer any questions about our products, shipping costs, return policy, as well as process your order.  You can also make your purchase right here online through our website's shopping cart system.  It's a fast, simple way to send us your order, and any order we receive before 2 pm CST will be shipped the same day.</p>"
					return str;
					},
				metaDescriptionBuilder : function(teamName){
					var str = "Authentic "+teamName+" Home, Road, Alternate and Personalized jerseys. "
							+ "If you ask us, no "+teamName+" fan has a complete attire selection without an authentic "+teamName+" jersey.  And SportsWorldChicago.com is the perfect place to pick one up, whether you're looking for an adult, youth jersey or an authentic, home, away or personalized jersey. We carry a wide selection for fans to choose from, with a mix of current "+teamName+" jerseys, as well as some throwback designs that pay homage to the "+teamName+" of yesteryear. "
					return str;
					},
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
				titleBuilder : function(teamName){
					var str = "Shop "+teamName+" Jerseys";
					return str;
					},
				descriptionBuilder : function(teamName){
					var str = "<h3>Authentic "+teamName+" Home, Road, Alternate and Personalized jerseys</h3>"
							+ "<p>If you ask us, no "+teamName+" fan has a complete attire selection without an authentic "+teamName+" jersey.  And SportsWorldChicago.com is the perfect place to pick one up, whether you're looking for an adult, youth jersey or an authentic, home, away or personalized jersey. We carry a wide selection for fans to choose from, with a mix of current "+teamName+" jerseys, as well as some throwback designs that pay homage to the "+teamName+" of yesteryear. </p>"
							+ "<p>At SportsWorldChicago.com, you have the option to personalize a "+teamName+" jersey with your own name or to even customize it with your favorite player's name. You name it...Any "+teamName+", any jersey style, totally your choice. </p>"
							+ "<h3>Ordering Online & Size Questions</h3>"
							+ "<p>Unsure how to place your order for your "+teamName+" jerseys?  You`ve got a few easy options!  Just give us a call at 844-462-4422 and one of our friendly staff members will be able answer any questions about our products, shipping costs, return policy, as well as process your order.  You can also make your purchase right here online through our website's shopping cart system.  It's a fast, simple way to send us your order, and any order we receive before 2 pm CST will be shipped the same day.</p>"
					return str;
					},
				metaDescriptionBuilder : function(teamName){
					var str = "Authentic "+teamName+" Home, Road, Alternate and Personalized jerseys. "
							+ "If you ask us, no "+teamName+" fan has a complete attire selection without an authentic "+teamName+" jersey.  And SportsWorldChicago.com is the perfect place to pick one up, whether you're looking for an adult, youth jersey or an authentic, home, away or personalized jersey. We carry a wide selection for fans to choose from, with a mix of current "+teamName+" jerseys, as well as some throwback designs that pay homage to the "+teamName+" of yesteryear. "
					return str;
					},
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
				titleBuilder : function(teamName){
					var str = "Shop "+teamName+" Personalized Jerseys";
					return str;
					},
				descriptionBuilder : function(teamName){
					var str = "<h3>Authentic "+teamName+" Home, Road, Alternate and Personalized jerseys</h3>"
							+ "<p>If you ask us, no "+teamName+" fan has a complete attire selection without an authentic "+teamName+" jersey.  And SportsWorldChicago.com is the perfect place to pick one up, whether you're looking for an adult, youth jersey or an authentic, home, away or personalized jersey. We carry a wide selection for fans to choose from, with a mix of current "+teamName+" jerseys, as well as some throwback designs that pay homage to the "+teamName+" of yesteryear. </p>"
							+ "<p>At SportsWorldChicago.com, you have the option to personalize a "+teamName+" jersey with your own name or to even customize it with your favorite player's name. You name it...Any "+teamName+", any jersey style, totally your choice. </p>"
							+ "<h3>Ordering Online & Size Questions</h3>"
							+ "<p>Unsure how to place your order for your "+teamName+" jerseys?  You`ve got a few easy options!  Just give us a call at 844-462-4422 and one of our friendly staff members will be able answer any questions about our products, shipping costs, return policy, as well as process your order.  You can also make your purchase right here online through our website's shopping cart system.  It's a fast, simple way to send us your order, and any order we receive before 2 pm CST will be shipped the same day.</p>"
					return str;
					},
				metaDescriptionBuilder : function(teamName){
					var str = "Authentic "+teamName+" Home, Road, Alternate and Personalized jerseys. "
							+ "If you ask us, no "+teamName+" fan has a complete attire selection without an authentic "+teamName+" jersey.  And SportsWorldChicago.com is the perfect place to pick one up, whether you're looking for an adult, youth jersey or an authentic, home, away or personalized jersey. We carry a wide selection for fans to choose from, with a mix of current "+teamName+" jerseys, as well as some throwback designs that pay homage to the "+teamName+" of yesteryear. "
					return str;
					},
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
				titleBuilder : function(teamName){
					var str = teamName+" Sweatshirts & Jackets";
					return str;
					},
				descriptionBuilder : function(teamName){
					var str = "<h3>Cozy "+teamName+" Sweatshirts for Women, Men, and Children</h3>"
							+ "<p>We`ve all been there: those early season games, still a heavy chill in the air, and wind whipping through the Stadium...Brrr!  But have no fear; you can keep yourself warm and your allegiances known with our huge selection of "+teamName+" sweatshirts.  Plus, this way you can support the "+teamName+" year-round AND they make a great warm and fuzzy holiday gift.  Choose from unique men`s, kids`, or women’s "+teamName+" sweatshirts and keep on keeping the faith-there`s always next year!</p>"
							+ "<h3>Ordering Online & Size Questions</h3>"
							+ "<p>Unsure how to place your order for your "+teamName+" sweatshirts?  You`ve got a few easy options!  Just give us a call at 844-462-4422 and one of our friendly staff members will be able answer any questions about our products, shipping costs, return policy, as well as process your order.  You can also make your purchase right here online through our website's shopping cart system.  It's a fast, simple way to send us your order, and any order we receive before 2 pm CST will be shipped the same day.</p>"
					return str;
					},
				metaDescriptionBuilder : function(teamName){
					var str = "Cozy "+teamName+" Sweatshirts for Women, Men, and Children. "
							+ "We`ve all been there: those early season games, still a heavy chill in the air, and wind whipping through the Stadium...Brrr!  But have no fear; you can keep yourself warm and your allegiances known with our huge selection of "+teamName+" sweatshirts.  Plus, this way you can support the "+teamName+" year-round AND they make a great warm and fuzzy holiday gift.  Choose from unique men`s, kids`, or women’s "+teamName+" sweatshirts and keep on keeping the faith-there`s always next year!"
					return str;
					},
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
				titleBuilder : function(teamName){
					var str = "Fitted & Adjustable "+teamName+" Caps & Hats";
					return str;
					},
				descriptionBuilder : function(teamName){
					var str = "<h3>"+teamName+" Adjustable and Fitted Baseball Caps for Men, Women & Children.</h3>"
							+ "<p>Our wide selection of "+teamName+" hats, caps, visors, and winter caps, the cool "+teamName+" headgear options are aplenty. Browse above for "+teamName+" fitted hats, adjustable caps, winter hats, visors, kid and baby hats, and more. So many options, so many games-you might even get a few and never miss an occasion to root your team on in style!  Our caps from New Era, `47 Brand and American Needle are high quality and built to last with solid body construction and features such as moisture wicking. Find the perfect hat that suits your style-at exceptional savings.</p>"
							+ "<h3>Ordering Online & Size Questions.</h3>"
							+ "<p>Unsure how to place your order for your "+teamName+" hats?  You`ve got a few easy options!  Just give us a call at 844-462-4422 and one of our friendly staff members will be able answer any questions about our products, shipping costs, return policy, as well as process your order.  You can also make your purchase right here online through our website's shopping cart system.  It's a fast, simple way to send us your order, and any order we receive before 2 pm CST will be shipped the same day.</p>"
					return str;
					},
				metaDescriptionBuilder : function(teamName){
					var str = teamName+" Adjustable and Fitted Baseball Caps for Men, Women & Children. "
							+ "Our wide selection of "+teamName+" hats, caps, visors, and winter caps, the cool "+teamName+" headgear options are aplenty. Browse below for "+teamName+" fitted hats, adjustable caps, winter hats, visors, kid and baby hats, and more. So many options, so many games-you might even get a few and never miss an occasion to root your team on in style!  Our caps from New Era, `47 Brand and American Needle are high quality and built to last with solid body construction and features such as moisture wicking. Find the perfect hat that suits your style-at exceptional savings."
					return str;
					},
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
				titleBuilder : function(teamName){
					var str = teamName+" Souvenir Shop";
					return str;
					},
				descriptionBuilder : function(teamName){
					var str = "<h3>Get Your Next "+teamName+" Souvenir from SportsWorldChicago.com.</h3>"
							+ "<p>SportsWorldChicago.com carries all the official "+teamName+" souvenirs souvenirs-so you always show your pride even when a trip to a souvenir shop isn`t possible. We have goodies that any diehard fan could want-signs and flags, books, DVDs, games, pet products, jewelry and keychains, home and office products, and even more. If you need a unique idea for that special someone, these also make the perfect "+teamName+" gifts!</p>"
							+ "<h3>Ordering Online & Size Questions.</h3>"
							+ "<p>Unsure how to place your order for your "+teamName+" souvenirs?  You`ve got a few easy options!  Just give us a call at 844-462-4422 and one of our friendly staff members will be able answer any questions about our products, shipping costs, return policy, as well as process your order.  You can also make your purchase right here online through our website's shopping cart system.  It's a fast, simple way to send us your order, and any order we receive before 2 pm CST will be shipped the same day.</p>"
					return str;
					},
				metaDescriptionBuilder : function(teamName){
					var str = "Get Your Next "+teamName+" Souvenir from SportsWorldChicago.com. "
							+ "SportsWorldChicago.com carries all the official "+teamName+" souvenirs souvenirs-so you always show your pride even when a trip to a souvenir shop isn`t possible. We have goodies that any diehard fan could want-signs and flags, books, DVDs, games, pet products, jewelry and keychains, home and office products, and even more. If you need a unique idea for that special someone, these also make the perfect "+teamName+" gifts!"
					return str;
					},
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
			'app_nba' : [{"p": "Atlanta Hawks","v": "atlanta_hawks", "img":"nbahats/atlanta_hawks_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Boston Celtics","v": "boston_celtics", "img":"nbahats/boston_celtics_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Brooklyn Nets","v": "brooklyn_nets", "img":"nbahats/brooklyn_nets_hat1.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Charlotte Bobcats","v": "charlotte_hornets", "img":"nbahats/charlotte_bobcats_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Chicago Bulls","v": "chicago_bulls", "img":"/nbahats/chicago_bulls_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"chicago_bulls_merchandise/2014/chicago_bulls_practice_performance_t_shirt_5"},
								{"id":"jerseys","img":"chicago_bulls_merchandise/bulls_derrick_rose_youth_sizes_8_20_revolution_30_replica_road_jersey"},
								{"id":"sweatshirts","img":"chicagobulls/chicago_bulls_on_court_long_sleeve_shooter"},
								{"id":"hats","img":"chicagobulls/chicago_bulls_structured_flex_fitted_hat"},
								{"id":"souvenirs","img":"game_time/Chicago_Bulls_Mens_Gladiator_Series_Watch"}
							]},
						{"p": "Cleveland Cavaliers","v": "cleveland_cavaliers", "img":"nbahats/cleveland_cavaliers_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Dallas Mavericks","v": "dallas_mavericks", "img":"nbahats/dallas_mavericks_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Denver Nuggets","v": "denver_nuggets", "img":"nbahats/denver_nuggets_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Detroit Pistons","v": "detroit_pistons", "img":"nbahats/detroit_pistons_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Golden State Warriors","v": "golden_state_warriors", "img":"nbahats/golden_state_warriors_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Houston Rockets","v": "houston_rockets", "img":"nbahats/houston_rockets_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Indiana Pacers","v": "indiana_pacers", "img":"nbahats/indiana_pacers_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Los Angeles Clippers","v": "los_angeles_clippers", "img":"nbahats/los_angeles_clippers_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Los Angeles Lakers","v": "los_angeles_lakers", "img":"nbahats/los_angeles_lakers_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Memphis Grizzlies","v": "memphis_grizzlies", "img":"nbahats/memphis_grizzlies_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Miami Heat","v": "miami_heat", "img":"nbahats/miami_heat_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Milwaukee Bucks","v": "milwaukee_bucks", "img":"nbahats/milwaukee_bucks_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Minnesota Timberwolves",	"v": "minnesota_timberwolves", "img":"nbahats/minnesota_timberwolves_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "New Orleans Pelicans","v": "new_orleans_pelicans", "img":"nbahats/new_orleans_pelicans_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "New York Knicks","v": "new_york_knicks", "img":"nbahats/new_york_knicks_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Oklahoma City Thunder",	"v": "oklahoma_city_thunder", "img":"nbahats/oklahoma_city_thunder_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Orlando Magic","v": "orlando_magic", "img":"nbahats/orlando_magic_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Philadelphia 76ers","v": "philadelphia_76ers", "img":"nbahats/philadelphia_76ers_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Phoenix Suns","v": "phoenix_suns", "img":"nbahats/phoenix_suns_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Portland Trailblazers","v": "portland_trailblazers", "img":"nbahats/portland_trailblazers_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Sacramento Kings","v": "sacramento_kings", "img":"nbahats/sacramento_kings_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "San Antonio Spurs","v": "san_antonio_spurs", "img":"nbahats/san_antonio_spurs_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Toronto Raptors","v": "toronto_raptors", "img":"nbahats/toronto_raptors_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Utah Jazz","v": "utah_jazz", "img":"nbahats/utah_jazz_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p": "Washington Wizards","v": "washington_wizards", "img":"nbahats/washington_wizards_hat.jpg", 
							"filters" : [
								//{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								//{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]}],
			'app_mlb' : [{"p":"Arizona Diamondbacks","v":"arizona_diamondbacks", "img":"mlbhats/arizona_diamondbacks_game_47_franchise_cap6.jpg", "catlink":"/category/.mlb.arizona_diamondbacks/Arizona%20Diamondbacks", "players" : ["Brandon McCarthy","Bronson Arroyo","Paul Goldschmidt"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Arizona_Diamondbacks/Arizona_Diamondbacks_Alternate_Red_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								//{"id":"hats","img":"mlbhats/arizona_diamondbacks_game_47_franchise_cap6"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Atlanta Braves","v":"atlanta_braves", "img":"mlbhats/atlanta_braves_home_cap.jpg", "catlink":"/category/.mlb.atlanta_braves/Atlanta%20Braves", "players" : ["Brandon Beachy","Craig Kimbrel","Jason Heyward"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Atlanta_Braves_Navy_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Atlanta_Braves/Atlanta_Braves_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/atlanta_braves_navy_authentic_triple_peak_cool_base_convertible_gamer_jacket2"},
								{"id":"hats","img":"mlbhats/atlanta_braves_home_cap"},
								{"id":"souvenirs","img":"game_time/Atlanta_Braves_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Baltimore Orioles","v":"baltimore_orioles", "img":"mlbhats/baltimore_orioles_alternate_47_franchise_cap6.jpg", "catlink":"/category/.mlb.baltimore_orioles/Baltimore%20Orioles", "players" : ["Adam Jones","Manny Machado","Nick Markakis"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Baltimore_Orioles_Black_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Baltimore_Orioles/Baltimore_Orioles_Alternate_Orange_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/Baltimore_Orioles_Black_Authentic_Triple_Peak_Cool_Base_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/baltimore_orioles_alternate_47_franchise_cap6"},
								{"id":"souvenirs","img":"game_time/Baltimore_Orioles_Mens_All_Pro_Series_Watch"}
							]},
						{
							"p":"Boston Red Sox",
							"v":"boston_red_sox", 
							"img":"mlbhats/boston_red_sox_game_47_franchise_cap6.jpg", 
							"catlink":"/category/.mlb.boston_red_sox/Boston%20Red%20Sox", 
							"players" : ["David Ortiz","Dustin Pedroia","Xander Bogaerts"], 
							"filters" : [
								{"id":"shirts","img":"chicagocubs20143/boston_red_sox_2014_practice_t_shirt"},
								{"id":"jerseys","img":"Boston_Red_Sox/Boston_Red_Sox_Home_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/Boston_Red_Sox_Navy_Authentic_Triple_Climate_3_In_1_On_Field_Jacket"},
								{"id":"hats","img":"mlbhats/boston_red_sox_game_47_franchise_cap6"},
								{"id":"souvenirs","img":"game_time/Boston_Red_Sox_B_Logo_Womens_All_Star_Series_Watch"}
							]
						},
						{"p":"Chicago Cubs","v":"chicago_cubs", "img":"47brand/chicago_cubs_royal_franchise_cap_by__47_brand.jpg", "catlink":"/category/.mlb.chicago_cubs/Chicago%20Cubs", "players" : ["Anthony Rizzo","Jon Lester","Javier Baez"], 
							"filters" : [
								{"id":"shirts","img":"5/chicago_cubs_blue_logo_t_shirt5"},
								{"id":"jerseys","img":"Chicago_Cubs/Chicago_Cubs_Home_Authentic_Jersey"},
								{"id":"sweatshirts","img":"majestic/Chicago_Cubs_Royal_Authentic_Triple_Peak_Cool_Base_Gamer_Jacket"},
								{"id":"hats","img":"47brand/chicago_cubs_royal_franchise_cap_by__47_brand"},
								{"id":"souvenirs","img":"C/1984_flag"}
							]},
						{"p":"Chicago White Sox","v":"chicago_white_sox", "img":"mlbhats/chicago_white_sox_game_47_franchise_cap6.jpg", "catlink":"/category/.mlb.chicago_white_sox/Chicago%20White%20Sox", "players" : ["Chris Sale","Jose Abreu","Paul Konerko"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Chicago_White_Sox_Black_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Chicago_White_Sox/Chicago_White_Sox_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/Chicago_White_Sox_Black_Authentic_Triple_Peak_Cool_Base_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/chicago_white_sox_game_47_franchise_cap6"},
								{"id":"souvenirs","img":"game_time/Chicago_White_Sox_Womens_All_Star_Series_Watch"}
							]},
						{"p":"Cincinnati Reds","v":"cincinnati_reds", "img":"mlbhats/cincinnati_reds_home_47_franchise_cap5.jpg", "catlink":"/category/.mlb.cincinnati_reds/Cincinnati%20Reds", "players" : ["Aroldis Chapman","Brandon Phillips","Joey Votto"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Cincinnati_Reds_Red_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Cincinnati_Reds/Cincinnati_Reds_Alternate_Red_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/Cincinnati_Reds_Red_Authentic_Triple_Peak_Cool_Base_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/cincinnati_reds_home_47_franchise_cap5"},
								{"id":"souvenirs","img":"game_time/Cincinnati_Reds_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Cleveland Indians","v":"cleveland_indians", "img":"mlbhats/cleveland_indians_alternate_road_47_franchise_cap6.jpg", "catlink":"/category/.mlb.cleveland_indians/Cleveland%20Indians", "players" : ["Jason Kipnis","Michael Bourn","Nick Swisher"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Cleveland_Indians_Navy_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Cleveland_Indians/Cleveland_Indians_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/Cleveland_Indians_Navy_Authentic_Triple_Peak_Cool_Base_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/cleveland_indians_alternate_road_47_franchise_cap6"},
								{"id":"souvenirs","img":"game_time/Cleveland_Indians_Womens_All_Star_Series_Watch"}
							]},
						{"p":"Colorado Rockies","v":"colorado_rockies", "img":"mlbhats/colorado_rockies_game_47_franchise_cap5.jpg", "catlink":"/category/.mlb.colorado_rockies/Colorado%20Rockies", "players" : ["Boone Logan","Michael Cuddyer","Todd Helton"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Colorado_Rockies_Black_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Colorado_Rockies/Colorado_Rockies_Road_Replica_Jersey"},
								{"id":"sweatshirts","img":"majestic/Colorado_Rockies_Black_Authentic_Triple_Peak_Cool_Base_Convertible_Gamer_Jacket"},
								//{"id":"hats","img":"mlbhats/colorado_rockies_game_47_franchise_cap5"},
								{"id":"souvenirs","img":"game_time/Colorado_Rockies_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Detroit Tigers","v":"detroit_tigers", "img":"mlbhats/detroit_tigers_home_47_franchise_cap5.jpg", "catlink":"/category/.mlb.detroit_tigers/Detroit%20Tigers", "players" : ["Justin Verlander","Max Scherzer","Miguel Cabrera"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Detroit_Tigers_Navy_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Detroit_Tigers/Detroit_Tigers_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/Detroit_Tigers_Navy_Authentic_Triple_Peak_Cool_Base_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/detroit_tigers_home_47_franchise_cap5"},
								{"id":"souvenirs","img":"game_time/Detroit_Tigers_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Houston Astros","v":"houston_astros", "img":"mlbhats/houston_astros_adjustable_clean_up_hat8.jpg", "catlink":"/category/.mlb.houston_astros/Houston%20Astros", "players" : ["Dexter Fowler","Kevin Chapman","Scott Feldman"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Houston_Astros_Orange_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Houston_Astros/Houston_Astros_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/Houston_Astros_Navy_Authentic_Triple_Climate_3_In_1_On_Field_Jacket"},
								{"id":"hats","img":"mlbhats/houston_astros_adjustable_clean_up_hat8"},
								{"id":"souvenirs","img":"game_time/Houston_Astros_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Kansas City Royals","v":"kansas_city_royals", "img":"mlbhats/kansas_city_royals_game_47_franchise_cap6.jpg", "catlink":"/category/.mlb.kansas_city_royals/Kansas%20City%20Royals", "players" : ["Billy Butler","Eric Hosmer","Mike Moustakas"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Kansas_City_Royals_Royal_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Kansas_City_Royals/Kansas_City_Royals_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/kansas_city_royals_royal_authentic_triple_peak_cool_base_convertible_gamer_jacke"},
								{"id":"hats","img":"mlbhats/kansas_city_royals_game_47_franchise_cap6"},
								{"id":"souvenirs","img":"game_time/Kansas_City_Royals_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"L.A. Angels of Anaheim","v":"la_angels_of_anaheim", "img":"mlbhats/los_angeles_angels_of_anaheim_game_47_franchise_cap.jpg", "catlink":"/category/.mlb.los_angeles_angels/L.A.%20Angels%20of%20Anaheim", "players" : ["Albert Pujols","C.J. Wilson","Josh Hamilton"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Los_Angeles_Angels_Red_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Los_Angeles_Angels/Los_Angeles_Angels_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/Los_Angeles_Angels_Red_Authentic_Triple_Peak_Cool_Base_Convertible_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/los_angeles_angels_of_anaheim_game_47_franchise_cap"},
								{"id":"souvenirs","img":"game_time/Los_Angeles_Angels_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Los Angeles Dodgers","v":"los_angeles_dodgers", "img":"mlbhats/los_angeles_dodgers_royal_franchise_cap5.jpg", "catlink":"/category/.mlb.los_angeles_dodgers/Los%20Angeles%20Dodgers", "players" : ["Adrian Gonzalez","Clayton Kershaw","Yasiel Puig"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Los_Angeles_Dodgers_Royal_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Los_Angeles_Dodgers/Los_Angeles_Dodgers_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/los_angeles_dodgers_roy3_2"},
								{"id":"hats","img":"mlbhats/los_angeles_dodgers_royal_franchise_cap5"},
								{"id":"souvenirs","img":"game_time/Los_Angeles_Dodgers_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Miami Marlins","v":"miami_marlins", "img":"mlbhats/miami_marlins_game_47_franchise_cap.jpg", "catlink":"/category/.mlb.miami_marlins/Miami%20Marlins", "players" : ["Saltalamacchia","Justin Ruggiano","Ty Wigginton"], 
							"filters" : [
								{"id":"shirts","img":"C/miami_marlins_official_wordmark_t_shirt_by_majestic"},
								{"id":"jerseys","img":"Miami_Marlins/Miami_Marlins_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/miami_marlins_black_authentic_triple_peak_cool_base_convertible_gamer_jacket6"},
								{"id":"hats","img":"mlbhats/miami_marlins_game_47_franchise_cap"},
								{"id":"souvenirs","img":"game_time/Miami_Marlins_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Milwaukee Brewers","v":"milwaukee_brewers", "img":"mlbhats/milwaukee_brewers_franchise_cap5.jpg", "catlink":"/category/.mlb.milwaukee_brewers/Milwaukee%20Brewers", "players" : ["Matt Garza","Rickie Weeks","Ryan Braun"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Milaukee_Brewers_Navy_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Milwaukee_Brewers/Milwaukee_Brewers_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/milwaukee_brewers_navy_authentic_triple_peak_cool_base_convertible_gamer_jacket2"},
								{"id":"hats","img":"mlbhats/milwaukee_brewers_franchise_cap5"},
								{"id":"souvenirs","img":"game_time/Milwaukee_Brewers_Womens_All_Star_Series_Watch"}
							]},
						{"p":"Minnesota Twins","v":"minnesota_twins", "img":"mlbhats/minnesota_twins_alternate_47_franchise_cap6.jpg", "catlink":"/category/.mlb.minnesota_twins/Minnesota%20Twins", "players" : ["Brian Dozier","Jason Kubel","Joe Mauer"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Minnesota_Twins_Navy_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Minnesota_Twins/Minnesota_Twins_Road_Authentic_Cool_Base_Jersey_ASG_Patch"},
								{"id":"sweatshirts","img":"majestic/Minnesota_Twins_Navy_Authentic_Triple_Peak_Cool_Base_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/minnesota_twins_alternate_47_franchise_cap6"},
								{"id":"souvenirs","img":"game_time/Minnesota_Twins_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"New York Mets","v":"new_york_mets", "img":"mlbhats/new_york_mets_game_47_franchise_cap6.jpg", "catlink":"/category/.mlb.new_york_mets/New%20York%20Mets", "players" : ["Curtis Granderson","Daniel Murphy","David Wright"], 
							"filters" : [
								{"id":"shirts","img":"blanks/New_York_Mets_Royal_Authentic_Experience_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"New_York_Mets/New_York_Mets_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/New_York_Mets_Royal_Authentic_Triple_Peak_Cool_Base_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/new_york_mets_game_47_franchise_cap6"},
								{"id":"souvenirs","img":"game_time/New_York_Mets_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"New York Yankees","v":"new_york_yankees", "img":"mlbhats/new_york_yankees_game_47_franchise_cap6.jpg", "catlink":"/category/.mlb.new_york_yankees/New%20York%20Yankees", "players" : ["Derek Jeter","Ichiro Ichiro","Masahiro Tanaka"], 
							"filters" : [
								{"id":"shirts","img":"blanks/New_York_Yankees_Navy_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"New_York_Yankees/New_York_Yankees_Home_Authentic_Jersey"},
								{"id":"sweatshirts","img":"majestic/New_York_Yankees_Navy_Authentic_Triple_Peak_Cool_Base_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/new_york_yankees_game_47_franchise_cap6"},
								{"id":"souvenirs","img":"game_time/New_York_Yankees_Pinstripe_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Oakland Athletics","v":"oakland_athletics", "img":"mlbhats/oakland_athletics_road_47_franchise_cap6.jpg", "catlink":"/category/.mlb.oakland_athletics/Oakland%20Athletics", "players" : ["Eric Sogard","Jed Lowrie","Yoenis Cespedes"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Oakland_Athletics_Green_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Oakland_Athletics/Oakland_Athletics_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/oakland_athletics_green_authentic_triple_peak_cool_base_convertible2"},
								{"id":"hats","img":"mlbhats/oakland_athletics_road_47_franchise_cap6"},
								{"id":"souvenirs","img":"game_time/Oakland_Athletics_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Philadelphia Phillies","v":"philadelphia_phillies", "img":"mlbhats/philadelphia_phillies_adjustable_clean_up_hat5.jpg", "catlink":"/category/.mlb.philadelphia_phillies/Philadelphia%20Phillies", "players" : ["Cliff Lee","Cole Hamels","Ryan Howard"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Philadelphia_Phillies_Red_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Philadelphia_Phillies/Philadelphia_Phillies_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/Philadelphia_Phillies_Red_Authentic_Triple_Peak_Cool_Base_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/philadelphia_phillies_adjustable_clean_up_hat5"},
								{"id":"souvenirs","img":"game_time/Philadelphia_Phillies_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Pittsburgh Pirates","v":"pittsburgh_pirates", "img":"mlbhats/pittsburgh_pirates_adjustable_clean_up_hat8.jpg", "catlink":"/category/.mlb.pittsburgh_pirates/Pittsburgh%20Pirates", "players" : ["Andrew McCutchen","Gerrit Cole","Jeff Locke"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Pittsburgh_Pirates_Black_Authentic_Experience_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Pittsburgh_Pirates/Pittsburgh_Pirates_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/Pittsburgh_Pirates_Black_Authentic_Triple_Peak_Cool_Base_Convertible_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/pittsburgh_pirates_adjustable_clean_up_hat8"},
								{"id":"souvenirs","img":"game_time/Pittsburgh_Pirates_P_Logo_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"San Diego Padres","v":"san_diego_padres", "img":"mlbhats/san_diego_padres_game_47_franchise_cap6.jpg", "catlink":"/category/.mlb.san_diego_padres/San%20Diego%20Padres", "players" : ["Cameron Maybin","Cory Luebke","Everth Cabrera"], 
							"filters" : [
								{"id":"shirts","img":"majestic/San_Diego_Padres_Navy_Authentic_Collection_Featherweight_Tech_Fleece"},
								{"id":"jerseys","img":"cooperstown/San_Diego_Padres_Brown_Replica_Cooperstown_Jersey_by_MajesticSDPB"},
								{"id":"sweatshirts","img":"majestic/San_Diego_Padres_Navy_Authentic_Triple_Peak_Cool_Base_Convertible_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/san_diego_padres_game_47_franchise_cap6"},
								{"id":"souvenirs","img":"game_time/San_Diego_Padres_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"San Francisco Giants","v":"san_francisco_giants", "img":"mlbhats/san_francisco_giants_black_franchise_cap6.jpg", "catlink":"/category/.mlb.san_francisco_giants/San%20Francisco%20Giants", "players" : ["Madison Bumgarner","Pablo Sandoval","Joe Panik"], 
							"filters" : [
								{"id":"shirts","img":"blanks/San_Francisco_Giants_Black_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"San_Francisco_Giants/San_Francisco_Giants_Alternate_Grey_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/San_Francisco_Giants_Black_Authentic_Triple_Climate_3_In_1_On_Field_Jacket"},
								{"id":"hats","img":"mlbhats/san_francisco_giants_black_franchise_cap6"},
								{"id":"souvenirs","img":"game_time/San_Francisco_Giants_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Seattle Mariners","v":"seattle_mariners", "img":"mlbhats/seattle_mariners_game_47_franchise_cap7.jpg", "catlink":"/category/.mlb.seattle_mariners/Seattle%20Mariners", "players" : ["Justin Smoak","Kyle Seager","Robinson Cano"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Seattle_Mariners_Green_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Seattle_Mariners/Seattle_Mariners_Road_Authentic_Jersey"},
								{"id":"sweatshirts","img":"majestic/Seattle_Mariners_Navy_Authentic_Triple_Peak_Cool_Base_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/seattle_mariners_game_47_franchise_cap7"},
								{"id":"souvenirs","img":"game_time/Seattle_Mariners_Mens_Elite_Series_Watch"}
							]},
						{"p":"St. Louis Cardinals","v":"st_louis_cardinals", "img":"mlbhats/st__louis_cardinals_scarlet_franchise_cap6.jpg", "catlink":"/category/.mlb.st_louis_cardinals/St.%20Louis%20Cardinals", "players" : ["Adam Wainwright","Chris Carpenter","Jason Motte"], 
							"filters" : [
								{"id":"shirts","img":"blanks/St_Louis_Cardinals_Red_Authentic_Experience_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"St_Louis_Cardinals/St_Louis_Cardinals_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/St_Louis_Cardinals_Red_Authentic_Triple_Peak_Cool_Base_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/st__louis_cardinals_scarlet_franchise_cap6"},
								{"id":"souvenirs","img":"game_time/St_Louis_Cardinals_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Tampa Bay Rays","v":"tampa_bay_rays", "img":"mlbhats/tampa_bay_rays_game_47_franchise_cap6.jpg", "catlink":"/category/.mlb.tampa_bay_rays/Tampa%20Bay%20Rays", "players" : ["Ben Zobrist","David Price","Evan Longoria"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Tampa_Bay_Rays_Navy_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Tampa_Bay_Rays/Tampa_Bay_Rays_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/Tampa_Bay_Rays_Navy_Authentic_Triple_Peak_Cool_Base_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/tampa_bay_rays_game_47_franchise_cap6"},
								{"id":"souvenirs","img":"game_time/Tampa_Bay_Rays_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Texas Rangers","v":"texas_rangers", "img":"mlbhats/texas_rangers_adjustable_clean_up_hat5.jpg", "catlink":"/category/.mlb.texas_rangers/Texas%20Rangers", "players" : ["Adrian Beltre","Michael Young","Prince Fielder"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Texas_Rangers_Red_Authentic_Experience_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Texas_Rangers/Texas_Rangers_Road_Authentic_Cool_Base_Jersey_New"},
								{"id":"sweatshirts","img":"majestic/Texas_Rangers_Royal_Authentic_Triple_Climate_3_In_1_On_Field_Jacket"},
								{"id":"hats","img":"mlbhats/texas_rangers_adjustable_clean_up_hat5"},
								{"id":"souvenirs","img":"game_time/Texas_Rangers_Mens_Victory_Series_Watch"}
							]},
						{"p":"Toronto Blue Jays","v":"toronto_blue_jays", "img":"mlbhats/toronto_blue_jays_game_47_franchise_cap6.jpg", "catlink":"/category/.mlb.toronto_blue_jays/Toronto%20Blue%20Jays", "players" : ["Jose Bautista","Mark Buehrle","Roy Halladay"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Toronto_Blue_Jays_Grey_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Toronto_Blue_Jays/Toronto_Blue_Jays_Road_Authentic_Jersey"},
								{"id":"sweatshirts","img":"majestic/toronto_blue_jays_royal_authentic_triple_peak_cool_base_convertible"},
								{"id":"hats","img":"mlbhats/toronto_blue_jays_game_47_franchise_cap6"},
								{"id":"souvenirs","img":"game_time/Toronto_Blue_Jays_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Washington Nationals","v":"washington_nationals", "img":"mlbhats/washington_nationals_game_47_franchise_cap7.jpg", "catlink":"/category/.mlb.washington_nationals/Washington%20Nationals", "players" : ["Adam Laroche","Bryce Harper","Tyler Clippard"], 
							"filters" : [
								{"id":"shirts","img":"blanks/Washington_Nationals_Red_Wordmark_T_Shirt_by_Majestic"},
								{"id":"jerseys","img":"Washington_Nationals/Washington_Nationals_Road_Authentic_Cool_Base_Jersey"},
								{"id":"sweatshirts","img":"majestic/Washington_Nationals_Navy_Authentic_Triple_Peak_Cool_Base_Gamer_Jacket"},
								{"id":"hats","img":"mlbhats/washington_nationals_game_47_franchise_cap7"},
								{"id":"souvenirs","img":"game_time/Washington_Nationals_Mens_All_Pro_Series_Watch"}
							]}],
			'app_nfl' : [{"p":"Arizona Cardinals","v":"arizona_cardinals", "img":"nfl/arizona_carinals_cap2.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Arizona_Cardinals_Mens_Heart_And_Soul_II_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/Arizona_Cardinals_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/arizona_carinals_cap2.jpg"},
								{"id":"souvenirs","img":"game_time/Arizona_Cardinals_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Atlanta Falcons","v":"atlanta_falcons", "img":"nfl/atlanta_falcons_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Atlanta_Falcons_Mens_All_Time_Great_V_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/Atlanta_Falcons_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/atlanta_falcons_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Atlanta_Falcons_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Baltimore Ravens","v":"baltimore_ravens", "img":"nfl/baltimore_orioles_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Baltimore_Ravens_Mens_All_Time_Great_V_TShrit"},
								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"hats","img":"nfl/baltimore_orioles_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Baltimore_Ravens_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Buffalo Bills","v":"buffalo_bills", "img":"nfl/buffalo_bills_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Buffalo_Bills_Mens_Heart_And_Soul_II_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/Buffalo_Bills_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/buffalo_bills_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Buffalo_Bills_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Carolina Panthers","v":"carolina_panthers", "img":"nfl/carolina_panthers_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Carolina_Panthers_Mens_Heart_And_Soul_II_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/Carolina_Panthers_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/carolina_panthers_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Carolina_Panthers_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Chicago Bears","v":"chicago_bears", "img":"nfl/chicago_bears_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"B/chicago_bears_youth_primary_logo_t_shirt"},
								{"id":"jerseys","img":"chicagobears2013/mike_ditka_jersey3"},
								{"id":"sweatshirts","img":"chicago_bears/chicago_bears_navy_nike_classic_logo_po_hooded_sweatshirt"},
								{"id":"hats","img":"chicago_bears/chicago_bears_b_on_field_performance_59fifty_fitted_hat"},
								{"id":"souvenirs","img":"game_time/Chicago_Bears_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Cincinnati Bengals","v":"cincinnati_bengals", "img":"nfl/cincinnati_bengals_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Cincinnati_Bengals_Mens_All_Time_Great_V_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/Cincinnati_Bengals_Mens_Touchback_VI_Fullzip_Hooded_Fleece"},
								{"id":"hats","img":"nfl/cincinnati_bengals_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Cincinnati_Bengals_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Cleveland Browns","v":"cleveland_browns", "img":"nfl/cleveland_browns_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Cleveland_Browns_Mens_All_Time_Great_V_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/Cleveland_Browns_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/cleveland_browns_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Cleveland_Browns_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Dallas Cowboys","v":"dallas_cowboys", "img":"nfl/dallas_cowboys_cap.jpg", 
							"filters" : [
								{"id":"souvenirs","img":"game_time/Dallas_Cowboys_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Denver Broncos","v":"denver_broncos", "img":"nfl/denver_broncos_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Denver_Broncos_Mens_All_Time_Great_V_TShrit"},
								{"id":"hats","img":"nfl/denver_broncos_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Denver_Broncos_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Detroit Lions","v":"detroit_lions", "img":"nfl/detroit_lions_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Detroit_Lions_Mens_All_Time_Great_V_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/Detroit_Lions_Mens_Touchback_VI_Fullzip_Hooded_Fleece"},
								{"id":"hats","img":"nfl/detroit_lions_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Detroit_Lions_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Green Bay Packers","v":"green_bay_packers", "img":"nfl/green_bay_packers_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Green_Bay_Packers_Mens_All_Time_Great_V_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/Green_Bay_Packers_Mens_Touchback_VI_Fullzip_Hooded_Fleece"},
								{"id":"hats","img":"nfl/green_bay_packers_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Green_Bay_Packers_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Houston Texans","v":"houston_texans", "img":"nfl/houston_texas_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Houston_Texans_Mens_Critical_Victory_VII_TShrit"},
								{"id":"hats","img":"nfl/houston_texas_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Houston_Texans_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Indianapolis Colts","v":"indianapolis_colts", "img":"nfl/indianapolis_colts_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Indianapolis_Colts_Mens_Critical_Victory_VII_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/Indianapolis_Colts_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/indianapolis_colts_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Indianapolis_Colts_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Jacksonville Jaguars","v":"jacksonville_jaguars", "img":"nfl/jacksonville_jaguars_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Jacksonville_Jaguars_Mens_Heart_And_Soul_II_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/Jacksonville_Jaguars_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/jacksonville_jaguars_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Jacksonville_Jaguars_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Kansas City Chiefs","v":"kansas_city_chiefs", "img":"nfl/kansas_city_chiefs_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Kansas_City_Chiefs_Mens_Heart_And_Soul_II_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/Kansas_City_Chiefs_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/kansas_city_chiefs_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Kansas_City_Chiefs_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Miami Dolphins","v":"miami_dolphins", "img":"nfl/miami_dolphins_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Miami_Dolphins_Mens_Inside_Line_III_TShirt"},
								{"id":"sweatshirts","img":"2013nfl/Miami_Dolphins_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/miami_dolphins_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Miami_Dolphins_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Minnesota Vikings","v":"minnesota_vikings", "img":"nfl/minnesota_vikings_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Minnesota_Vikings_Mens_Primary_ReceIVer_IV_Long_Sleeve_TShirt"},
								{"id":"sweatshirts","img":"2013nfl/Minnesota_Vikings_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/minnesota_vikings_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Minnesota_Vikings_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"New England Patriots","v":"new_england_patriots", "img":"nfl/new_england_patriots_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/New_England_Patriots_Mens_All_Time_Great_V_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/New_England_Patriots_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/new_england_patriots_cap.jpg"},
								{"id":"souvenirs","img":"game_time/New_England_Patriots_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"New York Giants","v":"new_york_giants", "img":"nfl/new_york_giants_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/New_York_Giants_Mens_All_Time_Great_V_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/New_York_Giants_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/new_york_giants_cap.jpg"},
								{"id":"souvenirs","img":"game_time/New_York_Giants_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"New Orleans Saints","v":"new_orleans_saints", "img":"nfl/new_orleans_saints_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/New_Orleans_Saints_Mens_All_Time_Great_V_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/New_Orleans_Saints_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/new_orleans_saints_cap.jpg"},
								{"id":"souvenirs","img":"game_time/New_Orleans_Saints_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"New York Jets","v":"new_york_jets", "img":"nfl/new_york_jets_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/New_York_Jets_Mens_Heart_And_Soul_II_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/New_York_Jets_Mens_Touchback_VI_Fullzip_Hooded_Fleece"},
								{"id":"hats","img":"nfl/new_york_jets_cap.jpg"},
								{"id":"souvenirs","img":"game_time/New_York_Jets_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Oakland Raiders","v":"oakland_raiders", "img":"nfl/oakland_raiders_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Oakland_Raiders_Mens_All_Time_Great_V_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/Oakland_Raiders_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/oakland_raiders_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Oakland_Raiders_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Philadelphia Eagles","v":"philadelphia_eagles", "img":"nfl/philadelphia_eagles_cap2.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Philadelphia_Eagles_Mens_Heart_And_Soul_II_TShrit"},
								{"id":"hats","img":"nfl/philadelphia_eagles_cap2.jpg"},
								{"id":"souvenirs","img":"game_time/Philadelphia_Eagles_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Pittsburgh Steelers","v":"pittsburgh_steelers", "img":"nfl/pittsburgh_steelers_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Pittsburgh_Steelers_Mens_All_Time_Great_V_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/Pittsburgh_Steelers_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/pittsburgh_steelers_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Pittsburgh_Steelers_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"San Diego Chargers","v":"san_diego_chargers", "img":"nfl/san_diego_chargers_cap2.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/San_Diego_Chargers_Mens_Critical_Victory_VII_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/San_Diego_Chargers_Mens_Touchback_VI_Fullzip_Hooded_Fleece"},
								{"id":"hats","img":"nfl/san_diego_chargers_cap2.jpg"},
								{"id":"souvenirs","img":"game_time/San_Diego_Chargers_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"San Francisco 49ers","v":"san_francisco_49ers", "img":"nfl/san_francisco_49ers_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/San_Francisco_49Ers_Mens_All_Time_Great_V_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/San_Francisco_49Ers_Mens_Touchback_VI_Fullzip_Hooded_Fleece"},
								{"id":"hats","img":"nfl/san_francisco_49ers_cap.jpg"},
								{"id":"souvenirs","img":"game_time/San_Francisco_49Ers_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Seattle Seahawks","v":"seattle_seahawks", "img":"nfl/seattle_seahawks_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Seattle_Seahawks_Mens_Heart_And_Soul_II_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/Seattle_Seahawks_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/seattle_seahawks_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Seattle_Seahawks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"St. Louis Rams","v":"st_louis_rams", "img":"nfl/st_louis_rams_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"hats","img":"nfl/st_louis_rams_cap.jpg"},
								{"id":"souvenirs","img":"game_time/St_Louis_Rams_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Tampa Bay Buccaneers","v":"tampa_bay_buccaneers", "img":"nfl/tampa_bay_buccaneers_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Tampa_Bay_Buccaneers_Mens_Primary_ReceIVer_IV_Long_Sleeve_TShirt"},
								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"hats","img":"nfl/tampa_bay_buccaneers_cap.jpg"},
								{"id":"souvenirs","img":"fanmats/Tampa_Bay_Buccaneers_Football_Rug_22x35"}
							]},
						{"p":"Tennessee Titans","v":"tennessee_titans", "img":"nfl/tennessee_titans_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Tennessee_Titans_Mens_All_Time_Great_V_TShrit"},
								{"id":"sweatshirts","img":"2013nfl/Tennessee_Titans_Mens_1St_And_Goal_VI_Hooded_Fleece_Pullover"},
								{"id":"hats","img":"nfl/tennessee_titans_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Tennessee_Titans_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Washington Redskins","v":"washington_redskins", "img":"nfl/washington_redskins_cap.jpg", 
							"filters" : [
								{"id":"shirts","img":"2013nfl/Washington_Redskins_Mens_All_Time_Great_V_TShrit"},
								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"hats","img":"nfl/washington_redskins_cap.jpg"},
								{"id":"souvenirs","img":"game_time/Washington_Redskins_Mens_All_Pro_Series_Watch"}
							]}],
			'app_nhl' : [{"p":"Anaheim Ducks","v":"anaheim_ducks", "img":"nhlhats/anaheim_ducks_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
//						{"p":"Boston Bruins","v":"boston_bruins", "img":"nhlhats/boston_bruins_hat.jpg", 
//							"filters" : [
//								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
//								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
//							]},
						{"p":"Buffalo Sabres","v":"buffalo_sabres", "img":"nhlhats/buffalo_sabres_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Calgary Flames","v":"calgary_flames", "img":"nhlhats/calgary_flames_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Carolina Hurricanes","v":"carolina_hurricanes", "img":"nhlhats/carolina_hurricanes_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Chicago Blackhawks","v":"chicago_blackhawks", "img":"nhlhats/chicago_blackhawks_hat.jpg", "players" : ["Jonathan Toews","Patrick Kane","Marian Hossa"],
							"filters" : [
								{"id":"shirts","img":"C/chicago_blackhawks_primary_logo_t_shirt"},
								{"id":"jerseys","img":"blackhawksshopcom/chicago_blackhawks_youth_premier_home_jersey_by_reebok"},
								{"id":"sweatshirts","img":"blackhawks2013/chicago_blackhawks_crew3_retro_brand"},
								{"id":"hats","img":"blackhawks2013/chicago_blackhawks_franchise_fitted_hat2"},
								{"id":"souvenirs","img":"blackhawks2014/chicago_blackhawks_3x5_flag_v5_1000px"}
							]},
						{"p":"Colorado Avalanche","v":"colorado_alavanche", "img":"nhlhats/colorado_avalanche_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Columbus Blue Jackets","v":"columbus_blue_jackets", "img":"nhlhats/columbus_blue_jackets_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Dallas Stars","v":"dallas_stars", "img":"nhlhats/dallas_stars_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Detroit Red Wings","v":"detroit_red_wings", "img":"nhlhats/detroit_red_wings_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Edmonton Oilers","v":"edmonton_oilers", "img":"nhlhats/edmonton_oilers_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Florida Panthers","v":"florida_panthers", "img":"nhlhats/florida_panthers_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Los Angeles Kings","v":"los_angeles_kings", "img":"nhlhats/los_angeles_kings_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"nhl/Los_Angeles_Kings_Tape_To_Tape_TShirt"},
								{"id":"hats","img":"bears/los_angeles_kings_2014_stanley_cup_champions_adjustable_cap22"},
								{"id":"souvenirs","img":"F/f0010646"}
							]},
						{"p":"Minnesota Wild","v":"minnesota_wild", "img":"nhlhats/minnesota_wild_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Montreal Canadiens","v":"montreal_canadiens", "img":"nhlhats/montreal_canadiens_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Nashville Predators","v":"nashville_predators", "img":"nhlhats/nashville_predators_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"New Jersey Devils","v":"new_jersey_devils", "img":"nhlhats/new_jersey_devils_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"New York Islanders","v":"new_york_islanders", "img":"nhlhats/new_york_islanders_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"New York Rangers","v":"new_york_rangers", "img":"nhlhats/new_york_rangers_hat1.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Ottawa Senators","v":"ottawa_senators", "img":"nhlhats/ottawa_senators_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Philadelphia Flyers","v":"philadelphia_flyers", "img":"nhlhats/philadelphia_flyers_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Phoenix Coyotes","v":"phoenix_coyotes", "img":"nhlhats/phoenix_coyotes_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Pittsburgh Penguins","v":"pittsburgh_penguins", "img":"nhlhats/pittsburgh_penguins_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"San Jose Sharks","v":"san_jose_sharks", "img":"nhlhats/san_jose_sharks_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"St. Louis Blues","v":"st_louis_blues", "img":"nhlhats/st__louis_blues_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Tampa Bay Lightning","v":"tampa_bay_lightning", "img":"nhlhats/tampa_bay_lightning_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Toronto Maple Leafs","v":"toronto_maple_leafs", "img":"nhlhats/toronto_maple_leafs_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Vancouver Canucks","v":"vancouver_canucks", "img":"nhlhats/vancouver_canucks_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Washington Capitals","v":"washington_capitals", "img":"nhlhats/washington_capitals_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]},
						{"p":"Winnipeg Jets","v":"winnipeg_jets", "img":"nhlhats/winnipeg_jets_hat.jpg", 
							"filters" : [
								{"id":"shirts","img":"blanks/Arizona_Diamondbacks_Red_Wordmark_T_Shirt_by_Majestic"},
//								{"id":"sweatshirts","img":"majestic/Arizona_Diamondbacks_Red_Authentic_Collection_Tech_Fleece"},
								{"id":"souvenirs","img":"game_time/Arizona_Diamondbacks_Mens_All_Pro_Series_Watch"}
							]}],
				}
} //r object.
return r;
}
