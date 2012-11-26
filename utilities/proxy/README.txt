=================================

spiffy proxy-webserver built in node.js
by brianh  Sun Nov 25 18:50:30 PST 2012

=================================

this is intended to provide a local http based webserver with proxy capabilities for api calls
i tried valiently to get https working, but alas node.js support sucked at doing the "CONNECT"
call I needed.

the idea here to serve YOUR local files directly to the browser as if they were at www.domain.com
currently the proxy is hardcoded to a predefined path ex: /biz/app to lookup files, but will pass
on any other requests NOT at the path to the original host. Ex: api calls, graphics, etc.

This creates a situation where the browser THINK's it's loading all the files off production, 
but in reality it's loading local copies.  It stops the preflight/CORS situations.  This not only
makes reloads smoking fast -- but also means there is no need to push to github and wait to see
how things look on production.

TO SETUP (ON WINDOWS)

first download and install node.js
next install firefox, and the plugin foxyproxy
configure foxyproxy and add a proxy with the following settings:
	[Proxy Details]
		Host or IP Address: 127.0.0.1
		Port: 8081
	[URL Patterns]
		Pattern Name: Zoovy
		URL Pattern: ^http://.*\.zoovy\.com.*$
		
Then configure FoxyProxy so it "Use proxies based on their pre-defined patterns and priorites"
At this point I'd recommend closing firefox and re-opening it
If you did everything right firefox won't be able to access the http://www.zoovy.com homepage 
It WILL be able to access htps://www.zoovy.com
If you're not comfortable with proxies, then this is a great sanity check -- go ahead and try it, i'll wait. 

Alright once the proxies are configured
-- now load a node.js command prompt
navigate to the Anycommerce SDK root \ Utilities \ Proxy
type: node proxy-web.js
You'll see a HTTP-PROXY welcome banner

Now try and access the http://www.zoovy.com and you'll go through the local proxy
Any requests to read files at www.zoovy.com/biz/app will be served from your local SDK

In addition it's probably possible to get this working so that www.clientdomain.com is served locally,
but /jquery/config.js etc, are grabbed remotely. we'll need to test that.

It also creates a spiffy way to test in chrome using local files .. and once I figure out how to get
SSL support it will be even easier to setup without tools like foxyproxy.

eventually I hope this proxy will be the basis for the api testing layer, and have a set of automated
tests run through phantom.js

---------------------


