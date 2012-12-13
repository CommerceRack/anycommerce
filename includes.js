//this file merges three formerly separate files: variations.js, json2.js and wiki.js



/*
############################################################




variations.js



############################################################

*/


/* **************************************************************

   Copyright 2011 Zoovy, Inc.

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

/*
This is somewhat legacy stuff here, adopted to work within the new framework.
it is not an extension for this reason.
at some point in the future, it should to be.
*/

handlePogs = function(v,o) {
	this.initialize(v,o);
	return true; //return something. mostly just to appease the console warning.
	}


jQuery.extend(handlePogs.prototype, {
// object variables
//	pogsJSON : handlePogs, //not sure what this is. appears we may not need it.

initialize: function(pogs,o) {
	this.pogs = pogs;
	this.invCheck = o.invCheck ? o.invCheck : false; //set to true and a simple inventory check occurs on add to cart.
	this.imgClassName = o.imgClassName ? o.imgClassName : 'sogImage'; //allows a css class to be set on images (for things like magicZoom)
	this.sku = o.sku; //
//	app.u.dump('inventory check = '+this.invCheck+' and className = '+this.imgClassName);

	this.handlers = {};
	this.addHandler("type","text","renderOptionTEXT");
	this.addHandler("type","radio","renderOptionRADIO");
	this.addHandler("type","select","renderOptionSELECT");
	this.addHandler("type","imgselect","renderOptionIMGSELECT");
	this.addHandler("type","number","renderOptionNUMBER");
	this.addHandler("type","cb","renderOptionCB");
	this.addHandler("type","attribs","renderOptionATTRIBS");
	this.addHandler("type","readonly","renderOptionREADONLY");
	this.addHandler("type","hidden","renderOptionHIDDEN");
	this.addHandler("type","assembly","renderOptionHIDDEN");
	this.addHandler("type","textarea","renderOptionTEXTAREA");
	this.addHandler("type","imggrid","renderOptionIMGGRID");
	this.addHandler("type","calendar","renderOptionCALENDAR");
	this.addHandler("type","biglist","renderOptionBIGLIST");
	this.addHandler("unknown","","renderOptionUNKNOWN");
	return true; //return something. mostly just to appease the console warning.
	},

addHandler: function(key,value,f) {
// adds a new entry to the this.handlers e.g.: this.handlers.renderOptionTEXT
	this.handlers[ key+"." + value ] = f;
	return true; //return something. mostly just to appease the console warning.
	},


listOptionIDs: function() {
// return an array of option id's
	var r = Array();
	for ( var i=0, len=this.pogs.length; i<len; ++i )	{
		r.push(this.pogs[i].id);
		}
	return(r);
	},

getOptionByID: function(id) {
// returns the structure of a specific option group.
	var r = null;
	for ( var i=0, len=this.pogs.length; i<len; ++i )	{
		if (this.pogs[i].id == id) {
			r = this.pogs[i];
			}
		}
	return(r);
	},

////////////////////////////      DEFAULT HANDLERS       \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

//upgraded to jquery.
renderOptionSELECT: function(pog,safeid) {
//	app.u.dump('BEGIN renderOptionSELECT for pog '+pog.id+' and safe id = '+safeid);
	var pogid = pog.id;
	var $parentDiv = $("<span \/>");
	var $selectList = $("<select>").attr({"id":"pog_"+safeid,"name":"pog_"+pogid}).addClass('zform_select');
    var i = 0;
    var len = pog.options.length;

	var selOption; //used to hold each option added to the select
	var optionTxt;

//if the option is 'optional' AND has more than one option, add blank prompt. If required, add a please choose prompt first.
	if(len > 0)	{
		optionTxt = (pog['optional'] == 1) ?  "" :  "Please choose (required)";
		selOption = "<option value='' disable='disabled' selected='selected'>"+optionTxt+"<\/option>";
		$selectList.append(selOption);
		}
//adds options to the select list.
    while (i < len) {
		optionTxt = pog['options'][i]['prompt'];
		if(pog['options'][i]['p'])
			optionTxt += pogs.handlePogPrice(pog['options'][i]['p']); //' '+pog['options'][i]['p'][0]+'$'+pog['options'][i]['p'].substr(1);
		selOption = "<option value='"+pog['options'][i]['v']+"' id='option_"+pogid+""+pog['options'][i]['v']+"'>"+optionTxt+"<\/option>";
		$selectList.append(selOption);
		i++;
		}

//	app.u.dump(" -> pogid: "+pogid);
//	app.u.dump(" -> pog hint: "+pog['ghint']);
	$selectList.appendTo($parentDiv);
	if(pog['ghint']) {$parentDiv.append(pogs.showHintIcon(pogid,pog['ghint']))}
	return $parentDiv;
	},

// timer permitting, rewrite this. create an object for each optgroup and use that objects id to save options into.
// during each loop, add the optgroup id to a separate array and at the end, use that array to add each optgroup to selectlist. 
// may be a bit faster than this. cleaner too.
renderOptionBIGLIST: function(pog,safeid) {

	var pogid = pog.id;
	var selOptions = '';
	var lastOptGrp,selValues;
	var inc = 0;
    var len = pog.options.length;
	var $parentDiv = $("<span \/>");
	var $selectList = $("<select \/>").attr({"id":"pog_"+safeid,"name":"pog_"+pogid}).addClass("zform_select zform_biglist");
//sets the first options on both select lists.
	$selectList.append("<option value='' disable='disabled' selected='selected'>Please Choose...<\/option>");

	//output ? with hint in hidden div IF ghint is set
//	if(pog['ghint'])
//		pogs.showHintIcon(pogid,pog['ghint']);

/*
create first optgroup.
These are here instead of in the while loop to save a lookup during each iteration. Otherwise we need to 
check if at iteration 1 (inc = 0) each time in the loop. this is gives us a tighter loop.
*/
	selValues = pog['options'][inc]['prompt'].split('|');
	lastOptGrp = selValues[0];
	selOptions += "<optgroup label='"+selValues[0]+"'>"; //add option to first dropdown list.
	while (inc < len) {

//selValues[0] = first dropdown prompt/opt group.
//selValues[1] = second dropdown prompt.
		selValues = pog['options'][inc]['prompt'].split('|');
		optGrp = selValues[0];

//at each 'change' of grouping, add the current group to the select list.
		if(optGrp != lastOptGrp)	{
			selOptions += "<\/optgroup><optgroup label='"+selValues[0]+"'>"; //add option to first dropdown list.
			}
		
		selOptions += "<option value='"+pog['options'][inc]['v']+"'>"+selValues[1]+"<\/option>\n";
		lastOptGrp = selValues[0]
		inc += 1;
		}
	selOptions += "<\/optgroup>";
	
//	app.u.dump(selOptions);
	
	$selectList.append(selOptions).appendTo($parentDiv); //append optgroups.
	
	if(pog['ghint']) {$parentDiv.append(pogs.showHintIcon(pogid,pog['ghint']))}
	return $parentDiv;
	
	}, //renderOptionBIGLIST



//upgraded to jquery.
renderOptionIMGSELECT: function(pog,safeid) {
//	app.u.dump('BEGIN renderOptionIMGSELECT for pog '+pog.id);
	var pogid = pog.id;
	var $parentDiv = $("<span \/>"); // = $("#div_"+safeid);
	var $selectList = $("<select>").attr({"id":"pog_"+safeid,"name":"pog_"+pogid}).addClass('zform_select').bind('change', function(e){
		var thumbnail = $("#pog_"+safeid+" option:selected").attr('data-thumbnail');
		$("#selectImg_"+safeid).attr('src',app.u.makeImage({"w":pog.width,"h":pog.height,"name":thumbnail,"b":"FFFFFF","tag":false,"lib":app.username,"id":"selectImg_"+safeid}));
		});
    var i = 0;
    var len = pog.options.length;

	var selOption; //used to hold each option added to the select
	var optionTxt;

//if the option is 'optional' AND has more than one option, add blank prompt. If required, add a please choose prompt first.
	if(len > 0)	{
		optionTxt = (pog['optional'] == 1) ?  "" :  "Please choose (required)";
		selOption = "<option value='' disabled='disabled' selected='selected'>"+optionTxt+"<\/option>";
		$selectList.append(selOption);
		}
//adds options to the select list.
    while (i < len) {
		optionTxt = pog['options'][i]['prompt'];
		if(pog['options'][i]['p'])
			optionTxt += pogs.handlePogPrice(pog['options'][i]['p']); //' '+pog['options'][i]['p'][0]+'$'+pog['options'][i]['p'].substr(1);
		selOption = "<option value='"+pog['options'][i]['v']+"' data-thumbnail='"+pog['options'][i]['img']+"' id='option_"+pogid+""+pog['options'][i]['v']+"'>"+optionTxt+"<\/option>";
		$selectList.append(selOption);
		i++;
		}

	$selectList.appendTo($parentDiv);

	if(pog['ghint']) {$parentDiv.append(pogs.showHintIcon(pogid,pog['ghint']))}

	$imageDiv = $('<div>').attr({"id":"imgSelect_"+safeid+"_img"}).addClass('imageselect_image');
	$imageDiv.html(app.u.makeImage({"w":pog.width,"h":pog.height,"name":"blank.gif","b":"FFFFFF","tag":true,"lib":app.username,"id":"selectImg_"+pogid}));
	$imageDiv.appendTo($parentDiv);
	app.u.dump('END renderOptionIMGSELECT for pog '+pog.id);
	return $parentDiv;
	},

//upgraded to jquery. needs css love.
renderOptionRADIO: function(pog,safeid)	{
	var pogid = pog.id;

	var $parentDiv = $("<span \/>"); // = $('#div_'+safeid);
	
//display ? with hint in hidden div IF ghint is set
	if(pog['ghint']) {$parentDiv.append(pogs.showHintIcon(pogid,pog['ghint']))}
	
	var $radioInput; //used to create the radio button element.
	var radioLabel; //used to create the radio button label.
    var i = 0;
    var len = pog['options'].length;
	while (i < len) {
		radioLabel = "<label for='pog_id_"+safeid+"_value_"+pog['options'][i]['v']+"'>"+pog['options'][i]['prompt']+"<\/label>";
		$radioInput = $('<input>').attr({type: "radio", name: "pog_"+pogid, value: pog['options'][i]['v'], id: "pog_id_"+safeid+"_value_"+pog['options'][i]['v']});
		$parentDiv.append($radioInput).append(radioLabel);
		i++
		}
	return $parentDiv;
	},


//upgraded to jquery.
renderOptionCB: function(pog,safeid) {
	var pogid = pog.id;
	var $parentDiv = $("<span \/>"); // = $('#div_'+safeid);
	var $checkbox = $('<input>').attr({type: "checkbox", name: "pog_"+pogid, value: 'ON', id: "pog_"+safeid});
//Creates the 'hidden input' form field in the DOM which is used to let the cart know that the checkbox element was present and it's absense in the form post means it wasn't checked.		
	var $hidden = $('<input>').attr({type: "hidden", name: "pog_"+pogid+"_cb", value: '1', id: "pog_"+safeid});
	$parentDiv.append($checkbox).append($hidden);
	if(pog['ghint']) {$parentDiv.append(pogs.showHintIcon(pogid,pog['ghint']))}
	return $parentDiv;

	},



//upgraded to jquery.
renderOptionHIDDEN: function(pog,safeid) {
	var pogid = pog.id;
//hidden attributes don't need a label. !!!
//	document.getElementById("pog_"+safeid+"_id").style.display = 'none';
//cant set the value to null in IE because it will literally write out 'undefined'. this statement should handle undefined, defined and blank just fine.
	var defaultValue = app.u.isSet(pog['default']) ?  pog['default'] : "";
	var $parentDiv = $("<span \/>"); // = $('#div_'+safeid);
//Creates the 'hidden input' form field in the DOM which is used to let the cart know that the checkbox element was present and it's absense in the form post means it wasn't checked.		
	var $hidden = $('<input>').attr({type: "hidden", name: "pog_"+pogid, value: defaultValue, id: "pog_"+safeid});
	$parentDiv.append($hidden);
	
	return $parentDiv;
	},


//upgraded to jquery.
renderOptionATTRIBS: function(pog,safeid)	{
//attributes are used with finders. They don't do anything and they don't require a form element in the add to cart.. BUT we may want to do something merchant specific, so here it is.... to overide...
//	document.getElementById("div_"+safeid).style.display = 'none'; !!!
	
	},



//upgraded to jquery.
renderOptionTEXT: function(pog,safeid) {
	var pogid = pog.id;
//cant set the value to null in IE because it will literally write out 'undefined'. this statement should handle undefined, defined and blank just fine.
	var defaultValue = app.u.isSet(pog['default']) ?  pog['default'] : "";
	var $parentDiv = $("<span \/>"); // = $('#div_'+safeid);
//Creates the 'hidden input' form field in the DOM which is used to let the cart know that the checkbox element was present and it's absense in the form post means it wasn't checked.		
	var $textbox = $('<input>').attr({type: "text", name: "pog_"+pogid, value: defaultValue, id: "pog_"+safeid}).addClass('zform_textbox')
	if(pog['maxlength'])	{
		$textbox.keyup(function(){
			if (this.value.length > (pog['maxlength'] - 1)) // if too long...trim it!
		        this.value = this.value.substring(0, pog['maxlength']);
			});
		}
	$parentDiv.append($textbox);
	if(pog['ghint']) {$parentDiv.append(pogs.showHintIcon(pogid,pog['ghint']))}
	return $parentDiv;
	},




//upgraded to jquery.
renderOptionCALENDAR: function(pog,safeid) {
	var pogid = pog.id;
	
	var defaultValue = app.u.isSet(pog['default']) ?  pog['default'] : "";
	
	var $parentDiv = $("<span \/>"); // = $('#div_'+safeid);
	var $textbox = $('<input>').attr({type: "text", name: "pog_"+pogid, value: defaultValue, id: "pog_"+safeid}).addClass('zform_textbox').datepicker({altFormat: "DD, d MM, yy"});
	$parentDiv.append($textbox);

	if(pog['ghint']) {$parentDiv.append(pogs.showHintIcon(pogid,pog['ghint']))}

//if the rush prompt is set, display it under the form.
	if(pog.rush_prompt)	{
		$parentDiv.append("<div class='zhint' id='rush_prompt_"+safeid+">"+pog['rush_prompt']+"<\/div>");
		}
	
	return $parentDiv;
	},






renderOptionNUMBER: function(pog,safeid) {
	var pogid = pog.id;
//cant set the value to null in IE because it will literally write out 'undefined'. this statement should handle undefined, defined and blank just fine.
	var defaultValue = app.u.isSet(pog['default']) ?  pog['default'] : "";
	var $parentDiv = $("<span \/>"); // = $('#div_'+safeid);
//right now, 'number' isn't widely supported, so a JS regex is added to strip non numeric characters
	var $textbox = $('<input>').attr({type: "number", name: "pog_"+pogid, value: defaultValue, id: "pog_"+safeid}).addClass('zform_textbox').keyup(function(){
		this.value = this.value.replace(/[^0-9]/g, '');
		});

	if(pog['max'])
		$textbox.attr('max',pog['max']);
	if(pog['min'])
		$textbox.attr('max',pog['max']);
		
	$parentDiv.append($textbox);
	if(pog['ghint']) {$parentDiv.append(pogs.showHintIcon(pogid,pog['ghint']))}
	return $parentDiv;

	},





renderOptionTEXTAREA: function(pog,safeid) {
	var pogid = pog.id;
//cant set the value to null in IE because it will literally write out 'undefined'. this statement should handle undefined, defined and blank just fine.
	var defaultValue = app.u.isSet(pog['default']) ?  pog['default'] : "";
	var $parentDiv = $("<span \/>");// = $('#div_'+safeid);
//Creates the 'hidden input' form field in the DOM which is used to let the cart know that the checkbox element was present and it's absense in the form post means it wasn't checked.		
	var $textbox = $('<textarea>').attr({name: "pog_"+pogid, value: defaultValue, id: "pog_"+safeid}).addClass('zform_textarea');
	$parentDiv.append($textbox);
	if(pog['ghint']) {$parentDiv.append(pogs.showHintIcon(pogid,pog['ghint']))}
	return $parentDiv;

	},




//needs testing.
renderOptionREADONLY: function(pog,safeid) {
	return $("<span class='zsmall'>"+pog['default']+"<\/span>");
	},



//create an override for IMGGRID to be used for webapp. no radio button, just thumbnails that, on click, will set a hidden input. !!!!!!!!!!!!!
//also explore frameworks (jqueryui or jquerymobile ?) for better handling of form display.

renderOptionIMGGRID: function(pog,safeid)	{

	var pogid = pog.id;

	var $parentDiv = $("<span \/>"); // = $('#div_'+safeid);
	if(pog['ghint']) {$parentDiv.append(pogs.showHintIcon(pogid,pog['ghint']))}
	
	var $radioInput; //used to create the radio button element.
	var radioLabel; //used to create the radio button label.
	var thumbnail; //guess what this holds
    var i = 0;
    var len = pog['options'].length;
	while (i < len) {
		thumbnail = app.u.makeImage({"w":pog.width,"h":pog.height,"name":pog['options'][i]['img'],"b":"FFFFFF","tag":true,"lib":app.username,"id":"selectImg_"+safeid});
		radioLabel = "<label for='pog_id_"+safeid+"_value_"+pog['options'][i]['v']+"'>"+pog['options'][i]['prompt']+"<\/label>";
		$radioInput = $('<input>').attr({type: "radio", name: "pog_"+pogid, value: pog['options'][i]['v'], id: "pog_id_"+safeid+"_value_"+pog['options'][i]['v']});
		$parentDiv.append(thumbnail).append($radioInput).append(radioLabel).wrap("<div class='floatLeft'><\/div>");;
		i++
		}
	
	return $parentDiv;

	},


renderOptionUNKNOWN: function(pog,safeid) {
	return("UNKNOWN "+pog.type+": "+pog.prompt+" / "+pog.id);
	},

// !!! this'll need fixin
showHintIcon : function(pogid,pogHint)	{
//	app.u.dump("BEGIN variations.showHintIcon");
	return "<span class='ghint_qmark_container'><a href='#' onclick='$(\"#ghint_"+pogid+"\").toggle(); return false;' class='ghint_qmark'>?<\/a></span><div style='display:none;' class='zhint' id='ghint_"+pogid+"'>"+pogHint+"</div>";
	},






//there's a lot of logic with how price should be displayed.  This is a dumbed down version.
//app.u.formatMoney is not used here because the text is formatted by the merchant (we leave it alone).
 handlePogPrice : function(P)	{
	var price;
//Puts the + sign, if present, in the correct spot
	if(P.charAt(0) == '+')	{
		price = " +$"+P.substr(1);
		}
//Puts the - sign, if present, in the correct spot
	else if (P.charAt(0) == "-")
		price = " -$"+P.substr(1);
//If a $ is already present, do not add one.
	else if (P.charAt(0) == "$")
		price = " "+P;
	else
		price = " $"+P;
	return price;
	},




renderOption: function(pog,pid) {
	var pogid = pog.id;
	var safeid = app.u.makeSafeHTMLId(pogid); //pogs have # signs, which must be stripped to be jquery friendly.
//add a div to the dom that surrounds the pog
	var $formFieldDiv = $("<div>").attr("id","div_"+safeid).addClass("zform_div").addClass("pogType_"+pog.type);
	var $optionObj; //what is returned from the eval (the entire options object).
//if ghint is set, use that as the title attribute, otherwise use the prompt.
	var labelTitle = (pog.ghint) ? pog.ghint : pog.prompt;


//create the label (prompt) for the form input and make it a child of the newly created div.
	var $formFieldLabel = $('<label>').attr({"for":"pog_"+safeid,"id":"pog_"+safeid+"_id","title":labelTitle}).text(pog.prompt);

	$formFieldDiv.append($formFieldLabel);
	
//Push the new div into a div with id JSONPogDisplay as a new child.
//	var $displayObject = $("#JSONPogDisplay_"+pid);
//	$displayObject.append($formFieldDiv);   /// NOTE the form ID on this should probably be auto-generated from the element ID.

    if (this.handlers["pogid."+pogid]) {
      $optionObj = eval("this."+this.handlers["pogid."+pogid]+"(pog,safeid)");
      }
    else if (this.handlers["type."+pog.type]) {
      $optionObj = eval("this."+this.handlers["type."+pog.type]+"(pog,safeid)");
      }
    else {
      $optionObj = eval("this."+this.handlers["unknown."]+"(pog,safeid)");
      }
	$formFieldDiv.append($optionObj);
	return $formFieldDiv;
  }

	});

































