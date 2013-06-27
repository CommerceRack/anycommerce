var app = app || {vars:{},u:{}}; //make sure app exists.
app.rq = app.rq || []; //ensure array is defined. rq = resource queue.



app.rq.push(['extension',0,'orderCreate','extensions/checkout_mobile/extension.js']);
app.rq.push(['extension',0,'cco','extensions/cart_checkout_order.js']);


app.rq.push(['extension',0,'store_prodlist','extensions/store_prodlist.js']);
app.rq.push(['extension',0,'store_navcats','extensions/store_navcats.js']);
app.rq.push(['extension',0,'store_search','extensions/store_search.js']);
app.rq.push(['extension',0,'store_product','extensions/store_product.js']);
app.rq.push(['extension',0,'store_cart','extensions/store_cart.js']);
app.rq.push(['extension',0,'store_crm','extensions/store_crm.js']);
app.rq.push(['extension',0,'myRIA','app-quickstart.js','startMyProgram']);
app.rq.push(['extension',0,'store_filter','extensions/_store_filtered_search.js']);
app.rq.push(['extension',0,'prodlist_infinite','extensions/prodlist_infinite.js']);
app.rq.push(['extension',0,'store_toywars','extensions/_store_toywars.js']);
//app.rq.push(['extension',0,'partner_addthis','extensions/partner_addthis.js']);
//app.rq.push(['extension',1,'google_analytics','extensions/partner_google_analytics.js','startExtension']);
//app.rq.push(['extension',1,'resellerratings_survey','extensions/partner_buysafe_guarantee.js','startExtension']); /// !!! needs testing.
//app.rq.push(['extension',1,'buysafe_guarantee','extensions/partner_buysafe_guarantee.js','startExtension']);
//app.rq.push(['extension',1,'powerReviews_reviews','extensions/partner_powerreviews_reviews.js','startExtension']);
app.rq.push(['extension',0,'magicToolBox_mzp','extensions/partner_magictoolbox_mzp.js','startExtension']);

app.rq.push(['script',0,(document.location.protocol == 'file:') ? app.vars.testURL+'jquery/config.js' : app.vars.baseURL+'jquery/config.js']); //The config.js is dynamically generated.
app.rq.push(['script',0,app.vars.baseURL+'model.js']); //'validator':function(){return (typeof zoovyModel == 'function') ? true : false;}}
app.rq.push(['script',0,app.vars.baseURL+'includes.js']); //','validator':function(){return (typeof handlePogs == 'function') ? true : false;}})

app.rq.push(['script',0,app.vars.baseURL+'controller.js']);

app.rq.push(['script',0,app.vars.baseURL+'resources/jquery.showloading-v1.0.jt.js']); //used pretty early in process..
app.rq.push(['script',0,app.vars.baseURL+'resources/jquery.ui.anyplugins.js']); //in zero pass in case product page is first page.
app.rq.push(['script',1,app.vars.baseURL+'site/scripts/carouFredSel-6.2.0/jquery.carouFredSel-6.2.0-packed.js']);
app.rq.push(['script',0,app.vars.baseURL+'jquery.select2Buttons/jQuery.select2Buttons.js']);

