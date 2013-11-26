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
	var theseTemplates = new Array('orderManagerTemplate','adminOrdersOrderLineItem','orderDetailsTemplate','orderStuffItemTemplate','orderPaymentHistoryTemplate','orderEventHistoryTemplate','orderTrackingHistoryTemplate','orderAddressTemplate','buyerNotesTemplate','orderStuffItemEditorTemplate','orderTrackingTemplate','qvOrderNotes','orderEventsHistoryContainerTemplate','orderTrackingHistoryContainerTemplate','orderEmailCustomMessageTemplate');
	var r = {

////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		
	vars : {
		"pools" : ['RECENT','PENDING','PREORDER','BACKORDER','REVIEW','HOLD','APPROVED','PROCESS','COMPLETED','CANCELLED'],
		"payStatus" : ['Paid','Pending','Denied','Cancelled','Review','Processing','Voided','Error','unknown'], //the order here is VERY important. matches the first char in paystatus code.
		"emailMessages" : {
			'ORDER.CONFIRM':'Order created',
			'ORDER.CUSTOM_MESSAGE1' : 'Order custom 1',
			'ORDER.CONFIRM_DENIED' : 'Order confirmation w/payment denied',
			'ORDER.ARRIVED.AMZ' : 'Order arrived: Amazon follow up',
			'ORDER.ARRIVED.BUY' : 'Order arrived: Buy.com follow up',
			'ORDER.ARRIVED.EBF' : 'Order arrived: eBay follow up',
			'ORDER.ARRIVED.WEB' : 'Order arrived: website follow up',
			'ORDER.FEEDBACK.AMZ' : 'Amazon Feedback request',
			'ORDER.FEEDBACK.EBAY' : 'eBay Feedback request',
			'ORDER.NOTE' : 'Order %ORDERID%',
			'ORDER.SHIPPED' : 'Order %ORDERID% shipped',
			'ORDER.SHIPPED.EBAY' : 'Your eBay order has been shipped.',
			'ORDER.SHIPPED.AMZ' : 'Your Amazon order has been shipped.',
			'ORDER.MERGED' : 'Your order has been merged',
			'ORDER.SPLIT' : 'Changes to your order',
			'ORDER.PAYMENT_REMINDER' : 'Payment reminder',
			'ORDER.MOVE.APPROVED' : 'Order %ORDERID% approved',
			'ORDER.MOVE.RECENT' : 'Order %ORDERID% backordered',
			'ORDER.MOVE.COMPELTED' : 'Order %ORDERID% completed',
			'ORDER.MOVE.CANCEL' : 'Order %ORDERID% cancelled',
			'ORDER.MOVE.PENDING' : 'Order %ORDERID% pending',
			'ORDER.MOVE.PREORDER' : 'Order %ORDERID% preordered',
			'ORDER.MOVE.PROCESSING' : 'Order %ORDERID% processing',
			'ORDER.MOVE.RECENT' : 'Order %ORDERID% moved to recent',
			'CUSTOMMESSAGE' : 'Custom/Edit message' //if this changes, change class here in orders css: .orderManagerTable .bulkEditMenu .emailmsg_custommessage
			},
		"markets" : {
			'ebay' : 'eBay',
			'amazon' : 'Amazon'
			}
		},


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
				
				app.ext.admin_orders.u.handleOrderListTab('init');

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}, //init


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
$('#ordersInterfaceMainColumn','#ordersContent').hideLoading().removeData('activeRequestUUID');

//ucomment this in button instead of auto-submit mode. button class changed once filter changes occur (but before button is pressed). this resets button.
//$("[data-app-event='admin_orders|orderListFiltersUpdateButton']",$(".searchAndFilterContainer")).removeClass('ui-state-highlight');
//app.ext.admin_orders.u.handleFilterCheckmarks($(".searchAndFilterContainer"));

var ordersData = app.data[tagObj.datapointer]['@orders'];

var L = ordersData.length;
var $cmenu; //recyled. stors the context menu for an order.

//the more frequently the DOM is updated, the slower the interface. so all the rows are saved into this jqObj and then the children are passed into $target.

var $tbody = $("<tbody \/>"); //used to store all the rows so the dom only gets updated once.


if(L)	{
	app.u.dump(" -> ordersData.length (L): "+L);
	for(var i = 0; i < L; i += 1)	{
		var orderid = ordersData[i].ORDERID; //used for fetching order record.
		var cid = ordersData[i].CUSTOMER; //used for sending adminCustomerDetail call.
		var $row = app.renderFunctions.transmogrify({"id":"order_"+orderid,"cid":cid,"orderid":orderid,"sdomain":ordersData[i].SDOMAIN,"prt":ordersData[i].PRT},tagObj.templateID,ordersData[i]);
//		app.ext.admin.u.handleAppEvents($row);
		app.u.handleButtons($row);
		$tbody.append($row);
		}
// didn't use a replace because I didn't want to lose the properties already on target maintain them in two locations.
	$target.append($tbody.children());

var statusColID = app.ext.admin_orders.u.getTableColIndexByDataName('ORDER_PAYMENT_STATUS'); //index of payment status column. used in flagOrderAsPaid. here so lookup only occurs once.

function pools2Object()	{
	var r = {};
	var pools = app.ext.admin_orders.vars.pools;
	var L = pools.length;
	for(var i = 0; i < L; i += 1)	{
		r["order_pool_change|"+pools[i]] = {"name": pools[i]};
		}
	return r;
	}

function messages2Object()	{
	var r = {};
	for(var key in app.ext.admin_orders.vars.emailMessages)	{
		r["customer_email|"+key] = {'name' : app.ext.admin_orders.vars.emailMessages[key]}
		}
	return r;
	}

// * 201338 -> updated contextual menu library and the code here. MUCH more efficient method. page loaded faster after this enhancement.
$.contextMenu({
	'selector' : '.adminOrderLineItem',
	'callback' : function(key,options)	{
		//executed when a menu option is clicked.
//		app.u.dump(" -> contextMenu key: "+key);
//		app.u.dump(" -> ID: "+$(this).attr('id'));
		app.ext.admin_orders.u.handleOrderListCMenu(key,$(this),{'statusColID':statusColID});
		},
	'events' : {
		'hide' : function()	{
			$(this).removeClass('ui-state-highlight');
			},
		'show' : function(){
			$(this).addClass('ui-state-highlight');
			}
		},
	'items' : {
		"customer_edit": {name: "Edit Customer"},
		"ticket_create": {name: "Create CRM Ticket"},
		"customer_email": {
			"name": "Email Customer", 
			"items": messages2Object()
            },
		"sep1": "---------",
		"order_flagaspaid": {name: "Flag as Paid"},
		"order_pool_change": {name: "Change Pool",
			"items": pools2Object()
			}
		}
	});

	}
else	{
	$('#orderListTableContainer').append("<div class='noOrdersMessage'>There are no orders that match the current filter criteria.<\/div>");
	//if this was a keyword search and the keyword was an order ID, show this extra messaging to allow the user to attempt to load the order directly. 
	//good for if elastic is having emotional issues.

	var regex = /^20\d\d-[01]\d-[\d]+$/;
	if(tagObj.keyword && regex.test(tagObj.keyword))	{
		app.u.dump("The search was for an order ID.");
		$('#orderListTableContainer').append($("<div \/>").addClass('lookLikeLink').on('click',function(){
			$('#ordersContent').empty();
			app.ext.admin_orders.a.showOrderView(tagObj.keyword,'','ordersContent'); //adds a showLoading
			app.model.dispatchThis();
			}).append("<b>Click here</b> to load order "+tagObj.keyword));
		}
	}



				}
			} //listOrders
		}, //callbacks




////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	a : {

		
		initOrderManager : function(P)	{
			P = P || {};
			app.u.dump("BEGIN admin_orders.a.initOrderManager. targetID:"+P.targetID);
//			app.u.dump(P);
			app.ext.admin_orders.u.handleOrderListTab('deactivate');
			var oldFilters = app.model.dpsGet('admin_orders');
			if(P.filters){app.u.dump(" -> filters were passed in");} //used filters that are passed in.
			else if(oldFilters != undefined)	{
//				app.u.dump(" -> use old filters.");
				P.filters = oldFilters.managerFilters || {};
				}
			else{P.filters = {}; app.u.dump(" -> no filters at all. will use a default.");}

//			app.u.dump(" -> oldFilters: "); app.u.dump(oldFilters);

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
// SANITY: the template is now on the DOM in target. you can now safely affect it.

				$("[data-app-role='admin_orders|orderUpdateBulkEditMenu']",$target).menu().hide();
				$("[data-app-role='admin_orders|itemUpdateBulkEditMenu']",$target).menu().hide();

				//Adds the click events to the order bulk update dropdown menu. The render format that generates the list is shared, so the events are added separately.
				$("[data-app-role='bulkEmailMessagesList']",$target).find('a').each(function(){
					$(this).attr('data-app-click','admin_orders|bulkImpactOrderItemListExec');
					})


//note - attempted to add a doubleclick event but selectable and dblclick don't play well. the 'distance' option wasn't a good solution
//because it requires a slight drag before the 'select' is triggered.
	$("table[data-app-role='orderListTable']:first, table[data-app-role='itemListTable']:first",$target).selectable({
		filter: 'tr',
		stop: function(){
			app.u.dump(" -> selectable 'stop' has been triggered");
			// in this context, 'this' is the table selectable was applied to.
			var $table = $(this);
			$( "tr", $table ).each(function() {
				var $row = $(this);
//handle the icon.
				if($row.data('status') == 'queued')	{} //do nothing here. leave the wait icon alone.
				else if($row.hasClass('ui-selected'))	{
					$('td:eq(0)',$row).html("<span class='ui-icon ui-icon-circle-check'></span>"); //change icon in col 1
					if($('#ordersInterfaceMainColumn','#ordersContent').data('mode') == 'order')	{
//make orderid clickable in col 2. Has to use mousedown because selectable adds a helper div under the mouse that causes the link click to not trigger.
						$('td:eq(1) span',$row).addClass('lookLikeLink').off('mousedown.orderLink').on('mousedown.orderLink',function(){ 
							$(this).closest('tr').find("[data-app-click='admin_orders|orderUpdateShowEditor']").trigger('click');
							})
						}
					}
				else	{
					$('td:eq(0)',$row).html(""); //empty status icon container.
					$('td:eq(1) span',$row).removeClass('lookLikeLink').off('mousedown.orderLink'); //remove clickable link
					}
				
				});
			if($(".ui-selected",$(this)).length > 0)	{
				if($table.data('app-role') == 'itemListTable')	{
					$("[data-app-role='admin_orders|itemUpdateBulkEditMenu']",$target).show().effect("highlight", {},1000);
					}
				else	{
					$("[data-app-role='admin_orders|orderUpdateBulkEditMenu']",$target).show().effect("highlight", {},1000);
					}
				}
			else	{
				$("[data-app-role='admin_orders|orderUpdateBulkEditMenu']",$target).hide();
				$("[data-app-role='admin_orders|itemUpdateBulkEditMenu']",$target).hide();
				}
			}
		});

	$("table[data-app-role='orderListTable']:first",$target).anytable(); //make table headers sortable.
	$("table[data-app-role='itemListTable']:first",$target).anytable(); //make table headers sortable.
				

				if(P.filters.LIMIT)	{$('#filterLimit').val(P.filters.LIMIT)} //set default val for limit.

//check to see which index in accordian was open last.
				var settings = app.model.dpsGet('admin_orders','accordion') || {};
				settings.active = settings.active || 0; //default to search.
				$(".searchAndFilterContainer",$target).accordion({
					heightStyle: "content",
					collapsible: true,
					active : settings.active,
					change : function(e,ui)	{
						app.model.dpsSet('admin_orders','accordion',{'active':$(this).accordion('option', 'active')}); //update settings with active accordion index.
						}
					});
				
//				$(".searchAndFilterContainer",$target).accordion( "option", "active", 2 );
				
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
//in button instead of auto-submit, uncomment this. it'll make the button change color
//						$("[data-app-event='admin_orders|orderListFiltersUpdateButton']",$target).addClass('ui-state-highlight');
						});
					});
					
