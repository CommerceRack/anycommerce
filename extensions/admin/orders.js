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
DEV NOTES

When updating an address on an order, always use the SETSHIPADDR and SETBILLADDR macros
 -> if you use a 'set', then luser permissions may not allow a luser to make an update.

For the list of supported payment methods, do an appPaymentMethods command and pass 'this' cartID.
*/



var admin_orders = function() {
	var theseTemplates = new Array('orderManagerTemplate','adminOrderLineItem','orderDetailsTemplate','orderStuffItemTemplate','orderPaymentHistoryTemplate','orderEventHistoryTemplate','orderTrackingHistoryTemplate','orderAddressTemplate','buyerNotesTemplate','orderStuffItemEditorTemplate');
	var r = {

////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		
	vars : {
		"pools" : ['RECENT','PENDING','REVIEW','HOLD','APPROVED','PROCESS','COMPLETED','CANCELLED'],
		"payStatus" : ['Paid','Pending','Denied','Cancelled','Review','Processing','Voided','Error','unknown'], //the order here is VERY important. matches the first char in paystatus code.
		"emailMessages" : {
			'OCREATE':'Order Created',
			'OCUSTOM1' : 'Order Custom 1',
			'OCUSTOM2' : 'Order Custom 2',
			'ODENIED' : 'Order Payment Denied',
			'OFBAMAZON' : 'Amazon Feedback Request',
			'OMERGE' : 'Your order has been merged',
			'ORDER.ARRIVED.AMZ' : 'Order Arrived: Amazon Follow Up',
			'ORDER.ARRIVED.BUY' : 'Order Arrived: Buy.com Follow Up',
			'ORDER.ARRIVED.EBF' : 'Order Arrived: eBay Follow Up',
			'ORDER.ARRIVED.WEB' : 'Order Arrived: Website Follow Up',
			'ORDER.NOTE' : 'Order %ORDERID%',
			'ORDER.SHIP.EBAY' : 'Your order has been shipped.',
			'OSPLIT' : 'Changes to your order',
			'PAYREMIND' : 'Payment Reminder',
			'STATAPPR' : 'Order %ORDERID% Approved',
			'STATBACK' : 'Order %ORDERID% Backordered',
			'STATCOMP' : 'Order %ORDERID% shipped',
			'STATKILL' : 'Order %ORDERID% Cancelled',
			'STATPEND' : 'Order %ORDERID% Pending',
			'STATPRE' : 'Order %ORDERID% Preordered',
			'STATPROC' : 'Order %ORDERID% Processing',
			'STATRECN' : 'Order %ORDERID% moved to Recent',
			'TRACKING' : 'Order %ORDERID% shipped'
			},
		"markets" : {
			'ebay' : 'eBay',
			'amazon' : 'Amazon'
			}
		},
	calls : {


//obj requires: cartid, countrycode and ordertotal
//This call was left here intentionally.  The call is also in store_checkout and it's a bit different there.
//The two calls will need to eventually get merged.
		appPaymentMethods : {
			init : function(obj,_tag,Q)	{
				this.dispatch(obj,_tag,Q);
				return 1;
				},
			dispatch : function(obj,_tag,Q)	{
				obj = obj || {};
				obj._cmd = "appPaymentMethods";
				obj._tag = _tag || {};
				obj._tag.datapointer = "appPaymentMethods|"+obj.cartid;
				app.model.addDispatchToQ(obj,'immutable');
				}
			} //appPaymentMethods

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
				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/orders.html',theseTemplates);
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}, //init

//very similar to the original translate selector in the control and intented to replace it. 
//This executes the handleAppEvents in addition to the normal translation.
//the selector also gets run through jqSelector and hideLoading (if declared) is run.
		translateSelector : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN callbacks.translateSelector");
				var selector = app.u.jqSelector(tagObj.selector[0],tagObj.selector.substring(1)); //this val is needed in string form for translateSelector.
//				app.u.dump(" -> selector: "+selector);
				var $target = $(selector)
				if(typeof jQuery().hideLoading == 'function'){$target.hideLoading();}
				$target.removeClass('loadingBG'); //try to get rid of anything that uses loadingBG (cept prodlists) in favor of show/hideLoading()
				app.renderFunctions.translateSelector(selector,app.data[tagObj.datapointer]);
				app.ext.admin.u.handleAppEvents($target);
				}
			},









		mergeDataForBulkPrint : {
			
			onSuccess : function(tagObj){
				
				var tmpData = {};
				//merge is another data pointer, in this case the profile pointer. both data sets are merged and passed into transmogrify
				//this is because a template only wants to be parsed once.
				if(tagObj.merge)	{
					tmpData = $.extend(app.data[tagObj.datapointer],app.data[tagObj.merge]);
					}
				else	{
					tmpData =app.data[tagObj.datapointer];
					}
				var $print = app.renderFunctions.transmogrify({},tagObj.templateID,tmpData);
				$print.addClass('pageBreak'); //ensures template is on it's own page.
				$('#printContainer').append($print);
				}
			
			},









//executed per order lineitem on a bulk update.
		orderPoolChanged : {
			onSuccess : function(tagObj)	{
//				app.u.dump(" -> targetID: "+targetID);
				$(app.u.jqSelector('#',tagObj.targetID)).empty().remove(); //delete the row. the order list isn't re-requested to reflect the change.
				},
			onError : function(responseData)	{
//				app.u.dump("BEGIN admin_orders.callbacks.orderPoolChanged.onError. responseData: "); app.u.dump(responseData);
				var $row = $(app.u.jqSelector('#',tagObj.targetID));
				$row.attr({'data-status':'error'}).find('td:eq(0)').html("<span class='ui-icon ui-icon-alert'></span>");
				app.ext.admin_orders.u.unSelectRow($row);
				delete responseData._rtag.targetID; //don't want the message here.
				app.u.throwMessage(responseData);
				}		
			}, //orderPoolChanged



//executed per order lineitem on a sendmail macro for order update.
// on success, if the row is still selected, change the icon from loading back to selected. if not selected, drop icon
//on error, show an error icon in the first column, but suppress the error message from being loaded in THAT column, which is a small spot to put a message.
		handleSendEmail : {
			onSuccess : function(tagObj)	{
//				app.u.dump("BEGIN admin_orders.callsbacks.handleSendEmail.onSuccess"); app.u.dump(tagObj);
				var $td = $(app.u.jqSelector('#',tagObj.targetID)).find('td:eq(0)');
//restore selected icon IF row is still selected.
				if($td.parent().hasClass('ui-selected')){$td.html("<span class='ui-icon ui-icon-circle-check'></span>")}
				else	{$td.html("")}
				$td.parent().attr('data-status',''); //reset status.
				},
			onError : function(responseData)	{
//				app.u.dump("BEGIN admin_orders.callbacks.orderFlagAsPaid.onError. responseData: "); app.u.dump(responseData);
//change the status icon to notify user something went wrong on this update.
//also, unselect the row so that the next click re-selects it and causes the error icon to disappear.
				var $row = $(app.u.jqSelector('#',responseData._rtag.targetID));
				$row.attr({'data-status':'error'}).find('td:eq(0)').html("<span class='ui-icon ui-icon-alert'></span>");
				app.ext.admin_orders.u.unSelectRow($row);
				delete responseData._rtag.targetID; //don't want the message here.
				app.u.throwMessage(responseData);
				}		
			}, //handleSendEmail
			
			


		handleSendEmailFromEdit : {
			onSuccess : function(tagObj)	{
				$('body').hideLoading();
				app.u.throwMessage(app.u.successMsgObject("Your email has been sent."));
				}
			}, //handleSendEmail
			



