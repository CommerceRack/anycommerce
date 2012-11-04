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


NOTE
 - admin 'set' calls are hard coded to use the immutable Q so that a dispatch is not overridden.
 - in the calls, 'dispatch' was removed and only init is present IF we never check local storage for the data.
*/


var admin = function() {
// theseTemplates is it's own var because it's loaded in multiple places.
// here, only the most commonly used templates should be loaded. These get pre-loaded. Otherwise, load the templates when they're needed or in a separate extension (ex: admin_orders)
	var theseTemplates = new Array('adminProdStdForList','adminProdSimpleForList','adminElasticResult','adminProductFinder','adminMultiPage'); 
	var r = {
		
	vars : {
		tab : null, //is set when switching between tabs. it outside 'state' because this doesn't get logged into local storage.
		state : {},
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
				app.model.addDispatchToQ({"_cmd":"appResource","filename":filename,"_tag" : {"datapointer":"adminImageFolderList"}});	
				}
			
			}, 


		navcats : {
//app.ext.admin.calls.navcats.appCategoryDetailNoLocal.init(path,{},'immutable');
			appCategoryDetailNoLocal : {
				init : function(path,tagObj,Q)	{
					tagObj = typeof tagObj !== 'object' ? {} : tagObj;
					tagObj.datapointer = 'appCategoryDetail|'+path;
					this.dispatch(path,tagObj,Q);
					return 1;
					},
				dispatch : function(path,tagObj,Q)	{
					app.model.addDispatchToQ({"_cmd":"appCategoryDetail","safe":path,"detail":"fast","_tag" : tagObj},Q);	
					}
				}//appCategoryDetail
			
			}, //navcats

		mediaLib : {

			adminImageFolderList : {
				init : function()	{
					this.dispatch();
					},
				dispatch : function()	{
					app.model.addDispatchToQ({"_cmd":"adminImageFolderList","_tag" : {"datapointer":"adminImageFolderList"}});	
					}
				} //adminImageFolderList
			
			}, //mediaLib
			
		customer : {

			adminCustomerGet : {
				init : function(CID,tagObj,Q)	{
//					app.u.dump("CID: "+CID);
					var r = 0;
//if datapointer is fixed (set within call) it needs to be added prior to executing handleCallback (which needs datapointer to be set).
					tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
					tagObj.datapointer = "adminCustomerGet|"+CID;
					if(app.model.fetchData(tagObj.datapointer) == false)	{
						r = 1;
						this.dispatch(CID,tagObj,Q);
						}
					else	{
						app.u.handleCallback(tagObj);
						}
					return r;
					},
				dispatch : function(CID,tagObj,Q)	{
//					app.u.dump("CID: "+CID);
					var obj = {};
					tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
					obj["_cmd"] = "adminCustomerGet";
					obj["CID"] = CID;
					obj["_tag"] = tagObj;
					app.model.addDispatchToQ(obj,Q);
					}
				},

			adminCustomerSet : {
				init : function(CID,setObj,tagObj)	{
					this.dispatch(CID,setObj,tagObj)
					return 1;
					},
				dispatch : function(CID,setObj,tagObj)	{
					var obj = {};
					tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
					obj["_cmd"] = "adminCustomerSet";
					obj["CID"] = CID;
					obj['%set'] = setObj;
					obj["_tag"] = tagObj;
					app.model.addDispatchToQ(obj,'immutable');
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
					app.model.addDispatchToQ(obj,Q);
					}
				},//appProductGetNoLocal
//app.ext.admin.calls.product.adminProductUpdate.init(pid,attrObj,tagObj,Q)
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
					app.model.addDispatchToQ(obj,'immutable');
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
					app.model.addDispatchToQ(obj,'immutable');	
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
					app.model.addDispatchToQ(obj,'immutable');	
					}
				} //adminNavcatProductDelete
			
			}, //finder




