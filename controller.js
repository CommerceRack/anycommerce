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



zController = function(params,extensions) {
	this.util.dump('zController has been initialized');
	if(typeof Prototype == 'object')	{
		alert("Oh No! you appear to have the prototype ajax library installed. This library is not compatible. Please change to a non-prototype theme (2011 series).");
		}
//	else if(typeof zGlobals != 'object')	{
//		alert("Uh Oh! A required include (config.js) is not present. This document is required.");
//		}
	else	{
		this.initialize(params,extensions);
		}
	}
	
$.extend(zController.prototype, {
	
	initialize: function(P,E) {
		myControl = this;
		myControl.model = zoovyModel(); // will return model as object. so references are myControl.model.dispatchThis et all.

		myControl.vars = {};
		myControl.vars['_admin'] = null; //set to null. could get overwritten in 'P' or as part of appAdminInit.
		myControl.vars.cid = null; //gets set on login. ??? I'm sure there's a reason why this is being saved outside the normal  object. Figure it out and document it.
		myControl.vars.fbUser = {};
//in some cases, such as the zoovy UI, zglobals may not be defined. If that's the case, certain vars, such as jqurl, must be passed in via P in initialize:
		if(typeof zGlobals == 'object')	{
			myControl.vars.profile = zGlobals.appSettings.profile;
			myControl.vars.username = zGlobals.appSettings.username;
			myControl.vars.secureURL = zGlobals.appSettings.https_app_url;
			myControl.vars.sdomain = zGlobals.appSettings.sdomain;
	
			if('https:' == document.location.protocol)	{myControl.vars.jqurl = zGlobals.appSettings.https_api_url;}
			else	{myControl.vars.jqurl = zGlobals.appSettings.http_api_url}
			}

// can be used to pass additional variables on all request and that get logged for certain requests (like createOrder). 
// default to blank, not 'null', or += below will start with 'undefined'.
//vars should be passed as key:value;  _v will start with zmvc:version.release.
		myControl.vars.passInDispatchV = '';  
		myControl.vars.release = 'unspecified'; //will get overridden if set in P. this is defualt.

//set after individual defaults so that what is passed in can override. Should give priority to vars set in P.
		myControl.vars = $.extend(myControl.vars,P);

// += is used so that this is appended to anything passed in P.
		myControl.vars.passInDispatchV += 'browser:'+myControl.util.getBrowserInfo()+";OS:"+myControl.util.getOSInfo()+';'; //passed in model as part of dispatch Version. can be app specific.
		
		myControl.ext = {}; //for holding extensions, including checkout.
		myControl.data = {}; //used to hold all data retrieved from ajax requests.
		
/* some diagnostic reporting info */
		myControl.util.dump(' -> v: '+myControl.model.version+'.'+myControl.vars.release);
		myControl.util.dump(' -> myControl.vars.passInDispatchV: '+myControl.vars.passInDispatchV)
		
/*
myControl.templates holds a copy of each of the templates declared in an extension but defined in the view.
copying the template into memory was done for two reasons:
1. faster reference when template is needed.
2. solve any duplicate 'id' issues within the spec itself when original spec and cloned template are present.
   -> this solution was selected over adding a var for subbing in the templates because the interpolation was thought to be too heavy.
*/
		myControl.templates = {};

		myControl.q = {};
//queues are arrays, not objects, because order matters here.
		myControl.q.mutable = new Array();  //used to store mutable ajax requests. an immutable dispatch will cancel all these.
		myControl.q.passive = new Array();  //used to store immutable dispatches. when dispatched, will cancel all immutable requests. immutable requests can't, by default, be cancelled.
		myControl.q.immutable = new Array();  //used to store all immutable ajax requests (for checkout). referred to as PDQ in comments.


		myControl.ajax = {}; //holds ajax related vars.
		myControl.ajax.overrideAttempts = 0; //incremented when an override occurs. allows for a cease after X attempts.
		myControl.ajax.lastDispatch = null; //incremented when an override occurs. allows for a cease after X attempts.
		myControl.ajax.requests = {"mutable":{},"immutable":{},"passive":{}}; //'holds' each ajax request. completed requests are removed.
		myControl.sessionId;
/*
session ID can be passed in via the params (for use in one page checkout on a non-ajax storefront). If one is passed, it must be validated as active session.
if no session id is passed, the getValidSessionID function will look to see if one is in local storage and use it or request a new one.
Exception - the controller is used for admin sessions too. if an admin session is being instantiated, forget about session id (zjsid) for now.
*/
		if(P.noVerifyzjsid && P.sessionId)	{
//you'd get here in the UI.
			myControl.sessionId = P.sessionId
			}
		else if(P.noVerifyzjsid)	{
			//for now, do nothing.  this may change later.
			}
		else if(P.sessionId)	{
			myControl.calls.appCartExists.init(P.sessionId,{'callback':'handleTrySession','datapointer':'appCartExists'});
			myControl.model.dispatchThis('immutable');
			}
		else	{
			myControl.calls.getValidSessionID.init('handleNewSession');
			myControl.model.dispatchThis('immutable');
			}
		
//if third party inits are not done before extensions, the extensions can't use any vars loaded by third parties. yuck. would rather load our code first.
// -> EX: username from FB and OPC.
		myControl.util.handleThirdPartyInits();
//E is the extensions. if there are any (and most likely there will be) add then to the controller
		if(E && E.length > 0)	{
			myControl.model.addExtensions(E);
			}
		}, //initialize

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
					myControl.util.dump('BEGIN myControl.calls.authentication.facebook.init');
//Sanity - this call occurs AFTER a user has already logged in to facebook. So though server authentication may fail, the login still occured.
_gaq.push(['_trackEvent','Authentication','User Event','Logged in through Facebook']);
					this.dispatch(tagObj);
					return 1;
					},
				dispatch : function(tagObj)	{
//note - was using FB['_session'].access_token pre v-1202. don't know how long it wasn't working, but now using _authRepsonse.accessToken
					myControl.model.addDispatchToQ({'_cmd':'appVerifyTrustedPartner','partner':'facebook','appid':zGlobals.thirdParty.facebook.appId,'token':FB['_authResponse'].accessToken,'state':myControl.sessionID,"_tag":tagObj},'immutable');
					}
				}, //facebook
//obj is login/password.
//tagObj is everything that needs to be put into the tag node, including callback, datapointer and/or extension.
			zoovy : {
				init : function(obj,tagObj)	{
//					myControl.util.dump('BEGIN myControl.calls.authentication.zoovy.init ');
//					myControl.util.dump(' -> username: '+obj.login);
//email should be validated prior to call.  allows for more custom error handling based on use case (login form vs checkout login)
					myControl.calls.cartSet.init({"data.bill_email":obj.login}) //whether the login succeeds or not, set data.bill_email in /session
					this.dispatch(obj,tagObj);
					return 1;
					},
				dispatch : function(obj,tagObj)	{
					obj["_cmd"] = "appBuyerLogin";
					obj['method'] = "unsecure";
					obj["_tag"] = tagObj;
					obj["_tag"]["datapointer"] = "appBuyerLogin";
					
					myControl.model.addDispatchToQ(obj,'immutable');
					}
				}, //zoovy
			zoovyLogout : {
				init : function(tagObj)	{
					this.dispatch(tagObj);
					return 1;
					},
				dispatch : function(tagObj){
					myControl.model.addDispatchToQ({'_cmd':'buyerLogout',"_tag":tagObj},'immutable');
					}
				},

			appSessionStart : {
				 init : function() {
					$('#loginFormContainer .button').attr('disabled','disabled').addClass('ui-state-disabled');
					$('#loginFormContainer .zMessage').empty().remove(); //clear any existing error messages.
					myControl.storageFunctions.writeLocal('zuser',$('#loginFormLogin').val()); //save username to local storage so we can pre-populate.
					this.dispatch();
					return 1;
					},
				 dispatch : function()   {
var security = myControl.util.guidGenerator().substring(0,10);
var ts = myControl.util.unixNow();
myControl.model.addDispatchToQ({
	"_cmd" : "appSessionStart",
	"security" : security,
	"ts" : ts,
	"login" : $('#loginFormLogin').val(),
	"hashtype" : "md5",
	"hashpass" : Crypto.MD5($('#loginFormPassword').val()+security+ts),
	"_tag": {'callback':'handleSessionStartResponse'}
},'immutable');
					}
				} //appSessionStart

			}, //authentication
		