app.rq.push(['templateFunction','homepageTemplate','onCompletes',function(P) {	
	//app.rq.push(['script',1,app.vars.baseURL+'site/script/app_actions.js']);
	
	var $context = $(app.u.jqSelector('#',P.parentID));
	
	//RANDOM SHIPPING LOGO GENERATOR
	$(".shipLogo1").hide();
	$(".shipLogo2").hide();
	$(".shipLogo3").hide();
	$(".shipLogo4").hide();
	
	var  randomLogo = Math.floor((Math.random()*4)+1);
	if(randomLogo === 1){
		$(".shipLogo1").show();
	}else if(randomLogo === 2){
		$(".shipLogo2").show();
		}else if(randomLogo === 3){
			$(".shipLogo3").show();
			}else if(randomLogo === 4){
				$(".shipLogo4").show();
			}
			
	//TOP SLIDESHOW BANNER
	var carouselHPBanner;
	function foo1(){ $("#wideSlideshow").carouFredSel
	({
		width   : 620,
		height	: 340,
		items   : 1,
		scroll: 1,
		auto : {
			duration    : 500,
			timeoutDuration: 5000,
			pauseOnHover: true
		},
		pagination  : "#slideshowNav"
	});
	}
	carouselHPBanner = foo1;
	setTimeout(carouselHPBanner, 2000);
	
	
	
		function foo2(){
			var incrementPage = 1;
			$("#slideshowNav").children().each(function() {
				$(this).addClass("hpSSTopPage" + incrementPage);
				incrementPage = incrementPage + 1;
				$(this).children().remove();
			})
		}
		carouselPaginationClasses = foo2;
		setTimeout(carouselPaginationClasses, 2100);
		
	//**HOMEPAGE BOTTOM CATEGORY CAROUSEL**
	var carouselBottomCats;
	function foo2(){ $(".catCarousel").carouFredSel({
			auto : false,
			items   : 1,
			scroll: 1
	});}
	carouselBottomCats = foo2;
	setTimeout(carouselBottomCats, 2000);
	
	var carouselBottomCatTitles;
	function foo3(){ $(".catNavContent").carouFredSel({
			auto : false,
			items   : 3,
			height: 63,
			scroll: 1
	});}
	carouselBottomCatTitles = foo3;
	setTimeout(carouselBottomCatTitles, 2000);
	
	//SCROLLING FUNCTION FOR BOTTOM CAROUSEL
	$(".btnCatNext").click(function() {
    	$(".catNavContent").trigger("next", 1);
		$(".catCarousel").trigger("next", 1);
    });
	$(".btnCatBack").click(function() {
    	$(".catNavContent").trigger("prev", 1);
		$(".catCarousel").trigger("prev", 1);
    });
	
	$(".btnCatBack").mouseover(function()
	{
		$(this).css("opacity",".65");
	});	
	$(".btnCatNext").mouseover(function()
	{
		$(this).css("opacity",".65");
	});	
	$(".btnCatBack").mouseout(function()
	{
		$(this).css("opacity","1");
	});	
	$(".btnCatNext").mouseout(function()
	{
		$(this).css("opacity","1");
	});		
	
}]);

app.rq.push(['templateFunction','categoryTemplate','onCompletes',function(P) {
	app.rq.push(['script',1,app.vars.baseURL+'site/script/app_actions.js']);
	
	
	var $context = $(app.u.jqSelector('#',P.parentID));
	
	app.ext.store_filter.vars.catPageID = $(app.u.jqSelector('#',P.parentID));  
	
	app.u.dump("BEGIN categoryTemplate onCompletes for filtering");
	if(app.ext.store_filter.filterMap[P.navcat])	{
		app.u.dump(" -> safe id DOES have a filter.");

		var $page = $(app.u.jqSelector('#',P.parentID));
		app.u.dump(" -> $page.length: "+$page.length);
		if($page.data('filterAdded'))	{} //filter is already added, don't add again.
		else	{
			$page.data('filterAdded',true)
			var $form = $("[name='"+app.ext.store_filter.filterMap[P.navcat].filter+"']",'#appFilters').clone().appendTo($('.filterContainer',$page));
			$form.on('submit.filterSearch',function(event){
				event.preventDefault()
				app.u.dump(" -> Filter form submitted.");
				app.ext.store_filter.a.execFilter($form,$page);
				});
	
			if(typeof app.ext.store_filter.filterMap[P.navcat].exec == 'function')	{
				app.ext.store_filter.filterMap[P.navcat].exec($form,P)
				}
	
	//make all the checkboxes auto-submit the form.
			$(":checkbox",$form).off('click.formSubmit').on('click.formSubmit',function() {
				$form.submit();      
				});
				
				$form.submit();
			}
		}
		
		
		$('.resetButton', $context).click(function(){
		$context.empty().remove();
		showContent('category',{'navcat':P.navcat});
		});
		
		
}]);
	
	//**COMMENT TO REMOVE AUTO-RESETTING WHEN LEAVING CAT PAGE FOR FILTERED SEARCH**
	
	app.rq.push(['templateFunction','categoryTemplate','onDeparts',function(P) {
		if(app.ext.store_filter.vars.catPageID.empty && typeof app.ext.store_filter.vars.catPageID.empty === 'function'){
    		app.ext.store_filter.vars.catPageID.empty().remove();
		}	
}]);

app.rq.push(['templateFunction','companyTemplate','onCompletes',function(P) {
	app.rq.push(['script',1,app.vars.baseURL+'site/script/app_actions.js']);
}]);

app.rq.push(['templateFunction','customerTemplate','onCompletes',function(P) {
	app.rq.push(['script',1,app.vars.baseURL+'site/script/app_actions.js']);
}]);

