// ----------------------------------------------------------------------------
// markItUp!
// ----------------------------------------------------------------------------
// Copyright (C) 2008 Jay Salvat
// http://markitup.jaysalvat.com/
// ----------------------------------------------------------------------------
mySettings = {	
	markupSet:  [
		{	name:'Table generator', 
			className:'tablegenerator', 
			placeholder:"Your text here...",
			replaceWith:function(h) {
				var cols = prompt("How many cols?"),
					rows = prompt("How many rows?"),
					html = "{|\n";
				if (h.altKey) {
					for (var c = 0; c < cols; c++) {
						html += "! [![TH"+(c+1)+" text:]!]\n";	
					}	
				}
				for (var r = 0; r < rows; r++) {
					html+= "|-\n";
					for (var c = 0; c < cols; c++) {
						html += "| "+(h.placeholder||"")+"\n";	
					}
				}
				html += "|}\n";
				return html;
			}
		}
	]
}