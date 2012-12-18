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



var admin_prodEdit = function() {
	var theseTemplates = new Array('productEditorTemplate','ProductCreateNewTemplate','productListTemplateTableResults','productListTableListTemplate','productListTemplateEditMe','productEditorPanelTemplate','mpControlSpec');
	var r = {

////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		

	calls : {


			adminProductCreate  : {
				init : function(pid,attribs,tagObj)	{
					tagObj = tagObj || {};
					tagObj.datapointer = "adminProductCreate|"+pid;
					app.model.addDispatchToQ({"_cmd":"adminProductCreate","_tag":tagObj,"pid":pid,'%attribs':attribs},'immutable');	
					}
				},
			
			adminUIProductPanelList : {
				init : function(pid,tagObj,Q)	{
					tagObj = tagObj || {};
					tagObj.datapointer = "adminUIProductPanelList|"+pid;
					if(app.model.fetchData(tagObj.datapointer) == false)	{
						this.dispatch(pid,tagObj,Q);
						}
					else	{
						app.u.handleCallback(tagObj)
						}
					},
				dispatch : function(pid,tagObj,Q)	{
					app.model.addDispatchToQ({"_cmd":"adminUIProductPanelList","_tag":tagObj,"pid":pid},Q);	
					}
				}, //adminUIProductPanelList


//obj requires panel and pid and sub.  sub can be LOAD or SAVE
			adminUIProductPanelExecute : {
				init : function(obj,tagObj,Q)	{
					tagObj = tagObj || {};
//save and load 'should' always have the same data, so the datapointer is shared.
					if(obj['sub'])	{
						tagObj.datapointer = "adminUIProductPanelExecute|"+obj.pid+"|load|"+obj.panel;
						}
					this.dispatch(obj,tagObj,Q);
					},
				dispatch : function(obj,tagObj,Q)	{
					obj['_cmd'] = "adminUIProductPanelExecute";
					obj["_tag"] = tagObj;
					app.model.addDispatchToQ(obj,Q);	
					}
				}, //adminUIProductPanelList

			adminProductManagementCategoryList : {
				init : function(tagObj,Q)	{
					tagObj = tagObj || {};
					tagObj.datapointer = "adminProductManagementCategoryList";
					if(app.model.fetchData(tagObj.datapointer) == false)	{
						this.dispatch(tagObj,Q);
						}
					else	{
						app.u.handleCallback(tagObj)
						}
					},
				dispatch : function(tagObj,Q)	{
					app.model.addDispatchToQ({"_cmd":"adminProductManagementCategoriesComplete","_tag":tagObj},Q);	
					}
				} //adminUIProductPanelList



		}, //calls









////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/product_editor.css','product_editor_styles']);
				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/product_editor.html',theseTemplates);
				window.savePanel = app.ext.admin.a.saveProductPanel; //for product editor.
				window.editProduct = app.ext.admin_prodEdit.a.showPanelsFor;
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			},

		showMangementCats : {
			onSuccess : function(tagObj)	{
				$('#manCatsParent').show(); //make sure parent is visible. hidden by default in case there's no mancats
				$results = $(app.u.jqSelector('#',tagObj.targetID));
				var $a; //recycled.
//cats is an array of keys (management category names) used for sorting purposes.
//regular sort won't work because Bob comes before andy because of case. The function normalizes the case for sorting purposes, but the array retains case sensitivity.
				var cats = Object.keys(app.data[tagObj.datapointer]['%CATEGORIES']).sort(function (a, b) {return a.toLowerCase().localeCompare(b.toLowerCase());});
//				app.u.dump(cats);
				for(index in cats)	{
					$a = $("<a \/>").attr('data-management-category',cats[index]).html("<span class='ui-icon ui-icon-folder-collapsed floatLeft'></span> "+(cats[index] || 'uncategorized'));
//In the app framework, it's not real practical to load several hundred product into memory at one time.
//so the list is opened in the main product area in a multipage format.
						$a.click(function(){
							var $ul = $("<ul \/>").attr({'id':'manageCatProdlist','data-management-category':$(this).data('management-category')});
							var $target = $('#productTabMainContent').empty().append($ul);
//convert to array and clean up extra comma's, blanks, etc.
//also, sort alphabetically.
							var csv = app.ext.store_prodlist.u.cleanUpProductList(app.data.adminProductManagementCategoryList['%CATEGORIES'][$(this).data('management-category')]).sort(); 
							app.ext.store_prodlist.u.buildProductList({
								'csv': csv,
								'parentID':'manageCatProdlist',
								'loadsTemplate' : 'productListTableListTemplate',
								'items_per_page' : 100
								},$ul);
							});
					$a.wrap("<li>");
					$results.append($a);
					}
				}
			}, //showManagementCats

//executed after the list of panels for a given product are received (in the product editor).
//Uses local storage to determine which panels to open and retrieve content for.
//panelData is an object with panel ids as keys and value TFU for whether or not so load/show the panel content.
		loadAndShowPanels :	{
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN admin_prodEdit.callbacks.loadAndShowPanels");
				var sessionData =  app.storageFunctions.readLocal('session') || {};
				
//readLocal returns false if no data local, but an object is needed for the ongoing changes.
//when attempting to do an if(panelData), it didn't work. think false may have been a string, not a boolean.
				if(typeof sessionData.productPanels != 'object'){sessionData.productPanels = {}}; 
				sessionData.productPanels.general = true; //make sure general panel is open.
				
				var pid = app.data[tagObj.datapointer].pid;
				var $target = $('#productTabMainContent');
				$target.empty(); //removes loadingBG div and any leftovers.
				var L = app.data[tagObj.datapointer]['@PANELS'].length;
				var panelID; //recycled. shortcut to keep code cleaner.
				
				for(var i = 0; i < L; i += 1)	{
					panelID = app.data[tagObj.datapointer]['@PANELS'][i].id;
//					app.u.dump(i+") panelData["+panelID+"]: "+panelData[panelID]);

					//pid is assigned to the panel so a given panel can easily detect (data-pid) what pid to update on save.
					$target.append(app.renderFunctions.transmogrify({'id':'panel_'+panelID,'panelid':panelID,'pid':pid},'productEditorPanelTemplate',app.data[tagObj.datapointer]['@PANELS'][i]));

					if(sessionData.productPanels[panelID])	{
						$('#panel_'+panelID+' h3').click(); //open panel. This function also adds the dispatch.
						}
					}
				
//				app.model.dispatchThis('mutable');
				
//				$( "#productTabMainContent" ).sortable();
				app.storageFunctions.writeLocal('session',sessionData); //update the localStorage session var.
				}
			}
		}, //callbacks




