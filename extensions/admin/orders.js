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
		"pools" : ['RECENT','PENDING','REVIEW','HOLD','APPROVED','PROCESS','COMPLETED','CANCELLED'],
		"payStatus" : ['Paid','Pending','Denied','Cancelled','Review','Processing','Voided','Error','unknown'], //the order here is VERY important. matches the first char in paystatus code.
		"markets" : {
			'ebay' : 'eBay',
			'amazon' : 'Amazon'
			}
		},
	calls : {
//never get from local or memory.
//formerly getOrders
		adminOrderList : {
			init : function(obj,tagObj,Q)	{
				app.u.dump("BEGIN admin_orders.calls.adminOrderList.init");
				tagObj = tagObj || {};
				tagObj.datapointer = "adminOrderList";
				if(app.model.fetchData(tagObj.datapointer) == false)	{
					r = 1;
					this.dispatch(obj,tagObj,Q);
					}
				else	{
					app.u.handleCallback(tagObj);
					}
				return 1;
				},
			dispatch : function(obj,tagObj,Q)	{
				obj['_tag'] = tagObj;
				obj["_cmd"] = "adminOrderList"
				app.model.addDispatchToQ(obj,Q);
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
//				app.u.dump("BEGIN admin_orders.calls.adminOrderUpdate.dispatch");
//				app.u.dump(" -> orderID = "+orderID);
				cmdObj = {};
				cmdObj['_cmd'] = 'adminOrderUpdate';
				cmdObj.orderid = orderID;
				cmdObj['@updates'] = updates;
				tagObj = typeof tagObj !== 'object' ? {} : tagObj;
				cmdObj['_tag'] = tagObj;
				app.model.addDispatchToQ(cmdObj,'immutable');
				}
			} //adminOrderUpdate
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

//executed per order lineitem on a flagOrderAsPaid update.
		orderFlagAsPaid : {
			onSuccess : function(tagObj)	{
				$(app.u.jqSelector('#',tagObj.targetID)).find('td:eq('+app.ext.admin_orders.u.getTableColIndexByDataName('ORDER_PAYMENT_STATUS')+')').text('Paid');
				var $td = $(app.u.jqSelector('#',tagObj.targetID)).find('td:eq(0)')
//restore selected icon IF row is still selected.
				if($td.parent().hasClass('ui-selected')){$td.html("<span class='ui-icon ui-icon-circle-check'></span>")}
				else	{$td.html("")}
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
				if(numErrors + numQd > 0)	{
					//errors have been reported, if that's the case. Or the merchant has selected more items already and they'll need to move them.
//					$('#orderListTable').flexReload(); //update table. makes sure rotating bg colors are right. !!! doesn't work.
					}
				else	{
//okay. everything went fine... now what???
					}
				}	
			}, //handleBulkUpdate

		listOrders : {
			onSuccess : function(tagObj)	{

//app.u.dump('BEGIN admin_orders.callbacks.listOrders.onSuccess');
var $target = $('#orderListTableBody'); //a table in the orderManagerTemplate

var orderid,cid;
var L = app.data[tagObj.datapointer]['@orders'].length;
var $cmenu; //recyled. stors the context menu for an order.

if(L)	{
	for(var i = 0; i < L; i += 1)	{
		orderid = app.data[tagObj.datapointer]['@orders'][i].ORDERID; //used for fetching order record.
		cid = app.data[tagObj.datapointer]['@orders'][i].CUSTOMER; //used for sending adminCustomerGet call.
		$target.append(app.renderFunctions.transmogrify({"id":"order_"+orderid,"orderid":orderid,"cid":cid},tagObj.templateID,app.data[tagObj.datapointer]['@orders'][i]))
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
		
		$("<command \/>").attr('label','Payment status').on('click',function(){showUI('/biz/orders/payment.cgi?ID='+orderid+'&ts=',{'dialog':true}); return false;}).appendTo($cmenu);
		$("<command \/>").attr('label','Edit contents').on('click',function(){showUI('/biz/orders/edit.cgi?CMD=EDIT&OID='+orderid+'&ts=',{'dialog':true}); return false;}).appendTo($cmenu);
		$("<command \/>").attr('label','Create crm ticket').on('click',function(){showUI('/biz/crm/index.cgi?VERB=CREATE&orderid='+orderid+'&email=&phone=',{'dialog':true}); return false;}).appendTo($cmenu);
		$("<hr \/>").appendTo($cmenu);
		
		var $poolMenu = $("<menu label='Change status to: '>");
		for(var i = 0; i < app.ext.admin_orders.vars.pools.length; i += 1)	{
			$("<command \/>").attr('label',app.ext.admin_orders.vars.pools[i]).on('click',function(){
				app.ext.admin_orders.u.changeOrderPool($row,app.ext.admin_orders.vars.pools[i],statusColID);
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
//	app.ext.admin_orders.a.deselectAllOrders(); //after applying a filter, make sure all rows are unselected.
	
	
	}
else	{
	$('#orderListTableContainer').append("<div class='noOrdersMessage'>There are no orders that match the current filter criteria.<\/div>");
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
//this can be removed once this is deployed in full release instead of beta. !!!
app.ext.admin.u.bringTabIntoFocus('orders2');

			var oldFilters = app.ext.admin.u.devicePreferencesGet('admin_orders');
			if(P.filters){} //used filters that are passed in.
			else if(oldFilters != undefined)	{
				P.filters = oldFilters.managerFilters || {};
				}
			else{P.filters = {}}

//if no filters are passed in and no 'last filter' is present, set some defaults.
			if($.isEmptyObject(P.filters))	{
				P.filters.POOL = 'RECENT';
				}
			else{}

			if(P.filters && P.targetID)	{
//adds the order manager itself to the dom.
// passes in a new ID so that multiple instances of the ordermanager can be open (not supported yet. may never be supported or needed.)
				$(app.u.jqSelector('#',P.targetID)).empty().append(app.renderFunctions.createTemplateInstance('orderManagerTemplate',{'id':'OM_'+P.targetID}));
				
				if(P.filters.LIMIT)	{$('#filterLimit').val(P.filters.LIMIT)}
				
//Make the list of filters selectable. (status, type, marketplace, etc)				
//since only 1 option per UL is selectable, selectable() was avoided.
				$(".filterGroup").children().each(function(){
//if the filter is already selected as part of P.filters, tag as selected.
					if($(this).data('filtervalue') == P.filters[$(this).parent().data('filter')]){
						$(this).addClass('ui-selected');
						}
					else	{}
					$(this).addClass('pointer').click(function() {
						var $this = $(this);
						if($this.hasClass('ui-selected'))	{$this.removeClass('ui-selected')}
						else	{$this.addClass("ui-selected").siblings().removeClass("ui-selected")}
						})
					});
//go get the list of orders.
				app.ext.admin_orders.a.showOrderList(P.filters);

//assigns all the button click events.
				app.ext.admin_orders.u.bindOrderListButtons(P.targetID);
				}
			else	{
				app.u.throwGMessge("WARNING! - pool ["+P.pool+"] and/or targetID ["+P.targetID+"] not passed into initOrderManager");
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
//app.u.dump("BEGIN extensions.admin_orders.a.orderDetailsInDialog");
//app.u.dump(" -> CID : "+CID);
//app.u.dump(" -> orderID : "+orderID);
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
	app.u.throwGMessage("WARNING! - no orderID passed into admin_orders.u.orderDetailsInDialog.");
	}
			}, //orderDetailsInDialog
		
	
		applyFilters : function()	{
			$('#orderListTableBody').empty(); //this is targeting the table body.
			$('.noOrdersMessage','#orderListTableContainer').empty().remove(); //get rid of any existing no orders messages.
			$('#orderListTableContainer').addClass('loadingBG'); //this is the container. tbody won't show the loading gfx.
			var obj = {}
			obj.LIMIT = Number($('#filterLimit').val()) || 30;
			$('#orderFilters ul').each(function(){
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
			}, //applyFilters

//shows a list of orders by pool.
		showOrderList : function(filterObj)	{
			if(!$.isEmptyObject(filterObj))	{
			//create instance of the template. currently, there's no data to populate.
				filterObj.DETAIL = 9;
				app.ext.admin_orders.calls.adminOrderList.init(filterObj,{'callback':'listOrders','extension':'admin_orders','templateID':'adminOrderLineItem'});
				app.model.dispatchThis();
				}
			else	{
				app.u.throwGMessage("Warning! no filter object passed into admin_orders.calls.showOrderList."); app.u.dump(filterObj);
				}
	
			}, //showOrderList
			
			
		bulkCMDOrders : function()	{
			var command = $('#CMD').val().substring(0,4); //will = POOL or MAIL or PMNT
			if(!command)	{
				app.u.throwMessage('Please select an action to perform');
				}
			else	{
				switch(command)	{
					case 'POOL':
					app.ext.admin_orders.u.bulkChangeOrderPool();
					app.model.dispatchThis('immutable');
					break;
					
					case 'PMNT':
					app.ext.admin_orders.u.bulkFlagOrdersAsPaid();
					app.model.dispatchThis('immutable');
					break;
					
					case 'MAIL':
					app.ext.admin_orders.u.bulkSendEmail();
					break;
					
					default:
						app.u.throwMessage("Unknown action selected ["+command+"]. Please try again. If error persists, please contact technical support.");
					}
				}
			}, //bulkCMDOrders
		

		selectAllOrders : function()	{
//if an item is being updated, this will still 'select' it, but will not change the wait icon.
			$('#orderListTableBody tr').each(function() {
				$(this).addClass("ui-selected").removeClass("ui-unselecting");
				});
			$('#orderListTableBody').data("selectable")._mouseStop(null); // trigger the mouse stop event 
			},
			
		deselectAllOrders : function()	{
//if an item is being updated, this will still 'unselect' it, but will not change the wait icon.
//			$('#orderListTableBody tr').each(function(){$(this).removeClass('ui-selected')});
			$('#orderListTableBody tr').each(function() {
				$(this).removeClass("ui-selected").addClass("ui-unselecting");
				});
			$('#orderListTableBody').data("selectable")._mouseStop(null); // trigger the mouse stop event 
			},


/*

required params for P:
P.orderID = the orderID to edit. the order should already be in memory.
P.templateID = the lineitem template to be used. ex: orderStuffItemEditorTemplate
*/
			editOrderContents : function(P)	{
				var $r; //what is returned.
				if(P && P.orderID)	{
					var $r = $(); //empty jquery object. line-items are appended to this and then it's all returned.
					var orderObj = app.data['adminOrderDetail|'+P.orderID].order;
					var L = orderObj['@ITEMS'].length;
					var stid;
					for(var i = 0; i < L; i += 1)	{
						stid = P.templateID,orderObj['@ITEMS'][i].stid
						$r.append(app.u.transmogrify({'id':stid,'data-stid':stid},P.templateID,orderObj['@ITEMS'][i]));
						}
					}
				else	{
					app.u.throwGMessage("admin_orders.a.editOrderContents did not receive required param orderID or params were blank.<br />DEV: see console for details.");
					app.u.dump("ERROR! admin_orders.a.editOrderContents requires P.orderID: "); app.u.dump(P);
					r = false
					}
					return $r;
				} //editOrderContents
		
		},

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	renderFormats : {

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
			}, //customerNote
		
		reviewStatus : function($tag,data)	{
			var c = data.value[0]; //first character is a good indicator of the status.
/*
#Approved  AXX   (Green)
#Review  RXX   (Yellow)
#Escalated EXX   (Orange)
#Declined  DXX   (Red)
#Unknown   ''    (white/Not Set)
*/
			if(c == 'A')	{$tag.text('A').addClass('green')}
			else if(c == 'R')	{$tag.text('R').addClass('yellow')}
			else if(c == 'A')	{$tag.text('E').addClass('orange')}
			else if(c == 'A')	{$tag.text('D').addClass('red')}
			else if(c == '')	{} //supported, but no action/output.
			else	{
				app.u.dump("WARNING! unsupported key character in review status for admin.orders.renderFormats.reviewstatus");
				}
			}, //reviewStatus
		
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
			$tag.text(pretty).attr('title',data.value); //used in order list, so don't force any pre/posttext.
			return true;
			} //paystatus
		},
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
//when an indivdual row needs to be unselected, execute this.
//don't recycle this in the unselect all action, don't want the mouseStop triggered for each row.
// app.ext.admin_orders.u.unSelectRow()
			unSelectRow : function($row){
				$row.removeClass("ui-selected").addClass("ui-unselecting");
				$('#orderListTableBody').data("selectable")._mouseStop(null); // trigger the mouse stop event 
				},

//run this to change the pool for a specific order.
//this gets run over each order selected in the bulk function below. (do not add a showLoading or a dispatchThis to this function.
// -> when executing this function, run showloading and dispatch on your own.
			changeOrderPool : function($row,pool,statusColID){
				$row.attr('data-status','queued');  //data-status is used to record current status of row manipulation (queued, error, complete)
				$('td:eq('+statusColID+')',$row).empty().append("<span class='wait'><\/span>");
				
				app.ext.admin_orders.calls.adminOrderUpdate.init($row.attr('data-orderid'),['SETPOOL?pool='+pool],{"callback":"orderPoolChanged","extension":"admin_orders","targetID":$row.attr('id')}); //the request will return a 1.
				}, //changeOrderPool

//Run the dispatch on your own.  That way a bulkChangeOrderPool can be run at the same time as other requests.
			bulkChangeOrderPool : function(){
				var $selectedRows = $('#orderListTable tr.ui-selected');
				var statusColID = app.ext.admin_orders.u.getTableColIndexByDataName('ORDER_PAYMENT_STATUS');
				
				if($selectedRows.length)	{
					var pool = $('#CMD').val().substr(5);
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

						app.ext.admin_orders.calls.adminOrderUpdate.init($row.attr('data-orderid'),['FLAGASPAID'],{"callback":"orderFlagAsPaid","extension":"admin_orders","targetID":$row.attr('id')}); 
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
				$(app.u.jqSelector('#',targetID)+' [data-orderaction]').each(function(){
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