//always uses immutable Q
		getValidSessionID : {
			init : function(callback)	{
//				myControl.util.dump('BEGIN myControl.calls.getValidSessionID.init');
				var sid = myControl.model.fetchSessionId();  //will return a sessionid from control or local.
//				myControl.util.dump(' -> sessionId = '+sid);
//if there is a sid, make sure it is still valid.
				if(sid)	{
//					myControl.util.dump(' -> sessionid was set, verify it is valid.');
//make sure the session id is valid. 'handleTrySession' overrides the callback because error handling/logic is different between create new and verify one exists.
					myControl.calls.appCartExists.init(sid,{'callback':'handleTrySession','datapointer':'appCartExists'}); 
					}
				else	{
//					myControl.util.dump(' -> no session id. get a new one.');
					this.dispatch(callback); 
					}
				return 1;
				},
			dispatch : function(callback)	{
				myControl.model.addDispatchToQ({"_cmd":"appCartCreate","_tag":{"callback":callback}},'immutable');
				}
			},//getValidSessionID

//always uses immutable Q
//formerly canIHaveSession
		appCartExists : {
			init : function(zjsid,tagObj)	{
//					myControl.util.dump('BEGIN myControl.calls.appCartExists');
				myControl.sessionId = zjsid; //needed for the request. may get overwritten if not valid.
				this.dispatch(zjsid,tagObj);
				return 1;
				},
			dispatch : function(zjsid,tagObj)	{
				var obj = {};
				obj["_cmd"] = "appCartExists"; 
				obj["_zjsid"] = zjsid; 
				obj["_tag"] = tagObj;
				myControl.model.addDispatchToQ(obj,'immutable');
				}
			}, //appCartExists

//for now, no fetch is done here. it's assumed if you execute this, you don't know who you are dealing with.
		whoAmI : {
			init : function(tagObj,Q)	{
//				myControl.util.dump('BEGIN myControl.ext.store_crm.calls.categoryDetail.init');
				var r = 1; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				this.dispatch(tagObj,Q);
				return r;
				},
			dispatch : function(tagObj,Q)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "whoAmI"
				myControl.model.addDispatchToQ({"_cmd":"whoAmI","_zjsid":myControl.sessionId,"_tag" : tagObj},Q);	
				}
			},//whoAmI

		canIUse : {
			init : function(flag,Q)	{
				this.dispatch(flag,Q);
				return 1;
				},
			dispatch : function(flag,Q)	{
				myControl.model.addDispatchToQ({"_cmd":"canIUse","flag":flag,"_tag":{"datapointer":"canIUse|"+flag}},Q);
				}
			}, //canIUse

//always uses immutable Q
//formerly setSessionVars
		cartSet : {
			init : function(obj,tagObj)	{
				this.dispatch(obj,tagObj);
				return 1;
				},
			dispatch : function(obj,tagObj)	{
				obj["_cmd"] = "cartSet";
				if(tagObj)	{obj["_tag"] = tagObj;}
				myControl.model.addDispatchToQ(obj,'immutable');
				}
			}, //cartSet

		ping : {
			init : function(tagObj,Q)	{
				this.dispatch(tagObj,Q);
				return 1;
				},
			dispatch : function(tagObj,Q)	{
				myControl.model.addDispatchToQ({"_cmd":"ping","_tag":tagObj},Q); //get new session id.
				}
			}, //ping

//always uses immutable Q.
// used when a new session id must be generated, such as post-checkout.
		appCartCreate : {
			init : function(callback)	{
				this.dispatch(callback);
				return 1;
				},
			dispatch : function(callback)	{
				myControl.model.addDispatchToQ({"_cmd":"appCartCreate","_tag":{"callback":callback}},'immutable'); //get new session id.
				}
			}, //appCartCreate
			
		appProfileInfo : {
			init : function(profileID,tagObj,Q)	{
//				myControl.util.dump("BEGIN myControl.calls.appProfileInfo.init");
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				tagObj = typeof tagObj == 'object' ? tagObj : {};
				tagObj.datapointer = 'appProfileInfo|'+profileID; //for now, override datapointer for consistency's sake.

				if(myControl.model.fetchData(tagObj.datapointer) == false)	{
					r = 1;
					this.dispatch(profileID,tagObj,Q);
					}
				else 	{
					myControl.util.handleCallback(tagObj)
					}

				return r;
				}, // init
			dispatch : function(profileID,tagObj,Q)	{
				obj = {};
				obj['_cmd'] = "appProfileInfo";
				obj['profile'] = profileID;
				obj['_tag'] = tagObj;
				myControl.model.addDispatchToQ(obj,Q);
				} // dispatch
			}, //appProfileInfo

//used to get a clean copy of the cart. ignores local/memory. used for logout.
		refreshCart : {
			init : function(tagObj,Q)	{
				var r = 1;
//if datapointer is fixed (set within call) it needs to be added prior to executing handleCallback (which will likely need datapointer to be set).
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
				tagObj.datapointer = "cartItemsList";
				this.dispatch(tagObj,Q);
				return r;
				},
			dispatch : function(tagObj,Q)	{
//				myControl.util.dump('BEGIN myControl.ext.store_cart.calls.cartItemsList.dispatch');
				myControl.model.addDispatchToQ({"_cmd":"cartItemsList","_zjsid":myControl.sessionId,"_tag": tagObj},Q);
				} 
			} // refreshCart removed comma from here line 383
		}, // calls

					// //////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ \\
	callbacks : {
		

		handleSessionStartResponse : {
			onSuccess : function(tagObj)	{
				myControl.util.dump("session ID from cookie (with timeout) "+myControl.storageFunctions.readCookie('zjsid'));
//was having issues with the cookie setting/redir. added a short timeout so that the cookie/browser can catch up to our blazing speed.
//				alert(myControl.sessionId);
				setTimeout("window.location = 'https://www.zoovy.com/biz/'",2000);
				},
			onError : function(responseData)	{
				myControl.util.dump('BEGIN myControl.callbacks.handlePasswordResponse.onError');
//				myControl.util.dump(d);
				$('#loginFormContainer').prepend(myControl.util.getResponseErrors(responseData)).toggle(true);
				}
			},//sendEncryptedPassword


		handleNewSession : {
//myControl.sessionID is set in the method. no need to set it here.
//use myControl.sessionID if you need it in the onSuccess.
//having a callback does allow for behavioral changes (update new session with old cart contents which may still be available.
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.callbacks.handleNewSession.onSuccess');
				},
			onError : function(responseData)	{
				myControl.util.dump('BEGIN myControl.callbacks.handleNewSession.onError');
				$('#globalMessaging').append(myControl.util.getResponseErrors(responseData)).toggle(true);
				}
			},//convertSessionToOrder

//executed when appCartExists is requested.
//myControl.sessionID is already set by this point. need to reset it onError.
		handleTrySession : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump('BEGIN myControl.callbacks.handleTrySession.onSuccess');
				if(myControl.data.appCartExists.exists == 1)	{
//					myControl.util.dump(' -> valid session id.  Proceed.');
					}
				else	{
//					myControl.util.dump(' -> UH OH! invalid session ID. Generate a new session. '); //this is happening, but where? !!! look in to this. 
//					$('#globalMessaging').append(myControl.util.formatMessage("It appears the cart you were using has expired. We will go ahead and build you a new one. You should be able to continue as normal.")).toggle(true);
					}
				},
			onError : function(responseData)	{
//				myControl.util.dump('BEGIN myControl.callbacks.handleTrySession.onError');
				$('#globalMessaging').toggle(true).append(myControl.util.getResponseErrors(responseData));
				myControl.sessionId = null;
				}
			}, //handleTrySession
		
		handleAdminSession : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.callbacks.handleAdminSession.onSuccess');
