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
	this.u.dump('Welcome fellow developer!\nThis project was built with an open-source MVC which can be found here:\nhttps://github.com/zoovy/AnyCommerce-Development','greet');
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
		app = $.extend(true,P,this); //deep extend to make sure nested functions are preserved. If duplicates, 'this' will override P.
		app.model = zoovyModel(); // will return model as object. so references are app.model.dispatchThis et all.

		app.vars = app.vars || {};
		app.vars.platform = P.platform ? P.platform : 'webapp'; //webapp, ios, android
		app.vars.cid = null; //gets set on login. ??? I'm sure there's a reason why this is being saved outside the normal  object. Figure it out and document it.
		app.vars.fbUser = {};
		app.vars.protocol = document.location.protocol == 'https:' ? 'https:' : 'http:';

		app.handleSession(); //get existing session or create a new one.

//used in conjunction with support/admin login. nukes entire local cache.
		if(app.u.getParameterByName('flush') == 1)	{
			app.u.dump("URI param flush is true. CLEAR LOCAL STORAGE");
			localStorage.clear();
			}
		
		app.vars.debug = app.u.getParameterByName('debug'); //set a var for this so the URI doesn't have to be checked each time.
//in some cases, such as the zoovy UI, zglobals may not be defined. If that's the case, certain vars, such as jqurl, must be passed in via P in initialize:
		if(typeof zGlobals == 'object')	{
			app.u.dump(" -> zGlobals are an object")
			app.vars.profile = zGlobals.appSettings.profile.toUpperCase();
			app.vars.username = zGlobals.appSettings.username.toLowerCase();
//need to make sure the secureURL ends in a / always. doesn't seem to always come in that way via zGlobals
			app.vars.secureURL = zGlobals.appSettings.https_app_url;
			app.vars.domain = zGlobals.appSettings.sdomain;
// *** -> as of 201342, the path /jsonapi/ can/should be used for all ajax calls in a store
			app.vars.jqurl = (document.location.protocol === 'file:') ? app.vars.testURL+'jsonapi/' : '/jsonapi/';
//			if('https:' == app.vars.protocol)	{app.vars.jqurl = zGlobals.appSettings.https_api_url;}
//			else	{app.vars.jqurl = zGlobals.appSettings.http_api_url}
			}
		
// can be used to pass additional variables on all request and that get logged for certain requests (like createOrder). 
// default to blank, not 'null', or += below will start with 'undefined'.
//vars should be passed as key:value;  _v will start with zmvc:version.release.
		app.vars.passInDispatchV = '';  
		app.vars.release = app.vars.release || 'unspecified'; //will get overridden if set in P. this is default.

// += is used so that this is appended to anything passed in P.
		app.vars.passInDispatchV += 'browser:'+app.u.getBrowserInfo()+";OS:"+app.u.getOSInfo()+';compatMode:'+document.compatMode; //passed in model as part of dispatch Version. can be app specific.
		app.ext = app.ext || {}; //for holding extensions
		app.data = {}; //used to hold all data retrieved from ajax requests.
/*
app.templates holds a copy of each of the templates declared in an extension but defined in the view.
copying the template into memory was done for two reasons:
1. faster reference when template is needed.
2. solve any duplicate 'id' issues within the spec itself when original spec and cloned template are present.
   -> this solution was selected over adding a var for subbing in the templates because the interpolation was thought to be too heavy.
*/
		app.templates = {};

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
			
		
		app.vars.extensions = app.vars.extensions || []; //the list of extensions that are/will be loaded
		
		if(app.vars.thisSessionIsAdmin)	{
			app.handleAdminVars(); //needs to be late because it'll use some vars set above.
			}
		app.onReady();

		}, //initialize

//will load _session from localStorage or create a new one.
	handleSession : function()	{
		if(app.vars._session)	{} //already defined. 
		else if(app.u.getParameterByName('_session'))	{ //get from URI, if set.
			app.vars._session = app.u.getParameterByName('_session');
			app.u.dump(" -> session found on URI: "+app.vars._session);
			}
		else	{
			app.vars._session = app.storageFunctions.readLocal('_session');
			if(app.vars._session)	{
				app.u.dump(" -> session found in localStorage: "+app.vars._session);
				//use the local session id.
				}
			else	{
				//create a new session id.
				app.vars._session = app.u.guidGenerator();
				app.storageFunctions.writeLocal('_session',app.vars._session);
				app.u.dump(" -> generated new session: "+app.vars._session);
				}
			}
		}, //handleSession

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
		
		}, //handleAdminVars

	onReady : function()	{
		this.u.dump(" -> onReady executed. V: "+app.model.version+"|"+app.vars.release);
		if(app.vars.thisSessionIsAdmin)	{
			app.model.addExtensions(app.vars.extensions);
			}
		else if(app.vars.cartID)	{
//			app.u.dump(" -> app.vars.cartID set. verify.");
			app.model.destroy('cartDetail'); //do not use a cart from localstorage
			app.calls.cartDetail.init({'callback':'handleNewSession'},'immutable');
			app.calls.whoAmI.init({},{'callback':'suppressErrors'},'immutable'); //get this info when convenient.
			app.model.dispatchThis('immutable');
			}
//if cartID is set on URI, there's a good chance a redir just occured from non secure to secure.
		else if(app.u.isSet(app.u.getParameterByName('cartID')))	{
//			app.u.dump(" -> cartID from URI used.");
			app.vars.cartID = app.u.getParameterByName('cartID');
			app.model.destroy('cartDetail'); //do not use a cart from localstorage
			app.calls.cartDetail.init({'callback':'handleNewSession'},'immutable');
			app.calls.whoAmI.init({},{'callback':'suppressErrors'},'immutable'); //get this info when convenient.
			app.model.dispatchThis('immutable');
			}
//check localStorage
		else if(app.model.fetchCartID())	{
//			app.u.dump(" -> session retrieved from localstorage..");
			app.vars.cartID = app.model.fetchCartID();
			app.model.destroy('cartDetail'); //do not use a cart from localstorage
			app.calls.cartDetail.init({'callback':'handleNewSession'},'immutable');
			app.calls.whoAmI.init({},{'callback':'suppressErrors'},'immutable'); //get this info when convenient.
			app.model.dispatchThis('immutable');
			}
		else	{
//			app.u.dump(" -> go get a new cart id.");
			app.calls.appCartCreate.init({'callback':'handleNewSession'},'immutable');
			app.model.dispatchThis('immutable');
			}
//		this.u.dump(" -> finished onready except thirdPartyInits");
//if third party inits are not done before extensions, the extensions can't use any vars loaded by third parties. yuck. would rather load our code first.
// -> EX: username from FB and OPC.
		app.u.handleThirdPartyInits();
//		this.u.dump(" -> finished thirdPartyInits");
		}, //onReady
					// //////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ \\		


/*
calls all have an 'init' as well as a 'dispatch'.
the init allows for the call to check if the data being retrieved is already in the session or local storage and, if so, avoid a request.
If the data is not there, or there's no data to be retrieved (a Set, for instance) the init will execute the dispatch.
*/
	calls : {

		appBuyerCreate : {
			init : function(obj,_tag)	{
				this.dispatch(obj,_tag);
				return 1;
				},
			dispatch : function(obj,_tag){
				obj._tag = _tag || {};
				obj._cmd = "appBuyerCreate";
				app.model.addDispatchToQ(obj,'immutable');
				}
			}, //appBuyerCreate

		appBuyerLogin : {
			init : function(obj,_tag)	{
				var r = 0;
				if(obj && obj.login && obj.password)	{
					r = 1;
//email should be validated prior to call.  allows for more custom error handling based on use case (login form vs checkout login)
					app.calls.cartSet.init({"bill/email":obj.login}) //whether the login succeeds or not, set bill/email in /session
					this.dispatch(obj,_tag);
					}
				else	{$('#globalMessaging').anymessage({'message':'In app.calls.appBuyerLogin, login or password not specified.','gMessage':true});}
				return r;
				},
			dispatch : function(obj,_tag)	{
				obj["_cmd"] = "appBuyerLogin";
				obj['method'] = "unsecure";
				obj["_tag"] = _tag || {};
				obj["_tag"]["datapointer"] = "appBuyerLogin";
				
				app.model.addDispatchToQ(obj,'immutable');
				}
			}, //appBuyerLogin

//formerly customerPasswordRecover
		appBuyerPasswordRecover : {
			init : function(login,_tag,Q)	{
				var r = 0;
				if(login)	{
					r = 1;
					this.dispatch(login,_tag,Q);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'appBuyerPasswordRecover requires login','gMessage':true});
					}
				return r;
				},
			dispatch : function(login,_tag,Q)	{
				var obj = {};
				obj['_cmd'] = 'appBuyerPasswordRecover';
				obj.login = login;
				obj.method = 'email';
				obj['_tag'] = _tag;
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			},//appBuyerPasswordRecover

		appCartCreate : {
			init : function(_tag)	{
				this.dispatch(_tag); 
				return 1;
				},
			dispatch : function(_tag)	{
				app.model.addDispatchToQ({"_cmd":"appCartCreate","_tag":_tag},'immutable');
				}
			},//appCartCreate

		appNavcatDetail : {
			init : function(obj,_tag,Q)	{
				if(obj && obj.safe)	{
					var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
					_tag = _tag || {};
					_tag.datapointer = 'appNavcatDetail|'+obj.safe;
					
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
					app.u.throwGMessage("In calls.appNavcatDetail, obj.safe not passed.");
					app.u.dump(obj);
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "appNavcatDetail";
				obj._tag = _tag;
				app.model.addDispatchToQ(obj,Q);	
				}
			},//appNavcatDetail		






//get a list of newsletter subscription lists. partition specific.
		appNewsletterList : {
			init : function(_tag,Q)	{
				var r = 0;
				_tag = _tag || {}; 
				_tag.datapointer = "appNewsletterList"
				if(app.model.fetchData('appNewsletterList') == false)	{
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
				app.model.addDispatchToQ({"_cmd":"appNewsletterList","_tag" : _tag},Q || 'immutable');	
				}
			},//getNewsletters	

		appSendMessage : {
			init : function(obj,_tag,Q)	{
				this.dispatch(obj,_tag,Q);
				return 1;
				},
			dispatch : function(obj,_tag,Q)	{
				obj.msgtype = "feedback"
				obj["_cmd"] = "appSendMessage";
				obj['_tag'] = _tag;
				app.model.addDispatchToQ(obj,Q || 'immutable');	
				}
			},//appSendMessage
//obj should contain @products (array of pids), ship_postal (zip/postal code) and ship_country (as 2 digit country code)
		appShippingTransitEstimate : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(obj && obj.ship_postal && obj.ship_country && typeof obj['@products'] === 'object')	{
					this.dispatch(obj,_tag,Q);
					r = 1;
					}
				else if(obj)	{
					$('#globalMessaging').anymessage({'message':'In app.calls.appShippingTransitEstimate requires ship_postal ['+obj.ship_postal+'], ship_country ['+obj.ship_country+'] and @products ['+typeof obj['@products']+']','gMessage':true});
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In app.calls.appShippingTransitEstimate, no obj passed.','gMessage':true});
					}
				
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._tag = _tag || {};
				obj._tag.datapointer = 'appShippingTransitEstimate';
				obj._cmd = "appShippingTransitEstimate"
				app.model.addDispatchToQ(obj,Q || 'passive');	
				}
			},//appShippingTransitEstimate

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
//if the product record is in memory BUT the inventory is zero, go get updated record in case it's back in stock.
					else if(app.ext.store_product && (app.ext.store_product.u.getProductInventory(obj.pid) === 0))	{
						r = 1;
						this.dispatch(obj,_tag,Q);
						}
					else 	{
						app.u.handleCallback(_tag);
						}
					if(obj.withInventory)	{obj.inventory=1}
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

		appProfileInfo : {
			init : function(obj,_tag,Q)	{
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				if(typeof obj == 'object' && (obj.profile || obj.domain))	{
					_tag = _tag || {};
					_tag.datapointer = 'appProfileInfo|'+(obj.profile || obj.domain);
					if(app.model.fetchData(_tag.datapointer) == false)	{
						r = 1;
						this.dispatch(obj,_tag,Q);
						}
					else 	{
						app.u.handleCallback(_tag);
						}
					}
				else	{
					app.u.throwGMessage("In calls.appProfileGet, obj either missing or missing profile ["+obj.profile+"] or domain ["+obj.domain+"] var.");
					app.u.dump(obj);
					}

				return r;
				}, // init
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "appProfileInfo";
				obj._tag = _tag;
				app.model.addDispatchToQ(obj,Q);
				} // dispatch
			}, //appProfileInfo

