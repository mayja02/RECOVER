#########################################################################
# Title: CreateFireReports.py                                           #
# Author: Jeff May                                                      #
# Created: 10/28/2015                                                   #
#                                                                       #
# This script is used by the CreateFireReports script tool to create    #
# summary and detailed fire reports for a specific fire after the       #
# the RECOVER web client for the fire in question has been created      #
# using either the CreateRECOVER geoprocessing service or ArcToolbox    #
# model.  This tool cannot be run as a stand-alone script and must be   #
# used as an ArcMap Script Tool within a ArcToolbox (.tbx)              #
#########################################################################

import arcpy, arcpy.mapping, os

fireName = str(arcpy.GetParameterAsText(0))
stateId = arcpy.GetParameterAsText(1)
#Initialize local variables
fireId = fireName + "Fire_" + stateId
dataLocal = "D:\\ArcGISServer\\RECOVER3\\output\\"+fireId+"\\data\\data.gdb\\"
smaOutput = dataLocal+"SMA_Soils_" + fireId
smaStats = dataLocal + fireId + "_summary"
supportDocs = "D:\\ArcGISServer\\RECOVER3\\output\\"+fireId+"\\supportingDocs\\"
PDFoutput = "D:\\Website\\RECOVER3\\" + fireId + "\\assets\\reports\\" + fireId
detailedRLF = supportDocs + "DetailedReport.rlf"
summaryRLF = supportDocs + "SummaryReport.rlf"
defaultHTM = "D:\\Website\\RECOVER3\\" + fireId + "\\default.htm"
Err1 = "D:\\Website\\RECOVER3\\" + fireId + "\\assets\\reports\\" + "ReportErr_Summary.pdf"
Err2 = "D:\\Website\\RECOVER3\\" + fireId + "\\assets\\reports\\" + "ReportErr_Detailed.pdf"
Summary = "D:\\Website\\RECOVER3\\" + fireId + "\\assets\\reports\\" + fireId + "_summary.pdf"
Detailed = "D:\\Website\\RECOVER3\\" + fireId + "\\assets\\reports\\" + fireId + "_detailed.pdf"
arcpy.env.workspace = "d:\\arcgisserver\\recover3\\output"
if arcpy.Exists(fireId):
    if arcpy.Exists (dataLocal + "fireBndry"):
        if arcpy.Exists(Detailed):
            arcpy.AddMessage('#############################')
            arcpy.AddMessage("The DETAILED report for this fire already exists")
        else:
            lyr = arcpy.mapping.Layer(smaOutput)
            arcpy.mapping.ExportReport(lyr,detailedRLF, PDFoutput + "_detailed.pdf")
            del lyr
            arcpy.AddMessage("Detailed fire report created.")

        if arcpy.Exists(Summary):
            arcpy.AddMessage("The SUMMARY report for this fire already exists")
        else:
            lyr = arcpy.mapping.TableView(smaStats)
            arcpy.mapping.ExportReport(lyr, summaryRLF, PDFoutput + "_summary.pdf")
            del lyr
            arcpy.AddMessage("Summary fire report created.")
    else:
        arcpy.AddMessage('#############################')
        arcpy.AddMessage("The boundary layer for " + fireId + " does not exist, unable to create fire reports")
        arcpy.AddMessage('#############################')
else:
    arcpy.AddMessage("#######################################")
    arcpy.AddMessage("The fire name you entered does not exist")
    arcpy.AddMessage("Please verify the name of the fire you wish to generate \nreports for and try the tool again")
    arcpy.AddMessage("#######################################")

#Update default.htm report links with paths to pdf reports
if arcpy.Exists(Summary) and arcpy.Exists(Detailed):
    arcpy.AddMessage("Updating " + defaultHTM)
    input_file = open(defaultHTM)
    contents = input_file.read()
    input_file.close()
    contents = contents.replace("ReportErr_Summary", fireId + "_summary")
    contents = contents.replace("ReportErr_Detailed", fireId + "_detailed")
    output_file = open(defaultHTM,"w")
    output_file.write(contents)
    output_file.close()
    os.remove(Err1)
    os.remove(Err2)
    del input_file, contents, output_file
    arcpy.AddMessage("..." + defaultHTM + " updated.")

arcpy.AddMessage('#############################')
arcpy.AddMessage("Process Complete.")