/*
############################################################




wiki.js



############################################################

*/

/*
 * JavaScript Creole 1.0 Wiki Markup Parser
 * $Id: creole.js 14 2009-03-21 16:15:08Z ifomichev $
 *
 * Copyright (c) 2009 Ivan Fomichev
 *
 * Portions Copyright (c) 2007 Chris Purcell
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included
 * in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
 * THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 */

if (!Parse) { var Parse = {}; }
if (!Parse.Simple) { Parse.Simple = {}; }

Parse.Simple.Base = function(grammar, options) {
    if (!arguments.length) { return; }

    this.grammar = grammar;
    this.grammar.root = new this.ruleConstructor(this.grammar.root);
    this.options = options;
};

Parse.Simple.Base.prototype = {
    ruleConstructor: null,
    grammar: null,
    options: null,

    parse: function(node, data, options, linkCmdPointer) {
        if (options) {
            for (i in this.options) {
                if (typeof options[i] == 'undefined') { options[i] = this.options[i]; }
            }
        }
        else {
            options = this.options;
        }
        data = data.replace(/\r\n?/g, '\n');
        this.grammar.root.apply(node, data, options);
		//stripHTML()
		node.innerHTML =  wikiLinks2html(node.innerHTML,linkCmdPointer);  //zoovy-ify the links after stripping all the html out.
        if (options && options.forIE) { node.innerHTML = node.innerHTML.replace(/\r?\n/g, '\r\n'); }
    }
};

