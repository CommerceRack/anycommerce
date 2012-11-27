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


finder -
'path' refers to either a category safe id (.safe.name) or a list safe id ($mylistid)
'safePath' is used for a jquery friendly id. ex: .safe.name gets converted to _safe_name and $mylistid to mylistid).


NOTE
 - admin 'set' calls are hard coded to use the immutable Q so that a dispatch is not overridden.
 - in the calls, 'dispatch' was removed and only init is present IF we never check local storage for the data.
 
 
calls
 -> init should contain any code necessary for checking localStorage or, when supported, local DB.
 -> dispatch should contain everything needed for the dispatch, so that if it is executed instead of init, it works fine. 
*/


var admin = function() {
// theseTemplates is it's own var because it's loaded in multiple places.
// here, only the most commonly used templates should be loaded. These get pre-loaded. Otherwise, load the templates when they're needed or in a separate extension (ex: admin_orders)
	var theseTemplates = new Array('adminProdStdForList','adminProdSimpleForList','adminElasticResult','adminProductFinder','adminMultiPage','domainPanelTemplate','pageSetupTemplate'); 
	var r = {
		
	vars : {
		tab : null, //is set when switching between tabs. it outside 'state' because this doesn't get logged into local storage.
		tabs : ['setup','sites','jt','product','orders','crm','syndication','reports','utilities'],
		state : {},
		templates : theseTemplates,
		willFetchMyOwnTemplates : true,
		"tags" : ['IS_FRESH','IS_NEEDREVIEW','IS_HASERRORS','IS_CONFIGABLE','IS_COLORFUL','IS_SIZEABLE','IS_OPENBOX','IS_PREORDER','IS_DISCONTINUED','IS_SPECIALORDER','IS_BESTSELLER','IS_SALE','IS_SHIPFREE','IS_NEWARRIVAL','IS_CLEARANCE','IS_REFURB','IS_USER1','IS_USER2','IS_USER3','IS_USER4','IS_USER5','IS_USER6','IS_USER7','IS_USER8','IS_USER9'],
		"dependencies" : ['store_prodlist','store_navcats','store_product','store_search'] //a list of other extensions (just the namespace) that are required for this one to load
		},



					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



	calls : {


		appResource : {
			init : function(filename)	{
				this.dispatch(filename);
				},
			dispatch : function(filename)	{
				app.model.addDispatchToQ({"_cmd":"appResource","filename":filename,"_tag" : {"datapointer":"adminImageFolderList"}});	
				}
			
			}, 

			/*
a typical 'fetchData' is done for a quick determination on whether or not ANY data for the category is local.
if not, we're obviously missing what's needed.  If some data is local, check for the presence of the attributes
requested and if even one isn't present, get all.
datapointer needs to be defined early in the process so that it can be used in the handlecallback, which happens in INIT.
obj.PATH = .cat.safe.id
*/
		appPageGet : {
			init : function(obj,tagObj,Q)	{
				obj['_tag'] = typeof tagObj == 'object' ? tagObj : {};
				obj['_tag'].datapointer = 'appPageGet|'+obj.PATH;  //no local storage of this. ### need to explore solutions.
				
				this.dispatch(obj,tagObj,Q);
				r = 1;
				return r;
				},
			dispatch : function(obj,tagObj,Q)	{
				obj['_cmd'] = "appPageGet";
				app.model.addDispatchToQ(obj,Q);
				}
			}, //appPageGet
			
		appPageSet : {
			init : function(obj,tagObj,Q)	{
				this.dispatch(obj,tagObj,Q);				
				},
			dispatch : function(obj,tagObj,Q)	{
				obj._tag = tagObj;
				obj._cmd = 'appPageSet';
				app.model.addDispatchToQ(obj,Q);
				}			

			},
		adminDomainList : {
			init : function(tagObj,Q)	{
//			app.u.dump("BEGIN admin.calls.adminDomainList");
				tagObj = tagObj || {};
				tagObj.datapointer = "adminDomainList";
if(app.model.fetchData(tagObj.datapointer) == false)	{
	r = 1;
	this.dispatch(tagObj,Q);
	}
else	{
	app.u.handleCallback(tagObj);
	}

				},
			dispatch : function(tagObj,Q)	{
				app.model.addDispatchToQ({"_cmd":"adminDomainList","_tag" : tagObj},Q);
				}			
			},



//obj requires panel and pid and sub.  sub can be LOAD or SAVE
			adminUIDomainPanelExecute : {
				init : function(obj,tagObj,Q)	{
					tagObj = tagObj || {};
//save and load 'should' always have the same data, so the datapointer is shared.
					tagObj.datapointer = "adminUIDomainPanelExecute|"+obj.domain+"|"+obj.verb;
					this.dispatch(obj,tagObj,Q);
					},
				dispatch : function(obj,tagObj,Q)	{
					obj['_cmd'] = "adminUIDomainPanelExecute";
					obj["_tag"] = tagObj;
					app.model.addDispatchToQ(obj,Q);	
					}
				}, //adminUIProductPanelList



		navcats : {
//app.ext.admin.calls.navcats.appCategoryDetailNoLocal.init(path,{},'immutable');
			appCategoryDetailNoLocal : {
				init : function(path,tagObj,Q)	{
					tagObj = typeof tagObj !== 'object' ? {} : tagObj;
					tagObj.datapointer = 'appCategoryDetail|'+path;
					this.dispatch(path,tagObj,Q);
					return 1;
					},
				dispatch : function(path,tagObj,Q)	{
					app.model.addDispatchToQ({"_cmd":"appCategoryDetail","safe":path,"detail":"fast","_tag" : tagObj},Q);	
					}
				}//appCategoryDetail
			
			}, //navcats

			
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
			
		product : {
			appProductGetNoLocal : {
				init : function(pid,tagObj,Q)	{
					this.dispatch(pid,tagObj,Q)
					return 1;
					},
				dispatch : function(pid,tagObj,Q)	{
					var obj = {};
					tagObj = tagObj || {};
					tagObj["datapointer"] = "appProductGet|"+pid; 
					obj["_cmd"] = "appProductGet";
					obj["pid"] = pid;
					obj["_tag"] = tagObj;
					app.model.addDispatchToQ(obj,Q);
					}
				},//appProductGetNoLocal
//app.ext.admin.calls.product.adminProductUpdate.init(pid,attrObj,tagObj,Q)
			adminProductUpdate : {
				init : function(pid,attrObj,tagObj)	{
					this.dispatch(pid,attrObj,tagObj)
					return 1;
					},
				dispatch : function(pid,attrObj,tagObj)	{
					var obj = {};
					tagObj = tagObj || {};
					obj["_cmd"] = "adminProductUpdate";
					obj["pid"] = pid;
					obj['%attribs'] = attrObj;
					obj["_tag"] = tagObj;
					app.model.addDispatchToQ(obj,'immutable');
					}
				}
				
			}, //product
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




//obj requires sub and sref.  sub can be LOAD or SAVE
//reload is also supported.
			adminUIBuilderPanelExecute : {
				init : function(obj,tagObj,Q)	{
					tagObj = tagObj || {};
					if(obj['sub'] == 'EDIT')	{
						tagObj.datapointer = "adminUIBuilderPanelExecute|edit";
						}
					else if(obj['sub'] == 'SAVE')	{
						tagObj.datapointer = "adminUIBuilderPanelExecute|save";
						}
					else	{
						//catch. some new verb or a format that doesn't require localStorage.
						}
					this.dispatch(obj,tagObj,Q);
					},
				dispatch : function(obj,tagObj,Q)	{
					obj['_cmd'] = "adminUIBuilderPanelExecute";
					obj['_SREF'] = sref;
					obj["_tag"] = tagObj;
					app.model.addDispatchToQ(obj,Q);
					}
				} //adminUIProductPanelList

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

app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/styles.css','admin_styles']);
app.rq.push(['script',0,app.vars.baseURL+'extensions/admin/resources/legacy_compat.js']);

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
	$('button','.buttonset').button();
	$('.debug').show().append("<div class='clearfix'>Model Version: "+app.model.version+" and release: "+app.vars.release+"</div>");
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
				


//if user is logged in already (persistant login), take them directly to the UI. otherwise, have them log in.
//the code for handling the support login is in the thisisanadminsession function (looking at uri)
if(app.u.thisIsAnAdminSession())	{
	app.ext.admin.u.showHeader();
	}
else	{
	$('#appPreView').hide();
	$('#appLogin').show();
	}
				}
			},

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
						$parent.append(app.renderFunctions.transmogrify({'id':pid,'pid':pid},'adminElasticResult',app.data[tagObj.datapointer].hits.hits[i]['_source']));
						}
					app.ext.admin.u.filterFinderResults();
					}
				}
			}, //handleElasticFinderResults

