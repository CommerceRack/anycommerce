var app = app || {vars:{},u:{}}; //make sure app exists.
app.rq = app.rq || []; //ensure array is defined. rq = resource queue.
app.cmr = app.cmr || [];


app.rq.push(['extension',0,'admin','extensions/admin/extension.js','initExtension']);
app.rq.push(['extension',0,'admin_prodedit','extensions/admin/product_editor.js']);
app.rq.push(['extension',0,'admin_orders','extensions/admin/orders.js']);
app.rq.push(['extension',0,'admin_sites','extensions/admin/sites.js']);
//app.rq.push(['extension',0,'admin_launchpad','extensions/admin/launchpad.js']); 

//these can be loaded later because none of them are required for a page to load.
//this will change going forward.
app.rq.push(['extension',1,'store_prodlist','extensions/store_prodlist.js']);
app.rq.push(['extension',1,'store_navcats','extensions/store_navcats.js']);
app.rq.push(['extension',1,'store_search','extensions/store_search.js']);
app.rq.push(['extension',1,'store_product','extensions/store_product.js']);



app.rq.push(['extension',0,'cco','extensions/cart_checkout_order.js']);
app.rq.push(['extension',0,'order_create','extensions/checkout/extension.js']);
app.rq.push(['extension',0,'cart_message','extensions/cart_message/extension.js']);

app.rq.push(['extension',0,'admin_support','extensions/admin/support.js']); 
app.rq.push(['extension',0,'admin_tools','extensions/admin/tools.js']); 
app.rq.push(['extension',0,'admin_navcats','extensions/admin/navcats.js']); 
app.rq.push(['extension',0,'admin_task','extensions/admin/task.js']);
app.rq.push(['extension',0,'admin_template','extensions/admin/template_editor.js']); 
app.rq.push(['extension',0,'admin_marketplace','extensions/admin/marketplace.js']); //needs to be in pass 0 for linkFrom (links from marketplaces)
 
app.rq.push(['extension',0,'admin_config','extensions/admin/config.js']);
app.rq.push(['extension',0,'admin_reports','extensions/admin/reports.js']);
app.rq.push(['extension',0,'admin_batchjob','extensions/admin/batchjob.js']);
app.rq.push(['extension',0,'admin_customer','extensions/admin/customer.js']);
app.rq.push(['extension',0,'admin_wholesale','extensions/admin/wholesale.js']);
app.rq.push(['extension',0,'admin_user','extensions/admin/user.js']);
app.rq.push(['extension',0,'admin_medialib','extensions/admin/medialib.js']); //do NOT set to zero. causes a script issue.
app.rq.push(['extension',0,'admin_trainer','extensions/admin/trainer.js']); //load in pass 0 for local testing.


app.rq.push(['extension',0,'tools_animation','extensions/tools_animation.js', function(){
	$('.mhTabsContainer [data-animation]').each(function(){
		var args = $(this).attr('data-animation');	
		var anim = args.split('?')[0];
		var params = app.u.kvp2Array(args.split('?')[1]);
		app.ext.tools_animation.u.loadAnim($(this),anim,params);
		});
	}]);

//required for init. don't change from 0.
app.rq.push(['script',0,app.vars.baseURL+'model.js']); //'validator':function(){return (typeof zModel == 'function') ? true : false;}}
app.rq.push(['script',0,app.vars.baseURL+'includes.js']); //','validator':function(){return (typeof handlePogs == 'function') ? true : false;}})
app.rq.push(['script',0,app.vars.baseURL+'controller.js']);




app.rq.push(['script',1,app.vars.baseURL+'resources/jquery.ui.jeditable.js']); //used for making text editable (customer address). non-essential. loaded late. used in orders.
app.rq.push(['script',0,app.vars.baseURL+'app-admin/resources/highcharts-3.0.1/highcharts.js']); //used for KPI

app.rq.push(['script',0,app.vars.baseURL+'resources/crypto-md5-2.5.3.js']); //used for authentication and in various other places.

//have showLoading as early as possible. pretty handy feature. used everywhere.
app.rq.push(['script',0,app.vars.baseURL+'resources/jquery.showloading-v1.0.jt.js']);

//these are resources that are not currently used.
//app.rq.push(['script',0,app.vars.baseURL+'resources/jquery.mousewheel-3.0.6.min.js']);//used in the launchpad. needed early.
//app.rq.push(['script',1,app.vars.baseURL+'resources/jquery.fullscreen-1.2.js']); //used in template editor. will likely get used more.