//executed per order lineitem on a flagOrderAsPaid update.
		orderFlagAsPaid : {
			onSuccess : function(tagObj)	{
				$(app.u.jqSelector('#',tagObj.targetID)).find('td:eq('+app.ext.admin_orders.u.getTableColIndexByDataName('ORDER_PAYMENT_STATUS')+')').text('Paid');
				var $td = $(app.u.jqSelector('#',tagObj.targetID)).find('td:eq(0)')
//restore selected icon IF row is still selected.
				if($td.parent().hasClass('ui-selected')){$td.html("<span class='ui-icon ui-icon-circle-check'></span>")}
				else	{$td.html("")}
				$td.parent().attr('data-status',''); //reset status.
				},
			onError : function(responseData)	{
//				app.u.dump("BEGIN admin_orders.callbacks.orderFlagAsPaid.onError. responseData: "); app.u.dump(responseData);
//change the status icon to notify user something went wrong on this update.
//also, unselect the row so that the next click re-selects it and causes the error icon to disappear.
				var $row = $(app.u.jqSelector('#',responseData._rtag.targetID));
				$row.attr({'data-status':'error'}).find('td:eq(0)').html("<span class='ui-icon ui-icon-alert'></span>");
				app.ext.admin_orders.u.unSelectRow($row);

				delete responseData._rtag.targetID; //don't want the message here.
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
				}	
			}, //handleBulkUpdate

		listOrders : {
			onSuccess : function(tagObj)	{

//app.u.dump('BEGIN admin_orders.callbacks.listOrders.onSuccess');
//app.u.dump(' -> tagObj: '); app.u.dump(tagObj);

var $target = $('#orderListTableBody'); //a table in the orderManagerTemplate
$('body').hideLoading();

var orderid,cid;
var ordersData = app.data[tagObj.datapointer]['@orders'];

var L = ordersData.length;
var $cmenu; //recyled. stors the context menu for an order.

if(L)	{
//	app.u.dump(" -> ordersData.length (L): "+L);
	for(var i = 0; i < L; i += 1)	{
		orderid = ordersData[i].ORDERID; //used for fetching order record.
		cid = ordersData[i].CUSTOMER; //used for sending adminCustomerGet call.
		$target.append(app.renderFunctions.transmogrify({"id":"order_"+orderid,"cid":cid,"orderid":orderid,"sdomain":ordersData[i].SDOMAIN},tagObj.templateID,ordersData[i]))
		}

$('button',$target).button();
var statusColID = app.ext.admin_orders.u.getTableColIndexByDataName('ORDER_PAYMENT_STATUS'); //index of payment status column. used in flagOrderAsPaid. here so lookup only occurs once.

//adding the contextual menu in the loop above failed. I think it's because the DOM wasn't updateing fast enough.	
//this code would be a lot tighter if contextMenu supports a jquery object as the selector. hey. there's a thought.
	$('.adminOrderLineItem').each(function(){
		var $row = $(this);
		var rowID = $row.attr('id');
		var orderid = $row.data('orderid');
		var $cmenu = $("<menu \/>").attr({'type':'context','id':'contextMenuOrders_'+orderid}).addClass('showcase displayNone');
		$cmenu.append("<h3 style='margin:0; padding:0;'>"+orderid+"<\/h3><hr \/>");
		
//		$("<command \/>").attr('label','Payment details').on('click',function(){navigateTo('/biz/orders/payment.cgi?ID='+orderid+'&ts=',{'dialog':true}); return false;}).appendTo($cmenu);
//		$("<command \/>").attr('label','Edit contents').on('click',function(){navigateTo('/biz/orders/edit.cgi?CMD=EDIT&OID='+orderid+'&ts=',{'dialog':true}); return false;}).appendTo($cmenu);
		$("<command \/>").attr('label','Edit customer').on('click',function(){navigateTo('/biz/utilities/customer/index.cgi?VERB=EDIT&CID='+$row.data('cid'),{'dialog':true}); return false;}).appendTo($cmenu);
		$("<command \/>").attr('label','Create crm ticket').on('click',function(){navigateTo('/biz/crm/index.cgi?ACTION=CREATE&orderid='+orderid,{'dialog':true}); return false;}).appendTo($cmenu);
		
		$("<hr \/>").appendTo($cmenu);
		
		var $emailMenu = $("<menu label='Send email message '>");
		for(key in app.ext.admin_orders.vars.emailMessages)	{
			$("<command \/>").attr('label',app.ext.admin_orders.vars.emailMessages[key]).on('click',function(){
				app.ext.admin_orders.u.sendOrderMail(orderid,key,$row);
				app.model.dispatchThis('immutable');
				}).appendTo($emailMenu);
			}
		$cmenu.append($emailMenu);


		$("<hr \/>").appendTo($cmenu);
		
		var $poolMenu = $("<menu label='Change pool to: '>");
		for(var i = 0; i < app.ext.admin_orders.vars.pools.length; i += 1)	{
			$("<command \/>").attr('label',app.ext.admin_orders.vars.pools[i]).on('click',function(){
				app.ext.admin_orders.u.changeOrderPool($row,$(this).attr('label'),statusColID);
				app.model.dispatchThis('immutable');
				}).appendTo($poolMenu);
			}
		$cmenu.append($poolMenu);
		$("<command \/>").attr('label','Flag as paid').on('click',function(){
			app.ext.admin_orders.u.flagOrderAsPaid($row,statusColID);
			app.model.dispatchThis('immutable');
			}).appendTo($cmenu);
		$.contextMenu({
			selector: "#"+rowID,
			items: $.contextMenu.fromMenu($cmenu)
			});
		app.ext.admin.u.handleAppEvents($row);
		}); //orderlineitem.each
	
//assign a click event to the 'view order' button that appears in each row.
	$target.find('.viewOrder').each(function(){
		$(this).click(function(){
			var orderID = $(this).attr('data-orderid');
			var CID = $(this).closest('tr').attr('data-cid');
			app.ext.admin_orders.a.orderDetailsInDialog(orderID,CID);
			app.model.dispatchThis();
			})
		});

	$target.selectable({
		filter: 'tr',
		stop: function(){
			$( "tr", this ).each(function() {
				var $row = $(this);
//handle the icon.
				if($row.data('status') == 'queued')	{} //do nothing here. leave the wait icon alone.
				else if($row.hasClass('ui-selected'))	{
					$('td:eq(0)',$row).html("<span class='ui-icon ui-icon-circle-check'></span>");
					}
				else	{
					$('td:eq(0)',$row).html(""); //empty status icon container.
					}
				});
			}
		});
	
	}
else	{
	$('#orderListTableContainer').append("<div class='noOrdersMessage'>There are no orders that match the current filter criteria.<\/div>");
	}

				}
			} //listOrders
		}, //callbacks




////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	a : {

		
		initOrderManager : function(P)	{
//			app.u.dump("BEGIN admin_orders.a.initOrderManager");
//			app.u.dump(P);

			var oldFilters = app.ext.admin.u.devicePreferencesGet('admin_orders');
			if(P.filters){} //used filters that are passed in.
			else if(oldFilters != undefined)	{
				P.filters = oldFilters.managerFilters || {};
				}
			else{P.filters = {}}

//if no filters are passed in and no 'last filter' is present, set some defaults.
			if($.isEmptyObject(P.filters))	{
				P.filters.POOL = 'RECENT';
				P.filters.LIMIT = 30; //if no limit is set, all orders from this pool are returned (big and random order)
				}
			else{}

			if(P.filters && P.targetID)	{
				var $target = $(app.u.jqSelector('#',P.targetID));

//adds the order manager itself to the dom.
// passes in a new ID so that multiple instances of the ordermanager can be open (not supported yet. may never be supported or needed.)
				$target.empty().append(app.renderFunctions.transmogrify({'id':'OM_'+P.targetID},'orderManagerTemplate',app.ext.admin_orders.vars));
				
				$("[data-ui-role='admin_orders|orderUpdateBulkEditMenu']",$target).menu();
// 1 item in the menu can be selected at a time, but the 'proceed' button is what actually makes the changes. the ui-selected class is used to determine action
				$("[data-ui-role='admin_orders|orderUpdateBulkEditMenu'] a",$target).each(
					function(){$(this).on('click',function(event){
						event.preventDefault();
						if($(this).children('ul').length == 1)	{
//if the li has a child list, do nothing on click, the children contain the actions.
//							app.u.dump(" -> selected command has children.");
							} 
						else	{
							var command = $(this).attr('href').substring(1), //will = POOL|PENDING or  PRNT|INVOICE
							actionType = command.substring(0,4); //will = PRNT or POOL. 4 chars
							app.u.dump(" -> actionType: "+actionType);
							app.u.dump(" -> command: "+command);
							if(actionType)	{
								switch(actionType)	{
									case 'POOL':
									app.ext.admin_orders.u.bulkChangeOrderPool(command);
									app.model.dispatchThis('immutable');
									break;
									
									case 'PMNT':
									app.ext.admin_orders.u.bulkFlagOrdersAsPaid();
									app.model.dispatchThis('immutable');
									break;
									
									case 'MAIL':
									app.ext.admin_orders.u.bulkSendOrderMail(command);
									break;
									
									case 'PRNT':
									app.ext.admin_orders.u.bulkOrdersPrint(command);
									break;
									
									default:
										app.u.throwMessage("Unknown actionType selected ["+actionType+"]. Please try again. If error persists, please contact technical support.");
									}
	
								}
							else{
//do nothing. parent menu was clicked. this easily happens by accident, so no warning message displayed.
								}
							}
						})
					});

				if(P.filters.LIMIT)	{$('#filterLimit').val(P.filters.LIMIT)}
				$(".searchAndFilterContainer",$target).accordion({
					heightStyle: "content"
					});
//Make the list of filters selectable. (status, type, marketplace, etc)				
//since only 1 option per UL is selectable, selectable() was avoided.
				$(".filterGroup",$target).children().each(function(){
					var $this = $(this);
//if the filter is already selected as part of P.filters, tag as selected.
					if($this.data('filtervalue') == P.filters[$this.parent().data('filter')]){
						$this.addClass('ui-selected');
						}
					else	{}
					$this.addClass('pointer').click(function() {
						if($this.hasClass('ui-selected'))	{$this.removeClass('ui-selected')}
						else	{$this.addClass("ui-selected").siblings().removeClass("ui-selected")}
						})
					});
//go get the list of orders.
				app.ext.admin_orders.a.showOrderList(P.filters);

//assigns all the button click events.
				app.ext.admin.u.handleAppEvents($target);
				}
			else	{
				app.u.throwGMessge("WARNING! - pool ["+P.pool+"] and/or targetID ["+P.targetID+"] not passed into initOrderManager");
				}
			}, //initOrderManager



