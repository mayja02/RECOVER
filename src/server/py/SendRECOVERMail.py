#!/usr/bin/python
##################################
# Python script to automate the sending of email
# to clients who initiate a RECOVER_CreateClient Process
# and email to RECOVER support team to notify of additional data requests
#
# Author: Jeff May (mayjeff2@isu.edu
#
##################################
import smtplib

#define function (use this function in other script that call this script.
# userEmail and URL are required inputs for this function
# userEmail = recipient
# URL = http address for RECOVER web map
def SendMail(userEmail, URL):
    
    # Define username and password for email account that will send the msg
    gmail_user = 
    gmail_pwd = 

    #initialize the smtp server
    smtpserver = smtplib.SMTP("smtp.gmail.com",587)
    smtpserver.ehlo()
    smtpserver.starttls()
    smtpserver.ehlo()
    smtpserver.login(gmail_user, gmail_pwd)

    #header content of email
    header = 'To:' + userEmail + '\n' + 'From: ' + gmail_user + '\n' + 'Subject:Your RECOVER web map \n'

    #structure message here
    msg = header + ()

    # send mail via smtp
    smtpserver.sendmail(gmail_user, userEmail, msg)
    smtpserver.close()

#define function (use this function in other script that call this script.
# userEmail and URL are required inputs for this function
# userEmail = recipient
# URL = http address for RECOVER web map
def UserRequest(dNBR, DFM, vegMonitor, contained, userEmail, fireId, URL):
    
    # Define username and password for email account that will send the msg
    gmail_user = 
    gmail_pwd = 
    DFM_notify = 

    #initialize the smtp server
    smtpserver = smtplib.SMTP("smtp.gmail.com",587)
    smtpserver.ehlo()
    smtpserver.starttls()
    smtpserver.ehlo()
    smtpserver.login(gmail_user, gmail_pwd)

    if contained == True:
        containedMsg = fireId + " is fully contained. Processing additional data may begin."
    else:
        containedMsg = fireId + " is not yet contained."

    #header content of email
    header = 'To:' + gmail_user + '\n' + 'From: ' + gmail_user + '\n' + 'Subject: User Data Requests\n'

    #email body
    body = """The user, """ + userEmail + """ has requested the following data be included in the """ + fireId + """ RECOVER Web Application.\n\nApplication URL: """ +URL+ """\n\ndNBR: """ + str(dNBR) + """\nDebris Flow Model: """ + str(DFM) + """\nVegetation Monitoring: """ + str(vegMonitor) + """\n\n""" + containedMsg
    #structure message here
    msg = header + body

    # if DFM = true, send notification and URL info to DFM team

    if DFM == True:
        headerDFM = 'To:' + DFM_notify + '\n' + 'From: ' + gmail_user + '\n' + 'Subject: Debris flow model requested\n'
        bodyDFM = """A Debris Flow Probability model has been requested for """ + fireId + """ by """ + userEmail + """\n\n The application URL is """ + URL +""". From this URL you can download all the GIS data currently associated with this fire.  Please note, a fire severity layer may or may not exist at this time. Please coordinate with Keith Weber (webekeit@isu.edu) if the fire severity layer is currently absent.\n\n""" + containedMsg
        msgDFM = headerDFM + bodyDFM
        # send debris flow model notification
        smtpserver.sendmail(gmail_user, DM_notify, msgDFM)

    # send mail via smtp
    smtpserver.sendmail(gmail_user, gmail_user, msg)
    smtpserver.close()
