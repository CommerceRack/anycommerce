function productFlip($obj)
{
	if($obj.closest("div.prodDetailView").length < 1)
	{
	var dir = "TOP";
	var pind = $obj.index();

	if(((pind + 1) % 2) == 0)
	{
		dir = "LEFT";
	}

	//if($obj.attr("flipped") != "true")
	//{
		if($obj.find("div.prodItemPane").html().indexOf("flippy") < 0)
		{
			$obj.find("div.prodItemHoldData").html($obj.find("div.prodItemPane").html());
			$obj.css("border","none");
			$obj.css("height","220px");
			$obj.css("width","220px");
			$obj.css("box-shadow","none");
			$obj.find(".quickView").css("right","7px");
			$obj.find(".quickView").css("top","7px");
			
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
						$obj.removeAttr("style");
						$obj.find(".quickView").css("right","5px");
						$obj.find(".quickView").css("top","5px");						
					}
				}
			});
		}
	//}
	}
}

/*function productFlip($obj)
{
	var dir = "TOP";
	var pind = $obj.parent().index();

	if(((pind + 1) % 2) == 0)
	{
		dir = "LEFT";
	}

	if($obj.attr("flipped") != "true")
	{
		$obj.parent().find("div.prodItemHoldData").html($obj.html());
		$obj.attr("flipped","true");
		$obj.flippy(
		{
			content: $obj.parent().find("div.prodItemAltData").html(),
			direction: dir,
			duration:"200",
			onStart:function(){
			},
			onFinish:function(){
				$obj.parent().find("div.prodItemAltData").html($obj.parent().find("div.prodItemHoldData").html());
				$obj.parent().find("div.prodItemHoldData").html("");			
			}
		});
	
	}
}*/

function prepFlip($obj)
{
	$obj.removeAttr("flipped");
}

$(document).ready(function()
{
	$("div#mainContentArea div").each(function()
	{
		if($(this).css("display") == "none")
		{
			$(this).find("div.subMenu ul").each(function()
			{
				$(this).html();
			});
		}
	});
	$("div.navContent ul li").mouseover(function()
	{
		$(this).css("border-top","2px solid #3c0000");
		$(this).css("border-left","2px solid #3c0000");
		$(this).css("border-right","2px solid #a31313");
		$(this).css("border-bottom","2px solid #9a4646");
		$(this).css("height","46px");
		$(this).css("background","url('site/images/background-nav-active.png')");
		$(this).css("padding-left","8px");
		$(this).css("padding-right","8px");
		$(this).find("a").css("top","15px");
		$(this).find("div.subMenu").show();
		$(this).find("div.subMenu").stop().animate({"height":"379px"}, 1000);
	});
	$("div.navContent ul li").mouseout(function()
	{
		$(this).removeAttr("style");
		$(this).find("a").removeAttr("style");	
		$(this).find("div.subMenu").stop().animate({"height":"0px"}, 1000);		
		$(this).find("div.subMenu").hide();
	});
});