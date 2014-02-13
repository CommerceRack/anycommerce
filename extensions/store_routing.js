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




var store_routing = function(_app) {
	var theseTemplates = new Array('');
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
		init : {
			onSuccess : function()	{
				var r = false; 
				
				_app.router.addAlias('homepage', 	function(routeObj){showContent('homepage',	routeObj.params);});
				_app.router.addAlias('category', 	function(routeObj){showContent('category',	routeObj.params);});
				_app.router.addAlias('product', 	function(routeObj){showContent('product',	routeObj.params);});
				_app.router.addAlias('company', 	function(routeObj){showContent('company',	routeObj.params);});
				_app.router.addAlias('customer', 	function(routeObj){showContent('customer',	routeObj.params);});
				_app.router.addAlias('checkout', 	function(routeObj){showContent('checkout',	routeObj.params);});
				_app.router.addAlias('cart', 		function(routeObj){showContent('cart',		routeObj.params);});
				_app.router.addAlias('search', 		function(routeObj){showContent('search',	routeObj.params);});
				
				_app.router.appendHash({'type':'exact','route':'/','callback':'homepage'});
				_app.router.appendHash({'type':'exact','route':'','callback':'homepage'});
				_app.router.appendHash({'type':'match','route':'/category/{{navcat}}/*','callback':'category'});
				_app.router.appendHash({'type':'match','route':'/product/{{pid}}/*','callback':'product'});
				_app.router.appendHash({'type':'match','route':'/company/{{show}}/','callback':'company'});
				_app.router.appendHash({'type':'match','route':'/customer/{{show}}/','callback':'customer'});
				_app.router.appendHash({'type':'match','exact':'/checkout/','callback':'checkout'});
				_app.router.appendHash({'type':'match','exact':'/cart/','callback':'cart'});
				_app.router.appendHash({'type':'match','route':'/search/{{KEYWORDS}}/','callback':'search'});
				
				r = true;

				return r;
				},
			onError : function()	{
				_app.u.dump('BEGIN store_routing.callbacks.init.onError');
				}
			}
		}, //callbacks



////////////////////////////////////   ACTION    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		a : {

			}, //Actions

////////////////////////////////////   RENDERFORMATS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		renderFormats : {
			productLink : function($tag, data){
				var href="#!/product/";
				if(data.bindData.useParentData){
					href += data.value.pid+"/";
					if(data.bindData.seoattr){
						href += data.value["%attribs"][data.bindData.seoattr];
						}
					}
				else {
					href += data.value+"/";
					}
				$tag.attr('href',href);
				},
			categoryLink : function($tag, data){
				var href="#!/category/";
				if(data.bindData.useParentData){
					href += data.value.pid+"/";
					if(data.bindData.seoattr){
						href += data.value["%attribs"][data.bindData.seoattr];
						}
					}
				else {
					href += data.value+"/";
					}
				$tag.attr('href',href);
				}
			}, //renderFormats
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			}, //u [utilities]

		e : {
			} //e [app Events]
		} //r object.
	return r;
	}