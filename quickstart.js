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





var myRIA = function() {
	var r = {
		
	vars : {
//a list of the templates used by this extension.
//if this is a custom extension and you are loading system extensions (prodlist, etc), then load ALL templates you'll need here.
		"templates" : [
//the list of templates that are commonly edited (same order as they appear in appTemplates
			'homepageTemplate',	'categoryTemplate',
			'categoryListTemplate',
			'categoryListTemplateRootCats',
			'productListTemplate',
			'productListTemplateATC',
			'productListTemplateBuyerList',
			'productListTemplateResults',
			'productTemplate',
			'productTemplateQuickView',
			'pageNotFoundTemplate',
//the list of templates that, in most cases, are left alone. Also in the same order as appTemplates
			'breadcrumbTemplate',
			'companyTemplate',
			'customerTemplate',
			'searchTemplate',
			'mpControlSpec',
			'cartTemplate',
			'productListTemplateCart',
			'productListTemplateChildren',
			'productReviewsTemplateDetail',
			'imageViewerTemplate',
			'reviewFrmTemplate',
			'subscribeFormTemplate',
			'orderLineItemTemplate',
			'faqTopicTemplate',
			'faqQnATemplate',
			'billAddressTemplate',
			'shipAddressTemplate'],
		"sotw" : {}, //state of the world. set to most recent page info object.
		"hotw" : new Array(15), //history of the world. contains 15 most recent sotw objects.
		"session" : {
			"recentSearches" : [],
			"recentlyViewedItems" : [],
			"recentCategories" : []
			} //a list of other extensions (just the namespace) that are required for this one to load
		},


					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



	calls : {

		}, //calls




					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





	callbacks : {
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
//				app.u.dump('BEGIN app.ext.myRIA.callbacks.init.onError');
				}
			},

		startMyProgram : {
			onSuccess : function()	{
//			app.u.dump("BEGIN myRIA.callback.startMyProgram");
//			app.u.dump(" -> window.onpopstate: "+typeof window.onpopstate);
//			app.u.dump(" -> window.history.pushState: "+typeof window.history.pushState);
//This will create the arrays for the template[templateID].onCompletes and onInits
			app.ext.myRIA.u.createTemplateFunctions(); //should happen early so that the myRIA.template object exists, specifically for app.u..appInitComplete
				
//if ?debug=anything is on URI, show all elements with a class of debug.
if(app.u.getParameterByName('debug'))	{
	$('.debug').show().append("<div class='clearfix'>Model Version: "+app.model.version+" and release: "+app.vars.release+"</div>");
	$('button','.debug').button();
	app.ext.myRIA.u.bindAppViewForms('.debug');
	app.ext.myRIA.u.bindNav('.debug .bindByAnchor');
	}

//attach an event to the window that will execute code on 'back' some history has been added to the history.
if(typeof window.onpopstate == 'object')	{
	window.onpopstate = function(event) { 
		app.ext.myRIA.u.handlePopState(event.state);
		}
	}
//if popstate isn't supporeted, hashchange will use the anchor.
else if ("onhashchange" in window)	{ // does the browser support the hashchange event?
		_ignoreHashChange = false; //global var. when hash is changed from JS, set to true. see handleHashState for more info on this.
		window.onhashchange = function () {
		app.ext.myRIA.u.handleHashState();
		}
	}
else	{
	app.u.throwMessage("You appear to be running a very old browser. Our app will run, but may not be an optimal experience.");
	// wow. upgrade your browser. should only get here if older than:
	// Google Chrome 5, Safari 5, Opera 10.60, Firefox 3.6 and Internet Explorer 8
	
	//NOTE: does not trigger in IE9 running IE7 or IE8 standards mode
	}





//The request for appCategoryList is needed early for both the homepage list of cats and tier1.
//piggyback a few other necessary requests here to reduce # of requests
				app.ext.store_navcats.calls.appCategoryList.init(zGlobals.appSettings.rootcat,{"callback":"showRootCategories","extension":"myRIA"},'mutable');
				app.calls.appProfileInfo.init({'profile':app.vars.profile},{},'mutable');
				app.model.dispatchThis(); //this dispatch needs to occur prior to handleAppInit being executed.

				var page = app.ext.myRIA.u.handleAppInit(); //checks url and will load appropriate page content. returns object {pageType,pageInfo}

//get some info to have handy for when needed (cart, profile, etc)
				

				if(page.pageType == 'cart' || page.pageType == 'checkout')	{
//if the page type is determined to be the cart or checkout onload, no need to request cart data. It'll be requested as part of showContent
					}
				else	{
					app.calls.refreshCart.init({'callback':'updateMCLineItems','extension':'myRIA'},'passive');
					app.ext.store_cart.calls.cartShippingMethods.init({},'passive');
					}

				app.model.dispatchThis('passive');

//adds submit functionality to search form. keeps dom clean to do it here.
				app.ext.myRIA.u.bindAppViewForms('#appView'); //added the selector on 20121026. was blank before.
				app.ext.myRIA.vars.mcSetInterval = setInterval(function(){app.ext.myRIA.u.handleMinicartUpdate({'datapointer':'cartDetail'})},4000); //make sure minicart stays up to date.
				showContent = app.ext.myRIA.a.showContent; //a shortcut for easy execution.
				quickView = app.ext.myRIA.a.quickView; //a shortcut for easy execution.
				
				app.ext.myRIA.u.bindNav('#appView .bindByAnchor');
				if(typeof app.u.appInitComplete == 'function'){app.u.appInitComplete(page)}; //gets run after app has been init
				}
			}, //startMyProgram 



		itemAddedToCart :	{
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN app.ext.store_product.callbacks.itemAddedToCart.onSuccess');
				$('.atcButton').removeAttr('disabled').removeClass('disabled'); //makes all atc buttons clickable again.
				
				var msgObj = app.u.successMsgObject('Item Added')
				msgObj.parentID = 'atcMessaging_'+app.data[tagObj.datapointer].product1
				var htmlid = app.u.throwMessage(msgObj);
				setTimeout(function(){
					$("#"+htmlid).slideUp(1000);
					},5000);
			
				_gaq.push(['_trackEvent','Add to cart','User Event','success',app.data[tagObj.datapointer].product1]);
			
				},
			onError : function(responseData,uuid)	{
				app.u.dump('BEGIN app.ext.myRIA.callbacks.itemAddedToCart.onError');
				$('.addToCartButton').removeAttr('disabled').removeClass('disabled').removeClass('ui-state-disabled'); //remove the disabling so users can push the button again, if need be.
				app.u.throwMessage(responseData);
				_gaq.push(['_trackEvent','Add to cart','User Event','fail',responseData['_msg_1_txt']]);
				}
			}, //itemAddedToCart
			
//optional callback  for appCategoryList in app init which will display the root level categories in element w/ id: tier1categories 
		showRootCategories : {
			onSuccess : function()	{
//				app.u.dump('BEGIN app.ext.myRIA.callbacks.showCategories.onSuccess');
				var tagObj = {};
//we always get the tier 1 cats so they're handy, but we only do something with them out of the get if necessary (tier1categories is defined)
				if($('#tier1categories').length)	{
					app.u.dump("#tier1categories is set. fetch tier1 cat data.");
					app.ext.store_navcats.u.getChildDataOf(zGlobals.appSettings.rootcat,{'parentID':'tier1categories','callback':'addCatToDom','templateID':'categoryListTemplateRootCats','extension':'store_navcats'},'appCategoryDetailMax');  //generate nav for 'browse'. doing a 'max' because the page will use that anway.
					app.model.dispatchThis();
					}
				}
			}, //showRootCategories

//used for callback on showCartInModal function
//
		handleCart : 	{
			onSuccess : function(tagObj)	{
				app.u.dump("BEGIN myRIA.callbacks.handleCart.onSuccess");
//				app.u.dump(" -> tagObj: ");	app.u.dump(tagObj);
				app.ext.myRIA.u.handleMinicartUpdate(tagObj);
				//empty is to get rid of loading gfx.
				$('#'+tagObj.parentID).empty().append(app.renderFunctions.transmogrify('modalCartContents',tagObj.templateID,app.data[tagObj.datapointer]));
				tagObj.state = 'onCompletes'; //needed for handleTemplateFunctions.
				app.ext.myRIA.u.handleTemplateFunctions(tagObj);
				}
			}, //updateMCLineItems

//used in init.
		updateMCLineItems : 	{
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN myRIA.callbacks.updateMCLineItems");
				app.ext.myRIA.u.handleMinicartUpdate(tagObj);
				}
			}, //updateMCLineItems

		showProd : 	{
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN myRIA.callbacks.showProd");
//				app.u.dump(tagObj);
				var tmp = app.data[tagObj.datapointer];
				var pid = app.data[tagObj.datapointer].pid;
				tmp.session = app.ext.myRIA.vars.session;
				if(typeof app.data['appReviewsList|'+pid] == 'object')	{
					tmp['reviews'] = app.ext.store_product.u.summarizeReviews(pid); //generates a summary object (total, average)
					tmp['reviews']['@reviews'] = app.data['appReviewsList|'+pid]['@reviews']
					}
//				if(pid == 'AXA-TEST-B2')	{app.u.dump(tmp)}
//				app.u.dump("Rendering product template for: "+pid);
				app.renderFunctions.translateTemplate(tmp,tagObj.parentID);
				tagObj.pid = pid;
				app.ext.myRIA.u.buildQueriesFromTemplate(tagObj);
				app.model.dispatchThis();
				
// SANITY - handleTemplateFunctions does not get called here. It'll get executed as part of showPageContent callback, which is executed in buildQueriesFromTemplate.
				},
			onError : function(responseData,uuid)	{
//				app.u.dump(responseData);
//				$('#mainContentArea').empty();
				app.u.throwMessage(responseData);
				}
			}, //showProd 


		showCompany : 	{
			onSuccess : function(tagObj)	{
				app.renderFunctions.translateTemplate(app.data[tagObj.datapointer],tagObj.parentID);
				app.ext.myRIA.u.bindNav('#companyNav a');
				app.ext.myRIA.u.showArticle(tagObj.infoObj);
				if(!tagObj.infoObj.templateID)	{
					if(tagObj.infoObj.templateID){} //use existing value
					else if(tagObj.templateID)	{tagObj.infoObj.templateID = 'companyTemplate'}
					else	{tagObj.infoObj.templateID = 'companyTemplate'}
					}
				tagObj.infoObj.state = 'onCompletes';
				app.ext.myRIA.u.handleTemplateFunctions(tagObj.infoObj);				
				}
			}, //showCompany 




		handleBuyerAddressUpdate : 	{
			onSuccess : function(tagObj)	{
				app.u.dump("BEGIN myRIA.callbacks.handleBuyerAddressUpdate");
//				app.u.dump(tagObj);
				$parent = $('#'+tagObj.parentID);
				$('button',$parent).removeAttr('disabled').removeClass('ui-state-disabled');
				$('.changeLog',$parent).empty().append('Changes Saved');
				$('.edited',$parent).removeClass('edited'); //if the save button is clicked before 'exiting' the input, the edited class wasn't being removed.
				$('.buttonMenu',$parent).find('.offMenu').show();
				$('.buttonMenu',$parent).find('.onMenu').hide();
				app.ext.myRIA.u.destroyEditable($parent);
				},
			onError : function(responseData,uuid)	{
				var $parent = $('#'+tagObj.parentID);
				$('.changeLog',$parent).append(app.u.formatResponseErrors(responseData))
				$('button',$parent).removeAttr('disabled').removeClass('ui-state-disabled');
				}
			}, //handleBuyerAddressUpdate

//used in /customer
		showAddresses : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN myRIA.callbacks.showAddresses.onSuccess");
//clean the workspace.
				var authState = app.u.determineAuthentication();
				$('#buyerAddresses .shipAddresses, #buyerAddresses .billAddresses, ').empty(); //empty no matter what, so if user was logged in and isn't, addresses go away.
				var $buyerAddresses; //recycled. use as target for bill and ship addresses. the target of this changes in the loop below
//only show addresses if user is logged in.
				if(authState == 'authenticated')	{
					var types = new Array('@ship','@bill');
					var L,type;
//yes, it's a loop inside a loop.  bad mojo, i know.
//but there's only two types of addresses and, typically, not a lot of addresses per user.
					for(var j = 0; j < 2; j += 1)	{
						type = types[j];
						$buyerAddresses = $("."+type.substring(1)+"Addresses",$('#buyerAddresses'))
						app.u.dump(" -> address type: "+type);
//						app.u.dump(app.data.buyerAddressList[type]);
						L = app.data.buyerAddressList[type].length;
//						app.u.dump(" -> # addresses: "+L);
						if(L)	{
//							$buyerAddresses.append(type == '@bill' ? '<h2>Billing Address(es)</h2>' : '<h2>Shipping Address(es)</h2>');
							var addressClass = type == '@bill' ? 'BILL' : 'SHIP';
							for(var i = 0; i < L; i += 1)	{
								$buyerAddresses.append(app.renderFunctions.transmogrify({
									'id':addressClass+'_address_'+app.data.buyerAddressList[type][i]['_id'], //_id may not be unique between classes, so class is part of ID (ex: DEFAULT)
									'addressclass': addressClass, //appBuyerAddressAddUpdate wants this as UC w/ no @
									'addressid':app.data.buyerAddressList[type][i]['_id']
									},type.substring(1)+'AddressTemplate',app.data.buyerAddressList[type][i]))
								} //for loop for addresses
							}// L if
						} //for loop for address types

					$('button',$('#buyerAddresses')).each(function(){
						var $button = $(this);
						if($button.data('action') == 'cancelAddressChanges'){
							$button.click(function(){
								$button.closest('.buttonMenu').find('.offMenu').show();
								$button.closest('.buttonMenu').find('.onMenu').hide();
								var $parent = $button.closest('.buyerAddressContainer');
								app.ext.myRIA.u.destroyEditable($parent);
								});
							} //if for cancelAddressChanges
							
						else if($button.data('action') == 'saveAddressChanges'){
							$button.click(function(){
								var $parent = $(this).closest('.buyerAddressContainer');
//								alert($('.edited',$parent).length)
								var cmdObj = app.ext.myRIA.u.getAllDataFromEditable($parent);
								if(!$.isEmptyObject(cmdObj))	{
									$('button',$parent).addClass('ui-state-disabled').attr('disabled','disabled');
									cmdObj.shortcut = $parent.attr('data-addressid');
									cmdObj.type = $parent.attr('data-addressclass');
//									app.u.dump(" -> cmdObj: "); app.u.dump(cmdObj);
									$('.changeLog',$parent).append("<div class='alignRight'><span class='wait'></span><span>Saving</span></div>");
									app.ext.store_crm.calls.buyerAddressAddUpdate.init(cmdObj, {'callback':'handleBuyerAddressUpdate','extension':'myRIA','parentID':$parent.attr('id')},'immutable');
									app.model.dispatchThis('immutable')
									}
								else	{
									$('.changeLog',$parent).empty().append("<div>no changes have been made</div>");
									}
								});
							} //else if for saveAddressChanges
							
						else if($button.data('action') == 'displayOnMenu')	{
							$button.click(function(){
								$(this).closest('.buttonMenu').find('.offMenu').hide();
								$(this).closest('.buttonMenu').find('.onMenu').show();
								app.ext.myRIA.u.makeRegionEditable($(this).closest('.buyerAddressContainer'));
								});
							} //else if for displayOnMenu
						else	{
							app.u.dump("WARNING! unknown data-action set on customer address button");
							}
						})
					}
				}
			}, //showAddresses

