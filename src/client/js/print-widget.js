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
