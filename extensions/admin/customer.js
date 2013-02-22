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





var admin_customer = function() {
	var theseTemplates = new Array('customerSearchResultsTemplate','CustomerPageTemplate','customerEditorTemplate','customerEditorTicketListTemplate','customerEditorGiftcardListTemplate','customerEditorWalletListTemplate','customerEditorAddressListTemplate','customerEditorNoteListTemplate','customerAddressAddUpdateTemplate','customerEditorOrderListTemplate','customerWalletAddTemplate','customerCreateTemplate');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = true; //return false if extension won't load for some reason (account config, dependencies, etc).

				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/customer.html',theseTemplates);
//				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/customer.css','user_styles']);

				var $modal = $("<div \/>",{'id':'customerUpdateModal'}).appendTo('body'); //used for various update/add features.
				$modal.dialog({'autoOpen':false,'width':500,'height':500,'modal':true});
				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
//This is how the task manager is opened. Just execute this function.
// later, we may add the ability to load directly into 'edit' mode and open a specific user. not supported just yet.
			showCustomerManager : function() {
				var $target = $(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content"));
				$target.empty();
				$target.anycontent({'templateID':'CustomerPageTemplate','showLoading':false}); //clear contents and add help interface
				app.ext.admin.u.handleAppEvents($target);

				}, //showCustomerManager

//in obj, currently only CID is present (and required). but most likely, PRT will be here soon.
			showCustomerEditor : function($target,obj)	{
				
				if($target && typeof $target == 'object')	{
					if(obj && obj.CID)	{
						$target.showLoading({"message":"Fetching Customer Record"});
						app.ext.admin.calls.adminNewsletterList.init({},'mutable');
						app.ext.admin.calls.adminWholesaleScheduleList.init({},'mutable');
						app.ext.admin.calls.adminCustomerDetail.init({'CID':obj.CID,'rewards':1,'wallets':1,'tickets':1,'notes':1,'events':1,'orders':1,'giftcards':1},{'callback':function(rd){
$target.hideLoading();

if(app.model.responseHasErrors(rd)){
	app.u.throwMessage(rd);
	}
else	{
	$target.anycontent({'templateID':'customerEditorTemplate','data':app.data[rd.datapointer],'dataAttribs':obj});
	
	var panArr = app.ext.admin.u.dpsGet('admin_customer','editorPanelOrder'); //panel Array for ordering.

	if(!$.isEmptyObject(panArr))	{
//		app.u.dump(" -> panArr: "); app.u.dump(panArr);
		var L = panArr.length;

//yes, I know loops in loops are bad. But these are very small loops.
//this will resort the panels into the order specified in local storage.
		for(var i = 0; i < L; i += 1)	{
			var $col = $("[data-app-column='"+(i+1)+"']",$target);
			for(index in panArr[i])	{
				$("[data-app-role='"+panArr[i][index]+"']",$target).first().appendTo($col);
				}
			}
		}

//make into anypanels.
	$("div.panel",$target).each(function(){
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
			app.ext.admin.u.dpsSet('admin_customer','editorPanelOrder',dataObj); //update the localStorage session var.
//			app.u.dump(' -> dataObj: '); app.u.dump(dataObj);
			}
		});

//add an onchange that adds the edited class, which is what the handleChanges function uses to count the # of changes.
//for textboxes, toggle the class on/off. That way if a checkbox is turned off, then back on, the change count is accurate.	
	$("input",$target).each(function(){
		if($(this).is(':checkbox'))	{
			$(this).off('change.trackChange').on('change.trackChange',function(){
				$(this).toggleClass('edited');
				app.ext.admin_customer.u.handleChanges($target);
				});			
			}
		else if($(this).hasClass('skipTrack')){} //notes, for example, is independant.
		else	{
			$(this).off('keyup.trackChange').one('keyup.trackChange',function(){
				$(this).addClass('edited');
				app.ext.admin_customer.u.handleChanges($target);
				});
			}
		});

	app.ext.admin.u.handleAppEvents($target);
	$("table.gridTable thead",$target).parent().anytable();
	$("[type='checkbox']",$target).parent().anycb();
	app.ext.admin_customer.u.handleAnypanelButtons($target,obj);
	
							}},'mutable');
						app.model.dispatchThis('mutable');
						}
					else	{
						$target.anymessage({"message":"In admin_customer.a.showCustomerEditor, CID was not passed"});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_customer.a.showCustomerEditor, $target is blank or not an object."});
					}
				}, //showCustomerEditor

//obj should contain CID. likely will include partition soon too.
			showAddWalletModal : function(obj)	{
				var $target = $('#customerUpdateModal').empty();
				$('.ui-dialog-title',$target.parent()).text('Add a new wallet');
				$target.dialog('open');
				if(obj && obj.CID)	{
					$target.anycontent({'templateID':'customerWalletAddTemplate','showLoading':false,'dataAttribs':obj});
					app.ext.admin.u.handleAppEvents($target);
					}
				else	{
					$target.anymessage({'message':'In admin_customer.a.showAddWalletModal, no CID defined.',gMessage:true});
					}
				},

			showCustomerCreateModal : function(){
				var $target = $('#customerUpdateModal').empty();
				$('.ui-dialog-title',$target.parent()).text('Add a new customer'); //blank the title bar so old title doesn't show up if error occurs
				$target.anycontent({'templateID':'customerCreateTemplate','showLoading':false});
				app.ext.admin.u.handleAppEvents($target);
				$target.dialog('open');
				},

//obj required params are cid, type (bill or ship)
			showAddAddressModal : function(obj){
				var $target = $('#customerUpdateModal').empty();
				$('.ui-dialog-title',$target.parent()).text(''); //blank the title bar so old title doesn't show up if error occurs
				$target.dialog('open');
				
				if(obj && obj.CID && obj.type)	{
					$('.ui-dialog-title',$target.parent()).text('Add a new '+obj.type.substring(0).toLowerCase()+' customer address');
					$target.anycontent({'templateID':'customerAddressAddUpdateTemplate','showLoading':false});
				
					if(obj.type == '@SHIP')	{
						$("[type='email']",$target).parent().empty().remove();
						}
					else if(app.data["adminCustomerDetail|"+obj.CID] && app.data["adminCustomerDetail|"+obj.CID]._EMAIL )	{
						$("[type='email']",$target).val(app.data["adminCustomerDetail|"+obj.CID]._EMAIL); //populate email address w/ default.
						}
					else	{}
					
					var $form = $('form',$target).first(),
					$btn = $("<button \/>").text('Add Address').button().on('click',function(event){
						event.preventDefault();
						
						app.ext.admin_customer.u.customerAddressAddUpdate($form,'ADDRCREATE',obj,function(rd){
							$form.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$target.anymessage({'message':rd});
								}
							else	{
								$target.empty().anymessage({'message':'Thank you, the address has been added'});
								}
							});
						});

					$form.append($btn);

					}
				else	{
					$target.anymessage({'message':'In admin_customer.a.showAddAddressInModal, either CID ['+obj.CID+'] or type ['+obj.type+'] is not set.','gMessage':true});
					}
				
				}
			
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
//will generate a select list of wholesale schedules
//if the customer is already on a schedule, their schedule will be pre-selected.
//generates the select list too, instead of just the options, so that error messaging can be handled in a good manner.
//the customer object is what's passed in here.
			wholesaleScheduleSelect : function($tag,data)	{
				if(!app.data.adminWholesaleScheduleList)	{$tag.anymessage({'message':'Unable to fetch wholesale list'})}
				else if(!app.data.adminWholesaleScheduleList['@SCHEDULES'])	{
					$tag.anymessage({'message':'You have not created any schedules yet.'})
					}
				else if(!data.value)	{$tag.anymessage({'message':'No data passed into wholesaleScheduleSelect renderFormat'})}
				else	{
					var $select = $("<select \/>",{'name':'SCHEDULE'}),
					schedules =app.data.adminWholesaleScheduleList['@SCHEDULES'], //shortcut
					L = app.data.adminWholesaleScheduleList['@SCHEDULES'].length
					list = null;
					$select.append($("<option \/>",{'value':''}).text('none'));
					for(var i = 0; i < L; i += 1)	{
						$select.append($("<option \/>",{'value':schedules[i].id}).text(schedules[i].id));
						}
					
					$select.appendTo($tag);
					
					if(data.value.INFO && data.value.INFO.SCHEDULE)	{$select.val(data.value.INFO.SCHEDULE)} //preselect schedule, if set.
					
					}
				}, //wholesaleScheduleSelect
				
			orderHistoryTotal : function($tag,data)	{
				app.u.dump("BEGIN admin_customer.renderFormat.orderHistoryTotal");
				var L = data.value.length,
				sum = 0; //sum of all orders combined.
				for(var i = 0; i < L; i += 1)	{
					sum += Number(data.value[i].ORDER_TOTAL);
					}
				data.value = sum; //preserve data object except data.value. that way other params, such as currency symbol, can still be set.
				app.renderFormats.money($tag,data)
				},
				
			newsletters : function($tag,data)	{
				
				if(!app.data.adminNewsletterList)	{$tag.anymessage({'message':'Unable to fetch newsletter list'})}
				else if(app.data.adminNewsletterList['@lists'].length == 0)	{
					$tag.anymessage({'message':'You have not created any subscriber lists.','persistant':true})
					}
				else	{
					var $f = $("<fieldset \/>"),
					L = app.data.adminNewsletterList['@lists'].length,
					listbw = data.value.INFO.NEWSLETTER; //list bitwise. just a shortcut.
//					app.u.dump(" -> binary of dINFO.NEWSLETTER ["+data.value.INFO.NEWSLETTER+"]: "+Number(data.value.INFO.NEWSLETTER).toString(2));
					for(var i = 0; i < L; i += 1)	{
						if(app.data.adminNewsletterList['@lists'][i].NAME)	{
						$("<label \/>").append($("<input \/>",{
							'type':'checkbox',
							'name':'newsletter_'+app.data.adminNewsletterList['@lists'][i].ID
							}).prop('checked',app.ext.admin_customer.u.getNewslettersTF(listbw,Number(app.data.adminNewsletterList['@lists'][i].ID)))).append(app.data.adminNewsletterList['@lists'][i].NAME + " [prt: "+app.data.adminNewsletterList['@lists'][i].PRT+"]").appendTo($f);
							}
						else	{} //do nothing in this case. It's a newsletter w/ no name (likely the bitwise not appropriated yet)
						}
					$f.appendTo($tag);
					}
				
				} //newsletters

			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
//run after a form input on the page has changed. updates the 'numChanges' class to indicate # of changes and enable parent button.
			handleChanges : function($target)	{
				var numChanges = $('.edited',$target).length;
				if(numChanges)	{
					$('.numChanges',$target).text(numChanges).parents('button').addClass('ui-state-highlight').button('enable');
					}
				else	{
					$('.numChanges',$target).text("").parents('button').removeClass('ui-state-highlight').button('disable');
					}
				}, //handleChanges
			
//adds the extra buttons to each of the panels.
//obj should include obj.CID
			handleAnypanelButtons : function($target,obj){
				if($target && typeof $target == 'object')	{
					if(obj.CID)	{
						$('.panel_ship',$target).anypanel('option','settingsMenu',{'Add Address':function(){
							app.ext.admin_customer.a.showAddAddressModal({type:'@SHIP','CID':obj.CID});
							}});

						$('.panel_bill',$target).anypanel('option','settingsMenu',{'Add Address':function(){
							app.ext.admin_customer.a.showAddAddressModal({type:'@BILL','CID':obj.CID});
							}});

						$("[data-app-role='wallets']",$target).anypanel('option','settingsMenu',{'Add Wallet':function(){
							app.ext.admin_customer.a.showAddWalletModal(obj);
							}});

						$("[data-app-role='giftcards']",$target).anypanel('option','settingsMenu',{'Add a Giftcard':function(){
							navigateTo('/biz/manage/giftcard/index.cgi?VERB=CREATE&CID='+obj.CID,{dialog:true});
							}});

						$("[data-app-role='tickets']",$target).anypanel('option','settingsMenu',{'Start a New Ticket':function(){
							navigateTo('/biz/crm/index.cgi?VERB=CREATE&CID='+obj.CID,{dialog:true});
							}});					

						}
					else	{
						$target.anymessage({'message':'In admin_customer.u.handleAnypanelButtons, CID not passed.','gMessage':true});
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
					if(app.ext.admin.u.validateForm($form))	{
						app.u.dump(" -> form validated. proceed.");
						$form.showLoading({"message":"Updating customer address record."});
						var formObj = $form.serializeJSON();
						
						app.ext.admin.calls.adminCustomerUpdate.init(obj.CID,[MACRO+"?"+encodeURIComponent(formObj)],{'callback':callback},'immutable');
//destroy and detail must occur after update
						app.model.destroy('adminCustomerDetail|'+obj.CID);
						app.ext.admin.calls.adminCustomerDetail.init({'CID':obj.CID},{},'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{
						$form.anymessage({'message':'Some required fields were missing or left blank.'})
						}
					}
				else	{
					$('#globalMessaging').anymessage({'message':'In admin_customer.u.customerAddressAddUpdate, either $form, customerID or macro not passed.'});
					}
				}, //customerAddressAddUpdate


//The flags field in the order is an integer. The binary representation of that int (bitwise and) will tell us what flags are enabled.
			getNewslettersTF : function(newsint,val)	{
				B = Number(newsint).toString(2); //binary
//				app.u.dump(" -> Binary of flags: "+B);
				return B.charAt(val - 1) == 1 ? true : false; //1
				},

			}, //u [utilities]

		e : {

//executed within the customer create form to validate form and create user.
			execAdminCustomerCreate : function($btn)	{
				$btn.button().off('click.execAdminCustomerCreate').on('click.execAdminCustomerCreate',function(event){
					event.preventDefault();
					var $form = $btn.closest('form');
					
					if(app.ext.admin.u.validateForm($form))	{
var updates = new Array(),
formObj = $form.serializeJSON();

//app.u.dump(" -> formObj: "); app.u.dump(formObj);

updates.push("CREATE?email="+formObj.email);
if(formObj.firstname)	{updates.push("SET?firstname="+formObj.firstname);}
if(formObj.lastname)	{updates.push("SET?lastname="+formObj.lastname);}
if(formObj.generatepassword)	{updates.push("PASSWORDRESET?password=");} //generate a random password

// $('body').showLoading("Creating customer record for "+formObj.email);
app.ext.admin.calls.adminCustomerCreate.init(updates,{});
app.model.dispatchThis('immutable');

						}
					else	{
						//the validation function puts the errors next to the necessary fields
						}

					});;
				},

//saves all the changes to a customer editor
			execCustomerEditorSave : function($btn)	{
				$btn.button();
				$btn.off('click.customerEditorSave').on('click.customerEditorSave',function(event){
					event.preventDefault();
					var $form = $btn.closest('form'),
					macros = new Array(),
					CID = $btn.closest("[data-cid]").data('cid'),
					wholesale = "", //wholesale, dropship and general are used to concatonate the KvP for any changed fields within that panel. used to build macro
					dropship = "",
					general = "";

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
									macros.push("WALLETREMOVE?SECUREID="+$tag.data('id'));
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
									macros.push("ADDRUPDATE?TYPE="+pr.toUpperCase()+"&SHORTCUT="+$tag.data('_id')+"&default=1");
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
						else if($tag.is('input'))	{
							if($tag.attr('name') == 'password')	{
								macros.push("PASSWORDRESET?password="+$tag.val());
								}
							else if(pr == 'general')	{
								general += $tag.attr('name')+"="+($tag.is(":checkbox") ? handleCheckbox($tag) : $tag.val())+"&"; //val of checkbox is 'on'. change to 1.
								}
							else if(pr == 'newsletter')	{
								general += $tag.attr('name')+"="+handleCheckbox($tag);
								}
							else if(pr == 'dropship')	{
								dropship += $tag.attr('name')+"="+($tag.is(":checkbox") ? handleCheckbox($tag) : $tag.val())+"&"; //val of checkbox is 'on'. change to 1.
								}
							else if(pr == 'wholesale')	{
								wholesale += $tag.attr('name')+"="+($tag.is(":checkbox") ? handleCheckbox($tag) : $tag.val())+"&";  //val of checkbox is 'on'. change to 1.
								}
							else	{
								$panel.anymessage({'message':'In admin_customer.e.adminEditorSave, panel role ['+pr+'] not an expected type'});
								}

							}
						else	{
							$panel.anymessage({'message':'In admin_customer.e.customerEditorSave, unexpected update type (not input or tr).'});
							}
						}); // ends .edited each()



						if(wholesale != '')	{
							if(wholesale.charAt(wholesale.length-1) == '&')	{wholesale = wholesale.substring(0, wholesale.length - 1)} //strip trailing ampersand.
							macros.push("WSSET?"+wholesale);
							}

						if(dropship != '')	{
							if(dropship.charAt(dropship.length-1) == '&')	{dropship = dropship.substring(0, dropship.length - 1)} //strip trailing ampersand.
							macros.push("ADDRUPDATE?TYPE=WS&"+dropship);
							}						


						if(general != '')	{
							if(general.charAt(general.length-1) == '&')	{general = general.substring(0, general.length - 1)} //strip trailing ampersand.
							macros.push("SET?"+general);
							}						
						
						if(macros.length)	{
//							app.u.dump(" -> MACROS: "); app.u.dump(macros);
							$('body').showLoading({'message':'Saving changes to cutomer record.'});
//get a clean copy of the customer record so that the notes panel can be updated.
							app.ext.admin.calls.adminCustomerUpdate.init(CID,macros,{'callback':function(rd){
								$('body').hideLoading();
								if(app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									var $parent = $btn.closest("[data-app-role='customerManager']").parent();
									$parent.empty();
									app.ext.admin_customer.a.showCustomerEditor($parent,{'CID':CID})
									}
								}},'immutable');
							app.model.destroy('adminCustomerDetail|'+CID);
							app.ext.admin.calls.adminCustomerDetail.init({'CID':CID},{},'immutable');
							app.model.dispatchThis('immutable');
							}
						else	{
							$btn.closest('form').anymessage({'message':'In admin_customer.e.customerEditorSave, no recognizable fields were present.',gMessage:true});
							}
					});
				}, //customerEditorSave

//run when searching the customer manager for a customer.
			execCustomerSearch : function($btn){
				$btn.button({icons: {primary: "ui-icon-search"},text: false});
				$btn.off('click.customerSearch').on('click.customerSearch',function(event){
					event.preventDefault();

					var $parent = $btn.closest("[data-app-role='dualModeContainer']"),
					$form = $("[data-app-role='customerSearch']",$parent).first(),
					formObj = $form.serializeJSON(),
					$target = $('.dualModeListContent',$parent).first();
					
					$target.empty(); //make sure any previously open customers are cleared.
					$parent.showLoading({"message":"Searching for "+formObj.email});
//					app.u.dump(" -> formObj: "); app.u.dump(formObj);
					app.ext.admin.calls.adminCustomerSearch.init(formObj.email,{callback:function(rd){
						$parent.hideLoading();
						
$('.dualModeListMessaging',$parent).empty();
if(app.model.responseHasErrors(rd)){
	$parent.anymessage({'message':rd});
	}
else	{
	if(app.data[rd.datapointer] && app.data[rd.datapointer].CID)	{
		app.ext.admin_customer.a.showCustomerEditor($target,{'CID':app.data[rd.datapointer].CID});
		}
	else	{
		$('.dualModeListMessaging',$parent).anymessage({'message':'No customers matched that email address. Please try again.<br />Searches are partition specific, so if you can not find this user on this partition, switch to one of your other partitions','persistant':true});
		}
	}
						}},'mutable');
					app.model.dispatchThis();

					});
				}, //execCustomerSearch

			execHintReset : function($btn)	{
				$btn.button();
				$btn.off('click.hintReset').on('click.hintReset',function(event){
					event.preventDefault();
					var $target = $("#customerUpdateModal").empty().dialog('open'),
					CID = $btn.closest("[data-cid]").data('cid');
					
					$target.html("<p class='clearfix marginBottom'>Please confirm that you want to reset this customers password hint. There is no undo.<\/p>");
					
					
					$("<button \/>").text('Cancel').addClass('floatLeft').button().on('click',function(){
						$target.dialog('close');
						}).appendTo($target);
				
					$("<button \/>").text('Confirm').addClass('floatRight').button().on('click',function(){
						$target.showLoading({'message':'Updating customer record...'});
						app.ext.admin.calls.adminCustomerUpdate.init(CID,["HINTRESET"],{'callback':function(rd){
							$target.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$target.anymessage({'message':rd});
								}
							else	{
								$target.empty().anymessage({'message':'Thank you, the hint has been reset.','iconClass':'ui-icon-z-success','persistant':true})
								}
							}},'immutable');
							app.model.dispatchThis('immutable');
						
						}).appendTo($target);

					});				
				}, //execHintReset

			execNoteCreate : function($btn)	{
				$btn.button();
				$btn.button('disable');
				$btn.off('click.noteCreate').on('click.noteCreate',function(event){
					event.preventDefault();
					var note = $btn.parent().find("[name='noteText']").val(),
					$parent = $btn.closest('.panel'),
					CID = $btn.closest("[data-cid]").data('cid');
					
					if(CID && note)	{
						$parent.showLoading({'message':'Adding note to customer record'});
						app.ext.admin.calls.adminCustomerUpdate.init(CID,["NOTECREATE?TXT="+encodeURIComponent(note)],{'callback':function(rd){
							//update notes panel or show errors.
							$parent.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$parent.anymessage({'message':rd});
								}
							else	{
								$("tbody",$parent).empty(); //clear all existing notes.
								$("input",$parent).val(''); //empty notes input(s).
								$parent.anycontent({'datapointer' : 'adminCustomerDetail|'+CID});
								app.ext.admin.u.handleAppEvents($parent);
								}
							
							}},'immutable');
//get a clean copy of the customer record so that the notes panel can be updated.
						app.model.destroy('adminCustomerDetail|'+CID);
						app.ext.admin.calls.adminCustomerDetail.init({'CID':CID},{},'immutable');
						app.model.dispatchThis('immutable');
						}
					else if(!CID)	{
						$btn.closest('fieldset').anymessage({'message':'In admin_customer.e.execNoteCreate, unable to determine customer ID','gMessage':true});
						}
					else	{
						$btn.closest('fieldset').anymessage({'message':'Please enter a note to save.','errtype':'youerr'});
						}
					});
				},

			execWalletCreate : function($btn)	{
				$btn.button();
				$btn.off('click.walletCreate').on('click.walletCreate',function(event){
					event.preventDefault();
					
					var $form = $btn.closest('form'),
					CID = $btn.closest("[data-cid]").data('cid');
					
					if(!CID)	{
						$form.anymessage({'message':'in admin_customer.e.walletCreate, could not determine CID.','gMessage':true});
						}
					else if(app.ext.admin.u.validateForm($form))	{
						$form.showLoading({'message':'Adding wallet to customer record.'});
						app.ext.admin.calls.adminCustomerUpdate.init(["WALLETCREATE?"+encodeURIComponent($form.serializeJSON())],{'callback':function(){
							$form.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$form.anymessage({'message':rd});
								}
							else	{
								$form.parent().empty().anymessage({'message':'Thank you, the wallet has been added','errtype':'success'});
								}
							}},'immutable');
						app.model.dispatchThis('immutable');
						}
					else	{
						$form.anymessage({'message':'Please enter all the fields below.'});
						}
					});
				}, //execWalletCreate