//used as part of showContent for the home and category pages.
		fetchPageContent : {
			onSuccess : function(tagObj)	{
				var catSafeID = tagObj.datapointer.split('|')[1];
				tagObj.navcat = catSafeID;
				app.ext.myRIA.u.buildQueriesFromTemplate(tagObj);
				app.model.dispatchThis();
				},
			onError : function(responseData)	{
				app.u.throwMessage(responseData);
				$('.loadingBG',$('#mainContentArea')).removeClass('loadingBG'); //nuke all loading gfx.
				app.ext.myRIA.u.changeCursor('auto'); //revert cursor so app doesn't appear to be in waiting mode.
				}
			}, //fetchPageContent


//used as part of showContent for the home and category pages.
		showPageContent : {
			onSuccess : function(tagObj)	{
//when translating a template, only 1 dataset can be passed in, so detail and page are merged and passed in together.
				var tmp = {};

//cat page handling.
				if(tagObj.navcat)	{
//					app.u.dump("BEGIN myRIA.callbacks.showPageContent ["+tagObj.navcat+"]");

					if(typeof app.data['appCategoryDetail|'+tagObj.navcat] == 'object' && !$.isEmptyObject(app.data['appCategoryDetail|'+tagObj.navcat]))	{
						tmp = app.data['appCategoryDetail|'+tagObj.navcat]
						}
					if(typeof app.data['appPageGet|'+tagObj.navcat] == 'object' && typeof app.data['appPageGet|'+tagObj.navcat]['%page'] == 'object' && !$.isEmptyObject(app.data['appPageGet|'+tagObj.navcat]['%page']))	{
						tmp['%page'] = app.data['appPageGet|'+tagObj.navcat]['%page'];
						}
					if(tagObj.lists.length)	{
						var L = tagObj.lists.length;
						for(var i = 0; i < L; i += 1)	{
							tmp[tagObj.lists[i]] = app.data['appNavcatDetail|'+tagObj.lists[i]];
							}
						}
					tmp.session = app.ext.myRIA.vars.session;
//a category page gets translated. A product page does not because the bulk of the product data has already been output. prodlists are being handled via buildProdlist
					app.renderFunctions.translateTemplate(tmp,tagObj.parentID);
					}
//product page handline
				else if(tagObj.pid)	{
// the bulk of the product translation has already occured by now (attribs, reviews and session) via callbacks.showProd.
// product lists are being handled through 'buildProductList'.
					}
				else	{
					app.u.dump("WARNING! showPageContent has no pid or navcat defined");
					}

				var L = tagObj.searchArray.length;
				var $parent;
				for(var i = 0; i < L; i += 1)	{
					$parent = $('#'+tagObj.searchArray[i].split('|')[1]);
					app.ext.myRIA.renderFormats.productSearch($parent,{value:app.data[tagObj.searchArray[i]]});
					}
				tagObj.state = 'onCompletes'; //needed for handleTemplateFunctions.
				app.ext.myRIA.u.handleTemplateFunctions(tagObj);

				},
			onError : function(responseData,uuid)	{
				$('#mainContentArea').removeClass('loadingBG')
				app.u.throwMessage(responseData);
				}
			}, //showPageContent

//this is used for showing a customer list of product, such as wish or forget me lists
		showBuyerLists : {
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN app.ext.myRIA.showList.onSuccess ');
var $parent = $('#'+tagObj.parentID).removeClass('loadingBG');
if(app.data[tagObj.datapointer]['@lists'].length > 0)	{
	var $ul = app.ext.store_crm.u.getBuyerListsAsUL(tagObj.datapointer);
	var numRequests = 0;
	$ul.children().each(function(){
		var $li = $(this);
		var listID = $li.data('buyerlistid');
		$li.wrapInner("<a href='#"+listID+"Contents'></a>"); //adds href for tab selection
		$parent.append($("<div>").attr({'id':listID+'Contents','data-buyerlistid':listID}).append($("<ul>").addClass('listStyleNone clearfix noPadOrMargin lineItemProdlist').attr('id','prodlistBuyerList_'+listID))); //containers for list contents and ul for productlist
		numRequests += app.ext.store_crm.calls.buyerProductListDetail.init(listID,{'callback':'buyerListAsProdlist','extension':'myRIA','parentID':'prodlistBuyerList_'+listID})
		});
	$parent.prepend($ul).tabs();
	app.model.dispatchThis('mutable');
	}
else	{
	$parent.append("You have no lists at this time. Add an item to your wishlist to get started...");
	}
				}
			}, //showBuyerList



//this is used for showing a customer list of product, such as wish or forget me lists
//formerly showlist
		buyerListAsProdlist : {
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN app.ext.myRIA.showList.onSuccess ');
				var listID = tagObj.datapointer.split('|')[1];
				var prods = app.ext.store_crm.u.getSkusFromBuyerList(listID);
				if(prods.length < 1)	{
//list is empty.
					app.u.formatMessage('This list ('+listID+') appears to be empty.');
					}
				else	{
//					app.u.dump(prods);
					app.ext.store_prodlist.u.buildProductList({"templateID":"productListTemplateBuyerList","withInventory":1,"withVariations":1,"parentID":tagObj.parentID,"csv":prods,withInventory:1,withReviews:1,withVariations:1})
					app.model.dispatchThis();
					}
				}
			}, //showList

//a call back to be used to show a specific list of product in a specific element.
//requires templateID and targetID to be passed on the tag object.
		showProdList : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN myRIA.callbacks.showProdList");
//				app.u.dump(app.data[tagObj.datapointer]);
				if(app.data[tagObj.datapointer]['@products'].length < 1)	{
					$('#'+tagObj.targetID).append(app.u.formatMessage('This list ('+listID+') appears to be empty.'));
					}
				else	{
					app.ext.store_prodlist.u.buildProductList({"templateID":tagObj.templateID,"parentID":tagObj.targetID,"csv":app.data[tagObj.datapointer]['@products']})
					app.model.dispatchThis();
					}
				}
			}, //showList
		authenticateZoovyUser : {
			onSuccess : function(tagObj)	{
				app.vars.cid = app.data[tagObj.datapointer].cid; //save to a quickly referencable location.
				$('#loginSuccessContainer').show(); //contains 'continue' button.
				$('#loginMessaging').empty().show().append("Thank you, you are now logged in."); //used for success and fail messaging.
				$('#loginFormContainer').hide(); //contains actual form.
				$('#recoverPasswordContainer').hide(); //contains password recovery form.
				}
			} //authenticateZoovyUser

		}, //callbacks



////////////////////////////////////   WIKILINKFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

