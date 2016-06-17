################################################################################
# RECOVER_ClientGenerator.py
#
# Script extracts data from RECOVER.mxd and creates RECOVER DSS web application
# Author: Jeff May (mayjeff2@isu.edu / mayja02@gmail.com)
#
# Dependencies: SendRECOVERMail.py (scripts), RECOVER.tbx
#
# Notes: Script is inteded to be ran as a script tool w/i ArcMap.
#
################################################################################

## Importing modules
import os, sys, arcpy, traceback, time, distutils.core, zipfile, shutil, fnmatch, urllib, urllib2, json
import SendRECOVERMail
import arcpy.mapping
import xml.dom.minidom as DOM 
from arcpy import env
from arcpy.sa import *
import re

# Establish Start Time
t1=time.time()

### Welcome Statement

arcpy.AddMessage("Welcome to the RECOVER Web Client automation script.")
arcpy.AddMessage("Establishing local variables...")


# Retrieving Fire Name Input
fireName = str(arcpy.GetParameterAsText(0)).replace(" ", "")
fireBndry = arcpy.GetParameterAsText(1)

# Get the Parameters
layers = arcpy.GetParameterAsText(2).split(";")
areaOfInterest = arcpy.GetParameter(3)
inputFeatureFormat = arcpy.GetParameterAsText(4)
inputRasterFormat = arcpy.GetParameterAsText(5)
coordinateSystem = arcpy.GetParameterAsText(6)
customCoordSystemFolder = arcpy.GetParameterAsText(7)
userEmail = arcpy.GetParameterAsText(8)
stateId = arcpy.GetParameterAsText(9)
contained = arcpy.GetParameter(10)
dNBR = arcpy.GetParameter(11)
DFM = arcpy.GetParameter(12)
vegMonitor = arcpy.GetParameter(13)
fireId = str(fireName + "Fire" + "_" + stateId)



# rootData and rootWeb variables will need to be checked
# when migrating script to new servers
rootData = "D:\\ArcGISServer\\RECOVER3\\"
rootWeb = "D:\\Website\\RECOVER3\\"
fireData = "D:\\ArcGISServer\\RECOVER3\\output\\" + fireId + "\\"
fireWeb = "D:\\Website\\RECOVER3\\" + fireId

# Establishing Variables for Transferring Data/FlexApp Folders
tempDF = rootData + "_template\\_dataTemplate\\"
Topography = rootData + "topography\\"
tempAF = "D:\\Website\\RECOVER3\\_template\\_flexAppTemplate\\"
symDir = rootData + "Symbology\\"
LandFireArray = ["BPS_BioPhysicalSetting.tif", "FRG_FireRegimeGroup.tif", "EVC_ExistingVegetationCover.tif", "EVT_ExistingVegetationType.tif", "ESP_EnvironmentalSitePotential.tif"]
TopographyArray = ["Elevation_tif.tif", "Slope_degree_tif.tif", "Slope_percent_tif.tif", "SlopeGTE30d_tif.tif", "Aspect_tif.tif", "HillShade_tif.tif"]
outputZipFile = fireData + ".zip"

# Establishing Variables for Publishing Map Service
dataLocal = fireData + "\\data\\data.gdb\\"
dataPath = fireData + "\\data\\"
dataSrc = fireWeb + "\\assets\\" + fireId + ".zip"
wrkspc = fireData + "\\individual_services\\"
supportDocs = fireData + "\\supportingDocs\\" 
prj = rootData + "SpatialReference\\WGS_1984_Web_Mercator_Auxiliary_Sphere.prj"
tags = "RECOVER,wildfire"

# Establishing Fire Report Variables
featBndry = dataLocal + 'fireBndry'
smaSoils = rootData + "RECOVER3.gdb\\SMA_Soils"
inFeatures = [smaSoils, featBndry]
smaOutput = dataLocal+"SMA_Soils_" + fireId
smaStats = dataLocal + fireId + "_summary"
statsFields = [["Acres", "SUM"]]
caseField = "ADMIN_AGENCY"
expression = "!shape.area@acres!"
PDFoutput = rootWeb + fireId + "\\assets\\reports\\" + fireId
detailedRLF = supportDocs + "DetailedReport.rlf"
summaryRLF = supportDocs + "SummaryReport.rlf"
configXML =  fireWeb + "\\config.xml"
identifyXML =  fireWeb + "\\widgets\\Identify\\IdentifyWidget.xml"
bookmarkXML =  fireWeb + "\\widgets\\Bookmark\\BookmarkWidget.xml"
HeaderXML =  fireWeb + "\\widgets\\HeaderController\\HeaderControllerWidget.xml"
defaultHTM =  fireWeb + "\\default.htm"
inFiles=[detailedRLF, summaryRLF, configXML, identifyXML, bookmarkXML, HeaderXML, defaultHTM]

