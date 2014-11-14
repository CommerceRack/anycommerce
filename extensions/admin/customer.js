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

This extension includes the code for the following features:

CRM
CustomerManager
Giftcards

************************************************************** */





var admin_customer = function(_app) {
	var theseTemplates = new Array(
	'customerManagerResultsRowTemplate',
	'CustomerPageTemplate',
	'customerEditorTemplate',
	'customerEditorTicketListTemplate',
	'customerEditorGiftcardListTemplate',
	'customerEditorWalletListTemplate',
	'customerEditorAddressListTemplate',
	'customerEditorNoteListTemplate',
	'customerAddressAddUpdateTemplate',
	'customerEditorOrderListTemplate',
	'customerWalletAddTemplate',
	'customerCreateTemplate',
	'organizationManagerChooserRowTemplate',
	
	'crmManagerControls', //called in DMICreate in CRM directly from templates.
	'crmManagerResultsRowTemplate',
	'crmManagerTicketDetailTemplate',
	'crmManagerTicketCreateTemplate',
	'crmManagerTicketMsgRowTemplate',
	
	'pickerSubscriberListsRowTemplate'
	
	);
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				// _app.model.fetchNLoadTemplates(_app.vars.baseURL+'extensions/admin/customer.html',theseTemplates);
//				_app.rq.push(['css',0,_app.vars.baseURL+'extensions/admin/customer.css','user_styles']);

				var $modal = $("<div \/>",{'id':'customerUpdateModal'}).appendTo('body'); //used for various update/add features.
				$modal.dialog({'autoOpen':false,'width':500,'height':500,'modal':true});
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				_app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
//This is how the customer manager is opened. Just execute this function.
// later, we may add the ability to load directly into 'edit' mode and open a specific customer. not supported just yet.
			showCustomerManager : function($target,vars) {
				vars = vars || {};
				$target.intervaledEmpty();
				$target.anycontent({'templateID':'CustomerPageTemplate','showLoading':false}); //clear contents and add help interface
				
				_app.u.handleCommonPlugins($target);
				_app.u.handleButtons($target);
				_app.u.addEventDelegation($target.anyform());
				//must be after anyform or the 'trigger' won't do much.
				if(vars.scope && vars.searchfor)	{
					$("[name='scope']",$target).val(vars.scope);
					$("[name='searchfor']",$target).val(vars.searchfor);
					$("button[data-app-role='customerSearchButton']:first",$target).trigger('click');
					}
				}, //showCustomerManager

//in obj, currently only CID and partition are required.
			showCustomerEditor : function($custEditorTarget,obj)	{
				obj = obj || {};
				if($custEditorTarget && $custEditorTarget instanceof jQuery)	{
					$custEditorTarget.empty();
// zero will be set as CID for orders w/out a CID. disallow it as a valid value.
					if(Number(obj.CID) > 0)	{
						$custEditorTarget.showLoading({"message":"Fetching Customer Record"});
//partition allows for editor to be linked from orders, where order/customer in focus may be on a different partition.
						_app.ext.admin.calls.adminNewsletterList.init({},'mutable');
// always obtain a new copy of the customer record. May have been updated by another process.
						_app.model.destroy("adminCustomerDetail|"+obj.CID);
						_app.ext.admin.calls.adminCustomerDetail.init({'CID':obj.CID,'rewards':1,'wallets':1,'tickets':1,'notes':1,'events':1,'orders':1,'giftcards':1,'organization':1},{'callback':function(rd){
						  $custEditorTarget.hideLoading();
						  
						  if(_app.model.responseHasErrors(rd)){
							  _app.u.throwMessage(rd);
							  }
						  else	{
							  $custEditorTarget.anycontent({'templateID':'customerEditorTemplate','data':_app.data[rd.datapointer],'dataAttribs':obj});
							  
							  var panArr = _app.model.dpsGet('admin_customer','editorPanelOrder'); //panel Array for ordering.
						  
							  if(!$.isEmptyObject(panArr))	{
								  var L = panArr.length;
//yes, I know loops in loops are bad. But these are very small loops.
//this will re-sort the panels into the order specified in local storage.
								  for(var i = 0; i < L; i += 1)	{
									  var $col = $("[data-app-column='"+(i+1)+"']",$custEditorTarget);
									  for(var index in panArr[i])	{
										  $("[data-app-role='"+panArr[i][index]+"']",$custEditorTarget).first().appendTo($col);
										  }
									  }
								  }
						  
//make into anypanels.
							  $("div.panel",$custEditorTarget).each(function(){
								  var PC = $(this).data('app-role'); //panel content (general, wholesale, etc)
								  $(this).data('cid',obj.CID).anypanel({'wholeHeaderToggle':false,'showClose':false,'state':'persistent','extension':'admin_customer','name':PC,'persistent':true});
								  })
							  }
						  
							  var sortCols = $('.twoColumn').sortable({  
								  connectWith: '.twoColumn',
								  handle: 'h2',
								  cursor: 'move',
								  placeholder: 'placeholder',
								  forcePlaceholderSize: true,
								  opacity: 0.4,
						  //the 'stop' below is to stop panel content flicker during drag, caused by mouseover effect for configuration options.
								  stop: function(event, ui){
									  $(ui.item).find('h2').click();
									  var dataObj = new Array();
									  sortCols.each(function(){
										  var $col = $(this);
										  dataObj.push($col.sortable( "toArray",{'attribute':'data-app-role'} ));
										  });
									  _app.model.dpsSet('admin_customer','editorPanelOrder',dataObj); //update the localStorage session var.
						  //			_app.u.dump(' -> dataObj: '); _app.u.dump(dataObj);
									  }
								  });

							  _app.u.handleCommonPlugins($custEditorTarget);
							  _app.u.handleButtons($custEditorTarget);
							  _app.u.addEventDelegation($custEditorTarget);
							  _app.ext.admin_customer.u.handleAnypanelButtons($custEditorTarget,obj); //adds buttons to/for the various panels
							  $custEditorTarget.anyform({'trackEdits':true});
	
							}},'mutable');
						_app.model.dispatchThis('mutable');
						}
					else	{
						$custEditorTarget.anymessage({"message":"CID "+obj.CID+" is not valid.  This may mean there is no record for this customer."});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_customer.a.showCustomerEditor, $custEditorTarget is blank or not an object."});
					}
				}, //showCustomerEditor

			showCRMManager : function($target)	{
				$target.intervaledEmpty();
				var $DMI = _app.ext.admin.i.DMICreate($target,{
					'header' : 'CRM Manager',
					'className' : 'CRMManager', //applies a class on the DMI, which allows for css overriding for specific use cases.
					'thead' : ['','ID','Status','Subject','Class','Created','Last Update',''], //leave blank at end if last row is buttons.
					'tbodyDatabind' : "var: tickets(@TICKETS); format:processList; loadsTemplate:crmManagerResultsRowTemplate;",
					'buttons' : [
						"<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh<\/button>",
						"<button data-app-click='admin_customer|crmAdminTicketCreateShow' class='applyButton' data-icon-primary='ui-icon-plus'>Add Ticket</button>"],	
					'controls' : _app.templates.crmManagerControls,
					'cmdVars' : {
						'_cmd' : 'adminAppTicketList',
						'STATUS' : 'NEW', //update by changing $([data-app-role="dualModeContainer"]).data('cmdVars').STATUS
						'limit' : '50', //not supported for every call yet.
						'_tag' : {
							'datapointer':'adminAppTicketList'
							}
						}
					});
				_app.u.handleButtons($target);
				_app.model.dispatchThis('mutable');
				},

			showCampaignManager : function($target)	{
				var $table = _app.ext.admin.i.DMICreate($target,{
					'header' : 'Campaign Manager',
					'className' : 'campaignManager',
					'handleAppEvents' : false,
					'buttons' : [
						"<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh<\/button>",
						"<button data-title='Create a New Campaign' data-app-click='admin_customer|adminCampaignCreateShow' class='applyButton' data-text='true' data-icon-primary='ui-icon-circle-plus'>Create New Campaign</button>"],
					'thead' : ['ID','Subject','Status','Methods','Q Mode','Created','Expired',''],
					'tbodyDatabind' : "var: campaign(@CAMPAIGNS); format:processList; loadsTemplate:campaignResultsRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminCampaignList',
						'_tag' : {'datapointer' : 'adminCampaignList'}
						}
					});
				_app.u.handleButtons($target.anyform());
				// do not fetch templates at this point. That's a heavy call and they may not be used.
				_app.model.dispatchThis();
				}, //showCampaignManager
			
			showCampaignEditor : function($target,CAMPAIGNID)	{
//				_app.u.dump("BEGING admin_customer.a.showCampaignEditor");
				if($target && $target instanceof jQuery && CAMPAIGNID)	{

					$target.empty()
					var data = _app.ext.admin_customer.u.getCampaignByCAMPAIGNID(CAMPAIGNID);

					if(data)	{
					
					//generate template instance and get some content in front of user. will be blocked by loading till template data available.
						$("<div \/>").anycontent({'templateID':'caimpaignUpdateTemplate','data':data}).appendTo($target);
						
						$('.applyDatetimepicker',$target).datetimepicker({
							changeMonth: true,
							changeYear: true,
							minDate : 0, //can't start before today.
							dateFormat : 'yymmdd',
							timeFormat:"HH0000", //HH vs hh gives you military vs standard time (respectivly)
							stepMinute : 60,
							showMinute : false,
							separator : '' //get rid of space between date and time.
							});
					
						var $picker = $("[data-app-role='pickerContainer']:first",$target);
						$picker.append(_app.ext.admin.a.getPicker({'templateID':'customerPickerTemplate','mode':'customer'},data.RECIPIENTS));
						$picker.anycontent({data:data});
						
						_app.u.handleAppEvents($target);
						_app.u.addEventDelegation($target);
						_app.u.handleButtons($target.anyform());
						}
					else if(data === false)	{
						$('#globalMessaging').anymessage({"message":"In admin_customer.a.showCampaignEditor, unable to resolve campaign data from CAMPAIGNID: "+CAMPAIGNID,"gMessage":true});
						}
					else	{} //an error occured. getCampaignByCAMPAIGNID will handle displaying the error.
					
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_customer.a.showCampaignEditor, either $target is blank or not a jquery instance ["+$target instanceof jQuery+"] or CAMPAIGNID ["+CAMPAIGNID+"] not set.","gMessage":true});
					}
				},

			showGiftcardManager : function($target)	{
				$target.empty();
				var $table = _app.ext.admin.i.DMICreate($target,{
					'header' : 'Giftcard Manager',
					'className' : 'giftcardManager',
					'handleAppEvents' : false,
					'buttons' : [
						"<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh<\/button>",
						"<button data-app-click='admin|openDialog' class='applyButton' data-templateid='giftcardAddProductTemplate' data-title='Create a New Giftcard Product'>Create Giftcard Product</button>",
						"<button data-app-click='admin_customer|giftcardCreateShow'  class='applyButton' data-text='true' data-icon-primary='ui-icon-circle-plus'>Add New Giftcard</button>"],
					'thead' : ['Code','Created','Expires','Last Order','Customer','Balance','Txn #','Type','Series',''],
					'controls' : "<form action='#' onsubmit='return false'><input type='hidden' name='_cmd' value='adminGiftcardSearch' \/><input type='hidden' name='_tag/datapointer' value='adminGiftcardSearch' \/><input type='hidden' name='_tag/callback' value='DMIUpdateResults' /><input type='hidden' name='_tag/extension' value='admin' /><input type='search' name='CODE' \/><button data-app-click='admin|controlFormSubmit' class='applyButton' data-text='false' data-icon-primary='ui-icon-search'>Search<\/button><\/form>",
					'tbodyDatabind' : "var: users(@GIFTCARDS); format:processList; loadsTemplate:giftcardResultsRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminGiftcardList',
						'_tag' : {'datapointer' : 'adminGiftcardList'}
						}
					});
				_app.u.handleButtons($target);
				_app.model.dispatchThis();
				},

			showReviewsManager : function($target)	{
				$target.empty();
				_app.ext.admin.i.DMICreate($target,{
					'header' : 'Reviews Manager',
					'handleAppEvents' : false,
					'className' : 'reviewsManager',
					'controls' : "<form action='#' onsubmit='return false'><input type='hidden' name='_cmd' value='adminProductReviewList' \/><input type='hidden' name='_tag/datapointer' value='adminProductReviewList' \/><input type='hidden' name='_tag/callback' value='DMIUpdateResults' /><input type='hidden' name='_tag/extension' value='admin' /><input type='search' placeholder='product id' name='PID' \/><button data-app-click='admin|controlFormSubmit' class='applyButton' data-text='false' data-icon-primary='ui-icon-search'>Search<\/button><\/form>",
					'buttons' : [
						"<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh<\/button>",
						"<button data-app-click='admin|dataCSVExportExec' data-pointer='adminProductReviewList' data-listpointer='@REVIEWS' data-filename='product_reviews.csv' class='applyButton' data-text='true' data-icon-primary='ui-icon-arrowstop-1-s'>Export<\/button>",
						"<button data-app-click='admin_customer|reviewApproveExec' class='applyButton' data-text='true' data-icon-primary='ui-icon-check'>Approve<\/button>",
						"<button data-app-click='admin_customer|reviewCreateShow' class='applyButton' data-text='true' data-icon-primary='ui-icon-plus'>Add<\/button>"],
					'thead' : ['','Created','Product ID','Subject','Customer','Review',''],
					'tbodyDatabind' : "var: users(@REVIEWS); format:processList; loadsTemplate:reviewsResultsRowTemplate;",
					'cmdVars' : {
						'filter':'UNAPPROVED',
						'_cmd' : 'adminProductReviewList',
						'_tag' : {
							'datapointer' : 'adminProductReviewList'
							}
						}
					});
				_app.u.handleButtons($target);
				_app.model.dispatchThis('mutable');
				}, //showReviewsManager


			faqManager : function($target,params)	{
				$target.empty();
				_app.ext.admin.i.DMICreate($target,{
					'header' : 'FAQ Manager',
					'handleAppEvents' : false,
					'className' : 'faqManager',
					'controls' : "",
					'buttons' : [
						"<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh<\/button>",
						"<button data-text='true' data-icon-primary='ui-icon-help' class='applyButton' data-app-click='admin_customer|faqQuestionAddNewShow'>New FAQ<\/button>",
						"<button data-text='true' data-icon-primary='ui-icon-plus' class='applyButton' data-app-click='admin_customer|faqTopicAddNewShow'>New Topic<\/button>"],
					'thead' : ['Topic','Question','Priority',''],
					'tbodyDatabind' : "var: users(@FAQS); format:processList; loadsTemplate:faqResultsRowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminFAQList',
						'_tag' : {
							'datapointer' : 'adminFAQList'  //NOTE -> renderFormats.faqTopic uses this datapointer.
							}
						}
					});
				_app.u.handleButtons($target);
				_app.model.dispatchThis('mutable');
				}, //showReviewsManager

