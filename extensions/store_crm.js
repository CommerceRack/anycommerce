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
tailored to your _app.
*/


var store_crm = function(_app) {
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
				if(_app.model.fetchData('appFAQs') == false)	{
					r = 1;
					this.dispatch(tagObj);
					}
				else	{
					_app.u.handleCallback(tagObj);
					}
				return r;
				},
			dispatch : function(tagObj)	{
				_app.model.addDispatchToQ({"_cmd":"appFAQs","method":"all","_tag" : tagObj});	
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
				_app.model.addDispatchToQ(cmdObj,'immutable');	
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
				_app.model.addDispatchToQ(obj,Q);
				}
			}, //buyerOrderGet

		buyerAddressList : {
			init : function(tagObj,Q)	{
				tagObj = $.isEmptyObject(tagObj) ? {} : tagObj; 
				tagObj["datapointer"] = "buyerAddressList"; 
				this.dispatch(tagObj,Q);
				return 1;
				},
			dispatch : function(tagObj,Q)	{
				_app.model.addDispatchToQ({"_cmd":"buyerAddressList","_tag": tagObj},Q);
				}
			} //buyerAddressList
		}, //calls









					////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\









	callbacks : {
//callbacks.init need to return either a true or a false, depending on whether or not the file will execute properly based on store account configuration.
		init : {
			onSuccess : function()	{
//				_app.u.dump('BEGIN _app.ext.store_crm.init.onSuccess ');
				return true;  //currently, no system or config requirements to use this extension
//				_app.u.dump('END _app.ext.store_crm.init.onSuccess');
				},
			onError : function(d)	{
				_app.u.dump('BEGIN _app.ext.store_crm.callbacks.init.onError');
				}
			},
			
		showFAQTopics : {

			onSuccess : function(tagObj)	{
				var $parent = $('#'+tagObj.parentID);
// ** 201336 This prevents FAQ's from being re-appended in the event the user revisits the FAQ page
				if(!$parent.data('faqs-rendered')){
					$parent.removeClass('loadingBG');
					var L = _app.data[tagObj.datapointer]['@topics'].length;
					_app.u.dump(" -> L = "+L);
					var topicID;
					if(L > 0)	{
						for(var i = 0; i < L; i += 1)	{
							topicID = _app.data[tagObj.datapointer]['@topics'][i]['TOPIC_ID']
//							_app.u.dump(" -> TOPIC ID = "+topicID);
// ** 201403 -> transmogrify is data-bind, so this didn't work.
//							$parent.append(_app.renderFunctions.transmogrify({'id':topicID,'topicid':topicID},tagObj.templateID,_app.data[tagObj.datapointer]['@topics'][i]))
							$parent.tlc({'templateid':tagObj.templateID,'dataset':_app.data[tagObj.datapointer]['@topics'][i],'dataAttribs':{'topicid':topicID}});
							}
						}
					else	{
						$parent.append("There are no FAQ at this time.");
						}
					$parent.data('faqs-rendered', true);
					}
				
				}
			}, //showFAQTopics

		showOrderHistory : {
			onSuccess : function(tagObj)	{
				var $parent = $('#'+tagObj.parentID);
				var orderid;
				var L = _app.data[tagObj.datapointer]['@orders'].length;
				if(L > 0)	{
					$parent.empty();
					for(var i = 0; i < L; i += 1)	{
						orderid = _app.data[tagObj.datapointer]['@orders'][i].ORDERID;
						$parent.append(_app.renderFunctions.createTemplateInstance(tagObj.templateID,"order_"+orderid));
						_app.renderFunctions.translateTemplate(_app.data[tagObj.datapointer]['@orders'][i],"order_"+orderid);
						}
					}
				else	{
					$parent.empty().removeClass('loadingBG').append("You have not placed an order with us.");
					}
				}
			}, //showOrderHistory


		showSubscribeForm : {
			onSuccess : function(tagObj)	{
//				_app.u.dump('BEGIN _app.ext.store_crm.showSubscribeForm.onSuccess ');
				var $parent = $('#'+tagObj.parentID);
				$parent.append(_app.renderFunctions.createTemplateInstance(tagObj.templateID,"subscribeFormContainer"));
				_app.renderFunctions.translateTemplate(_app.data[tagObj.datapointer],"subscribeFormContainer");
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
//				_app.u.dump(obj);
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
				}

			}, //validate

		tlcFormats : {
			
			buyersubscribe : function(data,thisTLC)	{
				dump(" -> data.globals.id: "+data.globals.binds.id);
				if(_app.u.thisNestedExists("data.buyerDetail.%info.@TAGS",_app))	{
					if($.inArray(data.globals.binds.id,_app.data.buyerDetail['%info']['@TAGS']) >= 0)	{
						dump(" -> MATCH!");
						data.globals.binds[data.globals.focusBind] = 'checked';
						}
					}
				return true;
				}
			},


		renderFormats : {
			
			ordertrackinglinks : function($tag,data)	{
//				_app.u.dump("BEGIN quickstart.renderFormats.ordertrackinglinks");
//				_app.u.dump(data.value);
				if(data.value)	{
					var L = data.value.length;
					var o = ''; //what is appended to tag. a compiled list of shipping lineitems.
					for(var i = 0; i < L; i += 1)	{
						// ### TODO -> need to get the link to quickstart out of here.
						o += "<li><a href='"+_app.ext.quickstart.u.getTrackingURL(data.value[i].carrier,data.value[i].track)+"' target='"+data.value[i].carrier+"'>"+data.value[i].track+"</a>";
						if(_app.u.isSet(data.value[i].cost))
							o += " ("+_app.u.formatMoney(data.value[i].cost,'$',2,true)+")";
						o += "<\/li>";
						}
					$tag.show().append("<h4>Tracking Number(s):</h4>").append(o);
					}
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
					_app.u.dump(" -> pid or template id left blank");
					}
				else	{
					var $parent = $('#review-modal');
//if no review modal has been created before, create one. 
					if($parent.length == 0)	{
						$parent = $("<div \/>").attr({"id":"review-modal",'data-pid':P.pid}).appendTo(document.body);
						}
					else	{
//this is a new product being displayed in the viewer.
						$parent.empty();
						}
					$parent.dialog({modal: true,width: ($(window).width() > 500) ? 500 : '90%',height:500,autoOpen:false,"title":"Write a review for "+P.pid});
//the only data needed in the reviews form is the pid.
//the entire product record isn't passed in because it may not be available (such as in invoice or order history, or a third party site).
//					$parent.dialog('open').append(_app.renderFunctions.transmogrify({id:'review-modal_'+P.pid},P.templateID,{'pid':P.pid}));
					$parent.tlc({'templateid' : P.templateID,'dataset' : {'pid':P.pid}});
					$parent.dialog('open');
					_app.u.handleButtons($parent);
					_app.u.addEventDelegation($parent); //1PC doesn't have delegation on the body.
					}
				},



/*
will output a newsletter form into 'parentid' using 'templateid'.
*/
			showSubscribe : function(P)	{
				if(!P.targetID && !P.templateID)	{
					_app.u.dump("for crm_store.u.showSubscribe, both targetID and templateID are required");
					}
				else	{
					var _tag = {"parentID":P.parentID,"templateID":P.templateID,"callback":"showSubscribeForm","extension":"store_crm","datapointer":"appNewsletterList"}
					if(app.data.appNewsletterList)	{
						_app.u.handleCallback(_tag);
						}
					else	{
						_app.model.addDispatchToQ({"_cmd":"appNewsletterList","_tag" : _tag},'mutable');
						_app.model.dispatchThis('mutable')
						}
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
					_app.u.dump("WARNING: unrecognized ship carrier ["+carrier+"] for parcel: "+tracknum);
					}
				return url;
				},

			getAllBuyerListsDetails : function(datapointer,tagObj)	{
				var data = _app.data[datapointer]['@lists']; //shortcut
				var L = data.length;
				var numRequests = 0;
				for(var i = 0; i < L; i += 1)	{
					numRequests += _app.calls.buyerProductListDetail.init(data[i].id,tagObj)
					}
				return numRequests;
				},



/*
The list object returned on a buyerProductListDetail is not a csv or even a string of skus, it's an array of objects, each object containing information
about a sku (when it was added t the list, qty, etc).
This is used to get add an array of skus, most likely for a product list.
*/

			getSkusFromBuyerList : function(listID)	{
				_app.u.dump("BEGIN store_crm.u.getSkusFromList ("+listID+")");
				var L = _app.data['buyerProductListDetail|'+listID]['@'+listID].length;
				var csvArray = new Array(); //array of skus. What is returned.
				
				for(var i = 0; i < L; i+=1)	{
					csvArray.push(_app.data['buyerProductListDetail|'+listID]['@'+listID][i].SKU);
					}
				csvArray = $.grep(csvArray,function(n){return(n);}); //remove blanks
				return csvArray;
				}, //getSkusFromList

			handleChangePassword : function($form,tagObj)	{
				var formObj = $form.serializeJSON();
				if(formObj.password && formObj.password == formObj.password2)	{
					_app.model.addDispatchToQ({"_cmd":"buyerPasswordUpdate","password":formObj.password,"_tag":tagObj},"immutable");
					_app.model.dispatchThis('immutable');
					}
				else{
					$form.anymessage({"message":"The two passwords do not match.","errtype":"youerr"});
					}
				
				}, //handleChangePassword

			handleSubscribe : function($form)	{
//				_app.u.dump("BEGIN store_crm.u.handleSubscribe");
				if($form)	{
//					_app.u.dump(" -> $form is set.");
					var sfo = $form.serializeJSON();
					if(_app.u.validateForm($form))	{
//						_app.u.dump(" -> $form validated.");
						sfo._cmd = 'appBuyerCreate';
						sfo._tag = {
							"datapointer":"appBuyerCreate",
							"callback":function(rd){
								if(_app.model.responseHasErrors(rd)){
									$form.anymessage({'message':rd});
									}
								else	{
									$form.anymessage(_app.u.successMsgObject("Thank you, you are now subscribed."));
									}
								}
							};
						_app.model.addDispatchToQ(sfo,"immutable");
						_app.model.dispatchThis('immutable');
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
					var addressData = _app.ext.cco.u.getAddrObjByID(vars.addressType,vars.addressID);
					
					if(addressData)	{
						r = true;
						var $editor = $("<div \/>");
						$editor.tlc({'templateid':(vars.addressType == 'ship') ? 'chkoutAddressShipTemplate' : 'chkoutAddressBillTemplate','dataset':addressData});
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
									var $editor = $(this);
									if(_app.u.validateForm($form))	{
										$form.showLoading('Updating Address');
										var sfo = $form.serializeJSON();
											sfo._cmd = 'buyerAddressAddUpdate',
											sfo._tag =	{
												'callback':function(rd){
													$form.hideLoading(); //always hide loading, regardless of errors.
													if(_app.model.responseHasErrors(rd)){
														$form.anymessage({'message':rd});
														}
													else if(typeof onSuccessCallback === 'function')	{
														$editor.dialog('close');
														onSuccessCallback(rd,sfo);
														}
													else	{
														//no callback defined 
														$editor.dialog('close');
														}
													}
												}
										
//save and then refresh the page to show updated info.
										_app.model.addDispatchToQ(sfo,'immutable');
//dump data in memory and local storage. get new copy up updated address list for display.
										_app.model.destroy('buyerAddressList');
										_app.calls.buyerAddressList.init({},'immutable');
										_app.model.dispatchThis('immutable');
										}
									else	{} //errors handled in validateForm
									
									}
								},
							close : function(event, ui) {$(this).dialog('destroy').remove()}
							});
//* 201342 -> used in checkout (or potentailly any editor) to immediately highlight any invalid fields (useful in 'edit' as opposed to 'create' address)
							if(vars.validateForm)	{
								_app.u.validateForm($editor);
								}

						
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
					
					$editor.append("<input type='hidden' name='type' value='"+vars.addressType.toUpperCase()+"' \/>");
// ** 201403 -> need to pass in a blank dataset so translation occurs. required for country dropdown.
					$editor.tlc({'templateid':(vars.addressType == 'ship') ? 'chkoutAddressShipTemplate' : 'chkoutAddressBillTemplate','dataset':{}});
//the address id should be at the bottom of the form, not the top. isn't that important or required.
					$editor.append("<input type='text' maxlength='6' data-minlength='6' name='shortcut' placeholder='address id (6 characters)' \/>");
					$editor.wrapInner('<form \/>'); //needs this for serializeJSON later.

//if the placeholder attribute on an input is not supported (thx IE8), then add labels.
					if(_app.ext.order_create)	{
						_app.ext.order_create.u.handlePlaceholder($editor);
						}
//adds a tooltip which is displayed on focus. lets the user know what field they're working on once they start typing and placeholder goes away.
					$(":input",$editor).each(function(index){
						var $input = $(this);
						if($input.attr('placeholder') && !$input.attr('title'))	{
							$(this).attr('title',$input.attr('placeholder'))
							}
						$input.tooltip({
							position: {
								my: "left top",
								at: "right top",
								using: function( position, feedback ) {
									$( this ).css( position );
									}
								}
							});

						});
				
					$editor.dialog({
						width: ($(window).width() < 500) ? ($(window).width() - 50) : 500, //check window width/height to accomodate mobile devices.
						height: ($(window).height() < 500) ? ($(window).height() - 50) : 500,
						modal: true,
						title: 'Add a new '+vars.addressType+' address',
						buttons : {
							'cancel' : function(event){
								event.preventDefault();
								$(this).dialog('close');
								},
							'save' : function(event,ui) {
								event.preventDefault();
								var $form = $('form',$(this)).first();
								
								if(_app.u.validateForm($form))	{
									$form.showLoading('Adding Address');
									var serializedForm = $form.serializeJSON();
//save and then refresh the page to show updated info.
									_app.model.addDispatchToQ({
										'_cmd':'buyerAddressAddUpdate',
										'_tag':	{
											'callback':function(rd){
												$form.hideLoading(); //always hide loading, regardless of errors.
												if(_app.model.responseHasErrors(rd)){
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
												}
											}
										},'mutable');
									_app.model.dispatchThis('mutable');
//dump data in memory and local storage. get new copy up updated address list for display.
									_app.model.destroy('buyerAddressList');
									_app.calls.buyerAddressList.init({},'immutable');
									_app.model.dispatchThis('immutable');
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
			//generic event, inteded to support more than tags through the use of the data-update-verb=
			buyerUpdate : function($ele,p)	{
				p.preventDefault();
				if(_app.u.validateForm($ele))	{
					var cmdObj = {
						"_cmd":"buyerUpdate",
						"@updates" : [],
						"cartid" : _app.model.fetchCartID(),
						"_tag":{
							"datapointer":"",
							"callback":function(rd){}
							}
						}
					
					$("[data-update-verb='tags']",$ele).find(":checkbox").each(function(){
						var $cb = $(this);
						cmdObj['@updates'].push(($cb.is(':checked') ? 'TAG-ADD' : 'TAG-CLEAR')+"?TAG="+$cb.attr('name'));
						});
					
					
					_app.model.addDispatchToQ(cmdObj,"mutable");
					_app.model.dispatchThis("mutable");
					}
				else	{} //validateForm handles error display.
				return false;
				},
			
			contactFormSubmit : function($ele,p)	{
				p.preventDefault();
				dump(" -> BEGIN store_crm.e.contactFormSubmit");
				if(_app.u.validateForm($ele))	{
					var sfo = $ele.serializeJSON();
					sfo._cmd = "appSendMessage";
					sfo._tag = {
						'callback':'showMessaging',
						'jqObj':$ele,
						'message':'Thank you, your message has been sent'
						};
					_app.model.addDispatchToQ(sfo,"immutable");
					_app.model.dispatchThis('immutable');
					}
				else	{
					dump(" -> did not pass validation.");
					} //validateForm handles error display.
				return false;
				},
			
			productBuyerListRemoveExec : function($ele,p)	{
				p.preventDefault();
				var pid = $ele.closest("[data-stid]").data('stid') || $ele.closest("[data-pid]").data('pid');
				var listid = $ele.closest("[data-buyerlistid]").data('buyerlistid');
				if(pid && listid)	{
					_app.u.dump(" -> templateRole.length: "+$ele.closest("[data-template-role='listitem']").length);
					_app.model.addDispatchToQ({
						'_cmd':'buyerProductListRemoveFrom',
						'listid' : listid,
						'sku' : pid,
						'_tag':	{
							'callback':'showMessaging',
							'message' : 'Item '+pid+' has been removed from list: '+listid,
							'jqObjEmpty' : true,
							'jqObj' : $ele.closest("[data-template-role='listitem']")
							}
						},'immutable');
					_app.model.destroy("buyerProductListDetail|"+listid); //destroy the list in memory so the next time we visit the list page, a new copy is fetched.
					_app.model.dispatchThis('immutable');
					if(_gaq)	{
						_gaq.push(['_trackEvent','Manage buyer list','User Event','item removed',pid]);
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In store_crm.e.productByerListRemoveExec, either unable to ascertain pid ["+pid+"] and/or buyerlistid ["+listid+"].","gMessage":true});
					}
				return false;
				},
			
			//add this as submit action on the form.
			productReviewSubmit : function($ele,p)	{
				p.preventDefault();
				var $form = $ele.closest('form'); //this way, $ele can be a button within the form or a onSubmit action on the form itself.
				if(_app.u.validateForm($ele))	{
					var sfo = $form.serializeJSON();
					if(sfo.pid)	{
						sfo._cmd = "appReviewAdd";
						sfo._tag = {
							"callback":"showMessaging",
							"jqObj":$form,
							"jqObjEmpty" : true,
							"message":"Thank you for your review. Pending approval, it will be added to the store."
							}
						_app.model.addDispatchToQ(sfo,"immutable");
						_app.model.dispatchThis('immutable');
						}
					else	{
						$ele.anymessage({"message":"In productReviewSubmit, validation not passed because no pid was found in the form.","gMessage":true});
						}
					}
				else	{} //validateForm will handle error display.
				return false;
				},
			
			productReviewShow : function($ele,p)	{
				p.preventDefault();

				var pid = $ele.data('pid') || $ele.closest("[data-pid]").data('pid'); //used on product page
				if(pid)	{
					_app.ext.store_crm.u.showReviewFrmInModal({"pid":pid,"templateID":"reviewFrmTemplate"});
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In store_crm.e.productReviewShow, unable to determine pid/stid','gMessage':true});
					}
				return false;
				}

			} //e/events
		
		} //r object.
	return r;
	}