/*
obj is most likely a form object serialized to json.
see jquery/api webdoc for required/optional param
*/
		appReviewAdd : {
			init : function(obj,_tag,Q)	{
				this.dispatch(obj,_tag,Q);
				return 1;
				},
			dispatch : function(obj,_tag,Q)	{
				obj['_cmd'] = 'appReviewAdd';
				obj['_tag'] = _tag || {};
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			},//appReviewAdd

		appStash : {
			init : function(obj,_tag,Q)	{
				this.dispatch(obj,_tag,Q);
				return 1;
				},
			dispatch : function(obj,_tag,Q)	{
				obj["_cmd"] = "appStash";
				obj['_tag'] = _tag;
				app.model.addDispatchToQ(obj,Q || 'immutable');	
				}
			},//appStash

		appSuck : {
			init : function(obj,_tag,Q)	{
				this.dispatch(obj,_tag,Q);
				return 1;
				},
			dispatch : function(obj,_tag,Q)	{
				obj["_cmd"] = "appSuck";
				obj['_tag'] = _tag;
				app.model.addDispatchToQ(obj,Q || 'immutable');	
				}
			},//appSuck


//the authentication through FB sdk has already taken place and this is an internal server check to verify integrity.	
//the getFacebookUserData function also updates bill_email and adds the fb.user info into memory in a place quickly accessed
//the obj passed in is passed into the request as the _tag
		appVerifyTrustedPartner : {
			init : function(partner,_tag,Q)	{
				var r = 0;
				if(partner)	{
					this.dispatch(partner,_tag,Q);
					r = 1;
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In app.calls.appVerifyTrustedPartner, partner not specified.','gMessage':true});
					}
				return r;
				},
			dispatch : function(partner,_tag,Q)	{
//note - was using FB['_session'].access_token pre v-1202. don't know how long it wasn't working, but now using _authRepsonse.accessToken
				app.model.addDispatchToQ({'_cmd':'appVerifyTrustedPartner','partner':partner,'appid':zGlobals.thirdParty.facebook.appId,'token':FB['_authResponse'].accessToken,'state':app.vars.cartID,"_tag":_tag},Q || 'immutable');
				}
			}, //facebook			
			
		authAdminLogout : {
			init : function(_tag)	{
				this.dispatch(_tag);
				return 1;
				},
			dispatch : function(_tag){
				app.model.addDispatchToQ({'_cmd':'authAdminLogout',"_tag":_tag},'immutable');
				}
			}, //authAdminLogout

		authAdminLogin : {
			init : function(obj,_tag)	{
				this.dispatch(obj,_tag);
				return 1;
				},
			dispatch : function(obj,_tag){
				app.u.dump("Attempting to log in");
				obj._cmd = 'authAdminLogin';
				if(obj.authtype == 'md5')	{
					app.vars.userid = obj.userid.toLowerCase();	 // important!
					obj.ts = app.u.ymdNow();
					obj.authid = Crypto.MD5(obj.password+obj.ts);
					obj.device_notes = "";
					delete obj.password;
					}

				obj._tag = _tag || {};
				if(obj.persistentAuth)	{obj._tag.datapointer = "authAdminLogin"} //this is only saved locally IF 'keep me logged in' is true OR it's passed in _tag
				app.model.addDispatchToQ(obj,'immutable');
				}
			}, //authentication

		authAccountCreate : {
			init : function(obj,_tag){
				this.dispatch(obj,_tag);
				},
			dispatch : function(obj,_tag){
				obj._cmd = 'authUserRegister';
				_tag = _tag || {};
				obj['tag'] = _tag;
				app.model.addDispatchToQ(obj,'immutable');
				}
			},

		buyerAddressAddUpdate  : {
			init : function(cmdObj,_tag,Q)	{
				var r = 0;
				if(cmdObj && cmdObj.shortcut)	{
					_tag = _tag || {};
					_tag.datapointer = "buyerAddressAddUpdate|"+cmdObj.shortcut
					r = 1;
					this.dispatch(cmdObj,_tag,Q);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'buyerAddressAddUpdate requires obj and obj.shortcut','gMessage':true});
					}
				return r;
				},
			dispatch : function(cmdObj,_tag,Q)	{
				cmdObj['_cmd'] = 'buyerAddressAddUpdate';
				cmdObj._tag = _tag;
				app.model.addDispatchToQ(cmdObj,Q || 'immutable');	
				}
			},//buyerAddressAddUpdate 

		buyerAddressList : {
			init : function(_tag,Q)	{
				var r = 0;
				_tag = _tag || {};
				_tag.datapointer = "buyerAddressList";
				if(app.model.fetchData("buyerAddressList") == false)	{
					r = 1;
					this.dispatch(_tag,Q);
					}
				else	{
					app.u.handleCallback(_tag);
					}
				return r;
				},
			dispatch : function(_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"buyerAddressList","_tag": _tag},Q || 'mutable');
				}
			}, //buyerAddressList	

		buyerNewsletters: {
			init : function(_tag,Q)	{
				this.dispatch(_tag,Q);
				return 1;
				},
			dispatch : function(_tag,Q)	{
				obj = {};
				obj['_tag'] = _tag;
				obj['_cmd'] = "buyerNewsletters";
				app.model.addDispatchToQ(obj,Q || 'mutable');
				}
			}, //buyerNewsletters


//obj should always have orderid.
//may also have cartid for soft-auth (invoice view)
		buyerOrderGet : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(obj && obj.orderid)	{
					r = 1;
					_tag = _tag || {}; 
					_tag.datapointer = "buyerOrderGet|"+obj.orderid;
					this.dispatch(obj,_tag,Q);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'buyerPurchaseHistoryDetail requires orderid','gMessage':true});
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				if(!Q)	{Q = 'mutable'}
				obj["_cmd"] = "buyerOrderGet";
				obj['softauth'] = "order";
				obj["_tag"] = _tag;
				app.model.addDispatchToQ(obj,Q);
				}
			}, //buyerOrderGet


		buyerPasswordUpdate : {
			init : function(password,_tag,Q)	{
				var r = 0;
				if(password)	{
					r = 1;
					this.dispatch(password,_tag,Q);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'buyerPasswordUpdate requires password','gMessage':true});
					}
				return r;
				},
			dispatch : function(password,_tag,Q)	{
				var obj = {};
				obj.password = password;
				obj['_tag'] = _tag;
				obj['_cmd'] = "buyerPasswordUpdate";
				app.model.addDispatchToQ(obj,Q || 'immutable');	
				}
			}, //buyerPasswordUpdate

		buyerProductLists : {
			init : function(_tag,Q)	{
				var r = 0;
				_tag = _tag || {}; 
				_tag.datapointer = "buyerProductLists"
				if(app.model.fetchData(_tag.datapointer) == false)	{
					r = 1;
					this.dispatch(_tag);
					}
				else	{
//					app.u.dump(' -> data is local');
					app.u.handleCallback(_tag,Q);
					}
				return r;
				},
			dispatch : function(_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"buyerProductLists","_tag" : _tag});	
				}
			},//buyerProductLists

		buyerProductListDetail : {
			init : function(listID,_tag,Q)	{
				var r = 0;
				if(listID)	{
					_tag = _tag || {};
					_tag.datapointer = "buyerProductListDetail|"+listID
					this.dispatch(listID,_tag,Q);
					r = 1;
					}
				else	{
					$('#globalMessaging').anymessage({'message':'buyerProductListDetail requires listID','gMessage':true});
					}
				return r;
				},
			dispatch : function(listID,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"buyerProductListDetail","listid":listID,"_tag" : _tag},Q);	
				}
			},//buyerProductListDetail

//obj must include listid
//obj can include sku, qty,priority, note and replace. see github for more info.
//sku can be a fully qualified stid (w/ options)
		buyerProductListAppendTo : {
			init : function(obj,_tag,Q)	{
				var r = 0;
				if(obj && obj.listid)	{
					r = 1;
					this.dispatch(obj,_tag,Q);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'buyerProductListDetail requires listid','gMessage':true});
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj['_cmd'] = "buyerProductListAppendTo"
				obj['_tag'] = _tag || {};
				app.model.addDispatchToQ(obj,Q || 'immutable');	
				}
			},//buyerProductListAppendTo

//formerly removeFromCustomerList
		buyerProductListRemoveFrom : {
			init : function(listID,stid,_tag,Q)	{
				var r = 0;
				if(listID)	{
					r = 1;
					this.dispatch(listID,stid,_tag,Q);
					}
				else	{
					$('#globalMessaging').anymessage({'message':'buyerProductListRemoveFrom requires listID','gMessage':true});
					}
				return r;
				},
			dispatch : function(listID,stid,_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"buyerProductListRemoveFrom","listid":listID,"sku":stid,"_tag" : _tag},Q || 'immutable');	
				}
			},//buyerProductListRemoveFrom

//a request for order history should always request latest list (as per B)
//formerly getCustomerOrderList
		buyerPurchaseHistory : {
			init : function(_tag,Q)	{
				var r = 1;
				_tag = _tag || {};
				_tag.datapointer = "buyerPurchaseHistory"
				this.dispatch(_tag,Q);
				return r;
				},
			dispatch : function(_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"buyerPurchaseHistory","DETAIL":"5","_tag" : _tag},Q || 'mutable');	
				}			
			}, //buyerPurchaseHistory


		buyerLogout : {
			init : function(_tag)	{
// *** 201338 -> logging out should clear this fields as they contain buyer specific data.
				app.model.destroy('appBuyerLogin');
				app.model.destroy('buyerWalletList');
				app.model.destroy('buyerAddressList');
				app.model.destroy('appPaymentMethods');
				app.model.destroy('whoAmI');
				app.model.destroy('cartDetail');
				this.dispatch(_tag);
				return 1;
				},
			dispatch : function(_tag)	{
				obj = {};
				obj["_cmd"] = "buyerLogout";
				obj["_tag"] = _tag || {};
				obj["_tag"]["datapointer"] = "buyerLogout";
				app.model.addDispatchToQ(obj,'immutable');
				}
			}, //appBuyerLogout

		buyerWalletList : {
			init : function(_tag,Q)	{
				var r = 0;
				_tag = _tag || {};
				_tag.datapointer = "buyerWalletList";
				if(app.model.fetchData(_tag.datapointer))	{
					app.u.handleCallback(_tag);
					}
				else	{
					r = 1;
					this.dispatch(_tag,Q);
					}
				return r;
				},
			dispatch : function(_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"buyerWalletList","_tag": _tag},Q || 'mutable');
				}
			}, //buyerWalletList

		canIUse : {
			init : function(flag,Q)	{
				this.dispatch(flag,Q);
				return 1;
				},
			dispatch : function(flag,Q)	{
				app.model.addDispatchToQ({"_cmd":"canIUse","flag":flag,"_tag":{"datapointer":"canIUse|"+flag}},Q);
				}
			}, //canIUse

//used to get a clean copy of the cart. ignores local/memory. used for logout.
		cartDetail : {
			init : function(_tag,Q)	{
				var r = 0;
				_tag = _tag || {};
				_tag.datapointer = "cartDetail";
				if(app.model.fetchData(_tag.datapointer))	{
					app.u.handleCallback(_tag);
					}
				else	{
					r = 1;
					this.dispatch(_tag,Q);
					}
				return r;
				},
			dispatch : function(_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"cartDetail","_tag": _tag},Q || 'mutable');
				} 
			}, // refreshCart removed comma from here line 383

		cartItemAppend : {
			init : function(obj,_tag)	{
				var r = 0;
				if(obj && obj.sku && obj.qty)	{
					obj.uuid = app.u.guidGenerator();
					this.dispatch(obj,_tag);
					r = 1;
					}
				else	{
					$('#globalMessaging').anymessage({'message':'Qty or SKU left blank in cartItemAppend'});
					}
				
				return r;
				},
			dispatch : function(obj,_tag){
				obj._tag = _tag;
				obj._cmd = "cartItemAppend";
				app.model.addDispatchToQ(obj,'immutable');
				}
			}, //cartItemAppend

// formerly updateCartQty
		cartItemUpdate : {
			init : function(stid,qty,_tag)	{
//				app.u.dump('BEGIN app.calls.cartItemUpdate.');
				var r = 0;
				if(stid && Number(qty) >= 0)	{
					r = 1;
					this.dispatch(stid,qty,_tag);
					}
				else	{
					app.u.throwGMessage("In calls.cartItemUpdate, either stid ["+stid+"] or qty ["+qty+"] not passed.");
					}
				return r;
				},
			dispatch : function(stid,qty,_tag)	{
//				app.u.dump(' -> adding to PDQ. callback = '+callback)
				app.model.addDispatchToQ({"_cmd":"cartItemUpdate","stid":stid,"quantity":qty,"_tag": _tag},'immutable');
				app.ext.cco.u.nukePayPalEC(); //nuke paypal token anytime the cart is updated.
				}
			 },

//default immutable Q
//formerly setSessionVars
		cartSet : {
			init : function(obj,_tag,Q)	{
				this.dispatch(obj,_tag,Q);
				return 1;
				},
			dispatch : function(obj,_tag,Q)	{
				obj["_cmd"] = "cartSet";
				obj["_tag"] = _tag || {};
				app.model.addDispatchToQ(obj,Q || 'immutable');
				}
			}, //cartSet



		cartShippingMethods : {
			init : function(_tag,Q)	{
				var r = 0
				_tag = _tag || {}; //makesure _tag is an object so that datapointer can be added w/o causing a JS error
				_tag.datapointer = "cartShippingMethods";
				
				if(app.model.fetchData('cartShippingMethods') == false)	{
					r = 1;
					Q = Q ? Q : 'immutable'; //allow for muted request, but default to immutable. it's a priority request.
					this.dispatch(_tag,Q);
					}
				else	{
					app.u.handleCallback(_tag);
					}
				return r;
				},
			dispatch : function(_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"cartShippingMethods","_tag": _tag},Q);
				}
			}, //cartShippingMethods





		ping : {
			init : function(_tag,Q)	{
				this.dispatch(_tag,Q);
				return 1;
				},
			dispatch : function(_tag,Q)	{
				app.model.addDispatchToQ({"_cmd":"ping","_tag":_tag},Q || 'mutable'); //get new session id.
				}
			}, //ping

