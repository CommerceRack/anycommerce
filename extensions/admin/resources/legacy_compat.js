//
// functions for adding/removing/selecting categories
//


var prototypePLURL = document.location.protocol == 'file:' ? "https://www.zoovy.com/biz/ajax/prototype.pl" : "/biz/ajax/prototype.pl"

/*


###############################

This section came from: http://www.zoovy.com/biz/ajax/navcat-20121110.js

###############################
*/

//
// Product Finder Get Results
//		id is the id of the product finder (probably PF/$src)
//		btn is the button which was clicked ex: current, recent, csv, all, search
function PFGetResults(id,btn,txt) {

	// alert('id: '+id+' btn: '+btn);
	if ((btn != 'fromlist') && (btn != 'fromcat')) {
		// note: fromlist and fromcategory don't change the button state.
		jQuery('#'+selectorEscapeExpression(id+'!button:current')).prop("class",'button');
		jQuery('#'+selectorEscapeExpression(id+'!button:recent')).prop("class",'button');
		jQuery('#'+selectorEscapeExpression(id+'!button:all')).prop("class",'button');
		jQuery('#'+selectorEscapeExpression(id+'!button:showlist')).prop("class",'button');
		jQuery('#'+selectorEscapeExpression(id+'!button:showcat')).prop("class",'button');
		jQuery('#'+selectorEscapeExpression(id+'!button:showmore')).prop("class",'button');
		jQuery('#'+selectorEscapeExpression(id+'!button:search')).prop("class",'button');
		jQuery('#'+selectorEscapeExpression(id+'!button:csv')).prop("class",'button');

		if (jQuery('#'+selectorEscapeExpression(id+'!button:'+btn))) {
			jQuery('#'+selectorEscapeExpression(id+'!button:'+btn)).prop("class",'button2');
			}
		}

	var div = jQuery('#'+selectorEscapeExpression(id+'!results'));
	div.html('<table height=200 width=250"><tr><td align="center" valign="middle"><img border=0 src="/biz/loading.gif"></td></tr></table>');

	if (btn == 'showlist') {
		var postBody = 'm=PRODFINDER/ShowList&id='+id+'&btn='+btn;
		jQuery.ajax(prototypePLURL+'/PRODFINDER/ShowList', { dataType:"text",data: postBody,async: 1,success: function(data, textStatus, jqXHR){ jHandleResponse(data);} } ) ;
		}
	else if (btn == 'showcat') {
		var postBody = 'm=PRODFINDER/ShowCat&id='+id+'&btn='+btn;
		jQuery.ajax(prototypePLURL+'/PRODFINDER/ShowCat', { dataType:"text",data: postBody,async: 1,success: function(data, textStatus, jqXHR){ jHandleResponse(data);} } ) ;
		}
	else if (btn == 'showmore') {
		var postBody = 'm=PRODFINDER/ShowMore&id='+id+'&btn='+btn;
		jQuery.ajax(prototypePLURL+'/PRODFINDER/ShowMore', { dataType:"text",data: postBody,async: 1,success: function(data, textStatus, jqXHR){ jHandleResponse(data);} } ) ;
		}
	else {
		// alert('id: '+id+' button:'+btn+' txt:'+txt);
		var postBody = 'm=PRODFINDER/Load&id='+id+'&btn='+btn+'&txt='+encodeURIComponent(txt);
		jQuery.ajax(prototypePLURL+'/PRODFINDER/Load', { dataType:"text",data: postBody,async: 1,success: function(data, textStatus, jqXHR){ jHandleResponse(data);} } ) ;
		}

	}



function showNavcatProducts(safe) {

	if (jQuery('#'+selectorEscapeExpression('show_products_navcat:'+safe)).val() == 1) {
		// products are already displayed, so go hide them.
		jQuery('#'+selectorEscapeExpression('~'+safe)).html('');
		}
	else {
		//
		var postBody = 'm=NAVCAT/ShowProducts&safe='+safe;
		jQuery.ajax(prototypePLURL+'/NAVCAT/ShowProducts', { dataType:"text",data: postBody,async: 1,success: function(data, textStatus, jqXHR){ jHandleResponse(data);} } ) ;
		}
	}

