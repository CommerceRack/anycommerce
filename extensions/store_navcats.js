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


var store_navcats = function() {
	var r = {
	vars : {},

					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		


//calls return a 0 if a request is made and a 1 if data is already local.
	calls : {
//formerly categoryTree
		appCategoryList : {
			init : function(tagObj,Q)	{
//				myControl.util.dump("BEGIN store_navcats.calls.appCategoryList.init");
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				if(myControl.model.fetchData('appCategoryList') == false)	{
					r = 1;
					this.dispatch(tagObj,Q);
					}
				else 	{
					myControl.util.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(tagObj,Q)	{
				obj = {};
				obj['_cmd'] = "appCategoryList";
				obj['_tag'] = typeof tagObj == 'object' ? tagObj : {};
				obj['_tag'].datapointer = 'appCategoryList'; //for now, override datapointer for consistency's sake.
//if no extension is set, use this one. need to b able to override so that a callback from outside the extension can be added.
				obj['_tag'].extension = obj['_tag'].extension ? obj['_tag'].extension : 'store_navcats'; 
				myControl.model.addDispatchToQ(obj,Q);
				}
			}, //appCategoryList

/*
a typical 'fetchData' is done for a quick determination on whether or not ANY data for the category is local.
if not, we're obviously missing what's needed.  If some data is local, check for the presence of the attributes
requested and if even one isn't present, get all.
datapointer needs to be defined early in the process so that it can be used in the handlecallback, which happens in INIT.
*/
		appPageGet : {
			init : function(obj,tagObj,Q)	{
				obj['_tag'] = typeof tagObj == 'object' ? tagObj : {};
				obj['_tag'].datapointer = 'appPageGet|'+obj.PATH;  //no local storage of this. ### need to explore solutions.
				var r = 0;
				var hasAllLocal = true;
				if(myControl.model.fetchData('appPageGet|'+obj.PATH) == false)	{
					hasAllLocal = false;
					}
				else	{
					var L = obj['@get'].length;
					for(var i = 0; i < L; i += 1)	{
						if(!myControl.data['appPageGet|'+obj.PATH]['%page'][obj['@get'][i]])	{
							hasAllLocal = false;
							break; //once we know 1 piece of data is missing, just get all of it.
							}
						}
					}
				if(hasAllLocal)	{
					myControl.util.handleCallback(tagObj);
					}
				else	{
					this.dispatch(obj,tagObj,Q);
					r = 1;
					}
				return r;
				},
			dispatch : function(obj,tagObj,Q)	{
				obj['_cmd'] = "appPageGet";

				myControl.model.addDispatchToQ(obj,Q);
				}
			}, //appPageGet
//formerly categoryDetail
		appCategoryDetail : {
			init : function(catSafeID,tagObj,Q)	{
//			myControl.util.dump('BEGIN myControl.ext.store_navcats.calls.appCategoryDetail.init ('+catSafeID+')');
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
//whether max, more or just detail, always save to same loc.
//add here so if tagObj is passed directly into callback because data is in localStorage, the datapointer is set.
				tagObj.datapointer = 'appCategoryDetail|'+catSafeID;

//uncomment these lines to force a dispatch. (for testing)
//				this.dispatch(catSafeID,tagObj,Q); 
//				return true; 				
				
				
				if(myControl.model.fetchData(tagObj.datapointer) == false)	{
					r += 1;
					this.dispatch(catSafeID,tagObj,Q);
					}
				else 	{
//					myControl.util.dump(' -> using local');
					myControl.util.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(catSafeID,tagObj,Q)	{
//				myControl.util.dump('BEGIN myControl.ext.store_navcats.calls.appCategoryDetail.dispatch');
				var catSafeID;
//				myControl.util.dump(' -> safeid = '+catSafeID);
//				myControl.util.dump(' -> executing dispatch.');
				myControl.model.addDispatchToQ({"_cmd":"appCategoryDetail","safe":catSafeID,"detail":"fast","_tag" : tagObj},Q);	
				}
			},//appCategoryDetail

		appCategoryDetailMore : {
			init : function(catSafeID,tagObj,Q)	{
//				myControl.util.dump('BEGIN myControl.ext.store_navcats.calls.appCategoryDetailMore.init');
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
				tagObj.datapointer = 'appCategoryDetail|'+catSafeID;
				if(myControl.model.fetchData(tagObj.datapointer) == false)	{
//nothing is local. go get it.
					this.dispatch(catSafeID,tagObj,Q);
					r += 1;
					}
				else	{
//something is in local. if max or more, use it.
					if(myControl.data[tagObj.datapointer].detail == 'max'  || myControl.data[tagObj.datapointer].detail == 'more')	{
						myControl.util.handleCallback(tagObj)
						}
					else 	{
//local is probably from a 'fast' request. go get more.
						this.dispatch(catSafeID,tagObj,Q);
						r += 1;
						}
					}
				return r;
				},
			dispatch : function(catSafeID,tagObj,Q)	{
				var catSafeID;
				tagObj.datapointer = 'appCategoryDetail|'+catSafeID; //whether max, more or just detail, always save to same loc.
				tagObj.detail = 'more'; //if detail is in tabObj, model will add it to data object.
				myControl.model.addDispatchToQ({"_cmd":"appCategoryDetail","safe":catSafeID,"detail":"more","_tag" : tagObj},Q);	
				}
			},//appCategoryDetailMore




		appCategoryDetailMax : {
			init : function(catSafeID,tagObj,Q)	{
//				myControl.util.dump('BEGIN myControl.ext.store_navcats.calls.appCategoryDetailMax.init');
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
//whether max, more or just detail, always save to same loc.
//add here so if tagObj is passed directly into callback because data is in localStorage, the datapointer is set.
				tagObj.datapointer = 'appCategoryDetail|'+catSafeID;
//				myControl.util.dump(' -> datapointer = '+tagObj.datapointer);
				
				if(myControl.model.fetchData(tagObj.datapointer) == false)	{
//					myControl.util.dump(' -> data is not local. go get it.');
					r += 1;
					this.dispatch(catSafeID,tagObj,Q);
					}
				else	{
					if(myControl.data[tagObj.datapointer].detail == 'max')	{
						myControl.util.handleCallback(tagObj);
						}
					else 	{
						r += 1;
						this.dispatch(catSafeID,tagObj,Q);
						}
					}
				return r;
				},
			dispatch : function(catSafeID,tagObj,Q)	{
//				myControl.util.dump(' -> safeid = '+catSafeID);
//				myControl.util.dump(' -> executing dispatch.');
				tagObj.detail = 'max';
				myControl.model.addDispatchToQ({"_cmd":"appCategoryDetail","safe":catSafeID,"detail":"max","_tag" : tagObj},Q);	
				}
			}//appCategoryDetailMax

		}, //calls









					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\









	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
		init : {
			onSuccess : function()	{
//				myControl.util.dump('BEGIN myControl.ext.store_navcats.init.onSuccess ');
				return true;  //currently, no system or config requirements to use this extension
//				myControl.util.dump('END myControl.ext.store_navcats.init.onSuccess');
				},
			onError : function()	{
				myControl.util.dump('BEGIN myControl.ext.store_navcats.callbacks.init.onError');
				}
			},

		getRootCatsData : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN myControl.ext.store_navcats.callbacks.handleProduct.onSuccess");
				myControl.ext.store_navcats.util.getRootCatsData(tagObj);
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},
/*
cats that start with a ! in the 'pretty' name are 'hidden'.  However, the pretty name isn't available until appCategoryDetail is request.
appCategoryDetail is requested AFTER a DOM element is already created for each category in the specified tree.  This is necessary because some data is loaded from local storage (fast)
and some has to be requested (not as fast). To maintain the correct order, the DOM element is added, then populated as info becomes available.
in this case, the DOM element may not be necessary, and in those cases (hidden cat), it is removed.

params in addition to standard tagObj (datapointer, callback, etc).

templateID - the template id used (from myControl.templates)
*/
		addCatToDom : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN myControl.ext.store_navcats.callbacks.addCatToDom.onSuccess");
//				myControl.util.dump(" -> datapointer = "+tagObj.datapointer);
//				myControl.util.dump(" -> add data to template: "+tagObj.parentID+"_"+tagObj.datapointer.split('|')[1]);
//yes, actually have to make sure .pretty exists. no shit. this happeneed. errored cuz pretty wasn't set.
				if(myControl.data[tagObj.datapointer].pretty && myControl.data[tagObj.datapointer].pretty.charAt(0) !== '!')	{
					myControl.renderFunctions.translateTemplate(myControl.data[tagObj.datapointer],tagObj.parentID+"_"+tagObj.datapointer.split('|')[1]);
					}
				else	{
//					myControl.util.dump(" -> cat '"+myControl.data[tagObj.datapointer].pretty+"' is hidden. nuke it!");
					$('#'+myControl.util.makeSafeHTMLId(tagObj.parentID+"_"+tagObj.datapointer.split('|')[1])).empty().remove();
					}
				},
			onError : function(d)	{
				$('#globalMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}
		}, //callbacks







////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





		renderFormats : {


/*
$tag.append(myControl.renderFunctions.createTemplateInstance('categoryTemplate',{"id":"bob_"+$tag.attr('id')+"_"+catSafeID,"catsafeid":catSafeID}));
myControl.renderFunctions.translateTemplate(myControl.data['appCategoryDetail|'+data.bindData.cleanValue]['@subcategoryDetail'][i],"bob_"+$tag.attr('id')+"_"+catSafeID);
*/
			},


////////////////////////////////////   UTIL    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		util : {
/*
In cases where the root categories are needed, this function will return them from the appCategoryList dataset.
function assumes appCategoryList already exists in memory.
will return an object of id:safeid, which is how the categories are stored in a appCategoryDetail.
the formatted is specific so that getChildDataOf can be used for a specific id or '.' so don't change the output without testing it in that function.
*/
			getRootCats : function()	{
//				myControl.util.dump('BEGIN myControl.ext.store_navcats.util.getRootCats');
				var L = myControl.data.appCategoryList['@paths'].length;
				var r = new Array();
//				myControl.util.dump(' -> num cats = '+L);
				for(var i = 0; i < L; i += 1)	{
					if(myControl.data.appCategoryList['@paths'][i].split('.').length == 2)	{
						r.push({"id":myControl.data.appCategoryList['@paths'][i]});
						}
					}
				return r;
				}, //getRootCatsData


/*
a function for obtaining information about a categories children.
assumes you have already retrieved data on parent so that @subcategories is present.
 -> catSafeID should be the category safe id that you want to obtain information for.
 -> call, in all likelyhood, will be set to one of the following:  appCategoryDetailMax, appCategoryDetailMore, appCategoryDetailFast.  It'll default to Fast.
tagObj is optional and would contain the standard params that can be set in the _tag param (callback, templateID, etc).
if the parentID and templateID are passed as part of tagObj, a template instance is created within parentID.
This function just creates the calls.  Dispatch on your own.
*/
			getChildDataOf : function(catSafeID,tagObj,call){
				var numRequests = 0; //will get incremented once for each request that needs dispatching.
//				myControl.util.dump("BEGIN myControl.ext.store_navcats.util.getChildDataOf ("+catSafeID+")");
//				myControl.util.dump(myControl.data['appCategoryDetail|'+catSafeID])
//if . is passed as catSafeID, then tier1 cats are desired. The list needs to be generated.
				var catsArray = [];
				
				if(catSafeID == '.')
					catsArray = this.getRootCats();
				else if(typeof myControl.data['appCategoryDetail|'+catSafeID]['@subcategoryDetail'] == 'object')
					catsArray = myControl.data['appCategoryDetail|'+catSafeID]['@subcategoryDetail'];
				else	{
					//most likely, category doesn't have subcats.
					}
				var L = catsArray.length;
				var call = call ? call : "categoryDetailFast"
//				myControl.util.dump(" -> catSafeID = "+catSafeID);
//				myControl.util.dump(" -> call = "+call);
//				myControl.util.dump(" -> # subcats = "+L);
 //used in the for loop below to determine whether or not to render a template. use this instead of checking the two vars (templateID and parentID)
				renderTemplate = false;
				if(tagObj.templateID && tagObj.parentID)	{
					var $parent = $('#'+tagObj.parentID);
					var renderTemplate = true;
					}
	
				for(var i = 0; i < L; i += 1)	{
					if(renderTemplate)	{
//homepage is skipped. at this point we're dealing with subcat data and don't want 'homepage' to display among them
						if(catsArray[i].id != '.')	{
							$parent.append(myControl.renderFunctions.createTemplateInstance(tagObj.templateID,{"id":tagObj.parentID+"_"+catsArray[i].id,"catsafeid":catsArray[i].id}));
							}
						}
//if tagObj was passed in without .extend, the datapointer would end up being shared across all calls.
//I would have though that manipulating tagObj within another function would be local to that function. apparently not.
					numRequests += myControl.ext.store_navcats.calls[call].init(catsArray[i].id,$.extend({},tagObj));
					}
//				myControl.util.dump(' -> num requests: '+numRequests);
				return numRequests;
				} //getChildDataOf
			}


		
		} //r object.
	return r;
	}