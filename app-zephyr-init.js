myApp.rq.push(['script',0,(document.location.protocol == 'file:') ? myApp.vars.testURL+'jsonapi/config.js' : myApp.vars.baseURL+'jsonapi/config.js',function(){
//in some cases, such as the zoovy UI, zglobals may not be defined. If that's the case, certain vars, such as jqurl, must be passed in via P in initialize:
//	myApp.u.dump(" ->>>>>>>>>>>>>>>>>>>>>>>>>>>>> zGlobals is an object");
	myApp.vars.username = zGlobals.appSettings.username.toLowerCase(); //used w/ image URL's.
//need to make sure the secureURL ends in a / always. doesn't seem to always come in that way via zGlobals
	myApp.vars.secureURL = zGlobals.appSettings.https_app_url;
	myApp.vars.domain = zGlobals.appSettings.sdomain; //passed in ajax requests.
	myApp.vars.jqurl = (document.location.protocol === 'file:') ? myApp.vars.testURL+'jsonapi/' : '/jsonapi/';
	}]); //The config.js is dynamically generated.


//standard extensions	
myApp.rq.push(['extension',0,'order_create','extensions/checkout/extension.js']);
myApp.rq.push(['extension',0,'cco','extensions/cart_checkout_order.js']);
myApp.rq.push(['extension',0,'store_routing','extensions/store_routing.js']);
myApp.rq.push(['extension',0,'store_prodlist','extensions/store_prodlist.js']);
myApp.rq.push(['extension',0,'store_navcats','extensions/store_navcats.js']);
myApp.rq.push(['extension',0,'store_search','extensions/store_search.js']);
myApp.rq.push(['extension',0,'store_product','extensions/store_product.js']);
myApp.rq.push(['extension',0,'cart_message','extensions/cart_message/extension.js']);
myApp.rq.push(['extension',0,'store_crm','extensions/store_crm.js']);
myApp.rq.push(['extension',0,'prodlist_infinite','extensions/prodlist_infinite.js']);

//custom extensions
myApp.rq.push(['extension',0,'tools_zoom','extensions/tools_zoom/tools_zoom.js']);
myApp.rq.push(['extension',0,'tools_magnificpopup','extensions/tools_magnificpopup/extension.js']);
myApp.rq.push(['extension',0,'store_zephyrapp','extensions/store_zephyrapp.js']);

//extensions w/ callbacks.
myApp.rq.push(['extension',0,'quickstart','app-quickstart.js','startMyProgram']);



//standard scripts
myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/jquery.showloading-v1.0.jt.js']); //used pretty early in process..
myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/jquery.ui.anyplugins.js']); //in zero pass in case product page is first page.
myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/tlc.js']); //in zero pass in case product page is first page.
myApp.rq.push(['css',1,myApp.vars.baseURL+'resources/anyplugins.css']);
myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/jsonpath.0.8.0.js']); //used pretty early in process..
//once peg is loaded, need to retrieve the grammar file. Order is important there. This will validate the file too.
myApp.u.loadScript(myApp.vars.baseURL+'resources/peg-0.8.0.js',function(){
	myApp.model.getGrammar(myApp.vars.baseURL+"resources/pegjs-grammar-20140203.pegjs");
	});


//custom scripts
myApp.rq.push(['script',0,'extensions/tools_zoom/zoom/js/jquery.zoom.min.js']);
//myApp.rq.push(['script',0,myApp.vars.baseURL+'extensions/jquery-cycle.js']);

//used for the slideshow on the homepage and product page. $.cycle();
myApp.u.loadScript(myApp.vars.baseURL+'resources/jquery.cycle2.min.js',function(){
	//if these files are not done loading, cycle won't work quite right. so a check is done before executing a slideshow to make sure (with a settimeout to re-execute check).
	myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/jquery.cycle2.swipe.min.js',function(){
		$(document.body).data('swipeLoaded',true); //can't execute a cycle carousel till this is loaded.
		}]);
	myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/jquery.cycle2.carousel.min.js',function(){
		$(document.body).data('carouselLoaded',true); //can't execute a cycle carousel till this is loaded.
		}]); //need to make sure this loads after cycle2 or it barfs.
	});

//a polyfill for sourceset. allows srcset to be set on an image tag to load images based on the size of the screen.
//there's an 'activator' for this in the 'complete' for product, home and category pages.
myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/srcset-polyfill-1.1.1-jt.js']); //used pretty early in process..





// ARE THESE USED?
//app.rq.push(['extension',1,'tools_ABtesting','extensions/tools_ABtesting.js']);




//  now add some template functions.
$("#homepageTemplate").on('complete.cycle',function(state,$ele,infoObj){
	function execCycle()	{
		if(myApp.u.carouselIsReady())	{$('#slideshowContainer',$ele).cycle();}
		else {setTimeout(execCycle,500);}
		}
	execCycle();
	});



$("#categoryTemplate").on('complete.cycle',function(state,$ele,infoObj){
	function execCycle()	{
		if(myApp.u.carouselIsReady())	{
			var $trio = $("[data-app-role='catTrioSlideshowContainer']",$ele)
			if($('.slides',$trio).length)	{
				$trio.cycle();
				}
			var $big = $("[data-app-role='catBigSlideshowContainer']",$ele);
			if($('.slides',$big).length)	{
				$big.cycle();
				}

			}
		else {setTimeout(execCycle,500);}
		}
	execCycle();
	});