//obj should contain CID. likely will include partition soon too.
// ### FUTURE -> this works, but should probably be updated to use submitForm and refreshCustomerPanel as submit/click events.
			showAddWalletModal : function(obj,$walletPanel)	{
				var $modal = $('#customerUpdateModal').empty()
				_app.u.addEventDelegation($modal);
				$('.ui-dialog-title',$modal.parent()).text('Add a new wallet');
				$modal.dialog('open');
				if(obj && obj.CID)	{
					$modal.anycontent({'templateID':'customerWalletAddTemplate','showLoading':false,'dataAttribs':obj});
					$modal.anyform();
					var $form = $("form",$modal);
					$form.append($("<button>").text('Save Wallet').button().on('click',function(event){
						event.preventDefault();
						if(_app.u.validateForm($form))	{
							$form.showLoading({'message':'Adding wallet to customer record '+obj.CID+'.'});
							_app.ext.admin.calls.adminCustomerUpdate.init(obj.CID,["WALLETCREATE?"+$.param($form.serializeJSON())],{'callback':function(rd){
								$form.hideLoading();
								if(_app.model.responseHasErrors(rd)){
									$form.anymessage({'message':rd});
									}
								else	{
									$form.parent().empty().anymessage({'message':'Thank you, the wallet has been added','errtype':'success'});
									$("tbody",$walletPanel).empty(); //clear wallets
									$walletPanel.anycontent({'datapointer' : 'adminCustomerDetail|'+obj.CID}); //re-translate panel, which will update wallet list.
									_app.u.handleButtons($walletPanel);
									}
								}},'immutable');
						//do this after the update so the detail includes the changes from the update.
							_app.model.destroy('adminCustomerDetail|'+obj.CID);
							_app.ext.admin.calls.adminCustomerDetail.init({'CID':obj.CID,'rewards':1,'wallets':1,'tickets':1,'notes':1,'events':1,'orders':1,'giftcards':1,'organization':1},{},'immutable');
							_app.model.dispatchThis('immutable');
							}
						else	{
							$form.anymessage({'message':'Please enter all the fields below.'});
							}
						}));
					}
				else	{
					$modal.anymessage({'message':'In admin_customer.a.showAddWalletModal, no CID defined.',gMessage:true});
					}
				}, //showAddWalletModal

			showCustomerCreateModal : function(){
				var $modal = $('#customerUpdateModal').empty();
				$('.ui-dialog-title',$modal.parent()).text('Add a new customer'); //blank the title bar so old title doesn't show up if error occurs
				$modal.anycontent({'templateID':'customerCreateTemplate','showLoading':false}).anyform();
				_app.u.addEventDelegation($modal);
				_app.u.handleButtons($modal);
				$modal.dialog('open');
				},

/*
obj is required. must contain CID.
obj.type is also required. currently supports bill or ship.
obj.mode is required. should be set to 'create' or 'update'
obj.show is required. currently, only 'dialog' is supported. however, more may be at some point, so it's required.

address is optional. if _id is passed, that input will get locked. pass 'id' to set a default but allow it to be changed.

$D is returned.

*/
			addressCreateUpdateShow : function(vars,callback,address)	{
				vars = vars || {};
				address = address || {};
				_app.u.dump(" -> address: "); _app.u.dump(address,'debug');
				if((vars.TYPE == 'bill' || vars.TYPE == 'ship') && vars.mode && vars.CID && vars.show)	{
					//add CID and mode to address object so that translator adds them to hidden inputs.
					address.CID = vars.CID;
					address.TYPE = vars.TYPE;
					//a customer address passed from checkout will use bill/address, not bill_address.
					for(var index in address)	{
						if(index.indexOf(vars.type+'/') >= 0)	{
							address[index.replace(vars.type+'/',vars.type+'_')] = address[index];
							}
						}

					var $D = _app.ext.admin.i.dialogCreate({
						'title' : vars.mode+' address ('+vars.TYPE+')',
						'templateID' : 'customerAddressAddUpdateTemplate',
						'data' : address,
						});

					//if the email isn't set, use the customer record email to populate.
//					if(address.TYPE == 'bill' && !address.email && _app.u.thisNestedExists("data.adminCustomerDetail|"+vars.CID+"._EMAIL",_app))	{
//						$("input[name='email']",$D).addClass((vars.mode == 'update' ? 'edited' : '')).val(_app.data["adminCustomerDetail|"+vars.CID]._EMAIL).trigger('change');
//						}
					//the id can't be changed once it's set.
					if(vars.mode == 'update' || address._id)	{
						$("input[name='SHORTCUT']",$D).prop('disabled','disabled');
						}
					//ship addresses don't support email address.
//					if(vars.TYPE == 'ship')	{
//						$("input[name='email']",$D).closest('label').empty().remove(); //email isn't a valid shipping input.
//						}
					
					var $form = $('form:first',$D).data(vars);
					
					$("<button \/>").html("Save <span class='numChanges'></span> Changes").attr('data-app-role','saveButton').button().on('click',function(event){
						event.preventDefault();
						if(_app.u.validateForm($form))	{
							if(vars.mode == 'update' || vars.mode == 'create')	{
								var sfo = $form.serializeJSON();
								delete sfo._id; //shortcut is used in save, which is already part of sfo
								delete sfo.mode; //this is for forming macro cmd, not part of address.
								//customerUpdate does return some of the updated customer object, but none of the extras, like wallets, org, orders, etc.
								_app.ext.admin.calls.adminCustomerUpdate.init(vars.CID,["ADDR"+(vars.mode.toUpperCase())+"?"+$.param(sfo)],{'callback' : function(rd){
									if(_app.model.responseHasErrors(rd)){
										$D.anymessage({'message':rd});
										}
									else	{
										$D.dialog('close');
										if(typeof callback == 'function')	{
											callback(vars,sfo);
											}
										}
									}},'immutable');
								}
							else	{
								$D.anymessage({'message':'In admin_customer.a.addressCreateUpdateShow, mode ['+vars.mode+'] was set but not valid. Must be set to create or update.','gMessage':true});
								}
							_app.model.destroy('adminCustomerDetail|'+vars.CID);
							_app.ext.admin.calls.adminCustomerDetail.init({'CID':vars.CID,'rewards':1,'notes':1,'orders':1,'organization':1,'wallets':1},{},'immutable');
							_app.model.dispatchThis('immutable');

							}
						else	{} //validateForm will handle error display
						}).appendTo($form);

					_app.u.handleCommonPlugins($D);
					_app.u.handleButtons($D);
					$D.anyform({'trackEdits' : (vars.mode == 'update' ? true : false)}).dialog('open');
					return $D;
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_customer.a.createUpdateAddressShow, a required param was left blank [vars.type: "+vars.type+" (must be bill or ship), vars.mode = "+vars.mode+" && vars.CID = "+vars.CID+" and vars.show = "+vars.show+"].","gMessage":true});
					}
				},


