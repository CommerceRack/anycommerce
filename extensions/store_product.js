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
//				app.u.dump("BEGIN app.ext.store_product.calls.appProductGet");
//				app.u.dump(" -> PID: "+pid);

//datapointer must be added here because it needs to be passed into the callback. The callback could get executed before the ajax call (if in local).
//if no object is passed in, one must be created so that adding datapointer to a non existent object doesn't cause a js error
// Override datapointer, if set.
// The advantage of saving the data in memory and local storage is lost if the datapointer isn't consistent, especially for product data.
				pid = pid.toString().toUpperCase(); //if a pid is all numbers, pid.toUpperCase results in JS error.
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj["datapointer"] = "appProductGet|"+pid; 

//fetchData checks the timestamp, so no need to doublecheck it here unless there's a need to make sure it is newer than what is specified (1 day) in the fetchData function				
				if(app.model.fetchData(tagObj.datapointer) == false)	{
//					app.u.dump(" -> appProductGet not in memory or local. refresh both.");
					r += 1;
					this.dispatch(pid,tagObj,Q)
					}
				else if(typeof app.data[tagObj.datapointer]['@inventory'] == 'undefined' || typeof app.data[tagObj.datapointer]['@variations'] == 'undefined')	{
					app.u.dump(" -> either inventory or variations not in memory or local. get everything.");
//check to make sure inventory and pog info is available.
					r += 1;
					this.dispatch(pid,tagObj,Q)
					}
//if the product record is in memory BUT the inventory is zero, go get updated record in case it's back in stock.
				else if(app.ext.store_product.u.getProductInventory(pid) === 0)	{
					r += 1;
					this.dispatch(pid,tagObj,Q);
					}
				else 	{
					app.u.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(pid,tagObj,Q)	{
//initially, reviews were obtained here automatically. But now it is likely a callback will be needed or that no reviews are needed, so removed. 20120326
				var obj = {};
				obj["_cmd"] = "appProductGet";
				obj["withVariations"] = 1;
//only get inventory if it matters. inv_mode of 1 means inventory is not important.
				if(app.vars.thisSessionIsAdmin || (typeof zGlobals == 'object' && zGlobals.globalSettings.inv_mode != 1))
					obj["withInventory"] = 1;
				obj["pid"] = pid;
				obj["_tag"] = tagObj;
				app.model.addDispatchToQ(obj,Q);
				}
			}, //appProductGet