# Establishing server variables (server specific)
# These variables will need updated when migrating to different servers
service = "basemap"
sddraft = wrkspc + service + ".sddraft"
sd = wrkspc + service + ".sd"
con = supportDocs+"RECOVER Administrator.ags"
fireFolder = "RECOVER3_" + fireId
URL = "http://recover.giscenter.isu.edu/recover3/"+fireId
server = "recover.giscenter.isu.edu"
port = 6080
adminUser = 
adminPass = 
serviceName = fireFolder + "//" + service + ".MapServer"
stopStart = "Delete"

class LicenseError(Exception):
    pass


def setUpCoordSystemEnvironment(coordinateSystem, customCoordSystemFolder):
    # get the correct spatial reference and set it into the environment
    # so that the data will get projected when clip runs
    # if it is a number, assume we have a WKID and set it directly in
    # else, find the file in the Coordinate System directory
    if coordinateSystem.lower() == "same as input" or coordinateSystem == "":
        return "same as input"

    if coordinateSystem.strip().isalnum() and customCoordSystemFolder == "":
        try:
            arcpy.OutputCoordinateSystem = coordinateSystem.strip()
        except:
            #Message "Coordinate System WKID %s is not valid.  Output Coordinate System will be the same as the input layer's Coordinate System"
            arcpy.AddWarning(get_ID_message(86131) % (coordinateSystem))
            coordinateSystem = "same as input"
            arcpy.OutputCoordinateSystem = None
            pass
        return coordinateSystem

    found = False
    # Search custom folder if specified
    if customCoordSystemFolder != "":
        found, coordinateSystemPath = getPRJFile(coordinateSystem, customCoordSystemFolder)

    # Search to see if we can find the spatial reference
    if not found:
        srList = arcpy.ListSpatialReferences("*/%s" % coordinateSystem)
        if srList:
            coordinateSystemPath = os.path.join(os.path.join(arcpy.getinstallinfo()["InstallDir"], "Coordinate Systems"), srList[0]) + ".prj"
            found = True

    if found:
        arcpy.OutputCoordinateSystem = arcpy.SpatialReference(coordinateSystemPath).factoryCode
        return coordinateSystemPath
    else:
        #Message "Couldn't find the specified projection file %s.  Output Coordinate System will be the same as the input layer's Coordinate System."
        arcpy.AddWarning(get_ID_message(86132) % coordinateSystem)
        return "same as input"

def getPRJFile(inputCoordSysString, prjDir):
    inputCoordSysString += ".prj"
    # walk through the dirs to find the prj file
    if os.path.exists(prjDir):
        for x in os.walk(prjDir):
            if inputCoordSysString in x[2]:
                return True, os.path.join(x[0], inputCoordSysString)
    else:
        return False, ""

    # if we got to here then it didn't find the prj file
    return False, ""

def zipUpFolder(folder, outZipFile):
    # zip the data
    try:
        zip = zipfile.ZipFile(outZipFile, 'w', zipfile.ZIP_DEFLATED)
        zipws(unicode(folder), zip, "CONTENTS_ONLY")
        zip.close()
    except RuntimeError:
        # Delete zip file if Exists
        if os.path.exists(outZipFile):
            os.unlink(outZipFile)
        zip = zipfile.ZipFile(outZipFile, 'w', zipfile.ZIP_STORED)
        zipws(unicode(folder), zip, "CONTENTS_ONLY")
        zip.close()
        #Message"  Unable to compress zip file contents."
        arcpy.AddWarning(get_ID_message(86133))

def zipws(path, zip, keep):
    path = os.path.normpath(path)
    # os.walk visits every subdirectory, returning a 3-tuple
    #  of directory name, subdirectories in it, and filenames
    #  in it.
    for (dirpath, dirnames, filenames) in os.walk(path):
        # Iterate over every filename
        for file in filenames:
            # Ignore .lock files
            if not file.endswith('.lock'):
                #arcpy.AddMessage("Adding %s..." % os.path.join(path, dirpath, file))
                try:
                    if keep:
                        zip.write(os.path.join(dirpath, file),
                        os.path.join(os.path.basename(path), os.path.join(dirpath, file)[len(path)+len(os.sep):]))
                    else:
                        zip.write(os.path.join(dirpath, file),
                        os.path.join(dirpath[len(path):], file))

                except Exception as e:
                    #Message "    Error adding %s: %s"
                    arcpy.AddWarning(get_ID_message(86134) % (file, e[0]))
    return None

