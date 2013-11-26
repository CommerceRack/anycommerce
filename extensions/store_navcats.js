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
			init : function(root,tagObj,Q)	{
//				app.u.dump("BEGIN store_navcats.calls.appCategoryList.init");
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				if(app.model.fetchData('appCategoryList') == false)	{
					r = 1;
					this.dispatch(root,tagObj,Q);
					}
				else 	{
					app.u.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(root,tagObj,Q)	{
				var obj = {};
				obj['_cmd'] = "appCategoryList";
				obj.root = root;
				obj['_tag'] = typeof tagObj == 'object' ? tagObj : {};
				obj['_tag'].datapointer = 'appCategoryList'; //for now, override datapointer for consistency's sake.
//if no extension is set, use this one. need to b able to override so that a callback from outside the extension can be added.
				obj['_tag'].extension = obj['_tag'].extension ? obj['_tag'].extension : 'store_navcats'; 
				app.model.addDispatchToQ(obj,Q);
				}
			}, //appCategoryList

/*
a typical 'fetchData' is done for a quick determination on whether or not ANY data for the category is local.
if not, we're obviously missing what's needed.  If some data is local, check for the presence of the attributes
requested and if even one isn't present, get all.
datapointer needs to be defined early in the process so that it can be used in the handlecallback, which happens in INIT.
obj.PATH = .cat.safe.id
*/
		appPageGet : {
			init : function(obj,tagObj,Q)	{
//				app.u.dump("BEGIN store_navcats.calls.appPageGet.init");
//				app.u.dump(" -> @get: "); app.u.dump(obj['@get']);
				obj['_tag'] = typeof tagObj == 'object' ? tagObj : {};
				obj['_tag'].datapointer = 'appPageGet|'+obj.PATH;  //no local storage of this. ### need to explore solutions.
				var r = 0;
				var hasAllLocal = true;
				if(app.model.fetchData('appPageGet|'+obj.PATH) == false)	{
					hasAllLocal = false;
					}
				else if(app.data['appPageGet|'+obj.PATH] && app.data['appPageGet|'+obj.PATH]['%page'])	{
					var L = obj['@get'].length;
					for(var i = 0; i < L; i += 1)	{
						if(!app.data['appPageGet|'+obj.PATH]['%page'][obj['@get'][i]])	{
							hasAllLocal = false;
							break; //once we know 1 piece of data is missing, just get all of it.
							}
						}					
					}
				else	{
					hasAllLocal = false;
					}
				if(hasAllLocal)	{
					app.u.handleCallback(tagObj);
					}
				else	{
					this.dispatch(obj,tagObj,Q);
					r = 1;
					}
				return r;
				},
			dispatch : function(obj,tagObj,Q)	{
				obj['_cmd'] = "appPageGet";
				app.model.addDispatchToQ(obj,Q);
				}
			}, //appPageGet
//formerly categoryDetail
		appNavcatDetail : {
			init : function(catSafeID,tagObj,Q)	{
				Q = Q || 'mutable';
//			app.u.dump('BEGIN app.ext.store_navcats.calls.appNavcatDetail.init ('+catSafeID+')');
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
//whether max, more or just detail, always save to same loc.
//add here so if tagObj is passed directly into callback because data is in localStorage, the datapointer is set.
				tagObj.datapointer = 'appNavcatDetail|'+catSafeID;
				if(app.model.fetchData(tagObj.datapointer) == false)	{
					r += 1;
					this.dispatch(catSafeID,tagObj,Q);
					}
				else 	{
//					app.u.dump(' -> using local');
					app.u.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(catSafeID,tagObj,Q)	{
//				app.u.dump('BEGIN app.ext.store_navcats.calls.appNavcatDetail.dispatch');
				var catSafeID;
				app.model.addDispatchToQ({"_cmd":"appNavcatDetail","safe":catSafeID,"detail":"fast","_tag" : tagObj},Q);	
				}
			},//appNavcatDetail

		appNavcatDetail : {
			init : function(path,tagObj,Q)	{
				app.u.dump('BEGIN app.ext.store_navcats.calls.appNavcatDetail.init ('+path+')');
				Q = Q || 'mutable';
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
//whether max, more or just detail, always save to same loc.
//add here so if tagObj is passed directly into callback because data is in localStorage, the datapointer is set.
				tagObj.datapointer = 'appNavcatDetail|'+path;
				if(app.model.fetchData(tagObj.datapointer) == false)	{
					r += 1;
					this.dispatch(path,tagObj,Q);
					}
				else {
		// app.u.dump(' -> using local');
					app.u.handleCallback(tagObj)
					}
				return r;
				},
			dispatch : function(path,tagObj,Q)	{
		// app.u.dump('BEGIN app.ext.store_navcats.calls.appNavcatDetail.dispatch');
				var path;
				app.model.addDispatchToQ({"_cmd":"appNavcatDetail","path":path, "detail":"fast","_tag" : tagObj},Q);	
				}
			},//appNavcatDetail
			
		appNavcatDetailMore : {
			init : function(catSafeID,tagObj,Q)	{
				Q = Q || 'mutable';
//				app.u.dump('BEGIN app.ext.store_navcats.calls.appNavcatDetailMore.init');
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
				tagObj.datapointer = 'appNavcatDetail|'+catSafeID;
				if(app.model.fetchData(tagObj.datapointer) == false)	{
//nothing is local. go get it.
					this.dispatch(catSafeID,tagObj,Q);
					r += 1;
					}
				else	{
//something is in local. if max or more, use it.
					if(app.data[tagObj.datapointer].detail == 'max'  || app.data[tagObj.datapointer].detail == 'more')	{
						app.u.handleCallback(tagObj)
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
				tagObj.datapointer = 'appNavcatDetail|'+catSafeID; //whether max, more or just detail, always save to same loc.
				tagObj.detail = 'more'; //if detail is in tabObj, model will add it to data object.
				app.model.addDispatchToQ({"_cmd":"appNavcatDetail","safe":catSafeID,"detail":"more","_tag" : tagObj},Q);	
				}
			},//appNavcatDetailMore

		appNavcatDetailMore : {
			init : function(catSafeID,tagObj,Q)	{
				Q = Q || 'mutable';
//				app.u.dump('BEGIN app.ext.store_navcats.calls.appNavcatDetailMore.init');
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
				tagObj.datapointer = 'appNavcatDetail|'+catSafeID;
				if(app.model.fetchData(tagObj.datapointer) == false)	{
//nothing is local. go get it.
					this.dispatch(catSafeID,tagObj,Q);
					r += 1;
					}
				else	{
//something is in local. if max or more, use it.
					if(app.data[tagObj.datapointer].detail == 'max'  || app.data[tagObj.datapointer].detail == 'more')	{
						app.u.handleCallback(tagObj)
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
				tagObj.datapointer = 'appNavcatDetail|'+catSafeID; //whether max, more or just detail, always save to same loc.
				tagObj.detail = 'more'; //if detail is in tabObj, model will add it to data object.
				app.model.addDispatchToQ({"_cmd":"appNavcatDetail","path":catSafeID,"detail":"more","_tag" : tagObj},Q);	
				}
			},//appNavcatDetailMore

		appNavcatDetailMax : {
			init : function(catSafeID,tagObj,Q)	{
				Q = Q || 'mutable';
//				app.u.dump('BEGIN app.ext.store_navcats.calls.appNavcatDetailMax.init');
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
//whether max, more or just detail, always save to same loc.
//add here so if tagObj is passed directly into callback because data is in localStorage, the datapointer is set.
				tagObj.datapointer = 'appNavcatDetail|'+catSafeID;
//				app.u.dump(' -> datapointer = '+tagObj.datapointer);
				
				if(app.model.fetchData(tagObj.datapointer) == false)	{
//					app.u.dump(' -> data is not local. go get it.');
					r += 1;
					this.dispatch(catSafeID,tagObj,Q);
					}
				else	{
					if(app.data[tagObj.datapointer].detail == 'max')	{
						app.u.handleCallback(tagObj);
						}
					else 	{
						r += 1;
						this.dispatch(catSafeID,tagObj,Q);
						}
					}
				return r;
				},
			dispatch : function(catSafeID,tagObj,Q)	{
//				app.u.dump(' -> safeid = '+catSafeID);
//				app.u.dump(' -> executing dispatch.');
				tagObj.detail = 'max';
				app.model.addDispatchToQ({"_cmd":"appNavcatDetail","safe":catSafeID,"detail":"max","_tag" : tagObj},Q);	
				}
			},//appNavcatDetailMax

		appNavcatDetailMax : {
			init : function(catSafeID,tagObj,Q)	{
				Q = Q || 'mutable';
//				app.u.dump('BEGIN app.ext.store_navcats.calls.appNavcatDetailMax.init');
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
//whether max, more or just detail, always save to same loc.
//add here so if tagObj is passed directly into callback because data is in localStorage, the datapointer is set.
				tagObj.datapointer = 'appNavcatDetail|'+catSafeID;
//				app.u.dump(' -> datapointer = '+tagObj.datapointer);
				
				if(app.model.fetchData(tagObj.datapointer) == false)	{
//					app.u.dump(' -> data is not local. go get it.');
					r += 1;
					this.dispatch(catSafeID,tagObj,Q);
					}
				else	{
					if(app.data[tagObj.datapointer].detail == 'max')	{
						app.u.handleCallback(tagObj);
						}
					else 	{
						r += 1;
						this.dispatch(catSafeID,tagObj,Q);
						}
					}
				return r;
				},
			dispatch : function(catSafeID,tagObj,Q)	{
//				app.u.dump(' -> safeid = '+catSafeID);
//				app.u.dump(' -> executing dispatch.');
				tagObj.detail = 'max';
				app.model.addDispatchToQ({"_cmd":"appNavcatDetail","path":catSafeID,"detail":"max","_tag" : tagObj},Q);	
				}
			}//appNavcatDetailMax



		}, //calls









					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\









	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
		init : {
			onSuccess : function()	{
//				app.u.dump('BEGIN app.ext.store_navcats.init.onSuccess ');
				return true;  //currently, no system or config requirements to use this extension
//				app.u.dump('END app.ext.store_navcats.init.onSuccess');
				},
			onError : function()	{
				app.u.dump('BEGIN app.ext.store_navcats.callbacks.init.onError');
				}
			},

		getRootCatsData : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN app.ext.store_navcats.callbacks.handleProduct.onSuccess");
				app.ext.store_navcats.u.getRootCatsData(tagObj);
				}
			},
/*
cats that start with a ! in the 'pretty' name are 'hidden'.  However, the pretty name isn't available until appNavcatDetail is request.
appNavcatDetail is requested AFTER a DOM element is already created for each category in the specified tree.  This is necessary because some data is loaded from local storage (fast)
and some has to be requested (not as fast). To maintain the correct order, the DOM element is added, then populated as info becomes available.
in this case, the DOM element may not be necessary, and in those cases (hidden cat), it is removed.

params in addition to standard tagObj (datapointer, callback, etc).

templateID - the template id used (from app.templates)
*/
		addCatToDom : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN app.ext.store_navcats.callbacks.addCatToDom.onSuccess");
//				app.u.dump(" -> datapointer = "+tagObj.datapointer);
//				app.u.dump(" -> add data to template: "+tagObj.parentID+"_"+tagObj.datapointer.split('|')[1]);
//yes, actually have to make sure .pretty exists. no shit. this happeneed. errored cuz pretty wasn't set.
				if(app.data[tagObj.datapointer].pretty && app.data[tagObj.datapointer].pretty.charAt(0) !== '!')	{
//					app.u.dump("store_navcats.callback.addCatToDom.onsuccess - Category ("+tagObj.datapointer+") is hidden.");
					app.renderFunctions.translateTemplate(app.data[tagObj.datapointer],tagObj.parentID+"_"+tagObj.datapointer.split('|')[1]);
					}
				else	{
//					app.u.dump(" -> cat '"+app.data[tagObj.datapointer].pretty+"' is hidden. nuke it!");
					$('#'+app.u.makeSafeHTMLId(tagObj.parentID+"_"+tagObj.datapointer.split('|')[1])).empty().remove();
					}
				}
			},


//to display a category w/ thumbnails, first the parent category obj is fetched (appNavcatDetail...) and this would be the callback.
//it will get the detail of all the children, including 'meta' which has the thumbnail. It'll absorb the tag properties set in the inital request (parent, template) but
// override the callback, which will be set to simply display the category in the DOM. getChildDataOf handles creating the template instance as long as parentID and templateID are set.
		getChildData : {
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN app.ext.myRIA.callbacks.getChildData.onSuccess');
				var catSafeID = tagObj.datapointer.split('|')[1];
//				app.u.dump(" -> catsafeid: "+catSafeID);
				tagObj.callback = 'addCatToDom'; //the tagObj will have 
				app.ext.store_navcats.u.getChildDataOf(catSafeID,tagObj,'appNavcatDetail');  //generate nav for 'browse'. doing a 'max' because the page will use that anway.
				app.model.dispatchThis();
				}
			} //getChildData


		}, //callbacks







