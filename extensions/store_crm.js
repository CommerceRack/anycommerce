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
				if(app.model.fetchData('whereAmI') == false)	{
					app.u.dump(" -> whereAmI is not local. go get her Ray!");
					r = 1;
					this.dispatch(tagObj);
					}
				else	{
//					app.u.dump(' -> data is local');
					app.u.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(tagObj)	{
				app.model.addDispatchToQ({"_cmd":"whereAmI","_tag" : tagObj});	
				}
			},//whereAmI

		appFAQsAll : {
			init : function(tagObj)	{
				var r = 0;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "appFAQs"
				if(app.model.fetchData('appFAQs') == false)	{
					r = 1;
					this.dispatch(tagObj);
					}
				else	{
					app.u.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(tagObj)	{
				app.model.addDispatchToQ({"_cmd":"appFAQs","method":"all","_tag" : tagObj});	
				}
			},//appFAQsTopics	
//sendMessages always are sent thru the immutable Q
		appSendMessage : {
			init : function(obj,tagObj,Q)	{
				app.u.dump("store_crm.calls.appSendMessage");
				app.u.dump(obj);
				obj.msgtype = "feedback"
				obj["_cmd"] = "appSendMessage";
				obj['_tag'] = tagObj;
				this.dispatch(obj,Q);
				return 1;
				},
			dispatch : function(obj,Q)	{
				app.model.addDispatchToQ(obj,'immutable');	
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
				app.model.addDispatchToQ(cmdObj,'immutable');	
				}
			},//buyerOrderMacro


		buyerAddressAddUpdate  : {
			init : function(cmdObj,tagObj,Q)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "buyerAddressAddUpdate|"+cmdObj.shortcut+"|"+app.u.unixNow();
				cmdObj['_cmd'] = 'buyerAddressAddUpdate';
				cmdObj['_tag'] = tagObj;
				if(!Q)	{Q = 'immutable'}
				this.dispatch(cmdObj,Q);
				return 1;
				},
			dispatch : function(cmdObj,Q)	{
				app.model.addDispatchToQ(cmdObj,Q);	
				}
			},//buyerAddressAddUpdate 

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
				app.model.addDispatchToQ(cmdObj,'immutable');	
				}
			},//buyerOrderMacro
*/


//formerly getAllCustomerLists
		buyerProductLists : {
			init : function(tagObj,Q)	{
				var r = 0;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "buyerProductLists"
				if(app.model.fetchData(tagObj.datapointer) == false)	{
					r = 1;
					this.dispatch(tagObj);
					}
				else	{
//					app.u.dump(' -> data is local');
					app.u.handleCallback(tagObj,Q);
					}
				return r;
				},
			dispatch : function(tagObj,Q)	{
				app.model.addDispatchToQ({"_cmd":"buyerProductLists","_tag" : tagObj});	
				}
			},//buyerProductLists


//formerly getCustomerList. always get lists.
		buyerProductListDetail : {
			init : function(listID,tagObj,Q)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "buyerProductListDetail|"+listID
				this.dispatch(listID,tagObj,Q);
				return 1;
				},
			dispatch : function(listID,tagObj,Q)	{
				app.model.addDispatchToQ({"_cmd":"buyerProductListDetail","listid":listID,"_tag" : tagObj},Q);	
				}
			},//buyerProductListDetail


//obj must include listid
//obj can include sku, qty,priority, note and replace. see webdoc for more info.
//sku can be a fully qualified stid (w/ options)
//formerly addToCustomerList
		buyerProductListAppendTo : {
			init : function(obj,tagObj,Q)	{
				this.dispatch(obj,tagObj,Q);
				return 1;
				},
			dispatch : function(obj,tagObj,Q)	{
				obj['_cmd'] = "buyerProductListAppendTo"
				obj['_tag'] = tagObj;
				app.model.addDispatchToQ(obj,Q);	
				}
			},//buyerProductListAppendTo

//formerly removeFromCustomerList
		buyerProductListRemoveFrom : {
			init : function(listID,stid,tagObj,Q)	{
				this.dispatch(listID,stid,tagObj,Q);
				return 1;
				},
			dispatch : function(listID,stid,tagObj,Q)	{
				app.model.addDispatchToQ({"_cmd":"buyerProductListRemoveFrom","listid":listID,"sku":stid,"_tag" : tagObj},Q);	
				}
			},//buyerProductListRemoveFrom