//used to get a clean copy of the cart. ignores local/memory. used for logout.
//this is old and, arguably, should be a utility. however it's used a lot so for now, left as is. ### search and destroy when convenient.
		refreshCart : {
			init : function(_tag,Q)	{
				app.model.destroy('cartDetail');
				app.calls.cartDetail.init(_tag,Q);
				}
			}, // refreshCart

		time : {
			init : function(_tag,Q)	{
				this.dispatch(_tag,Q);
				return true;
				},
			dispatch : function(_tag,Q)	{
				_tag = _tag || {};
				_tag.datapointer = 'time';
				app.model.addDispatchToQ({"_cmd":"time","_tag":_tag},Q || 'mutable');	
				}
			}, //time


		whereAmI : {
			init : function(_tag,Q)	{
				var r = 0;
				_tag = $.isEmptyObject(_tag) ? {} : _tag; 
				_tag.datapointer = "whereAmI"
				if(app.model.fetchData('whereAmI') == false)	{
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
				app.model.addDispatchToQ({"_cmd":"whereAmI","_tag" : _tag},Q || 'mutable');	
				}
			},//whereAmI

//for now, no fetch is done here. it's assumed if you execute this, you don't know who you are dealing with.
		whoAmI : {
			init : function(obj,_tag,Q)	{
				this.dispatch(obj,_tag,Q);
				return 1;
				},
			dispatch : function(obj,_tag,Q)	{
				obj = obj || {};
				obj._cmd = "whoAmI";
				obj._tag = _tag || {}; 
				obj._tag.datapointer = "whoAmI"
				app.model.addDispatchToQ(obj,Q);
				}
			}//whoAmI

		}, // calls

					// //////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ \\
