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
			"templates" : ['profileTemplate','catInfoTemplate','prodlistProdTemplate'],
			"dependAttempts" : 0,  //used to count how many times loading the dependencies has been attempted.
			"dependencies" : ['store_navcats','store_search'] //a list of other extensions (just the namespace) that are required for this one to load
			},
		
		calls: {
			
			appResource : {
				init : function(filename,tagObj,Q)	{
//					app.u.dump("BEGIN myRIA.calls.appResource.init");
					tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
					tagObj.datapointer = 'appResource|'+filename;
					this.dispatch(filename,tagObj,Q);
					return 1;
					},
				dispatch : function(filename,tagObj,Q)	{
					var obj = {};
					obj.filename = filename
					obj["_cmd"] = "appResource";
					obj["_tag"] = tagObj;
					app.model.addDispatchToQ(obj,Q);
					}
				} //appResource
			}, //calls
		
		callbacks : {
//run when controller loads this extension.  Should contain any validation that needs to be done. return false if validation fails.
			init : {
				onSuccess : function()	{
					var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
					return r;
					},
				onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
					app.u.dump('BEGIN app.ext.myRIA.callbacks.init.onError');
					}
				},

//this is the callback defined to run after extension loads.
			startMyProgram : {
				onSuccess : function()	{
					
$('#profileSummary').append(app.renderFunctions.createTemplateInstance('profileTemplate',"profileSummaryList"));
					
$('#tabs-1').append(app.ext.myRIA.u.objExplore(zGlobals));
$('#tabs-4').append(app.ext.myRIA.u.buildTagsList({'id':'tagList'}));

					app.ext.myRIA.calls.appResource.init('flexedit.json',{'callback':'handleFlexedit','extension':'myRIA'});
//request profile data (company name, logo, policies, etc)
					app.calls.appProfileInfo.init({'profile':zGlobals.appSettings.profile},{'callback':'handleProfile','parentID':'profileSummaryList','extension':'myRIA'});
					app.ext.store_navcats.calls.appCategoryList.init({"callback":"showRootCategories","extension":"myRIA"});
					app.model.dispatchThis();
					
					},
				onError : function(responseData,uuid)	{
//error handling is a case where the response is delivered (unlike success where datapointers are used for recycling purposes)
					app.u.handleErrors(responseData,uuid); //a default error handling function that will try to put error message in correct spot or into a globalMessaging element, if set. Failing that, goes to modal.
					}
				}, //startMyProgram

			showRootCategories : {
				onSuccess : function(tagObj)	{
					app.ext.store_navcats.u.getChildDataOf('.',{'parentID':'categoryTree','callback':'addCatToDom','templateID':'catInfoTemplate','extension':'store_navcats'},'appCategoryDetailMore');  //generate left nav.
					app.model.dispatchThis();
					},
				onError : function(responseData,uuid)	{
	//throw some messaging at the user.  since the categories should have appeared in the left col, that's where we'll add the messaging.
					app.u.handleErrors(responseData,uuid);
					}
				}, //showRootCategories

			prodDebug : {
				onSuccess : function(tagObj)	{
//					app.u.dump("BEGIN myRIA.callbacks.prodDebug");
					$('#attribsDebugData').append(app.ext.myRIA.u.objExplore(app.data[tagObj.datapointer]['%attribs']));
					$('#variationsDebugData').append(app.ext.myRIA.u.objExplore(app.data[tagObj.datapointer]['@variations']));
					$('#inventoryDebugData').append(app.ext.myRIA.u.objExplore(app.data[tagObj.datapointer]['@inventory']));
					$('#prodDebugThumbs').append(app.ext.myRIA.u.prodDebugImageList(tagObj.datapointer));
					$('#tabs-5 li:odd').addClass('odd');
					},
				onError : function(responseData,uuid)	{
	//throw some messaging at the user.  since the categories should have appeared in the left col, that's where we'll add the messaging.
					app.u.handleErrors(responseData,uuid);
					}
				}, //prodDebug


			handleProfile : {
				onSuccess : function(tagObj)	{
					var dataSrc;
//not all data is at the root level.
					app.renderFunctions.translateTemplate(app.data[tagObj.datapointer],tagObj.parentID);
					$('#profileData').html(app.ext.myRIA.u.objExplore(app.data[tagObj.datapointer]));
					},
				onError : function(responseData,uuid)	{
	//throw some messaging at the user.  since the categories should have appeared in the left col, that's where we'll add the messaging.
					app.u.dump("BEGIN myRIA.callbacks.handleFlexedit.onError");
					app.u.handleErrors(responseData,uuid);
					}
				}, //handleProfile


			handleFlexedit : {
				onSuccess : function(tagObj)	{
					// do something
					},
				onError : function(responseData,uuid)	{
	//throw some messaging at the user.  since the categories should have appeared in the left col, that's where we'll add the messaging.
					app.u.dump("BEGIN myRIA.callbacks.handleFlexedit.onError");
					app.u.handleErrors(responseData,uuid);
					}
				}, //handleFlexedit
				
			handleElasticResults : {
				onSuccess : function(tagObj)	{
//					app.u.dump("BEGIN myRIA.callbacks.handleElasticResults.onSuccess.");
					var L = app.data[tagObj.datapointer]['_count'];
//					app.u.dump(" -> Number Results: "+L);
					$parent = $('#'+tagObj.parentID).empty().removeClass('loadingBG');
					if(L == 0)	{
						$parent.append("Your query returned zero results.");
						}
					else	{
						var pid;//recycled shortcut to product id.
						for(var i = 0; i < L; i += 1)	{
							pid = app.data[tagObj.datapointer].hits.hits[i]['_source']['pid'];
							$parent.append(app.renderFunctions.transmogrify({'id':pid,'pid':pid},'prodlistProdTemplate',app.data[tagObj.datapointer].hits.hits[i]['_source']));
							}
						}
					},
				onError : function(responseData,uuid)	{
					app.u.handleErrors(responseData,uuid)
					}
				}		//handleElasticResults	
				

				
			}, //callbacks

		a : {
			
			showSubcats : function(path)	{
//				app.u.dump("BEGIN myRIA.a.showSubcats ["+path+"]");
				var parentID = 'categoryTreeSubs_'+app.u.makeSafeHTMLId(path);
//				app.u.dump(" -> size() = "+$('#'+parentID+' li').size());
//once the parentID has children, the subcats have already been loaded. don't load them twice.
				if($('#'+parentID+' li').size() == 0)	{ 
					app.ext.store_navcats.u.getChildDataOf(path,{'parentID':parentID,'callback':'addCatToDom','templateID':'catInfoTemplate','extension':'store_navcats'},'appCategoryDetailMore');
					app.model.dispatchThis();
					}
				}, //showSubcats
			
			exploreProduct : function(pid)	{
				$('#attribsDebugData, #variationsDebugData ,#inventoryDebugData, #prodDebugThumbs').empty();
				app.ext.store_product.calls.appProductGet.init(pid,{'callback':'prodDebug','extension':'myRIA'});
				app.model.dispatchThis();
				},
			
			showItemsTaggedAs : function(tag)	{
				$('#tagList li').removeClass('ui-state-active'); //remove any previously active states from list item choiced.
				$('#'+tag).addClass('ui-state-active'); //add active state to list item now in focus.
				$('#tagProdlist').empty().addClass('loadingBG'); //empty results container so new list isn't appended to previous list, if present.
				app.ext.store_search.calls.appPublicProductSearch.init({'size':250,'mode':'elastic-native','filter':{'term':{'tags':tag}}},{'callback':'handleElasticResults','extension':'myRIA','datapointer':'appPublicSearch|'+tag,'parentID':'tagProdlist'});
				app.model.dispatchThis();
				}, //showItemsTaggedAs

			changeDomains : function()	{
				localStorage.clear(); //make sure local storage is empty so a new cart is automatically obtained.
				location.reload(true); //refresh page to restart experience.
				}

			}, //actions
		util : {
			
			buildTagsList : function(P)	{
				var $ul = $("<ul>").attr(P); //what is returned.
				var tags = new Array('IS_FRESH','IS_NEEDREVIEW','IS_HASERRORS','IS_CONFIGABLE','IS_COLORFUL','IS_SIZEABLE','IS_OPENBOX','IS_PREORDER','IS_DISCONTINUED','IS_SPECIALORDER','IS_BESTSELLER','IS_SALE','IS_SHIPFREE','IS_NEWARRIVAL','IS_CLEARANCE','IS_REFURB','IS_USER1','IS_USER2','IS_USER3','IS_USER4','IS_USER5','IS_USER6','IS_USER7','IS_USER8','IS_USER9');
				var $li;
				var L = tags.length;
				for(var i = 0; i < L; i += 1)	{
					$li = $("<li>").attr('id',tags[i]).addClass('ui-state-default').text(tags[i]).click(function(){
						app.ext.myRIA.a.showItemsTaggedAs(this.id);
						});
					$li.appendTo($ul);
					}
				return $ul;
				},
				
			prodDebugImageList : function(datapointer)	{
				var data = app.data[datapointer]['%attribs']
				var $div = $("<div>").attr('id','debugImageContainer');
				var filename;
				for(var i = 1; i < 10; i += 1)	{
					filename = data['zoovy:prod_image'+i];
					if(filename)	{
						$div.append("<figure>"+app.u.makeImage({"name":filename,"w":150,"b":"FFFFFF","tag":1})+"<figcaption>image"+i+": "+filename+"</figcaption>");
						
						}
					}
				return $div;
				},
			handleElasticFilterOrQuery : function()	{
				var quilter = $.parseJSON($('#advsrch_filterQuery').val()); //query/filter object
				if(quilter)	{
					app.ext.store_search.calls.appPublicProductSearch.init(quilter,{'callback':'handleElasticResults','extension':'myRIA','parentID':'elasticResults','datapointer':'elasticsearch|Test'});
					app.model.dispatchThis();
					}
				else	{
					alert('invalid json');
					}
				
				},
			
			objExplore : function(obj)	{
// 				app.u.dump("BEGIN myRIA.u.objExplore");
				var keys = new Array();
				for (var n in obj) {
					keys.push(n);
					}
				keys.sort();
				var L = keys.length;
				var $ul = $('<ul \/>');
				var $prompt,$value,$li;
				var r = '<ul>'; //what is returned. an html string of key/value pairs for obj passed in.
				for(var i = 0; i < L; i += 1)	{
					$li = $('<li>');
					$prompt = $('<span>').addClass('prompt').text(keys[i]).appendTo($li);
					
					if(typeof obj[keys[i]] == 'object')	{
						$value = app.ext.myRIA.u.objExplore(obj[keys[i]]);
						}
					else	{
						$value = $('<span>').addClass('value').text(obj[keys[i]]);
						}
					$value.appendTo($li);
					$li.appendTo($ul);
					}

				return $ul;
				}
			
			} //util

		} //r object.
	return r;
	}