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
	var theseTemplates = new Array('reportsPageTemplate','ebayListingsReportPageTemplate','KPIManagerPageTemplate','KPIGraphAddUpdateTemplate','KPICollectionListTemplate','KPICollectionOptionTemplate','KPICollectionEditorTemplate','KPICollectionEditorRowTemplate','reportsRowTemplate');
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
//					app.u.dump(" -> google interval attempt: "+googleIntervalAttempts);
					if(window.google && window.google.loader)	{
						google.load('visualization', '1.0', {'packages':['table']});
						clearInterval(window.googleInterval);
						delete window.googleInterval;
						delete window.googleIntervalAttempts;
						}
					else if(window.googleIntervalAttempt > 50)	{
						app.u.dump("Unable to load google visualization. ",'error');
						$(".appMessaging").anymessage({'message':'The Google Visualization libraries did not successfully load. This means that some features in the reporting section may not be available. Refreshing the browser may help solve this error.','persistent':true});
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
			
		
			showReportsPage : function($target)	{
				$target.empty();
				$target.anycontent({'templateID':'reportsPageTemplate',data:{}});
				app.u.handleAppEvents($target);
				
				$("[data-app-role='reportsTabsContainer']",$target).anytabs();
				$('.toolTip',$target).tooltip();
				$('.datepicker',$target).datepicker({
					changeMonth: true,
					changeYear: true,
					dateFormat : "@"
					});

			
				var $reportsList = $("[data-app-role='recentReportsList']",$target);
				$reportsList.showLoading({'message':'Fetching Recently Run Reports'});
				app.model.addDispatchToQ({
					'_cmd':'adminBatchJobList',
					'_tag':	{
						'datapointer' : 'adminBatchJobList',
						'callback':function(rd){
							$reportsList.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$reportsList.anymessage({'message':rd});
								}
							else	{
								var reports = new Array(), //used to store a small portion of the batch list. 10 reports.
								L = app.data[rd.datapointer]['@JOBS'].length - 1;
		//reports are in chronological order, oldest to newest. here, we want to show the ten newest.
								for(var i = L; i >= 0; i -= 1)	{
									if(app.data[rd.datapointer]['@JOBS'][i].BATCH_EXEC == 'REPORT')	{
										reports.push(app.data[rd.datapointer]['@JOBS'][i]);
										}
									else	{}
									if(reports.length >= 10)	{break} //only need ten.
									}
								
		//						app.u.dump("$reportsList.length: "+$reportsList.length);
								if(reports.length)	{
									$reportsList.anycontent({data:{'@JOBS': reports}});
									app.u.handleAppEvents($reportsList);
									$('table',$reportsList).anytable();
									}
								}
							}
						}
					},'mutable');

				//fetch a list of pre-defined jobs that the merchant can quickly re-execute.
				app.model.addDispatchToQ({
					'_cmd':'adminBatchJobParametersList',
					'_tag':	{
						'datapointer' : 'adminBatchJobParametersList',
						'callback': function(rd)	{
							if(app.model.responseHasErrors(rd)){
								$('#globalMessaging').anymessage({'message':rd});
								}
							else	{
								$target.anydelegate();
								var
									data = app.data[rd.datapointer]['@PARAMETERS'];
//* 201338 -> better handling if no parameters are returned.
									if(typeof data == 'object')	{
										var L = data.length,
										$skuReports = $("[data-app-role='inventoryReportsCustomContainer_sku']:first",$target),
										$invReports = $("[data-app-role='inventoryReportsCustomContainer_inventory']:first",$target);
							
										function display(job){
											return "<p data-app-role='batchContainer'><a href='#' onClick=\"app.ext.admin_batchJob.a.adminBatchJobCreate({'parameters_uuid':'"+job.UUID+"','type':'"+job.BATCH_EXEC+"'}); return false;\">"+job.TITLE+"</a><br>(last run: "+job.LASTRUN_TS+")<br><a href='#' data-app-click='admin_batchJob|adminBatchJobParametersRemoveConfirm' data-uuid='"+job.UUID+"'>Remove<\/a><\/p>"
											}

										for(var i = 0; i < L; i += 1)	{
											if(data[i].BATCH_EXEC == 'REPORT/SKU')	{
												$skuReports.append(display(data[i]));
												}
											else if(data[i].BATCH_EXEC == 'REPORT/INVENTORY'){
												$invReports.append(display(data[i]));
												}
											else	{}
											}
										}
									else	{
										//no @parameters/predefined jobs.  that's ok. no error message or anything of that nature is necessary.
										}
								}
							},
						'jqObj' : $("[data-anytab-content='inventoryReports']:first",$target)
						}
					},'mutable');
				
				app.model.dispatchThis('mutable');
				
				},
			
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
							$('#globalMessaging').anymessage({'message':rd,'gMessage':true});
							}
					else	{
						$("[data-app-role='slimLeftNav']",$KPI).anycontent({'datapointer':rd.datapointer});
						app.u.handleAppEvents($KPI);
						$("[data-app-role='slimLeftNav'] ul li:first",$KPI).trigger('click');
						}
					}},'mutable');
				app.model.dispatchThis();
				},
				

