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



var admin_prodedit = function(_app) {
	var theseTemplates = new Array(
		'ProductCreateNewTemplate',
		'variationsDSTInputsTemplate',
		'mpControlSpec'
		);

	var r = {

		vars : {
// legacy type means 'this field is no longer used'. should not get an editor. it's deprecated and the attribute will eventually be removed.
			flexTypes : {
				'asin' : {'type':'text'},
				'date' : {'type':'text'},
				'textbox' : { 'type' : 'text'},
				'text' : { 'type' : 'text'},
				'textarea' : { 'type' : 'textarea'},
				'keywordlist' : { 'type' : 'textarea'},
				'textlist' : { 'type' : 'textarea'},
				'image' : { 'type' : 'image'},
				'finder' : { 'type' : 'button'},
				'keyword' : { 'type' : 'textarea'},
				'currency' : { 'type' : 'number'},
				'number' : { 'type' : 'number'},
				'weight' : { 'type' : 'text'},
				'checkbox' : { 'type' : 'checkbox'},
				'digest' : { 'type' : 'hidden'},
				'special' : { 'type' : 'hidden'},
				'boolean' : { 'type' : 'checkbox'},
				'chooser/counter' : { 'type' : 'text'},
	//			'ebay/storecat' :  {'type':'ebay/storecat'}, //not supported at this time.
				'ebay/attributes' : { 'type' : 'text'},
				'overstock/category' : { 'type' : 'text'},
				'select' : {'type':'select'},
				'selectreset' : { 'type' : 'select'} /* don't save a blank value. a selection is required. */
				}
			},



////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



		callbacks : {
	//executed when extension is loaded. should include any validation that needs to occur.
			init : {
				onSuccess : function()	{
					var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
					_app.rq.push(['css',0,_app.vars.baseURL+'extensions/admin/product_editor.css','product_editor_styles']);
					// _app.model.fetchNLoadTemplates(_app.vars.baseURL+'extensions/admin/product_editor.html',theseTemplates);
	//				window.savePanel = _app.ext.admin.a.saveProductPanel; //for product editor. odd. this function doesn't exist. commented out by JT on 2012-11-27

					return r;
					},
				onError : function()	{
	//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
	//you may or may not need it.
					_app.u.dump('BEGIN admin_prodedit.callbacks.init.onError');
					}
				},


//the request that uses this as a callback should have the following params set for _tag:
// parentID, templateID (template used on each item in the results) and datapointer.

			handlePMSearchResults : {
				onSuccess : function(_rtag)	{
//					_app.u.dump("BEGIN admin_prodedit.callbacks.handlePMSearchResults.onSuccess");
	
	
					var
						L = _app.data[_rtag.datapointer]['_count'], //number of results in search.
						$tbody = _rtag.list;
					
					
					if($tbody && $tbody.length)	{
						$tbody.closest('table').find('th.ui-state-active').removeClass('ui-state-active'); //make sure no header is selected as sort method, as new results will ignore it.
						$tbody.hideLoading();
						if(L == 0)	{
							//the thead th for colspan is to ensure td spans entire table. The brs are just for a little whitespace around the messaging to help it stand out.
							$tbody.append("<tr><td colspan='"+$tbody.parent().find("thead th").length+"'><br \/>No Results found matching your keyword/filter.<br \/></td><\/tr>");
							}
						else	{
	//loop through the list backwards so that as we add items to the top, the order of the results is preserved.
							for(var i = (L-1); i >= 0; i -= 1)	{
								var
									pid = _app.data[_rtag.datapointer].hits.hits[i]['_id'],
									eleID = 'prodManager_'+pid,
									$thisLI = $(_app.u.jqSelector('#',eleID)),
									$PMTaskList = $tbody.closest("[data-app-role='productManagerResultsContent']").find("[data-app-role='productManagerTaskResults']");
								
	//							_app.u.dump(i+") pid: "+pid);
									
								$thisLI = _app.renderFunctions.transmogrify({'id':eleID,'pid':pid},_rtag.templateID,_app.data[_rtag.datapointer].hits.hits[i]['_source']);
								$tbody.prepend($thisLI);
								if($("li[data-pid='"+pid+"']",$PMTaskList).length)	{
									$("[data-app-click='admin_prodedit|productTaskPidToggle']",$thisLI).addClass('ui-state-highlight');
									//li is already in PM task list. don't re-add. the prepend below will move it to the top of the list (it's proper place in the results, anyway).
									}
								_app.u.handleButtons($thisLI);
								}
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In store_search.callbacks.handlePMSearchResults, $tbody ['+typeof _rtag.list+'] was not defined, not a jquery object ['+(_rtag.list instanceof jQuery)+'] or does not exist ['+_rtag.list.length+'].',gMessage:true});
						_app.u.dump("handlePMSearchResults _rtag.list: "); _app.u.dump(_rtag.list);
						}
					}
				}, //handlePMSearchResults
	
			flex2HTMLEditor : {
				onSuccess : function(_rtag)	{
//					_app.u.dump("BEGIN admin_prodedit.callbacks.flex2HTMLEditor");
					var pid = _rtag.pid;
					_app.u.dump(" -> PID: "+pid);
					if(_rtag.jqObj)	{
					//	_app.u.dump(" -> jqObj IS defined");
						_rtag.jqObj.hideLoading();
						_rtag.jqObj.anycontent(_rtag);
					
						_rtag.jqObj.find("[data-app-role='flexContainer']").append(_app.ext.admin_prodedit.u.flexJSON2JqObj(_app.data[_rtag.datapointer].contents,_app.data['adminProductDetail|'+pid]));
						
					//hidden pid input is used by save. must come after the 'anycontent' above or form won't be set.
						_rtag.jqObj.find('form').append("<input type='hidden' name='pid' value='"+pid+"' \/>");
					
					
						_app.u.addEventDelegation(_rtag.jqObj.anyform({'trackEdits':true}));
						_app.u.handleCommonPlugins(_rtag.jqObj);
						_app.u.handleButtons(_rtag.jqObj);
						
						if(_rtag.jqObj.hasClass('ui-dialog-content'))	{
							_rtag.jqObj.dialog('option','height',($('body').height() - 200));
							_rtag.jqObj.dialog('option','position','center');
							}
					
						}
					}
				},


			handleProductEditor : {
				onSuccess : function(_rtag)	{
	
					var pid = _app.data[_rtag.datapointer].pid;
					
					//this will render the 'quickview' above the product itself. This is only run if 'edit' is clicked directly from the search results.
					if(_rtag.renderTaskContainer)	{
						_app.u.handleButtons(_rtag.jqObj.closest("[data-app-role='taskItemContainer']").find("[data-app-role='taskItemPreview']").anycontent({'datapointer':_rtag.datapointer}));
						}
					
					_rtag.jqObj.hideLoading();
// ** 201404 -> product with > 100 skus get a modified interface. This is done to improve performance.
//					_rtag.jqObj.anycontent({'templateID':'productEditorTabbedTemplate','data':$.extend(true,{},_app.data[_rtag.datapointer],_app.data['adminProductReviewList|'+pid])});
					if(_rtag.jqObj.data('anycontent'))	{
						_rtag.jqObj.anycontent('destroy');
						}
					_rtag.jqObj.anycontent({'templateID':'productEditorTabbedTemplate'}); //create the template instance.
					//need to do a little modification to the template based on whether or not there are > 100 skus.
					//once the interface is upgraded to TLC, this can be perfomed inline.
					
					if(_app.data[_rtag.datapointer]['@skus'].length <= 10)	{
						$("[data-skufinder-role='finderContainer']",_rtag.jqObj).hide(); //no point showing the sku finder if there's only a few skus.
						}
					else if(_app.data[_rtag.datapointer]['@skus'].length > 40)	{
//remove the data-bind so the entire list doesn't load. the skufinder still shows up, it's still useful for locating a specific product.
						$("[data-skufinder-role='target']",_rtag.jqObj).removeAttr('data-bind')
						}
					else	{}
					
					
					//now translate the data.
					_rtag.jqObj.anycontent({'translateOnly' : true,'data':$.extend(true,{},_app.data[_rtag.datapointer],_app.data['adminProductReviewList|'+pid])});
					
					
					
					//check to see if item has inventoryable variations.
					if(_app.ext.admin_prodedit.u.thisPIDHasInventorableVariations(pid))	{
						//this product has inventoryable options.
						$("[data-app-role='showProductWithVariations']",_rtag.jqObj).show();
						$("[data-app-role='showProductWithoutVariations']",_rtag.jqObj).hide();
						}
					else {
						// no variations
						$("[data-app-role='showProductWithVariations']",_rtag.jqObj).hide();
						$("[data-app-role='showProductWithoutVariations']",_rtag.jqObj).show();
						$("[data-app-role='prodEditSkuImagesFieldset']",_rtag.jqObj).hide(); //hide sku-specific images. That code is designed to only have three images and could inadvertantly remove product imagery. ## TODO -> test this.
						}
					
					
					$('form',_rtag.jqObj).each(function(){
						$(this).append("<input type='hidden' name='pid' value='"+pid+"' \/>");
						});
					
					_app.ext.admin_prodedit.u.handleImagesInterface($("[data-app-role='productImages']",_rtag.jqObj),pid);
					_app.u.handleCommonPlugins(_rtag.jqObj);
					_app.u.handleButtons(_rtag.jqObj);
					_app.u.addEventDelegation(_rtag.jqObj);
					
					_rtag.jqObj.anyform({
						trackEdits:true,
						trackSelector:'form'
						});
					}
				} //handleProductEditor
			}, //callbacks




////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	
		a : {
	
//$target -> a jquery instance of where the manager should show up.
//P -> an object of params.
//This code should NOT bring the product tab into focus. That should be done by the code that executes this.
//  -> allows this code build the product manager interface in the background so that the product task list 'add' works prior to the product editor being opened.
			showProductManager : function(P)	{
//				_app.u.dump("BEGIN admin_prodedit.a.showProductManager");
				P = P || {};
				var $target = $("#productContent");
//				_app.u.dump(" -> P:"); _app.u.dump(P);

				_app.ext.admin_prodedit.u.handleNavTabs(); //builds the filters, search, etc menu at top, under main tabs.
				
				if($target.children().length)	{} //product manager only gets rendered once and ONLY within the product tab.
				else	{
					$target.anycontent({'templateID':'productManagerLandingContentTemplate','showLoading':false});
					_app.u.addEventDelegation($("[data-app-role='productManagerResultsContent']",$target)); //this delegate is just on the results. each product get's it's own in quickview.
					//add the tasks to the list.
					var tasks = _app.model.dpsGet('tab_pref_product','tasklistitems');
					for(var i = 0, L = tasks.length; i < L; i += 1)	{
						_app.ext.admin_prodedit.u.addProductAsTask({'pid':tasks[i],'tab':'product','mode':'add'});
						}
					}
				}, //showProductManager

			showProductEditor : function($target,pid,vars)	{
				vars = vars || {};
				if($target instanceof jQuery && pid)	{

					$target.empty().showLoading({'message':'Fetching product record'});
					$target.attr({'data-pid':pid});
					
					_app.model.addDispatchToQ({
						'_cmd':'adminProductReviewList',
						'PID':pid,
						'_tag':	{
							'datapointer' : 'adminProductReviewList|'+pid,
							'pid':pid
							}
						},'mutable');					
					
//get the list of flexfields. used to determine whether or not attributes tab should show up.					
					if(_app.model.fetchData('adminConfigDetail|flexedit'))	{}
					else	{
						_app.model.addDispatchToQ({
							'_cmd':'adminConfigDetail',
							'flexedit' : 1,
							'_tag':	{
								'datapointer':'adminConfigDetail|flexedit'
								}
							},'mutable');						
						}				
					

					//product record, used in most panels.
					//if this request is changed, don't forget to add the change to the detail call made in the save button (adminProductMacroSaveHandlersExec)
					_app.model.addDispatchToQ({
						'_cmd':'adminProductDetail',
						'variations':1,
						'inventory' : 1,
						'schedules' : 1,
						'skus':1,
						'pid' : pid,
						'_tag':{
							'datapointer':'adminProductDetail|'+pid,
							'pid' : pid,
							'renderTaskContainer' : vars.renderTaskContainer,
							'templateID':'productEditorTabbedTemplate',
							'jqObj' : $target,
							'extension' : 'admin_prodedit',
							'callback' : 'handleProductEditor'
							}
						},'mutable');
					
					_app.model.dispatchThis('mutable');

					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.a.showProductEditor, either $target is not an instance of jquery or pid is not set.","gMessage":true});
					}
				}, //showProductEditor


			showCreateProductDialog : function(){
				var $modal = $('#createProductDialog');
				if($modal.length < 1)	{
					$modal = $("<div>").attr({'id':'createProductDialog','title':'Create a New Product'});
					$modal.appendTo('body');
					$modal.dialog({
						width:'60%',
						height: ($('body').height() - 100),
						modal:true,
						autoOpen:false
						});
					}
				$modal.empty().append(_app.renderFunctions.createTemplateInstance('ProductCreateNewTemplate'));
				$modal.anyform();
				_app.u.handleButtons($modal);
				_app.u.addEventDelegation($modal); 
				$modal.dialog('open');
				}, //showCreateProductDialog
	
			
			showProductDebugger : function($target,P)	{
				P = P || {};
				if($target instanceof jQuery && P.pid && P.templateID)	{
					
//$target.showLoading({"message":"Fetching product debug info"});
$target.anycontent({'templateID':P.templateID,'showLoading':false}).attr('data-pid',P.pid); //

_app.u.handleCommonPlugins($target);
_app.u.handleButtons($target);
_app.u.addEventDelegation($target);
					}
				else if($target instanceof jQuery)	{
					$target.anymessage({"message":"In admin_prodedit.a.showProductDebugger, either no pid ["+P.pid+"] and/or no templateid ["+P.templateID+"] passed. both are required.","gMessage":true});
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.a.showProductDebugger, $target is not a valid instance of jquery.",'gMessage':true})
					}
				},
	
	
			showStoreVariationsManager : function($target)	{
//				_app.u.dump("BEGIN admin_prodedit.a.showStoreVariationsManager");
				if($target && $target instanceof jQuery)	{
					var _tag = {
						'datapointer' : 'adminSOGComplete',
						'callback':'anycontent',
						'jqObj' : $target,
						'templateID' : 'variationsManagerTemplate'
						}
					
					_app.u.addEventDelegation($target);
					//use local copy, if available
					if(_app.model.fetchData('adminSOGComplete'))	{
						_app.u.handleCallback(_tag)
						}
					else	{
						$target.showLoading({"message":"Fetching variations..."});
						_app.model.addDispatchToQ({
							'_cmd':'adminSOGComplete',
							'_tag':	_tag
							},'mutable');
						_app.model.dispatchThis('mutable');
						}
	
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.a.showStoreVariationsManager, $target was either not specified or is not an instance of jQuery.","gMessage":true});
					}
				}, //showStoreVariationsManager
				
//mode = store or product.
//varObj = variation Object.
//PID is required for mode = product.
//executed when 'edit' is clicked from either sog list in store variation manager or in product edit > variations > edit variation group.
//what's built gets returned, which means it is NOT added to the dom within this function. so event delegation should occur OUTSIDE this function or double-execution could occur.
			getVariationEditor : function(mode, varObj, PID)	{
//				_app.u.dump("BEGIN admin_prodedit.u.getVariationEditor");
				varObj = varObj || {}; //defauilt to object to avoid JS error in error checking.
				var $r = $("<div \/>").addClass('variationEditorContainer'); //what is returned. Either the editor or some error messaging.
				if(!$.isEmptyObject(varObj) && (mode == 'store' || (mode == 'product' && PID)) && varObj.type){
// ispog is used during save. allows editor to know where to go to get variations data.
					varObj.ispog = varObj.ispog || (varObj.id && varObj.id.charAt(0) == '#') ? true : false;
					$r.data({
						'variationtype':varObj.type,
						'variationmode':mode,
						'variationguid' : varObj.guid,
						'variationid' : varObj.id,
						'ispog' : varObj.ispog,
						'isnew' : varObj.isnew
						});
					if(PID)	{
						varObj.pid = PID; //add pid to object so it can be used in data-binds.
						$r.data('pid',PID); //used in save function.
						} 
					//build the generic editor.
					$r.anycontent({'templateID':'variationEditorTemplate','data':varObj}); 
					
					//add the editor specific to the variation type.
					$("[data-app-role='variationsTypeSpecificsContainer']",$r).anycontent({'templateID':'variationsEditor_'+varObj.type.toLowerCase(),'data':varObj})
					
					if(mode == 'product')	{
//when editing a sog, the save button actually makes an api call. when editing 'product', the changes update the product in memory until the save button is pushed.
						$("[data-app-role='saveButton']",$r).text('Apply Changes').attr('title','Apply changes to variation - will not be saved until product is saved.');
						}
	
					
					_app.u.handleButtons($r);
					$('.toolTip',$r).tooltip();
					if(varObj.inv >= 1)	{
						$r.addClass('isInventoryable');
						}
					
	
	//for 'select' based variations, need to add some additional UI functionality.
					if(_app.ext.admin_prodedit.u.variationTypeIsSelectBased(varObj.type))	{
						$("[data-app-role='variationsOptionsTbody']",$r).addClass('sortGroup').sortable();
						$("[data-app-role='variationsOptionsTbody'] tr",$r).each(function(){
							var $tr = $(this);
							$tr.attr('data-guid','option_'+$tr.data('v')) //necessary for the dataTable feature to work. doesn't have to be a 'true' guid. option_ prefix is so option value 00 doesn't get ignored.
							})
//in 'select' based varations editors and in product edit mode, need to show the list of options available in the sog
						if(mode == 'product' && ((varObj.isnew && varObj.ispog) || (varObj.id && varObj.id.indexOf('#') == -1)))	{
							var $tbody = $("[data-app-role='storeVariationsOptionsContainer'] tbody",$r);
							$("[data-app-role='productOptionsFilterInput']",$r).show(); //this is only displayed in the product editor. in store variations edit, the list is empty.
							$tbody.attr("data-bind","var: sog(@options); format:processList;loadsTemplate:optionsEditorRowTemplate;");
							$tbody.parent().show().anycontent({'data':_app.data.adminSOGComplete['%SOGS'][varObj.id]});
							$("[data-app-click='admin_prodedit|variationsOptionToggle']",$tbody).show(); //toggle button only shows up when in right side list.

							$tbody.sortable({
								connectWith: '.sortGroup',
								stop : function(event,ui){
									_app.ext.admin_prodedit.u.handleOptionsSortableStop($(ui.item));
									//optionsEditorRowTemplate
									}
								});
							//now hide all the options in the 'global' list that are already enabled on the product.
							$("tbody[data-app-role='variationsOptionsTbody'] tr",$r).each(function(){
//								_app.u.dump(" -> $(this).data('v'): "+$(this).data('v'));
								$("[data-v='"+$(this).data('v')+"']",$tbody).empty().remove(); //removed instead of just hidden so that css even/odd works. also, not necessary on DOM for anything.
								})
							//data-v="00"			
							}
						
						
						}
	//* 201332 -> when editing a sog, 'variation settings' are not displayed.
					if(mode == 'product' && !varObj.ispog)	{
						$("[data-app-role='variationSettingsContainer']",$r).hide(); //
						$('.variationEditorSplitter',$r).hide();
						$("[data-app-role='addNewOptionButton']",$r).button('disable');
						}
	
					if(varObj.inv == 0)	{
						$("[data-app-role='variationOptionalContainer']",$r).removeClass('displayNone');
						}
					
					if(varObj.type == 'imgselect' || varObj.type == 'imggrid')	{
						$("[data-app-role='variationImgInputs']",$r).removeClass('displayNone');
						}
					else	{
						$("[data-app-role='variationImgInputs']",$r).empty().remove();
						}
					
					}
				else	{
					$r.anymessage({"message":"In admin_prodedit.a.getVariationEditor, either mode ["+mode+"] or type["+varObj.type+"] was blank, varOjb was empty ["+$.isEmptyObject(varObj)+"] or mode was set to product and PID ["+PID+"] was empty.","gMessage":true});
					}
				return $r;
				}, //getVariationEditor
	
	// opened when editing a product. shows enabled options and ability to add store variations to product.
			showProductVariationManager : function($target,pid)	{
//				_app.u.dump("BEGIN admin_prodedit.a.showProductVariationManager. pid: "+pid);
				
				if($target instanceof jQuery && pid)	{
//					_app.u.dump(" -> $target is valid and pid is set.");
					$target.empty().anycontent({
						'templateID':'productVariationManager',
						'showLoading':false,
						data : {'pid':pid},
						'dataAttribs':{'pid':pid}
						});
					$target.showLoading({"message":"Fetching Product Record and Store Variations"});
//sog data must be up to date.					
					_app.model.addDispatchToQ({'_cmd':'adminSOGComplete','_tag': {'datapointer':'adminSOGComplete','callback':function(rd){
						$target.hideLoading();
						if(_app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
					
							var $prodOptions = $("[data-app-role='productVariationManagerProductContainer']",$target);
							$prodOptions.anycontent({'data':_app.data['adminProductDetail|'+pid]})
							$('.gridTable tbody',$prodOptions).sortable({
								'stop' : function(e,ui){
									_app.u.dump('stop triggered');
									if(Number(ui.item.data('inv')) > 0 && !ui.item.closest('table').data('shown_inv_warning'))	{
										ui.item.closest('table').data('shown_inv_warning',true); //only show warning once per varation edit session.
										ui.item.closest("[data-app-role='productVariationManagerContainer']").anymessage({"message":"A product Stock Keeping Unit (SKU) is determined by the variation order of inventory-able variations, which you have just changed. Saving this change will alter your SKU. Proceed with caution.<br />note - you can change the order of non-inventory-able variations around the inventory-able variations with no concern."});
										$(window).scrollTop(ui.item.closest("[data-app-role='productVariationManagerContainer']").position().top)
										}
									$("[data-app-role='saveButton']",'#productTabMainContent').addClass('ui-state-highlight');}
								}); //rows are draggable to specify variation order.
							
							var $storeOptions = $("[data-app-role='productVariationManagerStoreContainer']",$target);
							$('tbody',$storeOptions).empty(); //tmp fix. time permitting, remove this and determine why content is being double-added. ###
							$storeOptions.anycontent({'data':_app.data.adminSOGComplete});
							$('.gridTable',$storeOptions).anytable(); //make header click/sortable to make it easier to find sogs.
							
							_app.u.handleButtons($target);
// compare the sog list and the variations on the product and disable the buttons.
// this avoids the same SOG being added twice.
							_app.ext.admin_prodedit.u.handleApply2ProdButton($target);
							
							}		
						
						}}},'mutable');
					
					_app.model.dispatchThis('mutable');
	
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.a.getProductVariationManager, either $target not specified or PID ["+PID+"] was left blank.","gMessage":true});
					}
				} //showProductVariationManager
	
			},
	

	
	////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	
	
		renderFormats : {

// in this case, we aren't modifying an attribute of $tag, we're appending to it. a lot.
//this code requires the includes.js file.
//it loops through the products options and adds them to the fieldset (or whatever $tag is, but a fieldset is a good idea).
//In this case, ONLY inventory-able variations are output.
			skufindervariations : function($tag,data)	{
				_app.u.dump("BEGIN admin_prodedit.renderFormats.skufindervariations");
				var pid = data.value.pid; 
				var formID = $tag.closest('form').attr('id'); //move up the dom tree till the parent form is found
				if(!$.isEmptyObject(data.value['@variations']) && _app.model.countProperties(data.value['@variations']) > 0)	{
					$tag.attr('data-pid',pid);
					$("<div \/>").attr('id','JSONpogErrors_'+pid).addClass('zwarn').appendTo($tag);
					var $display = $("<div \/>").addClass('skuFinder'); //holds all the pogs and is appended to at the end.
					pogs = new handlePogs(data.value['@variations'],{"formId":formID,"sku":pid});
					var pog;
					if(typeof pogs.xinit === 'function')	{pogs.xinit()}  //this only is needed if the class is being extended (custom sog style).
					var ids = pogs.listOptionIDs();
					for ( var i=0, len=ids.length; i<len; ++i) {
						pog = pogs.getOptionByID(ids[i]);
						if(pog.inv)	{
							$display.append(pogs.renderOption(pog,pid));
							}
						}
					//skipTracks keeps this change from updating the save button. 
					// $(':input',$display).addClass('skipTrack').attr('required','required');	 // why was this *required* (breaks when skufinder hidden + non-inventoriable options)																					
					$(':input',$display).addClass('skipTrack');
					if(data.bindData.appclick)	{
						$display.append("<button class='applyButton' data-app-click='"+data.bindData.appclick+"'>load</button>");
						}
					$display.appendTo($tag);	
					}
				}, //skufindervariations


			link2eBayByID : function($tag,data)	{
				$tag.off('click.link2eBayByID').on('click.link2eBayByID',function(){
					linkOffSite("http://www.ebay.com/itm/"+data.value,'',true);
					});
				},

//was originally used in the product editor. Is no longer, but the render format is used in the picker still.
			manageCatsList : function($tag,data) {
				var cats = Object.keys(data.value).sort(function (a, b) {return a.toLowerCase().localeCompare(b.toLowerCase());});
				for(var index in cats) {
					if(cats[index]) {
//						_app.u.dump(" -> index: "+cats[index]);
//						_app.u.dump(" -> data.value[index]: "+data.value[cats[index]]);
						var obj = {'MCID':cats[index], 'product_count' : data.value[cats[index]].length, '@product' : data.value[cats[index]]}
						$o = _app.renderFunctions.transmogrify({'mcid':index},data.bindData.loadsTemplate,obj);
						$tag.append($o);
						}
					}
				},

			prodImages : function($tag,data)	{
	//			_app.u.dump("BEGIN admin_prodedit.renderFormat.prodImages");
				var L = data.bindData.max || 99;
	//			_app.u.dump(" -> data.value: "); _app.u.dump(data.value);
				if(data.value && data.value['%attribs'])	{
					for(var i = 1; i <= 30; i += 1)	{
						var imgName = data.value['%attribs']['zoovy:prod_image'+i];
						var w = data.bindData.w || 75;
						var h = data.bindData.h || 75;
						var b = data.bindData.b || 'ffffff';
		//				_app.u.dump(" -> imgName: "+imgName);
						if(_app.u.isSet(imgName))	{
							$tag.append("<li><a title='"+imgName+"'><img src='"+_app.u.makeImage({'tag':0,'w':w,'h':h,'name':imgName,'b':b})+"' width='"+w+"' height='"+b+"' alt='"+imgName+"' title='"+imgName+"' data-originalurl='"+_app.u.makeImage({'tag':0,'w':'','h':'','name':imgName,'b':'ffffff'})+"' data-filename='"+imgName+"' \/><\/a><\/li>");
							//data-filename on the image is used in the 'save' in the product editor - images panel.
							}
						else	{break;} //exit once a blank is hit.
						}
					}
				},



			amazonIs : function($tag,data)	{
//				_app.u.dump("BEGIN admin_prodedit.renderFormats.amazonIs.");
				var sum = 0;
				for(index in data.value['%IS'])	{
					sum += Number(data.value['%IS'][index]);
					}
				if(sum)	{
					$("<button \/>").text("show report").button({icons: {primary: "ui-icon-circle-arrow-s"},text: false}).on('click',function(){
						var $btn = $(this);
						if($btn.find('.ui-icon').hasClass('ui-icon-circle-arrow-s'))	{
							$btn.button({icons: {primary: "ui-icon-circle-arrow-w"},text: false});
							$btn.parent().find('.toggleMe').show();
							}
						else	{
							$btn.button({icons: {primary: "ui-icon-circle-arrow-s"},text: false})
							$btn.parent().find('.toggleMe').hide();
							}
						}).appendTo($tag);
					$("<div \/>").addClass('displayNone toggleMe').append(_app.ext.admin_prodedit.u.amazonFeeds2Message(data.value['SKU'],data.value['%IS'])).appendTo($tag);
					}
				else	{} //all the values of the is report are zero. no point showing an empty report.
				},

			bigListOptions : function($tag,data){
				var L = data.value.length;
				for(var i = 0; i < L; i += 1)	{
					if(i > 0)	{$tag.append("\n")} //hard line separators but don't want orphan whitespace in textarea
					$tag.append(data.value[i].prompt)
					}
				},

			ebayLaunchProfiles : function($tag,data)	{
				_app.u.dump("BEGIN admin_prodedit.renderFormat.ebayLaunchProfiles. data.value: "+data.value);
				if(_app.data.adminEBAYProfileList)	{
					if(_app.data.adminEBAYProfileList['@PROFILES'].length)	{
						var profiles = _app.data.adminEBAYProfileList['@PROFILES']; //shortcut.
						var L = profiles.length, haveMatch = false;
						
						for(var i = 0; i < L; i += 1)	{
							var $option = $("<option \/>").text(profiles[i].PROFILE).val(profiles[i].PROFILE);
							if(profiles[i].PROFILE == data.value)	{
								haveMatch = true;
								$option.prop('selected','selected');
								}
							$option.appendTo($tag);
							}
						if(haveMatch){}
						else	{
							var $option = $("<option \/>").text("-- "+data.value+" -- (invalid)").val(data.value).prop('selected','selected').appendTo($tag);
							}
						}
					else	{
						$tag.insertAfter($("<div \/>").anymessage({"message":"It appears as though you have no launch profiles. Please create some prior to configuring this product for eBay.",'persistent':true}));
						}
					}
				else	{
					$tag.insertAfter($("<div \/>").anymessage({"message":"ebay profile list not in memory.","gMessage":true}));
					}				
				}
			
			}, //renderFormats
	
	
	////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
	
	
		u : {

			handleOptionsSortableStop : function($tr)	{
				if($tr.closest('table').data('app-role') == "storeVariationsOptionsContainer")	{} //same parent. do nothing.
				else	{
					//moved to new parent.
					$('button',$tr).show();
					$("[data-app-click='admin_prodedit|variationsOptionToggle']",$tr).hide();
					$tr.addClass('edited');
					$tr.closest('.anyformEnabled').anyform('updateChangeCounts');
					_app.u.handleButtons($tr);
					}
				},

//will go through the list of sogs that are enabled and disable the sog in the 'store variations' list.
			handleApply2ProdButton : function($container)	{
				var $storeOptions = $("[data-app-role='productVariationManagerStoreContainer']",$container);
				$("[data-app-role='productVariationManagerProductTbody'] tr",$container).each(function(){
					var $tr = $(this);
					if($tr.data('id') && $tr.data('id').charAt('0') != '#')	{ //ignore pogs.
						$("tr[data-id='"+$tr.data('id')+"']",$storeOptions).find('button').button('disable'); //disable 'add to product' button if already enabled on the product.
		//				$("tr[data-id='"+$tr.data('id')+"']",$storeOptions).hide();  //don't use this. causes alternating colors to get messed up.
						}
					})

				},


//product must be in memory with sku:1 passed for this to work.
			thisPIDHasInventorableVariations : function(pid)	{
				var r = false;
				if(pid && _app.data['adminProductDetail|'+pid] && _app.data['adminProductDetail|'+pid]['@variations'])	{
					for(var i = 0, L = _app.data['adminProductDetail|'+pid]['@variations'].length; i < L; i+=1)	{
						if(_app.data['adminProductDetail|'+pid]['@variations'][i].inv >= 1)	{r = true; break;} //once a single inventory-able variation is found, no reason to continue.
						}
//					_app.u.dump(" -> sku: "+_app.data['adminProductDetail|'+pid]['@skus'][0].sku);
					}
				else	{
					//missing something we need.
					$('#globalMessaging').anymessage({"message":"in admin_prodedit.u.thisPIDHasInventorableVariations, either pid ["+pid+"] not set or product record ["+typeof _app.data['adminProductDetail|'+pid]+"](with sku detail) not in memory.","gMessage":true});
					}
				dump(" -> pid has inventory-able variations: "+r);
				return r;
				},

			amazonFeeds2Message : function(SKU,feedsObj) {
			
				var $messaging = $("<div \/>");
			
				// describe_bw - this function takes a bitwise value and returns a string of the equivalent feed names
				// eg ( If a bitwise value of 3 is passed to this function it will return "Init,Products" (Init is 1, Products is 2)
				var describe_bw = function(bitVal) {
//						_app.u.dump('made it to descibe_bw');
			
						var $feedsArray =  [];
						if ((bitVal & 1<<0)>0) { $feedsArray.push("Init"); }
						if ((bitVal & 1<<1)>0) { $feedsArray.push("Products"); }
						if ((bitVal & 1<<2)>0) { $feedsArray.push("prices"); }
						if ((bitVal & 1<<3)>0) { $feedsArray.push("images"); }
						if ((bitVal & 1<<4)>0) { $feedsArray.push("inventory"); }
						if ((bitVal & 1<<5)>0) { $feedsArray.push("relations"); }
						if ((bitVal & 1<<6)>0) { $feedsArray.push("shipping"); }
			
						// these are high level product bits
						if ((bitVal & 1<<10)>0) { $feedsArray.push("unreal"); }
						if ((bitVal & 1<<14)>0) { $feedsArray.push("blocked"); }
						if ((bitVal & 1<<15)>0) { $feedsArray.push("deleted"); }
			
						var feedString = String($feedsArray);
			
						return(feedString);
						}
				
			
				// feedsLookup holds a list of key value pairs (the key being the feed type and the value being the equivalent bitwise value.
				// The lookup is used by JT when he needs to know the bitwise value of a specific feed type.
				var feedLookupObj = {
					'all' : '2+4+8+16+32+64',  // 2+4+8+16+32+64   (NOT INIT)
					'init' : '1', //  'init_mask' : '~1',
					'products' : '2',// 'products_mask' : '~2',
					'prices' : '4',// 'prices_mask' : '~4',
					'images' : '8',// 'images_mask' : '~8',
					'inventory' : '16',// 'inventory_mask' : '~16',
					'relations' : '32',// 'relations_mask' : '~32',
					'shipping' : '64',// 'shipping_mask' : '~64',
					'docs' : '128',
					'not_needed' : '1<<10', // this product has been flagged as 'not needed' - it will never be transmitted. (ex: vcontainer)
					'parentage' : '1<<14', // this bit is used during a product syndication to see if options changed.
					'blocked' : '1<<14', // used for high level product actions (ex: error)
					'deleted' : '1<<15',
					}
			
			
			
			
			
				var $UNKNOWN = (feedsObj['TODO'] | feedsObj['SENT'] | feedsObj['WAIT'] | feedsObj['DONE'] | feedsObj['ERROR']);
				$UNKNOWN = (~$UNKNOWN & feedLookupObj['all']);
			
			
				if ((feedsObj['TODO'] & feedLookupObj['deleted'])>0) {
					$("<div  \/>").text("Delete from Amazon in Queue").appendTo($messaging);
					$UNKNOWN = 0;  // we know exactly what is going on.
					}
				else if (feedsObj['TODO']>0) {
					$("<div  \/>").text("Feeds to Send: " + describe_bw(feedsObj['TODO'])).appendTo($messaging);
					$("<div class='hint explanation' \/>").text("Feeds to send (also called TODO) is an indicator that one or more fields in the product has changed, but no feed file has been sent to amazon with those changes.  Feeds are sent at different times based on the account configuration").appendTo($messaging);
					}
				else	{}
			
			
				if(feedsObj['SENT']>0) {
					$("<div  \/>").text("Sent: " + describe_bw(feedsObj['SENT'])).appendTo($messaging);
					$("<div class='hint explanation' \/>").text("DEFINITION: Sent is an indicator that a feed file with this information has (historically) been transfered to amazon successfully.").appendTo($messaging);
					}
			
			
				if(feedsObj['WAIT']>0) {
					$("<div  \/>").text("Waiting: " + describe_bw(feedsObj['WAIT'])).appendTo($messaging);
					$("<div class='hint explanation' \/>").text("DEFINITION: Waiting is an indicator that a feed file with this information has been transmitted but Amazon has not processed it.").appendTo($messaging);
					}
				
				if(feedsObj['DONE']>0) {
					$("<div  \/>").text("Finished: " + describe_bw(feedsObj['DONE'])).appendTo($messaging);
					$("<div class='hint explanation' \/>").text("DEFINITION: Finished is an indicator that the system received a successful response to the last update. It is possible for a feed to be both in \"Done\" and another status such as \"Feeds to Send\", or \"Sent\" in the case of apending update, or an unconfirmed update").appendTo($messaging);
					}
			
				if(feedsObj['ERROR']>0) {
					$("<div  \/>").text("Errors: " + describe_bw(feedsObj['ERROR'])).appendTo($messaging);
					}
			
				if ( ($UNKNOWN & feedLookupObj['all']) >0) {
					$("<div  \/>").text("Unknown: " + describe_bw($UNKNOWN)).appendTo($messaging);
					}
						
			// JT - HELP ME- Can we add something here to indicate that the product has been updated since the last sync?  !!!
			
			// lets summarize the product's state.
				if ((feedsObj['TODO'] & feedLookupObj['init'])>0) {
					// all feeds waiting to be sent
					$("<div class='summary' \/>").text(SKU + " has been queued for a full sync and will be sent shortly").appendTo($messaging);
					}
				else if ( ((feedsObj['ERROR'] > 0) && (feedsObj['DONE'] & feedLookupObj['init'])==0) ) {
					// we have an error and init is still turned on
					$("<div class='summary' \/>").text(" An error has been returned for the [" + describe_bw(feedsObj['ERROR']) + "feed/feeds. Please review the error message detailed above. As our records indicate " + SKU + " has either never been sent to Amazon or has recently been reset, The error(s) will need to be corrected before any feeds can be sent.").appendTo($messaging);
					}
				else if (feedsObj['ERROR'] > 0) {
					// we have an error but init has been turned off - the feeds that don't have errors will still be sent
					$("<div class='summary' \/>").text(" An error has been returned for the ["+describe_bw(feedsObj['ERROR']) + "feed/feeds of "+SKU+". Although feeds that have not encountered errors may continue to syndicate this issue should be resolved order for the sku to function correctly. Please review the error message detailed above.").appendTo($messaging);
					}
				else if ((feedsObj['SENT'] & feedLookupObj['init'])>0 && (feedsObj['DONE'] & feedLookupObj['init'])==0) {
					// init sent - waiting to process
					$("<div class='summary' \/>").text("The initial product feed has been sent for" + SKU + "In order for the other feeds [" + describe_bw[feedsObj['TODO']] + "] to be accepted by Amazon the initial product feed must be processed first. As soon as Amazon confirm it has been processed we will send the remaining feeds").appendTo($messaging);
					}
				else if ((feedsObj['DONE'] & feedLookupObj['init'])>0 && feedsObj['TODO']>0) {
					// init done - waiting for others to sync
					$("<div class='summary' \/>").text("The initial product feed for "+SKU+" has been processed. The other feeds [" + describe_bw[feedsObj['TODO']] + "] will be sent during the next sync. If the product feed is included in that list, the product has been saved since the intial sync and will be sent again").appendTo($messaging);
					}
				else if ((feedsObj['SENT'] & feedLookupObj['all']) == feedLookupObj['all']){
					// all feeds have been sent but we're waiting for Amazon to process
					$("<div class='summary' \/>").text("All feeds have now been sent for " + SKU + ". We are now waiting for Amazon to process them.").appendTo($messaging);
					}
				else if ((feedsObj['DONE'] & feedLookupObj['all']) == feedLookupObj['all']) {
					// all feeds finished
					$("<div class='summary' \/>").text("Amazon has notified us that all feeds have been processed, and" + SKU + " is now live on Seller Central.").appendTo($messaging);
					}
				else {
					// should never be reached
					$("<div class='summary' \/>").text("Sorry, something went wrong when trying to generate a summary (this tool is still in development)").appendTo($messaging);
					}
				return $messaging;
				},


/*
** 201404 -> for product with a lot of skus, rather than show all X skus, a pid finder is displayed.
the pid finder allows a merchant to choose by variation options which pid they want to edit.
*/
			addSKUFinderTo : function($target,opts)	{
				opts = opts || {};
				
				if($target instanceof jQuery && opts.pid)	{
					
					}
				else if(!opts.pid)	{
					$target.anymessage({"message":"In admin_prodedit.u.addSKUFinderTo, no pid was defined in opts","gMessage":true});
					}
				else	{
					$("#globalMessaging").anymessage({"message":"In admin_prodedit.u.addSKUFinderTo, $target is not an instance of jquery.","gMessage":true});
					}
				
				},




//** 201334 -> for new product manager interface.
			handleNavTabs : function()	{
				dump("BEGIN admin_prodEdit.u.handleNavTabs");
				_app.ext.admin.u.uiHandleNavTabs({}); //will clear out navtabs area.
				var $navtabs = $('#navTabs');// tabs container
//the div is created to contain navtab content so that events and anycontent can be attached to it instead of navtabs (which means everything is dropped when navtabs is cleared, which is better for navigating between tabs.
				var $div = $("<div \/>");
				$div.anycontent({'templateID':'productEditorNavtabsTemplate','data':{}});
				$div.appendTo($navtabs);

// commented out till management categories get added to elastic.				

//buildFilterListByCommand -> whitelisted by cmd type. will use local storage if available.
				_app.ext.admin_prodedit.u.buildFilterListByCommand('adminEBAYProfileList');
//				_app.ext.admin_prodedit.u.buildFilterListByCommand('adminSupplierList'); //need to uncomment data-elastic-key='prod_supplierid' in .html file too.
				
				_app.u.handleButtons($navtabs);


				var $filterMenu = $navtabs.find("[data-app-role='productManagerFilters']");
				$filterMenu.css({'position':'absolute','top':'33px','left':0,'right':0,'z-index':'1000'});
				//set css for management categories menu.
				
			
				$('.filterList',$filterMenu).selectable();
				$('.filterList li',$filterMenu).addClass('pointer');
				$( ".sliderRange" ).slider({
					range: true,
					min: 0,
					max: 3000,
					values: [ 0, 3000 ],
					slide: function( event, ui ) {
						$("[data-app-role='priceFilterRange']:first",$navtabs).text( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
						}
					});
				$( "[data-app-role='priceFilterRange']" ).val( "$" + $( ".sliderRange" ).slider( "values", 0 ) + " - $" + $( ".sliderRange" ).slider( "values", 1 ) );
				_app.u.addEventDelegation($div);
				},

//Used in product manager interface.
			handleManagementCategoryFilters : function()	{
//				_app.u.dump("BEGIN admin_prodedit.u.handleManagementCategoryFilters");
				var $navtabs = $('#navTabs');// tabs container
				var $manCatsList = $("[data-app-role='managementCategoryList']",$navtabs);
				
//				_app.u.dump(" -> $manCatsList.length: "+$manCatsList.length);
				if($manCatsList.children().length)	{
//					_app.u.dump("Management categories have been rendered already. leave them as they are");
					} //already rendered management categories.
				else	{
					var cmdObj = {
						_cmd : "adminProductManagementCategoriesComplete",
						_tag : {
							callback : function(rd){
//								_app.u.dump(" -> executing callback for management categories request");
								if(_app.model.responseHasErrors(rd)){
//									_app.u.dump(" -> management categories response had errors.");
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									var $tmp = $("<ul \/>"); //add list items to this, then move to $manCatsList after. decreases DOM updates which is more efficient.
//									_app.u.dump(" -> rd: "); _app.u.dump(rd);
									if(_app.data[rd.datapointer]['%CATEGORIES'] && !$.isEmptyObject(_app.data[rd.datapointer]['%CATEGORIES']))	{
										var cats = Object.keys(_app.data[rd.datapointer]['%CATEGORIES']).sort(function (a, b) {return a.toLowerCase().localeCompare(b.toLowerCase());});
										for(var index in cats)	{
											$tmp.append($("<li data-elastic-term='"+cats[index]+"' \/>").data('management-category',cats[index]).html("<span class='ui-icon ui-icon-folder-collapsed floatLeft'></span> "+(cats[index] || 'uncategorized')));
											}
//										_app.u.dump(' -> $tmp.children().length: '+$tmp.children().length);
										$manCatsList.append($tmp.children());
										}
									else	{
										//successful call, but no management categories exist. do nothing.
										}
									}
								},
							datapointer : 'adminProductManagementCategoriesComplete'
							}
						}
					if(_app.model.fetchData('adminProductManagementCategoriesComplete'))	{
						_app.u.handleCallback(cmdObj._tag)
						}
					else	{
						_app.model.addDispatchToQ(cmdObj,'mutable');
						}

					
					}
				
				}, //handleManagementCategoryFilters
			

//vars should include:  _cmd (which should match the data-app-role value), arrayPointer (for launchProfiles, this would be @PROFILES
			buildFilterListByCommand : function(_cmd)	{
				var vars = {}
				if(_cmd == 'adminSupplierList')	{
					vars.arrayPointer = '@SUPPLIERS';
					vars.termPointer = 'CODE';
					vars.textPointer = 'NAME';
					}
				else if(_cmd == 'adminEBAYProfileList')	{
					vars.arrayPointer = '@PROFILES';
					vars.termPointer = 'PROFILE';
					vars.textPointer = 'PROFILE';
					}				
				
//				_app.u.dump("BEGIN admin_prodedit.u.handleLaunchProfileFilters");
				var $navtabs = $('#navTabs');// tabs container
				var $list = $("[data-app-role='"+_cmd+"']",$navtabs);

				if($list.children().length)	{
//					_app.u.dump("list rendered already. leave them as they are");
					} //already rendered management categories.
				else	{
					var cmdObj = {
						_cmd : _cmd,
						_tag : {
							callback : function(rd){
//								_app.u.dump(" -> executing callback for management categories request");
								if(_app.model.responseHasErrors(rd)){
//									_app.u.dump(" -> management categories response had errors.");
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									var $tmp = $("<ul \/>"); //add list items to this, then move to $manCatsList after. decreases DOM updates which is more efficient.
//									_app.u.dump(" -> rd: "); _app.u.dump(rd);
									var data = _app.data[rd.datapointer][vars.arrayPointer]; //shortcut
									if(data && !$.isEmptyObject(data))	{
										for(var i in data)	{
											$tmp.append($("<li data-elastic-term='"+data[i][vars.termPointer]+"' \/>").text((data[i][vars.textPointer].toString().toLowerCase())));
											}
										$list.append($tmp.children());
										}
									else	{
										//successful call, but no management categories exist. do nothing.
										 $list.closest('fieldset').hide();
										}
									}
								},
							datapointer : _cmd
							}
						}

					if(_app.model.fetchData(_cmd))	{
						_app.u.handleCallback(cmdObj._tag)
						}
					else	{
						_app.model.addDispatchToQ(cmdObj,'mutable');
						}

					
					}
				
				}, //handleLaunchProfileFilters


			handleImagesInterface : function($context,pid)	{
//				_app.u.dump("BEGIN admin_prodedit.u.handleImagesInterface.  pid: "+pid);
				if(pid && $context && $context instanceof jQuery)	{
					pid = pid.toString(); //treat pid as string. 'could' be treated as number if no letters.

//once translated, tag the product imagery container with the current # of images. This is used in the save to make sure if there are fewer images at save than what was present at start, the appropriate image attributes are 'blanked' out.
					var $prodImageUL = $("[data-app-role='prodImagesContainer']",$context);
					$prodImageUL.attr('data-numpics',$prodImageUL.children().length);
					
		
//@skus will always have one record. Sku specific imagery are only necessary if MORE than one sku is present and, even then, the record for the pid itself doesn't need sku specific images. if an item DOES have options, 'pid' ( by itself ) won't appear in the inventory record.
					var $container = $("[data-app-role='prodEditSkuImagesContainer']",$context).show();
					
//only run through SKU specific images if this is being run on variations tab
					if($container.length)	{
						$container.empty();
						var skus = _app.data['adminProductDetail|'+pid]['@skus']; //shortcut
						var L = skus.length;
						var $table = $("<table \/>").addClass('gridTable').appendTo($container);
						for(var i = 0; i < L; i += 1)	{
							var $tr = _app.renderFunctions.transmogrify(skus[i],'prodEditSKUImageTemplate',skus[i])
							$tr.appendTo($table);
							}
						}
		
		//images are sortable between lists. When an image is dropped, it is cloned in the new location and reverted back in the original.
					$(".sortableImagery",$context).sortable({
						'items' : 'li:not(.dropzone)',
						'appendTo' : $context,
						'cancel' : '.ui-icon', //if an icon is the drag start (such as clear image) do not init sort on element.
						'containment' : $context,
						'placeholder' : 'ui-state-highlight positionRelative marginRight marginBottom floatLeft',
						'forcePlaceholderSize' : true,
						'cursor' : "move",
						'cursorAt' : { left: 5 },
						'connectWith' : '.sortableImagery',
						'stop' : function(event,ui)	{
							//this child and each child after in list gets 'edited' class because the position will change. (if it was image5, it is now image6)
							ui.item.parent().children().not('.dropzone').each(function(){
								if($(this).index() >= ui.item.index())	{
									$(this).addClass('edited');
									}
								});
							_app.ext.admin.u.handleSaveButtonByEditedClass(ui.item.closest('form')); //updates the save button change count.
							},
						'remove' : function(event, ui) {
							ui.item.after(ui.item.clone().addClass('edited'));//clone the dropped item into the new parent at the drop index.
							ui.item.parent().find('.dropzone').appendTo(ui.item.parent()); //always put the dropzone at the end of the list. possible in drag to add image after the dropzone.
							$(this).sortable('cancel'); //cancel the move so the image stays where it was originally.
							},
						'revert' : true
						});

					$(".sortableImagery",$context).anydropzone({
						folder : 'product/'+pid.toString().toLowerCase().replace(/[^A-Z0-9]/ig, "_"), //folders are lowercase w/ no special characters except underscore.
						drop : function(files,event,self){
							_app.model.destroy("adminImageFolderList");
							for (var i = 0; i < files.length; i++) {
								var file = files[i];
								var imageType = /image.*/;
				
								if (!file.type.match(imageType)) {
									continue;
									}
								var $target = self.element;
								var img = document.createElement("img");
								img.classList.add("obj");
								img.file = file;
								if($target.attr('data-app-role') == 'skulist')	{
									img.height = 35;
									img.width = 35;
									}
								else	{
									img.height = 75;
									img.width = 75;
									}
								img.classList.add('newMediaFile');
				
								
								$target.children().last().before($("<li \/>").addClass('edited').append(img)); //the last child is the 'click here'. put new image before that.
								var reader = new FileReader();
								reader.onload = (function(aImg) { return function(e) { aImg.src = e.target.result; }; })(img);
								reader.readAsDataURL(file);
								_app.ext.admin.u.handleSaveButtonByEditedClass($target.closest('form')); //updates the save button change count.
								}
							},
						upload : function(f,e,rd)	{_app.u.dump(' -> logged an upload.')}
						}).append($("<li class='dropzone'>Click or drop file here to add image</li>").on('click',function(){
							_app.ext.admin_prodedit.u.handleAddImageToList($(this).parent());
							}));
		
					$context.on('mouseenter','img',function(e){
						var $target = $(e.target).closest('li');
						
						$target.on('mouseleave',function(e){
							$target.find('span').empty().remove(); //get rid of all children.
							});
						
						$target.append("<span class='imageIDRef ui-corner-tr small'>image "+($target.index() + 1)+"<\/span>");
						$("<span \/>")
							.attr('title','Disassociate image from '+pid)
							.css({
								'position':'absolute',
								'top':'3px',
								'right':'3px'
								})
							.button({icons: {primary: "ui-icon-circle-close"},text: false})
							.on('click',function(){
								var $li = $(this).closest('li');
								$li.hide();
								//add edited to this li and each li thereafter. they'll get shifted down (image9 becomes image8) on save.
								$("li",$li.parent()).not('.dropzone').each(function(index){
									if(index >= $li.index())	{
										$(this).addClass('edited');
										}
									});
								_app.ext.admin.u.handleSaveButtonByEditedClass($li.closest('form'));
								}) //don't remove, just hide. allows save script to determine how many images were present to 'remove'
							.appendTo($target);
							})


					}
				else	{
					if($context && $context instanceof jQuery)	{
						$context.anymessage({'message':'In admin_prodedit.u.handleImagesInterface, pid not specified.','gMessage':true})
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In admin_prodedit.u.handleImagesInterface, $context either not specified or not an instance of jQuery.","gMessage":true});
						}
					}

				},
	//type is an input type.  number, select, textarea or something specific to us, like finder, media, etc.
	//data is the individual flexedit piece of data. an object w/ id, type, title set. This is a combo of what came from merchant data and the global settings.
	//prodData is an optional object. should be adminProductDetail and include %attribs, inventory, etc.
			flexBuildInput : function(type,data,prodData)	{
//				_app.u.dump("BEGIN admin_prodedit.u.flexBuildInput. type: "+type);
				
				//create empty product object if one isn't passed.
				prodData = prodData || {}; 
				prodData['%attribs'] = prodData['%attribs'] || {}; //this'll keep JS errors from occuring w/out constantly checking for attribs b4 the %attribs.attribute.
				
//				_app.u.dump('TYPE: '+type); _app.u.dump(data);
				var $r;
				//if there is only 1 sku and that sku does NOT have a :, then there are no inventory-able variations and the input should NOT be treated as a 'sku' input.
				if(data.sku && (prodData['@skus'].length > 1 || prodData['@skus'][0].sku.indexOf(':') >0 ))	{
					$r = $("<div \/>").data(data).addClass('label');
					$r.append($("<div \/>").attr('title',data.id).text(data.title || data.id));
					if(data.hint)	{$r.find('div').append($("<span class='toolTip' title='"+data.hint+"'>?<\/span>"))}
					
	//				$r.append($("<div \/>").anymessage({'message':'No editor for SKU level fields yet.'}));
					var L = prodData['@skus'].length;
	//				_app.u.dump(" -> data.id: "+data.id);
					var $div = $("<div \/>").addClass('marginLeft handleAsSku');
					for(var i = 0; i < L; i += 1)	{
//						_app.u.dump(i+") "+data.id);
//for cases where there are no inventory-able variations present.
						if(prodData['@skus'][i] && prodData['@skus'][i].sku && prodData['@skus'][i].sku.indexOf(':') < 0)	{
							_app.u.dump(" -> assigning product attribs as sku-specific attribs because no : in sku");
							prodData['@skus'][i]['%attribs'] = prodData['%attribs'];
							}
						//if sku is set, this'll cause a never ending loop. so stid is used in the save (from data() on the label).
						$div.append(_app.ext.admin_prodedit.u.flexBuildInput(type,$.extend(_app.u.getBlacklistedObject(data,['sku']),{'title':prodData['@skus'][i].sku,'stid':prodData['@skus'][i].sku}),prodData['@skus'][i]));
//						$("<label \/>",{'title':data.id}).html("<span>"+prodData['@skus'][i].sku+"<\/span>").append("<input type='text' class='handleAsSku' size='20' name='"+data.id+"|"+prodData['@skus'][i].sku+"' value='"+(prodData['@skus'][i]['%attribs'][data.id] || "")+"' \/>").appendTo($r);
						}
					$div.appendTo($r);
					}
				else	{
	
					$r = $("<label \/>").data(data);
					prodData = prodData || {'%attribs':{}};
					$r.append($("<span \/>").attr('title',data.id).text(data.title || data.id));
					if(data.hint)	{$r.find('span').append($("<span class='toolTip' title='"+data.hint+"'>?<\/span>"))}
	
					if(type == 'textarea')	{
						var $textarea = $("<textarea \/>",{'name':data.id,'rows':data.rows || 5, 'cols':data.cols || 40});
						
						$textarea.val(prodData['%attribs'][data.id] || "");
						if(data.type == 'textlist')	{
							if(data.startsize)	{
								$textarea.attr('rows',data.startsize);
								$textarea.on('focus',function(){
									$textarea.attr('rows',$data.max || 10);
									}).on('blur',function(){
										$textarea.attr('rows',data.rows || 5)
										});
								$('.toolTip',$r).append(" Only 1 entry per line.");
								}
							}
						
						$textarea.appendTo($r);
						}
		/*			else if(type == 'ebay/storecat')	{
		//				$r.append("not done yet");
						var $input = $("<input \/>",{'type':'text','size':'9','name':data.id})
						$input.val(prodData['%attribs'][data.id] || "");
						$input.appendTo($r);
						
		//$("<button>Chooser</button>").on('click',function(){
		//	_app.ext.admin_marketplace.a.showEBAYCategoryChooserInModal($input,{'pid':'MODEL10','categoryselect':'primary'},jQuery(_app.u.jqSelector('#','ebay:category_name')));
		//	}).appendTo($r);				
						}
		*/			else if(type == 'select')	{
						var $select = $("<select \/>",{'name':data.id});
						//data-reset requires a value.
						if(data.type == 'select')	{
							$select.append($("<option \/>",{'value':''}).text(""));
							}
						
						if(data.options)	{
							var L = data.options.length;
							
							var haveMatch = false;
							for(var i = 0; i < L; i += 1)	{
								var $option = $("<option \/>",{'value':data.options[i].v}).text(data.options[i].p);
								if(data.options[i].v == prodData['%attribs'][data.id])	{
									$option.prop('selected','selected');
									haveMatch = true;
									}
								$select.append($option);
								}
							
							$select.val(prodData['%attribs'][data.id] || "");
			// now take a look and see if the value set for this attrib is valid. respond accordingly.
							_app.u.dump("option[value='"+prodData['%attribs'][data.id]+"'].length: "+$("option[value='"+prodData['%attribs'][data.id]+"']").length);
							if(haveMatch)	{} //value exists, no worries.
							else if(data.type == 'selectreset')	{ //selected value isn't valid. reset to first option.
								$r.anymessage({'message':'The value for '+data.id+' was invalid and this input requires a valid match. On save, this value will change to '+data.options[0].v});
								$select.val(data.options[0].v)
								}
								//prodData['%attribs'][data.id] is checked so no error is thrown if the value is blank.
							else if(data.type == 'select' && prodData['%attribs'][data.id])	{
								$r.anymessage({'message':'The value for '+data.id+' does not have a match in the default list of options for this attribute. Your value may not be right, but will be preserved on save unless you correct it.'});
								$select.append($("<option \/>",{'value':prodData['%attribs'][data.id]}).text("!!! invalid: "+prodData['%attribs'][data.id]));
								}
							else	{} //how the F did we get here?
							}
						$select.appendTo($r);
						}
					else if(type == 'button')	{
						var $btn = $("<button \/>").text(data.title || data.id);
						$btn.button();
						if(data.type == 'finder')	{
							if(prodData.pid)	{
								$btn.button().on('click',function(event){
									event.preventDefault();
									_app.ext.admin.a.showFinderInModal('PRODUCT',prodData.pid,data.id);
									})
								}
							else	{
								$btn.button('disable');
								}
							}
						else	{
							$btn.button('disable');
							}
						$btn.appendTo($r);
						}
					else if(type == 'image')	{
						var $input = $("<input \/>",{'type':'hidden','name':data.id,'id':'input_'+_app.u.guidGenerator()}).val(prodData['%attribs'][data.id]);
	//					_app.u.dump(" -> prodData['%attribs'][data.id]: "+prodData['%attribs'][data.id]);
						var $image = $(_app.u.makeImage({'w':'75','h':'75','alt':'','tag':true,'name':(prodData['%attribs'][data.id] || null)}));
						$image.attr('id','image_'+_app.u.guidGenerator());
		
						//return false; 				
						$input.appendTo($r);
						$image.appendTo($r);
						
						$("<button \/>").button().on('click',function(event){
							event.preventDefault();
							_app.ext.admin_medialib.a.showMediaLib({
								'eleSelector' : "#"+$input.attr('id'),
								'imageID' : "#"+$image.attr('id')
								});
							}).text('Select').appendTo($r);
						
						$("<button \/>").button().on('click',function(event){
							event.preventDefault();
							$image.attr('src','app-admin/images/blank.gif');
							$input.val('').addClass('edited'); //save uses the input, so add the class there.
							_app.ext.admin.u.handleSaveButtonByEditedClass($(this)); //make sure save button unlocks.
							}).text('Clear').appendTo($r);
						}
					else	{
						var $input = $("<input \/>",{'type':type,'name':data.id});
						if(type == 'checkbox')	{
							if(Number(prodData['%attribs'][data.id]) == 0 || !prodData['%attribs'][data.id])	{}
							else	{
								$input.prop('checked','checked')
								}
							}
						else {
							_app.u.dump(" -> type: "+type+" and data.type: "+data.type);
							$input.val(prodData['%attribs'][data.id] || "");
							$input.attr('size',data.size || 20); //do this early, then change for specific types, if necessary.

							if(data.type == 'currency')	{
								$input.attr({'step':'.01','min':'0.00','size':6})
								}
							else if(data.type == 'date')	{
								$input.datepicker({
									'dateFormat' : "yymmdd"
									});
								}

							if(type == 'number' || data.type == 'weight')	{
								$input.addClass('smallInput');
								$input.attr('size', data.size || 6); //default to smaller input for numbers, if size not set.
								}
							
							
							if(data.maxlength)	{
								$input.attr('maxlength',data.maxlength);
								}
							
							}
						$input.appendTo($r);
						}
					}
	
	
				
				return $r;
	
	
				}, //flexBuildInput
	
			flexJSON2JqObj : function(thisFlex,prodData)	{
//				_app.u.dump("BEGIN admin_prodedit.u.flexJSONJqObj");
//				_app.u.dump(" -> prodData: "); _app.u.dump(prodData);

				var r = $("<div \/>");; //what is returned. Either a chunk of html or an error message.
				if(thisFlex && typeof thisFlex === 'object')	{
//					_app.u.dump(" -> thisFlex is an object");
					var	L = thisFlex.length;
					prodData = prodData || {};
//					_app.u.dump(" -> thisFlex: "); _app.u.dump(thisFlex);
//					_app.u.dump(" -> L: "+L);
					for(var i = 0; i < L; i += 1)	{
						if(thisFlex[i].id)	{
//							_app.u.dump("ID: "+thisFlex[i].id);
							var gfo = _app.data['appResource|product_attribs_all.json'].contents[thisFlex[i].id] || {}; //Global Flex Object. may be empty for custom attributes.
							var type = thisFlex[i].type || gfo.type;
							if(type && _app.ext.admin_prodedit.vars.flexTypes[type] && _app.ext.admin_prodedit.vars.flexTypes[type].type)	{
								r.append(_app.ext.admin_prodedit.u.flexBuildInput(_app.ext.admin_prodedit.vars.flexTypes[type].type,$.extend(true,{},gfo,thisFlex[i]),prodData)) //thisFlex merged into gfo with precedence set of thisFlex attributes. 
								}
							else	{
	//							_app.u.dump(' -> no valid editor.');
								r.append($("<div \/>").anymessage({
									'message':'Could not find valid editor for this input.  flex input type = '+type+' and typeof flexTypes[type] = '+typeof _app.ext.admin_prodedit.vars[type]}));					
								}
							}
						else	{
							_app.u.dump(' -> no ID set');
							r.append($("<div \/>").anymessage({'message':'No ID set for this input.'}));
							}
						$('.toolTip',r).tooltip();
						}
					}
				else	{
					r.anymessage({message:'In flex2Form, thisFlex was either empty or not an object.','gMessage':true});
					}
				return r;
				}, //flexJSON2JqObj

	//executed when the 'add image' link is clicked, which appears in the images panel of the product editor (both in the sku and product imagery sections).
			handleAddImageToList : function($list)	{
				_app.u.dump("BEGIN admin_prodedit.u.handleAddImageToList");
	//			var $img = $list.children().last().find('img');
				var $img = $(":nth-child("+($list.children().length - 1)+")",$list).find('img');
	//if 'choose from media...' is pushed and cancelled prior to selection, there'd be an li w/ an img without a src. use that one if this is the case. otherwise, create an li w/ an img without a src.
	//or if this is the first image being added to a product.
				if($img.attr('src') || $list.children().length == 1)	{
					$img = $("<img \/>").attr({'width':($list.attr('data-app-role') == 'prodImagesContainer') ? 75 : 35,'height':($list.attr('data-app-role') == 'prodImagesContainer') ? 75 : 35});
					$("<li \/>").insertBefore($list.children().last()).append($img);
					}
				else	{}
	
				mediaLibrary($img,$("[name='throwAway']",$('#prod_images')),'Select Product Image');
				},
	
			handleCreateNewProduct : function($form)	{
				
				if(_app.u.validateForm($form))	{
					var sfo = $form.serializeJSON();
					var pid = sfo.pid;
					delete sfo.pid;
					
					$target = $('#createProductDialog');
					$target.showLoading({'message':'Creating product '+pid});


_app.model.addDispatchToQ({
	"_cmd":"adminProductCreate",
	"pid":pid,
	'%attribs':sfo,
	"_tag":{
		'callback':function(rd){
			$target.hideLoading();
			if(_app.model.responseHasErrors(rd)){
				_app.u.throwMessage(rd);
				}
			else	{
				$target.empty();
				$target.append("<p>Thank you, <b>"+pid+"<\/b> has now been created and added to your product task list. What would you like to do next?<\/p>");
				_app.ext.admin_prodedit.u.addProductAsTask({'pid':pid,'tab':'product','mode':'add'});
				$("<button \/>").text('Edit '+pid).button().on('click',function(){
					_app.ext.admin_prodedit.u.addProductAsTask({'pid':pid,'tab':'product','mode':'edit'});
					$target.dialog('close');
					}).appendTo($target);

				$("<button \/>").text('New Product').button().on('click',function(){
					_app.ext.admin_prodedit.a.showCreateProductDialog();
					}).appendTo($target);
				
				$("<button \/>").text('Close Window').button().on('click',function(){
					$target.dialog('close');
					}).appendTo($target);
				}
			}
		}
	},'immutable');
_app.model.dispatchThis('immutable');

					}
				else	{} //validate will handle any error display.
				

				}, //handleCreateNewProduct


			buildElasticTerms : function($obj,attr)	{
				
				var r = false; //what is returned. will be term or terms object if valid.
				if($obj.length == 1)	{
					r = {term:{}};
					r.term[attr] = $obj.data('elastic-term').toString().toLowerCase();
					}
				else if($obj.length > 1)	{
					r = {terms:{}};
					r.terms[attr] = new Array();
					$obj.each(function(){
						r.terms[attr].push($(this).data('elastic-term'));
						});
					}
				else	{
					//nothing is checked.
					}
				return r;
				},

			buildPriceRange4Filter : function($form)	{
//				_app.u.dump("BEGIN admin_prodedit.u.buildPriceRange4Filter");
				var r = false;
				var $slider = $('.sliderRange',$form);
				if($slider.length > 0)	{
					r = {"range":{}}
				//if data-min and/or data-max are not set, use the sliders min/max value, respectively.
					r.range[$slider.closest('fieldset').attr('data-elastic-key')] = {
						"from" : $slider.slider('values', 0 ) * 100,
						"to" : $slider.slider("values",1) * 100
						}
					}
//				_app.u.dump(" -> r: "); _app.u.dump(r);
				return r;
				},
				
			buildElasticFilters : function($form)	{

				var filters = {
					"and" : [] //push on to this the values from each fieldset.
					}//query
				
				
				var priceRange = _app.ext.admin_prodedit.u.buildPriceRange4Filter($form);
				if(priceRange)	{filters.and.push(priceRange)}
				
				
				$('.filterList',$form).each(function(){
					if(_app.ext.admin_prodedit.u.buildElasticTerms($(this).find('.ui-selected'),$(this).closest('fieldset').data('elastic-key')))	{
						filters.and.push(_app.ext.admin_prodedit.u.buildElasticTerms($(this).find('.ui-selected'),$(this).closest('fieldset').data('elastic-key')));
						}	
					});
				
				//and requires at least 2 inputs, so add a match_all.
				//if there are no filters, don't add it. the return is also used to determine if any filters are present
				if(filters.and.length == 1)	{
					filters.and.push({match_all:{}})
					}
				return filters;				
				
				},

	

//hides the other children in the manager template (such as the landing page content.)
//shows the results container and clears any previous results.
//ensures results table is an anytable.
//also clears the stickytab, if open.

			prepContentArea4Results : function($container){
				if($container instanceof jQuery)	{
					var $tbody = $("[data-app-role='productManagerSearchResults']",$container);
					$("[data-app-role='productManagerLandingContent']",$container).hide(); //dash board should not be visible in search mode.
					$("[data-app-role='productManagerResultsContent']",$container).show();
					$tbody.empty(); //clear results from last search.
//make sure results table has anytable applied.
					if($tbody.parent('table').data('widget-anytable'))	{}
					else	{
						$tbody.parent('table').anytable()
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.u.prepContentArea4Results, $container is not a valid instance of jquery.","gMessage":true});
					}
				}, //prepContentArea4Results
			
			handleProductKeywordSearch : function(obj)	{
				if(obj && obj.KEYWORDS)	{
					
					var $container = $(_app.u.jqSelector('#',_app.ext.admin.vars.tab+'Content'));
					_app.ext.admin_prodedit.u.prepContentArea4Results($container);
					$("[data-app-role='productManagerSearchResults']",$container).showLoading({'message':'Performing search...'});
					_app.ext.store_search.u.handleElasticSimpleQuery(obj.KEYWORDS,{'callback':'handlePMSearchResults','extension':'admin_prodedit','templateID':'prodManagerProductResultsTemplate','list':$("[data-app-role='productManagerSearchResults']",$container)});
					_app.model.dispatchThis();
					}
				else	{
					//keywords are required.
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.u.handleProductKeywordSearch, KEYWORDS not present in serialized form object.","gMessage":true});
					}
				}, //handleProductKeywordSearch
			
			variationTypeIsSelectBased : function(type)	{
				var r = false;
				if(type == 'select' || type == 'radio' || type == 'attribs' || type == 'imgselect' || type == 'imggrid')	{r = true}
				return r;
				}, //variationTypeIsSelectBased

	
	//the default option editor shows all the inputs.  Need to clear some out that are image or inventory specific.
	//executed from variationOptionUpdateShow and variationOptionAddShow
			handleOptionEditorInputs : function($target,data)	{
//				_app.u.dump("BEGIN admin_prodedit.u.handleOptionEditorInputs. type: "+data.type); _app.u.dump(data);
				$("[name='html']",$target).val(unescape($("[name='html']",$target).val()))
	//an inventory-able option does not have price or weight modifiers. price and weight are set by STID in the inventory panel.
				if(Number(data.inv))	{
					$('.invOnly',$target).show();
					$('.nonInvOnly',$target).hide();
					}
				else {
					$('.nonInvOnly',$target).show();
					$('.invOnly',$target).hide();
					}
				
				if(data.type == 'imgselect' || data.type == 'imggrid')	{
	//				_app.u.dump(" -> type is image based. show image inputs.");
					$('.imgOnly',$target).removeClass('displayNone');
					}
				$('.toolTip',$target).tooltip();
				}, //handleOptionEditorInputs

/*
adds the product to the 'product task' list
Required params include:
 -> tab: which tab's list this product should be added to. currently, only product is suppported
 -> pid: the product id in question.
 -> mode: add, edit, remove

$ele is the element which contained the 'add to product task list' button. probably a tr.
*/

			addProductAsTask : function(P,$ele)	{
//				_app.u.dump("BEGIN admin_prodedit.u.addProductAsTask");
				if(P.pid && P.tab && P.mode)	{
					this.manageProductTaskArr(P);
					var $taskList = $("ul[data-app-role='"+P.tab+"ContentTaskResults']",_app.u.jqSelector('#',P.tab+'Content'));

function handleAnimation()	{
	var r = false;
	if($ele instanceof jQuery && $ele.is('tr'))	{
		r = true;
		var $tmpTable = $("<table \/>"); //need a tmp table. orphan TR's are treated inconsistently between browsers.
		var $tr = $ele.data('clone') ? $ele.clone() : $ele; //setting data-clone allows for the item to be left in the row (ex: amazon marketplace status) or removed from row (ex: search results) when being animated.
		
		$tmpTable.addClass('gridTable').css({'z-index':'1000','position':'absolute','width':$ele.width()}).css($ele.offset());
		$tmpTable.appendTo($('body'));
		$tr.appendTo($tmpTable);
	
		$tmpTable.animate((_app.ext.admin.vars.tab == 'product') ? $li.parent().offset() : $.extend({'width':100},$('.productTab:first','#mastHead').offset()),'slow',function(){
			if($li instanceof jQuery)	{$li.show()}
			$tmpTable.hide().intervaledEmpty();
			});
		}
	return r;
	}
					
					
//it's possible the product editor hasn't been opened yet and the task list ul doesn't exist. 'list' is still managed thru manageProductTaskArr.					
					if($taskList.length)	{
							
	//					_app.u.dump(" -> $taskList.length: "+$taskList.length);
						var $li = $("li[data-pid='"+P.pid+"']",$taskList);
						if(P.mode == 'remove')	{
							$li.slideUp('fast',function(){
								$li.empty().remove();
								});
	//if the product is in the search results list, make sure the toggle button is not highlighted.
							$(_app.u.jqSelector('#','prodManager_'+P.pid)).find("[data-app-click='admin_prodedit|productTaskPidToggle']").removeClass('ui-state-highlight');
							}
						else if(P.mode == 'close')	{
							$("[data-app-role='productEditorContainer']",$li).slideUp('fast',function(){
								$(this).empty(); //empty this so that data is re-obtained when re-opened (allows for a fairly easy refresh process)
								});
							$("button[data-taskmode='close']",$li).hide();
							$("button[data-taskmode='edit']",$li).show();
							}
						else	{
							dump(" -> in 'add' or 'edit' mode");
							//to get here, we are in 'add' or 'edit' mode.
							if($li.length)	{}//product is already in list.
							else	{
								var $li = _app.renderFunctions.createTemplateInstance($taskList.data('loadstemplate'));
								$li.hide();
								$li.attr('data-pid',P.pid);
								_app.u.addEventDelegation($li);
								}
							$taskList.prepend($li); //always put at top of the list.
	
	//when simply adding to the list, we can use product data from localStorage/memory if it's available.
							if(P.mode == 'add')	{
								if(!handleAnimation())	{$li.show();}
								$("button[data-taskmode='close']",$li).hide();
								$("button[data-taskmode='edit']",$li).show();

								$li.showLoading({'message':'Fetching Product Detail'});
								_app.model.addDispatchToQ({
									'_cmd':'adminProductDetail',
									'inventory':1,
									'skus':1,
									'pid':P.pid,
									_tag : {
										'datapointer':'adminProductDetail|'+P.pid,
										'jqObj' : $li,
										'callback' : 'anycontent',
										'onMissing' : function(rd)	{
											_app.ext.admin_prodedit.u.addProductAsTask({'pid':P.pid,'tab':'product','mode':'remove'},$li);
											$('#globalMessaging').anymessage({'message' : 'Product '+P.pid+' was removed from the product task list because it no longer exists'});
											}
										}
									},'passive');
								_app.model.dispatchThis('passive');
								}
	//determine if the item is already in the list and, if so, just edit it.  If not, add and edit.
	//when opening the editor immediately, trigger the 'edit' button. no need to fetch the product data, the editor will do that.
							else if(P.mode == 'edit')	{
								$("[data-app-role='productManagerLandingContent']",'#productContent').hide(); //make sure default content is hidden once in editor.
								$("button[data-taskmode='close']",$li).show();
								$("button[data-taskmode='edit']",$li).hide();
								//if the li was in the list (already visible), just open the editor.
								//If it wasn't, animate the LI coming into the list. The animate will mask a bit of the loading time.
								if($li.is(':visible'))	{}
								else	{
									$li.slideDown();
									}
								_app.ext.admin_prodedit.a.showProductEditor($("[data-app-role='productEditorContainer']",$li).show(),P.pid,{'renderTaskContainer':true});
								}
							else	{
								//error. unrecognized mode.
								$('#globalMessaging').anymessage({"message":"In admin_prodedit.u.addProductAsTask, unrecognized mode ["+P.mode+"] passed.","gMessage":true});
								}
							}

						
						}
					else	{
						handleAnimation();
						}
					

					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.u.addProductAsTask, required param(s) missing.  P.pid ["+P.pid+"] and P.tab ["+P.tab+"] are required.","gMessage":true});
					}
				}, //addProductAsTask
//the tab content area gets continually nuked. so a 'list' is kept. Allows the product task list(s) to be persistent.
//P.pid && P.tab && P.mode
			manageProductTaskArr : function(P)	{
				var taskArr = _app.model.dpsGet('tab_pref_'+P.tab,'tasklistitems') || [], index = $.inArray(P.pid,taskArr);
				//only add the pid if it is not already in the list.
				if(P.mode == 'add' && index < 0)	{
					taskArr.push(P.pid);
					}
				//only remove the item if it is already in the list.
				else if(P.mode == 'remove' && index >= 0)	{
					taskArr.splice(index, 1);
					}
				else	{
					//there are modes that are supported, but do not update the array (close and edit, for instance.) They could get you here.
					// could also get here if mode is add and item is already in the list or mode is remove and item is not in the list.
					}
				_app.model.dpsSet('tab_pref_'+P.tab,'tasklistitems',taskArr);
				return taskArr;
				},
			
//$target is where the inventory detail report is going to show up.  must be a valid jquery object.
//vars can contain a mode. Right now, it's optional. may be necessary when it comes time to save.
			handleInventoryDetail : function($target,sku,vars)	{
				_app.u.dump("BEGIN admin_prodedit.u.handleInventoryDetail");
				vars = vars || {};
				if($target instanceof jQuery)	{
					_app.u.dump(" -> have a valid jquery target");
					if(sku)	{
//						_app.u.dump(" -> have a sku ["+sku+"]");
						var PID = sku.split(':')[0]; //the Product ID.
						var invData = {};
						//Verify the inventory record for this product is available.
						if(_app.data['adminProductInventoryDetail|'+PID])	{
//							_app.u.dump(" -> Inventory record is in memory."); // _app.u.dump(_app.data['adminProductInventoryDetail|'+PID]['%INVENTORY'][sku]);
							vars.sku = sku; //set on vars for dataAttribs.
							if(_app.data['adminProductInventoryDetail|'+PID]['%INVENTORY'])	{
								if(_app.data['adminProductInventoryDetail|'+PID]['%INVENTORY'][sku])	{
									invData = _app.data['adminProductInventoryDetail|'+PID]['%INVENTORY'][sku];
									}
								else	{
									//no inventory records present. This could be normal (new product, for instance)
									}
								$target.anycontent({
									'templateID' : 'inventoryDetailTemplate',
									'dataAttribs' : vars,
									'data' : {
										'header' : vars.header || "",
										'@DETAIL' : invData
										},
									'showLoading' : false
									});
								}
							else	{
								$target.anymessage({"message":"In admin_prodedit.u.handleInventory, _app.data['adminProductInventoryDetail|'+"+PID+"] is in memory, but %INVENTORY is not present and is required.","gMessage":true});
								}
							$('tbody:first',$target).sortable({
								'start' : function(event,ui)	{
									if(ui.item.attr('data-starting-index'))	{} //already been moved once.
									else{
										ui.item.attr('data-starting-index',ui.item.index())
										}
									},
								handle : ".ui-icon-grip-dotted-vertical",
								cancel: "[data-basetype='PICK'], [data-basetype='_ASM_'], [data-basetype='DONE']",
								'stop' : function(event,ui){
									ui.item.addClass('edited');
									//if an item from the top of the list was dragged down, everything below the original index gets an 'edited' class because their preference all changes.
									var changeFromIndex = ( ui.item.index() > ui.item.data('startingIndex')) ? ui.item.data('startingIndex') : ui.item.index();
//									_app.u.dump(" -> changeFromIndex: "+changeFromIndex);
									//each item after this one in the list of rows gets tagged as edited so it's preference can be adjusted.
									ui.item.closest('tbody').children().each(function(){
//										_app.u.dump(" -> $(this).index: "+$(this).index());
										var $tr = $(this);
										if($tr.data('basetype') == '_ASM_' || $tr.data('basetype') == 'PICK' || $tr.data('basetype') == 'DONE'){}
										else if($(this).index() >= changeFromIndex)	{
											$(this).addClass('edited');
											}
										else	{}
										});
									_app.ext.admin.u.handleSaveButtonByEditedClass(ui.item.closest('form')); //updates the save button change count.
									}
								}).find("tr[data-basetype='_ASM_'], tr[data-basetype='PICK'], tr[data-basetype='DONE']").each(function(){
									$('.ui-icon-grip-dotted-vertical',$(this)).hide();
									$(":input",$(this)).prop('disabled','disabled');
									$('button',$(this)).prop('disabled','disabled');
									});
//skip the inventory details button, as it has already been buttonified and running it again will set the wrong icon (which is changed by the click event)
							_app.u.handleButtons($target.not("[data-app-click='admin_prodedit|inventoryDetailsToggle']")); //if this moves before the basetype asm code, change the basetype code to button('disable') so the button changes.
//only 1 simple and 1 constant detail record are allowed. lock respective button if record already exists.
							if(!$.isEmptyObject(invData))	{
								if(_app.ext.admin.u.getValueByKeyFromArray(invData,'BASETYPE','SIMPLE'))	{
									$("button[data-detail-type='SIMPLE']",$target).attr({'title':'Only one simple inventory detail record is allowed per sku'}).button('disable');
									}
								if(_app.ext.admin.u.getValueByKeyFromArray(invData,'BASETYPE','CONSTANT')) {
									$("button[data-detail-type='CONSTANT']",$target).attr({'title':'Only one constant inventory detail record is allowed per sku'}).button('disable');
									}
								}

							if($('tbody:first',$target).find('tr:hidden').length)	{
								var $ul = $("button[data-app-click='admin_prodedit|invDetailFilterShow']",$target).show().next('ul');
								
								if($('tbody:first',$target).find("tr[data-basetype='_ASM_']").length)	{
									$ul.append("<li data-app-click='admin_prodedit|invDetailFilterExec' data-show-basetype='_ASM_'>show "+$('tbody:first',$target).find("tr[data-basetype='_ASM_']").length+" ASM record(s)</li>");
									}
								if($('tbody:first',$target).find("tr[data-basetype='DONE']").length)	{
									$ul.append("<li data-app-click='admin_prodedit|invDetailFilterExec' data-show-basetype='DONE'>show "+$('tbody:first',$target).find("tr[data-basetype='DONE']").length+" done record(s)</li>");
									}
								if($('tbody:first',$target).find("tr[data-basetype='PICK']").length)	{
									$ul.append("<li data-app-click='admin_prodedit|invDetailFilterExec' data-show-basetype='PICK'>show "+$('tbody:first',$target).find("tr[data-basetype='PICK']").length+" pick record(s)</li>");
									}
								$ul.width(220).menu();
								}

							}
						else	{
							$target.anymessage({"message":"In admin_prodedit.u.handleInventoryDetail, _app.data['adminProductInventoryDetail|"+PID+"'] not in memory.","gMessage":true});
							}
						}
					else	{
						$target.anymessage({"message":"In admin_prodedit.u.handleInventoryDetail, sku not passed.","gMessage":true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.u.handleInventoryDetail, $target is not a valid instance of jQuery.","gMessage":true});
					}
				},
			

			handleImageSave : function($prodImageUL,mode)	{
				var r; //what is returned. a string for sku (updates) and an object (attribs) for pid
				if(mode == 'sku' || mode == 'pid')	{
					
					if(mode == 'sku')	{r = "SET-SKU?SKU="+$prodImageUL.closest("[data-sku]").data('sku')}
					else	{r = {}}
					
					var imgIndex = 0, skuImgIndex = 1; //used for setting which prod_image attribute is set.
//loop through all the li's, even those not edited, so that imgIndex is accurate.
//can't use the li index() because there are hidden (removed) li's.
					$("li:visible",$prodImageUL).not('.dropzone').each(function(){
						imgIndex++; //incremented at the beginning so that after all the loops, we have an accurate count of how many images are present.
//						_app.u.dump(" -> imgIndex: "+imgIndex);
						if($(this).hasClass('edited'))	{
							var $img = $(this).find('img').first();
							if($img.length && $img.data('filename'))	{
								//image either an original OR added w/ media lib.
								if(mode == 'sku')	{
									r += "&zoovy:prod_image"+(skuImgIndex)+"="+$img.data('filename');
									skuImgIndex++;
									}
								else	{
									r['zoovy:prod_image'+(imgIndex)] = $img.data('filename');
									}
								}
							else if($img.length == 0)	{
								//if the media lib was opened, but closed w/out a selection being made, there could be a leftover 'blank'.
								}
							else	{
								//uh oh. something went wrong. Whether shuffled, added w/ media lib or using dropzone, data-filename should be set.
								// ### TODO -> what to do here?
								}
							}
						});

					//_app.u.dump(" -> finished w/ setting images. now handle emptying.");
					//if there are fewer images now than when the session began, delete values for the images that were removed/shifted.
					if(mode == 'sku') {} //all sku images are deleted at outset, so movement and remove have no impact at this point.
					else	{
						if(imgIndex < ($prodImageUL.children().not('.dropzone').length))	{
							var L = ($prodImageUL.children().not('.dropzone').length) - imgIndex;
						//	_app.u.dump(" -> L: "+L);
							for(var i = 0; i < L; i += 1)	{
								imgIndex++; //increment before to pick up after we left off.
	//							_app.u.dump(" -> imgIndex: "+imgIndex);
								r['zoovy:prod_image'+(imgIndex)] = "";
								}
							}
	//					_app.u.dump(" -> cmdObj for prodImages:"); _app.u.dump(cmdObj);
						}
//					_app.model.addDispatchToQ(cmdObj,'immutable');
					}
				else	{
					$prodImageUL.insertBefore($("<div \/>").anymessage({
						'message':'In admin_prodedit.u.handleImageSave, invalid mode ['+mode+'] passed. must be pid or sku.',
						'gMessage':true
						}));
					
					r = false;
					}
				return r;
				},
				
			//variations is the @variations object.
			//optionsObj is what selections for each variation have been made.
			buildSKU : function(pid,variations,optionsObj)	{
				var r = false; //what is returned. false if no sku can be built.
				if(pid)	{
					r = pid;
					if($.isEmptyObject(variations) && $.isEmptyObject(optionsObj))	{} //it's valid to have no variations. pid = sku in this case.
					else	{
						for(var i = 0; i < variations.length; i++)	{
							if(variations[i]['inv'] == 1)	{
								r += ':'+variations[i]['id']+optionsObj[variations[i]['id']];
								}
							}
						}
					}
				else	{
					r = false;
					}
//				dump(" -> buildSKU: "+r);
				return r;
				},
			
			getSKUDataset : function(sku,skus)	{
				var r = false;
				if(sku && !$.isEmptyObject(skus))	{
					dump(" -> sku: "+sku);
					for(var i = 0; i < skus.length; i++)	{
						dump(i+") "+skus[i]['sku']);
						if(skus[i]['sku'] == sku)	{
							r = skus[i];
							break; //exit once a match is found.
							}
						}
					}
				else	{
					//error display should be handled the code that calls this function. sometimes a 'false' may be exceptable.
					dump(" -> in admin_prodedit.u.getSKUDataset, either sku not set ["+sku+"] or skus was empty ["+(typeof skus)+"]");
					}
				return r;
				}
			}, //u

//kinda like a macrobuilder, but the params are different.
//no handler here should execute a dispatch.
//each dispatch should be added to the immutable Q.
		saveHandlers : {




//a simple save to handle attributes that are set w/ form inputs.
			attributes : function($form)	{
				var pid = $("input[name='pid']",$form).val();
				var cmdObj = {
					_cmd : 'adminProductUpdate',
					pid : pid,
					'%attribs' : $form.serializeJSON({'selector' : ':input.edited' , 'cb' : true}),
					_tag : {
						callback : 'showMessaging',
						restoreInputsFromTrackingState : true,
						'message' : 'Attributes have been saved.',
						jqObj : $form
						}
					}
//	_app.u.dump(" -> cmdObj for attributes:"); _app.u.dump(cmdObj); 
				if(!$.isEmptyObject(cmdObj['%attribs']))	{
					_app.model.addDispatchToQ(cmdObj,'immutable');
					}
				else	{
					$form.hideLoading();
					}
				}, //attributes


//INVENTORY?SKU=XXXXX&unlimited, which is a checkbox at the product level.
			schedule : function($form)	{
				var pid = $("input[name='pid']",$form).val();
				var cmdObj = {
					_cmd : 'adminProductMacro',
					pid : pid,
					'@updates' : new Array(),
					_tag : {
						callback : 'showMessaging',
						message : 'Schedule pricing updated.',
						restoreInputsFromTrackingState : true,
						removeFromDOMItemsTaggedForDelete : true,
						jqObj : $form
						}
					}

				if(_app.ext.admin_prodedit.u.thisPIDHasInventorableVariations(pid))	{
					$("[data-app-role='skuSchedulesContainer']",$form).find('input.edited').each(function(){
						cmdObj['@updates'].push("SET-SCHEDULE-PRICE?SKU="+$(this).closest("[data-sku]").attr('data-sku')+"&schedule="+$(this).closest("[data-schedule]").attr('data-schedule')+"&price="+$(this).val());
						});				
					}
				else	{
// loop through all the rows and check to see if any have been edited.
					$("[data-app-role='pidSchedulesContainer'] tbody",$form).children().each(function(){
						var $tr = $(this);
						if($('.edited',$tr).length)	{
							cmdObj['@updates'].push("SET-SCHEDULE-PROPERTIES?schedule="+$tr.data('schedule')+"&"+_app.u.hash2kvp($tr.serializeJSON()));
							}
						//if any input for the record has been updated, update qty and loc.
						else {
	
							}
						});

					}

//				_app.u.dump(" -> cmdObj for schedule:"); _app.u.dump(cmdObj);
				
				if(cmdObj['@updates'].length)	{
					_app.model.addDispatchToQ(cmdObj,'immutable');
					}
				else	{
					$form.hideLoading();
					}
				
				}, //schedule



//INVENTORY?SKU=XXXXX&unlimited, which is a checkbox at the product level.
			inventory : function($form)	{
				var pid = $("input[name='pid']",$form).val();
				var cmdObj = {
					_cmd : 'adminProductMacro',
					pid : pid,
					'@updates' : new Array(),
					_tag : {
						callback : 'showMessaging',
						message : 'Inventory records updated.',
						restoreInputsFromTrackingState : true,
						removeFromDOMItemsTaggedForDelete : true,
						jqObj : $form
						}
					}

// loop through all the inventory rows and check to see if any have been edited.
// this seemed a better approach than using .edited because loc, is/was all need to be set and this way we don't need to check if an update was already logged.
				$("[data-app-role='inventoryDetailContainer'] tbody",$form).children().each(function(){
//					_app.u.dump(" -> into the tr");
					var $tr = $(this);
					if($tr.hasClass('rowTaggedForRemove'))	{
						cmdObj['@updates'].push("INV-"+$tr.data('basetype')+"-UUID-NUKE?UUID="+$tr.data('uuid')+"&WAS="+$tr.data('qty'));
						}
//certain types get ignored.
					else if($tr.data('BASETYPE') == '_ASM_' || $tr.data('BASETYPE') == 'PICK')	{}
					//if any input for the record has been updated, update qty and loc.
					else {
						var $qty = $("input[name='QTY']", $tr);
						var $note = $("input[name='NOTE']",$tr);
						
						if($qty.hasClass('edited'))	{
							//The quantity input doesn't match what was set at time of load. update quantities.
							cmdObj['@updates'].push("INV-"+$tr.data('basetype')+"-UUID-SET?UUID="+$tr.data('uuid')+"&WAS="+$tr.data('qty')+"&QTY="+$qty.val());
							}

						if($note.hasClass('edited'))	{
							cmdObj['@updates'].push("INV-"+$tr.data('basetype')+"-UUID-ANNOTATE?UUID="+$tr.data('uuid')+"&NOTE="+$note.val());
							}

						if($tr.hasClass('edited'))	{
							cmdObj['@updates'].push("INV-"+$tr.data('basetype')+"-UUID-PREFERENCE?UUID="+$tr.data('uuid')+"&PREFERENCE="+(100 - $tr.index()));
							}
						}
					});

//				_app.u.dump(" -> cmdObj for inventory:"); _app.u.dump(cmdObj);
//				_app.u.dump(" -> cmdObj._tag: "); _app.u.dump(cmdObj._tag);
				
				if(cmdObj['@updates'].length)	{
					_app.model.addDispatchToQ(cmdObj,'immutable');
					}
				else	{
					$form.hideLoading();
					}
				
				}, //inventory

			navigation : function($form)	{
				if($('.edited',$form).length)	{
					var pid = $("input[name='pid']",$form).val();
					//create an object of safe id's w/ value of 1/0 based on checked/unchecked. ONLY builds cats that have changed.
					var navcats = _app.ext.admin_navcats.u.getPathsArrayFromTree($form);
	
					$form.showLoading({'message':'Updating Website Navigation for '+pid});
					
					var cmdObj = {
						'_cmd' : 'adminProductMacro',
						'pid' : pid,
						'@updates' : new Array(), //used for sku images
						'_tag' : {
							'callback' : 'showMessaging',
							restoreInputsFromTrackingState : true,
							'message' : "Your product navigation changes have been saved",
							jqObj : $form
							}
						}
					
					for(var index in navcats)	{
						cmdObj['@updates'].push("NAVCAT-"+(navcats[index] ? 'INSERT' : 'DELETE')+"?path="+index);
						}
//					_app.u.dump(" -> cmdObj for navigation:"); _app.u.dump(cmdObj);
					if(cmdObj['@updates'].length)	{
						_app.model.addDispatchToQ(cmdObj,'immutable');
						}
					else	{
						$form.hideLoading();
						}
					}
				else	{
					//no changes in navcats.
					$form.hideLoading();
					}
				}, //navigation

			skuImages : function($form)	{
				if($("[data-app-role='prodEditSkuImagesContainer'] .edited",$form).length)	{
					var pid = $("input[name='pid']",$form).val();
					var cmdObj = {
						'_cmd' : 'adminProductMacro',
						'pid' : pid,
						'@updates' : new Array(), //used for sku images
						'_tag' : {
							'callback' : 'showMessaging',
							restoreInputsFromTrackingState : true,
							'message' : "SKU image updates have saved",
							jqObj : $form
							}
						}
					$("[data-app-role='prodEditSkuImagesContainer'] tbody tr",$form).each(function(index){
						var $tr = $(this);
						_app.u.dump(" -> index: "+index+" and sku: "+$tr.data('sku'));
						if($('.edited',$tr).length)	{
							//clear all the sku images.
							cmdObj['@updates'].push("SET-SKU?SKU="+$tr.data('sku')+"&zoovy:prod_image1=&zoovy:prod_image2=&zoovy:prod_image3="); 
							cmdObj['@updates'].push(_app.ext.admin_prodedit.u.handleImageSave($('ul:first',$tr),'sku'))
							}
						else {} //no edits in this row.
						});
//					_app.u.dump(" -> cmdObj for skuImages:"); _app.u.dump(cmdObj);
					if(cmdObj['@updates'].length)	{
						_app.model.addDispatchToQ(cmdObj,'immutable');
						}
					else	{
						$form.hideLoading();
						}
					}
				else	{$form.hideLoading();} //no changes to sku imagery.

				},

			flex : function($form)	{

				var pid = $("input[name='pid']",$form).val();
				var cmdObj = {
					_cmd : 'adminProductUpdate',
					pid : pid,
					'%attribs' : {},
					'@updates' : [],
					_tag : {
						callback : 'showMessaging',
						restoreInputsFromTrackingState : true,
						'message' : 'Attributes have been saved.',
						jqObj : $form
						}
					}
				
				$("[data-app-role='flexeditContainer']:first .edited",$form).each(function(){
					var $input = $(this);
					if($input.closest('.handleAsSku').length)	{
						if($input.is(':checkbox'))	{
							cmdObj['@updates'].push("SET-SKU?SKU="+$input.closest('label').data().stid+"&"+$input.attr('name')+"="+($input.is(':checked') ? 1 : 0)); //;
							}
						else if($input.is(':input'))	{
							cmdObj['@updates'].push("SET-SKU?SKU="+$input.closest('label').data().stid+"&"+$input.attr('name')+"="+$input.val()); //;
							}
						else	{
							//in the case of images, a 'label' and an input get '.edited' assigned. The input is used in the update.
							}
						}
					else	{
						if($input.is(':checkbox'))	{
							cmdObj['%attribs'][$input.attr('name')] = ($input.is(':checked') ? 1 : 0); //;
							}
						else if($input.is(':input'))	{
							cmdObj['%attribs'][$input.attr('name')] = $input.val();
							}
						else	{
							//in the case of images, a 'label' and an input get '.edited' assigned. The input is used in the update.
							}

						}
					});

				if(cmdObj['@updates'].length || !$.isEmptyObject(cmdObj['%attribs']))	{
					_app.model.addDispatchToQ(cmdObj,'immutable');
					}
				else	{
					$form.hideLoading();
					}

				},

			prodImages : function($form)	{

				var $prodImageUL = $("[data-app-role='prodImagesContainer']",$form);
				if($('.edited',$prodImageUL).length)	{
	
					var pid = $("input[name='pid']",$form).val();
					var cmdObj = {
						'_cmd' : 'adminProductUpdate',
						'pid' : pid,
						'%attribs' : _app.ext.admin_prodedit.u.handleImageSave($prodImageUL,'pid'), //used for prod images
						'_tag' : {
							'callback' : 'showMessaging',
							restoreInputsFromTrackingState : true,
							"message" : "Product image updates have saved",
							jqObj : $form
							}
						}
					if(!$.isEmptyObject(cmdObj['%attribs']))	{
						_app.model.addDispatchToQ(cmdObj,'immutable');
						}
					else	{
						$form.hideLoading();
						}

					}
				else	{$form.hideLoading();} //no changes to the images. that's fine.

				}, //prodImages
			
			variations : function($form)	{
				//data-app-role='productVariationManager'
				if($('.edited',$form).length)	{
					var cmdObj = {
						'_cmd' : 'adminProductOptionsUpdate', 
						pid : $form.closest("[data-pid]").data('pid'),
						'_tag' : {
							'callback' : function(rd){
								$form.hideLoading();
								if(_app.model.responseHasErrors(rd)){
									$form.anymessage({'message':rd});
									}
								else	{
									$form.anymessage(_app.u.successMsgObject('Variations have been updated.'));
									_app.ext.admin_prodedit.a.showProductVariationManager($("[data-app-role='productVariations']",$form).empty(),cmdObj.pid);
									$form.closest('.anyformEnabled').anyform('updateChangeCounts'); //execute AFTER showPordVarMan above or the counts will be off (cuz old variation data still on DOM).
									}
								}
							},
						'@pogs' : new Array()
						};
						
					var variations = _app.data['adminProductDetail|'+cmdObj.pid]['@variations']; //shortcut.
					for(index in variations)	{
						variations[index].autoid = 1; //tells the API to add id's to variations and/or options that don't have them.
						}

					$form.find("[data-app-role='productVariationManagerProductTbody'] tr").each(function(){
						var $tr = $(this);
						if($tr.hasClass('rowTaggedForRemove'))	{} //row tagged for delete. do nothing.
						else	{
							
//Get the variation object out of the product object in memory.
//At this point, all the data has been shoved into %variations on the product. The only trick here is using a guid, if set (for new pogs which have no ID yet)
							
							cmdObj['@pogs'].push(variations[($tr.data('guid')) ? _app.ext.admin.u.getIndexInArrayByObjValue(variations,'guid',$tr.data('guid')) : _app.ext.admin.u.getIndexInArrayByObjValue(variations,'id',$tr.data('id'))]);
							
//							cmdObj['%sog'].push();
							}
						});
					
					_app.model.addDispatchToQ(cmdObj,'immutable');
//					_app.model.dispatchThis('immutable');
					}
				else	{$form.hideLoading();}
				},
			
// ### TODO ### -> when this is done, see if pricetag and skus can be merged.			
			pricetags : function($form)	{
				var pid = $("input[name='pid']",$form).val();
				var cmdObj = {
					_cmd : 'adminProductMacro',
					pid : pid,
					'@updates' : new Array(),
					_tag : {
						callback : 'showMessaging',
						"message" : "Pricetags have been udpated.",
						restoreInputsFromTrackingState : true,
						jqObj : $form
						}
					}

//the :input pseudo selector will match all form field types.
var $tbody = $("[data-app-role='prodEditSkuAttribsTbody']",$form);
//high level check to see if any updates occured within sku attribs.
if($('.edited',$tbody).length)	{
	
	$('.edited',$tbody).each(function(){
		var $input = $(this);
		var SKU = $input.closest("[data-sku]").data('sku');
		cmdObj['@updates'].push("SET-SKU-PRICETAG?SKU="+SKU+"&tag="+$input.attr('name')+'&price='+$input.val());		
		});
	}
else	{} //no changes in pricetags.

//_app.u.dump(" -> cmdObj for sku:"); _app.u.dump(cmdObj);
				//The save button that exectutes this also runs skuImages. So it's possible this was run without any sku attribs changes 
				//to avoid an API error (no @updates set), only add to Q if updates are present.
				if(cmdObj['@updates'].length)	{
					_app.model.addDispatchToQ(cmdObj,'immutable');
					}
				else{$form.hideLoading();}
				
				},
			
// executed from the save button in the variations panel. called sku because it doesn't impact add/removing variations, just updating attribs for each option.
			sku : function($form)	{
				var pid = $("input[name='pid']",$form).val();
				var cmdObj = {
					_cmd : 'adminProductMacro',
					pid : pid,
					'@updates' : new Array(),
					_tag : {
						callback : 'showMessaging',
						"message" : "SKU attribute changes have saved.",
						restoreInputsFromTrackingState : true,
						jqObj : $form
						}
					}

//the :input pseudo selector will match all form field types.
var $tbody = $("[data-app-role='prodEditSkuAttribsTbody']",$form);
//high level check to see if any updates occured within sku attribs.
if($('.edited',$tbody).length)	{
	$tbody.children().each(function(){
		var $tr = $(this);
		var SKU = $(this).closest("[data-sku]").data('sku');
		if($('.edited',$tr).length)	{
			//$.param sends the keys encoded, which is OK.
			cmdObj['@updates'].push("SET-SKU?SKU="+SKU+"&"+$('.edited',$tr).serialize());
			}
		else	{} //no updates in this row.
		});
	}
else	{} //no changes in sku attribs.

//_app.u.dump(" -> cmdObj for sku:"); _app.u.dump(cmdObj);
				//The save button that exectutes this also runs skuImages. So it's possible this was run without any sku attribs changes 
				//to avoid an API error (no @updates set), only add to Q if updates are present.
				if(cmdObj['@updates'].length)	{
					_app.model.addDispatchToQ(cmdObj,'immutable');
					}
				else{$form.hideLoading();}
				}, //prodImages
				
			buycom : function($form)	{
				var pid = $("input[name='pid']",$form).val();
				var cmdObj = {
					_cmd : 'adminProductUpdate',
					pid : pid,
					'%attribs' : $("[data-app-role='buyAttributes']",$form).serializeJSON({'selector' : ':input.edited' , 'cb' : true}),
					'@updates' : new Array(),
					_tag : {
						callback : 'showMessaging',
						message : 'Saved changes to buy.com panel',
						restoreInputsFromTrackingState : true,
						jqObj : $form
						}
					}

//the :input pseudo selector will match all form field types.
				var $editedInputs = $("[data-app-role='buySkus'] :input.edited",$form);
				if($editedInputs.length)	{
					$editedInputs.each(function(){
						cmdObj['@updates'].push("SET-SKU?SKU="+$(this).closest('tr').data('sku')+"&"+$(this).attr('name')+"="+this.value);
						})
//					_app.u.dump(" -> cmdObj for buycom:"); _app.u.dump(cmdObj);
					_app.model.addDispatchToQ(cmdObj,'immutable');
					}
				else	{$form.hideLoading();}

				} //buycom

			}, //saveProductByTab





//e is for 'events'. This are used in event delegation
		e : {

// * 201334 -> new product editor.
			productFiltersShow : function($ele,p)	{
				var $filterMenu = $ele.closest("[data-app-role='productEditorNavtab']").find("[data-app-role='productManagerFilters']");
				$filterMenu.slideDown();
				},

			productFiltersExec : function($ele,p)	{
				_app.u.dump("BEGIN admin_prodedit.e.productFiltersExec (click!)");

				var $container = $(_app.u.jqSelector('#',_app.ext.admin.vars.tab+'Content')).find("[data-app-role='productManager']");
				_app.ext.admin_prodedit.u.prepContentArea4Results($container);
				$("[data-app-role='productManagerSearchResults']",$container).showLoading({'message':'Performing search...'});
				$ele.parent().find("[data-app-click='admin_prodedit|productFiltersClose']").trigger('click');
//				_app.u.dump("name='size'.length: "+$("select[name='size']",'#navTabs').length+" and val: "+$("select[name='size']",'#navTabs').val());

				var keywords = $("[name='KEYWORDS']","#navTabs").val();
				var query = {
					'type' : 'product',
					"mode" : "elastic-search",
					"size" : $("select[name='size']",'#navTabs').val() || 25,
					"filter" : _app.ext.admin_prodedit.u.buildElasticFilters($ele.closest('form'))
					}//query
				if(keywords)	{
					query.query =  {"query_string" : {'query':keywords}};
					}
//				_app.u.dump(" -> query:"); _app.u.dump(query);

				_app.ext.store_search.calls.appPublicProductSearch.init(query,{
					'callback':'handlePMSearchResults',
					'extension':'admin_prodedit',
					'datapointer' : 'productManagerFilterSearch',
					'templateID':'prodManagerProductResultsTemplate',
					'list':$("[data-app-role='productManagerSearchResults']",$container)
					},'mutable');
				_app.model.dispatchThis('mutable');
				
//				_app.u.dump(" -> query: "); _app.u.dump(query);

				},

			productFiltersClose : function($ele,p)	{
				$ele.closest("[data-app-role='productManagerFilters']").slideUp();
				},

			productFiltersClear : function($ele,p)	{
				var $filterMenu = $ele.closest("[data-app-role='productManagerFilters']");
				$(".ui-selected",$filterMenu).removeClass('ui-selected ui-selectee');
				$('.sliderRange',$filterMenu).each(function(){
					var $slider = $(this);
					$slider.slider("values", 0, $slider.slider('option','min'));
					$slider.slider("values", 1, $slider.slider('option','max'));
					});
				},

			productCreateExec : function($ele,p)	{
				_app.ext.admin_prodedit.u.handleCreateNewProduct($ele.closest('form'));
				},

//executed from within the queue/task list when edit, remove or close is pushed.
			productEditorShow : function($ele,p)	{
//				_app.u.dump("BEGIN admin_prodedit.e.productEditorShow. (click!)");
				if($ele.data('pid') && $ele.data('taskmode'))	{
					var mode = $ele.data('taskmode');
					$ele.closest("[data-app-role='productManagerResultsContent']").hide();
					_app.ext.admin_prodedit.u.addProductAsTask({'pid':$ele.data('pid'),'tab':'product','mode':mode},$ele.closest('li'));
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.e.showProductEditor, either data-pid ["+$ele.data('pid')+"] or data-taskmode ["+$ele.data('taskmode')+"] not set on element.","gMessage":true});
					}
				},


			amazonLogShow : function($ele,p)	{
				var
					pid = $ele.closest('[data-app-role="taskItemContainer"]').data('pid'), //can't use closest because the tr will have it for the wrong pid. need the pid of the product being edited.
					index = $ele.closest("[data-obj_index]").attr('data-obj_index'),
					errors = 0; //the number of 'error' messages in @LOG


				if(pid && index && _app.u.thisNestedExists("data.adminProductAmazonDetail|"+pid+".@DETAIL."+index+".@LOG",_app))	{
					var 
						logArr = _app.data["adminProductAmazonDetail|"+pid]['@DETAIL'][index]['@LOG'],
						L = logArr.length,
						$D = _app.ext.admin.i.dialogCreate({
							'title':'Amazon Log for '+$ele.closest("[data-sku]").data('sku')
							}); //using dialogCreate ensures that the div is 'removed' on close, clearing all previously set data().
					$D.addClass('amazonLog');
					$D.dialog('option','height',500);

function type2class(type)	{
	if(type == 'ERROR')	{return 'red'}
	else if(type == 'STOP') {return 'orange'}
	else	{return ""}
	}

					for(var i = 0; i < L; i += 1)	{
						if(logArr[i].type == 'ERROR') {errors++}
						var $P = $("<p \/>").addClass('marginTop marginBottom');
						if(logArr[i].detail)	{$P.addClass('isDetail displayNone')}
						$P.append("<span class='floatLeft marginRight marginBottom app-icon app-icon-"+logArr[i].type.toLowerCase()+"'><\/span>");
						$P.append($("<h5>"+logArr[i].type+"<\/h5>").addClass(type2class(logArr[i].type)));
						$P.append("<h6>Feed: "+logArr[i].feed+"<\/h6>");
						$P.append("<h6>"+_app.u.epoch2Pretty(logArr[i].ts,true)+"<\/h6>");
						$P.append(logArr[i].msg);
						$P.appendTo($D);
						}
					if(errors)	{$D.prepend("<h5>There are "+errors+" for this sku")}
					$D.prepend($("<label>").text("Show more detail").prepend($("<input \/>").prop('type','checkbox').on('click',function(){
						if($(this).is(':checked'))	{
							$('.isDetail',$(this).closest('.ui-dialog-content')).show();
							}
						else	{
							$('.isDetail',$(this).closest('.ui-dialog-content')).hide();
							}
						})));
					$D.dialog('open');
					}
				else	{
					$ele.closest('fieldset').anymessage({"message":"In admin_prodedit.e.amazonLogShow, unable to ascertain pid ["+pid+"] or index ["+index+"] or _app.data['adminProductAmazonDetail|"+pid+"']['@DETAIL']["+index+"] doesn't exist.","gMessage":true});
					}
				
				},

//executed from within the search results.
//if it's already in the list, it's removed. If it is not in the list, it's added.
// the utility will need to support whether or not to immediately translate. 
// -> because if we go straight into edit, we are always going to get a clean copy of the product record and should use that to translate.
			productTaskPidToggle : function($ele,p) {
				dump("BEGIN prodedit.e.productTaskPidToggle (click!)");
//pid may be set on the button (product interface) or on the parent row (supplier, orders, etc)
				var pid = $ele.data('pid') || $ele.closest("[data-pid]").data('pid');
				if(pid)	{
					if($ele.hasClass('ui-state-highlight'))	{
						$ele.removeClass('ui-state-highlight');
						_app.ext.admin_prodedit.u.addProductAsTask({'pid':pid,'tab':'product','mode':'remove'},$ele.closest('tr'));
						}
					else	{
						$ele.addClass('ui-state-highlight');
						_app.ext.admin_prodedit.u.addProductAsTask({'pid':pid,'tab':'product','mode':'add'},$ele.closest('tr'));
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.e.productTaskPidToggle, no data-pid set on element.","gMessage":true});
					}
				},

			handleCompetitionTabContent : function($ele,p)	{
				var
					$PE = $ele.closest("[data-app-role='productEditorContainer']"),
					pid = $PE.data('pid');
				
//Check to see if inventory-able variations are present.  If so, a different price schedule table should be displayed.
					if(_app.ext.admin_prodedit.u.thisPIDHasInventorableVariations(pid))	{
//item has inventory-able variations
						}
					else	{
//item does not have inventory-able variations.
						}				
				
				},


			handleAttributesTabContent : function($ele,p)	{
				var
					$PE = $ele.closest("[data-app-role='productEditorContainer']"),
					pid = $PE.data('pid'),
					$flexContent = $("[data-app-role='flexeditContainer']",$PE);

//Check to see if inventory-able variations are present.  If so, a different price schedule table should be displayed.
					if(_app.ext.admin_prodedit.u.thisPIDHasInventorableVariations(pid))	{
						var $scheduleContainer = $("[data-app-role='skuSchedulesContainer']",$PE).show();
//build the table headers for the schedules.
						if(_app.data['adminProductDetail|'+pid]['@skus'][0] && _app.data['adminProductDetail|'+pid]['@skus'][0]['@schedule_prices'] && _app.data['adminProductDetail|'+pid]['@skus'][0]['@schedule_prices'].length)	{
							//make sure to only add the headers once.
							if($scheduleContainer.data('headersAdded'))	{}
							else	{
								var o = '';
								for(var i = 0, L = _app.data['adminProductDetail|'+pid]['@skus'][0]['@schedule_prices'].length; i < L; i += 1)	{
									o += "<th>"+_app.data['adminProductDetail|'+pid]['@skus'][0]['@schedule_prices'][i].schedule+"</th>";
									}
								$scheduleContainer.data('headersAdded',true).find('thead tr').append(o);
								}
							}
						}
					else	{
						$("[data-app-role='pidSchedulesContainer']",$PE).show();
						// remove skuSchedulesContainer so it doesn't trigger validation
						$("[data-app-role='skuSchedulesContainer']",$PE).remove();
						}


//				_app.u.dump(" -> $flexContent.length: "+$flexContent.length);
//				_app.u.dump(" -> $PE.length: "+$PE.length);
//				_app.u.dump(" -> pid: "+pid);

				if($flexContent.children().length)	{
					_app.u.dump(" -> attributes tab clicked. flexcontent not retrieved because content was already loaded.");
					} //flex content already generated.
				else	{
					$flexContent.showLoading({'message':'Loading attribute data...'})
					//The list of which fields are enabled for this merchant is already retrieved as part of edit product.
					_app.ext.admin.calls.appResource.init('product_attribs_all.json',{
						callback : function(rd)	{
							if(_app.model.responseHasErrors(rd)){
								$('#globalMessaging').anymessage({'message':rd});
								}
							else	{
								$flexContent.hideLoading().addClass('labelsAsBreaks alignedLabels').prepend(_app.ext.admin_prodedit.u.flexJSON2JqObj(_app.data['adminConfigDetail|flexedit']['%flexedit'],_app.data['adminProductDetail|'+pid]));
								$flexContent.find('form').append("<input type='hidden' name='pid' value='"+pid+"' />");
								}
							}
						},'mutable');
					_app.model.dispatchThis('mutable');
	
					}
				},


			handleInventoryTabContent : function($ele,p)	{
				var
					$PE = $ele.closest("[data-app-role='productEditorContainer']"),
					pid = $PE.data('pid'),
					$invContainer = $("[data-app-role='inventoryContainer']",$PE);

				if(pid && $invContainer.length)	{
					$invContainer.showLoading({"message":"Fetching inventory record for product "+pid});
					_app.model.addDispatchToQ({
						"_cmd":"adminProductInventoryDetail",
						"pid":pid,
						"_tag": {
							"datapointer" : "adminProductInventoryDetail|"+pid,
							"callback" : function(rd){
								$invContainer.hideLoading();
 //clear any existing inventory records or clicking back into the tab will append and duplicates will show up.
								$invContainer.empty()
								if(_app.model.responseHasErrors(rd)){
									$invContainer.anymessage({'message':rd});
									}
								else	{

//if an item has no inventory-able options, go straight to showing the detail.
									if(_app.data['adminProductDetail|'+pid]['@skus'].length == 1 && _app.data['adminProductDetail|'+pid]['@skus'][0].sku.indexOf(":") < 0)	{
										// SANITY -> PID mode.
//all the magic happens in the handleInventoryDetail function. It'll be run on the pid and per sku in sku mode.
										_app.ext.admin_prodedit.u.handleInventoryDetail($invContainer,_app.data['adminProductDetail|'+pid]['@skus'][0].sku,{'mode':'pid'});
										}
//if inventory-able options are present, a list of sku's is shown and the detail is available on click.
									else	{
										// SANITY -> SKU mode.
										$invContainer.append(_app.renderFunctions.createTemplateInstance('inventorySKUDetailTemplate'));

										var $tbody = $("[data-app-role='inventoryTbody']",$invContainer);
										var skus = _app.data['adminProductDetail|'+pid]['@skus'];
//										_app.u.dump(" -> skus: "); _app.u.dump(skus);
										var L = skus.length;
										_app.u.dump(" -> skus.length: "+skus.length);
										for(var i = 0; i < L; i += 1)	{
											var thisSku = skus[i].sku;
//											_app.u.dump(" -> thisSku: "+thisSku);
											$tbody.anycontent({
												"templateID":"inventoryRowTemplate",
												dataAttribs : {'sku' : thisSku}, //will apply these as data- to each row.
												data : $.extend(true,skus[i],{'%INVENTORY':(_app.data[rd.datapointer]['%INVENTORY'][thisSku] || {} )})
												})
											}
										//add the SKU to each button in each row.
										$tbody.children().each(function(){
											$('button',$(this)).attr('data-sku',$(this).data('sku'));
											});
										_app.u.handleButtons($tbody);
										}

									}
								}
							}
						},"mutable");
					_app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.e.handleAttributesTabContent, either pid ["+pid+"] not set or $content ["+$content.length+"] has no length.","gMessage":true});
					}
				},

			handleEbayTabContent : function($ele,p)	{
				
				var
					$PE = $ele.closest("[data-app-role='productEditorContainer']"),
					pid = $PE.data('pid');

					if(_app.model.fetchData('adminEBAYProfileList'))	{}
					else	{
						_app.model.addDispatchToQ({'_cmd':'adminEBAYProfileList','_tag': {'datapointer':'adminEBAYProfileList'}},'mutable');
						}

					_app.model.addDispatchToQ({
						'_cmd':'adminEBAYStoreCategoryList',
						'_tag':	{
							'datapointer' : 'adminEBAYStoreCategoryList',
							'callback' : function(rd){
								if(_app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									//success content goes here.
								//	_app.u.dump(" -> pid: "+pid+"\nebay:storecat: "+_app.data['adminProductDetail|'+pid]['%attribs']['ebay:storecat']);
								//	_app.u.dump(" -> select.length: "+$("[data-app-role='ebayStoreCategoryContainer']",$PE).anycontent(rd).find("input[name='ebay:storecat']").length);
									$("[data-app-role='ebayStoreCategoryContainer']",$PE)
										.anycontent(rd)
										.find("select[name='ebay:storecat']").val(_app.data['adminProductDetail|'+pid]['%attribs']['ebay:storecat'])
										.end()
										.find("select[name='ebay:storecat2']").val(_app.data['adminProductDetail|'+pid]['%attribs']['ebay:storecat2']);
									}
								}
							}
						},'mutable');
//product specific marketplace details.
					$("[data-app-role='ebayStatusTbody']",$PE).empty() //clear any rows. important if you've moved away and back to tab.
					_app.model.addDispatchToQ({
						'_cmd':'adminProductEBAYDetail',
						'pid' : pid,
						'_tag':	{
							'datapointer':'adminProductEBAYDetail|'+pid,
							'callback' : 'anycontent',
							'jqObj' : $("[data-app-role='ebayStatusDetails']",$PE)
							}
						},'mutable');
					_app.model.dispatchThis('mutable');
				
				}, //handleEbayTabContent
			
			handleAmazonTabContent : function($ele,p)	{
				var
					$PE = $ele.closest("[data-app-role='productEditorContainer']"),
					pid = $PE.data('pid'),
					$fieldset = $("[data-app-role='amazonAttributes']",$PE),
					$mktStatusTbody = $("[data-app-role='amazonDetailTbody']",$PE).empty(); //refresh content each time tab is loaded.

					_app.model.addDispatchToQ({
						'_cmd':'adminProductAmazonDetail',
						'pid' : pid,
						'_tag':	{
							'datapointer':'adminProductAmazonDetail|'+pid,
							callback : function(rd)	{
								if(_app.model.responseHasErrors(rd)){
									$fieldset.anymessage({'message':rd});
									}
								else	{
									//success content goes here.
									var $thes = $("[name='amz:thesaurus']",$fieldset);
									if($thes.children().length > 1)	{} //already added these.
									else	{
										var selectedThes = _app.data['adminProductDetail|'+pid]['%attribs']['amz:thesaurus'] || "";
								
								//	_app.u.dump(" -> $fieldset.length: "+$fieldset.length);
								//	_app.u.dump(" -> $thesaurus select length: "+$thes.length);
								//	_app.u.dump(" -> selectedThes: "+selectedThes);
								
									
										//build the thesaurii dropdown.
										for(var index in _app.data[rd.datapointer]['%thesaurus'])	{
									//		_app.u.dump(" -> index: "+index);
											$thes.append("<option value='"+_app.data[rd.datapointer]['%thesaurus'][index]+"'>"+_app.data[rd.datapointer]['%thesaurus'][index]+"<\/option>");
											}
										if(selectedThes && $("[value='"+selectedThes+"']",$thes).length)	{
											//match found! set is as selected.
											$thes.val(selectedThes)
											}
										else if(selectedThes)	{
											$thes.insertAfter("Thesaurus "+selectedThes+" is no longer available");
											}
										else	{} //no thesaurus has been selected 
										}
								
									//interpret the marketplace status table.
									$mktStatusTbody.anycontent({'datapointer':rd.datapointer});
									_app.u.handleButtons($mktStatusTbody);
									//the table list will show the product in focus and some related items/accessories. the button for 'add to task list' for the product in focus needs to be disabled because by this point, the user is already IN the task list for the product in focus.
									$("tr[data-pid='"+pid+"']",$mktStatusTbody).find("button[data-app-role='productTaskListButton']").button('disable').attr('title','Task list for this item is already open.');
									
									//look through the market status table and if there's a row for the product in focus, disable the task list button () as it's redundant.
									
									
									}
								}
							}
						},'mutable');
					_app.model.dispatchThis('mutable');

				},

//executed when the categorization tab is clicked.
			handleCategorizationTabContent : function($ele,p)	{
				var $PE = $ele.closest("[data-app-role='productEditorContainer']");
				var $catsContent = $("section[data-anytab-content='categorization']:first",$PE).find("[data-app-role='categoryListContainer']");
				var pid = $PE.data('pid');
				if($catsContent.children().length)	{} //cats are already loaded.
				else	{
//get data for navigation panel.
					$catsContent.showLoading({'message':'Fetching categories for product...'});
					_app.model.addDispatchToQ({
						'_cmd':'adminProductNavcatList',
						'pid':pid,
						'_tag':	{
							'datapointer' : 'adminProductNavcatList|'+pid,
							'pid':pid,
							'callback' : function(rd)	{
								$catsContent.hideLoading();
								if(_app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									$catsContent.append(_app.ext.admin_navcats.u.getTree('chooser',{'templateID':'catTreeItemTemplate','path':'.','paths':_app.data[rd.datapointer]['@PATHS']}));
									}
								}
							}
						},'mutable');
					_app.model.dispatchThis('mutable');
					}
				},

			handleVariationsTabContent : function($ele,p)	{
//				_app.u.dump("BEGIN admin_prodedit.e.handleVariationsContent");
				var $PE = $ele.closest("[data-app-role='productEditorContainer']");
				var $variationsContent = $("section[data-anytab-content='variations']:first",$PE).find("[data-app-role='productVariations']");
				
				_app.ext.admin_prodedit.u.handleImagesInterface($("section[data-anytab-content='variations']:first",$PE),$PE.data('pid'));
				
				if($variationsContent.children().length)	{} //already rendered content.
				else	{
//					_app.u.dump(" -> $PE.length: "+$PE.length);
					_app.ext.admin_prodedit.a.showProductVariationManager($variationsContent,$PE.data('pid'));
					}
				},

			
			adminProductMacroNavcatClearallExec : function($ele,p)	{
				var
					$PE = $ele.closest("[data-app-role='productEditorContainer']"),
					pid = $PE.data('pid');
				
				_app.model.addDispatchToQ({
					'_cmd':'adminProductMacro',
					'pid' : pid,
					'@updates' : ["NAVCAT-CLEARALL"],
					'_tag':	{
						'callback': function(rd){
							if(_app.model.responseHasErrors(rd)){
								$ele.closest('form').anymessage({'message':rd});
								}
							else	{
								$ele.closest('form').anymessage(_app.u.successMsgObject("Removed product "+pid+" from all categories"));
								//uncheck all the checkboxes to reflect the change.
								$(":checkbox",$ele.closest('form')).prop('checked','');
								}
							}
						}
					},'immutable');
				_app.model.addDispatchToQ({
					'_cmd':'adminProductDetail',
					'variations':1,
					'inventory' : 1,
					'skus':1,
					'pid' : pid,
					'_tag':{
						'datapointer':'adminProductDetail|'+pid,
						'pid' : pid
						}
					},'immutable'); //update the product record.
				_app.model.dispatchThis('immutable');
				
				},
			
			inventoryDetailsToggle : function($ele,p)	{
				var
					$target = $ele.closest('tr').find('td:last-child'), //drop contents into the last column of the row. event is triggered from sku link and button (in different columns)
					$btn = $("button[data-app-click='admin_prodedit|inventoryDetailsToggle']:first",$target),
					icons = $btn.button( "option", "icons" );
				
				if($ele.data('sku'))	{
					//details are visible. close them and nuke the table.
					if(icons.primary == 'ui-icon-circle-triangle-n')	{
						icons.primary = 'ui-icon-circle-triangle-s';
						$btn.button( "option", "icons", icons );
						$("[data-app-role='inventoryDetailContainer']",$target).hide();
						}
					else	{
						icons.primary = 'ui-icon-circle-triangle-n';
						$btn.button( "option", "icons", icons );
						if($("[data-app-role='inventoryDetailContainer']",$target).length)	{
							$("[data-app-role='inventoryDetailContainer']",$target).show();
							}
						else	{
							_app.ext.admin_prodedit.u.handleInventoryDetail($target,$ele.data('sku'),{'mode':'sku'});
							}
						}
					}
				else	{
					$target.anymessage({"message":"In admin_prodedit.e.inventoryDetailsShow, data('sku') not set on trigger element.","gMessage":true});
					}
				},

			invDetailFilterExec : function($ele,p)	{
				if($ele.attr('data-show-basetype'))	{
					$ele.closest('table').find("tr[data-basetype='"+$ele.attr('data-show-basetype')+"']").toggle();
					}
				else	{
					$ele.closest('td').anymessage({'message':'In admin_prodedit.e.invDetailFilterExec, trigger element had no data-show-basetype.','gMessage':true});
					}
				},

			invDetailFilterShow : function($ele,p)	{
				var $menu = $ele.next('ul')
				$menu.show().css('position','absolute').position({
					my: "left top",
					at: "left bottom",
					of: $ele
					});
//the click to open the menu seems to trigger the 'one' as well. not sure how/why, but adding after a short timeout cure's it.
//could be that the click event doesn't return a false?
				setTimeout(function(){
					$(document).one( "click", function() {
						$menu.hide();
						});
					},1000);
				},

//executed on the 'validate' button. Gives a report of whether or not this product needs anything to be successfully syndicated.
			adminProductAmazonValidateExec : function($ele,p)	{
				var
					$PE = $ele.closest("[data-app-role='productEditorContainer']"),
					pid = $PE.data('pid');

				var $D = _app.ext.admin.i.dialogCreate({
					'title':'Amazon Validation for '+pid
					}); //using dialogCreate ensures that the div is 'removed' on close, clearing all previously set data().
				$D.dialog('option','modal',false);
				$D.dialog('option','height',($('body').height() > 450 ? 400 : ($('body').height() - 50)));
				$D.dialog('option','width',($('body').width() > 450 ? 400 : ($('body').height() - 50)));
				$D.dialog('open');

				_app.model.addDispatchToQ({
					'_cmd':'adminProductAmazonValidate',
					'pid' : pid,
					'_tag':	{
						'datapointer' : 'adminProductAmazonValidate|'+pid,
						'callback':function(rd)	{
							if(_app.model.responseHasErrors(rd)){
								$D.anymessage({'message':rd,'persistent':true}); //if api repsonse gets treated as an error/warning, keep that open.
								}
							else	{
								$D.anymessage({'message':_app.data[rd.datapointer],'persistent':true}); //will be @MSGS array.
								
								}
							}
						}
					},'mutable');
				_app.model.dispatchThis('mutable');
				
				}, //adminProductAmazonValidateExec

			amazonProductDefinitionsShow : function($ele,p)	{
				var $catalog = $ele.closest('form').find("select[name='amz:catalog']"); //Amazon Product Type
				var pid = $ele.closest('form').find("input[name='pid']").val();
				if($catalog.length && $catalog.val())	{
					var $D = _app.ext.admin.i.dialogCreate({
						'title':'Amazon Specifics'
						}); //using dialogCreate ensures that the div is 'removed' on close, clearing all previously set data().
					$D.dialog('open');
					$D.showLoading({"message":"Fetching definitions file"});
					_app.model.destroy("appResource|definitions/amz/"+$catalog.val()+'.json');
					
					_app.ext.admin.calls.appResource.init('product_attribs_all.json',{},'mutable');

					_app.ext.admin.calls.appResource.init('definitions/amz/'+$catalog.val()+'.json',{
						'callback' : 'flex2HTMLEditor',
						'templateID' : 'productEditorFlexTemplate',
						'extension' : 'admin_prodedit',
						'pid':pid,
						jqObj : $D
						},'mutable');
					_app.model.dispatchThis('mutable');
					//flexJSON2JqObj
					}
				else if($catalog.length)	{
					//choose a catalog first.
					 $ele.closest('form').anymessage({'message':'Please choose a catalog first.'})
					}
				else	{
					//unable to find catalog
					}
				}, //amazonProductDefinitionsShow

			adminProductMacroExec : function($ele,p)	{
//				_app.u.dump("BEGIN admin_prodedit.e.adminProductMacroExec (Click!)");
				var
					$PE = $ele.closest("[data-app-role='productEditorContainer']"),
					pid = $PE.data('pid');
//				_app.u.dump(" -> $ele.data('macro-cmd'): "+$ele.data('macro-cmd'));
				if($ele.data('macro-cmd') && pid)	{

					if($ele.is('button'))	{
						if($ele.hasClass('ui-button'))	{
							$ele.button('disable');
							$ele.data('original-icon',$ele.button( "option", "icons" ));
							$ele.button( "option", "icons", { primary: "wait", secondary: "" } ); //add or update icon to 'wait', which is a small loading graphic.
							}
						else	{$ele.prop('disabled','disabled');}
						}
//used on the 'test auction' button. could be used elsewhere.
					if($ele.data('trigger') == 'save')	{
						_app.u.dump(" -> trigger set to save. trigger click on save button");
						$ele.closest('form').find("button[data-app-role='saveButton']:first").trigger('click',{'skipDispatch':true});
						}

					_app.model.addDispatchToQ({
						'_cmd' : 'adminProductMacro',
						'pid' : pid,
						'@updates' : [$ele.data('macro-cmd')], //used for sku images
						'_tag' : {
							'callback' : function(rd)	{
								$ele.button( "option", "icons", $ele.data('original-icon') );
									if($ele.is('button'))	{
										if($ele.hasClass('ui-button'))	{
											$ele.button('enable');
											$ele.button( "option", "icons", $ele.data('original-icon') ); //add or update icon to 'wait', which is a small loading graphic.
											}
										else	{$ele.prop('disabled','').removeProp('disabled');}
										}
								if(_app.model.responseHasErrors(rd)){
									$ele.closest('fieldset').find('.ebayMacroUpdateMessaging').anymessage({'message':rd,'persistent':true});
									}
								else	{
									//clear existing messaging and display.
									if(rd._msg_1_txt || (rd['@MSGS'] && rd['@MSGS'].length))	{}
									else{rd._msg_1_txt = "Your changes have been saved"}//Need to have a message for anymessage.
									$ele.closest('fieldset').find('.ebayMacroUpdateMessaging').empty().anymessage(_app.u.successMsgObject($ele.data('macro-cmd')+" success"));
									}
								}
							}
						},'immutable'); //is immutable because 'trigger' may execute a save button, which will execute an immutable request.
					_app.model.dispatchThis('immutable');
					}
				else	{
					$ele.closest('fieldset').find('.ebayMacroUpdateMessaging').anymessage({"message":"In admin_prodedit.e.adminProductMacroExec, either pid ["+pid+"] or data-macro-cmd ["+$ele.data('macro-cmd')+"] is not set and both are required.","gMessage":true});
					}
				},

//The variations tab is hidden unless the item has variations. However, since variations can't be added except from within that tab, there needs to be a mechanism for showing the tab. this is it.
//			productVariationsTabShow : function($ele,p)	{
//				$ele.closest("[data-app-role='productEditorContainer']").find("[data-app-role='variationsTab']").trigger('click').parent().show();
//				}, //productVariationsManagerShow
			
			productAttributeFinderShow : function($ele,p)	{
				if($ele.data('attribute'))	{
					_app.ext.admin.a.showFinderInModal('PRODUCT',$ele.closest("[data-pid]").data('pid'),$ele.data('attribute'));
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.e.productAttributeFinderShow, data-attribute not set on event element.","gMessage":true});
					}
				}, //productAttributeFinderShow

			webPageEditor : function($ele,p)	{
				var pid = $ele.closest("[data-pid]").data('pid');
				if(pid)	{navigateTo('/biz/vstore/builder/index.cgi?ACTION=INITEDIT&FORMAT=PRODUCT&FS=P&SKU='+pid);}
				else	{_app.u.throwGMessage("In admin_prodedit.uiActions.webPageEditor, unable to determine pid.");}
				}, //webPageEditor

			viewProductOnWebsite : function($ele,p)	{
				_app.u.dump("BEGIN admin_prodedit.e.viewProductOnWebsite");
				var pid = $ele.closest("[data-pid]").data('pid');
				if(pid)	{
					_app.ext.admin.u.linkOffSite("http://www."+_app.vars.domain+"/product/"+pid+"/",'',true);
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.uiActions.configOptions, unable to determine pid.","gMessage":true});
					}
				}, //viewProductOnWebsite

			productSearchExec : function($ele,p)	{
				_app.ext.admin_prodedit.u.handleProductKeywordSearch($ele.closest('form').serializeJSON());
				}, //productSearchExec

			adminProductCreateShow : function($ele,p)	{
				_app.ext.admin_prodedit.a.showCreateProductDialog();
				}, //adminProductCreateShow

			ebayCategoryChooserShow : function($ele,p)	{
				var pid = $ele.closest("[data-pid]").data('pid');
				if(pid && ($ele.data('categoryselect') == 'primary' || $ele.data('categoryselect') == 'secondary'))	{
					
					var $container = $ele.closest('label');
					var $input = $(':input:first',$container);
					var $catName = $("[data-app-role='ebayCategoryName']",$container);
										
					_app.ext.admin_marketplace.a.showEBAYCategoryChooserInModal($input,{'pid':pid,'categoryselect':$ele.data('categoryselect')},$catName)

					}
				else	{
					$ele.closest('fieldset').anymessage({'message':'In admin_prodedit.e.ebayCategoryChooserShow, unable to resolve pid ['+pid+'] OR data-categoryselect ['+$ele.data('categoryselect')+'] not set/valid (should be primary or secondary).','gMessage':true});
					}
				}, //ebayCategoryChooserShow


//executed when the 'debug' button is pushed.
			showProductTemplateInDialog : function($ele,p)	{
				_app.u.dump("BEGIN admin_prodedit.e.showProductTemplateInDialog (click!)");
				var pid = $ele.closest("form").find("input[name='pid']").val();
				if(pid)	{
//don't use dialogCreate because this isn't a modal. when browser scoller issue is resolved, this can be updated.
					var $D = $("<div \/>",{'title':'Product Debug: '+pid}).dialog({
						width : "90%",
						height : 500,
						close: function(event, ui)	{
							$(this).dialog('destroy'); //remove from DOM when finished.
							$(this).intervaledEmpty(1000);
							}
						});
					_app.ext.admin_prodedit.a.showProductDebugger($D,{'pid':pid,'templateID':$ele.data('templateid')});
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_prodedit.e.showProductTemplateInDialog, unable to ascertain PID.','gMessage':true});
					}
				},

			productDebugReportExec : function($ele,p)	{
				var
					$debugWin = $ele.closest("[data-app-role='productDebugger']")
					$reportEle = $("[data-app-role='reportsContent']",$debugWin).empty(),
					report = $("select[name='report']",$debugWin).val(),
					pid = $ele.closest("[data-pid]").data('pid');
				
				if(report)	{
					_app.model.addDispatchToQ({
						'_cmd':'adminProductDebugLog',
						'GUID' : report,
						'pid' : pid,
						'_tag':{
							'callback' : function(rd){
								var data = _app.data[rd.datapointer];
								/*
								The response here could come back in one of two flavors. Either as a txt file or using @BODY/@HEAD, which is a csv file (just like batches).
								*/
								if(data)	{
									if(data.body)	{
										rd.filename = report+'.txt';
										_app.callbacks.fileDownloadInModal.onSuccess(rd)
										}
									else if(data['@BODY'] && data['@HEAD'])	{
										_app.ext.admin_batchjob.callbacks.showReport.onSuccess(rd)
										}
									else	{
										$debugWin.anymessage({'message':'In admin_prodedit.e.productDebugReportExec, the response came in an unsupported format.','gMessage':true});
										}
									}
								else	{
									$debugWin.anymessage(rd);
									}								},
							'jqObj' : $reportEle,
							'skipDecode' : true, //contents are not base64 encoded (feature not supported on this call)
							'datapointer':'adminProductDebugLog|'+pid
							}
						},'mutable');
					_app.model.dispatchThis();
					}
				else	{
					$debugWin.anymessage({'message':'Please choose a report type'});
					}
				
				
				
				},

			handlePIDCloneChangeRemoveExec : function($ele,p)	{
				var pid = $ele.closest("[data-pid]").data('pid');
				var verb = $ele.data('verb');
				
				if(pid && verb)	{

				var sfo = $ele.closest('fieldset').serializeJSON({'cb':true});
				
				var cmdObj = {
					_cmd : 'adminProductMacro',
					pid : pid, //pid of product being cloned/nuked/etc
					'@updates' : new Array(),
					_tag : {}
					}
				
				if(verb == 'CLONE' || verb == 'RENAME' || verb == 'NUKE')	{
					cmdObj['@updates'].push(verb+"?"+$.param(sfo));
					}
				else	{
					//invalid verb.
					$ele.closest('.appMessaging').anymessage({"message":'In admin_prodedit.e.handlePIDCloneChangeRemoveExec, invalid data-verb specified on element.','gMessage':true});
					}

				if(cmdObj['@updates'].length)	{
					$('body').showLoading({'message':'Updating product...'});
					cmdObj._tag.callback = function(rd)	{
						$('body').hideLoading();
						if(_app.model.responseHasErrors(rd)){
							$ele.closest('.appMessaging').anymessage({"message":rd});
							}
						else	{

//if assigning a new pid or removing pid, remove the product from the task list.
							if(verb == 'RENAME' || verb == 'NUKE')	{
								$tasklist = $("[data-app-role='productContentTaskResults']",'#productContent');
								if($("li[data-pid='"+pid+"']",$tasklist).length)	{
									$("li[data-pid='"+pid+"']",$tasklist).empty().remove();
									}
								}

							if(verb == 'CLONE')	{
								$ele.closest('.appMessaging').anymessage(_app.u.successMsgObject('Product '+pid+' has been cloned and the clone was added to your product task list'));
								}
							else if(verb == 'NUKE')	{
								$('#globalMessaging').anymessage(_app.u.successMsgObject('Product '+pid+' has been removed from your store'));
								$ele.closest('.ui-dialog-content').dialog('close');
								}
							else if(verb == 'RENAME')	{
								$('#globalMessaging').anymessage(_app.u.successMsgObject('Product '+pid+' has been assigned a new pid and added to your product task list.'));
								$ele.closest('.ui-dialog-content').dialog('close');
								}
							else	{} //non-supported verb error would already have been displayed by now.
							}
						
						
						} // end callback.
					
					_app.model.addDispatchToQ(cmdObj,'immutable');
//if new pid or clone, add item to task list.  This needs to be after the dispatch or the new pid won't exist.
					if(verb == 'CLONE' || verb == 'RENAME')	{
						_app.ext.admin_prodedit.u.addProductAsTask({'pid':sfo.NEWID,'tab':'product','mode':'add'});
						}
					_app.model.dispatchThis('immutable');
					
					}

		


					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_prodedit.e.handlePIDCloneChangeRemoveExec, either unable to ascertain pid ['+pid+'] or data-verb ['+$ele.data('verb')+'] not set on element.','gMessage':true});
					}
				},

			adminProductMacroSaveAllTabsExec : function($ele,p)	{
				var $PE = $ele.closest("[data-app-role='productEditorContainer']");
				
				$('form',$PE).each(function (index)	{
					_app.u.dump(" -> "+index+" form");
//					_app.u.dump(" -> save button length: "+$("[data-app-role='saveButton']",this).length);
//skipDispatch tells the individual save buttons to not dispatch themselves. We'll do one dispatch at the end.
					$("button[data-app-role='saveButton']",this).trigger('click',{'skipDispatch':true});
					_app.model.dispatchThis('immutable');
					});
				},

// Didn't use macrobuilders because they're designed for making 1 _cmd
// The product save may execute more than one. We want lots of littls saves here as opposed to 1 big one.
// set data-save-handler="" on the button. a comma separated list is supported. the values should match a function in admin_prodedit.saveHandlers
			adminProductMacroSaveHandlersExec : function($ele,p)	{
				var $form = $ele.closest('form');
				if($form.length && $ele.data('save-handlers'))	{
					if(_app.u.validateForm($form))	{
						var
							handlers = $ele.data('save-handlers').split(','),
							L = handlers.length,
							pid = $ele.closest("form").find("input[name='pid']").val();
						
						$form.showLoading({'message':'Saving Changes...'});
						for(var i = 0; i < L; i += 1)	{
							if(typeof _app.ext.admin_prodedit.saveHandlers[handlers[i]] == 'function')	{
								_app.ext.admin_prodedit.saveHandlers[handlers[i]]($form);
								}
							else	{
								$form.anymessage({"message":"In admin_prodedit.e.adminProductMacroSaveHandlersExec, saveHandlers."+handlers[i]+" is not a function.","gMessage":true});
								}
							}
//when a save occurs, we should update the product record in memory as well.
					_app.model.addDispatchToQ({
						'_cmd':'adminProductDetail',
						'variations':1,
						'inventory' : 1,
						'schedules' : 1,
						'skus':1,
						'pid' : pid,
						'_tag':{
							'datapointer':'adminProductDetail|'+pid,
							'pid' : pid
							}
						},'immutable');

//dispatch is skipped when 'save all tabs' button is pressed. 
						if(p.skipDispatch)	{}
						else	{
							_app.model.dispatchThis('immutable');
							}
						}
					else	{
						$("<div \/>").anymessage({
							"containerClass" : "ui-state-error",
							"message":"Doh! The form did not validate. Please populate/change the necessary fields, which are now highlighted."
							})
						.appendTo('body')
						.css({'z-index':'1000','width':'300'})
						.position({
							my : "right bottom",
							at : "right top",
							of: $ele
							});
						$ele.button('disable').removeClass('ui-state-highlight');
						} //validateForm handles error display for the specific fields.
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.e.adminProductMacroSaveHandlersExec, either unable to determine $form ["+$form.length+"] or data-save-handlers ["+$ele.data('save-handlers')+"] not set on button, both of which are required.","gMessage":true});
					}
				},



//executed when the 'debug' button is pushed.
			addDetailType2SKUShow : function($ele,p)	{
//				_app.u.dump("BEGIN admin_prodedit.e.addDetailType2SKUShow (click!)");
				
				if($ele.data('detail-type'))	{
					
					var pid = $ele.closest("form").find("input[name='pid']").val();
					var sku = $ele.closest("[data-sku]").data('sku');
					if(pid && sku)	{
						var $PE = $ele.closest("[data-app-role='productEditorContainer']");
						var $D = _app.ext.admin.i.dialogCreate({
							'title' : 'Add Detail Record for '+sku,
							'showLoading' : false,
							'templateID' : 'addInventoryDetailTemplate',
							'appendTo' : $PE
							});
//add the 'save' button
						$D.dialog( "option", "buttons", [ { text: "Save", click: function() {
							if(_app.u.validateForm($('form',$D)))	{
								$D.showLoading({"message":"Creating inventory record"});
								_app.model.addDispatchToQ({
									_cmd : 'adminProductMacro',
									pid : pid,
								// * 201346 -> changed to a more effient method for serializing inputs.
								//	'@updates' : ["INV-"+$ele.data('detail-type')+"-SKU-INIT?SKU="+sku+"&"+$.param($('form',$D).serializeJSON())],
									'@updates' : ["INV-"+$ele.data('detail-type')+"-SKU-INIT?SKU="+sku+"&"+$('form',$D).serialize()],
									_tag : {
										callback : function(rd){
											$D.hideLoading();
											if(_app.model.responseHasErrors(rd)){
												$D.anymessage({'message':rd});
												}
											else	{			
												$D.dialog('close');
												$("[data-anytabs-tab='inventory']:first a",$PE).trigger('click');
												$ele.closest('form').anymessage({'message':'Updated inventory record'});
												}
											}
										}
									},"immutable");
								_app.model.dispatchThis("immutable");


								}
							else	{}
							}}]);
						$D.dialog('open');
						
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_prodedit.e.addDetailType2SKUShow, unable to ascertain PID ['+pid+'] and/or SKU ['+sku+'].','gMessage':true});
						}
					}
				else	{
					
					}

				},

// END new/updated product editor events
			
			variationSearchByIDExec : function($ele,p)	{
				var varID = $ele.closest('tr').data('id');
				navigateTo('/tab/product');
				_app.ext.admin_prodedit.u.prepContentArea4Results($('#productContent'));
				$("[data-app-role='productManagerSearchResults']",$('#productContent')).showLoading({'message':'Performing search...'});

				_app.model.addDispatchToQ({
					"mode":"elastic-search",
					"size":250,
					"filter":{"term":{"pogs":varID}},
					"_cmd":"appPublicSearch",
					"_tag" : {
						'callback':'handlePMSearchResults',
						'extension':'admin_prodedit',
						'datapointer' : 'appPublicSearch|variation|'+varID,
						'templateID':'prodManagerProductResultsTemplate',
						'list': $("[data-app-role='productManagerSearchResults']",$('#productContent'))
						},
					"type":"product"
					},"mutable");
				_app.model.dispatchThis("mutable");
				}, //variationSearchByIDExec

//well crap.  This button does two very different things.
//when in store mode, this actually executes the save.
//when in product mode, this does an 'apply', so the @variations object in memory is updated, but not saved yet.
//button is executed in the 'edit variation' screen.
			variationAdminProductMacroExec : function($ele,p)	{
				_app.u.dump("BEGIN admin_product.e.variationAdminProductMacroExec");
				var
					$form = $ele.closest('form'),
					variationData = $ele.closest('.variationEditorContainer').data(),
					sfo = {}, 
					variationID = $("[name='id']",$form).val();
				
				if(variationData.variationmode == 'product')	{
					sfo._cmd ='adminProductPOGUpdate';
					sfo.pid = variationData.pid;
//for a product update, need to send up entire variation object, not just a given sog/pog.
					sfo['%sog'] = _app.data['adminProductDetail|'+sfo.pid]['@variations'];
//if guid is present, use it.  That means this was a pog just added to the product.
					var index = (variationData.variationguid) ? _app.ext.admin.u.getIndexInArrayByObjValue(sfo['%sog'],'guid',variationData.variationguid) : _app.ext.admin.u.getIndexInArrayByObjValue(sfo['%sog'],'id',variationID);
// validate to ensure index is set. also, 00 IS a valid sog id, so that needs to be supported.
					if(index || Number(index) == 0)	{
						$.extend(true,sfo['%sog'][index],$form.serializeJSON({'cb':true})); //update original w/ new values but preserve any values not in the form.
						sfo['%sog'][index]['@options'] = new Array();  //clear existing. that way deleted doesn't carry over.
						}
					else	{
						$('#globalMessaging').anymessage({'message':'Unable to determine index (sog id = '+variationID+').','gMessage':true});
						}
					}
				else	{
					sfo._cmd ='adminSOGUpdate';
					//destructive update, so merge new data over old (which preserves old/unchanged).
					sfo['%sog'] = $.extend(true,{},_app.data.adminSOGComplete['%SOGS'][variationID],$form.serializeJSON({'cb':true}));
					sfo['%sog']['@options'] = new Array();  //clear existing. that way deleted doesn't carry over.
					}


//data for saving options in a 'select' based option requires some manipulation to get into '@options' array.
				if(_app.ext.admin_prodedit.u.variationTypeIsSelectBased(variationData.variationtype))	{
//						_app.u.dump(" -> variation type ["+variationData.variationtype+"] IS select based.");
//						_app.u.dump(" -> index: "+index);
//						_app.u.dump(" -> sfo['%sog']: "); _app.u.dump(sfo['%sog']);
					$("[data-app-role='dataTable']:first tbody tr",$form).each(function(){
						if($(this).hasClass('rowTaggedForRemove'))	{} //don't include rows tagged for deletion.
						else	{
							var whitelist = new Array('v','prompt','w','p','asm','html','img');
							(variationData.variationmode == 'product') ? sfo['%sog'][index]['@options'].push(_app.u.getWhitelistedObject($(this).data(),whitelist)) : sfo['%sog']['@options'].push(_app.u.getWhitelistedObject($(this).data(),whitelist))
							}
						});						
					}
				else if(variationData.variationtype == 'biglist')	{
					_app.u.dump(" -> variation type IS biglist.");
					var optionsArr = $("[name='biglist_contents']",$form).val().split("\n");
					var L = optionsArr.length;
					for(var i = 0; i < L; i += 1)	{
						sfo['%sog']['@options'].push({'prompt':optionsArr[i]});
						}
//						_app.u.dump(sfo);
					}
				else	{}

// pog editor just applies changes in memory till master 'save' is done.
				if(variationData.variationmode == 'product')	{
//update the variations manager so this variation is tagged as edited. 
//if this is a new variation group, id won't be set but guid will.
					if(variationData.variationguid)	{
						$ele.closest("[data-app-role='productVariations']").find("tr[data-guid='"+variationData.variationguid+"']:first").addClass('edited');
						}
					else	{
						$ele.closest("[data-app-role='productVariations']").find("tr[data-id='"+variationID+"']:first").addClass('edited');
						}
					_app.u.dump(" -> tr w/ data-id of sog.length: "+ $ele.closest("[data-app-role='productVariations']").find("tr["+(variationData.variationguid ? "data-guid='"+variationData.variationguid+"'" : "data-id='"+variationID+"'")+"']:first").length);
					//for a new sog/pog, a guid is present but no ID.
					
					var $EDParent = $ele.closest('.anyformEnabled'); //find the parent before the modal is closed/destroyed (or it won't be found).
					$ele.closest('.ui-dialog-content').dialog('close').empty();
//update change counts AFTER dialog is destroyed or the changes to the variation itself will be in the count.
//This may sound like a good idea, but it isn't because the dialog is destroyed and if another variation is edited, the count change could be misleading .
//so ALL changes to one variation count as 1 edit.
					$EDParent.anyform('updateChangeCounts');
					}
				else	{
					$form.showLoading({"message":"Saving changes to variations"});
					sfo._tag = {
						callback : function(rd){
							$form.hideLoading();
							if(_app.model.responseHasErrors(rd)){
								$('#globalMessaging').anymessage({'message':rd});
								}
							else	{
								_app.ext.admin.u.restoreInputsFromTrackingState($form);
								_app.ext.admin.u.removeFromDOMItemsTaggedForDelete($form);
								}
							}
						}

					_app.model.addDispatchToQ(sfo,'immutable');
					_app.model.addDispatchToQ({'_cmd':'adminSOGComplete','_tag':{'datapointer':'adminSOGComplete'}},'immutable');
					_app.model.dispatchThis('immutable');
					}
				}, //variationAdminProductMacroExec

			variationSettingsToggle : function($ele)	{
				var $td = $ele.closest('table').find("[data-app-role='variationSettingsContainer']");
				if($td.is(':visible'))	{
					$td.hide();
					$ele.button('option','icons',{primary: "ui-icon-circle-triangle-e"})
					}
				else	{
					$td.show();
					$ele.button('option','icons',{primary: "ui-icon-circle-triangle-w"})
					}
				}, //variationSettingsToggle

			variationAddToProduct : function($ele,p)	{
				var pid = $ele.closest("[data-app-role='productVariationManager']").data('pid');
				if(pid)	{
//						_app.u.dump(" -> pid: "+pid);
					if(_app.data['adminProductDetail|'+pid] && _app.data['adminProductDetail|'+pid]['@variations'])	{

						$("[data-app-role='saveButton']",'#productTabMainContent').addClass('ui-state-highlight');
						$ele.closest('tr').find("button").button('disable'); //Disable the 'add' button so sog isn't added twice.
						var variationID = $ele.closest('tr').data('id');
						_app.data['adminProductDetail|'+pid]['@variations'].push($.extend(true,{'sog':variationID+'-'+_app.data.adminSOGComplete['@SOGS'][variationID]},_app.data.adminSOGComplete['%SOGS'][variationID])); //add to variation object in memory.
						
						var $tbody = $("<tbody \/>").anycontent({
							'templateID':'productVariationManagerProductRowTemplate',
							'data':_app.data.adminSOGComplete['%SOGS'][$ele.closest('tr').data('id')],
							'dataAttribs':_app.data.adminSOGComplete['%SOGS'][$ele.closest('tr').data('id')]
							})
						_app.u.handleButtons($tbody);
						$tbody.children().attr({'data-isnew':'true','data-issog':'true'}).addClass('edited').appendTo($ele.closest("[data-app-role='productVariationManagerContainer']").find("[data-app-role='productVariationManagerProductTbody']"));
						_app.ext.admin.u.handleSaveButtonByEditedClass($ele.closest('form'));
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In admin_prodedit.e.variationAddToProduct, product or product variation object not in memory.","gMessage":true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.e.variationAddToProduct, unable to resolve PID.","gMessage":true});
					}
				}, //variationAddToProduct

			adminSOGDeleteConfirm : function($ele,p)	{
				var 
					$tr = $ele.closest('tr'),
					data = $tr.data();

				var $D = _app.ext.admin.i.dialogConfirmRemove({
					'title' : 'Please confirm removal of variation '+data.id,
					'removeFunction':function(vars,$D){
						$D.parent().showLoading({"message":"Deleting Variation"});
						_app.model.addDispatchToQ({'_cmd':'adminSOGDelete','id':data.id,'_tag':{'callback':function(rd){
							$D.parent().hideLoading();
							if(_app.model.responseHasErrors(rd)){
								$('#globalMessaging').anymessage({'message':rd});
								}
							else	{
								$D.dialog('close');
								$('#globalMessaging').anymessage(_app.u.successMsgObject('The variation has been removed.'));
								$tr.empty().remove(); //removes row for list.
								}
							}
						}
					},'immutable');
				_app.model.addDispatchToQ({'_cmd':'adminSOGComplete','_tag':{'datapointer' : 'adminSOGComplete'}},'immutable'); //update coupon list in memory.
				_app.model.dispatchThis('immutable');
				}});
				var $div = $("<div \/>").css({'width':200,'height':100}).appendTo($D);
				$div.showLoading({"message":"Fetching # of items using this variation"});
				_app.model.addDispatchToQ({
					"mode":"elastic-search",
					"size":3,
					"filter":{"term":{"pogs":data.id}},
					"_cmd":"appPublicSearch",
					"_tag" : {
						'callback' : function(rd){
								$div.hideLoading();
							if(_app.model.responseHasErrors(rd)){
								$div.anymessage({'message':rd});
								}
							else	{
								if(_app.data[rd.datapointer] && _app.data[rd.datapointer].hits && _app.data[rd.datapointer].hits.total)	{
									$div.append("A search resulted in "+_app.data[rd.datapointer].hits.total+" items using this variation group that will be impacted if you delete it.");
									}
								else if(_app.data[rd.datapointer] && _app.data[rd.datapointer]._count == 0)	{
									$div.append("A search resulted in zero items using this variation group.");
									}
								else	{
									$div.append("Unable to determine how many product may be using this variation group.");
									}
								}
							},
						'datapointer' : 'appPublicSearch|variation|'+data.id
						},
					"type":"product"
					},"mutable");
				_app.model.dispatchThis('mutable');
				}, //variationRemoveConfirm

//clicked when editing an option for a 'select' type. resets and populates inputs so option can be edited.
			variationOptionUpdateShow : function($ele,p)	{
				var
					$optionEditor = $ele.closest("[data-app-role='variationOptionEditorContainer']"), //used for setting context
					$saveButton = $ele.closest('form').find("[data-app-role='saveButton']");
				

				$saveButton.button('disable'); //can't save changes while option editor is open. 'prompt' input name is also in variation settings. will save over it.
				$("[data-app-role='varitionOptionAddUpdateContainer']",$optionEditor)
					.empty()
					.anycontent({'templateID':'optionEditorInputsTemplate','data':$ele.closest('tr').data()})
					.append($("<div class='buttonset alignRight' \/>")
						.append($("<button>Cancel Changes<\/button>").button().on('click',function(){
							$(this).closest("[data-app-role='varitionOptionAddUpdateContainer']").empty(); //just nuke the entire form.
							_app.ext.admin.u.handleSaveButtonByEditedClass($(this).closest('form'));
							}))
						.append($("<button>Update Option<\/button>").button().on('click.closeEditor',function(e){
							if(_app.ext.admin_config.e.dataTableAddUpdate($(this),e)){
								$(this).closest("[data-app-role='varitionOptionAddUpdateContainer']").empty(); //kill the form on update for usability purposes.
								}
							
							}))
						);
//below, closest.form includes 'type' and other globals necessary for what inputs are available in editor.
				_app.ext.admin_prodedit.u.handleOptionEditorInputs($optionEditor,$.extend(true,{},$ele.closest('form').serializeJSON(),$ele.closest('tr').data()));
				}, //variationOptionUpdateShow

//executed when the 'add new option' button is clicked within a select or radio style variation group.
//The code below is very similar to variationOptionUpdateShow. Once the save is in place, see about merging these if reasonable.
			variationOptionAddShow : function($ele,p)	{
				var varEditorData = $ele.closest(".variationEditorContainer").data();
				if(!varEditorData.ispog && varEditorData.variationid)	{
					if(varEditorData.variationid.indexOf('#') == 0)	{
						_app.u.dump("setting ispog to true because variationid contains a #");
						varEditorData.ispog = true;
						}
					}
			
/*				//if MODE= product and this is a SOG not a POG, then disable the button. SOGs can only use options from their original list.
				if(varEditorData.variationmode == 'product')	{
//					_app.u.dump(" -> variationmode == product. varEditorData: "); _app.u.dump(varEditorData);
					if(varEditorData.ispog)	{
						
						}
					else	{
						$ele.attr('title',"Can not add a new option because this is a store group.");
						$ele.button('disable');
// ** 201330 -> no point showing this button if it can't be clicked. building a new interface to allow for the SOG options to be added.
						$ele.hide();
						}
					}
*/
				
				var
					$optionEditor = $ele.closest("[data-app-role='variationOptionEditorContainer']"), //used for setting context
					$saveButton = $ele.closest('form').find("[data-app-role='saveButton']");

				$saveButton.button('disable');
				$("[data-app-role='varitionOptionAddUpdateContainer']",$optionEditor)
					.empty()
					.anycontent({'templateID':'optionEditorInputsTemplate','data':{'guid':_app.u.guidGenerator()}}) //a guid is passed to populate that form input. required for editing a non-saved option
					.append($("<div class='buttonset alignRight' \/>")
						.append($("<button>Cancel<\/button>").button().on('click',function(){
							$(this).closest("[data-app-role='varitionOptionAddUpdateContainer']").empty(); //just nuke the entire form.
							_app.ext.admin.u.handleSaveButtonByEditedClass($(this).closest('form'));
							}))
						.append($("<button>Apply Option</button>").button().on('click.closeEditor',function(e){
							if(_app.ext.admin_config.e.dataTableAddUpdate($(this),e)){
								$(this).closest("[data-app-role='varitionOptionAddUpdateContainer']").empty(); //kill the form on update for usability purposes.
								}
							})));
				_app.ext.admin_prodedit.u.handleOptionEditorInputs($optionEditor,$ele.closest('form').serializeJSON());
				}, //variationOptionAddShow

			variationOptionImgLibShow : function($ele,p)	{
				var $context = $ele.closest('fieldset');
				mediaLibrary($("[data-app-role='variationImg']",$context),$("[name='img']",$context),'Choose Dropship Logo');
				},

//clicked when editing a variation group.
			variationUpdateShow : function($ele,p)	{
				dump(" -> $ele.data('variationmode'): "+$ele.data('variationmode'));
				p = p || {};
				if($ele.data('variationmode') == 'store')	{
					// ### FUTURE -> update this to use a naviagteTo
					var $tab = $(_app.u.jqSelector('#',_app.ext.admin.vars.tab+'Content'));
					_app.u.addEventDelegation($tab);
					$tab.empty().append(_app.ext.admin_prodedit.a.getVariationEditor('store',_app.data.adminSOGComplete['%SOGS'][$ele.closest('tr').data('id')]).anyform({'trackEdits':true}));
					$("[data-app-role='variationsHeaderContainer']:first","#"+_app.ext.admin.vars.tab+'Content').addClass('smallButton').prepend($("<button \/>").addClass('floatRight').text('Global Variations').button({icons: {primary: "ui-icon-arrowthick-1-w"},text: true}).on('click',function(){
						navigateTo("/ext/admin_prodedit/showStoreVariationsManager");
						}));
					}
				else if($ele.data('variationmode') == 'product')	{
					var 
						data, 
						variationID = $ele.closest('tr').data('id'), 
						pid = $ele.closest("[data-app-role='taskItemContainer']").data('pid'); // a sog 'could' have a data-pid w/ the wrong pid. Get the right pid from the container.
					dump(" -> pid: "+pid);
					if(pid && _app.data['adminProductDetail|'+pid])	{

						var L = _app.data['adminProductDetail|'+pid]['@variations'].length;
// if isnew is true, that means this is a sog or pog that was just added to the product.
// pogs do not have an ID immediately after they're added, so the guid is used to get the data from the product object in memory.
						if($ele.closest('tr').data('isnew') && $ele.closest('tr').data('ispog'))	{
							variationID = ""; //set to blank so modal title doesn't show 'undefined'.
							data = _app.data['adminProductDetail|'+pid]['@variations'][_app.ext.admin.u.getIndexInArrayByObjValue(_app.data['adminProductDetail|'+pid]['@variations'],'guid',$ele.closest('tr').data('guid'))]
							}
						else if($ele.closest('tr').data('isnew') && $ele.closest('tr').data('issog'))	{
							data = _app.data.adminSOGComplete['%SOGS'][variationID]
							}
						else	{
							data = _app.data['adminProductDetail|'+pid]['@variations'][_app.ext.admin.u.getIndexInArrayByObjValue(_app.data['adminProductDetail|'+pid]['@variations'],'id',variationID)]
							}
	
						var $D = _app.ext.admin.i.dialogCreate({
							'title' : 'Edit Variation '+variationID+' for '+pid,
							'showLoading' : false,
							'appendTo' : $ele.closest("[data-app-role='productVariations']") //appended to the variation editor so that the dialog can look up the tree to modify the variation editor itself.
							});
	
						$D.append(_app.ext.admin_prodedit.a.getVariationEditor('product',data,pid));
						_app.u.addEventDelegation($D);
						$D.anyform({'trackEdits':true}); //add after $D is on the dom so anydlegate can look up the tree to see if events are already delegated.
						$D.dialog('option','height',($(document.body).height() - 100));
//a little css tuning to make this shared content look better in a modal.
						$('hgroup',$D).hide();
						$('section.ui-widget-content',$D).css('border-width',0);
// There's a usability issue between the app and FireFox where after doing a ctrl+f and clicking within the variations/options box, the browser jumps to top of the scrolly div on click.
//putting the variation options into their own scroller solved this, but made the interface feel more clumsy so it was removed.
//						$("[data-app-role='storeVariationsOptionsContainer']",$D).wrap($("<div \/>").css({'padding':0,'overflow':'auto','height':($D.innerHeight() - 200)}));
						$D.dialog('open');
						}
					else	{
						$ele.closest('form').anymessage({"message":"In admin_prodedit.e.variationUpdateShow, unable to ascertain pid ["+pid+"] or product is not in memory ["+(typeof _app.data['adminProductDetail|'+pid])+"].","gMessage":true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.e.variationUpdateShow, btn mode ["+$ele.data('variationmode')+"] either not set or invalid (only 'store' and 'product' are valid).","gMessage":true});
					}

				}, //variationUpdateShow

			variationHandleTypeSelect : function($ele,p)	{
				var value = $ele.val();
				var $form = $ele.closest('form');
				if(value == 'select' || value == 'radio' || value == 'cb' || value == 'imggrid' || value == 'imgselect' )	{
					$("[data-app-role='variationInventorySettings']",$form).show();
					}
				else	{
					$("[name='INV']",$form).prop('checked','');
					$("[data-app-role='variationInventorySettings']",$form).hide();
					$("[data-app-role='variationInventorySupplementals']",$form).hide(); //safe to hide this
					}
				}, //variationHandleTypeSelect

			variationHandleInventoryChange : function($cb)	{
				$cb.off('change.variationHandleInventoryChange').on('change.variationHandleInventoryChange',function(){
					if($cb.is(":checked"))	{
						$("[data-app-role='variationInventorySupplementals']",$cb.closest('form')).show();
						}
					else	{
						$("[data-app-role='variationInventorySupplementals']",$cb.closest('form')).hide();
						}
					});
				}, //variationHandleInventoryChange

//used in product editor.  shows a DD which allows user to chooser product or store for scope.
			variationCreateShowMenu : function($ele,p)	{
				var $menu = $ele.next()
				$menu.show().css({'position':'absolute','width':'200px','padding':'2px 0'}).position({
					my: "left top",
					at: "left bottom",
					of: $ele
					}).find('button').css({'width':'90%','margin':'2px auto'});
//				### TODO -> test this w/out timeout 
				 setTimeout(function(){
					 $( document ).one( "click", function() {
						$menu.hide();
						});
					 },1000);
				}, //variationCreateShow

			variationCreateShow : function($ele,p)	{
				var mode = $ele.data('variationmode');
				var $D = _app.ext.admin.i.dialogCreate({
					'title' : 'Create a new '+jQuery.camelCase(mode)+' variation',
					'data' : {}, //this is here so that loadsTemplates renderformats still get executed. Won't be necessary after data-bind upgrade.
					'templateID' : 'variationsManagerCreateTemplate',
					'showLoading' : false,
					'appendTo' : (mode == 'product' ? $ele.closest('form').parent() : '') //IMPORTANT -> if this isn't appended editor, the 'save' for a product variation won't have any context.
					});
				_app.u.addEventDelegation($D);
				$D.data('variationmode',mode).anyform();
				_app.u.handleButtons($D);
				if(mode == 'store')	{
					//a store variation group can be edited from the product editor. need to set a PID when this happens.
					if($ele.attr('data-ui-source') == 'productEditor')	{
						$D.attr({'data-pid':$ele.closest('[data-pid]').data('pid')});
						}
					$D.dialog('open');
					}
				else if(mode == 'product')	{
					$D.attr({'data-pid':$ele.closest('[data-pid]').data('pid')});
					$D.dialog('open');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_prodedit.e.variationCreateShow, invalid data-mode ["+mode+"] on trigger element. must be store or product.","gMessage":true});
					} //invalid mode.
				}, //variationCreateShow

//used within product editor to allow for the list of global variations to be refreshed.
			storeVariationsRefresh : function($ele,p)	{
				var $tbody = $ele.closest("[data-app-role='productVariationManagerStoreContainer']").find("tbody[data-app-role='storeVariationsTbody']:first");
				$tbody.empty().showLoading({'message':'Fetching store variations'});
				_app.model.addDispatchToQ({
					'_cmd':'adminSOGComplete',
					'_tag':	{
						'datapointer' : 'adminSOGComplete',
						'callback' : function(rd)	{
							$tbody.hideLoading();
							if(_app.model.responseHasErrors(rd)){
								$tbody.closest('div').anymessage({'message':rd});
								}
							else	{
								$tbody.anycontent(rd); 
								_app.u.handleButtons($tbody);
								_app.ext.admin_prodedit.u.handleApply2ProdButton($ele.closest("[data-app-role='productVariationManagerContainer']"));
								}
							}
						}
					},'mutable');
				_app.model.dispatchThis('mutable');
				},

			variationCreateExec : function($ele,p)	{
//				_app.u.dump("BEGIN admin_prodedit.e.variationCreateExec");
				var 
					mode = $ele.closest('.ui-dialog-content').data('variationmode'),
					pid = $ele.closest("[data-pid]").data('pid'),
					$form = $ele.closest('form'),
					sfo = $form.serializeJSON({'cb':true}),
					newSogID;
					
//				_app.u.dump(" -> mode: "+mode);
				if(_app.u.validateForm($form) && sfo.type)	{
					$form.showLoading({'message':'Creating '+mode+' variation'});
					sfo.autoid = 1; //tells API to give this option a variation ID (next in sequence) and to assign id's to the options.
					if(mode == 'store')	{
						sfo.v = '2'; //sog version.
						_app.model.addDispatchToQ({
							'_cmd':'adminSOGCreate',
							'%sog' : sfo,
							'_tag':	{
								'datapointer' : 'adminSOGCreate',
								callback : function(rd){
									if(_app.model.responseHasErrors(rd)){
										$form.anymessage({'message':rd});
										}
									else	{
										$ele.closest('.ui-dialog-content').dialog('close');
										newSogID = _app.data[rd.datapointer].sogid;
										_app.ext.admin_prodedit.a.showStoreVariationsManager($('#productTabMainContent'));
										$('#productTabMainContent').anymessage(_app.u.successMsgObject('Your variation group has been added.'))
										}
									}
								}
							},'mutable');
// SANITY -> mode can = store AND the user could be in the product editor (creating a store variation group)							
						_app.model.addDispatchToQ({
							'_cmd':'adminSOGComplete',
							'_tag':	{
								'datapointer' : 'adminSOGComplete',
								'callback' : function(rd)	{
									_app.u.dump(" -> INTO the callback for adminSOGComplete");
									if(_app.model.responseHasErrors(rd)){
										$form.anymessage({'message':rd});
										}
									else	{
										var $VM = $("[data-app-role='variationManager']",$(_app.u.jqSelector('#',_app.ext.admin.vars.tab+'Content')))
										if($VM.length)	{
											//if VM has length, this is store variation manager, NOT adding a store variation from the product editor. refresh the list.
											navigateTo("/ext/admin_prodedit/showStoreVariationsManager");
											}
										else	{
											$taskItem = $("li.isProductContainer[data-pid='"+pid+"']",'#productContent');
											if($taskItem.length)	{
												_app.u.dump(" -> found a matching pid product container in the task list.");
												var $tbody = $("tbody[data-app-role='storeVariationsTbody']:first",$taskItem);
												//update the list of sogs.
												$tbody.empty().anycontent(rd); 
												_app.u.handleButtons($tbody);
//apply the new sog to the list of product variations.
												if(newSogID)	{
													$("[data-id='"+newSogID+"']",$tbody).find("button[data-app-click='admin_prodedit|variationAddToProduct']").trigger('click');
													}
												
												}
											else	{
												//product is not open. odd. not warning worthy. there may be a valid reason for this.
												_app.u.dump(" -> did NOT find a matching pid product container in the task list.");
												}
											}
										}
									}
								}
							},'mutable');
						_app.model.dispatchThis('mutable');
						}
					else if(mode == 'product' && pid){
						// the dialog is appendedTo the product editor variations tab, so $ele is still within context of the product.
						sfo.guid = _app.u.guidGenerator();
						_app.data['adminProductDetail|'+pid]['@variations'].push(sfo); //add to variation object in memory.
						var $varEditor = $ele.closest("[data-app-role='variationContainer']");

						var $tbody = $("<tbody \/>").anycontent({
							'templateID':'productVariationManagerProductRowTemplate',
							'data':sfo,
							'dataAttribs':sfo
							});
						_app.u.handleButtons($tbody);
						$("[data-app-click='admin_prodedit|variationUpdateShow']",$tbody).button('disable').attr('title','Product variations must be saved to the product prior to options being added.');

						$tbody.children().attr({'data-isnew':'true','data-ispog':'true'}).addClass('edited').appendTo("[data-app-role='productVariationManagerProductTbody']",$varEditor);
						$ele.closest('.ui-dialog-content').dialog('close').empty();
						$tbody.closest('.anyformEnabled').anyform('updateChangeCounts');
						$varEditor.anymessage({'errtype':'hint','message':'To add options to the variation, please save first.'});
						}
					else	{
						//error. unsupported or unable to ascertain mode. or mode is product and pid could not be ascertained.
						$ele.closest('form').anymessage({"message":"In admin_prodedit.e.variationCreateExec, either variationmode ["+mode+"] was unable to be determined or was an invalid value (only store and product are supported) or mode was set to product and PID ["+pid+"] was unable to be determined. ","gMessage":true});
						}

					}
				else if(!sfo.type)	{
					$form.anymessage({'message':'Please select a type'});
					}
				else	{} //validateForm handles error display.


				}, //variationCreateExec

//a button for toggling was added for two reasons: people may not like/have drag and drop and if no options were enabled, hard to get placement exactly right.
			variationsOptionToggle : function($ele,p)	{
				p.preventDefault();
				var $tr = $ele.closest('tr');
				var $editor = $ele.closest("[data-app-role='variationOptionEditorContainer']"); //used for context.
				if($ele.closest("[data-app-role='variationsOptionsTbody']").length)	{
					$("[data-app-role='storeVariationsOptionsTbody']",$editor).append($tr);
					}
				else	{
					$("[data-app-role='variationsOptionsTbody']",$editor).append($tr);
					}
				_app.ext.admin_prodedit.u.handleOptionsSortableStop($tr);
				return false;
				}, //variationsOptionToggle

			skuFinderLoadTemplate : function($ele,p)	{
				p.preventDefault();
				var $variations = $ele.closest("[data-skufinder-role='variations']");
				if(_app.u.validateForm($variations))	{
					var
						$templateParent = $ele.closest("[data-skufinder-role='container']"),
						pid = $variations.data('pid');

					dump(" ------------> PID: "+pid);
					if($templateParent.length && $templateParent.attr('data-skufinder-templateid') && pid)	{
						var sku = _app.ext.admin_prodedit.u.buildSKU(pid,_app.data['adminProductDetail|'+pid]['@variations'],$variations.serializeJSON());
						var optionDataset = _app.ext.admin_prodedit.u.getSKUDataset(sku,_app.data['adminProductDetail|'+pid]['@skus']);
						var $target = $("[data-skufinder-role='target']",$templateParent);
						if(sku && optionDataset && $target.length)	{
							if($("[data-sku='"+sku+"']",$target).length)	{
								//sku is already in the list. 
								$("[data-sku='"+sku+"']",$target).effect( 'highlight');
								}
							else	{
								$target.anycontent({'templateID':$templateParent.attr('data-skufinder-templateid'),'data':optionDataset,'dataAttribs':{'sku':sku}});
								}
							}
						else	{
							$templateParent.anymessage({"message":"In admin_prodedit.e.skuFinderLoadTemplate, either unable to determine sku ["+sku+"] and/or optionDataset ["+(typeof optionDataset)+"] and/or $target has no length ["+$target.length+"] (which means data-skufinder-role='target' not found withing skufinder-role='container').","gMessage":true});
							}
						}
					else	{
						$variations.anymessage({"message":"In admin_prodedit.e.skuFinderLoadTemplate, either unable to locate data-skufinder-role='container' ["+$templateParent.length+"] or it did not have an data-skufinder-templateid attribute on it or unable to ascertain pid ["+pid+"].","gMessage":true});
						}
					}
				else	{} //validateForm handles error display.
				
				return false;
				}

			} //Events
		
		} //r object.
	return r;
	}