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
The view and the model should never speak to each other directly... other than maybe a button in the view executing myControl.model.dispatchThis().

There are two types of data being dealt with:
1. ajax request (referred to as request from here forward) for store data, such as product info, product lists, merchant info, etc.
2. extensions loaded as part of control object instantiation or on the fly as needed.

Some high level error handling occurs as part of the model, mostly for ISE's.
The rest is in the controller or extension. The model will execute callbacks.CALLBACKID.onError(d,uuid)
 -> d is the data object returned by the server. one of the few cases the raw response is returned.


execute the zoovyModel function from within the controller. ex:  myControl.model = zoovyModel();
 -> this will return an object into the myControl.model namespace. ex: myControl.model.dispatchThis()


There are currently three dispatch queues. (Q or DQ) which reside in myControl.q.
Each queue can be filled with several requests, then dispatched all at once.
that'll piggyback several dispatches on one request, which is considerably more efficient
than several requests.

q.passive - should only be used for requests with no callbacks or for requests that should never get cancelled by another, but are not strictly necessary.
For instance, if you wanted to retrieve product data for page
2 and 3 when the user is on page 1, you'd use passive. No action occurs as a results of getting this data.
Or if you have dispatches occur during your app init but are concerned they could get over-written by the immutable q (such as requests for site nav that you don't want nukd if the user is coming in to the app for checkout) then use passive.
the passive q requests are never aborted.

q.mutable - this is the bulk of your calls. Getting information and then doing something with it (executed from the callback). It is called mutable
because it can be muted. aka aborted. if an immutable request is sent, it will cancel all mutable requests. Likewise, the myControl.model.abortQ() function
will abort all mutable requests.  Use this when the users direction changes (they click page 1, then quickly click page 2 - you'd want to cancel the requests for 
page 1 so their callbacks are not executed).

q.immutable - use this sparingly, for 'mission critical' requests, such as add to cart, update cart and any requests during checkout.  Only 1 immutable request will fire at a time.
if any mutable requests are in process, they're cancelled. if an immutable request is in process and another request comes in (mutable or immutable), 
the secondary request is delayed till the first is done.


in some cases, you may use a mutable request for an add to cart so that the user can push it and move on with their experience. That's ok.
however, it is highly recommended that you only use the immutable q for checkout.

even though multiple dispatches can occur at the same time, it's still in your interest to pack the queue and dispatch at once.
it'll be faster with fewer dispatches.


myControl.ajax.overrideAttempts - keeps track of how many times a dispatch has attempted while another is in progress.
myControl.ajax.lastDispatch - keeps track of when the last dispatch occurs. Not currently used for much, but could allow for some auto-passive dispatches when idle.
*/

function zoovyModel() {
	var r = {
	
		version : "201228",
	// --------------------------- GENERAL USE FUNCTIONS --------------------------- \\
	
	//pass in a json object and the last item id is returned.
	//used in some of the fetchUUID function.
	// note that this is potentially a heavy function (depending on object size) and should be used sparingly.
		getLastIndex : function(obj) {
			var prop, r;
			for (prop in obj) {
				r = prop;
				}
			myControl.util.dump('END model.getLastIndex r = '+r);
			return r;
			}, //getLastIndex
	
	
//pass in a json object and how many tier1 nodes are returned. handy.

		countProperties : function(obj) {
		//	myControl.util.dump('BEGIN: countProperties');
		//	myControl.util.dump(obj);
			var prop;
			var propCount = 0;
			for (prop in obj) {
				propCount++;
				}
		//	myControl.util.dump('END: countProperties. count = '+propCount);
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
	_rtag.datapointer -> this is where in myControl.data the information returned will be saved to. 
	ex: datapointer:appProductGet|SKU would put product data into myControl.data['appProductGet|SKU']
	
	if no datapointer is passed, no data is returned in an accessable location for manipulation.
	 -> the only time the actual response is passed back to the control is if an error was present.
	
	*/
	
	
		addDispatchToQ : function(dispatch,QID) {
	//		myControl.util.dump('BEGIN: addDispatchToQ');
			var r; // return value.
			if(dispatch['_cmd'] == 'undefined')	{
				r = false;
	//			zSTdErr(' -> _cmd not set. return false');
				}
			else	{
				QID = QID === undefined ? 'mutable' : QID; //default to the mutable Q, but allow for PDQ to be passed in.
				var uuid = myControl.model.fetchUUID() //uuid is obtained, not passed in.
	
//				myControl.util.dump(' -> QID = '+QID);
//				myControl.util.dump(' -> UUID = '+uuid);
//				myControl.util.dump(" -> cmd = "+dispatch["_cmd"]);			
				dispatch["_uuid"] = uuid;
				dispatch["status"] = 'queued';
				dispatch["_v"] = 'zmvc:'+myControl.model.version+'.'+myControl.vars.release+';'+myControl.vars.passInDispatchV;
				dispatch["attempts"] = dispatch["attempts"] === undefined ? 0 : dispatch["attempts"];
				myControl.q[QID][uuid] = dispatch;
				r = uuid;
				}
	
	//		myControl.util.dump('//END: addDispatchToQ. uuid = '+uuid);
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
				myControl.q[QID][UUID].status = STATUS;
				}
			return r;
			},
	
//used during dispatchThis to make sure only queued items are dispatched.
//returns items for the Q and sets status to 'requesting'.
//returns items in reverse order, so the dispatches occur as FIFO.
//in the actual DQ, the item id is the uuid. Here that gets dropped and the object id's start at zero (more friendly format for B).
		filterQ : function(QID)	{
//			myControl.util.dump("BEGIN: filterQ");
//			myControl.util.dump(" -> QID = "+QID);
			
			var c = 0; //used to count how many dispatches are going into q. allows a 'break' if too many are present. not currently added.
			var myQ = new Array();
	//go through this backwards so that as items are removed, the changing .length is not impacting any items index that hasn't already been iterated through. 
			for(var index in myControl.q[QID]) {
//				myControl.util.dump(" -> CMD: "+myControl.q[QID][index]['_cmd']);
				if(myControl.q[QID][index].status == 'queued')	{
					myControl.q[QID][index]['status'] = "requesting";
					myQ.push(myControl.q[QID][index]);
					c += 1;
//added on 2012-02-23
					if(c > myControl.ajax.numRequestsPerPipe){
						setTimeout("myControl.model.dispatchThis('"+QID+"');",500); //will fire off the remaining items in the q shortly.
						break //max of 100 dispatches at a time.
						}
					}
				}
//			myControl.util.dump("//END: filterQ. myQ length = "+myQ.length+" c = "+c);
			return myQ;
			}, //filterQ
		
//execute this function in the app itself when a request is/may be in progrees and the user changes course.
//for instance, if the user does a search for 'sho' then corrects to 'shoe' prior to the request being completed,
//you'd want to abort the request in favor of the new command (you would want a callback executed on 'sho', so cancel it).
//for this reason, the passive q requests should NEVER have callbacks on them.
//and tho technically you 'could' pass immutable as the QID, you should never cancel an immutable request, as these should be saved for 'add to cart' or 'checkout' requests.
		abortQ : function(QID)	{
			myControl.util.dump("SANITY -> abortq is being run on "+QID); //output this so that when the red cancelled request shows in the console, we know why.
			myControl.ajax.overrideAttempts = 0;  //the q is being reset essentially. this needs to be reset to zero so attempts starts over. 
			var r = 0; //incremented with each cancelled request. returned.
			for(var index in myControl.ajax.requests[QID])	{
				myControl.ajax.requests[QID][index].abort();
//IMPORTANT
//this delete removes the ajax request from the requests array. keep that array only full of active requests.
				delete myControl.ajax.requests[QID][index];
				r +=1;
				}
//			myControl.ajax.requests.mutable = {}; //probably not needed since we're deleting these individually above. add back if needed.
			return r;
			},

/* ### untested. unused.
		abortAllRequests : function()	{
			for(index in myControl.q)	{
				myControl.util.dump("ABORTING all requests in "+index);
				this.abortQ(myControl.q[index])
				}
			},
*/
//if a request is in progress and a immutable request is made, execute this function which will change the status's of the uuid(s) in question.
//function is also run when model.abortQ is executed.
//don't need a QID because only the general dispatchQ gets muted... for now. ### add support for multiple qids
		handleDualRequests : function()	{
			var inc = 0;
	//		myControl.util.dump('BEGIN model.handleDualRequests');		
			for(var index in myControl.q.mutable) {
				if(myControl.q.mutable[index].status == 'requesting')	{
					myControl.model.changeDispatchStatusInQ('mutable',index,"muted"); //the task was dominated by another request
					inc += 1;
					}
				}
			return inc;
	//		myControl.util.dump('END model.handleDualRequests. '+inc+' requests set to overriden');
			},

//when an immutable request is in process, this is called which handles the re-attempts.
		handleReDispatch : function(QID)	{
			if(myControl.ajax.overrideAttempts < 25)	{
				setTimeout("myControl.model.dispatchThis('"+QID+"')",750); //try again soon. if the first attempt is still in progress, this code block will get re-executed till it succeeds.
				}
			else if(myControl.ajax.overrideAttempts < 100)	{
// slow down a bit. try every second for a bit and see if the last response has completed.
				setTimeout("myControl.model.dispatchThis('"+QID+"')",1250); //try again soon. if the first attempt is still in progress, this code block will get re-executed till it succeeds.
				}
			else	{
				myControl.util.dump(' -> stopped trying to override because many attempts were already made.');
				}			
			},
			
//executed in control init.
//will set some vars used for each ajax request.
//uses json request UNLESS browser is not compatible with XSS.
//currently, only IE isn't compatible.
		whatAjaxDataType2Use : function()	{
			var r = 'json'; //what is returned. default datatype is json.
// SANITY - a browser treats http://www.something.com and http://something.com as separate domains.
			if(navigator.appName == 'Microsoft Internet Explorer' && Number(jQuery.browser.version) < 10)	{
				var rootUrl = window.location.href.match(/:\/\/(.[^/]+)/)[1]; //root domain of current page (www.something.com)
				var JQUrl = myControl.vars.jqurl.match(/:\/\/(.[^/]+)/)[1]; //root domain of jquery url (www.something.com or www.somethingelse.com)
				if(JQUrl != rootUrl)	{
					r = 'jsonp';
					}
				}
			return r;
			},
		
		
		ieBlows : function(d){
			
			},

/*
	
sends dispatches with status of 'queued' in a single json request.
only high-level errors are handled here, such as an ISE returned from server, no connection, etc.
a successful request executes handleresponse (handleresponse executes the controller.response.success action)
note - a successful request just means that contact with the server was made. it does not mean the request itself didn't return errors.

QID = Queue ID.  Defaults to the general dispatchQ but allows for the PDQ to be used.

*/
	
		dispatchThis : function(QID)	{
//			myControl.util.dump('BEGIN model.dispatchThis');
			var r = true; //set to false if no dispatch occurs. return value.
			QID = QID === undefined ? 'mutable' : QID; //default to the general Q, but allow for priorityQ to be passed in.
//			myControl.util.dump(' -> Focus Q = '+QID);

//by doing our filter first, we can see if there is even anything to BE dispatched before checking for conflicts.
//this decreases the likelyhood well set a timeout when not needed.
			var Q = myControl.model.filterQ(QID); //filters out all non-queued dispatches. may set a limit to the # of dispatches too. 
			
			
			var immutableRequestInProgress = $.isEmptyObject(myControl.ajax.requests.immutable) ? false : true; //if empty, no request is in progress.
			var L = Q.length; //size of Q.
//			myControl.util.dump(" -> Q.length = "+Q.length);
//			myControl.util.dump("QID = "+QID+" and L = "+L+" and aRequestIsInProgress = "+aRequestIsInProgress);
			
			if(L == 0)	{
//				myControl.util.dump(" -> dispatch attempted, but q referenced has no 'queued' dispatches. Do nothing.");
				r = false; //nothing to dispatch.
				}
			else if(immutableRequestInProgress)	{
//				myControl.util.dump(" -> immutable dispatch in process. do NOT override. try again soon.");

				myControl.ajax.overrideAttempts += 1; //tracks how many times the request in progress has been attempted to be usurped.
				this.handleReQ(Q,QID);//changes status back to 'queued'  q.uuid.attempts not incremented (only increment only for requests that failed)

				this.handleReDispatch(QID); //does the set timeout to relaunch, if needed.
				r = false; //not moving forward with a dispatch because the one in process has priority.
				}
// commented out on 2012/07/13. no longer aborting any Q unless app does it.
//			else if(QID == 'immutable')	{
//				myControl.util.dump(" -> immutable request. no immutable's in progress. cancel any mutables and proceed with dispatch.");
//				this.abortQ('mutable'); // aborts request. should only send 1 request at a time. empties 
//				myControl.model.handleDualRequests(); //update status on the DQ items that just got aborted
//				}
			else	{
//				myControl.util.dump(" -> DQ has queued dispatches. no request in process. Move along... Move along...");
				}
				
/*
Should only reach this point IF no PRIORITY dispatch running.
set control var so that if another request is made while this one is executing, we know whether or not this one is priority.
the var also gets used in the handleresponse functions to know which q to look in for callbacks.
don't move this. if it goes before some other checks, it'll resed the Qinuse var before it's checked.
*/
			
			if(r)	{
//used as the uuid on the 'parent' request (the one containing the pipelines).
//also used for ajax.requests[QID][UUID] which stores the ajax request itself (and is used for aborting later, if need be).
				var UUID = myControl.model.fetchUUID(); 
				
//only change the Qinuse var IF we are doing a dispatch. otherwise when the value is used later, it'll be pointing at the wrong Q.	
//this var is used to reference whether the q in use is immutable or not. Never use this during handleResponse or anywhere else.
//it is constantly being overwritten, emptied, etc and by the time handle_response is running, another request could occur using a different Q
//and your code breaks.

//				myControl.util.dump(' -> Q In Use is '+QID);
//				myControl.util.dump(' -> Q = ');
//				myControl.util.dump(Q);
//				myControl.util.dump("ajax URL: "+myControl.vars.jqurl);

//if this point is reached, we are exeuting a dispatch. Any vars used for tracking overrides, last dispatch, etc get reset.

myControl.ajax.lastDispatch = myControl.util.unixNow();
myControl.ajax.overrideAttempts = 0;


//IMPORTANT
/*

IE < 10 doesn't support xss. the check is done during the init. for xss in IE < 10, jsonp requests are used.
jsonp requests must use a GET. To keep the URL to a reasonable length, some fat is trimmed (_tag, specifically) and re-added in handleResponse

the delete in the success AND error callbacks removes the ajax request from the requests array. 
If this isn't done, attempts to see if an immutable or other request is in process will return inaccurate results. 
must be run before handleResponse so that if handleresponse executes any requests as part of a callback, no conflicts arise.
can't be added to a 'complete' because the complete callback gets executed after the success or error callback.
*/


if(myControl.ajax.dataType == 'jsonp')	{
	myControl.util.dump("NOTE - JSONP request(s). # requests: "+L+" QID: "+QID);
//a pipelined request with any substance is likely going to have too long of a URL to work.  
//so for jsonp, pipelined requests are not used and each request is sent individually. 
	for(var i = 0; i < L; i += 1)	{
//		myControl.util.dump(Q2);
		this.jsonpRequest(Q[i])
		}
	}
else	{
	myControl.ajax.requests[QID][UUID] = $.ajax({
		type: "POST",
		url: myControl.vars.jqurl,
		context : myControl,
		async: true,
		contentType : "text/json",
		dataType:"json",
		data: JSON.stringify({"_uuid":UUID,"_zjsid": myControl.sessionId,"_cmd":"pipeline","@cmds":Q})
		});
	myControl.ajax.requests[QID][UUID].error(function(j, textStatus, errorThrown)	{
		myControl.util.dump(' -> REQUEST FAILURE! Request returned high-level errors or did not request: textStatus = '+textStatus+' errorThrown = '+errorThrown);
		delete myControl.ajax.requests[QID][UUID];
		myControl.model.handleReQ(Q,QID,true); //true will increment 'attempts' for the uuid so only three attempts are made.
		setTimeout("myControl.model.dispatchThis('"+QID+"')",1000); //try again. a dispatch is only attempted three times before it errors out.
		});
	myControl.ajax.requests[QID][UUID].success(function(d)	{
		delete myControl.ajax.requests[QID][UUID];
		myControl.model.handleResponse(d);}
		)

	}


				}

		return r;
	//		myControl.util.dump('//END dispatchThis');
		}, //dispatchThis
	
	
	jsonpRequest : function(DISPATCH)	{
		myControl.util.dump("BEGIN model.jsonpRequest ["+DISPATCH['_uuid']+"]");
//		myControl.util.dump(DISPATCH);
		var thisReq; //the request object. what is returned.
		var UUID = DISPATCH['_uuid'];
		var thisDispatch = $.extend(true,{},DISPATCH); //need a un-referenced copy (clone) so when attributes are deleted, the original is not modified.
		var QID = this.whichQAmIFrom(UUID); //look this up instead of passing it in. the req is async so the val of a referenced var could be changed before the .complete
		
		thisDispatch['_zjsid'] = myControl.sessionId; // since each request is being sent individually, need to add the session id.
		thisDispatch['_tag'] = ""; //need to keep the uri short. _rtag re-added during handleResponse
		thisDispatch['_v'] = this.version; //need to keep the uri short.
//		myControl.util.dump(thisDispatch);
		var thisJsonURL = myControl.vars.jqurl+"?_callback=ieBlows&_json="+encodeURIComponent(JSON.stringify(thisDispatch));
		myControl.util.dump(" -> jsonURL: "+thisJsonURL);
//		myControl.util.dump(" -> length of url: "+thisJsonURL.length);
		thisReq = $.ajax({
			type: "GET",
			url: thisJsonURL,
			contentType : "text/json",
			dataType:"jsonp",
			jsonp : "callback",
			jsonpCallback:"ieBlows"
			});
// thisReq.success is handled through the ieBlows function.
		thisReq.error(function(j, textStatus, errorThrown)	{
			myControl.util.dump(' -> REQUEST ERROR! Request returned high-level errors or did not request: textStatus = '+textStatus+' errorThrown = '+errorThrown);
			myControl.util.dump(" -> REQUEST ERROR DISPATCH DETAILS: uuid: "+UUID+" and QID: "+QID+" and _cmd: "+DISPATCH['_cmd']);
//			myControl.util.dump(j);
			delete myControl.ajax.requests[QID][UUID];
// !!! NOTE - commented out three lines below for testing.
//			var Q = new Array(); Q.push(DISPATCH);
//			myControl.model.handleReQ(Q,QID,true); //true will increment 'attempts' for the uuid so only three attempts are made.
//			setTimeout("myControl.model.dispatchThis('"+QID+"')",1000); //try again. a dispatch is only attempted three times before it errors out.
			});

	
		return thisReq;
		},
	
	
		ieBlows : function(d) {
			
			myControl.util.dump(" -> Yes, IE does blow. ["+d['_uuid']+"] !!!!!!!!!!!!");
		//	myControl.util.dump(d);
			if(!$.isEmptyObject(d))	{
				var QID = myControl.model.whichQAmIFrom(d['_uuid']); 
				delete myControl.ajax.requests[QID][d['_uuid']];
				myControl.model.handleResponse(d);
				}
			else if(typeof d == 'object')	{
				myControl.util.dump(" -> UH OH! ieBlows executed but with an empty object.");
				}
			else	{
				myControl.util.dump(" -> UH OH! ieBlows executed but with an unknown paramter passed in.  d: "+d);
				}
			
			
			},
	
	/*
	run when a high-level error occurs during the request (ise, pagenotfound, etc).
	 -> sets dispatch status back to queued.
	 -> if attempts is already at 3, executed callback.onError code (if set).
	 
	the Q passed in is sometimes the 'already filtered' Q, not the entire dispatch Q. Makes for a smaller loop and only impacts these dispatches.
	also, when dispatchThis is run again, any newly added dispatches WILL get dispatched (if in the same Q).
	handleReQ is used in a few places. Sometimes you want to adjust the attempts (q.uuid.attempts) so that you max out after three (such as when a server error is returned in the response) and sometimes you don't want to adjust (such as when the q is adjusted because a priority dispatch was in progress).
	set adjustAttempts to true to increment by 1.
	*/
		handleReQ : function(Q,QID,adjustAttempts)	{
//			myControl.util.dump('BEGIN model.handleReQ.');
//			myControl.util.dump(' -> QID = '+QID);
//			myControl.util.dump(' -> Q.length = '+Q.length);
			var uuid,callbackObj;
	//execute callback error for each dispatch, if set.
			for(var index in Q) {
				uuid = Q[index]['_uuid'];
	//			myControl.util.dump('    -> uuid = '+uuid);
	//			myControl.util.dump('    -> attempts = '+myControl.q[QID][uuid].attempts);
	//			myControl.util.dump('    -> callback = '+Q[index]['_tag']['callback']);
	//			myControl.util.dump('    -> extension = '+Q[index]['_tag']['extension']);
				
	//once.  twice.  pheee times a mady....  stop trying after three attempts buckwheat!    
				if(myControl.q[QID][uuid].attempts >= 1)	{
//					myControl.util.dump(' -> uuid '+uuid+' has had multiple attempts. changing status to: cancelledDueToErrors');
					myControl.model.changeDispatchStatusInQ(QID,uuid,'cancelledDueToErrors');
					//make sure a callback is defined.
					if(Q[index]['_tag'] && Q[index]['_tag']['callback'])	{
//						myControl.util.dump(' -> callback ='+Q[index]['_tag']['callback']);
//executes the callback.onError and takes into account extension. saves entire callback object into callbackObj so that it can be easily validated and executed whether in an extension or root.
						callbackObj = Q[index]['_tag']['extension'] ? myControl.ext[Q[index]['_tag']['extension']].callbacks[Q[index]['_tag']['callback']] : myControl.callbacks[Q[index]['_tag']['callback']];

						if(callbackObj && typeof callbackObj.onError == 'function'){
							callbackObj.onError({'errid':'ISE','errmsg':'It seems something went wrong. Please continue, refresh the page, or contact the site administrator if error persists. Sorry for any inconvenience. (mvc error: most likely a request failure after multiple attempts [uuid = '+uuid+'])'},uuid)
							}
						}
					else	{
//						myControl.util.dump(' -> no callback defined');
						}
					}
				else	{
					if(adjustAttempts)	{myControl.q[QID][uuid].attempts += 1; }
					myControl.model.changeDispatchStatusInQ(QID,uuid,'queued');
					}
				
	//			myControl.util.dump('    -> attempts = '+myControl.q[QID][uuid].status);
				}
//			myControl.util.dump('END handleReQ.');
			},
	
	
	
	
	// --------------------------- HANDLERESPONSE FUNCTIONS --------------------------- \\
	
	
	
	
	/*
	
	handleResponse and you...
	some high level errors, like no zjsid or invalid json or whatever get handled in handeResponse
	lower level (_cmd specific) get handled inside their independent response functions or in responseHasErrors(), as they're specific to the _cmd
	
	if no high level errors are present, execute a response function specific to the request (ex: request of addToCart executed handleResponse_addToCart).
	this allows for request specific errors to get handled on an individual basis, based on request type (addToCart errors are different than appProductGet errors).
	the defaultResponse also gets executed in most cases, if no errors are encountered. 
	the defaultResponse contains all the 'success' code, since it is uniform across commands.
	
QID is the dispatchQ ID (either passive, mutable or immutable. required for the handleReQ function.
	*/
	
		handleResponse : function(responseData)	{
//			myControl.util.dump('BEGIN model.handleResponse.');
			
//if the request was not-pipelined or the 'parent' pipeline request contains errors, this would get executed.
//the handlereq function manages the error handling as well.
			if(responseData && !$.isEmptyObject(responseData))	{
				var uuid = responseData['_uuid'];
				var QID = this.whichQAmIFrom(uuid); //don't pass QID in. referenced var that could change before this block is executed.
//				myControl.util.dump(" -> responseData is set. UUID: "+uuid);
				
				if(responseData && responseData['_rcmd'] == 'err')	{
					myControl.util.dump(' -> High Level Error in '+QID+' response!');
//					myControl.util.dump(responseData);
					myControl.model.handleReQ(myControl.dispatchQ,QID,true)
					}

//pipeline request
				else if(responseData && responseData['_rcmd'] == 'pipeline')	{
					
//					myControl.util.dump(' -> pipelined request. size = '+responseData['@rcmds'].length);
					
					for (var i = 0, j = responseData['@rcmds'].length; i < j; i += 1) {
					responseData['@rcmds'][i].ts = myControl.util.unixNow()  //set a timestamp on local data
						if(typeof this['handleResponse_'+responseData['@rcmds'][i]['_rcmd']] == 'function')	{
							this['handleResponse_'+responseData['@rcmds'][i]['_rcmd']](responseData['@rcmds'][i])	//executes a function called handleResponse_X where X = _cmd, if it exists.
	//						myControl.util.dump("CUSTOM handleresponse defined for "+responseData['_rcmd']);
							} 
						else	{
		//					myControl.util.dump(' -> going straight to defaultAction');
							this.handleResponse_defaultAction(responseData['@rcmds'][i],null);
	//						myControl.util.dump("NO custom handleresponse defined for "+responseData['_rcmd']);
							}
						}
					}
//a solo successful request
				else {
//					myControl.util.dump(" -> Got to 'else' in handleResponse.");
//					myControl.util.dump(" -> responseData['_rcmd']: "+responseData['_rcmd']);
//					myControl.util.dump(responseData);
//_tag is stripped on jsonP requests to keep URL as short as possible. It is readded to the responseData here as _rtag (which is how it is handled on a normal request)
					if($.isEmptyObject(responseData['_rtag']))	{
//						myControl.util.dump(" -> no rtag. set. use qid ["+QID+"] and uuid ["+uuid+"]");
						responseData['_rtag'] = myControl.q[QID][uuid]['_tag']
//						myControl.util.dump(" -> dataType is JSONP. _rtag:");
//						myControl.util.dump(myControl.q[QID][uuid]['_tag']); 
//						myControl.util.dump(responseData['_rtag']);

						}
					if(responseData['_rcmd'] && typeof this['handleResponse_'+responseData['_rcmd']] == 'function')	{
	//					myControl.util.dump("CUSTOM handleresponse defined for "+responseData['_rcmd']);
						this['handleResponse_'+responseData['_rcmd']](responseData)	//executes a function called handleResponse_X where X = _cmd, if it exists.
						} 
					else	{
	//					myControl.util.dump("NO custom handleresponse defined for "+responseData['_rcmd']);
						this.handleResponse_defaultAction(responseData,null);
						}
					}
				}
			else	{
//if responseData isn't set, an uber-high level error occured.
					alert("Uh oh! Something has gone very wrong with our app. We apologize for any inconvenience. Please try agian. If error persists, please contact the site administrator.");
				}
			
	//		myControl.util.dump('//END handleResponse');	
			}, //handleResponse
	
	//gets called for each response in a pipelined request (or for the solo response in a non-pipelined request) in most cases. request-specific responses may opt to not run this, but most do.
		handleResponse_defaultAction : function(responseData)	{
//			myControl.util.dump('BEGIN handleResponse_defaultAction');
//			myControl.util.dump(responseData);
			var callbackObj = {}; //the callback object from the controller. saved into var to reduce lookups.
			var callback = false; //the callback name.
			var uuid = responseData['_uuid']; //referenced enough to justify saving to a var.
			var datapointer = null; //a callback can be set with no datapointer.
			var status = null; //status of request. will get set to 'error' or 'completed' later. set to null by defualt to track cases when not set to error or completed.
			var hasErrors = myControl.model.responseHasErrors(responseData);
			
//			myControl.util.dump(" -> uuid: "+uuid);

			if(!$.isEmptyObject(responseData['_rtag']) && myControl.util.isSet(responseData['_rtag']['callback']))	{
	//callback has been defined in the call/response.
				callback = responseData['_rtag']['callback'];
//				myControl.util.dump(' -> callback: '+callback);
				
				if(responseData['_rtag']['extension'] && !$.isEmptyObject(myControl.ext[responseData['_rtag']['extension']].callbacks[callback]))	{
					callbackObj = myControl.ext[responseData['_rtag']['extension']].callbacks[callback];
//					myControl.util.dump(' -> callback node exists in myControl.ext['+responseData['_rtag']['extension']+'].callbacks');
					}
				else if(!$.isEmptyObject(myControl.callbacks[callback]))	{
					callbackObj = myControl.callbacks[callback];
//					myControl.util.dump(' -> callback node exists in myControl.callbacks');
					}
				else	{
					callback = false;
					myControl.util.dump(' -> WARNING! callback defined but does not exist.');
					}
				}
	
	
//if no datapointer is set, the response data is not saved to local storage or into the myControl. (add to cart, ping, etc)
//effectively, a request occured but no data manipulation is required and/or available.
			if(!$.isEmptyObject(responseData['_rtag']) && myControl.util.isSet(responseData['_rtag']['datapointer']) && hasErrors == false)	{
				datapointer = responseData['_rtag']['datapointer'];
//on a ping, it is possible a datapointer may be set but we DO NOT want to write the pings response over that data, so we ignore pings.
//an appPageGet request needs the requested data to extend the original page object. (in case two separate request come in for different attributes for the same category.	
				if(responseData['_rcmd'] == 'ping' || responseData['_rcmd'] == 'appPageGet')	{

					}
				else	{
					myControl.data[datapointer] = responseData;
					myControl.storageFunctions.writeLocal(datapointer,responseData); //save to local storage, if feature is available.
					}
				}
			else	{
	//			myControl.util.dump(' -> no datapointer set for uuid '+uuid);
				}
			
//			myControl.util.dump(" -> datapointer: "+datapointer);
			
			if(hasErrors)	{
				if(callback == false)	{
					myControl.util.dump('WARNING response for uuid '+uuid+' had errors. no callback was defined.')
					}
				else if(!$.isEmptyObject(callbackObj) && typeof callbackObj.onError != 'undefined'){
					myControl.util.dump('WARNING response for uuid '+uuid+' had errors. callback defined and executed.');
/* below, responseData['_rtag'] was passed instead of uuid, but that's already available as part of the first var passed in.
uuid is more useful because on a high level error, rtag isn't passed back in responseData. this way uuid can be used to look up originat _tag obj.
*/
					callbackObj.onError(responseData,uuid); //execute a myControl. must be a myControl. view and model don't talk.
					}
				else{
					myControl.util.dump('ERROR response for uuid '+uuid+'. callback defined but does not exist or is not valid type. callback = '+callback+' datapointer = '+datapointer)
					}
				status = 'error';
	//			myControl.util.dump(' --> no callback set in original dispatch. dq set to completed for uuid ('+uuid+')');
				}
			else if(callback == false)	{
				status = 'completed';
	//			myControl.util.dump(' --> no callback set in original dispatch. dq set to completed for uuid ('+uuid+')');
				}
			else	{
	//			myControl.util.dump(' -> got to success portion of handle resonse. callback = '+callback);
				status = 'completed';
				if(!$.isEmptyObject(callbackObj) && typeof callbackObj.onSuccess != undefined){
//initially, only datapointer was passed back.
//then, more data was getting passed on rtag and it made more sense to pass the entire object back
					callbackObj.onSuccess(responseData['_rtag']); //executes the onSuccess for the callback
					}
				else{
					myControl.util.dump(' -> successful response for uuid '+uuid+'. callback defined ('+callback+') but does not exist or is not valid type.')
					}
				}
	
	//		myControl.util.dump(' -> q in use = '+QID);
	//		myControl.util.dump(' -> cmd = '+responseData['_rcmd']);
	//		myControl.util.dump(' -> uuid = '+uuid);
	//		myControl.util.dump(' -> status = '+status);
	//		myControl.util.dump(' -> callback = '+callback);
	//		myControl.util.dump(' -> typeof myControl.DIQ = '+ typeof myControl.q[QID]);
	//		myControl.util.dump(' -> length myControl.DIQ = '+ myControl.model.countProperties(myControl.q[QID]));
	//		myControl.util.dump(' -> typeof myControl.DIQ.uuid = '+ typeof myControl.q[QID][uuid]);
			
		
//			myControl.util.dump("which q am i from ("+uuid+") = "+myControl.model.whichQAmIFrom(uuid))
			myControl.q[myControl.model.whichQAmIFrom(uuid)][Number(uuid)]['status'] = status;
			
	//		myControl.util.dump('//END handleResponse_defaultAction. uuid = '+uuid+' callback = '+callback+' datapointer = '+datapointer);
			return status;
		},
	
	
	//this function gets executed upon a successful request for a create order.
	//saves a copy of the old cart object to order|ORDERID in both local and memory for later reference (invoice, upsells, etc).
		handleResponse_cartOrderCreate : function(responseData)	{
	//currently, there are no errors at this level. If a connection or some other critical error occured, this point would not have been reached.
//			myControl.util.dump("BEGIN model.handleResponse_createOrder");
			var datapointer = "order|"+responseData.orderid;
			myControl.storageFunctions.writeLocal(datapointer,myControl.data.cartItemsList);  //save order locally to make it available for upselling et all.
			myControl.data[datapointer] = myControl.data.cartItemsList; //saved to object as well for easy access.
	//nuke cc fields, if present.		
			myControl.data[datapointer].cart['payment.cc'] = null;
			myControl.data[datapointer].cart['payment.cv'] = null;
			myControl.model.handleResponse_defaultAction(responseData); //datapointer ommited because data already saved.
			return responseData.orderid;
			}, //handleResponse_cartOrderCreate
	
	
//no special error handling or anything like that.  this is just here to get the category safe id into the response for easy reference.	
		handleResponse_appCategoryDetail : function(responseData)	{
//			myControl.util.dump("BEGIN model.handleResponse_appCategoryDetail");
//save detail into response to make it easier to see what level of data has been requested during a fetch or call
			if(responseData['_rtag'] && responseData['_rtag'].detail){
				responseData.detail = responseData['_rtag'].detail;
				}
			if(responseData['@products'] && !$.isEmptyObject(responseData['@products']))	{
				responseData['@products'] = $.grep(responseData['@products'],function(n){return(n);}); //strip blanks
				}
			if(responseData['_rtag'] && responseData['_rtag'].datapointer)
				responseData.id = responseData['_rtag'].datapointer.split('|')[1]; //safe id into data for easy reference.
			myControl.model.handleResponse_defaultAction(responseData);
			return responseData.id;
			}, //handleResponse_categoryDetail


/*
It is possible that multiple requests for page content could come in for the same page at different times.
so to ensure saving to appPageGet|.safe doesn't save over previously requested data, we extend it the ['%page'] object.
*/
		handleResponse_appPageGet : function(responseData)	{
			if(responseData['_rtag'] && responseData['_rtag'].datapointer)	{
				var datapointer = responseData['_rtag'].datapointer;
				if(myControl.data[datapointer])	{
					//already exists.  extend the %page
					myControl.data[datapointer]['%page'] = $.extend(myControl.data[datapointer]['%page'],responseData['%page']);
					}
				else	{
					myControl.data[datapointer] = responseData;
					}
				myControl.storageFunctions.writeLocal(datapointer,myControl.data[datapointer]); //save to local storage, if feature is available.
				}
			myControl.model.handleResponse_defaultAction(responseData);
			}, //handleResponse_appPageGet



//admin session returns a zjsid if response	
// formerly authorizeAdminSession
//		handleResponse_appAdminAuthenticate
		handleResponse_appSessionStart: function(responseData)	{
//			myControl.storageFunctions.deleteCookie('zjsid'); //nuke any previous zjsid cookie
			myControl.util.dump("BEGIN model.handleResponse_appSessionStart . ("+responseData['_uuid']+")");
			myControl.util.dump(" -> _zjsid = "+responseData['_zjsid']);
			if(myControl.util.isSet(responseData['_zjsid']))	{
				this.handleResponse_appCartCreate(responseData); //saves session data locally and into control.
				myControl.storageFunctions.writeLocal('zjsid',responseData['_zjsid']);
//				myControl.storageFunctions.writeCookie('zjsid',responseData['_zjsid']); //the app doesn't use the cookie, so it doesn't leave one. any legacy code that needs cookies should handle it on their own.
//				var date = new Date();
//				document.cookie = "zjsid="++"; domain=.zoovy.com;path=/; expires="+date.setTime(date.getTime()+(1*24*60*60*1000));
				}
			else	{
				myControl.model.handleResponse_defaultAction(responseData);
				}
			},

// formerly canIHaveSession
		handleResponse_appCartExists : function(responseData)	{
//			myControl.util.dump("BEGIN model.handleResponse_canIHaveSession . ("+responseData['_uuid']+")");
//			myControl.util.dump(" -> exists = "+responseData.exists);
			if(responseData.exists == 1)	{
				this.handleResponse_appCartCreate(responseData); //saves session data locally and into control.
				}
			else	{
/* nuke references to old, invalid session id. if this doesn't happen, the old session ID gets passed and will be re-issued. */				
				myControl.sessionId = null;
				myControl.storageFunctions.writeLocal('zjsid',null);
				
				myControl.model.handleResponse_defaultAction(responseData); //datapointer ommited because data already saved.
				}
			},

//this function gets executed upon a successful request for a new session id.
//it is also executed if appAdminAuthenticate returns exists=1 (yes, you can).
//formerly newSession
		handleResponse_appCartCreate : function(responseData)	{
//			myControl.util.dump(" --> appCartCreate Response executed. ("+responseData['_uuid']+")");
//			myControl.util.dump("RESPONSE DATA:");
//			myControl.util.dump(responseData);

//ensure no cross-account data polution on shared domain. this only happens is cart is not valid. If valid, local data should be for account in focus.
//the cart/session will immediately get added back to local storage below.
			if(window.location.href.indexOf('ssl.zoovy') > -1)	{localStorage.clear();}

//no error handling at this level. If a connection or some other critical error occured, this point would not have been reached.
//save session id locally to maintain session id throughout user experience.	
			myControl.storageFunctions.writeLocal('sessionId',responseData['_zjsid']);
//			myControl.storageFunctions.writeLocal(myControl.vars['username']+"-cartid",responseData['_zjsid']);  
			myControl.sessionId = responseData['_zjsid']; //saved to object as well for easy access.
			myControl.model.handleResponse_defaultAction(responseData); //datapointer ommited because data already saved.
			myControl.util.dump("sessionID = "+responseData['_zjsid']);
			return responseData['_zjsid'];
			}, //handleResponse_appCartCreate
	
/*
in most cases, the errors are handled well by the API and returned either as a single message (errmsg)
or as a series of messages (_msg_X_id) where X is incremented depending on the number of errors.
*/	
		responseHasErrors : function(responseData)	{
	//		myControl.util.dump('BEGIN model.responseHasErrors');
//at the time of this version, some requests don't have especially good warning/error in the response.
//as response error handling is improved, this function may no longer be necessary.
			var r = false; //defaults to no errors found.
			if(responseData['_rtag'] && responseData['_rtag'].forceError == 1)	{r = true}
			else	{
				switch(responseData['_rcmd'])	{
					case 'appProductGet':
	//the API doesn't recognize doing a query for a sku and it not existing as being an error. handle it that way tho.
						if(!responseData['%attribs']['db:id']) {
	//						myControl.util.dump("GOT HERE!");
							r = true;
							responseData['errid'] = "MVC-M-100";
							responseData['errtype'] = "apperr"; 
							responseData['errmsg'] = "could not find product (may not exist)";
							} //db:id will not be set if invalid sku was passed.
						break;
					case 'appCategoryDetail':
						if(responseData.errid > 0 || responseData['exists'] == 0)	{
							r = true
							responseData['errid'] = "MVC-M-200";
							responseData['errtype'] = "apperr";
							responseData['errmsg'] = "could not find category (may not exist)";
							} //a response errid of zero 'may' mean no errors.
						break;
					case 'appPublicSearch':
						//currently, there are no errors. I have a hunch this will change.
						break;
		
					case 'addSerializedDataToCart': //no break is present here so that case addSerializedDataToCart and case addToCart execute the same code.
					case 'cartItemsAdd':
						if(responseData['_msgs'] > 0)	{r = true};
						break;
		
					case 'cartOrderCreate':
		//				myControl.util.dump(' -> case = createOrder');
						if(!myControl.util.isSet(responseData['orderid']))	{
		//					myControl.util.dump(' -> request has errors. orderid not set. orderid = '+responseData['orderid']);
							r = true;
							}  
						break;
					default:
						if(responseData['_msgs'] > 0 && responseData['_msg_1_id'] > 0)	{r = true} //chances are, this is an error. may need tuning later.
						if(responseData['errid'] > 0) {r = true}
		//				myControl.util.dump('default case for error handling');
						break;
					}
				}
	//		myControl.util.dump('//END responseHasErrors. has errors = '+r);
			return r;
			},
	
	
	// --------------------------- FETCH FUNCTIONS --------------------------- \\
	
	
	
	/*
	each request must have a uuid (Unique Universal IDentifyer).
	the uuid is also the item id in the dispatchQ. makes finding dispatches in Q faster/easier.
	
	first check to see if the uuid is set in the myControl. currently, this is considered a 'trusted' source and no validation is done.
	then check local storage/cookie. if it IS set and the +1 integer is not set in the DQ, use it.
	if local isn't set or is determined to be inaccurate (local + 1 is already set in DQ)
	 -> default to 999 if DQ is empty, which will start uuid's at 1000.
	 -> or if items are in the Q get the last entry and treat it as a number (this should only happen once in a session, in theory).
	
	*/
	
		fetchUUID : function()	{
//			myControl.util.dump('BEGIN fetchUUID');
			var uuid = false; //return value
			var L;
			
			if(myControl.vars.uuid)	{
	//			myControl.util.dump(' -> isSet in myControl. use it.');
				uuid = myControl.vars.uuid; //have to, at some point, assume app integrity. if the uuid is set in the control, trust it.
				}
//in this else, the L is set to =, not == because it's setting itself to the value of the return of readLocal so readLocal doesn't have to be executed twice.
			else if(L = myControl.storageFunctions.readLocal("uuid"))	{
				L = Math.ceil(L * 1); //round it up (was occassionally get fractions for some odd reason) and treat as number.
	//			myControl.util.dump(' -> isSet in local ('+L+' and typof = '+typeof L+')');
				if($.isEmptyObject(myControl.q.mutable[L+1]) && $.isEmptyObject(myControl.q.immutable[L+1]) && $.isEmptyObject(myControl.q.passive[L+1])){
					uuid = L;
	//				myControl.util.dump(' -> local + 1 is empty. set uuid to local');
					}
				}
	//generate a new uuid if it isn't already set or it isn't an integer.
			if(uuid == false || isNaN(uuid))	{
	//			myControl.util.dump(' -> uuid not set in local OR local + 1 is already set in dispatchQ');
				if(myControl.q.mutable.length + myControl.q.immutable.length + myControl.q.passive.length == 0)	{
	//				myControl.util.dump(' -> setting default uuid');
					uuid = 999;
					}
				else	{

	//				uuid = math.max(model.getLastIndex(myControl.q.mutable),model.getLastIndex(myControl.q.immutable))  // 'math' not univerally supported.
//get last request in both q's and determine the larger uuid for use.
//  #### improve this.
					var lastImutableUUID = myControl.model.getLastIndex(myControl.q.immutable);
					var lastMutableUUID = myControl.model.getLastIndex(myControl.q.mutable);
					var lastPassiveUUID = myControl.model.getLastIndex(myControl.q.passive);
					uuid = lastMutableUUID >lastImutableUUID ? lastMutableUUID : lastImutableUUID;
					uuid = uuid > lastPassiveUUID ? uuid : lastPassiveUUID;
					}
				}
	
			uuid += 1;
			myControl.vars.uuid = uuid;
			myControl.storageFunctions.writeLocal('uuid',uuid); //save it locally.
	//		myControl.util.dump('//END fetchUUID. uuid = '+uuid);
			return uuid;
			}, //fetchUUID
	
//currently, only three q's are present.  if more q's are added, this will need to be expanded. ###
// ### loop through myControl.q and get value that way.
		whichQAmIFrom : function(uuid)	{
			var r;
			if(typeof myControl.q.mutable[uuid] !== 'undefined')
				r = 'mutable'
			else if(typeof myControl.q.immutable[uuid] !== 'undefined')
				r = 'immutable'
			else if(typeof myControl.q.passive[uuid] !== 'undefined')
				r = 'passive'
			else	{
//not found in a matching q.  odd.
				r = false;
				}
//			myControl.util.dump('whichQAmIFrom = '+r+' and uuid = '+uuid );
			return r;
			}, //whichQAmIFrom
	
	//gets session id. The session id is used a ton.  It is saved to myControl.sessionId as well as a cookie and, if supported, localStorage.
	//Check to see if it's already set. If not, request a new session via ajax.
		fetchSessionId : function(callback)	{
//			myControl.util.dump('BEGIN: model.fetchSessionId');
			var s = false;
			if(myControl.sessionId)	{
//				myControl.util.dump(' -> sessionId is set in control');
				s = myControl.sessionId
				}
//sets s as part of else if so getLocal doesn't need to be run twice.
			else if(s = myControl.storageFunctions.readLocal('sessionId'))	{
//				myControl.util.dump(' -> sessionId is set in local from previous ajax session');										 
				}
//see note in handleResponse_appCartCreate to learn why this is commented out.
//			else if(s = myControl.storageFunctions.readLocal(myControl['username']+"-cartid"))	{
//				myControl.util.dump(' -> sessionId is set in local from cookie. possibly from storefront session (non-ajax)');
//				}
			else	{
//catch all.  returns false.
//				myControl.util.dump(' -> no session id in control or local.');
				}
	//		myControl.util.dump("//END: fetchSessionId. s = "+s);
			
			return s;
			}, //fetchSessionId
	
	/*
	will check to see if the datapointer is already in the myControl.data.
	if not, will check to see if data is in local storage and if so, save it to myControl.data IF the data isn't too old.
	will return false if datapointer isn't in myControl.data or local (or if it's too old).
	*/
	
	
		fetchData : function(datapointer)	{
//			myControl.util.dump("BEGIN model.fetchData.");
//			myControl.util.dump(" -> datapointer = "+datapointer);
			var local;
			var r = false;
	//checks to see if the request is already in 'this'.
			if(!$.isEmptyObject(myControl.data[datapointer]))	{
//				myControl.util.dump(' -> control already has data');
				r = true;
				}
//then check local storage and, if present, update the control object
			else if (local = myControl.storageFunctions.readLocal(datapointer))	{
//				myControl.util.dump(' -> local does have data.');
	//			myControl.util.dump(local);
				if(local.ts)	{
					if(myControl.util.unixNow() - local.ts > 60*60*24)	{
//						myControl.util.dump(' --> data it is too old :'+(myControl.util.unixNow() - myControl.data[datapointer].ts) / (60*60)+" minutes");
						r = false; // data is more than 24 hours old.
						}
					else	{
						myControl.data[datapointer] = local;
						r = true;
						}
					}
				else	{
//				myControl.util.dump(' -> neither the control nor local storage have this data.');
	//hhhmmm... data is in local, but no ts is set. better get new data.
					r = false;
					}
				}
			
//set myControl.ajax.checkForLocalJSON to true and the app will look for local copies (not local storage) of the json
			if(r === false && myControl.ajax.checkForLocalJSON)	{
				if(myControl.ajax.localJSONFolder)	{
//				myControl.util.dump(" -> Data not in memory or local.");
					if(datapointer.indexOf("appProductGet") > -1)	{
						pid = datapointer.split("|")[1]
						var result = $.ajax({
							type: "GET",
							url: myControl.ajax.localJSONFolder+"/pid="+pid+".json",
							async: false,
							dataType:"json"
							})
						result.success(function(d){
							r = true;
							myControl.data[datapointer] = d;
						myControl.util.dump(" -> d: ");
						myControl.util.dump(d);
							});
						result.error(function(){
							r = false;
							});
	
						}
					}
				else	{
					myControl.util.dump("WARNING! checkForLocalJSON enabled but localJSONFolder not set.");
					}
				}
//			myControl.util.dump("END fetchData for "+datapointer+". r = "+r);
			return r;
			}, //fetchData
	
	
	
	/* functions for extending the controller (adding extensions and templates) */
	
//$templateSpec = the jquery obj for the template.
//templateID is how the template will be referenced in myControl.templates.
		makeTemplate : function($templateSpec,templateID)	{
			var r = true; //what is returned. if a template is created, true is returned.
			if(templateID && typeof $templateSpec == 'object')	{
				myControl.templates[templateID] = $templateSpec.attr('data-templateid',templateID).clone();
				$('#'+templateID).empty().remove(); //here for templates created from existing DOM elements. They're removed to ensure no duplicate ID's exist.
				}
			else	{
				r = false;
				myControl.util.dump("WARNING! - model.makeTemplate executed but no templateID and/or template object specified.");
				}
			return r;
			},
	
//templates should be an array of element id's.
		loadTemplates : function(templates)	{
	//		myControl.util.dump("BEGIN model.loadTemplates")
			var L = templates.length
	
	//		myControl.util.dump("model.loadTemplates for "+namespace);
			var errors = ''; //what is returned.  if not false, errors are present (and returned)
			var templateID; //used for a quick reference to which id in the loop is in focus.
			var $templateSpec; //used to store the template/spec itself for the template.
	//		myControl.util.dump(" -> loading "+L+" templates ");
			for(var i = 0; i < L; i += 1)	{
				templateID = templates[i];
				$templateSpec = $('#'+templateID);
	//			myControl.util.dump(" -> templateID: "+templateID);
				if($templateSpec.length < 1)	{
					errors += "<li>Template '"+templateID+"' is not defined in the view<\/li>";
					}
				else	{
					this.makeTemplate($templateSpec,templateID);
					}
				$templateSpec.empty(); //ensure previous spec isn't used on next iteration.
				}
			return errors;
			},


//templateURL is the .html file that contains the templates. be cautions about loading http: from a secure page.
//this is just a request to get the html. doesn't actually load the templates.

// NOTE - at the point this function becomes flexible enough to be useful, you might as well just make the request.

/*		fetchFileViaAjax : function(URL)	{
//			myControl.util.dump("BEGIN model.fetchFileViaAjax");
	//result is the ajax request and what is returned.
	//should allow for .error and .success to be set outside this function. 
			var result = $.ajax({
				type: "GET",
				url: URL,
				async: false,
				dataType:"html"
				});	
//			myControl.util.dump("result: ");
//			myControl.util.dump(result);
			return result;
			}, */

	fetchNLoadTemplates : function(templateURL,templates)	{
//		myControl.util.dump("BEGIN model.fetchNLoadTemplates");
//		myControl.util.dump(" -> templateURL: "+templateURL);
//		myControl.util.dump(" -> templates: "+templates);
		var ajaxRequest = $.ajax({
				type: "GET",
				url: templateURL,
				async: false,
				dataType:"html"
				});	//this.fetchFileViaAjax(templateURL);
		
		ajaxRequest.error(function(d,e,f){
			//the templates not loading is pretty much a catastrophic issue. however, we don't want to throw an error in this case so just hide the carousel.
			$('#globalMessaging').append(myControl.util.formatMessage("Uh oh! Something bad happened. If the error persists, please contact Zoovy technical support. error: could not load remote templates. (dev - see console for more details)"));
			myControl.util.dump("ERROR! unable to load remote templates");
			myControl.util.dump("templateURL: "+templateURL);
			myControl.util.dump(e);
			myControl.util.dump(d.statusText);
			});

		ajaxRequest.success(function(data){
//			myControl.util.dump("template file loaded successfully.");
//remote templates are added to their own div so that .html() can be used without impacting any default templates that may not have loaded.
//unique id's are needed so that it multiple extensions are loading remote templates, .html doesn't save over them.
//can't use append because it'll treat content as text not html
//so if the templateurl is /something/checkout/templates.html, the template id will be remoteTemplates_checkout
			var templateContainerID = 'remoteTemplates_'+templateURL.split('/').splice(-2,1);
			var $remoteTemps = $('#'+templateContainerID);
			if($remoteTemps.length == 0)	{
				$remoteTemps = $("<div />").attr('id',templateContainerID).hide().appendTo('body');
				}
			$remoteTemps.html(data);
			var templateErrors = myControl.model.loadTemplates(templates);
			if(templateErrors)	{
				$('#globalMessaging').append(myControl.util.formatMessage(templateErrors));
//				myControl.util.dump(templateErrors);
				}
			});
		return ajaxRequest;
		},

/*
extensions are like plugins. They are self-contained* objects that may include calls, callbacks, utitity functions and/or variables.
the extension object passed in looks like so:

[
{"namespace":"convertSessionToOrder","extension":"checkout_fast.js","callback":"init"},
{"namespace":"name","extension":"filename","callback":"optional"}
]

*	typically, there will be 'one extension to bind them all'. this extension is less-self-contained. 
	It'll include dependencies and the list of templates used.

namespace - the extension is saved to myControl.ext.namespace and would be 'called' using that name. (myControl.ext.namespace.calls.somecall.init()
extension - the filename. full path.
callback - a function to be executed once the extension is done loading.

the 'convertSessionToOrder' namespace is reserved for checkout. only 1 checkout extension can be loaded at a time.
use a unique naming convention for any custom extensions, such as username_someusefulhint (ex: cubworld_jerseybuilder)

The ajax request itself (fetchExtension) was originally in the addExtension function in the loop.  This caused issues.
only one extension was getting loaded, but it got loaded for each iteration in the loop. even with async turned off.

*/
		
		fetchExtension : function(extensionObjItem)	{
//			myControl.util.dump('BEGIN model.fetchExtention');
//			myControl.util.dump(' -> namespace: '+extensionObjItem.namespace);
			var errors = '';
			var url = extensionObjItem.filename;
			var namespace = extensionObjItem.namespace; //for easy reference.
//			myControl.util.dump(' -> url = '+url);
		
			var ajaxLoadExt = $.ajax({
				url: url,
///				async: 0, //testing... 
				dataType: 'script',
				success: function(data) {
	//The 'success' can be executed prior to the script finishing loading so the heavy lifting happens in 'complete'.
//					myControl.util.dump(" -> EXTCONTROL Got to success");
					},
				complete: function(data)	{
//					myControl.util.dump(" -> EXTCONTROL got to complete");
//					myControl.util.dump(" -> status = "+data.statusText);
//hhhhmmm... was originally just checking success. now it checks success and OK (2011-01-11). probably need to improve this at some point.
					if(data.statusText == 'success' || data.statusText == 'OK')	{
//						myControl.util.dump(" -> adding extension to controller");
						
//the .js file for the extension contains a function matching the namespace used.
//the following line executes that function and saves the object returned to the control.
//this is essentially what makes the extension available for use.
//immediately after the data is loaded into the control, the extension.namespace.callbacks.init is run.  This is where any system settings should be checked/reported.
//data is saved to the control prior to template/view verification because we need access to the object.
//yes, technically we could have saved it to a var, accessed the templates param, validated and NOT saved, but this is lighter.
//it means that a developer could use an extension that didn't load properly, but that is their perogative, since we told them its broke.
						myControl.ext[namespace] = eval(namespace+'()'); //keep this as early in the process as possible so it's done before the next extension loads.

						var callback = extensionObjItem.callback; //for easy reference.
//						myControl.util.dump(" -> typeof callback: "+typeof callback);
						if(typeof myControl.ext[namespace].callbacks.init === 'object')	{
//							myControl.util.dump(" typeof === object");
							var initPassed = myControl.ext[namespace].callbacks.init.onSuccess(); //returns t/f
//							myControl.util.dump(" -> "+namespace+" onSuccess response = "+initPassed);
							}
						else	{
//no init was set in extension.  Init handles dependencies and should be present. For now, we'll trust that the developer had a good reason for not having an init and continue.
							myControl.util.dump("WARNING: extension "+namespace+" did NOT have an init. This is very bad.");
							errors += "<li>init not set for extension "+namespace;
							}
//whether init passed or failed, load the templates. That way any errors that occur as a result of missing templates are also displayed.
//						myControl.util.dump(" -> templates.length = "+myControl.ext[namespace].vars.templates.length);
						if(myControl.ext[namespace].vars && myControl.ext[namespace].vars.templates && !myControl.ext[namespace].vars.willFetchMyOwnTemplates)	{
							errors += myControl.model.loadTemplates(myControl.ext[namespace].vars.templates);
							}
						else	{
//							myControl.util.dump("WARNING: extension "+namespace+" did not define any templates. This 'may' valid, as some extensions may have no templates.");
							}
						
/*
now we know whether the extension properly loaded, had and executed an init and has a callback.
respond accordingly.

*/
						if(initPassed == false)	{
							$('#globalMessaging').append("<div class='ui-state-error ui-corner-all'>Uh Oh! Something went wrong with our app. We apologize for any inconvenience. (err: "+namespace+" extension did not pass init)<\/div>");
							}
						else if(errors)	{
							myControl.util.dump(" -> extension contained errors. callback not executed yet.");
							myControl.util.dump(" -> "+errors);
//view templates must contain the globalMessaging div. The testing harness needs it.
							$('#globalMessaging').append("<div class='ui-state-error ui-corner-all'>Extension "+namespace+" contains the following error(s):<ul>"+errors+"<\/ul><\/div>");

//the line above handles the errors. however, in some cases a template may want additional error handling so the errors are passed in to the onError callback.
							if(myControl.ext[namespace].callbacks.init.onError)	{
//								myControl.util.dump(" -> executing callback.onError.");
								myControl.ext[namespace].callbacks.init.onError("<div>Extension "+namespace+" contains the following error(s):<ul>"+errors+"<\/ul><\/div>",'');
								}							
							}
						else if(callback)	{
//							myControl.util.dump(" -> callback defined for namespace: "+namespace);
							if(myControl.ext[namespace].vars.dependencies || myControl.ext[namespace].vars.templates)	{
//								myControl.util.dump(" -> extension ("+namespace+") has dependencies and/or templates. veryify they're loaded before executing callback");
								myControl.model.handleDependenciesFor(namespace,callback);
								}
							else	{
								myControl.model.executeExtensionCallback(namespace,callback);
								}
							}
						else	{
//							myControl.util.dump(" -> extension "+namespace+" loaded fine but contained no callback");
							}
						}
					},
				error: function(a,b,c) {
					$('#globalMessaging').append("<div class='ui-state-error ui-corner-all'>Uh oh! It appears something went wrong with our app. If error persists, please contact the site administrator.<br \/>(error: ext "+extensionObjItem.namespace+" had error type "+b+")<\/div>"); 
					myControl.util.dump(" -> EXTCONTROL ("+namespace+")Got to error. error type = "+b+" c = ");
					myControl.util.dump(c);
					}
				});

			},

		executeExtensionCallback : function(namespace,callback)	{
//			myControl.util.dump("BEGIN model.executeExtensionCallback");
			if(typeof callback == 'function'){eval(callback)}
			else if(typeof callback == 'string')	{myControl.ext[namespace].callbacks[callback].onSuccess()}
			else	{myControl.util.dump("!Unknown type ["+typeof callback+"] for extension callback ");}
			},
			
//see big comment block above fetch for more info.
		addExtensions : function(extensionObj)	{
//			myControl.util.dump('BEGIN model.addExtensions');
			var r = false; //what is returned. false if no extensions are loaded or the # of extensions
			if(!extensionObj)	{
				myControl.util.dump(' -> extensionObj not passed');
				}
			else if(typeof extensionObj != 'object')	{
				myControl.util.dump(' -> extensionObj not a valid format');
				}
			else	{
//				myControl.util.dump(' -> valid extension object containing '+extensionObj.length+' extensions');
				var L = extensionObj.length;
				r = L; //return the size of the extension object 
				for(var i = 0; i < L; i += 1) {
//					myControl.util.dump(" -> i: "+i);
//namespace and filename are required for any extension.
					if(!extensionObj[i].namespace || !extensionObj[i].filename)	{
						
						if(extensionObj.callback && typeof extensionObj.callback == 'string')	{
							extensionObj[i].callback.onError("Extension did not load because namespace ["+extensionObj[i].namespace+"] and/or filename ["+extensionObj[i].filename+"]  not set",'')
							}
						myControl.util.dump(" -> extension did not load because namespace ("+extensionObj[i].namespace+") or filename ("+extensionObj[i].filename+") was left blank.");
						continue; //go to next index in loop.
						}
					else	{
						myControl.model.fetchExtension(extensionObj[i],i);
						}
					} // end loop.
				}
			return r;
//			myControl.util.dump('END model.addExtension');
			},

//verifies that all the templates for a given extension/namespace have been loaded.
		allTemplatesForExtensionHaveLoaded : function(namespace)	{
//			myControl.util.dump("BEGIN model.alltemplatesHaveLoaded ["+namespace+"]");
			var r = true; //what is returned. t/f based on whether or not all the templates extensions have loaded.
			var templateID; //shortcut.
			if(myControl.ext[namespace].vars && myControl.ext[namespace].vars.templates)	{
				var L = myControl.ext[namespace].vars.templates.length;
//				myControl.util.dump(" -> L: "+L);
				for(i = 0; i < L; i += 1)	{
					templateID = myControl.ext[namespace].vars.templates[i];
					if(typeof myControl.templates[templateID] != 'object'){r = false}
					}
				}
//			myControl.util.dump("END model.allTemplatesHaveLoaded ["+r+"]");
			return r;
			}, //allTemplatesForExtensionHaveLoaded

/*
loop through control. object and make sure all the extensions have completely loaded.
This is checks for two things:
1. is the namespace set in the control object.
2. are all the templates for each extension loaded.
*/

		allTemplatesHaveLoaded : function(extObj)	{
//			myControl.util.dump("BEGIN model.allTemplatesHaveLoaded");
//			myControl.util.dump(extObj);
			var r = true; //what is returned (whether or not all extensions have loaded.
			var L = extObj.length;
			var namespace; //shortcut.
			for(var i = 0; i < L; i += 1) {
				namespace = extObj[i];
				if(typeof myControl.ext[namespace] == 'object')	{
					if(!this.allTemplatesForExtensionHaveLoaded(namespace)){
						r = false;
						break;
						}
					}
				else	{
					r = false;
					break;
					}
				}
//			myControl.util.dump("END model.allExtensionsHaveLoaded ["+r+"]");
			return r;
			}, //allExtensionsHaveLoaded
			
/*
for extensions. When an extension is loaded and it has dependencies, this function is executed. 
It waits until the other necessary extensions are loaded, then executes the callback.
this makes extension sequence less important when initializing the controller.
// SANITY - a user should only have ONE extension that loads and has dependencies. the extension
//that contains most of the logic native to their app.
*/
		handleDependenciesFor : function(namespace,callback)	{
//			myControl.util.dump("BEGIN myControl.model.handleDependenciesFor");
//			myControl.util.dump(" -> namespace: "+namespace);
//			myControl.util.dump(" -> callback: "+callback);
			var pass = true;
			var D = 0; //# of dependencies
			var dl = 0; //# of dependies that have been loaded.

			if(myControl.ext[namespace].vars.dependencies)	{
				D = myControl.ext[namespace].vars.dependencies.length
				}

//			myControl.util.dump(" -> # of dependant extensions: "+D);
//make sure all dependencies have been loaded.
			for(var i = 0; i < D; i += 1)	{
				if(typeof myControl.ext[myControl.ext[namespace].vars.dependencies[i]] === 'object') {dl += 1}
				else	{myControl.util.dump(" -> missing: "+myControl.ext[namespace].vars.dependencies[i]); pass = false; break} //once we have a no match, just end the loop. no point going forward if we're going to reexecute this function anyway.
				}
//			myControl.util.dump(" -> after dependencies loop. pass: "+pass);

//make sure all templates for this extension have been loaded. 
//if a fail has already occured, no point executing this verification
			if(pass)	{
				pass = myControl.model.allTemplatesForExtensionHaveLoaded(namespace);
				}

//			myControl.util.dump(" -> after check for this template. pass: "+pass);


//check to make sure other extensions templates are loaded. Do this last to allow for most time for external template file to be loaded.
//if a fail has already occured, no point executing this verification
			if(pass)	{
				pass = myControl.model.allTemplatesHaveLoaded(myControl.ext[namespace].vars.dependencies)
				}

//			myControl.util.dump(" -> after allTemplatesHaveLoaded. pass: "+pass);
			

			if(pass)	{
				myControl.util.dump(" -> all dependencies for namespace."+namespace+" should be loaded. execute callback.");
				myControl.model.executeExtensionCallback(namespace,callback);
				}
			else	{
				myControl.ext[namespace].vars.dependAttempts += 1;
				myControl.util.dump(" -> dependencies missing for namespace "+namespace+". try again. attempt: "+myControl.ext[namespace].vars.dependAttempts);
				if(myControl.ext[namespace].vars.dependAttempts > 25)	{
					$('#globalMessaging').append("Uh Oh. An error occured with our app. You can try refreshing the page. If error persists, please contact the site administrator").toggle(true);
					}
				else	{
					setTimeout("myControl.model.handleDependenciesFor('"+namespace+"','"+callback+"');",500)
					}
				}
			}
		}

	
	window.ieBlows = r.ieBlows; //global reference to JSONP callback function. a global is used to keep the url as short as possible for thejsonp req.
	return r;
	}