Parse.Simple.Base.prototype.constructor = Parse.Simple.Base;

Parse.Simple.Base.Rule = function(params) {
    if (!arguments.length) { return; }

    for (var p in params) { this[p] = params[p]; }
    if (!this.children) { this.children = []; }
};

Parse.Simple.Base.prototype.ruleConstructor = Parse.Simple.Base.Rule;

Parse.Simple.Base.Rule.prototype = {
    regex: null,
    capture: null,
    replaceRegex: null,
    replaceString: null,
    tag: null,
    attrs: null,
    children: null,

    match: function(data, options) {
        return data.match(this.regex);
    },

    build: function(node, r, options) {
        var data;
        if (this.capture !== null) {
            data = r[this.capture];
        }

        var target;
        if (this.tag) {
            target = document.createElement(this.tag);
            node.appendChild(target);
        }
        else { target = node; }

        if (data) {
            if (this.replaceRegex) {
                data = data.replace(this.replaceRegex, this.replaceString);
            }
            this.apply(target, data, options);
        }

        if (this.attrs) {
            for (var i in this.attrs) {
                target.setAttribute(i, this.attrs[i]);
                if (options && options.forIE && i == 'class') { target.className = this.attrs[i]; }
            }
        }
        return this;
    },

    apply: function(node, data, options) {
        var tail = '' + data;
        var matches = [];

        if (!this.fallback.apply) {
            this.fallback = new this.constructor(this.fallback);
        }

        while (true) {
            var best = false;
            var rule  = false;
            for (var i = 0; i < this.children.length; i++) {
                if (typeof matches[i] == 'undefined') {
                    if (!this.children[i].match) {
                        this.children[i] = new this.constructor(this.children[i]);
                    }
                    matches[i] = this.children[i].match(tail, options);
                }
                if (matches[i] && (!best || best.index > matches[i].index)) {
                    best = matches[i];
                    rule = this.children[i];
                    if (best.index == 0) { break; }
                }
            }
                
            var pos = best ? best.index : tail.length;
            if (pos > 0) {
                this.fallback.apply(node, tail.substring(0, pos), options);
            }
            
            if (!best) { break; }

            if (!rule.build) { rule = new this.constructor(rule); }
            rule.build(node, best, options);

            var chopped = best.index + best[0].length;
            tail = tail.substring(chopped);
            for (var i = 0; i < this.children.length; i++) {
                if (matches[i]) {
                    if (matches[i].index >= chopped) {
                        matches[i].index -= chopped;
                    }
                    else {
                        matches[i] = void 0;
                    }
                }
            }
        }
       return this;
    },

    fallback: {
        apply: function(node, data, options) {
            if (options && options.forIE) {
                // workaround for bad IE
                data = data.replace(/\n/g, ' \r');
            }
            node.appendChild(document.createTextNode(data));
        }
    }    
};