//used in campaigns. probably get used more. allows for time selection in datepicker.
app.rq.push(['css',1,app.vars.baseURL+'resources/jquery-ui-timepicker-addon.css']);
app.rq.push(['script',1,app.vars.baseURL+'resources/jquery-ui-timepicker-addon.js']);

// required for building/restoring ebay item specifics from @RECOMMENDATIONS list + 'ebay:itemspecifics'
app.rq.push(['script',1,app.vars.baseURL+'app-admin/resources/jquery.ebay-specifics-form.js']);

//anycommerce plugins, such as anycontent, anytable, anycb, etc.
app.rq.push(['script',0,app.vars.baseURL+'resources/jquery.ui.anyplugins.js']);
app.rq.push(['css',1,app.vars.baseURL+'resources/anyplugins.css']);


app.rq.push(['script',0,app.vars.baseURL+'resources/jquery.ui.qrcode-0.7.0.js']);


// jQuery-contextMenu - http://medialize.github.com/jQuery-contextMenu/  used in orders.
app.rq.push(['css',1,app.vars.baseURL+'app-admin/resources/jquery.contextMenu.css']);
app.rq.push(['script',0,app.vars.baseURL+'app-admin/resources/jquery.contextMenu.js']); //must be in first pass in case orders is the landing page.
app.rq.push(['script',1,app.vars.baseURL+'app-admin/resources/jquery.ui.position.js']);


//used for image enlargement in template chooser (in syndication but suspect it will be in email, newsletter, app, etc soon enough)
app.rq.push(['script',1,app.vars.baseURL+'resources/load-image.min.js']); //in zero pass in case product page is first page.
app.rq.push(['script',1,app.vars.baseURL+'resources/jquery.image-gallery.jt.js']); //in zero pass in case product page is first page.

//app.rq.push(['script',0,app.vars.baseURL+'app-admin/resources/jquery.ui.touch-punch.min.js']);
//app.rq.push(['script',0,app.vars.baseURL+'app-admin/resources/jquery.shapeshift.js']);



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
//		myCreole = new Parse.Simple.Creole();
		
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
	app.cmr.push(["view",function(message,$context){
//		app.u.dump(" -> executing cmr.view");
		var $history = $("[data-app-role='messageHistory']",$context);
		var $o = "<p class='chat_post'><span class='from'>"+message.FROM+"<\/span><span class='view_post'>sent page view:<br \/>";
		if(message.vars && message.vars.pageType)	{
//			app.u.dump(' -> pageType is set to: '+message.vars.pageType);
			switch(message.vars.pageType)	{
				case 'product':
					if(message.vars.pid)	{
						$o += 'product: '+message.vars.pid+' has been added to the product task list.'
						app.ext.admin_prodedit.u.addProductAsTask({'pid':message.vars.pid,'tab':'product','mode':'add'});
						}
					else	{$o += 'Page type set to product but no pid specified.'}
					break;
				case 'homepage':
					$o += 'homepage';
					break;
				case 'category':
					if(message.vars.navcat)	{
						$o += 'category: '+message.vars.navcat;
						if(message.vars.domain)	{$o.addClass('lookLikeLink').on('click',function(){
							window.open(message.vars.domain+"/category/"+message.vars.navcat+"/");
							})}
						}
					else	{$o += 'Page type set to category but no navcat specified.'}
					break;
				
				case 'search':
					if(message.vars.keywords)	{}
					else	{$o += 'Page type set to search but no keywords specified.'}
					break;
				
				case 'company':
					if(message.vars.show)	{}
					else	{$o += 'Page type set to company but show not specified.'}
					break;
				
				case 'customer':
					if(message.vars.show)	{}
					else	{$o += 'Page type set to customer but show not specified.'}
					break;
				
				default:
					$o += 'unknown page type: '+message.vars.pageType+' (console contains more detail)';
					app.u.dump("Unrecognized pageType in cart message.vars. vars follow:"); app.u.dump(message.vars);
				}
			}
		else	{
			$o += 'unspecified page type or no vars set in message. (console contains more detail)';
			app.u.dump("Unspecified pageType in cart message.vars. vars follow:"); app.u.dump(message.vars);
			}
		$o += "</span><\/p>";
		$history.append($o);
		$history.parent().scrollTop($history.height());
		}]);
	app.u.handleRQ(0); //will start loading resources and eventually init the app.
	});