/*
the wiki translator has defaults for the links built in. however, these will most likely
need to be customized on a per-ria basis.
*/
		wiki : {
			":search" : function(suffix,phrase){
				return "<a href='#' onClick=\"return showContent('search',{'KEYWORDS':'"+suffix+"'}); \">"+phrase+"<\/a>"
				},
			":category" : function(suffix,phrase){
				return "<a href='#category?navcat="+suffix+"' onClick='return showContent(\"category\",{\"navcat\":\""+suffix+"\"});'>"+phrase+"<\/a>"
				},
			":product" : function(suffix,phrase){
				return "<a href='#product?pid="+suffix+"' onClick='return showContent(\"product\",{\"pid\":\""+suffix+"\"});'>"+phrase+"<\/a>"
				},
			":customer" : function(suffix,phrase){
				return "<a href='#customer?show="+suffix+"' onClick='return showContent(\"customer\",{\"show\":\""+suffix+"\"});'>"+phrase+"<\/a>"
				},

			":policy" : function(suffix,phrase){
				return "<a href='#policy?show="+suffix+"' onClick='return showContent(\"company\",{\"show\":\""+suffix+"\"});'>"+phrase+"<\/a>"
				},

			":app" : function(suffix,phrase){
				var output; //what is returned.
				if(suffix == 'contact')	{
					output = "<a href='#policy?show="+suffix+"' onClick='return showContent(\"company\",{\"show\":\""+suffix+"\"});'>"+phrase+"<\/a>"					
					}
				else if(suffix == 'contact')	{
					output = "<a href='#policy?show="+suffix+"' onClick='return showContent(\"company\",{\"show\":\""+suffix+"\"});'>"+phrase+"<\/a>"					
					}
				else	{
					//we'll want to do something fantastic here.
					output = phrase;
					}
				return output;
				},

			":popup" : function(suffix,phrase)	{
				return "<a href=\""+suffix+"\" target='popup' onClick=\"_gaq.push(['_trackEvent', 'outgoing_links', "+suffix.replace(/^http:\/\//i, '')+"]);\">"+phrase+"</a>";
				}
			}, //wiki


		pageTransition : function($o,$n)	{
//if $o doesn't exist, the animation doesn't run and the new element doesn't show up, so that needs to be accounted for.
			if($o.length)	{
				$o.fadeOut(1000, function(){$n.fadeIn(1000)}); //fade out old, fade in new.
				}
			else	{
				$n.fadeIn(1000)
				}

//This is another example transition. old content slides out and new content slides in.
//			$n.slideDown(3000);
//			$o.slideUp(1000);
			},

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



		renderFormats : {

//This function works in conjuction with the showContent/showPage and buildQueriesFromTemplate functions.
//the parent and subcategory data (appCategoryDetail) must be in memory already for this to work right.
//data.value is the category object. data.bindData is the bindData obj.
			subcategoryList : function($tag,data)	{
//				app.u.dump("BEGIN control.renderFormats.subcats");
//				app.u.dump(data.value);
				var L = data.value.length;
				var thisCatSafeID; //used in the loop below to store the cat id during each iteration
	//			app.u.dump(data);
				for(var i = 0; i < L; i += 1)	{
					thisCatSafeID = data.value[i].id;
					if(data.value[i].id[1] == '$')	{
						//ignore 'lists', which start with .$
//						app.u.dump(" -> list! "+data.value[i].id);
						}
					else if(!data.value[i].pretty || data.value[i].pretty.charAt(0) == '!')	{
						//categories that start with ! are 'hidden' and should not be displayed.
						}
					else if(!$.isEmptyObject(app.data['appCategoryDetail|'+thisCatSafeID]))	{
						$tag.append(app.renderFunctions.transmogrify({'id':thisCatSafeID,'catsafeid':thisCatSafeID},data.bindData.loadsTemplate,app.data['appCategoryDetail|'+thisCatSafeID]));
						}
					else	{
						app.u.dump("WARNING - subcategoryList reference to appCategoryDetail|"+thisCatSafeID+" was an empty object.");
						}
					}
				}, //subcategoryList

//if first char is a !, hide that char, then render as text. used in breadcrumb
//likely to be used in prodcats if/when it's built.s
			catText : function($tag,data)	{
				if(data.value[0] == '!')	{data.value = data.value.substring(1)}
				app.renderFormats.text($tag,data)
				},
//### later, we could make this more advanced to actually search the attribute. add something like elasticAttr:prod_mfg and if set, key off that.
			searchLink : function($tag,data){
				var keywords = data.value.replace(/ /g,"+");
				if(data.bindData.elasticAttr){
					app.u.dump(data.bindData.elasticAttr.split(" "));
					var attributes = data.bindData.elasticAttr.split(" ");
					
					
					$tag.append("<span class='underline pointer'>"+data.value+"<\/span>").bind('click',function(){
						showContent('search',{'KEYWORDS':keywords, 'ATTRIBUTES' : attributes})
						});
				} else {
					$tag.append("<span class='underline pointer'>"+data.value+"<\/span>").bind('click',function(){
						showContent('search',{'KEYWORDS':keywords})
						});
				}
				}, //searchLink


			addPicSlider : function($tag,data)	{
//				app.u.dump("BEGIN myRIA.renderFormats.addPicSlider: "+data.value);
				if(typeof app.data['appProductGet|'+data.value] == 'object')	{
					var pdata = app.data['appProductGet|'+data.value]['%attribs'];
//if image 1 or 2 isn't set, likely there are no secondary images. stop.
					if(app.u.isSet(pdata['zoovy:prod_image1']) && app.u.isSet(pdata['zoovy:prod_image2']))	{
						$tag.attr('data-pid',data.value); //no params are passed into picSlider function, so pid is added to tag for easy ref.
//						app.u.dump(" -> image1 ["+pdata['zoovy:prod_image1']+"] and image2 ["+pdata['zoovy:prod_image2']+"] both are set.");
//adding this as part of mouseenter means pics won't be downloaded till/unless needed.
// no anonymous function in mouseenter. We'll need this fixed to ensure no double add (most likely) if template re-rendered.
//							$tag.unbind('mouseenter.myslider'); // ensure event is only binded once.
							$tag.bind('mouseenter.myslider',app.ext.myRIA.u.addPicSlider2UL).bind('mouseleave',function(){window.slider.kill()})
						}
					}
				},

			youtubeThumbnail : function($tag,data)	{
				$tag.attr('src',"https://i3.ytimg.com/vi/"+data.value+"/default.jpg");
				return true;
				}, //legacyURLToRIA

// used for a product list of an elastic search results set. a results object and category page product list array are structured differently.
// when using @products in a categoryDetail object, use productList as the renderFormat
// this function gets executed after the request has been made, in the showPageContent response. for this reason it should NOT BE MOVED to store_search
// ## this needs to be upgraded to use app.ext.store_search.u.getElasticResultsAsJQObject
			productSearch : function($tag,data)	{
				app.u.dump("BEGIN myRIA.renderFormats.productSearch");
				data.bindData = app.renderFunctions.parseDataBind($tag.attr('data-bind'));
				app.u.dump(data);
				if(data.value)	{
					var parentID = $tag.attr('id');
					var L = data.value.hits.hits.length;
					var templateID = data.bindData.loadsTemplate ? data.bindData.loadsTemplate : 'productListTemplateResults';
					var pid;
					if(data.value.hits.total)	{
						for(var i = 0; i < L; i += 1)	{
							pid = data.value.hits.hits[i]['_id'];
							$tag.append(app.renderFunctions.transmogrify({'id':parentID+'_'+pid,'pid':pid},templateID,data.value.hits.hits[i]['_source']));
							}
						
						if(data.bindData.before) {$tag.before(data.bindData.before)} //used for html
						if(data.bindData.after) {$tag.after(data.bindData.after)}
						if(data.bindData.wrap) {$tag.wrap(data.bindData.wrap)}		
						}
					}
				else	{} //no value, so do nothing.
				},

/*
data.value in a banner element is passed in as a string of key value pairs:
LINK, ALT and IMG
The value of link could be a hash (anchor) or a url (full or relative) so we try to guess.
fallback is to just output the value.
*/

			banner : function($tag, data)	{
//				app.u.dump("begin myRIA.renderFormats.banner");
				var obj = app.u.getParametersAsObject(decodeURI(data.value)); //returns an object LINK, ALT and IMG
				var hash; //used to store the href value in hash syntax. ex: #company?show=return
				var pageInfo = {};
				
				
//				app.u.dump(" -> obj.LINK: "+obj.LINK);
				
//if value starts with a #, then most likely the hash syntax is being used.
				if(obj.LINK && obj.LINK.indexOf('#') == 0)	{
					hash = obj.LINK;
					pageInfo = app.ext.myRIA.u.getPageInfoFromHash(hash);
					}
// Initially attempted to do some sort of validating to see if this was likely to be a intra-store link.
//  && data.value.indexOf('/') == -1 || data.value.indexOf('http') == -1 || data.value.indexOf('www') > -1
				else if(obj.LINK)	{
					pageInfo = app.ext.myRIA.u.detectRelevantInfoToPage(obj.LINK);
					if(pageInfo.pageType)	{
						hash = app.ext.myRIA.u.getHashFromPageInfo(pageInfo);
						}
					else	{
						hash = obj.LINK
						}
					}
				else	{
					//obj.link is not set
					}
				if(!app.u.isSet(obj.IMG))	{$tag.remove()} //if the image isn't set, don't show the banner. if a banner is set, then unset, val may = ALT=&IMG=&LINK=
 				else	{
//if we don't have a valid pageInfo object AND a valid hash, then we'll default to what's in the obj.LINK value.
					$tag.attr('alt',obj.ALT);
//if the link isn't set, no href is added. This is better because no 'pointer' is then on the image which isn't linked.
					if(obj.LINK)	{
//						app.u.dump(" -> obj.LINK is set: "+obj.LINK);
						var $a = $("<a />").addClass('bannerBind').attr({'href':hash,'title':obj.ALT});
						if(pageInfo && pageInfo.pageType)	{
							$a.click(function(){
								return showContent('',pageInfo)
								})
							}
						$tag.wrap($a);
						}
					data.value = obj.IMG; //this will enable the image itself to be rendered by the default image handler. recycling is good.
					app.renderFormats.imageURL($tag,data);
					}
				}, //banner
				
//could be used for some legacy upgrades that used the old textbox/image element combo to create a banner.
			legacyURLToRIA : function($tag,data)	{
				if(data.value == '#')	{
					$tag.removeClass('pointer');
					}
				else	{
					var pageInfo = app.ext.myRIA.u.detectRelevantInfoToPage(data.value);
					pageInfo.back = 0;
					$tag.addClass('pointer').click(function(){
						return app.ext.myRIA.a.showContent('',pageInfo);
						});
					}
				}, //legacyURLToRIA


//pass in the sku for the bindata.value so that the original data object can be referenced for additional fields.
// will show price, then if the msrp is MORE than the price, it'll show that and the savings/percentage.
			priceRetailSavingsDifference : function($tag,data)	{
				var o; //output generated.
				var pData = app.data['appProductGet|'+data.value]['%attribs'];
	//use original pdata vars for display of price/msrp. use parseInts for savings computation only.
				var price = Number(pData['zoovy:base_price']);
				var msrp = Number(pData['zoovy:prod_msrp']);
				if(price > 0 && (msrp - price > 0))	{
					o = app.u.formatMoney(msrp-price,'$',2,true)
					$tag.append(o);
					}
				else	{
					$tag.hide(); //if msrp > price, don't show savings because it'll be negative.
					}
				}, //priceRetailSavings		


//pass in the sku for the bindata.value so that the original data object can be referenced for additional fields.
// will show price, then if the msrp is MORE than the price, it'll show that and the savings/percentage.
			priceRetailSavingsPercentage : function($tag,data)	{
				var o; //output generated.
				var pData = app.data['appProductGet|'+data.value]['%attribs'];
	//use original pdata vars for display of price/msrp. use parseInts for savings computation only.
				var price = Number(pData['zoovy:base_price']);
				var msrp = Number(pData['zoovy:prod_msrp']);
				if(price > 0 && (msrp - price > 0))	{
					var savings = (( msrp - price ) / msrp) * 100;
					o = savings.toFixed(0)+'%';
					$tag.append(o);
					}
				else	{
					$tag.hide(); //if msrp > price, don't show savings because it'll be negative.
					}
				} //priceRetailSavings	
			
			}, //renderFormats



////////////////////////////////////   ACTION [a]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {


//loads page content. pass in a type: category, product, customer or help
// and a page info: catSafeID, sku, customer admin page (ex: newsletter) or 'returns' (respectively to the line above.
// myria.vars.session is where some user experience data is stored, such as recent searches or recently viewed items.
// -> unshift is used in the case of 'recent' so that the 0 spot always holds the most recent and also so the length can be maintained (kept to a reasonable #).
			showContent : function(pageType,infoObj)	{
//				app.u.dump("BEGIN showContent ["+pageType+"]."); app.u.dump(infoObj);
/*
what is returned. is set to true if pop/pushState NOT supported. 
if the onclick is set to return showContent(... then it will return false for browser that support push/pop state but true
for legacy browsers. That means old browsers will use the anchor to retain 'back' button functionality.
*/
				var r = false;
				var $old = $("#mainContentArea :visible:first"); //used for transition (actual and validation).
//clicking to links (two product, for example) in a short period of time was rendering both pages at the same time.
//this will fix that and only show the last clicked item. state of the world render this code obsolete.
				if($old.length)	{
					$old.siblings().hide(); //make sure only one 'page' is visible.
					}
				app.ext.myRIA.u.closeAllModals();  //important cuz a 'showpage' could get executed via wiki in a modal window.

				if(typeof infoObj != 'object')	{infoObj = {}} //could be empty for a cart or checkout

//if pageType isn't passed in, we're likely in a popState, so look in infoObj.
				if(pageType){infoObj.pageType = pageType} //pageType
				else if(pageType == '')	{pageType = infoObj.pageType}

				app.ext.myRIA.u.handleSearchInput(pageType);

//set some defaults.
				infoObj.back = infoObj.back == 0 ? infoObj.back : -1; //0 is no 'back' action. -1 will add a pushState or hash change.
				infoObj.performTransition = infoObj.performTransition || app.ext.myRIA.u.showtransition(infoObj,$old); //specific instances skip transition.
				infoObj.state = 'onInits'; //needed for handleTemplateFunctions.

//if there's history (all pages loads after first, execute the onDeparts functions.
//must be run before handleSandHOTW or history[0] will be this infoObj, not the last one.
				if(!$.isEmptyObject(app.ext.myRIA.vars.hotw[0]))	{
					app.ext.myRIA.u.handleTemplateFunctions($.extend(app.ext.myRIA.vars.hotw[0],{"state":"onDeparts"}))
					}
				app.ext.myRIA.u.handleSandHOTW(infoObj);

//				app.u.dump("showContent.infoObj: "); app.u.dump(infoObj);
				switch(pageType)	{

					case 'product':
	//add item to recently viewed list IF it is not already in the list.				
						if($.inArray(infoObj.pid,app.ext.myRIA.vars.session.recentlyViewedItems) < 0)	{
							app.ext.myRIA.vars.session.recentlyViewedItems.unshift(infoObj.pid);
							}
						infoObj.parentID = app.ext.myRIA.u.showProd(infoObj);
						break;
	
					case 'homepage':
						infoObj.pageType = 'homepage';
						infoObj.navcat = zGlobals.appSettings.rootcat;
						infoObj.parentID = app.ext.myRIA.u.showPage(infoObj);
						break;

					case 'category':
//add item to recently viewed list IF it is not already the most recent in the list.				
//Originally, used: 						if($.inArray(infoObj.navcat,app.ext.myRIA.vars.session.recentCategories) < 0)
//bad mojo because spot 0 in array isn't necessarily the most recently viewed category, which it should be.
						if(app.ext.myRIA.vars.session.recentCategories[0] != infoObj.navcat)	{
							app.ext.myRIA.vars.session.recentCategories.unshift(infoObj.navcat);
							}
						
						infoObj.parentID = app.ext.myRIA.u.showPage(infoObj); //### look into having showPage return infoObj instead of just parentID.
						break;
	
					case 'search':
	//					app.u.dump(" -> Got to search case.");	
						app.ext.myRIA.u.showSearch(infoObj);
						infoObj.parentID = 'mainContentArea_search';
						break;
	
					case 'customer':
						if('file:' == document.location.protocol || 'https:' == document.location.protocol)	{
							var performJumpToTop = app.ext.myRIA.u.showCustomer(infoObj);
							infoObj.performJumpToTop = infoObj.performJumpToTop || performJumpToTop;
							}
						else	{
							$('#mainContentArea').empty().addClass('loadingBG').html("<h1>Transferring to Secure Login...</h1>");
							var SSLlocation = app.vars.secureURL+"?sessionId="+app.sessionId;
							SSLlocation += "#customer?show="+infoObj.show
							_gaq.push(['_link', SSLlocation]); //for cross domain tracking.
							document.location = SSLlocation;
							}
						infoObj.parentID = 'mainContentArea_customer';
						break;
	
					case 'checkout':
//						app.u.dump("PROTOCOL: "+document.location.protocol);
						infoObj.parentID = 'checkoutContainer'; //parent gets created within checkout. that id is hard coded in the checkout extensions.
						infoObj.templateID = 'checkoutTemplate'
						infoObj.state = 'onInits'; //needed for handleTemplateFunctions.
						app.ext.myRIA.u.handleTemplateFunctions(infoObj);

//for local, don't jump to secure. !!! discuss w/ b.
						if('file:' == document.location.protocol)	{
							app.ext.convertSessionToOrder.calls.startCheckout.init('mainContentArea');
							}
						else if('https:' != document.location.protocol)	{
							app.u.dump(" -> nonsecure session. switch to secure for checkout.");
// if we redirect to ssl for checkout, it's a new url and a pushstate isn't needed, so a param is added to the url.
							$('#mainContentArea').addClass('loadingBG').html("<h1>Transferring you to a secure session for checkout.<\/h1><h2>Our app will reload shortly...<\/h2>");
							var SSLlocation = app.vars.secureURL+"?sessionId="+app.sessionId+"#checkout?show=checkout";
							_gaq.push(['_link', SSLlocation]); //for cross domain tracking.
							document.location = SSLlocation;
							}
						else	{
							app.ext.convertSessionToOrder.calls.startCheckout.init('mainContentArea');
							}
						infoObj.state = 'onCompletes'; //needed for handleTemplateFunctions.
						app.ext.myRIA.u.handleTemplateFunctions(infoObj);

						break;
	
					case 'company':
						infoObj.parentID = 'mainContentArea_company';
						app.ext.myRIA.u.showCompany(infoObj);
						break;
	
					case 'cart':
//						infoObj.mode = 'modal';
						infoObj.back = 0; //no popstate or hash change since it's opening in a modal.
						infoObj.performJumpToTop = false; //dont jump to top.
//						app.ext.myRIA.u.showPage('.'); //commented out.
						app.ext.myRIA.u.showCart(infoObj);
						break;

					case '404': 	//no specific code. shared w/ default, however a case is present because it is a recognized pageType.
					default:		//uh oh. what are we? default to 404.
						infoObj.pageType = '404';
						infoObj.back = 0;
						infoObj.templateID = 'pageNotFoundTemplate'
						infoObj.state = 'onInits'; //needed for handleTemplateFunctions.
						app.ext.myRIA.u.handleTemplateFunctions(infoObj);

						$('#mainContentArea').append(app.renderFunctions.transmogrify('page404',infoObj.templateID,infoObj));
						
						infoObj.state = 'onCompletes'; //needed for handleTemplateFunctions.
						app.ext.myRIA.u.handleTemplateFunctions(infoObj);
					}
//this is low so that the individual 'shows' above can set a different default and if nothing is set, it'll default to true here.
				infoObj.performJumpToTop = (infoObj.performJumpToTop === false) ? false : true; //specific instances jump to top. these are passed in (usually related to modals).
//				app.u.dump(" -> infoObj.performJumpToTop: "+infoObj.performJumpToTop);
				r = app.ext.myRIA.u.addPushState(infoObj);
				
//r will = true if pushState isn't working (IE or local). so the hash is updated instead.
//				app.u.dump(" -> R: "+r+" and infoObj.back: "+infoObj.back);
				if(r == true && infoObj.back == -1)	{
					var hash = app.ext.myRIA.u.getHashFromPageInfo(infoObj);
//					app.u.dump(" -> hash from infoObj: "+hash);
//see if hash on URI matches what it should be and if not, change. This will only impact browsers w/out push/pop state support.
					if(hash != window.location.hash)	{
						_ignoreHashChange = true; //make sure changing the hash doesn't execute our hashChange code.
						window.location.hash = hash;
						}
					}

				if(infoObj.performJumpToTop)	{$('html, body').animate({scrollTop : 0},1000)} //new page content loading. scroll to top.				
//transition appPreView out on init.
				if($('#appPreView').is(':visible'))	{
//					app.ext.myRIA.pageTransition($('#appPreView'),$('#appView'));
					$('#appPreView').slideUp(1000,function(){
						$('#'+infoObj.parentID).show(); //have to show content area here because the slideDown will only make the parent visible
						$('#appView').slideDown(3000);
						});
					}
				else if(infoObj.performTransition == false)	{
					
					}
				else if(infoObj.parentID && typeof app.ext.myRIA.pageTransition == 'function')	{

app.ext.myRIA.pageTransition($old,$('#'+infoObj.parentID));
//					
//					$("#mainContentArea :visible:first").slideUp(2000,function(){
//						$('#'+infoObj.parentID,'#mainContentArea').slideDown(2000); //hide currently visible content area.
//						}); //hide currently visible content area.
					}
				else if(infoObj.parentID)	{
//no page transition specified. hide old content, show new. fancy schmancy.
					$("#mainContentArea :visible:first").hide();
					$('#'+infoObj.parentID).show();
					}
				else	{
					app.u.dump("WARNING! in showContent and no parentID is set for the element being translated.");
					}


				return false; //always return false so the default action (href) is cancelled. hashstate will address the change.
				}, //showContent

/*
add as an action to a button.
First check to see if item is purchaseable. If not, jump to product detail page. could be that inventory/variations weren't retrieved or that the item is a parent.
If item has variations, will go to detail page.
if item has no variations and does have inventory, will add to cart.
supports same actions as default add to cart.
assumes product record is in memory.
*/
/*
			add2CartOrDetails : function(sku,P)	{
P.pageType = 'product';
P.pid = sku;
if(sku && app.data['appProductGet|'+sku])	{
	if(app.ext.store_product.u.productIsPurchaseable(sku))	{
		if(app.data['appProductGet|'+sku]['@variations'] && $.isEmptyObject(app.data['appProductGet|'+sku]['@variations'])	{showContent(P);} //either variations weren't retrieved or item HAS variations. 
		else if(){}
	else	{
//for some reason, the item isn't purchaseable. could be that it's a parent, that variations or inventory haven't been retrieved. jump to detail page.
		showContent(P);
		}
	}
else	{
	app.u.throwMessage("Oops. It seems we weren't quite ready for you to do that or the developer made a mistake. Please try again momentarily and if the error persists, please let us know. <br />err: sku ["+sku+"] not passed into myRIA.u.add2CartOrDetails or data not in memory.");
	}
				
				},

*/
//for now, only product is supported in quickview. This may change in the future.
//Required Params:  pageType, pid and templateID.
//no defaulting on template id because that'll make expanding this to support other page types more difficult.
//assumes data to be displayed is already in memory.
			quickView : function(pageType,infoObj){

				if(pageType && infoObj && infoObj.templateID)	{
					if(pageType == 'product' && infoObj.pid)	{
						app.ext.store_product.u.prodDataInModal(infoObj);
						_gaq.push(['_trackEvent','Quickview','User Event','product',infoObj.pid]);
						}
						
					else if(pageType == 'category' && infoObj.navcat)	{
						app.ext.myRIA.u.showPageInDialog (infoObj)
						_gaq.push(['_trackEvent','Quickview','User Event','category',infoObj.navcat]);
						}
						
					else	{
						app.u.throwGMessage("Based on pageType, some other variable is required (ex: pid for pageType = product). infoObj follows: "); app.u.dump(infoObj);
						}
					
					}
				else	{
					app.u.throwGMessage("quickView was missing either a pageType ["+pageType+"] or infoObj.templateID: "); app.u.dump(infoObj);
					}
				return false;
				},

/*
required:
P.stid
P.listID (buyer list id)
*/
			removeItemFromBuyerList : function(P,tagObj)	{
//				app.u.dump(P);
				if(P.stid && P.listID)	{
					app.ext.store_crm.calls.buyerProductListRemoveFrom.init(P.listID,P.stid,tagObj,'immutable');
					app.ext.store_crm.calls.buyerProductListDetail.init(P.listID,{},'immutable'); //update list in memory
					app.model.dispatchThis('immutable');
					if(tagObj.parentID) {$('#'+tagObj.parentID).empty().remove();}
					_gaq.push(['_trackEvent','Manage buyer list','User Event','item removed',P.stid]);
					}
				else	{
					app.u.throwGMessage("ERROR! either stid ["+P.stid+"] or listID ["+P.listID+"] not passed into myRIA.a.removeItemFromBuyerList.",P.parentID)
					}
				},
			
//guts of this found here: http://www.dynamicdrive.com/dynamicindex9/addbook.htm
			bookmarkThis : function()	{
				var url = window.location;
				var title = url;
				if (window.sidebar) // firefox
					window.sidebar.addPanel(title, url, "");
			
				else if(window.opera && window.print){ // opera
					var elem = document.createElement('a');
					elem.setAttribute('href',url);
					elem.setAttribute('title',title);
					elem.setAttribute('rel','sidebar');
					elem.click();
					}
			
				else if(document.all)// ie
					window.external.AddFavorite(url, title);
	
				
				},


			showYoutubeInModal : function(videoid)	{
				var $ele = $('#youtubeVideoModal');
				if($ele.length == 0)	{
					$ele = $("<div />").attr('id','youtubeVideoModal').appendTo('body');
					}
				$ele.empty().append("<iframe style='z-index:1;' width='560' height='315' src='https://www.youtube.com/embed/"+videoid+"' frameborder='0' allowfullscreen></iframe>"); //clear any past videos.
				$ele.dialog({
					modal:true,
					width:600,
					height:400,
					'close' : function(event, ui){$(this).dialog('destroy').remove()},
					autoOpen:false
					});
				$ele.dialog('open');
				return false;
				},

//P.listid and p.sku are required.
//optional params include: qty, priority, note, and replace. see API docs for explanation.
			add2BuyerList : function(P){
				app.u.dump("BEGIN myria.a.add2BuyerList");
				var authState = app.u.determineAuthentication();
				app.u.dump("authState: "+authState);
				if(typeof P != 'object' || !P.pid || !P.listid)	{
					app.u.throwMessage("Uh Oh! Something went wrong. Please try that again or contact the site administrator if error persists. err: required param for add2buyerList was missing. see console for details.");
					app.u.dump("ERROR! params missing for add2BuyerList. listid and pid required. params: "); app.u.dump(P);
					}
				else if(authState && authState == 'none')	{
					app.ext.myRIA.u.showLoginModal();
					$('#loginSuccessContainer').empty(); //empty any existing login messaging (errors/warnings/etc)
//this code is here instead of in showLoginModal (currently) because the 'showCustomer' code is bound to the 'close' on the modal.
					$('<button>').addClass('stdMargin ui-state-default ui-corner-all  ui-state-active').attr('id','modalLoginContinueButton').text('Add Item to List').click(function(){
						$('#loginFormForModal').dialog('close');
						app.ext.myRIA.a.add2BuyerList(P) //will re-execute function so after successful login, item is actually submitted to list.
						}).appendTo($('#loginSuccessContainer'));	
					}
				else	{
					var parentID = 'listUpdateMsgContainer';
					var $parent = $('#'+parentID)
					if($parent.length == 0)	{
						$parent = $("<div><div class='appMessaging'></div></div>").attr({'id':parentID,'title':'List Activity'}).appendTo('body');
						$parent.dialog({'autoOpen':false});
						}
					$parent.dialog('open');
					var msg = app.u.statusMsgObject('adding item '+P.pid+' to list: '+P.listid);
					msg.parentID = parentID;
					app.u.throwMessage(msg);
					app.ext.store_crm.calls.buyerProductListAppendTo.init(P,{'parentID':parentID,'callback':'showMessaging','message':'Item '+P.pid+' successfully added to list: '+P.listid},'immutable');
					app.model.dispatchThis('immutable');
					_gaq.push(['_trackEvent','Manage buyer list','User Event','item added',P.pid]);
					}
				},


//assumes the faq are already in memory.
			showFAQbyTopic : function(topicID)	{
				app.u.dump("BEGIN showFAQbyTopic ["+topicID+"]");
				var templateID = 'faqQnATemplate'
				
				if(!topicID)	{
					app.u.throwMessage("Uh Oh. It seems an app error occured. Error: no topic id. see console for details.");
					app.u.dump("a required parameter (topicID) was left blank for myRIA.a.showFAQbyTopic");
					}
				else if(!app.data['appFAQs'] || $.isEmptyObject(app.data['appFAQs']['@detail']))	{
					app.u.dump(" -> No data is present");
					}
				else	{
					var $target = $('#faqDetails4Topic_'+topicID).toggle();
					if($target.children().length)	{} //if children are present, this faq topic has been opened before or is empty. no need to re-render content.
					else	{
						var L = app.data['appFAQs']['@detail'].length;
						app.u.dump(" -> total #faq: "+L);
						for(var i = 0; i < L; i += 1)	{
							if(app.data['appFAQs']['@detail'][i]['TOPIC_ID'] == topicID)	{
								app.u.dump(" -> faqid matches topic: "+app.data['appFAQs']['@detail'][i]['ID']);
								$target.append(app.renderFunctions.transmogrify({'id':topicID+'_'+app.data['appFAQs']['@detail'][i]['ID'],'data-faqid':+app.data['appFAQs']['@detail'][i]['ID']},templateID,app.data['appFAQs']['@detail'][i]))
								}
							}
						}
					}
				} //showFAQbyTopic
		
		
			}, //action [a]




