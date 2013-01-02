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
	var theseTemplates = new Array('adminProdStdForList','adminProdSimpleForList','adminElasticResult','adminProductFinder','adminMultiPage','domainPanelTemplate','pageSetupTemplate','pageUtilitiesTemplate','adminChooserElasticResult','productTemplateChooser','pageSyndicationTemplate','pageTemplateSetupAppchooser'); 
	var r = {
		
	vars : {
		tab : null, //is set when switching between tabs. it outside 'state' because this doesn't get logged into local storage.
		tabs : ['setup','sites','jt','product','orders','crm','syndication','reports','utilities'],
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
			messages : [], //array of strings. TYPE|MESSAGE
			bc : [], //array of objects. link and name in order left to right. zero is leftmost in array.
			help : "", //webdoc ID.
			navtabs : {}, //array of objects. link, name and selected (boolean)
			title : {},
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


		adminBatchJobList : {
			init : function(status,_tag,Q)	{
				var r = 0;
				if(status)	{
					_tag = _tag || {};
					_tag.datapointer = "adminBatchJobList|"+status;
	//comment out local storage for testing.
					if(app.model.fetchData(_tag.datapointer) == false)	{
						r = 1;
						this.dispatch(status,_tag,Q);
						}
					else	{
						app.u.handleCallback(_tag);
						}
					}
				else	{
					app.u.throwGMessage("In admin.calls.adminBatchJobList, no status defined.");
					}
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
			},



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



//never get from local or memory.
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
					this.dispatch(orderID,_tag,Q);
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
				cmdObj._tag = _tag || {};
				cmdObj._tag.datapointer = "adminOrderDetail|"+orderID;
				cmdObj._cmd = "adminOrderDetail";
				app.model.addDispatchToQ(cmdObj,Q);
				}
			}, //adminOrderDetail
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


//??? should this be saved in local storage?
		appResource : {
			init : function(filename,_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = "appResource|"+filename;
				this.dispatch(filename,_tag,Q);
				return 1;
				},
			dispatch : function(filename,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"appResource","filename":filename,"_tag" : _tag},Q);
				}
			}, //appResource



	
		customer : {

			adminCustomerGet : {
				init : function(CID,tagObj,Q)	{
//					app.u.dump("CID: "+CID);
					var r = 0;
//if datapointer is fixed (set within call) it needs to be added prior to executing handleCallback (which needs datapointer to be set).
					tagObj = tagObj || tagObj;
					tagObj.datapointer = "adminCustomerGet|"+CID;
					if(app.model.fetchData(tagObj.datapointer) == false)	{
						r = 1;
						this.dispatch(CID,tagObj,Q);
						}
					else	{
						app.u.handleCallback(tagObj);
						}
					return r;
					},
				dispatch : function(CID,tagObj,Q)	{
//					app.u.dump("CID: "+CID);
					var obj = {};
					tagObj = tagObj || {};
					obj["_cmd"] = "adminCustomerGet";
					obj["CID"] = CID;
					obj["_tag"] = tagObj;
					app.model.addDispatchToQ(obj,Q);
					}
				},

//no local storage of this call. only 1 in memory. Will expand when using session storage if deemed necessary.
			adminCustomerLookup : {
				init : function(email,tagObj,Q)	{
					tagObj = tagObj || tagObj;
					tagObj.datapointer = "adminCustomerLookup";
					this.dispatch(email,tagObj,Q);
					},
				dispatch : function(email,tagObj,Q)	{
					app.model.addDispatchToQ({"_cmd":"adminCustomerLookup","email":email,"_tag" : tagObj});	
					}			
				},
			adminCustomerSet : {
				init : function(CID,setObj,tagObj)	{
					this.dispatch(CID,setObj,tagObj)
					return 1;
					},
				dispatch : function(CID,setObj,tagObj)	{
					var obj = {};
					tagObj = tagObj || {};
					obj["_cmd"] = "adminCustomerSet";
					obj["CID"] = CID;
					obj['%set'] = setObj;
					obj["_tag"] = tagObj;
					app.model.addDispatchToQ(obj,'immutable');
					}
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
			
			} //finder





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

app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/templates.html',theseTemplates);

//app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/styles.css','admin_styles']);
app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/legacy_compat.js']);


/* used for html editor. */
app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/resources/jHtmlArea-0.7.5.ExamplePlusSource/style/jHtmlArea.ColorPickerMenu.css','jHtmlArea_ColorPickerMenu']);
app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/resources/jHtmlArea-0.7.5.ExamplePlusSource/style/jHtmlArea.css','jHtmlArea']);
//note - the editor.css file that comes with jhtmlarea is NOT needed. just sets the page bgcolor to black.

// colorpicker isn't loaded until jhtmlarea is done to avoid a js error due to load order.
app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jHtmlArea-0.7.5.ExamplePlusSource/scripts/jHtmlArea-0.7.5.min.js',function(){app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/jHtmlArea-0.7.5.ExamplePlusSource/scripts/jHtmlArea.ColorPickerMenu-0.7.0.min.js'])}]);




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
					app.u.handleResourceQ(app.rq[i]);
					app.rq.splice(i, 1); //remove once handled.
					}
				app.rq.push = app.u.handleResourceQ; //reassign push function to auto-add the resource.

