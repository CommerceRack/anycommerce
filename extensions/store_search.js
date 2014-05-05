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

//while called 'store_search', these extension is also used in the admin.
*/


var store_search = function(_app) {
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
P.mode = 'elastic-search';
P.size = 250;
P.filter =  { 'and':{ 'filters':[ {'term':{'profile':'E31'}},{'term':{'tags':'IS_SALE'}}  ] } }
or instead of P.filter, you may have
P.query = { 'and':{ 'filters':[ {'term':{'profile':'E31'}},{'term':{'tags':'IS_SALE'}}  ] } };
*/
		appPublicProductSearch : {
			init : function(P,tagObj,Q)	{
//				_app.u.dump("BEGIN _app.ext.store_search.calls.appPublicSearch");
				this.dispatch(P,tagObj,Q)
				return 1;
				},
			dispatch : function(P,tagObj,Q)	{
				P['_cmd'] = "appPublicSearch";
				P.type = 'product';
				P['_tag'] = tagObj;
//				_app.u.dump(P);
				_app.model.addDispatchToQ(P,Q);
				}
			}, //appPublicSearch

//no local caching (fetch) of results yet. need to work with the new search a bit
// to get a good handle on what datapointers should look like.
		appPublicSearch : {
			init : function(obj,tagObj,Q)	{
				this.dispatch(obj,tagObj,Q)
				return 1;
				},
			dispatch : function(obj,tagObj,Q)	{
				obj['_cmd'] = "appPublicSearch";
				obj['_tag'] = tagObj;
//				_app.u.dump("BEGIN _app.ext.store_search.calls.appPublicSearch");
//				_app.u.dump(obj);
				_app.model.addDispatchToQ(obj,Q);
				}
			} //appPublicSearch


		}, //calls



					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\






	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration. Use this for any config or dependencies that need to occur.
//the callback is auto-executed as part of the extensions loading process.
		init : {
			onSuccess : function()	{
//				_app.u.dump('BEGIN _app.ext.store_navcats.init.onSuccess ');
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				_app.u.dump('BEGIN _app.ext.store_navcats.callbacks.init.onError');
				}
			},


//the request that uses this as a callback should have the following params set for _tag:
// parentID, templateID (template used on each item in the results) and datapointer.
//the request that uses this as a callback should have the following params set for _tag:
// parentID, templateID (template used on each item in the results) and datapointer.
		handleElasticResults : {
			onSuccess : function(_rtag)	{
				var L = _app.data[_rtag.datapointer]['_count'];
				
				var $list = _rtag.list;
				if($list && $list.length)	{
//*** 201336 -> setting data-app-role on the element was a bad idea. it may have already been set and it doesn't appear to get used at all.
					$list.empty().removeClass('loadingBG'); //.attr('data-app-role','searchResults');
					$list.closest('.previewListContainer').find('.resultsHeader').empty().remove(); //remove any previous results multipage headers

					if(L == 0)	{
						$list.append("Your query returned zero results.");
						}
					else	{
						var $parent;
						if($list.is('tbody'))	{$parent = $list.closest('table').parent(); _app.u.dump("LIST is a tbody");}
						else if($list.is('table'))	{$parent = $list.parent();}
						else	{$parent = $list.parent()}

//put items into list (most likely a ul or tbody
						$list.append(_app.ext.store_search.u.getElasticResultsAsJQObject(_rtag)); //prioritize w/ getting product in front of buyer
						if(_rtag.title)	{
							$list.before("<h2 class='searchHeader'>"+_rtag.title+"</h2>");
							}
						if(_app.ext.admin)	{
							$list.hideLoading();
							_app.u.handleAppEvents($parent);
							}
	
						var EQ = $list.data('elastic-query'); //Elastic Query
						if(EQ)	{
							var _tag = $.extend(true,{},_rtag); //create a copy so original is not modified.
							delete _tag.pipeUUID;
							delete _tag.status; //the status would already be 'requesting' or 'completed', which means this request wouldn't run.
					
							var $header = _app.ext.store_search.u.buildResultsHeader($list,_rtag.datapointer), //# of results and keyword display.
//							$sortMenu = _app.ext.store_search.u.buildSortMenu($list,_rtag), //sorting options as ul
							$pageMenu = _app.ext.store_search.u.buildPagination($list,_tag), //pagination as ul
							$multipage = _app.ext.store_search.u.buildPaginationButtons($list,_tag), //next/prev buttons
							$menuContainer = $("<div \/>").addClass('resultsMenuContainer'), //used to hold menus. imp for abs. positioning.
							$controlsContainer = $("<div \/>").addClass('ui-widget ui-widget-content resultsHeader clearfix ui-corner-bottom'); //used to hold menus and buttons.
							
//							$menuContainer.append($sortMenu); //sorting not working. commented out for now. !!!
							$parent.find(".resultsHeader").remove(); //make sure headers don't stack when using pagination. // ### TODO -> test this.
							$header.prependTo($parent);
//pageMenu will be false if there are no pages. If there's no pagination, no further output is needed.
							if($pageMenu)	{
	
								$menuContainer.append($pageMenu);
								$menuContainer.appendTo($controlsContainer);
								$multipage.appendTo($controlsContainer); //multipage nav is at the top and bottom
								
								
								$controlsContainer.prependTo($parent);
//add to DOM prior to running menu. helps it to not barf.
								$pageMenu.menu();
//								$sortMenu.menu();
								}
							}
						else	{
							//no error gets thrown here. it is an acceptable use case to display search results w/ no multipage functionality.
							}
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In store_search.callbacks.handleElasticResults, $list ['+typeof _rtag.list+'] was not defined, not a jquery object ['+(_rtag.list instanceof jQuery)+'] or does not exist ['+_rtag.list.length+'].',gMessage:true});
					_app.u.dump("handleElasticResults _rtag.list: "); _app.u.dump(_rtag.list);
					}

//this gets run whether there are results or not. It is the events responsibility to make sure results were returned. 
// That way, it can handle a no-results action.
				$list.trigger('listcomplete');
				}
			}
		}, //callbacks