////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {

//executed when the app loads.  
//sets a default behavior of loading homepage. Can be overridden by passing in infoObj.
			handleAppInit : function(infoObj)	{

//!!! need to write/test this in IE7
//				if(app.u.getBrowserInfo().indexOf('explorer') > -1)	{}
				
				var L = app.rq.length-1;
				for(var i = L; i >= 0; i -= 1)	{
					app.u.handleResourceQ(app.rq[i]);
					app.rq.splice(i, 1); //remove once handled.
					}
				app.rq.push = app.u.handleResourceQ; //reassign push function to auto-add the resource.
				if(typeof infoObj != 'object')	{infoObj = {}}
				infoObj = this.detectRelevantInfoToPage(window.location.href); 
				infoObj.back = 0; //skip adding a pushState on initial page load.
//getParams wants string to start w/ ? but doesn't need/want all the domain url crap.
				infoObj.uriParams = app.u.getParametersAsObject('?'+window.location.href.split('?')[1]);
				if(infoObj.uriParams.meta)	{
					app.calls.cartSet.init({'cart/refer':infoObj.uriParams.meta},{},'passive');
					}

				if(infoObj.uriParams.meta_src)	{
					app.calls.cartSet.init({'cart/refer_src':infoObj.uriParams.meta_src},{},'passive');
					}

//				app.u.dump(" -> infoObj follows:");
//				app.u.dump(infoObj);
				app.ext.myRIA.a.showContent('',infoObj);
				return infoObj //returning this saves some additional looking up in the appInit
				},
//handle State and History Of The World.
//will change what state of the world is (infoObj) and add it to History of the world.
//will make sure history keeps only last 15 states.
			handleSandHOTW : function(infoObj){
				app.ext.myRIA.vars.sotw = infoObj;
				app.ext.myRIA.vars.hotw.unshift(infoObj);
				app.ext.myRIA.vars.hotw.pop(); //remove last entry in array. is created with array(15) so this will limit the size.
				},
			
			showtransition : function(infoObj,$old)	{
				var r = true; //what is returned.
//				app.u.dump(" -> $old.data('templateid'): "+$old.data('templateid'));
//				app.u.dump(" -> infoObj: "); app.u.dump(infoObj);
//				app.u.dump(" -> $old.data('catsafeid'): "+$old.data('catsafeid'));
//				app.u.dump(" -> infoObj.navcat: "+infoObj.navcat);
//search, customer and company contain 'articles' (pages within pages) so when moving from one company to another company, skip the transition
// or the content is likely to be hidden. execute scroll to top unless transition implicitly turned off (will happen with modals).
				if(infoObj.pageType == 'cart'){r = false; app.u.dump('fail 0');}
				else if(infoObj.pageType == 'category' && $old.data('templateid') == 'categoryTemplate' && $old.data('catsafeid') == infoObj.navcat){r = false; app.u.dump("fail 1");}
				else if(infoObj.pageType == 'category' && $old.data('templateid') == 'homepageTemplate' && $old.data('catsafeid') == infoObj.navcat){r = false; app.u.dump("fail 2");}
				else if(infoObj.pageType == 'product' && $old.data('templateid') == 'productTemplate' && $old.data('pid') == infoObj.pid){r = false; app.u.dump("fail 3");}
				else if($old.data('templateid') == 'companyTemplate' && infoObj.pageType == 'company')	{r = false; app.u.dump("fail 4");}
				else if($old.data('templateid') == 'customerTemplate' && infoObj.pageType == 'customer')	{r = false; app.u.dump("fail 5");}
				else if($old.data('templateid') == 'searchTemplate' && infoObj.pageType == 'search')	{r = false; app.u.dump("fail 6");}
				else if(!app.u.determineAuthentication() && this.thisArticleRequiresLogin(infoObj))	{
					r = false; //if the login modal is displayed, don't animate or it may show up off screen.
					}
				else	{

					}
//				app.u.dump(" -> R: "+r);
				return r;
				},
//when changing pages, make sure keywords resets to the default to avoid confusion.
			handleSearchInput : function(pageType)	{
				if(pageType != 'search' && pageType != 'cart')	{
					$('.productSearchKeyword').each(function(){
						var $this = $(this);
						if($this[0].defaultValue != $this.val())	{$this.val($this[0].defaultValue)}
						});
					}
				},
				



