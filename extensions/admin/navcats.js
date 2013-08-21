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

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//renderFormats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		renderFormats : {
			openSubcatsIcon : function($tag,data)	{
				if(data.value['@subcategories'].length)	{
					$tag.attr('data-app-action','admin_navcats|navcatSubsShow').removeClass('opacity50');
					}
				}
			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
//subcats is an array of safe ID's.
//Container is the parent of where the list will be generated.  typically a tbody or ul.
//vars MUST contain templateID. may support more later.
			getSubcats : function(subcats,$container,vars)	{
				vars = vars || {};
				if(subcats && $container instanceof jQuery && vars.templateID) {
				
					var L = subcats.length;
					
					for(var i = 0; i < L; i += 1)	{
	//					app.u.dump(" -> subcats[i]: "+subcats[i]);
						var
							$cat = app.renderFunctions.createTemplateInstance(vars.templateID,{"catsafeid":subcats[i]}),
							datapointer = 'adminNavcatDetail|'+app.vars.partition+'|'+subcats[i]
						
						$container.append($cat);
//hhhmmm....  if this is going to be used a lot, we may want to do a 'call' for it to reduce if/else
	if(app.model.fetchData(datapointer))	{
		$cat.anycontent({'datapointer':datapointer})
		}
	else	{
		app.model.addDispatchToQ({
			'safe':subcats[i],
			'detail':'more',
			'_cmd': 'adminNavcatDetail',
			'_tag' : {
				'callback':'anycontent',
				'datapointer':datapointer,
				'jqObj':$cat}
			},'mutable');
		}
							
//						app.calls.appNavcatDetail.init({'safe':subcats[i],'detail':'more'},{'callback':'anycontent','jqObj':$cat},'mutable');
						}
					app.model.dispatchThis('mutable');
					}
				else	{
					$('#globalMessaging').anymessage({'message':"In admin_navcats.u.getSubcats, either subcats ["+typeof subcats+"], $container ["+($container instanceof jQuery)+"] or vars.templateID ["+vars.templateID+"] was not set and all three are required.",'gMessage':true})
					}
				
				
				},
			
/*
mode could be:  builder, selector
this should only be run once within a 'selector' (meaning don't re-run this for each subcat set, use getSubcats)

*/
			getTree : function(mode,vars){
				var $tree = $("<div \/>").attr('data-app-role','categoryTree').data(vars).data('mode',mode);
				vars = vars || {};
				//set some defaults.
				if(mode)	{
					if(vars.templateID)	{
						$tree.showLoading({'message':'Fetching category tree'});

						//all required params are present/set. proceed.
						app.model.addDispatchToQ({
							'detail':'more',
							'_cmd': 'adminNavcatDetail',
							'path' : '.',
							'navtree' : 'PRT000',
							'_tag' : {
								'callback':function(rd){
									$tree.hideLoading();
									if(app.model.responseHasErrors(rd)){
										$tree.anymessage({'message':rd});
										}
									else	{
										app.ext.admin_navcats.u.getSubcats(app.data[rd.datapointer]['@subcategories'],$("<ul class='noPadOrMargin listStyleNone' \/>").attr('data-app-role','categories').appendTo($tree),vars);
										}
									},
								'datapointer':'adminNavList'
								}
							},'mutable');

						app.model.dispatchThis('mutable');
						}
					else	{
						$tree.anymessage({'message':'In admin_navcats.u.getTree, vars.templateID ['+vars.templateID+'] not set or invalid.','gMessage':true});
						}

					}
				else	{
					$tree.anymessage({'message':'In admin_navcats.u.getTree, mode ['+mode+'] not set or invalid.','gMessage':true});
					}
				app.ext.admin_navcats.u.handleCatTreeDelegation($tree);
				return $tree;
				},
			
			handleCatTreeDelegation : function($tree)	{
				$tree.on('click',function(e){
					
					var $target = $(e.target);
					if($target.data('app-action'))	{
						app.u.dump(" -> $target.data('app-action'): "+$target.data('app-action'));
						var
							actionExtension = $target.data('app-action').split('|')[0],
							actionFunction =  $target.data('app-action').split('|')[1];
						
						if(actionExtension && actionFunction)	{
							if(app.ext[actionExtension].e[actionFunction] && typeof app.ext[actionExtension].e[actionFunction] === 'function')	{
								app.ext[actionExtension].e[actionFunction]($target);
								}
							else	{
								$('#globalMessaging').anymessage({'message':"In admin_navcats.u.handleCatTreeDelegation, extension ["+actionExtension+"] and function["+actionFunction+"] both passed, but the function does not exist within that extension.",'gMessage':true})
								}
							}
						else	{
							$('#globalMessaging').anymessage({'message':"In admin_navcats.u.handleCatTreeDelegation, app-action ["+$target.data('app-action')+"] is invalid.",'gMessage':true})
							}
						
						}
					});
				}
			
			}, //u [utilities]

		e : {
			
			
			navcatSubsShow : function($ele)	{
//				app.u.dump("BEGIN analyzer.a.showSubcats ["+path+"]");
//
					var
						$subcats = $ele.closest('li').find("[data-app-role='categories']"),
						path = $ele.closest('li').data('catsafeid'),
						$icon = $ele.closest('li').find('.ui-icon:first');
					
					if(path)	{
						if($subcats.length)	{
							if($subcats.children().length)	{
								//subcats have already been rendered. not an error, just handled differently.
								$subcats.toggle('fast',function(){
									if($subcats.is(':visible'))	{$icon.removeClass('ui-icon-circle-triangle-e').addClass('ui-icon-circle-triangle-s')}
									else	{$icon.removeClass('ui-icon-circle-triangle-s').addClass('ui-icon-circle-triangle-e')}
									});
								
								} 
							else	{
								$icon.removeClass('ui-icon-circle-triangle-e').addClass('ui-icon-circle-triangle-s');
								app.ext.admin_navcats.u.getSubcats(app.data['appNavcatDetail|'+path]['@subcategories'],$subcats,{'templateID':$subcats.data('loadstemplate')});
								}
							}
						else	{$('#globalMessaging').anymessage({'message':"In admin_navcats.e.navcatSubsShow, no element with data-app-role='categories' exists (no destination for subcats",'gMessage':true})}
						}
					else	{$('#globalMessaging').anymessage({'message':"In admin_navcats.e.navcatSubsShow, unable to ascertain path/catsafeid.",'gMessage':true})}

				}, //navcatSubsShow
			
			
			} //e [app Events]
		} //r object.
	return r;
	}