//go get the list of orders.
				app.ext.admin_orders.a.showOrderList(P.filters);

//assigns all the button click events.
//				app.u.handleAppEvents($target);
// *** -> 201338 moved to delegated events model.
				app.u.handleEventDelegation($target);
				app.u.handleButtons($target);
				}
			else	{
				app.u.throwGMessge("WARNING! - pool ["+P.pool+"] and/or targetID ["+P.targetID+"] not passed into initOrderManager");
				}
//			app.u.dump("END initOrderManager");
			}, //initOrderManager

//will open dialog so users can send a custom message (content 'can' be based on existing message) to the user. order specific.
//though not a modal, only one can be open at a time.
		showCustomMailEditor : function(orderID, prt)	{
			if(orderID && Number(prt) >= 0)	{
				var $target = $('#orderEmailCustomMessage');
				if($target.length)	{$target.empty();}
				else	{
					$target = $("<div \/>",{'id':'orderEmailCustomMessage','title':'Send custom email'}).appendTo("body");
					$target.dialog({'width':500,'height':500,'autoOpen':false});
					}
	
				$target.dialog('open');
				$target.showLoading({'message':'Fetching list of email messages/content'});
	
				app.ext.admin.calls.adminEmailList.init({'TYPE':'ORDER','PRT':prt},{'callback':function(rd){
					$target.hideLoading();
					if(app.model.responseHasErrors(rd)){
						if(rd._rtag && rd._rtag.selector)	{
							$(app.u.jqSelector(rd._rtag.selector[0],rd._rtag.selector.substring(1))).empty();
							}
						app.u.throwMessage(rd);
						}
					else	{
						$target.append(app.renderFunctions.transmogrify({'adminemaillist-datapointer':'adminEmailList|'+prt+'|ORDER','orderid':orderID,'prt':prt},'orderEmailCustomMessageTemplate',app.data[rd.datapointer]));
						app.ext.admin.u.handleAppEvents($target);
						}
		
					}},'mutable');
				app.model.dispatchThis('mutable');
				}
			else	{
				app.u.throwGMessage("In admin_orders.a.showCustomMailEditor, orderid ["+orderID+"] or partition ["+prt+"] not passed and both are required.");
				}
			},



//targetID can be a tab, so the order template is appended to that (assigned to $order) and that is what's modified/tranlated. NOT targetID.
//otherwise, it could be possible to load new content into the tab but NOT have the data attributes cleaned out.
		showOrderView : function(orderID,CID,targetID,Q)	{
//			app.u.dump("BEGIN orders.a.showOrderView");
//			app.u.dump(" -> cid: "+CID);
			var r = 1; //what is returned. # of dispatches that occur.
			Q = Q || 'mutable'
			if(orderID && targetID)	{
//app.u.dump(" -> targetID: "+targetID);
//if you are reusing a targetID, do your own empty before running this.
var
	$target = $(app.u.jqSelector('#',targetID)),
	$order = $(app.renderFunctions.createTemplateInstance('orderDetailsTemplate',{'id':targetID+"_order",'orderid':orderID,'cid':CID}));

$order.attr('data-order-view-parent',orderID); //put this on the parent so that any forms or whatnot that need to reload early can closest() this attrib and get id.

//create an instance of the invoice display so something is in front of the user quickly.
$target.append($order)
$order.showLoading({'message':'Fetching order data'});

//go fetch order data. callback handles data population.
app.model.destroy('adminOrderDetail|'+orderID); //get a clean copy of the order.
app.model.destroy('adminOrderPaymentMethods'); //though not stored in local, be sure the last orders methods aren't by accident.

app.ext.admin.calls.adminOrderDetail.init(orderID,{'callback':function(rd){
//	app.u.dump("Executing callback for adminOrderDetail");
	
	$order.hideLoading();
	if(app.model.responseHasErrors(rd)){
		$('#globalMessaging').anymessage({"message":rd,"gMessage":true});
		}
	else	{

		var
			orderData = app.data[rd.datapointer];
			orderData.emailMessages = app.ext.admin_orders.vars.emailMessages; //pass in the email messages for use in the send mail button

		$order.anycontent(rd)
		
		$(".gridTable",$order).anytable();
		
//cartid isn't present till after the orderDetail request, so getting payment methods adds a second api request.
		app.ext.admin.calls.adminOrderPaymentMethods.init({
			'orderid':orderID,
			'customerid':CID,
			'ordertotal':orderData.sum.order_total,
			'countrycode':orderData.ship.countrycode || orderData.bill.countrycode
			},{
			'callback':function(rd){
				if(app.model.responseHasErrors(rd)){
					app.u.throwGMessage("In admin_orders.u.showOrderView, the request for payment details has failed.");
					}
				else {
//						app.u.dump("rd: "); app.u.dump(rd);
//translate just the right col so the rest of the panel isn't double-tranlsated (different data src).
					app.renderFunctions.translateSelector("#adminOrdersPaymentMethodsContainer [data-app-role='orderUpdateAddPaymentContainer']",app.data[rd.datapointer]);
					$('input:radio',$order).each(function(){
						$(this).off('click.getSupplemental').on('click.getSupplemental',function(){
//generates the bulk of the inputs. shared with store. these are admin only inputs.
//eventually, these should be moved into updatePayDetails and an admin param should be supported.
							app.ext.convertSessionToOrder.u.updatePayDetails($(this).closest('fieldset')); 
							});
						});
					}
				}
			},'immutable');
		app.model.dispatchThis('immutable');

		app.ext.admin.u.handleAppEvents($order);
//trigger the editable regions
		app.ext.admin_orders.u.makeEditable($("[data-app-role='orderUpdateNotesContainer']",$order),{'inputType':'textarea'});
		app.ext.admin_orders.u.makeEditable($('.billAddress',$order),{});
		app.ext.admin_orders.u.makeEditable($('.shipAddress',$order),{});
		
		$("[data-role='adminOrders|orderSummary'] :input",$order).off('change.trackChange').on('change.trackChange',function(){
			$(this).addClass('edited');
			$('.numChanges',$order).text($(".edited",$order).length).closest('button').button('enable').addClass('ui-state-highlight');
			});


//dispatch occurs outside this function.
$("[data-app-role='orderContents']",$order).anypanel({'showClose':false});
$("[data-app-role='orderNotes']",$order).anypanel({'showClose':false,'state':'persistent','extension':'admin_orders','name':'orderNotes','persistent':true});
$("[data-app-role='orderPaymentInfo']",$order).anypanel({'showClose':false,'state':'persistent','extension':'admin_orders','name':'orderPaymentInfo','persistent':true});
$("[data-app-role='orderShippingInfo']",$order).anypanel({'showClose':false,'state':'persistent','extension':'admin_orders','name':'orderShippingInfo','persistent':true});
$("[data-app-role='orderHistory']",$order).anypanel({'showClose':false,'state':'persistent','extension':'admin_orders','name':'orderHistory','persistent':true});

app.ext.admin.u.handleAppEvents($order);

		//now is the time on sprockets when we enhance.
		//go through lineitems and make item-specific changes. locking inputs. color changes, etc.
		//INVDETAIL 'may' be blank.
		if(orderData['@ITEMS'] && orderData['%INVDETAIL'])	{
			var $table = $("[data-app-role='orderContentsTable']",$order); //used for context.
			var L = orderData['@ITEMS'].length;
			for(var i = 0; i < L; i++)	{
				var invDetail = orderData['%INVDETAIL'][orderData['@ITEMS'][i].uuid]
				if(invDetail)	{
					var $tr = $("[data-uuid='"+orderData['@ITEMS'][i].uuid+"']",$table) ;// used for context.
					var $menu = $("menu[data-app-role='basetypeMenu']",$tr);
					$('li',$menu).hide();  //hide all the items in the base type menu. show as needed. li is used to hide (as opposed to using anchor) otherwise extra spacing occurs
					//done means done. no adjusting price or quantity at this point.
					if(invDetail.BASETYPE == "DONE")	{
//						$tr.attr('title','This item is DONE. It is no longer editable');
						$tr.attr('title','This item is DONE. Be very cautions about editing it.');
//						$('button',$tr).button('disable'); //** 201346 -> commented out for holidays (till we have a permanent solution.
//						$(':input',$tr).prop('disabled','disabled'); //** 201346 -> commented out for holidays (till we have a permanent solution.
						}
					else if(invDetail.BASETYPE == 'UNPAID')	{
						$("button[data-app-role='inventoryDetailOptionsButton']",$tr).button('disable').attr('title',"This item is unpaid. The base type can not be modified.");
						}
					else	{
						
						if(invDetail.BASETYPE == 'PICK' && invDetail.PICK_ROUTE == 'TBD')	{
							$("button[data-app-role='itemSupplierRoutingButton']",$tr).show(); //allow them to set the supplier routing.
							$("a[data-verb='DONE']",$menu).parent().show();
							}
						else if(invDetail.BASETYPE == 'PICK' && (invDetail.PICK_ROUTE == 'SUPPLIER' || invDetail.PICK_ROUTE == 'WMS'))	{
							$("a[data-verb='RESET']",$menu).parent().show();
							}
						else if(invDetail.BASETYPE == 'BACKORDER' || invDetail.BASETYPE == 'PREORDER'){
							$("a[data-verb='RESET']",$menu).parent().show();
							}
						else	{
							$("a[data-verb='DONE']",$menu).parent().show();
							}
						}
					
					//
					}
				else	{
					//inventory record for UUID doesn't exist. how odd.
					}
				}
			}

		}
	},'extension':'admin_orders','selector':'#'+$order.attr('id')},Q);
//zero isn't a valid cid.  cid must also be a number.
if(Number(CID) > 0)	{
//	app.u.dump("fetch customer record");
	r += app.ext.admin.calls.adminCustomerDetail.init({'CID':CID},{'callback':'translateSelector','extension':'admin','selector':'#customerInformation'},Q); //
	}
else	{
	app.u.dump("WARNING! - no CID set. not critical, but CID is preferred.");
	}



				}
			else	{
				app.u.throwGMessage("In admin_orders.a.showOrderDetails, either orderID ["+orderID+"] or targetID ["+targetID+"] were left blank");
				}
			return r; //1 dispatch occurs
			},


		showOrderEditorInDialog : function(orderID,CID)	{
app.u.dump("BEGIN extensions.admin_orders.a.showOrderEditorInDialog");
app.u.dump(" -> orderID : "+orderID);
app.u.dump(" -> CID : "+CID);

if(orderID)	{


	//when a modal may be opened more than once, set autoOpen to false then execute a dialog('open'). Otherwise it won't open after the first time.
	safeID = 'viewOrderDialog_'+orderID;
	var $ordersModal = $(app.u.jqSelector('#',safeID)); //global so it can be easily closed.

	if($ordersModal.length == 0)	{
		$ordersModal = $("<div />").attr({'id':safeID,'title':'Edit Order '+orderID}).data('orderid',orderID).appendTo('body');
		$ordersModal.dialog({width:"90%",height:$(window).height() - 100,'autoOpen':false,modal:true});
		}
	else	{$ordersModal.empty()} //dialog already exists, empty it to always populate w/ up to date content.
	$ordersModal.dialog('open');
	this.showOrderView(orderID,CID,safeID);
	app.model.dispatchThis();
	}
else	{
	app.u.throwGMessage("WARNING! - no orderID passed into admin_orders.u.showOrderEditorInDialog.");
	}
			}, //showOrderEditorInDialog



