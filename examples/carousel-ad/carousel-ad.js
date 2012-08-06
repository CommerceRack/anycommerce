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
		"templates" : ['productListTemplate'],
		"dependAttempts" : 0,  //used to count how many times loading the dependencies has been attempted.
		"dependencies" : ['store_prodlist','store_product','store_search','store_cart','store_crm'] //a list of other extensions (just the namespace) that are required for this one to load
		},


					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



	calls : {
//move this to crm. here for now cuz B has DEV F'd up.
//make sure to add a fetchData too.
		sample : {
			init : function(tagObj,Q)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj["datapointer"] = "buyerAddressList"; 
				this.dispatch(tagObj,Q);
				return 1;
				},
			dispatch : function(tagObj,Q)	{
//				myControl.model.addDispatchToQ({"_cmd":"buyerAddressList","_tag": tagObj},Q);
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
				myControl.calls.refreshCart.init({'callback':'handleCheckoutButton','extension':'myRIA'},'mutable');
				myControl.model.dispatchThis();

var ajaxRequest = myControl.model.fetchNLoadTemplates("templates.html",['productChildrenTemplate','cartTemplate','productListTemplateCart','productTemplate','productReviewsTemplateDetail','imageViewerTemplate']);
ajaxRequest.success(function(){
	if(typeof myAppIsLoaded == 'function'){
		myAppIsLoaded();
		}
	})
				},
			onError : function(d)	{
				$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			},

		


		itemAddedToCart :	{
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.store_product.callbacks.itemAddedToCart.onSuccess');
				$('.atcButton').removeAttr('disabled').removeClass('disabled'); //makes all atc buttons clickable again.
				$('.checkoutNowButton').show();
				var htmlid = 'atcMessaging_'+myControl.data[tagObj.datapointer].product1;
				$('#atcMessaging_'+myControl.data[tagObj.datapointer].product1).append(myControl.util.formatMessage({'message':'Item Added','htmlid':htmlid,'uiIcon':'check','timeoutFunction':"$('#"+htmlid+"').slideUp(1000);"}));
				},
			onError : function(responseData,uuid)	{
				myControl.util.dump('BEGIN myControl.ext.store_product.callbacks.init.onError');
				$('.atcButton').removeAttr('disabled'); //remove the disabling so users can push the button again, if need be.
				$('#atcMessaging_'+myControl.data[responseData['_rtag'].datapointer].product1).append(myControl.util.getResponseErrors(responseData))
				}
			}, //itemAddedToCart


		showProd : 	{
			onSuccess : function(tagObj)	{
				myControl.util.dump("BEGIN myRIA.callbacks.showProd");
//				myControl.util.dump(tagObj);
				myControl.renderFunctions.translateTemplate(myControl.data[tagObj.datapointer],tagObj.parentID);
//				myControl.util.dump(" -> resetting addthis.toolbox");
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},
//executed as part of init. shows checkout button if cart is populated.
		handleCheckoutButton : {
			onSuccess : function(tagObj)	{
				myControl.util.dump("BEGIN myRIA.callbacks.handleCheckoutButton.onSuccess ["+myControl.data.cartItemsList.cart['data.item_count']+"]");
				if(myControl.data.cartItemsList.cart['data.item_count'] >= 1)
					$('.checkoutNowButton').show(); //make sure the link to checkout is visible.
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},

		
						
//executed when the cart is changed, such as a zip entered or a country selected.
		cartUpdated :	{
			onSuccess : function(tagObj)	{
				myControl.util.dump("BEGIN myRIA.callbacks.cartUpdated.onSuccess");
				myControl.ext.store_cart.util.showCartInModal('cartTemplate'); 
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},

			
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
					myControl.ext.store_prodlist.util.buildProductList({"withInventory":1,"withVariations":1,"templateID":tagObj.templateID,"parentID":tagObj.targetID,"csv":myControl.data[tagObj.datapointer]['@products']})
					myControl.model.dispatchThis();
					myControl.util.dump(" -> now is the time on sprockets when we carousel");
					$('#prodlistCarousel').jcarousel({
						wrap: 'circular',
						auto: 4,
						visible: 1,
						scroll: 1
						});
					}
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			}, //showList

		handleElasticResults : {
			onSuccess : function(tagObj)	{
				myControl.util.dump("BEGIN myRIA.callbacks.handleElasticResults.onSuccess.");
				var L = myControl.data[tagObj.datapointer]['_count'];
				myControl.util.dump(" -> Number Results: "+L);
				$parent = $('#'+tagObj.parentID).empty().removeClass('loadingBG').show();
				if(L == 0)	{
					myControl.util.dump("WARNING! The query returned no results. No zero results message output so site aesthetic would be preserved.");
//					$parent.append("Your query returned zero results.");
					}
				else	{
					var pid;//recycled shortcut to product id.
					for(var i = 0; i < L; i += 1)	{
						pid = myControl.data[tagObj.datapointer].hits.hits[i]['_source']['pid'];
						myControl.ext.store_product.calls.appProductGet.init(pid,{},'passive'); //need full prod data in memory for add to cart to work.
						$parent.append(myControl.renderFunctions.transmogrify({'id':pid,'pid':pid},'productListTemplate',myControl.data[tagObj.datapointer].hits.hits[i]['_source']));
						}
					$parent.jcarousel({
						wrap: 'circular',
						visible: 1,
						scroll: 1
						});
					myControl.model.dispatchThis('passive');
					}
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},




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
					myControl.ext.store_prodlist.util.buildProductList({"templateID":"productListTemplate","withInventory":1,"withVariations":1,"parentID":"resultsProductListContainer","items_per_page":20,"csv":myControl.data[tagObj.datapointer]['@products']})
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
				return phrase
				},
			":product" : function(suffix,phrase){
				return "<a href='#' onClick='myControl.ext.myRIA.util.showContent(\"product\",\""+suffix+"\"); return false;'>"+phrase+"<\/a>"
				},
			":customer" : function(suffix,phrase){
// ### this needs to get smarter. look at what the suffix is and handle cases. (for orders, link to orders, newsletter link to newsletter, etc)				
				return phrase
				}
			},




