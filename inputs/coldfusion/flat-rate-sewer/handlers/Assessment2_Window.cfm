<cfmail to="testuser@example.com" from="#cgi.server_name# <testuser@example.com>"
  subject="cfalert use_assessment #cgi.script_name# #datetimeformat(now(), "yyyy-mm-dd HH:nn:ss")#" type="html">
  #cgi.http_host##cgi.http_url#<br><br>
  #lcase(cgi.cf_template_path)#<br><br>

  cgi.https=#cgi.https#<br>
  cgi.server_name=#cgi.server_name#<br>
  cgi.http_x_forwarded_for=#cgi.http_x_forwarded_for#<br><br>

  <cfdump var="#url#" label="url"><br>
  <cfdump var="#form#" label="form"><br>
  <cfdump var="#session#" label="session"><br>
  <cfdump var="#cgi#" label="cgi"><br>
  <cfdump var="#server.cf#" label="server.cf"><br>
</cfmail>

<cfparam name="url.progress_only" default="false">

<cfset account_num1 = "#form['ACCOUNT_NUM']#">
    
<cfset objdbfunction = createobject("component", "intranet.apps.custserv.frs.cfcs.frsobjects")>

<cfset getRecord = objdbfunction.getFRSAccount(account_num1)>

<cfset varFRS_PLAN_ASSESSMENT_FREQ = (getRecord.FRS_PLAN_ASSESSMENT_FREQ eq 0) ? "1" : getRecord.FRS_PLAN_ASSESSMENT_FREQ/>

<cfset NEXTASSESSMENT = DATEADD("M", varFRS_PLAN_ASSESSMENT_FREQ,getRecord.FRS_PLAN_NEXT_ASSESSMENT_DATE)>

<!--- Apply assessment and generate paperwork --->

<cfif varFRS_PLAN_ASSESSMENT_FREQ eq 1 or url.progress_only eq "true"> 
  <cfset varEmailMsg = 
    "An Assessment has been completed for Account #form['ACCOUNT_NUM']# #objdbfunction.getFRScontact(getRecord.FRS_ACTIVE_CONTACT_RECID).FRS_CONTACT_BUSINESS# by #objdbfunction.getEmployee(session.emp_id).EMP_FULL_NAME#.<br><br>

    --- Account Assessment Progression Only ---<br><br>

    The next assessment for this customer is due on #dateformat(NEXTASSESSMENT,"mm/dd/yyyy")#">
<cfelse>
  <cfset varEmailMsg = 
    "An Assessment has been completed for Account #form['ACCOUNT_NUM']# #objdbfunction.getFRScontact(getRecord.FRS_ACTIVE_CONTACT_RECID).FRS_CONTACT_BUSINESS# by #objdbfunction.getEmployee(session.emp_id).EMP_FULL_NAME#.<br><br>

    An adjustment in the amount of #dollarformat(form['FRS_ADJUSTMENT'])# is requested and a new Basis of #numberformat(form['FRS_NEW_BASIS'],"999.99")# is advised.<br><br>

    The next assessment for this customer is due on #dateformat(NEXTASSESSMENT,"mm/dd/yyyy")#">
</cfif>

<cfif varFRS_PLAN_ASSESSMENT_FREQ eq 1>
  <cfset email_type = "frequency=1">
<cfelseif url.progress_only eq "true">
  <cfset email_type = "progess_only=#url.progress_only#">
<cfelse>
  <cfset email_type = "adjustment">
</cfif>

<!--- Get highest record num used in assessment --->
<cfquery name="prepAssessment" datasource="intradb">
  select max(rec_id) as startPoint
  from VW_CS_FRS_BILLED_ACTUAL
  where 1=1
  and frs_account_num = '#account_num1#'
  and isnull(FRS_BILLING_ASSESSED_FLAG,0) = 0
  and (FRS_BILLING_USE_BASIS = 1 or FRS_BILLING_USE_MONEY=1)
</cfquery>

