<h1>Recall</h1>

<h2>You must specify the account number you wish to undue the last assessment completed</h2>

<cfparam name="form.FRS_ACCOUNT_NUM" type="string" default="000099023-0099024-0001">
<cfparam name="FRS_BILLING_ASSESSMENT_DATE" type="string" default="">

<cfif isdefined("form.submit")>
   <cfinvoke component="intranet.apps.custserv.frs.cfcs.frsobjects" method="getPriorAssessments" returnvariable="getPriorAssessmentsRet">
      <cfinvokeargument name="FRS_ACCOUNT_NUM" value="#form.FRS_ACCOUNT_NUM#">
   </cfinvoke>

   <cfquery name="getLastDate" dbtype="query">
      select max(FRS_BILLING_ASSESSMENT_DATE) as recallDate
      from getPriorAssessmentsRet
   </cfquery>

   <cfoutput>#dateformat(getLastDate.recallDate)#</cfoutput>

   <cfinvoke component="intranet.apps.custserv.frs.cfcs.frsobjects" method="rollbackPriorAssessments" returnvariable="rollbackPriorAssessmentsRet">
      <cfinvokeargument name="FRS_ACCOUNT_NUM" value="#form.FRS_ACCOUNT_NUM#">
      <cfinvokeargument name="FRS_BILLING_ASSESSMENT_DATE" value="#dateformat(getLastDate.recallDate,'mm/dd/yyyy')#">
   </cfinvoke>

    <cfinvoke component="intranet.apps.custserv.frs.cfcs.frsobjects" method="putAuditLog" returnvariable="putAuditLogRet">
   	<cfinvokeargument name="empid" value="#session.emp_id#">
   	<cfinvokeargument name="appid" value="Assessment_Recall_window">
   	<cfinvokeargument name="message" value="#form.FRS_ACCOUNT_NUM# assessment for #dateformat(FRS_BILLING_ASSESSMENT_DATE,'mm/dd/yyyy')# has been rolled back">
   	<cfinvokeargument name="level" value="1">
   </cfinvoke>
<cfelse>
   <cfform name="recall">
      Account Number to Recall:
      <cfinput type="text" name="FRS_ACCOUNT_NUM" value="">
      <cfinput type="submit" name="submit" value="submit">
   </cfform>
</cfif>        