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
