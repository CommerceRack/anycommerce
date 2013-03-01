var app = app || {vars:{},u:{}}; //make sure app exists.
app.rq = app.rq || []; //ensure array is defined. rq = resource queue.




//app.rq.push(['extension',0,'convertSessionToOrder','extensions/checkout_passive/extension.js']);
app.rq.push(['extension',0,'convertSessionToOrder','extensions/checkout_nice/extension.js']);
app.rq.push(['extension',0,'store_checkout','extensions/store_checkout.js']);
app.rq.push(['extension',0,'store_prodlist','extensions/store_prodlist.js']);
app.rq.push(['extension',0,'store_navcats','extensions/store_navcats.js']);
app.rq.push(['extension',0,'store_search','extensions/store_search.js']);
app.rq.push(['extension',0,'store_product','extensions/store_product.js']);
app.rq.push(['extension',0,'store_cart','extensions/store_cart.js']);
app.rq.push(['extension',0,'store_crm','extensions/store_crm.js']);
app.rq.push(['extension',0,'myRIA','quickstart.js','startMyProgram']);
app.rq.push(['extension',0,'partner_addthis','extensions/partner_addthis.js','startExtension']); //MC's addthis ext from 201307

app.rq.push(['extension',1,'analytics_google','extensions/analytics_google.js','addTriggers']); //old default callback.
app.rq.push(['extension',1,'google_ts','extensions/partner_google_trusted_store.js','startExtension']); //new default callback.

//app.rq.push(['extension',1,'bonding_buysafe','extensions/bonding_buysafe.js','startExtension']);
//app.rq.push(['extension',1,'powerReviews','extensions/reviews_powerreviews.js','startExtension']);
//app.rq.push(['extension',0,'magicToolBox','extensions/imaging_magictoolbox.js','startExtension']); // (not working yet - ticket in to MTB)


//add tabs to product data.
//tabs are handled this way because jquery UI tabs REALLY wants an id and this ensures unique id's between product
//updated from 201304 per JT
app.rq.push(['templateFunction','productTemplate','onCompletes',function(P) {
	var safePID = app.u.makeSafeHTMLId(P.pid); //can't use jqSelector because productTEmplate_pid still used makesafe. planned Q1-2013 update ###
	var $tabContainer = $( ".tabbedProductContent",$('#productTemplate_'+safePID));
		if($tabContainer.length)	{
			if($tabContainer.data("widget") == 'anytabs'){} //tabs have already been instantiated. no need to be redundant.
			else	{
				$tabContainer.anytabs();
				}
			}
		else	{} //couldn't find the tab to tabificate.
	}]);

app.rq.push(['script',0,(document.location.protocol == 'file:') ? app.vars.httpURL+'jquery/config.js' : app.vars.baseURL+'jquery/config.js']); //The config.js is dynamically generated.
app.rq.push(['script',0,app.vars.baseURL+'model.js']); //'validator':function(){return (typeof zoovyModel == 'function') ? true : false;}}
app.rq.push(['script',0,app.vars.baseURL+'includes.js']); //','validator':function(){return (typeof handlePogs == 'function') ? true : false;}})
app.rq.push(['script',1,app.vars.baseURL+'jeditable.js']); //used for making text editable (customer address). non-essential. loaded late.
app.rq.push(['script',0,app.vars.baseURL+'controller.js']);

app.rq.push(['script',0,app.vars.baseURL+'anyplugins.js']);


//sample of an onDeparts. executed any time a user leaves this page/template type.
app.rq.push(['templateFunction','homepageTemplate','onDeparts',function(P) {app.u.dump("just left the homepage")}]);


