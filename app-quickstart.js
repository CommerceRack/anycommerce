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





var quickstart = function(_app) {
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
			'invoiceTemplate',
			'buyerListTemplate',
			'buyerListProdlistContainerTemplate',
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
//				dump('BEGIN _app.ext.quickstart.callbacks.init.onError');
				}
			},

		startMyProgram : {
			onSuccess : function()	{
//			dump("BEGIN quickstart.callback.startMyProgram");
//			dump(" -> window.onpopstate: "+typeof window.onpopstate);
//			dump(" -> window.history.pushState: "+typeof window.history.pushState);

//handle the cart. It could be passed in via _app.vars.cartID, as a URI param, localStorage or may not exist yet.
				var cartID;
				if(_app.vars.cartID)	{
					dump(" -> cartID was passed in via _app.vars.cartID");
					cartID = _app.vars.cartID;
					delete _app.vars.cartID; //leaving this here will just add confusion.
					}
				else if(cartID = _app.u.getParameterByName('cartID'))	{
					dump(' -> cart id was specified on the URI');
					}
				else if(cartID = _app.model.fetchCartID())	{
					dump(" -> cartID obtained from fetchCartID. cartid: "+cartID);
					//no need to add this cartID to the session/vars.carts, because that's where fetch gets it from.
					}
				else if(!$.support.localStorage)	{
					cartID = _app.model.readCookie('_cart'); //support browsers w/out localstorage
					}
				else	{}

				if(cartID)	{
					dump(" -> cartID is set, validate.");
					// the addCart2CM uses the 'appCartExists' datapointer. if it changes here, update the callback.
					_app.model.addDispatchToQ({"_cmd":"appCartExists",_cartid:cartID,"_tag":{"datapointer":"appCartExists","cartid":cartID,"callback":"addCart2CM","extension":"quickstart"}},"mutable");
					//do not set cart ID in session until it validates.
					}
				else	{
					dump(" -> no cart found. create a new one");
					_app.calls.appCartCreate.init({'callback':"addCart2CM","extension":'quickstart'},'mutable');
					}

//technically, a session lasts until the browser is closed. if fresh data is desired on refresh, uncomment the following few lines.
//if($.support.sessionStorage)	{
//	window.sessionStorage.clear();
//	}

_app.u.addEventDelegation($(document.body)); //if perfomance issues are noticed from adding this to the body instead of to each template, please report them.

//if ?debug=anything is on URI, show all elements with a class of debug.
if(_app.u.getParameterByName('debug'))	{
	$('.debug').show().append("<div class='clearfix'>Model Version: "+_app.model.version+" and release: "+_app.vars.release+"</div>");
	$('.debugQuickLinks','.debug').menu().css({'width':'150px'});
	$('button','.debug').button();
	$('body').css('padding-bottom',$('.debug').last().height());
	}

document.write = function(v){
	dump("document.write was executed. That's bad mojo. Rewritten to $('body').append();",'warn');
	$("body").append(v);
	}

				window.showContent = _app.ext.quickstart.a.showContent; //a shortcut for easy execution.
				window.quickView = _app.ext.quickstart.a.quickView; //a shortcut for easy execution.


//The request for appCategoryList is needed early for both the homepage list of cats and tier1.
//piggyback a few other necessary requests here to reduce # of requests
				_app.ext.store_navcats.calls.appCategoryList.init(zGlobals.appSettings.rootcat,{"callback":"showRootCategories","extension":"quickstart"},'mutable');
				_app.model.dispatchThis('mutable');
				}
			}, //startMyProgram 

		addCart2CM : {
			onSuccess : function(_rtag){
				var cartID = false;
//				_app.u.dump("BEGIN quickstart.callbacks.addCart2CM.onSuccess");
				if(_rtag.datapointer == 'appCartExists' && _app.data[_rtag.datapointer].exists)	{
					_app.u.dump(" -> existing cart is valid. add to cart manager"); 
					if($('#cartMessenger').length)	{
						cartID = _rtag.cartid;
						_app.model.addCart2Session(cartID); //this function updates _app.vars.carts
						_app.ext.cart_message.u.initCartMessenger(cartID,$('#cartMessenger')); //starts the cart message polling
						$('#cartMessenger').tlc({'verb':'translate','dataset':_app.data['cartDetail|'+cartID]}).attr('data-cartid',cartID);
						$("textarea[name='message']",'#cartmessenger').on('keypress',function(event){
							if (event.keyCode == 13) {
								$("[data-app-role='messageSubmitButton']",$(this).closest('form')).trigger('click');
								return false;
								}
							return true;
							});
						}
					else	{
						dump("#cartMessenger does NOT exist. That means the cart messaging extension won't work right.","warn");
						}
					}
				else if(_rtag.datapointer == 'appCartExists')	{
					_app.u.dump(" -> existing cart was NOT valid. Fetch a new cartid");
					_app.model.removeCartFromSession(_rtag.cartid); //this will ensure the cart isn't used again.
					_app.calls.appCartCreate.init({'callback':"addCart2CM","extension":'quickstart'},'mutable');//The cart that was passed was exired in invalid.
					}
				else	{
					_app.u.dump(" -> cart has been created.");
					//this was a appCartCreate.
					if($('#cartMessenger').length)	{
						cartID = _app.model.fetchCartID();
						_app.ext.cart_message.u.initCartMessenger(cartID,$('#cartMessenger')); //starts the cart message polling
						}
					else	{
						dump("#cartMessenger does NOT exist. That means the cart messaging extension won't work right.","warn");
						}
					}
				
				
				if(cartID)	{
					_app.model.addDispatchToQ({"_cmd":"whoAmI",_cartid : cartID, "_tag":{"datapointer":"whoAmI",callback:function(rd){
						myApp.router.init();//instantiates the router.
						_app.ext.quickstart.u.handleAppInit(); //finishes loading RQ. handles some authentication based features.
						_app.calls.refreshCart.init({'callback':'updateMCLineItems','extension':'quickstart'},'mutable');
						_app.model.dispatchThis('mutable');
						
						_app.ext.quickstart.u.bindAppNav(); //adds click handlers for the next/previous buttons (product/category feature).
	
//						if(typeof _app.u.appInitComplete == 'function'){_app.u.appInitComplete()}; //gets run after app has been init
						_app.ext.quickstart.thirdParty.init();
						
						}}},"mutable"); //used to determine if user is logged in or not.
					_app.model.dispatchThis('mutable');

					if(!$.support.localStorage)	{
						_app.model.writeCookie('_cart',cartID); //support browsers w/ localstorage disabled.
						}

					}
				
				}
			},
		
		
//optional callback  for appCategoryList in app init which will display the root level categories in element w/ id: tier1categories 
		showRootCategories : {
			onSuccess : function()	{
//				dump('BEGIN _app.ext.quickstart.callbacks.showCategories.onSuccess');
				var tagObj = {};
//we always get the tier 1 cats so they're handy, but we only do something with them out of the get if necessary (tier1categories is defined)
				if($('#tier1categories').length)	{
//					dump("#tier1categories is set. fetch tier1 cat data.");
					_app.ext.store_navcats.u.getChildDataOf(zGlobals.appSettings.rootcat,{'parentID':'tier1categories','callback':'addCatToDom','templateID':'categoryListTemplateRootCats','extension':'store_navcats'},'max');  //generate nav for 'browse'. doing a 'max' because the page will use that anway.
					_app.model.dispatchThis();
					}
				}
			}, //showRootCategories





//used for callback on showCartInModal function
//
		handleCart : 	{
			onSuccess : function(tagObj)	{
//				dump("BEGIN quickstart.callbacks.handleCart.onSuccess");
//				dump(" -> tagObj: ");	dump(tagObj);
				_app.ext.quickstart.u.handleMinicartUpdate(tagObj);
				//empty is to get rid of loading gfx.
				var $cart = tagObj.jqObj || $(_app.u.jqSelector('#',tagObj.parentID));
// * 201401 ->	removing all references to renderFunctions in favor of tlc.
//				$cart.empty().append(_app.renderFunctions.transmogrify('modalCartContents',tagObj.templateID,_app.data[tagObj.datapointer]));
				$cart.empty().tlc(tagObj)				
				tagObj.state = 'complete'; //needed for handleTemplateEvents.
				_app.renderFunctions.handleTemplateEvents($cart,tagObj);
				}
			}, //updateMCLineItems

//used in init.
		updateMCLineItems : 	{
			onSuccess : function(tagObj)	{
//				dump("BEGIN quickstart.callbacks.updateMCLineItems");
				_app.ext.quickstart.u.handleMinicartUpdate(tagObj);
				}
			}, //updateMCLineItems

		showProd : 	{
			onSuccess : function(tagObj)	{
//				dump("BEGIN quickstart.callbacks.showProd");
//				dump(tagObj);
				var tmp = _app.data[tagObj.datapointer];
				var pid = _app.data[tagObj.datapointer].pid;
				tmp.session = _app.ext.quickstart.vars.session;
				if(typeof _app.data['appReviewsList|'+pid] == 'object')	{
					tmp['reviews'] = _app.ext.store_product.u.summarizeReviews(pid); //generates a summary object (total, average)
					tmp['reviews']['@reviews'] = _app.data['appReviewsList|'+pid]['@reviews']
					}
//				dump("Rendering product template for: "+pid);
				tagObj.jqObj.tlc({'verb':'translate','dataset':tmp});
				tagObj.pid = pid;
				//build queries will validate the namespaces used AND also fetch the parent product if this item is a child.
				_app.ext.quickstart.u.buildQueriesFromTemplate(tagObj);
				_app.model.dispatchThis();
				
// SANITY - handleTemplateEvents does not get called here. It'll get executed as part of showPageContent callback, which is executed in buildQueriesFromTemplate.
				},
			onError : function(responseData,uuid)	{
//				dump(responseData);
//				$('#mainContentArea').empty();
				_app.u.throwMessage(responseData);
				}
			}, //showProd 

		handleBuyerAddressUpdate : 	{
			onSuccess : function(tagObj)	{
				dump("BEGIN quickstart.callbacks.handleBuyerAddressUpdate");
//				dump(tagObj);
				$parent = $('#'+tagObj.parentID);
				$('button',$parent).removeAttr('disabled').removeClass('ui-state-disabled');
				$('.changeLog',$parent).empty().append('Changes Saved');
				$('.edited',$parent).removeClass('edited'); //if the save button is clicked before 'exiting' the input, the edited class wasn't being removed.
				$('.buttonMenu',$parent).find('.offMenu').show();
				$('.buttonMenu',$parent).find('.onMenu').hide();
				},
			onError : function(responseData,uuid)	{
				var $parent = $('#'+tagObj.parentID);
				$('.changeLog',$parent).append(_app.u.formatResponseErrors(responseData))
				$('button',$parent).removeAttr('disabled').removeClass('ui-state-disabled');
				}
			}, //handleBuyerAddressUpdate


//used as part of showContent for the home and category pages. goes and gets all the data.
		fetchPageContent : {
			onSuccess : function(tagObj)	{
				var catSafeID = tagObj.datapointer.split('|')[1];
				tagObj.navcat = catSafeID;

// passing in unsanitized tagObj caused an issue with showPageContent
				_app.ext.quickstart.u.buildQueriesFromTemplate($.extend(true, {}, tagObj));
				_app.model.dispatchThis();
				},
			onError : function(responseData)	{
				_app.u.throwMessage(responseData);
				$('.loadingBG',$('#mainContentArea')).removeClass('loadingBG'); //nuke all loading gfx.
				_app.ext.quickstart.u.changeCursor('auto'); //revert cursor so app doesn't appear to be in waiting mode.
				}
			}, //fetchPageContent


//used as part of showContent for the home and category pages. Will display the data retrieved from fetch.
		showPageContent : {
			onSuccess : function(tagObj)	{
//				dump(" BEGIN quickstart.callbacks.onSuccess.showPageContent");
//when translating a template, only 1 dataset can be passed in, so detail and page are merged and passed in together.

//cat page handling.
				if(tagObj.navcat)	{
//					dump("BEGIN quickstart.callbacks.showPageContent ["+tagObj.navcat+"]");
					tagObj.dataset = {};
					//if no %page vars were requested, this datapointer won't be set and this would error.
					if(_app.data["appPageGet|"+tagObj.navcat] && _app.data["appPageGet|"+tagObj.navcat]['%page'])	{
						tagObj.dataset = {'%page' : _app.data['appPageGet|'+tagObj.navcat]['%page']};
						}
					//deep extend so any non-duplicates in %page are preserved.
					$.extend(true,tagObj.dataset,_app.data['appNavcatDetail|'+tagObj.navcat],{'session':_app.ext.quickstart.vars.session});
					delete tagObj.datapointer; //delete this so tlc doesn't do an unnecessary extend (data is already merged)
					tagObj.verb = 'translate';
//					dump(" -> tagObj: "); dump(tagObj);

					if(tagObj.lists && tagObj.lists.length)	{
						var L = tagObj.lists.length;
						for(var i = 0; i < L; i += 1)	{
							tagObj.dataset[tagObj.lists[i]] = _app.data['appNavcatDetail|'+tagObj.lists[i]];
							}
						}

//a category page gets translated. A product page does not because the bulk of the product data has already been output. prodlists are being handled via buildProdlist
//					_app.renderFunctions.translateTemplate(tmp,tagObj.parentID); // * 201401 ->	removing all references to renderFunctions in favor of tlc.
					tagObj.jqObj.tlc(tagObj);
					}
//product page handline
				else if(tagObj.pid)	{
// the bulk of the product translation has already occured by now (attribs, reviews and session) via callbacks.showProd.
// product lists are being handled through 'buildProductList'.
					var pData = _app.data['appProductGet|'+tagObj.pid] //shortcut.
					if(pData && pData['%attribs'] && pData['%attribs']['zoovy:grp_type'] == 'CHILD')	{
						if(pData['%attribs']['zoovy:grp_parent'] && _app.data['appProductGet|'+pData['%attribs']['zoovy:grp_parent']])	{
							dump(" -> this is a child product and the parent prod is available. Fetch child data for siblings.");
							$("[data-app-role='childrenSiblingsContainer']",$(_app.u.jqSelector('#',tagObj.parentID))).show().tlc({'verb':'translate','dataset':_app.data['appProductGet|'+pData['%attribs']['zoovy:grp_parent']]});
							}
						else if(!pData['%attribs']['zoovy:grp_parent']) 	{
							dump("WARNING! this item is a child, but no parent is set. Not a critical error.");
							}
						else	{
							dump("WARNING! Got into showPageContent callback for a CHILD item, but PARENT ["+pData['%attribs']['zoovy:grp_parent']+"] data not in memory.");
							}
						}
					else 	{} //not a child.
					}
				else	{
					dump("WARNING! showPageContent has no pid or navcat defined");
					}

				tagObj.state = 'complete'; //needed for handleTemplateEvents.
				_app.u.handleButtons(tagObj.jqObj);
				_app.u.handleCommonPlugins(tagObj.jqObj);
				_app.renderFunctions.handleTemplateEvents((tagObj.jqObj || $(_app.u.jqSelector('#',tagObj.parentID))),tagObj);
				},
			onError : function(responseData,uuid)	{
				$('#mainContentArea').removeClass('loadingBG')
				_app.u.throwMessage(responseData);
				}
			}, //showPageContent


//this is used for showing a customer list of product, such as wish or forget me lists
//formerly showlist
		buyerListAsProdlist : {
			onSuccess : function(tagObj)	{
//				dump('BEGIN _app.ext.quickstart.showList.onSuccess ');
				var listID = tagObj.datapointer.split('|')[1];
				var prods = _app.ext.store_crm.u.getSkusFromBuyerList(listID);
				if(prods.length < 1)	{
//list is empty.
					tagObj.jqObj.parent().anymessage({'message':'This list ('+listID+') appears to be empty.'});
					}
				else	{
//					dump(prods);
//					tagObj.jqObj.tlc({'verb':'translate','datapointer':tagObj.datapointer});
					_app.ext.store_prodlist.u.buildProductList({"loadsTemplate":"productListTemplateBuyerList","withInventory":1,"withVariations":1,"parentID":tagObj.parentID,"csv":prods,"hide_summary":1,"hide_pagination":1},tagObj.jqObj);
					_app.model.dispatchThis();
					}
				}
			}, //showList