/*
REMINDER!!!
Now that we have three params, findertype, path and attrib, we don't need three callbacks.
merge these into one.
JT - 2012-11-21 (on vaca)
*/

//callback executed after the navcat data is retrieved. the u, does most of the work.
		addFinderToDom : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN admin.callback.addFinderToDom.success");
				app.ext.admin.u.addFinder(tagObj.targetID,'NAVCAT',app.data[tagObj.datapointer].id);
				$('#prodFinder').parent().find('.ui-dialog-title').text('Product Finder: '+app.data[tagObj.datapointer].pretty); //updates modal title
//				app.u.dump(tagObj);
				}
			}, //addFinderToDom

//callback executed after the navcat data is retrieved. the u.addfinder does most of the work.
		addPageFinderToDom : {
			onSuccess : function(tagObj)	{
				//app.u.dump("BEGIN admin.callback.addPageFinderToDom.success");
				//app.u.dump("app.data[tagObj.datapointer]"); app.u.dump(app.data[tagObj.datapointer]);
				app.ext.admin.u.addFinder(tagObj.targetID,'PAGE',app.data[tagObj.datapointer]._rtag.path,app.data[tagObj.datapointer]._rtag.attrib);
//				$('#prodFinder').parent().find('.ui-dialog-title').text('Product Finder: '+app.data[tagObj.datapointer].pretty); //updates modal title
//				app.u.dump(tagObj);
				}
			}, //addFinderToDom

