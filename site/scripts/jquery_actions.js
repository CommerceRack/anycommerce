$(document).ready(function()
{
	var number = 1 + Math.floor(Math.random() * 4);
	$("div#headerFreeShipping img").attr("data-note",number);
	$("div#headerFreeShipping img").attr("src","site/images/header-free-shipping-icon-" + (number) + ".png");
	setInterval(function() 
	{
		$("div#headerFreeShipping img").hide();
		var number = 1 + Math.floor(Math.random() * 4);
		while(number == parseInt($("div#headerFreeShipping img").attr("data-note")))
		{
			number = 1 + Math.floor(Math.random() * 4);
		}		
		$("div#headerFreeShipping img").attr("data-note",number);		
		$("div#headerFreeShipping img").attr("src","site/images/header-free-shipping-icon-" + (number) + ".png");
		$("div#headerFreeShipping img").show("fade", {}, 1000);
	},5000);
	
	$("img#btnTopNavSearch").click(function()
	{
		$("form#headerSearchFrm").submit();
	});
	
	$("input#txtSearch").click(function()
	{
		if($(this).val() == "Find it here...")
		{
			$(this).val("");
		}
	});
	
	$("input#txtSearch").focusout(function()
	{
		if($.trim($(this).val()) == "")
		{
			$(this).val("Find it here...");
		}
	});
	
	$("input#modalLoginLogin").click(function()
	{
		if($(this).val() == "E-mail Address")
		{
			$(this).val("");
		}	
	});
	
	$("input#modalLoginLogin").focusout(function()
	{
		if($.trim($(this).val()) == "")
		{
			$(this).val("E-mail Address");
		}
	});	
	
	$("input#modalLoginPassword").click(function()
	{
		if($(this).val() == "")
		{
			$("span#lblLoginPassword").html("");
		}
	});
	
	$("input#modalLoginPassword").focusout(function()
	{
		if($.trim($(this).val()) == "")
		{
			$("span#lblLoginPassword").html("Password");
		}
	});		
	
	$("input#subscribeFullname").click(function()
	{
		if($(this).val() == "Full Name")
		{
			$(this).val("");
		}
	});	
	$("img#btnFooterSubscribe").click(function()
	{
		$("form#subscribeFrm").submit();
	});
	
	$("input#subscribeFullname").click(function()
	{
		if($(this).val() == "Full Name")
		{
			$(this).val("");
		}
	});
	$("input#subscribeFullname").focusout(function()
	{
		if( $.trim($(this).val()) == "")
		{
			$(this).val("Full Name");
		}
	});
	
	$("input#subscribeLogin").click(function()
	{
		if($(this).val() == "Email Address")
		{
			$(this).val("");
		}
	});
	$("input#subscribeLogin").focusout(function()
	{
		if( $.trim($(this).val()) == "")
		{
			$(this).val("Email Address");
		}
	});	
	
	$("a#btnSocialFacebook, a#btnSocialTwitter, a#btnSocialYoutube, a#btnSocialMail").mouseover(function()
	{
		$(this).animate({"top": "-=4px"}, "fast");
		/*$(this).css("top","90px");*/
	});
	$("a#btnSocialFacebook, a#btnSocialTwitter, a#btnSocialYoutube, a#btnSocialMail").mouseout(function()
	{
		//$(this).css("top","94px");
		$(this).animate({"top": "+=4px"}, "fast");
	});	
	$("div#navContent ul li").mouseover(function()
	{
		$(this).css("border-top","2px solid #3c0000");
		$(this).css("border-left","2px solid #3c0000");
		$(this).css("border-right","2px solid #a31313");
		$(this).css("border-bottom","2px solid #9a4646");
		$(this).css("height","46px");
		$(this).css("background","url('site/images/background-nav-active.png')");
		/*$(this).css("padding-left","18px");
		$(this).css("padding-right","18px");*/
		$(this).css("padding-left","8px");
		$(this).css("padding-right","8px");			
		$(this).find("a").css("top","15px");
		//$(this).find("div.subMenu").show();
	});
	$("div#navContent ul li").mouseout(function()
	{
		$(this).removeAttr("style");
		$(this).find("a").removeAttr("style");	
		//$(this).find("div.subMenu").hide();	
	});
});