//currently supported modes are:  add or edit
			showKPIAddUpdateInModal : function(mode,vars)	{
//				app.u.dump("BEGIN admin_reports.a.showKPIAddUpdateInModal");
//				app.u.dump(' -> vars: '); app.u.dump(vars);
				vars = vars || {};
//error checking...
				if(mode)	{
					if((mode == 'update' && vars.uuid) || mode == 'add')	{
//by now, we know we have a valid mode and if that mode is update, uuid is set.
						var $D = $("<div \/>").attr('title',(mode == 'update') ? "Update Graph" : "Add a New Graph");
						$D.addClass('displayNone').appendTo('body');
						$D.dialog({
							modal: true,
							width: '90%',
							autoOpen: false,
							height : ($(window).height() - 100), //accomodate small browsers/mobile devices.
							close: function(event, ui)	{
								$(this).dialog('destroy').remove();
								}
							});
// the blank {} in the first object list is so that the rest of the data is copied into a new, blank object. otherwise, the data gets copied into the first object... which would be bad.  Dogs and cats living together bad. all the data would get copied into the collectionDetail datapointer.
						$D.anycontent({'templateID':'KPIGraphAddUpdateTemplate','data':$.extend(true,{},vars,app.data['adminKPIDBCollectionList'],app.data['adminKPIDBUserDataSetsList']),'dataAttribs':{'app-mode':mode}});
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
//collection could be passed in an 'add' mode if adding from a collection.
//will also be set in update mode. graphs can not be moved between collections.
						if(vars.collection)	{
							$("[name='collection']",$D).val(vars.collection).parent().hide(); //can't use data-bind because options are added after the select
							}

						app.ext.admin.u.handleAppEvents($D);
						
						if(mode == 'update')	{
							app.u.dump(" -> in graph update mode.");
							$("[name='period']",$D).trigger('change');
							$(":radio[value='"+vars.dataColumns+"']",$D).trigger('click');
							
							if(vars.dataColumns == 'fixed')	{
//								app.u.dump(" -> Data columns are fixed.");
								$("[name='datasetGrp']",$D).trigger('change');
								var $selectedUL	 = $("[data-app-role='dataSetAxisListSelected']",$D);
								
								$("[data-app-role='dataSetAxisListAll'] li",$D).each(function(){
									var $li = $(this);
									if(vars['@datasets'].indexOf($li.data('dataset')) >= 0)	{
										app.u.dump("match!");
										$li.appendTo($selectedUL);
										}
									})
								}
							else if(vars.dataColumns == 'dynamic')	{} //currently, no action occurs on select change.
							else	{}  //unsupported dataColumns type.
							
							}
						
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin_reports.a.showKPIAddUpdateInModal, either mode is invalid ['+mode+'] (must be update or add) or mode is update and no uuid passed.','gMessage':true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_reports.a.showKPIAddUpdateInModal, mode not specified.','gMessage':true});
					}
		
				}, //showKPIAddInModal

			showKPICollectionEditor : function($target,collection)	{
				if($target && collection){
					
					$target.empty().showLoading({'message':'Fetching collection details'})
					
					app.ext.admin.calls.adminKPIDBCollectionDetail.init(collection,{'callback':function(rd){
						$target.hideLoading();
						if(app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd,'gMessage':true});
							}
						else	{
							
							$target.anycontent({'templateID':'KPICollectionEditorTemplate','datapointer':rd.datapointer,'dataAttribs':{'collection':collection}});
							var $table = $('.gridTable',$target);
							$table.anytable().sortable({
								'items':'tr',
								stop: function( event, ui ) {
									var graphs = new Array();
									var result = $(this).sortable('toArray', {attribute: 'data-uuid'});
									for(var index in result)	{
//toArray is returning a blank in the zero spot sometimes, so only push it on if index has a value.
										if(result[index])	{graphs.push(app.ext.admin_reports.u.getGraphByUUID(app.data[rd.datapointer]['@GRAPHS'],result[index]));}
										}
									app.u.dump(result);
									app.u.dump(graphs);
									app.ext.admin.calls.adminKPIDBCollectionUpdate.init({'uuid':collection,'@GRAPHS':graphs},{},'passive');
									app.model.destroy(rd.datapointer); //this is the collection detail.
									app.ext.admin.calls.adminKPIDBCollectionDetail.init(collection,{},'passive');
									app.model.dispatchThis('passive');
									}
								});
							app.u.handleAppEvents($target);
							}
						}
					},'mutable');
					app.model.dispatchThis('mutable');
					
					
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_reports.a.showKPICollectionEditor, either $target ['+typeof $target+'] or collection ['+collection+'] not passed','gMessage':true});
					}
				},

			showKPICollectionTitleChange : function(collection,$context)	{
				if(collection)	{
					var $D = $("<div \/>").attr('title',"Rename Collection");
					$D.addClass('displayNone').appendTo('body');
					$D.dialog({
						modal: true,
						width: ($(window).width() < 300) ? '95%' : 300,
						autoOpen: false,
						height : ($(window).height() < 300) ? ($(window).height() - 50) : 300, //accomodate small browsers/mobile devices.
						close: function(event, ui)	{
							$D.dialog('destroy').empty().remove();
							},
						buttons: [ 
							{text: 'Cancel', click: function(){$D.dialog('close')}}							
							]
						});
					
					
					$D.dialog('open');
					$D.parent().showLoading({'message':'Fetching collection details'}); //parent used to buttons are encompased.
					
					app.ext.admin.calls.adminKPIDBCollectionDetail.init(collection,{'callback':function(rd){
						$D.parent().hideLoading();
						if(app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd,'gMessage':true});
							}
						else	{
							var buttons = $D.dialog( "option", "buttons" );
							buttons.push({text: "Save Changes", click: function() {
								var CD = {}; //Collection Detail
								CD['@GRAPHS'] = app.data[rd.datapointer]['@GRAPHS'] || [];
								CD.title = $('#collectionTitle',$D).val();
								CD.uuid = collection;
								$D.parent().showLoading({'message':'Updating collection'});
								app.ext.admin.calls.adminKPIDBCollectionUpdate.init(CD,{},'immutable');
								app.model.destroy('adminKPIDBCollectionDetail|'+collection);
								app.model.destroy('adminKPIDBCollectionList');
								app.ext.admin.calls.adminKPIDBCollectionList.init({callback : function(rd){
									$D.parent().hideLoading();
									if(app.model.responseHasErrors(rd)){app.u.throwMessage(rd);}
									else	{
										app.ext.admin_reports.u.updateKPICollections($context);
										$D.dialog('close');
										}
									}},'immutable');
								app.model.dispatchThis('immutable');
								}});
							$D.dialog( "option", "buttons", buttons); //save not added till collection data obtained to avoid confusion.
							$D.append($("<div \/>").addClass('appMessaging'));
							$D.append($("<input \/>",{'type':'text','placeholder':'collection name','id':'collectionTitle'}).val(app.data[rd.datapointer].TITLE || ""));
							}
					}},'immutable');
					app.model.dispatchThis('immutable');
	
					
					
					}
				else	{
					
					}
				},

			showKPIGraphRemove : function(collection,graphUUID,$slimLeftContainer)	{
				if(collection && graphUUID)	{
					
					var $D = $("<div \/>").attr('title',"Remove Graph ");
					$D.addClass('displayNone').text("Are you sure you want to this graph? This action can not be undone.");
					$D.appendTo('body');
					$D.dialog({
						modal: true,
						autoOpen: false,
						close: function(event, ui)	{
							$(this).dialog('destroy').remove();
							},
						buttons: [ 
							{text: 'Cancel', click: function(){$D.dialog('close')}},
							{text: "Delete Graph", click: function() {
	$D.parent().showLoading({'message':'Removing graph...'});
	
	var graphs = app.data['adminKPIDBCollectionDetail|'+collection]['@GRAPHS'];

//	app.u.dump(" -> graphUUID: "+graphUUID);
	//got to loop backwards otherwise if match is at 0, elements shift down and when L is reached, that index in graphs is empty.
	for(var index in graphs)	{
		app.u.dump(index+" uuid: "+graphs[index].uuid);
		if(graphs[index].uuid == graphUUID) {
			app.u.dump("MATCH");
			graphs.splice(index, 1);
			}
		}

	app.ext.admin.calls.adminKPIDBCollectionUpdate.init({'uuid':collection,'@GRAPHS' : graphs},{},'immutable');
	app.model.destroy('adminKPIDBCollectionDetail|'+collection);
	app.ext.admin.calls.adminKPIDBCollectionDetail.init(collection,{callback : function(rd){
		$D.parent().hideLoading();
		if(app.model.responseHasErrors(rd)){app.u.throwMessage(rd);}
		else	{
			app.ext.admin_reports.a.showKPICollectionEditor($("[data-app-role='slimLeftContent']",$slimLeftContainer).first(), collection);
			$D.dialog('close');
			$('#globalMessaging').anymessage(app.u.successMsgObject('Your chart has been removed.'));
			}
		}},'immutable');
	app.model.dispatchThis('immutable');
								}}
							]
						});
					
					$D.dialog('open'); $D.showLoading({'message':'Fetching collection details'});
					app.ext.admin.calls.adminKPIDBCollectionDetail.init(collection,{'callback':function(rd){
						$D.hideLoading();
						if(app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd,'gMessage':true});
							}
						else	{} //content is already present. hideLoading does the needful.
					}});
					
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_reports.a.showKPIGraphRemove, collection ["+collection+"] and/or graph uuid ["+graphUUID+"] not passed.","gMessage":true});
					}

				}, //showKPIGraphRemove

			showKPICollectionRemove : function(collection,$context)	{
				if(collection)	{
					var title = ""
					if(app.data['adminKPIDBCollectionDetail|'+collection] && app.data['adminKPIDBCollectionDetail|'+collection].TITLE)	{
						title = app.data['adminKPIDBCollectionDetail|'+collection].TITLE
						}
					else	{
						title = collection
						}
					
					var $D = $("<div \/>").attr('title',"Remove Collection "+title);
					$D.addClass('displayNone').text("Are you sure you want to delete the collection "+title+"? This action can not be undone.");
					$D.appendTo('body');
					$D.dialog({
						modal: true,
						autoOpen: false,
						close: function(event, ui)	{
							$(this).dialog('destroy').remove();
							},
						buttons: [ 
							{text: 'Cancel', click: function(){$D.dialog('close')}},
							{text: "Delete Collection", click: function() {
	$D.parent().showLoading({'message':'Removing collection...'});
	app.ext.admin.calls.adminKPIDBCollectionRemove.init(collection,{},'immutable');
	app.model.destroy('adminKPIDBCollectionDetail|'+collection);
	app.model.destroy('adminKPIDBCollectionList');
	app.ext.admin.calls.adminKPIDBCollectionList.init({callback : function(rd){
		$D.parent().hideLoading();
		if(app.model.responseHasErrors(rd)){app.u.throwMessage(rd);}
		else	{
			app.ext.admin_reports.u.updateKPICollections($context);
			$D.dialog('close');
			}
		}},'immutable');
	app.model.dispatchThis('immutable');
	
								}}
							]
						});
					$D.dialog('open');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_reports.a.showKPICollectionRemove, collection not passed.","gMessage":true});
					}

				} //showKPICollectionRemove

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			
			collectionAsOptions : function($tag,data)	{
				$tag.text(data.value.TITLE).val(data.value.UUID);
				}
			
			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {


			drawToolbar : function (id)	{
				if(id)	{
					var components = [
//						{type: 'igoogle', datasource: 'https://spreadsheets.google.com/tq?key=pCQbetd-CptHnwJEfo8tALA',	gadget: 'https://www.google.com/ig/modules/pie-chart.xml',userprefs: {'3d': 1}},
						{type: 'html', datasource: 'https://spreadsheets.google.com/tq?key=pCQbetd-CptHnwJEfo8tALA'},
						{type: 'csv', datasource: 'https://spreadsheets.google.com/tq?key=pCQbetd-CptHnwJEfo8tALA'} //,
//						{type: 'htmlcode', datasource: 'https://spreadsheets.google.com/tq?key=pCQbetd-CptHnwJEfo8tALA',gadget: 'https://www.google.com/ig/modules/pie-chart.xml'}
						];
					
					var container = document.getElementById(id);
//					google.visualization.drawToolbar(container, components); //doens't work. need to use the google docs API !!!
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_reports.u.drawToolbar, no ID passed.','gMessage':true});
					}
				
				},
			
			
//when a table header is clicked to change sort, the entire contents of the container (id) are rewritten.
//keep that in mind when and deciding what ID to pass in.
			drawTable : function(id,header,rows) {
//				app.u.dump("header: "); app.u.dump(header);
//				app.u.dump("rows: "); app.u.dump(rows);
				var data = new google.visualization.DataTable();
//				app.u.dump(" -> header:"); app.u.dump(header);
				for(var index in header)	{
					data.addColumn('string',header[index]);
					}
				data.addRows(rows);
			
				var table = new google.visualization.Table(document.getElementById(id));
				table.draw(data, {
					page : 'enable',
					pageSize : 250,
					showRowNumber: true
					});
				}, //drawTable

//used not on a form validation, but when requesting data. This is a global check to make sure all the necessary variables are present.
//returns false if valid. Returns error log if data is missing.
			graphVarsIsMissingData : function(graphVars)	{
				var r = ""; //set to blank so += doesn't add 'undefined' to beginning.
				
				if(graphVars && !$.isEmptyObject(graphVars))	{
					if(!graphVars.grpby)	{r += 'grpby not set.<br>'}
					if(!graphVars.column) {r += 'column not set.<br>'}
					if(!graphVars.title) {r += 'title not set.<br>'}
					if(!graphVars.graph) {r += 'graph (type) not set.<br>'}
					
					if(graphVars['@datasets'] && graphVars['@datasets'].length) {}
					else {r += '@datasets either not set or empty.<br>'}
					
					if(graphVars.period || (graphVars.startyyyymmdd && graphVars.stopyyyymmdd)) {}
					else	{r += 'either period not set OR both startyyyymmdd and stopyyyymmdd are not set.<br>'}
					
					
					}
				else	{
					r = "graphVars is either not set or empty object."
					}
				
				return (r == "") ? false : r;
				},

//all this does is empty and re-render the collections. you must destroy and re-aquire prior to running this.
			updateKPICollections : function($context)	{
				if($context)	{
					var $UL = $("[data-app-role='collectionNavList']",$context);
					$UL.empty().parent().anycontent({datapointer : 'adminKPIDBCollectionList'});
					app.u.handleAppEvents($UL);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_reports.u.updateKPICollections, either $context not passed.','gMessage':true});
					}
				},

//vars will contain a grpby and column.  It will also contain a period OR startyyyymmdd and stopyyyymmdd
//vars can contain a dataset OR dataset can be passed in as the second param. This is to accomodate the KPI data storage pattern.
//outside of KPI, there's a good chance dataset will be passed in w/ the vars.
			getChartData : function($target,graphVars)	{
				var $chartObj = false;
				if(graphVars && !$.isEmptyObject(graphVars) && $target)	{
//at this point, graphVars IS an object and is not empty.
//app.u.dump(" -> graphVars: "); app.u.dump(graphVars);
					if(!app.ext.admin_reports.u.graphVarsIsMissingData(graphVars))	{
						$target.showLoading({'message':'Fetching graph data'});
//everything we need is accounted for. Move along... move along...
						app.ext.admin.calls.adminKPIDBDataQuery.init(graphVars,{callback:function(rd){
							$target.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$('#globalMessaging').anymessage({'message':rd});
								}
							else	{
								app.ext.admin_reports.u.addGraph($target,graphVars,app.data[rd.datapointer])
								}
							}},'mutable');
						app.model.dispatchThis('mutable');
						}
					else	{
						$('.appMessaging').anymessage({'message':'In admin_reports.u.getKPIChart, graphVars is missing data: <br>'+app.ext.admin_reports.u.graphVarsIsMissingData(graphVars),'gMessage':true});
						}

					}
				else	{
					$('.appMessaging').anymessage({'message':'In admin_reports.u.getKPIChart, graphVars [typeof '+typeof graphVars+'] and/or $target not passed or graphVars is empty object.','gMessage':true});
					}
				return $chartObj;
				},
			
			getTextGraph : function(graphVars,highChartObj)	{
				var
					$C = $("<div \/>"),
					L = highChartObj.series.length,
					$T = $("<table \/>");
				
				$C.append("<h3>"+highChartObj.title.text+"<\/h3>");
				$C.append("<h5>"+highChartObj.subtitle.text+"<\/h5>");
				
				for(var i = 0; i < L; i += 1)	{
//skip data with zero value.
					if(highChartObj.series[i].data[0])	{
						$T.append("<tr \/><td>"+highChartObj.series[i].name+"<\/td><td>"+(graphVars.column == 'gms' ? '$' : '#')+highChartObj.series[i].data[0]+"<\/td><\/tr>");
						}
					}
				$T.appendTo($C);
				return $C;
				},
			
			getGraphByUUID : function(graphs,graphUUID)	{
				var r = false;
				if(graphs && graphs.length && graphUUID)	{
					for(var index in graphs)	{
						if(graphs[index].uuid == graphUUID)	{
							r = graphs[index]
							break;
							}
						}
					}
				else	{
					r = undefined;
					$('#globalMessaging').anymessage({'message':'In admin_reports.u.getGraphByUUID, graphs not set/has no children of graphUUID ['+graphUUID+'] not passed.','gMessage':true});
					}
				return r;
				},

