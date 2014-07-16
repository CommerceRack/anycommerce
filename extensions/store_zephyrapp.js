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
					/*
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
					*/
					
					var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).


//bind a click action for the dropdown on the shop link.
				$('#shopNowLink').on('click',function(){
					$(".shopButtonAttentionArrowCont").hide();
					$('.shopButtonAttentionArrowCont').data('clickOff',true).append();
					
					if($('#tier1catContainer').data('sliderState')){}
					else{
						$('#tier1catContainer').data('sliderState',false).append();
					}
					
					if($('#tier1catContainer').data('sliderState') === false){
						$('#tier1catContainer').slideDown();
						$('#tier1catContainer').data('sliderState',true).append();
					}
					else if($('#tier1catContainer').data('sliderState') === true){
						$('#tier1catContainer').slideUp();
						$('#tier1catContainer').data('sliderState',false).append();
					}
										
					/*$( document ).one( "click", function() {
						$('#tier1catContainer').slideUp();
						});
					*/
					return false;
				});


			//resize is executed continuously as the browser dimensions change. This function allows the code to be executed once, on finish (or pause)
				$(window).resize(function() {
					if(this.resizeTO) {clearTimeout(this.resizeTO);}
					this.resizeTO = setTimeout(function() {
						$(this).trigger('resizeEnd');
						}, 500);
					});
			
				$(window).bind('resizeEnd', function(P) {
					//resize all the images in the visible content area based on srcset and new browser dimensions.
					if(typeof handleSrcSetUpdate == 'function')	{
			//			dump(" -----------> firing off resize event. length: "+$("#mainContentArea :visible:first").length+" and ID: "+$("#mainContentArea :visible:first").attr('id'));
						handleSrcSetUpdate($("#mainContentArea :visible:first"))
						}
					
					//css will handle the category list show/hide to some degree.
					//however, if the browser was smaller than 1040 and the cats were toggled, an inline 'hide' would be present and cats wouldn't show up. over 1040, cats are always visible.
					if($(window).width() >= 1040)	{
						$('#tier1catContainer').show(); 
						}
					else	{
						$('#tier1catContainer').hide(); //may not need this. here in case width > 1040 and then scaled down. Cats would go into 'open' position. felt unnatural.
						}
					
					//if a dialog is open, reposition it to the center of the screen.
					$('.ui-dialog-content:visible').each(function(){
						$(this).dialog("option", "position", "center");
						})
					
					}).trigger('resizeEnd');
					
					_app.templates.homepageTemplate.on('complete.zephyr',function(event,$context,infoObj){
						$('.shopButtonAttentionArrowCont').data('clickOff',false).append();
						var loopDuration = 4000;
						if($(window).width() < 1040)	{
							for(i = 0; i < 10; i++){
								loopDuration = loopDuration + 4000;
								setTimeout((function (){
									if($(window).width() < 1040)	{
										if($('.shopButtonAttentionArrowCont').data('clickOff') === false){
											$(".shopButtonAttentionArrowCont").effect("shake");
										}
										else{
											$(".shopButtonAttentionArrowCont").hide();
										}
									}
									else{
										$(".shopButtonAttentionArrowCont").hide();
									}
									}), loopDuration);
							}
						}
					});
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

