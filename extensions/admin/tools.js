/* **************************************************************

   Copyright 2013 Zoovy, Inc.

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


var admin_tools = function(_app) {
	var theseTemplates = new Array('productPowerToolTemplate');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				// _app.model.fetchNLoadTemplates(_app.vars.baseURL+'extensions/admin/tools.html',theseTemplates);

				_app.formatRules.validateJSON = function($input,$err){
					var valid = true;
					try	{
						jQuery.parseJSON($input.val());
						}
					catch(e)	{
						valid = false;
						$err.append('Invalid JSON. error: '+e);
						}
					return valid;
					}


				//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
				r = true;

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

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
		a : {
			showPPT : function($target)	{
				$target.empty().anycontent({'templateID':'productPowerToolTemplate','showLoading':false,data:{}}); //empty data passed to ensure translate occurs (for includes et all)
				$('.toolTip',$target).tooltip();
				var $picker = $("[data-app-role='pickerContainer']:first",$target);
				$picker.append(_app.ext.admin.a.getPicker({'templateID':'pickerTemplate','mode':'product'}));
				$('.applyDatepicker',$picker).datepicker({
					changeMonth: true,
					changeYear: true,
					maxDate : 0,
					dateFormat : 'yymmdd'
					});
				_app.u.handleAppEvents($target,{'$form':$('form[name=productPowerToolForm]'),'$dataTbody':$("[data-app-role='powertoolSelectedActionsContainer'] tbody",$target)});
//				$("input",$picker).each(function(){});
				},
			
			siteDebugger : function($target,P)	{
				P = P || {};
				$target.tlc({'templateid':'siteDebugTemplate','dataset':P})
				_app.u.handleButtons($target);
				_app.u.handleCommonPlugins($target);
				_app.u.addEventDelegation($target);
				$target.anyform();
				},

			showManageFlexedit : function($target)	{
				$target.anycontent({'templateID':'manageFlexeditTemplate',data:{}}).anyform();
				_app.u.addEventDelegation($target);
				var $enabled = $("[data-app-role='flexeditEnabledListContainer']",$target);
				$enabled.showLoading({'message':'Fetching your list of enabled fields'})
				
				var $master = $("[data-app-role='flexeditMasterListContainer']",$target);
				$master.showLoading({'message':'Fetching list of popular fields'})

				$('tbody',$enabled).sortable();

				//the connection is one way for now.
				$('tbody',$master).sortable({
					connectWith: $('.connectMe',$target),
					stop : function(event,ui)	{
						//if the item ends up in the enabled list, change from left/right arrows to up/down. also tag row to denote it's new (for save later).
						if($(ui.item).closest('tbody').hasClass('connectMe'))	{
							$(ui.item).addClass('edited isNewRow').data({'isFromMaster':true}).attr({'data-guid':_app.u.guidGenerator(),'data-id':$(ui.item).data('obj_index')});
							_app.u.handleButtons($(ui.item));
							}
						}
					});

				_app.ext.admin.calls.appResource.init('product_attribs_all.json',{},'mutable'); //have these handy for editor. ### TODO -> don't call these till necessary
				_app.model.addDispatchToQ({'_cmd':'adminConfigDetail','flexedit':'1','_tag':{'callback':'anycontent','datapointer':'adminConfigDetail|flexedit','jqObj':$enabled}},'mutable');
				_app.model.addDispatchToQ({'_cmd':'appResource','filename':'product_attribs_popular.json','_tag':{'callback':function(rd){
					$master.hideLoading();
					$('tr',$enabled).each(function(){$(this).attr('data-guid',_app.u.guidGenerator())}); //has to be an attribute (as opposed to data()) so that dataTable update see's the row exists already.
					if(_app.model.responseHasErrors(rd)){
						$('#globalMessaging').anymessage({'message':rd});
						}
					else	{
						$master.anycontent({'datapointer':rd.datapointer});
						_app.u.handleButtons($master);
						}
					},'datapointer':'appResource|product_attribs_popular.json'}},'mutable');
				_app.model.dispatchThis('mutable');
				}, //showManageFlexedit
			
			showProductExport : function($target)	{
				$target.empty().anycontent({'templateID':'productExportToolTemplate','showLoading':false});
				_app.u.handleCommonPlugins($target);  //run before picker added to dom so that picker isn't affected by anycb.

				var $picker = $("[data-app-role='pickerContainer']:first",$target);
				$picker.append(_app.ext.admin.a.getPicker({'templateID':'pickerTemplate','mode':'product'}));
				
				
				$('.toolTip',$target).tooltip();
				_app.u.handleAppEvents($target);
				},

			showAccountUtilities : function($target)	{
				$target.empty().anycontent({'templateID':'accountUtilitiesTemplate','showLoading':false,'datapointer':'info'});
//need to apply datepicker to date inputs.
				$('button',$target).button();
				_app.u.addEventDelegation($target);
				_app.u.handleButtons($target.anyform());

				_app.model.addDispatchToQ({
					'_cmd':'adminPlatformLogList',
					'_tag' : {
						'callback':'anycontent',
						'datapointer': 'adminPlatformLogList',
						'jqObj' : $("[data-app-role='accountUtilityLogContainer']:first",$target)
						}
					},'mutable');
				_app.model.dispatchThis('mutable');
				},
			
			showPrivateFiles : function($target)	{
				_app.ext.admin.i.DMICreate($target,{
					'header' : 'Private Files',
					'className' : 'privatefiles', //applies a class on the DMI, which allows for css overriding for specific use cases.
					'thead' : ['Created','Filename','Type','Expiration','Creator',''],
					'handleAppEvents' : false,
					'tbodyDatabind' : "var: users(@files); format:processList; loadsTemplate:privateFilesRowTemplate;",
					'controls' : "<button data-app-click='admin_tools|adminPrivateFileRemoveConfirm' class='floatRight applyButton' data-icon-primary='ui-icon-trash'>Delete Selected</button><form class='floatLeft'><label>Filter<\/label> <select name='type' class='marginLeft marginRight'><option value=''>none<\/option><option value='REPORT'>Report<\/option><option value='SYNDICATION'>Syndication<\/option><option value='CSV'>CSV<\/option><\/select><button data-app-click='admin|refreshDMI' data-serializeform='1' class='applyButton'>Filter<\/button><\/form>",
					'cmdVars' : {
						'_cmd' : 'adminPrivateFileList',
						'limit' : '50',
						'_tag' : {
							'datapointer':'adminPrivateFileList'
							}
						}
					});
				_app.u.handleButtons($target.anyform());
				_app.model.dispatchThis('mutable');
				},
			
			showciEngineAgentManager : function($target)	{
				_app.ext.admin.i.DMICreate($target,{
					'header' : 'Agent Manager',
					'className' : 'agentsManager', //applies a class on the DMI, which allows for css overriding for specific use cases.
					'buttons' : [
						"<button data-app-click='admin|refreshDMI' class='applyButton' data-text='false' data-icon-primary='ui-icon-arrowrefresh-1-s'>Refresh<\/button>",
						"<button data-app-click='admin_tools|agentCreateShow' class='applyButton' data-text='true' data-icon-primary='ui-icon-cicle-plus'>Add Agent<\/button>"
						],
					'thead' : ['ID','Revision#','Lines','Interface','Created',''], //the blank at the end is for the th tag for the buttons.
					'tbodyDatabind' : "var: users(@AGENTS); format:processList; loadsTemplate:CIE_DSA_rowTemplate;",
					'cmdVars' : {
						'_cmd' : 'adminCIEngineAgentList',
						'_tag' : {
							'datapointer':'adminCIEngineAgentList'
							}
						}
					});
				_app.u.handleButtons($target.anyform());
				_app.model.dispatchThis('mutable');
				}
			
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//renderFormats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		renderFormats : {

			objExplore : function($tag,data)	{
				$tag.append(_app.ext.admin_tools.u.objExplore(objExplore));
				}


			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
//depth should never be passed. it's defaulted to 0 (zero) and incremented w/ each nested object.
			objExplore : function(obj,depth)	{
// 				_app.u.dump("BEGIN analyzer.u.objExplore");
				depth = depth || 0;
				var keys = new Array();
				for (var n in obj) {
					keys.push(n);
					}
				keys.sort();
				var L = keys.length;
				var $ul = $("<ul \/>").addClass('objectInspector');

				for(var i = 0; i < L; i += 1)	{
					var $li = $('<li>');
					$li.addClass('objExplore_'+depth)
					var $value;
					$('<span>').addClass('prompt').text(keys[i]).appendTo($li);
					
					if(typeof obj[keys[i]] == 'object')	{
						$value = _app.ext.admin_tools.u.objExplore(obj[keys[i]],depth++);
						}
					else	{
						$value = $('<span>').addClass('value').text(obj[keys[i]]);
						}
					$value.appendTo($li);
					$li.appendTo($ul);
					}

				return $ul;
				},
			
			pickerSelection2KVP : function($context)	{
//				_app.u.dump("BEGIN admin_tools.u.pickerSelection2KVP");
				var r = ""; //what is returned. line separated w/ each line as  'navcat=.safe.name' or 'vendor=XYZ'
				var sfo = $context.serializeJSON({'cb':true});
//				_app.u.dump(" -> sfo: "); _app.u.dump(sfo);
				if(Number(sfo.SELECTALL) === 1)	{
					r = 'all'
					}
				else	{
					function handleIt(type)	{
//						_app.u.dump(" -> handle it for "+type);
						if(Number(sfo[index]) === 1)	{
							r += index.replace('+','=')+"\n"; // input name is navcat+.something, so simply changing + to = makes it macroesque-ready.
							}
						}
				
					for(index in sfo)	{
						if(index.indexOf('NAVCAT') === 0)	{handleIt('NAVCAT');}
						else if(index.indexOf('SUPPLIER') === 0)	{handleIt('SUPPLIER');}
						else if(index.indexOf('MANAGECAT') === 0)	{handleIt('MANAGECAT');}
						else if(index.indexOf('PROFILE') === 0)	{handleIt('PROFILE');}
						else if(index.indexOf('SUBLIST') === 0)	{handleIt('SUBLIST');}
						else	{} //do nada. isn't a checkbox list.
						}
					
					if(sfo.rstart && sfo.rend)	{
						r += "range="+sfo.rstart+"|"+sfo.rend+"\n";
						}

					if(sfo.createstart && sfo.createend)	{
						r += "created="+sfo.createstart+"|"+sfo.createend+"\n";
						}

					if(sfo.csv)	{
						r += "csv="+sfo.csv.replace(/[\s\t\r\n]+/g,",")+"\n"; //strip out all whitespace of any kind and replace with a comma. adjacent whitespace will only get 1 comma
//						_app.u.dump(" -> r: "); _app.u.dump(r);
						}
					}
//				_app.u.dump(" -> r: "+r);
				return r;
				},

//will return an array of macro-esque values
//context could be the fieldset or the parent form.
			pickerSelection2Array : function($context)	{
				_app.u.dump("BEGIN admin_tools.u.pickerSelection2Array");
				var r = new Array(); //what is returned. array w/ each entry formatted as: 'navcat=.safe.name' or 'vendor=XYZ'
				var sfo = $context.serializeJSON({'cb':true});
				
//				_app.u.dump(" -> sfo: "); _app.u.dump(sfo);
				function handleIt(type)	{
					if(Number(sfo[index]) === 1)	{
						r.push(index.replace('+','=')); // input name is navcat+.something, so simply changing + to = makes it macroesque-ready.
						}
					}

				if($("[name='SELECTALL']",$context).is(':checked'))	{
					r.push('all')
					}
				else	{
				
					for(index in sfo)	{
						if(index.indexOf('navcat') === 0)	{handleIt('navcat');}
						else if(index.indexOf('supplier') === 0)	{handleIt('supplier');}
						else if(index.indexOf('managecat') === 0)	{_app.u.dump(" -> managecat");handleIt('managecat');}
						else if(index.indexOf('launchprofile') === 0)	{handleIt('mancat');}
						else	{} //do nada. isn't a checkbox list.
						}
					
					if($("[name='rstart']",$context).val() && $("[name='rend']",$context).val())	{
						r.push("range?"+encodeURIComponent($("[name='rstart']",$context).val()+"|"+$("[name='rend']",$context).val()))
						}
					
					if($("[name='csv']",$context).val())	{
						r.push("csv?"+encodeURIComponent($("[name='csv']",$context).val()));
						}
					
					}
				
				return r;
				},

			powertoolActions2KVP : function($tbody)	{
				var r = "";
				$('tr',$tbody).not('.rowTaggedForRemove').each(function(){
					var
						data = $.extend({},$(this).data()),
						verb = data.verb;

					if(data.attrib == '_')	{
						data.attrib = data.attrib_custom;
						delete attrib_custom;
						}
					
					if(data.when == 'when-attrib-contains')	{
						//data() stores keys without dashes. so some-key is converted to someKey. 
						data['when-attrib'] = data.whenAttrib;
						data['when-attrib-operator'] = data.whenAttribOperator;
						data['when-attrib-contains'] = data.whenAttribContains;
						}
					
					r += verb+"?"+$.param(_app.u.getWhitelistedObject(data,['attrib','when','when-attrib','when-attrib-operator','when-attrib-contains'])); //verb not passed because it is macro
					switch(verb)
						{
						case 'replace':
							r += '&replace-value='+encodeURIComponent(data.searchval);
							r += '&replace-with='+encodeURIComponent(data.replaceval);
						break;
					
						case 'add':
						case 'set':
						case 'copy':
						case 'copyfrom':
							r += '&'+verb+'-value='+encodeURIComponent(data[verb+'val']);
							break;
						default:
					//the rest of the verbs don't have a value.
						}
					r += "\n";
					
					});
				return r;
				}

			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {

			rawJSONRequestExec : function($ele,P)	{
				P.preventDefault();
				var JSONString = $ele.closest('form').find("[name='JSON']").val();
				_app.u.dump(" -> myJSON: "+JSONString);
				var validJSON = false;
				try	{
//						_app.u.dump(" -> attempting to validate json");
					_app.u.dump(" -> JSON.parse(JSONString): "+JSON.parse(JSONString));
				//Run some code here
					validJSON = JSON.parse(JSONString);
					}
				catch(err) {
				//Handle errors here
					}
//					_app.u.dump(" -> jsonParse(myJSON): "); _app.u.dump(validJSON);
				if(typeof validJSON === 'object')	{
					// ### TODO -> this should set a callback of showMessaging and pass a message of 'success' and put it into the parent form but ONLY if no callback is set. got interupted.
					validJSON._tag = validJSON._tag || {};
					if(validJSON._tag.callback)	{}
					else	{
						validJSON._tag.callback = 'showMessaging';
						validJSON._tag.message = "API request was successful.";
						validJSON._tag.jqObj = $ele.closest('form');
						}

					if(_app.model.addDispatchToQ(validJSON,'mutable'))	{
						_app.model.dispatchThis('mutable');
						}
					else	{
						$ele.closest('form').anymessage({"message":"The query could not be dispatched. Be sure you have a _cmd set in your query."})
						}
					
					}
				else	{
					$ele.closest('form').anymessage({"message":"The query is not a valid json object. Use a service like jsonLint to validate your JSON if necessary.<br>hint: You must use double quotes around your values."})
					}
			},

			inspectorExec : function($ele,P)	{
				P.preventDefault();
				if(_app.u.validateForm($ele.closest('form')))	{
					var
						cmdObj = $ele.closest('form').serializeJSON({'cb':true}),
						valid = true;
						
						cmdObj._tag = {};
						
					if($ele.data('inspect') == 'order' && cmdObj.orderid)	{
						cmdObj._cmd = "adminOrderDetail";
						cmdObj._tag.datapointer = "adminOrderDetail|"+cmdObj.orderid;
						}
					else if($ele.data('inspect') == 'product' && cmdObj.pid)	{
						cmdObj._cmd = "appProductGet";
						cmdObj.withVariations = 1;
						cmdObj.withInventory = 1;
						cmdObj._tag.datapointer = "appProductGet|"+cmdObj.pid;
						}
					else if($ele.data('inspect') == 'shipmethods')	{
						cmdObj._cmd = "adminConfigDetail";
						cmdObj.shipmethods = true;
						cmdObj._tag.datapointer = "adminConfigDetail|shipmethods|"+_app.vars.partition;
						}
					else if($ele.data('inspect') == 'cart' && cmdObj.cartid)	{
						cmdObj._cmd = "cartDetail";
						cmdObj._tag.datapointer = "cartDetail|"+cmdObj.cartid;
						}
					else	{
						valid = false;
						$('#globalMessaging').anymessage({"message":"In admin_tools.e.inspectExec, either inspect ["+$ele.data('inspect')+"] was invalid (only product, order and cart are valid) or inspect was valid, but was missing corresponding data (ex: inspect=order but no orderid specified in form);","gMessage":true});
						}
					
					
					if(valid)	{
						var $D = _app.ext.admin.i.dialogCreate({
							'title':'Inspector'
							})
						$D.dialog('open');
						cmdObj._tag.callback = function(rd)	{
							$D.hideLoading();
							if(_app.model.responseHasErrors(rd)){
								$D.anymessage({'message':rd});
								}
							else	{
								//sanitize a little...
								delete _app.data[rd.datapointer]._rcmd;
								delete _app.data[rd.datapointer]._msgs;
								delete _app.data[rd.datapointer]._msg_1_id;
								delete _app.data[rd.datapointer]._msg_1_txt;
								delete _app.data[rd.datapointer]._msg_1_type;
								delete _app.data[rd.datapointer]._rtag;
								delete _app.data[rd.datapointer]._uuid;
								delete _app.data[rd.datapointer].ts
								
								$D.append(_app.ext.admin_tools.u.objExplore(_app.data[rd.datapointer]));
								}
							}
						_app.model.addDispatchToQ(cmdObj,'mutable');
						_app.model.dispatchThis('mutable');
						}
					else	{} //error messaging already handled.
					
					}
				else	{}

				},

			powerToolBatchJobExec : function($btn)	{
				$btn.button();
				$btn.off('click.powerToolAttribChange').on('click.powerToolAttribChange',function(event){
					event.preventDefault();
//					_app.u.dump("BEGIN powerToolBatchJobExec click event.");
					var	$form = $btn.closest('form');
					
					if(_app.ext.admin.u.validatePicker($form))	{
						if($('tbody[name=powerToolActionListTbody] tr').not('.rowTaggedForRemove').length)	{
							obj = {
								'%vars' : {
									'GUID' : _app.u.guidGenerator(),
									'product_selectors' : _app.ext.admin_tools.u.pickerSelection2KVP($("[data-app-role='pickerContainer']",$form)),
									'actions' : _app.ext.admin_tools.u.powertoolActions2KVP($('tbody[name=powerToolActionListTbody]'))
									},
								'type' : 'UTILITY/PRODUCT_POWERTOOL'
								}
//						console.clear();
//						_app.u.dump(" -> actions: "+obj['%vars'].actions);
//						_app.u.dump(" -> obj: "); _app.u.dump(obj); 
							var batchOptions = {};
							if($("[name='jobtitle']",$form).val())	{
								batchOptions = {
									'jobCreate' : true,
									'TITLE' : $("[name='jobtitle']",$form).val(),
									'PRIVATE' : 0,
									'BATCH_EXEC' : 'UTILITY/PRODUCT_POWERTOOL'
									}
								}

							_app.ext.admin_batchjob.a.adminBatchJobCreate(obj,batchOptions);
							}
						else	{
							$form.anymessage({'message':'Please specify at least one attribute/action in step 2.'})
							}	
						}
					else	{
						$form.anymessage({'message':'Please make at least one selection in Step 1.'})
						}
					
					
					})
				},

			powerToolAttribChange : function($ele)	{
				$ele.off('change.powerToolAttribChange').on('change.powerToolAttribChange',function(){
					var $fieldset = $ele.closest('fieldset');
					if($ele.val() == '_')	{
						$("[name='attrib_custom']",$fieldset).attr('required','required').parent('label').show();
						}
					else	{
						$("[name='attrib_custom']",$fieldset).attr('required','').removeAttr('required').parent('label').hide();
						}
					});
				}, //powerToolAttribChange

			powerToolConditionalChange : function($ele)	{
				$ele.off('click.powerToolAttribChange').on('click.powerToolAttribChange',function(){
					var $fieldset = $ele.closest('fieldset');
					if($ele.val() == 'when-attrib-contains')	{
						$("[data-app-role='conditionalsContainer']:first",$fieldset).show();
						}
					else	{
						$("[data-app-role='conditionalsContainer']:first",$fieldset).hide();
						}
					});
				}, //powerToolConditionalChange

			powerToolVerbChange : function($radio)	{
				$radio.off('click.powerToolVerbChange').on('click.powerToolVerbChange',function(){
					var $fieldset = $radio.closest('fieldset');
					$('input.lockOnVerbChange',$fieldset)
						.attr('disabled','disabled')  //disable all other inputs. helps clearly indicate what's required.
						.attr('required','').removeAttr('required').val(""); //make sure input isn't required. empty any value that was set to avoid confusion.
					$radio.closest('tr').find('input').attr('disabled','').removeAttr('disabled').attr('required','required'); //enable input(s) related to this verb.
					});
				}, //powerToolVerbChange

			productExportBatchJobCreateExec : function($btn)	{
				$btn.button();
				$btn.off('click.productExportBatchJobCreateExec').on('click.productExportBatchJobCreateExec',function(){
					var $form = $btn.closest('form');
					if(_app.ext.admin.u.validatePicker($form))	{
						var sfo = $("[data-app-role='exportConfiguration']",$form).serializeJSON();
						sfo.product_selectors = _app.ext.admin_tools.u.pickerSelection2KVP($("[data-app-role='pickerContainer']",$form));
						if(sfo.attributes == 'specify' && !sfo.fields)	{
							$form.anymessage({"message":"For attributes, you selected 'specify', which requires at least one attribute in the attribute list textarea."});
							}
						else	{
							_app.ext.admin_batchjob.a.adminBatchJobCreate({'%vars':sfo,'guid':_app.u.guidGenerator(),'type':'EXPORT/PRODUCTS'});
							}
						}
					else	{
						$form.anymessage({"message":"Please make at least one selection in 'Step 1'."});
						}
					})
				},

			productExportAttributeSrcChange : function($ele)	{
				
				$ele.off('change.productExportAttributeSrcChange').on('change.productExportAttributeSrcChange',function(){
					if($ele.val() == 'all')	{
						$ele.closest('fieldset').find("[data-app-role='exportToolAttributeListContainer']").hide();
						}
					else	{
						$ele.closest('fieldset').find("[data-app-role='exportToolAttributeListContainer']").show();
						}
					})
				
				},

			agentDetailDMIPanel : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-pencil"},text: false});
				$btn.off('click.agentDetailDMIPanel').on('click.agentDetailDMIPanel',function(event){
					event.preventDefault();
					var
						data = $btn.closest('tr').data()

					var $panel = _app.ext.admin.i.DMIPanelOpen($btn,{
						'templateID' : 'CIE_DSA_AddUpdateTemplate',
						'panelID' : 'agent_'+data.agentid,
						'showLoading' : false,
						'header' : 'Edit agent: '+data.agentid,
						'handleAppEvents' : false
						});

//					$panel.showLoading({'message':'Fetching Agent Details'});
					$('form',$panel)
						.append("<input type='hidden' name='_cmd' value='adminCIEngineAgentUpdate' /><input type='hidden' name='_tag/updateDMIList' value='"+$panel.closest("[data-app-role='dualModeContainer']").attr('id')+"' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/message' value='The agent has been successfully updated.' />")
						.find("[name='AGENTID']")
						.closest('label').hide(); //agent id is not editable, once set.
					
					_app.model.addDispatchToQ({'AGENTID':data.agentid,'_cmd':'adminCIEngineAgentDetail','_tag':{'callback':'anycontent','jqObj':$panel,'datapointer':'adminCIEngineAgentDetail|'+data.agentid}},'mutable');
					_app.model.dispatchThis('mutable');
					});
				}, //agentDetailDMIPanel

			agentCreateShow : function($ele,P)	{
				P.preventDefault();
				var $D = _app.ext.admin.i.dialogCreate({
					'title':'Add New Agent',
					'templateID':'CIE_DSA_AddUpdateTemplate',
					'data' : {'GUID':_app.u.guidGenerator()},
					'showLoading':false //will get passed into anycontent and disable showLoading.
					});
				$D.dialog('open');
//These fields are used for processForm on save.
				$('form',$D).first().append("<input type='hidden' name='_cmd' value='adminCIEngineAgentCreate' /><input type='hidden' name='_tag/jqObjEmpty' value='true' /><input type='hidden' name='_tag/updateDMIList' value='"+$btn.closest("[data-app-role='dualModeContainer']").attr('id')+"' /><input type='hidden' name='_tag/callback' value='showMessaging' /><input type='hidden' name='_tag/message' value='Thank you, your agent has been created.' />");

				}, //agentCreateShow

			flexeditAttributesFullListShow : function($ele,P)	{
				var $tbody = $ele.closest("[data-app-role='flexeditMasterListContainer']").find("[data-app-role='flexeditAttributeListTbody']");
				$tbody.empty()
				$tbody.parent().showLoading({'message':'Fetching full attribute list'});

				_app.ext.admin.calls.appResource.init('product_attribs_all.json',{
					'callback' : function(rd){
						$tbody.parent().hideLoading();
						
						if(_app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							$tbody.anycontent({'datapointer':rd.datapointer});
							$('tr',$tbody).each(function(){
								$(this).attr('data-guid',_app.u.guidGenerator());
								//this list is too big for running the handleButton script. 
								}); //has to be an attribute (as opposed to data()) so that dataTable update see's the row exists already.
							}
						},
					'datapointer':'appResource|product_attribs_all.json'
					},'mutable'); //total sales
				_app.model.dispatchThis('mutable');
				},

			flexeditAttributeAdd2EnabledList : function($ele,P)	{
				var $tr = $ele.closest('tr');
				$ele.closest("[data-app-role='flexeditManager']").find("tbody[data-app-role='flexeditEnabledListTbody']:first").append($tr);
				$tr.attr('data-id',$tr.attr('data-obj_index')).find('.queryMatch').removeClass('queryMatch'); //if a filter was used in the attributes list, queryMatch is added which changes the bg color.
				_app.u.handleButtons($tr);
				},

			flexDataTableAddEditCancel : function($ele,P)	{
				$ele.closest("[data-table-role='container']").find(":input").val("");
				$ele.closest("[data-table-role='inputs']").slideUp();
				},
			flexeditAttributeRemove : function($ele,P){
				var $d = _app.ext.admin.i.dialogCreate({
					'title': 'Remove Flexedit Attribute',
					});
				$d.append('<div> Delete this attribute? </div>');
				var $button = $('<button>Ok</button>');
				$button.button().on('click', function(e){
					$d.dialog('close');
					_app.ext.admin_tools.e.flexeditSaveExec($ele,P);
					$ele.closest('tr').remove().empty();
					});
				$d.append($button);
				$d.dialog('open');
				},
			flexeditAttributeCreateUpdateShow : function($ele,P)	{
				var $inputContainer = $ele.closest('form').find("[data-app-role='flexeditAttributeAddUpdateContainer']");
//disable the add and edit buttons so as to not accidentally lose data while it's being entered (form would clear or populate w/ 'edit' contents )
//					$btn.button('disable');
//					$btn.closest('[data-app-role="flexeditManager"]').find("[data-app-event='admin_tools|flexeditAttributeCreateUpdateShow']").button('disable');
				
//need to make sure form input area is 'on screen'. scroll to it.
				$('html, body').animate({scrollTop: $inputContainer.offset().top}, 1000);
				$(':input',$inputContainer).val(''); //clear all the inputs. important even if in 'edit' cuz anycontent will NOT clear and if a field is not set for this item, it'll leave the previously edited attributes content.
				$inputContainer.slideDown();

				if($ele.data('mode') == 'update')	{
					//$inputContainer.anycontent({'data':$.extend({},$ele.closest('tr').data(),_app.data["appResource|product_attribs_all.json"].contents[$ele.closest('tr').data('id')])});
					$inputContainer.anycontent({'data':$.extend({},$ele.closest('tr').data('flexedit-definition'),_app.data["appResource|product_attribs_all.json"].contents[$ele.closest('tr').data('id')])});
					$("[name='type']",$inputContainer).trigger('change'); //will conditionally show 'options' input if necessary.
					}
				else if($ele.data('mode') == 'create')	{
					//valid mode
					}
				else	{
					$inputContainer.hide();
					$ele.closest('form').anymessage({"message":"In admin_tools.e.flexeditAttributeAddUpdateShow, mode not valid. only create or update are accepted.","gMessage":true});
					}
				},
			flexeditAttributeSave : function($ele,P){
				var newAttr = $('textarea', $ele.closest('[data-app-role="flexeditAttributeAddUpdateContainer"]')).val();
				// try{
					newAttr = JSON.parse(newAttr);
					var json = new Array();
					var keys = new Array();
					$ele.closest('form').find('tbody tr').not('.rowTaggedForRemove').each(function(){
						if($.inArray($(this).data('id'),keys) >= 0)	{
							//if an id is already in keys, it's already added to the flex json. This keeps duplicate id's from being added.
							}
						else	{
							keys.push($(this).data('id'));
							//json.push(_app.u.getWhitelistedObject($(this).data(),['id','title','index','cart','type','options']));
							json.push($(this).data('flexedit-definition'));
							}
						})
					json.push(newAttr);
					
					_app.model.addDispatchToQ({
						'_cmd':'adminConfigMacro',
						'@updates':["GLOBAL/FLEXEDIT-SAVE?json="+encodeURIComponent(JSON.stringify(json))],
						'_tag':	{
							'callback' : function(rd){
								if(_app.model.responseHasErrors(rd)){
									_app.u.throwMessage(rd);
									}
								else{
									navigateTo('/ext/admin_tools/showManageFlexedit');
									}
								},
							}
						},'immutable');
					_app.model.addDispatchToQ({'_cmd':'adminConfigDetail','flexedit':'1','_tag':{'datapointer':'adminConfigDetail|flexedit'}},'immutable');
					_app.model.dispatchThis('immutable');
					// }
				// catch(e){
					// $ele.closest('[data-app-role="flexeditAttributeAddUpdateContainer"]').anymessage(_app.u.errMsgObject("The JSON you have entered is invalid"));
					// // _app.u.throwMessage(_app.u.errMsgObject("The JSON you have entered is invalid"));
					// }
				},
			flexeditSaveExec : function($ele,P)	{
				var json = new Array();
				var keys = new Array();
				$ele.closest('form').find('tbody tr').not('.rowTaggedForRemove').each(function(){
					if($.inArray($(this).data('id'),keys) >= 0)	{
						//if an id is already in keys, it's already added to the flex json. This keeps duplicate id's from being added.
						}
					else	{
						keys.push($(this).data('id'));
						//json.push(_app.u.getWhitelistedObject($(this).data(),['id','title','index','cart','type','options']));
						json.push($(this).data('flexedit-definition'));
						}
					})
				_app.model.addDispatchToQ({
					'_cmd':'adminConfigMacro',
					'@updates':["GLOBAL/FLEXEDIT-SAVE?json="+encodeURIComponent(JSON.stringify(json))],
					'_tag':	{
						'callback' : 'showMessaging',
						'jqObj' : $ele.closest('form'),
						'removeFromDOMItemsTaggedForDelete' : true,
						'restoreInputsFromTrackingState' : true,
						'message':'Your changes have been saved'
						}
					},'immutable');
				_app.model.addDispatchToQ({'_cmd':'adminConfigDetail','flexedit':'1','_tag':{'datapointer':'adminConfigDetail|flexedit'}},'immutable');
				_app.model.dispatchThis('immutable');
				},
			
			adminPrivateFileDownloadExec : function($ele,P)	{
				P.preventDefault();
				_app.model.addDispatchToQ({
					'_cmd':'adminPrivateFileDownload',
					'GUID':$ele.closest('tr').data('guid'),
					'_tag':	{
						'datapointer' : 'adminPrivateFileDownload', //big dataset returned. only keep on in memory.
						'callback' : 'fileDownloadInModal',
						'skipDecode' : true //contents are not base64 encoded (feature not supported on this call)
						}
					},'mutable');
				_app.model.dispatchThis('mutable');
				}, //adminPrivateFileDownloadExec
			
			adminPlatformLogDownloadExec : function($ele,P)	{
				P.preventDefault();
				_app.model.addDispatchToQ({
					'_cmd':'adminPlatformLogDownload',
					'GUID':$ele.closest('tr').data('guid'),
					'_tag':	{
						'datapointer' : 'adminPlatformLogDownload', //big dataset returned. only keep on in memory.
						'callback' : 'fileDownloadInModal',
						'skipDecode' : true //contents are not base64 encoded (feature not supported on this call)
						}
					},'mutable');
				_app.model.dispatchThis('mutable');
				}, //adminPlatformLogDownloadExec

			adminPrivateFileRemoveConfirm : function($ele,P)	{
				P.preventDefault();
				var $rows = $ele.closest('.dualModeContainer').find("[data-app-role='dualModeListTbody'] tr.rowTaggedForRemove");
				if($rows.length)	{

					var $D = _app.ext.admin.i.dialogConfirmRemove({
						'message':'Are you sure you want to remove '+$rows.length+' file(s)? There is no undo for this action.',
						'removeButtonText' : 'Remove',
						'removeFunction':function(rd){
							$D.parent().showLoading({"message":"Deleting "+$rows.length+" file(s)"});
							$rows.each(function(){
								_app.model.addDispatchToQ({
									'_cmd':'adminPrivateFileRemove',
									'GUID':$(this).data('guid'),
									'_tag':	{
										'datapointer' : 'adminPrivateFileRemove', //big dataset returned. only keep on in memory.
										'callback' : function(rd){
											if(_app.model.responseHasErrors(rd)){
												$D.anymessage({'message':rd});
												}
											else	{
												//only report failures.
												}
											}
										}
									},'immutable');	
									$(this).empty().remove(); //at the end so the dispatch can use data off of <tr>.							
								});

							_app.model.addDispatchToQ({
								'_cmd':'ping',
								'_tag':	{
									'datapointer' : 'adminPrivateFileRemove', //big dataset returned. only keep on in memory.
									'callback' : function(rd){
										$D.parent().hideLoading();
										$D.empty();
										$D.dialog({ buttons: [ { text: "Close", click: function() { $( this ).dialog( "close" ); } } ] });
										if(_app.model.responseHasErrors(rd)){
											$D.anymessage({'message':rd});
											}
										else	{
											$D.anymessage({"message":"Removal process completed."});
											//only report failures.
											}
										}
									}
								},'immutable');	
	
							_app.model.dispatchThis('immutable');
							
							}
						});	

					}
				else	{
					$('#globalMessaging').anymessage({"message":"Please tag at least one file for removal (click the trash can icon)."});
					}
				}, //adminPrivateFileRemoveConfirm


			agentRemoveConfirm : function($btn)	{
				$btn.button({icons: {primary: "ui-icon-trash"},text: false});
				$btn.off('click.agentRemoveConfirm').on('click.agentRemoveConfirm',function(event){
					event.preventDefault();
					var 
						$tr = $btn.closest('tr'),
						data = $tr.data(),
						$D;

					$D = _app.ext.admin.i.dialogConfirmRemove({'removeFunction':function(){
						$D.showLoading({"message":"Deleting Agent"});
						_app.model.addDispatchToQ({'AGENTID':data.agentid,'_cmd':'adminCIEngineAgentRemove','_tag':{'callback':function(rd){
							$D.hideLoading();
							if(_app.model.responseHasErrors(rd)){
								$('#globalMessaging').anymessage({'message':rd});
								}
							else	{
								$D.dialog('close');
								$('#globalMessaging').anymessage(_app.u.successMsgObject('Agent '+data.agentid+' has been removed.'));
								$tr.empty().remove(); //removes row from list. no need to refetch entire list.
								
								var $panel = $(_app.u.jqSelector('#','agent_'+data.agentid));
								
								if($panel.length)	{
									$panel.anypanel('destroy');
									}
								}
							}}},'immutable');
						_app.model.dispatchThis('immutable');
						}});
					})
				}, //agentRemoveConfirm

			siteDebugExec : function($ele,p)	{
				var cmdObj = $ele.closest('form').serializeJSON();
				cmdObj._tag = {
					'datapointer' : cmdObj._cmd,
					'callback' : function(rd)	{
						var data = _app.data[rd.datapointer], $target = $ele.closest('form').find("[data-app-role='siteDebugContent']").empty();
						if(_app.model.responseHasErrors(rd)){
							$target.anymessage({'message':rd});
							}

						if(!$.isEmptyObject(data['@MSGS']))	{
							data.persistent = true;
							$target.anymessage(data);
							}
						if(!$.isEmptyObject(data['@RESULTS']))	{
							$("<div \/>").css({'max-height':'300px','overflow':'auto'}).append(_app.ext.admin_tools.u.objExplore(data['@RESULTS'])).appendTo($target);
							}
						}
					};
				_app.model.addDispatchToQ(cmdObj,'mutable');
				_app.model.dispatchThis('mutable');
				},

			//for forcing a product into the product task list
			forcePIDIntoPTL : function($ele,p)	{
				_app.ext.admin_prodedit.u.addProductAsTask({'pid':$ele.closest('form').find("[name='pid']").val(),'tab':'product','mode':'add'});
				},
			
			siteDebugDialog : function($ele,p)	{
				p.preventDefault();
				var $SD = $('#siteDebugger');
				if($SD.length)	{
					$SD.empty().dialog('open');
					}
				else	{
					$SD = $("<div \/>").attr({'id':'siteDebugger','title':'Site Debug Tools'}).dialog({
						width : '50%'
						});
					}
				adminApp.ext.admin_tools.a.siteDebugger($SD,{'verb':$ele.data('verb')});
				return false;
				}
				
			} //e [app Events]
		} //r object.
	return r;
	}