//data should be a hash that optionally includes 'scope' and 'searchfor' params.
//if both are set, those criteria will automatically be entered into the form and a search performed.
//if only one or the other is set, they'll be the default values selected.
			customerSearch : function(data,callback)	{

				var $D = _app.ext.admin.i.dialogCreate({
					'title' : 'Find Customer',
					'templateID' : 'customerSearchTemplate',
					'data' : data || {},
					});
				$D.dialog('open');
				_app.u.handleButtons($D);
				_app.u.handleCommonPlugins($D);
				
				$("form[data-app-role='customerSearch']:first",$D).on('submit',function(){
					var sfo = $(this).serializeJSON();
					$D.showLoading({"message":"Searching "+sfo.scope+" for "+sfo.searchfor});
					_app.model.addDispatchToQ({"_cmd":"adminCustomerSearch",'scope':sfo.scope,'searchfor':sfo.searchfor,"_tag":{
						"datapointer":"adminCustomerSearch",
						"callback":function(rd){

							$D.hideLoading();
							if(_app.model.responseHasErrors(rd)){
								$D.anymessage({'message':rd});
								}
							else	{
								//success content goes here.
								var customers = _app.data[rd.datapointer]['@CUSTOMERS'];
								if(!customers || customers.length == 0)	{
									$D.anymessage({"message":"Zero customers were found searching "+sfo.scope+" for '"+sfo.searchfor+"'."});
									}
								else if(_app.data[rd.datapointer]['@CUSTOMERS'].length == 1 && _app.data[rd.datapointer]['@CUSTOMERS'][0].PRT == _app.vars.partition)	{
									//encountered an issue in order create > lookup customer where $D didn't register as a dialog yet.
									//	closing it directly here caused a JS error. a slight pause solved this.
									if($D.is(':data(dialog)'))	{$D.dialog('close');}
									else	{
										setTimeout(function(){$D.dialog('close');},500);
										}
									callback(_app.data[rd.datapointer]['@CUSTOMERS'][0]);
									}
								else	{
									
// ** 201402 -> a new method, using delegated events, for displaying/handling clicks. Needed to improve experience for results with mixed partitions.
/*									$("[data-app-role='customerSearchResultsTable']",$D).show().anycontent(rd).find("tbody tr[data-prt='"+_app.vars.partition+"']").addClass('lookLikeLink pointer').end().on('click',"tbody tr[data-prt='"+_app.vars.partition+"']",function(){
										callback($(this).data());
										$D.dialog('close').empty().remove();
										}).parent().css({'max-height':200,'overflow':'auto',});
*/
									var partitionMismatch = false;
									$("[data-app-role='customerSearchResultsTable']",$D).show().anycontent(rd).find("tbody tr").each(function(){
										var $tr  = $(this);
										if($tr.data('prt') == _app.vars.partition)	{
											$tr.addClass('lookLikeLink pointer');
											}
										else	{
											partitionMismatch = true;
											}
										})
									.end()
									.on('click',"tr.lookLikeLink",function(){
										callback($(this).data());
										$D.dialog('close').empty().remove();
										})
									.parent().css({'max-height':200,'overflow':'auto',});
									
									if(partitionMismatch)	{
										$("[data-app-role='customerSearchResultsContainer']",$D).anymessage({"message":"Some (or all) the customers listed below are from another partition. You can only select customers from the partition you are currently logged in to (partition "+_app.vars.partition+");","persistent":true,"errtype":"hint"});
										}
									}
								}

							}}
						},"mutable");
					_app.model.dispatchThis('mutable');
					});

				if(data.scope && data.searchfor)	{
					$("form[data-app-role='customerSearch']:first",$D).trigger('submit');
					}

				} //customerSearch
			
			}, //Actions

////////////////////////////////////   TLCFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\
		tlcFormats : {
			
			topicloop : function(data,thisTLC)	{
//				dump(" -> data.globals: "); dump(data.globals);
				var T = data.globals.binds[data.globals.focusBind], L = T.length, $tmp = $("<select \/>");
				for(var i = 0; i < L; i += 1)	{
					$("<option>"+T[i].TITLE+"</option>").val(T[i].TOPIC_ID).appendTo($tmp);
					}
				data.globals.binds[data.globals.focusBind] = $tmp.children();
				return true;
				}
			
			},

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			//passed the topic id, which is used to look up the topic_title
			faqTopic : function($tag,data)	{
				var topicID = data.value; //shortcut.
				var topic = _app.ext.admin.u.getValueByKeyFromArray(_app.data.adminFAQList['@TOPICS'],'TOPIC_ID',topicID);
				if(topic && topic.TITLE)	{
					$tag.append(topic.TITLE);
					}
				else	{
					$tag.append(topicID);
					}
				},

			orderHistoryTotal : function($tag,data)	{
				_app.u.dump("BEGIN admin_customer.renderFormat.orderHistoryTotal");
				var L = data.value.length,
				sum = 0; //sum of all orders combined.
				for(var i = 0; i < L; i += 1)	{
					sum += Number(data.value[i].ORDER_TOTAL);
					}
				data.value = sum; //preserve data object except data.value. that way other params, such as currency symbol, can still be set.
				_app.renderFormats.money($tag,data)
				},

			newsletters : function($tag,data)	{
				
				if(!_app.data.adminNewsletterList)	{$tag.anymessage({'message':'Unable to fetch newsletter list'})}
				else if(_app.data.adminNewsletterList['@lists'].length == 0)	{
					$tag.anymessage({'message':'You have not created any subscriber lists.','persistent':true})
					}
				else	{
					var $f = $("<fieldset \/>"),
					L = _app.data.adminNewsletterList['@lists'].length,
					listbw = null; //list bitwise. just a shortcut.
					if(data.value.INFO && data.value.INFO.NEWSLETTER)	{listbw = data.value.INFO.NEWSLETTER}
//					_app.u.dump(" -> binary of dINFO.NEWSLETTER ["+data.value.INFO.NEWSLETTER+"]: "+Number(data.value.INFO.NEWSLETTER).toString(2));
					for(var i = 0; i < L; i += 1)	{
						if(_app.data.adminNewsletterList['@lists'][i].NAME)	{
						$("<label \/>").addClass('clearfix').append($("<input \/>",{
							'type':'checkbox',
							'name':'newsletter_'+_app.data.adminNewsletterList['@lists'][i].ID
							}).prop('checked',_app.ext.admin_customer.u.getNewslettersTF(listbw,Number(_app.data.adminNewsletterList['@lists'][i].ID)))).append(_app.data.adminNewsletterList['@lists'][i].NAME + " [prt: "+_app.data.adminNewsletterList['@lists'][i].PRT+"]").appendTo($f);
							}
						else	{} //do nothing in this case. It's a newsletter w/ no name (likely the bitwise not appropriated yet)
						}
					$f.appendTo($tag);
					}
				
				} //newsletters

			}, //renderFormats
			

////////////////////////////////////   MACROBUILDERS   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		macrobuilders : {

			'adminGiftcardMacro' : function(sfo,$form)	{
				_app.u.dump("BEGIN admin_wholesale.macrobuilders.warehouse-create");
				sfo = sfo || {};
//a new object, which is sanitized and returned.
				var newSfo = {
					'_cmd':'adminGiftcardMacro',
					'GCID':sfo.GCID,
					'_tag':sfo._tag,
					'@updates':new Array()
					}; 

				if($("[name='balance']",$form).hasClass('edited'))	{
					newSfo['@updates'].push("SET/BALANCE?balance="+sfo.balance+"&note="+sfo.balance_note);
					}
				if($("[name='cardtype']",$form).hasClass('edited'))	{
					newSfo['@updates'].push("SET/CARDTYPE?cardtype="+sfo.cardtype+"&note="+sfo.cardtype_note);
					}
				if($("[name='expires']",$form).hasClass('edited'))	{
					newSfo['@updates'].push("SET/EXPIRES?expires="+sfo.expires+"&note="+sfo.expires_note);
					}
				return newSfo;
				}, //adminGiftcardMacro
			'adminCustomerUpdatePassword' : function(sfo,$form)	{
				sfo['@updates'] = new Array();
				sfo._cmd = 'adminCustomerUpdate';
				sfo['@updates'].push("PASSWORD-SET?password="+encodeURIComponent(sfo.password)); //password needs to be encoded (required for & and + to be acceptable password characters)
				if(sfo.sendblast)	{
					sfo['@updates'].push("BLAST-SEND?MSGID=CUSTOMER.PASSWORD.RECOVER");
					}
				//these are no longer necessary.
				delete sfo.sendblast;
				delete sfo.password;
				return sfo;
				},

			'adminFAQMacro' : function(sfo,$form)	{
				sfo = sfo || {};
//a new object, which is sanitized and returned.
				var newSfo = {
					'_cmd':'adminFAQMacro',
					'_tag':sfo._tag,
					'@updates':new Array()
					};
				newSfo['@updates'].push(sfo.verb+"?"+_app.u.hash2kvp(_app.u.getWhitelistedObject(sfo,['FAQ_ID','QUESTION','ANSWER','TOPIC_ID','PRIORITY','KEYWORDS'])));
				return newSfo;
				} //adminGiftcardMacro		
			},
			
			
			
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
//run after a form input on the page has changed. updates the 'numChanges' class to indicate # of changes and enable parent button.
// ### TODO -> should be able to get rid of this after upgrade to DE. do so once testing can be done at same time.
			handleChanges : function($customerEditor)	{
				var numChanges = $('.edited',$customerEditor).length;
				if(numChanges)	{
					$('.numChanges',$customerEditor).text(numChanges).parents('button').addClass('ui-state-highlight').button('enable');
					}
				else	{
					$('.numChanges',$customerEditor).text("").parents('button').removeClass('ui-state-highlight').button('disable');
					}
				}, //handleChanges
			
			getGiftcardCreateDialog : function(data)	{
				var $D = _app.ext.admin.i.dialogCreate({
					'title':'Add New Giftcard',
					'data' : data || {},
					'templateID':'giftcardCreateTemplate',
					'showLoading':false //will get passed into anycontent and disable showLoading.
					});
				_app.u.handleButtons($D.anyform());
				$D.dialog('open');
				$( ".applyDatepicker",$D).datepicker({
					changeMonth: true,
					changeYear: true,
					dateFormat : 'yymmdd'
					});
				return $D;
				},
			