//in DEV still. do not use this callback.
//				myControl.vars['_admin'] is set in the model.
				},
			onError : function(responseData)	{
				myControl.util.dump('BEGIN myControl.callbacks.handleAdminSession.onError');
				$('#globalMessaging').append(myControl.util.getResponseErrors(responseData)).toggle(true);
				}
			},
//pass the following on _tag:
// parentID is the container id that the template instance is already in (should be created before call)
// templateID is the template that will get translated.
// the myControl.data.datapointer is what'll get passed in to the translate function as the data src. (ex: getProduct|PID)
		translateTemplate : 	{
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN callbacks.translateTemplate");
//				myControl.util.dump(" -> datapointer: "+tagObj.datapointer);
//				myControl.util.dump(" -> dataSrc = ");
//				myControl.util.dump(dataSrc);
//				myControl.util.dump(" -> parentID: "+tagObj.parentID);
//				myControl.util.dump(" -> $('#'+tagObj.parentID).attr('data-templateid'): "+$('#'+tagObj.parentID).attr('data-templateid'));

				var dataSrc;
//not all data is at the root level.
				if(tagObj.datapointer == 'cartItemsList')	{dataSrc = myControl.data[tagObj.datapointer].cart}
				else if(tagObj.datapointer.indexOf('appPageGet') >= 0)	{
					dataSrc = myControl.data[tagObj.datapointer]['%page']
					}
				else {dataSrc = myControl.data[tagObj.datapointer]};
				myControl.renderFunctions.translateTemplate(dataSrc,tagObj.parentID);
				},
			onError : function(responseData)	{
//something went wrong, so empty the parent (which likely only holds an empty template) and put an error message in there.
				$('#'+responseData.tagObj.parentID).empty().toggle(true)
				myControl.util.handleErrors(responseData,uuid)
				}
			
			}, //translateTemplate