////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





		renderFormats : {


			numSubcats : function($tag,data){
//					app.u.dump('BEGIN store_navcats.renderFormats.numSubcats');
					$tag.append(data.value.length);
				}, //numSubcats

			numProduct : function($tag,data){
//					app.u.dump('BEGIN store_navcats.renderFormats.numProduct');
					$tag.append(data.value.length);
				}, //numSubcats


			categoryList : function($tag,data)	{
//				app.u.dump("BEGIN store_navcats.renderFormats.categoryList");
				if(typeof data.value == 'object' && data.value.length > 0)	{
					var L = data.value.length;
					var call = 'appNavcatDetail';
					var numRequests = 0;
//The process is different depending on whether or not 'detail' is set.  detail requires a call for additional data.
//detail will be set when more than the very basic information about the category is displayed (thumb, subcats, etc)
					if(data.bindData.detail)	{
						if(data.bindData.detail == 'min')	{} //uses default call
						else if(data.bindData.detail == 'more' || data.bindData.detail == 'max')	{
							call = call+(data.bindData.detail.charAt(0).toUpperCase() + data.bindData.detail.slice(1)); //first letter of detail needs to be uppercase
							}
						else	{
							app.u.dump("WARNING! invalid value for 'detail' in categoryList renderFunction");
							}
						for(var i = 0; i < L; i += 1)	{
// *** 201344 null pretty name is NOT a hidden category. But we have to check to avoid a null ptr error. -mc
							if(!data.value[i].pretty || data.value[i].pretty[0] != '!')	{
// ** 201336+ appNavcatDetail id param changed to path -mc
// *** 201338 Missed a few references to id here -mc
								var parentID = data.value[i].path+"_catgid+"+(app.u.guidGenerator().substring(10));
								$tag.append(app.renderFunctions.createTemplateInstance(data.bindData.loadsTemplate,{'id':parentID,'catsafeid':data.value[i].path}));
								numRequests += app.ext.store_navcats.calls[call].init(data.value[i].path,{'parentID':parentID,'callback':'translateTemplate'});
								}
							}
						if(numRequests)	{app.model.dispatchThis()}
						}
//if no detail level is specified, only what is in the actual value (typically, id, pretty and @products) will be available. Considerably less data, but no request per category.
					else	{
						for(var i = 0; i < L; i += 1)	{
// ** 201336+ appNavcatDetail id param changed to path -mc
							var parentID = data.value[i].path+"_catgid+"+(app.u.guidGenerator().substring(10));
							if(data.value[i].pretty[0] != '!')	{
								$tag.append(app.renderFunctions.transmogrify({'id':parentID,'catsafeid':data.value[i].path},data.bindData.loadsTemplate,data.value[i]));
								}
							}
						}
					}
				else	{
					//value isn't an object or is empty. perfectly normal to get here if a page has no subs.
					}
				},

//assumes that you have already gotten a 'max' detail for the safecat specified data.value.
//shows the category, plus the first three subcategories.
			subcategory2LevelList : function($tag,data)	{
				app.u.dump("BEGIN store_navcats.renderFormats.subcategory2LevelList");
				var catSafeID; //used in the loop for a short reference.
				var subcatDetail = data.value;
				var o = '';
				if(!$.isEmptyObject(subcatDetail))	{
					var L = subcatDetail.length;
					if(data.bindData.size == 'false')	{size = L}
					else if(Number(data.bindData.size))	{size = Number(data.bindData.size)} //if size is valid, use it.
					else	{size = L > 15 ? 15 : L; } //don't show more than 15 unless specified
//!!! hhhmm.. needs fixin. need to compensate 'i' for hidden categories.
					for(var i = 0; i < size; i +=1)	{
						if(subcatDetail[i].pretty[0] != '!')	{
// *** 201338 appNavcatDetail response format changed from id to path -mc
							catSafeID = subcatDetail[i].path;
							o += "<li><a href='#' onClick=\"showContent('category',{'navcat':'"+catSafeID+"'}); return false;\">"+subcatDetail[i].pretty+ "<\/a><\/li>";
							}
						}
					if(L > size)	{
						o += "<li class='viewAllSubcategories' onClick=\"showContent('category',{'navcat':'"+data.value+"'});\">View all "+L+" Categories<\/li>";
						}
					$tag.append(o);
					}		
				}, //subcategory2LevelList		

//pass in category safe id as value
			breadcrumb : function($tag,data)	{
app.u.dump("BEGIN store_navcats.renderFunctions.breadcrumb"); 
// * 201346 -> necessary for breadcrumb being supported in master header.
$tag.empty(); //reset each time
var numRequests = 0; //number of requests (this format may require a dispatch to retrieve parent category info - when entry is a page 3 levels deep)

if(app.u.isSet(data.value))	{
	var pathArray = data.value.split('.');
	var L = pathArray.length;
	var s = '.'
	var catSafeID; //recycled in loop for path of category in focus during iteration.
	//make sure homepage has a pretty.  yes, it sometimes happens that it doesn't.
//	if(!app.data['appNavcatDetail|.'] || !app.data['appNavcatDetail|.'].pretty)	{
//		app.data['appNavcatDetail|.'].pretty = 'Home';
//		}

//Creates var for tracking whether root has been met.
	var reachedRoot = false;
// homepage has already been rendered. if path == ., likely we r on a product page, arriving from homepage. don't show bc.
	if(data.value == '.'){}
	else	{
		for(var i = 0; i < L; i += 1)	{
			s += pathArray[i];
			
//Checks the rootcat to ensure we don't add extra categories above our root to the breadcrumb.  Once reachedRoot is triggered, add all categories below the root.
			if(!reachedRoot) {
				reachedRoot = (zGlobals.appSettings.rootcat === s);
			}
			if(reachedRoot) {
				//app.u.dump(" -> "+i+" s(path): "+s);
				//app.u.dump(app.data['appNavcatDetail|'+s]);
				$tag.append(app.renderFunctions.transmogrify({'id':'.','catsafeid':s},data.bindData.loadsTemplate,app.data['appNavcatDetail|'+s]));
			}
			if(i!=0)
			s += '.';
		}
	}
	

	
}
				} //breadcrumb

			}, //renderFormats


