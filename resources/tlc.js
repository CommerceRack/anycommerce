(function($) {
	$.widget("ui.tlc",{
		options : {
			templateid : null, //optional.  if set, the template will be appended to the target element.
//having any data is optional. A template ID only can be specified, thus allowing an instance to be added to the DOM w/ no interpolation.
			dataset : {}, //used to interpolate the template. can be passed in directly or can be set w/ datapointer/extendByDatapointers
			datapointer : null, //can be used to set data. ($._app.data[datapointer] )
			extendByDatapointers : new Array(), //an array of datapointers. will merge all the data into one object prior to translation
//if dataAttribs is set, these will be added to this.element as both s data- .  data- will be prepended if not already set.
			dataAttribs : null,
			verb : 'transmogrify' //acceptable values are transmogrify, translate or template (transmogrify requires template and does both apply template and translate).
			// for verb, may later offer a dwiw which tries to intelligently guess what to do. 
			},
		_init : function(){
			var o = this['options'];
			this.element.data('isTLC',true);  //a data tag to key off of so a destroy can be run, if need be.
			//one of these three must be set or running this doesn't really serve any purpose.
			if(o.templateid || o.dataset || o.datapointer || !$.isEmptyObject(o.extendByDatapointers))	{
				//first, resolve 'dataset' so that singular object can be used for any translations.
				if(o.datapointer)	{
					$.extend(o.dataset,$._app.data[o.datapointer]);
					}
				if(!$.isEmptyObject(o.extendByDatapointers))	{
					this._handleDatapointers();
					}
				if($._app.vars.debug == 'tlc')	{
					dump("BEGIN tlc _init. verb: "+o.verb); dump(o.dataset,'debug');
					}
				if(o.verb == 'transmogrify')	{
					var $instance = this.transmogrify();
					this._handleDataAttribs($instance);
					this.element.append($instance);		
					}
				else if(o.verb == 'translate')	{
//					dump(" -> o.dataset"); dump(o.dataset); dump(this.element.html(),'debug');
					var $instance = this.translate();
					this._handleDataAttribs($instance);
					}
				else if(o.verb == 'template')	{
					var $instance = this.template();
					this._handleDataAttribs($instance);
					this.element.append($instance);
					}
				else	{
					dump("in tlc() jquery function, an invalid verb ["+o.verb+"] was specified.","warn");
					}
				}
			else	{
				dump('In $.tlc, no templateid or data was supplied. tlc is not going to accomplish anything without either data or a template.','warn');
				}
			}, //_init

		_setOption : function(option,value)	{
			$.Widget.prototype._setOption.apply( this, arguments ); //method already exists in widget factory, so call original.
			}, //_setOption
		_handleDatapointers : function()	{
			var o = this['options'];
			//'data' could be a pointer, which we don't want to modify, so we extend a blank object and add data in the mix.
			//add all the datapointers into one object. 'may' run into issues here if keys are shared. shouldn't be too much of an issue in the admin interface.
			if(o.extendByDatapointers && o.extendByDatapointers.length)	{
//				dump(" -> datapointers have been extended for tlc");
				var L = o.extendByDatapointers.length;
				for(var i = 0; i < L; i += 1)	{
//					dump(" -> o.extendByDatapointers[i]: "+o.extendByDatapointers[i]); dump($._app.data[o.extendByDatapointers[i]]);
					
					if($._app.data[o.extendByDatapointers[i]])	{
						$.extend(true,this['options'].dataset,$._app.data[o.extendByDatapointers[i]]);
						}
					}
				}
//			dump(" -> this['options'].dataset: "); dump(this['options'].dataset);
			},
		_handleDataAttribs : function($tag)	{
			var o = this['options'];
	//		_app.u.dump(" -> eleAttr is NOT empty");
			if(!$.isEmptyObject(o.dataAttribs) && $tag instanceof jQuery)	{
				var tmp = {};
				for(var index in o.dataAttribs)	{
					if(typeof o.dataAttribs[index] == 'object')	{
						//can't output an object as a string. later, if/when data() is used, this may be supported.
						}
					else if(index.match("^[a-zA-Z0-9_\-]*$"))	{
						tmp[((index.indexOf('data-') === 0) ? '' : 'data-' + index).toLowerCase()] = o.dataAttribs[index]
						}
					else	{
						//can't have non-alphanumeric characters in 
						}
					}
				if(!$.isEmptyObject(tmp)){
	//				dump(" -> obj: "); dump(tmp);
					$tag.attr(tmp).data(o.dataAttribs);
					}

				}
			},
		template : function()	{
			return new tlc().getTemplateInstance(this['options'].templateid);
			},
		translate : function()	{
			if($._app.vars.debug == 'tlc')	{dump(" dataset for tlc: "); dump(this['options'].dataset);}
			return new tlc().translate(this.element,this['options'].dataset);
			},
		transmogrify : function()	{
			var self = this;
//the tlc core code and this plugin are intentionally independant. allows tlc to be run directly. ex: buildQueriesFromTemplate
			var instance = new tlc();
			var $tmp = instance.runTLC({
				templateid : self['options'].templateid,
				dataset : self['options'].dataset
				});
			return $tmp
			}
		
		});

	})(jQuery);