//formerly appReviewsList
		appReviewsList : {
			init : function(pid,tagObj,Q)	{
				var r = 0; //will return a 1 or a 0 based on whether the item is in local storage or not, respectively.
//app.u.dump("appReviewsList tagObj:");
//app.u.dump(tagObj);
				pid = pid.toString().toUpperCase();
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
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration. Use this for any config or dependencies that need to occur.
//the callback is auto-executed as part of the extensions loading process.
		init : {
			onSuccess : function()	{
//				app.u.dump('BEGIN app.ext.store_product.init.onSuccess ');
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN app.ext.store_product.callbacks.init.onError');
				}
			} //init




		}, //callbacks



		validate : {
			
// #####################################  NON SOG SPECIFIC code

//currently, the add to cart, validation and options pieces aren't particularly flexible.
//this is mostly due to the variations.js file not being updated (yet).
//this'll change going forward.

addToCart : function (pid,$form){
//	app.u.dump("BEGIN store_product.validate.addToCart");
//	app.u.dump(" -> pid: "+pid);
	var valid = true; //what is returned.
	if(pid && $form)	{
		//copied locally for quick reference.
		var sogJSON = app.data['appProductGet|'+pid]['@variations'],
		formJSON = $form.serializeJSON();
		
	//	app.u.dump('BEGIN validate_pogs. Formid ='+formId);
	
		if($.isEmptyObject(sogJSON))	{
//			app.u.dump('no sogs present (or empty object)'); //valid. product may not have sogs.
			}
		else if($.isEmptyObject(formJSON))	{
//			app.u.throwGMessage("In store_product.validate.addToCart, formJSON is empty.");
			} //this shouldn't be empty. if it is, likely $form not valid or on DOM.
		else	{
//			app.u.dump(" -> everything is accounted for. Start validating.");	
			$('.appMessage',$form).empty().remove(); //clear all existing errors/messages.
		
			var thisSTID = pid, //used to compose the STID for inventory lookup.
			inventorySogPrompts = '',//the prompts for sogs with inventory. used to report inventory messaging if inventory checks are performed
			errors = '', pogid, pogType;
			
//			app.u.dump(" -> formJSON: "); app.u.dump(formJSON);
			
//No work to do if there are no sogs. 
			if(sogJSON)	{
	//			app.u.dump('got into the pogs-are-present validation');
				for(var i = 0; i < sogJSON.length; i++)	{
					pogid = sogJSON[i]['id']; //the id is used multiple times so a var is created to reduce number of lookups needed.
					pogType = sogJSON[i]['type']; //the type is used multiple times so a var is created to reduce number of lookups needed.
		
					if(sogJSON[i]['optional'] == 1)	{
						//if the pog is optional, validation isn't needed.			
						}
					else if (pogType == 'attribs' || pogType == 'hidden' || pogType == 'readonly' || pogType == 'cb'){
						//these types don't require validation.
						}
		//Okay, validate what's left.
					else	{
		//If the option IS required (not set to optional) AND the option value is blank, AND the option type is not attribs (finder) record an error
						if(formJSON[pogid]){}
						else	{
							valid = false;
							errors += "<li>"+sogJSON[i]['prompt']+"<!--  id: "+pogid+" --><\/li>";
							}
		
						}
					
					//compose the STID
					if(sogJSON[i]['inv'] == 1)	{
						thisSTID += ':'+pogid+formJSON[pogid];
						inventorySogPrompts += "<li>"+sogJSON[i]['prompt']+"<\/li>";
						}
					
					}
				}
	
	
	//		app.u.dump('past validation, before inventory validation. valid = '+valid);
		
		//if errors occured, report them.
			 if(valid == false)	{
	//			app.u.dump(errors);
				var errObj = app.u.youErrObject("Uh oh! Looks like you left something out. Please make the following selection(s):<ul>"+errors+"<\/ul>",'42');
				errObj.parentID = 'JSONpogErrors_'+pid
				app.u.throwMessage(errObj);
				}
		//if all options are selected AND checkinventory is on, do inventory check.
			else if(valid == true && typeof zGlobals == 'object' && zGlobals.globalSettings.inv_mode > 1)	{
		//		alert(thisSTID);
				if(!$.isEmptyObject(app.data['appProductGet|'+pid]['@inventory']) && !$.isEmptyObject(app.data['appProductGet|'+pid]['@inventory'][thisSTID]) && app.data['appProductGet|'+pid]['@inventory'][thisSTID]['inv'] < 1)	{
					var errObj = app.u.youErrObject("We're sorry, but the combination of selections you've made is not available. Try changing one of the following:<ul>"+inventorySogPrompts+"<\/ul>",'42');
					errObj.parentID = 'JSONpogErrors_'+pid
					app.u.throwMessage(errObj);
					valid = false;
					}
		
				}
			}
		}
	else	{
		app.u.throwGMessage("in store_product.validate.addToCart, either pid ("+pid+") not set or $form was not passed.");
		valid = false;
		}
//	app.u.dump('STID = '+thisSTID);
	return valid;

	} //validate.addToCart



			
			
			}, //validate





////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





		renderFormats : {

//creates some required form inputs.
//the ID on the product_id input should NOT be changed without updating the addToCart call (which uses this id to obtain the pid).

			atcForm : function($tag,data)	{
				$tag.append("<input type='hidden' name='sku' value='"+data.value+"' />");
				},
			
			reviewList : function($tag,data)	{
//				app.u.dump("BEGIN store_product.renderFormats.reviewList");
				var templateID = data.bindData.loadsTemplate;
//				app.u.dump(data.value)
				var L = data.value.length;
				for(var i = 0; i < L; i += 1)	{
					$tag.append(app.renderFunctions.transmogrify({'id':'review_'+i},templateID,data.value[i]));
					}
				return L;
				},

			quantityDiscounts : function($tag,data)	{
//				app.u.dump("BEGIN store_product.renderFormats.quantityDiscounts");
//				app.u.dump("value: "+data.value);
				var o = ''; //what is output;
				
				var dArr = data.value.split(',');
				var tmp,num;
				var L = dArr.length;
//## operator can be either / or =  (5=125 means buy 5 @ $125ea., 5/125 means buy 5 @ $25ea.)
				for(var i = 0; i < L; i += 1)	{
					if(dArr[i].indexOf('=') > -1)	{
//						app.u.dump(' -> treat as =');
						tmp = dArr[i].split('=');
						if(tmp[1].indexOf('$') >= 0){tmp[1] = tmp[1].substring(1)} //strip $, if present
//						app.u.dump(" -> tmp[1] = "+tmp[1]);
						o += "<div>buy "+tmp[0]+"+ for "+app.u.formatMoney(Number(tmp[1]),'$','')+" each<\/div>";  //test gss COR6872
						}
					else if(dArr[i].indexOf('/') > -1)	{
//						app.u.dump(' -> treat as /');
						tmp = dArr[i].split('/');
						o += "<div>buy "+tmp[0]+"+ for ";
						if(tmp[1].indexOf('$') >= 0){tmp[1] = tmp[1].substring(1)} //strip $, if present
//						app.u.dump(" -> tmp[1] = "+tmp[1]);
						num = Number(tmp[1]) / Number(tmp[0])
//						app.u.dump(" -> number = "+num);
						o += app.u.formatMoney(num,'$','') //test spork 1000
						o += " each<\/div>";
						}
					else	{
						app.u.dump("WARNING! invalid value for qty discount. Contained neither a '/' or an '='.");
						}
					tmp = ''; //reset after each loop.
					}
				$tag.append(o);
				},

			simpleInvDisplay : function($tag,data)	{
//data.value = available inventory
//				app.u.dump("BEGIN store_product.renderFunctions.invAvail.");
				if(data.value > 0)
					$tag.addClass('instock').append("In Stock");
				else
					$tag.addClass('outofstock').append("Sold Out");
				},

//data.value should be entire product object.
			detailedInvDisplay : function($tag,data)	{
				var pid = data.value.pid;
				if(pid && data.value['@inventory'] && data.value['@inventory'][pid])	{
					$tag.append("<div>Available Inventory: "+data.value['@inventory'][pid].inv+"<\/div>");
					}
				else if(pid && data.value['@inventory'])	{
					var inventory = data.value['@inventory'],
					vlt = app.ext.store_product.u.buildVariationLookup(data.value['@variations']), //variation lookup table.
					$table = $("<table class='gridTable fullWidth marginBottom' \/>");
					$table.append("<thead><tr><th class='alignLeft'>Variation<\/th><th class='alignRight'>Inv. Available<\/th><\/tr>");
					for(var index in inventory)	{
//						var pretty = vlt[index.split(':')[1].substr[0,2]];
//						pretty += 
						$table.append("<tr><td>"+app.ext.store_product.u.inventoryID2Pretty(index,vlt)+"<\/td><\/tr>");
						}
					$table.appendTo($tag);
					$table.anytable();
					}
				else	{
					$tag.append("Unable to determine inventory count");
					}
				}, //detailedInvDisplay

//add all the necessary fields for quantity inputs.
			atcQuantityInput : function($tag,data)	{
				var $input = $("<input \/>",{'name':'qty'});
				if(app.ext.store_product.u.productIsPurchaseable(data.value.pid))	{
					$input.attr({'size':3,'min':0,'step':1,'type':'number'}).appendTo($tag);
					$input.on('keyup.classChange',function(){
						if(Number($(this).val()) > 0){$(this).addClass('qtyChanged ui-state-highlight');}
						});
					}
				else	{
					$tag.hide(); //hide tag so any pre/post text isn't displayed. 
					$input.attr({'type':'hidden'}).appendTo($tag); //add so that handleaddtocart doesn't throw error that no qty input is present
					}
//set this. because the name is shared by (potentially) a lot of inputs, the browser 'may' use the previously set value (like if you add 1 then go to another page, all the inputs will be set to 1. bad in a prodlist format)
				$input.val(data.bindData.defaultValue || 0); 
				},



// in this case, we aren't modifying an attribute of $tag, we're appending to it. a lot.
//this code requires the includes.js file.
//it loops through the products options and adds them to the fieldset (or whatever $tag is, but a fieldset is a good idea).
			atcVariations : function($tag,data)	{
//				app.u.dump("BEGIN store_product.renderFormats.atcVariations");
				var pid = data.value; 
				var formID = $tag.closest('form').attr('id'); //move up the dom tree till the parent form is found
				$tag.empty(); /* prodlist fix */
//				app.u.dump(" -> pid: "+pid);
//				app.u.dump(" -> formID: "+formID);
				
				if(app.ext.store_product.u.productIsPurchaseable(pid))	{
//					app.u.dump(" -> item is purchaseable.");
					if(!$.isEmptyObject(app.data['appProductGet|'+pid]['@variations']) && app.model.countProperties(app.data['appProductGet|'+pid]['@variations']) > 0)	{
$("<div \/>").attr('id','JSONpogErrors_'+pid).addClass('zwarn').appendTo($tag);

var $display = $("<div \/>"); //holds all the pogs and is appended to at the end.

pogs = new handlePogs(app.data['appProductGet|'+pid]['@variations'],{"formId":formID,"sku":pid});
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
//						app.u.dump(" -> @variations is empty.");
						}
					}
					
				}, //addToCartFrm



//will remove the add to cart button if the item is not purchaseable.
			addToCartButton : function($tag,data)	{
//				app.u.dump("BEGIN store_product.renderFunctions.addToCartButton");
//				app.u.dump(" -> ID before any manipulation: "+$tag.attr('id'));
				var pid = data.value;
				var pData = app.data['appProductGet|'+pid];
				if(app.ext.store_product.u.productIsPurchaseable(pid))	{
					if(pData && pData['%attribs'] && pData['%attribs']['is:preorder'])	{
						$tag.addClass('preorderButton').text('value', 'Preorder');
						}
					else	{
						$tag.addClass('addToCartButton');
						}
					$tag.show().removeClass('displayNone').removeAttr('disabled');
					}
				else	{
					$tag.hide().addClass('displayNone').before("<span class='notAvailableForPurchase'>This item is not available for purchase<\/span>"); //hide button, item is not purchaseable.
					}

//				app.u.dump(" -> ID at end: "+$tag.attr('id'));
				} //addToCartButton

			},


////////////////////////////////////   UTIL [u]    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
/*
A product is NOT purchaseable if:
it has no price. ### SANITY 0 IS a valid price. blank is not.
it is a parent
it has no inventory AND inventory matters to merchant 
*/
			productIsPurchaseable : function(pid)	{
//				app.u.dump("BEGIN store_product.u.productIsPurchaseable");
				var r = true;  //returns true if purchaseable, false if not or error.
				if(!pid)	{
					app.u.dump("ERROR! pid not passed into store_product.u.productIsPurchaseable");
					r = false;
					}
				else if(app.data['appProductGet|'+pid]['%attribs']['zoovy:base_price'] == '')	{
//					app.u.dump(" -> base price not set: "+pid);
					r = false;
					}
				else if(app.data['appProductGet|'+pid]['%attribs']['zoovy:grp_type'] == 'PARENT')	{
//					app.u.dump(" -> product is a parent: "+pid);
					r = false;
					}
//inventory mode of 1 will allow selling more than what's in stock, so skip any inv validating if == 1.
				else if(typeof zGlobals == 'object' && zGlobals.globalSettings.inv_mode != 1)	{
//if a product has no options, the inventory record looks like this:
//["appProductGet|PID"]["@inventory"].PID.inv where both instances of PID are subbed with the product id
// ex: app.data["appProductGet|"+PID]["@inventory"][PID].inv
// also avail is ...[PID].res (reserved)
					if(typeof app.data['appProductGet|'+pid]['@inventory'] === 'undefined' || typeof app.data['appProductGet|'+pid]['@variations'] === 'undefined')	{
						app.u.dump(" -> inventory ("+typeof app.data['appProductGet|'+pid]['@inventory']+") and/or variations ("+typeof app.data['appProductGet|'+pid]['@variations']+") object(s) not defined.");
						r = false;
						}
					else	{
						if(app.ext.store_product.u.getProductInventory(pid) <= 0)	{
							app.u.dump(" -> inventory not available: "+pid);
							r = false
							}
						}
					}
				return r;
				}, //productIsPurchaseable
				

//in some cases, it's handy to have a way to look up sog prompt based on id. This will return an object where the key is the sogID and the value an object of sog value/prompts. there is also a 'prompt' in the child object for what the sogID prompt is. ex: {'prompt':'Color: ','00':'blue','01':'red'}.
//does all options, not just inventory-able.
			buildVariationLookup : function(variations)	{
				var r = false; //what is returned. either false or an object
				if(variations && variations.length)	{
					r = {}; //variation lookup table.
					var L = variations.length;
					for(var i = 0; i < L; i += 1)	{
						r[variations[i].id] = {'prompt':variations[i].prompt};
						var OL = variations[i]['@options'].length;
						for(var oi = 0; oi < OL; oi += 1)	{
							r[variations[i].id][variations[i]['@options'][oi].v] = variations[i]['@options'][oi].prompt;
							}
						}
					}
				else	{
					app.u.dump("WARNING! in store_product.u.buildVariationLookup, variations was empty.");
					}
				return r;
				},

//pass variation lookup table into this. The thought there is that building the lookup table could be expensive, so better to do it once
//someplace else then, potentially a lot of times when this function is called within a loop.
			inventoryID2Pretty : function(ID,VLT)	{
				var r = ""; //set to blank or undefined will be prepended to value.
				if(ID && VLT)	{
					var splitID = ID.split(':'),
					L = splitID.length;
					for(var i = 1; i < L; i += 1)	{
//						app.u.dump(" -> splitID[i].substr(0,2): "+splitID[i].substr(0,2)); 
						r += VLT[splitID[i].substr(0,2)][splitID[i].substr(2,2)]+" ";
						}
					}
				else	{
					app.u.dump("In store_product.u.inventoryID2Pretty, ID or VLT not defined");
					r = false;
					}
				return r;
				},

//fairly straightforward way of getting a list of csv and doing nothing with it.
//or, a followup 'ping' could be added to perform an action once this data is obtained.
//checks to make sure no blanks, undefined or null pids go through
			getProductDataForLaterUse : function(csv,Q)	{
				var r = 0; //what's returned. # of requests
//				app.u.dump("BEGIN store_product.u.getProductDataForLaterUse");
//				app.u.dump(csv);
				var L = csv.length;
				for(var i = 0; i < L; i += 1)	{
					if(app.u.isSet(csv[i]))	{r += app.ext.store_product.calls.appProductGet.init(csv[i],{},Q)}
					}
//				app.u.dump(" -> getProdDataForLaterUser numRequests: "+r);
				return r;
				}, //getProductDataForList

//will return 0 if no inventory is available.
//otherwise, will return the items inventory or, if variations are present, the sum of all inventoryable variations.
//basically, a simple check to see if the item has purchaseable inventory.
			getProductInventory : function(pid)	{
//				app.u.dump("BEGIN store_product.u.getProductInventory ["+pid+"]");
				var inv = false;
//if variations are NOT present, inventory count is readily available.
				if(app.data['appProductGet|'+pid])	{
					if((app.data['appProductGet|'+pid]['@variations'] && $.isEmptyObject(app.data['appProductGet|'+pid]['@variations'])) && !$.isEmptyObject(app.data['appProductGet|'+pid]['@inventory']))	{
						inv = Number(app.data['appProductGet|'+pid]['@inventory'][pid].AVAILABLE);
	//					app.u.dump(" -> item has no variations. inv = "+inv);
						}
	//if variations ARE present, inventory must be summed from each inventory-able variation.
					else	{
						for(var index in app.data['appProductGet|'+pid]['@inventory']) {
							inv += Number(app.data['appProductGet|'+pid]['@inventory'][index].AVAILABLE)
							}
	//					app.u.dump(" -> item HAS variations. inv = "+inv);
						}
					}
				else	{} //cant get inventory without a product record.
				return inv;
				}, //getProductInventory

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
					
					var $parent = $(app.u.jqSelector('#',parentID));
//parent may not exist. empty if it does, otherwise create it.
					if($parent.length)	{$parent.empty()}
					else	{$parent = $("<div \/>").attr({"id":parentID,"title":"Product Images"}).appendTo('body');}

					if(P.templateID)	{
						$parent.append(app.renderFunctions.createTemplateInstance(P.templateID,"imageViewer_"+parentID));
						app.renderFunctions.translateTemplate(app.data["appProductGet|"+P.pid],"imageViewer_"+parentID);
						}
					else	{
						$parent.append(app.u.makeImage({"class":"imageViewerSoloImage","h":"550","w":"550","bg":"ffffff","name":app.data['appProductGet|'+P.pid]['%attribs'][imageAttr],"tag":1}));
						}	
					$parent.dialog({modal: true,width:P.width ,height:P.height});
					$parent.dialog('option', 'title', app.data["appProductGet|"+P.pid]['%attribs']['zoovy:prod_name']); //proper way to set title. otherwise doesn't update after first dialog is opened.
					$parent.dialog('open'); //here to solve an issue where the modal would only open once.
					}
				else	{
					app.u.dump(" -> no pid specified for image viewer.  That little tidbit is required.");
					}
				}, //showPicsInModal

			
