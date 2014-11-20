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

var admin_launchpad = function(_app) {
	var theseTemplates = new Array('launchpadTemplate');
	var r = {



	vars : {
		},

////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; //return false if extension won't load for some reason (account config, dependencies, etc).
				_app.rq.push(['css',0,_app.vars.baseURL+'extensions/admin/launchpad.css','admin_launchpad']);
				_app.model.fetchNLoadTemplates(_app.vars.baseURL+'extensions/admin/launchpad.html',theseTemplates);
				r = true;
//used for browser resize. binding a resize event triggers it throughout the resize, not just at the end.
//so this is used to make sure the event is only triggered once.
_app.ext.admin_launchpad.u.delay = (function(){
  var timer = 0;
  return function(callback, ms){
    clearTimeout (timer);
    timer = setTimeout(callback, ms);
  };
})();

$(window).resize(function() {
    _app.ext.admin_launchpad.u.delay(function(){
	  if($('#launchpadContent').is(':visible'))	{
      	console.log('Browser resize. Adjust tilegroups and trigger shapeshifter rearrange');
		_app.ext.admin_launchpad.u.handleTileGroupResize();
	  	}
      //...
    }, 500);
});

				return r;
				},
			onError : function()	{
//errors will get reported for this callback as part of the extensions loading.  This is here for extra error handling purposes.
//you may or may not need it.
				_app.u.dump('BEGIN admin_orders.callbacks.init.onError');
				}
			}
		}, //callbacks

