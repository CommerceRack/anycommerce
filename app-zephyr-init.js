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
myApp.rq.push(['extension',0,'store_tracking','extensions/store_tracking.js']);
myApp.rq.push(['extension',0,'quickstart','app-quickstart.js','startMyProgram']);
myApp.rq.push(['extension',0,'prodlist_infinite','extensions/prodlist_infinite.js']);
myApp.rq.push(['extension',1,'google_adwords','extensions/partner_google_adwords.js','startExtension']);

//myApp.rq.push(['extension',0,'google_analytics','extensions/partner_google_analytics.js','startExtension']);

//myApp.rq.push(['extension',0,'entomologist','extensions/entomologist/extension.js']);
//myApp.rq.push(['extension',0,'tools_animation','extensions/tools_animation.js']);

//custom extensions
myApp.rq.push(['extension',0,'tools_zoom','extensions/tools_zoom/tools_zoom.js']);
myApp.rq.push(['extension',0,'tools_magnificpopup','extensions/tools_magnificpopup/extension.js']);
myApp.rq.push(['extension',0,'store_zephyrapp','extensions/store_zephyrapp.js','startExtension']);

//disabled scripts
//myApp.rq.push(['extension',1,'tools_ab_testing','extensions/tools_ab_testing.js']);
//myApp.rq.push(['extension',0,'partner_addthis','extensions/partner_addthis.js']);
//myApp.rq.push(['extension',1,'resellerratings_survey','extensions/partner_buysafe_guarantee.js','startExtension']); /// !!! needs testing.
//myApp.rq.push(['extension',1,'buysafe_guarantee','extensions/partner_buysafe_guarantee.js','startExtension']);
//myApp.rq.push(['extension',1,'powerReviews_reviews','extensions/partner_powerreviews_reviews.js','startExtension']);
//myApp.rq.push(['extension',0,'magicToolBox_mzp','extensions/partner_magictoolbox_mzp.js','startExtension']); // (not working yet - ticket in to MTB)





//standard scripts
myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/jquery.showloading-v1.0.jt.js']); //used pretty early in process..
myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/jquery.ui.anyplugins.js']); //in zero pass because it's essential to rendering and error handling.
myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/tlc.js']); //in zero pass cuz you can't render a page without it..
myApp.rq.push(['css',1,myApp.vars.baseURL+'resources/anyplugins.css']);

myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/jsonpath.0.8.0.js']); //used pretty early in process..

//once peg is loaded, need to retrieve the grammar file. Order is important there. This will validate the file too.
myApp.u.loadScript(myApp.vars.baseURL+'resources/peg-0.8.0.js',function(){
	myApp.model.getGrammar(myApp.vars.baseURL+"resources/pegjs-grammar-20140203.pegjs");
	}); // ### TODO -> callback on RQ.push wasn't getting executed. investigate.


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
myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/srcset-polyfill-1.1.1-jt.js']); //a srcset polyfill. used for a lot of imagery.
myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/zoom-master/jquery.zoom.jt.js']); //used for mouseover zoom on product detail page.
//myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/imagesloaded-3.1.4.js']); //used to determine if images within selector are all loaded. used with mzp on product layout.
//myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/magiczoomplus/magiczoomplus.js']); //dynamic imaging used on product layout.

//used for image enlargement in product layout
myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/load-image.min.js']); //in zero pass in case product page is first page.
myApp.rq.push(['script',0,myApp.vars.baseURL+'resources/jquery.image-gallery.jt.js']); //in zero pass in case product page is first page.


//gets executed from app-admin.html as part of controller init process.
//progress is an object that will get updated as the resources load.
/*
'passZeroResourcesLength' : [INT],
'passZeroResourcesLoaded' : [INT],
'passZeroTimeout' : null //the timeout instance running within loadResources that updates this object. it will run indef unless clearTimeout run here OR all resources are loaded.

*/








//triggers the resize of the images for srcset and also revealation. Both of these could have big impacts on the pages attributes (height/width) so it happens early.
$("#productTemplate, #homepageTemplate, #categoryTemplate").on('complete.textblocks',function(state,$ele,infoObj){
	handleSrcSetUpdate($ele); //this triggers the srcset code.
	myApp.ext.store_zephyrapp.u.revealation($ele);
	});

//triggers an update of the minicart when quantities in cart get adjusted.
$('#cartTemplate').on('complete.updateMinicart',function(state,$ele,infoObj)	{
	var cartid = infoObj.cartid || myApp.model.fetchCartID();
	var $appView = $('#appView'), cart = myApp.data['cartDetail|'+cartid], itemCount = 0, subtotal = 0, total = 0;
	if(!$.isEmptyObject(cart['@ITEMS']))	{
		itemCount = cart.sum.items_count || 0;
		subtotal = cart.sum.items_total;
		total = cart.sum.order_total;
		}
	else	{
		//cart not in memory yet. use defaults.
		}
	$('.cartItemCount',$appView).text(itemCount);
	$('.cartSubtotal',$appView).text(myApp.u.formatMoney(subtotal,'$',2,false));
	$('.cartTotal',$appView).text(myApp.u.formatMoney(total,'$',2,false));
	});