////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	a : {

		showCreateProductDialog : function(){
			var $modal = $('#createProductDialog');
			if($modal.length < 1)	{
				$modal = $("<div>").attr({'id':'createProductDialog','title':'Create a New Product'});
				$modal.appendTo('body');
				$modal.dialog({width:500,height:500,modal:true,autoOpen:false});
				}
			$modal.empty().append(app.renderFunctions.createTemplateInstance('ProductCreateNewTemplate'))
			$modal.dialog('open');
			},

//t is 'this' passed in from the h3 that contains the icon and link.
		handlePanel : function(t)	{
			var $header = $(t);
			var $panel = $('.panelContents',$header.parent());
			var panelID = $header.parent().data('panelid');
			var sessionData;
			$panel.toggle(); //will open or close panel.
			
			if(app.model.fetchData('session'))	{
				sessionData = app.storageFunctions.readLocal('session'); //localStorage saves value as KVP, not object. get all panel data and save all panel data to avoid data-loss.
				sessionData.productPanels = sessionData.productPanels || {};
				}
			else	{
				sessionData = {productPanels:{}};
				}
			if($panel.is(":visible"))	{
				sessionData.productPanels[panelID] = true;
				$header.addClass('ui-accordion-header-active ui-state-active');
				$('.ui-icon-circle-arrow-e',$header).removeClass('ui-icon-circle-arrow-e').addClass('ui-icon-circle-arrow-s');
				if($('fieldset',$panel).children().length > 0)	{} //panel contents generated already. just open. form and fieldset generated automatically, so check children of fieldset not the panel itself.
//default to getting the contents. better to take an API hit then to somehow accidentally load a blank panel.
				else	{
					app.ext.admin_prodEdit.calls.adminUIProductPanelExecute.init({'pid':$('#panel_'+panelID).data('pid'),'sub':'LOAD','panel':panelID},{'callback':'showDataHTML','extension':'admin','targetID':'panelContents_'+app.u.makeSafeHTMLId(panelID)},'mutable');
					app.model.dispatchThis('mutable');
					}
				}
			else	{
				sessionData.productPanels[panelID] = false;
				$header.removeClass('ui-accordion-header-active ui-state-active');
				$('.ui-icon-circle-arrow-s',$header).removeClass('ui-icon-circle-arrow-s').addClass('ui-icon-circle-arrow-e')
				}
			app.storageFunctions.writeLocal('session',sessionData); //update the localStorage session var.
			},