if(app.u.getBrowserInfo().substr(0,4) == 'msie' && parseFloat(navigator.appVersion.split("MSIE")[1]) < 10)	{
	app.u.throwMessage("<p>In an effort to provide the best user experience for you and to also keep our development team sane, we've opted to optimize our user interface for webkit based browsers. These include; Safari, Chrome and FireFox. Each of these are free and provide a better experience, including more diagnostics for us to maintain our own app framework.<\/p><p><b>Our store apps support IE8+<\/b><\/p>");
	}

if(app.u.getParameterByName('debug'))	{
	$('button','#debugPanel').button();
	$('#debugPanel').show()
	$('.debugContent','#debugPanel').append("<div class='clearfix'>Model Version: "+app.model.version+" and release: "+app.vars.release+"</div>");
	$('body').css('padding-bottom',125);
	$('#jtSectionTab').show();
	}

//get list of domains and show chooser.
				var $domainChooser = $("<div \/>").attr({'id':'domainChooserDialog','title':'Choose a domain to work on'}).addClass('displayNone').appendTo('body');
				$domainChooser.dialog({
					'autoOpen':false,
					'modal':true,
					'width': '90%',
					'height': 500,
					'closeOnEscape': false,
					open: function(event, ui) {$(".ui-dialog-titlebar-close", $(this).parent()).hide();} //hide 'close' icon.
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
				

uriParams = app.u.getParametersAsObject('?'+window.location.href.split('?')[1]);
if(uriParams.trigger == 'adminPartnerSet')	{
	//Merchant is most likely returning to the app from a partner site for some sort of verification
	app.ext.admin.calls.adminPartnerSet.init(uriParams,{'callback':'showHeader','extension':'admin'});
	app.model.dispatchThis('immutable');
	}
//if user is logged in already (persistant login), take them directly to the UI. otherwise, have them log in.
//the code for handling the support login is in the thisisanadminsession function (looking at uri)
else if(app.u.thisIsAnAdminSession())	{
	app.ext.admin.u.showHeader();
	}
else	{
	$('#appPreView').hide();
	$('#appLogin').show();
	}
				}
			}, //initExtension

		showDataHTML : {
			onSuccess : function(tagObj)	{
//				app.u.dump("SUCCESS!"); app.u.dump(tagObj);
				$(app.u.jqSelector('#',tagObj.targetID)).removeClass('loadingBG').hideLoading().html(app.data[tagObj.datapointer].html); //.wrap("<form id='bob'>");
				}
			}, //showDataHTML


		handleLogout : {
			onSuccess : function(tagObj)	{
				document.location = 'logout.html'
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
					app.u.dump("GOT HERE! app.ext.admin.vars.tab: "+app.ext.admin.vars.tab);
					$(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content')).empty().append(app.data[tagObj.datapointer].html)
					}			
				}
			}, //handleElementSave

		showHeader : {
			onSuccess : function(){
				app.ext.admin.u.showHeader();
				},
			onError : function(responseData){
				app.u.throwMessage(responseData);
//				if(responseData.errid == "100")	{
//					app.u.throwMessage("This is most typically due to your system clock not being set correctly. For security, it must be set to both the correct time and timezone.");
//					} //this is the clock issue.
				$('#preloadAndLoginContents').hideLoading();
				}
			}, //showHeader

		handleDomainChooser : {
			onSuccess : function(tagObj){
//				app.u.dump("BEGIN admin.callbacks.handleDomainChooser.onSuccess");
				var data = app.data[tagObj.datapointer]['@DOMAINS'];
				var $target = $(app.u.jqSelector('#',tagObj.targetID));
				var L = data.length;
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
					$target.hideLoading().append($ul);
					}
				else	{
//user has no domains on file. What to do?
					}
				},
			onError: function(responseData)	{
				var $target = $(app.u.jqSelector('#',responseData._rtag.targetID));
				$target.hideLoading();
				responseData.persistant = true;
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
				$('#finderMessaging').prepend(app.u.formatMessage({'message':'Your changes have been saved.','htmlid':'finderRequestResponse','uiIcon':'check','timeoutFunction':"$('#finderRequestResponse').slideUp(1000);"}))
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
	$('#finderMessaging').prepend(app.u.formatMessage({'message':'Items Updated: '+uCount,'htmlid':'finderRequestResponse','uiIcon':'check','timeoutFunction':"$('#finderRequestResponse').slideUp(1000);"}))
	}

