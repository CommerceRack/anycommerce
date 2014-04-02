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
	var theseTemplates = new Array('');
	var r = {

	vars : {
		templates : [
			"filteredSearchTemplate",
			"fieldcamTemplate"
			],
		userTeams : {
			app_nba : [],
			app_mlb : [],
			app_nfl : [],
			app_nhl : []
			}
		},
////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				
				var userTeams = false;
				if(userTeams = _app.model.readLocal('swcUserTeams')){
					for(var i in _app.ext.store_swc.vars.userTeams){
						_app.ext.store_swc.u.setUserTeams(i, userTeams[i]);
						}
					}
				else {
					_app.ext.store_swc.u.setUserTeams('app_mlb',[{p:"Chicago Cubs",v:"chicago_cubs","checked":"checked"}]);
					$('#globalMessaging').anymessage({'message' : "It looks like this is your first time here!  We've added the Chicago Cubs to your Team list- to add or remove teams go <a href='#!customer/myteams/'>here!</a>", timeout:30000});
					}
				
				_app.router.appendHash({'type':'exact','route':'fieldcam/','callback':function(routeObj){showContent('category',{'navcat':'.wrigley_field_cam', 'templateID':'fieldcamTemplate'})}});
				_app.router.appendHash({'type':'match','route':'filter/{{id}}*','callback':function(routeObj){
					if(_app.ext.store_swc.filterData[routeObj.params.id]){
						routeObj.params.templateID = "filteredSearchTemplate";
						dump(routeObj);
						routeObj.params.dataset = $.extend(true, {}, _app.ext.store_swc.filterData[routeObj.params.id]);
						routeObj.params.dataset.userTeams = _app.ext.store_swc.vars.userTeams;
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
				_app.templates.customerTemplate.on('complete.swc', function(event, $context, infoObj){
				if(infoObj.show == "myteams"){
					$('#myteamsArticle', $context).tlc({dataset:_app.ext.store_swc.validTeams, verb:"translate"});
					}
				});
				_app.templates.filteredSearchTemplate.on('complete.swc', function(event, $context, infoObj){
					$('form.filterList', $context).trigger('submit');
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
		tlcFormats : {
			imageurl : function(data,thisTLC){
				var args = thisTLC.args2obj(data.command.args, data.globals);
				data.globals.binds[data.globals.focusBind] = _app.u.makeImage(args);
				return true;
				},
			filtercheckboxlist : function(data, thisTLC){
				var args = thisTLC.args2obj(data.command.args, data.globals);
				dump(args);
				if(args.index){
					var list = data.globals.binds[data.globals.focusBind];
					var $tag = data.globals.tags[data.globals.focusTag];
					$tag.attr('data-filter-type','checkboxList');
					$tag.attr('data-filter-index',args.index);
					for(var i in list){
						var o = list[i];
						var $t = $('<div></div>');
						$t.append('<input type="checkbox" name="'+o.v+'" '+(o.checked ? 'checked="checked"' : '')+' />');
						$t.append('<label>'+o.p+'</label>');
						if(o.hidden){$t.addClass('displayNone');}
						$tag.append($t);
						}
					return true;
				} else {
					return false;
				}
				},
			dump : function(data,thisTLC){
				dump(data);
				}
			},
		renderFormats : {
			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
			showSizeChart : function(){
				$('#size-chart').dialog({'modal':'true', 'title':'Sizing Chart','width':800, height:550});
				},
			setUserTeams : function(sport, teamsArr){
				if(typeof _app.ext.store_swc.vars.userTeams[sport] !== "undefined"){
					_app.ext.store_swc.vars.userTeams[sport] = teamsArr;
					this.saveUserTeams();
					}
				},
				/*
			addUserTeam : function(sport, team){
				if(typeof _app.ext.store_swc.vars.userTeams[sport] !== "undefined"){
					_app.ext.store_swc.vars.userTeams[sport].push(team);
					this.saveUserTeams();
					}
				},
			removeUserTeam : function(sport, team){
				if(typeof _app.ext.store_swc.vars.userTeams[sport] !== "undefined" ){
					$.grep(_app.ext.store_swc.vars.userTeams[sport], function(e, i){
						return e.v != team && e.p != team;
						});
					this.saveUserTeams();
					}
				},
				*/
			saveUserTeams : function(){
				$('#appView .filteredSearchPage').each(function(){
					$(this).intervaledEmpty().remove();
					}); //These will all need to be re-rendered with the new teams.  This is a bit of a heavy handed approach that could be tuned later.
				_app.model.writeLocal('swcUserTeams', _app.ext.store_swc.vars.userTeams);
				}
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			execFilteredSearch : function($form, p){
				p.preventDefault();
				var $resultsContainer = $form.closest('[data-filter-page=parent]').find('.filterResults');
				var filterBase = JSON.parse($form.attr('data-filter-base'));
				var elasticsearch = {
					"filter" : {
						"and" : [filterBase]
						}
					}
				$('[data-filter-type=checkboxList]', $form).each(function(){
					var index = $(this).attr('data-filter-index');
					var filter = {"or" : []};
					$('input', $(this)).each(function(){
						if($(this).is(":checked")){
							var f = {"term" : {}};
							f.term[index] = $(this).attr('name');
							filter.or.push(f);
							}
						});
					if(filter.or.length > 0){
						elasticsearch.filter.and.push(filter);
						}
					});
					
				var es = _app.ext.store_search.u.buildElasticRaw(elasticsearch);
				es.size = 60;
				_app.ext.store_search.u.updateDataOnListElement($resultsContainer,es,1);
				_app.ext.store_search.calls.appPublicSearch.init(es, {'callback':'handleElasticResults', 'datapointer':'appFilteredSearch','extension':'store_search','templateID':'productListTemplateResults','list':$resultsContainer});
				_app.model.dispatchThis();
				
				}
			}, //e [app Events]
		filterData : {
			'jerseys' : {
				baseFilter : {
					"term":{"app_department":"jersey"}
					},
				options : {
					"app_jerseys":[{"p":"Alternate","v":"alternate","checked":"checked"},{"p":"Authentic","v":"authentic","checked":"checked"}]
					}
				}
			},
		validTeams : {
			//These values taken from flex field setup, and should be adjusted when / if these are expanded
			'app_nba' : [{"p":"Chicago Bulls","v":"chicago_bulls"},{"p":"EMPTY","v":""}],
			'app_mlb' : [{"p":"Arizona Diamondbacks","v":"arizona_diamondbacks"},{"p":"Atlanta Braves","v":"atlanta_braves"},{"p":"Baltimore Orioles","v":"baltimore_orioles"},{"p":"Boston Red Sox","v":"boston_red_sox"},{"p":"Chicago Cubs","v":"chicago_cubs"},{"p":"Chicago White Sox","v":"chicago_white_sox"},{"p":"Cincinnati Reds","v":"cincinnati_reds"},{"p":"Cleveland Indians","v":"cleveland_indians"},{"p":"Colorado Rockies","v":"colorado_rockies"},{"p":"Detroit Tigers","v":"detroit_tigers"},{"p":"Houston Astros","v":"houston_astros"},{"p":"Kansas City Royals","v":"kansas_city_royals"},{"p":"L.A. Angels of Anaheim","v":"la_angels_of_anaheim"},{"p":"Los Angeles Dodgers","v":"los_angeles_dodgers"},{"p":"Miami Marlins","v":"miami_marlins"},{"p":"Milwaukee Brewers","v":"milwaukee_brewers"},{"p":"Minnesota Twins","v":"minnesota_twins"},{"p":"New York Mets","v":"new_york_mets"},{"p":"New York Yankees","v":"new_york_yankees"},{"p":"Oakland Athletics","v":"oakland_athletics"},{"p":"Philadelphia Phillies","v":"philadelphia_phillies"},{"p":"Pittsburgh Pirates","v":"pittsburgh_pirates"},{"p":"San Diego Padres","v":"san_diego_padres"},{"p":"San Francisco Giants","v":"san_francisco_giants"},{"p":"Seattle Mariners","v":"seattle_mariners"},{"p":"St. Louis Cardinals","v":"st_louis_cardinals"},{"p":"Tampa Bay Rays","v":"tampa_bay_Rays"},{"p":"Texas Rangers","v":"texas_rangers"},{"p":"Toronto Blue Jays","v":"toronto_blue_jays"},{"p":"Washington Nationals","v":"washington_nationals"},{"p":"EMPTY","v":""}],
			'app_nfl' : [{"p":"Arizona Cardinals","v":"arizona_cardinals"},{"p":"Atlanta Falcons","v":"atlanta_falcons"},{"p":"Baltimore Ravens","v":"baltimore_ravens"},{"p":"Buffalo Bills","v":"buffalo_bills"},{"p":"Carolina Panthers","v":"carolina_panthers"},{"p":"Chicago Bears","v":"chicago_bears"},{"p":"Cincinnati Bengals","v":"cincinnati_bengals"},{"p":"Cleveland Browns","v":"cleveland_browns"},{"p":"Dallas Cowboys","v":"dallas_cowboys"},{"p":"Denver Broncos","v":"denver_broncos"},{"p":"Detroit Lions","v":"detroit_lions"},{"p":"Green Bay Packers","v":"green_bay_packers"},{"p":"Houston Texans","v":"houston_texans"},{"p":"Indianapolis Colts","v":"indianapolis_colts"},{"p":"Jacksonville Jaguars","v":"jacksonville_jaguars"},{"p":"Kansas City Chiefs","v":"kansas_city_chiefs"},{"p":"Miami Dolphins","v":"miami_dolphins"},{"p":"Minnesota Vikings","v":"minnesota_vikings"},{"p":"New England Patriots","v":"new_england_patriots"},{"p":"New York Giants","v":"new_york_giants"},{"p":"New Orleans Saints","v":"new_orleans_saints"},{"p":"New York Jets","v":"new_york_jets"},{"p":"Oakland Raiders","v":"oakland_raiders"},{"p":"Philadelphia Eagles","v":"philadelphia_eagles"},{"p":"Pittsburgh Steelers","v":"pittsburgh_steelers"},{"p":"San Diego Chargers","v":"san_diego_chargers"},{"p":"San Francisco 49ers","v":"san_francisco_49ers"},{"p":"Seattle Seahawks","v":"seattle_seahawks"},{"p":"St. Louis Rams","v":"st_louis_rams"},{"p":"Tampa Bay Buccaneers","v":"tampa_bay_buccaneers"},{"p":"Tennessee Titans","v":"tennessee_titans"},{"p":"Washington Redskins","v":"washington_redskins"},{"p":"EMPTY","v":""}],
			'app_nhl' : [{"p":"Chicago Blackhawks","v":"chicago_blackhawks"},{"p":"EMPTY","v":""}],
			}
		} //r object.
	return r;
	}