def createFolderInScratch(folderName):
    # create the folders necessary for the job
    folderPath = arcpy.CreateUniqueName(folderName, arcpy.env.scratchWorkspace)
    #folderPath = "d:/arcgisserver/recover/scratch"
    arcpy.CreateFolder_management(arcpy.env.scratchWorkspace, os.path.basename(folderPath))
    return folderPath

def getTempLocationPath(folderPath, format):
    # make sure there is a location to write to for gdb and mdb
    if format == "mdb":
        MDBPath = os.path.join(folderPath, "data.mdb")
        if not arcpy.Exists(MDBPath):
            arcpy.CreatePersonalGDB_management(folderPath, "data")
        return MDBPath
    elif format == "gdb":
        GDBPath = os.path.join(folderPath, "data.gdb")
        if not arcpy.Exists(GDBPath):
            arcpy.CreateFileGDB_management(folderPath, "data")
        return GDBPath
    else:
        return folderPath

def makeOutputPath(raster, inLayerName, convert, formatList, zipFolderPath, scratchFolderPath):
    tmpName = inLayerName
    outFormat = formatList[1].lower()

    # if we are going to convert to an esri format on the clip, put the output in the zipfolder
    # else put it in the scratch folder in a gdb
    if convert:
        outwkspc = getTempLocationPath(zipFolderPath, outFormat)
    else:
        outwkspc = getTempLocationPath(scratchFolderPath, "gdb")

    if tmpName.find("\\"):
        tmpName = tmpName.split("\\")[-1]

    # make sure there are no spaces in the out raster name and make sure its less than 13 chars
    if outFormat == "grid":
        if len(tmpName) > 12:
            tmpName = tmpName[:12]
        if tmpName.find(" ") > -1:
            tmpName = tmpName.replace(" ", "_")

    # make the output path
    tmpName = arcpy.CreateUniqueName(
        arcpy.ValidateTableName(tmpName, outwkspc), outwkspc)

    if os.path.basename(tmpName) != inLayerName:
        arcpy.AddMessage(u"{0} {1}{2}".format(inLayerName,
                                           arcpy.GetIDMessage(86128),
                                           os.path.basename(tmpName)))

    # Raster formats and shp always need to put the extension at the end
    if raster or outFormat == "shp":
        if outFormat != "gdb" and outFormat != "mdb" and outFormat != "grid":
            tmpName = tmpName + formatList[2].lower()

    outputpath = os.path.join(outwkspc, tmpName)

    return tmpName, outputpath

def clipRaster(lyr, aoi, rasterFormat, zipFolderPath, scratchFolderPath):
    # get the path and a validated name for the output
    layerName, outputpath = makeOutputPath(True, lyr, True, rasterFormat, zipFolderPath, scratchFolderPath)
    # do the clip
    try:
        if int(arcpy.GetCount_management(aoi).getOutput(0)):
            arcpy.Clip_management(lyr, '#', outputpath, aoi, '#', 'ClippingGeometry')
        else:
            arcpy.CopyRaster_management(lyr, outputpath)
        #Message "  clipped %s..."
        arcpy.AddIDMessage("INFORMATIVE", 86135, lyr)
    except:
        errmsg = arcpy.GetMessages(2)
        #Message "  failed to clip layer %s..."
        arcpy.AddWarning(get_ID_message(86136) % lyr)
        if errmsg.lower().find("error 000446") > -1:
        #Message"  Output file format with specified pixel type or number of bands or colormap is not supported.\n  Refer to the 'Technical specifications for raster dataset formats' help section in Desktop Help.\n  http://webhelp.esri.com/arcgisdesktop/9.3/index.cfm?TopicName=Technical_specifications_for_raster_dataset_formats"
        #Shorted as "Output file format with specified pixel type or number of bands or colormap is not supported"
            arcpy.AddWarning(get_ID_message(86137))

        elif errmsg.lower().find("error 000445"):
            #Message "  Extension is invalid for the output raster format.  Please verify that the format you have specified is valid."
            arcpy.AddWarning(get_ID_message(86138))
        else:
            arcpy.AddWarning(arcpy.GetMessages(2))
        pass