//adds the extra buttons to each of the panels.
//obj should include obj.CID
			handleAnypanelButtons : function($customerEditor,obj){
				if($customerEditor && typeof $customerEditor == 'object')	{
					if(obj.CID)	{

						var addrCallback = function(v)	{
							var $panel = $("[data-app-role='"+v.TYPE.toLowerCase()+"']",v.$customerEditor); //ship or bill panel.
							_app.u.dump(" -> $panel.length: "+$panel.length);
							_app.u.dump(" -> $customerEditor.length: "+v.$customerEditor.length);
							$("tbody",$panel).empty(); //clear address rows so new can be added.
							$panel.anycontent({'data' : _app.data['adminCustomerDetail|'+v.CID]}); //translate panel, which add all addresses.
							_app.u.handleButtons($panel);
							}

						$('.panel_ship',$customerEditor).anypanel('option','settingsMenu',{'Add Address':function(){
							_app.ext.admin_customer.a.addressCreateUpdateShow({
								'mode' : 'create', //will b create or update.
								'show' : 'dialog',
								'$customerEditor':$customerEditor,
								'TYPE' : 'ship',
								'CID' : obj.CID
								},addrCallback);
							}});

						$('.panel_bill',$customerEditor).anypanel('option','settingsMenu',{'Add Address':function(){
							_app.ext.admin_customer.a.addressCreateUpdateShow({
								'mode' : 'create', //will b create or update.
								'show' : 'dialog',
								'$customerEditor':$customerEditor,
								'TYPE' : 'bill',
								'CID' : obj.CID
								},addrCallback);
							}});

						$("[data-app-role='wallets']",$customerEditor).anypanel('option','settingsMenu',{'Add Wallet':function(){
							_app.ext.admin_customer.a.showAddWalletModal(obj,$("[data-app-role='wallets']",$customerEditor));
							}});

						$("[data-app-role='giftcards']",$customerEditor).anypanel('option','settingsMenu',{'Add a Giftcard':function(){

							var $D = _app.ext.admin_customer.u.getGiftcardCreateDialog(_app.data['adminCustomerDetail|'+obj.CID]);
							
							//These fields are used for processForm on save.
							//They're here instead of in the form directly so that the form/template can be recycled for other 'creates'.				
							$('form:first',$D).append("<input type='hidden' name='_cmd' value='adminGiftcardCreate' /><input type='hidden' name='_tag/message' value='The giftcard has been created.' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/jqObjEmpty' value='true' />");
							
							if(_app.u.thisNestedExists("data.adminCustomerDetail|"+obj.CID+"._EMAIL",_app))	{
								$("input[name='email']",$D).prop('disabled',true);
								//quantity and series are only useful when creating a series/bulk group of giftcards. In this instance, a GC is being created for a specific customer, so the values are forced and the inputs are hidden.
								$("input[name='quantity']",$D).prop('disabled',true).val('1').closest('label').hide(); //force quantity to 1 or the email will get dropped. The field isn't applicable in this instance (assigning to a specific customer).
								$("input[name='series']",$D).prop('disabled',true).val('').closest('label').hide();
								}
							
							var $saveButton = $("button[data-app-role='saveButton']:first",$D)
							$saveButton.attr('data-app-click',$saveButton.attr('data-app-click')+",admin_customer|refreshCustomerPanel").data('panel','giftcards');

							}});

						$("[data-app-role='tickets']",$customerEditor).anypanel('option','settingsMenu',{'Start a New Ticket':function(){
							var $D = _app.ext.admin.i.dialogCreate({
								'title' : 'Create CRM Ticket for customer '+obj.CID,
								'templateID':'crmManagerTicketCreateTemplate',
								'data': _app.data['adminCustomerDetail|'+obj.CID]
								});
							if(_app.u.thisNestedExists("data.adminCustomerDetail|"+obj.CID+"._EMAIL",_app))	{
								$("input[name='email']",$customerEditor).prop('disabled',true);
								$("input[name='create']",$customerEditor).prop('disabled',true).closest('label').hide();
								}
							var $saveButton = $("button[data-app-role='saveButton']:first",$D)
							$saveButton.attr('data-app-click',$saveButton.attr('data-app-click')+",admin_customer|refreshCustomerPanel").data('panel','tickets');
							$D.anyform();
							_app.u.addEventDelegation($D);
							_app.u.handleButtons($D);
							$D.dialog('open');
							//crmAdminTicketCreateShow
							}});					

						}
					else	{
						$customerEditor.anymessage({'message':'In admin_customer.u.handleAnypanelButtons, CID not passed.','gMessage':true});
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_customer.u.handleAnypanelButtons, CID not passed.','gMessage':true});
					}
				}, //handleAnypanelButtons

//macro is the addr macro for adminCustomerUpdate (either addrcreate or addrupdate)
//obj should contain CID and type. in the future, likely to contain partition.
			customerAddressAddUpdate : function($form,MACRO,obj,callback)	{
				if(MACRO && $form && $form instanceof jQuery && obj && obj.CID && typeof callback == 'function')	{
					if(_app.u.validateForm($form))	{
						_app.u.dump(" -> form validated. proceed.");
						$form.showLoading({"message":"Updating customer address record."});
//shortcut is turned into a readonly, which means serialize skips it, so it's added back here.
						_app.ext.admin.calls.adminCustomerUpdate.init(obj.CID,[MACRO+"?"+((MACRO == 'ADDRUPDATE') ? "SHORTCUT="+$("[name='SHORTCUT']",$form).val()+"&" : "")+$form.serialize()],{'callback':callback},'immutable');
//destroy and detail must occur after update
						_app.model.destroy('adminCustomerDetail|'+obj.CID);
						_app.ext.admin.calls.adminCustomerDetail.init({'CID':obj.CID,'rewards':1,'wallets':1,'tickets':1,'notes':1,'events':1,'orders':1,'giftcards':1,'organization':1},{},'immutable');
						_app.model.dispatchThis('immutable');
						}
					else	{
						$form.anymessage({'message':'Some required fields were missing or left blank.'})
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_customer.u.customerAddressAddUpdate, either $form, customerID or macro not passed.'});
					}
				}, //customerAddressAddUpdate


			getAddressByID : function(addrObj,id)	{
				var r = false; //what is returned. will be an address object if there's a match.
				if(addrObj && id)	{
					for(var i = 0; i < addrObj.length; i += 1)	{
						if(addrObj[i]._id == id)	{
							r = addrObj[i];
							break;
							}
						else	{}
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'in admin_customer.u.getAddressByID, either addrObj or ID empty'});
					}
				return r;
				},

//The flags field in the order is an integer. The binary representation of that int (bitwise and) will tell us what flags are enabled.
			getNewslettersTF : function(newsint,val)	{
//so what's happening here...   the tostring converts the int into binary. split/reverse/join reverse the order, changing 1000 (for 8) into 0001
				var B = Number(newsint).toString(2).split('').reverse().join(''); //binary. converts 8 to 1000 or 12 to 1100.
//				_app.u.dump(" -> Binary of flags: "+B);
				return B.charAt(val - 1) == 1 ? true : false; //1
				},

			getCampaignByCAMPAIGNID : function(CAMPAIGNID)	{
				var r = false; //what is returned. Either 'false' if not found, null if an error occured or the data object.
				if(CAMPAIGNID)	{
					if(_app.data.adminCampaignList && _app.data.adminCampaignList['@CAMPAIGNS'] && _app.data.adminCampaignList['@CAMPAIGNS'].length)	{
						var L = _app.data.adminCampaignList['@CAMPAIGNS'].length;
						for(var i = 0; i < L; i += 1)	{
							if(_app.data.adminCampaignList['@CAMPAIGNS'][i].CAMPAIGNID == CAMPAIGNID)	{
								r = _app.data.adminCampaignList['@CAMPAIGNS'][i];
								break; //match found. Exit early.
								}
							}
						}
					else	{
						r = null;
						$('#globalMessaging').anymessage({"message":"In admin_customer.u.getCampaignByCAMPAIGNID, _app.data.adminCampaignList not in memory or @CAMPAIGNS is empty.","gMessage":true});
						}
					}
				else	{
					r = null;
					$('#globalMessaging').anymessage({"message":"In admin_customer.u.getCampaignByCAMPAIGNID, no CAMPAIGNID specified.","gMessage":true});
					}
				return r;
				}

			}, //u [utilities]



		e : {
//custom event instead of using openDialog because of html editor.
			adminCampaignCreateShow : function($ele,P)	{
//consider the 'create' just having the subject and ID, then creating and going right into the editor. probably a good idea.
					P.preventDefault();
					var $D = _app.ext.admin.i.dialogCreate({'templateID':'campaignCreateTemplate','title':'Create a New Campaign','showLoading':false});
					$D.dialog('open');
					$D.showLoading({'message':'Fetching campaign template list'});
					
					_app.model.addDispatchToQ({
						'_cmd':'adminCampaignTemplateList',
						'_tag':	{
							'datapointer' : 'adminCampaignTemplateList',
							'callback':'anycontent',
							'translateOnly' : true,
							jqObj : $D
							}
						},'mutable');
					_app.model.dispatchThis('mutable');
//may need to add some for attributes for processForm or a custom app event button. That'll depend on how the file vs other changes get saved.
				},
			
			adminCampaignCreateExec : function($btn)	{
				$btn.button();
				$btn.off('click.adminCampaignCreateShow').on('click.adminCampaignCreateShow',function(event){
					event.preventDefault();
					var $form = $btn.closest('form');
					if(_app.u.validateForm($form))	{
						$form.showLoading({'message':'Creating Campaign...'});
						var
							sfo = $form.serializeJSON(),
							date = new Date(),
							month = date.getMonth() + 1,
							CAMPAIGNID = sfo.CAMPAIGNID.toUpperCase()+"_"+date.getFullYear()+(month < 10 ? '0'+month : month)+date.getDate(); //appending epoch timestamp increases likelyhood that campaignID will be globally unique. upper case will be enforced by the API

						_app.model.addDispatchToQ({
							'_cmd':'adminCampaignCreate',
							'CAMPAIGNID' : CAMPAIGNID, 
							'_tag':	{
								'callback':function(rd){
									if(_app.model.responseHasErrors(rd)){
										$form.hideLoading();
										$form.anymessage({'message':rd});
										}
									else	{
										//Campaign was successfully created.  Handle the templating piece.
										//call is daisy chained instead of pipelined in case the first call (create) fails.
										_app.model.addDispatchToQ({'_cmd':'adminCampaignList','_tag':{'datapointer' : 'adminCampaignList'}},'immutable'); //this is where all campaign data is, so need this refreshed.
										_app.model.addDispatchToQ({
											'_cmd':'adminCampaignTemplateInstall',
											'PROJECTID' : "$SYSTEM", //set by what template was selected. !!! needs to be loaded from select list option data. the option renderformat should add more info as data to each option.
											'CAMPAIGNID' : CAMPAIGNID,
											'SUBDIR' : sfo.template_origin, //what is the file we are copying in.
											'_tag':	{
												'callback':function(responseData){
													$form.hideLoading();
													if(_app.model.responseHasErrors(responseData)){
														$form.anymessage({'message':rd});
														}
													else	{
														//Template content was successfully added.
														$btn.closest('.ui-dialog-content').dialog('close'); //closes the 'create' dialog.
														_app.ext.admin_customer.a.showCampaignEditor($(_app.u.jqSelector('#',_app.ext.admin.vars.tab+"Content")),CAMPAIGNID); //opens the editor for this campaign.
														}
													}
												}
											},'immutable');
										_app.model.dispatchThis('immutable');
										}
									}
								}
							},'immutable');
						
						_app.model.dispatchThis('immutable');
						}
					else	{} //validateForm handles error display.
					});
				},

//opens the ebay template in an editor
			showCampaignTemplateEditor : function($btn)	{
				$btn.button();
				$btn.off('click.showCampaignTemplateEditor').on('click.showCampaignTemplateEditor',function(){
					_app.ext.admin_template.a.showTemplateEditorInModal('campaign',{'campaignid':$btn.data('campaignid')})
					})
				}, //showTemplateEditorInModal

//clicked from campaign list row.
			adminCampaignUpdateShow : function($ele,P)	{
				var $table = $ele.closest('table');
				$table.stickytab({'tabtext':'campaigns','tabID':'campaignStickyTab'});
//make sure buttons and links in the stickytab content area close the sticktab on click. good usability.
				$('button, a, .lookLikeLink',$table).each(function(){
					$(this).off('close.stickytab').on('click.closeStickytab',function(){
						$table.stickytab('close');
						})
					})

				_app.ext.admin_customer.a.showCampaignEditor($(_app.u.jqSelector('#',_app.ext.admin.vars.tab+"Content")),$ele.closest('tr').data('campaignid'));
				},

//clicked within the campaign editor.
			adminCampaignUpdateExec : function($btn)	{
				$btn.button();
				$btn.off('click.adminCampaignUpdateExec').on('click.adminCampaignUpdateExec',function(){
				  _app.u.dump("BEGIN adminCampaignUpdateExec click event");
				  var $form = $btn.closest('form');
				  if(_app.u.validateForm($form))	{
				  
					  var
						  HTML = $("[name='HTML']",$form).val(),
						  campaignID = $("[name='CAMPAIGNID']").val();
				  
					  
				  //update the campaign.
					  _app.model.addDispatchToQ($.extend(true,{},$("[data-app-role='campaignSettings']",$form).serializeJSON({'cb':true}),{
						  '_cmd':'adminCampaignUpdate',
						  'CAMPAIGNID' : campaignID,
						  'RECIPIENTS' : _app.ext.admin_tools.u.pickerSelection2KVP($("[data-app-role='pickerContainer']",$form)),
						  '_tag':	{
							  'callback':'showMessaging',
							  'message' : 'Your campaign settings changes have been saved.',
							  jqObj : $form
							  }
						  }),'immutable');
				  
					  if (HTML != "") {
						  // no html changes for you!
						  }
					  else {
						  _app.model.addDispatchToQ({
							  '_cmd':'adminCampaignFileSave',
							  'FILENAME' : 'index.html',
							  'CAMPAIGNID' : campaignID,
							  'body' : HTML,
							  '_tag':	{
								  'callback':'showMessaging',
								  'message' : 'Your template changes have been saved.',
								  jqObj : $form
								  }
							  },'immutable');
						  }
				  //update the campaign Template
					  
				  
					  _app.model.dispatchThis('immutable');
				  
				  
				  
					  //run a macro here to save the non-message content based changes.
					  }
				  else	{
					  //validateform will handle error display.
					  }

					})
				},

			adminCampaignSendConfirm : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-arrowthick-1-e"},text: true});
				$btn.off('click.adminCampaignSendConfirm').on('click.adminCampaignSendConfirm',function(event){
					event.preventDefault();
					var 
						sfo = $btn.closest('form').serializeJSON({cb:true})

					_app.ext.admin.i.dialogConfirmRemove({
						"title" : "Start Campaign: "+sfo.CAMPAIGNID,
						"removeButtonText" : "Start Campaign",
						"message" : "Please confirm that you want to start the campaign: "+sfo.CAMPAIGNID+" from domain <b>"+_app.vars.domain+"<\/b>. There is no undo for this action.",
						'removeFunction':function(vars,$D){
							$D.showLoading({"message":"Sending Campaign "+sfo.CAMPAIGNID});
							_app.model.addDispatchToQ({
								'_cmd':'adminCampaignMacro',
								'CAMPAIGNID': sfo.CAMPAIGNID,
								'@updates' : ["CPGSTART"],
								'_tag':	{
									'callback':function(rd){
									$D.hideLoading();
									if(_app.model.responseHasErrors(rd)){
										$('#globalMessaging').anymessage({'message':rd});
										}
									else	{
										$D.dialog('close');
										_app.ext.admin_customer.a.showCampaignManager($(_app.u.jqSelector('#',_app.ext.admin.vars.tab+"Content")));
										}
									}
								}
							},'immutable');
							_app.model.dispatchThis('immutable');
							}
						});
					});
				
				}, //adminCampaignSendConfirm

			adminCampaignRemoveConfirm : function($ele,P)	{
				P.preventDefault();
				var 
					$tr = $ele.closest('tr'),
					data = $tr.data();

				_app.ext.admin.i.dialogConfirmRemove({
					"title" : "Delete Campaign: "+data.campaignid,
					"removeButtonText" : "Delete Campaign",
					"message" : "Please confirm that you want to delete the campaign: "+data.title+" ["+data.campaignid+"] . There is no undo for this action.",

					'removeFunction':function(vars,$D){
						$D.showLoading({"message":"Deleting Campaign "+data.campaignid});
						_app.model.addDispatchToQ({
							'_cmd':'adminCampaignRemove',
							'CAMPAIGNID': data.campaignid,
							'_tag':	{
								'callback':function(rd){
								$D.hideLoading();
								if(_app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									$D.dialog('close');
									$('#globalMessaging').anymessage(_app.u.successMsgObject('The campaign has been removed.'));
									$tr.empty().remove(); //removes row for list.
									}
								}
							}
						},'immutable');
						_app.model.dispatchThis('immutable');
						}
					});
				}, //adminCampaignRemoveConfirm


