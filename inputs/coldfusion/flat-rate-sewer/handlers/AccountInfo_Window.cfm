<cfoutput>#form.FRS_ACCOUNT_NUM#</cfoutput>

<cfmail to="testuser@example.com" from="#cgi.server_name# <testuser@example.com>"
    subject="cfalert account #lcase(cgi.script_name)# #DateTimeFormat(now(), "yyyy-mm-dd HH:nn:ss")#" type="html">
    #lcase(cgi.http_host)##lcase(cgi.http_url)#<br><br>
    #lcase(cgi.cf_template_path)#<br><br>

    session.email=#session.email#<br><br>
    <cfif form.editlock neq "disabled">insert<cfelse>update</cfif> #form.frs_account_num# #form.frs_contact_business#<br><br>

    <cfdump var="#form#" label="form"><br>
    <cfdump var="#url#" label="url"><br>
    <cfdump var="#session#" label="session"><br>
    <cfdump var="#server#" label="server"><br>
    <cfdump var="#cgi#" label="cgi"><br><br>

    e:frs:acct:1
</cfmail>

<cfset plan_end_date = isDefined("form.deactivate") ? dateformat(now(),"yyyy-mm-dd") : "">

<cfset objdbfunction = createobject("component", "intranet.apps.custserv.frs.cfcs.frsobjects")>

<cfset acl = objdbfunction.getFRSACL()>

<cfset varAuditLog = objdbfunction.putAuditLog('#session.emp_id#','#ListLast(cgi.SCRIPT_NAME,"/")#','New account No. #form.FRS_ACCOUNT_NUM# added','1')>

<cfif form.editlock neq "disabled">
    <cfset varAuditLog = objdbfunction.putAuditLog('#session.emp_id#','#ListLast(cgi.SCRIPT_NAME,"/")#','New account No. #form.FRS_ACCOUNT_NUM# added','1')>

    <cfset AssessmentDate = dateformat(dateadd("m", form.FRS_PLAN_ASSESSMENT_FREQ, form.FRS_PLAN_START_DATE), "mm/dd/yyyy")>

    <cfset putFRSContactINfo =
        objdbfunction.updateFRSContact('#form.FRS_ACCOUNT_NUM#', '#form.FRS_CONTACT_BUSINESS#', '#form.FRS_CONTACT_NAME#',
        '#form.FRS_CONTACT_ADDRESS#', '#form.FRS_CONTACT_CITY#', '#form.FRS_CONTACT_STATE#', '#form.FRS_CONTACT_ZIP#',
        '#form.FRS_CONTACT_PHONE#', '#form.FRS_CONTACT_EMAIL#')>
        
    <cfset putFRSaccountInfo =
        objdbfunction.putFRSAccount(
        '#form.FRS_ACCOUNT_NUM#'
       ,'#putFRSContactINfo.rec_id#'
       ,'#form.FRS_ACCOUNT_FACILITY_DESC#'
       ,'#form.FRS_BUSINESS_TYPE#'
       ,'#form.FRS_METER_SIZE#'
       ,'#form.FRS_METHOD#'
       ,'#form.FRS_PLAN_BASIS#'
       ,'#form.FRS_PLAN_BOD#'
       ,'#form.FRS_PLAN_TDD#'
       ,'#form.FRS_PLAN_START_DATE#'
       ,'#plan_end_date#'
       ,'#form.FRS_PLAN_ASSESSMENT_FREQ#'
       ,'#form.FRS_PLAN_INSPECTION_FREQ#'
       ,'#form.FRS_PLAN_BILLING_METHOD_TYPE#'
       ,'#form.FRS_PLAN_CREATEDBY#'
       ,'#AssessmentDate#'
       ,''
       ,'#form.editlock#')>
                           
    <!--- This adds records to the CS_FRS_BILLING table to allow for meter readings to be created. --->
    <cfset ApplyBillingRecords = objdbfunction.RefreshAccountBilling(form.FRS_ACCOUNT_NUM)>
<cfelse>
    <cfset varAuditLog = objdbfunction.putAuditLog('#session.emp_id#', '#ListLast(cgi.SCRIPT_NAME,"/")#', '#form.FRS_ACCOUNT_NUM# Account Info Updated','1')>

    <cfset AssessmentDate = dateformat(dateadd("m",form.FRS_PLAN_ASSESSMENT_FREQ,form.FRS_PLAN_START_DATE),"mm/dd/yyyy")>

    <cfset putFRSContactINfo =
        objdbfunction.updateFRSContact('#form.FRS_ACCOUNT_NUM#', '#form.FRS_CONTACT_BUSINESS#', '#form.FRS_CONTACT_NAME#',
        '#form.FRS_CONTACT_ADDRESS#', '#form.FRS_CONTACT_CITY#', '#form.FRS_CONTACT_STATE#', '#form.FRS_CONTACT_ZIP#',
        '#form.FRS_CONTACT_PHONE#', '#form.FRS_CONTACT_EMAIL#')>
        
    <cfset putFRSaccountInfo =
        objdbfunction.putFRSAccount(
        '#form.FRS_ACCOUNT_NUM#'
       ,'#putFRSContactINfo.rec_id#'
       ,'#form.FRS_ACCOUNT_FACILITY_DESC#'
       ,'#form.FRS_BUSINESS_TYPE#'
       ,'#form.FRS_METER_SIZE#'
       ,'#form.FRS_METHOD#'
       ,'#form.FRS_PLAN_BASIS#'
       ,'#form.FRS_PLAN_BOD#'
       ,'#form.FRS_PLAN_TDD#'
       ,'#form.FRS_PLAN_START_DATE#'
       ,'#plan_end_date#'
       ,'#form.FRS_PLAN_ASSESSMENT_FREQ#'
       ,'#form.FRS_PLAN_INSPECTION_FREQ#'
       ,'#form.FRS_PLAN_BILLING_METHOD_TYPE#'
       ,''
       ,'#form.FRS_PLAN_NEXT_ASSESSMENT_DATE#'
       ,'#form.FRS_PLAN_NEXT_INSPECTION_DATE#'
       ,'#form.editlock#')>
</cfif>