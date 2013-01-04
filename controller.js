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



var zController = function(params) {
	this.u.dump('zController has been instantiated');
	if(typeof Prototype == 'object')	{
		alert("Oh No! you appear to have the prototype ajax library installed. This library is not compatible. Please change to a non-prototype theme (2011 series).");
		}
//zglobals is not required in the UI, but is for any
	else if(typeof zGlobals != 'object' && !app.vars.thisSessionIsAdmin)	{
//zGlobals not required in an admin session.
		alert("Uh Oh! A  required include (config.js) is not present. This document is required.");
		}
	else	{
		this.initialize(params);
		}
	}


jQuery.extend(zController.prototype, {


	
	initialize: function(P) {
//		this.u.dump(" -> initialize executed.");

//		app = this;
//		this.u.dump(P);
		app = $.extend(true,P,this); //deep extend to make sure nexted functions are preserved. If duplicates, 'this' will override P.
		app.model = zoovyModel(); // will return model as object. so references are app.model.dispatchThis et all.

		app.vars = app.vars || {};
		app.vars.platform = P.platform ? P.platform : 'webapp'; //webapp, ios, android
		app.vars.cid = null; //gets set on login. ??? I'm sure there's a reason why this is being saved outside the normal  object. Figure it out and document it.
		app.vars.fbUser = {};
		app.vars.protocol = document.location.protocol == 'https:' ? 'https:' : 'http:';

//used in conjunction with support/admin login. nukes entire local cache.
		if(app.u.getParameterByName('flush'))	{
			app.u.dump("uri param flush is true. CLEAR LOCAL STORAGE");
			localStorage.clear();
			}
		

		
//in some cases, such as the zoovy UI, zglobals may not be defined. If that's the case, certain vars, such as jqurl, must be passed in via P in initialize:
		if(typeof zGlobals == 'object')	{
			app.vars.profile = zGlobals.appSettings.profile.toUpperCase();
			app.vars.username = zGlobals.appSettings.username.toLowerCase();
//need to make sure the secureURL ends in a / always. doesn't seem to always come in that way via zGlobals
			app.vars.secureURL = zGlobals.appSettings.https_app_url;
			app.vars.sdomain = zGlobals.appSettings.sdomain;
			if('https:' == app.vars.protocol)	{app.vars.jqurl = zGlobals.appSettings.https_api_url;}
			else	{app.vars.jqurl = zGlobals.appSettings.http_api_url}
			}
		
// can be used to pass additional variables on all request and that get logged for certain requests (like createOrder). 
// default to blank, not 'null', or += below will start with 'undefined'.
//vars should be passed as key:value;  _v will start with zmvc:version.release.
		app.vars.passInDispatchV = '';  
		app.vars.release = app.vars.release || 'unspecified'; //will get overridden if set in P. this is default.

// += is used so that this is appended to anything passed in P.
		app.vars.passInDispatchV += 'browser:'+app.u.getBrowserInfo()+";OS:"+app.u.getOSInfo()+';'; //passed in model as part of dispatch Version. can be app specific.
		
		app.ext = app.ext || {}; //for holding extensions, including checkout.
		app.data = {}; //used to hold all data retrieved from ajax requests.
		
/*
app.templates holds a copy of each of the templates declared in an extension but defined in the view.
copying the template into memory was done for two reasons:
1. faster reference when template is needed.
2. solve any duplicate 'id' issues within the spec itself when original spec and cloned template are present.
   -> this solution was selected over adding a var for subbing in the templates because the interpolation was thought to be too heavy.
*/
		app.templates = {};

		app.q = {};
//queues are arrays, not objects, because order matters here. the model.js file outlines what each of these is used for.
		app.q = {mutable : new Array(), passive: new Array(), immutable : new Array()};
		
		app.globalAjax = {
			dataType : 'json',
			overrideAttempts : 0, //incremented when an override occurs. allows for a cease after X attempts.
			lastDispatch : null, //timestamp.
			passiveInterval : setInterval(function(){app.model.dispatchThis('passive')},5000), //auto-dispatch the passive q every five seconds.
			numRequestsPerPipe : 50,
			requests : {"mutable":{},"immutable":{},"passive":{}} //'holds' each ajax request. completed requests are removed.
			}; //holds ajax related vars.
		app.sessionId = null;
		app.vars.extensions = app.vars.extensions || [];
		
		app.handleAdminVars(); //needs to be late because it'll use some vars set above.
		app.onReady();

		}, //initialize


//This is run on init, BEFORE a user has logged in to see if login info is in localstorage or on URI.
//after login, the admin vars are set in the model.
	handleAdminVars : function(){
//		app.u.dump("BEGIN handleAdminVars");
		var localVars = {}
		
		if(app.model.fetchData('authAdminLogin'))	{localVars = app.data.authAdminLogin}

//		app.u.dump(" -> localVars: "); app.u.dump(localVars);
		
		function setVars(id){
//			app.u.dump("GOT HERE!");
//			app.u.dump("-> "+id+": "+app.u.getParameterByName(id));
			if(app.vars[id])	{} //already set, do nothing.
//check url. these get priority of local so admin/support can overwrite.
//uri ONLY gets checked for support. This is so that on redirects back to our UI from a partner interface don't update auth vars.
			else if(app.u.getParameterByName('trigger') == 'support' && app.u.getParameterByName(id))	{app.vars[id] = app.u.getParameterByName(id);} 
			else if(localVars[id])	{app.vars[id] = localVars[id]}
			else	{app.vars[id] = ''}//set to blank by default.
			}
		
		setVars('deviceid');
		setVars('userid');
		setVars('authtoken');
		setVars('domain');
		setVars('username');

		app.vars.username = app.vars.username.toLowerCase();
//		app.u.dump(" -> app.vars: "); app.u.dump(app.vars);
		
//		if(!app.vars.username && app.vars.userid && app.vars.userid.indexOf('@') > 0)	{
//			app.u.dump("REMINDER!!! this is a temporary solution till username is returned in authAdminLogin");
//			app.vars.username = app.vars.userid.split('@')[1].toLowerCase();
//			}
		
		},

	onReady : function()	{
		this.u.dump(" -> onReady executed. V: "+app.model.version+"|"+app.vars.release);
/*

session ID can be passed in via the params (for use in one page checkout on a non-ajax storefront). If one is passed, it must be validated as active session.
if no session id is passed, the getValidSessionID function will look to see if one is in local storage and use it or request a new one.
Exception - the controller is used for admin sessions too. if an admin session is being instantiated, forget about session id (cartid) for now.

A session ID could be passed in through vars, but app.sessionId isn't set until the session id has been verified OR the app is explicitly told to not validate the session.
*/
		if(app.vars.thisSessionIsAdmin && app.vars.sessionId)	{
//you'd get here in the UI.
			app.sessionId = app.vars.sessionId
			app.model.addExtensions(app.vars.extensions);
			}
		else if(app.vars.thisSessionIsAdmin)	{
			//for now, do nothing.  this may change later.
			app.model.addExtensions(app.vars.extensions);
			}
		else if(app.vars.sessionId)	{
			app.calls.appCartExists.init(app.vars.sessionId,{'callback':'handleTrySession','datapointer':'appCartExists'});
			app.model.dispatchThis('immutable');
			}
//if sessionId is set on URI, there's a good chance a redir just occured from non secure to secure.
		else if(app.u.isSet(app.u.getParameterByName('sessionId')))	{
			app.calls.appCartExists.init(app.u.getParameterByName('sessionId'),{'callback':'handleTrySession','datapointer':'appCartExists'});
			app.model.dispatchThis('immutable');
			}
//check localStorage
		else if(app.model.fetchSessionId())	{
			app.calls.appCartExists.init(app.model.fetchSessionId(),{'callback':'handleTrySession','datapointer':'appCartExists'});
			app.model.dispatchThis('immutable');
			}
		else	{
			app.calls.getValidSessionID.init('handleNewSession');
			app.model.dispatchThis('immutable');
			}
		
//if third party inits are not done before extensions, the extensions can't use any vars loaded by third parties. yuck. would rather load our code first.
// -> EX: username from FB and OPC.
		app.u.handleThirdPartyInits();
		
		}, //onReady
					// //////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ \\		


/*
calls all have an 'init' as well as a 'dispatch'.
the init allows for the call to check if the data being retrieved is already in the session or local storage and, if so, avoid a request.
If the data is not there, or there's no data to be retrieved (a Set, for instance) the init will execute the dispatch.
*/
	calls : {

//all authentication calls use immutable Q
		authentication : {
//the authentication through FB sdk has already taken place and this is an internal server check to verify integrity.	
//the getFacebookUserData function also updates bill_email and adds the fb.user info into memory in a place quickly accessed
//the obj passed in is passed into the request as the _tag
			facebook : {
				init : function(tagObj)	{
					app.u.dump('BEGIN app.calls.authentication.facebook.init');
//Sanity - this call occurs AFTER a user has already logged in to facebook. So though server authentication may fail, the login still occured.
_gaq.push(['_trackEvent','Authentication','User Event','Logged in through Facebook']);
					this.dispatch(tagObj);
					return 1;
					},
				dispatch : function(tagObj)	{
//note - was using FB['_session'].access_token pre v-1202. don't know how long it wasn't working, but now using _authRepsonse.accessToken
					app.model.addDispatchToQ({'_cmd':'appVerifyTrustedPartner','partner':'facebook','appid':zGlobals.thirdParty.facebook.appId,'token':FB['_authResponse'].accessToken,'state':app.sessionID,"_tag":tagObj},'immutable');
					}
				}, //facebook
//obj is login/password.
//tagObj is everything that needs to be put into the tag node, including callback, datapointer and/or extension.
			zoovy : {
				init : function(obj,tagObj)	{
//					app.u.dump('BEGIN app.calls.authentication.zoovy.init ');
//					app.u.dump(' -> username: '+obj.login);
//email should be validated prior to call.  allows for more custom error handling based on use case (login form vs checkout login)
					app.calls.cartSet.init({"bill/email":obj.login}) //whether the login succeeds or not, set bill/email in /session
					this.dispatch(obj,tagObj);
					return 1;
					},
				dispatch : function(obj,tagObj)	{
					obj["_cmd"] = "appBuyerLogin";
					obj['method'] = "unsecure";
					obj["_tag"] = tagObj;
					obj["_tag"]["datapointer"] = "appBuyerLogin";
					
					app.model.addDispatchToQ(obj,'immutable');
					}
				}, //zoovy
			
			buyerLogout : {
				init : function(obj,tagObj)	{
					this.dispatch(obj,tagObj);
					return 1;
					},
				dispatch : function(obj,tagObj)	{
					obj["_cmd"] = "buyerLogout";
					obj["_tag"] = tagObj;
					obj["_tag"]["datapointer"] = "buyerLogout";
					app.model.addDispatchToQ(obj,'immutable');
					}
				}, //appBuyerLogout
			
			authAdminLogout : {
				init : function(tagObj)	{
					this.dispatch(tagObj);
					return 1;
					},
				dispatch : function(tagObj){
					app.model.addDispatchToQ({'_cmd':'authAdminLogout',"_tag":tagObj},'immutable');
					}
				}, //authAdminLogout

			accountLogin : {
				init : function(obj,tagObj)	{
					this.dispatch(obj,tagObj);
					return 1;
					},
				dispatch : function(obj,tagObj){
					app.u.dump("Attempting to log in");
					obj._cmd = 'authAdminLogin';
					app.vars.userid = obj.userid.toLowerCase();	 // important!
					obj.authtype = "md5";
					obj.ts = app.u.ymdNow();
					obj.authid = Crypto.MD5(obj.password+obj.ts);
					obj._tag = tagObj || {};
					obj.device_notes = "";
					if(obj.persitentAuth)	{obj._tag.datapointer = "authAdminLogin"} //this is only saved locally IF 'keep me logged in' is true.
					delete obj.password;
					app.model.addDispatchToQ(obj,'immutable');
					}
				}

			}, //authentication

		authAccountCreate : {
			init : function(obj,tagObj){
				this.dispatch(obj,tagObj);
				},
			dispatch : function(obj,tagObj){
				obj._cmd = 'authUserRegister';
				tagObj = tagObj || {};
				obj['tag'] = tagObj;
				app.model.addDispatchToQ(obj,'immutable');
				}
			},

		appCartCreate : {
			init : function(tagObj)	{
				this.dispatch(tagObj); 
				return 1;
				},
			dispatch : function(tagObj)	{
				app.model.addDispatchToQ({"_cmd":"appCartCreate","_tag":tagObj},'immutable');
				}
			},//getValidSessionID





		appCategoryDetail : {
			init : function(obj,_tag,Q)	{
				if(obj && obj.safe)	{
					var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
					_tag = _tag || {};
					_tag.datapointer = 'appCategoryDetail|'+obj.safe;
					
//the model will add the value of _tag.detail into the response so it is stored in the data and can be referenced for future comparison.
					if(obj.detail)	{_tag.detail = obj.detail} else {}
					
//if no detail or detail = fast, but anything is in memory, use it.
					if(app.model.fetchData(_tag.datapointer) && (!obj.detail || obj.detail=='fast'))	{
						app.u.handleCallback(_tag)
						}
//max is the highest level, so if we have that already, just use it.
					else if(app.data[_tag.datapointer] && app.data[_tag.datapointer].detail == 'max')	{
						app.u.handleCallback(_tag);
						}
					else if (obj.detail == 'more' && (app.data[_tag.datapointer] && (!app.data[_tag.datapointer].detail == 'more' || app.data[_tag.datapointer].detail == 'max')))	{
						app.u.handleCallback(_tag);
						}
					else 	{
						r += 1;
						this.dispatch(obj,_tag,Q);
						}
					}
				else	{
					app.u.throwGMessage("In calls.appCategoryDetail, obj.safe not passed.");
					app.u.dump(obj);
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "appCategoryDetail";
				obj._tag = _tag;
				app.model.addDispatchToQ(obj,Q);	
				}
			},//appCategoryDetail



//get a product record.
//required params: obj.pid.
//optional params: obj.withInventory and obj.withVariations
		appProductGet : {
			init : function(obj,_tag,Q)	{
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				if(obj && obj.pid)	{
					if(typeof obj.pid === 'string')	{obj.pid = obj.pid.toUpperCase();} //will error if obj.pid is a number.
					
					_tag = _tag || {};
					_tag.datapointer = "appProductGet|"+obj.pid;
//The fetchData will put the data into memory if present, so safe to check app.data... after here.
					if(app.model.fetchData(_tag.datapointer) == false)	{
						r = 1;
						this.dispatch(obj,_tag,Q)
						}
//if variations or options are requested, check to see if they've been retrieved before proceeding.
					else if((obj.withVariations && app.data[_tag.datapointer]['@variations'] === undefined) || (obj.withInventory && app.data[_tag.datapointer]['@inventory'] === undefined))	{
						r = 1;
						this.dispatch(obj,_tag,Q);
						}
					else 	{
						app.u.handleCallback(_tag);
						}
					}
				else	{
					app.u.throwGMessage("In calls.appProductGet, required parameter pid was not passed");
					app.u.dump(obj);
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj["_cmd"] = "appProductGet";
 				obj["_tag"] = _tag;
				app.model.addDispatchToQ(obj,Q);
				}
			}, //appProductGet





//always uses immutable Q
// ### need to migrate anything using this to use appCartCreate.
		getValidSessionID : {
			init : function(callback)	{
				this.dispatch(callback); 
				return 1;
				},
			dispatch : function(callback)	{
				app.model.addDispatchToQ({"_cmd":"appCartCreate","_tag":{"callback":callback}},'immutable');
				}
			},//getValidSessionID

//always uses immutable Q
//formerly canIHaveSession
		appCartExists : {
			init : function(cartid,tagObj)	{
//					app.u.dump('BEGIN app.calls.appCartExists');
				app.sessionId = cartid; //needed for the request. may get overwritten if not valid.
				this.dispatch(cartid,tagObj);
				return 1;
				},
			dispatch : function(cartid,tagObj)	{
				var obj = {};
				obj["_cmd"] = "appCartExists"; 
				obj["_tag"] = tagObj;
				app.model.addDispatchToQ(obj,'immutable');
				}
			}, //appCartExists

//for now, no fetch is done here. it's assumed if you execute this, you don't know who you are dealing with.
		whoAmI : {
			init : function(tagObj,Q)	{
				this.dispatch(tagObj,Q);
				return 1;
				},
			dispatch : function(tagObj,Q)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "whoAmI"
				app.model.addDispatchToQ({"_cmd":"whoAmI","_tag" : tagObj},Q);	
				}
			},//whoAmI

		canIUse : {
			init : function(flag,Q)	{
				this.dispatch(flag,Q);
				return 1;
				},
			dispatch : function(flag,Q)	{
				app.model.addDispatchToQ({"_cmd":"canIUse","flag":flag,"_tag":{"datapointer":"canIUse|"+flag}},Q);
				}
			}, //canIUse

//default immutable Q
//formerly setSessionVars
		cartSet : {
			init : function(obj,tagObj,Q)	{
				this.dispatch(obj,tagObj,Q);
				return 1;
				},
			dispatch : function(obj,tagObj,Q)	{
				if(!Q)	{Q = 'immutable'}
				obj["_cmd"] = "cartSet";
				if(tagObj)	{obj["_tag"] = tagObj;}
				app.model.addDispatchToQ(obj,Q);
				}
			}, //cartSet

		ping : {
			init : function(tagObj,Q)	{
				this.dispatch(tagObj,Q);
				return 1;
				},
			dispatch : function(tagObj,Q)	{
				app.model.addDispatchToQ({"_cmd":"ping","_tag":tagObj},Q); //get new session id.
				}
			}, //ping

			
		appProfileInfo : {
			init : function(obj,_tag,Q)	{
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				if(typeof obj == 'object' && (obj.profile || obj.sdomain))	{
					_tag = _tag || {};
					_tag.datapointer = 'appProfileInfo|'+(obj.profile || obj.sdomain);

					if(app.model.fetchData(_tag.datapointer) == false)	{
						r = 1;
						this.dispatch(obj,_tag,Q);
						}
					else 	{
						app.u.handleCallback(_tag)
						}
					}
				else	{
					app.u.throwGMessage("In calls.appProfileGet, obj either missing or missing profile or sdomain var.");
					app.u.dump(obj);
					}

				return r;
				}, // init
			dispatch : function(obj,_tag,Q)	{
				obj['_cmd'] = "appProfileInfo";
				obj['_tag'] = _tag;
				app.model.addDispatchToQ(obj,Q);
				} // dispatch
			}, //appProfileInfo

//used to get a clean copy of the cart. ignores local/memory. used for logout.
		refreshCart : {
			init : function(tagObj,Q)	{
//				app.u.dump("BEGIN app.calls.refreshCart");
				var r = 1;
//if datapointer is fixed (set within call) it needs to be added prior to executing handleCallback (which will likely need datapointer to be set).
				tagObj = jQuery.isEmptyObject(tagObj) ? {} : tagObj;
				tagObj.datapointer = "cartDetail";
				this.dispatch(tagObj,Q);
				return r;
				},
			dispatch : function(tagObj,Q)	{
//				app.u.dump('BEGIN app.ext.store_cart.calls.cartDetail.dispatch');
				app.model.addDispatchToQ({"_cmd":"cartDetail","_tag": tagObj},Q);
				} 
			} // refreshCart removed comma from here line 383
		}, // calls

					// //////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ \\
/*
Callbacks require should have an onSuccess.
Optionally, callbacks can have on onError. if you have a custom onError, no error messaging is displayed. This give the developer the opportunity to easily suppress errors for a given request/callback.
app.u.throwMessage(responseData); is the default error handler.
*/
	callbacks : {
		

		handleSessionStartResponse : {
			onSuccess : function(tagObj)	{
//				app.data[tagObj.datapointer]				
				},
			onError : function(responseData)	{
				app.u.throwMessage(responseData);
				}
			},//handleSessionStartResponse


		handleNewSession : {
//app.sessionID is set in the method. no need to set it here.
//use app.sessionID if you need it in the onSuccess.
//having a callback does allow for behavioral changes (update new session with old cart contents which may still be available.
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN app.callbacks.handleNewSession.onSuccess');
// if there are any  extensions(and most likely there will be) add then to the controller.
// This is done here because a valid cart id is required.
				app.model.addExtensions(app.vars.extensions);
				}
			},//convertSessionToOrder

//executed when appCartExists is requested.
//app.sessionID is already set by this point. need to reset it onError.
// onError does NOT need to nuke app.sessionId because it's handled in handleResponse_appCartExists 
		handleTrySession : {
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN app.callbacks.handleTrySession.onSuccess');
//				app.u.dump(" -> exists: "+app.data.appCartExists.exists);
				if(app.data.appCartExists.exists >= 1)	{
					app.u.dump(' -> valid session id.  Proceed.');
// if there are any  extensions(and most likely there will be) add then to the controller.
// This is done here because a valid cart id is required.
					app.model.addExtensions(app.vars.extensions);
//
					app.calls.whoAmI.init({'callback':'suppressErrors'},'passive'); //get this info when convenient.
					}
				else	{
					app.u.dump(' -> UH OH! invalid session ID. Generate a new session. nuke localStorage if domain is ssl.zoovy.com.');
					app.calls.appCartCreate.init({'callback':'handleNewSession'});
					app.model.dispatchThis('immutable');
					}
				}
			}, //handleTrySession
		
		handleAdminSession : {
			onSuccess : function(tagObj)	{
				app.u.dump('BEGIN app.callbacks.handleAdminSession.onSuccess');
//in DEV still. do not use this callback.
//				app.vars['_admin'] is set in the model.
				}
			},
			
		translateSelector : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN callbacks.translateSelector");
				if(typeof jQuery().hideLoading == 'function'){$(tagObj.selector).hideLoading();}
				app.renderFunctions.translateSelector(tagObj.selector,app.data[tagObj.datapointer]);
				}
			},
	
		
