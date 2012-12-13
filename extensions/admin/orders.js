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
	var theseTemplates = new Array('orderManagerTemplate','adminOrderLineItem','orderDetailsTemplate','orderStuffItemEditorTemplate','orderStuffItemTemplate','orderPaymentHistoryTemplate','orderEventHistoryTemplate','orderTrackingHistoryTemplate','orderAddressTemplate','buyerNotesTemplate');
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

//!!! this call should get nuked. appProfileInfo in the controller should be set up to support either an sdomain OR a profile ID.
//unfortunately, under the gun right now and that change involves updates to quickstart, which I don't have time for right this second.
		appProfileInfoBySdomain : {
			init : function(sdomain,tagObj,Q)	{
//				app.u.dump("BEGIN app.calls.appProfileInfo.init");
				var r = 0; //will return 1 if a request is needed. if zero is returned, all data needed was in local.
				tagObj = typeof tagObj == 'object' ? tagObj : {};
				tagObj.datapointer = 'appProfileInfo|'+sdomain; //for now, override datapointer for consistency's sake.

				if(app.model.fetchData(tagObj.datapointer) == false)	{
					r = 1;
					this.dispatch(sdomain,tagObj,Q);
					}
				else 	{
					app.u.handleCallback(tagObj)
					}

				return r;
				}, // init
			dispatch : function(sdomain,tagObj,Q)	{
				obj = {};
				obj['_cmd'] = "appProfileInfo";
				obj['sdomain'] = sdomain;
				obj['_tag'] = tagObj;
				app.model.addDispatchToQ(obj,Q);
				} // dispatch
			}, //appProfileInfoBySdomain

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
			}, //adminOrderUpdate

		adminOrderSearch : {
			init : function(elasticObj, tagObj, Q)	{
				this.dispatch(elasticObj,tagObj,Q);
				return 1;
				},
			dispatch : function(elasticObj,tagObj,Q){
				var obj = {};
				obj._cmd = "adminOrderSearch";
				obj.DETAIL = '9';
				obj.ELASTIC = elasticObj;
				obj._tag = tagObj || {};
				obj._tag.datapointer = "adminOrderSearch";
				app.model.addDispatchToQ(obj,'immutable');
				}
			},