//This will display the actual graph. requires that data be passed in. executed by getChartData.			
			addGraph : function($target,graphVars,data)	{
				
				if($target && graphVars && data)	{


var
//the data for the graph.
	myDataSet = new Array(),
//what is passed into highcharts(); varies based on graph type.
	highChartObj = {
		chart: {type: graphVars.graph},
		title: {text: graphVars.title},
		subtitle: {text: data.startyyyymmdd + " to " + data.stopyyyymmdd},
		tooltip: {pointFormat: '{series.name} <b>{point.y:,.0f}</b> on {point.x}'}
		}; 

if(graphVars.graph == 'pie' && graphVars.dataColumns == 'dynamic')	{
	var L = data['@YAxis'].length;
	app.u.dump(" -> L: "+L);
	for(var i = 0; i < L; i += 1)	{
//		app.u.dump(" -> "+data['@YAxis'][i][1]+" ("+key+") : "+data[key][0]);
		myDataSet.push([data['@YAxis'][i][1],data[data['@YAxis'][i][0]][0]])
		}
	}
else if(graphVars.graph == 'pie' && graphVars.dataColumns == 'fixed')	{
	var L = graphVars['@datasets'].length
	app.u.dump(" -> L: "+L);
	for(var i = 0; i < L; i += 1)	{
//		app.u.dump(" -> "+graphVars['@datasets'][i]+" : "+data[graphVars['@datasets'][i]][0]);
		myDataSet.push([graphVars['@datasets'][i],data[graphVars['@datasets'][i]][0]])
		}
	}
else if(graphVars.dataColumns == 'fixed')	{
	var L = graphVars['@datasets'].length
	for(var i = 0; i < L; i += 1)	{
		myDataSet.push({'name':graphVars['@datasets'][i],'data':data[graphVars['@datasets'][i]]})
		}
	}
else if(graphVars.dataColumns == 'dynamic')	{
	var L = data['@YAxis'].length;
	for(var i = 0; i < L; i += 1)	{
		myDataSet.push({'name':data['@YAxis'][i][1],'data':data[data['@YAxis'][i][0]]})
		}
	}
else	{
	
	} //catch. really, by now, we should never get here.

if(graphVars.graph == 'pie')	{
	highChartObj.plotOptions = {
		pie: {
			allowPointSelect: true,
			cursor: 'pointer',
			dataLabels: {
				enabled: true,
				color: '#000000',
				connectorColor: '#000000',
				formatter: function() {return (this.percentage == 0) ? null : '<b>'+ this.point.name +'</b>: '+ (Math.round(this.percentage*100)/100 ) +' %';}
				}
			}
		}
	
	highChartObj.series = [{
		type: 'pie',
		name: '',
		data: myDataSet
		}]

	}
//the line charts all expect the data about the same.
else	{
	highChartObj.xAxis = {
		categories : data['@xAxis'],
		tickInterval : (data['@xAxis'].length > 35) ? 15 : 1 , //will skip ticks in graphs w/ lots of x-axis values.
		labels: {
			formatter: function() {return this.value;} // clean, unformatted value
			}
		}

	highChartObj.yAxis = {
			title: {
				text: '' //runs up left side of chart.
			},
			labels: {
				formatter: function() {
					return this.value / 1000 +'k';
				}
			}
		}
	highChartObj.series = myDataSet

	}

if(myDataSet.length)	{
	if(graphVars.graph == 'text')	{
		$target.append(app.ext.admin_reports.u.getTextGraph(graphVars,highChartObj));
		}
	else	{
		$target.highcharts(highChartObj);
		}
	}
else	{
	$target.anymessage({'message':'No data available'});
	}






					}
				else if($target)	{
					$target.anymessage({'message':'In admin_reports.u.addGraph, graphsvars ['+typeof graphVars+'] and data['+typeof data+'] are both required.','gMessage':true});
					}
				else	{
					
					$("#globalMessaging").anymessage({'message':'In admin_reports.u.addGraph, $target ['+typeof $target+'] andgraphsvars ['+typeof graphVars+'] and data['+typeof data+'] are both required.','gMessage':true});
					
					}
				
				},
