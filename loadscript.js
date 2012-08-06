//http://www.nczonline.net/blog/2009/07/28/the-best-way-to-load-external-javascript/
function loadScript(url, callback){
//	acDump("load script: "+url)
    var script = document.createElement("script")
    script.type = "text/javascript";

    if (script.readyState){  //IE
        script.onreadystatechange = function(){
            if (script.readyState == "loaded" || script.readyState == "complete"){
                script.onreadystatechange = null;
				if(typeof callback == 'function')	{callback();}
				}
			};
		}
	else {  //Others
		if(typeof callback == 'function')	{
//			acDump(' -> callback is a function');
			script.onload = function(){callback()}
			}
    	}

    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
	}



// a function for dumping to the console. It is present in this first loading script because it is used as a diagnostic tool so frequently.
function acDump(msg)	{
//if the console isn't open, an error occurs, so check to make sure it's defined. If not, do nothing.
	if(typeof console != 'undefined')	{
		if(typeof console.dir == 'function' && typeof msg == 'object')	{
		//IE8 doesn't support console.dir.
			console.dir(msg);
			}
		else if(typeof console.dir == 'undefined' && typeof msg == 'object')	{
			//browser doesn't support writing object to console. probably IE8.
			console.log('object output not supported');
			}
		else
			console.log(msg);
		}
	} //dump