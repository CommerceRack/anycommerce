AnyCommerce Framework - v.201405

Description: 
Rich Internet Application, Model View Controller created using jQuery for creating awesome shopping applications that 
connects to the CommerceRack Backend-As-A-Service (BAAS) via a JSON/REST API.

Official Repository:
	https://github.com/Commercerack/anycommerce

Examples are stored in examples sub-directory.
Extensions are stored in the extensions sub-directory.
MIT License stored in license.txt

-------------------------------------------------------------------------------

Hey Developers!!

When you fork this REPO - please write any project specific notes such as the URL's to the podio/basecamp project along 
with usability instructions into this file.  

Custom functionality should be documented how it is /supposed to work/ here, along with contact info for who is the 
responsible party for maintenance. 

Thanks!


## Stack Diagram
![Stack Diagram](/stackdiagram.png)
## Extension structure

### callbacks
Callback objects (consisting of onSuccess and onError functions) to be referenced in API requests.  The appropriate function (success or error)
will be called by the model when the API request returns

**SPECIAL:** The init callback is called when the extension is first loaded, and can be used to perform any setup needed (initialize variables, etc...)

### u
general utility functions, callable by _app.ext.myextension.u.someFunction();

### a
action functions- generally only called during user input, ie a click event.  Mostly legacy at this point, replaced by e:

### e
event functions- these are called automatically when a user triggers a browser event on an element that has a data-app-<event> attribute.

For example: <div data-app-click="myextension|someEventFunction"></div> will call _app.ext.myextesnion.e.someEventFunction() when the element is clicked.

### tlcformats
TLC functions.  These can be called from tlc with the syntax <div data-tlc="myextension#someformat --arg='someArg';"></div> (uses _app.ext.myextension.tlcformats.someformat)

Note: they must be all lowercase.

### couplers
functions made available via _app.couple (but do not require extension initialization before it is called).

### renderformats
DEPRECATED: used for legacy data-bind syntax, or when --legacy is passed to TLC.