//obj requires sub and sref.  sub can be LOAD or SAVE
			adminUIBuilderPanelExecute : {
				init : function(obj,tagObj,Q)	{
					tagObj = tagObj || {};
					if(obj['sub'] == 'EDIT')	{
						tagObj.datapointer = "adminUIBuilderPanelExecute";
						}
					this.dispatch(obj,tagObj,Q);
					},
				dispatch : function(obj,tagObj,Q)	{
					obj['_cmd'] = "adminUIBuilderPanelExecute";
//					obj['_SREF'] = "BAcEMTIzNAQEBAgZAAcAAAAKBFBBR0UCBgAAAEZPUk1BVAoBMQILAAAAX2lzX3ByZXZpZXcKAUECAgAAAEZTFwthYm91dF8zcGljcwIFAAAARE9DSUQKB2Fib3V0dXMCAgAAAFBHCgdERUZBVUxUAgIAAABOUwoBMAIDAAAAUFJU"; /// !!! DO NOT HARD CODE THIS
					obj["_tag"] = tagObj;
					app.model.addDispatchToQ(obj,Q);
					}
				} //adminUIProductPanelList

		}, //calls




					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration. Use this for any config or dependencies that need to occur.
//the callback is auto-executed as part of the extensions loading process.
		init : {
			onSuccess : function()	{
				app.u.dump('BEGIN app.ext.admin.init.onSuccess ');
				var r = true; //return false if extension can't load. (no permissions, wrong type of session, etc)
//app.u.dump("DEBUG - template url is changed for local testing. add: ");
app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/templates.html',theseTemplates);


app.rq.push(['css',0,'https://www.zoovy.com/biz/ajax/showLoading/css/showLoading.css']);
app.rq.push(['css',0,'https://www.zoovy.com/biz/ajax/flexigrid-1.1/css/flexigrid.pack.css']);
app.rq.push(['css',0,'https://www.zoovy.com/biz/ajax/jquery.qtip-1.0.0-rc3/jquery.qtip.min.css']);
app.rq.push(['css',0,'https://www.zoovy.com/biz/ajax/jquery.contextMenu/jquery.contextMenu.css']);

				return r;
				},
			onError : function(d)	{
//init error handling handled by controller.				
				}
			}, //init


		showDataHTML : {
			onSuccess : function(tagObj)	{
//				app.u.dump("SUCCESS!"); app.u.dump(tagObj);
				$('#'+tagObj.targetID).removeClass('loadingBG').html(app.data[tagObj.datapointer].html); //.wrap("<form id='bob'>");

				}
			}, //init

		initUserInterface : {
			onSuccess : function()	{
				app.u.dump('BEGIN app.ext.admin.initUserInterface.onSuccess ');
				var L = app.rq.length-1;
//				die();
				for(var i = L; i >= 0; i -= 1)	{
					app.u.handleResourceQ(app.rq[i]);
					app.rq.splice(i, 1); //remove once handled.
					}
				app.rq.push = app.u.handleResourceQ; //reassign push function to auto-add the resource.

				$('.bindByAnchor','#mastHead').click(function(event){
					event.preventDefault();
					showUI($(this).attr('href'));
					})

				window.navigateTo = app.ext.admin.a.navigateTo;
				window.showUI = app.ext.admin.a.showUI;
				window.loadElement = app.ext.admin.a.loadElement;

				$('.username').text(app.vars.username);
				
				//yes, this is global.
				$loadingModal = $('<div />').attr('id','loadingModal').addClass('loadingBG displayNone');
				$loadingModal.appendTo('body').dialog({'autoOpen':false});
				}
			},

		handleElasticFinderResults : {
			onSuccess : function(tagObj)	{
				app.u.dump("BEGIN admin.callbacks.handleElasticFinderResults.onSuccess.");
				var L = app.data[tagObj.datapointer]['_count'];
				$('#resultsKeyword').html(L+" results <span id='resultsListItemCount'></span>:");
				app.u.dump(" -> Number Results: "+L);
				$parent = $('#'+tagObj.parentID).empty().removeClass('loadingBG')
				if(L == 0)	{
					$parent.append("Your query returned zero results.");
					}
				else	{
					var pid;//recycled shortcut to product id.
					for(var i = 0; i < L; i += 1)	{
						pid = app.data[tagObj.datapointer].hits.hits[i]['_id'];
//						app.u.dump(" -> "+i+" pid: "+pid);
						$parent.append(app.renderFunctions.transmogrify({'id':pid,'pid':pid},'adminElasticResult',app.data[tagObj.datapointer].hits.hits[i]['_source']));
						}
					app.ext.admin.u.filterFinderResults();
					}
				}
			}, //handleElasticFinderResults



