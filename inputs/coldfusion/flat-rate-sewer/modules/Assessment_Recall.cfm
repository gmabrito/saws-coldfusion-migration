
<cfparam name="FRS_ACCOUNT_NUM" type="string" default="000099022-0099023-0001">
<cfparam name="FRS_BILLING_ASSESSMENT_DATE" type="string" default="">

<cfif isdefined("submit")>

 <cfinvoke 
     component="Intranet.apps.CustServ.FRS.CFCs.FRSobjects"
     method="getPriorAssessments"
     returnvariable="getPriorAssessmentsRet">
        <cfinvokeargument name="FRS_ACCOUNT_NUM" value="#FRS_ACCOUNT_NUM#"/>
    </cfinvoke>


<cfquery name="getLastDate" dbtype="query">
select max(FRS_BILLING_ASSESSMENT_DATE) as recallDate from getPriorAssessmentsRet
</cfquery>
<cfoutput>
#dateformat(getLastDate.recallDate)#
</cfoutput>



 <cfinvoke 
     component="Intranet.apps.CustServ.FRS.CFCs.FRSobjects"
     method="rollbackPriorAssessments"
     returnvariable="rollbackPriorAssessmentsRet">
        <cfinvokeargument name="FRS_ACCOUNT_NUM" value="#FRS_ACCOUNT_NUM#"/>
        <cfinvokeargument name="FRS_BILLING_ASSESSMENT_DATE" value="#dateformat(getLastDate.recallDate,'mm/dd/yyyy')#"/>
    </cfinvoke>

<cfelse>

<cfform name="recall">
Account Number to Recall:
<cfinput type="text" name="FRS_ACCOUNT_NUM" value="">
<cfinput type="submit" name="submit" value="submit">

</cfform>
        
</cfif>        