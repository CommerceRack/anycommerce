var app = app || {vars:{},u:{}}; //make sure app exists.

// A list of all the extensions that are going to be used.
//if an extension is 'required' for any page within the store to load properly, the extension should be added as a dependency within quickstart.js
app.vars.extensions = [
	{"namespace":"store_prodlist","filename":"extensions/store_prodlist.js"},
//	{"namespace":"convertSessionToOrder","filename":"extensions/checkout_passive/extension.js"},  /* checkout_passive does not require buyer to login */
	{"namespace":"convertSessionToOrder","filename":"extensions/checkout_nice/extension.js"},	/* checkout_nice prompts buyer to login */
	{"namespace":"store_checkout","filename":"extensions/store_checkout.js"},
	{"namespace":"store_navcats","filename":"extensions/store_navcats.js"},
	{"namespace":"store_search","filename":"extensions/store_search.js"},
	{"namespace":"store_product","filename":"extensions/store_product.js"},
	{"namespace":"store_cart","filename":"extensions/store_cart.js"},
	{"namespace":"analytics_google","filename":"extensions/analytics_google.js","callback":"addTriggers"},
//	{"namespace":"bonding_buysafe","filename":"extensions/bonding_buysafe.js","callback":"addTriggers"},
	{"namespace":"store_crm","filename":"extensions/store_crm.js"},
	{"namespace":"myRIA","filename":"quickstart.js","callback":"startMyProgram"}
	];


/*
app.vars.scripts is an object containing a list of scripts that are required/desired.
for each script, include:  
	pass -> scripts are loaded in a loop. pass 1 is loaded before app gets initiated and should only include 'required' scripts. Use > 1 for other scripts.
	location -> the location of the file. be sure to load a secure script on secure pages to avoid an ssl error.
	validator -> a function returning true or false if the script is loaded. Used primarily on pass 1.
optionally also include:
	callback -> a function to execute after the script is loaded.
*/
app.vars.scripts = new Array();



app.vars.scripts.push({
	'pass':1,
	'location':app.vars.baseURL+'controller.js',
	'validator':function(){return (typeof zController == 'function') ? true : false;},
	'callback':function(){app.u.initMVC()} //the app.u.initMVC callback is what instantiates the controller.
	})


app.vars.scripts.push({
	'pass':1,
	'location':(document.location.protocol == 'https:' ? 'https:' : 'http:')+'//ajax.googleapis.com/ajax/libs/jqueryui/1.8.21/jquery-ui.js',
	'validator':function(){return (typeof $ == 'function' && jQuery.ui) ? true : false;}
	})
//The config.js file is 'never' local. it's a remote file, so...
//when opening the app locally, always use the nonsecure config file. Makes testing easier.
//when opening the app remotely, use app.vars.baseURL which will be http/https as needed.

app.vars.scripts.push({
	'pass':1,
	'location':(document.location.protocol == 'file:') ? app.vars.httpURL+'jquery/config.js' : app.vars.baseURL+'jquery/config.js',
	'validator':function(){return (typeof zGlobals == 'object') ? true : false;}
	})

app.vars.scripts.push({'pass':1,'location':app.vars.baseURL+'model.js','validator':function(){return (typeof zoovyModel == 'function') ? true : false;}})
app.vars.scripts.push({'pass':1,'location':app.vars.baseURL+'includes.js','validator':function(){return (typeof handlePogs == 'function') ? true : false;}})

//This script caused some serious GA tracking issues for us.
//app.vars.scripts.push({'pass':4,'location':('https:' == document.location.protocol ? 'https://c14323198.ssl' : 'http://c14323198.r98') + '.cf2.rackcdn.com/gascript.js','validator':function(){return true}})

//used for making text editable (customer address). non-essential. loaded late.
app.vars.scripts.push({'pass':5,'location':app.vars.baseURL+'jeditable.js','validator':function(){return (typeof $ == 'function' && jQuery().editable) ? true : false;}})

//for banner slideshow used on homepage.
app.vars.scripts.push({'pass':1,'location':app.vars.baseURL+'cycle-2.9998.js','validator':function(){return (jQuery().cycle) ? true : false;}})

app.vars.scripts.push({
	'pass':5,
	'location':'https://s7.addthis.com/js/250/addthis_widget.js#pubid=ra-4f26cd7d7f87f12',
	'callback':function(){var addthis_config = {"data_track_clickback":false,"ui_click":true,"ui_use_image_picker": true};},
	'validator':function(){return (typeof addthis == 'object') ? true : false;}
	})
	
app.vars.scripts.push({
	'pass':5,
	'location':'https://www.googleadservices.com/pagead/conversion.js',
	'validator':function(){return true;}
	})


/*
Will load all the scripts from pass X where X is an integer less than 10.
This will load all of the scripts in the app.vars.scripts object that have a matching 'pass' value.

*/

