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
An extension for CRM (customer relations management).
Contains a variety of functions for marketing (newsletters, tell a friend, etc) as
well as info about the shopper (who they're logged in as, where they are [based on IP], etc)

for the 'lists' calls, no default callbacks are present. If something generic enough to be useful
comes to mind later, I'll add them. In the meantime, define the callback in your extension, 
tailored to your app.
*/


var store_crm = function() {
	var r = {
	vars : {},

					////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		


//calls return a 0 if a request is made and a 1 if data is already local.
	calls : {


		whereAmI : {
			init : function(tagObj)	{
				var r = 0;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "whereAmI"
				if(myControl.model.fetchData('whereAmI') == false)	{
					myControl.util.dump(" -> whereAmI is not local. go get her Ray!");
					r = 1;
					this.dispatch(tagObj);
					}
				else	{
//					myControl.util.dump(' -> data is local');
					myControl.util.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(tagObj)	{
				myControl.model.addDispatchToQ({"_cmd":"whereAmI","_tag" : tagObj});	
				}
			},//whereAmI

		appFAQsAll : {
			init : function(tagObj)	{
				var r = 0;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "appFAQs"
				if(myControl.model.fetchData('appFAQs') == false)	{
					r = 1;
					this.dispatch(tagObj);
					}
				else	{
					myControl.util.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(tagObj)	{
				myControl.model.addDispatchToQ({"_cmd":"appFAQs","method":"all","_tag" : tagObj});	
				}
			},//appFAQsTopics	
//sendMessages always are sent thru the immutable Q
		appSendMessage : {
			init : function(obj,tagObj,Q)	{
				myControl.util.dump("store_crm.calls.appSendMessage");
				myControl.util.dump(obj);
				obj.msgtype = "feedback"
				obj["_cmd"] = "appSendMessage";
				obj['_tag'] = tagObj;
				this.dispatch(obj,Q);
				return 1;
				},
			dispatch : function(obj,Q)	{
				myControl.model.addDispatchToQ(obj,'immutable');	
				}
			},//appFAQsTopics
			

//always uses immutable q so that an order update is not cancelled.
/*
cmdObj should include the following:
'tender':'CREDIT',
'amt':'5.00',
'payment.cc':'4111111111111111',
'payment.mm':'03',
'payment.yy':'2013',
'payment.cv':'123',
'orderid':'2012-01-380'
obj['softauth'] = "order"; // [OPTIONAL]. if user is logged in, this gets ignored. turn on invoice view
*/
		buyerOrderPaymentAdd  : {
			init : function(cmdObj,tagObj)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
//				tagObj.datapointer = "buyerOrderMacro"  //don't think we want a data pointer here.
				cmdObj['_cmd'] = 'buyerOrderPaymentAdd';
				cmdObj['_tag'] = tagObj;
				this.dispatch(cmdObj);
				return 1;
				},
			dispatch : function(cmdObj)	{
				myControl.model.addDispatchToQ(cmdObj,'immutable');	
				}
			},//buyerOrderMacro


//always uses immutable q so that an order update is not cancelled.
/*
NOT SUPPORTED.
		buyerOrderUpdate  : {
			init : function(orderid,updateArray,tagObj)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
//				tagObj.datapointer = "buyerOrderMacro"  //don't think we want a data pointer here.
				var cmdObj = {};
				cmdObj.orderid = orderid;
				cmdObj['_cmd'] = 'buyerOrderUpdate';
				cmdObj['@updates'] = updateArray;
				cmdObj['_tag'] = tagObj;
				this.dispatch(cmdObj);
				return 1;
				},
			dispatch : function(cmdObj)	{
				myControl.model.addDispatchToQ(cmdObj,'immutable');	
				}
			},//buyerOrderMacro
*/


//formerly getAllCustomerLists
		buyerProductLists : {
			init : function(tagObj)	{
				var r = 0;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "buyerProductLists"
				if(myControl.model.fetchData(tagObj.datapointer) == false)	{
					myControl.util.dump(" -> buyerProductLists is not local. go get her Ray!");
					r = 1;
					this.dispatch(tagObj);
					}
				else	{
//					myControl.util.dump(' -> data is local');
					myControl.util.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(tagObj)	{
				myControl.model.addDispatchToQ({"_cmd":"buyerProductLists","_tag" : tagObj});	
				}
			},//buyerProductLists


//formerly getCustomerList
		buyerProductListDetail : {
			init : function(listID,tagObj,Q)	{
				var r = 0;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "buyerProductListDetail|"+listID
				if(myControl.model.fetchData(tagObj.datapointer) == false)	{
					myControl.util.dump(" -> buyerProductListDetail is not local. go get her Ray!");
					r = 1;
					this.dispatch(listID,tagObj,Q);
					}
				else	{
//					myControl.util.dump(' -> data is local');
					myControl.util.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(listID,tagObj,Q)	{
				myControl.model.addDispatchToQ({"_cmd":"buyerProductListDetail","listid":listID,"_tag" : tagObj},Q);	
				}
			},//buyerProductListDetail


//obj must include listid
//obj can include sku, qty,priority, note and replace. see webdoc for more info.
//sku can be a fully qualified stid (w/ options)
//formerly addToCustomerList
		buyerProductListAppendTo : {
			init : function(obj,tagObj)	{
				this.dispatch(obj,tagObj);
				return 1;
				},
			dispatch : function(obj,tagObj)	{
				obj['_cmd'] = "buyerProductListAppendTo"
				obj['_tag'] = tagObj;
				myControl.model.addDispatchToQ(obj);	
				}
			},//buyerProductListAppendTo

//formerly removeFromCustomerList
		buyerProductListRemoveFrom : {
			init : function(listID,stid,tagObj)	{
				this.dispatch(listID,stid,tagObj);
				return 1;
				},
			dispatch : function(listID,stid,tagObj)	{
				myControl.model.addDispatchToQ({"_cmd":"buyerProductListRemoveFrom","listid":listID,"sku":stid,"_tag" : tagObj});	
				}
			},//buyerProductListRemoveFrom


//Get a list of previously used payment methods.
		buyerWalletList : {
			init : function(tagObj,Q)	{
				var r = 0;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "buyerWalletList";
				if(myControl.model.fetchData('getNewsletters') == false)	{
					r = 1;
					this.dispatch(tagObj,Q);
					}
				else	{
					myControl.util.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(tagObj,Q)	{
				myControl.model.addDispatchToQ({"_cmd":"buyerWalletList","_tag" : tagObj},Q);	
				}
			},//buyerProductListRemoveFrom




//!!! INCOMPLETE
/*
this will allow a shopper to be notified by email when an items is back in stock.
requires the user to be logged in/have an account.
a stid (pid + options can be passed) or just a pid.
*/
/*		eventPinstock : {
			init : function(stid,tagObj)	{
				obj['_tag'] = typeof tagObj == 'object' ? tagObj : {};
				tagObj.datapointer = "addEvent"
				this.dispatch(tagObj);
				return 1;
				},
			dispatch : function(tagObj)	{
				myControl.model.addDispatchToQ({"_cmd":"whereAmI","_tag" : tagObj});	
				}
			},//eventPinstock
*/
/*
obj is most likely a form object serialized to json.
see jquery/api webdoc for required/optional param
!!! the review piece needs testing.

//formerly addReview
*/
		appReviewAdd : {
			init : function(obj,tagObj)	{
				this.dispatch(obj,tagObj);
				return 1;
				},
			dispatch : function(obj,tagObj)	{
				obj['_cmd'] = 'appReviewAdd';
				obj['_tag'] = tagObj;
				myControl.model.addDispatchToQ(obj);
				}
			},//appReviewAdd
			
//formerly customerPasswordRecover
		appBuyerPasswordRecover : {
			init : function(login,tagObj)	{
				this.dispatch(login,tagObj);
				return 1;
				},
			dispatch : function(login,tagObj)	{
				var obj = {};
				obj['_cmd'] = 'appBuyerPasswordRecover';
				obj.login = login;
				obj.method = 'email';
				obj['_tag'] = tagObj;
				myControl.model.addDispatchToQ(obj,'immutable');
				}
			},//addReview
			
//as part of tagObj, pass parentID so the success/error message knows where to go.
//will be prepended to parentID
/*		tellAFriend : {
			init : function(pid,tagObj)	{
				this.dispatch(pid,tagObj);
				return 1;
				},
			dispatch : function(pid,tagObj)	{
				var obj = {};
				obj['_cmd'] = 'sendEmail';
				obj['method'] = 'tellafriend';
				obj['SENDER_BODY'] = 'THIS IS CONTENT I ADDED. WOOT!';
				obj['product'] = pid;
				obj['_tag'] = tagObj;
				myControl.model.addDispatchToQ(obj);
				}
			},//addReview
*/


		buyerNewsletters: {
			init : function(tagObj,Q)	{
				myControl.util.dump("BEGIN store_crm.calls.buyerNewsletters.init");
				this.dispatch(tagObj,Q);
				return 1;
				},
			dispatch : function(tagObj,Q)	{
				obj = {};
				obj['_tag'] = tagObj;
				obj['_cmd'] = "buyerNewsletters";
				myControl.model.addDispatchToQ(obj,Q);
				}
			}, //buyerNewsletters
//obj should contain cartid and orderid
		buyerOrderGet : {
			init : function(obj,tagObj,Q)	{
				this.dispatch(obj,tagObj,Q);
				return 1;
				},
			dispatch : function(obj,tagObj,Q)	{
				if(!Q)	{Q = 'mutable'}
				obj["_cmd"] = "buyerOrderGet";
				obj['softauth'] = "order";
				obj["_tag"] = tagObj;
				obj["_tag"]["datapointer"] = "buyerOrderGet|"+obj.orderid;
				myControl.model.addDispatchToQ(obj,Q);
				}
			}, //buyerOrderGet

		setNewsletters : {
			init : function(obj,tagObj)	{
				myControl.util.dump("BEGIN store_crm.calls.setNewsletters.init");
				var r = 1;
				this.dispatch(obj,tagObj);
				return r;
				},
			dispatch : function(obj,tagObj)	{
				obj['_tag'] = tagObj;
				obj['_cmd'] = "setNewsletters";
				myControl.model.addDispatchToQ(obj);	
				}
			}, //setNewsletters

//get a list of newsletter subscription lists.
		getNewsletters : {
			init : function(tagObj)	{
//				myControl.util.dump("BEGIN store_crm.calls.getNewsletters.init");
//				myControl.util.dump(tagObj);
				var r = 0;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "getNewsletters"
				if(myControl.model.fetchData('getNewsletters') == false)	{
//					myControl.util.dump(" -> getNewsletters is not local. go get her Ray!");
					r = 1;
					this.dispatch(tagObj);
					}
				else	{
//					myControl.util.dump(' -> data is local');
					myControl.util.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(tagObj)	{
				myControl.model.addDispatchToQ({"_cmd":"getNewsletters","_tag" : tagObj});	
				}
			},//getNewsletters			

		buyerPasswordUpdate : {
			init : function(password,tagObj)	{
				myControl.util.dump("BEGIN store_crm.calls.buyerPasswordUpdate.init");
				this.dispatch(password,tagObj);
				return 1;
				},
			dispatch : function(password,tagObj)	{
				var obj = {};
				obj.password = password;
				obj['_tag'] = tagObj;
				obj['_cmd'] = "buyerPasswordUpdate";
				myControl.util.dump(obj);
				myControl.model.addDispatchToQ(obj,'immutable');	
				}
			},
//a request for order history should always request latest list (as per B)
//formerly getCustomerOrderList
		buyerPurchaseHistory : {
			init : function(tagObj,Q)	{
				var r = 1;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "buyerPurchaseHistory"
				this.dispatch(tagObj,Q);
				return r;
				},
			dispatch : function(tagObj,Q)	{
				myControl.model.addDispatchToQ({"_cmd":"buyerPurchaseHistory","DETAIL":"5","_zjsid":myControl.sessionId,"_tag" : tagObj},Q);	
				}			
			}, //buyerPurchaseHistory


//a request for order details should always request latest list (as per B)
		buyerPurchaseHistoryDetail : {
			init : function(orderid,tagObj,Q)	{
				var r = 0;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "buyerPurchaseHistoryDetail|"+orderid;
				this.dispatch(orderid,tagObj,Q);
				r = 1;
				return r;
				},
			dispatch : function(orderid,tagObj,Q)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "buyerPurchaseHistoryDetail|"+orderid
				myControl.model.addDispatchToQ({"_cmd":"buyerPurchaseHistoryDetail","orderid":orderid,"_zjsid":myControl.sessionId,"_tag" : tagObj},Q);	
				}			
			}, //buyerPurchaseHistoryDetail
		buyerAddressList : {
			init : function(tagObj,Q)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj["datapointer"] = "buyerAddressList"; 
				this.dispatch(tagObj,Q);
				return 1;
				},
			dispatch : function(tagObj,Q)	{
				myControl.model.addDispatchToQ({"_cmd":"buyerAddressList","_tag": tagObj},Q);
				}
			} //buyerAddressList
		}, //calls









					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\









	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
		init : {
			onSuccess : function()	{
//				myControl.util.dump('BEGIN myControl.ext.store_crm.init.onSuccess ');
				return true;  //currently, no system or config requirements to use this extension
//				myControl.util.dump('END myControl.ext.store_crm.init.onSuccess');
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.store_crm.callbacks.init.onError');
				}
			},
			
		showFAQTopics : {

			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN store_crm.howFAQTopics.onSuccess ');
				var $parent = $('#'+tagObj.parentID);
				$parent.removeClass('loadingBG');
				var L = myControl.data[tagObj.datapointer]['@topics'].length;
				myControl.util.dump(" -> L = "+L);
				var topicID;
				if(L > 0)	{
					for(i = 0; i < L; i += 1)	{
						topicID = myControl.data[tagObj.datapointer]['@topics'][i]['TOPIC_ID']
						myControl.util.dump(" -> TOPIC ID = "+topicID);
						$parent.append(myControl.renderFunctions.transmogrify({'id':topicID,'data-topicid':topicID},tagObj.templateID,myControl.data[tagObj.datapointer]['@topics'][i]))
						}
					
					}
				else	{
					$parent.append("There are no FAQ at this time.");
					}
				
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			},

		showOrderHistory : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.store_crm.showOrderHistory.onSuccess ');
				var $parent = $('#'+tagObj.parentID);
				var orderid;
				var L = myControl.data[tagObj.datapointer]['@orders'].length;
				if(L > 0)	{
					for(i = 0; i < L; i += 1)	{
						orderid = myControl.data[tagObj.datapointer]['@orders'][i].ORDERID;
						$parent.append(myControl.renderFunctions.createTemplateInstance(tagObj.templateID,"order_"+orderid));
						myControl.renderFunctions.translateTemplate(myControl.data[tagObj.datapointer]['@orders'][i],"order_"+orderid);
						}
					}
				else	{
					$parent.empty().removeClass('loadingBG').append("You have not placed an order with us.");
					}
				
		
				
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			
			
			}, //showOrderHistory


		showSubscribeForm : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump('BEGIN myControl.ext.store_crm.showSubscribeForm.onSuccess ');
				var $parent = $('#'+tagObj.parentID);
				$parent.append(myControl.renderFunctions.createTemplateInstance(tagObj.templateID,"subscribeFormContainer"));
				myControl.renderFunctions.translateTemplate(myControl.data[tagObj.datapointer],"subscribeFormContainer");
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			}, //showSubscribeForm

		showSubscribeSuccess : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.store_crm.showSubscribeForm.onSuccess ');
				$('#'+tagObj.parentID).empty("thank you!");
				},
			onError : function(responseData,uuid)	{
				myControl.util.handleErrors(responseData,uuid)
				}
			} //showSubscribeSuccess

		}, //callbacks







////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		validate : {
			addReview : function(obj)	{
				myControl.util.dump(obj);
				var errors = '';
				if(!obj.SUBJECT)
					errors += 'please enter a subject.<br \/>';
				if(!obj.RATING)
					errors += 'please enter a rating<br \/>';
				if(!obj.MESSAGE)
					errors += 'please enter a review<br \/>';

				if(errors == '')
					return true;
				else
					return errors;
				},
			changePassword : function(obj)	{
				myControl.util.dump("BEGIN store_crm.validate.subscribe");
				myControl.util.dump(obj);
				var valid = true;
				if(obj.password == ''){valid = false}
				if(obj.password != obj.password2)	{valid = false}
				return valid;
				},
			subscribe : function(obj)	{
				myControl.util.dump("BEGIN store_crm.validate.subscribe");
				myControl.util.dump(obj);
				var errors = '';
				if(!obj.login)
					errors += '<li>please enter an email address.</li>';
				else if(!myControl.util.isValidEmail(obj.login))
					errors += '<li>please enter a valid email address.</li>';

//name is not required, but if something is there, make sure its the full name.
				if(obj.fullname.toLowerCase == 'full name')
					errors += '<li>please enter your full name.</li>';					
				else if(obj.fullname && obj.fullname.indexOf(' ') < 0)
					errors += '<li>please enter your full name.</li>';
				if(!errors)
					return true;
				else
					return errors;

				} //subscribe
			}, //validate


		renderFormats : {
//displays an li
			subscribeCheckboxes : function($tag,data)	{
//				myControl.util.dump('BEGIN myControl.ext.store_prodlist.renderFormats.mpPagesAsListItems');
//				myControl.util.dump(data);
				var o = "<ul class='subscriberLists'>";
				for(index in data.value)	{
					o += "<li title='"+data.value[index].EXEC_SUMMARY+"'>";
					o += "<input type='checkbox' checked='checked' name='newsletter-"+data.value[index].ID+"' id='newsletter-"+data.value[index].ID+"' \/>";
					o += "<label for='newsletter-"+data.value[index].ID+"'>"+data.value[index].NAME+"<\/label><\/li>";
					}
				o += '<\/ul>';
				$tag.append(o);		
				},

			
			orderTrackingLinks : function($tag,data)	{
				myControl.util.dump("BEGIN myRIA.renderFormats.orderTrackingLinks");
				myControl.util.dump(data.value);
				
				var L = data.value.length;
				var o = ''; //what is appended to tag. a compiled list of shipping lineitems.
				for(i = 0; i < L; i += 1)	{
					o += "<li><a href='"+myControl.ext.myRIA.util.getTrackingURL(data.value[i].carrier,data.value[i].track)+"' target='"+data.value[i].carrier+"'>"+data.value[i].track+"</a>";
					if(myControl.util.isSet(data.value[i].cost))
						o += " ("+myControl.util.formatMoney(data.value[i].cost,'$',2,true)+")";
					o += "<\/li>";
					}
				$tag.show().append("<h4>Tracking Number(s):</h4>").append(o);
				}

			},


////////////////////////////////////   UTIL    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		util : {
/*
P.pid, P.templateID are both required.
modal id is fixed. data-pid is updated each time a new modal is created.
if a modal is opened and p.pid matches data-pid, do NOT empty it. could be a modal that was closed (populated) but not submitted. preserve data.
if the P.pid and data-pid do not match, empty the modal before openeing/populating.
!!! incomplete.
*/
			showReviewFrmInModal : function(P)	{
				myControl.util.dump("BEGIN store_crm.util.showReviewFrmInModal");
				if(!P.pid || !P.templateID)	{
					myControl.util.dump(" -> pid or template id left blank");
					}
				else	{
					var $parent = $('#review-modal');
//if no review modal has been created before, create one. 
					if($parent.length == 0)	{
						myControl.util.dump(" -> modal window doesn't exist. create it.");
						$parent = $("<div \/>").attr({"id":"review-modal",'data-pid':P.pid}).appendTo(document.body);
						}
					else	{
						myControl.util.dump(" -> use existing modal. empty it.");
//this is a new product being displayed in the viewer.
						$parent.empty();
						}
					$parent.dialog({modal: true,width:500,height:500,autoOpen:false,"title":"Write a review for "+P.pid});
//the only data needed in the reviews form is the pid.
//the entire product record isn't passed in because it may not be available (such as in invoice or order history, or a third party site).
					$parent.dialog('open').append(myControl.renderFunctions.transmogrify({id:'review-modal_'+P.pid},P.templateID,{'pid':P.pid}));
					}
				},



			handleReviews : function(formID)	{
				frmObj = $('#'+formID).serializeJSON();
				$('#'+formID+' .zMessage').empty().remove(); //clear any existing error messages.
				var isValid = myControl.ext.store_crm.validate.addReview(frmObj); //returns true or some errors.
				if(isValid === true)	{
					myControl.ext.store_crm.calls.appReviewAdd.init(frmObj,{"callback":"showMessaging","parentID":formID,"message":"Thank you for your review. Pending approval, it will be added to the store."});
					myControl.model.dispatchThis();
					$('reviewFrm').hide(); //hide existing form to avoid confusion.
					}
				else	{
					//report errors.
					$('#'+formID).prepend(myControl.util.formatMessage(isValid));
					}
				},
/*
will output a newsletter form into 'parentid' using 'templateid'.
*/
			showSubscribe : function(P)	{
				if(!P.targetID && !P.templateID)	{
					myControl.util.dump("for crm_store.util.showSubscribe, both targetID and templateID are required");
					}
				else	{
//					$('#'+P.parentID);  //if a loadingBG class is needed, add it outside this function.
// ### modify this so callback and extension can be passed in, but are defaulted if none.
//in this case, the template is not populated until the call comes back. otherwise, the form would show up but no subscribe list.
					if(myControl.ext.store_crm.calls.getNewsletters.init({"parentID":P.parentID,"templateID":P.templateID,"callback":"showSubscribeForm","extension":"store_crm"}))	{myControl.model.dispatchThis()}
					}
				},


			getTrackingURL : function(carrier,tracknum){
				var url; //the composed url. what is returned.
				if(carrier == 'FEDX')	{
					url = "http://www.fedex.com/Tracking?ascend_header=1&clienttype=dotcom&cntry_code=us&language=english&tracknumbers="+tracknum
					}
				else if(carrier == 'USPS')	{
					url = "http://wwwapps.ups.com/WebTracking/processInputRequest?HTMLVersion=5.0&loc=en_US&Requester=UPSHome&"+tracknum+"=321654987456&AgreeToTermsAndConditions=yes"
					}
				else if(carrier = 'UPS')	{
					url = "https://tools.usps.com/go/TrackConfirmAction_input?origTrackNum="+tracknum
					}
				else	{
					url = false; //unrecognized ship carrier.
					myControl.util.dump("WARNING: unrecognized ship carrier ["+carrier+"] for parcel: "+tracknum);
					}
				return url;
				},


//assumes the list is already in memory
			getSkusFromList : function(listID)	{
				myControl.util.dump("BEGIN store_crm.util.getSkusFromList ("+listID+")");
				var L = myControl.data['buyerProductListDetail|'+listID]['@'+listID].length;
				var csvArray = new Array(); //array of skus. What is returned.
				
				for(i = 0; i < L; i+=1)	{
					csvArray.push(myControl.data['buyerProductListDetail|'+listID]['@'+listID][i].SKU);
					}
				csvArray = $.grep(csvArray,function(n){return(n);}); //remove blanks
				return csvArray;
				},
			handleChangePassword : function(formID,tagObj)	{
$('#'+formID+' .zMessage').empty().remove(); //clear any existing messaging
var formObj = $('#'+formID).serializeJSON();
if(myControl.ext.store_crm.validate.changePassword(formObj)){
	myControl.ext.store_crm.calls.buyerPasswordUpdate.init(formObj.password,tagObj);
	myControl.model.dispatchThis('immutable');
	}
else{
	$('#'+formID).prepend(myControl.util.formatMessage("The two passwords entered do not match."));
	}
				
				},
			handleSubscribe : function(formID,tagObj)	{
				myControl.util.dump("BEGIN store_crm.util.handleSubscribe");
				frmObj = $('#'+formID).serializeJSON();
				$('#'+formID+' .zMessage').empty().remove(); //clear any existing messaging
				var isValid = myControl.ext.store_crm.validate.subscribe(frmObj); //returns true or an li's of errors.
				if(isValid === true)	{
					tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
					tagObj.callback = tagObj.callback ? tagObj.callback : 'showMessaging';
					tagObj.message = tagObj.message ? tagObj.message : 'Thank you, you have been added to our newsletter.';
					tagObj.parentID = tagObj.parentID ? tagObj.parentID : formID; //don't look for parent, because it may not have an id.

					myControl.ext.store_crm.calls.setNewsletters.init(frmObj,tagObj);
					myControl.model.dispatchThis();
					}
				else	{
//report errors
					$('#'+formID).append(myControl.util.formatMessage("<ul>"+isValid+"<\/ul>"));
					}
				}
			} //util		
		} //r object.
	return r;
	}