//
//
//
function PFupdown(cb,direction) {
	// alert ('cb: '+cb+' direction: '+direction);
	var id = cb.id.substring(0,cb.id.indexOf('!'));
	var pid = cb.id.substring(cb.id.indexOf('!')+1);
	var tr = jQuery('#'+selectorEscapeExpression(id+'!tr:'+pid));

	allTR = jQuery('#'+selectorEscapeExpression(id+'!datatable')).rows;
	totalRows = allTR.length;

	for (x=0; x < totalRows; x++){
		if (tr.id == allTR[x].id) {
			// found row!

			var y = -1;
			if (direction == 'up') { y = x - 1; }
			else if (direction == 'down') { y = x + 1; }

			if ((direction == 'down') && (y>=totalRows)) { y = -1; alert('operation denied'); }
			if ((direction == 'up') && (x<=0)) { y = -1; alert('operation denied!'); }

			// alert('x: '+x+' y: '+y);
			if (y>=0) {
				// swap contents
				var tmp = '';
				var pid1 = allTR[x].id.substring(cb.id.indexOf('!')+1);
				pid1 = pid1.substring(3);  // strip tr:
				var pid2 = allTR[y].id.substring(cb.id.indexOf('!')+1);
				pid2 = pid2.substring(3);

				var postBody = 'm=PRODFINDER/Flip&pid1='+pid1+'&pid2='+pid2+'&id='+id;
				jQuery.ajax(prototypePLURL+'/PRODFINDER/Flip', { dataType:"text",data: postBody,async: 1 } ) ;
				for (i=0;i<5;i++) {
					tmp = allTR[x].cells[i].html();
					allTR[x].cells[i].html(allTR[y].cells[i].innerHTML);
					allTR[y].cells[i].html(tmp);
					// alert('i: '+i+' tmp: '+tmp);
					}
				tmp = allTR[x].id; allTR[x].id = allTR[y].id;	allTR[y].id = tmp;
				tmp = allTR[x].prop("class"); allTR[x].prop("class",allTR[y].prop("class")); allTR[y].prop("class",tmp);
				// tmp = allTR[x].style; allTR[x].style = allTR[y].style; allTR[y].style = tmp;


				}
			}
		}
	return;
	}




//
// ProductFinder Add/Remove Products
//		cb is a reference to "this" checkbox which was probably generated by
//		a &GTOOLS::Table::buildProductTable
//
function PFaddRemove(cb) {
	// alert(cb.id);

	var pid = cb.id.substring(cb.id.indexOf('!')+1);
	var id = cb.id.substring(0,cb.id.indexOf('!'));
	// alert(cb.checked+'  id: '+id+' pid: '+pid);

	var tr = jQuery('#'+selectorEscapeExpression(id+'!tr:'+pid));
	// alert(tr.className);

	if (cb.checked) {
		var postBody = 'm=PRODFINDER/Insert&pid='+pid+'&id='+id;
		jQuery.ajax(prototypePLURL+'/PRODFINDER/Insert', { dataType:"text",data: postBody,async: 1,success: function(data, textStatus, jqXHR){ jHandleResponse(data);} } ) ;
		tr.addClass('rs');	// adds the selected class to the current tr
		}
	else {
		var postBody = 'm=PRODFINDER/Remove&pid='+pid+'&id='+id;
		jQuery.ajax(prototypePLURL+'/PRODFINDER/Remove', { dataType:"text",data: postBody,async: 1,success: function(data, textStatus, jqXHR){ jHandleResponse(data);} } ) ;
		tr.removeClass("rs");
		}

	}