app.rq.push(['templateFunction','searchTemplate','onCompletes',function(P) {
	if(P.preservePage){ alert("You hit the back button");}
	
	app.rq.push(['script',1,app.vars.baseURL+'site/script/app_actions.js']);
	
	var $context = $(app.u.jqSelector('#',P.parentID));
	var $page = $(app.u.jqSelector('#',P.parentID));
	
	//****FILTERED SEARCH CODE****
	$('.fsCheckbox').attr('checked', false);
	$("#resultsProductListContainer").show(); 
	$(".searchFilterResults").hide();    
	app.u.dump("BEGIN searchTemplate onCompletes for filtering");
	var $form = $("[name='searchPageForm']",'#appFilters').clone().appendTo($('.filterContainerSearch',$page));
	$form.on('submit.filterSearch',function(event){
		event.preventDefault()
		app.u.dump(" -> Filter form submitted.");
		app.ext.store_filter.a.execFilter($form,$page);
				});
	
		if(typeof app.ext.store_filter.filterMap["searchPage"].exec == 'function')	{
			app.ext.store_filter.filterMap["searchPage"].exec($form,P)
			}
	
	//make all the checkboxes auto-submit the form.
		$(":checkbox",$form).off('click.formSubmit').on('click.formSubmit',function() {
			$form.submit(); 
			//app.u.dump("Filter search actvated");
			$("#resultsProductListContainer").hide();  
			
			$group1 = $('.fsCheckbox');
			if($group1.filter(':checked').length === 0){
				//app.u.dump("All checkboxes removed. Filter search deactivated.");
				$("#resultsProductListContainer").show(); 
				$(".searchFilterResults").hide();    
			}
			else{
				//app.u.dump("All checkboxes removed. Filter search still active.");
				$("#resultsProductListContainer").hide(); 
				$(".searchFilterResults").show();    
			}  
		});
				
			
		
		$('.resetButtonSearchPage', $context).click(function(){
			$('.fsCheckbox').attr('checked', false);
			$("#resultsProductListContainer").show(); 
			$(".searchFilterResults").hide();    
		});
}]);




app.rq.push(['script',1,app.vars.baseURL+'cycle-2.9999.81.js']);//','validator':function(){return (jQuery().cycle) ? true : false;}});

app.rq.push(['templateFunction','homepageTemplate','onCompletes',function(P) {
		}]);
//add tabs to product data.
//tabs are handled this way because jquery UI tabs REALLY wants an id and this ensures unique id's between product
app.rq.push(['templateFunction','productTemplate','onCompletes',function(P) {
	var $context = $(app.u.jqSelector('#',P.parentID));
	var $tabContainer = $( ".tabbedProductContent",$context);
		if($tabContainer.length)	{
			if($tabContainer.data("widget") == 'anytabs'){} //tabs have already been instantiated. no need to be redundant.
			else	{
				$tabContainer.anytabs();
				}
			}
		else	{} //couldn't find the tab to tabificate.
		
		//CONVERT CODE FOR LIMITED EDITION CONVERT SELECT TO BUTTONS
	$('select[name=#Z]').select2Buttons();
	
	
	//BEGIN CAROUSEL CODE FOR RECENTLY VIEWED/RELATED ITEMS
	var carouselPPTitle;
	function foo1(){ $(".prodPageCarouselTitles").carouFredSel
	({
		width   : 1020,
		height	: 60,
		align: "left",
		items   : 3,
		scroll: 1,
		auto : false,
		items: {minimum: 1}
		
	});
	}
	carouselPPTitle = foo1;
	setTimeout(carouselPPTitle, 2000);
	
	
	var carouselPPContent;
	function foo2(){ $(".prodPageCarouselContent").carouFredSel
	({
		width   : 1020,
		height	: 500,
		items   : 1,
		scroll: 1,
		auto : false
	});
	}
	
	//SCROLLING FUNCTION FOR BOTTOM CAROUSEL
	$("#nextPPCaro").click(function() {
    	$(".prodPageCarouselTitles").trigger("next", 1);
		$(".prodPageCarouselContent").trigger("next", 1);
    });
	$("#prevPPCaro").click(function() {
    	$(".prodPageCarouselTitles").trigger("prev", 1);
		$(".prodPageCarouselContent").trigger("prev", 1);
    });
	
	$("#nextPPCaro").mouseover(function()
	{
		$(this).css("opacity",".65");
	});	
	$("#prevPPCaro").mouseover(function()
	{
		$(this).css("opacity",".65");
	});	
	$("#nextPPCaro").mouseout(function()
	{
		$(this).css("opacity","1");
	});	
	$("#prevPPCaro").mouseout(function()
	{
		$(this).css("opacity","1");
	});		
	
	carouselPPContent = foo2;
	setTimeout(carouselPPContent, 2000);
	}]);
	
