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



function initApp(params) {
	params = params || {};

	if(typeof Prototype == 'object')	{
		alert("Oh No! you appear to have the prototype ajax library installed. This library is not compatible. Please change to a non-prototype theme (2011 series).");
		}
//zglobals is not required in the UI, but is for any
//	else if(typeof zGlobals != 'object' && !params.thisSessionIsAdmin)	{
//zGlobals not required in an admin session.
//		alert("Uh Oh! A  required include (config.js) is not present. This document is required.");
//		}
	else	{
		function create(parent) {
			var F = function() {};
			F.prototype = parent;
			return new F();
			}
		var self = this;
		$.extend(true,self,controller(self),{'vars':params}); //extend self, not initApp.prototype, so that any variables/functions inside this instance are unique to the instance.

		initApp.prototype.model = create(new model(self));
		self.u.dump('Welcome fellow developer!\nThis project was built with an open-source MVC which can be found here:\nhttps://github.com/zoovy/AnyCommerce-Development','greet');

		self.initialize();
		}
	}


function controller(_app)	{
	
	return {
	cmr : [],
	rq : [],
	initialize: function() {
		window.dump = _app.u.dump; //after 'quiet' code so that if _app.u.dump is nuked, so is dump();
		window.makeImage = _app.u.makeImage; //FUTURE -> get rid of this. temporary work around for variations code in includes.
//		dump(" -> initializing app");
		_app.u.updatejQuerySupport(); //update the $.support object w/ some additional helpful info. Needs to be very early in the process since handleSession will use it.
		_app.vars = _app.vars || {};
		if(_app.vars.addjQueryPointer) {jQuery._app = _app;} 
		_app.vars.platform = _app.vars.platform ? _app.vars.platform : 'webapp'; //webapp, ios, android
		_app.vars.cid = null; //gets set on login. ??? I'm sure there's a reason why this is being saved outside the normal  object. Figure it out and document it.
		_app.vars.fbUser = {};

//used in conjunction with support/admin login. nukes entire local cache.
		if(_app.u.getParameterByName('flush') == 1)	{
			_app.u.dump(" !!! Flush is enabled. session and local storage get nuked !!!");
			if($.support.sessionStorage)	{
				window.sessionStorage.clear();
				}
			if($.support.localStorage)	{
				window.localStorage.clear();
				}
			}
		if(_app.u.getParameterByName('quiet') == 1){
			_app.u.dump = function(){};
			}
		

		//needs to be after the 'flush' above, or there's no way to flush the cart/session.
		_app.vars.carts = _app.model.dpsGet('app','carts'); //get existing carts. Does NOT create one if none exists. that's app-specific behavior. Don't default to a blank array either. fetchCartID checks memory first.

		_app.handleSession(); //get existing session or create a new one.

		_app.vars.debug = _app.u.getParameterByName('debug'); //set a var for this so the URI doesn't have to be checked each time.

		
// can be used to pass additional variables on all request and that get logged for certain requests (like createOrder). 
// default to blank, not 'null', or += below will start with 'undefined'.
//vars should be passed as key:value;  _v will start with zmvc:version.release.
		_app.vars.passInDispatchV = _app.vars.passInDispatchV || '';
		_app.vars.passInDispatchV += 'browser:'+_app.u.getBrowserInfo()+";OS:"+_app.u.getOSInfo()+';compatMode:'+document.compatMode;

		_app.vars.release = _app.vars.release || 'unspecified'; //will get overridden if set in P. this is default.
		_app.u.dump(" -> version: "+_app.model.version+" and release "+_app.vars.release);
		_app.ext = _app.ext || {}; //for holding extensions
		_app.data = {}; //used to hold all data retrieved from ajax requests.
		_app.vars.extensions = _app.vars.extensions || []; //the list of extensions that are/will be loaded
/*
_app.templates holds a copy of each of the templates declared in an extension but defined in the view. The template is stored in memory for speed.
*/
		_app.templates = {};

//queues are arrays, not objects, because order matters here. the model.js file outlines what each of these is used for.
		_app.q = {mutable : new Array(), passive: new Array(), immutable : new Array()};

		_app.globalAjax = {
			dataType : 'json',
			overrideAttempts : 0, //incremented when an override occurs. allows for a cease after X attempts.
			lastDispatch : null, //timestamp.
//			passiveInterval : setInterval(function(){_app.model.dispatchThis('passive')},5000), //auto-dispatch the passive q every five seconds. //### TODO -> commented out for testing.
			numRequestsPerPipe : 50,
			requests : {"mutable":{},"immutable":{},"passive":{}} //'holds' each ajax request. completed requests are removed.
			}; //holds ajax related vars.




		//the var for thisSessionIsAdmin should only be used here and in extension inits.  it's just an indicator and will be true whether logged in or not.
		// _app.u.thisIsAnAdminSession() will only be true after login has occured.
		if(_app.vars.thisSessionIsAdmin)	{
			_app.handleAdminVars(); //needs to be late because it'll use some vars set above.
			}
		_app.model.addExtensions(_app.vars.extensions);
// *** 201402 -> this is executed after the app is instantiated.
//		if(typeof _app.vars.initComplete == 'function')	{
//			_app.vars.initComplete(_app);
//			}
		}, //initialize

//will load _session from localStorage or create a new one.
	handleSession : function()	{
		if(_app.vars._session)	{} //already defined. 
		else if(_app.u.getParameterByName('_session'))	{ //get from URI, if set.
			_app.vars._session = _app.u.getParameterByName('_session');
			_app.u.dump(" -> session found on URI: "+_app.vars._session);
			}
		//in case localstorage is disabled.
		else if(!$.support.localStorage)	{
			_app.vars._session = _app.model.readCookie('_session');
			dump("check cookie for _session: "+_app.vars._session);
			}
		else	{
			_app.vars._session = _app.model.dpsGet('controller','_session');
			dump(" -> check localstorage for _session: "+_app.vars._session);
			}

		// *** 201403 -> moved this code from the else above to outside it so a session would ALWAYS be generated.
		// this solved an obscure case where localStorage was supported but 'full' (unable to be written to).
		if(!_app.vars._session)	{
			//create a new session id.
			_app.vars._session = _app.u.guidGenerator();
			_app.u.dump(" -> generated new session: "+_app.vars._session);
			_app.model.dpsSet('controller','_session',_app.vars._session);
			if(!$.support.localStorage)	{
				_app.model.writeCookie('_session',_app.vars._session); //for browsers w/ localstorage disabled.
				}
			}

		}, //handleSession

//This is run on init, BEFORE a user has logged in to see if login info is in localstorage or on URI.
//after login, the admin vars are set in the model. 
	handleAdminVars : function(){
//		_app.u.dump("BEGIN handleAdminVars");
		var localVars = {}
		
		if(_app.model.fetchData('authAdminLogin'))	{localVars = _app.data.authAdminLogin}

//		_app.u.dump(" -> localVars: "); _app.u.dump(localVars);
		
		function setVars(id){
//			_app.u.dump("GOT HERE!");
//			_app.u.dump("-> "+id+": "+_app.u.getParameterByName(id));
			if(_app.vars[id])	{} //already set, do nothing.
//check url. these get priority of local so admin/support can overwrite.
//uri ONLY gets checked for support. This is so that on redirects back to our UI from a partner interface don't update auth vars.
			else if(_app.u.getParameterByName('trigger') == 'support' && _app.u.getParameterByName(id))	{_app.vars[id] = _app.u.getParameterByName(id);} 
			else if(localVars[id])	{_app.vars[id] = localVars[id]}
			else	{_app.vars[id] = ''}//set to blank by default.
			}
		
		setVars('deviceid');
		setVars('userid');
		setVars('authtoken');
		setVars('domain');
		setVars('username');

		_app.vars.username = _app.vars.username.toLowerCase();
		
		}, //handleAdminVars


					// //////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ \\		


/*
calls all have an 'init' as well as a 'dispatch'.
the init allows for the call to check if the data being retrieved is already in the session or local storage and, if so, avoid a request.
If the data is not there, or there's no data to be retrieved (a Set, for instance) the init will execute the dispatch.
*/
	calls : {

		appCartCreate : {
			init : function(_tag,Q)	{
				this.dispatch(_tag,Q); 
				return 1;
				},
			dispatch : function(_tag,Q)	{
				_app.model.addDispatchToQ({"_cmd":"appCartCreate","_tag":_tag},Q || 'immutable');
				}
			},//appCartCreate

		appNavcatDetail : {
			init : function(obj,_tag,Q)	{
				if(obj && obj.path)	{
					var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
					_tag = _tag || {};
					_tag.datapointer = 'appNavcatDetail|'+obj.path;
				
					if(_app.model.fetchData(_tag.datapointer))	{
//data is now in memory. based on the detail param, see if the category record available is enough.
						var catData = _app.data[_tag.datapointer];
//if max is already available, just use it.
						if(catData.detail == 'max')	{
							_app.u.handleCallback(_tag);
							}
						else if(obj.detail == 'more' && catData.detail == 'more')	{
							_app.u.handleCallback(_tag);
							}
						else if(!obj.detail || obj.detail == 'fast')	{
//if no detail is specified or it's set to 'fast', whatever we have in memory is enough or more than enough.
							_app.u.handleCallback(_tag);
							}
						else	{
							r += 1;
							this.dispatch(obj,_tag,Q);
							}
						}
					else	{
//no data in memory/local. go get it.
						r += 1;
						this.dispatch(obj,_tag,Q);
						}
					}
				else	{
					_app.u.throwGMessage("In calls.appNavcatDetail, obj.path not passed.");
					_app.u.dump(obj);
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "appNavcatDetail";
				obj._tag = _tag;
				_app.model.addDispatchToQ(obj,Q);	
				}
			},//appNavcatDetail

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
//The fetchData will put the data into memory if present, so safe to check _app.data... after here.
					if(_app.model.fetchData(_tag.datapointer) == false)	{
						r = 1;
						this.dispatch(obj,_tag,Q)
						}
//if variations or options are requested, check to see if they've been retrieved before proceeding.
					else if((obj.withVariations && _app.data[_tag.datapointer]['@variations'] === undefined) || (obj.withInventory && _app.data[_tag.datapointer]['@inventory'] === undefined))	{
						r = 1;
						this.dispatch(obj,_tag,Q);
						}
//if the product record is in memory BUT the inventory is zero, go get updated record in case it's back in stock.
					else if(_app.ext.store_product && (_app.ext.store_product.u.getProductInventory(_app.data[_tag.datapointer]) === 0))	{
						r = 1;
						this.dispatch(obj,_tag,Q);
						}
					else 	{
						_app.u.handleCallback(_tag);
						}
					if(obj.withInventory)	{obj.inventory=1}
					}
				else	{
					_app.u.throwGMessage("In calls.appProductGet, required parameter pid was not passed");
					_app.u.dump(obj);
					}
				return r;
				},
			dispatch : function(obj,_tag,Q)	{
				obj["_cmd"] = "appProductGet";
 				obj["_tag"] = _tag;
				_app.model.addDispatchToQ(obj,Q);
				}
			}, //appProductGet

		appProfileInfo : {
			init : function(obj,_tag,Q)	{
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				if(typeof obj == 'object' && (obj.profile || obj.domain))	{
					_tag = _tag || {};
					_tag.datapointer = 'appProfileInfo|'+(obj.profile || obj.domain);
					if(_app.model.fetchData(_tag.datapointer) == false)	{
						r = 1;
						this.dispatch(obj,_tag,Q);
						}
					else 	{
						_app.u.handleCallback(_tag);
						}
					}
				else	{
					_app.u.throwGMessage("In calls.appProfileGet, obj either missing or missing profile ["+obj.profile+"] or domain ["+obj.domain+"] var.");
					_app.u.dump(obj);
					}

				return r;
				}, // init
			dispatch : function(obj,_tag,Q)	{
				obj._cmd = "appProfileInfo";
				obj._tag = _tag;
				_app.model.addDispatchToQ(obj,Q);
				} // dispatch
			}, //appProfileInfo
			
		authAdminLogin : {
			init : function(obj,_tag)	{
				this.dispatch(obj,_tag);
				return 1;
				},
			dispatch : function(obj,_tag){
				_app.u.dump("Attempting to log in");
				obj._cmd = 'authAdminLogin';
				obj.authid = obj.password;
				obj.authtype = 'password';
// ** 201402 -> md5 is no longer used for login. 
/*				if(obj.authtype == 'md5')	{
					_app.vars.userid = obj.userid.toLowerCase();	 // important!
					obj.ts = _app.u.ymdNow();
					obj.authid = Crypto.MD5(obj.password+obj.ts);
					obj.device_notes = "";
					delete obj.password;
					}
*/
				obj._tag = _tag || {};
				if(obj.persistentAuth)	{obj._tag.datapointer = "authAdminLogin"} //this is only saved locally IF 'keep me logged in' is true OR it's passed in _tag
				_app.model.addDispatchToQ(obj,'immutable');
				}
			}, //authentication
// ### FUTURE -> remove this call.
		buyerAddressList : {
			init : function(_tag,Q)	{
				var r = 0;
				_tag = _tag || {};
				_tag.datapointer = "buyerAddressList";
				if(_app.model.fetchData("buyerAddressList") == false)	{
					r = 1;
					this.dispatch(_tag,Q);
					}
				else	{
					_app.u.handleCallback(_tag);
					}
				return r;
				},
			dispatch : function(_tag,Q)	{
				_app.model.addDispatchToQ({"_cmd":"buyerAddressList","_tag": _tag},Q || 'mutable');
				}
			}, //buyerAddressList	

// ### FUTURE -> remove this call.
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
				_app.model.addDispatchToQ({"_cmd":"buyerProductListDetail","listid":listID,"_tag" : _tag},Q);	
				}
			},//buyerProductListDetail