////////////////////////////////////   TLCFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		tlcFormats : {

			//this tlcformat gets run AFTER the image has been appended/replaced. It needs the data-attributes set.
			srcset : function(data,thisTLC)	{
//				dump(" -> srcset data: "); dump(data,'dir');
				if(data.value)	{
					var argObj = thisTLC.args2obj(data.command.args,data.globals); //this creates an object of the args
					var srcset = new Array();
//					dump(" -> argObj"); dump(argObj,'dir');
					if(argObj.views)	{
//						dump(" -> argObj.views IS set");
						var viewArr = argObj.views.split(','), L = viewArr.length;
						for(var i = 0; i < L; i += 1)	{
							var obj = _app.u.kvp2Array(viewArr[i]), string = '';
							string = thisTLC.makeImageURL({'width':obj.w,'height':obj.h,'data-media':data.value,'data-bgcolor':'ffffff'});
							if(obj.vp)	{string += " "+obj.vp;}
							if(obj.dpi)	{string += " "+obj.dpi;}
							srcset.push(string);
							}
						data.globals.binds[data.globals.focusBind] = srcset.join(',');
						}
					}
				return true; //continue processing tlc
				},

			converthtmllinks : function(data,thisTLC)	{
				var $content = $(data.globals.binds[data.globals.focusBind]);
				$('a',$content).each(function(){
					var href = $(this).attr('href');
					if(!href)	{} //no href? odd, but do nothing.
					else if(href.charAt(0) == '#')	{} //link is formatted correctly or an anchor. do nothing.
					else	{
						$(this).attr('href',_app.ext.quickstart.u.getHashFromPageInfo(_app.ext.quickstart.u.detectRelevantInfoToPage(href)));
						}
					});
				data.globals.binds[data.globals.focusBind] = $content.html();
				return true;
				},

			//if the value is blank, null, empty, undefined , return false (stops tlc processing on this statement)
			dwiwempty : function(data,thisTLC)	{
				var r = true;
				//needs to be first or the blanket data.value will b hit and return true.
				if(data.value === null)	{r = false}
				else if(data.value == 'ALT=&IMG=&LINK=')	{r = false;} //this is what a blank banner attribute will be set to
				else if(data.value === 0)	{}
				else if(data.value)	{}
				else	{
					r = false;
					}
				dump(" -> r: "+r);
				return r;
				},

			//if the value is blank, null, empty, undefined , return false (stops tlc processing on this statement)
			dwiwemptybanner : function(data,thisTLC)	{
				var r = true;
				//needs to be first or the blanket data.value will b hit and return true.
				if(data.value == 'ALT=&IMG=&LINK=')	{r = false;} //this is what a blank banner attribute will be set to
				else if(!data.value)	{r = false;}
				//banner element type w/ content populated.
				else if(data.value.indexOf('IMG=') >=0 && data.value.indexOf('LINK=') >= 0)	{
					var obj = _app.u.kvp2Array(data.value);
					if(obj && !obj.IMG)	{r = false;}
					}
				else	{
					r = false;
					}
				return r;
				},
			