//obj is going to be the container around the img. probably a div.
//the internal img tag gets nuked in favor of an ordered list.
			addPicSlider2UL : function(){
//				app.u.dump("BEGIN myRIA.u.addPicSlider2UL");
				
				var $obj = $(this);
				if($obj.data('slider') == 'rendered')	{
					//do nothing. list has aready been generated.
//					app.u.dump("the slideshow has already been rendered. re-init");
					window.slider.kill(); //make sure it was nuked.
					window.slider = new imgSlider($('ul',$obj))
					}
				else	{
					$obj.data('slider','rendered'); //used to determine if the ul contents have already been added.
					var pid = $obj.attr('data-pid');
//					app.u.dump(" -> pid: "+pid);
					var data = app.data['appProductGet|'+pid]['%attribs'];
					var $img = $obj.find('img')
					var width = $img.attr('width'); //using width() and height() here caused unusual results in the makeImage function below.
					var height = $img.attr('height');
					$obj.width(width).height(height).css({'overflow':'hidden','position':'relative'});
					var $ul = $('<ul>').addClass('slideMe').css({'height':height+'px','width':'20000px'}); /* inline width to override inheretance */
					
					var $li; //recycled.
					for(var i = 2; i <= 10; i += 1)	{
						if(data['zoovy:prod_image'+i])	{
							$li = $('<li>').append(app.u.makeImage({"name":data['zoovy:prod_image'+i],"w":width,"h":height,"b":"FFFFFF","tag":1}));
							$li.appendTo($ul);
							}
						else	{break} //end loop at first empty image spot.
						}
					$li = $("<li>").append($img);
					$ul.prepend($li); //move the original image to the front of the list instead of re-requesting it. prevents a 'flicker' from happening
					$obj.append($ul); //kill existing image. will b replaced w/ imagery in ul.
//					$img.remove(); //get rid of original img instance.
					window.slider = new imgSlider($('ul',$obj))
					}
				},	
				
			changeCursor : function(style)	{
//				app.u.dump("BEGIN myRIA.u.changeCursor ["+style+"]");
				$('html, body').css('cursor',style);
				},

//executed on initial app load AND in some elements where user/merchant defined urls are present (banners).
// Determines what page is in focus and returns appropriate object (r.pageType)
// if no page content can be determined based on the url, the hash is examined and if appropriately formed, used (ex: #company?show=contact or #category?navcat=.something)
// should be renamed getPageInfoFromURL
			detectRelevantInfoToPage : function(URL)	{
				var r = {}; //what is returned. r.pageInfo and r.navcat or r.show or r.pid
				var url = URL; //leave original intact.
				var hashObj;
				if(url.indexOf('#') > -1)	{
					var tmp = url.split("#");
					url = tmp[0]; //strip off everything after hash (#)
					hashObj = this.getPageInfoFromHash(tmp[1]); //will be an object if the hash was a valid pageInfo anchor. otherwise false.
					}

				if(url.indexOf('?') > -1) {
					var tmp = url.split('?')[1];
					r.uriParams = tmp; //a simple string of uri params. used to add back onto uri in pushState.
					url = url.split('?')[0] //get rid of any uri vars.
					} //keep the params handy 

				if(url.indexOf('/product/') > -1)	{
					r.pageType = 'product';
					r.pid = url.split('/product/')[1]; //should be left with SKU or SKU/something_seo_friendly.html
					if(r.pid.indexOf('/') > 0)	{r.pid = r.pid.split('/')[0];} //should be left with only SKU by this point.
					}
				else if(url.indexOf('/category/') > -1)	{
					r.pageType = 'category'
					r.navcat = url.split('/category/')[1]; //left with category.safe.id or category.safe.id/

					if(r.navcat.charAt(r.navcat.length-1) == '/')	{r.navcat = r.navcat.slice(0, -1)} //strip trailing /
					if(r.navcat.charAt(0) != '.')	{r.navcat = '.'+r.navcat}
					}
				else if(url.indexOf('/customer/') > -1)	{
					r.pageType = 'customer'
					r.show = url.split('/customer/')[1]; //left with order_summary or order_summary/
					if(r.show.charAt(r.show.length-1) == '/')	{r.show = r.show.slice(0, -1)} //strip trailing /
					}
				else if(url.indexOf('/company/') > -1)	{
					r.pageType = 'company'
					r.show = url.split('/company/')[1]; //left with order_summary or order_summary/
					if(r.show.charAt(r.show.length-1) == '/')	{r.show = r.show.slice(0, -1)} //strip trailing /
					}
//use hash. check before homepage so something.com#checkout or index.html#checkout doesn't load homepage.
				else if(!$.isEmptyObject(hashObj))	{
					r = hashObj;
					}
//quickstart is here so a user doesn't see a page not found error by default.
				else if(url.indexOf('index.html') > -1)	{
					r.pageType = 'homepage'
					r.navcat = zGlobals.appSettings.rootcat; //left with category.safe.id or category.safe.id/
					}
				else if(url.indexOf('quickstart.html') > -1)	{
					var msg = app.u.errMsgObject('Rename this file as index.html to decrease the likelyhood of accidentally saving over it.',"MVC-INIT-MYRIA_1000")
					msg.persistant = true;
					app.u.throwMessage(msg);
					r.pageType = 'homepage';
					}
//the url in the domain may or may not have a slash at the end. Check for both
				else if(url == zGlobals.appSettings.http_app_url || url+"/" == zGlobals.appSettings.http_app_url || url == zGlobals.appSettings.https_app_url || url+"/" == zGlobals.appSettings.https_app_url)	{
					r.pageType = 'homepage'
					r.navcat = zGlobals.appSettings.rootcat; //left with category.safe.id or category.safe.id/
					}
				else	{
//					alert('Got to else case.');
					r.pageType = '404';
					}
//				app.u.dump("detectRelevantInfoToPage = ");
//				app.u.dump(r);
				return r;
				},





/*

#########################################     FUNCTIONS FOR DEALING WITH pageInfo obj and/or HASH

*/

//pass in a pageInfo object and a valid hash will be returned.
// EX:  pass: {pageType:company,show:contact} and return: #company?show=contact
// EX:  pass: {pageType:product,pid:TEST} and return: #product?pid=TEST
// if a valid hash can't be built, false is returned.

			getHashFromPageInfo : function(infoObj)	{
//				app.u.dump("BEGIN myRIA.u.getHashFromPageInfo");
				var r = false; //what is returned. either false if no match or hash (#company?show=contact)
				if(this.thisPageInfoIsValid(infoObj))	{
					if(infoObj.pageType == 'product' && infoObj.pid)	{r = '#product?pid='+infoObj.pid}
					else if(infoObj.pageType == 'category' && infoObj.navcat)	{r = '#category?navcat='+infoObj.navcat}
					else if(infoObj.pageType == 'homepage')	{r = ''}
					else if(infoObj.pageType == 'cart')	{r = '#cart?show='+infoObj.show}
					else if(infoObj.pageType == 'checkout')	{r = '#checkout?show='+infoObj.show}
					else if(infoObj.pageType == 'search' && infoObj.KEYWORDS)	{r = '#search?KEYWORDS='+infoObj.KEYWORDS}
					else if(infoObj.pageType && infoObj.show)	{r = '#'+infoObj.pageType+'?show='+infoObj.show}
					else	{
						//shouldn't get here because pageInfo was already validated. but just in case...
						app.u.dump("WARNING! invalid pageInfo object passed into getHashFromPageInfo. infoObj: ");
						app.u.dump(infoObj);
						}
					}
				else	{
					app.u.dump("WARNING! invalid pageInfo object passed into getHashFromPageInfo. infoObj: ");
					app.u.dump(infoObj);
					}
				return r;
				},

//will return a t/f based on whether or not the object passed in is a valid pageInfo object.
//ex: category requires navcat. company requires show.
			thisPageInfoIsValid : function(infoObj)	{
				var r = false; //what is returned. boolean.
				if($.isEmptyObject(infoObj))	{
					//can't have an empty object.
					app.u.dump("WARNING! thisPageInfoIsValid did not receive a valid object.");
					}
				else if(infoObj.pageType)	{
					if(infoObj.pageType == 'product' && infoObj.pid)	{r = true}
					else if(infoObj.pageType == 'category' && infoObj.navcat)	{r = true}
					else if(infoObj.pageType == 'homepage')	{r = true}
					else if(infoObj.pageType == 'cart')	{r = true}
					else if(infoObj.pageType == 'checkout')	{r = true}
					else if(infoObj.pageType == 'search' && infoObj.KEYWORDS)	{r = true}
					else if(infoObj.pageType == 'customer' && infoObj.show)	{r = true}
					else if(infoObj.pageType == 'company' && infoObj.show)	{r = true}
					else	{
						//no matching params for specified pageType
						app.u.dump("WARNING! thisPageInfoIsValid had no matching params for specified pageType ["+infoObj.pageType+"]");
						}
					}
				else{
					app.u.dump("WARNING! thisPageInfoIsValid did not receive a pageType");
					}
//				app.u.dump(" -> thisPageInfoIsValid.r = "+r);
				return r;
				},

//pass in a hash string and a valid pageInfo object will be returned.
// EX:  pass: #company?show=contact and return: {pageType:company,show:contact}
// EX:  pass: #product?pid=TEST and return: {pageType:product,pid:TEST}
// if the hash is not a valid pageInfo, false is returned.


			getPageInfoFromHash : function(HASH)	{
				var myHash = HASH;
//make sure first character isn't a #. location.hash is used a lot and ie8 (maybe more) include # in value.
				if(myHash.indexOf('#') == 0)	{myHash = myHash.substring(1);}
				var infoObj = {}; //what is returned. infoObj.pageType and based on value of page type, infoObj.show or infoObj.pid or infoObj.navcat, etc
				var splits = myHash.split('?'); //array where 0 = 'company' or 'search' and 1 = show=returns or keywords=red
				infoObj = app.u.getParametersAsObject(splits[1]); //will set infoObj.show=something or infoObj.pid=PID
				infoObj.pageType = splits[0];
				if(!infoObj.pageType || !this.thisPageInfoIsValid(infoObj))	{
					infoObj = false;
					}
				return infoObj;
				},



//pass in a pageInfo obj and a relative path will be returned.
//EX:  pass: {pageType:category,navcat:.something} 		return: /category/something/
//used in add push state and also for addthis.
// ### should be renamed getURLFromPageInfo
			buildRelativePath : function(infoObj)	{
				var relativePath; //what is returned.
				switch(infoObj.pageType)	{
				case 'homepage' :
					relativePath = '';
					break;
				case 'product':
					relativePath = 'product/'+infoObj.pid+'/';
					break;
				case 'category':

//don't want /category/.something, wants /category/something
//but the period is needed for passing into the pushstate.
					var noPrePeriod = infoObj.navcat.charAt(0) == '.' ? infoObj.navcat.substr(1) : infoObj.navcat; 
					relativePath = 'category/'+noPrePeriod+'/';
					break;
				case 'customer':
					relativePath = 'customer/'+infoObj.show+'/';
					break;

				case 'checkout':
					relativePath = '#checkout?show=checkout';
					break;
				case 'cart':
					relativePath = '#cart?show=cart';
					break;

				case 'search':
					relativePath = '#search?KEYWORDS='+infoObj.KEYWORDS
					break;

				case 'company':
					relativePath = '#company?show='+infoObj.show;
					break;

				default:
					//uh oh. what are we?
					relativePath = infoObj.show;
					}
				return relativePath;
				},



//a generic function for guessing what type of object is being dealt with. Check for common params.  
			whatAmIFor : function(infoObj)	{
//				app.u.dump("BEGIN myRIA.u.whatAmIFor");
//				app.u.dump(infoObj);
				var r = false; //what is returned
				if(infoObj.pid)	{r = 'product'}
				else if(infoObj.catSafeID == zGlobals.appSettings.rootcat){r = 'homepage'}
				else if(infoObj.navcat == zGlobals.appSettings.rootcat){r = 'homepage'}
				else if(infoObj.catSafeID){r = 'category'}
				else if(infoObj.keywords || infoObj.KEYWORDS){r = 'search'}
				else if(infoObj.navcat){r = 'category'}
				else if(infoObj.path){ r = 'category'}
				else if(infoObj.page && infoObj.page.indexOf('/customer/') > 0)	{r = 'customer'}
				else if(infoObj.page)	{r = 'company'}
				else if(infoObj.pageType == 'cart')	{r = 'cart'}
				else if(infoObj.show == 'cart')	{r = 'cart'}
				else if(infoObj.pageType == 'checkout')	{r = 'checkout'}
				else if(infoObj.show == 'checkout')	{r = 'checkout'}
				else if(infoObj.page)	{r = 'company'}
				return r;
				},
				
				

/*

#########################################     FUNCTIONS FOR DEALING WITH CHANGING URL or HASH (popstate)

*/

				
				
//Executed instead of handlePopState if popState isn't supporeted (ex: IE < 10).
// from the hash, formatted as #company?show=returns, it determines pageType (company)
// a pageInfo (pio) object is created and validated (pageInfo will be set to false if invalid)
//showcontent is NOT executed if pio is not valid (otherwise every anchor would execute a showContent - that would be bad.)
// _ignoreHashChange is set to true if the hash is changed w/ js instead of an anchor or some other browser related event.
// this keeps the code inside handleHashState from being triggered when no update desired.
// ex: showContent changes hash state executed and location.hash doesn't match new pageInfo hash. but we don't want to retrigger showContent from the hash change.

			handleHashState : function()	{
//				app.u.dump("BEGIN myRIA.u.handleHashState");
				var hash = window.location.hash;
				var pio = this.getPageInfoFromHash(hash); //if not valid pageInfo hash, false is returned
//				app.u.dump(" -> hash: "+hash);
				if(!$.isEmptyObject(pio) && _ignoreHashChange === false)	{
					showContent('',pio);
					}
				_ignoreHashChange = false; //always return to false so it isn't "left on" by accident.
				},

//infoObj is an object that gets passed into a pushState in 'addPushState'.  pageType and pageInfo are the only two params currently.
//https://developer.mozilla.org/en/DOM/window.onpopstate
			handlePopState : function(infoObj)	{
//				app.u.dump("BEGIN handlePopState");
//				app.u.dump(infoObj);

//on initial load, infoObj will be blank.
				if(infoObj)	{
					infoObj.back = 0;
					app.ext.myRIA.a.showContent('',infoObj);
//					app.u.dump("POPSTATE Executed.  pageType = "+infoObj.pageType+" and pageInfo = "+infoObj.pageInfo);
					}
				else	{
//					app.u.dump(" -> no event.state (infoObj) defined.");
					}
				},