/*
Callbacks require should have an onSuccess.
Optionally, callbacks can have on onError. if you have a custom onError, no error messaging is displayed. This give the developer the opportunity to easily suppress errors for a given request/callback.
app.u.throwMessage(responseData); is the default error handler.
*/
	callbacks : {
		

		fileDownloadInModal : {
			onSuccess : function(_rtag)	{
				app.u.dump("BEGIN callbacks.fileDownloadInModal");
				app.u.fileDownloadInModal({
					'filename':app.data[_rtag.datapointer].FILENAME || _rtag.filename,
					'mime_type':app.data[_rtag.datapointer].MIMETYPE,
					'body':app.data[_rtag.datapointer].body,
					'skipDecode':_rtag.skipDecode || false
					});
				if(_rtag.button && _rtag.button instanceof jQuery)	{
					if(_rtag.button.is('button') && _rtag.button.hasClass('ui-button'))	{
						_rtag.button.button('enable');
						}
					else if(_rtag.button.is('button'))	{
						_rtag.button.prop('disabled','').removeProp('disabled');
						}
					}
				if(_rtag.jqObj && _rtag.jqObj instanceof jQuery)	{
					_rtag.jqObj.hideLoading();
					}
				}
			},


		handleNewSession : {
//app.vars.cartID is set in the method. no need to set it here.
//use app.vars.cartID if you need it in the onSuccess.
//having a callback does allow for behavioral changes (update new session with old cart contents which may still be available.
			onSuccess : function(_rtag)	{
//				app.u.dump('BEGIN app.callbacks.handleNewSession.onSuccess');
// if there are any  extensions(and most likely there will be) add then to the controller.
// This is done here because a valid cart id is required.
				app.model.addExtensions(app.vars.extensions);
				}
			},//convertSessionToOrder




	
//very similar to the original translate selector in the control and intented to replace it. 
//This executes the handleAppEvents in addition to the normal translation.
//jqObj is required and should be a jquery object.
		anycontent : {
			onSuccess : function(_rtag)	{
//				app.u.dump("BEGIN callbacks.anycontent");
				if(_rtag && _rtag.jqObj && typeof _rtag.jqObj == 'object')	{
					
					var $target = _rtag.jqObj; //shortcut
					
//anycontent will disable hideLoading and loadingBG classes.
/*					$target.anycontent({data: app.data[.datapointer],'templateID':_rtag.templateID}); */
// * 201318 -> anycontent should have more flexibility. templateID isn't always required, template placeholder may have been added already.
					$target.anycontent(_rtag);

					app.u.handleCommonPlugins($target);
					app.u.handleButtons($target);
					
					
// ** 201338 -> support for event delegation. only turned on if enabled. disables execution of app event code. Use one or the other, not both.
					if(_rtag.handleEventDelegation)	{
						app.u.dump(" ------> using delegated events in anycontent, not app events ");
						app.u.handleEventDelegation($target);
						}
					else if(_rtag.skipAppEvents)	{}
					else	{
						app.u.handleAppEvents($target);
						}

					if(_rtag.applyEditTrackingToInputs)	{
						app.ext.admin.u.applyEditTrackingToInputs($target); //applies 'edited' class when a field is updated. unlocks 'save' button.
						}
					if(_rtag.handleFormConditionalDelegation)	{
						app.ext.admin.u.handleFormConditionalDelegation($('form',$target)); //enables some form conditional logic 'presets' (ex: data-panel show/hide feature)
						}

					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin.callbacks.anycontent, jqOjb not set or not an object ['+typeof _rtag.jqObj+'].','gMessage':true});
					}
				
				},
			onError : function(rd)	{
				if(rd._rtag && rd._rtag.jqObj && typeof rd._rtag.jqObj == 'object'){
					rd._rtag.jqObj.hideLoading().anymessage({'message':rd});
					}
				else	{
					$('#globalMessage').anymessage({'message':rd});
					}
				}
			}, //translateSelector


		translateSelector : {
			onSuccess : function(_rtag)	{
//				app.u.dump("BEGIN callbacks.translateSelector");
				if(typeof jQuery().hideLoading == 'function'){$(_rtag.selector).hideLoading();}
				app.renderFunctions.translateSelector(_rtag.selector,app.data[_rtag.datapointer]);
				}
			},
	
		transmogrify : 	{
			onSuccess : function(_rtag)	{
				var $parent = $(app.u.jqSelector('#',_rtag.parentID));
				if(typeof jQuery().hideLoading == 'function'){$parent.hideLoading();}
				$parent.append(app.renderFunctions.transmogrify({'id':_rtag.parentID+"_"+_rtag.datapointer},_rtag.templateID,app.data[_rtag.datapointer]));
				}
			}, //translateTemplate

		
//pass the following on _tag:
// parentID is the container id that the template instance is already in (should be created before call)
// templateID is the template that will get translated.
// the app.data.datapointer is what'll get passed in to the translate function as the data src. (ex: getProduct|PID)
		translateTemplate : 	{
			onSuccess : function(_rtag)	{
//				app.u.dump("BEGIN callbacks.translateTemplate"); app.u.dump(_rtag);
//				app.u.dump("typeof jQuery.hideLoading: "+typeof jQuery().hideLoading);
				if(typeof jQuery().hideLoading == 'function'){$(app.u.jqSelector('#',_rtag.parentID)).hideLoading();}
				app.renderFunctions.translateTemplate(app.data[_rtag.datapointer],_rtag.parentID);
				}
			}, //translateTemplate

// a generic callback to allow for success messaging to be added. 
// pass message for what will be displayed.  For error messages, the system messaging is used.
		showMessaging : {
			onSuccess : function(_rtag,macroResponses)	{
				app.u.dump("BEGIN app.callbacks.showMessaging");
				if(_rtag.jqObj)	{
//					app.u.dump(" -> jqObj is present.");
//					app.u.dump(" -> jqObj.data(): "); app.u.dump(_rtag.jqObj.data());
					_rtag.jqObj.hideLoading();
					if(_rtag.jqObjEmpty)	{
						_rtag.jqObj.empty();
						}
//you can't restore AND empty. it's empty, there's nothing to restore.
					else {
						if(_rtag.restoreInputsFromTrackingState)	{
							app.u.dump(" -> restoreInputsFromTrackingState.");
							app.ext.admin.u.restoreInputsFromTrackingState(_rtag.jqObj);
							}
						if(_rtag.removeFromDOMItemsTaggedForDelete)	{
							app.u.dump(" -> removeFromDOMItemsTaggedForDelete.");
							app.ext.admin.u.removeFromDOMItemsTaggedForDelete(_rtag.jqObj);
							}
						}
					}

				if(macroResponses && macroResponses['@RESPONSES'])	{
					var $target = _rtag.jqObj || $("#globalMessaging");
					macroResponses.persistent = _rtag.persistent === false ? false : true; //these responses should be displayed till turned off.
					$target.anymessage(macroResponses);
					}
				else	{
					var msg = app.u.successMsgObject(_rtag.message);
					msg['_rtag'] = _rtag; //pass in _rtag as well, as that contains info for parentID.
					app.u.throwMessage(msg);
					}
				}
			}, //showMessaging
		
		disableLoading : {
			onSuccess : function(_rtag)	{
				$('#'+_rtag.targetID).hideLoading();
				},
			onError : function(responseData)	{
				app.u.throwMessage(responseData);
				$('#'+responseData._rtag.targetID).hideLoading(); //even with the error, it's bad form to leave the loading bg.
				}
			},
/*
By default, error messaging is thrown to the appMessaging class. Sometimes, this needs to be suppressed. Add this callback and no errors will show.
ex: whoAmI call executed during app init. Don't want "we have no idea who you are" displayed as an error.
*/

		suppressErrors : {
			onSuccess : function(_rtag)	{
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

		handleCallback : function(_rtag)	{
			if(_rtag && _rtag.callback){
				if(typeof _rtag.callback == 'function')	{_rtag.callback(_rtag);}
				else	{
//				app.u.dump(" -> callback is not an anonymous function.");
					var callback;
//most callbacks are likely in an extension, but support for 'root' callbacks is necessary.
//save path to callback so that we can verify the onSuccess is a function before executing (reduce JS errors with this check)
					callback = _rtag.extension ? app.ext[_rtag.extension].callbacks[_rtag.callback] : app.callbacks[_rtag.callback];
//					app.u.dump(" -> typeof app.callbacks[_rtag.callback]: "+typeof callback);
					if(typeof callback.onSuccess == 'function')	{
						callback.onSuccess(_rtag);
						}
					else	{}//callback defined as string, but callback.onsuccess is not a function.
					}
				}
			else	{
//				app.u.dump(" -> no callback was defined. This may be perfectly normal");
				}
			}, //handleCallback


/*
Will load a file (.css, .js [script or extension]) or may be extended later to allow more.
The first two params are always type, then pass. pass is only used on files declared in the init. everything else gets loaded instantaneously.
The array order is based on the file type (i know, horrible idea).
script: type,pass,path,callback
extension: type,pass,namespace,path,callback
templateFunction: type,pass, template type (categoryTemplate, homepageTemplate, etc), stage (onInits, onCompletes, onDeparts), callback/function.
css : type, pass, path, id (id should be unique per css - allows for not loading same file twice)
*/

		loadResourceFile : function(arr)	{
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

			
			}, //loadResourceFile





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
				fileref.setAttribute('href', filename + "?_v="+app.vars.release);
				if(domID)	{fileref.setAttribute('id', domID);}
// Append link object inside html's head
				document.getElementsByTagName("head")[0].appendChild(fileref);
				}
			else	{
				//doh! no filename.
				}
			}, //loadCSSFile




//vars requires MIME_TYPE and body.
//vars.filename is optional
//opted to force this into a modal to reduce the likely of a bunch of unused blobs remaining on the DOM.
//the dialog will empty/remove itself when closed.
		fileDownloadInModal : function(vars)	{
			app.u.dump("BEGIN app.u.fileDownloadInModal");
			vars = vars || {};
			if(vars.mime_type && vars.body)	{
				app.u.dump(" -> mime type and body are set");
				var filename = vars.filename || 'file';
				var MIME_TYPE = vars.mime_type;

				var $D = $("<div \/>",{'title':'File Ready for Download'}).html("Your file is ready for download: <br />").appendTo(document.body);
				$D.dialog({
					'modal' : true,
					'autoOpen' : true,
					'width' : 300,
					'height' : 200,
					close: function(event, ui)	{
						$('body').css({'height':'auto','overflow':'auto'}) //bring browser scrollbars back.
//						app.u.dump('got into dialog.close - destroy.');
						$(this).dialog('destroy');
						$(this).intervaledEmpty(1000,1);
						} //will remove from dom on close
					});

// this worked, but not an ideal solution. we like blob better.
//			var uri = 'data:'+MIME_TYPE+',' + encodeURIComponent(vars.body);
//			var $a = $('<a>',{'download':filename || 'file',"href":uri}).text('download me data style').appendTo($D);
//			$("<br \/>").appendTo($D);

//if atob causes issues later, explore 	b64toBlob	 (found here: http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript); //201324		
//content returned on an API call will be base 64 encoded. app-generated content (report csv's) will not.
//app.u.dump("vars.skipdecode: "+vars.skipDecode);

				var	file = (vars.skipDecode) ? vars.body : atob(vars.body);
//					if(MIME_TYPE.toLowerCase().indexOf('image') >= 0)	{
					// Use typed arrays to convert the binary data to a Blob
					//http://stackoverflow.com/questions/10473932/browser-html-force-download-of-image-from-src-dataimage-jpegbase64
					var arraybuffer = new ArrayBuffer(file.length);
					var L = file.length;
					var view = new Uint8Array(arraybuffer);
					for (var i=0; i < L; i++) {
						view[i] = file.charCodeAt(i) & 0xff;
						}
					var bb = new Blob([arraybuffer], {type: 'application/octet-stream'});
//						}
//					else	{
//						var bb = new Blob(new Array(file), {type: vars.MIME_TYPE});
//						}
				
				var $a = $('<a>',{'download':filename,"href":window.URL.createObjectURL(bb)});

				$a.addClass('dragout').attr('data-downloadurl',[MIME_TYPE, $a.attr('download'), $a.attr('href')].join(':')).text('download ready').on('click',function(){
					var a = this;
					a.textContent = 'Downloaded';
					a.dataset.disabled = true;
					$D.dialog('close');
					// Need a small delay for the revokeObjectURL to work properly.
					//revokeObjectURL causes browser to drop reference to the file.
					setTimeout(function() {
						window.URL.revokeObjectURL(a.href);
						$D.empty().remove(); //nuke dialog.
						}, 1500);
					});

				
				$a.appendTo($D);
				}
			else	{
				$('#globalMessaging').anymessage({"message":"In admin.u.fileDownloadInModal, either mime_type ["+vars.mime_type+"] or body ["+typeof vars.body+"] not passed.","gMessage":true});
				}

			},





//The actual event type and the name used on the dom (focus, blur, etc) do not always match. Plus, I have a sneaking feeling we'll end up with differences between browsers.
//This function can be used to regularize the event type. Wherever possible, we'll map to the jquery event type name.
			normalizeEventType : function(type){
				var r = type;
				if(type == 'focusin')	{
					r = 'focus';
					}
				else if(type == 'focusout')	{
					r = 'blur';
					}
				return r;
				},
//run from inside the handleEventDelegation function
			executeEvent : function($target,p){
				p = p || {};
				var newEventType = app.u.normalizeEventType(p.type);
				app.u.dump(" ----> handle eventExecution ["+newEventType+"]");

				if($target && $target instanceof jQuery && newEventType)	{
//					app.u.dump(" -> $target.data()"); app.u.dump($target.data());
// ** 201342 -> once currentTarget was being used instead of e.target, this code became unnecessary.
//					if($target.data('app-'+newEventType))	{}
//					else	{$target = $target.closest("[data-app-"+newEventType+"]")}; //chrome doesn't seem to be bubbling up like I expected. registers a data-app that is on a button on the span for the icon/text
					
					if($target.data('app-'+newEventType))	{
						var
							actionExtension = $target.data('app-'+newEventType).split('|')[0],
							actionFunction =  $target.data('app-'+newEventType).split('|')[1];
		
						if(actionExtension && actionFunction)	{
							if(app.ext[actionExtension] && app.ext[actionExtension].e[actionFunction] && typeof app.ext[actionExtension].e[actionFunction] === 'function')	{
					//execute the app event.
								app.ext[actionExtension].e[actionFunction]($target,p);
								}
							else	{
								$('#globalMessaging').anymessage({'message':"In app.u.executeEvent, extension ["+actionExtension+"] and function["+actionFunction+"] both passed, but the function does not exist within that extension.",'gMessage':true})
								}
							}
						else	{
							$('#globalMessaging').anymessage({'message':"In app.u.executeEvent, app-click ["+$target.data('app-click')+"] is invalid.",'gMessage':true});
							}						
						}
					else	{
						$('#globalMessaging').anymessage({'message':"In app.u.executeEvent, $target doesn't have data-app-["+newEventType+"] set["+$target.data('app-'+newEventType)+"].",'gMessage':true})
						//
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':"In app.u.executeEvent, $target is empty or not a valid jquery instance [isValid: "+($target instanceof jQuery)+"] or p.type ["+newEventType+"] is not set.",'gMessage':true})
					}
				},

//run on a container to manage event delegation.  add a data-app-EVENTTYPE to an element, where EVENTTYPE is = to an event, such as click or change.
//The value of the data tag should be = "EXTENSION|FUNCTIONNAME" where extension = your extension and FUNCTIONNAME is the name of a function within the 'e' node.
//This code is used for adding events only, not styling.  Use renderFormats for that or the 'apply' classes.
//p in event = optional params. can be added when 'trigger' is executed. these are then passed into the app event and can be used to change behavior, if necessary.
//a class is added when event delegation is added. The class is checked for when the function is run to prevent double-delegation.
//a class is used instead of a data-attrib to be more efficient. Since we're adding/removing the class, it's 'safe' to use a class for this.
			handleEventDelegation : function($container)	{
//				app.u.dump("BEGIN app.u.handleEventDelegation");
//				app.u.dump(" -> $container.data('hasdelegatedevents'): "+$container.data('hasdelegatedevents'));
//				app.u.dump(" -> $container.closest('[data-hasdelegatedevents]').length: "+$container.closest('[data-hasdelegatedevents]').length);
//				app.u.dump(" -> $container.parents('[data-hasdelegatedevents]').length: "+$container.parents('[data-hasdelegatedevents]').length);

				if($container.data('hasdelegatedevents') || $container.closest('[data-hasdelegatedevents]').length >= 1)	{
					app.u.dump("handleEventDelegation was run on an element (or one of it's parents) that already has events delegated. DELEGATION SKIPPED.");
					}
				else	{
					var supportedEvents = new Array("click","change","focus","blur","submit");
					for(var i = 0; i < supportedEvents.length; i += 1)	{
						$container.on(supportedEvents[i],"[data-app-"+supportedEvents[i]+"]",function(e,p){
//							app.u.dump(" -> triggering the execute event code: "); app.u.dump(e);
							app.u.executeEvent($(e.currentTarget),$.extend(p,e));
							});						
						}
					$container.addClass('eventDelegation'); //here for the debugger.
					$container.attr('data-hasdelegatedevents',true); //is a attribute so that an element can look for it via parent()
					}
				},

			handleCommonPlugins : function($context)	{
				$('.applyAnycb',$context).anycb();
				$('.applyAnytable',$context).anytable();
				$('.toolTip',$context).tooltip();
				$('.applyAnytabs',$context).anytabs();
				},

// a utility for converting to jquery button()s.  use applyButton and optionally set some data attributes for text and icons.
			handleButtons : function($target)	{
//			app.u.dump("BEGIN app.u.handleButtons");
				if($target && $target instanceof jQuery)	{
					$('.applyButtonset',$target).each(function(){
						$(this).buttonset();
						});
					$('.applyButton',$target).each(function(index){
//					app.u.dump(" -> index: "+index);
						var $btn = $(this);
						$btn.button();
// SANITY -> $btn may NOT be on the DOM when this is run.
						if($btn.data('icon-primary') && $btn.data('icon-secondary'))	{
							$btn.button( "option", "icons", { primary: $btn.data('icon-primary'), secondary: $btn.data('icon-secondary')} );
							}
						else if($btn.data('icon-primary'))	{
							$btn.button( "option", "icons", { primary: $btn.data('icon-primary')} );
							}
						else if($btn.data('icon-secondary'))	{
							$btn.button( "option", "icons", { secondary: $btn.data('icon-secondary')} );
							}
						else	{} //no icon specified.
						
						if($btn.data('text') === false)	{
							$btn.button( "option", "text", false );
							}
						});
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In app.u.handleButtons, $target was empty or not a valid jquery instance. ","gMessage":true});
					}
				},

//a UI Action should have a databind of data-app-event (this replaces data-btn-action).
//value of action should be EXT|buttonObjectActionName.  ex:  admin_orders|orderListFiltersUpdate
//good naming convention on the action would be the object you are dealing with followed by the action being performed OR
// if the action is specific to a _cmd or a macro (for orders) put that as the name. ex: admin_orders|orderItemAddBasic
//obj is some optional data. obj.$content would be a common use.
			handleAppEvents : function($target,obj)	{
	//				app.u.dump("BEGIN app.u.handleAppEvents");
					obj = obj || {}; //needs to be outside 'each' or obj gets set to blank.
					if($target && $target.length && typeof($target) == 'object')	{
	//					app.u.dump(" -> target exists"); app.u.dump($target);
	//don't auto-pass context. will be harder for event delegation
						$("[data-app-event]",$target).each(function(){
							var $ele = $(this),
							extension = $ele.data('app-event').split("|")[0],
							action = $ele.data('app-event').split("|")[1];
							if(action && extension && app.ext[extension] && app.ext[extension].e && typeof app.ext[extension].e[action] == 'function'){
	//if an action is declared, every button gets the jquery UI button classes assigned. That'll keep it consistent.
	//if the button doesn't need it (there better be a good reason), remove the classes in that button action.
								app.ext[extension].e[action]($ele,obj);
								} //no action specified. do nothing. element may have it's own event actions specified inline.
							else	{
								app.u.throwGMessage("In admin.u.handleAppEvents, unable to determine action ["+action+"] and/or extension ["+extension+" typeof app.data.extension: "+(extension ? typeof app.data[extension] : 'undefined')+"] and/or extension/action combination is not a function");
								}
							});
						}
					else	{
						//don't throw error to user. target 'could' be in memory.
						app.u.dump("In admin.u.handleAppEvents, target was either not specified/an object ["+($target instanceof jQuery)+"] or does not exist on DOM.",'warn');
						}
					
					}, //handleAppEvents

			printByjqObj : function($ele)	{
				if($ele && $ele.length)	{
					var html="<html><style>@media print{.pageBreak {page-break-after:always} .hide4Print {display:none;}}</style><body style='font-family:sans-serif;'>";
					html+= $ele.html();
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
					$('#globalMessaging').anymessage({'message':'In app.u.printBySelector, $ele not passed or not on DOM','gMessage':true});
					}
				},

			printByElementID : function(id)	{
				if(id && $(app.u.jqSelector('#',id)).length)	{
					app.u.printByjqObj($(app.u.jqSelector('#',id)));
					}
				else	{
					app.u.dump("WARNING! - myRIA.a.printByElementID executed but not ID was passed ["+id+"] or was not found on DOM [$('#'+"+id+").length"+$('#'+id).length+"].");
					}
				}, //printByElementID

//pass in a string (my.string.has.dots) and a nested data object, and the dots in the string will map to the object and return the value.
//ex:  ('a.b',obj) where obj = {a:{b:'go pack go'}} -> this would return 'go pack go'
//will be used in updates to translator.

//http://stackoverflow.com/questions/5240785/split-abc/5240797#5240797
			getObjValFromString : function (s,obj,char)	{
				char = char || '.';
				var o=obj, attrs=s.split(char);
				while (attrs.length > 0) {
					o = o[attrs.shift()];
					//I don't think this is handling zero well. !!!
					if (!o) {o= null; break;}
					}
				return o;
	
				}, //getObjValFromString

			getDomainFromURL : function(URL)	{
				var r ; //what is returned. takes http://www.domain.com/something.html and converts to domain.com
				r = URL.replace(/([^:]*:\/\/)?([^\/]+\.[^\/]+)/g, '$2');
				if(r.indexOf('www.') == 0)	{r = r.replace('www.','')}
				if(r.indexOf('/'))	{r = r.split('/')[0]}
				return r;
				},
	
			isThisBitOn : function(bit,int)	{
				var B = Number(int).toString(2); //binary
				return (B.charAt(bit) == 1) ? true : false; //1
				},
	
	//http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
			guidGenerator : function() {
				var S4 = function() {
					return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
					};
				return (S4()+S4()+S4()+S4()+S4()+S4()+S4()+S4());
				},
	
	//jump to an anchor. can use a name='' or id=''.  anchor is used in function name because that's the common name for this type of action. do not need to pass # sign.
			jumpToAnchor : function(id)	{
				window.location.hash=id;
				},
	
	//uses throwMessage, but always adds the same generic message. value of 'err' is output w/ dump.
	//this should only be used for app errors (errors thrown from within the MVC, not as a result of an API call, in which case throwMessage should be used (handles request errors nicely)
			throwGMessage : function(err,parentID){
				var msg = this.youErrObject("Err: "+err+"<br \/>URI: "+document.location+"<br \/>Dev: console may contain additional details.","#");
				msg.gMessage = true;
				$(app.u.jqSelector('#',parentID || 'globalMessaging')).anymessage(msg);
				},
	/*
	msg could be a string or an object.
	if an object, could be: {errid,errmsg,errtype}   OR   {msg_X_txt,msg_X_type,msg_X_id}
	 -> if msg_X format, X will be an integer and _msgs will be set to indicate the # of messages.
	
	$target - a jquery object of the target/destination for the message itself. Will check err for parentID, targetID and if not present, check to see if globalMessaging is present AND visible.  If not visible, will open modal.
	returns the id of the message, so that an action can be easily added if needed (onclick or timeout w/ a hide, etc)
	
	persistent - this can be passed in as part of the msg object or a separate param. This was done because repeatedly, error messaging in the control
	and model that needed to be permanently displayed had to be converted into an object just for that and one line of code was turning into three.
	*/
			throwMessage : function(msg,persistent){
	//			app.u.dump("BEGIN app.u.throwMessage");
	//			app.u.dump(" -> msg follows: "); app.u.dump(msg);
	
				
	
				var $target, //where the app message will be appended.
				r = true; //what is returned. true if a message was output
	
				if(typeof msg === 'string')	{
					msg = this.youErrObject(msg,"#"); //put message into format anymessage can understand.
					}
	
				if(typeof msg === 'object')	{
	//				app.u.dump(" -> msg: "); app.u.dump(msg);
					if(msg._rtag && msg._rtag.jqObj)	{$target = msg._rtag.jqObj}
					else if(msg.parentID){$target = $(app.u.jqSelector('#',msg.parentID));}
					else if(msg._rtag && (msg._rtag.parentID || msg._rtag.targetID || msg._rtag.selector))	{
						if(msg._rtag.parentID)	{$target = $(app.u.jqSelector('#',msg._rtag.parentID))}
						else if(msg._rtag.targetID)	{$target = $(app.u.jqSelector('#',msg._rtag.targetID))}
						else	{
							$target = $(app.u.jqSelector(msg['_rtag'].selector.charAt(0),msg['_rtag'].selector));
							}
						}
					else if($('.appMessaging:visible').length > 0)	{$target = $('.appMessaging:visible');}
	// ** 201318 moved globalMessaging targeting above mainContentArea, as it is a much preferable alternative.
	//	target of last resort is now the body element
					else if($('#globalMessaging').length)	{$target = $('#globalMessaging')}
					else if($('#mainContentArea').length)	{$target = $('#mainContentArea')}
					else	{
						$target = $("<div \/>").attr('title',"Error!");
						$target.addClass('displayNone').appendTo('body'); 
						$target.dialog({
							modal: true,
							close: function(event, ui)	{
								$(this).dialog('destroy').remove();
								}
							});
						}
					$target.anymessage(msg);
					}
				else	{
					app.u.dump("WARNING! - unknown type ["+typeof err+"] set on parameter passed into app.u.throwMessage");
					r = false; //don't return an html id.
					}
	//get rid of all the loading gfx in the target so users know the process has stopped.
				$target.removeClass('loadingBG');
				if(typeof jQuery().hideLoading == 'function'){$target.hideLoading()} //used in UI. plan on switching everything applicable to this.
	// 			app.u.dump(" -> $target in error handling: "); app.u.dump($target);
				return r;
				},



// The next functions are simple ways to create success or error objects.
// pass in a message and the entire success object is returned.
// keep this simple. don't add support for icons or message type. If that degree of control is needed, build your own object and pass that in.
// function used in store_product (and probably more)
// once throwMessage is gone completely, we can nuke the uiClass and uiIcon
			successMsgObject : function(msg)	{
				return {'errid':'#','errmsg':msg,'message':msg,'errtype':'success','iconClass':'app-icon-success'}
				},
	
			errMsgObject : function(msg,errid)	{
				return {'errid':errid || '#','errmsg':msg,'errtype':'apperr','iconClass':'app-icon-error','containerClass':'ui-state-error'}
				},
			statusMsgObject : function(msg)	{
				return {'errid':'#','errmsg':msg,'errtype':'statusupdate','iconClass':'app-icon-warn','containerClass':'ui-state-statusupdate'}
				},
			youErrObject : function(errmsg,errid)	{
				return {'errid':errid,'errmsg':errmsg,'errtype':'youerr','iconClass':'ui-icon-youerr','containerClass':'ui-state-highlight'}
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
				}, //getParameterByName
	
//turn a set of key value pairs (a=b&c=d) into an object. pass location.search.substring(1); for URI params or location.hash.substring(1) for hash based params
			kvp2Array : function(s)	{
				var r = false;
				if(s && s.indexOf('=') > -1)	{
// ** 201346 -> an improved method for building the object. built in URI decoding.
	//				app.u.dump(s.replace(/"/g, "\",\x22"));
//					s = s.replace(/&amp;/g, '&'); //needs to happen before the decodeURIComponent (specifically for how banner elements are encoded )
					// .replace(/"/g, "\",\x22")
	//				app.u.dump('{"' + s.replace(/&/g, "\",\"").replace(/=/g,"\":\"") + '"}');
//					r = JSON.parse(decodeURIComponent('{"' + s.replace(/&/g, "\",\"").replace(/=/g,"\":\"") + '"}'));
					r = s?JSON.parse('{"' + s.replace(/&/g, '","').replace(/=/g,'":"') + '"}',function(key, value) { return key===""?value:decodeURIComponent(value) }):{};
//					app.u.dump(" -> r: "); app.u.dump(r);
					}
				else	{}
				return r;
				}, //kvp2Array
		

/*

AUTHENTICATION/USER

*/

//## allow for targetID to be passed in.
			logBuyerOut : function()	{
	//kill all the memory and localStorage vars used in determineAuthentication
				app.model.destroy('appBuyerLogin'); //nuke this so app doesn't fetch it to re-authenticate session.
				app.model.destroy('cartDetail'); //need the cart object to update again w/out customer details.
				app.model.destroy('whoAmI'); //need this nuked too.
				app.vars.cid = null; //used in soft-auth.
				localStorage.clear(); //clear everything from localStorage.
				
				app.calls.buyerLogout.init({'callback':'showMessaging','message':'Thank you, you are now logged out'});
				app.calls.refreshCart.init({},'immutable');
				app.model.dispatchThis('immutable');
				}, //logBuyerOut

			thisIsAnAdminSession : function()	{
				//while technically this could be spoofed, the API wouldn't accept invalid values
				return (app.vars.deviceid && app.vars.userid && app.vars.authtoken) ? true : false;
				}, //thisIsAnAdminSession
	
	//uses the supported methods for determining if a buyer is logged in/session is authenticated.
	//neither whoAmI or appBuyerLogin are in localStorage to ensure data from a past session isn't used.
			buyerIsAuthenticated : function()	{
				r = false;
				if(app.data.whoAmI && app.data.whoAmI.cid)	{r = true}
				else if(app.data.appBuyerLogin && app.data.appBuyerLogin.cid)	{r = true}
				return r;
				}, //buyerIsAuthenticated

//pretty straightforward. If a cid is set, the session has been authenticated.
//if the cid is in the cart/local but not the control, set it. most likely this was a cart passed to us where the user had already logged in or (local) is returning to the checkout page.
//if no cid but email, they are a guest.
//if logged in via facebook, they are a thirdPartyGuest.
//this could easily become smarter to take into account the timestamp of when the session was authenticated.
			
			determineAuthentication : function(){
				var r = 'none';
				if(this.thisIsAnAdminSession())	{r = 'admin'}
				else if(app.u.buyerIsAuthenticated())	{r = 'authenticated'}
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
				return r;
				}, //determineAuthentication
	
	
	
//pass in an array and all the duplicates will be removed.
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

//pass an object in as first param and an array as the second.
//This will return a NEW object, removing any keys from 'obj' that are not declared in 'whitelist'.
			getWhitelistedObject : function(obj,whitelist)	{
				var r = {};
				for(index in obj)	{
	// ** 201332 indexOf changed to $.inArray for IE8 compatibility, since IE8 only supports the indexOf method on Strings
					if($.inArray(index, whitelist) >= 0)	{
						r[index] = obj[index];
						}
					else	{} //not in whitelist
					}
				return r;
				},

//pass an object in as first param and an array as the second.
//This will return a NEW object, removing any keys from 'obj' that ARE declared in 'blacklist'
			getBlacklistedObject : function(obj,blacklist)	{
				var r = $.extend({},obj);
				for(index in obj)	{
	// ** 201332 indexOf changed to $.inArray for IE8 compatibility, since IE8 only supports the indexOf method on Strings
					if($.inArray(index, blacklist) >= 0)	{
						delete r[index];
						}
					else	{} //is not in blacklist
					}
				return r;
				},



//used in checkout to populate username: so either login or bill/email will work.
//never use this to populate the value of an email form field because it may not be an email address.
//later, this could be expanded to include a facebook id.
			getUsernameFromCart : function()	{
	//			app.u.dump('BEGIN u.getUsernameFromCart');
				var r = false;
				if(app.data.cartDetail && app.data.cartDetail.customer && app.u.isSet(app.data.cartDetail.customer.login))	{
					r = app.data.cartDetail.customer.login;
	//				app.u.dump(' -> login was set. email = '+r);
					}
				else if(app.data.cartDetail && app.data.cartDetail.bill && app.u.isSet(app.data.cartDetail.bill.email)){
					r = app.data.cartDetail.bill.email;
	//				app.u.dump(' -> bill/email was set. email = '+r);
					}
				else if(!jQuery.isEmptyObject(app.vars.fbUser))	{
	//				app.u.dump(' -> user is logged in via facebook');
					r = app.vars.fbUser.email;
					}
				return r;
				}, //getUsernameFromCart


/*

BROWSER/OS

*/


// .browser returns an object of info about the browser (name and version).
			getBrowserInfo : function()	{
	// *** .browser() is not supported as of jquery 1.9+
				var
					ua= navigator.userAgent.toLowerCase(),
					match = /(chrome)[ \/]([\w.]+)/.exec( ua ) || /(webkit)[ \/]([\w.]+)/.exec( ua ) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) || /(msie) ([\w.]+)/.exec( ua ) || ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) || [];
				//app.u.dump("browser: "+match[ 1 ] || "-" + match[ 2 ] || "0");
				return match[ 1 ] || "-" + match[ 2 ] || "0";
				}, //getBrowserInfo
			
			getOSInfo : function()	{
	
				var OSName="Unknown OS";
				if (navigator.appVersion.indexOf("Win")!=-1) OSName="WI";
				if (navigator.appVersion.indexOf("Mac")!=-1) OSName="MC";
				if (navigator.appVersion.indexOf("X11")!=-1) OSName="UN";
				if (navigator.appVersion.indexOf("Linux")!=-1) OSName="LI";
				return OSName;
				}, //getOSInfo



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