if(eCount > 0)	{
	$('#finderMessaging').prepend(app.u.formatMessage(eCount+' errors occured!<ul>'+eReport+'<\/ul>'));
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
			} //filterFinderSearchResults



		}, //callbacks

	
		
////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		
		
	renderFormats : {
		
		elastimage1URL : function($tag,data)	{
//				app.u.dump(data.value[0]);
//				var L = data.bindData.numImages ? data.bindData.numImages : 1; //default to only showing 1 image.
//				for(var i = 0; i < L; i += 1)	{
//					}
			$tag.attr('src',app.u.makeImage({"name":data.value[0],"w":50,"h":50,"b":"FFFFFF","tag":0}));
			},
		
	
		array2ListItems : function($tag,data)	{
			var L = data.value.length;
			app.u.dump(data.value);
			var $o = $("<ul />"); //what is appended to tag. 
			for(var i = 0; i < L; i += 1)	{
				$o.append("<li>"+data.value[i]+"<\/li>");
				}
			$tag.append($o.children());
			},
		
		array2Template : function($tag,data)	{
//			app.u.dump("BEGIN admin.renderFormats.array2Template");
//			app.u.dump(data.value);
			var L = data.value.length;
			for(var i = 0; i < L; i += 1)	{
				$tag.append(app.renderFunctions.transmogrify({},data.bindData.loadsTemplate,data.value[i])); 
				}
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

				if(path)	{
//mode is either app or legacy. mode is required and generated based on path.
					var mode = undefined;
					if(path.substr(0,5) == "/biz/") {mode = 'legacy'}
					else if(path.substr(0,2) == "#:")	{mode = 'tabClick'} //path gets changed, so a separate mode is used for tracking when reloadTab is needed.
					else if (path.substr(0,2) == "#!") {mode = 'app'}
					else	{}
					
					if(mode)	{

if(path.substr(0,2) == "#:")	{
	path = "/biz/"+path.substring(2)+"/index.cgi";
	}

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


//app.u.dump(" -> tab: "+opts.tab);

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
	} 
else if(app.ext.admin.vars.tab)	{
	opts.targetID = app.ext.admin.vars.tab+"Content";
	$target = $(app.u.jqSelector('#',opts.targetID));
	} //load into currently open tab. common for apps.
else	{
	//not in an app. no tab specified. not in modal. odd. how did we get here? No $target will be set. error handling occurs in if($target) check below.
	}


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
	app.u.throwGMessage("Warning! target could not be found or does not exist on the DOM for admin.a.showUI.");
	}
						} //end 'if' for mode.
					else	{
						app.u.throwGMessage("Warning! unable to determine 'mode' in admin.a.showUI. path: "+path);	
						}
					
					}
				else	{
					app.u.throwGMessage("Warning! path not set for admin.a.showUI");
					}
				return false;
				}, //showUI

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
				

//this is a function that brian has in the UI on some buttons.
//it's diferent than showUI so we can add extra functionality if needed.
//the app itself should never use this function.
			navigateTo : function(path,$t)	{
				return this.showUI(path,$t ? $t : {});
				},
				
			showDomainConfig : function(){
				$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).empty().showLoading();
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
					if(partition){}
					else	{
						partition = app.ext.admin.a.getDataForDomain(domain,'prt');
						}
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

*/