def clipFeatures(lyr, aoi, featureFormat, zipFolderPath, scratchFolderPath, convertFeaturesDuringClip):
    global haveDataInterop
    try:
        # get the path and a validated name for the output
        layerName, outputpath = makeOutputPath(False, lyr, convertFeaturesDuringClip, featureFormat, zipFolderPath, scratchFolderPath)

        # do the clip
        arcpy.Clip_analysis(lyr, aoi, outputpath)
        #Message "  clipped %s..."
        arcpy.AddIDMessage("INFORMATIVE", 86135, lyr)

        # if format needs data interop, convert with data interop
        if not convertFeaturesDuringClip:
            # get path to zip
            outputinzip = os.path.join(
                zipFolderPath,
                os.path.basename(layerName) + featureFormat[2])

            if featureFormat[2].lower() in [".dxf", ".dwg", ".dgn"]:
                #Message "..using export to cad.."
                arcpy.AddWarning(get_ID_message(86139))
                arcpy.ExportCAD_conversion(outputpath, featureFormat[1], outputinzip)
            else:
                if not haveDataInterop:
                    raise LicenseError

                if (featureFormat[1].upper() == 'CSV'):
                    outputinzip += ',"RUNTIME_MACROS,""APPEND,No,FIELD_NAMES,yes,SEPARATOR,"""","""",EXTENSION,csv""' \
                                   ',META_MACROS,""DestAPPEND,No,DestFIELD_NAMES,yes,DestSEPARATOR,"""","""",DestEXTENSION,csv""' \
                                   ',METAFILE,CSV,COORDSYS,,__FME_DATASET_IS_SOURCE__,false"'

                diFormatString = "%s,%s" % (featureFormat[1], outputinzip)
                # run quick export
                arcpy.quickexport_interop(outputpath, diFormatString)

    except LicenseError:
        #Message "  failed to export to %s.  The requested formats require the Data Interoperability extension.  This extension is currently unavailable."
        arcpy.AddWarning(get_ID_message(86140) % featureFormat[1])
        pass

    except:
        errorstring = arcpy.GetMessages(2)
        if errorstring.lower().find("failed to execute (quickexport)") > -1:
            #Message "  failed to export layer %s with Quick Export.  Please verify that the format you have specified is valid."
            arcpy.AddWarning(get_ID_message(86141) % lyr)

        elif errorstring.lower().find("failed to execute (clip)") > -1:
            #Message "  failed to clip layer %s...
            arcpy.AddWarning(get_ID_message(86142) % lyr)
        else:
            arcpy.AddWarning(get_ID_message(86142) % lyr)
            arcpy.AddWarning(arcpy.GetMessages(2))
        pass

def clipAndConvert(lyrs, aoi, featureFormat, rasterFormat, coordinateSystem):
    try:
        # for certain output formats we don't need to use Data Interop to do the conversion
        convertFeaturesDuringClip = False
        if featureFormat[1].lower() in ["gdb", "mdb", "shp"]:
            convertFeaturesDuringClip = True

        # get a scratch folder for temp data and a zip folder to hold
        # the final data we want to zip and send
        zipFolderPath = createFolderInScratch("zipfolder")
        scratchFolderPath = createFolderInScratch("scratchfolder")

        # temporary stop gap measure to counteract issue
        lyrs = [lyr.replace("'", "") if lyr.find(" ") > -1 else lyr for lyr in lyrs]

        if featureFormat[2].lower() in [".dxf", ".dwg", ".dgn"]:
            clipped_data = []
            for lyr in lyrs:
                out_data = arcpy.CreateUniqueName(
                    '{}.shp'.format(os.path.basename(lyr)),
                    scratchFolderPath)
                clipped_data.append(arcpy.clip_analysis(lyr, aoi, out_data).getOutput(0))

            #Message "..using export to cad.."
            arcpy.AddWarning(get_ID_message(86139))
            outputinzip = os.path.join(zipFolderPath, 'cad{}'.format(featureFormat[2]))
            arcpy.ExportCAD_conversion(clipped_data, featureFormat[1], outputinzip)
        else:
            # loop through the list of layers recieved
            for lyr in lyrs:
                describe = arcpy.Describe(lyr)
                dataType = describe.DataType.lower()

                # make sure we are dealing with features or raster and not some other layer type (group, tin, etc)
                if dataType in ["featurelayer", "rasterlayer"]:
                    # if the coordinate system is the same as the input
                    # set the environment to the coord sys of the layer being clipped
                    # may not be necessary, but is a failsafe.
                    if coordinateSystem.lower() == "same as input":
                        sr = describe.spatialreference
                        if sr != None:
                            arcpy.outputcoordinatesystem = sr

                    # raster branch
                    if dataType == "rasterlayer":
                        clipRaster(lyr, aoi, rasterFormat, zipFolderPath, scratchFolderPath)

                    # feature branch
                    else:
                        clipFeatures(lyr, aoi, featureFormat, zipFolderPath, scratchFolderPath, convertFeaturesDuringClip)
                else:
                    #Message "  Cannot clip layer: %s.  This tool does not clip layers of type: %s..."
                    arcpy.AddWarning(get_ID_message(86143) % (lyr, dataType))

        return zipFolderPath

    except:
        errstring = get_ID_message(86144)#"Failure in clipAndConvert..\n"
        tb = sys.exc_info()[2]
        tbinfo = traceback.format_tb(tb)[0]
        pymsg = "ERRORS:\nTraceback Info:\n" + tbinfo + "\nError Info:\n    " + \
                unicode(sys.exc_type)+ ": " + unicode(sys.exc_value) + "\n"
        errstring += pymsg
        raise Exception, errstring