//obj must include listid
//obj can include sku, qty,priority, note and replace. see github for more info.
//sku can be a fully qualified stid (w/ options)
// ### FUTURE -> remove this call.
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
				_app.model.addDispatchToQ(obj,Q || 'immutable');	
				}
			},//buyerProductListAppendTo

// ### FUTURE -> get rid of this as a 'call'. use logBuyerOut. 
		buyerLogout : {
			init : function(_tag)	{
// logging out clears these fields as they contain buyer specific data.
				_app.model.destroy('appBuyerLogin');
				_app.model.destroy('buyerWalletList');
				_app.model.destroy('buyerAddressList');
				_app.model.destroy('appPaymentMethods');
				_app.model.destroy('whoAmI');
				_app.model.destroy('cartDetail|'+_app.model.fetchCartID());
				this.dispatch(_tag);
				return 1;
				},
			dispatch : function(_tag)	{
				obj = {};
				obj["_cmd"] = "buyerLogout";
				obj["_tag"] = _tag || {};
				obj["_tag"]["datapointer"] = "buyerLogout";
				_app.model.addDispatchToQ(obj,'immutable');
				}
			}, //appBuyerLogout

//WILL look in local
// ### FUTURE -> this call needs to support a 'create' or need a new call for it. should default to zero. if one (would be used on a storefront probably), if no cart exists, it will be created.
		cartDetail : {
			init : function(cartID,_tag,Q)	{
				var r = 0;
				if(cartID)	{
					_tag = _tag || {};
					_tag.datapointer = "cartDetail|"+cartID;
					if(_app.model.fetchData(_tag.datapointer))	{
						_app.u.handleCallback(_tag);
						}
					else	{
						r = 1;
						this.dispatch(cartID,_tag,Q);
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In calls.cartDetail, no cartID specified.","gMessage":true});
					}
				return r;
				},
			dispatch : function(cartID,_tag,Q)	{
				_app.model.addDispatchToQ({"_cmd":"cartDetail","_cartid":cartID,"_tag": _tag,"create":0},Q || 'mutable');
				} 
			}, // refreshCart removed comma from here line 383

//used to get a clean copy of the cart. ignores local/memory. used in various places, like checkout. intended to work specifically with the 'active' cart.
//this is old and, arguably, should be a utility. however it's used a lot so for now, left as is. ### search and destroy when convenient.
		refreshCart : {
			init : function(_tag,Q)	{
				var cartID = _app.model.fetchCartID();
				if(cartID)	{
					_app.model.destroy('cartDetail|'+cartID);
					_app.calls.cartDetail.init(cartID,_tag,Q);
					}
				}
			}, // refreshCart
// ### FUTURE -> remove this call.
		ping : {
			init : function(_tag,Q)	{
				this.dispatch(_tag,Q);
				return 1;
				},
			dispatch : function(_tag,Q)	{
				_app.model.addDispatchToQ({"_cmd":"ping","_tag":_tag},Q || 'mutable'); //get new session id.
				}
			} //ping

		}, // calls

					// //////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ \\
