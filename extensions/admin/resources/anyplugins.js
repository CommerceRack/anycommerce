/*

This file is a variety of plugins that are either open-source or were written by Zoovy/anycommerce.
They're in one file just to minimize the number of includes.

*/


/**
 * jQuery.fn.sortElements
 * --------------
 * @author James Padolsey (http://james.padolsey.com)
 * @version 0.11
 * @updated 18-MAR-2010
 * --------------
 * @param Function comparator:
 *   Exactly the same behaviour as [1,2,3].sort(comparator)
 *   
 * @param Function getSortable
 *   A function that should return the element that is
 *   to be sorted. The comparator will run on the
 *   current collection, but you may want the actual
 *   resulting sort to occur on a parent or another
 *   associated element.
 *   
 *   E.g. $('td').sortElements(comparator, function(){
 *      return this.parentNode; 
 *   })
 *   
 *   The <td>'s parent (<tr>) will be sorted instead
 *   of the <td> itself.
 */
jQuery.fn.sortElements = (function(){
    
    var sort = [].sort;
    
    return function(comparator, getSortable) {
        
        getSortable = getSortable || function(){return this;};
        
        var placements = this.map(function(){
            
            var sortElement = getSortable.call(this),
                parentNode = sortElement.parentNode,
                
                // Since the element itself will change position, we have
                // to have some way of storing it's original position in
                // the DOM. The easiest way is to have a 'flag' node:
                nextSibling = parentNode.insertBefore(
                    document.createTextNode(''),
                    sortElement.nextSibling
                );
            
            return function() {
                
                if (parentNode === this) {
                    throw new Error(
                        "You can't sort elements if any one is a descendant of another."
                    );
                }
                
                // Insert before flag:
                parentNode.insertBefore(this, nextSibling);
                // Remove flag:
                parentNode.removeChild(nextSibling);
                
            };
            
        });
       
        return sort.call(this, comparator).each(function(i){
            placements[i].call(getSortable.call(this));
        });
        
    };
    
})();







/*
run $('#someTable').anytable() to have the headers become clickable for sorting by that column.
*/



// bulk of this code came from here:
// http://stackoverflow.com/questions/3160277/jquery-table-sort
(function($) {
	$.widget("ui.anytable",{
		options : {
			},
		_init : function(){
			this._styleHeader();
			var $table = this.element;
			$('th',$table).each(function(){

var th = $(this),
thIndex = th.index(),
inverse = false;

th.click(function(){
	$table.find('td').filter(function(){
		return $(this).index() === thIndex;
		}).sortElements(function(a, b){
			return $.text([a]).toLowerCase() > $.text([b]).toLowerCase() ? inverse ? -1 : 1 : inverse ? 1 : -1; //toLowerCase make the sort case-insensitive.
			},function(){
		// parentNode is the element we want to move
		return this.parentNode; 
		});
	inverse = !inverse;
});
				}); //ends 'each'
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
					console.log("Unrecognized option passed into anytable via setOption");
					console.log(" -> option: "+option);
					break;
				}
			}, //_setOption

		_styleHeader : function()	{
			var $table = this.element;
			$('th',$table)
//				.attr("title",'click here to sort this column')
				.css({'borderLeft':'none','borderTop':'none','borderBottom':'none'})
				.addClass('ui-state-default').css('cursor','pointer')
				.click(function(){
					$('th',$table).removeClass('ui-state-active');
					$(this).addClass('ui-state-active')
					})
				.mouseover(function(){$(this).addClass('ui-state-hover')})
				.mouseout(function(){$(this).removeClass('ui-state-hover')}); // 
			},

		destroy : function(){
			this.destroySettingsMenu();
			this.element.empty().remove();
			}
		}); // create the widget
})(jQuery); 




