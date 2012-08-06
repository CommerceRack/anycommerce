


var myExtensions = [
	{"namespace":"store_prodlist","filename":"extensions/store_prodlist.js"},
	{"namespace":"convertSessionToOrder","filename":"extensions/checkout_passive/extension.js"},  /* checkout_passive does not require buyer to login */
//	{"namespace":"convertSessionToOrder","filename":"extensions/checkout_nice/extension.js"},	/* checkout_nice prompts buyer to login */
	{"namespace":"store_checkout","filename":"extensions/store_checkout.js"},
	{"namespace":"store_navcats","filename":"extensions/store_navcats.js"},
	{"namespace":"store_search","filename":"extensions/store_search.js"},
	{"namespace":"store_product","filename":"extensions/store_product.js"},
	{"namespace":"store_cart","filename":"extensions/store_cart.js"},
	{"namespace":"store_crm","filename":"extensions/store_crm.js"},
	{"namespace":"myRIA","filename":"quickstart.js","callback":"startMyProgram"}];


/*
load any script that needs to callback after loading.
*/
var acBaseScripts = new Array();
acBaseScripts.push({'pass':1,'location':ac.baseURL+'jquery-ui-1.8.20.custom.min.js','validator':function(){return (typeof $ == 'function' && jQuery.ui) ? true : false;}})
acBaseScripts.push({'pass':1,'location':ac.baseURL+'model.js','validator':function(){return (typeof zoovyModel == 'function') ? true : false;}})
acBaseScripts.push({'pass':1,'location':ac.baseURL+'includes.js','validator':function(){return (typeof handlePogs == 'function') ? true : false;}})

//The config.js file is 'never' local. it's a remote file, so...
//when opening the app locally, always use the nonsecure config file. Makes testing easier.
//when opening the app remotely, use ac.baseURL which will be http/https as needed.

acBaseScripts.push({'pass':1,'location':(document.location.protocol == 'file:') ? ac.httpURL+'jquery/config.js' : ac.baseURL+'jquery/config.js','validator':function(){return (typeof zGlobals == 'object') ? true : false;}})

//acBaseScripts.push({'pass':1,'location':ac.baseURL+'json2.js','validator':function(){return true}})
//acBaseScripts.push({'pass':1,'location':ac.baseURL+'variations.js','validator':function(){return (typeof handlePogs == 'function') ? true : false;}})
//acBaseScripts.push({'pass':1,'location':ac.baseURL+'wiki.js','validator':function(){return (typeof Parse == 'object') ? true : false;}})
acBaseScripts.push({'pass':1,'location':ac.baseURL+'controller.js','validator':function(){return (typeof zController == 'function') ? true : false;},'callback':function(){acHandleAppInit()}})

var acScriptsInPass = acLoadScriptsByPass(1,false)





function acLoadScriptsByPass(PASS,CONTINUE)	{
//	acDump("BEGIN acLoadScriptsByPass ["+PASS+"]");
	var L = acBaseScripts.length;
	var numIncludes = 0; //what is returned. The total number of includes for this pass.
	for(var i = 0; i < L; i += 1)	{
		if(acBaseScripts[i].pass == PASS)	{
			numIncludes++
			loadScript(acBaseScripts[i].location,acBaseScripts[i].callback);
			}
		}
	if(CONTINUE == true && PASS <= 10)	{acLoadScriptsByPass((PASS + 1),true)}
	return numIncludes;
	}




//put any code that you want executed AFTER the app has been initiated in here.  This may include adding onCompletes or onInits for a given template.
function acAppIsLoaded()	{
	
//	myControl.util.dump("Executing myAppIsLoaded code...");
//display product blob fields in tabbed format.
	myControl.ext.myRIA.template.productTemplate.onCompletes.push(function(P) {$( "#tabbedProductContent" ).tabs()}) 
//sample for adding a onInit
	myControl.ext.myRIA.template.homepageTemplate.onInits.push(function(P) {
		//do something.
		}) //display product blob fields in tabbed format.
	}

//gets executed once controller.js is loaded.
//check dependencies and make sure all other .js files are done, then init controller.
function acHandleAppInit(attempts){
//	acDump("acHandleAppInit activated");
	var includesAreDone = true;

//what percentage of completion a single include represents (if 10 includes, each is 10%). subtract 1 just to make sure percentComplete < 100
	var percentPerInclude = Math.round((100 / acScriptsInPass)) - 1;  
	var percentComplete = 0; //used to sum how many includes have successfully loaded.
	
	if(!attempts){attempts = 1} //the number of attempts that have been made to load. allows for error handling
	var L = acBaseScripts.length
//	acDump(" -> L: "+L+" and attempt: "+attempts);
//don't break out of the loop on the first false. better to loop the whole way through so that the progress bar can go up as quickly as possible.
	for(var i = 0; i < L; i += 1)	{
		if(acBaseScripts[i].pass == 1 && acBaseScripts[i].validator()){
			//this file is loaded.
			percentComplete += percentPerInclude;
			}
		else if(acBaseScripts[i].pass != 1)	{
			//only first pass items are validated for instantiting the controller.
			}
		else	{
			//file not loaded.
			acDump(" -> attempt "+attempts+" waiting on: "+acBaseScripts[i].location)
			includesAreDone = false;
			}
		}

	$('#appPreViewProgressBar').val(percentComplete);
	$('#appPreViewProgressText').empty().append(percentComplete+"% Complete");
	
	if(includesAreDone == true && jQuery)	{
		$.support.cors = true;  //cross site scripting for non cors sites. will b needed for IE10. IE8 & 9 don't support xss well.
		myControl = new zController({
			"release":"201200716103400" //increment this with each change. should solve caching issues.
			},myExtensions);  //instantiate controller. handles all logic and communication between model and view.

		//instantiate wiki parser.
		myCreole = new Parse.Simple.Creole();
		acLoadScriptsByPass(2,true);
		}
	else if(attempts > 80)	{
		acDump("WARNING! something went wrong in init.js");
		//this is 10 seconds of trying. something isn't going well.
		$('#appPreView').empty().append("<h2>Uh Oh. Something seems to have gone wrong. </h2><p>Several attempts were made to load the store but some necessary files were not found or could not load. We apologize for the inconvenience. Please try 'refresh' and see if that helps.<br><b>If the error persists, please contact the site administrator</b><br> - dev: see console.</p>");
//throw some debugging at the console to report what didn't load.
		for(var i = 0; i < L; i += 1)	{
			if(acBaseScripts[i].pass == 1)	{
				acDump(" -> "+acBaseScripts[i].location+": "+acBaseScripts[i].validator());
				}
			}
		
		}
	else	{
		setTimeout("acHandleAppInit("+(attempts+1)+")",250);
		}
	}