/*
Callbacks require should have an onSuccess.
Optionally, callbacks can have on onError. if you have a custom onError, no error messaging is displayed. This give the developer the opportunity to easily suppress errors for a given request/callback.
_app.u.throwMessage(responseData); is the default error handler.
*/
	callbacks : {
		

		fileDownloadInModal : {
			onSuccess : function(_rtag)	{
				_app.u.dump("BEGIN callbacks.fileDownloadInModal");
				_app.u.fileDownloadInModal({
					'filename':_app.data[_rtag.datapointer].FILENAME || _rtag.filename,
					'mime_type':_app.data[_rtag.datapointer].MIMETYPE,
					'body':_app.data[_rtag.datapointer].body,
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




	
//very similar to the original translate selector in the control and intented to replace it. 
//This executes the handleAppEvents in addition to the normal translation.
//jqObj is required and should be a jquery object.
//tlc is a VERY common callback. To keep it tight but flexible, before and onComplete functions can be passed to handle special cases.
		tlc : {
			onMissing : function(rd)	{
				rd._rtag.jqObj.anymessage(rd);
				},
			onSuccess : function(_rtag)	{
//				_app.u.dump("BEGIN callbacks.tlc ------------------------"); _app.u.dump(_rtag);
				if(_rtag && _rtag.jqObj && typeof _rtag.jqObj == 'object')	{
//allows for the callback to perform a lot of the common handling, but to append a little extra functionality at the end of a success.
					if(typeof _rtag.before == 'function')	{
						_rtag.before(_rtag);
						}					
					var $target = _rtag.jqObj
					$target.hideLoading(); //shortcut
					if(_rtag.templateID && !_rtag.templateid)	{_rtag.templateid = _rtag.templateID} //anycontent used templateID. tlc uses templateid. rather than put this into the core tranlsator, it's here as a stopgap.
//anycontent will disable hideLoading and loadingBG classes.
//to maintain flexibility, pass all anycontent params in thru _tag
					$target.tlc(_rtag);
					$target.anyform(_rtag);
					_app.u.handleCommonPlugins($target);
					_app.u.handleButtons($target);

//allows for the callback to perform a lot of the common handling, but to append a little extra functionality at the end of a success.
					if(typeof _rtag.onComplete == 'function')	{
						_rtag.onComplete(_rtag);
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin.callbacks.tlc, jqOjb not set or not an object ['+typeof _rtag.jqObj+'].','gMessage':true});
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


	
//very similar to the original translate selector in the control and intented to replace it. 
//This executes the handleAppEvents in addition to the normal translation.
//jqObj is required and should be a jquery object.
		anycontent : {
			onMissing : function(rd)	{
				dump(" -----------> rd: "); dump(rd);
				rd._rtag.jqObj.anymessage(rd);
				rd._rtag.jqObj.hideLoading();
				if(typeof rd._rtag.onMissing === 'function')	{
					rd._rtag.onMissing(rd);
					}
				},
			onSuccess : function(_rtag)	{
				_app.u.dump("BEGIN callbacks.anycontent"); // _app.u.dump(_rtag);
				if(_rtag && _rtag.jqObj && typeof _rtag.jqObj == 'object')	{
					
					var $target = _rtag.jqObj; //shortcut
					
//anycontent will disable hideLoading and loadingBG classes.
//to maintain flexibility, pass all anycontent params in thru _tag
					$target.anycontent(_rtag);

					_app.u.handleCommonPlugins($target);
					_app.u.handleButtons($target);
					
					
// use either delegated events OR app events, not both.
//avoid using this. ### FUTURE -> get rid of these. the delegation should occur in the function that calls this. more control that way and things like dialogs being appendedTo a parent can be handled more easily.
					if(_rtag.addEventDelegation)	{
						_app.u.addEventDelegation($target);
						}
					else if(_rtag.skipAppEvents)	{}
					else	{
						_app.u.handleAppEvents($target);
						}

					if(_rtag.applyEditTrackingToInputs)	{
						_app.ext.admin.u.applyEditTrackingToInputs($target); //applies 'edited' class when a field is updated. unlocks 'save' button.
						}
					if(_rtag.handleFormConditionalDelegation)	{
						_app.ext.admin.u.handleFormConditionalDelegation($('form',$target)); //enables some form conditional logic 'presets' (ex: data-panel show/hide feature)
						}
//allows for the callback to perform a lot of the common handling, but to append a little extra functionality at the end of a success.
					if(typeof _rtag.onComplete == 'function')	{
						_rtag.onComplete(_rtag);
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
				if(typeof jQuery().hideLoading == 'function'){$(_rtag.selector).hideLoading();}
				_app.renderFunctions.translateSelector(_rtag.selector,_app.data[_rtag.datapointer]);
				}
			},
	
		transmogrify : 	{
			onSuccess : function(_rtag)	{
				var $parent = $(_app.u.jqSelector('#',_rtag.parentID));
				if(typeof jQuery().hideLoading == 'function'){$parent.hideLoading();}
				$parent.append(_app.renderFunctions.transmogrify({'id':_rtag.parentID+"_"+_rtag.datapointer},_rtag.templateID,_app.data[_rtag.datapointer]));
				}
			}, //translateTemplate

		
//pass the following on _tag:
// parentID is the container id that the template instance is already in (should be created before call)
// templateID is the template that will get translated.
// the _app.data.datapointer is what'll get passed in to the translate function as the data src. (ex: getProduct|PID)
		translateTemplate : 	{
			onSuccess : function(_rtag)	{
//				_app.u.dump("BEGIN callbacks.translateTemplate"); _app.u.dump(_rtag);
//				_app.u.dump("typeof jQuery.hideLoading: "+typeof jQuery().hideLoading);
				if(typeof jQuery().hideLoading == 'function'){$(_app.u.jqSelector('#',_rtag.parentID)).hideLoading();}
				_app.renderFunctions.translateTemplate(_app.data[_rtag.datapointer],_rtag.parentID);
				}
			}, //translateTemplate

// a generic callback to allow for success messaging to be added. 
// pass message for what will be displayed.  For error messages, the system messaging is used.
		showMessaging : {
			onSuccess : function(_rtag,macroResponses)	{
				_app.u.dump("BEGIN _app.callbacks.showMessaging");
				if(_rtag.jqObj)	{
//					_app.u.dump(" -> jqObj is present.");
//					_app.u.dump(" -> jqObj.data(): "); _app.u.dump(_rtag.jqObj.data());
					_rtag.jqObj.hideLoading();
					if(_rtag.jqObjEmpty)	{
						_rtag.jqObj.empty();
						}
//you can't restore AND empty. it's empty, there's nothing to restore.
					else {
						if(_rtag.restoreInputsFromTrackingState)	{
//							_app.u.dump(" -> restoreInputsFromTrackingState.");
							_app.ext.admin.u.restoreInputsFromTrackingState(_rtag.jqObj);
							}
						if(_rtag.removeFromDOMItemsTaggedForDelete)	{
//							_app.u.dump(" -> removeFromDOMItemsTaggedForDelete.");
							_app.ext.admin.u.removeFromDOMItemsTaggedForDelete(_rtag.jqObj);
							}
						}
					}

				if(macroResponses && macroResponses['@RESPONSES'])	{
					var $target = _rtag.jqObj || $("#globalMessaging");
					macroResponses.persistent = _rtag.persistent === false ? false : true; //these responses should be displayed till turned off.
					$target.anymessage(macroResponses);
					}
				else	{
					var msg = _app.u.successMsgObject(_rtag.message);
					msg['_rtag'] = _rtag; //pass in _rtag as well, as that contains info for parentID.
					_app.u.throwMessage(msg);
					}
//allows for the callback to perform a lot of the common handling, but to append a little extra functionality at the end of a success.
				if(typeof _rtag.onComplete == 'function')	{
					_rtag.onComplete(_rtag);
					}

				}
			}, //showMessaging
		
		disableLoading : {
			onSuccess : function(_rtag)	{
				$('#'+_rtag.targetID).hideLoading();
				},
			onError : function(responseData)	{
				_app.u.throwMessage(responseData);
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
				_app.u.dump("CAUTION! response for uuid ["+uuid+"] contained errors but they were suppresed. This may be perfectly normal (passive requests) but should be investigated.");
				}
			} //suppressErrors
			
			
		}, //callbacks






////////////////////////////////////   ROUTER    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	router : {
		initRoutes : [], //get run once, at router init. allows for handling of URI vars et all.
		hashRoutes : [], //an object, not an array. order is not required because route matches are implicit unless they define themselves otherwise.
		aliases : {}, //functions executed by route.
		initObj : {},
		
	//proper way to add a route to the routes table. will have validation.
		appendHash : function(obj)	{return this._addInitOrHash('hash','append',obj);},
		prependHash : function(obj)	{return this._addInitOrHash('hash','prepend',obj);},
		appendInit : function(obj)	{return this._addInitOrHash('init','append',obj);},
		prependInit : function(obj)	{return this._addInitOrHash('init','prepend',obj);},
	
		_addInitOrHash : function(mode,method,obj)	{
			var r = false; //what is returned.
			obj = obj || {};
			if((method == 'append' || method == 'prepend') && (mode == 'init' || mode == 'hash'))	{
				if(obj.type && obj.callback)	{ //route isn't validated against because a blank route is a valid route (homepage)
					if(_app.router.matchFunctions[obj.type])	{
						method == 'prepend' ? this[mode+'Routes'].unshift(obj) : this[mode+'Routes'].push(obj);
						r = true;
						}
					else	{
						_app.u.dump("In _addInitOrHash, for route "+obj.route+" type was set as "+obj.type+" which is not valid","warn");
						}				
					}
				else	{
					_app.u.dump("In _addInitOrHash, type ["+obj.type+"] or route ["+obj.route+"] or callback [typeof: "+(typeof obj.callback)+"] was not defined and all are required.","warn");
					}
				}
			else	{
				_app.u.dump("In _addInitOrHash, method ["+method+"] and/or mode ["+mode+"] either not specified or not valid.","warn");
				}
			return r;
			},
			
	
			
		//proper way to add an alias. will have validation.
		addAlias : function(name,callback)	{
			if(name && callback)	{
				_app.router.aliases[name] = callback;
				}
			else	{
				// eithr name or callback not specified.  ### TODO -> add error.
				}
			},
			
		_buildMatchParams : function(route,hash,keysArr)	{
			var regex = new RegExp(/{{(.*?)}}/g), vars = {}, matchVarsArr = [], isMatch;
			while(isMatch = regex.exec(route))	{matchVarsArr.push(isMatch[1]);} //isMatch[0] is the match value
		
			if(matchVarsArr && matchVarsArr.length)	{
				for(var i = 0, L = matchVarsArr.length; i < L; i += 1)	{
					vars[matchVarsArr[i]] = keysArr[i];
					}
				}
			return vars;
			},
	//The route type functions all get passed the same vars, routeObj and hash.
	//the function should return false is the hash does not match the route.
	//the function should return an object if a match is 
		matchFunctions : {
			'exact' : function(routeObj,hash){
				var r = false;
				if(routeObj.route == hash)	{
					r = {'exact':hash};
					}
				return r;
				},
			'match' : function(routeObj,hash){
				var r;
				if(routeObj.route == '')	{r = false; dump("routeobj.route was blank"); dump(routeObj);} //can't 'match' against blank.
				else if(routeObj.route)	{
					var pattern = routeObj.route.replace(/{{(.*?)}}/g,'([^\\/]+)');
					if(routeObj.route.charAt(routeObj.route.length - 1) == '*' )	{pattern += "(/\?.*)?";} //allows for wildcards to be set. so admin/ext/a?some=params can be declared w/ admin/{{ext}}/{{a}}*
					var r = false, regex = new RegExp(pattern), isMatch = regex.exec(hash);
		//regex.exec[0] will be the match value. so comparing that to the hash will ensure no substring matches get thru.
		//substring matches can be accomplished w/ a regex in the route.
					if(isMatch && isMatch[0] == hash)	{
						//IE8 requires the second param be passed into splice
						r = {'match' : isMatch, 'params' : _app.router._buildMatchParams(routeObj.route,hash,isMatch.splice(1,isMatch.length - 1))}; //isMatch is spliced because the first val is the 'match value'.
						}
					}
				else	{
					//unknown error.
					dump("in matchFunctions.match, an unknown error occured based on the value of routeObj.route: "+routeObj.route); dump(routeObj);
					r = false
					}
				return r;
				},
			'function' : function(routeObj,hash){
				// ### TODO -> need to write this.
				return routeObj.route(routeObj,hash);
				},
			'regexp' : function(routeObj,hash){
				var regex = new RegExp(routeObj.route), r = false, isMatch = regex.exec(hash);
				if(isMatch)	{
					r = {'regexp' : isMatch};
					}
				return r;
				}
			},
	//compares an individual route in the routes array against the hash to check for a match.
	//The matchFunction response and the routeObj are copied and returned.
		_doesThisRouteMatchHash : function(routeObj,hash)	{
			var r = null;
			routeObj = routeObj || {};
			//don't test for .route here because it could be blank, and that's valid.
			if(routeObj.type && typeof _app.router.matchFunctions[routeObj.type] == 'function')	{
				r = _app.router.matchFunctions[routeObj.type](routeObj,hash);
				if(r)	{
					r = $.extend({},routeObj,r); //r last trumps whatever was in the routeObj. allows r to 'change' things.
					}
				}
			else	{
				_app.u.dump("for route ["+routeObj.route+"], routeObj.type is not set ["+routeObj.type+"] OR typeof is not a function ["+(typeof _app.router.matchFunctions[routeObj.type])+"].","warn");
				_app.u.dump(routeObj);
				}
			return r;
			},
	//Goes through the entire list of routes, in order.
	//executes the match method (exact, function, regexp, etc) to see if hash is a match.
	//once a match is found, processing is stopped, which means only 1 match per hash. 
	//	-> may at some point enable stacking, but it'll be off by default.
		_getRouteObj : function(matchValue,mode)	{
			var route = null, routesArr = _app.router[mode+'Routes'];
			for(var i = 0,L = routesArr.length; i < L; i += 1)	{
				var isMatchArr = _app.router._doesThisRouteMatchHash(routesArr[i],matchValue); //will return an array where 0 is the 'match' from the regex and subsequent entries are the matched values. (ex: for product/PID , spot 1 is PID)
				if(isMatchArr)	{
					route = isMatchArr;
					if(mode == 'hash') break;
					}
				}
			return route;
			},
		_executeCallback : function(routeObj)	{
			//if the callback is a string, then it should correspond to a handler.
			if(routeObj.callback)	{
				if(typeof routeObj.callback === 'string')	{
					if(_app.router.aliases[routeObj.callback])	{
						_app.router.aliases[routeObj.callback](routeObj,_app.router.initObj);
						}
					else	{
						//no matching handler found.
						_app.u.dump("In _executeCallback, handler ["+routeObj.callback+"] specified does not exist.","warn");
						}
					}
				else if(typeof routeObj.callback == 'function')	{
					routeObj.callback(routeObj,_app.router.initObj);
					}
				else	{
					_app.u.dump("In _execute handler, invalid type for routeObj.callback. typeof: "+(typeof routeObj.callback),"error");
					//unrecognized type for calback.
					}
				}
			else	{} //no callback defined
			},
		//will return the URI params that appear BEFORE the hash or false if none are present.
		getURIParams : function()	{
			var uriParams = false;
			var ps = window.location.href.replace(location.hash,''); //only want the uri params before the hash.
			if(ps.indexOf('?') >= 1)	{
				ps = ps.split('?')[1]; //ignore everything before the first questionmark.
				if(ps.indexOf('#') == 0){} //'could' happen if uri is ...admin.html?#doSomething. no params, so do nothing.
				else	{
					if(ps.indexOf('#') >= 1)	{ps = ps.split('#')[0]} //uri params should be before the #
					uriParams = {}
					uriParams = _app.u.kvp2Array(ps);
					}
				}
			return uriParams;
			},
		init : function()	{
			if($(document.body).data('isRouted'))	{} //only allow the router to get initiated once.
			else	{
				
				//initObj is a blank object by default, but may be updated outside this process. so instead of setting it to an object, it's extended to merge the two.
				$.extend(_app.router.initObj,{
					hash : location.hash,
					uriParams : _app.router.getURIParams(),
					hashParams : (location.hash.indexOf('?') >= 0 ? _app.u.kvp2Array(decodeURIComponent(location.hash.split("?")[1])) : {})
					});
				var routeObj = _app.router._getRouteObj(document.location.href,'init'); //strips out the #! and trailing slash, if present.
				if(routeObj)	{
					_app.router._executeCallback(routeObj);
					}
				else	{
					_app.u.dump(" -> Uh Oh! no valid route found for "+location.hash);
					//what to do here?
					}
		//this would get added at end of INIT. that way, init can modify the hash as needed w/out impacting.
				if (window.addEventListener) {
					dump(" -> addEventListener is supported and added for hash change.");
					window.addEventListener("hashchange", _app.router.handleHashChange, false);
					$(document.body).data('isRouted',true);
					}
				//IE 8
				else if(window.attachEvent)	{
					//A little black magic here for IE8 due to a hash related bug in the browser.
					//make sure a hash is set.  Then set the hash to itself (yes, i know, but that part is key). Then wait a short period and add the hashChange event.
					window.location.hash = window.location.hash || '#!home'; //solve an issue w/ the hash change reloading the page.
					window.location.hash = window.location.hash;
					setTimeout(function(){
						window.attachEvent("onhashchange", _app.router.handleHashChange);
						},1000);
					$(document.body).data('isRouted',true);
					}
				else	{
					$("#globalMessaging").anymessage({"message":"Browser doesn't support addEventListener OR attachEvent.","gMessage":true});
					}
				
				}
			},
	
		handleHashChange : function()	{
			//_ignoreHashChange set to true to disable the router.  be careful.
			if(location.hash.indexOf('#!') == 0  && !_app.vars.ignoreHashChange)	{
				// ### TODO -> test this with hash params set by navigateTo. may need to uri encode what is after the hash.
// *** 201403 use .href.split instead of .hash for routing- Firefox automatically decodes the hash string, which breaks any URIComponent encoded characters, like "%2F" -> "/" -mc
// http://stackoverflow.com/questions/4835784/firefox-automatically-decoding-encoded-parameter-in-url-does-not-happen-in-ie
				var routeObj = _app.router._getRouteObj(location.href.split('#!')[1],'hash'); //if we decide to strip trailing slash, use .replace(/\/$/, "")
				if(routeObj)	{
					routeObj.hash = location.hash;
					routeObj.hashParams = (location.hash.indexOf('?') >= 0 ? _app.u.kvp2Array(location.hash.split("?")[1]) : {});
					_app.router._executeCallback(routeObj);
					}
				else	{
					_app.u.dump(" -> Uh Oh! no valid route found for "+location.hash);
					if(typeof _app.router.aliases['404'] == 'function')	{
						_app.router._executeCallback({'callback':'404','hash':location.hash});
						}
					}
				}
			else	{
				if(_app.vars.ignoreHashChange)	{_app.u.dump(" -> ignoreHashChange is true. Router is disabled.")}
				else	{_app.u.dump(" -> not a hashbang")}
				//is not a hashbang. do nothing.
				}
			}
		},







////////////////////////////////////   UTIL [u]    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\






	u : {


/*
when a call is requested but the data is local, execute this function.
it will check to see if a callback is defined and if it is, execute it.
smart enough to determine if an extension is involved and execute it from there.

-> this is a function because what is in the 'if' was being duplicated in almost every call 
that dealt with a fetch. So it was made into a function to make the calls tighter and also 
allow for global manipulation if needed later.

_app.u.handleCallback(tagObj);
*/

		handleCallback : function(_rtag)	{
			if(_rtag && _rtag.callback){
				if(typeof _rtag.callback == 'function')	{_rtag.callback(_rtag);}
				else	{
//				_app.u.dump(" -> callback is not an anonymous function.");
					var callback;
//most callbacks are likely in an extension, but support for 'root' callbacks is necessary.
//save path to callback so that we can verify the onSuccess is a function before executing (reduce JS errors with this check)
					callback = _rtag.extension ? _app.ext[_rtag.extension].callbacks[_rtag.callback] : _app.callbacks[_rtag.callback];
//					_app.u.dump(" -> typeof _app.callbacks[_rtag.callback]: "+typeof callback);
					if(typeof callback.onSuccess == 'function')	{
						callback.onSuccess(_rtag);
						}
					else	{}//callback defined as string, but callback.onsuccess is not a function.
					}
				}
			else	{
//				_app.u.dump(" -> no callback was defined. This may be perfectly normal");
				}
			}, //handleCallback


/*
Some utilities for loading external files, such as .js, .css or even extensions.
*/

		loadScript : function(url, callback, params){
//			dump("load script: "+url+" and typeof callback: "+(typeof callback));
			if(url)	{
				var script = document.createElement("script");
				script.type = "text/javascript";
				if (script.readyState){  //IE
					script.onreadystatechange = function(){
						if (script.readyState == "loaded" || script.readyState == "complete"){
							script.onreadystatechange = null;
							if(typeof callback == 'function')	{callback(params);}
							}
						};
					}
				else {
					if(typeof callback == 'function')	{
						script.onload = function(){callback(params)}
						}
					}
			//append release to the end of included files to reduce likelyhood of caching.
				url += (url.indexOf('?') > -1 ) ? '&' : '?'; //add as initial or additional param based on whether or not any params are already present.
				url += "_v="+_app.vars.release;
			//	app.u.dump(url);
				script.src = url;
				document.getElementsByTagName("head")[0].appendChild(script);
				}
			else	{
				//can't load a script without url being set.
				//not sure how I want to handle this yet.
				_app.u.dump('loadscript run but no URL passed.','warn');
				}
			},

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
				_app.u.loadScript(arr[2],arr[3]);
				}
			else if(arr[0] == 'extension')	{
//					_app.u.dump(" -> extension loading: "+arr[2]+" callback: "+arr[4]);
				var tmpObj = {"namespace":arr[2],"filename":arr[3],"callback":arr[4]}; //
				_app.vars.extensions.push(tmpObj); // keep the full list just in case.
				_app.u.loadScript(arr[3],function(){
					_app.model.fetchExtension(tmpObj); 
					});
				_app.model.executeCallbacksWhenExtensionsAreReady([tmpObj]); //function wants an array of objects.
				}
			else if(arr[0] == 'css')	{
				_app.u.loadCSSFile(arr[2],arr[3] || null);
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
				fileref.setAttribute('href', filename + "?_v="+_app.vars.release);
				if(domID)	{fileref.setAttribute('id', domID);}
// Append link object inside html's head
				document.getElementsByTagName("head")[0].appendChild(fileref);
				}
			else	{
				//doh! no filename.
				}
			}, //loadCSSFile

/*
will load everything in the RQ will a pass <= [pass]. so pass of 10 loads everything with pass less than or equal to 10;
*/
		handleRQ : function(pass)	{
			pass = pass || 0;
		//	app.u.dump("BEGIN app.u.handleRQ");
			var numIncludes = 0; //what is returned. The total number of includes for this pass.
			var L = _app.rq.length - 1; //rq is iterated through backwards, so length - 1 is used.

			_app.vars.rq = new Array(); //to avoid any duplication, as iteration occurs, items are moved from app.rq into this tmp array. 
		
//the callback added to the loadScript on type 'script' sets the last value of the resource array to true.
//another script will go through this array and make sure all values are true for validation. That script will execute the callback (once all scripts are loaded).
			var callback = function(resource){
				resource[resource.length - 1] = 1; //last index in array is for 'is loaded'. set to false in loop below.
				if(resource[0] == 'script' && typeof resource[3] == 'function')	{
					resource[3]();
					}
				}

			for(var i = L; i >= 0; i--)	{
//				_app.u.dump("_app.rq["+i+"][0]: "+_app.rq[i][0]+" pass: "+_app.rq[i][1]);
				if(_app.rq[i][0] == 'script' && _app.rq[i][1] <= pass)	{
		//			_app.u.dump(" -> load it!");
					numIncludes++;
					_app.rq[i][_app.rq[i].length] = 0; //will get set to 1 when script loads as part of callback.
					_app.vars.rq.push(_app.rq[i]); //add to pass zero rq.
					_app.u.loadScript(_app.rq[i][2],callback,(_app.rq[i]));
					_app.rq.splice(i, 1); //remove from new array to avoid dupes.
					}
				else if(_app.rq[i][0] == 'css' && _app.rq[i][1] <= pass)	{
					numIncludes++;
					_app.rq[i][_app.rq[i].length] = 1; //no way to verify a css has loaded, so set to 1 as if it's already loaded. ### FUTURE -> verify this.
					_app.vars.rq.push(_app.rq[i]); //add to pass zero rq.
					_app.u.loadCSSFile(_app.rq[i][2],_app.rq[i][3])
					_app.rq.splice(i, 1); //remove from new array to avoid dupes.
					}
				else if(_app.rq[i][0] == 'extension' && _app.rq[i][1] <= pass)	{
					numIncludes++;
					_app.vars.extensions.push({"namespace":_app.rq[i][2],"filename":_app.rq[i][3],"callback":_app.rq[i][4]}); //add to extension Q.
					_app.rq[i][_app.rq[i].length] = 0; //will get set to 1 when script loads as part of callback.
					_app.vars.rq.push(_app.rq[i]); //add to pass zero rq.
		//			_app.u.dump(" -> _app.rq[i][2]: "+_app.rq[i][2]);
		//on pass 0, for extensions , their specific callback is not added (if there is one.)
		// because the model will execute it for all extensions once the controller is initiated.
		// so instead, a generic callback function is added to track if the extension is done loading.
		// which is why the extension is added to the extension Q (above).
					_app.u.loadScript(_app.rq[i][3],callback,(_app.rq[i]));
					_app.rq.splice(i, 1); //remove from old array to avoid dupes.
					}
				else	{
		//currently, this function is intended for pass 0 only, so if an item isn't pass 0,do nothing with it.
					}
				}
		//	_app.u.dump("numIncludes: "+numIncludes);
//			app.u.initMVC(0);
			return numIncludes;
			},

//Run at initComplete. loads all pass zero files and executes their callbacks (if any). then loads resources set for pass > 0
		loadResources : function()	{
			var rObj = {
				'passZeroResourcesLength' : _app.u.handleRQ(0),
				'passZeroResourcesLoaded' : 0,
				'passZeroTimeout' : null
				}; //what is returned.
			function resourcesAreLoaded(){
				rObj.passZeroResourcesLoaded = _app.u.numberOfLoadedResourcesFromPass(0); //this should NOT be in the else or it won't get updated once the resources are done.
				if(_app.u.numberOfLoadedResourcesFromPass(0) == _app.vars.rq.length)	{
					_app.vars.rq = null; //this is the tmp array used by handleRQ and numberOfResourcesFromPass. Should be cleared for next pass.
					_app.model.addExtensions(_app.vars.extensions);
					_app.u.handleRQ(1); //this will empty the RQ.
					_app.rq.push = _app.u.loadResourceFile; //reassign push function to auto-add the resource.
					}
				else	{
//					_app.u.dump(" -> _app.u.numberOfLoadedResourcesFromPass(0,0): "+_app.u.numberOfLoadedResourcesFromPass(0,0));
					rObj.passZeroTimeout = setTimeout(function(){resourcesAreLoaded();},250);
					}
				}
			resourcesAreLoaded();
			return rObj;
			},

		numberOfLoadedResourcesFromPass : function(pass,debug)	{
			var L = _app.vars.rq.length;
			var r = (L === 0) ? false : 0; //what is returned. total # of scripts that have finished loading. false if rq is empty.
			for(var i = 0; i < L; i++)	{
				r += _app.vars.rq[i][_app.vars.rq[i].length - 1]
				if(debug)	{_app.u.dump(" -> "+i+": "+_app.vars.rq[i][2]+": "+_app.vars.rq[i][_app.vars.rq[i].length -1]);}
				}
			return r;
			},




//vars requires MIME_TYPE and body.
//vars.filename is optional
//opted to force this into a modal to reduce the likely of a bunch of unused blobs remaining on the DOM.
//the dialog will empty/remove itself when closed.
		fileDownloadInModal : function(vars)	{
//			_app.u.dump("BEGIN _app.u.fileDownloadInModal");
			vars = vars || {};

			function modal()	{
				var $D = $("<div \/>",{'title':'File Ready for Download'}).html("Your file is ready for download: <br />").appendTo(document.body);
				$D.dialog({
					'modal' : true,
					'autoOpen' : true,
					'width' : 300,
					'height' : 200,
					close: function(event, ui)	{
						$('body').css({'height':'auto','overflow':'auto'}) //bring browser scrollbars back.
//						$(this).dialog('destroy');
						$(this).closest('.ui-dialog').intervaledEmpty(1000);
						} //will remove from dom on close
					});
				return $D;
				}

			if(vars.data_url === true)	{
				var $D = modal();
				var output = vars.body.join('\n');
				var uri = 'data:application/csv;charset=UTF-8,' + encodeURIComponent(output);
				$("<a>").attr({'href':uri,'download':vars.filename}).text(vars.filename).appendTo($D);
				}
			else if(vars.mime_type && vars.body)	{
				_app.u.dump(" -> mime type and body are set");
				var filename = vars.filename || 'file';
				var MIME_TYPE = vars.mime_type;

				var $D = modal();

//if atob causes issues later, explore 	b64toBlob	 (found here: http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript); //201324		
//content returned on an API call will be base 64 encoded. app-generated content (report csv's) will not.
//_app.u.dump("vars.skipdecode: "+vars.skipDecode);

				var	file = (vars.skipDecode) ? vars.body : atob(vars.body);
					// Use typed arrays to convert the binary data to a Blob
					//http://stackoverflow.com/questions/10473932/browser-html-force-download-of-image-from-src-dataimage-jpegbase64
				var arraybuffer = new ArrayBuffer(file.length);
				var L = file.length;
				var view = new Uint8Array(arraybuffer);
				for (var i=0; i < L; i++) {
					view[i] = file.charCodeAt(i) & 0xff;
					}
				var bb = new Blob([arraybuffer], {type: 'application/octet-stream'});
				
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


			handleCommonPlugins : function($context)	{
				$('.applyAnycb',$context).anycb();
				$('.applyAnytable',$context).anytable();
				$('.toolTip',$context).tooltip();
				$('.applyAnytabs',$context).anytabs();
				//will set the title attribute to the placeholder value (if title not already set). useful for places w/ no label and content populated (covering the placeholder value).
				$(":input[placeholder]",$context).not(['title']).each(function(){
					$(this).attr('title',$(this).attr('placeholder'));
					});
				},

// a utility for converting to jquery button()s.  use applyButton and optionally set some data attributes for text and icons.
			handleButtons : function($target)	{
//			_app.u.dump("BEGIN _app.u.handleButtons");
				if($target && $target instanceof jQuery)	{
					$('.applyButtonset',$target).each(function(){
						$(this).buttonset();
						});
					$('.applyButton',$target).each(function(index){
//					_app.u.dump(" -> index: "+index);
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
					$('#globalMessaging').anymessage({"message":"In _app.u.handleButtons, $target was empty or not a valid jquery instance. ","gMessage":true});
					}
				},
//at one point, this was a plugin, but w/ the introduction of multiple app instantiations, that changed.
//What was the plugin was split into two pieces, the app-event based delegation is here.  The form based is in anyForm
			addEventDelegation : function($t,vars)	{
				vars = vars || {};
				var supportedEvents = new Array("click","change","focus","blur","submit","keyup","keypress");

				function destroyEvents($ele)	{
					for(var i = 0; i < supportedEvents.length; i += 1)	{
						$ele.off(supportedEvents[i]+".app");
						}
					$ele.removeClass('hasDelegatedEvents').addClass('delegationDestroyed'); //here for troubleshooting purposes.
					}

				if(vars.destroyEvents || vars == 'destroyEvents')	{
					destroyEvents($t);
					}
				else	{
					if($t.closest('.hasDelegatedEvents').length >= 1)	{
						//this element or one of it's parents already has events delegated. don't double up.
						}
					else	{
						//this class is used both to determine if events have already been added AND for some form actions to use in closest.
						$t.addClass('hasDelegatedEvents'); 

						for(var i = 0; i < supportedEvents.length; i += 1)	{
							$t.on(supportedEvents[i]+".app","[data-app-"+supportedEvents[i]+"]",function(e,p){
//								dump(" -> executing event. p: "); dump(p);
								return _app.u._executeEvent($(e.currentTarget),$.extend(p,e));
								});
							}	

						//make sure there are no children w/ delegated events so that event actions are not doubled up.
						$('.hasDelegatedEvents',$t).each(function(){
							destroyEvents($(this));
							});
						}
					}
				}, //addEventDelegation

			_executeEvent : function($CT,ep)	{
				ep = ep || {};
				var type = ep.type;
				if(ep.handleObj && ep.handleObj.origType)	{
					type = ep.handleObj.origType; //use this if available. ep.type could be 'focusOut' instead of 'blur'.
					}
				
//				dump(" -> type: "+type);
				
				var r, actionsArray = $CT.attr('data-app-'+type).split(","), L = actionsArray.length; // ex: admin|something or admin|something, admin|something_else
				for(var i = 0; i < L; i += 1)	{
					var	AEF = $.trim(actionsArray[i]).split('|'); //Action Extension Function.  [0] is extension. [1] is Function.
	//				dump(i+") AEF: "); dump(AEF);
					if(AEF[0] && AEF[1])	{
						if(_app.ext[AEF[0]] && _app.ext[AEF[0]].e[AEF[1]] && typeof _app.ext[AEF[0]].e[AEF[1]] === 'function')	{
							//execute the app event.
							r = _app.ext[AEF[0]].e[AEF[1]]($CT,ep);
							}
						else	{
							$('#globalMessaging').anymessage({'message':"In _app.u._executeEvent, extension ["+AEF[0]+"] and function["+AEF[1]+"] both passed, but the function does not exist within that extension.",'gMessage':true})
							}
						}
					else	{
						$('#globalMessaging').anymessage({'message':"In _app.u._executeEvent, data-app-"+ep.normalizedType+" ["+$CT.attr('data-app-'+ep.normalizedType)+"] is invalid. Unable to ascertain Extension and/or Function",'gMessage':true});
						}				
					}
				return r;
				},

//a UI Action should have a databind of data-app-event (this replaces data-btn-action).
//value of action should be EXT|buttonObjectActionName.  ex:  admin_orders|orderListFiltersUpdate
//good naming convention on the action would be the object you are dealing with followed by the action being performed OR
// if the action is specific to a _cmd or a macro (for orders) put that as the name. ex: admin_orders|orderItemAddBasic
//obj is some optional data. obj.$content would be a common use.
			handleAppEvents : function($target,obj)	{
	//				_app.u.dump("BEGIN _app.u.handleAppEvents");
					obj = obj || {}; //needs to be outside 'each' or obj gets set to blank.
					if($target instanceof jQuery)	{
	//					_app.u.dump(" -> target exists"); _app.u.dump($target);
	//don't auto-pass context. will be harder for event delegation
						$("[data-app-event]",$target).each(function(){
							var $ele = $(this),
							extension = $ele.data('app-event').split("|")[0],
							action = $ele.data('app-event').split("|")[1];
							if(action && extension && _app.ext[extension] && _app.ext[extension].e && typeof _app.ext[extension].e[action] == 'function'){
	//if an action is declared, every button gets the jquery UI button classes assigned. That'll keep it consistent.
	//if the button doesn't need it (there better be a good reason), remove the classes in that button action.
								_app.ext[extension].e[action]($ele,obj);
								} //no action specified. do nothing. element may have it's own event actions specified inline.
							else	{
								_app.u.throwGMessage("In admin.u.handleAppEvents, unable to determine action ["+action+"] and/or extension ["+extension+" typeof _app.data.extension: "+(extension ? typeof _app.data[extension] : 'undefined')+"] and/or extension/action combination is not a function");
								}
							});
						}
					else	{
						//don't throw error to user. target 'could' be in memory.
						_app.u.dump("In _app.u.handleAppEvents, target was either not specified/an object ["+($target instanceof jQuery)+"] or does not exist on DOM.",'warn');
						
						}
					
					}, //handleAppEvents

			printByjqObj : function($ele)	{
				var printWin = false;
				if($ele && $ele instanceof jQuery)	{
/*					var html="<html><style>@media print{.pageBreak {page-break-after:always} .hide4Print {display:none;}}</style><body style='font-family:sans-serif;'>";
					html+= $ele.html();
					html+="</body></html>";
					
					printWin = window.open('','','left=0,top=0,width=600,height=600,toolbar=0,scrollbars=0,status=0');
//a browser could disallow the window.open, which results in printWin NOT being defined and that ends in a JS error, so 'if' added.
					if(printWin)	{
						printWin.document.write(html);
						printWin.document.close();
						printWin.focus();
						printWin.print();
						printWin.close();
						}
*/

var $pc = $("#printContainer");
if($pc.length)	{
	$pc.empty(); //emptied to make sure anything leftover from last print is gone.
	}
else	{
	$pc = $("<div \/>",{'id':'printContainer'}).css('display','none').appendTo(document.body);
	}
var $iframe = $("<iframe \/>").attr({'id':'printContainerIframe','name':'printContainerIframe'}).appendTo($pc);
$iframe.contents().find('body').append($ele.html());
$iframe.contents().find('head').append('<style>@media print{.pageBreak {page-break-after:always} .hide4Print {display:none;}}</style>');
window.frames["printContainerIframe"].focus();
window.frames["printContainerIframe"].print();


					}
				else	{
					$('#globalMessaging').anymessage({'message':'In _app.u.printBySelector, $ele not passed or not on DOM','gMessage':true});
					}
				return printWin;
				},

//pass in "_app.data.something.something" as s (string) and this will test to make sure it exists.
//co (Context Object) is an optional param to search within. ex:  thisNestedExists("data.something.something",_app) will look for _app.data.somthing.something and return true if it exists or false if it doesn't.
			thisNestedExists : function(s,co){
				return _app.u.getObjValFromString(s,co || window,'.') ? true : false;
				},

//pass in a string (my.string.has.dots) and a nested data object, and the dots in the string will map to the object and return the value.
//ex:  ('a.b',obj) where obj = {a:{b:'go pack go'}} -> this would return 'go pack go'
//will be used in updates to translator.

//http://stackoverflow.com/questions/5240785/split-abc/5240797#5240797
			getObjValFromString : function (s,obj,char)	{
				char = char || '.';
				var o=obj, attrs=s.split(char);
				while (attrs.length > 0) {
					o = o[attrs.shift()];
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
				$(_app.u.jqSelector('#',parentID || 'globalMessaging')).anymessage(msg);
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
	//			_app.u.dump("BEGIN _app.u.throwMessage");
	//			_app.u.dump(" -> msg follows: "); _app.u.dump(msg);
	
				
	
				var $target, //where the app message will be appended.
				r = true; //what is returned. true if a message was output
	
				if(typeof msg === 'string')	{
					msg = this.youErrObject(msg,"#"); //put message into format anymessage can understand.
					}
	
				if(typeof msg === 'object')	{
	//				_app.u.dump(" -> msg: "); _app.u.dump(msg);
					if(msg._rtag && msg._rtag.jqObj)	{$target = msg._rtag.jqObj}
					else if(msg.parentID){$target = $(_app.u.jqSelector('#',msg.parentID));}
					else if(msg._rtag && (msg._rtag.parentID || msg._rtag.targetID || msg._rtag.selector))	{
						if(msg._rtag.parentID)	{$target = $(_app.u.jqSelector('#',msg._rtag.parentID))}
						else if(msg._rtag.targetID)	{$target = $(_app.u.jqSelector('#',msg._rtag.targetID))}
						else	{
							$target = $(_app.u.jqSelector(msg['_rtag'].selector.charAt(0),msg['_rtag'].selector));
							}
						}
					else if($('.appMessaging:visible').length > 0)	{$target = $('.appMessaging:visible');}
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
					_app.u.dump("WARNING! - unknown type ["+typeof err+"] set on parameter passed into _app.u.throwMessage");
					r = false; //don't return an html id.
					}
	//get rid of all the loading gfx in the target so users know the process has stopped.
				$target.removeClass('loadingBG');
				if(typeof jQuery().hideLoading == 'function'){$target.hideLoading()} //used in UI. plan on switching everything applicable to this.
	// 			_app.u.dump(" -> $target in error handling: "); _app.u.dump($target);
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
				return {'errid':errid || 0,'errmsg':errmsg,'errtype':'youerr','iconClass':'ui-icon-youerr','containerClass':'ui-state-highlight'}
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
				if(s)	{
					if(s.charAt(0) == '&')	{s = s.substring(1);} //regex below doesn't like the first char being an &.
					if(s.indexOf('=') > -1)	{
						r = s ? JSON['parse']('{"' + s.replace(/&/g, '","').replace(/=/g,'":"') + '"}',function(key, value) { return key===""?value:decodeURIComponent(value) }) : {};
						}
					}
				return r;
				}, //kvp2Array
		

/*

AUTHENTICATION/USER

*/

//## allow for targetID to be passed in.
			logBuyerOut : function()	{
	//kill all the memory and localStorage vars used in determineAuthentication
				_app.model.destroy('appBuyerLogin'); //nuke this so app doesn't fetch it to re-authenticate session.
				_app.model.destroy('cartDetail|'+_app.model.fetchCartID()); //need the cart object to update again w/out customer details.
				_app.model.destroy('whoAmI'); //need this nuked too.
				_app.vars.cid = null; //used in soft-auth.
				_app.calls.buyerLogout.init({'callback':'showMessaging','message':'Thank you, you are now logged out'});
//				_app.calls.refreshCart.init({},'immutable');
				_app.model.dispatchThis('immutable');
				if($.support.localStorage)	{
					window.localStorage.clear(); //clear everything from localStorage.
					}
				}, //logBuyerOut

			thisIsAnAdminSession : function()	{
				//while technically this could be spoofed, the API wouldn't accept invalid values
				return (_app.vars.deviceid && _app.vars.userid && _app.vars.authtoken) ? true : false;
				}, //thisIsAnAdminSession
	
	//uses the supported methods for determining if a buyer is logged in/session is authenticated.
	//neither whoAmI or appBuyerLogin are in localStorage to ensure data from a past session isn't used.
			buyerIsAuthenticated : function()	{
				var r = false;
				if(_app.data.whoAmI && _app.data.whoAmI.cid)	{r = true}
				else if(_app.data.appBuyerLogin && _app.data.appBuyerLogin.cid)	{r = true}
				return r;
				}, //buyerIsAuthenticated

//pretty straightforward. If a cid is set, the session has been authenticated.
//if the cid is in the cart/local but not the control, set it. most likely this was a cart passed to us where the user had already logged in or (local) is returning to the checkout page.
//if no cid but email, they are a guest.
//if logged in via facebook, they are a thirdPartyGuest.
//this could easily become smarter to take into account the timestamp of when the session was authenticated.
			
			determineAuthentication : function(){
				var r = 'none', cartID = _app.model.fetchCartID();
				if(this.thisIsAnAdminSession())	{r = 'admin'}
				else if(_app.u.buyerIsAuthenticated())	{r = 'authenticated'}
	//need to run third party checks prior to default 'guest' check because bill/email will get set for third parties
	//and all third parties would get 'guest'
				else if(typeof FB != 'undefined' && !$.isEmptyObject(FB) && FB['_userStatus'] == 'connected')	{
					r = 'thirdPartyGuest';
					}
				else if(_app.model.fetchData('cartDetail|'+cartID) && _app.data['cartDetail|'+cartID] && _app.data['cartDetail|'+cartID].bill && _app.data['cartDetail|'+cartID].bill.email)	{
					r = 'guest';
					}
				else	{
					//catch.
					}
				return r;
				}, //determineAuthentication
	
	
			hash2kvp : function(hash,encode)	{
				encode = (encode === false) ? false : true;
				var str = [];
				for(var p in hash)
					if (hash.hasOwnProperty(p)) {
					str.push(encodeURIComponent(p) + "=" + encodeURIComponent(hash[p]));
					}
				return str.join('&');
				},
	
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
// SANITY -> indexOf not supported for searching arrays in IE8
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
// SANITY -> indexOf not supported for searching arrays in IE8
					if($.inArray(index, blacklist) >= 0)	{
						delete r[index];
						}
					else	{} //is not in blacklist
					}
				return r;
				},




/*

BROWSER/OS
this information is collected and sent along w/ an order create or in the admin UI for a ticket create for troubleshooting purposes.
*/


			getBrowserInfo : function()	{
				var
					ua= navigator.userAgent.toLowerCase(),
					match = /(chrome)[ \/]([\w.]+)/.exec( ua ) || /(webkit)[ \/]([\w.]+)/.exec( ua ) || /(opera)(?:.*version|)[ \/]([\w.]+)/.exec( ua ) || /(msie) ([\w.]+)/.exec( ua ) || ua.indexOf("compatible") < 0 && /(mozilla)(?:.*? rv:([\w.]+)|)/.exec( ua ) || [];
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

//current time in epoch format.
		epochNow : function()	{
			return Math.round(new Date().getTime()/1000.0)
			}, //epochNow
//very simple date translator. if something more specific is needed, create a custom function.
//ts should be an epoch timestamp
//will support a boolean for showtime, which will show the time, in addition to the date.
		epoch2Pretty : function(ts,showtime)	{
//			_app.u.dump('BEGIN _app.u.epoch2Pretty');
//			_app.u.dump(' -> tx = '+ts);
			var date = new Date(Number(ts)*1000);
			var r;
			r = _app.u.jsMonth(date.getMonth());
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
//zero will b treated as true.
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
			var unicode=e.charCode? e.charCode : e.keyCode;
			var r = true;
			if(unicode >= 48 && unicode <= 57)	{r = true; _app.u.dump('got here')} // allow 0 - 9.
			else if(unicode == 9 || unicode == 8 || unicode == 46 || unicode == 13)	{r = true;} //allow backspace, tab, delete and enter.
			else if(unicode == 37 || unicode == 39)	{r = true;} //allow left and right arrow.
			else if(unicode == 36 || unicode == 35)	{r = true;} //allow home and end keys
			else	{r = false;}
//			_app.u.dump(" -> unicode: "+unicode);
			return r;
			},

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
// ## FUTURE -> if the field is required and no value is set and type != radio, add required to span and exit early. cuts out a big block of code for something fairly obvious. (need to take skipIfHidden into account)
//				errors for each input should be an array. format-rules should return a string and not get passed span for an error.
		validateForm : function($form)	{
			_app.u.dump("BEGIN admin.u.validateForm");
			if($form && $form instanceof jQuery)	{

				
				var r = true; //what is returned. false if any required fields are empty.
				var radios = {};  //an object used to store whether or not radios are required and, if so, whether one is selected.
				$form.showLoading({'message':'Validating'});

				$('.formValidationError',$form).empty().remove(); //clear all previous error messaging
				var radios = {} //stores a list of which radio inputs are required.
				$(':input',$form).each(function(){
					var
						$input = $(this),
						$span = $("<span \/>").css('padding-left','6px').addClass('formValidationError'),
						required = ($input.attr('required') == 'required') ? true : false;
					
					$input.removeClass('ui-state-error'); //remove previous error class
				
					function removeClass($t){
						$t.off('focus.removeClass').on('focus.removeClass',function(){$t.removeClass('ui-state-error')});
						}

//					_app.u.dump(" -> "+$input.attr('name')+" - required: "+$input.attr('required'));
					if($input.is(':hidden') && $input.data('validation-rules') && $input.data('validation-rules').indexOf('skipIfHidden') >= 0)	{
						dump(" -> skipIfHidden is enabled");
						//allows for a form to allow hidden fields that are only validated if they're displayed. ex: support fieldset for topic based questions.
						//indexOf instead of == means validation-rules (notice the plural) can be a space seperated list
						}
					else if($input.prop('disabled')){} //do not validate disabled fields. if required and blank and disabled, form would never submit.
					else if($input.prop('type') == 'radio'){
//keep a list of all required radios. only one entry per name.
//_app.u.dump(" -> $input.attr('name'): "+$input.attr('name')+' and required: '+$input.attr('required'));

						if(required)	{
							radios[$input.attr('name')] = 1
							}
						}
					else if($input.attr('data-format-rules') && (required || $input.val()))	{
						var rules = $input.attr('data-format-rules').split(' ');
						if(_app.u.processFormatRules(rules,$input,$span))	{}
						else	{
							r = false;
							$input.addClass('ui-state-error');
							$input.after($span);
							}
						
						}
//only validate the field if it's populated. if it's required and empty, it'll get caught by the required check later.
					else if($input.attr('type') == 'url' && $input.val())	{
						var urlregex = new RegExp("^(http:\/\/|ssh:\/\/|https:\/\/|ftp:\/\/){1}([0-9A-Za-z]+\.)");
						if (urlregex.test($input.val())) {}
						else	{
							r = false;
							$input.addClass('ui-state-error');
							$input.after($span.text('not a valid url. '));
							$("<span class='toolTip' title='A url must be formatted as http, https, ssh or ftp ://www.something.com/net/org/etc'>?<\/span>").tooltip().appendTo($span);
							}
						}

					else if($input.attr('type') == 'number' && $input.val())	{
//						_app.u.dump(" -> number validation. value: "+$input.val()+" and isNaN: "+isNaN($input.val()));
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
//								_app.u.dump(" -> everything appears to check out w/  "+$input.attr('name')+" number input.");
								}
							}
						else	{
							_app.u.dump(" -> value is not a number");
							r = false;
							$input.addClass('ui-state-error');
							$input.after($span.text('not a number. '));
							}
						}

					else if ($input.attr('type') == 'email' && !_app.u.isValidEmail($input.val()))	{
						//only 'error' if field is required. otherwise, show warning
						if(required)	{
							r = false;
							$input.addClass('ui-state-error');
							}
						else if($input.val())	{
							$input.after($span.text('not a valid email address'));
							removeClass($input);
							}
						else	{} //field is not required and blank.
						}
//technically, maxlength isn't a supported attribute for a textarea. data-maxlength is used instead.
					else if(($input.attr('maxlength') && $input.val().length > $input.attr('maxlength')) || ($input.attr('data-maxlength') && $input.val().length > $input.attr('data-maxlength')))	{
						r = false;
						$input.addClass('ui-state-error');
						$input.after($span.text('allows a max of '+($input.attr('maxlength') || $input.attr('data-maxlength'))+' characters'));
						removeClass($input);
						}
					else if($input.data('minlength') && $input.val().length < $input.data('minlength'))	{
						r = false;
						$input.addClass('ui-state-error');
						$input.after($span.text('requires a minimum of '+$input.data('minlength')+' characters'));
						removeClass($input);
						}
//Support for 'min' attr which is the minimum numerical value (ex: 0 or 7) for the input value.
//number input type has a native min for minimum value
					else if($input.attr('min') && Number($input.val()) < Number($input.attr('min')))	{
						r = false;
						$input.addClass('ui-state-error');
						$input.after($span.text('requires a minimum value of '+$input.attr('min')));
						removeClass($input);
						}
//Support 'max' attr which is the maximum numerical value (ex: 0 or 7) for the input value.
//number input type has a native max for max value
					else if($input.attr('max') && Number($input.val()) > Number($input.attr('max')))	{
						r = false;
						$input.addClass('ui-state-error');
						$input.after($span.text('requires a maximum value of '+$input.attr('max')));
						removeClass($input);
						}
//Checking required is last so that the more specific error messages would be displayed earlier
					else if(required && !$input.val())	{
						r = false;
						$input.addClass('ui-state-error');
						$input.after($span.text('required'));
						removeClass($input);
						}
					else	{
						
						}

					
					if($input.hasClass('ui-state-error'))	{
						_app.u.dump(" -> "+$input.attr('name')+" did not validate. ishidden: "+$input.is(':hidden'));
						}
					
					});


//_app.u.dump(" -> radios:"); _app.u.dump(radios);
				if(!$.isEmptyObject(radios))	{
//					_app.u.dump(" -> radios is not empty");
					var L = radios.length;
					for(var index in radios)	{
						if($("input:radio[name='"+index+"']:checked",$form).val())	{
//							_app.u.dump(" -> radio name='"+index+"' has a value selected");
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
//			_app.u.dump(" -> r in validateForm: "+r);
			return r;
			},
//accepts an array of 'rules'
		processFormatRules : function(rules,$input,$span)	{
//			_app.u.dump("BEGIN _app.u.processFormatRules"); _app.u.dump(rules);
			var r = true; //defaults to true. one err in rules and it'll be set to false.
			if(typeof rules == 'object' && $input instanceof jQuery)	{
				var L = rules.length;
				for(var i = 0; i < L; i += 1)	{
					_app.u.dump(i+") is for rule: "+rules[i]+" and typeof formatRules: "+typeof _app.formatRules[rules[i]]);
					if(typeof _app.formatRules[rules[i]] == 'function')	{
						if(_app.formatRules[rules[i]]($input,$span))	{_app.u.dump("passed rule validation")}
						else	{
							r = false;
							}
						}
					else	{
						_app.u.dump("A formatting rule ["+rules[i]+"] that does not exist was specified on an input: "+$input.attr('name'),"warn");
						}
					}
				}
			else	{
				$('#globalMessaging').anymessage({"message":"In contoller.u.processFormatRules, either rules is not an array ["+(typeof rules)+"] or $input is not a valid jquery instance ["+($input instanceof jQuery)+"].","gMessage":true});
				}
			return r;
			},






//used frequently to throw errors or debugging info at the console.
//called within the throwError function too
		dump : function(msg,type)	{
			// * 201402 -> the default type for an object was changed to debug to take less room in the console. dir is still available if passed as type.
			if(!type)	{type = (typeof msg == 'object') ? 'debug' : 'log';} //supported types are 'warn' and 'error'
//if the console isn't open, an error occurs, so check to make sure it's defined. If not, do nothing.
			if(typeof console != 'undefined')	{
// ** 201402 -> moved the type check to the top so that it gets priority (otherwise setting debug on an object is overridden by dir)
				if(type && typeof console[type] === 'function')	{
					console[type](msg);
					}
				else if(typeof console.dir == 'function' && typeof msg == 'object')	{
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
				else	{} //hhhhmm... unsupported type.
					
				}
			}, //dump

//javascript doesn't have a great way of easily formatting a string as money.
//top that off with each browser handles some of these functions a little differently. nice.
		formatMoney : function(A, currencySign, decimalPlace,hideZero){
	//		_app.u.dump("BEGIN u.formatMoney");
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
	//			_app.u.dump(" -> b = "+b);
				a = parseInt(a); // get 12345678
				b = (b-a).toPrecision(decimalPlace); //get 0.90
				b = parseFloat(b).toFixed(decimalPlace); //in case we get 0.0, we pad it out to 0.00
				a = a.toLocaleString();//put in commas - IE also puts in .00, so we'll get 12,345,678.00
	//			_app.u.dump(" -> a = "+a);
				//if IE (our number ends in .00)
				if(a.indexOf('.00') > 0)	{
					a=a.substr(0, a.length-3); //delete the .00
	//				_app.u.dump(" -> trimmed. a. a now = "+a);
					}
				r = a+b.substr(1);//remove the 0 from b, then return a + b = 12,345,678.90
	
	//if the character before the decimal is just a zero, remove it.
				if(r.split('.')[0] == 0){
					r = '.'+r.split('.')[1]
					}
				
	//			_app.u.dump(" -> r = "+r);
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
the old 'lib' feature for loading images from another media library is no longer supported.
_app.u.makeImage({"name":"","w":150,"h":150,"b":"FFFFFF","class":"prodThumb","tag":1});
*/
		makeImage : function(a)	{
//			_app.u.dump(a);
			a.m = a.m ? 'M' : '';  //default to minimal mode off. If anything true value (not 0, false etc) is passed in as m, minimal is turned on.
//			_app.u.dump(' -> library: '+a.lib+' and name: '+a.name);
			if(a.name == null) { a.name = 'i/imagenotfound'; }
			
			var url, tag;
			// alert(a.lib);		// uncomment then go into media library for some really wonky behavior 
		
				//default height and width to blank. setting it to zero or NaN is bad for IE.
//Handling for when no parameters are set, as well as a bug fix where a necessary '-' character was being removed -mc
			if(a.h == null || a.h == 'undefined' || a.h == 0)
				a.h = '';
			if(a.w == null || a.w == 'undefined' || a.w == 0)
				a.w = '';
			if(a.b == null || a.b == 'undefined')
				a.b = '';
//In an admin session, the config.js isn't loaded. The secure domain is set as a global var when a domain is selected or can be retrieved from adminDomainList
			if(_app.u.thisIsAnAdminSession())	{
				if(location.protocol === 'file:')	{
					url = 'http:\/\/'+(_app.vars.domain);
					}
				else	{
					url = 'https:\/\/'+(_app.vars['media-host'] || _app.data['adminDomainList']['media-host']);
					}
				//make sure domain ends in a /
				if(url.charAt(url.length) != '/')	{
					url+="\/"
					}
				url += "media\/img\/"+_app.vars.username+"\/";
				}
			else	{
				url = location.protocol === 'https:' ? zGlobals.appSettings.https_app_url : zGlobals.appSettings.http_app_url;
				url += "media\/img\/"+_app.vars.username+"\/";
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

				if(url.charAt(url.length-1) == '-')	{
					url = url.slice(0,url.length-1); //strip trailing - because it isn't stricly 'compliant' with media lib specs.
					}
				}
			url += '\/'+a.name;
			
			if(a.tag == true)	{
				a['class'] = typeof a['class'] == 'string' ? a['class'] : ''; //default class to blank
				a['id'] = typeof a['id'] == 'string' ? a['id'] : 'img_'+a.name; // default id to filename (more or less)
				a['alt'] = typeof a['alt'] == 'string' ? a['alt'] : a.name; //default alt text to filename
// If width and height are present, they are added to the tag.  This solves an issue that occurs in loading
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
//			_app.u.dump("BEGIN control.u.makesafehtmlid");
//			_app.u.dump("string: "+string);
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
			else if(!_app.u.isSet(val)){valid = false}
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
//			_app.u.dump('BEGIN _app.u.isValidPhoneNumber. phone = '+phoneNumber);
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
			 _app.u.dump("BEGIN _app.u.isValidPostalCode. countryCode: "+countryCode);
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





//By saving these to the $.support object, a quick lookup method is available.
//In addition, it allows a developer to easily turn off features by setting the value to false.
		updatejQuerySupport : function()	{
			if(jQuery && typeof jQuery.support == 'object')	{

				jQuery.support.speechRecognition = ('webkitSpeechRecognition' in window) || ('speechRecognition' in window);
				jQuery.support.onpopstate = ('onpopstate' in window);
				jQuery.support.onhashchange = ('onhashchange' in window);
				jQuery.support.WebSocket = ('WebSocket' in window);



//If certain privacy settings are set in a browser, even detecting if localStorage is available causes a NS_ERROR_NOT_AVAIL.
//So we first test to make sure the test doesn't cause an error. thanks ff.
				try{
					window.localStorage;
					window.localStorage.setItem('test','test');
					if(window.localStorage.getItem('test') == 'test')	{
						jQuery.support.localStorage = true;
						}
					}
				catch(e){jQuery.support.localStorage = false;}
				
				try{
					window.sessionStorage;
					window.sessionStorage.setItem('test','test');
					if(window.sessionStorage.getItem('test') == 'test')	{
						jQuery.support.sessionStorage = true;
						}
					}
				catch(e){jQuery.support.sessionStorage = false;}

//update jQuery.support with whether or not placeholder is supported.
				jQuery.support.placeholder = false;
				var test = document.createElement('input')
				if('placeholder' in test) {jQuery.support.placeholder = true};

				}
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

$('target').html(_app.renderFunctions.transmogrify(eleAttr,templateID,data));  or jQuery.append() depending on need.
either way, what's returned from this function is a fully translated jquery object of the template.

if eleAttr is a string, that's the ID to be added to the template.  If the eleAttr is an object, it's a list of data attributes to be added to the template. this allows for things like data-pid or data-orderid to be set, which is handy for onClicks and such. pass in as {'pid':'productid'} and it'll be translated to data-pid='productid'

transmogrify wants eleAttr passed in without data- on any of the keys.
createTemplateInstance wants it WITH data- (legacy).

will want to migrate createTemplate to NOT have it passed in and add it manually, for now.
Then we'll be in a better place to use data() instead of attr().

*/
		transmogrify : function(eleAttr,templateID,data)	{
//			_app.u.dump("BEGIN control.renderFunctions.transmogrify (tid: "+templateID+")");
//			_app.u.dump(eleAttr);

//If a template ID is specified but does not exist, try to make one. added 2012-06-12
			if(templateID && !_app.templates[templateID])	{
				var tmp = $('#'+templateID);
				if(tmp.length > 0)	{
					_app.model.makeTemplate(tmp,templateID);
					}
				else{} //do nothing. Error will get thrown later.
				}
//			_app.u.dump(" -> got past templateID");
			if(!templateID || typeof data != 'object' || !_app.templates[templateID])	{
//product lists get rendered twice, the first time empty and always throw this error, which clutters up the console, so they're suppressed.
				_app.u.dump(" -> templateID ["+templateID+"] is not set or not an object ["+typeof _app.templates[templateID]+"] or typeof data ("+typeof data+") not object.");
				if(typeof eleAttr == 'string'){_app.u.dump(" -> ID: "+eleAttr)} else {_app.u.dump(" -> ID: "+eleAttr.id)}

//				_app.u.dump(eleAttr);
				}
			else	{
//				_app.u.dump(" -> transmogrify has everything it needs.");
//we have everything we need. proceed.

var $r = _app.templates[templateID].clone(true); //clone is always used so original is 'clean' each time it's used. This is what is returned.
//_app.u.dump(" -> template cloned");
$r.attr('data-templateid',templateID); //note what templateID was used. handy for troubleshooting or, at some point, possibly re-rendering template
if(_app.u.isSet(eleAttr) && typeof eleAttr == 'string')	{
//	_app.u.dump(' -> eleAttr is a string.');
	$r.attr('id',_app.u.makeSafeHTMLId(eleAttr)) 
	}
//NOTE - eventually, we want to get rid of this check and just use the .data at the bottom.
else if(typeof eleAttr == 'object')	{
//	_app.u.dump(' -> eleAttr is an object.');
// applying an empty object as .data caused a JS error in IE8
	if($.isEmptyObject(eleAttr))	{
//		_app.u.dump(" -> eleAttr is empty");
		}
	else	{
//		_app.u.dump(" -> eleAttr is NOT empty");
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

	if(eleAttr && eleAttr.id)	{$r.attr('id',eleAttr.id)} //override the id with a safe id, if set.
	}
//_app.u.dump(" -> got through transmogrify. now move on to handle translation and return it.");
return this.handleTranslation($r,data);


				}
			}, //transmogrify
		
/*		
templateID should be set in the view or added directly to _app.templates. 
eleAttr is optional and allows for the instance of this template to have a unique id. used in 'lists' like results.
eleAttr was expanded to allow for an object. 
currently, id, pid and catsafeid are supported. These are added to the parent element as either id or data-pid or data-catsafeid
most likely, this will be expanded to support setting other data- attributes. ###
*/
		createTemplateInstance : function(templateID,eleAttr)	{
//			_app.u.dump('BEGIN _app.renderFunctions.createTemplateInstance. ');
//			_app.u.dump(' -> templateID: '+templateID);
//creates a copy of the template.
			var r;
//if a templateID is passed, but no template exists, try to create one.
			if(templateID && !_app.templates[templateID])	{
				var tmp = $('#'+templateID);
				if(tmp.length > 0)	{
					_app.u.dump("WARNING! template ["+templateID+"] did not exist. Matching element found in DOM and used to create template.");
					_app.model.makeTemplate(tmp,templateID);
					}
				}
				
			if(templateID && _app.templates[templateID])	{
				r = _app.templates[templateID].clone(true); //necessary to copy events from templates for completes, inits, etc.
				if(typeof eleAttr == 'string')	{r.attr('id',_app.u.makeSafeHTMLId(eleAttr))}
				else if(typeof eleAttr == 'object')	{
//an attibute will be set for each. {data-pid:PID} would output data-pid='PID'
					for(var index in eleAttr)	{
						r.attr('data-'+index,eleAttr[index])
						}
				//override the id with a safe id, if set.
					if(eleAttr.id)	{
						r.attr('id',_app.u.makeSafeHTMLId(eleAttr.id));
						}
					}
				r.attr('data-templateid',templateID); //used by translateTemplate to know which template was used..
				}
			else	{
				_app.u.dump(" -> ERROR! createTemplateInstance -> templateID ["+templateID+"] not specified or does not exist[ "+typeof _app.templates[templateID]+"]! eleAttr = "+eleAttr);
				r = false;
				}

			return r;
			}, //createTemplateInstance

//allows translation by selector and does NOT require a templateID. This is very handy for translating after the fact.
		translateSelector : function(selector,data)	{
//an empty object for data is still valid.
			if(typeof data == 'object' && selector)	{
				this.handleTranslation(typeof selector == 'object' ? selector : $(selector),data); //selector can be a string or a jquery object.
				}
			else	{
				_app.u.dump("WARNING! - either selector ["+typeof selector+"] or data [typeof: "+typeof data+"] was not set in translateSelector");
				}
			},


//NEVER call this function directly.  It gets executed in transmogrify and translate element. it has no error handling (gets handled in parent function)
		handleTranslation : function($r,data)	{
//_app.u.dump("BEGIN _app.renderFunctions.handleTranslation");
//locates all children/grandchildren/etc that have a data-bind attribute within the parent id.
//
$r.find('[data-bind]').addBack('[data-bind]').each(function()	{
										   
	var $focusTag = $(this);
	var value;

//	_app.u.dump(' -> data-bind match found: '+$focusTag.data('bind'));
//proceed if data-bind has a value (not empty).
	if(_app.u.isSet($focusTag.attr('data-bind'))){
		var bindRules = _app.renderFunctions.parseDataBind($focusTag.attr('data-bind'));
//		_app.u.dump(" -> bindRules.var: "+bindRules['var']);

//in some cases, it's necessary to pass the entire data object into the renderFormat. admin_orders paymentActions renderFormat is a good example. Most likely this will be used frequently in admin, in conjunction with processList renderFormat.
		if(bindRules.useParentData)	{
			value = data;
			}
		else	{
			if(bindRules['var'])	{
				value = _app.renderFunctions.getAttributeValue(bindRules['var'],data);  //set value to the actual value
				}

			if(!_app.u.isSet(value) && bindRules.defaultVar)	{
				value = _app.renderFunctions.getAttributeValue(bindRules['defaultVar'],data);
	//					_app.u.dump(' -> used defaultVar because var had no value. new value = '+value);
				}
			if(!_app.u.isSet(value) && bindRules.defaultValue)	{
				value = bindRules['defaultValue']
//				_app.u.dump(' -> used defaultValue ("'+bindRules.defaultValue+'") because var had no value.');
				}
			}
		}



	if(bindRules.hideZero == 'false') {bindRules.hideZero = false} //passed as string. treat as boolean.
	else	{bindRules.hideZero = true}
// SANITY - value should be set by here. If not, likely this is a null value or isn't properly formatted.
//	_app.u.dump(" -> value: "+value);

	if(Number(value) == 0 && bindRules.hideZero)	{
//do nothing. value is zero and zero should be skipped.
//		_app.u.dump(" -> value is 0 but was skipped: "+bindRules['var']);
		}
// ### NOTE - at some point, see if this code can be moved inot the render format itself so that no special handler needs to exist.
//did a quick try on this that failed. Need to revisit this when time permits.
	else if(bindRules.loadsTemplate && bindRules.format == 'loadsTemplate')	{
//in some cases, especially in the UI, we load another template that's shared, such as fileImport in admin_medialib extension
//in this case, the original data is passed through and no format translation is done on the element itself.
// OR, if a var is specified, then only that object within the parent data is passed.
//Examples:
// -> admin_tasks uses loadsTemplate with NO var to recycle 'create' template for editing.
// -> admin_orders uses a var to take advantage of 1 address template for billing and shipping. 
		if(bindRules['var'])	{
			$focusTag.append(_app.renderFunctions.transmogrify({},bindRules.loadsTemplate,data[_app.renderFunctions.parseDataVar(bindRules['var'])]));
			}
		else{
			$focusTag.append(_app.renderFunctions.transmogrify({},bindRules.loadsTemplate,data));
			}
		
		}
// forceRender, if true, will always execute the render format, regardless of whether a value is set on the attribute.
	else if(value || (Number(value) == 0 && bindRules.hideZero === false) || bindRules.forceRender)	{
		if(_app.u.isSet(bindRules.className)){$focusTag.addClass(bindRules.className)} //css class added if the field is populated. If the class should always be there, add it to the template.

		if(_app.u.isSet(bindRules.format)){
//the renderFunction could be in 1 of 2 places, so it's saved to a local var so it can be used as a condition before executing itself.
			var renderFormat; //saves a copy of the renderFormat to a local var.
			if(bindRules.extension && _app.ext[bindRules.extension] && typeof _app.ext[bindRules.extension].renderFormats == 'object' && typeof _app.ext[bindRules.extension].renderFormats[bindRules.format] == 'function')	{
				renderFormat = _app.ext[bindRules.extension].renderFormats[bindRules.format];
				}
			else if(typeof _app.renderFormats[bindRules.format] == 'function'){
				renderFormat = _app.renderFormats[bindRules.format];
				}
			else	{
				_app.u.dump("WARNING! unrecognized render format: "+bindRules.format);
				}

			if(typeof renderFormat == 'function')	{
				renderFormat($focusTag,{"value":value,"bindData":bindRules});
				if(bindRules.pretext)	{$focusTag.prepend(bindRules.pretext)} //used for text
				if(bindRules.posttext) {$focusTag.append(bindRules.posttext)}
				if(bindRules.before) {$focusTag.before(bindRules.before)} //used for html
				if(bindRules.after) {$focusTag.after(bindRules.after)}
				if(bindRules.wrap) {$focusTag.wrap(bindRules.wrap)}
				}
			else	{
				_app.u.throwMessage("Uh Oh! An error occured. error: "+bindRules.format+" is not a function. (See console for more details.)");
				_app.u.dump(" -> "+bindRules.format+" is not a function. extension = "+bindRules.extension);
//						_app.u.dump(bindRules);
				}
//					_app.u.dump(' -> custom display function "'+bindRules.format+'" is defined');
			
			}
		}
	else	{
		// attribute has no value.
//		_app.u.dump(' -> data-bind is set, but it has no/invalid value: '+bindRules['var']+" Number(value): "+Number(value)+" and bindRules.hideZero: "+bindRules.hideZero);
		if($focusTag.prop('tagName') == 'IMG'){$focusTag.remove()} //remove empty/blank images from dom. necessary for IE.

		}
	value = ''; //reset value.
	}); //end each for children.
$r.removeClass('loadingBG');
//		_app.u.dump('END translateTemplate');
return $r;			
			
			}, //handleTranslation

//each template may have a unique set of required parameters.

		translateTemplate : function(data,target)	{
	//		_app.u.dump('BEGIN translateTemplate (target = '+target+')');
			var safeTarget = _app.u.makeSafeHTMLId(target); //jquery doesn't like special characters in the id's.
			
			var $divObj = $('#'+safeTarget); //jquery object of the target tag. template was already rendered to screen using createTemplate.
			if($divObj.length > 0)	{
				var templateID = $divObj.attr('data-templateid'); //always use all lowercase for data- attributes. browser compatibility.
				var dataObj = $divObj.data();
	//yes, i wish I'd commented why this is here. jt. appears to be for preserving data() already set prior to re-rendering a template.
				if(dataObj)	{dataObj.id = safeTarget}
				else	{dataObj = safeTarget;}
	//believe the 'replace' to be causing a lot of issues. changed in 201239 build
	//			var $tmp = _app.renderFunctions.transmogrify(dataObj,templateID,data);
	//			$('#'+safeTarget).replaceWith($tmp);
				this.handleTranslation($('#'+safeTarget),data)
				}
			else	{
				_app.u.dump("WARNING! attempted to translate an element that isn't on the DOM. ["+safeTarget+"]");
				}
			
	//		_app.u.dump('END translateTemplate');
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
//_app.u.dump('BEGIN _app.renderFunctions.getAttributeValue');
			if(!v || !data)	{
				value = false;
				}
			else	{
				var value;
				var attributeID = this.parseDataVar(v); //used to store the attribute id (ex: zoovy:prod_name), not the actual value.
				var namespace = v.split('(')[0];

				if(namespace == 'product' && attributeID.indexOf(':') > -1)	{
					attributeID = '%attribs.'+attributeID; //product data is nested, but to keep templates clean, %attribs isn't required.
					value = _app.u.getObjValFromString(attributeID,data,'.') || data[attributeID]; //attempt to set value based on most common paths
					}
				else if(namespace == 'cart' || namespace == 'order')	{
					value = _app.u.getObjValFromString(attributeID,data,'/') || data[attributeID]; //attempt to set value based on most common paths
					}
				else	{
					value = _app.u.getObjValFromString(attributeID,data,'.') || data[attributeID]; //attempt to set value based on most common paths
					}
				}
			return value;
			},



//will return an array of objects.
		parseDataBindIntoRules : function(dataBind) {
			var tokens = dataBind.split(';'), rules = new Array();
			tokens.pop(); //strip the last item from the array, which will be blank.
			for(var token in tokens)	{
				var tmp = {};
				tmp[$.trim(token.substring(0,token.indexOf(':')))] = token.substring(token.indexOf(':') + 1);
				rules.push(tmp);
				}
			return rules;
			},




//this parses the 'css-esque' format of the data-bind.  It's pretty simple (fast) but will not play well if a : or ; is in any of the values.
//css can be used to add or remove those characters for now.
//will convert key/value pairs into an object.
// NOTE -> there is a server-side parseDataBind function. change this with caution.
		parseDataBind : function(data)	{
//			_app.u.dump('BEGIN parseDataBind');
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
//						_app.u.dump(' -> property['+i+']: '+property);
//						_app.u.dump(' -> value['+i+']: "'+value+'"');
					if(property != "" && value != "" && !rule[property])	{ //only the first property wins. discard the rest. (var can't be set twice)
//need to trim whitespace from values except pre and post text. having whitespace in the value causes things to not load. However, it's needed in pre and post text.
						rule[property] = (property == 'pretext' || property == 'posttext') ? value : jQuery.trim(value);
						}
					}
				}

//			_app.u.dump('END parseDataBind');
			return rule;
			},


//infoObj.state = onCompletes or onInits. later, more states may be supported.
			handleTemplateEvents : function($ele,infoObj)	{
				infoObj = infoObj || {};
				if($ele instanceof jQuery && infoObj.state)	{
					if($.inArray(infoObj.state,['init','complete','depart']) >= 0)	{
						if($ele.attr('data-app-'+infoObj.state))	{
							//the following code is also in _app.u.addEventDelegation(). It was copied (tsk, tsk. i know) because at the time, DE was in a plugin.
							// ### FUTURE -> since delegated events are back in the controller, see about getting these code bases unified.
							var AEF = $ele.attr('data-app-'+infoObj.state).split('|');
							if(AEF[0] && AEF[1])	{
								if(_app.ext[AEF[0]] && _app.ext[AEF[0]].e[AEF[1]] && typeof _app.ext[AEF[0]].e[AEF[1]] === 'function')	{
									//execute the app event.
									_app.ext[AEF[0]].e[AEF[1]]($ele,infoObj);
									}
								else	{
									$ele.anymessage({'message':"In _app.templateFunctions.handleTemplateEvents, extension ["+AEF[0]+"] and function["+AEF[1]+"] both passed, but the function does not exist within that extension.",'gMessage':true})
									}
								}
							else	{
								$ele.anymessage({'message':"In _app.templateFunctions.handleTemplateEvents, data-app-"+infoObj.state+" ["+$CT.attr('data-app-'+infoObj.state)+"] is invalid. Unable to ascertain Extension and/or Function",'gMessage':true});
								}						

							}
						$ele.trigger(infoObj.state,[$ele,infoObj]);
						}
					else	{
						$ele.anymessage({'message':'_app.templateFunctions.handleTemplateEvents, infoObj.state ['+infoObj.state+'] is not valid. Only init, complete and depart are acceptable values.','gMessage':true});
						}
					}
				else if($ele instanceof jQuery)	{
					$ele.anymessage({'message':'In _app.templateFunctions.handleTemplateEvents, infoObj.state not set.','gMessage':true});
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In _app.templateFunctions.handleTemplateEvents, $ele is not a valid jQuery instance','gMessage':true});
					}
				} //handleTemplateEvents 


		}, //renderFunctions



	tlcFormats : {
//The tlc should, for the most part, just update the bind that's in focus. It can do more, but that's the intent.
//They should return a boolean. True will continue executing the rest of the statement. False will end it.
		loop : function(data,thisTLC)	{
			var $tmp = $("<div>");

			var
				arr = data.globals.binds[data.globals.focusBind], 
				argObj = thisTLC.args2obj(data.command.args,data.globals);
			if(argObj.templateid)	{
//				dump(" -> templateid: "+argObj.templateid.value);// dump(arr);
				for(var i in arr)	{
					arr[i].obj_index = i; //allows for the data object to be looked up in memory later.
					$tmp.tlc({'templateid':argObj.templateid,'dataset':arr[i],'dataAttribs':arr[i]});
					}
				data.globals.binds[data.globals.focusBind] = $tmp.children();
				}
			else	{
				dump("No template specified",warn); dump(data);
				}
			return true;
			}
		},


					////////////////////////////////////   renderFormats    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


/*
format and do should be used in the naming conventions of renderFormats.
formats should ONLY modify the value.
do's should modify $tag or apply the value.
*/



	renderFormats : {

		imageURL : function($tag,data){
//			_app.u.dump('got into displayFunctions.image: "'+data.value+'"');
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
				$tag.attr('src',_app.u.makeImage(data.bindData)); //passing in bindData allows for using
				$tag.attr('data-media',data.value); //used w/ media library. will b set by tlc.
				}
			else	{
//				$tag.css('display','none'); //if there is no image, hide the src. 
				}
			}, //imageURL
		

		stuffList : function($tag,data)	{
//			_app.u.dump("BEGIN renderFormat.stuffList");
			var L = data.value.length;
			var templateID = data.bindData.loadsTemplate;
			var stid; //recycled. used as a short cut in the loop for each items stid when in focus.
			var $o; // what is appended to tag.  saved to iterim var so changes can occur, if needed (locking form fields for coupons, for example)
			var parentID = $tag.attr('id') || "stufflist_"+_app.u.guidGenerator().substring(0,10)
			for(var i = 0; i < L; i += 1)	{
				stid = data.value[i].stid;
//				_app.u.dump(" -> STID: "+stid);
				$o = _app.renderFunctions.transmogrify({'id':parentID+'_'+stid,'stid':stid},templateID,data.value[i])
//make any inputs for coupons disabled. it is possible for stid to not be set, such as a fake product in admin_ordercreate unstructured add.
				if(stid && stid[0] == '%')	{$o.find(':input').attr({'disabled':'disabled'}).addClass('disabled')}
				$tag.append($o);
				}
			}, //stuffList

//handy for enabling tabs and whatnot based on whether or not a field is populated.
//doesn't actually do anything with the value.
		showIfSet : function($tag,data)	{
//Support for whatever display type is necessary (ie 'inline' for spans, 'inline-block' for imgs) default to block. -mc
			var displayType = data.bindData.displayType || 'block'
			if(data.value)	{
				$tag.show().css('display',displayType); //IE isn't responding to the 'show', so the display:block is added as well.
				}
			},

		showIfMatch : function($tag,data)	{
//			_app.u.dump("BEGIN renderFormat.showIfMatch. \n value: "+data.value+"\n matchValue: "+data.bindData.matchValue);
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

//EX:  data-bind='var: (@LIST);format:optionsfromlist; text:pretty; value:safeid;'
		optionsfromlist : function($tag,data)	{
			for(var index in data.value)	{
				$("<option \/>").val((data.bindData.value) ? data.value[index][data.bindData.value] : data.value[index]).text((data.bindData.text) ? data.value[index][data.bindData.text] : data.value[index]).appendTo($tag);
				}
			},

		youtubevideo : function($tag,data){
			var width = data.bindData.width ? data.bindData.width : 560
			var height = data.bindData.height ? data.bindData.height : 315
			var r = "<iframe style='z-index:1;' width='"+width+"' height='"+height+"' src='"+(document.location.protocol === 'https:' ? 'https:' : 'http:')+"//www.youtube.com/embed/"+data.value+"' frameborder='0' allowfullscreen></iframe>";
			$tag.append(r);
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
		
		trunctext : function($tag,data){
			var o = _app.u.truncate(data.value,data.bindData.numCharacters);
			$tag.text(o);
			}, //trunctext

//used in a cart or invoice spec to display which options were selected for a stid.
		selectedoptionsdisplay : function($tag,data)	{
			var o = '';
			for(var key in data.value) {
//				_app.u.dump("in for loop. key = "+key);
				o += "<div><span class='prompt'>"+data.value[key]['prompt']+"<\/span>: <span class='value'>"+data.value[key].data+"<\/span><\/div>";
				}
			$tag.html(o);
			},

		epoch2pretty : function($tag,data)	{
			var myDate = new Date( data.value*1000);
			$tag.append(myDate.getFullYear()+"/"+((myDate.getMonth()+1) < 10 ? '0'+(myDate.getMonth()+1) : (myDate.getMonth()+1))+"/"+(myDate.getDate() < 10 ? '0'+myDate.getDate() : myDate.getDate())+" "+(myDate.getHours() < 10 ? '0'+myDate.getHours() : myDate.getHours())+":"+(myDate.getMinutes() < 10 ? '0'+myDate.getMinutes() : myDate.getMinutes())); //+":"+myDate.getSeconds() pulled seconds in 201307. really necessary?
			},


		epoch2mdy : function($tag,data)	{
			$tag.text(_app.u.epoch2Pretty(data.value,data.bindData.showtime))
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
//				cb needs to use 'prop' not 'attr'. That is the right way to do it.
		popVal : function($tag,data){
//			_app.u.dump(" -> popVal var: "+data.bindData.var+" data.value: "+data.value);
			if($tag.is(':checkbox'))	{
//				_app.u.dump(" -> popVal, is checkbox. value: "+data.value+" and number: "+Number(data.value));
				if(Number(data.value) === 0)	{
					$tag.prop({'checked':false,'defaultChecked':false}); //have to handle unchecking in case checked=checked when template created.
					}
				else	{
//the value here could be checked, on, 1 or some other string. if the value is set (and we won't get this far if it isn't), check the box.
					$tag.prop({'checked':true,'defaultChecked':true});
					}
				}
			else if($tag.is(':radio'))	{
//with radio's the value passed will only match one of the radios in that group, so compare the two and if a match, check it.
				if($tag.val() == data.value)	{$tag.prop({'checked':true,'defaultChecked':true})}
				}
			else if($tag.is('select') && $tag.attr('multiple') == 'multiple')	{
				if(typeof data.value === 'object')	{
					var L = data.value.length;
					for(var i = 0; i < L; i += 1)	{
//						_app.u.dump(i+") value: "+data.value[i]);
						$('option[value="' + data.value[i] + '"]',$tag).prop({'selected':'selected','defaultSelected':true});
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
					$tag.prop('defaultValue',data.value); //allows for tracking the difference onblur.
					}
				}

			}, //text

//will allow an attribute to be set on the tag. attribute:data-stid;var: product(sku); would set data-stid='sku' on tag
//pretext and posttext are added later in the process, but this function needed to be able to put some text before the output
// so that the id could be valid (if used on an number field, an ID starting with a number isn't valid in old browsers)
		assignAttribute : function($tag,data){
			var o = ''; //what is appended to tag. the output (data.value plus any attributePretext and/or making it safe for id)
			if(data.bindData.valuePretext)	{
				o += data.bindData.valuePretext;
				}
			if(data.bindData.attribute == 'id' || data.bindData.makeSafe)
				o += _app.u.makeSafeHTMLId(data.value);
			else
				o += data.value


			if(data.bindData.valuePosttext)	{
				o += data.bindData.valuePosttext;
				}

			$tag.attr(data.bindData.attribute,o);
			}, //text

		loadsTemplate : function($tag,data)	{
			_app.u.dump("BEGIN renderFormats.loadsTemplate"); _app.u.dump(data.bindData);
			$tag.append(_app.renderFunctions.transmogrify({},data.bindData.loadsTemplate,data));
			},

		money : function($tag,data)	{
			
//			_app.u.dump('BEGIN view.formats.money');
			var amount = data.bindData.isElastic ? (data.value / 100) : data.value;
			if(amount)	{
				var r,o,sr;
				r = _app.u.formatMoney(amount,data.bindData.currencySign,'',data.bindData.hideZero);
//					_app.u.dump(' -> attempting to use var. value: '+data.value);
//					_app.u.dump(' -> currencySign = "'+data.bindData.currencySign+'"');

//if the value is greater than .99 AND has a decimal, put the 'change' into a span to allow for styling.
				if(r.indexOf('.') > 0)	{
//					_app.u.dump(' -> r = '+r);
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




// Used for displaying a new format for datastorage.
// wikihash is the name of the datastorage format. looks like this:
// key:value\nAnotherkey:AnotherValue\n
// use 'key' and 'value' in the data-binds of the template.
// pass template to apply per row as loadsTemplate: on the databind.
// there's an example of this in admin_marketplace (ebay category chooser)
// * 201401 -> not used anywhere. removed per BH by JT.
/*		wikiHash2Template : function($tag,data)	{
			var
				rows = data.value.split("\n"),
				L = rows.length;
			
			for(var i = 0; i < L; i += 1)	{
				var kvp = rows[i].split(/:(.+)?/);
				$tag.append(_app.renderFunctions.transmogrify({'key':kvp[0],'value':kvp[1]},data.bindData.loadsTemplate,{'key':kvp[0],'value':kvp[1]}));
				}
			
			},
*/


//This should be used for all lists going forward that don't require special handling (such as stufflist, prodlist, etc).
//everthing that's in the data lineitem gets passed as first param in transmogrify, which will add each key/value as data-key="value"
//at this time, prodlist WON'T use this because each pid in the list needs/makes an API call.
//data-obj_index is set so that a quick lookup is available. ex: in tasks list, there's no detail call, so need to be able to find data quickly in orig object.
// _index is used instead of -index because of how data works (removes dashes and goes to camel case, which is nice but not consistent and potentially confusing)
//doing a for(i in instead of a +=1 style loop makes it work on both arrays and objects.
		processList : function($tag,data){
//			_app.u.dump("BEGIN renderFormats.processList");
			$tag.removeClass('loadingBG');
// process list is intended for converting an object to individual rows/lists of templates.
			if(data.bindData.loadsTemplate && typeof data.value === 'object')	{
				var $o, //recycled. what gets added to $tag for each iteration.
				int = 0;
				
				var filter = data.bindData.filter;
				var filterby = data.bindData.filterby;
				if(!filterby)	{
					if(filter)	{_app.u.dump("In process list, a 'filter' was passed, but no filterby was specified, so the filter was ignored.\ndatabind: \n"+$tag.data('bind'),'warn');}
					filter = undefined;
					} //can't run a filter without a filterby. filter is keyed off of later.
				
//				_app.u.dump(" -> data.value.length: "+data.value.length);
				for(var i in data.value)	{
// mostly for use in admin. for processing the %sku object and subbing in the default attribs when there are no inventoryable variations.
// if SKU is set, that means we're dealing with sku-level data.  if the sku does NOT have a :, we use the product %attribs
					if(data.bindData.sku)	{
						if(data.value[i] && data.value[i].sku && data.value[i].sku.indexOf(':') < 0)	{
							data.value[i]['%attribs'] = (_app.data['adminProductDetail|'+data.value[i].sku]) ? _app.data['adminProductDetail|'+data.value[i].sku]['%attribs'] : {};
							}
						}
					if(data.bindData.limit && int >= Number(data.bindData.limit)) {break;}
					else	{
						//if no filter is declared, proceed. 
						//This allows process list to only show matches
						if(!filter || (filter && data.value[i][filter] == filterby))	{
// if data.value is an associative array....
// added data.value check is here cuz if val is null (which could happen w/ bad data) a JS error occured.
							if(data.value[i] && typeof data.value[i] === 'object')	{
								if(!data.value[i].index && isNaN(i)) {data.value[i].index = i} //add an 'index' field to the data. handy for hashes (like in flexedit) where the index is something useful to have in the display.
								$o = _app.renderFunctions.transmogrify(data.value[i],data.bindData.loadsTemplate,data.value[i]);
								if($o instanceof jQuery)	{
									if(data.value[i].id){} //if an id was set, do nothing. there will error on an array (vs object)
									else	{$o.attr('data-obj_index',i)} //set index for easy lookup later.
									$tag.append($o);
									}
								else	{
									//well that's not good.
									_app.u.dump("$o:"); _app.u.dump($o);
									}
								}
							else	{
								$o = _app.renderFunctions.transmogrify({'value':data.value[i],'key':i},data.bindData.loadsTemplate,{'value':data.value[i],'key':i});
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
			
		}, //renderFormats

//These rules should return true if the value is validated or false if not.
//If the value does not validate, $err should be APPENDED to w/ a consise message for why it failed.  ex: CC number did not validate.
	formatRules : {

		'CC' : function($input,$err)	{
			var r = _app.u.isValidCC($input.val());
			if(!r)	{$err.append('The credit card # provided is not valid')}
			return r;
			},
		
		'CV' : function($input,$err)	{
			var r = false;
			if(isNaN($input.val())){$err.append('The CVV/CID must be a #');}
			else if($input.val().length <= 2)	{$err.append('The CVV/CID # must be at least three digits');}
			else	{r = true;}
			return r;
			}
		
		}
	}
	};
