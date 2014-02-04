/*
 * jQuery showLoading plugin v1.0
 * 
 * Copyright (c) 2009 Jim Keller
 * Context - http://www.contextllc.com
 * 
 * Dual licensed under the MIT and GPL licenses.
 *
 */
// ### -> update this plugin using the new widget format.
// when this is done, replace 'hideloading' with showLoading('destroy') OR have it execute that function after performing a check to make sure showloading is enabled.
// add support for updating a message within a currently running 'showLoading'.
	jQuery.fn.showLoading = function(options) {
		var $this = jQuery(this);
		if($this.hasClass('ui-showloading'))	{$this.hideLoading()} //if showloading is already running, hide the current and start afresh. this'll update the messaging as desired.
		
		var indicatorID;
		var settings = {
			'addClass': '',
			'beforeShow': '', 
			'afterShow': '',
			'hPos': 'center', 
			'vPos': 'center',
			'indicatorZIndex' : 5001,
			'overlayZIndex': 5000,
			'parent': '',
			'marginTop': 0,
			'marginLeft': 0,
			'message' : null,
			'overlayWidth': null,
			'overlayHeight': null
			};


		jQuery.extend(settings, options);
       	
		if($this.length)	{
			var $loadingDiv = jQuery('<div></div>');
			var $overlayDiv = jQuery('<div></div>');
	
			//
			// Set up ID and classes
			//
			if (settings.indicatorID) {
				indicatorID = settings.indicatorID;
				}
			else {
				indicatorID = $this.attr('id');
				}
			$this.addClass('ui-showloading');
			
			$loadingDiv.attr('id', 'loading-indicator-' + indicatorID );
			$loadingDiv.addClass('loading-indicator');
			
			if (settings.addClass){
				$loadingDiv.addClass(settings.addClass);
				}
			if(settings.message)	{
				$loadingDiv.addClass('ui-widget ui-widget-content ui-corner-all stdPadding alignCenter').html($("<div \/>").addClass('ui-loading-message').text(settings.message));
				}
	
			$loadingDiv.prepend("<div class='loadingBG'></div>"); //add gfx before txt.
			
			//
			// Create the overlay
			//
			$overlayDiv.css({
				'display':'none'
				}).addClass('ui-widget-overlay');
			
			// Append to parent. add a position-relative for continued absolute position support.
			$this.append($overlayDiv);
			
			//
			// Set overlay classes
			//
			$overlayDiv.attr('id', 'loading-indicator-' + indicatorID + '-overlay');
			
			$overlayDiv.addClass('loading-indicator-overlay');
			
			if ( settings.addClass ){
				$overlayDiv.addClass(settings.addClass + '-overlay');
			}
			
			//
			// Set overlay position
			//
			
			var overlay_width;
			var overlay_height;
			
			var border_top_width = $this.css('border-top-width');
			var border_left_width = $this.css('border-left-width');
			
			//
			// IE will return values like 'medium' as the default border, 
			// but we need a number
			//
			border_top_width = isNaN(parseInt(border_top_width)) ? 0 : border_top_width;
			border_left_width = isNaN(parseInt(border_left_width)) ? 0 : border_left_width;
			var overlay_left_pos = $this.offset().left + parseInt(border_left_width);
			var overlay_top_pos = $this.offset().top + parseInt(border_top_width);
			
			if ( settings.overlayWidth !== null ) {
				overlay_width = settings.overlayWidth;
			}
			else {
				overlay_width = parseInt($this.width()) + parseInt($this.css('padding-right')) + parseInt($this.css('padding-left'));
			}
	
			if ( settings.overlayHeight !== null ) {
				overlay_height = settings.overlayWidth;
			}
			else {
				overlay_height = parseInt($this.height()) + parseInt($this.css('padding-top')) + parseInt($this.css('padding-bottom'));
			}
	
	//static is default and doesn't do much. relative with no left/right, etc does about the same thing.
	//this allows for the absolute positioned overlay div to NOT have a fixed height/width and use left:0, right:0, etc and stay within the parent element.
	//This 'should' still work fine with non static elements.
			if($this.css('position') == 'static')	{$this.css('position','relative')}
			
			$overlayDiv.css({'position':'absolute','left':0,'right':0,'top':0,'bottom':0}); /* fill entire parent */
			$overlayDiv.css('z-index', settings.overlayZIndex);
	
			//
			// Set any custom overlay CSS		
			//
				if ( settings.overlayCSS ) {
					$overlayDiv.css ( settings.overlayCSS );
				}
	
	
			//
			// We have to append the element to the body first
			// or .width() won't work in Webkit-based browsers (e.g. Chrome, Safari)
			//
			$loadingDiv.css('display', 'none');
			$this.append($loadingDiv);
			
			$loadingDiv.css('position', 'absolute');
			$loadingDiv.css('z-index', settings.indicatorZIndex);
	
			//
			// Set top margin
			//
	
		
			var indicatorLeft = overlay_left_pos;
			
			if ( settings.marginLeft ) {
				indicatorLeft += parseInt(settings.marginLeft);
				}
			// set horizontal position

			if ( settings.hPos.toString().toLowerCase() == 'center' ) {
//				$loadingDiv.css('left', (indicatorLeft + (($overlayDiv.outerWidth() - parseInt($loadingDiv.outerWidth())) / 2)).toString()  + 'px');
				$loadingDiv.css('left', (parseInt(($overlayDiv.outerWidth() - $loadingDiv.outerWidth()) / 2)).toString()  + 'px');
				}
			else if ( settings.hPos.toString().toLowerCase() == 'left' ) {
				$loadingDiv.css('left',0);
				}
			else if ( settings.hPos.toString().toLowerCase() == 'right' ) {
				$loadingDiv.css('right',0);
				}
			else {
				$loadingDiv.css('left', 0);
				}		
	
			//
			// set vertical position
			//
			if ( settings.vPos.toString().toLowerCase() == 'center' ) {
				$loadingDiv.css('top', ((($overlayDiv.outerHeight() - parseInt($loadingDiv.outerHeight())) / 2)).toString()  + 'px');
				}
			else if ( settings.vPos.toString().toLowerCase() == 'top' ) {
				$loadingDiv.css('top', 0);
				}
			else if ( settings.vPos.toString().toLowerCase() == 'bottom' ) {
				$loadingDiv.css('bottom', 0);
				}
			else {
				$loadingDiv.css('top',0);
				}		
	
	
			 
			
			//
			// Set any custom css for loading indicator
			//
				if ( settings.css ) {
					$loadingDiv.css ( settings.css );
				}
	
			
			//
			// Set up callback options
			//
			var callback_options = 
				{
					'overlay': $overlayDiv,
					'indicator': $loadingDiv,
					'element': this
				};
		
			//
			// beforeShow callback
			//
			if ( typeof(settings.beforeShow) == 'function' ) {
				settings.beforeShow( callback_options );
			}
			
			//
			// Show the overlay
			//
			$overlayDiv.show();
			
			//
			// Show the loading indicator
			//
			$loadingDiv.show();
	
			//
			// afterShow callback
			//
			if ( typeof(settings.afterShow) == 'function' ) {
				settings.afterShow( callback_options );
			}
		}
		else	{} //$this was not defined.
		return this;
    	 };


	jQuery.fn.hideLoading = function(options) {
		var indicatorID;
		var settings = {};
		jQuery.extend(settings, options);

		 function jqSelector(selector,str){
			if (undefined == str) { str = new String(""); }	// fix undefined issue
			return ((selector) ? selector : '')+str.replace(/([;&,\.\+\*\~':"\!\^#$%@\[\]\(\)=>\|])/g, '\\$1');
			}

		if ( settings.indicatorID ) {
			indicatorID = settings.indicatorID;
			}
		else {
			indicatorID = $(this).attr('id');
			}
//toggle an indicator class on/off 
//indicator class on target element removed. used to detect cases of showloading and remove them globally.
		$(this).removeClass('ui-showloading');
		$(jqSelector('#','loading-indicator-'+indicatorID),$(this)).remove();
		$(jqSelector('#','loading-indicator-'+indicatorID+'-overlay'),$(this)).remove();
		return this;
     	};
