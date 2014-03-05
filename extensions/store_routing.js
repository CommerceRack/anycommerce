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

//this will trigger the content to load on app init. so if you push refresh, you don't get a blank page.
_app.router.appendInit({
	'type':'function',
	'route': function(v){
		return {'init':true} //returning anything but false triggers a match.
		},
	'callback':function(f){
		if(document.location.hash)	{
			_app.router.handleHashChange();
			}
		else	{
			showContent('homepage');
			}
		}
	});

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
		
		tlcFormats : {
			productlink : function(data, thisTLC){
				var args = thisTLC.args2obj(data.command.args, data.globals);
				if(args.pid && args.seo){
					data.globals.binds[data.globals.focusBind] =  _app.ext.store_routing.u.productLink(args.pid, args.seo);
					return true;
					} 
				else {
					dump('-> store_routing productlink tlcformat: The PID or SEO content was not provided in the tlc.');
					//stop execution of the commands.  throw a tantrum.
					return false;
					}
				}
		},
		
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
			productLink : function(pid, seo){
				var href="#!/product/"+pid+"/"+(seo ? encodeURI(seo) :"");
				return href;
				} 
			}, //u [utilities]

		e : {
			} //e [app Events]
		} //r object.
	return r;
	}