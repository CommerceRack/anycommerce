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
An extension for managing the media library in addition to ALL other file uploads,including, but not limited to: csv and zip.
*/



var admin_support = function() {
	var theseTemplates = new Array('supportFileUploadTemplate');
	var r = {

////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	calls : {
		
		adminTicketFileAttach : {
			init : function(obj,tagObj)	{
				this.dispatch(obj,tagObj);
				},
			dispatch : function(obj,tagObj)	{
				var obj = obj || {};
				obj['_tag'] = tagObj || {};
				obj._tag.datapointer = "adminTicketFileAttach|"+obj.ticket;
				obj['_cmd'] = "adminTicketFileAttach";
				app.model.addDispatchToQ(obj,'immutable');	
				}
			} //adminNavcatProductDelete
		
		}, //calls




////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/support.html',theseTemplates);

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}, //init
		
		handleAdminTicketFileAttach : {
			onSuccess : function(tagObj){
				app.u.dump("Got Here!");
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
			showFileUploadInModal : function(ticketid){
				if(ticketid)	{
					var $target = $('#ticketFileUploadModal');
	//To avoid confusion (like showing uploads from a previously edited ticket) the file upload div is emptied and the entire contents regenerated afresh.
					if($target.length){$target.empty();}
					else	{
						$target = $("<div \/>").attr('id','ticketFileUploadModal').appendTo('body');
						$target.dialog({'autoOpen':false,'width':'90%','height':550});
						}
					$target.attr('data-ticketid',ticketid);
					$('.ui-dialog-title',$target.parent()).text("File upload for ticket "+ticketid);
					$target.append(app.renderFunctions.transmogrify({},'supportFileUploadTemplate',{'ticketid':ticketid})).dialog('open');
					$('#supportFileUploadForTicket').append("<input type='hidden' name='domain' value='"+app.vars.domain+"' \/>"); //file upload wants domain specified.
					app.ext.admin_medialib.u.convertFormToJQFU('#supportFileUploadForTicket','adminTicketFileAttach');
					
					}
				else	{
					app.u.throwGMessage("Warning! no ticketid specified in admin_support.a.showFileUploadInModal");
					}
				
				}
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {} //u


		} //r object.
	return r;
	}