//callback executed after the navcat data is retrieved. the u.addfinder does most of the work.
		addFinderToDom : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN admin.callback.addFinderToDom.success");
				app.ext.admin.u.addFinder(tagObj.targetID,app.data[tagObj.datapointer].id);
				$('#prodFinder').parent().find('.ui-dialog-title').text('Product Finder: '+app.data[tagObj.datapointer].pretty); //updates modal title
//				app.u.dump(tagObj);
				}
			}, //addFinderToDom

//callback executed after the appProductGet data is retrieved for creating a finder, specific to editing an attribute of a product (related items, for example)
		addPIDFinderToDom : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN admin.callback.addPIDFinderToDom.success");
				app.ext.admin.u.addFinder(tagObj.targetID,tagObj.path,tagObj.datapointer.split('|')[1]);
				$('#prodFinder').parent().find('.ui-dialog-title').text('Product Finder: '+app.data[tagObj.datapointer]['%attribs']['zoovy:prod_name']+" ("+app.renderFunctions.parseDataVar(tagObj.path)+")"); //updates modal title
//				app.u.dump(tagObj);
				}
			}, //addPIDFinderToDom
			
//when a finder for a product attribute is executed, this is the callback.
		pidFinderChangesSaved : {
			onSuccess : function(tagObj)	{
				app.u.dump("BEGIN admin.callbacks.pidFinderChangesSaved");
				$('#finderMessaging').prepend(app.u.formatMessage({'message':'Your changes have been saved.','htmlid':'finderRequestResponse','uiIcon':'check','timeoutFunction':"$('#finderRequestResponse').slideUp(1000);"}))
				app.ext.admin.u.changeFinderButtonsState('enable'); //make buttons clickable
				},
			onError : function(responseData)	{
				responseData.parentID = "finderMessaging";
				app.u.throwMessage(responseData);
				app.ext.admin.u.changeFinderButtonsState('enable');
				}
			
			}, //pidFinderChangesSaved
//when a finder for a category/list/etc is executed...

		finderChangesSaved : {
			onSuccess : function(tagObj)	{


app.u.dump("BEGIN admin.callbacks.finderChangesSaved");
var uCount = 0; //# of updates
var eCount = 0; //# of errros.
var eReport = ''; // a list of all the errors.

var $tmp;

$('#finderTargetList, #finderRemovedList').find("li[data-status]").each(function(){
	$tmp = $(this);
//	app.u.dump(" -> PID: "+$tmp.attr('data-pid')+" status: "+$tmp.attr('data-status'));
	if($tmp.attr('data-status') == 'complete')	{
		uCount += 1;
		$tmp.removeAttr('data-status'); //get rid of this so additional saves from same session are not impacted.
		}
	else if($tmp.attr('data-status') == 'error')	{
		eCount += 1;
		eReport += "<li>"+$tmp.attr('data-pid')+": "+app.data[$tmp.attr('data-pointer')].errmsg+" ("+app.data[$tmp.attr('data-pointer')].errid+"<\/li>";
		}
	});

app.u.dump(" -> items updated: "+uCount);
app.u.dump(" -> errors: "+eCount);
if(uCount > 0)	{
	$('#finderMessaging').prepend(app.u.formatMessage({'message':'Items Updated: '+uCount,'htmlid':'finderRequestResponse','uiIcon':'check','timeoutFunction':"$('#finderRequestResponse').slideUp(1000);"}))
	}

if(eCount > 0)	{
	$('#finderMessaging').prepend(app.u.formatMessage(eCount+' errors occured!<ul>'+eReport+'<\/ul>'));
	}

app.ext.admin.u.changeFinderButtonsState('enable'); //make buttons clickable



				},
			onError : function(responseData)	{
				responseData.parentID = "finderMessaging";
				app.u.throwMessage(responseData);
				app.ext.admin.u.changeFinderButtonsState('enable');
				}
			}, //finderChangesSaved
		
//callback is used for the product finder search results.
		showProdlist : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN admin.callbacks.showProdlist");
				if($.isEmptyObject(app.data[tagObj.datapointer]['@products']))	{
					$('#'+tagObj.parentID).empty().removeClass('loadingBG').append('Your search returned zero results');
					}
				else	{
//				app.u.dump(" -> parentID: "+tagObj.parentID);
//				app.u.dump(" -> datapointer: "+tagObj.datapointer);
				var numRequests = app.ext.store_prodlist.u.buildProductList({
"templateID":"adminProdStdForList",
"parentID":tagObj.parentID,
"items_per_page":100,
"csv":app.data[tagObj.datapointer]['@products']
					});
//				app.u.dump(" -> numRequests = "+numRequests);
					if(numRequests)
						app.model.dispatchThis();
					}
				}
			}, //showProdlist
		
			