//pass in the 'state' object. ex: {'pid':'somesku'} or 'catSafeID':'.some.safe.path'
//will add a pushstate to the browser for the back button and change the URL
//http://spoiledmilk.dk/blog/html5-changing-the-browser-url-without-refreshing-page
//when a page is initially loaded or reloaded, infoObj.back is set to zero. This won't stop the addition of a popState, but will instead replace the most recent popstate.
//this ensures there is always a popstate (content won't get loaded properly if there's no object) and that no duplicates are created.


			addPushState : function(infoObj)	{
//				app.u.dump("BEGIN addPushState. ");
				var useAnchor = false; //what is returned. set to true if pushState not supported
				var title = infoObj.pageInfo;
				var historyFunction = infoObj.back == 0 ? 'replaceState' : 'pushState'; //could be changed to replaceState if back == 0;
				var fullpath = ''; //set to blank by default so += does not start w/ undefined
//for 404 pages, leave url as is for troubleshooting purposes (more easily track down why page is 404)	
				if(infoObj.pageType == '404')	{
					fullpath = window.location.href;
					}
				else	{
					if('https:' == document.location.protocol)	{
						fullpath = zGlobals.appSettings.https_app_url;
						}
					else	{
						fullpath = zGlobals.appSettings.http_app_url;
						}
	//				app.u.dump(infoObj);
	//handle cases where the homepage is treated like a category page. happens in breadcrumb.
					if(infoObj.navcat == '.')	{
						infoObj.pageType = 'homepage'
						}
					else	{
						fullpath += this.buildRelativePath(infoObj);
						}
					if(typeof infoObj.uriParams == 'string' && app.u.isSet(infoObj.uriParams) )	{fullpath += '?'+infoObj.uriParams} //add params back on to url.
					else if(typeof infoObj.uriParams == 'object' && !$.isEmptyObject(infoObj.uriParams)) {
//will convert uri param object into uri friendly key value pairs.						
						fullpath += '?';
						var params = $.map(infoObj.uriParams, function(n, i){
							return i+"="+n;
							}).join("&");
						fullpath += params;
						}
					}
//!!! need to find an IE8 friendly way of doing this.  This code caused a script error					
//				document.getElementsByTagName('title')[0].innerHTML = fullpath; //doing this w/ jquery caused IE8 to error. test if changed.

				try	{
					window.history[historyFunction](infoObj, title, fullpath);
					}
				catch(err)	{
					//Handle errors here
					useAnchor = true;
					}
				return useAnchor;
				},




/*

#########################################     FUNCTIONS FOR DEALING WITH EDITABLE

*/


			makeRegionEditable : function($parent){
var r; //what is returned. # of editable elements.				
//info on editable can be found here: https://github.com/tuupola/jquery_jeditable
$parent.find('.editable').each(function(){
	r += 1; //incremented for each editable element.
	var $text = $(this)
	if($text.attr('title'))	{
		$text.before("<label><br />"+$text.attr('title')+": </label>"); //br is in label so on cancel when label is hidden, display returns to normal.
		}
	var defaultValue = $text.text(); //saved to data.defaultValue and used to compare the post-editing value to the original so that if no change occurs, .edited class not added. Also used for restoring default value
//	app.u.dump(" -> defaultValue: "+defaultValue);
	$text.addClass('editEnabled').data('defaultValue',defaultValue).editable(function(value,settings){
//onSubmit code:
		if(value == $(this).data('defaultValue'))	{
			$(this).removeClass('editing');
			app.u.dump("field edited. no change.")
			}
		else	{
			$(this).addClass('edited').removeClass('editing');
			app.u.dump("NOTE - this needs to update the change log");
			}
		return value;
		}, {
		  indicator : 'loading...', //can be img tag
		  onblur : 'submit',
		  type : 'text',
		  style  : 'inherit'
		  }); //editable
	}); //each

return r;
				
				
				}, //makeRegionEditable



//restore a series of elements from jeditable back to a normal html block.
			destroyEditable : function($parent)	{
				$('.edited',$parent).each(function(){
					$(this).text($(this).data('defaultValue')).removeClass('edited'); //restore defaults
					})
				$('.editable',$parent).removeClass('editEnabled').editable('destroy');
				$('label',$parent).empty().remove(); //removed so if edit is clicked again, duplicates aren't created.
				}, //destroyEditable


//This will get all the key value pairs from $parent, even if the value didn't change.
//useful when all params in an update must be set, such as address update.
			getAllDataFromEditable : function($parent)	{
				var obj = {}; //what is returned. either an empty object or an assoc of key/value pairs where key = attribute and value = new value
				$parent.find('[data-bind]').each(function(){
					var bindData = app.renderFunctions.parseDataBind($(this).attr('data-bind'));
					obj[app.renderFunctions.parseDataVar(bindData['var'])] = $(this).text();
//in jeditable, if you edit then click 'save' directly, the .text() val hasn't been updated yet.
//so this'll search for the input value. if additional (more than just text input) are supported later, this wil need to be updated.
					if(!$(this).text())
						obj[app.renderFunctions.parseDataVar(bindData['var'])] = $(this).find('input').val()
					});
				return obj;	
				},





/*

#########################################     FUNCTIONS FOR DEALING WITH PAGE CONTENT (SHOW)

*/


//rather than having all the params in the dom, just call this function. makes updating easier too.
			showProd : function(infoObj)	{
				var pid = infoObj.pid
				var parentID = null; //what is returned. will be set to parent id if a pid is defined.
//				app.u.dump("BEGIN myRIA.u.showProd ["+pid+"]");
				if(!app.u.isSet(pid))	{
					app.u.throwMessage("Uh Oh. It seems an app error occured. Error: no product id. see console for details.",true);
					app.u.dump("ERROR! showProd had no infoObj.pid.  infoObj:"); app.u.dump(infoObj);
					}
				else	{
					infoObj.templateID = infoObj.templateID || 'productTemplate';
					infoObj.state = 'onInits'
					parentID = infoObj.templateID+"_"+app.u.makeSafeHTMLId(pid);
					app.ext.myRIA.u.handleTemplateFunctions(infoObj);
//no need to render template again.
					if(!$('#'+parentID).length){
						var $content = app.renderFunctions.createTemplateInstance(infoObj.templateID,parentID)
						$content.addClass('displayNone'); //hidden by default for page transitions
						$('#mainContentArea').append($content);

//need to obtain the breadcrumb info pretty early in the process as well.
						if(app.ext.myRIA.vars.session.recentCategories.length > 0)	{
							app.ext.store_navcats.u.addQueries4BreadcrumbToQ(app.ext.myRIA.vars.session.recentCategories[0])
							}

						app.ext.store_product.calls.appReviewsList.init(pid);  //store_product... appProductGet DOES get reviews. store_navcats...getProd does not.
						app.ext.store_product.calls.appProductGet.init(pid,{'callback':'showProd','extension':'myRIA','parentID':parentID,'templateID':'productTemplate'});
						app.model.dispatchThis();
						}
					else	{
//typically, the onCompletes get handled as part of the request callback, but the template has already been rendered so the callback won't get executed.
						infoObj.state = 'onCompletes'; //needed for handleTemplateFunctions.
						app.ext.myRIA.u.handleTemplateFunctions(infoObj);
						}


					}
				return parentID;
				}, //showProd
				
				
//Show one of the company pages. This function gets executed by showContent.
//handleTemplateFunctions gets executed in showContent, which should always be used to execute this function.
			showCompany : function(infoObj)	{
				infoObj.show = infoObj.show ? infoObj.show : 'about'; //what page to put into focus. default to 'about us' page
//				$('#mainContentArea').empty(); //clear Existing content.
				
				infoObj.templateID = 'companyTemplate';
				infoObj.state = 'onInits';
				app.ext.myRIA.u.handleTemplateFunctions(infoObj);
				
				var parentID = 'mainContentArea_company'; //this is the id that will be assigned to the companyTemplate instance.

//only create instance once.
				if($('#mainContentArea_company').length)	{
					app.ext.myRIA.u.showArticle(infoObj);
					infoObj.state = 'onCompletes';
					app.ext.myRIA.u.handleTemplateFunctions(infoObj);
					
					}
				else	{
					var $content = app.renderFunctions.createTemplateInstance(infoObj.templateID,parentID);
					$content.addClass("displayNone");
					$('#mainContentArea').append($content);
					app.ext.myRIA.u.bindNav('#sideline a');
					app.calls.appProfileInfo.init({'profile':app.vars.profile},{'callback':'showCompany','extension':'myRIA','infoObj':infoObj,'parentID':parentID},'mutable');
					app.model.dispatchThis();
					}
					

				}, //showCompany
				
				
			showSearch : function(infoObj)	{
//				app.u.dump("BEGIN myRIA.u.showSearch. infoObj follows: ");
//				app.u.dump(infoObj);
				infoObj.templateID = 'searchTemplate'
				infoObj.state = 'onInits';
				app.ext.myRIA.u.handleTemplateFunctions(infoObj);

//only create instance once.
				if($('#mainContentArea_search').length)	{}
				else	{
					$('#mainContentArea').append(app.renderFunctions.createTemplateInstance(infoObj.templateID,'mainContentArea_search'))
					}

				

//add item to recently viewed list IF it is not already in the list.

//I believe this should build datapointer and use fetchData?  Otherwise more complex queries will not be accessible.
				if($.inArray(infoObj.KEYWORDS,app.ext.myRIA.vars.session.recentSearches) < 0)	{
					app.ext.myRIA.vars.session.recentSearches.unshift(infoObj.KEYWORDS);
					}
				app.ext.myRIA.u.showRecentSearches();
				if(infoObj.ATTRIBUTES) {
					app.u.dump("GOT HERE");
					app.ext.store_search.u.handleElasticQueryFilterByAttributes(infoObj.KEYWORDS,infoObj.ATTRIBUTES,{'callback':'handleElasticResults','extension':'store_search','templateID':'productListTemplateResults','parentID':'resultsProductListContainer'});
				} else {
					app.ext.store_search.u.handleElasticSimpleQuery(infoObj.KEYWORDS,{'callback':'handleElasticResults','extension':'store_search','templateID':'productListTemplateResults','parentID':'resultsProductListContainer'});
				}
//legacy search.
//				app.ext.store_search.calls.searchResult.init(infoObj,{'callback':'showResults','extension':'myRIA'});
				// DO NOT empty altSearchesLis here. wreaks havoc.
				app.model.dispatchThis();

				infoObj.state = 'onCompletes'; //needed for handleTemplateFunctions.
				app.ext.myRIA.u.handleTemplateFunctions(infoObj);

				}, //showSearch



//pio is PageInfo object
//this showCart should only be run when no cart update is being run.
//this is run from showContent.
// when a cart update is run, the handleCart response also executes the handleTemplateFunctions
			showCart : function(infoObj)	{
				if(typeof infoObj != 'object'){var infoObj = {}}
//				app.u.dump("BEGIN myRIA.u.showCart");
// ### update. if mainContentArea is empty, put the cart there. if not, show in modal.
				infoObj.templateID = 'cartTemplate'
				infoObj.state = 'onInits'; //needed for handleTemplateFunctions.
				app.ext.myRIA.u.handleTemplateFunctions(infoObj);
				app.ext.store_cart.u.showCartInModal(infoObj);
				infoObj.state = 'onCompletes'; //needed for handleTemplateFunctions.
				app.ext.myRIA.u.handleTemplateFunctions(infoObj);
				}, //showCart



//Customer pages differ from company pages. In this case, special logic is needed to determine whether or not content can be displayed based on authentication.
// plus, most of the articles require an API request for more data.
//handleTemplateFunctions gets executed in showContent, which should always be used to execute this function.
			showCustomer : function(infoObj)	{
//				app.u.dump("BEGIN showCustomer. infoObj: "); app.u.dump(infoObj);
				var r = true; //what is returned. set to false if content not shown (because use is not logged in)
				if(infoObj && infoObj.uriParams && infoObj.uriParams.cartid && infoObj.uriParams.orderid)	{
					infoObj.show = 'invoice'; //force to order view if these params are set (most likely invoice view).
					}
				else if (infoObj.show)	{
					//infoObj.show is already set.
					}
				else	{
					infoObj.show = 'newsletter'
					}
//				$('#mainContentArea').empty();
//				app.u.dump(" -> infoObj follows:"); app.u.dump(infoObj);
				var parentID = 'mainContentArea_customer'; //this is the id that will be assigned to the companyTemplate instance.
//only create instance once.
				if($('#mainContentArea_customer').length)	{}
				else	{
					$('#mainContentArea').append(app.renderFunctions.createTemplateInstance('customerTemplate',parentID))
					app.ext.myRIA.u.bindNav('#customerNav a');
					}
				
				$('#mainContentArea .textContentArea').hide(); //hide all the articles by default and we'll show the one in focus later.
				var authState = app.u.determineAuthentication();
//				app.u.dump(" -> authState:"+authState);
				
				infoObj.templateID = 'customerTemplate';
				infoObj.state = 'onInits';
				app.ext.myRIA.u.handleTemplateFunctions(infoObj);

				
				
				if(authState != 'authenticated' && this.thisArticleRequiresLogin(infoObj))	{
					r = false; // don't scroll.
					app.ext.myRIA.u.showLoginModal();
					$('#loginSuccessContainer').empty(); //empty any existing login messaging (errors/warnings/etc)
//this code is here instead of in showLoginModal (currently) because the 'showCustomer' code is bound to the 'close' on the modal.
					$('<button>').addClass('stdMargin ui-state-default ui-corner-all  ui-state-active').attr('id','modalLoginContinueButton').text('Continue').click(function(){
						$('#loginFormForModal').dialog('close');
						app.ext.myRIA.u.showCustomer(infoObj) //binding this will reload this 'page' and show the appropriate content.
						}).appendTo($('#loginSuccessContainer'));					
					}
//should only get here if the page does not require authentication or the user is logged in.
				else	{
					$('#newsletterArticle').hide(); //hide the default.
					$('#'+infoObj.show+'Article').show(); //only show content if page doesn't require authentication.
					switch(infoObj.show)	{
						case 'newsletter':
							$('#newsletterFormContainer').empty();
							app.ext.store_crm.u.showSubscribe({'parentID':'newsletterFormContainer','templateID':'subscribeFormTemplate'});
							break;

						case 'invoice':
						
							var orderID = infoObj.uriParams.orderid
							var cartID = infoObj.uriParams.cartid
							var parentSafeID = 'orderContentsTable_'+app.u.makeSafeHTMLId(orderID);
							var $invoice = $("<article />").attr('id','orderInvoiceSoloPage');
							$invoice.append(app.renderFunctions.createTemplateInstance('invoiceTemplate',parentSafeID));
							$invoice.appendTo($('#mainContentArea_customer .mainColumn'));
							app.ext.store_crm.calls.buyerOrderGet.init({'orderid':orderID,'cartid':cartID},{'callback':'translateTemplate','templateID':'invoiceTemplate','parentID':parentSafeID},'mutable');
							app.model.dispatchThis('mutable');
						
						
						
						case 'orders':
							app.ext.store_crm.calls.buyerPurchaseHistory.init({'parentID':'orderHistoryContainer','templateID':'orderLineItemTemplate','callback':'showOrderHistory','extension':'store_crm'});
							break;
						case 'lists':
							app.ext.store_crm.calls.buyerProductLists.init({'parentID':'listsContainer','callback':'showBuyerLists','extension':'myRIA'});
							break;
						case 'myaccount':
//							app.u.dump(" -> myaccount article loaded. now show addresses...");
							app.ext.store_crm.calls.buyerAddressList.init({'callback':'showAddresses','extension':'myRIA'},'mutable');
							break;
						default:
							app.u.dump("WARNING - unknown article/show ["+infoObj.show+" in showCustomer. ");
						}
					app.model.dispatchThis();
					}

				infoObj.state = 'onCompletes'; //needed for handleTemplateFunctions.
				app.ext.myRIA.u.handleTemplateFunctions(infoObj);
				$('#mainContentArea_customer').removeClass('loadingBG');
				return r;
				},  //showCustomer
				
				
