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

(function() {

  require([
      "esri/InfoTemplate",
      "esri/tasks/IdentifyTask",
      "esri/tasks/IdentifyParameters",
      "dojo/_base/array",
      "dojo/domReady!"
    ],

    function(
      InfoTemplate, IdentifyTask, IdentifyParameters,
      arrayUtils
    ) {

      /*global map*/
      /*global $*/
      /*global visible*/

      //create identify tasks and setup parameters
      var identifyTask = new IdentifyTask("http://fuji.giscenter.isu.edu/arcgis/rest/services/RECOVER_" + "crystalFire_ID" + "/basemap/MapServer");
      var identifyParams = new IdentifyParameters();

      $("#map").on("click", IdentifyFeat);

      $("#CloseDrawWidget").on("click", function() {
        $(".esriPopup .titleButton.close").click();
      });
      //Create the identify task for RECOVER basemap layers and click event handler

      function IdentifyFeat() {
        if ($("#DrawImg").hasClass('selected') === true) {
          identifyParams.returnGeometry = false;
          $(".esriPopup").hide();

        }
        else {
          map.on("click", executeIdentifyTask);

          //define Identify parameters
          identifyParams.layerIds = visible;
          identifyParams.layerOption = IdentifyParameters.LAYER_OPTION_ALL;
          identifyParams.tolerance = 3;
          identifyParams.width = map.width;
          identifyParams.height = map.height;
          identifyParams.returnGeometry = true;

          $(".esriPopup").show();
        }

      }

      function executeIdentifyTask(event) {
        identifyParams.geometry = event.mapPoint;
        identifyParams.mapExtent = map.extent;

        var deferred = identifyTask
          .execute(identifyParams)
          .addCallback(function(response) {
            // response is an array of identify result objects
            // Let's return an array of features.
            return arrayUtils.map(response, function(result) {
              var feature = result.feature;
              var layerName = result.layerName;

              //configuring Identify task for RECOVER base layers
              // each identifiable layer will need an InfoTemplate defined for that layer
              feature.attributes.layerName = layerName;
              if (layerName === 'Fire Boundary') {
                var fireBndryTemplate = new InfoTemplate("Fire Boundary", "Fire Number: ${FIRE_NUMBE}<br>Year: ${YEAR_}");
                feature.setInfoTemplate(fireBndryTemplate);
              }
              if (layerName === 'Roads') {
                var roadsTemplate = new InfoTemplate("Roads", "Class: ${ROAD_CL}<br>Length: ${Shape_Length}");
                feature.setInfoTemplate(roadsTemplate);
              }
              if (layerName === 'NHD (National Hydrography Dataset)') {
                var nhdTemplate = new InfoTemplate("Hydrography", "FCode: ${FCode}<br>Feature Type: ${FType}<br>Length: ${Shape_Length}");
                feature.setInfoTemplate(nhdTemplate);
              }
              if (layerName === 'Habitat') {
                var habitatTemplate = new InfoTemplate("Habitat", "Notes: ${Notes}<br>Species: ${Species}<br>Area (sq. Meters): ${SHAPE_Area}");
                feature.setInfoTemplate(habitatTemplate);
              }
              if (layerName === 'WatershedsWBD') {
                var wbdTemplate = new InfoTemplate("Watershed Boundary", "Name: ${Watershed Name}<br>Acres: ${Acres}<br>");
                feature.setInfoTemplate(wbdTemplate);
              }
              if (layerName === 'Wetlands') {
                var wetlandsTemplate = new InfoTemplate("Wetlands", "Type: ${WetlandType}<br>Length (meters): ${Shape_Length}<br>Area (sq. meters): ${Shape_area}<br>Acres: ${ACRES}");
                feature.setInfoTemplate(wetlandsTemplate);
              }
              if (layerName === 'PLSS') {
                var plssTemplate = new InfoTemplate("PLSS", "Identifier: ${FRSTDIVID}<br>State: ${STATE}<br>Section: ${DivNumber}<br>Type: ${DivType}<br>Township: ${TOWNSHIP}<br>Range: ${RANGE}");
                feature.setInfoTemplate(plssTemplate);
              }
              if (layerName === 'SMA (Surface Management Agency)') {
                var smaTemplate = new InfoTemplate("Surface Management Agency", "Admin Department: ${Administration Department}<br>Admin Agency: ${Administration Agency}<br>Unit Name: ${Admin. Unit Name}");
                feature.setInfoTemplate(smaTemplate);
              }
              if (layerName === 'Geology') {
                var geologyTemplate = new InfoTemplate("Geology", "State: ${STATE}<br>Age: ${UNIT_AGE}<br>LITH62: ${LITH62}<br>LITH62MINO: ${LITH62MINO}<br><br> Attachment:<br><a href=${URL} target=_blank>Site Description Report</a");
                feature.setInfoTemplate(geologyTemplate);
              }
              if (layerName === 'Soils_STATSGO') {
                var statsgoTemplate = new InfoTemplate("Soils STATSGO", "Map Unit Symbol: ${MUSYM}<br>MUKEY: ${MUKEY}<br><br>Attachment:<br><a href=${URL} target=_blank>Range Report</a>");
                feature.setInfoTemplate(statsgoTemplate);
              }
              if (layerName === 'Soils_SSURGO') {
                var ssurgoTemplate = new InfoTemplate("Soils SSURGO", "Area Symbol: ${AREASYMBOL}<br>Map Unit Symbol: ${MUSYM}<br><br>Attachment:<br><a href=${URL} target=_blank>Plant Association Report</a>");
                feature.setInfoTemplate(ssurgoTemplate);
              }
              if (layerName === 'Landslide Potential') {
                var landslidePotentialTemplate = new InfoTemplate("Landslide Potential", "Susceptibility: ${INC_SUS}");
                feature.setInfoTemplate(landslidePotentialTemplate);
              }
              if (layerName === 'Fires 1950-Present') {
                var fires1950PresentTemplate = new InfoTemplate("Fires 1950-Present", "Name: ${FIRE_NAME}<br>Year: ${FIRE_YEAR}<br>Acres: ${Acres}");
                feature.setInfoTemplate(fires1950PresentTemplate);
              }

              //  NEED TO ADD HISTORIC FIRES InfoTemplate

              if (layerName === 'Elevation') {
                var elevationTemplate = new InfoTemplate("Elevation", "Value (Meters): ${Pixel Value}");
                feature.setInfoTemplate(elevationTemplate);
              }
              if (layerName === 'Slope (Degrees)') {
                var slopeDegTemplate = new InfoTemplate("Slope (Degrees)", "Value: ${Pixel Value}");
                feature.setInfoTemplate(slopeDegTemplate);
              }
              if (layerName === 'Slope (Percent)') {
                var slopePercentTemplate = new InfoTemplate("Slope (Percent)", "Value: ${Pixel Value}");
                feature.setInfoTemplate(slopePercentTemplate);
              }
              if (layerName === 'Aspect') {
                var aspectTemplate = new InfoTemplate("Aspect", "Value: ${Pixel Value}");
                feature.setInfoTemplate(aspectTemplate);
              }
              if (layerName === 'FRG (Fire Regime Group)') {
                var frgTemplate = new InfoTemplate("FRG (Fire Regime Group)", "Label: ${Label}<br>Description: ${Descriptio}");
                feature.setInfoTemplate(frgTemplate);
              }
              if (layerName === 'EVC (Existing Vegetation Coverage)') {
                var evcTemplate = new InfoTemplate("EVC (Existing Vegetation Coverage)", "Class: ${CLASSNAMES}");
                feature.setInfoTemplate(evcTemplate);
              }
              if (layerName === 'EVT (Existing Vegetation Type)') {
                var ectTemplate = new InfoTemplate("EVT (Existing Vegetation Type)", "Class Name: ${CLASSNAME}<br>EVT Phys: ${EVT_PHYS}<br>System Group Name: ${EVT_GP_N}<br>SAF SRM: ${SAF_SRM}<br>EVT Order: ${EVT_ORDER}<br>EVT Subclass: ${EVT_SBCLS}");
                feature.setInfoTemplate(ectTemplate);
              }
              if (layerName === 'ESP (Environmental Site Potential)') {
                var espTemplate = new InfoTemplate("ESP (Environmental Site Potential)", "Zone: ${ZONE_NAME}<br>ESP NAME: ${ESP_Name}<br>ESPLF NAME: ${ESPLF_Name}");
                feature.setInfoTemplate(espTemplate);
              }
              if (layerName === 'BPS (Biophysical Setting)') {
                var bpsTemplate = new InfoTemplate("BPS (Biophysical Setting)", "NAME: ${BPS_NAME}<br>Group Name: ${GROUPNAME}<br>Group Vegetation Type: ${GROUPVEG}");
                feature.setInfoTemplate(bpsTemplate);
              }

              return feature;
            });
          });

        // InfoWindow expects an array of features from each deferred
        // object that you pass. If the response from the task execution
        // above is not an array of features, then you need to add a callback
        // like the one above to post-process the response and return an
        // array of features.
        map.infoWindow.setFeatures([deferred]);
        map.infoWindow.show(event.mapPoint);
      }
    });
}());

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