//callback executed after the appProductGet data is retrieved for creating a finder, specific to editing an attribute of a product (related items, for example)
		addPIDFinderToDom : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN admin.callback.addPIDFinderToDom.success");
				app.ext.admin.u.addFinder(tagObj.targetID,'PRODUCT',tagObj.path,tagObj.datapointer.split('|')[1],$('#prodFinder').attr('data-attrib'));
				$('#prodFinder').parent().find('.ui-dialog-title').text('Product Finder: '+app.data[tagObj.datapointer]['%attribs']['zoovy:prod_name']+" ("+app.renderFunctions.parseDataVar(tagObj.path)+")"); //updates modal title
//				app.u.dump(tagObj);
				}
			}, //addPIDFinderToDom
			
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
			app.u.dump(" -> cleanValue for array2listItems");
			app.u.dump(data.value);
			var $o = $("<ul />"); //what is appended to tag. 
			for(var i = 0; i < L; i += 1)	{
				$o.append("<li>"+data.value[i]+"<\/li>");
				}
			$tag.append($o.children());
			},
		
		array2Template : function($tag,data)	{
//				app.u.dump("BEGIN admin.renderFormats.array2Template");
//				app.u.dump(data.value);
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

	

			showUI : function(path,P)	{
				app.u.dump("BEGIN admin.a.showUI ["+path+"]");
				_ignoreHashChange = true; //see handleHashChange for details on what this does.
				document.location.hash = path;

				P = P || {};
				var $target = undefined;
				if ( !path ) {
					}
				else if ( P.dialog )	{
					//This isn't done yet. it does open the dialog, but the 'save' within that dialog doesn't work.
					P.targetID = 'uiDialog';
					$target = $(app.u.jqSelector('#',P.targetID));
					if($target.length){} //element exists, do nothing to it.
					else	{
						$target = $("<div>").attr('id',P.targetID).appendTo('body');
						$target.dialog({modal:true,width:'90%',height:500,autoOpen:false})
						}
					P.title = P.title || "Details"
					$target.parent().find('.ui-dialog-title').text(P.title);
					$target.dialog('open');
					app.ext.admin.u.handleShowSection(path,P,$target);
					}
				else {
					$('html, body').animate({scrollTop : 0},1000); //animation doesn't occur for modals.
					$('title').text(path);
					}

				// SANITY: at this point $target is where we should write to, OR undefined.

				if (!path)	{
					app.u.throwMessage("Warning! a required param for showUI was not set. path: '"+path+"' and typeof "+obj);
					}
				else if(path.substring(0,2) == '#!')	{
					//app based content always shows up in whatever tab is in focus.
					app.u.dump(" -> native appMode");
					// app.ext.admin.u.loadNativeApp(path,P);
					// loadNativeApp : function(path,P){

					if(path == '#!mediaLibraryManageMode')	{
						app.ext.admin_medialib.a.showMediaLib({'mode':'manage'});
						}
					else if(path == '#!domainConfigPanel')	{
						app.ext.admin.a.showDomainConfig();
						}
					else if(path == '#!orderPrint')	{
						app.ext.convertSessionToOrder.a.printOrder(P.data.oid,P);
						}
					else if(path == '#!orderCreate')	{
						app.ext.convertSessionToOrder.a.openCreateOrderForm();
						}
					else if(path == '#!domainConfigPanel')	{
						app.ext.admin.a.showDomainConfig();
						}
					else	{
						app.u.throwGMessage("WARNING! unrecognized app mode passed into showUI. ["+path+"]");
						}
				
					}
				else if(path.substring(0,2) == '#:')	{
					// note: these IGNORE $target since they specifying a specific tab.
					// #:setup #:product etc. are links to do 'return nav' which load the previous content
					// these are the links used along the top bar, and *MIGHT* be used inside content as well
					var tab = path.substring(2);
					P.targetID = tab+"Content";	// ex: setupContent
					// alert(P.targetID);
					app.ext.admin.vars.focusTabID = P.targetID;
					$target = $(app.u.jqSelector('#',P.targetID));
					var reloadTab = 0;
					if (tab == app.ext.admin.vars.tab)	{ reloadTab = 1; }
					if ($target.children().length === 0)	{ reloadTab = 1; }
					if (reloadTab) {
						// we are moving within the same section - so reset
						app.u.dump(" -> Moving within same section, Render it.");
						path = "/biz/"+tab+"/index.cgi";
						app.ext.admin.u.handleShowSection(path,P,$target);
						}
					else {
						app.u.dump(" -> and the heavens command .. thou shalt not reset the tab.");
						}
					$(".tabContent",'#appView').hide(); //hide all tab contents
					$target.show(); //show focus tab.
					app.ext.admin.vars.tab = tab; //do this last so that the previously selected tab can be used.						
					}
				else if (path.substring(0,5) == '/biz/') {
					// a standard compatibility navigateTo (no return nav)
					app.u.dump("Legacy navigateTo: "+path);
					var tab = app.ext.admin.u.getTabFromPath(path);
	
					if ($target === undefined) {
						P.targetID = app.ext.admin.u.getId4UIContent(path);
						app.ext.admin.vars.focusTabID = P.targetID;
						$target = $(app.u.jqSelector('#',P.targetID));
						}
//					app.u.dump(" -> tab: "+tab);
//					app.u.dump(" -> P.targetID: "+P.targetID);

					if (! P.dialog ) {						
						// don't hide tabs on a dialog
						$(".tabContent",'#appView').hide(); //hide all tab contents
						$target.show(); //show focus tab.
						}

					// a force:1 on a navigateTo will always direct us here
					// $target.attr('data-uri',path);
					app.ext.admin.u.handleShowSection(path,P,$target);
					app.ext.admin.vars.tab = tab; //do this last so that the previously selected tab can be used.
					}
				else	{
					app.u.throwMessage("Warning! an unknown path was sent to showUI path: '"+path+"' and typeof "+typeof P);
					}

				return false;
				},
/*
A generic form handler. 
$form is a jquery object of the form.
set _cmd as a hidden input in the form.
If you want to set any _tag attributes, set them as data-tag-key="value".
 -> a good example of this would be data-_tag-callback and data-_tag-extension.
Execute your own dispatch. This allows the function to be more versatile
set as onSubmit="app.ext.admin.a.processForm($(this)); app.model.dispatchThis('mutable'); return false;"
 -> if data-q is set to passive or immutable, change the value of dispatchThis to match.
*/
				processForm : function($form)	{
					var obj = $form.serializeJSON() || {};
					if($form.length && obj._cmd)	{
						var data = $form.data(); //obj of all data- attributes on the form tag. used to build tagObj. strips data- off of key.
//use data-tag-... attributes on the form to build the _tag obj for the call.
						obj._tag = {};
						for(key in data)	{
							if(i.substring(0,5) == "_tag-")	{obj._tag[i.slice(0,5)] = data[i];} //data- is stripped from key already. this slice pulls the tag- off.
							else{}
							}
						app.model.addDispatchToQ(obj,data.q);
						}
					else	{
						app.u.throwGMessage("Warning! $form was empty or _cmd not present within $form in admin.a.processForm");
						}
					},
				

//this is a function that brian has in the UI on some buttons.
//it's diferent than showUI so we can add extra functionality if needed.
//the app itself should never use this function.
			navigateTo : function(path,$t)	{
				this.showUI(path,$t ? $t : {});
				},
				
			showDomainConfig : function(){
				$(app.u.jqSelector('#',app.ext.admin.vars.focusTabID)).empty().showLoading();
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
				},
//host is www.zoovy.com.  domain is zoovy.com or m.zoovy.com.  This function wants a domain.
//changeDomain(domain,partition,path). partition and path are optional. If you have the partition, pass it to avoid me looking it up.
			changeDomain : function(domain,partition,path){
				if(domain)	{
					app.vars.domain = domain;
					$('.domain','#appView').text(domain);
					if(partition){}
					else	{
						partition = this.getDataForDomain(domain,'prt');
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
					showUI(path || "/biz/setup/index.cgi");
					}
				else	{
					app.u.throwGMessage("WARNING! admin.a.changeDomain required param 'domain' not passed. Yeah, can't change the domain without a domain.");
					}

				},



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
				},


			
//run on a select list inside 'edit' for a product list element.
//various select lists change what other options are available.
//t is 'this' from the select.
//ID is the element ID

			uiProdlistEditorUpdate : function(t,ID)	{
				app.ext.admin.u.uiSaveBuilderElement($("#editorForm"),ID,{'callback':'showMessaging','targetID':'elementEditorMessaging','message':'Saved. Panel updated to reflect new choices.'});
				app.ext.admin.calls.adminUIBuilderPanelExecute.init({'sub':'EDIT','id':ID},{'callback':'showElementEditorHTML','extension':'admin','targetID':'elementEditorContent'});
				app.model.dispatchThis();
				$('#elementEditorContent').empty().append("<div class='loadingBG'><\/div>");
				
				},

/*
to generate an instance of the finder, run: 
app.ext.admin.a.addFinderTo() passing in targetID (the element you want the finder appended to) and path (a cat safe id or list id)

*/
			addFinderTo : function(targetID,findertype,path,attrib)	{
			app.u.dump("BEGIN admin.u.addFinderTo");
			app.u.dump(" -> findertype: "+findertype);
			app.u.dump(" -> path: "+path);
			app.u.dump(" -> attrib: "+attrib);
				if(findertype == 'PRODUCT')	{
					app.ext.store_product.calls.appProductGet.init(path,{"callback":"addPIDFinderToDom","extension":"admin","targetID":targetID,"path":path})
					}
				else if(findertype == 'NAVCAT')	{
//Too many f'ing issues with using a local copy of the cat data.
					app.ext.admin.calls.navcats.appCategoryDetailNoLocal.init(path,{"callback":"addFinderToDom","extension":"admin","targetID":targetID})
					}
				else if(findertype == 'PAGE')	{
					app.ext.admin.calls.appPageGet.init({'PATH':path,'@get':[attrib]},{"attrib":attrib,"path":path,"callback":"addPageFinderToDom","extension":"admin","targetID":targetID})			
					}
				else	{
					app.u.throwGMessage("Warning! Type param for admin.a.addFinderTo is invalid. ["+findertype+"]");
					}
				app.model.dispatchThis();
				}, //addFinderTo
				
//opens a dialog with a list of domains for selection.
//a domain being selected for their UI experience is important, so the request is immutable.
//a domain is necessary so that API knows what data to respond with, including profile and partition specifics.
//though domainChooserDialog is the element that's used, it's passed in the callback anyway for error handling purposes.
			showDomainChooser : function(){
//				app.u.dump("BEGIN admin.a.showDomainChooser");
				$('#domainChooserDialog').dialog('open').showLoading();
				app.ext.admin.calls.adminDomainList.init({'callback':'handleDomainChooser','extension':'admin','targetID':'domainChooserDialog'},'immutable'); 
				app.model.dispatchThis('immutable');
				},	
				
//path - category safe id or product attribute in data-bind format:    product(zoovy:accessory_products)
			showFinderInModal : function(findertype,path,attrib)	{
				var $finderModal = $('#prodFinder');
//a finder has already been opened. empty it.
				if($finderModal.length > 0)	{
					$finderModal.empty();
					}
				else	{
					$finderModal = $('<div \/>').attr({'id':'prodFinder','title':'Product Finder'}).appendTo('body');
					}
//if the finder is for a product attribute, then add a data-sku so we can easily get the sku at any point.
//likewise, if it is NOT for a product, remove the data-pid (which may be present for a previously opened finder) to avoid any confusion down the road.
//data-pid is not used to avoid confusion. it's used on the li items in all the lists to denote which product they contain.
				$finderModal.attr('data-findertype',findertype);
				$finderModal.attr('data-path',path);
				$finderModal.attr('data-attrib',attrib);
				// if (type =='PRODUCT') {
					// var sku = path; 
					// if(sku){$finderModal.attr('data-sku',sku)}
					// else{$finderModal.removeAttr('data-sku')}
					// }
				
				$finderModal.dialog({modal:true,width:'94%',height:650});
				app.ext.admin.a.addFinderTo('prodFinder',findertype,path,attrib);
				}, //showFinderInModal

			login : function($form){
				$('#preloadAndLoginContents').showLoading();
				app.calls.authentication.accountLogin.init($form.serializeJSON(),{'callback':'showHeader','extension':'admin'});
				app.model.dispatchThis('immutable');
				},

			logout : function(){
				$('body').showLoading();
				app.calls.authentication.authAdminLogout.init({'callback':'handleLogout','extension':'admin'});//always immutable.
				app.model.dispatchThis('immutable');
//nuke all this after the request so that the dispatch has the info it needs.
				app.ext.admin.u.selectivelyNukeLocalStorage(); //get rid of most local storage content. This will reduce issues for users with multiple accounts.
				app.model.destroy('authAdminLogin'); //clears this out of memory and local storage. This would get used during the controller init to validate the session.

				}

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
				
				
				// if (window.location.indexOf("#/",0)) {
					// admin.html#/biz/xyz
					// alert('hello');
					// }
				
				if (!domain) {
					//the selection of a domain name will load the page content. (but we'll still need to nav)
					app.ext.admin.a.showDomainChooser(); 
					}
				else {
					$('.domain','#appView').text(domain);
// //no bueno to use this. if the app loads directly on a product page, that extension isn't done by the time this extension is done initing itself.
					app.ext.admin.a.showUI(window.location.hash ? window.location.hash.replace(/^#/, '') : '/biz/recent.cgi'); //commented out for testing.
					}
				}, //showHeader


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


			handleTopTabs : function(tab){
				$('li','#menutabs').addClass('off').removeClass('on'); //turn all tabs off.
				$('.'+tab+'Tab','#menutabs').removeClass('off').addClass('on');
				},
			
//executed from within showUI. probably never want to execute this function elsewhere.
			handleShowSection : function(path,P,$target)	{
				var tab = app.ext.admin.u.getTabFromPath(path);
				this.handleTopTabs(tab);
//				app.u.dump(" -> tab: "+tab);
				if(tab == 'product' && !P.dialog)	{
					app.u.dump(" -> open product editor");
					app.ext.admin_prodEdit.u.showProductEditor(path,P);
					}
				else if(tab == 'setup' && path.split('/')[3] == 'index.cgi')	{
					$('#setupContent').empty().append(app.renderFunctions.createTemplateInstance('pageSetupTemplate',{}));
					app.ext.admin.u.uiHandleLinkRewrites(path,{},{'targetID':'setupContent'});
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
				},

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
				},

//the following function gets executed as part of any fetchAdminResource request. 
//it's used to output any content in the msgs array.
//it may be empty, and that's fine.
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
						msgObj = app.u.uiMsgObject(msg[i]);
						msgObj.parentID = target; //targetID in throwMessage would get passed in _rtag. parent can be top level, so use that.
						msgObj.persistant = true; //for testing, don't hide.
//						app.u.dump(msgObj);
						app.u.throwMessage(msgObj);
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
				},
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
				},
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
				},