//a call back to be used to show a specific list of product in a specific element.
//requires templateID and targetID to be passed on the tag object.
		showProdList : {
			onSuccess : function(tagObj)	{
//				dump("BEGIN quickstart.callbacks.showProdList");
//				dump(_app.data[tagObj.datapointer]);
				if(_app.data[tagObj.datapointer]['@products'].length < 1)	{
					$('#'+tagObj.targetID).anymessage({'message':'This list ('+listID+') appears to be empty.'});
					}
				else	{
					_app.ext.store_prodlist.u.buildProductList({"templateID":tagObj.templateID,"parentID":tagObj.targetID,"csv":_app.data[tagObj.datapointer]['@products']})
					_app.model.dispatchThis();
					}
				}
			}, //showList

		authenticateBuyer : {
			onSuccess : function(tagObj)	{
				_app.vars.cid = _app.data[tagObj.datapointer].cid; //save to a quickly referencable location.
				$('#loginSuccessContainer').show(); //contains 'continue' button.
				$('#loginMessaging').empty().show().append("Thank you, you are now logged in."); //used for success and fail messaging.
				$('#loginFormContainer').hide(); //contains actual form.
				$('#recoverPasswordContainer').hide(); //contains password recovery form.
				_app.ext.quickstart.u.handleLoginActions();
				}
			} //authenticateBuyer

		}, //callbacks



////////////////////////////////////   WIKILINKFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

