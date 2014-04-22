adminApp.rq.push(['extension',0,'admin','extensions/admin/extension.js','initExtension']);
adminApp.rq.push(['extension',0,'admin_prodedit','extensions/admin/product_editor.js']);
adminApp.rq.push(['extension',0,'admin_orders','extensions/admin/orders.js']);
adminApp.rq.push(['extension',0,'admin_sites','extensions/admin/sites.js']);
//adminApp.rq.push(['extension',0,'admin_launchpad','extensions/admin/launchpad.js']); 

//these can be loaded later because none of them are required for a page to load.
//this will change going forward.
adminApp.rq.push(['extension',1,'store_prodlist','extensions/store_prodlist.js']);
adminApp.rq.push(['extension',1,'store_navcats','extensions/store_navcats.js']);
adminApp.rq.push(['extension',1,'store_search','extensions/store_search.js']);
adminApp.rq.push(['extension',1,'store_product','extensions/store_product.js']);



adminApp.rq.push(['extension',0,'cco','extensions/cart_checkout_order.js']);
adminApp.rq.push(['extension',0,'order_create','extensions/checkout/extension.js']);
adminApp.rq.push(['extension',0,'cart_message','extensions/cart_message/extension.js']);

adminApp.rq.push(['extension',0,'admin_support','extensions/admin/support.js']); 
adminApp.rq.push(['extension',0,'admin_tools','extensions/admin/tools.js']); 
adminApp.rq.push(['extension',0,'admin_navcats','extensions/admin/navcats.js']); 
adminApp.rq.push(['extension',0,'admin_blast','extensions/admin/blast.js']); 
adminApp.rq.push(['extension',0,'admin_task','extensions/admin/task.js']);
adminApp.rq.push(['extension',0,'admin_template','extensions/admin/template_editor.js']); 
adminApp.rq.push(['extension',0,'admin_marketplace','extensions/admin/marketplace.js']); //needs to be in pass 0 for linkFrom (links from marketplaces)
 
adminApp.rq.push(['extension',0,'admin_config','extensions/admin/config.js']);
adminApp.rq.push(['extension',0,'admin_reports','extensions/admin/reports.js']);
adminApp.rq.push(['extension',0,'admin_batchjob','extensions/admin/batchjob.js']);
adminApp.rq.push(['extension',0,'admin_customer','extensions/admin/customer.js']);
adminApp.rq.push(['extension',0,'admin_wholesale','extensions/admin/wholesale.js']);
adminApp.rq.push(['extension',0,'admin_user','extensions/admin/user.js']);
adminApp.rq.push(['extension',0,'admin_medialib','extensions/admin/medialib.js']); //do NOT set to zero. causes a script issue.
adminApp.rq.push(['extension',0,'admin_trainer','extensions/admin/trainer.js']); //load in pass 0 for local testing.

adminApp.rq.push(['extension',0,'tools_animation','extensions/tools_animation.js', function(){
	$('.mhTabsContainer [data-animation]').each(function(){
		var args = $(this).attr('data-animation');	
		var anim = args.split('?')[0];
		var params = adminApp.u.kvp2Array(args.split('?')[1]);
		adminApp.ext.tools_animation.u.loadAnim($(this),anim,params);
		});
	}]);

//required for init. don't change from 0.
adminApp.rq.push(['script',0,adminApp.vars.baseURL+'includes.js']); //','validator':function(){return (typeof handlePogs == 'function') ? true : false;}})
adminApp.rq.push(['script',0,adminApp.vars.baseURL+'resources/jsonpath.0.8.0.js']); //used pretty early in process..
adminApp.rq.push(['script',0,adminApp.vars.baseURL+'resources/tlc.js']); //used pretty early in process..
adminApp.rq.push(['script',0,adminApp.vars.baseURL+'resources/anycontent.js']);

//once peg is loaded, need to retrieve the grammar file. Order is important there. This will validate the file too.
adminApp.u.loadScript(adminApp.vars.baseURL+'resources/peg-0.8.0.js',function(){
	adminApp.model.getGrammar(adminApp.vars.baseURL+"resources/pegjs-grammar-20140203.pegjs");
	}); // ### TODO -> callback on RQ.push wasn't getting executed. investigate.



adminApp.rq.push(['script',1,adminApp.vars.baseURL+'resources/jquery.ui.jeditable.js']); //used for making text editable (customer address). non-essential. loaded late. used in orders.
adminApp.rq.push(['script',0,adminApp.vars.baseURL+'app-admin/resources/highcharts-3.0.1/highcharts.js']); //used for KPI