//obj requires: cartid, countrycode and ordertotal
		appPaymentMethods : {
			init : function(obj,tagObj,Q)	{
				this.dispatch(obj,tagObj,Q);
				return 1;
				},
			dispatch : function(obj,tagObj,Q)	{
				obj = obj || {};
				obj._cmd = "appPaymentMethods";
				obj._tag = tagObj || {};
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
//This executes the handleButtonActions in addition to the normal translation.
//the selector also gets run through jqSelector
		translateSelector : {
			onSuccess : function(tagObj)	{
				app.u.dump("BEGIN callbacks.translateSelector");
				var selector = app.u.jqSelector(tagObj.selector[0],tagObj.selector.substring(1)); //this val is needed in string form for translateSelector.
//				app.u.dump(" -> selector: "+selector);
				var $target = $(selector)
				if(typeof jQuery().hideLoading == 'function'){$target.hideLoading();}
				app.renderFunctions.translateSelector(selector,app.data[tagObj.datapointer]);
				app.ext.admin_orders.u.handleButtonActions($target);
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
				}	
			}, //handleBulkUpdate

		listOrders : {
			onSuccess : function(tagObj)	{

//app.u.dump('BEGIN admin_orders.callbacks.listOrders.onSuccess');
//app.u.dump(' -> tagObj: '); app.u.dump(tagObj);

var $target = $('#orderListTableBody'); //a table in the orderManagerTemplate
$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).hideLoading();

var orderid,cid;
var ordersData = app.data[tagObj.datapointer]['@orders'];

var L = ordersData.length;
var $cmenu; //recyled. stors the context menu for an order.

if(L)	{
	app.u.dump(" -> ordersData.length (L): "+L);
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
		
		$("<command \/>").attr('label','Payment status').on('click',function(){navigateTo('/biz/orders/payment.cgi?ID='+orderid+'&ts=',{'dialog':true}); return false;}).appendTo($cmenu);
		$("<command \/>").attr('label','Edit contents').on('click',function(){navigateTo('/biz/orders/edit.cgi?CMD=EDIT&OID='+orderid+'&ts=',{'dialog':true}); return false;}).appendTo($cmenu);
		$("<command \/>").attr('label','Create crm ticket').on('click',function(){navigateTo('/biz/crm/index.cgi?VERB=CREATE&orderid='+orderid,{'dialog':true}); return false;}).appendTo($cmenu);
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
		app.ext.admin_orders.u.handleButtonActions($row);
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
				$target.empty().append(app.renderFunctions.createTemplateInstance('orderManagerTemplate',{'id':'OM_'+P.targetID}));


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
				app.ext.admin_orders.u.handleButtonActions($target);
				}
			else	{
				app.u.throwGMessge("WARNING! - pool ["+P.pool+"] and/or targetID ["+P.targetID+"] not passed into initOrderManager");
				}
			}, //initOrderManager

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
		$ordersModal.empty().dialog('open');
		//create an instance of the invoice display so something is in front of the user quickly.
		$ordersModal.append(app.renderFunctions.createTemplateInstance('orderDetailsTemplate',{'id':safeID,'orderid':orderID}));
		
		$ordersModal.showLoading();
		
		//go fetch order data. callback handles data population.
		app.ext.admin_orders.calls.adminOrderDetail.init(orderID,{'callback':function(tagObj){
//!!! add error handling here.
			var selector = app.u.jqSelector(tagObj.selector[0],tagObj.selector.substring(1)); //this val is needed in string form for translateSelector.
			var $target = $(selector);
			var orderData = app.data[tagObj.datapointer]
			$target.hideLoading();
			app.renderFunctions.translateSelector(selector,orderData);
			
//			app.ext.admin_orders.calls.appPaymentMethods.init({'cartid':orderData.cart.cartid,'ordertotal':orderData.sum.order_total,'countrycode':orderData.ship.countrycode || orderData.bill.countrycode},{'callback':'translateSelector','extension':'admin_orders','selector':'#adminOrdersPaymentMethodsContainer'},'immutable');
//			app.model.dispatchThis('immutable');
			
			app.ext.admin_orders.u.handleButtonActions($target);
//trigger the editable regions
			app.ext.admin_orders.u.makeEditable(selector+' .billAddress',{});
			app.ext.admin_orders.u.makeEditable(selector+' .shipAddress',{});
			app.ext.admin_orders.u.makeEditable(selector+" [data-ui-role='orderUpdateNotesContainer']",{'inputType':'textarea'});
			},'extension':'admin_orders','selector':'#'+safeID});
		
		if(CID)	{
			app.ext.admin.calls.customer.adminCustomerGet.init(CID,{'callback':'translateSelector','extension':'admin_orders','selector':'#customerInformation'},'mutable'); //
			}
		else	{
			app.u.dump("WARNING! - no CID set.");
			}
		//dispatch occurs outside this function.
		$('.orderSupplementalInformation',$ordersModal).accordion({
			collapsible: true,
			heightStyle: "content"
			});
		app.ext.admin_orders.u.handleButtonActions($ordersModal);
		}
	}
else	{
	app.u.throwGMessage("WARNING! - no orderID passed into admin_orders.u.orderDetailsInDialog.");
	}
			}, //orderDetailsInDialog



//shows a list of orders by pool.
		showOrderList : function(filterObj)	{
			if(!$.isEmptyObject(filterObj))	{
				$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).showLoading();
			//create instance of the template. currently, there's no data to populate.
				filterObj.DETAIL = 9;
				app.ext.admin_orders.calls.adminOrderList.init(filterObj,{'callback':'listOrders','extension':'admin_orders','templateID':'adminOrderLineItem'});
				app.model.dispatchThis();
				}
			else	{
				app.u.throwGMessage("Warning! no filter object passed into admin_orders.calls.showOrderList."); app.u.dump(filterObj);
				}
	
			} //showOrderList
		
		
		
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
		}, //renderFormats



////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
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
					app.ext.admin_orders.calls.adminOrderUpdate.init(orderID,["EMAIL?msg="+msgID],{'callback':'handleSendEmail','extension':'admin_orders','targetID':$row.attr('id')});
					}
				else	{
					app.u.throwGMessage("In admin_orders.u.sendOrderMail, either orderID ["+orderArray.length+"] or msgID["+msgID+"] are not set.");
					}
				},

			bulkSendOrderMail : function()	{
				var $orders = $('.ui-selected','#orderListTableBody');
				var msgID = "OCREATE";
				$orders.each(function(){
					app.ext.admin_orders.u.sendOrderMail($(this).data('orderid'),msgID)
					});
				app.model.dispatchThis('passive');
				},