/*
//////////////////// 		CRM			 \\\\\\\\\\\\\\\\\\
*/

			crmAdminTicketDetailShow : function($ele,p)	{
				p.preventDefault();
				var	tktCode = $ele.closest("[data-tktcode]").data('tktcode');
				
				if(tktCode)	{
					$panel = _app.ext.admin.i.DMIPanelOpen($ele,{
						'templateID' : 'crmManagerTicketDetailTemplate',
						'panelID' : 'crmDetail_'+tktCode,
						'header' : 'Edit Ticket: '+tktCode,
						'showLoading':false
						}).attr('data-tktcode',tktCode);
					_app.u.handleButtons($panel);
					_app.model.addDispatchToQ({"_cmd":"adminAppTicketDetail","TKTCODE":tktCode,"_tag":{'callback':'anycontent','jqObj':$panel,'datapointer':'adminAppTicketDetail|'+tktCode,'translateOnly':true}},'mutable');						
					_app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_customer.e.crmAdminTicketDetailShow, unable to ascertain tktcode, which is required.","gMessage":true});
					}
				}, //crmAdminTicketDetailShow

			crmAdminTicketNoteAdd : function($ele,p)	{

				p.preventDefault();
				var
					$form = $ele.closest('form'),
					tktCode = $ele.closest("[data-tktcode]").data('tktcode'),
					sfo = $form.serializeJSON({'cb':true});
				
				$form.showLoading({'message':'Updating Ticket'});
				_app.ext.admin.calls.adminAppTicketMacro.init(tktCode,["ADDNOTE?"+$.param(sfo)],{'callback':function(rd){
					$form.hideLoading();
					if(_app.model.responseHasErrors(rd)){
						$form.anymessage({'message':rd});
						}
					else	{		
						$form.anymessage(_app.u.successMsgObject('The ticket has been updated.'));
						$('textarea',$form).val('');
						
						//adds an instance of the template to the history table to show the update took place.
						var $tr = _app.renderFunctions.createTemplateInstance('crmManagerTicketMsgRowTemplate',sfo);
						sfo.NOTE = sfo.note; //input is lowercase for macro. data-binds want uppercase.
						$tr.anycontent({data:sfo});
						$ele.closest('.ui-widget-anypanel').find("[data-app-role='ticketHistory'] tbody:first").append($tr);
						}
					}},'immutable');
				_app.model.dispatchThis('immutable');

				}, //appAdminTicketAddNote

			crmAdminTicketEscalationToggle : function($ele,p)	{

				var tktcode = $ele.closest("[data-tktcode]").data('tktcode');
				p.preventDefault();
				if(tktcode)	{
					$ele.button('disable');
					_app.ext.admin.calls.adminAppTicketMacro.init(tktcode,["UPDATE?escalate="+(_app.data['adminAppTicketDetail|'+tktcode].ESCALATED == 1 ? 0 : 1)],{'callback':function(rd){
						if(_app.model.responseHasErrors(rd)){
							_app.u.throwMessage(rd);
							}
						else	{		
							$ele.button('enable');
							_app.data['adminAppTicketDetail|'+tktcode].ESCALATED == 1 ? $ele.button({ label: "De-Escalate" }) : $ele.button({ label: "Escalate" });
							}
						}},'immutable');
						
					_app.model.destroy('adminAppTicketDetail|'+tktcode);
					_app.model.addDispatchToQ({"_cmd":"adminAppTicketDetail","TKTCODE":tktcode,"_tag":{'datapointer':'adminAppTicketDetail|'+tktcode}},'immutable');
					_app.model.dispatchThis('immutable');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_customer.e.crmAdminTicketEscalationToggle, unable to ascertain tktcode.","gMessage":true});
					}
				
				}, //appAdminTicketChangeEscalation

			crmAdminTicketClose : function($ele,p)	{
				p.preventDefault();
				var tktcode = $ele.closest("[data-tktcode]").data('tktcode');
				if(tktcode)	{
					_app.ext.admin.calls.adminAppTicketMacro.init(tktcode,["CLOSE"],{},'immutable');
					_app.model.dispatchThis('immutable');
					$btn.closest('.ui-widget-anypanel').anypanel('destroy');
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_customer.e.crmAdminTicketEscalationToggle, unable to ascertain tktcode.","gMessage":true});
					}
				}, //appAdminTicketClose

			crmAdminTicketCreateShow : function($ele,p)	{
				var $D = _app.ext.admin.i.dialogCreate({
					'title' : 'Create CRM Ticket',
					'templateID':'crmManagerTicketCreateTemplate',
					'data':$ele.data()
					});
				
				if($ele.data('suppress_dmi_update'))	{}
				else	{
					$('form',$D).append("<input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
					}
				
				$D.anyform();
				_app.u.handleButtons($D);
				$D.dialog('open');

				}, //appAdminTicketCreateShow

// still used in the order editor. When that is updated, use:  crmAdminTicketCreateShow
			appAdminTicketCreateShow : function($btn)	{
				$btn.button();
				$btn.off('click.appAdminTicketCreateShow').on('click.appAdminTicketCreateShow',function(event){
					event.preventDefault();
					$btn.data('suppress_dmi_update',true); //this old app event is only used outside the CRM manager, so enforce a 'no dmi update'.
					_app.ext.admin_customer.e.crmAdminTicketCreateShow($btn,event);
					});
				}, //appAdminTicketCreateShow

			appAdminTicketCreateExec : function($ele,P)	{
				P.preventDefault();
				var	$form = $ele.closest('form');
				if(_app.u.validateForm($form))	{
					var sfo = $form.serializeJSON();
					if(sfo.phone || sfo.email || sfo.orderid)	{
						$form.showLoading({'message':'Creating CRM Ticket'});
						_app.ext.admin.a.processForm($form,'immutable');
						_app.model.dispatchThis('immutable');
						}
					else	{
						$form.anymessage({'message':'Either email, phone or order ID is required for a ticket to be created','errtype':'youerr'});
						}
					}
				else	{
//validateForm will handle error display.						
					}
				}, //appAdminTicketCreateExec



//uses the new delegated events model. when reviews is upgraded, remove the _DE and update all the templates.
			adminProductReviewUpdateShow : function($ele,p)	{
				var
					RID = $ele.closest('tr').data('id'),
					PID = $ele.closest("[data-pid]").data('pid'),
					$panel;
				if($ele.data('edit-mode') == 'panel')	{
					$panel = _app.ext.admin.i.DMIPanelOpen($ele,{
						'templateID' : 'reviewAddUpdateTemplate',
						'panelID' : 'review_'+RID,
						'header' : 'Edit Review: '+RID,
						'handleAppEvents' : true,
						'data' : _app.data.adminProductReviewList['@REVIEWS'][$ele.closest('tr').data('obj_index')]
						});
					
					$('form',$panel).append("<input type='hidden' name='_tag/updateDMIList' value='"+$panel.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
					
					}
				else if($ele.data('edit-mode') == 'dialog')	{
					$panel = _app.ext.admin.i.dialogCreate({
						'title':'Edit Review',
						'templateID':'reviewAddUpdateTemplate',
						'data' : _app.data['adminProductReviewList|'+PID]['@REVIEWS'][$ele.closest('tr').data('obj_index')],
						'showLoading':false //will get passed into anycontent and disable showLoading.
						});
					$panel.dialog('open');
					}
				else	{
					
					$('#globalMessaging').anymessage({'message':'In admin_customer.e.adminProductReviewUpdateShow, invalid edit mode ['+$ele.data('edit-mode')+'] (must be dialog or panel) on button','gMessage':true});
					
					}
				
				if($panel)	{
					$("[name='PID']",$panel).closest('label').hide(); //product id isn't editable. hide it. setting 'disabled' will remove from serializeJSON.
					$('form',$panel).append("<input type='hidden' name='_cmd' value='adminProductReviewUpdate' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='RID' value='"+RID+"' /><input type='hidden' name='_tag/message' value='The review has been successfully updated.' />");
					}
				}, //adminProductReviewUpdateShow


/*/////////////////////////////				PRODUCT REVIEWS				\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/

			reviewRemoveConfirm : function($ele,p)	{
				var 
					$tr = $ele.closest('tr'),
					data = $tr.data(),
					$D = $ele.closest('.ui-dialog-content');

				_app.ext.admin.i.dialogConfirmRemove({'removeFunction':function(vars,$D){
					$D.showLoading({"message":"Deleting Review"});
					_app.model.addDispatchToQ({'RID':data.id,'PID':data.pid,'_cmd':'adminProductReviewRemove','_tag':{'callback':function(rd){
						$D.hideLoading();
						if(_app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							$D.dialog('close');
							$('#globalMessaging').anymessage(_app.u.successMsgObject('The review has been removed.'));
							$tr.empty().remove(); //removes row for list.
							}
						}}},'immutable');
				_app.model.dispatchThis('immutable');
					}});
				}, //reviewRemoveConfirm
			
			reviewCreateShow : function($ele,p)	{
					p.preventDefault();
					var $D = _app.ext.admin.i.dialogCreate({
						'title':'Add New Review',
						'templateID':'reviewAddUpdateTemplate',
						'showLoading':false //will get passed into anycontent and disable showLoading.
						});
					$D.dialog('open');
//These fields are used for processForm on save.
					$('form',$D).first().append("<input type='hidden' name='_cmd' value='adminProductReviewCreate' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/message' value='Thank you, your review has been created.' /><input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
					 $( ".applyDatepicker",$D).datepicker({
						changeMonth: true,
						changeYear: true,
						dateFormat : 'yymmdd'
						});

				}, //reviewCreateShow

			reviewApproveExec : function($ele,p)	{
				var
					$DMI = $ele.closest("[data-app-role='dualModeContainer']"),
					$tbody = $("[data-app-role='dualModeListTbody']",$DMI),
					i = 0;
					
				$tbody.find('tr').each(function(){
					var $tr = $(this);
					if($(':checkbox:first',$tr).is(':checked'))	{
						i += 1;
						_app.model.addDispatchToQ({'RID':$tr.data('id'),'PID':$tr.data('pid'),'_cmd':'adminProductReviewApprove'},'immutable');
						}
					}); // ends tr loop.
				
				
				if(i)	{
					$tbody.showLoading({'message':'Setting review status to approved for '+i+' review(s)'})
//reload the reviews manager.
_app.model.addDispatchToQ({'_cmd':'adminProductReviewList','filter':'UNAPPROVED','_tag' : {'datapointer':'adminProductReviewList','jqObj':$DMI,'callback':'DMIUpdateResults','extension':'admin'}},'immutable');
_app.model.dispatchThis('immutable');
				
					}
				else	{
					$('.dualModeListMessaging',$DMI).anymessage({'message':'Please check at least one checkbox below to approve the reviews.'})
					}
				}, //reviewApproveExec


/*/////////////////////////////				GIFTCARDS				\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/

			giftcardCreateShow : function($ele,P)	{
				P.preventDefault();
				var $D = _app.ext.admin_customer.u.getGiftcardCreateDialog();

//These fields are used for processForm on save.
//They're here instead of in the form directly so that the form/template can be recycled for edit.				
				$('form:first',$D).append("<input type='hidden' name='_cmd' value='adminGiftcardCreate' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/message' value='Thank you, your giftcard has been created.' /><input type='hidden' name='_tag/jqObjEmpty' value='true' /><input type='hidden' name='_tag/jqObjEmpty' value='true' /><input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' \/>");
				
				}, //giftcardCreateShow

			adminGiftcardUpdateShow : function($ele,P)	{
				P.preventDefault();
				if($ele.data('edit-mode'))	{
				  var
					  GCID = $ele.closest('tr').data('id'),
					  $panel;
				
				  if($ele.data('edit-mode') == 'dialog') {
					  
					  $panel = _app.ext.admin.i.dialogCreate({'title':'Edit Giftcard','templateID' : 'giftcardDetailTemplate','showLoading':false});
					  $panel.dialog('open');
					  }
				  else if($ele.data('edit-mode') == 'panel')	{
				
					  $panel = _app.ext.admin.i.DMIPanelOpen($ele,{
						  'templateID' : 'giftcardDetailTemplate',
						  'panelID' : 'giftcard_'+GCID,
						  'header' : 'Edit Giftcard: '+GCID,
						  'showLoading':false
						  });
				
					  }
				  else	{
					  $('#globalMessaging').anymessage({'message':'In admin_customer.giftcardDetailDMIPanl, invalid mode ['+$ele.data('edit-mode')+'] set on button.','gMessage':true})
					  }
				  
				  //panel will be blank if an invalid mode was set.
				  if($panel)	{
					$('form',$panel).showLoading({'message':'Fetching giftcard details'});
					_app.model.addDispatchToQ({
						'_cmd' : 'adminGiftcardDetail',
						'GCID' : GCID,
						'_tag' : {
						'callback':'anycontent',
						'jqObj':$('form',$panel),
						'applyEditTrackingToInputs' : true,
						'datapointer' : 'adminGiftcardDetail|'+GCID
						}
					},'mutable');
					_app.model.dispatchThis('mutable');
					  
					  }
				  
				  }
				else	{
				  $('#globalMessaging').anymessage({'message':'In admin_customer.giftcardDetailDMIPanl, no mode set on button.','gMessage':true})
				  }
				
				}, //adminGiftcardUpdateShow


/*/////////////////////////////				CUSTOMER 				\\\\\\\\\\\\\\\\\\\\\\\\\\\\\*/

//executed within the customer create form to validate form and create user.
			execAdminCustomerCreate : function($ele,P)	{
					P.preventDefault();
					var $form = $ele.closest('form');
					
					if(_app.u.validateForm($form))	{
						var updates = new Array(),
						formObj = $form.serializeJSON();
						
						$form.showLoading({'message':'Creating customer record'});
						//_app.u.dump(" -> formObj: "); _app.u.dump(formObj);
						
						updates.push("CREATE?email="+formObj.email); //setting email @ create is required.
						if(formObj.firstname)	{updates.push("SET?firstname="+formObj.firstname);}
						if(formObj.lastname)	{updates.push("SET?lastname="+formObj.lastname);}
						// *** 201402 -> macro ID for passwordreset changed to PASSWORD-SET
						if(formObj.generatepassword)	{
							updates.push("PASSWORD-SET?password=");
							updates.push("BLAST-SEND?MSGID=CUSTOMER.PASSWORD.RECOVER");
							} //generate a random password
						
						// $('body').showLoading("Creating customer record for "+formObj.email);
						_app.model.addDispatchToQ({
							'_cmd':'adminCustomerCreate',
							'CID' : 0, //create wants a zero customer id
							'@updates' : updates,
							'_tag':	{
								'datapointer' : 'adminCustomerCreate',
								'callback': function(rd){
									$form.hideLoading();
									if(_app.model.responseHasErrors(rd)){
										$('#globalMessaging').anymessage({'message':rd});
										}
									else	{
										$('#customerUpdateModal').dialog('close');
										$('.dualModeListMessaging',_app.u.jqSelector('#',_app.ext.admin.vars.tab+"Content")).empty();
										_app.ext.admin_customer.a.showCustomerEditor($('.dualModeListContent',_app.u.jqSelector('#',_app.ext.admin.vars.tab+"Content")),{'CID':_app.data[rd.datapointer].CID})
										}
									}
								}
							},'immutable');
						_app.model.dispatchThis('immutable');

						}
					else	{
						//the validation function puts the errors next to the necessary fields
						}

				}, //execAdminCustomerCreate


//saves all the changes to a customer editor
			execCustomerEditorSave : function($ele,P)	{
				P.preventDefault();
				var $form = $ele.closest('form'),
				macros = new Array(),
				CID = $ele.closest("[data-cid]").data('cid'),
				//					wholesale = "", //wholesale and general are used to concatonate the KvP for any changed fields within that panel. used to build macro
				//					dropshipAddrUpdate = false, //set to true if address update is present. sends entire address, not just changed fields.
				general = "";
				
				if(CID)	{
//used to determine whether or not the val sent to the API should be a 1 (checked) or 0 (unchecked). necessary for something checked being unchecked.
					function handleCheckbox($tag)	{
						if($tag.is(':checked'))	{return 1}
						else	{return 0}
						}

//find all the elements that have been edited. In most cases, this is the input itself.
//the exception to this would be a 'row' which has been deleted. could be a wallet, address or a note
					$('.edited').each(function(){
						
						var $tag = $(this),
						$panel = $tag.closest('.panel')
						pr = $panel.data('app-role'); //shortcut.  panel role
//if the tag is a tr, this is a 'delete'
						if($tag.is('tr'))	{
//if one of the buttons in this row has the error class, then a delete is occuring. Currently, the only other edit option in a row is set to default.
//however, you would never need to do both delete and set as default, so only perform one or the other, prioritizing with delete.
							if($("button.ui-state-error",$tag).length > 0)	{
								if(pr == 'ship' || pr == 'bill')	{
									macros.push("ADDRREMOVE?TYPE="+pr.toUpperCase()+"&SHORTCUT="+$tag.data('_id'));
									}
								else if(pr == 'wallets')	{
									macros.push("WALLETREMOVE?SECUREID="+$tag.data('wi'));
									}
								else if(pr == 'notes')	{
									macros.push("NOTEREMOVE?NOTEID="+$tag.data('id'));
									}
								else	{
									$panel.anymessage({'message':'In admin_customer.e.customerEditorSave, unrecognized panel role for a remove action.'});
									}
								}
							else if($("button.ui-state-highlight",$tag).length > 0)	{
								if(pr == 'ship' || pr == 'bill')	{
//must pass entire address object any time addrupdate occurs.
									var addr = _app.ext.admin_customer.u.getAddressByID(_app.data['adminCustomerDetail|'+CID]['@'+pr.toUpperCase()],$tag.data('_id'));
//these two aren't needed. nuke em.
									delete addr['_is_default'];
									delete addr['_id'];
//strip bill_ ship_ off of front.
									for(var index in addr)	{
										addr[index.substring(5)] = addr[index];
										delete addr[index];
										}
//set as default.
									addr['DEFAULT'] = 1;
//pretty sure the API wants TYPE and SHORTCUT to be on the front of this macro.
									macros.push("ADDRUPDATE?TYPE="+pr.toUpperCase()+"&SHORTCUT="+$tag.data('_id')+"&"+decodeURIComponent($.param(addr)));
									}
								else if(pr == 'wallets')	{
									macros.push("WALLETDEFAULT?SECUREID="+$tag.data('id'));
									}
								else	{
									$panel.anymessage({'message':'In admin_customer.e.customerEditorSave, unsupported panel role ['+pr+'] used for set default.'});
									}
								}
							else	{
								$panel.anymessage({'message':'In admin_customer.e.customerEditorSave, unable to determine action for update to this panel.'});
								}
							}
						else if($tag.is('input') || $tag.is('select'))	{
							
							if(pr == 'general')	{
								general += $tag.attr('name')+"="+($tag.is(":checkbox") ? handleCheckbox($tag) : $tag.val())+"&"; //val of checkbox is 'on'. change to 1.
								}
							else if(pr == 'newsletter')	{
								general += $tag.attr('name')+"="+handleCheckbox($tag)+"&";
								}
							else if(pr == 'organization')	{
	//								_app.u.dump(" -> orgid being set to: "+$tag.val());
									macros.push("LINKORG?orgid="+$tag.val());
									}
							else	{
								$panel.anymessage({'message':'In admin_customer.e.adminEditorSave, panel role ['+pr+'] not an expected type'});
								}

							}
						else	{
							$panel.anymessage({'message':'In admin_customer.e.customerEditorSave, unexpected update type (not input or tr).'});
							}
						}); // ends .edited each()


						if(general != '')	{
							if(general.charAt(general.length-1) == '&')	{general = general.substring(0, general.length - 1)} //strip trailing ampersand.
							macros.push("SET?"+general);
							}						
						
						if(macros.length)	{
//							_app.u.dump(" -> MACROS: "); _app.u.dump(macros);
							var $custManager = $ele.closest("[data-app-role='customerManager']").parent();
							$custManager.showLoading({'message':'Saving changes to customer record.'});
//get a clean copy of the customer record so that the notes panel can be updated.
							_app.ext.admin.calls.adminCustomerUpdate.init(CID,macros,{'callback':function(rd){
								$custManager.hideLoading();
								if(_app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									
									$custManager.empty();
									_app.ext.admin_customer.a.showCustomerEditor($custManager,{'CID':CID})
									}
								}},'immutable');
							_app.model.destroy('adminCustomerDetail|'+CID);
							_app.ext.admin.calls.adminCustomerDetail.init({'CID':CID,'rewards':1,'wallets':1,'tickets':1,'notes':1,'events':1,'orders':1,'giftcards':1,'organization':1},{},'immutable');
							_app.model.dispatchThis('immutable');
							}
						else	{
							$ele.closest('form').anymessage({'message':'In admin_customer.e.customerEditorSave, no recognizable fields were present.',gMessage:true});
							}					
					}
				else	{
					$ele.closest('form').anymessage({'message':'In admin_customer.e.execCustomerEditorSave, unable to ascertain CID.','gMessage':true});
					}
				}, //customerEditorSave

			refreshCustomerPanel : function($ele,p){
				var panel = $ele.data('panel');
				if(panel)	{
					var $editor = $("[data-app-role='customerManager']",$(_app.u.jqSelector('#',_app.ext.admin.vars.tab+"Content")));
//					_app.u.dump(" -> $editor.length: "+$editor.length); _app.u.dump($editor.data());
					var $panel = $("[data-app-role='"+panel+"']:first",$editor);
					_app.u.dump("$panel.length: "+$panel.length);
					//clear any table body contents. they're generated w/ lists and if not cleared, they'll double up.
					$("tbody:first",$panel).empty();

					_app.model.destroy('adminCustomerDetail|'+$editor.data('cid'));
					_app.ext.admin.calls.adminCustomerDetail.init({'CID':$editor.data('cid'),'rewards':1,'wallets':1,'tickets':1,'notes':1,'events':1,'orders':1,'giftcards':1,'organization':1},{
						'callback' : 'anycontent',
						'jqObj' : $panel
						},'mutable');
					_app.model.dispatchThis('mutable');
					}
				else	{
					$("#globalMessaging").anymessage({"message":"In admin_customer.e.refreshCustomerPanel, data('panel') not set on trigger element.","gMessage":true});
					}
				},


			execCustomerRemove : function($ele,P)	{
				P.preventDefault();
				var CID = $ele.closest('[data-cid]').data('cid');
				if(CID)	{
//params also support anything in dialogCreate
					var $D = _app.ext.admin.i.dialogConfirmRemove({
						message : "Are you sure you want to delete this Customer? There is no undo for this action.",
						title : "Delete Customer Record",
						removeButtonText : "Delete Customer",
						removeFunction : function()	{
							$D.parent().showLoading({"message":"Deleting Customer"});
							_app.model.destroy('adminCustomerDetail|'+CID); //nuke this so the customer editor can't be opened for a nonexistant org.
							_app.model.addDispatchToQ({
								'_cmd':'adminCustomerRemove',
								'CID' : CID,
								'_tag':	{
									'datapointer' : 'adminCustomerRemove',
									'callback':function(rd){
										$D.parent().hideLoading();
										if(_app.model.responseHasErrors(rd)){$D.anymessage({'message':rd})}
										else	{
											$(".defaultText",$D).hide(); //clear the default message.
											$D.anymessage(_app.u.successMsgObject('The customer has been removed.'));
											$D.dialog( "option", "buttons", [ {text: 'Close', click: function(){$D.dialog('close')}} ] );
											_app.ext.admin_customer.a.showCustomerManager();
											}
										}
									}
								},'immutable');
							_app.model.dispatchThis('immutable');
							}
						});

					}
				else	{
					$ele.closest('form').anymessage({'message':'In admin_customer.e.execCustomerEditorSave, unable to ascertain CID.','gMessage':true});
					}
				}, //execCustomerRemove

//run when searching the customer manager for a customer.
			execCustomerSearch : function($ele,P){
				P.preventDefault();

				var
					$custManager = $ele.closest("[data-app-role='dualModeContainer']"),
					$resultsTable = $("[data-app-role='dualModeResultsTable']",$custManager).first(),
					$editorContainer = $("[data-app-role='dualModeDetailContainer']",$custManager).first(),
					$form = $("[data-app-role='customerSearch']",$custManager).first(),
					formObj = $form.serializeJSON();
				
				if(_app.u.validateForm($form))	{
					$custManager.showLoading({"message":"Searching Customers"});
					formObj._cmd = 'adminCustomerSearch'
					formObj._tag = {
						'datapointer' : 'adminCustomerSearch',
						'callback' : function(rd){
							$custManager.hideLoading();
							$('.dualModeListMessaging',$custManager).empty();
							if(_app.model.responseHasErrors(rd)){
								$('.dualModeListMessaging',$custManager).anymessage({'message':rd});
								}
							else	{
								//if there was only 1 result, the API returns just that CID. open that customer.
								if(_app.data[rd.datapointer] && _app.data[rd.datapointer].CID && (_app.data[rd.datapointer].PRT == _app.vars.partition))	{
									$resultsTable.hide();
									$editorContainer.show();
									_app.ext.admin_customer.a.showCustomerEditor($editorContainer,{'CID':_app.data[rd.datapointer].CID});
									}
								else if(_app.data[rd.datapointer] && _app.data[rd.datapointer]['@CUSTOMERS'] && _app.data[rd.datapointer]['@CUSTOMERS'].length)	{
									$resultsTable.show();
									$editorContainer.hide();	
									$("tbody",$resultsTable).empty(); //clear any previous customer search results.
									$resultsTable.anycontent({datapointer:rd.datapointer}); //show results
									_app.u.handleButtons($resultsTable);
									$("tbody tr",$resultsTable).each(function(){
										var $tr = $(this);
										if($tr.data('prt') == _app.vars.partition)	{
											$('td:first',$tr).addClass('lookLikeLink').attr('data-app-click','admin_customer|adminCustomerUpdateShow');
											}
										else	{
											$("button[data-app-role='customerEditButton']:first",$tr).button('disable').attr('title','Only customers for the partition in focus can be edited.');
											}
										});
									$resultsTable.anytable();
									}
								else	{
									$('.dualModeListMessaging',$custManager).anymessage({'message':'No customers matched that search. Please try again.<br />Searches are partition specific, so if you can not find this user on this partition, switch to one of your other partitions','persistent':true});
									}
								}
							}
						}
					_app.model.addDispatchToQ(formObj,"mutable");
					_app.model.dispatchThis("mutable");					
					}
				else	{
					//validateForm handles error display.
					}
				}, //execCustomerSearch

			execHintReset : function($ele,P)	{

				P.preventDefault();
				var $modal = $("#customerUpdateModal").empty().dialog('open'),
				CID = $ele.closest("[data-cid]").data('cid');
				
				$modal.html("<p class='clearfix marginBottom'>Please confirm that you want to reset this customers password hint. There is no undo.<\/p>");
				
				
				$("<button \/>").text('Cancel').addClass('floatLeft').button().on('click',function(){
					$modal.dialog('close');
					}).appendTo($modal);
			
				$("<button \/>").text('Confirm').addClass('floatRight').button().on('click',function(){
					$modal.showLoading({'message':'Updating customer record...'});
					_app.ext.admin.calls.adminCustomerUpdate.init(CID,["HINTRESET"],{'callback':function(rd){
						$modal.hideLoading();
						if(_app.model.responseHasErrors(rd)){
							$modal.anymessage({'message':rd});
							}
						else	{
							$modal.empty().anymessage({'message':'Thank you, the hint has been reset.','iconClass':'ui-icon-z-success','persistent':true})
							}
						}},'immutable');
						_app.model.dispatchThis('immutable');
					
					}).appendTo($modal);
		
				}, //execHintReset
				
			passwordChangeShow : function($ele,P)	{
				P.preventDefault();
				var $D = _app.ext.admin.i.dialogCreate({
					title : "Change Password",
					templateID : 'customerPasswordChangeTemplate',
					showLoading : false,
					anycontent : false, //the dialogCreate params are passed into anycontent
					handleAppEvents : false //defaults to true
					});
				$D.tlc({'verb':'translate','dataset':{'CID':$ele.closest("[data-cid]").data('cid')}});
				$D.dialog('open');
				},
				//used in the customer editor to allow merchants to generate a temporary password. This would allow the merchant to log in AS the customer without changing their password.
			passwordCreateTemporaryExec : function($ele,P)	{
				P.preventDefault();
				if($ele.hasClass('ui-button'))	{$ele.button('disable')} //prevent double-click.
			
				_app.model.addDispatchToQ({"_cmd":"adminCustomerUpdate","CID":$ele.closest("[data-cid]").data('cid'),"@updates":["PASSWORD-RECOVER"],"_tag":{
					"datapointer":"adminCustomerUpdate",
					"callback":function(rd){
						if($ele.hasClass('ui-button'))	{$ele.button('enable')} //prevent double-click.
						if(_app.model.responseHasErrors(rd)){
							$ele.closest("[data-app-role='passwordButtonContainer']").anymessage({'message':rd});
							}
						else	{
							//sample action. success would go here.
							if(_app.u.thisNestedExists("data."+rd.datapointer+".PASSWORD-RECOVER.password",_app))	{
								$ele.closest("[data-app-role='passwordButtonContainer']").anymessage({
									'errtype':'success','iconClass':'app-icon-success',
									'message' : 'Temporary password generated: '+_app.data[rd.datapointer]['PASSWORD-RECOVER'].password,
									'persistent' : true,
									'msgType' : 'success'
									});
								delete _app.data[rd.datapointer]; //no sense keeping this around.
								}
							else	{
								$ele.closest("[data-app-role='passwordButtonContainer']").anymessage({'message':'The call succeeded as expected, but the response format did not contain the temporary password as expected.','gMessage':true});
								}
							}
						}
					}},"mutable");
				_app.model.dispatchThis("mutable");
				//for success messaging: 
				},

			execNoteCreate : function($ele,P)	{
				P.preventDefault();
				var note = $ele.parent().find("[name='noteText']").val(),
				$panel = $ele.closest('.panel'),
				CID = $ele.closest("[data-cid]").data('cid');
				
				if(CID && note)	{
					$panel.showLoading({'message':'Adding note to customer record'});
					_app.ext.admin.calls.adminCustomerUpdate.init(CID,["NOTECREATE?TXT="+encodeURIComponent(note)],{'callback':function(rd){
						//update notes panel or show errors.
						$panel.hideLoading();
						if(_app.model.responseHasErrors(rd)){
							$panel.anymessage({'message':rd});
							}
						else	{
							$("tbody",$panel).empty(); //clear all existing notes.
							$("input",$panel).val(''); //empty notes input(s).
							$panel.anycontent({'datapointer' : 'adminCustomerDetail|'+CID});
							_app.u.handleButtons($panel);
							}
						
						}},'immutable');
//get a clean copy of the customer record so that the notes panel can be updated.
					_app.model.destroy('adminCustomerDetail|'+CID);
					_app.ext.admin.calls.adminCustomerDetail.init({'CID':CID,'rewards':1,'wallets':1,'tickets':1,'notes':1,'events':1,'orders':1,'giftcards':1,'organization':1},{},'immutable');
					_app.model.dispatchThis('immutable');
					}
				else if(!CID)	{
					$ele.closest('fieldset').anymessage({'message':'In admin_customer.e.execNoteCreate, unable to determine customer ID','gMessage':true});
					}
				else	{
					$ele.closest('fieldset').anymessage({'message':'Please enter a note to save.','errtype':'youerr'});
					}
				}, //execNoteCreate

//used in the wholesale ui
			adminCustomerSearchShowUI : function($ele,p)	{
				if($ele.data('scope') && $ele.data('searchfor'))	{
					navigateTo("/ext/admin_customer/showCustomerManager",{'scope':$ele.data('scope'),'searchfor':$ele.data('searchfor')});
					}
				else	{
					$("#globalMessaging").anymessage({"message":"In admin_customer.e.adminCustomerSearchShowUI, no data-scope ["+$ele.data('scope')+"] and/or data-searchfor  ["+$ele.data('searchfor')+"] set on trigger element.","gMessage":true});
					}
				},

			showAddrUpdate : function($ele,P){
				P.preventDefault();
				var
					addrType = $ele.closest("[data-address-type]").attr('data-address-type'), //@SHIP or @BILL. how it's referenced in the customer object.
					addrTypeTrimd = addrType.toLowerCase().substring(1), //ship or bill. how addressCreateUpdateShow wants type formatted.
					CID = $ele.closest('.panel').data('cid'),
					index = Number($ele.closest('tr').data('obj_index')); // set by process list. is the index of this address in the customer bill/ship address array.
			
				_app.ext.admin_customer.a.addressCreateUpdateShow({
					'mode' : 'update', //will b create or update.
					'show' : 'dialog',
					'TYPE' : addrTypeTrimd,
					'CID' : CID
					},function(v){
						var $panel = $ele.closest(".ui-widget-anypanel"); //ship or bill panel.
						$("tbody",$panel).empty(); //clear address rows so new can be added.
						$panel.anycontent({'data' : _app.data['adminCustomerDetail|'+v.CID]}); //translate panel, which add all addresses.
						_app.u.handleButtons($panel);
						},_app.data['adminCustomerDetail|'+CID][addrType][index]).anyform({'trackEdits':true});
				}, //showAddrUpdate

//executed on a button to show the customer create form.
			adminCustomerCreateShow : function($ele,P)	{
				_app.ext.admin_customer.a.showCustomerCreateModal();
				}, //adminCustomerCreateShow

			adminCustomerUpdateShow : function($ele,P)	{
				P.preventDefault();
				var $dualModeContainer = $ele.closest("[data-app-role='dualModeContainer']")
				$("[data-app-role='dualModeResultsTable']",$dualModeContainer).hide();
				$("[data-app-role='dualModeDetailContainer']",$dualModeContainer).show();
				_app.ext.admin_customer.a.showCustomerEditor($("[data-app-role='dualModeDetailContainer']",$dualModeContainer),{'CID':$ele.closest("[data-cid]").data('cid')});
				}, //adminCustomerUpdateShow

			saveOrgToField : function($cb)	{
				$cb.off('change.saveOrgToField').on('change.saveOrgToField',function(){
					var
						$context = $("[data-app-role='customerManager']:visible").first(),
						$orgidInput = $("[name='ORGID']",$context);
//when a checkbox is clicked, close the modal, set the val of the orgid input and then trigger the change handler so the save button is clickable.
					$orgidInput.val($cb.closest('tr').data('orgid'));
					$orgidInput.toggleClass('edited');
					_app.ext.admin_customer.u.handleChanges($context);
					$cb.closest('.ui-dialog-content').dialog('close');
					})
				
				}, //saveOrgToField

			showBlastTool : function($ele,P)	{
				P.preventDefault();
				var CID = $ele.closest("[data-cid]").data('cid');
				if(CID && _app.data['adminCustomerDetail|'+CID])	{
					_app.ext.admin_blast.u.showBlastToolInDialog({'OBJECT':'CUSTOMER','PRT':_app.data['adminCustomerDetail|'+CID]._PRT,'EMAIL':_app.data['adminCustomerDetail|'+CID]._EMAIL,'RECEIVER':'CUSTOMER','CID':CID});
					}
				else	{
					$("#globalMessaging").anymessage({"message":"In admin_customer.e.showBlastTool, unable to ascertain CID ["+CID+"] or customer record not in memory.","gMessage":true});
					}
				
//				_app.ext.admin.a.showMailTool({'listType':'CUSTOMER','partition':_app.vars.partition,'CID':$ele.closest("[data-cid]").data('cid')});
				}, //showMailTool

			showOrgChooser : function($ele,P)	{
				P.preventDefault();
				var $D = _app.ext.admin.i.dialogCreate({
					title : "Organization Chooser",
					anycontent : true, //the dialogCreate params are passed into anycontent
					'templateID':'organizationManagerPageTemplate',
					'data':{},
					handleAppEvents : false //defaults to true
					});
				var $DMI = _app.ext.admin.i.DMICreate($D,{
					'header' : 'Organization Chooser',
					'className' : 'organizationChooser', //applies a class on the DMI, which allows for css overriding for specific use cases.
					'thead' : ['','ID','Company','Domain','Email','Account Manager','Billing Phone','Billing Contact',''], //leave blank at end if last row is buttons.
					'tbodyDatabind' : "var: tickets(@ORGANIZATIONS); format:processList; loadsTemplate:organizationManagerChooserRowTemplate;",
					'controls' : _app.templates.orgManagerControls,
					'cmdVars' : {
						'_cmd' : 'adminCustomerOrganizationSearch',
						'PHONE' : '', //update by changing $([data-app-role="dualModeContainer"]).data('cmdVars').STATUS
						'limit' : '50', //not supported for every call yet.
						'_tag' : {
							'datapointer':'adminCustomerOrganizationSearch'
							}
						}
					});
				_app.u.handleButtons($D.anyform());
				$D.dialog('open');
				// do not fetch templates at this point. That's a heavy call and they may not be used.
				_app.model.dispatchThis();
				}, //showOrgChooser

			adminCustomerWalletPeekShow : function($ele,P)	{
				P.preventDefault();
				var CID = $ele.closest("[data-cid]").data('cid'), secureID = $ele.closest('tr').data('wi');
				if(CID && secureID)	{
					var $D = _app.ext.admin.i.dialogCreate({'title':'Wallet Peek','showLoading':false});
					$D.dialog('open');
					$D.showLoading({"message":'Fetching Wallet Details'});
					_app.model.addDispatchToQ({
						'_cmd':'adminCustomerWalletPeek',
						'CID' : $ele.closest("[data-cid]").data('cid'),
						'SECUREID' : $ele.closest('tr').data('wi'),
						'_tag':	{
							'datapointer' : 'adminCustomerWalletPeek',
							'callback':function(rd) {
								$D.hideLoading();
								if(_app.model.responseHasErrors(rd)){
									$D.anymessage({'message':rd});
									}
								else	{
									//success content goes here.
									$D.append("<div>CC: "+_app.data[rd.datapointer].CC+"<\/div>");
									$D.append("<div>MM: "+_app.data[rd.datapointer].MM+"<\/div>");
									$D.append("<div>YY: "+_app.data[rd.datapointer].YY+"<\/div>");
									}
								}
							}
						},'mutable');
					_app.model.dispatchThis('mutable');
					}
				else	{
					$ele.closest('fieldset').anymessage({'message':'In admin_customer.e.adminCustoemrWalletPeekShow, unable to ascertain either the customer id ['+$ele.closest("[data-cid]").data('cid')+'] and/or the wallet/secure id ['+$ele.closest('tr').data('wi')+'].','gMessage':true});
					}

				}, //showWalletDetail

			customerEditorModalShow : function($ele)	{
				var CID = $ele.attr('data-cid');
				if(CID)	{
					var $D = _app.ext.admin.i.dialogCreate({title:'Edit Customer Record: '+CID});
					_app.ext.admin_customer.a.showCustomerEditor($D,{'CID':CID});
					$D.dialog('option','height',500);
					$D.dialog('open');
					}
				else	{
					$('#globalMessaging').anymessage({"message": "In admin_customer.e.customerEditorModalShow, data-cid not set on trigger element","gMessage":true});
					}
				}, //orderCustomerEdit

			faqTopicAddNewShow : function($ele,P)	{
				P.preventDefault();
				var $D = _app.ext.admin.i.dialogCreate({
					title : "Create a new FAQ Topic",
					showLoading : false,
					anycontent : false, //the dialogCreate params are passed into anycontent
					handleAppEvents : false //defaults to true
					});
				
				$D.append("<form><input type='text' data-input-keyup='format' data-input-format='alphanumeric,uppercase' name='TITLE' \/><br \/><\/form>");
				$D.anyform();
				$("<button \/>").text('save').button().on('click',function(event){
					event.preventDefault();
					_app.model.addDispatchToQ({"_cmd":"adminFAQMacro","@updates":["TOPIC-CREATE?TITLE="+encodeURIComponent($("input[name='TITLE']",$D).val())],"_tag":{"datapointer":"","callback":function(rd){
						if(_app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							//sample action. success would go here.
							$('#globalMessaging').anymessage(_app.u.successMsgObject('Topic has been created.'));
							$D.dialog('close');
							}
						}}},"mutable");
					_app.model.addDispatchToQ({"_cmd":"adminFAQList","_tag":{"datapointer":"adminFAQList"}},"mutable"); //update this in memory so that panels show appropriate content.
					_app.model.dispatchThis("mutable");
					
					}).appendTo($('form',$D));
				$D.dialog('option','width',250);
				$D.dialog('open');
				},
			
			faqQuestionAddNewShow : function($ele,P)	{
				P.preventDefault();
				var $D = _app.ext.admin.i.dialogCreate({
					title : "Create a new FAQ",
					'templateID' : 'faqAddUpdateTemplate',
					showLoading : false,
					anycontent : false, //the dialogCreate params are passed into anycontent
					handleAppEvents : false //defaults to true
					});
				$('form',$D).append("<input type='hidden' name='_macrobuilder' value='admin_customer|adminFAQMacro' /><input type='hidden' name='verb' value='FAQ-CREATE' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/message' value='The faq has been created.' /><input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
				$D.dialog('open');
				$D.tlc({'verb':'translate','dataset':_app.data['adminFAQList']});
				
				},
			
			faqQuestionDeleteConfirm : function($ele,P)	{
				var faqid = $ele.closest('tr').data('id');
				var $D = _app.ext.admin.i.dialogConfirmRemove({
					"message" : "Are you sure you want to delete faq "+faqid+"? There is no undo for this action.",
					"removeButtonText" : "Remove", //will default if blank
					"title" : "Remove faq "+faqid, //will default if blank
					removeFunction : function()	{
						_app.model.addDispatchToQ({"_cmd":"adminFAQRemove","ID":faqid,"_tag":{"callback":function(rd){
							//if the macro has a panel open, close it.
							var $panel = $(_app.u.jqSelector('#','faq_'+faqid));
							if($panel.length)	{
								$panel.anypanel('destroy'); //make sure there is no editor for this warehouse still open.
								}
							$D.dialog('close'); 
							$("#globalMessaging").anymessage({"message":"The faq has been deleted.","errtype":"success"});
							//hide the row. no need to refresh the whole list.
							$ele.closest('tr').slideUp();
							}}},"immutable");
						_app.model.dispatchThis("immutable");
						}
					});
				},

			faqQuestionUpdateShow : function($ele,P)	{
				var faqid = $ele.closest('tr').data('faq_id');
				var $panel = _app.ext.admin.i.DMIPanelOpen($ele,{
					'templateID' : 'faqAddUpdateTemplate',
					'panelID' : 'faq_'+faqid,
					'header' : 'Edit faq: '+faqid,
					'handleAppEvents' : false,
					'data' : {}
					});
				$panel.tlc({'verb':'translate','dataset':$.extend({},_app.ext.admin.u.getValueByKeyFromArray(_app.data['adminFAQList']['@FAQS'],'FAQ_ID',faqid),{'@TOPICS':_app.data['adminFAQList']['@TOPICS']})});
				$('form',$panel).append("<input type='hidden' name='_macrobuilder' value='admin_customer|adminFAQMacro' /><input type='hidden' name='verb' value='FAQ-UPDATE' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/message' value='The faq has been updated.' /><input type='hidden' name='_tag/updateDMIList' value='"+$ele.closest("[data-app-role='dualModeContainer']").attr('id')+"' />");
				_app.u.handleCommonPlugins($panel);
				_app.u.handleButtons($panel);
				$panel.anyform({'trackEdits':true});
				}


			} //e [app Events]
		} //r object.
	return r;
	}