//http://net.tutsplus.com/tutorials/javascript-ajax/coding-your-first-jquery-ui-plugin/
/*

/////  ANYPANEL  \\\\\

Will turn a selected element in to a collapseable panel with a header and content area. the content area is what collapses.
There are two methods for defining the header and content areas.
if a title is specified, It will appear within an h2 in the header section of the panel.
if no title is specified, the first child of the selected element will be used.

For the content, if a template is specified, it'll be used to generate the content.
If not, either the first or second child will be used based on whether or not title is or is not specified.

If a template is specified, then either data or call can also be specified. 
 -> if data is passed, it'll be used to translate the template immediately.
 -> if a call is specified, the content will be translated from the response.
 -> it is acceptable to pass a template and no data or call so that an action outside this extension can handle data translation.

The header of a panel will also contain a toggle button.
if persist is set to true, plus extension and name are set, the state is remembered in local storage
 -> extension should be the extension which generated the panel.
 -> name is a unique identifier for the panel within the extension namespace.

Additional a settings button can be added which will contain a dropdown of selectable options.

*/
(function($) {
	$.widget("ui.anypanel",{
		options : {
			state : 'expand', //expand, collapse and preferences are acceptable values. sets panel contents to opened or closed.
			templateID : null, //what any commerce template to use to populate the panel.
			data : {}, //what data to use to translate the panel.
			dataAttribs : {}, //optional set of params to set as data on content. currently, only used if content is generated from templateID.
			call : null,
			callParams : null,
			_tag : {},
			dispatch : null, // a dispatch that'll be added directly to the Q. _tag will be added to it.
			showClose : true, //set to false to disable close (X) button.
			showLoading : true, //set to false to disable showLoading()
			content : null, //a jquery object of content to use.
			header : null, //if set, will create an h2 around this and NOT use firstchild.
			q : 'mutable', //which q to use.
			extension : '', //used in conjunction w/ persist.
			name : '', //used in conjunction w/ persist.
			persist : false, //if set to true and name AND extension set, will save to localStorage using devicePreferences
			settingsMenu : {}
			},
		_init : function(){
			var self = this,
			o = self.options, //shortcut
			$t = self.element;
			if($t.data('isanypanel'))	{} //already a panel, skip all the styling and data.
			else	{
//isanypanel data is set to true as an easy check to
				$t.addClass('ui-widget ui-widget-anypanel marginBottom').data('isanypanel',true).css('position','relative');
				var $header, $content;
				
				
				if(o.title)	{$header = $("<h2 \/>").text(o.title).appendTo($t)}
				else	{$header = $t.children(":first")}
				
				$header.css({'fontSize':'.85em','lineHeight':'2em','textIndent':'.75em'}).addClass('pointer');
				$header.wrap($("<div \/>").addClass('ui-widget-header ui-anypanel-header ui-corner-top ').css({'padding':'0px;','minHeight':'24px'}));
				$header.off('click.toggle').on('click.toggle',function(){self.toggle()});
				
				self._handleButtons($header);
			
				$content = self._anyContent();

				if($content.length)	{$content.appendTo($t);} //content generated via template of some kind.
				else if(o.title)	{$content = $t.children(":first");} //no content yet, title specified. use first child.
				else	{$content = $t.children(":nth-child(2)");} //no content. first child is title. second child is content.
				
				$content.addClass('ui-widget-content ui-corner-bottom stdPadding').css('borderTop','0'); //content area.
				
				if(o.call && typeof app.ext.admin.calls[o.call] == 'object')	{
					if(o.callParams)	{
						app.ext.admin.calls[o.call].init(o.callParams,o._tag,o.Q);
						}
					else	{
						app.ext.admin.calls[o.call].init(o._tag,o.Q);
						}
					if(o.showLoading){$t.showLoading();}
					}
				//appevents should happen outside this so that any other manipulation can occur prior to running them.
				//they'll get executed as part of the callback if a call is specified.
				self._handleInitialState();
				}
			}, //_init

		_setOption : function(option,value)	{
			$.Widget.prototype._setOption.apply( this, arguments ); //method already exists in widget factory, so call original.
			switch (option)	{
				case 'state':
					(value === 'collapse') ? this.collapse() : this.expand(); //the expand/collapse function will change the options.state val as well.
					break;

				case 'settingsMenu':
					$.extend(this.options.menu,value); //add the new menu to the existing menu object. will overwrite if one already exists.
					this._destroySettingsMenu();
					this._buildSettingsMenu();
					break;
				
				default:
					console.log("Unrecognized option passed into anypanel via setOption");
					console.log(" -> option: "+option);
					break;
				}
			},

		_anyContent : function()	{
			var $content = false, //what is returned. will either be a jquery object of content or false
			o = this.options;
//			app.u.dump("anypanel._anyContent");
			if(o.content)	{
				
				$content = o.content;
				}
//templateid and data are both specified, so add and translate.
			else if(o.templateID && o.data)	{
//				app.u.dump(" -> o.data: "); app.u.dump(o.data);
				$content = app.renderFunctions.transmogrify(o.dataAttribs,o.templateID,o.data);
				}
			//templateid and call are specified, so create instance. dispatch occurs OUTSIDE this plugin.
			else if(o.templateID && o.call)	{
				$content = app.renderFunctions.createTemplateInstance(o.templateID,o.dataAttribs);
// !!! need a 'call' here with a translateSelector callback (admin extension)
				}
			//a templateID was specified, just add the instance. This likely means some process outside this plugin itself is handling translation.
			else if(o.templateID)	{
				$content = app.renderFunctions.createTemplateInstance(o.templateID,o.dataAttribs);
				}
			else	{
				
				}
			return $content;
			},

		_handleButtons : function($header)	{
			var	self = this,
			o = this.options,
			buttonStyles = {'float':'right','width':'20px','height':'20px','padding':0,'margin':'2px'}; //classes applied to each of the buttons.
			
			var $buttonSet = $("<div \/>").addClass('floatRight').css({'position':'absolute','top':'2px','right':'2px'}).appendTo($header.parent());
			
			if(o.showClose)	{
				$buttonSet.append($("<button \/>").attr({'data-btn-action':'close','title':'close panel'}).addClass('ui-button-anypanel ui-button-anypanel-close').css(buttonStyles).button({icons : {primary : 'ui-icon-close'},'text':false}).on('click.panelClose',function(){self.destroy()})); //settings button
				}

			$buttonSet.append($("<button \/>").hide().attr('data-btn-action','settingsMenu').addClass('ui-button-anypanel ui-button-anypanel-settings').css(buttonStyles).text('Settings')
				.button({text: false,icons : {primary : 'ui-icon-wrench'}})
				.off('click.settingsMenu').on('click.settingsMenu',function(){
					var $ul = $("[data-app-role='settingsMenu']",$t).toggle();

//this will make it so any click outsite the menu closes the menu. the one() means it only gets triggered once.
//it's inside the click handler, so it'll get added each time the settings are expanded.
					if($ul.is(":visible"))	{setTimeout(function(){$(document).one("click", function() {$ul.hide();});},1000);}
					
					})); //the settings button is always generated, but only toggled on when necessary.
			if(o.settingsMenu)	{self._buildSettingsMenu()}			

			$buttonSet.append($("<button \/>").attr({'data-btn-action':'toggle','title':'expand/collapse panel'}).addClass('ui-button-anypanel ui-button-anypanel-toggle').css(buttonStyles).button({icons : {primary : 'ui-icon-triangle-1-n'},'text':false}).on('click.panelViewState',function(){self.toggle()})); //settings button
			},

		_handleInitialState : function()	{
// ##### NOT SUPPORTED... YET....
//			if(this.options.state == 'preferences')	{
//				var preferences = app.ext.admin.u.devicePreferencesGet(this.extension);
//				this.options.state = preferences.anypanel[this.options.name].state || 'expand'; //if not defined, default to expand.
//				}
			
			if(this.options.state == 'collapse')	{ this.collapse();}
			else if (this.options.state == 'expand')	{this.expand();}
			else	{
				console.warn("unknown state passed into anypanel");
				}
			}, // !!! not done or in use yet.

		toggle : function(){
			if(this.options.state == 'expand')	{this.collapse()}
			else	{this.expand()}
			},

//the corner bottom class is added/removed to the header as the panel is collapsed/expanded, respectively, for aeshtetic reasons.
		collapse : function(preserveState){
			preserveState = preserveState || false; //set to true to collapse, but not change state. allows for mass collapse w/out session update and for restoring on a mass-restore
			$("[data-btn-action='toggle']",this.element).button({icons : {primary : 'ui-icon-triangle-1-s'},'text':false});
			$('.ui-widget-content',this.element).slideUp();
			$('.ui-widget-header',this.element).addClass('ui-corner-bottom');
			if(preserveState)	{}
			else	{
				this.options.state = 'collapse';
				this._handlePreferencesStateUpdate('collapse');
				}
			},

		expand : function(){
			$("[data-btn-action='toggle']",this.element).button({icons : {primary : 'ui-icon-triangle-1-n'},'text':false});
			$('.ui-widget-content',this.element).slideDown();
			$('.ui-widget-header',this.element).removeClass('ui-corner-bottom');
			this.options.state = 'expand';
			this._handlePreferencesStateUpdate('expand');
			},

		_handlePreferencesStateUpdate : function(value)	{
			var r = false; //will return true if a preferences update occurs.
			if(this.persist && value)	{
				if(this.extension && this.name)	{
					var updatedPreferences = {"anypanel":{}};
					updatedPreferences.anypanel[this.options.name] = {'state':value};
					var preferences = $.extend(true,app.ext.admin.u.devicePreferencesGet(this.options.extension),updatedPreferences); //make sure panel object exits. general panel is always expand.
					app.ext.admin.u.devicePreferencesSet(this.options.extension,preferences); //update the localStorage session var.
					r = true;
					}
				else	{
					console.warn("anypanel has persist enabled, but either name ["+this.name+"] or extension ["+this.extension+"] not declared. This is a non-critical error, but it means panel will not be persistant.");
					}
				}
			return r;
			},

		_destroySettingsMenu : function()	{
			$("[data-app-role='settingsMenu']",this.element).empty().remove();
			},
		
		_buildSettingsMenu : function()	{
			var $ul = $("<ul \/>"),
			sm = this.options.settingsMenu;
			
			$ul.attr('data-app-role','settingsMenu').hide().css({'position':'absolute','right':0,'zIndex':10000});
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
			var $t = this.element;
			this.element.slideUp('fast',function(){$t.empty().remove();});
			}
		}); // create the widget
})(jQuery); 






jQuery.fn.toCSV = function() {
  var data = $(this).first(); //Only one table
  var csvData = [];
  var tmpArr = [];
  var tmpStr = '';
  data.find("tr").each(function() {
      if($(this).find("th").length) {
          $(this).find("th").each(function() {
            tmpStr = $(this).text().replace(/"/g, '""');
            tmpArr.push('"' + tmpStr + '"');
          });
          csvData.push(tmpArr);
      } else {
          tmpArr = [];
          $(this).find("td").each(function() {
             $(this).find("td").each(function() {
                if($(this).text().match(/^-{0,1}\d*\.{0,1}\d+$/)) {
                    tmpArr.push(parseFloat($(this).text()));
                } else {
                    tmpStr = $(this).text().replace(/"/g, '""');
                    tmpArr.push('"' + tmpStr + '"');
                }
            });
          });
          csvData.push(tmpArr.join(','));
      }
  });
  var output = csvData.join('\n');
  var uri = 'data:application/csv;charset=UTF-8,' + encodeURIComponent(output);
  window.open(uri);
}