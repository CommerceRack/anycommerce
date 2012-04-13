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
		"templates" : ['productTemplate','mpControlSpec','categoryTemplate','categoryPageTemplate','prodViewerTemplate','cartViewer','cartViewerProductTemplate','prodReviewSummaryTemplate','productChildrenTemplate','prodReviewsTemplate','reviewFrmTemplate','subscribeFormTemplate','categoryThumbTemplate','orderLineItemTemplate','orderContentsTemplate','cartSummaryTemplate','orderProductLineItemTemplate','helpTemplate','customerTemplate','homepageTemplate','searchTemplate','prodHPFeaturedTemplate','faqTopicTemplate','faqQnATemplate','catPageHeaderTemplate','catPageFooterTemplate','prodHPBestTemplate','billAddressTemplate','shipAddressTemplate'],
		"user" : {
			"recentSearches" : [],
			"recentlyViewedItems" : []
			},
		"dependAttempts" : 0,  //used to count how many times loading the dependencies has been attempted.
		"dependencies" : ['store_prodlist','store_navcats','store_product','store_search','store_cart','store_crm','convertSessionToOrder'] //a list of other extensions (just the namespace) that are required for this one to load
		},


					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



	calls : {
//move this to crm. here for now cuz B has DEV F'd up.
//make sure to add a fetchData too.
		buyerAddressList : {
			init : function(tagObj,Q)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj["datapointer"] = "buyerAddressList"; 
				this.dispatch(tagObj,Q);
				return 1;
				},
			dispatch : function(tagObj,Q)	{
				myControl.model.addDispatchToQ({"_cmd":"buyerAddressList","_tag": tagObj},Q);
				}
			}, //buyerAddressList	
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
				myControl.util.dump('BEGIN myControl.ext.myRIA.callbacks.init.onError');
				}
			},

		startMyProgram : {
			onSuccess : function()	{
//attach an event to the window that will execute code on 'back' some history has been added to the history.
				window.onpopstate = function(event) { 
					myControl.ext.myRIA.util.handlePopState(event.state);
					}; 


				myControl.ext.store_navcats.calls.appCategoryList.init();
				
				var page = myControl.ext.myRIA.util.handleLegacyURL(); //checks url and will load appropriate page content.
				
//get some info to have handy for when needed (cart, profile, etc)
				myControl.calls.appProfileInfo.init(myControl.vars.profile,{});


				if(page.pageType == 'cart' || page.pageType == 'checkout')	{
//if the page type is determined to be the cart or checkout onload, no need to request this. They'll be requested elsewhere with appropriate callbacks.
					}
				else	{
					myControl.calls.refreshCart.init({'callback':'updateMCLineItems','extension':'myRIA'},'mutable');
					myControl.ext.store_cart.calls.cartShippingMethods.init({},'mutable');
					}
	

				myControl.model.dispatchThis();

//get some info to have handy.
				myControl.ext.store_navcats.calls.appPageGet.init({'PATH':'.100__satisfaction_guarantee','@get':['description']},'passive');  
				myControl.ext.store_navcats.calls.appCategoryDetail.init('$best_sellers',{},'passive');
				myControl.model.dispatchThis('passive');

//if a catalog is specified, bind a keyword autocomplete to the search form.
				if($('#headerCatalog').val() != '')	{
					myControl.ext.store_search.util.bindKeywordAutoComplete('headerSearchFrm');
					}

//adds submit functionality to search form. keeps dom clean to do it here.
				$('#headerSearchFrm').submit(function(){
					myControl.ext.myRIA.util.changeNavTo('search');
					myControl.ext.store_search.calls.searchResult.init($(this).serializeJSON(),{'callback':'showResults','extension':'myRIA'});
					// DO NOT empty altSearchesLis here. wreaks havoc.
					myControl.model.dispatchThis();
					return false;
					});
					
				$('#headerSearchFrmSubmit').removeAttr('disabled');

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
				myControl.util.dump("BEGIN myRIA.callbacks.displayXsell.onSuccess");
				var data = myControl.data[tagObj.datapointer]; //shorter reference.
				if(data['%attribs']['zoovy:grp_children'])	{
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productChildrenTemplate","withInventory":1,"withVariations":1,"parentID":"prodlistChildren","csv":data['%attribs']['zoovy:grp_children']});
					}

				if(data['%attribs']['zoovy:related_products'])	{
					$('#prodlistRelatedContainer').show();
					var numRequests = myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","withInventory":1,"withVariations":1,"parentID":"prodlistRelated","items_per_page":100,"csv":data['%attribs']['zoovy:related_products']});
					}
				else	{
					$('#prodlistRelatedContainer').empty().remove();
					}
				

				if(data['%attribs']['zoovy:accessory_products'])	{
					$('#prodlistAccessoriesContainer').show();
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","withInventory":1,"withVariations":1,"parentID":"prodlistAccessories","csv":data['%attribs']['zoovy:accessory_products']});
					}
				else	{
					$('#prodlistAccessoriesContainer').empty().remove(); //not strictly necessary if accessories are in a tab, but won't hurt.
					}
				
				myControl.ext.store_product.util.showReviewSummary({"pid":data.pid,"templateID":"prodReviewSummaryTemplate","parentID":"prodViewerReviewSummary"});
				myControl.ext.store_product.util.showReviews({"pid":data.pid,"templateID":"prodReviewsTemplate","parentID":"prodViewerReviews"});			
				myControl.model.dispatchThis();
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},


		itemAddedToCart :	{
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.store_product.callbacks.itemAddedToCart.onSuccess');
				$('.atcButton').removeAttr('disabled').removeClass('disabled'); //makes all atc buttons clickable again.
				var htmlid = 'atcMessaging_'+myControl.data[tagObj.datapointer].product1;
				$('#atcMessaging_'+myControl.data[tagObj.datapointer].product1).append(myControl.util.formatMessage({'message':'Item Added','htmlid':htmlid,'uiIcon':'check','timeoutFunction':"$('#"+htmlid+"').slideUp(1000);"}));
				},
			onError : function(responseData,uuid)	{
				myControl.util.dump('BEGIN myControl.ext.store_product.callbacks.init.onError');
				$('.atcButton').removeAttr('disabled'); //remove the disabling so users can push the button again, if need be.
				$('#atcMessaging_'+myControl.data[responseData['_rtag'].datapointer].product1).append(myControl.util.getResponseErrors(responseData))
				}
			}, //itemAddedToCart



