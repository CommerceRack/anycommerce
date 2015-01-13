/*

This file is a variety of plugins that are either open-source or were written by Zoovy/anycommerce.
They're in one file just to minimize the number of includes.
plugins fairly tailored to the anycommerce/zoovy mvc.

anymessage - throw a message at the user, supporting classes and icons for severity.
anytabs - a simple tab script that does NOT use id's. jqueryui tabs does not play well on recycled templates (cat, product, etc). ok in checkout/cart.
anycontent - used to generate content (go figure). pass in a template id and/or data for translation and appending to jqObject.
anypanel - turn an element into a toggle-able panel with localStorage based persistence.
anycb - will turn a label/checkbox into an IOS-esque on/off toggle
anytable - apply to any table with a thead and the th within that head will be clickable for sorting by that column.

jqueryui widget/plugin help can be found here:
http://net.tutsplus.com/tutorials/javascript-ajax/coding-your-first-jquery-ui-plugin/

*/

// replacement for obsolete .browser() function.
//.browser() is deprecated as of jquery 1.3 and removed in 1.9+ however a lot of plugins use it.
// Figure out what browser is being used
if(typeof jQuery.browser == 'undefined')	{
	jQuery.browser = {
		version: (navigator.userAgent.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [0,'0'])[1],
		safari: /webkit/.test( navigator.userAgent ),
		opera: /opera/.test( navigator.userAgent ),
		msie: /msie/.test( navigator.userAgent ) && !/opera/.test( navigator.userAgent ),
		mozilla: /mozilla/.test( navigator.userAgent ) && !/(compatible|webkit)/.test( navigator.userAgent )
		}
	}


/*


/////  ANYMESSAGE  \\\\\


anymessage - a utility for throwing any commerce messages to the user.
examples: 
$('#allBase').anymessage({'message':'All your base are belong to us'});
$('#allBase').anymessage('message':responseData); where responseData is an API response containing a message (either err, _msg or @issues format)

Alternatively, you could call it like this:
$('#diddy').anymessage({'iconClass':'ui-icon-clock','containerClass':'ui-state-error'}); (all params are optional)<br />
$('#diddy').anymessage('addMessage',responseData);

For the list of available params, see the 'options' object below.

*/