//currently, executing this function directly is not supported. use the showFinderInModal.
//once multiple instances of the finder can be opened at one time, this will get used more.
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



	
//opens a dialog with a list of domains for selection.
//a domain being selected for their UI experience is important, so the request is immutable.
//a domain is necessary so that API knows what data to respond with, including profile and partition specifics.
//though domainChooserDialog is the element that's used, it's passed in the callback anyway for error handling purposes.
			showDomainChooser : function(){
//				app.u.dump("BEGIN admin.a.showDomainChooser");
				$('#domainChooserDialog').dialog('open').showLoading();
				app.ext.admin.calls.adminDomainList.init({'callback':'handleDomainChooser','extension':'admin','targetID':'domainChooserDialog'},'immutable'); 
				app.model.dispatchThis('immutable');
				},	 //showDomainChooser
				


			login : function($form){
				$('#preloadAndLoginContents').showLoading();
				app.calls.authentication.accountLogin.init($form.serializeJSON(),{'callback':'showHeader','extension':'admin'});
				app.model.dispatchThis('immutable');
				}, //login

			logout : function(){
				$('body').showLoading();
				app.calls.authentication.authAdminLogout.init({'callback':'handleLogout','extension':'admin'});//always immutable.
				app.model.dispatchThis('immutable');
//nuke all this after the request so that the dispatch has the info it needs.
				app.ext.admin.u.selectivelyNukeLocalStorage(); //get rid of most local storage content. This will reduce issues for users with multiple accounts.
				app.model.destroy('authAdminLogin'); //clears this out of memory and local storage. This would get used during the controller init to validate the session.

				} //logout

			}, //action