//  now add some template functions.
$("#homepageTemplate").on('complete.cycle',function(state,$ele,infoObj){
	function execCycle()	{
		if(myApp.u.carouselIsReady())	{$('#slideshowContainer',$ele).cycle();}
		else {setTimeout(execCycle,500);}
		}
	execCycle();
	});


//  stops the playing of video content when leaving product detail page.
$("#productTemplate, #productTemplateQuickView").on('depart.youtubeReset',function(state,$ele,infoObj){
	var $iframe = $("[data-app-role='videoContainer']:first",$ele).find('iframe:first');
	var video = $iframe.attr('src');
	$iframe.attr('src',''); //this stops the video.
	$iframe.attr('src',$iframe.src); //set the src so if the page is visited again, the video is present. 
	});

//don't need to check if cycle is already running because it's turned off in a 'depart'.
$("#categoryTemplate").on('complete.cycle',function(state,$ele,infoObj){
	function execCycle()	{
		if(myApp.u.carouselIsReady())	{
			var $trio = $("[data-app-role='catTrioSlideshowContainer']",$ele);
			//the 'trio' uses the old legacy banner format (2 elements, one for href and one for img) so .slide is added to the image, if it is set instead of using a, which is always present.
			// at > 600, all three banners will display in a row, so no slideshow necessary.
			if($('.slide',$trio).length > 1 && $(document.body).width() < 600)	{
				$trio.show().data('isCycle',true).cycle(); //isCycle is what the depart event uses to determine if a destroy should be run.
				}
			var $big = $("[data-app-role='catBigSlideshowContainer']",$ele);
			//the big banners use the newer legacy banner syntax (1 banner element) so the 'a' will only be present if the banner is populated.
			if($('a',$big).length > 1)	{
				$big.show().cycle();
				}
			}
		else {setTimeout(execCycle,500);}
		}
	execCycle();
	});

//Don't keep the slideshows continually running when the page is no longer visible. destroy will return them to their original state and the 'complete' action will trigger them on again if necessary.
// this should be more memory friendly.
$("#categoryTemplate").on('depart.cycle',function(state,$ele,infoObj){
	var $trio = $("[data-app-role='catTrioSlideshowContainer']",$ele)
	if($trio.data('isCycle') == true)	{
		$trio.cycle('destroy');
		}
	var $big = $("[data-app-role='catBigSlideshowContainer']",$ele);
	if($('a',$big).length > 1)	{
		$big.cycle('destroy');
		}
	});


//track the 'zero results found' queries for searches.
$('#resultsProductListContainer').on('listcomplete',function(e,rd){
	if(!$('#resultsProductListContainer').children().length)	{
		if(rd.KEYWORDS)	{
			_gaq.push(['_trackEvent','Search','No results - keyword',rd.KEYWORDS]);
			}
		else if(rd.TAG)	{
			_gaq.push(['_trackEvent','Search','No results - tag',rd.TAG]);
			}
		else	{
			_gaq.push(['_trackEvent','Search','No results']);
			}
		
		}
	});


//After the children are added to the select list, check for inventory availability and disable if not purchaseable.
//also, set the option of the pid in focus to selected.
$("select[data-app-role='childrenSiblingsProdlist']",'#productTemplate').on('listcomplete',function(){
	var $prodlist = $(this), focusPID = $prodlist.closest("[data-templateid='productTemplate']").data('pid');
	$('option',$prodlist).each(function(index){
		var $option = $(this), pid = $option.data('pid');

//okay to 'select' this even if inventory not available because the add to cart button will be disabled. provides a clear indicator of which product is currently in focus.
		if(pid == focusPID)	{
			$option.prop('selected','selected');
			}

		if(myApp.u.thisNestedExists("data.appProductGet|"+pid+".@inventory",myApp))	{
			if(myApp.ext.store_product.u.productIsPurchaseable(pid))	{
//				dump(" -> product is in memory and is purchaseable");
				}
			else	{
//				dump(" -> product is in memory but NOT purchaseable");
				$(this).prop('disabled','disabled');
				}
			}
		});
	});

$("#productTemplate, #productTemplateQuickView").on('complete.dynimaging',function(state,$ele,infoObj){
	myApp.ext.store_zephyrapp.u.applyZoom($('.zoomTool:first img',$ele));
	$('.productPrimaryImage',$ele).imagegallery({
		show: 'fade',
		hide: 'fade',
		fullscreen: false,
		slideshow: false
		});
	});




//when a productDetail page loads, the anytabs code 'could' be triggered prior to animation finishing, which means the li 'may' not register as visible.
//this is here to ensure a tab is open.
$("#productTemplate").on('complete.anytabs',function(state,$ele,infoObj){
	setTimeout(function(){
		$('.applyAnytabs',$ele).find('.ui-tabs-nav li:visible:first').trigger('click');
		},1000);
	});

