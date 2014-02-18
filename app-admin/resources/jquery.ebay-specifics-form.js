/*!
 * jQuery ebaySpecificsForm plugin
 * Original author: Taras I. <mispeaced (at) gmail.com>
 * Licensed under the New BSD License
 */

/* REQUIREMENTS - jquery.ebay-specifics-form.css + jquery.ebay-specifics-form.png (these are interface buttons)
 * set the path to css and png files below
 */

/* This thing takes eBay @RECOMMENDATIONS (recommended specifics Names/Values)
 * and dynamically builds eBay item specifics form (looks similar to the one they have at eBay.com -> Sell Item)
 * Plugin also restores 'ebay:itemspecifics', can validate, store everything back,
 * handles nested inputs/selects (based on the logic eBay provides us in recommendations)
 * handles multi-select checkboxes, shows drop-down suggests, shows errors, etc.
 *
 * All complex logic is inside, and there are 2 methods you'll ever want to use:
 *
 *     $('.ebaySpecificsForm').ebaySpecificsFormBuild(prod);
 *     result = $('.ebaySpecificsForm').ebaySpecificsFormSave();
 * 
 * provide an empty '.ebaySpecificsForm' div
 * prod is a product object, that optionally has @RECOMMENDATIONS array we fetch from adminEBAYCategory
 * prod optionally has 'ebay:itemspecifics' (to restore the form),
 * prod optionally has 'prod_desc' with wiki bullets (also to restore the form - not yet implemented)
 *
 * result:
 * { error: '',
 *   specificsStr: 'Color:Red\nBrand:Cool',
 *   specificsArr: [{"Name":"Color","Value":"Red"}, {"Name":"Brand","Value":"Cool"}]
 * }
 *
 * Check the result.error for validation errors (this plugin shows errors to the user automatically in place)
 *
 * result.specificsStr can be saved back to 'ebay:itemspecifics' without any addtional procession.
 * result.specificsArr - the same stuff, just if you want a raw data (not likely)
 */


