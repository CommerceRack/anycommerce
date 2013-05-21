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
An extension for working within the Zoovy UI.
*/


var admin = function() {
// theseTemplates is it's own var because it's loaded in multiple places.
// here, only the most commonly used templates should be loaded. These get pre-loaded. Otherwise, load the templates when they're needed or in a separate extension (ex: admin_orders)
	var theseTemplates = new Array('adminProdStdForList','adminProdSimpleForList','adminElasticResult','adminProductFinder','adminMultiPage','domainPanelTemplate','pageSetupTemplate','pageUtilitiesTemplate','adminChooserElasticResult','productTemplateChooser','pageSyndicationTemplate','pageTemplateSetupAppchooser','dashboardTemplate','recentNewsItemTemplate','quickstatReportTemplate','achievementsListTemplate','messageListTemplate','messageDetailTemplate','mailToolTemplate'); 
	var r = {
		
		vars : {
			tab : null, //is set when switching between tabs. it outside 'state' because this doesn't get logged into local storage.
			tabs : ['setup','sites','jt','product','orders','crm','syndication','reports','utilities','launchpad'],
			state : {},
			tab : 'home',
			templates : theseTemplates,
			willFetchMyOwnTemplates : true,
			"tags" : ['IS_FRESH','IS_NEEDREVIEW','IS_HASERRORS','IS_CONFIGABLE','IS_COLORFUL','IS_SIZEABLE','IS_OPENBOX','IS_PREORDER','IS_DISCONTINUED','IS_SPECIALORDER','IS_BESTSELLER','IS_SALE','IS_SHIPFREE','IS_NEWARRIVAL','IS_CLEARANCE','IS_REFURB','IS_USER1','IS_USER2','IS_USER3','IS_USER4','IS_USER5','IS_USER6','IS_USER7','IS_USER8','IS_USER9'],
			"dependencies" : ['store_prodlist','store_navcats','store_product','store_search'] //a list of other extensions (just the namespace) that are required for this one to load
			},



//////////// PAGES \\\\\\\\\\\\\

/*
Planned enhancement.  inline page handler. supports same params as legacy compat mode.
if no handler is in place, then the app would use legacy compatibility mode.
	pages : {
		
		"/biz/setup/index.cgi" : {
			messages : [], //array of strings. TYPE|MESSAGE -> used in legacy compat.
			bc : [], //array of objects. link and name in order left to right. zero is leftmost in array.
			help : "", //webdoc ID.
			navtabs : {}, //array of objects. link, name and selected (boolean)
			title : {},
			requireDomain : false,
			rolesAllowed : ['ts1','ro1'],
			tab : '', //string. can be blank. if blank, uses tab in focus. use 'home' for no tab/turn all tabs off.
			exec : function(){}  //executes the code to render the page.
			},
		"/biz/syndication/index.cgi" : {
			exec : function(){
				app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
				app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
				$('#syndicationContent').empty().append(app.renderFunctions.transmogrify('','pageSyndicationTemplate',{}));

				}
			}
		},
*/
					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



	calls : {

//status is optional
		adminBatchJobList : {
			init : function(status,_tag,Q)	{
				var r = 0;
				_tag = _tag || {};
				_tag.datapointer = "adminBatchJobList|"+status;
//comment out local storage for testing.
				this.dispatch(status,_tag,Q);
				return r;
				},
			dispatch : function(status,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminBatchJobList","status":status,"_tag":_tag},Q);	
				}
			}, //adminBatchJobList
		adminBatchJobStatus : {
			init : function(jobid,_tag,Q)	{
				var r = 0;
				if(jobid)	{
					r = 1;
					this.dispatch(jobid,_tag,Q);
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminBatchJobStatus, jobid not passed.");
					}
				return r;
				},
			dispatch : function(jobid,_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = "adminBatchJobStatus|"+jobid;
				app.model.addDispatchToQ({"_cmd":"adminBatchJobStatus","_tag":_tag,"jobid":jobid},Q);
				}
			}, //adminBatchJobStatus
//Generate a unique guid per batch job.
//if a request/job fails and needs to be resubmitted, use the same guid.
		adminBatchJobCreate : {
			init : function(opts,_tag,Q)	{
				this.dispatch(opts,_tag,Q);
				return 1;
				},
			dispatch : function(opts,_tag,Q)	{
				opts = opts || {};
				opts._tag = _tag || {};
				opts._cmd = "adminBatchJobCreate";
				opts._tag.datapointer = opts.guid ? "adminBatchJobCreate|"+opts.guid : "adminBatchJobCreate";
				app.model.addDispatchToQ(opts,Q);	
				}
			}, //adminBatchJobCreate		
		adminBatchJobRemove : {
			init : function(jobid,_tag,Q)	{
				var r = 0;
				if(jobid)	{this.dispatch(jobid,_tag,Q); r = 1;}
				else	{app.u.throwGMessage("In admin.calls.adminBatchJobRemove, jobid not passed.");}
				return r;
				},
			dispatch : function(jobid,_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = "adminBatchJobRemove|"+jobid;
				app.model.addDispatchToQ({"_cmd":"adminBatchJobRemove","_tag":_tag,"jobid":jobid},Q);	
				}
			}, //adminBatchJobRemove
		adminBatchJobCleanup : {
			init : function(jobid,_tag,Q)	{
				var r = 0;
				if(jobid)	{this.dispatch(jobid,_tag,Q); r = 1;}
				else	{app.u.throwGMessage("In admin.calls.adminBatchJobCleanup, jobid not passed.");}
				return r;
				},
			dispatch : function(jobid,_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = "adminBatchJobCleanup|"+jobid;
				app.model.addDispatchToQ({"_cmd":"adminBatchJobCleanup","jobid":jobid,"_tag":_tag},Q);	
				}
			}, //adminBatchJobStatus


		adminCustomerDetail : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(obj && obj.CID)	{
//if datapointer is fixed (set within call) it needs to be added prior to executing handleCallback (which needs datapointer to be set).
					_tag = _tag || {};
					_tag.datapointer = "adminCustomerDetail|"+obj.CID;
					if(app.model.fetchData(_tag.datapointer) == false)	{
						r = 1;
						this.dispatch(obj,_tag,Q);
						}
					else	{
						app.u.handleCallback(_tag);
						}
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminCustomerDetail, no CID specified in param object.");
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "adminCustomerDetail";
				obj._tag = _tag;
				app.model.addDispatchToQ(obj,Q);
				}
			}, //adminCustomerDetail

		adminCustomerRemove : {
			init : function(CID,_tag,Q)	{
				var r = 0;
				if(CID)	{
//if datapointer is fixed (set within call) it needs to be added prior to executing handleCallback (which needs datapointer to be set).
					_tag = _tag || {};
					_tag.datapointer = "adminCustomerRemove";
					this.dispatch(CID,_tag);
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminCustomerRemove, no CID specified.");
					}
				return r;
				},
			dispatch : function(CID,_tag)	{
				var obj = {};
				obj.CID = CID;
				obj._cmd = "adminCustomerRemove";
				obj._tag = _tag;
				app.model.addDispatchToQ(obj,'immutable');
				}
			}, //adminCustomerDetail
//no local storage to ensure latest data always present. 
		adminCustomerSearch : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(obj && obj.searchfor && obj.scope)	{
					this.dispatch(obj,_tag,Q);
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminCustomerSearch, no email specified.");
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._tag = _tag || {};
				obj._cmd = "adminCustomerSearch";
				obj._tag.datapointer = "adminCustomerSearch"; //if changed, test order create for existing customer and customer manager.				
				app.model.addDispatchToQ(obj,Q || 'mutable');	
				}
			}, //adminCustomerSearch
//email is required in macro
		adminCustomerCreate : {
			init : function(updates,_tag)	{
				var r = 0;
				if(updates)	{
					this.dispatch(updates,_tag)
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminCustomerSet, macro not set or setObj was empty");
					}
				return r;
				},
			dispatch : function(updates,_tag)	{
				var obj = {};
				obj._tag = _tag || {};
				obj._tag.datapointer = 'adminCustomerCreate';
				obj._cmd = "adminCustomerCreate";
				obj.CID = 0; //create wants a zero customer id
				obj['@updates'] = updates;
				app.model.addDispatchToQ(obj,'immutable');
				}
			}, //adminCustomerSet
			
		adminCustomerUpdate : {
			init : function(CID,updates,_tag)	{
				var r = 0;
				if(CID && updates)	{
					this.dispatch(CID,updates,_tag)
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminCustomerUpdate, CID ["+CID+"] or updates ["+updates+"] not set");
					}
				return r;
				},
			dispatch : function(CID,setObj,_tag)	{
				var obj = {};
				_tag = _tag || {};
				_tag.datapointer = "adminCustomerUpdate|"+CID; //here so %CUSTOMER in response can be accessed. CID in datapointer to make sure it's unique
				obj._cmd = "adminCustomerUpdate";
				obj.CID = CID;
				obj['@updates'] = setObj;
				obj._tag = _tag;
				app.model.addDispatchToQ(obj,'immutable');
				}
			}, //adminCustomerSet



		adminCustomerOrganizationSearch : {
			init : function(obj,_tag,Q)	{
//				app.u.dump("BEGIN admin.calls.adminCustomerOrganizationSearch"); app.u.dump(obj);
				var r = 0;
				if(obj)	{
					this.dispatch(obj,_tag,Q)
					r = 1;
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminCustomerSet, no variables passed. some sort of search query needed.",'gMessage':true});
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._tag = _tag || {};
				obj._tag.datapointer = 'adminCustomerOrganizationSearch';
				obj._cmd = "adminCustomerOrganizationSearch";
				app.model.addDispatchToQ(obj,Q || 'mutable');
				}
			}, //adminCustomerOrganizationSearch
		adminCustomerOrganizationCreate : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(obj)	{
					this.dispatch(obj,_tag,Q)
					r = 1;
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminCustomerOrganizationCreate, no variables passed."});
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._tag = _tag || {};
				obj._tag.datapointer = 'adminCustomerOrganizationCreate';
				obj._cmd = "adminCustomerOrganizationCreate";
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			}, //adminCustomerOrganizationCreate
		adminCustomerOrganizationUpdate : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(obj && obj.ORGID)	{
					this.dispatch(obj,_tag,Q)
					r = 1;
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminCustomerOrganizationUpdate, either obj is blank or obj.ORGID not set, which is required."});
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._tag = _tag || {};
				obj._tag.datapointer = 'adminCustomerOrganizationUpdate';
				obj._cmd = "adminCustomerOrganizationUpdate";
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			}, //adminCustomerOrganizationUpdate
		adminCustomerOrganizationDetail : {
			init : function(orgID,_tag,Q)	{
				var r = 0;
				if(orgID)	{
					_tag = _tag || {};
					_tag.datapointer = 'adminCustomerOrganizationDetail|'+orgID;
					
					if(app.model.fetchData(_tag.datapointer) == false)	{
						r = 1;
						this.dispatch(orgID,_tag,Q);
						}
					else	{
						app.u.handleCallback(_tag);
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminCustomerOrganizationDetail, either obj is blank or obj.ORGID not set, which is required."});
					}
				return r;
				},
			dispatch : function(orgID,_tag,Q)	{
				var obj = {}
				obj._tag = _tag || {};
				
				obj._cmd = "adminCustomerOrganizationDetail";
				obj.ORGID = orgID
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			}, //adminCustomerOrganizationDetail
		adminCustomerOrganizationRemove : {
			init : function(ORGID,_tag,Q)	{
				var r = 0;
				if(ORGID)	{
					this.dispatch(ORGID,_tag,Q)
					r = 1;
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminCustomerOrganizationRemove, ORGID not set, which is required."});
					}
				return r;
				},
			dispatch : function(ORGID,_tag,Q)	{
				var obj = {};
				obj.ORGID = ORGID;
				obj._tag = _tag || {};
				obj._tag.datapointer = 'adminCustomerOrganizationRemove';
				obj._cmd = "adminCustomerOrganizationRemove";
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			}, //adminCustomerOrganizationRemove

		adminDataQuery : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(obj && obj.query)	{this.dispatch(obj,_tag,Q); r = 1;}
				else	{
					app.u.throwGMessage("In admin.calls.adminDataQuery, no object or no object.query object passed.");
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = 'adminDataQuery';
				obj._tag = _tag || {};
				obj._tag.datapointer = 'adminDataQuery';
				app.model.addDispatchToQ(obj,Q);
				}
			}, //adminDataQuery
			
//			{'_cmd':'adminDataQuery','query':'listing-active','since_gmt':app.u.unixNow() - (60*60*24*10)}
			
		adminDomainList : {
			init : function(_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = "adminDomainList";
				var r = 0;
				if(app.model.fetchData(_tag.datapointer) == false)	{
					r = 1;
					this.dispatch(_tag,Q);
					}
				else	{
					app.u.handleCallback(_tag);
					}
				return r; 
				},
			dispatch : function(_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminDomainList","_tag" : _tag},Q);
				}			
			}, //adminDomainList

//PRT and TYPE (ex: ORDER) are required params
		adminEmailList : {
			init : function(obj,_tag,Q)	{
				var r = 0;
//				app.u.dump(" -> obj:"+Number(obj.PRT)); app.u.dump(obj); app.u.dump(_tag);
				if(obj && (Number(obj.PRT) >= 0) && obj.TYPE)	{
					_tag = _tag || {};
					_tag.datapointer = "adminEmailList|"+obj.PRT+"|"+obj.TYPE;
					
					if(app.model.fetchData(_tag.datapointer) == false)	{
						r = 1;
						this.dispatch(obj,_tag,Q);
						}
					else	{
						app.u.handleCallback(_tag);
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminEmailList, PRT ["+obj.PRT+"] and TYPE ["+obj.TYPE+"] are required and one was not set."});
					}
				return r; 
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "adminEmailList";
				obj._tag = _tag;
				app.model.addDispatchToQ(obj,Q || 'mutable');
				}			
			}, //adminEmailList
		adminEmailSave : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(obj && Number(obj.PRT) >= 0 && obj.MSGID && obj.TYPE)	{this.dispatch(obj,_tag,Q); r = 1;}
				else	{
					app.u.throwGMessage("In admin.calls.adminEmailSave, no object ["+typeof obj+"] or object.PRT ["+obj.PRT+"] or object.MSGID ["+obj.MSGID+"] not passed.");
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = 'adminEmailSave';
				obj._tag = _tag || {};
				obj._tag.datapointer = 'adminEmailSave';
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			}, //adminDataQuery


//obj requires title and uuid, priority and @GRAPHS are optional.
		adminKPIDBCollectionCreate : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				_tag = _tag || {}; 
				_tag.datapointer = "adminKPIDBCollectionCreate"
				obj = obj || {};
				if(obj.title && obj.uuid)	{
					r = 1;
					this.dispatch(obj,_tag,Q);
					}
				else	{
					$('.appMessaging').anymessage({"message":"In admin.calls.adminKPIDBCollectionCreate, uuid or title not passed","gMessage":true})
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = 'adminKPIDBCollectionCreate'
				obj._tag = _tag;
				app.model.addDispatchToQ(obj,Q || 'immutable');	
				}
			}, //adminKPIDBUserDataSetsList
		adminKPIDBCollectionDetail : {
			init : function(uuid,_tag,Q)	{
				var r = 0;
				if(uuid)	{
					_tag = _tag || {}; 
					_tag.datapointer = "adminKPIDBCollectionDetail|"+uuid
					if(app.model.fetchData('adminKPIDBCollectionDetail|'+uuid) == false)	{
						r = 1;
						this.dispatch(uuid,_tag,Q);
						}
					else	{
						app.u.handleCallback(_tag);
						}
					}
				else	{
					$('.appMessaging').anymessage({"message":"In admin.calls.adminKPIDBCollectionDetail, uuid not passed","gMessage":true})
					}
				return r;
				},
			dispatch : function(uuid,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminKPIDBCollectionDetail","uuid":uuid,"_tag" : _tag},Q || 'mutable');	
				}
			}, //adminKPIDBCollectionList
		adminKPIDBCollectionList : {
			init : function(_tag,Q)	{
				var r = 0;
				_tag = _tag || {}; 
				_tag.datapointer = "adminKPIDBCollectionList"
				if(app.model.fetchData('adminKPIDBCollectionList') == false)	{
					r = 1;
					this.dispatch(_tag,Q);
					}
				else	{
					app.u.handleCallback(_tag);
					}
				return r;
				},
			dispatch : function(_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminKPIDBCollectionList","_tag" : _tag},Q || 'mutable');	
				}
			}, //adminKPIDBCollectionList		
		adminKPIDBCollectionRemove : {
			init : function(uuid,_tag,Q)	{
				var r = 0;
				_tag = _tag || {}; 
				_tag.datapointer = "adminKPIDBCollectionRemove"
				if(uuid)	{
					r = 1;
					this.dispatch(uuid,_tag,Q);
					}
				else	{
					$('.appMessaging').anymessage({"message":"In admin.calls.adminKPIDBCollectionRemove, uuid not passed","gMessage":true})
					}
				return r;
				},
			dispatch : function(uuid,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminKPIDBCollectionRemove","uuid":uuid,"_tag" : _tag},Q || 'immutable');	
				}
			}, //adminKPIDBUserDataSetsList
//obj requires uuid, title, priority and @GRAPHS are optional.
		adminKPIDBCollectionUpdate : {
			init : function(obj,_tag,Q)	{
//				app.u.dump("BEGIN admin.calls.adminKPIDBCollectionUpdate");
				var r = 0;
				_tag = _tag || {}; 
				_tag.datapointer = "adminKPIDBCollectionUpdate"
				obj = obj || {};
				if(obj.uuid)	{
//					app.u.dump(" -> have UUID. proceed.");
					r = 1;
					this.dispatch(obj,_tag,Q);
					}
				else	{
					$('.appMessaging').anymessage({"message":"In admin.calls.adminKPIDBCollectionUpdate, uuid not passed","gMessage":true})
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = 'adminKPIDBCollectionUpdate'
				obj._tag = _tag;
				app.model.addDispatchToQ(obj,Q || 'immutable');	
				}
			}, //adminKPIDBUserDataSetsList
/*
<input id="@datasets"></input>
<input id="grpby">day|dow|quarter|month|week|none</input>
<input id="column">gms|distinct|total</input>
<input id="period">a formula ex: months.1, weeks.1</period>
<input id="startyyyymmdd">(not needed if period is passed)</input>
<input id="stopyyyymmdd">(not needed if period is passed)</input>
*/
// obj required dataset, grupby, column, detail. period or starty/stop date range are needed.
		adminKPIDBDataQuery : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(!$.isEmptyObject(obj))	{
					if(obj['@datasets'] && obj.grpby && obj.column && obj['function'])	{
						if(obj.period || (obj.startyyyymmdd && obj.stopyyyymmdd))	{
							r = 1;
							this.dispatch(obj,_tag,Q);
							}
						else	{
							$('.appMessaging').anymessage({"message":"In admin.calls.adminKPIDBDataQuery, either period ["+obj.period+"] or start/stop ["+["+obj.startyyyymmdd+"]+"/"+obj.stopyyyymmdd+"] date range required.","gMessage":true})
							}
						}
					else	{
						$('.appMessaging').anymessage({"message":"In admin.calls.adminKPIDBDataQuery; @datasets ["+typeof obj['@datasets']+"], grpby ["+obj.grpby+"], and column ["+obj.column+"] and function ["+obj['function']+"] are required","gMessage":true})
						}
					}
				else	{
					$('.appMessaging').anymessage({"message":"In admin.calls.adminKPIDBDataQuery, no object passed","gMessage":true})
					}

				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "adminKPIDBDataQuery";
				obj._tag = _tag || {}; 
				obj._tag.datapointer = "adminKPIDBDataQuery"
				app.model.addDispatchToQ(obj,Q || 'mutable');	
				}
			}, //adminKPIDBDataQuery
		adminKPIDBUserDataSetsList : {
			init : function(_tag,Q)	{
				var r = 0;
				_tag = _tag || {}; 
				_tag.datapointer = "adminKPIDBUserDataSetsList"
				if(app.model.fetchData('adminKPIDBUserDataSetsList') == false)	{
					r = 1;
					this.dispatch(_tag,Q);
					}
				else	{
//					app.u.dump(' -> data is local');
					app.u.handleCallback(_tag);
					}
				return r;
				},
			dispatch : function(_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminKPIDBUserDataSetsList","_tag" : _tag},Q || 'mutable');	
				}
			}, //adminKPIDBUserDataSetsList
//@head and @body in the response is the data I should use.
//guid comes from batch list.
		adminReportDownload : {
			init : function(batchGUID,_tag,Q)	{
				var r = 0;
				if(batchGUID)	{
					this.dispatch(batchGUID,_tag,Q);
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminReportDownload, no batchGUID passed.");
					}
				return r;
				},
			dispatch : function(batchGUID,_tag,Q)	{
				var obj = {};
				obj._cmd = 'adminReportDownload';
				obj._tag = _tag || {};
				obj._tag.datapointer = 'adminReportDownload';
				obj.GUID = batchGUID;
				app.model.addDispatchToQ(obj,Q || 'passive');
				}
			},



		adminMessagesList : {
//ID will be 0 to start.
			init : function(MESSAGEID,_tag,Q)	{
				var r = 0;
				if(MESSAGEID || MESSAGEID === 0)	{
					this.dispatch(MESSAGEID,_tag,Q);
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminMessagesList, MESSAGEID not passed and is required.");
					}
				return r;
				},
			dispatch : function(MESSAGEID,_tag,Q)	{
				var obj = {};
				obj._cmd = 'adminMessagesList';
				obj.MESSAGEID = MESSAGEID;
				obj._tag = _tag || {};
				obj._tag.datapointer = 'adminMessagesList|'+MESSAGEID;
				app.model.addDispatchToQ(obj,Q || 'passive');
				}
			},


//get a list of newsletter subscription lists.
		adminNewsletterList : {
			init : function(_tag,Q)	{
				var r = 0;
				_tag = _tag || {}; 
				_tag.datapointer = "adminNewsletterList"
				if(app.model.fetchData('adminNewsletterList') == false)	{
					r = 1;
					this.dispatch(_tag,Q);
					}
				else	{
//					app.u.dump(' -> data is local');
					app.u.handleCallback(_tag);
					}
				return r;
				},
			dispatch : function(_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminNewsletterList","_tag" : _tag},Q || 'immutable');	
				}
			},//getNewsletters	


		adminPrivateSearch : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(!$isEmptyObject(obj))	{this.dispatch(obj,_tag,Q); r = 1;}
				else	{
					app.u.throwGMessage("In admin.calls.adminPrivateSearch, no query object passed.");
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = 'adminPrivateSearch';
				obj.mode = 'elastic-native';
				obj._tag = _tag || {};
				obj._tag.datapointer = 'adminPrivateSearch';
				app.model.addDispatchToQ(obj,Q);
				}
			}, //adminPrivateSearch



		adminOrderList : {
			init : function(obj,_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = "adminOrderList";
				if(app.model.fetchData(_tag.datapointer) == false)	{
					r = 1;
					this.dispatch(obj,_tag,Q);
					}
				else	{
					app.u.handleCallback(_tag);
					}
				return 1;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._tag = _tag;
				obj._cmd = "adminOrderList";
				app.model.addDispatchToQ(obj,Q);
				}
			}, //adminOrderList
//never look locally for data. Always make sure to load latest from server to ensure it's up to date.
//order info is critial
		adminOrderDetail : {
			init : function(orderID,_tag,Q)	{
				var r = 0;
				if(orderID)	{
					_tag = _tag || {};
					_tag.datapointer = "adminOrderDetail|"+orderID;
					if(app.model.fetchData(_tag.datapointer) == false)	{
						r = 1;
						this.dispatch(orderID,_tag,Q);
						}
					else	{
						app.u.handleCallback(_tag);
						}
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminOrderDetail, orderID not passed.");
					}
				return r;
				},
			dispatch : function(orderID,_tag,Q)	{
				var cmdObj = {};
				cmdObj.orderid = orderID;
				cmdObj._tag = _tag;
				cmdObj._cmd = "adminOrderDetail";
				app.model.addDispatchToQ(cmdObj,Q);
				}
			}, //adminOrderDetail
			
//do not store this. if you do, update order editor and be sure datapointer is orderid specific.
/*
This is also true for appPaymentMethods
if order total is zero, zero is only payment method.
if paypalEC is on order, only paypalEC shows up. (paypal restriction of payment and order MUST be equal)
if giftcard is on there, no paypal will appear.
*/
		adminOrderPaymentMethods	: {
			
			init : function(obj,_tag,Q)	{
				this.dispatch(obj,_tag,Q);
				return 1;
				},
			
			dispatch : function(obj,_tag,Q){
				obj._cmd = 'adminOrderPaymentMethods';
				obj._tag = _tag || {};
				obj._tag.datapointer = 'adminOrderPaymentMethods';
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			
			}, //adminOrderPaymentMethods
			
//updating an order is a critical function and should ALWAYS be immutable.
		adminOrderUpdate : {
			init : function(orderID,updates,_tag)	{
				var r = 0;
				if(orderID)	{
					this.dispatch(orderID,updates,_tag);
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminOrderUpdate, orderID not passed.");
					}
				return r;
				},
			dispatch : function(orderID,updates,_tag)	{
				cmdObj = {};
				cmdObj._cmd = 'adminOrderUpdate';
				cmdObj.orderid = orderID;
				cmdObj['@updates'] = updates;
				cmdObj._tag = _tag || {};
				app.model.addDispatchToQ(cmdObj,'immutable');
				}
			}, //adminOrderUpdate
		adminOrderSearch : {
			init : function(elasticObj, _tag, Q)	{
				this.dispatch(elasticObj,_tag,Q);
				return 1;
				},
			dispatch : function(elasticObj,_tag,Q){
				var obj = {};
				obj._cmd = "adminOrderSearch";
				obj.DETAIL = '9';
				obj.ELASTIC = elasticObj;
				obj._tag = _tag || {};
				obj._tag.datapointer = "adminOrderSearch";
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			}, //adminOrderSearch
		adminOrderPaymentAction	: {
			init : function(cmdObj,_tag)	{
				this.dispatch(cmdObj,_tag)
				return 1;
				},
			dispatch : function(cmdObj,_tag)	{
				cmdObj._cmd = 'adminOrderPaymentAction';
				cmdObj._tag = _tag || {};
				app.model.addDispatchToQ(cmdObj,'immutable');
				}
			}, //adminOrderPaymentAction


		adminPartnerSet : {
			init : function(obj,_tag)	{
				obj._cmd = 'adminPartnerSet'
				obj._tag = _tag || {};
				obj._tag.datapointer = "adminPartnerSet";
				app.model.addDispatchToQ(obj,'immutable');	
				}
			},


		adminProductCreate  : {
			init : function(pid,attribs,_tag)	{
				if(pid && !$.isEmptyObject(attribs))	{
					_tag = _tag || {};
					_tag.datapointer = "adminProductCreate|"+pid;
					app.model.addDispatchToQ({"_cmd":"adminProductCreate","_tag":_tag,"pid":pid,'%attribs':attribs},'immutable');	
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminProductCreate, either pid ["+pid+"] not set of attribs is empty.");
					}
				}
			}, //adminProductCreate
		adminProductManagementCategoryList : {
			init : function(_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = "adminProductManagementCategoryList";
				if(app.model.fetchData(_tag.datapointer) == false)	{
					this.dispatch(_tag,Q);
					}
				else	{
					app.u.handleCallback(_tag)
					}
				},
			dispatch : function(_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminProductManagementCategoriesComplete","_tag":_tag},Q);	
				}
			}, //adminProductManagementCategoryList
		adminProductUpdate : {
			init : function(pid,attribs,_tag)	{
				var r = 0;
				if(pid && !$.isEmptyObject(attribs))	{
					this.dispatch(pid,attribs,_tag)
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminProductUpdate, either pid ["+pid+"] not set of attribs is empty.");
					app.u.dump(attribs);
					}
				return r;
				},
			dispatch : function(pid,attribs,_tag)	{
				var obj = {};
				obj._cmd = "adminProductUpdate";
				obj._tag = _tag || {};
				obj.pid = pid;
				obj['%attribs'] = attribs;
				app.model.addDispatchToQ(obj,'immutable');
				}
			}, //adminProductUpdate

		adminSupplierCreate	: {
			
			init : function(obj,_tag,Q)	{
				this.dispatch(obj,_tag,Q);
				return 1;
				},
			
			dispatch : function(obj,_tag,Q){
				obj._cmd = 'adminSupplierCreate';
				obj._tag = _tag || {};
				obj._tag.datapointer = 'adminSupplierCreate';
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			
			}, //adminSupplierCreate

		adminSupplierItemList : {
			init : function(vendorid,_tag,Q)	{
				var r = 0;
				if(vendorid)	{
					_tag = _tag || {};
					_tag.datapointer = "adminSupplierItemList|"+vendorid;
					if(app.model.fetchData(_tag.datapointer) == false)	{
						r = 1;
						this.dispatch(vendorid,_tag,Q);
						}
					else	{
						app.u.handleCallback(_tag);
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminSupplierItemList, vendorid not passed","gMessage":true})
					}
				return r;
				},
			dispatch : function(vendorid,_tag,Q)	{
				app.model.addDispatchToQ({_cmd : "adminSupplierItemList",_tag:_tag,"VENDORID":vendorid},Q || mutable);
				}
			}, //adminSupplierItemList


		adminSupplierOrderList : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(obj && obj.VENDORID && obj.FILTER)	{
					_tag = _tag || {};
					_tag.datapointer = "adminSupplierOrderList|"+obj.VENDORID+"|"+obj.FILTER;
					if(app.model.fetchData(_tag.datapointer) == false)	{
						r = 1;
						this.dispatch(obj,_tag,Q);
						}
					else	{
						app.u.handleCallback(_tag);
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminSupplierOrderList, either FILTER or VENDORID not passed in param object","gMessage":true})
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "adminSupplierOrderList";
				obj._tag = _tag || {};
				app.model.addDispatchToQ(obj,Q || mutable);
				}
			}, //adminSupplierOrderList

		adminSupplierList : {
			init : function(_tag,Q)	{
				var r = 0;
				_tag = _tag || {};
				_tag.datapointer = "adminSupplierList";
				if(app.model.fetchData(_tag.datapointer) == false)	{
					r = 1;
					this.dispatch(_tag,Q);
					}
				else	{
					app.u.handleCallback(_tag);
					}
				return r;
				},
			dispatch : function(_tag,Q)	{
				app.model.addDispatchToQ({_cmd : "adminSupplierList",_tag:_tag},Q || mutable);
				}
			}, //adminSupplierList

//VENDORID = supplier id (CODE)
		adminSupplierDetail : {
			init : function(vendorid,_tag,Q)	{
				var r = 0;
				_tag = _tag || {};
				_tag.datapointer = "adminSupplierDetail|"+vendorid;
				if(app.model.fetchData(_tag.datapointer) == false)	{
					r = 1;
					this.dispatch(vendorid,_tag,Q);
					}
				else	{
					app.u.handleCallback(_tag);
					}
				return r;
				},
			dispatch : function(vendorid,_tag,Q)	{
				app.model.addDispatchToQ({_cmd : "adminSupplierDetail","VENDORID":vendorid,_tag:_tag},Q || mutable);
				}
			}, //adminSupplierList

			
// !!! not done. 
		adminSupplierUpdate	: {
			init : function(vendorid, updateObj,_tag,Q)	{
				var r = 0;
				if(vendorid && typeof updateObj == 'object')	{
					r = 1;
					this.dispatch(vendorid,updateObj,_tag,Q);
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminSupplierCreate, either vendorid ["+vendorid+"] or updateObj ["+typeof updateObj+"] not passed","gMessage":true});
					}
				return r;
				},
			
			dispatch : function(vendorid,updateObj,_tag,Q){
				obj._cmd = 'adminSupplierUpdate';
				obj.VENDORID = vendorid;
				obj._tag = _tag || {};
				obj._tag.datapointer = 'adminSupplierUpdate';
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			
			}, //adminSupplierCreate

		adminTaskList : {
			init : function(_tag,q)	{
				var r = 0; //what is returned. a 1 or a 0 based on # of dispatched entered into q.
				_tag = _tag || {};
				_tag.datapointer = "adminTaskList";
				if(app.model.fetchData(_tag.datapointer) == false)	{
					r = 1;
					this.dispatch(_tag,q);
					}
				else	{
					app.u.handleCallback(_tag);
					}
				return r;
				},
			dispatch : function(_tag,q)	{
				app.model.addDispatchToQ({"_cmd":"adminTaskList","_tag":_tag},q);	
				}
			}, //adminTaskList
		adminTaskCreate : {
			init : function(obj,_tag,q)	{
				this.dispatch(obj,_tag,q);
				return 1;
				},
			dispatch : function(obj,_tag,q)	{
				obj._cmd = "adminTaskCreate"
				obj._tag = _tag || {};
				obj._tag.datapointer = "adminTaskCreate";
				app.model.addDispatchToQ(obj,q);	
				}
			}, //adminTaskCreate
		adminTaskComplete : {
			init : function(taskid, _tag,q)	{
				this.dispatch(taskid, _tag,q);
				return 1;
				},
			dispatch : function(taskid, _tag,q)	{
				_tag = _tag || {};
				_tag.datapointer = "adminTaskComplete";
				app.model.addDispatchToQ({"taskid":taskid, "_cmd":"adminTaskComplete","_tag":_tag},q);	
				}
			}, //adminTaskComplete
		adminTaskRemove : {
			init : function(taskid, _tag,q)	{
				this.dispatch(taskid, _tag,q);
				return 1;
				},
			dispatch : function(taskid, _tag,q)	{
				_tag = _tag || {};
				_tag.datapointer = "adminTaskRemove";
				app.model.addDispatchToQ({"taskid":taskid, "_cmd":"adminTaskRemove","_tag":_tag},q);	
				}
			}, //adminTaskRemove
		adminTaskUpdate : {
			init : function(obj,_tag,q)	{
				this.dispatch(obj,_tag,q);
				return 1;
				},
			dispatch : function(obj,_tag,q)	{
				obj._tag = _tag || {};
				obj._tag.datapointer = "adminTaskUpdate|"+obj.taskid;
				obj._cmd = "adminTaskUpdate";
				app.model.addDispatchToQ(obj,q);	
				}
			}, //adminTaskUpdate


//obj accepts the following params: disposition, body, subject, callback, private and/or priority [low, med, warn]
		adminTicketCreate : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(obj && obj.body && obj.subject && obj.priority)	{
					this.dispatch(obj,_tag,Q);
					}
				else if(obj)	{
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminTicketCreate, a required param was left blank. body: ["+typeof obj.body+"]<br>subject: ["+obj.subject+"]<br>priority: ["+obj.priority+"]","gMessage":true});
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminTicketCreate, no variables/obj passed","gMessage":true});
					}
				
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "adminTicketCreate"
				obj._tag = _tag || {};
				obj._tag.datapointer = "adminTicketCreate";
				app.model.addDispatchToQ(obj,Q || 'immutable');	
				}
			}, //adminTicketCreate
		adminTicketDetail : {
			init : function(ticketid,_tag,Q)	{
				var r = 0;
				if(ticketid)	{
					this.dispatch(ticketid,_tag,Q);
					}
				else	{
					r = 0;
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminTicketDetail, no ticketID passed","gMessage":true});
					}
				return r;
				},
			dispatch : function(ticketid,_tag,Q)	{
				obj = {};
				obj._tag = _tag || {};
				obj._tag.datapointer = "adminTicketDetail|"+ticketid;
				obj._cmd = "adminTicketDetail";
				obj.ticketid = ticketid;
				app.model.addDispatchToQ(obj,Q || 'mutable');	
				}
			}, //adminTicketDetail

// @updates holds the macros.
// CLOSE -> no params
// APPEND -> pass note.

		adminTicketMacro : {
			init : function(ticketid,macro,_tag,Q)	{
				var r = 0;
				if(ticketid && typeof macro === 'object')	{
					r = 1;
					this.dispatch(ticketid,macro,_tag,Q);
					}
				else	{
					$('#gloobjbalMessaging').anymessage({"message":"In admin.calls.adminTicketCreate, either ticketid ["+ticketid+"] or macro ["+typeof macro+"] not defined.","gMessage":true});
					}
				return r;
				},
			dispatch : function(ticketid,macro,_tag,Q)	{
				var obj = {};
				obj._cmd = "adminTicketMacro"
				obj.ticketid = ticketid
				obj['@updates'] = macro;
				obj._tag = _tag || {};
				obj._tag.datapointer = "adminTicketMacro";
				app.model.addDispatchToQ(obj,Q || 'immutable');	
				}
			}, //adminTicketUpdate

//obj could contain a 'detail' level. values are open, all or waiting.
		adminTicketList : {
			init : function(obj,_tag,Q)	{
				var r = 0; //what is returned. a 1 or a 0 based on # of dispatched entered into q.
				_tag = _tag || {};
				_tag.datapointer = "adminTicketList";
				if(app.model.fetchData(_tag.datapointer) == false)	{
					r = 1;
					this.dispatch(obj,_tag,Q);
					}
				else	{
					app.u.handleCallback(_tag);
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj = obj || {};
				obj._tag = _tag;
				obj._cmd = "adminTicketList";
				app.model.addDispatchToQ(obj,Q);	
				}
			}, //adminTicketList


//obj requires panel and pid and sub.  sub can be LOAD or SAVE
		adminUIDomainPanelExecute : {
			init : function(obj,_tag,Q)	{
				_tag = _tag || {};
//save and load 'should' always have the same data, so the datapointer is shared.
				_tag.datapointer = "adminUIDomainPanelExecute|"+obj.domain+"|"+obj.verb;
				this.dispatch(obj,_tag,Q);
				},
			dispatch : function(obj,_tag,Q)	{
				obj['_cmd'] = "adminUIDomainPanelExecute";
				obj["_tag"] = _tag;
				app.model.addDispatchToQ(obj,Q);	
				}
			}, //adminUIProductPanelList


//obj requires panel and pid and sub.  sub can be LOAD or SAVE
/*
		adminUIExecuteCGI : {
			init : function(uri,vars,_tag,Q)	{
				var r = 0;
				if(uri)	{
					r = 1;
					_tag = _tag || {};
					this.dispatch(uri,vars,_tag,Q);
					}
				else	{
					$("#globalMessaging").anymessage({'message':'in adminUIExecuteCGI, uri not specified.','gMessage':true});
					}
				return r;
				},
			dispatch : function(uri,vars,_tag,Q)	{
				obj = {};
				obj['_cmd'] = "adminUIExecuteCGI";
				if(vars)	{obj['%vars'] = vars} //only pass vars if present. would be a form post.
				obj["_tag"] = _tag;
				app.model.addDispatchToQ(obj,Q || 'mutable');
				}
			}, //adminUIProductPanelList
*/

		adminUIProductPanelList : {
			init : function(pid,_tag,Q)	{
				var r = 0;
				if(pid)	{
					_tag = _tag || {};
					_tag.datapointer = "adminUIProductPanelList|"+pid;
					if(app.model.fetchData(_tag.datapointer) == false)	{
						r = 1;
						this.dispatch(pid,_tag,Q);
						}
					else	{
						app.u.handleCallback(_tag)
						}
					}
				else	{app.u.throwGMessage("In admin.calls.adminUIProductPanelList, no pid passed.")}
				return r;
				},
			dispatch : function(pid,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminUIProductPanelList","_tag":_tag,"pid":pid},Q);	
				}
			}, //adminUIProductPanelList
//obj requires sub and sref.  sub can be LOAD or SAVE
//reload is also supported.
		adminUIBuilderPanelExecute : {
			init : function(obj,_tag,Q)	{
				_tag = _tag || {};
				if(obj['sub'] == 'EDIT')	{
					_tag.datapointer = "adminUIBuilderPanelExecute|edit";
					}
				else if(obj['sub'] == 'SAVE')	{
					_tag.datapointer = "adminUIBuilderPanelExecute|save";
					}
				else	{
					//catch. some new verb or a format that doesn't require localStorage.
					}
				this.dispatch(obj,_tag,Q);
				},
			dispatch : function(obj,_tag,Q)	{
				obj['_cmd'] = "adminUIBuilderPanelExecute";
				obj['_SREF'] = sref;
				obj["_tag"] = _tag;
				app.model.addDispatchToQ(obj,Q);
				}
			}, //adminUIProductPanelList

//obj requires panel and pid and sub.  sub can be LOAD or SAVE
		adminUIProductPanelExecute : {
			init : function(obj,_tag,Q)	{
				if(obj && obj.panel && obj.pid && obj.sub)	{
					_tag = _tag || {};
//save and load 'should' always have the same data, so the datapointer is shared.
					if(obj['sub'])	{
						_tag.datapointer = "adminUIProductPanelExecute|"+obj.pid+"|load|"+obj.panel;
						}
					this.dispatch(obj,_tag,Q);
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminUIProductPanelExecute, required param (panel, pid or sub) left blank. see console."); app.u.dump(obj);
					}
				},
			dispatch : function(obj,_tag,Q)	{
				obj['_cmd'] = "adminUIProductPanelExecute";
				obj["_tag"] = _tag;
				app.model.addDispatchToQ(obj,Q);	
				}
			}, //adminUIProductPanelExecute



		adminWholesaleScheduleList : {
			init : function(_tag,q)	{
				var r = 0; //what is returned. a 1 or a 0 based on # of dispatched entered into q.
				_tag = _tag || {};
				_tag.datapointer = "adminWholesaleScheduleList";
				if(app.model.fetchData(_tag.datapointer) == false)	{
					r = 1;
					this.dispatch(_tag,q);
					}
				else	{
					app.u.handleCallback(_tag);
					}
				return r;
				},
			dispatch : function(_tag,q)	{
				app.model.addDispatchToQ({"_cmd":"adminWholesaleScheduleList","_tag":_tag},q);	
				}
			}, //adminWholesaleScheduleList
		adminWholesaleScheduleDetail : {
			init : function(scheduleID,_tag,q)	{
				var r = 0; //what is returned. a 1 or a 0 based on # of dispatched entered into q.
				_tag = _tag || {};
				_tag.datapointer = "adminWholesaleScheduleDetail|"+scheduleID;
				if(app.model.fetchData(_tag.datapointer) == false)	{
					r = 1;
					this.dispatch(_tag,q);
					}
				else	{
					app.u.handleCallback(_tag);
					}
				return r;
				},
			dispatch : function(scheduleID,_tag,q)	{
				app.model.addDispatchToQ({"_cmd":"adminWholesaleScheduleDetail","schedule":scheduleID,"_tag":_tag},q);	
				}
			}, //adminWholesaleScheduleList


//This will get a copy of the config.js file.
		appConfig : {
			init : function(_tag,Q)	{
				this.dispatch(_tag,Q);
				return 1;
				},
			dispatch : function(_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"appConfig","_tag" : _tag},Q);
				}			
			}, //appConfig


//obj.PATH = .cat.safe.id
		appPageGet : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(obj.PATH)	{
					_tag = _tag || {};
					_tag.datapointer = 'appPageGet|'+obj.PATH;  //no local storage of this. ### need to explore solutions.
					this.dispatch(obj,_tag,Q);
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.appPageGet, obj.path is required and was not specified.");
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "appPageGet";
				obj._tag = _tag;
				app.model.addDispatchToQ(obj,Q);
				}
			}, //appPageGet
		appPageSet : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(!$.isEmptyObject(obj))	{
					r = 1;
					_tag = _tag || {};
					this.dispatch(obj,_tag,Q);
					}
				else	{
					app.u.throwGMessage("In admin.calls.appPageSet, obj is empty.");
					}
				return 1;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = 'appPageSet';
				obj._tag = _tag;
				app.model.addDispatchToQ(obj,Q);
				}			
			}, //appPageSet


		appResource : {
			init : function(filename,_tag,Q)	{
				var r = 0;
				_tag = _tag || {};
				_tag.datapointer = "appResource|"+filename;

				if(app.model.fetchData(_tag.datapointer) == false)	{
					this.dispatch(filename,_tag,Q);
					r = 1;
					}
				else	{
					app.u.handleCallback(_tag);
					}
			
				return r;
				},
			dispatch : function(filename,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"appResource","filename":filename,"_tag" : _tag},Q);
				}
			}, //appResource


		authNewAccountCreate : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(typeof obj == 'object' && obj.email && obj.domain && obj.phone && obj.firstname && obj.lastname && obj.company)	{
					this.dispatch(obj,_tag,Q);
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.authNewAccountCreate, some required attributes were missing.");
					app.u.dump(" -> All of the fields in the form must be populated. obj follows: "); app.u.dump(obj);
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "authNewAccountCreate";
				obj._tag = _tag || {};
				_tag.datapointer = "authNewAccountCreate";
				app.model.addDispatchToQ(obj,Q);
				}
			},

		authPasswordReset : {
			init : function(login,_tag,Q)	{
				var r = 0;
				if(login)	{
					this.dispatch(login,_tag,Q);
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.authPasswordReset, login was not passed.");
					}
				return r;
				},
			dispatch : function(login,_tag,Q)	{
				var obj = {};
				obj.login = login;
				obj._cmd = "authPasswordReset";
				obj._tag = _tag || {};
				_tag.datapointer = "authPasswordReset";
				app.model.addDispatchToQ(obj,Q);
				}
			},




		finder : {
			
			adminNavcatProductInsert : {
				init : function(pid,position,path,tagObj)	{
					this.dispatch(pid,position,path,tagObj);
					return 1;
					},
				dispatch : function(pid,position,path,tagObj)	{
					var obj = {};
					obj['_tag'] = typeof tagObj == 'object' ? tagObj : {};
					obj['_cmd'] = "adminNavcatProductInsert";
					obj.pid = pid;
					obj.path = path;
					obj.position = position;
					obj['_tag'].datapointer = "adminNavcatProductInsert|"+path+"|"+pid;
					app.model.addDispatchToQ(obj,'immutable');	
					}
				}, //adminNavcatProductInsert
			
			adminNavcatProductDelete : {
				init : function(pid,path,tagObj)	{
					this.dispatch(pid,path,tagObj);
					},
				dispatch : function(pid,path,tagObj)	{
					var obj = {};
					obj['_tag'] = typeof tagObj == 'object' ? tagObj : {};
					obj['_cmd'] = "adminNavcatProductDelete";
					obj.pid = pid;
					obj.path = path;
					obj['_tag'].datapointer = "adminNavcatProductDelete|"+path+"|"+pid;
					app.model.addDispatchToQ(obj,'immutable');	
					}
				} //adminNavcatProductDelete
			
			}, //finder


		bossUserCreate : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				Q = Q || 'immutable';
				if(!$.isEmptyObject(obj))	{
					this.dispatch(obj,_tag,Q);
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.bossUserCreate, obj is empty.");
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = 'bossUserCreate';
				obj._tag = _tag || {};
				obj._tag.datapointer = 'bossUserCreate';
				app.model.addDispatchToQ(obj,Q);
				}
			},

		bossUserList : {
			init : function(_tag,Q)	{
				var r = 0;
				_tag = _tag || {};
				_tag.datapointer = 'bossUserList';
				if(app.model.fetchData(_tag.datapointer) == false)	{
					this.dispatch(_tag,Q);
					r = 1;
					}
				else	{
					app.u.handleCallback(_tag);
					}
				return r;
				},
			dispatch : function(_tag,Q)	{
				Q = Q || 'immutable';
				var obj = {_cmd : 'bossUserList'};
				obj._tag = _tag || {};
				obj._tag.datapointer = 'bossUserList';
				app.model.addDispatchToQ(obj,Q);
				}
			}, //bossUserList

		bossUserDetail : {
			init : function(luser,_tag,Q)	{
				var r = 0;
				Q = Q || 'immutable';
				_tag = _tag || {};
				_tag.datapointer = 'bossUserDetail|'+luser;
				if(luser)	{
					if(app.model.fetchData(_tag.datapointer) == false)	{
						r = 1;
						this.dispatch(luser,_tag,Q);
						}
					else	{
						app.u.handleCallback(_tag);
						}
					}
				else	{
					app.u.throwGMessage("In admin.calls.bossUserDetail, L user is undefined and required.");
					}
				return r;
				},
			dispatch : function(luser,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"bossUserDetail","login":luser,"_tag" : _tag},Q);
				}
			}, //bossUserDetail

		bossUserDelete : {
			init : function(luser,_tag,Q)	{
				var r = 0;
				Q = Q || 'immutable';
				if(luser)	{
					this.dispatch(luser,_tag,Q);
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.bossUserDelete, uid is undefined and required.");
					}
				return r;
				},
			dispatch : function(luser,_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = 'bossUserDelete|'+luser;
				app.model.addDispatchToQ({"_cmd":"bossUserDelete","login":luser,"_tag" : _tag},Q);
				}
			}, //bossUserDelete
		bossUserUpdate : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				Q = Q || 'immutable';
				if(!$.isEmptyObject(obj) && obj.luser)	{
					this.dispatch(obj,_tag,Q);
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.bossUserUpdate, obj is empty or obj.luser is not set.");
					app.u.dump(obj);
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = 'bossUserUpdate';
				obj._tag = _tag || {};
				obj._tag.datapointer = 'bossUserUpdate|'+obj.luser;
				app.model.addDispatchToQ(obj,Q);
				}
			},

		
		bossRoleList : {
			init : function(_tag,Q)	{
				var r = 0;
				_tag = _tag || {};
				_tag.datapointer = 'bossRoleList';
				if(app.model.fetchData(_tag.datapointer) == false)	{
					this.dispatch(_tag,Q);
					r = 1;
					}
				else	{
					app.u.handleCallback(_tag);
					}
				return r;
				},
			dispatch : function(_tag,Q)	{
				Q = Q || 'immutable';
				var obj = {_cmd : 'bossRoleList'};
				obj._tag = _tag;
				app.model.addDispatchToQ(obj,Q);
				}
			}, //bossRoleList
		
		helpSearch : {
			init : function(keywords,_tag,Q)	{
				app.u.dump("BEGIN admin.calls.helpSearch");
				app.u.dump(" -> keywords: "+keywords);
				var r = 0;
				if(keywords)	{
					_tag = _tag || {};
					_tag.datapointer = 'helpSearch|'+keywords;
					if(app.model.fetchData(_tag.datapointer) == false)	{
						this.dispatch(keywords,_tag,Q);
						r = 1;
						}
					else	{
						app.u.handleCallback(_tag);
						}
					}
				else	{
					app.u.throwGMessage("In admin.calls.helpSearch, keywords not specified.");
					}
				return 1;
				},
			dispatch : function(keywords,_tag,Q)	{
				app.model.addDispatchToQ({_cmd:'helpSearch','keywords':keywords,'_tag':_tag},Q || 'mutable');
				}
			}, //helpSearch

		helpDocumentGet : {
			init : function(docid,_tag,Q)	{
				if(docid)	{
					var r = 0;
					_tag = _tag || {};
					_tag.datapointer = 'helpDocumentGet|'+docid;
//					if(app.model.fetchData(_tag.datapointer) == false)	{
						this.dispatch(docid,_tag,Q);
//						r = 1;
//						}
//					else	{
//						app.u.handleCallback(_tag);
//						}
					}
				else	{
					app.u.throwGMessage("In admin.calls.helpDocumentGet, docid not specified.");
					}
				return r;
				},
			dispatch : function(docid,_tag,Q)	{
				app.model.addDispatchToQ({_cmd : 'helpDocumentGet','_tag':_tag,'docid':docid},Q || 'immutable');
				}
			} //helpDocumentGet
		}, //calls





					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\





	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration. Use this for any config or dependencies that need to occur.
