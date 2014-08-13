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



//    !!! ->   TODO: replace 'username' in the line below with the merchants username.     <- !!!

var store_tracking = function(_app) {
	var r = {


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



	callbacks : {
		init : {
			onSuccess : function()	{
				var r = false; 
				
				r = true;
				// _app.u.dump('store_tracking.init.onSuccess')

				return r;
				},
			onError : function()	{
				_app.u.dump('BEGIN store_tracking.callbacks.init.onError');
				}
			},
		attachHandlers : {
			onSuccess : function(){
				// _app.u.dump('PUSHING store_tracking.onSuccess');
				_app.ext.order_create.checkoutCompletes.push(function(P){

					// _app.u.dump('BEGIN store_tracking.onSuccess');

					if(P && P.datapointer && _app.data[P.datapointer] && _app.data[P.datapointer].order){
						var order = _app.data[P.datapointer].order;
						var plugins = zGlobals.plugins;
						// note: order is an object that references the raw (public) cart
						// order.our.xxxx  order[@ITEMS], etc.

						// data will appear in google analytics immediately after adding it (there is no delay)

						// _app.u.dump(order);
						// _app.u.dump(order.our);

						ga('require', 'ecommerce');
						
						//analytics tracking
						var r = {
							'id' : order.our.orderid,
							'revenue' : order.sum.items_total,
							'shipping' : order.sum.shp_total,
							'tax' : order.sum.tax_total
							};
						// _app.u.dump(r);
						ga('ecommerce:addTransaction',r);

						for(var i in order['@ITEMS']){
							var item = order['@ITEMS'][i];
							// _app.u.dump(item);
							ga('ecommerce:addItem', {
								'id' : order.our.orderid,
								'name' : item.prod_name,
								'sku' : item.sku,
								'price' : item.base_price,
								'quantity' : item.qty,
								})
							};

						ga('ecommerce:send');
						_app.u.dump('FINISHED store_tracking.onSuccess (google analytics)');
						
						for(var i in plugins){
							if(_app.ext.store_tracking.trackers[i] && _app.ext.store_tracking.trackers[i].enable){
								_app.ext.store_tracking.trackers[i](order, plugins[i]);
								}
							}
						}
					});
				},
			onError : function()	{
				_app.u.dump('BEGIN store_tracking.callbacks.attachHandlers.onError');
				}
			}
		}, //callbacks

		trackers : {
			"adwords.google.com" : function(order, plugin){
				var labels = plugin.google_conversion_label.split(',');
				for(var i in labels){
					var globals = {
						google_conversion_id : plugin.google_conversion_id,
						google_conversion_language : "en",
						google_conversion_format: "3",
						google_conversion_color : "ffffff",
						google_conversion_label : labels[i].replace(/^\s+|\s+$/g, ''), //trims label of whitespace
						google_remarketing_only : "false",
						}
					if(plugin.dynamic_value){
						globals.google_conversion_value = order.sum.order_total;
						}
					_app.ext.store_tracking.u.addTrackingScript("//www.googleadservices.com/pagead/conversion.js", globals);
					}
				}
			},

		u : {
			addTrackingScript : function(scripts, globals){
				//allow for convenient passing of a single string instead of an array
				if(typeof scripts == "string"){scripts = [scripts];}
				
				var iframe = document.createElement("iframe");
				$(iframe).addClass("displayNone");
				$('body').append(iframe);
				
				//the iframe needs a timeout after being added to the DOM before we can access its contents
				setTimeout(function(){
					if(globals){
						var paramScript = iframe.contentWindow.document.createElement("script");
						paramScript.type = "text/javascript";
						paramScript.text = "";
						for(var index in globals){
							paramScript.text += index+" = "+globals[index]+";";
							}
						iframe.contentWindow.document.body.appendChild(paramScript);
						}
					for(var i in scripts){
						var script = iframe.contentWindow.document.createElement("script");
						script.type = "text/javascript";
						script.src = scripts[i];
						iframe.contentWindow.document.body.appendChild(script);
						}
					}, 250);
				}
			}, //u [utilities]

		} //r object.
	return r;
	}