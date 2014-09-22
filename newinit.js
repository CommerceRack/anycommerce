var configURI = (document.location.protocol == 'file:') ? myApp.vars.testURL+'jsonapi/config.js' : myApp.vars.baseURL+'jsonapi/config.js';

myApp.u.loadScript(configURI,function(){
//in some cases, such as the zoovy UI, zglobals may not be defined. If that's the case, certain vars, such as jqurl, must be passed in via P in initialize:
//	myApp.u.dump(" ->>>>>>>>>>>>>>>>>>>>>>>>>>>>> zGlobals is an object");
	myApp.vars.username = zGlobals.appSettings.username.toLowerCase(); //used w/ image URL's.
//need to make sure the secureURL ends in a / always. doesn't seem to always come in that way via zGlobals
	myApp.vars.secureURL = zGlobals.appSettings.https_app_url;
	myApp.vars.domain = zGlobals.appSettings.sdomain; //passed in ajax requests.
	myApp.vars.jqurl = (document.location.protocol === 'file:') ? myApp.vars.testURL+'jsonapi/' : '/jsonapi/';
	
	myApp.require('quickstart', function(){
		myApp.ext.quickstart.callbacks.startMyProgram.onSuccess();
		});
	}); //The config.js is dynamically generated.
	
myApp.extend({
	"namespace" : "quickstart",
	"filename" : "app-quickstart.js"
	});
	
myApp.extend({
	"namespace" : "order_create",
	"filename" : "extensions/checkout/extension.js"
	});
	
myApp.extend({
	"namespace" : "cco",
	"filename" : "extensions/cart_checkout_order.js"
	});
	
myApp.extend({
	"namespace" : "store_routing",
	"filename" : "extensions/store_routing.js"
	});
	//formerly in startup callback of store_routing
myApp.router.addAlias('product', 	function(routeObj){dump(routeObj); myApp.ext.quickstart.a.newShowContent(routeObj.value,	$.extend({'pageType':'product'}, routeObj.params));});
myApp.router.addAlias('homepage', 	function(routeObj){showContent('homepage',	routeObj.params);});

myApp.router.appendHash({'type':'match','route':'product/{{pid}}/{{name}}*','callback':'product'});
myApp.router.appendHash({'type':'match','route':'product/{{pid}}*','callback':'product'});


myApp.router.appendHash({'type':'exact','route':'home','callback':'homepage'});
myApp.router.appendHash({'type':'exact','route':'home/','callback':'homepage'});
myApp.router.appendHash({'type':'exact','route':'','callback':'homepage'});
myApp.router.appendHash({'type':'exact','route':'/','callback':'homepage'});

myApp.u.bindTemplateEvent(function(){return true;}, 'complete.routing', function(event, $context, infoObj){
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
		if(myApp.vars.showContentHashChange){
			dump('forcing a hash change');
			window.location.href = window.location.href.split("#")[0]+hash;
			}
		}
	});
	
myApp.extend({
	"namespace" : "store_tracking",
	"filename" : "extensions/store_tracking.js"
	});
	
myApp.extend({
	"namespace" : "store_seo",
	"filename" : "extensions/store_seo.js"
	});
	
myApp.extend({
	"namespace" : "scrollrestore",
	"filename" : "extensions/_scrollrestore.js"
	});

myApp.extend({
	"namespace" : "store_swc",
	"filename" : "extensions/_store_swc.js"
	});
	
myApp.extend({
	"namespace" : "jerseypreview",
	"filename" : "extensions/jerseypreview/extension.js"
	});
	
myApp.extend({
	"namespace" : "seo_robots",
	"filename" : "extensions/_robots.js"
	});
	
myApp.extend({
	"namespace" : "store_prodlist",
	"filename" : "extensions/store_prodlist.js"
	});
	
myApp.extend({
	"namespace" : "prodlist_infinite",
	"filename" : "extensions/prodlist_infinite.js"
	});
	
myApp.extend({
	"namespace" : "seo_robots",
	"filename" : "extensions/_robots.js"
	});
	
myApp.extend({
	"namespace" : "store_navcats",
	"filename" : "extensions/store_navcats.js"
	});
	
myApp.extend({
	"namespace" : "store_search",
	"filename" : "extensions/store_search.js"
	});
	
myApp.extend({
	"namespace" : "store_product",
	"filename" : "extensions/store_product.js"
	});

myApp.u.bindTemplateEvent('productTemplate', 'complete.test', function(event, $context, infoObj){
	//alert('hi');
	});
myApp.couple('quickstart','addPageHandler',{
	"pageType" : "product",
	"handler" : function($container, infoObj){
		if($.inArray(infoObj.pid,myApp.ext.quickstart.vars.session.recentlyViewedItems) < 0)	{
			myApp.ext.quickstart.vars.session.recentlyViewedItems.unshift(infoObj.pid);
			}
		else	{
			myApp.ext.quickstart.vars.session.recentlyViewedItems.splice(0, 0, myApp.ext.quickstart.vars.session.recentlyViewedItems.splice($.inArray(infoObj.pid, _app.ext.quickstart.vars.session.recentlyViewedItems), 1)[0]);
			}
		//IMPORTANT: requiring every extension needed in order to render the page
		myApp.require(['store_product','store_navcats', 'store_swc', 'store_routing', 'store_search', 'templates.html'], function(){
			dump("In the require");
			dump(typeof myApp.templates.productTemplate);
			myApp.ext.store_product.u.showProd($container, infoObj);
			});
		}
	});
	