(function( $ ){
	
	// this block is created automatically inside, dont change class to id, don't remove '.'
	var ebaySpecsBlock = '.ebaySpecificsFormInner';
	var ebaySpecsCSS = 'app-admin/resources/jquery.ebay-specifics-form.css';
	var ebaySpecsPNG = 'app-admin/resources/jquery.ebay-specifics-form.png';
// *** 201401 -> changed cuz app. is no longer a guarantee.
//	if(app && app.vars && app.vars.baseURL) {
//		ebaySpecsCSS = ebaySpecsCSS+app.vars.baseURL;
//		ebaySpecsPNG = ebaySpecsPNG+app.vars.baseURL;
//	}
	if(window.baseURL) {
		ebaySpecsCSS = ebaySpecsCSS+baseURL;
		ebaySpecsPNG = ebaySpecsPNG+baseURL;
	}	
	
  // gets .json chunk with recommended item specific Key/Values
	// and bulds the advanced eBay specifics form, then restores 'ebay:itemspecifics'
  $.fn.ebaySpecificsFormBuild = function(product) {
		// append stylesheet
		if(!$('head link[href="'+ebaySpecsCSS+'"]').length) {
			$('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', ebaySpecsCSS) );
		}
		// create ebaySpecsBlock div
		if(!$(this).find(ebaySpecsBlock).length) {
			var $div = $('<div></div>').addClass(ebaySpecsBlock.replace(/\./g,''));
			$(this).append($div);
		} else {
			$(this).find(ebaySpecsBlock).html('');
		}
		
		// process array of recommendations
		if(product['@RECOMMENDATIONS'] instanceof Array) {
			$.each(product['@RECOMMENDATIONS'], function(index) {
				var rec = product['@RECOMMENDATIONS'][index];

				var $fieldSetEl = $('<fieldset><legend><b></b></span></legend></fieldset>');
				$fieldSetEl.attr('data-name',rec.Name);
				$fieldSetEl.attr('data-maxvalues',rec.ValidationRules.MaxValues);

				// set attribute name in fieldset legend
				$('legend > b', $fieldSetEl).append(rec.Name);

				// show green star if this attribute is required 
				// OR show 'Remove' link in the legend if attr is optional
				//if(rec.ValidationRules.MinValues > 0) {
				if(0) {
					$fieldSetEl.attr("required",true);
					$('legend', $fieldSetEl).prepend('<span class="isRequiredIcon">*</span>');
				} else {
					$('legend', $fieldSetEl).append('<span class="removeBtn">Remove</span>');
				}

				// we can build a simple <select> dropdown or FreeText with smart suggest dropdown or ...
				switch(rec.ValidationRules.SelectionMode) {

					/////////////////// SelectionMode == FreeText \\\\\\\\\\\\\\\\\\\\\\
					case 'FreeText':
						if(rec.ValueRecommendation) {
							// BUILD input with suggest-drop-down
							if(rec.ValidationRules.MaxValues == 1) {
								if(rec.ValidationRules.MinValues > 0) {
									$fieldSetEl.append('<span class="notice">Choose one value from the list or enter your own, please.</span>');
								}
								/*$select = $('<select></select>').attr('name',rec.Name).html('<option value="" selected>-</option>');
								$.each(rec.ValueRecommendation, function(index) {
									recVal = rec.ValueRecommendation[index].Value;
									$option = $("<option></option>");
									$option.val(recVal).text(recVal);
									$select.append($option);
								});
								$fieldSetEl.append($select);*/
								// maxlength=50 - is what eBay has at ebay.com -> Sell Item form
								var $input = $('<input type="text" maxlength="50" size="40" />').attr('name',rec.Name);
								var $dropDownArrow = $('<span class="dropDownArrow"></span>').css('background-image','url("'+ebaySpecsPNG+'")');
								var $ul = $('<ul class="dropDownList"></ul>').append('<li class="dropDownOwn">Enter your own</li>');
								$.each(rec.ValueRecommendation, function(index) {
									var recVal = rec.ValueRecommendation[index].Value;
									var $li = $("<li></li>").append(recVal);

									// eBay also provides validation rules for nested dropdown lists (relationships)
									if(	rec.ValueRecommendation[index].ValidationRules && 
											rec.ValueRecommendation[index].ValidationRules.Relationship) {
										var parentName = '';
										var parentValues = [];

										// relationship is just a hash
										if(rec.ValueRecommendation[index].ValidationRules.Relationship.ParentName) {
											var rel = rec.ValueRecommendation[index].ValidationRules.Relationship;
											parentName = rel.ParentName;
											parentValues.push(rel.ParentValue);
										// relationship is an array
										} else {
											$.each(rec.ValueRecommendation[index].ValidationRules.Relationship, function(relIndex) {
												var rel = rec.ValueRecommendation[index].ValidationRules.Relationship[relIndex];
												if(rel.ParentName && rel.ParentValue) {
													parentName = rel.ParentName;
													parentValues.push(rel.ParentValue);
												}
											});
										}
										$li.attr('parent-name',parentName);
										$li.attr('parent-values',parentValues.join('\|'));
									}

									$ul.append($li);
								});
								$fieldSetEl.append($input).append($dropDownArrow).append($ul);
								// we set actions for dropDownArrow and dropDownList below
							} // rec.ValidationRules.MaxValues == 1

							// BUILD set of checkboxes + custom field to add more of them
							if(rec.ValidationRules.MaxValues > 1) {
								if(rec.ValidationRules.MinValues > 0) {
									$fieldSetEl.append('<span class="notice">Choose at least one value from the list or define your own.</span>');
								}
								var $checkboxes = $('<div class="checkboxesWrapper"></div>');
								var $input = $('<input class="addCheckbox" type="text" maxlength="50" size="30" />');
								var $button = $('<button class="addCheckboxBtn">Add One More</button>');
								
								$.each(rec.ValueRecommendation, function(index) {
									var recVal = rec.ValueRecommendation[index].Value;
									var $checkbox = $('<input type="checkbox" />').attr('name',rec.Name).val(recVal);
									var $label = $('<label></label>').addClass('checkbox').append($checkbox).append(recVal);

									// eBay also provides validation rules for nested dropdown lists (relationships)
									if(	rec.ValueRecommendation[index].ValidationRules && 
											rec.ValueRecommendation[index].ValidationRules.Relationship) {
										var parentName = '';
										var parentValues = [];

										// relationship is just a hash
										if(rec.ValueRecommendation[index].ValidationRules.Relationship.ParentName) {
											var rel = rec.ValueRecommendation[index].ValidationRules.Relationship;
											parentName = rel.ParentName;
											parentValues.push(rel.ParentValue);
										// relationship is an array
										} else {
											$.each(rec.ValueRecommendation[index].ValidationRules.Relationship, function(relIndex) {
												var rel = rec.ValueRecommendation[index].ValidationRules.Relationship[relIndex];
												if(rel.ParentName && rel.ParentValue) {
													parentName = rel.ParentName;
													parentValues.push(rel.ParentValue);
												}
											});
										}
										$label.hide();
										$label.attr('parent-name',parentName);
										$label.attr('parent-values',parentValues.join('\|'));
									}
									$checkboxes.append($label);
								});
								$fieldSetEl.append($checkboxes).append($input).append($button);
								
								// we set actions for dropDownArrow and dropDownList below
								$('.addCheckboxBtn',$fieldSetEl).click(function() { handleAddCheckbox(this) });
							} // rec.ValidationRules.MaxValues > 1

						} else {
							// BUILD simple input (eBay only suggested key name without values)
							if(rec.ValidationRules.MinValues > 0) {
								$fieldSetEl.append('<span class="notice">Enter your value, please</span>');
							}
							var $input = $('<input type="text" size="40" />').attr('name',rec.Name);
							$fieldSetEl.append($input);

						}
						break;
						/////////////////// END SelectionMode == FreeText \\\\\\\\\\\\\\\\\\\\\\

					/////////////////// SelectionMode == SelectionOnly \\\\\\\\\\\\\\\\\\\\\\
					case 'SelectionOnly':
						if(rec.ValueRecommendation) {

							// BUILD a simple <select>
							if(rec.ValidationRules.MaxValues == 1) {
								if(rec.ValidationRules.MinValues > 0) {
									$fieldSetEl.append('<span class="notice">Choose one value from the list, please.</span>');
								}
								var $select = $('<select></select>').attr('name',rec.Name).html('<option value="" selected>-</option>');
								$.each(rec.ValueRecommendation, function(index) {
									var recVal = rec.ValueRecommendation[index].Value;
									var $option = $("<option></option>");
									$option.val(recVal).text(recVal);

									// eBay also provides validation rules for nested dropdown lists (relationships)
									if(	rec.ValueRecommendation[index].ValidationRules && 
											rec.ValueRecommendation[index].ValidationRules.Relationship) {
										var parentName = '';
										var parentValues = [];

										// relationship is just a hash
										if(rec.ValueRecommendation[index].ValidationRules.Relationship.ParentName) {
											var rel = rec.ValueRecommendation[index].ValidationRules.Relationship;
											parentName = rel.ParentName;
											parentValues.push(rel.ParentValue);
										// relationship is an array
										} else {
											$.each(rec.ValueRecommendation[index].ValidationRules.Relationship, function(relIndex) {
												var rel = rec.ValueRecommendation[index].ValidationRules.Relationship[relIndex];
												if(rel.ParentName && rel.ParentValue) {
													parentName = rel.ParentName;
													parentValues.push(rel.ParentValue);
												}
											});
										}
										$option.attr('parent-name',parentName);
										$option.attr('parent-values',parentValues.join('\|'));
									}

									$select.append($option);
								});
								$fieldSetEl.append($select);
							}

							// BUILD set of checkboxes
							if(rec.ValidationRules.MaxValues > 1) {
								if(rec.ValidationRules.MinValues > 0) {
									$fieldSetEl.append('<span class="notice">Choose at least one value from the list, please.</span>');
								}
								var $checkboxes = $('<div class="checkboxesWrapper"></div>');
								$.each(rec.ValueRecommendation, function(index) {
									var recVal = rec.ValueRecommendation[index].Value;
									var $checkbox = $('<input type="checkbox" />').attr('name',rec.Name).val(recVal);
									var $label = $('<label></label>').append($checkbox).append(recVal);
									$checkboxes.append($label);
								});
								$fieldSetEl.append($checkboxes);
							}
						}
						break;
						/////////////////// END SelectionMode == SelectionOnly \\\\\\\\\\\\\\\\\\\\\\

				}

				// if exists HelpURL (for ex. Size Chart link) - show it. It opens eBay help page in popup
				if(rec.HelpURL) {
					$fieldSetEl.append('<a class="helpURL" title="Show the help page" href="'+rec.HelpURL+'" onclick="window.open(\''+rec.HelpURL+'\',\'eBay Help\',\'width=780,height=600\'); return false">?</a>');
				}

				// attributes can be independent OR can rely on some other attribute (nested)
				// Ex. - see rec.ValidationRules.Relationship for category 63869
				// let's decide where to insert our fieldset (independent or nested inside the other one)
				$('input,select',$fieldSetEl).first().unbind('change').change(function(){ handleNested(this); });
				if(rec.ValidationRules.Relationship && rec.ValidationRules.Relationship[0] && rec.ValidationRules.Relationship[0].ParentName) {
					var parentName = rec.ValidationRules.Relationship[0].ParentName;
					$("select,input",$fieldSetEl).attr('disabled',true);
					$(".dropDownArrow",$fieldSetEl).addClass('dropDownArrowDisabled');
					$(ebaySpecsBlock+' fieldset legend:contains('+parentName+')').parent().append($fieldSetEl);
				} else {
					$(ebaySpecsBlock).append($fieldSetEl); // put it into the DOM
				}
			});
		}
		// END process array of recommendations

		$(ebaySpecsBlock).append('<fieldset class="customSpecifics" data-name="Add your own item specific"><legend><b>Add your own item specific</b><span class="removeBtn">Remove</span></legend><div class="customSpecificsInputs"></div><span class="addCustomSpecificBtn">Add a custom specific</span></fieldset>');

		// if user removes the fieldset from the interface - we need to show him "+" button to return this fs back
		if(!$(ebaySpecsBlock+' .hiddenFieldSetControls').length) { $(ebaySpecsBlock).append('<div class="hiddenFieldSetControls"></div>') }
		$(ebaySpecsBlock+' fieldset').each(function() {
			var recName = $(this).find('legend b').text();
			var $span = $('<span class="addFieldSet"></span>').attr('for',recName).text(recName);
			$(ebaySpecsBlock+' .hiddenFieldSetControls').append($span);
		});

		$(ebaySpecsBlock).append('<div class="errorBalloon"></div>');
		$(ebaySpecsBlock).append('<fieldset class="result"><legend><b>ebay:itemspecifics</b></legend><div class="resultContent"></div></fieldset>');
//		$(ebaySpecsBlock).append('<button class="specificsSave">Save Item Specifics</button>');
//		$(ebaySpecsBlock).append('<button class="specificsRestore">Restore form with sample ebay:itemspecifics</button>');

		/* ------ Assign mouse actions ------- */
		$(ebaySpecsBlock+' .isRequiredIcon').mouseover(function() {
			if(!$(this).find('em').length) {
				$(this).append('<em>Required</em>').find('em').fadeIn('normal');
			}
		});
		$(ebaySpecsBlock+' .isRequiredIcon').mouseout(function() {
			$(this).find('em').fadeOut('normal', function(){ $(this).remove()});
		});

		$(ebaySpecsBlock+' button.specificsSave').click(function() {
			if(handleValidate(this)) {
				ebaySpecificsFormSave(this);
			}
		});
// ## TODO -> test me. B's working on the API right now.
//		$(ebaySpecsBlock+' .dropDownArrow').each(function(){
//			$(this).button({icons: {primary: "ui-icon-circle-triangle-s"}});
//			});
		$(ebaySpecsBlock+' .dropDownArrow').on('click.handleDropDownArrow',function(event) { handleDropDownArrow(this); return false; });
		$(ebaySpecsBlock+' .dropDownList li').click(function() { handleDropDownList(this) });
		$(ebaySpecsBlock+' .dropDownList li').mouseover(function() { $(this).addClass('dropDownHover') });
		$(ebaySpecsBlock+' .dropDownList li').mouseout(function() { $(this).removeClass('dropDownHover') });

		$(ebaySpecsBlock+' .addCustomSpecificBtn').click(function() { handleAddCustomSpecific() });

		$(ebaySpecsBlock+' fieldset legend .removeBtn').click(function() { handleRemoveFieldSet(this) });
		$(ebaySpecsBlock+' .addFieldSet').click(function() { handleAddFieldSet(this) });

		$(ebaySpecsBlock+' button.specificsRestore').click(function() { handleRestore(sampleProduct); });
		/* ------ END Assign mouse actions ------- */
		
		// fix background images
		$(ebaySpecsBlock+' .addCustomSpecificBtn').css('background-image','url("'+ebaySpecsPNG+'")');
		$(ebaySpecsBlock+' .addFieldSet').css('background-image','url("'+ebaySpecsPNG+'")');
		
		// restore 'ebay:itemspecifics'
		handleRestore(product);
	
  };
  /////////// END ebaySpecificsFormBuild \\\\\\\\\\\\
  
	// walk through inputs/selects/checkboxes and save everything
	$.fn.ebaySpecificsFormSave = function() {
		var error = handleValidate($(this).find(ebaySpecsBlock));
		
		if(error) {
			return {"error":error};
		} else {
			var specifics = []; // dont replace this array with hash, order is important!!!
			$(this).find(ebaySpecsBlock).find('select:visible:enabled:not([readonly]),input:visible:enabled:not([readonly])').each(function() {
				var sName = $(this).attr('name');
				var sValue = $(this).val();

				// remove "||" from sValue
				if(sValue) {
					sValue = sValue.replace(/\|\|/g,'');
				}

				// extract custom Name:Value pairs
				if($(this).hasClass('customNameInput')) {
					sName = $(this).val();
					// <label><input value="Name1" class="customNameInput"></label> <label><input value="Value1"></label>
					sValue = $(this).parent().next().find('input').val();
				}

				// remove ":", "||" and "line breaks" from sName
				if(sName) {
					sName = sName.replace(/:|\|\||\n/g,'');
				}
				// remove ':' and '\n' from sValue
				if(sValue) {
					sValue = sValue.replace(/:|\n/g,'');
				}

				var i = -1;
				// find where to save name:value(s) in our specifics array
				$.each(specifics, function(index) {
					if(specifics[index].Name == sName) {
						i = index;
					}
				});

				// checkboxes are saved as {Name:"sName",Value:"Value1||Value2||Value3"}
				if(sName && sValue && $(this).is(':checkbox:checked')) {
					if(i == -1) { specifics.push({Name:"",Value:""}); i=specifics.length-1; }
					if(!specifics[i].Name) {
						specifics[i].Name = sName;
						specifics[i].Value = sValue;
					} else {
						specifics[i].Value += '||'+sValue;
					}
				}

				// <select> and <input type="text"> are saved as {Name:"sName",Value:"sValue"}
				if(sName && sValue && $(this).attr('type') != 'checkbox') {
					if(i == -1) { specifics.push({Name:"",Value:""}); i=specifics.length-1; }
					specifics[i].Name = sName;
					specifics[i].Value = sValue;
				}
			});
			
			var specificsStr = '';
			$.each(specifics, function(index) {
				specificsStr += specifics[index].Name + ':' + specifics[index].Value + '\n';
			});
			return { "specificsStr":specificsStr, "specificsArr":specifics }
		}
		
	}
	/////////// END ebaySpecificsFormSave \\\\\\\\\\\\
  
	// ============= ebaySpecificsFormBuild - helper methods =================
	
	// some specifics can be nested and rely on each other
	// if parent is not selected - keep all children disabled
	// when parent gets it's value - enable child input/select
	function handleNested(el) {
		var elName = $(el).attr('name');
		var $fs = $(el).parent().find('fieldset');
		if($(el).val()) {
			$('input,select', $fs).attr("disabled",false);
			$('.dropDownArrow', $fs).removeClass('dropDownArrowDisabled');

			// handle relationship between drop-down lists
			// for example, catId 63869 - there are two lists - 'Size Type' and 'Size' (nested in it)
			// 'Size Type' has 4 values - Regular, Petites, Plus, Juniors
			// 'Size' has about 50 values, like S,M,L,XL,2XL,1,2,3,1X,2X,3X,14W,16W,....
			// If user selects 'Size Type' = 'Plus', we need to show only appropriate sizes in 'Size' dropdown
			// (for Plus they will be 1X,2X,3X,... 14W,16W..... And normal S,M,L will be hidden)
/*
				$('.dropDownList li, select option', $fs).each(function() {
				$(this).not('.dropDownOwn').hide();
				if($(this).attr('parent-name') == elName) {
					var parentValues = $(this).attr('parent-values');
					if(parentValues.search($(el).val()) != -1) {
						$(this).show();
					}
				}
			});
*/
			
			// sometimes fieldsets are not nested, but related - and we need to handle this
			// See "DVDs & Movies -> VHS Tapes" for how this works
			// Changing 'Genre' automatically shows/hides checkboxes inside 'Sub-Genre' - but they're not nested!
			$(ebaySpecsBlock).find('.dropDownList li, select option, label.checkbox').each(function() {
				if($(this).attr('parent-name') == elName) {
					var parentValues = $(this).attr('parent-values');
					if(parentValues.search($(el).val()) != -1 || $(this).find('input').prop('checked')) {
						$(this).show();
					} else {
						$(this).hide();
					}
				}
			});

		} 
		else {
			$('input,select', $fs).attr("disabled",true);
			$('.dropDownArrow', $fs).removeClass('dropDownArrowPressed').addClass('dropDownArrowDisabled');
			$('.dropDownList', $fs).fadeOut();
		}
	}

	// add a checkbox with your own item specific
	function handleAddCheckbox(el) {
		var checkboxVal = $(el).parent().find('.addCheckbox').val();
		var checkboxesTotal = 0;
		$(el).parent().find('.checkboxesWrapper input').each(function() {
			if($(this).prop('checked')) {
				checkboxesTotal += 1;
			}
		});
		var max = $(el).parent().attr('data-maxvalues');
		var name = $(el).parent().find('legend > b').text();
		if(checkboxVal && max && checkboxesTotal < max) {
			// check if such checkbox already exists
			var found=0;
			$(el).parent().find('.checkboxesWrapper input[type=checkbox]').each(function() {
				if($(this).val() && $(this).val().toUpperCase() === checkboxVal.toUpperCase()) {
					found=1;
					if($(this).prop('checked')) {
						showErrorBalloon(el,'Value "'+checkboxVal+'" already exists');
					} else {
						// mark the checkbox and show it's label if it was hidden 
						// (<label class="checkbox"><input type=checkbox value="Value">Value</label>)
						$(this).prop('checked',true).parent().show();
						$(el).parent().find('.addCheckbox').val('');
					}
				}
			});
			if(!found) {
				var $checkbox = $('<input type="checkbox" checked />').attr('name',name).val(checkboxVal);
				var $label = $('<label></label>').append($checkbox).append(checkboxVal);
				$(el).parent().find('.checkboxesWrapper').append($label);
				$(el).parent().find('.addCheckbox').val('');
			}
		}

		if(checkboxesTotal >= max) {
			showErrorBalloon(el,'Too many checkboxes already. eBay only allows '+max+' for this specific');
		}

		if(!checkboxVal) {
			showErrorBalloon(el,'Please, enter some value');
		}
	}

	// When we have <input> + smart suggest dropdown
	// there's a small Down Arrow - pressing it shows <ul> with all recommended values
	function handleDropDownArrow(el) {
// 201352 -> added a little usability here. only one menu will be open at a time. once a click occurs (anywhere), the menu will close. That's a fairly expected behavior for menus of this nature.
		var $el = $(el), $D = $el.closest('.ui-dialog-content'); //$D is the dialog content area. used for context.
		//first, close all the other open dropdowns.
		$('.dropDownArrowPressed',$D).removeClass('dropDownArrowPressed'); // this is the 'active' state for the dropdown button when it's menu is open.
		$('.dropDownList',$D).hide(); 
		
		if($(el).hasClass('dropDownArrowDisabled')) {
			//the dropdown is disabled. do nothing.
			}
		else	{
			var $dropdown = $el.next('.dropDownList');
			$el.addClass('dropDownArrowPressed');
			$dropdown.fadeIn('fast');
			// close the menu on the first click anywhere on the page.
			$(document.body).one('click',function(){
				$dropdown.fadeOut('fast');
				$el.removeClass('dropDownArrowPressed');
				});
			}
		}

	// When user presses li - we insert selected value to the input and hide the recommendations ul
	// $(el).parent().prev().prev() - this is the <input>
	function handleDropDownList(el) {
//		$(el).parent().fadeOut('fast').prev('.dropDownArrow').removeClass('dropDownArrowPressed');
//* 201352 -> closing the dropdown and changing the class are handled by the 'one' click event added in handleDropDownArrow - jt
		if($(el).hasClass('dropDownOwn')) {
			$(el).parent().prev().prev().val('').change().focus();
		} else {
			$(el).parent().prev().prev().val($(el).text()).change();
		}
	}

	// Add 2 inputs for custom Key:Value
	function handleAddCustomSpecific(key,value) {
		key = key || '';
		value = value || '';

		// check if we already have such key name in .customSpecificsInputs block
		var found = 0;
		if(key && value) {
			$('input.customNameInput', $(ebaySpecsBlock+' .customSpecificsInputs')).each(function() {
				if($(this).val() && $(this).val().toUpperCase() === key.toUpperCase()) {
					found = 1;
					$(this).val(key);
					$(this).parent().next().find('input.customValueInput').val(value);
				}
			});
		}

		// there's no such custom item specific - let's add it
		if(!found) {
			var $keyInput = $('<input type="text" size="40" maxlength="50" class="customNameInput" />').val(key);
			var $valueInput = $('<input type="text" size="40" maxlength="50" class="customValueInput" />').val(value);

			var $keyLabel = $('<label/>').append("Specific name<br/>").append($keyInput);
			var $valueLabel = $('<label/>').append("Specific value<br/>").append($valueInput);

			var $kv = $('<div class="kv"></div>').append($keyLabel).append($valueLabel).append('<span class="removeBtn">Remove</span>').addClass('hidden');
			$kv.find('.removeBtn').click(function() { $(this).parent().css('background-color','#fcc').fadeOut(function(){ $(this).remove() }) });
			$(ebaySpecsBlock+' .customSpecificsInputs').append($kv);
			$(ebaySpecsBlock+' .customSpecificsInputs').find('.kv').last().fadeIn(function() { $(this).removeClass('hidden' )});
		}
	}

	// 'Remove' link in fieldset legend handler - if user wants to remove the fieldset from interface
	function handleRemoveFieldSet(el) {
		var recName = $(el).parent().find('b').text();
		$(ebaySpecsBlock+' .hiddenFieldSetControls .addFieldSet[for="'+recName+'"]').fadeIn().css('display','inline-block');
		$(el).parent().parent().css('background','#fdd').fadeOut();
	}

	// Returns the firldset back to the interface if user changed his mind (see handleRemoveFieldSet)
	function handleAddFieldSet(el) {
		var recName = $(el).attr('for');
		$(ebaySpecsBlock+' fieldset[data-name="'+recName+'"]').css('background','#fff').fadeIn();
		$(el).fadeOut();
	}

	// takes some sample product and restores the form (using 'ebay:itemspecifics')
	function handleRestore(product) {
		if(product && product['ebay:itemspecifics']) {
			var specifics = product['ebay:itemspecifics'].split(/\n/);
			$.each(specifics, function(index) {
				// skip if not a Key:Value format
				if(specifics[index].search(/\:/) == -1) {
					return true;
				}
				var nameValue = specifics[index].split(/:/);
				var sName = nameValue[0];
				var sValue = nameValue[1];
				
				// try to find aproppriate input/select and insert sValue there
				var found = 0;

				// restore smart suggest or basic <input>
				$('input[type=text]', $(ebaySpecsBlock)).each(function() {
					// we need case-insensitive comparison, to be sure "Brand", "BRAND" and "brand" mean the same
					if($(this).attr('name') && $(this).attr('name').toUpperCase() === sName.toUpperCase()) { $(this).val(sValue).change(); found = 1; }
				});

				// restore <select>
				$('select', $(ebaySpecsBlock)).each(function() {
					if($(this).attr('name') && $(this).attr('name').toUpperCase() === sName.toUpperCase()) { $(this).val(sValue).change(); found = 1; }
				});

				// restore/add checkboxes
				if(!found) {
					var sValues = sValue.split(/\|\|/);
					$.each(sValues, function(i) {
						var v = sValues[i];
						var checkboxFound = 0;
						$('input[type=checkbox]', $(ebaySpecsBlock)).each(function() {
							if($(this).attr('name') && $(this).attr('name').toUpperCase() === sName.toUpperCase()) {
								found = 1;

								if($(this).attr('value') && $(this).attr('value').toUpperCase() === v.toUpperCase()) {
									$(this).prop('checked',true).parent().show();
									checkboxFound = 1;
								}
							}
						});

						if(found && !checkboxFound) {
							$('fieldset', $(ebaySpecsBlock)).each(function() {
								if($(this).attr('name') && $(this).attr('data-name').toUpperCase() === sName.toUpperCase()) {
									$('.addCheckbox', $(this)).val(v);
									$('.addCheckboxBtn', $(this)).click();
								}
							});
						}
					})
				} 
				// END restore/add checkboxes

				// Finally restore Custom Specifics
				if(!found) {
					handleAddCustomSpecific(sName,sValue);
				}

			});
		}
	}

	// checks that all required fields are filled
	// returns error string or ''
	function handleValidate(form) {
		$('.result').hide();
		var errorText = '';
		$(form).find('fieldset[required]').each(function(){
			var isFilled = 0;
			$(this).find("select:enabled,input:text:enabled,input:checkbox:enabled:checked").each(function(){
				if($(this).val()) {
					isFilled = 1;
				}
			});

			if(!isFilled) {
				errorText += '<b>'+$(this).find('legend b').first().text()+'</b> is required.<br/>';
			}
		});

		if(errorText) {
			showErrorBalloon($(form),errorText,5000);
			/*$('html, body').animate({ scrollTop: $(form).find('.errorBalloon').last().offset().top }, 600);*/
			return errorText;
		} else {
			return '';
		}
	}

	// red error balloon - we use it in handleValidate and handleAddCheckbox
	function showErrorBalloon(el,text,duration) {
		duration = duration || 1500;
		if(!$(el).parent().find('.errorBalloon').length) {
			$(el).parent().append('<div class="errorBalloon"></div>');
		}
		$(el).parent().find('.errorBalloon').html(text).fadeIn().delay(duration).fadeOut();
	}
	
	// ========== END ebaySpecificsFormBuild - helper methods ===========
	
})( jQuery );