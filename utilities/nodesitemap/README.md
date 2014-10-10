Sitemap Generator
=================

This is short script designed to generate sitemaps for anyCommerce applications.

Installing Dependencies and Running
-----------------------------------

Running `npm install` in this directory will install all dependencies, the gitignore file is set up
to ignore node modules installed with npm, so if you re-clone you will need to reinstall dependencies.

Run with `node sitemap.js -d www.domain.com`, there is an optional `-p` flag to specify where the files
are generated (default `./`).

Default URLS
-----------

This tool generates sitemaps based off of an `appSEOFetch` call, which returns products, categories and lists.
Each of these cases are handled in a `switch` statement in sitemap.js.  By default products result in "/product/PID/" format,
categories in "/category/NAVCAT/" format, and lists are ignored. To change this format, edit that `switch` statement.

By default, all products marked with the `seo:noindex` attribute are ignored.

Custom URLS
-----------

To add any custom URLs to your sitemap, use the `-c` or `--customurls` flag to pass a path to a .json file.  The json file
should contain an Array of any URLs to be added, for example:

```
[
	"/about_us/",
	"/contact_us/",
	"/privacy_policy/"
]
```