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
The view and the model should never speak to each other directly... other than maybe a button in the view executing app.model.dispatchThis().

There are two types of data being dealt with:
1. ajax request (referred to as request from here forward) for store data, such as product info, product lists, merchant info, etc.
2. extensions loaded as part of control object instantiation or on the fly as needed.

Some high level error handling occurs as part of the model, mostly for ISE's.
The rest is in the controller or extension. The model will execute callbacks.CALLBACKID.onError(d,uuid)
 -> d is the data object returned by the server. one of the few cases the raw response is returned.


execute the zoovyModel function from within the controller. ex:  app.model = zoovyModel();
 -> this will return an object into the app.model namespace. ex: app.model.dispatchThis()


There are currently three dispatch queues. (Q or DQ) which reside in app.q.
Each queue can be filled with several requests, then dispatched all at once.
that'll piggyback several dispatches on one request, which is considerably more efficient
than several requests.

q.passive - should only be used for requests with no callbacks or for requests that should never get cancelled by another, but are not strictly necessary.
For instance, if you wanted to retrieve product data for page
2 and 3 when the user is on page 1, you'd use passive. No action occurs as a results of getting this data.
Or if you have dispatches occur during your app init but are concerned they could get over-written by the immutable q (such as requests for site nav that you don't want nukd if the user is coming in to the app for checkout) then use passive.
the passive q requests are never aborted.

q.mutable - this is the bulk of your calls. Getting information and then doing something with it (executed from the callback). It is called mutable
because it can be muted by the app.model.abortQ() function
will abort all mutable requests.  Use this when the users direction changes (they click page 1, then quickly click page 2 - you'd want to cancel the requests for 
page 1 so their callbacks are not executed).

q.immutable - use this sparingly, for 'mission critical' requests, such as add to cart, update cart and any requests during checkout.  Only 1 immutable request will fire at a time.
if any mutable requests are in process, they're cancelled. if an immutable request is in process and another request comes in (mutable or immutable), 
the secondary request is delayed till the first is done.


in some cases, you may use a mutable request for an add to cart so that the user can push it and move on with their experience. That's ok.
however, it is highly recommended that you only use the immutable q for checkout.

even though multiple dispatches can occur at the same time, it's still in your interest to pack the queue and dispatch at once.
it'll be faster with fewer dispatches.


app.globalAjax.overrideAttempts - keeps track of how many times a dispatch has attempted while another is in progress.
app.globalAjax.lastDispatch - keeps track of when the last dispatch occurs. Not currently used for much, but could allow for some auto-passive dispatches when idle.
*/

function zoovyModel() {
	var r = {
	
		version : "201252",
	// --------------------------- GENERAL USE FUNCTIONS --------------------------- \\
	
	//pass in a json object and the last item id is returned.
	//used in some of the fetchUUID function.
	// note that this is potentially a heavy function (depending on object size) and should be used sparingly.
		getLastIndex : function(obj) {
			var prop, r;
			for (prop in obj) {
				r = prop;
				}
			app.u.dump('END model.getLastIndex r = '+r);
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
	_rtag.datapointer -> this is where in app.data the information returned will be saved to. 
	ex: datapointer:appProductGet|SKU would put product data into app.data['appProductGet|SKU']
	
	if no datapointer is passed, no data is returned in an accessable location for manipulation.
	 -> the only time the actual response is passed back to the control is if an error was present.
	
	*/
	
	
		addDispatchToQ : function(dispatch,QID) {
	//		app.u.dump('BEGIN: addDispatchToQ');
			var r; // return value.
			if(dispatch['_cmd'] == 'undefined')	{
				r = false;
	//			zSTdErr(' -> _cmd not set. return false');
				}
			else	{
				QID = QID === undefined ? 'mutable' : QID; //default to the mutable Q, but allow for PDQ to be passed in.
				var uuid = app.model.fetchUUID() //uuid is obtained, not passed in.
				dispatch["_uuid"] = uuid;
				dispatch["status"] = 'queued';
				dispatch["attempts"] = dispatch["attempts"] === undefined ? 0 : dispatch["attempts"];
				app.q[QID][uuid] = dispatch;
				r = uuid;
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
				app.q[QID][UUID].status = STATUS;
				}
			return r;
			},
	
//used during dispatchThis to make sure only queued items are dispatched.
//returns items for the Q and sets status to 'requesting'.
//returns items in reverse order, so the dispatches occur as FIFO.
//in the actual DQ, the item id is the uuid. Here that gets dropped and the object id's start at zero (more friendly format for B).
//puuid is the parent/pipe uuid. it's added to the original dispatch for error handling
		filterQ : function(QID,puuid)	{
//			app.u.dump("BEGIN: filterQ");
//			app.u.dump(" -> QID = "+QID);
			
			var c = 0; //used to count how many dispatches are going into q. allows a 'break' if too many are present. is also 'index' of most recently added item in myQ.
			var myQ = new Array();
	//go through this backwards so that as items are removed, the changing .length is not impacting any items index that hasn't already been iterated through. 
			for(var index in app.q[QID]) {
//				app.u.dump(" -> CMD: "+app.q[QID][index]['_cmd']);
				if(app.q[QID][index].status == 'queued')	{
					app.q[QID][index]['status'] = "requesting";
					myQ.push($.extend(true,{},app.q[QID][index])); //creates a copy so that myQ can be manipulated without impacting actual Q. allows for _tag to be removed.
					if(puuid){app.q[QID][index]['pipeUUID'] = puuid}
//the following are blanked out because they're not 'supported' vars. eventually, we should move this all into _tag so only one field has to be blanked.
					delete myQ[c]['_tag']; //blank out rtag to make requests smaller. handleResponse will check if it's set and re-add it to pass into callback.
					delete myQ[c]['status'];
					delete myQ[c]['attempts'];
					c += 1;
//added on 2012-02-23
					if(c > app.globalAjax.numRequestsPerPipe){
						setTimeout("app.model.dispatchThis('"+QID+"');",500); //will fire off the remaining items in the q shortly.
						break //max of 100 dispatches at a time.
						}
					}
				}
//			app.u.dump("//END: filterQ. myQ length = "+myQ.length+" c = "+c);
			return myQ;
			}, //filterQ
		
//execute this function in the app itself when a request is/may be in progrees and the user changes course.
//for instance, if the user does a search for 'sho' then corrects to 'shoe' prior to the request being completed,
//you'd want to abort the request in favor of the new command (you would not want a callback executed on 'sho', so cancel it).
//for this reason, the passive q requests should NEVER have callbacks on them.
//and tho technically you 'could' pass immutable as the QID, you should never cancel an immutable request, as these should be saved for 'add to cart' or 'checkout' requests.
		abortQ : function(QID)	{
			app.u.dump("SANITY -> abortq is being run on "+QID); //output this so that when the red cancelled request shows in the console, we know why.
			app.globalAjax.overrideAttempts = 0;  //the q is being reset essentially. this needs to be reset to zero so attempts starts over. 
			var r = 0; //incremented with each cancelled request. returned.
			for(var index in app.globalAjax.requests[QID])	{
				app.globalAjax.requests[QID][index].abort();
//IMPORTANT
//this delete removes the ajax request from the requests array. keep that array only full of active requests.
				delete app.globalAjax.requests[QID][index];
				r +=1;
				}
//			app.globalAjax.requests.mutable = {}; //probably not needed since we're deleting these individually above. add back if needed.
			return r;
			},



//if a request is in progress and a immutable request is made, execute this function which will change the status's of the uuid(s) in question.
//function is also run when model.abortQ is executed.
//don't need a QID because only the general dispatchQ gets muted... for now. ### add support for multiple qids
		handleDualRequests : function()	{
			var inc = 0;
//			app.u.dump('BEGIN model.handleDualRequests');		
			for(var index in app.q.mutable) {
				if(app.q.mutable[index].status == 'requesting')	{
					app.model.changeDispatchStatusInQ('mutable',index,"muted"); //the task was dominated by another request
					inc += 1;
					}
				}
			return inc;
	//		app.u.dump('END model.handleDualRequests. '+inc+' requests set to overriden');
			},

//when an immutable request is in process, this is called which handles the re-attempts.
		handleReDispatch : function(QID)	{
			if(app.globalAjax.overrideAttempts < 30)	{
				setTimeout("app.model.dispatchThis('"+QID+"')",500); //try again soon. if the first attempt is still in progress, this code block will get re-executed till it succeeds.
				}
			else if(app.globalAjax.overrideAttempts < 60)	{
// slow down a bit. try every second for a bit and see if the last response has completed.
				setTimeout("app.model.dispatchThis('"+QID+"')",1000); //try again. if the first attempt is still in progress, this code block will get re-executed till it succeeds or until
				}
			else	{
				app.u.dump(' -> stopped trying to override because many attempts were already made.'); //!!! this needs to display an error message to the user saying connection seems to be lost or something.
				}			
			},
			
		
/*
	
sends dispatches with status of 'queued' in a single json request.
only high-level errors are handled here, such as an ISE returned from server, no connection, etc.
a successful request executes handleresponse (handleresponse executes the controller.response.success action)
note - a successful request just means that contact with the server was made. it does not mean the request itself didn't return errors.

QID = Queue ID.  Defaults to the general dispatchQ but allows for the PDQ to be used.

*/
	
		dispatchThis : function(QID)	{
//			app.u.dump("'BEGIN model.dispatchThis ["+QID+"]");
			var r = true; //set to false if no dispatch occurs. return value.
			QID = QID === undefined ? 'mutable' : QID; //default to the general Q, but allow for priorityQ to be passed in.
//used as the uuid on the 'parent' request (the one containing the pipelines).
//set this early so that it can be added to each request in the Q as pipeUUID for error handling.
//also used for ajax.requests[QID][UUID] which stores the ajax request itself (and is used for aborting later, if need be).
			var pipeUUID = app.model.fetchUUID(); 			
			
//			app.u.dump(' -> Focus Q = '+QID);

//by doing our filter first, we can see if there is even anything to BE dispatched before checking for conflicts.
//this decreases the likelyhood well set a timeout when not needed.
			var Q = app.model.filterQ(QID,pipeUUID); //filters out all non-queued dispatches. may set a limit to the # of dispatches too. 
			
			
			var immutableRequestInProgress = $.isEmptyObject(app.globalAjax.requests.immutable) ? false : true; //if empty, no request is in progress.
			var L = Q.length; //size of Q.
//			app.u.dump(" -> Q.length = "+Q.length);
//			app.u.dump("QID = "+QID+" and L = "+L+" and aRequestIsInProgress = "+aRequestIsInProgress);
			
			if(L == 0)	{
//				app.u.dump(" -> dispatch attempted, but q referenced has no 'queued' dispatches. Do nothing.");
				r = false; //nothing to dispatch.
				}
			else if(immutableRequestInProgress)	{
//				app.u.dump(" -> immutable dispatch in process. do NOT override. try again soon.");

				app.globalAjax.overrideAttempts += 1; //tracks how many times the request in progress has been attempted to be usurped.
				this.handleReQ(Q,QID);//changes status back to 'queued'  q.uuid.attempts not incremented (only increment only for requests that failed)

				this.handleReDispatch(QID); //does the set timeout to relaunch, if needed.
				r = false; //not moving forward with a dispatch because the one in process has priority.
				}

			else	{
//				app.u.dump(" -> DQ has queued dispatches. no request in process. Move along... Move along...");
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

app.globalAjax.lastDispatch = app.u.unixNow();
app.globalAjax.overrideAttempts = 0;

//IMPORTANT
/*
the delete in the success AND error callbacks removes the ajax request from the requests array. 
If this isn't done, attempts to see if an immutable or other request is in process will return inaccurate results. 
must be run before handleResponse so that if handleresponse executes any requests as part of a callback, no conflicts arise.
can't be added to a 'complete' because the complete callback gets executed after the success or error callback.
*/


	app.globalAjax.requests[QID][pipeUUID] = $.ajax({
		type: "POST",
		url: app.vars.jqurl,
		context : app,
		async: true,
		contentType : "text/json",
//		beforeSend: app.model.setHeader, //
		dataType:"json",
//ok to pass admin vars on non-admin session. They'll be ignored.
		data: JSON.stringify({"_uuid":pipeUUID,"_cartid": app.sessionId,"_cmd":"pipeline","@cmds":Q,"_clientid":app.vars._clientid,"_domain":app.vars.domain,"_userid":app.vars.userid,"_deviceid":app.vars.deviceid,"_authtoken":app.vars.authtoken,"_version":app.model.version})
		});
	app.globalAjax.requests[QID][pipeUUID].error(function(j, textStatus, errorThrown)	{
		if(textStatus == 'abort')	{
			delete app.globalAjax.requests[QID][pipeUUID];
			for(var index in Q) {
				app.model.changeDispatchStatusInQ(QID,Q[index]['_uuid'],'abort');
				}

			}
		else	{
			app.u.dump(' -> REQUEST FAILURE! Request returned high-level errors or did not request: textStatus = '+textStatus+' errorThrown = '+errorThrown);
			delete app.globalAjax.requests[QID][pipeUUID];
			app.model.handleCancellations(Q,QID);
			setTimeout("app.model.dispatchThis('"+QID+"')",1000); //try again. a dispatch is only attempted three times before it errors out.
			}
		});
	app.globalAjax.requests[QID][pipeUUID].success(function(d)	{
		delete app.globalAjax.requests[QID][pipeUUID];
		app.model.handleResponse(d);}
		)

				}

		return r;
	//		app.u.dump('//END dispatchThis');
		}, //dispatchThis
	
	
	
	/*
when an immutable request is in progress and another request comes in, the secondary requests are reset to queued.
 
the Q passed in is sometimes the 'already filtered' Q, not the entire dispatch Q. Makes for a smaller loop and only impacts these dispatches.
also, when dispatchThis is run again, any newly added dispatches WILL get dispatched (if in the same Q).
handleReQ is used in a few places. Sometimes you want to adjust the attempts (q.uuid.attempts) so that you max out after three (such as when a server error is returned in the response) and sometimes you don't want to adjust (such as when the q is adjusted because a priority dispatch was in progress).
set adjustAttempts to true to increment by 1.
*/
		handleReQ : function(Q,QID,adjustAttempts)	{
			var uuid;
			for(var index in Q) {
				uuid = Q[index]['_uuid'];
				app.model.changeDispatchStatusInQ(QID,uuid,'queued');
				}
			},

//run when a request fails, most likely due to an ISE

		handleCancellations : function(Q,QID)	{
			var uuid;
			for(var index in Q) {
				uuid = Q[index]['_uuid'];
				app.model.changeDispatchStatusInQ(QID,uuid,'cancelledDueToErrors');
//make sure a callback is defined.
				this.handleErrorByUUID(uuid,QID,{'errid':'ISE','persistant':true,'errmsg':'It seems something went wrong. Please try again or contact the site administrator if error persists. Sorry for any inconvenience. (mvc error: most likely a request failure [uuid = '+uuid+'])'})
				}
			},
	
	
	// --------------------------- HANDLERESPONSE FUNCTIONS --------------------------- \\
	
	
	
	handleErrorByUUID : function(UUID,QID,responseData)	{
		app.u.dump("BEGIN model.handleErrorByUUID ["+UUID+"]");
		if(QID && UUID && responseData)	{
			responseData['_rtag'] = responseData['_rtag'] || this.getRequestTag(UUID); //_tag is stripped at dispatch and readded. make sure it's present.
			if(responseData['_rtag'])	{
				var Q = app.q[QID];	
				if(Q[UUID]['_tag'] && Q[UUID]['_tag']['callback'])	{
					var callback = Q[UUID]['_tag']['callback'];
//callback is an anonymous function. Execute it.
					if(typeof callback == 'function')	{
						callback(responseData,UUID)
						}
//callback is defined in extension or controller as object (with onSuccess and maybe onError)
					else if(typeof callback == 'string')	{
						callback = Q[UUID]['_tag']['extension'] ? app.ext[Q[UUID]['_tag']['extension']].callbacks[Q[UUID]['_tag']['callback']] : app.callbacks[Q[UUID]['_tag']['callback']];
						if(typeof callback.onError == 'function'){
							callback.onError(responseData,UUID);
							}
						else{
							app.u.throwMessage(responseData);
							}
						}
					else	{
						//unknown type for callback.
						app.u.throwMessage(responseData);
						
						}
					}
//_rtag defined, but no callback.
				else	{
					app.u.dump(" -> callback not set");
					app.u.throwMessage(responseData);
					}
				}
//no callback is defined. throw generic messag
			else	{
				app.u.dump(" -> rtag not set");
				app.u.throwMessage(responseData);
				}			
			
			
			}
		else	{
			app.u.dump("WARNING! required params for handleErrorByUUID not all present:");
			app.u.dump(" -> UUID: "+UUID);
			app.u.dump(" -> QID: "+QID);
			app.u.dump(" -> typeof responseData: "+typeof responseData);
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
	
		handleResponse : function(responseData)	{
//			app.u.dump('BEGIN model.handleResponse.');
			
//if the request was not-pipelined or the 'parent' pipeline request contains errors, this would get executed.
//the handlereq function manages the error handling as well.
			if(responseData && !$.isEmptyObject(responseData))	{
				var uuid = responseData['_uuid'];
				var QID = this.whichQAmIFrom(uuid); //don't pass QID in. referenced var that could change before this block is executed.
//				app.u.dump(" -> responseData is set. UUID: "+uuid);
//if the error is on the parent/piped request, no qid will be set.
//if an iseerr occurs, than even in a pipelined request, errid will be returned on 'parent' and no individual responses are returned.
				if(responseData && (responseData['_rcmd'] == 'err' || responseData.errid))	{
					
//QID will b set if this is a NON pipelined request.
					if(QID)	{
						app.u.dump(' -> High Level Error in '+QID+' response!');
//					app.u.dump(responseData);
						this.handleErrorByUUID(responseData['_uuid'],QID,responseData);
						}
					else	{
//most likely, a pipelined request that failed at a high level.
						QID = this.getQIDFromPipeUUID(uuid) //will try to ascertain what QID to look into for error handling.
						responseData.errmsg = "Something has gone wrong. please try again or refresh. If the error persists, please contact the site administrator. ["+responseData.errmsg+"]";
						if(QID)	{
							var uuids = this.getUUIDsbyQIDandPipeUUID(QID,responseData['_uuid']);
//							app.u.dump(" -> uuids: "); app.u.dump(uuids);
							var L = uuids.length
							if(L)	{
								app.u.dump(" -> # uuids in failed pipe: "+L);
								for(var i = 0; i < L; i += 1)	{
									this.handleErrorByUUID(app.q[QID][uuids[i]]['_uuid'],QID,responseData);
									}
								}
							else	{app.u.throwMessage(responseData);} //don't suspect we'd get here, but best practice error handling would be to throw some error as opposed to nothing.
							
							}
						else	{
//still unable to determine Q. throw some generic error message along with response error.
							app.u.dump("ERROR! a high level error occured and the Q ID was unable to be determined.");
							app.u.throwMessage(responseData);
							}
						}
					}

//pipeline request
				else if(responseData && responseData['_rcmd'] == 'pipeline')	{
					
//					app.u.dump(' -> pipelined request. size = '+responseData['@rcmds'].length);

					for (var i = 0, j = responseData['@rcmds'].length; i < j; i += 1) {
// _tag is reassociated early so that the data is available as quick as possible, including in any custom handleResponse_ functions
//has to be called before writing to local because datapointer is in _tag
						responseData['@rcmds'][i]['_rtag'] = responseData['@rcmds'][i]['_rtag'] || this.getRequestTag(responseData['@rcmds'][i]['_uuid']); 
						this.writeToMemoryAndLocal(responseData['@rcmds'][i]);
						}

//handle all the call specific handlers.
					for (var i = 0, j = responseData['@rcmds'].length; i < j; i += 1) {
						responseData['@rcmds'][i].ts = app.u.unixNow()  //set a timestamp on local data
						if(typeof this['handleResponse_'+responseData['@rcmds'][i]['_rcmd']] == 'function')	{
							this['handleResponse_'+responseData['@rcmds'][i]['_rcmd']](responseData['@rcmds'][i])	//executes a function called handleResponse_X where X = _cmd, if it exists.
	//						app.u.dump("CUSTOM handleresponse defined for "+responseData['_rcmd']);
							} 
						else	{
		//					app.u.dump(' -> going straight to defaultAction');
							this.handleResponse_defaultAction(responseData['@rcmds'][i],null);
	//						app.u.dump("NO custom handleresponse defined for "+responseData['_rcmd']);
							}
						}
					}
//a solo successful request.
//the logic for the order here is the same as in the pipelined response, where it is documented.
				else {
					responseData['_rtag'] = responseData['_rtag'] || this.getRequestTag(responseData['_uuid']);
					this.writeToMemoryAndLocal(responseData['@rcmds'])
					if(responseData['_rcmd'] && typeof this['handleResponse_'+responseData['_rcmd']] == 'function')	{
	//					app.u.dump("CUSTOM handleresponse defined for "+responseData['_rcmd']);
						this['handleResponse_'+responseData['_rcmd']](responseData)	//executes a function called handleResponse_X where X = _cmd, if it exists.
						} 
					else	{
	//					app.u.dump("NO custom handleresponse defined for "+responseData['_rcmd']);
						this.handleResponse_defaultAction(responseData,null);
						}
					}
				}
			else	{
//if responseData isn't set, an uber-high level error occured.
					app.u.throwMessage("Uh oh! Something has gone very wrong with our app. We apologize for any inconvenience. Please try agian. If error persists, please contact the site administrator.");
				}
			}, //handleResponse


//this will remove data from both local storage AND memory.
//execute this on a field prior to a call when you want to ensure memory/local is not used (fresh data).
//admittedly, this isn't the best way to handle this. for 2013XX we'll have something better. ###
		destroy : function(key)	{
			delete app.data[key];
			localStorage.removeItem(key);
			},


//this will write the respose both to localStorage and into app.data
		writeToMemoryAndLocal : function(responseData)	{
//			app.u.dump("BEGIN model.writeToMemoryAndLocal");
//			app.u.dump(" -> responseData: "); app.u.dump( responseData );

			var datapointer = false;
			if(responseData['_rtag'])	{datapointer = responseData['_rtag']['datapointer']}

//			app.u.dump(" -> datapointer: "+datapointer);
//if datapointer is not set, data is automatically NOT saved to localstorage or memory.
//however, there is (ping) already, and could be more, cases where datapointers are set, but we don't want the data locally or in memory.
//so we have simple functions to check by command.
			if(datapointer && !app.model.responseHasErrors(responseData))	{
				if(this.thisGetsSavedToMemory(responseData['_rcmd']))	{
					app.data[datapointer] = responseData;
					}
				if(this.thisGetsSavedLocally(responseData['_rcmd']))	{
					app.storageFunctions.writeLocal(datapointer,responseData); //save to local storage, if feature is available.
					}
				}
			else	{
//catch. not writing to local. Either not necessary or an error occured.
				}
			
			}, //writeToMemoryAndLocal

		thisGetsSavedToMemory : function(cmd)	{
			var r = true;
			r = this.thisGetsSavedLocally(cmd); //anything not saved locally is automatically not saved to memory.
//an appPageGet request extends the original page object. (in case two separate requests come in for different attributes for the same category.
			if(cmd == 'appPageGet')	{r = false;}
			return r;
			},

//some commands should not get saved locally.
		thisGetsSavedLocally : function(cmd)	{
			var r = true; //what is returned. is set to false if the cmd should not get saved to local storage.
			if(cmd == 'cartSet')	{r = false} //changes to cart are saved in cart objects, not as individual changes.
			else if(cmd == 'ping')	{r = false}
			return r;
			},

	//gets called for each response in a pipelined request (or for the solo response in a non-pipelined request) in most cases. request-specific responses may opt to not run this, but most do.
		handleResponse_defaultAction : function(responseData)	{
//			app.u.dump('BEGIN handleResponse_defaultAction');
//			app.u.dump(responseData);
			var callback = false; //the callback name.
			var uuid = responseData['_uuid']; //referenced enough to justify saving to a var.
			var datapointer = null; //a callback can be set with no datapointer.
			var status = null; //status of request. will get set to 'error' or 'completed' later. set to null by defualt to track cases when not set to error or completed.
			var hasErrors = app.model.responseHasErrors(responseData);
			
//			app.u.dump(" -> responseData:"); app.u.dump(responseData);

			if(!$.isEmptyObject(responseData['_rtag']) && app.u.isSet(responseData['_rtag']['callback']))	{
	//callback has been defined in the call/response.
				callback = responseData['_rtag']['callback']; //shortcut
//				app.u.dump(' -> callback: '+callback);
				if(typeof callback == 'function'){} //do nothing to callback. will get executed later.
				else if(responseData['_rtag']['extension'] && !$.isEmptyObject(app.ext[responseData['_rtag']['extension']].callbacks[callback]))	{
					callback = app.ext[responseData['_rtag']['extension']].callbacks[callback];
//					app.u.dump(' -> callback node exists in app.ext['+responseData['_rtag']['extension']+'].callbacks');
					}
				else if(!$.isEmptyObject(app.callbacks[callback]))	{
					callback = app.callbacks[callback];
//					app.u.dump(' -> callback node exists in app.callbacks');
					}
				else	{
					callback = false;
					app.u.dump(' -> WARNING! callback defined but does not exist.');
					}
				}
			else	{callback = false;} //no callback defined.
	
//if no datapointer is set, the response data is not saved to local storage or into the app. (add to cart, ping, etc)
//effectively, a request occured but no data manipulation is required and/or available.
//likewise, if there's an error in the response, no point saving this locally. 
			if(!$.isEmptyObject(responseData['_rtag']) && app.u.isSet(responseData['_rtag']['datapointer']) && hasErrors == false)	{
				datapointer = responseData['_rtag']['datapointer'];
//on a ping, it is possible a datapointer may be set but we DO NOT want to write the pings response over that data, so we ignore pings.
//an appPageGet request needs the requested data to extend the original page object. (in case two separate request come in for different attributes for the same category.	
				if(responseData['_rcmd'] == 'ping' || responseData['_rcmd'] == 'appPageGet')	{

					}
				else	{
					app.data[datapointer] = responseData;
					app.storageFunctions.writeLocal(datapointer,responseData); //save to local storage, if feature is available.
					}
				}
			else	{
	//			app.u.dump(' -> no datapointer set for uuid '+uuid);
				}

//errors present and a defined action for handling those errors is defined.
			if(hasErrors && callback)	{
				if(typeof callback == 'function')	{
					callback(responseData,uuid); //if an anonymous function is passed in, it handles does it's own error handling.
					}
				else if(typeof callback == 'object' && typeof callback.onError == 'function'){
/*
below, responseData['_rtag'] was passed instead of uuid, but that's already available as part of the first var passed in.
uuid is more useful because on a high level error, rtag isn't passed back in responseData. this way uuid can be used to look up originat _tag obj.
*/
					callback.onError(responseData,uuid);
					}
				else if(typeof callback == 'object' && typeof app.u.throwMessage === 'function')	{
//callback defined but no error case defined. use default error handling.
					app.u.throwMessage(responseData);					
					}
				else{
					app.u.dump('ERROR response for uuid '+uuid+'. callback defined but does not exist or is not valid type. callback = '+callback+' datapointer = '+datapointer)
					}
				status = 'error';
				}
//has errors but no error handler declared. use default
			else if(hasErrors && typeof app.u.throwMessage === 'function')	{
				app.u.throwMessage(responseData);
				status = 'error';
				}
//no errors. no callback.
			else if(callback == false)	{
				status = 'completed';
	//			app.u.dump(' --> no callback set in original dispatch. dq set to completed for uuid ('+uuid+')');
				}
//to get here, no errors are present AND a callback is defined.
			else	{
				status = 'completed';
				if(typeof callback == 'function')	{
					callback(responseData._rtag);
					}
				else if(typeof callback == 'object' && typeof callback.onSuccess == 'function')	{
					callback.onSuccess(responseData['_rtag']); //executes the onSuccess for the callback
					}
				else{
					app.u.dump(' -> successful response for uuid '+uuid+'. callback defined ('+callback+') but does not exist or is not valid type.')
					}
				}
			app.q[app.model.whichQAmIFrom(uuid)][Number(uuid)]['status'] = status;
			return status;
		},
	
//after an order is created, the 'old' cart data gets saved into an order| for quick reference. 
		handleResponse_adminOrderCreate : function(responseData)	{
			this.handleResponse_cartOrderCreate(responseData); //share the same actions. append as needed.
			},
	
	//this function gets executed upon a successful request for a create order.
	//saves a copy of the old cart object to order|ORDERID in both local and memory for later reference (invoice, upsells, etc).
		handleResponse_cartOrderCreate : function(responseData)	{
	//currently, there are no errors at this level. If a connection or some other critical error occured, this point would not have been reached.
			app.u.dump("BEGIN model.handleResponse_createOrder ["+responseData.orderid+"]");
			var datapointer = "order|"+responseData.orderid;
			app.storageFunctions.writeLocal(datapointer,app.data.cartDetail);  //save order locally to make it available for upselling et all.
			app.data[datapointer] = app.data.cartDetail; //saved to object as well for easy access.
	//nuke cc fields, if present.		
			app.data[datapointer].cart['payment/cc'] = null;
			app.data[datapointer].cart['payment/cv'] = null;
			app.model.handleResponse_defaultAction(responseData); //datapointer ommited because data already saved.
			return responseData.orderid;
			}, //handleResponse_cartOrderCreate
	
	
//no special error handling or anything like that.  this is just here to get the category safe id into the response for easy reference.	
		handleResponse_appCategoryDetail : function(responseData)	{
//			app.u.dump("BEGIN model.handleResponse_appCategoryDetail");
//save detail into response to make it easier to see what level of data has been requested during a fetch or call
			if(responseData['_rtag'] && responseData['_rtag'].detail){
				responseData.detail = responseData['_rtag'].detail;
				}
			if(responseData['@products'] && !$.isEmptyObject(responseData['@products']))	{
				responseData['@products'] = $.grep(responseData['@products'],function(n){return(n);}); //strip blanks
				}
			if(responseData['_rtag'] && responseData['_rtag'].datapointer)
				responseData.id = responseData['_rtag'].datapointer.split('|')[1]; //safe id into data for easy reference.
			app.model.handleResponse_defaultAction(responseData);
			return responseData.id;
			}, //handleResponse_categoryDetail


/*
It is possible that multiple requests for page content could come in for the same page at different times.
so to ensure saving to appPageGet|.safe doesn't save over previously requested data, we extend it the ['%page'] object.
*/
		handleResponse_appPageGet : function(responseData)	{
			if(responseData['_rtag'] && responseData['_rtag'].datapointer)	{
				var datapointer = responseData['_rtag'].datapointer;
				if(app.data[datapointer])	{
					//already exists.  extend the %page
					app.data[datapointer]['%page'] = $.extend(app.data[datapointer]['%page'],responseData['%page']);
					}
				else	{
					app.data[datapointer] = responseData;
					}
				app.storageFunctions.writeLocal(datapointer,app.data[datapointer]); //save to local storage, if feature is available.
				}
			app.model.handleResponse_defaultAction(responseData);
			}, //handleResponse_appPageGet




		handleResponse_authAdminLogin: function(responseData)	{
			app.u.dump("BEGIN model.handleResponse_authAdminLogin"); //app.u.dump(responseData);
			app.vars.deviceid = responseData.deviceid;
			app.vars.authtoken = responseData.authtoken;
			app.vars.userid = responseData.userid.toLowerCase();
			app.vars.username = responseData.username.toLowerCase();
			app.vars.thisSessionIsAdmin = true;
			app.model.handleResponse_defaultAction(responseData); //datapointer ommited because data already saved.
			},

		handleResponse_appCartExists : function(responseData)	{
			if(responseData.exists >= 1)	{
				this.handleResponse_appCartCreate(responseData); //saves session data locally and into control.
				}
			else	{
/* nuke references to old, invalid session id. if this doesn't happen, the old session ID gets passed and will be re-issued. */				
				app.sessionId = null;
				app.storageFunctions.writeLocal('cartid',null);
				app.model.handleResponse_defaultAction(responseData); //datapointer ommited because data already saved.
				}
			},

//this function gets executed upon a successful request for a new session id.
//it is also executed if appAdminAuthenticate returns exists=1 (yes, you can).
//formerly newSession
		handleResponse_appCartCreate : function(responseData)	{
//			app.u.dump(" --> appCartCreate Response executed. ("+responseData['_uuid']+")");
//			app.u.dump("RESPONSE DATA:");
//			app.u.dump(responseData);

//ensure no cross-account data polution on shared domain. this only happens if cart is not valid. If valid, local data should be for account in focus.
//the cart/session will immediately get added back to local storage below.
			if(window.location.href.indexOf('ssl.zoovy') > -1)	{localStorage.clear();}

//no error handling at this level. If a connection or some other critical error occured, this point would not have been reached.
//save session id locally to maintain session id throughout user experience.	
			app.storageFunctions.writeLocal('sessionId',responseData['_cartid']);
//			app.storageFunctions.writeLocal(app.vars['username']+"-cartid",responseData['_cartid']);  
			app.sessionId = responseData['_cartid']; //saved to object as well for easy access.
			app.model.handleResponse_defaultAction(responseData); //datapointer ommited because data already saved.
			app.u.dump("sessionID = "+responseData['_cartid']);
			return responseData['_cartid'];
			}, //handleResponse_appCartCreate
	
/*
in most cases, the errors are handled well by the API and returned either as a single message (errmsg)
or as a series of messages (_msg_X_id) where X is incremented depending on the number of errors.
*/	
		responseHasErrors : function(responseData)	{
//			app.u.dump('BEGIN model.responseHasErrors');
//			app.u.dump(" -> responseData"); app.u.dump(responseData);
//at the time of this version, some requests don't have especially good warning/error in the response.
//as response error handling is improved, this function may no longer be necessary.
			var r = false; //defaults to no errors found.
			if(responseData['_rtag'] && responseData['_rtag'].forceError == 1)	{r = true; responseData.errid = "MVC-M-000"; responseData.errtype = "intendedErr"; responseData.errmsg = "forceError is set to 1 on _tag. cmd = "+responseData['_rcmd']+" and uuid = "+responseData['_uuid'];
//			app.u.dump(responseData);
				}
			else	{
				switch(responseData['_rcmd'])	{
					case 'appProductGet':
	//the API doesn't recognize doing a query for a sku and it not existing as being an error. handle it that way tho.
						if(!responseData['%attribs'] || !responseData['%attribs']['db:id']) {
							r = true;
							responseData['errid'] = "MVC-M-100";
							responseData['errtype'] = "apperr"; 
							responseData['errmsg'] = "could not find product "+responseData.pid+". Product may no longer exist. ";
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
		//				app.u.dump(' -> case = createOrder');
						if(!app.u.isSet(responseData['orderid']))	{
		//					app.u.dump(' -> request has errors. orderid not set. orderid = '+responseData['orderid']);
							r = true;
							}  
						break;
					default:
						if(responseData['_msgs'] > 0 && responseData['_msg_1_id'] > 0)	{r = true} //chances are, this is an error. may need tuning later.
						if(responseData['errid'] > 0) {r = true}
		//				app.u.dump('default case for error handling');
						break;
					}
				}
	//		app.u.dump('//END responseHasErrors. has errors = '+r);
			return r;
			},
	
	
	// --------------------------- FETCH FUNCTIONS --------------------------- \\
	
	
	
	/*
	each request must have a uuid (Unique Universal IDentifyer).
	the uuid is also the item id in the dispatchQ. makes finding dispatches in Q faster/easier.
	
	first check to see if the uuid is set in the app. currently, this is considered a 'trusted' source and no validation is done.
	then check local storage/cookie. if it IS set and the +1 integer is not set in the DQ, use it.
	if local isn't set or is determined to be inaccurate (local + 1 is already set in DQ)
	 -> default to 999 if DQ is empty, which will start uuid's at 1000.
	 -> or if items are in the Q get the last entry and treat it as a number (this should only happen once in a session, in theory).
	
	*/
	
		fetchUUID : function()	{
//			app.u.dump('BEGIN fetchUUID');
			var uuid = false; //return value
			var L;
			
			if(app.vars.uuid)	{
	//			app.u.dump(' -> isSet in app. use it.');
				uuid = app.vars.uuid; //have to, at some point, assume app integrity. if the uuid is set in the control, trust it.
				}
//in this else, the L is set to =, not == because it's setting itself to the value of the return of readLocal so readLocal doesn't have to be executed twice.
			else if(L = app.storageFunctions.readLocal("uuid"))	{
				L = Math.ceil(L * 1); //round it up (was occassionally get fractions for some odd reason) and treat as number.
	//			app.u.dump(' -> isSet in local ('+L+' and typof = '+typeof L+')');
				if($.isEmptyObject(app.q.mutable[L+1]) && $.isEmptyObject(app.q.immutable[L+1]) && $.isEmptyObject(app.q.passive[L+1])){
					uuid = L;
	//				app.u.dump(' -> local + 1 is empty. set uuid to local');
					}
				}
	//generate a new uuid if it isn't already set or it isn't an integer.
			if(uuid == false || isNaN(uuid))	{
	//			app.u.dump(' -> uuid not set in local OR local + 1 is already set in dispatchQ');
				if(app.q.mutable.length + app.q.immutable.length + app.q.passive.length == 0)	{
	//				app.u.dump(' -> setting default uuid');
					uuid = 999;
					}
				else	{

	//				uuid = math.max(model.getLastIndex(app.q.mutable),model.getLastIndex(app.q.immutable))  // 'math' not univerally supported.
//get last request in both q's and determine the larger uuid for use.
//  #### improve this.
					var lastImutableUUID = app.model.getLastIndex(app.q.immutable);
					var lastMutableUUID = app.model.getLastIndex(app.q.mutable);
					var lastPassiveUUID = app.model.getLastIndex(app.q.passive);
					uuid = lastMutableUUID >lastImutableUUID ? lastMutableUUID : lastImutableUUID;
					uuid = uuid > lastPassiveUUID ? uuid : lastPassiveUUID;
					}
				}
	
			uuid += 1;
			app.vars.uuid = uuid;
			app.storageFunctions.writeLocal('uuid',uuid); //save it locally.
	//		app.u.dump('//END fetchUUID. uuid = '+uuid);
			return uuid;
			}, //fetchUUID
	
//currently, only three q's are present.  if more q's are added, this will need to be expanded. ###
// ### loop through app.q and get value that way.
		whichQAmIFrom : function(uuid)	{
			var r;
			if(typeof app.q.mutable[uuid] !== 'undefined')
				r = 'mutable'
			else if(typeof app.q.immutable[uuid] !== 'undefined')
				r = 'immutable'
			else if(typeof app.q.passive[uuid] !== 'undefined')
				r = 'passive'
			else	{
//not found in a matching q.  odd.
				r = false;
				}

//			app.u.dump('whichQAmIFrom = '+r+' and uuid = '+uuid );
			return r;
			}, //whichQAmIFrom


		getUUIDsbyQIDandPipeUUID : function(QID,pipeUUID)	{
			var r = new Array();
			for(index in app.q[QID])	{
				if(app.q[QID][index]['pipeUUID'] == pipeUUID)	{
					r.push(app.q[QID][index]['_uuid']);
					}
				}
			return r;			
			},

		checkForPipeUUIDInQID : function(QID,pipeUUID)	{
			var r = false;
			for(index in app.q[QID])	{
				if(app.q[QID][index]['pipeUUID'] == pipeUUID)	{
					r = true;
					break; //end once we have a match. pipeuuid is specific to one Q
					}
				}
			return r;
			},

		getQIDFromPipeUUID : function(pipeUUID){
			app.u.dump("BEGIN model.getQIDFromPipeUUID ["+pipeUUID+"]");
			var r = false; //what is returned.
			if(this.checkForPipeUUIDInQID('immutable',pipeUUID))	{r = 'immutable'}
			else if(this.checkForPipeUUIDInQID('mutable',pipeUUID))	{r = 'mutable'}
			else if(this.checkForPipeUUIDInQID('passive',pipeUUID))	{r = 'passive'}
			else	{
				//pipeUUID is not in any known Q
				}
			app.u.dump(" -> pipeUUID: "+pipeUUID+" and qid: "+r);
			return r;
			},


//will get the _tag object from this request in it's original q. allows for _tag to NOT be pased in request, making for smaller requests.
//this will (eventually) allow for the callback itself to be an anonymous function.
		getRequestTag : function(uuid,qid){
			var r = false; //what is retured. Either false (unable to get tag) or the tag object itself.
			if(uuid)	{
//try to figure out which qid request was in.
				if(!qid)	{
					qid = this.whichQAmIFrom(uuid)
					}
				
//				app.u.dump(" -> uuid: "+uuid+" and QID: "+qid);
				
				if(qid && app.q[qid][uuid])	{
//					app.u.dump(" -> app.q[qid][uuid]: "); app.u.dump(app.q[qid][uuid]);
					r = app.q[qid][uuid]['_tag'] //will set r either to the object or undefined, if not set.
					}
				}
			else	{
				//uuid is required.
				}
			return r;
			},
	
	//gets session id. The session id is used a ton.  It is saved to app.sessionId as well as a cookie and, if supported, localStorage.
	//Check to see if it's already set. If not, request a new session via ajax.
		fetchSessionId : function(callback)	{
//			app.u.dump('BEGIN: model.fetchSessionId');
			var s = false;
			if(app.sessionId)	{
//				app.u.dump(' -> sessionId is set in control');
				s = app.sessionId
				}
//sets s as part of else if so getLocal doesn't need to be run twice.
			else if(s = app.storageFunctions.readLocal('sessionId'))	{
//				app.u.dump(' -> sessionId is set in local from previous ajax session');										 
				}
//see note in handleResponse_appCartCreate to learn why this is commented out.
//			else if(s = app.storageFunctions.readLocal(app['username']+"-cartid"))	{
//				app.u.dump(' -> sessionId is set in local from cookie. possibly from storefront session (non-ajax)');
//				}
			else	{
//catch all.  returns false.
//				app.u.dump(' -> no session id in control or local.');
				}
	//		app.u.dump("//END: fetchSessionId. s = "+s);
			
			return s;
			}, //fetchSessionId
	
/*
Returns T or F.
will check to see if the datapointer is already in the app.data. (returns true)
if not, will check to see if data is in local storage and if so, save it to app.data IF the data isn't too old. (returns true)
will return false if datapointer isn't in app.data or local (or if it's too old).
*/
	
	
		fetchData : function(datapointer)	{
//			app.u.dump("BEGIN model.fetchData.");
//			app.u.dump(" -> datapointer = "+datapointer);
			var local;
			var r = false;
			var expires = datapointer == 'authAdminLogin' ? (60*60*24*7) : (60*60*24); //how old the data can be before we fetch new.
	//checks to see if the request is already in 'this'.
			if(app.data && !$.isEmptyObject(app.data[datapointer]))	{
//				app.u.dump(' -> control already has data');
				r = true;
				}
//then check local storage and, if present, update the control object
			else if (local = app.storageFunctions.readLocal(datapointer))	{
//				app.u.dump(' -> local does have data.');
	//			app.u.dump(local);
				if(local.ts)	{
					if((app.u.unixNow() - local.ts) > expires)	{
						r = false; // data is more than 24 hours old.
						}
					else	{
						app.data[datapointer] = local;
						r = true;
						}
					}
				else	{
//					app.u.dump(' -> data is local, but old.');
	//hhhmmm... data is in local, but no ts is set. better get new data.
					r = false;
					}
				}
			else	{
//				app.u.dump(' -> data not in memory or local storage.');
				}

//set app.globalAjax.checkForLocalJSON to true and the app will look for local copies (not local storage) of the json
			if(r === false && app.globalAjax.checkForLocalJSON)	{
				if(app.globalAjax.localJSONFolder)	{
//				app.u.dump(" -> Data not in memory or local.");
					if(datapointer.indexOf("appProductGet") > -1)	{
						pid = datapointer.split("|")[1]
						var result = $.ajax({
							type: "GET",
							url: app.globalAjax.localJSONFolder+"/pid="+pid+".json",
							async: false,
							dataType:"json"
							})
						result.success(function(d){
							r = true;
							app.data[datapointer] = d;
						app.u.dump(" -> d: ");
						app.u.dump(d);
							});
						result.error(function(){
							r = false;
							});
	
						}
					}
				else	{
					app.u.dump("WARNING! checkForLocalJSON enabled but localJSONFolder not set.");
					}
				}
//			app.u.dump("END fetchData for "+datapointer+". r = "+r);
			return r;
			}, //fetchData
	
	
	
	/* functions for extending the controller (adding extensions and templates) */
	
	
	
			
//Gets executed fairly early in the init process. Starts the process of adding the extension.

		addExtensions : function(extObj)	{
//			app.u.dump('BEGIN model.addExtensions');
//			app.u.dump(extObj);
			var r = false; //what is returned. false if no extensions are loaded or the # of extensions
			if(typeof extObj == 'object')	{

//				app.u.dump(' -> valid extension object containing '+extObj.length+' extensions');
				var L = extObj.length;
				r = L; //return the size of the extension object 
				for(var i = 0; i < L; i += 1) {
//					app.u.dump(" -> i: "+i);
//namespace and filename are required for any extension.
					if(!extObj[i].namespace || !extObj[i].filename)	{
						if(extObj.callback && typeof extObj.callback == 'string')	{
							extObj[i].callback.onError("Extension did not load because namespace ["+extObj[i].namespace+"] and/or filename ["+extObj[i].filename+"]  not set",'')
							}
						app.u.dump(" -> extension did not load because namespace ("+extObj[i].namespace+") or filename ("+extObj[i].filename+") was left blank.");
						continue; //go to next index in loop.
						}
					else if (typeof window[extObj[i].namespace] == 'function')	{
//						app.u.dump(" -> extension already loaded. namespace: "+extObj[i].namespace);
						var errors = app.model.loadAndVerifyExtension(extObj[i]);
						//extension has already been imported. Here for cases where extensions are added as part of preloader (init.js)
						}
					else	{
//						app.u.dump(" -> fetch extension: "+extObj[i].namespace);
						app.model.fetchExtension(extObj[i],i);
						}
					} // end loop.
				app.model.executeCallbacksWhenExtensionsAreReady(extObj); //reexecutes itself. will execute callbacks when all extensions are loaded.
				}
			else	{
				app.u.dump("CAUTION! no extensions were loaded. This may not be an error. there may not be any extensions. seems unlikely though.");
				}
			
			return r;
//			app.u.dump('END model.addExtension');
			},	
	
	
	
//$templateSpec = the jquery obj for the template.
//templateID is how the template will be referenced in app.templates.
		makeTemplate : function($templateSpec,templateID)	{
			var r = true; //what is returned. if a template is created, true is returned.
			if(templateID && typeof $templateSpec == 'object')	{
				app.templates[templateID] = $templateSpec.attr('data-templateid',templateID).clone();
				$('#'+templateID).empty().remove(); //here for templates created from existing DOM elements. They're removed to ensure no duplicate ID's exist.
				}
			else	{
				r = false;
				app.u.dump("WARNING! - model.makeTemplate executed but no templateID and/or template object specified.");
				}
			return r;
			},
	
//pass in an array of template id's and they'll get added to the app.templates object.
//the id's must already be in the DOM by this point.
		loadTemplates : function(templates)	{
	//		app.u.dump("BEGIN model.loadTemplates")
			var L = templates.length
	
	//		app.u.dump("model.loadTemplates for "+namespace);
			var errors = ''; //what is returned.  if not false, errors are present (and returned)
			var templateID; //used for a quick reference to which id in the loop is in focus.
			var $templateSpec; //used to store the template/spec itself for the template.
	//		app.u.dump(" -> loading "+L+" templates ");
			for(var i = 0; i < L; i += 1)	{
				templateID = templates[i];
				$templateSpec = $('#'+templateID);
	//			app.u.dump(" -> templateID: "+templateID);
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
//templates is an array of element id's that are present in the .html file.
//an ajax request is made to load the .html file and, if successful, the templates are loaded into app.templates.

		fetchNLoadTemplates : function(templateURL,templates)	{
//			app.u.dump("BEGIN model.fetchNLoadTemplates");
//			app.u.dump(" -> templateURL: "+templateURL);
	//		app.u.dump(" -> templates: "+templates);
			var ajaxRequest = $.ajax({
					type: "GET",
					url: templateURL+"?_v="+app.vars.release,
					async: false,
					dataType:"html"
					});	//this.fetchFileViaAjax(templateURL);
			
			ajaxRequest.error(function(d,e,f){
				// the templates not loading is pretty much a catastrophic issue.
				app.u.throwMessage("An error has occured.<br \/>Unable to load remote templates for extension (dev - see console for more details).<br \/>If the error persists, please contact Zoovy technical support.",true);			
				app.u.dump("ERROR! unable to load remote templates");
				app.u.dump("templateURL: "+templateURL);
				app.u.dump(e);
				app.u.dump(d.statusText);
				});
	
			ajaxRequest.success(function(data){
	//			app.u.dump("template file loaded successfully.");
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
				var templateErrors = app.model.loadTemplates(templates);
				if(templateErrors)	{
					app.u.throwMessage(templateErrors,true);
	//				app.u.dump(templateErrors);
					}
				});
			return ajaxRequest;
			}, //fetchNLoadTemplates 


			loadAndVerifyExtension : function(extObjItem)	{
				var url = extObjItem.filename;
				var namespace = extObjItem.namespace; //for easy reference.
				var errors = ""; // list of errors. what is returned
//the .js file for the extension contains a function matching the namespace used.
//the following line executes that function and saves the object returned to the control.
//this is essentially what makes the extension available for use.
//immediately after the data is loaded into the control, the extension.namespace.callbacks.init is run.  This is where any system settings should be checked/reported.
//data is saved to the control prior to template/view verification because we need access to the object.
//yes, technically we could have saved it to a var, accessed the templates param, validated and NOT saved, but this is lighter.
//it means that a developer could use an extension that didn't load properly, but that is their perogative, since we told them its broke.
				app.ext[namespace] = eval(namespace+'()'); //keep this as early in the process as possible so it's done before the next extension loads.

				var callback = extObjItem.callback; //for easy reference.
//						app.u.dump(" -> typeof callback: "+typeof callback);
				if(typeof app.ext[namespace].callbacks.init === 'object')	{
//							app.u.dump(" typeof === object");
					var initPassed = app.ext[namespace].callbacks.init.onSuccess(); //returns t/f
//							app.u.dump(" -> "+namespace+" onSuccess response = "+initPassed);
					}
				else	{
//no init was set in extension.  Init handles dependencies and should be present. For now, we'll trust that the developer had a good reason for not having an init and continue.
					app.u.dump("WARNING: extension "+namespace+" did NOT have an init. This is very bad.");
					errors += "<li>init not set for extension "+namespace;
					}
//whether init passed or failed, load the templates. That way any errors that occur as a result of missing templates are also displayed.
//If the extension sets willfetchmyowntemplates, then no need to run template load code, the extension will handle adding it's own templates.
//						app.u.dump(" -> templates.length = "+app.ext[namespace].vars.templates.length);
				if(app.ext[namespace].vars && app.ext[namespace].vars.templates && !app.ext[namespace].vars.willFetchMyOwnTemplates)	{
					errors += app.model.loadTemplates(app.ext[namespace].vars.templates);
					}
				else	{
//							app.u.dump("WARNING: extension "+namespace+" did not define any templates. This 'may' valid, as some extensions may have no templates.");
					}

/*
now we know whether the extension properly loaded, had and executed an init and has a callback.
respond accordingly.
*/

				if(initPassed == false)	{
					app.u.throwMessage("Uh Oh! Something went wrong with our app. We apologize for any inconvenience. (err: "+namespace+" extension did not pass init)",true);
					}
//errors would be populated if, say, no init is set.
				else if(errors)	{
					app.u.dump(" -> extension contained errors. callback not executed yet.");
					app.u.dump(" -> "+errors);
					app.u.throwMessage("Extension "+namespace+" contains the following error(s):<ul>"+errors+"<\/ul>",true);

//the line above handles the errors. however, in some cases a template may want additional error handling so the errors are passed in to the onError callback.
					if(app.ext[namespace].callbacks.onError)	{
//								app.u.dump(" -> executing callback.onError.");
						app.ext[namespace].callbacks.onError("<div>Extension "+namespace+" contains the following error(s):<ul>"+errors+"<\/ul><\/div>",'');
						}							
					}
				else	{
//							app.u.dump(" -> extension "+namespace+" loaded fine but contained no callback");
					}

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

namespace - the extension is saved to app.ext.namespace and would be 'called' using that name. (app.ext.namespace.calls.somecall.init()
extension - the filename. full path.
callback - a function to be executed once the extension is done loading.

the 'convertSessionToOrder' namespace is reserved for checkout. only 1 checkout extension can be loaded at a time.
use a unique naming convention for any custom extensions, such as username_someusefulhint (ex: cubworld_jerseybuilder)

The ajax request itself (fetchExtension) was originally in the addExtension function in the loop.  This caused issues.
only one extension was getting loaded, but it got loaded for each iteration in the loop. even with async turned off.

*/
		
		fetchExtension : function(extObjItem)	{
//			app.u.dump('BEGIN model.fetchExtention ['+extObjItem.namespace+']');
			var errors = '';
			var url = extObjItem.filename;
			var namespace = extObjItem.namespace; //for easy reference.
//			app.u.dump(' -> url = '+url);
		
			var ajaxLoadExt = $.ajax({
				url: url,
///				async: 0, //testing... 
				dataType: 'script',
				success: function(data) {
	//The 'success' can be executed prior to the script finishing loading so the heavy lifting happens in 'complete'.
//					app.u.dump(" -> EXTCONTROL Got to success");
					},
				complete: function(data)	{
//					app.u.dump(" -> EXTCONTROL got to complete for "+namespace);
//					app.u.dump(" -> status = "+data.statusText);
//hhhhmmm... was originally just checking success. now it checks success and OK (2011-01-11). probably need to improve this at some point.
					if(data.statusText == 'success' || data.statusText == 'OK')	{
//						app.u.dump(" -> adding extension to controller");
						errors = app.model.loadAndVerifyExtension(extObjItem);
						}
					},
				error: function(a,b,c) {
					var msg = app.u.errMsgObject("Oops! It appears something went wrong with our app. If error persists, please contact the site administrator.<br \/>(error: ext "+extObjItem.namespace+" had error type "+b+")",123);
					msg.persistant = true;
					app.u.throwMessage(msg);
					app.u.dump(" -> EXTCONTROL ("+namespace+")Got to error. error type = "+b+" c = ");
					app.u.dump(c);
					}
				});
			},

		executeExtensionCallback : function(namespace,callback)	{
			if(namespace && callback)	{
				if(typeof callback == 'function'){eval(callback)}
				else if(typeof callback == 'string' && typeof app.ext[namespace] == 'object' && typeof app.ext[namespace].callbacks[callback] == 'object')	{
					app.ext[namespace].callbacks[callback].onSuccess()
					}
				else if(typeof callback == 'string')	{
					app.u.dump("WARNING! callback ["+callback+"] defined for namespace: "+namespace+" but something went wrong");
					app.u.dump(" -> typeof app.ext[namespace]: "+typeof app.ext[namespace]);
					if(typeof app.ext[namespace] == 'object')	{app.u.dump(app.ext[namespace].callbacks[callback]);}
					}
				else	{app.u.dump("!Unknown type ["+typeof callback+"] for extension callback ");}
				}
			else	{
				app.u.dump("WARNING!  either namespace ["+namespace+"] or callback ["+callback+"] was undefined in model.executeExtensionCallback");
				}
			}, //executeExtensionCallback


//verifies that all the templates for a given extension/namespace have been loaded.
		allTemplatesForThisExtensionHaveLoaded : function(namespace)	{
//			app.u.dump("BEGIN model.allTemplatesForThisExtensionHaveLoaded ["+namespace+"]");
			var r = true; //what is returned. t/f based on whether or not all the templates extensions have loaded.
			var templateID; //shortcut.
			if(app.ext[namespace].vars && app.ext[namespace].vars.templates)	{
				var L = app.ext[namespace].vars.templates.length;
//				app.u.dump(" -> L: "+L);
				for(var i = 0; i < L; i += 1)	{
					templateID = app.ext[namespace].vars.templates[i];
					if(typeof app.templates[templateID] != 'object'){r = false}
					}
				}
//			app.u.dump("END model.allTemplatesForThisExtensionHaveLoaded ["+r+"]");
			return r;
			}, //allTemplatesForThisExtensionHaveLoaded

/*
loop through control. object and make sure all the extensions have completely loaded.
This is checks for two things:
1. is the namespace set in the control object.
2. are all the templates for each extension loaded.
*/

		allExtensionsHaveLoaded : function(extObj)	{
//			app.u.dump("BEGIN model.allExtensionsHaveLoaded. extObj: "); app.u.dump(extObj);

			var r = true; //what is returned (whether or not all extensions have loaded.
			var L = extObj.length;
//			app.u.dump(" -> L: "+L);
			var namespace; //shortcut.
			for(var i = 0; i < L; i += 1) {
				namespace = extObj[i].namespace;
				if(typeof app.ext[namespace] == 'object')	{
					if(!this.allTemplatesForThisExtensionHaveLoaded(namespace)){
						r = false;
						break;
						}
					}
				else	{
					app.u.dump(' -> waiting on: '+namespace);
					r = false;
					break;
					}
				}
//			app.u.dump("END model.allExtensionsHaveLoaded ["+r+"]");
			return r;
			}, //allExtensionsHaveLoaded
		
//function gets executed in addExtensions. If the extensions are loaded, it'll execute the callbacks.
// if not, it will re-execute itself.
		executeCallbacksWhenExtensionsAreReady : function(extObj,attempts){
//			app.u.dump("BEGIN model.executeCallbacksWhenExtensionsAreReady [length: "+extObj.length+"]");
			if(this.allExtensionsHaveLoaded(extObj))	{
//				app.u.dump("extension(s) loaded. execute callbacks.");
				var L = extObj.length;
				for(var i = 0; i < L; i += 1) {
//					app.u.dump(" -> i: "+i);
//namespace and filename are required for any extension.
					if(extObj[i].callback)	{
						app.model.executeExtensionCallback(extObj[i].namespace,extObj[i].callback);
						}
					else	{
						//no callback defined. no worries.
						}
					} // end loop.				
				}
			else if(attempts > 40)	{
				//that is a lot of tries.
				throwGMessage(" some extensions took at least ten seconds to load. That's no good");
				}
			else	{
				setTimeout(function(){app.model.executeCallbacksWhenExtensionsAreReady(extObj,attempts)},250);
				}
			attempts++;
			}, //executeCallbacksWhenExtensionsAreReady
		
//setHeader always gets run, but the admin headers are only added if the global admin var is true.
// if set to true and in a non-admin mode, won't hurt anything, but is less clean.
		setHeader : function(xhr){
//			xhr.setRequestHeader('x-auth','sporks');
			if(app.vars.thisSessionIsAdmin)	{
				xhr.setRequestHeader('x-clientid',app.vars._clientid); //set by app
				xhr.setRequestHeader('x-domain',app.vars.domain); //what domain is in focus. set by app or user
				xhr.setRequestHeader('x-userid',app.vars.userid); //what account is in focus. provided by user/ stored locally.
				xhr.setRequestHeader('x-deviceid',app.vars.deviceid); //the specific device making the requests. stored locally.
				xhr.setRequestHeader('x-authtoken',app.vars.authtoken); //returned by API
				xhr.setRequestHeader('x-version',app.model.version); //set by app
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
			var data = $.extend(app.u.getParametersAsObject("?"+pathParts[1]),data2Pass); //getParamsfunction wants ? in string.
			
			var URL = 'https://www.zoovy.com'+pathParts[0]; //once live, won't need the full path, but necessary for testing purposes.
			
			if(!$.isEmptyObject(app.ext.admin.vars.uiRequest))	{
				app.u.dump("request in progress. Aborting.");
				app.ext.admin.vars.uiRequest.abort(); //kill any exists requests. The nature of these calls is one at a time.
				}
			app.ext.admin.vars.uiRequest = $.ajax({
				"url":URL,
				"data":data,
				"type":"POST", //changing to POST causes the URL params to get dropped, which means we may not get the right page (verb). so take that into account if changing.
				"dataType": 'json',
				error : function(a,b){
					if(a.statusText == "abort")	{
						app.u.dump("UI request aborted. It would destroy such life in favor of its new matrix."); //most likely, this abort happened intentionally because another action was requested (a link was clicked)
						}
					else	{
						$('#'+app.ext.admin.u.getTabFromPath(pathParts[0])+'Content').empty(); ///empty out loading div and any template placeholder.
						app.u.throwGMessage("Error details = UI request failure: "+b);
						if(typeof viewObj.error == 'function'){viewObj.error()}
						}
					app.ext.admin.vars.uiRequest = {} //reset request container to easily determine if another request is in progress
					},
				success : function(data){
					app.ext.admin.u.uiHandleContentUpdate(path,data,viewObj)

					app.ext.admin.vars.uiRequest = {} //reset request container to easily determine if another request is in progress
					
					//here because builder > edit outputs a bunch of JS in the html returned. this is to compensate. may be able to remove later. ###
//					window.loadElement = app.ext.admin.a.loadElement; -> commented out 20121114 20:07
					
				},
				beforeSend: app.model.setHeader //uses headers to pass authentication info to keep them  off the uri.
				});
//			app.u.dump(" admin.vars.uiRequest:"); app.u.dump(app.ext.admin.vars.uiRequest);
			}
		
		}

	return r;
	}