//Get a list of previously used payment methods.
		buyerWalletList : {
			init : function(tagObj,Q)	{
				var r = 0;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "buyerWalletList";
				if(app.model.fetchData('buyerWalletList') == false)	{
					r = 1;
					this.dispatch(tagObj,Q);
					}
				else	{
					app.u.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(tagObj,Q)	{
				app.model.addDispatchToQ({"_cmd":"buyerWalletList","_tag" : tagObj},Q);	
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
				app.model.addDispatchToQ({"_cmd":"whereAmI","_tag" : tagObj});	
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
				app.model.addDispatchToQ(obj);
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
				app.model.addDispatchToQ(obj,'immutable');
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
				app.model.addDispatchToQ(obj);
				}
			},//addReview
*/


		buyerNewsletters: {
			init : function(tagObj,Q)	{
				app.u.dump("BEGIN store_crm.calls.buyerNewsletters.init");
				this.dispatch(tagObj,Q);
				return 1;
				},
			dispatch : function(tagObj,Q)	{
				obj = {};
				obj['_tag'] = tagObj;
				obj['_cmd'] = "buyerNewsletters";
				app.model.addDispatchToQ(obj,Q);
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
				app.model.addDispatchToQ(obj,Q);
				}
			}, //buyerOrderGet

		setNewsletters : {
			init : function(obj,tagObj)	{
				app.u.dump("BEGIN store_crm.calls.setNewsletters.init");
				var r = 1;
				this.dispatch(obj,tagObj);
				return r;
				},
			dispatch : function(obj,tagObj)	{
				obj['_tag'] = tagObj;
				obj['_cmd'] = "setNewsletters";
				app.model.addDispatchToQ(obj);	
				}
			}, //setNewsletters

//get a list of newsletter subscription lists.
		getNewsletters : {
			init : function(tagObj)	{
//				app.u.dump("BEGIN store_crm.calls.getNewsletters.init");
//				app.u.dump(tagObj);
				var r = 0;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "getNewsletters"
				if(app.model.fetchData('getNewsletters') == false)	{
//					app.u.dump(" -> getNewsletters is not local. go get her Ray!");
					r = 1;
					this.dispatch(tagObj);
					}
				else	{
//					app.u.dump(' -> data is local');
					app.u.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(tagObj)	{
				app.model.addDispatchToQ({"_cmd":"getNewsletters","_tag" : tagObj});	
				}
			},//getNewsletters			

		buyerPasswordUpdate : {
			init : function(password,tagObj)	{
				app.u.dump("BEGIN store_crm.calls.buyerPasswordUpdate.init");
				this.dispatch(password,tagObj);
				return 1;
				},
			dispatch : function(password,tagObj)	{
				var obj = {};
				obj.password = password;
				obj['_tag'] = tagObj;
				obj['_cmd'] = "buyerPasswordUpdate";
				app.u.dump(obj);
				app.model.addDispatchToQ(obj,'immutable');	
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
				app.model.addDispatchToQ({"_cmd":"buyerPurchaseHistory","DETAIL":"5","_tag" : tagObj},Q);	
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
				app.model.addDispatchToQ({"_cmd":"buyerPurchaseHistoryDetail","orderid":orderid,"_tag" : tagObj},Q);	
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
				app.model.addDispatchToQ({"_cmd":"buyerAddressList","_tag": tagObj},Q);
				}
			} //buyerAddressList
		}, //calls









					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\









	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
		init : {
			onSuccess : function()	{
//				app.u.dump('BEGIN app.ext.store_crm.init.onSuccess ');
				return true;  //currently, no system or config requirements to use this extension
//				app.u.dump('END app.ext.store_crm.init.onSuccess');
				},
			onError : function(d)	{
				app.u.dump('BEGIN app.ext.store_crm.callbacks.init.onError');
				}
			},
			
		showFAQTopics : {

			onSuccess : function(tagObj)	{
				var $parent = $('#'+tagObj.parentID);
				$parent.removeClass('loadingBG');
				var L = app.data[tagObj.datapointer]['@topics'].length;
				app.u.dump(" -> L = "+L);
				var topicID;
				if(L > 0)	{
					for(var i = 0; i < L; i += 1)	{
						topicID = app.data[tagObj.datapointer]['@topics'][i]['TOPIC_ID']
						app.u.dump(" -> TOPIC ID = "+topicID);
						$parent.append(app.renderFunctions.transmogrify({'id':topicID,'data-topicid':topicID},tagObj.templateID,app.data[tagObj.datapointer]['@topics'][i]))
						}
					}
				else	{
					$parent.append("There are no FAQ at this time.");
					}
				
				}
			}, //showFAQTopics

		showOrderHistory : {
			onSuccess : function(tagObj)	{
				var $parent = $('#'+tagObj.parentID);
				var orderid;
				var L = app.data[tagObj.datapointer]['@orders'].length;
				if(L > 0)	{
					for(var i = 0; i < L; i += 1)	{
						orderid = app.data[tagObj.datapointer]['@orders'][i].ORDERID;
						$parent.append(app.renderFunctions.createTemplateInstance(tagObj.templateID,"order_"+orderid));
						app.renderFunctions.translateTemplate(app.data[tagObj.datapointer]['@orders'][i],"order_"+orderid);
						}
					}
				else	{
					$parent.empty().removeClass('loadingBG').append("You have not placed an order with us.");
					}
				}
			}, //showOrderHistory


		showSubscribeForm : {
			onSuccess : function(tagObj)	{
//				app.u.dump('BEGIN app.ext.store_crm.showSubscribeForm.onSuccess ');
				var $parent = $('#'+tagObj.parentID);
				$parent.append(app.renderFunctions.createTemplateInstance(tagObj.templateID,"subscribeFormContainer"));
				app.renderFunctions.translateTemplate(app.data[tagObj.datapointer],"subscribeFormContainer");
				}
			}, //showSubscribeForm

		showSubscribeSuccess : {
			onSuccess : function(tagObj)	{
				$('#'+tagObj.parentID).empty("thank you!");
				}
			} //showSubscribeSuccess

		}, //callbacks







////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		validate : {
			addReview : function(obj)	{
//				app.u.dump(obj);
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
//				app.u.dump(obj);
				var valid = true;
				if(obj.password == ''){valid = false}
				if(obj.password != obj.password2)	{valid = false}
				return valid;
				},
			subscribe : function(obj)	{
//				app.u.dump(obj);
				var errors = '';
				if(!obj.login)
					errors += '<li>please enter an email address.</li>';
				else if(!app.u.isValidEmail(obj.login))
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
//				app.u.dump('BEGIN app.ext.store_prodlist.renderFormats.mpPagesAsListItems');
//				app.u.dump(data);
				var o = "<ul class='subscriberLists'>";
				for(var index in data.value)	{
					o += "<li title='"+data.value[index].EXEC_SUMMARY+"'>";
					o += "<input type='checkbox' checked='checked' name='newsletter-"+data.value[index].ID+"' id='newsletter-"+data.value[index].ID+"' \/>";
					o += "<label for='newsletter-"+data.value[index].ID+"'>"+data.value[index].NAME+"<\/label><\/li>";
					}
				o += '<\/ul>';
				$tag.append(o);		
				},

			
			orderTrackingLinks : function($tag,data)	{
				app.u.dump("BEGIN myRIA.renderFormats.orderTrackingLinks");
				app.u.dump(data.value);
				
				var L = data.value.length;
				var o = ''; //what is appended to tag. a compiled list of shipping lineitems.
				for(var i = 0; i < L; i += 1)	{
					o += "<li><a href='"+app.ext.myRIA.u.getTrackingURL(data.value[i].carrier,data.value[i].track)+"' target='"+data.value[i].carrier+"'>"+data.value[i].track+"</a>";
					if(app.u.isSet(data.value[i].cost))
						o += " ("+app.u.formatMoney(data.value[i].cost,'$',2,true)+")";
					o += "<\/li>";
					}
				$tag.show().append("<h4>Tracking Number(s):</h4>").append(o);
				}

			},


////////////////////////////////////   UTIL  [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
/*
P.pid, P.templateID are both required.
modal id is fixed. data-pid is updated each time a new modal is created.
if a modal is opened and p.pid matches data-pid, do NOT empty it. could be a modal that was closed (populated) but not submitted. preserve data.
if the P.pid and data-pid do not match, empty the modal before openeing/populating.
!!! incomplete.
*/
			showReviewFrmInModal : function(P)	{
				if(!P.pid || !P.templateID)	{
					app.u.dump(" -> pid or template id left blank");
					}
				else	{
					var $parent = $('#review-modal');
//if no review modal has been created before, create one. 
					if($parent.length == 0)	{
						app.u.dump(" -> modal window doesn't exist. create it.");
						$parent = $("<div \/>").attr({"id":"review-modal",'data-pid':P.pid}).appendTo(document.body);
						}
					else	{
						app.u.dump(" -> use existing modal. empty it.");
//this is a new product being displayed in the viewer.
						$parent.empty();
						}
					$parent.dialog({modal: true,width:500,height:500,autoOpen:false,"title":"Write a review for "+P.pid});
//the only data needed in the reviews form is the pid.
//the entire product record isn't passed in because it may not be available (such as in invoice or order history, or a third party site).
					$parent.dialog('open').append(app.renderFunctions.transmogrify({id:'review-modal_'+P.pid},P.templateID,{'pid':P.pid}));
					}
				},



			handleReviews : function(formID)	{
				frmObj = $('#'+formID).serializeJSON();
				$('#'+formID+' .zMessage').empty().remove(); //clear any existing error messages.
				var isValid = app.ext.store_crm.validate.addReview(frmObj); //returns true or some errors.
				if(isValid === true)	{
					app.ext.store_crm.calls.appReviewAdd.init(frmObj,{"callback":"showMessaging","parentID":formID,"message":"Thank you for your review. Pending approval, it will be added to the store."});
					app.model.dispatchThis();
					$('reviewFrm').hide(); //hide existing form to avoid confusion.
					}
				else	{
					//report errors.
					var errObj = app.u.youErrObject(isValid,'42');
					errObj.parentID = formID
					app.u.throwMessage(errObj);
					}
				},
/*
will output a newsletter form into 'parentid' using 'templateid'.
*/
			showSubscribe : function(P)	{
				if(!P.targetID && !P.templateID)	{
					app.u.dump("for crm_store.u.showSubscribe, both targetID and templateID are required");
					}
				else	{
//					$('#'+P.parentID);  //if a loadingBG class is needed, add it outside this function.
// ### modify this so callback and extension can be passed in, but are defaulted if none.
//in this case, the template is not populated until the call comes back. otherwise, the form would show up but no subscribe list.
					if(app.ext.store_crm.calls.getNewsletters.init({"parentID":P.parentID,"templateID":P.templateID,"callback":"showSubscribeForm","extension":"store_crm"}))	{app.model.dispatchThis()}
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
					app.u.dump("WARNING: unrecognized ship carrier ["+carrier+"] for parcel: "+tracknum);
					}
				return url;
				},

			getAllBuyerListsDetails : function(datapointer,tagObj)	{
var data = app.data[datapointer]['@lists']; //shortcut
var L = data.length;
var numRequests = 0;
for(var i = 0; i < L; i += 1)	{
	numRequests += app.ext.store_crm.calls.buyerProductListDetail.init(data[i].id,tagObj)
	}
return numRequests;
				},

			getBuyerListsAsUL : function(datapointer)	{

var data = app.data[datapointer]['@lists']; //shortcut
var L = data.length;
var $r = $("<ul>");
var $li; //recycled
for(var i = 0; i < L; i += 1)	{
	$li = $("<li\/>").data("buyerlistid",data[i].id).text(data[i].id+" ("+data[i].items+" items)");
	$li.appendTo($r);
	}
return $r;
				},

//assumes the list is already in memory
//formerly getSkusFromList
			getSkusFromBuyerList : function(listID)	{
				app.u.dump("BEGIN store_crm.u.getSkusFromList ("+listID+")");
				var L = app.data['buyerProductListDetail|'+listID]['@'+listID].length;
				var csvArray = new Array(); //array of skus. What is returned.
				
				for(var i = 0; i < L; i+=1)	{
					csvArray.push(app.data['buyerProductListDetail|'+listID]['@'+listID][i].SKU);
					}
				csvArray = $.grep(csvArray,function(n){return(n);}); //remove blanks
				return csvArray;
				}, //getSkusFromList

			handleChangePassword : function(formID,tagObj)	{
				
$('#'+formID+' .appMessage').empty().remove(); //clear any existing messaging
var formObj = $('#'+formID).serializeJSON();
if(app.ext.store_crm.validate.changePassword(formObj)){
	app.ext.store_crm.calls.buyerPasswordUpdate.init(formObj.password,tagObj);
	app.model.dispatchThis('immutable');
	}
else{
	var errObj = app.u.youErrObject("The two passwords do not match.",'42');
	errObj.parentID = formID
	app.u.throwMessage(errObj);
	}
				
				}, //handleChangePassword

			handleSubscribe : function(formID,tagObj)	{
				app.u.dump("BEGIN store_crm.u.handleSubscribe");
				frmObj = $('#'+formID).serializeJSON();
				$('#'+formID+' .zMessage').empty().remove(); //clear any existing messaging
				var isValid = app.ext.store_crm.validate.subscribe(frmObj); //returns true or an li's of errors.
				if(isValid === true)	{
					tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
					tagObj.callback = tagObj.callback ? tagObj.callback : 'showMessaging';
					tagObj.message = tagObj.message ? tagObj.message : 'Thank you, you have been added to our newsletter.';
					tagObj.parentID = tagObj.parentID ? tagObj.parentID : formID; //don't look for parent, because it may not have an id.

					app.ext.store_crm.calls.setNewsletters.init(frmObj,tagObj);
					app.model.dispatchThis();
					}
				else	{
					$('#'+formID+' .appMessage').empty().remove(); //clear any existing messaging
//report errors
					var errObj = app.u.youErrObject("<ul>"+isValid+"<\/ul>",'42');
					errObj.parentID = formID
					app.u.throwMessage(errObj);
					}
				}
			} //util		
		} //r object.
	return r;
	}