//currently, we want each chart to get it's own ajax request so that the content loads asynchronously.
//means faster loading for smaller charts.
			getDatasetsArray : function($form,sfo)	{
				var r = new Array();
				if($form && sfo)	{
					if(sfo.dataColumns == 'fixed')	{
						$("[data-app-role='dataSetAxisListSelected']",$form).children().each(function(){
							r.push($(this).data('dataset'));
							});
						}
					else if(sfo.dataColumns == 'dynamic')	{
						r.push(sfo.ddataset);
						}
					else	{
						r = false;
						} //should never get here. validation makes sure dataColumns is fixed or dynamic.
					
					}
				else	{
					r = false;
					}
				return r;
				},

//This is what displays a collection.  It'll show it in target.
			addKPICollectionTo : function($target,collection)	{
				app.u.dump("BEGIN admin_reports.u.addKPICollectionTo $target");
				if($target && collection)	{
//					app.u.dump(" -> $target and collection are set.");
					$target.empty().showLoading({'message':'Fetching collection details'});
					app.ext.admin.calls.adminKPIDBCollectionDetail.init(collection,{'callback':function(rd){
						$target.hideLoading();
						if(app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd,'gMessage':true});
							}
						else	{
							//get detail for each graph
//							app.u.dump(" -> app.data[rd.datapointer]"); app.u.dump(app.data[rd.datapointer]);
if(app.data[rd.datapointer]['@GRAPHS'])	{
	var graphs = app.data[rd.datapointer]['@GRAPHS']; //shortcut
	for(var index in graphs)	{
//		app.u.dump(index+"). adding graph."); app.u.dump(graphs[index]);
		var $div = $("<div\/>").attr('data-graph-uuid',graphs[index].uuid).addClass('graph').appendTo($target);
		app.ext.admin_reports.u.getChartData($div,graphs[index]); //getChartData handles dispatch so that each chart gets it's own ajax req. (faster loading for smaller charts)
		}
	}
else	{
	$target.append("<P>There are no graphs in this collection.<\/P>");
	}

							}
						}},'mutable');
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_reports.u.addKPICollectionTo, either $target ['+typeof $target+'] or collection ['+collection+']was not passed.','gMessage':true});
					}
				},
			
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
			
			validateAddUpdateCollectionForm : function($form,sfo,mode)	{

				var r = true; //what is returned. boolean.
				//mode can be 'preview' or 'save'.  
				if($form && sfo && mode)	{
					
					//In preview mode, collection and name are not required.
					if(mode == 'preview')	{
						$("[name='title']",$form).attr('required','').removeAttr('required');
						$("[name='collection']",$form).attr('required','').removeAttr('required');
						}
					else if(mode == 'save')	{
						$("[name='title']",$form).attr('required','required');
						$("[name='collection']",$form).attr('required','required');
						}
					else	{} //unknown mode.
					
					
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
					app.ext.admin_reports.u.addKPICollectionTo($ele.closest("[data-app-role='slimLeftContainer']").find("[data-app-role='slimLeftContent']").first(),$ele.data('uuid'));
					app.model.dispatchThis('mutable');
					});
				},
			
			showChartAdd : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-key"},text: true});
				$btn.off('click.showChartAdd').on('click.showChartAdd',function(){
					app.ext.admin_reports.a.showKPIAddUpdateInModal('add',{});
					});
				}, //showChartAdd


			
			showKPIGraphPreview : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-image"},text: true});
				
				$btn.off('click.showKPIGraphPreview').on('click.showKPIGraphPreview',function(){
					//data-app-role='KPIDataGraph'
					var
						$form = $btn.closest('form'),
						sfo = $form.serializeJSON(),
						$preview = $("[data-app-role='KPIDataGraph']",$form);

					if(app.ext.admin_reports.u.validateAddUpdateCollectionForm($form,sfo,'preview'))	{
						sfo['@datasets'] = app.ext.admin_reports.u.getDatasetsArray($form,sfo);
						sfo.title = sfo.period + " " + sfo.column;
						$preview.show().addClass("graphType_"+sfo.graph)
						app.ext.admin_reports.u.getChartData($preview,sfo);
						app.model.dispatchThis('mutable');
						}
					else	{
						//validation handles error display.
						}

					});
				}, //showChartAdd


			showChartUpdate : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: true});
				$btn.off('click.showChartUpdate').on('click.showChartUpdate',function(){
					
					var
						graphUUID = $btn.closest("[data-app-role='datasetContainer']").data('uuid'),
						collection = $btn.closest("[data-app-role='collectionEditor']").data('collection'),
						graph 
						
						if(collection && graphUUID && app.data['adminKPIDBCollectionDetail|'+collection])	{
							graph = app.ext.admin_reports.u.getGraphByUUID(app.data['adminKPIDBCollectionDetail|'+collection]['@GRAPHS'],graphUUID);
							graph.collection = collection;  //collection is not stored IN the graph. a graph is part of a collection. but this is needed for the UI.
							app.ext.admin_reports.a.showKPIAddUpdateInModal('update',graph);
							}
						else	{
							$('#globalMessaging').anymessage({'message':'In admin_reports.e.showChartUpdate click event, unable to ascertain collection ['+collection+'] or graphUUID ['+graphUUID+'] OR collection detail ['+typeof app.data['adminKPIDBCollectionDetail|'+collection]+'] not in memory.','gMessage':true});
							}
					
					});
				}, //showChartUpdate
			showChartRemove : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-circle-close"},text: true});
				$btn.off('click.showChartRemove').on('click.showChartRemove',function(){
					app.ext.admin_reports.a.showKPIGraphRemove($btn.closest("[data-app-role='collectionEditor']").data('collection'),$btn.closest("tr").data('uuid'),$btn.closest("[data-app-role='slimLeftContainer']"));
					});
				}, //showChartRemove

			showAdminKPIDBCollectionCreate : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-circle-plus"},text: true});
				$btn.off('click.showAdminKPIDBCollectionCreate').on('click.showAdminKPIDBCollectionCreate',function(){

//by now, we know we have a valid mode and if that mode is edit, uuid is set.
					var $D = $("<div \/>").attr('title',"Add a New Collection");
//guid created at time modal is open. that way the guid of an edit can be added in same way and save button won't care if it's an edit or add.
					$D.addClass('displayNone').appendTo('body'); 
					$D.dialog({
						modal: true,
						autoOpen: false,
						close: function(event, ui)	{
							$(this).dialog('destroy').remove();
							},
						buttons: [ 
							{ text: "Add Collection", click: function() {
								var val = $('#newCollectionName').val();
								if(val)	{
									$D.parent().showLoading({'message':'Adding collection...'});
									app.model.destroy('adminKPIDBCollectionList');
									app.ext.admin.calls.adminKPIDBCollectionCreate.init({'uuid':app.u.guidGenerator(),'title':val},{callback : function(rd){
										$D.parent().hideLoading();
										if(app.model.responseHasErrors(rd)){
											$('.appMessaging').anymessage({'message':rd,'gMessage':true});
											}
										else	{
											$D.anymessage(app.u.successMsgObject('Your collection has been created.'));
											$('#newCollectionName').val('');
											app.ext.admin_reports.u.updateKPICollections($btn.closest("[data-app-role='slimLeftContainer']"));
											}
										}},'immutable');
									app.ext.admin.calls.adminKPIDBCollectionList.init({},'immutable')
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
				}, //addTriggerKPIDatasetChange
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
					
/*
//move this into the period change so all the grouping code is in one  spot.
Then, when graph type changes, trigger the change code on the period select.
					$groupby = $("[name='grpby']",$form);
					if($select.val() == 'pie')	{
						$("option",$groupby).attr('disabled','disabled'); //disable all groupings.
						$groupby.val('NONE');
						$("[value='NONE']",$groupby).attr('disabled','').removeAttr('disabled'); //only merge datasets is available.
						}
					else	{
						
						}
*/
					});
				}, //addTriggerKPIGraphTypeChange
			addTriggerKPIPeriodChange : function($select)	{
				var $form = $select.closest('form');
				$select.off('change.addTriggerKPIPeriodChange').on('change.addTriggerKPIPeriodChange',function(){

					var period = $select.val(),
					$groupby = $("[name='grpby']",$form);
					
				//grouping is disabled till a period is chosen.
					$groupby.attr('disabled','').removeAttr('disabled');
					
				//in case period is changed from day to week, clear all disables so previously locked options are available.
					$("option",$groupby).attr('disabled','').removeAttr('disabled');
				
				//some general rules for option disabling.
					if(period.indexOf('day') >= 0)	{
						$("[value='week'], [value='month'], [value='quarter']",$groupby).attr('disabled','disabled');
						}
					else if(period.indexOf('week') >= 0)	{
						$("[value='month'], [value='quarter']",$groupby).attr('disabled','disabled');
						}
					else if(period.indexOf('month') >= 0)	{
						$("[value='quarter']",$groupby).attr('disabled','disabled');
						}
					else	{

						}
				
//more specific rules
//need more than one days data to group by day of week.
					if(period == 'day.today' || period == 'day.yesterday')	{
						$("[value='dow']",$groupby).attr('disabled','disabled');
						}
//need more than one weeks data to group by week.
					if(period == 'week.this' || period == 'week.tly' || period == 'week.last')	{
						$("[value='week']",$groupby).attr('disabled','disabled');
						}	
//need more than one months data to group by month.
					if(period == 'month.this' || period == 'month.tly' || period == 'month.last')	{
						$("[value='month']",$groupby).attr('disabled','disabled');
						}

//if the grpby is selected and the choice is no longer available (they changed period from month to week, for instance) then unselect the grpby.
var $selectedGrpby = $groupby.find(":selected")
if($selectedGrpby.length && $selectedGrpby.attr('disabled') == 'disabled')	{
	$groupby.val('');
	}

					});
				}, //addTriggerKPIPeriodChange

//executed as part of the save/update interface 'save' button.
			execAdminKPIDBCollectionUpdate : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-circle-plus"},text: true});
//A new graph save or even an existing graph update does NOT save individually. The entire collection must be updated.
var $context = $btn.closest("[data-app-role='KPIGraphAddUpdate']"),
mode = $context.data('app-mode'),
$form = $btn.closest('form');




$btn.off('click.execAdminKPIDBCollectionUpdate').on('click.execAdminKPIDBCollectionUpdate',function(){
	if(mode)	{
		if(mode == 'add' || mode == 'update')	{
			var sfo = $form.serializeJSON(); //needs to be in 'click' or serialization occurs before form is populated.
//when in 'add' mode, make sure a title and collection are set. collection may stay invisible depending on which 'add graph' link/button was pushed (may be hard coded to a collection.
			if(mode == 'add' && !$("[data-app-role='saveInputsFieldset']",$context).is(':visible'))	{
				$("[data-app-role='saveInputsFieldset']",$context).show().prepend("Please give the graph and name and location before saving.");
				}
			else	{
				
				if(app.ext.admin_reports.u.validateAddUpdateCollectionForm($form,sfo,'save'))	{
	
	//By this point, all the data required to add or update a chart is present.
	
	//now get all the data formatted properly. Once that's done, mode will determine the next course of action.
					sfo['@datasets'] = app.ext.admin_reports.u.getDatasetsArray($form,sfo);

	
					var collection = sfo.collection;
	//sanitize sfo here, if necessary.
					delete sfo.collection; //redundant to have this in the graph data which is saved as part of a collection.
					delete sfo.ddataset; //already saved into datasets.
	
	// need to fetch the collection list detail to make sure it's present. The callback for that will include appending this new chart to the collection.
	// Then, update the collection and fetch a clean copy. If the KPI page is visible AND the collection in question is open, update the view.
					
					app.u.dump(" -> All data for creating a new graph is present.  proceed....");
					$context.showLoading({'message':'Creating new graph.'})
	//make sure we have a copy of the collection. most likely, what's in memory (if already here) is up to date, so no need to destroy.
					app.ext.admin.calls.adminKPIDBCollectionDetail.init(collection,{
						callback : function(rd)	{

							app.u.dump("BEGIN inline callback on adminKPIDBCollectionDetail _cmd for adding a new chart.");
/*
								if(app.model.responseHasErrors(rd)){
								$context.hideLoading();
								$('.appMessaging').anymessage({'message':rd,'gMessage':true});
								}
							else	{
								var graphs = new Array();
								app.u.dump(rd.datapointer);
//if there are already graphs in this collection, add then to graphs array as the update is destructive and ALL graphs need to be present.
								if(app.data[rd.datapointer]['@GRAPHS'])	{
									graphs = app.data[rd.datapointer]['@GRAPHS'];
									}
								
								
								app.u.dump(graphs);

								if(mode == 'add')	{
									sfo.uuid = app.u.guidGenerator();
									graphs.push(sfo);
									}
								else if(mode == 'update')	{
									var L = graphs.length;
									for(var i = 0; i < L; i += 1)	{
										if(graphs[i].uuid == sfo.uuid)	{
											graphs[i] = sfo;
											break;
											}
										}
									}
								app.u.dump(graphs);
								app.model.destroy(rd.datapointer);
								app.ext.admin.calls.adminKPIDBCollectionUpdate.init({'uuid':collection,'@GRAPHS':graphs},{'callback':function(rd){
									$context.hideLoading();
									if(app.model.responseHasErrors(rd)){
										$('.appMessaging').anymessage({'message':rd,'gMessage':true});
										}
									else	{
										$('.appMessaging').anymessage(app.u.successMsgObject('Your chart has been added.'));
										}
									}},'immutable');
								app.ext.admin.calls.adminKPIDBCollectionDetail.init(collection,{},'immutable');//make sure collection is udpated in localstorage and memory
								app.model.dispatchThis('immutable');
								
								}
						*/	}
						},'immutable');
					app.model.dispatchThis('immutable');
					}
				else	{} //validateAddUpdateCollectionForm handles error display.
				}
			}
		else	{
			$('.appMessaging').anymessage({'message':'In admin_reports.e.execAdminKPIDBCollectionUpdate, unsupported mode ['+mode+'] set.','gMessage':true});
			}
		}
	else	{
		$('.appMessaging').anymessage({'message':'In admin_reports.e.execAdminKPIDBCollectionUpdate, unable to determine mode.','gMessage':true});
		}	
	});




				}, //execAdminKPIDBCollectionUpdate
			
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
				}, //ebayReportView
			
			handleCollectionMenu : function($btn)	{
				$btn.button({text: false,icons: {primary: "ui-icon-wrench"}}).addClass('floatRight');

				var 
					$parentLI = $btn.closest('li'),
					$ul = $("<ul \/>"),
					collection = $parentLI.data('uuid'),
					$slimLeftContainer = $btn.closest("[data-app-role='slimLeftContainer']");

				$parentLI.css('position','relative');

				$("<li \/>").append($("<a \/>",{'href':'#'}).text('Add new graph').on('click',function(event){
					event.preventDefault();
					event.stopPropagation(); //keeps this click from firing the click event on the li
					app.ext.admin_reports.a.showKPIAddUpdateInModal('add',{'collection' : $parentLI.data('uuid')});
					$ul.hide()
					return false;
					})).appendTo($ul);

				$("<li \/>").append($("<a \/>",{'href':'#'}).text('Edit Collection').on('click',function(event){
					event.preventDefault();
					event.stopPropagation();
					app.ext.admin_reports.a.showKPICollectionEditor($btn.closest("[data-app-role='slimLeftContainer']").find("[data-app-role='slimLeftContent']").first(), collection);
					$ul.hide()
					return false;
					})).appendTo($ul);

				$("<li \/>").append($("<a \/>",{'href':'#'}).text('Rename collection').on('click',function(event){
					event.preventDefault();
					event.stopPropagation();
					app.ext.admin_reports.a.showKPICollectionTitleChange(collection,$slimLeftContainer);
					$ul.hide()
					return false;
					})).appendTo($ul);

				$("<li \/>").append($("<a \/>",{'href':'#'}).text('Delete collection').on('click',function(event){
					event.preventDefault();
					event.stopPropagation();
					app.ext.admin_reports.a.showKPICollectionRemove(collection,$slimLeftContainer);
					$ul.hide()
					return false;
					})).appendTo($ul);

				$ul.insertAfter($btn);
				$ul.menu().css({'position':'absolute','width':'200','z-index':'100'}).hide();

				$btn.off('click.handleCollectionMenu').on('click.handleCollectionMenu',function(){
					$ul.show().position({
						my: "left top",
						at: "left bottom",
						of: this
						});
					$( document ).one( "click", function() {$ul.hide();});
					return false;
					})
				
				}, //handleCollectionMenu
			
			showSalesReportPeriodInputs : function($ele)	{
				$ele.off('change.showSalesReportPeriodInputs').on('change.showSalesReportPeriodInputs',function(){
//hide any visible 'period' input containers. make sure no period-specific inputs are required (so validation can pass)
					$ele.closest('fieldset').find('.formPeriodRange').hide().find('input, select').each(function(){$(this).attr('required','').removeAttr('required')}); 
//show the input container desired. make all inputs within required.
					$ele.closest('fieldset').find('.formPeriodRange-'+$(this).val()).show().effect('highlight',{},1500).find('input,select').each(function(){$(this).attr('required','required')});
					});
				},


			execAdminReportCreate : function($btn)	{
				$btn.button();
				$btn.off('click.execAdminReportCreate').on('click.execAdminReportCreate',function(event){
					event.preventDefault();
					var $form = $btn.closest('form');
					if(app.u.validateForm($form))	{
						var sfo = {'%vars':$form.serializeJSON()}
						sfo.type = 'REPORT/'+sfo['%vars'].REPORT;
						sfo.guid = app.u.guidGenerator();
						if(sfo['%vars'].PERIOD == 'BYTIMESTAMP')	{
							sfo['%vars'].begints = (sfo['%vars'].begints / 1000)
							sfo['%vars'].endts = (sfo['%vars'].endts / 1000) 
							}
						app.ext.admin_batchJob.a.adminBatchJobCreate(sfo);
						}
					else	{} //validateForm handles error display.
					});
				},



			adminInventoryReportSaveExec : function($btn)	{
				$btn.button();
				$btn.off('click.adminInventoryReportSaveExec').on('click.adminInventoryReportSaveExec',function(event){
					event.preventDefault();
					var $form = $btn.closest('form');
					if(app.u.validateForm($form))	{
						
						var
							sfo = $form.serializeJSON({cb:true}),
							cmdObj = {
								'_cmd':'adminBatchJobParametersCreate',
								'UUID' : app.u.guidGenerator(),
								'TITLE' : sfo.TITLE,
								'BATCH_EXEC' : sfo.BATCH_EXEC,
								'PRIVATE' : sfo.PRIVATE,
								'%vars' : {}
								}
//selectors are NOT required, so no validation is done.
						cmdObj['%vars'].product_selectors = app.ext.admin_tools.u.pickerSelection2KVP($("[data-app-role='pickerContainer']",$form));
						
						if(sfo.summary == 'AVAILABLE' || sfo.summary == 'ONSHELF')	{
							cmdObj['%vars'].where = sfo.summary+","+sfo.operand+","+sfo.operand_match;
							}
						else if(sfo.summary == 'SUPPLIER' || sfo.summary == 'PID' || sfo.summary == 'ORDERID' || sfo.summary == 'PICK_ROUTE')	{
							cmdObj['%vars'].where =sfo.summary+",eq,"+sfo[sfo.summary];
							}
						else if(sfo.summary == 'MODIFIED_TS' || sfo.summary == 'TS')	{
							cmdObj['%vars'].where = sfo.summary+",gt,"+sfo.TS;
							}
						else	{} //either an unrecognized summary or a summary that requires no additional data.

						if(sfo.TYPE == 'SKU')	{
							cmdObj['%vars'].headers = "sku:title,sku:upc,sku:mfgid,sku:amz_asin,sku:condition,sku:price,sku:cost,sku:weight,inv:available,inv:markets,inv:onshelf,inv:saleable"
							}
						else	{
							cmdObj['%vars'].headers = sfo.headers;
							//use whatever is set in the report generator.
							}

						
//						app.u.dump(" -> cmdObj: "); app.u.dump(cmdObj);

app.model.addDispatchToQ(cmdObj,'immutable');
app.model.dispatchThis('immutable');

						}
					else	{} //validateForm handles error display.
					});
				},

			showReportBuilderDialog : function($ele)	{

				$ele.off('click.showReportBuilderDialog').on('click.showReportBuilderDialog',function(event){
					event.preventDefault();
				
					if($ele.data('batchexec') == 'SKU' || $ele.data('batchexec') == 'INVENTORY')	{
						var $D = app.ext.admin.i.dialogCreate({
							'title' : $ele.data('batchexec')+' Report Builder',
							'templateID' : 'reportBuilderTemplate',
							'data' : {
								'BATCH_EXEC':"REPORT/"+$ele.data('batchexec'),
								SKU : $ele.data('batchexec') == 'SKU' ? 1 : 0, //used to toggle on/off fields that are related just to the sku report type.
								DETAIL : $ele.data('batchexec') == 'INVENTORY' ? 1 : 0, //used to toggle on/off fields that are related just to the detail report type.
								}
							});

						app.u.handleButtons($D);
						app.u.handleCommonPlugins($D);
						app.u.handleEventDelegation($D);
						app.ext.admin.u.handleFormConditionalDelegation($('form',$D));

						$('.datepicker',$D).datepicker({
							changeMonth: true,
							changeYear: true,
							dateFormat : "@"
							});

						$D.dialog('open');
		
						var $picker = $("[data-app-role='pickerContainer']:first",$D);
						$picker.append(app.ext.admin.a.getPicker({'templateID':'pickerTemplate','mode':'product'}));
						$('.applyDatepicker',$picker).datepicker({
							changeMonth: true,
							changeYear: true,
							maxDate : 0,
							dateFormat : 'yymmdd'
							});

						}
					else	{
						// )
						$('#globalMessaging').anymessage({"message":"In admin_reports.e.showReportBuilderDialog, data-batchexec not set or invalid ["+$ele.data('batchexec')+"] on trigger element.","gMessage":true});
						}
					});
				},
			
			
			} //E / Events

		} //r object.
	return r;
	}