function NAVCAThandleResponse(txt) {
	if (txt == '') {
		// empty response, must have been a set only
		}
	else if (txt.indexOf('?') == 0) {
		// NOTE: multiple ? can be returned.
		// ?k1=v1 (NOT XML)
		var txtLines = new Array();
		txtLines = txt.split('?');		// split the txt into lines (separated by ?)
		for (var i = 0;i<txtLines.length;i++) {
			var params = kvTxtToArray('?' + txtLines[i]);
			// alert('i['+i+']='+txtLines[i]);
			// alert(i+' '+params['m']);
			if (txtLines[i] == '') {}	// blank line (probably the first record)
			else if (params['m'] == 'setGraphic') {
				// alert('setGraphic: '+params['id']);
				var img = jQuery('#'+selectorEscapeExpression(params['id']));
				img.src = params['src'];
				}
			else if (params['m'] == 'loadcontent') {
				var safe = params['div'];
				// alert('reloading div: ' + safe);
				thisDiv = jQuery('#'+selectorEscapeExpression(safe));

				// params['html'] = '<img id="img_TS67" src="/images/zoovy_main.gif">';

				thisDiv.html(params['html']);
				}
			else if (params['m'] == 'eval') {
				// runs javascript
				try { eval(params['js']); } catch (e) { alert('failed: '+params['js']); }
				}
			else if (params['m'] == 'dragdrop') {
				// alert('adding DragDrop for: '+params['id']);
				// new Draggable( 'img_TS67', { revert: true });
				var id = params['id'];
				var obj = jQuery('#'+selectorEscapeExpression(id));
				// alert('id: ['+id+'] '+obj.src);
				new Draggable( id, { revert: true });


				// alert(obj);
				}
			else {
				// unknown request handler!
				alert('unknown request!');
				}
			// end of each line.
			}
		}
	else {
		alert('unknown data format sent to NAVCAThandleResponse: '+txt);
		}
	}

function addProducts(safe) {
	var postBody = 'm=NAVCAT/Products&safe='+safe;
	jQuery.ajax(prototypePLURL+'/NAVCAT/Products', { dataType:"text",data: postBody,async: 1,success: function(data, textStatus, jqXHR){ jHandleResponse(data);} } ) ;
	}


//
function addNew(safe,mode) {
	// alert("adding new to "+safe);
	if (mode==undefined) { mode = 0; }

	if (mode==0) {
		var thisDiv = jQuery('#'+selectorEscapeExpression('~'+safe));
		var c = '<table border=0 cellspacing=0 class="zoovytable"><tr><td class="zoovytableheader"> &nbsp; Add New Category </td></tr><tr><td class="cell">';
		c = c + 'Category Name: <input id="NEW~'+safe+'~pretty" type="textbox" name="NEW~'+safe+'~pretty">';
		c = c + '<input type="hidden" name="NEW~'+safe+'~type" id="NEW~'+safe+'~type" value="navcat">';

		if (safe == '.') {
			c = c + '<br>';
			c = c + '<input type="radio" checked onClick="jQuery(\'#\'+selectorEscapeExpression(\'NEW~'+safe+'~type\')).prop(\'value\',\'navcat\');" name="NEW~'+safe+'~type" value="navcat"> Root Level Category<br>';
			c = c + '<input type="radio" onClick="jQuery(\'#\'+selectorEscapeExpression(\'NEW~'+safe+'~type\')).prop(\'value\',\'list\');" name="NEW~'+safe+'~type" value="list"> Product List <i>(Does not appear in navigation)</i><br>';
			}
		else {
			}

		c = c + '<input onClick="addNew(\''+safe+'\',1);" type="button" value="Save">';
		c = c + '<input onClick="addNew(\''+safe+'\',2);" type="button" value="Abort">';
		c = c + '</td></tr></table>';
		thisDiv.html(c);
		jQuery('#'+selectorEscapeExpression('NEW~'+safe+'~pretty')).focus();
		}
	else if (mode==1) {
		var thisDiv = jQuery('#'+selectorEscapeExpression('~'+safe));
		var pretty = jQuery('#'+selectorEscapeExpression('NEW~'+safe+'~pretty')).val();
		var modetype = jQuery('#'+selectorEscapeExpression('NEW~'+safe+'~type')).val();
		// alert('NEW~'+safe+'~type!list');
		// if (modetype == undefined) {
		//	alert(modetype);
		//	}

		var postBody = 'm=NAVCAT/Add&safe='+safe+'&pretty='+encodeURIComponent(pretty)+'&type='+modetype;
		postBody = postBody + '&_userid=' + app.vars.userid;
		postBody = postBody + '&_authtoken=' + app.vars.authtoken;
		postBody = postBody + '&_deviceid=' + app.vars.deviceid;
		postBody = postBody + '&_domain=' + app.vars.domain;
		if (jQuery('#'+selectorEscapeExpression('_pid'))) { postBody = postBody + '&_pid='+jQuery('#'+selectorEscapeExpression('#\_pid')).val(); }
		jQuery.ajax(prototypePLURL+'/NAVCAT/Add', { dataType:"text",data: postBody,async: 1,success: function(data, textStatus, jqXHR){ jHandleResponse(data);} } ) ;
		}
	else {
		var thisDiv = jQuery('#'+selectorEscapeExpression('~'+safe));
		thisDiv.html('');
		}
	}