//update any element with a .itemCount class with current # of items in the mincart.
		updateMCLineItems : 	{
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN myRIA.callbacks.updateMCLineItems");
				var itemCount = myControl.util.isSet(myControl.data[tagObj.datapointer].cart['data.item_count']) ? myControl.data[tagObj.datapointer].cart['data.item_count'] : myControl.data[tagObj.datapointer].cart['data.add_item_count']
//				myControl.util.dump(" -> itemCount: "+itemCount);
				$('.itemCount').text(itemCount);
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},

		showProd : 	{
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN proximis.callbacks.showProd");
//				myControl.util.dump(tagObj);
				myControl.renderFunctions.translateTemplate(myControl.data[tagObj.datapointer],tagObj.parentID);
				var pid = myControl.data[tagObj.datapointer].pid;
				$( "#tabbedProductContent" ).tabs();
//the mutable q is used here because a callback is needed to execute the display on these prodlists.
				var numRequests = myControl.ext.store_product.util.getXsellForPID(pid,'mutable');
				myControl.util.dump(" -> numRequest for xsell product inf: "+numRequests);
				var pingTagObj = {"callback":"displayXsell","extension":"myRIA","datapointer":tagObj.datapointer}
				if(numRequests > 0)	{
					myControl.calls.ping.init(pingTagObj);
					myControl.model.dispatchThis();
					}
				else	{
					myControl.util.handleCallback(pingTagObj)
					}
//				myControl.util.dump(" -> resetting addthis.toolbox");


//creates a page url using legacy format. used by addthis.
				var url = window.location.protocol+'//'+myControl.vars.sdomain+myControl.ext.myRIA.util.buildRelativePath({"pageType":"product","pageInfo":pid});

//updates the url used for the 'share' menu
				if(typeof addthis_share == 'object')	{addthis_share.url = url;} 
//regenerate the addthis toolbox using the focus page url.
				if(typeof addthis == 'object')	{
					$('#prodViewerAddThis').empty().html("<a class='addthis_button_facebook_like'></a><a class='addthis_button_tweet' tw:count='horizontal'></a><a class='addthis_button_google_plusone'></a><a class='addthis_button_compact'></a><a class='addthis_counter addthis_bubble_style'></a>");
					addthis.toolbox('#prodViewerAddThis','',{"url":url});
					}
				myControl.util.jumpToAnchor('top');
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},

		showAddresses : {
			onSuccess : function(tagObj)	{
				myControl.util.dump("BEGIN myRIA.callbacks.showAddresses.onSuccess");
//clean the workspace.
				var authState = myControl.sharedCheckoutUtilities.determineAuthentication();
				var $buyerAddresses = $('#buyerAddresses').empty(); //empty no matter what, so if user was logged in and isn't, addresses go away.

//only show addresses if user is logged in.
				if(authState == 'authenticated')	{
					var types = new Array('@ship','@bill');
					var L,type;
//yes, it's a loop inside a loop.  bad mojo, i know.
//but there's only two types of addresses and probably no more than 5 addresses in each type.
					for(var j = 0; j < 2; j += 1)	{
						type = types[j];
//						myControl.util.dump(" -> address type: "+type);
//						myControl.util.dump(myControl.data.buyerAddressList[type]);
						L = myControl.data.buyerAddressList[type].length;
//						myControl.util.dump(" -> # addresses: "+L);
						if(L)	{
							$buyerAddresses.append(type == '@bill' ? '<h2>billing address(es)</h2>' : '<h2>shipping address(es)</h2>');
							}
						for(var i = 0; i < L; i += 1)	{
							$buyerAddresses.append(myControl.renderFunctions.transmogrify({
								'id':'address_'+myControl.data.buyerAddressList[type][i]['_id'],
								'addressclass':type,
								'addressid':myControl.data.buyerAddressList[type][i]['_id']
								},type.substring(1)+'AddressTemplate',myControl.data.buyerAddressList[type][i]))
							}
						}
					}
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			}, //showAddresses

//executed when the cart is changed, such as a zip entered or a country selected.
		cartUpdated :	{
			onSuccess : function(tagObj)	{
				myControl.util.dump("BEGIN myRIA.callbacks.cartUpdated.onSuccess");
				myControl.ext.store_cart.util.showCartInModal(); 
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},

			
		showPageContent : {
			onSuccess : function(tagObj)	{
				var catSafeID = tagObj.datapointer.split('|')[1];
				myControl.renderFunctions.translateTemplate(myControl.data['appCategoryDetail|'+catSafeID],'page-'+catSafeID);

				if(typeof myControl.data['appCategoryDetail|'+catSafeID]['@subcategoryDetail'] == 'object')	{
					var subcatTemplateID = 'categoryThumbTemplate'; //default templateID used for displaying subcats.
					myControl.ext.store_navcats.util.getChildDataOf(catSafeID,{'parentID':'subcategoryListContainer','callback':'addCatToDom','templateID':subcatTemplateID,'extension':'store_navcats'},'appCategoryDetailMax');
					}
				else	{
//no subcategories are present. do something else or perhaps to nothing at all.
					}
				myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","withInventory":1,"withVariations":1,"parentID":"productListContainer","items_per_page":20,"csv":myControl.data[tagObj.datapointer]['@products']});
				myControl.model.dispatchThis();
				//don't show the breadcrumb on the homepage.				
				if(catSafeID != '.'){myControl.ext.myRIA.util.breadcrumb(catSafeID)}
				$('#mainContentArea').removeClass('loadingBG');
				myControl.util.jumpToAnchor('top');
				},
			onError : function(d)	{
				$('#mainContentArea').removeClass('loadingBG').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //showPageContent

//this is used for showing a customer list of product, such as wish or forget me lists
		showList : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.myRIA.showList.onSuccess ');
				var listID = tagObj.datapointer.split('|')[1];
				var prods = myControl.ext.store_crm.util.getSkusFromList(listID);
				if(prods.length < 1)	{
//list is empty.
					myControl.util.formatMessage('This list ('+listID+') appears to be empty.');
					}
				else	{
					myControl.util.dump(prods);
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","withInventory":1,"withVariations":1,"parentID":tagObj.parentID,"csv":prods})
					myControl.model.dispatchThis();
					}
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			}, //showList

//a call back to be used to show a specific list of product in a specific element.
//requires templateID and targetID to be passed on the tag object.
		showProdList : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN myRIA.callbacks.showProdList");
//				myControl.util.dump(myControl.data[tagObj.datapointer]);
				if(myControl.data[tagObj.datapointer]['@products'].length < 1)	{
					$('#'+tagObj.targetID).append(myControl.util.formatMessage('This list ('+listID+') appears to be empty.'));
					}
				else	{
					myControl.ext.store_prodlist.util.buildProductList({"templateID":tagObj.templateID,"parentID":tagObj.targetID,"csv":myControl.data[tagObj.datapointer]['@products']})
					myControl.model.dispatchThis();
					}
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			}, //showList

		authenticateThirdParty : {
			onSuccess : function(tagObj)	{
				
				},
			onError : function(responseData)	{
				myControl.util.dump('BEGIN myControl.callbacks.authenticateThirdParty.onError');
				$('#globalMessaging').append(myControl.util.getResponseErrors(responseData)).toggle(true);
//_gaq.push(['_trackEvent','Authentication','User Event','Authentication for third party failed']);
				}
			}, //authenticateThirdParty



		authenticateZoovyUser : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myRIA.callbacks.authenticateZoovyUser.onSuccess');
//successful login.	
				myControl.vars.cid = myControl.data[tagObj.datapointer].cid; //save to a quickly referencable location.
				$('#loginSuccessContainer').show(); //contains 'continue' button.
				$('#loginMessaging').empty().show().append("Thank you, you are now logged in."); //used for success and fail messaging.
				$('#loginFormContainer').hide(); //contains actual form.
				

				
//_gaq.push(['_trackEvent','Authentication','User Event','Logged in through Store']);
				},
			onError : function(responseData,uuid)	{
//				myControl.util.dump('BEGIN myControl.ext.convertSessionToOrder.callbacks.authenticateZoovyUser.onError');
				$("#loginMessaging").append(myControl.util.getResponseErrors(responseData)).toggle(true)
//_gaq.push(['_trackEvent','Authentication','User Event','Log in as Zoovy user attempt failed']);
				}	
			}, //authenticateZoovyUser

		updateSearchNav : {
			
			onSuccess : function(tagObj)	{
//				myControl.util.dump('BEGIN myRIA.callbacks.updateSearchNav.onSuccess');

				var keyword = tagObj.datapointer.split("|")[1];
//				myControl.util.dump(" -> update search nav for = "+keyword);
				var o = "<li><a href='#' onClick=\"$('#headerKeywordsInput').val('"+keyword+"'); $('#headerSearchFrm').submit();\">"+keyword+" ("+myControl.data[tagObj.datapointer]['@products'].length+")<\/a><\/li>"
//				myControl.util.dump(o);
				$('#altSearchesList').removeClass('loadingBG').append(o);
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid);
//$('#searchNav').append(myControl.util.getResponseErrors(d)).toggle(true); //here just in case. replaced w/ line above.
				$('#altSearchesList').removeClass('loadingBG')
				}
			
			}, //updateSearchNav


		showResults :  {
			onSuccess : function(tagObj)	{
//				myControl.util.dump('BEGIN myControl.ext.myRIA.callbacks.showResults.onSuccess');
				
				var keywords = tagObj.datapointer.split('|')[1];
//recent searches should not contain duplicates.
				if($.inArray(keywords,myControl.ext.myRIA.vars.user.recentSearches) < 0)
					myControl.ext.myRIA.vars.user.recentSearches.push(keywords);
				$('#altSearchesList').empty(); //clear existing 'alternative searches'
//				myControl.util.dump(' -> altSearchList emptied.');
				if(myControl.data[tagObj.datapointer]['@products'].length == 0)	{
					$('#resultsProdlist').empty().append("Zero items matched your search.  Please try again.");
					}
				else	{

//will handle building a template for each pid and tranlating it once the data is available.
//returns # of requests needed. so if 0 is returned, no need to dispatch.
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","withInventory":1,"withVariations":1,"parentID":"resultsProductListContainer","items_per_page":20,"csv":myControl.data[tagObj.datapointer]['@products']})
					}

//whether the search had results or not, if more than 1 keyword was searched for, provide a breakdown for each permutation.
				var keywords = tagObj.datapointer.split('|')[1];
				if(keywords.split(' ').length > 1)	{
					$('#altSearchesContainer').show();
//					myControl.util.dump(" -> more than 1 keyword was searched for.");
					$('#altSearchesList').addClass('loadingBG');
					myControl.ext.store_search.util.getAlternativeQueries(keywords,{"callback":"updateSearchNav","extension":"myRIA"});
					}
				else	{
					$('#altSearchesContainer').hide();
					}
				myControl.ext.myRIA.util.showRecentSearches();
				myControl.model.dispatchThis(); // will dispatch requests for product and/or requests for alternative queries.
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
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
				return "<a href='#' onClick=\"$('#headerKeywordsInput').val('"+suffix+"'); $('#headerSearchFrm').submit(); return false; \">"+phrase+"<\/a>"
				},
			":category" : function(suffix,phrase){
				return "<a href='#' onClick='myControl.ext.myRIA.util.handlePageContent(\"category\",\""+suffix+"\"); return false;'>"+phrase+"<\/a>"
				},
			":product" : function(suffix,phrase){
				return "<a href='#' onClick='myControl.ext.myRIA.util.handlePageContent(\"product\",\""+suffix+"\"); return false;'>"+phrase+"<\/a>"
				},
			":customer" : function(suffix,phrase){
// ### this needs to get smarter. look at what the suffix is and handle cases. (for orders, link to orders, newsletter link to newsletter, etc)				
				return "<a href='#' onClick='myControl.ext.myRIA.util.changeNavTo(\"customer\"); return false;'>"+phrase+"<\/a>"
				}
			},




