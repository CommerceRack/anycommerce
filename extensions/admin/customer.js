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
	var theseTemplates = new Array('customerManagerResultsRowTemplate','CustomerPageTemplate','customerEditorTemplate','customerEditorTicketListTemplate','customerEditorGiftcardListTemplate','customerEditorWalletListTemplate','customerEditorAddressListTemplate','customerEditorNoteListTemplate','customerAddressAddUpdateTemplate','customerEditorOrderListTemplate','customerWalletAddTemplate','customerCreateTemplate','organizationManagerChooserRowTemplate');
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
				var $tabContent = $(app.u.jqSelector('#',app.ext.admin.vars.tab+"Content"));
				$tabContent.empty();
				$tabContent.anycontent({'templateID':'CustomerPageTemplate','showLoading':false}); //clear contents and add help interface
				app.ext.admin.u.handleAppEvents($tabContent);
				}, //showCustomerManager

//in obj, currently only CID is present (and required). but most likely, PRT will be here soon.
			showCustomerEditor : function($custEditorTarget,obj)	{
				
				if($custEditorTarget && typeof $custEditorTarget == 'object')	{
					$custEditorTarget.empty();
					if(obj && obj.CID)	{
						$custEditorTarget.showLoading({"message":"Fetching Customer Record"});
						app.ext.admin.calls.adminEmailList.init({'TYPE':'CUSTOMER','PRT':app.vars.partition},{},'mutable');
						app.ext.admin.calls.adminNewsletterList.init({},'mutable');
//						app.ext.admin.calls.adminWholesaleScheduleList.init({},'mutable');
						app.ext.admin.calls.adminCustomerDetail.init({'CID':obj.CID,'rewards':1,'wallets':1,'tickets':1,'notes':1,'events':1,'orders':1,'giftcards':1,'organization':1},{'callback':function(rd){
$custEditorTarget.hideLoading();

if(app.model.responseHasErrors(rd)){
	app.u.throwMessage(rd);
	}
else	{
	$custEditorTarget.anycontent({'templateID':'customerEditorTemplate','data':app.data[rd.datapointer],'dataAttribs':obj});
	
	var panArr = app.ext.admin.u.dpsGet('admin_customer','editorPanelOrder'); //panel Array for ordering.

	if(!$.isEmptyObject(panArr))	{
//		app.u.dump(" -> panArr: "); app.u.dump(panArr);
		var L = panArr.length;

//yes, I know loops in loops are bad. But these are very small loops.
//this will resort the panels into the order specified in local storage.
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
			app.ext.admin.u.dpsSet('admin_customer','editorPanelOrder',dataObj); //update the localStorage session var.
//			app.u.dump(' -> dataObj: '); app.u.dump(dataObj);
			}
		});

//add an onchange that adds the edited class, which is what the handleChanges function uses to count the # of changes.
//for textboxes, toggle the class on/off. That way if a checkbox is turned off, then back on, the change count is accurate.	
	$("input",$custEditorTarget).each(function(){
		if($(this).is(':checkbox'))	{
			$(this).off('change.trackChange').on('change.trackChange',function(){
				$(this).toggleClass('edited');
				app.ext.admin_customer.u.handleChanges($custEditorTarget);
				});			
			}
		else if($(this).hasClass('skipTrack')){} //notes, for example, is independant.
//logo value changed with JS, which doesn't trigger keyup code. It's run through medialib.
		else if($(this).attr('name') == 'LOGO')	{
			$(this).off('change.trackChange').one('change.trackChange',function(){
				$(this).addClass('edited');
				app.ext.admin_customer.u.handleChanges($custEditorTarget);
				});			
			}
		else	{
			$(this).off('keyup.trackChange').one('keyup.trackChange',function(){
				$(this).addClass('edited');
				app.ext.admin_customer.u.handleChanges($custEditorTarget);
				});
			}

		});

	app.ext.admin.u.handleAppEvents($custEditorTarget);
	$("table.gridTable thead",$custEditorTarget).parent().anytable();
	$("[type='checkbox']",$custEditorTarget).parent().anycb();
	app.ext.admin_customer.u.handleAnypanelButtons($custEditorTarget,obj);
	
							}},'mutable');
						app.model.dispatchThis('mutable');
						}
					else	{
						$custEditorTarget.anymessage({"message":"In admin_customer.a.showCustomerEditor, CID was not passed"});
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_customer.a.showCustomerEditor, $custEditorTarget is blank or not an object."});
					}
				}, //showCustomerEditor