//t = this, which is the a tag, not the li. don't link the li or the onCLick will get triggered when the children list items are clicked too, which would be bad.
		toggleManagementCat : function(t,manCatID){
			var $parent = $(t).parent(); //used to append the new UL to.
			
			var targetID = 'manCats_'+app.u.makeSafeHTMLId(manCatID);
			var $target = $(app.u.jqSelector('#',targetID));
//if target already exists on the DOM, then this category has been opened previously. The target is the UL containing the product list.
			if($target.length)	{
				$target.toggle();
				}
			else	{
				$target = $("<ul \/>").attr('id',targetID).appendTo($parent);
//for a full list of what vars can/should be set in buildProductList, see store_prodlist.u.setProdlistVars
				app.ext.store_prodlist.u.buildProductList({
					'csv': app.data.adminProductManagementCategoryList['%CATEGORIES'][manCatID],
					'hide_summary': true,
					'parentID':targetID,
					'loadsTemplate' : 'productListTemplateEditMe',
					'items_per_page' : 100
					},$target);
				}
			},

		saveProductPanel : function(t,panelID,SUB){
			var $form = $(t).closest("form");
			var $fieldset = $('fieldset',$form); // a var because its used/modified more than once.
			var formObj = $form.serializeJSON();

			//if pid is set as a input in the original form, use it. Otherwise, look for it in data on the container.
			formObj.pid = formObj.pid || $form.closest('[data-pid]').attr('data-pid');
			
			formObj['sub'] = (SUB) ? SUB : 'SAVE';
			formObj.panel = panelID;

			if(formObj.pid)	{
				// fieldset is where data is going to get added, so it gets the loading class.
				// be sure do this empty AFTER the form serialization occurs.
				$fieldset.empty().addClass('loadingBG');
				app.ext.admin_prodEdit.calls.adminUIProductPanelExecute.init(
					formObj,
					{'callback':'showDataHTML','extension':'admin','targetID':$fieldset.attr('id')}
					,'immutable');
				app.model.dispatchThis('immutable');
				}
			else	{
				app.u.throwMessage("Uh oh. an error occured. could not determine what product to update.");
				}
			},
		
		showPanelsFor : function(pid)	{
			$('#productTabMainContent').empty().append("<div class='loadingBG'></div>");
			app.ext.admin_prodEdit.calls.adminUIProductPanelList.init(pid,{'callback':'loadAndShowPanels','extension':'admin_prodEdit'},'mutable');
			app.model.dispatchThis();
			}
		
		},

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	renderFormats : {},
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {


			showProductEditor : function(path,P)	{
//			app.u.dump("BEGIN admin_prodEdit.u.showProductEditor");
//			app.u.dump(" -> P: "); app.u.dump(P);
			
			window.savePanel = app.ext.admin_prodEdit.a.saveProductPanel;  
			//always rewrite savePanel. another 'tab' may change the function.
			//kill any calls.
			// NOTE - if the product editor gets a default fetchAdmin call, then this code won't be necessary.
			//it's here to cancel any calls in progress so that if setup then products are clicked quickly, setup doesn't get loaded.

			if(!$.isEmptyObject(app.ext.admin.vars.uiRequest))	{
				app.u.dump("request in progress. Aborting.");
				app.ext.admin.vars.uiRequest.abort(); //kill any exists requests. The nature of these calls is one at a time.
				}

			if(!$('#productEditorTemplate').length)	{
				$(app.u.jqSelector('#',P.targetID)).empty().append(
					app.renderFunctions.createTemplateInstance('productEditorTemplate')
					);
				
				app.ext.admin_prodEdit.calls.adminProductManagementCategoryList.init(
					{'callback':'showMangementCats','extension':'admin_prodEdit','targetID':'manCats'},
					'mutable');
				app.model.dispatchThis('mutable');
				
				
				
				$('.tagFilterList li','#prodLeftCol').each(function(){
					$(this).addClass('lookLikeLink').click(function(){
						app.ext.admin_prodEdit.u.prepContentArea4Results();
						var tag = $(this).text();
						app.ext.store_search.calls.appPublicProductSearch.init({"size":"50","mode":"elastic-native","filter":{"term":{"tags":tag}}},{'datapointer':'appPublicSearch|'+tag,'templateID':'productListTemplateTableResults','callback':'handleElasticResults','extension':'store_search','parentID':'prodEditorResultsTable'});
						app.model.dispatchThis('mutable');
						})
					})
				
				
				$('.mktFilterList li','#prodLeftCol').each(function(){
					$(this).addClass('lookLikeLink').click(function(){
						app.ext.admin_prodEdit.u.prepContentArea4Results();
						var mktid = $(this).data('mktid')+'_on';
						app.ext.store_search.calls.appPublicProductSearch.init({"size":"50","mode":"elastic-native","filter":{"term":{"marketplaces":mktid}}},{'datapointer':'appPublicSearch|'+mktid,'templateID':'productListTemplateTableResults','callback':'handleElasticResults','extension':'store_search','parentID':'prodEditorResultsTable'});
						app.model.dispatchThis('mutable');
						})
					})
				}
			else	{
				//product editor is already on the dom. Right now, only one instance of the editor can be created at a time.
				}

			// why the hell did it do a fetchAdminResource call ?
			path = path || "/biz/product/edit.cgi?VERB=WELCOME";
			P.targetID = "productTabMainContent";
			$(app.u.jqSelector('#',P.targetID)).empty().append(
				"<div class='loadingBG'></div>"
				);
			app.model.fetchAdminResource(path,P);
			
			//$("#productTabMainContent").empty().append(
			//	app.renderFunctions.createTemplateInstance('productEditorWelcome')
			//	);

			}, //showProductTab 


		handleCreateNewProduct : function(P)	{
			var pid = P.pid;
			delete P.pid;
//				app.u.dump("Here comes the P ["+pid+"]: "); app.u.dump(P);
			app.ext.admin_prodEdit.calls.adminProductCreate.init(pid,P,{'callback':'showMessaging','message':'Created!','parentID':'prodCreateMessaging'});
			app.model.dispatchThis('immutable');
			},
//clears existing content and creates the table for the search results. Should be used any time an elastic result set is going to be loaded into the product content area WITH a table as parent.
		prepContentArea4Results : function(){
			$("#productTabMainContent").empty().append($("<table>").attr('id','prodEditorResultsTable').addClass('loadingBG'));
			},
		
		
		handleProductKeywordSearch : function(obj)	{
			if(obj && obj.KEYWORDS)	{
				app.ext.admin_prodEdit.u.prepContentArea4Results();
				app.ext.store_search.u.handleElasticSimpleQuery(obj.KEYWORDS,{'callback':'handleElasticResults','extension':'store_search','templateID':'productListTemplateTableResults','parentID':'prodEditorResultsTable'});
				app.model.dispatchThis();
				}
			else	{
				//keywords are required.
				app.u.dump("Oops. no keywords specified.");
				}
			}

		} //u


		
		} //r object.
	return r;
	}