//* 201320 -> changed to support tab key.
		alphaNumeric : function(event)	{
			var r = true; //what is returned.
//			if((event.keyCode ? event.keyCode : event.which) == 8) {} //backspace. allow.
			var keyCode = event.keyCode ? event.keyCode : event.which
			if(keyCode == 8 || keyCode == 9)	{} //allows backspace and tabs now. 
			else	{
//				var key = String.fromCharCode(!event.charCode ? event.which : event.charCode);
				var key = String.fromCharCode(keyCode);
				var regex = new RegExp("^[a-zA-Z0-9]+$");
				if (!regex.test(key)) {
					event.preventDefault();
					r = false;
					}
				}
			return r;
			},

		isValidEmail : function(str) {
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    		return re.test(str);				
			}, //isValidEmail

//Currently, a fairly simple validation script. The browsers aren't always implementing their form validation for the dynamically generated content, so this
//is simple validator which can be extended over time.
//also, you can pass a fieldset in instead of the entire form (or any other jquery object) to validate just a portion of a form.
// checks for 'required' attribute and, if set, makes sure field is set and, if max-length is set, that the min. number of characters has been met.
// if you do any validation outside of this and use anymessage to report those errors, you'll need to clear them yourself.
		validateForm : function($form)	{
//			app.u.dump("BEGIN admin.u.validateForm");
			if($form && $form instanceof jQuery)	{

				
				var r = true; //what is returned. false if any required fields are empty.
				var radios = {};  //an object used to store whether or not radios are required and, if so, whether one is selected.
				$form.showLoading({'message':'Validating'});

				$('.formValidationError',$form).empty().remove(); //clear all previous error messaging
				var radios = {} //stores a list of which radio inputs are required.
				$('input, select, textarea',$form).each(function(){
					var
						$input = $(this),
						$span = $("<span \/>").css('padding-left','6px').addClass('formValidationError');
					
					$input.removeClass('ui-state-error'); //remove previous error class

//app.u.dump(" -> "+$input.attr('name')+": "+$input.attr('type'));

//					if($input.prop('type') != 'radio')	{
//						app.u.dump(" -> validating input name: "+$input.attr('name')+" required: "+$input.attr('required') || 'no')
//						}
					
					function removeClass($t){
						$t.off('focus.removeClass').on('focus.removeClass',function(){$t.removeClass('ui-state-error')});
						}

//					app.u.dump(" -> "+$input.attr('name')+" - required: "+$input.attr('required'));
					if($input.is(':hidden') && $input.data('validation-rules') && $input.data('validation-rules').indexOf('skipIfHidden') >= 0)	{
						//allows for a form to allow hidden fields that are only validated if they're displayed. ex: support fieldset for topic based questions.
						//indexOf instead of == means validation-rules (notice the plural) can be a comma seperated list
						}
					else if($input.prop('disabled')){} //do not validate disabled fields. if required and blank and disabled, form would never submit.
					else if($input.prop('type') == 'radio'){
//keep a list of all required radios. only one entry per name.
//app.u.dump(" -> $input.attr('name'): "+$input.attr('name')+' and required: '+$input.attr('required'));

						if($input.attr('required') == 'required')	{
							radios[$input.attr('name')] = 1
							}
						}
//only validate the field if it's populated. if it's required and empty, it'll get caught by the required check later.
					else if($input.attr('type') == 'url' && $input.val())	{
						var urlregex = new RegExp("^(http:\/\/|https:\/\/|ftp:\/\/){1}([0-9A-Za-z]+\.)");
						if (urlregex.test($input.val())) {}
						else	{
							r = false;
							$input.addClass('ui-state-error');
							$input.after($span.text('not a valid url. '));
							$("<span class='toolTip' title='A url must be formatted as http, https, or ftp ://www.something.com/net/org/etc'>?<\/span>").tooltip().appendTo($span);
							}
						}

// * 201336 -> make sure a number input has a numerical value.
					else if($input.attr('type') == 'number' && $input.val())	{
//						app.u.dump(" -> number validation. value: "+$input.val()+" and isNaN: "+isNaN($input.val()));
						if (!isNaN($input.val())) {
							if($input.attr('min') && (Number($input.val()) < Number($input.attr('min'))))	{
								r = false;
								$input.addClass('ui-state-error');
								$input.after($span.text('minimum value of '+$input.attr('min')+'. '));
								}
							else if($input.attr('max') && (Number($input.val()) > Number($input.attr('max'))))	{
								r = false;
								$input.addClass('ui-state-error');
								$input.after($span.text('max value of '+$input.attr('max')+'. '));
								}
							else	{
//								app.u.dump(" -> everything appears to check out w/  "+$input.attr('name')+" number input.");
								}
							}
						else	{
							app.u.dump(" -> value is not a number");
							r = false;
							$input.addClass('ui-state-error');
							$input.after($span.text('not a number. '));
							}
						}

					else if ($input.attr('type') == 'email' && !app.u.isValidEmail($input.val()))	{
						//only 'error' if field is required. otherwise, show warning
// ** 201330 -> field was erroring if email was invalid even if field was not required.						
						if($input.attr('required') == 'required')	{
							r = false;
							$input.addClass('ui-state-error');
							}
						else if($input.val())	{
							$input.after($span.text('not a valid email address'));
							removeClass($input);
							}
						else	{} //field is not required and blank.
						}
//* 201336 -> technically, maxlength isnt supported on a text area. so data-maxlength is used instead.
					else if(($input.attr('maxlength') && $input.val().length > $input.attr('maxlength')) || ($input.attr('data-maxlength') && $input.val().length > $input.attr('data-maxlength')))	{
						r = false;
						$input.addClass('ui-state-error');
						$input.after($span.text('allows a max of '+($input.attr('maxlength') || $input.attr('data-maxlength'))+' characters'));
						removeClass($input);
						}
//** 201318 -> error was being reported incorrectly.
					else if($input.data('minlength') && $input.val().length < $input.data('minlength'))	{
						r = false;
						$input.addClass('ui-state-error');
						$input.after($span.text('requires a minimum of '+$input.data('minlength')+' characters'));
						removeClass($input);
						}
// * 201320 -> now support 'min' attr which is the minimum numerical value (ex: 0 or 7) for the input value.
//number input type has a native min for minimum value
					else if($input.attr('min') && Number($input.val()) < Number($input.attr('min')))	{
						r = false;
						$input.addClass('ui-state-error');
						$input.after($span.text('requires a minimum value of '+$input.attr('min')));
						removeClass($input);
						}
// * 201320 -> now support 'min' attr which is the minimum numerical value (ex: 0 or 7) for the input value.
//number input type has a native min for minimum value
					else if($input.attr('max') && Number($input.val()) > Number($input.attr('max')))	{
						r = false;
						$input.addClass('ui-state-error');
						$input.after($span.text('requires a maximum value of '+$input.attr('max')));
						removeClass($input);
						}
//** 201318 -> moved this down so that the more specific error messages would be displayed earlier
					else if($input.attr('required') == 'required' && !$input.val())	{
						r = false;
						$input.addClass('ui-state-error');
						$input.after($span.text('required'));
						removeClass($input);
						}
					else	{
						
						}
					
					if($input.hasClass('ui-state-error'))	{
						app.u.dump(" -> "+$input.attr('name')+" did not validate. ishidden: "+$input.is(':hidden'));
						}
					
					});
//app.u.dump(" -> radios:"); app.u.dump(radios);
				if(!$.isEmptyObject(radios))	{
//					app.u.dump(" -> radios is not empty");
					var L = radios.length;
					for(var index in radios)	{
						if($("input:radio[name='"+index+"']:checked",$form).val())	{
//							app.u.dump(" -> radio name='"+index+"' has a value selected");
							} //is selected.
						else	{
							var message = "<div class='formValidationError clearfix marginTop marginBottom ui-state-error smallPadding ui-corner-all'>Please select one choice from the list below:<\/div>"
							if($("input:radio[name='"+index+"']:first",$form).closest("[data-app-role='radioContainer']").length)	{
								$("input:radio[name='"+index+"']:first",$form).closest("[data-app-role='radioContainer']").prepend(message)
								}
							else	{
								$("input:radio[name='"+index+"']",$form).first().closest('fieldset').prepend(message)
								}
							}
						}
					//check to see if the required radios have a value set. this list only contains radio input names that are required.
					//if none are selected. add ui-state-error to each radio input of that name.
					}
				$form.hideLoading();
				}
			else	{
				$('#globalMessaging').anymessage({'message':'Object passed into admin.u.validateForm is empty or not a jquery object','gMessage':true});
				}
//			app.u.dump(" -> r in validateForm: "+r);
			return r;
			},