//the callback is auto-executed as part of the extensions loading process.
		init : {
			onSuccess : function()	{
//				app.u.dump('BEGIN app.ext.admin.init.onSuccess ');
				var r = true; //return false if extension can't load. (no permissions, wrong type of session, etc)
//app.u.dump("DEBUG - template url is changed for local testing. add: ");
$('title').append(" - release: "+app.vars.release);
app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/templates.html',theseTemplates);


//SANITY - loading this file async causes a slight pop. but loading it inline caused the text to not show up till the file was done.
//this is the lesser of two weevils.
app.rq.push(['css',0,'https://fonts.googleapis.com/css?family=PT+Sans:400,700','google_pt_sans']);
app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/legacy_compat.js']);


/* used for html editor. */
app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/resources/jHtmlArea-0.7.5.ExamplePlusSource/style/jHtmlArea.ColorPickerMenu.css','jHtmlArea_ColorPickerMenu']);
app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/resources/jHtmlArea-0.7.5.ExamplePlusSource/style/jHtmlArea.css','jHtmlArea']);
//note - the editor.css file that comes with jhtmlarea is NOT needed. just sets the page bgcolor to black.

// colorpicker isn't loaded until jhtmlarea is done to avoid a js error due to load order.
app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jHtmlArea-0.7.5.ExamplePlusSource/scripts/jHtmlArea-0.7.5.min.js',function(){
	app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jHtmlArea-0.7.5.ExamplePlusSource/scripts/jHtmlArea.ColorPickerMenu-0.7.0.min.js'])
	}]);


				return r;
				},
			onError : function(d)	{
//init error handling handled by controller.				
				}
			}, //init

		

