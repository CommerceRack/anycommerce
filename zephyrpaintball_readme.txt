


Revealation
In places this is used, only the first few lines of a textblock are revealed, followed by a 'show more' button. When clicked, show more reveals the rest of the text and the button changes to 'show less', which will once again hide the extra text.
On a mobile device, the text block is capped at 120px (about 5 lines). On a pad or bigger, a larger text block is shown before the text is cropped and the button appears.


srcset
Many images, especially in the product layout, use an emerging standard for responsive imagery known as srcset. This allows you to set multiple sources on a given image tag (based on browser dimensions and pixel density) and the browser will show the correct one. This allows for an entirely different size image to be used for mobile than for larger screens.
A javascript 'polyfill' is used for backwards compatibility.



Homepage

The banners are hard coded in index.html (search for homepageSlideshowContainer). The slideshow will support more than five simply by adding more linked images. ex:
<div class='slide'><a href="#!category/.3packagespecials"><img src="images/package_deals_slideshow_template.jpg" width='605' height='265' alt='' /></a></div>

The featured items load dynamically based on the contents of a list named  "homepage_products".

The text is also hard coded in the homepage.  This block uses revealation.





Category Template

In order for the app to serve the category pages at the optimal speed and to also support dynamic content, the app will load the content for a file called 'pages.json'.  The pages.json file is used by the API to fetch content for an individual category page.  Using this file instead of accessing the website builder directly is done for a few reasons, including; faster, allows mass-updates to occur at once and/or allows programmatic changes of the pages.json file.

To export:
Go into the domain configuration edito
Click edit for the domain you wish to export from.
Click dropdown menu for the host that is set as apptimizer or vstore/app and choose the export pages.json option.
This will trigger a batch process which opens a progress dialog.
When the job is done, go to the batch manager (there is a link in the dialog or go to the utilities tab).
Within the row for the export/pages job, there will be a download button. Push the button and save the file into the platform directory of your app.
Now commit/sync your app.




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
	
* This text block uses revealation.
** Be sure to validate your html, one mismatched tag could have disasterous results.




Product Template

Breadcrumb will show up at the top IF the user came to this page from a category page.
Next/Previous buttons will show up IF the user came to this page from a category page.

Images and Videos:
	Images, 360 viewer and video are displayed within tabs.  
	360 viewer (youtube:360) will only show up if populated.
	The video tab will only show up if the youtube:videoid attribute is populated. More videos ARE supported, but won't show if the default video field is not populated.
	If the key fields for video and 360 are empty, the tab functionality will be disabled and the images will show.
	The app will display an unlimited number of product images as long as there are no breaks in the sequence (if images 1-3 and 5-9 are populated, only 1-3 will show because 4 is blank).

The product description uses revealation.

	