//Generate a list of thumbnails, adding srcset along the way.
//the image size for 768 and 1024 should be the same, specifically for magic zoom. That way the click to put an alternate image into the primary spot uses a consistent size.
			proddetailthumbs : function(data,thisTLC)	{
				if(data.value && data.value['zoovy:prod_image2'])	{
					var
						$div = $("<div \/>"),
						dim = 250,
						bodyWidth = $(document.body).width(); //dimensions of the primary product image. Used to generate the 'rev' for MZP.
					
					if(bodyWidth >= 640)	{dim = 350}
					else if(bodyWidth >= 1100)	{dim = 500}
					else	{} //use default.
					for(var i = 1; i <= 20; i += 1)	{
						if(data.value['zoovy:prod_image'+i])	{
							$("<a \/>",{'data-app-click':'store_zephyrapp|prodThumb2Primary','href':thisTLC.makeImageURL({'data-media':data.value['zoovy:prod_image'+i],'data-bgcolor':'FFFFFF'})}).addClass('noioscontextmenu').append($("<img \/>",{
								'src':thisTLC.makeImageURL({'width':50,'height':50,'data-media':data.value['zoovy:prod_image'+i],'data-bgcolor':'FFFFFF'}),
								'data-media' : data.value['zoovy:prod_image'+i],
								//the first srcset value should match the default height and width, then grow from there.
								'srcset' : thisTLC.makeImageURL({'width':50,'height':50,'data-media':data.value['zoovy:prod_image'+i],'data-bgcolor':'FFFFFF'})+" 760w 1x, "+thisTLC.makeImageURL({'width':100,'height':100,'data-media':data.value['zoovy:prod_image'+i],'data-bgcolor':'FFFFFF'})+" 1100w 1x"
								}).addClass('productThumb')).appendTo($div);

// NOTE -> iphone wasn't reacting well to the 2x.
// , "+thisTLC.makeImageURL({'width':200,'height':200,'data-media':data.value['zoovy:prod_image'+i],'data-bgcolor':'FFFFFF'})+" 1024w 2x
							}
						else	{break;} //exit early once a 'blank' is found in the img list.
						}
					data.globals.binds[data.globals.focusBind] = $div.children();
					}
				return true;
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
						var hour = now.getHours();
						//after 12, add 1 business day.
// this didn't work as expected. didn't take weekends into consideration.
//						var calendarDays = (hour < 13) ? businessDaysLeftForDelivery : businessDaysLeftForDelivery+1; // * 201403 -> added a +1 day for after 12:00
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
				dump("BEGIN revealation");
				$('.textBlockMaxHeight',$ele).each(function(index){
					var $container = $(this), $text = $("[data-textblock-role='content']",$container);
					$container.attr("data-textblock-role",'container').css('position','relative');  //when the class is toggled off, position will be too. but relative positioning necessary for the button to be visible.
					function handleHeight(i)	{
						i++;
						if($text.outerHeight() > $container.height())	{
							$("<p>").addClass('textFadeOut').append($("<button \/>").addClass('smallButton').text('Show More').attr('data-app-click','store_zephyrapp|revealation').button()).appendTo($container);
							}
						else if($text.outerHeight() == 0 && $container.height() == 0)	{ //because of how the animation is handled, height may not be able to be computed right away.
							if(1 < 10)	{
								setTimeout(function(){handleHeight(i);},250);
								}
							else	{} //ok, tried enough times. maybe these are just empty.
							}
						else	{} //text block is shorter than container. that's okay too.
						}
					handleHeight(0);
					});
				},
			//this is a function because it's called as part of the productTemplate onComplete as well as in prodThumb2Primary
			applyZoom : function($primaryImage)	{
//				dump(" -> $primaryImage.length: "+$primaryImage.length);
				//the zoom plugin needs to be executed on the parent element of the image because it needs to add children.
				$primaryImage.parent().zoom({
					'url' : $primaryImage.parent().attr('href'),
					'touch' : true,
					onZoomIn : function(){
						//for small screens, slide content so the primary image is at the top of the viewport, ensuring the 'zoom' is visible.
						if($(document.body).width() < 500)	{
							var $picsContainer = $(this).closest(".vidsAndPics");
							if($picsContainer.length)	{
								var tabHeight = $('ul:first',$picsContainer).outerHeight() || 0;
								$('html, body').animate({scrollTop : ($picsContainer.position().top + tabHeight + $('#mastHead').outerHeight() + 10)},500);
								dump(" --------------> from top: "+($picsContainer.position().top + tabHeight + $('#mastHead').outerHeight()));
								}
							}
						$(this).closest(".vidsAndPics").find('.zoomToolZoomContainer').show();
						},
					onZoomOut : function(){
						$(this).closest(".vidsAndPics").find('.zoomToolZoomContainer').hide();
						},
					'target' : $primaryImage.closest(".vidsAndPics").find('.zoomToolZoomContainer')
					});				
				},
			
			//MZP is, unfortunately, very ID centric. This function is executed in a product template oncomplete.
			//it will add an id to the primary image, which is used for the mzp.start() and the 'rel' on the thumbnails.
			//the rel will be generated for the thumbnails as well, so that the correct is used.
			//for this reason, the 768 and 1024 image sizes should be the same for the primary product pic (so switching from portrait to landscape works ok)
