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

/*

on the navcat object, save a 'data' for the array of 'whats checked'.  Then, when a tree is opened or closed, look at that array to see what should be prechecked.
also, add a button for 'show all the checked categories'.


*/

var admin_navcats = function() {
	var theseTemplates = new Array('catTreeItemTemplate');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/navcats.html',theseTemplates);
				//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
				r = true;

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

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
		a : {

			showCategoriesAndLists : function($target)	{
				var path = '.'; //eventually, this could be something other than ., like the root path of the domain in focus.
				$target.empty().anycontent({'templateID':'categoriesAndListsTemplate','showLoading':false});
				app.u.handleButtons($target); //run early before content populated cuz getTree code will execute per list item. this is for the more global buttons (add, refresh, etc).
				$("[data-app-role='navcatsContainer']:first",$target).append(app.ext.admin_navcats.u.getTree('navcats',{
					'templateID' : 'catTreeNavcatItemTemplate',
					'path' : path
					}))

				$("[data-app-role='listsContainer']:first",$target).append(app.ext.admin_navcats.u.getTree('lists',{
					'templateID' : 'catTreeNavcatItemTemplate',
					'path' : path
					}))
				
				app.u.handleEventDelegation($target);
				}

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//renderFormats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		renderFormats : {
			openSubcatsIcon : function($tag,data)	{
				if(data.value['@subcategories'] && data.value['@subcategories'].length)	{
					$tag.attr('data-app-click','admin_navcats|navcatSubsShow').removeClass('opacity50').addClass('pointer');
					}
				}
			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
//subcats is an array of safe ID's.
//Container is the parent of where the list will be generated.  typically a tbody or ul.
//vars MUST contain templateID.
//vars.fetchonly allows for getTree to 'get' all the data, but not display it right away. used when tree initially loads.
			getSubcats : function(subcats,$container,vars)	{
//				app.u.dump("BEGIN admin_navcats.u.getSubcats. $container.length: "+$container.length);
//				app.u.dump(" -> subcats:"); app.u.dump(subcats);
//				app.u.dump(" -> vars: "); app.u.dump(vars);

				var r = 0; //what is returned. will be # of dispatches added to Q.
				vars = vars || {};
				if(subcats && (($container instanceof jQuery  && vars.templateID) || vars.fetchOnly)) {
app.u.dump(" => typeof dpsGet: "+typeof app.ext.admin.u.dpsGet('navcat','tree4prt'+app.vars.partition)); app.u.dump(app.ext.admin.u.dpsGet('navcat','tree4prt'+app.vars.partition));
					var
						L = subcats.length,
						navcatObj = app.ext.admin.u.dpsGet('navcat','tree4prt'+app.vars.partition) || [], //list of 'open' categories from localStorage.
						NOL = navcatObj.length;
						

//					app.u.dump(' -> navcatObj: '); app.u.dump(navcatObj);
//go through list of subcats and get detail for each.
					for(var i = 0; i < L; i += 1)	{
//						app.u.dump(" -> subcats[i]: "+subcats[i]+" and fetchonly: "+vars.fetchOnly);
						var
							$cat = vars.fetchOnly ? '' : app.renderFunctions.createTemplateInstance(vars.templateID,{"catsafeid":subcats[i]}),
							datapointer = 'adminNavcatDetail|'+app.vars.partition+'|'+subcats[i]
						
						if(vars.fetchOnly)	{}
						else	{
							$container.append($cat);
							var paths = $container.closest("[data-app-role='categoryTree']").data('paths') || []; //set from getTree. The list of 'paths' to be checked (such as a list of categories a product is in)
//							app.u.dump(" -> safeID's has a length"); app.u.dump(paths);
							}

						var _tag = {
							'path' : subcats[i],
							'callback': vars.fetchOnly ? false : function(rd){
								$('.wait',$container).hide();
								if(app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									app.callbacks.anycontent.onSuccess(rd); //translate the tree.
//if the category is 'open' in DPS, trigger the click to show the subcats (which will already have been loaded in memory by now)
									if($.inArray(rd.path,navcatObj) >= 0)	{
										$("[data-catsafeid='"+rd.path+"']",$container).find("[data-app-click='admin_navcats|navcatSubsShow']").first().trigger('click',{'skipDPSset':vars.skipDPSset});
										}
//if the category is present in the paths array, that means it should be 'checked'.
									if($.inArray(rd.path,paths) >= 0)	{
//										app.u.dump("Match! "+rd.path);	app.u.dump(" -> cb.length: "+$(":checkbox[name='"+rd.path+"']",$container).length);
										$(":checkbox[name='"+rd.path+"']",$container).prop('checked','checked'); //don't use $cat for context, it isn't set if loading from api (vs local storage)
										}
									app.u.handleButtons($cat);
									}
								},
							'datapointer':datapointer,
							'jqObj':vars.fetchOnly ? '' : $cat}
						
//						app.u.dump(" -> typeof callback: "+typeof _tag.callback);
					//hhhmmm....  if this is going to be used a lot, we may want to do a 'call' for it to reduce if/else
						if(app.model.fetchData(datapointer))	{
							app.u.handleCallback(_tag);
							}
						else	{
							r++;
							app.model.addDispatchToQ({
								'path':subcats[i],
								'detail':'more',
								'navtree' : 'PRT00'+app.vars.partition,
								'_cmd': 'adminNavcatDetail',
								'_tag' : _tag
								},'mutable');
							}
							
//						app.calls.appNavcatDetail.init({'safe':subcats[i],'detail':'more'},{'callback':'anycontent','jqObj':$cat},'mutable');
						}
					app.model.dispatchThis('mutable');
					}
				else	{
						$('#globalMessaging').anymessage({'message':"In admin_navcats.u.getSubcats, either subcats ["+typeof subcats+"], $container ["+($container instanceof jQuery)+"] or vars.templateID ["+vars.templateID+"] was not set and all three are required. (fetchonly: "+vars.fetchOnly+")",'gMessage':true});
					}
				},

/*
This is what gets run to display a category tree.  
this should only be run once within a 'selector' (meaning don't re-run this for each subcat set, use getSubcats)
Params:
	mode could be:  builder, chooser
	vars:
		navtree -> required. the root level category of this tree
		templateID -> required. the template to be used for each category (list item)
		paths -> an array of safe id's. each of these will be 'checked' (enabled, turned on, whatever)
	
*/
			getTree : function(mode,vars){
//				app.u.dump("BEGIN admin_navcats.u.getTree");
//				app.u.dump(" -> vars: "); app.u.dump(vars);
				var $tree = $("<div \/>").attr('data-app-role','categoryTree').data(vars).data('mode',mode);
				vars = vars || {};

				//set some defaults.
				if(mode)	{
					if(vars.templateID && vars.path)	{
						$tree.addClass('categoryTree categoryTree_'+mode);
						$tree.showLoading({'message':'Fetching category tree'});
						
						var $ul = $("<ul class='noPadOrMargin listStyleNone' \/>").attr('data-app-role','categories');
						$ul.appendTo($tree);
						
						if(mode == 'lists')	{
							app.ext.admin.calls.appCategoryList.init({'root':'.','filter':'lists'},{'callback':function(rd){
								$tree.hideLoading();
								if(app.model.responseHasErrors(rd)){
									$('#globalMessaging').anymessage({'message':rd});
									}
								else	{
									if(app.data[rd.datapointer] && app.data[rd.datapointer]['@paths'] && app.data[rd.datapointer]['@paths'].length)	{
										var L = app.data[rd.datapointer]['@paths'].length
										for(var i = 0; i < L; i+= 1)	{
											$ul.anycontent({'templateID':vars.templateID, 'dataAttribs' : {'catsafeid':app.data[rd.datapointer]['@paths'][i]},'data' : {'pretty':app.data[rd.datapointer]['@paths'][i],'catsafeid':app.data[rd.datapointer]['@paths'][i]}})
											}
										app.u.handleButtons($ul);
										}
									else	{} //no lists
									}
								}},'mutable');
							app.model.dispatchThis('mutable');
							}
						else	{
						
							var navcatObj = app.ext.admin.u.dpsGet('navcat','tree4prt'+app.vars.partition) || {};
	//						app.u.dump(' -> navcatObj (list of cats that should be "open": '); app.u.dump(navcatObj);
	
							app.ext.admin_navcats.u.getSubcats(navcatObj,"",{fetchOnly:true}); //get all the 'open' category data handy.
							//all required params are present/set. proceed.
							app.model.addDispatchToQ({
								'detail':'more',
								'_cmd': 'adminNavcatDetail',
								'path' : vars.path,
								'navtree' : 'PRT00'+app.vars.partition,
								'_tag' : {
									'callback':function(rd){
										$tree.hideLoading();
										if(app.model.responseHasErrors(rd)){
											$tree.anymessage({'message':rd});
											}
										else	{
											if(app.data[rd.datapointer]._msg_1_type == 'warning')	{
												$tree.anymessage({'message':rd});
												}
											app.ext.admin_navcats.u.getSubcats(["."],$ul,vars); //show the homepage.
//											app.ext.admin_navcats.u.getSubcats(app.data[rd.datapointer]['@subcategories'],$("[data-app-role='categories']:first",$ul),vars);
	// SANITY-> if applyEditTrackingToInputs is desired, add it outside this to the parent container.
	//										app.ext.admin.u.applyEditTrackingToInputs($tree); 
											}
										},
									'datapointer':'adminNavList|'+app.vars.partition+"|"+vars.path
									}
								},'mutable');
	
							app.model.dispatchThis('mutable');
							}
//SANITY	-> if event delegation occurs here, before $tree is added to the dom, the event delegation script can't look up the DOM to see if events have already been added. thus, dual-delegation could occur (bad).
//			-> handle delegation by whatever calls getTree. Which is probably the right way to do it anyway since the delegation should occur at a high level. 
//			-> this issue was discovered in product editor, so any changes to this function and events should be tested there.
//						app.u.handleEventDelegation($tree); //handles click events

						}
					else	{
						$tree.anymessage({'message':'In admin_navcats.u.getTree, vars.templateID ['+vars.templateID+'] or vars.path ['+vars.path+'] not set or invalid.','gMessage':true});
						}

					}
				else	{
					$tree.anymessage({'message':'In admin_navcats.u.getTree, mode ['+mode+'] not set or invalid.','gMessage':true});
					}
				
				return $tree;
				},

			
			getPathsArrayFromTree : function($tree)	{
				var arr = {}; //what is returned. either an object where key = safeid/path and value = 1/0 OR false, if $tree doesn't validate.
				if($tree instanceof jQuery)	{
					$(":checkbox.edited",$tree).each(function(){
						arr[$(this).attr('name')] = $(this).is(':checked') ? 1 : 0;
						});
					}
				else	{
					arr = false;
					$('#globalMessaging').anymessage({'message':'In admin_navcats.u.getPathsArrayFromTree, $tree is not a valid jquery instance.','gMessage':true});
					}
				return arr;
				},
			
			destroyPathsModified : function(paths)	{
				if(paths && paths.length)	{
					var L = paths.length;
					for(var i = 0; i < L; i += 1)	{
						app.model.destroy("adminNavcatDetail|"+app.vars.partition+"|"+paths[i]);
						app.model.addDispatchToQ({
							'path':paths[i],
							'detail':'more',
							'navtree' : 'PRT00'+app.vars.partition,
							'_cmd': 'adminNavcatDetail',
							'_tag' : {
								'datapointer' : "adminNavcatDetail|"+app.vars.partition+"|"+paths[i]
								}
							},'mutable');
						}
					app.model.dispatchThis('mutable');
					}
				},



// a function for adding or removing a category from the list of what's open by default.
// On the initial load, p.skipDPSset will be true. In this case, DPS modification does NOT occur because the click is triggered automatically, not by a user interaction.
			handleNavcatDPS : function (cmd,path)	{
				var navcatObj = app.ext.admin.u.dpsGet('navcat','tree4prt'+app.vars.partition) || new Array();
				
				var index = $.inArray(path,navcatObj);
			//	app.u.dump(" -> cmd: "+cmd);
			//	app.u.dump(" -> index: "+index);
				if((cmd == 'remove' && index < 0) || (cmd == 'add' && index >= 0))	{
					//do nothing. array already reflects cmd.
			//		app.u.dump("NO ACTION NECESSARY FOR "+path);
					} 
				else if(cmd == 'remove')	{
			//		app.u.dump("REMOVE "+path);
					navcatObj.splice(index,1);
					app.ext.admin.u.dpsSet('navcat','tree4prt'+app.vars.partition,navcatObj);
					}
				else if(cmd == 'add' && index < 0){
					navcatObj.push(path);
					app.ext.admin.u.dpsSet('navcat','tree4prt'+app.vars.partition,navcatObj);
					}
				else	{
					app.u.dump("handleNavcatDPS in navcatSubsShow had an invalid CMD passed or some unexpected condition was met.",'warn');
					}
			//	app.u.dump(" -> navcatObj: "); app.u.dump(navcatObj);
				}


			
			}, //u [utilities]
//This extension uses a delegated event model, so each 'event' below does NOT need an on() declared. 
		e : {
			
			categoryEditExec : function($ele,p)	{
				var catSafeID = $ele.closest('li').data('catsafeid');
				if(catSafeID)	{
					navigateTo("/biz/vstore/builder/index.cgi?ACTION=INITEDIT&FORMAT=PAGE&PG="+catSafeID+"&FS=C");
					}
				else	{
					$ele.closest('li').anymessage({'message':'In admin_navcats.e.categoryEditExec, unable to ascertain category safe id.'});
					}
				},	 //categoryEditExec
			
			categoryProductFinderExec : function($ele,p)	{
				var catSafeID = $ele.closest('li').data('catsafeid');
				if(catSafeID)	{
					app.ext.admin.a.showFinderInModal('NAVCAT',catSafeID);
					}
				else	{
					$ele.closest('li').anymessage({'message':'In admin_navcats.e.categoryProductFinderExec, unable to ascertain category safe id.'});
					}
				}, //categoryProductFinderExec

			adminNavcatMacroDeleteShow : function($ele,p)	{
				var catSafeID = $ele.closest('li').data('catsafeid');
				app.ext.admin.i.dialogConfirmRemove({
					"message" : "Are you sure you wish to remove this category? There is no undo for this action.",
					"removeButtonText" : "Remove Category", 
					"title" : "Remove Category "+catSafeID, 
					"removeFunction" : function(vars,$D){
						$D.showLoading({"message":"Deleting category "+catSafeID});
						app.model.addDispatchToQ({
							'_cmd':'adminNavcatMacro',
							'@updates' : ["DELETE?path="+catSafeID],
							'_tag':	{
								'datapointer' : 'adminNavcatMacro',
								'callback':function(rd)	{
									$D.hideLoading();
									if(app.model.responseHasErrors(rd)){
										$('#globalMessaging').anymessage({'message':rd});
										}
									else	{
										$D.dialog('close');
										$ele.closest('li').empty().remove();
										app.ext.admin_navcats.u.handleNavcatDPS('remove',catSafeID);
										app.ext.admin_navcats.u.destroyPathsModified(app.data[rd.datapointer]['@PATHS_MODIFIED']);
										}
									}
								}
							},'immutable');
						app.model.dispatchThis('immutable');
						}
					})
				
				}, //adminNavcatMacroDeleteShow

			adminNavcatsCreateRenameShow : function($ele,p)	{
				if($ele.data('verb'))	{
					var $container = $ele.parent().find("[data-app-role='categoryCreateRenameContainer']").show(); //used for context in button selector as well, which is why it's a var.
					$('button',$container).button('option', 'label', $ele.data('verb').toLowerCase()).data('verb',$ele.data('verb')); //tell the button what to do (create or rename) so the onclick performs the right action.
					}
				else	{
					$('#globalMessaging').anymessage({"message":"In admin_navcats.e.adminNavcatsCreateRenameShow, trigger element does not have a data-verb set.","gMessage":true});
					}
				}, //adminNavcatsCreateRenameShow



			adminNavcatsMacro : function($ele,p)	{
				var verb = $ele.data('verb');
				if(verb)	{
					var catSafeID = $ele.closest("[data-catsafeid]").data('catsafeid');
					if(catSafeID)	{
						var cmdObj = {
							'_cmd':'adminNavcatMacro',
							'@updates' : [],
							'_tag':	{
								'datapointer' : 'adminNavcatMacro',
								'callback':function(rd){
if(app.model.responseHasErrors(rd)){
	$('#globalMessaging').anymessage({'message':rd});
	}
else	{
	//clear everything out of memory and local storage that was just updated.
	app.ext.admin_navcats.u.destroyPathsModified(app.data[rd.datapointer]['@PATHS_MODIFIED']);
	if(verb == 'RENAME')	{
		$ele.closest('li').find("[data-app-role='pretty']").text($ele.closest('li').find("[name='pretty']").val())
		}
	else if(verb == 'CREATE')	{
		$ele.closest("[data-app-role='navcatsContainer']").empty().append(app.ext.admin_navcats.u.getTree('navcats',{'path':'.','templateID':'catTreeNavcatItemTemplate'}));
		}
	else if(verb == 'LISTCREATE')	{
		var $container = $ele.closest("[data-app-role='navcatsSection']");
		$("[data-app-role='listsContainer']",$container).empty().append(app.ext.admin_navcats.u.getTree('lists',{'path':'.','templateID':'catTreeNavcatItemTemplate'}));
		}
	else	{}

	}
//Need to run app.model.destroy on everything in the @paths_modified array.									
	
									}
								}
							}
		
						if(verb == 'CREATE' || verb == 'RENAME' || verb == 'LISTCREATE')	{
							cmdObj['@updates'].push((verb == 'RENAME' ? verb : 'CREATE')+"?path="+catSafeID+"&"+$.param($ele.closest('div').serializeJSON()));
//							app.u.dump(" -> cmdObj: "); app.u.dump(cmdObj);
							app.model.addDispatchToQ(cmdObj,'immutable');
							
							if(verb == 'LISTCREATE')	{
								app.model.destroy("appCategoryList|"+app.vars.partition+"|lists|.");
								}
							
							app.model.dispatchThis('immutable');
							}
						else	{
							$ele.closest('div').anymessage({"message":"In admin_navcats.e.adminNavcatsMacro, unrecognized verb ["+verb+"] on trigger element..","gMessage":true});
							}
						}
					else	{
						$ele.closest('div').anymessage({"message":"In admin_navcats.e.adminNavcatsMacro, could not ascertain the catSafeID.","gMessage":true});
						}
					}
				else	{
					$ele.closest('div').anymessage({"message":"In admin_navcats.e.adminNavcatsMacro, trigger element does not have a data-verb set (should be set dynamically by adminNavcatsCreateRenameShow).","gMessage":true});
					}
				},
		
//triggered when a category is clicked opened or closed.
//will show/load or hide the category as needed.  Will also update DPS so that the next time the user comes into the category editor, 
//anything that was open will auto-open in the current session.
//p.skipDPSset is passed in on the initial load in order to skip the DPS update, which isn't needed because the click is triggered by the app (to reopen open cats)
			navcatSubsShow : function($ele,p)	{
				app.u.dump("BEGIN admin_navcats.e.navcatSubsShow");
//				app.u.dump(" -> p: "); app.u.dump(p);
					p = p || {};
					var
						$subcats = $ele.closest('li').find("[data-app-role='categories']"),
						path = $ele.closest('li').data('catsafeid'),
						$icon = $ele.closest('li').find('.ui-icon:first');
					
					if(path)	{
						
//						app.u.dump(' -> path: '+path);

						if($subcats.length)	{
							if($subcats.children().length)	{
								//subcats have already been rendered. not an error, just handled differently.
								if($subcats.is(':visible'))	{
									$icon.removeClass('ui-icon-circle-triangle-s').addClass('ui-icon-circle-triangle-e');
									if(!p.skipDPSset)	{app.ext.admin_navcats.u.handleNavcatDPS('remove',path);}
									}
								else	{
									$icon.removeClass('ui-icon-circle-triangle-e').addClass('ui-icon-circle-triangle-s')
									if(!p.skipDPSset)	{app.ext.admin_navcats.u.handleNavcatDPS('add',path)};
									}
								$subcats.toggle('fast'); //putting the handleDPS code in the toggle oncomplete was causing it to be executed multiple times
								
								}
							else	{
								var dp = 'adminNavcatDetail|'+app.vars.partition+'|'+path
//								app.u.dump(' -> datapointer: '+dp);
//ok. can't rely on this data being in memory because navcat mode needs to be able to flip sections off then on to refresh them.
var navCallback = function(rd){
	if(app.model.responseHasErrors(rd)){
//8001 error would be a category that no longer exists. If we hit this, remove the safeid from local storage.
		if(rd._msg_1_id == '8001')	{
			app.u.dump(" ---------------------> got to 8001 error.");
			app.ext.admin_navcats.u.handleNavcatDPS('remove',path)
			}
		$('#globalMessaging').anymessage({'message':rd});
		}
	else	{
		$icon.removeClass('ui-icon-circle-triangle-e').addClass('ui-icon-circle-triangle-s');
		if(!p.skipDPSset)	{app.ext.admin_navcats.u.handleNavcatDPS('add',path)};
		app.ext.admin_navcats.u.getSubcats(app.data[dp]['@subcategories'],$subcats,{'templateID':$subcats.data('loadstemplate')});
		}	
	}
								if(app.data[dp])	{
									navCallback({datapointer:dp});
									}
								else	{
									app.model.addDispatchToQ({
										'_cmd':'adminNavcatDetail',
										'_tag':	{
											'datapointer' : dp,
											'callback':navCallback
											}
										},'mutable');
									app.model.dispatchThis('mutable');
//									$('#globalMessaging').anymessage({'message':"In admin_navcats.e.navcatSubsShow, attempted to load app.data["+dp+"], which is not in memory.",'gMessage':true})
									}
								}
							}
						else	{$('#globalMessaging').anymessage({'message':"In admin_navcats.e.navcatSubsShow, no element with data-app-role='categories' exists (no destination for subcats",'gMessage':true})}
						}
					else	{$('#globalMessaging').anymessage({'message':"In admin_navcats.e.navcatSubsShow, unable to ascertain path/catsafeid.",'gMessage':true})}

				}, //navcatSubsShow

			
			navcatsCheckedShow : function($btn)	{
				//will open all the categories that are checked.
var $tree = $btn.closest("[data-app-role='categoryTree']");
var paths = $tree.data('paths') || []; //used to 'precheck' items in list.
var numDispatches = app.ext.admin_navcats.u.getSubcats(paths,"",{fetchOnly:true}); //get all the 'open' category data handy.
setTimeout(function(){
	 app.ext.admin_navcats.u.getSubcats(paths,"",{fetchOnly:false}); //get all the 'open' category data handy.
	},3000);
app.model.dispatchThis('mutable');
				}
			
			
			} //e [app Events]
		} //r object.
	return r;
	}