def get_ID_message(ID):
    return re.sub("%1|%2", "%s", arcpy.GetIDMessage(ID))

def findAndReplace(file):
    arcpy.AddMessage("Updating " + file)
    input_file = open(file)
    contents = input_file.read()
    input_file.close()
    contents = contents.replace("[NAME]", fireId)
    output_file = open(file,"w")
    output_file.write(contents)
    output_file.close()
    del input_file, contents, output_file
    print("..." + file + " updated.")
	
def updateInitialExtent(file):
    arcpy.AddMessage("..." + " updating INITIAL EXTENT in " + file + ".")
    input_file = open(file)
    xmlcontents = input_file.read()
    input_file.close()
    xmlcontents = xmlcontents.replace("[ADD INITIAL EXTENT]", rExtent)
    output_file = open(file,"w")
    output_file.write(xmlcontents)
    output_file.close()
    del input_file, xmlcontents, output_file
    arcpy.AddMessage("..." + file + " updated.")
	
def gentoken(server, port, adminUser, adminPass, expiration=60):
    #Re-usable function to get a token required for Admin changes
    
    query_dict = {'username':   adminUser,
                  'password':   adminPass,
                  'expiration': str(expiration),
                  'client':     'requestip'}
    
    query_string = urllib.urlencode(query_dict)
    url = "http://{}:{}/arcgis/admin/generateToken".format(server, port)
    
    token = json.loads(urllib.urlopen(url + "?f=json", query_string).read())
        
    if "token" not in token:
        print token['messages']
        exit()
    else:
        # Return the token to the function which called for it
        return token['token']
		
def stopStartServices(server, port, adminUser, adminPass, stopStart, serviceName, token=None): 
    # Get and set the token
    if token is None:       
        token = gentoken(server, port, adminUser, adminPass)
    
    # modify the services    
    op_service_url = "http://{}:{}/arcgis/admin/services/{}/{}?token={}&f=json".format(server, port, serviceName, stopStart, token)
    status = urllib2.urlopen(op_service_url, ' ').read()
    
    if 'success' in status:
        print (str(serviceName) + " === " + str(stopStart))
    else:            
        print status
    
    return 

### Main Body of Code

arcpy.env.overwriteOutput = True