/*
the wiki translator has defaults for the links built in. however, these will most likely
need to be customized on a per-ria basis.
*/
		wiki : {
			":search" : function(suffix,phrase){
				return "<a href='#' onClick=\"return showContent('search',{'KEYWORDS':'"+encodeURI(suffix)+"'}); \">"+phrase+"<\/a>";
				},
			":category" : function(suffix,phrase){
				return "<a href='#category?navcat="+suffix+"' onClick='return showContent(\"category\",{\"navcat\":\""+suffix+"\"});'>"+phrase+"<\/a>";
				},
			":product" : function(suffix,phrase){
				return "<a href='#product?pid="+suffix+"' onClick='return showContent(\"product\",{\"pid\":\""+suffix+"\"});'>"+phrase+"<\/a>";
				},
			":customer" : function(suffix,phrase){
				return "<a href='#customer?show="+suffix+"' onClick='return showContent(\"customer\",{\"show\":\""+suffix+"\"});'>"+phrase+"<\/a>";
				},

			":policy" : function(suffix,phrase){
				return "<a href='#policy?show="+suffix+"' onClick='return showContent(\"company\",{\"show\":\""+suffix+"\"});'>"+phrase+"<\/a>";
				},

			":app" : function(suffix,phrase){
				var output; //what is returned.
				if(suffix == 'contact')	{
					output = "<a href='#policy?show="+suffix+"' onClick='return showContent(\"company\",{\"show\":\""+suffix+"\"});'>"+phrase+"<\/a>";
					}
				else if(suffix == 'contact')	{
					output = "<a href='#policy?show="+suffix+"' onClick='return showContent(\"company\",{\"show\":\""+suffix+"\"});'>"+phrase+"<\/a>";
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

// * 201403 -> infoObj now passed into pageTransition.
		pageTransition : function($o,$n, infoObj)	{
//if $o doesn't exist, the animation doesn't run and the new element doesn't show up, so that needs to be accounted for.
//$o MAY be a jquery instance but have no length, so check both.
			if($o instanceof jQuery && $o.length)	{
/* *** 201403 -> move the scroll to top into the page transition for 2 reasons:
1. allows the animations to be performed sequentially, which will be less jittery than running two at the same time
2. Puts control of this into custom page transitions.
*/
				if(infoObj.performJumpToTop && $('html, body').scrollTop() > 0)	{
					//new page content loading. scroll to top.
					$('html, body').animate({scrollTop : ($('header','#appView').length ? $('header','#appView').first().height() : 0)},500,function(){
						$o.fadeOut(1000, function(){$n.fadeIn(1000)}); //fade out old, fade in new.
						})
					} 
				else	{
					$o.fadeOut(1000, function(){$n.fadeIn(1000)}); //fade out old, fade in new.
					}
				}
			else if($n instanceof jQuery)	{
				$n.fadeIn(1000);
				}
			else	{
				//hhmm  not sure how or why we got here.
				dump("WARNING! in pageTransition, neither $o nor $n were instances of jQuery.  how odd.",'warn');
				}
			}, //pageTransition



		tlcFormats : {
			
			searchbytag : function(data,thisTLC)	{
				var argObj = thisTLC.args2obj(data.command.args,data.globals); //this creates an object of the args
				var query = {"size":(argObj.size || 4),"mode":"elastic-search","filter":{"term":{"tags":argObj.tag}}};
				_app.ext.store_search.calls.appPublicProductSearch.init(query,$.extend({'datapointer':'appPublicSearch|tag|'+argObj.tag,'templateID':argObj.templateid,'extension':'store_search','callback':'handleElasticResults','list':data.globals.tags[data.globals.focusTag]},argObj));
				_app.model.dispatchThis('mutable');
				return false; //in this case, we're off to do an ajax request. so we don't continue the statement.
				}
			},


////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



		renderFormats : {

//This function works in conjuction with the showContent/showPage and buildQueriesFromTemplate functions.
//the parent and subcategory data (appNavcatDetail) must be in memory already for this to work right.
//data.value is the category object. data.bindData is the bindData obj.
			subcategorylist : function($tag,data)	{
//				dump("BEGIN control.renderFormats.subcats");
//				dump(data.value);
				var L = data.value.length;
				var thisCatSafeID; //used in the loop below to store the cat id during each iteration
	//			dump(data);
				for(var i = 0; i < L; i += 1)	{
					thisCatSafeID = data.value[i].id;
					if(data.value[i].id[1] == '$')	{
						//ignore 'lists', which start with .$
//						dump(" -> list! "+data.value[i].id);
						}
					else if(!data.value[i].pretty || data.value[i].pretty.charAt(0) == '!')	{
						//categories that start with ! are 'hidden' and should not be displayed.
						}
					else if(!$.isEmptyObject(_app.data['appNavcatDetail|'+thisCatSafeID]))	{
//						$tag.append(_app.renderFunctions.transmogrify({'id':thisCatSafeID,'catsafeid':thisCatSafeID},data.bindData.loadsTemplate,_app.data['appNavcatDetail|'+thisCatSafeID]));
						$tag.tlc({
							dataAttribs : {'id':thisCatSafeID,'catsafeid':thisCatSafeID},
							dataset : _app.data['appNavcatDetail|'+thisCatSafeID],
							templateid : data.bindData.loadsTemplate
							})
						}
					else	{
						dump("WARNING - subcategoryList reference to appNavcatDetail|"+thisCatSafeID+" was an empty object.");
						}
					}
				}, //subcategoryList

//set bind-data to val: product(zoovy:prod_is_tags) which is a comma separated list
//used for displaying a  series of tags, such as on the product detail page. Will show any tag enabled.
//on bind-data, set maxTagsShown to 1 to show only 1 tag
			tags : function($tag,data)	{
				var whitelist = new Array('IS_PREORDER','IS_DISCONTINUED','IS_SPECIALORDER','IS_SALE','IS_CLEARANCE','IS_NEWARRIVAL','IS_BESTSELLER','IS_USER1','IS_USER2','IS_USER3','IS_USER4','IS_USER5','IS_USER6','IS_USER7','IS_USER8','IS_USER9','IS_FRESH','IS_SHIPFREE');
	//			var csv = data.value.split(',');
				var L = whitelist.length;
				var tagsDisplayed = 0;
				var maxTagsShown = _app.u.isSet(data.bindData.maxTagsShown) ? data.bindData.maxTagsShown : whitelist.length; //default to showing all enabled tags.
				var spans = ""; //1 or more span tags w/ appropriate tag class applied
				for(var i = 0; i < L; i += 1)	{
					if(data.value.indexOf(whitelist[i]) >= 0 && (tagsDisplayed <= maxTagsShown))	{
						spans += "<span class='tagSprite "+whitelist[i].toLowerCase()+"'><\/span>";
						tagsDisplayed += 1;
						}
					if(tagsDisplayed >= maxTagsShown)	{break;} //exit early once enough tags are displayed.
					}
				$tag.append(spans);
				}, //tags

//if first char is a !, hide that char, then render as text. used in breadcrumb
//likely to be used in prodcats if/when it's built.s
//here, on 'could' disable the display if they didn't want hidden cats to show in the breadcrumb.
			cattext : function($tag,data)	{
//				dump(" -> value: "); dump(data.value);
				if(data.value && data.value[0] == '!')	{
					data.value = data.value.substring(1)
					}
				_app.renderFormats.text($tag,data);
				},


			cpsiawarning : function($tag,data)	{
				if(data.value)	{
					var warnings = {
						'choking_hazard_balloon' : 'Choking Hazard Balloon',
						'choking_hazard_contains_a_marble' : 'Choking Hazard contains a marble',
						'choking_hazard_contains_small_ball' : 'Choking Hazard contains a small ball',
						'choking_hazard_is_a_marble' : 'Choking Hazard is a marble', 
						'choking_hazard_is_a_small_ball' : 'Choking Hazard is a small ball',
						'choking_hazard_small_parts' : 'Choking Hazard small parts',
						'no_warning_applicable' : 'No Warning Applicable'
						};
					if(warnings[data.value])	{
						$tag.append(warnings[data.value]);
						}
					else	{
						$tag.append(data.value);
						}
					}
				},

			addpicslider : function($tag,data)	{
//				dump("BEGIN quickstart.renderFormats.addPicSlider: "+data.value);
				if(data.value && typeof _app.data['appProductGet|'+data.value] == 'object')	{
					var pdata = _app.data['appProductGet|'+data.value]['%attribs'];
//if image 1 or 2 isn't set, likely there are no secondary images. stop.
					if(_app.u.isSet(pdata['zoovy:prod_image1']) && _app.u.isSet(pdata['zoovy:prod_image2']))	{
						$tag.attr('data-pid',data.value); //no params are passed into picSlider function, so pid is added to tag for easy ref.
//						dump(" -> image1 ["+pdata['zoovy:prod_image1']+"] and image2 ["+pdata['zoovy:prod_image2']+"] both are set.");
//adding this as part of mouseenter means pics won't be downloaded till/unless needed.
// no anonymous function in mouseenter. We'll need this fixed to ensure no double add (most likely) if template re-rendered.
//							$tag.unbind('mouseenter.myslider'); // ensure event is only binded once.
							$tag.bind('mouseenter.myslider',_app.ext.quickstart.u.addPicSlider2UL).bind('mouseleave',function(){window.slider.kill()})
						}
					}
				},

//no click event is added to this. do that on a parent element so that this can be recycled.
			youtubethumbnail : function($tag,data)	{
				if(data.value)	{
					$tag.attr('src',"https://i3.ytimg.com/vi/"+data.value+"/default.jpg");
					}
				return true;
				}, //youtubeThumbnail

// used for a product list of an elastic search results set. a results object and category page product list array are structured differently.
// when using @products in a categoryDetail object, use productList as the renderFormat
// this function gets executed after the request has been made, in the showPageContent response. for this reason it should NOT BE MOVED to store_search
// ## this needs to be upgraded to use _app.ext.store_search.u.getElasticResultsAsJQObject
			productsearch : function($tag,data)	{
//				dump("BEGIN quickstart.renderFormats.productSearch");
				data.bindData = _app.renderFunctions.parseDataBind($tag.attr('data-bind'));
//				dump(data);
				if(data.value)	{
					var parentID = $tag.attr('id');

					var L = data.value.hits.hits.length;
					var templateID = data.bindData.loadsTemplate ? data.bindData.loadsTemplate : 'productListTemplateResults';
					var pid;
					if(data.value.hits.total)	{
						for(var i = 0; i < L; i += 1)	{
							pid = data.value.hits.hits[i]['_id'];
//							$tag.append(_app.renderFunctions.transmogrify({'id':parentID+'_'+pid,'pid':pid},templateID,data.value.hits.hits[i]['_source']));
							$tag.tlc({
								dataAttribs : {'id':parentID+'_'+pid,'pid':pid},
								templateid : templateID,
								dataset : data.value.hits.hits[i]['_source']
								});
							}
						
						if(data.bindData.before) {$tag.before(data.bindData.before)} //used for html
						if(data.bindData.after) {$tag.after(data.bindData.after)}
						if(data.bindData.wrap) {$tag.wrap(data.bindData.wrap)}		
						}
					}
				else	{} //no value, so do nothing.
				}, //productSearch

/*
data.value in a banner element is passed in as a string of key value pairs:
LINK, ALT and IMG
The value of link could be a hash (anchor) or a url (full or relative) so we try to guess.
fallback is to just output the value.
*/

			banner : function($tag, data)	{
				if(data.value)	{
//				dump("begin quickstart.renderFormats.banner");
					var obj = _app.u.kvp2Array(data.value), //returns an object LINK, ALT and IMG
					hash, //used to store the href value in hash syntax. ex: #company?show=return
					pageInfo = {};
					
	//if value starts with a #, then most likely the hash syntax is being used.
					if(obj.LINK && obj.LINK.indexOf('#') == 0)	{
						hash = obj.LINK;
						pageInfo = _app.ext.quickstart.u.getPageInfoFromHash(hash);
						}
	// Initially attempted to do some sort of validating to see if this was likely to be a intra-store link.
	//  && data.value.indexOf('/') == -1 || data.value.indexOf('http') == -1 || data.value.indexOf('www') > -1
					else if(obj.LINK)	{
						pageInfo = _app.ext.quickstart.u.detectRelevantInfoToPage(obj.LINK);
						if(pageInfo.pageType)	{
							hash = _app.ext.quickstart.u.getHashFromPageInfo(pageInfo);
							}
						else	{
							hash = obj.LINK
							}
						}
					else	{
						//obj.link is not set
						}
					if(!_app.u.isSet(obj.IMG))	{$tag.remove()} //if the image isn't set, don't show the banner. if a banner is set, then unset, val may = ALT=&IMG=&LINK=
					else	{
	//if we don't have a valid pageInfo object AND a valid hash, then we'll default to what's in the obj.LINK value.
						$tag.attr('alt',obj.ALT);
	//if the link isn't set, no href is added. This is better because no 'pointer' is then on the image which isn't linked.
						if(obj.LINK)	{
	//						dump(" -> obj.LINK is set: "+obj.LINK);
							var $a = $("<a />").addClass('bannerBind').attr({'href':hash,'title':obj.ALT});
							if(pageInfo && pageInfo.pageType)	{
								$a.click(function(){
									return showContent('',pageInfo)
									})
								}
							$tag.wrap($a);
							}
						data.value = obj.IMG; //this will enable the image itself to be rendered by the default image handler. recycling is good.
						_app.renderFormats.imageURL($tag,data);
						}
					}
				}, //banner

//could be used for some legacy upgrades that used the old textbox/image element combo to create a banner.
			legacyurltoria : function($tag,data)	{
				if(data.value == '#')	{
					$tag.removeClass('pointer');
					}
				else if(data.value && data.value.indexOf('#!') == 0)	{
					//link is formatted correctly. do nothing.
					}
				else if(data.value)	{
					$tag.attrib('href',_app.ext.quickstart.u.getHashFromPageInfo(_app.ext.quickstart.u.detectRelevantInfoToPage(data.value)));
					}
				else	{
					//data.value is not set. do nothing.
					}
				}, //legacyURLToRIA


//use in a cart item spec.  When clicked, button will first add the item to the wishlist and then, if that's succesful, remove the item from the cart.
// render format will also hide the button if the user is not logged in.
			movetowishlistbutton : function($tag,data)	{
//nuke remove button for coupons.
				if(data.value.stid[0] == '%')	{$tag.remove()} //coupon.
				else if(data.value.asm_master)	{$tag.remove()} //assembly 'child'.
				else if(_app.u.buyerIsAuthenticated())	{
					$tag.show().button({icons: {primary: "ui-icon-heart"},text: false});
					$tag.off('click.moveToWishlist').on('click.moveToWishList',function(){
						_app.ext.quickstart.a.moveItemFromCartToWishlist(data.value);
						});
					}
				else	{$tag.hide();}
				},


//This is for use on a category or search results page.
//changes the text on the button based on certain attributes.
//_app.ext.quickstart.u.handleAddToCart($(this),{'action':'modal'});
			addtocartbutton : function($tag,data)	{
//				dump("BEGIN store_product.renderFunctions.addtocartbutton");

//if price is not set, item isn't purchaseable. buttonState is set to 'disabled' if item isn't purchaseable or is out of stock.
				
				var className, price, buttonState, buttonText = 'Add to Cart',
				pid = data.value.pid, //...pid set in both elastic and appProductGet
				inv = _app.ext.store_product.u.getProductInventory(pid),
				$form = $tag.closest('form');
				
//				dump(" -> $form.length: "+$form.length);
				
//				if(_app.model.fetchData('appProductGet|'+pid))	{}
				if(data.bindData.isElastic)	{
					price = data.value.base_price;
// ** 201332 indexOf changed to $.inArray for IE8 compatibility, since IE8 only supports the indexOf method on Strings
					if($.inArray('IS_PREORDER', data.value.tags) > -1)	{buttonText = 'Preorder'; className = 'preorder';}
					else if($.inArray('IS_COLORFUL', data.value.tags) > -1)	{buttonText = 'Choose Color'; className = 'variational colorful';}
					else if($.inArray('IS_SIZEABLE', data.value.tags) > -1)	{buttonText = 'Choose Size'; className = 'variational sizeable';}
					else if(data.value.pogs.length > 0)	{buttonText = 'Choose Options'; className = 'variational';}
					else	{}
					//look in tags for tags. indexOf
					}
				else if(data.value['%attribs'])	{
					var pData = data.value['%attribs']; //shortcut
					price = pData['zoovy:base_price'];
					if(pData['is:preorder'])	{
						buttonText = 'Preorder'; className = 'preorder';
						}
					else if(pData['is:colorful'])	{
						buttonText = 'Choose Color'; className = 'variational colorful';
						}
					else if(pData['is:sizeable'])	{
						buttonText = 'Choose Size'; className = 'variational sizeable';
						}
//pdata is a shortcut to attribs.
//*** 201346 Must also check for product children as variations, as parent products cannot be added to cart.
					else if(!$.isEmptyObject(data.value['@variations']) || pData['zoovy:grp_children'])	{
						buttonText = 'Choose Options'; className = 'variational';
						}
					else	{
						}
					
					}

//no price and/or no inventory mean item is not purchaseable.
				if(!price)	{
					buttonState = 'disable';
					}
//*** 201352 original inventory check - if(inv...) -was short circuiting on 0/false inventory, meaning that prods with no inventory were not getting this button disabled. -mc
				else if(typeof inv !== "undefined" && (!inv || inv <= 0))	{buttonState = 'disable';}
				else{}
				
//				dump(" -> inv: "+inv);
				$tag.addClass(className).text(buttonText);
				$tag.button();
				if(buttonState)	{$tag.button(buttonState)}
				else	{
					if(buttonText.toLowerCase() == 'add to cart')	{
						$tag.on('click.detailsOrAdd',function(event){
							event.preventDefault();
							$form.trigger('submit'); //submitting the form (which has an add to cart action) instead of directly executing some action here, makes this more versatile. allows the action to be changed to support other add to cart/display cart actions.
							})
						}
					else	{
						$tag.attr({'data-hash':'#!product/'+pid,'data-app-click':'quickstart|showContent'});
						}
					}
//				dump(" -> ID at end: "+$tag.attr('id'));
				}, //addtocartbutton

//pass in the sku for the bindata.value so that the original data object can be referenced for additional fields.
// will show price, then if the msrp is MORE than the price, it'll show that and the savings/percentage.
			priceretailsavingsdifference : function($tag,data)	{
				var o; //output generated.
				var pData = data.value;
	//use original pdata vars for display of price/msrp. use parseInts for savings computation only.
				var price = Number(pData['zoovy:base_price']);
				var msrp = Number(pData['zoovy:prod_msrp']);
				if(price > 0 && (msrp - price > 0))	{
					o = _app.u.formatMoney(msrp-price,'$',2,true)
					$tag.append(o);
					}
				else	{
					$tag.hide(); //if msrp > price, don't show savings because it'll be negative.
					}
				}, //priceRetailSavings		


//pass in the sku for the bindata.value so that the original data object can be referenced for additional fields.
// will show price, then if the msrp is MORE than the price, it'll show that and the savings/percentage.
			priceretailsavingspercentage : function($tag,data)	{
				var o; //output generated.
				var pData = data.value;
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
// infoObj.back can be set to 0 to skip a URI update (will skip both hash state and popstate.) 
			showContent : function(pageType,infoObj)	{
//				dump("BEGIN showContent ["+pageType+"]."); dump(infoObj);
				infoObj = infoObj || {}; //could be empty for a cart or checkout
/*
what is returned. is set to true if pop/pushState NOT supported. 
if the onclick is set to return showContent(... then it will return false for browser that support push/pop state but true
for legacy browsers. That means old browsers will use the anchor to retain 'back' button functionality.
*/
				var
					r = false,
					$old = $("#mainContentArea :visible:first"),  //used for transition (actual and validation).
					$new;  //a jquery object returned by the 'show' functions (ex: showProd).

//clicking to links (two product, for example) in a short period of time was rendering both pages at the same time.
//this will fix that and only show the last clicked item. state of the world render this code obsolete.
				if($old.length)	{
					$old.siblings().hide(); //make sure only one 'page' is visible.
					}
				_app.ext.quickstart.u.closeAllModals();  //important cuz a 'showpage' could get executed via wiki in a modal window.

//if pageType isn't passed in, we're likely in a popState, so look in infoObj.
				if(pageType){infoObj.pageType = pageType} //pageType
				else if(pageType == '')	{pageType = infoObj.pageType}

				_app.ext.quickstart.u.handleSearchInput(pageType); //will clear keyword searches when on a non-search page, to avoid confusion.

//set some defaults.
				infoObj.back = infoObj.back == 0 ? infoObj.back : -1; //0 is no 'back' action. -1 will add a pushState or hash change.
				infoObj.performTransition = infoObj.performTransition || _app.ext.quickstart.u.showtransition(infoObj,$old); //specific instances skip transition.
				infoObj.state = 'init'; //needed for handleTemplateEvents.

//if there's history (all pages loads after first, execute the onDeparts functions.
//must be run before handleSandHOTW or history[0] will be this infoObj, not the last one.
				if(!$.isEmptyObject(_app.ext.quickstart.vars.hotw[0]))	{
					_app.renderFunctions.handleTemplateEvents($old,$.extend(_app.ext.quickstart.vars.hotw[0],{"state":"depart"}))
					}
					
				_app.ext.quickstart.u.handleSandHOTW(infoObj);
//handles the appnav. the ...data function must be run first because the display function uses params set by the function.
				_app.ext.quickstart.u.handleAppNavData(infoObj);
				_app.ext.quickstart.u.handleAppNavDisplay(infoObj);

				switch(pageType)	{

					case 'product':
	//add item to recently viewed list IF it is not already in the list.				
						if($.inArray(infoObj.pid,_app.ext.quickstart.vars.session.recentlyViewedItems) < 0)	{
							_app.ext.quickstart.vars.session.recentlyViewedItems.unshift(infoObj.pid);
							}
						else	{
// ** 201332 indexOf changed to $.inArray for IE8 compatibility, since IE8 only supports the indexOf method on Strings
							//the item is already in the list. move it to the front.
							_app.ext.quickstart.vars.session.recentlyViewedItems.splice(0, 0, _app.ext.quickstart.vars.session.recentlyViewedItems.splice($.inArray(infoObj.pid, _app.ext.quickstart.vars.session.recentlyViewedItems), 1)[0]);
							}
						$new = _app.ext.quickstart.u.showProd(infoObj);
						break;
	
					case 'homepage':
						infoObj.pageType = 'homepage';
						infoObj.navcat = zGlobals.appSettings.rootcat;
						$new = _app.ext.quickstart.u.showPage(infoObj);
						break;

					case 'category':
//add item to recently viewed list IF it is not already the most recent in the list.				
//Originally, used: 						if($.inArray(infoObj.navcat,_app.ext.quickstart.vars.session.recentCategories) < 0)
//bad mojo because spot 0 in array isn't necessarily the most recently viewed category, which it should be.
						if(_app.ext.quickstart.vars.session.recentCategories[0] != infoObj.navcat)	{
							_app.ext.quickstart.vars.session.recentCategories.unshift(infoObj.navcat);
							}
						
						$new = _app.ext.quickstart.u.showPage(infoObj); //### look into having showPage return infoObj instead of just parentID.
						break;
	
					case 'search':
	//					dump(" -> Got to search case.");	
						$new = _app.ext.quickstart.u.showSearch(infoObj);
						break;
	
					case 'customer':
						if('file:' == document.location.protocol || 'https:' == document.location.protocol)	{
							 //perform jump can be forced on. authenticate/require login indicate a login dialog is going to show and a jump should NOT occur so that the dialog is not off screen after the jump.
							if(!infoObj.performJumpToTop && !_app.u.buyerIsAuthenticated() && _app.ext.quickstart.u.thisArticleRequiresLogin(infoObj))	{
								infoObj.performJumpToTop = false;
								}
							else	{
								infoObj.performJumpToTop = true;
								}
							$new = _app.ext.quickstart.u.showCustomer(infoObj);
							}
						else	{
//							$('#mainContentArea').empty().addClass('loadingBG').html("<h1>Transferring to Secure Login...</h1>");
// * changed from 'empty' to showLoading because empty could be a heavy operation if mainContentArea has a lot of content.
							$('body').showLoading({'message':'Transferring to secure login'});							
							var SSLlocation = _app.vars.secureURL+"?cartID="+_app.model.fetchCartID();
							SSLlocation += "#!customer/"+infoObj.show
							_gaq.push(['_link', SSLlocation]); //for cross domain tracking.
							document.location = SSLlocation; //redir to secure url.
							}
						break;

					case 'checkout':
//						dump("PROTOCOL: "+document.location.protocol);
						infoObj.parentID = 'checkoutContainer'; //parent gets created within checkout. that id is hard coded in the checkout extensions.
						infoObj.templateID = 'checkoutTemplate'
						infoObj.state = 'init'; //needed for handleTemplateEvents.
						var $checkoutContainer = $("#checkoutContainer");
						$new = $checkoutContainer;
						_app.renderFunctions.handleTemplateEvents($checkoutContainer,infoObj);

//for local, don't jump to secure. ### this may have to change for a native _app. what's the protocol? is there one?
						if('http:' == document.location.protocol)	{
							dump(" -> nonsecure session. switch to secure for checkout.");
// if we redirect to ssl for checkout, it's a new url and a pushstate isn't needed, so a param is added to the url.
// * use showloading instead of .html (which could be heavy)
//							$('#mainContentArea').addClass('loadingBG').html("<h1>Transferring you to a secure session for checkout.<\/h1><h2>Our app will reload shortly...<\/h2>");
							$('body').showLoading({'message':'Transferring you to a secure session for checkout'});
							var SSLlocation = zGlobals.appSettings.https_app_url+"?cartID="+_app.model.fetchCartID()+"&_session="+_app.vars._session+"#!checkout";
							_gaq.push(['_link', SSLlocation]); //for cross domain tracking.
							document.location = SSLlocation;
							}
						else	{
// * checkout was emptying mainContentArea and that was heavy. This solution is faster and doesn't nuke templates already rendered.
							if(!$checkoutContainer.length)	{
								$checkoutContainer = $("<div \/>",{'id':'checkoutContainer'});
								$('#mainContentArea').append($checkoutContainer );
								}
							_app.ext.order_create.a.startCheckout($checkoutContainer,_app.model.fetchCartID());
							}
						infoObj.state = 'complete'; //needed for handleTemplateEvents.
						_app.renderFunctions.handleTemplateEvents($checkoutContainer,infoObj);

						break;
	
					case 'company':
						$new = $('#mainContentArea_company');
						_app.ext.quickstart.u.showCompany(infoObj);
						break;
	
					case 'cart':
						$new = _app.ext.quickstart.u.showCart(infoObj);
						break;

					case '404': 	//no specific code. shared w/ default, however a case is present because it is a recognized pageType.
					default:		//uh oh. what are we? default to 404.
						infoObj.pageType = '404';
						infoObj.back = 0;
						infoObj.templateID = 'pageNotFoundTemplate'
						infoObj.state = 'init'; //needed for handleTemplateEvents.
//						var $fourOhFour = _app.renderFunctions.transmogrify('page404',infoObj.templateID,infoObj);
						$new = $("<div \/>").tlc({
							dataAttribs : {'id':'page404'},
							templateid : infoObj.templateID,
							dataset : infoObj
							});
						_app.renderFunctions.handleTemplateEvents($new,infoObj);
						$('#mainContentArea').append($new);
						infoObj.state = 'complete'; //needed for handleTemplateEvents.
						_app.renderFunctions.handleTemplateEvents($new,infoObj);
					}
//this is low so that the individual 'shows' above can set a different default and if nothing is set, it'll default to true here.
				infoObj.performJumpToTop = (infoObj.performJumpToTop === false) ? false : true; //specific instances jump to top. these are passed in (usually related to modals).
		
//transition appPreView out on init.
				if($('#appPreView').is(':visible'))	{
//appPreViewBG is an optional element used to create a layer between the preView and the view when the preView is loaded 'over' the view.
					var $bg = $('#appPreViewBG');
					if($bg.length)	{
						$bg.animate({left:$(window).width(),top:$(window).height()},function(){$bg.hide();});
						}

					$('#appPreView').slideUp(1000,function(){
						$new.show(); //have to show content area here because the slideDown will only make the parent visible
						$('#appView').slideDown(3000);
						});
					}
				else if(infoObj.performTransition == false)	{
					}
				else if(typeof _app.ext.quickstart.pageTransition == 'function')	{
					_app.ext.quickstart.pageTransition($old,$new,infoObj);
					}
				else if($new instanceof jQuery)	{
//no page transition specified. hide old content, show new. fancy schmancy.
					$("#mainContentArea :visible:first").hide();
					$new.show();
					}
				else	{
					dump("WARNING! in showContent and no parentID is set for the element being translated.");
					}

//NOT POSTING THIS MESSAGE AS ASYNC BEHAVIOR IS NOT CURRENTLY QUANTIFIABLE					
				//Used by the SEO generation utility to signal that a page has finished loading. 
				//parent.postMessage("renderFinished","*");
				
				return false; //always return false so the default action (href) is cancelled. hashstate will address the change.
				}, //showContent



/*
app messaging ui is a mechanism for buyers and merchants to communicate in real-time.
it also allows the merchant to update the cart, load product or categories, or a variety of other things.
the ui also helps the buyer show the merchant what they're looking at and, optionally, where they've been
 -> while it's possible to automatically send a lot of info to the merchant, please keep in mind buyer privacy.
*/
			showBuyerCMUI : function()	{
				var $ui = $('#cartMessenger').data('cartid',_app.model.fetchCartID());
				if($ui.hasClass('ui-dialog-content'))	{
					//the help interface has been opened once already.
					}
				else	{
					$ui.dialog({
						'auto-open':'false'
						});
					// SANITY -> do not run a destroyCartMessenger on dialog close.  It will kill the polling.
					_app.u.handleButtons($ui);
					_app.u.handleCommonPlugins($ui);
					_app.u.addEventDelegation($ui);
					}
				$ui.find('.show4ActiveChat').hide(); //hidden by default. will be activated once a chat starts.
				//the information below is added to the dialog each time it's opened. that way it's up to date.
				$ui.find('.stats').empty().end().append("<p class='hint stats'>domain: "+document.domain+"<br \/>release: "+_app.vars.release+"<br \/>cart id: "+_app.model.fetchCartID()+"<\/p>");
				$ui.dialog('open');
				return $ui;
				},


//context should be a container element that has 1 or more forms within it.
//will look for inputs w/ qtyChanged class. Anything with that class is assumed to be an add to cart form and is treated as such.
// the atcquantityinput renderFormat in store_product will auto-add that class on change.
			bulkAddItemsToCart : function($context,_tag)	{
				if($context)	{
					var $inputs = $(".qtyChanged",$context);
					if($inputs.length)	{
						$inputs.each(function(){
							var obj = _app.ext.store_product.u.buildCartItemAppendObj($(this).closest('form'));
							if(obj)	{
								_app.ext.cco.calls.cartItemAppend.init(obj,{});
								}
							});
						_app.calls.refreshCart.init({},'immutable');
						_app.model.dispatchThis('immutable');
						}
					else	{
						$context.anymessage({'message':'Please set quantities before adding items to the cart.'});
						}
					}
				else	{
					$("#globalMessaging").anymessage({'message':'In quickstart.a.bulkAddItemsToCart, no $context passed.'});
					}
				},

//each item in the cart has a UUID. The UUID is used (not the stid) to modify the cart
			moveItemFromCartToWishlist : function(obj)	{
				if(obj && obj.uuid && obj.stid)	{
					//adds item to wishlist. cart removal ONLY occurs if this is successful.
					$('#modalCartContents').showLoading({'message':'Moving item '+obj.stid+' from your cart to your wishlist'});
					_app.calls.buyerProductListAppendTo.init({sku:obj.stid,'listid':'wishlist'},{'callback':function(rd){
						if(_app.model.responseHasErrors(rd)){
							$('#modalCartContents').hideLoading(); //only close on error. otherwise leave for removal in subsequent call.
							$('#cartMessaging').anymessage({'message':rd});
							}
						else	{
							//by now, item has been added to wishlist. So remove it from the cart.
							
							_app.ext.cco.calls.cartItemUpdate.init({'stid':obj.stid,'quantity':0},{callback:function(rd){
								$('#modalCartContents').hideLoading();
								if(_app.model.responseHasErrors(rd)){
									$('#cartMessaging').anymessage({'message':rd});
									}
								else	{
									//item successfully removed from the cart.
									$('#cartMessaging').anymessage({'message':'Thank you. '+obj.stid+' has been added to your wishlist and removed from the cart.'}); //!!! need to make this a success message.
									}
								}});
							_app.calls.refreshCart.init({'callback':'handleCart','templateID':'cartTemplate','extension':'quickstart','parentID':'modalCartContents'},'immutable');
							_app.model.dispatchThis('immutable');
							}
						}},'immutable'); 
					_app.model.dispatchThis('immutable');
					}
				else	{
					$('#cartMessaging').anymessage({'message':'myRiA.moveItemFromCartToWishlist missing either obj, obj.uuid or obj.stid','gMessage':true});
					dump("moveItemFromCartToWishlist obj: "); dump(obj);
					}
				},


//for now, only product and category are supported in quickview. This may change in the future.
//Required Params:  pageType, pid and templateID.
//no defaulting on template id because that'll make expanding this to support other page types more difficult.
//assumes data to be displayed is already in memory.
			quickView : function(pageType,infoObj){

				if(pageType && infoObj && infoObj.templateID)	{
					if(pageType == 'product' && infoObj.pid)	{
						_app.ext.store_product.u.prodDataInModal(infoObj);
						_gaq.push(['_trackEvent','Quickview','User Event','product',infoObj.pid]);
						}
						
					else if(pageType == 'category' && infoObj.navcat)	{
						_app.ext.quickstart.u.showPageInDialog (infoObj)
						_gaq.push(['_trackEvent','Quickview','User Event','category',infoObj.navcat]);
						}
						
					else	{
						_app.u.throwGMessage("Based on pageType, some other variable is required (ex: pid for pageType = product). infoObj follows: "); dump(infoObj);
						}
					
					}
				else	{
					_app.u.throwGMessage("quickView was missing either a pageType ["+pageType+"] or infoObj.templateID: "); dump(infoObj);
					}
				return false;
				},

//use this when linking from one store to another when you want to share the cart.
			linkToStore : function(url,type){

				if(type == 'vstore') {window.open(url+'c='+_app.model.fetchCartID()+'/');}
				else if(type == 'app') {window.open(url+'?cartID='+_app.model.fetchCartID()+'&_session='+_app.vars._session);}
				else {
					$('#globalMessage').anymessage({'message':'unknown type passed into quickstart.a.linkToStore.','gMessage':true});
					}

				},
			
			handleProdPreview : function(pid)	{
				
				var $parent = $('#mainContentArea_search'),
				$img = $('li img',$parent).first(),
				height = $img.height(),
				width = $img.width(),
				$liContainer = $('.previewListContainer',$parent), //div around UL with search results.
				$detail = $('.previewProductDetail',$parent); //target for content.
				
				
//##### SANITY -> 	there are a few checks to see if data.pid is already = to the pid passed in.  
//					This is to prevent double-click on a button or clicking on a product that is already in focus.

				if($('.buttonBar',$parent).data('pid') == pid)	{} //already in focus. do nothing.
//if the detail panel is already visible, no need to animate or adjust css on containers.
				else if($detail.is(':visible'))	{
//transition out the existing product in view.
					$detail.children().css({'position':'absolute','z-index':10000,'width':$detail.width()}).animate({'right':1000},'slow','',function(){$(this).empty().remove()})
					}
				else	{
					//class below is used as a selector for setting data() on button bar. don't change.
					var $buttonBar = $("<div \/>").addClass('buttonBar').css({'position':'absolute','right':0}).prependTo($parent);
					$buttonBar.data('page-in-focus',$('#resultsProductListContainer').data('page-in-focus')); //used to determine if a page change has occured in next/prev product buttons.

					
//button for turning off preview mode. returns li's to normal state and animates the two 'panes'.
					$("<button \/>").button().text('close preview').on('click',function(event){
						_app.ext.quickstart.u.revertPageFromPreviewMode($parent);
						}).prependTo($buttonBar);


//The next and previous buttons just trigger a click on the image.
					var $nextButton = $("<button \/>").button().addClass('nextButton navButton').text('Next').on('click',function(event){
						event.preventDefault(); //in case this ends up in a form, don't submit onclick.
						$nextButton.button('option','disabled',true);
						if($buttonBar.data('page-in-focus') == $('#resultsProductListContainer').data('page-in-focus'))	{
							$("[data-pid='"+$(this).parent().data('pid')+"']",$liContainer).next().children().first().trigger('click'); //click event is on div, not li
							}
						else	{
							$('#resultsProductListContainer').children().first().find('.pointer').first().trigger('click');
							$buttonBar.data('page-in-focus',$('#resultsProductListContainer').data('page-in-focus')); //set vars to match so 'next' button recognizes as same page if no page change has occured.
							}
						}).prependTo($buttonBar);

					var $prevButton = $("<button \/>").addClass('prevButton navButton').button().text('Previous').on('click',function(event){
						event.preventDefault(); //in case this ends up in a form, don't submit onclick.
						$prevButton.button('disable');
						if($buttonBar.data('page-in-focus') == $('#resultsProductListContainer').data('page-in-focus'))	{
							$("[data-pid='"+$(this).parent().data('pid')+"']",$liContainer).prev().children().first().trigger('click'); //click event is on div, not li
							}
						else	{
							$('#resultsProductListContainer').children().first().find('.pointer').first().trigger('click');
							$buttonBar.data('page-in-focus',$('#resultsProductListContainer').data('page-in-focus')); //set vars to match so 'next' button recognizes as same page if no page change has occured.
							}						
						}).prependTo($buttonBar);

					$detail.show().css({'padding-top': ($buttonBar.height() + 5)+'px'}); //top padding to compensate for button bar.

					$parent.addClass('minimalMode'); //use a class to toggle elements on/off instead of show/hide. That way if content is regenerated, visibility state is preserved
					$detail.css({'float':'right'});
					$liContainer.css({'float':'left','overflow':'auto','height':'500px'});
					
					$detail.animate({'width':'65%'},'slow');
					$liContainer.animate({'width':'30%'},'slow');
					}

				if($('.buttonBar',$parent).data('pid') == pid)	{} //already in focus. do nothing.
				else	{

					$('.buttonBar',$parent).data('pid',pid); //used for 'next' and 'previous' buttons
	
	//remove active state from any other item and add it to item now in focus.
	//had an issue with the addition of the border causing 'bumps' to occur when active class selected. to compensate, padding of 1px is added to 
	//all the other li items and remove when the active border (hard coded to 1px to make sure compensate values are =) is added.
	//this needs to be after if/else above so that styling in 'else' happens first.
					$('.ui-state-active',$liContainer).removeClass('ui-state-active').css({'border-width':'0','padding':'1px'}); //restore previously 'active' li to former state.
					$("[data-pid='"+pid+"']",$liContainer).first().addClass('ui-state-active').css({'border-width':'1','padding':0}); //remove padding to compensate for border.
	
					
					
					var liIndex = $("[data-pid='"+pid+"']",$liContainer).index();
	
	//disable 'previous' button if first item in list is active. same for handling last item and next. otherwise, always enable buttons.
	/*				
	*/
					_app.ext.store_product.calls.appProductGet.init(pid,{
						'callback':function(rd){

							if(_app.model.responseHasErrors(rd)){
								$detail.anymessage({'message':rd});
								}
							else	{
								$detail.tlc({'templateid':'productTemplateQuickView','dataset' : _app.data[rd.datapointer]})
								}

//in a timeout to prevent a doubleclick on the buttons. if data in memory, doubleclick will load two templates.
//dump(" -> liIndex: "+liIndex);
setTimeout(function(){
	if(liIndex === 0)	{
		$('.prevButton',$parent).button('disable');
		$('.nextButton',$parent).button('enable');
		}
	else if(liIndex == ($("ul",$liContainer).children().length))	{
		$('.prevButton',$parent).button('enable');
		$('.nextButton',$parent).button('disable');
		}
	else	{
		$('.prevButton',$parent).button('enable');
		$('.nextButton',$parent).button('enable');
		}
},300);
							}
						});
					_app.model.dispatchThis();
					}
				}, //handleProdPreview

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
// * 201403 -> adding the ?rel=0 to the end of the URL will disable the suggested videos feature
				$ele.empty().append("<iframe style='z-index:1;' width='560' height='315' src='https://www.youtube.com/embed/"+videoid+"?rel=0' frameborder='0' allowfullscreen></iframe>"); //clear any past videos.
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

//P.listid and P.sku are required.
//optional params include: qty, priority, note, and replace. see API docs for explanation.
			add2BuyerList : function(P){
				dump("BEGIN myria.a.add2BuyerList: "+P.listid);
				var authState = _app.u.determineAuthentication();
				dump("authState: "+authState);
				if(typeof P != 'object' || !P.sku || !P.listid)	{
					_app.u.throwMessage("Uh Oh! Something went wrong. Please try that again or contact the site administrator if error persists. err: required param for add2buyerList was missing. see console for details.");
					dump("ERROR! params missing for add2BuyerList. listid and pid required. params: "); dump(P);
					}
				else if(authState && (authState == 'none' || authState == 'guest'))	{
					_app.ext.quickstart.u.showLoginModal();
					$('#loginSuccessContainer').empty(); //empty any existing login messaging (errors/warnings/etc)
//this code is here instead of in showLoginModal (currently) because the 'showCustomer' code is bound to the 'close' on the modal.
					$('<button>').addClass('stdMargin ui-state-default ui-corner-all  ui-state-active').attr('id','modalLoginContinueButton').text('Add Item to List').click(function(){
						$('#loginFormForModal').dialog('close');
						_app.ext.quickstart.a.add2BuyerList(P) //will re-execute function so after successful login, item is actually submitted to list.
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
					var msg = _app.u.statusMsgObject('adding item '+P.sku+' to list: '+P.listid);
					msg.parentID = parentID;
					_app.u.throwMessage(msg);
					_app.model.destroy('buyerProductListDetail|'+P.listid);
					_app.calls.buyerProductListAppendTo.init(P,{'parentID':parentID,'callback':'showMessaging','message':'Item '+P.sku+' successfully added to list: '+P.listid},'immutable');
					_app.calls.buyerProductListDetail.init(P.listid,{},'immutable')
					_app.model.dispatchThis('immutable');
					_gaq.push(['_trackEvent','Manage buyer list','User Event','item added',P.sku]);
					}
				},


//assumes the faq are already in memory.
			showFAQbyTopic : function(topicID)	{
				dump("BEGIN showFAQbyTopic ["+topicID+"]");
				var templateID = 'faqQnATemplate'
				
				if(!topicID)	{
					_app.u.throwMessage("Uh Oh. It seems an app error occured. Error: no topic id. see console for details.");
					dump("a required parameter (topicID) was left blank for quickstart.a.showFAQbyTopic");
					}
				else if(!_app.data['appFAQs'] || $.isEmptyObject(_app.data['appFAQs']['@detail']))	{
					dump(" -> No data is present");
					}
				else	{
					var $target = $('#faqDetails4Topic_'+topicID).toggle();
					if($target.children().length)	{} //if children are present, this faq topic has been opened before or is empty. no need to re-render content.
					else	{
						var L = _app.data['appFAQs']['@detail'].length;
						dump(" -> total #faq: "+L);
						for(var i = 0; i < L; i += 1)	{
							if(_app.data['appFAQs']['@detail'][i]['TOPIC_ID'] == topicID)	{
								dump(" -> faqid matches topic: "+_app.data['appFAQs']['@detail'][i]['ID']);
//								$target.append(_app.renderFunctions.transmogrify({'id':topicID+'_'+_app.data['appFAQs']['@detail'][i]['ID'],'data-faqid':+_app.data['appFAQs']['@detail'][i]['ID']},templateID,_app.data['appFAQs']['@detail'][i]))
$target.tlc({
	dataAttribs : {'id':topicID+'_'+_app.data['appFAQs']['@detail'][i]['ID'],'data-faqid':+_app.data['appFAQs']['@detail'][i]['ID']},
	templateid : templateID,
	dataset : _app.data['appFAQs']['@detail'][i]
	})
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
			handleAppInit : function()	{
//dump("BEGIN quickstart.u.handleAppInit");
				
				var L = _app.rq.length-1;
				for(var i = L; i >= 0; i -= 1)	{
					_app.u.loadResourceFile(_app.rq[i]);
					_app.rq.splice(i, 1); //remove once handled.
					}
				if(_app.u.buyerIsAuthenticated())  {
					_app.ext.quickstart.u.handleLoginActions();
					}
				},



//used in checkout to populate username: so either login or bill/email will work.
//never use this to populate the value of an email form field because it may not be an email address.
			getUsernameFromCart : function(cartID)	{
	//			dump('BEGIN u.getUsernameFromCart');
				var r = false;
				if(_app.data['cartDetail|'+cartID] && _app.data['cartDetail|'+cartID].customer && _app.u.isSet(_app.data['cartDetail|'+cartID].customer.login))	{
					r = _app.data['cartDetail|'+cartID].customer.login;
	//				dump(' -> login was set. email = '+r);
					}
				else if(_app.data['cartDetail|'+cartID] && _app.data['cartDetail|'+cartID].bill && _app.u.isSet(_app.data['cartDetail|'+cartID].bill.email)){
					r = _app.data['cartDetail|'+cartID].bill.email;
	//				dump(' -> bill/email was set. email = '+r);
					}
				else if(!jQuery.isEmptyObject(_app.vars.fbUser))	{
	//				dump(' -> user is logged in via facebook');
					r = _app.vars.fbUser.email || false;
					}
				return r;
				}, //getUsernameFromCart


			handleLoginActions : function()  {
				$('body').addClass('buyerLoggedIn');
				var login = _app.ext.quickstart.u.getUsernameFromCart(_app.model.fetchCartID());
				if(login)	{
					$('.username').text(login);
					}
				},

//will look at the thisPageIsPublic variable to see if the info/show in infoObj is a publicly viewable page.
//used in B2B
			thisPageIsViewable : function(infoObj)	{
				var r = false, //what is returned. true if page IS viewable. false if not.
				pvo = _app.ext.quickstart.vars.thisPageIsPublic, //shortcut
				ns; //namespace.  will = value of show, navcat or pid
				
				if(typeof infoObj === 'object')	{
					if(infoObj.show){ns = 'show'}
					else if(infoObj.navcat)	{ns='navcat'}
					else if(infoObj.pid)	{ns='pid'}
					else{}
					if(infoObj.pageType && ns && pvo[infoObj.pageType] && pvo[infoObj.pageType].indexOf(infoObj[ns]) > -1)	{r = true}
					}
				else	{}
				return r;
				}, //thisPageIsViewable

//handle State and History Of The World.
//will change what state of the world is (infoObj) and add it to History of the world.
//will make sure history keeps only last 15 states.
			handleSandHOTW : function(infoObj){
				infoObj.dateObj = new Date(); //milliseconds timestamp
				_app.ext.quickstart.vars.sotw = infoObj;
				_app.ext.quickstart.vars.hotw.unshift(infoObj);
				_app.ext.quickstart.vars.hotw.pop(); //remove last entry in array. is created with array(15) so this will limit the size.
				},

			showtransition : function(infoObj,$old)	{
				var r = true; //what is returned.
//				dump(" -> $old.data('templateid'): "+$old.data('templateid'));
//				dump(" -> infoObj: "); dump(infoObj);
//				dump(" -> $old.data('catsafeid'): "+$old.data('catsafeid'));
//				dump(" -> infoObj.navcat: "+infoObj.navcat);
//search, customer and company contain 'articles' (pages within pages) so when moving from one company to another company, skip the transition
// or the content is likely to be hidden. execute scroll to top unless transition implicitly turned off (will happen with modals).
//				if(infoObj.pageType == 'cart' && infoObj.show != 'inline'){r = false; dump('transition suppressed: showing modal cart.');}
				if(infoObj.pageType == 'category' && $old.data('templateid') == 'categoryTemplate' && $old.data('catsafeid') == infoObj.navcat){r = false; dump("transition suppressed: reloading same category.");}
				else if(infoObj.pageType == 'category' && $old.data('templateid') == 'homepageTemplate' && $old.data('catsafeid') == infoObj.navcat){r = false; dump("transition suppressed: reloading homepage.");}
				else if(infoObj.pageType == 'product' && $old.data('templateid') == 'productTemplate' && $old.data('pid') == infoObj.pid){r = false; dump("transition suppressed: reloading same product.");}
				else if($old.data('templateid') == 'companyTemplate' && infoObj.pageType == 'company')	{r = false; dump("transition suppressed: changing company articles.");}
				else if($old.data('templateid') == 'customerTemplate' && infoObj.pageType == 'customer')	{r = false; dump("transition suppressed: changing customer articles.");}
				else if($old.data('templateid') == 'searchTemplate' && infoObj.pageType == 'search')	{r = false; dump("transition suppressed: new search from on search page.");}
				else if(!_app.u.determineAuthentication() && this.thisArticleRequiresLogin(infoObj))	{
					dump("transition suppressed: on a page that requires auth and buyer not authorized.");
					r = false; //if the login modal is displayed, don't animate or it may show up off screen.
					}
				else	{

					}
//				dump(" -> R: "+r);
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
//				dump("BEGIN quickstart.u.addPicSlider2UL");
				
				var $obj = $(this);
				if($obj.data('slider') == 'rendered')	{
					//do nothing. list has aready been generated.
//					dump("the slideshow has already been rendered. re-init");
					window.slider.kill(); //make sure it was nuked.
					window.slider = new imgSlider($('ul',$obj))
					}
				else	{
					$obj.data('slider','rendered'); //used to determine if the ul contents have already been added.
					var pid = $obj.attr('data-pid');
//					dump(" -> pid: "+pid);
					var data = _app.data['appProductGet|'+pid]['%attribs'];
					var $img = $obj.find('img')
					var width = $img.attr('width'); //using width() and height() here caused unusual results in the makeImage function below.
					var height = $img.attr('height');
					$obj.width(width).height(height).css({'overflow':'hidden','position':'relative'});
					var $ul = $('<ul>').addClass('slideMe').css({'height':height+'px','width':'20000px'}); /* inline width to override inheretance */
					
					var $li; //recycled.
					for(var i = 2; i <= 10; i += 1)	{
						if(data['zoovy:prod_image'+i])	{
							$li = $('<li>').append(_app.u.makeImage({"name":data['zoovy:prod_image'+i],"w":width,"h":height,"b":"FFFFFF","tag":1}));
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
//				dump("BEGIN quickstart.u.changeCursor ["+style+"]");
				$('html, body').css('cursor',style);
				},


//used in results page if the preview mode feature is enabled.
			revertPageFromPreviewMode : function($parent)	{
				if(typeof $parent == 'object')	{
					var 
					$liContainer = $('.previewListContainer',$parent), //div around UL with search results.
					$detail = $('.previewProductDetail',$parent); //target for content.

					$parent.removeClass('minimalMode'); //returns product list and multipage display to normal
					$detail.animate({'width':'0'},'slow','',function(){$(this).addClass('displayNone').removeAttr('style').empty()}); //return right col to zero width
					$liContainer.animate({'width':'99%'},'slow','',function(){$(this).removeAttr('style')}); //return main col to 100% width
					$('li.ui-state-active',$liContainer).removeClass('ui-state-active');
					$(".buttonBar",$parent).remove(); //get rid of navigation
					}
				else	{
					_app.u.throwGMessage("In quickstart.u.revertPageFromPreviewMode, $parent not specified or not an object ["+typeof $parent+"].");
					}
				},


//executed on initial app load AND in some elements where user/merchant defined urls are present (banners).
// Determines what page is in focus and returns appropriate object (r.pageType)
// if no page content can be determined based on the url, the hash is examined and if appropriately formed, used (ex: #company/contact or #category/.something)
// should be renamed getPageInfoFromURL
			detectRelevantInfoToPage : function(URL)	{
//				dump("BEGIN quickstart.u.detectRelevantInfoToPage. url: "+URL);
				var r = {}; //what is returned. r.pageInfo and r.navcat or r.show or r.pid
				var url = URL; //leave original intact.
				var hashObj;
				if(url.indexOf('#') > -1)	{
//*** 201344 Adds support for #! syntax, which allows links for escaped fragment syntax to be parsed directly over their href. -mc
					var tmp;
					if(url.indexOf('#!') > -1){
						tmp = url.split("#!");
						}
					else {
						tmp = url.split("#");
						}
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
				else if(url.indexOf('app-quickstart.html') > -1)	{
					var msg = _app.u.errMsgObject('Rename this file as index.html to decrease the likelyhood of accidentally saving over it.',"MVC-INIT-MYRIA_1000")
					msg.persistent = true;
					_app.u.throwMessage(msg);
					r.pageType = 'homepage';
					}
//the url in the domain may or may not have a slash at the end. Check for both
				else if(	url == zGlobals.appSettings.http_app_url || 
							url+"/" == zGlobals.appSettings.http_app_url || 
							url == zGlobals.appSettings.https_app_url || 
							url+"/" == zGlobals.appSettings.https_app_url ||
//*** 201344 server structure no longer auto-redirects host-less domains to a host, so we should check if just the domain matches. -mc
							url == "http://"+zGlobals.appSettings.domain_only ||
							url == "http://"+zGlobals.appSettings.domain_only+"/" ||
							url == "https://"+zGlobals.appSettings.domain_only ||
							url == "https://"+zGlobals.appSettings.domain_only+"/")	{
					r.pageType = 'homepage'
					r.navcat = zGlobals.appSettings.rootcat; //left with category.safe.id or category.safe.id/
					}
				else	{
//					alert('Got to else case.');
					r.pageType = '404';
					}
//				dump("detectRelevantInfoToPage = ");
//				dump(r);
				return r;
				},





/*

#########################################     FUNCTIONS FOR DEALING WITH pageInfo obj and/or HASH

*/

//pass in a pageInfo object and a valid hash will be returned.
// EX:  pass: {pageType:company,show:contact} and return: #company?show=contact
// EX:  pass: {pageType:product,pid:TEST} and return: #product?pid=TEST
// if a valid hash can't be built, false is returned.
// this is still used for the banner element.
			getHashFromPageInfo : function(infoObj)	{
//				dump("BEGIN quickstart.u.getHashFromPageInfo");
				var r = false; //what is returned. either false if no match or hash (#company?show=contact)
				if(this.thisPageInfoIsValid(infoObj))	{
					if(infoObj.pageType == 'product' && infoObj.pid)	{r = '#!product/'+infoObj.pid}
					else if(infoObj.pageType == 'category' && infoObj.navcat)	{r = '#!category/'+infoObj.navcat}
					else if(infoObj.pageType == 'homepage')	{r = '#!home'}
					else if(infoObj.pageType == 'cart')	{r = '#!cart'}
					else if(infoObj.pageType == 'checkout')	{r = '#!checkout'}
					else if(infoObj.pageType == 'search' && (infoObj.TAG || infoObj.KEYWORDS))	{
						r = '#!search/';
						r += (infoObj.KEYWORDS) ? 'keywords/'+infoObj.KEYWORDS : 'tag/'+infoObj.TAG;
						}
					else if(infoObj.pageType == 'search' && infoObj.elasticsearch)	{
						//r = '#search?KEYWORDS='+encodeURIComponent(infoObj.KEYWORDS);
						r = '#!search/elasticsearch/'+encodeURIComponent(JSON.stringify(infoObj.elasticsearch));
						}
					else if(infoObj.pageType && infoObj.show)	{r = '#!'+infoObj.pageType+'/'+infoObj.show}
					else	{
						//shouldn't get here because pageInfo was already validated. but just in case...
						dump("WARNING! invalid pageInfo object passed into getHashFromPageInfo. infoObj: ");
						dump(infoObj);
						}
					}
				else	{
					dump("WARNING! invalid pageInfo object passed into getHashFromPageInfo. infoObj: ");
					dump(infoObj);
					}
				return r;
				},

//will return a t/f based on whether or not the object passed in is a valid pageInfo object.
//ex: category requires navcat. company requires show.
			thisPageInfoIsValid : function(infoObj)	{
//				dump("BEGIN quickstart.u.thisPageInfoIsValid. ");
//				dump(" -> infoObj: "); dump(infoObj);
				var r = false; //what is returned. boolean.
				if($.isEmptyObject(infoObj))	{
					//can't have an empty object.
					dump("WARNING! thisPageInfoIsValid did not receive a valid object.");
					}
				else if(infoObj.pageType)	{
					if(infoObj.pageType == 'product' && infoObj.pid)	{r = true}
					else if(infoObj.pageType == 'category' && infoObj.navcat)	{r = true}
					else if(infoObj.pageType == 'homepage')	{r = true}
					else if(infoObj.pageType == 'cart')	{r = true}
					else if(infoObj.pageType == 'checkout')	{r = true}
					else if(infoObj.pageType == 'search' && (infoObj.KEYWORDS || infoObj.TAG))	{r = true}
					else if(infoObj.pageType == 'customer' && infoObj.show)	{r = true}
					else if(infoObj.pageType == 'company' && infoObj.show)	{r = true}
					else	{
						//no matching params for specified pageType
						dump("WARNING! thisPageInfoIsValid had no matching params for specified pageType ["+infoObj.pageType+"]");
						}
					}
				else{
					dump("WARNING! thisPageInfoIsValid did not receive a pageType");
					}
//				dump(" -> thisPageInfoIsValid.r = "+r);
				return r;
				},

//pass in a hash string and a valid pageInfo object will be returned.
// EX:  pass: #company?show=contact and return: {pageType:company,show:contact}
// EX:  pass: #product?pid=TEST and return: {pageType:product,pid:TEST}
// if the hash is not a valid pageInfo, false is returned.


			getPageInfoFromHash : function(HASH)	{
//				dump(" -> hash: "+HASH);
				var myHash = HASH;
//make sure first character isn't a #. location.hash is used a lot and ie8 (maybe more) include # in value.
				if(myHash.indexOf('#') == 0)	{myHash = myHash.substring(1);}
				var infoObj = {}; //what is returned. infoObj.pageType and based on value of page type, infoObj.show or infoObj.pid or infoObj.navcat, etc
				
				var splits = myHash.split('?'); //array where 0 = 'company' or 'search' and 1 = show=returns or keywords=red
//				dump(" -> splits: "); dump(splits);
				
				
				//Try to parse URI information
				try {
//*** 201344 	Need to do a check before calling kvp2Array; if there are no params then it will return false, and the pagetype will not get set. -mc
//				This essentially breaks any page hash that requires no params, ie #homepage, #cart, #checkout
//				No need to worry about #slide2 or another oblivious anchor affecting this code- _app.ext.quickstart.u.thisPageInfoIsValid gets called to check that.
					if(splits.length > 1){
						infoObj = _app.u.kvp2Array(splits[1]); //will set infoObj.show=something or infoObj.pid=PID
					}
//					dump(" -> infoObj: "); dump(infoObj);
					infoObj.pageType = splits[0];
					
					//The below may not be necessary, depending on how the kvp2array function handles the parsing of the hash info with nested objects
					
					//De-stringify elastic search from page hash so we can build our raw elastic during showContent
					//if(infoObj.pageType === 'search' && infoObj.elasticsearch){
					//	infoObj.elasticsearch = JSON.parse(infoObj.elasticsearch);
					//} 
				} catch (err){
					//Problem parsing info
					dump("Error parsing Hash: "+err, 'warn');
				}
				
				
				
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
//					dump("BUILDRELATIVEPATH");
//					dump(infoObj.elasticsearch);
					relativePath = '#search?elasticsearch=';
					if(infoObj.KEYWORDS || infoObj.TAG)	{
						relativePath += (infoObj.KEYWORDS) ? 'KEYWORDS='+infoObj.KEYWORDS : 'TAG='+infoObj.TAG;
						}
					else	{
						relativePath += JSON.stringify(infoObj.elasticsearch);
						}
					
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
//				dump("BEGIN quickstart.u.whatAmIFor");
//				dump(infoObj);
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

#########################################     FUNCTIONS FOR DEALING WITH PAGE CONTENT (SHOW) and adding functionality to that content.

*/

/*
effects the display of the nav buttons only. should be run just after the handleAppNavData function in showContent.
// ** 201403 -> appNav is now toggled on/off as well, using a class, so that in a responsive design, appnav height can be easily adjusted w/out impact when it's hidden.
*/
			handleAppNavDisplay : function(infoObj)	{
//				dump("BEGIN quickstart.u.handleNavButtonsForDetailPage");
//				dump(" -> history of the world: "); dump(_app.ext.quickstart.vars.hotw[1]);

				var r = false, //what is returned. true if buttons are visible. false if not.
				$nav = $('#appNav'),
				$nextBtn = $("[data-app-role='prodDetailNextItemButton']",$nav),
				$prevBtn = $("[data-app-role='prodDetailPrevItemButton']",$nav);
				
//				dump(" -> $prevBtn.data('datapointer'): "+$prevBtn.data('datapointer'));
				
//The buttons are only shown on product detail pages. if no datapointer is set, no reason to show the buttons because there's no reference for what product would be 'next'.		
				if(infoObj.pageType == 'product' && $prevBtn.data('datapointer'))	{
// * 201403 -> only show the buttons if more than 1 product is in the list.
					if(_app.u.thisNestedExists("data."+$prevBtn.data('datapointer')+".@products",_app) && _app.data[$prevBtn.data('datapointer')]['@products'].length > 1)	{
						$nav.removeClass('displayNone');
						$nextBtn.show();
						$prevBtn.show();
						r = true;
						}
					}
				else	{
					$nav.addClass('displayNone');
					$prevBtn.hide();
					$nextBtn.hide();
					} //no historical data yet. perfectly normal. make sure buttons are hidden.
				return r;
				},

//gets executed in showContent.  just adds the data() vars needed.
			handleAppNavData : function(infoObj)	{
				var r = false, //what is returned. true if data is applied. false if not.
				$nextBtn = $("[data-app-role='prodDetailNextItemButton']","#appNav"),
				$prevBtn = $("[data-app-role='prodDetailPrevItemButton']","#appNav");
				
				if(infoObj.pageType == 'category')	{
					$nextBtn.data('datapointer','appNavcatDetail|'+infoObj.navcat);
					$prevBtn.data('datapointer','appNavcatDetail|'+infoObj.navcat);
					r = true;
					}
//when moving from one product to the next using the buttons, do not reset data();
				else if(infoObj.pageType == 'product' && $prevBtn.data('datapointer'))	{}
				else	{
					$prevBtn.data('datapointer','');
					$nextBtn.data('datapointer','');							
					}
				return r;
				},

//executed during the extension init. binds actions to the various appNav buttons.
			bindAppNav : function(){
				var $nextBtn = $("[data-app-role='prodDetailNextItemButton']","#appNav"),
				$prevBtn = $("[data-app-role='prodDetailPrevItemButton']","#appNav");
				
				$nextBtn.button({icons: {primary: "ui-icon-seek-next"},text: false});
				$prevBtn.button({icons: {primary: "ui-icon-seek-prev"},text: false});
				
				function step($btn,increment)	{
					if($btn.data('datapointer').indexOf('appNavcatDetail') >= 0)	{
						var csv = _app.data[$btn.data('datapointer')]['@products'],
// ** 201332 indexOf changed to $.inArray for IE8 compatibility, since IE8 only supports the indexOf method on Strings
						index = $.inArray(_app.ext.quickstart.vars.hotw[0].pid, csv) + increment;
						
						if(index < 0)	{index = csv.length - 1} //after first product, jump to last
						else if(index >= csv.length)	{index = 0} //afer last item, jump to first.
						else	{} //leave index alone.
						document.location.hash = _app.ext.store_routing.u.productAnchor(csv[index]);

						}
					else	{} //non category datapointer. really should never get here.
					}
				
				$nextBtn.off('click.next').on('click.next',function(){
					step($(this),1);
					});
				$prevBtn.off('click.prev').on('click.prev',function(){
					step($(this),-1);
					});
				},




//rather than having all the params in the dom, just call this function. makes updating easier too.
			showProd : function(infoObj)	{
				var pid = infoObj.pid
				var parentID = null; //what is returned. will be set to parent id if a pid is defined.
//				dump("BEGIN quickstart.u.showProd ["+pid+"]");
				if(!pid)	{
					$('#globalMessaging').anymessage({'message':"Uh Oh. It seems an app error occured. Error: no product id. see console for details.",'gMessage':true});
					dump("quickstart.u.showProd had no infoObj.pid, which is required. infoObj follows:",'error'); dump(infoObj);
					}
				else	{
					infoObj.templateID = infoObj.templateID || 'productTemplate';
					infoObj.state = 'init';
					parentID = infoObj.templateID+"_"+pid;
					infoObj.parentID = parentID;
					
					var $product = $(_app.u.jqSelector('#',parentID));
					
					_app.renderFunctions.handleTemplateEvents($product,infoObj);
	
//no need to render template again.
					if(!$product.length){
//						dump(" -> product is NOT on the DOM yet. Add it.");
						var $tmp = $("<div \/>");
						$tmp.tlc({templateid:infoObj.templateID,'verb':'template'});
						$product = $tmp.children();
						$product.attr('id',infoObj.parentID).data('pid',pid);
						$product.addClass('displayNone').appendTo($('#mainContentArea')); //hidden by default for page transitions
						_app.u.handleCommonPlugins($product);
						var nd = 0; //Number of Dispatches.

//need to obtain the breadcrumb info pretty early in the process as well.
//the breadcrumb renderformat handles most of the heavy lifting, so datapointers are not necessary for callback. Just getting them into memory here.
						if(_app.ext.quickstart.vars.session.recentCategories.length > 0)	{
							nd += _app.ext.store_navcats.u.addQueries4BreadcrumbToQ(_app.ext.quickstart.vars.session.recentCategories[0]).length;
							}
						$.extend(infoObj, {'callback':'showProd','extension':'quickstart','jqObj':$product,'templateID':'productTemplate'});
						nd += _app.ext.store_product.calls.appReviewsList.init(pid);  //store_product... appProductGet DOES get reviews. store_navcats...getProd does not.
						//if a dispatch is going to occur, might as well get updated product info.
						if(nd)	{
							_app.model.destroy('appProductGet|'+pid);
							}
						_app.ext.store_product.calls.appProductGet.init(pid,infoObj);
						_app.model.dispatchThis();
						}
					else	{
						dump(" -> product is already on the DOM. bring it into focus");
						infoObj.datapointer = 'appProductGet|'+infoObj.pid; //here so datapoitner is available in renderFunctions.
//typically, the onComplete get handled as part of the request callback, but the template has already been rendered so the callback won't get executed.
						infoObj.state = 'complete'; //needed for handleTemplateEvents.
						_app.renderFunctions.handleTemplateEvents($product,infoObj);
						}


					}
				return $product;
				}, //showProd
				
				
//Show one of the company pages. This function gets executed by showContent.
//handleTemplateEvents gets executed in showContent, which should always be used to execute this function.
//The company navlinks are generated based on what articles are present and not disabled. built to allow for wizard to easily add new pages.
			showCompany : function(infoObj)	{
				infoObj.show = infoObj.show || 'about'; //what page to put into focus. default to 'about us' page
				var parentID = 'mainContentArea_company'; //this is the id that will be assigned to the companyTemplate instance.
				
				infoObj.templateID = 'companyTemplate';
				infoObj.state = 'init';
				infoObj.parentID = 'mainContentArea_company';
				var $mcac = $('#mainContentArea_company');
				
				if($mcac.length)	{
					//template has already been added to the DOM. likley moving between company pages.
					}
				else	{
//					var $content = _app.renderFunctions.createTemplateInstance(infoObj.templateID,parentID);
//no interpolation takes place on the company pages (except faq). the content should be hard coded.
					var $tmp = $("<div>").tlc({
						templateid : infoObj.templateID,
						verb : 'template'
						});
					$mcac = $tmp.children();
					$mcac.attr('id',infoObj.parentID);

					var $nav = $('#companyNav ul:first',$mcac);
//builds the nav menu.
					$('.textContentArea',$mcac).not('.disabled').each(function(){
						$nav.append("<li><a href='#!company/"+$(this).attr('id').replace('Article','')+"'>"+($('h1:first',$(this)).text())+"</a></li>");
						});

					$('#mainContentArea').append($mcac);

					_app.u.handleCommonPlugins($mcac);
					_app.u.handleButtons($mcac);
					}

				if(_app.ext.quickstart.u.showArticleIn($mcac,infoObj))	{
					_app.renderFunctions.handleTemplateEvents($mcac,infoObj);
					infoObj.state = 'complete';
					_app.renderFunctions.handleTemplateEvents($mcac,infoObj);
					}
				else	{} //showArticle will handle displaying the error messaging.

				return $mcac;
				}, //showCompany
				
				
			showSearch : function(infoObj)	{
				dump("BEGIN quickstart.u.showSearch. infoObj follows: "); dump(infoObj);
				infoObj.templateID = 'searchTemplate';
				infoObj.parentID = 'mainContentArea_search';
				infoObj.state = 'init';
				var $page = $('#'+infoObj.parentID),
				elasticsearch = {};

				_app.renderFunctions.handleTemplateEvents($page,infoObj);

//only create instance once.
				if($page.length)	{
					_app.ext.quickstart.u.revertPageFromPreviewMode($page);
					}
				else	{
					$page = new tlc().runTLC({'templateid':infoObj.templateID,'verb':'template'}).attr('id','mainContentArea_search').appendTo('#mainContentArea');
					}

//add item to recently viewed list IF it is not already in the list.
				if($.inArray(infoObj.KEYWORDS,_app.ext.quickstart.vars.session.recentSearches) < 0)	{
					_app.ext.quickstart.vars.session.recentSearches.unshift(infoObj.KEYWORDS);
					}
					
//If raw elastic has been provided, use that.  Otherwise build a query.
				if(infoObj.elasticsearch){
					elasticsearch = _app.ext.store_search.u.buildElasticRaw(infoObj.elasticsearch);
					}
				else if(infoObj.tag)	{
					elasticsearch = _app.ext.store_search.u.buildElasticRaw({
					   "filter":{
						  "and" : [
							 {"term":{"tags":infoObj.tag}},
							 {"has_child":{"type":"sku","query": {"range":{"available":{"gte":100}}}}} //only return item w/ inventory
							 ]
						  }});
					}
				else if (infoObj.KEYWORDS) {
					elasticsearch = _app.ext.store_search.u.buildElasticRaw({
					   "filter":{
						  "and" : [
							 {"query":{"query_string":{"query":infoObj.KEYWORDS}}},
							 {"has_child":{"type":"sku","query": {"range":{"available":{"gte":100}}}}} //only return item w/ inventory
							 ]
						  }});
					}
				else	{
					
					}
				dump(elasticsearch);
/*
#####
if you are going to override any of the defaults in the elasticsearch, such as size, do it here BEFORE the elasticsearch is added as data on teh $page.
ex:  elasticsearch.size = 200
*/
elasticsearch.size = 50;

// ** 201346 -> extended infoObj w/ a new templateID was causing the ondepart templatefunctions to not execute properly for search results.
//				$.extend(infoObj,{'callback':'handleElasticResults','datapointer':"appPublicSearch|"+JSON.stringify(elasticsearch),'extension':'store_search','templateID':'productListTemplateResults','list':$('#resultsProductListContainer')});
				
				//Used to build relative path
				infoObj.elasticsearch = $.extend(true, {}, elasticsearch);
				
				
				_app.ext.store_search.u.updateDataOnListElement($('#resultsProductListContainer'),elasticsearch,1);
//				_app.ext.store_search.calls.appPublicSearch.init(elasticsearch,infoObj);
				_app.ext.store_search.calls.appPublicSearch.init(elasticsearch,$.extend(true,{},infoObj,{'callback':'handleElasticResults','datapointer':"appPublicSearch|"+JSON.stringify(elasticsearch),'extension':'store_search','templateID':'productListTemplateResults','list':$('#resultsProductListContainer')}));
				_app.model.dispatchThis();
				infoObj.state = 'complete'; //needed for handleTemplateEvents.
				_app.renderFunctions.handleTemplateEvents($page,infoObj);

				return $page;
				}, //showSearch



//pio is PageInfo object
//this showCart should only be run when no cart update is being run.
//this is run from showContent.
// when a cart update is run, the handleCart response also executes the handleTemplateEvents
			showCart : function(infoObj)	{
//				dump("BEGIN quickstart.u.showCart"); dump(infoObj);
				if(typeof infoObj != 'object'){var infoObj = {}}
				infoObj.templateID = 'cartTemplate';
				infoObj.parentID = 'mainContentArea_cart';
				infoObj.trigger = '';
				infoObj.state = 'init'; //needed for handleTemplateEvents.
				
				var $cart = $('#'+infoObj.parentID);
				
				_app.renderFunctions.handleTemplateEvents($cart,infoObj);

//only create instance once.
				$cart = $('#mainContentArea_cart');
				if($cart.length)	{
					//the cart has already been rendered.
					infoObj.trigger = 'refresh';
					$cart.hide();
					}
				else	{
					infoObj.trigger = 'fetch';
					infoObj.cartid = _app.model.fetchCartID();
					$cart = _app.ext.cco.a.getCartAsJqObj(infoObj);
					$cart.hide().on('complete',function(){
						$("[data-app-role='shipMethodsUL']",$(this)).find(":radio").each(function(){
							$(this).attr('data-app-change','quickstart|cartShipMethodSelect');
							});
						});
					$cart.attr({'id':infoObj.parentID});
					$cart.appendTo("#mainContentArea");
					}
//This will load the cart from memory, if set. otherwise it will fetch it.
//so if you need to update the cart, run a destroy prior to showCart.
				infoObj.state = 'complete'; //needed for handleTemplateEvents.
				$cart.trigger(infoObj.trigger,$.extend({'Q':'mutable'},infoObj));
				_app.model.dispatchThis('mutable');
				return $cart;
				}, //showCart

/*
This will open the cart in a modal. If an update is needed, that must be performed outside this function.
assumes that cart is in memory before it's loaded.
either templateID needs to be set OR showloading must be true. TemplateID will translate the template. showLoading will (you guessed it) show the loading class.
 so you can execute showCartInModal with showLoading set to true, then dispatch a request for a cart and translate the parent ID in the callback.
 can't think of a reason not to use the default parentID, but just in case, it can be set.
*/
			showCartInModal : function(P)	{

				if(typeof P == 'object' && (P.templateID || P.showLoading === true)){
					var $modal = $('#modalCart');
//the modal opens as quick as possible so users know something is happening.
//open if it's been opened before so old data is not displayed. placeholder content (including a loading graphic, if set) will be populated pretty quick.
//the cart messaging is OUTSIDE the template. That way if the template is re-rendered, existing messaging is not lost.
					if($modal.length)	{
						$('#modalCartContents',$modal).empty(); //empty to remove any previous content.
						$('.appMessaging',$modal).empty(); //errors are cleared because if the modal is closed before the default error animation occurs, errors become persistent.
						$modal.dialog('open');
						}
					else	{
						P.cartid = _app.model.fetchCartID();
						$modal = _app.ext.cco.a.getCartAsJqObj(P).attr({"id":"modalCart","title":"Your Shopping Cart"}).appendTo('body');
						$modal.on('complete',function(){
							$("[data-app-role='shipMethodsUL']",$(this)).find(":radio").each(function(){
								$(this).attr('data-app-change','quickstart|cartShipMethodSelect');
								});
							});
						$modal.dialog({modal: true,width:'80%'});  //browser doesn't like percentage for height
						}

					if(P.showLoading === true)	{
						$modal.showLoading(); //have to add child because the modal classes already have bg assigned
						}
					else	{
						$modal.trigger('refresh');
						}

					}
				else	{
					_app.u.throwGMessage("ERROR! no templateID passed into showCartInModal. P follows: ");
					dump(P);
					}
				}, //showCartInModal


//Customer pages differ from company pages. In this case, special logic is needed to determine whether or not content can be displayed based on authentication.
// plus, most of the articles require an API request for more data.
//handleTemplateEvents gets executed in showContent, which should always be used to execute this function.
			showCustomer : function(infoObj)	{
//				dump("BEGIN showCustomer. infoObj: "); dump(infoObj);
				infoObj = infoObj || {};
				infoObj.show = infoObj.show || 'newsletter';
				infoObj.parentID = 'mainContentArea_customer'; //used for templateFunctions
				infoObj.templateID = 'customerTemplate';
				var $customer = $('#'+infoObj.parentID);
//only create instance once.
				if($customer.length)	{}
				else	{
//					$customer = _app.renderFunctions.createTemplateInstance('customerTemplate',infoObj.parentID);
					var $tmp = $("<div>").tlc({templateid:infoObj.templateID,'verb':'template'});
					$customer = $tmp.children();
					$customer.attr({id:infoObj.parentID});
					$('#mainContentArea').append($customer);
					_app.u.handleCommonPlugins($customer);
					_app.u.handleButtons($customer);
					}

				$('.textContentArea',$customer).hide(); //hide all the articles by default and we'll show the one in focus later.

				infoObj.state = 'init';
				_app.renderFunctions.handleTemplateEvents($customer,infoObj);
				
				if(!_app.u.buyerIsAuthenticated() && this.thisArticleRequiresLogin(infoObj))	{
					_app.ext.quickstart.u.showLoginModal();
					$('#loginSuccessContainer').empty(); //empty any existing login messaging (errors/warnings/etc)
//this code is here instead of in showLoginModal (currently) because the 'showCustomer' code is bound to the 'close' on the modal.
					$('<button>').addClass('stdMargin ui-state-default ui-corner-all  ui-state-active').attr('id','modalLoginContinueButton').text('Continue').click(function(){
						$('#loginFormForModal').dialog('close');
						_app.ext.quickstart.u.showCustomer(infoObj) //binding this will reload this 'page' and show the appropriate content.
						}).appendTo($('#loginSuccessContainer'));					
					}
//should only get here if the page does not require authentication or the user is logged in.
				else	{
					$('#newsletterArticle').hide(); //hide the default.
					var $article = $('#'+infoObj.show+'Article',$customer)
					$article.show(); //only show content if page doesn't require authentication.

//already rendered the page and it's visible. do nothing. Orders is always re-rendered cuz the data may change.
					if($article.data('isTranslated') && infoObj.show != 'orders')	{}
					else	{
						switch(infoObj.show)	{
							case 'help':
								myApp.ext.quickstart.a.showBuyerCMUI();
								break;
						
							case 'newsletter':
								$article.showLoading({'message':'Fetching newsletter list'});
								_app.model.addDispatchToQ({"_cmd":"appNewsletterList","_tag" : {
									"datapointer" : "appNewsletterList",
									callback : 'tlc',
									jqObj : $article
									}},'mutable');
								_app.model.dispatchThis('mutable');
								break;
							
							case 'subscriberLists':
								_app.model.addDispatchToQ({"_cmd":"buyerNewsletters","_tag":{"datapointer":"buyerNewsletters"}},"mutable");
								_app.model.addDispatchToQ({"_cmd":"appNewsletterList","_tag" : {
									"datapointer" : "appNewsletterList",
									callback : 'tlc',
									jqObj : $article
									}},'mutable');
								_app.model.dispatchThis('mutable');
								break;	
							case 'invoice':
							
								var orderID = infoObj.uriParams.orderid;
								var cartID = infoObj.uriParams.cartid;
								if(cartID && orderID)	{
									$article.showLoading({'message':'Retrieving order information'});
									_app.model.addDispatchToQ({"_cmd":"buyerOrderGet",'orderid':orderID,'cartid':cartID,"_tag":{
										"datapointer":"buyerOrderGet|"+orderID,
										"callback": "tlc",
										"jqObj" : $article
										}},"mutable");
									_app.model.dispatchThis('mutable');
									}
								else	{
									$article.anymessage({'message':'Both a cart id and an order id are required (for security reasons) and one is not available. Please try your link again or, if the error persists, contact us for additional help.'});
									}
								break;
							case 'orders':
							//always fetch a clean copy of the order history.
								_app.model.addDispatchToQ({"_cmd":"buyerPurchaseHistory","_tag":{
									"datapointer":"buyerPurchaseHistory",
									"callback":"tlc",
									"verb" : "translate",
									"jqObj" : $("[data-app-role='orderList']",$article).empty()
									}},"mutable");
								break;
							case 'lists':
//								_app.model.addDispatchToQ({"_cmd":"buyerProductLists","_tag":{"datapointer":"buyerProductLists",'parentID':'listsContainer','callback':'showBuyerLists','extension':'quickstart'}},"mutable");
								_app.model.addDispatchToQ({"_cmd":"buyerProductLists","_tag":{"datapointer":"buyerProductLists",'verb':'translate','jqObj': $('#listsArticle',$customer),'callback':'tlc',onComplete : function(rd){
//data formatting on lists is unlike any other format for product, so a special handler is used.				
									function populateBuyerProdlist(listID,$context)	{
										//add the product list ul here because tlc statement has list ID for bind.
										$("[data-buyerlistid='"+listID+"']",$customer).append("<ul data-tlc=\"bind $var '.@"+listID+"'; store_prodlist#productlist  --hideSummary='1' --withReviews='1' --withVariations='1' --withInventory='1' --templateid='productListTemplateBuyerList'  --legacy;\" class='listStyleNone fluidList clearfix noPadOrMargin productList'></ul>");
										_app.model.addDispatchToQ({"_cmd":"buyerProductListDetail","listid":listID,"_tag" : {'datapointer':'buyerProductListDetail|'+listID,"listid":listID,'callback':'buyerListAsProdlist','extension':'quickstart','jqObj':$("[data-buyerlistid='"+listID+"'] ul",$context)}},'mutable');
										}
									
									var data = _app.data[rd.datapointer]['@lists']; //shortcut
									var L = data.length;
									var numRequests = 0;
									for(var i = 0; i < L; i += 1)	{
										populateBuyerProdlist(data[i].id,rd.jqObj)
										}
									_app.model.dispatchThis('mutable');
									//no sense putting 1 list into an accordion.
									if(L > 1)	{
										$('.applyAccordion',rd.jqObj).accordion({heightStyle: "content"});
										}
									}}},"mutable");
								break;
							case 'myaccount':
	//							dump(" -> myaccount article loaded. now show addresses...");
								_app.ext.cco.calls.appCheckoutDestinations.init(_app.model.fetchCartID(),{},'mutable'); //needed for country list in address editor.
								_app.model.addDispatchToQ({"_cmd":"buyerAddressList","_tag":{'callback':'tlc','jqObj':$customer,'verb':'translate','datapointer':'buyerAddressList'}},'mutable');
								break;
							
							case 'logout':
								$(document.body).removeClass('buyerLoggedIn');
								$('.username').empty();
								_app.u.logBuyerOut();
								document.location.hash = '';
								break;
							default:
								dump("WARNING - unknown article/show ["+infoObj.show+" in showCustomer. ");
							}
						_app.model.dispatchThis();
						}
					}
				infoObj.state = 'complete'; //needed for handleTemplateEvents.
				_app.renderFunctions.handleTemplateEvents($customer,infoObj);
				return $customer;
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



			showPaymentUpdateModal : function(orderid,cartid)	{
				var $updateDialog = $("<div \/>",{'title':'Payment Update'}).appendTo('body');
				$updateDialog.dialog({'modal':true,'width':500,'height':500});
				
				if(orderid && cartid)	{
					$updateDialog.showLoading({'message':'One moment please. Acquiring payment methods.'});
					_app.ext.cco.calls.appPaymentMethods.init({'cartid':cartid,'orderid':orderid},{},'immutable');
					_app.model.dispatchThis('immutable');
					}
				else	{
					$updateDialog.anymessage({'message':'In quickstart.u.showPaymentUpdateModal, either orderid ['+orderid+'] or cartid ['+cartid+'] is not set.','gMessage':true});
					}
				},



//pass in a bindNav anchor and the 'pageInfo' will be returned.
//ex #category?navcat=.something will return {pageType:category,navcat:.something}
			parseAnchor : function(str)	{
				var P = {};
				if(str)	{
					var tmp1 = str.replace(/\#!?/g,'').split('?'); //the regext will strip # or #! off the front of the string.
					P.pageType = tmp1[0];
					if(tmp1.length > 1){
						var tmp2 = tmp1[1].split('=');
						P[tmp2[0]] = tmp2[1];
						}
					else {
						// Should reach here in case of href="#homepage" (or anything with no params, but #homepage is the only use-case
						}
					}
				else	{
					}
//					dump(P);
				return P;
			}, //parseAnchor
			
/*
will close any open modals. 
by closing modals only (instead of all dialogs), we can use dialogs to show information that we want to allow the
buyer to 'take with them' as they move between  pages.
*/
			closeAllModals : function(){
//				dump("BEGIN quickstart.u.closeAllModals");
				$(".ui-dialog-content").each(function(){
					var $dialog = $(this);
///					dump(" -> $dialog.dialog('option','dialog'): "); dump($dialog.dialog('option','dialog'));
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
				$('#loginFormForModal').dialog({modal: true,width: ($(window).width() > 500) ? 500 : '90%',autoOpen:false});
				$('#loginFormForModal').dialog('open');
				
		
				}, //showLoginModal

//executed from showCompany (used to be used for customer too)
//articles should exist inside their respective pageInfo templates (companyTemplate or customerTemplate)
//NOTE - as of version 201225, the parameter no longer has to be a string (subject), but can be an object. This allows for uri params or any other data to get passed in.
// * 201346 -> function now returns a boolean based on whether or not hte page is shown.
			showArticleIn : function($page,infoObj)	{
				var r = true; //what is returned. set to false if the article is NOT shown.
//				dump("BEGIN quickstart.u.showArticle"); dump(infoObj);
				$('.textContentArea',$page).hide(); //hide all the articles by default and we'll show the one in focus later.
				
				var subject;
				if(typeof infoObj == 'object')	{
					subject = infoObj.show
					$('.sideline .navLink_'+subject,$page).addClass('ui-state-highlight');
					}
				else if(typeof infoObj == 'string')	{subject = infoObj}
				else	{
					dump("WARNING - unknown type for 'infoObj' ["+typeof infoObj+"] in showArticle")
					}

				if(subject)	{
					var $article = $('#'+subject+'Article',$page);
					if($article.length)	{
						if(!$article.hasClass('disabled'))	{
							$article.show(); //only show content if page doesn't require authentication.
							switch(subject)	{
								case 'faq':
									_app.ext.store_crm.calls.appFAQsAll.init({'parentID':'faqContent','callback':'showFAQTopics','extension':'store_crm','templateID':'faqTopicTemplate'});
									_app.model.dispatchThis();
									break;
								default:
									//the default action is handled in the 'show()' above. it happens for all.
								}
							}
						else	{
							r = false;
							$('#globalMessaging').anymessage({
								'gMessage' : true,
								'message' : "In quickstart.u.showArticle, subject = "+subject+" no longer exists."
								});
							}
						}
					else	{
						r = false;
						$('#globalMessaging').anymessage({
							'gMessage' : true,
							'message' : "In quickstart.u.showArticle, subject = "+subject+" but that article has no length on the DOM"
							});
						}
					}
				else	{
					$('#globalMessaging').anymessage({
						'gMessage' : true,
						'message' : "In quickstart.u.showArticle, infoObj.show was not defined."
						});
					}
				return r;
				},

//will return a list of recent searches as a jq object ordered list.
			getRecentSearchesOL : function()	{
				var $o = $("<ol \/>"); //What's returned. ordered lists of searches w/ click events.
				var L = _app.ext.quickstart.vars.session.recentSearches.length;
				var keywords,count;
				for(var i = 0; i < L; i++)	{
					keywords = _app.ext.quickstart.vars.session.recentSearches[i];
//					dump(" -> _app.data['searchResult|"+keywords+"'] and typeof = "+typeof _app.data['searchResult|'+keywords]);
					count = $.isEmptyObject(_app.data['appPublicSearch|'+keywords]) ? '' : _app.data['appPublicSearch|'+keywords]['_count']
					if(_app.u.isSet(count))	{
						count = " ("+count+")";
						}
					$("<li \/>").on('click',function(){
						$('.productSearchKeyword').val('"+keywords+"');
						document.location.hash = _app.ext.store_routing.u.searchAnchor('keywords',keywords);
						return false;
						}).text(keywords).appendTo($o);
					}
				return $o;
				},

			showPageInDialog : function(infoObj)	{
				if(infoObj.templateID && infoObj.navcat)	{
					infoObj.dialogID = infoObj.templateID+'_'+_app.u.makeSafeHTMLId(infoObj.navcat)+"_dialog";
//dialog can be set to true and will use default settings or it can be set to an object of supported dialog parameters.
					infoObj.dialog = $.isEmptyObject(infoObj.dialog) ? {modal: true,width:'86%',height:$(window).height() - 100} : infoObj.dialog; 
					infoObj.dialog.autoOpen = false; //always set to false, then opened below. fixes some issues with re-opening the same id in a modal.
					var $parent = $(_app.u.jqSelector('#',infoObj.dialogID));
					
//parent may not exist. empty if it does, otherwise create it.
					if($parent.length)	{$parent.empty()}
					else	{$parent = $("<div \/>").attr({"id":ID,"title":"Product Images"}).appendTo('body');}					
					
					infoObj.parentID = infoObj.dialogID+"_content"; //the parentID passed in is the modal ID. this is for the contents and needs to be different so showPage knows whether it has been rendered before or not.
					this.showPage(infoObj);
					$parent.dialog(infoObj.dialog);
					$parent.dialog('open');
					}
				else	{
					dump("WARNING! either templateID ["+infoObj.templateID+"] or navcat ["+infoObj.navcat+"] not passed into showPageInDialog");
					}
				return infoObj;
				},

//best practice would be to NOT call this function directly. call showContent.

			showPage : function(infoObj)	{
//				dump("BEGIN quickstart.u.showPage("+infoObj.navcat+")");

				var catSafeID = infoObj.navcat;
				if(!catSafeID)	{
					$("#globalMessaging").anymessage({"message":"In quickstart.u.showPage, no navcat was passed in infoObj.","gMessage":true});
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
					infoObj.state = 'init';
					var parentID = infoObj.parentID || infoObj.templateID+'_'+_app.u.makeSafeHTMLId(catSafeID);
					var $parent = $(_app.u.jqSelector('#',parentID));
				
					infoObj.parentID = parentID;
					_app.renderFunctions.handleTemplateEvents($parent,infoObj);
//only have to create the template instance once. showContent takes care of making it visible again. but the onComplete are handled in the callback, so they get executed here.
					if($parent.length > 0){
//set datapointer OR it won't be present on an oncomplete for a page already rendered.
						infoObj.datapointer = infoObj.datapointer || "appNavcatDetail|"+catSafeID; 
//						dump(" -> "+parentID+" already exists. Use it");
						infoObj.state = 'complete'; //needed for handleTemplateEvents.
						_app.renderFunctions.handleTemplateEvents($parent,infoObj);
						}
					else	{
//						var $content = _app.renderFunctions.createTemplateInstance(infoObj.templateID,{"id":parentID,"catsafeid":catSafeID});
						$parent = new tlc().getTemplateInstance(infoObj.templateID);
						$parent.attr({id:parentID,"data-catsafeid":catSafeID});
//if dialog is set, we've entered this function through showPageInDialog.
//content gets added immediately to the dialog.
//otherwise, content is added to mainContentArea and hidden so that it can be displayed with a transition.
						if(infoObj.dialogID)	{$('#'+infoObj.dialogID).append($parent)}
						else	{
							$parent.addClass('displayNone'); //hidden by default for page transitions.
							$('#mainContentArea').append($parent);
							}
						$.extend(infoObj,{'callback':'fetchPageContent','extension':'quickstart','jqObj':$parent});
						_app.calls.appNavcatDetail.init({'path':catSafeID,'detail':'max'},infoObj);
						_app.model.dispatchThis();
						}
					}
				return $parent;
				}, //showPage



//required params include templateid and either: tagObj.navcat or tagObj.pid  navcat can = . for homepage.
//load in a template and the necessary queries will be built.
//currently, only works on product, category and home page templates.
//by the time we get to this point, the core dataset (appNavcatDetail or appProductGet) is already in memory.
			buildQueriesFromTemplate : function(tagObj)	{
//dump("BEGIN quickstart.u.buildQueriesFromTemplate");
//dump(tagObj);

var numRequests = 0; //will be incremented for # of requests needed. if zero, execute showPageContent directly instead of as part of ping. returned.

$.extend(tagObj, {"callback":"showPageContent","extension":"quickstart","lists":[]});
/*
var tagObj = P;  //used for ping and in handleCallback if ping is skipped.
tagObj.callback = 'showPageContent';
tagObj.searchArray = new Array(); //an array of search datapointers. added to _tag so they can be translated in showPageContent
tagObj.extension = 'quickstart'
tagObj.lists = new Array(); // all the list id's needed.
*/

//compiles a list of all the bind commands scalar pointers. (ex:  %page.description,@products) NOT the values themselves.
//used to determine what data needs to be fetched.
var bindArr = new tlc().getBinds(tagObj.templateID);

if(tagObj.pid)	{
	if($.inArray('%attribs.zoovy:grp_children',bindArr) >= 0 && _app.u.thisNestedExists("data.appProductGet|"+tagObj.pid+".%attribs",_app) && _app.data['appProductGet|'+tagObj.pid]['%attribs']['zoovy:grp_type'] == 'CHILD' && _app.data['appProductGet|'+tagObj.pid]['%attribs']['zoovy:grp_parent'])	{
		numRequests += _app.calls.appProductGet.init({'pid':_app.data['appProductGet|'+tagObj.pid]['%attribs']['zoovy:grp_parent']},{},'mutable');
		}
	}
else if(tagObj.navcat)	{
	_app.model.fetchData('appPageGet|'+tagObj.navcat); //move data from local storage to memory, if present.
	//pageAttributes is an array of all the %page. scalars refenced in the template. They're fetched in a special manner.
	//pageObj is a pointer to the category page object in memory, if set. used to see if data is already available.
	var pageAttributes = new Array(), pageObj = (_app.u.thisNestedExists("data.appPageGet|"+tagObj.navcat+".%page",_app)) ? _app.data['appPageGet|'+tagObj.navcat]['%page'] : {}; 
	
	for(var i = 0, L = bindArr.length; i < L; i += 1)	{
		if(bindArr[i].indexOf('%page') == 0 && (!pageObj[bindArr[i]] || !pageObj[bindArr[i]] === null))	{ //a null value would mean the data was requested already but isn't set.
			pageAttributes.push(bindArr[i].substring(6)); //api is sent an array w/out %page. (ex: %page.description is set as description)
			}
		else if(bindArr[i].charAt(0) == '$' && bindArr[i].indexOf('.@products') >= 0)	{
			var listName = bindArr[i].split('.')[0];
			numRequests += _app.calls.appNavcatDetail.init({'path':listName,'detail':'fast'});
			tagObj.lists.push(listName); //attribute formatted as $listname.@products
			}
		else if(bindArr[i] == '@subcategoryDetail')	{
//SANITY -> can't use thisNestedExists here because appNavcatDetail|. for homepage will return false.
			if(_app.data['appNavcatDetail|'+tagObj.navcat]['@subcategoryDetail'] && !$.isEmptyObject(_app.data['appNavcatDetail|'+tagObj.navcat]['@subcategoryDetail']))	{
				numRequests += _app.ext.store_navcats.u.getChildDataOf(tagObj.navcat,{},'max');
				}
			}
		else	{}
		//Get category detail for this tree.
		numRequests += _app.ext.store_navcats.u.addQueries4BreadcrumbToQ(tagObj.navcat).length;
		}
	if(pageAttributes.length)	{
		numRequests += _app.ext.store_navcats.calls.appPageGet.init({'PATH':tagObj.navcat,'@get':pageAttributes});
		}
	}
	if(numRequests > 0)	{
		delete tagObj.datapointer; //delete datapointer or ping will save over it.
		_app.calls.ping.init(tagObj);
		}
	else	{
		_app.ext.quickstart.callbacks.showPageContent.onSuccess(tagObj);
		}		

	return numRequests;


				}, //buildQueriesFromTemplate






			showOrderDetails : function($orderParent)	{
//				dump("BEGIN quickstart.u.showOrderDetails");
				
				var $orderHeader = $("[data-app-role='orderHeader']",$orderParent).first(),
				$orderContents = $("[data-app-role='orderContents']",$orderParent).first(),
				orderID = $orderParent.data('orderid');

//if the element is empty, then this is the first time it's been clicked. Go get the data and display it, changing classes as needed.
				if($orderContents.is(':empty'))	{

					$orderContents.show().addClass('ui-corner-bottom ui-accordion-content-active'); //object that will contain order detail contents.
					$orderContents.showLoading();

					_app.model.addDispatchToQ({"_cmd":"buyerOrderGet",'orderid':orderID,"_tag":{
						"datapointer":"buyerOrderGet|"+orderID,
						'templateid':'invoiceTemplate',
						"callback": "tlc",
						"jqObj" : $orderContents
						}},"mutable");
					_app.model.dispatchThis('mutable');
	
					$orderContents.siblings().addClass('ui-state-active').removeClass('ui-corner-bottom').find('.ui-icon-triangle-1-e').removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s');

					}

				else	{
//will only get here if the data is already loaded. show/hide panel and adjust classes.

if($orderContents.is(':visible'))	{
	$orderContents.hide();
	$orderHeader.removeClass('ui-state-active').addClass('ui-corner-bottom').find('.ui-icon-triangle-1-s').removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-e')
	}
else	{
	$orderContents.show();
	$orderHeader.addClass('ui-state-active').removeClass('ui-corner-bottom').find('.ui-icon-triangle-1-e').removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s')
	}
					}
				

				}, //showOrderDetails
	

				
//_app.ext.quickstart.u.handleMinicartUpdate();			
			handleMinicartUpdate : function(tagObj)	{
//				dump("BEGIN quickstart.u.handleMinicartUPdate"); dump(tagObj);
				var r = false; //what's returned. t for cart updated, f for no update.
				var $appView = $('#appView');
				var itemCount = 0;
				var subtotal = 0;
				var total = 0;
				if(_app.data[tagObj.datapointer] && _app.data[tagObj.datapointer].sum)	{
					r = true;
					var itemCount = _app.u.isSet(_app.data[tagObj.datapointer].sum.items_count) || 0;
					var subtotal = _app.data[tagObj.datapointer].sum.items_total;
					var total = _app.data[tagObj.datapointer].sum.order_total;
					}
				else	{
					//cart not in memory yet. use defaults.
					}

				$('.cartItemCount',$appView).text(itemCount);
				$('.cartSubtotal',$appView).text(_app.u.formatMoney(subtotal,'$',2,false));
				$('.cartTotal',$appView).text(_app.u.formatMoney(total,'$',2,false));

				//no error for cart data not being present. It's a passive function.
				return r;
				},

		


			
			getDataFromInfoObj : function(infoObj){
				//initialized to an empty object, so that we don't return a null pointer
				var data = {};
				
				if(infoObj.datapointer){
					data = _app.data[infoObj.datapointer];
					}
				else {
					switch(infoObj.pageType){
						case "product" :
							data = _app.data['appProductGet|'+infoObj.pid];
							break;
						case "homepage" :
							//both homepage and category share the same infoObj.navcat syntax, so we can cascade
						case "category" :
							data = _app.data['appNavcatDetail|'+infoObj.navcat];
							break;
						case "customer" :
							data = _app.data.appBuyerLogin;
							break;
						case "company" :
							//Return an empty object
							break;
						case "search" :
							data = _app.data["appPublicSearch|"+JSON.stringify(infoObj.elasticsearch)];
							break;
						case "cart" :
							//Both cart and checkout can return the cart, so we can cascade
						case "checkout" :
							data = _app.data.cartDetail;
							break;
						default :
							//Return an empty object
							break;
						}
					}
				return data;
				}
			
			}, //util

////////////////////////////////////   app Events [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		e : {
//add this as a data-app-submit to the login form.
			accountLoginSubmit : function($ele,p)	{
				p.preventDefault();
				if(_app.u.validateForm($ele))	{
					var sfo = $ele.serializeJSON();
					_app.ext.cco.calls.cartSet.init({"bill/email":sfo.login,"_cartid":_app.model.fetchCartID()}) //whether the login succeeds or not, set bill/email in the cart.
					sfo._cmd = "appBuyerLogin";
					sfo.method = 'unsecure';
					sfo._tag = {"datapointer":"appBuyerLogin",'callback':'authenticateBuyer','extension':'quickstart'}
					_app.model.addDispatchToQ(sfo,"immutable");
					_app.calls.refreshCart.init({},'immutable'); //cart needs to be updated as part of authentication process.
					_app.model.dispatchThis('immutable');
					}
				else	{} //validateForm will handle the error display.
				return false;
				},

			accountPasswordRecoverSubmit : function($ele,p)	{
				p.preventDefault();
				if(_app.u.validateForm($ele))	{
					$ele.showLoading({'message':'Sending request for password recovery.'});
					_app.model.addDispatchToQ({
						"_cmd":"appBuyerPasswordRecover",
						"method":"email",
						"login":$("[name='login']",$ele).val(),
						"_tag":{
							"datapointer":"appBuyerPasswordRecover",
							'callback':'showMessaging',
							'message':'Thank you, will receive an email shortly',
							'jqObj':$ele
							}
						},"immutable");
					_app.model.dispatchThis('immutable');
					}
				else	{} //validateForm will handle the error display.
				return false;
				},
	
			cartShipMethodSelect : function($ele,P)	{
				P.preventDefault();
				var $cart = $ele.closest("[data-template-role='cart']");
				_app.ext.cco.calls.cartSet.init({'_cartid':$cart.data('cartid'),'want/shipping_id':$ele.val()},{},'immutable');
				$cart.trigger('fetch',{'Q':'immutable'});
				_app.model.dispatchThis('immutable');
				return false;
				},
			
			cartMessagePageSend : function($ele,p)	{
				p.preventDefault();
				var vars = _app.u.getWhitelistedObject(_app.ext.quickstart.vars.sotw,['pageType','pid','show','navcat','keywords','templateID','uriParams']); //don't need everything in sotw.
				var cartid = $ele.closest("[data-app-role='cartMessenger']").data('cartid');
				vars.domain = (document.location.protocol == 'file:') ? _app.vars.testURL : document.domain;
				_app.model.addDispatchToQ({'_cmd':'cartMessagePush','what':'view.'+vars.pageType,'vars':vars,'_cartid':cartid,'_tag':{
					'callback' : function(rd)	{
						if(_app.model.responseHasErrors(rd)){
							$('#cartMessenger').anymessage({'message':rd});
							}
						else	{
							//sample action. success would go here.
							$("[data-app-role='messageHistory']",'#cartMessenger').append(vars.pageType+" page sent to admin.");
							}
						}
					}},'passive');
				_app.model.dispatchThis('passive');
				return false;
				},
			
			dialogCloseExec : function($ele,p)	{
				$ele.closest('.ui-dialog-content').dialog('close');
				return false;
				},
			
			faqDetailShow : function($ele,p)	{
				p.preventDefault();
				_app.ext.quickstart.a.showFAQbyTopic($ele.closest('[data-topicid]').data('topicid'));
				return false;
				},
			
			execOrder2Cart : function($ele,p)	{
				p.preventDefault();
				var orderID = $ele.closest("[data-orderid]").data('orderid');
				if(orderID)	{
					_app.ext.cco.u.appendOrderItems2Cart({orderid:orderID,cartid:_app.model.fetchCartID()},function(rd){
						if(_app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							document.location.hash = '#!cart';
							}
						});
					}
				else	{
					$('#globalMessaging').anymessage({'message':"In quickstart.e.execOrder2Cart, unable to determine orderID",'gMessage':true});
					}
				return false;
				}, //execOrder2Cart

			orderDetailShow : function($ele,p)	{
				p.preventDefault();
				_app.ext.quickstart.u.showOrderDetails($ele.closest("[data-app-role='orderLineitemContainer']"));
				return false;
				},

			inlineProductPreviewShow : function($ele,p)	{
				p.preventDefault();
				_app.ext.quickstart.a.handleProdPreview($ele.closest("[data-pid]").data('pid'));
				return false;
				},

			showContent : function($ele,p)	{
				p.preventDefault();p
				if($ele.data('hash'))	{
					document.location.hash = $ele.data('hash');
					}
				else	{
					$("#globalMessaging").anymessage({"message":"In quickstart.e.showContent, no data-hash set on trigger element.","gMessage":true});
					}
				return false;
				},

			passwordChangeSubmit : function($ele,p)	{
				p.preventDefault();
				if(_app.u.validateForm($ele))	{
					_app.ext.store_crm.u.handleChangePassword($ele,{'callback':'showMessaging','message':'Thank you, your password has been changed','jqObj':$ele});
					}
				else	{}
				return false;
				},

			productAdd2Cart : function($ele,p)	{
				p.preventDefault();
				//the buildCartItemAppendObj needs a _cartid param in the form.
				if($("input[name='_cartid']",$ele).length)	{}
				else	{
					$ele.append("<input type='hidden' name='_cartid' value='"+_app.model.fetchCartID()+"' \/>");
					}

				var cartObj = _app.ext.store_product.u.buildCartItemAppendObj($ele);
				if(cartObj)	{
					_app.ext.cco.calls.cartItemAppend.init(cartObj,{},'immutable');
					_app.model.destroy('cartDetail|'+cartObj._cartid);
					_app.calls.cartDetail.init(cartObj._cartid,{'callback':function(rd){
						if(_app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							if($ele.data('show') == 'inline')	{
								document.location.hash = '#!cart';
								}
							else	{
								_app.ext.quickstart.u.showCartInModal({'templateID':'cartTemplate'});
								}
							cartMessagePush(cartObj._cartid,'cart.itemAppend',_app.u.getWhitelistedObject(cartObj,['sku','pid','qty','quantity','%variations']));
							}
						}},'immutable');
					_app.model.dispatchThis('immutable');
					
					}
				else	{} //do nothing, the validation handles displaying the errors.
				return false;
				},
			productAdd2List : function($ele,p)	{
				p.preventDefault();
				var pid = $ele.closest("[data-pid]").data('pid');
				if($ele.data('listid') && pid)	{
					_app.ext.quickstart.a.add2BuyerList({sku:pid,'listid':$ele.data('listid')});
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_crm.e.productAdd2List, unable to ascertain pid ["+pid+"] or data-listid was not set on trigger element.","gMessage":true});
					}
				return false;
				},
				
			productPicsInModalShow : function($ele,p){
				p.preventDefault();
				_app.ext.store_product.u.showPicsInModal({"pid":$ele.closest("[data-pid]").data('pid')});
				return false;
				},

			subscribeSubmit : function($ele,p)	{
				p.preventDefault();
				_app.ext.store_crm.u.handleSubscribe($ele.attr('id'));
				return false;
				},

//add to form element. input name='KEYWORDS' is required for this simple search.
			searchFormSubmit : function($ele,p)	{
				p.preventDefault();
				var sfo = $ele.serializeJSON($ele);
				if(sfo.KEYWORDS)	{
					document.location.hash = '#!search/keywords/'+sfo.KEYWORDS;
					}
				return false;
				},

			showBuyerAddressUpdate : function($ele,p)	{
				p.preventDefault();
				_app.ext.store_crm.u.showAddressEditModal({
					'addressID' : $ele.closest("address").data('_id'),
					'addressType' : $ele.closest("[data-app-addresstype]").data('app-addresstype')
					},function(){
					$('#mainContentArea_customer').empty().remove(); //kill so it gets regenerated. this a good idea?
					showContent('customer',{'show':'myaccount'});
					});
				return false;
				}, //showBuyerAddressUpdate

			showBuyerAddressAdd : function($ele,p)	{
				p.preventDefault();
				_app.ext.store_crm.u.showAddressAddModal({
					'addressType' : $ele.closest("[data-app-addresstype]").data('app-addresstype')
					},function(rd){
					$('#mainContentArea_customer').empty().remove(); //kill so it gets regenerated. this a good idea?
					showContent('customer',{'show':'myaccount'});
					});
				return false;
				}, //showBuyerAddressAdd

			quickviewShow : function($ele,p)	{
				p.preventDefault();
				var PID = $ele.data('pid') || $ele.closest('[data-pid]').attr('data-pid');
				var templateID = $ele.data('loadstemplate');
				if(PID && templateID)	{
					quickView('product',{'templateID':templateID,'pid':PID});
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In quickstart.e.quickviewShow, unable to ascertain PID ["+PID+"] or no data-loadstemplate set on trigger element.","gMessage":true});
					}
				return false;
				}

			}, // e/events


////////////////////////////////////   			thirdPartyFunctions		    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	thirdParty : {

/*
executed during control init. 
for now, all it does is save the facebook user data as needed, if the user is authenticated.
later, it will handle other third party plugins as well.
*/
		init : function()	{
			dump("BEGIN quickstart.handleThirdParty.Init");

			var uriParams = _app.u.kvp2Array(location.hash.substring(1)) || {};
			//landing on the admin app, having been redirected after logging in to google.
			if(uriParams.trigger == 'googleAuth')	{
				_app.calls.authAdminLogin.init({
					'authtype' : 'google:id_token',
					'id_token' : uriParams.id_token
					},{'datapointer' : 'authAdminLogin','callback':'showHeader','extension':'admin'},'immutable');
				_app.model.dispatchThis('immutable');
				}
			//just returned from google
			else if(uriParams.id_token && uriParams.state)	{

				if(uriParams.state)	{
					
					dump(" -> state was defined as a uri param");
					var state = jQuery.parseJSON(atob(uriParams.state));
					dump(" -> post decode/parse state:");	dump(state);
//to keep the DOM as clean as possible, only declare this function if it's needed.					
					if(state.onReturn == 'return2Domain')	{
						window.return2Domain = function(s,uP){
							document.location = s.domain+"#trigger=googleAuth&access_token="+uP.access_token+"&id_token="+uP.id_token
							}
						}
					
					if(state.onReturn && typeof window[state.onReturn] == 'function')	{
						window[state.onReturn](state,uriParams);
						}
					else	{
						dump(" -> state was defined but either onReturn ["+state.onReturn+"] was not set or not a function [typeof: "+typeof window[state.onReturn]+"].");
						}
					}

				}

//initial init of fb _app.
			if(typeof zGlobals !== 'undefined' && zGlobals.thirdParty.facebook.appId && typeof FB !== 'undefined')	{
//				dump(" -> facebook appid set. load user data.");
				FB.init({appId:zGlobals.thirdParty.facebook.appId, cookie:true, status:true, xfbml:true});
				_app.ext.quickstart.thirdParty.fb.saveUserDataToSession();
				}
			else	{
//				dump(" -> did not init FB app because either appid isn't set or FB is undefined ("+typeof FB+").");
				}
//			dump("END _app.u.handleThirdPartyInits");
			}, //init

//executed inside handleTHirdPartyInits as well as after a facebook login.

// ### TODO -> move out of here and either into a FB extension or quickstart.		
		fb : {
			
			postToWall : function(msg)	{
				dump('BEGIN thirdpartyfunctions.facebook.posttowall. msg = '+msg);
				FB.ui({ method : "feed", message : msg}); // name: 'Facebook Dialogs', 
				},
			
			share : function(a)	{
				a.method = 'send';
				FB.ui(a);
				},
				
		
			saveUserDataToSession : function()	{
//				dump("BEGIN _app.ext.quickstart.thirdParty.fb.saveUserDataToSession");
				
				FB.Event.subscribe('auth.statusChange', function(response) {
//					dump(" -> FB response changed. status = "+response.status);
					if(response.status == 'connected')	{
	//save the fb user data elsewhere for easy access.
						FB.api('/me',function(user) {
							if(user != null) {
//								dump(" -> FB.user is defined.");
								_app.vars.fbUser = user;
								_app.ext.cco.calls.cartSet.init({"bill/email":user.email,"_cartid":_app.model.fetchCartID()});

//								dump(" -> user.gender = "+user.gender);

if(_gaq.push(['_setCustomVar',1,'gender',user.gender,1]))
	dump(" -> fired a custom GA var for gender.");
else
	dump(" -> ARGH! GA custom var NOT fired. WHY!!!");


								}
							});
						}
					});
//				dump("END _app.ext.quickstart.thirdParty.fb.saveUserDataToSession");
				}
			}
		}

		} //r object.
	return r;
	}