(function() {

    require([
        "esri/dijit/LayerSwipe",
        "dojo/_base/array",
        "esri/arcgis/utils",
        "dojo/dom",
        "dojo/on",
        "dojo/domReady!"

    ], function(
        LayerSwipe, array, arcgisUtils, dom, on
    ) {

        /*global $*/
        /*global map*/
        /*global layers*/

        //create SwipeDiv div element to add after swipeWidget.destroy() executes
        var SwipeDiv = document.createElement('div');
        SwipeDiv.id = "swipeDiv";

        //set sweipeWidget variable here to provide block scope
        var swipeWidget;

        //set var startPoint equal to center of screen regardless of screen size
        var startPoint = screen.width / 2;

        //on Swipe tool icon click, initiate swipe widgets
        $("#SwipeImg").on("click", function() {
            if ($("#SwipeImg").hasClass("selected") === true) {
                swipeWidget = new LayerSwipe({
                    theme: "LayerSwipe",
                    type: "vertical", //Try switching to "scope" or "horizontal"
                    map: map,
                    layers: layers,
                    left: startPoint,
                    invertPlacement: true
                }, "swipeDiv");
                swipeWidget.startup();
                //hid slider when swipe is selected
                $(".esriSimpleSlider").hide();
                //turn off map click events (Identify)
                $('.esriPopup').hide();
            }
            else {
                closeSwipe();
            }
        });

        //destroy swipe image when "close" button in swipe widget title is clicked
        $("#CloseSwipeWidget").on("click", closeSwipe);


        // when swipe widget is closed either by "close" button or swipe tool icon toggle
        // destory the swipe widget, add swipeDiv div to map div, show map zoom slider, and identify popup window
        function closeSwipe() {
            swipeWidget.destroy();
            $("#map").prepend(SwipeDiv);
            $(".esriSimpleSlider").show();
        }

        //change swipe/scope type on button clicks in swipe widget content
        on(dom.byId("toggleVertical"), 'click', function(evt) {
            swipeWidget.set("type", "vertical");
            $(".LayerSwipe").css("top", "0");
        });
        on(dom.byId("toggleHorizontal"), 'click', function(evt) {
            swipeWidget.set("type", "horizontal");
            $(".LayerSwipe").css("top", "auto");
        });
        //  on(dom.byId("toggleScope"), 'click', function(evt){
        //      swipeWidget.set("type", "scope");
        //      $(".LayerSwipe").css("top", "auto");
        //      map.infoWindow.clearFeatures();
        //  });
    });
}());

var editToolbar, ctxMenuForGraphics, ctxMenuForMap, buttonclick;
var selected, currentLocation, PolyArea, measureUnit, symbol;
var Lat, Long, linelength, selectedTrans, graphic, point2, curcount;