//targetID can be a tab, so the order template is appended to that (assigned to $order) and that is what's modified/tranlated. NOT targetID.
//otherwise, it could be possible to load new content into the tab but NOT have the data attributes cleaned out.
		showOrderView : function(orderID,CID,targetID,Q)	{
			var r = 1; //what is returned. # of dispatches that occur.
			Q = Q || 'mutable'
			if(orderID && targetID)	{
//app.u.dump(" -> targetID: "+targetID);
//if you are reusing a targetID, do your own empty before running this.
var $target = $(app.u.jqSelector('#',targetID)),
$order = $(app.renderFunctions.createTemplateInstance('orderDetailsTemplate',{'id':targetID+"_order",'orderid':orderID}));
$order.attr('data-order-view-parent',orderID); //put this on the parent so that any forms or whatnot that need to reload early can closest() this attrib and get id.

//create an instance of the invoice display so something is in front of the user quickly.
$target.append($order);

$('body').showLoading();

//go fetch order data. callback handles data population.
app.ext.admin.calls.adminOrderDetail.init(orderID,{'callback':function(responseData){
	app.u.dump("Executing callback for adminOrderDetail");
	var selector = app.u.jqSelector(responseData.selector[0],responseData.selector.substring(1)), //this val is needed in string form for translateSelector.
	$target = $(selector),
	orderData = app.data[responseData.datapointer];
	orderData.emailMessages = app.ext.admin_orders.vars.emailMessages; //pass in the email messages for use in the send mail button
	$('body').hideLoading();
	if(app.model.responseHasErrors(responseData)){
		app.u.throwMessage(responseData);
		}
	else	{
		app.renderFunctions.translateSelector(selector,orderData);
//cartid isn't present till after the orderDetail request, so getting payment methods adds a second api request.
		app.ext.admin_orders.calls.appPaymentMethods.init({
			'cartid':orderData.cart.cartid,
			'ordertotal':orderData.sum.order_total,
			'countrycode':orderData.ship.countrycode || orderData.bill.countrycode
			},{
			'callback':function(responseData){
				if(app.model.responseHasErrors(responseData)){
					app.u.throwGMessage("In admin_orders.u.orderDetailsInDialog, the request for payment details has failed.");
					}
				else {
//						app.u.dump("responseData: "); app.u.dump(responseData);
//translate just the right col so the rest of the panel isn't double-tranlsated (different data src).
					app.renderFunctions.translateSelector("#adminOrdersPaymentMethodsContainer [data-ui-role='orderUpdateAddPaymentContainer']",app.data[responseData.datapointer]);
					$('input:radio',$target).each(function(){
						$(this).off('click.getSupplemental').on('click.getSupplemental',function(){
							app.ext.convertSessionToOrder.u.updatePayDetails($(this).closest('fieldset'));
							if($(this).val() == 'CREDIT')	{
								var $addlInputs = $("<div \/>");
								$("<label \/>").text('authorize').prepend($("<input \/>").val('AUTHORIZE').attr({'name':'VERB','type':'radio'})).appendTo($addlInputs);
								$("<label \/>").text('charge').prepend($("<input \/>").val('CHARGE').attr({'name':'VERB','type':'radio'})).appendTo($addlInputs);
								$("<label \/>").text('refund').prepend($("<input \/>").val('REFUND').attr({'name':'VERB','type':'radio'})).appendTo($addlInputs);
								$(this).parent().next().append($addlInputs);
								}
							});
						});
					}
				}
			},'immutable');
		app.model.dispatchThis('immutable');
		
		app.ext.admin.u.handleAppEvents($target);
//trigger the editable regions
		app.ext.admin_orders.u.makeEditable(selector+' .billAddress',{});
		app.ext.admin_orders.u.makeEditable(selector+' .shipAddress',{});
		app.ext.admin_orders.u.makeEditable(selector+" [data-ui-role='orderUpdateNotesContainer']",{'inputType':'textarea'});
		}
	},'extension':'admin_orders','selector':'#'+$order.attr('id')},Q);

if(CID)	{
	r += app.ext.admin.calls.customer.adminCustomerGet.init(CID,{'callback':'translateSelector','extension':'admin_orders','selector':'#customerInformation'},Q); //
	}
else	{
	app.u.dump("WARNING! - no CID set.");
	}
//dispatch occurs outside this function.
$('.orderSupplementalInformation',$target).accordion({
	collapsible: true,
	heightStyle: "content"
	});
app.ext.admin.u.handleAppEvents($target);


				}
			else	{
				app.u.throwGMessage("In admin_orders.a.showOrderDetails, either orderID ["+orderID+"] or targetID ["+targetID+"] were left blank");
				}
			return r; //1 dispatch occurs
			},


		orderDetailsInDialog : function(orderID,CID)	{
//app.u.dump("BEGIN extensions.admin_orders.a.orderDetailsInDialog");
//app.u.dump(" -> orderID : "+orderID);
//app.u.dump(" -> CID : "+CID);

if(orderID)	{


	//when a modal may be opened more than once, set autoOpen to false then execute a dialog('open'). Otherwise it won't open after the first time.
	safeID = 'viewOrderDialog_'+orderID;
	var $ordersModal = $(app.u.jqSelector('#',safeID)); //global so it can be easily closed.
	
//if dialog is already open and not empty, bring it into focus.
	if($ordersModal.dialog( "isOpen" ) === true && $ordersModal.children().length)	{
		$ordersModal.dialog('moveToTop').effect('highlight'); //.closest('.ui-dialog').effect('bounce'); to effect the entire dialog container
		}
// dialog is not open and/or does not exist. If the dialog was opened, then closed, we re-fetch the order info.
	else	{
//if dialog does not exist (not opened in this session yet), create it.
		if($ordersModal.length == 0)	{
			$ordersModal = $("<div />").attr({'id':safeID,'title':'Edit Order '+orderID}).data('orderid',orderID).appendTo('body');
			$ordersModal.dialog({width:"90%",height:$(window).height() - 100,'autoOpen':false,modal:true});
			}

		//be sure to empty the div or if it has already been loaded, duplicate content will show up.
		$ordersModal.dialog('open');
		this.showOrderView(orderID,CID,safeID);
		}
	}
else	{
	app.u.throwGMessage("WARNING! - no orderID passed into admin_orders.u.orderDetailsInDialog.");
	}
			}, //orderDetailsInDialog



//shows a list of orders by pool.
		showOrderList : function(filterObj)	{
			if(!$.isEmptyObject(filterObj))	{
				$('body').showLoading();
			//create instance of the template. currently, there's no data to populate.
				filterObj.DETAIL = 9;
				app.ext.admin.calls.adminOrderList.init(filterObj,{'callback':'listOrders','extension':'admin_orders','templateID':'adminOrderLineItem'});
				app.model.dispatchThis();
				}
			else	{
				app.u.throwGMessage("Warning! no filter object passed into admin_orders.calls.showOrderList."); app.u.dump(filterObj);
				}
	
			}, //showOrderList


		handlePaymentAction : function($frm)	{
			var formJSON = $frm.serializeJSON(),
			$parent = $frm.closest("[data-order-view-parent]"),
			orderID = $parent.data('order-view-parent'),
			err = false;
			if(orderID)	{

//make sure that an ammount is specified for those actions that offer an amount input.
				if(!formJSON.uuid)	{
					err = 'No valid transaction uuid found.';
					}
				else if(!formJSON.ACTION)	{
					err = 'No valid action/verb found.';
					}
				else if(formJSON.ACTION == formJSON.ACTION.match(/capture|marketplace-refund|refund|set-paid|credit/))	{
					if(!formJSON.amt)	{err = 'Please specify an amount';}
					else if(formJSON.amt <= 0)	{err = 'Invalid amount specified. Must be a positive integer.';}
					else if(!Number(formJSON.amt))	{err = 'Amount must be a number.';}
					else	{}
					}
				else if(formJSON.action == 'override')	{
					if(formJSON.ps)	{}
					else	{err = 'Please specify a new payment status';}
					}
				else	{}

				if(err)	{
					var msgObj = app.u.errMsgObject(err);
					msgObj.parentID = 'adminOrdersPaymentMethodsContainer';
					app.u.throwMessage(msgObj);
					}
				else	{
					formJSON.orderid = orderID; //needed in obj for dispatch
					$parent.empty();
					app.ext.admin.calls.adminOrderPaymentAction.init(formJSON,{}); //always immutable.
					app.ext.admin_orders.a.showOrderView(orderID,app.data['adminOrderDetail|'+orderID].customer.cid,$parent.attr('id'),'immutable'); 
					app.model.dispatchThis('immutable');
					}
				}
			else	{
				app.u.throwGMessage("In admin_orders.a.handlePaymentAction, unabled to ascertain orderID.");
				}
			return false;
			}
		
		},

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


	renderFormats : {
		orderFlagsAsSpans : function($tag,data)	{
			var flags = app.ext.admin_orders.u.getOrderFlagsAsArray(data.value),
			L = flags.length;
//			app.u.dump(" -> flags: "); app.u.dump(flags);
			for(var i = 0; i < L; i += 1)	{
				$tag.append($("<span \/>").addClass(flags[i].toLowerCase()));
				}
			}, //orderFlagsAsSpans
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
			}, //orderPoolSelect
		
		paymentActions : function($tag,data)	{
//			app.u.dump("BEGIN admin_orders.renderFormats.paymentActions");
			if(data.value.puuid)	{
				$tag.append("[chained]"); //chained items get no actions.
				}
			else	{
				var actions = app.ext.admin_orders.u.determinePaymentActions(data.value), //returns actions as an array.
				L = actions.length;
				if(L > 0)	{
					$select = $("<select \/>").attr('name','action').data(data.value);
					$select.off('change.showActionInputs').on('change.showActionInputs',function(){
						var $tr = $(this).closest('tr');
						if($(this).val())	{
		//					app.u.dump("$tr.next().attr('data-ui-role'): "+$tr.next().attr('data-ui-role'));
		//if the select list has already been changed, empty and remove the tr so there's no duplicate content.
							if($tr.next().data('ui-role') == 'admin_orders|actionInputs')	{$tr.next().empty().remove();}
							else	{} //content hasn't been generated already, so do nothing.

							$tr.after("<tr data-ui-role='admin_orders|actionInputs'><td colspan='"+$tr.children().length+"' class='alignRight actionInputs'><form action='#' onSubmit='app.ext.admin_orders.a.handlePaymentAction($(this)); return false;'><fieldset>"+app.ext.admin_orders.u.getActionInputs($(this).val(),$(this).data())+"<\/fieldset><\/form><\/td><\/tr>");
							$tr.next().find('button').button(); //buttonify the button
							}
						else	{
	//to get here. most likely the empty option was selected. do nothing.
							}
						});
					$select.append($("<option \/>")); //add an empty option to the top so that a selection triggers the change event.
					for(var i = 0; i < L; i += 1)	{
						$select.append($("<option \/>").val(actions[i]).text(actions[i]))
						}
					$tag.append($select);
					}
				}
			},
		
