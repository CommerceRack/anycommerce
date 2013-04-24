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

var admin_launchpad = function() {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				app.rq.push(['css',0,app.vars.baseURL+'extensions/admin/launchpad.css','admin_launchpad']);
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

////////////////////////////////////   ACTIONS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {

			showLaunchpad : function()	{

				app.u.dump("BEGIN admin_launchpad.u.initLaunchpad");
				var $LPI = $('#launchpadInner'),
				$LP = $('#launchpad');

				$( ".launchpad_tiles" ).sortable({
					connectWith: '.launchpad_tiles',
					helper : 'clone', //keeps click events in dragged item from firing on drag.
					stop: function( event, ui ) {
						app.ext.admin_launchpad.u.handleTileGroupResize(); //adjust ul's and launchpad inner div for new # of tiles
						$('.tileButton').hide();
						}
					});

				$('li','.launchpad_tiles').each(function(){
					var $li = $(this);
					$li.append($("<button>").text('remove').addClass('tileButton').css({'position':'absolute','top':0,'right':0}).button({icons: {primary: "ui-icon-close"},text: false}).on('click',function(){
						$li.empty().remove()
						app.ext.admin_launchpad.u.handleTileGroupResize(); //adjust ul's and launchpad inner div for new # of tiles
						}).hide());
					$li.on('mouseover',function(){
						$('.tileButton',$li).show();
						});
					$li.on('mouseleave',function(){
						$('.tileButton',$li).hide();
						});
					})
				app.ext.admin_launchpad.u.buildDomainTiles4Launchpad();
				app.model.dispatchThis('immutable');
				app.ext.admin_launchpad.u.addMouseWheel2Launchpad();
				app.ext.admin_launchpad.u.handleTileGroupResize();


				}

			}, //ACTIONS


////////////////////////////////////   TILES    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		t : {

			domain : function(domainArr)	{
//show logo or, if not set, some default icon.
//change color for active domain.
//show buttons for 'view website', 'edit domain', 'use this domain'
				var $div = $("<div \/>").addClass('tileDomainSelect');
				$div.on('click.domainSelect',function(){
					app.ext.admin.a.changeDomain($(this).data('id'),$(this).data('prt'));
					$('.tileDomainSelect.greenBG','#launchpadTiles').removeClass('greenBG');
					$(this).addClass('greenBG');
					})
				$div.data(domainArr);
//if the domain object ever returns 'broken', use something like this: "+(app.vars.domain == domainArr.id ? 'icon-link-2' : 'icon-link')+"
				$div.append("<span class='iconFont focon-link icon'><\/span><span class='tilename'>"+domainArr.id+"<\/span><span class='active'><\/span>");
				return {'$content' : $div, 'size':'1x1','bgclass': (app.vars.domain == domainArr.id) ? 'green' : 'greenLight','target':'domains'};

				}

			}, //TILES