//creates an instance of the template, in memory.
//interpolates all data-tlc on that template.
//returns the template.
var tlc = function()	{
	
//used w/ peg parser for tlc errors.
	this.buildErrorMessage = function(e) {
//		dump(e);
		return e.line !== undefined && e.column !== undefined ? "Line " + e.line + ", column " + e.column + ": " + e.message : e.message;
		}

	this.createTemplate = function(templateid)	{
		if(templateid)	{
			var $tmp = $($._app.u.jqSelector('#',templateid));
			this.handleTemplates($tmp); //make sure no <template>'s are inside the template or they could get added to the DOM multiple times.
			return $tmp.length ? $._app.model.makeTemplate($tmp,templateid) : false;
			}
		else	{dump("Unable to execute maketemplate in tlc.createTemplate because no templateid was specified."); return false;}
		}
	
	this.getTemplateInstance = function(templateid)	{
		if($._app.vars.debug == 'tlc')	{
			dump(" -> tlc.getTemplateInstance was executed for templateid: "+templateid);
			}

		var r; //what is returned. either a jquery instance of the template OR false (invalid template)
		if(templateid && $._app.templates[templateid])	{
			r = $._app.templates[templateid].clone(true);
			}
		else if(this.createTemplate(templateid))	{ //createTemplate returns a boolean.
			r = $._app.templates[templateid].clone(true);
			}
		else	{r = false} //invalid template.
		this.element = r; //create a global reference to the element that's being translated. allows bind ~tag to be scoped.
		return r;
		}

//This is used for a '<template>' which is INSIDE of an element that is being translated.
	this.handleTemplates = function($target)	{
		$("template",$target).each(function(index){
			//for a <template>, the content makes up the template itself. adding <template> back onto the DOM wouldn't accomplish much.
			$._app.model.makeTemplate($(this).html(),$(this).attr('id'));
			});
		}

// ### FUTURE -> allows --datapointer='appProductDetail' to be set and this could be used to gather what datasets should be acquired.
// would return an object.
//	this.gatherDatapointers = function(){}'

	this.translate = function($ele,dataset)	{
//		dump(" -> dataset: "); dump(dataset);
		if($ele instanceof jQuery && dataset)	{
			var _self = this;
			this.handleTemplates($ele); //create any required templates that are in the html. (email uses this).
			$("[data-tlc]",$ele).addBack("[data-tlc]").each(function(index,value){ //addBack ensures the container element of the template parsed if it has a tlc.
				var $tag = $(this), tlc = $tag.data('tlc');
//			
			if($._app.vars.debug == 'tlc')	{
				dump("----------------> start new $tag. tlc: \n"+$(this).data('tlc')+" <-----------------");
				}
				var commands = {};
				try{
					//IE8 doesn't like .parse, wants 'parse'.
					commands = window.pegParser['parse'](tlc);
					
					}
				catch(e)	{
					dump("TLC error: "+_self.buildErrorMessage(e)+" for: "+tlc);
					}
	
				if(commands && !$.isEmptyObject(commands))	{
					var dataAfterTranslation = _self.executeCommands(commands,{
						tags : {
							'$tag' : $tag
							}, //an object of tags.
						focusTag : '$tag' //the pointer to the tag that is currently in focus.
						},dataset);
					if($._app.vars.debug == 'tlc')	{
						dump(" ------> this is what the dataset looks like at the very end <------ ");
						console.dir(dataAfterTranslation);
						}
					
					}
				else	{
					dump("couldn't parse a tlc: "+$tag.data('tlc'),'warn');
					//could not parse tlc. error already reported.
					}
				});
			}
		else	{
			dump(" -> Either $ele is not an instance of jquery ["+($ele instanceof jQuery)+"] or an empty dataset was passed into tlc.translate. dataset follows:"); dump(dataset);
			}

		}

//This is where the magic happens. Run this and the translated template will be returned.
// p.dataset is the data object. dataset was used instead of data to make it easier to search for.
// ### TODO -> once all the legacy transmogrify's are gone, change this command to transmogrify
	this.runTLC = function(P)	{
//		var startTime = new Date().getTime(); // dump("BEGIN runTLC: "+startTime); // ### TESTING -> this is not necessary for deployment.
		var $t = this.getTemplateInstance(P.templateid);
		if($t instanceof jQuery)	{
			this.translate($t,P.dataset);
			}
		else	{
			//invalid template
			}
//		dump("END runTLC: "+(new Date().getTime() - startTime)+" milliseconds"); //if you uncomment this, also uncomment the 'startTime' var near the top.
		return $t;
		} //runTLC

//used in 'apply' and possibly elsewhere. changes the args arrays into a single object for easy lookup.
	this.args2obj = function(args,globals)	{
//		dump("BEGIN tlc.args2obj"); // console.debug(args); 
		var r = {};
		if(!$.isEmptyObject(args))	{
			for(var i = 0, L = args.length; i < L; i += 1)	{
				var type = (args[i].type == 'longopt' && args[i].value) ? args[i].value.type : args[i].type;
//				dump(i+") type: "+type+" and key: "+args[i].key);
				if(type == 'tag')	{
					r.tag = args[i].value.tag;
					r[args[i].value.tag] = globals.tags[args[i].value.tag];
					}
				else if(args[i].value == null)	{r[args[i].key] = true} //some keys, like append or media, have no value and will be set to null.
				else if(type == 'variable')	{
					//this handles how most variables are passed in.
					if(args[i].key)	{
						r[args[i].key] = globals.binds[args[i].value.value];
						r.variable = (args[i].type == 'longopt' && args[i].value) ? args[i].value.value : args[i].value;
						}
					//this handles some special cases, like:  transmogrify $var --templateid='chkoutAddressBillTemplate';
					else if(typeof args[i].value == 'string')	{
						r.variable = args[i].value;
						r[args[i].value] = globals.binds[args[i].value];
						}
					else	{
						dump("in args2obj, type is set to variable, but no key is set AND the value is not a string.","warn");
						dump(args[i],"debug")
						//something unexpected happened.  no key. value is an object.
						}
					}
				
				else	{
					r[args[i].key] = args[i].value.value;
					}
//				r[args[i].key+"_type"] = (args[i].type == 'longopt') ? args[i].value.type : args[i].type;
				}
			}
		return r;
		}

	this.handleArg = function(arg,globals)	{
		var r = {}; //what is returned.
		var type = (arg.type == 'longopt' && arg.value) ? arg.value.type : arg.type;
		if(type == 'tag')	{
			r.tag = arg.value.tag;
			r[arg.value.tag] = globals.tags[arg.value.tag];
			}
		else if(arg.value == null)	{r[arg.key] = true} //some keys, like append or media, have no value and will be set to null.
		else if(type == 'variable')	{
			//this handles how most variables are passed in.
			if(arg.key)	{
				r[arg.key] = globals.binds[arg.value.value];
				r.variable = (arg.type == 'longopt' && arg.value) ? arg.value.value : arg.value;
				}
			//this handles some special cases, like:  transmogrify $var --templateid='chkoutAddressBillTemplate';
			else if(typeof arg.value == 'string')	{
				r.variable = arg.value;
				r[arg.value] = globals.binds[arg.value];
				}
			else	{
				dump("in handleArg, type is set to variable, but no key is set AND the value is not a string.","warn");
				dump(arg);
				//something unexpected happened.  no key. value is an object.
				}
			}
		
		else	{
			r[arg.key] = arg.value.value;
			}
		return r;
		}

//The vars object should match up to what the s are on the image tag. It means the object used to create this instance can also be passed directly into a .attr()
	this.makeImageURL	= function(vars)	{
		var r;
//		dump(" >>>>>>>>>>>> BEGIN tlc.makeImageURL");
		if(vars['data-media'])	{
			if(vars['data-bgcolor'] && vars['data-bgcolor'].charAt(0) == '#')	{vars['data-bgcolor'] = vars['data-bgcolor'].substr(1)}
			var url = '';
	//In an admin session, the config.js isn't loaded. The secure domain is set as a global var when a domain is selected or can be retrieved from adminDomainList
	//In an admin session, the config.js isn't loaded. The secure domain is set as a global var when a domain is selected or can be retrieved from adminDomainList
			if($._app.u.thisIsAnAdminSession())	{
				//this is for quickstart local testing.
				if(location.protocol === 'file:' && $._app.vars.domain)	{
					url = 'http:\/\/'+($._app.vars.domain);
					}
				else	{
					url = 'https:\/\/'+($._app.vars['media-host'] || $._app.data['adminDomainList']['media-host']);
					}
				//make sure domain ends in a /
				if(url.charAt(url.length) != '/')	{
					url+="\/"
					}
				url += "media\/img\/"+$._app.vars.username+"\/";
				}
			else	{
				url = (location.protocol === 'https:') ? zGlobals.appSettings.https_app_url : zGlobals.appSettings.http_app_url;
				url += "media\/img\/"+$._app.vars.username+"\/";
				}
			var sizing = (vars.width ? "-W"+vars.width : "")+(vars.height ? "-H"+vars.height : "")+(vars['data-bgcolor'] ? "-B"+vars['data-bgcolor'] : "")+(vars['data-minimal'] ? "-M" : "")+"/"+vars['data-media'];
			r = url+(sizing.substr(1)); //don't want the first character to be a -. all params are optional, stripping first char is the most efficient way to build the path.
			}
		else	{
			
			}
		return r
		}

/*
This should return an img tag OR the url, based on whether the formatter is img or imageurl
'media' -> generate a media library instance for the var passed.
'src' -> use the value passed (/some/image/path.jpg)
The tag passed in will either be focusTag OR the $tag passed in.
	-> here, the tag can be used for read only purposes. The 'verb' handles updating the tag.
if neither media or src, something is amiss.
This one block should get called for both img and imageurl but obviously, imageurl only returns the url.
*/
	this.apply_formatter_img = function(formatter,$tag,argObj,globals)	{
//		dump(" >>>>>>>>>>>> BEGIN tlc.apply_formatter_img");
		var r = true,filePath;
		argObj.media = argObj.media || {};
		var mediaParams;
		
		if(argObj.media)	{
			//build filepath for media lib
			if(argObj.imgdefault === true)	{} //use the tag in focus to build image attributes. ex:  --imgdefault
			else if(argObj.imgdefault)	{
				//tag value was passed. ex: --imgdefault=~someothertag
				if(globals.tags[argObj.imgdefault])	{
					$tag = globals.tags[argObj.imgdefault]
					}
				else	{
					//ie8 wants 'default', not .default.
					dump("Formatter img/imageurl specified "+argObj['default']+" as the tag src, but that tag has not been defined",'warn');
					}
				}
			else	{} //image attributes will be passed.
			//### TODO -> need support for 'alt' as a variable.
			//build the mediaParams from the arguments first.  THEN if imgdefault is set, override individually.
			mediaParams = {'width':argObj.width,'height':argObj.height,'data-bgcolor':argObj.bgcolor,'data-minimal':(argObj.minimal ? argObj.minimal : 0),'data-media':argObj.media};
			filePath = this.makeImageURL(mediaParams);

			//okay, now build the media params object.
			if(argObj.imgdefault)	{
				if($tag.is('img'))	{
					if($tag.attr('width'))	{mediaParams.width = $tag.attr('width')}
					if($tag.attr('height'))	{mediaParams.height = $tag.attr('height')}
					if($tag.attr('data-bgcolor'))	{mediaParams.bgcolor = $tag.attr('data-bgcolor')}
					if($tag.attr('data-minimal'))	{mediaParams.minimal = $tag.attr('data-minimal')}
					if($tag.attr('alt'))	{mediaParams.minimal = $tag.attr('alt')}
					filePath = this.makeImageURL(mediaParams);
					}
				else	{
					r = false;
					//the command to pull s from the tag is invalid because the tag isn't an image.
					}
				}
			else	{
				//defaults are already created. move along...
				}
			}
		else if(argObj.src && argObj.src.value)	{
			//do nothing here, but is valid (don't get into 'else' error handling).
			}
		else	{
			r = false;
			//either media or src left blank. OR media is tru and the var specified doesn't exist.
			dump("Something was missing for apply_img.\nif media.type == 'variable' then globals.binds[argObj.media.value] must be set.\nor src not specified on appy img OR media is set but globals.binds is not.");
			dump("globals: "); dump(globals);
			dump(" -> argObj: "); dump(argObj);
			}

		if(filePath && formatter == 'img')	{
			var $tmp = $("<div \/>").append($("<img \/>").attr(mediaParams).attr('src',filePath));
			r = $tmp.html();
			}
		else if(filePath)	{
			r = filePath;
			}
		else	{
			r = false;
			} //some error occured. should have already been written to console by now.

		return r;
		}
	
	this.apply_verb_select = function($tag,argObj,globals)	{
		var dataValue = argObj['select']; //shortcut.
//		dump(" -> value for --select: "+dataValue); dump(globals);
		if($tag.is(':checkbox'))	{
			if(dataValue == "" || Number(dataValue) === 0)	{
				$tag.prop({'checked':false,'defaultChecked':false}); //have to handle unchecking in case checked=checked when template created.
				}
			else	{
//the value here could be checked, on, 1 or some other string. if the value is set (and we won't get this far if it isn't), check the box.
				$tag.prop({'checked':true,'defaultChecked':true});
				}
			}
		else if($tag.is(':radio'))	{
//with radio's the value passed will only match one of the radios in that group, so compare the two and if a match, check it.
			if($tag.val() == dataValue)	{$tag.prop({'checked':true,'defaultChecked':true})}
			}
		else if($tag.is('select') && $tag.attr('multiple') == 'multiple')	{
			if(typeof dataValue === 'object')	{
				var L = dataValue.length;
				for(var i = 0; i < L; i += 1)	{
					$('option[value="' + dataValue[i] + '"]',$tag).prop({'selected':'selected','defaultSelected':true});
					}
				}
			}
		else	{
			$tag.val(dataValue);
			$tag.prop('defaultValue',dataValue); //allows for tracking the difference onblur.
			}
		}

	this.handle_apply_verb = function(verb,argObj,globals,cmd){
		// ### TODO -> need to update the verbs to support apply ~someothertag --dataset=$var --someVerb
		var $tag = globals.tags[globals.focusTag];
		var data = argObj.variable ? globals.binds[argObj.variable] : globals.binds[globals.focusBind];
		//if the booleans are not stringified, append/prepend won't output them.
		if(data === true || data === false)	{data = data.toString()}
		switch(verb)	{
//new Array('empty','hide','show','add','remove','prepend','append','replace','inputvalue','select','state','attrib'),
			case 'empty': $tag.empty(); break;
			case 'hide': $tag.hide(); break;
			case 'show': $tag.show(); break;

			//add and remove work w/ either 'tag' or 'class'.
			case 'add' : 
			//IE8 wants 'class' instead of .class.
				if(argObj['class'])	{$tag.addClass(argObj['class'])}
				else if(argObj.tag)	{
					// ### TODO -> not done yet. what to do? add a tag? what tag? where does it come from?
					}
				break; 
			case 'remove':
				if(argObj['class'])	{$tag.removeClass(argObj['class'])}
				else if(argObj.tag)	{
					$tag.remove();
//					globals.tags[argObj.tag].remove();
					}
				else	{
					dump("For apply, the verb was set to remove, but neither a tag or class were defined. argObj follows:",'warn'); dump(argObj);
					}
				break; 
			
			case 'prepend': $tag.prepend(data); break;
			case 'append': $tag.append(data); break;
			case 'replace': 
				var $n = $(data); //the contents of what will replace tag may or may not be a tag.
				if($n.length)	{
					globals.tags[globals.focusTag] = $n; $tag.replaceWith(globals.tags[globals.focusTag]);
					}
				else	{
					$tag.replaceWith(data);
					}
				break; //the object in memory must also be updated so that the rest of the tlc statement can modify it.
			case 'inputvalue':
				$tag.val(data);
				break;
			case 'select' :
				this.apply_verb_select($tag,argObj,globals); //will modify $tag.
				break;
			case 'state' :
				// ### TODO -> not done yet.
				break;  
			case 'attrib':
				$tag.attr(argObj.attrib,data);
				break;
			}
		}

	this.handle_apply_formatter = function(formatter,$tag,argObj,globals)	{
		switch(formatter)	{
/*			case 'text':
				console.log(" -> argObj: "); console.debug(argObj);
				if(globals.binds[argObj.text])	{
					var $tmp = $("<div>").append(globals.binds[argObj.text]);
					globals.binds[argObj.text] = $tmp.text();
					globals.focusBind = argObj.text;
					}
				else	{
					dump("For command "+cmd+" formatter set to text but scalar passed is not defined in globals.binds",'warn');
					}
				break;
			case 'html':
				globals.focusBind = argObj.html;
				break;
*/			case 'img':
				globals.binds[globals.focusBind] = this.apply_formatter_img(formatter,$tag,argObj,globals);
				break;
			case 'imageurl':
				globals.binds[globals.focusBind] = this.apply_formatter_img(formatter,$tag,argObj,globals); //function returns an image url
				break;
			}
		}

	this.comparison = function(op,p1,p2)	{
		var r = false;

		function isBlank(v)	{
			var isBlank = false;
			//not set and undefined are blank.  null or false is NOT blank.
			if(typeof v == 'undefined')	{isBlank = true;}
			else if(v == 'false' || v === false || v == null)	{isBlank = false}
			else if(v == '')	{isBlank = true;}
			else	{}
			return  isBlank;
			}

		switch(op)	{
			case "eq":
				if(p1 == p2){ r = true;} break;
			case "ne":
				if(p1 != p2){ r = true;} break;
			case "inteq":
				if(Number(p1) === Number(p2)){ r = true;} break;
			case "intne":
				if(Number(p1) != Number(p2)){ r = true;} break;
// for gt, gte, lt and lte, undefined == 0.
			case "gt":
				if(Number(p1 || 0) > Number(p2)){r = true;} break;
			case "gte":
				if(Number(p1 || 0) >= Number(p2)){r = true;} break;
			case "lt":
				if(Number(p1 || 0) < Number(p2)){r = true;} break;
			case "lte":
				if(Number(p1 || 0) <= Number(p2)){r = true;} break;
			case "true":
				if(p1){r = true}; break;
			case "false":
				if(p1 == false)	{r = true;} //non 'type' comparison in case the value 'false' is a string.
				else if(!p1){r = true}; break;
			case "blank":
				r = isBlank(p1);
				break;
			case "notblank":
				r = isBlank(p1) ? false : true; //return the opposite of blank.
				break;
			case "null":
				if(p1 == null){r = true;}; break;
			case "notnull":
				if(p1 != null){r = true;}; break;
			case "regex":
				var regex = new RegExp(p2);
				if(regex.exec(p1))	{r = true;}
				break;
			case 'templateidexists':
				r = (this.getTemplateInstance(p1)) ? true : false;
				break;
			case "notregex":
				var regex = new RegExp(p2);
				if(!regex.exec(p1))	{r = true;}
				break;
// and/or allow commands to be chained.
//--and (FUTURE) -> this is for chaining, so if and is present, 1 false = IsFalse.
//--or (FUTURE) -> this is for chaining, so if and is present, 1 true = IsTrue.
/*			case "and":
				if(p1 != null){r = true;}; break; // ### FUTURE -> not done
			case "or":
				if(p1 != null){r = true;}; break; // ### FUTURE -> not done.
*/			}
/*		if($._app.vars.debug == 'tlc')	{
			dump(" -> op: "+op+" and p1 = "+p1+" and p2 = "+p2+" and r = "+r);
			}
*/		return r;
		}



/* //////////////////////////////     FORMATS	 \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ */

//passing the command into this will verify that the format exists (whether it be core or not)

	this.format_currency = function(argObj,globals)	{
//		dump("BEGIN format_currency");
		var
			decimalPlace = 2,
			a = argObj.bind ? globals.binds[argObj.bind] : globals.binds[globals.focusBind];

		if(!isNaN(a))	{
			var isNegative = (a < 0) ? true : false;
			a = Number(a);
			a = isNegative ? (a * -1) : a;
			var 
				b = a.toFixed(decimalPlace),  //get 12345678.90
				r;
			a = parseInt(a); // get 12345678
			dump(" -> a: "+a);
			b = (b-a).toPrecision(decimalPlace); //get 0.90
			b = parseFloat(b).toFixed(decimalPlace); //in case we get 0.0, we pad it out to 0.00
			a = a.toLocaleString();//put in commas - IE also puts in .00, so we'll get 12,345,678.00
			//if IE (our number ends in .00)
			if(a.indexOf('.00') > 0)	{
				a=a.substr(0, a.length-3); //delete the .00
	//				_app.u.dump(" -> trimmed. a. a now = "+a);
				}
			r = a+b.substr(1);//remove the 0 from b, then return a + b = 12,345,678.90
	
	//if the character before the decimal is just a zero, remove it.
			if(r.split('.')[0] == 0){
				r = '.'+r.split('.')[1]
				}
			r = (isNegative ? '-' : '')+'$'+r;
			}
		else	{
			dump(" -> a ("+a+") is not a number!!!!!");
			r = a;
			}
		return r;
		} //currency

	this.format_prepend = function(argObj,globals,arg)	{
		var r = (arg.type == 'longopt' ? arg.value.value : arg.value)+globals.binds[argObj.bind];
		return r;
		} //prepend

	this.format_append = function(argObj,globals,arg)	{
		var r = globals.binds[argObj.bind]+(arg.type == 'longopt' ? arg.value.value : arg.value);
		return r;
		} //append

	this.format_lowercase = function(argObj,globals,arg)	{
		globals.binds[argObj.bind] = globals.binds[argObj.bind].toLowerCase();
		return globals.binds[argObj.bind];
		} //lowercase

	this.format_uppercase = function(argObj,globals,arg)	{
		globals.binds[argObj.bind] = globals.binds[argObj.bind].toUpperCase();
		return globals.binds[argObj.bind];
		} //lowercase

	this.format_default = function(argObj,globals,arg)	{
		var r = (arg.type == 'longopt' ? arg.value.value : arg.value);
		globals.binds[argObj.bind] = r;
		return r;
		} //append

	this.format_length = function(argObj,globals)	{
		var r;
		if(globals.binds[argObj.bind])	{r = globals.binds[argObj.bind].length;}
		else	{r = 0;}
		return r;
		} //length

	//will return the first X characters of a string where X = value passed in --chop
	this.format_chop = function(argObj,globals)	{
		var r = globals.binds[argObj.bind];
		if(globals.binds[argObj.bind] && Number(argObj.chop) && globals.binds[argObj.bind].length > argObj.chop)	{
			r = globals.binds[argObj.bind].toString();
			r = r.substr(Number(argObj.chop),r.length);
			}
		return r;
		}//chop
	
	this.format_truncate = function(argObj,globals)	{
		var
			r = globals.binds[argObj.bind].toString(), //what is returned. Either original value passed in or a truncated version of it.
			len = argObj.truncate;
		if(!len || isNaN(len)){}
		else if(r.length <= len){}
		else	{
			len = Number(len);
			if (r.length > len) {
				r = r.substring(0, len); //Truncate the content of the string
				var tr = $.trim(r.replace(/\w+$/, '')); //go back to the end of the previous word to ensure that we don't truncate in the middle of a word. trim trailing whitespace.
				//make sure that the trimmed response is not zero length. If it is, tr is ignored and the response 'may' be chopped in the middle of a word. better than a blank trim.
				if(tr.length)	{
					r = tr;
					}
//	201402 -> bad idea to have this.  what if we're truncating a number. use format append.
//				r += '&#8230;'; //Add an ellipses to the end
				}
			}
//		dump(" -> what truncate returns: "+r);
		return r;
		} //truncate

	this.format_uriencode = function(argObj,globals)	{
		var r = encodeURIComponent(globals.binds[argObj.bind]);
		return r;
		} //truncate


/* //////////////////////////////     SETs (these are formats permitted on a set command) 	 \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ */

	this.set_split = function(argObj,globals)	{
		var r;
		if(globals.binds[argObj.bind] && argObj['split'])	{
			r = globals.binds[argObj.bind].split(argObj['split']);
			}
		else	{
			r = globals.binds[argObj.bind];
			}
		return r;
		}

	this.set_path = function(argObj,globals,dataset)	{
		globals.binds[argObj.bind] = dataset[argObj.path];
		return globals.binds[argObj.bind]; //no manipulation of the data occured so return unmolested var. 
		}


//TLC/Render formats could be stores in 1 of a variety of places.  Either in extension.renderFormats, extension.tlcFormats, controller.tlcFormats, controller.renderFormats or within tlc itself (core).
//The function uses the tlc statement to determine where to get the formatting function from and then to execute that format.
// extension#format indicate the extension and function name.
// --legacy indicates it's a renderFormat. if legacy isn't set, it's a tlc format.
	this.format_from_module = function(cmd,globals,dataset)	{
//		dump(" -> non 'core' based format. not handled yet"); // dump(' -> cmd'); dump(cmd); dump(' -> globals'); dump(globals);
//		dump(" -> cmd.args: "); dump(cmd.args);
		var moduleFormats, argObj = this.args2obj(cmd.args,globals);
		var r = true; //what is returned. if false is returned, the rest of the statement is NOT executed.
// ### FUTURE -> once renderFormats are no longer supported, won't need argObj or the 'if' for legacy (tho it could be left to throw a warning)
		if(argObj.legacy)	{
			if(cmd.module == 'controller' && typeof $._app.renderFormats[cmd.name] == 'function')	{
				$._app.renderFormats[cmd.name](globals.tags[globals.focusTag],{'value': (globals.focusBind ? globals.binds[globals.focusBind] : dataset),'bindData':argObj});
				r = false; //when a renderFormat is executed, the rest of the statement is not run. renderFormats aren't designed to work with this and their predicability is unknown. so is their life expectancy.
				}
			else if($._app.ext[cmd.module] && $._app.ext[cmd.module].renderFormats && typeof $._app.ext[cmd.module].renderFormats[cmd.name] == 'function')	{
				$._app.ext[cmd.module].renderFormats[cmd.name](globals.tags[globals.focusTag],{'value': (globals.focusBind ? globals.binds[globals.focusBind] : dataset),'bindData':argObj})
				r = false; //when a renderFormat is executed, the rest of the statement is not run. renderFormats aren't designed to work with this and their predicability is unknown. so is their life expectancy.
				}
			else	{
				dump("A renderFormat was defined, but does not exist.  name: "+cmd.name+" in extension "+cmd.module,'warn')
				}
			}
		else	{
			if(cmd.module == 'controller')	{
				moduleFormats = $._app.tlcFormats
				}
			else if($._app.ext[cmd.module] && $._app.ext[cmd.module].tlcFormats)	{
				moduleFormats = $._app.ext[cmd.module].tlcFormats;
				}
			else	{}
	
			if(moduleFormats && typeof moduleFormats[cmd.name] === 'function')	{
				r = moduleFormats[cmd.name]({'command':cmd,'globals':globals,'value': (globals.focusBind ? globals.binds[globals.focusBind] : dataset)},this); // ### TODO -> discuss. this passes in entire data object if no bind is present.
				
				//tlcFormats do NOT kill the rest of the statement like legacy/renderformats do.
				}
			else if(moduleFormats)	{
				dump("A tlcFormat was defined, but does not exist.  name: "+cmd.name+" in extension "+cmd.module)
				}
			else	{
				dump("Could not ascertain module formats for the following command: ","error"); dump(cmd);
				}
			}
		return r;
		}



/* //////////////////////////////     TYPE HANDLERS		 \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ */

/*
There are a few 'types' that can be specified:
BIND (setting a var)
IF (conditional logic) 
Block (set for the statements inside an IF IsTrue or IsFalse). contains an array of statements.
command (everything else that's supported).
returning a 'false' here will exit the statement loop.
*/

	this.handleType_command = function(cmd,globals,dataset)	{
		var r = true;
//		dump(" -> cmd.name: "+cmd.name+" here are the globals: "); dump(globals);
		try{
			if(cmd.module == 'core' && typeof this['handleCommand_'+cmd.name] == 'function')	{
				this['handleCommand_'+cmd.name](cmd,globals);
				}
			else	{
				r = this.format_from_module(cmd,globals,dataset);
				}
			}
		catch(e){
			dump("An error occured when attempting to execute the command. command follows: ");
			dump(cmd);
			dump(e);
			r = false; //will stop processing of statement.
			}
		return r;
		}

	this.handleType_EXPORT = function(cmd,globals,dataset)	{
//		dump(" -> cmd: "); dump(cmd,'dir'); dump(dataset,'dir');
		var argObj = this.args2obj(cmd.args,globals);
//SANITY -> dataset is the name of the param passed in.
		dataset[cmd.Set.value] = argObj.dataset;
		}

	this.handleType_BIND = function(cmd,globals,dataset)	{
		// bind $var '#someSelector' returns Set.type == tag
		if(cmd.Set.type == 'tag')	{
			globals.tags[cmd.Set.tag] = $($._app.u.jqSelector(cmd.Src.value.charAt(0),cmd.Src.value.substr(1)),this.element);
			globals.focusTag = cmd.Set.tag;
			}
		else	{
			// bind $var ~tag; returns Src.type == tag.
			if(cmd.Src.type == 'tag')	{
				globals.binds[cmd.Set.value] = globals.tags[cmd.Src.tag];
				}
			else if(cmd.Src.value == '.')	{
				globals.binds[cmd.Set.value] = dataset; //this is effectively the old 'useParentData'
				}
			else	{
				//jsonpath nests returned values in an array.
				globals.binds[cmd.Set.value] = jsonPath(dataset, '$'+cmd.Src.value)[0];
				}
			globals.focusBind = cmd.Set.value; // dump(" -> globals.focusBind: "+globals.focusBind);
			if($._app.vars.debug == 'tlc')	{
				dump("Now we bind "+cmd.Src.value+' to binds['+cmd.Set.value+'] with value: '+jsonPath(dataset, '$'+cmd.Src.value)[0]); // dump(dataset);
//				console.log(" -> globals: "); console.debug(globals);
//				console.log(" -> cmd: "); console.debug(cmd);
				}
			}
		return cmd.Set.value;
		}

	this.handleType_FOREACH = function(cmd,globals,dataset)	{
		//tested on a tlc formatted as follows: bind $items '.@DOMAINS'; foreach $item in $items {{transmogrify --templateid='tlclisttest' --dataset=$item; apply --append;}};
		if($._app.vars.debug == 'tlc')	{
			dump(" -> into FOREACH. members: "); dump(cmd.Members,'debug');
			}
		var newGlobal;
		for(var index in globals.binds[cmd.Members.value])	{
//			var newGlobals = $.extend({},globals); //make a clean copy because focusBind here will probably be different than the rest of the tlc statement.
			globals.binds[cmd.Set.value] = globals.binds[cmd.Members.value][index];
			globals.focusBind = cmd.Set.value;
//			dump(" -> index: "+index); dump(newGlobals);
			this.executeCommands(cmd.Loop.statements,globals,globals.binds[cmd.Members.value][index]);
			}
		return cmd.Set.value;
		}

	this.handleType_SET = function(cmd,globals,dataset)	{
		// a set is essentially a copy.  so we set the new bind to the value.  Then, the args are processed which may impact the final value. 
		globals.binds[cmd.Set.value] = (cmd.Src.type == 'scalar') ? cmd.Src.value : globals.binds[cmd.Src.value]; //have to set this here so that the set_ functions have something to reference.
		globals.focusBind = cmd.Set.value;
		if(cmd.args)	{
			var argObj = this.args2obj(cmd.args,globals);
			argObj.bind = cmd.Set.value;
			for(var i = 0, L = cmd.args.length; i < L; i += 1)	{
				if(cmd.args[i].key && typeof this['set_'+cmd.args[i].key] == 'function')	{
					try	{
						globals.binds[cmd.Set.value] = this['set_'+cmd.args[i].key](argObj,globals,dataset);
						}
					catch(e)	{}
					}
				}
			}
		}

	this.handleType_IF = function(cmd,globals,dataset)	{
//		dump("BEGIN handleIF"); console.debug(globals);
		var p1; //first param for comparison.
		var args = cmd.When.args;
		var action = 'IsTrue'; //will be set to false on first false (which exits loop);
		//NOTE -> change '2' to args.length to support multiple args. ex: if (is $var --lt='100' --gt='5') {{ apply --append; }};

//SANITY -> in args, args[0] is the variable declaration (type/value).  args[1]+ is the comparison (key, type, value where key = comparison operand).

		if(args.length)	{
			if(args[0].type == 'variable')	{
//				dump(" -> args[0].value: "+args[0].value);
				p1 = globals.binds[args[0].value];
				}
			else	{
				dump("In tlc.handleType_IF, an unhandled type was set on the if",'warn');
				}
//			dump(" -> p1: "+p1);
			for(var i = 1, L = 2; i < L; i += 1)	{
				var p2;
				if(args[i])	{
					if(args[i].type == 'longopt')	{
						p2 = this.handleArg(args[i],globals)[args[i].key];
						}
					else {p2 = args[i].value || null}
					if(this.comparison(args[i].key,p1,p2))	{}
					else {
						action = 'IsFalse';
						break;
						}
					}
				}
//			dump(" -> action: "+action);
			if(cmd[action])	{
				this.executeCommands(cmd[action].statements,globals,dataset);
				}
			else	{} //would get here if NOT true, but no isFalse was set. I guess technically you could also get here if isTrue and no isTrue set.
			}
		return (action == 'isTrue' ? true : false);
		}


/* //////////////////////////////     COMMAND HANDLERS		 \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\ */

	this.handleCommand_format = function(cmd,globals)	{
		var r;
		var argObj = this.args2obj(cmd.args,globals);
		argObj.bind = (argObj.type) ? argObj.value : globals.focusBind; //what variable is being affected by the format.
		if(cmd.module == 'core')	{
			//sequence is important here, so args MUST be processed in order. can't loop thru argObj for this.
			for(var i = 0, L = cmd.args.length; i < L; i += 1)	{
				//key will be set for the args that are a format. there may be non 'key' args, such as putting a variable into scope.
				if(cmd.args[i].key && typeof this['format_'+cmd.args[i].key] == 'function')	{
					try	{
//						dump(" -> cmd.args[i].key: "+cmd.args[i].key); dump(cmd.args[i]);
						globals.binds[argObj.bind] = this['format_'+cmd.args[i].key](argObj,globals,cmd.args[i]);
						}
					catch(e)	{
						dump(e);
						}
					}
				}
			}
		else	{
			//currently, only core formats are supported.
			}
		return r;
		}

//passing the command into this will verify that the apply exists (whether it be core or not)
//may be able to merge this with the handleCommand_format. We'll see after the two are done and if the params passed into the functions are the same or no.
// NOTE -> stopped on 'apply' for now. B is going to change the way the grammer hands back the response. Once he does that, I'll need to flatten the array into a hash to easily test if 'empty' or some other verb is set.
	this.handleCommand_apply = function(cmd,globals)	{
//		dump(" -> BEGIN handleCommand_apply"); dump(cmd);
		var r = true;
		if(cmd.module == 'core')	{
			var
				verbs = new Array('empty','hide','show','add','remove','prepend','append','replace','inputvalue','select','state','attrib'),
				formatters = new Array('img','imageurl','text','html'),
				argObj = this.args2obj(cmd.args,globals), //an object is used to easily check if specific apply commands are present
				$tag = globals.tags[(argObj.tag || globals.focusTag)],
				numVerbs = 0, numFormatters = 0, theVerb = null, theFormatter = null;

			//count the number of verbs.  Only 1 is allowed.
			for(var index in argObj)	{
				if($.inArray(index,verbs) >= 0)	{
					theVerb = index;
					numVerbs++;
					}
				else if($.inArray(index,formatters) >= 0)	{
					theFormatter = index;
					numFormatters++;
					}
				else	{
					//okay to get here. likely just some argument for the verb or formatter
					}
				}
			
//			dump("numVerbs: "+numVerbs+" theVerb: "+theVerb+" theFormat: "+theFormatter+" numFormats: "+numFormatters);
			//formatter is optional, but only 1 can be specified.
			if(numVerbs === 1 && numFormatters <= 1)	{

				if(theFormatter)	{
//					dump(" -> a formatter ["+theFormatter+"] is set. process that first.");
					this.handle_apply_formatter(theFormatter,$tag,argObj,globals);
					}
				
				this.handle_apply_verb(theVerb,argObj,globals,cmd);

				}
			else if(numVerbs === 0)	{
				dump("For the following command no verb was specified on the apply. Exactly 1 verb must be specified.",'warn'); dump(cmd); dump(argObj);
				}
			else	{
				dump("For command (below) either more than 1 verb or more than 1 formatter was specified on the apply. Exactly 1 of each is allowed per command.",'warn');
				dump(cmd);
				}

			}
		else if(cmd.module && cmd.module.indexOf('#') >= 0)	{
			dump(" -> non 'core' based apply. not handled yet");
			//use format in extension.
			}
		else	{
			dump(" -> invalid core apply specified");
			r = false;
			//invalid format specified.
			}
		return r;
		}

	this.render_text = function(bind,argObj)	{
		return $('<div />').text(bind).html()
		}

	this.render_wiki = function(bind,argObj)	{
		var r = bind;
		//skip if bind has no value.
		if(bind)	{
			var $tmp = $('<div \/>'); // #### TODO -> cross browser test this wiki solution. it's a little different than before.
			myCreole['parse']($tmp[0], bind,{},argObj.wiki); //the creole parser doesn't like dealing w/ a jquery object.
			//r = wikify($tmp.text()); //###TODO -> 
			r = $tmp.html();
			$tmp.empty(); delete $tmp;
			}
		return r;
		}


	
	this.handleCommand_render = function(cmd,globals){
//		dump(">>>>> BEGIN tlc.handleCommand_render. cmd: ");// dump(cmd);
		for(var i = 0, L = cmd.args.length; i < L; i += 1)	{
			var argObj = this.handleArg(cmd.args[i],globals);
			var key = cmd.args[i].key;
			//if key is dwiw, needs to be changed to either html or text so that it can be properly displayed. this is guesswork, but that comes along with dwiw.
			if(key == 'dwiw' && globals.binds[globals.focusBind].indexOf('<') >= 0)	{
				key = 'html';
				}
			else if(key == 'dwiw')	{key = 'text';}
			else	{} //leave key alone.

			if(key == 'html')	{} //don't need to to anything special for html.
			else if(key == 'wiki')	{
				globals.binds[globals.focusBind] = this.render_wiki(globals.binds[globals.focusBind],argObj);
				}
			else	{
				globals.binds[globals.focusBind] = this.render_text(globals.binds[globals.focusBind],argObj);
				}
			}

		return globals.binds[globals.focusBind];
		}
		
	this.handleCommand_stringify = function(cmd,globals)	{
		globals.binds[globals.focusBind] = JSON.stringify(globals.binds[globals.focusBind])
		return globals.binds[globals.focusBind];
		}


// the proper syntax is as follows:   bind $var '.'; transmogrify --templateid='someTemplate' --dataset=$var;
	this.handleCommand_transmogrify = function(cmd,globals)	{
		var argObj = this.args2obj(cmd.args,globals);
		var tmp = new tlc();
		globals.tags[globals.focusTag].append(tmp.runTLC({templateid:argObj.templateid,dataset:argObj.dataset}));
		//this will backically instantate a new tlc (or whatever it's called)
		}

	this.handleCommand_is = function(cmd,globals)	{
		dump("BEGIN tlc.handlecommand_is");
		var value = globals.binds[globals.focusBind], r = false;
		for(var i = 0, L = cmd.args.length; i < L; i += 1)	{
			value = this.comparison(cmd.args[i].key,value,cmd.args[i].value.value);
			}
		globals.binds[globals.focusBind] = value;
		return value;
		}

	this.handleCommand_math = function(cmd,globals)	{
		var bind = Number(globals.binds[globals.focusBind]);
		if(!isNaN(bind))	{
			for(var i = 0, L = cmd.args.length; i < L; i += 1)	{
				//var value = Number((cmd.args[i].type == 'longopt' && cmd.args[i].value) ? cmd.args[i].value.value : cmd.args[i].value);
				var value = Number(this.handleArg(cmd.args[i],globals)[cmd.args[i].key]);
				if(!isNaN(value))	{
					switch(cmd.args[i].key)	{
						case "add":
							bind += value; break;
						case "sub":
							bind -= value; break;
						case "mult":
							bind *= value; break;
						case "div":
							bind /= value; break;
						case "precision":
							bind = bind.toFixed(value); break;
// percentage is not currently supported.
//						case "percent":
//							bind = (bind/100).toFixed(0); break;
						default:
							dump("Unsupported method for math: "+cmd.args[i].key,'warn')
						}
					}
				else	{
					dump(" -> handleCommand_math was run on a value ["+value+" which is not a number.");
					}
				}
			globals.binds[globals.focusBind] = bind;
			}
		else	{
			dump(" -> handleCommand_math was run on a bind ["+globals.binds[globals.focusBind]+" which is not a number.");
			}
		return bind;
		}

	this.handleCommand_datetime = function(cmd,globals)	{

		var value = globals.binds[globals.focusBind];
		if(value)	{
			var argObj = this.args2obj(cmd.args,globals), d = new Date(value*1000);
			if(isNaN(d.getMonth()+1))	{
				dump("In handleCommand_datetime, value ["+value+"] is not a valid time format for Date()",'warn');
				}
	//### FUTURE
	//		else if(argObj.out-strftime)	{}
			else if (argObj.out == 'pretty')	{
				var shortMon = new Array('Jan','Feb','Mar','Apr','May','June','July','Aug','Sep','Oct','Nov','Dec');
				value = (shortMon[d.getMonth()])+" "+d.getDate()+" "+d.getFullYear()+ " "+d.getHours()+":"+((d.getMinutes()<10?'0':'') + d.getMinutes());
				}
			else if(argObj.out == 'mdy')	{
				value = (d.getMonth()+1)+"/"+d.getDate()+"/"+d.getFullYear();
				}
			else	{
				//invalid or no 'out' specified.
				}
			globals.binds[globals.focusBind] = value;
			}
		return value;
		}


//can be triggered by runTLC OR by handleType_Block.
	this.executeCommands = function(commands,globals,dataset)	{
//		dump(" -> running tlcInstance.executeCommands"); //dump(commands);
		//make sure all the globals are defined. whatever is passed in will overwrite the defaults. that happens w/ transmogrify
		// NOTE -> if this extend is set to deep copy, any if statements w/ bind in them will stop working. that deep extend should be moved into translate, where execute is called.
		var globals = $.extend({
			binds : {}, //an object of all the binds set in args.
			tags : {
				'$tag' : ''
				}, //an object of tags.
			focusBind : '', //the pointer to binds of the var currently in focus.
			focusTag : '$tag' //the pointer to the tag that is currently in focus.
			},globals);

		for(var i = 0, L = commands.length; i < L; i += 1)	{
//			dump(i+") commands[i]: handleCommand_"+commands[i].type); //dump(commands[i]);
			if(commands[i].type == 'command')	{
				if(this.handleType_command(commands[i],globals,dataset))	{} //continue
				else	{
					if($._app.vars.debug == 'tlc')	{
						dump(" -> early exit of statement loop caused on cmd: "+commands[i].name+" (normal if this was legacy/renderFormat)");
						}
					//handleCommand returned a false. That means either an error occured OR this executed a renderFormat. stop processing.
					break;
					}
				}
			else if(typeof this['handleType_'+commands[i].type] === 'function')	{
				this['handleType_'+commands[i].type](commands[i],globals,dataset);
				}
			else	{
				//unrecognized type.
				dump("There was an unrecognized command type specified in a tlc statement. type: "+commands[i].type+". cmd follows:","warn");
				dump(commands);
				}
			}
		return globals;
		}
	
//This is intendted to be run on a template BEFORE the data is in memory. Allows for gathering what data will be necessary.
	this.getBinds = function(templateid)	{
		var _self = this; //'this' context is lost within each loop.
		var $t = _self.getTemplateInstance(templateid), bindArr = new Array();

		$("[data-tlc]",$t).addBack("[data-tlc]").each(function(index,value){ //addBack ensures the container element of the template parsed if it has a tlc.
			var $tag = $(this), tlc = $tag.data('tlc');

			var commands = {};
			try{
				commands = window.pegParser['parse'](tlc);
				}
			catch(e)	{
				dump(_self.buildErrorMessage(e)); dump(tlc,'debug');
				}
			if(commands && !$.isEmptyObject(commands))	{
				var L = commands.length;
				for(var i = 0; i < L; i += 1)	{
					if(commands[i].type == 'BIND' && commands[i].Src.type == 'scalar' && $.inArray(commands[i].Src.value,bindArr) < 0 )	{
						bindArr.push(commands[i].Src.value.substr(1)); //for what this is used for, the preceeding period is not desired.
						}
					}
				}
			else	{
				dump("couldn't parse a tlc: "+$tag.data('tlc'),'warn');
				//could not parse tlc. error already reported.
				}
			});
		return bindArr;
		} //end getBinds

	} //end