//used for adding email message types to the actions dropdown.
		emailMessagesListItems : function($tag,data)	{
			for(key in data.value)	{
				$tag.append("<li><a href='#MAIL|"+key+"'>"+data.value[key]+"</a></li>");
				}
			},

		billzone : function($tag,data){
			$tag.text(data.value.substr(0,2)+". "+data.value.substr(2,2).toUpperCase()+", "+data.value.substr(4,5));
			return true;
			}, //billzone
			
		
		reviewStatus : function($tag,data)	{
			var c = data.value[0]; //first character is a good indicator of the status.
/*
#Approved  AXX   (Green)
#Review  RXX   (Yellow)
#Escalated EXX   (Orange)
#Declined  DXX   (Red)
#Unknown   ''    (white/Not Set)
*/
			if(c == 'A')	{$tag.attr('title','Approved').addClass('green').text('A')}
			else if(c == 'R')	{$tag.attr('title','Review').addClass('yellow').text('R')}
			else if(c == 'E')	{$tag.attr('title','Escalated').addClass('orange').text('E')}
			else if(c == 'D')	{$tag.attr('title','Declined').addClass('red').text('D')}
			else if(c == '')	{} //supported, but no action/output.
			else	{
				app.u.dump("WARNING! unsupported key character in review status for admin.orders.renderFormats.reviewstatus");
				}
			}, //reviewStatus
		
		paystatus : function($tag,data){
//			app.u.dump("BEGIN admin_orders.renderFormats.paystatus");
			var ps = data.value.substr(0,1), //first characer of pay status.
			pretty;

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

			$tag.text(pretty).attr('title',data.value); //used in order list, so don't force any pre/posttext.
			return true;
			}, //paystatus

		
		paystatusDetailed : function($tag,data){
			app.u.dump("BEGIN admin_orders.renderFormats.paystatusDetailed");

			var pref = data.value, //shortcut. used the common name so dev's would know exactly what data type we're dealing with.
			ps = pref.ps.substr(0,1), //first characer of pay status.
			output,
			className = ''; //css class applied to tag. a color based on payment status

			switch(ps)	{
				case '0': output = 'Paid'; break;
				case '1': output = 'Pending'; break;
				case '2': output = 'Denied'; break;
				case '3': output = 'Cancelled'; break;
				case '4': output = 'Review'; break;
				case '5': output = 'Processing'; break;
				case '6': output = 'Voided'; break;
				case '9': output = 'Error'; break;
				default: output = 'unknown'; break;
				}
// ??? status '5' is not handled in this logic, which came directly from payment.cgi line 461
			if(app.ext.admin_orders.u.ispsa(ps,[2,6,9]))	{className = 'lineThrough'}
			else if	(app.ext.admin_orders.u.ispsa(ps,[3]))	{className = 'red'}
			else if	(app.ext.admin_orders.u.ispsa(ps,[4]))	{className = 'orange'}
			else if(app.ext.admin_orders.u.ispsa(ps,[0]))	{className = 'green'}
			else if (app.ext.admin_orders.u.ispsa(ps,[1]))	{className = 'blue'}
			else	{} //
			output = "<div class='"+className+"'><b>"+output+"<\/b> ("+pref.ps+")<\/div>"; //add the class just to the pretty payment status.
			if (pref.tender == 'PAYPALEC') {
				output += "<div class='hint'>Paypal Transaction ID: "+pref.auth+"<\/div>";
				}
			else if (pref.tender == 'PAYPAL') {
				output += "<div class='hint'>Paypal Transaction ID: "+pref.auth+"<\/div>";
				}
			else if (pref.tender == 'GOOGLE') {
				output += "<div class='hint'>Google Order ID: "+pref.txn+"<\/div>";
				}
			else if (pref.tender == 'EBAY') {
				output += "<div class='hint'>eBay Payment Transaction ID: "+pref.txn+"<\/div>";
				}
			else if (pref.tender == 'GIFTCARD') {
				output += "<div class='hint'>Giftcard: "+pref.acct+"<\/div>";			
				}
			else if (pref.tender == 'BUY') {
				output += "<div class='hint'>Buy.com Order #: "+pref.acct+"<\/div>";
				}
			
			else if (pref.tender == 'PO') {
				output += "<div class='hint'>PO: "+pref.acct+"<\/div>";
				// !!! neeed to display PO #.
				}

			else if (pref.tender == 'ECHECK') {
				if (pref.auth || pref.txn) {
					output += "<div class='hint'>Gateway Response: ";
					if (pref.auth) {
						output += "<span>auth = "+pref.auth+"<\/span> ";
						}
					if (pref.txn) {
						output += "<span>Settlement = "+pref.txn+"<\/span>";
						}
					output += "</div>";
					}
				// !!! neeed to display echeck details.
				}

			else if (pref.tender == 'CREDIT') {
				if (pref.auth || pref.txn) {
					output += "<div class='hint'>Gateway Response: ";
					if (pref.auth) {
						output += "<span>Auth = "+pref.auth+"<\/span>";
						}
					if (pref.txn) {
						output += "<span>Settlement = "+pref.txn+"<\/span>";
						}
					output += "</div>";
					}
				// !!! need to display card details
				}

			$tag.html(output); //used in order list, so don't force any pre/posttext.
			return true;
			} //paystatus

		}, //renderFormats



////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {

//https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Bitwise_Operators

//The flags field in the order is an integer. The binary representation of that int (bitwise and) will tell us what flags are enabled.
		getOrderFlagsAsArray : function(flagint)	{
			var flags = new Array(),
			B = Number(flagint).toString(2); //binary
//			app.u.dump(" -> Binary of flags: "+B);
			B.charAt(0) == 1 ? flags.push('SINGLE_ITEM') : flags.push('MULTI_ITEM'); //1
			B.charAt(1) == 1 ? flags.push('SHIP_EXPEDITED') : flags.push('SHIP_GROUND'); //2
			B.charAt(2) == 1 ? flags.push('CUSTOMER_NEW') : flags.push('CUSTOMER_REPEAT'); //4
			B.charAt(3) == 1 ? flags.push('WAS_SPLIT') : flags.push('NOT_SPLIT'); //8
			B.charAt(4) == 1 ? flags.push('SPLIT_RESULT') : flags.push(''); //16
			B.charAt(5) == 1 ? flags.push('PAYMENT_SINGLE') : flags.push('PAYMENT_MULTIPLE'); //32
			B.charAt(6) == 1 ? flags.push('IS_SUPPLYCHAIN') : flags.push(''); //64
			B.charAt(7) == 1 ? flags.push('IS_MULTIBOX') : flags.push('IS_SINGLEBOX'); //128
			B.charAt(8) == 1 ? flags.push('HAS_RMA') : flags.push('NOT_RMA');  //256
			B.charAt(9) == 1 ? flags.push('HAS_EDIT') : flags.push('NOT_EDIT');  //512
			
			return flags;
			},

/*

Utilities specifically for dealing with payment status and actions.
actions refers to what action can be taken for a payment, based on it's payment status.
payment status is a three number code, the first number of which is the most telling.
see the renderformat paystatus for a quick breakdown of what the first integer represents.
*/

//pref is PaymentReference. It's an object, like what would be returned in @payments per line
			determinePaymentActions : function(pref)	{
//				app.u.dump("BEGIN admin_orders.u.determinePaymentActions");
//				app.u.dump(" -> pref:"); app.u.dump(pref);
				var actions = new Array(); //what is returned. an array of actions.

//				app.u.dump(" -> pref.match: ["+pref.tender.match(/CASH|CHECK|PO|MO/)+"]");
				
				if (Number(pref['voided'])) {
					app.u.dump(" -> transaction VOIDED. no actions.");
					// if a transaction has been voided, nothing else can be done.
					}
				else if (pref['tender'] == 'AMAZON') {
					actions.push('marketplace-refund')
					actions.push('marketplace-void')
					}
				else if (pref['tender'] == 'AMZCBA') {
					actions.push('marketplace-refund')
					actions.push('marketplace-void')
					}
				else if (pref['tender'] == 'BUY') {
					actions.push('marketplace-refund')
					actions.push('marketplace-void')
					}
				else if (pref['tender'] == 'EBAY') {
					actions.push('marketplace-refund')
					actions.push('marketplace-void')
					}
				else if (pref['tender'] == 'SEARS') {
					actions.push('marketplace-refund')
					actions.push('marketplace-void')
					}
				else if (pref['tender'] == 'HSN') {
					actions.push('marketplace-refund')
					actions.push('marketplace-void')
					}
				else if (pref['tender'] == 'GOOGLE') {
					if (pref['ps'] == '199') {	actions.push('capture') }			
					if (pref['ps'] == '011') {
						actions.push('refund') 
						actions.push('void')
						}
					}
				else if (pref['tender'] == 'PAYPALEC') {
					// PAYPALEC is a separate tender type (but short term it's basically a credit card)
					// long term it will have some specialized actions that are unique exclusively to paypal
					if (pref['ps'] == '189') {	actions.push('capture') }
					if (pref['ps'] == '199') {	actions.push('capture') }
					if (pref['ps'] == '259') { actions.push('retry') }
					if (pref['ps'].substring(0,1) == '0' || pref['ps'].substring(0,1) == '4') { 
						actions.push('refund') 
						actions.push('void')
						}
					}
				else if (pref['tender'] == 'CREDIT') {
					if (pref['ps'] == '109') {	actions.push('capture') }	// a special status where we have full CC in ACCT
					else if (pref['ps'] == '199') {	actions.push('capture') }
					else if (pref['ps'] == '499') {	actions.push('capture') }
		
					if (pref['ps'].substring(0,1) == '4' && pref['ps'] != '499') { 
						actions.push('allow-payment')
						}
		
					if (pref['ps'].substring(0,1) == '0' || pref['ps'].substring(0,1) == '4') { 
						actions.push('refund') 
						actions.push('void')
						}
					}
				else if (pref['tender'] == 'GIFTCARD') {
					if (pref['ps'] == '070') {
						actions.push('refund') 
						}
					}
				else if (pref['tender'] == pref.tender.match(/CASH|CHECK|PO|MO/)) {
					app.u.dump(" -> into tender regex else if");
					if (app.ext.admin_orders.u.ispsa(pref['ps'],[3])) {
						// top level payment is a credit, so we can only perform voids.
						actions.push('void') 
						}
					else if (pref['voided']==0) {
						actions.push('refund') 
						actions.push('set-paid') 
						}
					}
				else if (pref['tender'] == 'LAYAWAY') {
					actions.push('layaway')
					actions.push('void')
					}
				else if (pref['tender'] == 'PAYPALEC') {
					if (pref['ps'] == '199') { actions.push('capture') };
					}
				else{
					app.u.dump(" -> no tender conditions met.");
					}
				
				actions.push('override');
				
				if(app.ext.admin_orders.u.ispsa(pref['ps'],[9,2]))	{
					actions.push('void');
					}
				else{}

//				app.u.dump(" -> actions: ");
//				app.u.dump(actions);
				return actions;
				},