//used for both addresses and wallets.
			tagRowForIsDefault : function($btn){
				$btn.button({icons: {primary: "ui-icon-check"},text: false});

				if($btn.closest('tr').data('_is_default') == 1)	{$btn.addClass('ui-state-highlight')}

				$btn.off('click.customerEditorSave').on('click.customerEditorSave',function(event){
					event.preventDefault();

//if the button is already hightlighted, unhighlight. default is being de-selected.
//the highlight class is also used in the validation (customerEditorSave) so if the class is changed, be sure to update the save function.
					if($btn.hasClass('ui-state-highlight'))	{
						$btn.removeClass('ui-state-highlight');
						$btn.closest('tr').removeClass('edited');
						}
					else	{
						$btn.closest('table').find('button.ui-state-highlight').removeClass('ui-state-highlight'); //un-default the other buttons.
						$btn.addClass('ui-state-highlight'); //flag as default.
						$btn.closest('tr').addClass('edited');
						}
					app.ext.admin_customer.u.handleChanges($btn.closest("form")); //update save button.
					});
				}, //tagRowForIsDefault

//use this on any delete button that is in a table row and that does NOT automatically delete, but just queue's it.
//the ui-state-error class is also used in the 'customerEditorSave' function, so be sure to update both if the classname changes.
			tagRowForRemove : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-circle-close"},text: false});
				$btn.off('click.customerAddressRemove').on('click.customerAddressRemove',function(event){
					event.preventDefault();
					
//if this class is already present, the button is set for delete already. unset the delete.
//added to the tr since that's where all the data() is, used in the save. If class destination changes, update customerEditorSave app event function.
					if($btn.hasClass('ui-state-error'))	{
						$btn.removeClass('ui-state-error').parents('tr').removeClass('edited').find('button').each(function(){
							$(this).button('enable')
							}); //enable the other buttons
						$btn.button('enable');
						}
					else	{
//adding the 'edited' class does NOT change the row, but does let the save changes button record the accurate # of updates.
						$btn.addClass('ui-state-error').parents('tr').addClass('edited').find('button').each(function(){
							$(this).button('disable')
							}); //disable the other buttons
						$btn.button('enable');

						}
					app.ext.admin_customer.u.handleChanges($btn.closest("form"));
					});
				}, //tagRowForRemove

			tagNoteButtonAsEnabled : function($ele)	{
				$ele.off('keyup.tagNoteButtonAsEnabled'); //remove old event so nuking val doesn't trigger change code.
				$ele.val(''); //reset value. panel has events re-run after note added. this clears the last note.
				$ele.one('keyup.tagNoteButtonAsEnabled',function(){
					$ele.parent().find("[data-app-event='admin_customer|execNoteCreate']").button('enable').addClass('ui-state-highlight');
					});
				},

			showAddrUpdate : function($btn){
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				$btn.off('click.customerEditorSave').on('click.customerEditorSave',function(event){
					event.preventDefault();
					var $target = $('#customerUpdateModal').empty(),
					$parent = $btn.closest('.ui-widget-anypanel');
					
					app.u.dump(" -> $parent.length: "+$parent.length);
					
					$('.ui-dialog-title',$target.parent()).text('Update customer address');
					$target.dialog('open');
					
					var CID = $(this).closest('.panel').data('cid'),
					type = $btn.closest("[data-address-type]").data('address-type'),
					index = Number($btn.closest('tr').data('obj_index'));
					
					if(CID && index >= 0 && type)	{
						$target.anycontent({'templateID':'customerAddressAddUpdateTemplate','showLoading':false,data:app.data['adminCustomerDetail|'+CID][type][index]});

						$("[name='SHORTCUT']",$target).attr('disabled','disabled').parent().append('not editable'); //once created, the shortcut is not editable.

						if(type == '@SHIP')	{
							$("[type='email']",$target).parent().empty().remove();
							}

						var $button = $("<button \/>").text('Save Address').button().on('click',function(event){
							event.preventDefault();
							var $form = $('form',$target);
							app.ext.admin_customer.u.customerAddressAddUpdate($form,'ADDRUPDATE',{'CID':CID,'type':type},function(rd){
								$form.hideLoading();
								if(app.model.responseHasErrors(rd)){
									$target.anymessage({'message':rd});
									}
								else	{
									$target.empty().anymessage({'message':'Thank you, the address has been changed','persistant':true});
									//clear existing addresses and re-render.
									$("tbody",$parent).empty();
									$parent.anycontent({'datapointer' : 'adminCustomerDetail|'+CID});
									app.ext.admin.u.handleAppEvents($parent);
									
									}
								});
							});						
						$target.append($button);
						}
					else	{
						$target.anymessage({'message':'In admin_customer.e.customerAddressUpdate, unable to determine CID ['+CID+'] or address type ['+type+'] or address index ['+index+']',gMessage:true});
						}
					});
				}, //showAddrUpdate

//executed on a button to show the customer create form.
			showCustomerCreate : function($btn)	{
				
				$btn.button().off('click.showCustomerCreate').on('click.showCustomerCreate',function(event){
					event.preventDefault();
					app.ext.admin_customer.a.showCustomerCreateModal();
					});
				
				}, //showCustomerCreate

//not in use yet. will show wallet details.
			showWalletDetail : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-check"},text: false});

				$btn.off('click.showWalletDetail').on('click.showWalletDetail',function(event){
					event.preventDefault();
					});				
				} //showWalletDetail


			} //e [app Events]
		} //r object.
	return r;
	}