//currently, this requires that the order_create extension has been added.
//This groups all the invoices into 1 div and adds pagebreaks via css.
//for this reason, the individual print functions for invoice/packslip are not recycled
			bulkOrdersPrint : function(templateID,orderArray)	{
				var $orders = $('.ui-selected','#orderListTableBody'),
				CMD = $('#CMD').val(), //type of printing to do (invoice or packslip)
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
						
						app.calls.appProfileInfo.init('DEFAULT',{},'immutable'); //have this handy for any orders with no sdomain.
						
						$orders.each(function(){
							var $order = $(this);
							var sdomain = $order.data('sdomain');
							if(sdomain && sDomains[sdomain])	{} //dispatch already queued.
							else if(sdomain)	{
								sDomains[sdomain] = true; //add to array so that each sdomain is only requested once.
								app.ext.admin_orders.calls.appProfileInfoBySdomain.init(sdomain,{},'immutable');
								}
							else	{
								sdomain = "DEFAULT"; //use default profile if no sdomain is available.
								}
							app.ext.admin_orders.calls.adminOrderDetail.init($order.data('orderid'),{'callback':'mergeDataForBulkPrint','extension':'admin_orders','templateID':templateID,'merge':'appProfileInfo|'+sdomain},'immutable');
							})
						app.calls.ping.init({'callback':function(){
							$('body').hideLoading();
//							$('#printContainer').show(); //here for troubleshooting.
							app.u.printByElementID('printContainer');
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
					app.ext.admin_orders.calls.adminOrderUpdate.init($row.attr('data-orderid'),['SETPOOL?pool='+pool],{"callback":"orderPoolChanged","extension":"admin_orders","targetID":$row.attr('id')}); //the request will return a 1.
					}
				else	{app.u.throwGMessage("In admin_orders.u.changeOrderPool, either $row.length ["+$row.length+"] is empty or pool ["+pool+"] is blank")}
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
					if(numEdits > 0)	{$dialog.find("[data-btn-action='admin_orders|orderUpdateSave']").prop('disabled',false).addClass('ui-state-highlight')}
					else	{$dialog.find("[data-btn-action='admin_orders|orderUpdateSave']").prop('disabled','disabled').removeClass('ui-state-highlight')}
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



				},

			
			
			handleButtonActions : function($target)	{
//				app.u.dump("BEGIN admin_orders.u.handleButtonActions");
				if($target && $target.length && typeof($target) == 'object')	{
					$("button",$target).each(function(){
						var $btn = $(this);
						var action = $btn.data('btn-action');
						if(!action){} //no action specified. do nothing. button may have it's own event actions specified inline.
						else if(typeof app.ext.admin_orders.buttonActions[action] == 'function')	{
//if an action is declared, every button gets the jquery UI button classes assigned. That'll keep it consistent.
//if the button doesn't need it (there better be a good reason), remove the classes in that button action.
							$btn.button();
							app.ext.admin_orders.buttonActions[action]($btn); //execute button action.
							}
						else	{
							app.u.throwGMessage("Unsupported action ["+action+"] on button in admin_orders.u.handleButtonActions");
							}
						})
					}
				else	{
					app.u.throwGMessage("In admin_orders.u.handleButtonActions, target was either not specified, not an object ["+typeof $target+"] or does not exist ["+$target.length+"] on DOM.");
					}
				
				} //handleButtonActions
			}, //u

		buttonActions : {
			"admin_orders|orderListFiltersUpdate" : function($btn){
//				$btn.addClass('ui-state-highlight');
				$btn.off('click.orderListUpdateFilters').on('click.orderListUpdateFilters',function(event){
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
				}, //admin_orders|applyOrderFilters
				
			"admin_orders|orderListUpdateBulk" : function($btn)	{
				$btn.off('click.orderListUpdateBulk').on('click.orderListUpdateBulk',function(event){
					event.preventDefault();
					var command = $('#CMD').val().substring(0,4); //will = POOL or MAIL or PMNT or PRNT
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
							app.ext.admin_orders.u.bulkSendOrderMail();
							break;
							
							case 'PRNT':
							app.ext.admin_orders.u.bulkOrdersPrint();
							break;
							
							default:
								app.u.throwMessage("Unknown action selected ["+command+"]. Please try again. If error persists, please contact technical support.");
							}
						}
					});
				}, //admin_orders|orderListUpdateBulk

			"admin_orders|orderCreate" : function($btn)	{
				$btn.off('click.orderCreate').on('click.orderCreate',function(){navigateTo('#!orderCreate')});
				}, //admin_orders|orderCreate

			"admin_orders|orderUpdateCancel" : function($btn)	{
				$btn.off('click.orderUpdateCancel').on('click.orderUpdateCancel',function(){$btn.closest('.ui-dialog-content').dialog('close')}); //the dialog-contentis the div the modal is executed on.
				}, //admin_orders|orderUpdateCancel **TODO
				
			"admin_orders|orderListUpdateDeselectAll" : function($btn)	{
				$btn.off('click.orderUpdateCancel').on('click.orderUpdateCancel',function(event){
					event.preventDefault();
//if an item is being updated, this will still 'select' it, but will not change the wait icon.
					$('#orderListTableBody tr').each(function() {
						$(this).removeClass("ui-selected").addClass("ui-unselecting");
						});
					$('#orderListTableBody').data("selectable")._mouseStop(null); // trigger the mouse stop event 
					});
				}, //admin_orders|orderListUpdateDeselectAll

			"admin_orders|orderExport" : function($btn)	{
				$btn.off('click.orderExport').on('click.orderExport',function(){alert('not done yet')});
				}, //admin_orders|orderExport **TODO

			"admin_orders|orderPrintInvoice" : function($btn){
				$btn.off('click.orderPrintInvoice').on('click.orderPrintInvoice',function(event){
					event.preventDefault();
					var orderID = $btn.data('orderid') || $btn.closest('[data-orderid]').data('orderid');
					if(orderID)	{
						app.ext.convertSessionToOrder.a.printOrder(orderID,{data:{'type':'invoice','profile':app.data['adminOrderDetail|'+orderID].our.profile}});
						}
					else	{
						app.u.throwGMessage("In admin_orders.buttonActions.admin_orders|orderPrintInvoice, unable to print because order id could not be determined.");
						}
					});
				}, //admin_orders|orderPrintInvoice **TODO

			"admin_orders|orderPrintPackSlip" : function($btn){
				$btn.off('click.orderPrintPackSlip').on('click.orderPrintPackSlip',function(event){
					event.preventDefault();
					var orderID = $btn.data('orderid') || $btn.closest('[data-orderid]').data('orderid');
					if(orderID)	{
						app.ext.convertSessionToOrder.a.printOrder(orderID,{data:{'type':'invoice','profile':app.data['adminOrderDetail|'+orderID].our.profile}});
						}
					else	{
						app.u.throwGMessage("In admin_orders.buttonActions.admin_orders|orderPrintPackSlip, unable to print because order id could not be determined.");
						}
					});
				}, //admin_orders|orderPrintPackSlip  **TODO

			"admin_orders|orderEmailSend" : function($btn){
				$btn.off('click.orderEmailSend').on('click.orderEmailSend',function(event){event.preventDefault(); alert('not working yet');});
				}, //admin_orders|saveCustomerNotes **TODO




			"admin_orders|customerNoteAdd" : function($btn){
				$btn.off('click.customerNoteAdd').on('click.customerNoteAdd',function(event){
					event.preventDefault();
					alert('not working yet');
					});
				}, //admin_orders|customerUpdateNotes **TODO

			"admin_orders|orderTicketCreate" : function($btn)	{
				$btn.off('click.customerUpdateNotes').on('click.customerUpdateNotes',function(event){
					event.preventDefault();
					var orderID = $btn.data('orderid') || $btn.closest('[data-orderid]').data('orderid');
					if(orderID)	{
						navigateTo("/biz/crm/index.cgi?VERB=CREATE&orderid="+orderID);
						$btn.closest('.ui-dialog-content').dialog('close'); //close the modal.
						}
					else	{
						app.u.throwGMessage("In admin_orders.buttonActions.admin_orders|orderTicketCreate, unable to navigate to because order id could not be determined.");
						}
					});
				},

			"admin_orders|orderListUpdateSelectAll" : function($btn)	{
				$btn.off('click.orderListUpdateSelectAll').on('click.orderListUpdateSelectAll',function(event){
					event.preventDefault();
//if an item is being updated, this will still 'select' it, but will not change the wait icon.
					$('#orderListTableBody tr').each(function() {
						$(this).addClass("ui-selected").removeClass("ui-unselecting");
						});
					$('#orderListTableBody').data("selectable")._mouseStop(null); // trigger the mouse stop event 
					});
				}, //admin_orders|orderListUpdateSelectAll

			"admin_orders|orderSearch" : function($btn)	{
				$btn.off('click.orderSearch').on('click.orderSearch',function(event){
					event.preventDefault();
					var frmObj = $btn.closest('form').serializeJSON();
					if(frmObj.keyword)	{
//						app.ext.admin.calls.adminPrivateSearch.init({'size':20,'type':['order',frmObj.type],'query':{'query_string':{'query':frmObj.keyword}}},{'callback':'listOrders','extension':'admin_orders'},'immutable');
						$('#orderListTableBody').empty();
						$('.noOrdersMessage','#orderListTableContainer').empty().remove(); //get rid of any existing no orders messages.
						$(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).showLoading();
app.ext.admin_orders.calls.adminOrderSearch.init({'size':Number(frmObj.size) || 30,'filter' : {
	'or' : [
	{'has_child' : {'query' : {'query_string' : {'query' : frmObj.keyword,'default_operator':'AND'}},'type' : ['order/address']}},
	{'has_child' : {'query' : {'query_string' : {'query' : frmObj.keyword,'default_operator':'AND'}},'type' : ['order/payment']}},
	{'has_child' : {'query' : {'query_string' : {'query' : frmObj.keyword,'default_operator':'AND'}},'type' : ['order/shipment']}},
	{'has_child' : {'query' : {'query_string' : {'query' : frmObj.keyword,'default_operator':'AND'}},'type' : ['order/item']}},
	{'query' : {'query_string' : {'query' : frmObj.keyword,'default_operator':'AND'}}}
	]},'type' : ['order'],'explain' : 1},{'callback':'listOrders','extension':'admin_orders','templateID':'adminOrderLineItem'},'immutable');

						app.model.dispatchThis('immutable');
						}
					else	{
						app.u.throwGMessage("in admin_orders.buttonActions.admin_orders|orderSearch, keyword ["+frmObj.keyword+"] not specified.");
						}

					});
				}, //admin_orders|orderListUpdateSelectAll


			"admin_orders|orderUpdateSave" : function($btn){
				$btn.off('click.orderUpdateSave').on('click.orderUpdateSave',function(event){
					event.preventDefault();

					var orderID = $btn.data('orderid') || $btn.closest('[data-orderid]').data('orderid');
					if(orderID)	{
						var $target = $(app.u.jqSelector('#','viewOrderDialog_'+orderID));
						$target.showLoading();
						

//the changes are all maintained on one array and pushed onto 1 request (not 1 pipe, but one adminOrderUpdate _cmd).
						var changeArray = new Array();

//poolSelect is the dropdown for changing the pool.
						var $poolSelect = $("[data-ui-role='admin_orders|orderUpdatePool']",$target);
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

//#### NOTE-> because orderDetailsInDialog contains the request/dispatch, this is a two step process. Change orderDetails in dialog so that it just opens/shows and 
//handle the request of the data outside that function. Rookie Mistake. !!!
						app.ext.admin_orders.calls.adminOrderUpdate.init(orderID,changeArray,{'callback':function(){
							$target.empty();
							$target.hideLoading();
							app.ext.admin_orders.a.orderDetailsInDialog(orderID,app.data['adminOrderDetail|'+orderID].customer.cid);
							app.model.dispatchThis();
							}},'immutable');

						app.model.dispatchThis('immutable');
						}
					else	{
						app.u.throwGMessage("In admin_orders.buttonActions.admin_orders|orderPrintInvoice, unable to print because order id could not be determined.");
						}
					});
				}, //admin_orders|orderUpdateSave **TODO

			"admin_orders|orderUpdateAddTracking" : function($btn){
				$btn.off('click.orderUpdateAddTracking').on('click.orderUpdateAddTracking',function(event){
					event.preventDefault();

					var $parent = $btn.closest("[data-ui-role='orderUpdateAddTrackingContainer']");
					$parent.showLoading();
					var kvp = $btn.parents('form').serialize();
					//The two lines below 'should' work. not tested yet.
					app.ext.admin_orders.calls.adminOrderUpdate.init($btn.data('orderid'),["ADDTRACKING?"+kvp],{},'immutable');
					app.ext.admin_orders.calls.adminOrderDetail.init($btn.data('orderid'),{'callback':'translateSelector','extension':'admin_orders','selector':'#'+$parent.attr('id')},'immutable');
					app.model.dispatchThis('immutable');
					});
				}, //admin_orders|orderUpdateAddTracking **TODO

			"admin_orders|orderUpdateShowEditor" : function($btn){
				if(app.u.getParameterByName('debug'))	{
					$btn.off('click.orderUpdateShowEditor').on('click.orderUpdateShowEditor',function(event){
						event.preventDefault();
						app.u.dump("show order editor");
						var orderID = $(this).attr('data-orderid');
						var CID = $(this).closest('tr').attr('data-cid');
						app.ext.admin_orders.a.orderDetailsInDialog(orderID,CID);
						app.model.dispatchThis();
						})
					}
				else	{
					$btn.off('click.orderUpdateShowEditor').on('click.orderUpdateShowEditor',function(){navigateTo('/biz/orders/view.cgi?OID='+$(this).data('orderid'));});
					}
				} //admin_orders|orderUpdateShowEditor

			} //buttonActions
		
		} //r object.
	return r;
	}