//executed when the extension loads
		initExtension : {
			onSuccess : function()	{
//				app.u.dump('BEGIN app.ext.admin.initUserInterface.onSuccess ');
				var L = app.rq.length-1;
//load any remaining resources into the app.
				for(var i = L; i >= 0; i -= 1)	{
					app.u.loadResourceFile(app.rq[i]);
					app.rq.splice(i, 1); //remove once handled.
					}
				app.rq.push = app.u.loadResourceFile; //reassign push function to auto-add the resource.

if(app.u.getBrowserInfo().substr(0,4) == 'msie' && parseFloat(navigator.appVersion.split("MSIE")[1]) < 10)	{
	app.u.throwMessage("<p>In an effort to provide the best user experience for you and to also keep our development team sane, we've opted to optimize our user interface for webkit based browsers. These include; Safari, Chrome and FireFox. Each of these are free and provide a better experience, including more diagnostics for us to maintain our own app framework.<\/p><p><b>Our store apps support IE8+<\/b><\/p>");
	}


//get list of domains and show chooser.
				var $domainChooser = $("<div \/>").attr({'id':'domainChooserDialog','title':'Choose a domain to work on'}).addClass('displayNone').appendTo('body');
				$domainChooser.dialog({
					'autoOpen':false,
					'modal':true,
					'width': '90%',
					'height': 500,
					'closeOnEscape': false,
					open: function(event, ui) {$(".ui-dialog-titlebar-close", $(this).parent()).hide();} //hide 'close' icon. will close on domain selection
					});


//make sure all the links in the header use the proper syntax.
				$('.bindByAnchor','#mastHead').each(function(){
					// app.u.dump("BEGIN #mastHead rewriteLink");
					app.ext.admin.u.rewriteLink($(this));
					})
//if supported, update hash while navigating.
// see handleHashState function for what this is and how it works.
				if("onhashchange" in window)	{ // does the browser support the hashchange event?
//					app.u.dump("WOOT! browser supports hashchange");
					_ignoreHashChange = false; //global var. when hash is changed from JS, set to true. see handleHashState for more info on this.
					window.onhashchange = function () {
//						app.u.dump("Hash has changed.");
						app.ext.admin.u.handleHashState();
						}
					}
	
//create shortcuts. these are used in backward compatibility areas where brian loads the content.
				window.navigateTo = app.ext.admin.a.navigateTo;
				window.showUI = app.ext.admin.a.showUI;
				window.loadElement = app.ext.admin.a.loadElement;
				window.prodlistEditorUpdate = app.ext.admin.a.uiProdlistEditorUpdate;
				window.changeDomain = app.ext.admin.a.changeDomain;
				window.linkOffSite = app.ext.admin.u.linkOffSite;
				window.adminUIDomainPanelExecute = app.ext.admin.u.adminUIDomainPanelExecute;
				window._ignoreHashChange = false; // see handleHashState to see what this does.


document.write = function(v){
	if(console && console.warn){
		console.warn("document.write was executed. That's bad mojo. Rewritten to $('body').append();");
		console.log("document.write contents: "+v);
		}
	$("body").append(v);
	}


var uriParams = {};
var ps = window.location.href; //param string. find a regex for this to clean it up.
if(ps.indexOf('?') >= 1)	{
	ps = ps.split('?')[1]; //ignore everything before the first questionmark.
	if(ps.indexOf('#') == 0){} //'could' happen if uri is ...admin.html?#doSomething. no params, so do nothing.
	else	{
		if(ps.indexOf('#') >= 1)	{ps = ps.split('#')[0]} //uri params should be before the #
//	app.u.dump(ps);
		uriParams = app.u.kvp2Array(ps);
		}
//	app.u.dump(uriParams);
	}

// app.u.dump(" -> uriParams"); app.u.dump(uriParams);
if(uriParams.trigger == 'adminPartnerSet')	{
	app.u.dump(" -> execute adminPartnerSet call");
	//Merchant is most likely returning to the app from a partner site for some sort of verification
	app.ext.admin.calls.adminPartnerSet.init(uriParams,{'callback':'showHeader','extension':'admin'});
	app.model.dispatchThis('immutable');
	}



if(app.vars.debug)	{
//	$('button','#debugPanel').button();
	var $DP = $('#debugPanel');
	$DP.show().find('.debugMenu').menu()
	$DP.append("<h6 class='clearfix'>debug: "+app.vars.debug+"</h6><h6 class='clearfix'>v: "+app.vars.release+"</h6><hr />");
	$('<input \/>').attr({'type':'text','placeholder':'destroy','size':'10'}).on('blur',function(){
		app.model.destroy($(this).val());
		app.u.dump("DEBUG: "+$(this).val()+" was just removed from memory and local storage");
		$(this).val('');
		}).appendTo($DP);
	$('#jtSectionTab').show();
	}


//app.u.dump("Is anycommerce? document.domain: "+document.domain+" and uriParams.anycommerce: ["+uriParams.anycommerce+"]");
	
//the zoovy branding is in place by default. override if on anycommerce.com OR if an anycommerce URI param is present (for debugging)
if(document.domain && document.domain.toLowerCase().indexOf('anycommerce') > -1)	{
	app.u.dump(" -> Treat as anycommerce");
	$('.logo img').attr('src','extensions/admin/images/anycommerce_logo-173x30.png');
	$('body').addClass('isAnyCommerce');
	}
else	{
	app.u.dump(" -> Treat as zoovy");
	$('body').addClass('isZoovy'); //displays all the Zoovy only content (will remain hidden for anyCommerce)
	}


//if user is logged in already (persistent login), take them directly to the UI. otherwise, have them log in.
//the code for handling the support login is in the thisisanadminsession function (looking at uri)
if(app.u.thisIsAnAdminSession())	{
	app.ext.admin.u.showHeader();
	}
else if(uriParams.show == 'acreate')	{
	app.ext.admin.u.handleAppEvents($('#createAccountContainer'));
	$('#appPreView').css('position','relative').animate({right:($('body').width() + $("#appPreView").width() + 100)},'slow','',function(){
		$("#appPreView").hide();
		$('#createAccountContainer').css({'left':'1000px','position':'relative'}).removeClass('displayNone').animate({'left':'0'},'slow');
		});
	}
else	{
	app.ext.admin.u.handleAppEvents($('#appLogin'));
	$('#appPreView').css('position','relative').animate({right:($('body').width() + $("#appPreView").width() + 100)},'slow','',function(){
		$("#appPreView").hide();
		$('#appLogin').css({'left':'1000px','position':'relative'}).removeClass('displayNone').animate({'left':'0'},'slow');
		});
	}





				}
			}, //initExtension






//very similar to the original translate selector in the control and intented to replace it. 
//This executes the handleAppEvents in addition to the normal translation.
//the selector also gets run through jqSelector and hideLoading (if declared) is run.
		translateSelector : {
			onSuccess : function(tagObj)	{
				app.u.dump("BEGIN callbacks.translateSelector");
//				app.u.dump(" -> tagObj: "); app.u.dump(tagObj);
				var selector = app.u.jqSelector(tagObj.selector[0],tagObj.selector.substring(1)); //this val is needed in string form for translateSelector.
//				app.u.dump(" -> selector: "+selector);
				var $target = $(selector);
//				app.u.dump(" -> $target.length: "+$target.length);
				if(typeof jQuery().hideLoading == 'function'){$target.hideLoading();}
				$target.removeClass('loadingBG'); //try to get rid of anything that uses loadingBG (cept prodlists) in favor of show/hideLoading()
				var data = app.data[tagObj.datapointer];
//merge allows for multiple datasets to be merged together prior to translation. use with caution.
				if(tagObj.merge && app.data[tagObj.merge])	{
					$.extend(data,app.data[tagObj.merge]);
					}
				app.renderFunctions.translateSelector(selector,app.data[tagObj.datapointer]);
				app.ext.admin.u.handleAppEvents($target);
				}
			}, //translateSelector



		showDataHTML : {
			onSuccess : function(tagObj)	{
//				app.u.dump("SUCCESS!"); app.u.dump(tagObj);
				$(app.u.jqSelector('#',tagObj.targetID)).removeClass('loadingBG').hideLoading().html(app.data[tagObj.datapointer].html); //.wrap("<form id='bob'>");
				}
			}, //showDataHTML


		handleLogout : {
			onSuccess : function(tagObj)	{
				document.location = '/app/latest/admin_logout.html'
				}
			},
//in cases where the content needs to be reloaded after making an API call, but when a showUI directly won't do (because of sequencing, perhaps)
//For example, after new files are added to a ticket (comatability mode), this is executed on a ping to update the page behind the modal.
		showUI : {
			onSuccess : function(tagObj)	{
				if(tagObj && tagObj.path){showUI(tagObj.path)
					}
				else {
					app.u.throwGMessage("Warning! Invalid path specified in _rtag on admin.callbacks.showUI.onSuccess.");
					app.u.dump("admin.callbacks.showUI.onSuccess tagObj (_rtag)");
					app.u.dump(tagObj);
					}
				}
			}, //showUI
		showDomainConfig : {
			onSuccess : function(){
				app.ext.admin.u.domainConfig();
				}
			},

		showElementEditorHTML : {
			onSuccess : function(tagObj)	{
//				app.u.dump("SUCCESS!"); app.u.dump(tagObj);
				var $target = $(app.u.jqSelector('#',tagObj.targetID))
				$target.parent().find('.ui-dialog-title').text(app.data[tagObj.datapointer]['prompt']); //add title to dialog.
				var $form = $("<form \/>").attr('id','editorForm'); //id used in product edit mode.
				$form.submit(function(event){
					event.preventDefault(); //do not post form.
					app.ext.admin.u.uiSaveBuilderElement($form,app.data[tagObj.datapointer].id,{'callback':'handleElementSave','extension':'admin','targetID':'elementEditorMessaging'})
					app.model.dispatchThis();
					return false;
					}).append(app.data[tagObj.datapointer].html);
				$form.append("<div class='marginTop center'><input type='submit' class='ui-state-active' value='Save' \/><\/div>");
				$target.removeClass('loadingBG').html($form);
				}
			}, //showElementEditorHTML


