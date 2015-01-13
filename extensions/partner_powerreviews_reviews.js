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

#1) add extension to extensions object.
ex: _app.rq.push(['extension',1,'powerReviews','extensions/reviews_powerreviews.js','startExtension']);
#2) update the vars object with merchant and group id. all are required and will be provided by the merchant or project manager.

#3) update templates to use the following databind databind:
Snippet/summary: <div data-bind='var: product(pid); format:reviewSnippet; extension:powerReviews;'></div>
Engine/reviews: <div data-bind='var: product(pid); format:reviewEngine; extension:powerReviews;'></div>


optional:
A) remove templates below from appTemplates and from the templates list in the quickstart.js file
reviewFrmTemplate
productReviewsTemplateDetail





In the root directory of the app, create a write_review.html file and add this:

<!-- START INCLUDE CODE: -->
<div class="pr_write_review">
<script type="text/javascript">
var pr_style_sheet="http://cdn.powerreviews.com/aux/[XXXXX]/[YYYY]/css/powerreviews_express.css";
</script>
<script type="text/javascript" src="http://cdn.powerreviews.com/repos/[XXXXX]/pr/pwr/engine/js/appLaunch.js"></script>
</div>
<!-- END INCLUDE CODE: -->

the [XXXXX] and [YYYY] in the two links above should be substituted with the merchants powerreviews merchant id and group id, respectively (provided by powerreviews)
This file is included in an iFrame for 'write review'
*/


var powerReviews_reviews = function(_app) {
	return {
		

////////////////////////////////////   CALLS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\		



		calls : {}, //calls
		vars : {
			merchantID : 11531, //required 
			groupID : 8142 //required 
			},


////////////////////////////////////   CALLBACKS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



		callbacks : {

			init : {
				onSuccess : function()	{
//					_app.u.dump('BEGIN _app.ext.store_crm.init.onSuccess ');
					var r;
					if(_app.ext.powerReviews_reviews.vars.merchantID && _app.ext.powerReviews_reviews.vars.groupID)	{
						r = true;
						}
					else	{
						var msg = _app.u.errMsgObject("Uh Oh! It seems an error occured on our _app. PowerReviews may not load properly. We apologize for the inconvenience.");
						msg.persistent = true;
						_app.u.throwMessage(msg);
						_app.u.dump("ERROR! powerReviews_reviews did not pass init. The following variables are all required:");
						_app.u.dump(" -> _app.ext.powerReviews_reviews.vars.merchantID: "+_app.ext.powerReviews_reviews.vars.merchantID);
						_app.u.dump(" -> _app.ext.powerReviews_reviews.vars.groupID: "+_app.ext.powerReviews_reviews.vars.groupID);
						_app.u.dump(" -> _app.ext.powerReviews_reviews.vars.hash: "+_app.ext.powerReviews_reviews.vars.hash);
						r = false;
						}
					return r;
	//				_app.u.dump('END _app.ext.store_crm.init.onSuccess');
					},
				onError : function(d)	{
					_app.u.dump('BEGIN _app.ext.store_crm.callbacks.init.onError');
					}
				},

			startExtension : {
				onSuccess : function(){
					_app.u.dump("BEGIN powerReviews_reviews.callbacks.startExtension");
					_app.rq.push(['script',0,'http://cdn.powerreviews.com/repos/'+_app.ext.powerReviews_reviews.vars.merchantID+'/pr/pwr/engine/js/full.js']);
					_app.rq.push(['css',0,'http://cdn.powerreviews.com/repos/'+_app.ext.powerReviews_reviews.vars.merchantID+'/pr/pwr/engine/pr_styles_review.css','prBaseStylesheet']);
					_app.rq.push(['css',0,'http://cdn.powerreviews.com/aux/'+_app.ext.powerReviews_reviews.vars.merchantID+'/'+_app.ext.powerReviews_reviews.vars.groupID+'/css/powerreviews_express.css','prMerchantOverrideStylesheet']);
					},
				onError : function(d){}
				}
			}, //callbacks



////////////////////////////////////   RENDERFUNCTIONS    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\



		renderFormats : {
//pass is PID through bindData var:
			reviewSnippet : function($tag,data)	{
				if(document.location.protocol != 'https:')	{
					POWERREVIEWS.display.snippet({ write : function(content) { $tag.append(content); } }, {
						pr_page_id : data.value,
						pr_write_review : "javascript:_app.ext.powerReviews_reviews.a.writeReview('"+data.value+"');"
						})
					}
				}, //reviewSnippet
			
			reviewEngine : function ($tag,data)	{
//				_app.u.dump("BEGIN powerreviews.renderFormats.reviewEngine ["+data.value+"]");
				if(document.location.protocol != 'https:')	{
					POWERREVIEWS.display.engine({
						write : function(content) { 
							$tag.append(content);
	//						_app.u.dump(content);
							}},{
						pr_page_id : data.value,
						pr_write_review : "javascript:_app.ext.powerReviews_reviews.a.writeReview('"+data.value+"');"
						});
					}
				}
			
			
			}, //callbacks




////////////////////////////////////   ACTION   \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		a : {
			writeReview : function(pid)	{
				if(pid)	{
					document.location = "/_powerreviews?verb=writereview&pr_page_id="+pid;
/*					var $div = $('#powerReviewsModal');
					if($div.length == 0)	{
						$div = $("<div />").attr({'id':'powerReviewsModal','title':'Write a review'}).appendTo('body');
						$div.dialog({width:'90%',height:650,modal:true,autoOpen:false})
						}
					$div.html("<iframe src='/_powerreviews?verb=writereview&amp;pr_page_id="+pid+"' border='0' class='prIframe' style='min-width:700px; min-height:350px; height:100%; margin:0 auto; border:0;' />");
					$div.dialog('open');
*/					}
				else	{
					_app.u.dump("WARNING! - no pid was specified for powerReviews_reviews.a.writeReview");
					}
				} //writeReview
			}, //action

////////////////////////////////////   UTIL    \\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\


		u : {
			
	
			} //u


		
		} //r object.
	}