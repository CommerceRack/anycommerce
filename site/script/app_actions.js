/*function productFlip($obj)
{
	if($obj.closest("div.prodDetailView").length < 1)
	{
		var dir = "TOP";
		var pind = $obj.index();

		if(((pind + 1) % 2) == 0)
		{
			dir = "LEFT";
		}

		if($obj.find("div.prodItemPane").html().indexOf("flippy") < 0)
		{
			$obj.find("div.prodItemHoldData").html($obj.find("div.prodItemPane").html());
			$obj.css("border","none");
			$obj.css("height","220px");
			$obj.css("width","220px");
			$obj.css("box-shadow","none");
			$obj.find(".quickView").css("right","7px");
			$obj.find(".quickView").css("top","7px");
			$obj.find(".btnViewProdDetails").css("left","7px");
			$obj.find(".btnViewProdDetails").css("top","7px");			
			
			$obj.find("div.prodItemPane").flippy(
			{
				content: $obj.find("div.prodItemAltData").html(),
				direction: dir,
				duration:"400",
				onStart:function(){
					$obj.attr("flipped","true");
				},
				onFinish:function(){
					if($obj.find("div.prodItemHoldData").html().indexOf("flippy") < 0)
					{
						$obj.find("div.prodItemAltData").html($obj.find("div.prodItemHoldData").html());
						$obj.find("div.prodItemHoldData").html("");
						$obj.find("div.prodItemPane").jScrollPane({showArrows:true});
						$obj.removeAttr("style");
						$obj.find(".quickView").css("right","5px");
						$obj.find(".quickView").css("top","5px");
						$obj.find(".btnViewProdDetails").css("left","5px");
						$obj.find(".btnViewProdDetails").css("top","5px");							
					}
				}
			});
		}
	}
}

function prepFlip($obj)
{
	$obj.removeAttr("flipped");
}*/

$(document).ready(function()
{
	var carousel1;
	function foo1(){ $(".catCarousel").carouFredSel({
			auto : false,
			prev : ".btnCatBack",
			next : ".btnCatNext",
	});}
	carousel1 = foo1;
	setTimeout(carousel1, 1000);
	
	$("div.catNavContent img.btnCatNext").click(function()
	{
		$("p.currentCat").text($("div.catCarousel div.ccItem:nth-child(2)").find("h2").text());
	});
	$("div.catNavContent img.btnCatBack").click(function()
	{
		$("p.currentCat").text($("div.catCarousel div.ccItem:last-child").find("h2").text());
	});	
	$("div.catNavContent img.catButton").mouseover(function()
	{
		$(this).css("opacity",".65");
	});	
	$("div.catNavContent img.catButton").mouseout(function()
	{
		$(this).css("opacity","1");
	});		
}); 

