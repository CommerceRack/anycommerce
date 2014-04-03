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





var store_zephyrapp = function(_app) {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).


//bind a click action for the dropdown on the shop link.
				$('#shopNowLink').on('click',function(){
					$('#tier1categories').slideDown();
					$( document ).one( "click", function() {
						$('#tier1categories').slideUp();
						});
					return false;
					});


//resize is executed continuously and the browser dimensions change. This function allows the code to be executed once, on finish (or pause)
	$(window).resize(function() {
		if(this.resizeTO) {clearTimeout(this.resizeTO);}
		this.resizeTO = setTimeout(function() {
			$(this).trigger('resizeEnd');
			}, 500);
		});
//when window is resized, generate a new logo. The code is triggered right after being bound to generate the correct size logo to start.
	$(window).bind('resizeEnd', function(P) {
		//resize the logo to maximum available space.
		if(typeof handleSrcSetUpdate == 'function')	{
			handleSrcSetUpdate($("#mainContentArea :visible:first"))
			}
		}).trigger('resizeEnd');



							/*
			
				_app.rq.push(['templateFunction','productTemplate','onDeparts',function(P) {
					var $container = $('#recentlyViewedItemsContainer');
					$container.show();
					$("ul",$container).empty(); //empty product list
					$container.anycontent({data:_app.ext.myRIA.vars.session}); //build product list
					}]);
					
				_app.rq.push(['templateFunction','categoryTemplate','onCompletes', function(P){
					var breadcrumb = P.navcat.split(".");
					var topNavcat = "."+breadcrumb[1];
					$('#sideBarLeft [data-navcat="'+topNavcat+'"] .subCatList').show();
					}]);
					
				_app.rq.push(['templateFunction','categoryTemplate','onDeparts', function(P){
					var breadcrumb = P.navcat.split(".");
					var topNavcat = "."+breadcrumb[1];
					$('#sideBarLeft [data-navcat="'+topNavcat+'"] .subCatList').hide();
					}]);	
		
					
				_app.rq.push(['templateFunction', 'productTemplate','onCompletes',function(P) {
					var $context = $(_app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').hide();
					$('#contentArea').removeClass('sideBarRightShow');
					$('#contentArea').addClass('sideBarRightHide');
					
					$('.responsiveDropdown').hide();
					
					$('.randomList', $context).each(function(){
						_app.ext.store_zephyr_app.u.randomizeList($(this));
						});
				}]);
				
				
				_app.rq.push(['templateFunction', 'checkoutTemplate','onCompletes',function(P) {
					var $context = $(_app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').hide();
					$('#contentArea').removeClass('sideBarRightShow');
					$('#contentArea').addClass('sideBarRightHide');
					
					$('.responsiveDropdown').hide();
				}]);
				
				_app.rq.push(['templateFunction', 'cartTemplate', 'onCompletes',function(P){
					var $context = $(_app.u.jqSelector('#',P.parentID));
					
					$('.responsiveDropdown').hide();
				}]);
				
				_app.rq.push(['templateFunction', 'homepageTemplate','onCompletes',function(P) {
					var $context = $(_app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').show();
					$('#contentArea').removeClass('sideBarRightHide');
					$('#contentArea').addClass('sideBarRightShow');
					
					$('.responsiveDropdown').show();
					
					$('.randomList', $context).each(function(){
						_app.ext.store_zephyr_app.u.randomizeList($(this));
						});
				}]);	
				
				_app.rq.push(['templateFunction', 'categoryTemplate','onCompletes',function(P) {
					var $context = $(_app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').show();
					$('#contentArea').removeClass('sideBarRightHide');
					$('#contentArea').addClass('sideBarRightShow');
					
					$('.responsiveDropdown').show();
				}]);
				
				_app.rq.push(['templateFunction', 'searchTemplate','onCompletes',function(P) {
					var $context = $(_app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').show();
					$('#contentArea').removeClass('sideBarRightHide');
					$('#contentArea').addClass('sideBarRightShow');
					
					$('.responsiveDropdown').show();
				}]);
				
				_app.rq.push(['templateFunction', 'customerTemplate','onCompletes',function(P) {
					var $context = $(_app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').show();
					$('#contentArea').removeClass('sideBarRightHide');
					$('#contentArea').addClass('sideBarRightShow');
					
					$('.responsiveDropdown').hide();
					
					if(P.show == "login" || P.show =="createaccount" || P.show == "recoverpassword"){
						$('.sideline', $context).hide();
						$('.mainColumn',$context).width("100%");
					} else{
						$('.sideline', $context).show();
					}
	
				}]);	
				
				_app.rq.push(['templateFunction', 'companyTemplate','onCompletes',function(P) {
					var $context = $(_app.u.jqSelector('#',P.parentID));
					
					$('#sideBarRight').show();
					$('#contentArea').removeClass('sideBarRightHide');
					$('#contentArea').addClass('sideBarRightShow');
				}]);
				
				$('.ddMenuBtn').on('click',function(event){
					_app.ext.store_zephyrapp.a.showDropDown($(this).parent());
					event.stopPropagation();
					});	
					
				_app.rq.push(['templateFunction', 'productTemplate','onCompletes',function(P) {
					var $context = $(_app.u.jqSelector('#',P.parentID));
					
					$('.childDropdown',$context).children().each(function(){
						var pid=$(this).val();
						if(pid){
							var $opt=$(this);
							
							var tagObj = {
								"callback":function(rd){
									if(_app.ext.store_product.u.productIsPurchaseable(pid)){
										// do nothing muy bueno
										}
									else{
										$opt.attr('disabled','disabled');
										}
									}
								}
							
							_app.ext.store_product.calls.appProductGet.init(pid,tagObj,"immutable");
							_app.model.dispatchThis("immutable");
							}
						});
					
					$('.childDropdown',$context).on('change',function(event){
						var pid = $(this).val();
						$('.inventoryContainer',$context).empty().anycontent({"datapointer":"appProductGet|"+pid})
						});
					}]);
				
				
				_app.rq.push(['templateFunction','customerTemplate','onCompletes',function(infoObj){
					if(infoObj.show == 'login' && infoObj.callback){
						$('#loginArticle form.loginForm').data('callback', infoObj.callback);
						}
					}]);
				_app.rq.push(['templateFunction','customerTemplate','onDeparts',function(infoObj){
					$('#loginArticle form.loginForm').removeData('callback', infoObj.callback);
					}]);
					*/
				r = true;
				
				return r;
				
				},
			
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				_app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			},
			startExtension: {
				onSuccess : function()	{
					var temp = JSON.parse(_app.storageFunctions.readLocal('recentlyViewedItems'));
					var oldTime = JSON.parse(_app.storageFunctions.readLocal('timeStamp'));
					var d = new Date().getTime();
					if(d - oldTime > 90*24*60*60*1000) {
						var expired = true;
					}
					else {
						var expired = false;
					}
					if(temp && !expired){
						_app.ext.myRIA.vars.session.recentlyViewedItems = temp;
						_app.u.dump(_app.ext.myRIA.vars.session.recentlyViewedItems);
						var $container = $('#recentlyViewedItemsContainer');
						$container.show();
						$("ul",$container).empty(); //empty product list
						$container.anycontent({data:_app.ext.myRIA.vars.session}); //build product list
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
				//_app.u.dump('showing');
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
					$(".ddMenuBtn",$container).animate({"height":"44px"}, 100);
					
					$('html, .ddMenuBtn').on('click.dropdown',function(){
						//hide the dropdown
						_app.u.dump('hiding');
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
				},
			showSearchBar: function ($container){
				if (!$('.searchSection').hasClass('searchShow')){
					$('.searchSection').addClass('searchShow').show();
					}
				else{
					$('.searchSection').removeClass('searchShow').hide();
					}
				}
			
			}, //Actions

////////////////////////////////////   TLCFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		tlcFormats : {
			//this tlcformat gets run AFTER the image has been appended/replaced. It needs the data-attributes set.
			srcset : function(data,thisTLC)	{
				if(data.value)	{
//					dump(" -> data: "); dump(data);
					var argObj = thisTLC.args2obj(data.command.args,data.globals); //this creates an object of the args
					var srcset = new Array();
					if(argObj.views)	{
						var $tag = $(data.globals.tags[data.globals.focusTag]), viewArr = argObj.views.split(','), L = viewArr.length;
						for(var i = 0; i < L; i += 1)	{
							var obj = _app.u.kvp2Array(viewArr[i]), string = '';
							string = thisTLC.makeImageURL({'width':obj.w,'height':obj.h,'data-media':$tag.data('media'),'data-bgcolor':$tag.data('bgcolor')});
							if(obj.vp)	{string += " "+obj.vp;}
							if(obj.dpi)	{string += " "+obj.dpi;}
							srcset.push(string);
							}
						$tag.removeAttr('width'); $tag.removeAttr('height'); //polyfill requires no height/width tag be specified.
						$tag.attr("srcset",srcset.join(','));
						}
					}

				return true; //continue processing tlc
				},
			
			
			shiptimestable : function(data,thisTLC)	{

				var 
					$table = $("<table \/>").addClass('shippingEstimates'),
					montharray=new Array("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"),
					shipMethods = new Array(
						{"method":"Free/Standard Shipping","shiptime":"1-8 Business Days*","ddoi":8}, //ddoi is deliveryDateObjectIndex
						{"method":"Fedex Home Delivery","shiptime":"1-5 Business Days*","ddoi":5},
						{"method":"Fedex Express Saver","shiptime":"1-3 Business Days*","ddoi":3},
						{"method":"Fedex 2-Day","shiptime":"1-2 Business Days*","ddoi":2},
						{"method":"Fedex Overnight ","shiptime":"1 Business Day*","verbage":"Next Day"},
						{"method":"USPS Priority**","shiptime":"1-4 Business Day*","ddoi":7}
						);
				$table.append("<thead><tr><th>Shipping Method<\/th><th>Approximate Shipping Time<\/th><th>Est. Delivery Date<\/th><\/tr><\/thead>");
				$table.append("<tfoot><tr><td colspan='3' class='hint'>*Estimates do not take into account national holidays and other days which Fedex or USPS may not be working or may have restricted delivery services.<br>**USPS Delivery Service is based on the timescale of the Postal Service. Estimated Delivery Dates may change without notice depending on the US Postal Service.<\/td><\/tr><\/tfoot>");
				
				// This script came over from his existing website. The eval was commented out by JT.
				//	var num = 1;
				//	var temparray = document.location.href.split("?");
				//	eval(temparray[1]);
					
					function getDeliveryDateObj(businessDaysLeftForDelivery) {
						var now = new Date();
						var dayOfTheWeek = now.getDay();
						var calendarDays = businessDaysLeftForDelivery;
						var deliveryDay = dayOfTheWeek + businessDaysLeftForDelivery;
						if (deliveryDay >= 6) {
							//deduct this-week days
							businessDaysLeftForDelivery -= 6 - dayOfTheWeek;
							//count this coming weekend
							calendarDays += 2;
							//how many whole weeks?
							deliveryWeeks = Math.floor(businessDaysLeftForDelivery / 5);
							//two days per weekend per week
							calendarDays += deliveryWeeks * 2;
						}
						now.setTime(now.getTime() + calendarDays * 24 * 60 * 60 * 1000);
						return now;
					}
					
					function showDate(num) {
						var d=getDeliveryDateObj(num);
						return (montharray[d.getMonth()] + " " + d.getDate());
						};
					var today = showDate(1);
					for(var i = 0; i < shipMethods.length; i += 1)	{
						$table.append("<tr><td>"+shipMethods[i].method+"<\/td><td>"+shipMethods[i].shiptime+"<\/td><td>"+today+" - "+(shipMethods[i].verbage ? shipMethods[i].verbage : showDate(shipMethods[i].ddoi))+"<\/td><\/tr>");
						}
					data.globals.tags[data.globals.focusTag].append($table);
				return false;  //this is a pretty specific format. kill any further processing.
				}
			
			},


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
					var inv = _app.ext.store_product.u.getProductInventory(data.value.pid);
					if(inv > 0){
						$tag.append('In Stock Now (Qty avail: '+inv+')');
						}
					else{
					//	Taking out for time being since we already have an out of stock msg
					//	$tag.append('This product is currently out of stock');
						}
					}
				},
				
			inventoryAvailQtyCart : function($tag,data){
				if(data.value['%attribs']['zoovy:grp_type'] == 'PARENT'){
					// do nothing
					}
				else {
					var inv = _app.ext.store_product.u.getProductInventory(data.value.product);
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
			//ele will likely be an entire template object. This will add the show/hide button for revealing more content IF the child element (actual text container) has a height greater than $ele.
			revealation : function($ele)	{
				$('.textBlockMaxHeight',$ele).each(function(index){
					var $container = $(this), $text = $("[data-textblock-role='content']",$container);
					if($text.height() > $container.height())	{
						$("<p>").addClass('textFadeOut').append($("<button \/>").addClass('smallButton').text('Show More').attr('data-app-click','store_zephyrapp|revealation').button()).appendTo($container);
						}
					});
				},
			randomizeList : function($list){
				$list.children().shuffle();
				},
			cacheRecentlyViewedItems: function ($container){
				_app.u.dump ('Caching product to recently viewed');
				var d = new Date().getTime();
				_app.storageFunctions.writeLocal('recentlyViewedItems', _app.ext.myRIA.vars.session.recentlyViewedItems);
				_app.storageFunctions.writeLocal('timeStamp',d);// Add timestamp
				},
			addItemToCart : function($form,obj){
				var $childSelect = $('.prodChildren.active select', $form);
				if($childSelect.length > 0){
					if($childSelect.val()){
						_app.calls.cartItemAppend.init({"sku":$childSelect.val(), "qty":$('input[name=qty]',$form).val()},{},'immutable');
						_app.model.destroy('cartDetail');
						_app.calls.cartDetail.init({'callback':function(rd){
							if(obj.action === "modal"){
								showContent('cart',obj);
								}
							}},'immutable');
						_app.model.dispatchThis('immutable');
						}
					else {
						$form.anymessage(_app.u.errMsgObject("You must select an option"));
						}
					}
				else {
					_app.ext.myRIA.u.addItemToCart($form, obj);
					}
				},
			loginFormSubmit : function($form){
				var formJSON = $form.serializeJSON();
				_app.u.dump(formJSON);
				var errors = '';
				var callback = $form.data('callback') || function(){showContent('customer',{'show':'myaccount'});};
				if(_app.u.isValidEmail(formJSON.login) == false){
					errors += "Please provide a valid email address<br \/>";
					}
				if(!formJSON.password)	{
					errors += "Please provide your password<br \/>";
					}
					
				if(errors == ''){
					_app.calls.appBuyerLogin.init({"login":formJSON.login,"password":formJSON.password},{'callback':function(tagObj){
						_app.vars.cid = _app.data[tagObj.datapointer].cid;
						_app.ext.myRIA.u.handleLoginActions();
						callback();
					}});
					_app.calls.refreshCart.init({},'immutable'); //cart needs to be updated as part of authentication process.
//					_app.calls.buyerProductLists.init('forgetme',{'callback':'handleForgetmeList','extension':'store_prodlist'},'immutable');
					
					_app.model.dispatchThis('immutable');
					}
				else {
					$form.anymessage({'message':errors});
					}
				}
			}, //u [utilities]

//app-events are added to an element through data-app-event="extensionName|functionName"
//right now, these are not fully supported, but they will be going forward. 
//they're used heavily in the admin.html file.
//while no naming convention is stricly forced, 
//when adding an event, be sure to do off('click.appEventName') and then on('click.appEventName') to ensure the same event is not double-added if app events were to get run again over the same template.
		e : {
			
			
			revealation : function($ele,p)	{
				p.preventDefault();
				var $container = $ele.closest(".textBlockMaxHeight");
				if($container.length)	{
					
					if($container.attr('data-maxheight'))	{} //only set this once.
					else	{$container.attr('data-maxheight',$container.css('max-height'));} //used to restore
					
					//text block is already 'open'. so close it.
					if($ele.data('state') == 'open')	{
						$container.attr('style',''); //restore to default state.
						$ele.text('Show More').data('state','closed');
						}
					else	{
						var height = $("[data-textblock-role='content']").outerHeight(true) + 60; // both height and max-height need to be set to get the button below the text.
						$container.css({'max-height':height,'height':height,'overflow':'visible'});
						$ele.text('Show Less').data('state','open');
						
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"For zephyr.e.revealation, no .textBlockMaxHeight found as parent of trigger element.","gMessage":true});
					}
				return false;
				},
			
			youtubeSwapExec : function($ele,p)	{
				p.preventDefault();
				if($ele.data('videoid'))	{
					var $target = $ele.closest("[data-app-role='videoTabContent']").find("[data-app-role='videoContainer']");
					$target.empty();
					_app.renderFormats.youtubevideo($target,{'value':$ele.data('videoid'),'bindData':{}});
					$ele.closest("[data-app-role='videoTabContent']").find('.ui-button').button('enable');
					$ele.button('disable');
					}
				else	{
					$("#globalMessaging").anymessage({"message":"In store_zephyrapp.e.youtubeSwapExec, no videoid set on trigger element.","gMessage":true});
					}
				return false;
				}
			
			} //e [app Events]
		} //r object.
	return r;
	}