////////////////////////////////////   UTIL [u]    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
		
//!!! The header and pagination handling all relies on a query->query_string->query type object.  With more complex elastic searches we must add handling


//list is the UL or whatever element type contains the list of product.
			buildResultsHeader : function($list,datapointer,vars)	{
//				_app.u.dump("BEGIN store_search.u.buildMultipageHeader");
				vars = vars || {};
				var $header = false, //will be a jquery object IF the necesarry data is present.
				EQ = $list.data('elastic-query'); //Elastic Query
				
				if(datapointer && $list && EQ)	{
					$header = $("<div \/>").addClass('ui-widget ui-widget-header resultsHeader clearfix ui-corner-top hideInMinimalMode'); // note - resultsHeader is used to search/replace any existing headers.
					if(EQ.query && EQ.query.query_string && EQ.query.query_string.query){
						$header.text(_app.data[datapointer].hits.total+" Results for: "+EQ.query.query_string.query);
						}
					else {
						$header.text(_app.data[datapointer].hits.total+" Results for your query");
						}
					}
				else if(!EQ)	{
					_app.u.dump("NOTICE! the search results container did not contain data('elastic-filter') so no multipage data is present.",'warn');
					}
				else if(!$list)	{
					$('#globalMessaging').anymessage({'message':'In store_search.u.buildResultsHeader, no $list object specified','gMessage':true})
					}
				else	{
					$list.parent.anymessage({'message':'In store_search.u.buildResultsHeader, no datapointer specified','gMessage':true});
					}
				return $header;
				},
			
			buildPaginationButtons : function($list,_rtag)	{
				
				_app.u.dump("BEGIN store_search.u.buildPaginationButtons");
				
				var $controls,
				EQ = $list.data('elastic-query'); //Elastic Query
//				_app.u.dump(" -> EQ: "); _app.u.dump(EQ);
				if($list && EQ && _rtag && _rtag.datapointer)	{
//					_app.u.dump("EQ: "); _app.u.dump(EQ);
					var data = _app.data[_rtag.datapointer], //shortcut
					from = EQ.from || 0,
					pageInFocus = $list.data('page-in-focus') || 1, //start at 1, not zero, so page 1 = 1
					totalPageCount = Math.ceil(data.hits.total / EQ.size) //total # of pages for this list.

_app.u.dump(" -> pageInFocus: "+pageInFocus);

					$controls = $("<div \/>").addClass('');

//SANITY -> the classes on these buttons are used in quickstart. 					
					var $prevPageBtn = $("<button \/>").text("Previous Page").button({icons: {primary: "ui-icon-circle-triangle-w"},text: false}).addClass('prevPageButton').on('click.multipagePrev',function(event){
						event.preventDefault();
						_app.ext.store_search.u.changePage($list,(pageInFocus - 1),_rtag);
						});
					var $nextPageBtn = $("<button \/>").text("Next Page").button({icons: {primary: "ui-icon-circle-triangle-e"},text: false}).addClass('nextPageButton').on('click.multipageNext',function(event){
						event.preventDefault();
						_app.ext.store_search.u.changePage($list,(pageInFocus + 1),_rtag);
						});

					if(pageInFocus == 1)	{$prevPageBtn.button('disable');}
					else if(totalPageCount == pageInFocus){$nextPageBtn.button('disable')} //!!! disable next button if on last page.
					else	{}

					$nextPageBtn.appendTo($controls);
					$prevPageBtn.appendTo($controls);
					}
				else if($list)	{} //$list is defined but not EQ. do not show errors for this. it may be intentional.
				else	{
					$('#globalMessaging').anymessage({'message':'In store_search.u.buildPaginationButtons, $list or datapointer not specified','gMessage':true});
					}

				return $controls;
				
				},