////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		renderFormats : {
			legacyURLToRIA : function($tag,data)	{
				myControl.util.dump("BEGIN control.renderFormats.legacyURLToRIA");
				myControl.util.dump(" -> data.value: "+data.value);
				if(data.value == '#')	{
					$tag.removeClass('pointer');
					}
				else	{
					pageType = myControl.ext.myRIA.util.whatPageTypeAmI(data.value);
					pageInfo = myControl.ext.myRIA.util.giveMeRelevantInfoToPage(data.value);
					myControl.util.dump(" -> pageType: "+pageType);
					myControl.util.dump(" -> pageInfo: "+pageInfo);
					$tag.addClass('pointer').click(function(){
						myControl.ext.myRIA.util.showContent(pageType,pageInfo,true);
						});
					}
				},
		

/*
This will work with an elastic search results.  The button default action should add to cart.
if options are present, then this block is executed and the default action can be overridden.
*/

			addToCartButton : function($tag,data)	{
myControl.util.dump("BEGIN store_product.renderFunctions.addToCartButton");
// myControl.util.dump(data);
$tag.addClass('chooseOptionsButton').bind('click.myATCEvent',function(event){
	event.preventDefault();
	myControl.ext.myRIA.util.showProd($(this).parent().attr('data-pid'));
	}).text('Choose Options')

				}, //addToCartButton
		