//executed as part of a finder update for a category page. this is executed for each product.
//it simply changes the data-status appropriately, then the classback "finderChangesSaved" loops through the lists and handles messaging for all the updates.
		finderProductUpdate : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN admin.callbacks.finderProductUpdate.onSuccess");
//				app.u.dump(app.data[tagObj.datapointer]);
				var tmp = tagObj.datapointer.split('|'); // tmp1 is command and tmp1 is path and tmp2 is pid
				var targetID = tmp[0] == 'adminNavcatProductInsert' ? "finderTargetList" : "finderRemovedList";
				targetID += "_"+tmp[2];
//				app.u.dump(" -> targetID: "+targetID);
				$('#'+targetID).attr('data-status','complete');
				},
			onError : function(d)	{
//				app.u.dump("BEGIN admin.callbacks.finderProductUpdate.onError");
				var tmp = app.data[tagObj.datapointer].split('|'); // tmp0 is call, tmp1 is path and tmp2 is pid
//on an insert, the li will be in finderTargetList... but on a remove, the li will be in finderRemovedList_...
				var targetID = tmp[0] == 'adminNavcatProductInsert' ? "finderTargetList" : "finderRemovedList";
				
				targetID += "_"+tmp[2];
				$('#'+targetID).attr({'data-status':'error','data-pointer':tagObj.datapointer});
//				app.u.dump(d);
				}
			}, //finderProductUpdate




		filterFinderSearchResults : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN admin.callbacks.filterFinderSearchResults");
				var safePath = app.u.makeSafeHTMLId(tagObj.path);
				var $tmp;
//				app.u.dump(" -> safePath: "+safePath);
				//go through the results and if they are already in this category, disable drag n drop.
				$results = $('#finderSearchResults');
				//.find( "li" ).addClass( "ui-corner-all" ) )

				$results.find('li').each(function(){
					$tmp = $(this);
					if($('#finderTargetList_'+$tmp.attr('data-pid')).length > 0)	{
				//		app.u.dump(" -> MATCH! disable dragging.");
						$tmp.addClass('ui-state-disabled');
						}
					})
				}
			} //filterFinderSearchResults



		}, //callbacks

	
		
////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		
		
	renderFormats : {
		
		elastimage1URL : function($tag,data)	{
//				app.u.dump(data.value[0]);
//				var L = data.bindData.numImages ? data.bindData.numImages : 1; //default to only showing 1 image.
//				for(var i = 0; i < L; i += 1)	{
//					}
			$tag.attr('src',app.u.makeImage({"name":data.value[0],"w":50,"h":50,"b":"FFFFFF","tag":0}));
			},
		
	
		array2ListItems : function($tag,data)	{
			var L = data.value.length;
			app.u.dump(" -> cleanValue for array2listItems");
			app.u.dump(data.value);
			var $o = $("<ul />"); //what is appended to tag. 
			for(var i = 0; i < L; i += 1)	{
				$o.append("<li>"+data.value[i]+"<\/li>");
				}
			$tag.append($o.children());
			},
		
		array2Template : function($tag,data)	{
//				app.u.dump("BEGIN admin.renderFormats.array2Template");
//				app.u.dump(data.value);
			var L = data.value.length;
			for(var i = 0; i < L; i += 1)	{
				$tag.append(app.renderFunctions.transmogrify({},data.bindData.loadsTemplate,data.value[i])); 
				}
			}
		
		}, //renderFormats





