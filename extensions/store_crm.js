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
					$parent.empty();
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
				}

			}, //validate


		renderFormats : {
//Displays a list of the merchants newsletters.
			subscribeCheckboxes : function($tag,data)	{
//				app.u.dump('BEGIN app.ext.store_prodlist.renderFormats.mpPagesAsListItems');
//				app.u.dump(data);
				var o = "";
				for(var index in data.value)	{
					o += "<div class='subscribeListItem'><label title='"+data.value[index].EXEC_SUMMARY+"'>";
					o += "<input type='checkbox' checked='checked' name='newsletter-"+data.value[index].ID+"' \/>";
					o += data.value[index].NAME+"<\/label><\/div>";
					}
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
					$parent.dialog({modal: true,width: ($(window).width() > 500) ? 500 : '90%',height:500,autoOpen:false,"title":"Write a review for "+P.pid});
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
					app.calls.appReviewAdd.init(frmObj,{"callback":"showMessaging","parentID":formID,"message":"Thank you for your review. Pending approval, it will be added to the store."},'mutable');
					app.model.dispatchThis('mutable');
					$('#'+formID).hide(); //hide existing form to avoid confusion.
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
					if(app.calls.appNewsletterList.init({"parentID":P.parentID,"templateID":P.templateID,"callback":"showSubscribeForm","extension":"store_crm"}))	{app.model.dispatchThis()}
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
	numRequests += app.calls.buyerProductListDetail.init(data[i].id,tagObj)
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

/*
The list object returned on a buyerProductListDetail is not a csv or even a string of skus, it's an array of objects, each object containing information
about a sku (when it was added t the list, qty, etc).
This is used to get add an array of skus, most likely for a product list.
*/

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
				
$('#'+formID+' .ui-widget-anymessage').empty().remove(); //clear any existing messaging
var formObj = $('#'+formID).serializeJSON();
if(app.ext.store_crm.validate.changePassword(formObj)){
	app.calls.buyerPasswordUpdate.init(formObj.password,tagObj);
	app.model.dispatchThis('immutable');
	}
else{
	var errObj = app.u.youErrObject("The two passwords do not match.",'42');
	errObj.parentID = formID
	app.u.throwMessage(errObj);
	}
				
				}, //handleChangePassword

			handleSubscribe : function($form)	{
//				app.u.dump("BEGIN store_crm.u.handleSubscribe");
				if($form)	{
//					app.u.dump(" -> $form is set.");
					frmObj = $form.serializeJSON();
					if(app.u.validateForm($form))	{
//						app.u.dump(" -> $form validated.");
						app.ext.store_crm.calls.setNewsletters.init(frmObj,{'callback':function(rd){
							if(app.model.responseHasErrors(rd)){
								$form.anymessage({'message':rd});
								}
							else	{
								$form.anymessage(app.u.successMsgObject("Thank you, you are now subscribed."));
								}
							}});
						app.model.dispatchThis();
						}
					else	{}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In store_crm.u.handleSubscribe, $form not passed.','gMessage':true});
					}
				},

//vars needs addressID AND addressType (bill or ship)
			showAddressEditModal : function(vars,onSuccessCallback)	{
				var r = false; //what is returned. true if editor is displayed, false if an error occured.

				if(typeof vars === 'object' && vars.addressID && vars.addressType)	{
					var addressData = app.ext.cco.u.getAddrObjByID(vars.addressType,vars.addressID);
					app.u.dump(addressData);
					if(addressData)	{
						r = true;
						var $editor = $("<div \/>");
						$editor.anycontent({'templateID':(vars.addressType == 'ship') ? 'chkoutAddressShipTemplate' : 'chkoutAddressBillTemplate','data':addressData});
						$editor.append("<input type='hidden' name='shortcut' value='"+vars.addressID+"' \/>");
						$editor.append("<input type='hidden' name='type' value='"+vars.addressType+"' \/>");
						if(vars.addressType == 'bill')	{
							$editor.append("<label><span>email:<\/span><input type='email' name='bill/email' data-bind='var: address(bill/email); format:popVal;' value='"+( addressData['bill/email'] || "" )+"' required='required' \/><\/label>");
							}
						$editor.wrapInner('<form \/>'); //needs this for serializeJSON later.
						
					
						$editor.dialog({
							width: ($(window).width() < 500) ? ($(window).width() - 50) : 500, //check window width/height to accomodate mobile devices.
							height: ($(window).height() < 500) ? ($(window).height() - 50) : 500,
							modal: true,
							title: 'edit address',
							buttons : {
								'cancel' : function(event){
									event.preventDefault();
									$(this).dialog('close');
									},
								'save' : function(event,ui) {
									event.preventDefault();
									var $form = $('form',$(this)).first();
									
									if(app.u.validateForm($form))	{
										$('body').showLoading('Updating Address');
										var serializedForm = $form.serializeJSON();
//save and then refresh the page to show updated info.
										app.calls.buyerAddressAddUpdate.init(serializedForm,{'callback':function(rd){
											$('body').hideLoading(); //always hide loading, regardless of errors.
											if(app.model.responseHasErrors(rd)){
												$form.anymessage({'message':rd});
												}
											else if(typeof onSuccessCallback === 'function')	{
												onSuccessCallback(rd,serializedForm);
												$editor.dialog('close');
												}
											else	{
												//no callback defined 
												$editor.dialog('close');
												}
											}},'immutable');
//dump data in memory and local storage. get new copy up updated address list for display.
										app.model.destroy('buyerAddressList');
										app.calls.buyerAddressList.init({},'immutable');
										app.model.dispatchThis('immutable');
										}
									else	{} //errors handled in validateForm
									
									}
								},
							close : function(event, ui) {$(this).dialog('destroy').remove()}
							});
						
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In store_crm.u.showAddressEditModal, unable to determine address data.','gMessage':true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In store_crm.u.showAddressEditModal, either vars was undefined/not an object ['+typeof vars+'] or addressID and/or addressType not set.','gMessage':true});
					}
				return r;
				}, //showAddressEditModal