//add the elastic query as data to the results container so that it can be used for multipage.
//this is a function because the code block was duplicated a lot and the query needs to be added in a specific manner
//extend is used to create a copy so that further changes to query are not added to DOM (such as _tag which contains this element and causes recursion issues).

			updateDataOnListElement : function($list,query,pageInFocus)	{
				$list.data('elastic-query',$.extend(true,{},query));
				$list.data('page-in-focus',pageInFocus);
				},

			changePage : function($list,newPage,_tag)	{
				if($list && newPage)	{
					var EQ = $list.data('elastic-query'); //Elastic Query
//					_app.u.dump(" -> newPage: " + newPage);
					if(EQ)	{
						var query = EQ;
						_app.u.dump("EQ:");
						_app.u.dump(EQ);
						//query.size = EQ.size; //use original size, not what's returned in buildSimple...
						query.from = (newPage - 1) * EQ.size; //page is passed in, which starts at 1. but elastic starts at 0.
						_app.ext.store_search.u.updateDataOnListElement($list,query,newPage);
						_app.ext.store_search.calls.appPublicSearch.init(query,_tag);
						_app.model.dispatchThis();
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In store_search.u.changePage, $list set but missing data(elastic-query).','gMessage':true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In store_search.u.changePage, $list or newPage not specified','gMessage':true});
					}
				},

			buildPagination : function($list,_tag)	{
				var $pagination = false; //what is returned. Either an unordered list of pages or false if an error occured.
				if($list && _tag)	{
					var EQ = $list.data('elastic-query'); //Elastic Query
					if(EQ)	{
						var pageInFocus = $list.data('page-in-focus') || 1, //start at 1, not zero, so page 1 = 1
						data = _app.data[_tag.datapointer],
						totalPageCount = Math.ceil(data.hits.total / EQ.size) //total # of pages for this list.
						
						if(totalPageCount <= 1)	{
							//if there is only 1 page or something went wrong, don't show pagination.
//							_app.u.dump(" -> no pagination for results. totalPageCount: "+totalPageCount);
							}
						else	{
							$pagination = $("<ul \/>").addClass('pagination resultsMenu');
							$pagination.addClass('hideInMinimalMode').append($("<li \/>").html("<a href='#'>Page "+pageInFocus+" of "+totalPageCount+"<\/a>"));
							var $pages = $("<ul \/>");
							for(var i = 1; i <= totalPageCount; i+= 1)	{
								$("<li \/>").html("<a href='#' data-page='"+i+"'>Page "+i+"<\/a>").appendTo($pages);
								}
							$("li:first",$pagination).append($pages);
							$("a",$pages).each(function(){
								$(this).on('click',function(event){
									event.preventDefault();
									_app.ext.store_search.u.changePage($list,$(this).data('page'),_tag);
									})
								});
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In store_search.u.buildPagination, $list set but missing data(elastic-query).','gMessage':true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In store_search.u.buildPagination, either $list ['+typeof $list+'] or _tag ['+typeof _tag+'] not passed','gMessage':true});
					}
				return $pagination;
				}, //buildPagination

			buildSortMenu : function($list,_tag){
				var $sort = $("<ul \/>").addClass('sortMethods resultsMenu'),
				$ul = $("<ul \/>"),
				EQ = $list.data('elastic-query'); //Elastic Query
				
				$sort.addClass('hideInMinimalMode').append($("<li \/>").append("<a href='#'>sort by</a>"));
				
				$("<li \/>").html("<a href='#'>Relevance</a>").appendTo($ul);
				$("<li \/>").html("<a href='#'>Alphabetical (a to z)</a>").appendTo($ul);
				$("<li \/>").html("<a href='#'>Price (low to high)</a>").appendTo($ul);
				
				$("li:first",$sort).append($ul); //adds ul of sorts to the li w/ the sort by prompt.
				
				//add click events to the href's
				$("a",$ul).each(function(){

					$(this).on('click',function(event){
						event.preventDefault();
						_app.u.dump(" -> change sort order");
					
						var query = _app.ext.store_search.u.buildElasticSimpleQuery(EQ.query.query_string);
						query.size = EQ.size; //use original size, not what's returned in buildSimple...
						query.from = 0;
						query.sort = [{'base_price':{'order':'asc'}}];
						
						_app.ext.store_search.u.updateDataOnListElement($list,query,1);

						_app.ext.store_search.calls.appPublicSearch.init(query,_tag);
						_app.model.dispatchThis();
						});
					})
				
				return $sort;
				}, //buildSortMenu
			
			getAlternativeQueries : function(keywords,tagObj)	{
				var keywordsArray = new Array();
			
				keywordsArray = keywords.split(' ');
//				_app.u.dump(" -> number of words = "+keywordsArray.length);
				
				var permutations = this.getPermutationsOfArray(keywordsArray);
//				_app.u.dump(" -> number of permutations = "+permutations.length);
				var L = permutations.length;
				var mode = $('#headerModeInput').val();
				var catalog = $('#headerCatalog').val();
				var thisKeyword;
				for(var i = 0; i < L; i += 1)	{
					thisKeyword = this.getPermArrayIntoString(permutations[i]);
					_app.ext.store_search.calls.searchResult.init({"KEYWORDS":thisKeyword,"CATALOG":catalog,"MODE":mode},tagObj);
					}

				}, //getAlternativeQueries
		
			getPermArrayIntoString : function(a)	{
				var r = '';
				for(var i = 0; i < a.length; i +=1)	{
					r += a[i]+' ';
					}
//				_app.u.dump("permArrayToString = "+r);
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
P.datapointer - pointer to where in _app.data the results are stored.
P.templateID - what productList template to use
P.parentID - The parent ID is used as the pointer in the multipage controls object. _app.ext.store_prodlist.vars[POINTER]
#### note - not all these are used yet, but will be soon.
*/

			getElasticResultsAsJQObject : function(P)	{
//				_app.u.dump("BEGIN store_search.u.getElasticResultsAsJQObject ["+P.datapointer+"]")
				var pid;//recycled shortcut to product id.
				var L = _app.data[P.datapointer]['_count'];
				var $r = $("<ul />"); //when this was a blank jquery object, it didn't work. so instead, we append all content to this imaginary list, then just return the children.
//				_app.u.dump(" -> parentID: "+P.parentID); //resultsProductListContainer
//				_app.u.dump(" -> L: "+L);
				for(var i = 0; i < L; i += 1)	{
					pid = _app.data[P.datapointer].hits.hits[i]['_id'];
//					_app.u.dump(" -> "+i+" pid: "+pid);
					$r.append(new tlc().runTLC({'templateid':P.templateID,'dataset':_app.data[P.datapointer].hits.hits[i]['_source']}).attr('data-pid',pid).removeClass('loadingBG'));
//					$r.append(_app.renderFunctions.transmogrify({'id':pid,'pid':pid},P.templateID,_app.data[P.datapointer].hits.hits[i]['_source']));
					}
				return $r.children();
				},
			
	
//Adds elastic search params to a new raw elasticsearch object
//Example of an obj would be {'filter':{'term':{'tags':'IS_BESTSELLER'}}} -- IE a full query or filter- just adding the required params here.
			buildElasticRaw : function(elasticsearch) {
				var es = $.extend(true, {}, elasticsearch);
				
				es.type = 'product';
				es.mode = 'elastic-search';
				es.size = 250;
				es.sort = [{'prod_name.raw':'asc'}] //here for testing. prod_name is tokenized, so the .raw field must be used for sorting.
				return es;
			},
			
//Example of an obj would be: {'query':'some search string'} OR {'query':'some search string','fields':'prod_keywords'}
			buildElasticSimpleQuery : function(obj)	{
				var query = {}; //what is returned. false if error occurs.
				if(obj && obj.query)	{
					query.type = 'product';
					query.mode = 'elastic-search';
					query.size = 250;
					query.query =  {"query_string" : obj};
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In store_search.u.buildElasticSimpleQuery, obj.query was empty. ',gMessage:true});
					query = false;
					}
				return query;
				},

//This is used by quickstart for simple tag and keyword searches as well as by analyzer and admin interface (product editor and probably finder).
			handleElasticSimpleQuery : function(keywords,_tag)	{
				var qObj = this.buildElasticSimpleQuery({'query':keywords});
				_tag = _tag || {};
				_tag.datapointer = "appPublicSearch|"+keywords;
				var r = _app.ext.store_search.calls.appPublicSearch.init(qObj,_tag);
				_app.model.dispatchThis();
				return r;
				}
				
			} //util


		
		} //r object.
	return r;
	}