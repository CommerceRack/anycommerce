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
					data.globals.binds[data.globals.focusBind] =  _app.ext.store_routing.u.productAnchor(args.pid, args.seo);
					return true;
					} 
				else {
					dump('-> store_routing productlink tlcformat: The PID or SEO content was not provided in the tlc.');
					//stop execution of the commands.  throw a tantrum.
					return false;
					}
				},

/*
optional params:
	type -> acceptable values are product, category, dwiw or blank (blank = dwiw). set implicitly for best results.
		 -> if blank/dwiw, type is guessed.
	seo -> supported for both category and product, will append /product pretty name or /category pretty name (uri encoded) to the end of the href.
*/
			seoanchor : function(data, thisTLC){
				var args = thisTLC.args2obj(data.command.args, data.globals), r;
				if(!args.type || args.type == 'dwiw')	{
					if(data.value.pid)	{args.type = 'product'}
					else if(data.value.path)	{args.type = 'category'}
					else	{}
					}

				switch(args.type) {
					case 'product':
						r = true;
						var seoname = '';
						if(args.seoname)	{
							seoname = args.seoname;
							}
						//seoname isn't clearly defined, so we go into some dwiw guesswork.
						else if(args.seo && data.value['%attribs'])	{ 
							seoname = data.value['%attribs']['zoovy:prod_seo_title'] || data.value['%attribs']['zoovy:prod_name'] || ''; //this would be a product list.
							}
						else if(args.seo && data.value.prod_name)	{
							seoname = data.value.prod_name; //this would be an elastic search results.
							}
						else	{} //not defined. guesswork came back negative.
						data.globals.binds[data.globals.focusBind] = _app.ext.store_routing.u.productAnchor(data.value.pid, seoname);
						break;
					
					case 'category':
						r = true;
						var seo = args.seo || data.value.pretty;
						data.globals.binds[data.globals.focusBind] = _app.ext.store_routing.u.categoryAnchor(data.value.path, seo);
						break;
					
					default:
						dump("in tlcFormat.seolink, the type specified ["+args.type+"] is not recognized.");
						r = false; //unrecognized 'type'
					}
				return r;
				} //seolink

			},
////////////////////////////////////   UTIL [u]   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\

		u : {
			setHash : function(hash){
				dump('setting hash to: '+hash);
				
				},
			cleanURIComponent : function(str){
				//trims whitespace
				var component = str.replace(/^\s+|\s+$/g, '');
				//replaces all non alphanumerics with dashes
				component = component.replace(/[^a-zA-Z0-9]+/g, '-');
				return component;
				},
			productAnchor : function(pid, seo){
				return "/product/"+pid+"/"+(seo ? _app.ext.store_routing.u.cleanURIComponent(seo) : '');
				},
			categoryAnchor : function(path,seo)	{
				if(path.charAt(0) == '.'){
					path = path.substr(1);
					}
				return "/category/"+path+"/"+((seo) ? _app.ext.store_routing.u.cleanURIComponent(seo) : '');
				},
			searchAnchor : function(type,value)	{
				var r;
				if(type == 'tag')	{
					r = '/search/tag/'+value;
					}
				else if(type == 'keywords')	{
					r = '/search/keywords/'+value;
					}
// ### FUTURE -> support ability to search for a match on a specific attribute.
//				else if(type == 'attrib')	{
//					r = '/search/attrib/' ... some key value pair.
//					}
				else	{
					//unrecognized type
					}
				return "/category/"+path+((seo) ? "/"+encodeURIComponent(seo) : '');
				}
			}, //u [utilities]

		e : {
/*			
			navigateTo : function($ele,P)	{
				if($ele.data('type'))	{
					switch($ele.data('type'))	{
						case 'product':
							document.location.hash = _app.ext.store_routing.u.productAnchor($ele.data('pid'));
							break;
						case 'category':
							document.location.hash = _app.ext.store_routing.u.categoryAnchor($ele.data('path'));
							break;
						default:
							$("#globalMessaging").anymessage({"message":"In store_router.e.navigateTo, invalid data.type ["+$ele.data('type')+"] on trigger element.","gMessage":true});
						}
					}
				else	{
					
					}
				}
*/
			} //e [app Events]
		} //r object.
	return r;
	}