myApp.extend({
	"namespace" : "cart_message",
	"filename" : "extensions/cart_message/extension.js"
	});
	
myApp.extend({
	"namespace" : "store_crm",
	"filename" : "extensions/store_crm.js"
	});
	
	
myApp.extend({
	"namespace" : "partner_addthis",
	"filename" : "extensions/partner_addthis.js"
	});
	
myApp.rq.push(['script',0,'lightbox/js/lightbox-2.6.min.js']);

myApp.model.getGrammar("pegjs");


//Any code that needs to be executed after the app init has occured can go here.
//will pass in the page info object. (pageType, templateID, pid/navcat/show and more)
myApp.u.appInitComplete = function()	{
//	myApp.u.dump("Executing myAppIsLoaded code...");
	
	myApp.ext.order_create.checkoutCompletes.push(function(vars,$checkout){
		dump(" -> begin checkoutCOmpletes code: "); dump(vars);
		
		var cartContentsAsLinks = encodeURIComponent(myApp.ext.cco.u.cartContentsAsLinks(myApp.data[vars.datapointer].order));
	
		
//append this to 
		$("[data-app-role='thirdPartyContainer']",$checkout).append("<h2>What next?</h2><div class='ocm ocmFacebookComment pointer zlink marginBottom checkoutSprite  '></div><div class='ocm ocmTwitterComment pointer zlink marginBottom checkoutSprit ' ></div><div class='ocm ocmContinue pointer zlink marginBottom checkoutSprite'></div>");
		$('.ocmTwitterComment',$checkout).click(function(){
			window.open('http://twitter.com/home?status='+cartContentsAsLinks,'twitter');
			window[myApp.vars.analyticsPointer]('send', 'event','Checkout','User Event','Tweeted about order');
			window[myApp.vars.analyticsPointer]('send', 'event','Checkout','User Event','Tweeted about order');
			});
		//the fb code only works if an appID is set, so don't show banner if not present.				
		if(myApp.u.thisNestedExists("zGlobals.thirdParty.facebook.appId") && typeof FB == 'object')	{
			$('.ocmFacebookComment',$checkout).click(function(){
				myApp.ext.quickstart.thirdParty.fb.postToWall(cartContentsAsLinks);
				ga('send','event','Checkout','User Event','FB message about order');
				window[myApp.vars.analyticsPointer]('send', 'event','Checkout','User Event','FB message about order');
				});
			}
		else	{$('.ocmFacebookComment').hide()}
		});
	
	//Cart Messaging Responses.
	myApp.cmr.push(['chat.join',function(message){
		if(message.FROM == 'ADMIN')	{
			var $ui = myApp.ext.quickstart.a.showBuyerCMUI();
			$("[data-app-role='messageInput']",$ui).show();
			$("[data-app-role='messageHistory']",$ui).append("<p class='chat_join'>"+message.FROM+" has joined the chat.<\/p>");
			$('.show4ActiveChat',$ui).show();
			$('.hide4ActiveChat',$ui).hide();
			}
		}]);

	myApp.cmr.push(['goto',function(message,$context){
		var $history = $("[data-app-role='messageHistory']",$context);
		$P = $("<P>")
			.addClass('chat_post')
			.append("<span class='from'>"+message.FROM+"<\/span> has sent over a "+(message.vars.pageType || "")+" link for you within this store. <span class='lookLikeLink'>Click here<\/span> to view.")
			.on('click',function(){
				showContent(myApp.ext.quickstart.u.whatAmIFor(message.vars),message.vars);
				});
		$history.append($P);
		$history.parent().scrollTop($history.height());
		}]);

	}





//this will trigger the content to load on app init. so if you push refresh, you don't get a blank page.
//it'll also handle the old 'meta' uri params.
//this will trigger the content to load on app init. so if you push refresh, you don't get a blank page.
//it'll also handle the old 'meta' uri params.
myApp.router.appendInit({
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
			window[myApp.vars.analyticsPointer]('send','event','Arrival','Syndication','product '+g.uriParams.product);
			}
		else if(document.location.search)	{	
			myApp.u.dump('triggering handleHash');
			myApp.router.handleURIChange(document.location.search.substr(1));
			}
		else	{
			//IE8 didn't like the shortcut to showContent here.
			myApp.router.handleURIChange("");
			}
		if(g.uriParams && g.uriParams.meta)	{
			myApp.ext.cco.calls.cartSet.init({'want/refer':infoObj.uriParams.meta,'cartID':myApp.model.fetchCartID()},{},'passive');
			}
		if(g.uriParams && g.uriParams.meta_src)	{
			myApp.ext.cco.calls.cartSet.init({'want/refer_src':infoObj.uriParams.meta_src,'cartID':myApp.model.fetchCartID()},{},'passive');
			}
		}
	});



