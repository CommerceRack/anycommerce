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
					$('#contentArea').removeClass('sideBarRightShow');
					$('#contentArea').addClass('sideBarRightHide');
				}]);
				
				
				app.rq.push(['templateFunction', 'checkoutTemplate','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').hide();
					$('#contentArea').removeClass('sideBarRightShow');
					$('#contentArea').addClass('sideBarRightHide');
				}]);
				
				app.rq.push(['templateFunction', 'homepageTemplate','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').show();
					$('#contentArea').removeClass('sideBarRightHide');
					$('#contentArea').addClass('sideBarRightShow');
				}]);	
				
				app.rq.push(['templateFunction', 'categoryTemplate','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').show();
					$('#contentArea').removeClass('sideBarRightHide');
					$('#contentArea').addClass('sideBarRightShow');
				}]);
				
				app.rq.push(['templateFunction', 'searchTemplate','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').show();
					$('#contentArea').removeClass('sideBarRightHide');
					$('#contentArea').addClass('sideBarRightShow');
				}]);
				
				app.rq.push(['templateFunction', 'customerTemplate','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').show();
					$('#contentArea').removeClass('sideBarRightHide');
					$('#contentArea').addClass('sideBarRightShow');
				}]);	
				
				app.rq.push(['templateFunction', 'companyTemplate','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').show();
					$('#contentArea').removeClass('sideBarRightHide');
					$('#contentArea').addClass('sideBarRightShow');
				}]);
				
				$('.ddMenuBtn').on('click',function(event){
					app.ext.store_zephyrapp.a.showDropDown($(this).parent());
					event.stopPropagation();
					});	
					
				app.rq.push(['templateFunction', 'productTemplate','onCompletes',function(P) {
					var $context = $(app.u.jqSelector('#',P.parentID));
					
					$('.childDropdown',$context).children().each(function(){
						var pid=$(this).val();
						if(pid){
							var $opt=$(this);
							
							var tagObj = {
								"callback":function(rd){
									if(app.ext.store_product.u.productIsPurchaseable(pid)){
										// do nothing muy bueno
										}
									else{
										$opt.attr('disabled','disabled');
										}
									}
								}
							
							app.ext.store_product.calls.appProductGet.init(pid,tagObj,"immutable");
							app.model.dispatchThis("immutable");
							}
						});
					
					$('.childDropdown',$context).on('change',function(event){
						var pid = $(this).val();
						$('.inventoryContainer',$context).empty().anycontent({"datapointer":"appProductGet|"+pid})
						});
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
			showDropDown : function ($container) {
				//app.u.dump('showing');
				//console.log($container.data('timeoutNoShow'));
				if(!$container.data('timeoutNoShow') || $container.data('timeoutNoShow')=== "false") {
					var $dropdown = $(".dropdown", $container);
					var height = 0;
					$dropdown.show();
					if($dropdown.data('width')){
						$dropdown.css("width",$dropdown.data('width'));
					}
					
					if($dropdown.data('height')){
						height = $dropdown.data('height');
					} else{
						$dropdown.children().each(function(){
							height += $(this).outerHeight();
						});
					}
					if($container.data('timeout') && $container.data('timeout')!== "false"){
						clearTimeout($container.data('timeout'));
						$container.data('timeout','false');
					}
					$dropdown.stop().animate({"height":height+"px"}, 500);
					$(".ddMenuBtn",$container).animate({"height":"44px"}, 500);
					
					$('html, .ddMenuBtn').on('click.dropdown',function(){
						//hide the dropdown
						app.u.dump('hiding');
						$(".dropdown", $container).stop().animate({"height":"0px"}, 500);
						$(".ddMenuBtn",$container).animate({"height":"36px"}, 500);
						if($container.data('timeout') && $container.data('timeout')!== "false"){
							$container.data('timeout')
							$container.data('timeout','false');
						}
						$container.data('timeout',setTimeout(function(){$(".dropdown", $container).hide();},500));
						
						//clean up after ourselves
						$('html, .ddMenuBtn').off('click.dropdown')
					});
					return true;
					}
				return false;
				}
			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//renderFormats are what is used to actually output data.
//on a data-bind, format: is equal to a renderformat. extension: tells the rendering engine where to look for the renderFormat.
//that way, two render formats named the same (but in different extensions) don't overwrite each other.
		renderFormats : {
			prodChildOption: function($tag, data){
				$tag.val(data.value.pid);
				if(data.value['%attribs']['amz:grp_varvalue']){
					$tag.text(data.value['%attribs']['amz:grp_varvalue']);
					}
				else{
					$tag.text(data.value['%attribs']['zoovy:prod_name']);
					}
				},
			inventoryAvailQty : function($tag,data){
				if(data.value['%attribs']['zoovy:grp_type'] == 'PARENT'){
					// do nothing
					}
				else {
					var inv = app.ext.store_product.u.getProductInventory(data.value.pid);
					if(inv > 0){
						$tag.append('In Stock Now (Qty avail: '+inv+')');
						}
					else{
					//	Taking out for time being since we already have an out of stock msg
					//	$tag.append('This product is currently out of stock');
						}
					}
				}
			
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
				},
			addItemToCart : function($form,obj){
				var $childSelect = $('.prodChildren.active select', $form);
				if($childSelect.length > 0){
					if($childSelect.val()){
						app.calls.cartItemAppend.init({"sku":$childSelect.val(), "qty":$('input[name=qty]',$form).val()},{},'immutable');
						app.model.destroy('cartDetail');
						app.calls.cartDetail.init({'callback':function(rd){
							if(obj.action === "modal"){
								showContent('cart',obj);
								}
							}},'immutable');
						app.model.dispatchThis('immutable');
						}
					else {
						$form.anymessage(app.u.errMsgObject("You must select an option"));
						}
					}
				else {
					app.ext.myRIA.u.addItemToCart($form, obj);
					}
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