app.rq.push(['templateFunction','productTemplate','onDeparts',function(P) {	
	$(".select2Buttons").remove();
}]);
//sample of an onDeparts. executed any time a user leaves this page/template type.
app.rq.push(['templateFunction','homepageTemplate','onDeparts',function(P) {app.u.dump("just left the homepage")}]);


//group any third party files together (regardless of pass) to make troubleshooting easier.
app.rq.push(['script',0,(document.location.protocol == 'https:' ? 'https:' : 'http:')+'//ajax.googleapis.com/ajax/libs/jqueryui/1.10.1/jquery-ui.min.js']);


/*
This function is overwritten once the controller is instantiated. 
Having a placeholder allows us to always reference the same messaging function, but not impede load time with a bulky error function.
*/
app.u.throwMessage = function(m)	{
	alert(m); 
	}

app.u.howManyPassZeroResourcesAreLoaded = function(debug)	{
	var L = app.vars.rq.length;
	var r = 0; //what is returned. total # of scripts that have finished loading.
	for(var i = 0; i < L; i++)	{
		if(app.vars.rq[i][app.vars.rq[i].length - 1] === true)	{
			r++;
			}
		if(debug)	{app.u.dump(" -> "+i+": "+app.vars.rq[i][2]+": "+app.vars.rq[i][app.vars.rq[i].length -1]);}
		}
	return r;
	}


//gets executed once controller.js is loaded.
//check dependencies and make sure all other .js files are done, then init controller.
//function will get re-executed if not all the scripts in app.vars.scripts pass 1 are done loading.
//the 'attempts' var is incremented each time the function is executed.

app.u.initMVC = function(attempts){
//	app.u.dump("app.u.initMVC activated ["+attempts+"]");
	var includesAreDone = true,
	percentPerInclude = (100 / app.vars.rq.length),   //what percentage of completion a single include represents (if 10 includes, each is 10%).
	resourcesLoaded = app.u.howManyPassZeroResourcesAreLoaded(),
	percentComplete = Math.round(resourcesLoaded * percentPerInclude); //used to sum how many includes have successfully loaded.

//make sure precentage is never over 100
	if(percentComplete > 100 )	{
		percentComplete = 100;
		}

	$('#appPreViewProgressBar','#appPreView').val(percentComplete);
	$('#appPreViewProgressText','#appPreView').empty().append(percentComplete+"% Complete");

	if(resourcesLoaded == app.vars.rq.length)	{
		var clickToLoad = false;
		if(clickToLoad){
			$('#loader').fadeOut(1000);
			$('#clickToLoad').delay(1000).fadeIn(1000).click(function() {
				app.u.loadApp();
			});
		} else {
			app.u.loadApp();
			}
		}
	else if(attempts > 50)	{
		app.u.dump("WARNING! something went wrong in init.js");
		//this is 10 seconds of trying. something isn't going well.
		$('#appPreView').empty().append("<h2>Uh Oh. Something seems to have gone wrong. </h2><p>Several attempts were made to load the store but some necessary files were not found or could not load. We apologize for the inconvenience. Please try 'refresh' and see if that helps.<br><b>If the error persists, please contact the site administrator</b><br> - dev: see console.</p>");
		app.u.howManyPassZeroResourcesAreLoaded(true);
		}
	else	{
		setTimeout("app.u.initMVC("+(attempts+1)+")",250);
		}

	}

app.u.loadApp = function() {
//instantiate controller. handles all logic and communication between model and view.
//passing in app will extend app so all previously declared functions will exist in addition to all the built in functions.
//tmp is a throw away variable. app is what should be used as is referenced within the mvc.
	app.vars.rq = null; //to get here, all these resources have been loaded. nuke record to keep DOM clean and avoid any duplication.
	var tmp = new zController(app);
//instantiate wiki parser.
	myCreole = new Parse.Simple.Creole();
	}


//Any code that needs to be executed after the app init has occured can go here.
//will pass in the page info object. (pageType, templateID, pid/navcat/show and more)
app.u.appInitComplete = function(P)	{
	app.u.dump("Executing myAppIsLoaded code...");
	}

app.rq.push(['templateFunction','productTemplate','onDeparts',function(P) {
var $container = $('#recentlyViewedItemsContainer');
$container.show();
$("ul",$container).empty(); //empty product list
$container.anycontent({data:app.ext.myRIA.vars.session}); //build product list
}]);


//don't execute script till both jquery AND the dom are ready.
$(document).ready(function(){
	app.u.handleRQ(0)
	});






