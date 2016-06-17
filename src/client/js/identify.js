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