(function() {
  define("myModules/CustomOperation", [
    "dojo/_base/declare", "esri/OperationBase", "esri/toolbars/navigation"
  ], function(declare, OperationBase, Navigation) {
    var customOp = {};
    customOp.Add = declare(OperationBase, {
      label: "Add Graphic",
      constructor: function( /*graphicsLayer, addedGraphic*/ params) {
        params = params || {};
        if (!params.graphicsLayer) {
          console.error("graphicsLayer is not provided");
          return;
        }
        this.graphicsLayer = params.graphicsLayer;

        if (!params.addedGraphic) {
          console.error("no graphics provided");
          return;
        }
        this._addedGraphic = params.addedGraphic;
      },

      performUndo: function() {
        this.graphicsLayer.remove(this._addedGraphic);
      },

      performRedo: function() {
        this.graphicsLayer.add(this._addedGraphic);
      }
    });
    return customOp;
  });

  require(["dojo/parser", "dijit/form/CheckBox", "esri/toolbars/draw", "dojo/on", "dojo/dom", "dijit/registry", "dojo/_base/Color", "esri/graphic",
      "esri/symbols/SimpleMarkerSymbol", "esri/symbols/SimpleLineSymbol", "esri/symbols/SimpleFillSymbol", "dijit/form/NumberSpinner", "esri/toolbars/edit",
      "esri/geometry/jsonUtils", "dijit/Menu", "dijit/MenuItem", "dijit/MenuSeparator", "esri/geometry/Point", "dijit/form/TextBox", "esri/undoManager", "myModules/CustomOperation",
      "dojo/data/ObjectStore", "dojo/store/Memory", "esri/geometry/webMercatorUtils", "esri/SpatialReference", "dojo/dom-construct", "dojo/_base/connect",
      "esri/symbols/Font", "esri/symbols/TextSymbol", "dojo/dom-style", "dijit/popup", "dojo/number", "esri/tasks/LengthsParameters", "esri/tasks/GeometryService",
      "esri/tasks/AreasAndLengthsParameters", "dojo/_base/array", "esri/config", "dijit/form/HorizontalSlider", "dijit/form/Select", "dijit/PopupMenuItem", "dijit/ColorPalette",
      "dijit/layout/BorderContainer", "dijit/layout/ContentPane", "dijit/layout/AccordionContainer", "dijit/form/Button", "dijit/form/ToggleButton", "dojo/domReady!"
    ],
    function(
      parser, CheckBox, Draw, on, dom, registry, Color, Graphic, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, NumberSpinner, Edit,
      geometryJsonUtils, Menu, MenuItem, MenuSeparator, Point, TextBox, UndoManager, CustomOperation, ObjectStore, Memory, webMercatorUtils,
      SpatialReference, domConstruct, connect, Font, TextSymbol, domStyle,
      popup, number, LengthsParameters, GeometryService, AreasAndLengthsParameters, array, config, HorizontalSlider, Select, PopupMenuItem, ColorPalette) {

      parser.parse();

      //esriConfig.defaults.io.corsDetection = false;

      var undoManager = new UndoManager();

      //hook up undo/redo buttons
      registry.byId("undo").on("click", function() {
        undoManager.undo();
        console.log("The current position is: " + undoManager.position);
      });
      registry.byId("redo").on("click", function() {
        undoManager.redo();
        console.log("The current position is: " + undoManager.position);
      });

      // Export graphics to JSON and download

      $("#saveGraphic").on("click", function() {
        // console.log('saving graphics');
        // map.graphics.url = "graphics.json";
        // for (i=0; i<graphicsList; i++){
        //   var obj = graphicsList[i];
        //   var data = "text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(obj));
        //   console.log (data);
        //using jquery to loop through the graphics:

        var jsonval = "{";

        $.each(map.graphics.graphics, function(index, graphic) {
          var junk = graphic.toJson();
          jsonval += "\"" + index + "\":" + dojo.toJson(junk) + ",";
        });

        jsonval = jsonval.substring(0, jsonval.length - 1); //trim comma
        jsonval += "}";
        console.log(jsonval);

        var blob = new Blob([jsonval], {
          type: "application/json"
        });
        var url = URL.createObjectURL(blob);

        var a = document.getElementById("graphicDownload");
        a.download = "graphics.json";
        a.href = url;
      });
      //

      //On Load function/////////////////////////////////////////////
      $("#DrawImg").on("click", function() {
        if ($('#DrawImg').hasClass('selected') === true) {
          toolbar = new Draw(map);
          toolbar.on("draw-end", addToMap);
          //toolbar.on("draw-complete", addMeas);
          editToolbar = new Edit(map);
          map.on("click", function(evt) {
            editToolbar.deactivate();
          });
          createMapMenu();
          createGraphicsMenu();
          ctxMenuForMap.bindDomNode(map.container);

        }
        else {
          restoreDefaultctx();
        }

        $("#CloseDrawWidget").on("click", restoreDefaultctx);

        function restoreDefaultctx() {
          dijit.byId('TransPop').destroy();
          ctxMenuForMap.unBindDomNode(map.container);
          ctxMenuForGraphics.destroy();

        }
      });
      /////////////// DRAW TOOL /////////////////////////////////

      //Default Styles
      var symbolfill = SimpleFillSymbol.STYLE_NULL;
      var bold = Font.WEIGHT_NORMAL;
      var underline = "none";
      var italic = Font.STYLE_NORMAL;
      var myNumber = 3;
      var myFont = 12;
      var TransVal = 1;
      var red = 0;
      var green = 0;
      var blue = 0;
      var newColor = [red, green, blue, TransVal];
      var myText = "";

      ///////////// RIGHT-CLICK MENU ////////////////////////////

      //Creates right-click context menu for map
      function createMapMenu() {
        ctxMenuForMap = new Menu({
          onOpen: function(box) {
            // Lets calculate the map coordinates where user right clicked.
            // We'll use this to create the graphic when the user clicks
            // on the menu item to "Add Text"
            currentLocation = getMapPointFromMenuPosition(box);
            editToolbar.deactivate();
          }
        });

        //When right clicking on map add text
        ctxMenuForMap.addChild(new MenuItem({
          label: "Add Text",
          onClick: function(evt) {
            var symbol = new TextSymbol(myText).setColor(
              new Color(newColor)).setAlign(Font.ALIGN_START).setAngle(0).setDecoration(underline).setFont(
              new Font(myFont).setWeight(bold).setStyle(italic));
            var point2 = new Point(geometryJsonUtils.fromJson(currentLocation.toJson()));
            var graphic = new Graphic(point2, symbol);
            map.graphics.add(graphic);

          }
        }));

        ctxMenuForMap.startup();

      }



      //Creates right-click context menu for GRAPHICS
      function createGraphicsMenu() {
        ctxMenuForGraphics = new Menu({});

        var EditMenu = new MenuItem({
          label: "Edit",
          onClick: function() {
            if (selected.geometry.type !== "point") {
              editToolbar.activate(Edit.EDIT_VERTICES, selected);
            }
            else {
              editToolbar.activate(Edit.MOVE | Edit.EDIT_VERTICES | Edit.EDIT_TEXT | Edit.SCALE, selected);
            }
          }
        });
        //ctxMenuForGraphics.addChild(EditMenu);

        //Right-click Move
        var MoveMenu = new MenuItem({
          label: "Move",
          onClick: function() {
            editToolbar.activate(Edit.MOVE, selected);
          }
        });
        //ctxMenuForGraphics.addChild(MoveMenu);

        //Right-click Rotate/Scale
        var RoScMenu = new MenuItem({
          label: "Rotate/Scale",
          onClick: function() {
            editToolbar.activate(Edit.ROTATE | Edit.SCALE, selected);
          }
        });
        //ctxMenuForGraphics.addChild(RoScMenu);

        var LatLongMenu = new MenuItem({
          label: "Add Lat/Long",
          onClick: function() {
            var mapPoint = selected.geometry;
            var locPoint = webMercatorUtils.webMercatorToGeographic(mapPoint);
            var lat = number.format(locPoint.y, {
              places: 5
            });
            var longi = number.format(locPoint.x, {
              places: 5
            });
            var textSymbol = new TextSymbol(
              "Lat: " + (lat) + ", Long: " + (longi)).setColor(
              new Color(newColor)).setAlign(Font.ALIGN_MIDDLE).setAngle(0).setDecoration(underline).setOffset(5, 5).setFont(
              new Font(myFont).setWeight(bold).setStyle(italic));
            var labelPointGraphic = new Graphic(locPoint, textSymbol);
            map.graphics.add(labelPointGraphic);
          }
        });

        ctxMenuForGraphics.addChild(LatLongMenu);

        //Right-click Transparency
        var TransPop = new HorizontalSlider({
          name: "slider",
          id: "TransPop",
          value: 0,
          minimum: 0,
          maximum: 0.99,
          style: "width:150px",
          onChange: function(val) {
            var TransVal2 = 1 - val;
            var rt = selected.symbol.color.r;
            var gt = selected.symbol.color.g;
            var bt = selected.symbol.color.b;
            var newColor2 = [rt, gt, bt, TransVal2];
            if (selected.geometry.type == "polygon") {
              if (selected.symbol.style == "solid") {
                symbolfill2 = SimpleFillSymbol.STYLE_SOLID;
              }
              else {
                symbolfill2 = SimpleFillSymbol.STYLE_NULL;
              }
              var myNumberpoly = selected.symbol.outline.width;
              var symbol2 = new SimpleFillSymbol(symbolfill2, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                new Color(newColor2), myNumberpoly), new Color(newColor2));
              selected.setSymbol(symbol2);
            }
            else if (selected.symbol.type == "textsymbol") {
              var TextAngle = selected.symbol.angle;
              var SelText = selected.symbol.text;
              var symbol2 = new TextSymbol(SelText).setColor(
                new Color(newColor2)).setAlign(Font.ALIGN_START).setAngle(0).setDecoration(underline).setFont(
                new Font(myFont).setWeight(bold).setStyle(italic));
              symbol2.setAngle(TextAngle);
              selected.setSymbol(symbol2);
            }
            else if (selected.geometry.type == "polyline") {
              var myNumberline = selected.symbol.width;
              var symbol3 = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(newColor2), myNumberline);
              selected.setSymbol(symbol3);
            }
            else if (selected.symbol.style == "circle") {
              var myNumberpoint = selected.symbol.size;
              var symbol2 = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, myNumberpoint,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(newColor2), 1), new Color(newColor2));
              selected.setSymbol(symbol2);
            }
          }
        });

        var TransMenu = new PopupMenuItem({
          label: "Transparency",
          popup: TransPop
        });
        //ctxMenuForGraphics.addChild(TransMenu);

        //Right-click Measurement
        var ss = new Select({
          name: "select2",
          options: [{
            label: "Select Measurement",
            value: "SELECT",
            selected: true
          }, {
            label: "Feet",
            value: "FEET"
          }, {
            label: "Miles",
            value: "MILES"
          }, {
            label: "Meters",
            value: "METERS"
          }, {
            label: "Kilometers",
            value: "KILO"
          }, {
            label: "Yards",
            value: "YARDS"
          }]
        });
        ss.startup();

        ss.on("change", function(evt) {
          measureUnit = evt;
          if (evt == "FEET") {
            Unit_Area = GeometryService.UNIT_SQUARE_FEET;
            Unit_Line = GeometryService.UNIT_FOOT;
            Unit_A_Label = " sq. feet";
            Unit_L_Label = " feet";
          }
          else if (evt == "MILES") {
            Unit_Area = GeometryService.UNIT_SQUARE_MILES;
            Unit_Line = GeometryService.UNIT_STATUTE_MILE;
            Unit_A_Label = " sq. miles";
            Unit_L_Label = " miles";
          }
          else if (evt == "METERS") {
            Unit_Area = GeometryService.UNIT_SQUARE_METERS;
            Unit_Line = GeometryService.UNIT_METER;
            Unit_A_Label = " sq. meters";
            Unit_L_Label = " meters";
          }
          else if (evt == "KILO") {
            Unit_Area = GeometryService.UNIT_SQUARE_KILOMETERS;
            Unit_Line = GeometryService.UNIT_KILOMETER;
            Unit_A_Label = " sq. kilometers";
            Unit_L_Label = " kilometers";
          }
          else if (evt == "YARDS") {
            Unit_Area = GeometryService.UNIT_SQUARE_YARDS;
            Unit_Line = GeometryService.UNIT_STATUTE_MILE;
            Unit_A_Label = " sq. yards";
            Unit_L_Label = " yards";
          }
          else {
            return;
          }
          newColor = selected.symbol.color;
          if (selected.geometry.type == "point") {
            var mapPoint = selected.geometry;
            var locPoint = webMercatorUtils.webMercatorToGeographic(mapPoint);
            var lat = number.format(locPoint.y, {
              places: 5
            });
            var longi = number.format(locPoint.x, {
              places: 5
            });
            var textSymbol = new TextSymbol(
              "Lat: " + (lat) + ", Long: " + (longi)).setColor(
              new Color(newColor)).setAlign(Font.ALIGN_MIDDLE).setAngle(0).setDecoration(underline).setOffset(5, 5).setFont(
              new Font(myFont).setWeight(bold).setStyle(italic));
            var labelPointGraphic = new Graphic(locPoint, textSymbol);
            map.graphics.add(labelPointGraphic);
          }
          else if (selected.geometry.type == "polyline") {
            var lengthParams = new LengthsParameters();
            lengthParams.lengthUnit = Unit_Line;
            lengthParams.polylines = [selected.geometry];
            lengthParams.geodesic = true;
            map_y = selected.geometry.paths[0][0][1];
            map_x = selected.geometry.paths[0][0][0];
            var mapPoint = new Point([map_x, map_y], new SpatialReference({
              wkid: 102100
            }));
            var locPoint = webMercatorUtils.webMercatorToGeographic(mapPoint);
            Lat = locPoint.y;
            Long = locPoint.x;
            geometryService.lengths(lengthParams);
          }
          else if (selected.geometry.type == "polygon") {
            if (selected.symbol.style == "solid") {
              polygonColor = [255, 255, 255];
            }
            else {
              polygonColor = selected.symbol.color;
            }
            var areaParams = new AreasAndLengthsParameters();
            areaParams.areaUnit = Unit_Area;
            areaParams.lengthUnit = Unit_Line;
            areaParams.calculationType = 'geodesic';
            areaParams.polygons = [selected.geometry];
            geometryService.simplify(areaParams.polygons, getLabelPoints);
            geometryService.areasAndLengths(areaParams);
            ss.set("value", "SELECT");
          }
        });

        var MeasMenu = new PopupMenuItem({
          label: "Add Measurement",
          popup: ss
        });
        //ctxMenuForGraphics.addChild(MeasMenu);

        //Right-click Delete
        var SepMenu = new MenuSeparator();
        ctxMenuForGraphics.addChild(SepMenu);
        var MenuDelete = new MenuItem({
          label: "Delete",
          onClick: function() {
            var operation = new CustomOperation.Add({
              graphicsLayer: map.graphics,
              addedGraphic: selected
            });
            undoManager.add(operation);
            undoManager.undo();
            undoManager.remove(curcount);
          }
        });
        //ctxMenuForGraphics.addChild(MenuDelete);

        ctxMenuForGraphics.startup();

        map.graphics.on("mouse-over", function(evt) {
          // We'll use this "selected" graphic to enable editing tools
          // on this graphic when the user click on one of the tools
          // listed in the menu.
          ctxMenuForGraphics.addChild(EditMenu);
          ctxMenuForGraphics.addChild(MoveMenu);
          ctxMenuForGraphics.addChild(RoScMenu);
          ctxMenuForGraphics.addChild(TransMenu);
          ctxMenuForGraphics.addChild(MeasMenu);
          ctxMenuForGraphics.addChild(SepMenu);
          ctxMenuForGraphics.addChild(MenuDelete);
          selected = evt.graphic;
          SelectedTrans = 1 - selected.symbol.color.a;
          dijit.byId("TransPop").set("value", SelectedTrans);
          if (selected.symbol.style == "circle") {
            ctxMenuForGraphics.removeChild(EditMenu);
            ctxMenuForGraphics.removeChild(RoScMenu);
            ctxMenuForGraphics.removeChild(MeasMenu);
            ctxMenuForGraphics.removeChild(SepMenu);
            ctxMenuForGraphics.removeChild(TransMenu);
            ctxMenuForGraphics.removeChild(MenuDelete);
            ctxMenuForGraphics.removeChild(MoveMenu);
            ctxMenuForGraphics.addChild(MoveMenu);
            ctxMenuForGraphics.addChild(LatLongMenu);
            ctxMenuForGraphics.addChild(TransMenu);
            ctxMenuForGraphics.addChild(SepMenu);
            ctxMenuForGraphics.addChild(MenuDelete);
          }
          else if (selected.symbol.type == "textsymbol") {
            ctxMenuForGraphics.removeChild(MeasMenu);
            ctxMenuForGraphics.removeChild(LatLongMenu);
          }
          else {
            ctxMenuForGraphics.removeChild(LatLongMenu);
          }
          //Let's bind to the graphic underneath the mouse cursor
          ctxMenuForGraphics.bindDomNode(evt.graphic.getDojoShape().getNode());
          //var cnt = -1;
          //dojo.forEach(map.graphics.graphics, function(graphicf) {
          //cnt += 1;
          //  if (graphicf == evt.graphic) {
          //console.log("Hovered Graphic ID is :" + cnt.toString());
          //graphicsList.push(graphicf)
          //curcount = cnt.toString();
          //return;
          //}
          //});

        });

        map.graphics.on("mouse-out", function(evt) {
          ctxMenuForGraphics.unBindDomNode(evt.graphic.getDojoShape().getNode());
        });

      }


      //Helper Methods
      function getMapPointFromMenuPosition(box) {
        var x = box.x,
          y = box.y;
        switch (box.corner) {
          case "TR":
            x += box.w;
            break;
          case "BL":
            y += box.h;
            break;
          case "BR":
            x += box.w;
            y += box.h;
            break;
        }

        var screenPoint = new Point(x - map.position.x, y - map.position.y);
        return map.toMap(screenPoint);
      }
      registry.forEach(function(d) {
        // d is a reference to a dijit
        // could be a layout container or a button
        if (d.declaredClass === "dijit.form.Button") {
          buttonclick = d.on("click", activateTool);
        }
      });



      function activateTool(evt) {
        if (this.id == "Text" && myText !== "") {
          //Map Tooltip
          var tip = "Click to add text";
          var tooltip = domConstruct.create("div", {
            "class": "tooltip",
            "innerHTML": tip
          }, map.container);

          document.getElementById("GraphicHTML").innerHTML = "ready to add text";


          domStyle.set(tooltip, "position", "fixed");

          var toolFunc = map.on("mouse-move", function(evt) {
            var px, py;

            if (evt.clientX || evt.pageY) {
              px = evt.clientX;
              py = evt.clientY;

            }
            else {

              px = evt.clientX + win.body().scrollLeft - win.body().clientLeft;
              py = evt.clientY + win.body().scrollTop - win.body().clientTop;
            }

            tooltip.style.display = "none";
            domStyle.set(tooltip, {
              left: (px + 15) + "px",
              top: (py) + "px"
            });

            tooltip.style.display = "";
          });

          map.on("mouse-out", function(evt) {
            tooltip.style.display = "none";
          });

          var addText = map.on("click", function(evt) {
            symbol = new TextSymbol(myText).setColor(
              new Color(newColor)).setAlign(Font.ALIGN_START).setAngle(0).setDecoration(underline).setFont(
              new Font(myFont).setWeight(bold).setStyle(italic));
            point2 = new Point(evt.mapPoint);
            graphic = new Graphic(point2, symbol);
            addToMap();
            //map.graphics.add(graphic);
            addText.remove();
            domConstruct.destroy(tooltip);

          });

        }
        else {
          var tool = this.id.toUpperCase().replace(/ /g, "_");
          toolbar.activate(Draw[tool]);
        }
      }

      //Choose Style depending on Graphic Type
      function addToMap(evt) {
        if (evt === undefined) {
          console.log("undefined");
        }
        else {
          toolbar.deactivate();
          var Testcolor = cp.value;
          if (Testcolor === "") {
            newColor = newColor;
          }
          else {
            docolor();
          }
          switch (evt.geometry.type) {
            case "point":
            case "multipoint":
              symbol = new SimpleMarkerSymbol(SimpleMarkerSymbol.STYLE_CIRCLE, myNumber,
                new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                  new Color(newColor), 1),
                new Color(newColor));
              break;
            case "polyline":
              symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color(newColor), myNumber);
              break;
            default:
              symbol = new SimpleFillSymbol(symbolfill, new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
                new Color(newColor), myNumber), new Color(newColor));
              break;
          }
          graphic = new Graphic(evt.geometry, symbol);
        }
        var operation = new CustomOperation.Add({
          graphicsLayer: map.graphics,
          addedGraphic: graphic
        });

        undoManager.add(operation);
        map.graphics.add(graphic);
      }

      //Polygon Fill Checkbox
      var FillcheckBox = new CheckBox({
        name: "FillcheckBox",
        value: "agreed",
        checked: false,
        onChange: function(b) {
          if (b === true) {
            symbolfill = SimpleFillSymbol.STYLE_SOLID;
          }
          else {
            symbolfill = SimpleFillSymbol.STYLE_NULL;
          }
        }
      }, "FillcheckBox").startup();

      //Measurement Checkbox
      var MeasCheckBox = new CheckBox({
        name: "MeasCheckBox",
        value: "agreed",
        checked: false,
        onChange: function(b) {
          if (b === true) {
            MeasureDo = toolbar.on("draw-complete", addMeas);
          }
          else {
            MeasureDo.remove();
          }
        }
      }, "MeasCheckBox").startup();

      //Graphic Size/Thickness Spinner
      var mySpinner1 = new NumberSpinner({
        value: 3,
        smallDelta: 1,
        constraints: {
          min: 1,
          max: 100,
          places: 0
        },
        id: "integerspinner3",
        style: "width:40px"
      }, "spinnerId1");

      //Changes Graphic Size/Thickness
      on(mySpinner1, "change", donumber);

      function donumber() {
        myNumber = mySpinner1.get("value");
      }

      //Font Size Spinner
      var mySpinner2 = new NumberSpinner({
        value: 12,
        smallDelta: 1,
        constraints: {
          min: 1,
          max: 100,
          places: 0
        },
        id: "integerspinner4",
        style: "width:45px"
      }, "spinnerId2");

      //Changes Font Size
      on(mySpinner2, "change", doFont);

      function doFont() {
        myFont = mySpinner2.get("value");
      }

      //Changes Text to Bold
      on(dijit.byId("bold"), "change", function(evt) {
        if (evt === true) {
          bold = Font.WEIGHT_BOLD;
        }
        else {
          bold = Font.WEIGHT_NORMAL;
        }
      });

      //Changes Text to Underline
      on(dijit.byId("underline"), "change", function(evt) {
        if (evt === true) {
          underline = "underline";
        }
        else {
          underline = "none";
        }
      });

      //Changes Text to Italic
      on(dijit.byId("italic"), "change", function(evt) {
        if (evt === true) {
          italic = Font.STYLE_ITALIC;
        }
        else {
          italic = Font.STYLE_NORMAL;
        }
      });

      //Get the color from the Color Pallette
      var cp = registry.byId('colorPaletteWidget');
      on(registry.byId("colorPaletteWidget"), "change", docolor);
      cp.set("value", "#000000");

      function docolor() {
        hexColor = cp.value;
        domStyle.set(dojo.byId('colorSwatch'), {
          backgroundColor: cp.value
        });
        popup.close(registry.byId("colorPaletteDialog"));

        function hexToRgb(hexColor) {
          var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
          return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
          } : null;
        }
        red = (hexToRgb(hexColor).r);
        green = (hexToRgb(hexColor).g);
        blue = (hexToRgb(hexColor).b);
        newColor = [red, green, blue, TransVal];
      }

      //Transparency slider
      currentTrans = new HorizontalSlider({
        name: "TransSlider",
        value: 0,
        minimum: 0,
        maximum: 0.99,
        intermediateChanges: true,
        style: "width:130px",
        onChange: function(val) {
          dom.byId("slider1input").value = dojo.number.format(val, {
            places: 0,
            pattern: "#%"
          });
          TransVal = 1 - val;
          newColor = [red, green, blue, TransVal];
        }
      }, "TransSlider").startup();

      //Get the value from the Text Box
      var box0 = registry.byId("value0Box");
      on(box0, "change", dotext);

      function dotext() {
        myText = box0.get("value");
        return;
      }

      //Clear all Graphics function
      on(registry.byId("clear"), "click", drawclear);

      function drawclear() {
        graphicsList = [];
        buttonclick.remove();
        map.graphics.clear();
        undoManager.clearRedo();
        undoManager.clearUndo();
      }

      //Add Measurements to graphics
      var geometryService = new GeometryService("http://recover.giscenter.isu.edu/arcgis/rest/services/Utilities/Geometry/GeometryServer");

      //Standard Units
      var Unit_Area = GeometryService.UNIT_SQUARE_FEET;
      var Unit_Line = GeometryService.UNIT_FOOT;
      var Unit_A_Label = " sq. feet";
      var Unit_L_Label = " feet";

      function addMeas(evt) {
        if (evt.geographicGeometry.type == "point") {
          var lat = number.format(evt.geographicGeometry.y, {
            places: 5
          });
          var longi = number.format(evt.geographicGeometry.x, {
            places: 5
          });
          var labelPoint = evt.geometry;
          var textSymbol = new TextSymbol(
            "Lat: " + (lat) + ", Long: " + (longi)).setColor(
            new Color(newColor)).setAlign(Font.ALIGN_MIDDLE).setAngle(0).setDecoration(italic).setOffset(5, 5).setFont(
            new Font(myFont).setWeight(bold).setStyle(italic));
          var labelPointGraphic = new Graphic(labelPoint, textSymbol);
          map.graphics.add(labelPointGraphic);

        }
        else if (evt.geographicGeometry.type == "polyline") {
          var lengthParams = new LengthsParameters();
          lengthParams.lengthUnit = Unit_Line;
          lengthParams.polylines = [evt.geometry];
          lengthParams.geodesic = true;
          geometryService.lengths(lengthParams);
          Lat = evt.geographicGeometry.paths[0][0][1];
          Long = evt.geographicGeometry.paths[0][0][0];

        }
        else if (evt.geographicGeometry.type == "polygon") {
          if (dijit.byId("FillcheckBox").get("checked")) {
            polygonColor = [255, 255, 255];
          }
          else if (dijit.byId("FillcheckBox").get("checked") !== true) {
            polygonColor = newColor;
          }
          var areaParams = new AreasAndLengthsParameters();
          areaParams.areaUnit = Unit_Area;
          areaParams.lengthUnit = Unit_Line;
          areaParams.polygons = [evt.geometry];
          geometryService.simplify(areaParams.polygons, getLabelPoints);
          geometryService.areasAndLengths(areaParams);

        }
        else {
          alert("In developement!");
        }
      }

      //Create Length label
      geometryService.on("lengths-complete", function(result) {
        if (measureUnit == "YARDS") {
          linelengthInt = result.result.lengths[0];
          linelength = number.format(linelengthInt * 1760, {
            places: 2
          });
        }
        else {
          linelength = number.format(result.result.lengths[0], {
            places: 2
          });
        }

        labelPoint = new Point(Long, Lat);
        textSymbol = new TextSymbol(linelength + Unit_L_Label).setColor(
          new Color(newColor)).setAlign(Font.ALIGN_MIDDLE).setAngle(0).setDecoration(italic).setOffset(5, 5).setFont(
          new Font(myFont).setWeight(bold).setStyle(italic));
        labelPointGraphic = new Graphic(labelPoint, textSymbol);
        map.graphics.add(labelPointGraphic);
      });

      //Create Area Label
      function getLabelPoints(geometries) {
        geometryService.labelPoints(geometries, function(labelPoints) {
          array.forEach(labelPoints, function(labelPoint) {
            var font = new Font(myFont).setWeight(bold);
            var textSymbol = new TextSymbol((PolyArea + Unit_A_Label), font, new Color(polygonColor));
            var labelPointGraphic = new Graphic(labelPoint, textSymbol);
            map.graphics.add(labelPointGraphic);

          });
        });
      }
      //Get Area
      geometryService.on("areas-and-lengths-complete", function(result) {
        PolyArea = number.format(result.result.areas[0], {
          places: 2
        });
      });

      //Create Unit dropdown
      var store = new Memory({
        data: [{
          id: "FEET",
          label: "Feet"
        }, {
          id: "MILES",
          label: "Miles"
        }, {
          id: "METERS",
          label: "Meters"
        }, {
          id: "YARDS",
          label: "Yards"
        }, {
          id: "KILO",
          label: "Kilometers"
        }]
      });

      var os = new ObjectStore({
        objectStore: store
      });

      var s = new Select({
        store: os
      }, "units");
      s.startup();

      s.on("change", function(evt) {
        measureUnit = evt;
        if (evt == "FEET") {
          Unit_Area = GeometryService.UNIT_SQUARE_FEET;
          Unit_Line = GeometryService.UNIT_FOOT;
          Unit_A_Label = " sq. feet";
          Unit_L_Label = " feet";
        }
        else if (evt == "MILES") {
          Unit_Area = GeometryService.UNIT_SQUARE_MILES;
          Unit_Line = GeometryService.UNIT_STATUTE_MILE;
          Unit_A_Label = " sq. miles";
          Unit_L_Label = " miles";
        }
        else if (evt == "METERS") {
          Unit_Area = GeometryService.UNIT_SQUARE_METERS;
          Unit_Line = GeometryService.UNIT_METER;
          Unit_A_Label = " sq. meters";
          Unit_L_Label = " meters";
        }
        else if (evt == "KILO") {
          Unit_Area = GeometryService.UNIT_SQUARE_KILOMETERS;
          Unit_Line = GeometryService.UNIT_KILOMETER;
          Unit_A_Label = " sq. kilometers";
          Unit_L_Label = " kilometers";
        }
        else if (evt == "YARDS") {
          Unit_Area = GeometryService.UNIT_SQUARE_YARDS;
          Unit_Line = GeometryService.UNIT_STATUTE_MILE;
          Unit_A_Label = " sq. yards";
          Unit_L_Label = " yards";
        }
      });
      connect.connect(undoManager, "onChange", function() {
        //enable or disable buttons depending on current state of application
        if (undoManager.canUndo) {
          registry.byId("undo").set("disabled", false);
        }
        else {
          registry.byId("undo").set("disabled", true);
        }

        if (undoManager.canRedo) {
          registry.byId("redo").set("disabled", false);
        }
        else {
          registry.byId("redo").set("disabled", true);
        }
      });

      //get json string from uploaded file using File application
      $('#file-input').on("change", function(evt) {
        if (!window.FileReader)
          return; // Browser is not compatible

        var reader = new FileReader();

        reader.onload = function(evt) {
          if (evt.target.readyState != 2) return;
          if (evt.target.error) {
            alert('Errorwhile reading file');
            return;
          }

          var userGraphics = JSON.parse(evt.target.result);
          for (var obj in userGraphics) {
            console.log(userGraphics[obj]);
            var graphic = new Graphic(userGraphics[obj]);
            map.graphics.add(graphic);
          }

          $("#file-input").val = evt.target.result;
        };

        reader.readAsText(evt.target.files[0]);


        console.log(" a json file has been uploaded");
        $("#file-input").val('');
      });
    });
}());