app.u.loadScriptsByPass = function(PASS,CONTINUE)	{
//	app.u.dump("BEGIN app.u.loadScriptsByPass ["+PASS+"]");
	var L = app.vars.scripts.length;
	var numIncludes = 0; //what is returned. The total number of includes for this pass.
	for(var i = 0; i < L; i += 1)	{
		if(app.vars.scripts[i].pass == PASS)	{
			numIncludes++
			app.u.loadScript(app.vars.scripts[i].location,app.vars.scripts[i].callback);
			}
		}
	if(CONTINUE == true && PASS <= 10)	{app.u.loadScriptsByPass((PASS + 1),true)}
	return numIncludes;
	}


/*
This function is overwritten once the controller is instantiated. 
Having a placeholder allows us to always reference the same messaging function, but not impede load time with a bulky error function.
*/
app.u.throwMessage = function(m)	{
	alert(m); 
	}


//put any code that you want executed AFTER the app has been initiated in here.  This may include adding onCompletes or onInits for a given template.
app.u.appInitComplete = function()	{
	
	app.u.dump("Executing myAppIsLoaded code...");
	
//Go get the brands and display them.	
	app.ext.store_navcats.calls.appCategoryDetailMax.init('.brands',{'callback':'getChildData','extension':'store_navcats','parentID':'brandCategories','templateID':'categoryListTemplateThumb'},'passive');
	app.model.dispatchThis('passive'); //use passive or going into checkout could cause request to get muted.		

/* add link, css, etc to hotel finder. */
	$('.hotelFinder').removeClass('disabled').addClass('pointer').click(function () {
		$('#hotelListContainer').dialog({
			'autoOpen':false,
			'width':'60%',
			'modal':'true',
			'height':'500'
			});
		$('#hotelListContainer').dialog('open');
	//only render the menu the first time the modal is opened. saves cycles and eliminates duplicates appearing
		if($('#hotelListContainerUL > li').length < 1)	{
			app.renderFunctions.translateSelector('#hotelListContainer',app.data['appCategoryDetail|.hotels']);
			}
		});

//display product blob fields in tabbed format.
	app.ext.myRIA.template.productTemplate.onCompletes.push(function(P) {$( "#tabbedProductContent" ).tabs()})

//will add a 'read more' link if the prod_desc field is longer than the container. It links to/opens the detailed desc tab.
	app.ext.myRIA.template.productTemplate.onCompletes.push(function(P) {
		if($('#prodDescTop').height() > $('#prodDescTopContainer').height())	{
			$('#prodDescTopContainer').after("<span class='floatRight'><a href='#prodDetailTab' onClick=\"$('#prodDetailTab a').click();\">Read More &#187;<\/a><\/span>");
			}
		});

	
//sample for adding a onInit
	app.ext.myRIA.template.productTemplate.onCompletes.push(function(P) {
		var get = ['picture1','description']; //used for each of the three cat page data's were retrieving.


// get and populate the content for the three global tabs

		$('#meetDownlite').append(app.renderFunctions.createTemplateInstance('categoryTemplateForProdTab','meetDownliteContents'));
		$('#beddingGuide').append(app.renderFunctions.createTemplateInstance('categoryTemplateForProdTab','beddingGuideContents'));
		$('#shippingReturns').append(app.renderFunctions.createTemplateInstance('categoryTemplateForProdTab','shippingReturnsContents'));

		app.ext.store_navcats.calls.appPageGet.init({'PATH':'.613-made-in-the-usa-bedding','@get':get},{'parentID':'meetDownliteContents','callback':'translateTemplate'});
		app.ext.store_navcats.calls.appPageGet.init({'PATH':'.product-tabs.bedding-guide','@get':get},{'parentID':'beddingGuideContents','callback':'translateTemplate'});
		app.ext.store_navcats.calls.appPageGet.init({'PATH':'.product-tabs.shipping-returns','@get':get},{'parentID':'shippingReturnsContents','callback':'translateTemplate'});
		app.model.dispatchThis();
		});
	
	
	//addthis code for productTemplate
	app.ext.myRIA.template.productTemplate.onCompletes.push(function(P) {
var url = zGlobals.appSettings.http_app_url+"product/"+P.pid+"/";
//update the openGraph and meta content. mostly for social/addThis.
$('#ogTitle').attr('content',app.data[P.datapointer]['%attribs']['zoovy:prod_name'])
$('#ogImage').attr('content',app.u.makeImage({"name":app.data[P.datapointer]['%attribs']['zoovy:prod_image1'],"w":150,"h":150,"b":"FFFFFF","tag":0}))
$('#ogDescription, #metaDescription').attr('content',app.data[P.datapointer]['%attribs']['zoovy:prod_desc'])


//		addthis.toolbox('#socialLinks');
if(typeof addthis == 'object' && addthis.update)	{
	addthis.update('share','url',url);
	$("#socialLinks .addthis_button_facebook_like").attr("fb:like:href",url);
	$("#socialLinks .addthis_button_pinterest_pinit").attr({"pi:pinit:media":app.u.makeImage({"h":"300","w":"300","b":"ffffff","name":app.data['appProductGet|'+P.pid]['%attribs']['zoovy:prod_image1'],"tag":0}),"pi:pinit:url":url});	
	}

	}); //addThis productTemplate code



	app.ext.myRIA.template.homepageTemplate.onCompletes.push(function(){
		$('#wideSlideshow').cycle({
			fx:     'fade',
			speed:  'slow',
			timeout: 5000,
			pager:  '#slideshowNav',
			slideExpr: 'li'
			});
		}) //homepageTemplate.onCompletes

	app.ext.myRIA.template.categoryTemplate.onCompletes.push(function(P){
	// the containers for the video and big pic are hidden by default, then displayed if needed. reduces 'popping' effect
		var tmp  = app.data[P.datapointer]['%page'];
		
		if(app.u.isSet(tmp['youtube_videoid']))	{
			$('.catVideoContainer').show(); //hidden is properties not set so that empty 'boxes' don't show up where the content should be.
			$('.catMediaCol').show();
			}
		else if(app.u.isSet(tmp['picture1']))	{
			$('.catMediaCol').show(); //hidden is properties not set so that empty 'boxes' don't show up where the content should be.
			}
		}) //categoryTemplate.onCompletes



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




	app.u.loadScriptsByPass(2,true);
	}// /appInitComplete






