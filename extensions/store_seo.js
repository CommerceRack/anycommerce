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



var store_seo = function(_app) {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

	vars : {
		defaultTitle : "", //Should not include any Prefix or Postfix
		titlePrefix : "",
		titlePostfix : ""
		},

	callbacks : {
//executed when extension is loaded. should include any validation that needs to occur.
		init : {
			onSuccess : function()	{
				var r = false; 
				
				_app.templates.homepageTemplate.on('complete',	function(event,$context,infoObj){_app.ext.store_seo.u.generateMeta(infoObj);});
				_app.templates.categoryTemplate.on('complete',	function(event,$context,infoObj){_app.ext.store_seo.u.generateMeta(infoObj);});
				_app.templates.productTemplate.on('complete',	function(event,$context,infoObj){_app.ext.store_seo.u.generateMeta(infoObj);});
				_app.templates.companyTemplate.on('complete',	function(event,$context,infoObj){_app.ext.store_seo.u.generateMeta(infoObj);});
				_app.templates.customerTemplate.on('complete',	function(event,$context,infoObj){_app.ext.store_seo.u.generateMeta(infoObj);});
				_app.templates.checkoutTemplate.on('complete',	function(event,$context,infoObj){_app.ext.store_seo.u.generateMeta(infoObj);});
				_app.templates.cartTemplate.on('complete',		function(event,$context,infoObj){_app.ext.store_seo.u.generateMeta(infoObj);});
				_app.templates.searchTemplate.on('complete',	function(event,$context,infoObj){_app.ext.store_seo.u.generateMeta(infoObj);});
				
				r = true;

				return r;
				},
			onError : function()	{
				_app.u.dump('BEGIN store_seo.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {

			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			generateMeta : function(infoObj){
				var baseTitle = '';
				var desc = '';
				switch(infoObj.pageType){
					case "homepage" :
						//Use Default Title
						break;
					case "category" :
						break;
					case "product" :
						break;
					case "company" :
						break;
					case "customer" :
						break;
					case "checkout" :
						break;
					case "cart" :
						break;
					case "search" :
						break;
					default :
						break;
					}
				if(!baseTitle){
					baseTitle = _app.ext.store_seo.vars.defaultTitle;
					}
				
				document.title = _app.ext.store_seo.vars.titlePrefix + title + _app.ext.store_seo.vars.titlePostfix;
				$('meta[name=description]').attr('content', desc);
				}
			}, //u [utilities]

		e : {
			} //e [app Events]
		} //r object.
	return r;
	}