////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
/*
In cases where the root categories are needed, this function will return them from the appCategoryList dataset.
function assumes appCategoryList already exists in memory.
will return an object of id:safeid, which is how the categories are stored in a appNavcatDetail.
the formatted is specific so that getChildDataOf can be used for a specific id or '.' so don't change the output without testing it in that function.
*/
			getRootCats : function()	{
//				app.u.dump('BEGIN app.ext.store_navcats.u.getRootCats');
				var r = false;
				if(app.data.appCategoryList)	{
					var L = app.data.appCategoryList['@paths'].length;
					r = new Array();
	//				app.u.dump(' -> num cats = '+L);
					for(var i = 0; i < L; i += 1)	{
						if(app.data.appCategoryList['@paths'][i].split('.').length == 2)	{
							r.push(app.data.appCategoryList['@paths'][i]);
							}
						}
					}
				else	{
					app.u.dump("WARNING! Attempted to run store_navcats.u.getRootCats before appCategoryList is in data/memory.");
					}
				return r;
				}, //getRootCatsData

			getCatsFromCategoryList : function(catSafeID)	{
				app.u.dump('BEGIN app.ext.store_navcats.u.getCatsFromCategoryList');
				var r = false; //what is returned. false if appCategoryList is not defined. otherwise an array of category id's. empty array if no subcats defined.
				if(!catSafeID)	{
					app.u.throwGMessage("catSafeID not specified in store_navcats.u.getCatsFromCategoryList");
					}
				else if(!app.data.appCategoryList)	{
					app.u.throwGMessage("Attempted to run store_navcats.u.getCatsFromCategoryList before appCategoryList is in data/memory.");
					}
				else if(catSafeID == '.')	{
					r = app.ext.store_navcats.u.getRootCats();
					}
				else if(app.data.appCategoryList && catSafeID)	{
					var L = app.data.appCategoryList['@paths'].length;
					r = new Array();
					for(var i = 0; i < L; i += 1)	{
						if(app.data.appCategoryList['@paths'][i].indexOf(catSafeID) == 0)	{
							r.push(app.data.appCategoryList['@paths'][i]);
							}
						}
					}
				else	{
					app.u.throwGMessage("An unknown error occured in store_navcats.u.getCatsFromCategoryList");
					}
				return r;
				}, //getRootCatsData

			getListOfSubcats : function(catSafeID){
//				app.u.dump("BEGIN store_navcats.u.getListOfSubcats ["+catSafeID+"]");
				var catsArray = new Array();				
				if(catSafeID == '.')	{
					catsArray = this.getRootCats();
					}
				else if(app.data['appNavcatDetail|'+catSafeID])	{
					if(typeof app.data['appNavcatDetail|'+catSafeID]['@subcategories'] == 'object')	{
						catsArray = app.data['appNavcatDetail|'+catSafeID]['@subcategories'];
						}
//when a max detail is done for appNavcatDetail, subcategories[] is replaced with subcategoryDetail[] in which each subcat is an object.
					else if(typeof app.data['appNavcatDetail|'+catSafeID]['@subcategoryDetail'] == 'object')	{
						catsArray = this.getSubsFromDetail(catSafeID);
						}
//					app.u.dump(" -> catsArray: "); app.u.dump(catsArray);
					}
				else if(catsArray = this.getCatsFromCategoryList(catSafeID)){}	// = instead of == cuz we're setting the value of catsArray in the IF
				else	{} //catch
				return catsArray;
				},