adminApp.rq.push(['script',0,adminApp.vars.baseURL+'resources/crypto-md5-2.5.3.js']); //used for authentication and in various other places.

//have showLoading as early as possible. pretty handy feature. used everywhere.
adminApp.rq.push(['script',0,adminApp.vars.baseURL+'resources/jquery.showloading-v1.0.jt.js']);

//these are resources that are not currently used.
//adminApp.rq.push(['script',0,adminApp.vars.baseURL+'resources/jquery.mousewheel-3.0.6.min.js']);//used in the launchpad. needed early.
//adminApp.rq.push(['script',1,adminApp.vars.baseURL+'resources/jquery.fullscreen-1.2.js']); //used in template editor. will likely get used more.

//used in campaigns. probably get used more. allows for time selection in datepicker.
adminApp.rq.push(['css',1,adminApp.vars.baseURL+'resources/jquery-ui-timepicker-addon.css']);
adminApp.rq.push(['script',1,adminApp.vars.baseURL+'resources/jquery-ui-timepicker-addon.js']);

// required for building/restoring ebay item specifics from @RECOMMENDATIONS list + 'ebay:itemspecifics'
adminApp.rq.push(['script',1,adminApp.vars.baseURL+'app-admin/resources/jquery.ebay-specifics-form.js']);

//anycommerce plugins, such as anycontent, anytable, anycb, etc.
adminApp.rq.push(['script',0,adminApp.vars.baseURL+'resources/jquery.ui.anyplugins.js']);
adminApp.rq.push(['css',1,adminApp.vars.baseURL+'resources/anyplugins.css']);


adminApp.rq.push(['script',0,adminApp.vars.baseURL+'resources/jquery.ui.qrcode-0.7.0.js']);


// jQuery-contextMenu - http://medialize.github.com/jQuery-contextMenu/  used in orders.
adminApp.rq.push(['css',1,adminApp.vars.baseURL+'app-admin/resources/jquery.contextMenu.css']);
adminApp.rq.push(['script',0,adminApp.vars.baseURL+'app-admin/resources/jquery.contextMenu.js']); //must be in first pass in case orders is the landing page.
adminApp.rq.push(['script',1,adminApp.vars.baseURL+'app-admin/resources/jquery.ui.position.js']);


//used for image enlargement in template chooser (in syndication but suspect it will be in email, newsletter, app, etc soon enough)
adminApp.rq.push(['script',1,adminApp.vars.baseURL+'resources/load-image.min.js']); //in zero pass in case product page is first page.
adminApp.rq.push(['script',1,adminApp.vars.baseURL+'resources/jquery.image-gallery.jt.js']); //in zero pass in case product page is first page.

//adminApp.rq.push(['script',0,adminApp.vars.baseURL+'app-admin/resources/jquery.ui.touch-punch.min.js']);
//adminApp.rq.push(['script',0,adminApp.vars.baseURL+'app-admin/resources/jquery.shapeshift.js']);



