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
An extension for acquiring and displaying 'lists' of categories.
The functions here are designed to work with 'reasonable' size lists of categories.
*/



var admin_orders = function() {
	var theseTemplates = new Array('orderManagerTemplate','adminOrderLineItem','orderDetailsTemplate','orderStuffItemEditorTemplate','orderStuffItemTemplate','orderPaymentHistoryTemplate','orderEventHistoryTemplate');
	var r = {

////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		
	vars : {
		"pools" : ['PENDING','REVIEW','HOLD','APPROVED','PROCESS','COMPLETED','CANCELLED'],
		"dependAttempts" : 0,  //used to count how many times loading the dependencies has been attempted.
		"dependencies" : ['admin'] //a list of other extensions (just the namespace) that are required for this one to load
		},
	calls : {
//never get from local or memory.
//formerly getOrders
		adminOrderList : {
			init : function(cmdObj,tagObj,Q)	{
				this.dispatch(cmdObj,tagObj,Q)
				return 1;
				},
			dispatch : function(cmdObj,tagObj,Q)	{
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
				tagObj.datapointer = "adminOrderList";
				cmdObj['_tag'] = tagObj;
				cmdObj["_cmd"] = "adminOrderList"
				app.model.addDispatchToQ(cmdObj,Q);
				}
			}, //orderList

//never look locally for data. Always make sure to load latest from server to ensure it's up to date.
//order info is critial
		adminOrderDetail : {
			init : function(orderID,tagObj,Q)	{
				this.dispatch(orderID,tagObj,Q)
				return 1;
				},
			dispatch : function(orderID,tagObj,Q)	{
				var cmdObj = {};
				cmdObj.orderid = orderID;
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
				tagObj.datapointer = "adminOrderDetail|"+orderID;
				cmdObj['_tag'] = tagObj;
				cmdObj["_cmd"] = "adminOrderDetail"
				app.model.addDispatchToQ(cmdObj,Q);
				}
			}, //adminOrderDetail

//updating an order is a critical function and should ALWAYS be immutable.
		adminOrderUpdate : {
			init : function(orderID,updates,tagObj)	{
				this.dispatch(orderID,updates,tagObj)
				return 1;
				},
			dispatch : function(orderID,updates,tagObj)	{
				app.u.dump("BEGIN admin_orders.calls.adminOrderUpdate.dispatch");
				app.u.dump(" -> orderID = "+orderID);
				cmdObj = {};
				cmdObj['_cmd'] = 'adminOrderUpdate';
				cmdObj.orderid = orderID;
				cmdObj['@updates'] = updates;
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
				cmdObj['_tag'] = tagObj;
				app.model.addDispatchToQ(cmdObj,'immutable');
				}
			} //orderList


		}, //calls









////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
//				app.u.dump('BEGIN app.ext.store_navcats.init.onSuccess ');
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).
//				app.u.dump("DEBUG - template url is changed for local testing. add: ");
				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/orders.css','orders_styles']);
				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/order_templates.html',theseTemplates);
//				if(!app.u.thisIsAnAdminSession())	{
//					$('#globalMessaging').toggle(true).append(app.u.formatMessage({'message':'<strong>Uh Oh!<\/strong> This session is not an admin session and the app is trying to load an admin module (admin_orders.js).','uiClass':'error','uiIcon':'alert'}));
//					r = false;
//					}
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}, //init
// if the order manager is loaded as part of the controller init, this callback gets run
		initOrderManager : {
			onSuccess : function()	{
				app.u.dump("BEGIN admin_orders.callback.initOrderManager.onSuccess");
<<<<<<< HEAD
				app.ext.admin_orders.a.initOrderManager({"pool":"RECENT","targetID":"mainContentArea"});
=======
				app.ext.admin_orders.a.initOrderManager({"pool":"RECENT","targetID":"mainContentArea"});
>>>>>>> origin/201237-jt
				}
			}, //initOrderManager

