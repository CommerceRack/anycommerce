$(document).ready(function()
{
	var number = 1 + Math.floor(Math.random() * 4);
	$("div#headerFreeShipping img").attr("data-note",number);
	$("div#headerFreeShipping img").attr("src","site/images/header-free-shipping-icon-" + (number) + ".png");
	
	setInterval(function() 
	{
		$("div#headerFreeShipping img").fadeOut("1000",function(){
			var number = 1 + Math.floor(Math.random() * 4);
			while(number == parseInt($("div#headerFreeShipping img").attr("data-note")))
			{
				number = 1 + Math.floor(Math.random() * 4);
			}		
			$("div#headerFreeShipping img").attr("data-note",number);		
			$("div#headerFreeShipping img").attr("src","site/images/header-free-shipping-icon-" + (number) + ".png");				
			$("div#headerFreeShipping img").fadeIn("1000");
		});
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
	$("div.navContent > ul > li").mouseover(function()
	{
		$(this).css("border-top","2px solid #3c0000");
		$(this).css("border-left","2px solid #3c0000");
		$(this).css("border-right","2px solid #a31313");
		$(this).css("border-bottom","2px solid #9a4646");
		$(this).css("height","46px");
		$(this).css("background","url('images/background-nav-active.png')");
		$(this).css("padding-left","13px");
		$(this).css("padding-right","13px");
		$(this).children("a").css("top","15px");
		$(this).find("div.subMenu").show();
		var height = 379;
		var heightCt = 0;
		/*$(this).find("div.subMenu > div > ul").each(function(i)
		{			
			if($(this).position().top > heightCt)
			{
				heightCt = $(this).position().top;
			}
		});*/
		$(this).find("div.subMenu > div *").each(function(i)
		{
			if($(this).position().top > heightCt)
			{
				heightCt = $(this).position().top + $(this).height();
			}
		});		
		if(heightCt > height)
		{
			height = heightCt;
		}
		if($(this).find("a > img").attr("src") != "")
		{
			$(this).find("a").show();
		}
		//$(this).find("div.subMenu").stop().animate({"height":"379px"}, 300);
		height = height + "px";
		$(this).find("div.subMenu").stop().animate({"height":height}, 300);
	});
	$("div.navContent > ul > li").mouseout(function()
	{
		$(this).removeAttr("style");
		$(this).children("a").removeAttr("style");	
		$(this).find("div.subMenu").stop().animate({"height":"0px"}, 300, $(this).find("div.subMenu").hide());
	});
	$("div.navContent a").click(function()
	{
		$("div.navContent div.subMenu").each(function()
		{
			if($(this).css("display") != "none")
			{
				$(this).stop().animate({"height":"0px"}, 300, $(this).hide());
			}
		});
	});	
}); 