// 'data' is the response from the server. includes data.html
// viewObj is what is passed into fetchAdminResource as the second parameter
			uiHandleLinkRewrites : function(path,data,viewObj)	{
				// app.u.dump("BEGIN admin.u.uiHandleLinkRewrites("+path+")");
				var $target = $(app.u.jqSelector('#',viewObj.targetID));
				$('a',$target).each(function(){
					app.ext.admin.u.rewriteLink($(this));
					});
				},
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
				},
			
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
					app.ext.admin.calls.product.adminProductUpdate.init(sku,attribObj,{'callback':'pidFinderChangesSaved','extension':'admin'});
					app.ext.admin.calls.product.appProductGetNoLocal.init(sku,{},'immutable');
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
					app.ext.admin.calls.navcats.appCategoryDetailNoLocal.init(path,{"callback":"finderChangesSaved","extension":"admin"},'immutable');
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

			addFinder : function(targetID,findertype,path,attrib){

app.u.dump("BEGIN admin.u.addFinder");
//jquery likes id's with no special characters.
var safePath = app.u.makeSafeHTMLId(path);
var prodlist = new Array();

var $target = $(app.u.jqSelector('#',targetID)).empty(); //empty to make sure we don't get two instances of finder if clicked again.
//create and translate the finder template. will populate any data-binds that are set that refrence the category namespace
$target.append(app.renderFunctions.createTemplateInstance('adminProductFinder',"productFinder_"+app.u.makeSafeHTMLId(path)));
$('#finderTargetList').removeClass('loadingBG'); //bug in finder!!! if no items, stays in loading. hot fix.
app.u.dump(" -> got to if/else section. ");
if(findertype == 'PRODUCT')	{
	app.u.dump(" -> Product SKU: "+path);
//for whatever reason, attrib passed in wasn't working. I plan on updating the finder so that attrib, type and passed are never passed back and forth on the api
//they'll be retrieved using data-path or data-findertype when needed. this is a hot fix.  !!! JT 2012-11-21
	app.renderFunctions.translateTemplate(app.data['appProductGet|'+path],"productFinder_"+safePath);
	attrib = $('#prodFinder').attr('data-attrib');
	if(app.data['appProductGet|'+path]['%attribs'][attrib])
		prodlist = app.ext.store_prodlist.u.cleanUpProductList(app.data['appProductGet|'+path]['%attribs'][attrib]);
	}
else if(findertype == 'NAVCAT')	{
//	app.u.dump(" -> NON product attribute (no pid specified)");
//	app.renderFunctions.translateTemplate(app.data['appCategoryDetail|'+path],"productFinder_"+safePath);
	prodlist = app.data['appCategoryDetail|'+path]['@products'];
	}
else if(findertype == 'PAGE')	{
	app.u.dump(" -> is PAGE findertype");
	if(app.data['appPageGet|'+path]['%page'][attrib])	{
		prodlist = app.ext.store_prodlist.u.cleanUpProductList(app.data['appPageGet|'+path]['%page'][attrib])
		}	
	}
else	{
	app.u.throwGMessage("WARNING! findertype not set.");
	}
//app.u.dump(" -> path: "+path);
//app.u.dump(" -> prodlist: "+prodlist);

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
	

//set a data-finderAction on an element with a value of save, moveToTop or moveToBottom.
//save will save the changes. moveToTop will move selected product from the results over to the top of column the category list.
//moveToBottom will do the same as moveToTop except put the product at the bottom of the category.
$('#productFinder_'+safePath+' [data-finderAction]').each(function(){
	app.ext.admin.u.bindFinderButtons($(this),safePath);
	});

//bind the action on the search form.
$('#finderSearchForm').submit(function(event){
	app.ext.admin.u.handleFinderSearch();
	event.preventDefault();
	return false})
	app.ext.admin.u.updateFinderCurrentItemCount();


				
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
			handleFinderSearch : function()	{
				$('#finderSearchResults').empty().addClass('loadingBG');
				var qObj = {}; //query object
				var columnValue = $('#finderSearchQuery').val();
				qObj.type = 'product';
				qObj.mode = 'elastic-native';
				qObj.size = 400;
				qObj.query =  {"query_string" : {"query" : columnValue}};
			
				//dispatch is handled by form submit binder
				app.ext.store_search.calls.appPublicSearch.init(qObj,{"callback":"handleElasticFinderResults","extension":"admin","parentID":"finderSearchResults","datapointer":"elasticsearch"});
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
				$dom = $('#prodFinder [data-finderaction]')
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


//run as part of addFinder. will bind click events to buttons with data-finderAction on them
			bindFinderButtons : function($button,safePath){
// ### Move search button into this too. 

//	app.u.dump(" -> finderAction found on element "+$button.attr('id'));
if($button.attr('data-finderAction') == 'save')	{

	$button.click(function(event){
		event.preventDefault();
		app.ext.admin.u.saveFinderChanges($button.attr('data-path'));
		app.model.dispatchThis('immutable');
		app.ext.admin.u.changeFinderButtonsState('disable');
		
		return false;
		});
	}
else if($button.attr('data-finderAction') == 'selectAll')	{
	$button.click(function(event){
		event.preventDefault();
		$('#finderSearchResults li').not('.ui-state-disabled').addClass('ui-selected');
		});
	}
//these two else if's are very similar. the important part is that when the items are moved over, the id is modified to match the targetCat 
//id's. That way when another search is done, the disable class is added correctly.
else if($button.attr('data-finderAction') == 'moveToTop' || $button.attr('data-finderAction') == 'moveToBottom'){
	$button.click(function(event){
		event.preventDefault();
		$('#finderSearchResults .ui-selected').each(function(){
			var $copy = $(this).clone();
			app.u.dump(" -> moving item "+$copy.attr('data-pid'));
			if($button.attr('data-finderAction') == 'moveToTop')
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
				app.u.dump("BEGIN admin.u.domainConfig");
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
				app.u.dump("BEGIN admin.u.adminUIDomainPanelExecute");
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
				}



			}	//util

		} //r object.
	return r;
	}