//executed after a 'save' is pushed for a specific element while editing in the builder.
		handleElementSave : {
			
			onSuccess : function(tagObj)	{
//First, let the user know the changes are saved.
				var msg = app.u.successMsgObject("Thank you, your changes are saved.");
				msg['_rtag'] = tagObj; //pass in tagObj as well, as that contains info for parentID.
				app.u.throwMessage(msg);

				if(app.ext.admin.vars.tab)	{
//					app.u.dump("GOT HERE! app.ext.admin.vars.tab: "+app.ext.admin.vars.tab);
					$(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')).empty().append(app.data[tagObj.datapointer].html)
					}			
				}
			}, //handleElementSave

		showHeader : {
			onSuccess : function(_rtag){
//				app.u.dump("BEGIN admin.callbacks.showHeader");
//				app.u.dump(" -> app.data["+_rtag.datapointer+"]:");	app.u.dump(app.data[_rtag.datapointer]);
//account was just created, skip domain chooser.
				if(app.data[_rtag.datapointer] && app.data[_rtag.datapointer].domain)	{
//					app.u.dump(" -> response contained a domain. use it to set the domain.");
					app.ext.admin.a.changeDomain(app.data[_rtag.datapointer].domain,0,'#!dashboard');
					}
				app.ext.admin.u.showHeader();
				},
			onError : function(responseData){
				app.u.throwMessage(responseData);
//				if(responseData.errid == "100")	{
//					app.u.throwMessage("This is most typically due to your system clock not being set correctly. For security, it must be set to both the correct time and timezone.");
//					} //this is the clock issue.
				$('body').hideLoading();
				}
			}, //showHeader

		handleDomainChooser : {
			onSuccess : function(tagObj){
				app.u.dump("BEGIN admin.callbacks.handleDomainChooser.onSuccess");
				var data = app.data[tagObj.datapointer]['@DOMAINS'];
				var $target = $(app.u.jqSelector('#',tagObj.targetID));
				$target.empty().append("<table class='fullWidth'><tr><td class='domainList valignTop'><\/td><td valignTop><iframe src='https://s3-us-west-1.amazonaws.com/admin-ui/ads/ad_300x250.html' class='fullWidth noBorders ad-300x250'><\/iframe><\/td><\/tr><\/table>");
				var L = data.length;
				$target.hideLoading();
				if(L)	{
					var $ul = $('#domainList'); //ul in modal.
	//modal has been opened on this visit.  Domain list still reloaded in case they've changed.
					if($ul.length)	{$ul.empty()} //user is changing domains.
	//first time modal has been viewed.
					else	{
						$ul = $("<ul \/>").attr('id','domainList');
						}

					for(var i = 0; i < L; i += 1)	{
						$("<li \/>").data(data[i]).addClass('lookLikeLink').addClass(data[i].id == app.vars.domain ? 'ui-selected' : '').append(data[i].id+" [prt: "+data[i].prt+"]").click(function(){
							app.ext.admin.a.changeDomain($(this).data('id'),$(this).data('prt'))
							$target.dialog('close');
							}).appendTo($ul);
						}
					$('.domainList',$target).append($ul);
					}
				else	{
//user has no domains on file. What to do?
					}
				},
			onError: function(responseData)	{
				var $target = $(app.u.jqSelector('#',responseData._rtag.targetID));
				$target.hideLoading();
				responseData.persistent = true;
				app.u.throwMessage(responseData);
				$target.append("<P>Something has gone very wrong. We apologize, but we were unable to load your list of domains. A domain is required.</p>");
				$("<button \/>").attr('title','Close Window').text('Close Window').click(function(){$target.dialog('close')}).button().appendTo($target);
				}
			}, //handleDomainChooser

		handleElasticFinderResults : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN admin.callbacks.handleElasticFinderResults.onSuccess.");
				var L = app.data[tagObj.datapointer]['_count'];
				$('#resultsKeyword').html(L+" results <span id='resultsListItemCount'></span>:");
//				app.u.dump(" -> Number Results: "+L);
				$parent = $(app.u.jqSelector('#',tagObj.parentID)).empty().removeClass('loadingBG')
				if(L == 0)	{
					$parent.append("Your query returned zero results.");
					}
				else	{
					var pid;//recycled shortcut to product id.
					for(var i = 0; i < L; i += 1)	{
						pid = app.data[tagObj.datapointer].hits.hits[i]['_id'];
//						app.u.dump(" -> "+i+" pid: "+pid);
						$parent.append(app.renderFunctions.transmogrify({'id':pid,'pid':pid},tagObj.templateID,app.data[tagObj.datapointer].hits.hits[i]['_source']));
						}
					app.ext.admin.u.filterFinderResults();
					}
				}
			}, //handleElasticFinderResults

//callback executed after the navcat data is retrieved. the u, does most of the work.
		addFinderToDom : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN admin.callback.addFinderToDom.success");
				var $target = $(app.u.jqSelector('#',tagObj.targetID));
//have to use attribs here to we make the switch to all data, otherwise 'data' gets set once, but not when attribs change. so the second instantiation of the finder will open the first product.
				app.ext.admin.u.addFinder(tagObj.targetID,{'findertype':$target.attr('data-findertype'),'path':$target.attr('data-path'),'attrib':$target.attr('data-attrib')});
				}
			}, //addFinderToDom

		
//when a finder for a product attribute is executed, this is the callback.
		pidFinderChangesSaved : {
			onSuccess : function(tagObj)	{
				app.u.dump("BEGIN admin.callbacks.pidFinderChangesSaved");
				$('#finderMessaging').anymessage({'message':'Your changes have been saved.','htmlid':'finderRequestResponse','uiIcon':'check','timeoutFunction':"$('#finderRequestResponse').slideUp(1000);"})
				app.ext.admin.u.changeFinderButtonsState('enable'); //make buttons clickable
				},
			onError : function(responseData)	{
				responseData.parentID = "finderMessaging";
				app.u.throwMessage(responseData);
				app.ext.admin.u.changeFinderButtonsState('enable');
				}
			
			}, //pidFinderChangesSaved
//when a finder for a category/list/etc is executed...

		finderChangesSaved : {
			onSuccess : function(tagObj)	{


app.u.dump("BEGIN admin.callbacks.finderChangesSaved");
var uCount = 0; //# of updates
var eCount = 0; //# of errros.
var eReport = ''; // a list of all the errors.

var $tmp;

$('#finderTargetList, #finderRemovedList').find("li[data-status]").each(function(){
	$tmp = $(this);
//	app.u.dump(" -> PID: "+$tmp.attr('data-pid')+" status: "+$tmp.attr('data-status'));
	if($tmp.attr('data-status') == 'complete')	{
		uCount += 1;
		$tmp.removeAttr('data-status'); //get rid of this so additional saves from same session are not impacted.
		}
	else if($tmp.attr('data-status') == 'error')	{
		eCount += 1;
		eReport += "<li>"+$tmp.attr('data-pid')+": "+app.data[$tmp.attr('data-pointer')].errmsg+" ("+app.data[$tmp.attr('data-pointer')].errid+"<\/li>";
		}
	});

app.u.dump(" -> items updated: "+uCount);
app.u.dump(" -> errors: "+eCount);
if(uCount > 0)	{
	$('#finderMessaging').anymessage({'message':'Items Updated: '+uCount,'htmlid':'finderRequestResponse','uiIcon':'check'})
	}

if(eCount > 0)	{
	$('#finderMessaging').anymessage({'message':eCount+' errors occured!<ul>'+eReport+'<\/ul>'});
	}

app.ext.admin.u.changeFinderButtonsState('enable'); //make buttons clickable



				},
			onError : function(responseData)	{
				responseData.parentID = "finderMessaging";
				app.u.throwMessage(responseData);
				app.ext.admin.u.changeFinderButtonsState('enable');
				}
			}, //finderChangesSaved
		
//callback is used for the product finder search results.
		showProdlist : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN admin.callbacks.showProdlist");
				if($.isEmptyObject(app.data[tagObj.datapointer]['@products']))	{
					$(app.u.jqSelector('#',tagObj.parentID)).empty().removeClass('loadingBG').append('Your search returned zero results');
					}
				else	{
//				app.u.dump(" -> parentID: "+tagObj.parentID);
//				app.u.dump(" -> datapointer: "+tagObj.datapointer);
				var numRequests = app.ext.store_prodlist.u.buildProductList({
"templateID":"adminProdStdForList",
"parentID":tagObj.parentID,
"items_per_page":100,
"csv":app.data[tagObj.datapointer]['@products']
					});
//				app.u.dump(" -> numRequests = "+numRequests);
					if(numRequests)
						app.model.dispatchThis();
					}
				}
			}, //showProdlist
		
			
//executed as part of a finder update for a category page. this is executed for each product.
//it simply changes the data-status appropriately, then the classback "finderChangesSaved" loops through the lists and handles messaging for all the updates.
		finderProductUpdate : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN admin.callbacks.finderProductUpdate.onSuccess");
//				app.u.dump(app.data[tagObj.datapointer]);
				var tmp = tagObj.datapointer.split('|'); // tmp1 is command and tmp1 is path and tmp2 is pid
				var targetID = tmp[0] == 'adminNavcatProductInsert' ? "finderTargetList" : "finderRemovedList";
				targetID += "_"+tmp[2];
//				app.u.dump(" -> targetID: "+targetID);
				$(app.u.jqSelector('#',targetID)).attr('data-status','complete');
				},
			onError : function(d)	{
//				app.u.dump("BEGIN admin.callbacks.finderProductUpdate.onError");
				var tmp = app.data[tagObj.datapointer].split('|'); // tmp0 is call, tmp1 is path and tmp2 is pid
//on an insert, the li will be in finderTargetList... but on a remove, the li will be in finderRemovedList_...
				var targetID = tmp[0] == 'adminNavcatProductInsert' ? "finderTargetList" : "finderRemovedList";
				
				targetID += "_"+tmp[2];
				$(app.u.jqSelector('#',targetID)).attr({'data-status':'error','data-pointer':tagObj.datapointer});
//				app.u.dump(d);
				}
			}, //finderProductUpdate




		filterFinderSearchResults : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN admin.callbacks.filterFinderSearchResults");
				var safePath = app.u.makeSafeHTMLId(tagObj.path);
				var $tmp;
//				app.u.dump(" -> safePath: "+safePath);
				//go through the results and if they are already in this category, disable drag n drop.
				$results = $('#finderSearchResults');
				//.find( "li" ).addClass( "ui-corner-all" ) )

				$results.find('li').each(function(){
					$tmp = $(this);
					if($('#finderTargetList_'+$tmp.attr('data-pid')).length > 0)	{
				//		app.u.dump(" -> MATCH! disable dragging.");
						$tmp.addClass('ui-state-disabled');
						}
					})
				}
			}, //filterFinderSearchResults

		handleMessaging : {
			onSuccess : function(_rtag)	{
//				app.u.dump("BEGIN admin.callbacks.handleMessaging");
				if(app.data[_rtag.datapointer] && app.data[_rtag.datapointer]['@MSGS'] && app.data[_rtag.datapointer]['@MSGS'].length)	{
					
					var L = app.data[_rtag.datapointer]['@MSGS'].length,
					$tbody = $("[data-app-role='messagesContainer']",'#messagesContent');
					
					for(var i = 0; i < L; i += 1)	{
						$tbody.anycontent({
							'templateID':'messageListTemplate',
							'dataAttribs':{'index':i,'datapointer':_rtag.datapointer}, //used in detail view to find data src
							'data':app.data[_rtag.datapointer]['@MSGS'][i]
							});
						}
					app.u.handleAppEvents($tbody);
					}
				else	{} //no new messages.
				
				app.ext.admin.u.updateMessageCount(); //update count whether new messages or not, in case the count is off.
				
				//add another request. this means with each immutable dispatch, messages get updated.
				app.ext.admin.calls.adminMessagesList.init(app.ext.admin.u.getLastMessageID(),{'callback':'handleMessaging','extension':'admin'},'immutable');
				},
			onError : function()	{
				//no error display.
				//should we add another dispatch? Let's see what happens. ???
				}		
			}

		}, //callbacks



////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


	renderFormats : {

		reportID2Pretty : function($tag,data)	{
			var lookupTable = {
				OGMS : 'Total sales',
				OWEB : 'Web sales',
				OGRT : 'Return customers',
				OEXP : 'Expedited',
				SAMZ : 'Amazon',
				SGOO : 'Google',
				SEBA : 'eBay auction',
				SEBF : 'eBay fixed price',
				SSRS : 'Sears',
				SBYS : 'Buy.com'
				}

			$tag.append(lookupTable[data.value] || data.value); //if no translation, display report id.
			},


//used for adding email message types to a select menu.
//designed for use with the vars object returned by a adminEmailList _cmd
		emailMessagesListOptions : function($tag,data)	{
			var L = data.value.length;
//adminEmailListIndex below is used to lookup by index the message in the list object.
			for(var i = 0; i < L; i += 1)	{
				$tag.append($("<option \/>").val(data.value[i].MSGID).text(data.value[i].MSGTITLE).data({'MSGID':data.value[i].MSGID,'adminEmailListIndex':i}));
				}
			},


//very simple data to list function. no template needed (or allowed. use processList for that).
		array2ListItems : function($tag,data)	{
			var L = data.value.length;

			var $o = $("<ul />"); //what is appended to tag. 
			for(var i = 0; i < L; i += 1)	{
				$o.append("<li>"+data.value[i]+"<\/li>");
				}
			$tag.append($o.children());
			},
		arrayLength : function($tag,data)	{
			$tag.text(data.value.length);
			},
		showTrueIfSet : function($tag,data)	{
			$tag.text('true') //won't get into renderFormat if not populated.
			},

//a value, such as media library folder name, may be a path (my/folder/name) and a specific value from that string may be needed.
//set bindData.splitter and the value gets split on that character.
//optionally, set bindData.index to get a specific indices value (0,1, etc). if index is not declared, the last index is returned.
		getIndexOfSplit : function($tag, data){
			var splitter = data.bindData['splitter'];
			if(data.value.indexOf(splitter) > -1)	{
				var splitVal = data.value.split(splitter);
				data.value = splitVal[data.bindData.index || splitVal.length - 1]
				}
			else	{} //no split is occuring. do nothing.
			app.renderFormats.text($tag, data)
			}
		}, //renderFormats





////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		a : {

//tmp while in dev so pushes can occur without UI being impacted.
//opts is options (options is a reserved JS name)
// -> opts.targetID is used within the function, but is not an accepted paramater (at this time) for being passed in.
//    it's in opts to make debugging easier.

			showUI : function(path,opts){
//make sure path passed in conforms to standard naming conventions.
// app.u.dump("BEGIN admin.a.showUI ["+path+"]");
				opts = opts || {}; //default to object so setting params within does not cause error.
				if(path)	{
//mode is either app or legacy. mode is required and generated based on path.
					var mode = undefined;
					if(path.substr(0,5) == "/biz/") {mode = 'legacy'}
					if(path.substr(0,6) == "#/biz/") {mode = 'legacy'}
					else if(path.substr(0,2) == "#:")	{
//						app.u.dump(" -> is #:");
						$('#ordersContent').empty(); //always get new content for orders.
						mode = 'tabClick';
						opts.tab = opts.tab || path.substring(2);
						path = "/biz/"+path.substring(2)+"/index.cgi";
//						app.u.dump(" -> opts:"); app.u.dump(opts);
						} //path gets changed, so a separate mode is used for tracking when reloadTab is needed.
					else if (path.substr(0,2) == "#!") {mode = 'app'}
					else	{}
					
					if(mode)	{

//app.u.dump(" -> mode: "+mode);
//app.u.dump(" -> path: "+path);

var reloadTab = 0; //used in conjunction with #: to determine if new or old contens should be displayed.
var $target = undefined; //jquery object of content destination

opts = opts || {}; //opts may b empty. treat as object.

_ignoreHashChange = true; //see handleHashChange for details on what this does.
document.location.hash = path; //update hash on URI.

//app.u.dump(" -> opts: "); app.u.dump(opts);

//if necessary get opt.tab defined. If at the end of code opt.tab is set, a tab will be brought into focus (in the header).
if(opts.tab){} // if tab is specified, always use it.
else if(mode == 'app')	{} //apps load into whatever content area is open, unless opt.tab is defined.
else if(opts.dialog)	{} //dialogs do not effect tab, unless opt.tab is defined.
else if(mode == 'legacy' || mode == 'tabClick'){
	opts.tab = app.ext.admin.u.getTabFromPath(path);
	} //#: denotes to open a tab, but not refresh the content.
else	{
	//hhmm. how did we get here?
	}

if(opts.tab)	{app.ext.admin.u.bringTabIntoFocus(opts.tab);} //changes which tab in the header is in focus.
else	{} //do nothing. perfectly normal to not change what tab is in focus.


//app.u.dump(" -> passed if/else tab determination code. tab: "+opts.tab);

//set the targetID and $target for the content. 
// By now, tab will be set IF tab is needed. (dialog and/or app mode support no tab specification)
//this is JUST setting targetID. it isn't showing content or opening modals.
if(opts.dialog){
	opts.targetID = 'uiDialog';
	$target = app.ext.admin.u.handleCompatModeDialog(opts); //jquery object is returned by this function.
	}
//load content into whatever tab is specified.
else if(opts.tab)	{
	opts.targetID = opts.tab+"Content";
	$target = $(app.u.jqSelector('#',opts.targetID));

//this is for the left side tab that appears in the orders/product interface after perfoming a search and navigating to a result.
	if(opts.tab != 'orders')	{
		app.ext.admin_orders.u.handleOrderListTab('deactivate');
		}
	if(opts.tab != 'product')	{
		app.ext.admin_prodEdit.u.handleProductListTab('deactivate');
		}
	if(opts.tab != 'reports')	{
		$('#batchJobsStickyTab').stickytab('destroy');
		}
	
	}
//no tab was specified. use the open tab, if it's set.
else if(app.ext.admin.vars.tab)	{
	opts.targetID = app.ext.admin.vars.tab+"Content";
	$target = $(app.u.jqSelector('#',opts.targetID));
	} //load into currently open tab. common for apps.
else	{
	//not in an app. no tab specified. not in modal. odd. how did we get here? No $target will be set. error handling occurs in if($target) check below.
	}


//app.u.dump(" -> $target determined.");

if($target && $target.length)	{
	if(opts.dialog)	{
		app.ext.admin.u.handleShowSection(path,opts,$target); 
		}
	else	{
		app.ext.admin.u.bringTabContentIntoFocus($target); //will make sure $target is visible. if already visible, no harm.
		if(mode == 'app')	{
			app.ext.admin.u.loadNativeApp(path,opts);
			}
		else if(mode == 'legacy')	{
			app.ext.admin.u.handleShowSection(path,opts,$target);
			}
		else if(mode == 'tabClick')	{
//determine whether new content is needed or not. typically, #: is only run from a tab so that when returning to  the tab, the last open content shows up.
			if(opts.tab == app.ext.admin.vars.tab)	{reloadTab = 1; } //tab clicked from a page within that tab. show new content.
			if ($target.children().length === 0)	{ reloadTab = 1; } //no content presently in target. load it.
			if(reloadTab)	{app.ext.admin.u.handleShowSection(path,opts,$target);}
			else	{} //show existing content. content area is already visible thanks to bringTabContentIntoFocus
			}
		else	{}// should never get here. error case for mode not being set is already passed.
		if(opts.tab)	{app.ext.admin.vars.tab = opts.tab;} //do this last so that the previously selected tab can be referenced, if needed.
		}
	}
else	{
	app.u.throwGMessage("Warning! In in showUI, insuffient data available to determine where content should be displayed. likely no 'tab' was specified or vars.tab is not set.");
	}
						} //end 'if' for mode.
					else	{
						app.u.throwGMessage("Warning! unable to determine 'mode' in admin.a.showUI. path: "+path);	
						}
					
					}
				else	{
					app.u.throwGMessage("Warning! path not set for admin.a.showUI");
					}
//app.u.dump(" -> END showUI. ");
				return false;
				}, //showUI
//this is a function that brian has in the UI on some buttons.
//it's diferent than showUI so we can add extra functionality if needed.
//the app itself should never use this function.
			navigateTo : function(path,$t)	{
				return this.showUI(path,$t ? $t : {});
				},





			showMailTool : function(vars)	{
vars = vars || {};



if(vars.listType && vars.partition)	{
//listType must match one of these. an array is used because there will be more types:
//  'TICKET','PRODUCT','ACCOUNT','SUPPLY','INCOMPLETE'
	var types = ['ORDER','CUSTOMER']; 
	if(types.indexOf(vars.listType) >= 0)	{

		var $mailTool = $('#mailTool');
		if($mailTool.length)	{
			$mailTool.empty();
			}
		else	{
			$mailTool = $("<div \/>",{'id':'mailTool','title':'Send Email'}).appendTo("body");
			$mailTool.dialog({'width':500,'height':500,'autoOpen':false,'modal':true});
			}

		$mailTool.dialog('open');

		$mailTool.showLoading({'message':'Fetching list of email messages/content'});
		app.ext.admin.calls.adminEmailList.init({'TYPE':vars.listType,'PRT':vars.partition},{'callback':function(rd){
			$mailTool.hideLoading();
			if(app.model.responseHasErrors(rd)){
				$mailTool.anymessage({'message':rd})
				}
			else	{
				$mailTool.anycontent({'templateID':'mailToolTemplate','datapointer':rd.datapointer,'dataAttribs':{'adminemaillist-datapointer':rd.datapointer}});
				app.u.handleAppEvents($mailTool,vars);
				}
			}},'mutable');
		app.model.dispatchThis('mutable');
		
		}
	else	{
		$('#globalMessaging').anymessage({'gMessage':true,'message':'In admin.a.showMailTool, invalid listType ['+vars.listType+'] or partition ['+vars.partition+'] specified.'})
		}

//will open dialog so users can send a custom message (content 'can' be based on existing message) to the user. order specific.
//though not a modal, only one can be open at a time.
/*			if(orderID && Number(prt) >= 0)	{
	
				app.ext.admin.calls.adminEmailList.init({'TYPE':'ORDER','PRT':prt},{'callback':function(rd){
					$target.hideLoading();
					if(app.model.responseHasErrors(rd)){
						if(rd._rtag && rd._rtag.selector)	{
							$(app.u.jqSelector(rd._rtag.selector[0],rd._rtag.selector.substring(1))).empty();
							}
						app.u.throwMessage(rd);
						}
					else	{
						$target.append(app.renderFunctions.transmogrify({'adminemaillist-datapointer':'adminEmailList|'+prt+'|ORDER','orderid':orderID,'prt':prt},'orderEmailCustomMessageTemplate',app.data[rd.datapointer]));
						app.ext.admin.u.handleAppEvents($target);
						}
		
					}},'mutable');
				app.model.dispatchThis('mutable');
				}
			else	{
				app.u.throwGMessage("In admin_orders.a.showCustomMailEditor, orderid ["+orderID+"] or partition ["+prt+"] not passed and both are required.");
				}
*/
	}
else	{
	$('#globalMessaging').anymessage({'gMessage':true,'message':'In admin.a.showMailTool, no listType specified.'})
	}
				
				
				},


/* loading content and adding a new 'page' */

