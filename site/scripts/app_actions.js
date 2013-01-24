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