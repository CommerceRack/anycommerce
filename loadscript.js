var app = app || {vars:{},u:{}}; //make sure app exists.

//http://www.nczonline.net/blog/2009/07/28/the-best-way-to-load-external-javascript/
app.u.loadScript = function(url, callback, params){
//	app.u.dump("load script: "+url);
    var script = document.createElement("script");
    script.type = "text/javascript";
    if (script.readyState){  //IE
        script.onreadystatechange = function(){
            if (script.readyState == "loaded" || script.readyState == "complete"){
                script.onreadystatechange = null;
				if(typeof callback == 'function')	{callback(params);}
				}
			};
		}
	else {
		if(typeof callback == 'function')	{
			script.onload = function(){callback(params)}
			}
    	}
//append release to the end of included files to reduce likelyhood of caching.
	url += (url.indexOf('?') > -1 ) ? '&' : '?'; //add as initial or additional param based on whether or not any params are already present.
	url += "_v="+app.vars.release;

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
	}



/*
Will load all scripts and extenstions with pass = 0.
pass with any other value (including blank,null, undefined, etc) will get loaded later.
this function is overwritten once the myRIA callback occurs with a similar but more powerful function (ignores pass, supports css).
app.rq.push() = app.u.handleResourceQ so whatever the values in push() are get executed immediately.
*/

app.u.handleRQ = function()	{
	app.u.dump("BEGIN app.u.handleRQ");
	var numIncludes = 0; //what is returned. The total number of includes for this pass.
	var L = app.rq.length - 1;

	app.vars.extensions = app.vars.extensions || []; //ensure array is defined.
	app.vars.rq = new Array(); //to avoid any duplication, as iteration occurs, items are moved from app.rq into this tmp array. 

//the callback added to the loadScript on type 'script' sets the last value of the resource array to true.
//another script will go through this array and make sure all values are true for validation. That script will execute the callback (once all scripts are loaded).
	var callback = function(index){
		app.vars.rq[index][app.vars.rq[index].length - 1] = true; //last index in array is for 'is loaded'. set to false in loop below.
		}

	for(var i = L; i >= 0; i--)	{
//		app.u.dump("app.rq["+i+"][0]: "+app.rq[i][0]+" pass: "+app.rq[i][1]);
		if(app.rq[i][0] == 'script' && app.rq[i][1] === 0)	{
//			app.u.dump(" -> load it!");
			numIncludes++;
			app.rq[i][app.rq[i].length] = false; //will get set to true when script loads as part of callback.
			app.vars.rq.push(app.rq[i]); //add to pass zero rq.
			app.u.loadScript(app.rq[i][2],callback,(app.vars.rq.length - 1));
			app.rq.splice(i, 1); //remove from new array to avoid dupes.
			}
		else if(app.rq[i][0] == 'extension' && app.rq[i][1] === 0)	{
			numIncludes++;
			app.vars.extensions.push({"namespace":app.rq[i][2],"filename":app.rq[i][3],"callback":app.rq[i][4]}); //add to extension Q.
			app.rq[i][app.rq[i].length] = false; //will get set to true when script loads as part of callback.
			app.vars.rq.push(app.rq[i]); //add to pass zero rq.
//			app.u.dump(" -> app.rq[i][2]: "+app.rq[i][2]);
//on pass 0, for extensions , their specific callback is not added (if there is one.)
// because the model will execute it for all extensions once the controller is initiated.
// so instead, a generic callback function is added to track if the extension is done loading.
// which is why the extension is added to the extension Q (above).
			app.u.loadScript(app.rq[i][3],callback,(app.vars.rq.length - 1));
			app.rq.splice(i, 1); //remove from old array to avoid dupes.
			}
		else	{
//currently, this function is intended for pass 0 only, so if an item isn't pass 0,do nothing with it.
			}
		}
//	app.u.dump("numIncludes: "+numIncludes);
	app.u.initMVC(0);
	return numIncludes;

	}



/*
this function gets overwritten when the control object is instantiated.
keep this small and light.
*/
app.u.dump = function(msg)	{
//if the console isn't open, an error occurs, so check to make sure it's defined. If not, do nothing.
	if(typeof console != 'undefined')	{console.log(msg);}
	} //dump