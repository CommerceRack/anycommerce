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

NOTE - requires powerReviews service.

To add powerReviews, do the following:


#1) In the <head> section of your index.html file, add includes for magiczoomplus .js and .css
#2) set format: magicZoomPlus; extension: magictoolbox; on an img tag. the var should be set to prod_imageX where X is an integer.

EX: <img src='images/blank.gif' data-bind='var: product(zoovy:prod_image1); format:magicZoomPlus; extension:magicToolBox;' width='335' height='375' />


*/


var magicToolBox = function() {
	return {
		

////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



		calls : {}, //calls



////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



		callbacks : {
			
			init : {
				onSuccess : function()	{
	//				app.u.dump('BEGIN app.ext.store_crm.init.onSuccess ');
					return true;  //currently, no system or config requirements to use this extension
	//				app.u.dump('END app.ext.store_crm.init.onSuccess');
					},
				onError : function(d)	{
					app.u.dump('BEGIN magicToolBox.callbacks.init.onError');
					}
				},
			startExtension : {
				onSuccess : function(){
					app.u.dump("BEGIN magictoolbox.callbacks.startExtension");
					app.rq.push(['css',0,'examples/magictoolbox/magiczoomplus.css','mzpStylesheet']);
					app.rq.push(['script',0,'examples/magictoolbox/magiczoomplus.js',function(){
						MagicZoomPlus.start();
						app.rq.push(['templateFunction','productTemplate','onCompletes',function(P) {app.u.dump("Refreshing MZP."); setTimeout(function(){MagicZoomPlus.refresh();},2000)}]);
						}]);
//						app.rq.push(['templateFunction','productTemplate','onCompletes',function(P) {app.u.dump("Refreshing MZP."); MagicZoomPlus.refresh();}]);
					
					},
				onError : function(d){}
				}
			}, //callbacks



////////////////////////////////////   RENDERFUNCTIONS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



		renderFormats : {

			magicZoomPlus : function($tag,data)	{
				app.u.dump('BEGIN myRIA.renderFormats.magicZoomPlus');
				var bgcolor = data.bindData.bgcolor ? data.bindData.bgcolor : 'ffffff'
				if(data.value)	{
					var imgSrc = app.u.makeImage({'tag':0,'w':$tag.attr('width'),'h':$tag.attr('height'),'name':data.value,'b':bgcolor});
					app.u.dump('ID => '+$tag.attr('id'));
					$tag.attr('src',imgSrc);
					$tag.wrap("<a href='"+app.u.makeImage({'tag':0,'name':data.value,'b':bgcolor})+"' class='MagicZoomPlus' id='"+$tag.attr('id')+"_href' />")
					}
				else	{
					$tag.style('display','none'); //if there is no image, hide the src.  !!! added 1/26/2012. this a good idea?
					}
				},

			magicThumb : function($tag,data)	{
				app.u.dump('BEGIN myRIA.renderFormats.magicThumb');
				var bgcolor = data.bindData.bgcolor ? data.bindData.bgcolor : 'ffffff'
				if(data.value)	{
					var imgSrc = app.u.makeImage({'tag':0,'w':$tag.attr('width'),'h':$tag.attr('height'),'name':data.value,'b':bgcolor});
//					app.u.dump('IMGSRC => '+imgSrc);
					$tag.attr('src',imgSrc);
					$tag.wrap("<a href='"+app.u.makeImage({'tag':0,'name':data.value,'b':bgcolor})+"' rev='"+app.u.makeImage({'tag':0,'w':350,'h':350,'name':data.value,'b':bgcolor})+"' class='MagicThumb Selector MagicThumb-swap'  />")
					// makes shit blow up: rel='zoom-id:bigAssImage_href; selectors-change:mouseover;'
					}
				else	{
					$tag.style('display','none'); //if there is no image, hide the src.  !!! added 1/26/2012. this a good idea?
					}
				},
			

// used to display product image 1 thru X where X is the last image. checks spot 1 - 50
// product id should be used as var
			productImages : function($tag,data)	{
//				app.u.dump("BEGIN myRIA.renderFormats.productImages ["+data.value+"]");
				var pdata = app.data['appProductGet|'+data.value]['%attribs']; //short cut to product object in memory.
				var imgs = ''; //all the html for all the images. appended to $tag after loop.
				var imgName; //recycled in loop.
				for(i = 1; i < 30; i += 1)	{
					imgName = pdata['zoovy:prod_image'+i];
//					app.u.dump(" -> "+i+": "+imgName);
					if(app.u.isSet(imgName))	{
						imgs += "<li><a class='MagicThumb' rel='zoom-id: prodBigImage_href;' rev='"+app.u.makeImage({'tag':0,'w':380,'h':380,'name':imgName,'b':'ffffff'})+"' href='"+app.u.makeImage({'tag':0,'w':'','h':'','name':imgName,'b':'ffffff'})+"'><img src='"+app.u.makeImage({'tag':0,'w':50,'h':50,'name':imgName,'b':'ffffff'})+"' \/><\/a><\/li>";
						}
					}
				$tag.append(imgs);
				} //productImages

			
			}, //renderFormats



////////////////////////////////////   UTIL    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		util : {} //util


		
		} //r object.
	}