//executed per order lineitem on a bulk update.
		orderPoolChanged : {
			onSuccess : function(tagObj)	{
//				app.u.dump(" -> targetID: "+targetID);
				$('#'+tagObj.targetID).empty().remove();
				},
			onError : function(responseData)	{
				$('#'+tagObj.targetID).attr({'data-status':'error'}).find('td:nth-child('+app.ext.admin_orders.u.getFlexgridColIdByName('status')+')').html("<span class='ui-icon ui-icon-alert'></span>");
				responseData.parentID = 'orderListMessaging'
				app.u.throwMessage(responseData);
				}		
			}, //orderPoolChanged

//executed per order lineitem on a flagOrderAsPaid update.
		orderFlagAsPaid : {
			onSuccess : function(tagObj)	{
				app.u.dump(" -> targetID: "+tagObj.targetID);
				$('#'+tagObj.targetID).find('td:nth-child('+app.ext.admin_orders.u.getFlexgridColIdByName('ORDER_PAYMENT_STATUS')+')').text('Paid');
				},
			onError : function(d)	{
//				app.u.dump("BEGIN admin.callbacks.finderProductUpdate.onError");
				$('#'+tagObj.targetID).attr({'data-status':'error'}).find('td:nth-child('+app.ext.admin_orders.u.getFlexgridColIdByName('actions')+')').html("<span class='ui-icon ui-icon-alert'></span>");
				responseData.parentID = 'orderListMessaging'
				app.u.throwMessage(responseData);
				}		
			}, //orderFlagAsPaid
			
//on a bulk update, a ping in executed which triggers this callback. used to either load the appropriate pool or do nothing because an error occured.			
		handleBulkUpdate : {
			onSuccess : function(tagObj)	{
				var numErrors = 0; //the number of errors that occured.
				var numQd = 0; //the number of items still queued.
//go through all rows that have a status, not just selected.  It's possible a merchant could check or uncheck items during the sync.
//completed items have already been removed by this point.
				$('#orderListTable tr[data-status]').each(function(){
					var $row = $(this);
					if($row.attr('data-status') == 'error')	{
						numErrors += 1;
						}
					else if($row.attr('data-status') == 'queued')	{
						//odd. nothing should be queued. maybe an impatient merchants started clicking during request.
						numQd += 1;
						}
					});
				if(numErrors + numQd > 0)	{
					//errors have been reported, if that's the case. Or the merchant has selected more items already and they'll need to move them.
//					$('#orderListTable').flexReload(); //update table. makes sure rotating bg colors are right. !!! doesn't work.
					}
				else	{
//okay. everything went fine... now what???
					}
				},
			onError : function(d)	{
//				app.u.dump("BEGIN admin.callbacks.finderProductUpdate.onError");
				responseData.parentID = 'orderListMessaging'
				app.u.throwMessage(responseData);
				}		
			}, //handleBulkUpdate

		listOrders : {
			onSuccess : function(tagObj)	{

app.u.dump('BEGIN admin_orders.callbacks.listOrders.onSuccess');
var $target = $('#orderListTableBody'); //a table in the orderManagerTemplate

var orderid,cid;
var L = app.data[tagObj.datapointer]['@orders'].length;
if(L)	{
	for(var i = 0; i < L; i += 1)	{
		orderid = app.data[tagObj.datapointer]['@orders'][i].ORDERID; //used for fetching order record.
		cid = app.data[tagObj.datapointer]['@orders'][i].CUSTOMER; //used for sending adminCustomerGet call.
		$target.append(app.renderFunctions.transmogrify({"id":"order_"+orderid,"orderid":orderid,"cid":cid},tagObj.templateID,app.data[tagObj.datapointer]['@orders'][i]))
		}
//assign a click event to the 'view order' button that appears in each row.
	$target.find('.viewOrder').each(function(){
		$(this).click(function(){
			var orderID = $(this).attr('data-orderid');
			var CID = $(this).closest('tr').attr('data-cid');
<<<<<<< HEAD
			app.ext.admin_orders.a.orderDetailsInDialog(orderID,CID);
=======
			app.ext.admin_orders.a.orderDetailsInDialog(orderID,CID);
>>>>>>> origin/201237-jt
			app.model.dispatchThis();
			})
		});

	$target.selectable({filter: 'tr'});

	
	
	}
else	{
	$('#orderListTableContainer').append('There are no orders that match the current filter criteria.');
	}
//at end to ensure this is always removed (results or no results)
//targets the parent container of the tab because the tbody won't show the bg image
$('#orderListTableContainer').removeClass('loadingBG');


				}
			} //listOrders
		}, //callbacks