////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		renderFormats : {
			
//assumes that you have already gotten a 'max' detail for the safecat specified data.value.
			subcatList : function($tag,data)	{
//				myControl.util.dump("BEGIN store_navcats.renderFormats.subcatList");
				var catSafeID; //used in the loop for a short reference.
				var o = '';
				if(!$.isEmptyObject(myControl.data['appCategoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail']))	{
					var L = myControl.data['appCategoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'].length;
					var size = L > 3 ? 3 : L; //don't show more than three.
//!!! hhhmm.. needs fixin. need to compensate 'i' for hidden categories.
					for(var i = 0; i < size; i +=1)	{
						if(myControl.data['appCategoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i].pretty[0] != '!')	{
							catSafeID = myControl.data['appCategoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i].id;
							o += "<li onClick=\"myControl.ext.myRIA.util.handlePageContent('category','"+catSafeID+"');\"> &#187; "+myControl.data['appCategoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i].pretty;
							if(myControl.data['appCategoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i]['@products'].length > 0)
								o += " ("+myControl.data['appCategoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i]['@products'].length+" items)"
							o += "<\/li>";
							}
						}
					if(L > 3)	{
						o += "<li onClick=\"myControl.ext.myRIA.util.handlePageContent('category','"+data.bindData.cleanValue+"');\">&#187; <b> View all "+L+" Categories<\/b><\/li>";
						}
					$tag.append(o);
					}		
				}, //subcatList			

//TEMPORARY SOLUTIONS!  these two hacks are here because we need something right now.
			paypalButtonHack : function($tag,data)	{
				$tag.empty().append("<a href='https://secure.homebrewers.com/c="+myControl.sessionId+"/s=homebrewers.com/paypal.cgis?mode=cartec&cart="+myControl.sessionId+"&ts='"+myControl.util.unixNow()+"><img width='145' height='42' border='0' src='https://www.paypal.com/en_US/i/btn/btn_xpressCheckoutsm.gif' alt='' /></a>");
				},
			
			googleButtonHack : function($tag,data)	{
				$tag.empty().append("<a href=\"javascript:setUrchinInputCode(pageTracker); document.location='https://secure.homebrewers.com/c="+myControl.sessionId+"/s=homebrewers.com/_googlecheckout?analyticsdata='+getUrchinFieldValue();\"><img height=43 width=160 border=0 src='https://checkout.google.com/buttons/checkout.gif?merchant_id=826419156185928&w=160&h=43&style=white&variant=text&loc=en_US'></a>");
				},
			




			legacyURLToRIA : function($tag,data)	{
				myControl.util.dump("BEGIN control.renderFormats.legacyURLToRIA");
				myControl.util.dump(" -> data.bindData.cleanValue: "+data.bindData.cleanValue);
				if(data.bindData.cleanValue == '#')	{
					$tag.removeClass('pointer');
					}
				else	{
					pageType = myControl.ext.myRIA.util.whatPageTypeAmI(data.bindData.cleanValue);
					pageInfo = myControl.ext.myRIA.util.giveMeRelevantInfoToPage(data.bindData.cleanValue);
					myControl.util.dump(" -> pageType: "+pageType);
					myControl.util.dump(" -> pageInfo: "+pageInfo);
					$tag.addClass('pointer').click(function(){
						myControl.ext.myRIA.util.handlePageContent(pageType,pageInfo,true);
						});
					}
				},
			
//pass in the sku for the bindata.value so that the original data object can be referenced for additional fields.
// will show price, then if the msrp is MORE than the price, it'll show that and the savings/percentage.
		priceRetailSavings : function($tag,data)	{
			var o = ''; //output generated.
			var pData = myControl.data['appProductGet|'+data.bindData.cleanValue]['%attribs'];
//use original pdata vars for display of price/msrp. use parseInts for savings computation only.
			var price = parseInt(pData['zoovy:base_price']);
			var msrp = parseInt(pData['zoovy:prod_msrp']);
			if(price > 0)	{
				o += "<div class='basePrice'><span class='prompt pricePrompt'>Our Price: <\/span><span class='value'>";
				o += myControl.util.formatMoney(pData['zoovy:base_price'],'$',2,true)
				o += "<\/span><\/div>";
//only show the msrp if it is greater than the price.
				if(msrp > price)	{
					o += "<div class='retailPrice'><span class='prompt retailPricePrompt'>MSRP: <\/span><span class='value'>";
					o += myControl.util.formatMoney(pData['zoovy:prod_msrp'],'$',2,true)
					o += "<\/span><\/div>";
//don't bother with savings of less than a buck.
					if(msrp-price > 1)	{
						o += "<div class='savings'><span class='prompt savingsPrompt'>You Save: <\/span><span class='value'>";
						o += myControl.util.formatMoney(msrp-price,'$',2,true)
						o += "<\/span><\/div>";
						}
					}
				}
			$tag.append(o);
			}

		}, //renderFormats

////////////////////////////////////   UTIL    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		util : {
//tries to guess which storage container category is most appropriate for this category.
			guessContainerParentCat : function(pid)	{
				var r,org;
				org = myControl.data['appProductGet|'+pid]['%attribs']['user:prod_organization']
				if(org)	{
					if(org == 'MLB'){r = '.storage-containers.major-league-baseball'}
					else if(org == 'NFL'){r = '.storage-containers.national-football-league'}
					else{r = false}
					}
				else	{r = false;}
				return r;
				},
//executed when the app loads.  
//loads page content based on legacy linking syntax. (if url is /product/pid, then pid gets loaded)
			handleLegacyURL : function()	{
				var pageType = this.whatPageTypeAmI(window.location.href);
// will return either the safe path or pid or something else useful
// hash.substring(0) will return everything preceding a #, if present.
				var pageInfo = this.giveMeRelevantInfoToPage(window.location.href); 
				this.handlePageContent(pageType,pageInfo,false);
				return {'pageType':pageType,'pageInfo':pageInfo} //returning this saves some additional looking up in the appInit
				},

//loads page content. pass in a type: category, product, customer or help
// and a page info: catSafeID, sku, customer admin page (ex: newsletter) or 'returns' (respectively to the line above.
			handlePageContent : function(pageType,pageInfo,skipPushState)	{
//				myControl.util.dump("BEGIN handlePageContent. type: "+pageType+" and info: "+pageInfo+" and skipPushState: "+skipPushState);

				$(".ui-dialog-content").dialog("close"); //close all modal windows.

				switch(pageType)	{

				case 'product':
					myControl.ext.myRIA.util.showProd(pageInfo);
					break;

				case 'category':
					myControl.ext.myRIA.util.showPage(pageInfo);
					break;

				case 'customer':
					myControl.ext.myRIA.util.changeNavTo('customer',pageInfo);
					break;

				case 'checkout':
//before going into checkout, make sure session is secure.
					myControl.util.dump("PROTOCOL: "+document.location.protocol);
					if('https:' != document.location.protocol)	{
// !!! wrapper is on uri for testing purposes. Remove before deployment.
// if we redirect to ssl for checkout, it's a new url and a pushstate isn't needed, so a param is added to the url.
						document.location = myControl.vars.secureURL+"c="+myControl.sessionId+"/checkout.cgis?SENDER=JCHECKOUT&SKIPPUSHSTATE=1&WRAPPER=~homebrewer_homebrewerscom_20120323";
						
						}
					else	{
//will get here if session is already secure and checkout is clicked and also if a non-secure session got redirected to secure.
// this condition is met after the redirect, so skippushstate is checked on URI.
						if(myControl.util.getParameterByName('SKIPPUSHSTATE') == 1)
							skipPushState = true;
						$('#mainContentArea').empty(); //duh.
						myControl.ext.convertSessionToOrder.calls.startCheckout.init('mainContentArea');
						}
					break;

				case 'help':
					myControl.ext.myRIA.util.changeNavTo('help',pageInfo);
					break;

				case 'homepage':
						myControl.ext.myRIA.util.showPage('.');
						break;

				case 'cart':
						myControl.ext.myRIA.util.showPage('.'); //load homepage content in BG.
						myControl.ext.myRIA.util.showCart();
						break;

				default:
					//uh oh. what are we? default to homepage.
					myControl.ext.myRIA.util.showPage('.');
					}
//				myControl.util.jumpToAnchor('#top'); //this will totally F up the push/pop state feature.
				if(skipPushState == true)	{
					myControl.util.dump("skipped adding a pushstate for "+pageType);
					//skipped when executed from a 'pop' or when initial page loads.
					}
				else	{
					this.addPushState({'pageType':pageType,'pageInfo':pageInfo})
					}
				},


//determine from URL what the page type is. uses legacy zoovy syntax. (/category/.. or /product/...	
			whatPageTypeAmI : function(url)	{
				var r; //what is returned.
				if(!url)	{
					myControl.util.dump("no url specified for whatPageTypeAmI");
					}
				else if(url.indexOf('/product/') > 0)	{
					r = 'product'
					}
				else if(url.indexOf('/category/') > 0)	{
					r = 'category'
					}
				else if(url.indexOf('/customer/') > 0)	{
					r = 'customer'
					}
				else if(url.indexOf('/cart') > 0)	{
					r = 'cart'
					}
				else if(url.indexOf('/checkout') > 0)	{
					r = 'checkout'
					}
				else	{
					r = 'other'
					}
				myControl.util.dump("whatPageTypeAmI = "+r);
				return r;
				},

		

			giveMeRelevantInfoToPage : function(url)	{
				var r; //what is returned.
//				myControl.util.dump("BEGIN myRIA.util.giveMeRelevantInfoToPage");
//				myControl.util.dump(" -> url before hashsplit = "+url);
				
				if(url.indexOf('#') > 0)	{
//					myControl.util.dump(" -> url contains hash (#)");
					url = url.substr(0, url.indexOf('#')); //strip off everything after hash (#)
					}
				url = url.split('?')[0] //get rid of any uri vars.
//				myControl.util.dump(" -> url after hashsplit = "+url);
				if(url.indexOf('/product/') > 0)	{
					r = url.split('/product/')[1]; //should be left with SKU or SKU/something_seo_friendly.html
					if(r.indexOf('/') > 0)	{r = r.split('/')[0];} //should be left with only SKU by this point.
					}
				else if(url.indexOf('/category/') > 0)	{
					r = url.split('/category/')[1]; //left with category.safe.id or category.safe.id/
					myControl.util.dump(" after /category/ split, r = "+r);
					if(r.charAt(r.length-1) == '/')	{r = r.slice(0, -1)} //strip trailing /
					myControl.util.dump(" after strip trailing slash, r = "+r);
					if(r.charAt(0) != '.')	{r = '.'+r}
					}
				else if(url.indexOf('/customer/') > 0)	{
					r = url.split('/customer/')[1]; //left with order_summary or order_summary/
					if(r.charAt(r.length-1) == '/')	{r = r.slice(0, -1)} //strip trailing /
					}
				else	{
				// url = www.something.com/returns.cgis or ...cgis?key=value
					var chunks = url.split('/');
					r = chunks[chunks.length -1]; //should be left with returns or returns.cgis potentially with ?urivars
					if(r.indexOf('?') > 0){r = r.split('?')[1]} //remove any uri vars.
					r = r.replace('.cgis');  // should be left with just returns
					}
//				myControl.util.dump("giveMeRelevantInfoToPage = "+r);
				return r;
				},

//a generic function for guessing what type of object is being dealt with. Check for common params. ### not in use yet. 
			whatAmIFor : function(P)	{
				var r = false; //what is returned
				if(P.pid)	{r = 'product'}
				else if(P.catSafeID){r = 'category'}
				else if(P.path){ r = 'category'}
				else if(P.page && P.page.indexOf('/customer/') > 0)	{r = 'customer'}
				else if(P.page)	{r = 'help'}
				return r;
				},
//p is an object that gets passed into a pushState in 'addPushState'.  pageType and pageInfo are the only two params currently.
//https://developer.mozilla.org/en/DOM/window.onpopstate
			handlePopState : function(P)	{
//				myControl.util.dump("handling pop state");
//on initial load, P will be blank.
				if(P)	{
					this.handlePageContent(P.pageType,P.pageInfo,true);
//					myControl.util.dump("POPSTATE Executed.  pageType = "+P.pageType+" and pageInfo = "+P.pageInfo);
					}
				else	{
//					myControl.util.dump(" -> no event.state (P) defined.");
					}
				},
			
//pass in the 'state' object. ex: {'pid':'somesku'} or 'catSafeID':'.some.safe.path'
//will add a pushstate to the browser for the back button and change the URL
//http://spoiledmilk.dk/blog/html5-changing-the-browser-url-without-refreshing-page

			addPushState : function(P)	{
				var title = 'HomeBrewers '+P.pageInfo;
				var relativePath;
//				myControl.util.dump("BEGIN addPushState. ");
//				myControl.util.dump(P);
//handle cases where the homepage is treated like a category page. happens in breadcrumb.
				if(P.pageInfo == '.')	{
					P.pageType = 'other'
					relativePath = '/';
					}
				else	{
					relativePath = this.buildRelativePath(P);
					}
				try	{
					window.history.pushState(P, title, relativePath);
					}
				catch(err)	{
					//Handle errors here
					}
				
				},
//used in add push state and also for addthis.
//combines the pageType with the pageInfo to build the relative path (ex: /product/pid/)
			buildRelativePath : function(P)	{
				var relativePath; //what is returned.
				switch(P.pageType)	{
				case 'product':
					relativePath = '/product/'+P.pageInfo+'/';
					break;
				case 'category':

//don't want /category/.something, wants /category/something
//but the period is needed for passing into the pushstate.
					var noPrePeriod = P.pageInfo.charAt(0) == '.' ? P.pageInfo.substr(1) : P.pageInfo; 
					relativePath = '/category/'+noPrePeriod+'/';
					break;
				case 'customer':
					relativePath = '/customer/'+P.pageInfo+'/';
					break;
				case 'other':
					relativePath = '/'+P.pageInfo;
					break;
				default:
					//uh oh. what are we?
					relativePath = '/'+P.pageInfo;
					}
				return relativePath;
				},

//rather than having all the params in the dom, just call this function. makes updating easier too.
			showProd : function(pid)	{
//				myControl.ext.store_product.util.prodDataInModal({'pid':pid,'templateID':'prodViewerTemplate',});
//nuke existing content and error messages.
				$('#globalMessaging').empty().hide(); 
				$('#mainContentArea').empty().append(myControl.renderFunctions.createTemplateInstance('prodViewerTemplate',"productViewer"));
				myControl.ext.store_product.calls.appReviewsList.init(pid);  //store_product... appProductGet DOES get reviews. store_navcats...getProd does not.
				myControl.ext.store_product.calls.appProductGet.init(pid,{'callback':'showProd','extension':'myRIA','parentID':'productViewer'});
				myControl.model.dispatchThis();
				
//add item to recently viewed list IF it is not already in the list.				
				if($.inArray(pid,myControl.ext.myRIA.vars.user.recentlyViewedItems) < 0)
					myControl.ext.myRIA.vars.user.recentlyViewedItems.push(pid);

				
				},

			changeNavTo : function(newNav,article)	{
//				myControl.util.dump("BEGIN myRIA.util.changeNavTo ("+newNav+")");
//				myControl.model.abortQ('mutable');  // ### NOTE - test this when DEV is stable.
				$(".ui-dialog-content").dialog("close");  //close any open dialogs. important cuz could get executed via wiki in a modal window.

//new nav is 'customer' or 'help'. search nav may or may not be supported for this RIA
				if(!newNav)	{myControl.util.dump("WARNING - nav type not specified for changeNavTo");}
				else if(newNav == 'search')	{
					$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('mainContentArea_'+newNav,newNav+'Template',myControl.data['appProfileInfo|'+myControl.vars.profile]))
					}
				else if (newNav == 'help' || newNav == 'customer')	{
					$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('mainContentArea_'+newNav,newNav+'Template',myControl.data['appProfileInfo|'+myControl.vars.profile]))
					}
				else	{
//unknown nav.
myControl.util.dump("WARNING - unknown nav type ["+newNav+"] specified for changeNavTo");
					}
				myControl.ext.myRIA.util.bindNav(newNav);
				if(article)
					this.showArticle(article);

				},



//figures which nav tree is visible and returns the id. probably don't need this for this RIA.
			whichNavIsVisible : function()	{
				var r = ''; //this is what's returned.
				$('#rightCol nav').each(function(){
					if($(this).is(':visible'))	{
						r = $(this).attr('id');
						r = r.slice(0,r.length-3);//trims 'Nav' off the end.
						}
					});
				return r;
				},

			bindNav : function(newNav)	{
//myControl.util.dump("BEGIN bindNav ("+newNav+")");
$('#rightCol nav a').each(function(){
	var $this = $(this);
	$this.addClass('ui-state-default').click(function(event){
		$('#rightCol nav a').removeClass('ui-state-active');
		event.preventDefault(); //cancels any action on the href. keeps anchor from jumping.
//		myControl.ext.myRIA.util.showArticle($this.attr('href').substring(1)); //substring is to strip the # off the front
		myControl.ext.myRIA.util.handlePageContent(newNav,$this.attr('href').substring(1))
		});
	});
				},


		
			
			showPriceMatching : function()	{
				var $target = $('#priceMatching');
				$target.empty().append(myControl.renderFunctions.transmogrify('priceMatchingContent','catPageHeaderTemplate',myControl.data['appPageGet|.100__satisfaction_guarantee']['%page']))
//				myControl.util.dump(myControl.data['appPageGet|.100__satisfaction_guarantee']);
				$target.dialog({modal: true,width:600,height:600});
				},
			

			showLoginModal : function()	{
//make sure form is showing and previous messaging is removed/reset.
				$('#loginSuccessContainer').hide(); //contains 'continue' button.
				$('#loginMessaging').empty(); //used for success and fail messaging.
				$('#loginFormContainer').show(); //contains actual form.

				$('#loginFormForModal').dialog({modal: true,width:400});
				},

//executed from a 'nav' link. for instance, help > return policy would pass 'returns' and show the return policy.
//articles must exist on the dom. since they're appended to mainContentArea in most cases, they're also removed frequently.
//make sure they're available.
			showArticle : function(subject)	{
//				myControl.util.dump("BEGIN myRIA.util.showArticle ("+subject+")");
				$('#mainContentArea article').hide();
				$('#rightCol [href=#'+subject+']').addClass('ui-state-highlight');
				$('#globalMessaging').empty();

				var authState = myControl.sharedCheckoutUtilities.determineAuthentication();
				myControl.util.dump(" -> authState = "+authState);
//don't show any pages that require login unless the user is logged in.
				if((authState != 'authenticated') && (subject == 'orders' || subject == 'wishlist' || subject == 'changepassword' || subject == 'forgetme' || subject == 'myaccount'))	{
//in addition to showing the modal window, the article the user was trying to see is added to the 'continue' button that appears after a successful login
//this will be fluid, as it'll take them where they expected to go.
					myControl.ext.myRIA.util.showLoginModal();
					$('#loginSuccessContainer').empty();
					$('<button>').addClass('stdMargin ui-state-default ui-corner-all  ui-state-active').attr('id','modalLoginContinueButton').text('Continue').click(function(){
						$('#loginFormForModal').dialog('close');
						myControl.ext.myRIA.util.showArticle(subject)
						}).appendTo($('#loginSuccessContainer'));					

					}
				else	{
					$('#'+subject+'Article').show(); //only show content if page doesn't require authentication.
					switch(subject)	{
						case 'newsletter':
							$('#newsletterFormContainer').empty();
							myControl.ext.store_crm.util.showSubscribe({'parentID':'newsletterFormContainer','templateID':'subscribeFormTemplate'});
							break;
						case 'orders':
							myControl.ext.store_crm.calls.buyerPurchaseHistory.init({'parentID':'orderHistoryContainer','templateID':'orderLineItemTemplate','callback':'showOrderHistory','extension':'store_crm'});
							break;
						case 'wishlist':
							myControl.ext.store_crm.calls.buyerProductLists.init('wishlist',{'parentID':'wishlistContainer','callback':'showList','extension':'myRIA'});
							break;
						case 'myaccount':
//							myControl.util.dump(" -> myaccount article loaded. now show addresses...");
							// #### MOVE THIS CALL TO CRM.
							myControl.ext.myRIA.calls.buyerAddressList.init({'callback':'showAddresses','extension':'myRIA'},'mutable');
							break;
						case 'faq':
							myControl.ext.store_crm.calls.appFAQsAll.init({'parentID':'faqContent','callback':'showFAQTopics','extension':'store_crm','templateID':'faqTopicTemplate'});
							break;
						case 'forgetme':
							myControl.ext.store_crm.calls.buyerProductLists.init('forgetme',{'parentID':'forgetmeContainer','callback':'showList','extension':'myRIA'}); 
							break;
						default:
							//the default action is handled in the 'show' above. it happens for all.
						}
					}
				myControl.model.dispatchThis();
				},

			showRecentSearches : function()	{
				var o = ''; //output. what's added to the recentSearchesList ul
				var L = myControl.ext.myRIA.vars.user.recentSearches.length;
				var keywords,count;
				for(i = 0; i < L; i++)	{
					keywords = myControl.ext.myRIA.vars.user.recentSearches[i];
//					myControl.util.dump(" -> myControl.data['searchResult|"+keywords+"'] and typeof = "+typeof myControl.data['searchResult|'+keywords]);
					count = $.isEmptyObject(myControl.data['searchResult|'+keywords]) ? 0 : myControl.data['searchResult|'+keywords]['@products'].length
//					myControl.util.dump(" -> adding "+keywords+" to list of recent searches");
// 
					o += "<li><a href='#' onClick=\"$('#headerKeywordsInput').val('"+keywords+"'); $('#headerSearchFrm').submit(); return false;\">"+keywords+" ("+count+")<\/a><\/li>";
					}
				$('#recentSearchesList').html(o);
				},

			breadcrumb : function(catSafeID)	{
//				myControl.util.dump("BREADCRUMB cat safe id = "+catSafeID);
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
					var numRequests = 0;
//add homepage.
					$bc.append(myControl.renderFunctions.createTemplateInstance('categoryTemplate','breadcrumb_homepage'));
					numRequests += myControl.ext.store_navcats.calls.appCategoryDetail.init(s,{"callback":"translateTemplate","parentID":'breadcrumb_homepage'});
//start at position 1. position 0 is homepage, which is taken care of already.
					for (var i=1; i<len; i+=1) {
						s += pathArray[i];
//						myControl.util.dump(s);
						$bc.append(myControl.renderFunctions.createTemplateInstance('categoryTemplate','breadcrumb_'+s));
						numRequests += myControl.ext.store_navcats.calls.appCategoryDetail.init(s,{"callback":"translateTemplate","parentID":'breadcrumb_'+s});
//after each loop, the . is added so when the next cat id is appended, they're concatonated with a . between. won't matter on the last loop cuz we're done.
						s += ".";
						}
//					myControl.util.dump(" -> breadcrumb # requests: "+numRequests);
					if(numRequests > 0)	{myControl.model.dispatchThis()}
					}
				},

			showPage : function(catSafeID)	{
//				myControl.util.dump("BEGIN myRIA.util.showPage("+catSafeID+")");
				$(".ui-dialog-content").dialog("close");  //close any open dialogs. important cuz a 'showpage' could get executed via wiki in a modal window.
//				$('#mainContentArea').empty().append(myControl.renderFunctions.createTemplateInstance('categoryPageTemplate','page-'+catSafeID));
				if(catSafeID == '.')	{
					$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('homepage','homepageTemplate',{}));

/* set prodlist variables in memory to limit # of featured items and best sellers and to disable the multipage header. */
					myControl.ext.store_prodlist.vars.featuredItemsHP = {}; //reset/create object.
					myControl.ext.store_prodlist.vars.featuredItemsHP.items_per_page = 8;
					myControl.ext.store_prodlist.vars.featuredItemsHP.hide_multipage = true;
					myControl.ext.store_prodlist.vars.bestSellersHP = {}; //reset/create object.
					myControl.ext.store_prodlist.vars.bestSellersHP.items_per_page = 2;
					myControl.ext.store_prodlist.vars.bestSellersHP.hide_multipage = true;


					myControl.ext.store_navcats.calls.appCategoryDetail.init('.',{'targetID':'featuredItemsHP','callback':'showProdList','extension':'myRIA','templateID':'prodHPFeaturedTemplate'});
					myControl.ext.store_navcats.calls.appCategoryDetail.init('$best_sellers',{'targetID':'bestSellersHP','callback':'showProdList','extension':'myRIA','templateID':'prodHPBestTemplate'});
					myControl.model.dispatchThis();
					}
				else	{
//showPage is executed on app init. if globalmessaging is emptied, init messaging doesn't show up so only nuke errors for non-homepages.
					$('#globalMessaging').empty().hide(); 
//add category page template to DOM.
					$('#mainContentArea').empty().append(myControl.renderFunctions.transmogrify('page-'+catSafeID,'categoryPageTemplate',{}));

//get category data for displaying page
					myControl.ext.store_navcats.calls.appCategoryDetailMax.init(catSafeID,{"callback":"showPageContent","extension":"myRIA"})

// there's a small issue with the rendering system and page content.  Will be addressed in a future release.
// in the meantime, any content that may get double-translated use a replacewith on the node and in the view, add data-templateid to the template element (see catPageTopContent in view for example)
					$('#catPageTopContent').replaceWith(myControl.renderFunctions.createTemplateInstance('catPageHeaderTemplate',{'id':'catPageTopContent'}));
					$('#catPageBottomContent').replaceWith(myControl.renderFunctions.createTemplateInstance('catPageFooterTemplate',{'id':'catPageBottomContent'}));
					
					myControl.ext.store_navcats.calls.appPageGet.init({'PATH':catSafeID,'@get':['banner1_link','banner1','description','short_description','youtube_videoid']},{"callback":"translateTemplate","parentID":"catPageTopContent"});
					myControl.ext.store_navcats.calls.appPageGet.init({'PATH':catSafeID,'@get':['description2']},{"callback":"translateTemplate","parentID":"catPageBottomContent"});					
					
					
					myControl.model.dispatchThis();

					}
			
				},

			showOrderDetails : function(orderID)	{
//				myControl.util.dump("BEGIN myRIA.util.showOrderDetails");
				var safeID = myControl.util.makeSafeHTMLId(orderID);
				$orderEle = $('#orderContents_'+safeID);
//if the element is empty, then this is the first time it's been clicked. Go get the data and display it, changing classes as needed.
				if($orderEle.is(':empty'))	{
					$orderEle.show().addClass('ui-corner-bottom ui-accordion-content-active'); //object that will contain order detail contents.
					$orderEle.append(myControl.renderFunctions.createTemplateInstance('orderContentsTemplate','orderContentsTable_'+safeID))
					$('#orderContentsTable_'+safeID).addClass('loadingBG');
					if(myControl.ext.store_crm.calls.buyerPurchaseHistoryDetail.init(orderID,{'callback':'showOrder','extension':'store_crm','templateID':'orderContentsTemplate','parentID':'orderContentsTable_'+safeID}))
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
//				myControl.util.dump("BEGIN myRIA.util.showCart");
				myControl.ext.store_cart.util.showCartInModal('cartViewer');
				if(myControl.ext.store_cart.vars.cartAccessories.length > 0)	{
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productTemplate","withInventory":1,"withVariations":1,"parentID":"cartAccessoriesCarousel","csv":myControl.ext.store_cart.vars.cartAccessories});
					myControl.model.dispatchThis();
					$('#cartAccessoriesCarouselContainer').show(); //container is hidden by default.
					$('#cartAccessoriesCarousel').jcarousel();
					}

				},

			handleAddToList : function(pid,listID)	{

myControl.util.dump("BEGIN myRIA.util.handleAddToList ("+pid+")");
var authState = myControl.sharedCheckoutUtilities.determineAuthentication();
if(authState == 'authenticated')	{
	myControl.ext.store_crm.calls.addToCustomerList.init({"listid":listID,"sku":pid},{"parentID":"CRMButtonMenu","message":"Item has been added to your list","callback":"showMessaging"}); 
	myControl.model.dispatchThis();
	}
else	{
	myControl.ext.myRIA.util.showLoginModal();
	$('#loginMessaging').append("This feature requires you to be logged in.");
	$('#loginSuccessContainer').empty();
	$('<button>').addClass('stdMargin ui-state-default ui-corner-all  ui-state-active').attr('id','modalLoginContinueButton').text('Continue').click(function(){
		$('#loginFormForModal').dialog('close');
		myControl.ext.myRIA.util.handleAddToList(pid,listID);
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
					myControl.calls.authentication.zoovy.init({"login":email,"password":password},{'callback':'authenticateZoovyUser','extension':'myRIA'});
					myControl.calls.refreshCart.init({},'immutable'); //cart needs to be updated as part of authentication process.
//					myControl.ext.store_crm.calls.buyerProductLists.init('forgetme',{'callback':'handleForgetmeList','extension':'store_prodlist'},'immutable');
					
					myControl.model.dispatchThis('immutable');
					}
				else {
					$errorDiv.toggle(true).append(myControl.util.formatMessage(errors));
					}
				}, //loginFrmSubmit
			
			
			
			handleAddToCart : function(formID)	{

myControl.util.dump("BEGIN store_product.calls.cartItemsAdd.init")
$('#'+formID+' .atcButton').addClass('disabled').attr('disabled','disabled');
if(!formID)	{
	//app error
	}
else	{
	var pid = $('#'+formID+'_product_id').val();
	if(myControl.ext.store_product.validate.addToCart(pid))	{
		myControl.ext.store_product.calls.cartItemsAdd.init(formID,{'callback':'itemAddedToCart','extension':'myRIA'});
		myControl.calls.refreshCart.init({'callback':'updateMCLineItems','extension':'myRIA'},'immutable');
		myControl.model.dispatchThis('immutable');
		}
	else	{
		$('#'+formID+' .atcButton').removeClass('disabled').removeAttr('disabled');
		}
	}
return r;				





				}

			
			} //util


		
		} //r object.
	return r;
	}