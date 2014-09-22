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
	
	_app.require('quickstart', function(){
		_app.ext.quickstart.callbacks.startMyProgram.onSuccess();
		});
	}); //The config.js is dynamically generated.
	
_app.extend({
	"namespace" : "quickstart",
	"filename" : "app-quickstart.js"
	});

_app.couple('quickstart','addPageHandler',{
	"pageType" : "static",
	"handler" : function($container, infoObj){
		infoObj.require = infoObj.require || [];
		_app.require(infoObj.require,function(){
			var $page = new tlc().getTemplateInstance(infoObj.templateID);
			dump($page);
			if(infoObj.dataset){
				infoObj.verb = 'translate';
				$page.tlc(infoObj);
				}
			$page.data('templateid',infoObj.templateid);
			$page.data('pageid',infoObj.id);
			$container.append($page);
			infoObj.state = 'complete';
			_app.renderFunctions.handleTemplateEvents($page,infoObj);
			});
		}
	});

_app.extend({
	"namespace" : "order_create",
	"filename" : "extensions/checkout/extension.js"
	});
	
_app.extend({
	"namespace" : "cco",
	"filename" : "extensions/cart_checkout_order.js"
	});
	
_app.extend({
	"namespace" : "store_routing",
	"filename" : "extensions/store_routing.js"
	});
	//formerly in startup callback of store_routing
_app.router.addAlias('product', 	function(routeObj){_app.ext.quickstart.a.newShowContent(routeObj.value,	$.extend({'pageType':'product'}, routeObj.params));});
_app.router.appendHash({'type':'match','route':'product/{{pid}}/{{name}}*','callback':'product'});
_app.router.appendHash({'type':'match','route':'product/{{pid}}*','callback':'product'});


_app.router.addAlias('homepage', 	function(routeObj){_app.ext.quickstart.a.newShowContent(routeObj.value,	$.extend({'pageType':'homepage'}, routeObj.params));});
_app.router.appendHash({'type':'exact','route':'home','callback':'homepage'});
_app.router.appendHash({'type':'exact','route':'home/','callback':'homepage'});
_app.router.appendHash({'type':'exact','route':'','callback':'homepage'});
_app.router.appendHash({'type':'exact','route':'/','callback':'homepage'});

_app.router.addAlias('category', 	function(routeObj){_app.ext.quickstart.a.newShowContent(routeObj.value,	$.extend({'pageType':'category'}, routeObj.params));});
_app.router.appendHash({'type':'match','route':'category/{{navcat}}*','callback':'category'});

