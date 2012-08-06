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
An extension for working within the Zoovy UI.


finder -
'path' refers to either a category safe id (.safe.name) or a list safe id ($mylistid)
'safePath' is used for a jquery friendly id. ex: .safe.name gets converted to _safe_name and $mylistid to mylistid).


NOTE - admin 'set' calls are hard coded to use the immutable Q so that a dispatch is not overridden.

*/


var admin = function() {
// theseTemplates is it's own var because it's loaded in multiple places.
// here, only the most commonly used templates should be loaded. These get pre-loaded. Otherwise, load the templates when they're needed or in a separate extension (ex: admin_orders)
	var theseTemplates = new Array('adminProdStdForList','adminProdSimpleForList','adminElasticResult','adminProductFinder','adminMultiPage'); 
	var r = {
		
	vars : {
		"dependAttempts" : 0,  //used to count how many times loading the dependencies has been attempted.
//though most extensions don't have the templates specified, checkout does because so much of the code is specific to these templates.
		templates : theseTemplates,
		willFetchMyOwnTemplates : true,
		"tags" : ['IS_FRESH','IS_NEEDREVIEW','IS_HASERRORS','IS_CONFIGABLE','IS_COLORFUL','IS_SIZEABLE','IS_OPENBOX','IS_PREORDER','IS_DISCONTINUED','IS_SPECIALORDER','IS_BESTSELLER','IS_SALE','IS_SHIPFREE','IS_NEWARRIVAL','IS_CLEARANCE','IS_REFURB','IS_USER1','IS_USER2','IS_USER3','IS_USER4','IS_USER5','IS_USER6','IS_USER7','IS_USER8','IS_USER9'],
		"dependencies" : ['store_prodlist','store_navcats','store_product','store_search'] //a list of other extensions (just the namespace) that are required for this one to load
		},



					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



	calls : {


		appResource : {
			init : function(filename)	{
				this.dispatch(filename);
				},
			dispatch : function(filename)	{
				myControl.model.addDispatchToQ({"_cmd":"appResource","filename":filename,"_tag" : {"datapointer":"adminImageFolderList"}});	
				}
			
			}, 


		navcats : {
//myControl.ext.admin.calls.navcats.appCategoryDetailNoLocal.init(path,{},'immutable');
			appCategoryDetailNoLocal : {
				init : function(path,tagObj,Q)	{
					tagObj = typeof tagObj !== 'object' ? {} : tagObj;
					tagObj.datapointer = 'appCategoryDetail|'+path;
					this.dispatch(path,tagObj,Q);
					return 1;
					},
				dispatch : function(path,tagObj,Q)	{
					myControl.model.addDispatchToQ({"_cmd":"appCategoryDetail","safe":path,"detail":"fast","_tag" : tagObj},Q);	
					}
				}//appCategoryDetail
			
			}, //navcats

		mediaLib : {

			adminImageFolderList : {
				init : function()	{
					this.dispatch();
					},
				dispatch : function()	{
					myControl.model.addDispatchToQ({"_cmd":"adminImageFolderList","_tag" : {"datapointer":"adminImageFolderList"}});	
					}
				} //adminImageFolderList
			
			}, //mediaLib
			
		customer : {

			adminCustomerGet : {
				init : function(CID,tagObj,Q)	{
//					myControl.util.dump("CID: "+CID);
					var r = 0;
//if datapointer is fixed (set within call) it needs to be added prior to executing handleCallback (which needs datapointer to be set).
					tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
					tagObj.datapointer = "adminCustomerGet|"+CID;
					if(myControl.model.fetchData(tagObj.datapointer) == false)	{
						r = 1;
						this.dispatch(CID,tagObj,Q);
						}
					else	{
						myControl.util.handleCallback(tagObj);
						}
					return r;
					},
				dispatch : function(CID,tagObj,Q)	{
//					myControl.util.dump("CID: "+CID);
					var obj = {};
					tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
					obj["_cmd"] = "adminCustomerGet";
					obj["CID"] = CID;
					obj["_tag"] = tagObj;
					myControl.model.addDispatchToQ(obj,Q);
					}
				},
//myControl.ext.admin.calls.product.adminProductUpdate.init(pid,attrObj,tagObj,Q)
			adminCustomerSet : {
				init : function(CID,setObj,tagObj)	{
					this.dispatch(CID,setObj,tagObj)
					return 1;
					},
				dispatch : function(CID,setObj,tagObj)	{
					var obj = {};
					tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
					obj["_cmd"] = "adminProductUpdate";
					obj["CID"] = CID;
					obj['%set'] = setObj;
					obj["_tag"] = tagObj;
					myControl.model.addDispatchToQ(obj,'immutable');
					}
				}
			},
			
		product : {
			appProductGetNoLocal : {
				init : function(pid,tagObj,Q)	{
					this.dispatch(pid,tagObj,Q)
					return 1;
					},
				dispatch : function(pid,tagObj,Q)	{
					var obj = {};
					tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
					tagObj["datapointer"] = "appProductGet|"+pid; 
					obj["_cmd"] = "appProductGet";
					obj["pid"] = pid;
					obj["_tag"] = tagObj;
					myControl.model.addDispatchToQ(obj,Q);
					}
				},//appProductGetNoLocal
//myControl.ext.admin.calls.product.adminProductUpdate.init(pid,attrObj,tagObj,Q)
			adminProductUpdate : {
				init : function(pid,attrObj,tagObj)	{
					this.dispatch(pid,attrObj,tagObj)
					return 1;
					},
				dispatch : function(pid,attrObj,tagObj)	{
					var obj = {};
					tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
					obj["_cmd"] = "adminProductUpdate";
					obj["product"] = pid;
					obj['%attribs'] = attrObj;
					obj["_tag"] = tagObj;
					myControl.model.addDispatchToQ(obj,'immutable');
					}
				}
				
			}, //product
		finder : {
			
			adminNavcatProductInsert : {
				init : function(pid,position,path,tagObj)	{
					this.dispatch(pid,position,path,tagObj);
					return 1;
					},
				dispatch : function(pid,position,path,tagObj)	{
					var obj = {};
					obj['_tag'] = typeof tagObj == 'object' ? tagObj : {};
					obj['_cmd'] = "adminNavcatProductInsert";
					obj.product = pid;
					obj.path = path;
					obj.position = position;
					obj['_tag'].datapointer = "adminNavcatProductInsert|"+path+"|"+pid;
					myControl.model.addDispatchToQ(obj,'immutable');	
					}
				}, //adminNavcatProductInsert
			
			adminNavcatProductDelete : {
				init : function(pid,path,tagObj)	{
					this.dispatch(pid,path,tagObj);
					},
				dispatch : function(pid,path,tagObj)	{
					var obj = {};
					obj['_tag'] = typeof tagObj == 'object' ? tagObj : {};
					obj['_cmd'] = "adminNavcatProductDelete";
					obj.product = pid;
					obj.path = path;
					obj['_tag'].datapointer = "adminNavcatProductDelete|"+path+"|"+pid;
					myControl.model.addDispatchToQ(obj,'immutable');	
					}
				} //adminNavcatProductDelete
			
			} //finder

		}, //calls




					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration. Use this for any config or dependencies that need to occur.
//the callback is auto-executed as part of the extensions loading process.
		init : {
			onSuccess : function()	{
//				myControl.util.dump('BEGIN myControl.ext.admin.init.onSuccess ');
				var r = true; //return false if extension can't load. (no permissions, wrong type of session, etc)
//myControl.util.dump("DEBUG - template url is changed for local testing. add: ");
myControl.model.fetchNLoadTemplates('/biz/ajax/zmvc/201228/extensions/admin/templates.html',theseTemplates);

				return r;
				},
			onError : function(d)	{
//init error handling handled by controller.				
				}
			}, //init



		handleElasticFinderResults : {
			onSuccess : function(tagObj)	{
				myControl.util.dump("BEGIN admin.callbacks.handleElasticFinderResults.onSuccess.");
				var L = myControl.data[tagObj.datapointer]['_count'];
				$('#resultsKeyword').html(L+" results <span id='resultsListItemCount'></span>:");
				myControl.util.dump(" -> Number Results: "+L);
				$parent = $('#'+tagObj.parentID).empty().removeClass('loadingBG')
				if(L == 0)	{
					$parent.append("Your query returned zero results.");
					}
				else	{
					var pid;//recycled shortcut to product id.
					for(var i = 0; i < L; i += 1)	{
						pid = myControl.data[tagObj.datapointer].hits.hits[i]['_id'];
//						myControl.util.dump(" -> "+i+" pid: "+pid);
						$parent.append(myControl.renderFunctions.transmogrify({'id':pid,'pid':pid},'adminElasticResult',myControl.data[tagObj.datapointer].hits.hits[i]['_source']));
						}
					myControl.ext.admin.util.filterFinderResults();
					}
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},



//callback executed after the navcat data is retrieved. the util.addfinder does most of the work.
		addFinderToDom : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN admin.callback.addFinderToDom.success");
				myControl.ext.admin.util.addFinder(tagObj.targetID,myControl.data[tagObj.datapointer].id);
				$('#prodFinder').parent().find('.ui-dialog-title').text('Product Finder: '+myControl.data[tagObj.datapointer].pretty); //updates modal title
//				myControl.util.dump(tagObj);
				},
			onError : function(responseData,uuid)	{
				myControl.util.dump("BEGIN admin.callback.addFinderToDom.onError");
				myControl.util.handleErrors(responseData,uuid)
//				$('#'+d['_rtag'].targetID).removeClass('loadingBG').empty().append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //addFinderToDom

//callback executed after the appProductGet data is retrieved for creating a finder, specific to editing an attribute of a product (related items, for example)
		addPIDFinderToDom : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN admin.callback.addPIDFinderToDom.success");
				myControl.ext.admin.util.addFinder(tagObj.targetID,tagObj.path,tagObj.datapointer.split('|')[1]);
				$('#prodFinder').parent().find('.ui-dialog-title').text('Product Finder: '+myControl.data[tagObj.datapointer]['%attribs']['zoovy:prod_name']); //updates modal title
//				myControl.util.dump(tagObj);
				},
			onError : function(d)	{
				myControl.util.dump("BEGIN admin.callback.addPIDFinderToDom.onError");
				$('#'+d['_rtag'].targetID).removeClass('loadingBG').empty().append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //addPIDFinderToDom
			
//when a finder for a product attribute is executed, this is the callback.
		pidFinderChangesSaved : {
			onSuccess : function(tagObj)	{
				myControl.util.dump("BEGIN admin.callbacks.pidFinderChangesSaved");
				$('#finderMessaging').prepend(myControl.util.formatMessage({'message':'Your changes have been saved.','htmlid':'finderRequestResponse','uiIcon':'check','timeoutFunction':"$('#finderRequestResponse').slideUp(1000);"}))
				myControl.ext.admin.util.changeFinderButtonsState('enable'); //make buttons clickable
				},
			onError : function(d)	{
				$('#finderMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
				myControl.ext.admin.util.changeFinderButtonsState('enable');
				}
			
			}, //pidFinderChangesSaved
//when a finder for a category/list/etc is executed...
		finderChangesSaved : {
			onSuccess : function(tagObj)	{


myControl.util.dump("BEGIN admin.callbacks.finderChangesSaved");
var uCount = 0; //# of updates
var eCount = 0; //# of errros.
var eReport = ''; // a list of all the errors.

var $tmp;

$('#finderTargetList, #finderRemovedList').find("li[data-status]").each(function(){
	$tmp = $(this);
//	myControl.util.dump(" -> PID: "+$tmp.attr('data-pid')+" status: "+$tmp.attr('data-status'));
	if($tmp.attr('data-status') == 'complete')	{
		uCount += 1;
		$tmp.removeAttr('data-status'); //get rid of this so additional saves from same session are not impacted.
		}
	else if($tmp.attr('data-status') == 'error')	{
		eCount += 1;
		eReport += "<li>"+$tmp.attr('data-pid')+": "+myControl.data[$tmp.attr('data-pointer')].errmsg+" ("+myControl.data[$tmp.attr('data-pointer')].errid+"<\/li>";
		}
	});

myControl.util.dump(" -> items updated: "+uCount);
myControl.util.dump(" -> errors: "+eCount);
if(uCount > 0)	{
	$('#finderMessaging').prepend(myControl.util.formatMessage({'message':'Items Updated: '+uCount,'htmlid':'finderRequestResponse','uiIcon':'check','timeoutFunction':"$('#finderRequestResponse').slideUp(1000);"}))
	}

if(eCount > 0)	{
	$('#finderMessaging').prepend(myControl.util.formatMessage(eCount+' errors occured!<ul>'+eReport+'<\/ul>'));
	}

myControl.ext.admin.util.changeFinderButtonsState('enable'); //make buttons clickable



				},
			onError : function(d)	{
				$('#finderMessaging').append(myControl.util.getResponseErrors(d)).toggle(true);
				myControl.ext.admin.util.changeFinderButtonsState('enable');
				}
			}, //finderChangesSaved
		
//callback is used for the product finder search results.
		showProdlist : {
			onSuccess : function(tagObj)	{
				myControl.util.dump("BEGIN admin.callbacks.showProdlist");
				if($.isEmptyObject(myControl.data[tagObj.datapointer]['@products']))	{
					$('#'+tagObj.parentID).empty().removeClass('loadingBG').append('Your search returned zero results');
					}
				else	{
				myControl.util.dump(" -> parentID: "+tagObj.parentID);
				myControl.util.dump(" -> datapointer: "+tagObj.datapointer);
				var numRequests = myControl.ext.store_prodlist.util.buildProductList({
"templateID":"adminProdStdForList",
"parentID":tagObj.parentID,
"items_per_page":100,
"csv":myControl.data[tagObj.datapointer]['@products']
					});
//				myControl.util.dump(" -> numRequests = "+numRequests);
					if(numRequests)
						myControl.model.dispatchThis();
					}
				},
			onError : function(responseData,uuid)	{
				myControl.util.dump('BEGIN admin.callbacks.showProdlist.onError');
//				myControl.util.dump(d);
				myControl.util.handleErrors(responseData,uuid);
//				$('#finderSearchResults').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //showProdlist
		
			
//executed as part of a finder update for a category page. this is executed for each product.
//it simply changes the data-status appropriately, then the classback "finderChangesSaved" loops through the lists and handles messaging for all the updates.
		finderProductUpdate : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN admin.callbacks.finderProductUpdate.onSuccess");
//				myControl.util.dump(myControl.data[tagObj.datapointer]);
				var tmp = tagObj.datapointer.split('|'); // tmp1 is command and tmp1 is path and tmp2 is pid
				var targetID = tmp[0] == 'adminNavcatProductInsert' ? "finderTargetList" : "finderRemovedList";
				targetID += "_"+tmp[2];
//				myControl.util.dump(" -> targetID: "+targetID);
				$('#'+targetID).attr('data-status','complete');
				},
			onError : function(d)	{
//				myControl.util.dump("BEGIN admin.callbacks.finderProductUpdate.onError");
				var tmp = myControl.data[tagObj.datapointer].split('|'); // tmp0 is call, tmp1 is path and tmp2 is pid
//on an insert, the li will be in finderTargetList... but on a remove, the li will be in finderRemovedList_...
				var targetID = tmp[0] == 'adminNavcatProductInsert' ? "finderTargetList" : "finderRemovedList";
				
				targetID += "_"+tmp[2];
				$('#'+targetID).attr({'data-status':'error','data-pointer':tagObj.datapointer});
//				myControl.util.dump(d);
				}
			}, //finderProductUpdate

		filterFinderSearchResults : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN admin.callbacks.filterFinderSearchResults");
				var safePath = myControl.util.makeSafeHTMLId(tagObj.path);
				var $tmp;
//				myControl.util.dump(" -> safePath: "+safePath);
				//go through the results and if they are already in this category, disable drag n drop.
				$results = $('#finderSearchResults');
				//.find( "li" ).addClass( "ui-corner-all" ) )
				$results.find('li').each(function(){
					$tmp = $(this);
					if($('#finderTargetList_'+$tmp.attr('data-pid')).length > 0)	{
				//		myControl.util.dump(" -> MATCH! disable dragging.");
						$tmp.addClass('ui-state-disabled');
						}
					})
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid);
//				$('#finderSearchResults').append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			} //filterFinderSearchResults



		}, //callbacks

		validate : {}, //validate
		
		
		
////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		
		
		renderFormats : {
			
			elastimage1URL : function($tag,data)	{
//				myControl.util.dump(data.value[0]);
//				var L = data.bindData.numImages ? data.bindData.numImages : 1; //default to only showing 1 image.
//				for(var i = 0; i < L; i += 1)	{
//					}
				$tag.attr('src',myControl.util.makeImage({"name":data.value[0],"w":50,"h":50,"b":"FFFFFF","tag":0}));
				},
			
			array2ListItems : function($tag,data)	{
				var L = data.value.length;
				myControl.util.dump(" -> cleanValue for array2listItems");
				myControl.util.dump(data.value);
				var $o = $("<ul />"); //what is appended to tag. 
				for(var i = 0; i < L; i += 1)	{
					$o.append("<li>"+data.value[i]+"<\/li>");
					}
				$tag.append($o.children());
				},
			
			array2Template : function($tag,data)	{
//				myControl.util.dump("BEGIN admin.renderFormats.array2Template");
//				myControl.util.dump(data.value);
				var L = data.value.length;
				for(var i = 0; i < L; i += 1)	{
					$tag.append(myControl.renderFunctions.transmogrify({},data.bindData.loadsTemplate,data.value[i])); 
					}
				}
			
			},





////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



		action : {
/*
to generate an instance of the finder, run: 
myControl.ext.admin.action.addFinderTo() passing in targetID (the element you want the finder appended to) and path (a cat safe id or list id)

*/
			addFinderTo : function(targetID,path,sku)	{
				if(sku)	{
					myControl.ext.store_product.calls.appProductGet.init(sku,{"callback":"addPIDFinderToDom","extension":"admin","targetID":targetID,"path":path})
					}
				else	{
//Too many f'ing issues with using a local copy of the cat data.
					myControl.ext.admin.calls.navcats.appCategoryDetailNoLocal.init(path,{"callback":"addFinderToDom","extension":"admin","targetID":targetID})
					}
				myControl.model.dispatchThis();
				}, //addFinderTo

			showFinderInModal : function(path,sku)	{
				var $finderModal = $('#prodFinder');
//a finder has already been opened. empty it.
				if($finderModal.length > 0)	{
					$finderModal.empty();
					}
				else	{
					$finderModal = $('<div \/>').attr({'id':'prodFinder','title':'Product Finder'}).appendTo('body');
					}
//if the finder is for a product attribute, then add a data-sku so we can easily get the sku at any point.
//likewise, if it is NOT for a product, remove the data-pid (which may be present for a previously opened finder) to avoid any confusion down the road.
//data-pid is not used to avoid confusion. it's used on the li items in all the lists to denote which product they contain.
				if(sku){$finderModal.attr('data-sku',sku)}
				else{$finderModal.removeAttr('data-sku')}
				
				$finderModal.attr({'data-path':path}).dialog({modal:true,width:'94%',height:650});
				this.addFinderTo('prodFinder',path,sku);
				} //showFinderInModal

			}, //action




////////////////////////////////////   UTIL    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		util : {
			

			
			saveFinderChanges : function()	{
				myControl.util.dump("BEGIN admin.util.saveFinderChanges");
				var myArray = new Array();
				var $tmp;
				var $finderModal = $('#prodFinder')
				var path = $finderModal.attr('data-path');
				var sku = $finderModal.attr('data-sku');
//				myControl.util.dump(" -> path: "+path);
//				myControl.util.dump(" -> sku: "+sku);

/*
The process for updating a product vs a category are substantially different.  
for a product, everything goes up as one chunk as a comma separated list.
for a category, each sku added or removed is a separate request.
*/

				if(sku)	{
//finder for product attribute.
					var list = '';
					var attribute = myControl.renderFunctions.parseDataVar(path);
					$('#finderTargetList').find("li").each(function(index){
//make sure data-pid is set so 'undefined' isn't saved into the record.
						if($(this).attr('data-pid'))	{list += ','+$(this).attr('data-pid')}
						});
					if(list.charAt(0) == ','){ list = list.substr(1)} //remove ',' from start of list string.
					myControl.util.dump(" -> "+attribute+" = "+list);
					var attribObj = {};
					attribObj[attribute] = list;
					myControl.ext.admin.calls.product.adminProductUpdate.init(sku,attribObj,{'callback':'pidFinderChangesSaved','extension':'admin'});
					myControl.ext.admin.calls.product.appProductGetNoLocal.init(sku,{},'immutable');
					}
				else	{
// items removed need to go into the Q first so they're out of the remote list when updates start occuring. helps keep position correct.
$('#finderRemovedList').find("li").each(function(){
	$tmp = $(this);
	if($tmp.attr('data-status') == 'remove')	{
		myControl.ext.admin.calls.finder.adminNavcatProductDelete.init($tmp.attr('data-pid'),path,{"callback":"finderProductUpdate","extension":"admin"});
		$tmp.attr('data-status','queued')
		}
	});

//category/list based finder.
//concat both lists (updates and removed) and loop through looking for what's changed or been removed.				
$("#finderTargetList li").each(function(index){
	$tmp = $(this);
	myControl.util.dump(" -> pid: "+$tmp.attr('data-pid')+"; status: "+$tmp.attr('data-status')+"; index: "+index+"; $tmp.index(): "+$tmp.index());
	
	if($tmp.attr('data-status') == 'changed')	{
		$tmp.attr('data-status','queued')
		myControl.ext.admin.calls.finder.adminNavcatProductInsert.init($tmp.attr('data-pid'),index,path,{"callback":"finderProductUpdate","extension":"admin"});
		}
	else	{
//datastatus set but not to a valid value. maybe queued?
		}
	});
myControl.ext.admin.calls.navcats.appCategoryDetailNoLocal.init(path,{"callback":"finderChangesSaved","extension":"admin"},'immutable');
					}
				//dispatch occurs on save button, not here.
				}, //saveFinderChanges




			
//onclick, pass in a jquery object of the list item
			removePidFromFinder : function($listItem){
//myControl.util.dump("BEGIN admin.util.removePidFromFinder");
var path = $listItem.closest('[data-path]').attr('data-path');
//myControl.util.dump(" -> safePath: "+path);
var newLiID = 'finderRemovedList_'+$listItem.attr('data-pid');
//myControl.util.dump(" -> newLiID: "+newLiID);

if($('#'+newLiID).length > 0)	{
	//item is already in removed list.  set data-status to remove to ensure item is removed from list on save.
	$('#'+newLiID).attr('data-status','remove');
	}
else	{
	var $copy = $listItem.clone();
	$copy.attr({'id':newLiID,'data-status':'remove'}).appendTo('#finderRemovedList');
	}

//kill original.
$listItem.empty().remove();

myControl.ext.admin.util.updateFinderCurrentItemCount();

				}, //removePidFromFinder






/*
executed in a callback for a appCategoryDetail or a appProductGet.
generates an instance of the product finder.
targetID is the id of the element you want the finder added to. so 'bob' would add an instance of the finder to id='bob'
path is the list/category src (ex: .my.safe.id) or a product attribute [ex: product(zoovy:relateditems)].
if pid is passed into this function, the finder treats everything as though we're dealing with a product.
*/

			addFinder : function(targetID,path,pid){

myControl.util.dump("BEGIN admin.util.addFinder");
//jquery likes id's with no special characters.
var safePath = myControl.util.makeSafeHTMLId(path);
myControl.util.dump(" -> safePath: "+safePath);
var prodlist = new Array();

$target = $('#'+targetID).empty(); //empty to make sure we don't get two instances of finder if clicked again.
//create and translate the finder template. will populate any data-binds that are set that refrence the category namespace
$target.append(myControl.renderFunctions.createTemplateInstance('adminProductFinder',"productFinder_"+myControl.util.makeSafeHTMLId(path)));

if(pid)	{
	myControl.renderFunctions.translateTemplate(myControl.data['appProductGet|'+pid],"productFinder_"+safePath);
// !!! need to add a check here to see if the field is populated before doing a split.
//also need to look at path and get the actual field. this is hard coded for testing.
	var attribute = myControl.renderFunctions.parseDataVar(path);
	myControl.util.dump(" -> ATTRIBUTE: "+attribute);
//	myControl.util.dump(" -> aattribute value = "+myControl.data['appProductGet|'+pid]['%attribs'][attribute]);
	if(myControl.data['appProductGet|'+pid]['%attribs'][attribute])
		prodlist = myControl.data['appProductGet|'+pid]['%attribs'][attribute].split(',');
	}
else	{
	myControl.util.dump(" -> NON product attribute (no pid specified)");
	myControl.renderFunctions.translateTemplate(myControl.data['appCategoryDetail|'+path],"productFinder_"+safePath);
	prodlist = myControl.data['appCategoryDetail|'+path]['@products'];
	}

//myControl.util.dump(" -> path: "+path);
//myControl.util.dump(" -> prodlist: "+prodlist);

var numRequests = myControl.ext.store_prodlist.util.buildProductList({
	"templateID": prodlist.length < 200 ? "adminProdStdForList" : "adminProdSimpleForList",
	"items_per_page" : 500, //max out at 500 items
	"hide_multipage" : true, //disable multipage. won't play well w/ sorting, drag, indexing, etc
	"parentID":"finderTargetList",
//	"items_per_page":100,
	"csv":prodlist
	});
if(numRequests)
	myControl.model.dispatchThis();


// connect the results and targetlist together by class for 'sortable'.
//sortable/selectable example found here:  http://jsbin.com/aweyo5
$( "#finderTargetList , #finderSearchResults" ).sortable({
	connectWith:".connectedSortable",
	items: "li:not(.ui-state-disabled)",
	handle: ".handle",
/*
the 'stop' below is run when an item is dropped.
jquery automatically handles moving the item from one list to another, so all that needs to be done is changing some attributes.
the attributes are only changed if the item is dropped into the target list (as opposed to picked up and dropped elsewhere [cancelled])
this does NOT get executed when items are moved over via selectable and move buttons.
*/
	stop: function(event, ui) {
		var parent = ui.item.parent().attr('id')
//		myControl.util.dump(" -> parent id of dropped item: "+ui.item.parent().attr('id'));
		if(parent == 'finderTargetList')	{
			ui.item.attr({'data-status':'changed','id':'finderTargetList_'+ui.item.attr('data-pid')});
			}
		myControl.ext.admin.util.updateFinderCurrentItemCount();
		} 
	});

//make results panel list items selectable. 
//only 'li' is selectable otherwise clicking a child node will move just the child over.
// .ui-state-disabled is added to items in the results list that are already in the category list.
$("#finderSearchResults").selectable({ filter: 'li',filter: "li:not(.ui-state-disabled)" }); 
//make category product list only draggable within itself. (can't drag items out).
$("#finderTargetList").sortable( "option", "containment", 'parent' ); //.bind( "sortupdate", function(event, ui) {myControl.util.dump($(this).attr('id'))});
	

//set a data-finderAction on an element with a value of save, moveToTop or moveToBottom.
//save will save the changes. moveToTop will move selected product from the results over to the top of column the category list.
//moveToBottom will do the same as moveToTop except put the product at the bottom of the category.
$('#productFinder_'+safePath+' [data-finderAction]').each(function(){
	myControl.ext.admin.util.bindFinderButtons($(this),safePath);
	});

//bind the action on the search form.
$('#finderSearchForm').submit(function(event){
	myControl.ext.admin.util.handleFinderSearch();
	event.preventDefault();
	return false})
	myControl.ext.admin.util.updateFinderCurrentItemCount();


				
				}, //addFinder

//was used in the finder, but it isn't anymore or limited to this.
//returns an array of tags that were checked.
//idprefex will be prepended to the tag name. ex: idprefix = bob_, then id's bob_IS_FRESH will be checked.
			whichTagsAreChecked : function(idprefix)	{
				var r = new Array();
				var L = myControl.ext.admin.vars.tags.length;
				for(var i = 0; i < L; i += 1)	{
					if($('#'+idprefix+myControl.ext.admin.vars.tags[i]).is(':checked')){r.push(myControl.ext.admin.vars.tags[i])};
					}
				return r;
				},

			tagsAsCheckboxes : function(idprefix)	{
				var r = ''; //what is returned. a chunk of html. each tag with a checkbox.
				var L = myControl.ext.admin.vars.tags;
				for(var i = 0; i < L; i += 1)	{
					r += "<div><input type='checkbox' id='finderSearchFilter_"+myControl.ext.admin.vars.tags[i]+"' name='"+myControl.ext.admin.vars.tags[i]+"' /><label for='finderSearchFilter_"+myControl.ext.admin.vars.tags[i]+"'>"+myControl.ext.admin.vars.tags[i].toLowerCase()+"</label></div>"
					}
				return r;
				},

			updateFinderCurrentItemCount : function()	{
				$('#focusListItemCount').text(" ("+$("#finderTargetList li").size()+")");
				var resultsSize = $("#finderSearchResults li").size();
				if(resultsSize > 0)	{
					$('#resultsListItemCount').show(); //keeps the zero hidden on initial load.
					}
				$('#resultsListItemCount').text(" ("+resultsSize+" remain)")
				},

//need to be careful about not passing in an empty filter object because elastic doesn't like it. same for query.
			handleFinderSearch : function()	{
				$('#finderSearchResults').empty().addClass('loadingBG');
				var qObj = {}; //query object
				var columnValue = $('#finderSearchQuery').val();
				qObj.type = 'product';
				qObj.mode = 'elastic-native';
				qObj.size = 400;
				qObj.query =  {"query_string" : {"query" : columnValue}};
			
				//dispatch is handled by form submit binder
				myControl.ext.store_search.calls.appPublicSearch.init(qObj,{"callback":"handleElasticFinderResults","extension":"admin","parentID":"finderSearchResults","datapointer":"elasticsearch"});
				myControl.model.dispatchThis();
				},


//will 'disable' any item that is in the result set that already appears in the category or as a accessory/related item.
			filterFinderResults : function()	{
//				myControl.util.dump("BEGIN admin.callbacks.filterFinderSearchResults");
				var $tmp;
//go through the results and if they are already in this category, disable drag n drop.
				$results = $('#finderSearchResults');
				$results.find('li').each(function(){
					$tmp = $(this);
					if($('#finderTargetList_'+$tmp.attr('data-pid')).length > 0)	{
//						myControl.util.dump(" -> MATCH! disable dragging.");
						$tmp.addClass('ui-state-disabled');
						}
					})				
				
				}, //filterFinderResults

			changeFinderButtonsState : function(state)	{
				$dom = $('#prodFinder [data-finderaction]')
				if(state == 'enable')	{
					$dom.removeAttr('disabled').removeClass('ui-state-disabled')
					}
				else if(state == 'disable')	{
					$dom.attr('disabled','disabled').addClass('ui-state-disabled');
					}
				else	{
					//catch. unknown state.
					}
				}, //changeFinderButtonsState 


//run as part of addFinder. will bind click events to buttons with data-finderAction on them
			bindFinderButtons : function($button,safePath){
// ### Move search button into this too. 

//	myControl.util.dump(" -> finderAction found on element "+$button.attr('id'));
if($button.attr('data-finderAction') == 'save')	{

	$button.click(function(event){
		event.preventDefault();
		myControl.ext.admin.util.saveFinderChanges($button.attr('data-path'));
		myControl.model.dispatchThis('immutable');
		myControl.ext.admin.util.changeFinderButtonsState('disable');
		
		return false;
		});
	}
else if($button.attr('data-finderAction') == 'selectAll')	{
	$button.click(function(event){
		event.preventDefault();
		$('#finderSearchResults li').not('.ui-state-disabled').addClass('ui-selected');
		});
	}
//these two else if's are very similar. the important part is that when the items are moved over, the id is modified to match the targetCat 
//id's. That way when another search is done, the disable class is added correctly.
else if($button.attr('data-finderAction') == 'moveToTop' || $button.attr('data-finderAction') == 'moveToBottom'){
	$button.click(function(event){
		event.preventDefault();
		$('#finderSearchResults .ui-selected').each(function(){
			var $copy = $(this).clone();
			myControl.util.dump(" -> moving item "+$copy.attr('data-pid'));
			if($button.attr('data-finderAction') == 'moveToTop')
				$copy.prependTo('#finderTargetList')
			else
				$copy.appendTo('#finderTargetList')
			$copy.attr('data-status','changed'); //data-status is used to compile the list of changed items for the update request.
			$copy.removeClass('ui-selected').attr('id','finderTargetList_'+$copy.attr('data-pid'));
			$(this).remove();
			})
		myControl.ext.admin.util.updateFinderCurrentItemCount();
		return false;
		})
	}
else	{
	//catch.  really shouldn't get here.
	}


				} //bindFinderButtons



			}	//util

		} //r object.
	return r;
	}