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

Our goal is to have a very limited number of 'models' out there.
More controllers may exist than models.
More Extensions will exist than controllers.
view files will be distributed en-masse.

The model is primarily used only for sending and receiving data requests.
The model is also responsible for loading extensions (essentially a request with a fixed callback).
It then saves that data/extension into the control obj.
most code for display is in the 'view', which may be a TOXML file.
some display code may be present in the renderFormat portion of the control.
The view and the model should never speak to each other directly... other than maybe a button in the view executing this.dispatchThis().

There are two types of data being dealt with:
1. ajax request (referred to as request from here forward) for store data, such as product info, product lists, merchant info, etc.
2. extensions loaded as part of control object instantiation or on the fly as needed.

Some high level error handling occurs as part of the model, mostly for ISE's.
The rest is in the controller or extension. The model will execute callbacks.CALLBACKID.onError(d,uuid)
 -> d is the data object returned by the server. one of the few cases the raw response is returned.


execute the zModel function from within the controller. ex:  this = zModel();
 -> this will return an object into the this namespace. ex: this.dispatchThis()


There are currently three dispatch queues. (Q or DQ) which reside in _app.q.
Each queue can be filled with several requests, then dispatched all at once.
that'll piggyback several dispatches on one request, which is considerably more efficient
than several requests.