//vars needs addressType (bill or ship)			
			showAddressAddModal : function(vars,onSuccessCallback)	{
				var r = false; //what is returned. true if editor is displayed, false if an error occured.

				if(typeof vars === 'object' && vars.addressType && (vars.addressType.toLowerCase() == 'bill' || vars.addressType.toLowerCase() == 'ship'))	{

					r = true;
					var $editor = $("<div \/>");
					$editor.append("<input type='text' maxlength='6' data-minlength='6' name='shortcut' placeholder='address id (6 characters)' \/>");
					$editor.append("<input type='hidden' name='type' value='"+vars.addressType.toUpperCase()+"' \/>");
					$editor.anycontent({'templateID':(vars.addressType == 'ship') ? 'chkoutAddressShipTemplate' : 'chkoutAddressBillTemplate','data':{},'showLoading':false});
					$editor.wrapInner('<form \/>'); //needs this for serializeJSON later.
					
				
					$editor.dialog({
						width: ($(window).width() < 500) ? ($(window).width() - 50) : 500, //check window width/height to accomodate mobile devices.
						height: ($(window).height() < 500) ? ($(window).height() - 50) : 500,
						modal: true,
						title: 'edit address',
						buttons : {
							'cancel' : function(event){
								event.preventDefault();
								$(this).dialog('close');
								},
							'save' : function(event,ui) {
								event.preventDefault();
								var $form = $('form',$(this)).first();
								
								if(app.u.validateForm($form))	{
									$('body').showLoading('Adding Address');
									var serializedForm = $form.serializeJSON();
//save and then refresh the page to show updated info.
									app.calls.buyerAddressAddUpdate.init(serializedForm,{'callback':function(rd){
										$('body').hideLoading(); //always hide loading, regardless of errors.
										if(app.model.responseHasErrors(rd)){
											$form.anymessage({'message':rd});
											}
										else if(typeof onSuccessCallback === 'function')	{
											onSuccessCallback(rd,serializedForm);
											$editor.dialog('close');
											}
										else	{
											//no callback defined or an error occured and has been reported.
											$editor.dialog('close');
											}
										}},'immutable');
//dump data in memory and local storage. get new copy up updated address list for display.
									app.model.destroy('buyerAddressList');
									app.calls.buyerAddressList.init({},'immutable');
									app.model.dispatchThis('immutable');
									}
								else	{} //errors handled in validateForm
								
								}
							},
						close : function(event, ui) {$(this).dialog('destroy').remove()}
						});

					}
				else	{
					$('#globalMessaging').anymessage({'message':'In store_crm.u.showAddressAddModal, either vars was undefined/not an object ['+typeof vars+'] or  addressType not set to bill or ship.','gMessage':true});
					}
				return r;
				}
			}, //util		
		
		
		
		e : {
			
			showWriteReview : function($btn)	{
				$btn.button();
				$btn.off('click.showWriteReview').on('click.showWriteReview',function(event){
					event.preventDefault();
					var pid = $btn.attr("data-pid") || $btn.closest("[data-stid]").data('stid');
					if(pid)	{
						app.ext.store_crm.u.showReviewFrmInModal({"pid":pid,"templateID":"reviewFrmTemplate"});
						}
					else	{
						$('#globalMessaging').anymessage({'message':'In store_crm.e.showWriteReview, unable to determine pid/stid','gMessage':true});
						}
					})
				}

			} //e/events
		
		} //r object.
	return r;
	}