//used frequently to throw errors or debugging info at the console.
//called within the throwError function too
		dump : function(msg,type)	{
			type = type || 'log'; //supported types are 'warn' and 'error'
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
				else if(type == 'greet')	{
					console.log("%c\n\n"+msg+"\n\n",'color: purple; font-weight: bold;')
					}
				else if(console[type])	{
					console[type](msg);
					}
				else	{} //hhhhmm... unsupported type.
					
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
//			app.u.dump(a);
// ** 201318 -> other libs are no longer supported. forced to username
//			a.lib = app.u.isSet(a.lib) ? a.lib : app.vars.username;  //determine protocol
			a.m = a.m ? 'M' : '';  //default to minimal mode off. If anything true value (not 0, false etc) is passed in as m, minimal is turned on.
//			app.u.dump(' -> library: '+a.lib+' and name: '+a.name);
			if(a.name == null) { a.name = 'i/imagenotfound'; }
			
			var url, tag;
			// alert(a.lib);		// uncomment then go into media library for some really wonky behavior 
		
				//default height and width to blank. setting it to zero or NaN is bad for IE.
// *** 201338 Added better handling for when no parameters are set, as well as a bug fix where a necessary '-' character was being removed
// from a valid use case. -mc
			if(a.h == null || a.h == 'undefined' || a.h == 0)
				a.h = '';
			if(a.w == null || a.w == 'undefined' || a.w == 0)
				a.w = '';
			if(a.b == null || a.b == 'undefined')
				a.b = '';
// *** 201318 -> new url for media library.			
//			url = location.protocol === 'https:' ? 'https:' : 'http:';  //determine protocol
//			url += '\/\/static.zoovy.com\/img\/'+a.lib+'\/';
//In an admin session, the config.js isn't loaded. The secure domain is set as a global var when a domain is selected or can be retrieved from adminDomainList
			if(app.vars.thisSessionIsAdmin)	{
				url = 'https:\/\/'+(app.vars.https_domain || app.data['adminDomainList']['media-host']);
				//make sure domain ends in a /
				if(url.charAt(url.length) != '/')	{
					url+="\/"
					}
				url += "media\/img\/"+app.vars.username+"\/";
				}
			else	{
				url = location.protocol === 'https:' ? zGlobals.appSettings.https_app_url : zGlobals.appSettings.http_app_url;
				url += "media\/img\/"+app.vars.username+"\/";
				}
				
			if(!a.w && !a.h && !a.b && !a.m){
				url += '-';
				}
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
// *** 201338 Moved up into the else statement so that the valid case of no parameters produces the expected URL containing "/-/" instead of "//" -mc
				if(url.charAt(url.length-1) == '-')	{
					url = url.slice(0,url.length-1); //strip trailing - because it isn't stricly 'compliant' with media lib specs.
					}
				}
			url += '\/'+a.name;

//			app.u.dump(" -> URL: "+url);
			
			if(a.tag == true)	{
				a['class'] = typeof a['class'] == 'string' ? a['class'] : ''; //default class to blank
				a['id'] = typeof a['id'] == 'string' ? a['id'] : 'img_'+a.name; // default id to filename (more or less)
				a['alt'] = typeof a['alt'] == 'string' ? a['alt'] : a.name; //default alt text to filename
// ** 201318 if width and height are present, they are added to the tag.  This solves an issue that occurs in loading
//	pic sliders where the width of the images, and thus the scroll amount, is not calculated correctly the first time
//	the slider loads
				var tag = "<img src='"+url+"' alt='"+a.alt+"' id='"+a['id']+"' class='"+a['class']+"'"
				if(a.w){
					tag+=" width='"+a.w+"'";
				}
				if(a.h){
					tag+=" height='"+a.h+"'";
				}
				tag += " \/>";
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
			}, //getCCExpMonths


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
				r = phoneNumber ? true : false;
				}
			return r;
			}, //isValidPhoneNumber

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
			app.u.dump("BEGIN app.u.handleThirdPartyInits");

			var uriParams = app.u.kvp2Array(location.hash.substring(1));
			//landing on the admin app, having been redirected after logging in to google.
			if(uriParams.trigger == 'googleAuth')	{
				app.calls.authAdminLogin.init({
					'authtype' : 'google:id_token',
					'id_token' : uriParams.id_token
					},{'datapointer' : 'authAdminLogin','callback':'showHeader','extension':'admin'},'immutable');
				app.model.dispatchThis('immutable');
				}
			//just returned from google
			else if(uriParams.id_token && uriParams.state)	{

				if(uriParams.state)	{
					
					app.u.dump(" -> state was defined as a uri param");
					var state = jQuery.parseJSON(atob(uriParams.state));
					app.u.dump(" -> post decode/parse state:");	app.u.dump(state);
//to keep the DOM as clean as possible, only declare this function if it's needed.					
					if(state.onReturn == 'return2Domain')	{
						window.return2Domain = function(s,uP){
							document.location = s.domain+"#trigger=googleAuth&access_token="+uP.access_token+"&id_token="+uP.id_token
							}
						}
					
					if(state.onReturn && typeof window[state.onReturn] == 'function')	{
						window[state.onReturn](state,uriParams);
						}
					else	{
						app.u.dump(" -> state was defined but either onReturn ["+state.onReturn+"] was not set or not a function [typeof: "+typeof window[state.onReturn]+"].");
						}
					}

				}

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
			}, //handleThirdPartyInits

//executed inside handleTHirdPartyInits as well as after a facebook login.

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
				if(app.data.cartDetail['@ITEMS'][i]['%attribs'] && app.data.cartDetail['@ITEMS'][i]['%attribs']['gc:blocked'])	{obj.googlecheckout = false}
				if(app.data.cartDetail['@ITEMS'][i]['%attribs'] && app.data.cartDetail['@ITEMS'][i]['%attribs']['paypalec:blocked'])	{obj.paypalec = false}
				}

			return obj;
			},