////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		a : {

			showUI : function(path,P)	{
				app.u.dump("BEGIN admin.a.showUI ["+path+"]");
				$('html, body').animate({scrollTop : 0},1000);
//				$loadingModal.dialog('open');
				P = P || {};
				if(path)	{
					$('title').text(path);
					
					
					var tab = app.ext.admin.u.getTabFromPath(path);
					P.targetID = app.ext.admin.u.getId4UIContent(path)
					var $target = $('#'+P.targetID);

//					app.u.dump(" -> tab: "+tab); app.u.dump(" -> targetid: "+P.targetID);
					
					$(".tabContent",'#appView').hide(); //hide all tab contents
					$target.show(); //show focus tab.
						
					if($target.children().length === 0)	{
						//this means the section has NOT been opened before.
						app.u.dump(" -> section has NOT been rendered before. Render it.");
						app.ext.admin.u.handleShowSection(path,P,$target);
						}
					else if(tab == app.ext.admin.vars.tab)	{
						//we are moving within the same section.
						app.u.dump(" -> Moving within same section, Render it.");
						app.ext.admin.u.handleShowSection(path,P,$target);
						}
					else	{
						//jumping between sections. content has already been displayed by here. do nothing.

						}

					app.ext.admin.vars.tab = tab; //do this last so that the previously selected tab can be used.
					}
				else	{
					app.u.throwMessage("Warning! a required param for showUI was not set. path: '"+path+"' and typeof "+obj);
					}
				return false;
				},

//this is a function that brian has in the UI on some buttons.
//it's diferent than showUI so we can add extra functionality if needed.
			navigateTo : function(path)	{
				this.showUI(path);
				},


//used in the builder for when 'edit' is clicked on an element.
//Params are set by B. This is for legacy support in the UI.

			loadElement : function(type,eleID){
				app.ext.admin.calls.adminUIBuilderPanelExecute.init({'sub':'EDIT','id':eleID},{'callback':'showDataHTML','extension':'admin','targetID':'elementEditor'});
				app.model.dispatchThis();
				var $editor = $('#elementEditor');
				if($editor.length)	{
					$editor.empty(); //modal already exists. empty previous content. Currently, one editor at a time.
					} 
				else	{
					$editor = $("<div \/>").attr('id','elementEditor').appendTo('body');
					$editor.dialog({autoOpen:false,dialog:true});
					}
				$editor.dialog('open').addClass('loadingBG');
				},


/*
to generate an instance of the finder, run: 
app.ext.admin.a.addFinderTo() passing in targetID (the element you want the finder appended to) and path (a cat safe id or list id)

*/
			addFinderTo : function(targetID,path,sku)	{
				if(sku)	{
					app.ext.store_product.calls.appProductGet.init(sku,{"callback":"addPIDFinderToDom","extension":"admin","targetID":targetID,"path":path})
					}
				else	{
//Too many f'ing issues with using a local copy of the cat data.
					app.ext.admin.calls.navcats.appCategoryDetailNoLocal.init(path,{"callback":"addFinderToDom","extension":"admin","targetID":targetID})
					}
				app.model.dispatchThis();
				}, //addFinderTo
				
				
				
//path - category safe id or product attribute in data-bind format:    product(zoovy:accessory_products)
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




////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
			
