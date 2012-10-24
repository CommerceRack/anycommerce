var app = app || {vars:{},u:{}}; //make sure app exists.
app.rq = app.rq || []; //ensure array is defined. rq = resource queue.




app.rq.push(['extension',0,'store_prodlist','extensions/store_prodlist.js']);
//app.rq.push(['extension',0,'convertSessionToOrder','extensions/checkout_passive/extension.js']);
app.rq.push(['extension',0,'convertSessionToOrder','extensions/checkout_nice/extension.js']);
app.rq.push(['extension',0,'store_checkout','extensions/store_checkout.js']);
app.rq.push(['extension',0,'store_navcats','extensions/store_navcats.js']);
app.rq.push(['extension',0,'store_search','extensions/store_search.js']);
app.rq.push(['extension',0,'store_product','extensions/store_product.js']);
app.rq.push(['extension',0,'store_cart','extensions/store_cart.js']);
app.rq.push(['extension',0,'store_crm','extensions/store_crm.js']);
app.rq.push(['extension',0,'myRIA','quickstart.js','startMyProgram']);

//app.rq.push(['extension',1,'analytics_google','extensions/analytics_google.js','addTriggers']);
//app.rq.push(['extension',1,'bonding_buysafe','extensions/bonding_buysafe.js','addTriggers']);
//app.rq.push(['extension',1,'powerReviews','extensions/reviews_powerreviews.js','startExtension']);
//app.rq.push(['extension',0,'magicToolBox','extensions/imaging_magictoolbox.js','startExtension']); // (not working yet)



//add tabs to product data.
app.rq.push(['templateFunction','productTemplate','onCompletes',function(P) {
	$( ".tabbedProductContent",$('#productTemplate_'+app.u.makeSafeHTMLId(P.pid))).tabs();
	}]);

app.rq.push(['script',0,(document.location.protocol == 'file:') ? app.vars.httpURL+'jquery/config.js' : app.vars.baseURL+'jquery/config.js']); //The config.js is dynamically generated.
app.rq.push(['script',0,app.vars.baseURL+'model.js']); //'validator':function(){return (typeof zoovyModel == 'function') ? true : false;}}
app.rq.push(['script',0,app.vars.baseURL+'includes.js']); //','validator':function(){return (typeof handlePogs == 'function') ? true : false;}})
app.rq.push(['script',1,app.vars.baseURL+'jeditable.js']); //used for making text editable (customer address). non-essential. loaded late.
app.rq.push(['script',0,app.vars.baseURL+'controller.js']);



//group any third party files together (regardless of pass) to make troubleshooting easier down the road and for the next guy.
app.rq.push(['script',0,(document.location.protocol == 'https:' ? 'https:' : 'http:')+'//ajax.googleapis.com/ajax/libs/jqueryui/1.8.21/jquery-ui.js']);




/*
Will load all scripts and extenstions with pass = 0.
pass with any other value (including blank,null, undefined, etc) will get loaded later.
this function is overwritten once the myRIA callback occurs with a very similar function (ignores pass).
app.rq.push() = app.u.handleRQ so whatever the values in push() are get executed immediately.
*/

app.u.handleRQ = function()	{

	var numIncludes = 0; //what is returned. The total number of includes for this pass.
	var L = app.rq.length - 1;

	app.vars.extensions = app.vars.extensions || []; //ensure array is defined.
	app.vars.rq = new Array(); //to avoid any duplication, as iteration occurs, items are moved from app.rq into this tmp array. 

//the callback added to the loadScript on type 'script' sets the last value of the resource array to true.
//another script will go through this array and make sure all values are true for validation. That script will execute the callback (once all scripts are loaded).
	var callback = function(index){
		app.vars.rq[index][app.vars.rq[index].length - 1] = true; //last index in array is for 'is loaded'. set to false in loop below.
		}
	
	for(var i = L; i >= 0; i--)	{
//		app.u.dump("app.rq["+i+"][0]: "+app.rq[i][0]+" and app.rq["+i+"][1]: "+app.rq[i][1]);
		if(app.rq[i][0] == 'script' && app.rq[i][1] === 0)	{
			numIncludes++;
			app.rq[i][app.rq[i].length] = false; //will get set to true when script loads as part of callback.
			app.vars.rq.push(app.rq[i]); //add to pass zero rq.
			app.u.loadScript(app.rq[i][2],callback,(app.vars.rq.length - 1));
			app.rq.splice(i, 1); //remove from new array to avoid dupes.
			}
		else if(app.rq[i][0] == 'extension' && app.rq[i][1] === 0)	{
			numIncludes++;
			app.vars.extensions.push({"namespace":app.rq[i][2],"filename":app.rq[i][3],"callback":app.rq[i][4]}); //add to extension Q.
			app.rq[i][app.rq[i].length] = false; //will get set to true when script loads as part of callback.
			app.vars.rq.push(app.rq[i]); //add to pass zero rq.

//on pass 0, no callbacks added to extensions because the model already has a function for checking if extensions are loaded.
// adding these extensions to the extensions array is necessary for this checker to work.
			app.u.loadScript(app.rq[i][3],callback,(app.vars.rq.length - 1));
			app.rq.splice(i, 1); //remove from old array to avoid dupes.
			}
		else	{
//currently, this function is intended for pass 0 only, so if an item isn't pass 0,do nothing with it.
			}
		}
//	app.u.dump("numIncludes: "+numIncludes);
	app.u.initMVC(0);
	return numIncludes;

	}


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



//Any code that needs to be executed after the app init has occured can go here.
//will pass in the page info object. (pageType, templateID, pid/navcat/show and more)
app.u.appInitComplete = function(P)	{
	app.u.dump("Executing myAppIsLoaded code...");
	}




//don't execute script till both jquery AND the dom are ready.
$(document).ready(function(){
	app.u.handleRQ(0)
	});






