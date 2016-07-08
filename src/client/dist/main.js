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
  Color, Scalebar,Popup, OverviewMap, Basemap, BasemapGallery, connect,  on,  query, arrayUtils, TOC, move, dom, domConstruct, parser){

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

    window.onkeydown = function (e) {
    console.log(e.keyCode);
    if (e.keyCode === 112) {
      var win = window.open('http://giscenter.isu.edu/research/Techpg/nasa_RECOVER/index.htm', '_blank');
      if (win) {
        //Browser has allowed it to be opened
        win.focus();
      } else {
        //Browser has blocked it
        alert('Please allow popups for this website');
      }
          }
    };


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
    map.addLayers([FireSeverity, FireRecords, FireLine, baseLyrs]);
    // map.addLayer(fireAffectedVegetation);
    });

    layers.push(baseLyrs);

  //build table of contents using TOC library
    map.on('layers-add-result', function(evt){
            toc = new TOC({
              map: map,
              layerInfos: [{
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
              }, {
                layer: baseLyrs,
                title: "RECOVER Base Layers",
                collapsed: true, // whether this root layer should be collapsed initially, default false.
                slider: true // whether to display a transparency slider.
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

       for(var i = 0; i < toc.layerInfos[3].layer._tocInfos.length; i++){

         var layer = toc.layerInfos[3].layer._tocInfos[i];

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