$("#productTemplate").on('complete.relatedItems',function(state,$ele,infoObj){
	var $prodlist = $('.isRelatedItemsList',$ele);
	function execCycle()	{
		if(myApp.u.carouselIsReady())	{$prodlist.cycle();}
		else {setTimeout(execCycle,500);}
		}
	
	if($prodlist.children().length > 1)	{
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





myApp.u.showProgress = function(progress)	{
	function showProgress(attempt)	{
		if(progress.passZeroResourcesLength == progress.passZeroResourcesLoaded)	{
			//All pass zero resources have loaded.
			//the app will handle hiding the loading screen.
			myApp.u.appInitComplete();
			}
		else if(attempt > 150)	{
			//hhhhmmm.... something must have gone wrong.
			clearTimeout(progress.passZeroTimeout); //end the resource loading timeout.
			$('.appMessaging','#appPreView').anymessage({'message':'Init failed to load all the resources within a reasonable number of attempts.','gMessage':true,'persistent':true});
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
//	myApp.u.dump("Executing myAppIsLoaded code...");

	myApp.ext.order_create.checkoutCompletes.push(function(vars,$checkout){
		dump(" -> begin checkoutCOmpletes code: "); dump(vars);

//append this to 
		$("[data-app-role='thirdPartyContainer']",$checkout).append("<h2>What next?</h2><div class='ocm ocmFacebookComment pointer zlink marginBottom checkoutSprite  '></div><div class='ocm ocmTwitterComment pointer zlink marginBottom checkoutSprit ' ></div><div class='ocm ocmContinue pointer zlink marginBottom checkoutSprite'></div>");
		$('.ocmTwitterComment',$checkout).click(function(){
			window.open('http://twitter.com/home?status='+cartContentsAsLinks,'twitter');
			window[myApp.vars.analyticsPointer]('send', 'event','Checkout','User Event','Tweeted about order');
			});
		//the fb code only works if an appID is set, so don't show banner if not present.				
		if(myApp.u.thisNestedExists("zGlobals.thirdParty.facebook.appId") && typeof FB == 'object')	{
			$('.ocmFacebookComment',$checkout).click(function(){
				myApp.ext.quickstart.thirdParty.fb.postToWall(cartContentsAsLinks);
				_gaq.push(['_trackEvent','Checkout','User Event','FB message about order']);
				window[myApp.vars.analyticsPointer]('send', 'event','Checkout','User Event','FB message about order');
				});
			}
		else	{$('.ocmFacebookComment').hide()}
		});
	
	dump(" -> HEY! just a head's up, the default pageTransition was just overwritten from app-zephyr-init.js");
	myApp.ext.quickstart.pageTransition = function($o,$n,infoObj){
		dump(" -> pageTransition is being executed");
		//$o may not always be set, such as at init.
//		if($o instanceof jQuery)	{
//			$o.addClass('post');
//			}
//		else	{
//			dump(" ------> $o is not an instanceOf jquery");
//			}
//		$n.addClass('isPageTemplate').removeClass('post').addClass('active'); /* this needs to be on every 'page' level template for the css transition */
		function transitionThePage()	{
//if $o doesn't exist, the animation doesn't run and the new element doesn't show up, so that needs to be accounted for.
//$o MAY be a jquery instance but have no length, so check both.
			if($o instanceof jQuery && $o.length)	{
				$('#mainContentArea').height($o.outerHeight()); //add a fixed height temporarily so that page doesn't 'collapse'
				$o.animate({left:$(window).width(),top:$(window).height()},function(){
					$('#mainContentArea').height('');
					$o.hide();
					$n.css({'position':'relative','z-index':10}); //
					});
				}
			else	{
				//if o isn't set, n needs to be reset to relative positioning or the display will be wonky.
				$n.css({'position':'relative','z-index':10}); //
				}
			
			}

		$o.css({'position':'relative','z-index':'10'}); //make sure the old page is 'above' the new.
//$n isn't populated yet, most likely. So instead of animating it, just show it. Then animate the old layer above it.
		if($n instanceof jQuery)	{
			$n.addClass('pageTemplateBG').css({position:'absolute','z-index':9,'left':0,'top':0,'right':0}).show();
			}
//only 'jump to top' if we are partially down the page.  Using the header height as > means if a link in the header is clicked, we don't jump down to the content area. feels natural that way.
		if(infoObj.performJumpToTop && $(window).scrollTop() > $('header','#appView').height())	{
			$('html, body').animate({scrollTop : ($('header','#appView').length ? $('header','#appView').first().height() : 0)},500,function(){
				transitionThePage();
				});
			} //new page content loading. scroll to top.			
		else	{
			transitionThePage();
			}

		}

	
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
	
	//the default behavior for an itemAppend is to show the chat portion of the dialog. that's an undesired behavior from the buyer perspective (chat only works if admin is actively listening).
	myApp.cmr.push(['cart.itemAppend',function(message,$context)	{
		$("[data-app-role='messageHistory']",$context).append("<p class='cart_item_append'>"+message.FROM+" has added item "+message.sku+" to the cart.<\/p>");
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
		if(g.uriParams.seoRequest){
			showContent(g.uriParams.pageType, g.uriParams);
			}
		else if (g.uriParams.marketplace){
			showContent("product",{"pid":g.uriParams.product});
			}
		else if(document.location.hash)	{	
			myApp.u.dump('triggering handleHash');
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
