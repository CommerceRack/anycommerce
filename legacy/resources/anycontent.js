/*

/////  ANYCONTENT  \\\\\

$("#something").anycontent({'templateID':'someTemplate'});
$("#something").anycontent({'templateID':'someTemplate','datapointer':'appProductGet|PID'});
$("#something").anycontent({'templateID':'someTemplate','data':someDataObject});

see options object below for full list of suppoerted params

either templateID or (data or datapointer) are required.

*/

(function($) {
	$.widget("ui.anycontent",{
		options : {
			templateID : null, //The template to be used
			datapointer : null, //The data pointer in adminApp.data
			data : null, //The data used to populate the template
// ** 201332 -> extendByDatapointers added as a means for having multiple data objects passed into translator at the same time. 
			extendByDatapointers : new Array(), //an array of datapointers. will merge all the data into one object prior to translation
			translateOnly : false, //will skip any add template code.
			showLoading : true, //if no data is passed and createTemplateInstance used, if true will execute show loading.
			showLoadingMessage : 'Fetching content...', //message passed into showLoading.
			dataAttribs : {} //will be used to set data attributes on the template [data- not data()].
			},

		_init : function(){
//			dump("BEGIN anycontent");
			var self = this,
			o = self.options, //shortcut
			$t = self.element; //this is the targeted element (ex: $('#bob').anymessage() then $t is bob)
// the 'or' portion will attemplate to add a template if the ID is on the DOM.
//			dump(" -> _init this.element.data(): "); dump(this.element.data());
			
//			dump("anycontent params: "); dump(o);
			if(o.templateID && ($._app.templates[o.templateID] || self._addNewTemplate(o.templateID)))	{
//				dump(" -> passed template check.");
				self._anyContent();
				}
			else if(o.data || (o.datapointer && !$.isEmptyObject($._app.data[o.datapointer])))	{
//				dump(" -> passed data check."); dump(o.data);
				self._anyContent();
				}
			else	{
				$t.anymessage({
					persistent : true,
					gMessage : true,
					message:"Unable to translate. Either: <br \/>Template ["+o.templateID+"] not specified and/or does not exist ["+typeof $._app.templates[o.templateID]+"].<br \/> OR does not specified ["+typeof o.data+"] OR no datapointer ["+o.datapointer+"] does not exist in $._app.data "});
				}
// the template code in the controller will apply dataAttribs as data-attributes. Here, we add them as actual 'data' to preserve case and support nested values.
			if(!$.isEmptyObject(o.dataAttribs))	{
				$t.data(o.dataAttribs);
				}
			$t.data('anycontent',true); //tag as anycontent. allows $(this).data('anycontent') to be used before applying anycontent('option','destroy');
			}, //_init

		_setOption : function(option,value)	{
			$.Widget.prototype._setOption.apply( this, arguments ); //method already exists in widget factory, so call original.
			},
// when a template is translated, what is returned from this function is the data passed into transmogrify. allows for multiple data sets.
		_getData : function()	{
//			dump(" _getData is running");
			var
				o = this.options,
				eData = {}; //extended data. (didn't use data to avoid confusion w/ o.data)
			
			//add all the datapointers into one object. 'may' run into issues here if keys are shared. shouldn't be too much of an issue in the admin interface.
			if(o.extendByDatapointers.length)	{
//				dump(" -> datapointers have been extended for anycontent");
				var L = o.extendByDatapointers.length;
				for(var i = 0; i < L; i += 1)	{
					if($._app.data[o.extendByDatapointers[i]])	{
						$.extend(true,eData,$._app.data[o.extendByDatapointers[i]])
						}
					}
				}
			
			//datapointer can be set in addition to data or extendbydatapointers. added near the end to preserve integrity.
			if(o.datapointer && $._app.data[o.datapointer])	{$.extend(true,eData,$._app.data[o.datapointer])}

			//data can be set in addition to datapointer or extendbydatapointers. added near the end to preserve integrity.
			if(o.data)	{$.extend(true,eData,o.data)}
			
			return eData;
			},


		_anyContent : function()	{
//			dump(" -> _anyContent executed.");
			var o = this.options,
			r = true; // what is returned. false if not able to create template.
			//isTranslated is added as a data() var to any template that's been translated. A way to globally identify if translation has already occured.
//			dump(" -> _anyContent this.element.data(): "); dump(this.element.data());

			if(o.templateID && o.datapointer && $._app.data[o.datapointer] && !o.translateOnly)	{
//				dump(" -> template and datapointer present. transmogrify.");
				this.element.hideLoading().removeClass('loadingBG');
				this.element.append($._app.renderFunctions.transmogrify(o.dataAttribs,o.templateID,this._getData()));
				this.element.data('isTranslated',true);
				this.element.data('isTemplated',true);
				}
			else if(o.templateID && o.data && !o.translateOnly)	{
//				dump(" -> template and data present. transmogrify.");
//				dump(" -> element.tagname: "+this.element.prop("tagName"));
				if(typeof jQuery().hideLoading == 'function'){this.element.hideLoading().removeClass('loadingBG')}
//				dump(" -> hideLoading has run.");
				this.element.append($._app.renderFunctions.transmogrify(o.dataAttribs,o.templateID,this._getData()));
//				dump(" -> transmogrified");
				this.element.data('isTranslated',true);
				this.element.data('isTemplated',true);
//				dump(" -> data.isTranslated set to true.");
				}
//a templateID was specified, just add the instance. This likely means some process outside this plugin itself is handling translation OR a placeholder has been added and translate will occur after the dispatch.
			else if(o.templateID && !o.translateOnly)	{
//				dump(" -> templateID specified. create Instance.");
				this.element.append($._app.renderFunctions.createTemplateInstance(o.templateID,o.dataAttribs));
				this.element.data('isTemplated',true);
				if(o.showLoading)	{
					this.element.showLoading({'message':o.showLoadingMessage});
					}
				}
//if just translating because the template has already been rendered
			else if(o.data)	{
//				dump(" -> data specified, translate selector");
				$._app.renderFunctions.translateSelector(this.element,this._getData());
				this.element.hideLoading().removeClass('loadingBG');
				this.element.data('isTranslated',true);
				}
//if just translating because the template has already been rendered
			else if(o.datapointer  && $._app.data[o.datapointer])	{
//				dump(" -> data specified, translate selector");
				$._app.renderFunctions.translateSelector(this.element,this._getData());
				this.element.hideLoading().removeClass('loadingBG');
				this.element.data('isTranslated',true);
				}
			else	{
				dump(" -> in anycontent, got to the 'else' that we never expected to get to. anycontent.options follow: ",'warn');
				dump(o);
				//should never get here. error handling handled in _init before this is called.
				r = false;
				}
			

			
			return r;
			},

		_addNewTemplate : function()	{
			var r = false; //what's returned. true if able to create template.
			var $tmp = $($._app.u.jqSelector('#',this.options.templateID));
			if($tmp.length > 0)	{
				$._app.model.makeTemplate($tmp,this.options.templateID);
				r = true;
				}
			else{} //do nothing. Error will get thrown later.
			return r;
			},

//clear the contents. leave the parent.
		_destroy : function(){
//			dump(" -> anycontent.destroy EXECUTED");
			this.element.intervaledEmpty();
			this.element.removeData('anycontent');
//			dump(" --> this.element.data():"); dump(this.element.data());
			}
		}); // create the widget
})(jQuery);