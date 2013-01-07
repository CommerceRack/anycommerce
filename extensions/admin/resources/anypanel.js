//http://net.tutsplus.com/tutorials/javascript-ajax/coding-your-first-jquery-ui-plugin/
(function($) {
	$.widget("ui.anypanel",{
		options : {
			state : 'open', //open, close and preferences are acceptable values. sets panel contents to open or closed. Any value other than 'close' triggers open.
			templateID : null, //what any commerce template to use to populate the panel.
			data : {}, //what data to use to translate the panel.
			dataAttribs : {}, //optional set of params to set as data on content. currently, only used if content is generated from templateID.
			call : null, //
			header : null, //if set, will create an h2 around this and NOT use firstchild.
			q : 'mutable', //which q to use.
			extension : '',
			name : '',
			persist : false, //if set to true and name AND extension set, will save to localStorage using devicePreferences
			settingsMenu : {}
			},
		_init : function(){
			var self = this,
			o = self.options, //shortcut
			$t = self.element;
			if($t.data('isanypanel'))	{} //already a panel, do nothing.
			else	{
				$t.addClass('ui-widget').data('isanypanel',true).css('position','relative');
				var $header, $content,
				buttonStyles = {'float':'right','width':'20px','height':'20px','padding':0,'margin':'2px'};
				
				if(o.title)	{$header = $("<h2 \/>").text(o.title).appendTo($t)}
				else	{$header = $t.children(":first")}
				
				$header.css({'fontSize':'.85em','lineHeight':'2em','textIndent':'.75em'});
				$header.wrap($("<div \/>").addClass('ui-widget-header ui-accordion-header ui-corner-top ').css({'padding':'0px;','minHeight':'24px'}));
				
				$header.append($("<button \/>").hide().attr('data-btn-action','settingsMenu').css(buttonStyles).text('Settings')
					.button({text: false,icons : {primary : 'ui-icon-power'}})
					.off('click.settingsMenu').on('click.settingsMenu',function(){
						var $ul = $("[data-ui-role='settingsMenu']",$t).toggle();

//this will make it so any click outsite the menu closes the menu. the one() means it only gets triggered once.
//it's inside the click handler, so it'll get added each time the settings are opened.
						if($ul.is(":visible"))	{setTimeout(function(){$(document).one("click", function() {$ul.hide();});},1000);}
						
						})); //the settings button is always generated, but only toggled on when necessary.
				if(o.settingsMenu)	{this.buildSettingsMenu()}
				
				$header.append($("<button \/>").attr({'data-btn-action':'toggle','title':'Open/close panel'}).css(buttonStyles).button({icons : {primary : 'ui-icon-triangle-1-n'},'text':false}).on('click.panelViewState',function(){self.toggle()})); //settings button
			
				//templateid and data are both specified, so add and translate.
				if(o.templateID && o.data)	{
					$content = app.renderFunctions.transmogrify(o.dataAttribs,o.templateID,o.data);
					$content.appendTo($t);
					app.ext.admin.u.handleAppEvents($t)
					}
				//templateid and call are specified, so create instance. dispatch occurs OUTSIDE this plugin.
				else if(o.templateID && o.call)	{}
				//a templateID was specified, just add the instance. This likely means some process outside this plugin itself is handling translation.
				else if(o.templateID)	{}
				else	{$t.children(":nth-child(2)")}
				
				if($content.length)	{}
				else	{$content = $("<div \/>"); $content.appendTo($t);}
				$content.addClass('ui-widget-content ui-corner-bottom stdPadding').css('borderTop','0'); //content area.
//				if(this.data && this.templateID)	{transmogrify}
//				else if(this.call && this.tempateID)	{}		
//				else if(this.tempateID)	{$content.append(app.renderFunctions.createTemplateInstance('',templateID))} !!! finish and test.
//				else	{} //do nothing. no content specified. this is perfectly valid, data may already have been on dom.
				}
			}, //_init

		_setOption : function(option,value)	{
			$.Widget.prototype._setOption.apply( this, arguments ); //method already exists in widget factory, so call original.
			switch (option)	{
				case 'state':
					(value === 'close') ? this.close() : this.open(); //the open/close function will change the options.state val as well.
					break;

				case 'settingsMenu':
					$.extend(this.options.menu,value); //add the new menu to the existing menu object. will overwrite if one already exists.
					this.destroySettingsMenu();
					this.buildSettingsMenu();
					break;
				
				default:
					console.log("Unrecognized option passed into anypanel via setOption");
					console.log(" -> option: "+option);
					break;
				}
			},

		handleInitialState : function()	{
			if(this.options.state == 'preferences')	{
				var preferences = app.ext.admin.u.devicePreferencesGet(this.extension);
				this.options.state = preferences.anypanel[this.options.name].state || 'open'; //if not defined, default to open.
				}
			
			if(this.options.state == 'close')	{ this.close();}
			else if (this.options.state == 'open')	{this.open();}
			else	{
				console.log("unknown state passed into anypanel");
				}
			},

		toggle : function(){
			if(this.options.state == 'open')	{this.close()}
			else	{this.open()}
			},

//the corner bottom class is added/removed to the header as the panel is closed/opened, respectively, for aeshtetic reasons.
		close : function(){
			$("[data-btn-action='toggle']",this.element).button({icons : {primary : 'ui-icon-triangle-1-s'},'text':false});
			$('.ui-widget-content',this.element).slideUp();
			$('.ui-widget-header',this.element).addClass('ui-corner-bottom');
			this.options.state = 'close';
			this.handlePreferencesStateUpdate('close');
			},

		open : function(){
			$("[data-btn-action='toggle']",this.element).button({icons : {primary : 'ui-icon-triangle-1-n'},'text':false});
			$('.ui-widget-content',this.element).show();
			$('.ui-widget-header',this.element).removeClass('ui-corner-bottom');
			this.options.state = 'open';
			this.handlePreferencesStateUpdate('open');
			},

		handlePreferencesStateUpdate : function(value)	{
			var r = false; //will return true if a preferences update occurs.
			if(this.persist && value)	{
				if(this.extension && this.name)	{
					var updatedPreferences = {"anypanel":{}};
					updatedPreferences.anypanel[this.options.name] = {'state':value};
					var preferences = $.extend(true,app.ext.admin.u.devicePreferencesGet(this.options.extension),updatedPreferences); //make sure panel object exits. general panel is always open.
					app.ext.admin.u.devicePreferencesSet(this.options.extension,preferences); //update the localStorage session var.
					r = true;
					}
				else	{
					console.warn("anypanel has persist enabled, but either name ["+this.name+"] or extension ["+this.extension+"] not declared. This is a non-critical error, but it means panel will not be persistant.");
					}
				}
			return r;
			},

		destroySettingsMenu : function()	{
			$("[data-ui-role='settingsMenu']",this.element).empty().remove();
			},
		
		buildSettingsMenu : function()	{
			var $ul = $("<ul \/>"),
			sm = this.options.settingsMenu;
			
			$ul.attr('data-ui-role','settingsMenu').hide().css({'position':'absolute','right':0,'zIndex':10000});
			for(index in sm)	{
				$("<li \/>").text(index).on('click',sm[index]).appendTo($ul);
				}
			if($ul.children().length)	{
				$ul.menu();
				$("[data-btn-action='settingsMenu']",this.element).show().closest('.ui-widget-header').after($ul);
				}
			else	{} //no listitems. do nothing.
			},
		destroy : function(){
			this.destroySettingsMenu();
			this.element.empty().remove();
			}
		}); // create the widget
})(jQuery); 