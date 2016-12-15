# API Flow

## Making API Calls, Pipelining

API calls are made by sending a POST request to `/jsonapi/` on a particular store's domain

* www.domain.com/jsonapi/

The POST body should contain:

 * **_clientid** : a client id, usually set to "zmvc" for store fronts
 * **_version** : the version of the API you wish to work with
 * **_uuid** : a uuid for the request
 * **_cmd** : the API command you wish to execute.
 
Depending on the API command you are calling, other parameters may be required as part of the POST body.
Among the most common parameters is the `_cartid`, see the **Cart, Checkout, and Login Flow** section below.
For full details, see the [API Documentation](http://commercerack.github.io/apidocs/)

### Pipelining API Calls

You may execute multiple API calls on the same POST request by using the `pipeline` command.  To do so-

 * set `_cmd` to "pipeline"
 * provide another parameter, `@cmds`, as an array of individual API requests, each with their own `_cmd`

The `_clientid`, `_version`, and `_cartid` set on the parent `pipeline` command will be applied to
each individual request and need not be repeated.  Should they differ for that particular request, they may
be set individually.  `_uuid` should still be passed for each command, and should, as the name implies, be unique

Pipelined requests will return an array, `@rcmds`, populated with the responses to each command (array indices will correspond).

## Pages

### Category Pages

LEGACY NOTE: going forward, categories may be a less useful alternative to filtered search pages

* **appNavcatDetail** : takes a `path` (navcat) and returns information about that category
* **appProductGet** : takes a `pid` and returns information about that product.  Needed if you want to render 
	product details, since the `appNavcatDetail` returns `@products`, an array of pids, not full product detail
* **appNavcatDetail** : takes a `path` and returns page namespace information about that category
	* LEGACY NOTE: currently many apps populate the page namespace themselves, using the /platform/pages.json file
		inside the project repo tied to a domain.  This will need to be addressed for any major changes.

#### Home Page

The homepage is a special case of a category page.  It should use the root navcat, as specified in the domain's 
`/jsonapi/config.js` file (typically the root navcat is just `.`)

Additional information may be needed to render the page on a client-by-client basis.  Examples include

* **Bestseller search** : an `appPublicSearch` call, with `filter : {terms:{tags:"IS_BESTSELLER"}}`
* **Other tag searches** : an `appPublicSearch` call, example `filter : {terms:{tags:"IS_USER5"}}` where the `is:user5` attribute represents pertinent information (special promo, etc...)
* **Custom Product Lists** : either using `appNavcatDetail` for a path starting with "$", or even for just an app-coded list of PIDs

### Product Pages

* **appProductGet** : takes a `pid` and returns information about the product.  At this point, using `withInventory` and `withVariations` 
	both set to 1 on the request is recommended, so that the app can render product variation form elements, and tell if the specified SKU is purchaseable.
	* note: the `zoovy:related_products` field returned is a comma separated list of PIDs, so to render those, additional `appProductGet` calls may be required
	* you may choose to request related products using an `appPublicSearch` call, utilizing some information in the product for the query or filter
* **cartItemAppend** : see cart flow below for complete information
	* Any variations must also be passed to this call, ex: `{_cmd:"cartItemAppend",_cartid:"...",sku:"product_pid",variations:{A0:"02", A1:"01"}}`

#### Product Variations and SKUs

Product variations have an ID, a type, and an array of potential values.  In a completed sku, the variation id's and their 
applied values are appended to the pid- for example the SKU of the item added to the cart above would be `product_pid:A002:A101`

### Company Pages

LEGACY NOTE: company information can not currently be stored or accessed via the API, except perhaps through the use of the page namespace
For truly UI configurable apps, this will need to be addressed.

### Customer Pages

See Login flow below for details on logging in via the API. Once logged in, you may access buyer information via
the API using [`buyer` calls](http://commercerack.github.io/apidocs/#api-buyer)

Note that login sessions for the front end are attached to the cart, rather than using an authtoken as in the AdminUI.
As such, passing the `_cartid` is sufficient to specify the buyer you are attempting to access, no `cid` is needed.

## Cart, Checkout, and Login Flow

#### Cart Creation

* **appCartCreate** : no special parameters.  Creates a cart, and returns a `_cartid` for use in subsequent calls
* **appCartExists** : can be used to check if a `_cartid` exists.  
	* Useful for storing cartid's in localStorage, and then checking if the cart is still valid.  
	* Also useful for after an order has already been placed- **NOTE** if you create a second order using the same `_cartid` the second order **WILL OVERWRITE THE FIRST ONE AND MAKE YOU CRY**

#### Cart Information

* **cartDetail** : will return the current state of the cart.
	* You should **ALWAYS** call cartDetail after manipulating the cart.  Many elements of the cart are calculated on the server, such as shipping methods and taxes,
	so you should never assume that whatever small change you just made does not require updating the cart from the server.  Call `cartDetail` early, and often.
* **cartItemsInventoryVerify** : will a list of quantity changes necessary to make based on inventory availability.
	* This call will **not** automatically change the quantities in the cart, it will just tell you what needs to be done.
	* You MUST follow up with `cartItemUpdate` calls

#### Cart Manipulation

* **cartItemAppend** : Adds an item to the cart with the given variations
* **cartItemUpdate** : Updates an item in the cart.  Pass `sku` from the cartDetail `@ITEMS` array, as it differs from the `pid` based on variations
* **cartSet** : Set some value on the cart.  Flatten nested parameters using `/`, for example `bill/address1` and `bill/city`
	* `want/` fields are values the customer "wants" on the cart.
		* `want/payby` is used for payment method, but the actual payment information is still needed in the `cartOrderCreate` call
		* `want/shipping_id` is used to denote which shipmethod is desired
	* `bill/` fields are for the billing address.
	* `ship/` fields are for the shipping address.

#### Carts -> Orders

Once shipping and billing addresses are set, and `want/shipping_id` is set, an order can be placed with:

* **cartOrderCreate** : creates an order from the supplied `_cartid`.  
	* It is recommended that you use `async` set to 1 for async flow.
	* you must provide `@PAYMENTS` as an array of payments, example below:
	
````
paymentArray.push(
		"insert?TN=CREDIT&CC="
	+	encodeURIComponent(payment['payment/CC'])
	+	"&CV="+encodeURIComponent(payment['payment/CV'])
	+	"&YY="+encodeURIComponent(payment['payment/YY'])
	+	"&MM="+encodeURIComponent(payment['payment/MM']));
````

* **cartOrderStatus** : an async cartOrderCreate will return a `status-cartid` which is the cartid with the order id added to it.  
	This can be passed as `_cartid` to `cartOrderStatus` to determine the status of the order.  When it has finished
	being placed, cartOrderStatus will return the order invoice information, including some server-calculated `@trackers` for 3rd
	party conversion tracking, including Google Trusted Stores

#### Carts as Sessions

An [`appBuyerLogin`](http://commercerack.github.io/apidocs/#api-app-appBuyerLogin) call will attach a customer
to the `_cartid` provided, making that session "logged in" as the customer.  In addition, if `appCartCreate`
is called, and provided a `_cartid` of a cart that has a login session attached, the new _cart will have the
login session transferred over to it.