Parse.Simple.Base.Rule.prototype.constructor = Parse.Simple.Base.Rule;

Parse.Simple.Creole = function(options) {
    var rx = {};
//we'll handle our own link translation cuz its zoovy specific, thank you.
//    rx.link = '[^\\]|~\\n]*(?:(?:\\](?!\\])|~.)[^\\]|~\\n]*)*';
//    rx.linkText = '[^\\]~\\n]*(?:(?:\\](?!\\])|~.)[^\\]~\\n]*)*';
//    rx.uriPrefix = '\\b(?:(?:https?|ftp)://|mailto:)';
//    rx.uri = rx.uriPrefix + rx.link;
//    rx.rawUri = rx.uriPrefix + '\\S*[^\\s!"\',.:;?]';
//    rx.interwikiPrefix = '[\\w.]+:';
//    rx.interwikiLink = rx.interwikiPrefix + rx.link;
    rx.img = '\\{\\{((?!\\{)[^|}\\n]*(?:}(?!})[^|}\\n]*)*)' +
             (options && options.strict ? '' : '(?:') + 
             '\\|([^}~\\n]*((}(?!})|~.)[^}~\\n]*)*)' +
             (options && options.strict ? '' : ')?') +
             '}}';

    var formatLink = function(link, format) {
        if (format instanceof Function) {
            return format(link);
        }

        format = format instanceof Array ? format : [ format ];
        if (typeof format[1] == 'undefined') { format[1] = ''; }
        return format[0] + link + format[1];
    };

    var g = {
        hr: { tag: 'hr', regex: /(^|\n)\s*----\s*(\n|$)/ },

        br: { tag: 'br', regex: /\\\\/ },
        
        preBlock: { tag: 'pre', capture: 2,
            regex: /(^|\n)\{\{\{\n((.*\n)*?)\}\}\}(\n|$)/,
            replaceRegex: /^ ([ \t]*\}\}\})/gm,
            replaceString: '$1' },
        tt: { tag: 'tt',
            regex: /\{\{\{(.*?\}\}\}+)/, capture: 1,
            replaceRegex: /\}\}\}$/, replaceString: '' },

        ulist: { tag: 'ul', capture: 0,
            regex: /(^|\n)([ \t]*\*[^*#].*(\n|$)([ \t]*[^\s*#].*(\n|$))*([ \t]*[*#]{2}.*(\n|$))*)+/ },
        olist: { tag: 'ol', capture: 0,
            regex: /(^|\n)([ \t]*#[^*#].*(\n|$)([ \t]*[^\s*#].*(\n|$))*([ \t]*[*#]{2}.*(\n|$))*)+/ },
        li: { tag: 'li', capture: 0,
            regex: /[ \t]*([*#]).+(\n[ \t]*[^*#\s].*)*(\n[ \t]*\1[*#].+)*/,
            replaceRegex: /(^|\n)[ \t]*[*#]/g, replaceString: '$1' },

        table: { tag: 'table', capture: 0,
            regex: /(^|\n)(\|.*?[ \t]*(\n|$))+/ },
        tr: { tag: 'tr', capture: 2, regex: /(^|\n)(\|.*?)\|?[ \t]*(\n|$)/ },
        th: { tag: 'th', regex: /\|+=([^|]*)/, capture: 1 },
        td: { tag: 'td', capture: 1,
            regex: '\\|+([^|~\\[{]*((~(.|(?=\\n)|$)|' +
                   '\\[\\[' + rx.link + '(\\|' + rx.linkText + ')?\\]\\]' +
                   (options && options.strict ? '' : '|' + rx.img) +
                   '|[\\[{])[^|~]*)*)' },

        singleLine: { regex: /.+/, capture: 0 },
        paragraph: { tag: 'p', capture: 0,
            regex: /(^|\n)([ \t]*\S.*(\n|$))+/ },
        text: { capture: 0, regex: /(^|\n)([ \t]*[^\s].*(\n|$))+/ },

        strong: { tag: 'strong', capture: 1,
            regex: /\*\*([^*~]*((\*(?!\*)|~(.|(?=\n)|$))[^*~]*)*)(\*\*|\n|$)/ },
		em: {},	
		
			/*
there's either an issue with this regex or an issue resulting from our mod.
// is getting encoded as <em> in a url. use :popup or :url as an example.

        em: { tag: 'em', capture: 1,
            regex: '\\/\\/(((?!' + rx.uriPrefix + ')[^\\/~])*' +
                   '((' + rx.rawUri + '|\\/(?!\\/)|~(.|(?=\\n)|$))' +
                   '((?!' + rx.uriPrefix + ')[^\\/~])*)*)(\\/\\/|\\n|$)' },
*/
        img: { regex: rx.img,
            build: function(node, r, options) {
                var img = document.createElement('img');
                img.src = r[1];
                img.alt = r[2] === undefined
                    ? (options && options.defaultImageText ? options.defaultImageText : '')
                    : r[2].replace(/~(.)/g, '$1');
//                node.appendChild(img); //images not supported at this time. zoovy.
            } },

        namedUri: { regex: '\\[\\[(' + rx.uri + ')\\|(' + rx.linkText + ')\\]\\]',
            build: function(node, r, options) {
                var link = document.createElement('a');
                link.href = r[1];
                if (options && options.isPlainUri) {
                    link.appendChild(document.createTextNode(r[2]));
                }
                else {
                    this.apply(link, r[2], options);
                }
                node.appendChild(link);
            } },

        namedLink: { regex: '\\[\\[(' + rx.link + ')\\|(' + rx.linkText + ')\\]\\]',
            build: function(node, r, options) {
                var link = document.createElement('a');
                
                link.href = options && options.linkFormat
                    ? formatLink(r[1].replace(/~(.)/g, '$1'), options.linkFormat)
                    : r[1].replace(/~(.)/g, '$1');
                this.apply(link, r[2], options);
                
                node.appendChild(link);
            } },

        unnamedUri: { regex: '\\[\\[(' + rx.uri + ')\\]\\]',
            build: 'dummy' },
        unnamedLink: { regex: '\\[\\[(' + rx.link + ')\\]\\]',
            build: 'dummy' },
        unnamedInterwikiLink: { regex: '\\[\\[(' + rx.interwikiLink + ')\\]\\]',
            build: 'dummy' },

        rawUri: { regex: '(' + rx.rawUri + ')',
            build: 'dummy' },

        escapedSequence: { regex: '~(' + rx.rawUri + '|.)', capture: 1,
            tag: 'span', attrs: { 'class': 'escaped' } },
        escapedSymbol: { regex: /~(.)/, capture: 1,
            tag: 'span', attrs: { 'class': 'escaped' } }
    };
    g.unnamedUri.build = g.rawUri.build = function(node, r, options) {
        if (!options) { options = {}; }
        options.isPlainUri = true;
        g.namedUri.build.call(this, node, Array(r[0], r[1], r[1]), options);
    };
    g.unnamedLink.build = function(node, r, options) {
        g.namedLink.build.call(this, node, Array(r[0], r[1], r[1]), options);
    };
    g.namedInterwikiLink = { regex: '\\[\\[(' + rx.interwikiLink + ')\\|(' + rx.linkText + ')\\]\\]',
        build: function(node, r, options) {
                var link = document.createElement('a');
                
                var m, f;
                if (options && options.interwiki) {
                m = r[1].match(/(.*?):(.*)/);
                f = options.interwiki[m[1]];
            }
            
            if (typeof f == 'undefined') {
                if (!g.namedLink.apply) {
                    g.namedLink = new this.constructor(g.namedLink);
                }
                return g.namedLink.build.call(g.namedLink, node, r, options);
            }

            link.href = formatLink(m[2].replace(/~(.)/g, '$1'), f);
            
            this.apply(link, r[2], options);
            
            node.appendChild(link);
        }
    };
    g.unnamedInterwikiLink.build = function(node, r, options) {
        g.namedInterwikiLink.build.call(this, node, Array(r[0], r[1], r[1]), options);
    };
    g.namedUri.children = g.unnamedUri.children = g.rawUri.children =
            g.namedLink.children = g.unnamedLink.children =
            g.namedInterwikiLink.children = g.unnamedInterwikiLink.children =
        [ g.escapedSymbol, g.img ];

    for (var i = 1; i <= 6; i++) {
        g['h' + i] = { tag: 'h' + i, capture: 2,
            regex: '(^|\\n)[ \\t]*={' + i + '}[ \\t]' +
                   '([^~]*?(~(.|(?=\\n)|$))*)[ \\t]*=*\\s*(\\n|$)'
        };
    }

    g.ulist.children = g.olist.children = [ g.li ];
    g.li.children = [ g.ulist, g.olist ];
    g.li.fallback = g.text;

    g.table.children = [ g.tr ];
    g.tr.children = [ g.th, g.td ];
    g.td.children = [ g.singleLine ];
    g.th.children = [ g.singleLine ];

    g.h1.children = g.h2.children = g.h3.children =
            g.h4.children = g.h5.children = g.h6.children =
            g.singleLine.children = g.paragraph.children =
            g.text.children = g.strong.children = g.em.children =
        [ g.escapedSequence, g.strong, g.em, g.br, g.rawUri,
            g.namedUri, g.namedInterwikiLink, g.namedLink,
            g.unnamedUri, g.unnamedInterwikiLink, g.unnamedLink,
            g.tt, g.img ];

    g.root = {
        children: [ g.h1, g.h2, g.h3, g.h4, g.h5, g.h6,
            g.hr, g.ulist, g.olist, g.preBlock, g.table ],
        fallback: { children: [ g.paragraph ] }
    };

    Parse.Simple.Base.call(this, g, options);
};

Parse.Simple.Creole.prototype = new Parse.Simple.Base();

Parse.Simple.Creole.prototype.constructor = Parse.Simple.Creole;







/*


The functions below were written by Zoovy 


*/


function stripHTML(text)	{
	var r = text.replace(/<\/?[a-z][a-z0-9]*[^<>]*>/ig, "");
	return r;
	}



/*
translate the zoovy linking syntax and also a little regularizing
of the data. specifically, zoovy support ==word and == word but the 
creole translator didn't.
*/


function wikiLinks2html(wiki,linkCmdPointer) {
	
	if (wiki.indexOf("[[",0)>=0) {
		// we have [[macros]]

		var myOutput = new Array;
		var myTokens = wiki.split(/(\[\[.*?\].*?\])/);
		var domain = document.location.protocol == 'https:' ? zGlobals.appSettings.https_app_url : zGlobals.appSettings.http_app_url;
		
		for(var i = 0; i < myTokens.length; i++){
		    var chunk = myTokens[i];

/*
this is the normalizer, but unfortunately, the link translation occurs AFTER the rest of the wiki.
this was necessary because otherwise the converted html was output as <a href... instead of actual code.
			if (chunk.substring(0,2) != '[[') {
         		// not a token

         		// good spot to do some cleanup
         		chunk.replace(/\r/,"");	// eliminate \r (so any \r\n are now just \n)

         		var fixed = "";
         		var lines = chunk.split(/\n/);
         		for (var li = lines.length; li > 0; li--) {
         			var lstr = lines[li-1];
					if (lstr.match(/^[=]+[\s]*[a-zA-Z0-9]+/)) {
						// rewrite '==header' to '== header =='
						// rewrite '= header ==' to '= header ='
						lstr = lstr.replace(/^([=]+)[\s]*(.*?)([\s]*[=]*)$/g,"$1 $2 $1"); //### remove this spaces if = head should be =head
						}
					fixed = lstr + "\n" + fixed;
         			}

				// console.log(fixed);
				myOutput.push(fixed);
            	}
         	else 
*/			
			if (chunk.match(/^\[\[.*?\].*?\]$/)) {
				// this is a token
				var output = '';

	            var phrase = chunk.match(/^\[\[(.*?)\]/)[1];
	            var operation = chunk.match(/^\[\[.*?\](.*?)\]$/)[1];
	            var suffix = '';
	            if (operation.indexOf("=")>0) {
	            	suffix = operation.match(/^.*?\=(.*?)$/)[1];
	            	operation = operation.substring(0,operation.indexOf("="));
	            	}

            	if (operation == '') {
            		// default operation
            		operation = ':search';
            		suffix = phrase;
            		}

			
				switch(operation) {
					case ":url" :
						if(linkCmdPointer && !$.isEmptyObject(app.ext[linkCmdPointer].wiki) && typeof app.ext[linkCmdPointer].wiki[":url"] == 'function')
							output = app.ext[linkCmdPointer].wiki[":url"](suffix,phrase)
						else
							output = "<a href=\""+suffix+"\" target='_blank'>"+phrase+"</a>";
						break;

					case ":search" :
						if(linkCmdPointer && !$.isEmptyObject(app.ext[linkCmdPointer].wiki) && typeof app.ext[linkCmdPointer].wiki[":search"] == 'function')
							output = app.ext[linkCmdPointer].wiki[":search"](suffix,phrase);
						else
							output = "<a href=\""+domain+"search.cgis?KEYWORDS="+suffix+"\">"+phrase+"</a>";
						break;


					case ":category" :
						if(suffix.indexOf('.') != 0) {suffix = "."+suffix} //make sure category suffixes (safe id) start with .
						if(linkCmdPointer && !$.isEmptyObject(app.ext[linkCmdPointer].wiki) && typeof app.ext[linkCmdPointer].wiki[":category"] == 'function')
							output = app.ext[linkCmdPointer].wiki[":category"](suffix,phrase); 
						else
							output = "<a href=\""+domain+"/category/"+suffix+"/\">"+phrase+"</a>";
						break

					
					case ":product" :
						if(linkCmdPointer && !$.isEmptyObject(app.ext[linkCmdPointer].wiki) && typeof app.ext[linkCmdPointer].wiki[":product"] == 'function')
							output = app.ext[linkCmdPointer].wiki[":product"](suffix,phrase)
						else
							output = "<a href=\""+domain+"/product/"+suffix+"/\">"+phrase+"</a>"
						break;


					case ":customer" :
						if(linkCmdPointer && !$.isEmptyObject(app.ext[linkCmdPointer].wiki) && typeof app.ext[linkCmdPointer].wiki[":customer"] == 'function')
							output = app.ext[linkCmdPointer].wiki[":customer"](suffix,phrase)
						else
							output = "<a href=\""+domain+"/customer/"+suffix+"/\">"+phrase+"</a>"
						break;					
					

					case ":popup" :
//						app.u.dump(":popup suffix: "+suffix);
						if(linkCmdPointer && !$.isEmptyObject(app.ext[linkCmdPointer].wiki) && typeof app.ext[linkCmdPointer].wiki[":popup"] == 'function')
							output = app.ext[linkCmdPointer].wiki[":popup"](suffix,phrase)
						else
							output = "<a href=\""+suffix+"\" target='popup'>"+phrase+"</a>";
						break;

					case ":policy" :
						if(linkCmdPointer && !$.isEmptyObject(app.ext[linkCmdPointer].wiki) && typeof app.ext[linkCmdPointer].wiki[":policy"] == 'function')
							output = app.ext[linkCmdPointer].wiki[":policy"](suffix,phrase)
						else
							output = "<a href=\""+domain+"/policy/"+suffix+"/\">"+phrase+"</a>"
						break;		


					case ":app" :
						if(linkCmdPointer && !$.isEmptyObject(app.ext[linkCmdPointer].wiki) && typeof app.ext[linkCmdPointer].wiki[":app"] == 'function')
							output = app.ext[linkCmdPointer].wiki[":app"](suffix,phrase)
						else	{
							app.u.dump("WARNING! no app handle/token specified (required per app): "+chunk);
							output = phrase;
							}
						break;	
					
					default:
						output = "<!-- unhandled_token: "+chunk+" -->"+phrase;
						break;
					}


				// console.log("phrase["+phrase+"] operation["+operation+"] suffix["+suffix+"]");


				myOutput.push(output);
         		}
         	else {
         		// looks like a token, talks like a token, but it's not a token.
         		// this should almost NEVER be reached only on lines like [[asdf]asdf
         		myOutput.push(chunk);
         		}
			}



		// console.log("FINAL OUTPUT: "+myOutput.join(""));
		wiki = myOutput.join("");
		}

	return(wiki);
}







/*
############################################################




JSON2.js



############################################################

*/




/*



******* NOTE the following code was not part of the json2 file originally. added by jt *****************

//if jquery is loaded, this will add a serializeJSON function, which allows for a form to be put into a serialized array.
the rest of the code below that is for backward compatibility with IE7... and maybe 8.

*/

if(typeof jQuery === 'function')	{
//will serialize a form into JSON
	jQuery.fn.serializeJSON=function() {
		var json = {};
		jQuery.map($(this).serializeArray(), function(n, i){
			json[n['name']] = n['value'];
			});
		return json;
		};
	}


/*
    http://www.JSON.org/json2.js
    2009-09-29

    Public Domain.

    NO WARRANTY EXPRESSED OR IMPLIED. USE AT YOUR OWN RISK.

    See http://www.JSON.org/js.html


    This code should be minified before deployment.
    See http://javascript.crockford.com/jsmin.html

    USE YOUR OWN COPY. IT IS EXTREMELY UNWISE TO LOAD CODE FROM SERVERS YOU DO
    NOT CONTROL.


    This file creates a global JSON object containing two methods: stringify
    and parse.

        JSON.stringify(value, replacer, space)
            value       any JavaScript value, usually an object or array.

            replacer    an optional parameter that determines how object
                        values are stringified for objects. It can be a
                        function or an array of strings.

            space       an optional parameter that specifies the indentation
                        of nested structures. If it is omitted, the text will
                        be packed without extra whitespace. If it is a number,
                        it will specify the number of spaces to indent at each
                        level. If it is a string (such as '\t' or '&nbsp;'),
                        it contains the characters used to indent at each level.

            This method produces a JSON text from a JavaScript value.

            When an object value is found, if the object contains a toJSON
            method, its toJSON method will be called and the result will be
            stringified. A toJSON method does not serialize: it returns the
            value represented by the name/value pair that should be serialized,
            or undefined if nothing should be serialized. The toJSON method
            will be passed the key associated with the value, and this will be
            bound to the value

            For example, this would serialize Dates as ISO strings.

                Date.prototype.toJSON = function (key) {
                    function f(n) {
                        // Format integers to have at least two digits.
                        return n < 10 ? '0' + n : n;
                    }

                    return this.getUTCFullYear()   + '-' +
                         f(this.getUTCMonth() + 1) + '-' +
                         f(this.getUTCDate())      + 'T' +
                         f(this.getUTCHours())     + ':' +
                         f(this.getUTCMinutes())   + ':' +
                         f(this.getUTCSeconds())   + 'Z';
                };

            You can provide an optional replacer method. It will be passed the
            key and value of each member, with this bound to the containing
            object. The value that is returned from your method will be
            serialized. If your method returns undefined, then the member will
            be excluded from the serialization.

            If the replacer parameter is an array of strings, then it will be
            used to select the members to be serialized. It filters the results
            such that only members with keys listed in the replacer array are
            stringified.

            Values that do not have JSON representations, such as undefined or
            functions, will not be serialized. Such values in objects will be
            dropped; in arrays they will be replaced with null. You can use
            a replacer function to replace those with JSON values.
            JSON.stringify(undefined) returns undefined.

            The optional space parameter produces a stringification of the
            value that is filled with line breaks and indentation to make it
            easier to read.

            If the space parameter is a non-empty string, then that string will
            be used for indentation. If the space parameter is a number, then
            the indentation will be that many spaces.

            Example:

            text = JSON.stringify(['e', {pluribus: 'unum'}]);
            // text is '["e",{"pluribus":"unum"}]'


            text = JSON.stringify(['e', {pluribus: 'unum'}], null, '\t');
            // text is '[\n\t"e",\n\t{\n\t\t"pluribus": "unum"\n\t}\n]'

            text = JSON.stringify([new Date()], function (key, value) {
                return this[key] instanceof Date ?
                    'Date(' + this[key] + ')' : value;
            });
            // text is '["Date(---current time---)"]'


        JSON.parse(text, reviver)
            This method parses a JSON text to produce an object or array.
            It can throw a SyntaxError exception.

            The optional reviver parameter is a function that can filter and
            transform the results. It receives each of the keys and values,
            and its return value is used instead of the original value.
            If it returns what it received, then the structure is not modified.
            If it returns undefined then the member is deleted.

            Example:

            // Parse the text. Values that look like ISO date strings will
            // be converted to Date objects.

            myData = JSON.parse(text, function (key, value) {
                var a;
                if (typeof value === 'string') {
                    a =
/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z$/.exec(value);
                    if (a) {
                        return new Date(Date.UTC(+a[1], +a[2] - 1, +a[3], +a[4],
                            +a[5], +a[6]));
                    }
                }
                return value;
            });

            myData = JSON.parse('["Date(09/09/2001)"]', function (key, value) {
                var d;
                if (typeof value === 'string' &&
                        value.slice(0, 5) === 'Date(' &&
                        value.slice(-1) === ')') {
                    d = new Date(value.slice(5, -1));
                    if (d) {
                        return d;
                    }
                }
                return value;
            });


    This is a reference implementation. You are free to copy, modify, or
    redistribute.
*/

/*jslint evil: true, strict: false */

/*members "", "\b", "\t", "\n", "\f", "\r", "\"", JSON, "\\", apply,
    call, charCodeAt, getUTCDate, getUTCFullYear, getUTCHours,
    getUTCMinutes, getUTCMonth, getUTCSeconds, hasOwnProperty, join,
    lastIndex, length, parse, prototype, push, replace, slice, stringify,
    test, toJSON, toString, valueOf
*/






// Create a JSON object only if one does not already exist. We create the
// methods in a closure to avoid creating global variables.

if (!this.JSON) {
    this.JSON = {};
}

(function () {

    function f(n) {
        // Format integers to have at least two digits.
        return n < 10 ? '0' + n : n;
    }

    if (typeof Date.prototype.toJSON !== 'function') {

        Date.prototype.toJSON = function (key) {

            return isFinite(this.valueOf()) ?
                   this.getUTCFullYear()   + '-' +
                 f(this.getUTCMonth() + 1) + '-' +
                 f(this.getUTCDate())      + 'T' +
                 f(this.getUTCHours())     + ':' +
                 f(this.getUTCMinutes())   + ':' +
                 f(this.getUTCSeconds())   + 'Z' : null;
        };

        String.prototype.toJSON =
        Number.prototype.toJSON =
        Boolean.prototype.toJSON = function (key) {
            return this.valueOf();
        };
    }

    var cx = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
        gap,
        indent,
        meta = {    // table of character substitutions
            '\b': '\\b',
            '\t': '\\t',
            '\n': '\\n',
            '\f': '\\f',
            '\r': '\\r',
            '"' : '\\"',
            '\\': '\\\\'
        },
        rep;


    function quote(string) {

// If the string contains no control characters, no quote characters, and no
// backslash characters, then we can safely slap some quotes around it.
// Otherwise we must also replace the offending characters with safe escape
// sequences.

        escapable.lastIndex = 0;
        return escapable.test(string) ?
            '"' + string.replace(escapable, function (a) {
                var c = meta[a];
                return typeof c === 'string' ? c :
                    '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }) + '"' :
            '"' + string + '"';
    }


    function str(key, holder) {

// Produce a string from holder[key].

        var i,          // The loop counter.
            k,          // The member key.
            v,          // The member value.
            length,
            mind = gap,
            partial,
            value = holder[key];

// If the value has a toJSON method, call it to obtain a replacement value.

        if (value && typeof value === 'object' &&
                typeof value.toJSON === 'function') {
            value = value.toJSON(key);
        }

// If we were called with a replacer function, then call the replacer to
// obtain a replacement value.

        if (typeof rep === 'function') {
            value = rep.call(holder, key, value);
        }

// What happens next depends on the value's type.

        switch (typeof value) {
        case 'string':
            return quote(value);

        case 'number':

// JSON numbers must be finite. Encode non-finite numbers as null.

            return isFinite(value) ? String(value) : 'null';

        case 'boolean':
        case 'null':

// If the value is a boolean or null, convert it to a string. Note:
// typeof null does not produce 'null'. The case is included here in
// the remote chance that this gets fixed someday.

            return String(value);

// If the type is 'object', we might be dealing with an object or an array or
// null.

        case 'object':

// Due to a specification blunder in ECMAScript, typeof null is 'object',
// so watch out for that case.

            if (!value) {
                return 'null';
            }

// Make an array to hold the partial results of stringifying this object value.

            gap += indent;
            partial = [];

// Is the value an array?

            if (Object.prototype.toString.apply(value) === '[object Array]') {

// The value is an array. Stringify every element. Use null as a placeholder
// for non-JSON values.

                length = value.length;
                for (i = 0; i < length; i += 1) {
                    partial[i] = str(i, value) || 'null';
                }

// Join all of the elements together, separated with commas, and wrap them in
// brackets.

                v = partial.length === 0 ? '[]' :
                    gap ? '[\n' + gap +
                            partial.join(',\n' + gap) + '\n' +
                                mind + ']' :
                          '[' + partial.join(',') + ']';
                gap = mind;
                return v;
            }

// If the replacer is an array, use it to select the members to be stringified.

            if (rep && typeof rep === 'object') {
                length = rep.length;
                for (i = 0; i < length; i += 1) {
                    k = rep[i];
                    if (typeof k === 'string') {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            } else {

// Otherwise, iterate through all of the keys in the object.

                for (k in value) {
                    if (Object.hasOwnProperty.call(value, k)) {
                        v = str(k, value);
                        if (v) {
                            partial.push(quote(k) + (gap ? ': ' : ':') + v);
                        }
                    }
                }
            }

// Join all of the member texts together, separated with commas,
// and wrap them in braces.

            v = partial.length === 0 ? '{}' :
                gap ? '{\n' + gap + partial.join(',\n' + gap) + '\n' +
                        mind + '}' : '{' + partial.join(',') + '}';
            gap = mind;
            return v;
        }
    }

// If the JSON object does not yet have a stringify method, give it one.

    if (typeof JSON.stringify !== 'function') {
        JSON.stringify = function (value, replacer, space) {

// The stringify method takes a value and an optional replacer, and an optional
// space parameter, and returns a JSON text. The replacer can be a function
// that can replace values, or an array of strings that will select the keys.
// A default replacer method can be provided. Use of the space parameter can
// produce text that is more easily readable.

            var i;
            gap = '';
            indent = '';

// If the space parameter is a number, make an indent string containing that
// many spaces.

            if (typeof space === 'number') {
                for (i = 0; i < space; i += 1) {
                    indent += ' ';
                }

// If the space parameter is a string, it will be used as the indent string.

            } else if (typeof space === 'string') {
                indent = space;
            }

// If there is a replacer, it must be a function or an array.
// Otherwise, throw an error.

            rep = replacer;
            if (replacer && typeof replacer !== 'function' &&
                    (typeof replacer !== 'object' ||
                     typeof replacer.length !== 'number')) {
                throw new Error('JSON.stringify');
            }

// Make a fake root object containing our value under the key of ''.
// Return the result of stringifying the value.

            return str('', {'': value});
        };
    }

// remove the JSON parse function.

}());









/*
############################################################




A fairly simple pic slider class



############################################################

*/










/*

A class designed for a fairly simple slider, intended to be used when a mouse goes over a product photo in a product list.

*/

var imgSlider = function($jObjUl) {
	this.init($jObjUl);
	}

jQuery.extend(imgSlider.prototype, {
	init : function($jObjUl){
		this.$jObjUl = $jObjUl; //Jquery Object of the Unordered List
		this.direction = 'left'; //will toggle left/right as slideshow goes one direction or the other. used to execute which slide occurs.
		this.focusSlide = 0; //which slide is in focus. 0 = pic1
		this.to; //will hold TimeOut instance. allows cancellation if desired. (see kill)
		this.numSlides = this.$jObjUl.children().length;
		this.width = this.getWidth(); // sum width of all slides. used to computes width of individual slides.
//assuming all slides are same width, this will compute the slide width.
		this.slideWidth = (this.width / this.numSlides); 
		this.pause = 200; //first pic has been displayed, so start rotation quickly.
		this.handleAnime(); //start the slideshow
		this.pause = 3500; //used to determine length of time before slide leaves. takes into account time it takes to slide in (but not depart)
//		app.u.dump(this);
		},
	getWidth : function(){
		var r = 0; //what is returned. sum width;
		this.$jObjUl.children().each(function(){
			r += $(this).outerWidth(true);
			});
		return r;
		},
	handleAnime : function(){
//		console.log("slide: "+this.focusSlide+"/"+this.numSlides);
		var tmp = this;  // 'this' loses it's meaning inside the anonymous function below, so a new var is created to reference
		if(this.focusSlide >= (this.numSlides - 1))	{
			this.direction = 'right'
			}
		else if(this.focusSlide <= 0)	{
			this.direction = 'left';
			}
		else	{
//shouldn't get here.
			}
		this.to = setTimeout(function(){tmp['slide'+tmp.direction]()},tmp.pause); //the animation takes 1.5 seconds, so a 3.5 second timeout gives 2 seconds per pic of non movement.
		},
	slideleft : function()	{
		this.focusSlide += 1;
		this.$jObjUl.animate({left: "-="+this.slideWidth}, 1500, this.handleAnime());
		},
	slideright : function()	{
		this.focusSlide -= 1;
		this.$jObjUl.animate({left: "+="+this.slideWidth}, 1500, this.handleAnime());
		},
	kill : function(){
		clearTimeout(this.to); //makes sure anything set to run in the timeout is killed.
		this.$jObjUl.stop(); //kill current animation.
		this.$jObjUl.animate({'left':0},1000); //return slideshow so image1 is displayed.
		}
	});

