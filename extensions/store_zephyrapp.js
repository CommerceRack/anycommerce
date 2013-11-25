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

// Adding shuffle into jquery options
(function($){
 
        $.fn.shuffle = function () {
        var j;
        for (var i = 0; i < this.length; i++) {
            j = Math.floor(Math.random() * this.length);
            $(this[i]).before($(this[j]));
        }
        return this;
    };
 
})(jQuery);



var store_zephyrapp = function() {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				
				app.rq.push(['templateFunction','homepageTemplate','onCompletes',function(P) {
					//run slideshow code
					var $context = $(app.u.jqSelector('#',P.parentID));
						if (!$('#slideshow', $context).hasClass('slideshowSet')){
							$('#slideshow', $context).addClass('slideshowSet').cycle({
								pause:  1,
								pager:  '#slideshowNav'
							});
						}
					}]);
				
				app.rq.push(['templateFunction','productTemplate','onDeparts',function(P) {
					var $container = $('#recentlyViewedItemsContainer');
					$container.show();
					$("ul",$container).empty(); //empty product list
					$container.anycontent({data:app.ext.myRIA.vars.session}); //build product list
					}]);
					
				app.rq.push(['templateFunction','categoryTemplate','onCompletes', function(P){
					var breadcrumb = P.navcat.split(".");
					var topNavcat = "."+breadcrumb[1];
					$('#sideBarLeft [data-navcat="'+topNavcat+'"] .subCatList').show();
					}]);
					
				app.rq.push(['templateFunction','categoryTemplate','onDeparts', function(P){
					var breadcrumb = P.navcat.split(".");
					var topNavcat = "."+breadcrumb[1];
					$('#sideBarLeft [data-navcat="'+topNavcat+'"] .subCatList').hide();
					}]);	
			
				app.rq.push(['templateFunction', 'homepageTemplate','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));

					$('.randomList', $context).each(function(){
							app.ext.store_zephyrapp.u.randomizeList($(this));
							});
					}]);
					
				app.rq.push(['templateFunction', 'productTemplate','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').hide();
					$('#contentArea').css({"width":"790px","padding":"5px 0px 5px 5px"});
				}]);
				
				app.rq.push(['templateFunction', 'productTemplate','onDeparts',function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').show();
					$('#contentArea').css({"width":"600px","padding":"5px"});
				}]);	
				
				
				app.rq.push(['templateFunction', 'checkoutTemplate','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').hide();
					$('#contentArea').css({"width":"790px","padding":"5px 0px 5px 5px"});
				}]);
				
				app.rq.push(['templateFunction', 'checkoutTemplate','onDeparts',function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').show();
					$('#contentArea').css({"width":"600px","padding":"5px"});
				}]);

				app.rq.push(['templateFunction', 'cartTemplate','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').hide();
					$('#contentArea').css({"width":"790px","padding":"5px 0px 5px 5px"});
				}]);
				
				app.rq.push(['templateFunction', 'cartTemplate','onDeparts',function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').show();
					$('#contentArea').css({"width":"600px","padding":"5px"});
				}]);
				r = true;

				return r;
				
				},
			
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			},
			startExtension: {
				onSuccess : function()	{
					var temp = JSON.parse(app.storageFunctions.readLocal('recentlyViewedItems'));
					var oldTime = JSON.parse(app.storageFunctions.readLocal('timeStamp'));
					var d = new Date().getTime();
					if(d - oldTime > 90*24*60*60*1000) {
						var expired = true;
					}
					else {
						var expired = false;
					}
					if(temp && !expired){
						app.ext.myRIA.vars.session.recentlyViewedItems = temp;
						app.u.dump(app.ext.myRIA.vars.session.recentlyViewedItems);
						var $container = $('#recentlyViewedItemsContainer');
						$container.show();
						$("ul",$container).empty(); //empty product list
						$container.anycontent({data:app.ext.myRIA.vars.session}); //build product list
					}
				},
				onError : function()	{
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

			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
			randomizeList : function($list){
				$list.children().shuffle();
				},
			cacheRecentlyViewedItems: function ($container){
				app.u.dump ('Caching product to recently viewed');
				var d = new Date().getTime();
				app.storageFunctions.writeLocal('recentlyViewedItems', app.ext.myRIA.vars.session.recentlyViewedItems);
				app.storageFunctions.writeLocal('timeStamp',d);// Add timestamp
			}
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