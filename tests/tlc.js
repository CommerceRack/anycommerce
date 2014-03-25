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
		number : 10
		}
	var $template = $('#sample-template');
	$template.tlc({'verb':'translate','dataset':dataset});
	

//first param is the pretty name of the test itself.
//second param is function that contains actual testing code.
	test( "TLC Verbs", function() {
		
		$("[data-tlc]",$template).each(function(index){
			var $ele = $(this);
			if($ele.data('testtype'))	{
				switch($ele.data('testtype'))	{
					case 'unique':
						//add this to an element that has it's own test. That way it doesn't throw a warning to the console.
						break;
					case 'output-compare':
						ok( $ele.data('output') == $ele.text(), "Passed!" );
						break;
					case 'visible':
						ok( $ele.data('visible') == $ele.is(':visible'), "Passed!" );
						break;
					case 'add-class':
						ok( $ele.hasClass($ele.data('class')) == true, "Passed!" );
						break;
					case 'remove-class':
						ok( $ele.hasClass($ele.data('class')) == false, "Passed!" );
						break;
						
					default:
						console.warn("No valid test case for "+$ele.data('testtype'));
					}
				}
			else	{
				console.warn("The element with data-tlc [ "+ $ele.data('tlc') +" ] did not have a data-test set");
				}
			}); //loop

		//now run the 'unique' tests.
		ok($('#child-gets-replaced').html() == 'bob', "Passed!" );
		});
	}