////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	a : {

		
		initOrderManager : function(P)	{
//			app.u.dump("BEGIN admin_orders.a.initOrderManager");
//			app.u.dump(P);
			if(P.pool && P.targetID)	{
//adds the order manager itself to the dom.
// passes in a new ID so that multiple instances of the ordermanager can be open (not supported yet. may never be supported or needed.)
				$('#'+P.targetID).append(app.renderFunctions.createTemplateInstance('orderManagerTemplate',{'id':'OM_'+P.targetID}));
				
//Make the list of filters selectable. (status, type, marketplace, etc)				
//since only 1 option per UL is selectable, selectable() was avoided.
				$(".filterGroup").children().addClass('pointer').click(function() {
					var $this = $(this);
					if($this.hasClass('ui-selected'))	{$this.removeClass('ui-selected')}
					else	{$this.addClass("ui-selected").siblings().removeClass("ui-selected")}
					});
//go get the list of orders.
				app.ext.admin_orders.a.showOrderList({'POOL':P.pool});
//will add selected class to appropriate default filter in select list.
				$("#orderListFilterPool [data-filtervalue="+P.pool+"]").addClass('ui-selected');
//assigns all the button click events.
				app.ext.admin_orders.u.bindOrderListButtons(P.targetID);
				}
			else	{
				app.u.dump("ERROR! - pool ["+P.pool+"] and/or targetID ["+P.targetID+"] not passed into initOrderManager");
				}
			}, //initOrderManager
		
		
		saveChangesToOrder : function()	{
			app.u.dump("BEGIN admin_orders.a.saveChangesToOrder");
			alert('not working yet');
			$ordersModal.find('.edited').each(function(){
				app.u.dump(" -> "+$(this).attr('data-bind'));
				});
			}, //saveChangesToOrder
			
			
			
		orderDetailsInDialog : function(orderID,CID)	{
app.u.dump("BEGIN extensions.admin_orders.a.orderDetailsInDialog");
app.u.dump(" -> CID : "+CID);
app.u.dump(" -> orderID : "+orderID);
if(orderID)	{

	var safeID = app.u.makeSafeHTMLId(orderID);
	//when a modal may be opened more than once, set autoOpen to false then execute a dialog('open'). Otherwise it won't open after the first time.
	
	var $ordersModal = $('#viewOrderDialog_'+safeID); //global so it can be easily closed.
	
//if dialog is already open, bring it into focus.
	if($ordersModal.dialog( "isOpen" ) === true)	{
		$ordersModal.dialog('moveToTop').effect('highlight'); //.closest('.ui-dialog').effect('bounce'); to effect the entire dialog container
		}
// dialog is not open and/or does not exist. If the dialog was opened, then closed, we re-fetch the order info.
	else	{
//if dialog does not exist (not opened in this session yet), create it.
		if($ordersModal.length == 0)	{
			$ordersModal = $("<div />").attr({'id':'viewOrderDialog_'+safeID,'title':'Edit Order '+orderID}).appendTo('body');
			$ordersModal.dialog({width:$(window).width() - 100,height:$(window).height() - 100,'autoOpen':false});
			}
	
		//be sure to empty the div or if it has already been loaded, duplicate content will show up.
		$ordersModal.empty().dialog('open');
		//create an instance of the invoice display so something is in front of the user quickly.
		$ordersModal.append(app.renderFunctions.createTemplateInstance('orderDetailsTemplate',{'id':'orderDetails_'+safeID,'data-orderid':orderID}));
		//go fetch order data. callback handles data population.
		app.ext.admin_orders.calls.adminOrderDetail.init(orderID,{'callback':'translateSelector','selector':'#orderDetails_'+safeID});
		
		if(CID)	{
			app.ext.admin.calls.customer.adminCustomerGet.init(CID,{'callback':'translateSelector','selector':'#customerInformation'},'mutable'); //
			}
		else	{
			app.u.dump("WARNING! - no CID set.");
			}
		//dispatch occurs outside this function.
		$('#orderDetails_'+safeID+' .orderSupplementalInformation').accordion();
		}
	}
else	{
	app.u.dump("WARNING! - no orderID specificed for view order.");
	}
			}, //orderDetailsInDialog
		
	
		applyFilters : function()	{
			$('#orderListTableBody').empty(); //this is targeting the table body.
			$('#orderListTableContainer').addClass('loadingBG'); //this is the container. tbody won't show the loading gfx.
			var obj = {}
			
			$('#orderFilters ul').each(function(){
				var val = $(this).find('.ui-selected').attr('data-filtervalue');
				if(val){
					obj[$(this).attr('data-filter')]=val
					}
				});
			if($.isEmptyObject(obj))	{
				$('#orderListMessaging').append(app.u.formatMessage('Please select at least one filter criteria'));
				}
			else	{
				app.u.dump(obj);
				app.ext.admin_orders.a.showOrderList(obj);
				}
			},

