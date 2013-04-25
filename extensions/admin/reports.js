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
	var theseTemplates = new Array('ebayListingsReportPageTemplate','KPIGraphAddEditTemplate');
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
				},

//currently supported modes are:  add or edit
			showKPIAddEditInModal : function(mode,vars)	{
				vars = vars || {};
//error checking...
				if(mode)	{
					if((mode == 'edit' && vars.uuid) || mode == 'add')	{
//by now, we know we have a valid mode and if that mode is edit, uuid is set.
						$D = $("<div \/>").attr('title',(mode == 'edit') ? "Edit Graph" : "Add a New Graph");
//guid created at time modal is open. that way the guid of an edit can be added in same way and save button won't care if it's an edit or add.
						$D.attr('data-uuid',(mode == 'edit') ? vars.uuid : app.u.guidGenerator()).addClass('displayNone').appendTo('body'); 
						$D.dialog({
							modal: true,
							width: '90%',
							autoOpen: false,
							height : ($(window).height() > 550) ? 500 : ($(window).height() - 100), //accomodate small browsers/mobile devices.
							close: function(event, ui)	{
								$(this).dialog('destroy').remove();
								}
							});
						$D.anycontent({'templateID':'KPIGraphAddEditTemplate','data':vars});
						$D.dialog('open');

						$( "ul.kpiSortable",$D).sortable({
							connectWith: "ul.kpiSortable",
							placeholder: "ui-state-highlight",
							stop: function( event, ui ) {
//once a data axis is chosen, grouping is locked.
								if($("[data-app-role='dataSetAxisList']",$D).children().length)	{
									$("[name='datasetGrp']",$D).attr('disabled','disabled'); 
									}
//unlock data axis if no children so a user can change their mind.
								else	{
									$("[name='datasetGrp']",$D).attr('disabled','').removeAttr('disabled');
									}
								}
							});

						$('.toolTip',$D).tooltip();
//once a graph is in a collection, it stays there.
						if(mode == 'edit')	{
							$("[name='collection']").attr('disabled','disabled');
							}
						app.ext.admin.u.handleAppEvents($D);
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_reports.a.showKPIAddEditInModal, either mode is invalid ['+mode+'] (must be edit or add) or mode is edit and no uuid passed.','gMessage':true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_reports.a.showKPIAddEditInModal, mode not specified.','gMessage':true});
					}
			
				} //showKPIAddInModal

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
			
			addTriggerKPIDatasetChange : function($select)	{
				var $form = $select.closest('form');
				$select.off('change.addTriggerKPIDatasetChange').on('change.addTriggerKPIDatasetChange',function(){
					if($select.val())	{
						$("[data-app-role='axisChooser']",$form).show();
						}
					else	{
						$("[data-app-role='axisChooser']",$form).hide();
						}
					});
				}, //addTriggerKPIDataColumnsChange
			addTriggerKPIDataColumnsChange : function($radio)	{
				var $form = $radio.closest('form');
				$radio.off('click.addTriggerKPIDataColumnsChange').on('click.addTriggerKPIDataColumnsChange',function(){

					var val = $radio.val();
					$("[data-app-role='datasetTypeContainer']",$form).show();
					
					if(val == 'fixed')	{
						$("[data-app-role='fDatasetContainer']",$form).show();
						$("[data-app-role='dDatasetContainer']",$form).hide();
						
						}
					else if(val == 'dynamic')	{
						$("[data-app-role='fDatasetContainer']",$form).hide();
						$("[data-app-role='dDatasetContainer']",$form).show();
						$("[data-app-role='axisChooser']",$form).hide();
						}
					else	{
						//throw warning. unrecognized data
						}

					});
				},	//addTriggerKPIDataColumnsChange		
			addTriggerKPIGraphTypeChange : function($select)	{
				var $form = $select.closest('form');
				$select.off('change.addTriggerKPIGraphTypeChange').on('change.addTriggerKPIGraphTypeChange',function()	{
					$("[data-app-role='graphTypePreview']",$form).show();
					$("[data-app-role='graphTypePreview'] img",$form).attr('src','images/kpi/'+$select.val()+'-300x104.png');
					$("[data-app-role='graphTypePreview'] .graphType",$form).text($select.val().replace('.',' '));
					});
				}, //addTriggerKPIGraphTypeChange
			addTriggerKPIPeriodChange : function($select)	{
				var $form = $select.closest('form');
				$select.off('change.addTriggerKPIPeriodChange').on('change.addTriggerKPIPeriodChange',function(){

					var val = $select.val();
				//grouping is disabled till a period is chosen.
					$("[name='grpby']",$form).attr('disabled','').removeAttr('disabled');
					$("[name='grpby']",$form).val(''); //unselect the grouping
				//in case period is changed from day to week, clear all disables so previously locked options are available.
					$("option","#KPIGraphBuilder [name='grpby']").attr('disabled','').removeAttr('disabled');
				
				//some general rules for option disabling.
					if(val.indexOf('day') >= 0)	{
						$("[value='week'], [value='month'], [value='quarter']","#KPIGraphBuilder [name='grpby']").attr('disabled','disabled');
						}
					else if(val.indexOf('week') >= 0)	{
						$("[value='month'], [value='quarter']","#KPIGraphBuilder [name='grpby']").attr('disabled','disabled');
						}
					else if(val.indexOf('month') >= 0)	{
						$("[value='quarter']","#KPIGraphBuilder [name='grpby']").attr('disabled','disabled');
						}
					else	{
						
						}
				
				//more specific rules
				//need more than one days data to group by day of week.
					if(val == 'day.today' || val == 'day.yesterday')	{
						$("[value='dow']","#KPIGraphBuilder [name='grpby']").attr('disabled','disabled');
						}
				//need more than one weeks data to group by week.
					if(val == 'week.this' || val == 'week.tly' || val == 'week.last')	{
						$("[value='week']","#KPIGraphBuilder [name='grpby']").attr('disabled','disabled');
						}	
				//need more than one months data to group by month.
					if(val == 'month.this' || val == 'month.tly' || val == 'month.last')	{
						$("[value='month']","#KPIGraphBuilder [name='grpby']").attr('disabled','disabled');
						}

					});
				}, //addTriggerKPIPeriodChange
			
			execAdminKPIDBCollectionUpdate : function($btn)	{
//				$btn.button();
//A new graph save or even an existing graph update does NOT save individually. The entire collection must be updated.

				},
			
			ebayReportView : function($btn)	{
				$btn.button();
				$btn.off('ebayReportCreate').on('click.ebayReportCreate',function(event){
					event.preventDefault();
					frmObj = $btn.parents('form').serializeJSON(),
					$content = $('#utilitiesContent')
					if(frmObj.batchid)	{}
					else	{delete frmObj.batchid}
					$content.showLoading();
					app.ext.admin.calls.adminDataQuery.init(frmObj,{callback: function(rd){
						$content.hideLoading();
						if(app.model.responseHasErrors(rd)){
							app.u.throwMessage(rd);
							}
						else	{
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
				} //ebayReportView
			
			} //E / Events

		} //r object.
	return r;
	}