//gets executed from app-admin.html as part of controller init process.
//progress is an object that will get updated as the resources load.
/*
'passZeroResourcesLength' : [INT],
'passZeroResourcesLoaded' : [INT],
'passZeroTimeout' : null //the timeout instance running within loadResources that updates this object. it will run indef unless clearTimeout run here OR all resources are loaded.

*/
adminApp.u.showProgress = function(progress)	{
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

//don't execute script till both jquery AND the dom are ready.

adminApp.cmr.push(['cart.orderCreate',function(message,$context){
	if(message.who != 'ADMIN')	{
		//cart was checked out by someone else.
		//leave the dialog open so communication can continue, but pull the cart from the session. and 'lock' the edit cart button.
		$("button[data-app-role='cartEditButton']").button('disable');
		adminApp.model.removeCartFromSession($context.data('cartid'));
		dump(" -------> cart.orderCreate cartMessage received. Cart dropped: "+$context.data('cartid'));
		}
	}]);

adminApp.cmr.push(["view",function(message,$context){
	var $history = $("[data-app-role='messageHistory']",$context);
	var $o = "<p class='chat_post'><span class='from'>"+message.FROM+"<\/span><span class='view_post'>sent page view:<br \/>";
	if(message.vars && message.vars.pageType)	{
//			dump(' -> pageType is set to: '+message.vars.pageType);
		switch(message.vars.pageType)	{
			case 'product':
				if(message.vars.pid)	{
					$o += 'product: '+message.vars.pid+' has been added to the product task list.'
					adminApp.ext.admin_prodedit.u.addProductAsTask({'pid':message.vars.pid,'tab':'product','mode':'add'});
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


adminApp.router.addAlias('404',function(v)	{
	$('#globalMessaging').anymessage({'message':'No route has been specified for '+v.hash,'gMessage':true,'errtype':'apperr'});
	dump(" -> v from 404 alias:"); dump(v);
	});


adminApp.router.appendHash({'type':'match','route':'/biz/vstore*','callback':function(v){
//	_app.u.dump(" -> Welcome to legacy compat mode.");
//	console.dir(v);
	adminApp.model.fetchAdminResource(v.hash.substr(2),{'tab':adminApp.ext.admin.vars.tab,'targetID':adminApp.ext.admin.vars.tab+'Content'});
	}});

adminApp.router.appendHash({'type':'exact','route':'dashboard','callback':function(v){
	adminApp.ext.admin.a.showDashboard(); //will load itself into 'home' content area and bring that into focus.
	}});

adminApp.router.appendHash({'type':'exact','route':'product','callback':function(v){
	adminApp.ext.admin_prodedit.a.showProductManager(v.hashParams);
	}});

adminApp.router.appendHash({'type':'exact','route':'mediaLibraryManageMode','callback':function(v){
	adminApp.ext.admin_medialib.a.showMediaLib({'mode':'manage'});
	}});

adminApp.router.appendHash({'type':'exact','route':'showPlatformInfo','callback':function(v){
	adminApp.ext.admin_support.a.showPlatformInfo({'mode':'manage'});
	}});




adminApp.router.appendHash({'type':'exact','route':'logout','callback':function(v){
	adminApp.ext.admin.a.logout();
	}});

//will handle any clicks directly on the tabs.
adminApp.router.appendHash({'type':'match','route':'tab/{{tab}}','callback':function(v){
	adminApp.ext.admin.a.handleTabClick(v.params.tab,v.hashParams);
	if(v.params.tab == 'product')	{
		//product page tab is 'special'. the navtab section needs to always show up. handleTabClick nukes the navTabs and the function below re-adds them.
		adminApp.ext.admin_prodedit.u.handleNavTabs(); //builds the filters, search, etc menu at top, under main tabs.
		}
	}});

adminApp.router.appendHash({'type':'exact','route':'downloads','callback':function(v){
	$('#homeContent').empty();
	adminApp.ext.admin.u.bringTabIntoFocus('home');
	adminApp.ext.admin.u.bringTabContentIntoFocus($('#homeContent'));
	adminApp.ext.admin.a.showDownloads($('#homeContent'));
	}});

adminApp.router.appendHash({'type':'exact','route':'help','callback':function(v){
	$('#supportContent').empty();
	adminApp.ext.admin.u.bringTabIntoFocus('support');
	adminApp.ext.admin.u.bringTabContentIntoFocus($('#supportContent'));
	adminApp.ext.admin_support.a.showHelpInterface($('#supportContent'));
	}});


//handles a lot of the defaults for loading native apps. More or less a 'catch'.
adminApp.router.appendHash({'type':'match','route':'ext/{{ext}}/{{a}}*','callback':function(v){
	adminApp.ext.admin.a.execApp(v.params.ext,v.params.a.split('?')[0],v.hashParams);
	}});


adminApp.router.appendInit({
	'type':'regexp',
	'route': /^(.*?)\/future$/,
	'callback':function(f){
		$('#globalMessaging').anymessage({"message":"<h5>Welcome to the future!<\/h5><p>You are currently using a future (experimental) version of our interface. Here you'll find links labeled as 'alpha' and 'beta' which are a work in progress.<\/p>Alpha: here for your viewing pleasure. These links may have little or no working parts and you should avoid 'using' them (look don't touch).<br \/>Beta: These are features in the testing phase. These you can use, but may experience some errors.<br \/><h6 class='marginTop'>Enjoy!<\/h6>","persistent":true});
		}
	});

//this will trigger the content to load on app init. so if you push refresh, you don't get a blank page.
adminApp.router.appendInit({
	'type':'function',
	'route': function(v){
		return {'some':'value'} //returning anything but false triggers a match.
		},
	'callback':function(f){
		adminApp.router.handleHashChange();
		}
	});