//shows a list of orders by pool.
		showOrderList : function(filterObj)	{
		
			if(typeof filterObj == 'object' || !$.isEmptyObject(filterObj))	{
			//create instance of the template. currently, there's no data to populate.
				filterObj.DETAIL = 5;
				filterObj.LIMIT = 20; //for now, cap at 20 so test pool is small. ###
				app.ext.admin_orders.calls.adminOrderList.init(filterObj,{'callback':'listOrders','extension':'admin_orders','templateID':'adminOrderLineItem'});
				app.model.dispatchThis();
				
				}
			else	{
				app.u.dump("Warning - no filter object passed into showOrderList");
				}
	
			},
			
			
		bulkCMDOrders : function()	{
			var command = $('#CMD').val().substring(0,4); //will = POOL or MAIL or PMNT
			$('#orderListMessaging').empty(); //clear any existing messaging.
			if(!command)	{
				$('#orderListMessaging').append(app.u.formatMessage('Please select an action to perform'));
				}
			else	{
				switch(command)	{
					case 'POOL':
					app.ext.admin_orders.u.bulkChangeOrderPool();
					break;
					
					case 'PMNT':
					app.ext.admin_orders.u.bulkFlagOrdersAsPaid();
					break;
					
					case 'MAIL':
					app.ext.admin_orders.u.bulkSendEmail();
					break;
					
					default:
						$('#orderListMessaging').append(app.u.formatMessage("Unknown action selected ["+command+"]. Please try again. If error persists, please contact technical support."));
					}
				}
			},
		


		selectAllOrders : function()	{
			$('#orderListTable tr').each(function(){$(this).addClass('ui-selected')});
			},
			
		deselectAllOrders : function()	{
			$('#orderListTable tr').each(function(){$(this).removeClass('ui-selected')});
			},


