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


		getAllCustomerLists : {
			init : function(tagObj)	{
				var r = 0;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "getAllCustomerLists"
				if(myControl.model.fetchData(tagObj.datapointer) == false)	{
					myControl.util.dump(" -> getAllCustomerLists is not local. go get her Ray!");
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
				myControl.model.addDispatchToQ({"_cmd":"getAllCustomerLists","_tag" : tagObj});	
				}
			},//getAllCustomerLists

		getCustomerList : {
			init : function(listID,tagObj,Q)	{
				var r = 0;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "getCustomerList|"+listID
				if(myControl.model.fetchData(tagObj.datapointer) == false)	{
					myControl.util.dump(" -> getCustomerList is not local. go get her Ray!");
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
				myControl.model.addDispatchToQ({"_cmd":"getCustomerList","listid":listID,"_tag" : tagObj},Q);	
				}
			},//getCustomerList

//obj must include listid
//obj can include sku, qty,priority, note and replace. see webdoc for more info.
//sku can be a fully qualified stid (w/ options)
		addToCustomerList : {
			init : function(obj,tagObj)	{
				this.dispatch(obj,tagObj);
				return 1;
				},
			dispatch : function(obj,tagObj)	{
				obj['_cmd'] = "addToCustomerList"
				obj['_tag'] = tagObj;
				myControl.model.addDispatchToQ(obj);	
				}
			},//addToCustomerList

		removeFromCustomerList : {
			init : function(listID,stid,tagObj)	{
				this.dispatch(listID,stid,tagObj);
				return 1;
				},
			dispatch : function(listID,stid,tagObj)	{
				myControl.model.addDispatchToQ({"_cmd":"removeFromCustomerList","listid":listID,"sku":stid,"_tag" : tagObj});	
				}
			},//removeFromCustomerList


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
*/
		addReview : {
			init : function(obj,tagObj)	{
				this.dispatch(obj,tagObj);
				return 1;
				},
			dispatch : function(obj,tagObj)	{
				obj['_cmd'] = 'addReview';
				obj['_tag'] = tagObj;
				myControl.model.addDispatchToQ(obj);
				}
			},//addReview
			
//as part of tagObj, pass parentID so the success/error message knows where to go.
//will be prepended to parentID
		tellAFriend : {
			init : function(pid,tagObj)	{
				this.dispatch(pid,tagObj);
				return 1;
				},
			dispatch : function(pid,tagObj)	{
				var obj = {};
				obj['_cmd'] = 'sendEmail';
				obj['recipient'] = 'jt@zoovy.com';
				obj['method'] = 'tellafriend';
				obj['SENDER_BODY'] = 'THIS IS CONTENT I ADDED. WOOT!';
				obj['product'] = pid;
				obj['_tag'] = tagObj;
				myControl.model.addDispatchToQ(obj);
				}
			},//addReview

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

		getCustomerOrderList : {
			init : function(tagObj,Q)	{
				var r = 0;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "getCustomerOrderList"
				
				if(myControl.model.fetchData(tagObj.datapointer) == false)	{
					this.dispatch(tagObj,Q);
					r = 1;
					}
				else	{
					myControl.util.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(tagObj,Q)	{
				myControl.model.addDispatchToQ({"_cmd":"getCustomerOrderList","DETAIL":"5","_zjsid":myControl.sessionId,"_tag" : tagObj},Q);	
				}			
			}, //getCustomerOrderList



		getCustomerOrderDetail : {
			init : function(orderid,tagObj,Q)	{
				var r = 0;
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "getCustomerOrderDetail|"+orderid;

				if(myControl.model.fetchData(tagObj.datapointer) == false)	{
					this.dispatch(orderid,tagObj,Q);
					r = 1;
					}
				else	{
					myControl.util.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(orderid,tagObj,Q)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj.datapointer = "getCustomerOrderDetail|"+orderid
				myControl.model.addDispatchToQ({"_cmd":"getCustomerOrderDetail","orderid":orderid,"_zjsid":myControl.sessionId,"_tag" : tagObj},Q);	
				}			
			} //getCustomerOrderDetail

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


		showOrderHistory : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.store_crm.showOrderHistory.onSuccess ');
				var $parent = $('#'+tagObj.parentID);
				var orderid;
				var L = myControl.data[tagObj.datapointer]['@orders'].length;
				for(i = 0; i < L; i += 1)	{
					orderid = myControl.data[tagObj.datapointer]['@orders'][i].ORDERID;
					$parent.append(myControl.renderFunctions.createTemplateInstance(tagObj.templateID,"order_"+orderid));
					myControl.renderFunctions.translateTemplate(myControl.data[tagObj.datapointer]['@orders'][i],"order_"+orderid);
					}
				
		
				
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.store_crm.callbacks.init.onError');
				$('#'+d['_rtag'].parentID).prepend(myControl.util.getResponseErrors(d)).toggle(true);
				}
			
			
			}, //showOrderHistory


		showSubscribeForm : {
			onSuccess : function(tagObj)	{
//				myControl.util.dump('BEGIN myControl.ext.store_crm.showSubscribeForm.onSuccess ');
				var $parent = $('#'+tagObj.parentID);
				$parent.append(myControl.renderFunctions.createTemplateInstance(tagObj.templateID,"subscribeFormContainer"));
				myControl.renderFunctions.translateTemplate(myControl.data[tagObj.datapointer],"subscribeFormContainer");
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.store_crm.callbacks.init.onError');
				$('#'+d['_rtag'].parentID).prepend(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //showSubscribeForm

		showSubscribeSuccess : {
			onSuccess : function(tagObj)	{
				myControl.util.dump('BEGIN myControl.ext.store_crm.showSubscribeForm.onSuccess ');
				$('#'+tagObj.parentID).empty("thank you!");
				},
			onError : function(d)	{
				myControl.util.dump('BEGIN myControl.ext.store_crm.showSubscribeForm.onSError ');
				myControl.util.dump(d);
				$('#'+d['_rtag'].parentID).prepend(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}, //showSubscribeSuccess

		showOrder : 	{
			onSuccess : function(tagObj)	{
				myControl.util.dump("BEGIN store_crm.callbacks.showOrder");
//				myControl.util.dump(tagObj);
//translates the general info for the order. bill to, status, etc.
				myControl.renderFunctions.translateTemplate(myControl.data[tagObj.datapointer].order,tagObj.parentID);

				var orderID = tagObj.datapointer.split('|')[1]
				myControl.util.dump(" -> order id = "+orderID);
				var L = myControl.data[tagObj.datapointer].order.stuff.length;
				var stid,pid;
				var $parent = $("#orderProductLineitem_"+myControl.util.makeSafeHTMLId(orderID)).removeClass('loadingBG');

//adds a lineitem template for each stid in stuff
				for(i = 0; i < L; i +=1)	{
					stid = myControl.data[tagObj.datapointer].order.stuff[i].sku;
					pid = stid.split(':')[0]
					$parent.append(myControl.renderFunctions.createTemplateInstance('orderProductLineItemTemplate',{
"id":'order_'+orderID+'_stid_'+stid,
"pid":pid,
"stid":stid}));
					myControl.renderFunctions.translateTemplate(myControl.data[tagObj.datapointer].order.stuff[i],'order_'+orderID+'_stid_'+stid);	

					}
			
				},
			onError : function(d)	{
//something went wrong, so empty the parent (which likely only holds an empty template) and put an error message in there.
				$('#'+d['_rtag'].parentID).empty.append(myControl.util.getResponseErrors(d)).toggle(true);
				}
			}
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
			subscribe : function(obj)	{
				var errors = '';
				if(!obj.login)
					errors += 'please enter an email address.';
				else if(!myControl.util.isValidEmail(obj.login))
					errors += 'please enter a valid email address.';
//name is not required, but if something is there, make sure its the full name.
				if(obj.fullname && obj.fullname.indexOf(' ') < 0)
					errors += 'please enter your full name';
					
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
				for(index in data.bindData.cleanValue)	{
					o += "<li title='"+data.bindData.cleanValue[index].EXEC_SUMMARY+"'>";
					o += "<input type='checkbox' name='newsletter-"+data.bindData.cleanValue[index].ID+"' id='newsletter-"+data.bindData.cleanValue[index].ID+"' \/>";
					o += "<label for='newsletter-"+data.bindData.cleanValue[index].ID+"'>"+data.bindData.cleanValue[index].NAME+"<\/label><\/li>";
					}
				o += '<\/ul>';
				$tag.append(o);		
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

					$parent.attr({"title":"Write a review for "+myControl.data['getProduct|'+P.pid]['%attribs']['zoovy:prod_name']}).append(myControl.renderFunctions.createTemplateInstance(P.templateID,'review-modal_'+P.pid));
					myControl.renderFunctions.translateTemplate(myControl.data['getProduct|'+P.pid],'review-modal_'+P.pid);
					$parent.dialog({modal: true,width:$(window).width() - 48,height:$(window).height() - 48});
					
					
					}			
				},

			handleReviews : function(formID)	{
				frmObj = $('#'+formID).serializeJSON();
				$('#'+formID+' .zMessage').empty().remove(); //clear any existing error messages.
				var isValid = myControl.ext.store_crm.validate.addReview(frmObj); //returns true or some errors.
				if(isValid === true)	{
					myControl.ext.store_crm.calls.addReview.init(frmObj,{"callback":"showMessaging","parentID":formID,"message":"Thank you for your review. Pending approval, it will be added to the store."});
					myControl.model.dispatchThis();
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
					$('#'+P.parentID);  //if a loadingBG class is needed, add it outside this function.
// ### modify this so callback and extension can be passed in, but are defaulted if none.
//in this case, the template is not populated until the call comes back. otherwise, the form would show up but no subscribe list.
					if(myControl.ext.store_crm.calls.getNewsletters.init({"parentID":P.parentID,"templateID":P.templateID,"callback":"showSubscribeForm","extension":"store_crm"}))	{myControl.model.dispatchThis()}
					}
				},


//assumes the list is already in memory
			getSkusFromList : function(listID)	{
				myControl.util.dump("BEGIN store_crm.util.getSkusFromList ("+listID+")");
				var L = myControl.data['getCustomerList|'+listID]['@'+listID].length;
				var csvArray = new Array(); //array of skus. What is returned.
				
				for(i = 0; i < L; i+=1)	{
					csvArray.push(myControl.data['getCustomerList|'+listID]['@'+listID][i].SKU);
					}
				csvArray = $.grep(csvArray,function(n){return(n);}); //remove blanks
				return csvArray;
				},

			handleSubscribe : function(formID,tagObj)	{
				frmObj = $('#'+formID).serializeJSON();
				var isValid = myControl.ext.store_crm.validate.subscribe(frmObj); //returns true or an li's of errors.
				if(isValid === true)	{
					tagObj = $.isEmptyObject(tagObj) ? {} : tagObj;
					tagObj.callback = tagObj.callback ? tagObj.callback : 'showMessaging';
					tagObj.message = tagObj.message ? tagObj.message : 'Thank you, you have been added to our newsletter.';
					tagObj.parentID = $('#'+formID).parent().attr('id');

					myControl.ext.store_crm.calls.setNewsletters.init(frmObj,tagObj);
					myControl.model.dispatchThis();
					}
				else	{
//report errors.
					var $messageEle = $('#newsletterMessaging').empty();
//need to make sure a messaging div exists for error reporting.
					if($messageEle.length == 0)
						$('#'+formID).prepend("<ul id='newsletterMessaging'>"+isValid+"</ul>");
					else
						$messageEle.append(isValid);
					}
				}
			} //util		
		} //r object.
	return r;
	}