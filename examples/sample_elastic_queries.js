{
	"query" : {
		"term" : { "tags" : "IS_NEWARRIVAL" }
	},
	"size":"100",
	"mode":"elastic-native",
	"filter" : {
		"and" : [
			{"range" : {"base_price" : {"from" : "1000","to" : "8000"}}},
			{"term" : { "profile" : "E31" }}
		]
	}
}





{
"size":"100",
"mode":"elastic-native",
"filter":{
	"term":{"tags":"IS_NEWARRIVAL"}
	}
}


{
"size":"100",
"mode":"elastic-native",
"filter":{
	"range" : {
		"base_price" : {
			"from" : "1000", 
			"to" : "2000", 
			"include_lower" : true, 
			"include_upper" : false
			}
		}
	}
}