////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//utilities are typically functions that are exected by an event or action.
//any functions that are recycled should be here.
		u : {
	

/*
obj should contain the following:
$content
 -> a jquery object of the content. technically, it could be plain html, not a jquery object, as it's going to be appended.
 -> if the content is going to link, should contain the onclick event.

optional
 -> target. one of the ul's ??? how do we decide what to put where?
 -> size: 1x1, 2x1 or 2x2
 -> bgclass: a supported color to use for the bg. alternatively, you can set your own.
*/
			addTileToLaunchpad : function(obj)	{
				var $li = $("<li \/>"),
				size = 'tile_'+ obj.size || '1x1';
				
				obj.bgclass = obj.bgclass || 'blueDark'
				obj.target = obj.target || 'misc'
				
				$li.addClass(size);
				$li.addClass(obj.bgclass);

				obj['$content'].addClass('tile')
				$li.append(obj['$content']);
				$li.appendTo($('#tilegroup_'+obj.target),$('#launchpadTiles'));
				},	

			handleTileGroupResize : function(){

				app.u.dump("BEGIN admin_launchpad.u.handleTileGroupResize");
				var $LP = $('#launchpad'),
				$LPI = $('#launchpadInner'),
				tileWidth = $('.tile_1x1',$LPI).first().outerWidth(true),
				tileHeight = $('.tile_1x1',$LPI).first().outerHeight(true);
				
//				console.log(" -> $('body').outerHeight(): "+$('body').outerHeight());
//				console.log(" -> window.outerHeight: "+$(window).outerHeight(true));
//				console.log(" -> $('#mastHead').outerHeight(true): "+$('#mastHead').outerHeight(true));
//				console.log(" ->$('#mastFoot').outerHeight(true): "+$('#mastFoot').outerHeight(true));
//				console.log(" -> new launchpad height: "+($(window).outerHeight(true) - $('#mastHead').outerHeight(true) - $('#mastFoot').outerHeight(true) - 20));
			//handle some sizing.
				$LP.height(($(window).outerHeight(true) - $('#mastHead').outerHeight(true) - $('#mastFoot').outerHeight(true) - 60));  //set height of launchpad to maximize workspace. the xtra 20 is to solve a height issue that cause a window vertical scroll to appear. ### investigate when time permits.
				$LPI.height($LP.height()); //launchpad height does NOT use outerheight so no padding/margin conflicts
				$LPI.width('10000px'); //set high so ul's dont wrap. then readjust so no extra scrolling later.
			
				var rowsPerGroup = Math.floor(($LPI.height() / tileHeight));
				$LPI.height(tileHeight * rowsPerGroup); //ensures no vertical scrolling
			
			//	console.log("($LPI.height() ["+$LPI.height()+"] / tileHeight ["+tileHeight+"]): "+($LPI.height() / tileHeight));
			//	console.log("rowsPerGroup: "+rowsPerGroup);
			//	console.log("LP.height: "+$LP.height());
			//	console.log("LPI height: "+tileHeight * rowsPerGroup);
			
			
			//resize ul to accomodate # and sizes of tiles.
				$('ul.launchpad_tiles',$LPI).each(function(){
					var $ul = $(this),
			//varying tile sizes mean there could be orpans on rows. so a double-width is counted as 2.5
			//not uber-accurate, but should solve most cases.
					count = $('li',$ul).length + ($('.tile_2x1',$ul).length);
			
			//3 is the min. # of columns.
					if(count > (3 * rowsPerGroup))	{
						var width = Math.ceil(( count / rowsPerGroup )) * $('.tile_1x1',$LPI).first().outerWidth(true);
						$ul.width(width);
						}
					else	{} //do nothing. six is the default size
			
					});
				
				$lastCol = $('.launchpad_tiles:last','#launchpadInner'); 
				$LPI.width(($lastCol.position().left + $lastCol.outerWidth(true) + 30)); //for determining total width of all ul's + buffer.
			//	$('body').append(" -> width: "+($lastCol.position().left + $lastCol.outerWidth(true) + 30)+"<br>");



				},

			addMouseWheel2Launchpad : function(){

				var $LPI = $('#launchpadInner'),
				$LP = $('#launchpad')
				
			//bind mousewheel event to launchpad.
				$LP.bind('mousewheel', function(event, delta, deltaX, deltaY) {
			//		console.log("delta:"+delta+" deltaX: "+deltaX+" deltaY: "+deltaY);
			//		console.log("width: "+($LPI.width() - $LP.width())); //-1672
			//		console.log($LPI.position().left);
			
			
					$LP.css('overflow','hidden'); //once mousescroll is used to slide content, ditch the scroll bar. wheel and scroll don't play well together in chrome.
					if(delta > 0)	{ //mouse wheel is going up. move the CONTENT element from right to left.
			//			console.log(" -> going up: "+deltaY);
						if($LPI.position().left > 0) { //already left-most. don't move it.
							$LPI.css('left',0); //position correctly in case it's a negative #.
							}
						else	{
							$LPI.css({'left':"+=20"}); //move inner div.
							}
						}
					else	{
			//			console.log(" -> going down: "+deltaY);
			//mouse wheel is going down. move the content from left to right.
						if((($LPI.width() - $LP.width()) * -1) > $LPI.position().left) {
							//already right-most. no more scrolling.
							}
						else	{
							$LPI.css({'left':"-=20"}); //move inner div.
							}
						}
					});	
				},



			buildDomainTiles4Launchpad : function()	{
				
				var r = app.ext.admin.calls.adminDomainList.init({'callback':function(rd){
					if(app.model.responseHasErrors(rd)){
						$('#globalMessaging').anymessage({'message':rd});
						}
					else	{
						var domains = app.data.adminDomainList['@DOMAINS'],
						L = domains.length;

						for(var i = 0; i < L; i += 1)	{
							app.ext.admin_launchpad.u.addTileToLaunchpad(app.ext.admin_launchpad.t.domain(app.data.adminDomainList['@DOMAINS'][i]));
							}
						}
					}},'immutable');
				return r; // will be 1 or 0 based on whether or not a dispatch is necessary for domain list.

				}
	
			
			} //u [utilities]

		} //r object.
	return r;
	}