//
function renameCat(safe,mode) {
	// alert("adding new to "+safe);
	if (mode==undefined) { mode = 0; }

	if (mode==0) {
		var thisDiv = jQuery('#'+selectorEscapeExpression('~'+safe));
		var c = '<table border=0 cellspacing=0 class="zoovytable"><tr><td class="zoovytableheader"> &nbsp; Rename Category </td></tr><tr><td class="cell">';
		c = c + 'New Pretty Name: <input type="textbox" id="RENAME~'+safe+'~pretty" name="RENAME~'+safe+'~pretty">';
		c = c + '<input onClick="renameCat(\''+safe+'\',1);" type="button" value="save">';
		c = c + '</td></tr></table>';
		thisDiv.html(c);
		}
	else if (mode==1) {
		var pretty = jQuery('#'+selectorEscapeExpression('RENAME~'+safe+'~pretty')).val();


		var postBody = 'm=NAVCAT/Rename&safe='+safe+'&pretty='+encodeURIComponent(pretty);
		postBody = postBody + '&_userid=' + app.vars.userid;
		postBody = postBody + '&_authtoken=' + app.vars.authtoken;
		postBody = postBody + '&_deviceid=' + app.vars.deviceid;
		postBody = postBody + '&_domain=' + app.vars.domain;
		if (jQuery('#'+selectorEscapeExpression('_pid'))) { postBody = postBody + '&_pid='+jQuery('#\_pid').val(); }
		jQuery.ajax(prototypePLURL+'/NAVCAT/Rename', { dataType:"text",data: postBody,async: 1,success: function(data, textStatus, jqXHR){ jHandleResponse(data);} } ) ;
		}
	}


// toggleCat - opens and closes a cat based on it's setting in
function toggleCat(safe) {
	// alert("expanding "+safe);

	thisDiv = jQuery('#'+selectorEscapeExpression(safe));
	var icon = jQuery('#'+selectorEscapeExpression('ICON_'+safe));
	// alert(icon.src);
	// icons are: miniup.gif and minidown.gif

	if (icon.prop("src").indexOf('miniup.gif')>=0) {
		thisDiv.html('Expanding!');
		var postBody = 'm=NAVCAT/Expand&safe='+safe;
		postBody = postBody + '&_userid=' + app.vars.userid;
		postBody = postBody + '&_authtoken=' + app.vars.authtoken;
		postBody = postBody + '&_deviceid=' + app.vars.deviceid;
		postBody = postBody + '&_domain=' + app.vars.domain;
		if (jQuery('#'+selectorEscapeExpression('_pid'))) { postBody = postBody + '&_pid='+jQuery('#\_pid').val(); }
		jQuery.ajax(prototypePLURL+'/NAVCAT/Expand', { dataType:"text",data: postBody,async: 1,success: function(data, textStatus, jqXHR){ jHandleResponse(data);} } ) ;
		}
	else {
		thisDiv.html('Collapsing!');
		var postBody = 'm=NAVCAT/Collapse&safe='+safe;
		postBody = postBody + '&_userid=' + app.vars.userid;
		postBody = postBody + '&_authtoken=' + app.vars.authtoken;
		postBody = postBody + '&_deviceid=' + app.vars.deviceid;
		postBody = postBody + '&_domain=' + app.vars.domain;
		if (jQuery('#'+selectorEscapeExpression('_pid'))) { postBody = postBody + '&_pid='+jQuery('#\_pid').val(); }
		jQuery.ajax(prototypePLURL+'/NAVCAT/Collapse', { dataType:"text",data: postBody,async: 1,success: function(data, textStatus, jqXHR){ jHandleResponse(data);} } ) ;
		}
	}

