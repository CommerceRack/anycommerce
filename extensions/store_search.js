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


var store_search = function() {
	var r = {
		
	vars : {
//a list of the templates used by this extension.
//if this is a custom extension and you are loading system extensions (prodlist, etc), then load ALL templates you'll need here.
		"ajaxRequest" : {}
		},

					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		


	calls : {
			
/*
P is the params object. something like: 
var P = {}
P.mode = 'elastic-native';
P.size = 250;
P.filter =  { 'and':{ 'filters':[ {'term':{'profile':'E31'}},{'term':{'tags':'IS_SALE'}}  ] } }
or instead of P.filter, you may have
P.query = { 'and':{ 'filters':[ {'term':{'profile':'E31'}},{'term':{'tags':'IS_SALE'}}  ] } };
*/
		appPublicProductSearch : {
			init : function(P,tagObj,Q)	{
//				app.u.dump("BEGIN app.ext.store_search.calls.appPublicSearch");
				this.dispatch(P,tagObj,Q)
				return 1;
				},
			dispatch : function(P,tagObj,Q)	{
				P['_cmd'] = "appPublicSearch";
				P.type = 'product';
				P['_tag'] = tagObj;
//				app.u.dump(P);
				app.model.addDispatchToQ(P,Q);
				}
			}, //appPublicSearch

//no local caching (fetch) of results yet. need to work with the new search a bit
// to get a good handle on what datapointers should look like.
		appPublicSearch : {
			init : function(obj,tagObj,Q)	{
				
//				app.u.dump("BEGIN app.ext.store_search.calls.appPublicSearch");
//				app.u.dump(obj);
				
				this.dispatch(obj,tagObj,Q)
				return 1;
				},
			dispatch : function(obj,tagObj,Q)	{
				obj['_cmd'] = "appPublicSearch";
				obj['_tag'] = tagObj;
				app.model.addDispatchToQ(obj,Q);
				}
			} //appPublicSearch


		}, //calls



					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\






	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration. Use this for any config or dependencies that need to occur.
//the callback is auto-executed as part of the extensions loading process.
		init : {
			onSuccess : function()	{
//				app.u.dump('BEGIN app.ext.store_navcats.init.onSuccess ');
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN app.ext.store_navcats.callbacks.init.onError');
				}
			},


//the request that uses this as a callback should have the following params set for _tag:
// parentID, templateID (template used on each item in the results) and datapointer.
		handleElasticResults : {
			onSuccess : function(tagObj)	{
				app.u.dump("BEGIN myRIA.callbacks.handleElasticResults.onSuccess.");
				var L = app.data[tagObj.datapointer]['_count'];
				$parent = $('#'+tagObj.parentID).empty().removeClass('loadingBG')
				if(L == 0)	{
					$parent.append("Your query returned zero results.");
					}
				else	{
					$parent.append(app.ext.store_search.u.getElasticResultsAsJQObject(tagObj));
					}
				}
			}

		}, //callbacks



////////////////////////////////////   UTIL [u]    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
			
			
			getAlternativeQueries : function(keywords,tagObj)	{
				var keywordsArray = new Array();
			
				keywordsArray = keywords.split(' ');
//				app.u.dump(" -> number of words = "+keywordsArray.length);
				
				var permutations = this.getPermutationsOfArray(keywordsArray);
//				app.u.dump(" -> number of permutations = "+permutations.length);
				var L = permutations.length;
				var mode = $('#headerModeInput').val();
				var catalog = $('#headerCatalog').val();
				var thisKeyword;
				for(var i = 0; i < L; i += 1)	{
					thisKeyword = this.getPermArrayIntoString(permutations[i]);
					app.ext.store_search.calls.searchResult.init({"KEYWORDS":thisKeyword,"CATALOG":catalog,"MODE":mode},tagObj);
					}

				}, //getAlternativeQueries
		
			getPermArrayIntoString : function(a)	{
				var r = '';
				for(var i = 0; i < a.length; i +=1)	{
					r += a[i]+' ';
					}
//				app.u.dump("permArrayToString = "+r);
				return r;
				},
//pass in an array of keywords and all combinations will be returned.
//handy for breaking down a search query and letting the user see what
//may return better results.

			getPermutationsOfArray : function(keywordsArray)	{

//found here: http://snippets.dzone.com/posts/show/3545
var combine = function(a) {

var fn = function(n, src, got, all) {
	if (n == 0) {
		if (got.length > 0) {
			all[all.length] = got;
			}
		return;
		}
		
	for (var j = 0; j < src.length; j++) {
		fn(n - 1, src.slice(j + 1), got.concat([src[j]]), all);
		}
	return;
	}

	var all = [];
	for (var i=0; i < a.length; i++) {
		fn(i, a, [], all);
		}
	all.push(a);
	return all;
	}
return combine(keywordsArray);

			}, //getPermutationsOfArray
			

/*

Will return the results a jquery object for display. append the return from this function to your list (or other element)

P should contain the following:
P.datapointer - pointer to where in app.data the results are stored.
P.templateID - what productList template to use
P.parentID - The parent ID is used as the pointer in the multipage controls object. app.ext.store_prodlist.vars[POINTER]
#### note - not all these are used yet, but will be soon.
*/

			getElasticResultsAsJQObject : function(P)	{
//				app.u.dump("BEGIN store_search.u.getElasticResultsAsJQObject ["+P.datapointer+"]")
				var pid;//recycled shortcut to product id.
				var L = app.data[P.datapointer]['_count'];
				var $r = $("<ul />"); //when this was a blank jquery object, it didn't work. so instead, we append all content to this imaginary list, then just return the children.
//				app.u.dump(" -> parentID: "+P.parentID); //resultsProductListContainer
//				app.u.dump(" -> L: "+L);
				for(var i = 0; i < L; i += 1)	{
					pid = app.data[P.datapointer].hits.hits[i]['_id'];
//					app.u.dump(" -> "+i+" pid: "+pid);
					$r.append(app.renderFunctions.transmogrify({'id':pid,'pid':pid},P.templateID,app.data[P.datapointer].hits.hits[i]['_source']));
					}
				return $r.children();
				},

			handleElasticSimpleQuery : function(keywords,tagObj)	{
				var qObj = {}; //query object
				qObj.type = 'product';
				qObj.mode = 'elastic-native';
				qObj.size = 250;
				qObj.query =  {"query_string" : {"query" : keywords}};
				if(typeof tagObj != 'object')	{tagObj = {}};
				tagObj.datapointer = "appPublicSearch|"+keywords
				app.ext.store_search.calls.appPublicSearch.init(qObj,tagObj);
				app.model.dispatchThis();
				},
				
			handleElasticQueryFilterByAttributes : function(keywords, attributes, tagObj) {
				var qObj = {}; //query object
				qObj.type = 'product';
				qObj.mode = 'elastic-native';
				qObj.size = 250;
				qObj.query =  {"query_string" : {"query" : keywords, "fields" : attributes}};
				if(typeof tagObj != 'object')	{tagObj = {}};
				tagObj.datapointer = "appPublicSearch|"+keywords+"|"+attributes;
				app.u.dump(" --> datapointer for filterByAttributes query: "+tagObj.datapointer);
				app.ext.store_search.calls.appPublicSearch.init(qObj,tagObj);
				app.model.dispatchThis();
				}
				
			} //util


		
		} //r object.
	return r;
	}