/*			handleMZP : function($product,infoObj)	{
//				dump("BEGIN handleMZP");
				if($product instanceof jQuery)	{
					var $href = $("[data-app-role='primaryImageHref']:first",$product), ID;
					if($href.length)	{
						//mzp gives the href an id. Can't rely on that tho, so just in case, if none is set we generate and append our own.
						if($href.attr('id'))	{
							ID = $href.attr('id');
							}
						else	{
							ID = 'mzpzoom_'+_app.u.guidGenerator();
							$href.attr('id',ID);
							}
						//the rel gets set there because we have the ID.  the rev is generated at the thumbs tlcFormat so that resolution specific sizing is all in the same place.
						$("[data-app-role='productThumbnailsContainer']:first",$product).find('a').each(function(){
							$(this).attr({'id':'jt_'+_app.u.guidGenerator(),'rel':'zoom-id:'+ID+";group:"+infoObj.pid+";"});
							MagicZoomPlus.refresh($(this).attr('id')); //without this, the thumbnail won't register itself as part of the MZP (after the first page load. odd).
							});

						if($(document.body).outerWidth() > 760)	{
							$href.attr('rel',"zoom-position: right; group:"+infoObj.pid+";");
							}
						else	{
							$href.attr('rel',"zoom-position: bottom; group:"+infoObj.pid+";");
							}
// SANITY -> tried to specify a specific ID for the refresh and it did not work to well in FF.
//it would, more often than not, fail to init which resulted in an image click opening the image in the window/tab in focus.
						MagicZoomPlus.refresh();
						}
					else	{
						dump("Unable to find the href for the primary image within the product layout. MagicZoomPlus will not work properly.","warn")
						}
					}
				else	{
					dump("$product not a valid jquery instance for handleMZP. MZP will likely not work quite right.",'warn');
					}
				},
			*/
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
			
			prodThumb2Primary : function($ele,p)	{
				p.preventDefault();
				var $primaryImageHref = $ele.closest("[data-anytab-content='images']").find("[data-app-role='primaryImageHref']:first");
				if($primaryImageHref.length)	{
					//re-translate the href, which will update the srcset attribute et all, passing in the clicked media elements filename (media) as image1
					$primaryImageHref.parent().tlc({
						"verb":"translate",
						"dataset":{'%attribs':{'zoovy:prod_image1':$('img',$ele).data('media')}}
						});
					$primaryImageHref.trigger('zoom.destroy'); // remove zoom
					myApp.ext.store_zephyrapp.u.applyZoom($('img',$primaryImageHref));
					handleSrcSetUpdate($primaryImageHref.parent()); //trigger srcset to load the correct size image.
					}
				else	{
					dump("In zephyr_storeapp.e.prodThumb2Primary, unable to local primary image href. zoom will not work.","warn");
					}
				return false;
				},
			
			jump2 : function($ele,p)	{
				p.preventDefault();
				var $jump2 = $ele.closest(".isPageTemplate").find("[data-landing-point='"+$ele.data('jump2')+"']");
				$('html, body').animate({
			        scrollTop: $jump2.offset().top
    				}, 2000);
				return false;
				},
			
			//used on a select element where the option value is the pid. selecting the option goes to the pid page.
			changePageByOptionValue : function($ele,p)	{
				p.preventDefault();
				document.location.hash = $ele.val();
				return false;
				},

			productAdd2Cart : function($ele,p)	{
				p.preventDefault();
				//the buildCartItemAppendObj needs a _cartid param in the form.
				if($("input[name='_cartid']",$ele).length)	{}
				else	{
					$ele.append("<input type='hidden' name='_cartid' value='"+_app.model.fetchCartID()+"' \/>");
					}

				var cartObj = _app.ext.store_product.u.buildCartItemAppendObj($ele);
				if(cartObj)	{
					_app.ext.cco.calls.cartItemAppend.init(cartObj,{},'immutable');
					
					_app.model.destroy('cartDetail|'+cartObj._cartid);
					_app.calls.cartDetail.init(cartObj._cartid,{'callback':function(rd){
						if(_app.model.responseHasErrors(rd)){
							$('#globalMessaging').anymessage({'message':rd});
							}
						else	{
							if($ele.data('show') == 'inline')	{
								document.location.hash = '#!cart';
								}
							else	{
								_app.ext.quickstart.u.showCartInModal({'templateID':'cartTemplate'});
								}
							cartMessagePush(cartObj._cartid,'cart.itemAppend',_app.u.getWhitelistedObject(cartObj,['sku','pid','qty','quantity','%variations']));
							}
						}},'immutable');
					_app.model.dispatchThis('immutable');
					
					}
				else	{} //do nothing, the validation handles displaying the errors.
				return false;
				},

			revealation : function($ele,p)	{
				p.preventDefault();
				var $container = $ele.closest("[data-textblock-role='container']");
				if($container.length)	{
					
					if($container.attr('data-maxheight'))	{} //only set this once.
					else	{$container.attr('data-maxheight',$container.css('max-height'));} //used to restore
					
					//text block is already 'open'. so close it.
					if($ele.data('state') == 'open')	{
						$container.addClass('textBlockMaxHeight').css('padding-bottom','0');; //restore to default state.
						$ele.data('state','closed').find('.ui-button-text').text('Show More');
						}
					else	{
						$container.removeClass('textBlockMaxHeight').css('padding-bottom','2em'); //padding is to compensate for fadeout/button.
						$ele.data('state','open').find('.ui-button-text').text('Show Less');
						}
					}
				else	{
					$('#globalMessaging').anymessage({"message":"For zephyr.e.revealation, no .textBlockMaxHeight found as parent of trigger element.","gMessage":true});
					}
				return false;
				},
			
			authWithNoRedir : function($ele,p)	{
				p.preventDefault();
				_app.ext.quickstart.u.showLoginModal();
				$('#loginSuccessContainer').empty(); //empty any existing login messaging (errors/warnings/etc)
//this code is here instead of in showLoginModal (currently) because the 'showCustomer' code is bound to the 'close' on the modal.
				$('<button>').attr('id','modalLoginContinueButton').text('Continue').button().click(function(){
					$('#loginFormForModal').dialog('close');
					}).appendTo($('#loginSuccessContainer'));
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