//group any third party files together (regardless of pass) to make troubleshooting easier.
app.rq.push(['script',0,(document.location.protocol == 'https:' ? 'https:' : 'http:')+'//ajax.googleapis.com/ajax/libs/jqueryui/1.9.0/jquery-ui.js']);
//for banner slideshow used on homepage.
app.rq.push(['script',1,app.vars.baseURL+'cycle-2.9998.js']);//','validator':function(){return (jQuery().cycle) ? true : false;}});
//renders AddThis block on product pages
//app.rq.push(['script',5,(document.location.protocol == 'https:' ? 'https:' : 'http:')+'//s7.addthis.com/js/250/addthis_widget.js#pubid=ra-4f26cd7d7f87f12', function(P) {var addthis_config = {"data_track_clickback":false,"ui_click":true,"ui_use_image_picker": true};}]);//	'validator':function(){return (typeof addthis == 'object') ? true : false;}






//sample of an onDeparts. executed any time a user leaves this page/template type.
app.rq.push(['templateFunction','cartTemplate','onCompletes',function(P) {
	
	if(window.google_remarketing_has_run)	{}
	else	{
		app.u.dump(" -> EXECUTING google remarketing code.");
		window.google_conversion_id = 1046921581;
		window.google_conversion_language = "en";
		window.google_conversion_format = "3";
		window.google_conversion_color = "ffffff";
		window.google_conversion_label = "O2xRCM_GnBQQ7YKb8wM";
		window.google_conversion_value = 0;
		window.google_remarketing_has_run = true;
		app.rq.push(['script',0,'https://www.googleadservices.com/pagead/conversion.js']);
		}
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
	var percentPerInclude = Math.round((100 / app.vars.rq.length));  
	var resourcesLoaded = app.u.howManyPassZeroResourcesAreLoaded();
	var percentComplete = resourcesLoaded * percentPerInclude; //used to sum how many includes have successfully loaded.

	$('#appPreViewProgressBar').val(percentComplete);
	$('#appPreViewProgressText').empty().append(percentComplete+"% Complete");

	if(resourcesLoaded == app.vars.rq.length)	{
//instantiate controller. handles all logic and communication between model and view.
//passing in app will extend app so all previously declared functions will exist in addition to all the built in functions.
//tmp is a throw away variable. app is what should be used as is referenced within the mvc.
		app.vars.rq = null; //to get here, all these resources have been loaded. nuke record to keep DOM clean and avoid any duplication.
		var tmp = new zController(app);
//instantiate wiki parser.
		myCreole = new Parse.Simple.Creole();
		}
	else if(attempts > 100)	{
		app.u.dump("WARNING! something went wrong in init.js");
		//this is 10 seconds of trying. something isn't going well.
		$('#appPreView').empty().append("<h2>Uh Oh. Something seems to have gone wrong. </h2><p>Several attempts were made to load the store but some necessary files were not found or could not load. We apologize for the inconvenience. Please try 'refresh' and see if that helps.<br><b>If the error persists, please contact the site administrator</b><br> - dev: see console.</p>");
		app.u.howManyPassZeroResourcesAreLoaded(true);
		}
	else	{
		setTimeout("app.u.initMVC("+(attempts+1)+")",250);
		}

	}



//Any code that needs to be executed after the app init has occured can go here.
//will pass in the page info object. (pageType, templateID, pid/navcat/show and more)
app.u.appInitComplete = function(P)	{
	app.u.dump("Executing myAppIsLoaded code...");
//Go get the brands and display them.	
	app.ext.store_navcats.calls.appCategoryDetailMax.init('.brands',{'callback':'getChildData','extension':'store_navcats','parentID':'brandCategories','templateID':'categoryListTemplateThumb'},'passive');
	app.model.dispatchThis('passive'); //use passive or going into checkout could cause request to get muted.		
//Adding category nav tabs
	app.ext.myRIA.renderFormats.simpleSubcats = function($tag,data)	{
	//app.u.dump("BEGIN control.renderFormats.subcats");
	var L = data.value.length;
	var thisCatSafeID; //used in the loop below to store the cat id during each iteration
	//app.u.dump(data);
	for(var i = 0; i < L; i += 1)	{
		thisCatSafeID = data.value[i].id;
		if(data.value[i].pretty.charAt(0) == '!')	{
			//categories that start with ! are 'hidden' and should not be displayed.
			}
		else	{
			$tag.append(app.renderFunctions.transmogrify({'id':thisCatSafeID,'catsafeid':thisCatSafeID},data.bindData.loadsTemplate,data.value[i]));
			}
		}
			} //simpleSubcats
// Homepage Slideshow
//	app.ext.myRIA.template.homepageTemplate.onCompletes.push(function(){
//		$('#wideSlideshow').cycle({
//			fx:     'fade',
//			speed:  'slow',
//			timeout: 5000,
//			pager:  '#slideshowNav',
//			slideExpr: 'li'
//			});
//		}) //homepageTemplate.onCompletes
			
	app.rq.push(['templateFunction','homepageTemplate','onCompletes',function(P) {
		var $target=$('#wideSlideshow');
//		$target.cycle({fx:'fade',speed:'slow',timeout:5000,pager:'#slideshowNav',pagerAnchorBuilder:function(index,el){return'<a href="#"> </a>';},slideExpr:'li'});	
		$target.cycle({fx:'fade',speed:'slow',timeout:5000,pager:'#slideshowNav',pagerAnchorBuilder:function(index,el){return' ';},slideExpr:'li'});
		}]);
		
		
// add link, css, etc to hotel finder.
// FOR 201248 UPGRADE CLIENT ASKED THAT LINK GO TO HOTELS CAT PAGE NOT MODAL
//	$('.hotelFinder').removeClass('disabled').addClass('pointer').click(function () {
//		$('#hotelListContainer').dialog({
//			'autoOpen':false,
//			'width':'60%',
//			'modal':'true',
//			'height':'500'
//			});
//		$('#hotelListContainer').dialog('open');
	//only render the menu the first time the modal is opened. saves cycles and eliminates duplicates appearing
//		if($('#hotelListContainerUL > li').length < 1)	{
//			app.renderFunctions.translateSelector('#hotelListContainer',app.data['appCategoryDetail|.hotels']);
//			}
//		});
	//addthis code for productTemplate - replaced by partner_addthis extension
//	app.rq.push(['templateFunction','productTemplate','onCompletes',function(P) {
//	var url = zGlobals.appSettings.http_app_url+"product/"+P.pid+"/";
	//update the openGraph and meta content. mostly for social/addThis.
//	$('#ogTitle').attr('content',app.data[P.datapointer]['%attribs']['zoovy:prod_name']);
//	$('#ogImage').attr('content',app.u.makeImage({"name":app.data[P.datapointer]['%attribs']['zoovy:prod_image1'],"w":150,"h":150,"b":"FFFFFF","tag":0}));
//	$('#ogDescription, #metaDescription').attr('content',app.data[P.datapointer]['%attribs']['zoovy:prod_desc']);
//			addthis.toolbox('#socialLinks');
//	if(typeof addthis == 'object' && addthis.update)	{
//		addthis.update('share','url',url);
//		$("#socialLinks .addthis_button_facebook_like").attr("fb:like:href",url);
//		$("#socialLinks .addthis_button_pinterest_pinit").attr({"pi:pinit:media":app.u.makeImage({"h":"300","w":"300","b":"ffffff","name":app.data['appProductGet|'+P.pid]['%attribs']['zoovy:prod_image1'],"tag":0}),"pi:pinit:url":url});	
//		}

//		}]); //addThis productTemplate code		
}


//app.rq.push(['templateFunction','homepageTemplate','onCompletes',function(P) {
//	var $target=$('#wideSlideshow');
//	$target.cycle({fx:'fade',speed:'slow',timeout:5000,pager:'#slideshowNav',pagerAnchorBuilder:function(index,el){return'<a href="#"> </a>';},slideExpr:'li'});	
//	}]);

//don't execute script till both jquery AND the dom are ready.
$(document).ready(function(){
	app.u.handleRQ(0);
	});