(function($) {
	

/*
apply to a selector to handle app events.
additionally, will apply some conditional form logic.
*/

	$.widget("ui.anyform",{
		options : {
//			trackFormEvents : true, //set to false to turn off the form event actions (panel code et all)
			trackEdits : false, //boolean.  if true, as an input/select is changed, an 'edited' class is added to the input.
/* the following options are only applicable if trackEdits is enabled */
			trackSelector : null, //allows for delegation to occur on an element encompasing several forms, but for tracking to be applied to each individual form.
			masterSaveSelector : "[data-app-role='masterSaveButton']" //if applying track edits to a subset, this can be used to update a master button (X total changes within all forms).
			},
		_supportedEvents : ["click","change","focus","blur","submit","keyup"], //a function so they're easily 
		_init : function(){
//			dump("BEGIN anyform");
			var
				self = this,
				$t = self.element; //this is the targeted element (ex: $('#bob').anyform() then $t is bob)

//don't want to double-delegate. make sure no parent already has delegation run. a class is used as it's more efficient and can be trusted because it's added programatically.
			if($t.closest('.anyformEnabled').length >= 1)	{
				dump("anyform was run on an element that already (or one of it's parents) has events delegated. DELEGATION SKIPPED. TriggerFormEvents will still be run so that the display properties (et all) are updated.");
				}
			else	{
				$t.addClass('anyformEnabled'); //this class is used both to determine if events have already been added AND for some form actions to use in closest.
//make sure there are no children w/ delegated events.
				$('.anyformEnabled',$t).each(function(){
					$(this).anyform('destroy');
					});
				for(var i = 0; i < self._supportedEvents.length; i += 1)	{
					$t.on(self._supportedEvents[i]+".anyform","[data-input-"+self._supportedEvents[i]+"]",function(e,p){
//						dump(" -> delegated "+self._supportedEvents[i]+" triggered");
						return self._executeEvent($(e.currentTarget),$.extend(p,e));
						});
					}
				}


//go through and trigger the form based events, so that if any content/classes should be on, they are.
//do this before edit tracking is added so the edited class is not added.
//this block is executed outside the  if/else above so that if anyform has already been added to a parent, new content still gets default actions.
				self.triggerFormEvents();



//outside the app event delegation check for backwards compatiblity.
//the track edit delegation is removed and added in case it's run more than once, so that each edit isn't double-counted.
			if(self['options'].trackEdits)	{
				if(self['options'].trackSelector)	{
//					dump(" -> TrackSelector IS enabled");
					$(self['options'].trackSelector,$t).each(function(){
						self._applyTracking4Edits($(this));
						})
					}
				else	{
					self._applyTracking4Edits($t);
					}
				this.updateChangeCounts(); //handles defaults, like hiding the changes-container elements
				}
			}, //_init

//what is triggered when an event occurs.
//$CT = $(e.currentTarget)
//ep = event + parameters (params may get added if the event is triggered programatically)
		_executeEvent : function($CT,ep)	{
//			dump(" -> ui.anyform._executeEvent being run");
			ep = ep || {};
			var r = true; //what is returned.
			ep.normalizedType = this._normalizeEventType(ep.type);
			if($CT && $CT instanceof jQuery)	{
				if($CT.attr('data-input-'+ep.normalizedType))	{
					r = this._handleFormEvents($CT,ep);
					}
				}
			else	{
				$('#globalMessaging').anymessage({'message':"In ui.anyform._executeEvent, $CT is empty or not a valid jquery instance [isValid: "+($CT instanceof jQuery)+"] or p.type ["+ep.normalizedType+"] is not set.",'gMessage':true})
				}
//			dump("_executeEvent r: "+r);
			return r;
			},

		_formEventActions : {
//used w/ keyup to modify the value of the input. ex: all uppercase. input-format accepts a comma separated list of values.
//$CT = Current Target.
			"input-format" : function($CT)	{
				if($CT.data('input-format').indexOf('uppercase') > -1)	{
					$CT.val($CT.val().toUpperCase());
					}

				if($CT.data('input-format').indexOf('lowercase') > -1)	{
					$CT.val($CT.val().toLowerCase());
					}
				
				if($CT.data('input-format').indexOf('alphanumeric') > -1)	{
					$CT.val($CT.val().toString().replace(/\W+/g,""));
					}
//an input can not be both alphanumeric AND numeric.
				else if($CT.data('input-format').indexOf('numeric') > -1)	{
					$CT.val($CT.val().replace(/[^0-9]+/g, ''));
					}							
				else if($CT.data('input-format').indexOf('decimal') > -1)	{
					$CT.val($CT.val().replace(/[^0-9\.]+/g, ''));
					}							
				else if($CT.data('input-format').indexOf('flex') > -1)	{
					$CT.val($CT.val().replace(/[^\w\:_]+/, '','g'));
					}							
				else if($CT.data('input-format').indexOf('pid') > -1)	{
					$CT.val($CT.val().replace(/[^\w\-_]+/, '','g'));
					}
				else if($CT.data('input-format').indexOf('blastid') > -1)	{
					$CT.val($CT.val().replace(/[^\w\.]+/, '','g'));
					}
				},
//allows an input to specify a button to get triggered if 'enter' is pushed while the input is in focus.
			"trigger-button-id" : function($CT,$t,ep)	{
				if(ep.keyCode==13){$CT.closest(".anyformEnabled").find("button[data-button-id='"+$CT.attr('data-trigger-button-id')+"']").first().trigger('click')}
				},
			
//allows one form input to set the value of another.
			"set-value-selector" : function($CT)	{
				$($CT.data('set-value-selector'),$CT.closest('form')).val($CT.is('select') ? $("option:selected",$CT).data('set-value') : $CT.data('set-value')).trigger('keyup.trackform').trigger('change.trackform');
				},

//will hide the matching selectors. (hide-selector='.bob' will hide all class='bob' elements.
			"hide-selector" : function($CT,$t)	{
				if($($CT.attr('data-hide-selector'),$t).is(':hidden'))	{}
				else	{
					$($CT.attr('data-hide-selector'),$t).slideUp();
					}
				},

//will show the matching selectors. (show-selector='.bob' will show all class='bob' elements.
			"show-selector" : function($CT,$t)	{
				if($($CT.attr('data-show-selector'),$t).is(':visible'))	{}
				else	{
					$($CT.attr('data-show-selector'),$t).slideDown();
					}
				},
			
///			"toggle-selector" : function($CT,$t)	{
				
//				},

			"checked-classes" : function($CT,$t)	{
				$t.removeClass($CT.data('check-selectors'));
				$CT.is(':checked') ? $t.addClass($CT.data('checked-classes')) : $t.removeClass($CT.data('checked-classes'));
				},

			"unchecked-classes" : function($CT,$t)	{
				$t.removeClass($CT.data('check-selectors'));
				!$CT.is(':checked') ? $t.addClass($CT.data('unchecked-classes')) : $t.removeClass($CT.data('unchecked-classes'));
				},

//allows for a specific panel (or sets of panels) to be turned on/off based on selection. commonly used on a select list, but not limited to that.
//provides more control that trying to accomplish the same thing with the show/hide-selectors.
			"panel-selector" : function($CT)	{
				$($CT.data('panel-selector'),$CT.closest('form')).hide(); //hide all panels w/ matching selector.
				
				if($CT.is(':checkbox') && !$CT.is(':checked'))	{} //this is an unchecked checkbox. do nothing.
				else	{
					var panelList = $CT.is('select') ? $("option:selected",$CT).data('show-panel') : $CT.data('show-panel');
					if(panelList)	{
						if(panelList.indexOf(','))	{panels = panelList.split(',')}
						else {panels.push(panelList)};
						
						for(var i = 0; i < panels.length; i += 1)	{
							$("[data-panel-id='"+panels[i]+"']",$CT.closest('form')).show(); //panel defined and it exists. show it.
							}
						}
					else	{} //no panel was defined. this is an acceptable case.
					}
				}
			},

//useful if the DOM is updated w/ a new template/content and the defaults for form events need to be triggered.
		triggerFormEvents : function()	{
			var self = this, $t = self.element, L = self._supportedEvents.length;
			for(var i = 0; i < L; i += 1)	{
				$("[data-input-"+self._supportedEvents[i]+"]",$t).each(function(index){
//					dump(index+") for form events.");
					var $i = $(this);
					if($i.is('select'))	{
						$('option:selected',$i).trigger(self._supportedEvents[i]+'.anyform');
						}
					else if($i.is(':checkbox'))	{
						$i.trigger(self._supportedEvents[i]+'.anyform');
						}
					else if($i.is(':radio'))	{
						if($i.is(':checked'))	{
							$i.trigger(self._supportedEvents[i]+'.anyform');
							}
						else	{} //is a radio but isn't selected.
						}
					else	{
						$i.trigger(self._supportedEvents[i]+'.anyform');
						}
					});
				}
			},

//a method that can be triggered by $('selector').anyform('updateChangeCounts')
		updateChangeCounts : function()	{
//			dump(" -> anyform('updateChangeCounts') has been run");
			var self = this;
			if(self['options'].trackSelector)	{
				$(self['options'].trackSelector,self.element).each(function(){
					var $ele = $(this);
//if a changes container has been specified, update with the number of edits or hide if there are no edits.
					if($ele.data('changes-container'))	{
						if($('.edited',$ele).length)	{
							$("[data-anyform-changes='"+$ele.data('changes-container')+"']",self.element).show().find('.numChanges').text($('.edited',$ele).length)
							}
						else	{
							$("[data-anyform-changes='"+$ele.data('changes-container')+"']",self.element).hide();
							}
						
						}
					self._updateSaveButtonInContext($ele,"[data-app-role='saveButton']");
					})
				}
			else	{
				self._updateSaveButtonInContext(this.element,"[data-app-role='saveButton']");
				}
			if(this['options'].masterSaveSelector)	{
				self._updateSaveButtonInContext(this.element,"[data-app-role='masterSaveButton']");
				}
			},

/*
pass in an event name and a function and it will be added as an eventAction.
		addFormEventAction : function(name,eventActionFunction){},

*/

//used to update the save buttons, both the master and the individuals.
		_updateSaveButtonInContext : function($context,selector)	{
//			dump(" -> running anyform._handleSaveButtonByEditedClass.");
//run over EACH button individually.  some may have had button() run on them, some may not.
			$(selector,$context).each(function(){
				var $button = $(this);
				if($('.edited',$context).length)	{
					$('.numChanges',$button).text($('.edited',$context).length);
					$button.addClass('ui-state-highlight');
					if($button.hasClass('ui-button'))	{
						$button.button("enable");
						}
					else	{
						$button.attr('disabled','').removeAttr('disabled');
						}
					}
				else	{
					$('.numChanges',$button).text("");
					$button.removeClass('ui-state-highlight');
					if($button.hasClass('ui-button'))	{
						$button.button("disable")
						}
					else	{
						$button.attr('disabled','disabled');
						}
					}

				});
			},
		
		_applyTracking4Edits : function($context)	{
			var self = this;
			$context.off('change.trackform').on('change.trackform',"select, :radio, :checkbox",function(event)	{
				var $input = $(this);
				if($input.hasClass('skipTrack'))	{} //if skipTrack is set, do nothing.
				else if($input.is(':checkbox'))	{
					$input.toggleClass('edited');
					self.updateChangeCounts($context);
					}
				else	{
					if($input.is(':radio'))	{
						$("[name='"+$input.attr('name')+"']",$input.closest('form')).removeClass('edited'); //remove edited class from the other radio buttons in this group.
						}
					$input.addClass('edited');
					self.updateChangeCounts($context);
					}
				});

// mouseup event present because a right click of 'paste' does not trigger keyup.
			$context.off('keyup.trackform').on('keyup.trackform mouseup.trackform',"input, textarea",function(event){
				var $input = $(this);
				if($input.hasClass('skipTrack')){} //allows for a field to be skipped.
				else if($input.is(':checkbox') || $input.is(':radio'))	{
					//handled in it's own delegation above. Here because they 'could' be triggered by a space bar.
					}
//only add the edited class if the value has changed.
				else if($input.prop("defaultValue") != $input.val())	{
					$input.addClass('edited');
					self.updateChangeCounts($context);
					}
				else	{
					//well... something happened.  verify change counts are correct. 
					self.updateChangeCounts($context);
					}
				});

			},
		
		_handleFormEvents : function($CT,ep)	{
//			dump("BEGIN _handleFormEvents");
			//for each event action, determine if the element should trigger it and, if so, trigger it.
			for(index in this._formEventActions)	{
				if($CT.data(index))	{this._formEventActions[index]($CT,this.element,ep);}
				}
			},
//passing in a context allows this reset to impact just a portion of the delegated. useful in conjuction w/ trackSelector
		resetTracking : function($context)	{
			$context = $context || this.element;
			$('.edited',$context).removeClass('edited');
			this._updateSaveButtonInContext($context,"[data-app-role='saveButton']");
			this._updateSaveButtonInContext(this.element,"[data-app-role='masterSaveButton']"); //intentionaly not using $context because master could be outside it. This way the master buttons count still updates.
			},

//The actual event type and the name used on the dom (focus, blur, etc) do not always match. Plus, I have a sneaking feeling we'll end up with differences between browsers.
//This function can be used to regularize the event type. Wherever possible, we'll map to the jquery event type name.
		_normalizeEventType : function(type)	{
			var r = type;
			if(type == 'focusin')	{
				r = 'focus';
				}
			else if(type == 'focusout')	{
				r = 'blur';
				}
			return r;
			},

//clear the message entirely. run after a close. removes element from DOM.
		destroy : function(){
			//remove all the delegated events!!! leave the content alone.
			this.element.off('change.trackform').off('keyup.trackform');
			var supportedEvents = new Array("click","change","focus","blur","submit","keyup");
			for(var i = 0; i < supportedEvents.length; i += 1)	{
				this.element.off(supportedEvents[i]+".anyform");
				}
			this.element.removeClass('anyformEnabled').addClass('anyformRemoved'); //here for troubleshooting purposes.
			}
		}); // create the widget



	
	
	
	
	$.widget("ui.anymessage",{
		options : {
			message : null, //a string for output. if set, will ignore any _msgs or _err orr @issues in the 'options' object (passed by a request response)
			gMessage : false, //set to true to throw a generic message. Will include extra error details and a default message before the value of message.
			containerClass : 'ui-state-highlight', //will be added to container, if set. will add no ui-state class if this is set.
			errtype : null,
			showCloseButton : true,
			iconClass : null, //for icon display. ex: ui-state-info. if set, no attempt to auto-generate icon will be made.
			persistent : false //if true, message will not close automatically. WILL still generate a close button. iseerr's are persistent by default
			},

		_init : function(){
//			dump("BEGIN anymessage");
			var self = this,
			o = self.options, //shortcut
			$t = self.element; //this is the targeted element (ex: $('#bob').anymessage() then $t is bob)
//a unique ID applied to the container of the message. used for animating and for checking if element is still on the DOM during close.
			o.messageElementID = 'msg_'+self._guid();
			
//the content is in an array because otherwise adding multiple messages to one selector causes them to share properties, which is not a desired behavior.
			if(typeof self.outputArr == 'object')	{}
			else	{self.outputArr = new Array()}
			
			var i = self.outputArr.push(self._getContainer()) - 1;  //the jquery object of the message output.
			self.outputArr[i].attr('id',o.messageElementID);
			if(o.showCloseButton)	{
				self.outputArr[i].append(self._getCloseButton()); //a close button must be specifically disabled, even for persistent.
				}
			self.outputArr[i].append(self._getIcon());
			self.outputArr[i].append(self._getFormattedMessage(i));
			$t.prepend(self.outputArr[i]); //

			if(o.persistent)	{} //message is persistent. do nothing.
//message should auto-close. However, it is possible for a message to already have been removed by an 'empty', so verify it is still on the DOM or an error could result.
// ** 201318 -> bug fix. jquery error if close method run on element that wasn't already instantiated as anymessage, such as an element already removed from DOM.
// ** ++ auto close bugfix.  The appropriate message is passed to the close function so that when the timeout executes it does not close all the messages in the container
			else	{this.ts = setTimeout(function(){
				if($('#'+o.messageElementID).length)	{$t.anymessage('close',$('#'+o.messageElementID));} 
				},10000);} //auto close message after a short duration.
// ** 201318 side effects bug- reset options after displaying the message to provide defaults for the next message --mc
//EXAMPLE: 2 messages are sent to the same container.  Message 1 calls persistent true, message 2 does not set persistent.  
//Message 2 is set to persistent because the defaults have been overwritten on the container
			this.options = {
				message : null, //a string for output. if set, will ignore any _msgs or _err orr @issues in the 'options' object (passed by a request response)
				gMessage : false, //set to true to throw a generic message. Will include extra error details and a default message before the value of message.
				containerClass : 'ui-state-highlight', //will be added to container, if set. will add no ui-state class if this is set.
				iconClass : null, //for icon display. ex: ui-state-info. if set, no attempt to auto-generate icon will be made.
				showCloseButton : true,
				errtype : null,
				persistent : false //if true, message will not close automatically. WILL still generate a close button. iseerr's are persistent by default
				}
			}, //_init

		_guid : function()	{
			var S4 = function() {
				return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
				};
			return (S4()+S4()+S4()+S4()+S4()+S4()+S4()+S4());
			},

		_setOption : function(option,value)	{
			$.Widget.prototype._setOption.apply( this, arguments ); //method already exists in widget factory, so call original.
			},



		_getIcon : function()	{
			var o = this.options, //shortcut
			msg = o.message,
			r; //what is returned
			if(o.iconClass)		{}
			if(o.errtype)		{o.iconClass = 'app-icon-'+o.errtype}
			else if(msg && typeof msg == 'object' && msg.errtype)	{o.iconClass = 'app-icon-'+msg.errtype}
			else if(msg && typeof msg == 'object' && msg['_msg_0_type'])	{o.iconClass = 'app-icon-'+msg['_msg_0_type']} //only 1 icon is displayed, so just show the first.
			else	{o.iconClass = 'app-icon-info'}
//			dump(" -> o.iconClass: "+o.iconClass);
			return $("<span \/>").addClass('app-icon').addClass(o.iconClass);
			},

		_getCloseButton : function()	{
			var $t = this.element;
			return $("<button \/>")
				.addClass('smallButton')
				.text('close message').css({'float':'right','marginLeft':'5px','marginBottom':'5px'})
				.button({icons: {primary: "ui-icon-circle-close"},text: false})
				.on('click.closeMsg',function(event){event.preventDefault(); $t.anymessage('close',$(this).closest('.ui-widget-anymessage'))});
			},

//adds the outer 'container' div around the message.
		_getContainer : function()	{
			return $("<div \/>").addClass("ui-widget ui-widget-content ui-widget-anymessage ui-corner-all marginBottom").css({'padding':'5px','min-height':'28px'}).addClass(this['options'].containerClass);
			},


		_getFormattedMessage : function(instance)	{
//			dump(" -> _getFormattedMessage executed");
			var o = this.options, //shortcut
			msg = o.message || o, //shortcut to the message itself. if message blank, options are used, which may contain the response data errors (_msgs, err etc)
			msgDetails = "", //used for iseerr (server side error) and ise/no response
			$r = $("<div \/>"), //what is returned. some sort of defualt container needs to be set. may be overwritten. necessary in cases where only @MSGS is defined.
			amcss = {'margin':'0','paddingBottom':'5px'} //anyMessageCSS - what's applied to P (or each P in the case of _msgs)

//			dump(' -> msg: '); dump(msg);

			
			if(!msg)	{
//				dump(" -> msg is blank. could be that message is being handled as a method.");
				//no message passed. is ok because messages 'could' get handled as a method.
				}
			else if(typeof msg == 'string')	{
//				dump(" -> msg is string: "+msg);
				$r = $("<p \/>").addClass('anyMessage').css(amcss).html(msg);
				}
			else if(typeof msg == 'object')	{
//				dump(" -> msg type is object."); dump(msg);
				if(msg._msgs)	{
//				dump(" -> msg format is _msgs.");
					$r = $("<div \/>").css({'margin-left':'20px'}); //adds a left margin to make multiple messages all align.
					for(var i = 1; i <= msg['_msgs']; i += 1)	{
						if(msg['_msg_'+i+'_txt'])	{
							$r.append($("<p \/>").addClass('anyMessage').css(amcss).addClass(msg['_msg_'+i+'_type'] || "" ).text(msg['_msg_'+i+'_txt']+" ["+msg['_msg_'+i+'_id'] || "no id set"+"]"));
							}
						else if(msg['_msg_'+i+'_txt'] === null)	{
							//null will only be value if a successful API request went through and the repsonse message was specifically set to null, so we can ignore it.  below, 'blanks' are handled.
//							dump("CAUTION! response (_msg_"+i+"_tx) contained a null msg text. This is likely a normal part of the response.");
							}
						else	{
							$r.append($("<p \/>").addClass('anyMessage').css(amcss).addClass(msg['_msg_'+i+'_type'] || "" ).text("Uh Oh! An error occured by _msg_"+i+"_txt is blank.  How odd."));
							}
						}
					}
				else if(msg.errid)	{
//					dump(" -> msg type is err.");
					$r = $("<p \/>").addClass('anyMessage').css(amcss).addClass(msg.errtype).html(msg.errmsg+" ["+msg.errid+"]");
					
					if(msg.errtype == 'iseerr')	{
//					dump(" -> msg IS iseerr.");

					o.persistent = true; //iseErr should be persistent
					this.outputArr[instance].addClass('ui-state-error');
//					$('button',this.outputArr[instance]).button('disable'); //I don't think we want to disable the ability to close this, we just don't want it to auto-close.

					this.outputArr[instance].addClass('ui-state-error');
						var msgDetails = "<ul>";
						msgDetails += "<li>errtype: iseerr<\/li>";
						msgDetails += "<li>errid: "+msg.errid+"<\/li>";
						msgDetails += "<li>errmsg: "+msg.errmsg+"<\/li>";
						msgDetails += "<li>uri: "+document.location+"<\/li>";
						if($._app)	{
							msgDetails += "<li>domain: "+$._app.vars.domain+"<\/li>";
							msgDetails += "<li>release: "+$._app.model.version+"|"+$._app.vars.release+"<\/li>";
							}
						msgDetails += "<\/ul>";
						$r.append(msgDetails);
						}
					}
//the validate order request returns a list of issues.
				else if(msg['@RESPONSES'])	{
					var L = msg['@RESPONSES'].length;
//					dump("Got to @issues, length: "+L);
					$r = $("<ul \/>"); //adds a left margin to make multiple messages all align.
					for(var i = 0; i < L; i += 1)	{
						$r.append("<li>"+(msg['@RESPONSES'][i].msgsubtype || msg['@RESPONSES'][i].msgtype)+": "+msg['@RESPONSES'][i].msg+"<\/li>");
						}
					}

//the validate order request returns a list of issues.
				else if(msg['@issues'])	{
					var L = msg['@issues'].length;
//					dump("Got to @issues, length: "+L);
					$r = $("<div \/>").css({'margin-left':'20px'}); //adds a left margin to make multiple messages all align.
					for(var i = 0; i < L; i += 1)	{
						$r.append("<p>"+msg['@issues'][i][3]+"<\/p>");
						}
					}
				else	{
//					$r = $("<p \/>").addClass('anyMessage').text('An unknown error has occured');
					} //unknown data format
		
//A message could contain a _msg for success AND @MSGS. always display what is in @MSGS.
				if(!$.isEmptyObject(msg['@MSGS']))	{
					var L = msg['@MSGS'].length;
					dump("Got to @MSGS, length: "+L);
					$msgs = $("<ul \/>"); //adds a left margin to make multiple messages all align.
					for(var i = 0; i < L; i += 1)	{
						$msgs.append("<li>"+msg['@MSGS'][i]['_']+": "+msg['@MSGS'][i]['+']+"<\/li>");
						}
					dump(" -> $msgs.children().length: "+$msgs.children().length);
					$r.append($msgs);
					$msgs.appendTo($r);
					}
				
				}
			else	{
				dump(" -> anymessage._getFormattedMessage 'else' hit. Should not have gotten to this point");
				$r = $("<p \/>").addClass('anyMessage').text('unknown error has occured'); //don't want to have our error handler generate an error on screen.
				}
//gMessage is generic message, used for 'soft' errors. and ISEERR should have messaging this is a little less generic (or more severe)
			if(o.gMessage && msg.errtype != 'iseerr')	{
				msg.errtype = msg.errtype || 'apperr'; //gMessage is used primarly in errors generated by the app itself, not so much as results of data gathering.
				$r.prepend("<p>An error has occured (details below). If you continue to experience this error, please contact the site administrator.<\/p>");
				}
			return $r;

			},
//intended for use inside the user interface
/*
		'type' : {
			'success' : {'iconClass':'ui-icon-z-success','containerClass':''}
			},
*/
//an animated 'close'
		close : function($message){
			var $target;  //what is being closed. could be an individual message OR all messages.
			if($message)	{
				$target = $message;
				}
			else	{
				$target = $('.ui-widget-anymessage',this.element);
				}
			
			$target.each(function(){
//the message could be removed manually prior to the callback being executed, so don't animate if that's the case. (avoids popping issue)
//also, remove the message (this.output), not the target element, which may have a lot of other content.
				if($(this).is(':visible'))	{
					$(this).slideUp('fast');
					}
				else	{} //already closed. do nothing. could get here if message closed manually, before timeout runs.
				
				})
			},

//clear the message entirely. run after a close. removes element from DOM.
		destroy : function(){
			this.element.empty().remove();
			}
		}); // create the widget



/*


/////  ANYTABS  \\\\\

anytabs - a simple tab script that does NOT use id's.
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

	$.widget("ui.anytabs",{
		options : {
			'extension' : null, //a dps namespace for saving what tab is open. allows for that tab to become the default when the next instance of the tabs is opened. 
			// ex: product editor > edit product. open marketplaces tab. next product opened will have marketplaces open by default. requires persist to be enabled.
			'persist' : false //if set to true AND extension is set, DPS will be used to read what tab was last open and bring that tab into focus at init.
			},

		_init : function(){
			var self = this,
			o = self.options, //shortcut
			$t = self.element; //this is the targeted element (ex: $('#bob').anytabs() then $t is bob)

			if($t.attr('data-widget-anytabs'))	{
//				dump("data-widget-anytabs -> already enabled.");
				} //element has already been set as tabs.
			else	{
				$t.attr('data-widget-anytabs',true)
				$t.addClass('ui-tabs ui-widget ui-widget-anytabs')
				self.tabs = $("ul",$t).first();
//style and move tabs into container.
				self._handleContent();
				self._addClasses2Content();
				
//style and add click events to tabs.
				self._addClassesAndData2Tabs();
				self._addEvent2Tabs();
//make a tab visible/active.
				self._handleDefaultTab();
				}
			}, //_init

		_setOption : function(option,value)	{
			$.Widget.prototype._setOption.apply( this, arguments ); //method already exists in widget factory, so call original.
			},
// ** 201402 -> updated the default to show the first VISIBLE tab, not the first tab.  allows for tabs to be conditionally shown more easily.
		_handleDefaultTab : function()	{
			var o = this.options, $tab;
//if no anchor is set, activate the default.
			if(o.persist && o.extension && $._app)	{
				var theAnchor = $._app.model.dpsGet(o.extension,'anytabs') || {};
				if(theAnchor.recentTab && $("li[data-anytabs-tab='"+theAnchor+"']",this.element).length)	{
					$tab = $("li[data-anytabs-tab='"+theAnchor+"']",this.element)
					}
				else	{
					$tab = $("li:visible:first",this.element);
					}
				}
			else	{
				$tab = $("li:visible:first",this.element);
				}
			//in case no tab has been found, default to the first. this 'could' happen if applied to an object in memory.
			if(!$tab.length)	{
				$tab = $("li:first",this.element);
				}
			this.reveal($tab);
			},

		_addEvent2Tabs : function()	{
			var self = this;
			//the click is registered on the li, not the a. that way any part of the 'tab' can be clicked.
			this.tabs.on('click.anytabs','li',function(event){
				event.preventDefault();
				self._handleTabClick($(this));
//				return false; //if function returns false, any delegated events on tab don't run.
				});
			},

		_addClassesAndData2Tabs : function()	{
			this.tabs.addClass('ui-tabs-nav ui-helper-reset ui-helper-clearfix').css({'padding-left':'0px'});
			this.tabs.find('a').addClass('ui-tabs-anchor').attr('data-role','presentation');
// * 201336 -> wanted a data reference on the li of the tab that was consistent. can be used to show or hide tab, if needed.
			this.tabs.find('li').each(function(){
				$(this).addClass('ui-state-default ui-corner-top');
				var thisAnchor = $(this).find('a').first().attr('href').substr(1);
				$(this).attr('data-anytabs-tab',thisAnchor).data('tab',thisAnchor);
				});
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

//handle click needs to be separate from reveal. That way an anytabs('reveal','suchandsuch') can 'trigger' the click on the tab, thus executing any other delegated events that are present.
// any programatic tab changes should trigger the reveal code except the actual delegated click event (that click action would already trigger any other delegated events).
		_handleTabClick : function($tab2show)	{
			var o = this.options;
			if($tab2show)	{
				var dac = $tab2show.data('tab'); //data-anytab-content
				this.tabs.find('.ui-state-active').removeClass('ui-state-active ui-tabs-active');
				$tab2show.addClass('ui-state-active ui-tabs-active');

				this.tabContent.find('.ui-tabs-panel').hide();
				$("[data-anytab-content='"+dac+"']",this.tabContent).show();
				if(o.persist && o.extension && $._app)	{
					var dps = $._app.model.dpsGet(o.extension,'anytabs') || {};
					dps.recentTab = dac;
					$._app.model.dpsSet(o.extension,'anytabs',dps);
					}
				}
			else	{} //unknownn type for $tab far
			},

		reveal : function($tab)	{
			dump(" ----> $tab.length: "+$tab.length);
			var $tab2show = false;
			//method accepts string or jquery object as the trigger.
			if(typeof $tab == 'string')	{
				$tab2show = $("li[data-anytabs-tab='"+$tab+"']",this.tabs);
				}
			//testing for data('tab') ensures that the jquery object passed in is, indeed a tab.
			else if($tab instanceof jQuery && $tab.length && $tab.data('tab'))	{
				$tab2show = $tab;
				}
			else	{
				console.warn("In anytabs, a 'reveal' was triggered but the $tab passed in was either not a string or an object ["+typeof $tab+"] or it was an object but not a valid jquery instance ["+($tab instanceof jQuery)+"], had no length ["+$tab.length+"] or not a tab");
				}
			
			if($tab2show)	{
				//click triggered is NOT specific to anytabs so that any other delegated events are also triggered.
				//if any internal process needs to trigger just the anytabs code, run the _handleTabClick code OR trigger click.anytabs
				$tab2show.trigger('click'); 
				}
			
			},

//clear the message entirely. run after a close. removes element from DOM.
		destroy : function(){
//			this.element.intervaledEmpty(500,true);
			this.element.removeClass("ui-tabs ui-widget ui-widget-anytabs");
			this.element.data("widget-anytabs","");
			this.element.attr("data-widget-anytabs","").removeAttr('data-widget-anytabs');
			}
		}); // create the widget





})(jQuery); 






///// ANYUPLOAD \\\\\
/*
turn any element into a drop zone for files to be dragged from a users desktop onto the browser.

a lot of this code came from here:
https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications

*/



(function($) {
	$.widget("ui.anyupload",{
		options : {
			fileclass : null, //can be a more blanket 'type'. vals: image, text, spreadsheet. ignored if filetypes is specified (would be redundant)
			filetypes : [], //pass in an array of file types supported. ex ['csv','xls']
			templateID : null, // will be used to generate the preview.
			encode : null, // supports base64 or null
			autoUpload : true, //will upload the file as soon as it's dragged/selected. // ### TODO -> this is not working if set to true.
			stripExtension : false, //used within media library where the file extension should be stripped prior to non-alphanumeric character removal. (or .png becomes _png)
			maxSelectableFiles : null, //if a # is set, only that # of files will be allowed.
//			maxConcurrentUploads : 4, //if X, only X requests will run simultaneously and when one finishes, the next one fires.
//events
//			uploadsComplete : null, //run after ALL files are done. For individual files, specify the callback in the ajax request.
			filesChange : null, //run anytime a file is added, either via DROP or SELECT. run AFTER the preview files are generated.
			ajaxRequest : null //a function executed when a file is dropped. executed for each file. first param is an object (filename, base64) and second is this.element.
			},
		_init : function(){
//			dump('got to init');
			var
				$dropzone = this.element,
				anyfiledrop = this; //inside the event handlers below, 'this' loses context.
			
			if($dropzone.data('widget-anyupload'))	{} //already an anydropzone
			else{
				$dropzone.data('widget-anyupload',true).addClass('anydropzone').css('position','relative'); // relative positioning needed for file upload icon.
				this._addButtons();

				$dropzone.on("dragover dragenter", function(event) {
					event.stopPropagation();
					event.preventDefault();
					})

				$dropzone.on("drop",function(event){
					event.preventDefault();
					event.stopPropagation();
					anyfiledrop._drop(event);
					});
				}			
			}, //_init

// adds the buttons for opening the browser file dialog and starting the upload process		
		_addButtons : function()	{
			var
				self = this,
				$buttonSet = $("<div \/>").addClass('ui-widget-anyupload-buttonset');

			$buttonSet.append('<input type="file" class="ui-widget-anyfile-fileinput" '+(self['options'].maxSelectableFiles === 1 ? '' : 'multiple' )+' name="files[]" style="display:none;" />');
			$("<button \/>").text('Select '+(self['options'].maxSelectableFiles === 1 ? 'File' : 'Files')).button({icons: {primary: "ui-icon-document"},text: true}).on('click',function(event){
				event.preventDefault();
				$(this).parent().find(".ui-widget-anyfile-fileinput").trigger('click');
				}).appendTo($buttonSet);
			if(self['options'].autoUpload === false)	{
				$("<button \/>").addClass('ui-widget-anyfile-uploadbutton').text('Start Upload').button({icons: {primary: "ui-icon-arrowthickstop-1-n"},text: true}).button('disable').on('click',function(event){
					event.preventDefault();
					self._sendFiles();
					}).appendTo($buttonSet); //will be enabled once a file is selected
				}
			$('.ui-widget-anyfile-fileinput',$buttonSet).on('change',function(event){
				self.filesChangeEvent(event,self);
				});
			self.element.is('ul') ? self.element.parent().css({'position':'relative'}).append($buttonSet) : self.element.append($buttonSet);
			},
		
		_filteredFiles : function(files)	{
			var newFiles = new Array();
			var errors = '';
//filter by filetypes is any are specified.
			if(typeof this['options'].filetypes == 'object' && this['options'].filetypes.length)	{
				console.log(" -> filetypes filter is ON and running.");
				for(var i = 0, L = files.length; i < L; i += 1)	{
//					console.log(i+"). filetype: "+files[i].type);
					if($.inArray(files[i].type,this['options'].filetypes) > -1)	{
						newFiles.push(files[i]);
						}
					else	{
						errors += "<li>"+files[i].name+" is not a valid type ["+files[i].type+"] for this upload.</li>";
						}
					}
				}
//filter by fileclass if one is specified.
			else if(typeof this['options'].fileclass == 'string')	{

				for(var i = 0, L = files.length; i < L; i += 1)	{
					if(files[i].type.indexOf(this['options'].fileclass) > -1)	{
						newFiles.push(files[i]);
						}
					else	{
						errors += "<li>"+files[i].name+" is not a valid type ["+files[i].type+"] for this upload.</li>";
						}
					}

				}
			else	{
				newFiles = files;
				}
			if(errors)	{
				errors = "An invalid file type was found. Valid types include: "+(this['options'].filetypes.join(''))+"<ol>"+errors+"</ol>";
				this.element.append(errors);
				}
			return newFiles;
			},
		
		_buildPreviews : function(files,event,self){
			var self = self || this;
			var filteredFiles = self._filteredFiles(files);
//			dump(" -> self['options'].autoUpload: "+self['options'].autoUpload);
			if(self['options'].autoUpload === false && filteredFiles.length)	{
				$('.ui-widget-anyfile-uploadbutton',self.element).button('enable');
				}
//Do NOT make changes to the preview area if maxSelectedFiles is set to 1. Let the instance do it. That way file select can be set to one, but multiple files could still be supported.
			for (var i = 0; i < filteredFiles.length; i++) {
				var file = filteredFiles[i];
				var fileType = file.type.match('image.*') ? 'image' : 'file';

				if(self['options'].templateID)	{
//					dump(" -> file: "); dump(file);
					//create a template instance.  apply data('file') to it.  translate. then append to self.element.
					//this can't be done till the plugin is in anyplugins or the 'app' calls wont work
					var $ele = $._app.renderFunctions.createTemplateInstance(self['options'].templateID,{'name':file.filename});
					//transmogrify({'name':file.filename},self['options'].templateID,{'name':file.filename,'Name':file.filename,'path':'i/imagenotfound'}); //Name is for media lib.
					self.element.append($ele);
					$ele.anycontent({
						data : {'name':file.name,'Name':file.name,'path':'i/imagenotfound','type':file.type,'size':file.size,'lastModifiedData':file.lastModifiedData},
						translateOnly : true
						});
					$ele.addClass('anyuploadFileLineitem');
					}
				else	{
					//may not support this once deployed, but anycontent is not here for development testing.
				// Render thumbnail.
					var $ele = (fileType == 'image' ? $('<img>').css('display','block') : $('<span>')).addClass('fileUpload_default fileUpload_'+fileType);
					$ele.appendTo(self.element);
					}

				//The next line is very important. Both the 'data' and the class are used by _fileUpload to upload the file.
				$ele.data('file',file).addClass('newMediaFile');
				
//build the thumbnail.
				if(fileType == 'image')	{
					var $img = $ele.is('img') ? $ele : $('img',$ele);
					if($img.length)	{
						var reader = new FileReader();
						//the onload here is an async event and the 'filesChange' should not get executed till after the src is set.
						reader.onload = (function(aImg) { return function(e) {
							aImg.src = e.target.result;
						if(typeof self['options'].filesChange == 'function')	{
							self['options'].filesChange(event,files,{'container':self.element});
							}
							}; })($img[0]);
						reader.readAsDataURL(file);
						}
					else	{
						//filetype is image, but no image was found within the preview (could be an image was selected for a file based upload and no filter was enabled
						}
					}
				else	{
					if(typeof self['options'].filesChange == 'function')	{
						self['options'].filesChange(event,files,{'container':self.element});
						}

					}
				if(self.element.closest('.anyformEnabled').length)	{
					self.element.closest('.anyformEnabled').anyform('updateChangeCounts'); // updates the save button change count.
					}
				}
			},

		filesChangeEvent : function(event,self)	{
//			console.log(" --------> fileChangeEvent triggered");
			var files = event.target.files; // FileList object
			self._buildPreviews(files,event);
			if(self['options'].instantUpload)	{
				self._sendFiles();
				}
			},

		_setOption : function(option,value)	{
			$.Widget.prototype._setOption.apply( this, arguments ); //method already exists in widget factory, so call original.
			}, //_setOption
			
//start the upload process. Uses the previews that are added to the DOM. Keep all filtering of filetypes code in the preview builder.
		_sendFiles : function()	{
			var self = this;
//			dump("BEGIN anyfileupload._sendFiles.");
			if(typeof self['options'].ajaxRequest == 'function')	{
//				dump(" -> ajaxRequest is defined as a function");
				$(".newMediaFile",self.element).each(function(){
					self._fileUpload($(this), $(this).data('file'));
					});
				}
			else	{
				// !!! throw a warning here that no ajaxRequest function was defined.
				}
			},
			
// This is what prepares an individual file for upload and executes the user-defined ajax request.
		_fileUpload : function($ele, file)	{
			dump("BEGIN anyfileupload._fileUpload");

			var
				self = this,
				o = this.options,
				reader = new FileReader();

			//create an object.  pass that object into a user-defined 'ajaxRequest' function. {'filename':newFileName,'base64':btoa(evt.target.result)}. second param is this.element (which can be used to get folder or other vars)
			reader.onload = function(evt) {
				dump("reader.onload function has been triggered.");
				var filecontents;
				if(self['options'].encode == 'base64')	{
					filecontents = btoa(evt.target.result);
					}
				else	{
					filecontents = evt.target.result;
					}
					
				$ele.removeClass('newMediaFile').data('queued',true);
				self['options'].ajaxRequest($.extend(true,{
					'filename' : file.name,
					'filecontents' : filecontents
					},file),{'container' : self.element,'fileElement':$ele});
//				xhr.sendAsBinary(evt.target.result);
				};
			reader.readAsBinaryString(file);
			},

//executed when a file is dropped onto a dropzone.
		_drop : function(event)	{
			var self = this;
			dump(" -> a file has been dropped into a dropzone. instantUpload: "+self['options'].instantUpload);
			event.preventDefault();
			var dt = event.originalEvent.dataTransfer; //moz def. wants to look in orginalEvent. docs online looked just in event.dataTransfer.
			new self._buildPreviews(dt.files,event,self); // !!! revisit this. should pass in 'events' and 'ui' like other plugins. need to figure that out.
			if(typeof self['options'].filesChange == 'function')	{
				self['options'].filesChange(event,dt.files,{'container':self.element});
				}
			if(self['options'].instantUpload)	{
				self._sendFiles();
				}
			}, //_drop


		_destroy : function(){
			this.element.empty();
			} //_destroy
		}); // create the widget
})(jQuery); 






///// anydropzone \\\\\
/*
turn any element into a drop zone for files to be dragged from a users desktop onto the browser.

a lot of this code came from here:
https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications

!!!! THIS plugin should not be used. It's been replaced by anyfileupload.  It'll be removed entirely once the product editor is updated.

*/

(function($) {
	$.widget("ui.anydropzone",{
		options : {
			filetypes : null, //pass in an array of file types supported. ex ['csv','xls']
			imageAttributes : null, //an object: {h:100,w:100,b:'ffffff'}.
			folder : null, //folder in media library where images are placed.
			_preview : null, //used to store the preview.
//events
			drop : null, //a function executed when a file is dropped. executed for each file. file,event passed in.
			upload : null //a function executed after the upload has occured. executed for each file. file,event,responsedata passed in. executed whether response contains errors or not.
			},
		_init : function(){
//			dump('got to init');
			var
				$dropzone = this.element,
				anyfiledrop = this; //inside the event handlers below, 'this' loses context.
			
			if($dropzone.data('widget-anydropzone'))	{} //already an anydropzone
			else{
				$dropzone.data('widget-anydropzone',true);
				if(this['options'].status instanceof jQuery)	{
					dump(" -> status element IS defined.");
					}

				if(this['options'].thumbList instanceof jQuery)	{
					dump(" -> thumblist element IS defined.");
					}

				$dropzone.on("dragover dragenter", function(event) {
					event.stopPropagation();
					event.preventDefault();
					})

				$dropzone.on("drop",function(event){
					event.preventDefault();
					event.stopPropagation();
					anyfiledrop._drop(event);
					});
				}			

			}, //_init

		_setOption : function(option,value)	{
			$.Widget.prototype._setOption.apply( this, arguments ); //method already exists in widget factory, so call original.
			}, //_setOption

		_sendFiles : function()	{
			var imgs = document.querySelectorAll(".newMediaFile");
			for (var i = 0; i < imgs.length; i++) {
				this._fileUpload(imgs[i], imgs[i].file);
				}
			},

		_fileUpload : function(img, file)	{
			
			var extension = file.name.substr(file.name.lastIndexOf('.')); //need to put this back onto filename for upload.
			//strips the file extension off (otherwise it becomes part of the filename).
			var newFileName = file.name.substr(0, file.name.lastIndexOf('.')).replace(/[^A-Za-z0-9]+/ig, "_").toString().toLowerCase(); //alphanumeric only (this will include underscores). the +/ig will replace multiple spaces/specialcharacters in a row w/ 1 underscore.
			dump(" revised filename: "+newFileName);
			var o = this.options;
			var reader = new FileReader();  
			var folder = o.folder || newFileName.charAt(0);
			$(img).attr('data-filename',folder+'/'+newFileName); //used during the save.
			reader.onload = function(evt) {
				$._app.model.addDispatchToQ({
					'_cmd':'adminImageUpload',
					'base64' : btoa(evt.target.result), //btoa is binary to base64
					'folder' : folder,
					'filename' : newFileName+extension,
					'_tag':	{
						'callback' : function(rd){
//							if(typeof o.upload === 'function')	{
//								o.upload(file,event,rd);
//								}
							}
						}
					},'passive');
				$._app.model.dispatchThis('passive');
//				xhr.sendAsBinary(evt.target.result);
				};
			reader.readAsBinaryString(file);
			},

//executed when a file is dropped onto a dropzone.
		_drop : function(event)	{
			dump(" -> a file has been dropped into a dropzone.");
			event.preventDefault();
			var dt = event.originalEvent.dataTransfer; //moz def. wants to look in orginalEvent. docs online looked just in event.dataTransfer.
			if(typeof this['options'].drop === 'function')	{
				new this['options'].drop(dt.files,event,this); // !!! revisit this. should pass in 'events' and 'ui' like other plugins. need to figure that out.
				}
			this._sendFiles();
			}, //_drop


		_destroy : function(){
			this.element.empty();
			} //_destroy
		}); // create the widget
})(jQuery); 









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


/////  ANYTABLE  \\\\\



run $('#someTable').anytable() to have the headers become clickable for sorting by that column.
*/



// bulk of this code came from here:
// http://stackoverflow.com/questions/3160277/jquery-table-sort
(function($) {
	$.widget("ui.anytable",{
		options : {
			inverse : false,
			defaultSortColumn : undefined
			},
		_init : function(){

			var
				$table = this.element,
				o = this.options;			
			
			if($table.data('anytable'))	{} //already an anytable
			else{

			$table.attr('data-widget-anytable',true).data('anytable',true);
			this._styleHeader();
			
			
			$('th',$table).each(function(){

				var th = $(this),
				thIndex = th.index();
				
				// * 201318 -> support for data-anytable-nosort='true' which will disable sorting on the th.
				if(th.data('anytable-nosort'))	{} //sorting is disabled on this column. good for columns that only have buttons.
				else	{
					th.on('click.anytablesort',function(){
						dump("anytable click triggered");
						$table.find('td').filter(function(){
							return $(this).index() === thIndex;
							}).sortElements(function(a, b){
								var r;
								var numA = Number($.text([a]).replace(/[^\w\s]/gi, ''));
								var numB = Number($.text([b]).replace(/[^\w\s]/gi, ''));
								if(numA && numB)	{
					//				dump('is a number');
									r = numA > numB ? o.inverse ? -1 : 1 : o.inverse ? 1 : -1; //toLowerCase make the sort case-insensitive.
									}
								else	{
									r = $.text([a]).toLowerCase() > $.text([b]).toLowerCase() ? o.inverse ? -1 : 1 : o.inverse ? 1 : -1; //toLowerCase make the sort case-insensitive.
									}
								return r
								},function(){
							// parentNode is the element we want to move
							return this.parentNode; 
							});
						o.inverse = !o.inverse;
						});
					}

				}); //ends 'each'
				}
			
if(!isNaN(o.defaultSortColumn))	{
	dump(" -> $table.length: "+$table.length);
	dump(" -> th,$table.length: "+$('th',$table).length);
	dump("nthchild length: "+$("th:nth-child("+Number(o.defaultSortColumn)+")",$table).length);
	$("thead:first th:nth-child("+Number(o.defaultSortColumn)+")",$table).trigger('click.anytablesort');
	}			

			}, //_init

		_setOption : function(option,value)	{
			$.Widget.prototype._setOption.apply( this, arguments ); //method already exists in widget factory, so call original.
			}, //_setOption

		_styleHeader : function()	{
			var $table = this.element;
			$('th',$table).each(function(){
				var $th = $(this);

// * 201318 -> support for data-anytable-nosort='true' which will disable sorting on the th.
				$th.css({'borderLeft':'none','borderTop':'none','borderBottom':'none'})
				.addClass('ui-state-default')
				if($th.data('anytable-nosort'))	{} //sorting is disabled on this column. style accordingly.
				else	{
					$th
					.css('cursor','pointer')
					.on('click.anytablestyle',function(){
						$('th',$table).removeClass('ui-state-active');
						$th.addClass('ui-state-active')
						})
					.mouseover(function(){$th.addClass('ui-state-hover')})
					.mouseout(function(){$th.removeClass('ui-state-hover')}); // 
					}
				})

			},

		destroy : function(){
			this.destroySettingsMenu();
			this.element.empty().remove();
			}
		}); // create the widget
})(jQuery); 










/*


/////  ANYCB  \\\\\



run $(':checkbox').anycb() over a checkbox input type and it'll turn the cb into an ios-esque on/off switch.
The toggle is added before the cb on the dom. the cb is not inside the toggle so that the browser does not register a click on the toggle as on the cb (potentially causing a double-fire).
the cb itself is then hidden.
*/
(function($) {
	$.widget("ui.anycb",{
		options : {
			text : {
				on : 'on',
				off : 'off'
				}
			},
		_init : function(){
			var self = this,
			$cb = this.element,
			o = this.options;

			if($cb.data('anycb') === true)	{} //anycb already applied. do nothing.
			else if(!$cb.is(':checkbox'))	{dump("anycb was applied to a non-checkbox element.","warn");} //anycb applied to a non-checkbox element. do nothing but throw a warning to the console.
			else if(navigator.userAgent.toLowerCase().indexOf('msie') >= 0)	{} //ie not supported. didn't link binding. ## TODO -> Test this. may just need to bind toggle w/ a click event to trigger the cb.
			else	{
				$cb.data('anycb',true);
				
				var	
					$toggle = $("<span \/>").data('cbName',this.element.attr('name')),
					$toggleText = $("<span \/>").text(self['options'].text.off);
				
				this.toggle = $toggle; //add to global object so it can be reliably referenced. can't use this.element.closest because cb is not inside toggle.


				$toggle.addClass('ui-widget ui-widget-content ui-widget-anycb ui-corner-all ui-widget-header').css({'box-sizing':'border-box','position':'relative','display':'block','width':'55px','margin-right':'6px','height':'1.2em','z-index':1,'padding':0,'float':'left'}).css({'cursor':'pointer'})
				$toggleText.css({'box-sizing':'border-box','padding':'0px','width':'50%','text-align':'center','height':'1.3em','line-height':'1.3em','position':'absolute','top':-1,'z-index':2,'font-size':'.9em'}).addClass('anycbText ui-state-default');
				
//				$toggle.append("<span class='label anycb-label' style='display:block; height:24px; line-height:24px; float:left;'></span>");

				$toggle.append($toggleText);
				$cb.before($toggle);
				
				$toggle.on('click.anycb',function(event){
					event.preventDefault(); //prevents a double-execution if the toggleText is the target.
					//the click event is tracked on the span, not the cb. So if the cb is disabled, the span shouldn't trigger the click
					if($cb.prop('disabled') == 'disabled')	{
						self._handleDisable();
						}
					else	{
						//do NOT removeProp('checked').  chrome doesn't like it. once removed, could not re-apply 'checked'.
						$cb.is(':checked') ? $cb.prop('checked','') : $cb.prop('checked','checked');
						$cb.trigger('change');
						}
					});
				
				$cb.is(':checked') ? self._turnOn() : self._turnOff(); //set default
				self._handleDisable();
//the delegated events code will handle adding the edited class and updating the save button.
				$cb.hide().on('change.anycb',function(){
//					dump(" -> $cb change triggered. is(:checked):" + $cb.is(':checked'));
					$cb.is(':checked') ? self._turnOn() : self._turnOff();
					});
				}
			}, //_init
		_turnOn : function()	{
			this.toggle.find(".anycbText").text(this['options'].text.on).addClass('ui-state-highlight ui-corner-left').removeClass('ui-state-default ui-corner-right').animate({'left':-1},'fast');
			},
		_turnOff : function()	{
			this.toggle.find(".anycbText").text(this['options'].text.off).addClass('ui-state-default ui-corner-right').removeClass('ui-state-highlight ui-corner-left').animate({'left': (this.toggle.width() / 2)},'fast');
			},
		_handleDisable : function()	{
			this.toggle.css({'opacity': this.element.prop('disabled') ? '0.5' : 1}); // ### TODO -> test in IE and Chrome and make sure opacity takes.
			},
//can be run as selector.anycb('update') to programatically ensure state is correct. does NOT toggle the cb value.
//should be run if a cb is enabled or disabled.
		update : function()	{
			this._handleDisable();
			this.element.is(':checked') ? this._turnOn() : this._turnOff(); //set default
			},
		_setOption : function(option,value)	{
			$.Widget.prototype._setOption.apply( this, arguments ); //method already exists in widget factory, so call original.
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

!!! - the plugin should be updated to use anycontent for populating

*/
(function($) {
	$.widget("ui.anypanel",{
		options : {
			state : 'expand', //expand, collapse and persistent. are acceptable values. sets panel contents to opened or closed.
			templateID : null, //what any commerce template to use to populate the panel.
			data : null, //what data to use to translate the panel. do NOT default to an empty object or anycontent is run. if anycontent is needed and there's no data, pass data as {}
			dataAttribs : {}, //optional set of params to set as data on content. currently, only used if content is generated from templateID.
			_tag : {},
			dispatch : null, // a dispatch that'll be added directly to the Q. _tag will be added to it.
			showClose : true, //set to false to disable close (X) button.
			showLoading : true, //set to false to disable showLoading()
			content : null, //a jquery object of content to use.
			wholeHeaderToggle : true, //set to false if only the expand/collapse button should toggle panel (important if panel is draggable)
			header : null, //if set, will create an h2 around this and NOT use firstchild.
			extension : '', //used in conjunction w/ persist.
			name : '', //used in conjunction w/ persist.
			persistent : false, //if set to true and name AND extension set, will save to localStorage
			persistentStateDefault : 'expand',
			settingsMenu : {}
			},
		_init : function(){
			var
				self = this,
				o = self.options, //shortcut
				$t = self.element;
			
//			dump("BEGIN anypanel._init");
//			dump(" -> options: "); dump(o);
			if($t.data('isanypanel'))	{} //already a panel, skip all the styling and data.
			else	{
//isanypanel data is set to true as an easy check to
				$t.addClass('ui-widget ui-widget-anypanel marginBottom').data('isanypanel',true).css('position','relative');
				if(o.name)	{$t.addClass('panel_'+o.name)} 
				var $header, $content;
				
				if(o.header)	{$header = $("<h2 \/>").text(o.header); $header.appendTo($t)}
				else	{$header = $t.children(":first")}
				
				$header.css({'fontSize':'.85em','lineHeight':'2em','textIndent':'.75em','border':'none'});
				$header.wrap($("<div \/>").addClass('ui-widget-header ui-anypanel-header ui-corner-top ').css({'padding':'0px;','minHeight':'24px'}));

				if(o.wholeHeaderToggle)	{
					$header.addClass('pointer').off('click.toggle').on('click.toggle',function(){self.toggle()});
					}
				
				self._handleButtons($header);
			
				$content = self._anyContent();
				
//* 201320 -> if _anyContent returned false, this caused a js error.
				if($content && $content.length)	{$content.appendTo($t);} //content generated via template of some kind.
				else if(o.title)	{$content = $t.children(":first");} //no content yet, title specified. use first child.
				else	{$content = $t.children(":nth-child(2)");} //no content. first child is title. second child is content.
				
				$content.addClass('ui-widget-content ui-corner-bottom stdPadding ui-anypanel-content').css('borderTop','0'); //content area.

				//appevents should happen outside this so that any other manipulation can occur prior to running them.
				//and also so that in cases where the events are not desired, there's no problem (recycled templates, for example)
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
					$.extend(this['options'].menu,value); //add the new menu to the existing menu object. will overwrite if one already exists.
					this._destroySettingsMenu();
					this._buildSettingsMenu();
					break;
				
				default:
//					dump("Unrecognized option passed into anypanel via setOption");
//					dump(" -> option: "+option);
					break;
				}
			},
		_anyContent : function()	{
//			dump("BEGIN _anycontent");
			var 
				o = this.options,
				$content;

			if(o.content)	{
				$content = o.content;
				}
			else if(o.data || o.datapointer)	{
				this.element.anycontent(this.options);
				}
			else if(o.templateID)	{
				this.element.anycontent(this.options);
				}
			else	{
				
				}
			
			
			return $content;

			},

		_handleButtons : function($header)	{
			var
				self = this,
				$t = self.element,
				o = this.options,
				buttonStyles = {'float':'right','width':'20px','height':'20px','padding':0,'margin':'2px'}, //classes applied to each of the buttons.
				$buttonSet = $("<div \/>").addClass('floatRight').css({'position':'absolute','top':'2px','right':'2px'}).appendTo($header.parent()); 

//button to 'close' (removes from dom) the panel.			
			if(o.showClose)	{
				$buttonSet.append($("<button \/>").attr({'data-btn-action':'close','title':'close panel'}).addClass('ui-button-anypanel ui-button-anypanel-close').css(buttonStyles).button({icons : {primary : 'ui-icon-close'},'text':false}).on('click.panelClose',function(event){event.preventDefault(); self.destroy()})); //settings button
				}
//button to toggle (expand/collapse) the panel.
			$buttonSet.append($("<button \/>").attr({'data-btn-action':'toggle','title':'expand/collapse panel'}).addClass('ui-button-anypanel ui-button-anypanel-toggle').css(buttonStyles).button({icons : {primary : 'ui-icon-triangle-1-n'},'text':false}).on('click.panelViewState',function(event){event.preventDefault(); self.toggle()})); //settings button

//tools menu, which will be a wrench button with a dropdown of options.
			$buttonSet.append($("<button \/>").hide().attr('data-btn-action','settingsMenu').addClass('ui-button-anypanel ui-button-anypanel-settings').css(buttonStyles).text('Settings')
				.button({text: false,icons : {primary : 'ui-icon-wrench'}})
				.off('click.settingsMenu').on('click.settingsMenu',function(event){
					event.preventDefault();
					var $ul = $("[data-app-role='settingsMenu']",$t).toggle();

//this will make it so any click outsite the menu closes the menu. the one() means it only gets triggered once.
//it's inside the click handler, so it'll get added each time the settings are expanded.
					if($ul.is(":visible"))	{setTimeout(function(){$(document).one("click", function() {$ul.hide();});},1000);}
					
					})); //the settings button is always generated, but only toggled on when necessary.
			if(o.settingsMenu)	{self._buildSettingsMenu()}			

			},
// ** 201324 -> added means of setting a default for 'persistent' state so a panel could be closed if it has never been opened before.
		_handleInitialState : function()	{
			if(this['options'].state == 'persistent' && this['options'].name && this['options'].extension)	{
//				dump(" -> using persistent settings");
				var settings = $._app.model.dpsGet(this['options'].extension,'anypanel');
				if(settings && settings[this['options'].name])	{
					this['options'].state = settings[this['options'].name].state; //if not defined, default to expand.
					}
				else if(this['options'].persistentStateDefault == 'expand' || this['options'].persistentStateDefault == ' collapse') {
					this['options'].state = this['options'].persistentStateDefault;
					}
				else	{
					this['options'].state = 'expand';
					}
				}
//			dump("this['options'].state: "+this['options'].state);
			if(this['options'].state == 'collapse')	{ this.collapse();}
			else if (this['options'].state == 'expand')	{this.expand();}
			else	{
				console.warn("unknown state passed into anypanel");
				}
			},

		toggle : function(){
			if(this['options'].state == 'expand')	{this.collapse()}
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
				this['options'].state = 'collapse';
				this._handlePersistentStateUpdate('collapse');
				}
			},

		expand : function(){
			$("[data-btn-action='toggle']",this.element).button({icons : {primary : 'ui-icon-triangle-1-n'},'text':false});
			$('.ui-widget-content',this.element).slideDown();
			$('.ui-widget-header',this.element).removeClass('ui-corner-bottom');
			this['options'].state = 'expand';
			this._handlePersistentStateUpdate('expand');
			},

		_handlePersistentStateUpdate : function(value)	{
//			dump("BEGIN anypanel._handlePersistentStateUpdate");
			var r = false; //will return true if a persistent update occurs.
//			dump(" -> this['options'].persistent: "+this['options'].persistent);
//			dump(" -> value: "+value);
			if(this['options'].persistent && value)	{
				if(this['options'].extension && this['options'].name)	{
					var settings = {};
					settings[this['options'].name] = {'state':value};
					var newSettings = $.extend(true,$._app.model.dpsGet(this['options'].extension,'anypanel'),settings); //make sure panel object exits.
//					dump(' -> '+this['options'].extension);
//					dump(' -> newSettings:');	dump(newSettings);
					$._app.model.dpsSet(this['options'].extension,'anypanel',newSettings); //update the localStorage session var.
					r = true;
					}
				else	{
					dump("anypanel has persist enabled, but either name ["+this.name+"] or extension ["+this.extension+"] not declared. This is a non-critical error, but it means panel will not be persistent.",'warn');
					}
				}
			return r;
			},

		_destroySettingsMenu : function()	{
			$("[data-app-role='settingsMenu']",this.element).empty().remove();
			},

		_buildSettingsMenu : function()	{
			var $ul = $("<ul \/>").css({'width':'200px'}),
			sm = this['options'].settingsMenu;

			$ul.attr('data-app-role','settingsMenu').hide().css({'position':'absolute','right':0,'zIndex':10000});
			for(var index in sm)	{
				var $li = $("<li \/>");
				$li.addClass('ui-state-default').on('click.closeMenu',function(){
					$ul.hide(); //close the menu.
					}).hover(function(){$(this).addClass('ui-state-hover')},function(){$(this).removeClass('ui-state-hover')}).text(index).appendTo($ul);
				typeof sm[index] == 'function' ? $li.on('click',sm[index]) : $li.attr('data-app-click',sm[index]);
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








/*
// * 201318 -> new plugin: stickytabs
run this on an element already on the DOM that has content in it, such as a table.  
stickytabs will create a new container and, in an animated fashion, move the contents of the selector into the new container.
The new container will have a tab on it and, shortly after the contents are moved, will 'close' by collapsing the content offscreen so only the tab remains.
clicking the tab will toggle the tab contents into/out of view.
tab will be 'fixed' so it retains position during scrolling (for browsers that support fixed positioning)

supported methods include: open, close, toggle and destroy.
supported options include tabID (given to the container), tabtext (what appears in the tab itself) and tabclass (the class applied to the tab)

*/

(function($) {
	
	$.widget("ui.stickytab",{
		options : {
			tabID : '',
			anyform : false, //if enabled, will apply form delegation to table. Delegated events should be applied by the app.
			tabtext : 'unnamed tab', //a string for output. if set, will ignore any _msgs or _err orr @issues in the 'options' object (passed by a request response)
			tabclass : 'ui-state-default' //set to true to throw a generic message. Will include extra error details and a default message before the value of message.
			},

		_init : function(){
//			dump('init sticktab');
			var self = this,
			o = self.options, //shortcut
			$t = self.element, //this is the targeted element (ex: $('#bob').anymessage() then $t is bob)
			guid = $._app.u.guidGenerator()
			
			if($t.data('isstickytab'))	{
				//already in a stickytab. do nothing.
				}
			else	{
				$t.data('isstickytab',true);
//add an id if one doesn't already exist.
				if($t.attr('id'))	{}
				else	{
					$t.attr({'id':(o.tabID) ? 'stickycontents_'+o.tabID : 'stickycontents_'+guid}); //the ID goes onto the element this is run on.  allows for methods to easily be run later.
					}
				
				var 
					$tabContainer = this._handleContainer(),
					$sticky = this._buildSticky(),
					$stickytabText = $('.ui-widget-stickytab-tab-text',$sticky)
	
				this.sticky = $sticky; //global reference to container for easy access.
				if(o.anyform)	{
					$sticky.anyform();
					}
//* 202324  -> tabid wasn't getting applied to tab.
				$sticky.attr({'id':(o.tabID) ? o.tabID : 'stickytab_'+guid});
				$sticky.appendTo($tabContainer);
				this._moveAnimate();
	//			$('.ui-widget-stickytab-content',$sticky).append(this.element);
				
				//elements must be added to dom prior to obtaining width().
				//the width and height on the tab needs to be fixed based on text length so that rotation works properly.
				//only the text is rotated, not the container.
				$('.ui-widget-stickytab-tab',$sticky).height($stickytabText.width()).width(24).css('right',($stickytabText.parent().width() * -1));
	//rotate the tab text.
				$stickytabText.css({
					'-webkit-transform': 'rotate(90deg)', //chrome and safari
					'-moz-transform': 'rotate(90deg)', //firefox 3.5-15
					'-ms-transform': 'rotate(90deg)', //IE9
					'-o-transform':'rotate(90deg)', // Opera 10.50-12.00 
					'transform': 'rotate(90deg)', // Firefox 16+, IE 10+, Opera 12.10+
					'filter': 'progid:DXImageTransform.Microsoft.BasicImage(rotation=3)'	// IE 7 & 8
					});
	//shrinks tab after a moments time.  This provides a good visual indicator the tab was added but uses little real-estate.
				setTimeout(function(){
					self.close();
					},1500);
				
				}

			
			}, //_init

//if no sticktabs container exists, create one. if more control is desired over location, create a sticktabs element in your html and css to position as desired.
		_handleContainer : function()	{
//			dump('building container');
			var $container = $('#stickytabs');
			if($container.length)	{} //container is already defined. do nothing.
			else	{
				$container = $("<div \/>",{'id':'stickytabs'}).css({
					'position':'fixed',
					'left':0,
					'top':'120px',
					'width':'25px', // ** 201320 -> changed from 120 to 25 to solve a z-index issue. probably a typo to begin with.
					'height':'300px',
					'z-index':500
					}).appendTo('body');
				}
			return $container;
			},

//moves the contents into the tab content and animates it for an added visual indicator of what just happened.
		_moveAnimate : function(){
				var element = this.element; 
				var newParent= $('.ui-widget-stickytab-content',this.sticky);
				var oldOffset = element.offset();
				element.appendTo(newParent);
				var newOffset = element.offset();
		
				var temp = element.clone().appendTo('body');
				temp    .css('position', 'absolute')
						.css('left', oldOffset.left)
						.css('top', oldOffset.top)
						.css('zIndex', 1000);
				element.hide();
				temp.animate( {'top': newOffset.top, 'left':newOffset.left}, 'slow', function(){
				   element.show();
				   temp.remove();
				});
			},
//builds the tab and content container.
		_buildSticky : function()	{
//			dump('building sticktab');
			var 
				$sticky = $("<div \/>").css({'position':'relative'}).addClass('ui-widget ui-widget-stickytab'),
				$stickytab = $("<div \/>").addClass("ui-widget-stickytab-tab ui-corner-right "+this['options'].tabclass),
				$stickyContent = $("<div \/>").addClass("ui-widget-stickytab-content minimalMode detailMode ui-widget ui-widget-content ui-corner-right");

			this._addTabEvents($stickytab);
			$stickytab.append("<div class='ui-widget-stickytab-tab-text'>"+this['options'].tabtext+"</div>");
			$sticky.append($stickytab).append($stickyContent);
			return $sticky;
			},
		_addTabEvents : function($stickytab)	{
			var self = this;
			$stickytab.on('click.stickytab',function(){
//				dump(self.sticky.position().left);
				if(self.sticky.position().left >= 0)	{
					self.close();
					}
				else	{
					self.open();
					}
				});
			},
		toggle : function()	{
			$('.ui-widget-stickytab-tab',this.sticky).trigger('click.stickytab');
			},
		open : function()	{
//			dump('open tab');
			if(this.sticky.position().left != 0)	{
				this.sticky.animate({left: 0}, 'slow');
				}
			else	{} //already open.
			},
		close : function()	{
//			dump('close tab');
			this.sticky.animate({left: -(this.sticky.outerWidth())}, 'slow');
			},
		destroy : function()	{
			dump(" -> stickytab destroy called. this.sticky.id: "+this.sticky.attr('id'));
			this.sticky.empty().remove();
			},
		_setOption : function(option,value)	{
			$.Widget.prototype._setOption.apply( this, arguments ); //method already exists in widget factory, so call original.
			}
		}); // create the widget
})(jQuery);



$.fn.intervaledEmpty = function(interval, remove){
	interval = interval || 1000;
	if($(this).children().length > 0){
		var i = 0;
		$(this).children().each(function(){
			$(this).detach();
			setTimeout(function(){$(this).intervaledEmpty(interval, true);},interval*i);
			i++;
			});
		}
	else	{
// ** only remove in the last iteration, when there are no children, or this could still potentially lock up the browser.
		if(remove){
			$(this).remove();
			}
		}
	return this;
	}







/* will convert a tbody into a csv */
// for whatever reason, having this chuck of code not last is causing issues. leave it at bottom.
jQuery.fn.toCSV = function() {
	var data = $(this).first(); //Only one table
	var csvData = [];
	var tmpArr = [];
	var tmpStr = '';
	data.find("tr").each(function() {
	  if($(this).find("th").length) {
		  $(this).find("th").each(function() {
			tmpStr = ($(this).data('csvhead')) ? $(this).data('csvhead') : $(this).text(); //allow for a csv specific header to be set. if not, default to text
			tmpStr = tmpStr.replace(/"/g, '""');
			tmpArr.push('"' + tmpStr + '"');
		  });
		  csvData.push(tmpArr);
	  } else {
		  tmpArr = [];
			 $(this).find("td").each(function() {
				  if($(this).text().match(/^-{0,1}\d*\.{0,1}\d+$/)) {
					  tmpArr.push(parseFloat($(this).text()));
				  } else {
					  tmpStr = $(this).text().replace(/"/g, '""');
					  tmpArr.push('"' + tmpStr + '"');
				  }
			 });
		  csvData.push(tmpArr.join(','));
	  }
	});
	var output = csvData.join('\n');
	var uri = 'data:application/csv;charset=UTF-8,' + encodeURIComponent(output);
	window.open(uri);
	}