// This function is in the controller so that it can be kept fairly global. It's used in checkout, store_crm (buyer admin) and will likely be used in admin (orders) at some point.
// ### NOTE! SANITY ! WHATEVER - app.ext.convertSessionToOrder.vars is referenced below. When this is removed, make sure to update checkouts to add an onChange event to update the app.ext.convertSessionToOrder.vars object because otherwise the CC number won't be in memory and possibly won't get sent as part of calls.cartOrderCreate.

		getSupplementalPaymentInputs : function(paymentID,data,isAdmin)	{
			var $o; //what is returned. a jquery object (ul) w/ list item for each input of any supplemental data.
			if(paymentID)	{
				app.u.dump(" -> USING OLD VERSION of getSupplementalPaymentInputs. CHANGE TO NEW in cco");
				//NOTE -> this function wasn't just deleted because extensive testing needs to occur to the checkouts/UI and I'm still in dev on the new version of the function.
	//				app.u.dump("BEGIN control.u.getSupplementalPaymentInputs ["+paymentID+"]");
	//				app.u.dump(" -> data:"); app.u.dump(data);
				
				$o = $("<ul />").attr("id","paybySupplemental_"+paymentID).addClass("paybySupplemental");
				var safeid = ''; //used in echeck loop. recycled in loop.
				var tmp = ''; //tmp var used to put together string of html to append to $o
				
				var payStatusCB = "<li><label><input type='checkbox' name='flagAsPaid' \/>Flag as paid<\/label><\/li>"
				
	//			app.u.dump(" -> paymentID.substr(0,6): "+paymentID.substr(0,7));
				if(paymentID.substr(0,7) == 'WALLET:')	{
					paymentID = 'WALLET';
					}			
				app.u.dump(" -> PAYMENTID: "+paymentID);
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
						
						tmp += "<li><label for='payment/CV'>CVV/CID<\/label><input type='text' size='4' name='payment/CV' id='payment-cv' class=' creditCardCVV' onKeyPress='return app.u.numbersOnly(event);' value='";
						if(data['payment/CV']){tmp += data['payment/CV']}
						tmp += "'  required='required' /> <span class='ui-icon ui-icon-help' onClick=\"$('#cvvcidHelp').dialog({'modal':true,height:400,width:550});\"></span><\/li>";
						
						if(isAdmin === true)	{
							tmp += "<li><label><input type='radio' name='VERB' value='AUTHORIZE'>Authorize<\/label><\/li>"
							tmp += "<li><label><input type='radio' name='VERB' value='CHARGE'>Charge<\/label><\/li>"
							tmp += "<li class='hint'>Use refund action in transaction history to issue refund.<\/li>"
							}
						
						
						break;
	
						case 'WALLET':
							if(isAdmin === true)	{
								tmp += "<div><label><input type='radio' name='VERB' value='AUTHORIZE'>Authorize<\/label><\/div>"
								tmp += "<div><label><input type='radio' name='VERB' value='CHARGE' checked='checked'>Charge<\/label><\/div>"
								}
							else	{$o = false;} //inputs are only present in admin interface.
						break;
						
						case 'CASH':
						case 'MO':
						case 'CHECK':
						case 'PICKUP':
	//will output a flag as paid checkbox ONLY in the admin interface.
	//if this param is passed in a store, it will do nothing.
						if(isAdmin === true)	{
							tmp += payStatusCB;
							}
						break;
	
					case 'PO':
						tmp += "<li><label for='payment-po'>PO #<\/label><input type='text' size='10' name='payment/PO' id='payment-po' class=' purchaseOrder' value='";
						if(data['payment/PO'])
								tmp += data['payment/PO'];
						tmp += "' /><\/li>";
						if(isAdmin === true)	{
							tmp += payStatusCB;
							}
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
				}
			return $o;
//				app.u.dump(" -> $o:");
//				app.u.dump($o);
			}

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
//				app.u.dump(" -> transmogrify has everything it needs.");
//we have everything we need. proceed.

var $r = app.templates[templateID].clone(); //clone is always used so original is 'clean' each time it's used. This is what is returned.
//app.u.dump(" -> template cloned");
$r.attr('data-templateid',templateID); //note what templateID was used. handy for troubleshooting or, at some point, possibly re-rendering template
if(app.u.isSet(eleAttr) && typeof eleAttr == 'string')	{
//	app.u.dump(' -> eleAttr is a string.');
	$r.attr('id',app.u.makeSafeHTMLId(eleAttr)) 
	}
//NOTE - eventually, we want to get rid of this check and just use the .data at the bottom.
else if(typeof eleAttr == 'object')	{
//	app.u.dump(' -> eleAttr is an object.');
// applying an empty object as .data caused a JS error in IE8
	if($.isEmptyObject(eleAttr))	{
//		app.u.dump(" -> eleAttr is empty");
		}
	else	{
//		app.u.dump(" -> eleAttr is NOT empty");
		for(var index in eleAttr)	{
			if(typeof eleAttr[index] == 'object')	{
				//can't output an object as a string. later, if/when data() is used, this may be supported.
				}
			else if(index.match("^[a-zA-Z0-9_\-]*$"))	{
				$r.attr('data-'+index,eleAttr[index]) //for now, this is being added via attr data-. later, it may use data( but I want it in the DOM for now.
				}
			else	{
				//can't have non-alphanumeric characters in 
				}
			}
		$r.data(eleAttr);
		}
// * 201324 -> absence of eleAttr check caused JS error
// ** 201324 -> attempting to get rid of this makeSafe function. jqSelector on the selector side should handle these.
//	if(eleAttr && eleAttr.id)	{$r.attr('id',app.u.makeSafeHTMLId(eleAttr.id))} //override the id with a safe id, if set.
	if(eleAttr && eleAttr.id)	{$r.attr('id',eleAttr.id)} //override the id with a safe id, if set.
	}
