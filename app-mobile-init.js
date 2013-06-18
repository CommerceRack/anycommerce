var app = app || {vars:{},u:{}}; //make sure app exists.
app.rq = app.rq || []; //ensure array is defined. rq = resource queue.

// ### NOTE - mobile does NOT work. it's in development.
app.rq.push(['extension',0,'orderCreate','extensions/checkout/extension.js']);
app.rq.push(['extension',0,'cco','extensions/cart_checkout_order.js']);




app.rq.push(['extension',0,'store_prodlist','extensions/store_prodlist.js']);
app.rq.push(['extension',0,'store_navcats','extensions/store_navcats.js']);
app.rq.push(['extension',0,'store_search','extensions/store_search.js']);
app.rq.push(['extension',0,'store_product','extensions/store_product.js']);
app.rq.push(['extension',0,'store_cart','extensions/store_cart.js']);
app.rq.push(['extension',0,'store_crm','extensions/store_crm.js']);
app.rq.push(['extension',0,'myRIA','app-quickstart.js','startMyProgram']);

//app.rq.push(['extension',1,'google_analytics','extensions/partner_google_analytics.js','startExtension']);
//app.rq.push(['extension',0,'partner_addthis','extensions/partner_addthis.js','startExtension']);
//app.rq.push(['extension',1,'resellerratings_survey','extensions/partner_buysafe_guarantee.js','startExtension']); /// !!! needs testing.
//app.rq.push(['extension',1,'buysafe_guarantee','extensions/partner_buysafe_guarantee.js','startExtension']);
//app.rq.push(['extension',1,'powerReviews_reviews','extensions/partner_powerreviews_reviews.js','startExtension']);
//app.rq.push(['extension',0,'magicToolBox_mzp','extensions/partner_magictoolbox_mzp.js','startExtension']); // (not working yet - ticket in to MTB)




app.rq.push(['script',0,(document.location.protocol == 'file:') ? app.vars.testURL+'jquery/config.js' : app.vars.baseURL+'jquery/config.js']); //The config.js is dynamically generated.
app.rq.push(['script',0,app.vars.baseURL+'model.js']); //'validator':function(){return (typeof zoovyModel == 'function') ? true : false;}}
app.rq.push(['script',0,app.vars.baseURL+'includes.js']); //','validator':function(){return (typeof handlePogs == 'function') ? true : false;}})
app.rq.push(['script',0,app.vars.baseURL+'controller.js']);

app.rq.push(['script',1,app.vars.baseURL+'resources/jquery.ui.jeditable.js']); //used for making text editable (customer address). non-essential. loaded late.
app.rq.push(['script',0,app.vars.baseURL+'resources/jquery.showloading-v1.0.jt.js']); //used for making text editable (customer address). non-essential. loaded late.
app.rq.push(['script',0,app.vars.baseURL+'resources/jquery.ui.anyplugins.js']); //in zero pass because it contains essential functions (anymessage & anycontent)


//used for image enlargement in product layout
app.rq.push(['script',0,app.vars.baseURL+'resources/load-image.min.js']); //in zero pass in case product page is first page.
app.rq.push(['script',0,app.vars.baseURL+'resources/jquery.image-gallery.jt.js']); //in zero pass in case product page is first page.

app.rq.push(['script',1,app.vars.baseURL+'resources/jquery.touchSwipe-1.3.3.min.js']); //used w/ carouFedSel.
app.rq.push(['script',1,app.vars.baseURL+'resources/jquery.carouFredSel-6.2.0.min.js']); //used on homepage.


//group any third party files together (regardless of pass) to make troubleshooting easier.
app.rq.push(['script',0,(document.location.protocol == 'https:' ? 'https:' : 'http:')+'//ajax.googleapis.com/ajax/libs/jqueryui/1.10.1/jquery-ui.min.js']);





//add tabs to product data.
//tabs are handled this way because jquery UI tabs REALLY wants an id and this ensures unique id's between product
app.rq.push(['templateFunction','homepageTemplate','onCompletes',function(P) {

	var $target = $('#homeProdSearchNewArrivals');
	if($target.data('isCarousel'))	{} //only make it a carousel once.
	else	{
//for whatever reason, caroufredsel needs to be executed after a moment.
		setTimeout(function(){
			$target.data('isCarousel',true).carouFredSel({
				auto: false,
				prev: '.foo2carouselPrev',
				next: '.foo2carouselNext',
				width: '100%',
				scroll: 2,
		//		mousewheel: true, //this is mobile, so mousewheel isn't necessary (plugin is not loaded)
				swipe: {
					onMouse: true,
					onTouch: true
					}
				});
			},1000); 
		}

	}]);


app.rq.push(['templateFunction','productTemplate','onCompletes',function(P) {
	var $pDetail = app.u.jqSelector('#',P.parentID);
	$('.productAccordion',$pDetail).accordion({
		collapsible: true,
		heightStyle: "content"
		});
//hide non-populated sections. 
if(!$("[data-app-role='prod_detail_container']",$pDetail).text())	{$("[data-app-role='prod_detail_header']",$pDetail).hide()}
if(!$("[data-app-role='prod_features_container']",$pDetail).text())	{$("[data-app-role='prod_features_header']",$pDetail).hide()}
if(!$("[data-app-role='prod_accessories_container'] ul",$pDetail).children().length)	{$("[data-app-role='prod_accessories_header']",$pDetail).hide()}


	}]);




app.rq.push(['templateFunction','productTemplate','onCompletes',function(P) {
	
	$('.gallery a[data-gallery]',app.u.jqSelector('#',P.parentID)).each(function(){
		if($('img',$(this)).length < 1)	{
			$(this).empty().remove(); //nuke any hrefs with no images. otherwise next/previous in gallery will show an empty spot
			}
		else	{
			$(this).attr('title',app.data[P.datapointer]['%attribs']['zoovy:prod_name']); //title is used in gallery modal.
			}
		});
//init gallery.
	$('.gallery',app.u.jqSelector('#',P.parentID)).imagegallery({
		show: 'fade',
		hide: 'fade',
		fullscreen: false,
		slideshow: false
		});
	}]);

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
	var includesAreDone = true;

//what percentage of completion a single include represents (if 10 includes, each is 10%).
	var percentPerInclude = (100 / app.vars.rq.length);  
	var resourcesLoaded = app.u.howManyPassZeroResourcesAreLoaded();
	var percentComplete = Math.round(resourcesLoaded * percentPerInclude); //used to sum how many includes have successfully loaded.
	//make sure precentage is never over 100
	if(percentComplete > 100 )	{
		percentComplete = 100;
		}
	
	$('#appPreViewProgressBar').val(percentComplete);
	$('#appPreViewProgressText').empty().append(percentComplete+"% Complete");

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
// *** 201324 -> increase # of attempts to reduce pre-timeout error reporting. will help to load app on slow connection/computer.
	else if(attempts > 250)	{
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
	$('#tier1CategoriesContainer').menu({ position: { my: "left top", at: "left top" } });
	}




//don't execute script till both jquery AND the dom are ready.
$(document).ready(function(){
	app.u.handleRQ(0)
	});






