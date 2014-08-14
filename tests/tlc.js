function loadGrammar()	{
	console.log("Attempt to fetch the grammar file");
	return $.ajax({
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



//dump is used in tlc 
function dump(v)	{
	if(typeof console != 'undefined')	{console.log(v)}
	}


function runTests()	{
	window.myCreole = new Parse.Simple.Creole();
	$._app = {'vars':{}} //tlc checks this for a debug var (not part of this test)
	var dataset = {
		'name' : 'bob',
		'long-string' : 'this is a long string to use for testing.',
		'epochts' : 1395787429,
		'number' : 10,
		'html' : "<h1>This is some html</h1><p>Isn't it wonderful</p>",
		'tag' : "<div>testing</div>",
		'wiki' : "= This is a wiki h1 =",
		'wiki2' : "=This is a wiki h1=",
//		'undefined' : undefined,  do NOT comment this out.  It's here to serve as a reminder that this is called but should NOT be defined. allows for testing on an undefined value.
		'blank' : '',
		'null' : null,
		'small-array' : ["frank","albert","tom","harry"],
		'small-hash' : {'name':'ron','nickname' : 'tater salad'},
		'price' : 24.95,
		'decimal' : 18.9,
		'negative' : -3,
		'negative-string' : '-5.23',
		'cents' : .71,
		'boolean-true' : true,
		'boolean-false' : false,
		'string-false' : 'false',
		'uppercase' : 'HAN'
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
			case 'string-compare':
				//a separate test type was needed for stringify. data-compare="{'something'... was converted to an object by jquery.
				ok( JSON.stringify($ele.data('string')) == $ele.text(), $ele.data('testname') || 'Passed!' );
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
		$("[data-testtype]",'#verb-tests').each(function(index){
			var $ele = $(this);
			if($ele.data('testtype'))	{
				testElement($ele);
				}
			}); //loop
		//now run the 'unique' tests.
		ok($('#child-gets-replaced').html() == 'bob', "replace" );
		ok($('#child-gets-replaced2').text() == 'testing', "replace 2" );
		ok($.trim($('#this-should-be-empty').html()) == '', "remove" );
		});
	test( "TLC Formats", function() {
		$("[data-testtype]",'#format-tests').each(function(index){
			var $ele = $(this);
			if($ele.data('testtype'))	{
				testElement($ele);
				}
			}); //loop
		});
	test( "TLC Math", function() {
		$("[data-testtype]",'#math-tests').each(function(index){
			var $ele = $(this);
			if($ele.data('testtype'))	{
				testElement($ele);
				}
			}); //loop
		});	
	test( "TLC Time", function() {
		$("[data-testtype]",'#time-tests').each(function(index){
			var $ele = $(this);
			if($ele.data('testtype'))	{
				testElement($ele);
				}
			}); //loop
		});
	test( "TLC Stringify", function() {
		$("[data-testtype]",'#stringify-tests').each(function(index){
			var $ele = $(this);
			if($ele.data('testtype'))	{
				testElement($ele);
				}
			}); //loop
		});
	test( "TLC Comparisons", function() {
		$("[data-testtype]",'#comparison-tests').each(function(index){
			var $ele = $(this);
			if($ele.data('testtype'))	{
				testElement($ele);
				}
			}); //loop
		});
	test( "TLC render", function() {
		$("[data-testtype]",'#render-tests').each(function(index){
			var $ele = $(this);
			if($ele.data('testtype'))	{
				testElement($ele);
				}
			}); //loop
		});
	
	}
