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


var store_prodlist = function(_app) {
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
				if(_app.model.fetchData('appProductGet|'+pid) == false)	{
					r = 2;
					this.dispatch(pid,tagObj,Q);
					}
				else	{
					_app.u.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(pid,tagObj,Q)	{
				var obj = {};
				obj["_cmd"] = "appProductGet";
				obj["pid"] = pid;
				obj["_tag"] = tagObj;
				_app.model.addDispatchToQ(obj,Q);
				}
			}, //appProductGet

//allows for acquiring inventory, variations and or reviews. set withVariations="1" or withInventory="1" or withReviews="1"
//set pid=pid in obj
		getDetailedProduct : {
			init : function(obj,tagObj,Q)	{
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
//				_app.u.dump("BEGIN _app.ext.store_prodlist.calls.appProductGet");
//				_app.u.dump(" -> PID: "+obj.pid);
//				_app.u.dump(" -> obj['withReviews']: "+obj['withReviews']);
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj["datapointer"] = "appProductGet|"+obj.pid; 

//fetchData checks the timestamp, so no need to doublecheck it here unless there's a need to make sure it is newer than what is specified (1 day) in the fetchData function				
				if(_app.model.fetchData(tagObj.datapointer) == false)	{
//					_app.u.dump(" -> appProductGet not in memory or local. refresh both.");
					r += 1;
					}
				else if(obj['withInventory'] && typeof _app.data[tagObj.datapointer]['@inventory'] == 'undefined')	{
					r += 1;
					}
				else if(obj['withVariations'] && typeof _app.data[tagObj.datapointer]['@variations'] == 'undefined')	{
					r += 1;
					
					}
//  && _app.model.addDispatchToQ(obj,Q) -> not sure why this was here.
				if(obj['withReviews'])	{
//callback will b on appProductGet, but make sure this request is first so that when callback is executed, this is already in memory.
					r += _app.ext.store_prodlist.calls.appReviewsList.init(obj.pid,{},Q);
					}
					
//To ensure accurate data, if inventory or variations are desired, data is requested.
//r will be greater than zero if product record not already in local or memory
				if(r == 0) 	{
					_app.u.handleCallback(tagObj)
					}
				else	{
					this.dispatch(obj,tagObj,Q)
					}

				return r;
				},
			dispatch : function(obj,tagObj,Q)	{
				obj["_cmd"] = "appProductGet";
				obj["_tag"] = tagObj;
				_app.model.addDispatchToQ(obj,Q);
				}
			}, //appProductGet

		

//formerly getReviews
		appReviewsList : {
			init : function(pid,tagObj,Q)	{
				var r = 0; //will return a 1 or a 0 based on whether the item is in local storage or not, respectively.

				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
				tagObj["datapointer"] = "appReviewsList|"+pid;

				if(_app.model.fetchData('appReviewsList|'+pid) == false)	{
					r = 1;
					this.dispatch(pid,tagObj,Q)
					}
				else	{
					_app.u.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(pid,tagObj,Q)	{
				_app.model.addDispatchToQ({"_cmd":"appReviewsList","pid":pid,"_tag" : tagObj},Q);	
				}
			}//appReviewsList

		}, //calls









					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\









	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
		init : {
			onSuccess : function()	{
//				_app.u.dump('BEGIN _app.ext.store_prodlist.init.onSuccess ');
				return true;  //currently, there are no config or extension dependencies, so just return true. may change later.
//				_app.u.dump('END _app.ext.store_prodlist.init.onSuccess');
				},
			onError : function()	{
				_app.u.dump('BEGIN _app.ext.store_prodlist.callbacks.init.onError');
				}
			},
/*
A special translate template for product so that reviews can be merged into the data passed into the template rendering engine.
*/
		translateTemplate : {
			onSuccess : function(tagObj)	{
//				_app.u.dump("BEGIN _app.ext.store_prodlist.callbacks.translateTemplate.onSuccess ");
//				_app.u.dump(tagObj);
//				_app.u.dump(" -> tagObj.datapointer = "+tagObj.datapointer);
//				_app.u.dump(" -> tagObj.parentID = "+tagObj.parentID+" and $(#"+tagObj.parentID+").length: "+$('#'+tagObj.parentID).length);
				var tmp = _app.data[tagObj.datapointer];
				var pid = _app.data[tagObj.datapointer].pid;
//				_app.u.dump(" -> typeof _app.data['appReviewsList|'+pid]:"+ typeof _app.data['appReviewsList|'+pid]);
				if(typeof _app.data['appReviewsList|'+pid] == 'object'  && _app.data['appReviewsList|'+pid]['@reviews'].length)	{
//					_app.u.dump(" -> Item ["+pid+"] has "+_app.data['appReviewsList|'+pid]['@reviews'].length+" review(s)");
					tmp['reviews'] = _app.ext.store_prodlist.u.summarizeReviews(pid); //generates a summary object (total, average)
					tmp['reviews']['@reviews'] = _app.data['appReviewsList|'+pid]['@reviews']
					}

				var $product = tagObj.jqObj.removeClass('loadingBG').attr('data-pid',pid);
				var $prodlist = $product.parent();

				$product.tlc({'dataset':tmp,'verb':'translate'}).attr('data-template-role','listitem');
				_app.u.handleButtons($product);
				

				$prodlist.data('pageProductLoaded',($prodlist.data('pageProductLoaded') + 1)); //tracks if page is done.
				$prodlist.data('totalProductLoaded',($prodlist.data('totalProductLoaded') + 1)); //tracks if entire list is done. handy for last page which may have fewer than an entire pages worth of data.
				if(($prodlist instanceof jQuery && $prodlist.data('pageProductLoaded')) && (($prodlist.data('pageProductLoaded') == $prodlist.data('prodlist').items_per_page) || ($prodlist.data('totalProductLoaded') == $prodlist.data('prodlist').total_product_count)))	{
//					_app.u.dump($._data($prodlist[0],'events')); //how to see what events are tied to an element. not a supported method.
					$prodlist.trigger('listcomplete');
					}


//				_app.renderFunctions.translateTemplate(_app.data[tagObj.datapointer],tagObj.parentID);
				},
//error needs to clear parent or we end up with orphans (especially in UI finder).
			onError : function(responseData,uuid)	{
				responseData.persistent = true; //throwMessage will NOT hide error. better for these to be pervasive to keep merchant fixing broken things.
				var pid = responseData.pid;

				var $product =(responseData.jqObj instanceof jQuery) ? responseData.jqObj :  $(_app.u.jqSelector('#',responseData.parentID));
				$product.empty().removeClass('loadingBG');
				$product.anymessage(responseData,uuid);
//even if the product errors out, productLoaded gets incremented so the oncomplete runs.
				var $prodlist = $product.parent();
				$prodlist.data('pageProductLoaded',($prodlist.data('pageProductLoaded') + 1));
				$prodlist.data('totalProductLoaded',($prodlist.data('totalProductLoaded') + 1));
				
//for UI prod finder. if admin session, adds a 'remove' button so merchant can easily take missing items from list.
				if(_app.u.thisIsAnAdminSession())	{
					$("<button \/>").text("Remove "+pid).button().on('click',function(){
						_app.ext.admin.u.removePidFromFinder($(this).closest("[data-pid]")); //function accepts a jquery object.
						}).appendTo($('.ui-widget-anymessage',$product));
					}
				}
			},

//put an array of sku's into memory for quick access. This array is what is used in filterProdlist to remove items from the forgetme list.
		handleForgetmeList : {
			onSuccess : function(tagObj)	{
				var L = _app.data['getCustomerList|forgetme']['@forgetme'].length
				_app.ext.store_prodlist.vars.forgetmeContainer.csv = []; //reset list.
				for(var i = 0; i < L; i += 1)	{
					_app.ext.store_prodlist.vars.forgetmeContainer.csv.push(_app.data['getCustomerList|forgetme']['@forgetme'][i].SKU)
					}
				}
			}

		}, //callbacks







						////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





	renderFormats : {
			
//a product list needs an ID for multipage to work right. will assign a random one if none is set.
//that parent ID is prepended to the sku and used in the list item id to decrease likelyhood of duplicate id's
//data.bindData will get passed into getProdlistVar and used for defaults on the list itself. That means any var supported in prodlistVars can be set in bindData.
			productlist : function($tag,data)	{
				//need to keep admin and quickstart both running.
//				dump(" data.value: "); dump(data.value);
				data.bindData.loadsTemplate = data.bindData.templateid; // ### TODO -> once the prodlist code is updated, this can be ditched.
				data.value = data.value;
				this.productList($tag,data);
				},
			productList : function($tag,data)	{
//				_app.u.dump("BEGIN store_prodlist.renderFormats.productList");
//				_app.u.dump(" -> data.bindData: "); _app.u.dump(data.bindData);
				if(_app.u.isSet(data.value))	{
					data.bindData.csv = data.value;
					_app.ext.store_prodlist.u.buildProductList(data.bindData,$tag);
					}
				},//prodlist		
			
			mpPagesAsListItems : function($tag,data)	{
//				_app.u.dump('BEGIN _app.ext.store_prodlist.renderFormats.mpPagesAsListItems');
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

			addtocartbutton : function($tag,data)	{
//				_app.u.dump("BEGIN store_product.renderFunctions.addtocartbutton");
//				_app.u.dump(" -> ID before any manipulation: "+$tag.attr('id'));
				var pid = data.value;
				var showATC = true;

// add _pid to end of atc button to make sure it has a unique id.
// add a success message div to be output before the button so that messaging can be added to it.
// atcButton class is added as well, so that the addToCart call can disable and re-enable the buttons.
				$tag.attr('id',$tag.attr('id')+'_'+pid).addClass('atcButton').before("<div class='atcSuccessMessage' id='atcMessaging_"+pid+"'><\/div>"); 
				if(_app.ext.store_product.u.productIsPurchaseable(pid))	{
//product is purchaseable. make sure button is visible and enabled.
					$tag.show().removeClass('displayNone').removeAttr('disabled');
					if(typeof _app.data['appProductGet|'+pid]['@variations'] == 'undefined')	{showATC = false}
					else if(!$.isEmptyObject(_app.data['appProductGet|'+pid]['@variations'])){showATC = false}					

/*
when the template is initially created (using createInstance and then translate template
the button gets generated, then updated. This may result in multiple events being added.
so the atc events are unbinded, then binded.
*/

					if(showATC)	{
//						_app.u.dump(" -> is add to cart.");
						$tag.addClass('addToCartButton').unbind('.myATCEvent').bind('click.myATCEvent',function(event){
//						_app.u.dump("BUTTON pushed. $(this).parent().attr('id') = "+$(this).parent().attr('id'));
						$(this).parent().submit();
						event.preventDefault();
						}).text('Add To Cart')
						}
					else	{
//						_app.u.dump(" -> is choose options.");
						$tag.addClass('chooseOptionsButton').unbind('.myATCEvent').bind('click.myATCEvent',function(event){
event.preventDefault();
// ### TODO -> this needs to be handled better. a function needs to be passed in or something.
//move into the custom _app. 
_app.ext.quickstart.u.handlePageContent('product',pid)
					}).text('Choose Options')}
					
					}
				else	{
					$tag.replaceWith("<span class='notAvailable'>not available</span>");
					}
//				_app.u.dump(" -> ID at end: "+$tag.attr('id'));
				} //addtocartbutton
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
//				_app.u.dump("BEGIN store_prodlist.u.setProdlistVars"); _app.u.dump(obj);
				var r = false;
				var hideMultipageControls = false; //if set to true, will hide just the dropdown/page controls.
				
//can't build a prodlist without product.				
				if(obj && obj.csv && typeof obj.csv == 'object' && obj.csv.length > 0 && obj.loadsTemplate)	{

					var L = obj.csv.length;

//okay, now lets set up some defaults if none were passed and normalize the data.
					obj.items_per_page = (Number(obj.items_per_page)) ? Number(obj.items_per_page) : 25; //the number of items per page before going to multipage (if enabled)
					obj.page_in_focus = (Number(obj.page_in_focus)) ? Number(obj.page_in_focus) : 1; //in a multipage format, which page is in focus.
					obj.hide_summary = (obj.hide_summary) ? true : false;
					obj.hide_pagination = this.mpControlsShouldBeHidden(obj);
					obj.withInventory = (obj.withInventory) ? 1 : 0;
					obj.withVariations = (obj.withVariations) ? 1 : 0;
					obj.withReviews = (obj.withReviews) ? 1 : 0;
					obj.parentID = obj.parentID || 'pl_'+_app.u.guidGenerator().substring(0,12); //gotta have an ID. really really wants a unique id.
					
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
					_app.u.dump(" -> Missing some required fields for setProdlistVars. requires csv and loadstemplate."); _app.u.dump(obj);
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
//				_app.u.dump(" -> typeof csv: "+typeof csv);
				csv = $.grep(csv,function(n){return(n);}); //remove blanks. commonly occurs in product attributes cuz of extra comma
// *** 201404 ->  IE8 does NOT support trim().
				csv = $.map(csv,function(n){return(n.replace(/^\s+|\s+$/g, ''));}); //remove blanks. commonly occurs in product attributes cuz of extra comma.
//				csv = $.map(csv,function(n){return(n.trim());}); //remove blanks. commonly occurs in product attributes cuz of extra comma
				return csv;
				},

//plObj is the product list object (what is returned from setProdlistVars).
			getProdlistPlaceholders : function(plObj)	{
				var $r = $("<ul>"); //The children of this are what is returned.
				if(plObj && plObj.csv)	{
					var pageCSV = this.getSkusForThisPage(plObj);
					var L = pageCSV.length;
					for(var i = 0; i < L; i += 1)	{
						$r.append(_app.renderFunctions.createTemplateInstance(plObj.loadsTemplate,{"id":this.getSkuSafeIdForList(plObj.parentID,pageCSV[i]),"pid":pageCSV[i]})); //create a 'place' for this product in the list.
						}
					}
				return $r.children();
				},
				
//builds the safeID for the container of a product. unique per list/sku
			getSkuSafeIdForList : function(parentID,sku)	{
				return parentID+"_"+_app.u.makeSafeHTMLId(sku);
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
//				_app.u.dump("BEGIN store_prodlist.u.getProductDataForList ["+plObj.parentID+"]"); _app.u.dump(plObj);
				Q = Q || 'mutable';
				var numRequests = 0; //# of requests that will b made. what is returned.
				if(plObj && plObj.csv)	{
//					_app.u.dump(" -> csv defined. length: "+plObj.csv.length); _app.u.dump(plObj.csv);
					var pageCSV = this.getSkusForThisPage(plObj); 
					var L = pageCSV.length;
					var call = 'appProductGet';  //this call is used unless variations or inventory are needed. this call is 'light' and just gets basic info.
					if(Number(plObj.withVariations) + Number(plObj.withInventory) + Number(plObj.withReviews) > 0)	{
						call = 'getDetailedProduct'
						}

					for(var i = 0; i < L; i += 1)	{
//						_app.u.dump("Queueing data fetch for "+pageCSV[i]);
						var _tag = {};
						if(plObj.isWizard)	{
							_tag = {'callback':'translateTemplate','extension':'store_prodlist','jqObj':magic.inspect('#'+this.getSkuSafeIdForList(plObj.parentID,pageCSV[i]))}
							}
						else if(plObj.parentID)	{
//							_app.u.dump(" -> parentID is set.");
							_tag = {'callback':'translateTemplate','extension':'store_prodlist','jqObj':$(plObj.placeholders[i])}
							}
						else	{
							_app.u.dump(" -> no parentID set. item not queued.");
							}
						numRequests += _app.ext.store_prodlist.calls[call].init({
							"pid":pageCSV[i],
							"withReviews":plObj.withReviews, 
							"withVariations":plObj.withVariations,
							"withInventory":plObj.withInventory
							},_tag, Q);  //tagObj not passed if parentID not set. 
						}
					}
				
				if(numRequests > 0)	{_app.model.dispatchThis(Q)}
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
//				_app.u.dump("BEGIN store_prodlist.u.buildProductList()"); _app.u.dump(" -> obj: "); _app.u.dump(obj);

//Need either the tag itself ($tag) or the parent id to build a list. recommend $tag to ensure unique parent id is created
//also need a list of product (csv)
				if($tag && obj.csv)	{
//					_app.u.dump(" -> required parameters exist. Proceed...");
					obj.csv = _app.ext.store_prodlist.u.cleanUpProductList(obj.csv); //strip blanks and make sure this is an array. prod attributes are not, by default.


// use child as template is used within KISS.
					if(obj.useChildAsTemplate)	{
//						_app.u.dump(" -> obj.useChildAsTemplate is true.");
						obj.loadsTemplate = "_"+$tag.attr('id')+"ListItemTemplate";
						if(_app.templates[obj.loadsTemplate])	{
							_app.u.dump(" -> template already exists");
							//child has already been made into a template. 
							}
						else	{
//							_app.u.dump(" -> template does not exist. create it");
							if($tag.children().length)	{
								_app.u.dump(" -> tag has a child. create template: "+obj.loadsTemplate);
								_app.model.makeTemplate($("li:first",$tag),obj.loadsTemplate);
								$('li:first',$tag).empty().remove(); //removes the product list 'template' which is part of the UL.
								}
							else	{
								//The tag has no children. can't make a template. can't proceed. how do we handle this error? !!!
								$('#globalMessaging').anymessage({"message":"In store_prodlist.u.buildProductList, the parent declared 'useChildAsTemplate', but has no children. No template could be created. The product list will not render.","gMessage":true});
								}
							}
						}

					var plObj = this.setProdlistVars(obj); //full prodlist object now.

//need a jquery obj. to work with.
					// if($tag)	{$tag.attr('id',plObj.parentID);}
					// else	{$tag = $('#'+plObj.parentID);}
					
				
					$tag.data('pageProductLoaded',0); //used to count how many product have been loaded on this page (for prodlistComplete)
					$tag.data('totalProductLoaded',0); //used to count how many product have been loaded for total count (for prodlistComplete)					
					
//a wrapper around all the prodlist content is created just once. Used in multipage to clear old multipage content. This allows for multiple multi-page prodlists on one page. Hey. it could happen.
					if($tag.closest('[data-app-role=prodListContainer]').length == 0){
						if($tag.is('tbody'))	{
							$tag.closest('table').wrap("<div data-app-role='prodListContainer' />");
							}
						else	{
							$tag.wrap("<div data-app-role='prodListContainer' />");
							}
						}
					$tag.closest('[data-app-role=prodListContainer]').data('targetlist', $tag);
//adds all the placeholders. must happen before getProductDataForList so individual product translation can occur.
//can't just transmogrify beccause sequence is important and if some data is local and some isn't, order will get messed up.

//***201352 Separating out the placeholders so that they can be used in getProductDataForList individually for the jqObj.
//			Otherwise the callback tries to reference the placeholder by using the parentID, but in the case of anycontent
//			when we already have the data, the placeholder is not yet on the DOM and then data is never rendered.  -mc
					plObj.placeholders = this.getProdlistPlaceholders(plObj);
					$tag.append(plObj.placeholders).removeClass('loadingBG');
					$tag.data('prodlist',plObj); //sets data object on parent

					if(!obj.hide_summary)	{
						if($tag.is('tbody'))	{
							$tag.closest('table').before(this.showProdlistSummary(plObj,'header')); //multipage Header
							$tag.closest('table').after(this.showProdlistSummary(plObj,'footer')); //multipage Footer
							}
						else	{
							$tag.before(this.showProdlistSummary(plObj,'header')); //multipage Header
							$tag.after(this.showProdlistSummary(plObj,'footer')); //multipage Footer
							}
						}
					 //will render individual product, if data already present or fetch data and render as part of response.
					_app.ext.store_prodlist.u.getProductDataForList(plObj,$tag,'mutable');
					}
				else	{
					_app.u.throwGMessage("WARNING: store_prodlist.u.buildProductList is missing some required fields. Obj follows: ");
					_app.u.dump(obj);
					}
//				_app.u.dump(" -> r = "+r);
				}, //buildProductList



/*
function is executed both from the next/previous buttons and list of page links.
$pageTag is the jquery object of whatever was clicked. the data to be used is stored in data- tags on the element itself.

*/

			mpJumpToPage : function($pageTag)	{
				if($pageTag.attr('disabled') != 'disabled'){
//					_app.u.dump("BEGIN _app.ext.store_prodlist.u.mpJumpToPage");
					var targetList = $pageTag.closest('[data-app-role=prodListContainer]').data('targetlist');
					var plObj = targetList.data('prodlist');

//figure out what page to show next.
//the multipage controls take care of enabling/disabling next/back buttons to ensure no 'next' appears/is clickable on last page.				
					if($pageTag.attr('data-role') == 'next')	{plObj.page_in_focus += 1}
					else if($pageTag.attr('data-role') == 'previous')	{plObj.page_in_focus -= 1}
					else	{plObj.page_in_focus = $pageTag.attr('data-page')}

					$('.mpControlContainer','#'+plObj.parentID+'_container').empty().remove(); //clear all summary/multipage for this prodlist.
					$('#'+plObj.parentID).empty(); //empty prodlist so new page gets clean data.
					this.buildProductList(plObj);
					}
				},
			
			showProdlistSummary : function(plObj,location){
				
				location = location ? location : 'header';
//* 201330 -> $output was being generated w/ transmogrify even if hide_pagination was set.  That's extra, unneccesary work.
				var $output = false;
				if(plObj.hide_pagination === true)	{
					}
				else	{
//					$output = _app.renderFunctions.transmogrify({'id':'mpControl_'+plObj.parentID+'_'+location,'targetList':plObj.parentID},'mpControlSpec',plObj);
					$output = $("<div \/>");
					$output.tlc({
						'templateid' : 'mpControlSpec',
						'dataset' : plObj,
						'dataAttribs' : {'id':'mpControl_'+plObj.parentID+'_'+location}
						})
					$output.find('.mpControlJumpToPage, .paging').click(function(){
						_app.ext.store_prodlist.u.mpJumpToPage($(this))
						_app.u.jumpToAnchor('mpControl_'+plObj.parentID+'_header');
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
//				_app.u.dump("BEGIN store_product.u.summarizeReviews");
				var L = 0;
				var sum = 0;
				var avg = 0;
				if(typeof _app.data['appReviewsList|'+pid] == 'undefined' || $.isEmptyObject(_app.data['appReviewsList|'+pid]['@reviews']))	{
//item has no reviews or for whatver reason, data isn't available. 
					}
				else	{
					L = _app.data['appReviewsList|'+pid]['@reviews'].length;
					for(var i = 0; i < L; i += 1)	{
						sum += Number(_app.data['appReviewsList|'+pid]['@reviews'][i].RATING);
						}
					avg = Math.round(sum/L);
					}
				return {"average":avg,"total":L}
				}
			} //util

		
		} //r object.
	return r;
	}