_app.router.appendHash({'type':'match','route':'filter/{{id}}*','callback':function(routeObj){
	_app.require(['store_swc','seo_robots', 'templates.html'], function(){
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
							if(routeObj.hashParams && routeObj.hashParams[o]){
								var values = routeObj.hashParams[o].split('|');
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
					if(routeObj.hashParams && routeObj.hashParams.sport && routeObj.hashParams.team){
						_app.ext.store_swc.u.setUserTeam({sport:routeObj.hashParams.sport,team:routeObj.hashParams.team}, true);
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
					routeObj.params.loadFullList = _app.ext.seo_robots.u.isRobotPresent();
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
	
_app.u.bindTemplateEvent(function(){return true;}, 'complete.routing', function(event, $context, infoObj){
	dump('--> store_seo complete event'); 
	event.stopPropagation(); 
	if(infoObj){
		var hash = "";
		var $routeEle = $('[data-routing-hash]',$context);
		if($routeEle.length){ hash = $routeEle.attr('data-routing-hash'); }
		else {
			switch(infoObj.pageType){
				case 'homepage': hash = "#!/"; break;
				case 'product': hash = "#!product/"+infoObj.pid+"/"; break;
				case 'category': hash = "#!category/"+infoObj.navcat+"/"; break;
				case 'search': hash = window.location.hash; break;
				case 'company': hash = "#!company/"+infoObj.show+"/"; break;
				case 'customer': hash = "#!customer/"+infoObj.show+"/"; break;
				case 'cart': hash = "#!cart/"; break;
				case 'checkout': hash = "#!checkout/"; break;
				default: hash = window.location.hash; break;
				}
			}
		var $canonical = $('link[rel=canonical]')
		if(!$canonical.length){
			dump('NO CANONICAL IN THE DOCUMENT');
			$canonical = $('<link rel="canonical" href="" />');
			$('head').append($canonical);
			}
		$canonical.attr('href', hash);
		if(_app.vars.showContentHashChange){
			dump('forcing a hash change');
			window.location.href = window.location.href.split("#")[0]+hash;
			}
		}
	});
	
_app.extend({
	"namespace" : "store_tracking",
	"filename" : "extensions/store_tracking.js"
	});
	
_app.extend({
	"namespace" : "store_seo",
	"filename" : "extensions/store_seo.js"
	});
	
_app.extend({
	"namespace" : "scrollrestore",
	"filename" : "extensions/_scrollrestore.js"
	});

_app.extend({
	"namespace" : "store_swc",
	"filename" : "extensions/_store_swc.js"
	});
	
_app.extend({
	"namespace" : "jerseypreview",
	"filename" : "extensions/jerseypreview/extension.js"
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
	"namespace" : "seo_robots",
	"filename" : "extensions/_robots.js"
	});
	
_app.extend({
	"namespace" : "store_navcats",
	"filename" : "extensions/store_navcats.js"
	});
	
_app.couple('quickstart','addPageHandler',{
	"pageType" : "homepage",
	"handler" : function($container, infoObj){
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
		if(_app.ext.quickstart.vars.session.recentCategories[0] != infoObj.navcat)	{
			_app.ext.quickstart.vars.session.recentCategories.unshift(infoObj.navcat);
			}
		_app.require(['store_navcats','templates.html','store_swc','store_routing'],function(){
			if(infoObj.templateID = _app.ext.store_swc.u.fetchTemplateForPage(infoObj.navcat)){}
			else{infoObj.templateID = 'categoryTemplate';}
			_app.ext.store_navcats.u.showPage($container, infoObj);
			});
						
		}
	});
	
_app.extend({
	"namespace" : "store_search",
	"filename" : "extensions/store_search.js"
	});
	
_app.extend({
	"namespace" : "store_product",
	"filename" : "extensions/store_product.js"
	});

_app.u.bindTemplateEvent('productTemplate', 'complete.test', function(event, $context, infoObj){
	//alert('hi');
	});
_app.couple('quickstart','addPageHandler',{
	"pageType" : "product",
	"handler" : function($container, infoObj){
		if($.inArray(infoObj.pid,_app.ext.quickstart.vars.session.recentlyViewedItems) < 0)	{
			_app.ext.quickstart.vars.session.recentlyViewedItems.unshift(infoObj.pid);
			}
		else	{
			_app.ext.quickstart.vars.session.recentlyViewedItems.splice(0, 0, _app.ext.quickstart.vars.session.recentlyViewedItems.splice($.inArray(infoObj.pid, _app.ext.quickstart.vars.session.recentlyViewedItems), 1)[0]);
			}
		//IMPORTANT: requiring every extension needed in order to render the page, including TLC formats in the template
		_app.require(['store_product','store_navcats', 'store_swc', 'store_routing', 'store_search', 'templates.html'], function(){
			infoObj.templateID = 'productTemplate';
			_app.ext.store_product.u.showProd($container, infoObj);
			});
		}
	});
	
_app.extend({
	"namespace" : "cart_message",
	"filename" : "extensions/cart_message/extension.js"
	});
	
_app.extend({
	"namespace" : "store_crm",
	"filename" : "extensions/store_crm.js"
	});
	
	
_app.extend({
	"namespace" : "partner_addthis",
	"filename" : "extensions/partner_addthis.js"
	});
	
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
		if(g.uriParams.seoRequest){
			showContent(g.uriParams.pageType, g.uriParams);
			}
		else if (g.uriParams.marketplace){
			showContent("product",{"pid":g.uriParams.product});
			window[_app.vars.analyticsPointer]('send','event','Arrival','Syndication','product '+g.uriParams.product);
			}
		else if(document.location.search)	{	
			_app.u.dump('triggering handleHash');
			_app.router.handleURIChange(document.location.search.substr(1));
			}
		else	{
			_app.router.handleURIChange("");
			}
		if(g.uriParams && g.uriParams.meta)	{
			_app.ext.cco.calls.cartSet.init({'want/refer':infoObj.uriParams.meta,'cartID':_app.model.fetchCartID()},{},'passive');
			}
		if(g.uriParams && g.uriParams.meta_src)	{
			_app.ext.cco.calls.cartSet.init({'want/refer_src':infoObj.uriParams.meta_src,'cartID':_app.model.fetchCartID()},{},'passive');
			}
		}
	});




})(myApp);