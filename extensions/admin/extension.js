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
	var theseTemplates = new Array(
		'adminProdStdForList',
		'adminProdSimpleForList',
		'adminElasticResult',
		'adminProductFinder',
		'adminMultiPage',
		'adminChooserElasticResult',
		'productTemplateChooser',

		'pageSetupTemplate',
		'pageUtilitiesTemplate',
//		'pageTemplateSetupAppchooser',
		
//		'dashboardTemplate',
		'recentNewsItemTemplate',
		'quickstatReportTemplate',
//		'achievementsListTemplate',
		
		'messageListTemplate',
		'messageDetailTemplate',
		
		'mailToolTemplate',
		
		'pageTemplateSites',
		'domainListTemplate'

//		'projectsListTemplate',
//		'projectDetailTemplate',
//		'projectCreateTemplate',
		
//		'rssAddUpdateTemplate',
//		'rssListTemplate'		
		
		); 
	var r = {
		
		vars : {
			tab : null, //is set when switching between tabs. it outside 'state' because this doesn't get logged into local storage.
			tabs : ['setup','sites','jt','product','orders','crm','syndication','reports','utilities','launchpad'],
			state : {},
			tab : 'home',
			// YOUTUBE RELEASE VIDEO:
			versionData : [
				{'branch' : '201346','youtubeVideoID' : 'cW_DvZ2HOy8'},
				{'branch' : '201344','youtubeVideoID' : 'cW_DvZ2HOy8'},
				{'branch' : '201338','youtubeVideoID' : 'A8TNbpQtgas'},
				{'branch' : '201336','youtubeVideoID' : 'UOfn6tiQqiw'},
				{'branch' : '201334','youtubeVideoID' : 'FUO0NALw6sI'},
				{'branch' : '201332','youtubeVideoID' : 'tKQ_SJzjbXI'},
				{'branch' : '201330','youtubeVideoID' : 'fEWSsblLQ94'}
				],

			templates : theseTemplates,
			willFetchMyOwnTemplates : true,
			"tags" : ['IS_FRESH','IS_NEEDREVIEW','IS_HASERRORS','IS_CONFIGABLE','IS_COLORFUL','IS_SIZEABLE','IS_OPENBOX','IS_PREORDER','IS_DISCONTINUED','IS_SPECIALORDER','IS_BESTSELLER','IS_SALE','IS_SHIPFREE','IS_NEWARRIVAL','IS_CLEARANCE','IS_REFURB','IS_USER1','IS_USER2','IS_USER3','IS_USER4','IS_USER5','IS_USER6','IS_USER7','IS_USER8','IS_USER9'],
			"dependencies" : ['store_prodlist','store_navcats','store_product','store_search'] //a list of other extensions (just the namespace) that are required for this one to load
			},


					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



	calls : {

		adminAppTicketMacro : {
			init : function(tktcode,macros,_tag,Q)	{
				var r = 0;
				if(tktcode && macros && macros.length)	{
					r = 1;
					_tag = _tag || {};
					_tag.datapointer = "adminAppTicketMacro";
					this.dispatch(tktcode,macros,_tag,Q);
					}
				else	{
					$('.appMessaging').anymessage({"message":"In admin.calls.adminAppTicketMacro, either tktcode not set or macros were empty.",'gMessage':true});
					}
				return r;
				},
			dispatch : function(tktcode,macros,_tag,Q)	{
				var obj = {};
				obj.tktcode = tktcode; 
				obj['@updates'] = macros;
				obj._cmd = 'adminAppTicketMacro';
				obj._tag = _tag;
				app.model.addDispatchToQ(obj,Q || 'immutable');	
				}
			}, //adminAppTicketCreate


//for configDetail requests, no datapointer is set by default for shipmethod, payment, etc. It DOES accept a _tag.datapointer and, if set, will look for local.
//That means if no datapointer is passed, no localstorage is used.
//so for this call, you need to be particularly careful about setting a datapointer if you want to take advantage of localStorage.
// payment, shipment, shipping, crm-config
		adminConfigDetail : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(!$.isEmptyObject(obj))	{
					if(_tag && _tag.datapointer)	{
						if(app.model.fetchData(_tag.datapointer) == false)	{
							r = 1;
							this.dispatch(obj,_tag,Q);
							}
						else	{
							app.u.handleCallback(_tag);
							}
						}
					else	{
						_tag = _tag || {};
						_tag.datapointer = 'adminConfigDetail';
						this.dispatch(obj,_tag,Q);
						r = 1;
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminConfigDetail, obj is empty",'gMessage':true});
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "adminConfigDetail"
				obj._tag = _tag; //tag will be set in this call for datapointer purposes.
				app.model.addDispatchToQ(obj,Q || 'mutable');	
				}
			}, //adminConfigDetail



		adminConfigMacro : {
			init : function(macros,_tag,Q)	{
				var r = 0;
				this.dispatch(macros,_tag,Q);
				return r;
				},
			dispatch : function(macros,_tag,Q)	{
				var obj = {};
				obj['@updates'] = macros;
				obj._cmd = "adminConfigMacro"
				obj._tag = _tag; //tag will be set in this call for datapointer purposes.
				app.model.addDispatchToQ(obj,Q || 'immutable');	
				}
			}, //adminConfigMacro


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


//* 201324 -> though moving towards a non-defined call based approach, for calls that need/want local storage, we'll still declare them (like this one)
		adminEBAYCategory :  {
			init : function(obj,_tag,Q)	{
				obj = obj || {}
				_tag = _tag || {};
				_tag.datapointer = (obj.pid) ? "adminEBAYCategory|"+app.model.version+"|"+obj.pid+"|"+obj.categoryid : "adminEBAYCategory|"+app.model.version+"|"+obj.categoryid;
				var r = 0;
//if xsl is set, localstorage is NOT used.
				if(obj.xsl)	{
					app.u.dump(" -> XSL is set, do NOT use what is in memory or local storage");
					r = 1;
					this.dispatch(obj,_tag,Q);
					}
				else if(app.model.fetchData(_tag.datapointer) == false)	{
					r = 1;
					this.dispatch(obj,_tag,Q);
					}
				else	{
					app.u.handleCallback(_tag);
					}
				return r; 
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = 'adminEBAYCategory';
				obj._tag = _tag;
				app.model.addDispatchToQ(obj,Q || 'mutable');
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
				obj._tag.datapointer = 'adminReportDownload|'+batchGUID;
				obj.GUID = batchGUID;
				app.model.addDispatchToQ(obj,Q || 'passive');
				}
			},


//obj requires title and uuid, priority and @GRAPHS are optional.
		adminRSSRemove : {
			init : function(listID,_tag,Q)	{
				var r = 0;
				_tag = _tag || {}; 
				_tag.datapointer = "adminRSSRemove"
				if(listID)	{ // !!! this validation needs updating.
					r = 1;
					this.dispatch(listID,_tag,Q);
					}
				else	{
					$('.appMessaging').anymessage({"message":"In admin.calls.adminRSSRemove, listID not passed","gMessage":true})
					}
				return r;
				},
			dispatch : function(listID,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminRSSRemove","_tag":_tag,"ID":listID},Q || 'immutable');	
				}
			}, //adminRSSRemove

		adminRSSUpdate : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				_tag = _tag || {}; 
				_tag.datapointer = "adminRSSUpdate"
				obj = obj || {};
				if(obj.CPG)	{ // !!! this validation needs updating.
					r = 1;
					this.dispatch(obj,_tag,Q);
					}
				else	{
					$('.appMessaging').anymessage({"message":"In admin.calls.adminRSSUpdate, CPG not passed","gMessage":true})
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = 'adminRSSUpdate'
				obj._tag = _tag;
				app.model.addDispatchToQ(obj,Q || 'immutable');	
				}
			}, //adminRSSUpdate

		adminRSSDetail : {
			init : function(cpg,_tag,Q)	{
				var r = 0;
				if(cpg)	{
					_tag = _tag || {}; 
					_tag.datapointer = "adminRSSDetail|"+cpg
					if(app.model.fetchData(_tag.datapointer) == false)	{
						r = 1;
						this.dispatch(cpg,_tag,Q);
						}
					else	{
						app.u.handleCallback(_tag);
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminRSSDetail, cpg not passed","gMessage":true})
					}
				return r;
				},
			dispatch : function(cpg,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminRSSDetail","CPG":cpg,"_tag" : _tag},Q || 'mutable');
				}
			}, //adminRSSDetail


		adminMessagesList : {
//ID will be 0 to start.
			init : function(msgid,_tag,Q)	{
				var r = 0;
				if(msgid || msgid === 0)	{
					this.dispatch(msgid,_tag,Q);
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminMessagesList, MESSAGEID not passed and is required.");
					}
				return r;
				},
			dispatch : function(msgid,_tag,Q)	{
				var obj = {};
				obj._cmd = 'adminMessagesList';
				obj.msgid = msgid;
				obj._tag = _tag || {};
				obj._tag.datapointer = 'adminMessagesList|'+msgid;
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








		adminProjectList : {
			init : function(_tag,Q)	{
				var r = 0;
				_tag = _tag || {}; 
				_tag.datapointer = "adminProjectList"
				if(app.model.fetchData(_tag.datapointer) == false)	{
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
				app.model.addDispatchToQ({"_cmd":"adminProjectList","_tag" : _tag},Q || 'immutable');	
				}
			},//adminProjectList	



		adminProjectCreate : {
			init : function(obj,_tag,Q)	{
				_tag = _tag || {}; 
				_tag.datapointer = "adminProjectCreate";
				this.dispatch(obj,_tag,Q);
				return 1;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "adminProjectCreate";
				obj._tag = _tag || {};
				app.model.addDispatchToQ(obj,Q || 'immutable');	
				}
			},//adminProjectCreate	

		adminProjectDetail : {
			init : function(uuid,_tag,Q)	{
				var r = 0;
				_tag = _tag || {}; 
				_tag.datapointer = "adminProjectDetail|"+uuid;
				if(app.model.fetchData(_tag.datapointer) == false)	{
					r = 1;
					this.dispatch(uuid,_tag,Q);
					}
				else	{
					app.u.handleCallback(_tag);
					}
				return r;
				},
			dispatch : function(uuid,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminProjectDetail","files":true,"UUID":uuid,"_tag" : _tag},Q || 'immutable');	
				}
			},//adminProjectDetail	






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
		adminOrderMacro : {
			init : function(orderID,updates,_tag)	{
				var r = 0;
				if(orderID)	{
					this.dispatch(orderID,updates,_tag);
					r = 1;
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminOrderMacro, orderID not passed.");
					}
				return r;
				},
			dispatch : function(orderID,updates,_tag)	{
				cmdObj = {};
				cmdObj._cmd = 'adminOrderMacro';
				cmdObj.orderid = orderID;
				cmdObj['@updates'] = updates;
				cmdObj._tag = _tag || {};
				app.model.addDispatchToQ(cmdObj,'immutable');
				}
			}, //adminOrderMacro
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



		adminSyndicationDetail : {
			init : function(DST,_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = "adminSyndicationDetail|"+DST;
				this.dispatch(DST,_tag,Q);
				return 1;
				},
			dispatch : function(DST,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminSyndicationDetail","_tag":_tag,'DST':DST},Q || 'mutable');	
				}
			}, //adminSyndicationDetail


		adminSyndicationMacro : {
			init : function(DST, macros,_tag,Q)	{
				var r = 0;
				if(DST && macros && macros.length)	{
					r = 1;
					_tag = _tag || {};
					_tag.datapointer = "adminSyndicationMacro";
					this.dispatch(DST,macros,_tag,Q);
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminSyndicationMacro, macros ["+typeof macros+"] and/or DST ["+DST+"] is empty or not passed","gMessage":true});
					}
				return r;
				},
			dispatch : function(DST,macros,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminSyndicationMacro","DST":DST,"@updates":macros,"_tag":_tag,'DST':DST},Q || 'mutable');	
				}
			}, //adminSyndicationDetail



		adminSyndicationHistory : {
			init : function(DST,_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = "adminSyndicationHistory";
				this.dispatch(DST,_tag,Q);
				return 1;
				},
			dispatch : function(DST,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminSyndicationHistory","_tag":_tag,'DST':DST},Q || 'mutable');	
				}
			}, //adminSyndicationHistory

		adminSyndicationFeedErrors : {
			init : function(DST,_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = "adminSyndicationFeedErrors";
				this.dispatch(DST,_tag,Q);
				return 1;
				},
			dispatch : function(DST,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminSyndicationFeedErrors","_tag":_tag,'DST':DST},Q || 'mutable');	
				}
			}, //adminSyndicationFeedErrors

		adminSyndicationDebug : {
			init : function(DST,obj,_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = "adminSyndicationDebug";
				this.dispatch(DST,obj,_tag,Q);
				return 1;
				},
			dispatch : function(DST,obj,_tag,Q)	{
				obj = obj || {};
				obj._cmd = "adminSyndicationDebug";
				obj._tag = _tag;
				obj.DST = DST;
				app.model.addDispatchToQ(obj,Q || 'mutable');	
				}
			}, //adminSyndicationDebug

		adminSyndicationListFiles : {
			init : function(DST,_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = "adminSyndicationListFiles";
				this.dispatch(DST,_tag,Q);
				return 1;
				},
			dispatch : function(DST,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminSyndicationListFiles","_tag":_tag,'DST':DST},Q || 'mutable');	
				}
			}, //adminSyndicationListFiles


// @updates holds the macros.
// CLOSE -> no params
// APPEND -> pass note.
// leave this one as a call.

		adminTicketMacro : {
			init : function(ticketid,macro,_tag,Q)	{
				var r = 0;
				if(ticketid && typeof macro === 'object')	{
					r = 1;
					this.dispatch(ticketid,macro,_tag,Q);
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.calls.adminTicketMacro, either ticketid ["+ticketid+"] or macro ["+typeof macro+"] not defined.","gMessage":true});
					}
				return r;
				},
			dispatch : function(ticketid,macro,_tag,Q)	{
				var obj = {};
				obj._cmd = "adminTicketMacro";
				obj.ticketid = ticketid;
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



		adminPriceScheduleList : {
			init : function(_tag,q)	{
				var r = 0; //what is returned. a 1 or a 0 based on # of dispatched entered into q.
				_tag = _tag || {};
				_tag.datapointer = "adminPriceScheduleList";
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
				app.model.addDispatchToQ({"_cmd":"adminPriceScheduleList","_tag":_tag},q);	
				}
			}, //adminPriceScheduleList
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
			}, //adminPriceScheduleList



//this call is duplicated inside the admin extension so that the datapointer can be partition specific, to reduce redundant calls.
//the call is somewhat heavy and things like the rss tool, which needs a list of 'lists', use this to generate the list.
		appCategoryList : {
			init : function(obj,_tag,Q)	{
				_tag = _tag || {};
				obj = obj || {};
				obj.root = obj.root || '.';
				_tag.datapointer = obj.filter ? 'appCategoryList|'+app.vars.partition+'|'+obj.filter+'|'+obj.root : 'appCategoryList|'+app.vars.partition+'|'+obj.root
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				if(app.model.fetchData(_tag.datapointer) == false)	{
					r = 1;
					this.dispatch(obj,_tag,Q);
					}
				else 	{
					app.u.handleCallback(_tag)
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj['_cmd'] = "appCategoryList";
				obj['_tag'] = _tag;
				app.model.addDispatchToQ(obj,Q || mutable);
				}
			}, //appCategoryList


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
$('title').append(" - release: "+app.vars.release).prepend(document.domain+' - ');
app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/templates.html',theseTemplates);
app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/downloads.html',['downloadsPageTemplate']);


//SANITY - loading this file async causes a slight pop. but loading it inline caused the text to not show up till the file was done.
//this is the lesser of two weevils.
app.rq.push(['css',0,'https://fonts.googleapis.com/css?family=PT+Sans:400,700','google_pt_sans']);
app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/legacy_compat.js']);


/* used for html editor. */
app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/resources/jHtmlArea-0.7.5.ExamplePlusSource/style/jHtmlArea.ColorPickerMenu.css','jHtmlArea_ColorPickerMenu']);
app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/resources/jHtmlArea-0.7.5.ExamplePlusSource/style/jHtmlArea.css','jHtmlArea']);
//note - the editor.css file that comes with jhtmlarea is NOT needed. just sets the page bgcolor to black.

// colorpicker isn't loaded until jhtmlarea is done to avoid a js error due to load order.
app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jHtmlArea-0.7.5.ExamplePlusSource/scripts/jHtmlArea-0.7.5.js',function(){
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
				var $domainChooser = $("<div \/>").attr({'id':'domainChooserDialog','title':'Choose a domain to work on'}).addClass('displayNone').appendTo(document.body);
				$domainChooser.dialog({
					'autoOpen':false,
					'modal':true,
					'width': '90%',
					'height': 500,
					'closeOnEscape': false,
					open: function(event, ui) {$(".ui-dialog-titlebar-close", $(this).parent()).hide();} //hide 'close' icon. will close on domain selection
					});

//** 201320 -> no more hunting and pecking for domain. stored in dps and if it isn't there, the user will be prompted (in showHeader) to select one.
//the domainChange will set these three vars in localStorage so they'll be there next time.
//all three of the vars are required. images require the https_domain and several configDetail calls require partition.
var adminObj = app.model.dpsGet('admin');
if(!$.isEmptyObject(adminObj))	{
	app.vars.domain = adminObj.domain;
	app.vars.partition = adminObj.partition;
	app.vars.https_domain = adminObj.https_domain;
	}
			
//				app.u.dump(" -> domain: "+app.vars.domain);
//				app.u.dump(" -> partition: "+app.vars.partition);
//				app.u.dump(" -> https_domain: "+app.vars.https_domain);
				
				if(!app.vars.domain || isNaN(app.vars.partition) || !app.vars.https_domain)	{
					app.u.dump(" -> either domain ["+app.vars.domain+"], partition ["+app.vars.partition+"] or https_domain ["+app.vars.https_domain+"] not set. set domain to blank to trigger domain chooser.");
					app.vars.domain = false;  //
					}

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
	$('.logo img').attr('src','app-admin/images/anycommerce_logo-173x30.png');
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





//_rtag.jqObj should be data-app-role='dualModeList'.
/*
Execute this on a search button where the results list in a DMI need to be updated.
$ele is an elmeent anywhere within the DMI. It'll trace up to the parent DMI and work under that umbrella.
vars should include everything for the dispatch. _cmd is required.
vars._tag._listpointer is the ID of i the data object of where the list is. ex: in giftcards, @GIFTCARDS. if not set, no 'no results' message is displayed.
Function does NOT dispatch. 

SANITY -> jqObj should always be the data-app-role="dualModeContainer"
*/

		DMIUpdateResults : {
			onSuccess : function(_rtag)	{
				_rtag = _rtag || {};
				if(_rtag && _rtag.jqObj && _rtag.datapointer)	{

					var
						$DMI = _rtag.jqObj,
						$tbody = $DMI.find("[data-app-role='dualModeListTbody']:first"),
						bindData = app.renderFunctions.parseDataBind($tbody.data('bind')), //creates an object of the data-bind params.
						listpointer = app.renderFunctions.parseDataVar(bindData['var']),
						data = app.data[_rtag.datapointer]; //shortcut.
//					app.u.dump('listpointer: '+listpointer);
//					app.u.dump('_rtag.datapointer: '+_rtag.datapointer);
//					app.u.dump('data[listpointer]: '); app.u.dump(data[listpointer]);
					$DMI.hideLoading();
					$tbody.empty();
					//data[listpointer] check needs to be a !isemptyobject and NOT a .length check because value could be a hash OR an array.
					if(listpointer && data && data[listpointer] && !$.isEmptyObject(data[listpointer]))	{
						//no errors have occured and results are present.
						$tbody.anycontent({'data':data});
						app.u.handleAppEvents($tbody);
						if(_rtag.message)	{
							$('.dualModeListMessaging',$DMI).anymessage(app.u.successMsgObject(_rtag.message));
							}
						}
					else if(listpointer && !$.isEmptyObject(data)  && data[listpointer])	{
						$('.dualModeListMessaging',$DMI).anymessage({"message":"Your search/filter returned zero results."});
						}
					else if(!listpointer)	{
						$('.dualModeListMessaging',$DMI).anymessage({"message":"In admin.callbacks.DMIUpdateResults.onSuccess, unable to ascertain listpointer.","gMessage":true});
						}
					else if(typeof data[listpointer] !== 'object')	{
						$('.dualModeListMessaging',$DMI).anymessage({"message":"In admin.callbacks.DMIUpdateResults.onSuccess, data[listpointer] is NOT an object.","gMessage":true});
						}
					else 	{
						//should never get here.
						$('.dualModeListMessaging',$DMI).anymessage({"message":"In admin.callbacks.DMIUpdateResults.onSuccess, an unknown error occured. DEV: see console for details.","gMessage":true});
						app.u.dump("$DMI.length: "+$DMI.length);
						app.u.dump("$DMI instanceof jQuery: "+($DMI instanceof jQuery));
						app.u.dump("$tbody.length: "+$tbody.length);
						app.u.dump("listpointer: "+listpointer);
						app.u.dump("typeof data: "+typeof data);
						app.u.dump("bindData: "); app.u.dump(bindData);
//						app.u.dump("_rtag.jqObj"); app.u.dump(_rtag.jqObj);
						}


					}
				else	{
					$('.dualModeListMessaging',$DMI).anymessage({"message":"In admin.callbacks.DMIUpdateResults.onSuccess, Either no jqObj ["+typeof _rtag.jqObj+"] passed or no datapointer ["+_rtag.datapointer+"] set.","gMessage":true});
					}
				}
			},








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
				document.location = 'admin_logout.html'
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
				$target.empty().append("<iframe src='https://s3-us-west-1.amazonaws.com/admin-ui/ads/ad_300x250.html' class='noBorders floatRight marginLeft ad-300x250'><\/iframe>");
				var L = data.length;
				$target.hideLoading();
				if(L)	{
					var $ul = $('#domainList'); //ul in modal.
	//modal has been opened on this visit.  Domain list still reloaded in case they've changed.
					if($ul.length)	{$ul.empty()} //user is changing domains.
	//first time modal has been viewed.
					else	{
						$ul = $("<ul \/>").attr('id','domainList').addClass('listStyleNone marginRight');
						$ul.off('click.domain').on('click.domain','li',function(e){
							app.ext.admin.a.changeDomain($(e.target).data('DOMAINNAME'),$(e.target).data('PRT'))
							$target.dialog('close');
							});
						}

					function showDomains(favoritesOnly)	{
						for(var i = 0; i < L; i += 1)	{
							if((favoritesOnly && data[i].IS_FAVORITE) || (favoritesOnly === false))	{
								$("<li \/>").data(data[i]).addClass('lookLikeLink').addClass(data[i].DOMAINNAME == app.vars.domain ? 'ui-selected' : '').append(data[i].DOMAINNAME+" [prt: "+data[i].PRT+"]").appendTo($ul);
								}
							}
						}

					//load the list of favorites.
					showDomains(true); 
					//no favorites were present. show all domains.
					if(!$ul.children().length)	{
						showDomains(false); 
						}

					$ul.appendTo($target); //added last to minimize DOM updates.
					}
				else	{
					$("<p>It appears you have no domains configured. <span class='lookLikeLink'>Click here<\/span> to go configure one.<\p>").on('click',function(){
						$target.dialog('close');
						navigateTo("#!domainConfigPanel");
						}).appendTo($target);
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
//				app.u.dump(" ->last Message (start): "+app.ext.admin.u.getLastMessageID());
				if(app.data[_rtag.datapointer] && app.data[_rtag.datapointer]['@MSGS'] && app.data[_rtag.datapointer]['@MSGS'].length)	{

					var
						L = app.data[_rtag.datapointer]['@MSGS'].length,
						DPSMessages = app.model.dpsGet('admin','messages') || [],
						$tbody = $("[data-app-role='messagesContainer']",'#messagesContent'),
						lastMessageID;

//update the localstorage object w/ the new messages.
					for(var i = 0; i < L; i += 1)	{
						DPSMessages.push(app.data[_rtag.datapointer]['@MSGS'][i])
						}
					app.model.dpsSet('admin','messages',DPSMessages);
					app.model.dpsSet('admin','lastMessage',app.data[_rtag.datapointer]['@MSGS'][L-1].id);
					app.ext.admin.u.displayMessages(app.data[_rtag.datapointer]['@MSGS']);
//					app.u.dump(" ->last Message (end): "+app.ext.admin.u.getLastMessageID());
					}
				else	{} //no new messages.
				
//add another request. this means with each immutable dispatch, messages get updated.
				app.ext.admin.calls.adminMessagesList.init(app.ext.admin.u.getLastMessageID(),{'callback':'handleMessaging','extension':'admin'},'mutable');
				},
			onError : function()	{
				//no error display.
				//should we add another dispatch? Let's see what happens. ???
				}		
			}

		}, //callbacks



////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


	renderFormats : {

			macros2Buttons : function($tag,data)	{
//				app.u.dump(" got here"); app.u.dump(data.value);
				var L = data.value.length;
				for(var i = 0; i < L; i += 1)	{
					//currently, this is used in orders > routes
// This needs to be cleaned up.  Probably should specify the app-click in the data-bind to get the control we want. !!!
//!!! Need to go back and update the other places this is used so that 'else' is an error condition of missing _cmd, not a default.
					if(data.bindData._cmd == 'adminOrderMacro')	{
						$("<button \/>").addClass('smallButton').text(data.value[i].cmdtxt).attr({'data-macro-cmd':data.value[i].cmd,'data-app-click':'admin_orders|adminOrderMacroExec'}).button().appendTo($tag);
						}
					else	{
						$("<button \/>").addClass('smallButton').text(data.value[i].cmdtxt).button().attr({'data-app-click':'admin_prodEdit|adminProductMacroExec','data-macro-cmd':data.value[i].cmd}).appendTo($tag);
						}
					}
				},
				
				//pass in HOSTTYPE as data.
				appHostButtons : function($tag,data)	{
					var $menu = $("<menu \/>").hide();
					
					if(data.value == 'SITEPTR')	{
						$menu.append("<li><a href='#' data-app-event='admin_templateEditor|templateChooserShow' data-mode='Site'>Choose a Template</a></li>");
						$menu.append("<li><a href='#' data-app-event='admin_templateEditor|templateEditorShow' data-mode='Site'>Edit Project</a></li>");
						$menu.append("<li data-app-event='admin_templateEditor|containerFileUploadShow' data-mode='Site'><a href='#'>Upload Template Files</a></li>");
						}
					
					if(data.value == 'SITE' || data.value == 'SITEPTR' || data.value == 'APP')	{
						$menu.append("<li><a href='#' data-app-event='admin_batchJob|batchJobExec' data-whitelist='PROJECT' data-type='UTILITY/GITPULL'>Pull from GitHub</a></li>");
						$menu.append("<li><a href='#' data-app-event='admin_batchJob|batchJobExec' data-type='EXPORT/PAGES' >Export Pages.json</a></li>");
						$menu.append("<li><a href='#' data-app-event='admin_batchJob|batchJobExec' data-type='EXPORT/APPRESOURCE' >Export App Resource Zip</a></li>");
						}
					if($menu.children().length)	{
						$menu.menu();
						$tag.append($menu); //so menu appears where it should.
						$menu.css({'position':'absolute','width':200,'z-index':200,'top':25,'right':0});
						var $button = $("<button>").text("App Related Utilities").button({icons: {primary: "ui-icon-gear",secondary: "ui-icon-triangle-1-s"},text: false});
						$button.on('click',function(){
							$menu.show();
							$( document ).one( "click", function() {
								$menu.hide();
								});
							return false;
							})
						$tag.append($button);
						}
					else	{
						//host/domain isn't app based.
						}
					},
				
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

		companyLogo : function($tag,data)	{
			if(data.value.LOGO)	{
				data.value = data.value.LOGO;
				app.renderFormats.imageURL($tag,data);
				}
			else if(data.value.DOMAINNAME)	{
				var $qrdiv = $("<div \/>").css({'width':$tag.width(),'height':$tag.height(),'margin' : 'auto'});
				$tag.replaceWith($qrdiv);
				$qrdiv.qrcode({
					'size' : $qrdiv.height(),
					'fill' : '#'+Crypto.MD5(data.value.DOMAINNAME).substring(0,6), //generate a random color based on first 6 chars of md5.
					'text': data.value.DOMAINNAME
					});
				}
			else	{} //nothing to see here. move along.
			},

		graphicURL : function($tag,data)	{
			$tag.attr('src',"https://"+app.vars.https_domain+data.value);
			$tag.wrap("<a href='https://"+app.vars.https_domain+data.value+"' data-gallery='gallery'>");
			},

		publicURL : function($tag,data)	{
			$tag.attr('src',"http://"+app.vars.domain+"/media/merchant/"+app.vars.username+"/"+data.value);
			$tag.wrap("<a href='http://"+app.vars.domain+"/media/merchant/"+app.vars.username+"/"+data.value+"' data-gallery='gallery'>");
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

//put this on a select element.  Will generate the 'options'. var should be the value of the schedule already selected.
		wholesaleScheduleSelect : function($tag,data)	{
//			app.u.dump("BEGIN admin.renderFormats.wholesaleScheduleSelect");
			app.ext.admin.calls.adminPriceScheduleList.init({
				'callback' : function(rd){
//					app.u.dump(" -> in to callback");
					if(app.model.responseHasErrors(rd)){
						$tag.parent().anymessage({'message':rd})
						}
					else	{
						if(app.data.adminPriceScheduleList['@SCHEDULES'] && app.data.adminPriceScheduleList['@SCHEDULES'].length)	{
							var $select = $("<select \/>"),
							schedules = app.data.adminPriceScheduleList['@SCHEDULES'], //shortcut
							L = app.data.adminPriceScheduleList['@SCHEDULES'].length
							list = null;
//no 'none' is added here.  If you need it, add it into the select that has this renderFormat. That way it's easy to not have it.
							for(var i = 0; i < L; i += 1)	{
								$select.append($("<option \/>",{'value':schedules[i].SID}).text(schedules[i].SID));
								}
//							app.u.dump(" -> $select:"); app.u.dump($select);
							$tag.append($select.children());
							if(data.value)	{
								$select.val(data.value);
								}
							}
						else	{
							$tag.parent().anymessage({'message':'You have not created any schedules yet.'})
							}	
						}
					}
				},'mutable');
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
//app.u.dump("BEGIN admin.a.showUI ["+path+"]");
//app.u.dump(" -> path.substr(0,1): "+path.substr(0,1));
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
					else if (path.substr(0,2) == "#!") {mode = 'app'; }
					else	{}
					
					if(mode)	{

//app.u.dump(" -> mode: "+mode);
//app.u.dump(" -> path: "+path);
//app.u.dump(" -> opts: "); app.u.dump(opts);


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

//* 201220 -> tab is already set in the if(path) code at the top.
//else if(mode == 'legacy' || (mode == 'tabClick' ){
else if(mode == 'legacy'){
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
$('#stickytabs').empty(); //clear all the sticky tabs.
	
	}
//no tab was specified. use the open tab, if it's set.
else if(app.ext.admin.vars.tab)	{
	opts.targetID = app.ext.admin.vars.tab+"Content";
	$target = $(app.u.jqSelector('#',opts.targetID));
	} //load into currently open tab. common for apps.
else	{
	//not in an app. no tab specified. not in modal. odd. how did we get here? No $target will be set. error handling occurs in if($target) check below.
	}


//app.u.dump(" -> $target determined ("+$target.attr('id')+"). length: "+$target.length);

if($target && $target.length)	{

	if(opts.dialog)	{
		app.ext.admin.u.handleShowSection(path,opts,$target); 
		}
	else	{

		app.ext.admin.u.bringTabContentIntoFocus($target); //will make sure $target is visible. if already visible, no harm.
		if(mode == 'app')	{
//			app.u.dump(" -> showUI mode = app");
			app.ext.admin.u.loadNativeApp(path,opts,$target);
			}
		else if(mode == 'legacy')	{
//			app.u.dump(" -> showUI mode = legacy");
			app.ext.admin.u.handleShowSection(path,opts,$target);
			}
		else if(mode == 'tabClick')	{
//			app.u.dump(" -> showUI mode = tabClick");
//determine whether new content is needed or not. typically, #: is only run from a tab so that when returning to  the tab, the last open content shows up.
			if(opts.tab == app.ext.admin.vars.tab)	{
//				app.u.dump(" -> targeted tab and open tab match.");
				reloadTab = 1; //tab clicked from a page within that tab. show new content.
				}
//			app.u.dump(" -> $target.children().length: "+$target.children().length);
			if ($target.children().length === 0)	{
//				app.u.dump(" -> no content presently in target. targetID = "+$target.attr('id')+" and $target.length: "+$target.length);
				reloadTab = 1; //no content presently in target. load it.
				} 
			if(reloadTab)	{
//* 201336 -> moved this code down. It nukes any data set by anycontent. It was being run much earlier but should only be run if new content is being added. it empties the tab contents.
				if($target && $target.data('anycontent'))	{
//					app.u.dump(" -> execute anycontent('destroy')");
					$target.anycontent('destroy');
					}
				app.ext.admin.u.handleShowSection(path,opts,$target);
				}
			else	{
				app.ext.admin.u.uiHandleNavTabs({}); //clear or last displayed navtabs (from previous section) will show up.
				//when RETURNING to the product page, build navtabs again (search).
				if(opts.tab == 'product')	{
					app.ext.admin_prodEdit.u.handleNavTabs(); //builds the filters, search, etc menu at top, under main tabs.
					}
				} //show existing content. content area is already visible thanks to bringTabContentIntoFocus
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
						app.ext.admin.a.showUI("#!dashboard");
						$('#globalMessaging').anymessage({"message":"Warning! unable to determine 'mode' in admin.a.showUI.<br>Most likely, this was caused a refresh after an anchor link changed the hash. loading dashboard.<br>Path: "+path,"gMessage":true});

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
				
				
//show YouTubeVideo in a dialog.
			showYTVInDialog : function(videoID,vars){
				if(videoID)	{
					vars = vars || {};
					var $D = $("<div \/>",{'id':'ytv_'+videoID});
					if(vars.title)	{
						$D.attr('title',vars.title);
						}
					$D.append("<iframe width='560' height='315' src='https://www.youtube.com/embed/"+videoID+"?autoplay=1' frameborder='0' allowfullscreen></iframe>");
					$D.appendTo(document.body);
					$D.dialog({
						width: 600,
						dialog : false,
						close: function(event, ui)	{
							$(this).dialog('destroy'); //remove this from the dom entirely on close. consequently, it also stops the video 
							$(this).intervaledEmpty(1000,1);
							}, //will remove from dom on close
						})
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.a.showYTVInDialog, no videoID passed.","gMessage":true});
					}
				},
				
//data needs to include a templateID and a mode [product,customer]
			getPicker : function(data,selectors)	{
var r = false;  //what is returned. either false of a jquery object.
data = data || {};
selectors = selectors || "";

if(data.templateID && (data.mode == 'product' || data.mode == 'customer'))	{
	var $D = $("<div \/>"); //container for the template. It's children() are what's returned.
	$D.anycontent({'templateID':data.templateID,'showLoading':'false',data:data});
	$D.data('pickermode',data.mode);

	if(selectors[selectors.length-1] == '\n')	{selectors = selectors.substring(0,selectors.length-1);} //If an orphan \n exists, strip it.	
	
	$("[data-app-role='accordionContainer']",$D).first().addClass('pickerAccordionContainer').accordion({
		heightStyle: "content",
		activate : function(event,ui)	{
//			app.u.dump("ui.newHeader.data('pickmethod'): "+ui.newHeader.data('pickmethod'));
//			app.u.dump("ui.newPanel.data('contentloaded'): "+ui.newPanel.data('contentloaded'));
//static panels do NOT need to be declared here. just add data-contentloaded='true' to the content element.	
			if(!ui.newPanel.data('contentloaded'))	{
				ui.newPanel.showLoading({'message':'Fetching List'});
				var _tag = {}
				_tag.callback = function(rd)	{
					if(app.model.responseHasErrors(rd)){
						$target.anymessage({'message':rd})
						}
					else	{
						//applies the content to the panel.
						ui.newPanel.anycontent(rd).data('contentloaded',true);

if(ui.newHeader.data('pickmethod') == 'NAVCAT')	{
	$('label',ui.newPanel).each(function () {  
		if($(this).data('value').charAt(0) != '.')	{
			$(this).empty().remove(); //clear out lists, pages (login, contact, etc) and corrupt data.
			}
		});
	}

//selectors are values passed in that get 'checked' (turned on).
	if(selectors)	{
//		app.u.dump("selectors are set: "+selectors);
		var selArr = selectors.split('\n');
		var L = selArr.length;
//		app.u.dump(" -> selArr:"); app.u.dump(selArr);
		for(var i = 0; i < L; i += 1)	{
			if(selArr[i] == 'all' || selArr[i].indexOf('csv') === 0)	{
				//csv and 'all' are handled already.
				}
			else	{
				//the checkboxes haven't been added to the dom yet.  They have to be handled as the panel content is generated.
//				app.u.dump(" -> selArr[i].replace('=','+'): "+selArr[i].replace('=','+'));
//				app.u.dump(" -> selector.length: "+$("[name='"+selArr[i].replace('=','+')+"']",ui.newPanel).length);
				$("[name='"+selArr[i].replace('=','+')+"']",ui.newPanel).prop('checked','checked');
				}
			}
		}
						}
					}
				if(ui.newHeader.data('pickmethod') == 'LIST')	{
					app.ext.admin.calls.appCategoryList.init({'root':'.','filter':'lists'},_tag,'mutable');
					}
				else if(ui.newHeader.data('pickmethod') == 'NAVCAT')	{
					app.ext.admin.calls.appCategoryList.init({'root':'.','filter':''},_tag,'mutable');
					}
				else if(ui.newHeader.data('pickmethod') == 'CUSTOMER_SUBSCRIBERLISTS')	{
					app.ext.admin.calls.adminNewsletterList.init(_tag,'mutable');
					}
				else if(ui.newHeader.data('pickmethod') == 'PROFILE')	{
					_tag.datapointer = 'adminEBAYProfileList'
					app.model.addDispatchToQ({'_cmd':'adminEBAYProfileList','_tag': _tag},'mutable');
					}
				else if(ui.newHeader.data('pickmethod') == 'SUPPLIER')	{
					_tag.datapointer = 'adminSupplierList'
//when this all gets changed to use the dispatch Q, use the if/else if to set a cmdObj instead of just _tag, and use the localStorage check just once at the end.
					if(app.model.fetchData(_tag.datapointer) == false)	{
						app.model.addDispatchToQ({'_cmd':'adminSupplierList','_tag':_tag},'mutable');
						}
					else	{
						app.u.handleCallback(_tag);
						}
					}
				else if(ui.newHeader.data('pickmethod') == 'MCAT')	{
					app.ext.admin.calls.adminProductManagementCategoryList.init(_tag,'mutable');
					}
				else	{
					//ERROR! unrecognized pick method. !!!
					ui.newPanel.hideLoading();
					ui.newPanel.anymessage({"message":"In admin.u.showPicker, unrecognized pickmethod ["+ui.newHeader.data('pickmethod')+"] on accordion header.","gMessage":true});
					}
				app.model.dispatchThis('mutable');
				}
			else	{}
			}
		
		});

	if(selectors)	{
		if(selectors == 'all')	{
			$("[name='SELECTALL']",$D).prop('checked','checked');
			}
		else	{
			
			var selArr = selectors.split('\n');
			var L = selArr.length;
			for(var i = 0; i < L; i += 1)	{
				if(selArr[i].indexOf('csv') === 0)	{
					$("[name='csv']",$D).val(selArr[i].substring(4));
					}
				else	{
					//the checkboxes haven't been added to the dom yet.  They have to be handled as the panel content is generated.
	//				$("[name='"+selArr[i].replace('=','+')+"']",$tag).prop('checked','checked');
					}
				}
			}
		}



	r = $D.children();
	}
else	{
	$('#globalMessaging').anymessage({"message":"In admin.u.getPicker, either templateID ["+data.templateID+"] not set or mode blank/invalid ["+data.mode+"]. Mode accepts customer or product.","gMessage":true});
	}
//use this to disable the accordion if 'select all' is checked.	
//$( ".selector" ).accordion( "option", "disabled", true );
				return r;
				},
				




			showDownloads : function($target)	{
				$target.anycontent({'templateID':'downloadsPageTemplate','showLoading':false});
				$('section',$target).anypanel({
					showClose:false,
					wholeHeaderToggle:false
					});
				app.u.handleEventDelegation($target);
				app.ext.admin.u.applyEditTrackingToInputs($target);
				app.u.handleCommonPlugins($target);
				app.u.handleButtons($target);
				},


			showSitesTab : function($target)	{
				$target.empty();
				$target.showLoading({'message':'Fetching List of Domains'});
//if domains are not already in memory, get a new partition list too. that way the callback isn't executed before the domains are available.
				app.model.addDispatchToQ({
					'_cmd':'adminDomainList',
					'hosts' : 1,
					'_tag':	{
						'datapointer' : 'adminDomainList',
						'callback':function(rd)	{
							if(app.model.responseHasErrors(rd)){
								$('#globalMessaging').anymessage({'message':rd});
								}
							else	{
								$target.hideLoading();
								var domains = app.data[rd.datapointer]['@DOMAINS'];
								app.data[rd.datapointer]['*favorites'] = new Array();
								var L = domains.length;
								for(var i = 0; i < L; i += 1)	{
									if(domains[i].IS_FAVORITE == 1)	{
										app.data[rd.datapointer]['*favorites'].push(domains[i]);
										}
									}
								$target.anycontent({'templateID':'pageTemplateSites','datapointer':rd.datapointer});
								app.u.handleAppEvents($target);

								}
							}
						}
					},'mutable');
				app.model.dispatchThis('mutable');

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
_cmd or call must be set in the form data (as hidden, for instance).
 -> _cmd will take the entire serialized form into a dispatch (see note on _tag below).
 -> call should be formatted as extension/call (ex: admin_task/adminTaskUpdate)

The _tag can be generated two ways.
1. Passed in thru _tag. _tag in form will override.
2. OR as hidden inputs, like so:  <input type='hidden' name='_tag/something' value='someval'> 
 -> these would get formatted as _tag : {'something':'someval'}

Execute your own dispatch. This allows the function to be more versatile
set as onSubmit="app.ext.admin.a.processForm($(this)); app.model.dispatchThis('mutable'); return false;"
 -> if data-q is set to passive or immutable, change the value of dispatchThis to match.
*/
			processForm : function($form,q,_tag)	{
//				app.u.dump("BEGIN admin.a.processForm");
				var r = true;  //what is returned.
				var obj = $form.serializeJSON({'cb':$form.data('cb_tf')}) || {};
				_tag = _tag || {};
				
//				app.u.dump(" -> obj: "); app.u.dump(obj);
				
				if($form.length && (obj._cmd || obj.call || obj._macrobuilder))	{
//build the _tag obj.
					_tag = $.extend(true,_tag,app.ext.admin.u.getTagObjFromSFO(obj));
					_tag.jqObj = _tag.jqObj || $form;
//					app.u.dump(" -> _tag in processForm: "); app.u.dump(_tag);
					
					
					
					if(obj._macrobuilder)	{
						app.u.dump(" -> is a macrobuilder.");
						var mbArr = obj._macrobuilder.split('|');
						obj._tag = _tag; //when adding straight to Q, _tag should be a param in the cmd object.
						if(mbArr.length > 1 && app.ext[mbArr[0]] && app.ext[mbArr[0]].macrobuilders &&  typeof app.ext[mbArr[0]].macrobuilders[mbArr[1]] == 'function')	{
							app.model.addDispatchToQ(app.ext[mbArr[0]].macrobuilders[mbArr[1]](obj,$form),q);
							}
						else	{
							app.u.dump(" -> UNABLE to build macro.");
							r = false;
							$form.anymessage({'message':'In admin.a.processForm, macrobuilder was passed ['+obj.macrobuilder+'] but does not map to a valid macrobuilder. should be extension|functionname where functionname is a function residing in macrobuilders of specified extension.','gMessage':true});
							}
						}
					else if(obj._cmd)	{
						app.u.dump(" -> is a command.");
						obj._tag = _tag; //when adding straight to Q, _tag should be a param in the cmd object.
//had an issue w/ adding directly to the Q where if an error was present in the response and 'save' was pushed again, the original dispatch would re-send, not this one. odd. using extend solved problem.
						app.model.addDispatchToQ($.extend(true,{},obj),q);
						}
					else if(obj.call)	{
						app.u.dump(" -> is a call.");
						var call = obj.call; //save to another var. obj.call needs to be deleted so it isn't passed in dispatch.
						delete obj.call;
						app.u.dump(" -> call: "+call);
						app.ext.admin.calls[call.split('/')[1]].init(obj,_tag,q)
						}
					else{} //can't get here. either cmd or call are set by now.

					if(_tag.updateDMIList)	{
						var $DMI = $(app.u.jqSelector('#',_tag.updateDMIList));
						if($DMI.length)	{
							var cmdVars = $DMI.data('cmdVars');
							if(cmdVars && cmdVars._cmd)	{
								$("[data-app-role='dualModeListTbody']",$DMI).empty(); //clear existing rows.
								cmdVars._tag = cmdVars._tag || {};
								cmdVars._tag.callback = cmdVars._tag.callback || 'DMIUpdateResults';
								cmdVars._tag.extension = cmdVars._tag.extension || 'admin';
//								app.u.dump(" -> cmdVars:" );app.u.dump(cmdVars);
// ** 201344 -> don't want to re-render the panels, jus tthe 'list' section.
								cmdVars._tag.jqObj = $DMI.find("[data-app-role='dualModeList']:first");
								app.model.addDispatchToQ(cmdVars,q);
								}
							else	{
								$form.anymessage({'message':'In admin.a.processForm, _tag/updateDMIList passed but DMI.data("cmdVars") is empty or has no _cmd set. cmdVars should be set at DMICreate and _cmd is required so that the appropriate _cmd can be run.','gMessage':true});
								}
							}
						else	{
							$form.anymessage({'message':'In admin.a.processForm, _tag/updateDMIList passed but #'+_tag.updateDMIList+' has no length (is not on DOM).','gMessage':true});
							} //
						}
					
					}
				else	{
					r = false;
					app.u.throwGMessage("Warning! $form was empty or _cmd or call not present within $form in admin.a.processForm");
					}
//				app.u.dump("END processForm");

				return r;
				}, //processForm



			showDomainConfig : function(){
				$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).empty().showLoading({"message":"Requesting up to date list of domains."});
				app.model.destroy('adminDomainList');
				app.ext.admin.calls.adminDomainList.init({'callback':'showDomainConfig','extension':'admin'},'immutable');
				app.model.dispatchThis('immutable')
				},
			

//host is www.zoovy.com.  domain is zoovy.com or m.zoovy.com.  This function wants a domain.
//changeDomain(domain,partition,path). partition and path are optional. If you have the partition, pass it to avoid me looking it up.
			changeDomain : function(domain,partition,path){
//				app.u.dump("BEGIN admin.u.changeDomain"); app.u.dump(" -> domain: "+domain);
				app.u.dump(" -> partition: "+partition+" and Number(partition): "+Number(partition)+" and app.u.isSet: "+app.u.isSet(partition));
				if(domain)	{
//if no partition available, get it. if partition is null, number() returns 0.		
					if(partition == 0 || Number(partition) > 0){
						//if partition is 'false' or undef, number(partition) will = 0. not good in this case.
						}
					else	{
//(( 201338 -> previously used getDataForDomain, which was broken. changed to shared function.
						var domainData = app.ext.admin.u.getValueByKeyFromArray(app.data.adminDomainList['@DOMAINS'],'DOMAINNAME',domain);
						if(domainData && domainData.PRT)	{
							partition = domainData.PRT; 
							}
						}
// ** 201338 -> added this check to track down where partition isn't getting properly set.
					if(domain && (partition == 0 || Number(partition) > 0))	{
						app.vars.domain = domain;
						app.vars.partition = partition;
						app.vars.https_domain = app.data['adminDomainList']['media-host'];
	//set the vars in localStorage. This is what will be used upon return to preselect a domain.
						app.model.dpsSet('admin',"domain",domain); 
						app.model.dpsSet('admin',"partition",partition); 
						app.model.dpsSet('admin',"https_domain",app.vars.https_domain); 
	//update the view.
						$('.partition','#appView').text(partition);
						$('.domain','#appView').text(domain);
	
	//get entire auth localstorage var (flattened on save, so entire object must be retrieved and saved)
	//something here is causing session to not persist on reload.
	/*					if(app.model.fetchData('authAdminLogin'))	{
							var localVars = app.data['authAdminLogin'];
							localVars.domain = domain;
							localVars.partition = partition || null;
							app.storageFunctions.writeLocal('authAdminLogin',localVars);
							}
	*/
	//					app.u.dump(" -> path: "+path);
						showUI(app.ext.admin.u.whatPageToShow(path || '/biz/setup/index.cgi'));

						}
					else	{
						$('#globalMessaging').anymessage({"message":"In admin.u.changeDomain, partition ["+partition+"] was not passed, valid and/or could not be ascertained","gMessage":true})
						}
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
//				app.u.dump("BEGIN admin.a.addFinderTo('"+targetID+"')"); app.u.dump(vars);
				$(app.u.jqSelector('#',targetID)).parent().find('.ui-dialog-title').text('loading...'); //empty the title early to avoid confusion.
				if(vars.findertype == 'PRODUCT')	{
					app.ext.store_product.calls.appProductGet.init(vars.path,{"callback":"addFinderToDom","extension":"admin","targetID":targetID,"path":vars.path})
					}
				else if(vars.findertype == 'NAVCAT')	{
//Too many f'ing issues with using a local copy of the cat data.
					app.model.destroy('appNavcatDetail|'+vars.path);
					app.calls.appNavcatDetail.init({'safe':vars.path,'detail':'fast'},{"callback":"addFinderToDom","extension":"admin","targetID":targetID})
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
//path - category safe id or product SKU
//attribute - ex: zoovy:accessory_products
//vars is for variables. eventually, path and attrib should be move into the vars object.
//vars will be used to contain all the 'chooser' variables.
			showFinderInModal : function(findertype,path,attrib,vars)	{
				app.u.dump("BEGIN showFinderInModal. findertype: "+findertype+" and path: "+path);
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






			showProjects : function($target)	{

				$target.intervaledEmpty();
				app.ext.admin.i.DMICreate($target,{
					'header' : 'Hosted Applications',
					'className' : 'projects',
					'controls' : "",
					'buttons' : ["<button data-app-event='admin|refreshDMI'>Refresh List<\/button><button data-app-event='admin|projectCreateShow'>New Project</button>"],
					'thead' : ['ID','Title','Type','Created','Updated',''],
					'tbodyDatabind' : "var: projects(@PROJECTS); format:processList; loadsTemplate:projectsListTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminProjectList',
						'limit' : '50', //not supported for every call yet.
						'_tag' : {
							'datapointer':'adminProjectList'
							}
						}
					});
				app.model.dispatchThis('mutable');

				},

			showRSS : function($target)	{
				
				$target.intervaledEmpty();
				app.ext.admin.i.DMICreate($target,{
					'header' : 'RSS Feeds',
					'className' : 'rssFeeds',
					'controls' : "",
					'buttons' : ["<button data-app-event='admin|refreshDMI'>Refresh List<\/button><button class='floatRight' data-app-event='admin|adminRSSCreateShow' >New RSS Feed</button>"],
					'thead' : ['ID','Title','Status','Profile','Schedule',''],
					'tbodyDatabind' : "var: projects(@RSSFEEDS); format:processList; loadsTemplate:rssListTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminRSSList',
						'limit' : '50', //not supported for every call yet.
						'_tag' : {
							'datapointer':'adminRSSList'
							}
						}
					});
				app.model.dispatchThis('mutable');
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
				$content.empty().anycontent({'templateID':'dashboardTemplate','showLoading':false});
				app.ext.admin.u.bringTabIntoFocus();
				app.ext.admin.u.bringTabContentIntoFocus($content);
				
//recent news panel.
				app.model.destroy('appResource|recentnews.json'); //always fetch the most recent news.
				$('#dashboardColumn1',$content).anypanel({
					'showClose' : false
					}).showLoading({'message':'Fetching recent news'});

				app.ext.admin.calls.appResource.init('recentnews.json',{'callback':'anycontent','jqObj':$('#dashboardColumn1')},'mutable'); //total sales


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
//				app.u.dump("BEGIN admin.u.showHeader");
//hide all preView and login data.
				$('#appLogin').hide(); 
				$('#appPreView').hide();
				$('#createAccountContainer').hide();

				$('#appView').show();
				
				$("#closePanelButton",'#appView').button({icons: {primary: "ui-icon-triangle-1-n"},text: false});
				$("#clearMessagesButton",'#appView').button({icons: {primary: "ui-icon-trash"},text:true});
				
				
				$('body').hideLoading(); //make sure this gets turned off or it will be a layer over the content.
				
// ** 201338 -> need the product task list ul generated as early as possible.
app.ext.admin_prodEdit.a.showProductManager();



//				app.ext.admin.calls.bossUserDetail(app.vars.userid.split('@')[0],{},'passive'); //will contain list of user permissions.
//immutable because that's wha the domain call uses. These will piggy-back.



					

app.ext.admin.calls.adminMessagesList.init(app.ext.admin.u.getLastMessageID(),{'callback':'handleMessaging','extension':'admin'},'immutable');
app.u.handleEventDelegation($('#messagesContent'));
app.model.addDispatchToQ({
	'detail':'more',
	'_cmd': 'adminNavTreeList',
	'_tag' : {datapointer: 'adminNavTreeList'}
	},'immutable');
app.ext.admin.calls.appResource.init('shipcodes.json',{},'immutable'); //get this for orders.
app.model.addDispatchToQ({'_cmd':'platformInfo','_tag':	{'datapointer' : 'info'}},'immutable');

				
//show the domain chooser if no domain is set. see showDomainChooser function for more info on why.
//if a domain is already set, this is a return visit. Get the list of domains  passively because they'll be used.
				if(!app.vars.domain) {
					//the selection of a domain name will load the page content. (but we'll still need to nav)
					app.ext.admin.a.showDomainChooser(); //does not dispatch itself.
					}
				else {
					
					
					app.ext.admin.calls.adminDomainList.init({},'immutable');
					
					$('.username','#appView').text(app.vars.userid);
					$('.domain','#appView').text(app.vars.domain);
					$('.partition','#appView').text(app.vars.partition);
					var linkFrom = linkFrom = app.u.getParameterByName('linkFrom');
					if(linkFrom)	{
						app.u.dump("INCOMING! looks like we've just returned from a partner page");
						if(linkFrom == 'amazon-token')	{
							app.ext.admin.a.showUI('#!syndication');
							app.ext.admin.a.showAmzRegisterModal();
							}
						else	{
							app.ext.admin.a.showUI('#!dashboard');
							}
						}
					else	{
						app.ext.admin.a.showUI(app.ext.admin.u.whatPageToShow('#!dashboard'));

						if(document.URL.indexOf("/future/") > 0)	{
							$('#globalMessaging').anymessage({"message":"<h5>Welcome to the future!<\/h5><p>You are currently using a future (experimental) version of our interface. Here you'll find links labeled as 'alpha' and 'beta' which are a work in progress.<\/p>Alpha: here for your viewing pleasure. These links may have little or no working parts.<br \/>Beta: These are features in the testing phase. These you can use, but may experience some errors.<br \/><h6 class='marginTop'>Enjoy!<\/h6>","persistent":true});
							}
						}
					}
				app.model.dispatchThis('immutable');
//if there's a lot of messages, this can impact app init. do it last.  This will also put new messages at the top of the list.
				var	DPSMessages = app.model.dpsGet('admin','messages') || [];
				if(DPSMessages.length)	{
					app.ext.admin.u.displayMessages(DPSMessages);
					}

				}, //showHeader






			//return a boolean. NO MESSAGING>  that's use-case specific.
			validatePicker : function($picker) {
				var r = false;
				if($("[data-app-role='pickerContainer']",$picker).find(':checkbox:checked').length)	{
					r = true;
					}
				else if($("[name='csv']",$picker).val() || ($("[name='rstart']",$picker).val() && $("[name='rend']",$picker).val()) || ($("[name='createstart']",$picker).val() && $("[name='createend']",$picker).val()))	{
					r = true;
					}
				else	{}
				return r;
				},	



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

			//messages would be an array and all would be displayed.
			displayMessages : function(messages)	{ //messages could come from an API response or localstorage on load.
//			app.u.dump(" -> messages:");  app.u.dump(messages);
				if(messages)	{
					var
						$tbody = $("[data-app-role='messagesContainer']",'#messagesContent'),
						L = messages.length,
						$tmp = $("<table><tbody><\/tbody><\/table>"); //used to store the rows so DOM is only updated once.
	
						for(var i = 0; i < L; i += 1)	{
							$('tbody',$tmp).anycontent({
								'templateID':'messageListTemplate',
								'dataAttribs':{'messageid':messages[i].id}, //used in detail view to find data src
								'data':messages[i]
								});
							}
						app.u.handleCommonPlugins($tmp);
						app.u.handleButtons($tmp);
	
						$('tbody',$tmp).children().appendTo($tbody);
						}
					else	{} //no new messages.
					
					app.ext.admin.u.updateMessageCount(); //update count whether new messages or not, in case the count is off.

				},
			

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
//display an individual messages detail.
			getMessageDetail : function(messageID)	{
				var $r = $("<div \/>");
				if(messageID)	{
					var
						DPSMessages = app.model.dpsGet('admin','messages') || [],
						L = DPSMessages.length,
						msg = {};
					
					for(var i = 0; i < L; i += 1)	{
						if(DPSMessages[i].id == messageID)	{
							msg = DPSMessages[i];
							break; //exit early once a match is found.
							}
						else	{}
						}
					
					if($.isEmptyObject(msg))	{
						$r.anymessage({'message':'In admin.u.getMessageDetail, unable to find messageID ['+messageID+'] in dpsMessages are required','gMessage':true});
						}
					else	{
						app.u.dump(" -> msg:");		app.u.dump(msg);
						$r.anycontent({'templateID':'messageDetailTemplate','data':msg});
						}
					}
				else	{
					$r.anymessage({'message':'In admin.u.getMessageDetail, messageID not passed and is required','gMessage':true});
					}
				return $r;
				},

			getLastMessageID : function()	{
				return app.model.dpsGet('admin','lastMessage') || 0;
				/*
				var r = 0; //default to zero if no past messageid is present.
				var DPSMessages = app.model.dpsGet('admin','messages');
				if(DPSMessages && DPSMessages.length)	{
					r = DPSMessages[(DPSMessages.length - 1)].id;
					app.u.dump("DPSMessages[(DPSMessages.length - 1)].id: "+DPSMessages[(DPSMessages.length - 1)].id);
					}
				*/
				return r;
				},


			jump2GoogleLogin : function(state){
//				app.u.dump(" -> state: "+state);
				var p = {
					'scope':'openid email',
					'response_type' : 'token id_token',
					'client_id' : '286671899262-sc5b20vin5ot00tqvl8g8c93iian6lt5.apps.googleusercontent.com',
					'redirect_uri' : 'https://www.zoovy.com/app/latest/app-support.html',
					'state' : state || ""
					};
				window.location = 'https://accounts.google.com/o/oauth2/auth?'+$.param(p);
				},

//used in ebay and campaign to generate toolbar for html editor.
//buttons is optional. if passed, should be an array. [{'css':'','text':'','action':function(){}},{'css':'','text':'','action':function(){}}]
			buildToolbarForEditor : function(buttons)	{
				buttons = buttons || [];
				var r = new Array(); //what is returned. an array that gets turned into buttons in the html editor.
				r.push("html");
				r.push("bold", "italic","strikethrough");
				r.push("p","h1", "h2", "h3", "h4", "h5", "h6");
				r.push("orderedList","unorderedList","|","indent","outdent");
				r.push("horizontalrule");
				r.push("justifyleft","justifycenter","justifyright");
				r.push("link", "unlink");
				var L = buttons.length;
				if(L)	{
					for(var i = 0; i < L; i += 1)	{
						r.push(buttons[i])
						}
					}
				return r;
				},

			
			removeFromDOMItemsTaggedForDelete : function($context)	{
				$('tr.rowTaggedForRemove',$context).each(function(){
					$(this).empty().remove();
					})
				},

//used in conjunctions with applyEditTrackingToInputs. it's a separate function so it can be called independantly.
// .edited is used with no element qualifier (such as input) so that it can be applied to non inputs, like table rows, when tables are updated (shipmethods)
//ui-button class is used to determine if the button has had button() run on it. otherwise it'll cause a js error.
			handleSaveButtonByEditedClass : function($context)	{
				app.u.dump("BEGIN admin.u.handleSaveButtonByEditedClass");
//*** 201344 -> code moved into anydelegate.
				if($context.hasClass('eventDelegation'))	{
					$context.anydelegate('updateChangeCounts');
					}
				else	{
					$context.closest('.eventDelegation').anydelegate('updateChangeCounts');
					}
				},
			
		
//run this after a form that uses 'applyuEditTrackingToInputs' is saved to revert to normal.
			restoreInputsFromTrackingState : function($context)	{
//*** 201344 -> code moved into anydelegate.
				if($context.hasClass('eventDelegation'))	{
					$context.anydelegate('resetTracking');
					}
				else	{
					$context.closest('.eventDelegation').anydelegate('resetTracking',$context);
					}
				},
			
//pass in a form and this will apply some events to add a 'edited' class any time the field is edited.
//will also update a .numChanges selector with the number of elements within the context that have edited on them.
//will also 'enable' the parent button of that class.
// ### update this to use event delegation on $context
			applyEditTrackingToInputs : function($context)	{
//*** 201344 -> code moved into anydelegate.
				$context.anydelegate({trackEdits : true});
				$context.attr('data-applied-inputtracking',true); //is attribute so we can easily inspect on the dom.
				}, //applyEditTrackingToInputs





			handleFormConditionalDelegation : function($context)	{
//*** 201344 -> code moved into anydelegate.
				$context.anydelegate({trackEdits : true});
				},



// ### time permittting, replace use of function below with getWhitlestedObject
//used when converting a tr.data() into a kvp array. used in amazon thesaurus and shipments.
			getSanitizedKVPFromObject : function(obj)	{
				var newObj = $.extend(true,{},obj); //extend will create a duplicate so original object is unmodified.
//				var whitelist = new Array('fee','weight','subtotal');
				delete newObj.isTranslated;
				delete newObj.sortableItem;
				delete newObj.templateid; delete newObj.obj_index; delete newObj.anycontent; delete newObj.uiAnycontent; //some extras not needed.
				return $.param(newObj);
				},



//pass in an object (probably a Serialized Form Object) and any tag that starts with _tag/ will be returned as part of an object.
			getTagObjFromSFO : function(sfo)	{
				var r = {}; //what is returned.
				if(!$.isEmptyObject(sfo))	{
//					app.u.dump('not empty object');
					for(var key in sfo)	{
						if(key.substring(0,5) == "_tag/")	{
							r[key.substring(5)] = sfo[key];//_tag/ must be stripped from key.
							delete sfo[key]; //remove from original object so it isn't part of query.
							}
						else{}
						}
					}
				return r;
				},


			loadNativeApp : function(path,opts,$target){
//				app.u.dump("BEGIN loadNativeApp");
				app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
				app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.

//				if(!$target)	{app.u.dump("TARGET NOT SPECIFIED")}

				if(path == '#!mediaLibraryManageMode')	{
					app.ext.admin_medialib.a.showMediaLib({'mode':'manage'});
					}
				else if(path == '#!domainConfigPanel')	{
// * 201332 -> new domain interface
//					app.ext.admin.a.showDomainConfig();
					app.ext.admin_config.a.showDomainManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
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
					app.ext.admin_reports.a.showReportsPage($('#reportsContent'));
					}
				else if(path == '#!kpi')	{app.ext.admin_reports.a.showKPIInterface();}
				else if(path == '#!userManager')	{app.ext.admin_user.a.showUserManager($target);}
				else if(path == '#!batchManager')	{
					app.ext.admin.vars.tab = 'utilities';
					this.bringTabIntoFocus('utilities');
					this.bringTabContentIntoFocus($('#utilitiesContent'));
					app.ext.admin_batchJob.a.showBatchJobManager($('#utilitiesContent'));
					}
				else if(path == '#!customerManager')	{app.ext.admin_customer.a.showCustomerManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));}
				else if(path == '#!variationsManager')	{
//					app.u.dump("$target: "); app.u.dump($target);
					app.ext.admin_prodEdit.a.showStoreVariationsManager($target || $(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!help')	{
					$('#supportContent').empty();
					this.bringTabIntoFocus('support');
					this.bringTabContentIntoFocus($('#supportContent'));
					app.ext.admin_support.a.showHelpInterface($('#supportContent'));
					}
				else if(path == '#!support')	{
					$('#supportContent').empty();
					this.bringTabIntoFocus('support');
					this.bringTabContentIntoFocus($('#supportContent'));
					app.ext.admin_support.a.showTicketManager($('#supportContent'));
					}
				else if(path == '#!eBayListingsReport')	{app.ext.admin_reports.a.showeBayListingsReport();}
				else if(path == '#!orderPrint')	{app.ext.convertSessionToOrder.a.printOrder(opts.data.oid,opts);}
				else if(path == '#!supplierManager')	{app.ext.admin_wholesale.a.showSupplierManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).empty())}

				else if(path == '#!orderCreate2')	{
					app.calls.appCartCreate.init({'callback':function(rd){
						if(app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							//appCartCreate will automatically set app.vars.cartid
							app.ext.orderCreate.a.startCheckout($target);
							}
						}},'immutable');
						app.model.dispatchThis('immutable');
					}
				else if(path == '#!orderCreate')	{app.ext.convertSessionToOrder.a.openCreateOrderForm();}

				else if(path == '#!downloads')	{
					$('#homeContent').empty();
					this.bringTabIntoFocus('home');
					this.bringTabContentIntoFocus($('#homeContent'));
					app.ext.admin.a.showDownloads($('#homeContent'));
					}
				else if(path == '#!showEmailAuth')	{
					app.ext.admin_config.a.showEmailAuth($target);
					}
					
					
				else if(path == '#!giftcardManager')	{
					app.ext.admin_customer.a.showGiftcardManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!notifications')	{
					app.ext.admin_config.a.showNotifications($target);
					}
				else if(path == '#!trainer')	{
					app.ext.admin_trainer.a.showTrainer($target);
					}
				else if(path == '#!categoriesAndLists')	{
					app.ext.admin_navcats.a.showCategoriesAndLists($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!billingHistory')	{
					app.ext.admin_config.a.showBillingHistory($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!globalVariations')	{
					app.ext.admin_prodEdit.a.showStoreVariationsManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!publicFiles')	{
					app.ext.admin_medialib.u.showPublicFiles(path,opts);
					}

				else if(path == '#!globalSettings')	{
					app.ext.admin_config.a.showGlobalSettings($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!billingHistory')	{
					app.ext.admin_tools.a.showBillingHistory($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}


				else if(path == '#!showPlatformInfo')	{
					app.ext.admin_support.a.showPlatformInfo($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}

				else if(path == '#!partitionManager')	{
					app.ext.admin_config.a.showPartitionManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}

				else if(path == '#!privateFiles')	{
					app.ext.admin_tools.a.showPrivateFiles($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}

				else if(path == '#!manageFlexedit')	{
					app.ext.admin_tools.a.showManageFlexedit($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}

				else if(path == '#!pluginManager')	{
					app.ext.admin_config.a.showPluginManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!campaignManager')	{
					app.ext.admin_customer.a.showCampaignManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!ciEngineAgentManager')	{
					app.ext.admin_tools.a.showciEngineAgentManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!couponManager')	{
					app.ext.admin_config.a.showCouponManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!priceSchedules')	{
					app.ext.admin_wholesale.a.showPriceSchedules($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!accountUtilities')	{
					app.ext.admin_tools.a.showAccountUtilities($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!productPowerTool')	{
					app.ext.admin_tools.a.showPPT($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!productExport')	{
					app.ext.admin_tools.a.showProductExport($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!warehouseManager')	{
					app.ext.admin_wholesale.a.showWarehouseManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if(path == '#!warehouseUtilities')	{
					app.ext.admin_wholesale.a.showWarehouseUtilities($target);
					}
				else if(path == '#!reviewsManager')	{
					app.ext.admin_customer.a.showReviewsManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')));
					}
				else if (path == '#!appChooser')	{
					app.ext.admin_templateEditor.a.showAppChooser();
					}
				else if (path == '#!projects')	{
					app.ext.admin.a.showProjects($(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")));
					}
				else if (path == '#!rss')	{
					app.ext.admin.a.showRSS($(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")));
					}
				else if (path == '#!paymentManager')	{
					app.ext.admin_config.a.showPaymentManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).empty());
					}
				else if (path == '#!shippingManager')	{
					app.ext.admin_config.a.showShippingManager($(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).empty());
					}
				else if (path == '#!contactInformation')	{
					app.ext.admin_config.a.showContactInformation($(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).empty());
					}
				else if (path == '#!syndication')	{
					app.ext.admin.vars.tab = 'syndication';
					app.ext.admin.u.bringTabIntoFocus('syndication');
					app.ext.admin.u.bringTabContentIntoFocus($("#syndicationContent"));
					app.ext.admin_syndication.a.showSyndication($("#syndicationContent"));
					}
				else if(path == '#!sites')	{
					app.ext.admin.vars.tab = 'sites';
					app.ext.admin.u.bringTabIntoFocus('sites');
					app.ext.admin.u.bringTabContentIntoFocus($("#sitesContent"));
					app.ext.admin.a.showSitesTab($("#sitesContent"));
					}
				else if(path == '#!taxConfig')	{
					app.ext.admin_config.a.showTaxConfig($(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")));
					}
				else if(path == '#!orders')	{
//					app.u.dump("into loadNativeApp -> #!orders");
					app.ext.admin.vars.tab = 'orders';
					app.ext.admin.u.bringTabIntoFocus('orders');
					app.ext.admin.u.bringTabContentIntoFocus($("#ordersContent"));
					app.ext.admin_orders.a.initOrderManager({"targetID":"ordersContent"});
//					app.u.dump("end of loadNativeApp  else statement -> #! orders");
					}
				else if(path == '#!product')	{
//					app.u.dump("Go to product editor");
// ** 201336 -> new product editor.
//					app.ext.admin_prodEdit.a.showProductEditor(path,opts);
					app.ext.admin.vars.tab = 'product';
					app.ext.admin.u.bringTabIntoFocus('product');
					app.ext.admin.u.bringTabContentIntoFocus($("#productContent"));
					app.ext.admin_prodEdit.a.showProductManager(opts);
					}
				else if(path == '#!taskManager')	{
					app.ext.admin_task.a.showTaskManager($target);
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
				
				if($target instanceof jQuery)	{
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
					}

				},


			clearAllMessages : function(){
				$("[data-app-role='messagesContainer']",'#messagesContent').intervaledEmpty();

				app.model.dpsSet('admin','messages',[]);
				app.ext.admin.u.updateMessageCount(); //update count whether new messages or not, in case the count is off.
				// NOTE ### -> when this is updated to trigger a clear on the server, add a confirm prompt.
				},
			toggleMessagePane : function(state){

				var $target = $('#messagesContent');
				$target.css({top : $target.parent().height()})
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
// ** 201336 -> new product editor.
//					app.ext.admin_prodEdit.u.showProductEditor(path,P);
					app.ext.admin_prodEdit.a.showProductManager(P);					
					}
				else if(tab == 'kpi' || path == '/biz/kpi/index.cgi')	{
					app.ext.admin.u.bringTabIntoFocus('kpi');
					app.ext.admin.u.bringTabContentIntoFocus($('#kpiContent'));
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					app.ext.admin_reports.a.showKPIInterface();
					}
				else if(tab == 'sites' || path == '/biz/sites/index.cgi')	{
					app.ext.admin.u.bringTabIntoFocus('sites');
					app.ext.admin.u.bringTabContentIntoFocus($('#sitesContent'));
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					app.ext.admin.a.showSitesTab($("#sitesContent"));
					}
				else if(tab == 'reports' || path == '/biz/reports/index.cgi')	{
					app.ext.admin.u.bringTabIntoFocus('reports');
					app.ext.admin.u.bringTabContentIntoFocus($('#reportsContent'));
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					app.ext.admin_reports.a.showReportsPage($('#reportsContent'));
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
					app.ext.admin_syndication.a.showSyndication($('#syndicationContent'));
//					app.ext.admin.u.uiHandleLinkRewrites(path,{},{'targetID':'syndicationContent'});
					}
				else if(tab == 'crm' && path.split('/')[3] == 'index.cgi')	{
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					app.ext.admin_customer.a.showCRMManager($('#crmContent'));
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
// * 201332 -> interface was replaced a version or two ago and this was overlooked.
//				else if(tab == 'setup' && path.split('/')[3] == 'customfiles')	{
//					app.u.dump(" -> open public files list");
//					app.ext.admin_medialib.u.showPublicFiles(path,P);
//					}
				else	{
//					app.u.dump(" -> open something wonderful .. "+path); app.u.dump(" -> P: "); app.u.dump(P);
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
				viewObj = viewObj || {};
				if(viewObj.targetID)	{
					data = data || {};
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
						var $a = $("<a \/>").attr({'title':tabs[i].name,'href':'#'}).addClass(className).append("<span>"+tabs[i].name+"<\/span>");
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
//only click events can open a new window w/out triggering a popup warning. so only set skipInterstitial to true of being triggered by a click.
			linkOffSite : function(url,pretty,skipInterstitial){
				app.u.dump("BEGIN admin.u.linkOffSite to "+url);
				if(url)	{
					if(skipInterstitial)	{
						window.open(url);
						}
					else	{
//** 201344 -> FF now treating window.open w/ no params as a popup and requiring auth. 
						pretty = pretty || "<br>"+url;
						$("<div>",{'title':'Link offsite'}).append("<a href='"+url+"' target='_blank'>click here to continue to </a> "+pretty).on('click','a',function(){
							$(this).closest('.ui-dialog-content').dialog('close');
							}).dialog({'modal':true});
						}
	//					window.open(url);
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin.u.linkOffSite, no URL passed.","gMessage":true});
					}
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
//					app.ext.admin.calls.adminProductUpdate.init(sku,attribObj,{'callback':'pidFinderChangesSaved','extension':'admin'});
					app.model.addDispatchToQ({
						'pid':sku,
						'%attribs':attribObj,
						'_cmd': 'adminProductUpdate',
						'_tag' : {'callback':'pidFinderChangesSaved','extension':'admin'}
						},'immutable');					
					app.calls.appProductGet.init({'pid':sku},{},'immutable');
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
					app.model.destroy('appNavcatDetail|'+path);
					app.calls.appNavcatDetail.init({'safe':path,'detail':'fast'},{"callback":"finderChangesSaved","extension":"admin"},'immutable');
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
executed in a callback for a appNavcatDetail or a appProductGet.
generates an instance of the product finder.
targetID is the id of the element you want the finder added to. so 'bob' would add an instance of the finder to id='bob'
path is the list/category src (ex: .my.safe.id) or a product attribute [ex: product(zoovy:relateditems)].
if pid is passed into this function, the finder treats everything as though we're dealing with a product.
*/

			addFinder : function(targetID,vars){

app.u.dump("BEGIN admin.u.addFinder");
app.u.dump(" -> targetID: "+targetID);
app.u.dump(vars);

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
	$target.parent().find('.ui-dialog-title').text('Product Finder: '+app.data['appNavcatDetail|'+vars.path].pretty); //updates modal title
	prodlist = app.data['appNavcatDetail|'+vars.path]['@products'];
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
		$target.parent().find('.ui-dialog-title').text('Product Finder: '+app.data['appNavcatDetail|'+vars.path].pretty); //updates modal title
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
				var dps = app.model.dpsGet(); //all 'session' vars
				localStorage.clear();
				app.storageFunctions.writeLocal('authAdminLogin',admin);
// * 201320 -> domain and partition were persitent between sessions. bad for multi-account users and also support.
				dps.admin.domain = '';
				dps.admin.partition = '';
				app.storageFunctions.writeLocal('session',dps);
				},



			uiCompatAuthKVP : function()	{
				return '_userid=' + app.vars.userid + '&_authtoken=' + app.vars.authtoken + '&_deviceid=' + app.vars.deviceid + '&_domain=' + app.vars.domain;
				},

//$t is 'this' which is the button.


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
				else if(!$target)	{
					app.u.throwGMessage("In admin.u.handleAppEvents, target was either not specified.");
					}
				else	{
					app.u.throwGMessage("In admin.u.handleAppEvents, target is not an object ["+typeof $target+"] or does not exist ["+$target.length+"] on DOM.");
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
				},

			
			fetchRSSDataSources : function(Q)	{
				var numRequests = 0;
				Q = Q || 'mutable';
				numRequests += app.ext.admin.calls.adminPriceScheduleList.init({},Q); //need this for add and edit.
				numRequests += app.ext.admin.calls.adminDomainList.init({},Q); //need this for add and edit.
				numRequests += app.ext.admin.calls.appCategoryList.init({'root':'.','filter':'lists'},{},Q); //need this for add and edit.
				return numRequests;
				},

//this same coe is used both in 'create and update panels.
			handleRSSContent : function($target,$button){

var
	numRequests = app.ext.admin.u.fetchRSSDataSources('mutable'),
	callback = function(rd){
	$target.hideLoading();
	if(app.model.responseHasErrors(rd)){
		$target.anymessage({'message':rd})
		}
	else	{
		
		var 
			catTree = app.data['appCategoryList|'+app.vars.partition+'|.']['@paths'] //shortcut
			L = catTree.length,
			lists = new Array(); //stores a list of the 'lists' from the nav tree
		for(var i = 0; i < L; i += 1)	{
			if(catTree[i].charAt(0) == '$')	{
				lists.push({'id':catTree[i],'name':catTree[i].substring(1)});
				}
			}
		
		$target.anycontent({'templateID':'rssAddUpdateTemplate','data':$.extend(true,{'@lists':lists},app.data['adminDomainList'],app.data['adminPriceScheduleList'])});
		if($button)	{
			$('.buttonbar',$target).first().append($button)
			}
		$('.toolTip',$target).tooltip();
		app.u.handleAppEvents($target);
//create is/can be a modal, edit is a panel. The modal needs to be recentered after content is added.
		if($target.hasClass('ui-dialog-content'))	{
			$target.dialog('option', 'position', $target.dialog('option','position')); //reposition dialog in browser to accomodate new content.
			}
		
		}
	}


if(numRequests)	{
	app.calls.ping.init({'callback':callback},'mutable');
	app.model.dispatchThis('mutable');
	}
else	{
	callback({});
	}

				
				},
//used on an array of objects. [{some:value},{some:othervalue}]
//in ex above, pass in 'some and 'other value' and 1 will be returned.
		getIndexInArrayByObjValue : function(array,objkey,objvalue)	{
//			app.u.dump("BEGIN admin.u.getIndexInArrayByObjValue");
//			app.u.dump(" -> objvalue: "+objvalue);
			
			var r = false;  //what is returned. the variation index if a match is found.
			if(array && objkey && objvalue)	{
//				app.u.dump(" -> all required params are present.");
				var L = array.length;
				for(var i = 0; i < L; i+=1)	{
					if(array[i][objkey] == objvalue)	{
						r = i;
						break; //exit early once a match is found.
						}
					}
				}
			else	{
				$('#globalMessaging').anymessage({"message":"In admin_prodEdit.u.getProductVariationByID, either array or objkey ["+objkey+"] or objvalue ["+objvalue+"] not passed.","gMessage":true});
				}
//			app.u.dump(" -> getIndexInArrayByObjValue r:"+r);
			return r;
			},			
			
			
			getValueByKeyFromArray : function(obj,key,value)	{
//				app.u.dump("BEGIN admin.u.getValueByKeyFromArray");
//				app.u.dump("key: "+key);
//				app.u.dump("value: "+value);
//				app.u.dump("obj: "); app.u.dump(obj);
				var r = false; //what is returned. false or the object isf a match is found.
				if(key && value && !$.isEmptyObject(obj))	{
					for(var index in obj)	{
// * 201330 -> added obj[index] check. caused JS error if obj[index] doesn't exist.
						if(obj[index] && obj[index][key] == value)	{
							r = obj[index];
							break; //once a match is found, exit early.
							}
						}
//					app.u.dump("getValueByKeyFromArray r: "); app.u.dump(r);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin.u.getValueByKeyFromArray, either obj is empty or key ['+key+'] and/or value ['+value+'] is not set.','gMessage':true});
					}
				return r;
				}

			},	//util
			
//Special functions for building niterface  (i) components.
		i : {

/*
Will build an instance of the dual Mode Interface.
rather than letting the individual 'show' functions do all the manipulation, we do a lot of the basics here.
will allow us to make changes to the interface more easily going forward.

vars:
	tbodyDatabind: will be applied as attr(data-bind) to the tbody tag. REQUIRED.
	thead: an array, each of which is added as a thead.
	buttons: an array of buttons. Buttons can be HTML snippets or jquery objects. One button for toggling dual mode will already be present.
	controls: an html object that will be added to a row below the header and buttons. optional. if not set, that row is hidden. usually a form or two (search or filter)
	header: A piece of text added as the interface header.
	className : optional css applied to the template. Use this instead of applying the class to the target (which may be a tabContent and the class would persist between content).
	anytable: boolean. defaults on. will apply anytable (sortable headers) to dualModeListTable.
	showLoading : boolean. on by defualt.
	showLoadingMessage: if set, will add showLoading to $target.
*/
			DMICreate : function($target,vars)	{
//				app.u.dump("BEGIN admin.u.buildDualModeInterface");
//				app.u.dump(" -> vars: "); app.u.dump(vars);
				var r = false; //what is returned. will be the results table element if able to create dualModeInterface
				vars = vars || {};
				if($target instanceof jQuery && vars.tbodyDatabind)	{
//set up the defaults.
					vars.showLoading = (vars.showLoading === false) ? false  : true; //to be consistent, default this to on.
					vars.showLoadingMessage = vars.showLoadingMessage || "Fetching Content...";
					vars.anytable = (vars.anytable === false) ? false  : true;
					vars.handleAppEvents = (vars.handleAppEvents === false) ? false  : true;

					var $DM = $("<div \/>"); //used as a holder for the content. It's children are appended to $target. Allows DOM to only be updated once.

					$DM.anycontent({'templateID':'dualModeTemplate','showLoading':false}); //showloading disabled so it can be added AFTER content added toDOM (works better)
					var
						$DMI = $("[data-app-role='dualModeContainer']",$DM),
						$tbody = $("[data-app-role='dualModeListTbody']:first",$DM),
						$table = $(".dualModeListTable:first",$DM);
					
					$DMI.attr('id','DMI_'+app.u.guidGenerator()); //apply an ID. this allows for content in a dialog to easily reference it's parent DMI.
					if(vars.anytable)	{
						$table.addClass('applyAnytable');
						}
					
//if set, build thead.
					if(vars.thead && typeof vars.thead == 'object')	{
//find and get a copy of the template used in the loadsTemplate. use it to determine which headers should be hidden in midetail mode.
						var bindData = app.renderFunctions.parseDataBind(vars.tbodyDatabind);
						var $tmp;
						if(app.templates[bindData.loadsTemplate])	{
							$tmp =  app.templates[bindData.loadsTemplate].clone(); //always clone to leave original unmolested.
							}
						else if($(app.u.jqSelector('#',bindData.loadsTemplate)).length)	{
							app.model.makeTemplate($(app.u.jqSelector('#',bindData.loadsTemplate)),bindData.loadsTemplate);
							$tmp =  app.templates[bindData.loadsTemplate].clone();
							}
						else	{}//empty tmp means no check to add hide in detail mode class.

						var
							L = vars.thead.length,
							$Thead = $("[data-app-role='dualModeListThead'] tr:first",$DM);

						for(var i = 0; i < L; i += 1)	{
//looks at corresponding td in loadsTemplate (if set) and applies hide class (
							$('<th \/>').addClass(($tmp && $("td:nth-child("+i+")",$tmp).hasClass('hideInDetailMode')) ? "hideInDetailMode" : "").text(vars.thead[i]).appendTo($Thead);
							}
						}// thead loop
					else if(vars.thead)	{
						app.u.dump("In admin.u.buildDualModeInterface, vars.thead was passed but not in a valid format. Expecting an array.",warn)
						}
					else	{} //no thead. that's fine.

					if(vars.className)	{$DMI.addClass(vars.className)}
					
					if(vars.tbodyDatabind)	{
						$tbody.attr('data-bind',vars.tbodyDatabind);
						}

					if(vars.cmdVars && vars.cmdVars._cmd)	{
						$DMI.data('cmdVars',vars.cmdVars);
						vars.cmdVars._tag = vars.cmdVars._tag || {};
						vars.cmdVars._tag.callback = vars.cmdVars._tag.callback || 'anycontent';
						vars.cmdVars._tag.jqObj = $table;
						app.model.addDispatchToQ(vars.cmdVars,'mutable');
						}

						
					if(vars.header)	{
						$("[data-app-role='dualModeListHeader']:first",$DM).text(vars.header);
						}

					if(vars.controls)	{
						$("[data-app-role='dualModeListControls']:first",$DM).append(vars.controls);
						}
					else	{
						$("[data-app-role='dualModeListControls']:first",$DM).addClass('displayNone');
						}

//if set, build buttons.
					if(typeof vars.buttons === 'object')	{
//						app.u.dump(' -> buttons are an object');
						var
							BL = vars.buttons.length,
							$buttonContainer = $("[data-app-role='dualModeListButtons']:first",$DM);

						for(var i = 0; i < BL; i += 1)	{
							$buttonContainer.append(vars.buttons[i]);
							}
						}// thead loop

					if(vars.handleAppEvents)	{
						app.u.handleAppEvents($DM,{'$context':$DM.children().first()}); //
						}

					$DM.children().appendTo($target);
//showLoading is applied to the table, not the parent, because that's what is rturned and what anycontent is going to be run on (which will run hideLoading).
					if(vars.showLoading)	{
						$table.showLoading({"message":vars.showLoadingMessage || undefined});
						}
					//needs to be done after table added to DOM.
					if(vars.anytable)	{
						$table.anytable();
						}

					r = $table //the table gets returned

					}
				else	{
					$('#globalMessaging').anymessage({});
					}
				return r;
				},





/*
vars is passed directly into anypanel and can include any params supported by that plugin, including:
header -> panel header text.
templateID -> the template ID used to generate the content.
data -> used to interpolate contents.
panelID -> an ID 
dataAttribs -> an object that will be set as data- on the panel.
*/

			DMIPanelOpen : function($btn,vars)	{

				vars = vars || {};
				var $DMI = $btn.closest("[data-app-role='dualModeContainer']");
				
				vars.panelID = vars.panelID || 'panel_'+app.u.guidGenerator();
				vars.data = vars.data || undefined;
				var $panel = $(app.u.jqSelector('#',vars.panelID));
				if($panel.length)	{
					//move panel to top. empty it because whatever is runnign DMIPanelOpen will refresh.
					$panel.find('.ui-widget-content').intervaledEmpty().anycontent($.extend(true,{},vars,{'showLoading':false}));
					$("[data-app-role='dualModeDetail']",$DMI).prepend($panel);
					$panel.anypanel('option','state','expand')
					}
				else	{
					$panel = $("<div\/>").anypanel(vars);
					$panel.attr('id',vars.panelID);
					
					$("[data-app-role='dualModeDetail']",$DMI).prepend($panel);
					$panel.slideDown('fast');
					//append detail children before changing modes. descreases 'popping'.
					app.ext.admin.u.toggleDualMode($DMI,'detail');
					
					if(vars.handleAppEvents)	{
						app.u.handleAppEvents($panel);
						}
					
					$('.applyAnycb',$panel).anycb();
					$('.applyAnytable',$panel).anytable();
					$('.toolTip',$panel).tooltip();
					$('.applyAnytabs',$panel).anytabs();
					}
				
				return $panel;
				}, //DMIPanelOpen

//Opens a dialog for removal confirmation. Displayes a default message (which can be overwritten) and a confirm and cancel button.
//requires a function be passed in (removeFunction) for the action on the confirm button.
			dialogConfirmRemove : function(vars)	{
				vars = vars || {};
				vars.message = vars.message || "Are you sure you want to remove this? There is no undo for this action."
				vars.title = vars.title || "Please Confirm";
				vars.removeButtonText = vars.removeButtonText || "Remove";
				var $D;
				if(typeof vars.removeFunction == 'function')	{
					$D = this.dialogCreate(vars)
					$D.append("<p>"+vars.message+"<\/p>");
					$D.dialog("option", "width", 300);
					$D.dialog({ buttons: [
						{ text: "Cancel", click: function() { $( this ).dialog( "close" ); } },
						{ text: vars.removeButtonText, click: function() {
							vars.removeFunction(vars,$(this));
							}}
						] });
					$D.dialog('open');
					}
				else	{
					
					}
				return $D;
				}, //dialogConfirmRemove

//used for creating a disposable dialog. returns dialog.
//does NOT open dialog. this allows for customization of the dialog prior to display.
//this code is pretty modal specific.
			dialogCreate : function(vars)	{
				vars = vars || {};
				vars.title = vars.title || ""; //don't want 'undefind' as title if not set.
				vars.anycontent = vars.anycontent || true; //default to runing anycontent. if no templateID specified, won't run.
				vars.handleAppEvents = vars.handleAppEvents || true; //default to runing anycontent. if no templateID specified, won't run.


				var $D = $("<div \/>").attr('title',vars.title);
				if(vars.anycontent && vars.templateID)	{
//					app.u.dump(" -> vars: "); app.u.dump(vars);
					$D.anycontent(vars);
					}
				$D.dialog({
					modal: true,
					width : '90%',
					autoOpen : false,
					appendTo : vars.appendTo || "",
					close: function(event, ui)	{
						$('body').css({'height':'auto','overflow':'auto'}) //bring browser scrollbars back.
//						app.u.dump('got into dialog.close - destroy.');
						$(this).dialog('destroy');
						$(this).intervaledEmpty(1000,1);
						}, //will remove from dom on close
//'open' event will reposition modal to center upon open. handy for when content added between create and open.
//timeout is to have it happen after content is populated.
					open : function(event,ui)	{
						$('body').css({'height':'100%','overflow':'hidden'}) //get rid of browser scrollbars.
						setTimeout(function(){
							//make sure dialog is smaller than window. do this BEFORE reposition so new position takes into account new height.
							if($D.closest('.ui-dialog').height() > $(window).height())	{
								$D.dialog("option", "height", ($(window).height() - 200));
								}
							$D.dialog("option", "position", "center");
							},500);
						}
					});

				if(vars.handleAppEvents)	{
					
					app.u.handleAppEvents($D,vars);
					}

//				$('.applyAnycb',$D).anycb();
				$('.applyAnytable',$D).anytable();
				$('.toolTip',$D).tooltip();
				
				return $D;
				} //dialogCreate



			},







//////////////////////////////////// EVENTS \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\







		e : {
//add a class of allowBulkCheck to the checkboxes that you want toggled on event 
			checkAllCheckboxesExec : function($ele,p)	{
				if($ele.data('selected'))	{
					$ele.data('selected',false);
					$ele.closest(".dualModeList").find(":checkbox.allowBulkCheck").prop('checked','').removeProp('checked');
					}
				else	{
					$ele.data('selected',true);
					$ele.closest(".dualModeList").find(":checkbox.allowBulkCheck").prop('checked','checked');
					}
				},

			adjustHeightOnFocus : function($ele,p)	{
				$ele.height('300');
				},

			restoreHeightOnBlur : function($ele,p)	{
				$ele.css('height','');
				},

//used for loading a simple dialog w/ no data translation.
//if translation is needed, use a custom app-event, but use the dialogCreate function and pass in data. see admin_customer.e.giftcardCreateShow for an example
//set data-templateid on the button to specify a template.
			openDialog : function($btn,vars)	{
				$btn.button();
				$btn.off('click.openDialog').on('click.openDialog',function(){
					vars = vars || {};
					if($btn.data('templateid'))	{
						vars.templateID = $btn.data('templateid');
						vars.title = $btn.data('title');
						vars.showLoading = false;
						var $D = app.ext.admin.i.dialogCreate(vars);
						$D.dialog('open');
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In admin.e.openDialog, expected button to have a data-templateid.','gMessage':true});
						}
					});
				}, //openDialog
			
//used in conjuction with the new interface (i) functions.
			processForm : function($btn,vars)	{
				$btn.button();
				$btn.off('click.processForm').on('click.processForm',function(event){
					event.preventDefault();
					app.ext.admin.e.submitForm($btn,vars);
					});
				},


			
//for delegated events. Also triggered by process form.
			submitForm : function($ele,p)	{
				var $form = $ele.closest('form');
				
				if($ele.data('skipvalidation') || app.u.validateForm($form))	{					
					if(app.ext.admin.a.processForm($form,'immutable',p))	{
						$form.showLoading({'message':'Updating...'});	
						app.model.dispatchThis('immutable');
						}
					else	{
						//processForm will handle error display.
						}
					}
				else	{} //validateForm handles error display.
				},



			controlFormSubmit : function($btn)	{
				$btn.button();
				$btn.off('click.controlFormSubmit').on('click.controlFormSubmit',function(){
					var
						sfo = $btn.closest('form').serializeJSON({"cb":true}),
						$DMI = $btn.closest("[data-app-role='dualModeList']");
					
					sfo._tag = app.ext.admin.u.getTagObjFromSFO(sfo);
					sfo._tag.jqObj = $DMI;
					if(sfo._cmd)	{
						$DMI.showLoading();
						app.model.addDispatchToQ(sfo,'mutable');
						app.model.dispatchThis('mutable');
						}
					else	{
						$btn.closest('.appMessaging').first().anymessage({"message":"In admin.e.controlFormSubmit, serialized form object had no _cmd specified.",'gMessage':true});
						}
					});
				},
//uses delegated events.
//add to a select list and the cmd bars on the DMI will be updated with the key and the selected value. used in CRM and ticketing 
			updateDMICmdVar : function($ele,p)	{
				if($ele.is('select')){
					var $DMI = $ele.closest("[data-app-role='dualModeContainer']");
					$DMI.data('listmode','list');
					$DMI.data('cmdVars')[$ele.attr('name')] = $ele.val();
					if($ele.data('trigger') == 'refresh')	{
						$('button[data-app-event="admin|refreshDMI"]',$DMI).trigger('click');
						}
					}
				},

			refreshDMI : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-arrowrefresh-1-s"},text: false});
				var $DMI = $btn.closest("[data-app-role='dualModeContainer']");

				if($DMI.length && !$.isEmptyObject($DMI.data('cmdVars')) && $DMI.data('cmdVars')._cmd)	{
					$btn.off('click.refreshDMI').on('click.refreshDMI',function(event){
						event.preventDefault();
						$DMI.showLoading({'message' : 'Refreshing list...' });
						$("[data-app-role='dualModeListTbody']",$DMI).empty();
						$("[data-app-click='admin|checkAllCheckboxesExec']",$DMI).data('selected',false); //resets 'select all' button to false so a click selects everything.
						var cmdVars = {};
						if($btn.data('serializeform'))	{
							$.extend(true,cmdVars,$DMI.data('cmdVars'),$btn.closest('form').serializeJSON({'cb':true})); //serialized form is last so it can overwrite anything in data.cmdvars
							}
						else	{
							cmdVars = $DMI.data('cmdVars');
							}

						cmdVars._tag = cmdVars._tag || {};
						cmdVars._tag.callback = cmdVars._tag.callback || 'DMIUpdateResults';
						cmdVars._tag.extension = cmdVars._tag.extension || 'admin';
						cmdVars._tag.jqObj = $DMI;
						app.model.addDispatchToQ(cmdVars,'mutable');
						app.model.dispatchThis('mutable');
						});
					}
				else	{
					$btn.hide(); //required params are not set.
					app.u.dump("A refreshDMI app event was set, however either no parent DMI found [$DMI.length: "+$DMI.length+"] or $DMI.data.cmdVars was empty (these are required for this feature and should be set as part of DMICreate).",'warn');
					}
				},

			lockAccordionIfChecked : function($cb)	{
				//in a function so that code can be executed both on click and at init.
				function handleChange()	{
					if($cb.is(':checked'))	{
						$cb.closest('.ui-accordion').find('.ui-accordion-header').each(function(){
							$(this).addClass("ui-state-disabled");
							}) //.accordion( "disable" ); //disable works, but the aesthetic of what it does isn't great.
						}
					else	{
						$cb.closest('.ui-accordion').accordion( "enable" );
						}
					}
				handleChange();
				$cb.off('click.lockAccordionIfChecked').on('click.lockAccordionIfChecked',function(event){
					handleChange();
					})
				},



			alphaNumeric : function($input)	{
				$input.off('keypress.alphaNumeric').on('keypress.alphaNumeric',function(event){
					return app.u.alphaNumeric(event);
					})
				},
/*
not in use
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
*/
/* app chooser */

			dialogCloseExec : function($ele,p)	{
				$ele.closest(".ui-dialog-content").dialog('close');
				},

			execDialogClose : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-circle-close"}});
				$btn.off('click.execDialogClose').on('click.execDialogClose',function(event){
					event.preventDefault();
					$btn.closest(".ui-dialog-content").dialog('close');
					});
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



			messageClearExec : function($ele,P)	{
				var msgid = $ele.closest('tr').data('messageid');
//				app.u.dump(" -> remove message: "+msgid);
				$ele.closest('tr').empty().remove();
				var
					DPSMessages = app.model.dpsGet('admin','messages'),
					index = null;

				$.grep(DPSMessages, function(e,i){if(e.id == msgid){index = i; return;}});
				
//				app.u.dump(" -> index: "); app.u.dump(index);
				if(index)	{
					DPSMessages.splice(index,1);
					app.u.dump(DPSMessages);
					app.model.dpsSet('admin','messages',DPSMessages);
					app.ext.admin.u.updateMessageCount();
					}
				else	{
					//could not find a matching message in DPS.
					}
				},

			messageDetailShow : function($ele,P)	{
				var $tr = $ele.closest('tr');
				$(".messageDetail","#messagesContent").empty().append(app.ext.admin.u.getMessageDetail($tr.data('messageid')));
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
				}, //toggleDualMode


//use this on any delete button that is in a table row and that does NOT automatically delete, but just queue's it.
//The .edited class is used to key off of to see it's ben edited.
//The .rowTaggedForRemove class is used to know what action was taken. Thought being later other classesmay be applied (update, new, etc)
//The customer manager keys off of the ui-state0error, so don't change that w/out updating
			tagRowForRemove : function($btn,vars)	{
				$btn.button({icons: {primary: "ui-icon-closethick"},text: false});
				$btn.off('click.tagRowForRemove').on('click.tagRowForRemove',function(event){
					event.preventDefault();
					app.ext.admin.e.tagRow4Remove($btn,vars)
					});
				}, //tagRowForRemove

//used for delegated events and is triggered by app-event tagRowForRemove
			tagRow4Remove : function($ele,p)	{
//if this class is already present, the button is set for delete already. unset the delete.
//added to the tr since that's where all the data() is, used in the save. If class destination changes, update customerEditorSave app event function.
				if($ele.hasClass('ui-state-error'))	{
// ** 201324 -> changed the selector in the 'find' to only run on elments that have been through button(). avoids a JS error
					$ele.removeClass('ui-state-error').parents('tr').removeClass('edited').removeClass('rowTaggedForRemove').find("button[role='button']").each(function(){
						$(this).button('enable');
						}); //enable the other buttons
					$ele.button('enable');
					}
				else	{
//adding the 'edited' class does NOT change the row (due to odd/even class) , but does let the save changes button record the accurate # of updates.
					$ele.addClass('ui-state-error').closest('tr').addClass('edited').addClass('rowTaggedForRemove').find("button[role='button']").each(function(){
//							app.u.dump(" -> $(this).text(): "+$(this).text());
						$(this).button('disable')
						}); //disable the other buttons
					$ele.button('enable');

					}
				app.ext.admin.u.handleSaveButtonByEditedClass($ele.closest("form"));				
				},
			
//make sure button is withing the table. tfoot is good.
			tagAllRowsForRemove : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-closethick"},text: true});
				$btn.off('click.tagRowForRemove').on('click.tagRowForRemove',function(event){
					event.preventDefault();
					$btn.closest('table').find("button[data-app-event='admin|tagRowForRemove']").trigger('click');
					});
				},

//apply to a select list and, on change, a corresponding fieldset will be turned on (and any other fieldsets will be turned off)
//put all the fieldsets that may get toggld into an element with data-app-role='connectorFieldsetContainer' on it.
//that way only the fieldsets in question get turned off/on.
// ### replace this with data-panel-show.
			showSiblingFieldset : function($ele)	{
				$ele.off('change.showOrderFieldset').on('change.showConnectorFieldset',function(){
					$ele.closest('form').find("[data-app-role='connectorFieldsetContainer'] fieldset").each(function(){
						var $fieldset = $(this);
//						app.u.dump(" -> $fieldset.data('app-role'): "+$fieldset.data('app-role'));
						if($ele.val() == $fieldset.data('app-role'))	{$fieldset.show().effect( 'highlight', {}, 500);}
						else	{$fieldset.hide();}
						})
					});
				$ele.trigger('change'); //trigger the change so that if a databind has selected the field, the related fieldset is displayed.
				}, //showConnectorFieldset



			domainPutInFocus : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-check"},text: false});
				var domain = $btn.closest("[data-domainname]").data('domainname');
				if(domain == app.vars.domain)	{$btn.addClass('ui-state-highlight')}
				$btn.off('click.domainPutInFocus').on('click.domainPutInFocus',function(event){
					event.preventDefault();
//					$btn.closest('table').find('button.ui-state-focus').removeClass('ui-state-focus');
					app.ext.admin.a.changeDomain(domain,$btn.closest("[data-prt]").attr('data-prt'));
					});
				//
				},
			domainView : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-newwin"},text: false});
				$btn.off('click.domainView').on('click.domainView',function(event){
					event.preventDefault();
					var domainname = $btn.closest("[data-domainname]").data('domainname');
if(domainname)	{
	if($btn.data('mode') == 'host')	{
		var hostname = $btn.closest("[data-hostname]").data('hostname');
		if(hostname)	{
			linkOffSite("http://"+hostname+"."+domainname+"/",'',true);
			}
		else {
			$('#globalMessaging').anymessage({"message":"In admin.e.domainView, unable to determine host.","gMessage":true});
			}
		}
	else	{
		linkOffSite("http://www."+domainname+"/",'',true);
		}
	}
else	{
	$('#globalMessaging').anymessage({"message":"In admin.e.domainView, unable to determine domain.","gMessage":true});
	}
					
					});
				},
	
			
			projectLinkOpen : function($btn)	{
				if($btn.closest('tr').data('link'))	{
					$btn.button({icons: {primary: "ui-icon-refresh"},text: false});
					$btn.off('click.projectLinkOpen').on('click.projectLinkOpen',function(){
						window.open($btn.closest('tr').data('link'));
						});
					}
				else	{
					$btn.hide();
					}
				},
			projectUpdateShow : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				$btn.off('click.projectUpdateShow').on('click.projectUpdateShow',function(event){
					event.preventDefault();
					var	projectUUID = $btn.closest('tr').data('uuid');
					
					var $panel = app.ext.admin.i.DMIPanelOpen($btn,{
						'templateID' : 'projectDetailTemplate', //not currently editable. just more details.
						'panelID' : 'project_'+projectUUID,
						'header' : 'Edit Project: '+$btn.closest('tr').data('title') || projectUUID,
						'handleAppEvents' : true,
						showLoading : true
						});
//files are not currently fetched. slows things down and not really necessary since we link to github. set files=true in dispatch to get files.
					app.model.addDispatchToQ({
						"_cmd":"adminProjectDetail",
						"UUID":projectUUID,
						"_tag": {
							'callback':'anycontent',
							'translateOnly' : true,
							jqObj:$panel,
							'datapointer' : 'adminProjectDetail|'+projectUUID
							}
						},'mutable');
					app.model.dispatchThis('mutable');
					});
				},
			
			projectCreateShow : function($btn)	{
				$btn.button();
				$btn.off('click.projectCreateShow').on('click.projectCreateShow',function(){
					var $D = app.ext.admin.i.dialogCreate({
						'title' : 'Create a New Project',
						'templateID' : 'projectCreateTemplate',
						showLoading : false,
						appendTo : $(this).closest("[data-app-role='dualModeContainer']")
						});
					
					$D.dialog('open');
					})
				},
			
			projectCreateExec  : function($btn,vars)	{
				$btn.button();
				vars = vars || {};
				$btn.off('click.projectCreateExec').on('click.projectCreateExec',function(){
					var
						$form = $btn.closest('form'),
						sfo = $form.serializeJSON(),
						$DMI = $form.closest("[data-app-role='dualModeContainer']");
					
					if(app.u.validateForm($form))	{
						$form.showLoading({'message':'Adding your new project. This may take a few moments as the repository is imported.'});
						app.model.destroy('adminProjectList');
						sfo.UUID = app.u.guidGenerator();
						app.ext.admin.calls.adminProjectCreate.init(sfo,{'callback':function(rd){
							$form.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$form.anymessage({'message':rd});
								}
							else	{
								
								if($DMI.length)	{
									$DMI.anymessage(app.u.successMsgObject('Thank you, your project has been created.'));
									$form.closest('.ui-dialog-content').dialog('close');
									}
								else	{
									$form.empty().anymessage(app.u.successMsgObject('Thank you, your project has been created.'));
									}
								}
							}},'immutable');
						app.ext.admin.calls.adminProjectList.init({
							'callback' :  'DMIUpdateResults',
							'extension' : 'admin',
							'jqObj' : $DMI
							},'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{} //validateForm handles error display.
					})
				},

			projectRemove : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.projectGitRepoOpen').on('click.projectGitRepoOpen',function(){
					app.ext.admin.i.dialogConfirmRemove({
						"message" : "Are you sure you wish to remove this app/project? There is no undo for this action.",
						"removeButtonText" : "Remove Project", //will default if blank
						"title" : "Remove Project", //will default if blank
						"removeFunction" : function(vars,$D){
							$D.parent().showLoading({"message":"Deleting "});
							app.model.addDispatchToQ({
								'_cmd':'adminProjectRemove',
								'UUID' : $btn.closest("[data-uuid]").attr('data-uuid'),
								'_tag':	{
									'callback':function(rd){
										$D.parent().hideLoading();
										if(app.model.responseHasErrors(rd)){
											$D.anymessage({'message':rd});
											}
										else	{
											$D.dialog('close');
											$('#globalMessaging').anymessage(app.u.successMsgObject('Your project has been removed'));
											$btn.closest('tr').empty().remove();
											}
										}
									}
								},'mutable');
							app.model.dispatchThis('mutable');
							}
						})
					});
				}, //projectRemove
			
			projectGitRepoOpen : function($btn)	{
				if($btn.closest('tr').data('github_repo'))	{
					$btn.button({icons: {primary: "ui-icon-newwin"},text: false});
					$btn.off('click.projectGitRepoOpen').on('click.projectGitRepoOpen',function(){
						window.open($btn.closest('tr').data('github_repo'));
						});
					}
				else	{
					$btn.hide();
					}
				},

			adminRSSRemove : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.showEditRule').on('click.showEditRule',function(event){

					event.preventDefault();
					var data = $(this).closest('tr').data(),
					$D = $("<div \/>").attr('title','Delete RSS Feed').append("Are you sure you want to delete <b>"+(data.name || data.id)+"<\/b>? This action can not be undone.");

					$D.dialog({
resizable: false,
modal: true,
buttons: {
	"Delete Feed": function() {
		$D.showLoading({'message':'Deleting Feed'});
		app.ext.admin.calls.adminRSSRemove.init(data.id,{'callback':function(rd){
			$D.hideLoading();
			if(app.model.responseHasErrors(rd)){
				$D.anymessage({'message':rd})
				}
			else	{
				$D.empty();
				app.ext.admin.a.showRSS($(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")));
				}
			}},'immutable');

		app.model.addDispatchToQ({
			"_cmd":"adminRSSList",
			"_tag" : {
				'datapointer' : 'adminRSSList|'+app.vars.partition
				}
			},'immutable');


		app.model.dispatchThis('immutable');
		},
	Cancel: function() {$( this ).dialog( "close" ).empty().remove();}
	}
        });

					});
				}, //adminRSSRemove
			
			adminRSSUpdateExec : function($btn)	{
				$btn.button();
				$btn.off('click.adminRSSUpdateExec').on('click.adminRSSUpdateExec',function(){

var
	$form = $btn.closest('form'),
	sfo = $form.serializeJSON();

if(app.u.validateForm($form))	{
	$form.showLoading({'message':'Updating RSS Feed'});
	app.ext.admin.calls.adminRSSUpdate.init(sfo,{'callback':function(rd){
		$form.hideLoading();
		if(app.model.responseHasErrors(rd)){
			$form.anymessage({'message':rd})
			}
		else	{
			$form.anymessage(app.u.successMsgObject('Thank you, your feed has been updated.'));
			}
		}},'immutable');
	app.model.dispatchThis('immutable');
	}
else	{} //validateForm handles error display

					})
				},

		//to render the addUpdate template for rss, the following data sources are necessary:  schedules, domains, navcat 'lists' and the detail for the rss feed itself.			
			adminRSSUpdateShow : function($btn){

				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				$btn.off('click.adminRSSUpdateShow').on('click.adminRSSUpdateShow',function(event){
					event.preventDefault();
					app.ext.admin.u.fetchRSSDataSources('mutable')

					var data = $btn.closest('tr').data();
					var $panel = app.ext.admin.i.DMIPanelOpen($btn,{
						'templateID' : 'rssAddUpdateTemplate', //not currently editable. just more details.
						'panelID' : 'rss'+data.cpg,
						'header' : 'Edit Feed: '+data.cpg,
						'handleAppEvents' : false, //handled later.
						showLoading : false
						});
					$panel.showLoading({'message':'Fetching RSS detail'})
//files are not currently fetched. slows things down and not really necessary since we link to github. set files=true in dispatch to get files.
					app.model.addDispatchToQ({
						"_cmd":"adminRSSDetail",
						"CPG":data.cpg,
						"_tag": {
							'callback':function(rd){
								if(app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									//success content goes here.
									$panel.anycontent({'translateOnly':true,'data':$.extend(true,{},app.data["appCategoryList|"+app.vars.partition+"|lists|."],app.data['adminDomainList'],app.data['adminPriceScheduleList'],app.data['adminRSSDetail|'+data.cpg])});
									$('.buttonbar',$panel).first().append($("<button \/>").attr('data-app-event','admin|adminRSSUpdateExec').text('Save').addClass('floatRight')); //template is shared w/ add, so button is added after the fact.
									$('.toolTip',$panel).tooltip();
									$("[name='CPG']",$panel).attr('readonly','readonly').css('border','none');
								
								//schedule, domain and source list don't pre-select by renderformat. the code below handles that.
									if(app.data['adminRSSDetail|'+data.cpg].feed_link)	{
										$("[name='feed_link']",$panel).val(app.data['adminRSSDetail|'+data.cpg].feed_link);
										}
									
									if(app.data['adminRSSDetail|'+data.cpg].schedule)	{
										$("[name='schedule']",$panel).val(app.data['adminRSSDetail|'+data.cpg].schedule);
										}
									
									if(app.data['adminRSSDetail|'+data.cpg].list)	{
										$("[name='list']",$panel).val(app.data['adminRSSDetail|'+data.cpg].list);
										}
									app.u.handleAppEvents($panel);
									}
								},
							'datapointer' : 'adminRSSDetail|'+data.cpg
							}
						},'mutable');
					app.model.dispatchThis('mutable');
					});

				}, //adminRSSUpdateShow

			adminRSSCreateExec : function($btn,vars)	{
				$btn.button();
				$btn.off('click.adminRSSCreateExec').on('click.adminRSSCreateExec',function(){
var
	$form = $btn.closest('form'),
	sfo = $form.serializeJSON();

if(app.u.validateForm($form))	{
	$form.showLoading({'message':'Creating RSS Feed'});
	
	app.model.addDispatchToQ($.extend(true,{},sfo,{
		"_cmd":"adminRSSCreate",
		"_tag" : {
			'callback':function(rd){
				$form.hideLoading();
				if(app.model.responseHasErrors(rd)){
					$form.anymessage({'message':rd})
					}
				else	{
					vars['$dialog'].empty().anymessage(app.u.successMsgObject('Thank you, your feed has been created.'));
					app.ext.admin.a.showRSS($(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")));
					}
				}
			}
		}),'immutable');

	app.model.dispatchThis('immutable');
	}
else	{} //validateForm handles error display

					})
				},
			adminRSSCreateShow : function($btn)	{
				$btn.button();
				$btn.off('click.adminRSSCreateShow').on('click.adminRSSCreateShow',function(){


var	$D = $("<div \/>").attr('title',"Add a new project");
$D.addClass('displayNone').appendTo('body'); 
$D.dialog({
	width : '70%',
	modal: true,
	autoOpen: false,
	close: function(event, ui)	{
		$(this).dialog('destroy').remove();
		}
	});

$D.dialog('open');
$D.showLoading({'message':'Fetching Data for Feed Creation'});

var
	numRequests = app.ext.admin.u.fetchRSSDataSources('mutable')
	callback = function(rd){
		$D.hideLoading();
		if(app.model.responseHasErrors(rd)){
			$target.anymessage({'message':rd})
			}
		else	{
	
			$D.anycontent({'templateID':'rssAddUpdateTemplate','data':$.extend(true,{},app.data["appCategoryList|"+app.vars.partition+"|lists|."],app.data['adminDomainList'],app.data['adminPriceScheduleList'])});
			$('.buttonbar',$D).first().append($("<button \/>").attr('data-app-event','admin|adminRSSCreateExec').text('Save').addClass('floatRight')); //template is shared w/ add, so button is added after the fact.
			$('.toolTip',$D).tooltip();
			app.u.handleAppEvents($D,{'$dialog':$D});
			$D.dialog('option', 'position', $D.dialog('option','position')); //reposition dialog in browser to accomodate new content.
			}
		}


if(numRequests)	{
	app.calls.ping.init({'callback':callback},'mutable');
	app.model.dispatchThis('mutable');
	}
else	{
	callback({});
	}

					});
				},
			
			showYTVInDialog : function($ele)	{
				app.ext.admin.a.showYTVInDialog($ele.data('youtubeid'),$ele.data());
				},
			googleLogin : function($btn)	{
				$btn.off('click.googleLogin').on('click.googleLogin',function(){
					app.ext.admin.u.jump2GoogleLogin(encodeURIComponent(btoa(JSON.stringify({"onReturn":"return2Domain","domain": location.origin+"/"+app.model.version+"/index.html"})))); 
					});
				},
			linkOffSite : function($btn)	{
				$btn.button();
				$btn.off('click.linkOffSite').on('click.linkOffSite',function(){
					if($btn.data('url'))	{
						linkOffSite($btn.data('url'),'',true);
						}
					else	{
						$btn.button('disable');
						}
					});
				}
			
			} //e / appEvents

		} //r object.
	return r;
	}