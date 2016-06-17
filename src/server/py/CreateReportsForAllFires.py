#########################################################################
# CreateReportsForAllFires.py                                           #
# Author: Jeff May (mayjeff2@isu.edu)                                   #
# Date Created: January 6, 2016                                         #
# Modified: January 6, 2016                                             #
#                                                                       #
# This script will check the fire specific folders for applications     #
# created by the RECOVER Client Generator to see if Detailed and        #
# Summary reports for each fire exist.  If they do not, the script      #
# will create both reports and update the fire specific web application.#
# Reports cannot be created for applications which do not include a     #
# fire boundary feature class                                           #
#                                                                       #
# This script is intended to be executed as a stand-alone python script #
# Later, this script can be automated using a task scheduler to run as  #
# as frequently as necessary to ensure that all fire applications       #
#have reportsassociated with them.                                      #
#########################################################################
#########################################################################

# import modules
import arcpy, os, time
from PyPDF2 import PdfFileMerger, PdfFileReader

# get start time
start = time.time()

#declare variables
path = "d:/ArcGISServer/RECOVER3/output/"
path2 = "d:/Website/RECOVER3/"
dirs = os.listdir(path)
dirs2 = os.listdir(path2)
Err ="ReportErr.pdf"
List = []
Fires = []

# for loop creates a list of fire folders that exists in the directory
# using the specific fire name (ie. CrystalFire_ID) that do not have reports
for d in dirs:
    if d in dirs2:
        List.append (path2 + d)
for L in List:
    searchDir = L + "/assets/reports/"
    # check to see if ReportErr_*.pdf exists (this is default doc
    # indicated that reports have not yet been created).
    if os.path.isfile(os.path.join(searchDir, Err)):
        name = os.path.join(searchDir).split("/")[-4]
        print name
        Fires.append(name)
    else:
        name = L.split("/")[-1]
        print "It appears that reports for " + name + " have already been created"

# for loop iterates through list of Fires that do not have reports created,
# creates detailed and summary reports for each fire, and updates site specific
# web page with newly created reports.  If for some reason the detailed or
# summary report exist, the user will be notified in the process output.
for Fire in Fires:

    # declaring fire name specific variables
    dataLocal = "D:\\ArcGISServer\\RECOVER3\\output\\"+Fire+"\\data\\data.gdb\\"
    smaOutput = dataLocal+"SMA_Soils_" + Fire
    smaStats = dataLocal + Fire + "_summary"
    supportDocs = "D:\\ArcGISServer\\RECOVER3\\output\\"+Fire+"\\supportingDocs\\"
    PDFoutput = "D:\\Website\\RECOVER3\\" + Fire + "\\assets\\reports\\"
    detailedRLF = supportDocs + "DetailedReport.rlf"
    summaryRLF = supportDocs + "SummaryReport.rlf"
    defaultHTM = "D:\\Website\\RECOVER3\\" + Fire + "\\default.htm"
    Err = "D:\\Website\\RECOVER3\\" + Fire + "\\assets\\reports\\" + "ReportErr.pdf"
    Summary = "D:\\Website\\RECOVER3\\" + Fire + "\\assets\\reports\\" + Fire + "_summary.pdf"
    Detailed = "D:\\Website\\RECOVER3\\" + Fire + "\\assets\\reports\\" + Fire + "_detailed.pdf"
    if arcpy.Exists (dataLocal + "fireBndry"):
        if arcpy.Exists(Detailed):
            print("The DETAILED report for " + Fire + " already exists")
        else:
            lyr = arcpy.mapping.Layer(smaOutput)
            arcpy.mapping.ExportReport(lyr,detailedRLF, PDFoutput + Fire + "_detailed.pdf")
            del lyr
            print("Detailed report for " + Fire + " created.")

        if arcpy.Exists(Summary):
            print("The SUMMARY report for " + Fire + " already exists")
        else:
            lyr = arcpy.mapping.TableView(smaStats)
            arcpy.mapping.ExportReport(lyr, summaryRLF, PDFoutput + Fire + "_summary.pdf")
            del lyr
            print("Summary fire report for " + Fire + " created.")
    else:
        print('#############################')
        print("The boundary layer for " + Fire + " does not exist, unable to create fire reports")
        print('#############################')


    #Update default.htm report links with paths to pdf reports
    if arcpy.Exists(Summary) and arcpy.Exists(Detailed):
        print("Merging PDF reports")
        merger = PdfFileMerger()
        merger.append(PdfFileReader(Summary, 'rb'))
        merger.append(PdfFileReader(Detailed, 'rb'))
        merger.write(PDFoutput + Fire + "_REPORTS.pdf")
        print("Reports compiled")
        os.remove(Summary)
        os.remove(Detailed)
        os.remove(Err)
        print("Updating " + defaultHTM)
        input_file = open(defaultHTM)
        contents = input_file.read()
        input_file.close()
        contents = contents.replace("ReportErr", Fire + "_REPORTS")
        output_file = open(defaultHTM,"w")
        output_file.write(contents)
        output_file.close()
        del input_file, contents, output_file
        print("..." + defaultHTM + " updated.")
        print("Reports for " + Fire + " Created and web application updated")
        
# establish end time
totTime = str(((time.time() - start)/60))

print('#############################')
print("Process Completed in " + totTime + " minutes")
        

