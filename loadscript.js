var app = app || {vars:{},u:{}}; //make sure app exists.

//http://www.nczonline.net/blog/2009/07/28/the-best-way-to-load-external-javascript/
app.u.loadScript = function(url, callback){
	app.u.dump("load script: "+url);
    var script = document.createElement("script");
    script.type = "text/javascript";
    if (script.readyState){  //IE
        script.onreadystatechange = function(){
            if (script.readyState == "loaded" || script.readyState == "complete"){
                script.onreadystatechange = null;
				if(typeof callback == 'function')	{callback();}
				}
			};
		}
	else {
		if(typeof callback == 'function')	{
			script.onload = function(){callback()}
			}
    	}
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
	}

/*
this function gets overwritten when the control object is instantiated.
keep this small and light.
*/
app.u.dump = function(msg)	{
//if the console isn't open, an error occurs, so check to make sure it's defined. If not, do nothing.
	if(typeof console != 'undefined')	{console.log(msg);}
	} //dump