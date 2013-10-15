var app = app || {vars:{},u:{}}; //make sure app exists.
app.rq = app.rq || []; //ensure array is defined. rq = resource queue.


/*
This function is overwritten once the controller is instantiated. 
Having a placeholder allows us to always reference the same messaging function, but not impede load time with a bulky error function.
*/
app.u.throwMessage = function(m)	{
	alert(m); 
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
	else if(attempts > 100)	{
		app.u.dump("WARNING! something went wrong in init.js");
		//this is 10 seconds of trying. something isn't going well.
		$('.appMessaging').empty().append("<h2>Not all resources were able to be loaded.</h2><p>Several attempts were made to load the store but some necessary files were not found or could not load. We apologize for the inconvenience. This is <b>most likely due to a slow computer and/or slow internet connection<\/b>. Please try 'refresh' and see if that helps.<br><b>If the error persists, please contact the site administrator</b><br> - dev: see console.</p>");
		app.u.howManyPassZeroResourcesAreLoaded(true);
		}
	else	{
		setTimeout("app.u.initMVC("+(attempts+1)+")",250);
		}

	}



//don't execute script till both jquery AND the dom are ready.
$(document).ready(function(){
	var tmp = new zController(app);
//instantiate wiki parser.
	myCreole = new Parse.Simple.Creole();
	});


