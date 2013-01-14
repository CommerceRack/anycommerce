var app = app || {vars:{},u:{}}; //make sure app exists.
app.rq = app.rq || []; //ensure array is defined. rq = resource queue.



app.rq.push(['extension',0,'admin','extensions/admin/extension.js','initExtension']);
app.rq.push(['extension',0,'admin_prodEdit','extensions/admin/product_editor.js']);
app.rq.push(['extension',0,'admin_orders','extensions/admin/orders.js']); 

//these can be loaded later because none of them are required for a page to load.
//this will change going forward.
app.rq.push(['extension',1,'store_prodlist','extensions/store_prodlist.js']);
app.rq.push(['extension',1,'store_navcats','extensions/store_navcats.js']);
app.rq.push(['extension',1,'store_search','extensions/store_search.js']);
app.rq.push(['extension',1,'store_cart','extensions/store_cart.js']);
app.rq.push(['extension',1,'store_checkout','extensions/store_checkout.js']);
app.rq.push(['extension',1,'store_product','extensions/store_product.js']);

app.rq.push(['extension',1,'admin_support','extensions/admin/support.js']);
app.rq.push(['extension',1,'admin_task','extensions/admin/task.js']);
app.rq.push(['extension',1,'admin_batchJob','extensions/admin/batchjob.js']);
app.rq.push(['extension',1,'convertSessionToOrder','extensions/admin/order_create.js']); 
app.rq.push(['extension',1,'admin_medialib','extensions/admin/medialib.js']); //do NOT set to zero. causes a script issue.


//required for init. don't change from 0.
app.rq.push(['script',0,app.vars.baseURL+'model.js']); //'validator':function(){return (typeof zoovyModel == 'function') ? true : false;}}
app.rq.push(['script',0,app.vars.baseURL+'includes.js']); //','validator':function(){return (typeof handlePogs == 'function') ? true : false;}})
app.rq.push(['script',0,app.vars.baseURL+'controller.js']);


app.rq.push(['script',1,app.vars.baseURL+'jeditable.js']); //used for making text editable (customer address). non-essential. loaded late. used in orders.
app.rq.push(['script',1,app.vars.baseURL+'extensions/admin/resources/highcharts-v2.1.9.js']); //used for KPI

app.rq.push(['script',1,'https://crypto-js.googlecode.com/files/2.5.3-crypto-md5.js']); //used for authentication.

//have showLoading as early as possible. pretty handy feature. used everywhere.
app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/resources/showloading.css']);
app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jquery.showloading-v1.0.js']);


// jQuery-contextMenu - http://medialize.github.com/jQuery-contextMenu/  used in orders.
app.rq.push(['css',1,app.vars.baseURL+'extensions/admin/resources/jquery.contextMenu.css']);
app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jquery.contextMenu.js']); //must be in first pass in case orders is the landing page.
app.rq.push(['script',1,app.vars.baseURL+'extensions/admin/resources/jquery.ui.position.js']);



//group any third party files together (regardless of pass) to make troubleshooting easier.
app.rq.push(['script',0,(document.location.protocol == 'https:' ? 'https:' : 'http:')+'//ajax.googleapis.com/ajax/libs/jqueryui/1.9.1/jquery-ui.js']);



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

	$('#appPreViewProgressBar').val(percentComplete);
	$('#appPreViewProgressText').empty().append(percentComplete+"% Complete");


	if(resourcesLoaded == app.vars.rq.length)	{
//instantiate controller. handles all logic and communication between model and view.
//passing in app will extend app so all previously declared functions will exist in addition to all the built in functions.
//tmp is a throw away variable. app is what should be used as is referenced within the mvc.
		app.vars.rq = null; //to get here, all these resources have been loaded. nuke record to keep DOM clean and avoid any duplication. note this is NOT app.rq
		var tmp = new zController(app);
//instantiate wiki parser.
		myCreole = new Parse.Simple.Creole();
		
		}
	else if(attempts > 50)	{
		app.u.dump("WARNING! something went wrong in init.js");
		//this is 10 seconds of trying. something isn't going well.
		$('.appMessaging').empty().append("<h2>Uh Oh. Something seems to have gone wrong. </h2><p>Several attempts were made to load the store but some necessary files were not found or could not load. We apologize for the inconvenience. Please try 'refresh' and see if that helps.<br><b>If the error persists, please contact the site administrator</b><br> - dev: see console.</p>");
		app.u.howManyPassZeroResourcesAreLoaded(true);
		}
	else	{
		setTimeout("app.u.initMVC("+(attempts+1)+")",250);
		}

	}



//don't execute script till both jquery AND the dom are ready.
$(document).ready(function(){
	app.u.handleRQ(0); //will start loading resources and eventually init the app.
	});