/*
load page looks in app.ext.admin.pages to see if a 'page' exists.
pages only exists for apps. the absense of a page in the page object will be treated as legacy compatibility.
vars allows for overrides of default page variables. Out of the gate, tab will be supported. don't know about any others.
 -> tab being set determines whether breadcrumb and navtabs are reset. no tab, no reset. allows pages to be loaded inside another tab.
 -> set vars.tab to 'current' to open page in current tab/tabcontent.

			loadPage : function(pageID,vars)	{
				var pages = app.ext.admin.pages; //shortcut
				if(pageID && pages[pageID])	{
					
					}
				else if(pageID)	{
					//pageID set, but does not exists in pages var. report error.
					}
				else	{
					//no pageID passed. report error.
					}
				},

			addPage : function(pageID,obj){
				if(pageID && typeof obj === 'object' && typeof obj.exec === 'function'){
					var pages = app.ext.admin.pages;
					if(!pages[pageID])	{
						//required vars present
						pages[pageID] = obj;
						}
					else	{
						//HHmmmmmm... do we allow pages to be overwritten?
						}
					}
				else	{
					//page ID and obj.exec as a function are required.
					}
				
				},
*/

/*
HEADER CODE
*/

// iconState is optional. if defined, will show or hide icons based on value (show or hide).
// if iconState is not defined, then the function behaves like a toggle.
// the value returned is boolen. t for icons are showing and f for icons are hidden.
			toggleHeaderTabHeight : function(iconState)	{
				var $target = $('.mhTabsContainer ul','#mastHead'),
				r;
				if(iconState == 'show' || $target.hasClass('hideIcons'))	{
					$('.toggleArrow').html("&#9650;");
					$target.removeClass('hideIcons').addClass('showIcons');
					r = true;
					}
				else	{
					$('.toggleArrow').html("&#9660;");
					$target.removeClass('showIcons').addClass('hideIcons');
					r = false;
					}
			//if the messages pane is open, adjust it's position accordingly.
				if($('#messagesContent').is(':visible'))	{
					$('#messagesContent').css('top',$('#messagesContent').parent().height());
					}
				return r;
				},



/*
A generic form handler. 
$form is a jquery object of the form.
Either _cmd or call must be set in the form data (as hidden, for instance).
 -> _cmd will take the entire serialized form into a dispatch (see note on _tag below).
 -> call should be formatted as extension/call (ex: admin_task/adminTaskUpdate)
If you want to set any _tag attributes, set them as hidden inputs, like so:  <input type='hidden' name='_tag/something' value='someval'> 
 -> these would get formatted as _tag : {'something':'someval'}

Execute your own dispatch. This allows the function to be more versatile
set as onSubmit="app.ext.admin.a.processForm($(this)); app.model.dispatchThis('mutable'); return false;"
 -> if data-q is set to passive or immutable, change the value of dispatchThis to match.
*/
			processForm : function($form,q)	{
				var obj = $form.serializeJSON() || {};
				if($form.length && (obj._cmd || obj.call))	{
//						app.u.dump(" -> admin.a.processForm data attributes: "); app.u.dump(data);
					var _tag = {};
//build the _tag obj.
					for(var key in obj)	{
						if(key.substring(0,5) == "_tag/")	{
							_tag[key.substring(5)] = obj[key];//_tag/ must be stripped from key.
							delete obj[key]; //remove from object so it isn't part of query.
							}
						else{}
						}
					app.u.dump(" -> _tag in processForm: "); app.u.dump(_tag);
					if(obj._cmd)	{
						obj._tag = _tag; //when adding straight to Q, _tag should be a param in the cmd object.
						app.model.addDispatchToQ(obj,q);
						}
					else if(obj.call)	{
						var call = obj.call; //save to another var. obj.call needs to be deleted so it isn't passed in dispatch.
						delete obj.call;
						app.u.dump(" -> call: "+call);
						app.ext.admin.calls[call.split('/')[1]].init(obj,_tag,q)
						}
					else{} //can't get here. either cmd or call are set by now.
					
					}
				else	{
					app.u.throwGMessage("Warning! $form was empty or _cmd or call not present within $form in admin.a.processForm");
					}
				}, //processForm
				
			showDomainConfig : function(){
				$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).empty().showLoading({"message":"Requesting up to date list of domains."});
				app.ext.admin.calls.adminDomainList.init({'callback':'showDomainConfig','extension':'admin'},'immutable');
				app.model.dispatchThis('immutable')
				},
			
//pass in a domain and an attr
//ex: pass in prt and the partition is returned.
			getDataForDomain : function(domain,attr)	{
				var r = false; //what is returned. will be value, if available.
				var data = app.data['adminDomainList']['@DOMAINS']; //shortcut
				var L = data.length;
				for(var i = 0; i < L; i += 1)	{
					if(data[i].id == domain){
						r = data[i][attr];
						break; //once a match is found, exit.
						}
					else{} //catch.
					}
				return r;
				}, //getDataForDomain


//host is www.zoovy.com.  domain is zoovy.com or m.zoovy.com.  This function wants a domain.
//changeDomain(domain,partition,path). partition and path are optional. If you have the partition, pass it to avoid me looking it up.
			changeDomain : function(domain,partition,path){
				if(domain)	{
					app.vars.domain = domain;

					$('.domain','#appView').text(domain);
//					app.rq.push(['script',0,'http://'+domain+'/jquery/config.js']); //load zGlobals. saves over existing values.
					if(Number(partition) >= 0){
						}
					else	{
						partition = app.ext.admin.a.getDataForDomain(domain,'prt');
						}
					
					app.vars.https_domain = app.ext.admin.a.getDataForDomain(domain,'https');
					app.vars.partition = partition;
					$('.partition','#appView').text(partition || "");
	//get entire auth localstorage var (flattened on save, so entire object must be retrieved and saved)
	//something here is causing session to not persist on reload.
					if(app.model.fetchData('authAdminLogin'))	{
						var localVars = app.data['authAdminLogin'];
						localVars.domain = domain;
						localVars.partition = partition || null;
						app.storageFunctions.writeLocal('authAdminLogin',localVars);
						}
//					app.u.dump(" -> path: "+path);
					showUI(app.ext.admin.u.whatPageToShow(path || '/biz/setup/index.cgi'));
					}
				else	{
					app.u.throwGMessage("WARNING! admin.a.changeDomain required param 'domain' not passed. Yeah, can't change the domain without a domain.");
					}

				}, //changeDomain

//used in the builder for when 'edit' is clicked on an element.
//Params are set by B. This is for legacy support in the UI.

			loadElement : function(type,eleID){
				
				app.ext.admin.calls.adminUIBuilderPanelExecute.init({'sub':'EDIT','id':eleID},{'callback':'showElementEditorHTML','extension':'admin','targetID':'elementEditorContent'});
				app.model.dispatchThis();
				var $editor = $('#elementEditor');
				if($editor.length)	{
					$('#elementEditorMessaging',$editor).empty(); //modal already exists. empty previous content. Currently, one editor at a time.
					$('#elementEditorContent',$editor).empty().addClass('loadingBG');
					} 
				else	{
					$editor = $("<div \/>").attr('id','elementEditor').appendTo('body');
//within the editor, separate messaging/content elements are created so that one can be updated without affecting the other.
//especially impotant on a save where the messaging may get updated and the editor too, and you don't want to nuke the messaging on content update,
// which would happen if only one div was present.
					$editor.append("<div id='elementEditorMessaging'><\/div><div id='elementEditorContent' class='loadingBG'><\/div>").dialog({autoOpen:false,dialog:true, width: 500, height:500,modal:true});
					}
				$editor.dialog('open');
				}, //loadElement

//run on a select list inside 'edit' for a product list element.
//various select lists change what other options are available.
//t is 'this' from the select.
//ID is the element ID

			uiProdlistEditorUpdate : function(t,ID)	{
				app.ext.admin.u.uiSaveBuilderElement($("#editorForm"),ID,{'callback':'showMessaging','targetID':'elementEditorMessaging','message':'Saved. Panel updated to reflect new choices.'});
				app.ext.admin.calls.adminUIBuilderPanelExecute.init({'sub':'EDIT','id':ID},{'callback':'showElementEditorHTML','extension':'admin','targetID':'elementEditorContent'});
				app.model.dispatchThis();
				$('#elementEditorContent').empty().append("<div class='loadingBG'><\/div>");
				
				}, //uiProdlistEditorUpdate

/*

##############################    PRODUCT FINDER

to generate an instance of the finder, run: 
app.ext.admin.a.addFinderTo() passing in targetID (the element you want the finder appended to) and path (a cat safe id or list id)
currently, executing this function directly is not supported. use the showFinderInModal.
once multiple instances of the finder can be opened at one time, this will get used more.
*/
			addFinderTo : function(targetID,vars)	{
				app.u.dump("BEGIN admin.a.addFinderTo('"+targetID+"')"); app.u.dump(vars);
				$(app.u.jqSelector('#',targetID)).parent().find('.ui-dialog-title').text('loading...'); //empty the title early to avoid confusion.
				if(vars.findertype == 'PRODUCT')	{
					app.ext.store_product.calls.appProductGet.init(vars.path,{"callback":"addFinderToDom","extension":"admin","targetID":targetID,"path":vars.path})
					}
				else if(vars.findertype == 'NAVCAT')	{
//Too many f'ing issues with using a local copy of the cat data.
					app.model.destroy('appCategoryDetail|'+vars.path);
					app.calls.appCategoryDetail.init({'safe':vars.path,'detail':'fast'},{"callback":"addFinderToDom","extension":"admin","targetID":targetID})
					}
				else if(vars.findertype == 'CHOOSER')	{
					app.ext.admin.u.addFinder(targetID,vars);
					$(app.u.jqSelector('#',targetID)).parent().find('.ui-dialog-title').text('Product Chooser'); //updates modal title
					}
				else if(vars.findertype == 'PAGE')	{
					$('#finderTargetList').show();
					app.ext.admin.calls.appPageGet.init({'PATH':vars.path,'@get':[vars.attrib]},{"attrib":vars.attrib,"path":vars.path,"callback":"addFinderToDom","extension":"admin","targetID":targetID})			
					}
				else	{
					app.u.throwGMessage("Warning! Type param for admin.a.addFinderTo is invalid. ["+vars.findertype+"]");
					}
				app.model.dispatchThis();
				}, //addFinderTo
