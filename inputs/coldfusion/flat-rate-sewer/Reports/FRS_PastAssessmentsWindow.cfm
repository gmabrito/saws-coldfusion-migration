
<cfinvoke 
 component="Intranet.apps.CustServ.FRS.CFCs.FRSobjects"
 method="getPriorAssessments"
 returnvariable="getPriorAssessmentsRet">
	<cfinvokeargument name="FRS_ACCOUNT_NUM" value="#url.account_num#"/>
</cfinvoke>
<h4>Past Completed Assessments</h4>
<cfif getPriorAssessmentsRet.recordcount gt 0>
	<cfoutput query="getPriorAssessmentsRet">
    <a href="../frs/reports/files/frs#FRS_ACCOUNT_NUM#[#dateformat(FRS_BILLING_ASSESSMENT_DATE,'yyyymmdd')#].pdf" target="_blank">#FRS_BILLING_ASSESSMENT_DATE# </a>
    
        <cfset reportfile = ExpandPath("./intranet/apps/custserv/frs/reports/files/frs#FRS_ACCOUNT_NUM#[#dateformat(FRS_BILLING_ASSESSMENT_DATE,'yyyymmdd')#].pdf")/>
        
    </cfoutput>
<cfelse>
<p>No assessment documents found</p>
</cfif>
