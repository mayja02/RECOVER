var map, baseLyrs, FireSeverity, FireLine, FireRecords, fireAffectedVegetation, startExtent, popup, geometryService, startExtent;
var toc;
var visible = [0];
var layers = [];
var widgets;

(function() {

// -------------------------- globals ----------------------------

    /*global esriConfig */
    /*global startExtent*/
    /*global $*/
    /*global esri*/
    /*global $*/
    /*global map*/

    require([
    "esri/map",
    "esri/layers/FeatureLayer",
    "esri/layers/ArcGISDynamicMapServiceLayer",
    "esri/SpatialReference",
    "esri/tasks/GeometryService",
    "esri/geometry/webMercatorUtils",
    "esri/geometry/Extent",
    "esri/geometry/scaleUtils",
    "esri/renderers/SimpleRenderer",
    "esri/renderers/ClassBreaksRenderer",
    "esri/symbols/SimpleFillSymbol",
    "esri/symbols/SimpleLineSymbol",
    "esri/Color",
    "esri/dijit/Scalebar",
    "esri/dijit/Search",
    "esri/dijit/Popup",
    "esri/dijit/OverviewMap",
    "esri/dijit/Basemap",
    "esri/dijit/BasemapGallery",
    "dojo/_base/connect",
    "dojo/on",
    "dojo/query",
    "dojo/_base/array",
    "agsjs/dijit/TOC",
    "dojo/dnd/move",
    "dojo/dom",
    "dojo/dom-construct",
    "dojo/parser",


    "dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dijit/TitlePane",
    "dojo/domReady!"
  ],


  function(Map, FeatureLayer, ArcGISDynamicMapServiceLayer, SpatialReference, GeometryService, webMercatorUtils, Extent, scaleUtils, SimpleRenderer, ClassBreaksRenderer, SimpleFillSymbol, SimpleLineSymbol,
  Color, Scalebar, Search, Popup, OverviewMap, Basemap, BasemapGallery, connect,  on,  query, arrayUtils, TOC, move, dom, domConstruct, parser){
    
    parser.parse();

    geometryService = new GeometryService("http://recover.giscenter.isu.edu/arcgis/rest/services/Utilities/Geometry/GeometryServer");
    esriConfig.defaults.geometryService = "http://recover.giscenter.isu.edu/arcgis/rest/services/Utilities/Geometry/GeometryServer";

    //make widget containers moveable
    /*global widgets */
    widgets.forEach(function(item){
      var mv = new move.parentConstrainedMoveable(item.widget,{
        'handle': item.handle,
        'area': map,
        'within': true,
        'delay': '20px'
      });
      // make widget opaque on title drag
      item.handle.addEventListener("mousedown", function(){
        $(this).parent().css("opacity", "0.6");
      });
      // turn off widget opacity after dragging complete
      item.handle.addEventListener("mouseup", function(){
        $(this).parent().css("opacity", "1");
      });
    });


    startExtent = esri.geometry.Extent(-12692442.57378805, 5316630.715935899, -12496763.781377923, 5389245.892806845/*[ADD INITIAL EXTENT]*/, new SpatialReference({ wkid:102100 }));

    //initialize map
    map = new Map("map", {
      extent: startExtent,
      zoom: 10,
      basemap: "satellite",
      infoWindow: popup,

    });
    window.map = map;

    baseLyrs = new ArcGISDynamicMapServiceLayer("http://fuji.giscenter.isu.edu/arcgis/rest/services/RECOVER_"+"crystalFire_ID"+"/basemap/MapServer");
    //RealTimeLyr = new FeatureLayer("http://services1.arcgis.com/z5tlnpYHokW9isdE/arcgis/rest/services/RECOVER_RT/FeatureServer");
    FireSeverity = new FeatureLayer("http://services1.arcgis.com/z5tlnpYHokW9isdE/arcgis/rest/services/RECOVER_RT/FeatureServer/0");
    FireLine = new FeatureLayer("http://services1.arcgis.com/z5tlnpYHokW9isdE/arcgis/rest/services/RECOVER_RT/FeatureServer/2");
    FireRecords = new FeatureLayer("http://services1.arcgis.com/z5tlnpYHokW9isdE/arcgis/rest/services/RECOVER_RT/FeatureServer/1");
    // fireAffectedVegetation = new ArcGISDynamicMapServiceLayer("http://fuji.giscenter.isu.edu/arcgis/rest/services/RECOVER/Soda_Fire_Affected_Vegetation/MapServer");

    map.on("load", function(){
    map.addLayers([baseLyrs, FireSeverity, FireRecords, FireLine]);
    // map.addLayer(fireAffectedVegetation);
    });

    layers.push(baseLyrs);

  //build table of contents using TOC library
    map.on('layers-add-result', function(evt){
            toc = new TOC({
              map: map,
              layerInfos: [{
                layer: baseLyrs,
                title: "RECOVER Base Layers",
                collapsed: true, // whether this root layer should be collapsed initially, default false.
                slider: true // whether to display a transparency slider.
              },{
                layer: FireSeverity,
                title: "Fire Severity",
                slider:true,
                collapsed: true,
              },{
                layer: FireRecords,
                title: "Fire Records",
                slider:true,
                collapsed: true,
              }, {
                layer: FireLine,
                title: "Fire Line",
                slider:true,
                collapsed: true,
              }
              //  {
              //   layer: fireAffectedVegetation,
              //   title: "Fire Affected Vegetation",
              //   collapsed: true,
              //   slider: true
              // }
            ]
            }, 'tocDiv');

            toc.startup();

            });

            //when feature layers are seleced/unselected updateLayerVisibility
            $("#tocDiv").on("change", updateLayerVisibility);

    popup = new Popup({
       fillSymbol: new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
         new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
           new Color([255, 0, 0]), 2), new Color([255, 255, 0, 0.25]))
     }, domConstruct.create("div"));

    // adding a scalebar to map
    var scalebar = new Scalebar({
        map: map,
        // "dual" displays both miles and kilmometers
        // "english" is the default, which displays miles
        // use "metric" for kilometers
        scalebarUnit: "dual"
      });
      createBasemapGallery();

      //start-up the search bar
      var s = new Search({
        map: map
        }, "search");
        s.startup();

      var overviewMapDijit = new OverviewMap({
        map: map,
        attachTo: "bottom-right",
        color: "#F20C0C",
        opacity: 0.4
      });
      overviewMapDijit.startup();

      map.on("load", function() {
       //after map loads, connect to listen to mouse move & drag events
       map.graphics.graphics.pop();
       map.on("mouse-move", showCoordinates);
       map.on("mouse-drag", showCoordinates);
     });

     function showCoordinates(evt) {
       //the map is in web mercator but display coordinates in geographic (lat, long)
       var mp = webMercatorUtils.webMercatorToGeographic(evt.mapPoint);
       //display mouse coordinates
       dom.byId("info").innerHTML ="Latitude: " + mp.x.toFixed(3) + ", " + "Longitude: " + mp.y.toFixed(3);
     }

     function createBasemapGallery() {

     // Startup basemap gallery
     var basemapGallery = new BasemapGallery({
       showArcGISBasemaps: true,
       map: map
     }, "basemapGallery");

     //add the basemap gallery, in this case we'll display maps from ArcGIS.com including bing maps
     basemapGallery.startup();

     basemapGallery.on("error", function(msg) {
         console.log("basemap gallery error:  ", msg);
       });
       }

       //function creates array of visible layers
       function updateLayerVisibility(){
       visible = [];

       for(var i = 0; i < toc.layerInfos[0].layer._tocInfos.length; i++){

         var layer = toc.layerInfos[0].layer._tocInfos[i];

         if (layer.visible === true){

           visible.push(layer.id);

       }
     }
   }

  });

    //loading screen
    $("#map").ready(function() {
        setInterval(rmLoader, 1500);
    });

    function rmLoader() {
        $(".loading-indicator").remove();
    }

    //configure Modal screen on app start up
    $(document).ready(function() {
        $("#GSCCModal").modal({
            backdrop: "static"
        });
        $("#GSCCModal").css({
            "display": "block",
        });
    });

    //remove modal screen and associated elements on button click
    $("#close_modal").on("click", function() {
        $('body').removeClass("modal-open");
        $(".modal-backdrop.in").remove();
        $("#GSCCModal").remove();
    });


    //create widgets objects for use in application, mainly for creativing moveable widget containers
    // and toggling "selected" class
    widgets = [{
        name: "LayerList",
        icon: $("#LyrListImg"),
        widget: document.getElementById("LyrWidget"),
        handle: document.getElementById("LyrListTitle")
    }, {
        name: "Swipe",
        icon: $("#SwipeImg"),
        widget: document.getElementById("SwipeWidget"),
        handle: document.getElementById("SwipeTitle")
    }, {
        name: "Draw",
        icon: $("#DrawImg"),
        widget: document.getElementById("DrawWidget"),
        handle: document.getElementById("DrawTitle")
    }, {
        name: "Bookmarks",
        icon: $("#BookmarkImg"),
        widget: document.getElementById("BookmarksWidget"),
        handle: document.getElementById("BookmarkTitle")
    }, {
        name: "Shapefile",
        icon: $("#ShpImg"),
        widget: document.getElementById("ShpWidget"),
        handle: document.getElementById("ShpfileTitle")
    }, {
        name: "Print",
        icon: $("#PrintImg"),
        widget: document.getElementById("PrintWidget"),
        handle: document.getElementById("PrintTitle")
    }];

    //initilize forEach structure
    widgets.forEach(function(item) {

        // toggles class="selected" and adds animations to widget icons
        item.icon.on("click", function() {
            $(this).toggleClass("selected");
            $(this).animate({
                bottom: "10px"
            }, 200);
            $(this).animate({
                bottom: "0px"
            }, 200);

            // change widget container display depending on if container has class="selected"
            if (item.icon.hasClass("selected")) {
                item.widget.style.display = "block";
            }
            else {
                item.widget.style.display = "none";
            }
        });

        //use close icon on widget container to remove widget container display and remove "selected" class from icon
        $(item.widget).on("click", "button.remove", function() {
            $(this).closest(".widget_container").hide();
            item.icon.removeClass("selected");
        }).removeClass("selected");

        // use minimize button to collapse widget container
        // on collapse, minimize button will change to expand button to restore origianl dimensions
        $(item.widget).on("click", "button.minimize", function() {
            // $(this).find("img").attr("src", 'none');
            var container = $(this).closest(".widget_container");
            container.toggleClass("minimized");
            if (container.hasClass("minimized")) {
                $(this).find("img").attr("src", 'assets/images/w_down.png');
            }
            else {
                $(this).find("img").attr('src', 'assets/images/w_min.png');
            }
        });
    });
}());