if __name__ == '__main__':
    try:
        # Use search cursor to calculate the area (acres) of areaOfInterest.
        # If AOI area > limit, process will fail.

        limit = 3000000
        AOIAcres = arcpy.CalculateField_management(areaOfInterest, "ACRES", "!shape.area@acres!", "PYTHON")
        SC = arcpy.SearchCursor(areaOfInterest)
        AcresTot = 0
        for row in SC:
            AcresTot += row.getValue("ACRES")
        arcpy.AddMessage("Extent defined is " + str(AcresTot) + " acres.")

        if AcresTot > limit:
            sys.exit(0)
	    arcpy.AddError("Extent defined is too large.  Please try again with a smaller AOI (max area = 3 millon acres")

        ### Create Fire Folders (data & web) #################################################################################
       
        if os.path.isdir("D:\\ArcGISServer\\directories\\arcgisoutput\\RECOVER3_" + fireId + "\\basemap_MapServer\\RECOVER3_" + fireId + "_basemap_MapServer"):
            arcpy.AddMessage("Basemap service for this fire exists, the current service and associated data will be overwritten")
            stopStartServices(server, port, adminUser, adminPass, stopStart, serviceName, token=None)

        # If data folder for input fire exists, delete it            
        if os.path.isdir(fireData):
            shutil.rmtree(fireData)

        # if website folder for input fire exists, delete it
        if os.path.isdir(fireWeb):
            shutil.rmtree(fireWeb)
    
        ## If the name is not in use, creates a new data folder
        ## transfers data template files into newly created fire folder
       
        os.makedirs(fireData)
        arcpy.AddMessage("Creating new data folder...")
        arcpy.AddMessage("..Folder created, data being transferred...")
        distutils.dir_util.copy_tree(tempDF,fireData)
        arcpy.AddMessage("..Data transferred.")
	
                    
        ### Create New Fire FlexApp Folder
        # Use If/If no to determine if a folder already exists with the same fire name
        # if so, then returns a statement indicating the fire name is already in use
        # then prints a list of current fire data folders
        # and prompts the end user to rerun the script prior to exiting said script        


        # If the name is not in use, creates a new data folder
        # transfers data template files into newly created fire folder    
        # if not os.path.isdir(fireWeb) :

	os.makedirs(fireWeb)
	arcpy.AddMessage("Creating new FlexApp Fire Folder")
	arcpy.AddMessage("..Folder created, data being transferred...")
	distutils.dir_util.copy_tree(tempAF,fireWeb)
	arcpy.AddMessage("..Data transferred.")
	shutil.rmtree(dataPath)
	#########################################################################################################################

	# Validating files in zipfile, making sure that only shapefiles are accepted.  If any file is included that is not part of a standard
        # shapefile, or if the shapefile is missing its projection file, the process will terminate.
    
        if arcpy.Exists(fireBndry):
            z = zipfile.ZipFile(fireBndry)
            zList = z.namelist()
            zString = " ".join(zList)
            arcpy.AddMessage("...validating user submitted fire boundary")
            
            for files in zList:
                try:
                    # files with these extentions are uploadable
                    allowed = ('.shp', '.cpg', '.sbn', '.sbx', '.shx', '.dbf', '.prj', '.xml')

                    #check extensions of files in zip folder, if acceptable, pass.  Otherwise, move to except block.
                    if files.lower().endswith(allowed)and zString.find(".prj") != -1:
                        pass
                    else:
                        raise Exception
                except:
                    # if .prj file is present, than there are files in zip that are not allowed.
                    if zString.find(".prj") != -1:
                        arcpy.AddError("zipfile contains files that are not allowed, please remove unacceptable files and try again" )
                        arcpy.AddError("files must end with " + str(allowed))
                        sys.exit(0)
                    else:
                        # shapefile is missing .prj
                        arcpy.AddError("Shapefile being uploaded is missing projection (.prj) file, please add projection and try again")
                        sys.exit(0)
                        
            arcpy.AddMessage("Zipfile ok")
            # Extract fire boundary zipfile
            z.extractall(fireData)
            arcpy.AddMessage("...fire boundary extracted to " + fireData)
            
        # Fire Boundary was not provided so FireBndry layer will be removed from map document
        else:
            mxd = arcpy.mapping.MapDocument(wrkspc + "_emptyBasemap.mxd")
            df = arcpy.mapping.ListDataFrames(mxd, "Layers")[0]
            for lyr in df:
                if lyr.name == "Fire Boundary":
                    arcpy.mapping.RemoveLayer(df, lyr)
                    arcpy.AddMessage(lyr.name + " has been removed.")
                    mxd.save()
                    
        if arcpy.CheckExtension("DataInteroperability") == "Available":
            arcpy.CheckOutExtension("DataInteroperability")
            haveDataInterop = True
        else:
            haveDataInterop = False
            
        # Do a little internal validation.
        # Expecting "long name - short name - extension
        # If no format is specified, send features to GDB.
        if inputFeatureFormat == "":
            featureFormat = ["File Geodatabase", "GDB", ".gdb"]
        else:
            featureFormat = inputFeatureFormat.split(" - ")
            #featureFormat = map(lambda x: x.strip(), inputFeatureFormat.split("-"))
            if len(featureFormat) < 3:
                featureFormat.append("")

        # If no format is specified, send rasters to GRID.
        # Expecting "long name - short name - extension
        if inputRasterFormat == "":
            rasterFormat = ["ESRI GRID", "GRID", ""]
        else:
            rasterFormat = inputRasterFormat.split(" - ")
            #rasterFormat = map(lambda x: x.strip(), inputRasterFormat.split("-"))
            if len(rasterFormat) < 3:
                rasterFormat.append("")

        coordinateSystem = setUpCoordSystemEnvironment(coordinateSystem, customCoordSystemFolder)

        # Do this so the tool works even when the scratch isn't set or if it is set to gdb/mdb/sde
        if arcpy.env.scratchWorkspace is None or os.path.exists(unicode(arcpy.env.scratchWorkspace)) is False:
            arcpy.env.scratchWorkspace = arcpy.GetSystemEnvironment("TEMP")
        else:
            swd = arcpy.Describe(arcpy.env.scratchWorkspace)
            wsid = swd.workspacefactoryprogid
            if wsid == 'esriDataSourcesGDB.FileGDBWorkspaceFactory.1' or\
               wsid == 'esriDataSourcesGDB.AccessWorkspaceFactory.1' or\
               wsid == 'esriDataSourcesGDB.SdeWorkspaceFactory.1':
                arcpy.env.scratchWorkspace = arcpy.GetSystemEnvironment("TEMP")

        # clip and convert the layers and get the path to the folder we want to zip
        zipFolder = clipAndConvert(layers, areaOfInterest, featureFormat, rasterFormat, coordinateSystem)    
        shutil.copytree(zipFolder, dataPath)
        
        # Find/Replace [NAME] w/ New Fire Name in relevant .rlf, .xml, .htm, and .html files
        for inFile in inFiles:
            findAndReplace(inFile)

        
        
        # Validate the uploaded shapefile name == fireName
        # if shapefile name is not the same as fireName,
        # the shapefile name will be changed to fireName
        
        
        arcpy.env.workspace = fireData
        bndries = arcpy.ListFeatureClasses("*.shp")

        # The script creates a list of .shp files, but there should never be multiple .shp files in the specified directory
        # .shp files should not persist in this directory after the script has executed
        for bndry in bndries:
            # if the boundary shapefile name != the name of the fire, change the shapefile name to == fireName
            if  arcpy.Describe(bndry).baseName != fireName:
                arcpy.Rename_management(bndry, fireName)
                arcpy.AddMessage("fireBndry name changed to " + fireName + ".shp")

            # Validating uploaded shapefile spatial reference.  Will reproject if not projected in
            # USA_Contiguous_Albers_Equal_Area_Conic_USGS_version  
            if arcpy.Describe(fireData + fireName + '.shp').spatialReference.Name == "USA_Contiguous_Albers_Equal_Area_Conic_USGS_version":
                arcpy.AddMessage("..fire boundary projected in " + arcpy.Describe(fireData + fireName + '.shp').spatialReference.Name)
                #Copy fire boundary to site specific fGDB
                arcpy.CopyFeatures_management(fireData + fireName + '.shp', featBndry)
                arcpy.Delete_management(fireData + fireName + '.shp')
            else:
                arcpy.AddMessage("...reprojecting fire boundary to USA_Contiguous_Albers_Equal_Area_Conic_USGS_version")
                arcpy.Project_management(fireData + fireName + '.shp', featBndry, "D:\\ArcGISServer\\RECOVER3\\SpatialReference\\USA_Contiguous_Albers_Equal_Area_Conic_USGS.prj")
                arcpy.Delete_management(fireData + fireName + '.shp')

        # If boundary for fire exists, boundary will be transfered to fire
        # specific fGDB and fire reports created by intersecting boundary
        # and SMA_Soils layer. Otherwise, the fireBndry layer is remove
        # from the basemap mxd.
            
        if arcpy.Exists(featBndry):
            #Creating Detailed and Summary Fire Reports
            arcpy.Intersect_analysis(inFeatures, smaOutput)
            arcpy.CalculateField_management(smaOutput,"Acres",expression,"PYTHON")      
            arcpy.Statistics_analysis(smaOutput,smaStats,statsFields,caseField)
            arcpy.DeleteField_management(smaStats,"FREQUENCY")

        # Updating Landfire and Topography layer names
        mxd = arcpy.mapping.MapDocument(wrkspc + "_emptyBasemap.mxd")
        df = arcpy.mapping.ListDataFrames(mxd, "Layers")[0]
        for lyr in arcpy.mapping.ListLayers(mxd):
            if lyr.isBroken == True:
                arcpy.mapping.RemoveLayer(df, lyr)
                arcpy.AddMessage(lyr.name + " has been removed.")
            if lyr.datasetName in LandFireArray:
                shutil.copyfile(symDir + lyr.datasetName + ".clr", dataPath + lyr.datasetName + ".clr")
            if lyr.name != "Fire Boundary":
                lyr.visible = False
            del lyr
        arcpy.RefreshTOC()
                
        # Copy Newly Updated MXD to New MXD for Publishing Services
        mxd.saveACopy(wrkspc+"_basemapServices.mxd")
        arcpy.AddMessage("BasemapServices map updated.")
        #Removing _emptyBasemap.mxd
        del mxd
        os.remove(wrkspc + "_emptyBasemap.mxd")
        
        ### Publishing Basemap MapService
        
        arcpy.AddMessage("Prepping for basemap service...")

    
        # Create Map Service
        arcpy.AddMessage(".....Creating Basemap Service")
        mxd = arcpy.mapping.MapDocument(wrkspc + "_basemapServices.mxd")
        arcpy.mapping.CreateMapSDDraft(mxd,sddraft,service,"ARCGIS_SERVER",con,False,fireFolder)
        analysis = arcpy.mapping.AnalyzeForSD(sddraft)
        del mxd

        # change service parameters
        doc = DOM.parse(sddraft)
        keys = doc.getElementsByTagName('Key')
        for key in keys:
