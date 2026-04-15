<!--- ----------------------------------------------------------------------------------- --->
<!--- FRS_DailyBilling                                                                    --->
<!--- This application runs daily to gather new billing records for customer who are in   --->
<!--- the flat rate sewer program.  Once collected, the billing records are loaded to the --->
<!--- FRS Billing table for future use at review time.                                    --->
<!--- ----------------------------------------------------------------------------------- --->

<cfset THIS.DSN = "devserver">

<cfsavecontent variable="getPage">
    <cfquery name="getLastBillingRecord" datasource="intradb">
        SELECT isnull(MAX(cast(FRS_BILLING_REC_ID as int)),0) as lastAssessed
        FROM CS_FRS_BILLING_ASSESSMENTS
    </cfquery>

    <cfoutput>
        <p>Processing records from #getLastBillingRecord.lastAssessed#</p>

        <cfquery name="getFRSAccountBills" datasource="intradb">
            SELECT FRS_ACCOUNT_NUM
              ,FRS_METER_SIZE
              ,FRS_METHOD
              ,FRS_PLAN_BASIS
              ,FRS_BUSINESS_TYPE
              ,FRS_PLAN_BILLING_METHOD_TYPE
              ,SERV_FROM_DATE
              ,SERV_TO_DATE
              ,TYPE
              ,SEWER_PERCENT
              ,SEWER_CCF_CONS
              ,SEWER_NET_CHRG
              ,BILLING_DATE
              ,REC_ID
              ,LEFT(RIGHT(NEXT_READ_DATE,4),2) + '/' + RIGHT(NEXT_READ_DATE,2) + '/' + LEFT(NEXT_READ_DATE,4) AS READ_DATE
              ,SERV_NUM_DAYS
            FROM VW_CS_FRS_BILLING
            where rec_id > #getLastBillingRecord.lastAssessed# 
          	<cfif isDefined("url.acctnum")>
                or FRS_ACCOUNT_NUM = '#url.acctnum#'
            </cfif>
        	<!---AND NEXT_READ_DATE != '00000000'--->
            order by rec_id asc
        </cfquery>

        <p>#getFRSAccountBills.recordCount# records found</p>

        <cfset recadded = 0>
    </cfoutput>

    <cfoutput query="getFRSAccountBills">
        <cfif READ_DATE eq "00/00/0000">
            <cfset x_read_date = billing_date>
        <cfelse>
            <cfset x_read_date = read_date>
        </cfif>

        <cfset LASTREADDATE = DATEADD("D",SERV_NUM_DAYS*-1,x_read_date)>
        
        <cfquery name="checkrecexist" datasource="intradb">
            select FRS_BILLING_REC_ID
            from CS_FRS_BILLING_ASSESSMENTS
            where FRS_BILLING_REC_ID = #rec_id#
        </cfquery>
        
        <cfif checkrecexist.recordcount eq 0>
            <cfquery name="putNewBillingAssessments" datasource="intradb" result="r_insert">
                INSERT INTO CS_FRS_BILLING_ASSESSMENTS
                   (FRS_BILLING_REC_ID
                   ,FRS_BILLING_ACCT_NUM
                   ,FRS_BILLING_TYPE
                   ,FRS_BILLING_READING_DATE
                   ,FRS_BILLING_BILLING_DATE)
                VALUES
                   (#rec_id#
                   ,'#FRS_ACCOUNT_NUM#'
                   ,'#FRS_PLAN_BILLING_METHOD_TYPE#'
                   ,'#DATEFORMAT(LASTREADDATE,"mm/dd/yyyy")#'
                   ,'#DATEFORMAT(BILLING_DATE,"mm/dd/yyyy")#');
            </cfquery>
            <cfdump var="#r_insert#" label="r_insert"><br>

            <cfset recadded++>
        </cfif>
    </cfoutput>

    <cfoutput>#recadded#</cfoutput> records were added<br>
</cfsavecontent>

<cfif url.temp_user neq "goberlag" and recadded gt 0>
    <cfmail to="testuser@example.com" from="testuser@example.com"
        subject="cfalert thread #lcase(cgi.script_name)# #DateTimeFormat(now(), "yyyy-mm-dd HH:nn:ss")#" type="html">
        #lcase(cgi.cf_template_path)#<br><br>
        user=#url.temp_user#<br><br>
        #getPage#<br>
        url.accountnum=<cfif isDefined("url.acctnum")>#url.acctnum#</cfif><br><br>

        <cfdump var="#getLastBillingRecord#" label="getLastBillingRecord"><br>
        <cfdump var="#getFRSAccountBills#" label="getFRSAccountBills"><br>
    </cfmail>
</cfif>

<!---
SELECT dbo.CS_FRS_BILLING.FRS_BILLING_REC_ID, dbo.CS_FRS_BILLING.FRS_BILLING_ACTIVE, dbo.CS_FRS_BILLING.FRS_BILLING_ACCOUNT_NUM, 
        dbo.CS_FRS_BILLING.FRS_BILLING_TYPE, dbo.CS_FRS_BILLING.FRS_BILLING_READING_DATE, dbo.CS_FRS_BILLING.FRS_BILLING_INCOMING_CCF, 
        dbo.CS_FRS_BILLING.FRS_BILLING_SAWS_DATE, dbo.CS_FRS_BILLING.FRS_BILLING_BILLED_BASIS, dbo.CS_FRS_BILLING.FRS_BILLING_BILLED_SEWER, 
        dbo.CS_FRS_BILLING.FRS_BILLING_BILLED_CHARGE, dbo.CS_FRS_BILLING.FRS_BILLING_ACTUAL_LOSS, dbo.CS_FRS_BILLING.FRS_BILLING_ACTUAL_BASIS, 
        dbo.CS_FRS_BILLING.FRS_BILLING_ACTUAL_SEWER, dbo.CS_FRS_BILLING.FRS_BILLING_ACTUAL_CHARGE, dbo.CS_FRS_BILLING.FRS_BILLING_DIFFERENCE, 
        dbo.CS_FRS_BILLING.FRS_BILLING_USE_MONEY, dbo.CS_FRS_BILLING.FRS_BILLING_USE_BASIS, dbo.CS_FRS_BILLING.FRS_BILLING_DATE_ENTERED, 
        dbo.CS_FRS_BILLING.FRS_BILLING_ASSESSED_FLAG, dbo.CS_FRS_BILLING.FRS_BILLING_ASSESSMENT_DATE, 
        CUST_SERVICE_DEV.dbo.BILLING.SEWER_NET_CHRG, CAST(CUST_SERVICE_DEV.dbo.BILLING.SEWER_CCF_CONS AS int) AS Expr1, 
        CUST_SERVICE_DEV.dbo.BILLING.TYPE
FROM dbo.CS_FRS_BILLING
LEFT OUTER JOIN CUST_SERVICE_DEV.dbo.BILLING
ON MONTH(dbo.CS_FRS_BILLING.FRS_BILLING_SAWS_DATE) = LEFT(CUST_SERVICE_DEV.dbo.BILLING.BILLING_DATE, 2) AND 
YEAR(dbo.CS_FRS_BILLING.FRS_BILLING_SAWS_DATE) = RIGHT(CUST_SERVICE_DEV.dbo.BILLING.BILLING_DATE, 4) AND 
dbo.CS_FRS_BILLING.FRS_BILLING_ACCOUNT_NUM = CUST_SERVICE_DEV.dbo.BILLING.ACCOUNT_NUM
--->