//executed from within showUI. probably never want to execute this function elsewhere.
			handleShowSection : function(path,P,$target)	{
				var tab = app.ext.admin.u.getTabFromPath(path);
				if(tab == 'product')	{
					app.u.dump(" -> open product editor");
					app.ext.admin_prodEdit.u.showProductEditor(path,P);
					}
				else	{
//					app.u.dump(" -> open something wonderful...");
					$target.empty().append("<div class='loadingBG'></div>");
					app.model.fetchAdminResource(path,P);
					}
				},

			getId4UIContent : function(path){
				return this.getTabFromPath(path)+"Content";
				},
			
			getTabFromPath : function(path)	{
				return path.split("/")[2];
				},
			
			uiHandleMessages : function(path,msg)	{
//				app.u.dump("BEGIN admin.u.uiHandleMessages ["+path+"]");
				if(msg)	{
					var L = msg.length;
					var msgType, msgObj; //recycled.
					var tab = this.getTabFromPath(path);
					for(var i = 0; i < L; i += 1)	{
						msgObj = app.u.uiMsgObject(msg[i]);
						msgObj.persistant = true; //for testing, don't hide.
						msgObj.parentID = tab+"Content"; //put messaging in tab specific area.
						app.u.throwMessage(msgObj);
						}
					}
				else	{
					//no message. it happens sometimes.
					}
				},
			
			uiHandleBreadcrumb : function(bc)	{
				var $target = $('#breadcrumb').empty(); //always empty to make sure the last set isn't displayed (the new page may not have bc)
				if(bc)	{
					var L = bc.length;
					for(var i = 0; i < L; i += 1)	{
						if(i){$target.append(" &#187; ")}
						if(bc[i]['link'])	{
							$target.append("<a href='#' onClick='return showUI(\""+bc[i]['link']+"\");' title='"+bc[i].name+"'>"+bc[i].name+"<\/a>");
							}
						else	{
							$target.append(bc[i].name);
							}
						}
					}
				else	{
					app.u.dump("WARNING! admin.u.handleBreadcrumb bc is blank. this may be normal.");
					}
				},

			uiHandleNavTabs : function(tabs)	{
				var $target = $('#navTabs').empty(); //always empty to make sure the last set isn't displayed (the new page may not have tabs)
				if(tabs)	{
					var L = tabs.length;
					var className; //recycled in loop.
					for(var i = 0; i < L; i += 1)	{
						className = tabs[i].selected ? 'header_sublink_active' : 'header_sublink'
						$target.append("<a href='#' onClick='return showUI(\""+tabs[i]['link']+"\");' title='"+tabs[i].name+"' class='"+className+"'><span>"+tabs[i].name+"<\/span><\/a>");
						}
					}
				else	{
					app.u.dump("WARNING! admin.u.uiHandleNavTabs tabs is blank. this may be normal.");
					}
				},

			uiHandleFormRewrites : function(path,data,viewObj)	{
//				app.u.dump("BEGIN admin.u.uiHandleFormRewrites");
//				app.u.dump(" -> data: "); app.u.dump(data);
//				app.u.dump(" -> viewObj: "); app.u.dump(viewObj);
				var $target = $('#'+viewObj.targetID)
				$target.html(data.html);
//any form elements in the response have their actions rewritten.
				$('form',$target).submit(function(event){
//					app.u.dump(" -> Executing custom form submit.");
					event.preventDefault();
					var jsonObj = $(this).serializeJSON();
//					app.u.dump(" -> jsonObj: "); app.u.dump(jsonObj);
					app.model.fetchAdminResource(path,{},jsonObj); //handles the save.
					return false;
					}); //submit
				},
			
			uiHandleLinkRewrites : function(path,data,viewObj)	{
//				app.u.dump("BEGIN admin.u.uiHandleLinkRewrites("+path+")");
				var $target = $('#'+viewObj.targetID)
				$('a',$target).click(function(event){
					var href = $(this).attr('href');
					$(this).attr('title',href); // HERE FOR TESTING
					if(href.indexOf("/biz/") == 0)	{
						event.preventDefault();
						return showUI(href);
						}
//this could happen in the website builder where the 'edit' links are not fully pathed.
					else if(href.indexOf("index.cgi?") == 0)	{
						event.preventDefault();
						return showUI(path+'?'+href.split('?')[1]); //passes params to whatever the parent path was.
						}
					else	{
						//no match.
						}
					});
				},
			
			saveFinderChanges : function()	{
//				app.u.dump("BEGIN admin.u.saveFinderChanges");
				var myArray = new Array();
				var $tmp;
				var $finderModal = $('#prodFinder')
				var path = $finderModal.attr('data-path');
				var sku = $finderModal.attr('data-sku');
//				app.u.dump(" -> path: "+path);
//				app.u.dump(" -> sku: "+sku);

/*
The process for updating a product vs a category are substantially different.  
for a product, everything goes up as one chunk as a comma separated list.
for a category, each sku added or removed is a separate request.
*/

				if(sku)	{
//finder for product attribute.
					var list = '';
					var attribute = app.renderFunctions.parseDataVar(path);
					$('#finderTargetList').find("li").each(function(index){
//make sure data-pid is set so 'undefined' isn't saved into the record.
						if($(this).attr('data-pid'))	{list += ','+$(this).attr('data-pid')}
						});
					if(list.charAt(0) == ','){ list = list.substr(1)} //remove ',' from start of list string.
					app.u.dump(" -> "+attribute+" = "+list);
					var attribObj = {};
					attribObj[attribute] = list;
					app.ext.admin.calls.product.adminProductUpdate.init(sku,attribObj,{'callback':'pidFinderChangesSaved','extension':'admin'});
					app.ext.admin.calls.product.appProductGetNoLocal.init(sku,{},'immutable');
					}
				else	{
// items removed need to go into the Q first so they're out of the remote list when updates start occuring. helps keep position correct.
$('#finderRemovedList').find("li").each(function(){
	$tmp = $(this);
	if($tmp.attr('data-status') == 'remove')	{
		app.ext.admin.calls.finder.adminNavcatProductDelete.init($tmp.attr('data-pid'),path,{"callback":"finderProductUpdate","extension":"admin"});
		$tmp.attr('data-status','queued')
		}
	});

//category/list based finder.
//concat both lists (updates and removed) and loop through looking for what's changed or been removed.				
$("#finderTargetList li").each(function(index){
	$tmp = $(this);
//	app.u.dump(" -> pid: "+$tmp.attr('data-pid')+"; status: "+$tmp.attr('data-status')+"; index: "+index+"; $tmp.index(): "+$tmp.index());
	
	if($tmp.attr('data-status') == 'changed')	{
		$tmp.attr('data-status','queued')
		app.ext.admin.calls.finder.adminNavcatProductInsert.init($tmp.attr('data-pid'),index,path,{"callback":"finderProductUpdate","extension":"admin"});
		}
	else	{
//datastatus set but not to a valid value. maybe queued?
		}
	});
app.ext.admin.calls.navcats.appCategoryDetailNoLocal.init(path,{"callback":"finderChangesSaved","extension":"admin"},'immutable');
					}
				//dispatch occurs on save button, not here.
				}, //saveFinderChanges