//
function deleteCat(safe,z) {
	// alert('delete cat'+safe);
	if (z==0) {
		var c = '<table border=0 cellspacing=0 class="zoovytable"><tr><td class="zoovytableheader"> &nbsp; Remove Category </td></tr><tr><td class="cell">';
		c = c + '<font color="red">Warning: you are about to delete category: '+safe+'</font><br>';
		c = c + '<input type="button" onClick="deleteCat(\''+safe+'\',1);" value="Confirm">';
		c = c + '<input type="button" onClick="deleteCat(\''+safe+'\',2);" value="Abort">';
		c = c + '</td></tr></table>';
		thisDiv = jQuery('#'+selectorEscapeExpression(safe));
		thisDiv.html(c);
		}
	else if (z==1) {
		// yep, really delete it.
		var postBody = 'm=NAVCAT/Delete&safe='+safe;
		postBody = postBody + '&_userid=' + app.vars.userid;
		postBody = postBody + '&_authtoken=' + app.vars.authtoken;
		postBody = postBody + '&_deviceid=' + app.vars.deviceid;
		postBody = postBody + '&_domain=' + app.vars.domain;

		if (jQuery('#'+selectorEscapeExpression('_pid'))) { postBody = postBody + '&_pid='+jQuery('#\_pid').val(); }
		jQuery.ajax(prototypePLURL+'/NAVCAT/Delete', { dataType:"text",data: postBody,async: 1,success: function(data, textStatus, jqXHR){ jHandleResponse(data);} } ) ;
		}
	else {
		// hmm.. they don't actually want to do this.
		toggleCat(safe);
		}
	}

function updateCat(cb) {
// alert(cb.name);
// alert(cb.checked);
   if (cb.name.substring(0,3) == "cb_") {
		var cats = jQuery('#'+selectorEscapeExpression('_diffs')).val() + "\n" + cb.name.substring(3) + "=" + ((cb.checked)?"1":"0");
      jQuery('#'+selectorEscapeExpression('_diffs')).prop("value",cats);
      }
// alert(jQuery('#'+selectorEscapeExpression('_diffs')).value);
   }


/*


###############################

This section came from: http://www.zoovy.com/biz/ajax/navcat-20121110.js

###############################
*/






// product finder 2.0
function PF(div,src) {
	var div = $("#"+selectorEscapeExpression(div));
	div.append("<p>hello world</p>");
	jGet("");

	alert("div:"+div);
	}


function jGet(uri) {
	$.get("/biz/ajax/jquery.pl/"+uri,
		function(data){
	     $('body').append( "Name: " + data.name ) // John
   	           .append( "Time: " + data.time ); //  2pm
		alert("success");
	   }, "json");
	}