//gets executed once controller.js is loaded.
//check dependencies and make sure all other .js files are done, then init controller.
//function will get re-executed if not all the scripts in app.vars.scripts pass 1 are done loading.
//the 'attempts' var is incremented each time the function is executed.

app.u.initMVC = function(attempts){
//	app.u.dump("app.u.initMVC activated");
	var includesAreDone = true;

//what percentage of completion a single include represents (if 10 includes, each is 10%). subtract 1 just to make sure percentComplete < 100
	var percentPerInclude = Math.round((100 / acScriptsInPass)) - 1;  
	var percentComplete = 0; //used to sum how many includes have successfully loaded.
	
	if(!attempts){attempts = 1} //the number of attempts that have been made to load. allows for error handling
	var L = app.vars.scripts.length
//	app.u.dump(" -> L: "+L+" and attempt: "+attempts);
//don't break out of the loop on the first false. better to loop the whole way through so that the progress bar can go up as quickly as possible.
	for(var i = 0; i < L; i += 1)	{
		if(app.vars.scripts[i].pass == 1 && app.vars.scripts[i].validator()){
			//this file is loaded.
			percentComplete += percentPerInclude;
			}
		else if(app.vars.scripts[i].pass != 1)	{
			//only first pass items are validated for instantiting the controller.
			}
		else	{
			//file not loaded.
			app.u.dump(" -> attempt "+attempts+" waiting on: "+app.vars.scripts[i].location)
			includesAreDone = false;
			}
		}

	$('#appPreViewProgressBar').val(percentComplete);
	$('#appPreViewProgressText').empty().append(percentComplete+"% Complete");
	
	if(includesAreDone == true && jQuery)	{
		$.support.cors = true;  //cross site scripting for non cors sites. will b needed for IE10. IE8 & 9 don't support xss well.
//instantiate controller. handles all logic and communication between model and view.
//passing in app will extend app so all previously declared functions will exist in addition to all the built in functions.
//tmp is a throw away variable. app is what should be used as is referenced within the mvc.
		var tmp = new zController(app);

		//instantiate wiki parser.
		myCreole = new Parse.Simple.Creole();

		}
	else if(attempts > 80)	{
		app.u.dump("WARNING! something went wrong in init.js");
		//this is 10 seconds of trying. something isn't going well.
		$('#appPreView').empty().append("<h2>Uh Oh. Something seems to have gone wrong. </h2><p>Several attempts were made to load the store but some necessary files were not found or could not load. We apologize for the inconvenience. Please try 'refresh' and see if that helps.<br><b>If the error persists, please contact the site administrator</b><br> - dev: see console.</p>");
//throw some debugging at the console to report what didn't load.
		for(var i = 0; i < L; i += 1)	{
			if(app.vars.scripts[i].pass == 1)	{
				app.u.dump(" -> "+app.vars.scripts[i].location+": "+app.vars.scripts[i].validator());
				}
			}
		
		}
	else	{
		setTimeout("app.u.initMVC("+(attempts+1)+")",250);
		}
	}






//start the app.
var acScriptsInPass;
//don't execute script till both jquery AND the dom are ready.
$(document).ready(function(){
	acScriptsInPass = app.u.loadScriptsByPass(1,false)
	});






