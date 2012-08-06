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
				if(myControl.model.fetchData('appProductGet|'+pid) == false)	{
					r = 2;
					this.dispatch(pid,tagObj,Q);
					}
				else	{
					myControl.util.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(pid,tagObj,Q)	{
				var obj = {};
				obj["_cmd"] = "appProductGet";
				obj["pid"] = pid;
				obj["_tag"] = tagObj;
				myControl.model.addDispatchToQ(obj,Q);
				}
			}, //appProductGet

//allows for acquiring inventory, variations and or reviews. set withVariations="1" or withInventory="1" or withReviews="1"
//set pid=pid in obj
		getDetailedProduct : {
			init : function(obj,tagObj,Q)	{
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
//				myControl.util.dump("BEGIN myControl.ext.store_product.calls.appProductGet");
//				myControl.util.dump(" -> PID: "+obj.pid);
//				myControl.util.dump(" -> obj['withReviews']: "+obj['withReviews']);
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj["datapointer"] = "appProductGet|"+obj.pid; 

//fetchData checks the timestamp, so no need to doublecheck it here unless there's a need to make sure it is newer than what is specified (1 day) in the fetchData function				
				if(myControl.model.fetchData(tagObj.datapointer) == false)	{
//					myControl.util.dump(" -> appProductGet not in memory or local. refresh both.");
					r += 1;
					}
				else if(obj['withInventory'] && typeof myControl.data[tagObj.datapointer]['@inventory'] == 'undefined')	{
					r += 1;
					}
				else if(obj['withVariations'] && typeof myControl.data[tagObj.datapointer]['@variations'] == 'undefined')	{
					r += 1;
					
					}
//  && myControl.model.addDispatchToQ(obj,Q) -> not sure why this was here.
				if(obj['withReviews'])	{
//callback will b on appProductGet, but make sure this request is first so that when callback is executed, this is already in memory.
					r += myControl.ext.store_prodlist.calls.appReviewsList.init(obj.pid,{},Q);
					}
					
//To ensure accurate data, if inventory or variations are desired, data is requested.
//r will be greater than zero if product record not already in local or memory
				if(r == 0) 	{
					myControl.util.handleCallback(tagObj)
					}
				else	{
					this.dispatch(obj,tagObj,Q)
					}

				return r;
				},
			dispatch : function(obj,tagObj,Q)	{
				obj["_cmd"] = "appProductGet";
				obj["_tag"] = tagObj;
				myControl.model.addDispatchToQ(obj,Q);
				}
			}, //appProductGet

		