/*
a function for obtaining information about a categories children.
assumes you have already retrieved data on parent so that @subcategories or @subcategoryDetail is present.
 -> catSafeID should be the category safe id that you want to obtain information for.
 -> call, in all likelyhood, will be set to one of the following:  appNavcatDetailMax, appNavcatDetailMore, appNavcatDetail.  It'll default to Fast (no suffix).
tagObj is optional and would contain an object to be passed as _tag in the request (callback, templateID, etc).
if the parentID and templateID are passed as part of tagObj, a template instance is created within parentID.

note - This function just creates the calls.  Dispatch on your own.
note - there is NO error checking in here to make sure the subcats aren't already loaded. Do that in a parent function on your own.
 (see examples/site-analyzer/ actions.showSubcats

*/
			getChildDataOf : function(catSafeID,tagObj,call){
				var numRequests = 0; //will get incremented once for each request that needs dispatching.
//				app.u.dump("BEGIN app.ext.store_navcats.u.getChildDataOf ("+catSafeID+")");
//				app.u.dump(app.data['appNavcatDetail|'+catSafeID])
//if . is passed as catSafeID, then tier1 cats are desired. The list needs to be generated.
				var catsArray = this.getListOfSubcats(catSafeID)
				var newParentID;
				var tier = (catSafeID.split('.').length) - 1; //root cat split to 2, so subtract 1.
				
				if(catsArray.length > 0)	{
					
					catsArray.sort(); //sort by safe id.
					var L = catsArray.length;
					var call = call ? call : "appNavcatDetail"
	//used in the for loop below to determine whether or not to render a template. use this instead of checking the two vars (templateID and parentID)
					renderTemplate = false;
					if(tagObj.templateID && tagObj.parentID)	{
						var $parent = $('#'+tagObj.parentID);
						var renderTemplate = true;
						}
					for(var i = 0; i < L; i += 1)	{
						if(renderTemplate)	{
	//homepage is skipped. at this point we're dealing with subcat data and don't want 'homepage' to display among them
							if(catsArray[i] != '.')	{
								newParentID = tagObj.parentID+"_"+catsArray[i]
								$parent.append(app.renderFunctions.createTemplateInstance(tagObj.templateID,{"id":newParentID,"catsafeid":catsArray[i]}));
								}
							}
	//if tagObj was passed in without .extend, the datapointer would end up being shared across all calls.
	//I would have though that manipulating tagObj within another function would be local to that function. apparently not.
						numRequests += app.ext.store_navcats.calls[call].init(catsArray[i],$.extend({'parentID':newParentID},tagObj));
						}
					}
				return numRequests;
				}, //getChildDataOf

