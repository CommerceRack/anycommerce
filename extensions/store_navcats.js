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


var store_navcats = function(_app) {
	var r = {
	vars : {},

					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		


//calls return a 0 if a request is made and a 1 if data is already local.
	calls : {
//formerly categoryTree
		appCategoryList : {
			init : function(root,_tag,Q)	{
//				_app.u.dump("BEGIN store_navcats.calls.appCategoryList.init w/ root: "+root);
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				if(root)	{
					_tag = _tag || {};
					_tag.datapointer = _tag.datapointer || 'appCategoryList|'+root;
					if(_app.model.fetchData(_tag.datapointer))	{
						_app.u.handleCallback(_tag)
						}
					else 	{
						r = 1;
						this.dispatch(root,_tag,Q);
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In store_navcats.calls.appCategoryList, root was not passed and is required.","gMessage":true});
					}
				return r;
				},
			dispatch : function(root,_tag,Q)	{
				var obj = {};
				obj['_cmd'] = "appCategoryList";
				obj.root = root;
				obj._tag = _tag;
				_app.model.addDispatchToQ(obj,Q);
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
//				_app.u.dump("BEGIN store_navcats.calls.appPageGet.init");
//				_app.u.dump(" -> @get: "); _app.u.dump(obj['@get']);
				obj['_tag'] = typeof tagObj == 'object' ? tagObj : {};
				obj['_tag'].datapointer = 'appPageGet|'+obj.PATH;  //no local storage of this. ### need to explore solutions.
				var r = 0;
				var hasAllLocal = true;
				if(_app.model.fetchData('appPageGet|'+obj.PATH) == false)	{
					hasAllLocal = false;
					}
				else if(_app.data['appPageGet|'+obj.PATH] && _app.data['appPageGet|'+obj.PATH]['%page'])	{
					var L = obj['@get'].length;
					for(var i = 0; i < L; i += 1)	{
						if(!_app.data['appPageGet|'+obj.PATH]['%page'][obj['@get'][i]])	{
							hasAllLocal = false;
							break; //once we know 1 piece of data is missing, just get all of it.
							}
						}					
					}
				else	{
					hasAllLocal = false;
					}
				if(hasAllLocal)	{
					_app.u.handleCallback(tagObj);
					}
				else	{
					this.dispatch(obj,tagObj,Q);
					r = 1;
					}
				return r;
				},
			dispatch : function(obj,tagObj,Q)	{
				obj['_cmd'] = "appPageGet";
				_app.model.addDispatchToQ(obj,Q);
				}
			} //appPageGet
		}, //calls




					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
		init : {
			onSuccess : function()	{
//				_app.u.dump('BEGIN _app.ext.store_navcats.init.onSuccess ');
				return true;  //currently, no system or config requirements to use this extension
//				_app.u.dump('END _app.ext.store_navcats.init.onSuccess');
				},
			onError : function()	{
				_app.u.dump('BEGIN _app.ext.store_navcats.callbacks.init.onError');
				}
			},

		getRootCatsData : {
			onSuccess : function(tagObj)	{
//				_app.u.dump("BEGIN _app.ext.store_navcats.callbacks.handleProduct.onSuccess");
				_app.ext.store_navcats.u.getRootCatsData(tagObj);
				}
			},
/*
cats that start with a ! in the 'pretty' name are 'hidden'.  However, the pretty name isn't available until appNavcatDetail is request.
appNavcatDetail is requested AFTER a DOM element is already created for each category in the specified tree.  This is necessary because some data is loaded from local storage (fast)
and some has to be requested (not as fast). To maintain the correct order, the DOM element is added, then populated as info becomes available.
in this case, the DOM element may not be necessary, and in those cases (hidden cat), it is removed.

params in addition to standard tagObj (datapointer, callback, etc).

templateID - the template id used (from _app.templates)
*/
		addCatToDom : {
			onSuccess : function(tagObj)	{
//				_app.u.dump("BEGIN _app.ext.store_navcats.callbacks.addCatToDom.onSuccess");
//				_app.u.dump(" -> datapointer = "+tagObj.datapointer);
//				_app.u.dump(" -> add data to template: "+tagObj.parentID+"_"+tagObj.datapointer.split('|')[1]);
//yes, actually have to make sure .pretty exists. no shit. this happeneed. errored cuz pretty wasn't set.
				if(_app.data[tagObj.datapointer].pretty && _app.data[tagObj.datapointer].pretty.charAt(0) !== '!')	{
//					_app.u.dump("store_navcats.callback.addCatToDom.onsuccess - Category ("+tagObj.datapointer+") is hidden.");
//					_app.renderFunctions.translateTemplate(_app.data[tagObj.datapointer],tagObj.parentID+"_"+tagObj.datapointer.split('|')[1]);
					$(_app.u.jqSelector('#',tagObj.parentID+"_"+tagObj.datapointer.split('|')[1])).tlc({'verb':'translate','datapointer':tagObj.datapointer});
					}
				else	{
//					_app.u.dump(" -> cat '"+_app.data[tagObj.datapointer].pretty+"' is hidden. nuke it!");
					$(_app.u.jqSelector('#',tagObj.parentID+"_"+tagObj.datapointer.split('|')[1])).empty().remove();
					}
				}
			},


//to display a category w/ thumbnails, first the parent category obj is fetched (appNavcatDetail...) and this would be the callback.
//it will get the detail of all the children, including 'meta' which has the thumbnail. It'll absorb the tag properties set in the inital request (parent, template) but
// override the callback, which will be set to simply display the category in the DOM. getChildDataOf handles creating the template instance as long as parentID and templateID are set.
		getChildData : {
			onSuccess : function(tagObj)	{
//				_app.u.dump('BEGIN _app.ext.quickstart.callbacks.getChildData.onSuccess');
				var path = tagObj.datapointer.split('|')[1];
//				_app.u.dump(" -> path: "+path);
				tagObj.callback = 'addCatToDom'; //the tagObj will have 
				_app.ext.store_navcats.u.getChildDataOf(path,tagObj,'fast');  //generate nav for 'browse'. doing a 'max' because the page will use that anway.
				_app.model.dispatchThis();
				}
			} //getChildData


		}, //callbacks







////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





		renderFormats : {

			numsubcats : function($tag,data){
				$tag.append(data.value.length);
				}, //numsubcats

			numproduct : function($tag,data){
				$tag.append(data.value.length);
				}, //numproduct

			categorylist : function($tag,data)	{
//				dump(" BEGIN store_navcats.renderFormats.categorylist");
				data.value = data.value;
//				dump(" -> data.value"); dump(data.value);
				if(typeof data.value == 'object' && data.value.length > 0)	{
					var L = data.value.length;
					var call = 'appNavcatDetail';
					var numRequests = 0;
					data.bindData.detail = data.bindData.detail || 'fast';
//The process is different depending on whether or not 'detail' is set.  detail requires a call for additional data.
//detail will be set when more than the very basic information about the category is displayed (thumb, subcats, etc)
					for(var i = 0; i < L; i += 1)	{
//a null pretty name is NOT a hidden category. But we have to check to avoid a null ptr error. - mc
						if(!data.value[i].pretty || data.value[i].pretty[0] != '!')	{
//							var parentID = data.value[i].path+"_catgid+"+(_app.u.guidGenerator().substring(10));
//							var $ele = _app.renderFunctions.createTemplateInstance(data.bindData.loadsTemplate,{'catsafeid':data.value[i].path});
							var $tmp = $("<ul \/>").tlc({'templateid':data.bindData.templateid,'verb':'template','dataAttribs':{'catsafeid':data.value[i].path}});
							var $ele = $tmp.children().first();
							$tag.append($ele);
							numRequests += _app.calls.appNavcatDetail.init({'path':data.value[i].path,'detail':data.bindData.detail},{'callback':'tlc','jqObj':$ele,'verb':'translate'},'mutable');
							}
						}
					if(numRequests)	{_app.model.dispatchThis('mutable')}
					}
				else	{
					//value isn't an object or is empty. perfectly normal to get here if a page has no subs.
					}
				},

//pass in category safe id as value
			breadcrumb : function($tag,data)	{
//_app.u.dump("BEGIN store_navcats.renderFunctions.breadcrumb");
// in some cases, the breadcrumb may be outside the page content (in the master header, for example), so empty it first.
// if/when data-binds get more command-centric, get rid of this.
				$tag.empty(); //reset each time
				if(_app.u.isSet(data.value))	{
					var pathArray = data.value.split('.');
					var L = pathArray.length;
					var s = '.'
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
//								$tag.append(_app.renderFunctions.transmogrify({'id':'.','catsafeid':s},data.bindData.loadsTemplate,_app.data['appNavcatDetail|'+s]));
								$tag.append(new tlc().runTLC({templateid : data.bindData.templateid, dataset : _app.data['appNavcatDetail|'+s]}).attr({'data-catsafeid':s}));
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
//				_app.u.dump('BEGIN _app.ext.store_navcats.u.getRootCats');
				var r = false;
// *** 201401 path appended to appCategoryList datapointer in 201352 -mc
				if(_app.data["appCategoryList|"+zGlobals.appSettings.rootcat])	{
					var L = _app.data["appCategoryList|"+zGlobals.appSettings.rootcat]['@paths'].length;
					r = new Array();
	//				_app.u.dump(' -> num cats = '+L);
					for(var i = 0; i < L; i += 1)	{
						if(_app.data["appCategoryList|"+zGlobals.appSettings.rootcat]['@paths'][i].split('.').length == 2)	{
							r.push(_app.data["appCategoryList|"+zGlobals.appSettings.rootcat]['@paths'][i]);
							}
						}
					}
				else	{
					_app.u.dump("WARNING! Attempted to run store_navcats.u.getRootCats before appCategoryList is in data/memory.");
					}
				return r;
				}, //getRootCatsData

			getCatsFromCategoryList : function(path)	{
//				_app.u.dump('BEGIN _app.ext.store_navcats.u.getCatsFromCategoryList');
				var r = false; //what is returned. false if appCategoryList is not defined. otherwise an array of category id's. empty array if no subcats defined.
				if(!path)	{
					_app.u.throwGMessage("path not specified in store_navcats.u.getCatsFromCategoryList");
					}
// *** 201401 path appended to appCategoryList datapointer in 201352 -mc
				else if(!_app.data["appCategoryList|"+path])	{
					_app.u.throwGMessage("Attempted to run store_navcats.u.getCatsFromCategoryList before appCategoryList is in data/memory.");
					}
				else if(path == zGlobals.appSettings.rootcat)	{
					r = _app.ext.store_navcats.u.getRootCats();
					}
				else if(_app.data["appCategoryList|"+path] && path)	{
					var L = _app.data["appCategoryList|"+path]['@paths'].length;
					r = new Array();
// *** 201352 now returns only direct subcats, instead of including nested also. -mc
					for(var i = 0; i < L; i += 1) {
						var path = _app.data["appCategoryList|"+path]['@paths'][i];
						if(path != path && path.indexOf(path) == 0 && path.replace(path+'.', "").indexOf('.') < 0) {
							r.push(path);
							}
						}
					}
				else	{
					_app.u.throwGMessage("An unknown error occured in store_navcats.u.getCatsFromCategoryList");
					}
				return r;
				}, //getRootCatsData

			getListOfSubcats : function(path){
//				_app.u.dump("BEGIN store_navcats.u.getListOfSubcats ["+path+"]");
				var catsArray = new Array();				
				if(path == zGlobals.appSettings.rootcat)	{
					catsArray = this.getRootCats();
					}
				else if(_app.model.fetchData('appNavcatDetail|'+path))	{
					if(typeof _app.data['appNavcatDetail|'+path]['@subcategories'] == 'object')	{
						catsArray = _app.data['appNavcatDetail|'+path]['@subcategories'];
						}
//when a max detail is done for appNavcatDetail, subcategories[] is replaced with subcategoryDetail[] in which each subcat is an object.
					else if(typeof _app.data['appNavcatDetail|'+path]['@subcategoryDetail'] == 'object')	{
						catsArray = this.getSubsFromDetail(path);
						}
//					_app.u.dump(" -> catsArray: "); _app.u.dump(catsArray);
					}
				else if(catsArray = this.getCatsFromCategoryList(path)){}	// = instead of == cuz we're setting the value of catsArray in the IF
				else	{} //catch
				return catsArray;
				},

/*
a function for obtaining information about a categories children.
assumes you have already retrieved data on parent so that @subcategories or @subcategoryDetail is present.
 -> path should be the category safe id that you want to obtain information for.
 -> call, in all likelyhood, will be set to one of the following:  appNavcatDetailMax, appNavcatDetailMore, appNavcatDetail.  It'll default to Fast (no suffix).
tagObj is optional and would contain an object to be passed as _tag in the request (callback, templateID, etc).
if the parentID and templateID are passed as part of tagObj, a template instance is created within parentID.

note - This function just creates the calls.  Dispatch on your own.
note - there is NO error checking in here to make sure the subcats aren't already loaded. Do that in a parent function on your own.
 (see examples/site-analyzer/ actions.showSubcats

*/
			getChildDataOf : function(path,tagObj,detail){
				var numRequests = 0; //will get incremented once for each request that needs dispatching.
//				_app.u.dump("BEGIN _app.ext.store_navcats.u.getChildDataOf ("+path+")");
//				_app.u.dump(_app.data['appNavcatDetail|'+path])
//if . is passed as path, then tier1 cats are desired. The list needs to be generated.
				var catsArray = this.getListOfSubcats(path)
				var newParentID;
				var tier = (path.split('.').length) - 1; //root cat split to 2, so subtract 1.
				
				if(catsArray.length > 0)	{
					
					catsArray.sort(); //sort by safe id.
					var L = catsArray.length;
					detail = detail || "fast"
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
//								$parent.append(_app.renderFunctions.createTemplateInstance(tagObj.templateID,{"id":newParentID,"catsafeid":catsArray[i]}));
								$parent.append(new tlc().getTemplateInstance(tagObj.templateID).attr({"id":newParentID,"catsafeid":catsArray[i]}));
								}
							}
	//if tagObj was passed in without .extend, the datapointer would end up being shared across all calls.
	//I would have though that manipulating tagObj within another function would be local to that function. apparently not.
						numRequests += _app.calls.appNavcatDetail.init({'path':catsArray[i],'detail':detail},$.extend({'parentID':newParentID},tagObj));
						}
					}
				return numRequests;
				}, //getChildDataOf

//on a appNavcatDetail, the @subcategoryDetail contains an object. The data is structured differently than @subcategories.
//this function will return an array of subcat id's, formatted like the value of @subcategories.
			getSubsFromDetail : function(path)	{
				var catsArray = new Array(); //what is returned. incremented with each dispatch created.
				var L = _app.data['appNavcatDetail|'+path]['@subcategoryDetail'].length
				for(var i = 0; i < L; i += 1)	{
// *** 201338 appNavcatDetail id changed to path
					catsArray.push(_app.data['appNavcatDetail|'+path]['@subcategoryDetail'][i].path);
					}
				//_app.u.dump(catsArray);
				return catsArray;			
				}, //getSubsFromDetail
			
						
			addQueries4BreadcrumbToQ : function(path)	{
//				_app.u.dump("BEGIN quickstart.u.getBreadcrumbData");
				var datapointers = new Array(); //what's returned. the length can be used to update numRequests (if necessary). the array itself can be used for extending by datapointers, if necessary.
				var pathArray = path.split('.');
				var len = pathArray.length
				var s= '.'; //used to contatonate safe id.
				_app.calls.appNavcatDetail.init({'path':'.','detail':'fast'}); //homepage data. outside of loop so I can keep loop more efficient
				for (var i=1; i < len; i += 1) {
					s += pathArray[i]; //pathArray[0] will be blank, so s (.) plus nothing is just .
//					_app.u.dump(" -> path for breadcrumb: "+s);
					datapointers.push("appNavcatDetail|"+s);
					_app.calls.appNavcatDetail.init({'path':s,'detail':'fast'});
				//after each loop, the . is added so when the next cat id is appended, they're concatonated with a . between. won't matter on the last loop cuz we're done.
					s += "."; //put a period between each id. do this first so homepage data gets retrieved.
					}
				return datapointers;
				}			
			
			
			} //util


		
		} //r object.
	return r;
	}