//pass in the sku for the bindata.value so that the original data object can be referenced for additional fields.
// will show price, then if the msrp is MORE than the price, it'll show that and the savings/percentage.
		priceRetailSavings : function($tag,data)	{
			var o = ''; //output generated.
			var pData = myControl.data['appProductGet|'+data.value]['%attribs'];
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


////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		action : {
/*
Parameters:
parentid. -> probably the id of a UL element which will have each child (product) appended to it.
query -> either a keyword(s) or an elastic object. ex: {"size":"10","mode":"elastic-native","filter":{"term":{"tags":"IS_PREORDER"}}}
templateid (optional) -> a product list template.
*/
			showCarousel : function(P)	{
				if(P.parentID && P.query)	{


var qObj = {}; //query object
if(typeof P.query == 'object')	{
	qObj = P.query;
	}
else	{
	qObj.mode = 'elastic-native';
	qObj.size = 10;
	qObj.query =  {"query_string" : {"query" : P.query}};
	}

qObj.type = 'product';
//datapointer needs to be unique. in case multiple carousels are present. TS isn't the worlds best solution, but it'll work for now.
var tagObj = {"callback":"handleElasticResults","extension":"myRIA","parentID":P.parentID,"datapointer":"elasticsearch|"+myControl.util.unixNow()};
tagObj.templateID = P.templateID ? P.templateID : 'productListTemplate';

myControl.ext.store_search.calls.appPublicSearch.init(qObj,tagObj);
myControl.model.dispatchThis();



					}
				else	{
					myControl.util.dump("WARNING! either parentID ["+P.parentID+"] or query [typeof: "+typeof P.query+"] were not set in showCarousel. both are required.");
					}
				}
			
			},


////////////////////////////////////   UTIL    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		util : {

			
			
//rather than having all the params in the dom, just call this function. makes updating easier too.
			showProd : function(pid)	{
//				myControl.ext.store_product.util.prodDataInModal({'pid':pid,'templateID':'productTemplate',});
//nuke existing content and error messages.
				var $parent = $('#productDetailModal');
				
//if the parent doesn't already exist, add it to the dom.
				if($parent.length == 0)	{
					$parent = $("<div \/>").attr({"id":"productDetailModal"}).appendTo(document.body);
					}
				
				$parent.empty().append(myControl.renderFunctions.transmogrify({'id':'productTemplate'},'productTemplate',myControl.data['appProductGet|'+pid]));
// a two step process here to open the dialog allows for the same dialog to be re-opened.
				$parent.dialog({modal: true,width:'90%',height:$(window).height() - 100,autoOpen:false});
				$parent.dialog('open');
				},

			removeByValue : function(arr, val) {
				for(var i=0; i<arr.length; i++) {
					if(arr[i] == val) {
						arr.splice(i, 1);
						break;
						}
					}
				},


			handleCheckout : function()	{
				$('#modalCart').empty().addClass('loadingBG').html("<br><br><br>Transfering to Secure Checkout");
				var checkoutURL = zGlobals.appSettings.https_app_url+"c="+myControl.sessionId+"/checkout.cgis?META=BLOGAPP";
				window.location = checkoutURL;
				},
			
			showCart : function()	{
//				myControl.util.dump("BEGIN myRIA.util.showCart");
				myControl.ext.store_cart.util.showCartInModal('cartTemplate');
				},
	
			handleAddToCart : function(formID)	{

myControl.util.dump("BEGIN store_product.calls.cartItemsAdd.init");
$('.checkoutNowButton').show();
$('#'+formID+' .atcButton').addClass('disabled').attr('disabled','disabled');
if(!formID)	{
	//app error
	myControl.util.dump("APP ERROR - no form id handed to myRIA.util.handleAddToCart");
	}
else	{
	var pid = $('#'+formID+'_product_id').val();
	
	if(myControl.ext.store_product.validate.addToCart(pid))	{
		myControl.ext.store_product.calls.cartItemsAdd.init(formID);
		myControl.calls.refreshCart.init({'callback':'cartUpdated','extension':'myRIA'},'immutable');
		myControl.ext.store_cart.calls.cartShippingMethods.init({},'immutable'); //get shipping methods into memory for quick use.
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