// a generic callback to allow for success messaging to be added. pass a parentID and the message will be PREPENDED to that id (at the top) and will shrink after a few seconds.
//for more precise control of destination and no shrinkage, pass a targetID.
// pass message for what will be displayed.  For error messages, the system messaging is used.
		showMessaging : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump("BEGIN myControl.callbacks.showMessaging");
				if(tagObj.parentID)	{
					var htmlid = 'random_'+Math.floor(Math.random()*10001); //give message an ID so the a timeout is supported.
					$('#'+tagObj.parentID).prepend(myControl.util.formatMessage({'message':tagObj.message,'htmlid':htmlid,'uiIcon':'check','timeoutFunction':"$('#"+htmlid+"').slideUp(1000);"}));
					}
				else if(tagObj.targetID)	{
					$('#'+tagObj.targetID).append(myControl.util.formatMessage({'message':tagObj.message,'uiIcon':'check'}));
					}
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			}
		}, //callbacks







			////////////////////////////////////   UTIL [the method formerly known as utilityFunctions]    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\






	util : {

/*
when a call is requested but the data is local, execute this function.
it will check to see if a callback is defined and if it is, execute it.
smart enough to determine if an extension is involved and execute it from there.

-> this is a function because what is in the 'if' was being duplicated in almost every call 
that dealt with a fetch. So it was made into a function to make the calls tighter and also 
allow for global manipulation if needed later.

myControl.util.handleCallback(tagObj);
*/

		handleCallback : function(tagObj)	{
//			myControl.util.dump("BEGIN util.handleCallback");
			var callback;
			if(tagObj && tagObj.datapointer){myControl.data[tagObj.datapointer]['_rtag'] = tagObj} //updates obj in memory to have latest callback.
			if(tagObj && tagObj.callback){
//				myControl.util.dump(" -> executing callback ("+tagObj.callback+") in extension ("+tagObj.extension+")");
//most callbacks are likely in an extension, but support for 'root' callbacks is necessary.
//save path to callback so that we can verify the onSuccess is a function before executing (reduce JS errors with this check)
				callback = tagObj.extension ? myControl.ext[tagObj.extension].callbacks[tagObj.callback] : myControl.callbacks[tagObj.callback];
				if(typeof callback.onSuccess == 'function')
					callback.onSuccess(tagObj);
				}
			else	{
//				myControl.util.dump(" -> no callback was defined.");
				}
			},
			

//http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript
		guidGenerator : function() {
			var S4 = function() {
				return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
				};
			return (S4()+S4()+S4()+S4()+S4()+S4()+S4()+S4());
			},

		
			
//## allow for targetID to be passed in.
		logBuyerOut : function()	{
	
			myControl.calls.authentication.zoovyLogout.init({'callback':'showMessaging','message':'Thank you, you are now logged out','targetID':'logMessaging'});
			myControl.calls.refreshCart.init({},'immutable');
			myControl.vars.cid = null; //nuke cid as it's used in the soft auth.
			myControl.model.dispatchThis('immutable');
			},
		
		thisIsAnAdminSession : function()	{
			var r = false; //what is returned.
			if(myControl.sessionId && myControl.sessionId.substring(0,2) != '**')	{
				r = true;
				}
			return r;
			},

//jump to an anchor. can use a name='' or id=''.  anchor is used in function name because that's the common name for this type of action. do not need to pass # sign.
		jumpToAnchor : function(id)	{
			window.location.hash=id;
			},





/*
a generic error handler for callback.onError
often, parentID or targetID is specified in a tagObj for a destination for rendering a template. put errors there if set, if not put in globalMessaging.
if tagObj isn't set, look it up in the original Q (tagObj may be blank if the error is high level.)
If none of those vars are set or are not present in DOM, throw the errors at the user via a modal. this is a last resort.

sometimes, globalMessaging may be turned off, so show() is set.
loadingBG is a class set on templates that is turned off in transmogrify/translateTemplate.  need to make sure that is also removed.
*/
		handleErrors : function(d,uuid)	{
			myControl.util.dump("BEGIN control.util.handleErrors for uuid: "+uuid);
			var $target;
			if(!d || !d['_rtag'])	{
				myControl.util.dump(" -> responseData (d) or responseData['_rtag'] is blank.");
				var DQ = myControl.model.whichQAmIFrom(uuid);
				d['_rtag'] = myControl.q[DQ][uuid]['_tag'];
				}
//			myControl.util.dump(d['_rtag']);
			if(d['_rtag'].targetID)	{$target = $('#'+d['_rtag'].targetID)}
			else if(d['_rtag'].parentID)	{$target = $('#'+d['_rtag'].parentID)}
			else	{$target = $('#globalMessaging')}

			if($target.length == 0)	{
				$target = $("<div \/>").dialog({modal:true,width:500,height:500}).appendTo('body');
				}
			$target.removeClass('loadingBG').show().append(this.getResponseErrors(d));
			},

//pass in the response and an li for each error (parent ul not returned) will be generated.
//called frequently in checkout, but univeral enough to justify being in main control.
// note that if you use this, you may need to also update a panel so that more than just an error shows up or the user may not be able to proceed.
		getResponseErrors : function(d)	{
//			myControl.util.dump("BEGIN myControl.util.getResponseErrors");
//			myControl.util.dump(d);
			var r;
			if(!d)	{
				r = 'unknown error has occured';
				}
			else if(typeof d == 'string')	{
				r = d;
				}
			else if(typeof d == 'object')	{
				r = "";
/*
a response could come back with messages (like adding to cart and multiple errors occured)
which will have _msgs set or just one error, which will have errid set.
*/
				if(d['_msgs'])	{
					for(var i = 1; i <= d['_msgs']; i += 1)	{
						myControl.util.dump(d['_msg_'+i+'_type']+": "+d['_msg_'+i+'_id']);
						r += "<div>"+d['_msg_'+i+'_txt']+"<\/div>";
						}
					}
				else if(d['errid'] > 0)	{
					r += "<div>"+d.errmsg+" ("+d.errid+")<\/div>";
					}
				}
			else	{
				myControl.util.dump(" -> getResponseErrors 'else' hit. Should not have gotten to this point");
				r = 'unknown error has occured';
				}
//			myControl.util.dump(r);
			return myControl.util.formatMessage(r);
			},


/*
for handling app messaging to the user.
pass in just a message and warning will be displayed.
pass in additional information for more control, such as css class of 'error' and/or a different jqueryui icon.
*/
		formatMessage	: function(messageData)	{
//			myControl.util.dump("BEGIN myControl.util.formatMessage");
// message data may be a string, so obj is used to build a new object. if messagedata is an object, it is saved into obj.
			var obj = {}; 
			if(typeof messageData == 'string')	{
//				myControl.util.dump(" -> is a string. show warning.");
				obj.message = messageData;
				obj.uiClass = 'highlight';
				obj.uiIcon = 'info';
				}
			else	{
				obj = messageData;
//default to a 'highlight' state, which is a warning instead of error.
//				myControl.util.dump(" -> is an object. show message specific class.");
				obj.uiClass = obj.uiClass ? obj.uiClass : 'highlight'; //error, highlight
				obj.uiIcon = obj.uiIcon ? obj.uiIcon : 'notice'
				}

//the zMessage class is added so that these warning can be cleared (either universally or within a selector).
			var r = obj.htmlid ? "<div class='ui-widget zMessage' id='"+obj.htmlid+"'>": "<div class='ui-widget zMessage'>";
			r += "<div class='ui-state-"+obj.uiClass+" ui-corner-all appMessage'>";
			r += "<div class='clearfix'><span style='float: left; margin-right: .3em;' class='ui-icon ui-icon-"+obj.uiIcon+"'></span>"+obj.message+"<\/div>";
			r += "<\/div><\/div>";
			
//			myControl.util.dump(" -> obj.htmlid: "+obj.htmlid);
//			myControl.util.dump(" -> obj.message: "+obj.message);
//			myControl.util.dump(" -> obj.timeoutFunction: "+obj.timeoutFunction);
			
			if(obj.htmlid && obj.timeoutFunction)	{
//				myControl.util.dump(" -> error message has timeout function.");
				setTimeout(obj.timeoutFunction, 6000);
				}
			return r;
			},
			
			
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
			var url = string ? string : location.search;
			myControl.util.dump(url);
			var params = {};
//check for ? to avoid js error which results when no uri params are present
			if(string || url.indexOf('?') > 0)	{
				url = url.replace('?', '');
				var queries = url.split('&');
				for(var q in queries) {
					var param = queries[q].split('=');
					params[ param[0] ] = decodeURIComponent(param[1].replace(/\+/g, " "));
					}
				}
			return params;
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


// .browser returns an object of info about the browser (name and version).
//this is a function because .browser is deprecated and will need to be replaced, but I need something now. !!! fix in next version.
		getBrowserInfo : function()	{
			var r;
			var BI = jQuery.browser; //browser information. returns an object. will set 'true' for value of browser 
			jQuery.each(BI, function(i, val) {
				if(val === true){r = i;}
				});
			r += '-'+BI.version;
//			myControl.util.dump(' r = '+r);
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
			
		numbersOnly : function(e)	{
			var unicode=e.charCode? e.charCode : e.keyCode
			// if (unicode!=8||unicode!=9)
			if (unicode<8||unicode>9)        {
				if (unicode<48||unicode>57) //if not a number
				return false //disable key press
				}
			},

		
//current time in unix format.
		unixNow : function()	{
			return Math.round(new Date().getTime()/1000.0)
			}, //unixnow
//very simple date translator. if something more sprmatecific is needed, create a custom function.
//will support a boolean for showtime, which will show the time, in addition to the date.
		unix2Pretty : function(unix_timestamp,showtime)	{
//			myControl.util.dump('BEGIN myControl.util.unix2Pretty');
//			myControl.util.dump(' -> tx = '+unix_timestamp);
			var date = new Date(Number(unix_timestamp)*1000);
			var r;
			r = myControl.util.jsMonth(date.getMonth());
			r += ' '+date.getDate();
			r += ', '+date.getFullYear();
			if(showtime)	{
				r += date.getHours();
				r += ':'+date.getMinutes();
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
		
		isValidEmail : function(str) {
			myControl.util.dump("BEGIN isValidEmail for: "+str);
			var r = true; //what is returned.
			if(!str || str == false)
				r = false;
			var at="@"
			var dot="."
			var lat=str.indexOf(at)
			var lstr=str.length
			var ldot=str.indexOf(dot)
			if (str.indexOf(at)==-1){
				myControl.util.dump(" -> email does not contain an @");
				r = false
				}
			if (str.indexOf(at)==-1 || str.indexOf(at)==0 || str.indexOf(at)==lstr){
				myControl.util.dump(" -> @ in email is in invalid location (first or last)");
				r = false
				}
			if (str.indexOf(dot)==-1 || str.indexOf(dot)==0 || str.indexOf(dot)==lstr){
				myControl.util.dump(" -> email does not have a period or it is in an invalid location (first or last)");
				r = false
				}
			if (str.indexOf(at,(lat+1))!=-1){
				myControl.util.dump(" -> email contains two @");
				r = false
				}
			if (str.substring(lat-1,lat)==dot || str.substring(lat+1,lat+2)==dot){
				myControl.util.dump(" -> email contains multiple periods");
				r = false
				}
			if (str.indexOf(dot,(lat+2))==-1){
				r = false
				}
			if (str.indexOf(" ")!=-1){
				r = false
				}
			myControl.util.dump("util.isValidEmail: "+r);
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
//		myControl.util.dump("BEGIN util.formatMoney");
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
//			myControl.util.dump(" -> b = "+b);
			a = parseInt(a); // get 12345678
			b = (b-a).toPrecision(decimalPlace); //get 0.90
			b = parseFloat(b).toFixed(decimalPlace); //in case we get 0.0, we pad it out to 0.00
			a = a.toLocaleString();//put in commas - IE also puts in .00, so we'll get 12,345,678.00
//			myControl.util.dump(" -> a = "+a);
			//if IE (our number ends in .00)
			if(a.indexOf('.00') > 0)	{
				a=a.substr(0, a.length-3); //delete the .00
//				myControl.util.dump(" -> trimmed. a. a now = "+a);
				}
			r = a+b.substr(1);//remove the 0 from b, then return a + b = 12,345,678.90

//if the character before the decimal is just a zero, remove it.
			if(r.split('.')[0] == 0){
				r = '.'+r.split('.')[1]
				}
			
//			myControl.util.dump(" -> r = "+r);
			if(currencySign)	{
				r = currencySign + r;
				}
			if(isNegative)
				r = "-"+r;
			}
		return r
		}, //formatMoney

//used for validating strings only. checks to see if value is defined, not null, no false etc.
//returns value (s), if it has a value .
	isSet : function(s)	{
	//	zStdErr('in isSet for '+s);
		var r;
		if(s == null || s == 'undefined' || s == '')
			r = false;
		else if(typeof s != 'undefined')
			r = s;
		else
			r = false;
		return r;
		}, //isSet

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

myControl.util.makeImage({"name":"","w":150,"h":150,"b":"FFFFFF","class":"prodThumb","tag":1});
*/
		makeImage : function(a)	{
		//	myControl.util.dump('W = '+a.w+' and H = '+a.h);
			a.lib = myControl.util.isSet(a.lib) ? a.lib : myControl.vars.username;  //determine protocol
			a.m = a.m ? 'M' : '';  //default to minimal mode off. If anything true value (not 0, false etc) is passed in as m, minimal is turned on.
//			myControl.util.dump('library = '+a.lib);
			if(a.name == null)
				a.name = 'i/imagenotfound';
			
			var url, tag;
		
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
		
		//		myControl.util.dump(url);
			
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
			
		makeSafeHTMLId : function(string)	{
			var r = false;
			if(string)	{
				r = string.replace(/[^a-zA-Z 0-9 - _]+/g,'');
				}
			return r;
			}, //makeSafeHTMLId

//note - had a report of expirations coming in with 0 set for month and year.
//2012-04-09 the following two functions were set up to return errors on 0 values.

		isValidMonth : function(val)	{
			var valid = true;
			if(isNaN(val)){valid = false}
			else if(!myControl.util.isSet(val)){valid = false}
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
			for(i = 1; i < 13; i += 1)	{
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
//			myControl.util.dump('BEGIN myControl.util.isValidPhoneNumber. phone = '+phoneNumber);
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

			
//			myControl.util.dump("regex.text ="+r);
			
			return r;
			},

		//found here: http://www.blog.zahidur.com/usa-and-canada-zip-code-validation-using-javascript/
		 isValidPostalCode : function(postalCode,countryCode) {
			var postalCodeRegex;
			switch (countryCode) {
				case "US":
					postalCodeRegex = /^([0-9]{5})(?:[-\s]*([0-9]{4}))?$/;
					break;
				case "CA":
			/* postalCodeRegex = /^([A-Z][0-9][A-Z])\s*([0-9][A-Z][0-9])$/; */
					postalCodeRegex = /^([a-zA-Z][0-9][a-zA-Z])\s*([0-9][a-zA-Z][0-9])$/
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
//			myControl.util.dump("BEGIN myControl.util.handleThirdPartyInits");
//initial init of fb app.
			if(typeof zGlobals !== 'undefined' && zGlobals.thirdParty.facebook.appId && typeof FB !== 'undefined')	{
//				myControl.util.dump(" -> facebook appid set. load user data.");
				FB.init({appId:zGlobals.thirdParty.facebook.appId, cookie:true, status:true, xfbml:true});
				myControl.thirdParty.fb.saveUserDataToSession();
				}
			else	{
				myControl.util.dump(" -> did not init FB app because either appid isn't set or FB is undefined ("+typeof FB+").");
				}
//			myControl.util.dump("END myControl.util.handleThirdPartyInits");
			},

//executed inside handleTHirdPartyInits as well as after a facebook login.
//



//used in checkout to populate username: so either login or bill.email will work.
//never use this to populate the value of an email form field because it may not be an email address.
//later, this could be expanded to include a facebook id.
		getUsernameFromCart : function()	{
//			myControl.util.dump('BEGIN util.getUsernameFromCart');
			var r = false;
			if(myControl.util.isSet(myControl.data.cartItemsList.cart['login']))	{
				r = myControl.data.cartItemsList.cart['login'];
//				myControl.util.dump(' -> login was set. email = '+r);
				}
			else if(myControl.util.isSet(myControl.data.cartItemsList.cart['data.bill_email'])){
				r = myControl.data.cartItemsList.cart['data.bill_email'];
//				myControl.util.dump(' -> data.bill_email was set. email = '+r);
				}
			else if(!$.isEmptyObject(myControl.vars.fbUser))	{
//				myControl.util.dump(' -> user is logged in via facebook');
				r = myControl.vars.fbUser.email;
				}
			return r;
			}
/*			
,
getAllDataAttributes : function(node)	{
			var d = {}, re_dataAttr = /^data\-(.+)$/;
			$.each(node.get(0).attributes, function(index, attr) {
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

$('target').html(myControl.renderFunctions.transmogrify(eleAttr,templateID,data));  or $.append() depending on need.
either way, what's returned from this function is a fully translated jquery object of the template.

if eleAttr is a string, that's the ID to be added to the template.  If the eleAttr is an object, it's a list of data attributes to be added to the template. this allows for things like data-pid or data-orderid to be set, which is handy for onClicks and such. pass in as {'pid':'productid'} and it'll be translated to data-pid='productid'


transmogrify wants eleAttr passed in without data- on any of the keys.
createTemplateInstance wants it WITH data- (legacy).

will want to migrate createTemplate to NOT have it passed in and add it manually, for now.
Then we'll be in a better place to use data() instead of attr().

*/
		transmogrify : function(eleAttr,templateID,data)	{
//			myControl.util.dump("BEGIN control.renderFunctions.transmogrify (tid: "+templateID+")");
//			myControl.util.dump(eleAttr);
			if(!templateID || typeof data != 'object' || !myControl.templates[templateID])	{
				myControl.util.dump(" -> templateID ("+templateID+") not set or typeof data ("+typeof data+") not object or template doesn't exist not present/correct.");
				myControl.util.dump(eleAttr);
				}
			else	{
//we have everything we need. proceed.

var $r = myControl.templates[templateID].clone(); //clone is always used so original is 'clean' each time it's used. This is what is returned.
$r.attr('data-templateid',templateID); //note what templateID was used. handy for troubleshooting or, at some point, possibly re-rendering template
if(typeof eleAttr == 'string')	{
//	myControl.util.dump(' -> eleAttr is a string.');
	$r.attr('id',myControl.util.makeSafeHTMLId(eleAttr))  
	}
else if(typeof eleAttr == 'object')	{
//	myControl.util.dump(' -> eleAttr is an object.');
	for(index in eleAttr)	{
		$r.attr('data-'+index,eleAttr[index]) //for now, this is being added via attr data-. later, it may use data( but I want it in the DOM for now.
		}
	if(eleAttr.id)	{$r.attr('id',myControl.util.makeSafeHTMLId(eleAttr.id))} //override the id with a safe id, if set.
	}

//locates all children/grandchildren/etc that have a data-bind attribute within the parent id.
	$r.find('[data-bind]').each(function()	{
											   
		var $focusTag = $(this);

//		myControl.util.dump(' -> data-bind match found (ID = '+$focusTag.attr('id')+').');
//proceed if data-bind has a value (not empty).
		if(myControl.util.isSet($focusTag.attr('data-bind'))){
			var bindData = myControl.renderFunctions.parseDataBind($focusTag.attr('data-bind'))  
//				myControl.util.dump(bindData);
			if(bindData['var'])	{
				value = myControl.renderFunctions.getAttributeValue(bindData['var'],data);  //set value to the actual value
				}
			if(!myControl.util.isSet(value) && bindData.defaultVar)	{
				value = myControl.renderFunctions.getAttributeValue(bindData['defaultVar'],data);
//					myControl.util.dump(' -> used defaultVar because var had no value. new value = '+value);
				}
			if(!myControl.util.isSet(value) && bindData.defaultValue)	{
				value = bindData['defaultValue']
//					myControl.util.dump(' -> used defaultValue ("'+bindData.defaultValue+'") because var had no value.');
				}
//in some cases, the format function needs a 'clean' version of the value, such as money.
//pre and post text are likely still necessary, but math or some other function may be needed prior to pre and post being added.
//in cases where cleanValue is used inside the renderFormats.function, pre and post text must also be added.
			bindData.cleanValue = value;
			}
//		myControl.util.dump(" -> value: "+value);
// SANITY - value should be set by here. If not, likely this is a null value or isn't properly formatted.

		if((value  == 0 || value == '0.00') && bindData.hideZero)	{
//				myControl.util.dump(' -> no pretext/posttext or anything else done because value = 0 and hideZero = '+bindData.hideZero);			
			}
		else if(value)	{
			
			if(myControl.util.isSet(bindData.className)){$focusTag.addClass(bindData.className)} //css class added if the field is populated. If the class should always be there, add it to the template.

			if(bindData.pretext){value = bindData.pretext + value}
			if(bindData.posttext){value += bindData.posttext}

			if(myControl.util.isSet(bindData.format)){

				if(bindData.extension && typeof myControl.ext[bindData.extension].renderFormats[bindData.format] == 'function')	{
//						myControl.util.dump(" -> extension specified ("+bindData.extension+") and "+bindData.format+" is a function. executing.");
					myControl.ext[bindData.extension].renderFormats[bindData.format]($focusTag,{"value":value,"bindData":bindData});
					}
				else if(typeof myControl.renderFormats[bindData.format] == 'function'){
//						myControl.util.dump(" -> no extension specified. "+bindData.format+" is a valid default function. executing.");
					myControl.renderFormats[bindData.format]($focusTag,{"value":value,"bindData":bindData}); 
					}
				else	{
						myControl.util.dump(" -> "+bindData.format+" is not a valid format. extension = "+bindData.extension);
//						myControl.util.dump(bindData);
					}
//					myControl.util.dump(' -> custom display function "'+bindData.format+'" is defined');
				
				}
			}
		else	{
//				myControl.util.dump(' -> data-bind is set, but it has no/invalid value.');
			if($focusTag.prop('tagName') == 'IMG'){$focusTag.remove()} //remove empty/blank images from dom. necessary for IE.

			}
		value = ''; //reset value.
		}); //end each for children.
	$r.removeClass('loadingBG');
//		myControl.util.dump('END translateTemplate');
	return $r;


				}
			}, //transmogrify
		
/*		
templateID should be set in the view or added directly to myControl.templates. 
eleAttr is optional and allows for the instance of this template to have a unique id. used in 'lists' like results.
eleAttr was expanded to allow for an object. 
currently, id, pid and catsafeid are supported. These are added to the parent element as either id or data-pid or data-catsafeid
most likely, this will be expanded to support setting other data- attributes. ###
*/
		createTemplateInstance : function(templateID,eleAttr)	{
//			myControl.util.dump('BEGIN myControl.renderFunctions.createTemplateInstance. ');
//			myControl.util.dump(' -> templateID: '+templateID);
//creates a copy of the template.
			var r;
			if(!templateID)	{
				myControl.util.dump(" -> ERROR! templateID not specified in createTemplateInstance. eleAttr = "+eleAttr);
				r = false;
				}
			else if(myControl.templates[templateID])	{
				r = myControl.templates[templateID].clone();
				
				if(typeof eleAttr == 'string')	{r.attr('id',myControl.util.makeSafeHTMLId(eleAttr))}
				else if(typeof eleAttr == 'object')	{
//an attibute will be set for each. {data-pid:PID} would output data-pid='PID'
					for(index in eleAttr)	{
						r.attr('data-'+index,eleAttr[index])
						}
				//override the id with a safe id, if set.
					if(eleAttr.id)	{
						r.attr('id',myControl.util.makeSafeHTMLId(eleAttr.id));
						}
					}
				r.attr('data-templateid',templateID); //used by translateTemplate to know which template was used..
				}
			else	{
				myControl.util.dump(" -> ERROR! createTemplateInstance -> templateID ("+templateID+") does not exist! eleAttr = "+eleAttr);
				r = false;
				}

			return r;
			}, //createTemplateInstance

//each template may have a unique set of required parameters.
/*

*/
		translateTemplate : function(data,target)	{
//		myControl.util.dump('BEGIN translateTemplate (target = '+target+')');
		var safeTarget = myControl.util.makeSafeHTMLId(target); //jquery doesn't like special characters in the id's.
		
		var $divObj = $('#'+safeTarget); //jquery object of the target tag. template was already rendered to screen using createTemplate.
		
		var templateID = $divObj.attr('data-templateid'); //always use all lowercase for data- attributes. browser compatibility.
		var dataObj = $divObj.data();
// myControl.util.dump(' -> safeTarget: '+safeTarget);
// myControl.util.dump(' -> $divObj.length: '+$divObj.length);
// myControl.util.dump(' -> templateID: '+templateID);
// myControl.util.dump(' -> dataObj: ');
// myControl.util.dump(dataObj);

		if(dataObj)	{dataObj.id = safeTarget}
		else	{dataObj = safeTarget;}

//myControl.util.dump(' -> dataObj after ID: ');
//myControl.util.dump(dataObj);


//myControl.util.dump(dataObj);
var $tmp = myControl.renderFunctions.transmogrify(dataObj,templateID,data);
$('#'+safeTarget).replaceWith($tmp);
//		myControl.util.dump('END translateTemplate');
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
			if(!v || !data)	{
				value = false;
				}
			else	{
//				myControl.util.dump(' -> attribute info and data are both set.');

				var value;
				var attributeID = this.parseDataVar(v); //used to store the attribute id (ex: zoovy:prod_name), not the actual value.
				var namespace = v.split('(')[0];
//myControl.util.dump('BEGIN myControl.renderFunctions.getAttributeValue');
//myControl.util.dump(' -> attributeID = '+attributeID);
//myControl.util.dump(' -> namespace = '+namespace);


				
//In some cases, like categories, some data is in the root and some is in %meta.
//pass %meta.cat_thumb, for instance.  currenlty, only %meta is supported. if/when another %var is needed, this'll need to be expanded. ###
//just look for % to be the first character.  Technically, we could deal with prod info this way, but the method in place is fewer characters in the view.
				if(attributeID.charAt(0) === '%' && namespace == 'category')	{
//					myControl.util.dump(' -> % attribute = '+attributeID.substr(6));
					value = data['%meta'][attributeID.substr(6)];
//					myControl.util.dump(" -> value = "+value);
					}
//and, of course, orders are nested. mostly, the data we'll need is in payments or data or the root level.
				else if(namespace == 'order')	{
//					myControl.util.dump(' -> parsing order data. % attribute = '+attributeID);
					if(attributeID.substring(0,4) == 'data')	{
						value = data['data'][attributeID.substr(5)];
						}
					else if(attributeID.substring(0,8) == 'payments')	{
						value = data['payments'][attributeID.substr(9)];
						}
					else if(attributeID.substring(0,12) == 'full_product')	{
						myControl.util.dump(" -> full_product MATCH ("+attributeID.substr(13)+")");
						value = data['full_product'][attributeID.substr(13)];
						}
					else	{
						value = data[attributeID]
						}
					}
				else if(namespace == 'product')	{
//inventory record may be emtpy, if merchant has inventory set up to not matter.
//if data['@inventory'][data.pid] doesn't exist, the item likely has options, so inventory isn't displayed.
					if(attributeID.substring(0,10) == '@inventory' && !$.isEmptyObject(data['@inventory']))	{
						value = typeof data['@inventory'][data.pid] != 'undefined' ? data['@inventory'][data.pid][attributeID.substr(11)] : '';
						}
//cart items have some data at root level and some nested one level deeper in full_product
					else if(attributeID.substring(0,12) == 'full_product')	{
						myControl.util.dump(' -> attributeID: '+attributeID+'[ '+attributeID.substr(13)+']');
						value = data.full_product[attributeID.substr(13)]
						myControl.util.dump(' -> value: '+value);
						}
					else if(attributeID.indexOf(':') < 0)	{
//					myControl.util.dump(' -> attribute does not contain : probably a stid or sku reference.');
						value = data[attributeID]
						}
					else	{
//%attribs is what is going to be used most frequently. default here.
						if(data['%attribs'])
							value = data['%attribs'][attributeID];
						}
					}
//if the attribute ID contains a semi colon, than an attribute (such as product: or profile:) is being referenced. 
// sometimes an attribute is not used, such as sku or reviews, or when using sku to execute another display function (ex: add to cart).
// technically, these would fall under the 'else', but I want to keep them separate now... for comfort. 2011-09-29
				else if(attributeID.indexOf(':') < 0)	{
//					myControl.util.dump(' -> attribute does not contain :');
					value = data[attributeID]
					}

//it's assumed at this point in the history of time that if a product isn't in focus, the data is not in a sub node (like %attribs).
//if subnodes are used, they'll need to be added as an 'else if' above.
				else	{
					value = data[attributeID]
					}
				}
//			myControl.util.dump(' -> value = '+value);
			return value;
			},

//this parses the 'css-esque' format of the data-bind.  It's pretty simple (fast) but will not play well if a : or ; is in any of the values.
//css can be used to add or remove those characters for now.
//will convert key/value pairs into an object.
		parseDataBind : function(data)	{
//			myControl.util.dump('BEGIN parseDataBind');
			var rule = {};
			if(data)	{
				var declarations = data.split(';');
				declarations.pop();
				var len = declarations.length;
				for (var i = 0; i < len; i++)	{
					var loc = declarations[i].indexOf(':'); //splits at first :. this may mean : in the values is okay. test.
//remove whitespace from property otherwise could get invalid 'key'.
					var property = $.trim(declarations[i].substring(0, loc)); 
//					var value = $.trim(declarations[i].substring(loc + 1));  //commented out 12/15/12. may want a space in the value.
					var value = declarations[i].substring(loc + 1);
//						myControl.util.dump(' -> property['+i+']: '+property);
//						myControl.util.dump(' -> value['+i+']: "'+value+'"');
					if (property != "" && value != "")	{
//						rule[property] = value;
//need to trim whitespace from values except pre and post text. having whitespace in the value causes things to not load. However, it's needed in pre and post text.
						rule[property] = (property != 'pretext' && property != 'posttext') ? $.trim(value) : value; 
						}
					}
				}

//			myControl.util.dump('END parseDataBind');
			return rule;
			}


	
		}, //renderFunctions


					////////////////////////////////////   renderFormats    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


	renderFormats : {

		imageURL : function($tag,data){
//				myControl.util.dump('got into displayFunctions.image: "'+data.value+'"');
			var bgcolor = data.bindData.bgcolor ? data.bindData.bgcolor : 'ffffff'
//			myControl.util.dump(" -> width: "+$tag.width());
			if(data.value)	{
				var imgSrc = myControl.util.makeImage({'tag':0,'w':$tag.attr('width'),'h':$tag.attr('height'),'name':data.value,'b':bgcolor});
//				myControl.util.dump('IMGSRC => '+imgSrc);
				$tag.attr('src',imgSrc);
				}
			else	{
				$tag.style('display','none'); //if there is no image, hide the src.  !!! added 1/26/2012. this a good idea?
				}
			}, //imageURL

		elastimage1URL : function($tag,data)	{
			var bgcolor = data.bindData.bgcolor ? data.bindData.bgcolor : 'ffffff'
			if(data.value[0])	{$tag.attr('src',myControl.util.makeImage({"name":data.value[0],"w":$tag.attr('width'),"h":$tag.attr('height'),"b":bgcolor,"tag":0}))}
			else	{$tag.style('display','none');}
			},

//handy for enabling tabs and whatnot based on whether or not a field is populated.
//doesn't actually do anything with the value.
		showIfSet : function($tag,data)	{
//			myControl.util.dump('BEGIN control.renderFormats.hideorShowTab');
//			myControl.util.dump(' -> data.value'+data.value);
			if(data.value)	{
//				myControl.util.dump(' -> setting $tag.show()');
				$tag.show().css('display','block'); //IE isn't responding to the 'show', so the display:block is added as well.
				}
			},

		
		youtubeVideo : function($tag,data){
			var r = "<iframe style='z-index:1;' width='560' height='315' src='http://www.youtube.com/embed/"+data.bindData.cleanValue+"' frameborder='0' allowfullscreen></iframe>";
			if(data.bindData.pretext){r = data.bindData.pretext + r}
			if(data.bindData.posttext){r += data.bindData.posttext}			
			$tag.append(r);
			},

		paypalECButton : function($tag,data)	{
$tag.empty().append("<img width='145' id='paypalECButton' height='42' border='0' src='https://www.paypal.com/en_US/i/btn/btn_xpressCheckoutsm.gif' alt='' />").one('click',function(){
	myControl.ext.convertSessionToOrder.calls.cartPaypalSetExpressCheckout.init();
	$(this).addClass('disabled').attr('disabled','disabled');
	myControl.model.dispatchThis('immutable');
	});
				},

		googleCheckoutButton : function($tag,data)	{
			var payObj = myControl.sharedCheckoutUtilities.which3PCAreCompatible();
//certain product can be flagged to disable googlecheckout as a payment option.
			if(payObj.googlecheckout)	{
$tag.append("<img height=43 width=160 id='googleCheckoutButton' border=0 src='https://checkout.google.com/buttons/checkout.gif?merchant_id="+zGlobals.checkoutSettings.googleCheckoutMerchantId+"&w=160&h=43&style=trans&variant=text&loc=en_US' \/>").one('click',function(){
	myControl.ext.convertSessionToOrder.calls.cartGoogleCheckoutURL.init();
	$(this).addClass('disabled').attr('disabled','disabled');
	myControl.model.dispatchThis('immutable');
	});
				}
			else	{
				$tag.append("<img height=43 width=160 id='googleCheckoutButton' border=0 src='https://checkout.google.com/buttons/checkout.gif?merchant_id="+zGlobals.checkoutSettings.googleCheckoutMerchantId+"&w=160&h=43&style=trans&variant=disable&loc=en_US' \/>")			
				}
			},

		
		
		
		addClass : function($tag,data){
			$tag.addClass(data.value);
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
			var o = myControl.util.truncate(data.value,data.bindData.numCharacters)
			$tag.text(o);
			}, //truncText
//formerly bindClick. don't think it's in use anymore. commented out on 12/29/2011
/*
		bindWindowOpen : function($tag,data)	{
			myControl.util.dump('BEGIN myControl.renderFormats.bindWindowOpen');
			data.windowName = myControl.util.isSet(data.windowName) ? data.windowName : '';//default to blank window name, not 'null' or 'undefined'
			$tag.click(function(){window.open(data.value),data.windowName});
			}, //bindWindowOpen
*/
//used in a cart or invoice spec to display which options were selected for a stid.
		selectedOptionsDisplay : function($tag,data)	{
			var o = '';
			for(var key in data.value) {
//				myControl.util.dump("in for loop. key = "+key);
				o += "<div><span class='prompt'>"+data.value[key]['prompt']+"<\/span> <span class='value'>"+data.value[key]['value']+"<\/span><\/div>";
				}
			$tag.html(o);
			},

		unix2mdy : function($tag,data)	{
			var r;
			r = myControl.util.unix2Pretty(data.bindData.cleanValue)
			
			if(data.bindData.pretext){r = data.bindData.pretext + r}
			if(data.bindData.posttext){r += data.bindData.posttext}
			
			$tag.text(r)
			},
	
		text : function($tag,data){
			var o = '';
			if($.isEmptyObject(data.bindData))	{o = data.value}
			else	{
				o += data.value;
				}
			$tag.text(o);
			}, //text
//for use on inputs. populates val() with the value
		popVal : function($tag,data){
			$tag.val(data.bindData.cleanValue);
			}, //text




//will allow an attribute to be set on the tag. attribute:data-stid;var: product(sku); would set data-stid='sku' on tag
		assignAttribute : function($tag,data){
			if(data.bindData.attribute == 'id')
				data.value = myControl.util.makeSafeHTMLId(data.value);
			$tag.attr(data.bindData.attribute,data.value);
			}, //text

		money : function($tag,data)	{
			
//			myControl.util.dump('BEGIN view.formats.money');
//			myControl.util.dump(' -> value = "'+data.value+'" and cleanValue = '+data.bindData.cleanValue);
			var amount = data.bindData.cleanValue;
			if(amount)	{
				var r;
				r = myControl.util.formatMoney(amount,data.bindData.currencySign,'',data.bindData.hideZero);
				if(data.bindData.pretext){r = data.bindData.pretext + r}
				if(data.bindData.posttext){r += data.bindData.posttext}
//					myControl.util.dump(' -> attempting to use var. value: '+data.value);
//					myControl.util.dump(' -> currencySign = "'+data.bindData.currencySign+'"');
//					myControl.util.dump(' -> pretext = '+data.bindData.pretext);
//					myControl.util.dump(' -> posttext = '+data.bindData.posttext);
//					myControl.util.dump(' -> r = '+r);
				$tag.text(r)
				}
			} //money

			
		},





////////////////////////////////////   						STORAGEFUNCTIONS						    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
					
					
	storageFunctions : {
		
		// SANITY -> readlocal does not work if testing locally in FF or IE, must be on a website. Safari does support local file local storage

		writeLocal : function (key,value)	{
		//	myControl.util.dump("WRITELOCAL: Key = "+key);
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
//					myControl.util.dump(' -> localStorage defined but not available (no space? no write permissions?)');
//					myControl.util.dump(e);
					}
				
				}
			return r;
			}, //writeLocal
		
		readLocal : function(key)	{
		//	myControl.util.dump("GETLOCAL: key = "+key);
			if(typeof localStorage == 'undefined')	{
				return myControl.storageFunctions.readCookie(key); //return blank if no cookie exists. needed because getLocal is used to set vars in some if statements and 'null'	
				}
			else	{
				var value = localStorage.getItem(key);
				if(value == null)	{
					return myControl.storageFunctions.readCookie(key);
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
myControl.util.dump(" -> DELETED cookie "+c_name);
			}

		}, //storageFunctions
	
	


////////////////////////////////////   			thirdPartyFunctions		    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	thirdParty : {
		
		fb : {
			
			postToWall : function(msg)	{
				myControl.util.dump('BEGIN thirdpartyfunctions.facebook.posttowall. msg = '+msg);
				FB.ui({ method : "feed", message : msg}); // name: 'Facebook Dialogs', 
				},
			
			share : function(a)	{
				a.method = 'send';
				FB.ui(a);
				},
				
		
			saveUserDataToSession : function()	{
//				myControl.util.dump("BEGIN myControl.thirdParty.fb.saveUserDataToSession");
				
				FB.Event.subscribe('auth.statusChange', function(response) {
//					myControl.util.dump(" -> FB response changed. status = "+response.status);
					if(response.status == 'connected')	{
	//save the fb user data elsewhere for easy access.
						FB.api('/me',function(user) {
							if(user != null) {
//								myControl.util.dump(" -> FB.user is defined.");
								myControl.vars.fbUser = user;
								myControl.calls.cartSet.init({"data.bill_email":user.email});

//								myControl.util.dump(" -> user.gender = "+user.gender);

if(_gaq.push(['_setCustomVar',1,'gender',user.gender,1]))
	myControl.util.dump(" -> fired a custom GA var for gender.");
else
	myControl.util.dump(" -> ARGH! GA custom var NOT fired. WHY!!!");


								}
							});
						}
					});
//				myControl.util.dump("END myControl.thirdParty.fb.saveUserDataToSession");
				}
			}
		},


////////////////////////////////////   						sharedCheckoutUtilities				    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

/*
these functions are fairly generic and contain no extentension specific calls.
some id's may be hard coded (can change this later if need be), but they're form field id's(bill_email), fieldsets, or obvious enough to be shared(addresses)
*/




	sharedCheckoutUtilities : 	{
		
		//cart must already be in memory when this is run.
//will tell you which third party checkouts are compatible. does NOT look to see if merchant has them enabled,
// just checks to see if the cart contents would even allow it.
//currently, there is only a google field for disabling their checkout, but this is likely to change.
			which3PCAreCompatible :	function(){
				myControl.util.dump("BEGIN sharedCheckoutUtilities.which3PCAreCompatible");
				var obj = {};
				obj.paypalec = true;
				obj.amazonpayment = true;
				obj.googlecheckout = true;
				
				var L = myControl.data.cartItemsList.cart.stuff.length;
				for(var i = 0; i < L; i += 1)	{
					if(myControl.data.cartItemsList.cart.stuff[i].full_product['gc:blocked'])	{obj.googlecheckout = false}
					}

				return obj;
				},

//pretty straightforward. If a cid is set, the session has been authenticated.
//if the cid is in the cart/local but not the control, set it. most likely this was a cart passed to us where the user had already logged in or (local) is returning to the checkout page.
//if no cid but email, they are a guest.
//if logged in via facebook, they are a thirdPartyGuest.
//this could easily become smarter to take into account the timestamp of when the session was authenticated.
			
			determineAuthentication : function(){
				var r = 'none';
//was running in to an issue where cid was in local, but user hadn't logged in to this session yet, so now both cid and username are used.
				if(myControl.vars.cid && myControl.util.getUsernameFromCart())	{r = 'authenticated'}
				else if(myControl.model.fetchData('cartItemsList') && myControl.util.isSet(myControl.data.cartItemsList.cart.cid))	{
					r = 'authenticated';
					myControl.vars.cid = myControl.data.cartItemsList.cart.cid;
					}
//need to run third party checks prior to default 'guest' check because data.bill_email will get set for third parties
//and all third parties would get 'guest'
				else if(typeof FB != 'undefined' && !$.isEmptyObject(FB) && FB['_userStatus'] == 'connected')	{
					r = 'thirdPartyGuest';
//					myControl.thirdParty.fb.saveUserDataToSession();
					}
				else if(myControl.model.fetchData('cartItemsList') && myControl.data.cartItemsList.cart['data.bill_email'])	{
					r = 'guest';
					}
				else	{
					//catch.
					}
//				myControl.util.dump('myControl.sharedCheckoutUtilities.determineAuthentication run. authstate = '+r); 

				return r;
				},
			
	

/*
sometimes _is_default is set for an address in the list of bill/ship addresses.
sometimes it isn't. sometimes, apparently, it's set more than once.
this function closely mirrors core logic.
*/
			fetchPreferredAddress : function(TYPE)	{
//				myControl.util.dump("BEGIN sharedCheckoutUtilities.fetchPreferredAddress  ("+TYPE+")");
				var r = false; //what is returned
				if(!TYPE){ r = false}
				else	{
					var L = myControl.data.buyerAddressList['@'+TYPE].length;
//look to see if a default is set. if so, take the first one.
					for(var i = 0; i < L; i += 1)	{
						if(myControl.data.buyerAddressList['@'+TYPE][i]['_is_default'] == 1)	{
							r = myControl.data.buyerAddressList['@'+TYPE][i]['_id'];
							break; //no sense continuing the loop.
							}
						}
//if no default is set, use the first address.
					if(r == false)	{
						r =myControl.data.buyerAddressList['@'+TYPE][0]['_id']
						}
					}
//				myControl.util.dump("address id = "+r);
				
				return r;
				},



	

				
//sets the values of the shipping address to what is set in the billing address fields.
//can't recycle the setAddressFormFromPredefined here because it may not be a predefined address.
			setShipAddressToBillAddress : function()	{
//				myControl.util.dump('BEGIN sharedCheckoutUtilities.setShipAddressToBillAddress');
				$('#chkoutBillAddressFieldset > ul').children().children().each(function() {
					if($(this).is(':input')){$('#'+this.id.replace('bill_','ship_')).val(this.value)}
					});
				},


//allows for setting of 'ship' address when 'ship to bill' is clicked and a predefined address is selected.
			setAddressFormFromPredefined : function(addressType,addressId)	{
//				myControl.util.dump('BEGIN sharedCheckoutUtilities.setAddressFormFromPredefined');
//				myControl.util.dump(' -> address type = '+addressType);
//				myControl.util.dump(' -> address id = '+addressId);
				
				var L = myControl.data.buyerAddressList['@'+addressType].length
				var a,i;
				var r = false;
//looks through predefined addresses till it finds a match for the address id. sets a to address object.
				for(i = 0; i < L; i += 1)	{
					if(myControl.data.buyerAddressList['@'+addressType][i]['_id'] == addressId){
						a = myControl.data.buyerAddressList['@'+addressType][i];
						r = true;
						break;
						}
					}
				
//				myControl.util.dump(' -> a = ');
//				myControl.util.dump(a);
				$('#data-'+addressType+'_address1').val(a[addressType+'_address1']);
				if(myControl.util.isSet(a[addressType+'_address2'])){$('#data-'+addressType+'_address2').val(a[addressType+'_address2'])};
				$('#data-'+addressType+'_city').val(a[addressType+'_city']);
				$('#data-'+addressType+'_state').val(a[addressType+'_state']);
				$('#data-'+addressType+'_zip').val(a[addressType+'_zip']);
				$('#data-'+addressType+'_country').val(a[addressType+'_country'] ? a[addressType+'_country'] : "US"); //country is sometimes blank. This appears to mean it's a US company?
				$('#data-'+addressType+'_firstname').val(a[addressType+'_firstname']);
				$('#data-'+addressType+'_lastname').val(a[addressType+'_lastname']);
				if(myControl.util.isSet(a[addressType+'_phone'])){$('#data-'+addressType+'_phone').val(a[addressType+'_phone'])};
				return r;
				}, //setAddressFormFromPredefined


//will blank all fields in a fieldset. in theory, this would work even on a non-address field but not tested.
			resetAddress : function(fieldsetId)	{
				$('#'+fieldsetId+' :input').each(function() {
					if ($(this).is('select')) {
						$(this).val($(this).find('option[selected]').val());
						}
					else {
						$(this).val(this.defaultValue);
						}
					});
				} //resetAddress

		} //sharedCheckoutUtilities
	

	});
