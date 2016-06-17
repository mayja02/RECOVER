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
