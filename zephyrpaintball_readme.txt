


Homepage

The banners are hard coded in index.html (search for homepageSlideshowContainer). The slideshow will support more than five simply by adding more linked images. ex:
<div class='slide'><a href="#!category/.3packagespecials"><img src="images/package_deals_slideshow_template.jpg" width='605' height='265' alt='' /></a></div>

The featured items load dynamically based on the contents of a list named  "homepage_products".

The text is also hard coded. There is a display format set up to only show the first 200 pixels of content, followed by a 'show more' link.





Category Template

In order for the app to serve the category pages at the optimal speed and to also support dynamic content, the app will load the content for a file called 'pages.json'. For more information on how to update/generate this file, please go here:

[[ADD LINK TO WIKI]]

Within the category template, there are several sections. Each section may include a few banners, a header, a product list or a combination of a few of these things.  Most of the sections key off of one field to determine whether or not the entire section is visible.

** IMPORTANT ** if a given section is hidden because the 'key' is not populated, the content for that section still gets loaded. Best practice would be to remove all the content (especially images) to optimize performance.

Sections:
	big slide show -> consists of 5 large banners. If the first banner is not populated, the entire section will be hidden. (.%page.zs11_banner_wslideshow_slide1 thru .%page.zs11_banner_wslideshow_slide5)

	1 large static banner -> In the builder, there is a 'link' and an 'image' element. If the image is not populated, then it won't show up. (.%page.banner01_link and .%page.zoovy:banner01)

	1 large static banner -> In the builder, there is a 'link' and an 'image' element. If the image is not populated, then it won't show up. (.%page.banner02_link and .%page.zoovy:banner02)

	3 small banners -> these are set to appear within a slideshow for small screens. For larger screens, as many banners as can fit within the horizontal space avaiable will be shown. If the associated 'title' is not populated, the banners will not show up. (.page:ad1_link and .page:ad1 [1-3] and the title is .%page.3widead_title)

	1 text block -> will be formatted as wiki. Is it's own key. (.%page.top_description)*

	1 text block -> will be formatted as wiki. Is it's own key.	(.%page.top_description2)*
	
	subcategories -> these key off themselves.
	
	product -> these key off themselves.

	1 text block -> will be formatted as wiki. Is it's own key. (.%page.description)*

	1 text block -> will be formatted as wiki. Is it's own key.	(.%page.bot_description)
	1 html block -> will be formatted as html. Is it's own key.	(.%page.htmllinks)**
	
* This text block will only display the first 200 pixels, then a 'show more' button will show up. Is smart enough to 'know' whether or not to show the button.
** Be sure to validate your html, one mismatched tag could have disasterous results.




Product Template

Breadcrumb will show up at the top IF the user came to this page from a category page.
Next/Previous buttons will show up IF the user came to this page from a category page.

Images and Videos:
	Images, 360 viewer and video are displayed within tabs.  
	360 viewer (youtube:360) will only show up if populated.
	The video tab will only show up if the youtube:videoid attribute is populated. More videos ARE supported, but won't show if the default video field is not populated.
	If the key fields for video and 360 are empty, the images will NOT show up in a tab (would be silly for just one tab to show up).
	The app will display an unlimited number of product images as long as there are no breaks in the sequence (if images 1-3 and 5-9 are populated, only 1-3 will show because 4 is blank).



	
