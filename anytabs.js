/*
a simple tab script that does NOT use id's.
Format content like so:

<div id='bob'>
<ul>
	<li><a href='#doh'>One</a></li>
	<li><a href='#adeer'>Two</a></li>
	<li><a href='#afemale'>Three Times</a></li>
	<li><a href='#deer'>A Mady</a></li>
</ul>
<div data-anytab-content='doh'>Content 1</div>
<div data-anytab-content='adeer'>Content 2</div>
<div data-anytab-content='afemale'>Content 3</div>
<div data-anytab-content='deer'>Content 4</div>
</div>

and execute with $('#bob').anytabs();
open a tab like this: $('#bob').anytabs('reveal','deer');
or this: $('#bob').find('.ui-tabs-nav li:nth-child(2)').trigger('click');
*/
(function($) {
	$.widget("ui.anytabs",{
		options : {},

		_init : function(){
			var self = this,
			o = self.options, //shortcut
			$t = self.element; //this is the targeted element (ex: $('#bob').anymessage() then $t is bob)
			
			if($t.attr('widget') == 'anytabs')	{} //id has already been set as tabs.
			else	{
				console.log('got into init else');
				$t.attr('widget','anytabs')
				$t.addClass('ui-tabs ui-widget ui-widget-anytabs')
				self.tabs = $("ul",$t).first();
	
	//style and move tabs into container.
				self._handleContent();
				self._addClasses2Content();
				
	//style and add click events to tabs.
				self._addClasses2Tabs();
				self._addEvent2Tabs();
	//make a tab visible/active.
				self._handleDefaultTab();
				}
			}, //_init

		_setOption : function(option,value)	{
			$.Widget.prototype._setOption.apply( this, arguments ); //method already exists in widget factory, so call original.
			},

		_activateFirstTab : function()	{
			this.tabs.children().first().addClass('ui-state-active ui-tabs-active');
			this.tabContent.children().first().css('display','block');
			},

		_handleDefaultTab : function()	{
			var anchor = document.location.hash;
//if no anchor is set, activate the default.
			if(anchor)	{
				var foundMatch = false;
				$('a',this.element).each(function(){
					if($(this).attr('href') == anchor)	{$(this).trigger('click'); foundMatch = true; return false;} //the return false breaks out of the loop.
					});
//if href value matches the anchor, trigger the default tab.
				if(foundMatch)	{}
				else	{this._activateFirstTab();}
				}
			else	{
				this._activateFirstTab();
				}
			},

		_addEvent2Tabs : function()	{
			var self = this;
			this.tabs.find('li').each(function(){
				$(this).off('click.anytab').on('click.anytab',function(){
					self.reveal($(this));
					});
				});
			},

		_addClasses2Tabs : function()	{
			this.tabs.addClass('ui-tabs-nav ui-helper-reset ui-helper-clearfix').css({'padding-left':'0px'});
			this.tabs.find('a').addClass('ui-tabs-anchor').attr('role','presentation');
			this.tabs.find('li').addClass('ui-state-default ui-corner-top');
			},
//create a container div and add each content panel to it.
		_handleContent : function()	{
			var $t = this.element,
			self = this;
			
			self.tabContent = $("<div \/>").addClass('ui-widget ui-widget-content ui-corner-bottom ui-corner-tr');
			$t.append(self.tabContent);
			$("[data-anytab-content]",$t).each(function(){
				self.tabContent.append($(this));
				});
			},

		_addClasses2Content : function()	{
			$("[data-anytab-content]",this.element).addClass("ui-tabs-panel ui-widget-content ui-corner-bottom").css('display','none');
			
			},

		

		reveal : function($tab)	{
			if(typeof $tab == 'string')	{
				if($tab.charAt(0) == '#')	{}
				else	{$tab = '#'+$tab}
				$('a',this.element).each(function(){
					if($(this).attr('href') == $tab)	{
						$(this).trigger('click'); //will re-execute this function with $tab as object.
						return false; //breaks out of each loop.
						}
					});
				
				}
			else if(typeof $tab == 'object')	{
				var dac = $tab.find('a').attr('href').substring(1); //data-anytab-content
				document.location.hash = dac; //set hash. triggering click doesn't do this.
				this.tabs.find('.ui-state-active').removeClass('ui-state-active ui-tabs-active');
				$tab.addClass('ui-state-active ui-tabs-active');

				this.tabContent.find('.ui-tabs-panel').hide();
				$("[data-anytab-content='"+dac+"']",this.tabContent).show();
				}
			else	{} //unknownn type for $tab far
			},

//clear the message entirely. run after a close. removes element from DOM.
		destroy : function(){
			this.element.empty().remove();
			}
		}); // create the widget
})(jQuery); 