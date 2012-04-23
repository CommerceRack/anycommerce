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

		searchResult : {
			init : function(frmObj,tagObj)	{
//				myControl.util.dump("BEGIN myControl.ext.store_search.calls.searchResult");
//				myControl.util.dump(" -> selector = "+'#'+form.id);
//				myControl.util.dump(" -> KEYWORDS = "+keywords);
//				myControl.util.dump(frmObj);
				var r = 0;
				var keywords = $.trim(frmObj.KEYWORDS);
				tagObj = typeof tagObj != 'object' ? {} : tagObj;
//SANITY - issue with repeated calls and datapointer being shared. the extend here is to solve that.
//test if this is changed, specifically using the getAlternativeQueries function.
				var myTagObj = {};
				myTagObj = $.extend(myTagObj,tagObj); 
				myTagObj.datapointer = "searchResult|"+keywords; //for now, just the keywords is enough. most users only use one catalog.
				if(myControl.model.fetchData(myTagObj.datapointer) == false)	{
//					myControl.util.dump(" -> searchResult not in memory or local. refresh both.");
					r += 1;
					this.dispatch(frmObj,myTagObj)
					}
				else 	{
//					myControl.util.dump(" -> searchResult local.");
					myControl.util.handleCallback(myTagObj)
					}
				return r;
				},
			dispatch : function(frmObj,myTagObj)	{
				frmObj['_cmd'] = "searchResult";
				frmObj['_tag'] = myTagObj;
				myControl.model.addDispatchToQ(frmObj);
				}
			}, //searchResult

//no local caching (fetch) of results yet. need to work with the new search a bit
// to get a good handle on what datapointers should look like.
		appPublicSearch : {
			init : function(obj,tagObj,Q)	{
				myControl.util.dump("BEGIN myControl.ext.store_search.calls.appPublicSearch");
//				myControl.util.dump(obj);
				this.dispatch(obj,tagObj)
				return 1;
				},
			dispatch : function(obj,tagObj,Q)	{
				obj['_cmd'] = "appPublicSearch";
				obj['_tag'] = tagObj;
				myControl.model.addDispatchToQ(obj,Q);
				}
			} //appPublicSearch


		}, //calls



					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\






	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration. Use this for any config or dependencies that need to occur.
//the callback is auto-executed as part of the extensions loading process.
		init : {
			onSuccess : function()	{
//				myControl.util.dump('BEGIN myControl.ext.store_navcats.init.onSuccess ');
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				myControl.util.dump('BEGIN myControl.ext.store_navcats.callbacks.init.onError');
				}
			}


		}, //callbacks



////////////////////////////////////   UTIL    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		util : {
			
			
			getAlternativeQueries : function(keywords,tagObj)	{
				var keywordsArray = new Array();
			
				keywordsArray = keywords.split(' ');
//				myControl.util.dump(" -> number of words = "+keywordsArray.length);
				
				var permutations = this.getPermutationsOfArray(keywordsArray);
//				myControl.util.dump(" -> number of permutations = "+permutations.length);
				var L = permutations.length;
				var mode = $('#headerModeInput').val();
				var catalog = $('#headerCatalog').val();
				var thisKeyword;
				for(var i = 0; i < L; i += 1)	{
					thisKeyword = this.getPermArrayIntoString(permutations[i]);
					myControl.ext.store_search.calls.searchResult.init({"KEYWORDS":thisKeyword,"CATALOG":catalog,"MODE":mode},tagObj);
					}

				}, //getAlternativeQueries
		
			getPermArrayIntoString : function(a)	{
				var r = '';
				for(var i = 0; i < a.length; i +=1)	{
					r += a[i]+' ';
					}
//				myControl.util.dump("permArrayToString = "+r);
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
keyword auto-complete does not use the dispatchq. Instead, it fires it's own request.
This was done for a few reasons, the most important being the speed needed for the response. If the response
doesn't load very fast, it becomes pointless.

In addition, none of the params typically set in tagObj are necessary because they're all fixed.

// http://jqueryui.com/demos/autocomplete/#remote-jsonp

*/
		bindKeywordAutoComplete : function(formID)	{
//			myControl.util.dump("BEGIN store_search.util.bindKeywordAutoComplete");
			var $keywordInput = $('#'+formID+' input[name*="KEYWORDS"]');
			var $catalogInput = $('#'+formID+' input[name*="CATALOG"]');


$keywordInput.autocomplete({
	source: function( request, response ) {
		if(!$.isEmptyObject(myControl.ext.store_search.vars.ajaxRequest)){
			myControl.ext.store_search.vars.ajaxRequest.abort(); //kill any keyword complete requests in process so the results aren't doubled-up.
			}
		myControl.ext.store_search.vars.ajaxRequest = $.ajax({
			type: "GET",
			url: myControl.vars.jqurl+"?_cmd=getKeywordAutoComplete&_zjsid="+myControl.sessionId+"&_uuid="+myControl.model.fetchUUID()+"&keywords="+$keywordInput.val()+"&catalog="+$catalogInput.val(),
			context : this,
			dataType:"json",
			complete: function()	{
				myControl.ext.store_search.vars.ajaxRequest = {}; //empty request holder.
				},
			success: function( data ) {
				response( $.map( data['@result'], function( item ) {
					return {
						label: item[0]+" ( "+item[1]+" items )",
						value: item[0]
						}
					}));
				}
			});
		},
	minLength: 2,
	select: function( event, ui ) {
//		myControl.util.dump("ui.item: ");
//		myControl.util.dump(ui.item.value);
//		$keywordInput.empty().val(ui.item ? 	"Selected: " + ui.item.label :	"Nothing selected, input was " + this.value);
		$keywordInput.val(ui.item.value);
		$('#'+formID).submit();
		}
	});



				} //bindKeywordAutoComplete
			




			} //util


		
		} //r object.
	return r;
	}