//on a appNavcatDetail, the @subcategoryDetail contains an object. The data is structured differently than @subcategories.
//this function will return an array of subcat id's, formatted like the value of @subcategories.
			getSubsFromDetail : function(catSafeID)	{
				var catsArray = new Array(); //what is returned. incremented with each dispatch created.
				var L = app.data['appNavcatDetail|'+catSafeID]['@subcategoryDetail'].length
				for(var i = 0; i < L; i += 1)	{
// *** 201338 appNavcatDetail id changed to path
					catsArray.push(app.data['appNavcatDetail|'+catSafeID]['@subcategoryDetail'][i].path);
					}
				//app.u.dump(catsArray);
				return catsArray;			
				}, //getSubsFromDetail
			
						
			addQueries4BreadcrumbToQ : function(path)	{
//				app.u.dump("BEGIN myRIA.u.getBreadcrumbData");
				var numRequests = 0;
				var pathArray = path.split('.');
				var len = pathArray.length
				var s= '.'; //used to contatonate safe id.
				numRequests += app.ext.store_navcats.calls.appNavcatDetail.init('.'); //homepage data. outside of loop so I can keep loop more efficient
				for (var i=1; i < len; i += 1) {
					s += pathArray[i]; //pathArray[0] will be blank, so s (.) plus nothing is just .
//					app.u.dump(" -> path for breadcrumb: "+s);
					numRequests += app.ext.store_navcats.calls.appNavcatDetail.init(s);
				//after each loop, the . is added so when the next cat id is appended, they're concatonated with a . between. won't matter on the last loop cuz we're done.
					s += "."; //put a period between each id. do this first so homepage data gets retrieved.
					
					}
				return numRequests;
				}			
			
			
			} //util


		
		} //r object.
	return r;
	}