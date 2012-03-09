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


var proximus = function() {
	var r = {
		
	vars : {
//a list of the templates used by this extension.
//if this is a custom extension and you are loading system extensions (prodlist, etc), then load ALL templates you'll need here.
		"templates" : ['productTemplate','mpControlSpec','categoryTemplate','categoryPageTemplate','prodViewerTemplate','cartViewer','cartViewerProductTemplate','prodReviewSummaryTemplate','productChildrenTemplate','prodReviewsTemplate','reviewFrmTemplate','subscribeFormTemplate','categoryThumbTemplate','orderLineItemTemplate','orderContentsTemplate','cartSummaryTemplate','orderProductLineItemTemplate','helpTemplate','toolsTemplate','productDetailedTemplate'],
		"user" : {
			"recentSearches" : [],
			},
		"dependAttempts" : 0,  //used to count how many times loading the dependencies has been attempted.
		"dependencies" : ['store_prodlist','store_navcats','store_product','store_search','store_cart','store_crm'] //a list of other extensions (just the namespace) that are required for this one to load
		},


					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



	calls : {

		}, //calls




					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





	callbacks : {
		init : {
			onSuccess : function()	{
//				myControl.util.dump('BEGIN myControl.ext.proximus.init.onSuccess ');
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
/*
doesn't play well because extension is loading prior to response for flags (which is/was in teh controller)
				if(myControl.data['canIUse|xsell'].allowed != 1)	{
					$('#globalMessaging').toggle(true).append(myControl.util.formatMessage({'message':'<strong>Uh No! This merchant does not have some of the necessary flags enabled (xsell).<\/strong>','uiClass':'error','uiIcon':'alert'}));
					r = false;
					}

				if(myControl.data['canIUse|crm'].allowed != 1)	{
					$('#globalMessaging').toggle(true).append(myControl.util.formatMessage({'message':'<strong>Uh No! This merchant does not have some of the necessary flags enabled (xsell).<\/strong>','uiClass':'error','uiIcon':'alert'}));
					r = false;
					}
*/

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				myControl.util.dump('BEGIN myControl.ext.proximus.callbacks.init.onError');
				}
			},

		startMyProgram : {
			onSuccess : function()	{
//				myControl.util.dump('BEGIN myControl.ext.proximus.callbacks.startMyProgram.onSuccess');
//go get the root level categories, then show them using showCategories callback.
				myControl.ext.store_navcats.calls.categoryTree.init({"callback":"showRootCategories","extension":"proximus"});
				
//				myControl.util.dump(" -> typeof myControl.calls = "+typeof myControl.calls);
//				myControl.util.dump(" -> typeof myControl = "+typeof myControl);
				
				myControl.calls.getProfile.init(myControl.vars.profile,{"callback":"haveProfileData","extension":"proximus"}); //have profile data handy.
				myControl.ext.store_cart.calls.getCartContents.init({},'mutable'); //have cart data handy. do nothing with it.
				myControl.ext.store_cart.calls.getShippingRates.init({},'mutable');
				if(myControl.vars.cid)	{
					myControl.util.dump(" -> customerid: "+myControl.vars.cid);
					myControl.ext.store_crm.calls.getCustomerList.init('forgetme',{'callback':'handleForgetmeList','extension':'store_prodlist'},'mutable');
					}
				myControl.model.dispatchThis();

//if a catalog is specified, bind a keyword autocomplete to the search form.
				if($('#headerCatalog').val() != '')	{
					myControl.ext.store_search.util.bindKeywordAutoComplete('headerSearchFrm');
					}

//adds submit functionality to search form. keeps dom clean to do it here.
				$('#headerSearchFrm').submit(function(){
myControl.ext.store_search.calls.searchResult.init($(this).serializeJSON(),{'callback':'showResults','extension':'proximus'});
// DO NOT empty altSearchesLis here. wreaks havoc.
myControl.model.dispatchThis();
$(".ui-dialog-content").dialog("close"); //close any open dialogs. needs to happen when a wiki link is clicked from a modal
return false;
});
				$('#headerSearchFrmSubmit').removeAttr('disabled');
				var authState = myControl.sharedCheckoutUtilities.determineAuthentication();
				
				if(authState && (authState == 'authenticated' || authState == 'thirdPartyGuest'))	{
					myControl.util.dump("App thinks user is authenticated: "+authState);
					myControl.ext.proximus.util.userIsLoggedIn();
					}
				myControl.ext.proximus.util.bindNav();  //only add this once or click events will get duplicated each time it's run.
				myControl.ext.proximus.util.handleLeftColumnDisplay('shopByCats'); //initial display of left column (will base on aspect ratio)
				$(window).bind("resize", myControl.ext.proximus.util.handleLeftColumnDisplay); //handles display properties of left column on aspect ratio change.

				$('#cartBtn').removeAttr('disabled');
				},
			onError : function(d)	{
				$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},



/*
Currently, this is executed on a ping.  a utility handles generating all the requests
for each xsell pid, then this call back handles the display of all lists.

for the lists, only execute build if there are product in attibute. more efficient this way.
a show is added to the parent container in case the element is hidden by default.
the element is emptied and removed if no product are specified, to drop any titles or placeholder content.

*/

		displayXsell : 	{
			onSuccess : function(tagObj)	{
				var data = myControl.data[tagObj.datapointer]; //shorter reference.
				if(data['%attribs']['zoovy:grp_children'])	{
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productChildrenTemplate","parentID":"prodlistChildren","csv":data['%attribs']['zoovy:grp_children']});
					}

				if(data['%attribs']['zoovy:related_products'])	{
					$('#prodlistRelatedContainer').show().width($('#product-modal').width()-60); //Carousel wanted a fixed width container
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","parentID":"prodlistRelated","csv":data['%attribs']['zoovy:related_products']});
					$('#prodlistRelated').jcarousel();
					}
				else	{
					$('#prodlistRelatedContainer').empty().remove();
					}
				

				if(data['%attribs']['zoovy:accessory_products'])	{
					$('#prodlistAccessoriesContainer').show();
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","parentID":"prodlistAccessories","csv":data['%attribs']['zoovy:accessory_products']});
					}
				else	{
					$('#prodlistAccessoriesContainer').empty().remove();
					}
				
				myControl.ext.store_product.util.showReviewSummary({"pid":data.pid,"templateID":"prodReviewSummaryTemplate","parentID":"prodViewerReviewSummary"});
				myControl.ext.store_product.util.showReviews({"pid":data.pid,"templateID":"prodReviewsTemplate","parentID":"prodViewerReviews"});			
				myControl.model.dispatchThis();
				},
			onError : function(d)	{
				$('#globalMessaging').prepend(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},
			
			
		showProd : 	{
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN proximis.callbacks.showProd");
//				myControl.util.dump(tagObj);
				myControl.renderFunctions.translateTemplate(myControl.data[tagObj.datapointer],tagObj.parentID);

				$( "#tabbedProductContent" ).tabs();
//the mutable q is used here because a callback is needed to execute the display on these prodlists.
				myControl.ext.store_product.util.getXsellForPID(myControl.data[tagObj.datapointer].pid,'mutable');
				myControl.calls.ping.init({"callback":"displayXsell","extension":"proximus","datapointer":tagObj.datapointer});
				myControl.model.dispatchThis();


				},
			onError : function(d)	{
				$('#'+d.tagObj.parentID).prepend(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},
		haveProfileData : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN proximus.callbacks.haveProfileData.onSuccess");
				$('#helpBtn').removeAttr('disabled');
				$('#toolsBtn').removeAttr('disabled');
				$('#logo').empty().append(myControl.util.makeImage({'tag':1,'w':200,'h':78,'m':0,'name':myControl.data[tagObj.datapointer]['zoovy:company_logo'],'b':'tttttt'})).click(function(){
					myControl.ext.proximus.util.showPage('.')
					myControl.ext.proximus.util.changeNavTo('shopByCats');
					});
				},
			onError : function(d)	{
//throw some messaging at the user.  since the categories should have appeared in the left col, that's where we'll add the messaging.
				$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //haveProfileData

//used on an add to cart post to update the qty in the cart button.
		cartQuantityChanged : {
			onSuccess : function(tagObj)	{
				myControl.util.dump("BEGIN proximus.callbacks.cartQuantityChanged.onSuccess");
				var itemCount = myControl.util.isSet(myControl.data[tagObj.datapointer].cart['data.item_count']) ? 0 : myControl.data[tagObj.datapointer].cart['data.item_count']
				$('#cartBtn').removeAttr('disabled').text("Cart ("+itemCount+")");
				},
			onError : function(d)	{
//throw some messaging at the user.  since the categories should have appeared in the left col, that's where we'll add the messaging.
				$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //cartQuantityChanged

//executed when the cart is changed, such as a zip entered or a country selected.
		cartUpdated :	{
			onSuccess : function(tagObj)	{
				myControl.util.dump("BEGIN proximus.callbacks.cartUpdated.onSuccess");
				myControl.ext.store_cart.util.showCartInModal(); 
				},
			onError : function(d)	{
//throw some messaging at the user.  since the categories should have appeared in the left col, that's where we'll add the messaging.
				$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},


		showRootCategories : {
			onSuccess : function()	{
//				myControl.util.dump('BEGIN myControl.ext.proximus.callbacks.showCategories.onSuccess');

				$('#shopByCatsBtn').removeAttr('disabled').click(function(){
					myControl.ext.proximus.util.handleBrowseCatButton();
					});

				myControl.ext.store_navcats.util.getChildDataOf('.',{'parentID':'categoryTree','callback':'addCatToDom','templateID':'categoryTemplate','extension':'store_navcats'},'categoryDetailMore');  //generate left nav.
				myControl.ext.proximus.util.showPage('.'); //put homepage content into body.
				myControl.model.dispatchThis();
				$('#categoryTree_').hide(); //don't show the homepage on the left.
				},
			onError : function(d)	{
//throw some messaging at the user.  since the categories should have appeared in the left col, that's where we'll add the messaging.
				$('#leftCol').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //showRootCategories
			
		showPageContent : {
			onSuccess : function(tagObj)	{
				var catSafeID = tagObj.datapointer.split('|')[1];
				myControl.renderFunctions.translateTemplate(myControl.data['categoryDetail|'+catSafeID],'page-'+catSafeID);
				
				if(typeof myControl.data['categoryDetail|'+catSafeID]['@subcategoryDetail'] == 'object')	{
					myControl.ext.store_navcats.util.getChildDataOf(catSafeID,{'parentID':'subcategoryListContainer','callback':'addCatToDom','templateID':'categoryThumbTemplate','extension':'store_navcats'},'categoryDetailMax');
					}
				else	{
//no subcategories are present. do something else or perhaps to nothing at all.
					}
				myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","parentID":"productListContainer","items_per_page":20,"csv":myControl.data[tagObj.datapointer]['@products']});
				myControl.model.dispatchThis();
				//don't show the breadcrumb on the homepage.				
				if(catSafeID != '.'){myControl.ext.proximus.util.breadcrumb(catSafeID)}

/*	
$("#productListContainer li").hover(
	function () {
		$(this).append($("<span class='plIconList'>I C O N S</span>"));
	}, 
	function () {
//$(this).find("span:last").remove();
//remove all instances of plIconList. will include instances open in any additional lists that are present.
		$(this).find(".plIconList").remove();
	}
);
*/				$('#mainContentArea').removeClass('loadingBG');
				},
			onError : function(d)	{
				$('#mainContentArea').removeClass('loadingBG').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //showPageContent

//this used anymore???
		showList : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.proximus.showList.onSuccess ');
				var listID = tagObj.datapointer.split('|')[1];
				var prods = myControl.ext.store_crm.util.getSkusFromList(listID);
				if(prods.length < 1)	{
//list is empty.
					myControl.util.formatMessage('This list ('+listID+') appears to be empty.');
					}
				else	{
					myControl.util.dump(prods);
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","parentID":tagObj.parentID,"csv":prods})
					myControl.model.dispatchThis();
					}
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.store_crm.callbacks.init.onError');
				$('#'+d['_rtag'].parentID).prepend(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //showList


		authenticateThirdParty : {
			onSuccess : function(tagObj)	{
				myControl.ext.proximus.util.userIsLoggedIn();
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.callbacks.authenticateThirdParty.onError');
				$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
_gaq.push(['_trackEvent','Authentication','User Event','Authentication for third party failed']);
				}
			}, //authenticateThirdParty



		authenticateZoovyUser : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN proximus.callbacks.authenticateZoovyUser.onSuccess');
//successful login.	
				myControl.vars.cid = myControl.data[tagObj.datapointer].cid; //save to a quickly referencable location.
				$('#loginSuccessContainer').show();
				$('#loginFormForModal').prepend("Thank you, you are now logged in.");
				$('#modalLoginForm').hide();
				

				myControl.ext.proximus.util.userIsLoggedIn();
_gaq.push(['_trackEvent','Authentication','User Event','Logged in through Store']);
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.authenticateZoovyUser.onError');
				$("#loginMessaging").show().append(myControl.util.formatMessage("It appears that username/password is invalid. Please try again or continue as a guest."));
_gaq.push(['_trackEvent','Authentication','User Event','Log in as Zoovy user attempt failed']);
				}	
			}, //authenticateZoovyUser

		updateSearchNav : {
			
			onSuccess : function(tagObj)	{
//				myControl.util.dump('BEGIN proximus.callbacks.updateSearchNav.onSuccess');

				var keyword = tagObj.datapointer.split("|")[1];
				myControl.util.dump(" -> update search nav for = "+keyword);
				var o = "<li><a href='#' onClick=\"$('#headerKeywordsInput').val('"+keyword+"'); $('#headerSearchFrm').submit();\">"+keyword+" ("+myControl.data[tagObj.datapointer]['@products'].length+")<\/a><\/li>"
				myControl.util.dump(o);
				$('#altSearchesList').removeClass('loadingBG').append(o);
				},

			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.proximus.callbacks.showResults.onError');
				$('#altSearchesList').removeClass('loadingBG')
				$('#searchNav').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			
			}, //updateSearchNav


		showResults :  {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.proximus.callbacks.showResults.onSuccess');
				myControl.ext.proximus.util.changeNavTo('search');
				var keywords = tagObj.datapointer.split('|')[1];
//recent searches should not contain duplicates.
				if($.inArray(keywords,myControl.ext.proximus.vars.user.recentSearches) < 0)
					myControl.ext.proximus.vars.user.recentSearches.push(keywords);
				$('#altSearchesList').empty(); //clear existing 'alternative searches'
//				myControl.util.dump(' -> altSearchList emptied.');
				if(myControl.data[tagObj.datapointer]['@products'].length == 0)	{
					$('#mainContentArea').empty().append("Zero items matched your search.  Please try again.");
					}
				else	{
					
//need a ul for the product list to live in.
					$('#mainContentArea').empty().append("<ul id='productListContainer' class='prodlist' \/>");
//will handle building a template for each pid and tranlating it once the data is available.
//returns # of requests needed. so if 0 is returned, no need to dispatch.
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","parentID":"productListContainer","emptyListMessage":"Zero items matched your search. Please try again.","items_per_page":20,"csv":myControl.data[tagObj.datapointer]['@products']})
					}

//whether the search had results or not, if more than 1 keyword was searched for, provide a breakdown for each permutation.
				var keywords = tagObj.datapointer.split('|')[1];
				if(keywords.split(' ').length > 1)	{
					$('#altSearchesContainer').show();
//					myControl.util.dump(" -> more than 1 keyword was searched for.");
					$('#altSearchesList').addClass('loadingBG');
					myControl.ext.store_search.util.getAlternativeQueries(keywords,{"callback":"updateSearchNav","extension":"proximus"});
					}
				else	{
					$('#altSearchesContainer').hide();
					}
				myControl.ext.proximus.util.showRecentSearches();
				myControl.model.dispatchThis(); // will dispatch requests for product and/or requests for alternative queries.
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.proximus.callbacks.showResults.onError');
				$('#mainContentArea').removeClass('loadingBG').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}
		}, //callbacks




////////////////////////////////////   WIKILINKFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

/*
the wiki translator has defaults for the links built in. however, these will most likely
need to be customized on a per-ria basis.
*/
		wiki : {
			":search" : function(suffix,phrase){
				return "<a href='#' onClick=\"$('#headerKeywordsInput').val('"+suffix+"'); $('#headerSearchFrm').submit(); \">"+phrase+"<\/a>"
				},
			":category" : function(suffix,phrase){
				return "<a href='#' onClick='myControl.ext.proximus.util.showPage(\""+suffix+"\")'>"+phrase+"<\/a>"
				},
			":product" : function(suffix,phrase){
				return "<a href='#' onClick='myControl.ext.proximus.util.showProd(\""+suffix+"\")'>"+phrase+"<\/a>"
				},
			":customer" : function(suffix,phrase){
// ### this needs to get smarter. look at what the suffix is and handle cases. (for orders, link to orders, newsletter link to newsletter, etc)				
				return "<a href='#' onClick='myControl.ext.proximus.util.changeNavTo(\"tools\")'>"+phrase+"<\/a>"
				}
			},




////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		renderFormats : {
			
//assumes that you have already gotten a 'max' detail for the safecat specified data.value.
			subcatList : function($tag,data)	{
//				myControl.util.dump("BEGIN store_navcats.renderFormats.subcatList");
				var catSafeID; //used in the loop for a short reference.
				var o = '';
				if(!$.isEmptyObject(myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail']))	{
					var L = myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'].length;
					var size = L > 3 ? 3 : L; //don't show more than three.
//!!! hhhmm.. needs fixin. need to compensate 'i' for hidden categories.
					for(var i = 0; i < size; i +=1)	{
						if(myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i].pretty[0] != '!')	{
							catSafeID = myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i].id;
							o += "<li onClick=\"myControl.ext.proximus.util.showPage('"+catSafeID+"');\"> &#187; "+myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i].pretty;
							if(myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i]['@products'].length > 0)
								o += " ("+myControl.data['categoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i]['@products'].length+" items)"
							o += "<\/li>";
							}
						}
					if(L > 3)	{
						o += "<li onClick=\"myControl.ext.proximus.util.showPage('"+data.bindData.cleanValue+"');\">&#187; <b> View all "+L+" Categories<\/b><\/li>";
						}
					$tag.append(o);
					}		
				} //subcatList
			},


////////////////////////////////////   UTIL    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		util : {
			
//rather than having all the params in the dom, just call this function. makes updating easier too.
			showProd : function(pid)	{
				myControl.ext.store_product.util.prodDataInModal({'pid':pid,'templateID':'prodViewerTemplate','callback':'showProd','extension':'proximus'});
				},

//figures which nav tree is visible and returns the id.
			whichNavIsVisible : function()	{
				var r = ''; //this is what's returned.

				$('#leftCol nav').each(function(){
					if($(this).is(':visible'))	{
						r = $(this).attr('id');
						r = r.slice(0,r.length-3);//trims 'Nav' off the end.
						}
					});
				return r;
				},

			changeNavTo : function(newNav)	{
//				myControl.util.dump("BEGIN proximus.util.changeNavTo ("+newNav+")");

				$('#leftCol nav .ui-state-active').removeClass('ui-state-active'); //reset active nav item

				$('#leftCol nav').each(function(){
					$(this).hide(); //make sure all left navs are hidden.
					});

//				myControl.util.dump(" oldNav = "+oldNav);
//unhide nav, even if left col is hidden. that way if aspect ratio changes, the correct nav will be visible.
				$('#'+newNav+'Nav').show();
				
				this.handleLeftColumnDisplay(newNav);
				
				if(newNav == 'shopByCats')	{
					
					}
				else if(newNav == 'search')	{
					}
				else if(newNav == 'checkout')	{
					$('#mainContentArea').empty(); //duh.
					$(".ui-dialog-content").dialog("close"); //close all modal windows.
					myControl.ext.convertSessionToOrder.calls.startCheckout.init('mainContentArea');
					}
				else	{
//add appropriate content.  at this point, nav should either = tools or help. 
					
					$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('mainContentArea_'+newNav,newNav+'Template',myControl.data['getProfile|'+myControl.vars.profile]))
					
//					$('#mainContentArea').empty().append(myControl.renderFunctions.createTemplateInstance(newNav+'Template','mainContentArea'));
//					myControl.renderFunctions.translateTemplate(myControl.data['getProfile|'+myControl.vars.profile],'mainContentArea');
					
					
					
//the first item in the list is the one that will be in focus by default. change state to indicate it.
					$('#'+newNav+'Nav ul li a').first().addClass('ui-state-active').click();
					}
				

				},

/*
Left column behavior:

when nav is not search, the left column is always on.
when in 'shop', the default behavior is:
 -> hide left column in portrait mode.
 -> show left column in landscape mode.

once the 'browse by category' button is pushed, the default behvior goes away.
the left column will either stay open or closed based on what the user told it to do.
'data-showleft' will be set to 1 once the button has been turned on and set to 0 once turned off.
it will NOT be set until there's an interaction with that button.

executed on browser resize. keep this as light as possible.
*/


			handleLeftColumnDisplay : function(nav)	{
//				myControl.util.dump("BEGIN handleLeftColumnDisplay");
				if(typeof nav == 'object'){nav = '';} //on browser resize, an object is passed in. we want to ignore this.
				nav = nav ? nav : myControl.ext.proximus.util.whichNavIsVisible();
				var leftColIsForced = $('#shopByCatsBtn').attr('data-leftColIsForced');
				var showLeft = false;
//				myControl.util.dump(" -> nav = "+nav);
//				myControl.util.dump(" -> leftColIsForced = "+leftColIsForced);
				if(!nav){
//if nav isn't set, then no nav is currently visible and none was passed in. likely a browser aspect ratio change occured.
//nav would be set IF a non-shopping nav was selected, so assume shopByCat is in focus.
					nav = 'shopByCats';
//					myControl.util.dump(" -> no nav set. change nav to shopByCats and treat accordingly");
					}
				if(nav == 'checkout')	{showLeft = false} //always hide left column during checkout
				else if(nav != 'shopByCats') {showLeft = true;  myControl.util.dump('always show left column for search, tools, etc')}
				else if(nav == 'shopByCats' && leftColIsForced == 'on')	{showLeft = true; }
				else if(nav == 'shopByCats' && leftColIsForced == 'off')	{showLeft = false;}
				else if(nav == 'shopByCats' && !leftColIsForced){
//handles display of left column on shopping pages based on browser aspect ratio.
//					myControl.util.dump(" -> determine showLeft based on H by W ("+$(window).height()+" X "+$(window).width()+")");
					if($(window).height() < $(window).width())	{showLeft = true;}
					else {showLeft = false; }
					}
//				myControl.util.dump(" -> Show Left = "+showLeft);
				if(showLeft == true)	{
					$('#columnContainer').addClass('showLeft').removeClass('hideLeft');
					}
				else	{
					$('#columnContainer').removeClass('showLeft').addClass('hideLeft');
					}
				},

/*
executed when the browse by category button is pushed.
if the user was in the shopping section and pushed the button, the left
column behavior is toggled on/off. the leftColIsForced attribute is also
toggle on or off.

if the user was NOT in a shopping category and pushed that button, the
shop categories ARE displayed, but the leftColIsForced is NOT toggled.

*/

			handleBrowseCatButton : function()	{
//				var oldNav = myControl.ext.proximus.util.whichNavIsVisible();
				var $button = $('#shopByCatsBtn');
				var leftColIsForced = $button.attr('data-leftColIsForced');
				
//				if(oldNav == 'shopByCat')	{
					myControl.util.dump(" -> in shopping and button was pushed. toggle behavior.");
					if(leftColIsForced == 'on')	{
						$button.attr('data-leftColIsForced','off');
						}
					else if(leftColIsForced == 'off')	{
						$button.attr('data-leftColIsForced','on');
						}
					else	{
//the browse button handn't been pushed before. determine if the column is currently visible or not, the set var accordingly.
//the change nav will handle turning the display on or off, based on leftCol attr.
						if($('#columnContainer').hasClass('showLeft')){
							myControl.util.dump(" -> leftColIsForced was undef and showLeft was ON, so hide column.");
							$button.attr('data-leftColIsForced','off');
							}
						else	{
							$button.attr('data-leftColIsForced','on');
							}
						}
//					}
				myControl.ext.proximus.util.changeNavTo('shopByCats');
				},

			bindNav : function()	{
				
$('#leftCol nav a').each(function(){
	var $this = $(this);
	$this.addClass('ui-state-default').click(function(event){
		$('#leftCol nav a').removeClass('ui-state-active');
		$this.addClass('ui-state-active');
		event.preventDefault(); //cancels any action on the href. keeps anchor from jumping.
		myControl.ext.proximus.util.showArticle($this.attr('href').substring(1)); //substring is to strip the # off the front
		});
	});
				},



			showLoginModal : function()	{
				$('#loginFormForModal').dialog({modal: true,width:400});
				},

//executed from a 'nav' link. for instance, help > return policy would pass 'returns' and show the return policy.
//articles must exist on the dom. since they're appended to mainContentArea in most cases, they're also removed frequently.
//make sure they're available.
			showArticle : function(subject)	{
				myControl.util.dump("BEGIN proximus.util.showArticle ("+subject+")");
				$('#mainContentArea article').hide();
				$('#'+subject+'Article').show();
				$('#globalMessaging').empty();

				var authState = myControl.sharedCheckoutUtilities.determineAuthentication();
				myControl.util.dump(" -> authState = "+authState);
//don't show any pages that require login unless the user is logged in.
				if((authState != 'authenticated') && (subject == 'orders' || subject == 'wishlist' || subject == 'forgetme' || subject == 'myaccount'))	{
//in addition to showing the modal window, the article the user was trying to see is added to the 'continue' button that appears after a successful login
//this will be fluid, as it'll take them where they expected to go.
					myControl.ext.proximus.util.showLoginModal();
					$('#loginSuccessContainer').empty();
					$('<button>').addClass('stdMargin ui-state-default ui-corner-all  ui-state-active').attr('id','modalLoginContinueButton').text('Continue').click(function(){
						$('#loginFormForModal').dialog('close');
						myControl.ext.proximus.util.showArticle(subject)
						}).appendTo($('#loginSuccessContainer'));					

					}
				else	{
					switch(subject)	{
						case 'newsletter':
							$('#newsletterFormContainer').empty();
							myControl.ext.store_crm.util.showSubscribe({'parentID':'newsletterFormContainer','templateID':'subscribeFormTemplate'});
							break;
						case 'orders':
								myControl.ext.store_crm.calls.getCustomerOrderList.init({'parentID':'orderHistoryContainer','templateID':'orderLineItemTemplate','callback':'showOrderHistory','extension':'store_crm'});
							break;
						case 'wishlist':
							myControl.ext.store_crm.calls.getCustomerList.init('wishlist',{'parentID':'wishlistContainer','callback':'showList','extension':'proximus'});
						case 'forgetme':
							myControl.ext.store_crm.calls.getCustomerList.init('forgetme',{'parentID':'forgetmeContainer','callback':'showList','extension':'proximus'}); 
						default:
							//the default action is handled in the 'show' above. it happens for all.
						}
					}
				myControl.model.dispatchThis();
				},

			showRecentSearches : function()	{
				var o = ''; //output. what's added to the recentSearchesList ul
				var L = myControl.ext.proximus.vars.user.recentSearches.length;
				var keywords,count;
				for(i = 0; i < L; i++)	{
					keywords = myControl.ext.proximus.vars.user.recentSearches[i];
//					myControl.util.dump(" -> myControl.data['searchResult|"+keywords+"'] and typeof = "+typeof myControl.data['searchResult|'+keywords]);
					count = $.isEmptyObject(myControl.data['searchResult|'+keywords]) ? 0 : myControl.data['searchResult|'+keywords]['@products'].length
//					myControl.util.dump(" -> adding "+keywords+" to list of recent searches");
// 
					o += "<li><a href='#' onClick=\"$('#headerKeywordsInput').val('"+keywords+"'); $('#headerSearchFrm').submit();\">"+keywords+" ("+count+")<\/a><\/li>";
					}
				$('#recentSearchesList').html(o);
				},

			breadcrumb : function(catSafeID)	{
				myControl.util.dump("BREADCRUMB cat safe id = "+catSafeID);
				if(catSafeID == '.')	{
//do nothing on the homepage.
					}
				else	{
					var pathArray = catSafeID.split('.');
					var $bc = $('#breadcrumb'); //no need to empty because the 'page' gets reset each load .
					var len = pathArray.length - 1; // don't show the breadcrumb for the page in focus. we'll use an H1 for that.
//s is used to concatonate the safe id.  so if safeid = my.safe.id.is.here, then when i=1 s = my, when i=2, pass = my.safe and so forth.
//when split occurs on catSafeId, the zero spot in the array is blank.  so s is set to . and in the zero pass in the loop, it'll load the homepage.
					var s = '.'; 
					for (var i=0; i<len; i+=1) {
						s += pathArray[i];
						myControl.util.dump(s);
						$bc.append(myControl.renderFunctions.transmogrify({"id":"breadcrumb_"+s,"catsafeid":s},'categoryTemplate',myControl.data['categoryDetail|'+s]))
//after each loop, the . is added so when the next cat id is appended, they're concatonated with a . between. won't matter on the last loop cuz we're done.
						s += i == 0 ? "" : ".";
						}
					}
				},
				
			showPage : function(catSafeID)	{
//				$('#globalMessaging').empty().hide();  //showPage is executed on app init. if globalmessaging is emptied, init messaging doesn't show up. ggrrr. move app messaging to use the prepend and hide .zMessage feature.
				$(".ui-dialog-content").dialog("close");  //close any open dialogs. important cuz a 'showpage' could get executed via wiki in a modal window.
//				$('#mainContentArea').empty().append(myControl.renderFunctions.createTemplateInstance('categoryPageTemplate','page-'+catSafeID));
				$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('page-'+catSafeID,'categoryPageTemplate',{}))
				
				if(myControl.ext.store_navcats.calls.categoryDetailMax.init(catSafeID,{"callback":"showPageContent","extension":"proximus"}))	{
					myControl.model.dispatchThis();
					}
				},

			showOrderDetails : function(orderID)	{
//				myControl.util.dump("BEGIN proximus.util.showOrderDetails");
				var safeID = myControl.util.makeSafeHTMLId(orderID);
				$orderEle = $('#orderContents_'+safeID);
//if the element is empty, then this is the first time it's been clicked. Go get the data and display it, changing classes as needed.
				if($orderEle.is(':empty'))	{
					$orderEle.show().addClass('ui-corner-bottom ui-accordion-content-active'); //object that will contain order detail contents.
					$orderEle.append(myControl.renderFunctions.createTemplateInstance('orderContentsTemplate','orderContentsTable_'+safeID))
					$('#orderContentsTable_'+safeID).addClass('loadingBG');
					if(myControl.ext.store_crm.calls.getCustomerOrderDetail.init(orderID,{'callback':'showOrder','extension':'store_crm','templateID':'orderContentsTemplate','parentID':'orderContentsTable_'+safeID}))
						myControl.model.dispatchThis();
						
					$orderEle.siblings().addClass('ui-state-active').removeClass('ui-corner-bottom').find('.ui-icon-triangle-1-e').removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s');
					}
				else	{
//will only get here if the data is already loaded. show/hide panel and adjust classes.
//myControl.util.dump("$orderEle.is(':visible') = "+$orderEle.is(':visible'));
if($orderEle.is(':visible'))	{
	$orderEle.removeClass('ui-corner-bottom ui-accordion-content-active').hide();
	$orderEle.siblings().removeClass('ui-state-active').addClass('ui-corner-bottom').find('.ui-icon-triangle-1-s').removeClass('ui-icon-triangle-1-s').addClass('ui-icon-triangle-1-e')
	}
else	{
	$orderEle.addClass('ui-corner-bottom ui-accordion-content-active').show();
	$orderEle.siblings().addClass('ui-state-active').removeClass('ui-corner-bottom').find('.ui-icon-triangle-1-e').removeClass('ui-icon-triangle-1-e').addClass('ui-icon-triangle-1-s')
	}
					}
				

				},
	
			removeByValue : function(arr, val) {
				for(var i=0; i<arr.length; i++) {
					if(arr[i] == val) {
						arr.splice(i, 1);
						break;
						}
					}
				},

			showCart : function()	{
//				myControl.util.dump("BEGIN proximus.util.showCart");
				myControl.ext.store_cart.util.showCartInModal('cartViewer');
				if(myControl.ext.store_cart.vars.cartAccessories.length > 0)	{
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","parentID":"cartAccessoriesCarousel","csv":myControl.ext.store_cart.vars.cartAccessories});
					myControl.model.dispatchThis();
					$('#cartAccessoriesCarouselContainer').show(); //container is hidden by default.
					$('#cartAccessoriesCarousel').jcarousel();
					}
				},

			handleAddToList : function(pid,listID)	{

myControl.util.dump("BEGIN proximus.util.handleAddToList ("+pid+")");
var authState = myControl.sharedCheckoutUtilities.determineAuthentication();
if(authState == 'authenticated')	{
	myControl.ext.store_crm.calls.addToCustomerList.init({"listid":listID,"sku":pid},{"parentID":"CRMButtonMenu","message":"Item has been added to your list","callback":"showMessaging"}); 
	myControl.model.dispatchThis();
	}
else	{
	myControl.ext.proximus.util.showLoginModal();
	$('#loginMessaging').append("This feature requires you to be logged in.");
	$('#loginSuccessContainer').empty();
	$('<button>').addClass('stdMargin ui-state-default ui-corner-all  ui-state-active').attr('id','modalLoginContinueButton').text('Continue').click(function(){
		$('#loginFormForModal').dialog('close');
		myControl.ext.proximus.util.handleAddToList(pid,listID);
		}).appendTo($('#loginSuccessContainer'));
	}


				}, //handleAddToList
//executed in checkout when 'next/submit' button is pushed for 'existing account' after adding an email/password. (preflight panel)
//handles inline validation
			loginFrmSubmit : function(email,password)	{
				var errors = '';
				var $errorDiv = $("#loginMessaging").empty().toggle(false); //make sure error screen is hidden and empty.
				
				if(myControl.util.isValidEmail(email) == false){
					errors += "Please provide a valid email address<br \/>";
					}
				if(!password)	{
					errors += "Please provide your password<br \/>";
					}
					
				if(errors == ''){
					myControl.calls.authentication.zoovy.init({"login":email,"password":password},{'callback':'authenticateZoovyUser','extension':'proximus'});
					myControl.ext.store_cart.calls.getCartContents.init('','immutable'); //cart needs to be updated as part of authentication process.
					myControl.ext.store_crm.calls.getCustomerList.init('forgetme',{'callback':'handleForgetmeList','extension':'store_prodlist'},'immutable');
					myControl.model.dispatchThis('immutable');
					}
				else {
					$errorDiv.toggle(true).append(myControl.util.formatMessage(errors));
					}
				}, //loginFrmSubmit

			userIsLoggedIn : function()	{
//classes are used to hide or enable features based on whether or not the user is logged in.
//this will only impact elements currently rendered to the screen.
// SANITY - this update will only effect classes that are 'on screen' when it is executed.
				$('.disableIfLoggedOut').removeAttr('disabled');
				$('.showIfLoggedIn').show();
				$('.hideIfLoggedIn').hide();
				} //userIsLoggedIn
			
			} //util


		
		} //r object.
	return r;
	}