////////////////////////////////////   ACTIONS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {

			showLaunchpad : function()	{
				_app.u.dump("BEGIN admin_launchpad.a.showLaunchpad");

$('#launchpadContent').empty().anycontent({'templateID':'launchpadTemplate','dataAttribs':{'id':'launchpad'},'showLoading':false})

/*
This is all for drag n drop and adding 'close' buttons.
				var $LPI = $('#launchpadInner'),
				$LP = $('#launchpad'); //.css('background','#660000');

				$( ".launchpad_tiles" ).sortable({
					connectWith: '.launchpad_tiles',
					helper : 'clone', //keeps click events in dragged item from firing on drag.
					stop: function( event, ui ) {
						_app.ext.admin_launchpad.u.handleTileGroupResize(); //adjust ul's and launchpad inner div for new # of tiles
						$('.tileButton').hide();
						}
					});

				$('li','.launchpad_tiles').each(function(){
					var $li = $(this);
					$li.append($("<button>").text('remove').addClass('tileButton').css({'position':'absolute','top':0,'right':0}).button({icons: {primary: "ui-icon-close"},text: false}).on('click',function(){
						$li.empty().remove()
						_app.ext.admin_launchpad.u.handleTileGroupResize(); //adjust ul's and launchpad inner div for new # of tiles
						}).hide());
					$li.on('mouseover',function(){
						$('.tileButton',$li).show();
						});
					$li.on('mouseleave',function(){
						$('.tileButton',$li).hide();
						});
					});
*/
_app.ext.admin.calls.appResource.init('recentnews.json',{'callback':'translateSelector','extension':'admin','selector':'#tileRecentNews'},'mutable');
_app.ext.admin.calls.appResource.init('quickstats/OGMS.json',{'callback':'transmogrify','parentID':'tileReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //total sales
_app.ext.admin.calls.appResource.init('quickstats/OWEB.json',{'callback':'transmogrify','parentID':'tileReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //web sales
_app.ext.admin.calls.appResource.init('quickstats/OGRT.json',{'callback':'transmogrify','parentID':'tileReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //return customer
_app.ext.admin.calls.appResource.init('quickstats/OEXP.json',{'callback':'transmogrify','parentID':'tileReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //expedited
_app.ext.admin.calls.appResource.init('quickstats/SAMZ.json',{'callback':'transmogrify','parentID':'tileReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //amazon
_app.ext.admin.calls.appResource.init('quickstats/SBYS.json',{'callback':'transmogrify','parentID':'tileReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //buy.com
_app.ext.admin.calls.appResource.init('quickstats/SEBA.json',{'callback':'transmogrify','parentID':'tileReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //ebay auction
_app.ext.admin.calls.appResource.init('quickstats/SEBF.json',{'callback':'transmogrify','parentID':'tileReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //ebay fixed price
_app.ext.admin.calls.appResource.init('quickstats/SSRS.json',{'callback':'transmogrify','parentID':'tileReportTbody','templateID':'quickstatReportTemplate'},'mutable'); //sears

				_app.ext.admin_launchpad.u.buildDomainTiles4Launchpad();
				_app.model.dispatchThis('immutable');
				_app.ext.admin_launchpad.u.addMouseWheel2Launchpad();
				//!!! once we have the tile builder all done, get this out of a timeout.
				setTimeout(function(){_app.ext.admin_launchpad.u.handleTileGroupResize();},500);


				}

			}, //ACTIONS


////////////////////////////////////   TILES    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		t : {

			domain : function(domainArr)	{
//show logo or, if not set, some default icon.
//change color for active domain.
//show buttons for 'view website', 'edit domain', 'use this domain'
				var $ele = $("<li \/>").addClass('tileDomainSelect tile_1x1');
				$ele.addClass((_app.vars.domain == domainArr.id) ? 'blue8' : 'blue2')
				$ele.on('click.domainSelect',function(){
					_app.ext.admin.a.changeDomain($(this).data('id'),$(this).data('prt'));
					navigateTo('#:setup');
					$(this).closest('ul').children().each(function(){$(this).removeClass('blue8').addClass('blue2');});
					$(this).addClass('blue8').removeClass('blue2');
					})
				$ele.data(domainArr);
//if the domain object ever returns 'broken', use something like this: "+(_app.vars.domain == domainArr.id ? 'icon-link-2' : 'icon-link')+"
				$ele.append("<span class='iconFont focon-link icon'><\/span><span class='tilename'>"+domainArr.id+"<\/span>");
//				return {'$content' : $ele, 'size':'1x1','bgclass': (_app.vars.domain == domainArr.id) ? 'blue5' : 'blue3','target':'domains'};
				return $ele;
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

				_app.u.dump("BEGIN admin_launchpad.u.handleTileGroupResize");
				var $LP = $('#launchpad');
				var $LPI = $('.launchpadInner', $LP),
				tileWidth = $('.tile_1x1',$LPI).first().outerWidth(true),
				tileHeight = $('.tile_1x1',$LPI).first().outerHeight(true);
//handle some sizing.
				$LP.height(($(window).outerHeight(true) - $('#mastHead').outerHeight(true) - $('#mastFoot').outerHeight(true) - 60));  //set height of launchpad to maximize workspace. the xtra is to solve a height issue that cause a window vertical scroll to appear. ### investigate when time permits.
				$LPI.height($LP.height()); //launchpad height does NOT use outerheight so no padding/margin conflicts
				$LPI.width('10000px'); //set high so ul's dont wrap. then readjust so no extra scrolling later.
			
				var rowsPerGroup = Math.floor(($LPI.height() / tileHeight));
				$LPI.height(tileHeight * rowsPerGroup); //ensures no vertical scrolling
			
				_app.u.dump(" -> rowsPerGroup: "+rowsPerGroup);
			
			//resize ul to accomodate # and sizes of tiles.
				$('ul.launchpad_tiles',$LPI).each(function(){
					var $ul = $(this),
			//varying tile sizes mean there could be orpans on rows. so a double-width is counted as 2.3
			//not uber-accurate, but should solve most cases.
					count = $('li',$ul).length + ($('.tile_2x1',$ul).length * 1.5) + ($('.tile_2x2',$ul).length * 2); 
			
					if(count === 0)	{
						$ul.hide();
						}
					else	{
						var width = Math.ceil(( count / rowsPerGroup )) * tileWidth;
						if(width < (tileWidth * 2))	{width = (tileWidth * 2 )} /* two column minimum */
						$ul.width(width);
						}
			
					});
				
				$lastCol = $('.launchpad_tiles:last',$LPI); 
				$LPI.width(($lastCol.position().left + $lastCol.outerWidth(true) + 30)); //for determining total width of all ul's + buffer.
				},

			addMouseWheel2Launchpad : function(){

				var $LP = $('#launchpad');
				var $LPI = $('#launchpadInner', $LP);
				
			//bind mousewheel event to launchpad.
				$LP.bind('mousewheel', function(event, delta, deltaX, deltaY) {
			
					$LP.css('overflow','hidden'); //once mousescroll is used to slide content, ditch the scroll bar. wheel and scroll don't play well together in chrome.
					if(delta > 0)	{ //mouse wheel is going up. move the CONTENT element from right to left.
			//			console.log(" -> going up: "+deltaY);
						if($LPI.position().left > 0) { //already left-most. don't move it.
							$LPI.css('left',0); //position correctly in case it's a negative #.
							}
						else	{
							$LPI.css({'left':"+=50"}); //move inner div.
							}
						}
					else	{
			//			console.log(" -> going down: "+deltaY);
			//mouse wheel is going down. move the content from left to right.
						if((($LPI.width() - $LP.width()) * -1) > $LPI.position().left) {
							//already right-most. no more scrolling.
							}
						else	{
							$LPI.css({'left':"-=50"}); //move inner div.
							}
						}
					});	
				},

			buildDomainTiles4Launchpad : function()	{
				
				var r = _app.ext.admin.calls.adminDomainList.init({'callback':function(rd){
					if(_app.model.responseHasErrors(rd)){
						$('#globalMessaging').anymessage({'message':rd});
						}
					else	{
						var domains = _app.data.adminDomainList['@DOMAINS'],
						L = domains.length;

						for(var i = 0; i < L; i += 1)	{
//							_app.ext.admin_launchpad.u.addTileToLaunchpad(_app.ext.admin_launchpad.t.domain(_app.data.adminDomainList['@DOMAINS'][i]));
							$('#tilegroup2').append(_app.ext.admin_launchpad.t.domain(_app.data.adminDomainList['@DOMAINS'][i]))
							}
						}
					}},'immutable');
				return r; // will be 1 or 0 based on whether or not a dispatch is necessary for domain list.

				}
	
			
			} //u [utilities]

		} //r object.
	return r;
	}