//
function jHandleResponse(txt) {

	// alert("jHandleResponse: "+txt);
	//alert(app.vars.userid);
	//alert(app.vars.authtoken);
	//alert(app.vars.deviceid);
	//alert(app.vars.domain);

   if (txt == '') {
      // empty response, must have been a set only
      }
   else if (txt.indexOf('?') == 0) {
      // NOTE: multiple ? can be returned.
      // ?k1=v1 (NOT XML)
      var txtLines = new Array();
      txtLines = txt.split('?');    // split the txt into lines (separated by ?)
      for (var i = 0;i<txtLines.length;i++) {
         var params = kvTxtToArray('?' + txtLines[i]);
         // alert('i['+i+']='+txtLines[i]);
        	// alert(i+' '+params['m']);

         if (txtLines[i] == '') {}  // blank line (probably the first record)
			else if (params['m'] == 'setGraphic') {
				// alert('setGraphic: '+params['id']);
				var img = jQuery('#'+selectorEscapeExpression(params['id']));
				img.attr('src',params['src']);
				}
         else if (params['m'] == 'loadcontent') {
				// alert('setting content'+params['div']+' to '+params['html']);
				// alert(jQuery('#'+selectorEscapeExpression(params['div'])).html());
				// alert(jQuery('#xyz').html());
				//alert(selectorEscapeExpression(params['div']));
            jQuery('#'+selectorEscapeExpression(params['div'])).html(params['html']);
            }
			else if (params['m'] == 'eval') {
				// runs javascript
				try { eval(params['js']); } catch (e) { alert('failed: '+params['js']); }
				}
			else if (params['m'] == 'loadselect') {
				// to set options pass: c=count#&s=selectedid&t0=text0&v0=value0&t1=text1&v1=value1
				var theSel = jQuery('#'+selectorEscapeExpression(params['id']));
				theSel.options.length = 0; // removes all options.
				var i=0;
				while (params['t'+i] != undefined) {
					theSel.options[i] = new Option(params['t'+i],params['v'+i]);
					i++;
					}
				}
			else if (params['m'] == 'dragdrop') {
				alert('adding DragDrop for: '+params['id']);
				// new Draggable( 'img_TS67', { revert: true });
				var id = params['id'];
				var obj = jQuery('#'+selectorEscapeExpression(id));
				// alert('id: ['+id+'] '+obj.src);
				new Draggable( id, { revert: true });


				// alert(obj);
				}
         else {
            // unknown request handler!
            }
         // end of each line.
         }
      }
   else {
      alert('unknown data format sent to handleResponse: '+txt);
      }
   }


function selectorEscapeExpression(str) {
    return str.replace(/([#;&,\/\.\+\*\~':"\!\^$\[\]\(\)=>\|])/g, "\\$1");
}

//
function esc(str) {
	// note: eventually we need to make a better escape
	return(encodeURIComponent(str));
	}

function unesc(str) {
	return(decodeURIComponent(str));
	}


// NOTE: this doesn't work!
function kvArrayToTxt(qq) {
	var txt = '';
	var k = '';
	alert('length: '+qq.length);
	for ( k in qq ) {
		alert(k.valueOf);
		if (k != '') {
			alert('KEY: '+k);
			txt = txt + esc(k)+"="+esc( qq[k] )+'&';
			}
		}
	alert(txt);
	return(txt);
	}

// takes a string e.g. k1=v1&k2=v2&k3=v3 and returns an associative array
function kvTxtToArray(txt) {
	// alert('kvTxtToArray: '+txt);
	var params = new Array();

	if (txt.charAt(0) == '?') {
		txt = txt.substring(1);	 // strip off the ?
		}
	for(var i=0; i < txt.split("&").length; i++) {
		var kvpair = txt.split("&")[i];
		// alert('kvpair: '+kvpair);
		params[ unesc(kvpair.split("=")[0]) ] = unesc(kvpair.split("=")[1]);
		}

	// use the line below to test if its working!
	// for(var i in params) { alert(i + ' : ' + params[ i ]); }
	return(params);
	}


// the following two functions wreak havok in jquery - so we'll skip them.
function getRadioValue(r) {
	var result = undefined;
	for (var i=0; i < r.length; i++) {
   	if (r[i].checked) { result = r[i].value; }
	   }
	return(result);
	}


function openPopupWindow(url)	{
	window.open(url,'legacyPopup','height=500,width=500');
	}