//here, we error on the side of NOT requiring login. if a page does require login, the API will return that.
//this way, if a new customer page is introduced that doesn't require login, it isn't hidden.
			thisArticleRequiresLogin : function(infoObj)	{
				var r = false; //what is returned. will return true if the page requires login
				switch(infoObj.show)	{
					case 'myaccount':
					case 'changepassword':
					case 'lists':
					case 'orders':
						r = true;
						break;
					default:
						r = false;
					}
				return r;
				},


//pass in a bindNav anchor and the 'pageInfo' will be returned.
//ex #category?navcat=.something will return {pageType:category,navcat:.something}
			parseAnchor : function(str)	{
//					app.u.dump("GOT HERE");
					var tmp1 = str.substring(1).split('?');
					var P = {};
					P.pageType = tmp1[0];
					if(tmp1.length > 1){
						var tmp2 = tmp1[1].split('=');
						P[tmp2[0]] = tmp2[1];
					} else {
						// Should reach here in case of href="#homepage" (or anything with no params, but #homepage is the only use-case
					}
//					app.u.dump(P);
					return P;
				}, //parseAnchor
			
//selector is a jquery selector. could be as simple as .someClass or #someID li a
//will add an onclick event of showContent().  uses the href value to set params.
//href should be ="#customer?show=myaccount" or "#company?show=shipping" or #product?pid=PRODUCTID" or #category?navcat=.some.cat.id
			bindNav : function(selector)	{
//				app.u.dump("BEGIN bindNav ("+selector+")");
				$(selector).each(function(){
					var $this = $(this);
//					app.u.dump($this.attr('href'));
					var P = app.ext.myRIA.u.parseAnchor($this.attr('href'));
					if(P.pageType == 'category' && P.navcat && P.navcat != '.'){
//for bindnavs, get info to have handy. add to passive Q and It'll get dispatched by a setInterval.
app.ext.store_navcats.calls.appCategoryDetailMax.init(P.navcat,{},'passive');
						}
					$this.click(function(event){
//						event.preventDefault(); //cancels any action on the href. keeps anchor from jumping.
						return app.ext.myRIA.a.showContent('',P)
						});
					});
				}, //bindNav

/*
will close any open modals. 
by closing modals only (instead of all dialogs), we can use dialogs to show information that we want to allow the
buyer to 'take with them' as they move between  pages.
*/
			closeAllModals : function(){
//				app.u.dump("BEGIN myRIA.u.closeAllModals");
				$(".ui-dialog-content").each(function(){
					var $dialog = $(this);
///					app.u.dump(" -> $dialog.dialog('option','dialog'): "); app.u.dump($dialog.dialog('option','dialog'));
					if($dialog.dialog( "option", "modal" ))	{
						$dialog.dialog("close"); //close all modal windows.
						}
					});
				},
		
			showLoginModal : function()	{
//make sure form is showing and previous messaging is removed/reset.
				$('#loginSuccessContainer').hide(); //contains 'continue' button.
				$('#loginMessaging, #recoverPasswordMessaging').empty(); //used for success and fail messaging.
				$('#loginFormContainer, #recoverPasswordContainer').show(); //contains actual form and password recovery form (second id)
				$('#loginFormForModal').dialog({modal: true,width:550,autoOpen:false});
				$('#loginFormForModal').dialog('open');
				
		
				}, //showLoginModal

//executed from showCompany (used to be used for customer too)
//articles should exist inside their respective pageInfo templates (companyTemplate or customerTemplate)
//NOTE - as of version 201225, the parameter no longer has to be a string (subject), but can be an object. This allows for uri params or any other data to get passed in.
			showArticle : function(infoObj)	{
//				app.u.dump("BEGIN myRIA.u.showArticle"); app.u.dump(infoObj);
				$('#mainContentArea .textContentArea').hide(); //hide all the articles by default and we'll show the one in focus later.
				
				var subject;
				if(typeof infoObj == 'object')	{
					subject = infoObj.show
					$('.sideline .navLink_'+subject).addClass('ui-state-highlight');
					}
				else if(typeof infoObj == 'string')	{subject = infoObj}
				else	{
					app.u.dump("WARNING - unknown type for 'infoObj' ["+typeof infoObj+"] in showArticle")
					}
				if(subject)	{
//					$('html, body').animate({scrollTop : 0},1000); //scroll up.
					$('#'+subject+'Article').show(); //only show content if page doesn't require authentication.
					switch(subject)	{
						case 'faq':
							app.ext.store_crm.calls.appFAQsAll.init({'parentID':'faqContent','callback':'showFAQTopics','extension':'store_crm','templateID':'faqTopicTemplate'});
							app.model.dispatchThis();
							break;
						default:
							//the default action is handled in the 'show()' above. it happens for all.
						}
					}
				else	{
					app.u.dump("WARNING! - no article/show set for showArticle");
					}
				},

			showRecentSearches : function()	{
				var o = ''; //output. what's added to the recentSearchesList ul
				var L = app.ext.myRIA.vars.session.recentSearches.length;
				var keywords,count;
				for(var i = 0; i < L; i++)	{
					keywords = app.ext.myRIA.vars.session.recentSearches[i];
//					app.u.dump(" -> app.data['searchResult|"+keywords+"'] and typeof = "+typeof app.data['searchResult|'+keywords]);
					count = $.isEmptyObject(app.data['appPublicSearch|'+keywords]) ? '' : app.data['appPublicSearch|'+keywords]['_count']
					if(app.u.isSet(count))	{
						count = " ("+count+")";
						}
//					app.u.dump(" -> adding "+keywords+" to list of recent searches");
// 
					o += "<li><a href='#' onClick=\"$('.productSearchKeyword').val('"+keywords+"'); showContent('search',{'KEYWORDS':'"+keywords+"'}); return false;\">"+keywords+count+"<\/a><\/li>";
					}
				$('#recentSearchesList').html(o);
				},

			showPageInDialog : function(infoObj)	{
				if(infoObj.templateID && infoObj.navcat)	{
					infoObj.dialogID = infoObj.templateID+'_'+app.u.makeSafeHTMLId(infoObj.navcat)+"_dialog";
//dialog can be set to true and will use default settings or it can be set to an object of supported dialog parameters.
					infoObj.dialog = $.isEmptyObject(infoObj.dialog) ? {modal: true,width:'86%',height:$(window).height() - 100} : infoObj.dialog; 
					infoObj.dialog.autoOpen = false; //always set to false, then opened below. fixes some issues with re-opening the same id in a modal.
					var $parent = app.u.handleParentForDialog(infoObj.dialogID,infoObj.title);
					infoObj.parentID = infoObj.dialogID+"_content"; //the parentID passed in is the modal ID. this is for the contents and needs to be different so showPage knows whether it has been rendered before or not.
					this.showPage(infoObj);
					$parent.dialog(infoObj.dialog);
					$parent.dialog('open');
					}
				else	{
					app.u.dump("WARNING! either templateID ["+infoObj.templateID+"] or navcat ["+infoObj.navcat+"] not passed into showPageInDialog");
					}
				return infoObj;
				},

//best practice would be to NOT call this function directly. call showContent.

			showPage : function(infoObj)	{
				//app.u.dump("BEGIN myRIA.u.showPage("+infoObj.navcat+")");
				var r = null; //what is returned. will be set to parent id, if all required data is present.
				var catSafeID = infoObj.navcat;
				if(!catSafeID)	{
					app.u.throwGMessage("no navcat passed into myRIA.showPage");
					}
				else	{
					if(infoObj.templateID){
						//templateID 'forced'. use it.
						}
						
					else if(catSafeID == zGlobals.appSettings.rootcat || infoObj.pageType == 'homepage')	{
						infoObj.templateID = 'homepageTemplate'
						}
					else	{
						infoObj.templateID = 'categoryTemplate'
						}
					infoObj.state = 'onInits';
					app.ext.myRIA.u.handleTemplateFunctions(infoObj);
					var parentID = infoObj.parentID || infoObj.templateID+'_'+app.u.makeSafeHTMLId(catSafeID);
					app.u.dump(" -> parentID: "+parentID);
//only have to create the template instance once. showContent takes care of making it visible again. but the oncompletes are handled in the callback, so they get executed here.
					if($('#'+parentID).length > 0){
						app.u.dump(" -> "+parentID+" already exists. Use it");
						infoObj.state = 'onCompletes'; //needed for handleTemplateFunctions.
						app.ext.myRIA.u.handleTemplateFunctions(infoObj);
						}
					else	{
						var $content = app.renderFunctions.createTemplateInstance(infoObj.templateID,{"id":parentID,"catsafeid":catSafeID});
//if dialog is set, we've entered this function through showPageInDialog.
//content gets added immediately to the dialog.
//otherwise, content is added to mainContentArea and hidden so that it can be displayed with a transition.
						if(infoObj.dialogID)	{$('#'+infoObj.dialogID).append($content)}
						else	{
							$content.addClass('displayNone'); //hidden by default for page transitions.
							$('#mainContentArea').append($content);
							}
						
						app.ext.store_navcats.calls.appCategoryDetailMax.init(catSafeID,{'callback':'fetchPageContent','extension':'myRIA','templateID':infoObj.templateID,'parentID':parentID});
						app.model.dispatchThis();
						}


					}
				return parentID;
				}, //showPage



