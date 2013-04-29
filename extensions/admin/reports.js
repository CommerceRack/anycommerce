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
	var theseTemplates = new Array('ebayListingsReportPageTemplate','KPIManagerPageTemplate','KPIGraphAddUpdateTemplate','KPICollectionListTemplate','KPICollectionOptionTemplate');
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


			showKPIInterface : function()	{
				
				var $KPI = $('#kpiContent').empty();
				$KPI.anycontent({'templateID':'KPIManagerPageTemplate','showLoadingMessage':'Fetching list of collections'});
				app.ext.admin.calls.adminKPIDBUserDataSetsList.init({},'mutable');
				app.ext.admin.calls.adminKPIDBCollectionList.init({'callback':function(rd){
					$KPI.hideLoading();
					if(app.model.responseHasErrors(rd)){
							app.u.throwMessage(rd);
							}
						else	{
							$("[data-app-role='slimLeftNav']",$KPI).anycontent({'datapointer':rd.datapointer});
							app.u.handleAppEvents($KPI);
							}
					}},'mutable');
				app.model.dispatchThis();
				},

//currently supported modes are:  add or edit
			showKPIAddEditInModal : function(mode,vars)	{
				vars = vars || {};
//error checking...
				if(mode)	{
					if((mode == 'edit' && vars.uuid) || mode == 'add')	{
//by now, we know we have a valid mode and if that mode is edit, uuid is set.
						var $D = $("<div \/>").attr('title',(mode == 'edit') ? "Edit Graph" : "Add a New Graph");
//guid created at time modal is open. that way the guid of an edit can be added in same way and save button won't care if it's an edit or add.
						$D.attr('data-uuid',(mode == 'edit') ? vars.uuid : app.u.guidGenerator()).addClass('displayNone').appendTo('body');
						$D.dialog({
							modal: true,
							width: '90%',
							autoOpen: false,
							height : ($(window).height() - 100), //accomodate small browsers/mobile devices.
							close: function(event, ui)	{
								$(this).dialog('destroy').remove();
								}
							});
//							app.u.dump(" -> extended: ");
//							app.u.dump($.extend(true,vars,app.data['adminKPIDBCollectionList'],app.data['adminKPIDBUserDataSetsList']));
						$D.anycontent({'templateID':'KPIGraphAddUpdateTemplate','data':$.extend(true,vars,app.data['adminKPIDBCollectionList'],app.data['adminKPIDBUserDataSetsList']),'dataAttribs':{'app-mode':mode}});
						$D.dialog('open');

						$( "ul.kpiSortable",$D).sortable({
							connectWith: "ul.kpiSortable",
							placeholder: "ui-state-highlight",
							stop: function( event, ui ) {
//once a data axis is chosen, grouping is locked.
								if($("[data-app-role='dataSetAxisListSelected']",$D).children().length)	{
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

		renderFormats : {
			
			collectionAsOptions : function($tag,data)	{
				$tag.text(data.value.TITLE).val(data.value.ID);
				}
			
			}, //renderFormats
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
				}, //drawTable
			
			getDatasetAxisByTypeAsListItems : function(type)	{
				if(type && app.data.adminKPIDBUserDataSetsList && app.data.adminKPIDBUserDataSetsList['@DATASETS'])	{
					var $ul = $("<ul \/>"),
					DS = app.data.adminKPIDBUserDataSetsList['@DATASETS'], //shortcut
					L = DS.length
					
					for(var i = 0; i < L; i += 1)	{
						if(DS[i][0] == type)	{$("<li \/>").data({
							'group' : DS[i][0],
							'dataset' : DS[i][1],
							'pretty' : DS[i][2]
							}).text(DS[i][2]).appendTo($ul)}
						}
					
					}
				else if(!type)	{
					$('.appMessaging').anymessage({'message':'In admin_reports.u.getDatasetAxisByTypeAsListItems, type not passed.','gMessage':true});
					}
				else	{
					$('.appMessaging').anymessage({'message':'In admin_reports.u.getDatasetAxisByTypeAsListItems, app.data.adminKPIDBUserDataSetsList not set.','gMessage':true});
					}
				return ($ul.children().length) ? $ul.children() : false;
				},
			
			validateAddUpdateCollectionForm : function($form,sfo)	{

				var r = true; //what is returned. boolean.
				
				if($form && sfo)	{
					
					//handle the basic validation.
					if(app.u.validateForm($form))	{}
					else	{r = false;} //validateForm handles error display
					
					
					if(sfo.dataColumns)	{
//the column interface doesn't show up till data columns selection is made, so any error displayed before then could be confusing.
						if(sfo.column)	{}
						else	{
							$('.appMessaging').anymessage({'message':'Please choose a value for data.'});
							r = false
							}						
						
					//'fixed' datacolumns requires the user to select data points. The interface for the axis data points is NOT a form input, but draggable list items.
						if(sfo.dataColumns == 'fixed')	{
							sfo.datasetGrp = $("[name='datasetGrp']",$form).val(); //can't use sfo because once 'disabled' set, sfo doesn't add field to sfo object.
							if(sfo.datasetGrp && $("[data-app-role='dataSetAxisListSelected']",$form).children().length)	{}
							else if(!sfo.datasetGrp)	{
								r = false;
								$('.appMessaging').anymessage({'message':'Please choose the dataset.'});
								}
							else if(!$("[data-app-role='dataSetAxisListSelected']",$form).children().length)	{
								r = false;
								$('.appMessaging').anymessage({'message':'Please add at least one axis point to the list of selected axis points.'});
								}
							else	{
								//unknown error! Don't fail, but report.
								$('.appMessaging').anymessage({'message':'An unknown error occured. Reached the else in datasetGrp validation. Will attempt to proceed.'});
								}
							}
					//ddataset isn't set to required because it would return a false negative on validation if 'fixed' was data column selection.
						else if(sfo.dataColumns == 'dynamic')	{
							if(sfo.ddataset)	{}
							else	{
								r = false;
								$('.appMessaging').anymessage({'message':'Please choose a data source.'});
								}
							}
						else	{
							r = false;
							$('.appMessaging').anymessage({'message':'Invalid value selected for data columns. Only dynamic or fixed is supported.'});
							}
						}
					else	{
						r = false;
						$('.appMessaging').anymessage({'message':'Please choose a value for data columns.'});
						}
					
//					app.u.dump("sfo: "); app.u.dump(sfo);

					}
				else	{
					r = false;
					$('.appMessaging').anymessage({'message':'In admin_reports.u.validateAddUpdateCollectionForm, $form and/or sfo were not passed.','gMessage':true});
					}
				
				return r;

				} //validateAddUpdateCollectionForm
			}, //u

		e : {

			addTriggerKPICollectionList : function($ele)	{
				$ele.off('click.addTriggerKPICollectionList').on('click.addTriggerKPICollectionList',function(){
					var $parent = $ele.closest(".slimLeftContainer"),
					$content = $("[data-app-role='slimLeftContent']",$parent).first();
					$content.empty().showLoading({'message':'Fetching list of graphs'});
					app.ext.admin.calls.adminKPIDBCollectionDetail.init($ele.data('id'),{'callback':function(rd){
						$content.hideLoading();
						if(app.model.responseHasErrors(rd)){app.u.throwMessage(rd);}
						else	{
							//get detail for each graph
							}
						}},'mutable');
					app.model.dispatchThis('mutable');
					});
				},
			
			showChartAdd : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-circle-plus"},text: true});
				$btn.off('click.showChartAdd').on('click.showChartAdd',function(){
					app.ext.admin_reports.a.showKPIAddEditInModal('add',{});
					});
				}, //showChartAdd
			//NOT DONE.
			showAdminKPIDBCollectionCreate : function($btn)	{
				$btn.button();
				$btn.off('click.showAdminKPIDBCollectionCreate').on('click.showAdminKPIDBCollectionCreate',function(){

//by now, we know we have a valid mode and if that mode is edit, uuid is set.
					$D = $("<div \/>").attr('title',"Add a New Collection");
//guid created at time modal is open. that way the guid of an edit can be added in same way and save button won't care if it's an edit or add.
					$D.addClass('displayNone').appendTo('body'); 
					$D.dialog({
						modal: true,
						width: ($(window).width() > 300) ? 300 : ($(window).width() - 50),
						autoOpen: false,
						height : ($(window).height() > 250) ? 250 : ($(window).height() - 50), //accomodate small browsers/mobile devices.
						close: function(event, ui)	{
							$(this).dialog('destroy').remove();
							},
						buttons: [ 
							{ text: "Add Collection", click: function() {
								var val = $('#newCollectionName').val();
								if(val)	{
									app.ext.admin.calls.adminKPIDBCollectionCreate.init({'uuid':app.u.guidGenerator(),'title':val},{callback : function(rd){
										if(app.model.responseHasErrors(rd)){
											$('.appMessaging').anymessage({'message':rd,'gMessage':true});
											}
										else	{
											$D.text("Your collection was created.");
											}
										}},'immutable');
									app.model.destroy('adminKPIDBCollectionList');
									app.ext.admin.calls.adminKPIDBCollectionList.init({},'immutable');
									app.model.dispatchThis('immutable');
									}
								else	{
									$('.appMessaging').anymessage({'message':"Please enter a collection name."});
									}
								}}
							]
						});
					$D.append($("<div \/>").addClass('appMessaging'));
					$D.append($("<input \/>",{'type':'text','placeholder':'collection name','id':'newCollectionName'}));
					$D.dialog('open');

					});
				}, //showAdminKPIDBCollectionCreate
			
			addTriggerKPIDatasetChange : function($select)	{
				var $form = $select.closest('form');
				$select.off('change.addTriggerKPIDatasetChange').on('change.addTriggerKPIDatasetChange',function(){
					if($select.val())	{
						$("[data-app-role='axisChooser']",$form).show();
						$("[data-app-role='dataSetAxisListAll']",$form).empty().append(app.ext.admin_reports.u.getDatasetAxisByTypeAsListItems($select.val()));
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

					var val = $select.val(),
					$groupby = $("[name='grpby']",$form);
					
				//grouping is disabled till a period is chosen.
					$groupby.attr('disabled','').removeAttr('disabled');
					$groupby.val(''); //unselect the grouping
				//in case period is changed from day to week, clear all disables so previously locked options are available.
					$("option",$groupby).attr('disabled','').removeAttr('disabled');
				
				//some general rules for option disabling.
					if(val.indexOf('day') >= 0)	{
						$("[value='week'], [value='month'], [value='quarter']",$groupby).attr('disabled','disabled');
						}
					else if(val.indexOf('week') >= 0)	{
						$("[value='month'], [value='quarter']",$groupby).attr('disabled','disabled');
						}
					else if(val.indexOf('month') >= 0)	{
						$("[value='quarter']",$groupby).attr('disabled','disabled');
						}
					else	{

						}
				
				//more specific rules
				//need more than one days data to group by day of week.
					if(val == 'day.today' || val == 'day.yesterday')	{
						$("[value='dow']",$groupby).attr('disabled','disabled');
						}
				//need more than one weeks data to group by week.
					if(val == 'week.this' || val == 'week.tly' || val == 'week.last')	{
						$("[value='week']",$groupby).attr('disabled','disabled');
						}	
				//need more than one months data to group by month.
					if(val == 'month.this' || val == 'month.tly' || val == 'month.last')	{
						$("[value='month']",$groupby).attr('disabled','disabled');
						}

					});
				}, //addTriggerKPIPeriodChange
//executed as part of the save/update interface 'save' button.
			execAdminKPIDBCollectionUpdate : function($btn)	{
				$btn.button();
//A new graph save or even an existing graph update does NOT save individually. The entire collection must be updated.
var $context = $btn.closest("[data-app-role='KPIGraphAddUpdate']"),
mode = $context.data('app-mode'),
$form = $btn.closest('form');




$btn.off('click.execAdminKPIDBCollectionUpdate').on('click.execAdminKPIDBCollectionUpdate',function(){
	if(mode)	{
		if(mode == 'add' || mode == 'update')	{
			var sfo = $form.serializeJSON();
			if(app.ext.admin_reports.u.validateAddUpdateCollectionForm($form,sfo))	{
//				app.u.dump("woot! we have everything we need. now do something");
//By this point, all the data required to add or update a chart is present.
//now get all the data formatted properly. Once that's done, mode will determine the next course of action.

				var addObject = {
					'grpby' : sfo.grpby,
					'column' : sfo.column,
					'period' : sfo.period,
					'@datasets' : new Array()
					};

				if(sfo.dataColumns == 'fixed')	{
					$("[data-app-role='dataSetAxisListSelected']",$form).children().each(function(){
						addObject['@datasets'].push($(this).data('dataset'));
						});
					}
				else if(sfo.dataColumns == 'dynamic')	{
					addObject['@datasets'].push(sfo.ddataset);
					}
				else	{} //should never get here. validation makes sure dataColumns is fixed or dynamic.

// need to fetch the collection list detail to make sure it's present. The callback for that will include appending this new chart to the collection.
// Then, update the collection and fetch a clean copy. If the KPI page is visible AND the collection in question is open, update the view.
				
				app.u.dump(" -> All data for creating a new chart is present.  proceed....");
				
//make sure we have a copy of the collection. most likely, what's in memory (if already here) is up to date, so no need to destroy.
				app.ext.admin.calls.adminKPIDBCollectionDetail.init(sfo.collection,{
					callback : function(rd)	{
						app.u.dump("BEGIN inline callback on adminKPIDBCollectionDetail _cmd for adding a new chart.");
						if(app.model.responseHasErrors(rd)){
							$('.appMessaging').anymessage({'message':rd,'gMessage':true});
							}
						else	{
							var graphs = [];
							//if there are already graphs in this collection, add then to graphs array as the update is destructive and ALL graphs need to be present.
							if(app.data[rd.datapointer]['@GRAPHS'])	{
								graphs = app.data[rd.datapointer]['@GRAPHS'];
								}
							graphs.push(addObject);
							
							app.model.destroy(rd.datapointer);
							app.ext.admin.calls.adminKPIDBCollectionUpdate.init({'uuid':sfo.collection,'@GRAPHS':graphs},{},'immutable');
							app.ext.admin.calls.adminKPIDBCollectionDetail.init(sfo.collection,{},'immutable');//make sure collection is udpated in localstorage and memory
							app.model.dispatchThis('immutable');
							
							}
						}
					},'immutable');
				app.model.dispatchThis('immutable');
				
				
				}
			else	{} //validateAddUpdateCollectionForm handles error display.
			}
		else	{
			$('.appMessaging').anymessage({'message':'In admin_reports.e.execAdminKPIDBCollectionUpdate, unsupported mode ['+mode+'] set.','gMessage':true});
			}
		}
	else	{
		$('.appMessaging').anymessage({'message':'In admin_reports.e.execAdminKPIDBCollectionUpdate, unable to determine mode.','gMessage':true});
		}	
	});




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