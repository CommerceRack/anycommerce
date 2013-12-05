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



var admin_sites = function() {
	
	var theseTemplates = new Array(
		"domainListTemplate",
		"domainListHostsRowTemplate"
		);
	
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



		callbacks : {
	//executed when extension is loaded. should include any validation that needs to occur.
			init : {
				onSuccess : function()	{
					var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
					app.model.fetchNLoadTemplates(app.vars.baseURL+'extensions/admin/sites.html',theseTemplates);
					app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/sites.css','sites_styles']);
					//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
					r = true;

					return r;
					},
				onError : function()	{
	//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
	//you may or may not need it.
					app.u.dump('BEGIN admin_orders.callbacks.init.onError');
					}
				},
			sitesDomainList : {
				onSuccess : function(_rtag)	{
					var $table = $("[data-app-role='dualModeListTable']",_rtag.jqObj);
					_rtag.jqObj.hideLoading();
					$table.attr('data-bind',"var: users(@DOMAINS); format:processList; loadsTemplate:domainListTemplate;");
					$table.anycontent(_rtag);
					app.u.handleButtons($table);
					}
				}
			}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {
//The sites interface should always be opened in the sites tab.
			showSitesTab : function()	{
				var $target = $("#sitesContent");
				
				if(app.ext.admin.vars.tab != 'sites')	{
					app.ext.admin.u.bringTabIntoFocus('sites');
					app.ext.admin.u.bringTabContentIntoFocus($target);
					}
				
				$target.intervaledEmpty().anydelegate();
				
				var $section = $("<section>").addClass("domainsAndHosts").appendTo($target);
				$section.anycontent({'templateID':'pageTemplateSites','showLoading':false});

				app.model.addDispatchToQ({
					'_cmd':'adminDomainList',
					'hosts' : true,
					'_tag':	{
						'datapointer' : 'adminDomainList|hosts',
						'callback':'anycontent',
						'translateOnly' : true,
						'jqObj' : $section
						}
					},'mutable');
				app.model.dispatchThis('mutable');

				}
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//renderFormats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		renderFormats : {

				//pass in HOSTTYPE as data.
				appHostButtons : function($tag,data)	{
					var $menu = $("<menu \/>").hide();
					
					if(data.value == 'SITEPTR')	{
						$menu.append("<li><a href='#' data-app-event='admin_templateEditor|templateChooserShow' data-mode='Site'>Choose a Template</a></li>");
						$menu.append("<li><a href='#' data-app-event='admin_templateEditor|templateEditorShow' data-mode='Site'>Edit Project</a></li>");
						$menu.append("<li data-app-event='admin_templateEditor|containerFileUploadShow' data-mode='Site'><a href='#'>Upload Template Files</a></li>");
						}
					
					if(data.value == 'SITE' || data.value == 'SITEPTR' || data.value == 'APP')	{
						$menu.append("<li><a href='#' data-app-event='admin_batchJob|batchJobExec' data-whitelist='PROJECT' data-type='UTILITY/GITPULL'>Pull from GitHub</a></li>");
						$menu.append("<li><a href='#' data-app-event='admin_batchJob|batchJobExec' data-type='EXPORT/PAGES' >Export Pages.json</a></li>");
						$menu.append("<li><a href='#' data-app-event='admin_batchJob|batchJobExec' data-type='EXPORT/APPRESOURCE' >Export App Resource Zip</a></li>");
						}
					if($menu.children().length)	{
						$menu.menu();
						$tag.append($menu); //so menu appears where it should.
						$menu.css({'position':'absolute','width':200,'z-index':200,'top':25,'right':0});
						var $button = $("<button>").text("App Related Utilities").button({icons: {primary: "ui-icon-gear",secondary: "ui-icon-triangle-1-s"},text: false});
						$button.on('click',function(){
							$menu.show();
							$( document ).one( "click", function() {
								$menu.hide();
								});
							return false;
							})
						$tag.append($button);
						}
					else	{
						//host/domain isn't app based.
						}
					}

			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			} //e [app Events]
		} //r object.
	return r;
	}