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
Reports.js

In general, this will be used on what is the 'reports' tab.
In addition, there are some other places, such as utilities > ebay listings report, where it is used.


reference:
http://stackoverflow.com/questions/4639372/export-to-csv-in-jquery (toCSV)
https://gist.github.com/3782074 (toCSV - full)
https://developers.google.com/chart/interactive/docs/gallery/table#Formatters
http://gdatatips.blogspot.com/2009/07/create-new-google-docs-spreadsheet-from.html (build google drive spreadsheet via API)
*/



var admin_reports = function() {
	var theseTemplates = new Array('ebayListingsReportPageTemplate');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/reports.html',theseTemplates);
				app.rq.push(['script',0,'https://www.google.com/jsapi']); //used in ebay reports. likely everywhere else too.

				window.googleIntervalAttempts = 0;
				window.googleInterval = setInterval(function(){
					app.u.dump(" -> google interval attempt: "+googleIntervalAttempts);
					if(window.google && window.google.loader)	{
						google.load('visualization', '1.0', {'packages':['table']});
						clearInterval(window.googleInterval);
						delete window.googleInterval;
						delete window.googleIntervalAttempts;
						}
					else	{
						window.googleIntervalAttempts += 1;
						}
					},500);

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_reports.callbacks.init.onError');
				}
			}

		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
			
			showeBayListingsReport : function()	{
				var $content = $("#utilitiesContent");
				$content.empty().append(app.renderFunctions.createTemplateInstance('ebayListingsReportPageTemplate',{}));
				app.ext.admin.u.bringTabIntoFocus('utilities');
				app.ext.admin.u.bringTabContentIntoFocus($content);

				$('.datepicker',$content).datepicker({'dateFormat':'@'});
				$('.datepicker',$content).change(function(){$(this).val(parseInt($(this).val()) / 1000);}); //strip milliseconds from epoch

				app.ext.admin.u.handleAppEvents($content);
				}
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
//when a table header is clicked to change sort, the entire contents of the container (id) are rewritten.
//keep that in mind when and deciding what ID to pass in.
			drawTable : function(id,header,rows) {

				var data = new google.visualization.DataTable();
//				app.u.dump(" -> header:"); app.u.dump(header);
				for(index in header)	{
					data.addColumn('string',header[index]);
					}
				data.addRows(rows);
			
				var table = new google.visualization.Table(document.getElementById(id));
				table.draw(data, {showRowNumber: true});
				}
			}, //u

		e : {
			
			"ebayReportView" : function($btn)	{
				$btn.button();
				$btn.off('ebayReportCreate').on('click.ebayReportCreate',function(event){
					event.preventDefault();
					frmObj = $btn.parents('form').serializeJSON(),
					$content = $('#utilitiesContent')
					if(frmObj.batchid)	{}
					else	{delete frmObj.batchid}
					$content.showLoading();
					app.ext.admin.calls.adminDataQuery.init(frmObj,{callback: function(rd){
						if(app.model.responseHasErrors(rd)){
							app.u.throwMessage(rd);
							}
						else	{
							
							$content.hideLoading();
							if(app.data[rd.datapointer]['@ROWS'].length)	{
								$content.empty();
								$content.prepend($("<div \/>").addClass('ui-widget ui-widget-content ui-corner-all marginBottom alignRight buttonbar').append($("<button \/>")
									.text('Export to CSV')
									.click(function(){
										$('table',$content).toCSV();
									}).button()));
								$content.append($("<div \/>",{'id':'ebayListingsReportContainer'}));
								app.ext.admin_reports.u.drawTable('ebayListingsReportContainer',app.data[rd.datapointer]['@HEADER'],app.data[rd.datapointer]['@ROWS']);
								}
							else	{
								app.u.throwMessage("There were no results for your query.");
								}
							}
						}},'mutable');
					app.model.dispatchThis('mutable');
					});
				}
			
			}

		} //r object.
	return r;
	}