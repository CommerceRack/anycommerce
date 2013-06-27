jQuery(document).ready(function()
{
	var carousel1;
	function foo1(){ $(".catCarousel").carouFredSel({
			auto : false,
			items   : 5,
			scroll: 1
	});}
	carousel1 = foo1;
	setTimeout(carousel1, 1000);
	$("div.catNavContent img.btnCatNext").click(function()
	{
		$('.prevCat').text($("div.catCarousel div.ccItem:nth-child(1)").find("h2").text());
		$("p.currentCat").text($("div.catCarousel div.ccItem:nth-child(2)").find("h2").text());
		$('.nextCat').text($("div.catCarousel div.ccItem:nth-child(3)").find("h2").text());
	});
	$("div.catNavContent img.btnCatBack").click(function()
	{
		$('.prevCat').text($("div.catCarousel div.ccItem:nth-child(1)").find("h2").text());
		$("p.currentCat").text($("div.catCarousel div.ccItem:last").find("h2").text());
		$('.nextCat').text($("div.catCarousel div.ccItem:nth-child(3)").find("h2").text());
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