//IS Payment Status A...  pass in the ps and an array of ints to check for a match.
//use this function instead of a direct check ONLY when the match/mismatch is going to have an impact on the view.
			ispsa : function(ps,intArr)	{
//				app.u.dump("BEGIN admin_orders.u.ispsa");
//				app.u.dump(" -> ps = "+ps);
				var r = false, //what is returned. t or f
				L = intArr.length;
				for(var i = 0; i < L; i += 1)	{
//					app.u.dump(i+") -> "+intArr[i]);
					if(Number(ps.substring(0)) === intArr[i])	{r = true; break;} //once a match is made, end the loop and return a true.
					else {}
					}
				return r;
				},


			getActionInputs : function(action,pref)	{
				var output = ""; //set to a blank val so += doesn't prepend 'false'.
				if(action && pref)	{
//these are vars so that they can be maintained easily.
					var reasonInput = "<label>Reason/Note: <input size=20 type='textbox' name='note' \/><\/label>";
					var amountInput = "<label>Amount: $<input size='7' type='number' name='amt' value='"+pref.amt+"' \/><\/label>";
					output += "<input type='hidden' name='uuid' value='"+pref.uuid+"' \/>";
					output += "<input type='hidden' name='ACTION' value='"+action+"' \/>";
					switch(action)	{
						case 'allow-payment':
							output += "<div>Allow payment: "+pref.uuid+"<\/div>";
							output += "<div class='hint'>This will flag a review transaction as 'reviewed', if you choose not to accept this payment you will likely need to perform a refund of some sort.</div>";
							output += reasonInput;
							output += "<button>Allow Payment</button>";
							break;
						case 'capture':
							output += "<div>Capture: "+pref.uuid+"<\/div>";
							output += amountInput;
							output += "<button>Capture</button>";
							break;
						case 'layaway':
							output += "<div>Layaway: "+pref.uuid;+"<\/div>";
							output += "Coming soon.";
							break;
						case 'marketplace-refund':
							output += "<div>Marketplace partial refund: "+pref.uuid+"<\/div>";
							output += "<div class='warning'>You will need to adjust the payment manually on the marketplace then update the records here. Zoovy does not have a way to automatically issue refunds on the marketplace.<\/div>";
							output += amountInput;
							output += reasonInput;
							output += "<button>Refund</button>";
							output += "<div class='zhint'>Hint1: Refund is for partial credits, use void to refund an entire payment.<br \/>Hint2: Since this amount is a refund you do not need to use a negative (-) sign.<\/div>";
							break;
						case 'marketplace-void':
							output += "<div>Marketplace void: "+pref.uuid+"<\/div>";
							output += "<div class='warning'>You will need to cancel the order on the marketplace then update the records here. Zoovy does not have a way to automatically update/process cancellations on the marketplace.<\/div>";
							output += reasonInput;
							output += "<button>Void</button>";
							break;
						case 'override':
							output += "Override: "+pref.uuid;
							output += "<div class='warning'>This is an advanced interface intended for experts only.  <b>Do not use without the guidance of technical support.</b><br \/><a target='webdoc' href='http://webdoc.zoovy.com/doc/50456'>WEBDOC #50456: Payment Status Codes</a><\/div>";
							output += "New payment status: <input type='textbox' size='3' onKeyPress='return app.u.numbersOnly(event);' name='ps' value='"+pref.ps+"' \/>";
							output += reasonInput;
							output += "<button>Override</button>";
							break;
						case 'retry':
							output += "<div>Retry: "+pref.uuid+"<\/div>";
							output += "<button>Retry</button>";
							break;
						case 'refund':
							output += "<div>Refund: "+pref.uuid+"<\/div>";
							output += amountInput;
							output += reasonInput;
							output += "<button>Refund</button>";
							break;
						case 'set-paid':
							output += "<div>Set paid: "+pref.uuid+"<\/div>";
							output += amountInput;
							output += reasonInput;
							output += "<button>Set Paid</button>";
							break;
						case 'void':
							output += "<div>Void: "+pref.uuid+"<\/div>";
							output += "<div class='hint'>REMINDER: this will void a payment, void must be done before your settlement time (contact your merchant bank). If you are planning to cancel an order you will probably need to change the workflow status as well.<\/div>";
							output += reasonInput;
							output += "<button>Void</button>";
							break;
	
						default:
							output += 'unknown action';
							break;
						}
					}
				else	{
					output = false;
					app.u.throwGMessage("in admin_orders.u.getActionInputs, no action specified");
					}
				return output;
				},
	







//when an indivdual row needs to be unselected, execute this.
//don't recycle this in the unselect all action, don't want the mouseStop triggered for each row.
// app.ext.admin_orders.u.unSelectRow()
			unSelectRow : function($row){
				$row.removeClass("ui-selected").addClass("ui-unselecting");
				$('#orderListTableBody').data("selectable")._mouseStop(null); // trigger the mouse stop event 
				},

			
//orderid and msgID are required.
			sendOrderMail : function(orderID,msgID,$row)	{
				if(msgID && orderID && $row.length){
					if($row)	{$('td:eq(0)',$row).empty().append("<span class='wait'><\/span>")}
					else	{}// see how this is used outside the list. may want to use this to trigger a showLoading.
					app.ext.admin.calls.adminOrderUpdate.init(orderID,["EMAIL?msg="+msgID],{'callback':'handleSendEmail','extension':'admin_orders','targetID':$row.attr('id')});
					}
				else	{
					app.u.throwGMessage("In admin_orders.u.sendOrderMail, either orderID ["+orderArray.length+"] or msgID["+msgID+"] are not set.");
					}
				},

			bulkSendOrderMail : function(CMD)	{
				var $orders = $('.ui-selected','#orderListTableBody');
				var msgID = CMD.substring(5);
				if(!$orders.length)	{
					app.u.throwMessage("Please select at least 1 order");
					}
//msgID is set and exists.
				else if(msgID && app.ext.admin_orders.vars.emailMessages[msgID])	{
					$orders.each(function(){
						app.ext.admin_orders.u.sendOrderMail($(this).data('orderid'),msgID,$(this));
						});
					app.model.dispatchThis('immutable');
					}
				else	{
					app.u.throwGMessage("In admin_orders.u.bulkSendOrderMail, unable to ascertain msg type. command = "+command+" and msgID = "+msgID);
					}
				},