<cfquery name="updateAssessments" datasource="intradb">
  <!--- UPDATE THE BILLING RECORS TO REFLECT THEIR USE IN THE ASSESSMENT --->
  
  <!--- UPDATE THE BILLING RECORDS SO THE ARE NOT AVAILABLE FOR FUTURE ASSESSMENTS --->
  update VW_CS_FRS_BILLED_ACTUAL
  SET
  FRS_BILLING_ASSESSED_FLAG = 1,
  FRS_BILLING_ASSESSMENT_DATE = '#DATEFORMAT(now(),"mm/dd/yyyy")#'
  where 1=1
  and frs_account_num = '#account_num1#'
  and isnull(FRS_BILLING_ASSESSED_FLAG,0) = 0
  and rec_id <= '#prepAssessment.startPoint#';
  
  <!--- GET THE CURRENT ACCOUNT PLAN INFO --->
  <!--- IDENTIFY THE NEXT ASSESSMENT DATE --->
  <!--- SET THE NEW BASIS NUMBER AND UPDATE THE ASSESSMENT DATE --->
  
  update CS_FRS_ACCOUNTS
  SET
  <cfif url.progress_only eq "false">
    FRS_PLAN_BASIS = '#numberformat(form['FRS_NEW_BASIS'],"999.99")#',
  </cfif>
  FRS_PLAN_NEXT_ASSESSMENT_DATE = '#dateformat(NEXTASSESSMENT,"mm/dd/yyyy")#'
  where rec_id = '#getRecord.rec_id#';
</cfquery>
  
<!--- LOG THE WORK IN THE AUDITLOG FILE --->
<cfset objdbfunction.putAuditLog('#session.emp_id#','Assessment','#varEmailMsg#  Previous basis was #getRecord.FRS_PLAN_BASIS#','1','#account_num1#')> 

<cfset cfr_status = false>

<cfif url.progress_only neq "true">
  <cfquery name="forAssessment" datasource="intradb">
    SELECT  *
    FROM dbo.VW_CS_FRS_BILLED_ACTUAL 
    WHERE 1=1
    and FRS_ACCOUNT_NUM = '#account_num1#'
    and FRS_BILLING_ASSESSMENT_DATE = '#DATEFORMAT(now(),"mm/dd/yyyy")#'
    and ((FRS_BILLING_USE_MONEY = '1') or (FRS_BILLING_USE_BASIS = '1')) 
    and (FRS_BILLING_ASSESSED_FLAG = '1')
    ORDER BY FRS_ACCOUNT_NUM
  </cfquery>

	<cfset reportfile = ExpandPath("../reports/files/frs#account_num1#[#dateformat(now(),'yyyymmdd')#].pdf")/>
	
  <cftry>
    <cfreport template="../reports/assessment1.cfr" query="forAssessment" filename="#reportfile#" format="pdf" overwrite="yes"/>
    <cfset cfr_status = true>

    <cfcatch>
      <cfset cfr_status = false>
    </cfcatch>
  </cftry>
</cfif>

<cfset FRS_NOTIFY_EMAIL = objdbfunction.getListByKey('FRS_CONTACT_EMAIL').FRS_CTRL_VALUE/>

<cfset emailattr.subject = "Assessment completed for #form['account_num']#">
<cfset emailattr.from = "#cgi.server_name# <testuser@example.com>">
<cfset emailattr.to = frs_notify_email>
<cfset emailattr.cc = session.email>
<cfset emailattr.bcc = "testuser@example.com">
<cfset emailattr.type = "html">

<cfif server.cf.env neq "prod">
  <cfset emailattr.to = "testuser@example.com">
  <cfset emailattr.cc = "">
</cfif>

<cfmail attributeCollection="#emailattr#">
  #varEmailMsg#<br><br>

  <cfif url.progress_only neq "true">
    <cfif cfr_status eq true>
      <cfmailparam file="#reportfile#">
    <cfelse>
      <span style="background-color:pink;">PDF generation failed</span><br><br>
    </cfif>
  </cfif>

  <p>e:frs:assessment:2:<cfoutput>#email_type#</cfoutput></p>
</cfmail>