//onclick, pass in a jquery object of the list item
			removePidFromFinder : function($listItem){
//app.u.dump("BEGIN admin.u.removePidFromFinder");
var path = $listItem.closest('[data-path]').attr('data-path');
//app.u.dump(" -> safePath: "+path);
var newLiID = 'finderRemovedList_'+$listItem.attr('data-pid');
//app.u.dump(" -> newLiID: "+newLiID);

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

app.ext.admin.u.updateFinderCurrentItemCount();

				}, //removePidFromFinder






/*
executed in a callback for a appCategoryDetail or a appProductGet.
generates an instance of the product finder.
targetID is the id of the element you want the finder added to. so 'bob' would add an instance of the finder to id='bob'
path is the list/category src (ex: .my.safe.id) or a product attribute [ex: product(zoovy:relateditems)].
if pid is passed into this function, the finder treats everything as though we're dealing with a product.
*/

			addFinder : function(targetID,path,pid){

app.u.dump("BEGIN admin.u.addFinder");
//jquery likes id's with no special characters.
var safePath = app.u.makeSafeHTMLId(path);
app.u.dump(" -> safePath: "+safePath);
var prodlist = new Array();

var $target = $('#'+targetID).empty(); //empty to make sure we don't get two instances of finder if clicked again.
//create and translate the finder template. will populate any data-binds that are set that refrence the category namespace
$target.append(app.renderFunctions.createTemplateInstance('adminProductFinder',"productFinder_"+app.u.makeSafeHTMLId(path)));

if(pid)	{
	app.renderFunctions.translateTemplate(app.data['appProductGet|'+pid],"productFinder_"+safePath);
// !!! need to add a check here to see if the field is populated before doing a split.
//also need to look at path and get the actual field. this is hard coded for testing.
	var attribute = app.renderFunctions.parseDataVar(path);
	app.u.dump(" -> ATTRIBUTE: "+attribute);
//	app.u.dump(" -> aattribute value = "+app.data['appProductGet|'+pid]['%attribs'][attribute]);
	if(app.data['appProductGet|'+pid]['%attribs'][attribute])
		prodlist = app.ext.store_prodlist.u.handleAttributeProductList(app.data['appProductGet|'+pid]['%attribs'][attribute]);
	}
else	{
	app.u.dump(" -> NON product attribute (no pid specified)");
	app.renderFunctions.translateTemplate(app.data['appCategoryDetail|'+path],"productFinder_"+safePath);
	prodlist = app.data['appCategoryDetail|'+path]['@products'];
	}

//app.u.dump(" -> path: "+path);
//app.u.dump(" -> prodlist: "+prodlist);

var numRequests = app.ext.store_prodlist.u.buildProductList({
	"templateID": prodlist.length < 200 ? "adminProdStdForList" : "adminProdSimpleForList",
	"items_per_page" : 500, //max out at 500 items
	"hide_multipage" : true, //disable multipage. won't play well w/ sorting, drag, indexing, etc
	"parentID":"finderTargetList",
//	"items_per_page":100,
	"csv":prodlist
	});
if(numRequests)
	app.model.dispatchThis();


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
//		app.u.dump(" -> parent id of dropped item: "+ui.item.parent().attr('id'));
		if(parent == 'finderTargetList')	{
			ui.item.attr({'data-status':'changed','id':'finderTargetList_'+ui.item.attr('data-pid')});
			}
		app.ext.admin.u.updateFinderCurrentItemCount();
		} 
	});

