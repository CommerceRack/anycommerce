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
	var theseTemplates = new Array('productEditorTemplate','ProductCreateNewTemplate','productListTemplateTableResults');
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


//obj requires panel and productid and sub.  sub can be LOAD or SAVE
			adminUIProductPanelExecute : {
				init : function(obj,tagObj,Q)	{
					tagObj = tagObj || {};
					if(obj['sub'] == 'LOAD')	{
						tagObj.datapointer = "adminUIProductPanelExecute|load|"+obj.panel+"|"+obj.pid;
						}
					this.dispatch(obj,tagObj,Q);
					},
				dispatch : function(obj,tagObj,Q)	{
					obj['_cmd'] = "adminUIProductPanelExecute";
					obj["_tag"] = tagObj;
					app.model.addDispatchToQ(obj,Q);	
					}
				}, //adminUIProductPanelList

//obj requires panel and productid and sub.  sub can be LOAD or SAVE
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
				}, //adminUIProductPanelList



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
					if(index == ''){index = 'uncategorized'}
					$results.append("<li>"+index+"<ul id='manCats_"+index+"' class='loadingBG'></ul></li>");
					}
				}
			}, //showManagementCats

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


		saveProductPanel : function(t,panelID,SUB){
			var formObj = $(t).closest("form").serializeJSON();
			formObj.pid = 'OUTFIT';
			formObj['sub'] = (SUB) ? SUB : 'SAVE';
			formObj.panel = 'flexedit';
			app.ext.admin_prodEdit.calls.adminUIProductPanelExecute.init(formObj,{},'immutable');
			app.model.dispatchThis('immutable');
			},
		
		showPanelsFor : function(pid)	{
			
			}
		
		},

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	renderFormats : {},
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {


			showProductEditor : function(path,P)	{
$('#'+P.targetID).empty().append(app.renderFunctions.createTemplateInstance('productEditorTemplate'));

app.ext.admin_prodEdit.calls.adminProductManagementCategoryList.init({'callback':'showMangementCats','extension':'admin_prodEdit','targetID':'manCats'},'mutable');
app.model.dispatchThis('mutable');

$('.tagFilterList li','#prodLeftCol').each(function(){
	$(this).click(function(){
		$("#productTabMainContent").empty().append($("<table>").attr('id','prodEditorResultsTable').addClass('loadingBG'));
		var tag = $(this).text();
		app.ext.store_search.calls.appPublicProductSearch.init({"size":"50","mode":"elastic-native","filter":{"term":{"tags":tag}}},{'datapointer':'appPublicSearch|'+tag,'templateID':'productListTemplateTableResults','callback':'handleElasticResults','extension':'store_search','parentID':'prodEditorResultsTable'});
		app.model.dispatchThis('mutable');
		})
	})


$('.mktFilterList li','#prodLeftCol').each(function(){
	$(this).click(function(){
		$("#productTabMainContent").empty().append($("<table>").attr('id','prodEditorResultsTable').addClass('loadingBG'));
		var mktid = $(this).data('mktid')+'_on';
		app.ext.store_search.calls.appPublicProductSearch.init({"size":"50","mode":"elastic-native","filter":{"term":{"marketplaces":mktid}}},{'datapointer':'appPublicSearch|'+mktid,'templateID':'productListTemplateTableResults','callback':'handleElasticResults','extension':'store_search','parentID':'prodEditorResultsTable'});
		app.model.dispatchThis('mutable');
		})
	})

path = path || "/biz/product/edit.cgi?VERB=WELCOME";
P.targetID = "productTabMainContent";
app.model.fetchAdminResource(path,P);


				}, //showProductTab 


		handleCreateNewProduct : function(P)	{
			var pid = P.pid;
			delete P.pid;
//				app.u.dump("Here comes the P ["+pid+"]: "); app.u.dump(P);
			app.ext.admin_prodEdit.calls.adminProductCreate.init(pid,P,{'callback':'showMessaging','message':'Created!','parentID':'prodCreateMessaging'});
			app.model.dispatchThis('immutable');
			}

		} //u


		
		} //r object.
	return r;
	}