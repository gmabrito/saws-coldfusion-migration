<cfif session.user_id eq "goberlag">
    <!--- assessment_subwindow.cfm<br> --->
</cfif>

<cfset sleep(200)>

<cfparam name="url.account_num" default="000099024-0099025-0001">

<cfinvoke component="intranet.apps.custserv.frs.cfcs.frsobjects" method="getfrsbilling" returnvariable="getFRSbillingIn">
    <cfinvokeargument name="FRS_ACCOUNT_NUM" value="#url.account_num#">
</cfinvoke>
    
<cfif getFRSbillingIn.recordcount gt 0>
    <cfquery name="CalcBasisRet" dbtype="query">
    	select
        avg(FRS_BILLING_ACTUAL_BASIS) AS FRS_NEW_BASIS,
        sum(FRS_BILLING_INCOMING_CCF) as sumin,
        sum(FRS_BILLING_BILLED_SEWER) as sumbilled,
        sum(FRS_BILLING_ACTUAL_SEWER) as sumactual
        from getFRSbillingIn
        WHERE 1=1
        and FRS_BILLING_USE_BASIS = 1
        and FRS_BILLING_ASSESSMENT_DATE is null
    </cfquery>

    <cfquery name="CalcDiffRet" dbtype="query">
    	select sum(FRS_BILLING_DIFFERENCE) AS FRS_DIFF
        from getFRSbillingIn
        WHERE 1=1
        and FRS_BILLING_USE_MONEY = 1
        and FRS_BILLING_ASSESSMENT_DATE is null
    </cfquery>
 
    <cfoutput>
		<table>
            <tr><td>Incoming</td><td align="right">#CalcBasisRet.sumin#</td></tr>
            <tr><td>Billed Sewer</td><td align="right">#CalcBasisRet.sumbilled#</td></tr>
            <tr><td>Actual Sewer</td><td align="right">#CalcBasisRet.sumactual#</td></tr>

            <tr><td colspan="2"></td></tr>
			<tr><td>Difference</td><td align="right">#dollarformat(CalcDiffRet.FRS_DIFF)#</td></tr>
			<tr><td>New Basis</td><td align="right">#numberformat(CalcBasisRet.FRS_NEW_BASIS,"999.99")#</td></tr>
        </table><br>
    </cfoutput>              

    <cfform name="usenew#left(url.account_num,9)#">
    	<cfinput type="hidden" name="ACCOUNT_NUM" value="#url.account_num#">
        <cfinput type="hidden" name="FRS_NEW_BASIS" value="#CalcBasisRet.FRS_NEW_BASIS#">
        <cfinput type="hidden" name="FRS_ADJUSTMENT" value="#CalcDiffRet.FRS_DIFF#">

        <cfinput type="button" name="assessment" value="Use Assessment" 
        	onClick="javascript:ApplyAssessmentValues('usenew#left(url.account_num,9)#','Assess#url.recid#');"><br><br>

        <cfinput type="button" name="noassessment" value="Progress Only" 
        	onClick="javascript:ProgressAssessmentValues('usenew#left(url.account_num,9)#','Assess#url.recid#');"><br><br>

        <cfoutput>
            Edit Memo
            <img src="images/memo_edit.jpg" alt="Memos" width="18" height="18"
                onClick="javascript:ColdFusion.Window.create('AssessMemo#url.recid#', 'Assessment Memo',
    			'modules/FRSMemoWindow.cfm?appName=#listlast(cgi.script_name,'/')#&recid=#url.recid#&tag=#url.account_num#&all=true',
    			{refreshOnShow:true,closable:true,center:true, modal:false,width:900,height:350,_cf_refreshOnShow:true});">
        </cfoutput>
    </cfform>
</cfif>	   