(function(){
require([
  "esri/config",
  "esri/InfoTemplate",
  "esri/map",
  "esri/request",
  "esri/geometry/scaleUtils",
  "esri/layers/FeatureLayer",
  "esri/renderers/SimpleRenderer",
  "esri/symbols/PictureMarkerSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/symbols/SimpleLineSymbol",
  "dojo/dom",
  "dojo/json",
  "dojo/on",
  "dojo/parser",
  "dojo/sniff",
  "dojo/_base/array",
  "esri/Color",
  "dojo/_base/lang",
  "dijit/layout/BorderContainer",
  "dijit/layout/ContentPane",
  "dojo/domReady!"
],

function (
  esriConfig, InfoTemplate, Map, esriRequest, scaleUtils, FeatureLayer,
        SimpleRenderer, PictureMarkerSymbol, SimpleFillSymbol, SimpleLineSymbol,
        dom, JSON, on, parser, sniff, arrayUtils, Color, lang
) {

 parser.parse();
//add shapefile to map via import shapefile widget
var portalUrl = "http://www.arcgis.com";


on(dom.byId("uploadForm"), "change", function (event) {
  var fileName = event.target.value.toLowerCase();

  if (sniff("ie")) { //filename is full path in IE so extract the file name
    var arr = fileName.split("\\");
    fileName = arr[arr.length - 1];
  }
  if (fileName.indexOf(".zip") !== -1) {//is file a zip - if not notify user
    generateFeatureCollection(fileName);
  }
  else {
    dom.byId('upload-status').innerHTML = '<p style="color:red">Add shapefile as .zip file</p>';
  }
});


  function generateFeatureCollection (fileName) {
    var name = fileName.split(".");
    //Chrome and IE add c:\fakepath to the value - we need to remove it
    //See this link for more info: http://davidwalsh.name/fakepath
    name = name[0].replace("c:\\fakepath\\", "");

    dom.byId('upload-status').innerHTML = '<b>Loading </b>' + name;

    //Define the input params for generate see the rest doc for details
    //http://www.arcgis.com/apidocs/rest/index.html?generate.html
    var params = {
      'name': name,
      'targetSR': map.spatialReference,
      'maxRecordCount': 1000,
      'enforceInputFileSizeLimit': true,
      'enforceOutputJsonSizeLimit': true
    };

    //generalize features for display Here we generalize at 1:40,000 which is approx 10 meters
    //This should work well when using web mercator.
    var extent = scaleUtils.getExtentForScale(map, 40000);
    var resolution = extent.getWidth() / map.width;
    params.generalize = true;
    params.maxAllowableOffset = resolution;
    params.reducePrecision = true;
    params.numberOfDigitsAfterDecimal = 0;

  var myContent = {
    'filetype': 'shapefile',
    'publishParameters': JSON.stringify(params),
    'f': 'json'
  };

//use the rest generate operation to generate a feature collection from the zipped shapefile
esriRequest({
  url: portalUrl + '/sharing/rest/content/features/generate',
  content: myContent,
  form: dom.byId('uploadForm'),
  handleAs: 'json',
  load: lang.hitch(this, function (response) {
    if (response.error) {
      errorHandler(response.error);
      return;
    }
    var layerName = response.featureCollection.layers[0].layerDefinition.name;
    dom.byId('upload-status').innerHTML = '<b>Loaded: </b>' + layerName;
    addShapefileToMap(response.featureCollection);
  }),
  error: lang.hitch(this, errorHandler)
});



  function errorHandler (error) {
  dom.byId('upload-status').innerHTML =
  "<p style='color:red'>" + error.message + "</p>";
  }

  function addShapefileToMap (featureCollection) {
  //add the shapefile to the map and zoom to the feature collection extent
  //If you want to persist the feature collection when you reload browser you could store the collection in
  //local storage by serializing the layer using featureLayer.toJson()  see the 'Feature Collection in Local Storage' sample
  //for an example of how to work with local storage.
  var fullExtent;

  arrayUtils.forEach(featureCollection.layers, function (layer) {
    var infoTemplate = new InfoTemplate("Details", "${*}");
    var featureLayer = new FeatureLayer(layer, {
      infoTemplate: infoTemplate
    });
    //associate the feature with the popup on click to enable highlight and zoom to
    featureLayer.on('click', function (event) {
      map.infoWindow.setFeatures([event.graphic]);
    });
    //change default symbol if desired. Comment this out and the layer will draw with the default symbology
    changeRenderer(featureLayer);
    fullExtent = fullExtent ?
      fullExtent.union(featureLayer.fullExtent) : featureLayer.fullExtent;
    layers.push(featureLayer);
  });
  map.addLayers(layers);
  map.setExtent(fullExtent.expand(1.25), true);

  dom.byId('upload-status').innerHTML = "";
  }

    function changeRenderer (layer) {
    //change the default symbol for the feature collection for polygons and points
    var symbol = null;
    switch (layer.geometryType) {
      case 'esriGeometryPoint':
        symbol = new PictureMarkerSymbol({
          'angle': 0,
          'xoffset': 0,
          'yoffset': 0,
          'type': 'esriPMS',
          'url': 'http://static.arcgis.com/images/Symbols/Shapes/BluePin1LargeB.png',
          'contentType': 'image/png',
          'width': 20,
          'height': 20
        });
    break;
      case 'esriGeometryPolygon':
        symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
            // input fire boundary display values.  first color is border color and thickness, second color
            // is fill color and opacity
            new Color([255, 0, 0]), 4), new Color([255, 255, 255, 0.5]));
    break;
        }
        if (symbol) {
          layer.setRenderer(new SimpleRenderer(symbol));
        }
      }
    }
  });
}());