//formerly getReviews
		appReviewsList : {
			init : function(pid,tagObj,Q)	{
				var r = 0; //will return a 1 or a 0 based on whether the item is in local storage or not, respectively.

				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
				tagObj["datapointer"] = "appReviewsList|"+pid;

				if(myControl.model.fetchData('appReviewsList|'+pid) == false)	{
					r = 1;
					this.dispatch(pid,tagObj,Q)
					}
				else	{
					myControl.util.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(pid,tagObj,Q)	{
				myControl.model.addDispatchToQ({"_cmd":"appReviewsList","pid":pid,"_tag" : tagObj},Q);	
				}
			}//appReviewsList

		}, //calls









					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\









	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
		init : {
			onSuccess : function()	{
//				myControl.util.dump('BEGIN myControl.ext.store_prodlist.init.onSuccess ');
				return true;  //currently, there are no config or extension dependencies, so just return true. may change later.
//				myControl.util.dump('END myControl.ext.store_prodlist.init.onSuccess');
				},
			onError : function()	{
				myControl.util.dump('BEGIN myControl.ext.store_prodlist.callbacks.init.onError');
				}
			},

		translateTemplate : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN myControl.ext.store_prodlist.callbacks.translateTemplate.onSuccess");
//				myControl.util.dump(tagObj);
//				myControl.util.dump(" -> tagObj.datapointer = "+tagObj.datapointer);
//				myControl.util.dump(" -> tagObj.parentID = "+tagObj.parentID);
				var tmp = myControl.data[tagObj.datapointer];
				var pid = myControl.data[tagObj.datapointer].pid;
				if(typeof myControl.data['appReviewsList|'+pid] == 'object')	{
					tmp['reviews'] = myControl.ext.store_prodlist.util.summarizeReviews(pid); //generates a summary object (total, average)
					tmp['reviews']['@reviews'] = myControl.data['appReviewsList|'+pid]['@reviews']
					}
				myControl.renderFunctions.translateTemplate(myControl.data[tagObj.datapointer],tagObj.parentID);
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},
//put an array of sku's into memory for quick access. This array is what is used in filterProdlist to remove items from the forgetme list.
		handleForgetmeList : {
			onSuccess : function(tagObj)	{
				var L = myControl.data['getCustomerList|forgetme']['@forgetme'].length
				myControl.ext.store_prodlist.vars.forgetmeContainer.csv = []; //reset list.
				for(i = 0; i < L; i += 1)	{
					myControl.ext.store_prodlist.vars.forgetmeContainer.csv.push(myControl.data['getCustomerList|forgetme']['@forgetme'][i].SKU)
					}
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			}

		}, //callbacks







						////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





	renderFormats : {
			
//a product list needs an ID for multipage to work right. will assign a random one if none is set.
//that parent ID is prepended to the sku and used in the list item id to decrease likelyhood of duplicate id's
			productList : function($tag,data)	{
//				myControl.util.dump("BEGIN store_prodlist.renderFormats.productList");
				var csv = data.value;
				if(typeof csv == 'string')	{
					csv = csv.split(',');
					}

				if(csv.length > 0)	{

//					myControl.util.dump(data);
var parentListID = $tag.attr('id');
//a product list REALLY wants an ID.
if(!myControl.util.isSet(parentListID))	{
	parentListID = 'prodlist_'+myControl.util.makeSafeHTMLId(data.bindData['var']); 
	$tag.attr('id',parentListID);
	}

var itemsPerPage = data.bindData.items_per_page ? data.bindData.items_per_page : 15;
var L = csv.length;
if(L > itemsPerPage)	{ L = itemsPerPage } //only show as many product as are in this page.
//				myControl.util.dump("itemsPerPage: "+itemsPerPage+"; L:"+L);


//creates an object in myControl.ext.store_prodlist.vars such as items per page, # pages, etc.
myControl.ext.store_prodlist.util.setProdlistVars({
	'parentID':parentListID,
	'csv':csv,
	'items_per_page':itemsPerPage,
	'templateID':data.bindData.loadsTemplate,
	'withVariations':data.bindData.withVariations,
	'withInventory':data.bindData.withInventory
	})
					
var pid; //used as a shortcut in the loop below to store the pid during each iteration.
for(var i = 0; i < L; i += 1)	{
	pid = csv[i];
//	myControl.util.dump(" -> PID: "+pid);
	$tag.append(myControl.renderFunctions.transmogrify({'id':parentListID+'_'+pid,'pid':pid},data.bindData.loadsTemplate,myControl.data['appProductGet|'+pid]));
	}

if(!data.bindData.hide_multipage)	{
	$('.mpControlContainer').empty().remove();
	$tag.before(myControl.ext.store_prodlist.util.showMPControls(parentListID,'header'));
	$tag.after(myControl.ext.store_prodlist.util.showMPControls(parentListID,'footer'));
	}

					}
				},//prodlist	
			
// NOT DONE!!!			
			reviewSummary : function($tag,data){
				var rObj = myControl.data['appReviewsList|'+data.value]['@reviews'];
				var L = rObj.length; //number of reviews.
				var templateID = data.bindData.loadsTemplate; //what template to use.
//				var reviewSummary = myControl.ext.store_product.util.summarizeReviews(tagObj.pid);
				},
			
			
			mpPagesAsListItems : function($tag,data)	{
//				myControl.util.dump('BEGIN myControl.ext.store_prodlist.renderFormats.mpPagesAsListItems');
				var o = '';
				for(i = 1; i <= data.value; i += 1)	{
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
//				myControl.util.dump("BEGIN store_product.renderFunctions.addToCartButton");
//				myControl.util.dump(" -> ID before any manipulation: "+$tag.attr('id'));
				var pid = data.value;
				var showATC = true;

// add _pid to end of atc button to make sure it has a unique id.
// add a success message div to be output before the button so that messaging can be added to it.
// atcButton class is added as well, so that the addToCart call can disable and re-enable the buttons.
				$tag.attr('id',$tag.attr('id')+'_'+pid).addClass('atcButton').before("<div class='atcSuccessMessage' id='atcMessaging_"+pid+"'><\/div>"); 
				if(myControl.ext.store_product.util.productIsPurchaseable(pid))	{
//product is purchaseable. make sure button is visible and enabled.
					$tag.show().removeClass('displayNone').removeAttr('disabled');
					if(typeof myControl.data['appProductGet|'+pid]['@variations'] == 'undefined')	{showATC = false}
					else if(!$.isEmptyObject(myControl.data['appProductGet|'+pid]['@variations'])){showATC = false}					

/*
when the template is initially created (using createInstance and then translate template
the button gets generated, then updated. This may result in multiple events being added.
so the atc events are unbinded, then binded.
*/

					if(showATC)	{
//						myControl.util.dump(" -> is add to cart.");
						$tag.addClass('addToCartButton').unbind('.myATCEvent').bind('click.myATCEvent',function(event){
//						myControl.util.dump("BUTTON pushed. $(this).parent().attr('id') = "+$(this).parent().attr('id'));
						$(this).parent().submit();
						event.preventDefault();
						}).text('Add To Cart')
						}
					else	{
//						myControl.util.dump(" -> is choose options.");
						$tag.addClass('chooseOptionsButton').unbind('.myATCEvent').bind('click.myATCEvent',function(event){
event.preventDefault();
// !!! TEMPORARY!!! this needs to be handled better. a function needs to be passed in or something.
//move into the custom app. 
myControl.ext.myRIA.util.handlePageContent('product',pid)
					}).text('Choose Options')}
					
					}
				else	{
					$tag.replaceWith("<span class='notAvailable'>not available</span>");
					}
//				myControl.util.dump(" -> ID at end: "+$tag.attr('id'));
				} //addToCartButton
			},





////////////////////////////////////   						utilities			    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





		util : {
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
			getProductDataForList : function(csv,parentID,Q)	{
//				myControl.util.dump("BEGIN myControl.ext.store_prodlist.util.getProductDataForList ["+parentID+"]");
//				myControl.util.dump("csv = "+csv);

				if(parentID)	{
//					myControl.util.dump(" -> parentID: "+parentID);
//very soon, we'll be throwing placeholders w/ loading gfx onto the screen. Clean up the big loading gfx cuz it looks silly when both are shown.
					var $parent = $('#'+parentID).removeClass('loadingBG'); //do not empty here. may contain MP controls by this point.
					$('#mainContentArea').removeClass('loadingBG');
					}
				if(!Q){Q = 'mutable'}
				var numRequests = 0; //# of product in local/memory. not strictly necessary, but used for testing.
				var L = csv.length;
				var plObj = myControl.ext.store_prodlist.vars[parentID] ? myControl.ext.store_prodlist.vars[parentID] : {}; //prodlist Obj.
				var call = 'appProductGet';  //this call is used unless variations or inventory are needed. this call is 'light' and just gets basic info.
				if(Number(plObj.withVariations) + Number(plObj.withInventory) + Number(plObj.withReviews) > 0)	{
					call = 'getDetailedProduct'
					}
					
//				myControl.util.dump(' -> # of product: '+L);
//				myControl.util.dump(' -> call: = '+call);
//				myControl.util.dump(' -> plObj.withVariations: = '+plObj.withVariations);
//				myControl.util.dump(' -> plObj.withInventory: = '+plObj.withInventory);
//				myControl.util.dump(' -> plObj.withReviews: = '+plObj.withReviews);
				for(var i = 0; i < L; i += 1)	{
					if(parentID)	{
						$parent.append(myControl.renderFunctions.createTemplateInstance(plObj.templateID,{"id":parentID+"_"+csv[i],"pid":csv[i]})); //create a 'place' for this product in the list.
						}
					numRequests += myControl.ext.store_prodlist.calls[call].init({"pid":csv[i],
"withVariations":plObj.withVariations,
"withReviews":plObj.withReviews,
"withInventory":plObj.withInventory}, parentID ? {'callback':'translateTemplate','extension':'store_prodlist','parentID':parentID+"_"+csv[i]} : {});  //tagObj not passed if parentID not set. 
					}

//				myControl.util.dump(' -> # of product in memory/local = '+sum);
				return numRequests;
				}, //getProductDataForList
			
//A product attribute for a list of items is stored as a string, not an array. (ex: products_related).
//run the attribute through this function and it'll be translated into an array and have all blanks removed.
// a category product list is already an array.
			handleAttributeProductList : function(csv)	{
				if(typeof csv == 'string')	{
					csv = csv.split(',');
					}
				csv = $.grep(csv,function(n){return(n);}); //remove blanks. commonly occurs in product attributes cuz of extra comma
				return csv;
				},

/*
will remove all 'undefined' items from csvArray.
will also remove any items that are in the 'forgetme' list in store_prodlist.vars.forgetme
returns the array.  To get a count of how many items were removed, do a .length on the 
array both before and after and subtract the difference.
*/

			filterProdlist : function(csvArray)	{
//				myControl.util.dump("BEGIN store_prodlist.util.filterProdlist");
				var L = csvArray.length;
				var rArray = new Array(); //used for new array and what is returned.
				for(i = 0; i < L; i +=1)	{
					if(myControl.util.isSet(csvArray[i]) && $.inArray(csvArray[i],myControl.ext.store_prodlist.vars.forgetmeContainer.csv < 0)){
//value is defined (not blank, null or undefined). item is not in forgetme list. removed temporarily cuz of some UI duplicate prod issues.
//						if($.inArray(csvArray[i],rArray) < 0)	{
//item is not already in list (remove duplicates) (inArray returns -1 for no match)
							rArray.push(csvArray[i]);
//							}
						}
					}
//				myControl.util.dump(" -> original length: "+L+" and revised length: "+rArray.length);
				return rArray;
				},

/*
Execute this prior to working with a prodlist. saves a variety of vars to the control for reference.
if the csv for a list is manipulated (items permanently removed), reExecute this.

Param Object:
items_per_page = int. The highest number of items to show per page. setting to 20 in a csv of 50 items generates 3 pages.
parentID = ID of div or other html element where list is added to DOM.
page = int (the page in focus. defaults to 1). page 1 = 1. page 2 = 2.
templateID = id of template to be used.
csv = comma separated list of pids. will support a string or an object.
will return false if required params are not passed (templateID and parentID).

the object created here is passed as 'data' into the mulitpage template. that's why the vars are not camelCase, to be more consistent with attributes.

*/

			setProdlistVars : function(paramObj)	{
//				myControl.util.dump("BEGIN myControl.ext.store_prodlist.util.setProdlistVars");
//				myControl.util.dump(paramObj);
				var r = true;
				var hideMultipageControls = false; //if set to true, will hide just the dropdown/page controls.
//parentID is required so that the prodlistVars can easily be associated with a dom prodlist
				if(paramObj.parentID)	{
					myControl.ext.store_prodlist.vars[paramObj.parentID] = typeof myControl.ext.store_prodlist.vars[paramObj.parentID] === 'object' ? myControl.ext.store_prodlist.vars[paramObj.parentID] : {}; //create object if it doesn't already exist.

					var csvArray = new Array();
//setProdlistVars() saves to ...ext.prodlist_store.var[parentid] and this object passed back in.
					if(typeof paramObj.csv === 'undefined')	{
						r = false;
						myControl.util.dump(" -> attempted to make a product list, but no product received.");
						}
					else	{
						if(typeof paramObj.csv === 'object')	{
							csvArray = paramObj.csv;
							}
//may end up with a string passed in of comma separated values. this is what's actually returned from in @products sometimes.
						else if(typeof paramObj.csv === 'string')	{
							csvArray = paramObj.csv.split(',')
							}
						else	{
							r = false;
							myControl.util.dump(" -> unknown data type for csv. csv type = "+typeof csv+" paramObj.csv type = "+typeof paramObj.csv);
							}
						}
//blanks are removed for navcats in 'model' now.
//					csvArray = $.grep(csvArray,function(n){return(n);}); //removes any blanks.

//					myControl.util.dump(csvArray);
					var L = csvArray.length;
//					myControl.util.dump(" -> setProdlistVars for "+paramObj.parentID+"(L = "+L+")");
//					csvArray = myControl.ext.store_prodlist.util.filterProdlist(csvArray);
					var itemsRemoved = L - csvArray.length;

//if there are no product in the list. stop here.
					if(L == 0)	{
						r = false;
						}
//					myControl.util.dump(" -> setProdlistVars.L = "+L);
//					myControl.util.dump(" -> setProdlistVars.r = "+r);
//					myControl.util.dump(csvArray);

					if(r)	{
						
//if items per page is not passed in or not already set in the vars object in memory, default to showing entire list of product.
						var itemsPerPage;
						if(paramObj.items_per_page)	{itemsPerPage = paramObj.items_per_page}
						else if	(myControl.ext.store_prodlist.vars[paramObj.parentID] && myControl.ext.store_prodlist.vars[paramObj.parentID].items_per_page){itemsPerPage = myControl.ext.store_prodlist.vars[paramObj.parentID].items_per_page}
						else {itemsPerPage = L}
						
//allows for just the mp controls to be turned off, but will leave the rest of the header (sorting, summary, etc) enabled.
// NOTE - initially the check below also checked against the object in memory. this caused issues tho cuz on cat pages it would use the last viewed cat pages data, which
// sometimes caused the controls to be hidden when they were needed.
//  || (myControl.ext.store_prodlist.vars[paramObj.parentID] && myControl.ext.store_prodlist.vars[paramObj.parentID].hide_multipage_controls)
						itemsPerPage = itemsPerPage * 1; //make sure this is treated as an int.
						if(itemsPerPage >= L || paramObj.hide_multipage_controls)	{
							hideMultipageControls = true; 
							}
						
						var page = paramObj.page_in_focus ? paramObj.page_in_focus*1 : 1; //page start at 1. really, the only place we want page 1 to be 0 is when generating startpoint. so for sanity's sake, page 1 = 1.
						var startpoint = (page-1)*itemsPerPage; //subtract 1 from page so that we start at the zero point in the array.
						var endpoint = startpoint + itemsPerPage; //last spot in csv for this page.

						endpoint = endpoint > L ? L : endpoint; //endpoint shouldn't be greater than the total number of product
// for now, this is effectively a whitelist.  probably should 'extend' instead of saving over. ###	
						myControl.ext.store_prodlist.vars[paramObj.parentID] = {
							"csv": csvArray, //original 'full' list of skus as an object.
							"templateID": paramObj.templateID,
							"parentID":paramObj.parentID,
							"hide_multipage":paramObj.hide_multipage ? paramObj.hide_multipage : false,
							"hide_multipage_controls":hideMultipageControls,
							"withInventory": paramObj.withInventory ? paramObj.withInventory : 0,
							"withVariations":paramObj.withVariations ? paramObj.withVariations : 0,
							"withReviews":paramObj.withReviews ? paramObj.withReviews : 0,
							"page_start_point" : startpoint + 1,  //what # in the list of product this 'page' starts on. +1 for customer-facing. (so it doesn't say items 0 - 29).
							"page_end_point" : endpoint, //what # in the csv array this page ends on.
							"page_in_focus" : page, //what page is currently being viewed. defaults to 0 which is page 1.
							"page_product_count" :endpoint - startpoint, //# of items on this page.
							"items_per_page" : itemsPerPage, //would equate to 'size' in old rendering engine. Max number of items to display on a given page before going to multipage.
							"items_on_this_page" : csvArray.slice(startpoint,endpoint).length, //# of items on page in focus. on last page of multipage, may be less that items_per_page
							"items_removed" : itemsRemoved, //# of items removed due to 'forgetme' list.
							"total_product_count" : L, //total # of items in this list.
							"total_page_count" : Math.ceil(L/itemsPerPage) //total # of pages for this list.					
							};
//						myControl.util.dump(myControl.ext.store_prodlist.vars[paramObj.parentID])
						}
					else	{
						myControl.util.dump(" -> Either an issue with the product data or the list is empty.");
						}
					}
				else{
					myControl.util.dump(" -> Missing some required fields for setProdlistVars");
					r = false;
					}
				return r;
				}, //setProdlistVars


/*
The parem object passed into buildProductList is outlined in the setProdlistVars. 
 -> templateID and parentID are required.
Params 'can' include a csv or the csv can be passed in separately. Either is fine, but a csv is required.
 -> this was necessary for multipage formatting.
*/
			buildProductList : function(paramObj)	{
				var r = 0;
//				myControl.util.dump("BEGIN myControl.ext.store_prodlist.util.buildProductList");
//				myControl.util.dump(" -> store_prodlist.util.buildProductList paramObj: "); myControl.util.dump(paramObj);
				if(myControl.ext.store_prodlist.util.setProdlistVars(paramObj))	{
//					myControl.util.dump(" -> required params present. PL object now in memory. show PL.");
					r = myControl.ext.store_prodlist.util.handleProductList(paramObj.parentID);
					}
				else	{
					$('#'+paramObj.parentID).removeClass('loadingBG');
					}
//				myControl.util.dump(" -> r = "+r);
				return r;
				}, //buildProductList

/*
This is executed when the page is changed in a prodlist.
initially, this was how product lists were handled, the the productList renderFormat was introduced.
need to remove duplicate code from this and the renderFormat. ###
*/

			handleProductList : function(parentID)	{
				var r = 0; //returns the number of requests.
//				myControl.util.dump("BEGIN myControl.ext.store_prodlist.util.handleProductList");
//				myControl.util.dump(" -> parent = "+parentID);
				var $parent = $('#'+parentID).empty(); 
				var csvArray = new Array();
				if(myControl.ext.store_prodlist.vars[parentID].items_per_page >= myControl.ext.store_prodlist.vars[parentID].csv.length)	{
//					myControl.util.dump(' -> single page product list');
					csvArray = myControl.ext.store_prodlist.vars[parentID].csv
					}
				else	{
//in a multipage format, just request the pids of the page in focus.
//					myControl.util.dump(' -> multi page product list.');
					csvArray = myControl.ext.store_prodlist.vars[parentID].csv.slice(myControl.ext.store_prodlist.vars[parentID].page_start_point - 1,myControl.ext.store_prodlist.vars[parentID].page_end_point);
					if(!myControl.ext.store_prodlist.vars[parentID].hide_multipage)	{
						$('.mpControlContainer').empty().remove();
						$parent.before(myControl.ext.store_prodlist.util.showMPControls(parentID,'header'));
						$parent.after(myControl.ext.store_prodlist.util.showMPControls(parentID,'footer'));
						}
					}
//now that we have our prodlist, get the product data and add it to the DOM.
				r = myControl.ext.store_prodlist.util.getProductDataForList(csvArray,parentID);
				return r;
				},

			mpJumpToPage : function(parentID,page)	{
//				myControl.util.dump("BEGIN myControl.ext.store_prodlist.util.mpJumpToPage");
//				myControl.util.dump(" -> parentID = "+parentID);
//				myControl.util.dump(" -> page = "+page);

//update the vars object to reflect the new page that will be in focus.
				myControl.ext.store_prodlist.vars[parentID].page_in_focus = page;
//once page is set, setProdlistVars will automatically recompute the start and end points.
				myControl.ext.store_prodlist.util.setProdlistVars(myControl.ext.store_prodlist.vars[parentID]);
				if(myControl.ext.store_prodlist.util.handleProductList(parentID)){myControl.model.dispatchThis()}
//				$('#mpControl_'+parentID).html(this.showMPControls(parentID)); //redo product list header to reflect changes (items 1-25 changes to 2-50)
				},
//the second var is location. header or footer are currently supported.
			showMPControls : function(parentID,location)	{
//				myControl.util.dump("BEGIN store_prodlist.util.showMPControls ["+parentID+"]");
				location = location ? location : 'header';
//				var $parent = $('#'+parentID);
//remove any existing controls. this is important as the controls are re-rendered when 'page' chages and not removing it will cause duplicate controls to appear.
//$output is the multipage header object.  It is what is returned.
				var $output = myControl.renderFunctions.transmogrify({'id':'mpControl_'+parentID+'_'+location},'mpControlSpec',myControl.ext.store_prodlist.vars[parentID]);
				$output.find('.mpControlJumpToPage').click(function(){
					myControl.ext.store_prodlist.util.mpJumpToPage(parentID,$(this).attr('data-page'))
					})

$output.find('.paging').each(function(){
	var $this = $(this)
	if($this.attr('data-role') == 'next')	{
		if(myControl.ext.store_prodlist.vars[parentID].page_in_focus == myControl.ext.store_prodlist.vars[parentID].total_page_count)	{$this.attr('disabled','disabled').addClass('ui-state-disabled')}
		else	{
			$(this).click(function(){myControl.ext.store_prodlist.util.mpJumpToPage(parentID,myControl.ext.store_prodlist.vars[parentID].page_in_focus + 1)})
			}
		}
	else if($this.attr('data-role') == 'previous')	{
		if(myControl.ext.store_prodlist.vars[parentID].page_in_focus == 1)	{$this.attr('disabled','disabled').addClass('ui-state-disabled')}
		else	{
			$(this).click(function(){myControl.ext.store_prodlist.util.mpJumpToPage(parentID,myControl.ext.store_prodlist.vars[parentID].page_in_focus - 1)})
			}
		}
	});
//multipage may be turned off (but the header portion still enabled), such as when only 1 page of product is present.
if(myControl.ext.store_prodlist.vars[parentID].hide_multipage_controls == true)	{
	$output.find('.mpControlsPagination').addClass('displayNone');
	}
				
				return $output;
				}, //showMPControls
			//will generate some useful review info (total number of reviews, average review, etc ) and put it into appProductGet|PID	
//data saved into appProductGet so that it can be accessed from a product databind. helpful in prodlists where only summaries are needed.
//NOTE - this function is also in store_product. probably ought to merge prodlist and product, as they're sharing more and more.
			summarizeReviews : function(pid)	{
//				myControl.util.dump("BEGIN store_product.util.summarizeReviews");
				var L = 0;
				var sum = 0;
				var avg = 0;
				if(typeof myControl.data['appReviewsList|'+pid] == 'undefined' || $.isEmptyObject(myControl.data['appReviewsList|'+pid]['@reviews']))	{
//item has no reviews or for whatver reason, data isn't available. 
					}
				else	{
					L = myControl.data['appReviewsList|'+pid]['@reviews'].length;
					for(i = 0; i < L; i += 1)	{
						sum += Number(myControl.data['appReviewsList|'+pid]['@reviews'][i].RATING);
						}
					avg = Math.round(sum/L);
					}
				return {"average":avg,"total":L}
				}
			} //util

		
		} //r object.
	return r;
	}