//currently, this requires that the order_create extension has been added.
//This groups all the invoices into 1 div and adds pagebreaks via css.
//for this reason, the individual print functions for invoice/packslip are not recycled
			bulkOrdersPrint : function(CMD)	{
				var $orders = $('.ui-selected','#orderListTableBody'),
				templateID = undefined, //what template will be used.
				sDomains = {}; //a list of the sdomains. each domain added once. done to optimize dispatches so each sdoamin/profile data only requested once.
				
				if($orders.length)	{
					if(CMD == 'PRNT|INVOICE')	{
						templateID = "invoiceTemplate";
						}
					else if(CMD == 'PRNT|PACKSLIP')	{
						templateID = "packslipTemplate"
						}
					else	{app.u.throwGMessage("In admin_orders.u.bulkOrdersPrint, CMD value is unsupported.")} //unsupported CMD.
					
					if(templateID)	{
						$('#printContainer').empty(); //clean out any previously printed content.
						$('body').showLoading();
						
						app.calls.appProfileInfo.init({'profile':'DEFAULT'},{},'immutable'); //have this handy for any orders with no sdomain.
						
						$orders.each(function(){
							var $order = $(this);
							var sdomain = $order.data('sdomain');
							if(sdomain && sDomains[sdomain])	{} //dispatch already queued.
							else if(sdomain)	{
								sDomains[sdomain] = true; //add to array so that each sdomain is only requested once.
								app.calls.appProfileInfo.init({'sdomain':sdomain},{},'immutable');
								}
							else	{
								sdomain = "DEFAULT"; //use default profile if no sdomain is available.
								}
							app.ext.admin.calls.adminOrderDetail.init($order.data('orderid'),{'callback':'mergeDataForBulkPrint','extension':'admin_orders','templateID':templateID,'merge':'appProfileInfo|'+sdomain},'immutable');
							})
						app.calls.ping.init({'callback':function(responseData){
							$('body').hideLoading();
							if(app.model.responseHasErrors(responseData)){
								app.u.throwMessage(responseData);
								}
							else	{
//							$('#printContainer').show(); //here for troubleshooting.
								app.u.printByElementID('printContainer');
								}
							}},'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{} //error occured. no templateID defined. error message already displayed.
					}
				else	{
					app.u.throwMessage('Please select at least one row.');
					}
				}, //bulkOrdersPrint


//run this to change the pool for a specific order.
//this gets run over each order selected in the bulk function below. (do not add a showLoading or a dispatchThis to this function.
// -> when executing this function, run showloading and dispatch on your own.
			changeOrderPool : function($row,pool,statusColID){
				if($row.length && pool)	{
					$row.attr('data-status','queued');  //data-status is used to record current status of row manipulation (queued, error, complete)
					$('td:eq(0)',$row).empty().append("<span class='wait'><\/span>");
					app.ext.admin.calls.adminOrderUpdate.init($row.attr('data-orderid'),['SETPOOL?pool='+pool],{"callback":"orderPoolChanged","extension":"admin_orders","targetID":$row.attr('id')}); //the request will return a 1.
					}
				else	{app.u.throwGMessage("In admin_orders.u.changeOrderPool, either $row.length ["+$row.length+"] is empty or pool ["+pool+"] is blank")}
				}, //changeOrderPool


//Run the dispatch on your own.  That way a bulkChangeOrderPool can be run at the same time as other requests.
			bulkChangeOrderPool : function(CMD){
				var $selectedRows = $('#orderListTable tr.ui-selected');
				var statusColID = app.ext.admin_orders.u.getTableColIndexByDataName('ORDER_PAYMENT_STATUS');
				
				if($selectedRows.length)	{
					var pool = CMD.substr(5);
					$selectedRows.each(function() {
						app.ext.admin_orders.u.changeOrderPool($(this),pool,statusColID);
						});
					}
				else	{
					app.u.throwMessage('Please select at least one row.');
					}
				}, //bulkChangeOrderPool



			flagOrderAsPaid : function($row,statusColID){
				if($row.length && statusColID)	{
					if($row.find('td:eq('+statusColID+')').text().toLowerCase() != 'pending')	{
						app.u.throwMessage('Order '+$row.attr('data-orderid')+' not set to paid because order is not pending.');
						app.ext.admin_orders.u.unSelectRow($row);
						$row.attr({'data-status':'error'}).find('td:eq(0)').html("<span class='ui-icon ui-icon-notice' title='could not flag as paid because status is not pending'></span>");
						}
					else	{
						$row.attr('data-status','queued');  //data-status is used to record current status of row manipulation (queued, error, complete)
						$('td:eq(0)',$row).empty().append("<span class='wait'><\/span>");

						app.ext.admin.calls.adminOrderUpdate.init($row.attr('data-orderid'),['FLAGASPAID'],{"callback":"orderFlagAsPaid","extension":"admin_orders","targetID":$row.attr('id')}); 
						}
					}
				else	{
					app.u.throwGMessage("$row not passed/has no length OR statusColID not set in admin_orders.u.flagOrderAsPaid.<br \/>Dev: see console for details.");
					app.u.dump("WARNING! admin_orders.u.flagOrderAsPaid statusColID not set ["+statusColID+"] OR $row has no length. $row:"); app.u.dump($row);
					}
				},

			bulkFlagOrdersAsPaid : function()	{
var $selectedRows = $('#orderListTable tr.ui-selected');
//if no rows are selected, let the user know to select some rows.
if($selectedRows.length)	{
	var statusColID = app.ext.admin_orders.u.getTableColIndexByDataName('ORDER_PAYMENT_STATUS');
	$selectedRows.each(function() {
		app.ext.admin_orders.u.flagOrderAsPaid($(this),statusColID);
		});
	}
else	{
	app.u.throwMessage('Please select at least one row.');
	}

				}, //bulkFlagOrdersAsPaid


//used in the order editor. executed whenever a change is made to update the number of changes in the 'save' button.
			updateOrderChangeCount : function($t)	{
				app.u.dump("BEGIN admin_orders.u.updateOrderChangeCount");
				var $dialog = $t.closest("[data-orderid]"); //container dialog.
				if($dialog.length)	{
					app.u.dump(" -> FOUND PARENT!");
					var numEdits = $('.edited',$dialog).length;
					app.u.dump(" -> numEdits: "+numEdits);
					var $count = $('.changeCount',$dialog);
					$count.text(numEdits);
					//enable or disable the save button based on whether or not any changes have been made. count is the span, parent is the button around it.
					if(numEdits > 0)	{$dialog.find("[data-app-event='admin_orders|orderUpdateSave']").prop('disabled',false).addClass('ui-state-highlight')}
					else	{$dialog.find("[data-app-event='admin_orders|orderUpdateSave']").prop('disabled','disabled').removeClass('ui-state-highlight')}
					}
				else	{
					app.u.throwGMessage("In admin_orders.u.updateOrderChangeCount, unable to determine orderID for display logic. Edit and save features 'may' not be impacted.");
					}
				
				return numEdits;
				},

			getTableColIndexByDataName : function(name)	{
//				app.u.dump("BEGIN admin_orders.u.getTableColIndexByDataName");
//				app.u.dump(" -> name = "+name);
				var colIndex = false; //what is returned. the column index.
//SANITY - flexigrid creates a separate table for the header columns.
				$('#orderListTable thead th').each(function(index){
					if($(this).attr('data-name') == name)	{ colIndex = index;} 
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
	var $text = $(this);
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
			app.ext.admin_orders.u.updateOrderChangeCount($(this));
			}
		return value;
		}, {
		  indicator : 'loading...', //can be img tag
		  onblur : 'submit',
		  type : P.inputType,
		  placeholder : '',
		  style  : 'inherit'
		  }); //editable
	}); //each

//handles tabbing between jeditable elements. only tabs between jeditables within selector.
    $(selector + ' .editable').off('keydown.jeditable').on('keydown.jeditable', function(evt) {
        if(evt.keyCode==9) {
			var nextBox=$(selector + ' .editable').eq($(selector + ' .editable').index(this)+1);
			$(this).find("input").trigger('blur');  //Go to assigned next box
			$(nextBox).click();  //Go to assigned next box
			return false;           //Suppress normal tab
			}
		});



				}
			}, //u