//obj should contain CID. likely will include partition soon too.
			showAddWalletModal : function(obj,$walletPanel)	{
				var $modal = $('#customerUpdateModal').empty();
				$('.ui-dialog-title',$modal.parent()).text('Add a new wallet');
				$modal.dialog('open');
				if(obj && obj.CID)	{
					$modal.anycontent({'templateID':'customerWalletAddTemplate','showLoading':false,'dataAttribs':obj});
					app.u.handleAppEvents($modal,{'$context':$walletPanel});
					}
				else	{
					$modal.anymessage({'message':'In admin_customer.a.showAddWalletModal, no CID defined.',gMessage:true});
					}
				}, //showAddWalletModal

			showCustomerCreateModal : function(){
				var $modal = $('#customerUpdateModal').empty();
				$('.ui-dialog-title',$modal.parent()).text('Add a new customer'); //blank the title bar so old title doesn't show up if error occurs
				$modal.anycontent({'templateID':'customerCreateTemplate','showLoading':false});
				app.ext.admin.u.handleAppEvents($modal);
				$modal.dialog('open');
				},

//obj required params are cid, type (bill or ship)
			showAddAddressModal : function(obj,$customerEditor){
				var $modal = $('#customerUpdateModal').empty();
				$('.ui-dialog-title',$modal.parent()).text(''); //blank the title bar so old title doesn't show up if error occurs
				$modal.dialog('open');
				
				if(obj && obj.CID && obj.type)	{
					$('.ui-dialog-title',$modal.parent()).text('Add a new '+obj.type.substring(0).toLowerCase()+' customer address');
					$modal.anycontent({'templateID':'customerAddressAddUpdateTemplate','showLoading':false});
					$("[name='TYPE']",$modal).val(obj.type.toUpperCase().substring(1)); //val is @ship or @bill and needs to be SHIP or BILL
					if(obj.type == '@SHIP')	{
						$("[type='email']",$modal).parent().empty().remove();
						}
					else if(app.data["adminCustomerDetail|"+obj.CID] && app.data["adminCustomerDetail|"+obj.CID]._EMAIL )	{
						$("[type='email']",$modal).val(app.data["adminCustomerDetail|"+obj.CID]._EMAIL); //populate email address w/ default.
						}
					else	{}
					
					var $form = $('form',$modal).first(),
					$btn = $("<button \/>").text('Add Address').button().on('click',function(event){
						event.preventDefault();
						app.model.destroy('adminCustomerDetail|'+obj.CID);
						app.ext.admin_customer.u.customerAddressAddUpdate($form,'ADDRCREATE',obj,function(rd){
							$form.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$modal.anymessage({'message':rd});
								}
							else	{
								$modal.empty().anymessage({'message':'Thank you, the address has been added','persistent':true});
								//clear existing addresses and re-render.
								var $panel = $("[data-app-role='"+obj.type.substring(1).toLowerCase()+"']",$customerEditor); //ship or bill panel.
								app.u.dump(" -> $panel.length: "+$panel.length);
								app.u.dump(" -> $customerEditor.length: "+$customerEditor.length);
								$("tbody",$panel).empty(); //clear address rows so new can be added.
								$panel.anycontent({'data' : app.data[rd.datapointer]['%CUSTOMER']}); //translate panel, which add all addresses.
								app.data['adminCustomerDetail|'+obj.CID] = app.data[rd.datapointer]['%CUSTOMER'];
								delete app.data[rd.datapointer]; //get rid of this so pointer between customerDetail and customerUpdate is dropped.
								app.ext.admin.u.handleAppEvents($panel);
								}
							});
						});

					$form.append($btn);

					}
				else	{
					$modal.anymessage({'message':'In admin_customer.a.showAddAddressInModal, either CID ['+obj.CID+'] or type ['+obj.type+'] is not set.','gMessage':true});
					}
				
				}
			
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
//will generate a select list of wholesale schedules
//if the customer is already on a schedule, their schedule will be pre-selected.
//generates the select list too, instead of just the options, so that error messaging can be handled in a good manner.
//the customer object is what's passed in here.
/*			wholesaleScheduleSelect : function($tag,data)	{
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
					$select.on('change',function(){
						$select.addClass('edited');
						app.ext.admin_customer.u.handleChanges($select.closest("form"));
						});
					
					if(data.value.INFO && data.value.INFO.SCHEDULE)	{$select.val(data.value.INFO.SCHEDULE)} //preselect schedule, if set.
					
					}
				}, //wholesaleScheduleSelect
				*/
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
					$tag.anymessage({'message':'You have not created any subscriber lists.','persistent':true})
					}
				else	{
					var $f = $("<fieldset \/>"),
					L = app.data.adminNewsletterList['@lists'].length,
					listbw = null; //list bitwise. just a shortcut.
					if(data.value.INFO && data.value.INFO.NEWSLETTER)	{listbw = data.value.INFO.NEWSLETTER}
//					app.u.dump(" -> binary of dINFO.NEWSLETTER ["+data.value.INFO.NEWSLETTER+"]: "+Number(data.value.INFO.NEWSLETTER).toString(2));
					for(var i = 0; i < L; i += 1)	{
						if(app.data.adminNewsletterList['@lists'][i].NAME)	{
						$("<label \/>").addClass('clearfix').append($("<input \/>",{
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
			handleChanges : function($customerEditor)	{
				var numChanges = $('.edited',$customerEditor).length;
				if(numChanges)	{
					$('.numChanges',$customerEditor).text(numChanges).parents('button').addClass('ui-state-highlight').button('enable');
					}
				else	{
					$('.numChanges',$customerEditor).text("").parents('button').removeClass('ui-state-highlight').button('disable');
					}
				}, //handleChanges
			
//adds the extra buttons to each of the panels.
//obj should include obj.CID
			handleAnypanelButtons : function($customerEditor,obj){
				if($customerEditor && typeof $customerEditor == 'object')	{
					if(obj.CID)	{
						$('.panel_ship',$customerEditor).anypanel('option','settingsMenu',{'Add Address':function(){
							app.ext.admin_customer.a.showAddAddressModal({type:'@SHIP','CID':obj.CID},$customerEditor);
							}});

						$('.panel_bill',$customerEditor).anypanel('option','settingsMenu',{'Add Address':function(){
							app.ext.admin_customer.a.showAddAddressModal({type:'@BILL','CID':obj.CID},$customerEditor);
							}});

						$("[data-app-role='wallets']",$customerEditor).anypanel('option','settingsMenu',{'Add Wallet':function(){
							app.ext.admin_customer.a.showAddWalletModal(obj,$("[data-app-role='wallets']",$customerEditor));
							}});

						$("[data-app-role='giftcards']",$customerEditor).anypanel('option','settingsMenu',{'Add a Giftcard':function(){
							navigateTo('/biz/manage/giftcard/index.cgi?VERB=CREATE&CID='+obj.CID,{dialog:true});
							}});

						$("[data-app-role='tickets']",$customerEditor).anypanel('option','settingsMenu',{'Start a New Ticket':function(){
							navigateTo('/biz/crm/index.cgi?VERB=CREATE&CID='+obj.CID,{dialog:true});
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
					if(app.u.validateForm($form))	{
						app.u.dump(" -> form validated. proceed.");
						$form.showLoading({"message":"Updating customer address record."});
//shortcut is turned into a readonly, which means serialize skips it, so it's added back here.
						app.ext.admin.calls.adminCustomerUpdate.init(obj.CID,[MACRO+"?"+((MACRO == 'ADDRUPDATE') ? "SHORTCUT="+$("[name='SHORTCUT']",$form).val()+"&" : "")+$form.serialize()],{'callback':callback},'immutable');
//destroy and detail must occur after update
						app.model.destroy('adminCustomerDetail|'+obj.CID);
						app.ext.admin.calls.adminCustomerDetail.init({'CID':obj.CID,'rewards':1,'wallets':1,'tickets':1,'notes':1,'events':1,'orders':1,'giftcards':1,'organization':1},{},'immutable');
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
					
					if(app.u.validateForm($form))	{
var updates = new Array(),
formObj = $form.serializeJSON();

//app.u.dump(" -> formObj: "); app.u.dump(formObj);

updates.push("CREATE?email="+formObj.email);
if(formObj.firstname)	{updates.push("SET?firstname="+formObj.firstname);}
if(formObj.lastname)	{updates.push("SET?lastname="+formObj.lastname);}
if(formObj.generatepassword)	{updates.push("PASSWORDRESET?password=");} //generate a random password

// $('body').showLoading("Creating customer record for "+formObj.email);
app.ext.admin.calls.adminCustomerCreate.init(updates,{'callback':function(rd){
	if(app.model.responseHasErrors(rd)){
		$('#globalMessaging').anymessage({'message':rd});
		}
	else	{
		$('#customerUpdateModal').dialog('close');
		$('.dualModeListMessaging',app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")).empty();
		app.ext.admin_customer.a.showCustomerEditor($('.dualModeListContent',app.u.jqSelector('#',app.ext.admin.vars.tab+"Content")),{'CID':app.data[rd.datapointer].CID})
		}
	}});
app.model.dispatchThis('immutable');

						}
					else	{
						//the validation function puts the errors next to the necessary fields
						}

					});
				},

//saves all the changes to a customer editor
			execCustomerEditorSave : function($btn)	{
				$btn.button();
				$btn.off('click.customerEditorSave').on('click.customerEditorSave',function(event){
					event.preventDefault();
					var $form = $btn.closest('form'),
					macros = new Array(),
					CID = $btn.closest("[data-cid]").data('cid'),
//					wholesale = "", //wholesale and general are used to concatonate the KvP for any changed fields within that panel. used to build macro
//					dropshipAddrUpdate = false, //set to true if address update is present. sends entire address, not just changed fields.
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
									var addr = app.ext.admin_customer.u.getAddressByID(app.data['adminCustomerDetail|'+CID]['@'+pr.toUpperCase()],$tag.data('_id'));
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
							if($tag.attr('name') == 'password')	{
								macros.push("PASSWORDRESET?password="+$tag.val());
								}
							else if(pr == 'general')	{
								general += $tag.attr('name')+"="+($tag.is(":checkbox") ? handleCheckbox($tag) : $tag.val())+"&"; //val of checkbox is 'on'. change to 1.
								}
							else if(pr == 'newsletter')	{
								general += $tag.attr('name')+"="+handleCheckbox($tag)+"&";
								}
/*							else if(pr == 'dropship')	{
								//Add something here for dropship logo.
								if($tag.attr('name') == 'LOGO')	{
									macros.push("WSSET?LOGO="+$tag.val());
									}
								else	{
									dropshipAddrUpdate = true;
									}
								}
							else if(pr == 'wholesale')	{
								wholesale += $tag.attr('name')+"="+($tag.is(":checkbox") ? handleCheckbox($tag) : $tag.val())+"&";  //val of checkbox is 'on'. change to 1.
								}
*/							else if(pr == 'organization')	{
//								app.u.dump(" -> orgid being set to: "+$tag.val());
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


/*
						if(wholesale != '')	{
							if(wholesale.charAt(wholesale.length-1) == '&')	{wholesale = wholesale.substring(0, wholesale.length - 1)} //strip trailing ampersand.
							macros.push("WSSET?"+wholesale);
							}

						if(dropshipAddrUpdate)	{
							var wsAddrUpdate = $("[data-role='dropship-bill-address']",$form).serialize();
							app.u.dump(" -> wsAddrUpdate: "+wsAddrUpdate);
							macros.push("ADDRUPDATE?TYPE=WS&"+wsAddrUpdate);
							}						
*/

						if(general != '')	{
							if(general.charAt(general.length-1) == '&')	{general = general.substring(0, general.length - 1)} //strip trailing ampersand.
							macros.push("SET?"+general);
							}						
						
						if(macros.length)	{
//							app.u.dump(" -> MACROS: "); app.u.dump(macros);
							var $custManager = $btn.closest("[data-app-role='customerManager']").parent();
							$custManager.showLoading({'message':'Saving changes to customer record.'});
//get a clean copy of the customer record so that the notes panel can be updated.
							app.ext.admin.calls.adminCustomerUpdate.init(CID,macros,{'callback':function(rd){
								$custManager.hideLoading();
								if(app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									
									$custManager.empty();
									app.ext.admin_customer.a.showCustomerEditor($custManager,{'CID':CID})
									}
								}},'immutable');
							app.model.destroy('adminCustomerDetail|'+CID);
							app.ext.admin.calls.adminCustomerDetail.init({'CID':CID,'rewards':1,'wallets':1,'tickets':1,'notes':1,'events':1,'orders':1,'giftcards':1,'organization':1},{},'immutable');
							app.model.dispatchThis('immutable');
							}
						else	{
							$btn.closest('form').anymessage({'message':'In admin_customer.e.customerEditorSave, no recognizable fields were present.',gMessage:true});
							}
					});
				}, //customerEditorSave


			execCustomerRemove : function($btn)	{
				
				$btn.button({icons: {primary: "ui-icon-trash"},text: true});
				$btn.off('click.execCustomerRemove').on('click.execCustomerRemove',function(event){
					event.preventDefault();
					var
						$D = $("<div \/>").attr('title',"Delete Customer Record"),
						CID = $btn.closest('[data-cid]').data('cid');

					$D.append("<P class='defaultText'>Are you sure you want to delete this Customer? There is no undo for this action.<\/P>");
					$D.addClass('displayNone').appendTo('body'); 
					$D.dialog({
						modal: true,
						autoOpen: false,
						close: function(event, ui)	{
							$(this).dialog('destroy').remove();
							},
						buttons: [ 
							{text: 'Cancel', click: function(){$D.dialog('close')}},
							{text: 'Delete Customer', click: function(){
								$D.parent().showLoading({"message":"Deleting Customer"});
								app.model.destroy('adminCustomerDetail|'+CID); //nuke this so the customer editor can't be opened for a nonexistant org.
								app.ext.admin.calls.adminCustomerRemove.init(CID,{'callback':function(rd){
									$D.parent().hideLoading();
									if(app.model.responseHasErrors(rd)){$D.anymessage({'message':rd})}
									else	{
										$(".defaultText",$D).hide(); //clear the default message.
										$D.anymessage(app.u.successMsgObject('The customer has been removed.'));
										$D.dialog( "option", "buttons", [ {text: 'Close', click: function(){$D.dialog('close')}} ] );
										app.ext.admin_customer.a.showCustomerManager();
										}
									}},'immutable');
								app.model.dispatchThis('immutable');
								}}	
							]
						});
					$D.dialog('open');
					})
				},

//run when searching the customer manager for a customer.
			execCustomerSearch : function($btn){
				$btn.button({icons: {primary: "ui-icon-search"},text: true});
				$btn.off('click.customerSearch').on('click.customerSearch',function(event){
					event.preventDefault();

					var
						$custManager = $btn.closest("[data-app-role='dualModeContainer']"),
						$resultsTable = $("[data-app-role='dualModeResultsTable']",$custManager).first(),
						$editorContainer = $("[data-app-role='dualModeDetailContainer']",$custManager).first(),
						$form = $("[data-app-role='customerSearch']",$custManager).first(),
						formObj = $form.serializeJSON();

					$custManager.showLoading({"message":"Searching Customers"});
//					app.u.dump(" -> formObj: "); app.u.dump(formObj);
					app.ext.admin.calls.adminCustomerSearch.init(formObj,{callback:function(rd){
						$custManager.hideLoading();
						
$('.dualModeListMessaging',$custManager).empty();
if(app.model.responseHasErrors(rd)){
	$('.dualModeListMessaging',$custManager).anymessage({'message':rd});
	}
else	{
	//if there was only 1 result, the API returns just that CID. open that customer.
	if(app.data[rd.datapointer] && app.data[rd.datapointer].CID && (app.data[rd.datapointer].PRT == app.vars.partition))	{
		$resultsTable.hide();
		$editorContainer.show();
		app.ext.admin_customer.a.showCustomerEditor($editorContainer,{'CID':app.data[rd.datapointer].CID});
		}
	else if(app.data[rd.datapointer] && app.data[rd.datapointer]['@CUSTOMERS'] && app.data[rd.datapointer]['@CUSTOMERS'].length)	{
		$resultsTable.show();
		$editorContainer.hide();	
		$("tbody",$resultsTable).empty(); //clear any previous customer search results.
		$resultsTable.anycontent({datapointer:rd.datapointer}); //show results
		app.u.handleAppEvents($resultsTable);
		$resultsTable.anytable();
		}
	else	{
		$('.dualModeListMessaging',$custManager).anymessage({'message':'No customers matched that search. Please try again.<br />Searches are partition specific, so if you can not find this user on this partition, switch to one of your other partitions','persistent':true});
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
					var $modal = $("#customerUpdateModal").empty().dialog('open'),
					CID = $btn.closest("[data-cid]").data('cid');
					
					$modal.html("<p class='clearfix marginBottom'>Please confirm that you want to reset this customers password hint. There is no undo.<\/p>");
					
					
					$("<button \/>").text('Cancel').addClass('floatLeft').button().on('click',function(){
						$modal.dialog('close');
						}).appendTo($modal);
				
					$("<button \/>").text('Confirm').addClass('floatRight').button().on('click',function(){
						$modal.showLoading({'message':'Updating customer record...'});
						app.ext.admin.calls.adminCustomerUpdate.init(CID,["HINTRESET"],{'callback':function(rd){
							$modal.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$modal.anymessage({'message':rd});
								}
							else	{
								$modal.empty().anymessage({'message':'Thank you, the hint has been reset.','iconClass':'ui-icon-z-success','persistent':true})
								}
							}},'immutable');
							app.model.dispatchThis('immutable');
						
						}).appendTo($modal);

					});				
				}, //execHintReset

			execNoteCreate : function($btn)	{
				$btn.button();
				$btn.button('disable');
				$btn.off('click.noteCreate').on('click.noteCreate',function(event){
					event.preventDefault();
					var note = $btn.parent().find("[name='noteText']").val(),
					$panel = $btn.closest('.panel'),
					CID = $btn.closest("[data-cid]").data('cid');
					
					if(CID && note)	{
						$panel.showLoading({'message':'Adding note to customer record'});
						app.ext.admin.calls.adminCustomerUpdate.init(CID,["NOTECREATE?TXT="+encodeURIComponent(note)],{'callback':function(rd){
							//update notes panel or show errors.
							$panel.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$panel.anymessage({'message':rd});
								}
							else	{
								$("tbody",$panel).empty(); //clear all existing notes.
								$("input",$panel).val(''); //empty notes input(s).
								$panel.anycontent({'datapointer' : 'adminCustomerDetail|'+CID});
								app.ext.admin.u.handleAppEvents($panel);
								}
							
							}},'immutable');
//get a clean copy of the customer record so that the notes panel can be updated.
						app.model.destroy('adminCustomerDetail|'+CID);
						app.ext.admin.calls.adminCustomerDetail.init({'CID':CID,'rewards':1,'wallets':1,'tickets':1,'notes':1,'events':1,'orders':1,'giftcards':1,'organization':1},{},'immutable');
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

			execWalletCreate : function($btn,o)	{
				$btn.button();
				$btn.off('click.walletCreate').on('click.walletCreate',function(event){
					event.preventDefault();
					var $panel = false; //if passed in o, will be the parent panel.
					if(o && o['$context'])	{
						$panel = o['$context']; //shortcut and and to identify what the context is.
						}
					var $form = $btn.closest('form'),
					CID = $btn.closest("[data-cid]").data('cid');
					
					if(!CID)	{
						$form.anymessage({'message':'in admin_customer.e.walletCreate, could not determine CID.','gMessage':true});
						}
					else if(app.u.validateForm($form))	{
						$form.showLoading({'message':'Adding wallet to customer record '+CID+'.'});


						app.ext.admin.calls.adminCustomerUpdate.init(CID,["WALLETCREATE?"+$form.serialize()],{'callback':function(rd){
							$form.hideLoading();
							if(app.model.responseHasErrors(rd)){
								$form.anymessage({'message':rd});
								}
							else	{
								$form.parent().empty().anymessage({'message':'Thank you, the wallet has been added','errtype':'success'});
								if($panel)	{
									app.u.dump(" -> $panel IS set");
									$("tbody",$panel).empty(); //clear wallets
									$panel.anycontent({'datapointer' : 'adminCustomerDetail|'+CID}); //re-translate panel, which will update wallet list.
									app.ext.admin.u.handleAppEvents($panel);
									}
								else	{
									app.u.dump(" -> $panel is NOT set");
									}
								}
							}},'immutable');
//do this after the update so the detail includes the changes from the update.
						app.model.destroy('adminCustomerDetail|'+CID);
						app.ext.admin.calls.adminCustomerDetail.init({'CID':CID,'rewards':1,'wallets':1,'tickets':1,'notes':1,'events':1,'orders':1,'giftcards':1,'organization':1},{},'immutable');
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
					var $modal = $('#customerUpdateModal').empty(),
					$addrPanel = $btn.closest('.ui-widget-anypanel');
					
					app.u.dump(" -> $addrPanel.length: "+$addrPanel.length);
					
					$('.ui-dialog-title',$modal.parent()).text('Update customer address');
					$modal.dialog('open');
					
					var CID = $(this).closest('.panel').data('cid'),
					type = $btn.closest("[data-address-type]").data('address-type'),
					index = Number($btn.closest('tr').data('obj_index'));

					if(CID && index >= 0 && type)	{
						$modal.anycontent({'templateID':'customerAddressAddUpdateTemplate','showLoading':false,data:app.data['adminCustomerDetail|'+CID][type][index]});
						$("[name='TYPE']",$modal).val(type.toUpperCase().substring(1)); //val is @ship or @bill and needs to be SHIP or BILL
						$("[name='SHORTCUT']",$modal).attr('disabled','disabled').parent().append('not editable'); //once created, the shortcut is not editable.

						if(type == '@SHIP')	{
							$("[type='email']",$modal).parent().empty().remove();
							}

						var $button = $("<button \/>").text('Save Address').button().on('click',function(event){
							event.preventDefault();
							var $form = $('form',$modal);
							app.ext.admin_customer.u.customerAddressAddUpdate($form,'ADDRUPDATE',{'CID':CID,'type':type},function(rd){
								$form.hideLoading();
								if(app.model.responseHasErrors(rd)){
									$modal.anymessage({'message':rd});
									}
								else	{
									$modal.empty().anymessage({'message':'Thank you, the address has been changed','persistent':true});
									//clear existing addresses and re-render.
									$("tbody",$addrPanel).empty();
									$addrPanel.anycontent({'datapointer' : 'adminCustomerDetail|'+CID});
									app.ext.admin.u.handleAppEvents($addrPanel);
									
									}
								});
							});						
						$modal.append($button);
						}
					else	{
						$modal.anymessage({'message':'In admin_customer.e.customerAddressUpdate, unable to determine CID ['+CID+'] or address type ['+type+'] or address index ['+index+']',gMessage:true});
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

			showCustomerUpdate : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
//a customer from a different partition SHOULD show up in the results, but is NOT editable unless logged in to that partition.
				if($btn.closest('tr').data('prt') == app.vars.partition)	{
					$btn.off('click.showCustomerUpdate').on('click.showCustomerUpdate',function(event){
						event.preventDefault();
						var $dualModeContainer = $btn.closest("[data-app-role='dualModeContainer']")
						$("[data-app-role='dualModeResultsTable']",$dualModeContainer).hide();
						$("[data-app-role='dualModeDetailContainer']",$dualModeContainer).show();
						app.ext.admin_customer.a.showCustomerEditor($("[data-app-role='dualModeDetailContainer']",$dualModeContainer),{'CID':$btn.closest("[data-cid]").data('cid')});
						});
					}
				else	{
					$btn.button('disable').hide();
					$("<span class='tooltip'>?<\/span>").attr('title','You must be logged in to a partition to edit a customer on that partition.').tooltip().insertAfter($btn);
					}
				//
				},
			
			
			showGiftcardUpdate : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				
				$btn.off('click.showGiftcardUpdate').on('click.showGiftcardUpdate',function(event){
					event.preventDefault();
					navigateTo("/biz/manage/giftcard/index.cgi?VERB=EDIT&GCID="+$btn.closest('tr').data('id'));
					});
				},
			
			
			saveOrgToField : function($cb)	{
				$cb.off('change.saveOrgToField').on('change.saveOrgToField',function(){
					var
						$context = $("[data-app-role='customerManager']:visible").first(),
						$orgidInput = $("[name='ORGID']",$context);
//when a checkbox is clicked, close the modal, set the val of the orgid input and then trigger the change handler so the save button is clickable.
					$orgidInput.val($cb.closest('tr').data('orgid'));
					$orgidInput.toggleClass('edited');
					app.ext.admin_customer.u.handleChanges($context);
					$cb.closest('.ui-dialog-content').dialog('close');
					})
				
				},
			
			showMailTool : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-mail-closed"},text: true});
				$btn.off('click.showMailTool').on('click.showMailTool',function(event){
					event.preventDefault();
					app.ext.admin.a.showMailTool({'listType':'CUSTOMER','partition':app.vars.partition,'CID':$btn.closest("[data-cid]").data('cid')});
					});
				},
			
			showOrgChooser : function($btn)	{
				
				$btn.button({icons: {primary: "ui-icon-search"},text: true});
				$btn.off('click.showOrgChooser').on('click.showOrgChooser',function(event){
					event.preventDefault();
					var $D = $("<div \/>").attr('title',"Add a New Organization");
					
					$D.anycontent({'templateID':'organizationManagerPageTemplate','data':{}});
					
					$D.dialog({
						modal: true,
						width : '70%',
						close: function(event, ui)	{
							$(this).dialog('destroy');
							}
						});
					app.u.dump("Just a heads up.  The data-bind on the tbody in the org display (this instance only) was just overwritten in admin_customer.e.showOrgChooser");
					$('.gridTable tbody',$D).attr('data-bind',"var: users(@ORGANIZATIONS); format:processList; loadsTemplate:organizationManagerChooserRowTemplate;");
					app.u.handleAppEvents($D);
					
					});
				},
			
/*
			showMediaLib4DropshipLogo : function($ele)	{
				$ele.off('click.mediaLib').on('click.mediaLib',function(event){
					event.preventDefault();
					mediaLibrary($('#customerDropshipLogoImg'),$('#customerDropshipLogo'),'Choose Dropship Logo');
					});
				},
*/
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