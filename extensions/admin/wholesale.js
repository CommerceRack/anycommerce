/* **************************************************************

   Copyright 2013 Zoovy, Inc.

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




var admin_wholesale = function() {
	var theseTemplates = new Array('wholesaleSupplierAddTemplate','wholesaleSupplierManagerTemplate','wholesaleSupplierListTemplate');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/wholesale.html',theseTemplates);
				var $wm = $("<div \/>",{'id':'wholesaleModal'}).appendTo('body'); //a recycleable element for modals.
				$wm.dialog({'autoOpen':false,'modal':true,'width':500,'height':500});
				
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION [a]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
			//smTarget (supply manager target) is the jquery object of where it should be placed, ususally a tab.
			showSupplierManager : function($smTarget)	{
				$smTarget.showLoading({'message':'Fetching supplier list'});
				
				app.ext.admin.calls.adminSupplierList.init({'callback':function(rd){
					$smTarget.hideLoading();
					if(app.model.responseHasErrors(rd)){app.u.throwMessage(rd);}
					else	{
						$smTarget.anycontent({'templateID':'wholesaleSupplierManagerTemplate','datapointer':rd.datapointer});
						app.ext.admin.u.handleAppEvents($smTarget);
						$("[app-data-role='wholesaleSupplierList']",$smTarget).anytable();
						}
					}},'mutable');
				app.model.dispatchThis('mutable');
				
				
				},
			
			showSupplierEditor : function($smeTarget) {},
			
			showSupplierCreateModal : function(){
				var $wm = $('#wholesaleModal')
				$wm.empty().dialog('open').anycontent({'templateID':'wholesaleSupplierAddTemplate','showLoading':false});
				app.ext.admin.u.handleAppEvents($wm);
				}
			}, //a [actions]

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {

			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			}, //u [utilities]

////////////////////////////////////   EVENTS [e]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\                    

		e : {
			showSupplierCreate : function($btn)	{
				$btn.button();
				$btn.off('click.showSupplierCreate').on('click.showSupplierCreate',function(){
					app.ext.admin_wholesale.a.showSupplierCreateModal();
					})
				},

			showSupplierEditor : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				$btn.off('click.showSupplierEditor').on('click.showSupplierEditor',function(){
					alert('Not done. needs to open editor.');
					});
				},

			execSupplierDelete : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-circle-close"},text: false});
				$btn.off('click.execSupplierDelete').on('click.execSupplierDelete',function(){
					alert('Not done. needs to open confirmation modal.');
					});
				}
			} //e [app Events]

		} //r object.
	return r;
	}