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
	pages : {
		".aa" : "ticketsTemplate"
		},
	vars : {
		templates : [
			"filteredSearchTemplate",
			"fieldcamTemplate"
			],
		customPrompt : "I understand it takes 3-14 business days to customize my item. This item is not returnable / exchangeable as it is considered customized. Once this order is placed, no changes or cancellations are permitted.",
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
				
				_app.ext.store_swc.u.loadBanners();
				
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
				
				_app.router.appendHash({'type':'exact','route':'fieldcam/','callback':function(routeObj){
					showContent('static',{dataset:_app.ext.store_swc.staticData.fieldcam, 'templateID':'fieldcamTemplate'})
					}});
				_app.router.appendHash({'type':'exact','route':'affiliates/','callback':function(routeObj){
					showContent('static',{'templateID':'affiliatesTemplate'})
					}});
				_app.router.appendHash({'type':'exact','route':'inquiry/','callback':function(routeObj){
					showContent('static',{'templateID':'inquiryTemplate'})
					}});
				_app.router.appendHash({'type':'exact','route':'rewards/','callback':function(routeObj){
					showContent('static',{'templateID':'rewardsTemplate'})
					}});
				_app.router.appendHash({'type':'exact','route':'contest/','callback':function(routeObj){
					showContent('static',{'templateID':'contestTemplate'})
					}});
				_app.router.appendHash({'type':'match','route':'filter/{{id}}*','callback':function(routeObj){
					if(_app.ext.store_swc.filterData[routeObj.params.id]){
						routeObj.params.templateID = "filteredSearchTemplate";
						dump(routeObj);
						routeObj.params.dataset = $.extend(true, {}, _app.ext.store_swc.filterData[routeObj.params.id]);
						if(routeObj.params.dataset.options.explicit){} //Options are passed with explicit values, leave them alone.
						else {
							var optStrs = routeObj.params.dataset.options;
							routeObj.params.dataset.options = {};
							for(var i in optStrs){
								var o = optStrs[i];
								if(_app.ext.store_swc.options[o]){
									routeObj.params.dataset.options[o] = _app.ext.store_swc.options[o];
									}
								else {
									dump("Unrecognized option "+o+" on filter page "+routeObj.params.id);
									}
								}
							}
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
				_app.ext.store_swc.u.renderMyTeams();
				_app.templates.homepageTemplate.on('complete.swc', function(event, $context, infoObj){
					_app.ext.store_swc.u.showHomepageSlideshow();
					});
				_app.templates.filteredSearchTemplate.on('complete.swc', function(event, $context, infoObj){
					$('form.filterList', $context).trigger('submit');
					});
				_app.templates.fieldcamTemplate.on('depart.swc', function(event, $context, infoObj){
					$context.empty().remove();
					});
				_app.ext.store_search.vars.universalFilters.push({"has_child":{"type":"sku","query":{"range":{"available":{"gte":1}}}}});
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
						$t.append('<input type="checkbox" name="'+o.v+'" '+(o.checked ? 'checked="checked"' : '')+' />');
						$t.append('<label>'+o.p+'</label>');
						$t.append(' <span data-filter="count"></span>');
						if(o.hidden){$t.addClass('displayNone');}
						$tag.append($t);
						}
					return true;
					} 
				else {
					return false;
					}
				},
			relatedproducts : function(data,thisTLC){
				var pid = data.globals.binds[data.globals.focusBind];
				var reqObj = {
					"_cmd":"appPublicSearch",
					"mode":"elastic-mlt",
					"type":"product",
					"min_doc_freq":1,
					"id":pid,
					"search_size":8,
					"_tag" : {
						"callback":"handleElasticResults",
						"datapointer":"relatedProducts|"+pid,
						"extension":"store_search",
						"list":data.globals.tags[data.globals.focusTag],
						"templateID":"productListTemplateResults"
						}
					}
				_app.model.addDispatchToQ(reqObj, 'immutable');
				_app.model.dispatchThis('immutable');
				},
			dump : function(data,thisTLC){
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
			setUserTeams : function(sport, teamsArr){
				if(typeof _app.ext.store_swc.vars.userTeams[sport] !== "undefined"){
					_app.ext.store_swc.vars.userTeams[sport] = teamsArr;
					this.saveUserTeams();
					this.renderMyTeams();
					}
				},
			saveUserTeams : function(){
				$('#appView .myTeamsFilter').each(function(){
					$(this).empty().tlc({'verb':'translate','dataset':{userTeams:_app.ext.store_swc.vars.userTeams}});
					});
				//$('#appView .filteredSearchPage').each(function(){
				//	$(this).intervaledEmpty().remove();
				//	}); //These will all need to be re-rendered with the new teams.  This is a bit of a heavy handed approach that could be tuned later.
				_app.model.writeLocal('swcUserTeams', _app.ext.store_swc.vars.userTeams);
				},
			renderMyTeams : function(){
				var $teams = $('#myTeamChooser');
				var data = {
					userTeams : _app.ext.store_swc.vars.userTeams,
					validTeams : {}
					};
				for(var i in data.userTeams){
					data.validTeams[i] = $.grep(_app.ext.store_swc.validTeams[i], function(ve,vi){
						if(ve.v){
							var collisions = $.grep(data.userTeams[i], function(me,mi){
								return me.v === ve.v;
								});
							return !collisions.length;
							}
						return false;
						});
					}
				$teams.empty().tlc({dataset:data, templateid:$teams.attr('data-templateid')});
				$('.closeButton', $teams).button({'icons':{"primary":"ui-icon-closethick"}, "text":false});
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
				
				_app.u.dump(obj);
				_app.u.dump(errors);
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
				p.preventDefault();
				var $resultsContainer = $form.closest('[data-filter-page=parent]').find('.filterResults');
				var filterBase = JSON.parse($form.attr('data-filter-base'));
				var elasticsearch = {
					"filter" : {
						"and" : [filterBase]
						}
					}
				var countFilters = [];
				$('[data-filter-type=sort]', $form).each(function(){
					elasticsearch.sort = elasticsearch.sort || [];
					var sort = {};
					var $selectedOption = $('option:selected',$(this));
					sort[$selectedOption.attr('data-filter-sort-attribute')] = $selectedOption.attr('data-filter-sort-direction');
					elasticsearch.sort.push(sort);
					});
				$('[data-filter-type=checkboxList]', $form).each(function(){
					var filter = {"or" : []};
					//var cf = [];
					$('[data-filter=count]', $(this)).empty();
					$('input', $(this)).each(function(){
						var f = {"term" : {}};
						f.term[$(this).closest('[data-filter-index]').attr('data-filter-index')] = $(this).attr('name');
						if($(this).is(":checked")){
							dump(f);
							dump('checked')
							//countFilters.push({"query":f, "$input":$(this)});
							filter.or.push(f);
							}
						countFilters.push({"query":f, "$input":$(this)});
						//cf.push({"query":f, "$input":$(this)});
						});
					if(filter.or.length > 0){
						elasticsearch.filter.and.push(filter);
						}
					else {
						//countFilters = countFilters.concat(cf);
						}
					});
				dump(countFilters);
				var es = _app.ext.store_search.u.buildElasticRaw(elasticsearch);
				es.size = 30;
				$resultsContainer.empty();
				for(var i in countFilters){
					var q = {
						"query":{
							"filtered":{
								"query":countFilters[i].query,
								"filter":elasticsearch.filter
								}
							}
						}
					var $input = countFilters[i].$input;
					
					var countES = _app.ext.store_search.u.buildElasticRaw(q);
					countES.mode = 'elastic-count';
					delete countES.size;
					var _tag = {
						'callback':function(rd){
							//dump(rd);
							if(_app.data[rd.datapointer].count){
								rd.$input.closest('[data-filter=inputContainer]').show();
								}
							else {
								rd.$input.closest('[data-filter=inputContainer]').hide();
								rd.$input.prop('checked',false);
								if($('[data-filter=inputContainer]:visible', rd.$input.closest('.filterGroup')).length < 1){
									
									rd.$input.closest('.filterGroup').hide();
									}
								}
							$('[data-filter=count]', rd.$input.closest('[data-filter=inputContainer]')).text("("+_app.data[rd.datapointer].count+")");
							_app.model.destroy(rd.datapointer);
							},
						'datapointer':'appFilteredCount|'+i, 
						"$input":$input
						};
					_app.ext.store_search.calls.appPublicSearch.init(countES, _tag);
				
					}
				_app.ext.store_search.u.updateDataOnListElement($resultsContainer,es,1);
				//dump(es);
				_app.model.dispatchThis();
				_app.ext.store_search.calls.appPublicSearch.init(es, {'callback':'handleInfiniteElasticResults', 'datapointer':'appFilteredSearch','extension':'prodlist_infinite','templateID':'productListTemplateResults','list':$resultsContainer});
				_app.model.dispatchThis();
				
				},
			addteam : function($btn, p){
				p.preventDefault();
				var team = JSON.parse($btn.closest('[data-swc-team]').attr('data-swc-team'));
				team.checked = "checked";
				var sport = $btn.closest('[data-swc-sport]').attr('data-swc-sport');
				var teams = _app.ext.store_swc.vars.userTeams[sport];
				teams.push(team);
				_app.ext.store_swc.u.setUserTeams(sport, teams);
				},
			removeteam : function($btn, p){
				p.preventDefault();
				var team = JSON.parse($btn.closest('[data-swc-team]').attr('data-swc-team'));
				var sport = $btn.closest('[data-swc-sport]').attr('data-swc-sport');
				var teams = $.grep(_app.ext.store_swc.vars.userTeams[sport], function(e,i){
					return !(e.v === team.v);
					});
				_app.ext.store_swc.u.setUserTeams(sport, teams);
				},
			bumpTeamUp : function($btn, p){
				p.preventDefault();
				var team = JSON.parse($btn.closest('[data-swc-team]').attr('data-swc-team'));
				var sport = $btn.closest('[data-swc-sport]').attr('data-swc-sport');
				var teams = _app.ext.store_swc.vars.userTeams[sport];
				for(var i in teams){
					if(i>0 && teams[i].v === team.v){
						teams.splice(i-1, 0, teams.splice(i, 1)[0]);
						}
					}
				_app.ext.store_swc.u.setUserTeams(sport, teams);
				},
			bumpTeamDown : function($btn, p){
				p.preventDefault();
				var team = JSON.parse($btn.closest('[data-swc-team]').attr('data-swc-team'));
				var sport = $btn.closest('[data-swc-sport]').attr('data-swc-sport');
				var teams = _app.ext.store_swc.vars.userTeams[sport];
				for(var i in teams){
					if(i<teams.length && teams[i].v === team.v){
						teams.splice(i+1, 0, teams.splice(i, 1)[0]);
						}
					}
				_app.ext.store_swc.u.setUserTeams(sport, teams);
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
				},
			hideMyTeamChooser : function($ele,p){
				p.preventDefault();
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
				}
			}, //e [app Events]
		filterData : {
			'100_years_of_wrigley_field' : {
				title : "100 Years of Wrigley Field",
				baseFilter : {
					"term" : {"app_promo":"wrigley100"}
					},
				options : [
					"app_department",
					"app_sub_department",
					"app_tshirts",
					"app_souvenirs",
					"app_jerseys",
					"app_brands"
					]
				},
			'new_arrivals' :{
				title : "New Arrivals",
				baseFilter  : {
					"term" : {"tags":"IS_NEWARRIVAL"}
					},
				options : [
					"app_promo",
					"app_department",
					"app_sub_department",
					"app_prod_demographic",
					"app_tshirts",
					"app_souvenirs",
					"app_jerseys",
					"app_brands"
					]
				},
			'shirts' : {
				title : "Shirts",
				baseFilter : {
					"and" : [
						{"term":{"app_department":"t_shirt"}}
						]
					},
				options : [
					"app_prod_demographic",
					"app_t_shirts",
					"app_brands"
					]
				},
			'jerseys' : {
				title : "Jerseys",
				baseFilter : {
					"and" : [
						{"term":{"app_department":"jersey"}}
						]
					},
				options : [
					"app_prod_demographic",
					"app_jerseys",
					"app_brands"
					]
				},
			'sweatshirts' : {
				title : "Sweatshirts and Jackets",
				baseFilter : {
					"and" : [
						{"term":{"app_department":"sweatshirt_jacket"}}
						]
					},
				options : [
					"app_prod_demographic",
					"app_brands"
					]
				},
			'hats' : {
				title : "Hats",
				baseFilter : {
					"term" : {"app_department":"hat"}
					},
				options : [
					"app_prod_demographic",
					"app_sub_department",
					"app_brands"
					]
				},
			'souvenirs' : {
				title : "Souvenirs",
				baseFilter : {
					"term" : {"app_department":"souvenir"}
					},
				options : [
					"app_souvenirs",
					"app_brands"
					]
				}
			},
		validTeams : {
			//These values taken from flex field setup, and should be adjusted when / if these are expanded
			'app_nba' : [{"p":"Chicago Bulls","v":"chicago_bulls"}],
			'app_mlb' : [{"p":"Arizona Diamondbacks","v":"arizona_diamondbacks", "img":"mlbhats/arizona_diamondbacks_game_47_franchise_cap6.jpg"},
						{"p":"Atlanta Braves","v":"atlanta_braves", "img":"mlbhats/atlanta_braves_home_cap.jpg"},
						{"p":"Baltimore Orioles","v":"baltimore_orioles", "img":"mlbhats/baltimore_orioles_alternate_47_franchise_cap6.png"},
						{"p":"Boston Red Sox","v":"boston_red_sox", "img":"mlbhats/boston_red_sox_game_47_franchise_cap6.png"},
						{"p":"Chicago Cubs","v":"chicago_cubs", "img":"47brand/chicago_cubs_royal_franchise_cap_by__47_brand.jpg"},
						{"p":"Chicago White Sox","v":"chicago_white_sox", "img":"mlbhats/chicago_white_sox_game_47_franchise_cap6.png"},
						{"p":"Cincinnati Reds","v":"cincinnati_reds", "img":"mlbhats/cincinnati_reds_home_47_franchise_cap5.png"},
						{"p":"Cleveland Indians","v":"cleveland_indians", "img":"mlbhats/cleveland_indians_alternate_road_47_franchise_cap6.png"},
						{"p":"Colorado Rockies","v":"colorado_rockies", "img":"mlbhats/colorado_rockies_game_47_franchise_cap5.png"},
						{"p":"Detroit Tigers","v":"detroit_tigers", "img":"mlbhats/detroit_tigers_home_47_franchise_cap5.png"},
						{"p":"Houston Astros","v":"houston_astros", "img":"mlbhats/houston_astros_adjustable_clean_up_hat8.png"},
						{"p":"Kansas City Royals","v":"kansas_city_royals", "img":"mlbhats/kansas_city_royals_game_47_franchise_cap6.png"},
						{"p":"L.A. Angels of Anaheim","v":"la_angels_of_anaheim", "img":"mlbhats/los_angeles_angels_of_anaheim_game_47_franchise_cap.png"},
						{"p":"Los Angeles Dodgers","v":"los_angeles_dodgers", "img":"mlbhats/los_angeles_dodgers_royal_franchise_cap5.png"},
						{"p":"Miami Marlins","v":"miami_marlins", "img":"mlbhats/miami_marlins_game_47_franchise_cap.png"},
						{"p":"Milwaukee Brewers","v":"milwaukee_brewers", "img":"mlbhats/milwaukee_brewers_franchise_cap5.png"},
						{"p":"Minnesota Twins","v":"minnesota_twins", "img":"mlbhats/minnesota_twins_alternate_47_franchise_cap6.png"},
						{"p":"New York Mets","v":"new_york_mets", "img":"mlbhats/new_york_mets_game_47_franchise_cap6.png"},
						{"p":"New York Yankees","v":"new_york_yankees", "img":"mlbhats/new_york_yankees_game_47_franchise_cap6.png"},
						{"p":"Oakland Athletics","v":"oakland_athletics", "img":"mlbhats/oakland_athletics_road_47_franchise_cap6.png"},
						{"p":"Philadelphia Phillies","v":"philadelphia_phillies", "img":"mlbhats/philadelphia_phillies_adjustable_clean_up_hat5.png"},
						{"p":"Pittsburgh Pirates","v":"pittsburgh_pirates", "img":"mlbhats/pittsburgh_pirates_adjustable_clean_up_hat8.png"},
						{"p":"San Diego Padres","v":"san_diego_padres", "img":"mlbhats/san_diego_padres_game_47_franchise_cap6.png"},
						{"p":"San Francisco Giants","v":"san_francisco_giants", "img":"mlbhats/san_francisco_giants_black_franchise_cap6.png"},
						{"p":"Seattle Mariners","v":"seattle_mariners", "img":"mlbhats/seattle_mariners_game_47_franchise_cap7.png"},
						{"p":"St. Louis Cardinals","v":"st_louis_cardinals", "img":"mlbhats/st__louis_cardinals_scarlet_franchise_cap6.png"},
						{"p":"Tampa Bay Rays","v":"tampa_bay_Rays", "img":"mlbhats/tampa_bay_rays_game_47_franchise_cap6.png"},
						{"p":"Texas Rangers","v":"texas_rangers", "img":"mlbhats/texas_rangers_adjustable_clean_up_hat5.png"},
						{"p":"Toronto Blue Jays","v":"toronto_blue_jays", "img":"mlbhats/toronto_blue_jays_game_47_franchise_cap6.png"},
						{"p":"Washington Nationals","v":"washington_nationals", "img":"mlbhats/washington_nationals_game_47_franchise_cap7.png"}],
			'app_nfl' : [{"p":"Arizona Cardinals","v":"arizona_cardinals"},
						{"p":"Atlanta Falcons","v":"atlanta_falcons"},
						{"p":"Baltimore Ravens","v":"baltimore_ravens"},
						{"p":"Buffalo Bills","v":"buffalo_bills"},
						{"p":"Carolina Panthers","v":"carolina_panthers"},
						{"p":"Chicago Bears","v":"chicago_bears", "img":"chicagobears2013/chicago_bears_throwback_franchise_fitted_hat2.jpg"},
						{"p":"Cincinnati Bengals","v":"cincinnati_bengals"},
						{"p":"Cleveland Browns","v":"cleveland_browns"},
						{"p":"Dallas Cowboys","v":"dallas_cowboys"},
						{"p":"Denver Broncos","v":"denver_broncos"},
						{"p":"Detroit Lions","v":"detroit_lions"},
						{"p":"Green Bay Packers","v":"green_bay_packers"},
						{"p":"Houston Texans","v":"houston_texans"},
						{"p":"Indianapolis Colts","v":"indianapolis_colts"},
						{"p":"Jacksonville Jaguars","v":"jacksonville_jaguars"},
						{"p":"Kansas City Chiefs","v":"kansas_city_chiefs"},
						{"p":"Miami Dolphins","v":"miami_dolphins"},
						{"p":"Minnesota Vikings","v":"minnesota_vikings"},
						{"p":"New England Patriots","v":"new_england_patriots"},
						{"p":"New York Giants","v":"new_york_giants"},
						{"p":"New Orleans Saints","v":"new_orleans_saints"},
						{"p":"New York Jets","v":"new_york_jets"},
						{"p":"Oakland Raiders","v":"oakland_raiders"},
						{"p":"Philadelphia Eagles","v":"philadelphia_eagles"},
						{"p":"Pittsburgh Steelers","v":"pittsburgh_steelers"},
						{"p":"San Diego Chargers","v":"san_diego_chargers"},
						{"p":"San Francisco 49ers","v":"san_francisco_49ers"},
						{"p":"Seattle Seahawks","v":"seattle_seahawks"},
						{"p":"St. Louis Rams","v":"st_louis_rams"},
						{"p":"Tampa Bay Buccaneers","v":"tampa_bay_buccaneers"},
						{"p":"Tennessee Titans","v":"tennessee_titans"},
						{"p":"Washington Redskins","v":"washington_redskins"}],
			'app_nhl' : [{"p":"Chicago Blackhawks","v":"chicago_blackhawks"}],
			},
		
		options : {
			"app_promo" : [],
			"app_brands" : [{"p":"47 Brand","v":"47_brand"},{"p":"5th & Ocean","v":"5th_ocean"},{"p":"Adidas","v":"adidas"},{"p":"American Needle","v":"american_needle"},{"p":"Aminco","v":"aminco"},{"p":"Antigua","v":"antigua"},{"p":"Baby Fanatic","v":"baby_fanatic"},{"p":"Bare Feet","v":"bare_feet"},{"p":"Belle View","v":"belle_view"},{"p":"Big League Promotions","v":"big_league_promotions"},{"p":"Concept One","v":"concept_one"},{"p":"Coopersburg Sports","v":"coopersburg_sports"},{"p":"Cooperstown Cookie","v":"cooperstown_cookie"},{"p":"Cooperstown Cookie","v":"cooperstown_cookie"},{"p":"Cufflinks, Inc","v":"cufflinks_inc"},{"p":"Ditka Gridiron Clothing","v":"ditka_gridiron_clothing"},{"p":"Emblem Source","v":"emblem_source"},{"p":"Fan Mats","v":"fan_mats"},{"p":"Forever Collectibles","v":"forever_collectibles"},{"p":"Fremont Die","v":"fremont_die"},{"p":"G-III","v":"g_iii"},{"p":"Game Time","v":"game_time"},{"p":"Gold Sport Collectibles","v":"gold_sport_collectibles"},{"p":"Great American","v":"great_american"},{"p":"Holy Cow Canvas","v":"holy_cow_canvas"},{"p":"Hunter","v":"hunter"},{"p":"Imperial International","v":"imperial_international"},{"p":"Jarden","v":"jarden"},{"p":"Kolder","v":"kolder"},{"p":"Label Daddy","v":"label_daddy"},{"p":"Littlearth","v":"littlearth"},{"p":"LogoArt Watches","v":"logoart_watches"},{"p":"Majestic Athletic","v":"majestic_athletic"},{"p":"McArthur","v":"mcarthur"},{"p":"Milliken","v":"milliken"},{"p":"My Owners Box","v":"my_owners_box"},{"p":"New Era","v":"new_era"},{"p":"NFL Brand","v":"nfl_brand"},{"p":"Nike","v":"nike"},{"p":"Northwest","v":"northwest"},{"p":"Nostalgic Images","v":"nostalgic_images"},{"p":"Original Retro Brand","v":"original_retro_brand"},{"p":"Pangea Brands","v":"pangea_brands"},{"p":"Party Animal","v":"party_animal"},{"p":"Phiten","v":"phiten"},{"p":"ProMark","v":"promark"},{"p":"Rawlings","v":"rawlings"},{"p":"Red Jacket","v":"red_jacket"},{"p":"Reebok","v":"reebok"},{"p":"Reyn Spooner","v":"reyn_spooner"},{"p":"Rico Tag","v":"rico_tag"},{"p":"S. Propaganda","v":"s_propaganda"},{"p":"Section 101","v":"section_101"},{"p":"Siskiyou","v":"siskiyou"},{"p":"Soft as a Grape","v":"soft_as_a_grape"},{"p":"Sports Coverage","v":"sports_coverage"},{"p":"Stitches","v":"stitches"},{"p":"Team Sports America","v":"team_sports_america"},{"p":"That's My Ticket","v":"thats_my_ticket"},{"p":"ThirtyFive55","v":"thirtyfive55"},{"p":"Touch by Alyssa Milano","v":"touch_by_alyssa_milano"},{"p":"True Fan","v":"true_fan"},{"p":"Wild Sports","v":"wild_sports"},{"p":"Wincraft","v":"wincraft"},{"p":"Winning Streak","v":"winning_streak"},{"p":"Wright & Ditson","v":"wright_ditson"}],
			"app_prod_demographic" : [{"p":"Kids / Infants","v":"kids"},{"p":"Mens","v":"men"},{"p":"Womens","v":"women"}],
			"app_department" : [{"p":"Accessories","v":"accessories"},{"p":"Hat","v":"hat"},{"p":"Jersey","v":"jersey"},{"p":"Sale","v":"sale"},{"p":"Souvenir","v":"souvenir"},{"p":"Sweatshirt/Jacket","v":"sweatshirt_jacket"},{"p":"T-Shirt","v":"t_shirt"}],
			//THIS IS CAP TYPE
			"app_sub_department" : [{"p":"Adjustable","v":"adjustable"},{"p":"Fitted","v":"fitted"},{"p":"Flex Fit / Stretch","v":"flex_fit_stretch"},{"p":"Snapback","v":"snapback"},{"p":"Visors / Floppy","v":"visors_floppy"},{"p":"Winter","v":"winter"}], 
			"app_t_shirts" : [{"p":"Customized","v":"customized"},{"p":"Long Sleeve","v":"long_sleeve"},{"p":"Short Sleeve","v":"short_sleeve"}],
			"app_jerseys" : [{"p":"Alternate","v":"alternate"},{"p":"Authentic","v":"authentic"},{"p":"Blank","v":"blank"},{"p":"Cooperstown","v":"cooperstown"},{"p":"Custom Personalized","v":"custom_personalized"},{"p":"Institutionalized","v":"institutionalized"},{"p":"Replica","v":"replica"}],
			"app_souvenirs" : [{"p":"Auto","v":"auto"},{"p":"Books / Movies / Music","v":"books_movies_music"},{"p":"Die Hard Cub Fan","v":"die_hard_cub_fan"},{"p":"Display Cases","v":"display_cases"},{"p":"Games","v":"games"},{"p":"Holiday","v":"holiday"},{"p":"Home Decor","v":"home_decor"},{"p":"Lapel Pins","v":"lapel_pins"},{"p":"Pet Products","v":"pet_products"},{"p":"Pictures","v":"pictures"},{"p":"School / Office / Home","v":"school_office_home"},{"p":"Signs & Flags","v":"signs_flags"},{"p":"Under $20","v":"under_20"},{"p":"Watches, Jewelry & Keychains","v":"watches_jewelry_keychains"},{"p":"Souvenirs","v":"souvenirs"}]
			},
			
		staticData : {
			"fieldcam" : {
				"cam1" : '<iframe width="650" scrolling="no" height="366" frameborder="0" src="http://www.earthcam.com/js/cubworld.php" marginwidth="0" marginheight="0"></iframe>',
				"cam2" : '<object width="650" height="480" align="middle" id="metro_cam_player_01" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=7,0,0,0" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"><param value="sameDomain" name="allowScriptAccess"><param value="http://www.earthcam.com/swf/dotcom_live_viewer_multi_size.swf?http://images.earthcam.com/ec_metros/ourcams/rosensports.jpg,50,1000" name="movie"><param value="high" name="quality"><param value="#000000" name="bgcolor"><embed width="650" height="480" align="middle" pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash" allowscriptaccess="sameDomain" name="metro_cam_player_01" bgcolor="#000000" quality="high" src="http://www.earthcam.com/swf/dotcom_live_viewer_multi_size.swf?http://images.earthcam.com/ec_metros/ourcams/rosensports.jpg,50,1000"></object>'
				}
			}
		} //r object.
	return r;
	}
