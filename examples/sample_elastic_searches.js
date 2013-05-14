/*************************************************************************************************

Some General Notes on Elastic Searches:

An elasticsearch, the top-level object passed as part of the appPublicSearch call, contains several
parameters that dictate the number of results returned, the type of results to search, and most
importantly, the search itself.  This guide contains only the searches, as usually the other
parameters are handled by the app framework and should not need editing.

A search contains either 

1) a QUERY 

or

2) a FILTER

QUERIES perform relevance calculations, meaning that results can be ordered.  For this reason, they
are also slower.

FILTERS do not perform relevance calculations, and are much faster.  There are FILTERS that contain
QUERIES.  It can get a little hairy, which is why this guide is here!  For detailed reference, see 
the elasticsearch api: http://elasticsearch.org.

If you come up with a crazy awesome elastic search of epicness, please let us know at the AnyCommerce
Google Group : https://groups.google.com/forum/#!forum/anycommerce-app-development

*************************************************************************************************/

//Keyword Search, searching a custom list of fields
{
	"query": {
		"query_string": {
			"query": "my keywords here",
			"fields": ["prod_name","description"]
		}
	}
}

//Finds all products tagged as new arrivals.  Does not perform relevance calculations, as it is a filter.
{
	"filter": {
		"term": {
			"tags": "IS_NEWARRIVAL"
		}
	}
}

//A range filter over price
{
	"filter": {
		"range": {
			"base_price": {
				"from": "1000",
				"to": "2000",
				"include_lower": true,
				"include_upper": false
			}
		}
	}
}

//The 'filtered' query contains a query, and a filter.  And it applies that filter, to that query.
//I know what you're thinking...
//NO! It's not like an "and" filter!
//Why?
//Because the query performs relevance calculations!  And then you can filter out certain results.
{
	"query": {
		"filtered": {
			"query": {
				"query_string": {
					"query": "mario"
				}
			},
			"filter": {
				"range": {
					"base_price": {
						"from": "1000",
						"to": "2000",
						"include_lower": true,
						"include_upper": false
					}
				}
			}
		}
	}
}

//A filter score boost query, which allows you to perform a query, and boost the results' 
//relevance scores according to an array of filters.  The 'boost' affects the _score field.

//This example searches for the keyword "mario" and boosts any results that contain the string 
//"action figure" in the product name.
{
	"query": {
		"custom_filters_score": {
			"query": {
				"query_string": {
					"query": "mario"
				}
			},
			"filters": [{
				"filter": {
					"query": {
						"field": {
							"prod_name": "action figure"
						}
					}
				},
				"boost": 10
			}]
		}
	}
}