q.passive - should only be used for requests with no callbacks or for requests that should never get cancelled by another, but are not strictly necessary.
For instance, if you wanted to retrieve product data for page
2 and 3 when the user is on page 1, you'd use passive. No action occurs as a results of getting this data.
Or if you have dispatches occur during your app init but are concerned they could get over-written by the immutable q (such as requests for site nav that you don't want nukd if the user is coming in to the app for checkout) then use passive.
the passive q requests are never aborted.

q.mutable - this is the bulk of your calls. Getting information and then doing something with it (executed from the callback). It is called mutable
because it can be muted by the this.abortQ() function
will abort all mutable requests.  Use this when the users direction changes (they click page 1, then quickly click page 2 - you'd want to cancel the requests for 
page 1 so their callbacks are not executed).

q.immutable - use this sparingly, for 'mission critical' requests, such as add to cart, update cart and any requests during checkout.  Only 1 immutable request will fire at a time.
if any mutable requests are in process, they're cancelled. if an immutable request is in process and another request comes in (mutable or immutable), 
the secondary request is delayed till the first is done.


in some cases, you may use a mutable request for an add to cart so that the user can push it and move on with their experience. That's ok.
however, it is highly recommended that you only use the immutable q for checkout.

even though multiple dispatches can occur at the same time, it's still in your interest to pack the queue and dispatch at once.
it'll be faster with fewer dispatches.


_app.globalAjax.overrideAttempts - keeps track of how many times a dispatch has attempted while another is in progress.
_app.globalAjax.lastDispatch - keeps track of when the last dispatch occurs. Not currently used for much, but could allow for some auto-passive dispatches when idle.
*/

function model(_app) {

	var r = {
	
		
		version : "201405",
		
		
	// --------------------------- GENERAL USE FUNCTIONS --------------------------- \\
	
	//pass in a json object and the last item id is returned.
	//used in some of the fetchUUID function.
	// note that this is potentially a heavy function (depending on object size) and should be used sparingly.
		getLastIndex : function(obj) {
			var prop, r;
			for (prop in obj) {
				r = prop;
				}
			_app.u.dump('END model.getLastIndex r = '+r);
			return r;
			}, //getLastIndex
	
	
//pass in a json object and how many tier1 nodes are returned. handy.

		countProperties : function(obj) {
			var prop;
			var propCount = 0;
			for (prop in obj) {
				propCount++;
				}
			return propCount;
			},//countProperties

	
	// --------------------------- DISPATCH QUEUE FUNCTIONS --------------------------- \\
	
	/*
	
	addDispatchToQ
	
	The function returns false if the dispatch was not added to q or the uuid if it was.  
	uuid is returned so that it can be passed into other dispatches if needed.
	
	dispatch is a json object.
	exactly what gets passed in depends on the type of request being made.
	each dispatch will automatically get assigned the following, if not passed in:
	 -> uuid: Universal unique identifier. each request needs a unique id. best practice is to NOT pass one and to let this function generate one.
	 -> attempts: increments the number of attempts made on dispatch. will get set to zero if not set. 
	 -> status: dispatches are not deleted from the queue. instead, a status is set (such as completed). 
	
	Depending on the command, multiple params may be required. However to keep this function light, only _cmd is validated.
	
	In most cases, the following _rtag items should be set:
	_rtag.callback -> a reference to an item in the control object that gets executed on successful request (response may include errors)
	_rtag.datapointer -> this is where in _app.data the information returned will be saved to. 
	ex: datapointer:appProductGet|SKU would put product data into _app.data['appProductGet|SKU']
	
	if no datapointer is passed, no data is returned in an accessable location for manipulation.
	 -> the only time the actual response is passed back to the control is if an error was present.
	
	*/
	
	
		addDispatchToQ : function(dispatch,QID) {
//			_app.u.dump('BEGIN: addDispatchToQ');
//			_app.u.dump(" -> QID: "+typeof QID);
// QID default needs to be before the string check (because a blank value typeof != string.
			QID = (QID === undefined) ? 'mutable' : QID; //default to the mutable Q, but allow for PDQ to be passed in.
			var r; // return value.
			if(dispatch && !dispatch['_cmd'])	{
				_app.u.dump("in model.addDispatchToQ, no _cmd was set in dispatch. dispatch follows: ","warn"); dump(dispatch);
				r = false;
				}
// if QID was not a string, a catastropic JS error occured. could (and did) happen if call has bug in it.
			else if(typeof QID != 'string') {
				r = false;
				_app.u.dump("Unable to add dispatch to Queue. QID passed was not a string. dispatch and QID follow:","error");
				//the info below is meant to help troubleshoot where the error occured.
				_app.u.dump("dispatch: "); _app.u.dump(dispatch);
				_app.u.dump("QID: "); _app.u.dump(QID);
				}
			else	{
// there was an issue w/ a serialized form object being added directly to the Q (as opposed to going through a .call) and then the form being re-submitted after a correction
// but the original dispatch was getting resent instead of the updated command. extend creates a duplicate w/ no pointers. solved the issue.
// full explanation here: https://github.com/zoovy/AnyCommerce-Development/commit/41396eb5546621c0b31e3273ecc314e686daf4bc
				var tmp = $.extend(true,{},dispatch); 
				var uuid = this.fetchUUID() //uuid is obtained, not passed in.
				tmp["_uuid"] = uuid;
				tmp._tag = tmp._tag || {}; //the following line will error if tag is not an object. define as such if not already defined.
				tmp['_tag']["status"] = 'queued';
				_app.q[QID][uuid] = tmp;
				r = uuid;
// this breaks stuff.
//				this.writeLocal("response_"+uuid, JSON.stringify(tmp),'session'); //save a copy of each dispatch to sessionStorage for entymologist
				}
			return r;
			},// addDispatchToQ


//if an error happens during request or is present in response, change items from requested back to queued and adjust attempts.
//this is to make sure nothing gets left undispatched on critical errors.
		changeDispatchStatusInQ: function(QID,UUID,STATUS)	{
			var r = true;
			if(!QID || !UUID)
				r = false;
			else	{
				STATUS = STATUS === undefined ? 'UNSET' : STATUS; //a default, mostly to help track down that this function was run without a status set.
				if(_app.q[QID] && _app.q[QID][UUID])	{
					_app.q[QID][UUID]._tag.status = STATUS;
					}
				}
			return r;
			},
	
//used during dispatchThis to make sure only queued items are dispatched.
//returns items for the Q and sets status to 'requesting'.
//returns items in reverse order, so the dispatches occur as FIFO.
//in the actual DQ, the item id is the uuid. Here that gets dropped and the object id's start at zero (more friendly format for B).
//puuid is the parent/pipe uuid. it's added to the original dispatch for error handling
		filterQ : function(QID,puuid)	{
//			_app.u.dump("BEGIN: filterQ");
//			_app.u.dump(" -> QID = "+QID);
			
			var c = 0; //used to count how many dispatches are going into q. allows a 'break' if too many are present. is also 'index' of most recently added item in myQ.
			var myQ = new Array();
			
	//go through this backwards so that as items are removed, the changing .length is not impacting any items index that hasn't already been iterated through. 
			for(var index in _app.q[QID]) {
				
//				_app.u.dump(index+"). "+_app.q[QID][index]._cmd+" status: "+_app.q[QID][index]._tag.status);
				
				if(_app.q[QID][index]._tag && _app.q[QID][index]._tag.status == 'queued')	{
					_app.q[QID][index]._tag.status = "requesting";
//					_app.u.dump(" -> new status: "+_app.q[QID][index]._tag.status);
					if(puuid){_app.q[QID][index]._tag.pipeUUID = puuid}
					myQ.push($.extend(true,{},_app.q[QID][index])); //creates a copy so that myQ can be manipulated without impacting actual Q. allows for _tag to be removed.
					
//the following are blanked out because they're not 'supported' vars. eventually, we should move this all into _tag so only one field has to be blanked.
					delete myQ[c]['_tag']; //blank out rtag to make requests smaller. handleResponse will check if it's set and re-add it to pass into callback.

//* 201338 -> moved the c increment to below the comparison and changed from c > to c >=. that way if numRequestsPP = 1, this will work correctly.
//					if(c > _app.globalAjax.numRequestsPerPipe){
					if(c >= _app.globalAjax.numRequestsPerPipe){
						setTimeout(function(){
							_app.model.dispatchThis(QID);
							},500); //will fire off the remaining items in the q shortly.
						break //max of 100 dispatches at a time.
						}
					c++;
					}
				}
			return myQ;
			}, //filterQ


//execute this function in the app itself when a request is/may be in progrees and the user changes course.
//for instance, if the user does a search for 'sho' then corrects to 'shoe' prior to the request being completed,
//you'd want to abort the request in favor of the new command (you would not want a callback executed on 'sho', so cancel it).
//for this reason, the passive q requests should NEVER have callbacks on them.
//and tho technically you 'could' pass immutable as the QID, you should never cancel an immutable request, as these should be saved for 'add to cart' or 'checkout' requests.
		abortQ : function(QID)	{
			_app.u.dump("SANITY -> abortq is being run on "+QID); //output this so that when the red cancelled request shows in the console, we know why.
			_app.globalAjax.overrideAttempts = 0;  //the q is being reset essentially. this needs to be reset to zero so attempts starts over. 
			var r = 0; //incremented with each cancelled request. returned.
			for(var index in _app.globalAjax.requests[QID])	{
				_app.globalAjax.requests[QID][index].abort();
//IMPORTANT
//this delete removes the ajax request from the requests array. keep that array only full of active requests.
				delete _app.globalAjax.requests[QID][index];
				r +=1;
				}
//			_app.globalAjax.requests.mutable = {}; //probably not needed since we're deleting these individually above. add back if needed.
			return r;
			},

//Allows for the abort of a request.  Aborting a request will NOT trigger the error handler, as an abort is not an error.
		abortRequest : function(QID,UUID)	{
			if(QID && UUID && _app.globalAjax.requests[QID][UUID])	{
				_app.u.dump("model.abortRequest run on QID "+QID+" for UUID "+UUID);
				_app.globalAjax.requests[QID][UUID].abort();
				this.changeDispatchStatusInQ(QID,UUID,'aborted');
				delete _app.globalAjax.requests[QID][UUID];
				}
			else	{
				_app.u.throwGMessage("In model.abortRequest, either QID ["+QID+"] or UUID ["+UUID+"] blank or _app.globalAjax.requests[QID][UUID] does not exist (request may have already completed)");
				}
			},
		
		
/*
	
sends dispatches with status of 'queued' in a single json request.
only high-level errors are handled here, such as an ISE returned from server, no connection, etc.
a successful request executes handleresponse (handleresponse executes the controller.response.success action)
note - a successful request just means that contact with the server was made. it does not mean the request itself didn't return errors.

QID = Queue ID.  Defaults to the general dispatchQ but allows for the PDQ to be used.
either false (if no dispatch occurs) or the pipe uuid are returned. The pipe uuid can be used to cancel the request.
*/
	
		dispatchThis : function(QID)	{
//			_app.u.dump("'BEGIN model.dispatchThis ["+QID+"]");
			var r = true; //set to false if no dispatch occurs. set to pipeuuid if a dispatch occurs. this is the value returned.
			QID = QID === undefined ? 'mutable' : QID; //default to the general Q, but allow for priorityQ to be passed in.
//used as the uuid on the 'parent' request (the one containing the pipelines).
//set this early so that it can be added to each request in the Q as pipeUUID for error handling.
//also used for ajax.requests[QID][UUID] which stores the ajax request itself (and is used for aborting later, if need be).
			var pipeUUID = this.fetchUUID();

//by doing our filter first, we can see if there is even anything to BE dispatched before checking for conflicts.
//this decreases the likelyhood well set a timeout when not needed.
			var Q = this.filterQ(QID,pipeUUID); //filters out all non-queued dispatches. may set a limit to the # of dispatches too. 
			
			
//			var immutableRequestInProgress = $.isEmptyObject(_app.globalAjax.requests.immutable) ? false : true; //if empty, no request is in progress.
			var L = Q.length; //size of Q.
//			_app.u.dump(" -> Q.length = "+Q.length); _app.u.dump(Q);
//			_app.u.dump("QID = "+QID+" and L = "+L+" and aRequestIsInProgress = "+aRequestIsInProgress);
			
			if(L == 0)	{
//				_app.u.dump(" -> dispatch attempted, but q referenced has no 'queued' dispatches. Do nothing.");
				r = false; //nothing to dispatch.
				}
			else	{
//				_app.u.dump(" -> DQ has queued dispatches. no request in process. Move along... Move along...");
				}
				
/*
Should only reach this point IF no PRIORITY dispatch running.
set control var so that if another request is made while this one is executing, we know whether or not this one is priority.
the var also gets used in the handleresponse functions to know which q to look in for callbacks.
don't move this. if it goes before some other checks, it'll resed the Qinuse var before it's checked.
*/
			
			if(r)	{

				
//only change the Qinuse var IF we are doing a dispatch. otherwise when the value is used later, it'll be pointing at the wrong Q.	
//this var is used to reference whether the q in use is immutable or not. Never use this during handleResponse or anywhere else.
//it is constantly being overwritten, emptied, etc and by the time handle_response is running, another request could occur using a different Q
//and your code breaks.
//if this point is reached, we are exeuting a dispatch. Any vars used for tracking overrides, last dispatch, etc get reset.

_app.globalAjax.lastDispatch = _app.u.epochNow();
_app.globalAjax.overrideAttempts = 0;

//IMPORTANT
/*
the delete in the success AND error callbacks removes the ajax request from the requests array. 
If this isn't done, attempts to see if an immutable or other request is in process will return inaccurate results. 
must be run before handleResponse so that if handleresponse executes any requests as part of a callback, no conflicts arise.
can't be added to a 'complete' because the complete callback gets executed after the success or error callback.
*/
	var extra = "";
	for(var i = 0; i < Q.length; i++){
		var req = Q[i];
		extra += req["_cmd"];
		if(i < Q.length-1){
			extra += ".";
			}
		}
	var url = _app.vars.jqurl+"v-"+_app.model.version+"/"+extra
	dump(url);
	_app.globalAjax.requests[QID][pipeUUID] = $.ajax({
		type: "POST",
		url: url,
//		context : app,
		async: true,
		contentType : "text/json",
		dataType:"json",
//ok to pass admin vars on non-admin session. They'll be ignored.
		data: JSON.stringify({"_uuid":pipeUUID,"_session":_app.vars._session,"_cmd":"pipeline","@cmds":Q,"_clientid":_app.vars._clientid,"_domain":_app.vars.domain,"_userid":_app.vars.userid,"_deviceid":_app.vars.deviceid,"_authtoken":_app.vars.authtoken,"_version":_app.model.version})
		});

	_app.globalAjax.requests[QID][pipeUUID].error(function(j, textStatus, errorThrown)	{
//		_app.u.dump(" ------------------------ ");
		_app.u.dump("UH OH! got into ajaxRequest.error. either call was aborted or something went wrong.");
//		_app.u.dump(j); _app.u.dump("textStatus: "+textStatus); _app.u.dump(errorThrown);
//		_app.u.dump(" ------------------------ ");
		if(textStatus == 'abort')	{
			delete _app.globalAjax.requests[QID][pipeUUID];
			for(var index in Q) {
				_app.model.changeDispatchStatusInQ(QID,Q[index]['_uuid'],'abort');
				}
			}
		else	{
			_app.u.dump(' -> REQUEST FAILURE! Request returned high-level errors or did not request: textStatus = '+textStatus+' errorThrown = '+errorThrown,'error');
			delete _app.globalAjax.requests[QID][pipeUUID];
			_app.model.handleCancellations(Q,QID);
			if(typeof jQuery().hideLoading == 'function'){
//				$(".loading-indicator-overlay").parent().hideLoading(); 
// ** 201403 -> rather than targeting a child and then going up the dom, we'll target the element that had showLoading applied to it directly.
				$(".ui-showloading").hideLoading(); //kill all 'loading' gfx. otherwise, UI could become unusable.
				}
//			setTimeout("_app.model.dispatchThis('"+QID+"')",1000); //try again. a dispatch is only attempted three times before it errors out.
			}
		});

		_app.globalAjax.requests[QID][pipeUUID].success(function(d)	{
			delete _app.globalAjax.requests[QID][pipeUUID];
			_app.model.handleResponse(d,QID,Q);
			}
		)
	r = pipeUUID; //return the pipe uuid so that a request can be cancelled if need be.

				}

		return r;
	//		_app.u.dump('//END dispatchThis');
		}, //dispatchThis
	

//run when a request fails, most likely due to an ISE

		handleCancellations : function(Q,QID)	{
			var uuid;
			for(var index in Q) {
				uuid = Q[index]['_uuid'];
				_app.model.changeDispatchStatusInQ(QID,uuid,'cancelledDueToErrors');
//make sure a callback is defined.
				var msgDetails = "<ul>";
				msgDetails += "<li>issue: API request failure (likely an ISE)<\/li>";
				msgDetails += "<li>uri: "+document.location+"<\/li>";
				msgDetails += "<li>_cmd: "+Q[index]['_cmd']+"<\/li>";
				msgDetails += "<li>domain: "+_app.vars.domain+"<\/li>";
				msgDetails += "<li>release: "+_app.model.version+"|"+_app.vars.release+"<\/li>";
				msgDetails += "<\/ul>";
				
				this.handleErrorByUUID(uuid,QID,{'errid':666,'errtype':'ise','persistent':true,'errmsg':'The request has failed. The app may continue to operate normally.<br \/>Please try again or contact the site administrator with the following details:'+msgDetails})
				}
			},
	
	
	// --------------------------- HANDLERESPONSE FUNCTIONS --------------------------- \\
	
	
	
	handleErrorByUUID : function(UUID,QID,responseData)	{
//		_app.u.dump("BEGIN model.handleErrorByUUID ["+UUID+"]");
		if(QID && UUID && responseData)	{
			responseData['_rtag'] = responseData['_rtag'] || this.getRequestTag(UUID); //_tag is stripped at dispatch and readded. make sure it's present.
			if(responseData['_rtag'])	{
				var Q = _app.q[QID];	
				if(Q[UUID]['_tag'] && Q[UUID]['_tag']['callback'])	{
					var callback = Q[UUID]['_tag']['callback'];
//callback is an anonymous function. Execute it.
					if(typeof callback == 'function')	{
						callback(responseData,UUID)
						}
//callback is defined in extension or controller as object (with onSuccess and maybe onError)
					else if(typeof callback == 'string')	{
						callback = Q[UUID]['_tag']['extension'] ? _app.ext[Q[UUID]['_tag']['extension']].callbacks[Q[UUID]['_tag']['callback']] : _app.callbacks[Q[UUID]['_tag']['callback']];
						if(callback && typeof callback.onError == 'function'){
							callback.onError(responseData,UUID);
							}
						else{
							_app.u.throwMessage(responseData);
							}
						}
					else	{
						//unknown type for callback.
						_app.u.throwMessage(responseData);
						
						}
					}
//_rtag defined, but no callback.
				else	{
					_app.u.dump(" -> callback not set");
					_app.u.throwMessage(responseData);
					}
				}
//no callback is defined. throw generic messag
			else	{
				_app.u.dump(" -> rtag not set");
				_app.u.throwMessage(responseData);
				}			
			
			
			}
		else	{
			_app.u.dump("WARNING! required params for handleErrorByUUID not all present:");
			_app.u.dump(" -> UUID: "+UUID);
			_app.u.dump(" -> QID: "+QID);
			_app.u.dump(" -> typeof responseData: "+typeof responseData);
			}
		},
	
	/*
	
	handleResponse and you...
	some high level errors, like no cartid or invalid json or whatever get handled in handeResponse
	lower level (_cmd specific) get handled inside their independent response functions or in responseHasErrors(), as they're specific to the _cmd
	
	if no high level errors are present, execute a response function specific to the request (ex: request of addToCart executed handleResponse_addToCart).
	this allows for request specific errors to get handled on an individual basis, based on request type (addToCart errors are different than appProductGet errors).
	the defaultResponse also gets executed in most cases, if no errors are encountered. 
	the defaultResponse contains all the 'success' code, since it is uniform across commands.
	
QID is the dispatchQ ID (either passive, mutable or immutable. required for the handleReQ function.
	*/
	
		handleResponse : function(responseData,QID,Q)	{
//			_app.u.dump('BEGIN model.handleResponse.');
			
			function executeResponseHandler(rd){
				function callback(){
					if(typeof _app.model['handleResponse_'+rd['_rcmd']] == 'function')	{
						_app.model['handleResponse_'+rd['_rcmd']](rd)	//executes a function called handleResponse_X where X = _cmd, if it exists.
						} 
					else	{
						_app.model.handleResponse_defaultAction(rd,null);
						}
					}
				if(rd._rtag.extension || rd._rtag.require){
					var requirements = [];
					if(rd._rtag.extension){
						requirements.push(rd._rtag.extension);
						}
					if(rd._rtag.require){
						if(typeof rd._rtag.require == "string"){
							requirements.push(rd._rtag.require);
							}
						else{
							$.merge(requirements, rd._rtag.require);
							}
						}
					_app.require(requirements, callback);
					}
				else {
					callback();
					}
				}
			
//if the request was not-pipelined or the 'parent' pipeline request contains errors, this would get executed.
//the handlereq function manages the error handling as well.
			if(responseData && !$.isEmptyObject(responseData))	{
				var uuid = responseData['_uuid'];
				var QID = QID || this.whichQAmIFrom(uuid);
				
//				_app.u.dump(" -> responseData is set. UUID: "+uuid);
//if the error is on the parent/piped request, no qid will be set.
//if an iseerr occurs, than even in a pipelined request, errid will be returned on 'parent' and no individual responses are returned.
				if(responseData && (responseData['_rcmd'] == 'err' || responseData.errid))	{
					_app.u.dump(' -> API Response for '+QID+' Q contained an error at the top level (on the pipe)','warn');
					$('.ui-showloading').hideLoading(); //make sure all the showLoadings go away.
					//brian says that an error 10 will always ONLY be for admin. 2014-03-20
					if(responseData.errid == 10)	{
						_app.u.dump(" -> errid of 10 corresponds to an expired token. ");
						_app.ext.admin.callbacks.handleLogout.onSuccess({"msg":"You were logged out because the token you were using has expired. Please log in to continue."});
						}
					if(Q && Q.length)	{
//						_app.u.dump(" -> Q.length: "+Q.length); _app.u.dump(Q);
						for(var i = 0, L = Q.length; i < L; i += 1)	{
							this.handleErrorByUUID(Q[i]._uuid,QID,responseData);
							}
						}
//QID will b set if this is a NON pipelined request.
// could get here in a non-pipelined request.
					else if(QID)	{
//					_app.u.dump(responseData);
						this.handleErrorByUUID(responseData['_uuid'],QID,responseData);
						}
					else	{
//most likely, a pipelined request that failed at a high level.
						QID = this.getQIDFromPipeUUID(uuid) //will try to ascertain what QID to look into for error handling.
						responseData.errmsg = "Something has gone wrong. please try again or refresh. If the error persists, please contact the site administrator. ["+responseData.errmsg+"]";
						if(QID)	{
							var uuids = this.getUUIDsbyQIDandPipeUUID(QID,responseData['_uuid']);
//							_app.u.dump(" -> uuids: "); _app.u.dump(uuids);
							var L = uuids.length
							if(L)	{
								_app.u.dump(" -> # uuids in failed pipe: "+L);
								for(var i = 0; i < L; i += 1)	{
									this.handleErrorByUUID(_app.q[QID][uuids[i]]['_uuid'],QID,responseData);
									}
								}
							else	{_app.u.throwMessage(responseData);} //don't suspect we'd get here, but best practice error handling would be to throw some error as opposed to nothing.
							
							}
						else	{
//still unable to determine Q. throw some generic error message along with response error.
							_app.u.dump("ERROR! a high level error occured and the Q ID was unable to be determined.");
							_app.u.throwMessage(responseData);
							if(typeof jQuery().hideLoading == 'function'){
								$(".loading-indicator-overlay").parent().hideLoading(); //kill all 'loading' gfx. otherwise, UI could become unusable.
								}
							}
						}
					}

//pipeline request
				else if(responseData && responseData['_rcmd'] == 'pipeline')	{
					
//handle all the call specific handlers.
					for (var i = 0, j = responseData['@rcmds'].length; i < j; i += 1) {
						responseData['@rcmds'][i].ts = _app.u.epochNow()  //set a timestamp on local data
// _tag is reassociated early so that the data is available as quick as possible, including in any custom handleResponse_ functions
//has to be called before writing to local because datapointer is in _tag
						var _rtag = responseData['@rcmds'][i]['_rtag'] || this.getRequestTag(responseData['@rcmds'][i]['_uuid']); 
						responseData['@rcmds'][i]['_rtag'] = _rtag;
						this.writeToMemoryAndLocal(responseData['@rcmds'][i]);
						
						executeResponseHandler(responseData['@rcmds'][i]);
						}
					}
//a solo successful request.
//the logic for the order here is the same as in the pipelined response, where it is documented.
				else {
					responseData['_rtag'] = responseData['_rtag'] || this.getRequestTag(responseData['_uuid']);
					this.writeToMemoryAndLocal(responseData)
					
					executeResponseHandler(responseData);
					}
				}
			else	{
//if responseData isn't set, an uber-high level error occured.
					_app.u.throwMessage("Uh oh! Something has gone very wrong with our _app. We apologize for any inconvenience. Please try agian. If error persists, please contact the site administrator.");
				}
			}, //handleResponse


//this will remove data from both local storage, session storage AND memory.
//execute this on a field prior to a call when you want to ensure memory/local is not used (fresh data).
		destroy : function(key)	{
//			_app.u.dump(" -> destroying ["+key+"]");
			if(_app.data[key])	{
				delete _app.data[key];
				}
			_app.model.nukeLocal(key,'local');
			_app.model.nukeLocal(key,'session');
			},


//this will write the respose both to local and/or session storage and into _app.data
		writeToMemoryAndLocal : function(responseData)	{

			var datapointer = false;
			if(responseData['_rtag'])	{datapointer = responseData['_rtag']['datapointer']}

//if datapointer is not set, data is automatically NOT saved to localstorage or memory.
//however, there is (ping) already, and could be more, cases where datapointers are set, but we don't want the data locally or in memory.
//so we have simple functions to check by command.
			if(datapointer && !_app.model.responseHasErrors(responseData) && !_app.model.responseIsMissing(responseData))	{
//this is the data that will be saved into local or session.
				var obj4Save = $.extend(true,{},responseData); //this makes a copy so that the responseData object itself isn't impacted.
				obj4Save._rtag = null; //make sure _rtag doesn't get saved to localstorage. may contiain a jquery object, function, etc.
// *** 201401 -> The data stored in memory no longer contains the _rtag.
// the _tag data can be found w/ the original dispatch in _app.q[QID][uuid]
				if(this.thisGetsSaved2Memory(responseData['_rcmd']))	{
					_app.data[datapointer] = obj4Save;
					}				
				if(this.thisGetsSaved2Local(responseData['_rcmd'])){
					_app.u.dump(" -> passed check for save local: "+responseData['_rcmd']);
					_app.model.writeLocal(datapointer,obj4Save,'local'); //save to localStorage, if feature is available.
					}
				if(this.thisGetsSaved2Session(responseData['_rcmd']))	{
					_app.model.writeLocal(datapointer,obj4Save,'session'); //save to sessionStorage, if feature is available.
					}

				}
			else	{
//catch. not writing to local. Either not necessary or an error occured.
				}
			}, //writeToMemoryAndLocal

		cmdIsAnAdminUpdate : function(cmd)	{
			var r = false;
			if(cmd.indexOf('admin') === 0)	{
//admin updates don't need to be saved to memory.
				if(cmd.indexOf('Update', cmd.length - 6) >= 0)	{r = true;}
				else if(cmd.indexOf('Macro', cmd.length - 5) >= 0)	{r = true;}
				}
			return r;
			},

		thisGetsSaved2Memory : function(cmd)	{
			var r = true;
			if(cmd == 'adminNavcatMacro')	{}
// ** 201402 -> if they don't need to be saved to memory, don't put a datapointer on them. But allow them to be added if necessary.
//			else if(this.cmdIsAnAdminUpdate(cmd))	{
//				r = false;
//				}
			else	{
				switch(cmd)	{
					case 'appPageGet': //saved into category object earlier in process. redundant here.
					case 'cartSet': //changes are reflected in cart object.
//					case 'ping': //ping may be necessary in memory for anycontent in conjunction w/ extending by datapointers. rss is a good example of this.
					r = false
					break;
					}				
				}
			return r;
			},

//localStorage is reserved for data that MUST be carried between sessions. For everything else, sessionStorage is used.
		thisGetsSaved2Local : function(cmd){
			var r = false;
			switch(cmd)	{
				case 'authAdminLogin':
//				case 'appBuyerLogin': //necessary for buyer login to be persistant
//				case 'whoAmI': //necessary for buyer login to be persistant
				r = true;
				}
			return r;
			},

//Session is a safe place to store most data, as it'll be gone once the browser is closed. Still, keep CC data out of there.
		thisGetsSaved2Session : function(cmd)	{
			var r = true; //what is returned. is set to false if the cmd should not get saved to local storage.
			if(this.cmdIsAnAdminUpdate(cmd))	{
				r = false;
				}
			else	{
				switch(cmd)	{
					case 'adminCustomerWalletPeek': //contains cc #
					case 'adminOrderCreate': //may contain cc
					case 'adminOrderDetail': //may contain cc
					case 'adminOrderPaymentAction': //may contain cc
					case 'appBuyerLogin': //should be session specific. close/open will exec whoAmI which will put into memory if user is logged in.
					case 'buyerWalletList': //conains some cc info.
					case 'cartOrderCreate': //may contain cc
					case 'cartPaymentQ': //may contain cc
					case 'cartSet': //changes are reflected in cart object.
					case 'ping':
					r = false
					break;
					}
				}
			return false; //saving to session was causing a LOT of memory to be used in FF.
			},

	//gets called for each response in a pipelined request (or for the solo response in a non-pipelined request) in most cases. request-specific responses may opt to not run this, but most do.
		handleResponse_defaultAction : function(responseData)	{
//			_app.u.dump('BEGIN handleResponse_defaultAction');
			var callback = false; //the callback name.
			var uuid = responseData['_uuid']; //referenced enough to justify saving to a var.
			var datapointer = null; //a callback can be set with no datapointer.
			var status = null; //status of request. will get set to 'error' or 'completed' later. set to null by defualt to track cases when not set to error or completed.
//check for missing first or hasErrors will flag it as an error.
			if(_app.model.responseIsMissing(responseData))	{status = 'missing'}
			else if(_app.model.responseHasErrors(responseData))	{status = 'error'}
			else	{} //status will get set later.


			if(!$.isEmptyObject(responseData['_rtag']) && _app.u.isSet(responseData['_rtag']['callback']))	{
	//callback has been defined in the call/response.
				callback = responseData['_rtag']['callback']; //shortcut
//				_app.u.dump(' -> callback: '+(typeof callback == 'string' ? callback : 'function'));
				if(typeof callback == 'function'){} //do nothing to callback. will get executed later.
				else if(responseData['_rtag']['extension'] && _app.ext[responseData['_rtag']['extension']] && _app.ext[responseData['_rtag']['extension']].callbacks && !$.isEmptyObject(_app.ext[responseData['_rtag']['extension']].callbacks[callback]))	{
					callback = _app.ext[responseData['_rtag']['extension']].callbacks[callback];
//					_app.u.dump(' -> callback node exists in _app.ext['+responseData['_rtag']['extension']+'].callbacks');
					}
				else if(!$.isEmptyObject(_app.callbacks[callback]))	{
					callback = _app.callbacks[callback];
//					_app.u.dump(' -> callback node exists in _app.callbacks');
					}
				else	{
					callback = false;
					_app.u.dump('A callback defined but does not exist. The _rtag follows: ','warn'); _app.u.dump(responseData['_rtag']);
					}
				}
			else	{callback = false;} //no callback defined.
	
//if no datapointer is set, the response data is not saved to local storage or into the _app. (add to cart, ping, etc)
//effectively, a request occured but no data manipulation is required and/or available.
//likewise, if there's an error in the response, no point saving this locally. 
			if(!$.isEmptyObject(responseData['_rtag']) && _app.u.isSet(responseData['_rtag']['datapointer']) && status != 'error' && status != 'missing')	{
				datapointer = responseData['_rtag']['datapointer'];
//on a ping, it is possible a datapointer may be set but we DO NOT want to write the pings response over that data, so we ignore pings.
//an appPageGet request needs the requested data to extend the original page object. (in case two separate request come in for different attributes for the same category.	
				if(responseData['_rcmd'] == 'ping' || responseData['_rcmd'] == 'appPageGet')	{

					}
				else	{
					this.writeToMemoryAndLocal(responseData);
					}
				}
			else	{
	//			_app.u.dump(' -> no datapointer set for uuid '+uuid);
				}

//errors present and a defined action for handling those errors is defined.
			if((status == 'error' || status == 'missing') && callback)	{
				if(typeof callback == 'function')	{
					callback(responseData,uuid); //if an anonymous function is passed in, it handles does it's own error handling.
					}
				else if(typeof callback == 'object' && typeof callback['on'+(status == 'error' ? 'Error' : 'Missing')] == 'function'){
/*
below, responseData['_rtag'] was passed instead of uuid, but that's already available as part of the first var passed in.
uuid is more useful because on a high level error, rtag isn't passed back in responseData. this way uuid can be used to look up originat _tag obj.
*/
					callback['on'+(status == 'error' ? 'Error' : 'Missing')](responseData,uuid);
					}
				else if(typeof callback == 'object' && typeof _app.u.throwMessage === 'function')	{
//callback defined but no error case defined. use default error handling.
					_app.u.throwMessage(responseData);					
					}
				else{
					_app.u.dump('ERROR response for uuid '+uuid+'. callback defined but does not exist or is not valid type. callback = '+callback+' datapointer = '+datapointer)
					}
				}
//has errors but no error handler declared. use default
			else if((status == 'error' || status == 'missing') && typeof _app.u.throwMessage === 'function')	{
				_app.u.throwMessage(responseData);
				}
			else if(_app.model.responseIsMissing(responseData) && !callback && typeof _app.u.throwMessage === 'function')	{
				_app.u.throwMessage(responseData);
				}
//no errors. no callback.
			else if(callback == false)	{
				status = 'completed';
	//			_app.u.dump(' --> no callback set in original dispatch. dq set to completed for uuid ('+uuid+')');
				}
//to get here, no errors are present AND a callback is defined.
			else	{
				status = 'completed';
				if(typeof callback == 'function')	{
// * 201334 -> responses contain macro-specific messaging. some or all of these may be success or fail, but the response is still considered a success.
					
					callback(responseData._rtag,{'@RESPONSES':responseData['@RESPONSES']});
					}
				else if(typeof callback == 'object' && typeof callback.onSuccess == 'function')	{
					callback.onSuccess(responseData['_rtag'],{'@RESPONSES':responseData['@RESPONSES']}); //executes the onSuccess for the callback
					}
				else{
					_app.u.dump(' -> successful response for uuid '+uuid+'. callback defined ('+callback+') but does not exist or is not valid type.')
					}
				}
			var fromQ = _app.model.whichQAmIFrom(uuid);
			if(fromQ && _app.q[fromQ] && _app.q[fromQ][Number(uuid)])	{
				_app.q[_app.model.whichQAmIFrom(uuid)][Number(uuid)]._tag['status'] = status;
				}
			return status;
		},
	
//after an order is created, the 'old' cart data gets saved into an order| for quick reference. 
		handleResponse_adminOrderCreate : function(responseData)	{
			this.handleResponse_cartOrderCreate(responseData); //share the same actions. append as needed.
			},

		handleResponse_authNewAccountCreate : function(responseData)	{
			_app.model.handleResponse_authAdminLogin(responseData); //this will have the same response as a login if successful.
			},

/*
It is possible that multiple requests for page content could come in for the same page at different times.
so to ensure saving to appPageGet|.safe doesn't save over previously requested data, we extend it the ['%page'] object.
*/
		handleResponse_appPageGet : function(responseData)	{
			if(responseData['_rtag'] && responseData['_rtag'].datapointer)	{
				var datapointer = responseData['_rtag'].datapointer;
				if(_app.data[datapointer])	{
					//already exists.  extend the %page
					_app.data[datapointer]['%page'] = $.extend(_app.data[datapointer]['%page'],responseData['%page']);
					}
				else	{
					_app.data[datapointer] = responseData;
					}
				_app.model.writeLocal(datapointer,_app.data[datapointer],'session'); //save to session storage, if feature is available.
				}
			_app.model.handleResponse_defaultAction(responseData);
			}, //handleResponse_appPageGet



//this response is also executed by authNewAccoutnCreate
		handleResponse_authAdminLogin: function(responseData)	{
			_app.u.dump("BEGIN model.handleResponse_authAdminLogin"); //_app.u.dump(responseData);
			if(_app.model.responseHasErrors(responseData))	{} // do nothing. error handling handled in _default.
//executing this code block if an error is present will cause a JS error.
			else	{
				_app.vars.deviceid = responseData.deviceid;
				_app.vars.authtoken = responseData.authtoken;
				_app.vars.userid = responseData.userid.toLowerCase();
				_app.vars.username = responseData.username.toLowerCase();
				_app.vars.thisSessionIsAdmin = true;
				}
			_app.model.handleResponse_defaultAction(responseData); //datapointer ommited because data already saved.
			},

//this function gets executed upon a successful request for a new session id.
//it is also executed if appAdminAuthenticate returns exists=1 (yes, you can).
//formerly newSession
		handleResponse_appCartCreate : function(responseData)	{
//no error handling at this level. If a connection or some other critical error occured, this point would not have been reached.
//save session id locally to maintain session id throughout user experience.
			this.addCart2Session(responseData['_cartid']);
			_app.model.handleResponse_defaultAction(responseData); //datapointer ommited because data already saved.
			_app.u.dump("cartID = "+responseData['_cartid']);
			return responseData['_cartid'];
			}, //handleResponse_appCartCreate


		responseIsMissing : function(responseData)	{
			var r = false; //what is returned.
			if(responseData['_rtag'] && responseData['_rtag'].forceMissing)	{
				r = true;
				responseData.errid = "MVC-MISSING-000";
				responseData.errtype = "missing";
				responseData.errmsg = "forceMissing is true for _tag. cmd = "+responseData['_rcmd']+" and uuid = "+responseData['_uuid'];
//			_app.u.dump(responseData);
				}
			else if(responseData['errtype'] == 'missing')	{
				r = true;
				}
			else	{}
			return r;
			},

/*
in most cases, the errors are handled well by the API and returned either as a single message (errmsg)
or as a series of messages (_msg_X_id) where X is incremented depending on the number of errors.
*/	
		responseHasErrors : function(responseData)	{
//			_app.u.dump('BEGIN model.responseHasErrors');
//at the time of this version, some requests don't have especially good warning/error in the response.
//as response error handling is improved, this function may no longer be necessary.
			var r = false; //defaults to no errors found.
			if(responseData['_rtag'] && responseData['_rtag'].forceError)	{
				r = true;
				responseData.errid = "MVC-ERROR-000";
				responseData.errtype = "debug";
				responseData.errmsg = "forceError is true for _tag. cmd = "+responseData['_rcmd']+" and uuid = "+responseData['_uuid'];
//			_app.u.dump(responseData);
				}
			else	{
				switch(responseData['_rcmd'])	{
					case 'appProductGet':
					case 'adminProductDetail':
	//the API doesn't recognize doing a query for a sku and it not existing as being an error. handle it that way tho.
						if(!responseData['%attribs'] || !responseData['%attribs']['db:id']) {
							r = true;
							responseData['errid'] = "MVC-M-100";
							responseData['errtype'] = "missing"; 
							responseData['errmsg'] = "could not find product "+responseData.pid+". Product may no longer exist. ";
							} //db:id will not be set if invalid sku was passed.
						break;
//most of the time, a successful response w/out errors is taken as a success. however, due to the nature of appCartCreate, we verify we have what we need.
					case 'appCartCreate':
						if(!responseData._cartid)	{
							r = true;
							responseData['errid'] = "MVC-M-150";
							responseData['errtype'] = "apperr"; 
							responseData['errmsg'] = "appCartCreate response did not contain a _cartid.";
							}
						break;
					case 'adminEBAYProfileDetail':
						if(!responseData['%PROFILE'] || !responseData['%PROFILE'].PROFILE)	{
							r = true;
							responseData['errid'] = "MVC-M-300";
							responseData['errtype'] = "apperr"; 
							responseData['errmsg'] = "profile came back either without %PROFILE or without %PROFILE.PROFILE.";
							}
						break;
					case 'appNavcatDetail':
						if(responseData.errid > 0 || responseData['exists'] == 0)	{
							r = true
							responseData['errid'] = "MVC-M-200";
							responseData['errtype'] = "apperr";
							responseData['errmsg'] = "could not find category (may not exist)";
							} //a response errid of zero 'may' mean no errors.
						break;
	
					default:
						if(Number(responseData['errid']) > 0 && responseData.errtype != 'warn') {r = true;} //warnings do not constitute errors.
						else if(Number(responseData['_msgs']) > 0)	{
							var errorTypes = new Array("youerr","fileerr","apperr","apierr","iseerr","cfgerr");
							//the _msg format index starts at one, not zero.
							for(var i = 1, L = Number(responseData['_msgs']); i <= L; i += 1)	{
								if($.inArray(responseData['_msg_'+i+'_type'],errorTypes) >= 0)	{
									r = true;
									break; //once an error type is found, exit. one positive is enough.
									}
								}
							}
// *** 201336 -> mostly impacts admin UI. @MSGS is another mechanism for alerts that needs to be checked.
						else if(responseData['@MSGS'] && responseData['@MSGS'].length)	{
							var L = responseData['@MSGS'].length;
							for(var i = 0; i < L; i += 1)	{
								if(responseData['@MSGS'][i]['!'] == 'ERROR')	{
									r = true;
									break; //if we have an error, exit early.
									}
								}
							}
						else if(responseData['@RESPONSES'] && responseData['@RESPONSES'].length)	{
							for(var i = 0, L = responseData['@RESPONSES'].length; i < L; i += 1)	{
								if(responseData['@RESPONSES'][i]['msgtype'] == 'ERROR' || responseData['@RESPONSES'][i]['msgtype'] == 'apierr')	{
									r = true;
									break; //if we have an error, exit early.
									}
								}
							}
						else {}
		//				_app.u.dump('default case for error handling');
						break;
					}
				}
//			if(r)	{
//				_app.u.dump(" -> responseData"); _app.u.dump(responseData);
//				}
	//		_app.u.dump('//END responseHasErrors. has errors = '+r);
			return r;
			},
	
	
	// --------------------------- FETCH FUNCTIONS --------------------------- \\
	
	
	
	/*
	each request must have a uuid (Unique Universal IDentifyer).
	the uuid is also the item id in the dispatchQ. makes finding dispatches in Q faster/easier.
	
	first check to see if the uuid is set in the _app. currently, this is considered a 'trusted' source and no validation is done.
	then check local storage/cookie. if it IS set and the +1 integer is not set in the DQ, use it.
	if local isn't set or is determined to be inaccurate (local + 1 is already set in DQ)
	 -> default to 999 if DQ is empty, which will start uuid's at 1000.
	 -> or if items are in the Q get the last entry and treat it as a number (this should only happen once in a session, in theory).
	
	*/
	
		fetchUUID : function()	{
//			_app.u.dump('BEGIN fetchUUID');
			var uuid = false; //return value
			var L;
			
			if(_app.vars.uuid)	{
	//			_app.u.dump(' -> isSet in _app. use it.');
				uuid = _app.vars.uuid; //if the uuid is set in the control, trust it.
				}
//in this else, the L is set to =, not == because it's setting itself to the value of the return of readLocal so readLocal doesn't have to be executed twice.
			else if(L = _app.model.readLocal("uuid",'local'))	{
				L = Math.ceil(L * 1); //round it up (was occassionally get fractions for some odd reason) and treat as number.
	//			_app.u.dump(' -> isSet in local ('+L+' and typof = '+typeof L+')');
				if($.isEmptyObject(_app.q.mutable[L+1]) && $.isEmptyObject(_app.q.immutable[L+1]) && $.isEmptyObject(_app.q.passive[L+1])){
					uuid = L;
	//				_app.u.dump(' -> local + 1 is empty. set uuid to local');
					}
				}
	//generate a new uuid if it isn't already set or it isn't an integer.
			if(uuid == false || isNaN(uuid))	{
	//			_app.u.dump(' -> uuid not set in local OR local + 1 is already set in dispatchQ');
				if(_app.q.mutable.length + _app.q.immutable.length + _app.q.passive.length == 0)	{
	//				_app.u.dump(' -> setting default uuid');
					uuid = 999;
					}
				else	{
//get last request in both q's and determine the larger uuid for use.
					uuid = Math.max(_app.model.getLastIndex(_app.q.immutable),_app.model.getLastIndex(_app.q.mutable),_app.model.getLastIndex(_app.q.passive));
					}
				}
	
			uuid += 1;
			_app.vars.uuid = uuid;
			_app.model.writeLocal('uuid',uuid); //save it locally.
//			_app.u.dump('//END fetchUUID. uuid = '+uuid);
			return uuid;
			}, //fetchUUID
	
// pretty straightforward. pass in a uuid and this will return the QID.
		whichQAmIFrom : function(uuid)	{
			var r = false;
			for(var index in _app.q)	{
				if(_app.q[index][uuid])	{
					r = index;
					break;
					}
				}
			return r;
			}, //whichQAmIFrom

//returns an array of UUID's that use the 'pipe' uuid.
		getUUIDsbyQIDandPipeUUID : function(QID,pipeUUID)	{
			var r = new Array();
			for(var index in _app.q[QID])	{
				if(_app.q[QID][index]._tag && _app.q[QID][index]._tag['pipeUUID'] == pipeUUID)	{
					r.push(_app.q[QID][index]['_uuid']);
					}
				}
			return r;			
			},

		checkForPipeUUIDInQID : function(QID,pipeUUID)	{
			var r = false;
			for(var index in _app.q[QID])	{
				if(_app.q[QID][index].tag && _app.q[QID][index].tag['pipeUUID'] == pipeUUID)	{
					r = true;
					break; //end once we have a match. pipeuuid is specific to one Q
					}
				}
			return r;
			},

		getQIDFromPipeUUID : function(pipeUUID){
			_app.u.dump("BEGIN model.getQIDFromPipeUUID ["+pipeUUID+"]");
			var r = false; //what is returned.
			for(var index in _app.q)	{
				if(this.checkForPipeUUIDInQID(index,pipeUUID))	{
					r = index;
					break; //exit early once a match is found.
					}
				}
			_app.u.dump(" -> pipeUUID: "+pipeUUID+" and qid: "+r);
			return r;
			},


//will get the _tag object from this request in it's original q. allows for _tag to NOT be pased in request, making for smaller requests.
		getRequestTag : function(uuid,qid){
			var r = false; //what is retured. Either false (unable to get tag) or the tag object itself.
			if(uuid)	{
//try to figure out which qid request was in.
				if(!qid)	{
					qid = this.whichQAmIFrom(uuid)
					}
				
//				_app.u.dump(" -> uuid: "+uuid+" and QID: "+qid);
				
				if(qid && _app.q[qid][uuid])	{
//					_app.u.dump(" -> _app.q[qid][uuid]: "); _app.u.dump(_app.q[qid][uuid]);
					r = _app.q[qid][uuid]['_tag'] //will set r either to the object or undefined, if not set.
					}
				}
			else	{
				//uuid is required.
				}
			return r;
			},
	
// check to see if the cartID is already in carts. if so, remove old and add new id to top.
// do we want a 'bringCartIntoFocus', which would move a cart id to the top? wait and see if it's necessary.
		addCart2Session : function(cartID)	{
//			_app.u.dump(">>>>>>>> BEGIN addCart2Session: "+cartID);
			var carts = _app.vars.carts || this.dpsGet('app','carts') || [];
//each cart id should only be in carts once. if the cart id is already present, remove it.
			var index = $.inArray(cartID,carts);
			if(index >= 0)	{
				carts.splice(index,1);
				}
			carts.unshift(cartID); //new carts get put on top. that way [0] is always the latest cart.
			_app.vars.carts = carts;
			return this.dpsSet('app','carts',carts); //update localStorage.
			},

//always use this to remove a cart from a session. That way all the storage containers are empty
		removeCartFromSession : function(cartID)	{
			if(cartID)	{
				var carts = _app.vars.carts || this.dpsGet('app','carts') || [];
				carts.splice( $.inArray(cartID, carts), 1 );
				_app.model.destroy('cartDetail|'+cartID);
				this.dpsSet('app','carts',carts); //update localStorage.
				//support for browsers w/ localStorage disabled.
				if(!$.support.localStorage)	{
					_app.model.deleteCookie('cartid');
					}

				}
			else	{
				$('#globalMessaging').anymessage({'message':'In model.removeCartFromSession, no cartid passed','gMessage':true});
				}
			},

//gets the cart id.  carts are stored as an array.  the latest cart is always put on top of the array, which is what this returns.
//Check to see if it's already set. If not, request a new session via ajax.
		fetchCartID : function()	{
			var s = false;
//			_app.u.dump('BEGIN: model.fetchCartID');
			if(_app.vars._clientid == '1pc')	{
				s = _app.vars.cartID;
				}
			else	{
				var carts = _app.vars.carts || this.dpsGet('app','carts') || []; //will return an array.
				if(carts.length)	{
					s = carts[0]; //most recent carts are always added to the top of the stack.
					}
				else	{}
				}
			return s;
			}, //fetchCartID
	
/*
Returns T or F.
will check to see if the datapointer is already in the _app.data. (returns true)
if not, will check to see if data is in local storage and if so, save it to _app.data IF the data isn't too old. (returns true)
will return false if datapointer isn't in _app.data or local (or if it's too old).
*/
	
	
		fetchData : function(datapointer)	{
//			_app.u.dump("BEGIN model.fetchData.");
//			_app.u.dump(" -> datapointer = "+datapointer);
			var local;
			var r = false;
			var thisModel = this; //for keeping context in functions where 'this' is lost.
			var expires = datapointer == 'authAdminLogin' ? (60*60*24*15) : (60*60*24); //how old the data can be before we fetch new.
//checks to see if the request is already in _app.data. IMPORTANT to check if object is empty in case empty objects are put up for extending defaults (checkout)
			if(_app.data && !$.isEmptyObject(_app.data[datapointer]))	{
//				_app.u.dump(' -> data ['+datapointer+'] already in memory.');
				r = true;
				}


			if(!r)	{
				local = this.readLocal(datapointer,'session');
				if(!local)	{
//					_app.u.dump(" -> data not found in local. check session");
					local = this.readLocal(datapointer,'local')
					}
				if(local)	{
//					_app.u.dump(" -> data was found in either session or local");		
					if(local.ts)	{
						if((_app.u.epochNow() - local.ts) > expires)	{
							//_app.u.dump(" -> data is old. do not use it");
							r = false; // data is more than 24 hours old.
							}
						else	{
							_app.data[datapointer] = local;
							r = true;
							}
						}
					else	{
			//hhhmmm... data is in local, but no ts is set. better get new data.
						r = false;
						}
					}
				else	{
			//				_app.u.dump(' -> data not in memory or local storage.');
					}
				}
//			_app.u.dump("END fetchData for "+datapointer+". r = "+r);
			return r;
			}, //fetchData
	




/* functions for extending the controller (adding extensions and templates) */
	
	
	
			
//Gets executed fairly early in the init process. Starts the process of adding the extension.

		addExtensions : function(extObj)	{
//			_app.u.dump('BEGIN model.addExtensions');
//			_app.u.dump(extObj);
			var r = false; //what is returned. false if no extensions are loaded or the # of extensions
			if(typeof extObj == 'object')	{

//				_app.u.dump(' -> valid extension object containing '+extObj.length+' extensions');
				var L = extObj.length;
				r = L; //return the size of the extension object 
				for(var i = 0; i < L; i += 1) {
//					_app.u.dump(" -> i: "+i);
//namespace and filename are required for any extension.
					if(!extObj[i].namespace)	{
						if(extObj.callback && typeof extObj.callback == 'string')	{
							extObj[i].callback.onError("Extension did not load because namespace ["+extObj[i].namespace+"] not set",'')
							}
						_app.u.dump(" -> extension did not load because namespace ("+extObj[i].namespace+") was left blank.");
						continue; //go to next index in loop.
						}
					else if (typeof window[extObj[i].namespace] == 'function')	{
//						_app.u.dump(" -> extension already loaded. namespace: "+extObj[i].namespace);
						var errors = this.loadAndVerifyExtension(extObj[i]);
						//extension has already been imported. Here for cases where extensions are added as part of preloader (init.js)
						}
					else	{
						if(!extObj[i].filename){
							_app.u.dump(" -> extension did not load because filename ("+extObj[i].filename+") was left blank.");
							_app.u.dump(extObj[i]);
							}
						else {
//							_app.u.dump(" -> fetch extension: "+extObj[i].namespace);
							this.fetchExtension(extObj[i],i);
							}
						}
					} // end loop.
				this.executeCallbacksWhenExtensionsAreReady(extObj); //reexecutes itself. will execute callbacks when all extensions are loaded.
				}
			else	{
				_app.u.dump("CAUTION! no extensions were loaded. This may not be an error. there may not be any extensions. seems unlikely though.");
				}
			
			return r;
//			_app.u.dump('END model.addExtension');
			},	
	
	
	
//$templateSpec = the jquery obj for the template.
//templateID is how the template will be referenced in _app.templates.
		makeTemplate : function($templateSpec,templateID)	{
			var r = true; //what is returned. if a template is created, true is returned.
			if(templateID && $templateSpec)	{
				if($templateSpec instanceof jQuery)	{}
				else{
					$templateSpec = $($templateSpec);
					}
				
				_app.templates[templateID] = $templateSpec.attr('data-templateid',templateID).clone(true); //events needs to be copied from original
				_app.templates[templateID].removeAttr('id'); //get rid of the ID to reduce likelyhood of duplicate ID's on the DOM.
				$('#'+templateID).empty().remove(); //here for templates created from existing DOM elements. They're removed to ensure no duplicate ID's exist.
				
				for(var i in _app.templateEvents){
					if(_app.templateEvents[i].filterFunc(templateID)){
						_app.templates[templateID].on(_app.templateEvents[i].event, _app.templateEvents[i].handler);
						}
					}
				
				}
			else	{
				r = false;
				_app.u.dump("WARNING! - model.makeTemplate executed but no templateID and/or template object specified.");
				}
			return r;
			},
	
//pass in an array of template id's and they'll get added to the _app.templates object.
//the id's must already be in the DOM by this point.
		loadTemplates : function(templates)	{
	//		_app.u.dump("BEGIN model.loadTemplates")
			var L = templates.length
	
	//		_app.u.dump("model.loadTemplates for "+namespace);
			var errors = ''; //what is returned.  if not false, errors are present (and returned)
			var templateID; //used for a quick reference to which id in the loop is in focus.
			var $templateSpec; //used to store the template/spec itself for the template.
	//		_app.u.dump(" -> loading "+L+" templates ");
			for(var i = 0; i < L; i += 1)	{
				templateID = templates[i];
				$templateSpec = $('#'+templateID);
	//			_app.u.dump(" -> templateID: "+templateID);
				if($templateSpec.length < 1)	{
					errors += "<li>Template '"+templateID+"' is not defined in the view<\/li>";
					}
				else	{
					this.makeTemplate($templateSpec,templateID);
					}
				$templateSpec.empty(); //ensure previous spec isn't used on next iteration.
				}
// * 201320 -> consoles based error reporting to help track these down.
			if(errors)	{
				_app.u.dump("Some templates were not found. "+errors,'error');
				}
			return errors;
			},


//templateURL is the .html file that contains the templates. be cautions about loading http: from a secure page.
//templates is an array of element id's that are present in the .html file.
//an ajax request is made to load the .html file and, if successful, the templates are loaded into _app.templates.

		fetchNLoadTemplates : function(templateURL,callback)	{
			callback = callback || function(){};
//			_app.u.dump("BEGIN model.fetchNLoadTemplates");
//			_app.u.dump(" -> templateURL: "+templateURL);
	//		_app.u.dump(" -> templates: "+templates);
			var ajaxRequest = $.ajax({
					type: "GET",
					statusCode: {
						404: function() {
							_app.u.dump("An attempt was made to fetch templates from "+templateURL+" but that URL returned a 404 error (file does not exist).","error");
							}
						},
					url: templateURL+"?_v="+_app.vars.release,
					async: false,
					dataType:"html"
					});	//this.fetchFileViaAjax(templateURL);
			
			ajaxRequest.error(function(d,e,f){
				// the templates not loading is pretty much a catastrophic issue.
				_app.u.throwMessage("An error has occured.<br \/>Unable to load remote templates for extension (dev - see console for more details).<br \/>If the error persists, please contact Zoovy technical support.",true);			
				_app.u.dump("ERROR! unable to load remote templates");
				_app.u.dump("templateURL: "+templateURL);
				_app.u.dump(e);
				_app.u.dump(d.statusText);
				});
	
			ajaxRequest.success(function(data){
				var $templateFile = $('<div/>');
				$templateFile.html(data);
				$('[id]',$templateFile).each(function(){
					_app.model.makeTemplate($(this), $(this).attr('id'));
					});
				_app.templateFiles.push(templateURL);
				callback();
				});
			return ajaxRequest;
			}, //fetchNLoadTemplates 


			loadAndVerifyExtension : function(extObjItem)	{
				var url = extObjItem.filename;
				var namespace = extObjItem.namespace; //for easy reference.
				var errors = ""; // list of errors. what is returned
				var initPassed;
//the .js file for the extension contains a function matching the namespace used.
//the following line executes that function and saves the object returned to the control.
//this is essentially what makes the extension available for use.
//immediately after the data is loaded into the control, the extension.namespace.callbacks.init is run.  This is where any system settings should be checked/reported.
//data is saved to the control prior to template/view verification because we need access to the object.
//yes, technically we could have saved it to a var, accessed the templates param, validated and NOT saved, but this is lighter.
//it means that a developer could use an extension that didn't load properly, but that is their perogative, since we told them its broke.
				if(!(_app.ext[namespace] instanceof Array) && typeof _app.ext[namespace] === 'object'){
					//already instantiated, so we'll just sit on our hands
					initPassed = true;
					}
				else if(typeof window[namespace] === 'function')	{
					var couplerArray = _app.ext[namespace];
					couplerArray.splice(0,1);
					_app.ext[namespace] = window[namespace](_app); //keep this as early in the process as possible so it's done before the next extension loads.


					var callback = extObjItem.callback; //for easy reference.
	//						_app.u.dump(" -> typeof callback: "+typeof callback);
					if(typeof _app.ext[namespace].callbacks.init === 'object')	{
	//							_app.u.dump(" typeof === object");
						initPassed = _app.ext[namespace].callbacks.init.onSuccess(); //returns t/f
	//							_app.u.dump(" -> "+namespace+" onSuccess response = "+initPassed);
						}
					else	{
	//no init was set in extension.  Init handles dependencies and should be present. For now, we'll trust that the developer had a good reason for not having an init and continue.
						_app.u.dump("WARNING: extension "+namespace+" did NOT have an init. This is very bad.");
						errors += "<li>init not set for extension "+namespace;
						}
	//whether init passed or failed, load the templates. That way any errors that occur as a result of missing templates are also displayed.
	//If the extension sets willfetchmyowntemplates, then no need to run template load code, the extension will handle adding it's own templates.
	//						_app.u.dump(" -> templates.length = "+_app.ext[namespace].vars.templates.length);
					
					for(var i in couplerArray){
						var coupler = couplerArray[i];
						_app.couple(namespace,coupler[0],coupler[1]);
						}
			//No longer automatically fetching templates, gotta do it manually (and the lazy way!)
					//if(_app.ext[namespace].vars && _app.ext[namespace].vars.templates && !_app.ext[namespace].vars.willFetchMyOwnTemplates)	{
					//	errors += this.loadTemplates(_app.ext[namespace].vars.templates);
					//	}
					//else	{
	//				//			_app.u.dump("WARNING: extension "+namespace+" did not define any templates. This 'may' valid, as some extensions may have no templates.");
					//	}

					}
				else	{
					initPassed = false;
					errors += "window."+namespace+" does not exist, probably a mismatch between namespace declared in extension and init."
					}


/*
now we know whether the extension properly loaded, had and executed an init and has a callback.
respond accordingly.
*/

				if(initPassed == false)	{
					_app.u.throwMessage("Uh Oh! Something went wrong with our _app. We apologize for any inconvenience. (err: "+namespace+" extension did not pass init)<br><b>Error(s):<\/b><br>"+errors,true);
					}
//errors would be populated if, say, no init is set.
				else if(errors)	{
					_app.u.dump(" -> extension contained errors. callback not executed yet.");
					_app.u.dump(" -> "+errors);
					_app.u.throwMessage("Extension "+namespace+" contains the following error(s):<ul>"+errors+"<\/ul>",true);

//the line above handles the errors. however, in some cases a template may want additional error handling so the errors are passed in to the onError callback.
					if(_app.ext[namespace].callbacks.onError)	{
//								_app.u.dump(" -> executing callback.onError.");
						_app.ext[namespace].callbacks.onError("<div>Extension "+namespace+" contains the following error(s):<ul>"+errors+"<\/ul><\/div>",'');
						}							
					}
				else	{
//							_app.u.dump(" -> extension "+namespace+" loaded fine but contained no callback");
					}

				},

/*
extensions are like plugins. They are self-contained* objects that may include calls, callbacks, utitity functions and/or variables.
the extension object passed in looks like so:

[
{"namespace":"order_create","extension":"checkout/extension.js","callback":"init"},
{"namespace":"name","extension":"filename","callback":"optional"}
]

*	typically, there will be 'one extension to bind them all'. this extension is less-self-contained. 
	It'll include dependencies and the list of templates used.

namespace - the extension is saved to _app.ext.namespace and would be 'called' using that name. (_app.ext.namespace.calls.somecall.init()
extension - the filename. full path.
callback - a function to be executed once the extension is done loading.

the 'order_create' namespace is reserved for checkout. only 1 checkout extension can be loaded at a time.
use a unique naming convention for any custom extensions, such as username_someusefulhint (ex: cubworld_jerseybuilder)

The ajax request itself (fetchExtension) was originally in the addExtension function in the loop.  This caused issues.
only one extension was getting loaded, but it got loaded for each iteration in the loop. even with async turned off.

*/
		
		fetchExtension : function(extObjItem, callback)	{
			//_app.u.dump('BEGIN model.fetchExtention ['+extObjItem.namespace+']');
			//_app.u.dump(extObjItem);
			callback = callback || function(){};
			var errors = '';
			var url = extObjItem.filename+"?_v="+_app.vars.release;
			var namespace = extObjItem.namespace; //for easy reference.
//			_app.u.dump(' -> url = '+url);
		
			var ajaxLoadExt = $.ajax({
				url: url,
///				async: 0, //testing... 
				dataType: 'script',
				statusCode: {
					404: function() {
						_app.u.dump("An attempt was made to fetch an extension from "+url+" but that URL returned a 404 error (file does not exist).","error");
						}
					},
				success: function(data) {
	//The 'success' can be executed prior to the script finishing loading so the heavy lifting happens in 'complete'.
//					_app.u.dump(" -> EXTCONTROL Got to success");
					},
				complete: function(data)	{
//					_app.u.dump(" -> EXTCONTROL got to complete for "+namespace);
//					_app.u.dump(" -> status = "+data.statusText);
//hhhhmmm... was originally just checking success. now it checks success and OK (2011-01-11). probably need to improve this at some point.
					if(data.statusText == 'success' || data.statusText == 'OK')	{
//						_app.u.dump(" -> adding extension to controller");
						errors = _app.model.loadAndVerifyExtension(extObjItem);
						callback();
						}
					},
				error: function(a,b,c) {
					var msg = _app.u.errMsgObject("Oops! It appears something went wrong with our _app. If error persists, please contact the site administrator.<br \/>(error: ext "+extObjItem.namespace+" had error type "+b+")",123);
					msg.persistent = true;
					_app.u.throwMessage(msg);
					_app.u.dump(a);
					_app.u.dump(" -> EXTCONTROL ("+namespace+")Got to error. error type = "+b+" c = ");
					_app.u.dump(c);
					}
				});
			},

		executeExtensionCallback : function(namespace,callback)	{
			if(namespace && callback)	{
				if(typeof callback == 'function'){callback()}
				else if(typeof callback == 'string' && typeof _app.ext[namespace] == 'object' && typeof _app.ext[namespace].callbacks[callback] == 'object')	{
					_app.ext[namespace].callbacks[callback].onSuccess()
					}
				else if(typeof callback == 'string')	{
					$('#globalMessaging').anymessage({"message":"A callback was defined for extension "+namespace+" but it could not be loaded.<br \/>Dev: see console for details"});
					_app.u.dump("Callback ["+callback+"] defined for namespace: "+namespace+" but something went wrong",'warn');
					_app.u.dump(" -> typeof _app.ext[namespace]: "+typeof _app.ext[namespace]+" (should be object)");
					if(typeof _app.ext[namespace] == 'object')	{_app.u.dump(" -> typeof _app.ext[namespace].callbacks[callback]"+typeof _app.ext[namespace].callbacks[callback])+" (should be function)"}
					}
				else	{_app.u.dump("!Unknown type ["+typeof callback+"] for extension callback ");}
				}
			else	{
				_app.u.dump("WARNING!  either namespace ["+namespace+"] or callback ["+callback+"] was undefined in model.executeExtensionCallback");
				}
			}, //executeExtensionCallback


//verifies that all the templates for a given extension/namespace have been loaded.
		allTemplatesForThisExtensionHaveLoaded : function(namespace)	{
//			_app.u.dump("BEGIN model.allTemplatesForThisExtensionHaveLoaded ["+namespace+"]");
			var r = true; //what is returned. t/f based on whether or not all the templates extensions have loaded.
			var templateID; //shortcut.
			if(_app.ext[namespace].vars && _app.ext[namespace].vars.templates)	{
				var L = _app.ext[namespace].vars.templates.length;
//				_app.u.dump(" -> L: "+L);
				for(var i = 0; i < L; i += 1)	{
					templateID = _app.ext[namespace].vars.templates[i];
					if(typeof _app.templates[templateID] != 'object'){r = false}
					}
				}
//			_app.u.dump("END model.allTemplatesForThisExtensionHaveLoaded ["+r+"]");
			return r;
			}, //allTemplatesForThisExtensionHaveLoaded

/*
loop through control. object and make sure all the extensions have completely loaded.
This is checks for two things:
1. is the namespace set in the control object.
2. are all the templates for each extension loaded.
*/

		allExtensionsHaveLoaded : function(extObj)	{
//			_app.u.dump("BEGIN model.allExtensionsHaveLoaded. extObj: "); _app.u.dump(extObj);

			var r = true; //what is returned (whether or not all extensions have loaded.
			var L = extObj.length;
//			_app.u.dump(" -> L: "+L);
			var namespace; //shortcut.
			for(var i = 0; i < L; i += 1) {
				namespace = extObj[i].namespace;
				if(typeof _app.ext[namespace] == 'object')	{
					if(!this.allTemplatesForThisExtensionHaveLoaded(namespace)){
						r = false;
						break;
						}
					}
				else	{
					if(_app.vars.debug == 'init')	{
						_app.u.dump(' -> waiting on: '+namespace);
						}
					r = false;
					break;
					}
				}
//			_app.u.dump("END model.allExtensionsHaveLoaded ["+r+"]");
			return r;
			}, //allExtensionsHaveLoaded
		
//function gets executed in addExtensions. If the extensions are loaded, it'll execute the callbacks.
// if not, it will re-execute itself.
		executeCallbacksWhenExtensionsAreReady : function(extObj,attempts){
//			_app.u.dump("BEGIN model.executeCallbacksWhenExtensionsAreReady [length: "+extObj.length+"]");
			if(this.allExtensionsHaveLoaded(extObj))	{
//				_app.u.dump("extension(s) loaded. execute callbacks.");
				var L = extObj.length;
				for(var i = 0; i < L; i += 1) {
//					_app.u.dump(" -> i: "+i);
//namespace and filename are required for any extension.
					if(extObj[i].callback)	{
						this.executeExtensionCallback(extObj[i].namespace,extObj[i].callback);
						}
					else	{
						//no callback defined. no worries.
						}
					} // end loop.
				}
			else if(attempts > 100)	{
				//that is a lot of tries.
				throwMessage(_app.u.errMsgObject("It appears that some files were unable to load. This could be a problem with the app OR due to a slow PC or internet connection."));
				}
			else	{
				setTimeout(function(){_app.model.executeCallbacksWhenExtensionsAreReady(extObj,attempts)},250);
				}
			attempts++;
			}, //executeCallbacksWhenExtensionsAreReady
		
//setHeader always gets run, but the admin headers are only added if the global admin var is true.
// if set to true and in a non-admin mode, won't hurt anything, but is less clean.
//these are whitelisted server side. add anything non supported and comatibility mode calls will die a most horrible death.
		setHeader : function(xhr){
			if(_app.u.thisIsAnAdminSession())	{
				xhr.setRequestHeader('x-clientid',_app.vars._clientid); //set by app
				xhr.setRequestHeader('x-session',_app.vars._session); //set by _app. 
				xhr.setRequestHeader('x-domain',_app.vars.domain); //what domain is in focus. set by app or user
				xhr.setRequestHeader('x-userid',_app.vars.userid); //what account is in focus. provided by user/ stored locally.
				xhr.setRequestHeader('x-deviceid',_app.vars.deviceid); //the specific device making the requests. stored locally.
				xhr.setRequestHeader('x-authtoken',_app.vars.authtoken); //returned by API
				xhr.setRequestHeader('x-version',this.version); //set by app
				}
			},
		

/*
ADMIN/USER INTERFACE
*/		

//path is a relative path (/biz/setup/index.cgi) for a page in the UI.
//viewObj.targetID is where the html gets placed.
//viewObj.success can be a function to get executed on success.
//viewObj.error can be a function to get executed on error.
//data2Pass gets passed along on the request. it's optional. a serialized form object, for example.
		fetchAdminResource : function(path,viewObj,data2Pass)	{
		
			var pathParts = path.split('?'); //pathParts[0] = /biz/setup and pathParts[1] = key=value&anotherkey=anothervalue (uri params);
//make sure to pass data2pass last so that the contents of it get preference (duplicate vars will be overwritten by whats in data)
//this is important because data is typically a form input and may have a verb or action set that is different than what's in the pathParts URI params
			var data = $.extend(_app.u.kvp2Array(pathParts[1]),data2Pass); //getParamsfunction wants ? in string.

//			var URL = (document.domain.indexOf('anycommerce') > -1) ?  "https://www.anycommerce.com" : "https://www.zoovy.com";
//			URL += pathParts[0]; //once live, won't need the full path, but necessary for testing purposes.
			
			if(!$.isEmptyObject(_app.ext.admin.vars.uiRequest))	{
				_app.u.dump("request in progress. Aborting.");
				_app.ext.admin.vars.uiRequest.abort(); //kill any exists requests. The nature of these calls is one at a time.
				}


			var cmdObj = {
				_cmd : 'adminUIExecuteCGI',
				uri : path,
				'_tag' : {
					datapointer : 'adminUIExecuteCGI',
					callback : function(rd)	{
						if(_app.model.responseHasErrors(rd)){_app.u.throwMessage(rd);}
						else	{
							_app.ext.admin.u.uiHandleContentUpdate(path,_app.data[rd.datapointer],viewObj)
							_app.ext.admin.vars.uiRequest = {} //reset request container to easily determine if another request is in progress
							}
						}
					}
				};
			if(!$.isEmptyObject(data)) {cmdObj['%vars'] = data} //only pass vars if present. would be a form post.
			this.addDispatchToQ(cmdObj,'mutable');
			this.dispatchThis('mutable');
			},


/*

methods of getting data from non-server side sources, such as cookies, local or session storage.

*/

//location should be set to 'session' or 'local'.
// WARNING! -> any changes to writeLocal should be tested in IE8 right away.
		writeLocal : function (key,value,location)	{
			location = location || 'local';
			var r = false;
			if($.support[location+'Storage'])	{
				r = true;
				if (typeof value == "object") {value = JSON.stringify(value);}
//a try is used here so that if storage is full, the error is handled gracefully.
				try	{
					window[location+'Storage'].setItem(key, value);
					}
				catch(e)	{
					r = false;
					_app.u.dump(' -> '+location+'Storage [key: '+key+'] defined but not available.');
					_app.u.dump(e.message);
					}
				}
			else	{
				_app.u.dump("in writeLocal for key ["+key+"], check for $.support."+location+"Storage returned: "+$.support[location+'Storage']);
				}
			return r;
			}, //writeLocal

		nukeLocal : function(key,location)	{
//			_app.u.dump("BEGIN nukeLocal for "+key+" in "+location+"Storage");
			if($.support[location+'Storage'])	{
				if(typeof window[location+'Storage'] == 'object' && typeof window[location+'Storage'].removeItem == 'function')	{
					try	{
						window[location+'Storage'].removeItem(key);
						}
					catch(e)	{
						_app.u.dump("The attempt to run window."+location+"Storage.removeItem("+key+") failed. This occured after the $.support for that storage method. The catch error follows:"); _app.u.dump(e);
						}
					}
				}
			else	{
				_app.u.dump("in nukeLocal for key ["+key+"], check for $.support."+location+"Storage returned: "+$.support[location+'Storage']);
				}
			},

// WARNING! -> any changes to readLocal should be tested in IE8 right away.
		readLocal : function(key,location)	{
			location = location || 'local';
			if(!$.support[location+'Storage'])	{
				return ''; //exit early is the storage mechanism isn't supported. return blank needed because getLocal is used to set vars in some if statements.
				}
			else	{
				var value = null;
				try{
					value = window[location+'Storage'].getItem(key);
					}
				catch(e)	{
					//_app.u.dump("Local storage does not appear to be available. e = ");
					//_app.u.dump(e);
					}
				if(value == null)	{
					return '';
					}
		// assume it is an object that has been stringified
				if(value && value[0] == "{") {
					value = JSON.parse(value);
					}
				return value
				}
			}, //readLocal
/*
A note about cookies:
	They're not particularly mobile friendly. All modern browsers support localStorage, even ie7 supports local/session storage, which is the main mechanism used by the model for persistent data storage.
	So the cookie functions are here (for now), but should probably be avoided.
	They are used to store the session ID if localStorage is disabled.
	Quickstart uses them to store the cartid.
*/
		readCookie : function(c_name){
			var i,x,y,ARRcookies=document.cookie.split(";");
			for (i=0;i<ARRcookies.length;i++)	{
				x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
				y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
				x=x.replace(/^\s+|\s+$/g,"");
				if (x==c_name)	{
					dump(" -> "+c_name +" cookie value: "+y);
					return unescape(y);
					}
				}
			return false;  //return false if not set.
			},

		writeCookie : function(c_name,value)	{
			var myDate = new Date();
			myDate.setTime(myDate.getTime()+(1*24*60*60*1000));
			document.cookie = c_name +"=" + value + ";expires=" + myDate + ";domain="+document.domain+";path=/";
			},
//deleting a cookie seems to cause lots of issues w/ iOS and some other mobile devices (where admin login is concerned, particularly. 
//test before earlier.
		deleteCookie : function(c_name)	{
			document.cookie = c_name+ "=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/";
			_app.u.dump(" -> DELETED cookie "+c_name);
			},



//Device Persistent Settings (DPS) Get  ### here for search purposes:   preferences settings localstorage
//false is returned if there are no matchings session vars.
//if no extension is passed, return the entire sesssion object (if it exists).
//this allows for one extension to read anothers preferences and use/change them.
//ns is an optional param. NameSpace. allows for nesting.
			dpsGet : function(ext,ns)	{
//				_app.u.dump(" <<<<< DPS GET. ext: "+ext+" and ns: "+ns+" >>>>>");
				var r = false, DPS = this.readLocal('dps','local') || {};
//				_app.u.dump("DPS from local: "); _app.u.dump(DPS);
				if($.isEmptyObject(DPS))	{
					_app.u.dump(" ^^ Entire 'DPS' object is empty.");
					// if nothing is local, no work to do. this allows an early exit.
					} 
				else	{
					if(ext && DPS[ext] && ns)	{r = DPS[ext][ns]} //an extension and namespace were passed and an object exists.
					else if(ext && DPS[ext])	{r = DPS[ext]} //an extension was passed and an object exists.
					else if(!ext)	{r = DPS} //return the global object. obj existing is already known by here.
					else	{} //could get here if ext passed but obj.ext doesn't exist.
//					_app.u.dump(" ^^ value for DPS Get: "); _app.u.dump(r);
					}
//				_app.u.dump("DPS returned: "); _app.u.dump(r);
				return r;
				},

//Device Persistent Storage (DPS) Set
//For updating preferences, which are currently device specific.
//Uses local storage
//for instance, in orders, what were the most recently selected filter criteria.
//ext and namespace (ns) are required. reduces likelyhood of nuking entire preferences object.
			dpsSet : function(ext,ns,varObj)	{
				var r = false; //what is returned.
				if(ext && ns && (varObj || varObj == 0))	{
					var DPS = this.readLocal('dps','local') || {}; //readLocal returns false if no data local.
					if(typeof DPS[ext] === 'object'){
						DPS[ext][ns] = varObj;
						}
					else	{
						DPS[ext] = {}; //each dataset in the extension gets a NameSpace. ex: orders.panelState
						DPS[ext][ns] = varObj;
						} //object  exists already. update it.
//SANITY -> can't extend, must overwrite. otherwise, turning things 'off' gets obscene.					
					r = this.writeLocal('dps',DPS,'local');
					}
				else	{
					_app.u.throwGMessage("Either extension ["+ext+"] or ns["+ns+"] or varObj ["+(typeof varObj)+"] not passed into admin.u.dpsSet.");
					}
				return r;
				},

//			getGrammar : function(url)	{
//				$.ajax({
//					'url' : url + (url.indexOf('?') >= 0 ? '' : '?') + 'release='+_app.vars.release, //append release to eliminate caching on new releases.
//					'dataType' : 'html',
//					'error' : function()	{
//						$('#globalMessaging').anymessage({'errtype':'fail-fatal','message':'An error occured while attempting to load the grammar file. See console for details. The rendering engine will not run without that file.'});
//						},
//					'success' : function(file){
//						var success;
//						try{
//							var pegParserSource = PEG.buildParser(file);
//							window.pegParser = eval(pegParserSource); //make sure pegParser is valid.
//							success = true;
//							}
//						catch(e)	{
//							_app.u.dump("Could not build pegParser.","warn");
//							_app.u.dump(buildErrorMessage(e),"error");
//							}
//						if(success)	{
//							_app.u.dump(" -> successfully built pegParser");
//							}
//						else	{
//							$('#globalMessaging').anymessage({'errtype':'fail-fatal','message':'The grammar file did not pass evaluation. It may contain errors (check console). The rendering engine will not run without that file.'});
//							}
//						}
//					})
//
//				}
			getGrammar : function(id){
				var script = $('#'+id).text();
				if(script){
				var success;
					try{
						var pegParserSource = PEG.buildParser(script);
						window.pegParser = eval(pegParserSource); //make sure pegParser is valid.
						success = true;
						}
					catch(e)	{
						_app.u.dump("Could not build pegParser.","warn");
						//_app.u.dump(buildErrorMessage(e),"error");
							_app.u.dump(e);
						}
					if(success)	{
						_app.u.dump(" -> successfully built pegParser");
						}
					else	{
							$('#globalMessaging').anymessage({'errtype':'fail-fatal','message':'The grammar file did not pass evaluation. It may contain errors (check console). The rendering engine will not run without that file. errors:<br>'});
						}
					}
				else {
					$('#globalMessaging').anymessage({'errtype':'fail-fatal','message':'An error occured while attempting to load the grammar script. See console for details. The rendering engine will not run without that script.'});
					}
				}



		}

	return r;
	}