//app.u.dump(" -> got through transmogrify. now move on to handle translation and return it.");
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
//
$r.find('[data-bind]').addBack('[data-bind]').each(function()	{
										   
	var $focusTag = $(this);
	var value;

//	app.u.dump(' -> data-bind match found: '+$focusTag.data('bind'));
//proceed if data-bind has a value (not empty).
	if(app.u.isSet($focusTag.attr('data-bind'))){
		var bindData = app.renderFunctions.parseDataBind($focusTag.attr('data-bind'));
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
	else	{bindData.hideZero = true}
// SANITY - value should be set by here. If not, likely this is a null value or isn't properly formatted.
//	app.u.dump(" -> value: "+value);

	if(Number(value) == 0 && bindData.hideZero)	{
//do nothing. value is zero and zero should be skipped.
//		app.u.dump(" -> value is 0 but was skipped: "+bindData['var']);
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
// ** 201342 -> added forceRender. if true, will always execute the render format, regardless of whether a value is set on the attribute.
	else if(value || (Number(value) == 0 && bindData.hideZero === false) || bindData.forceRender)	{
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
//		app.u.dump(' -> data-bind is set, but it has no/invalid value: '+bindData['var']+" Number(value): "+Number(value)+" and bindData.hideZero: "+bindData.hideZero);
		if($focusTag.prop('tagName') == 'IMG'){$focusTag.remove()} //remove empty/blank images from dom. necessary for IE.

		}
	value = ''; //reset value.
	}); //end each for children.
$r.removeClass('loadingBG');
//		app.u.dump('END translateTemplate');
return $r;			
			
			}, //handleTranslation

//each template may have a unique set of required parameters.

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
			if(v)	{
				r = v.replace(/.*\(|\)/gi,'');
				}
			else	{r = false;}
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
		imageURL2Href : function($tag,data)	{
			data.bindData.name = (data.bindData.valuePretext) ? data.bindData.valuePretext+data.value : data.value;
			data.bindData.w = $tag.attr('width');
			data.bindData.h = $tag.attr('height');
			data.bindData.tag = 0;
			$tag.attr('href',app.u.makeImage(data.bindData)); //passing in bindData allows for using
			},

		imageURL : function($tag,data){
//			app.u.dump('got into displayFunctions.image: "'+data.value+'"');
			data.bindData.b = data.bindData.bgcolor || 'ffffff'; //default to white.
			
			if(data.bindData.isElastic) {
				data.bindData.elasticImgIndex = data.bindData.elasticImgIndex || 0; //if a specific image isn't referenced, default to zero.
				data.value = data.value[data.bindData.elasticImgIndex];
				};
			if(data.value)	{
//set some recommended/required params.
				data.bindData.name = (data.bindData.valuePretext) ? data.bindData.valuePretext+data.value : data.value;
				data.bindData.w = $tag.attr('width');
				data.bindData.h = $tag.attr('height');
				data.bindData.tag = 0;
				$tag.attr('src',app.u.makeImage(data.bindData)); //passing in bindData allows for using
				}
			else	{
//				$tag.css('display','none'); //if there is no image, hide the src. 
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
//make any inputs for coupons disabled. it is possible for stid to not be set, such as a fake product in admin_ordercreate unstructured add.
				if(stid && stid[0] == '%')	{$o.find(':input').attr({'disabled':'disabled'}).addClass('disabled')}
				$tag.append($o);
				}
			}, //stuffList

//handy for enabling tabs and whatnot based on whether or not a field is populated.
//doesn't actually do anything with the value.
		showIfSet : function($tag,data)	{
//			app.u.dump(" -> showIfSet: "+data.value);
			if(data.value)	{
				$tag.show().css('display','block'); //IE isn't responding to the 'show', so the display:block is added as well.
				}
			},

		showIfMatch : function($tag,data)	{
//			app.u.dump("BEGIN renderFormat.showIfMatch. \n value: "+data.value+"\n matchValue: "+data.bindData.matchValue);
			if(data.value == data.bindData.matchValue)	{$tag.show()}
			else {} //can't count on getting here. value could be blank. hide by default, then let this show if it's a match.
			},

//handy for enabling tabs and whatnot based on whether or not a field is populated.
//doesn't actually do anything with the value.
		hideIfSet : function($tag,data)	{
			if(data.value)	{
				$tag.hide(); //IE isn't responding to the 'show', so the display:block is added as well.
				}
			},
//EX:  data-bind='var: (@LIST);format:optionsFromList; text:pretty; value:safeid;'
		optionsFromList : function($tag,data)	{
//			app.u.dump("BEGIN renderFormats.optionsFromList.  data.value: "); app.u.dump(data.value);
//			var L = data.value.length;
			for(var index in data.value)	{
				$("<option \/>").val((data.bindData.value) ? data.value[index][data.bindData.value] : data.value[index]).text((data.bindData.text) ? data.value[index][data.bindData.text] : data.value[index]).appendTo($tag);
				}
//			for(var i = 0; i < L; i += 1)	{
//				$("<option \/>").val((data.bindData.value) ? data.value[i][data.bindData.value] : data.value[i]).text((data.bindData.text) ? data.value[i][data.bindData.text] : data.value[i]).appendTo($tag);
//				}
			},

//for embedding. There is an action for showing a youtube video in an iframe in quickstart.
// hint: set the action as an onclick and set attribute youtube:video id on element and use jquery to pass it in. 
//ex: data-bind='var:product(youtube:videoid);format:assignAttribute; attribute:data-videoid;' onClick="app.ext.myRIA.a.showYoutubeInModal($(this).attr('data-videoid'));
		youtubeVideo : function($tag,data){
			var width = data.bindData.width ? data.bindData.width : 560
			var height = data.bindData.height ? data.bindData.height : 315
			var r = "<iframe style='z-index:1;' width='"+width+"' height='"+height+"' src='"+(document.location.protocol === 'https:' ? 'https:' : 'http:')+"//www.youtube.com/embed/"+data.value+"' frameborder='0' allowfullscreen></iframe>";
			$tag.append(r);
			},

		paypalECButton : function($tag,data)	{

if(zGlobals.checkoutSettings.paypalCheckoutApiUser)	{
	var payObj = app.u.which3PCAreAvailable();
	if(payObj.paypalec)	{
		$tag.empty().append("<img width='145' id='paypalECButton' height='42' border='0' src='"+(document.location.protocol === 'https:' ? 'https:' : 'http:')+"//www.paypal.com/en_US/i/btn/btn_xpressCheckoutsm.gif' alt='' />").addClass('pointer').off('click.paypal').on('click.paypal',function(){
			app.ext.cco.calls.cartPaypalSetExpressCheckout.init({'getBuyerAddress':1},{'callback':function(rd){
				$('body').showLoading({'message':'Obtaining secure PayPal URL for transfer...','indicatorID':'paypalShowLoading'});
				if(app.model.responseHasErrors(rd)){
					$(this).removeClass('disabled').attr('disabled','').removeAttr('disabled');
					$('#globalMessaging').anymessage({'message':rd});
					}
				else	{
					if(app.data[rd.datapointer] && app.data[rd.datapointer].URL)	{
						$('.ui-loading-message','#loading-indicator-paypalShowLoading').text("Transferring you to PayPal to authorize payment. See you soon!");
						document.location = app.data[rd.datapointer].URL;
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In paypalECButton render format, dispatch to obtain paypal URL was successful, but no URL in the response.","gMessage":true});
						}
					}
				}});
			$(this).addClass('disabled').attr('disabled','disabled');
			app.model.dispatchThis('immutable');
			});
		}
	else	{
		$tag.empty().append("<img width='145' id='paypalECButton' height='42' border='0' src='"+(document.location.protocol === 'https:' ? 'https:' : 'http:')+"//www.paypal.com/en_US/i/btn/btn_xpressCheckoutsm.gif' alt='' />").addClass('disabled').attr('disabled','disabled');
		}
	}
else	{
	$tag.addClass('displayNone');
	}
			}, //paypalECButton

		googleCheckoutButton : function($tag,data)	{

if(zGlobals.checkoutSettings.googleCheckoutMerchantId && (window._gat && window._gat._getTracker))	{
	var payObj = app.u.which3PCAreAvailable(); //certain product can be flagged to disable googlecheckout as a payment option.
	if(payObj.googlecheckout)	{
	$tag.append("<img height=43 width=160 id='googleCheckoutButton' border=0 src='"+(document.location.protocol === 'https:' ? 'https:' : 'http:')+"//checkout.google.com/buttons/checkout.gif?merchant_id="+zGlobals.checkoutSettings.googleCheckoutMerchantId+"&w=160&h=43&style=trans&variant=text&loc=en_US' \/>").one('click',function(){
		app.ext.cco.calls.cartGoogleCheckoutURL.init();
		$(this).addClass('disabled').attr('disabled','disabled');
		app.model.dispatchThis('immutable');
		});
		}
	else	{
		$tag.append("<img height=43 width=160 id='googleCheckoutButton' border=0 src='"+(document.location.protocol === 'https:' ? 'https:' : 'http:')+"://checkout.google.com/buttons/checkout.gif?merchant_id="+zGlobals.checkoutSettings.googleCheckoutMerchantId+"&w=160&h=43&style=trans&variant=disable&loc=en_US' \/>")			
		}
	}
else if(zGlobals.checkoutSettings.googleCheckoutMerchantId)	{
	app.u.dump("zGlobals.checkoutSettings.googleCheckoutMerchantId is set, but _gaq is not defined (google analytics not loaded but required)",'warn');
	}
else	{
	$tag.addClass('displayNone');
	}
	
			}, //googleCheckoutButton

		amazonCheckoutButton : function($tag,data)	{

if(zGlobals.checkoutSettings.amazonCheckoutMerchantId && zGlobals.checkoutSettings.amazonCheckoutEnable)	{
	//tmp for testing
	$tag.append("<img id='amazonCheckoutButton' border=0 src='"+(document.location.protocol === 'https:' ? 'https:' : 'http:')+"'//payments.amazon.com/gp/cba/button?ie=UTF8&color=orange&background=white&size=small' \/>").click(function(){
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
// ** 201332 NOTE: data.value is assumed to be a String, a comma separated list of values.  If it were an array, we would
//				need to use $.inArray instead of indexOf for IE8 compatibility
				if(data.value.indexOf(whitelist[i]) >= 0 && (tagsDisplayed <= maxTagsShown))	{

					spans += "<span class='tagSprite "+whitelist[i].toLowerCase()+"'><\/span>";
					tagsDisplayed += 1;
					}
				}
			$tag.append(spans);
			}, //addTagSpans

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

		epoch2pretty : function($tag,data)	{
			var myDate = new Date( data.value*1000);
			$tag.append(myDate.getFullYear()+"/"+((myDate.getMonth()+1) < 10 ? '0'+(myDate.getMonth()+1) : (myDate.getMonth()+1))+"/"+(myDate.getDate() < 10 ? '0'+myDate.getDate() : myDate.getDate())+" "+(myDate.getHours() < 10 ? '0'+myDate.getHours() : myDate.getHours())+":"+(myDate.getMinutes() < 10 ? '0'+myDate.getMinutes() : myDate.getMinutes())); //+":"+myDate.getSeconds() pulled seconds in 201307. really necessary?
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
//for use on radio buttons when the button is part of the template and the value of that button needs to be populated from a var (ex: checkout wallets)
		setVal : function($tag,data)	{
			$tag.val(data.value);
			},

//for use on inputs.
//populates val() with the value
// ** 201324 -> rather than having separate renderFormats for different input types, this can now be used for all.
//				cb needs to use 'prop' not 'attr'. That is the right way to do it.
		popVal : function($tag,data){
			if($tag.is(':checkbox'))	{
//				app.u.dump(" -> popVal, is checkbox. value: "+data.value+" and number: "+Number(data.value));
				if(Number(data.value) === 0)	{
					$tag.prop('checked',false); //have to handle unchecking in case checked=checked when template created.
					}
				else	{
//the value here could be checked, on, 1 or some other string. if the value is set (and we won't get this far if it isn't), check the box.
					$tag.prop('checked',true);
					}
				}
			else if($tag.is(':radio'))	{
//with radio's the value passed will only match one of the radios in that group, so compare the two and if a match, check it.
				if($tag.val() == data.value)	{$tag.prop('checked','checked')}
				}
			else if($tag.is('select') && $tag.attr('multiple') == 'multiple')	{
//				app.u.dump("GOT HERE!!!!!!!!!!!!!!!!");
				if(typeof data.value === 'object')	{
//					app.u.dump(" -> value is an object.");
					var L = data.value.length;
					for(var i = 0; i < L; i += 1)	{
//						app.u.dump(" -> data.value[i]: "+data.value[i]);
						$('option[value="' + data.value[i] + '"]',$tag).prop('selected','selected');
						}
					}
				}
			else	{
//for all other inputs and selects, simply setting the value will suffice.
				if($tag.data('stringify'))	{
					$tag.val(JSON.stringify(data.value));
					}
				else	{
					$tag.val(data.value);
// *** 201344 -> added defaultVal prop.
					$tag.prop('defaultValue',data.value); //allows for tracking the difference onblur.
					}
				}
			
			if($tag.data('trigger'))	{
				if($tag.is('select'))	{}
				else	{
					$tag.trigger($tag.data('trigger'))
					}
				}
			
			}, //text

// * 201318 -> allows for data-bind on a radio input.
// *** 201324 -> retired in favor of a more versatile popVal.
/*		popRadio : function($tag,data)	{
			if($tag.val() == data.value)	{$tag.attr('checked','checked')}
			},
*/
//only use this on fields where the value is boolean
//if setting checked=checked by default, be sure to pass hideZero as false.
// *** 201324 -> retired in favor of a more versatile popVal.
/*		popCheckbox : function($tag,data){
			if(Number(data.value))	{$tag.attr('checked',true);}
			else if(data.value === 'on')	{$tag.attr('checked',true);}
			else if(data.value == true)	{$tag.attr('checked',true);}
			else if(Number(data.value) === 0){ //treat as number in case API return "0"
				$tag.attr('checked',false); //have to handle unchecking in case checked=checked when template created.
				}
			else{}
			app.renderFormats.popVal($tag,data);

			},
*/

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


			if(data.bindData.valuePosttext)	{
				o += data.bindData.valuePosttext;
				}

			$tag.attr(data.bindData.attribute,o);
			}, //text

		loadsTemplate : function($tag,data)	{
//			app.u.dump("BEGIN renderFormats.loadsTemplate");
			$tag.append(app.renderFunctions.transmogrify({},data.bindData.loadsTemplate,data));
			},

		money : function($tag,data)	{
			
//			app.u.dump('BEGIN view.formats.money');
			var amount = data.bindData.isElastic ? (data.value / 100) : data.value;
			if(amount)	{
				var r,o,sr;
				r = app.u.formatMoney(amount,data.bindData.currencySign,'',data.bindData.hideZero);
//					app.u.dump(' -> attempting to use var. value: '+data.value);
//					app.u.dump(' -> currencySign = "'+data.bindData.currencySign+'"');

//if the value is greater than .99 AND has a decimal, put the 'change' into a span to allow for styling.
				if(r.indexOf('.') > 0)	{
//					app.u.dump(' -> r = '+r);
					sr = r.split('.');
					o = sr[0];
					if(sr[1])	{o += '<span class="cents">.'+sr[1]+'<\/span>'}
					$tag.html(o);
					}
				else	{
					$tag.html(r);
					}
				}
			}, //money




// ** 201324 -> used for displaying a new format for datastorage.
//wikihash is the name of the datastorage format. looks like this:
// key:value\nAnotherkey:AnotherValue\n
// use 'key' and 'value' in the data-binds of the template.
//pass template to apply per row as loadsTemplate: on the databind.
//there's an example of this in admin_syndication (ebay category chooser)
		wikiHash2Template : function($tag,data)	{
			var
				rows = data.value.split("\n"),
				L = rows.length;
			
			for(var i = 0; i < L; i += 1)	{
				var kvp = rows[i].split(/:(.+)?/);
				$tag.append(app.renderFunctions.transmogrify({'key':kvp[0],'value':kvp[1]},data.bindData.loadsTemplate,{'key':kvp[0],'value':kvp[1]}));
				}
			
			},



//This should be used for all lists going forward that don't require special handling (such as stufflist, prodlist, etc).
//everthing that's in the data lineitem gets passed as first param in transmogrify, which will add each key/value as data-key="value"
//at this time, prodlist WON'T use this because each pid in the list needs/makes an API call.
//data-obj_index is set so that a quick lookup is available. ex: in tasks list, there's no detail call, so need to be able to find data quickly in orig object.
// _index is used instead of -index because of how data works (removes dashes and goes to camel case, which is nice but not consistent and potentially confusing)
//doing a for(i in instead of a +=1 style loop makes it work on both arrays and objects.
		processList : function($tag,data){
//			app.u.dump("BEGIN renderFormats.processList");
			$tag.removeClass('loadingBG');
// * 201324 -> added check for value to be object, as that's what process list is intended for.
			if(data.bindData.loadsTemplate && typeof data.value === 'object')	{
				var $o, //recycled. what gets added to $tag for each iteration.
				int = 0;
				
				var filter = data.bindData.filter;
				var filterby = data.bindData.filterby;
				if(!filterby)	{
					if(filter)	{app.u.dump("In process list, a 'filter' was passed, but no filterby was specified, so the filter was ignored.\ndatabind: \n"+$tag.data('bind'),'warn');}
					filter = undefined;
					} //can't run a filter without a filterby. filter is keyed off of later.
				
//				app.u.dump(" -> data.value.length: "+data.value.length);
				for(var i in data.value)	{
// * 201336 -> mostly for use in admin. for processing the %sku object and subbing in the default attribs when there are no inventoryable variations.
//if SKU is set, that means we're dealing with sku-level data.  if the sku does NOT have a :, we use the product %attribs
					if(data.bindData.sku)	{
						if(data.value[i] && data.value[i].sku && data.value[i].sku.indexOf(':') < 0)	{
							data.value[i]['%attribs'] = (app.data['adminProductDetail|'+data.value[i].sku]) ? app.data['adminProductDetail|'+data.value[i].sku]['%attribs'] : {};
							}
						}
					if(data.bindData.limit && int >= Number(data.bindData.limit)) {break;}
					else	{
						//if no filter is declared, proceed. 
						//This allows process list to only show matches
						if(!filter || (filter && data.value[i][filter] == filterby))	{
//if data.value was an associative array....
// ** 201320 -> needed processList to support indexed arrays AND associative arrays.
// ** 201324 -> added data.value check here. if val was null (which happened w/ bad data) then a JS error occured.
							if(data.value[i] && typeof data.value[i] === 'object')	{
	
								if(!data.value[i].index && isNaN(i)) {data.value[i].index = i} //add an 'index' field to the data. handy for hashes (like in flexedit) where the index is something useful to have in the display.
								$o = app.renderFunctions.transmogrify(data.value[i],data.bindData.loadsTemplate,data.value[i]);
								if($o instanceof jQuery)	{
									if(data.value[i].id){} //if an id was set, do nothing. there will error on an array (vs object)
									else	{$o.attr('data-obj_index',i)} //set index for easy lookup later.
									$tag.append($o);
									}
								else	{
									//well that's not good.
									app.u.dump("$o:"); app.u.dump($o);
									}
								}
							else	{
								$o = app.renderFunctions.transmogrify({'value':data.value[i],'key':i},data.bindData.loadsTemplate,{'value':data.value[i],'key':i});
								$tag.append($o);
								$o.attr('data-obj_index',i);
	//							$tag.anymessage({'message':'Issue creating template using '+data.bindData.loadsTemplate,'persistent':true});
								}
							
							}
						else	{
							//value does not match filter.
							}
						
						}
					int += 1;				
					}
				
				}
			else	{
				$tag.anymessage({'message':'Unable to render list item - no loadsTemplate specified.','persistent':true});
				}
			}
			
		},





////////////////////////////////////   						STORAGEFUNCTIONS						    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
					
// !!! at some point, these should get moved to the model. the model should handle loading data from any source.
		
	storageFunctions : {
//location should be set to 'session' or 'local'.
		writeLocal : function (key,value,location)	{
			location = location || 'local';
//			app.u.dump("WRITELOCAL: Key = "+key+" and location: "+location);
			var r = false;
			if(location+'Storage' in window && window[location+'Storage'] !== null && typeof window[location+'Storage'] != 'undefined')	{
				r = true;
				if (typeof value == "object") {
					value = JSON.stringify(value);
					}
//				localStorage.removeItem(key); //here specifically to solve a iphone/ipad issue as a result of 'private' browsing.
//the function above wreaked havoc in IE. do not implement without thorough testing (or not at all).
				try	{
					window[location+'Storage'].setItem(key, value);
					}
				catch(e)	{
					r = false;
					app.u.dump(' -> '+location+'Storage defined but not available (no space? no write permissions?)');
					app.u.dump(e.message);
					}
				
				}
			else	{
				app.u.dump(" -> window[location+'Storage']: "+window[location+'Storage']);
				app.u.dump(" -> window."+location+"Storage is not defined.");
				}
			return r;
			}, //writeLocal
		
		readLocal : function(key,location)	{
			location = location || 'local';
		//	app.u.dump("GETLOCAL: key = "+key);
			if(typeof window[location+'Storage'] == 'undefined')	{
				return app.storageFunctions.readCookie(key); //return blank if no cookie exists. needed because getLocal is used to set vars in some if statements and 'null'	
				}
			else	{
				var value = null;
				try{
					value = window[location+'Storage'].getItem(key);
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
// !!! this should get moved out of here and either into a FB extension or quickstart.		
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
