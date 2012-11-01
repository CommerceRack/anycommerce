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
	var theseTemplates = new Array('productEditorTemplate','ProductCreateNewTemplate','productListTemplateTableResults','productListTemplateEditMe','productEditorPanelTemplate');
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
					if(obj['sub'] == 'LOAD' || obj['sub'] == 'SAVE')	{
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
				$results = $('#'+tagObj.targetID);
				for(index in app.data[tagObj.datapointer]['%CATEGORIES'])	{
					$results.append("<li><a href='#' onClick=\"app.ext.admin_prodEdit.a.toggleManagementCat(this,'"+index+"');\">"+(index || 'uncategorized')+"<\/a></li>");
					}
				}
			}, //showManagementCats

		loadAndShowPanels :	{
			onSuccess : function(tagObj)	{
				app.u.dump("BEGIN admin_prodEdit.callbacks.loadAndShowPanels");
				app.u.dump(" -> tagObj:"); app.u.dump(tagObj);
				var pid = app.data[tagObj.datapointer].pid;
				var $target = $('#productTabMainContent');
				$target.empty(); //removes loadingBG div and any leftovers.
				var L = app.data[tagObj.datapointer]['@PANELS'].length;

				for(var i = 0; i < L; i += 1)	{
//pid is assigned to the panel so a given panel can easily detect (data-pid) what pid to update on save.
					$target.append(app.renderFunctions.transmogrify({'id':'panel_'+app.data[tagObj.datapointer]['@PANELS'][i].id,'panelid':app.data[tagObj.datapointer]['@PANELS'][i].id,'pid':pid},'productEditorPanelTemplate',app.data[tagObj.datapointer]['@PANELS'][i]));
					app.ext.admin_prodEdit.calls.adminUIProductPanelExecute.init({'pid':pid,'sub':'LOAD','panel':app.data[tagObj.datapointer]['@PANELS'][i].id},{'callback':'showDataHTML','extension':'admin','targetID':'panelContents_'+app.u.makeSafeHTMLId(app.data[tagObj.datapointer]['@PANELS'][i].id)},'mutable');
					}
				$('#panel_general h3').click(); //make sure general panel is open.
				app.model.dispatchThis('mutable');
				
//				$( "#productTabMainContent" ).sortable();
				
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
			var $panel = $('.panelContents',$header.parent()) ;
			$panel.toggle(); //will open or close panel.
			if($panel.is(":visible"))	{
//				$panel.empty().append("<div class='loadingBG' \/>");
				$header.addClass('ui-accordion-header-active ui-state-active');
				$('.ui-icon-circle-arrow-e',$header).removeClass('ui-icon-circle-arrow-e').addClass('ui-icon-circle-arrow-s')
				}
			else	{
				$header.removeClass('ui-accordion-header-active ui-state-active');
				$('.ui-icon-circle-arrow-s',$header).removeClass('ui-icon-circle-arrow-s').addClass('ui-icon-circle-arrow-e')
				}
			},

//t = this, which is the a tag, not the li. don't link the li or the onCLick will get triggered when the children list items are clicked too, which would be bad.
		toggleManagementCat : function(t,manCatID){
			var targetID = 'manCats_'+app.u.makeSafeHTMLId(manCatID);
			var $parent = $(t).parent(); //used to append the new UL to.
			var $target = $('#'+targetID);
//if target already exists on the DOM, then this category has been opened previously.
			if($target.length)	{
				$target.toggle();
				}
			else	{
				$target = $("<ul \/>").addClass('loadingBG').attr('id',targetID);
				$parent.append($target);
//for a full list of what vars can/should be set in buildProductList, see store_prodlist.u.setProdlistVars
				app.ext.store_prodlist.u.buildProductList({
					'csv': app.data.adminProductManagementCategoryList['%CATEGORIES'][manCatID],
					'hide_summary': true,
					'loadsTemplate' : 'productListTemplateEditMe',
					'items_per_page' : 100
					},$target);
				}
			},

		saveProductPanel : function(t,panelID,SUB){
			var $form = $(t).closest("form");
			var $fieldset = $('fieldset',$form); // a var because its used/modified more than once.
			var formObj = $form.serializeJSON();
			formObj.pid = $form.closest('[data-pid]').attr('data-pid');
			formObj['sub'] = (SUB) ? SUB : 'SAVE';
			formObj.panel = panelID;
			if(formObj.pid)	{
//fieldset is where data is going to get added, so it gets the loading class.
//be sure do this empty AFTER the form serialization occurs.
				$fieldset.empty().addClass('loadingBG');
				app.ext.admin_prodEdit.calls.adminUIProductPanelExecute.init(formObj,{'callback':'showDataHTML','extension':'admin','targetID':$fieldset.attr('id')},'immutable');
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
			
			window.savePanel = app.ext.admin_prodEdit.a.saveProductPanel;  //always rewrite savePanel. another 'tab' may change the function.
//kill any calls.
// NOTE - if the product editor gets a default fetchAdmin call, then this code won't be necessary.
//it's here to cancel any calls in progress so that if setup then products are clicked quickly, setup doesn't get loaded.
			if(!$.isEmptyObject(app.ext.admin.vars.uiRequest))	{
				app.u.dump("request in progress. Aborting.");
				app.ext.admin.vars.uiRequest.abort(); //kill any exists requests. The nature of these calls is one at a time.
				}

			if(!$('#productEditorTemplate').length)	{
				$('#'+P.targetID).empty().append(app.renderFunctions.createTemplateInstance('productEditorTemplate'));
				
				app.ext.admin_prodEdit.calls.adminProductManagementCategoryList.init({'callback':'showMangementCats','extension':'admin_prodEdit','targetID':'manCats'},'mutable');
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

path = path || "/biz/product/edit.cgi?VERB=WELCOME";
P.targetID = "productTabMainContent";
$('#'+P.targetID).empty().append("<div class='loadingBG'></div>");
app.model.fetchAdminResource(path,P);


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