/*

required params for P:
P.orderID = the orderID to edit. the order should already be in memory.
P.templateID = the lineitem template to be used. ex: orderStuffItemEditorTemplate
*/
			editOrderContents : function(P)	{
var $r = $(); //empty jquery object. line-items are appended to this and then it's all returned.
var orderObj = app.data['adminOrderDetail|'+P.orderID].order;
var L = orderObj['@ITEMS'].length;
var stid;
for(var i = 0; i < L; i += 1)	{
	stid = P.templateID,orderObj['@ITEMS'][i].stid
	$r.append(app.u.transmogrify({'id':stid,'data-stid':stid},P.templateID,orderObj['@ITEMS'][i]));
	}
return $r;
				}
		
		},

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	renderFormats : {
//a product list needs an ID for multipage to work right. will assign a random one if none is set.
//that parent ID is prepended to the sku and used in the list item id to decrease likelyhood of duplicate id's
		stuffList : function($tag,data)	{
//			app.u.dump("BEGIN admin_orders.renderFormats['@ITEMS']List");
			var L = data.value.length;
			if(L > 0)	{
				var thisSTID; //used as a shortcut in the loop below to store the pid during each iteration.
				for(var i = 0; i < L; i += 1)	{
					thisSTID = data.value[i].stid;
					$tag.append(app.renderFunctions.transmogrify({'id':thisSTID,'pid':thisSTID},data.bindData.loadsTemplate,data.value[i]));
					}
				}
			return true;
			},//stuffList

		orderPoolSelect : function($tag,data)	{
			var $opt;
			var pools = app.ext.admin_orders.vars.pools;
			var L = pools.length;
			
			for(var i = 0; i < L; i += 1)	{
				$opt = $("<option />").val(pools[i]).text(pools[i].toLowerCase());
				if(data.value == pools[i])	{
					$opt.attr('selected','selected').css('font-style','italic');
					$tag.attr('data-defaultValue',data.value); //record what the default value is so that a comparison can be done later onChange (if needed).
					};
				$opt.appendTo($tag);
				}
			return true;
			},

		billzone : function($tag,data){
			$tag.text(data.value.substr(0,2)+". "+data.value.substr(2,2).toUpperCase()+", "+data.value.substr(4,5));
			return true;
			}, //billzone
			
		customerNote : function($tag,data)	{
				var L = data.value.length;
				var $o = $("<ul />"); //what is appended to tag. 
				for(var i = 0; i < L; i += 1)	{
					$o.append("<li>"+app.u.unix2Pretty(data.value[i].CREATED_GMT)+": "+data.value[i].NOTE+"<\/li>");
					}
				$tag.append($o.children());
				},
			
		paystatus : function($tag,data){
//			app.u.dump("BEGIN admin_orders.renderFormats.paystatus");
			var ps = data.value.substr(0,1); //first characer of pay status.
			var pretty;
			switch(ps)	{
				case '0': pretty = 'Paid'; break;
				case '1': pretty = 'Pending'; break;
				case '2': pretty = 'Denied'; break;
				case '3': pretty = 'Cancelled'; break;
				case '4': pretty = 'Review'; break;
				case '5': pretty = 'Processing'; break;
				case '6': pretty = 'Voided'; break;
				case '9': pretty = 'Error'; break;
				default: pretty = 'unknown'; break;
				}
			$tag.text("Payment Status: "+pretty).attr('title',data.value);
			return true;
			} //billzone
		},
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {



			bulkChangeOrderPool : function(){

var pool = $('#CMD').val().substr(5);
var numRequests = 0; //the number of requests that need to be made.
$('#orderListTable tr.ui-selected').each(function() {
	$(this).attr('data-status','queued');  //data-status is used to record current status of row manipulation (queued, error, complete)
	numRequests += app.ext.admin_orders.calls.adminOrderUpdate.init($(this).attr('data-orderid'),['SETPOOL?pool='+pool],{"callback":"orderPoolChanged","extension":"admin_orders","targetID":$(this).attr('id')});
	});
if(numRequests)	{
//	app.calls.ping.init({'callback':'handleBulkUpdate','extension':'admin_orders','pool':pool},'immutable'); //for now, don't do anything.
	app.model.dispatchThis('immutable');
	}
else	{
	$('#orderListMessaging').append(app.u.formatMessage('Please select at least one row.'));
	}
				}, //bulkChangeOrderPool

			bulkFlagOrdersAsPaid : function()	{
var numRequests = 0;
var poolColID = app.ext.admin_orders.u.getFlexgridColIdByName('POOL');
var statusColID = app.ext.admin_orders.u.getFlexgridColIdByName('status');

$('#orderListTable tr.ui-selected').each(function() {
	var $row = $(this);
//	app.u.dump(" -> poolColID: "+poolColID);
//	app.u.dump(" -> status: "+$row.find('td:nth-child('+poolColID+')').text().toLowerCase());
	if($row.find('td:nth-child('+poolColID+')').text().toLowerCase() != 'pending')	{
		$('#orderListMessaging').append(app.u.formatMessage('Order '+$row.attr('data-orderid')+' not set to paid because order is not pending'));
		$row.attr({'data-status':'error'}).removeClass('ui-selected').find('td:nth-child('+statusColID+')').html("<span class='ui-icon ui-icon-notice' title='could not flag as paid because status is not pending'></span>");
		}
	else	{
		$(this).attr('data-status','queued');  //data-status is used to record current status of row manipulation (queued, error, complete)
		numRequests += app.ext.admin_orders.calls.adminOrderUpdate.init($(this).attr('data-orderid'),['FLAGORDERASPAID'],{"callback":"orderFlagAsPaid","extension":"admin_orders","targetID":$(this).attr('id')}); 
		}
	});
if(numRequests)	{
//	app.calls.ping.init({'callback':'handleBulkUpdate','extension':'admin_orders','pool':pool},'immutable');
	app.model.dispatchThis('immutable');
	}
else	{
	$('#orderListMessaging').append(app.u.formatMessage('Please select at least one row.'));
	}
				}, //bulkFlagOrdersAsPaid
//for now, we are linking to the legacy email page. This dynamically builds a form and submits it.
			bulkSendEmail : function()	{
				var $dialog = $("<div id='emailDialog' />").attr('title','Send Email').appendTo('body');
				$("<iframe src='/biz/orders3/email.cgi' class='bulkMailIframe'>").attr({'id':'bulkMailIframe','name':'bulkMailIframe'}).appendTo($dialog);
				$dialog.dialog({modal:true,width:'90%',height:600});

				
				var $form = $("<form />").attr({"action":"/biz/orders3/email.cgi","method":"post","id":"tmpForm","target":"bulkMailIframe"});
				$('#orderListTable tr.ui-selected').each(function(){
					$('<input />').attr({"name":$(this).attr('data-orderid'),"value":"1","type":"hidden"}).appendTo($form);
					});
				$('<input />').attr({"name":"CMD","value":"REVIEW","type":"hidden"}).appendTo($form);
				$form.appendTo('body');
				$form.submit();
				},
//used in the order editor. executed whenever a change is made to update the number of changes in the 'save' button.
			updateOrderChangeCount : function()	{
				var numEdits = $('.edited').length;
				$('#changeCount').text(numEdits)
				return numEdits;
				},

			getFlexgridColIdByName : function(name)	{
//				app.u.dump("BEGIN admin_orders.u.getFlexgridColIdByName");
//				app.u.dump(" -> name = "+name);
				var colIndex = false; //what is returned. the column index.
//SANITY - flexigrid creates a separate table for the header columns.
				$('#orderList thead th').each(function(index){
					if($(this).attr('data-name') == name)	{ colIndex = index+1} 
					});
//				app.u.dump(" -> colIndex = "+colIndex);
				return colIndex; //should only get here if there was no match
				},

//selector = some Jquery selector (not the jquery object).  ex: #viewer or .address
//the selector should be the parent element. any elements within need an 'editable' class on them.
//this way, a specific section of the page can be made editable (instead of just changing all editable elements).
//using the .editable class inside allows for editing all elements on a page at one time. may be suicide tho.
			makeEditable : function(selector,P)	{
//app.u.dump("BEGIN admin_orders.u.makeEditable");
if(!P.inputType)	{P.inputType == 'text'}
//info on editable can be found here: https://github.com/tuupola/jquery_jeditable
//app.u.dump("BEGIN admin.a.makeEditable ["+selector+" .editable]");
$(selector + ' .editable').each(function(){
	var $text = $(this)
//	app.u.dump(" -> making editable: "+$text.data('bind'));
	if($text.attr('title'))	{
		$text.before("<label>"+$text.attr('title')+": </label>");
		$text.after("<br />");
		}
	var defaultValue = $text.text(); //saved to data.defaultValue and used to compare the post-editing value to the original so that if no change occurs, .edited class not added.
//	app.u.dump(" -> defaultValue: "+defaultValue);
	$text.addClass('editEnabled').data('defaultValue',defaultValue).editable(function(value,settings){
//onSubmit code:
		if(value == $(this).data('defaultValue'))	{
			app.u.dump("field edited. no change.")
			}
		else	{
			$(this).addClass('edited');
			app.ext.admin_orders.u.updateOrderChangeCount();
			}
		return value;
		}, {
		  indicator : 'loading...', //can be img tag
		  onblur : 'submit',
		  type : P.inputType,
		  style  : 'inherit'
		  }); //editable
	}); //each
				},

				
			bindOrderListButtons : function(targetID)	{
//				app.u.dump("BEGIN admin_orders.u.bindOrderListButtons");
				$('#'+targetID+' [data-orderaction]').each(function(){
					var action = $(this).attr('data-orderaction');
//					app.u.dump(" -> action: "+action);
					$(this).click(function(){
//						app.u.dump(" -> action: "+action);
						app.ext.admin_orders.a[action]()
						})
					});
				} //bindOrderListButtons
		
			} //u


		
		} //r object.
	return r;
	}