//required params include templateid and either: P.navcat or P.pid  navcat can = . for homepage.
//load in a template and the necessary queries will be built.
//currently, only works on category and home page templates.
			buildQueriesFromTemplate : function(P)	{
//app.u.dump("BEGIN myRIA.u.buildQueriesFromTemplate");
//app.u.dump(P);

var numRequests = 0; //will be incremented for # of requests needed. if zero, execute showPageContent directly instead of as part of ping. returned.
var catSafeID = P.navcat;

var myAttributes = new Array(); // used to hold all the 'page' attributes that will be needed. passed into appPageGet request.
var elementID; //used as a shortcut for the tag ID, which is requied on a search element. recycled var.

var tagObj = P;  //used for ping and in handleCallback if ping is skipped.
tagObj.callback = 'showPageContent';
tagObj.searchArray = new Array(); //an array of search datapointers. added to _tag so they can be translated in showPageContent
tagObj.extension = 'myRIA'
tagObj.lists = new Array(); // all the list id's needed.


//goes through template.  Put together a list of all the data needed. Add appropriate calls to Q.
app.templates[P.templateID].find('[data-bind]').each(function()	{

	var $focusTag = $(this);
	
//proceed if data-bind has a value (not empty).
	if(app.u.isSet($focusTag.attr('data-bind'))){
		
		var bindData = app.renderFunctions.parseDataBind($focusTag.attr('data-bind')) ;
//		app.u.dump(bindData);
		var namespace = bindData['var'].split('(')[0];
		var attribute = app.renderFunctions.parseDataVar(bindData['var']);
		var tmpAttr; //recycled. used when a portion of the attribute is stipped (page.) and multiple references to trimmed var are needed.
//these get used in prodlist and subcat elements (anywhere loadstemplate is used)
		bindData.templateID = bindData.loadsTemplate;
		bindData.parentID = $focusTag.attr('id');

//		app.u.dump(" -> namespace: "+namespace);
//		app.u.dump(" -> attribute: "+attribute);
		

		if(namespace == 'elastic-native')	{
//			app.u.dump(" -> Elastic-native namespace");
			elementID = $focusTag.attr('id');
			if(elementID)	{
				numRequests += app.ext.store_search.calls.appPublicProductSearch.init(jQuery.parseJSON(attribute),{'datapointer':'appPublicSearch|'+elementID,'templateID':bindData.loadsTemplate});
				tagObj.searchArray.push('appPublicSearch|'+elementID); //keep a list of all the searches that are being done. used in callback.
				}
			}
//session is a globally recognized namespace. It's content usually doesn't require a request. the data is in memory (myRIA.vars.session)
		else if(namespace == 'session')	{

			}

//handle all the queries that are specific to a product.
//by now the product info, including variations, inventory and review 'should' already be in memory (showProd has been executed)
// the callback, showPageContent, does not run transmogrify over the product data. the lists are handled through buildProdlist, so if any new attributes
// are supported that may require a request for additional data, something will need to be added to showPageContent to handle the display.
// don't re-render entire layout. Inefficient AND will break some extensions, such as powerreviews.
		else if(P.pid)	{
			if(bindData.format == 'productList')	{
//a product list takes care of getting all it's own data.
//get the data for all the items in this attibutes list. no callback is executed because no parentID is set in params.
//					numRequests += app.ext.store_prodlist.u.getProductDataForList({'csv':app.ext.store_prodlist.u.cleanUpProductList(app.data['appProductGet|'+P.pid]['%attribs'][attribute])});
				}
				
			else if(namespace == 'reviews')	{
				//reviews is a recognized namespace, but data is already retrieved.
				}				

			else if(namespace == 'product')	{
				//do nothing here, but make sure the 'else' for unrecognized namespace isn't reached.
				}
			else	{
				app.u.throwMessage("Uh oh! unrecognized namespace ["+namespace+"] used on attribute "+attribute+" for pid "+P.pid);
				app.u.dump("ERROR! unrecognized namespace ["+namespace+"] used on attribute "+attribute+" for pid "+P.pid);
				}
			}// /p.pid


// this is a navcat in focus
		else	{
			if(namespace == 'category' &&  attribute.substring(0,5) === '%page')	{
				tmpAttr = attribute.substring(6)
				myAttributes.push(tmpAttr);  //set value to the actual value
				if(app.data['appCategoryDetail|'+catSafeID] && app.data['appCategoryDetail|'+catSafeID]['%page'])	{
					if(app.data['appCategoryDetail|'+catSafeID]['%page'][tmpAttr])	{}
					else if(app.data['appCategoryDetail|'+catSafeID]['%page'][tmpAttr] === null){}
					else	{
						myAttributes.push(tmpAttr);  //set value to the actual value
						}
					}
				else	{
					myAttributes.push(tmpAttr);  //set value to the actual value
					}				
				
				}
			else if(namespace == 'list' && attribute.charAt(0) == '$')	{
				var listPath = attribute.split('.')[0]
				tagObj.lists.push(listPath); //attribute formatted as $listname.@products
				numRequests = app.ext.store_navcats.calls.appNavcatDetail.init(listPath);
				}
			else if(namespace == 'list')	{
				// no src is set.
				app.u.throwGMessage("In myRIA.u.buildQueriesByTemplate, namespace set to list but invalid SRC ["+attribute+"] is specified... so we don't know where to get the data.");
				app.u.dump(bindData);
				}
			else if(namespace == 'category' && attribute == '@subcategoryDetail' )	{
//				app.u.dump(" -> category(@subcategoryDetail) found");
//check for the presence of subcats. if none are present, do nothing.
//if detail isn't set on the subcat, fetching subcats isn't necessary anyway.
				if(bindData.detail && typeof app.data['appCategoryDetail|'+catSafeID]['@subcategoryDetail'] == 'object' && !$.isEmptyObject(app.data['appCategoryDetail|'+catSafeID]['@subcategoryDetail']))	{
					numRequests += app.ext.store_navcats.u.getChildDataOf(catSafeID,{},'appCategoryDetailMax');
					}
				}
			else if(namespace == 'category' && bindData.format == 'breadcrumb')	{
				numRequests += app.ext.store_navcats.u.addQueries4BreadcrumbToQ(catSafeID)
				}
			else if(namespace == 'category' && bindData.format == 'productList' )	{
				//product lists take care of themselves. do nothing.
				}
			else if(namespace == 'category')	{
				// do nothing. this would be hit for something like category(pretty), which is perfectly valid but needs no additional data.
				}
			else	{
					app.u.throwMessage("Uh oh! unrecognized namespace ["+bindData['var']+"] used for pagetype "+P.pageType+" for navcat "+P.navcat);
					app.u.dump("Uh oh! unrecognized namespace ["+bindData['var']+"] used for pagetype "+P.pageType+" for navcat "+P.navcat);
				}

			}
		} //ends isset(databind).
	}); //ends each



			//app.u.dump(" -> numRequests b4 appPageGet: "+numRequests);
				if(myAttributes.length > 0)	{
					numRequests += app.ext.store_navcats.calls.appPageGet.init({'PATH':catSafeID,'@get':myAttributes});
					}
			//app.u.dump(" -> numRequests AFTER appPageGet: "+numRequests);
//queries are compiled. if a dispatch is actually needed, add a 'ping' to execute callback, otherwise, just execute the callback now.
				if(numRequests > 0)	{
					app.calls.ping.init(tagObj);
					}
				else	{
					app.ext.myRIA.callbacks.showPageContent.onSuccess(tagObj);
					}		

				return numRequests;
				}, //buildQueriesFromTemplate






			showOrderDetails : function(orderID)	{
//				app.u.dump("BEGIN myRIA.u.showOrderDetails");
				var safeID = app.u.makeSafeHTMLId(orderID);
				$orderEle = $('#orderContents_'+safeID);
//if the element is empty, then this is the first time it's been clicked. Go get the data and display it, changing classes as needed.
				if($orderEle.is(':empty'))	{

//app.u.dump(" -> first time viewing order. go get it");
$orderEle.show().addClass('ui-corner-bottom ui-accordion-content-active'); //object that will contain order detail contents.
$orderEle.append(app.renderFunctions.createTemplateInstance('invoiceTemplate','orderContentsTable_'+safeID))
$('#orderContentsTable_'+safeID).addClass('loadingBG');
if(app.ext.store_crm.calls.buyerPurchaseHistoryDetail.init(orderID,{'callback':'translateTemplate','templateID':'invoiceTemplate','parentID':'orderContentsTable_'+safeID}))
	app.model.dispatchThis();
	
$orderEle.siblings().addClass('ui-state-active').removeClass('ui-corner-bottom').find('.ui-icon-triangle-1-e').removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s');

					}

				else	{
//will only get here if the data is already loaded. show/hide panel and adjust classes.

//app.u.dump("$orderEle.is(':visible') = "+$orderEle.is(':visible'));
if($orderEle.is(':visible'))	{
	$orderEle.removeClass('ui-corner-bottom ui-accordion-content-active').hide();
	$orderEle.siblings().removeClass('ui-state-active').addClass('ui-corner-bottom').find('.ui-icon-triangle-1-s').removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-e')
	}
else	{
	$orderEle.addClass('ui-corner-bottom ui-accordion-content-active').show();
	$orderEle.siblings().addClass('ui-state-active').removeClass('ui-corner-bottom').find('.ui-icon-triangle-1-e').removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s')
	}
					}
				

				}, //showOrderDetails
	
			removeByValue : function(arr, val) {
				for(var i=0; i<arr.length; i++) {
					if(arr[i] == val) {
						arr.splice(i, 1);
						break;
						}
					}
				}, //removeByValue


			
//executed in checkout when 'next/submit' button is pushed for 'existing account' after adding an email/password. (preflight panel)
//handles inline validation
			loginFrmSubmit : function(email,password)	{
				var errors = '';
				var $errorDiv = $("#loginMessaging").empty(); //make sure error screen is empty. do not hide or callback errors won't show up.

				if(app.u.isValidEmail(email) == false){
					errors += "Please provide a valid email address<br \/>";
					}
				if(!password)	{
					errors += "Please provide your password<br \/>";
					}
					
				if(errors == ''){
					app.calls.authentication.zoovy.init({"login":email,"password":password},{'callback':'authenticateZoovyUser','extension':'myRIA'});
					app.calls.refreshCart.init({},'immutable'); //cart needs to be updated as part of authentication process.
//					app.ext.store_crm.calls.buyerProductLists.init('forgetme',{'callback':'handleForgetmeList','extension':'store_prodlist'},'immutable');
					
					app.model.dispatchThis('immutable');
					}
				else {
					$errorDiv.append(app.u.formatMessage(errors));
					}
				}, //loginFrmSubmit
			
			
//obj currently supports one param w/ two values:  action: modal|message
			handleAddToCart : function($form,obj)	{

app.u.dump("BEGIN myRIA.u.handleAddToCart")

obj = obj || {};

if($form && $form.length)	{
	var sfo = $form.serializeJSON(); //Serialized Form Object.
	var pid = sfo.product_id;  //shortcut
	$('.atcButton',$form).addClass('disabled ui-disabled').attr('disabled','disabled');
	if(app.ext.store_product.validate.addToCart(pid))	{
//this product call displays the messaging regardless, but the modal opens over it, so that's fine.
		app.ext.store_product.calls.cartItemsAdd.init(sfo,{'callback':'itemAddedToCart','extension':'myRIA'});
		if(obj.action && obj.action == 'modal')	{
// ??? update to use showCart instead of handling templateFunctions here?			
			app.ext.myRIA.u.handleTemplateFunctions({'state':'onInits','templateID':'cartTemplate'}); //oncompletes handled in callback.
			app.ext.store_cart.u.showCartInModal({'showLoading':true});
			app.calls.refreshCart.init({'callback':'handleCart','extension':'myRIA','parentID':'modalCartContents','templateID':'cartTemplate'},'immutable');
			}
		else	{
			app.calls.refreshCart.init({'callback':'updateMCLineItems','extension':'myRIA'},'immutable');
			}
		app.model.dispatchThis('immutable');
		}
	else	{
		$('.atcButton',$form).removeClass('disabled ui-disabled').removeAttr('disabled');
		}
	}
else	{
	app.u.throwGMessage("WARNING! add to cart $form has no length. can not add to cart.");
	}

				}, //handleAddToCart
				
//app.ext.myRIA.u.handleMinicartUpdate();			
			handleMinicartUpdate : function(tagObj)	{
//				app.u.dump("BEGIN myRIA.u.handleMinicartUPdate"); app.u.dump(tagObj);
				var r = false; //what's returned. t for cart updated, f for no update.
				var $appView = $('#appView');
				var itemCount = 0;
				var subtotal = 0;
				var total = 0;
				if(app.data[tagObj.datapointer] && app.data[tagObj.datapointer].sum)	{
					r = true;
					var itemCount = app.u.isSet(app.data[tagObj.datapointer].sum.items_count) || 0;
					var subtotal = app.data[tagObj.datapointer].sum.items_total;
					var total = app.data[tagObj.datapointer].sum.order_total;
					}
				else	{
					//cart not in memory yet. use defaults.
					}

				$('.cartItemCount',$appView).text(itemCount);
				$('.cartSubtotal',$appView).text(app.u.formatMoney(subtotal,'$',2,false));
				$('.cartTotal',$appView).text(app.u.formatMoney(total,'$',2,false));

				//no error for cart data not being present. It's a passive function.
				return r;
				},

//This will create the arrays for each of the templates that support template functions (onCompletes, onInits and onDeparts).
// 
			createTemplateFunctions : function()	{

				app.ext.myRIA.template = {};
				var pageTemplates = new Array('categoryTemplate','productTemplate','companyTemplate','customerTemplate','homepageTemplate','searchTemplate','cartTemplate','checkoutTemplate','pageNotFoundTemplate');
				var L = pageTemplates.length;
				for(var i = 0; i < L; i += 1)	{
					app.ext.myRIA.template[pageTemplates[i]] = {"onCompletes":[],"onInits":[],"onDeparts":[]};
//these will change the cursor to 'wait' and back to normal as each template loads/finishes loading.
					app.ext.myRIA.template[pageTemplates[i]].onInits.push(function(){app.ext.myRIA.u.changeCursor('wait')});
					app.ext.myRIA.template[pageTemplates[i]].onCompletes.push(function(P){
//						app.u.dump("turn of cursor: "+P.templateID);
						app.ext.myRIA.u.changeCursor('auto')
						});
					}

				},
			
//infoObj.state = onCompletes or onInits. later, more states may be supported.
			handleTemplateFunctions : function(infoObj)	{
//				app.u.dump("BEGIN myRIA.u.handleTemplateFunctions");
//				app.u.dump(infoObj);
//in some cases, such as showContent/oninits, we may not 'know' what template is being loaded when this code is executed. try to guess.
				if(!infoObj.templateID)	{
					var couldBeType = this.whatAmIFor(infoObj);
//					app.u.dump(" -> no templateID specified. Try to guess...");
//					app.u.dump(" -> couldBeType: "+couldBeType);
					if(typeof app.templates[couldBeType+"Template"] == 'object')	{
//						app.u.dump(" -> Guessed template: "+couldBeType+"Template (which does exist)");
						infoObj.templateID = couldBeType+"Template"
						infoObj.guessedTemplateID = true;
						}
					}
				
				var r = -1; //what is returned. -1 means not everything was passed in. Otherwise, it'll return the # of functions executed.
				// template[infoObj.templateID][infoObj.state] == 'object' -> this will tell us whether the state passed in is a valid state (more or less)
				if(infoObj.templateID && infoObj.state && typeof app.ext.myRIA.template[infoObj.templateID] == 'object' && typeof app.ext.myRIA.template[infoObj.templateID][infoObj.state] == 'object')	{
//					app.u.dump(" -> templateID and State are present and state is an object.");
					r = 0;
					var FA = app.ext.myRIA.template[infoObj.templateID][infoObj.state]  //FA is Functions Array.
					if(FA.length > 0)	{
						r = true;
						for(var i = 0; i < FA.length; i += 1)	{
							FA[i](infoObj);
							r += 1;
							}
						}
					else	{
						//no action specified for this template/state
						}
					}
				else	{
					app.u.dump("WARNING! Something was not passed into handleTemplateFunctions");
					app.u.dump(" -> template ID: "+infoObj.templateID);
					app.u.dump(" -> state: "+infoObj.state);
//					app.u.dump(" -> typeof app.ext.myRIA.template[infoObj.templateID]:"+ typeof app.ext.myRIA.template[infoObj.templateID]);
//					app.u.dump(infoObj);
					}
//				app.u.dump("END myRIA.u.handleTemplateFunctions");
				return r;
				}, //handleTemplateFunctions 

//htmlObj is 'this' if you add this directly to a form input.
//this function is used in bindAppViewForms
			handleFormField : function(htmlObj)	{
//				app.u.dump("BEGIN myRIA.u.handleFormField.");
				if (htmlObj.defaultValue == htmlObj.value)
					htmlObj.value = "";
				else if(htmlObj.value == '')
					htmlObj.value = htmlObj.defaultValue;
				}, //handleFormField

//for now,classes are hard coded. later, we could support an object here that allows for id's and/or classes to be set
//the selector parameter is optional. allows for the function to be run over  a specific section of html. on init, it's run over #appView
			bindAppViewForms : function(selector)	{
//				app.u.dump("BEGIN myRIA.u.bindAppViewForms");
				selector = selector ? selector+' ' : ''; //default to blank, not undef, to avoid 'undefined' being part of jquery selectors below
//				app.u.dump(" -> selector: '"+selector+"'");
//				app.u.dump(" -> $(selector+' .handleDefault').length: "+$(selector+' .handleDefault').length);

//for any form input in appView where there is default text that should be removed onFocus and re-inserted onBlur (if no text added), assign a class of .handleDefault
				$(selector+'.handleDefault').bind('focus blur',function(event){app.ext.myRIA.u.handleFormField(this)});
		
//				app.u.dump(" -> $(selector+' .productSearchForm').length: "+$(selector+' .productSearchForm').length);

				$(selector+'.productSearchForm').submit(function(event){
					event.preventDefault(); //stops form from actually submitting.
					var infoObj = {}
					infoObj.pageType = 'search';
					infoObj.KEYWORDS = $(this).find('.productSearchKeyword').val();
					showContent('search',infoObj);
					return false;
					});

				$(selector+ '.newsletterSubscriptionForm').submit(function(event){
					event.preventDefault(); //stops form from actually submitting.
					app.ext.store_crm.u.handleSubscribe(this.id);
					return false;
					});

				} //bindAppViewForms

			
			} //util


		
		} //r object.
	return r;
	}