//pass the following on _tag:
// parentID is the container id that the template instance is already in (should be created before call)
// templateID is the template that will get translated.
// the app.data.datapointer is what'll get passed in to the translate function as the data src. (ex: getProduct|PID)
		translateTemplate : 	{
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN callbacks.translateTemplate"); app.u.dump(tagObj);
//				app.u.dump("typeof jQuery.hideLoading: "+typeof jQuery().hideLoading);
				if(typeof jQuery().hideLoading == 'function'){$('#'+tagObj.parentID).hideLoading();}
				app.renderFunctions.translateTemplate(app.data[tagObj.datapointer],tagObj.parentID);
				}
			}, //translateTemplate

// a generic callback to allow for success messaging to be added. 
// pass message for what will be displayed.  For error messages, the system messaging is used.
		showMessaging : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN app.callbacks.showMessaging");
				var msg = app.u.successMsgObject(tagObj.message);
				msg['_rtag'] = tagObj; //pass in tagObj as well, as that contains info for parentID.
				app.u.throwMessage(msg);
				}
			}, //showMessaging
		
		disableLoading : {
			onSuccess : function(tagObj)	{
				$('#'+tagObj.targetID).hideLoading();
				},
			onError : function(responseData)	{
				app.u.throwMessage(responseData);
				$('#'+responseData.tagObj.targetID).hideLoading(); //even with the error, it's bad form to leave the loading bg.
				}

			},
/*
By default, error messaging is thrown to the appMessaging class. Sometimes, this needs to be suppressed. Add this callback and no errors will show.
ex: whoAmI call executed during app init. Don't want "we have no idea who you are" displayed as an error.
*/

		suppressErrors : {
			onSuccess : function(tagObj)	{
//dummy callback. do nothing.
				},
			onError : function(responseData,uuid)	{
//dummy callback. do nothing.
				app.u.dump("CAUTION! response for uuid ["+uuid+"] contained errors but they were suppresed. This may be perfectly normal (passive requests) but should be investigated.");
				}
			} //suppressErrors
			
			
		}, //callbacks




