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





var admin_customer = function() {
	var theseTemplates = new Array('customerSearchResultsTemplate','CustomerPageTemplate','customerEditorTemplate','customerEditorTicketListTemplate','customerEditorGiftcardListTemplate','customerEditorWalletListTemplate','customerEditorAddressListTemplate','customerEditorNoteListTemplate','customerAddressAddUpdateTemplate');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/customer.html',theseTemplates);
//				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/customer.css','user_styles']);

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
//This is how the task manager is opened. Just execute this function.
// later, we may add the ability to load directly into 'edit' mode and open a specific user. not supported just yet.
			showCustomerManager : function($target) {

				if($("[data-app-role='dualModeContainer']",$target).length)	{$target.show()} //already an instance of help open in this target. leave as is.
				else	{
					$target.anycontent({'templateID':'CustomerPageTemplate','showLoading':false}); //clear contents and add help interface
					app.ext.admin.u.handleAppEvents($target);
					}
				
//if the target is a tab, bring that tab/content into focus.
				if($target.data('section'))	{
					app.ext.admin.u.bringTabIntoFocus($target.data('section'));
					app.ext.admin.u.bringTabContentIntoFocus($target);
					}

				}, //showCustomerManager
//in obj, currently only CID is present (and required). but most likely, PRT will be here soon.
			showCustomerEditor : function($target,obj)	{
				
				if($target && typeof $target == 'object')	{
					if(obj && obj.CID)	{
						$target.showLoading("Fetching Customer Record");
						app.calls.appNewslettersList.init({},'mutable');
						console.warn("NEED TO GET WHOLESALE SCHEDULE HERE");
						app.ext.admin.calls.adminCustomerDetail.init({'CID':obj.CID,'rewards':1,'wallets':1,'tickets':1,'notes':1,'events':1,'orders':1},{'callback':function(rd){
$target.hideLoading();

if(app.model.responseHasErrors(rd)){
	app.u.throwMessage(rd);
	}
else	{
	//div that all panels are added to, then this div is appended to the dom. more efficient and allows for classes to be added.
	var panels = {
		'general' : {'index':0,'column':1},
		'wholesale' : {'index':0,'column':1},
		'giftcard' : {'index':1,'column':1},
		'newsletter' : {'index':2,'column':1},
		'tickets' : {'index':3,'column':1},
		'notes' : {'index':0,'column':2},
		'wallets' : {'index':1,'column':2},
		'addresses' : {'index':2,'column':2},
		'dropship' : {'index':3,'column':2}
		};
	
	$target.anycontent({'templateID':'customerEditorTemplate','data':app.data[rd.datapointer]});
	
	$("div.panel",$target).each(function(){
		var PC = $(this).data('app-role'); //panel content (general, wholesale, etc)
		$(this).data('cid',obj.CID).anypanel({'wholeHeaderToggle':false,'showClose':false,'state':'persistent','extension':'admin_customer','name':PC,'persistent':true});
		})
	
	}

	var sortCols = $('.twoColumn').sortable({  
		connectWith: '.twoColumn',
		handle: 'h2',
		cursor: 'move',
		placeholder: 'placeholder',
		forcePlaceholderSize: true,
		opacity: 0.4,
//the 'stop' below is to stop panel content flicker during drag, caused by mouseover effect for configuration options.
		stop: function(event, ui){
			$(ui.item).find('h2').click();
			sortCols.each(function(){console.log($(this).sortable( "toArray" ))})
//			console.log(' -> here.');
			}
		});
	
	$("input",$target).each(function(){
		$(this).off('change.trackChange').on('change.trackChange',function(){
			$(this).addClass('edited');
			$('.numChanges').text($('.edited',sortCols).length).parents('button').addClass('ui-state-highlight').button('enable');
			});
		});
	app.ext.admin.u.handleAppEvents($target);
	$("table.gridTable thead",$target).parent().anytable();
	$("[type='checkbox']",$target).parent().anycb();
//	$(".toggleMe",$target).buttonset();

							}},'mutable');
						app.model.dispatchThis('mutable');
						}
					else	{
						$target.anymessage({"message":"In admin_customer.a.showCustomerEditor, CID was not passed"});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_customer.a.showCustomerEditor, $target is blank or not an object."});
					}
				}
			
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			newsletters : function($tag,data)	{
				
				if(!app.data.appNewslettersList)	{$tag.anymessage({'message':'Unable to fetch newsletter list'})}
				else if(!app.data.appNewslettersList['@lists'])	{
					$tag.anymessage({'message':'You have not created any subscriber lists.'})
					}
				else	{
					var $f = $("<fieldset \/>"),
					L = app.data.appNewslettersList['@lists'].length;
					
					for(var i = 0; i < L; i += 1)	{
						$("<label \/>").append($("<input \/>",{'type':'checkbox','name':'list_'+app.data.appNewslettersList['@lists'][i].ID})).append(app.data.appNewslettersList['@lists'][i].NAME + " [prt: "+app.data.appNewslettersList['@lists'][i].PRT+"]").appendTo($f);
						}
					$f.appendTo($tag);
					}
				
				}
			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {}, //u [utilities]

		e : {
//use this on any delete button that is in a table row and that does NOT automatically delete, but just queue's it.
			'customerRowRemove' : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-circle-close"},text: false});
				$btn.off('click.customerAddressRemove').on('click.customerAddressRemove',function(event){
					event.preventDefault();
//if this class is already present, the button is set for delete already. unset the delete.
					if($btn.hasClass('ui-state-error'))	{
						$btn.removeClass('ui-state-error').parents('tr').removeClass('ui-state-error').find('button').each(function(){
							$(this).button('enable')
							}); //enable the other buttons
						$btn.button('enable');
						}
					else	{

						$btn.addClass('ui-state-error').parents('tr').addClass('ui-state-error').find('button').each(function(){
							$(this).button('disable')
							}); //disable the other buttons
						$btn.button('enable');

						}
					});
				},
//used for both addresses and wallets.
			'customerHandleIsDefault' : function($btn){
				$btn.button({icons: {primary: "ui-icon-check"},text: false});

				if($btn.closest('tr').data('_is_default') == 1)	{$btn.addClass('ui-state-highlight')}

				$btn.off('click.customerEditorSave').on('click.customerEditorSave',function(event){
					event.preventDefault();
					$btn.closest('table').find('button.ui-state-highlight').removeClass('ui-state-highlight'); //un-default the other buttons.
					$btn.addClass('ui-state-highlight'); //flag as default.
					});
				},


			'customerWalletDetail' : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-check"},text: false});

				$btn.off('click.customerWalletDetail').on('click.customerWalletDetail',function(event){
					event.preventDefault();
					});				
				},
			
			'customerAddressUpdate' : function($btn){
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				console.warn('action on customerAddressUpdate not complete');
				$btn.off('click.customerEditorSave').on('click.customerEditorSave',function(event){
					event.preventDefault();
					var $target = $('#addressUpdateModal');
					if($target.length)	{$target.empty()} //element already exists on DOM. just empty it.
					else	{
//address editor doesn't exist yet. create it.
						$target = $("<div \/>",{'id':'addressUpdateModal','title':'Edit Customer Address'}).appendTo('body');
						$target.dialog({'autoOpen':false,'width':500,'height':500,'modal':true});
						}

					$target.dialog('open');
					
					var CID = $btn.closest('.panel').data('cid'),
					type = $btn.closest("[data-address-type]").data('address-type'),
					index = Number($btn.closest('tr').data('obj_index'));
					
					if(CID && index >= 0 && type)	{
						$target.anycontent({'templateID':'customerAddressAddUpdateTemplate','showLoading':false,data:app.data['adminCustomerDetail|'+CID][type][index]});

						$("[name='SHORTCUT']",$target).attr('disabled','disabled').parent().append('not editable'); //once created, the shortcut is not editable.

						if(type == '@SHIP')	{
							$("[type='email']",$target).parent().empty().remove();
							}
						$target.append("add save button here");
						}
					else	{
						$target.anymessage({'message':'In admin_customer.e.customerAddressUpdate, unable to determine CID ['+CID+'] or address type ['+type+'] or address index ['+index+']',gMessage:true});
						}
					});
				},
//saves all the changes to a customer editor			
			'customerEditorSave' : function($btn)	{
				$btn.button();
console.warn('action on customerEditorSave not complete');
				$btn.off('click.customerEditorSave').on('click.customerEditorSave',function(event){
					event.preventDefault();
					alert('this will do something');
					});
				},

//run when searching the customer manager for a customer.
			'customerSearch' : function($btn){
				$btn.button({icons: {primary: "ui-icon-search"},text: false});
				$btn.off('click.customerSearch').on('click.customerSearch',function(event){
					event.preventDefault();

					var $parent = $btn.closest("[data-app-role='dualModeContainer']"),
					$form = $("[data-app-role='customerSearch']",$parent).first(),
					formObj = $form.serializeJSON(),
					$target = $('.dualModeListContent',$parent).first();
					
					$target.empty(); //make sure any previously open customers are cleared.
					$parent.showLoading("Searching for "+formObj.email);
//					app.u.dump(" -> formObj: "); app.u.dump(formObj);
					app.ext.admin.calls.adminCustomerSearch.init(formObj.email,{callback:function(rd){
						$parent.hideLoading();
						
$('.dualModeListMessaging',$parent).empty();
if(app.model.responseHasErrors(rd)){
	$parent.anymessage(rd);
	}
else	{
	if(app.data[rd.datapointer] && app.data[rd.datapointer].CID)	{
		app.ext.admin_customer.a.showCustomerEditor($target,{'CID':app.data[rd.datapointer].CID});
		}
	else	{
		$('.dualModeListMessaging',$parent).anymessage({'message':'No customers matched that email address. Please try again.<br />Searches are partition specific, so if you can not find this user on this partition, switch to one of your other partitions','persistant':true});
		}
	}
						}},'mutable');
					app.model.dispatchThis();

					});
				}
			} //e [app Events]
		} //r object.
	return r;
	}