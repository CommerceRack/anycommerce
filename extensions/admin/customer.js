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
	var theseTemplates = new Array('customerSearchResultsTemplate','CustomerPageTemplate','customerEditorTemplate_general','customerEditorTemplate_wholesale','customerEditorTemplate_giftcard','customerEditorTemplate_newsletter','customerEditorTemplate_tickets','customerEditorTemplate_notes','customerEditorTemplate_wallets','customerEditorTemplate_addresses','customerEditorTemplate_dropship');
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
			
			showCustomerEditor : function($target,CID)	{
				
				if($target && typeof $target == 'object')	{
					if(CID)	{
						$target.showLoading("Fetching Customer Record");
						app.ext.admin.calls.adminCustomerDetail.init({'CID':CID},{'callback':function(rd){
$target.hideLoading();
if(app.model.responseHasErrors(rd)){
	app.u.throwMessage(rd);
	}
else	{
	//div that all panels are added to, then this div is appended to the dom. more efficient and allows for classes to be added.
	var $contents = $("<div \/>").addClass('customerEditor'),
	panels = {
		'general' : {'index':0,'column':1},
		'wholesale' : {'index':0,'column':1},
		'giftcard' : {'index':1,'column':1},
		'newsletter' : {'index':2,'column':1},
		'tickets' : {'index':3,'column':1},
		'notes' : {'index':0,'column':2},
		'wallets' : {'index':1,'column':2},
		'addresses' : {'index':2,'column':2},
		'dropship' : {'index':3,'column':2}
		},
	L = panels.length;
	
	var $cols = {};
	$cols.c1 = $("<div \/>").addClass('twoColumn').attr('data-app-column','1'),
	$cols.c2 = $("<div \/>").addClass('twoColumn').attr('data-app-column','2')


	
	for(var index in panels)	{
		$("<div \/>").anypanel({'header':index,'wholeHeaderToggle':false,'templateID':'customerEditorTemplate_'+index,'data':app.data[rd.datapointer],'showClose':false,'state':'persistent','extension':'admin_customer','name':index,'persistent':true}).appendTo($cols['c'+panels[index].column]);
		}
	$cols.c1.appendTo($contents);
	$cols.c2.appendTo($contents);
	$contents.appendTo($target);
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
		}).disableSelection();



							}},'mutable');
						app.model.dispatchThis('mutable');
						}
					else	{
						$target.anyMessage({"message":"In admin_customer.a.showCustomerEditor, CID was not passed"});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_customer.a.showCustomerEditor, $target is blank or not an object."});
					}
				}
			
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {}, //u [utilities]

		e : {
			'customerSearch' : function($btn){
				$btn.button({icons: {primary: "ui-icon-search"},text: false});
				$btn.off('click.customerSearch').on('click.customerSearch',function(event){
					event.preventDefault();

					var $parent = $btn.closest("[data-app-role='dualModeContainer']"),
					$form = $("[data-app-role='customerSearch']",$parent).first(),
					formObj = $form.serializeJSON();
					
					$parent.showLoading("Searching for "+formObj.email);
					app.u.dump(" -> formObj: "); app.u.dump(formObj);
					app.ext.admin.calls.adminCustomerSearch.init(formObj.email,{callback:function(){
						$parent.hideLoading();
						}},'mutable');
					app.model.dispatchThis();

					});
				}
			} //e [app Events]
		} //r object.
	return r;
	}