//path - category safe id or product attribute in data-bind format:    product(zoovy:accessory_products)
//vars is for variables. eventually, path and attrib should be move into the vars object.
//vars will be used to contain all the 'chooser' variables.
			showFinderInModal : function(findertype,path,attrib,vars)	{
				if(findertype)	{
					var $finderModal = $('#prodFinder'),
					vars = vars || {};
//a finder has already been opened. empty it.
					if($finderModal.length > 0)	{
						$finderModal.empty();
						$finderModal.attr({'data-findertype':'','data-path':'','data-attrib':''}); //make sure settings from last product are not used.
						}
					else	{
						$finderModal = $('<div \/>').attr({'id':'prodFinder','title':'Product Finder'}).appendTo('body');
						}
//merge the string based vars into the object so that we have 1 src for all the vars.
					if(path && !vars.path)	{vars.path = path} else {}
					if(attrib && !vars.attrib)	{vars.attrib = attrib} else {}
					if(findertype && !vars.findertype)	{vars.findertype = findertype} else {}

//set the following vars as attributes. at the time the finder was built, didn't have a good understanding of .data().
//eventually, everything will get moved over to .data();
					$finderModal.attr({'data-findertype':findertype,'data-path':path,'data-attrib':attrib});
					
					$finderModal.dialog({modal:true,width:'94%',height:650});
					app.ext.admin.a.addFinderTo('prodFinder',vars);
					}
				else	{
					app.u.throwGMessage("In admin.u.showFinderInModal, findertype not specified.");
					}
				}, //showFinderInModal

			login : function($form){
				$('body').showLoading({"message":"Authenticating credentials. One moment please."});
				app.calls.authAdminLogin.init($form.serializeJSON(),{'callback':'showHeader','extension':'admin'},'immutable');
				app.model.dispatchThis('immutable');
				}, //login

			logout : function(){
				$('body').showLoading({"message":"You are being logged out. One moment please."});
				app.calls.authAdminLogout.init({'callback':'handleLogout','extension':'admin'});//always immutable.
				app.model.dispatchThis('immutable');
//nuke all this after the request so that the dispatch has the info it needs.
				app.ext.admin.u.selectivelyNukeLocalStorage(); //get rid of most local storage content. This will reduce issues for users with multiple accounts.
				app.model.destroy('authAdminLogin'); //clears this out of memory and local storage. This would get used during the controller init to validate the session.

				}, //logout

			showAchievementList : function($target)	{
				if($target && $target.length)	{
					$target.show().append(app.renderFunctions.createTemplateInstance('achievementsListTemplate',{}));
					app.ext.admin.u.handleAppEvents($target);
					}
				else	{
					app.u.throwGMessage("In admin.a.showAchievementsList, $target is not specified or has no length.");
					}				
				},

			showAppChooser : function()	{
				var $target = $(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content'));
				$target.empty().append(app.renderFunctions.createTemplateInstance('pageTemplateSetupAppchooser',{}));
				app.ext.admin.u.handleAppEvents($target);
				},



//opens a dialog with a list of domains for selection.
//a domain being selected for their UI experience is important, so the request is immutable.
//a domain is necessary so that API knows what data to respond with, including profile and partition specifics.
//though domainChooserDialog is the element that's used, it's passed in the callback anyway for error handling purposes.
			showDomainChooser : function(){
//				app.u.dump("BEGIN admin.a.showDomainChooser");
				$('#domainChooserDialog').dialog('open').showLoading({'message':'Fetching your list of domains.'});
				app.ext.admin.calls.adminDomainList.init({'callback':'handleDomainChooser','extension':'admin','targetID':'domainChooserDialog'},'immutable'); 
				},	 //showDomainChooser
				
			showDashboard : function()	{
				var $content = $("#homeContent");
				$content.empty().append(app.renderFunctions.createTemplateInstance('dashboardTemplate',{}));
				app.ext.admin.u.bringTabIntoFocus();
				app.ext.admin.u.bringTabContentIntoFocus($content);
				
//recent news panel.
				app.model.destroy('appResource|recentnews.json'); //always fetch the most recent news.
				$('#dashboardColumn1',$content).append($("<div \/>").attr('id','dashboardRecentNewsPanel').anypanel({
					'header' : 'Recent News',
					'showClose' : false,
					'call' : 'appResource',
					'callParams' : 'recentnews.json',
					'_tag' : {'callback':'translateSelector','extension':'admin','selector':'#dashboardRecentNewsPanel'},
					'content' : $("<div class='recentNewsContainer' data-bind='var:news(contents); format:processList; loadsTemplate:recentNewsItemTemplate;' \/>")
					}));

//quickstats ogms.
				var $salesReportPanel = $("<div \/>").anypanel({
					'header' : 'Sales Report',
					'showLoading' : false,
					'content' : $("<div><table class='fullWidth'><thead><th><\/th><th>Count<\/th><th>Sales<\/th><th>Units<\/th><\/thead><tbody id='dashboardReportTbody'><\/tbody><\/table><p>These reports are for all domains since midnight.<\/p><\/div>")
					});
				$('#dashboardColumn2',$content).append($salesReportPanel);
				app.ext.admin.calls.appResource.init('quickstats/OGMS.json',{'callback':'transmogrify','parentID':'dashboardReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //total sales
				app.ext.admin.calls.appResource.init('quickstats/OWEB.json',{'callback':'transmogrify','parentID':'dashboardReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //web sales
				app.ext.admin.calls.appResource.init('quickstats/OGRT.json',{'callback':'transmogrify','parentID':'dashboardReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //return customer
				app.ext.admin.calls.appResource.init('quickstats/OEXP.json',{'callback':'transmogrify','parentID':'dashboardReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //expedited
				app.ext.admin.calls.appResource.init('quickstats/SAMZ.json',{'callback':'transmogrify','parentID':'dashboardReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //amazon
				app.ext.admin.calls.appResource.init('quickstats/SBYS.json',{'callback':'transmogrify','parentID':'dashboardReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //buy.com
				app.ext.admin.calls.appResource.init('quickstats/SEBA.json',{'callback':'transmogrify','parentID':'dashboardReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //ebay auction
				app.ext.admin.calls.appResource.init('quickstats/SEBF.json',{'callback':'transmogrify','parentID':'dashboardReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //ebay fixed price
				app.ext.admin.calls.appResource.init('quickstats/SSRS.json',{'callback':'transmogrify','parentID':'dashboardReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //sears
				
/*
## NOTE - if you use the code below, streamline so that all the appResource calls don't get executed twice.

				$('#dashboardColumn2',$content).append($("<div \/>").attr('id','dashboardMktplacePanel').anypanel({
					'title' : 'Popular Marketplace Summary',
					'showClose' : false,
					'showLoading' : false,
					'content' : $("<div \/>")
					}));

//recent news panel.
				app.ext.admin.calls.appResource.init('quickstats/SAMZ.json',{},'mutable'); //amazon
				app.ext.admin.calls.appResource.init('quickstats/SEBA.json',{},'mutable'); //ebay auction
				app.ext.admin.calls.appResource.init('quickstats/SEBF.json',{},'mutable'); //ebay fixed price
				app.ext.admin.calls.appResource.init('quickstats/SSRS.json',{},'mutable'); //sears
				app.ext.admin.calls.appResource.init('quickstats/SGOO.json',{},'mutable'); //google
				app.ext.admin.calls.appResource.init('quickstats/SBYS.json',{'callback':function(){

$('#dashboardMktplacePanel .ui-widget-content',$content).append($("<div \/>").attr('id','container'));


//build chart data arrray.
var chartData = new Array();
if(app.data['appResource|quickstats/SAMZ.json'].contents.count)	{chartData.push(['Amazon', Number(app.data['appResource|quickstats/SAMZ.json'].contents.count)])}
if(app.data['appResource|quickstats/SEBA.json'].contents.count)	{chartData.push(['eBay Auction', Number(app.data['appResource|quickstats/SEBA.json'].contents.count)]);}
if(app.data['appResource|quickstats/SEBF.json'].contents.count)	{chartData.push(['eBay Store', Number(app.data['appResource|quickstats/SEBF.json'].contents.count)]);}
if(app.data['appResource|quickstats/SSRS.json'].contents.count)	{chartData.push(['Sears', Number(app.data['appResource|quickstats/SSRS.json'].contents.count)]);}
if(app.data['appResource|quickstats/SBYS.json'].contents.count)	{chartData.push(['Buy.com', Number(app.data['appResource|quickstats/SBYS.json'].contents.count)]);}
if(app.data['appResource|quickstats/SGOO.json'].contents.count)	{chartData.push(['Google', Number(app.data['appResource|quickstats/SGOO.json'].contents.count)]);}



var chart = new Highcharts.Chart({
            chart: {
                renderTo: 'container',
                plotBackgroundColor: null,
                plotBorderWidth: null,
                plotShadow: false
            },
            title: {
                text: 'Sales Since Midnight'
            },
            tooltip: {
        	    pointFormat: '{series.name}: <b>{point.percentage}%</b>',
            	percentageDecimals: 1
            },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    dataLabels: {
                        enabled: true,
                        color: '#000000',
                        connectorColor: '#000000',
                        formatter: function() {
                            return '<b>'+ this.point.name +'</b>: '+ Number(this.percentage).toFixed(2) +' %';
                        }
                    }
                }
            },
            series: [{
                type: 'pie',
                name: 'Popular Marketplaces',
                data: chartData
            }]
        });


					}},'mutable'); //buy
*/

				app.model.dispatchThis('mutable');
				} //showdashboard
			}, //action





////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
//executed after preloader if device is logged in.
//executed after login if a login is required.
//If a domain hasn't been selected (from a previous session) then a prompt shows up to choose a domain.
//the entire UI experience revolves around having a domain.
			showHeader : function(){
//hide all preView and login data.
				$('#appLogin').hide(); 
				$('#appPreView').hide();
				$('#createAccountContainer').hide();

				$('#appView').show();
				
				$("#closePanelButton",'#appView').button({icons: {primary: "ui-icon-triangle-1-n"},text: false});
				
				$('body').hideLoading(); //make sure this gets turned off or it will be a layer over the content.
				$('.username','#appView').text(app.vars.userid);
				var domain = this.getDomain();
				
				
//				app.ext.admin.calls.bossUserDetail(app.vars.userid.split('@')[0],{},'passive'); //will contain list of user permissions.
//immutable because that's wha the domain call uses. These will piggy-back.
app.ext.admin.calls.adminMessagesList.init(app.ext.admin.u.getLastMessageID(),{'callback':'handleMessaging','extension':'admin'},'immutable');
app.ext.admin.calls.appResource.init('shipcodes.json',{},'immutable'); //get this for orders.

//show the domain chooser if no domain is set. see showDomainChooser function for more info on why.
//if a domain is already set, this is a return visit. Get the list of domains  passively because they'll be used.
				if(!domain) {
					//the selection of a domain name will load the page content. (but we'll still need to nav)
					app.ext.admin.a.showDomainChooser(); //does not dispatch itself.
					}
				else {
					
					app.ext.admin.calls.adminDomainList.init({'callback':function(rd){
						if(app.model.responseHasErrors(rd)){app.u.throwMessage(rd);}
						else	{
							app.vars.partition = app.ext.admin.a.getDataForDomain(domain,'prt');
							$('.partition').text(app.vars.partition);
							app.vars.https_domain = app.ext.admin.a.getDataForDomain(domain,'https');
							}
						}},'immutable');
					$('.domain','#appView').text(domain);
					app.ext.admin.a.showUI(app.ext.admin.u.whatPageToShow('#!dashboard'));
					}
				app.model.dispatchThis('immutable');
				}, //showHeader

//used to determine what page to show when app inits and after the user changes the domain.
//uses whats in the hash first, then the default page passed in.
//if you want to target a specific page, change the hash before executing this function.
			whatPageToShow : function(defaultPage)	{
//				app.u.dump("BEGIN admin.u.whatPageToShow");
				var page = window.location.hash || defaultPage;
				if(page)	{
					if(page.substring(0,2) == '#!' || page.substring(0,2) == '#:')	{}  //app hashes. leave them alone cuz showUI wants #.
					else	{
						page = page.replace(/^#/, ''); //strip preceding # from hash.
						}
					}
				else	{
					app.u.throwGMessage("In admin.u.whatPageToShow, unable to determine 'page'");
					}
//				app.u.dump(" -> page: "+page);
				return page;
				}, //whatPageToShow

			
			updateMessageCount : function()	{
				var messageCount = $("[data-app-role='messagesContainer']",'#messagesContent').children().length,
				$MC = $('.messageCount');
				
				$MC.text(messageCount);
				if(messageCount > 0)	{
					$MC.show();
					}
				else	{
					$MC.hide();
					}
				},

			getMessageDetail : function(datapointer,index)	{
				var $r = $("<div \/>");
				if(datapointer && (index || index === 0))	{
					$r.anycontent({'templateID':'messageDetailTemplate','data':app.data[datapointer]['@MSGS'][index]});
					}
				else	{
					$r.anymessage({'message':'In admin.u.getMessageDetail, both datapointer ['+datapointer+'] and index ['+index+'] are required','gMessage':true});
					}
				return $r;
				},

			getLastMessageID : function()	{
				var r = 0; //default to zero if no past messageid is present.
				if(app.model.fetchData('adminMessagesList'))	{
//					app.u.dump("adminMessagesList WAS IN LOCAL");
					if(app.data['adminMessagesList']['@MSGS'] && app.data['adminMessagesList']['@MSGS'].length)	{
						r = app.data['adminMessagesList']['@MSGS'][(app.data['adminMessagesList']['@MSGS'].length - 1)].id;
						}
					}
				return r;
				},
/*
			handleMessagesInit : function()	{
//				app.ext.admin.calls.adminMessagesList.init(app.ext.admin.u.getLastMessageID(),{'callback':'handleMessaging','extension':'admin'},'passive');
				app.ext.admin.vars.messageListInterval = setInterval(function(){
					app.ext.admin.calls.adminMessagesList.init(app.ext.admin.u.getLastMessageID(),{'callback':'handleMessaging','extension':'admin'},'passive');
					},30000);
				},
*/



//used to determine what domain should be used. mostly in init, but could be used elsewhere.
			getDomain : function(){
				var domain = false;
				var localVars = {};
				
				if(app.model.fetchData('authAdminLogin'))	{
					localVars = app.data['authAdminLogin'];
					}
//will use the domain auto-created by a recently created account.
				else if(app.model.fetchData('authNewAccountCreate'))	{
					localVars = app.data['authNewAccountCreate'].domain;
					}
				else	{} //no other local lookup 

				if(domain = app.u.getParameterByName('domain')) {} //the single = here is intentional. sets the val during the if so the function doesn't have to be run twice.
				else if(app.vars.domain)	{domain = app.vars.domain}
				else if(localVars.domain){domain = localVars.domain}
				else {} //at this time, no other options.
				return domain;
				}, //getDomain


//pass in a form and this will apply some events to add a 'edited' class any time the field is edited.
//will also update a .numChanges selector with the number of elements within the context that have edited on them.
//will also 'enable' the parent button of that class.
			applyEditTrackingToInputs : function($context)	{

				$("input",$context).each(function(){
					
					if($(this).hasClass('skipTrack')){} //allows for a field to be skipped.
					else if($(this).is(':checkbox') || $(this).is('select'))	{
						$(this).off('change.trackChange').on('change.trackChange',function(){
							$(this).toggleClass('edited');
							$('.numChanges',$context).text($('.edited',$context).length).closest('button').button("enable");
							});			
						}
					else	{
						$(this).off('keyup.trackChange').one('keyup.trackChange',function(){
							$(this).addClass('edited');
							$('.numChanges',$context).text($('.edited',$context).length).closest('button').button("enable");
							});
						}
			
					});

				}, //applyEditTrackingToInputs



			loadNativeApp : function(path,opts){
//				app.u.dump("BEGIN loadNativeApp");
				if(path == '#!mediaLibraryManageMode')	{
					app.ext.admin_medialib.a.showMediaLib({'mode':'manage'});
					}
				else if(path == '#!domainConfigPanel')	{
					app.ext.admin.a.showDomainConfig();
					}
				else if(path == '#!dashboard')	{app.ext.admin.a.showDashboard();}
				else if(path == '#!launchpad')	{
					app.ext.admin.vars.tab = 'launchpad';
					app.ext.admin.u.bringTabContentIntoFocus($("#launchpadContent"));
					app.ext.admin_launchpad.a.showLaunchpad();  //don't run this till AFTER launchpad container is visible or resize doesn't work right
					}
				else if(path == '#!organizationManager')	{
					app.u.dump(" -> tab: "+app.ext.admin.vars.tab);
					app.ext.admin_wholesale.a.showOrganizationManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!reports')	{
					app.ext.admin.vars.tab = 'reports';
					this.bringTabIntoFocus('reports');
					this.bringTabContentIntoFocus($('#reportsContent'));
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					app.ext.admin_reports.a.showReportsPage($('#reportsContent'));
					}
				else if(path == '#!kpi')	{app.ext.admin_reports.a.showKPIInterface();}
				else if(path == '#!userManager')	{app.ext.admin_user.a.showUserManager();}
				else if(path == '#!batchManager')	{
					app.ext.admin.vars.tab = 'utilities';
					this.bringTabIntoFocus('utilities');
					this.bringTabContentIntoFocus($('#utilitiesContent'));
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					app.ext.admin_batchJob.a.showBatchJobManager($('#utilitiesContent'));
					}
				else if(path == '#!customerManager')	{app.ext.admin_customer.a.showCustomerManager();}
				else if(path == '#!help')	{
					$('#supportContent').empty(); //here just for testing. won't need at deployment.
					this.bringTabIntoFocus('support');
					this.bringTabContentIntoFocus($('#supportContent'));
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					app.ext.admin_support.a.showHelpInterface($('#supportContent'));
					}
				else if(path == '#!support')	{
					$('#supportContent').empty(); //here just for testing. won't need at deployment.
					this.bringTabIntoFocus('support');
					this.bringTabContentIntoFocus($('#supportContent'));
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					app.ext.admin_support.a.showTicketManager($('#supportContent'));
					}
				else if(path == '#!eBayListingsReport')	{app.ext.admin_reports.a.showeBayListingsReport();}
				else if(path == '#!orderPrint')	{app.ext.convertSessionToOrder.a.printOrder(opts.data.oid,opts);}
				else if(path == '#!supplierManager')	{app.ext.admin_wholesale.a.showSupplierManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).empty())}
				else if(path == '#!orderCreate')	{app.ext.convertSessionToOrder.a.openCreateOrderForm();}
				else if(path == '#!domainConfigPanel')	{app.ext.admin.a.showDomainConfig();}

				else if (path == '#!appChooser')	{
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					app.ext.admin.a.showAppChooser();
					}
				else if(path == '#!orders')	{
//					app.u.dump("into loadNativeApp -> #!orders");
					app.ext.admin.vars.tab = 'orders';
					app.ext.admin.u.bringTabIntoFocus('orders');
					app.ext.admin.u.bringTabContentIntoFocus($("#ordersContent"));
					app.ext.admin_orders.a.initOrderManager({"targetID":"ordersContent"});
//					app.u.dump("end of loadNativeApp  else statement -> #! orders");
					}
				else if(path == '#!products')	{
					app.u.dump("Go to product editor");
					app.ext.admin_prodEdit.u.showProductEditor(path,opts);
					}
				else if(path == '#!taskManager')	{
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					app.ext.admin_task.a.showTaskManager();
					}
				else	{
					app.u.throwGMessage("WARNING! unrecognized path/app ["+path+"] passed into loadNativeApp.");
					}
//				app.u.dump("END loadNativeApp");
				},

//used for bringing one of the top tabs into focus. does NOT impact content area.
			bringTabIntoFocus : function(tab){
				$('.mhTabsContainer ul','#mastHead').children().removeClass('active'); //strip active class from all other tabs.
				$('.'+tab+'Tab','#mastHead').addClass('active'); ///!!! need to put this into a jqSelector function !!!
				return false;
				},

//should only get run if NOT in dialog mode. This will bring a tab content into focus and hide all the rest.
//this will replace handleShowSection
			bringTabContentIntoFocus : function($target){
				if($target.is('visible'))	{
					//target is already visible. do nothing.
					}
				else if($target.attr('id') == 'messagesContent')	{
					this.toggleMessagePane(); //message tab is handled separately.
					}
				else	{
					app.ext.admin.u.toggleMessagePane('hide'); //make sure messages pane hides itself.
					$('.tabContent').hide();
					$target.show();
					}
				},



			toggleMessagePane : function(state){

				var $target = $('#messagesContent');
				$target.css('top',$target.parent().height()); //positions messages pane directly below tab bar, regardless of tab bar height.

				if(state == 'hide' && $target.css('display') == 'none')	{} //pane is already hidden. do nothing.
				else if(state == 'show' || $target.css('display') == 'none')	{
					$target.slideDown();
					$('.messagesTab').addClass('messagesTabActive');
					}
				else	{
					$target.slideUp();
					$('.messagesTab').removeClass('messagesTabActive');
					}

				}, //toggleMessagePane

//will create the dialog if it doesn't already exist.
//will also open the dialog. does not handle content population.
			handleCompatModeDialog : function(P){
				var $target = false;
				if(P.targetID)	{
					$target = $(app.u.jqSelector('#',P.targetID));
					if($target.length){} //element exists, do nothing to it.
					else	{
						$target = $("<div>").attr('id',P.targetID).appendTo('body');
						$target.dialog({modal:true,width:'90%',height:500,autoOpen:false})
						}
					P.title = P.title || "Details"
					$target.parent().find('.ui-dialog-title').text(P.title);
					$target.dialog('open');
					}
				else	{
					app.u.throwGMessage("Warning! no target ID passed into admin.u.handleCompatModeDialog.");
					}
				return $target;
				},


//executed from within showUI. probably never want to execute this function elsewhere.
//this is for handling legacy paths.
			handleShowSection : function(path,P,$target)	{
				var tab = P.tab || app.ext.admin.u.getTabFromPath(path);
				this.bringTabIntoFocus(tab);
//				app.u.dump(" -> tab: "+tab);
//				app.u.dump(" -> path: "+path);
				if(tab == 'product' && !P.dialog)	{
//					app.u.dump(" -> open product editor");
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					app.ext.admin_prodEdit.u.showProductEditor(path,P);
					}
				else if(tab == 'kpi' || path == '/biz/kpi/index.cgi')	{
					app.ext.admin.u.bringTabIntoFocus('kpi');
					app.ext.admin.u.bringTabContentIntoFocus($('#kpiContent'));
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					app.ext.admin_reports.a.showKPIInterface();
					}
				else if(tab == 'setup' && path.split('/')[3] == 'index.cgi')	{
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					$('#setupContent').empty().append(app.renderFunctions.createTemplateInstance('pageSetupTemplate',{}));
//					app.ext.admin.u.uiHandleLinkRewrites(path,{},{'targetID':'setupContent'});  //navigateTo's hard coded on 2012/30
					}
				else if(tab == 'syndication' && path.split('/')[3] == 'index.cgi')	{
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					$('#syndicationContent').empty().append(app.renderFunctions.transmogrify('','pageSyndicationTemplate',{}));
//					app.ext.admin.u.uiHandleLinkRewrites(path,{},{'targetID':'syndicationContent'});
					}
				else if(tab == 'orders' && path.split('/')[3] == 'index.cgi')	{
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					app.ext.admin.u.loadNativeApp('#!orders',P);
					}
				else if(tab == 'utilities' && path.split('/')[3] == 'index.cgi')	{
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					$('#utilitiesContent').intervaledEmpty().append(app.renderFunctions.createTemplateInstance('pageUtilitiesTemplate',{}));
//					app.ext.admin.u.uiHandleLinkRewrites(path,{},{'targetID':'utilitiesContent'}); //navigateTo's hard coded on 2012/30
					}
				else if(tab == 'setup' && path.split('/')[3] == 'import')	{
					app.u.dump(" -> open import editor");
					app.ext.admin_medialib.u.showFileUploadPage(path,P);
					}
				else if(tab == 'setup' && path.split('/')[3] == 'customfiles')	{
					app.u.dump(" -> open public files list");
					app.ext.admin_medialib.u.showPublicFiles(path,P);
					}
				else	{
					app.u.dump(" -> open something wonderful .. "+path);
					$target.empty().append("<div class='loadingBG'></div>");
//					alert(path);
					app.model.fetchAdminResource(path,P);
//					app.ext.admin.calls.adminUIExecuteCGI.init(path,{infoObj:P})
					}
				}, //handleShowSection

// !!! when the old showUI goes away, so can this function.
			getId4UIContent : function(path){
				return this.getTabFromPath(path)+"Content";
				},

			// returns things like setup, crm, etc. if /biz/setup/whatever is selected			
			getTabFromPath : function(path)	{
				var r = path.split("/")[2]; //what is returned.
//				app.u.dump(" -> R: "+r);
//				app.u.dump(" -> app.ext.admin.vars.tabs.indexOf(r): "+app.ext.admin.vars.tabs.indexOf(r));
				if (r == 'manage') { r = 'utilities'} //symlinked
				if (r == 'batch') { r = 'reports'} //symlinked
				if (r == 'download') { r = 'reports'} //symlinked
				if (r == 'todo') { r = 'reports'} //symlinked
				if(app.ext.admin.vars.tabs.indexOf(r) >= 0){ //is a supported tab.
					// yay, we have a valid tab				
					} 
				else	{
					// default tab
					r = 'home'
					}
				return r;
				}, //getTabFromPath
	
	
	
//the following function gets executed as part of any fetchAdminResource request. 
//it's used to output the content in 'html' (part of the response). It uses the targetID passed in the original request.
//it also handles updating the breadcrumb, forms, links etc.
			uiHandleContentUpdate : function(path,data,viewObj){
//				app.u.dump("BEGIN admin.u.uiHandleContentUpdate");
//				app.u.dump("View Obj: "); app.u.dump(viewObj);

				if(viewObj.targetID)	{
					var $target = $(app.u.jqSelector('#',viewObj.targetID))
					$target.html(data.html);
//The form and anchor links must get run each time because a successful response, either to get page content or save it, returns the page content again for display.
//so that display must have all the links and form submits modified.
					app.ext.admin.u.uiHandleBreadcrumb(data.bc);
					app.ext.admin.u.uiHandleNavTabs(data.navtabs);
					app.ext.admin.u.uiHandleFormRewrites(path,data,viewObj);
					app.ext.admin.u.uiHandleLinkRewrites(path,data,viewObj);
					app.ext.admin.u.uiHandleMessages(path,data.msgs,viewObj);

					if(typeof viewObj.success == 'function'){viewObj.success()}
					
					}
				else	{
					app.u.throwGMessage("WARNING! no target ID passed into admin.u.uiHandleContentUpdate. This is bad. No content displayed because we don't know where to put it.");
					app.u.dump(" -> path: "+path);
					app.u.dump(" -> data: "); app.u.dump(data);
					app.u.dump(" -> viewObj: "); app.u.dump(viewObj);
					}
				$target.hideLoading();
				}, //uiHandleContentUpdate



			uiMsgObject : function(msg)	{
				var obj; //what is returned.
				if(msg.indexOf('|') == -1)	{
					obj = {'errid':'#','errmsg':msg,'errtype':'unknown','uiIcon':'ui-icon-z-ise','uiClass':'z-hint'} //some legacy messaging is pipeless (edit order, tracking, for instance).
					}
				else	{
					var tmp = msg.split('|');
					var message = tmp[tmp.length-1]; //the message is always the last part of the message object.
					if(message.substring(0,1) == '+')	{message = message.substring(1)}
					obj = {'errid':'#','errmsg':message,'errtype':tmp[0],'uiIcon':'z-'+tmp[0].toLowerCase(),'uiClass':'z-'+tmp[0].toLowerCase()}
					if(tmp.length > 2)	{
	//				app.u.dump(' -> tmp.length: '+tmp.length); app.u.dump(tmp);
						for(i = 1; i < (tmp.length -1); i += 1)	{ //ignore first and last entry which are type and message and are already handled.
							obj[tmp[i].split(':')[0]] = tmp[i].split(/:(.+)?/)[1]; //the key is what appears before the first : and the value is everything after that. allows for : to be in value
							}
	//					app.u.dump(" -> obj: "); app.u.dump(obj);
						}
					}
				return obj;
				}, //uiMsgObject


//the following function gets executed as part of any fetchAdminResource request. 
//it's used to output any content in the msgs array.
//it may be empty, and that's fine.
// message splitting on | will result in spot 0 = message type (success, error, etc) and spot[last] == message. 
// there 'may' be things between like 'batch:' or 'ticket:'. These are the 'type' and each are treated individually.
// if an unrecognized 'type' is encountered, do NOT display an error message, but DO throw smething to the console.
// also, if message starts with a +, strip that character.
			uiHandleMessages : function(path,msg,viewObj)	{
//				app.u.dump("BEGIN admin.u.uiHandleMessages ["+path+"]");
//				app.u.dump("viewObj: "); app.u.dump(viewObj);
				if(msg)	{
					var L = msg.length;
					var msgType, msgObj; //recycled.
					var target; //where the messaging is going to be put.
//if the targetID isn't specified, attempt to determine where the message should be placed based on path.
//checking targetID first instead of just using parent allows for more targeted messaging, such as in modals.
					if(viewObj && viewObj.targetID)	{
						target = viewObj.targetID;
						}
					else	{
						target = this.getTabFromPath(path)+"Content"; //put messaging in tab specific area.
						}
//					app.u.dump(" -> target: "+target);
					for(var i = 0; i < L; i += 1)	{
						msgObj = this.uiMsgObject(msg[i]);
						msgObj.parentID = target; //targetID in throwMessage would get passed in _rtag. parent can be top level, so use that.
						msgObj.persistent = true; //for testing, don't hide.
						
						if(msgObj.BATCH)	{
							msgObj.errmsg += "<div><button class='buttonify' onClick='app.ext.admin_batchJob.a.showBatchJobStatus(\""+msgObj.BATCH+"\");'>View Batch Job Status<\/button><\/div>"
							}
//						app.u.dump(msgObj);	
						var r = app.u.throwMessage(msgObj);
						$('.buttonify','.'+r).button();
						app.u.dump("throwMessage response = "+r);
						}
					}
				else	{
					//no message. it happens sometimes.
					}
				}, //uiHandleMessages


//bc is an array returned from an ajax UI request.
//being empty is not abnormal.
			uiHandleBreadcrumb : function(bc)	{
				var $target = $('#breadcrumb') //breadcrumb container.
				$target.empty();
				if(bc)	{
					var L = bc.length;
					for(var i = 0; i < L; i += 1)	{
						if(i){$target.append(" &#187; ")}
						if(bc[i]['link'])	{
							$target.append("<a href='#' onClick='return showUI(\""+bc[i]['link']+"\");' title='"+bc[i].name+"'>"+bc[i].name+"<\/a>");
							}
						else	{
							$target.append(bc[i].name);
							}
						}
					}
				else	{
//					app.u.dump("WARNING! admin.u.handleBreadcrumb bc is blank. this may be normal.");
					}
				}, //uiHandleBreadcrumb


//the 'tabs' referred to here are not the primary nav tabs, but the subset that appears based on what page of the UI the user is in.
			uiHandleNavTabs : function(tabs)	{
				var $target = $('#navTabs')// tabs container
				$target.empty(); //emptied to make sure tabs aren't duplicated on save.
				if(tabs)	{
					var L = tabs.length;
					var className; //recycled in loop.
					var action; //recycled
				
					for(var i = 0; i < L; i += 1)	{
						className = tabs[i].selected ? 'header_sublink_active' : 'header_sublink'
						$a = $("<a \/>").attr({'title':tabs[i].name,'href':'#'}).addClass(className).append("<span>"+tabs[i].name+"<\/span>");
//a tab may contain some javascript to execute instead of a link.
//product editor -> edit web page -> back to editor is an example
						if(tabs[i].jsexec)	{
							$a.click(function(j){return function(){eval(j)}}(tabs[i]['jsexec']));
							}
						else	{
//the extra anonymous function here and above is for support passing in a var.
//see http://stackoverflow.com/questions/5540280/
							$a.click(function(j){return function(){showUI(j);}}(tabs[i]['link']));
							}
						$target.append($a);
						}
					}
				else	{
//					app.u.dump("WARNING! admin.u.uiHandleNavTabs tabs is blank. this may be normal.");
					}
				}, //uiHandleNavTabs


// 'data' is the response from the server. includes data.html
// viewObj is what is passed into fetchAdminResource as the second parameter
			uiHandleFormRewrites : function(path,data,viewObj)	{
//				app.u.dump("BEGIN admin.u.uiHandleFormRewrites");
//				app.u.dump(" -> data: "); app.u.dump(data);
//				app.u.dump(" -> viewObj: "); app.u.dump(viewObj);
				var $target = $(app.u.jqSelector('#',viewObj.targetID))

//any form elements in the response have their actions rewritten.
//the form is serialized and sent via Ajax to the UI API. This is a temporary solution to the UI rewrite.
				$('form',$target).attr('data-jqueryoverride','true').submit(function(event){
//					app.u.dump(" -> Executing custom form submit.");
					event.preventDefault();
					$target.showLoading();
					var formObj = $(this).serializeJSON();
//					app.u.dump(" -> jsonObj: "); app.u.dump(jsonObj);
					app.model.fetchAdminResource(path,viewObj,formObj); //handles the save.
					return false;
					}); //submit
				}, //uiHandleFormRewrites

// 'data' is the response from the server. includes data.html
// viewObj is what is passed into fetchAdminResource as the second parameter
			uiHandleLinkRewrites : function(path,data,viewObj)	{
				// app.u.dump("BEGIN admin.u.uiHandleLinkRewrites("+path+")");
				var $target = $(app.u.jqSelector('#',viewObj.targetID));
				$('a',$target).each(function(){
					app.ext.admin.u.rewriteLink($(this));
					});
				}, //uiHandleLinkRewrites


//a separate function from above because it's also used on the mastHead in init.

			rewriteLink : function($a){
				var href = $a.attr('href');
				if (href == undefined) {
					// not sure what causes this, but it definitely happens, check the debug log.
					// this occurrs when <a> tag exists but has no href (ex. maybe just an onclick)
					app.u.dump('rewriteLink was called on a property without an href');
					app.u.dump("ERROR rewriteLink was called on a link that did not have an href, set to href='#' and css red for your enjoyment Please fix.");
					$a.attr('href','#');
					href = $a.attr('href');
					$a.css('color','#FF0000');	// this should probably changed to a more obvious errorClass
					// app.u.dump($a);
					}

				if (href.substring(0,5) == "/biz/" || href.substring(0,2) == '#!')	{
					var newHref = app.vars.baseURL;
					newHref += href.substring(0,2) == '#!' ? href :'#'+href; //for #! (native apps) links, don't add another hash.
					$a.attr({'title':href,'href':newHref});
					$a.click(function(event){
						event.preventDefault();
						return showUI(href);
						});
					}
				}, //rewriteLink

			linkOffSite : function(url){
				window.open(url);
				},

//used when an element in the builder is saved.
//also used when a select is changed in the builder > edit page > edit product list
			uiSaveBuilderElement : function($form,ID,tagObj)	{
				var obj = $form.serializeJSON();
				obj['sub'] = "SAVE";
				obj.id = ID;
				app.ext.admin.calls.adminUIBuilderPanelExecute.init(obj,tagObj);
				},			
			
			
			
			saveFinderChanges : function()	{
//				app.u.dump("BEGIN admin.u.saveFinderChanges");
				var myArray = new Array();
				var $tmp;
				var $finderModal = $('#prodFinder')
				var findertype = $finderModal.attr('data-findertype');
				var path = $finderModal.attr('data-path');
				var attrib = $finderModal.attr('data-attrib');
//				var sku = $finderModal.attr('data-sku');
//				app.u.dump(" -> path: "+path);
//				app.u.dump(" -> sku: "+sku);

/*
The process for updating a product vs a category are substantially different.  
for a product, everything goes up as one chunk as a comma separated list.
for a category, each sku added or removed is a separate request.
*/

				if (findertype == 'PRODUCT')	{
//finder for product attribute.
					var sku = path;	// we do this just to make the code clear-er
					var list = '';
					var attribute = app.renderFunctions.parseDataVar(attrib);
					$('#finderTargetList').find("li").each(function(index){
//make sure data-pid is set so 'undefined' isn't saved into the record.
						if($(this).attr('data-pid'))	{list += ','+$(this).attr('data-pid')}
						});
					if(list.charAt(0) == ','){ list = list.substr(1)} //remove ',' from start of list string.
					app.u.dump(" -> "+attribute+" = "+list);
					var attribObj = {};
					attribObj[attribute] = list;
					app.model.destroy('appProductGet|'+sku); //remove product from memory and localStorage
					app.ext.admin.calls.adminProductUpdate.init(sku,attribObj,{'callback':'pidFinderChangesSaved','extension':'admin'});
					app.calls.appProductGet.init(sku,{},'immutable');
					}
				else if (findertype == 'NAVCAT')	{
					// items removed need to go into the Q first so they're out of the remote list when updates start occuring. helps keep position correct.
					$('#finderRemovedList').find("li").each(function(){
						$tmp = $(this);
						if($tmp.attr('data-status') == 'remove')	{
							app.ext.admin.calls.finder.adminNavcatProductDelete.init($tmp.attr('data-pid'),path,{"callback":"finderProductUpdate","extension":"admin"});
							$tmp.attr('data-status','queued')
							}
						});
					
					//category/list based finder.
					//concat both lists (updates and removed) and loop through looking for what's changed or been removed.				
					$("#finderTargetList li").each(function(index){
						$tmp = $(this);
						//	app.u.dump(" -> pid: "+$tmp.attr('data-pid')+"; status: "+$tmp.attr('data-status')+"; index: "+index+"; $tmp.index(): "+$tmp.index());
	
					if($tmp.attr('data-status') == 'changed')	{
						$tmp.attr('data-status','queued')
						app.ext.admin.calls.finder.adminNavcatProductInsert.init($tmp.attr('data-pid'),index,path,{"callback":"finderProductUpdate","extension":"admin"});
						}
					else	{
						//datastatus set but not to a valid value. maybe queued?
						}
					});
					app.model.destroy('appCategoryDetail|'+path);
					app.calls.appCategoryDetail.init({'safe':path,'detail':'fast'},{"callback":"finderChangesSaved","extension":"admin"},'immutable');
					}
				else if (findertype == 'PAGE') {
					app.u.dump("SAVING findertype PAGE");
					var list = ""; //set to empty string so += below doesn't start with empty stirng
					var obj = {};
//finder for product attribute.
					$('#finderTargetList').find("li").each(function(index){
//make sure data-pid is set so 'undefined' isn't saved into the record.
						if($(this).attr('data-pid'))	{list += ','+$(this).attr('data-pid')}
						});
					if(list.charAt(0) == ','){ list = list.substr(1)} //remove ',' from start of list string.
					obj.PATH = path;
					obj[attrib] = list;
					app.ext.admin.calls.appPageSet.init(obj,{'callback':'pidFinderChangesSaved','extension':'admin'},'immutable');
					}
				else {
					app.u.throwGMessage('unknown findertype='+findertype+' in admin.a.saveFinderChanges');
					}
				//dispatch occurs on save button, not here.
				}, //saveFinderChanges






//onclick, pass in a jquery object of the list item
			removePidFromFinder : function($listItem){
//app.u.dump("BEGIN admin.u.removePidFromFinder");
var path = $listItem.closest('[data-path]').attr('data-path');
//app.u.dump(" -> safePath: "+path);
var newLiID = 'finderRemovedList_'+$listItem.attr('data-pid');
//app.u.dump(" -> newLiID: "+newLiID);

if($(app.u.jqSelector('#',newLiID)).length > 0)	{
	//item is already in removed list.  set data-status to remove to ensure item is removed from list on save.
	$(app.u.jqSelector('#',newLiID)).attr('data-status','remove');
	}
else	{
	var $copy = $listItem.clone();
	$copy.attr({'id':newLiID,'data-status':'remove'}).appendTo('#finderRemovedList');
	}

//kill original.
$listItem.empty().remove();

app.ext.admin.u.updateFinderCurrentItemCount();

				}, //removePidFromFinder






/*
executed in a callback for a appCategoryDetail or a appProductGet.
generates an instance of the product finder.
targetID is the id of the element you want the finder added to. so 'bob' would add an instance of the finder to id='bob'
path is the list/category src (ex: .my.safe.id) or a product attribute [ex: product(zoovy:relateditems)].
if pid is passed into this function, the finder treats everything as though we're dealing with a product.
*/

			addFinder : function(targetID,vars){

//app.u.dump("BEGIN admin.u.addFinder");
// app.u.dump(" -> targetID: "+targetID);
//app.u.dump(vars);

//jquery likes id's with no special characters.
var safePath = app.u.makeSafeHTMLId(vars.path);
var prodlist = new Array();

var $target = $(app.u.jqSelector('#',targetID));
// app.u.dump(" -> $target.length: "+$target.length);
//create and translate the finder template. will populate any data-binds that are set that refrence the category namespace
//empty to make sure we don't get two instances of finder if clicked again.
$target.empty().append(app.renderFunctions.createTemplateInstance('adminProductFinder',"productFinderContents"));

$('#chooserResultContainer', $target).hide();
$('#adminFinderButtonBar', $target).show();
$('#adminChooserButtonBar', $target).hide().empty(); //chooser button(s) are reset each time a chooser is instantiated.
$('#finderTargetList', $target).show();


if(vars.findertype == 'PRODUCT')	{
	app.u.dump(" -> Product SKU: "+vars.path);
	$target.parent().find('.ui-dialog-title').text('Product Finder: '+app.data['appProductGet|'+vars.path]['%attribs']['zoovy:prod_name']); //updates modal title
	app.renderFunctions.translateTemplate(app.data['appProductGet|'+vars.path],"productFinderContents");
	attrib = $('#prodFinder').attr('data-attrib');
	if(app.data['appProductGet|'+vars.path]['%attribs'][vars.attrib])
		prodlist = app.ext.store_prodlist.u.cleanUpProductList(app.data['appProductGet|'+vars.path]['%attribs'][vars.attrib]);
	}
else if(vars.findertype == 'NAVCAT')	{
	$target.parent().find('.ui-dialog-title').text('Product Finder: '+app.data['appCategoryDetail|'+vars.path].pretty); //updates modal title
	prodlist = app.data['appCategoryDetail|'+vars.path]['@products'];
	}
else if (vars.findertype == 'CHOOSER')	{
	$('#chooserResultContainer', $target).show();
	$('#adminFinderButtonBar', $target).hide();
	$('#adminChooserButtonBar', $target).show();
	$('#finderTargetList', $target).hide();
	prodlist = []; //no items show up by default.
	}
else if(vars.findertype == 'PAGE')	{
	if(vars.path.charAt(0) === '@')	{
		$target.parent().find('.ui-dialog-title').text('Product Finder: Newsletter');
		}
	else if(vars.path == '*cart')	{
		$target.parent().find('.ui-dialog-title').text('Product Finder: Cart');
		}
	else	{
		$target.parent().find('.ui-dialog-title').text('Product Finder: '+app.data['appCategoryDetail|'+vars.path].pretty); //updates modal title
		}
	if(app.data['appPageGet|'+vars.path]['%page'][vars.attrib])	{
		prodlist = app.ext.store_prodlist.u.cleanUpProductList(app.data['appPageGet|'+vars.path]['%page'][vars.attrib])
		}	
	}
else	{
	app.u.throwGMessage("WARNING! in admin.u.addFinder, findertype not set or is an unsupported value ["+vars.findertype+"].");
	}
//app.u.dump(" -> path: "+path);
//app.u.dump(" -> prodlist: "+prodlist);

//bind the action on the search form.
$('#finderSearchForm').off('submit.search').on('submit.search',function(event){
	event.preventDefault();
	app.ext.admin.u.handleFinderSearch(vars.findertype);
	return false;
	});


if(vars.findertype && vars.findertype == 'CHOOSER')	{
	if(vars['$buttons'])	{
		$('#adminChooserButtonBar', $target).append(vars['$buttons']);
		}
	}
else if (vars.findertype)	{
	$("[data-btn-action='productFinder|chooser']",$target).hide();
//build the product list for items that are already selected.
	app.ext.store_prodlist.u.buildProductList({
		"loadsTemplate": prodlist.length < 200 ? "adminProdStdForList" : "adminProdSimpleForList",
		"items_per_page" : 500, //max out at 500 items
		"hide_summary" : true, //disable multipage. won't play well w/ sorting, drag, indexing, etc
		"parentID":"finderTargetList",
	//	"items_per_page":100,
		"csv":prodlist
		},$('#finderTargetList'))
	
	
	// connect the results and targetlist together by class for 'sortable'.
	//sortable/selectable example found here:  http://jsbin.com/aweyo5
	$( "#finderTargetList , #finderSearchResults" ).sortable({
		connectWith:".connectedSortable",
		items: "li:not(.ui-state-disabled)",
		handle: ".handle",
	/*
	the 'stop' below is run when an item is dropped.
	jquery automatically handles moving the item from one list to another, so all that needs to be done is changing some attributes.
	the attributes are only changed if the item is dropped into the target list (as opposed to picked up and dropped elsewhere [cancelled])
	this does NOT get executed when items are moved over via selectable and move buttons.
	*/
		stop: function(event, ui) {
			var parent = ui.item.parent().attr('id')
	//		app.u.dump(" -> parent id of dropped item: "+ui.item.parent().attr('id'));
			if(parent == 'finderTargetList')	{
				ui.item.attr({'data-status':'changed','id':'finderTargetList_'+ui.item.attr('data-pid')});
				}
			app.ext.admin.u.updateFinderCurrentItemCount();
			} 
		});
	
	//make results panel list items selectable. 
	//only 'li' is selectable otherwise clicking a child node will move just the child over.
	// .ui-state-disabled is added to items in the results list that are already in the category list.
	$("#finderSearchResults").selectable({ filter: 'li',filter: "li:not(.ui-state-disabled)" }); 
	//make category product list only draggable within itself. (can't drag items out).
	$("#finderTargetList").sortable( "option", "containment", 'parent' ); //.bind( "sortupdate", function(event, ui) {app.u.dump($(this).attr('id'))});
		
	
	//set a data-btn-action on an element with a value of save, moveToTop or moveToBottom.
	//save will save the changes. moveToTop will move selected product from the results over to the top of column the category list.
	//moveToBottom will do the same as moveToTop except put the product at the bottom of the category.
	$('[data-btn-action]',$target).each(function(){
		app.ext.admin.u.bindFinderButtons($(this),safePath);
		});
	
		app.ext.admin.u.updateFinderCurrentItemCount();

	
	}
else	{} //findertype is not declared. The error handling for this has already taken place.



				
				}, //addFinder

//was used in the finder, but it isn't anymore or limited to this.
//returns an array of tags that were checked.
//idprefex will be prepended to the tag name. ex: idprefix = bob_, then id's bob_IS_FRESH will be checked.
			whichTagsAreChecked : function(idprefix)	{
				var r = new Array();
				var L = app.ext.admin.vars.tags.length;
				for(var i = 0; i < L; i += 1)	{
					if($(app.u.jqSelector('#',idprefix+app.ext.admin.vars.tags[i])).is(':checked')){r.push(app.ext.admin.vars.tags[i])};
					}
				return r;
				},

			tagsAsCheckboxes : function(idprefix)	{
				var r = ''; //what is returned. a chunk of html. each tag with a checkbox.
				var L = app.ext.admin.vars.tags;
				for(var i = 0; i < L; i += 1)	{
					r += "<div><input type='checkbox' id='finderSearchFilter_"+app.ext.admin.vars.tags[i]+"' name='"+app.ext.admin.vars.tags[i]+"' /><label for='finderSearchFilter_"+app.ext.admin.vars.tags[i]+"'>"+app.ext.admin.vars.tags[i].toLowerCase()+"</label></div>"
					}
				return r;
				},

			updateFinderCurrentItemCount : function()	{
				$('#focusListItemCount').text(" ("+$("#finderTargetList li").size()+")");
				var resultsSize = $("#finderSearchResults li").size();
				if(resultsSize > 0)	{
					$('#resultsListItemCount').show(); //keeps the zero hidden on initial load.
					}
				$('#resultsListItemCount').text(" ("+resultsSize+" remain)")
				},

//need to be careful about not passing in an empty filter object because elastic doesn't like it. same for query.
			handleFinderSearch : function(findertype)	{
				$('#finderSearchResults').empty().addClass('loadingBG');
				var qObj = {}; //query object
				var columnValue = $('#finderSearchQuery').val();
				qObj.type = 'product';
				qObj.mode = 'elastic-native';
				qObj.size = 400;
				qObj.query =  {"query_string" : {"query" : columnValue}};
			
				//dispatch is handled by form submit binder
				app.ext.store_search.calls.appPublicSearch.init(qObj,{"callback":"handleElasticFinderResults","extension":"admin","parentID":"finderSearchResults","datapointer":"elasticsearch","templateID": findertype == 'CHOOSER' ? 'adminChooserElasticResult' : 'adminElasticResult'});
				app.model.dispatchThis();
				},


//will 'disable' any item that is in the result set that already appears in the category or as a accessory/related item.
			filterFinderResults : function()	{
//				app.u.dump("BEGIN admin.callbacks.filterFinderSearchResults");
				var $tmp;
//go through the results and if they are already in this category, disable drag n drop.
//data-path will be the SKU of the item in focus (for a product attribute finder)
				$results = $('#finderSearchResults');
				var sku = $results.closest('[data-path]').attr('data-path');
				$results.find('li').each(function(){
					$tmp = $(this);
					if($('#finderTargetList_'+$tmp.attr('data-pid')).length > 0 || $tmp.attr('data-pid') == sku)	{
//						app.u.dump(" -> MATCH! disable dragging.");
						$tmp.addClass('ui-state-disabled');
						}
					})				
				
				}, //filterFinderResults

			changeFinderButtonsState : function(state)	{
				$dom = $('#prodFinder [data-btn-action]')
				if(state == 'enable')	{
					$dom.removeAttr('disabled').removeClass('ui-state-disabled')
					}
				else if(state == 'disable')	{
					$dom.attr('disabled','disabled').addClass('ui-state-disabled');
					}
				else	{
					//catch. unknown state.
					}
				}, //changeFinderButtonsState 


//run as part of addFinder. will bind click events to buttons with data-btn-action on them
			bindFinderButtons : function($button,safePath){
// ### Move search button into this too. 

//	app.u.dump(" -> btn-action found on element "+$button.attr('id'));
if($button.attr('data-btn-action') == 'save')	{

	$button.click(function(event){
		event.preventDefault();
		app.ext.admin.u.saveFinderChanges($button.attr('data-path'));
		app.model.dispatchThis('immutable');
		app.ext.admin.u.changeFinderButtonsState('disable');
		
		return false;
		});
	}
else if($button.attr('data-btn-action') == 'selectAll')	{
	$button.click(function(event){
		event.preventDefault();
		$('#finderSearchResults li').not('.ui-state-disabled').addClass('ui-selected');
		});
	}
//these two else if's are very similar. the important part is that when the items are moved over, the id is modified to match the targetCat 
//id's. That way when another search is done, the disable class is added correctly.
else if($button.attr('data-btn-action') == 'moveToTop' || $button.attr('data-btn-action') == 'moveToBottom'){
	$button.click(function(event){
		event.preventDefault();
		$('#finderSearchResults .ui-selected').each(function(){
			var $copy = $(this).clone();
			app.u.dump(" -> moving item "+$copy.attr('data-pid'));
			if($button.attr('data-btn-action') == 'moveToTop')
				$copy.prependTo('#finderTargetList')
			else
				$copy.appendTo('#finderTargetList')
			$copy.attr('data-status','changed'); //data-status is used to compile the list of changed items for the update request.
			$copy.removeClass('ui-selected').attr('id','finderTargetList_'+$copy.attr('data-pid'));
			$(this).remove();
			})
		app.ext.admin.u.updateFinderCurrentItemCount();
		return false;
		})
	}
else	{
	//catch.  really shouldn't get here.
	}


				}, //bindFinderButtons





/* DUAL MODE EDITOR - help, users, tasks all do (or will) use this. */


//mode is optional.  If not passed, it'll toggle. valid modes are list and detail.
//list mode will toggle the detail column OFF and expand the list column to 100%.
//detail mode will toggle the detail column ON and shrink the list column to 65%.
			toggleDualMode : function($parent,mode)	{
				var $L = $("[data-app-role='dualModeList']",$parent), //List column
				$D = $("[data-app-role='dualModeDetail']",$parent), //detail column
				numDetailPanels = $D.children().length,
				oldMode = $parent.data('app-mode'),
				$btn = $("[data-app-event='admin|toggleDualMode']",$parent);

				if(mode)	{}
				else if($parent.data('app-mode') == 'list')	{mode = 'detail'}
				else if($parent.data('app-mode') == 'detail')	{mode = 'list'}
				else	{} //invalid mode. error handled below.

//go into detail mode. This expands the detail column and shrinks the list col. 
//this also toggles a specific class in the list column off
//				app.u.dump(" -> old mode: "+oldMode);
//				app.u.dump(" -> mode: "+mode);
				
				if(mode == 'detail')	{
					
					$L.addClass('detailMode');
					
					$btn.show().button('destroy').button({icons: {primary: "ui-icon-seek-prev"},text: false});
					$parent.data('app-mode','detail');
					if(oldMode == mode)	{} //if mode is forced, could be in same mode. don't animate.
					else	{
						//dualmode-widthpercent can be set on the detail section to allow for a different split than 50/50.
						//95 - dualmode-widthpercent will result in 5% smaller than the remaining space to allow for some margin between sections.
						$L.animate({width:($D.data('dualmode-widthpercent')) ? (95 - $D.data('dualmode-widthpercent'))+'%' :"49%"},1000); //shrink list side.
						$D.show().animate({width: ($D.data('dualmode-widthpercent')) ? $D.data('dualmode-widthpercent')+'%' :"49%"},1000).addClass('expanded').removeClass('collapsed'); //expand detail side.
						}
//when switching from detail to list mode, the detail panels collapse. re-open them IF they were open when the switch to list mode occured.
					if(numDetailPanels)	{
						$('.ui-widget-anypanel',$D).each(function(){
							if($(this).anypanel('option','state') == 'expand' && !$('.ui-widget-content',$(this)).is(':visible')){
								$(this).anypanel('expand');
								}
							});						
						}
					}
				else if (mode == 'list')	{
					$btn.button('destroy').button({icons: {primary: "ui-icon-seek-next"},text: false});
					$parent.data('app-mode','list');
//if there are detail panels open, shrink them down but show the headers.
					if(numDetailPanels)	{
						if(oldMode == mode)	{} //if mode is forced, could be in same mode. don't animate.
						else	{
							$L.animate({width:"84%"},1000); //sexpand list side.
							$D.show().animate({width:"14%"},1000)
							}
						$D.removeClass('expanded').addClass('collapsed'); //collapse detail side.
						$btn.show();
						$('.ui-widget-anypanel',$D).each(function(){
							$(this).anypanel('collapse',true)
							});
						}
//there are no panels open in the detail column, so expand list to 100%.
					else	{
						$L.animate({width:"100%"},1000); //shrink list side.
						$D.show().animate({width:0},1000); //expand detail side.
						$btn.hide();
						}
					$L.removeClass('detailMode');
					}
				else	{
					app.u.throwGMessage("In admin_user.u.toggleDisplayMode, invalid mode ["+mode+"] passed. only list or detail are supported.");
					}
				
				}, //toggleDualMode


//In some cases, we'll likely want to kill everything in local storage BUT save the login and session data.
//login data will allow the user to return without logging in.
//session data is panel disposition and order and things like that.
			selectivelyNukeLocalStorage : function(){
				var admin = {};
				if(app.model.fetchData('authAdminLogin'))	{admin = app.data['authAdminLogin'];}
				var dps = app.ext.admin.u.dpsGet(); //all 'session' vars
				localStorage.clear();
				app.storageFunctions.writeLocal('authAdminLogin',admin);
				app.storageFunctions.writeLocal('session',dps);
				},



//executed after the domain data is in memory and up to date.
// note - empty should already be done.  There should be an a.showDomainConfig that executes a call and this is what gets executed in the call back.  
// that 'a' should do a showloading
			domainConfig : function(){
//				app.u.dump("BEGIN admin.u.domainConfig");
				$target = $('#setupContent');
				$target.hideLoading();
				var data = app.data['adminDomainList']['@DOMAINS'];
				var L = data.length;
				for(var i = 0; i < L; i += 1)	{
					$target.append(app.renderFunctions.transmogrify({'domain':app.data['adminDomainList']['@DOMAINS'][i].id},'domainPanelTemplate',app.data['adminDomainList']['@DOMAINS'][i]));
					}
				},


			uiCompatAuthKVP : function()	{
				return '_userid=' + app.vars.userid + '&_authtoken=' + app.vars.authtoken + '&_deviceid=' + app.vars.deviceid + '&_domain=' + app.vars.domain;
				},

//$t is 'this' which is the button.

			adminUIDomainPanelExecute : function($t){
//				app.u.dump("BEGIN admin.u.adminUIDomainPanelExecute");

				var data = $t.data();
				if(data && data.verb && data.domain)	{
					var obj = {},
					$panel = $t.closest("[data-app-role='domainPanel']"),
					$fieldset = $("[data-app-role='domainEditorContents']",$panel);
					
					$fieldset.showLoading({'message':'Loading information for domain: '+data.domain});
					$t.parent().find('.panelContents').show()
					if(data.verb == 'LOAD')	{
						//do nothing. data gets passed in as is.
						}
					else	{
						data = $.extend(data,$t.closest('form').serializeJSON());
						}
					
					app.ext.admin.calls.adminUIDomainPanelExecute.init(data,{'callback': function(rd){
						if(app.model.responseHasErrors(rd)){app.u.throwMessage(rd);}
						else	{
							$fieldset.hideLoading().removeClass('loadingBG').html(app.data[rd.datapointer].html);
							}
						}},'immutable');
					app.model.dispatchThis('immutable')
					}
				else	{
					app.u.throwGMessage("WARNING! required params for admin.u.showDomainPanel were not set. verb and domain are required: ");
					app.u.dump(data);
					}
				},

/*
CODE FOR URL MANAGEMENT

When a page change occurs, the hash is updated.
This hash change triggers a 'state' in the browser so that the back button will work.
when the browser detects a hash change, it will execute this code.
Of course, if we change the hash with JS, it will also trigger this code.
so, in our js for changing pages (showUI), we start by setting the global var _ignoreHashChange to true.
Then this function will know to NOT perform a showUI of it's own.
because this feature should be on most of the time, ignorehashchange is turned off each 
time a hash change occurs.
I didn't have this function actually trigger the page handler instead of toggling ignore... on/off because
it relied to heavily on a feature of the browser and who knows how consistenly it's supported. If it isn't, we 
just lose the back button feature.
*/

			handleHashState : function()	{
//				app.u.dump("BEGIN myRIA.u.handleHashState");
				var hash = window.location.hash.replace(/^#/, ''); //strips first character if a hash.
//				app.u.dump(" -> hash: "+hash);
				if(hash.substr(0,5) == "/biz/" && !_ignoreHashChange)	{
					showUI(hash);
					}
				else	{
					//the hash changed, but not to a 'page'. could be something like '#top' or just #.
					}
				_ignoreHashChange = false; //turned off again to re-engage this feature.
				},

//Device Persistent Settings (DPS) Get  ### here for search purposes:   preferences settings localstorage
//undefined is returned if there are no matchings session vars.
//if no extension is passed, return the entire sesssion object (if it exists).
//this allows for one extension to read anothers preferences and use/change them.
//ns is an optional param. NameSpace.
			dpsGet : function(ext,ns)	{
				var obj = app.storageFunctions.readLocal('session');
//				app.u.dump("ACCESSING DPS:"); app.u.dump(obj);
				if(obj == undefined)	{
					// if nothing is local, no work to do. this allows an early exit.
					} 
				else	{
					if(ext && obj[ext] && ns)	{obj = obj[ext][ns]} //an extension was passed and an object exists.
					else if(ext && obj[ext])	{obj = obj[ext]} //an extension was passed and an object exists.
					else if(!ext)	{} //return the global object. obj existing is already known by here.
					else	{} //could get here if ext passed but obj.ext doesn't exist.
					}
				return obj;
				},

//Device Persistent Settings (DPS) Set
//For updating 'session' preferences, which are currently device specific.
//for instance, in orders, what were the most recently selected filter criteria.
//ext is required (currently). reduces likelyhood of nuking entire preferences object.
			dpsSet : function(ext,ns,varObj)	{
				app.u.dump(" -> ext: "+ext); app.u.dump(" -> settings: "); app.u.dump(varObj);
				if(ext && ns && varObj)	{
//					app.u.dump("device preferences for "+ext+"["+ns+"] have just been updated");
					var sessionData = app.storageFunctions.readLocal('session'); //readLocal returns false if no data local.
					sessionData = (typeof sessionData === 'object') ? sessionData : {};
//					app.u.dump(" -> sessionData: "); app.u.dump(sessionData);
					if(typeof sessionData[ext] === 'object'){
						sessionData[ext][ns] = varObj;
						}
					else	{
						sessionData[ext] = {}; //each dataset in the extension gets a NameSpace. ex: orders.panelState
						sessionData[ext][ns] = varObj;
						} //object  exists already. update it.

//can't extend, must overwrite. otherwise, turning things 'off' gets obscene.					
//					$.extend(true,sessionData[ext],varObj); //merge the existing data with the new. if new and old have matching keys, new overwrites old.

					app.storageFunctions.writeLocal('session',sessionData); //update the localStorage session var.
					}
				else	{
					app.u.throwGMessage("Either extension ["+ext+"] or varObj ["+typeof varObj+"] not passed into admin.u.dpsSet.");
					}
				},





//a UI Action should have a databind of data-app-event (this replaces data-btn-action).
//value of action should be EXT|buttonObjectActionName.  ex:  admin_orders|orderListFiltersUpdate
//good naming convention on the action would be the object you are dealing with followed by the action being performed OR
// if the action is specific to a _cmd or a macro (for orders) put that as the name. ex: admin_orders|orderItemAddBasic
//obj is some optional data. obj.$content would be a common use.
// !!! this code is duplicated in the controller now. change all references in the version after 201308 (already in use in UI)
			handleAppEvents : function($target,obj)	{
//				app.u.dump("BEGIN admin.u.handleAppEvents");
				if($target && $target.length && typeof($target) == 'object')	{
//					app.u.dump(" -> target exists"); app.u.dump($target);
					$("[data-app-event]",$target).each(function(){
						var $ele = $(this),
						obj = obj || {},
						extension = $ele.data('app-event').split("|")[0],
						action = $ele.data('app-event').split("|")[1];
//						app.u.dump(" -> action: "+action);
						if(action && extension && typeof app.ext[extension].e[action] == 'function'){
//if an action is declared, every button gets the jquery UI button classes assigned. That'll keep it consistent.
//if the button doesn't need it (there better be a good reason), remove the classes in that button action.
							app.ext[extension].e[action]($ele,obj);
							} //no action specified. do nothing. element may have it's own event actions specified inline.
						else	{
							app.u.throwGMessage("In admin.u.handleAppEvents, unable to determine action ["+action+"] and/or extension ["+extension+"] and/or extension/action combination is not a function");
							}
						});
					}
				else	{
					app.u.throwGMessage("In admin.u.handleAppEvents, target was either not specified/an object ["+typeof $target+"] or does not exist ["+$target.length+"] on DOM.");
					}
				
				}, //handleAppEvents



//as more listTypes are added, make sure the call uses immutable.
//vars should contain listType, partition and then depending on the list type, CID or OrderID.
			sendEmail : function($form,vars)	{

				if($form && typeof vars == 'object')	{
					var sfo = $form.serializeJSON(),
					numDispatches = 0,
					callback = function(rd)	{
						$form.hideLoading();
						if(app.model.responseHasErrors(rd)){
							$form.anymessage({'message':rd});
							}
						else	{
							$form.empty().anymessage(app.u.successMsgObject('Your email has been sent.'));
							}						
						}
				
					$form.showLoading({'message':'Sending Email'});
					
					if(vars.listType == 'CUSTOMER' && vars.CID)	{
						numDispatches += app.ext.admin.calls.adminCustomerUpdate.init(vars.CID,['SENDEMAIL?MSGID='+sfo.MSGID+'&MSGSUBJECT='+encodeURIComponent(sfo.SUBJECT)+'&MSGBODY='+encodeURIComponent(sfo.BODY)],{'callback':callback}); //update is always immutable.
						}
					else if(vars.listType == 'ORDER' && vars.orderID)	{
						numDispatches += app.ext.admin.calls.adminCustomerUpdate.init(vars.orderID,['EMAIL?MSGID='+sfo.MSGID+'&MSGSUBJECT='+encodeURIComponent(sfo.SUBJECT)+'&MSGBODY='+encodeURIComponent(sfo.BODY)],{'callback':callback}); //update is always immutable.						
						}
					else	{
						$form.hideLoading();
						$form.anymessage({'gMessage':true,'persistent':true,'message':'In admin.u.sendEmail, based on listType, required var(s) were missing. Here is what was set: '+(typeof vars === 'object' ? JSON.stringify(vars) : vars)});
						}
					
					}
				else	{
					$form.anymessage({'gMessage':true,'message':'In admin.u.sendEmail, either $form ['+typeof $form+'] or vars.CID ['+vars.CID+'] not set.'});
					}
				return numDispatches;
				}


			},	//util

		e : {
			
			alphaNumeric : function($input)	{
				$input.off('keypress.alphaNumeric').on('keypress.alphaNumeric',function(event){
					return app.u.alphaNumeric(event);
					})
				},
			
			achievementDetail : function($row)	{
				$row.on('mouseover.achievementDetail',function(){
					$(this).addClass("ui-state-highlight").css({'border':'none','cursor':'pointer'});
					})
					.on('mouseout.achievementDetail',function(){
					$(this).removeClass('ui-state-highlight');
					})
					.on('click.achievementDetail',function(event){
						event.preventDefault();
						if($(this).data('app-contentid') && $(app.u.jqSelector('#',$(this).data('app-contentid'))).length)	{
							app.u.dump(" -> $(this).data('app-contentid'): "+$(this).data('app-contentid'));
							$(app.u.jqSelector('#',$(this).data('app-contentid'))).dialog({'modal':true});
							}
						else	{
							app.u.throwGMessage("In admin.e.achievementDetail, no data-content-id specified on element.");
							}
						});
				},

/* app chooser */

			appChooserAppChoose : function($btn)	{
				$btn.button();
				$btn.off('click.appChooserAppChoose').on('click.appChooserAppChoose',function(event){
					event.preventDefault();
					var $parent = $btn.closest("[data-appid]");
					})
				},

			appChooserFork : function($btn)	{
				$btn.button();
				$btn.off('click.appChooserFork').on('click.appChooserFork',function(event){
					event.preventDefault();
					var $parent = $btn.closest("[data-appid]");
					app.u.dump("$parent.length: "+$parent.length);
					app.u.dump("$parent.data: "); app.u.dump($parent.data());
					window.open($parent.data('app-repo')+"archive/master.zip");
					})
				},

			appChooserAppDownload : function($btn)	{
				$btn.button();
				$btn.off('click.appChooserAppChoose').on('click.appChooserAppChoose',function(event){
					event.preventDefault();
					var $parent = $btn.closest("[data-appid]");
					alert("Open a confirm dialog that shows the app id AND the domain in focus. after confirm, 'this may take a few moments...' then go through process.. creating project, adding files to project, selecting app for domain xyz.com, etc");
					})
				},


//$ele is probably an li.
			appChooserAppPreview : function($ele)	{
				$ele.off('click.appChooserAppChoose').on('click.appChooserAppChoose',function(event){
					
					event.preventDefault();
					var appID = $ele.data('appid'),
					$panel = $('#appChooserDetailPanel');

					app.u.dump("Show preview for: "+appID);
					//set all preview li's to default state then the new active one to active.
					$ele.closest('ul').find('li').each(function(){$(this).removeClass('ui-state-active').addClass('ui-state-default')});
					$ele.addClass('ui-state-active').removeClass('ui-state-default');
					
//hide the current preview and show the new one.					
					$("section:visible",$panel).first().hide('scale',function(){
						$("section[data-appid='"+appID+"']:first",$panel).show('scale')
						});
					});
				},


			execDialogClose : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-circle-close"}});
				$btn.off('click.execDialogClose').on('click.execDialogClose',function(event){
					event.preventDefault();
					$btn.closest(".ui-dialog-content").dialog('close');
					});
				},

			execMessageClear : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-circle-close"},text: false});
				$btn.off('click.execMessageClear').on('click.execMessageClear',function(event){
					event.preventDefault();
					$btn.closest('tr').empty().remove();
					})
				},
//vars needs to include listType as well as any list type specific variables (CID for CUSTOMER, ORDERID for ORDER)
			execMailToolSend : function($btn,vars){
				$btn.button();
				$btn.off('click.execMailToolSend').on('click.execMailToolSend',function(event){
					event.preventDefault();
					vars = vars || {};
					var $form = $btn.closest('form');

					if(vars.listType)	{
						if(app.u.validateForm($form))	{
							app.ext.admin.u.sendEmail($form,vars);	

//handle updating the email message default if it was checked. this runs independant of the email send (meaning this may succeed but the send could fail).
							if($("[name='updateSystemMessage']",$form).is(':checked') && $("[name='MSGID']",$form).val() != 'BLANK')	{
								frmObj.PRT = vars.partition;
								frmObj.TYPE = vars.listType; //Don't pass a blank FORMAT, must be set to correct type.
								delete frmObj.updateSystemMessage; //clean up obj for _cmd var whitelist.
								app.ext.admin.calls.adminEmailSave.init(frmObj,{'callback':function(rd){
									if(app.model.responseHasErrors(rd)){
										$form.anymessage({'message':rd});
										}
									else	{
										$form.anymessage(app.u.successMsgObject(frmObj.MSGID+" message has been updated."));
										}
									}},'immutable');
								}
							
							app.model.dispatchThis('immutable');
							}
						else	{} //validateForm handles error display.

						}
					else	{
						$form.anymessage({'message':'In admin.e.execMailToolSend, no list type specified in vars for app event.'});
						}
					});
				},

			showMessageDetail : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-arrowthick-1-e"}});
				$btn.off('click.showMessageDetail').on('click.showMessageDetail',function(event){
					event.preventDefault();
					var $tr = $btn.closest('tr');
					$(".messageDetail","#messagesContent").empty().append(app.ext.admin.u.getMessageDetail($tr.data('datapointer'),$tr.data('index')));
					});
				},

/* login and create account */

			accountLogin : function($btn)	{
				$btn.button();
				$btn.off('click.accountLogin').on('click.accountLogin',function(event){
					event.preventDefault();
					app.ext.admin.a.login($btn.closest('form'));
					});
				},
			
			showCreateAccount : function($btn)	{
				$btn.button();
				$btn.off('click.showCreateAccount').on('click.showCreateAccount',function(event){
					event.preventDefault();
					localStorage.clear();
					app.ext.admin.u.handleAppEvents($('#createAccountContainer'));
					$("#appLogin").css('position','relative').animate({right:($('body').width() + $("#appLogin").width() + 100)},'slow','',function(){
						$("#appLogin").hide();
						$('#createAccountContainer').css({'left':'1000px','position':'relative'}).removeClass('displayNone').show().animate({'left':'0'},'slow'); //show and remove class. show needed for toggling between login and create account.
						});
					})
				},

			showPasswordRecover : function($btn)	{
				$btn.button();
				$btn.off('click.showPasswordRecover').on('click.showPasswordRecover',function(event){
					event.preventDefault();
					app.ext.admin.u.handleAppEvents($('#appPasswordRecover'));
					$("#appLogin").css('position','relative').animate({right:($('body').width() + $("#appLogin").width() + 100)},'slow','',function(){
						$("#appLogin").hide();
						$('#appPasswordRecover').css({'left':'1000px','position':'relative'}).removeClass('displayNone').show().animate({'left':'0'},'slow'); //show and remove class. show needed for toggling between login and create account.
						});
					})
				},

			execPasswordRecover : function($btn)	{
				$btn.button();
				$btn.off('click.execPasswordRecover').on('click.execPasswordRecover',function(event){
					event.preventDefault();
					var $form = $btn.closest('form');
					if(app.u.validateForm($form))	{
						app.ext.admin.calls.authPasswordReset.init($("[name='login']",$form),{},'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{} //validateForm handles error display.
					});
				},

			authShowLogin : function($ele)	{
				$ele.off('click.authShowLogin').on('click.authShowLogin',function(event){
					event.preventDefault();
					$("#createAccountContainer").css('position','relative').animate({right:($('body').width() + $("#createAccountContainer").width() + 100)},'slow','',function(){
						$("#createAccountContainer").hide();
						$('#appLogin').css({'left':'1000px','position':'relative'}).show().removeClass('displayNone').animate({'left':'0'},'slow');
						});
					})			
				},
				
			authNewAccountCreate : function($btn)	{
				$btn.button();
				$btn.off('authNewAccountCreate').on('click.authNewAccountCreate',function(event){
					event.preventDefault();
					var $form = $btn.parents('form'),
					formObj = $form.serializeJSON(),
					$errors = $("<ul \/>");
//					app.u.dump(" -> authNewAccountCreate.formObj: "); app.u.dump(formObj);
					if(!formObj.firstname){$("<li \/>").text("First name").appendTo($errors)}
					if(!formObj.lastname){$("<li \/>").text("Last name").appendTo($errors)}
					if(!formObj.email){$("<li \/>").text("Email").appendTo($errors)}
					if(!formObj.company){$("<li \/>").text("Company").appendTo($errors)}
					if(!formObj.domain){$("<li \/>").text("Domain").appendTo($errors)}
					if(!formObj.phone){$("<li \/>").text("Phone").appendTo($errors)}
					
					if($errors.children().length)	{
						$("fieldset",$form).prepend($errors).prepend("It seems a few required fields were left blank. Please provide the following pieces of information:");
						}
					else	{
						$('body').showLoading({'message':'Creating new account. One moment please.'});
						app.ext.admin.calls.authNewAccountCreate.init(formObj,{'callback':'showHeader','extension':'admin'},'immutable');
						app.model.dispatchThis('immutable');
						}
					
					});
				},


//applied to the select list that contains the list of email messages. on change, it puts the message body into the textarea.
			"toggleEmailInputValuesBySource" : function($select)	{
				$select.off('change.toggleEmailInputValuesBySource').on('change.toggleEmailInputValuesBySource',function(){
					var
						$option = $("option:selected",$(this)),
						datapointer = $option.closest("[data-adminemaillist-datapointer]").data('adminemaillist-datapointer'),
						$form = $option.closest('form');

					if($option.val() == 'BLANK')	{
						$form.find("[name='body']").val(""); //clear the form.
						$form.find("[name='updateSystemMessage']").attr({'disabled':'disabled','checked':false}); //can't update 'blank'.
						$(".msgType",$form).empty();
						}
					else if(datapointer && app.data[datapointer])	{
						$form.find("[name='BODY']").val(app.data[datapointer]['@MSGS'][$option.data('adminEmailListIndex')].MSGBODY);
						$form.find("[name='SUBJECT']").val(app.data[datapointer]['@MSGS'][$option.data('adminEmailListIndex')].MSGSUBJECT);
						$form.find("[name='updateSystemMessage']").removeAttr('disabled');
						$(".msgType",$form).text($form.find("[name='MSGID']").val());
						}
					else	{
						$form.anymessage({'gMessage':true,'message':"In admin.e.orderEmailCustomChangeSource, either unable to determine datapointer ["+datapointer+"] or app.data[datapointer] is undefined ["+typeof app.data[datapointer]+"]."});
						}
					})
				}, //orderEmailCustomChangeSource


			"toggleDualMode" : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-seek-next"},text: false});
				$btn.hide(); //editor opens in list mode. so button is hidden till detail mode is activated by edit/detail button.
				$btn.off('click.toggleDualMode').on('click.toggleDualMode',function(event){
					event.preventDefault();
					app.ext.admin.u.toggleDualMode($btn.closest("[data-app-role='dualModeContainer']").first());
					});
				} //toggleDualMode


			

			
			} //e / appEvents

		} //r object.
	return r;
	}