##            if key.firstChild.data == 'UsageTimeout': key.nextSibling.firstChild.data = 6000
##            if key.firstChild.data == 'WaitTimeout': key.nextSibling.firstChild.data = 60
##            if key.firstChild.data == 'IdleTimeout': key.nextSibling.firstChild.data = 20000
##            if key.firstChild.data == 'MinInstances': key.nextSibling.firstChild.data = 1
            if key.firstChild.data == 'MaxInstances': key.nextSibling.firstChild.data = 8
##        services___ = doc.getElementsByTagName('TypeName')
##        for service__ in services___:
##            if service__.firstChild.data == 'KmlServer':
##                service__.parentNode.getElementsByTagName('Enabled')[0].firstChild.data = 'false'
##            if service__.firstChild.data == 'WMSServer':
##                service__.parentNode.getElementsByTagName('Enabled')[0].firstChild.data = 'true'

        # save changes
        if os.path.exists(sddraft): os.remove(sddraft)
        f = open(sddraft,"w")
        doc.writexml(f)
        f.close()
        
        # Stage and upload the service if the sddraft analysis did not contain errors
        if analysis['errors'] == {}:
            # Execute StageService
            arcpy.StageService_server(sddraft, sd)
            # Execute UploadServiceDefinition
            arcpy.UploadServiceDefinition_server(sd, con)
            arcpy.AddMessage(".....Map Service Created")
        else: 
            # If the sddraft analysis contained errors, display them
            arcpy.AddMessage(analysis['errors'])
            arcpy.AddMessage("Service could not be published because errors were found during analysis.")
       
        
    ###############

    ###### Updating Initial Extent Properties w/n xml Docs

    ### EStablishing Variables for Updating Initial Extent
        arcpy.env.workspace = dataPath
        RstLst = arcpy.ListRasters()
        rasterIn = RstLst[0]
        rasterOut = dataPath+"Albers.tif"

    ### Get Raster Extent
        arcpy.AddMessage("Capturing raster file extent...")
        arcpy.ProjectRaster_management(rasterIn,rasterOut,prj)
        rFile = Raster(rasterOut)
        rExtent = str(rFile.extent)[:-16]
        arcpy.AddMessage("Initial Extent:")
        arcpy.AddMessage(rExtent)
        arcpy.AddMessage("Updating map extent in xml files...")
        arcpy.Delete_management(rasterOut)

        del RstLst, rasterIn, rasterOut
    ### Update Initial Extent in the config.xml
		
	updateInitialExtent(configXML)


    ### Update Initial Extent in the BookmarkWidget.xml
    
	updateInitialExtent(bookmarkXML)

        #Adding data source to website folder for download
        zipUpFolder(dataPath, dataSrc)

        #Sending User email notification
        SendRECOVERMail.SendMail(userEmail, URL)

        # Sending User additional data request email if requests are made
        if dNBR or DFM or vegMonitor == True:
            SendRECOVERMail.UserRequest(dNBR, DFM, vegMonitor, contained, userEmail, fireId, URL)

    ### Establish Time of Completion        
        t2=time.time()
        
    ### Calculate Total Process Time
        processTime = ((t2-t1)/60)
        
        arcpy.AddMessage("**********************************")
        arcpy.AddMessage("")
        arcpy.AddMessage("Task completed in {0} minutes".format(processTime))
        
    except:
        tb = sys.exc_info()[2]
        tbinfo = traceback.format_tb(tb)[0]
        pymsg = "ERRORS:\nTraceback Info:\n" + tbinfo + "\nError Info:\n    " + \
                unicode(sys.exc_type)+ ": " + unicode(sys.exc_value) + "\n"
        arcpy.AddError(pymsg)
