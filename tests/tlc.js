function loadGrammar()	{
	console.log("Attempt to fetch the grammar file");

	$.ajax({
		'url' : 'resources/pegjs-grammar-20140203.pegjs', //append release to eliminate caching on new releases.
		'dataType' : 'html',
		'error' : function()	{
			console.error('An error occured while attempting to load the grammar file. Can not run the test without that file');
			},
		'success' : function(file){
			var success;
			try{
				var pegParserSource = PEG.buildParser(file);
				window.pegParser = eval(pegParserSource); //make sure pegParser is valid.
				success = true;
				}
			catch(e)	{
				console.error(buildErrorMessage(e));
				}
			if(success)	{
				console.log(" -> successfully built pegParser. now run the tests.");
				runTests();
				}
			else	{
				$('#globalMessaging').anymessage({'errtype':'fail-fatal','message':'The grammar file did not pass evaluation. It may contain errors (check console). The rendering engine will not run without that file.'});
				}
			}
		});
	}


function runTests()	{
	$._app = {'vars':{}} //tlc checks this for a debug var (not part of this test)
	var dataset = {
		'name' : 'bob',
		number : 10,
		smallArray : ["frank","albert","tom","harry"],
		price : 24.95,
		'boolean-true' : true,
		'boolean-false' : false
		}

	$('#sample-template').tlc({'verb':'translate','dataset':dataset});
	
	
	
	var testElement = function($ele)	{
//		console.log(" -> $ele.data('testtype'): "+$ele.data('testtype'));
		switch($ele.data('testtype'))	{
			case 'unique':
				//add this to an element that has it's own test. That way it doesn't throw a warning to the console.
				break;
			case 'output-compare':
				ok( $ele.data('output') == $ele.text(), $ele.data('testname') || 'Passed!' );
				break;
			case 'visible':
				ok( $ele.data('visible') == $ele.is(':visible'), $ele.data('testname') || 'Passed!' );
				break;
			case 'add-class':
				ok( $ele.hasClass($ele.data('class')) == true, $ele.data('testname') || 'Passed!' );
				break;
			case 'remove-class':
				ok( $ele.hasClass($ele.data('class')) == false, $ele.data('testname') || 'Passed!' );
				break;
			case 'input-value':
				ok( $ele.data('value') == $ele.val(), $ele.data('testname') || 'Passed!' );
				break;
			case 'is-checked':
				ok( $ele.data('checked') == $ele.is(':checked'), $ele.data('testname') || 'Passed!' );
				break;
			case 'is-selected':
				ok( $ele.data('selected') == $ele.is(':selected'), $ele.data('testname') || 'Passed!' );
				break;
			case 'attrib':
				ok( $ele.attr($ele.data('attrib')) == $ele.data('attribvalue'), $ele.data('testname') || 'Passed!' );
				break;
			
			default:
				console.warn("No valid test case for "+$ele.data('testtype'));
			}
		}
	
//first param is the pretty name of the test itself.
//second param is function that contains actual testing code.
	test( "TLC Verbs", function() {
		$("[data-tlc]",'#verb-tests').each(function(index){
			var $ele = $(this);
			if($ele.data('testtype'))	{
				testElement($ele);
				}
			}); //loop
		//now run the 'unique' tests.
		ok($('#child-gets-replaced').html() == 'bob', "replace" );
		});
	
	test( "TLC Formats", function() {
		$("[data-tlc]",'#format-tests').each(function(index){
			var $ele = $(this);
			if($ele.data('testtype'))	{
				testElement($ele);
				}
			}); //loop
		});
	
	}
