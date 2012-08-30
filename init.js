var app = app || {vars:{},u:{}}; //make sure app exists.

// A list of all the extensions that are going to be used.
//if an extension is 'required' for any page within the store to load properly, the extension should be added as a dependency within quickstart.js
app.vars.extensions = [
	{"namespace":"store_prodlist","filename":"extensions/store_prodlist.js"},
	{"namespace":"convertSessionToOrder","filename":"extensions/checkout_passive/extension.js"},  /* checkout_passive does not require buyer to login */
//	{"namespace":"convertSessionToOrder","filename":"extensions/checkout_nice/extension.js"},	/* checkout_nice prompts buyer to login */
	{"namespace":"store_checkout","filename":"extensions/store_checkout.js"},
	{"namespace":"store_navcats","filename":"extensions/store_navcats.js"},
	{"namespace":"store_search","filename":"extensions/store_search.js"},
	{"namespace":"store_product","filename":"extensions/store_product.js"},
	{"namespace":"store_cart","filename":"extensions/store_cart.js"},
//	{"namespace":"analytics_google","filename":"extensions/analytics_google.js","callback":"addTriggers"},
	{"namespace":"bonding_buysafe","filename":"extensions/bonding_buysafe.js","callback":"addTriggers"},
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



//used for making text editable (customer address). non-essential. loaded late.
app.vars.scripts.push({'pass':8,'location':app.vars.baseURL+'jeditable.js','validator':function(){return (typeof $ == 'function' && jQuery().editable) ? true : false;}})




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
function could be used for warnings, errors or success. defaults to 'error'.
*/
app.u.throwMessage = function(m)	{
	alert(m); 
	}


//put any code that you want executed AFTER the app has been initiated in here.  This may include adding onCompletes or onInits for a given template.
app.u.appInitComplete = function()	{
	
	app.u.dump("Executing myAppIsLoaded code...");
//display product blob fields in tabbed format.
	app.ext.myRIA.template.productTemplate.onCompletes.push(function(P) {$( "#tabbedProductContent" ).tabs()}) 
//sample for adding a onInit
	app.ext.myRIA.template.homepageTemplate.onInits.push(function(P) {
		//do something.
		}) //display product blob fields in tabbed format.
	}

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