/*
P is passed in. Guess what? it's an object.
pid = a product id [REQUIRED]
templateID = template id to translate for the viewer. [REQUIRED]
parentID = id for parent. [OPTIONAL] template will get translated into that and then the parent will be used to create the modal. if no parent, generic id will be used AND recycled.

NOTES
- this utility will make a appProductGet cat with variations and, based on global var inventory preferences, an  inventory request.
- if you pass a parentID, it is your responsibility to add a title to it, if needed.
- if you pass a parentID, it is your responsibility to empty that parent, if needed.
*/
			prodDataInModal : function(P)	{
				if(P.pid && P.templateID)	{
					var $parent = $("#product-modal");
					
//parent may not exist. empty if it does, otherwise create it.
					if($parent.length)	{$parent.empty()}
					else	{
						$parent = $("<div \/>").attr({"id":'product-modal',"title":""}).appendTo('body');
						$parent.dialog({modal: true,width:'86%',height:$(window).height() - 100,autoOpen:false});
						}
					
					
					$parent.dialog('open').append(app.renderFunctions.createTemplateInstance(P.templateID,P));

					app.ext.store_product.calls.appProductGet.init(P.pid,{'callback': function(rd){
						if(app.model.responseHasErrors(rd)){
							$parent.anymessage({'message':rd});
							}
						else	{
							$parent.dialog( "option", "title", app.data["appProductGet|"+P.pid]['%attribs']['zoovy:prod_name'] );
							$parent.anycontent({'templateID':P.templateID,'translateOnly':true,'datapointer':"appProductGet|"+P.pid});
							}
						}});
					app.ext.store_product.calls.appReviewsList.init(P.pid); //
					app.model.dispatchThis();
					app.u.handleCommonPlugins($parent);
					}
				else	{
					app.u.dump(" -> pid ("+P.pid+") or templateID ("+P.templateID+") not set for viewer. both are required.");
					}
				return P;
				}, //prodDataInModal


			showProductDataIn : function(targetID,P)	{
				if(targetID && P && P.pid && P.templateID)	{
					var $target = $(app.u.jqSelector('#',targetID));
					if($target.length)	{
						app.u.dump("");
//make sure the ID is unique in case this function is used to add product to dom twice (in different locations)
						P.id = 'prodView_'+P.pid+'_'+app.u.guidGenerator().substring(0,10);
						$target.append(app.renderFunctions.createTemplateInstance(P.templateID,P));
						P.callback = P.callback || 'translateTemplate'; //translateTemplate is part of controller, not an extension
						P.extension = P.extension || ''; //translateTemplate is part of controller, not an extension
						P.parentID = targetID;
						app.ext.store_product.calls.appProductGet.init(P.pid,P);
						app.ext.store_product.calls.appReviewsList.init(P.pid);
						app.model.dispatchThis();
						}
					else	{
						app.u.throwGMessage("In store_product.u.showProductDataIn, $('#"+targetID+"') does not exist on the DOM");
						}
					}
				else	{
					app.u.throwGMessage("In store_product.u.showProductDatIn, targetID ["+targetID+"] not set or required params (pid,templateID) not set. see console for params obj.");
					app.u.dump(P);
					}
				}, //showProductDataIn

			buildCartItemAppendObj : function($form)	{
				var obj = false; //what is returned. either the obj or false.
				if($form && $form.is('form'))	{
					var $qtyInput = $("input[name='qty']",$form),
					sku = $("input[name='sku']",$form).val();

					if(sku && $qtyInput.val() >= 1)	{
						obj = $form.serializeJSON();
						app.u.dump(" -> buildCartItemAppendObj into sku/qtyInput section");
//here for the admin side of things. Will have no impact on retail as price can't be set.
//should always occur, validating or not.
						if(obj.price == "")	{delete obj.price; app.u.dump("Deleting price");}
						else{}

//There are use cases for skipping validation, such as admin, quick order, etc.
						if($form.data('skipvalidation') || app.ext.store_product.validate.addToCart(sku,$form))	{
							
							obj['%variations'] = {};
	
							for(var index in obj)	{
	//							app.u.dump(" -> index: "+index);
	//move variations into the %variaitons object. this isn't 100% reliable, but there isn't much likelyhood of non-variations 2 character inputs that are all uppercase.
	//pids must be longer and qty (the other supported input) won't conflict.
								if(index.length == 2 && index.toUpperCase() == index)	{
									obj['%variations'][index] = obj[index];
									delete obj[index];
									}
								}

							}
						else	{
// ** 201318 returning false will prevent the addItemToCart from dispatching calls
							obj = false;
							//the validation itself will display the errors.
							}
						}
					else	{
// ** 201318 returning false will prevent the addItemToCart from dispatching calls
						obj = false;
						$form.anymessage({'message':'The form for store_product.u.handleAddToCart was either missing a sku ['+sku+'] or qty input ['+$qtyInput.length+'].','gMessage':true});
						}
		
					}
				else	{
// ** 201318 returning false will prevent the addItemToCart from dispatching calls
					obj = false;
					$('#globalMessaging').anymessage({'message':'In store_product.u.buildCartItemAppendObj, $form not passed.','gMessage':true});
					}
				return obj;
				}, //buildCartItemAppendObj

