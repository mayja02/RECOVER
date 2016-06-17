 /*global startExtent*/
 /*global map*/
 /*global dojo*/

 (function() {
   require([
       "esri/dijit/BookmarkItem",
       "esri/dijit/Bookmarks",
       "dojo/dom",
       "dojo/domReady!"
     ],

     function(
       BookmarkItem, Bookmarks, dom, domConstruct
     ) {

       function init() {
         // Bookmarks can be specified as an array of objects with the structure:
         // { extent: <esri.geometry.Extent>, name: <some string> }

         var bookmarks_list = [{
           "extent": startExtent,
           "name": "Crystal Fire" //[NAME]
         }];

         // Create the bookmark widget
         var bookmark = new Bookmarks({
           map: map,
           bookmarks: bookmarks_list,
           editable: true
         }, dojo.byId('Bookmarks'));
       }
       dojo.ready(init);
     });
 }());