////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
//executed after preloader if device is logged in.
//executed after login if a login is required.
//If a domain hasn't been selected (from a previous session) then a prompt shows up to choose a domain.
//the entire UI experience revolves around having a domain.
			showHeader : function(){
//				$('#appPreView').hide();
//				$('#appLogin').hide();
				$('#appView').show();
				$('#preloadAndLoginContainer').hide(); //hide all preView and login data.
				$('#preloadAndLoginContents').hideLoading(); //make sure this gets turned off or it will be a layer over the content.
				$('.username','#appView').text(app.vars.username);
				var domain = this.getDomain();
//				app.u.dump(" -> DOMAIN: ["+domain+"]");

//show the domain chooser if one is not set. see showDomainChooser function for more info on why.
//if a domain is already set, this is a return visit. Get the list of domains  passively because they'll be used.
				if (!domain) {
					//the selection of a domain name will load the page content. (but we'll still need to nav)
					app.ext.admin.a.showDomainChooser(); 
					}
				else {
					app.ext.admin.calls.adminDomainList.init({},'passive');
					$('.domain','#appView').text(domain);
					app.ext.admin.a.showUI(app.ext.admin.u.whatPageToShow('/biz/recent.cgi'));
					}
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


//used to determine what domain should be used. mostly in init, but could be used elsewhere.
			getDomain : function(){
				var domain = false;
				var localVars = {};
				
				if(app.model.fetchData('authAdminLogin'))	{
					localVars = app.data['authAdminLogin'];
					}
				
				if(domain = app.u.getParameterByName('domain')) {} //the single = here is intentional. sets the val during the if so the function doesn't have to be run twice.
				else if(app.vars.domain)	{domain = app.vars.domain}
				else if(localVars.domain){domain = localVars.domain}
				else {} //at this time, no other options.
				return domain;
				}, //getDomain







//used for bringing one of the top tabs into focus. does NOT impact content area.
// !!! NOTE - when the old showUI goes away, so can this function. it's replaced with bringTabIntoFocus
			handleTopTabs : function(tab){
				$('li','#menutabs').addClass('off').removeClass('on'); //turn all tabs off.
				$('.'+tab+'Tab','#menutabs').removeClass('off').addClass('on');
				},



			loadNativeApp : function(path,opts){
				if(path == '#!mediaLibraryManageMode')	{
					app.ext.admin_medialib.a.showMediaLib({'mode':'manage'});
					}
				else if(path == '#!domainConfigPanel')	{
					app.ext.admin.a.showDomainConfig();
					}
				else if(path == '#!orderPrint')	{
					app.ext.convertSessionToOrder.a.printOrder(opts.data.oid,opts);
					}
				else if(path == '#!orderCreate')	{
					app.ext.convertSessionToOrder.a.openCreateOrderForm();
					}
				else if (path == '#!appChooser')	{
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					app.ext.admin.u.showAppChooser();
					}
				else if(path == '#!orders')	{
					app.ext.admin.u.bringTabIntoFocus('orders2');
					app.ext.admin.u.bringTabContentIntoFocus($("#orders2Content"));
//					app.ext.admin.vars.tab = 'orders2';
					app.ext.admin_orders.a.initOrderManager({"targetID":"orders2Content"});
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
				else if(path == '#!domainConfigPanel')	{
					app.ext.admin.a.showDomainConfig();
					}
				else	{
					app.u.throwGMessage("WARNING! unrecognized app mode passed into showUI. ["+path+"]");
					}
				},




//used for bringing one of the top tabs into focus. does NOT impact content area.
			bringTabIntoFocus : function(tab){
				$('li','#menutabs').addClass('off').removeClass('on'); //turn all tabs off.
				$('.'+tab+'Tab','#menutabs').removeClass('off').addClass('on');
				},

//should only get run if NOT in dialog mode. This will bring a tab content into focus and hide all the rest.
//this will replace handleShowSection
			bringTabContentIntoFocus : function($target){
				if($target.is('visible'))	{
					//target is already visible. do nothing.
					}
				else	{
					$('.tabContent').hide();
					$target.show();
					}
				},


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
				var tab = app.ext.admin.u.getTabFromPath(path);
				this.handleTopTabs(tab);
//				app.u.dump(" -> tab: "+tab);
				if(tab == 'product' && !P.dialog)	{
					app.u.dump(" -> open product editor");
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					app.ext.admin_prodEdit.u.showProductEditor(path,P);
					}
//				else if(tab == 'orders' && path.split('/')[3] == 'index.cgi')	{
//					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
//					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
//					$("#ordersContent").empty();
//					app.ext.admin_orders.a.initOrderManager({"targetID":"ordersContent"});
//					}
				else if(tab == 'setup' && path.split('/')[3] == 'index.cgi')	{
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					$('#setupContent').empty().append(app.renderFunctions.createTemplateInstance('pageSetupTemplate',{}));
					app.ext.admin.u.handlePermissions($('#setupContent'),{'isVstore':true})
//					app.ext.admin.u.uiHandleLinkRewrites(path,{},{'targetID':'setupContent'});  //navigateTo's hard coded on 2012/30
					}
				else if(tab == 'syndication' && path.split('/')[3] == 'index.cgi')	{
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					$('#syndicationContent').empty().append(app.renderFunctions.transmogrify('','pageSyndicationTemplate',{}));
//					app.ext.admin.u.uiHandleLinkRewrites(path,{},{'targetID':'syndicationContent'});
					}
				else if(tab == 'utilities' && path.split('/')[3] == 'index.cgi')	{
					app.ext.admin.u.uiHandleBreadcrumb({}); //make sure previous breadcrumb does not show up.
					app.ext.admin.u.uiHandleNavTabs({}); //make sure previous navtabs not show up.
					$('#utilitiesContent').empty().append(app.renderFunctions.createTemplateInstance('pageUtilitiesTemplate',{}));
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
	
	
			handlePermissions : function($target,permissions)	{
				app.u.dump("Permissions: "); app.u.dump(permissions);
				if(permissions.isVstore)	{app.u.dump(" isVstore"); $(".showForVstoreOnly",$target).show();}
				else	{$(".showForAppOnly",$target).show();}
				},
	
	
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
						msgObj.persistant = true; //for testing, don't hide.
						
						if(msgObj.BATCH)	{
							msgObj.errmsg += "<div><button class='buttonify' onClick='app.ext.admin_batchJob.a.showBatchJobStatus(\""+msgObj.BATCH+"\");'>View Batch Job Status<\/button><\/div>"
							}
						app.u.dump(msgObj);	
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

//In some cases, we'll likely want to kill everything in local storage BUT save the login and session data.
//login data will allow the user to return without logging in.
//session data is panel disposition and order and things like that.
			selectivelyNukeLocalStorage : function(){
				var admin = {};
				var session = {};
				if(app.model.fetchData('authAdminLogin'))	{admin = app.data['authAdminLogin'];}
				if(app.model.fetchData('session'))	{session = app.data['session'];}
				localStorage.clear();
				app.storageFunctions.writeLocal('authAdminLogin',admin);
				app.storageFunctions.writeLocal('session',session);
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
					$target.append(app.renderFunctions.transmogrify({},'domainPanelTemplate',app.data['adminDomainList']['@DOMAINS'][i]));
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
					var obj = {};
					var targetID = 'panelContents_'+app.u.makeSafeHTMLId(data.domain);
					$(app.u.jqSelector('#',targetID)).showLoading();
					$t.parent().find('.panelContents').show()
					if(data.verb == 'LOAD')	{
						//do nothing. data gets passed in as is.
						}
					else	{
						data = $.extend(data,$t.closest('form').serializeJSON());
						}
					
					app.ext.admin.calls.adminUIDomainPanelExecute.init(data,{'callback':'showDataHTML','extension':'admin','targetID':targetID},'immutable');
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


//undefined is returned if there are no matchings session vars.
//if no extension is passed, return the entire sesssion object (if it exists).
//this allows for one extension to read anothers preferences and use/change them.
			devicePreferencesGet : function(ext)	{
				var obj = app.storageFunctions.readLocal('session');
				if(obj == undefined)	{
					// if nothing is local, no work to do. this allows an early exit.
					} 
				else	{
					if(ext && obj[ext])	{obj = obj[ext]} //an extension was passed and an object exists.
					else if(!ext)	{} //return the global object. obj existing is already known by here.
					else	{} //could get here if ext passed but obj.ext doesn't exist.
					}
				return obj;
				},

//For updating 'session' preferences, which are currently device specific.
//for instance, in orders, what were the most recently selected filter criteria.
//ext is required (currently). reduces likelyhood of nuking entire preferences object.
			devicePreferencesSet : function(ext,varObj)	{
//				app.u.dump(" -> ext: "+ext); app.u.dump(" -> settings: "); app.u.dump(varObj);
				if(ext && varObj)	{
					app.u.dump("device preferences for "+ext+" have just been updated");
					var sessionData =  app.storageFunctions.readLocal('session') || {}; //readLocal returns false if no data local.
					if(typeof sessionData[ext] != 'object'){sessionData[ext] = {}}; //each ext gets it's own object so that no ext writes over anothers.
					
					$.extend(true,sessionData[ext],varObj); //merge the existing data with the new. if new and old have matching keys, new overwrites old.
					
					app.storageFunctions.writeLocal('session',sessionData); //update the localStorage session var.
					}
				else	{
					app.u.throwGMessage("Either extension ["+ext+"] or varObj ["+typeof varObj+"] not passed into admin.u.devicePreferencesSet.");
					}
				},



			showAppChooser : function()	{
				var $target = $(app.u.jqSelector('#',app.ext.admin.vars.tab+'Content'));
				$target.empty().append(app.renderFunctions.createTemplateInstance('pageTemplateSetupAppchooser',{}));
				$('button',$target).button();
				},

//a UI Action should have a databind of data-app-event (this replaces data-btn-action).
//value of action should be EXT|buttonObjectActionName.  ex:  admin_orders|orderListFiltersUpdate
//good naming convention on the action would be the object you are dealing with followed by the action being performed OR
// if the action is specific to a _cmd or a macro (for orders) put that as the name. ex: admin_orders|orderItemAddBasic
			handleAppEvents : function($target)	{
//				app.u.dump("BEGIN admin.u.handleAppEvents");
				if($target && $target.length && typeof($target) == 'object')	{
//					app.u.dump(" -> target exists");
					$("[data-app-event]",$target).each(function(){
						var $ele = $(this),
						extension = $ele.data('app-event').split("|")[0],
						action = $ele.data('app-event').split("|")[1];
//						app.u.dump(" -> action: "+action);
						if(action && extension && typeof app.ext[extension].e[action] == 'function'){
//if an action is declared, every button gets the jquery UI button classes assigned. That'll keep it consistent.
//if the button doesn't need it (there better be a good reason), remove the classes in that button action.
							app.ext[extension].e[action]($ele);
							} //no action specified. do nothing. element may have it's own event actions specified inline.
						else	{
							app.u.throwGMessage("In admin.u.handleAppEvents, unable to determine action ["+action+"] and/or extension ["+extension+"] and/or extension/action combination is not a function");
							}
						})
					}
				else	{
					app.u.throwGMessage("In admin_orders.u.handleButtonActions, target was either not specified, not an object ["+typeof $target+"] or does not exist ["+$target.length+"] on DOM.");
					}
				
				} //handleButtonActions




			},	//util

		e : {}

		} //r object.
	return r;
	}