(function() {
    var app = {};
    // Get references to modules to be used
    require([

            "esri/config", // The default values for all JS API configuration options.


            "esri/tasks/GeometryService",
            "esri/tasks/PrintTask", // printer
            "esri/tasks/PrintParameters", // printer
            "esri/tasks/PrintTemplate", // printer

            "dojo/_base/array",

            "dojo/dom",
            "dojo/on",
            "dojo/parser",

            "dijit/layout/BorderContainer",
            "dijit/layout/ContentPane",
            "dijit/TitlePane",
            "dijit/form/CheckBox",
            "dojo/domReady!"
        ],

        // Set variables to be used with references (write variables and references in the same order and be careful of typos on your references)
        function(esriConfig, GeometryService,
            PrintTask, PrintParameters, PrintTemplate, arrayUtils, dom, on, parser) {

            /*global map*/

            // begin print Task
            app.printUrl = "http://fuji.giscenter.isu.edu/arcgis/rest/services/RECOVER/ExportWebMap/GPServer/Export%20Web%20Map";

            function createPrintTask(printTitle, printAuthor) {
                var template = new PrintTemplate();
                template.layout = document.getElementById("printLayoutId").value; // Assigns the layout
                template.format = document.getElementById("printFormatId").value; // Assigns the format to printout to
                template.layoutOptions = {
                    titleText: printTitle, // title to display
                    authorText: printAuthor
                };

                var params = new PrintParameters();
                params.map = map;
                params.template = template;

                var printTask = new PrintTask(app.printUrl);
                var printObj = {
                    printTask: printTask,
                    params: params
                };
                return printObj;
            }


            // Activates printer
            on(dom.byId("btnPrintReady"), "click", function() {
                document.getElementById("btnPrintReady").innerHTML = "Printing...";
                document.getElementById("btnPrintReady").disabled = true; // Button disable while printing
                var printObj = createPrintTask(document.getElementById("printTitleId").value, document.getElementById("printAuthor").value); // Gets titles displayed
                var printTask = printObj.printTask;
                printTask.execute(printObj.params, function(evt) {
                    window.open(evt.url);
                    document.getElementById("btnPrintReady").innerHTML = "Print";
                    document.getElementById("btnPrintReady").disabled = false;
                });
            });
            // end of print task




        });
}());
