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
An extension for acquiring and displaying 'lists' of categories.
The functions here are designed to work with 'reasonable' size lists of categories.
*/


var store_product = function() {
	var r = {
		
	vars : {},




					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



	calls : {
//formerly getProduct
		appProductGet : {
			init : function(pid,tagObj,Q)	{
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
//				myControl.util.dump("BEGIN myControl.ext.store_product.calls.appProductGet");
//				myControl.util.dump(" -> PID: "+pid);

//datapointer must be added here because it needs to be passed into the callback. The callback could get executed before the ajax call (if in local).
//if no object is passed in, one must be created so that adding datapointer to a non existent object doesn't cause a js error
// Override datapointer, if set.
// The advantage of saving the data in memory and local storage is lost if the datapointer isn't consistent, especially for product data.
				pid = pid.toUpperCase();
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj["datapointer"] = "appProductGet|"+pid; 

//fetchData checks the timestamp, so no need to doublecheck it here unless there's a need to make sure it is newer than what is specified (1 day) in the fetchData function				
				if(myControl.model.fetchData(tagObj.datapointer) == false)	{
//					myControl.util.dump(" -> appProductGet not in memory or local. refresh both.");
					r += 1;
					this.dispatch(pid,tagObj,Q)
					}
				else if(typeof myControl.data[tagObj.datapointer]['@inventory'] == 'undefined' || typeof myControl.data[tagObj.datapointer]['@variations'] == 'undefined')	{
					myControl.util.dump(" -> either inventory or variations not in memory or local. get everything.");
//check to make sure inventory and pog info is available.
					r += 1;
					this.dispatch(pid,tagObj,Q)
					}
				else 	{
					myControl.util.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(pid,tagObj,Q)	{
//initially, reviews were obtained here automatically. But now it is likely a callback will be needed or that no reviews are needed, so removed. 20120326
				var obj = {};
				obj["_cmd"] = "appProductGet";
				obj["withVariations"] = 1;
//only get inventory if it matters. inv_mode of 1 means inventory is not important.
				if(typeof zGlobals == 'object' && zGlobals.globalSettings.inv_mode != 1)
					obj["withInventory"] = 1;
				obj["pid"] = pid;
				obj["_tag"] = tagObj;
				myControl.model.addDispatchToQ(obj,Q);
				}
			}, //appProductGet

		


//formerly addToCart
// early version of this had validation built into it, but that was inconsistent with how most other calls work
// and made it harder to customize per RIA, if desired.
		cartItemsAdd : {
			init : function(formID,tagObj)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = 'atc_'+myControl.util.unixNow(); //unique datapointer for callback to work off of, if need be.
				this.dispatch($('#'+formID).serializeJSON(),tagObj);
				return 1;
				},
			dispatch : function(obj,tagObj)	{
//				myControl.util.dump("BEGIN store_product.calls.cartItemsAdd.dispatch.");
//				myControl.util.dump(obj);
				obj["_cmd"] = "cartItemsAdd"; //cartItemsAddSerialized
				obj["_zjsid"] = myControl.sessionId; 
				obj["_tag"] = tagObj;
				myControl.model.addDispatchToQ(obj,'immutable');
				myControl.calls.cartSet.init({'payment-pt':null}); //nuke paypal token anytime the cart is updated.
				}
			},//addToCart


//formerly appReviewsList
		appReviewsList : {
			init : function(pid,tagObj)	{
				var r = 0; //will return a 1 or a 0 based on whether the item is in local storage or not, respectively.
//myControl.util.dump("appReviewsList tagObj:");
//myControl.util.dump(tagObj);
				pid = pid.toUpperCase();
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
				tagObj["datapointer"] = "appReviewsList|"+pid;

				if(myControl.model.fetchData('appReviewsList|'+pid) == false)	{
					r = 1;
					this.dispatch(pid,tagObj)
					}
				else	{
					myControl.util.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(pid,tagObj)	{
				myControl.model.addDispatchToQ({"_cmd":"appReviewsList","pid":pid,"_tag" : tagObj});	
				}
			}//appReviewsList
		}, //calls




					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration. Use this for any config or dependencies that need to occur.
//the callback is auto-executed as part of the extensions loading process.
		init : {
			onSuccess : function()	{
//				myControl.util.dump('BEGIN myControl.ext.store_product.init.onSuccess ');
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				myControl.util.dump('BEGIN myControl.ext.store_product.callbacks.init.onError');
				}
			}, //init
			
		itemAddedToCart :	{
			onSuccess : function(tagObj)	{
//				myControl.util.dump('BEGIN myControl.ext.store_product.callbacks.itemAddedToCart.onSuccess');
				$('.addToCartButton').removeAttr('disabled').removeClass('disabled').removeClass('ui-state-disabled'); //makes atc button clickable again.
				$('#atcMessaging_'+myControl.data[tagObj.datapointer].product1).append(myControl.util.formatMessage({'message':'Item(s) added to the cart!','uiIcon':'check'}))
				},
			onError : function(responseData,uuid)	{
				myControl.util.dump('BEGIN myControl.ext.myRIA.callbacks.itemAddedToCart.onError');
//				myControl.util.dump(responseData);
				$('.addToCartButton').removeAttr('disabled').removeClass('disabled').removeClass('ui-state-disabled'); //remove the disabling so users can push the button again, if need be.
				$('#atcMessaging_'+responseData.product1).append(myControl.util.getResponseErrors(responseData))
				}
			} //itemAddedToCart


		}, //callbacks



		validate : {
			
// #####################################  NON SOG SPECIFIC code

//currently, the add to cart, validation and options pieces aren't particularly flexible.
//this is mostly due to the variations.js file not being updated (yet).
//this'll change going forward.

addToCart : function (pid){
	//copied locally for quick reference.
	var sogJSON = myControl.data['appProductGet|'+pid]['@variations']
	var valid = true;
//	myControl.util.dump('BEGIN validate_pogs. Formid ='+formId);

	if($.isEmptyObject(sogJSON))	{
		myControl.util.dump('no sogs present (or empty object)');
		}
	else	{
		
		$('#JSONpogErrors_'+pid).empty(); //empty the div so that all old errors are gone.
	
//		myControl.util.dump(' -> Sogs are present.');
	
		var thisSTID = pid; //used to compose the STID for inventory lookup.
//the prompts for sogs with inventory. used to report inventory messaging if inventory checks are performed
		var inventorySogPrompts = '';
		var errors = '';
		var pogid, pogType, pogValue, safeid;
	//if the pog var is set, loop through it and validate.  
		if(sogJSON)	{
//			myControl.util.dump('got into the pogs-are-present validation');
			for(var i = 0; i < sogJSON.length; i++)	{
				pogid = sogJSON[i]['id']; //the id is used multiple times so a var is created to reduce number of lookups needed.
				pogType = sogJSON[i]['type']; //the type is used multiple times so a var is created to reduce number of lookups needed.
				safeid = myControl.util.makeSafeHTMLId(pogid);
				myControl.util.dump(' -> pogid = '+pogid+' and type = '+pogType+' and safeid = '+safeid);
	
				if(sogJSON[i]['optional'] == 1)	{
					//if the pog is optional, validation isn't needed.			
					}
				else if (pogType == 'attribs' || pogType == 'hidden' || pogType == 'readonly'){
					//these types don't require validation.
					}
	//Okay, validate what's left.
				else	{
	
//The value of a radio button is obtained slightly differently than any other form input type.
//pogid is used here, not safeid, because the radio inputs name isn't sanitized.
					if(pogType == 'radio' || pogType == 'imggrid')	{
	//jquery method for getting radio button value
						pogValue = $("input[name='pog_"+pogid+"']:checked").val(); //$('input:radio[name="pog_"+pogid]').pluck('value'); 
						}
					else	{
	//was originally just setting pogvalue to the form value, but if .value is blank, a js error was geing generated sometimes.
						pogValue = $('#pog_'+safeid).val(); 
						}
					
	//If the option IS required (not set to optional) AND the option value is blank, AND the option type is not attribs (finder) record an error
					if(pogValue == "" || pogValue === undefined)	{
						valid = false;
						errors += "<li>"+sogJSON[i]['prompt']+"<!--  id: "+pogid+" --><\/li>";
						}
	
					}
				
				//compose the STID
				if(sogJSON[i]['inv'] == 1)	{
					thisSTID += ':'+pogid+pogValue;
					inventorySogPrompts += "<li>"+sogJSON[i]['prompt']+"<\/li>";
					}
				
				}
			}


//		myControl.util.dump('past validation, before inventory validation. valid = '+valid);
	
	//if errors occured, report them.
		 if(valid == false)	{
//			myControl.util.dump(errors);
			$('#JSONpogErrors_'+pid).append(myControl.util.formatMessage("Uh oh! Looks like you left something out. Please make the following selection(s):<ul>"+errors+"<\/ul>"));
			}
	//if all options are selected AND checkinventory is on, do inventory check.
		else if(valid == true && typeof zGlobals == 'object' && zGlobals.globalSettings.inv_mode > 1)	{
	//		alert(thisSTID);
			if(!$.isEmptyObject(myControl.data['appProductGet|'+pid]['@inventory']) && !$.isEmptyObject(myControl.data['appProductGet|'+pid]['@inventory'][thisSTID]) && myControl.data['appProductGet|'+pid]['@inventory'][thisSTID]['inv'] < 1)	{
				$('#JSONpogErrors_'+pid).append(myControl.util.formatMessage("We're sorry, but the combination of selections you've made is not available. Try changing one of the following:<ul>"+inventorySogPrompts+"<\/ul>"));
				valid = false;
				}
	
			}
		}
	myControl.util.dump('STID = '+thisSTID);
	return valid;

	} //validate.addToCart



			
			
			}, //validate





////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





		renderFormats : {

//creates some required form inputs.
//the ID on the product_id input should NOT be changed without updating the addToCart call (which uses this id to obtain the pid).

			atcForm : function($tag,data)	{
//data.value = pid
				var formID = $tag.attr('id')+'_'+data.value; //append the pid to the ID to give it a unique ID
//				$tag.bind('submit',function(){return false;})
				$tag.attr('id',formID).append("<input type='hidden' name='add' value='yes' /><input type='hidden' name='product_id' id='"+formID+"_product_id' value='"+data.value+"' />");
				},
			
			reviewList : function($tag,data)	{
//				myControl.util.dump("BEGIN store_product.renderFormats.reviewList");
				var templateID = data.bindData.loadsTemplate;
//				myControl.util.dump(data.value)
				var L = data.value.length;
				for(i = 0; i < L; i += 1)	{
					$tag.append(myControl.renderFunctions.transmogrify({'id':'review_'+i},templateID,data.value[i]));
					}
				return L;
				},

			quantityDiscounts : function($tag,data)	{
//				myControl.util.dump("BEGIN store_product.renderFormats.quantityDiscounts");
//				myControl.util.dump("value: "+data.value);
				var o = ''; //what is output;
				
				var dArr = data.value.split(',');
				var tmp,num;
				var L = dArr.length;
//## operator can be either / or =  (5=125 means buy 5 @ $125ea., 5/125 means buy 5 @ $25ea.)
				for(i = 0; i < L; i += 1)	{
					if(dArr[i].indexOf('=') > -1)	{
//						myControl.util.dump(' -> treat as =');
						tmp = dArr[i].split('=');
						if(tmp[1].indexOf('$') >= 0){tmp[1] = tmp[1].substring(1)} //strip $, if present
//						myControl.util.dump(" -> tmp[1] = "+tmp[1]);
						o += "<div>buy "+tmp[0]+"+ for "+myControl.util.formatMoney(Number(tmp[1]),'$','')+" each<\/div>";  //test gss COR6872
						}
					else if(dArr[i].indexOf('/') > -1)	{
//						myControl.util.dump(' -> treat as /');
						tmp = dArr[i].split('/');
						o += "<div>buy "+tmp[0]+"+ for ";
						if(tmp[1].indexOf('$') >= 0){tmp[1] = tmp[1].substring(1)} //strip $, if present
//						myControl.util.dump(" -> tmp[1] = "+tmp[1]);
						num = Number(tmp[1]) / Number(tmp[0])
//						myControl.util.dump(" -> number = "+num);
						o += myControl.util.formatMoney(num,'$','') //test spork 1000
						o += " each<\/div>";
						}
					else	{
						myControl.util.dump("WARNING! invalid value for qty discount. Contained neither a '/' or an '='.");
						}
					tmp = ''; //reset after each loop.
					}
				$tag.append(o);
				},

			simpleInvDisplay : function($tag,data)	{
//data.value = available inventory
//				myControl.util.dump("BEGIN store_product.renderFunctions.invAvail.");
				if(data.value > 0)
					$tag.addClass('instock').append("In Stock");
				else
					$tag.addClass('outofstock').append("Sold Out");
				},


//add all the necessary fields for quantity inputs.
			atcQuantityInput : function($tag,data)	{
				if(myControl.ext.store_product.util.productIsPurchaseable(data.value))	{
					var o = '';
					o += "<input type='number' value='1' size='3' name='quantity' min='1' class='zform_number' id='quantity_"+data.value+"' />";
					$tag.append(o);
					}
				else
					$tag.hide().addClass('displayNone'); //hide input if item is not purchaseable.
				},

//add all the necessary fields for quantity inputs.
			atcFixedQuantity : function($tag,data)	{
				$tag.attr('id','quantity_'+data.value);
				},





// in this case, we aren't modifying an attribute of $tag, we're appending to it. a lot.
//this code requires the variations.js file.
//it loops through the products options and adds them to the fieldset (or whatever $tag is, but a fieldset is a good idea).
			atcVariations : function($tag,data)	{
//				myControl.util.dump("BEGIN store_product.renderFormats.atcVariations");
				var pid = data.value; 
				var formID = $tag.closest('form').attr('id'); //move up the dom tree till the parent form is found

//				myControl.util.dump(" -> pid: "+pid);
//				myControl.util.dump(" -> formID: "+formID);
				
				if(myControl.ext.store_product.util.productIsPurchaseable(pid))	{
//					myControl.util.dump(" -> item is purchaseable.");
					if(!$.isEmptyObject(myControl.data['appProductGet|'+pid]['@variations']) && myControl.model.countProperties(myControl.data['appProductGet|'+pid]['@variations']) > 0)	{
$("<div \/>").attr('id','JSONpogErrors_'+pid).addClass('zwarn').appendTo($tag);

var $display = $("<div \/>").attr('id','JSONPogDisplay_'+pid); //holds all the pogs and is appended to at the end.

pogs = new handlePogs(myControl.data['appProductGet|'+pid]['@variations'],{"formId":formID,"sku":pid});
var pog;
if(typeof pogs.xinit === 'function')	{pogs.xinit()}  //this only is needed if the class is being extended (custom sog style).
var ids = pogs.listOptionIDs();
for ( var i=0, len=ids.length; i<len; ++i) {
	pog = pogs.getOptionByID(ids[i]);
	$display.append(pogs.renderOption(pog,pid));
	}
$display.appendTo($tag);	
						}
					else	{
//						myControl.util.dump(" -> @variations is empty.");
						}
					}
					
				}, //addToCartFrm



//will remove the add to cart button if the item is not purchaseable.
			addToCartButton : function($tag,data)	{
//				myControl.util.dump("BEGIN store_product.renderFunctions.addToCartButton");
//				myControl.util.dump(" -> ID before any manipulation: "+$tag.attr('id'));
				var pid = data.value;
				var pData = myControl.data['appProductGet|'+pid];
// add _pid to end of atc button to make sure it has a unique id.
// add a success message div to be output before the button so that messaging can be added to it.
// atcButton class is added as well, so that the addToCart call can disable and re-enable the buttons.
				$tag.attr('id',$tag.attr('id')+'_'+pid).addClass('atcButton').before("<div class='atcSuccessMessage' id='atcMessaging_"+pid+"'><\/div>"); 
				if(myControl.ext.store_product.util.productIsPurchaseable(pid))	{
//product is purchaseable. make sure button is visible and enabled.
					if(pData && pData['%attribs']['is:preorder'])	{
						$tag.addClass('preorderButton').prop('value', 'Preorder');
						}
					else	{
						$tag.addClass('addToCartButton');
						}
					$tag.show().removeClass('displayNone').removeAttr('disabled');
					}
				else	{
					$tag.hide().addClass('displayNone').before("<span class='notAvailableForPurchase'>This item is not available for purchase<\/span>"); //hide button, item is not purchaseable.
					}

//				myControl.util.dump(" -> ID at end: "+$tag.attr('id'));
				} //addToCartButton

			},


////////////////////////////////////   UTIL    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		util : {
/*
A product is NOT purchaseable if:
it has no price. ### SANITY 0 IS a valid price. blank is not.
it is a parent
it has no inventory AND inventory matters to merchant 
*/
			productIsPurchaseable : function(pid)	{
//				myControl.util.dump("BEGIN store_product.util.productIsPurchaseable");
				var r = true;  //returns true if purchaseable, false if not or error.
				if(!pid)	{
					myControl.util.dump("ERROR! pid not passed into store_product.util.productIsPurchaseable");
					r = false;
					}
				else if(myControl.data['appProductGet|'+pid]['%attribs']['zoovy:base_price'] == '')	{
//					myControl.util.dump(" -> base price not set: "+pid);
					r = false;
					}
				else if(myControl.data['appProductGet|'+pid]['%attribs']['zoovy:grp_type'] == 'PARENT')	{
//					myControl.util.dump(" -> product is a parent: "+pid);
					r = false;
					}
//inventory mode of 1 will allow selling more than what's in stock, so skip any inv validating if == 1.
				else if(typeof zGlobals == 'object' && zGlobals.globalSettings.inv_mode != 1)	{
//if a product has no options, the inventory record looks like this:
//["appProductGet|PID"]["@inventory"].PID.inv where both instances of PID are subbed with the product id
// ex: myControl.data["appProductGet|"+PID]["@inventory"][PID].inv
// also avail is ...[PID].res (reserved)
					if(typeof myControl.data['appProductGet|'+pid]['@inventory'] === 'undefined' || typeof myControl.data['appProductGet|'+pid]['@variations'] === 'undefined')	{
						myControl.util.dump(" -> inventory ("+typeof myControl.data['appProductGet|'+pid]['@inventory']+") and/or variations ("+typeof myControl.data['appProductGet|'+pid]['@variations']+") object(s) not defined.");
						r = false;
						}
					else	{
						if(myControl.ext.store_product.util.getProductInventory(pid) <= 0)	{
							myControl.util.dump(" -> inventory not available: "+pid);
							r = false
							}
						}
					}
				return r;
				},
				


//fairly straightforward way of getting a list of csv and doing nothing with it.
//or, a followup 'ping' could be added to perform an action once this data is obtained.
//checks to make sure no blanks, undefined or null pids go through
			getProductDataForLaterUse : function(csv,Q)	{
				var r = 0; //what's returned. # of requests
//				myControl.util.dump("BEGIN store_product.util.getProductDataForLaterUse");
//				myControl.util.dump(csv);
				var L = csv.length;
				for(var i = 0; i < L; i += 1)	{
					if(myControl.util.isSet(csv[i]))	{r += myControl.ext.store_product.calls.appProductGet.init(csv[i],{},Q)}
					}
//				myControl.util.dump(" -> getProdDataForLaterUser numRequests: "+r);
				return r;
				}, //getProductDataForList

//will return 0 if no inventory is available.
//otherwise, will return the items inventory or, if variations are present, the sum of all inventoryable variations.
//basically, a simple check to see if the item has purchaseable inventory.
			getProductInventory : function(pid)	{
//				myControl.util.dump("BEGIN store_product.util.getProductInventory ["+pid+"]");
				var inv = 0;
//if variations are NOT present, inventory count is readily available.
				if($.isEmptyObject(myControl.data['appProductGet|'+pid]['@variations']) && !$.isEmptyObject(myControl.data['appProductGet|'+pid]['@inventory']))	{
					inv = myControl.data['appProductGet|'+pid]['@inventory'][pid].inv 
//					myControl.util.dump(" -> item has no variations. inv = "+inv);
					}
//if variations ARE present, inventory must be summed from each inventory-able variation.
				else	{
					for(var index in myControl.data['appProductGet|'+pid]['@inventory']) {
						inv += Number(myControl.data['appProductGet|'+pid]['@inventory'][index].inv)
						}
//					myControl.util.dump(" -> item HAS variations. inv = "+inv);
					}
				return inv;
				},

/*
P is passed in. Guess what? it's an object.
pid = a product id [REQUIRED]
templateID = template id to translate for the viewer. [OPTIONAL]. if not set, a single 500x500 image will be displayed.
int = a number between 1 and 99. [OPTIONAL] If set, it will load zoovy:prod_imageINT (prod_image3 if INT = 3) as the image in the solo image viewer.
parentID = id for parent. [OPTIONAL] template will get translated into that and then the parent will be used to create the modal. if no parent, generic id will be used AND recycled between all product.

NOTES
- this utility assumes that you have already retrieved the product data and put it into memory
- if you pass a parentID, it is your responsibility to add a title to it, if needed.
- if you pass a parentID, it is your responsibility to empty that parent, if needed.

*/
			showPicsInModal : function(P)	{
				if(P.pid)	{
					var parentID = P.parentID ? P.parentID : "image-modal";
					var imageAttr = "zoovy:prod_image";
					imageAttr += P.int ? P.int : "1";
					P.width = P.width ? P.width : 600;
					P.height = P.height ? P.height : 660;
					
					var $parent = this.handleParentForModal(parentID)

					if(!P.parentID)	{$parent.empty()} //only empty the parent if no parent was passed in. 
					if(P.templateID)	{
						$parent.append(myControl.renderFunctions.createTemplateInstance(P.templateID,"imageViewer_"+parentID));
						myControl.renderFunctions.translateTemplate(myControl.data["appProductGet|"+P.pid],"imageViewer_"+parentID);
						}
					else	{
						$parent.append(myControl.util.makeImage({"class":"imageViewerSoloImage","h":"550","w":"550","bg":"ffffff","name":myControl.data['appProductGet|'+P.pid]['%attribs'][imageAttr],"tag":1}));
						}	
					$parent.dialog({modal: true,width:P.width ,height:P.height});
					$parent.dialog('option', 'title', myControl.data["appProductGet|"+P.pid]['%attribs']['zoovy:prod_name']); //proper way to set title. otherwise doesn't update after first dialog is opened.
					$parent.dialog('open'); //here to solve an issue where the modal would only open once.
					}
				else	{
					myControl.util.dump(" -> no pid specified for image viewer.  That little tidbit is required.");
					}
				},

			
/*
P is passed in. Guess what? it's an object.
pid = a product id [REQUIRED]
template = template id to translate for the viewer. [REQUIRED]
parentID = id for parent. [OPTIONAL] template will get translated into that and then the parent will be used to create the modal. if no parent, generic id will be used AND recycled.

NOTES
- this utility will make a appProductGet cat with variations and, based on global var inventory preferences, an  inventory request.
- if you pass a parentID, it is your responsibility to add a title to it, if needed.
- if you pass a parentID, it is your responsibility to empty that parent, if needed.
*/
			prodDataInModal : function(P)	{
				if(P.pid && P.templateID)	{
//					var parentID = P.parentID ? P.parentID : "product-modal";  //### for now, parent is hard coded. only 1 modal at a time becuz of variations.
					var parentID = "product-modal"
					var $parent = this.handleParentForModal(parentID,myControl.data["appProductGet|"+P.pid]['%attribs']['zoovy:prod_name'])
					
					if(!P.parentID)	{
						myControl.util.dump(" -> parent not specified. empty contents.");
						$parent.empty()
						} //if no parent is specified, this is a 'recycled' modal window. empty any old product data.
					
					$parent.append(myControl.renderFunctions.createTemplateInstance(P.templateID,"productViewer_"+parentID));
					$parent.dialog({modal: true,width:'86%',height:$(window).height() - 100,autoOpen:false});
					$parent.dialog('open');
					
					var tagObj = {};
					
					tagObj.templateID = P.templateID;
					tagObj.parentID = "productViewer_"+parentID; //in the callback, the parent ID is the 'target id' that gets translated. hhmm. rename ???

					tagObj.callback = P.callback ? P.callback : 'translateTemplate';
					tagObj.extension = P.extension ? P.extension : ''; //translateTemplate is part of controller, not an extension
					
					myControl.ext.store_product.calls.appProductGet.init(P.pid,tagObj);
					myControl.ext.store_product.calls.appReviewsList.init(P.pid); //

//					myControl.util.dump(' -> numRequests = '+numRequests);
					myControl.model.dispatchThis();

					
//					$parent.append(myControl.renderFunctions.createTemplateInstance(P.templateID,"productViewer_"+parentID));

					}
				else	{
					myControl.util.dump(" -> pid ("+P.pid+") or templateID ("+P.templateID+") not set for viewer. both are required.");
					}
				}, //prodDataInModal

//used in prodDataInModal and imageInModal
//if a parentid is not passed in, a new id is created and added to the dom.

			handleParentForModal : function(parentID)	{
				if(!parentID)	{
					parentID = 'placeholder_'+Math.floor(Math.random()*10001)
					}
				var $parent = $('#'+parentID);
//if the parent doesn't already exist, add it to the dom.
				if($parent.length == 0)	{
					$parent = $("<div \/>").attr({"id":parentID}).appendTo(document.body);
					}
				return $parent;
				}, //handleParentForModal



//formID is uses for the success/error messaging.
//tagObj is optional and allows for custom callback to be used. the default is fairly ordinary.

			handleAddToCart : function(formID,tagObj)	{
//				alert(formID);  //should stop the submit.
//some defaulting. a bare minimum callback needs to occur. if there's a business case for doing absolutely nothing
//then create a callback that does nothing. IMHO, you should always let the user know the item was added.
//this easily allows for an override to do something more elaborate.
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
				tagObj.callback = tagObj.callback ? tagObj.callback : 'itemAddedToCart';
				tagObj.extension = tagObj.extension ? tagObj.extension : 'store_product';
				
				if (myControl.ext.store_product.calls.cartItemsAdd.init(formID,tagObj)){
					myControl.calls.refreshCart.init({},'immutable'); //piggyback an update cart so that next time 'view cart' is pushed, it's accurate.
					myControl.model.dispatchThis('immutable');
					}
				
				},
//will generate some useful review info (total number of reviews, average review, etc ) and put it into appProductGet|PID	
//data saved into appProductGet so that it can be accessed from a product databind. helpful in prodlists where only summaries are needed.
//NOTE - this function is also in store_prodlist. probably ought to merge prodlist and product, as they're sharing more and more.
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
			}	//util
		} //r object.
	return r;
	}