////////////////////////////////////   UTIL [u]    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\






	u : {


/*
when a call is requested but the data is local, execute this function.
it will check to see if a callback is defined and if it is, execute it.
smart enough to determine if an extension is involved and execute it from there.

-> this is a function because what is in the 'if' was being duplicated in almost every call 
that dealt with a fetch. So it was made into a function to make the calls tighter and also 
allow for global manipulation if needed later.

app.u.handleCallback(tagObj);
*/

		handleCallback : function(tagObj)	{
//			app.u.dump("BEGIN u.handleCallback");
//			if(tagObj && tagObj.datapointer && ){app.data[tagObj.datapointer]['_rtag'] = tagObj} //updates obj in memory to have latest callback. -> commented out 2012-12-21. this shouldn't be needed in data.
			if(tagObj && tagObj.callback){
//				app.u.dump(" -> callback exists");
//				app.u.dump(tagObj.callback);
				if(typeof tagObj.callback == 'function')	{app.u.dump(" -> executing anonymous function."); tagObj.callback(tagObj);}
				else	{
//				app.u.dump(" -> callback is not an anonymous function.");
					var callback;
//most callbacks are likely in an extension, but support for 'root' callbacks is necessary.
//save path to callback so that we can verify the onSuccess is a function before executing (reduce JS errors with this check)
					callback = tagObj.extension ? app.ext[tagObj.extension].callbacks[tagObj.callback] : app.callbacks[tagObj.callback];
					if(typeof callback.onSuccess == 'function')	{
						callback.onSuccess(tagObj);
						}
					else	{}//callback defined as string, but callback.onsuccess is not a function.
					}
				}
			else	{
//				app.u.dump(" -> no callback was defined.");
				}
			},


/*
when quickstart is added, it will go through app.rq and use this function to add all resources as needed.
it'll then set app.rq.push to mirror this function.
*/

			handleResourceQ : function(arr)	{
				if(arr[0] == 'script')	{
					app.u.loadScript(arr[2],arr[3]);
					}
				else if(arr[0] == 'extension')	{
//					app.u.dump(" -> extension loading: "+arr[2]+" callback: "+arr[4]);
					var tmpObj = {"namespace":arr[2],"filename":arr[3],"callback":arr[4]}; //
					app.vars.extensions.push(tmpObj); // keep the full list just in case.
					app.u.loadScript(arr[3],function(){
						app.model.fetchExtension(tmpObj); 
						});
					app.model.executeCallbacksWhenExtensionsAreReady([tmpObj]); //function wants an array of objects.
					}
				else if(arr[0] == 'templateFunction')	{
					app.ext.myRIA.template[arr[1]][arr[2]].push(arr[3]);
					}
				else if(arr[0] == 'css')	{
					app.u.loadCSSFile(arr[2],arr[3] || null);
					}
				else	{
		//currently, this function is intended for pass 0 only, so if an item isn't pass 0,do nothing with it.
					}

				
				},


//filename is full path of .css file (or valid relative path)
//domID is optional id to add to <link> allows for removal or changing later.
//if you pass a domID that already exists, that file is 'saved over'.
		loadCSSFile : function(filename,domID){
			if(filename && domID && document.getElementById(domID))	{
				document.getElementById(domID).href = filename; //overwrite existing .css file. effectively removes old in favor of new.
				}
			else if(filename)	{
// Create element node - link object
				var fileref=document.createElement('link');
	
// Set link object attributes like
// <link rel="stylesheet" type="text/css" href="filename" />
				fileref.setAttribute('rel', 'stylesheet');
				fileref.setAttribute('type', 'text/css');
				fileref.setAttribute('href', filename);
				if(domID)	{fileref.setAttribute('id', domID);}
// Append link object inside html's head
				document.getElementsByTagName("head")[0].appendChild(fileref);
				}
			else	{
				//doh! no filename.
				}
			},



		printByElementID : function(id)	{
//				app.u.dump("BEGIN myRIA.a.printByElementID");
			if(id && $('#'+id).length)	{
				var html="<html><style>@media print{.pageBreak {page-break-after:always}}</style><body style='font-family:sans-serif;'>";
				html+= document.getElementById(id).innerHTML;
				html+="</body></html>";
				
				var printWin = window.open('','','left=0,top=0,width=600,height=600,toolbar=0,scrollbars=0,status=0');
//a browser could disallow the window.open, which results in printWin NOT being defined and that ends in a JS error, so 'if' added.
				if(printWin)	{
					printWin.document.write(html);
					printWin.document.close();
					printWin.focus();
					printWin.print();
					printWin.close();
					}
				}
			else	{
				app.u.dump("WARNING! - myRIA.a.printByElementID executed but not ID was passed ["+id+"] or was not found on DOM [$('#'+"+id+").length"+$('#'+id).length+"].");
				}
			},

//pass in a string (my.string.has.dots) and a nested data object, and the dots in the string will map to the object and return the value.
//ex:  ('a.b',obj) where obj = {a:{b:'go pack go'}} -> this would return 'go pack go'
//will be used in updates to translator.

//http://stackoverflow.com/questions/5240785/split-abc/5240797#5240797
		getObjValFromString : function (s,obj,char)	{
			cart = char || '.';
			var o=obj, attrs=s.split(char);
			while (attrs.length > 0) {
				o = o[attrs.shift()];
				if (!o) {o= null; break;}
				}
			return o;

			},



//http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
		guidGenerator : function() {
			var S4 = function() {
				return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
				};
			return (S4()+S4()+S4()+S4()+S4()+S4()+S4()+S4());
			},

//when sending the user into a waiting pattern, pass true.  This changes the cursor into the browser 'waiting' state
//don't forget to turn this off when done.
		handleWait : function (tfu){
			if(tfu == true)	{
				$('body').css({'cursor':'wait'})
				}
			else	{
				$('body').css({'cursor':'auto'})
				}
			},
			

//jump to an anchor. can use a name='' or id=''.  anchor is used in function name because that's the common name for this type of action. do not need to pass # sign.
		jumpToAnchor : function(id)	{
			window.location.hash=id;
			},
//uses throwMessage, but always adds the same generic message. value of 'err' is output w/ dump.
//this should only be used for app errors (errors thrown from within the MVC, not as a result of an API call, in which case throwMessage should be used (handles request errors nicely)
		throwGMessage : function(err,parentID){
			var msg = this.errMsgObject("Well this is embarrassing. Something bad happened. Please try that again. If this error persists, please contact the site administrator.<br \/>Err: "+err+"<br \/>Dev: console may contain additional details.","#");
			app.u.dump("FROM throwGMessage: "+err);
			if(parentID)	{msg.parentID = parentID}
			this.throwMessage(msg);
//			app.u.dump(err);
			},
/*
msg could be a string or an object.
if an object, could be: {errid,errmsg,errtype}   OR   {msg_X_txt,msg_X_type,msg_X_id}
 -> if msg_X format, X will be an integer and _msgs will be set to indicate the # of messages.

$target - a jquery object of the target/destination for the message itself. Will check err for parentID, targetID and if not present, check to see if globalMessaging is present AND visible.  If not visible, will open modal.
returns the id of the message, so that an action can be easily added if needed (onclick or timeout w/ a hide, etc)

persistant - this can be passed in as part of the msg object or a separate param. This was done because repeatedly, error messaging in the control
and model that needed to be permanently displayed had to be converted into an object just for that and one line of code was turning into three.
*/
		throwMessage : function(msg,persistant){
//			app.u.dump("BEGIN app.u.throwMessage");
//			app.u.dump(" -> msg follows: "); app.u.dump(msg);
			var $target; //where the app message will be appended.
			var messageClass = "appMessage_"+this.guidGenerator(); //the class added to the container of the message. message 'may' appear in multiple locations, so a class is used instead of an id.
			var r = messageClass; //what is returned. set to false if no good error message found. set to htmlID is error found. 
			var $container = $("<div \/>").addClass('appMessage').addClass(messageClass).append("<button onClick='$(\"."+messageClass+"\").toggle(); return false;' class='ui-state-default ui-corner-all floatRight stdMargin'><span class='ui-button ui-icon-circle-close'>X</span><\/button>");
//make sure the good-ole fallback destination for errors exists and is a modal.
			var $globalDefault = $('#globalErrorMessaging')
			if	($globalDefault.length == 0)	{
				$globalDefault = $("<div \/>").attr({'id':'globalErrorMessaging'}).appendTo('body');
				$globalDefault.dialog({autoOpen:false,modal:true})
				}

			if(typeof msg === 'string')	{
				if($('.appMessaging:visible').length > 0)	{
//					app.u.dump(" -> target is appMessaging.");
					$target = $('.appMessaging');
					}
				else	{
//					app.u.dump(" -> target is globalDefault.");
					$target = $globalDefault;
					$target.dialog('open');
					}
				$container.append(this.formatMessage(msg)).prependTo($target); //always put new messages at the top.
				}
			else if(typeof msg === 'object')	{
				persistant = persistant || msg.persistant; //global persistence (within this context) gets priority.
				msg.messageClass = messageClass;
				if(msg.parentID){$target = $('#'+msg.parentID);}
				else if(typeof msg['_rtag'] == 'object' && msg['_rtag'].parentID && $('#'+msg['_rtag'].parentID).length)	{$target = $('#'+msg['_rtag'].parentID);}
				else if(typeof msg['_rtag'] == 'object' && msg['_rtag'].targetID && $('#'+msg['_rtag'].targetID).length)	{$target = $('#'+msg['_rtag'].targetID)}
				else if($('.appMessaging:visible').length > 0)	{$target = $('.appMessaging');}
				else	{
					$target = $globalDefault;
					$target.dialog('open');
					}
				$container.append(this.formatResponseErrors(msg)).prependTo($target);
				}
			else	{
				app.u.dump("WARNING! - unknown type ["+typeof err+"] set on parameter passed into app.u.throwMessage");
				r = false; //don't return an html id.
				}
			if(persistant !== true)	{
//the message could be removed manually prior to the callback being executed, so don't animate if that's the case. (avoids popping issue)
				setTimeout(function(){
					if($('.'+messageClass).is(':visible'))	{
						$('.'+messageClass).slideUp(2000);
						}
					},10000); //shrink message after a short display period
				}
//get rid of all the loading gfx in the target so users know the process has stopped.
			$target.removeClass('loadingBG');
			if(typeof $.hideLoading == 'function'){$target.hideLoading()} //used in UI. plan on switching everything applicable to this.
 
			return r;
			},



// The next functions are simple ways to create success or error objects.
// pass in a message and the entire success object is returned.
// keep this simple. don't add support for icons or message type. If that degree of control is needed, build your own object and pass that in.
// function used in store_product (and probably more)
		successMsgObject : function(msg)	{
			return {'errid':'#','errmsg':msg,'errtype':'success','uiIcon':'check','uiClass':'success'}
			},



		errMsgObject : function(msg,errid)	{
			return {'errid':errid || '#','errmsg':msg,'errtype':'apperr','uiIcon':'alert','uiClass':'error'}
			},
		statusMsgObject : function(msg)	{
			return {'errid':'#','errmsg':msg,'errtype':'statusupdate','uiIcon':'transferthick-e-w','uiClass':'statusupdate'}
			},
		youErrObject : function(errmsg,errid)	{
			return {'errid':errid,'errmsg':errmsg,'errtype':'youerr','uiIcon':'alert','uiClass':'highlight'}
			},

/*
pass in the responseData from the api request and this will return all the errors as their own lineitems.
Request that can have multiple errors come back have _msg... in response (like adding to cart)
Other requests will have errid set
This function will have both cases.
*/

		formatResponseErrors : function(d)	{
			var r;
			if(!d)	{
				r = 'unknown error has occured';
				}
			else if(typeof d == 'string')	{
				r = app.u.formatMessage(d);
				}
			else if(typeof d == 'object')	{
				r = "";
				if(d['_msgs'])	{
					for(var i = 1; i <= d['_msgs']; i += 1)	{
//						app.u.dump(d['_msg_'+i+'_type']+": "+d['_msg_'+i+'_id']);
						r += "<div class='"+d['_msg_'+i+'_type']+"'>"+d['_msg_'+i+'_txt'];
						if(d['_msg_'+i+'_id']) { r += "<br \/>Error ID: "+d['_msg_'+i+'_id']}
						r += "<\/div>";
						}
					}
				else if(d['errid'])	{
					r += "<div class='"+d.errtype+" appMessageTxt'>"+d.errmsg
					if(d.errid && d.errid != "#") { r += "<br \/>Error ID: "+d.errid}
					r += "<\/div>";
//					app.u.dump("WARNGING! error occured. id: "+d.errid+" and type: "+d.errtype+" and msg: "+errmsg);
					}
//the validate order request returns a list of issues.
				else if(d['@issues'])	{
					var L = d['@issues'].length;
					for(var i = 0; i < L; i += 1)	{
						r += "<div>"+d['@issues'][i][3]+"<\/div>";
						}
					}
				d.message = r; //pass in entire original object as it may contain uiClass and/or uiIcon or other params
				r = app.u.formatMessage(d);
				}
			else	{
				app.u.dump(" -> app.u.formatResponseErrors 'else' hit. Should not have gotten to this point");
				r = 'unknown error has occured';
				}
			return r;
			},




/*
for handling app messaging to the user.
pass in just a message and warning will be displayed.
pass in additional information for more control, such as css class of 'error' and/or a different jqueryui icon.
*/
		formatMessage	: function(messageData)	{
//			app.u.dump("BEGIN app.u.formatMessage");
// message data may be a string, so obj is used to build a new object. if messagedata is an object, it is saved into obj.
			var obj = {}; 
			if(typeof messageData == 'string')	{
//				app.u.dump(" -> is a string. show warning.");
				obj.message = messageData;
				obj.uiClass = 'error';
				obj.uiIcon = 'info';
				}
			else	{
				obj = messageData;
//default to a 'highlight' state, which is a warning instead of error.
//				app.u.dump(" -> is an object. show message specific class.");
//				app.u.dump(" -> obj follows"); app.u.dump(obj);
				obj.uiClass = obj.uiClass ? obj.uiClass : 'error'; //error, highlight
				obj.uiIcon = obj.uiIcon ? obj.uiIcon : 'notice'
				}

//the zMessage class is added so that these warning can be cleared (either universally or within a selector).
			var r = "<div class='ui-widget appMessage clearfix'>";
			r += "<div class='ui-state-"+obj.uiClass+" ui-corner-all'>";
			r += "<div class='clearfix stdMargin'><span class='ui-icon ui-icon-"+obj.uiIcon+"'></span>"+obj.message+"<\/div>";
			r += "<\/div><\/div>";
			return r;
			},

/*

URI PARAM

*/


//pass in a name and if it is a parameter on the uri, the value is returned.
		getParameterByName : function(name)	{
			name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
			var regexS = "[\\?&]" + name + "=([^&#]*)";
			var regex = new RegExp(regexS);
			var results = regex.exec(window.location.href);
			if(results == null)
				return "";
			else
				return decodeURIComponent(results[1].replace(/\+/g, " "));
			},
//will create an object of a series of key/value pairs in URI format.
//if nothing is passed in, will get string directly from URL.
		getParametersAsObject : function(string)	{
//			app.u.dump("BEGIN control.u.getParametersAsObject");
//			app.u.dump(" -> string: "+string);
			var tmp = string ? string : location.search;
//			app.u.dump(" -> tmp: "+tmp);
			var url = tmp.split('#')[0]; //split at hash and only use relevant segment. otherwise last param is key:value#something
			var params = {};
//check for ? to avoid js error which results when no uri params are present
			if(string || url.indexOf('?') > 0)	{
				url = url.replace('?', '').replace(/&amp;/g, '&'); //uri may be encoded or not. normalize.
				url = decodeURIComponent(url);
//				app.u.dump(" -> URL after tweaking: "+url);
				if(app.u.isSet(url))	{
					var queries = url.split('&');
					for(var q in queries) {
						var param = queries[q].split('=');
						if(param[1])	{
							params[ param[0] ] = param[1].replace(/\+/g, " "); 
							}
						}
					}
				}
//			app.u.dump(" -> params: "); app.u.dump(params);
			return params;
			},




/*

AUTHENTICATION/USER

*/

//## allow for targetID to be passed in.
		logBuyerOut : function()	{
// ,'targetID':'logMessaging' was removed from the line below in 201239 to give more flexibility to apps. add a class of appMessaging to your app and the log will appear there.
			app.calls.authentication.buyerLogout.init({'callback':'showMessaging','message':'Thank you, you are now logged out'});
			app.calls.refreshCart.init({},'immutable');
			app.vars.cid = null; //nuke cid as it's used in the soft auth.
			app.model.dispatchThis('immutable');
			},
		
		thisIsAnAdminSession : function()	{
			//while technically this could be spoofed, the API wouldn't accept invalid values
			return (app.vars.deviceid && app.vars.userid && app.vars.authtoken) ? true : false;
			},


//pretty straightforward. If a cid is set, the session has been authenticated.
//if the cid is in the cart/local but not the control, set it. most likely this was a cart passed to us where the user had already logged in or (local) is returning to the checkout page.
//if no cid but email, they are a guest.
//if logged in via facebook, they are a thirdPartyGuest.
//this could easily become smarter to take into account the timestamp of when the session was authenticated.
			
			determineAuthentication : function(){
				var r = 'none';
				if(this.thisIsAnAdminSession())	{r = 'admin'}
//was running in to an issue where cid was in local, but user hadn't logged in to this session yet, so now both cid and username are used.
				else if(app.data.appBuyerLogin && app.data.appBuyerLogin.cid)	{r = 'authenticated'}
				else if(app.vars.cid && app.u.getUsernameFromCart())	{r = 'authenticated'}
				else if(app.model.fetchData('cartDetail') && app.data.cartDetail && app.data.cartDetail.customer && app.u.isSet(app.data.cartDetail.customer.cid))	{
					r = 'authenticated';
					app.vars.cid = app.data.cartDetail.customer.cid;
					}
//need to run third party checks prior to default 'guest' check because bill/email will get set for third parties
//and all third parties would get 'guest'
				else if(typeof FB != 'undefined' && !$.isEmptyObject(FB) && FB['_userStatus'] == 'connected')	{
					r = 'thirdPartyGuest';
//					app.thirdParty.fb.saveUserDataToSession();
					}
				else if(app.model.fetchData('cartDetail') && app.data.cartDetail && app.data.cartDetail.bill && app.data.cartDetail.bill.email)	{
					r = 'guest';
					}
				else	{
					//catch.
					}
//				app.u.dump('store_checkout.u.determineAuthentication run. authstate = '+r); 

				return r;
				},



//pass in a simple array and all the duplicates will be removed.
//handy for dealing with product lists created on the fly (like cart accessories)
		removeDuplicatesFromArray : function(arrayName)	{

			var newArray=new Array();
			label:for(var i=0; i<arrayName.length;i++ )	{  
				for(var j=0; j<newArray.length;j++ )	{
					if(newArray[j]==arrayName[i]) 
					continue label;
					}
				newArray[newArray.length] = arrayName[i];
				}
			return newArray;
			},


//used in checkout to populate username: so either login or bill/email will work.
//never use this to populate the value of an email form field because it may not be an email address.
//later, this could be expanded to include a facebook id.
		getUsernameFromCart : function()	{
//			app.u.dump('BEGIN u.getUsernameFromCart');
			var r = false;
			if(app.data.cartDetail.customer && app.u.isSet(app.data.cartDetail.customer.login))	{
				r = app.data.cartDetail.customer.login;
//				app.u.dump(' -> login was set. email = '+r);
				}
			else if(app.data.cartDetail.bill && app.u.isSet(app.data.cartDetail.bill.email)){
				r = app.data.cartDetail.bill.email;
//				app.u.dump(' -> bill/email was set. email = '+r);
				}
			else if(!jQuery.isEmptyObject(app.vars.fbUser))	{
//				app.u.dump(' -> user is logged in via facebook');
				r = app.vars.fbUser.email;
				}
			return r;
			},


/*

BROWSER/OS

*/


// .browser returns an object of info about the browser (name and version).
		getBrowserInfo : function()	{
			var r;
			var BI = jQuery.browser; //browser information. returns an object. will set 'true' for value of browser 
			jQuery.each(BI, function(i, val) {
				if(val === true){r = i;}
				});
			r += '-'+BI.version;
//			app.u.dump(' r = '+r);
			return r;
			},
			
		getOSInfo : function()	{

			var OSName="Unknown OS";
			if (navigator.appVersion.indexOf("Win")!=-1) OSName="WI";
			if (navigator.appVersion.indexOf("Mac")!=-1) OSName="MC";
			if (navigator.appVersion.indexOf("X11")!=-1) OSName="UN";
			if (navigator.appVersion.indexOf("Linux")!=-1) OSName="LI";
			return OSName;
			},


/*

TIME/DATE

*/

		ymdNow : function()	{
			function padStr(i) {
				return (i < 10) ? "0" + i : "" + i;
				}
			var temp = new Date();
			var dateStr = padStr(temp.getFullYear()) +
			padStr(1 + temp.getMonth()) +
			padStr(temp.getDate()) +
			padStr(temp.getHours()) +
			padStr(temp.getMinutes()) +
			padStr(temp.getSeconds());
			return dateStr;
			},
//current time in unix format. stop using this.
		unixNow : function()	{
			return Math.round(new Date().getTime()/1000.0)
			}, //unixnow
//very simple date translator. if something more sprmatecific is needed, create a custom function.
//will support a boolean for showtime, which will show the time, in addition to the date.
		unix2Pretty : function(unix_timestamp,showtime)	{
//			app.u.dump('BEGIN app.u.unix2Pretty');
//			app.u.dump(' -> tx = '+unix_timestamp);
			var date = new Date(Number(unix_timestamp)*1000);
			var r;
			r = app.u.jsMonth(date.getMonth());
			r += ' '+date.getDate();
			r += ', '+date.getFullYear();
			if(showtime)	{
				r += " ";
				r += date.getHours();
				r += ':'
				r += (date.getMinutes() < 10) ? "0"+date.getMinutes()  : date.getMinutes();
				}
			return r;
			},
		
		jsMonth : function(m)	{
			var month = new Array();
			month[0]="Jan.";
			month[1]="Feb.";
			month[2]="Mar.";
			month[3]="Apr.";
			month[4]="May";
			month[5]="June";
			month[6]="July";
			month[7]="Aug.";
			month[8]="Sep.";
			month[9]="Oct.";
			month[10]="Nov.";
			month[11]="Dec.";
			
			return month[m];
			},


/*

VALIDATION

*/
//used for validating strings only. checks to see if value is defined, not null, no false etc.
//returns value (s), if it has a value .
		isSet : function(s)	{
			var r;
			if(s == null || s == 'undefined' || s == '')
				r = false;
			else if(typeof s != 'undefined')
				r = s;
			else
				r = false;
			return r;
			}, //isSet

		numbersOnly : function(e)	{
			var unicode=e.charCode? e.charCode : e.keyCode
			// if (unicode!=8||unicode!=9)
			if (unicode<8||unicode>9)        {
				if (unicode<48||unicode>57) //if not a number
				return false //disable key press
				}
			},

		isValidEmail : function(str) {
			app.u.dump("BEGIN isValidEmail for: "+str);
			var r = true; //what is returned.
			if(!str || str == false)
				r = false;
			var at="@"
			var dot="."
			var lat=str.indexOf(at)
			var lstr=str.length
			var ldot=str.indexOf(dot)
			if (str.indexOf(at)==-1){
				app.u.dump(" -> email does not contain an @");
				r = false
				}
			if (str.indexOf(at)==-1 || str.indexOf(at)==0 || str.indexOf(at)==lstr){
				app.u.dump(" -> @ in email is in invalid location (first or last)");
				r = false
				}
			if (str.indexOf(dot)==-1 || str.indexOf(dot)==0 || str.indexOf(dot)==lstr){
				app.u.dump(" -> email does not have a period or it is in an invalid location (first or last)");
				r = false
				}
			if (str.indexOf(at,(lat+1))!=-1){
				app.u.dump(" -> email contains two @");
				r = false
				}
			if (str.substring(lat-1,lat)==dot || str.substring(lat+1,lat+2)==dot){
				app.u.dump(" -> email contains multiple periods");
				r = false
				}
			if (str.indexOf(dot,(lat+2))==-1){
				r = false
				}
			if (str.indexOf(" ")!=-1){
				r = false
				}
			app.u.dump("u.isValidEmail: "+r);
			return r;					
			}, //isValidEmail

//used frequently to throw errors or debugging info at the console.
//called within the throwError function too
		dump : function(msg)	{
//if the console isn't open, an error occurs, so check to make sure it's defined. If not, do nothing.
			if(typeof console != 'undefined')	{
				if(typeof console.dir == 'function' && typeof msg == 'object')	{
				//IE8 doesn't support console.dir.
					console.dir(msg);
					}
				else if(typeof console.dir == 'undefined' && typeof msg == 'object')	{
					//browser doesn't support writing object to console. probably IE8.
					console.log('object output not supported');
					}
				else
					console.log(msg);
				}
			}, //dump

//javascript doesn't have a great way of easily formatting a string as money.
//top that off with each browser handles some of these functions a little differently. nice.
	formatMoney : function(A, currencySign, decimalPlace,hideZero){
//		app.u.dump("BEGIN u.formatMoney");
		decimalPlace = isNaN(decimalPlace) ? decimalPlace : 2; //if blank or NaN, default to 2
		var r;
		var a = new Number(A);
		
		if(hideZero == true && (a * 1) == 0)	{
			r = '';
			}
		else	{
			
			var isNegative = false;
//only deal with positive numbers. makes the math work easier. add - sign at end.
//if this is changed, the a+b.substr(1) line later needs to be adjusted for negative numbers.
			if(a < 0)	{
				a = a * -1;
				isNegative = true;
				}
			
			var b = a.toFixed(decimalPlace); //get 12345678.90
//			app.u.dump(" -> b = "+b);
			a = parseInt(a); // get 12345678
			b = (b-a).toPrecision(decimalPlace); //get 0.90
			b = parseFloat(b).toFixed(decimalPlace); //in case we get 0.0, we pad it out to 0.00
			a = a.toLocaleString();//put in commas - IE also puts in .00, so we'll get 12,345,678.00
//			app.u.dump(" -> a = "+a);
			//if IE (our number ends in .00)
			if(a.indexOf('.00') > 0)	{
				a=a.substr(0, a.length-3); //delete the .00
//				app.u.dump(" -> trimmed. a. a now = "+a);
				}
			r = a+b.substr(1);//remove the 0 from b, then return a + b = 12,345,678.90

//if the character before the decimal is just a zero, remove it.
			if(r.split('.')[0] == 0){
				r = '.'+r.split('.')[1]
				}
			
//			app.u.dump(" -> r = "+r);
			if(currencySign)	{
				r = currencySign + r;
				}
			if(isNegative)
				r = "-"+r;
			}
		return r
		}, //formatMoney


/*
name is the image location/filename
a is an object.  ex:
"w":"300","h":"300","alt":"this is the alt text","name":"folder/filename","b":"FFFFFF"
supported attributes are:
w = width
h = height
b = bgcolor (used to pad if original image aspect ratio doesn't conform to aspect ratio passed into function. 
 -> use TTTTTT for transparent png (will result in larger file sizes)
class = css class
tag = boolean. Set to true to output the <img tag. set to false or blank to just get url

app.u.makeImage({"name":"","w":150,"h":150,"b":"FFFFFF","class":"prodThumb","tag":1});
*/
		makeImage : function(a)	{
		//	app.u.dump('W = '+a.w+' and H = '+a.h);

			a.lib = app.u.isSet(a.lib) ? a.lib : app.vars.username;  //determine protocol
			a.m = a.m ? 'M' : '';  //default to minimal mode off. If anything true value (not 0, false etc) is passed in as m, minimal is turned on.
//			app.u.dump(' -> library: '+a.lib+' and name: '+a.name);
			if(a.name == null) { a.name = 'i/imagenotfound'; }
			
			var url, tag;
			// alert(a.lib);		// uncomment then go into media library for some really wonky behavior 
		
		//default height and width to blank. setting it to zero or NaN is bad for IE.
			if(a.h == null || a.h == 'undefined' || a.h == 0)
				a.h = '';
			if(a.w == null || a.w == 'undefined' || a.w == 0)
				a.w = '';
			
			url = location.protocol === 'https:' ? 'https:' : 'http:';  //determine protocol
			url += '\/\/static.zoovy.com\/img\/'+a.lib+'\/';
		
			if((a.w == '') && (a.h == ''))
				url += '-';
			else	{
				if(a.w)	{
					url += 'W'+a.w+'-';
					}
				if(a.h)	{
					url += 'H'+a.h+'-';
					}
				if(a.b)	{
					url += 'B'+a.b+'-';
					}
				url += a.m;
				}
			if(url.charAt(url.length-1) == '-')	{
				url = url.slice(0,url.length-1); //strip trailing - because it isn't stricly 'compliant' with media lib specs.
				}
			url += '\/'+a.name;
		
		//		app.u.dump(url);
			
			if(a.tag == true)	{
				a['class'] = typeof a['class'] == 'string' ? a['class'] : ''; //default class to blank
				a['id'] = typeof a['id'] == 'string' ? a['id'] : 'img_'+a.name; // default id to filename (more or less)
				a['alt'] = typeof a['alt'] == 'string' ? a['alt'] : a.name; //default alt text to filename
				var tag = "<img src='"+url+"' alt='"+a.alt+"' id='"+a['id']+"' class='"+a['class']+"' \/>";
				return tag;
				}
			else	{
				return url;
				}
			}, //makeImage





//simple text truncate. doesn't handle html tags.
//t = text to truncate. len = # chars to truncate to (100 = 100 chars)
		truncate : function(t,len)	{
			var r;
			if(!t){r = false}
			else if(!len){r = false}
			else if(t.length <= len){r = t}
			else	{
				var trunc = t;
				if (trunc.length > len) {
/* Truncate the content of the string, then go back to the end of the
previous word to ensure that we don't truncate in the middle of
a word */
					trunc = trunc.substring(0, len);
					trunc = trunc.replace(/\w+$/, '');
		
/* Add an ellipses to the end*/
					trunc += '...';
					r = trunc;
					}
				}
				return r;
			}, //truncate


//used in prodDataInModal and imageInModal
//if a parentid is not passed in, a new id is created and added to the dom.
//ID is the element ID
		handleParentForDialog : function(ID,title)	{
			var $parent; //will either be a jquery object or false (if no parentID specified)
			if(ID)	{
				title = title || "";
				$parent = $('#'+ID);
//if the parent doesn't already exist, add it to the dom.
				if($parent.length == 0)	{
					$parent = $("<div \/>").attr({"id":ID,"title":title}).appendTo(document.body);
					}
				}
			else	{
				app.u.dump("WARNING! no ID specified in handleParentForDialog");
				$parent = false;
				}
			return $parent;
			}, //handleParentForDialog

		makeSafeHTMLId : function(string)	{
//			app.u.dump("BEGIN control.u.makesafehtmlid");
//			app.u.dump("string: "+string);
			var r = false;
			if(typeof string == 'string')	{
				r = string.replace(/[^a-zA-Z 0-9 - _]+/g,'');
				}
			return r;
			}, //makeSafeHTMLId

		jqSelector : function(selector,str){
			if (undefined == str) { str = new String(""); }	// fix undefined issue
			return ((selector) ? selector : '')+str.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
			},


		isValidMonth : function(val)	{
			var valid = true;
			if(isNaN(val)){valid = false}
			else if(!app.u.isSet(val)){valid = false}
			else if(val > 12){valid = false}
			else if(val <= 0){valid = false} //val starts at 1, so zero is not a valid entry
			return valid;
			}, //isValidMonth

		isValidCCYear : function (val)	{
			var valid = true;
			if(isNaN(val)){valid = false}
			else if(val == 0){valid = false} //make sure 0000 is not entered.
			else if(val.length != 4){valid = false}
			return valid;
			}, //isValidCCYear

		getCCExpYears : function (focusYear)	{
			var date = new Date();
			var year = date.getFullYear();
			var thisYear; //this year in the loop.
			var r = '';
			for(var i = 0; i < 11; i +=1)	{
				thisYear = year + i;
				r += "<option value='"+(thisYear)+"' id='ccYear_"+(thisYear)+"' ";
				if(focusYear*1 == thisYear)
					r += " selected='selected' ";
				r += ">"+(thisYear)+"</option>";
				}
			return r;
			}, //getCCYears

		getCCExpMonths : function(focusMonth)	{
			var r = "";
			var month=new Array(12);
			month[1]="01";
			month[2]="02";
			month[3]="03";
			month[4]="04";
			month[5]="05";
			month[6]="06";
			month[7]="07";
			month[8]="08";
			month[9]="09";
			month[10]="10";
			month[11]="11";
			month[12]="12";
			for(var i = 1; i < 13; i += 1)	{
				r += "<option value='"+i+"' id='ccMonth_"+i+"' ";
				if(i == focusMonth)
					r += "selected='selected'";
				r += ">"+month[i]+"</option>";
				}
			return r;				
			},



/* This script and many more are available free online at
The JavaScript Source!! http://javascript.internet.com
Created by: David Leppek :: https://www.azcode.com/Mod10

Basically, the alorithum takes each digit, from right to left and muliplies each second
digit by two. If the multiple is two-digits long (i.e.: 6 * 2 = 12) the two digits of
the multiple are then added together for a new number (1 + 2 = 3). You then add up the 
string of numbers, both unaltered and new values and get a total sum. This sum is then
divided by 10 and the remainder should be zero if it is a valid credit card. Hense the
name Mod 10 or Modulus 10. */
		isValidCC : function (ccNumb) {  // v2.0
			var valid = "0123456789"  // Valid digits in a credit card number
			var len = ccNumb.length;  // The length of the submitted cc number
			var iCCN = parseInt(ccNumb);  // integer of ccNumb
			var sCCN = ccNumb.toString();  // string of ccNumb
			sCCN = sCCN.replace (/^\s+|\s+$/g,'');  // strip spaces
			var iTotal = 0;  // integer total set at zero
			var bNum = true;  // by default assume it is a number
			var bResult = false;  // by default assume it is NOT a valid cc
			var temp;  // temp variable for parsing string
			var calc;  // used for calculation of each digit
		
			// Determine if the ccNumb is in fact all numbers
			for (var j=0; j<len; j++) {
				temp = "" + sCCN.substring(j, j+1);
				if (valid.indexOf(temp) == "-1"){bNum = false;}
				}
		
			// if it is NOT a number, you can either alert to the fact, or just pass a failure
			if(!bNum){
				/*alert("Not a Number");*/bResult = false;
				}
		
		// Determine if it is the proper length 
			if((len == 0)&&(bResult)){  // nothing, field is blank AND passed above # check
				bResult = false;
				}
			else	{  // ccNumb is a number and the proper length - let's see if it is a valid card number
				if(len >= 15){  // 15 or 16 for Amex or V/MC
					for(var i=len;i>0;i--){  // LOOP throught the digits of the card
						calc = parseInt(iCCN) % 10;  // right most digit
						calc = parseInt(calc);  // assure it is an integer
						iTotal += calc;  // running total of the card number as we loop - Do Nothing to first digit
						i--;  // decrement the count - move to the next digit in the card
						iCCN = iCCN / 10;                               // subtracts right most digit from ccNumb
						calc = parseInt(iCCN) % 10 ;    // NEXT right most digit
						calc = calc *2;                                 // multiply the digit by two
		// Instead of some screwy method of converting 16 to a string and then parsing 1 and 6 and then adding them to make 7,
		// I use a simple switch statement to change the value of calc2 to 7 if 16 is the multiple.
						switch(calc){
							case 10: calc = 1; break;       //5*2=10 & 1+0 = 1
							case 12: calc = 3; break;       //6*2=12 & 1+2 = 3
							case 14: calc = 5; break;       //7*2=14 & 1+4 = 5
							case 16: calc = 7; break;       //8*2=16 & 1+6 = 7
							case 18: calc = 9; break;       //9*2=18 & 1+8 = 9
							default: calc = calc;           //4*2= 8 &   8 = 8  -same for all lower numbers
							}                                               
						iCCN = iCCN / 10;  // subtracts right most digit from ccNum
						iTotal += calc;  // running total of the card number as we loop
						}  // END OF LOOP
					if ((iTotal%10)==0){  // check to see if the sum Mod 10 is zero
						bResult = true;  // This IS (or could be) a valid credit card number.
						}
					else {
						bResult = false;  // This could NOT be a valid credit card number
						}
					}
				}
			return bResult; // Return the results
			}, //isValidCC

// http://blog.stevenlevithan.com/archives/validate-phone-number
		isValidPhoneNumber : function(phoneNumber,country)	{
//			app.u.dump('BEGIN app.u.isValidPhoneNumber. phone = '+phoneNumber);
			var r;

//if country is undefinded, treat as domestic.
			if(country == 'US' || !country)	{
				var regex = /^(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
				r = regex.test(phoneNumber)
				}
//international.
			else	{
//this regex is no good.
//				var regex = /^\+(?:[0-9] ?){6,14}[0-9]$/;
					r = phoneNumber ? true : false;
				}

			
//			app.u.dump("regex.text ="+r);
			
			return r;
			},

		//found here: http://www.blog.zahidur.com/usa-and-canada-zip-code-validation-using-javascript/
		 isValidPostalCode : function(postalCode,countryCode) {
			 app.u.dump("BEGIN app.u.isValidPostalCode. countryCode: "+countryCode);
			var postalCodeRegex;
			switch (countryCode) {
				case "US":
					postalCodeRegex = /^([0-9]{5})(?:[-\s]*([0-9]{4}))?$/;
					break;
				case "CA":
					postalCodeRegex = /^([a-zA-Z][0-9][a-zA-Z])\s*([0-9][a-zA-Z][0-9])?$/;
					break;
				default:
					postalCodeRegex = /^(?:[A-Z0-9]+([- ]?[A-Z0-9]+)*)?$/;
				}
			return postalCodeRegex.test(postalCode);
			}, //isValidPostalCode


/*
executed during control init. 
for now, all it does is save the facebook user data as needed, if the user is authenticated.
later, it will handle other third party plugins as well.
*/
		handleThirdPartyInits : function()	{
//			app.u.dump("BEGIN app.u.handleThirdPartyInits");
//initial init of fb app.
			if(typeof zGlobals !== 'undefined' && zGlobals.thirdParty.facebook.appId && typeof FB !== 'undefined')	{
//				app.u.dump(" -> facebook appid set. load user data.");
				FB.init({appId:zGlobals.thirdParty.facebook.appId, cookie:true, status:true, xfbml:true});
				app.thirdParty.fb.saveUserDataToSession();
				}
			else	{
//				app.u.dump(" -> did not init FB app because either appid isn't set or FB is undefined ("+typeof FB+").");
				}
//			app.u.dump("END app.u.handleThirdPartyInits");
			},

//executed inside handleTHirdPartyInits as well as after a facebook login.
//

		//cart must already be in memory when this is run.
//will tell you which third party checkouts are available. does NOT look to see if merchant has them enabled,
// just checks to see if the cart contents would even allow it.
//currently, there is only a google field for disabling their checkout, but this is likely to change.
			which3PCAreAvailable :	function(){
//				app.u.dump("BEGIN control.u.which3PCAreAvailable");
				var obj = {};
				obj.paypalec = true;
				obj.amazonpayment = true;
				obj.googlecheckout = true;
				
				var L = app.data.cartDetail['@ITEMS'].length;
				for(var i = 0; i < L; i += 1)	{
					if(app.data.cartDetail['@ITEMS'][i]['%attribs']['gc:blocked'])	{obj.googlecheckout = false}
					if(app.data.cartDetail['@ITEMS'][i]['%attribs']['paypalec:blocked'])	{obj.paypalec = false}
					}

				return obj;
				},


//Removing all ID's. Using this in UI. will update checkout to use this too once 201248+ released. 201248 is used by 1PC and it's xmas time
//The names are also updated to use the new two char codes used by the paymentQ.
			getSupplementalPaymentInputs2 : function(paymentID,data)	{
//				app.u.dump("BEGIN control.u.getSupplementalPaymentInputs ["+paymentID+"]");
//				app.u.dump(" -> data:"); app.u.dump(data);
				var $o = $(); //what is returned. a jquery object (ul) w/ list item for each input of any supplemental data.
				$o = $("<div />").addClass("paybySupplemental").attr('data-ui-supplemental',paymentID);
				var safeid = ''; //used in echeck loop. recycled in loop.
				var tmp = ''; //tmp var used to put together string of html to append to $o
				switch(paymentID)	{
	//for credit cards, we can't store the # or cid in local storage. Save it in memory so it is discarded on close, reload, etc
	//expiration is less of a concern
					case 'PAYPALEC' :
					//paypal supplemental is used for some messaging (select another method or change due to error). leave this here.
						break;

					case 'CREDIT':
						tmp += "<label>Credit Card # <input type='text' size='20' name='CC' value='"+(data['CC'] || "")+"' onKeyPress='return app.u.numbersOnly(event);' /><\/label>";
//two selects inside a label behaved badly, so  div is used for the container on this row.
						tmp += "<div>Expiration <select name='MM'><option><\/option>";
						tmp += app.u.getCCExpMonths(data['MM']);
						tmp += "<\/select>";
						tmp += "<select name='YY'><option value=''><\/option>"+app.u.getCCExpYears(data['YY'])+"<\/select><\/div>";
						tmp += "<label>CVV/CID <input type='text' size='8' name='CV' onKeyPress='return app.u.numbersOnly(event);' value='" + (data['CV'] || "") + "'  /> <span class='ui-icon ui-icon-help pointer' onClick=\"$('#cvvcidHelp').dialog({'modal':true,height:400,width:550});\"></span><\/label>";
						break;

					case 'PO':
						tmp += "<label>PO #<input type='text' size='15' name='PO' class=' purchaseOrder' value='"+ (data['PO'] || "") +"' /><\/label>";
						break;

					case 'ECHECK':
						var echeckFields = {"EA" : "Account #","ER" : "Routing #","EN" : "Account Name","EB" : "Bank Name","ES" : "Bank State","EI" : "Check #"}
						for(var key in echeckFields) {
							safeid = app.u.makeSafeHTMLId(key);
							tmp += "<label>"+echeckFields[key]+"<input type='text' size='15' name='"+key+"' value='" + (data[key] || "") + "' /><\/label>";
							}
						break;
					default:
//if no supplemental material is present, return false. That'll make it easy for any code executing this to know if there is additional inputs or not.
						$o = false; //return false if there is no supplemental fields
					}
				if($o != false)	{$o.append(tmp)} //put the li contents into the ul for return.
				return $o;
				},


// This function is in the controller so that it can be kept fairly global. It's used in checkout, store_crm (buyer admin) and will likely be used in admin (orders) at some point.
// ### NOTE! SANITY ! WHATEVER - app.ext.convertSessionToOrder.vars is referenced below. When this is removed, make sure to update checkouts to add an onChange event to update the app.ext.convertSessionToOrder.vars object because otherwise the CC number won't be in memory and possibly won't get sent as part of calls.cartOrderCreate.

			getSupplementalPaymentInputs : function(paymentID,data)	{
//				app.u.dump("BEGIN control.u.getSupplementalPaymentInputs ["+paymentID+"]");
//				app.u.dump(" -> data:"); app.u.dump(data);
				var $o; //what is returned. a jquery object (ul) w/ list item for each input of any supplemental data.
				$o = $("<ul />").attr("id","paybySupplemental_"+paymentID).addClass("paybySupplemental");
				var safeid = ''; //used in echeck loop. recycled in loop.
				var tmp = ''; //tmp var used to put together string of html to append to $o
				switch(paymentID)	{
	//for credit cards, we can't store the # or cid in local storage. Save it in memory so it is discarded on close, reload, etc
	//expiration is less of a concern
					case 'PAYPALEC' :
					//paypal supplemental is used for some messaging (select another method or change due to error). leave this here.
						break;
					case 'CREDIT':
						tmp += "<li><label for='payment-cc'>Credit Card #<\/label><input type='text' size='20' name='payment/CC' id='payment-cc' class=' creditCard' value='";
						if(data['payment/CC']){tmp += data['payment/CC']}
						tmp += "' onKeyPress='return app.u.numbersOnly(event);' /><\/li>";
						
						tmp += "<li><label>Expiration<\/label><select name='payment/MM' id='payment-mm' class='creditCardMonthExp' required='required'><option><\/option>";
						tmp += app.u.getCCExpMonths(data['payment/MM']);
						tmp += "<\/select>";
						tmp += "<select name='payment/YY' id='payment-yy' class='creditCardYearExp'  required='required'><option value=''><\/option>"+app.u.getCCExpYears(data['payment/YY'])+"<\/select><\/li>";
						
						tmp += "<li><label for='payment/CV'>CVV/CID<\/label><input type='text' size='8' name='payment/CV' id='payment-cv' class=' creditCardCVV' onKeyPress='return app.u.numbersOnly(event);' value='";
						if(data['payment/CV']){tmp += data['payment/CV']}
						tmp += "'  required='required' /> <span class='ui-icon ui-icon-help' onClick=\"$('#cvvcidHelp').dialog({'modal':true,height:400,width:550});\"></span><\/li>";
						break;
	
					case 'PO':
						tmp += "<li><label for='payment-po'>PO #<\/label><input type='text' size='2' name='payment/PO' id='payment-po' class=' purchaseOrder' onChange='app.calls.cartSet.init({\"payment/PO\":this.value});' value='";
						if(data['payment/PO'])
								tmp += data['payment/PO'];
						tmp += "' /><\/li>";
						break;
	
					case 'ECHECK':
						var echeckFields = {"payment/EA" : "Account #","payment/ER" : "Routing #","payment/EN" : "Account Name","payment/EB" : "Bank Name","payment/ES" : "Bank State","payment/EI" : "Check #"}
						for(var key in echeckFields) {
							safeid = app.u.makeSafeHTMLId(key);
//the info below is added to the pdq but not immediately dispatched because it is low priority. this could be changed if needed.
//The field is required in checkout. if it needs to be optional elsewhere, remove the required attribute in that code base after this has rendered.
							tmp += "<li><label for='"+safeid+"'>"+echeckFields[key]+"<\/label><input type='text' size='2' name='"+key+"' id='"+safeid+"' class=' echeck'  value='";
//if the value for this field is set in the data object (cart or invoice), set it here.
							if(data[key])
								tmp += data[key];
							tmp += "' /><\/li>";
							}
						break;
					default:
//if no supplemental material is present, return false. That'll make it easy for any code executing this to know if there is additional inputs or not.
						$o = false; //return false if there is no supplemental fields
					}
				if($o != false)	{$o.append(tmp)} //put the li contents into the ul for return.
				return $o;
//				app.u.dump(" -> $o:");
//				app.u.dump($o);
			}



/*			
,
getAllDataAttributes : function(node)	{
			var d = {}, re_dataAttr = /^data\-(.+)$/;
			jQuery.each(node.get(0).attributes, function(index, attr) {
				if (re_dataAttr.test(attr.nodeName)) {
					var key = attr.nodeName.match(re_dataAttr)[1];
					d[key] = attr.nodeValue;
					}
				});
			return d;
			}
*/
		}, //util





					////////////////////////////////////   RENDERFUNCTIONS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



/*
A note about templates and rendering them...

In some cases, it is necessary to create a template placeholder and to populate it at a later time, such as in product lists, for example.
the data for some product may be available instantly, but others may have to be requested. so the placeholder is created to preserve display order.

In other cases, we know the data is present and it makes more sense to create, translate and add to dom all at once.

when placeholders are needed, execute a createTemplateInstance first and then once the data is retrieved, execute translateTemplate.
If everything is being done at once, execute transmogrify.

WARNING - if transmogrify is used, then show, toggle and hide jquery functions don't work right when modifying $tag in a renderFormat in IE. 
I believe this to be because $tag isn't in the DOM yet. I solved by adding/removing a class to handle show/hide.

*/


	renderFunctions : {
/*

$('target').html(app.renderFunctions.transmogrify(eleAttr,templateID,data));  or jQuery.append() depending on need.
either way, what's returned from this function is a fully translated jquery object of the template.

if eleAttr is a string, that's the ID to be added to the template.  If the eleAttr is an object, it's a list of data attributes to be added to the template. this allows for things like data-pid or data-orderid to be set, which is handy for onClicks and such. pass in as {'pid':'productid'} and it'll be translated to data-pid='productid'

transmogrify wants eleAttr passed in without data- on any of the keys.
createTemplateInstance wants it WITH data- (legacy).

will want to migrate createTemplate to NOT have it passed in and add it manually, for now.
Then we'll be in a better place to use data() instead of attr().

*/
		transmogrify : function(eleAttr,templateID,data)	{
//			app.u.dump("BEGIN control.renderFunctions.transmogrify (tid: "+templateID+")");
//			app.u.dump(eleAttr);

//If a template ID is specified but does not exist, try to make one. added 2012-06-12
			if(templateID && !app.templates[templateID])	{
				var tmp = $('#'+templateID);
				if(tmp.length > 0)	{
					app.model.makeTemplate(tmp,templateID);
					}
				else{} //do nothing. Error will get thrown later.
				}
//			app.u.dump(" -> got past templateID");
			if(!templateID || typeof data != 'object' || !app.templates[templateID])	{
//product lists get rendered twice, the first time empty and always throw this error, which clutters up the console, so they're suppressed.
				app.u.dump(" -> templateID ["+templateID+"] is not set or not an object ["+typeof app.templates[templateID]+"] or typeof data ("+typeof data+") not object.");
				if(typeof eleAttr == 'string'){app.u.dump(" -> ID: "+eleAttr)} else {app.u.dump(" -> ID: "+eleAttr.id)}

//				app.u.dump(eleAttr);
				}
			else	{
//we have everything we need. proceed.

var $r = app.templates[templateID].clone(); //clone is always used so original is 'clean' each time it's used. This is what is returned.
$r.attr('data-templateid',templateID); //note what templateID was used. handy for troubleshooting or, at some point, possibly re-rendering template
if(app.u.isSet(eleAttr) && typeof eleAttr == 'string')	{
//	app.u.dump(' -> eleAttr is a string.');
	$r.attr('id',app.u.makeSafeHTMLId(eleAttr))  
	}
else if(typeof eleAttr == 'object')	{
//	app.u.dump(' -> eleAttr is an object.');
	for(var index in eleAttr)	{
		if(typeof eleAttr[index] == 'object')	{
			//can't output an object as a string. later, if/when data() is used, this may be supported.
			}
		else	{
			$r.attr('data-'+index,eleAttr[index]) //for now, this is being added via attr data-. later, it may use data( but I want it in the DOM for now.
			} 
		}
	if(eleAttr.id)	{$r.attr('id',app.u.makeSafeHTMLId(eleAttr.id))} //override the id with a safe id, if set.
	}
//app.u.dump("GOT HERE");
return this.handleTranslation($r,data);


				}
			}, //transmogrify
		
/*		
templateID should be set in the view or added directly to app.templates. 
eleAttr is optional and allows for the instance of this template to have a unique id. used in 'lists' like results.
eleAttr was expanded to allow for an object. 
currently, id, pid and catsafeid are supported. These are added to the parent element as either id or data-pid or data-catsafeid
most likely, this will be expanded to support setting other data- attributes. ###
*/
		createTemplateInstance : function(templateID,eleAttr)	{
//			app.u.dump('BEGIN app.renderFunctions.createTemplateInstance. ');
//			app.u.dump(' -> templateID: '+templateID);
//creates a copy of the template.
			var r;
//if a templateID is passed, but no template exists, try to create one.
			if(templateID && !app.templates[templateID])	{
				var tmp = $('#'+templateID);
				if(tmp.length > 0)	{
					app.u.dump("WARNING! template ["+templateID+"] did not exist. Matching element found in DOM and used to create template.");
					app.model.makeTemplate(tmp,templateID);
					}
				}
				
			if(templateID && app.templates[templateID])	{
				r = app.templates[templateID].clone();
				
				if(typeof eleAttr == 'string')	{r.attr('id',app.u.makeSafeHTMLId(eleAttr))}
				else if(typeof eleAttr == 'object')	{
//an attibute will be set for each. {data-pid:PID} would output data-pid='PID'
					for(var index in eleAttr)	{
						r.attr('data-'+index,eleAttr[index])
						}
				//override the id with a safe id, if set.
					if(eleAttr.id)	{
						r.attr('id',app.u.makeSafeHTMLId(eleAttr.id));
						}
					}
				r.attr('data-templateid',templateID); //used by translateTemplate to know which template was used..
				}
			else	{
				app.u.dump(" -> ERROR! createTemplateInstance -> templateID ["+templateID+"] not specified or does not exist[ "+typeof app.templates[templateID]+"]! eleAttr = "+eleAttr);
				r = false;
				}

			return r;
			}, //createTemplateInstance


//allows translation by selector and does NOT require a templateID. This is very handy for translating after the fact.
		translateSelector : function(selector,data)	{
//			app.u.dump("BEGIN controller.renderFunctions.translateSelector");
//			app.u.dump(" -> selector: "+selector);
//			app.u.dump(data);
			if(!$.isEmptyObject(data) && selector)	{
//				app.u.dump(" -> executing handleTranslation. $(selector).length: "+$(selector).length);
				this.handleTranslation(typeof selector == 'object' ? selector : $(selector),data); //selector can be a string or a jquery object.
				}
			else	{
				app.u.dump("WARNING! - either selector ["+selector+"] or data [typeof: "+typeof data+"] was not set in translateSelector");
				}
			},



//NEVER call this function directly.  It gets executed in transmogrify and translate element. it has no error handling (gets handled in parent function)
		handleTranslation : function($r,data)	{
//app.u.dump("BEGIN app.renderFunctions.handleTranslation");
//locates all children/grandchildren/etc that have a data-bind attribute within the parent id.
$r.find('[data-bind]').each(function()	{
										   
	var $focusTag = $(this);
	var value;

//	app.u.dump(' -> data-bind match found: '+$focusTag.data('bind'));
//proceed if data-bind has a value (not empty).
	if(app.u.isSet($focusTag.attr('data-bind'))){
		var bindData = app.renderFunctions.parseDataBind($focusTag.attr('data-bind'))  
//		app.u.dump(" -> bindData.var: "+bindData['var']);

//in some cases, it's necessary to pass the entire data object into the renderFormat. admin_orders paymentActions renderFormat is a good example. Most likely this will be used frequently in admin, in conjunction with processList renderFormat.
		if(bindData.useParentData)	{
			value = data; 
			}
		else	{
			if(bindData['var'])	{
				value = app.renderFunctions.getAttributeValue(bindData['var'],data);  //set value to the actual value
				}
			if(!app.u.isSet(value) && bindData.defaultVar)	{
				value = app.renderFunctions.getAttributeValue(bindData['defaultVar'],data);
	//					app.u.dump(' -> used defaultVar because var had no value. new value = '+value);
				}
			if(!app.u.isSet(value) && bindData.defaultValue)	{
				value = bindData['defaultValue']
//				app.u.dump(' -> used defaultValue ("'+bindData.defaultValue+'") because var had no value.');
				}
			}
		
		
		}
	if(bindData.hideZero == 'false') {bindData.hideZero = false} //passed as string. treat as boolean.
// SANITY - value should be set by here. If not, likely this is a null value or isn't properly formatted.
//	app.u.dump(" -> value: "+value);

	if(Number(value) == 0 && bindData.hideZero)	{
//do nothing. value is zero and zero should be skipped.
		}
// ### NOTE - at some point, see if this code can be moved inot the render format itself so that no special handler needs to exist.
//did a quick try on this that failed. Need to revisit this when time permits.
	else if(bindData.loadsTemplate && bindData.format == 'loadsTemplate')	{
//in some cases, especially in the UI, we load another template that's shared, such as fileImport in admin_medialib extension
//in this case, the original data is passed through and no format translation is done on the element itself.
// OR, if a var is specified, then only that object within the parent data is passed.
//Examples:
// -> admin_tasks uses loadsTemplate with NO var to recycle 'create' template for editing.
// -> admin_orders uses a var to take advantage of 1 address template for billing and shipping. 
		if(bindData['var'])	{
			$focusTag.append(app.renderFunctions.transmogrify({},bindData.loadsTemplate,data[app.renderFunctions.parseDataVar(bindData['var'])]));
			}
		else{
			$focusTag.append(app.renderFunctions.transmogrify({},bindData.loadsTemplate,data));
			}
		
		}
	else if(value)	{
		if(app.u.isSet(bindData.className)){$focusTag.addClass(bindData.className)} //css class added if the field is populated. If the class should always be there, add it to the template.

		if(app.u.isSet(bindData.format)){
//the renderFunction could be in 1 of 2 places, so it's saved to a local var so it can be used as a condition before executing itself.
			var renderFunction; //saves a copy of the renderFunction to a local var.
			if(bindData.extension && app.ext[bindData.extension] && typeof app.ext[bindData.extension].renderFormats == 'object' && typeof app.ext[bindData.extension].renderFormats[bindData.format] == 'function')	{
				renderFunction = app.ext[bindData.extension].renderFormats[bindData.format];
				}
			else if(typeof app.renderFormats[bindData.format] == 'function'){
				renderFunction = app.renderFormats[bindData.format];
				}
			else	{
				app.u.dump("WARNING! unrecognized render format: "+bindData.format);
				}

			if(typeof renderFunction == 'function')	{
				renderFunction($focusTag,{"value":value,"bindData":bindData});
				if(bindData.pretext)	{$focusTag.prepend(bindData.pretext)} //used for text
				if(bindData.posttext) {$focusTag.append(bindData.posttext)}
				if(bindData.before) {$focusTag.before(bindData.before)} //used for html
				if(bindData.after) {$focusTag.after(bindData.after)}
				if(bindData.wrap) {$focusTag.wrap(bindData.wrap)}
				}
			else	{
				app.u.throwMessage("Uh Oh! An error occured. error: "+bindData.format+" is not a function. (See console for more details.)");
				app.u.dump(" -> "+bindData.format+" is not a function. extension = "+bindData.extension);
//						app.u.dump(bindData);
				}
//					app.u.dump(' -> custom display function "'+bindData.format+'" is defined');
			
			}
		}
	else	{
		// attribute has no value.
//				app.u.dump(' -> data-bind is set, but it has no/invalid value.');
		if($focusTag.prop('tagName') == 'IMG'){$focusTag.remove()} //remove empty/blank images from dom. necessary for IE.

		}
	value = ''; //reset value.
	}); //end each for children.
$r.removeClass('loadingBG');
//		app.u.dump('END translateTemplate');
return $r;			
			
			},


//each template may have a unique set of required parameters.
/*

*/
		translateTemplate : function(data,target)	{
//		app.u.dump('BEGIN translateTemplate (target = '+target+')');
		var safeTarget = app.u.makeSafeHTMLId(target); //jquery doesn't like special characters in the id's.
		
		var $divObj = $('#'+safeTarget); //jquery object of the target tag. template was already rendered to screen using createTemplate.
		if($divObj.length > 0)	{
			var templateID = $divObj.attr('data-templateid'); //always use all lowercase for data- attributes. browser compatibility.
			var dataObj = $divObj.data();
//yes, i wish I'd commented why this is here. jt. appears to be for preserving data() already set prior to re-rendering a template.
			if(dataObj)	{dataObj.id = safeTarget}
			else	{dataObj = safeTarget;}
//believe the 'replace' to be causing a lot of issues. changed in 201239 build
//			var $tmp = app.renderFunctions.transmogrify(dataObj,templateID,data);
//			$('#'+safeTarget).replaceWith($tmp);
			this.handleTranslation($('#'+safeTarget),data)
			}
		else	{
			app.u.dump("WARNING! attempted to translate an element that isn't on the DOM. ["+safeTarget+"]");
			}
		
//		app.u.dump('END translateTemplate');
		}, //translateTemplate
		
//pass in product(zoovy:prod_name) zoovy:prod_name is returned.
//used in template creation and also in some UI stuff, like product finder.
		parseDataVar : function(v)	{
			var r; //what is returned.
			r = v.replace(/.*\(|\)/gi,'');
			return r;
			},


//as part of the data-bind is a var: for the data location (product: or cart:).
//this is used to parse that to get to the data.
//if no namespace is passed (zoovy: or user:) then the 'root' of the object is used.
//%attribs is passed in a cart spec because that's where the data is stored.
		getAttributeValue : function(v,data)	{
//app.u.dump('BEGIN app.renderFunctions.getAttributeValue');
			if(!v || !data)	{
				value = false;
				}
			else	{
//				app.u.dump(' -> attribute info and data are both set.');

				var value;
				var attributeID = this.parseDataVar(v); //used to store the attribute id (ex: zoovy:prod_name), not the actual value.
				var namespace = v.split('(')[0];

				if(namespace == 'product' && attributeID.indexOf(':') > -1)	{
					attributeID = '%attribs.'+attributeID; //product data is nested, but to keep templates clean, %attribs isn't required.
					value = app.u.getObjValFromString(attributeID,data,'.') || data[attributeID]; //attempt to set value based on most common paths
					}
				else if(namespace == 'cart' || namespace == 'order')	{
//					app.u.dump(v);
					value = app.u.getObjValFromString(attributeID,data,'/') || data[attributeID]; //attempt to set value based on most common paths
//					if(v == 'order(ship)')	{app.u.dump(" !!!!!!!!!! v = "); app.u.dump(value);}
					}
				else	{
					value = app.u.getObjValFromString(attributeID,data,'.') || data[attributeID]; //attempt to set value based on most common paths
					}
				}
			return value;
			},

//this parses the 'css-esque' format of the data-bind.  It's pretty simple (fast) but will not play well if a : or ; is in any of the values.
//css can be used to add or remove those characters for now.
//will convert key/value pairs into an object.
		parseDataBind : function(data)	{
//			app.u.dump('BEGIN parseDataBind');
			var rule = {};
			if(data)	{
				var declarations = data.split(';');
				declarations.pop(); //the ending ; causes the last entry to be blank. this removes it. also means the data bind MUST end in a ;
				var len = declarations.length;
				for (var i = 0; i < len; i++)	{
					var loc = declarations[i].indexOf(':'); //splits at first :. this may mean : in the values is okay. test.
//remove whitespace from property otherwise could get invalid 'key'.
					var property = jQuery.trim(declarations[i].substring(0, loc)); 
//					var value = jQuery.trim(declarations[i].substring(loc + 1));  //commented out 12/15/12. may want a space in the value.
					var value = declarations[i].substring(loc + 1);
//						app.u.dump(' -> property['+i+']: '+property);
//						app.u.dump(' -> value['+i+']: "'+value+'"');
					if (property != "" && value != "")	{
//						rule[property] = value;
//need to trim whitespace from values except pre and post text. having whitespace in the value causes things to not load. However, it's needed in pre and post text.
						rule[property] = (property != 'pretext' && property != 'posttext') ? jQuery.trim(value) : value; 
						}
					}
				}

//			app.u.dump('END parseDataBind');
			return rule;
			}


	
		}, //renderFunctions



					////////////////////////////////////   renderFormats    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


	renderFormats : {

		imageURL : function($tag,data){
//				app.u.dump('got into displayFunctions.image: "'+data.value+'"');
			data.bindData.bgcolor = data.bindData.bgcolor || 'ffffff'
//			app.u.dump(" -> width: "+$tag.width());
			if(data.value)	{
//set some recommended/required params.
				data.bindData.name = data.value;
				data.bindData.w = $tag.attr('width');
				data.bindData.h = $tag.attr('height');
				data.bindData.tag = 0;
				$tag.attr('src',app.u.makeImage(data.bindData)); //passing in bindData allows for using
				}
			else	{
				$tag.css('display','none'); //if there is no image, hide the src. 
				}
			}, //imageURL



		stuffList : function($tag,data)	{
//			app.u.dump("BEGIN renderFormat.stuffList");
			var L = data.value.length;
			var templateID = data.bindData.loadsTemplate;
			var stid; //recycled. used as a short cut in the loop for each items stid when in focus.
			var $o; // what is appended to tag.  saved to iterim var so changes can occur, if needed (locking form fields for coupons, for example)
			var parentID = $tag.attr('id') || "stufflist_"+app.u.guidGenerator().substring(0,10)
			for(var i = 0; i < L; i += 1)	{
				stid = data.value[i].stid;
//				app.u.dump(" -> STID: "+stid);
				$o = app.renderFunctions.transmogrify({'id':parentID+'_'+stid,'stid':stid},templateID,data.value[i])
//make any inputs for coupons disabled.
				if(stid[0] == '%')	{$o.find(':input').attr({'disabled':'disabled'}).addClass('disabled')}
				$tag.append($o);
				}
			},


		elasticImage1URL : function($tag,data)	{
			var bgcolor = data.bindData.bgcolor ? data.bindData.bgcolor : 'ffffff'
			if(data.value[0])	{$tag.attr('src',app.u.makeImage({"name":data.value[0],"w":$tag.attr('width'),"h":$tag.attr('height'),"b":bgcolor,"tag":0}))}
			else	{$tag.style('display','none');}
			},

//handy for enabling tabs and whatnot based on whether or not a field is populated.
//doesn't actually do anything with the value.
		showIfSet : function($tag,data)	{
//			app.u.dump('BEGIN control.renderFormats.hideorShowTab');
//			app.u.dump(' -> data.value'+data.value);
			if(data.value)	{
//				app.u.dump(' -> setting $tag.show()');
				$tag.show().css('display','block'); //IE isn't responding to the 'show', so the display:block is added as well.
				}
			},

//for embedding. There is an action for showing a youtube video in an iframe in quickstart.
// hint: set the action as an onclick and set attribute youtube:video id on element and use jquery to pass it in. 
//ex: data-bind='var:product(youtube:videoid);format:assignAttribute; attribute:data-videoid;' onClick="app.ext.myRIA.a.showYoutubeInModal($(this).attr('data-videoid'));
		youtubeVideo : function($tag,data){
			var width = data.bindData.width ? data.bindData.width : 560
			var height = data.bindData.height ? data.bindData.height : 315
			var r = "<iframe style='z-index:1;' width='"+width+"' height='"+height+"' src='https://www.youtube.com/embed/"+data.value+"' frameborder='0' allowfullscreen></iframe>";
			$tag.append(r);
			},

		paypalECButton : function($tag,data)	{

if(zGlobals.checkoutSettings.paypalCheckoutApiUser)	{
	var payObj = app.u.which3PCAreAvailable();
	if(payObj.paypalec)	{
		$tag.empty().append("<img width='145' id='paypalECButton' height='42' border='0' src='https://www.paypal.com/en_US/i/btn/btn_xpressCheckoutsm.gif' alt='' />").addClass('pointer').one('click',function(){
			app.ext.store_checkout.calls.cartPaypalSetExpressCheckout.init();
			$(this).addClass('disabled').attr('disabled','disabled');
			app.model.dispatchThis('immutable');
			});
		}
	else	{
		$tag.empty().append("<img width='145' id='paypalECButton' height='42' border='0' src='https://www.paypal.com/en_US/i/btn/btn_xpressCheckoutsm.gif' alt='' />").addClass('disabled').attr('disabled','disabled');
		}
	}
else	{
	$tag.addClass('displayNone');
	}
			}, //paypalECButton

		googleCheckoutButton : function($tag,data)	{

if(zGlobals.checkoutSettings.googleCheckoutMerchantId)	{
	var payObj = app.u.which3PCAreAvailable(); //certain product can be flagged to disable googlecheckout as a payment option.
	if(payObj.googlecheckout)	{
	$tag.append("<img height=43 width=160 id='googleCheckoutButton' border=0 src='https://checkout.google.com/buttons/checkout.gif?merchant_id="+zGlobals.checkoutSettings.googleCheckoutMerchantId+"&w=160&h=43&style=trans&variant=text&loc=en_US' \/>").one('click',function(){
		app.ext.store_checkout.calls.cartGoogleCheckoutURL.init();
		$(this).addClass('disabled').attr('disabled','disabled');
		app.model.dispatchThis('immutable');
		});
		}
	else	{
		$tag.append("<img height=43 width=160 id='googleCheckoutButton' border=0 src='https://checkout.google.com/buttons/checkout.gif?merchant_id="+zGlobals.checkoutSettings.googleCheckoutMerchantId+"&w=160&h=43&style=trans&variant=disable&loc=en_US' \/>")			
		}
	}
else	{
	$tag.addClass('displayNone');
	}
	
			}, //googleCheckoutButton




		amazonCheckoutButton : function($tag,data)	{

if(zGlobals.checkoutSettings.amazonCheckoutMerchantId && zGlobals.checkoutSettings.amazonCheckoutEnable)	{
	//tmp for testing
	$tag.append("<img id='amazonCheckoutButton' border=0 src='https://payments.amazon.com/gp/cba/button?ie=UTF8&color=orange&background=white&size=small' \/>").click(function(){
	app.ext.store_cart.calls.cartAmazonPaymentURL.init();
	app.model.dispatchThis('immutable');
	});		
	}
else	{
	$tag.addClass('displayNone');
	}
	
			}, //amazonCheckoutButton



		
//set bind-data to val: product(zoovy:prod_is_tags) which is a comma separated list
//used for displaying a  series of tags, such as on the product detail page. Will show any tag enabled.
//on bind-data, set maxTagsShown to 1 to show only 1 tag
		addTagSpans : function($tag,data)	{
			var whitelist = new Array('IS_PREORDER','IS_DISCONTINUED','IS_SPECIALORDER','IS_SALE','IS_CLEARANCE','IS_NEWARRIVAL','IS_BESTSELLER','IS_USER1','IS_USER2','IS_USER3','IS_USER4','IS_USER5','IS_USER6','IS_USER7','IS_USER8','IS_USER9','IS_FRESH','IS_SHIPFREE');
//			var csv = data.value.split(',');
			var L = whitelist.length;
			var tagsDisplayed = 0;
			var maxTagsShown = app.u.isSet(data.bindData.maxTagsShown) ? data.bindData.maxTagsShown : 100; //default to a high # to show all tags.
			var spans = ""; //1 or more span tags w/ appropriate tag class applied
			for(var i = 0; i < L; i += 1)	{
//				app.u.dump("whitelist[i]: "+whitelist[i]+" and tagsDisplayed: "+tagsDisplayed+" and maxTagsShown: "+maxTagsShown);
//				app.u.dump("data.value.indexOf(whitelist[i]): "+data.value.indexOf(whitelist[i]));
				if(data.value.indexOf(whitelist[i]) >= 0 && (tagsDisplayed <= maxTagsShown))	{

					spans += "<span class='"+whitelist[i].toLowerCase()+"'><\/span>";
					tagsDisplayed += 1;
					}
				}
			$tag.append(spans);
			},

//if classname is set in the bindData, it'll be concatonated with the value so that specific classes can be defined.
//ex: for a reviews item, instead of a class of 7, which isn't valid, it would be output as review_7
		addClass : function($tag,data){
			var className;
			if(data.bindData.className)	{
				className = data.bindData.className+data.value;
				}
			else	{ className = data.value}
			$tag.addClass(className);
			},
		
		wiki : function($tag,data)	{
/*
try not to barf in your mouth when you read this.
The wiki translator doesn't like dealing with a jquery object (this will be addressed at some point).
it needs a dom element. so a hidden element is created and the wiki translator saves/modifies that.
then the contents of that are saved into the target jquery object.
*/
var $tmp = $('<div \/>').attr('id','TEMP_'+$tag.attr('id')).hide().appendTo('body');
var target = document.getElementById('TEMP_'+$tag.attr('id')); //### creole parser doesn't like dealing w/ a jquery object. fix at some point.
myCreole.parse(target, data.value,{},data.bindData.wikiFormats);
$tag.append($tmp.html());
$tmp.empty().remove();
			},
		
		truncText : function($tag,data){
			var o = app.u.truncate(data.value,data.bindData.numCharacters)
			$tag.text(o);
			}, //truncText

//used in a cart or invoice spec to display which options were selected for a stid.
		selectedOptionsDisplay : function($tag,data)	{
			var o = '';
			for(var key in data.value) {
//				app.u.dump("in for loop. key = "+key);
				o += "<div><span class='prompt'>"+data.value[key]['prompt']+"<\/span>: <span class='value'>"+data.value[key].data+"<\/span><\/div>";
				}
			$tag.html(o);
			},

		unix2mdy : function($tag,data)	{
			$tag.text(app.u.unix2Pretty(data.value,data.bindData.showtime))
			},
	
		text : function($tag,data){
			var o = '';
			if(jQuery.isEmptyObject(data.bindData))	{o = data.value}
			else	{
				o += data.value;
				}
			$tag.html(o);
			}, //text

//for use on inputs. populates val() with the value
		popVal : function($tag,data){
			$tag.val(data.value);
			}, //text

//only use this on fields where the value is b
		popCheckbox : function($tag,data){
//			app.u.dump(" -> data.value: "+data.value);
			if(Number(data.value))	{$tag.attr('checked',true);}
			else if(data.value === 'on')	{$tag.attr('checked',true);}
			else if(data.value == true)	{$tag.attr('checked',true);}
			else{} //shouldn't get here if data.value isn't populated.
			},


//will allow an attribute to be set on the tag. attribute:data-stid;var: product(sku); would set data-stid='sku' on tag
//pretext and posttext are added later in the process, but this function needed to be able to put some text before the output
// so that the id could be valid (if used on an number field, an ID starting with a number isn't valid in old browsers)
		assignAttribute : function($tag,data){
			var o = ''; //what is appended to tag. the output (data.value plus any attributePretext and/or making it safe for id)
			if(data.bindData.valuePretext)	{
				o += data.bindData.valuePretext;
				}
			if(data.bindData.attribute == 'id' || data.bindData.makeSafe)
				o += app.u.makeSafeHTMLId(data.value);
			else
				o += data.value

			$tag.attr(data.bindData.attribute,o);
			}, //text

		loadsTemplate : function($tag,data)	{
			app.u.dump("BEGIN renderFormats.loadsTemplate");
			$tag.append(app.renderFunctions.transmogrify({},data.bindData.loadsTemplate,data));
			},

		elasticMoney :function($tag,data)	{
			data.value = data.value / 100;
			app.renderFormats.money($tag,data);
			}, //money
		
		money : function($tag,data)	{
			
//			app.u.dump('BEGIN view.formats.money');
			var amount = data.value;
			if(amount)	{
				var r;
				r = app.u.formatMoney(amount,data.bindData.currencySign,'',data.bindData.hideZero);
//					app.u.dump(' -> attempting to use var. value: '+data.value);
//					app.u.dump(' -> currencySign = "'+data.bindData.currencySign+'"');
//					app.u.dump(' -> r = '+r);
				$tag.text(r)
				}
			}, //money

//This should be used for all lists going forward. stuffList and object2Template should be upgraded to use this.
//everthing that's in the data lineitem gets passed as first param in transmogrify, which will add each key/value as data-key="value"
//at this time, prodlist WON'T use this because each pid in the list needs/makes an API call.
//data-obj_index is set so that a quick lookup is available. ex: in tasks list, there's no detail call, so need to be able to find data quickly in orig object.
// _index is used instead of -index because of how data works (removes dashes and goes to camel case, which is nice but not consistent and potentially confusing)

		processList : function($tag,data){
//			app.u.dump("BEGIN renderFormats.processList");
			var L = data.value.length;
			var $o; //recycled. what gets added to $tag for each iteration.
			for(var i = 0; i < L; i += 1)	{
//				app.u.dump(i+") reached.");
				$o = app.renderFunctions.transmogrify(data.value[i],data.bindData.loadsTemplate,data.value[i]);
//				app.u.dump(" ---> appended");
				if(data.value[i].id){} //if an id was set, do nothing.
				else	{$o.removeAttr('id').attr('data-obj_index',i)} //nuke the id. it's the template id and will be duplicated several times. set index for easy lookup later.
				$tag.append($o);
				}
			$tag.removeClass('loadingBG');
			},


		object2Template : function($tag,data)	{
//			app.u.dump("BEGIN renderFormats.array2Template");
//			app.u.dump(data.value);
			var L = data.value.length;
//			app.u.dump(" -> L: "+L);
			for(var i = 0; i < L; i += 1)	{
				$tag.append(app.renderFunctions.transmogrify({'id': $tag.attr('id') ? '02t_'+$tag.attr('id')+'_'+i : '02t_'+i},data.bindData.loadsTemplate,data.value[i])); 
				}
			$tag.removeClass('loadingBG');
			}
			
		},





////////////////////////////////////   						STORAGEFUNCTIONS						    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
					
					
	storageFunctions : {

		writeLocal : function (key,value)	{
		//	app.u.dump("WRITELOCAL: Key = "+key);
			var r = false;
			if('localStorage' in window && window['localStorage'] !== null && typeof localStorage != 'undefined')	{
				r = true;
				if (typeof value == "object") {
					value = JSON.stringify(value);
					}
//				localStorage.removeItem(key); //here specifically to solve a iphone/ipad issue as a result of 'private' browsing.
//the function above wreaked havoc in IE. do not implement without thorough testing (or not at all).
				try	{
					localStorage.setItem(key, value);
					}
				catch(e)	{
					r = false;
//					app.u.dump(' -> localStorage defined but not available (no space? no write permissions?)');
//					app.u.dump(e);
					}
				
				}
			return r;
			}, //writeLocal
		
		readLocal : function(key)	{
		//	app.u.dump("GETLOCAL: key = "+key);
			if(typeof localStorage == 'undefined')	{
				return app.storageFunctions.readCookie(key); //return blank if no cookie exists. needed because getLocal is used to set vars in some if statements and 'null'	
				}
			else	{
				var value = null;
				try{
					value = localStorage.getItem(key);
					}
				catch(e)	{
					//app.u.dump("Local storage does not appear to be available. e = ");
					//app.u.dump(e);
					}
				if(value == null)	{
					return app.storageFunctions.readCookie(key);
					}
		// assume it is an object that has been stringified
				if(value && value[0] == "{") {
					value = JSON.parse(value);
					}
				return value
				}
			}, //readLocal

// read this.  see if there's a better way of handing cookies using jquery.
//http://www.jquery4u.com/data-manipulation/jquery-set-delete-cookies/
		readCookie : function(c_name){
			var i,x,y,ARRcookies=document.cookie.split(";");
			for (i=0;i<ARRcookies.length;i++)	{
				x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
				y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
				x=x.replace(/^\s+|\s+$/g,"");
				if (x==c_name)	{
					return unescape(y);
					}
				}
			return false;  //return false if not set.
			},

		writeCookie : function(c_name,value)	{
var myDate = new Date();
myDate.setTime(myDate.getTime()+(1*24*60*60*1000));
document.cookie = c_name +"=" + value + ";expires=" + myDate + ";domain=.zoovy.com;path=/";
document.cookie = c_name +"=" + value + ";expires=" + myDate + ";domain=www.zoovy.com;path=/";
			},
//deleting a cookie seems to cause lots of issues w/ iOS and some other mobile devices (where admin login is concerned, particularly. 
//test before earlier.
		deleteCookie : function(c_name)	{
document.cookie = c_name+ "=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/";
app.u.dump(" -> DELETED cookie "+c_name);
			}

		}, //storageFunctions
	
	


////////////////////////////////////   			thirdPartyFunctions		    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	thirdParty : {
		
		fb : {
			
			postToWall : function(msg)	{
				app.u.dump('BEGIN thirdpartyfunctions.facebook.posttowall. msg = '+msg);
				FB.ui({ method : "feed", message : msg}); // name: 'Facebook Dialogs', 
				},
			
			share : function(a)	{
				a.method = 'send';
				FB.ui(a);
				},
				
		
			saveUserDataToSession : function()	{
//				app.u.dump("BEGIN app.thirdParty.fb.saveUserDataToSession");
				
				FB.Event.subscribe('auth.statusChange', function(response) {
//					app.u.dump(" -> FB response changed. status = "+response.status);
					if(response.status == 'connected')	{
	//save the fb user data elsewhere for easy access.
						FB.api('/me',function(user) {
							if(user != null) {
//								app.u.dump(" -> FB.user is defined.");
								app.vars.fbUser = user;
								app.calls.cartSet.init({"bill/email":user.email});

//								app.u.dump(" -> user.gender = "+user.gender);

if(_gaq.push(['_setCustomVar',1,'gender',user.gender,1]))
	app.u.dump(" -> fired a custom GA var for gender.");
else
	app.u.dump(" -> ARGH! GA custom var NOT fired. WHY!!!");


								}
							});
						}
					});
//				app.u.dump("END app.thirdParty.fb.saveUserDataToSession");
				}
			}
		}



	});
