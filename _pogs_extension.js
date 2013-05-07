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

//    !!! ->   TODO: replace 'username' in the line below with the merchants username.     <- !!!

var pogs_cubworld = function() {
	var r = {
////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



		callbacks : {
	//executed when extension is loaded. should include any validation that needs to occur.
			init : {
				onSuccess : function()	{
					var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
					//if there is any functionality required for this extension to load, put it here. such as a check for async google, the FB object, etc. return false if dependencies are not present. don't check for other extensions.
					r = true;

					return r;
					},
				onError : function()	{
	//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
	//you may or may not need it.
					app.u.dump('BEGIN app.ext.cubworld.callbacks.init.onError');
					}
				},
				
			startExtension : {
				onSuccess : function() {
					//app.u.dump(typeof jQuery.fn.cycle);
					if(app.ext.myRIA && app.ext.myRIA.template && handlePogs){
						app.u.dump("Extending Pogs");
						
						app.ext.myRIA.template.productTemplate.onCompletes.push(function(P) {
							app.ext.pogs_cubworld.vars.prodContext = $(app.u.jqSelector('#',P.parentID));
							});
						if($("#appView .productPage").length > 0){
							app.ext.pogs_cubworld.vars.prodContext = $("#appView .productPage:visible");
							}
						$.extend(handlePogs.prototype,app.ext.pogs_cubworld.variations);
						UpdateMLBIcons = app.ext.pogs_cubworld.a.updateMLBIcons;
						}
					else {
						app.u.dump("Retrying Pog Extension");
						setTimeout(function(){app.ext.cubworld.callbacks.startExtension.onSuccess()},250);
						}
					},
				onError : function() { 
					app.u.dump('BEGIN app.ext.cubworld.callbacks.startExtension.onError');
					}
				}
			}, //callbacks

		variations : {
			renderOptionLABELDADDYLIST : function(pog){
				app.u.dump(pog);
				var $option = $('<div></div>')
				var $input = $('<input type="hidden" name="'+pog.id+'"/>');
				var $teamlist = $("<div class='mlbcategorylist' style='height:200px;overflow:auto;width:150px;display:inline-block;'></div>");
				var $optionlist= $("<div id='ldicons_"+pog.fieldname+"' style='height:200px;overflow:auto;width:250px;display:inline-block;'></div>");
				$option.append($input);
				$option.append($teamlist);
				$option.append($optionlist);
				
				$teamlist.append($('<div><a class="pointer">Baltimore Orioles</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('orioles',$optionlist);}))
						.append($('<div><a class="pointer">Boston Red Sox</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('redsox',$optionlist);}))
						.append($('<div><a class="pointer">Chicago White Sox</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('whitesox',$optionlist);}))
						.append($('<div><a class="pointer">Cleveland Indians</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('indians',$optionlist);}))
						.append($('<div><a class="pointer">Detroit Tigers</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('tigers',$optionlist);}))
						.append($('<div><a class="pointer">Kansas City Royals</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('royals',$optionlist);}))
						.append($('<div><a class="pointer">LA Angels of Anaheim</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('LAA',$optionlist);}))
						.append($('<div><a class="pointer">Minnesota Twins</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('twins',$optionlist);}))
						.append($('<div><a class="pointer">New York Yankees</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('yankees',$optionlist);}))
						.append($('<div><a class="pointer">Oakland Athletics</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('athletics',$optionlist);}))
						.append($('<div><a class="pointer">Seattle Mariners</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('mariners',$optionlist);}))
						.append($('<div><a class="pointer">Tampa Bay Rays</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('bayrays',$optionlist);}))
						.append($('<div><a class="pointer">Toronto Blue Jays</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('bluejays',$optionlist);}))
						.append($('<div><a class="pointer">Texas Rangers</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('rangers',$optionlist);}))
						.append($('<div><a class="pointer">Arizona Diamondbacks</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('arizona',$optionlist);}))
						.append($('<div><a class="pointer">Atlanta Braves</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('braves',$optionlist);}))
						.append($('<div><a class="pointer">Chicago Cubs</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('cubs',$optionlist);}))
						.append($('<div><a class="pointer">Cincinnati Reds</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('reds',$optionlist);}))
						.append($('<div><a class="pointer">Colorado Rockies</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('rockies',$optionlist);}))
						.append($('<div><a class="pointer">Houston Astros</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('houston',$optionlist);}))
						.append($('<div><a class="pointer">Los Angeles Dodgers</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('dodgers',$optionlist);}))
						.append($('<div><a class="pointer">Miami Marlins</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('marlins',$optionlist);}))
						.append($('<div><a class="pointer">Milwaukee Brewers</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('brewers',$optionlist);}))
						.append($('<div><a class="pointer">New York Mets</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('mets',$optionlist);}))
						.append($('<div><a class="pointer">Philadelphia Phillies</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('phillies',$optionlist);}))
						.append($('<div><a class="pointer">Pittsburgh Pirates</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('pirates',$optionlist);}))
						.append($('<div><a class="pointer">St. Louis Cardinals</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('cardinals',$optionlist);}))
						.append($('<div><a class="pointer">San Diego Padres</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('padres',$optionlist);}))
						.append($('<div><a class="pointer">San Francisco Giants</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('giants',$optionlist);}))
						.append($('<div><a class="pointer">Washington Nationals</a></div>').bind('click',function(){app.ext.pogs_cubworld.a.openIconDetails('nationals',$optionlist);}));
				
				$option.append('<div class="labelPreview"></div>')
				return $option;
				},
			renderOptionCUSTOMIZERNOTICE : function(pog){
				$option = $("<input type='hidden' name='AK'/>");
				
				$atcForm = $('.prodViewerAddToCartForm', (app.ext.pogs_cubworld.vars.prodContext ? app.ext.pogs_cubworld.vars.prodContext : $('#mainContentArea')))
				$atcForm.unbind('submit').attr('onSubmit','');
				$atcForm.bind('submit', function(){
					var $notice = $('<div>'+pog.prompt+'</div>');
					
					var $button = $('<button>I agree</button>');
					$button.bind('click',function(){
						$notice.dialog('close');
						$option.val("ON");
						app.ext.myRIA.u.addItemToCart($atcForm,{'action':'modal'}); 
						return false;
						});
						
					$notice.append($button);
					
					$notice.dialog({'modal':'true','title':'Custom Product Agreement'});
					return false;
				});
				
				
				return $option
				},
			xinit : function(){
				this.addHandler("pogid","CH","renderOptionLABELDADDYLIST");
				this.addHandler("pogid","AK","renderOptionCUSTOMIZERNOTICE");
				}
			},

////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//actions are functions triggered by a user interaction, such as a click/tap.
//these are going the way of the do do, in favor of app events. new extensions should have few (if any) actions.
		a : {
			openIconDetails : function(team, $target){
				var queryString = "?iconname=" + team ;
				var jsonp_url = "http://www.labeldaddy.com/widget/getIcons.php" + queryString + "&jsoncallback=?";
				$.getJSON(jsonp_url, function(data) {
					$target.empty().append($(data.html));
					});
				return false;
				},
			updateMLBIcons : function(iconset){
				$('input[name=CH]', app.ext.pogs_cubworld.vars.prodContext).val(iconset);
				app.ext.pogs_cubworld.u.showLabelPreview();
				}
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//renderFormats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		renderFormats : {
			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
			showLabelPreview : function(){
			
				var labelName = $('input[name=CJ]', app.ext.pogs_cubworld.vars.prodContext).val();
				var labelLastName = $('input[name=CK]', app.ext.pogs_cubworld.vars.prodContext).val();
				var labelIcon = $('input[name=CH]', app.ext.pogs_cubworld.vars.prodContext).val();
				

				var queryString = "?labelName=" + labelName + "&labellastName=" + labelLastName + "&labelicon=" + labelIcon ;
				var jsonp_url = "http://www.labeldaddy.com/widget/MLBPackWidget.php" + queryString + "&jsoncallback=?";
				$.getJSON(jsonp_url, function(data) {
					$('.labelPreview', app.ext.pogs_cubworld.vars.prodContext).html(data.html);
					});
				}
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			}, //e [app Events]
		vars : {
			prodContext : undefined
			}
		} //r object.
		
	return r;
	}