//e is 'Events'. these are assigned to buttons/links via appEvents.
		e : {
			"orderListFiltersUpdate" : function($btn){
//				$btn.addClass('ui-state-highlight');
				$btn.button();
				$btn.off('click.orderListFiltersUpdate').on('click.orderListFiltersUpdate',function(event){
					event.preventDefault();
					$('#orderListTableBody').empty(); //this is targeting the table body.
					$('.noOrdersMessage','#orderListTableContainer').empty().remove(); //get rid of any existing no orders messages.
					var obj = {}
					obj.LIMIT = Number($('#filterLimit').val()) || 30;
					$("[data-ui-role='admin_orders|orderListFiltersUpdate'] ul").each(function(){
						var val = $(this).find('.ui-selected').attr('data-filtervalue');
						if(val){
							obj[$(this).attr('data-filter')]=val
							}
						});
					if($.isEmptyObject(obj))	{
						app.u.throwMessage('Please select at least one filter criteria');
						}
					else	{
						app.ext.admin.u.devicePreferencesSet('admin_orders',{'managerFilters':obj});
		//				app.u.dump("Filter Obj: "); app.u.dump(obj);
						app.model.destroy('adminOrderList'); //clear local storage to ensure request
						app.ext.admin_orders.a.showOrderList(obj);
						}
					});
				}, //applyOrderFilters
				

			"orderCreate" : function($btn)	{
				$btn.button();
				$btn.off('click.orderCreate').on('click.orderCreate',function(){navigateTo('#!orderCreate')});
				}, //orderCreate


			"orderCustomerEdit" : function($btn)	{
				$btn.button();
				$btn.off('click.orderCreate').on('click.orderCreate',function(){
					var $parent = $btn.closest("[data-order-view-parent]"),
					orderID = $parent.data('order-view-parent');
					if(orderID)	{
						navigateTo('/biz/utilities/customer/index.cgi?VERB=EDIT&CID='+app.data['adminOrderDetail|'+orderID].customer.cid,{'dialog':true});
						}
					else	{
						app.u.throwGMessage("in admin_orders.buttonActions.orderCustomerEdit, unable to determine orderID ["+orderID+"]");
						}
					});
				},
				

			"orderItemUpdate" : function($btn)	{
				$btn.button();
				$btn.button({icons: {primary: "ui-icon-arrowrefresh-1-e"},text: false});
				$btn.off('click.orderItemUpdate').on('click.orderItemUpdate',function(){
					var $parent = $btn.closest("[data-order-view-parent]"),
					orderID = $parent.data('order-view-parent'),
					$row = $btn.closest('tr'),
					uuid = $row.data('uuid'),
					qty = $("[name='qty']",$row).val(),
					price = $("[name='price']",$row).val();
					
					if(uuid && orderID && qty && price)	{
						app.ext.admin.calls.adminOrderUpdate.init(orderID,["ITEMUPDATE?uuid="+uuid+"qty="+qty+"&price="+price]);
						$parent.empty();
						app.ext.admin_orders.a.showOrderView(orderID,app.data['adminOrderDetail|'+orderID].customer.cid,$parent.attr('id'),'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{
						app.u.throwGMessage("in admin_orders.buttonActions.orderItemUpdate, unable to determine orderID ["+orderID+"], uuid ["+uuid+"], price ["+price+"], OR qty ["+qty+"]");
						}
					});
				}, //orderCreate

			"orderItemRemove" : function($btn)	{
				$btn.button();
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.orderItemRemove').on('click.orderItemRemove',function(){
					var $parent = $btn.closest("[data-order-view-parent]"),
					orderID = $parent.data('order-view-parent'),
					$row = $(this).closest('tr'),
					stid = $row.data('stid');
					if(stid && orderID)	{
						app.ext.admin.calls.adminOrderUpdate.init(orderID,["ITEMREMOVE?stid="+stid]);
						$parent.empty();
						app.ext.admin_orders.a.showOrderView(orderID,app.data['adminOrderDetail|'+orderID].customer.cid,$parent.attr('id'),'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{
						app.u.throwGMessage("in admin_orders.buttonActions.orderItemRemove, unable to determine orderID ["+orderID+"] or pid ["+json.pid+"]");
						}
					});
				},

			"orderItemAddStructured" : function($btn)	{
				$btn.button();
				$btn.off('click.orderItemAddStructured').on('click.orderItemAddStructured',function(){
					var $button = $("<button>").text("Add to Order").button().on('click',function(){
						
						var $parent = $btn.closest("[data-order-view-parent]"),
						orderID = $parent.data('order-view-parent'),
						$form = $('form','#chooserResultContainer');
						var formJSON = $form.serializeJSON();
						var orderID = $btn.data('orderid') || $btn.closest('[data-orderid]').data('orderid');
						
						if(formJSON.sku && orderID)	{
						
						for(index in formJSON)	{
//if the key is two characters long and uppercase, it's likely an option group.
//if the value is more than two characters and not all uppercase, it's likely a text based sog. add a tildae to the front of the value.
//this is used on the API side to help distinguish what key value pairs are options.
							if(index.length == 2 && index.toUpperCase() == index && formJSON[index].length > 2 && formJSON[index].toUpperCase != formJSON[index])	{
								formJSON[index] = "~"+formJSON[index];
								}
							}
						app.ext.admin.calls.adminOrderUpdate.init(orderID,["ITEMADDSTRUCTURED?"+decodeURIComponent($.param(formJSON))]);
						$parent.empty();
						app.ext.admin_orders.a.showOrderView(orderID,app.data['adminOrderDetail|'+orderID].customer.cid,$parent.attr('id'),'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{
						app.u.throwGMessage("in admin_orders.buttonActions.orderItemAddStructured, unable to determine orderID ["+orderID+"] or pid ["+formJSON.sku+"]");
						}
					});
				app.ext.admin.a.showFinderInModal('CHOOSER','','',{'$buttons' : $button})
				});
			},



			"orderItemAddBasic" : function($btn)	{
				$btn.button();
				$btn.off('click.orderItemAddBasic').on('click.orderItemAddBasic',function(){
					app.u.dump("BEGIN admin_orders.buttonActions.orderItemAddBasic.click");
					var orderID = $btn.data('orderid') || $btn.closest('[data-orderid]').data('orderid'),
					$parent = $btn.closest("[data-order-view-parent]"),
					$form = $("<form>").append("<label><span>sku:</span><input type='text' name='stid' value='' required='required' /></label><label><span>name:</span><input type='text' name='title' value='' required='required'  /></label><label><span>qty:</span><input type='number' size='3' name='qty' value='1' required='required'  /></label><label><span>price:</span><input type='number' size='7' name='price' value='' required='required'  /></label>"),
					$modal = $("<div \/>").addClass('labelsAsBreaks orderItemAddBasic').attr('title','Add item to order').append($form),
					$button = $("<button \/>").addClass('alignCenter').text("Add to Order").button();
					$form.append($button);
					$form.on('submit',function(event){
						event.preventDefault();
						if(orderID)	{
							app.ext.admin.calls.adminOrderUpdate.init(orderID,["ITEMADDBASIC?"+$(this).serialize()],{},'immutable');
							$modal.dialog('close');
							$parent.empty();
							app.ext.admin_orders.a.showOrderView(orderID,app.data['adminOrderDetail|'+orderID].customer.cid,$parent.attr('id'),'immutable');
							app.model.dispatchThis('immutable');
							}
						else	{
							app.u.throwGMessage("In admin_orders.buttonActions.orderItemAddBasic, unable to determine order id.");
							}
						})
					$modal.dialog({'modal':true,'width':500});

					});
				},


			"orderUpdateCancel" : function($btn)	{
				$btn.button();
				$btn.off('click.orderUpdateCancel').on('click.orderUpdateCancel',function(){
//in a dialog.
					if($btn.closest('.ui-dialog-content').length)	{
						$btn.closest('.ui-dialog-content').dialog('close');
						}
					else	{
						navigateTo("#!orders");
						}
					}); //the dialog-contentis the div the modal is executed on.
				}, //orderUpdateCancel
				
			"orderListUpdateDeselectAll" : function($btn)	{
				$btn.button();
				$btn.off('click.orderUpdateCancel').on('click.orderUpdateCancel',function(event){
					event.preventDefault();
//if an item is being updated, this will still 'select' it, but will not change the wait icon.
					$('#orderListTableBody tr').each(function() {
						$(this).removeClass("ui-selected").addClass("ui-unselecting");
						});
					$('#orderListTableBody').data("selectable")._mouseStop(null); // trigger the mouse stop event 
					});
				}, //orderListUpdateDeselectAll


			"orderPrintInvoice" : function($btn){
				$btn.button();
				$btn.off('click.orderPrintInvoice').on('click.orderPrintInvoice',function(event){
					event.preventDefault();
					var orderID = $btn.data('orderid') || $btn.closest('[data-orderid]').data('orderid');
					if(orderID)	{
						app.ext.convertSessionToOrder.a.printOrder(orderID,{data:{'type':'invoice','profile':app.data['adminOrderDetail|'+orderID].our.profile}});
						}
					else	{
						app.u.throwGMessage("In admin_orders.buttonActions.orderPrintInvoice, unable to print because order id could not be determined.");
						}
					});
				}, //orderPrintInvoice

			"orderPrintPackSlip" : function($btn){
				$btn.button();
				$btn.off('click.orderPrintPackSlip').on('click.orderPrintPackSlip',function(event){
					event.preventDefault();
					var orderID = $btn.data('orderid') || $btn.closest('[data-orderid]').data('orderid');
					if(orderID)	{
						app.ext.convertSessionToOrder.a.printOrder(orderID,{data:{'type':'invoice','profile':app.data['adminOrderDetail|'+orderID].our.profile}});
						}
					else	{
						app.u.throwGMessage("In admin_orders.buttonActions.orderPrintPackSlip, unable to print because order id could not be determined.");
						}
					});
				}, //orderPrintPackSlip

			"orderEmailSend" : function($btn){
				$btn.button();
//simply trigger the dropdown on the next button in the set.
				$btn.off('click.orderEmailSend').on('click.orderEmailSend',function(event){
					app.u.dump(" -> orderEmailSend clicked.");
					event.preventDefault();
					$btn.parent().find("[data-app-event='orderEmailShowMessageList']").click();
					});


				}, //saveCustomerNotes **TODO

//
			"orderEmailShowMessageList" : function($btn){
				
				$btn.button({text: false,icons: {primary: "ui-icon-triangle-1-s"}})

				var orderID = $btn.data('orderid') || $btn.closest('[data-orderid]').data('orderid');
				var menu = $btn.parent().next('ul').menu().hide();
				menu.css({'position':'absolute','width':'200px','z-index':'10000'}).parent().css('position','relative');
				
				menu.find('li a').each(function(){
					$(this).on('click',function(event){
						event.preventDefault();
						$('body').showLoading();
						app.ext.admin.calls.adminOrderUpdate.init(orderID,["EMAIL?msg="+$(this).attr('href').substring(1)],{'callback':'handleSendEmailFromEdit','extension':'admin_orders'});
						app.model.dispatchThis('immutable');
						});
					});

//simply trigger the dropdown on the next button in the set.
				$btn.off('click.orderEmailShowMessageList').on('click.orderEmailShowMessageList',function(event){
					app.u.dump(" -> orderEmailShowMessageList clicked.");
					$btn.button();
					event.preventDefault();
                    menu.show().position({
                        my: "right top",
                        at: "right bottom",
                        of: this
	                    });
//when this wasn't in a timeout, the 'click' on the button triggered. this. i know. wtf?  find a better solution. !!!
					setTimeout(function(){$(document).one( "click", function() {menu.hide();});},1000);
					});

				$btn.parent().buttonset();

				}, //saveCustomerNotes **TODO

			"orderTicketCreate" : function($btn)	{
				$btn.button();
				$btn.off('click.customerUpdateNotes').on('click.customerUpdateNotes',function(event){
					event.preventDefault();
					var orderID = $btn.data('orderid') || $btn.closest('[data-orderid]').data('orderid');
					if(orderID)	{
						navigateTo("/biz/crm/index.cgi?ACTION=CREATE&orderid="+orderID);
						$btn.closest('.ui-dialog-content').dialog('close'); //close the modal, if in a modal.
						}
					else	{
						app.u.throwGMessage("In admin_orders.buttonActions.orderTicketCreate, unable to navigate to because order id could not be determined.");
						}
					});
				},

			"orderListUpdateSelectAll" : function($btn)	{
				$btn.button();
				$btn.off('click.orderListUpdateSelectAll').on('click.orderListUpdateSelectAll',function(event){
					event.preventDefault();
//if an item is being updated, this will still 'select' it, but will not change the wait icon.
					$('#orderListTableBody tr').each(function() {
						$(this).addClass("ui-selected").removeClass("ui-unselecting");
						});
					$('#orderListTableBody').data("selectable")._mouseStop(null); // trigger the mouse stop event 
					});
				}, //orderListUpdateSelectAll

			"orderSearch" : function($btn)	{
				$btn.button();
				$btn.off('click.orderSearch').on('click.orderSearch',function(event){
					event.preventDefault();
					var frmObj = $btn.closest('form').serializeJSON(),
					query;
					if(frmObj.keyword)	{
//						app.ext.admin.calls.adminPrivateSearch.init({'size':20,'type':['order',frmObj.type],'query':{'query_string':{'query':frmObj.keyword}}},{'callback':'listOrders','extension':'admin_orders'},'immutable');
						$('#orderListTableBody').empty();
						$('.noOrdersMessage','#orderListTableContainer').empty().remove(); //get rid of any existing no orders messages.
						$('body').showLoading();
if(frmObj.isDetailedSearch == 'on')	{
	query = {'size':Number(frmObj.size) || 30,'filter' : {
	'or' : [
	{'has_child' : {'query' : {'query_string' : {'query' : frmObj.keyword,'default_operator':'AND'}},'type' : ['order/address']}},
	{'has_child' : {'query' : {'query_string' : {'query' : frmObj.keyword,'default_operator':'AND'}},'type' : ['order/payment']}},
	{'has_child' : {'query' : {'query_string' : {'query' : frmObj.keyword,'default_operator':'AND'}},'type' : ['order/shipment']}},
	{'has_child' : {'query' : {'query_string' : {'query' : frmObj.keyword,'default_operator':'AND'}},'type' : ['order/item']}},
	{'query' : {'query_string' : {'query' : frmObj.keyword,'default_operator':'AND'}}}
	]},'type' : ['order'],'explain' : 1}
	}
else	{
	query = { 'filter' : {
      'or' : [
         { 'term': { 'references': frmObj.keyword  } },
         { 'term' : { 'email': frmObj.keyword } },
         { 'term' : { 'orderid': frmObj.keyword } }
         ]
      }}
	}

app.ext.admin.calls.adminOrderSearch.init(query,{'callback':'listOrders','extension':'admin_orders','templateID':'adminOrderLineItem'},'immutable');

						app.model.dispatchThis('immutable');
						}
					else	{
						app.u.throwGMessage("in admin_orders.buttonActions.orderSearch, keyword ["+frmObj.keyword+"] not specified.");
						}

					});
				}, //orderListUpdateSelectAll


			"orderSummarySave" : function($btn)	{
				$btn.button();
				$btn.off('click.orderSummarySave').on('click.orderSummarySave',function(event){
					event.preventDefault();
					var frmObj = $btn.closest('form').serializeJSON();
					if(frmObj['sum/shp_method'] && frmObj['sum/shp_total'])	{
						var $parent = $btn.closest("[data-order-view-parent]"),
						orderID = $parent.data('order-view-parent');
						app.ext.admin.calls.adminOrderUpdate.init(orderID,["SETSHIPPING?sum/shp_total="+frmObj['sum/shp_total']+"&sum/shp_carrier=SLOW&sum/shp_method="+frmObj['sum/shp_method']],{});
						$parent.empty();
						app.ext.admin_orders.a.showOrderView(orderID,app.data['adminOrderDetail|'+orderID].customer.cid,$parent.attr('id'),'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{app.u.throwGMessage("It appears that either ship method ["+frmObj['sum/shp_method']+"] or ship total ["+frmObj['sum/shp_total']+"]  was left blank.");}
					});
				},


			"orderUpdateSave" : function($btn){
				$btn.button();
				$btn.off('click.orderUpdateSave').on('click.orderUpdateSave',function(event){
					event.preventDefault();

					var $target = $btn.closest("[data-order-view-parent]"),
					orderID = $target.data('order-view-parent');
						
					if(orderID)	{

//the changes are all maintained on one array and pushed onto 1 request (not 1 pipe, but one adminOrderUpdate _cmd).
						var changeArray = new Array();

//poolSelect is the dropdown for changing the pool.
						var $poolSelect = $("[data-ui-role='orderUpdatePool']",$target);
//						app.u.dump(" -> $poolSelect.length = "+$poolSelect.length);
						if($poolSelect.hasClass('edited'))	{
							changeArray.push('SETPOOL?pool='+$poolSelect.val());
							}
						delete $poolSelect; //not used anymore.



						handleNote = function(type){
							var $note = $("[data-ui-role='admin_orders|"+type+"']",$target);
							if($note.hasClass('edited'))	{changeArray.push(type+'?note='+$note.text());}
							else	{} //do nothing. note was not edited.
							}
						handleNote('SETPRIVATENOTE');
						handleNote('SETPUBLICNOTE');
						handleNote('ADDCUSTOMERNOTE');


//for address uses teh setSHIPADDR and/or SETSHIPADDR
						var $address = $("[data-ui-role='admin_orders|orderUpdateShipAddress']",$target);
						var kvp = ""; //URI formatted string of address key (address1) value (123 evergreen terrace) pairs.

						
						
						if($('.edited',$address).length)	{
							$('[data-bind]',$address).each(function(){
								var bindData = app.renderFunctions.parseDataBind($(this).data('bind'));
								var attribute = app.renderFunctions.parseDataVar(bindData['var']);
								kvp += "&"+attribute+"="+$(this).text();
								});
							changeArray.push('SETSHIPADDR?'+kvp);
							}
						$address,kvp = ""; //reset address.
//no var declaration because the ship address var is recycled.
						$address = $("[data-ui-role='admin_orders|orderUpdateBillAddress']",$target);

						app.u.dump(" -> $address.length: "+$address.length);
						app.u.dump(" -> $('.edited',$address).length: "+$('.edited',$address).length);

						if($('.edited',$address).length)	{
							$('[data-bind]',$address).each(function(){
								var bindData = app.renderFunctions.parseDataBind($(this).data('bind'));
								var attribute = app.renderFunctions.parseDataVar(bindData['var']);
								kvp += "&"+attribute+"="+$(this).text();
								});
							if(kvp.charAt(0) == '&')	{kvp.substring(0);} //strip starting ampersand.
							changeArray.push('SETBILLADDR?'+kvp);
							}
						delete $address;   //not used anymore.

						app.ext.admin.calls.adminOrderUpdate.init(orderID,changeArray,{},'immutable');
						$target.empty();
						app.ext.admin_orders.a.showOrderView(orderID,app.data['adminOrderDetail|'+orderID].customer.cid,$target.attr('id'),'immutable'); //adds a showloading
						app.model.dispatchThis('immutable');
						}
					else	{
						app.u.throwGMessage("In admin_orders.buttonActions.orderUpdateSave, unable to determine order id.");
						}
					});
				}, //orderUpdateSave

			"orderUpdateAddPayment" : function($btn){
				$btn.button();
				$btn.off('click.orderUpdateAddPayment').on('click.orderUpdateAddPayment',function(event){
					event.preventDefault();
					var formJSON = $btn.parents('form').serializeJSON();
					formJSON.tender = formJSON['want/payby']; //in a future version, want/payby will be renamed tender in the form. can't because this version 201248 is shared with 1PC. !!!.
					delete formJSON['want/payby'];
					
//					app.u.dump(" -> formJSON.tender: "+formJSON.tender);
//					app.u.dump(" -> typeof validate[tender]: "+typeof app.ext.store_checkout.validate[formJSON.tender]);
					
					if(formJSON.tender)	{
						var $paymentContainer = $btn.closest("[data-ui-role='orderUpdatePaymentMethodsContainer']"),
						CMD, //the command for the cart update macro. set later.
						errors = (typeof app.ext.store_checkout.validate[formJSON.tender] === 'function') ? app.ext.store_checkout.validate[formJSON.tender](formJSON) : false; //if a validation function exists for this payment type, such as credit or echeck, then check for errors. otherwise, errors is false.

						
						$paymentContainer.find('.mandatory').removeClass('mandatory'); //remove css from previously failed inputs to avoid confusion.
						

//the mandatory class gets added to the parent of the input, so that the input, label and more get styled.
						if(!formJSON.amt)	{
							var msgObj = app.u.errMsgObject("Please set an amount");
							msgObj.parentID = 'adminOrdersPaymentMethodsContainer';
							app.u.throwMessage(msgObj);
							$("[name='amt']",$paymentContainer).parent().addClass('mandatory');
							}
						else if(errors)	{
							var msgObj = app.u.errMsgObject("Some required field (indicated in red) are missing or invalid.");
							msgObj.parentID = 'adminOrdersPaymentMethodsContainer';
							app.u.throwMessage(msgObj);
							for(index in errors)	{
								$("[name='"+errors[index]+"']",$paymentContainer).parent().addClass('mandatory');
								}
							}
						else	{
							if(formJSON.tender == 'CREDIT')	{
								CMD = "ADDPROCESSPAYMENT";
								}
							else	{CMD = "ADDPAYMENT"}
							var $parent = $btn.closest("[data-order-view-parent]"),
							orderID = $parent.data('order-view-parent');

							app.ext.admin.calls.adminOrderUpdate.init(orderID,[CMD+"?"+decodeURIComponent($.param(formJSON))],{});
							$parent.empty();
							app.ext.admin_orders.a.showOrderView(orderID,app.data['adminOrderDetail|'+orderID].customer.cid,$parent.attr('id'),'immutable');
							app.model.dispatchThis('immutable');
							}
						
						}
					else	{
						var msgObj = app.u.errMsgObject("Please choose a payment method.");
						msgObj.parentID = 'adminOrdersPaymentMethodsContainer';
						app.u.throwMessage(msgObj);
						}					
					

					app.model.dispatchThis('immutable');
					});
				}, //orderUpdateAddPayment 


			"orderUpdateAddTracking" : function($btn){
				$btn.button();
				$btn.off('click.orderUpdateAddTracking').on('click.orderUpdateAddTracking',function(event){
					event.preventDefault();

					var $parent = $btn.closest("[data-ui-role='orderUpdateAddTrackingContainer']");
					$parent.showLoading(); //run just on payment panel
					var kvp = $btn.parents('form').serialize();
					//The two lines below 'should' work. not tested yet.
					app.ext.admin.calls.adminOrderUpdate.init($btn.data('orderid'),["ADDTRACKING?"+kvp],{},'immutable');
					app.ext.admin.calls.adminOrderDetail.init($btn.data('orderid'),{'callback':'translateSelector','extension':'admin_orders','selector':'#'+$parent.attr('id')},'immutable');
					app.model.dispatchThis('immutable');
					});
				}, //orderUpdateAddTracking


			"orderUpdateShowEditor" : function($btn){
				$btn.button();
//				if(app.u.getParameterByName('debug'))	{
					$btn.off('click.orderUpdateShowEditor').on('click.orderUpdateShowEditor',function(event){
						event.preventDefault();
//						app.u.dump("show order editor");
						var orderID = $(this).attr('data-orderid');
						var CID = $(this).closest('tr').attr('data-cid'); //not strictly required, but helpful.
						if(orderID)	{
							$(app.u.jqSelector('#',"orders2Content")).empty();
							app.ext.admin_orders.a.showOrderView(orderID,CID,"orders2Content"); //adds a showLoading
							app.model.dispatchThis();
							}
						else	{
							app.u.throwGMessage("In admin_orders.buttonActions.orderUpdateShowEditor, unable to determine order id.");
							}
						})
//					}
//				else	{
//					$btn.off('click.orderUpdateShowEditor').on('click.orderUpdateShowEditor',function(){navigateTo('/biz/orders/view.cgi?OID='+$(this).data('orderid'));});
//					}
				} //orderUpdateShowEditor

			} //buttonActions
		
		} //r object.
	return r;
	}