$("#productTemplate").on('complete.srcset',function(state,$ele,infoObj){
	handleSrcSetUpdate($ele);
	});

$("#productTemplate, #homepageTemplate, #categoryTemplate").on('complete.textblocks',function(state,$ele,infoObj){
	myApp.ext.store_zephyrapp.u.revealation($ele);
	});

$("#productTemplate").on('complete.relatedItems',function(state,$ele,infoObj){
	var $prodlist = $('.isRelatedItemsList',$ele);
	dump(" -> in onComplete for related items: "+$prodlist.children().length);
	
	function execCycle()	{
		if(myApp.u.carouselIsReady())	{$prodlist.cycle();}
		else {setTimeout(execCycle,500); dump(" -> cycle not ready yet");}
		}
	
	if($prodlist.children().length)	{
		//this product has related items.
		execCycle();
		}
	else	{
		$prodlist.closest('section').hide(); //hide the section (so header doesn't show up) if no product are present.
/*		if(myApp.ext.quickstart.vars.hotw[1] && myApp.ext.quickstart.vars.hotw[1].navcat)	{
			//the last viewed page was a category. show some items from it.
			}
		else if(myApp.ext.quickstart.vars.hotw[1] && myApp.ext.quickstart.vars.hotw[1].keywords)	{
			//last page was a search, show some of those items.
			}
		else	{
			//nothing usable in recent history. key off of the product attributes
			var prod = myApp.data['appProductGet|'+infoObj.pid]['%attribs'];

			}
*/		}
	});






//Cart Messaging Responses.

myApp.cmr.push(['chat.join',function(message){
//	dump(" -> message: "); dump(message);
	var $ui = myApp.ext.quickstart.a.showBuyerCMUI();
	$("[data-app-role='messageInput']",$ui).show();
	$("[data-app-role='messageHistory']",$ui).append("<p class='chat_join'>"+message.FROM+" has joined the chat.<\/p>");
	$('.show4ActiveChat',$ui).show();
	$('.hide4ActiveChat',$ui).hide();
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



myApp.u.showProgress = function(progress)	{
	function showProgress(attempt)	{
		if(progress.passZeroResourcesLength == progress.passZeroResourcesLoaded)	{
			//All pass zero resources have loaded.
			//the app will handle hiding the loading screen.
			myApp.router.init();//instantiates the router.
			myApp.u.appInitComplete();
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
			setTimeout(function(){showProgress(attempt);},250);
			}
		}
	showProgress(0)
	}

//function to ascertain if the secondary files associated w/ cycle are done loading.
myApp.u.carouselIsReady = function()	{
	var r = false;
	if($(document.body).data('swipeLoaded') && $(document.body).data('carouselLoaded'))	{r = true;}
	return r;
	}

//Any code that needs to be executed after the app init has occured can go here.
//will pass in the page info object. (pageType, templateID, pid/navcat/show and more)
myApp.u.appInitComplete = function()	{
	myApp.u.dump("Executing myAppIsLoaded code...");
	
	myApp.ext.order_create.checkoutCompletes.push(function(vars,$checkout){
//append this to 
		$("[data-app-role='thirdPartyContainer']",$checkout).append("<h2>What next?</h2><div class='ocm ocmFacebookComment pointer zlink marginBottom checkoutSprite  '></div><div class='ocm ocmTwitterComment pointer zlink marginBottom checkoutSprit ' ></div><div class='ocm ocmContinue pointer zlink marginBottom checkoutSprite'></div>");
		$('.ocmTwitterComment',$checkout).click(function(){
			window.open('http://twitter.com/home?status='+cartContentsAsLinks,'twitter');
			_gaq.push(['_trackEvent','Checkout','User Event','Tweeted about order']);
			});
		//the fb code only works if an appID is set, so don't show banner if not present.				
		if(myApp.u.thisNestedExists("zGlobals.thirdParty.facebook.appId") && typeof FB == 'object')	{
			$('.ocmFacebookComment',$checkout).click(function(){
				myApp.ext.quickstart.thirdParty.fb.postToWall(cartContentsAsLinks);
				_gaq.push(['_trackEvent','Checkout','User Event','FB message about order']);
				});
			}
		else	{$('.ocmFacebookComment').hide()}
		});
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
		if(document.location.hash)	{
			myApp.router.handleHashChange();
			}
		else	{
			//IE8 didn't like the shortcut to showContent here.
			myApp.ext.quickstart.a.showContent('homepage');
			}
		if(g.uriParams && g.uriParams.meta)	{
			myApp.ext.cco.calls.cartSet.init({'want/refer':infoObj.uriParams.meta,'cartID':myApp.model.fetchCartID()},{},'passive');
			}
		if(g.uriParams && g.uriParams.meta_src)	{
			myApp.ext.cco.calls.cartSet.init({'want/refer_src':infoObj.uriParams.meta_src,'cartID':myApp.model.fetchCartID()},{},'passive');
			}
		}
	});





// Adding shuffle into jquery options
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