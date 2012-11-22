/* **************************************************************

   Copyright 2011 Zoovy, Inc.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.

************************************************************** */

/*
An extension for acquiring and displaying 'lists' of product data.
The functions here are designed to work with 'reasonable' size lists of product.
There are instances where a list may get looped through more than once to display the product. if several hundred product are present, it will get slow.
that being said, it's written to take a list of several hundred and break it into multiple pages. This makes for a better user experience.
currently, sorting is not available as part of the multipage header. ###
*/


var store_prodlist = function() {
	var r = {
	vars : {
		forgetmeContainer : {} //used to store an object of pids (key) for items that don't show in the prodlist. value can be app specific. TS makes sense.
		},

					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



	calls : {

/*
appProductGet includes all general product attributes (name, desc, base_price, etc)
the buildProdlist has a need for more advanced queries. appProductGet is for 'quick' lists where only basic info is needed.
getDetailedProduct supports variations, inventory and reviews.
more info may be passed in via obj, but only the pid is needed (so far).
the other info is passed in to keep the csv loop in getProductDataForList fairly tight.

datapointer must be set in the init because it needs to be passed into the callback, which may get executed without ever going in to dispatch() if the data is local
This also overrides the datapointer, if set. This is for consistency's sake.
The advantage of saving the data in memory and local storage is lost if the datapointer isn't consistent, especially for product data.

//formerly getProduct
*/
		appProductGet : {
			init : function(obj,tagObj,Q)	{
				var r = 0; //will return # of requests, if any. if zero is returned, all data needed was in local.
				var pid = obj.pid
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj["datapointer"] = "appProductGet|"+pid; 
//fetchData checks the timestamp, so no need to doublecheck it here unless there's a need to make sure it is newer than what is specified (1 day) in the fetchData function				
				if(app.model.fetchData('appProductGet|'+pid) == false)	{
					r = 2;
					this.dispatch(pid,tagObj,Q);
					}
				else	{
					app.u.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(pid,tagObj,Q)	{
				var obj = {};
				obj["_cmd"] = "appProductGet";
				obj["pid"] = pid;
				obj["_tag"] = tagObj;
				app.model.addDispatchToQ(obj,Q);
				}
			}, //appProductGet

//allows for acquiring inventory, variations and or reviews. set withVariations="1" or withInventory="1" or withReviews="1"
//set pid=pid in obj
		getDetailedProduct : {
			init : function(obj,tagObj,Q)	{
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
//				app.u.dump("BEGIN app.ext.store_product.calls.appProductGet");
//				app.u.dump(" -> PID: "+obj.pid);
//				app.u.dump(" -> obj['withReviews']: "+obj['withReviews']);
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj["datapointer"] = "appProductGet|"+obj.pid; 

//fetchData checks the timestamp, so no need to doublecheck it here unless there's a need to make sure it is newer than what is specified (1 day) in the fetchData function				
				if(app.model.fetchData(tagObj.datapointer) == false)	{
//					app.u.dump(" -> appProductGet not in memory or local. refresh both.");
					r += 1;
					}
				else if(obj['withInventory'] && typeof app.data[tagObj.datapointer]['@inventory'] == 'undefined')	{
					r += 1;
					}
				else if(obj['withVariations'] && typeof app.data[tagObj.datapointer]['@variations'] == 'undefined')	{
					r += 1;
					
					}
//  && app.model.addDispatchToQ(obj,Q) -> not sure why this was here.
				if(obj['withReviews'])	{
//callback will b on appProductGet, but make sure this request is first so that when callback is executed, this is already in memory.
					r += app.ext.store_prodlist.calls.appReviewsList.init(obj.pid,{},Q);
					}
					
//To ensure accurate data, if inventory or variations are desired, data is requested.
//r will be greater than zero if product record not already in local or memory
				if(r == 0) 	{
					app.u.handleCallback(tagObj)
					}
				else	{
					this.dispatch(obj,tagObj,Q)
					}

				return r;
				},
			dispatch : function(obj,tagObj,Q)	{
				obj["_cmd"] = "appProductGet";
				obj["_tag"] = tagObj;
				app.model.addDispatchToQ(obj,Q);
				}
			}, //appProductGet

		

//formerly getReviews
		appReviewsList : {
			init : function(pid,tagObj,Q)	{
				var r = 0; //will return a 1 or a 0 based on whether the item is in local storage or not, respectively.

				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
				tagObj["datapointer"] = "appReviewsList|"+pid;

				if(app.model.fetchData('appReviewsList|'+pid) == false)	{
					r = 1;
					this.dispatch(pid,tagObj,Q)
					}
				else	{
					app.u.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(pid,tagObj,Q)	{
				app.model.addDispatchToQ({"_cmd":"appReviewsList","pid":pid,"_tag" : tagObj},Q);	
				}
			}//appReviewsList

		}, //calls









					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\









	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
		init : {
			onSuccess : function()	{
//				app.u.dump('BEGIN app.ext.store_prodlist.init.onSuccess ');
				return true;  //currently, there are no config or extension dependencies, so just return true. may change later.
//				app.u.dump('END app.ext.store_prodlist.init.onSuccess');
				},
			onError : function()	{
				app.u.dump('BEGIN app.ext.store_prodlist.callbacks.init.onError');
				}
			},
/*
A special translate template for product so that reviews can be merged into the data passed into the template rendering engine.
*/
		translateTemplate : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN app.ext.store_prodlist.callbacks.translateTemplate.onSuccess");
//				app.u.dump(tagObj);
//				app.u.dump(" -> tagObj.datapointer = "+tagObj.datapointer);
//				app.u.dump(" -> tagObj.parentID = "+tagObj.parentID+" and $(#"+tagObj.parentID+").length: "+$('#'+tagObj.parentID).length);
				var tmp = app.data[tagObj.datapointer];
				var pid = app.data[tagObj.datapointer].pid;
//				app.u.dump(" -> typeof app.data['appReviewsList|'+pid]:"+ typeof app.data['appReviewsList|'+pid]);
				if(typeof app.data['appReviewsList|'+pid] == 'object'  && app.data['appReviewsList|'+pid]['@reviews'].length)	{
//					app.u.dump(" -> Item ["+pid+"] has "+app.data['appReviewsList|'+pid]['@reviews'].length+" review(s)");
					tmp['reviews'] = app.ext.store_prodlist.u.summarizeReviews(pid); //generates a summary object (total, average)
					tmp['reviews']['@reviews'] = app.data['appReviewsList|'+pid]['@reviews']
					}
				app.renderFunctions.translateTemplate(app.data[tagObj.datapointer],tagObj.parentID);
				},
//error needs to clear parent or we end up with orphans (especially in UI finder).
			onError : function(responseData,uuid)	{
				responseData.persistant = true; //throwMessage will NOT hide error. better for these to be pervasive to keep merchant fixing broken things.
				var $parent = $('#'+responseData['_rtag'].parentID)
				$parent.empty().removeClass('loadingBG');
				app.u.throwMessage(responseData,uuid);
//for UI prod finder. if admin session, adds a 'remove' button so merchant can easily take missing items from list.
// ### !!! NOTE - upgrade this to proper admin verify (function)
				if(app.sessionId && app.sessionId.indexOf('**') === 0)	{
					$('.ui-state-error',$parent).append("<button class='ui-state-default ui-corner-all'  onClick='app.ext.admin.u.removePidFromFinder($(this).closest(\"[data-pid]\"));'>Remove "+responseData.pid+"<\/button>");
					}
				}
			},

//put an array of sku's into memory for quick access. This array is what is used in filterProdlist to remove items from the forgetme list.
		handleForgetmeList : {
			onSuccess : function(tagObj)	{
				var L = app.data['getCustomerList|forgetme']['@forgetme'].length
				app.ext.store_prodlist.vars.forgetmeContainer.csv = []; //reset list.
				for(var i = 0; i < L; i += 1)	{
					app.ext.store_prodlist.vars.forgetmeContainer.csv.push(app.data['getCustomerList|forgetme']['@forgetme'][i].SKU)
					}
				}
			}

		}, //callbacks







						////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





	renderFormats : {
			
//a product list needs an ID for multipage to work right. will assign a random one if none is set.
//that parent ID is prepended to the sku and used in the list item id to decrease likelyhood of duplicate id's
//data.bindData will get passed into getProdlistVar and used for defaults on the list itself. That means any var supported in prodlistVars can be set in bindData.

			productList : function($tag,data)	{
//				app.u.dump("BEGIN store_prodlist.renderFormats.productList");
//				app.u.dump(" -> data.bindData: "); app.u.dump(data.bindData);
				if(app.u.isSet(data.value))	{
					data.bindData.csv = data.value;
					app.ext.store_prodlist.u.buildProductList(data.bindData,$tag);
					}
				},//prodlist		
			
			mpPagesAsListItems : function($tag,data)	{
//				app.u.dump('BEGIN app.ext.store_prodlist.renderFormats.mpPagesAsListItems');
				var o = '';
				for(var i = 1; i <= data.value; i += 1)	{
					o += "<li class='mpControlJumpToPage' data-page='"+i+"'><span>page: "+i+"<\/span><\/li>"; //data-page is used for MP 'jumping'. don't use index or .text because order and text could get changed.
					}
				$tag.append(o);		
				},
/*
in a prodlist, you may want to substitute a 'add to cart' button for a 'view details' or 'choose options' if the product has variations.
if variations havne't been loaded for the sku, defualt to the non add to cart option. safer to direct to a detail page with no options than
to have an add to cart button that errors out because options weren't selected.
will remove the add to cart button if the item is not purchaseable.

# - SANITY -> remember that the 'parent' container on the button should NOT have an onclick event or both events will trigger.

*/

			addToCartButton : function($tag,data)	{
//				app.u.dump("BEGIN store_product.renderFunctions.addToCartButton");
//				app.u.dump(" -> ID before any manipulation: "+$tag.attr('id'));
				var pid = data.value;
				var showATC = true;

// add _pid to end of atc button to make sure it has a unique id.
// add a success message div to be output before the button so that messaging can be added to it.
// atcButton class is added as well, so that the addToCart call can disable and re-enable the buttons.
				$tag.attr('id',$tag.attr('id')+'_'+pid).addClass('atcButton').before("<div class='atcSuccessMessage' id='atcMessaging_"+pid+"'><\/div>"); 
				if(app.ext.store_product.u.productIsPurchaseable(pid))	{
//product is purchaseable. make sure button is visible and enabled.
					$tag.show().removeClass('displayNone').removeAttr('disabled');
					if(typeof app.data['appProductGet|'+pid]['@variations'] == 'undefined')	{showATC = false}
					else if(!$.isEmptyObject(app.data['appProductGet|'+pid]['@variations'])){showATC = false}					

/*
when the template is initially created (using createInstance and then translate template
the button gets generated, then updated. This may result in multiple events being added.
so the atc events are unbinded, then binded.
*/

					if(showATC)	{
//						app.u.dump(" -> is add to cart.");
						$tag.addClass('addToCartButton').unbind('.myATCEvent').bind('click.myATCEvent',function(event){
//						app.u.dump("BUTTON pushed. $(this).parent().attr('id') = "+$(this).parent().attr('id'));
						$(this).parent().submit();
						event.preventDefault();
						}).text('Add To Cart')
						}
					else	{
//						app.u.dump(" -> is choose options.");
						$tag.addClass('chooseOptionsButton').unbind('.myATCEvent').bind('click.myATCEvent',function(event){
event.preventDefault();
// !!! TEMPORARY!!! this needs to be handled better. a function needs to be passed in or something.
//move into the custom app. 
app.ext.myRIA.u.handlePageContent('product',pid)
					}).text('Choose Options')}
					
					}
				else	{
					$tag.replaceWith("<span class='notAvailable'>not available</span>");
					}
//				app.u.dump(" -> ID at end: "+$tag.attr('id'));
				} //addToCartButton
			},





////////////////////////////////////   						util [u]			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





		u : {


/*
Execute this prior to working with a prodlist.
returns an object to be added to the $tag via data().
if the csv for a list is manipulated (items permanently removed), reExecute this.

Param Object:

items_per_page = int. The highest number of items to show per page. setting to 20 in a csv of 50 items generates 3 pages.

page = int (the page in focus. defaults to 1). page 1 = 1. page 2 = 2.

loadsTemplate = id of template to be used for each product.

csv = This should be a 'treated' array. Any removing of pids or conversion from string should be done before you get here.

will return false if required params are not passed (csv and loadsTemplate).

the object created here is passed as 'data' into the mulitpage template. that's why the vars are not camelCase, to be more consistent with attributes.

*/

			setProdlistVars : function(obj)	{
//				app.u.dump("BEGIN store_prodlist.u.setProdlistVars");
//				app.u.dump(obj);
				var r = false;
				var hideMultipageControls = false; //if set to true, will hide just the dropdown/page controls.
				
//can't build a prodlist without product.				
				if(obj.csv && typeof obj.csv == 'object' && obj.csv.length > 0 && obj.loadsTemplate)	{

					var L = obj.csv.length;

//okay, now lets set up some defaults if none were passed and normalize the data.
					obj.items_per_page = (Number(obj.items_per_page)) ? Number(obj.items_per_page) : 25; //the number of items per page before going to multipage (if enabled)
					obj.page_in_focus = (Number(obj.page_in_focus)) ? Number(obj.page_in_focus) : 1; //in a multipage format, which page is in focus.
					obj.hide_summary = (obj.hide_summary) ? true : false;
					obj.hide_pagination = this.mpControlsShouldBeHidden(obj);
					obj.withInventory = (obj.withInventory) ? 1 : 0;
					obj.withVariations = (obj.withVariations) ? 1 : 0;
					obj.withReviews = (obj.withReviews) ? 1 : 0;
					obj.parentID = obj.parentID || 'pl_'+app.u.guidGenerator().substring(0,12); //gotta have an ID. really really wants a unique id.
					
					var firstProductOnPage = (obj.page_in_focus-1)*obj.items_per_page; //subtract 1 from page so that we start at the zero point in the array.
					var lastProductOnPage = firstProductOnPage + obj.items_per_page; //last spot in csv for this page.
					lastProductOnPage = lastProductOnPage > L ? L : lastProductOnPage; //lastProductOnPage shouldn't be greater than the total number of product


//allows for just the mp controls to be turned off but will leave the rest of the header (summary, etc) enabled.
					if(obj.hide_summary == true){obj.hide_pagination = true;}
					else if(obj.items_per_page >= L || obj.hide_pagination)	{obj.hide_pagination = true;}
					
					obj.page_start_point = firstProductOnPage + 1; //what # in the list of product this 'page' starts on. +1 for customer-facing. (so it doesn't say items 0 - 29)
					obj.page_end_point = lastProductOnPage;
					obj.page_product_count = lastProductOnPage - firstProductOnPage; //# of items on this page. (there was duplicate of this for: items_on_this_page)
					obj.total_product_count = L; //total # of items in this list.
					obj.total_page_count = Math.ceil(L/obj.items_per_page) //total # of pages for this list.
					
					r = obj;

					}
				else{
					app.u.dump(" -> Missing some required fields for setProdlistVars"); app.u.dump(obj);
					r = false;
					}
				return r;
				}, //setProdlistVars



			mpControlsShouldBeHidden : function(obj){
				var r = false;
				if(obj.hide_pagination){r = true}
				else if(obj.hide_summary){r = true}
				else if(obj.items_per_page > obj.csv.length){r = true}
				else{} //catch
				return r;
				},


//A product attribute for a list of items is stored as a string, not an array. (ex: products_related).
//run the attribute through this function and it'll be translated into an array and have all blanks removed.
// a category product list is already an array.
//formerly: handleAttributeProductList
			cleanUpProductList : function(csv)	{
				if(typeof csv == 'string')	{
					csv = csv.split(',');
					}
//				app.u.dump(" -> typeof csv: "+typeof csv);
				csv = $.grep(csv,function(n){return(n);}); //remove blanks. commonly occurs in product attributes cuz of extra comma
				return csv;
				},

//plObj is the product list object (what is returned from setProdlistVars).
			getProdlistPlaceholders : function(plObj)	{
				var $r = $("<ul>"); //The children of this are what is returned.
				if(plObj && plObj.csv)	{
					var pageCSV = this.getSkusForThisPage(plObj);
					var L = pageCSV.length;
					for(var i = 0; i < L; i += 1)	{
						$r.append(app.renderFunctions.createTemplateInstance(plObj.loadsTemplate,{"id":this.getSkuSafeIdForList(plObj.parentID,pageCSV[i]),"pid":pageCSV[i]})); //create a 'place' for this product in the list.
						}
					}
				return $r.children();
				},
				
//builds the safeID for the container of a product. unique per list/sku
			getSkuSafeIdForList : function(parentID,sku)	{
				return parentID+"_"+app.u.makeSafeHTMLId(sku);
				},

/*
this will go get ALL product in the csv passed (if not in memory or local already).
any trimming to keep request size down should be done outside this function.

If parentID is set, then a tagObj is added to the request to handle the response.
 -> this function is designed around getting product for a product list that will be displayed in the DOM or saved for later.
 -> tagObj is not a passable param for this reason. specific callbacks are used.

if no parentID is set, then this function gets the data into memory for later use.
 -> showContent for a cat page does NOT pass an id because cat pages get all data in memory, then display.
 -> showContent for a product page DOES pass an id because the product data is displayed, then supplemental material (reviews, accessories, etc) is displayed once available.

*/
			getProductDataForList : function(plObj,$tag,Q)	{
//				app.u.dump("BEGIN store_prodlist.u.getProductDataForList ["+plObj.parentID+"]");

				Q = Q || 'mutable';
				var numRequests = 0; //# of requests that will b made. what is returned.
				if(plObj && plObj.csv)	{
//					app.u.dump(" -> csv defined. length: "+plObj.csv.length);
					var pageCSV = this.getSkusForThisPage(plObj);
					var L = pageCSV.length;
					var call = 'appProductGet';  //this call is used unless variations or inventory are needed. this call is 'light' and just gets basic info.
					if(Number(plObj.withVariations) + Number(plObj.withInventory) + Number(plObj.withReviews) > 0)	{
						call = 'getDetailedProduct'
						}

					for(var i = 0; i < L; i += 1)	{
//						app.u.dump("rendering");
						numRequests += app.ext.store_prodlist.calls[call].init({
							"pid":pageCSV[i],
							"withVariations":plObj.withVariations,
							"withReviews":plObj.withReviews,
							"withInventory":plObj.withInventory
							}, plObj.parentID ? {'callback':'translateTemplate','extension':'store_prodlist','parentID':this.getSkuSafeIdForList(plObj.parentID,pageCSV[i])} : {});  //tagObj not passed if parentID not set. 
						}
					}
				if(numRequests > 0)	{app.model.dispatchThis()}
				return numRequests;
				}, //getProductDataForList


			getSkusForThisPage : function(obj)	{
				var csv = new Array(); //what is returned.
				if(obj.items_per_page > obj.csv.length)	{
					csv = obj.csv;
					}
				else	{
					csv = obj.csv.slice(obj.page_start_point - 1,obj.page_end_point);
					}
				return csv;
				},

/*
This is the function that gets executed to build a product list.
obj is most likely the databind object. It can be any params set in setProdlistVars.
params that are missing will be auto-generated.
*/
			buildProductList : function(obj,$tag)	{
//				app.u.dump("BEGIN store_prodlist.u.buildProductList()");
//				app.u.dump(" -> obj: "); app.u.dump(obj);

//Need either the tag itself ($tag) or the parent id to build a list. recommend $tag to ensure unique parent id is created
//also need a list of product (csv)
				if(($tag || (obj && obj.parentID)) && obj.csv)	{
//					app.u.dump(" -> required parameters exist. Proceed...");
					obj.csv = app.ext.store_prodlist.u.cleanUpProductList(obj.csv); //strip blanks and make sure this is an array. prod attributes are not, by default.
					
					var plObj = this.setProdlistVars(obj); //full prodlist object now.

//need a jquery obj. to work with.
					if($tag)	{$tag.attr('id',plObj.parentID);}
					else	{$tag = $('#'+plObj.parentID);}
//a wrapper around all the prodlist content is created just one. Used in multipage to clear old multipage content. This allows for multiple multi-page prodlists on one page. Hey. it could happen.
					if($('#'+plObj.parentID+'_container').length == 0)	{$tag.wrap("<div id='"+plObj.parentID+"_container' />")}
//adds all the placeholders. must happen before getProductDataForList so individual product translation can occur.
//can't just transmogrify beccause sequence is important and if some data is local and some isn't, order will get messed up.
					$tag.append(this.getProdlistPlaceholders(plObj)).removeClass('loadingBG');
					$tag.data('prodlist',plObj); //sets data object on parent

					if(!obj.hide_summary)	{
						$tag.before(this.showProdlistSummary(plObj,'header')); //multipage Header
						$tag.after(this.showProdlistSummary(plObj,'footer')); //multipage Footer
						}
//The timeout was here because of an issue where the placeholders were getting nuked. That issue was caused by translateTemplate doing a replace.
//that code was changed in 201239 (as was this function) so the timeout was commented out. This comment is here in case the change to translateFunction is changed back.
//					setTimeout(function(){
						app.ext.store_prodlist.u.getProductDataForList(plObj,$tag,'mutable');
//						},1000);
					 //will render individual product, if data already present or fetch data and render as part of response.

					}
				else	{
					app.u.throwGMessage("WARNING: store_prodlist.u.buildProductList is missing some required fields. Obj follows: ");
					app.u.dump(obj);
					}
//				app.u.dump(" -> r = "+r);
				}, //buildProductList

/*
This is executed when the page is changed in a prodlist.
initially, this was how product lists were handled, the the productList renderFormat was introduced.
need to remove duplicate code from this and the renderFormat. ###
*/
/*
			handleProductList : function(parentID)	{
				var r = 0; //returns the number of requests.
//				app.u.dump("BEGIN app.ext.store_prodlist.u.handleProductList");
//				app.u.dump(" -> parent = "+parentID);
				var $parent = $('#'+parentID).empty(); 
				var csvArray = new Array();
				if(app.ext.store_prodlist.vars[parentID].items_per_page >= app.ext.store_prodlist.vars[parentID].csv.length)	{
//					app.u.dump(' -> single page product list');
					csvArray = app.ext.store_prodlist.vars[parentID].csv
					}
				else	{
//in a multipage format, just request the pids of the page in focus.
//					app.u.dump(' -> multi page product list.');
					csvArray = app.ext.store_prodlist.vars[parentID].csv.slice(app.ext.store_prodlist.vars[parentID].page_start_point - 1,app.ext.store_prodlist.vars[parentID].page_end_point);
					if(!app.ext.store_prodlist.vars[parentID].hide_summary)	{
						$('.mpControlContainer').empty().remove();
						$parent.before(app.ext.store_prodlist.u.showMPControls(parentID,'header'));
						$parent.after(app.ext.store_prodlist.u.showMPControls(parentID,'footer'));
						}
					}
//now that we have our prodlist, get the product data and add it to the DOM.
				r = app.ext.store_prodlist.u.getProductDataForList(csvArray,parentID);
				return r;
				},
*/

/*
function is executed both from the next/previous buttons and list of page links.
$pageTag is the jquery object of whatever was clicked. the data to be used is stored in data- tags on the element itself.

*/

			mpJumpToPage : function($pageTag)	{

//				app.u.dump("BEGIN app.ext.store_prodlist.u.mpJumpToPage");
				var targetList = $pageTag.closest('[data-targetlist]').attr('data-targetlist');
				var plObj = $('#'+targetList).data('prodlist');

//figure out what page to show next.
//the multipage controls take care of enabling/disabling next/back buttons to ensure no 'next' appears/is clickable on last page.				
				if($pageTag.attr('data-role') == 'next')	{plObj.page_in_focus += 1}
				else if($pageTag.attr('data-role') == 'previous')	{plObj.page_in_focus -= 1}
				else	{plObj.page_in_focus = $pageTag.attr('data-page')}

				$('.mpControlContainer','#'+plObj.parentID+'_container').empty().remove(); //clear all summary/multipage for this prodlist.
				$('#'+plObj.parentID).empty(); //empty prodlist so new page gets clean data.
				this.buildProductList(plObj);
				},
			
			showProdlistSummary : function(plObj,location){
				location = location ? location : 'header';
				var $output = app.renderFunctions.transmogrify({'id':'mpControl_'+plObj.parentID+'_'+location,'targetList':plObj.parentID},'mpControlSpec',plObj);
				if(plObj.hide_pagination === true)	{
					$output.find('.mpControlsPagination').addClass('displayNone');
					}
				else	{
					$output.find('.mpControlJumpToPage, .paging').click(function(){
						app.ext.store_prodlist.u.mpJumpToPage($(this))
						app.u.jumpToAnchor('mpControl_'+plObj.parentID+'_header');
						})
					$output.find('.paging').each(function(){
						var $this = $(this)
						if($this.attr('data-role') == 'next')	{
							if(plObj.page_in_focus == plObj.total_page_count)	{$this.attr('disabled','disabled').addClass('ui-state-disabled')}
							}
						else if($this.attr('data-role') == 'previous')	{
							if(plObj.page_in_focus == 1)	{$this.attr('disabled','disabled').addClass('ui-state-disabled')}
							}
						});
					}
				return $output;
				},


//will generate some useful review info (total number of reviews, average review, etc ) and put it into appProductGet|PID	
//data saved into appProductGet so that it can be accessed from a product databind. helpful in prodlists where only summaries are needed.
//NOTE - this function is also in store_product. probably ought to merge prodlist and product, as they're sharing more and more.
			summarizeReviews : function(pid)	{
//				app.u.dump("BEGIN store_product.u.summarizeReviews");
				var L = 0;
				var sum = 0;
				var avg = 0;
				if(typeof app.data['appReviewsList|'+pid] == 'undefined' || $.isEmptyObject(app.data['appReviewsList|'+pid]['@reviews']))	{
//item has no reviews or for whatver reason, data isn't available. 
					}
				else	{
					L = app.data['appReviewsList|'+pid]['@reviews'].length;
					for(var i = 0; i < L; i += 1)	{
						sum += Number(app.data['appReviewsList|'+pid]['@reviews'][i].RATING);
						}
					avg = Math.round(sum/L);
					}
				return {"average":avg,"total":L}
				}
			} //util

		
		} //r object.
	return r;
	}