//make results panel list items selectable. 
//only 'li' is selectable otherwise clicking a child node will move just the child over.
// .ui-state-disabled is added to items in the results list that are already in the category list.
$("#finderSearchResults").selectable({ filter: 'li',filter: "li:not(.ui-state-disabled)" }); 
//make category product list only draggable within itself. (can't drag items out).
$("#finderTargetList").sortable( "option", "containment", 'parent' ); //.bind( "sortupdate", function(event, ui) {app.u.dump($(this).attr('id'))});
	

//set a data-finderAction on an element with a value of save, moveToTop or moveToBottom.
//save will save the changes. moveToTop will move selected product from the results over to the top of column the category list.
//moveToBottom will do the same as moveToTop except put the product at the bottom of the category.
$('#productFinder_'+safePath+' [data-finderAction]').each(function(){
	app.ext.admin.u.bindFinderButtons($(this),safePath);
	});

//bind the action on the search form.
$('#finderSearchForm').submit(function(event){
	app.ext.admin.u.handleFinderSearch();
	event.preventDefault();
	return false})
	app.ext.admin.u.updateFinderCurrentItemCount();


				
				}, //addFinder

//was used in the finder, but it isn't anymore or limited to this.
//returns an array of tags that were checked.
//idprefex will be prepended to the tag name. ex: idprefix = bob_, then id's bob_IS_FRESH will be checked.
			whichTagsAreChecked : function(idprefix)	{
				var r = new Array();
				var L = app.ext.admin.vars.tags.length;
				for(var i = 0; i < L; i += 1)	{
					if($('#'+idprefix+app.ext.admin.vars.tags[i]).is(':checked')){r.push(app.ext.admin.vars.tags[i])};
					}
				return r;
				},

			tagsAsCheckboxes : function(idprefix)	{
				var r = ''; //what is returned. a chunk of html. each tag with a checkbox.
				var L = app.ext.admin.vars.tags;
				for(var i = 0; i < L; i += 1)	{
					r += "<div><input type='checkbox' id='finderSearchFilter_"+app.ext.admin.vars.tags[i]+"' name='"+app.ext.admin.vars.tags[i]+"' /><label for='finderSearchFilter_"+app.ext.admin.vars.tags[i]+"'>"+app.ext.admin.vars.tags[i].toLowerCase()+"</label></div>"
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
				app.ext.store_search.calls.appPublicSearch.init(qObj,{"callback":"handleElasticFinderResults","extension":"admin","parentID":"finderSearchResults","datapointer":"elasticsearch"});
				app.model.dispatchThis();
				},


//will 'disable' any item that is in the result set that already appears in the category or as a accessory/related item.
			filterFinderResults : function()	{
//				app.u.dump("BEGIN admin.callbacks.filterFinderSearchResults");
				var $tmp;
//go through the results and if they are already in this category, disable drag n drop.
				$results = $('#finderSearchResults');
				var sku = $results.closest('[data-sku]').attr('data-sku');
				$results.find('li').each(function(){
					$tmp = $(this);
					if($('#finderTargetList_'+$tmp.attr('data-pid')).length > 0 || $tmp.attr('data-pid') == sku)	{
//						app.u.dump(" -> MATCH! disable dragging.");
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

//	app.u.dump(" -> finderAction found on element "+$button.attr('id'));
if($button.attr('data-finderAction') == 'save')	{

	$button.click(function(event){
		event.preventDefault();
		app.ext.admin.u.saveFinderChanges($button.attr('data-path'));
		app.model.dispatchThis('immutable');
		app.ext.admin.u.changeFinderButtonsState('disable');
		
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
			app.u.dump(" -> moving item "+$copy.attr('data-pid'));
			if($button.attr('data-finderAction') == 'moveToTop')
				$copy.prependTo('#finderTargetList')
			else
				$copy.appendTo('#finderTargetList')
			$copy.attr('data-status','changed'); //data-status is used to compile the list of changed items for the update request.
			$copy.removeClass('ui-selected').attr('id','finderTargetList_'+$copy.attr('data-pid'));
			$(this).remove();
			})
		app.ext.admin.u.updateFinderCurrentItemCount();
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