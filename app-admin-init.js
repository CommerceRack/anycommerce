(function(_app){

_app.extend({"namespace":"admin","filename":"extensions/admin/extension.js"}); //initExtension
_app.extend({"namespace":"admin_prodedit","filename":"extensions/admin/product_editor.js"});
_app.extend({"namespace":"admin_orders","filename":"extensions/admin/orders.js"});
_app.extend({"namespace":"admin_sites","filename":"extensions/admin/sites.js"});
//adminApp.rq.push(['extension',0,'admin_launchpad','extensions/admin/launchpad.js']); 

_app.extend({"namespace":"store_prodlist","filename":"extensions/store_prodlist.js"});
_app.extend({"namespace":"store_navcats","filename":"extensions/store_navcats.js"});
_app.extend({"namespace":"store_search","filename":"extensions/store_search.js"});
_app.extend({"namespace":"store_product","filename":"extensions/store_product.js"});

_app.extend({"namespace":"cco","filename":"extensions/cart_checkout_order.js"});
_app.extend({"namespace":"order_create","filename":"extensions/checkout/extension.js"});
_app.extend({"namespace":"cart_message","filename":"extensions/cart_message/extension.js"});

_app.extend({"namespace":"admin_support","filename":"extensions/admin/support.js"});
_app.extend({"namespace":"admin_tools","filename":"extensions/admin/tools.js"});
_app.extend({"namespace":"admin_navcats","filename":"extensions/admin/navcats.js"});
_app.extend({"namespace":"admin_blast","filename":"extensions/admin/blast.js"});
_app.extend({"namespace":"admin_task","filename":"extensions/admin/task.js"});
_app.extend({"namespace":"admin_template","filename":"extensions/admin/template_editor.js"});
_app.extend({"namespace":"admin_marketplace","filename":"extensions/admin/marketplace.js"});

_app.extend({"namespace":"admin_config","filename":"extensions/admin/config.js"});
_app.extend({"namespace":"admin_reports","filename":"extensions/admin/reports.js"});
_app.extend({"namespace":"admin_batchjob","filename":"extensions/admin/batchjob.js"});
_app.extend({"namespace":"admin_customer","filename":"extensions/admin/customer.js"});
_app.extend({"namespace":"admin_wholesale","filename":"extensions/admin/wholesale.js"});
_app.extend({"namespace":"admin_user","filename":"extensions/admin/user.js"});
_app.extend({"namespace":"admin_medialib","filename":"extensions/admin/medialib.js"});
_app.extend({"namespace":"admin_trainer","filename":"extensions/admin/trainer.js"});

_app.extend({"namespace":"tools_animation","filename":"extensions/tools_animation.js"});

_app.model.getGrammar("pegjs");
	

_app.u.showProgress = function(progress)	{
	function showProgress(attempt)	{
//		dump(" -> passZeroResourcesLength: "+progress.passZeroResourcesLength+" and progress.passZeroResourcesLoaded: "+progress.passZeroResourcesLoaded);
		if(progress.passZeroResourcesLength == progress.passZeroResourcesLoaded)	{
			
			//All pass zero resources have loaded.
			//the app will handle hiding the loading screen.
			}
		else if(attempt > 150)	{
			//hhhhmmm.... something must have gone wrong.
			clearTimeout(progress.passZeroTimeout); //end the resource loading timeout.
			}
		else	{
			var percentPerInclude = (100 / progress.passZeroResourcesLength);
			var percentComplete = Math.round(progress.passZeroResourcesLength * percentPerInclude); //used to sum how many includes have successfully loaded.
//			dump(" -> percentPerInclude: "+percentPerInclude+" and percentComplete: "+percentComplete);
			$('#appPreViewProgressBar').val(percentComplete);
			$('#appPreViewProgressText').empty().append(percentComplete+"% Complete");
			attempt++;
			setTimeout(function(){showProgress(attempt);},200);
			}
		}
	showProgress(0)
	} 
_app.cmr.push(['cart.orderCreate',function(message,$context){
	if(message.who != 'ADMIN')	{
		//cart was checked out by someone else.
		//leave the dialog open so communication can continue, but pull the cart from the session. and 'lock' the edit cart button.
		$("button[data-app-role='cartEditButton']").button('disable');
		_app.model.removeCartFromSession($context.data('cartid'));
		dump(" -------> cart.orderCreate cartMessage received. Cart dropped: "+$context.data('cartid'));
		}
	}]);

_app.cmr.push(["view",function(message,$context){
	var $history = $("[data-app-role='messageHistory']",$context);
	var $o = "<p class='chat_post'><span class='from'>"+message.FROM+"<\/span><span class='view_post'>sent page view:<br \/>";
	if(message.vars && message.vars.pageType)	{
//			dump(' -> pageType is set to: '+message.vars.pageType);
		switch(message.vars.pageType)	{
			case 'product':
				if(message.vars.pid)	{
					$o += 'product: '+message.vars.pid+' has been added to the product task list.'
					_app.ext.admin_prodedit.u.addProductAsTask({'pid':message.vars.pid,'tab':'product','mode':'add'});
					}
				else	{$o += 'Page type set to product but no pid specified.'}
				break;
			case 'homepage':
				$o += 'homepage';
				break;
			case 'category':
				if(message.vars.navcat)	{
					$o += 'category: '+message.vars.navcat;
					if(message.vars.domain)	{$o.addClass('lookLikeLink').on('click',function(){
						window.open(message.vars.domain+"/category/"+message.vars.navcat+"/");
						})}
					}
				else	{$o += 'Page type set to category but no navcat specified.'}
				break;

			case 'search':
				if(message.vars.keywords)	{}
				else	{$o += 'Page type set to search but no keywords specified.'}
				break;

			case 'company':
				if(message.vars.show)	{}
				else	{$o += 'Page type set to company but show not specified.'}
				break;

			case 'customer':
				if(message.vars.show)	{}
				else	{$o += 'Page type set to customer but show not specified.'}
				break;

			default:
				$o += 'unknown page type: '+message.vars.pageType+' (console contains more detail)';
				dump("Unrecognized pageType in cart message.vars. vars follow:"); dump(message.vars);
			}
		}
	else	{
		$o += 'unspecified page type or no vars set in message. (console contains more detail)';
		dump("Unspecified pageType in cart message.vars. vars follow:"); dump(message.vars);
		}
	$o += "</span><\/p>";
	$history.append($o);
	$history.parent().scrollTop($history.height());
	}]);


//unused?
// adminApp.router.addAlias('404',function(v)	{
	// $('#globalMessaging').anymessage({'message':'No route has been specified for '+v.hash,'gMessage':true,'errtype':'apperr'});
	// dump(" -> v from 404 alias:"); dump(v);
	// });


_app.router.appendHash({'type':'match','route':'/biz/vstore*','callback':function(v){
//	_app.u.dump(" -> Welcome to legacy compat mode.");
//	console.dir(v);
	_app.model.fetchAdminResource(v.path +''+ v.search,{'tab':_app.ext.admin.vars.tab,'targetID':_app.ext.admin.vars.tab+'Content'});
	}});

_app.router.appendHash({'type':'exact','route':'/dashboard','callback':function(v){
	_app.ext.admin.a.showDashboard(); //will load itself into 'home' content area and bring that into focus.
	}});

_app.router.appendHash({'type':'exact','route':'/product','callback':function(v){
	_app.ext.admin_prodedit.a.showProductManager(v.searchParams);
	}});

_app.router.appendHash({'type':'exact','route':'/mediaLibraryManageMode','callback':function(v){
	_app.ext.admin_medialib.a.showMediaLib({'mode':'manage'});
	}});

_app.router.appendHash({'type':'exact','route':'/showPlatformInfo','callback':function(v){
	_app.ext.admin_support.a.showPlatformInfo({'mode':'manage'});
	}});




_app.router.appendHash({'type':'exact','route':'/logout','callback':function(v){
	_app.ext.admin.a.logout();
	}});

//will handle any clicks directly on the tabs.
_app.router.appendHash({'type':'match','route':'/tab/{{tab}}','callback':function(v){
	_app.ext.admin.a.handleTabClick(v.params.tab,v.searchParams);
	if(v.params.tab == 'product')	{
		//product page tab is 'special'. the navtab section needs to always show up. handleTabClick nukes the navTabs and the function below re-adds them.
		_app.ext.admin_prodedit.u.handleNavTabs(); //builds the filters, search, etc menu at top, under main tabs.
		}
	}});

_app.router.appendHash({'type':'exact','route':'/downloads','callback':function(v){
	$('#homeContent').empty();
	_app.ext.admin.u.bringTabIntoFocus('home');
	_app.ext.admin.u.bringTabContentIntoFocus($('#homeContent'));
	_app.ext.admin.a.showDownloads($('#homeContent'));
	}});

_app.router.appendHash({'type':'exact','route':'/help','callback':function(v){
	$('#supportContent').empty();
	_app.ext.admin.u.bringTabIntoFocus('support');
	_app.ext.admin.u.bringTabContentIntoFocus($('#supportContent'));
	_app.ext.admin_support.a.showHelpInterface($('#supportContent'));
	}});


//handles a lot of the defaults for loading native apps. More or less a 'catch'.
_app.router.appendHash({'type':'match','route':'/ext/{{ext}}/{{a}}*','callback':function(v){
	_app.ext.admin.a.execApp(v.params.ext,v.params.a.split('?')[0],v.searchParams);
	}});


_app.router.appendInit({
	'type':'regexp',
	'route': /^(.*?)\/future$/,
	'callback':function(f){
		$('#globalMessaging').anymessage({"message":"<h5>Welcome to the future!<\/h5><p>You are currently using a future (experimental) version of our interface. Here you'll find links labeled as 'alpha' and 'beta' which are a work in progress.<\/p>Alpha: here for your viewing pleasure. These links may have little or no working parts and you should avoid 'using' them (look don't touch).<br \/>Beta: These are features in the testing phase. These you can use, but may experience some errors.<br \/><h6 class='marginTop'>Enjoy!<\/h6>","persistent":true});
		}
	});

//this will trigger the content to load on app init. so if you push refresh, you don't get a blank page.
_app.router.appendInit({
	'type':'function',
	'route': function(v){
		return {'some':'value'} //returning anything but false triggers a match.
		},
	'callback':function(f){
		//no need to do anything
		}
	});

var startupRequires = [
	"admin", "extensions/admin/templates.html", "extensions/admin/downloads.html",
	"admin_prodedit", "extensions/admin/product_editor.html",
	"admin_orders", "extensions/admin/orders.html",
	"admin_sites", "extensions/admin/sites.html",
	"store_prodlist",
	"store_navcats",
	"store_search",
	"store_product",

	"cco",
	"order_create", "extensions/checkout/"+_app.vars.checkoutAuthMode+".html",
	"cart_message",

	"admin_support", "extensions/admin/support.html",
	"admin_tools", "extensions/admin/tools.html",
	"admin_navcats", "extensions/admin/navcats.html",
	"admin_blast", "extensions/admin/blast.html",
	"admin_task", "extensions/admin/task.html",
	"admin_template", "extensions/admin/template_editor.html",
	"admin_marketplace", "extensions/admin/marketplace.html",

	"admin_config", "extensions/admin/config.html",
	"admin_reports", "extensions/admin/reports.html",
	"admin_batchjob", "extensions/admin/batchjob.html",
	"admin_customer", "extensions/admin/customer.html",
	"admin_wholesale", "extensions/admin/wholesale.html",
	"admin_user", "extensions/admin/user.html",
	"admin_medialib", "extensions/admin/medialib.html",
	"admin_trainer", "extensions/admin/trainer.html",

	"tools_animation"
	]
_app.require(startupRequires,function(){
	_app.ext.admin.callbacks.initExtension.onSuccess();
	
	//animation
	$('.mhTabsContainer [data-animation]').each(function(){
		var args = $(this).attr('data-animation');	
		var anim = args.split('?')[0];
		var params = _app.u.kvp2Array(args.split('?')[1]);
		_app.ext.tools_animation.u.loadAnim($(this),anim,params);
		});
	})

})(adminApp);