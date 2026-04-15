<cfset account_num1 = "#form['accountnum']#">
<cfquery name="updateBillingAssessment" datasource="intradb">
	update [VW_CS_FRS_BILLED_ACTUAL]
	set [FRS_BILLING_USE_MONEY] = 0, [FRS_BILLING_USE_BASIS] = 0	
	where [FRS_ACCOUNT_NUM] = '#account_num1#' and isnull(FRS_BILLING_ASSESSED_FLAG,0) = 0
    and [FRS_BILLING_ASSESSMENT_DATE] IS NULL
</cfquery>    
<cfloop list="#form.fieldnames#" index="fname">
	<Cfif left(fname,3) eq "FRS">
    	<!---<cfoutput>#fname# = #form[fname]#</cfoutput>--->

            <cfquery name="updateBillingAssessment" datasource="intradb">
			<CFIF left(fname,6) eq 'FRSMON'>
                update [VW_CS_FRS_BILLED_ACTUAL]
                set [FRS_BILLING_USE_MONEY] = 1
                where [REC_ID] = #form[fname]#;
            <cfelseif left(fname,6) eq 'FRSBAS'>
                update [VW_CS_FRS_BILLED_ACTUAL]
                set [FRS_BILLING_USE_BASIS] = 1
                where [REC_ID] = #form[fname]#;
            </CFIF>
            </cfquery>   
    
    </Cfif>
</cfloop>