//a no frills add to cart. returns false unless a dispatch occurs, then true.
			handleAddToCart : function($form,_tag)	{
				var r = false; //what is returned. True if a dispatch occurs.
				app.u.dump("BEGIN store_product.u.handleAddToCart");
				if($form && $form.length && $form.is('form'))	{
					var cartObj = app.ext.store_product.u.buildCartItemAppendObj($form);
					if(cartObj)	{
//						app.u.dump(" -> have a valid cart object"); app.u.dump(cartObj);
						if(cartObj)	{
							r = true;
							app.calls.cartItemAppend.init(cartObj,_tag || {},'immutable');
							app.model.dispatchThis('immutable');
							}
						}
					else	{
						app.u.dump(" -> cart object is not valid");
						} //do nothing, the validation handles displaying the errors.
					}
				else	{
					$('#globalMessaging').anymessage({'message':"In store_product.u.handleAddToCart, $form ["+typeof $form+"] not set, has no length ["+$form.length+"] or is not a form ["+$form.is('form')+"].",'gMessage':true});
					}
				return r;
				}, //handleAddToCart


//$FP should be a form's parent element. Can contain 1 or several forms.
			handleBulkAddToCart : function($FP,_tag)	{
				app.u.dump("BEGIN store_product.u.handleBulkAddToCart");
				if(typeof $FP == 'object')	{
					var $forms = $('form',$FP);
					app.u.dump(" -> $forms.length: "+$forms.length);
					_tag = _tag || {};
					if($forms.length)	{
						$forms.each(function(){

							var cartObj = app.ext.store_product.u.buildCartItemAppendObj($(this)); //handles error display.
							if(cartObj)	{
								app.calls.cartItemAppend.init(cartObj,_tag,'immutable');
								}
							});
						app.model.dispatchThis('immutable');
						}
					else	{
						$('#globalMessaging').anymessage({'message':'handleAddToCart requires $FP to contain at least 1 form.','gMessage':true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'handleAddToCart received an unknown type for $FP ['+typeof $FP+'] (should be object)','gMessage':true});
					}
				}, //handleBulkAddToCart

//will generate some useful review info (total number of reviews, average review, etc ) and put it into appProductGet|PID	
//data saved into appProductGet so that it can be accessed from a product databind. helpful in prodlists where only summaries are needed.
//NOTE - this function is also in store_prodlist. probably ought to merge prodlist and product, as they're sharing more and more.
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
			}	//util
		} //r object.
	return r;
	}