(function(_app){
var configURI = (document.location.protocol == 'file:') ? _app.vars.testURL+'jsonapi/config.js' : _app.vars.baseURL+'jsonapi/config.js';

_app.u.loadScript(configURI,function(){
//in some cases, such as the zoovy UI, zglobals may not be defined. If that's the case, certain vars, such as jqurl, must be passed in via P in initialize:
//	_app.u.dump(" ->>>>>>>>>>>>>>>>>>>>>>>>>>>>> zGlobals is an object");
	_app.vars.username = zGlobals.appSettings.username.toLowerCase(); //used w/ image URL's.
//need to make sure the secureURL ends in a / always. doesn't seem to always come in that way via zGlobals
	_app.vars.secureURL = zGlobals.appSettings.https_app_url;
	_app.vars.domain = zGlobals.appSettings.sdomain; //passed in ajax requests.
	_app.vars.jqurl = (document.location.protocol === 'file:') ? _app.vars.testURL+'jsonapi/' : '/jsonapi/';
	
	var startupRequires = ['quickstart','store_swc']
	
	if(_robots._robotGreeting){
		startupRequires.push('seo_robots');
		}
	else{
		_robots.hello = function(){
			_app.require('seo_robots', function(){
				//The init process of the ext should change the implementation of _robots.hello before it gets called here
				_robots.hello();
				});
			}
		}
	
	_app.require(startupRequires, function(){
		setTimeout(function(){$('#appView').removeClass('initFooter');}, 1200);
		_app.ext.quickstart.callbacks.startMyProgram.onSuccess();
				
		_app.model.addDispatchToQ({"_cmd":"appResource","filename":"elastic_public.json","_tag":{"datapointer":"appResource|elastic_public", "callback":"handleElasticFields","extension":"store_swc"}},'mutable');
		_app.model.dispatchThis('mutable');
		if(_robots._robotGreeting){
			_app.ext.seo_robots.u.welcomeRobot(_robots._robotGreeting);
			}
		});
	}); //The config.js is dynamically generated.
	
_app.extend({
	"namespace" : "quickstart",
	"filename" : "app-quickstart.js"
	});

_app.couple('quickstart','addPageHandler',{
	"pageType" : "static",
	"handler" : function($container, infoObj){
		var deferred = $.Deferred();
		infoObj.defPipeline.addDeferred(deferred);
		if(infoObj.deferred){
			infoObj.defPipeline.addDeferred(infoObj.deferred);
			}
		infoObj.require = infoObj.require || [];
		_app.require(infoObj.require,function(){
			infoObj.verb = 'translate';
			infoObj.templateid = infoObj.templateID;
			var $page = new tlc().runTLC(infoObj);
			//$page.tlc(infoObj);
			$page.data('templateid',infoObj.templateid);
			$page.data('pageid',infoObj.id);
			$container.append($page);
			infoObj.state = 'complete';
			//this method is synchronous so no extra deferred required
			_app.renderFunctions.handleTemplateEvents($page,infoObj);
			deferred.resolve();
			});
		}
	});

_app.extend({
	"namespace" : "order_create",
	"filename" : "extensions/checkout/extension.js"
	});

_app.couple('quickstart','addPageHandler',{
	"pageType" : "checkout",
	"handler" : function($container, infoObj){
		var deferred = $.Deferred();
		infoObj.defPipeline.addDeferred(deferred);
		infoObj.templateID = 'checkoutTemplate';
		_app.require(['order_create','cco', 'extensions/checkout/active.html'],function(){
			$container.attr('id', 'checkoutContainer');
			_app.ext.order_create.a.startCheckout($container,_app.model.fetchCartID());
			infoObj.state = 'complete'; //needed for handleTemplateEvents.
			_app.renderFunctions.handleTemplateEvents($container,infoObj);
			deferred.resolve();
			});
		}
	});
	
_app.extend({
	"namespace" : "cco",
	"filename" : "extensions/cart_checkout_order.js"
	});

_app.couple('quickstart','addPageHandler',{
	"pageType" : "cart",
	"handler" : function($container, infoObj){
		infoObj.deferred = $.Deferred();
		infoObj.defPipeline.addDeferred(infoObj.deferred);
		infoObj.navcat = zGlobals.appSettings.rootcat;
		infoObj.cartid = _app.model.fetchCartID();
		infoObj.templateID = 'cartTemplate';
		infoObj.trigger = 'fetch';
		_app.require(['cco','order_create','templates.html'],function(){
			//var $cart = new tlc().getTemplateInstance('cartTemplate');
			//var $cart = $(_app.renderFunctions.createTemplateInstance('cartTemplate',infoObj));
			var $cart = _app.ext.cco.a.getCartAsJqObj(infoObj);
			$container.append($cart);
			
			$cart.on('complete',function(){
				$("[data-app-role='shipMethodsUL']",$(this)).find(":radio").each(function(){
					$(this).attr('data-app-change','quickstart|cartShipMethodSelect');
					});
				});

			$cart.trigger(infoObj.trigger,$.extend({'Q':'mutable'},infoObj));
				_app.model.dispatchThis('mutable');
			
			// _app.calls.cartDetail.init(_app.model.fetchCartID(),{
				// 'callback':'tlc',
				// 'onComplete' : function(){
					// infoObj.state = 'complete';
					// _app.renderFunctions.handleTemplateEvents($cart,$.extend(true,{},infoObj));
					// },
				// 'jqObj' : $cart,
				// 'verb' : 'translate'
				// },'mutable');
			// _app.model.dispatchThis('mutable');
			});
		}
	});
_app.u.bindTemplateEvent(function(templateID){ return (templateID == 'cartTemplate' || templateID == 'fieldcamTemplate')},'depart.destroy',function(event, $context, infoObj){
	var $page = $context.closest('[data-app-uri]');
	if($page){
		$page.empty().remove();
		}
	});

_app.extend({
	"namespace" : "store_routing",
	"filename" : "extensions/store_routing.js"
	});
	//formerly in startup callback of store_routing
_app.router.addAlias('product',		function(routeObj){_app.ext.quickstart.a.newShowContent(routeObj.value,	$.extend({'pageType':'product'}, routeObj.params));});
_app.router.appendHash({'type':'match','route':'/product/{{pid}}/{{name}}*','callback':'product'});
_app.router.appendHash({'type':'match','route':'/product/{{pid}}*','callback':'product'});


_app.router.addAlias('homepage',	function(routeObj){_app.ext.quickstart.a.newShowContent(routeObj.value,	$.extend({'pageType':'homepage'}, routeObj.params));});
_app.router.appendHash({'type':'exact','route':'/home','callback':'homepage'});
_app.router.appendHash({'type':'exact','route':'/home/','callback':'homepage'});
_app.router.appendHash({'type':'exact','route':'/','callback':'homepage'});

_app.router.addAlias('category',	function(routeObj){_app.ext.quickstart.a.newShowContent(routeObj.value,	$.extend({'pageType':'category'}, routeObj.params));});
_app.router.appendHash({'type':'match','route':'/category/{{navcat}}*','callback':'category'});

_app.router.addAlias('search',		function(routeObj){_app.ext.quickstart.a.newShowContent(routeObj.value,	$.extend({'pageType':'search'}, routeObj.params));});
_app.router.appendHash({'type':'match','route':'/search/tag/{{tag}}*','callback':'search'});
_app.router.appendHash({'type':'match','route':'/search/keywords/{{KEYWORDS}}*','callback':'search'});

_app.router.addAlias('checkout',	function(routeObj){_app.ext.quickstart.a.newShowContent(routeObj.value,	$.extend({'pageType':'checkout', 'requireSecure':true}, routeObj.params));});
_app.router.appendHash({'type':'exact','route':'/checkout','callback':'checkout'});
_app.router.appendHash({'type':'exact','route':'/checkout/','callback':'checkout'});

_app.router.addAlias('cart',	function(routeObj){_app.ext.quickstart.a.newShowContent(routeObj.value,	$.extend({'pageType':'cart'}, routeObj.params));});
_app.router.appendHash({'type':'exact','route':'/cart','callback':'cart'});
_app.router.appendHash({'type':'exact','route':'/cart/','callback':'cart'});

_app.router.appendHash({'type':'exact','route':'/404','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'static',
		'templateID':'pageNotFoundTemplate',
		'require':'templates.html'
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});

_app.router.appendHash({'type':'exact','route':'/about_us/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'static',
		'templateID':'aboutUsTemplate',
		'require':['templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'exact','route':'/contact_us/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'static',
		'templateID':'contactUsTemplate',
		'require':['templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'exact','route':'/frequently_asked_questions/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'static',
		'templateID':'faqTemplate',
		'require':['templates.html']
		});
	dump(routeObj.params);
	routeObj.params.deferred = $.Deferred();
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.u.bindTemplateEvent('faqTemplate','complete.faq',function(event, $context, infoObj){
	$context.off('complete.faq');
	dump('in faq complete event');
	_app.require(['store_crm','templates.html'],function(){
		_app.ext.store_crm.calls.appFAQsAll.init({'jqObj':$('.faqContent',$context),'deferred':infoObj.deferred,'callback':'showFAQTopics','extension':'store_crm','templateID':'faqTopicTemplate'});
		_app.model.dispatchThis();			
		});
	});
_app.router.appendHash({'type':'exact','route':'/payment_policy/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'static',
		'templateID':'paymentTemplate',
		'require':['templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'exact','route':'/privacy_policy/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'static',
		'templateID':'privacyTemplate',
		'require':['templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'exact','route':'/return_policy/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'static',
		'templateID':'returnTemplate',
		'require':['templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'exact','route':'/shipping_policy/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'static',
		'templateID':'shippingTemplate',
		'require':['templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
	
_app.router.appendHash({'type':'exact','route':'/fieldcam/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'static',
		'dataset': {
			"cam1" : '<iframe width="650" scrolling="no" height="366" frameborder="0" src="http://www.earthcam.com/js/cubworld.php" marginwidth="0" marginheight="0"></iframe>',
			"cam2" : '<object width="600" height="480" align="middle" id="metro_cam_player_01" codebase="http://fpdownload.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=7,0,0,0" classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000"><param value="sameDomain" name="allowScriptAccess"><param value="http://www.earthcam.com/swf/dotcom_live_viewer_multi_size.swf?http://images.earthcam.com/ec_metros/ourcams/rosensports.jpg,50,1000" name="movie"><param value="high" name="quality"><param value="#000000" name="bgcolor"><embed width="600" height="480" align="middle" pluginspage="http://www.macromedia.com/go/getflashplayer" type="application/x-shockwave-flash" allowscriptaccess="sameDomain" name="metro_cam_player_01" bgcolor="#000000" quality="high" src="http://www.earthcam.com/swf/dotcom_live_viewer_multi_size.swf?http://images.earthcam.com/ec_metros/ourcams/rosensports.jpg,50,1000"></object>'
			},
		'templateID':'fieldcamTemplate'
		});
	_app.require(['templates.html','store_swc'],function(){
		_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params)
		});
	}});
_app.router.appendHash({'type':'exact','route':'/affiliates/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'static',
		'templateID':'affiliatesTemplate',
		'require':['templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'exact','route':'/connect_with_sportsworld/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'static',
		'templateID':'socialTemplate',
		'require':['templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'exact','route':'/major_league_baseball/','callback':function(routeObj){
	$.extend(routeObj.params,{'pageType':'category','navcat':'.mlb','templateID':'leagueTemplate'});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'match','route':'/major_league_baseball/{{team}}/','callback':function(routeObj){
	$.extend(routeObj.params,{'sport':'app_mlb','team':routeObj.params.team,'pageType':'category','navcat':'.mlb.'+routeObj.params.team,'templateID':'leagueTeamTemplate'});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'exact','route':'/national_football_league/','callback':function(routeObj){
	$.extend(routeObj.params,{'pageType':'category','navcat':'.nfl_teams','templateID':'leagueTemplate'});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'match','route':'/national_football_league/{{team}}/','callback':function(routeObj){
	$.extend(routeObj.params,{'sport':'app_nfl','team':routeObj.params.team,'pageType':'category','navcat':'.nfl_teams.'+routeObj.params.team,'templateID':'leagueTeamTemplate'});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'exact','route':'/national_basketball_association/','callback':function(routeObj){
	$.extend(routeObj.params,{'pageType':'category','navcat':'.nba','templateID':'leagueTemplate'});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'exact','route':'/national_hockey_league/','callback':function(routeObj){
	$.extend(routeObj.params,{'pageType':'category','navcat':'.nhl','templateID':'leagueTemplate'});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
	
_app.u.bindTemplateEvent('leagueTeamTemplate', 'complete.filterlinks', function(event, $context, infoObj){
	var data = $.grep(_app.ext.store_swc.validTeams[infoObj.sport], function(e, i){ return e.v == infoObj.team})[0];
	for(var i in data.filters){
		data.filters[i].sport = infoObj.sport;
		data.filters[i].team = infoObj.team;
		}
	if(data){
		$('.filterSubcatContainer',$context).tlc({'verb':'transmogrify','templateid':$('.filterSubcatContainer',$context).attr('data-templateid'),'dataset':$.extend({},data)});
		}
	});
_app.router.appendHash({'type':'exact','route':'/careers/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'category',
		'navcat':'.careers',
		'templateID':'categoryTemplateHTML'
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});	
_app.router.appendHash({'type':'exact','route':'/inquiry/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'category',
		'navcat':'.help_desk.player-inquiry',
		'templateID':'inquiryTemplate',
		'require':['templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'exact','route':'/rewards/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'category',
		'navcat':'.rewards_program',
		'templateID':'rewardsTemplate',
		'require':['templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'exact','route':'/group_sales/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'category',
		'navcat':'.group_sales',
		'templateID':'groupSalesTemplate',
		'require':['templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'match','route':'/search/manufacturer/{{mfg}}*','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'search',
		'elasticsearch':{"query_string" : {"query" : decodeURIComponent(routeObj.params.mfg), "fields" : ["prod_mfg"]}},
		'require':['templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
	
_app.router.appendHash({'type':'exact','route':'/my_account/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'static',
		'login' : true,
		'templateID':'myAccountTemplate',
		'require':['cco','templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.u.bindTemplateEvent('myAccountTemplate','complete.customer',function(event, $context, infoObj){
	_app.ext.cco.calls.appCheckoutDestinations.init(_app.model.fetchCartID(),{},'mutable'); //needed for country list in address editor.
	_app.model.addDispatchToQ({"_cmd":"buyerAddressList","_tag":{'callback':'tlc','jqObj':$('.mainColumn',$context),'verb':'translate','datapointer':'buyerAddressList'}},'mutable');
	_app.model.dispatchThis();							
	});
_app.router.appendHash({'type':'exact','route':'/change_password/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'static',
		'login' : true,
		'templateID':'changePasswordTemplate',
		'require':['templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.router.appendHash({'type':'exact','route':'/my_order_history/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'static',
		'login' : true,
		'templateID':'orderHistoryTemplate',
		'require':['templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.u.bindTemplateEvent('changePasswordTemplate','complete.customer',function(event, $context, infoObj){
	_app.model.addDispatchToQ({"_cmd":"buyerPurchaseHistory","_tag":{
		"datapointer":"buyerPurchaseHistory",
		"callback":"tlc",
		"verb" : "translate",
		"jqObj" : $("[data-app-role='orderList']",$context).empty()
		}},"mutable");
	_app.model.dispatchThis();							
	});
_app.router.appendHash({'type':'exact','route':'/my_wishlist/','callback':function(routeObj){
	$.extend(routeObj.params,{
		'pageType':'static',
		'login' : true,
		'templateID':'customerListsTemplate',
		'require':['templates.html']
		});
	_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params);
	}});
_app.u.bindTemplateEvent('customerListsTemplate','complete.customer',function(event, $context, infoObj){
	_app.model.addDispatchToQ({"_cmd":"buyerProductLists","_tag":{"datapointer":"buyerProductLists",'verb':'translate','jqObj': $('.mainColumn',$context),'callback':'tlc',onComplete : function(rd){
//data formatting on lists is unlike any other format for product, so a special handler is used.				
		function populateBuyerProdlist(listID,$context)	{
			//add the product list ul here because tlc statement has list ID for bind.
			$("[data-buyerlistid='"+listID+"']",$context).append("<ul data-tlc=\"bind $var '.@"+listID+"'; store_prodlist#productlist  --hideSummary='1' --withReviews='1' --withVariations='1' --withInventory='1' --templateid='productListTemplateBuyerList'  --legacy;\" class='listStyleNone fluidList clearfix noPadOrMargin productList'></ul>");
			_app.model.addDispatchToQ({"_cmd":"buyerProductListDetail","listid":listID,"_tag" : {'datapointer':'buyerProductListDetail|'+listID,"listid":listID,'callback':'buyerListAsProdlist','extension':'quickstart', "require":"store_prodlist",'jqObj':$("[data-buyerlistid='"+listID+"'] ul",$context)}},'mutable');
			}
		
		var data = _app.data[rd.datapointer]['@lists']; //shortcut
		var L = data.length;
		var numRequests = 0;
		for(var i = 0; i < L; i += 1)	{
			populateBuyerProdlist(data[i].id,rd.jqObj)
			}
		_app.model.dispatchThis('mutable');
		//no sense putting 1 list into an accordion.
		if(L > 1)	{
			$('.applyAccordion',rd.jqObj).accordion({heightStyle: "content"});
			}
		}}},"mutable");
	_app.model.dispatchThis();							
	});
	
	
_app.router.appendHash({'type':'match','route':'/filter/{{id}}*','callback':function(routeObj){
	_app.require(['store_swc','seo_robots', 'store_search','store_routing','prodlist_infinite','store_prodlist', 'templates.html'], function(){
		if(_app.ext.store_swc.filterData[routeObj.params.id]){
			function showFilterPage(){
				if(_app.ext.store_swc.vars.elasticFieldsLoaded){
					routeObj.params.templateID = "filteredSearchTemplate";
					routeObj.params.dataset = $.extend(true, {}, _app.ext.store_swc.filterData[routeObj.params.id]);
					if(routeObj.params.dataset.onEnter){
						routeObj.params.dataset.onEnter();
						}
					var optStrs = routeObj.params.dataset.optionList;
					routeObj.params.dataset.options = routeObj.params.dataset.options || {};
					for(var i in optStrs){
						var o = optStrs[i];
						if(_app.ext.store_swc.vars.elasticFields[o]){
							routeObj.params.dataset.options[o] = $.extend(true, {}, _app.ext.store_swc.vars.elasticFields[o]);
							if(routeObj.searchParams && routeObj.searchParams[o]){
								var values = routeObj.searchParams[o].split('|');
								for(var i in routeObj.params.dataset.options[o].options){
									var option = routeObj.params.dataset.options[o].options[i];
									if($.inArray(option.v, values) >= 0){
										option.checked = "checked";
										}
									}
								}
							}
						else {
							dump("Unrecognized option "+o+" on filter page "+routeObj.params.id);
							}
						}
					if(routeObj.searchParams && routeObj.searchParams.sport && routeObj.searchParams.team){
						_app.ext.store_swc.u.setUserTeam({sport:routeObj.searchParams.sport,team:routeObj.searchParams.team}, true);
						}
					routeObj.params.dataset.userTeam = _app.ext.store_swc.vars.userTeam;
					
					if(routeObj.params.dataset.titleBuilder){
						routeObj.params.dataset.seo_title = routeObj.params.dataset.titleBuilder(routeObj.params.dataset.userTeam.p);
						}
						
					if(routeObj.params.dataset.descriptionBuilder){
						routeObj.params.dataset.seo_description = routeObj.params.dataset.descriptionBuilder(routeObj.params.dataset.userTeam.p);
						}
					
					if(routeObj.params.dataset.metaDescriptionBuilder){
						routeObj.params.dataset.meta_description = routeObj.params.dataset.metaDescriptionBuilder(routeObj.params.dataset.userTeam.p);
						}
					routeObj.params.deferred = $.Deferred();
					// routeObj.params.loadFullList = _app.ext.seo_robots.u.isRobotPresent();
					routeObj.params.pageType = 'static';
					_app.ext.quickstart.a.newShowContent(routeObj.value,routeObj.params)
					}
				else{
					setTimeout(showFilterPage, 100);
					}
				}
			showFilterPage();
			}
		else {
			_app.ext.quickstart.a.newShowContent('404');
			}
		});
	}});
	
_app.u.bindTemplateEvent('filteredSearchTemplate', 'complete.filter',function(event, $context, infoObj){
	$('.closeButton', $context).button({'icons':{"primary":"ui-icon-closethick"}, "text":false});
	$('form.filterList', $context).data('loadFullList', infoObj.loadFullList);
	if(infoObj.deferred){
		$('form.filterList',$context).data('deferred', infoObj.deferred);
		}
	//quick hack- we know if there's scroll restore data, that we've been there before so we don't need to resubmit the form
	if(!$context.data('scroll-restore')){
		var $form = $('form.filterList', $context);
		function submitForm(){
			if($form.attr('data-filter-base')){
				dump($form.attr('data-filter-base'));
				$form.trigger('submit');
				}
			else {
				dump('gotta wait');
				setTimeout(submitForm,100);
				}
			}
		setTimeout(submitForm,0);
		}
	});
	
_app.u.bindTemplateEvent(function(){return true;}, 'complete.routing', function(event, $context, infoObj){
	if(infoObj){
		var canonical = "";
		
		var $routeEle = $('[data-canonical]',$context);
		if($routeEle.length){ canonical = $routeEle.attr('data-canonical'); }
		else{
			canonical = $context.closest('[data-app-uri]').attr('data-app-uri');
			}
		
		var $canonical = $('link[rel=canonical]')
		if(!$canonical.length){
			dump('NO CANONICAL IN THE DOCUMENT');
			$canonical = $('<link rel="canonical" href="" />');
			$('head').append($canonical);
			}
		$canonical.attr('href', canonical);
		}
	});
	
_app.extend({
	"namespace" : "store_tracking",
	"filename" : "extensions/store_tracking.js"
	});
_app.couple('order_create','addOrderCompleteHandler',{
	'handler':function(P){
		_app.require('store_tracking',function(){
			if(P && P.datapointer && _app.data[P.datapointer] && _app.data[P.datapointer].order){
				var order = _app.data[P.datapointer].order;
				var plugins = zGlobals.plugins;
				// note: order is an object that references the raw (public) cart
				// order.our.xxxx  order[@ITEMS], etc.
				// data will appear in google analytics immediately after adding it (there is no delay)
				ga('require', 'ecommerce');
				//analytics tracking
				var r = {
					'id' : order.our.orderid,
					'revenue' : order.sum.items_total,
					'shipping' : order.sum.shp_total,
					'tax' : order.sum.tax_total
					};
				// _app.u.dump(r);
				ga('ecommerce:addTransaction',r);

				for(var i in order['@ITEMS']){
					var item = order['@ITEMS'][i];
					// _app.u.dump(item);
					ga('ecommerce:addItem', {
						'id' : order.our.orderid,
						'name' : item.prod_name,
						'sku' : item.sku,
						'price' : item.base_price,
						'quantity' : item.qty,
						})
					};

				ga('ecommerce:send');
				_app.u.dump('FINISHED store_tracking.onSuccess (google analytics)');
				
				for(var i in plugins){
					if(_app.ext.store_tracking.trackers[i] && _app.ext.store_tracking.trackers[i].enable){
						_app.ext.store_tracking.trackers[i](order, plugins[i]);
						}
					}
				}
			});
		}
	});

//Generate meta information
_app.u.bindTemplateEvent(function(){return true;}, 'complete.metainformation',function(event, $context, infoObj){
	var defaultTitle = "Chicago Cubs Apparel & Merchandise";
	var titlePrefix = "";
	var titlePostfix = " | SportsWorldChicago.com";
	
	var baseTitle = $('[data-seo-title]', $context).attr('data-seo-title') || defaultTitle;
	var desc = $('[data-seo-desc]', $context).attr('data-seo-desc') || '';
	
	document.title = titlePrefix + baseTitle + titlePostfix;
	$('meta[name=description]').attr('content', desc);
	});
	
//Scroll restore
_app.u.bindTemplateEvent(function(){return true;}, 'complete.scrollrestore',function(event, $context, infoObj){
	var scroll = $context.data('scroll-restore');
	if(scroll){
		$('html, body').animate({scrollTop : scroll}, 300);
		}
	else if((infoObj.performJumpToTop === false) ? false : true) {
		$('html, body').animate({scrollTop : 0}, 300);
		}
	else {
		//do nothing
		}
	});
	
_app.u.bindTemplateEvent(function(){return true;}, 'depart.scrollrestore', function(event, $context, infoObj){
	var scroll = $('html').scrollTop()
	$context.data('scroll-restore',scroll);
	});

_app.extend({
	"namespace" : "store_swc",
	"filename" : "extensions/_store_swc.js"
	});
	
_app.u.bindTemplateEvent(function(){return true;}, 'complete.dismissnav',function(event, $context, infoObj){
	_app.require('store_swc',function(){
		_app.ext.store_swc.e.dismissNav(null, {preventDefault : function(){}});
		});
	});
_app.u.bindTemplateEvent('homepageTemplate', 'complete.slideshow',function(event, $context, infoObj){
	// We only need to run this once
	//		this will only remove this event from this instance of the template, but the template object itself 
	//		still has the listener.  Any future instances of the template will still have the listener upon creation
	$context.off('complete.slideshow');
	var $slideshow = $('.homeSlideshow', $context);
	$('img[data-src]', $slideshow).each(function(){
		$(this).attr('src', _app.u.makeImage({
			'name' : $(this).attr('data-src'), 
			'b' : $(this).attr('data-bgcolor'),
			'tag' : false
			}));
		});
	$slideshow.data('slideshow','true').cycle({
		fx:     'fade',
		speed:  'slow',
		timeout: 5000,
		slides : 'a'
		});
	});

	
_app.u.bindTemplateEvent('fieldcamTemplate', 'depart.destroy',function(event, $context, infoObj){
	$('[data-app-uri]', $context).empty().remove();
	});
	
_app.u.bindTemplateEvent('productTemplate', 'complete.invcheck',function(event, $context, infoObj){
	var data = _app.data['appProductGet|'+infoObj.pid];
	var variations = data['@variations'];
	if(variations.length == 1 /*&& variations[0].id.match(/A[BDEFGHM]/) */){
		var id = variations[0].id;
		$('select[name='+id+'] option', $context).each(function(){
			var sku = infoObj.pid+":"+id+""+$(this).attr("value");
			dump(sku);
			dump(data["@inventory"][sku]);
			if(data["@inventory"][sku] && data["@inventory"][sku].AVAILABLE <= 0){
				//$(this).attr("disabled","disabled");
				$(this).remove();
				}
			});
		}
	});
	
_app.extend({
	"namespace" : "jerseypreview",
	"filename" : "extensions/jerseypreview/extension.js"
	});
_app.u.bindTemplateEvent('productTemplate', 'complete.test', function(event, $context, infoObj){
	var pid = infoObj.pid;
	if($.inArray(pid, _app.ext.jerseypreview.vars.whitelist) >= 0 && typeof _app.ext.jerseypreview.vars.paramsByPID[pid] === 'undefined'){
		$.getJSON("extensions/jerseypreview/products/"+pid+".json?_="+(new Date().getTime()))
			.done(function(data, textStatus, jqXHR){
				_app.u.dump("Checking font face support");
				if(isFontFaceSupported){
					_app.u.dump("Font Face Supported");
					if(_app.data[infoObj.datapointer]["%attribs"]["user:jerseypreview_image"]){
						font = data.font;
						if(font){
							$context.append($("<div class='"+font+"'>Some Text</div>").css({"height": "0px", "overflow":"hidden"}));
							}
						
						data.img = $(_app.u.makeImage({
							name : _app.data[infoObj.datapointer]["%attribs"]["user:jerseypreview_image"],
							b : "FFFFFF",
							tag : 1
							})).get(0);
						_app.ext.jerseypreview.vars.paramsByPID[pid] = data;
						}
					else {
						_app.ext.jerseypreview.vars.paramsByPID[pid] = "Supported, but no Image Found";
						}
					}
				else {
					_app.u.throwMessage("Custom Jersey Previews are not available in your browser's version, sorry!");
					_app.ext.jerseypreview.vars.paramsByPID[pid] = "Font Face Not Supported";
					}
				})
			.fail(function(datajqXHR, textStatus, errorThrown){
				_app.ext.jerseypreview.vars.paramsByPID[pid] = "JSON failed to load";
				_app.u.dump("JSON failed to load");
				//report failure?
				});
		}
		
	$('input[name=B5], input[name=B6]', $context).keyup(function(){
		if($(this).data('timer')){
			clearTimeout($(this).data('timer'));
			}
		$(this).data('timer', setTimeout(function(){
			_app.ext.jerseypreview.u.updatePreview($context);
			}, 600));
		});
	});
	
_app.extend({
	"namespace" : "seo_robots",
	"filename" : "extensions/_robots.js"
	});
	
_app.extend({
	"namespace" : "store_prodlist",
	"filename" : "extensions/store_prodlist.js"
	});
	
_app.extend({
	"namespace" : "prodlist_infinite",
	"filename" : "extensions/prodlist_infinite.js"
	});
	
_app.extend({
	"namespace" : "store_navcats",
	"filename" : "extensions/store_navcats.js"
	});
	
_app.couple('quickstart','addPageHandler',{
	"pageType" : "homepage",
	"handler" : function($container, infoObj){
		infoObj.deferred = $.Deferred();
		infoObj.defPipeline.addDeferred(infoObj.deferred);
		dump('homepage handler');
		infoObj.navcat = zGlobals.appSettings.rootcat;
		_app.require(['store_navcats','templates.html','store_swc','store_routing'],function(){
			infoObj.templateID = 'homepageTemplate';
			_app.ext.store_navcats.u.showPage($container, infoObj);
			});
		}
	});
	
_app.couple('quickstart','addPageHandler',{
	"pageType" : "category",
	"handler" : function($container, infoObj){
		infoObj.deferred = $.Deferred();
		infoObj.prodRenderedDeferred = $.Deferred();
		infoObj.defPipeline.addDeferred(infoObj.deferred);
		infoObj.defPipeline.addDeferred(infoObj.prodRenderedDeferred);
		if(infoObj.navcat.charAt(0) != '.'){
			infoObj.navcat = '.'+infoObj.navcat
			}
		if(_app.ext.quickstart.vars.session.recentCategories[0] != infoObj.navcat)	{
			_app.ext.quickstart.vars.session.recentCategories.unshift(infoObj.navcat);
			}
		_app.require(['store_navcats','store_prodlist','prodlist_infinite','templates.html','store_swc','store_routing'],function(){
			if(infoObj.templateID){}
			else if(infoObj.templateID = _app.ext.store_swc.u.fetchTemplateForPage(infoObj.navcat)){}
			else{infoObj.templateID = 'categoryTemplate';}
			_app.ext.store_navcats.u.showPage($container, infoObj);
			});
						
		}
	});
	
_app.extend({
	"namespace" : "store_search",
	"filename" : "extensions/store_search.js"
	});
	
_app.couple('store_search','addUniversalFilter',{
	'filter' : {"has_child":{"type":"sku","query":{"range":{"available":{"gte":1}}}}}
	});
_app.couple('store_search','addUniversalFilter',{
	'filter' : {"not":{"term":{"tags":"IS_DISCONTINUED"}}}
	});
				
_app.couple('quickstart','addPageHandler',{
	"pageType" : "search",
	"handler" : function($container, infoObj){
		infoObj.deferred = $.Deferred();
		infoObj.defPipeline.addDeferred(infoObj.deferred);
		_app.require(['store_search','templates.html','store_routing'],function(){
			_app.ext.store_search.u.showSearch($container, infoObj);
			});
						
		}
	});
	
_app.extend({
	"namespace" : "store_product",
	"filename" : "extensions/store_product.js"
	});


_app.couple('quickstart','addPageHandler',{
	"pageType" : "product",
	"handler" : function($container, infoObj){
		infoObj.deferred = $.Deferred();
		infoObj.defPipeline.addDeferred(infoObj.deferred);
		if($.inArray(infoObj.pid,_app.ext.quickstart.vars.session.recentlyViewedItems) < 0)	{
			_app.ext.quickstart.vars.session.recentlyViewedItems.unshift(infoObj.pid);
			}
		else	{
			_app.ext.quickstart.vars.session.recentlyViewedItems.splice(0, 0, _app.ext.quickstart.vars.session.recentlyViewedItems.splice($.inArray(infoObj.pid, _app.ext.quickstart.vars.session.recentlyViewedItems), 1)[0]);
			}
		//IMPORTANT: requiring every extension needed in order to render the page, including TLC formats in the template
		_app.require(['store_product','store_navcats', 'store_swc', 'store_routing', 'store_search', 'templates.html', 'jerseypreview', 'partner_addthis'], function(){
			infoObj.templateID = 'productTemplate';
			_app.ext.store_product.u.showProd($container, infoObj);
			});
		}
	});
	
// _app.extend({
	// "namespace" : "cart_message",
	// "filename" : "extensions/cart_message/extension.js"
	// });
	
_app.extend({
	"namespace" : "store_crm",
	"filename" : "extensions/store_crm.js"
	});
	
// _app.extend({
	// "namespace" : "partner_addthis",
	// "filename" : "extensions/partner_addthis.js"
	// });
// _app.u.bindTemplateEvent('productTemplate', 'complete.test', function(event, $context, infoObj){
	// var $toolbox = $('.socialLinks', $context);
	// if($toolbox.hasClass('addThisRendered')){
		// //Already rendered, don't do it again.
		// }
	// else {
		// $toolbox.addClass('addThisRendered').append(
				// '<div class="addthis_toolbox addthis_default_style addthis_32x32_style">'
			// +		'<a class="addthis_button_preferred_1"></a>'
			// +		'<a class="addthis_button_preferred_2"></a>'
			// +		'<a class="addthis_button_preferred_3"></a>'
			// +		'<a class="addthis_button_preferred_4"></a>'
			// +		'<a class="addthis_button_preferred_5"></a>'
			// +		'<a class="addthis_button_preferred_6"></a>'
			// +		'<a class="addthis_button_preferred_7"></a>'
			// +		'<a class="addthis_button_preferred_8add"></a>'
			// +		'<a class="addthis_button_compact"></a>'
			// +	'</div>');
		
		// _app.ext.partner_addthis.u.toolbox($toolbox, infoObj);
		// }
	// });
	
_app.rq.push(['script',0,'lightbox/js/lightbox-2.6.min.js']);

_app.model.getGrammar("pegjs");


//Any code that needs to be executed after the app init has occured can go here.
//will pass in the page info object. (pageType, templateID, pid/navcat/show and more)
_app.u.appInitComplete = function()	{
//	_app.u.dump("Executing _appIsLoaded code...");
	
	_app.ext.order_create.checkoutCompletes.push(function(vars,$checkout){
		dump(" -> begin checkoutCOmpletes code: "); dump(vars);
		
		var cartContentsAsLinks = encodeURIComponent(_app.ext.cco.u.cartContentsAsLinks(_app.data[vars.datapointer].order));
	
		
//append this to 
		$("[data-app-role='thirdPartyContainer']",$checkout).append("<h2>What next?</h2><div class='ocm ocmFacebookComment pointer zlink marginBottom checkoutSprite  '></div><div class='ocm ocmTwitterComment pointer zlink marginBottom checkoutSprit ' ></div><div class='ocm ocmContinue pointer zlink marginBottom checkoutSprite'></div>");
		$('.ocmTwitterComment',$checkout).click(function(){
			window.open('http://twitter.com/home?status='+cartContentsAsLinks,'twitter');
			window[_app.vars.analyticsPointer]('send', 'event','Checkout','User Event','Tweeted about order');
			window[_app.vars.analyticsPointer]('send', 'event','Checkout','User Event','Tweeted about order');
			});
		//the fb code only works if an appID is set, so don't show banner if not present.				
		if(_app.u.thisNestedExists("zGlobals.thirdParty.facebook.appId") && typeof FB == 'object')	{
			$('.ocmFacebookComment',$checkout).click(function(){
				_app.ext.quickstart.thirdParty.fb.postToWall(cartContentsAsLinks);
				ga('send','event','Checkout','User Event','FB message about order');
				window[_app.vars.analyticsPointer]('send', 'event','Checkout','User Event','FB message about order');
				});
			}
		else	{$('.ocmFacebookComment').hide()}
		});
	
	//Cart Messaging Responses.
	_app.cmr.push(['chat.join',function(message){
		if(message.FROM == 'ADMIN')	{
			var $ui = _app.ext.quickstart.a.showBuyerCMUI();
			$("[data-app-role='messageInput']",$ui).show();
			$("[data-app-role='messageHistory']",$ui).append("<p class='chat_join'>"+message.FROM+" has joined the chat.<\/p>");
			$('.show4ActiveChat',$ui).show();
			$('.hide4ActiveChat',$ui).hide();
			}
		}]);

	_app.cmr.push(['goto',function(message,$context){
		var $history = $("[data-app-role='messageHistory']",$context);
		$P = $("<P>")
			.addClass('chat_post')
			.append("<span class='from'>"+message.FROM+"<\/span> has sent over a "+(message.vars.pageType || "")+" link for you within this store. <span class='lookLikeLink'>Click here<\/span> to view.")
			.on('click',function(){
				showContent(_app.ext.quickstart.u.whatAmIFor(message.vars),message.vars);
				});
		$history.append($P);
		$history.parent().scrollTop($history.height());
		}]);

	}





//this will trigger the content to load on app init. so if you push refresh, you don't get a blank page.
//it'll also handle the old 'meta' uri params.
//this will trigger the content to load on app init. so if you push refresh, you don't get a blank page.
//it'll also handle the old 'meta' uri params.
_app.router.appendInit({
	'type':'function',
	'route': function(v){
		return {'init':true} //returning anything but false triggers a match.
		},
	'callback':function(f,g){
		dump(" -> triggered callback for appendInit");
		g = g || {};
		var $existingPage = $('#mainContentArea [data-app-uri]')
		if($existingPage.length /*&& $existingPage.attr('data-app-uri') == document.location.pathname*/){
			//We are a transplanted document, let's load accordingly.
			//re-attach template handlers
			var $renderedTemplate = $('[data-templateid]', $existingPage);
			var templateid = $renderedTemplate.attr('data-templateid');
			for(var i in _app.templateEvents){
				var event = _app.templateEvents[i];
				if(event.filterFunc(templateid)){
					dump("Attaching event");
					dump(event);
					$renderedTemplate.on(event.event, event.handler);
					}
				}
			//handleURIChange here will not change the page, but it will execute appropriate events
			_app.router.handleURIChange($existingPage.attr('data-app-uri'), false, false, true, {"retrigger" : true});
			}
		else if (document.location.hash.indexOf("#!") == 0){
			var pathStr = document.location.hash.substr(2);
			var search = false;
			if(pathStr.indexOf('?') >= 0){
				var arr = pathStr.split('?');
				pathStr = arr[0];
				search = arr[1];
				}
			_app.router.handleURIChange("/"+pathStr, search, false, true);
			}
		else if(document.location.protocol == "file:"){
			_app.router.handleURIChange("/", document.location.search, document.location.hash, true);
			}
		else if (g.uriParams.marketplace){
			showContent("product",{"pid":g.uriParams.product});
			window[_app.vars.analyticsPointer]('send','event','Arrival','Syndication','product '+g.uriParams.product);
			}
		else if(document.location.pathname)	{	
			_app.u.dump('triggering handleHash');
			_app.router.handleURIChange(document.location.pathname, document.location.search, document.location.hash, true);
			}
		else	{
			_app.router.handleURIChange("/", document.location.search, document.location.hash, true);
			_app.u.throwMessage(_app.u.successMsgObject("We're sorry, the page you requested could not be found!"));
			window[_app.vars.analyticsPointer]('send', 'event','init','404 event',document.location.href);
			}
		if(g.uriParams && g.uriParams.meta)	{
			_app.require('cco', function(){
				_app.ext.cco.calls.cartSet.init({'want/refer':g.uriParams.meta,'cartID':_app.model.fetchCartID()},{},'passive');
				});
			}
		if(g.uriParams && g.uriParams.meta_src)	{
			_app.require('cco',function(){
				_app.ext.cco.calls.cartSet.init({'want/refer_src':g.uriParams.meta_src,'cartID':_app.model.fetchCartID()},{},'passive');
				});
			}
		$('#clickBlocker').remove();
		}
	});




})(myApp);