//shows a list of orders by pool.
		showOrderList : function(filterObj)	{
			//
			app.u.dump("BEGIN orders.a.showOrderList");
			if(!$.isEmptyObject(filterObj))	{
				var $mainCol = $('#ordersInterfaceMainColumn','#ordersContent')
				if($mainCol.data('activeRequestUUID'))	{
					app.model.abortRequest('mutable',$mainCol.data('activeRequestUUID'))
					}
				else	{
					//if an active request was in progress, showLoading is already running.
					$mainCol.showLoading({'message':'Requesting up to date order list.'});
					}
			//create instance of the template. currently, there's no data to populate.
				filterObj.DETAIL = 9;
				app.model.destroy('adminOrderList'); //always refresh list.
				app.ext.admin.calls.adminOrderList.init(filterObj,{'callback':'listOrders','extension':'admin_orders','templateID':'adminOrdersOrderLineItem'});
					$mainCol.data('activeRequestUUID',app.model.dispatchThis('mutable'));
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
		
		etypeAsClass : function($tag,data)	{
//			app.u.dump("BEGIN admin_orders.renderformats.etypeAsClass. ");
//			app.u.dump(" -> this bit ["+data.value+"] is on: "+app.u.isThisBitOn(2,data.value));
			if(data.value == 8 || app.u.isThisBitOn(8,data.value))	{$tag.addClass('red')}
			else if(data.value == 2 || app.u.isThisBitOn(2,data.value))	{$tag.addClass('green')}
			else	{} //do nothing.
			},
		
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
					var $select = $("<select \/>").attr('name','action').data(data.value);
					$select.off('change.showActionInputs').on('change.showActionInputs',function(){
						var $tr = $(this).closest('tr');
						if($(this).val())	{
		//					app.u.dump("$tr.next().attr('data-app-role'): "+$tr.next().attr('data-app-role'));
		//if the select list has already been changed, empty and remove the tr so there's no duplicate content.
							if($tr.next().data('app-role') == 'admin_orders|actionInputs')	{$tr.next().empty().remove();}
							else	{} //content hasn't been generated already, so do nothing.

							$tr.after("<tr data-app-role='admin_orders|actionInputs'><td colspan='"+$tr.children().length+"' class='alignRight actionInputs'><form action='#' onSubmit='app.ext.admin_orders.a.handlePaymentAction($(this)); return false;'><fieldset>"+app.ext.admin_orders.u.getActionInputs($(this).val(),$(this).data())+"<\/fieldset><\/form><\/td><\/tr>");
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
//recycled in list mode and edit mode. #MAIL| is important in list mode and stripped in edit mode during click event.
//designed for use with the vars object in this extension, not the newer adminEmailList _cmd
//this is shared, so do NOT add an app-click to the li here, do it with JS. -> used by bulk edit AND in order edit.
		emailMessagesListItems : function($tag,data)	{
			for(key in data.value)	{
				$tag.append("<li class='emailmsg_"+key.toLowerCase()+"'><a href='#MAIL|"+key+"' >"+data.value[key]+" ("+key+")</a></li>");
				}
			},


//used for adding email message types to a select menu.
//designed for use with the vars object returned by a adminEmailList _cmd
//* 201318 -> moved to admin extension as part of global email tool
/*		emailMessagesListOptions : function($tag,data)	{
			var L = data.value.length;
			for(var i = 0; i < L; i += 1)	{
				$tag.append($("<option \/>").val(data.value[i].MSGID).text(data.value[i].MSGTITLE).data({'MSGID':data.value[i].MSGID,'adminEmailListIndex':i}));
				}
			},
*/			
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

//pass in the entire shipments line/object (@SHIPMENTS[0])
		trackingAsLink : function($tag,data)	{
//			app.u.dump(" -> data.value: "); app.u.dump(data.value);
			if(data.value.track)	{			
				$tag.text(data.value.track);
//can only link up the tracking number if we can convert the ship code to a carrier, which requires appResource|shipcodes.json
//don't fail if it's not available (it should be by now), just output the tracking number without a link.
				if(app.model.fetchData("appResource|shipcodes.json"))	{
					var carrier = app.ext.admin_orders.u.getCarrierByShipCode(data.value.carrier);
					app.u.dump(" -> carrier: "+carrier);
					if(carrier == "UPS" || carrier == "FDX" || carrier == "DHL" || carrier == "USPS")	{
						$tag.addClass('lookLikeLink');
						$tag.off('click.tracking').on('click.tracking',function(){
							if(carrier == "UPS")	{
								app.ext.admin.u.linkOffSite("http://wwwapps.ups.com/WebTracking/track?HTMLVersion=5.0&loc=en_US&Requester=UPSHome&WBPM_lid=homepage%2Fct1.html_pnl_trk&trackNums="+data.value.track+"&track.x=Track");
								}
							else if(carrier == "DHL")	{
								app.ext.admin.u.linkOffSite("http://webtrack.dhlglobalmail.com/?mobile=&trackingnumber="+data.value.track);
								}
							else if(carrier == "USPS")	{
								app.ext.admin.u.linkOffSite("https://tools.usps.com/go/TrackConfirmAction_input?qtc_tLabels1="+data.value.track);
								}
							else if(carrier == "FDX")	{
								app.ext.admin.u.linkOffSite("https://www.fedex.com/fedextrack/index.html?tracknumbers="+data.value.track+"&cntry_code=us");
								}
							else	{} //should never get here.
							});
						}
					else	{} //no direct link for this carrier.
					}
				else	{
					app.u.dump("WARNING! non critical issue: admin_orders.renderFormat.trackingAsLink could not display the tracking # as a link because appResource|shipcodes.json was not available.");
					}
				}
			else	{} //no tracking number. do nothing.
			},
		
		paystatus : function($tag,data){
//			app.u.dump("BEGIN admin_orders.renderFormats.paystatus");
			var ps = data.value.substr(0,1), //first characer of pay status.
			pretty,
			className = '';

			switch(ps)	{
				case '0': pretty = 'Paid'; className='green'; break;
				case '1': pretty = 'Pending'; break;
				case '2': pretty = 'Denied'; className='red'; break;
				case '3': pretty = 'Cancelled'; break;
				case '4': pretty = 'Review'; break;
				case '5': pretty = 'Processing'; break;
				case '6': pretty = 'Voided'; break;
				case '9': pretty = 'Error ('+data.value+')'; className='orange'; break;
				default: pretty = 'unknown'; break;
				}

			$tag.text(pretty).attr('title',data.value).addClass(className); //used in order list, so don't force any pre/posttext.
			return true;
			}, //paystatus


		orderEditQtyInput : function($tag,data)	{
			var $input = $("<input \/>",{'type':'number','name':'qty','size':4,'step':'0.01','min':0}).val(data.value.qty).css('width',35);
			if(data.value.stid && data.value.stid.charAt(0) == '%')	{$input.prop('disabled',true).css('border-width','0');} //make field not-editable and not look editable.
			$tag.append($input);
			},

		orderEditPriceInput : function($tag,data)	{
			var $input = $("<input \/>",{'type':'number','name':'price','size':4,'step':'0.01','min':0}).val(data.value.price).css('width',50);
			if(data.value.stid && data.value.stid.charAt(0) == '%')	{$input.prop('disabled',true).css('border-width','0');} //make field not-editable and not look editable.
			$tag.append($input);
			},

		
		paystatusDetailed : function($tag,data){
//			app.u.dump("BEGIN admin_orders.renderFormats.paystatusDetailed");
//			app.u.dump(data.value);
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
//this adds some debug information, mostly for support.  Will make the payment status clickable and open a div with some debug data.
			if(ps >= 2)	{
				$tag.on('click',function(){
					var $content = $("<div \/>",{'title':'Some Debug Info'});
					contents = "<ul>",
					acct = data.value.acct.split('|');
					
					for(var i = 0; i < acct.length; i += 1)	{
						contents += "<li>"+acct[i]+"<\/li>";
						}
					content += "<\/ul>";

					for(var index in data.value)	{
						contents += index+": "+data.value[index]+"<br>";
						}
					
					$content.addClass('displayNone').append(contents);
					$content.appendTo('body');
					$content.dialog({'width':600});
					});
				}
			return true;
			} //paystatus

		}, //renderFormats



////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {

		handleOrderListCMenu : function(action,$row,vars)	{
			app.u.dump("BEGIN handleOrderListCMenu. action: "+action);
			if(action)	{
				var verb = action.split("|")[0];
				switch(verb)	{
					case 'customer_edit':
						var $D = app.ext.admin.i.dialogCreate({'title':'Edit Customer','showLoading':false});
						$D.dialog('open');
						app.ext.admin_customer.a.showCustomerEditor($D,{'CID':$row.data("cid")});
						break;
					
					case 'ticket_create':
						app.ext.admin_customer.a.showCRMTicketCreateInDialog({
							'orderid':$row.data('orderid')
							});
						break;
					
					case 'customer_email':
						var MSG = action.split('|')[1];
						if(MSG == 'CUSTOMMESSAGE')	{
							app.ext.admin_orders.a.showCustomMailEditor($row.data('orderid'),$row.data('prt'));
							}
						else	{
							app.ext.admin_orders.u.sendOrderMail($row.data('orderid'),MSG,$row);
							app.model.dispatchThis('immutable');
							}
						break;
					
					case 'order_flagaspaid':
						app.ext.admin_orders.u.flagOrderAsPaid($row,vars.statusColID);
						app.model.dispatchThis('immutable');
						break;
					
					case 'order_pool_change':
						app.ext.admin_orders.u.changeOrderPool($row,action.split('|')[1],vars.statusColID);
						app.model.dispatchThis('immutable');
						break;
					
					default:
					$('#globalMessaging').anymessage({"message":"In admin_orders.u.handleOrderListCMenu (triggered by a click in a contextual menu in the orders interface), undefined verb ("+verb+") from action ("+action+").","gMessage":true});
					}
				}
			else	{
				$('#globalMessaging').anymessage({"message":"In admin_orders.u.handleOrderListCMenu (triggered by a click in a contextual menu in the orders interface), undefined action ("+action+").","gMessage":true});
				}
			},

		handleOrderListTab : function(process)	{
//			app.u.dump("BEGIN admin_orders.u.handleOrderListTab");
			var $target = $('#orderListTab');
			var $table = $('#orderListTable');
			if($target.length)	{
				//tab already exists. don't create a duplicate.
				}
			else	{
				$table.stickytab({'tabtext':'order results','tabID':'productListTab','handleEventDelegation':true});
//make sure buttons and links in the stickytab content area close the sticktab on click. good usability.
				$('button, a',$table).each(function(){
					$(this).off('close.stickytab').on('click.closeStickytab',function(){
						$table.stickytab('close');
						})
					})
				}
			},

// gets run after a filter is run. never on filter click unless click submits.
		handleFilterCheckmarks : function($target)	{
			$(".ui-icon-check",$target).empty().remove(); //clear all checkmarks.
			$(".ui-selected").append("<span class='floatRight ui-icon ui-icon-check'><\/span>"); //add to selected items.
			},


		submitFilter : function()	{
//* 201338 -> added context (,'#ordersContent') to these selectors to make them more efficient.
			var $mainCol = $('#ordersInterfaceMainColumn','#ordersContent');
			app.ext.admin_orders.u.changeOMMode('order');

			$('#orderListTableBody','#ordersContent').empty(); //this is targeting the table body.
			$('.noOrdersMessage','#orderListTableContainer','#ordersContent').empty().remove(); //get rid of any existing no orders messages.
			var obj = {}
			obj.LIMIT = Number($('#filterLimit','#ordersContent').val()) || 30;
			$("[data-app-role='admin_orders|orderListFiltersUpdate'] ul").each(function(){
				var val = $(this).find('.ui-selected').attr('data-filtervalue');
				if(val){
					obj[$(this).attr('data-filter')]=val
					}
				});
			if($.isEmptyObject(obj))	{
				app.u.throwMessage('Please select at least one filter criteria');
				}
			else	{
//						app.u.dump(" -> filter change is getting set locally.");
				app.model.dpsSet('admin_orders','managerFilters',obj);
//						app.u.dump("Filter Obj: "); app.u.dump(obj);
				app.model.destroy('adminOrderList'); //clear local storage to ensure request
				app.ext.admin_orders.a.showOrderList(obj);
				}

			},

//https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Bitwise_Operators

//The flags field in the order is an integer. The binary representation of that int (bitwise and) will tell us what flags are enabled.
		getOrderFlagsAsArray : function(flagint)	{
			var flags = new Array(),
			B = Number(flagint).toString(2).split('').reverse().join(''); //binary
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



//pass in a code such as FXHD and the carrier (FDX) will be returned.
//handy when setting up links on tracking codes.
		getCarrierByShipCode : function(code)	{
			app.u.dump("BEGIN admin_orders.u.getCarrierByShipCode");
			app.u.dump(" -> code: "+code);
			var r; //what is returned. either a carrier OR false if no carrier available.
			if(app.model.fetchData("appResource|shipcodes.json") && code)	{
				app.u.dump(" -> appResource is availble. ");
				if(app.data["appResource|shipcodes.json"].contents[code])	{
					r = app.data["appResource|shipcodes.json"].contents[code].carrier;
					}
				else	{
					app.u.throwGMessage("In admin_orders.u.getCarrierByShipCode, app.data['appResource|shipcodes.json'].contents["+code+"] was not set. most likely an unrecognized ship code");
					}
				}
			else	{
				app.u.throwGMessage("In admin_orders.u.getCarrierByShipCode, either appResource|shipcodes.json ["+typeof app.data["appResource|shipcodes.json"]+"] not available or no shipping code was passed ["+code+"]");
				r = false;
				}
			return r;
			}, //getCarrierByShipCode


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
					// old orders may have a payment type of PAYPAL (IPN) but those are old and these actions are not applicable. no actions are.
					if (pref['ps'] == '189') {	actions.push('capture') }
					if (pref['ps'] == '199') {	actions.push('capture') }
					if (pref['ps'] == '259') { actions.push('retry') }
					if (pref['ps'].substring(0,1) == '0' || pref['ps'].substring(0,1) == '4') { 
						actions.push('refund');
						actions.push('void');
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
//					app.u.dump(" -> into tender regex else if");
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
					var reasonInput = "<label class='marginBottom'>Reason/Note: <input size=20 type='textbox' name='note' \/><\/label>";
					var amountInput = "<label class='marginBottom'>Amount: $<input size='7' type='number' name='amt' step='0.01' min='0' value='"+pref.amt+"' \/><\/label>";
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
							output += "<h4 class='clearfix'>Override: "+pref.uuid+"<\/h4>";
							output += "<div class='warning clearfix smallPadding'>This is an advanced interface intended for experts only.<br \/><b>Do not use without the guidance of technical support.</b><br \/><span class='lookLikeLink' onClick='app.ext.admin_support.a.showHelpDocInDialog(\"info_paymentstatus\");'>Payment Status Codes</span><\/div>";
							output += "<br \/>New payment status: <input type='textbox' size='3' onKeyPress='return app.u.numbersOnly(event);' name='ps' value='"+pref.ps+"' \/>";
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
				$('#orderListTableBody').trigger('mousestop'); // trigger the mouse stop event 
				},

			
			
//orderid and msgID are required.
			sendOrderMail : function(orderID,msgID,$row)	{
				if(msgID && orderID && $row.length){
					if($row)	{$('td:eq(0)',$row).empty().append("<span class='wait'><\/span>")}
					else	{}// see how this is used outside the list. may want to use this to trigger a showLoading.
					app.ext.admin.calls.adminOrderMacro.init(orderID,["EMAIL?msg="+msgID],{'callback':'handleSendEmail','extension':'admin_orders','targetID':$row.attr('id')});
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
						$('body').showLoading({'message':'Generating file for print'});
						
						app.calls.appProfileInfo.init({'profile':'DEFAULT'},{},'immutable'); //have this handy for any orders with no sdomain.
						
						$orders.each(function(){
							var $order = $(this);
							var sdomain = $order.data('sdomain');
							if(sdomain && sDomains[sdomain])	{} //dispatch already queued.
							else if(sdomain)	{
								sDomains[sdomain] = true; //add to array so that each sdomain is only requested once.
								app.calls.appProfileInfo.init({'domain':sdomain},{},'immutable');
								}
							else	{
								sdomain = "DEFAULT"; //use default profile if no sdomain is available.
								}
							app.model.destroy('adminOrderDetail|'+$order.data('orderid')); //get a clean copy of the order.
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
			changeOrderPool : function($row,pool){
				if($row.length && pool)	{
					$row.attr('data-status','queued');  //data-status is used to record current status of row manipulation (queued, error, complete)
					$('td:eq(0)',$row).empty().append("<span class='wait'><\/span>");
					app.ext.admin.calls.adminOrderMacro.init($row.attr('data-orderid'),['SETPOOL?pool='+pool],{"callback":"orderPoolChanged","extension":"admin_orders","targetID":$row.attr('id')}); //the request will return a 1.
					}
				else	{app.u.throwGMessage("In admin_orders.u.changeOrderPool, either $row.length ["+$row.length+"] is empty or pool ["+pool+"] is blank")}
				}, //changeOrderPool


//Run the dispatch on your own.  That way a bulkChangeOrderPool can be run at the same time as other requests.
			bulkChangeOrderPool : function(CMD){
				var $selectedRows = $('#orderListTable tr.ui-selected');
				
				if($selectedRows.length)	{
					var pool = CMD.substr(5);
					$selectedRows.each(function() {
						app.ext.admin_orders.u.changeOrderPool($(this),pool);
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

						app.ext.admin.calls.adminOrderMacro.init($row.attr('data-orderid'),['FLAGASPAID'],{"callback":"orderFlagAsPaid","extension":"admin_orders","targetID":$row.attr('id')}); 
						}
					}
				else	{
					app.u.throwGMessage("$row not passed/has no length OR statusColID not set in admin_orders.u.flagOrderAsPaid.<br \/>Dev: see console for details.");
					app.u.dump("WARNING! admin_orders.u.flagOrderAsPaid statusColID not set ["+statusColID+"] OR $row has no length. $row:"); app.u.dump($row);
					}
				}, //flagOrderAsPaid

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
			makeEditable : function($container,P)	{
//app.u.dump("BEGIN admin_orders.u.makeEditable");
if(!P.inputType)	{P.inputType == 'text'}
//info on editable can be found here: https://github.com/tuupola/jquery_jeditable
$('.editable',$container).each(function(){
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
    $('.editable',$container).off('keydown.jeditable').on('keydown.jeditable', function(evt) {
        if(evt.keyCode==9) {
			var nextBox=$('.editable',$container).eq($('.editable',$container).index(this)+1);
			$(this).find("input").trigger('blur');  //Go to assigned next box
			$(nextBox).click();  //Go to assigned next box
			return false;           //Suppress normal tab
			}
		});



				}, //makeEditable

//obj requires title, templateID and orderID.
//dialogParams is optional, but if not set, defaults will be used.
			quickview : function(obj,dialogParams)	{
				if(obj.title && obj.templateID && obj.orderID)	{
					dialogParams = dialogParams || {
						width:600,
						height:300,
						close: function(event, ui){$(this).dialog('destroy').remove()} //garbage collection. removes from DOM.
						} //defaults for dialog.
					}
				else	{}
					var $content = $("<div \/>",{'title':obj.title,'id':'qv_'+obj.templateID+'_'+app.u.guidGenerator()}).addClass('orderQuickviewContent').appendTo('body');
					$content.append(app.renderFunctions.createTemplateInstance(obj.templateID,{'orderid':obj.orderID}));

					$content.dialog(dialogParams);
					$content.showLoading({'message':'Loading order information'});
					app.ext.admin.calls.adminOrderDetail.init(obj.orderID,{'callback':'translateSelector','selector':"#"+$content.attr('id'),'extension':'admin'},'mutable');
					app.model.dispatchThis('mutable');
				
				},

			changeOMMode : function(mode)	{
				var $mainCol = $('#ordersInterfaceMainColumn','#ordersContent');
				if(mode == 'order')	{
					$mainCol.removeClass('itemListMode').addClass('orderListMode').data('mode','order');
					}
				else if (mode == 'item')	{
					$mainCol.removeClass('orderListMode').addClass('itemListMode').data('mode','item');
					}
				else	{
					$mainCol.anymessage({'message':'In admin_orders.u.changeOMMode, invalid mode ['+mode+'] set. must be order or item.','gMessage':true});
					}
				}


			}, //u
//e is 'Events'. these are assigned to buttons/links via appEvents.
		e : {
			
		
/* 
//////////////////   BEGIN delegated events \\\\\\\\\\\\\\\\\\
*/
			
			"showOrderEditorInDialog" : function($ele,P)	{
				var orderID = $ele.data('orderid') || $ele.closest("[data-orderid]").data('orderid');
				if(orderID)	{
					
					if($ele.is('button'))	{$ele.button()}
					else	{$ele.addClass('lookLikeLink')} //make sure element looks clickable.
					
					$ele.off('click.showOrderEditorInDialog').on('click.showOrderEditorInDialog',function(){
						app.ext.admin_orders.a.showOrderEditorInDialog(orderID,0);
						});
					}
				},
			
			"itemListFilterUpdate" : function($ele,P){
				app.ext.admin_orders.u.changeOMMode('item');

				var $mainCol = $('#ordersInterfaceMainColumn','#ordersContent');
				var $tbody = $("[data-app-role='itemListTbody']",$mainCol);
				$mainCol.showLoading({'message':'Fetching item list'});
				
				$tbody.intervaledEmpty(); //clear any previous results
				
				if($ele.data('filtervalue'))	{
					var cmdObj = {
						'_cmd':'adminOrderItemList',
						'_tag':	{
							'datapointer' : 'adminOrderItemList',
							'limit' : 100,
							'callback':function(rd){
								$mainCol.hideLoading();
								if(app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									//success content goes here.
									$tbody.anycontent(rd);
									app.u.handleButtons($tbody);
									}
								}
							}
						}
					
					cmdObj[$ele.data('filtervalue')] = 1;
					app.model.addDispatchToQ(cmdObj,'mutable');
					app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_orders.e.itemListFilterUpdate, data-filtervalue not set on trigger element.","gMessage":true});
					}
				},
			
			"orderListFiltersUpdate" : function($ele,P)	{
				app.ext.admin_orders.u.submitFilter();
				},

			"orderListUpdateSelectAll" : function($ele,P)	{
				var $mainCol = $('#ordersInterfaceMainColumn','#ordersContent');
				var $tbody = $("[data-app-role='"+$mainCol.data('mode')+"ListTbody']",$mainCol);
//if an item is being updated, this will still 'select' it, but will not change the wait icon.
				$('tr',$tbody).each(function() {
					$(this).addClass("ui-selected").removeClass("ui-unselecting");
					});
// trigger the mouse stop event (this will select all .ui-selecting elements, and deselect all .ui-unselecting elements)
				$tbody.closest('table').data("ui-selectable")._mouseStop(null);
				}, //orderListUpdateSelectAll

			"orderListUpdateDeselectAll" : function($ele,P)	{
				var $mainCol = $('#ordersInterfaceMainColumn','#ordersContent');
				var $tbody = $("[data-app-role='"+$mainCol.data('mode')+"ListTbody']",$mainCol);
//if an item is being updated, this will still 'select' it, but will not change the wait icon.
				$('tr',$tbody).each(function() {
					$(this).removeClass("ui-selected");
					});
				$tbody.closest('table').data("ui-selectable")._mouseStop(null); // trigger the mouse stop event 
				}, //orderListUpdateDeselectAll

			"bulkImpactOrderItemListExec" : function($ele,P)	{

				if($ele.attr('href') == '#')	{
				//if the li has a child list, do nothing on click, the children contain the actions.
					app.u.dump(" -> selected command has children.");
					}
				else	{
					var command = $ele.attr('href').substring(1), //substring drops the #. will = POOL|PENDING or  PRNT|INVOICE
					actionType = command.substring(0,4); //will = PRNT or POOL. 4 chars
				//		app.u.dump(" -> actionType: "+actionType);
				//		app.u.dump(" -> command: "+command);
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
				
							case 'BTCH':
								alert('woot!');
								break;
				
							default:
								app.u.throwMessage("Unknown actionType selected ["+actionType+"]. Please try again. If error persists, please contact technical support.");
							}
						}
					}
				},


//the edit button in the order list mode. Will open order editable format.
			"orderUpdateShowEditor" : function($ele,P){
				var
					orderID,
					CID = $ele.closest('tr').attr('data-cid') || ""; //not strictly required, but helpful.
					
				if($ele.data('mode') == 'inventoryDetail')	{
					orderID = $ele.closest('[data-our_orderid]').attr('data-our_orderid');
					}
				else	{
					orderID = $ele.attr('data-orderid');
					}
				
				if(orderID)	{
					app.ext.admin_orders.u.handleOrderListTab('activate');
					$(app.u.jqSelector('#',"ordersContent")).empty();
					app.ext.admin_orders.a.showOrderView(orderID,CID,"ordersContent"); //adds a showLoading
					app.model.dispatchThis();
					}
				else	{
					app.u.throwGMessage("In admin_orders.buttonActions.orderUpdateShowEditor, unable to determine order id.");
					}
				}, //orderUpdateShowEditor

//Triggered when the quickview button is clicked. shows the dropdown menu.
			"orderQuickviewShow" : function($ele,P)	{
				app.u.dump("BEGIN admin_orders.e.orderQuickviewShow (click!)");
				var $menu = $ele.parent().find('menu');
				if($menu.hasClass('ui-menu'))	{} //already been opened once, just show it.
				else	{
					$menu.menu().data(app.u.getWhitelistedObject($ele.closest('tr').data(),['orderid','sdomain']));
					$menu.css({'position':'absolute','width':'200px','z-index':'10000'});
					}
				$menu.show().position({
					my: "right top",
					at: "right bottom",
					of: $ele
					});
				//when this wasn't in a timeout, the 'click' on the button triggered. this. i know. wtf?  find a better solution. !!!
				setTimeout(function(){$(document).one( "click", function() {$menu.hide();});},100);
				}, //orderQuickviewShow

//triggered when a menu item within quickview is clicked.
			"orderQuickviewExec" : function($ele,P)	{
				app.u.dump("BEGIN admin_orders.e.orderQuickviewExec (click!)");
				var verb = $ele.data('verb');
				var orderID = $ele.closest('menu').data('orderid');
//				app.u.dump(" -> verb: "+verb+"\n -> orderID: "+orderID);
				if(verb && orderID)	{
					$ele.closest('menu').hide();
					switch(verb)	{
						case 'trackingHistory':
							app.ext.admin_orders.u.quickview({'orderID':orderID,'templateID':'orderTrackingHistoryContainerTemplate','title':'Tracking History: '+orderID});
							break;

						case 'eventHistory':
							app.ext.admin_orders.u.quickview({'orderID':orderID,'templateID':'orderEventsHistoryContainerTemplate','title':'Event History: '+orderID});
							break;

						case 'orderNotes':
							app.ext.admin_orders.u.quickview({'orderID':orderID,'templateID':'qvOrderNotes','title':'Order Notes: '+orderID});
							break;

						case 'invoice':

							var sdomain = $ele.closest('menu').data('sdomain'); //stored AS data, not data- attribute.
							var $D = app.ext.admin.i.dialogCreate({
								title : 'View invoice for '+orderID,
								templateID : 'invoiceTemplate',
								showLoading : false,
								dataAttribs : {'orderid':orderID}
								});

							$D.addClass('orderQuickviewContent');
							$D.dialog('open');
							$D.showLoading({'message':'Fetching order details'});

							if(sdomain)	{app.calls.appProfileInfo.init({'domain':sdomain},{},'immutable');}
							app.ext.admin.calls.adminOrderDetail.init(orderID,{'callback':'anycontent','translateOnly':true,'jqObj':$D,'extendByDatapointers':['appProfileInfo|'+sdomain]},'mutable');
							app.model.dispatchThis('mutable');

							break;
		
						default:
							$('#globalMessaging').anymessage({"message":"In admin_orders.e.orderQuickviewExec, data-verb invalid ("+verb+") on trigger element.","gMessage":true});
							break;
						}


					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_orders.e.orderQuickviewExec, data-verb ["+verb+"] not set on trigger element OR unable to ascertain order ID ["+orderID+"].","gMessage":true});
					}
				},



/*
//////////////////   END delegated events \\\\\\\\\\\\\\\\\\
*/


			"orderCustomerEdit" : function($btn)	{
				$btn.button();
				$btn.off('click.orderCreate').on('click.orderCreate',function(){
					var
						$parent = $btn.closest("[data-order-view-parent]"),
						orderID = $parent.data('order-view-parent');

// ** 201320 -> upgraded to use new customer editor. Also added better error checking.
//					if(orderID)	{
//						navigateTo('/biz/utilities/customer/index.cgi?VERB=EDIT&CID='+app.data['adminOrderDetail|'+orderID].customer.cid,{'dialog':true});
//						}
					if(orderID && app.data['adminOrderDetail|'+orderID] && app.data['adminOrderDetail|'+orderID].customer && app.data['adminOrderDetail|'+orderID].customer.cid)	{
						var $D = app.ext.admin.i.dialogCreate({title:'Edit Customer: '+app.data['adminOrderDetail|'+orderID].customer.cid});
						app.ext.admin_customer.a.showCustomerEditor($D,{'CID':app.data['adminOrderDetail|'+orderID].customer.cid});
						$D.dialog('open');
						}
					else	{
						app.u.throwGMessage("in admin_orders.buttonActions.orderCustomerEdit, unable to determine orderID ["+orderID+"]");
						}
					});
				}, //orderCustomerEdit
				

			"orderItemUpdate" : function($btn)	{
				var $row = $btn.closest('tr');
				if($row.data('stid') && $row.data('stid').charAt(0) == '%')	{$btn.hide()} //coupons can't be removed this way.
				else	{
					$btn.button();
					$btn.button({icons: {primary: "ui-icon-arrowrefresh-1-e"},text: false});
					$btn.off('click.orderItemUpdate').on('click.orderItemUpdate',function(){
						var $parent = $btn.closest("[data-order-view-parent]"),
						orderID = $parent.data('order-view-parent'),
						uuid = $row.data('uuid'),
						qty = $("[name='qty']",$row).val(),
						price = $("[name='price']",$row).val();
						if(uuid && orderID && qty && price)	{
							app.ext.admin.calls.adminOrderMacro.init(orderID,["ITEMUPDATE?uuid="+uuid+"&qty="+qty+"&price="+price]);
							$parent.empty();
							app.ext.admin_orders.a.showOrderView(orderID,app.data['adminOrderDetail|'+orderID].customer.cid,$parent.attr('id'),'immutable');
							app.model.dispatchThis('immutable');
							}
						else	{
							app.u.throwGMessage("in admin_orders.buttonActions.orderItemUpdate, unable to determine orderID ["+orderID+"], uuid ["+uuid+"], price ["+price+"], OR qty ["+qty+"]");
							}
						});
					}
				}, //orderItemUpdate

			"orderItemRemove" : function($btn)	{
				var $row = $btn.closest('tr');
				if($row.data('stid') && $row.data('stid').charAt(0) == '%')	{$btn.hide()} //coupons can't be removed this way.
				else	{
					$btn.button();
					$btn.button({icons: {primary: "ui-icon-trash"},text: false});
					$btn.off('click.orderItemRemove').on('click.orderItemRemove',function(){
						var $parent = $btn.closest("[data-order-view-parent]"),
						orderID = $parent.data('order-view-parent'),
						stid = $row.data('stid');
						if(stid && orderID)	{
							app.ext.admin.calls.adminOrderMacro.init(orderID,["ITEMREMOVE?stid="+stid]);
							$parent.empty();
							app.ext.admin_orders.a.showOrderView(orderID,app.data['adminOrderDetail|'+orderID].customer.cid,$parent.attr('id'),'immutable');
							app.model.dispatchThis('immutable');
							}
						else	{
							app.u.throwGMessage("in admin_orders.buttonActions.orderItemRemove, unable to determine orderID ["+orderID+"] or pid ["+json.pid+"]");
							}
						});
					}
				}, //orderItemRemove

			"orderItemAddStructured" : function($btn)	{
				$btn.button();
				$btn.off('click.orderItemAddStructured').on('click.orderItemAddStructured',function(event){
					event.preventDefault();
					var $button = $("<button>").text("Add to Order").button().on('click',function(){
						
						var $parent = $btn.closest("[data-order-view-parent]"),
						orderID = $parent.data('order-view-parent'),
						$form = $('form','#chooserResultContainer'),
						formJSON = $form.serializeJSON(),
						orderID = $btn.data('orderid') || $btn.closest('[data-orderid]').data('orderid');
	
						formJSON.product_id = formJSON.sku;
	
						if(formJSON.sku && orderID)	{
							if(app.ext.store_product.validate.addToCart(formJSON.sku,$form))	{
									app.u.dump("formJSON"); app.u.dump(formJSON);
								for(var index in formJSON)	{
//if the key is two characters long and uppercase, it's likely an option group.
//if the value is more than two characters and not all uppercase, it's likely a text based sog. add a tildae to the front of the value.
//this is used on the API side to help distinguish what key value pairs are options.
//									app.u.dump(" -> index.substr(4): "+index.substr(4));
									if(index.length == 2 && index.toUpperCase() == index && formJSON[index].length > 2 && formJSON[index].toUpperCase != formJSON[index])	{
										app.u.dump(" -> index: "+index+" is most likely a non-inventory-able blob option");
										formJSON[index.substr(4)] = "~"+formJSON[index]
										}
//strip pog_ but no tildae, which is ONLY needed for text based sogs.
									else if(index.length == 2 && index.toUpperCase() == index)	{
										app.u.dump(" -> index: "+index+" is most likely a sog");
										var pogID = index.substr(4);
//special handling for checkboxes. If NOT optional and blank, needs to be set to NO.
//on a checkbox sog, an extra param is passed pog_ID_cb which is set to 1. this is to 'know' that the cb was present so if the value is blank, we can handle accordingly.
										if(pogID.indexOf('_cb') > -1)	{
											var cbPogID = pogID.substring(0,(pogID.length-3)); //strip __cb off end.
//											app.u.dump(" -> cbPogID: "+cbPogID);
											if(formJSON[cbPogID])	{
//												app.u.dump(" -> formJSON[cbPogID] already set: "+formJSON[cbPogID]);
												} //already set, use that value and do nothing else.
											else	{
//check to see if the sog is optional. if so, do nothing. If not, set to NO
												var sog = pogs.getOptionByID(cbPogID); //pogs. is instantiated in the chooser as part of the template.
												if(sog.optional)	{
//													app.u.dump(" -> sog.optional set: "+sog.optional);
													} //do nothing if optional. will go up as blank.
												else	{
													formJSON[cbPogID] = "NO";
													}
												}
											delete formJSON[index]; //deletes the pog_ID_on param, which isn't needed by the API.
											}
										else	{
// pog indices used to have a pog_ prefix. They no longer do so no sanitization necessary anymore.
//											app.u.dump(" -> index: "+index+" is not a sog");
//											formJSON[pogID] = formJSON[index]
//											delete formJSON[index];
											}
										}
									
									
									
									}
								app.ext.admin.calls.adminOrderMacro.init(orderID,["ITEMADDSTRUCTURED?"+decodeURIComponent($.param(formJSON))]);
								$parent.empty();
								app.ext.admin_orders.a.showOrderView(orderID,app.data['adminOrderDetail|'+orderID].customer.cid,$parent.attr('id'),'immutable');
								app.model.dispatchThis('immutable');
								
								}
							else	{
	//error display is in validate code.							
								}
							}
						else	{
							app.u.throwGMessage("in admin_orders.buttonActions.orderItemAddStructured, unable to determine orderID ["+orderID+"] or pid ["+formJSON.sku+"]");
							}
						});
					app.ext.admin.a.showFinderInModal('CHOOSER','','',{'$buttons' : $button})
					});
				}, //orderItemAddStructured



			"orderItemAddBasic" : function($btn)	{
				$btn.button();
				$btn.off('click.orderItemAddBasic').on('click.orderItemAddBasic',function(event){
					event.preventDefault();
					app.u.dump("BEGIN admin_orders.buttonActions.orderItemAddBasic.click");
					var orderID = $btn.data('orderid') || $btn.closest('[data-orderid]').data('orderid'),
					$parent = $btn.closest("[data-order-view-parent]"),
					$form = $("<form>").append("<label><span>sku:</span><input type='text' name='stid' value='' required='required' /></label><label><span>name:</span><input type='text' name='title' value='' required='required'  /></label><label><span>qty:</span><input type='number' size='3' name='qty' value='1' required='required'  /></label><label><span>price:</span><input type='number' size='7' name='price' value=''  step='0.01' min='0' required='required'  /></label>"),
					$modal = $("<div \/>").addClass('labelsAsBreaks orderItemAddBasic').attr('title','Add item to order').append($form),
					$button = $("<button \/>").addClass('alignCenter').text("Add to Order").button();
					$form.append($button);
					$form.on('submit',function(event){
						event.preventDefault();
						if(orderID)	{
							app.ext.admin.calls.adminOrderMacro.init(orderID,["ITEMADDBASIC?"+$(this).serialize()],{},'immutable');
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
				}, //orderItemAddBasic


			"orderUpdateCancel" : function($btn)	{
				$btn.button({text:true, icons: {primary: "ui-icon-circle-arrow-w"}});
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
				



			"orderPrintInvoice" : function($btn){
				$btn.button();
				$btn.off('click.orderPrintInvoice').on('click.orderPrintInvoice',function(event){
					event.preventDefault();
					var orderID = $btn.data('orderid') || $btn.closest('[data-orderid]').data('orderid');
					if(orderID)	{
//in some cases, 'our' contains a profile, but no domain and vice-versa. so both are passed.
						app.ext.convertSessionToOrder.a.printOrder(orderID,{data:{'type':'invoice','profile':app.data['adminOrderDetail|'+orderID].our.profile,'domain':app.data['adminOrderDetail|'+orderID].our.sdomain}});
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
//					app.u.dump("BEGIN admin_orders.e.orderPrintPackSlip click event");
					var orderID = $btn.data('orderid') || $btn.closest('[data-orderid]').data('orderid');
					if(orderID)	{
						app.ext.convertSessionToOrder.a.printOrder(orderID,{data:{'type':'packslip','profile':app.data['adminOrderDetail|'+orderID].our.profile,'domain':app.data['adminOrderDetail|'+orderID].our.sdomain}});
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
					$btn.parent().find("[data-app-event='admin_orders|orderEmailShowMessageList']").trigger('click');
					app.u.dump(" -> $btn.parent().find('[data-app-event='orderEmailShowMessageList']').length: "+$btn.parent().find("[data-app-event='admin_orders|orderEmailShowMessageList']").length);
					});


				}, //orderEmailSend

			"orderEmailCustomSend" : function($btn)	{
				$btn.button();
				$btn.off('click.orderEmailCustomSend').on('click.orderEmailCustomSend',function(event){
					event.preventDefault();
					var $form = $btn.parents('form'),
					frmObj = $form.serializeJSON(),
					orderID = $btn.closest("[data-orderid]").data('orderid');
					partition = $btn.closest("[data-prt]").data('prt');
					
					$('body').showLoading({'message':'Sending custom message for order '+orderID});
					
					if(!$.isEmptyObject(frmObj) && orderID && frmObj.SUBJECT && frmObj.BODY && frmObj.BODY.length > 1)	{
						app.ext.admin.calls.adminOrderMacro.init(orderID,["EMAIL?body="+encodeURIComponent(frmObj.BODY)+"&subject="+encodeURIComponent(frmObj.SUBJECT)],{'callback':function(rd){
$('body').hideLoading();
if(app.model.responseHasErrors(rd)){
	rd.parentID = 'orderEmailCustomMessage';
	app.u.throwMessage(rd);
	}
else	{
	var msgObj = app.u.successMsgObject("Thank you, your message has been sent.");
	$('#orderEmailCustomMessage').empty();
	msgObj.parentID = 'orderEmailCustomMessage';
	app.u.throwMessage(msgObj);
	}
							}});
//						app.u.dump(" -> frmObj.updateSystemMessage: "+frmObj.updateSystemMessage);
						if(frmObj.updateSystemMessage && frmObj.updateSystemMessage.toLowerCase() == 'on' && frmObj.MSGID != 'BLANK')	{
//							app.u.dump(" -> updating default system messaging");
							frmObj.PRT = partition;
							frmObj.TYPE = 'ORDER'; //Don't pass a blank FORMAT, must be set to correct type.
							delete frmObj.updateSystemMessage; //clean up obj for _cmd var whitelist.
//							app.u.dump(" -> frmObj: "); app.u.dump(frmObj);
							app.ext.admin.calls.adminEmailSave.init(frmObj,{'callback':function(rd){
if(app.model.responseHasErrors(rd)){
	rd.parentID = 'orderEmailCustomMessage';
	app.u.throwMessage(rd);
	}
else	{
	var msgObj = app.u.successMsgObject("Thank you, "+frmObj.MSGID+" message has been updated.");
	msgObj.parentID = 'orderEmailCustomMessage';
	
	app.u.throwMessage(msgObj);
	}
								}},'immutable');
							}
						
						app.model.dispatchThis('immutable')
						}
					else	{
						app.u.throwGMessage("In admin_orders.e.orderEmailCustomSend, both subject ["+frmObj.subject+"] and body are required and one was empty OR app was unable to ascertain the order id ["+orderID+"]");
						app.u.dump("In the following object, body param MUST be present and have a length > 1"); app.u.dump(frmObj);
						}
					
					})
				}, //orderEmailCustomSend

//applied to the select list that contains the list of email messages. on change, it puts the message body into the textarea.
			"orderEmailCustomChangeSource" : function($select)	{
				app.ext.admin.e.toggleEmailInputValuesBySource($select);
				}, //orderEmailCustomChangeSource

//
			"orderEmailShowMessageList" : function($btn){
				
				$btn.button({text: false,icons: {primary: "ui-icon-triangle-1-s"}})

				var orderID = $btn.data('orderid') || $btn.closest('[data-orderid]').data('orderid');
				var menu = $btn.parent().next('ul').menu().hide();
				menu.css({'position':'absolute','width':'300px','z-index':'10000'}).parent().css('position','relative');
				
				menu.find('li a').each(function(){
					$(this).off('click.sendmail').on('click.sendmail',function(event){
						event.preventDefault();
						if($(this).attr('href') == '#MAIL|CUSTOMMESSAGE')	{
							app.ext.admin_orders.a.showCustomMailEditor(orderID,app.data["adminOrderDetail|"+orderID].our.prt || 0); //if partition isn't set, use default partition.
							}
						else	{
							$('body').showLoading({'message':'Emailing customer [message: '+$(this).attr('href').substring(6)+']'});
//substring(6) on the link below strips #MAIL| from the url
							app.ext.admin.calls.adminOrderMacro.init(orderID,["EMAIL?msg="+$(this).attr('href').substring(6)],{'callback':'handleSendEmailFromEdit','extension':'admin_orders'});
							app.model.dispatchThis('immutable');
							}
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

				}, //orderEmailShowMessageList



			"orderSearch" : function($ele,P)	{

				var $mainCol = $('#ordersInterfaceMainColumn','#ordersContent')
				app.ext.admin_orders.u.changeOMMode('order');
				
				var
					frmObj = $ele.closest('form').serializeJSON(),
					query;
				
				if(frmObj.keyword)	{
//						app.ext.admin.calls.adminPrivateSearch.init({'size':20,'type':['order',frmObj.type],'query':{'query_string':{'query':frmObj.keyword}}},{'callback':'listOrders','extension':'admin_orders'},'immutable');
					$('#orderListTableBody').empty();
					$('.noOrdersMessage','#orderListTableContainer').empty().remove(); //get rid of any existing no orders messages.
					$mainCol.showLoading({'message':'Searching orders...'});
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
					
					app.ext.admin.calls.adminOrderSearch.init(query,{'callback':'listOrders','extension':'admin_orders','templateID':'adminOrdersOrderLineItem','keyword':frmObj.keyword},'immutable');

					app.model.dispatchThis('immutable');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"Please add a keyword (order id, email, etc) into the search form"});
					}

				}, //orderSearch


			"orderSummarySave" : function($btn)	{
				$btn.button();
				$btn.off('click.orderSummarySave').on('click.orderSummarySave',function(event){
					event.preventDefault();

					var frmObj = $btn.closest('form').serializeJSON(),
					macros = new Array(),
					$parent = $btn.closest("[data-order-view-parent]"),
					orderID = $parent.data('order-view-parent');
					
//build tax macro/call, if necessary. Only add if inputs have changed.
					if((frmObj['sum/tax_rate_state'] && $("[name='sum/tax_rate_state']",$parent).hasClass('edited')) || (frmObj['sum/tax_rate_zone'] && $("[name='sum/tax_rate_zone']",$parent).hasClass('edited')))	{
						var macro = "SETTAX?"
						if(frmObj['sum/tax_rate_state']) {macro += "sum/tax_rate_state="+frmObj['sum/tax_rate_state']}
						if(frmObj['sum/tax_rate_state'] && frmObj['sum/tax_rate_zone'])	{macro += "&"}
						if(frmObj['sum/tax_rate_zone'])	{macro += "sum/tax_rate_zone="+frmObj['sum/tax_rate_zone']}
						macros.push(macro);
						}
//build shipping macro/call, if necessary. Only add if inputs have changed.
					if($("[name='sum/shp_carrier']",$parent).hasClass('edited') || $("[name='sum/shp_method']",$parent).hasClass('edited') || $("[name='sum/shp_total']",$parent).hasClass('edited'))	{
						macros.push("SETSHIPPING?sum/shp_total="+frmObj['sum/shp_total']+"&sum/shp_carrier=SLOW&sum/shp_method="+frmObj['sum/shp_method']);
						}

					if(macros.length)	{
						$parent.empty();
						app.ext.admin.calls.adminOrderMacro.init(orderID,macros,{});
						app.ext.admin_orders.a.showOrderView(orderID,app.data['adminOrderDetail|'+orderID].customer.cid,$parent.attr('id'),'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{
						app.u.throwGMessage("in admin_orders.e.orderSummarySave, macros is empty. no tax or shipping update recognized.");
						}

					
					});
				}, //orderSummarySave


			"orderUpdateSave" : function($btn){
				$btn.button();
				$btn.off('click.orderUpdateSave').on('click.orderUpdateSave',function(event){
					event.preventDefault();
//this item may be in the order list which would make that list innacurate. this triggers a data reload next time order view is displayed.
					app.model.destroy('adminOrderList');

					var $target = $btn.closest("[data-order-view-parent]"),
					orderID = $target.data('order-view-parent'),
					cid = app.data['adminOrderDetail|'+orderID].customer.cid;
					
					if(orderID)	{

//the changes are all maintained on one array and pushed onto 1 request (not 1 pipe, but one adminOrderMacro _cmd).
						var changeArray = new Array();

//poolSelect is the dropdown for changing the pool.
						var $poolSelect = $("[data-app-role='orderUpdatePool']",$target);
						app.u.dump(" -> $poolSelect.length = "+$poolSelect.length);
						if($poolSelect.hasClass('edited'))	{
							changeArray.push('SETPOOL?pool='+$poolSelect.val());
							}
						delete $poolSelect; //not used anymore.



						handleNote = function(type){
							var $note = $("[data-app-role='admin_orders|"+type+"']",$target);
							if($note.hasClass('edited'))	{changeArray.push(type+'?note='+encodeURIComponent($note.text()));}
							else	{} //do nothing. note was not edited.
							}
						handleNote('SETPRIVATENOTE');
						handleNote('SETPUBLICNOTE');
						handleNote('ADDCUSTOMERNOTE');

						

//for address uses teh setSHIPADDR and/or SETSHIPADDR
						var $address = $("[data-app-role='admin_orders|orderUpdateShipAddress']",$target);
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
						$address = $("[data-app-role='admin_orders|orderUpdateBillAddress']",$target);

//						app.u.dump(" -> $address.length: "+$address.length);
//						app.u.dump(" -> $('.edited',$address).length: "+$('.edited',$address).length);

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
						
						if(changeArray.length)	{
							if(cid)	{app.model.destroy("adminCustomerDetail|"+cid);} //refresh the customer data in case notes changed.
							app.ext.admin.calls.adminOrderMacro.init(orderID,changeArray,{},'immutable');
							$target.empty();
							app.ext.admin_orders.a.showOrderView(orderID,cid,$target.attr('id'),'immutable'); //adds a showloading
							app.model.dispatchThis('immutable');
							}
						else	{
							$("#ordersContent_order").anymessage({'message':'No changes have made.'});
							}
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
					
					app.u.dump(" -> formJSON.tender: "+formJSON.tender);
					
					if(formJSON.tender)	{
						var $paymentContainer = $btn.closest("[data-app-role='orderUpdatePaymentMethodsContainer']"),
						CMD, //the command for the cart update macro. set later.
						errors = (typeof app.ext.store_checkout.validate[formJSON.tender] === 'function') ? app.ext.store_checkout.validate[formJSON.tender](formJSON) : false; //if a validation function exists for this payment type, such as credit or echeck, then check for errors. otherwise, errors is false.

						app.u.dump('errors'); app.u.dump(errors);
						$paymentContainer.find('.mandatory').removeClass('mandatory'); //remove css from previously failed inputs to avoid confusion.
						

//the mandatory class gets added to the parent of the input, so that the input, label and more get styled.
						if(!formJSON.amt)	{
							var msgObj = app.u.errMsgObject("Please set an amount");
							msgObj.parentID = 'adminOrdersPaymentMethodsContainer';
							app.u.throwMessage(msgObj);
							$("[name='amt']",$paymentContainer).parent().addClass('mandatory');
							}
						else if(errors)	{
							var msgObj = app.u.errMsgObject("Some required field(s) are missing or invalid. (indicated in red)");
							msgObj.parentID = 'adminOrdersPaymentMethodsContainer';
							app.u.throwMessage(msgObj);
							for(var index in errors)	{
								$("[name='"+errors[index]+"']",$paymentContainer).parent().addClass('mandatory');
								}
							}
						else	{
							if(formJSON.tender == 'CREDIT')	{
								CMD = "ADDPROCESSPAYMENT";
//!!! update checkout to not look for payment/cc so this for loop can be removed. (getSupplementalPaymentInputs in controller). shared a lot.
//when you do this, the validate.CREDIT function needs to be updated too.
//the object used to create the suplementals is shared with checkout and it currently has the data as payment/cc et all.
//so that's stripped to just cc. 
								for(var index in formJSON)	{
//									app.u.dump(" -> index.substring(0,8): "+index.substring(0,7));
//									app.u.dump(" -> index.substr(8): "+index.substr(7));
									if(index.substring(0,8) == 'payment/')	{
										formJSON[index.substr(8)] = formJSON[index];
										delete formJSON[index]; //clean out invalid params
										}
									}
								}
							else if(formJSON.tender.substr(0,7) == 'WALLET:')	{
								CMD = "ADDPROCESSPAYMENT";
//								formJSON.PN = 'WALLET';
								formJSON.WI = formJSON.tender.split(':')[1]; //WI is what is after : in the wallet ID.
								}
							else if(formJSON.flagAsPaid && formJSON.flagAsPaid.toLowerCase() == 'on')	{
								CMD = "ADDPAIDPAYMENT";
								delete formJSON.flagAsPaid;
								}
							else	{CMD = "ADDPAYMENT"}
							var $parent = $btn.closest("[data-order-view-parent]"),
							orderID = $parent.data('order-view-parent');

							app.ext.admin.calls.adminOrderMacro.init(orderID,[CMD+"?"+decodeURIComponent($.param(formJSON))],{});
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

					var $parent = $btn.closest("[data-app-role='orderUpdateAddTrackingContainer']");
					$parent.showLoading({'message':'Updating order with tracking information'}); //run just on payment panel
					var kvp = $btn.parents('form').serialize();
					app.ext.admin.calls.adminOrderMacro.init($btn.data('orderid'),["ADDTRACKING?"+kvp],{},'immutable');
					app.model.destroy('adminOrderDetail|'+$btn.data('orderid')); //get a clean copy of the order.
					app.ext.admin.calls.adminOrderDetail.init($btn.data('orderid'),{
						'callback': function(rd){
if(app.model.responseHasErrors(rd)){
	app.u.throwMessage(rd);
	}
else	{
	$parent.empty(); //only empty on success so that form is not emptied on a fail.
	
	if(typeof jQuery().hideLoading == 'function'){$parent.hideLoading();}
	$parent.append(app.renderFunctions.transmogrify({},'orderTrackingTemplate',app.data[rd.datapointer]))
	app.ext.admin.u.handleAppEvents($parent);
	$(".gridTable tr:last",$parent).effect("highlight", {},3000); //make's it more obvious something happened.
	}
							},
						'extension':'admin',
						'selector':'#'+$parent.attr('id')
						},'immutable');
					app.model.dispatchThis('immutable');
					});
				}, //orderUpdateAddTracking


			
			

			inventoryDetailOptionsShow : function($ele)	{
				$ele.button({icons: {secondary: "ui-icon-triangle-1-s"},text: true});
				$ele.parent().find('menu').menu().css({'position':'absolute','width':'200px','z-index':'10000'}).hide()
				$ele.off('click.itemHandleRoutingExec').on('click.itemHandleRoutingExec',function(e){
					e.preventDefault();
					var $menu = $ele.parent().find('menu')
					$menu.show().position({
						my: "right top",
						at: "right bottom",
						of: this
						});
					//when this wasn't in a timeout, the 'click' on the button triggered. this. i know. wtf?  find a better solution. !!!
					setTimeout(function(){$(document).one( "click", function() {$menu.hide();});},1000);
					});
 
				},


			inventoryDetailOptionsExec : function($ele)	{
				$ele.off('click.itemHandleRoutingExec').on('click.itemHandleRoutingExec',function(e){
					e.preventDefault();
					var uuid = $ele.closest("[data-uuid]").data('uuid');
					var orderID = $ele.closest("[data-orderid]").data('orderid');
					/*
								<li data-basetype='DONE'>Done</li>
			<li data-pick_route='TBD'>TBD</li>
			<li data-basetype='PICK'>PICK</li>
			<li data-basetype='PICK_TBD'>PICK_TBD</li>
			*/
					if($ele.data('verb'))	{
						if(uuid && orderID)	{
							var cmd;
							if($ele.data('verb') == 'RESET')	{
								cmd = "ITEM-UUID-RESET?"
								}
							else	{
								cmd = "ITEM-UUID-DONE?"
								}
							cmd += "UUID="+uuid;
							app.u.dump(" -> CMD: "+cmd);
							app.u.dump(" -> orderID: "+orderID);
							app.ext.admin.calls.adminOrderMacro.init(orderID,[cmd],{});
							app.ext.admin_orders.a.showOrderView(orderID,app.data['adminOrderDetail|'+orderID].customer.cid,$ele.closest("[data-order-view-parent]").intervaledEmpty().attr('id'),'immutable');
							app.model.dispatchThis('immutable');
							}
						else	{
							$ele.closest('form').anymessage({"message":"In admin_orders.e.inventoryDetailOptionsExec, unable to ascertain the item uuid ["+uuid+"] and/or orderid ["+orderID+"]. Both are required.","gMessage":true});
							}
						}
					else	{
						$ele.closest('form').anymessage({"message":"In admin_orders.e.inventoryDetailOptionsExec, data-verb ["+$ele.data('verb')+"] not set on trigger element.","gMessage":true});
						}
					});
 
				},


			adminOrderMacroExec : function($ele,p)	{
				var orderID = $ele.closest("[data-orderid]").attr('data-orderid');
				if(orderID)	{
					app.model.addDispatchToQ({
						'_cmd':'adminOrderMacro',
						'orderid' : orderID,
						'@updates' : [$ele.attr('data-macro-cmd')],
						'_tag':	{
							'callback':function(rd){
	//this is used in orders > routes for inventory detail. test there if changes are made.
								if(app.model.responseHasErrors(rd)){
									$ele.parent().anymessage({'message':rd}); //tag is a button.
									}
								else	{
									$ele.parent().empty().anymessage(app.u.successMsgObject('Route assigned'));
									app.ext.admin_orders.a.showOrderView(orderID,'','ordersContent')
									}
								}
							}
						},'immutable');
					app.model.dispatchThis('immutable');
					}
				else	{
					$ele.parent().anymessage({"message":"In admin_orders.e.adminOrderMacroExec, unable to ascertain order ID.","gMessage":true});
					}
				},

			routingDialogShow : function($ele)	{
				$ele.button(); //{icons: {primary: "ui-icon-gear",secondary: "ui-icon-triangle-1-s"},text: true}
				$ele.off('click.itemHandleRoutingExec').on('click.itemHandleRoutingExec',function(e){
					e.preventDefault();
					var orderID = $ele.closest("[data-orderid]").data('orderid');
					var uuid = $ele.closest("[data-uuid]").data('uuid');
					if(orderID && uuid)	{
						
						var $D = app.ext.admin.i.dialogCreate({
							'title' : 'Routing options for '+uuid,
							'showLoading' : false
							});
						$D.append("<table data-orderid='"+orderID+"'><tbody data-bind='var: routes(@ROUTES); format:macros2Buttons; extension:admin; _cmd:adminOrderMacro;'></tbody></table>");
						$D.dialog('open');
						app.u.handleEventDelegation($D);
						app.model.addDispatchToQ({
							'_cmd':'adminOrderRouteList',
							'orderid' : orderID,
							'uuid' : uuid,
							'_tag':	{
								'datapointer' : 'adminOrderRouteList|'+orderID,
								'callback':'anycontent',
								'translateOnly' : true,
								'jqObj' : $D
								}
							},'mutable');
						app.model.dispatchThis('mutable');
						}
					else	{
						$('#globalMessaging').anymessage({"message":"In admin_orders.e.routingDialogShow, unable to ascertain the order id ["+orderID+"] and/or the uuid ["+uuid+"].","gMessage":true});
						}
					})
				
				}


			} //buttonActions
		
		} //r object.
	return r;
	}