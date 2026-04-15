<!---
03/23/2026 GRO Fix 000099003-0099004-0001 SW TX METHODIST HOSPITAL (bill sewer as OCL)
03/25/2026 GRO Fix 000099004-0099005-0004 ROLLING OAKS MALL REALTY HOLDING LLC (Override Incoming Total CCF)
03/27/2026 GRO Fix 000099005-0099006-0002 COCA COLA (include meter sewer)
04/08/2026 GRO Fix 000099006-0099007-0001 THE NUGGET COMPANY INC (incoming_ccf + meter_sewer_ccf)
--->

<cfif session.user_id eq "goberlagx">
    <!--- frs_assessmentwindow.cfm<br> --->
    application.ws_accountmethods=<cfoutput>#application.ws_accountmethods#</cfoutput><br>
</cfif>

<cfset restruct = replace(cgi.query_string, "_cf_", "|", "all")>
<cfset session.currentref = listfirst(restruct,"|")>

<cfset objdbfunction = createobject("component","intranet.apps.custserv.frs.cfcs.frsobjects")>

<!---
<cfinvoke webservice="#application.ws_accountmethods#" method="getAccountValid" returnvariable="getAccountValidRet" refreshwsdl="false">
    <cfinvokeargument name="account_num" value="#url.account_num#">
</cfinvoke>
--->

<cfinvoke component="intranet.apps.webservices.accountmethods" method="getAccountValid" returnVariable="getAccountValidRet">
    <cfinvokeargument name="account_num" value="#url.account_num#">
</cfinvoke>

<cfif getAccountValidRet.recordcount eq 0>
    Account <cfoutput>#url.account_num#</cfoutput> not found<br>
    <cfabort>
</cfif>

<!--- Get the meter size for the account number --->
<cftry>
    <!---
    <cfinvoke webservice="#application.ws_accountmethods#" method="getMeterOutput" returnvariable="getMeterOutputRet" refreshwsdl="false">
        <cfinvokeargument name="ACCTNUM" value="#url.account_num#">
    </cfinvoke>
    --->

    <!--- <cfif session.user_id eq "goberlagx"> --->
        <cfinvoke component="intranet.apps.webservices.accountmethods" method="getMeterOutput" returnVariable="getMeterOutputRet">
          <cfinvokeargument name="acctnum" value="#url.account_num#">
        </cfinvoke>
    <!--- </cfif> --->

    <cfcatch type="any">
        <cfoutput>#cfcatch.Detail#</cfoutput>
    </cfcatch>
</cftry> 

<!--- Meter size dependent on if its available or not, and the type of customer --->
<cfif getAccountValidRet.ACCT_TYPE eq 'RES'>
    <cfset actualMeterSize = (getMeterOutputRet.recordcount gt 0) ? #getMeterOutputRet.METERSZ# : '0.625'>
<cfelse>
    <cfset actualMeterSize = (getMeterOutputRet.recordcount gt 0) ? #getMeterOutputRet.METERSZ# : '2'>
</cfif>

<!---
Grandfathered meter size
000099007-0099008-0004 BEXAR COUNTY PERFORMING ARTS  actual=8" billing=2"   added 12/12/2025
000099008-0099009-0001 NORTHVIEW TOWER, INC. (12FRS) actual=6" billing=.75" added 04/14/2026
--->
<cfif listfind("000099007-0099008-0004", url.account_num)> 
    <cfset billingMeterSize = "2">
<cfelseif listfind("000099008-0099009-0001", url.account_num)> 
    <cfset billingMeterSize = "2">
<cfelse>
    <cfset billingMeterSize = actualMeterSize>
</cfif>

<cfset meterIndex = ListFind(objdbfunction.getListByKey('FRS_METER_SIZES').FRS_CTRL_DISP,'#billingMeterSize#')>

<cfset sleep(100)> <!--- this wait added to allow time for updated records to be propagated --->

<cfparam name="url.account_num" default="000099011-0099012-0001"> <!--- MCNAY ART MUSEUM --->

<cfif session.user_id neq "goberlag">
    <cfthread action="run" priority="high" name="T#url.account_num#" acctnum="#url.account_num#">
        <cfset url.temp_user = session.user_id>
        <cfset url.acctnum = acctnum>
        <cfinclude template="scheduler/FRS_DailyBilling.cfm">
    </cfthread>
</cfif>

<cfif session.user_id neq "goberlagx">
    <cfinvoke component="intranet.apps.custserv.frs.cfcs.frsobjects" method="getFRSbilling" returnvariable="getFRSbillingIn">
        <cfinvokeargument name="FRS_ACCOUNT_NUM" value="#url.account_num#">
    </cfinvoke>

    <cfquery name="q_frs_billing" dbtype="query" maxrows="18">
        select *
        from getFRSbillingIn
        where
        (
        FRS_BILLING_ASSESSED_FLAG = '0' or
        <!--- FRS_BILLING_ASSESSED_FLAG = '' or --->
        FRS_BILLING_ASSESSED_FLAG is null
        )
    </cfquery>
</cfif>

<!---
<cfif session.user_id neq "goberlagx">
    <cfquery name="q_frs_billing" datasource="intradb">
        <!--- SELECT *, cast(irrig_ccf_cons as int) as irrig_ccf_cons --->
        SELECT top 18 *
        FROM VW_CS_FRS_BILLED_ACTUAL
        WHERE 1=1
        and FRS_ACCOUNT_NUM = '#url.account_num#'
        and (FRS_BILLING_ASSESSED_FLAG = '0' or FRS_BILLING_ASSESSED_FLAG is NULL)
        ORDER BY BILLING_DATE DESC
    </cfquery>
</cfif>
--->

<!---
<cfset curyr = "01/01/#DatePart('yyyy',now())#">
<cfset prioryr = "01/01/#datepart('yyyy',dateadd('yyyy',-1,now()))#">
--->

<!---
<cfquery name="getFRSCurYear" dbtype="query">
    select *
    from getFRSbillingIn
    WHERE FRS_BILLING_SAWS_DATE > '#curyr#' 
</cfquery>

<cfquery name="getFRSPriorYear" dbtype="query">
    select *
    from getFRSbillingIn
    where FRS_BILLING_SAWS_DATE between  '#prioryr#' and '#curyr#'
</cfquery>
--->

<cfif session.user_id eq "goberlagx">
    <cfdump var="#getAccountValidRet#" label="getAccountValidRet"><br>
    <!--- <cfdump var="#getFRSbillingIn#" label="getFRSbillingIn"><br> --->
    <cfdump var="#q_frs_billing#" label="q_frs_billing"><br>
    <!--- <cfoutput>account: billing_method_type=#q_frs_billing.frs_plan_billing_method_type# | plan_basis=#q_frs_billing.frs_plan_basis# |<br></cfoutput> --->
    <!--- <cfabort> --->
</cfif>

<cfif q_frs_billing.frs_method eq "cosa">
    frs_method=<cfoutput>#q_frs_billing.frs_method#</cfoutput>
    <cfabort>
</cfif>

<cflayout type="hbox" height="900">
    <cflayoutarea name="box1">
        <div style="padding:1em;">
        <cflayout name="FRSassessment#url.account_num#" type="tab" height="900">
            <cflayoutarea  title="Assessment Records">
        
            <cfform name="assess#left(url.account_num,9)#">
                <table border="1" cellpadding="2" style="border-collapse:collapse;">
                    <tr align="right" style="background-color:lightgrey;">
                        <td colspan="2"></td>
                        <td colspan="4" align="center">Incoming</td>
                        <td colspan="2" align="center">Billed</td>
                        <td colspan="2" align="center">Actual</td>
                        <td colspan="5"></td>
                    </tr>
            
                    <tr align="right" valign="bottom" style="background-color:lightgrey;">
                        <td></td>
                        <td>Billing<br>Date</td>
                        <!--- incoming --->
                        <td>Water<br>GAL</td>
                        <td>Irrig<br>GAL</td>
                        <td>Total<br>GAL</td>
                        <td>Total<br>CCF</td>
                        <!--- billed --->
                        <td>Sewer<br>CCF</td>
                        <td>Sewer<br>Charge</td>
                        <!--- actual --->
                        <td>Sewer<br>CCF</td>
                        <td>Sewer<br>Charge</td>
                        <!--- calculations --->
                        <td>Difference</td>
                        <td align="left">Use<br>Money</td>
                        <td>Basis</td>
                        <td align="left">Use<br>Basis</td>
                        <cfif session.user_id eq "goberlag">
                            <td></td>
                        </cfif>
                    </tr>
           
                    <cfinput name="accountnum" type="hidden" value="#url.account_num#">

                    <cfoutput query="q_frs_billing">
                        <!--- <cfset total_consumption = 0> --->
                        <cfset actual_sewer_ccf = 0>

                        <!--- 06/09/2025 GRO (new) get billing gallons --->
                        <cfquery name="q_billing" datasource="csweb">
                            select
                            rec_id, account_num,
                            cast(billing_date as date) as billing_date,
                            water_serv_gals_cons, water_serv_ccf_cons,
                            irrig_gals_cons, irrig_ccf_cons, irrig_percent,
                            sewer_ccf_cons, sewer_percent, sewer_net_chrg, infor_billing_num
                            from billing b
                            where 1=1
                            and rec_id = '#q_frs_billing.rec_id#'
                            <!---
                            and ACCOUNT_NUM = '#url.account_num#'
                            and cast(b.billing_date as date) = '#q_frs_billing.billing_date#'
                            --->
                        </cfquery>

                        <cfif q_frs_billing.currentrow eq 1 and session.user_id eq "goberlagx">
                            <!--- <cfdump var="#q_billing#" label="q_billing"><br> --->
                        </cfif>

                        <!--- <cfset billed_water_ccf = int(q_billing.water_serv_gals_cons) / 748.1> --->
                        <cfset incoming_total_gal = int(q_billing.water_serv_gals_cons) + int(q_billing.irrig_gals_cons)>
                        <cfset incoming_total_ccf = incoming_total_gal / 748.1>

                        <cfset incoming_total_ccf_original = incoming_total_ccf>

                        <cfset billed_total_ccf = incoming_total_ccf>
                        <!--- gro 03/25/26 --->
                        <cfif q_frs_billing.frs_billing_incoming_ccf_override neq "">
                            <cfset billed_total_ccf = q_frs_billing.frs_billing_incoming_ccf_override>
                        </cfif>

                        <cfquery name="q_meter" datasource="intradb">
                            SELECT *
                            FROM CS_FRS_METER_READINGS
                            WHERE 1=1
                            AND FRS_METER_ACCT_NUM = '#url.account_num#' 
                            AND FRS_METER_READ_DATE BETWEEN 
                            '#dateformat(dateadd("d", -14, SERV_TO_DATE),"mm/dd/yyyy")# 00:00:00' and
                            '#dateformat(dateadd("d", +18, SERV_TO_DATE),"mm/dd/yyyy")# 23:59:59'
                        </cfquery>
        
                        <cfquery name="q_readings" datasource="intradb">
                            SELECT
                            <!--- FRS_METER_READ_DATE, --->
                            isnull(sum(FRS_METER_MAKEUP_CCF),0) - isnull(sum(FRS_METER_BLOWDOWN_CCF),0) + isnull(SUM(FRS_METER_LOSS_CCF),0) as FRS_LOSS,
                            isnull(sum(FRS_METER_BLOWDOWN_CCF),0) - isnull(sum(FRS_METER_MAKEUP_CCF),0) - isnull(SUM(FRS_METER_LOSS_CCF),0) as HandleAsSewer,
                            isnull(SUM(FRS_METER_SEWER_CCF),0) as FRS_METER_SEWER_CCF,
                            isnull(sum(FRS_METER_INCOMING_CCF),0) as FRS_METER_INCOMING_CCF,
                            isnull(sum(FRS_METER_MAKEUP_CCF),0) as FRS_METER_MAKEUP_CCF,
                            isnull(sum(FRS_METER_BLOWDOWN_CCF),0) as FRS_METER_BLOWDOWN_CCF,
                            isnull(sum(FRS_METER_LOSS_CCF),0) as FRS_METER_LOSS_CCF
                            FROM CS_FRS_METER_READINGS
                            WHERE 1=1
                            AND FRS_METER_ACCT_NUM = <cfqueryparam value="#url.account_num#" cfsqltype="varchar">
                            AND FRS_METER_READ_DATE BETWEEN 
                            '#dateformat(dateadd("d", -14, SERV_TO_DATE),"mm/dd/yyyy")# 00:00:00' and
                            '#dateformat(dateadd("d", +18, SERV_TO_DATE),"mm/dd/yyyy")# 23:59:59'
                            <!--- group by FRS_METER_READ_DATE --->
                        </cfquery>

                        <cfquery name="q_readings_dtl" datasource="intradb">
                            SELECT *
                            FROM CS_FRS_METER_READINGS
                            WHERE 1=1
                            AND FRS_METER_ACCT_NUM = <cfqueryparam value="#url.account_num#" cfsqltype="varchar">
                            AND FRS_METER_READ_DATE BETWEEN 
                            '#dateformat(dateadd("d", -14, SERV_TO_DATE),"mm/dd/yyyy")# 00:00:00' and
                            '#dateformat(dateadd("d", +18, SERV_TO_DATE),"mm/dd/yyyy")# 23:59:59'
                            order by frs_meter_serial_num
                        </cfquery>

                        <cfsavecontent variable="content1">
                            <cfloop query="q_readings_dtl">
                                #dateformat(q_readings_dtl.frs_meter_read_date,"mm/dd/yyyy")#
                                #q_readings_dtl.frs_meter_serial_num#
                                <cfif q_readings_dtl.frs_meter_incoming_ccf neq "">Incoming #q_readings_dtl.frs_meter_incoming_ccf#</cfif>
                                <cfif q_readings_dtl.frs_meter_sewer_ccf neq "">Sewer #q_readings_dtl.frs_meter_sewer_ccf#</cfif>
                                <cfif q_readings_dtl.frs_meter_blowdown_ccf neq "">Blowdown #q_readings_dtl.frs_meter_blowdown_ccf#</cfif>
                                <cfif q_readings_dtl.frs_meter_makeup_ccf neq "">Makeup #q_readings_dtl.frs_meter_makeup_ccf#</cfif>
                                <cfif q_readings_dtl.frs_meter_loss_ccf neq "">Loss #q_readings_dtl.frs_meter_loss_ccf#</cfif>
                                #chr(10)#
                            </cfloop>
                        </cfsavecontent>

                        <!---
                        <cfif q_frs_billing.currentrow eq 1 and session.user_id eq "goberlagx">
                            <cfdump var="#q_readings#" label="q_readings"><br>
                        </cfif>
                        --->

                        <cfset rowcolor = int(val(q_readings.FRS_LOSS)) eq 0 and
                            int(val(q_readings.FRS_METER_SEWER_CCF + val(IRRIG_CCF_CONS)) eq 0) ? "red" : "">

                        <!---
                        <cfif q_readings.frs_meter_incoming_ccf neq 0>
                            <cfset total_incoming_ccf = q_readings.frs_meter_incoming_ccf>
                        <cfelse>
                            <cfset total_incoming_ccf = frs_billing_incoming_ccf + val(irrig_ccf_cons)>
                            <!--- <cfset total_incoming_ccf = billed_total_ccf + val(IRRIG_CCF_CONS)> --->
                        </cfif>
                        --->

                        <cfif q_frs_billing.frs_billing_incoming_ccf_override neq "">
                            <cfset total_incoming_ccf = q_frs_billing.frs_billing_incoming_ccf_override>
                        <cfelseif q_readings.frs_meter_incoming_ccf neq 0>
                            <cfset total_incoming_ccf = billed_total_ccf + q_readings.frs_meter_incoming_ccf>
                        <cfelseif q_readings.frs_meter_sewer_ccf neq 0>
                            <cfset total_incoming_ccf = q_readings.frs_meter_sewer_ccf>
                        <cfelse>
                            <cfset total_incoming_ccf = billed_total_ccf>
                        </cfif>

                        <cfset evaporation = q_readings.frs_meter_makeup_ccf - q_readings.frs_meter_blowdown_ccf>
                        <cfset total_loss = evaporation + q_readings.frs_meter_loss_ccf>

                        <!--- <cfset billed_sewer_ccf = ((q_billing.water_serv_gals_cons + q_billing.irrig_gals_cons) / 748.1) * (q_billing.sewer_percent / 100)> --->
                        <cfset billed_sewer_ccf = incoming_total_ccf * (q_billing.sewer_percent / 100)>

                        <!---
                        <cfif q_readings.frs_meter_sewer_ccf gt 0>
                            <cfset actual_sewer_ccf = q_readings.frs_meter_sewer_ccf>
                        <cfelse>
                            <cfset actual_sewer_ccf = total_incoming_ccf - total_loss>
                        </cfif>
                        --->

                        <!--- <cfif getAccountValidRet.acct_type eq "reu"> --->
                        <cfif q_readings.frs_meter_blowdown_ccf - q_readings.frs_meter_makeup_ccf - q_readings.frs_meter_loss_ccf gt 0>
                            <cfset actual_sewer_ccf = q_readings.frs_meter_blowdown_ccf>
                        <cfelse>
                            <cfset actual_sewer_ccf = total_incoming_ccf - total_loss>
                        </cfif>

                        <cfset actual_sewer_ccf = billed_total_ccf
                                + q_readings.frs_meter_incoming_ccf + q_readings.frs_meter_sewer_ccf
                                - q_readings.frs_meter_makeup_ccf + q_readings.frs_meter_blowdown_ccf - q_readings.frs_meter_loss_ccf>

                        <cfif url.account_num eq "000099005-0099006-0002"> <!--- COCA-COLA SOUTHWEST BEVERAGES --->
                            <cfset actual_sewer_ccf = incoming_total_ccf + q_readings.frs_meter_sewer_ccf - q_readings.frs_meter_loss_ccf>
                            <!--- THE ACTUAL SHOULD BE SAWS INCOMING -  LOSS METER NSN2-A + SEWER METER NSN3 --->
                        </cfif>

                        <cfif url.account_num eq "000099013-0099014-0001"> <!--- GREAT NORTHWEST ASSOCIATION --->
                            <cfif q_readings.frs_meter_incoming_ccf eq 0 and q_readings.frs_meter_sewer_ccf eq 0 and
                                  q_readings.frs_meter_makeup_ccf eq 0 and q_readings.frs_meter_blowdown_ccf eq 0 and q_readings.frs_meter_loss_ccf eq 0>
                                <cfset actual_sewer_ccf = 0>
                            </cfif>
                        </cfif>

                        <!---
                        <cfif q_readings.frs_meter_sewer_ccf gt 0>
                            <cfset actual_sewer_ccf = actual_sewer_ccf + q_readings.frs_meter_sewer_ccf>
                        </cfif>

                        <cfif q_readings.frs_meter_incoming_ccf gt 0>
                            <cfset actual_sewer_ccf = actual_sewer_ccf + q_readings.frs_meter_incoming_ccf - total_loss>
                        </cfif>

                        <cfif q_readings.frs_meter_sewer_ccf eq 0 and q_readings.frs_meter_incoming_ccf eq 0>
                            <cfset actual_sewer_ccf = actual_sewer_ccf + billed_total_ccf - total_loss>
                        </cfif>
                        --->

                        <!---
                        <cfif q_readings.HandleAsSewer lt 0>
                            <cfset xfrs_billing_actual_basis = 
                                total_incoming_ccf eq 0 or q_readings.frs_loss lt 0 or listfind("4,6", frs_plan_billing_method_type) ? 
                                total_consumption : (total_consumption / total_incoming_ccf) * 100>
                        <cfelse>
                            <cfset xfrs_billing_actual_basis = 
                                (frs_plan_billing_method_type neq "5" or total_incoming_ccf eq 0) ? 
                                total_consumption : ( total_consumption / total_incoming_ccf) * 100>
                        </cfif>
                        --->  

                        <!--- 5=percentage; 6=fixed non-metered --->
                        <cfif listfind("5", q_frs_billing.frs_plan_billing_method_type) and
                            q_frs_billing.frs_billing_incoming_ccf_override neq "" and q_frs_billing.frs_billing_incoming_ccf_override neq 0>
                                <cfset actual_sewer_basis = (actual_sewer_ccf / q_frs_billing.frs_billing_incoming_ccf_override) * 100>
                        <cfelseif listfind("5", q_frs_billing.frs_plan_billing_method_type) and billed_total_ccf neq 0>
                            <cfset actual_sewer_basis = (actual_sewer_ccf / billed_total_ccf) * 100>
                        <cfelseif listfind("4,6", q_frs_billing.frs_plan_billing_method_type)>
                            <cfset actual_sewer_basis = actual_sewer_ccf>
                        <cfelseif billed_total_ccf neq 0>
                            <cfset actual_sewer_basis = (actual_sewer_ccf / billed_total_ccf) * 100>
                        <cfelse>
                            <cfset actual_sewer_basis = actual_sewer_ccf>
                        </cfif>

                        <cfif session.user_id eq "goberlagx" and q_frs_billing.currentrow eq q_frs_billing.recordcount>
                            incoming:
                            table: billing (q_billing) billing_date=#q_billing.billing_date#<br>
                             water_serv_gals_cons=#numberformat(q_billing.water_serv_gals_cons)#|irrig_gals_cons=#numberformat(q_billing.irrig_gals_cons)#| incoming_total_gal=#numberformat(incoming_total_gal)#|incoming_total_ccf=#decimalformat(incoming_total_ccf)#|
                             <br><br>

                             billed:
                             incoming_total_ccf=#decimalformat(incoming_total_ccf)#|sewer_pct=#q_billing.sewer_percent#%|billed_sewer_ccf=#decimalformat(billed_sewer_ccf)#|
                             frs_billing_billed_charge=#dollarformat(q_frs_billing.frs_billing_billed_charge)#|
                             <br><br>

                            override: table: vw_cs_frs_billed_actual (q_frs_billing):
                            frs_billing_incoming_ccf_override=#q_frs_billing.frs_billing_incoming_ccf_override#|frs_billing_sewer_charge_override=#q_frs_billing.frs_billing_sewer_charge_override#|
                            <br><br>

                            readings: table: cs_frs_meter_readings (q_readings):<br>
                            frs_meter_incoming_ccf=#q_readings.frs_meter_incoming_ccf#|frs_meter_sewer_ccf=#q_readings.frs_meter_sewer_ccf#|<br>
                            frs_meter_makeup_ccf=#q_readings.frs_meter_makeup_ccf#|frs_meter_blowdown_ccf=#q_readings.frs_meter_blowdown_ccf#|frs_meter_loss_ccf=#q_readings.frs_meter_loss_ccf#|<br>
                            <!--- HandleAsSewer=#q_readings.HandleAsSewer#|BD-MU-LOSS|<br> --->
                            evaporation=#evaporation#|total_loss=#total_loss#|total_incoming_ccf=#decimalformat(total_incoming_ccf)#|actual_sewer_ccf=#decimalformat(actual_sewer_ccf)#|actual_sewer_basis=#decimalformat(actual_sewer_basis)#|<br><br>

                            actual:
                            actual_sewer_ccf = billed_total_ccf + meter_incoming_ccf - (meter_makeup_ccf - meter_blowdown_ccf) - meter_loss_ccf<br>
                            #decimalformat(actual_sewer_ccf)# = #decimalformat(billed_total_ccf)# + #q_readings.frs_meter_incoming_ccf# - (#q_readings.frs_meter_makeup_ccf# - #q_readings.frs_meter_blowdown_ccf#)  - #q_readings.frs_meter_loss_ccf# | #q_billing.billing_date#|<br><br>

                            actual:
                            frs_billing_actual_sewer=#decimalformat(q_frs_billing.frs_billing_actual_sewer)#|frs_billing_actual_charge=#dollarformat(q_frs_billing.frs_billing_actual_charge)#|<br>
                           calc:
                           frs_billing_difference=#dollarformat(q_frs_billing.frs_billing_difference)# (billed_sewer_charge - actual_sewer_charge)|<br>
                           frs_billing_actual_basis=#decimalformat(q_frs_billing.frs_billing_actual_basis)# (actual_sewer_ccf / incoming_total_ccf)|
                        </cfif>

                        <!--- <cfset actual_sewer_ccf_new = 0> --->

                        <!---
                        <cfif q_readings.frs_meter_makeup_ccf neq 0 or q_readings.frs_meter_blowdown_ccf neq 0 or q_readings.frs_meter_loss_ccf neq 0>
                            <cfset actual_sewer_ccf_new = billed_total_ccf>
                        </cfif>
                        --->

                        <cfset actual_sewer_ccf_new = billed_total_ccf +
                                q_readings.frs_meter_incoming_ccf + q_readings.frs_meter_sewer_ccf -
                                q_readings.frs_meter_makeup_ccf + q_readings.frs_meter_blowdown_ccf - q_readings.frs_meter_loss_ccf>

                        <!--- <cfif url.account_num eq "000099013-0099014-0001"> <!--- GREAT NORTHWEST ASSOCIATION --->
                            <cfif q_readings.frs_meter_incoming_ccf eq 0 and q_readings.frs_meter_sewer_ccf eq 0 and
                                  q_readings.frs_meter_makeup_ccf eq 0 and q_readings.frs_meter_blowdown_ccf eq 0 and q_readings.frs_meter_loss_ccf eq 0>
                                <cfset actual_sewer_ccf_new = 0>
                            </cfif>
                        </cfif> --->

                            <cfset tooltip = "">
                            <cfset tooltip = "#tooltip# billing_date #q_billing.billing_date# #chr(10)#">
                            <cfset tooltip = "#tooltip# #repeatstring("-",35)# #chr(10)#">
                            <cfset tooltip = "#tooltip# incoming_total_ccf #decimalformat(incoming_total_ccf)# #chr(10)#">
                            <cfset tooltip = "#tooltip# billed_total_ccf #decimalformat(billed_total_ccf)# #chr(10)#">
                            <cfset tooltip = "#tooltip# #repeatstring("-",35)# #chr(10)#">
                            <cfset tooltip = "#tooltip# + meter_incoming_ccf #q_readings.frs_meter_incoming_ccf# #chr(10)#">
                            <cfset tooltip = "#tooltip# + meter_sewer_ccf #q_readings.frs_meter_sewer_ccf# #chr(10)#">
                            <cfset tooltip = "#tooltip# + meter_blowdown_ccf #q_readings.frs_meter_blowdown_ccf# #chr(10)#">
                            <cfset tooltip = "#tooltip# - meter_makeup_ccf #q_readings.frs_meter_makeup_ccf# #chr(10)#">
                            <cfset tooltip = "#tooltip# - meter_loss_ccf #q_readings.frs_meter_loss_ccf# #chr(10)#">
                            <cfset tooltip = "#tooltip# #repeatstring("-",35)# #chr(10)#">
                            <cfset tooltip = "#tooltip# = actual_sewer_ccf #decimalformat(actual_sewer_ccf)# #chr(10)#">
                            <cfif session.user_id eq "goberlag">
                                <cfset tooltip = "#tooltip# = actual_sewer_ccf_new #decimalformat(actual_sewer_ccf_new)# #chr(10)#">
                            </cfif>
                            <cfset tooltip = "#tooltip# #repeatstring("-",35)# #chr(10)#">
                            <cfset tooltip = "#tooltip# #trim(content1)# #chr(10)#">

                            <cfset tooltip_actual_sewer_ccf[q_frs_billing.currentrow] = tooltip>

                        <cfif session.user_id eq "goberlag">
                            <cfset tooltip = "">
                            <cfset tooltip = "#tooltip# billing_date #q_billing.billing_date# #chr(10)#">
                            <cfset tooltip = "#tooltip# #repeatstring("-",35)# #chr(10)#">
                            <cfset tooltip = "#tooltip# incoming_total_ccf #decimalformat(incoming_total_ccf)# #chr(10)#">
                            <cfset tooltip = "#tooltip# billed_total_ccf #decimalformat(billed_total_ccf)# #chr(10)#">
                            <cfset tooltip = "#tooltip# #repeatstring("-",35)# #chr(10)#">
                            <cfset tooltip = "#tooltip# + meter_incoming_ccf #q_readings.frs_meter_incoming_ccf# #chr(10)#">
                            <cfset tooltip = "#tooltip# + meter_sewer_ccf #q_readings.frs_meter_sewer_ccf# #chr(10)#">
                            <cfset tooltip = "#tooltip# + meter_blowdown_ccf #q_readings.frs_meter_blowdown_ccf# #chr(10)#">
                            <cfset tooltip = "#tooltip# - meter_makeup_ccf #q_readings.frs_meter_makeup_ccf# #chr(10)#">
                            <cfset tooltip = "#tooltip# - meter_loss_ccf #q_readings.frs_meter_loss_ccf# #chr(10)#">
                            <cfset tooltip = "#tooltip# #repeatstring("-",35)# #chr(10)#">
                            <cfset tooltip = "#tooltip# = actual_sewer_ccf #decimalformat(actual_sewer_ccf)# #chr(10)#">
                            <cfif session.user_id eq "goberlag">
                                <cfset tooltip = "#tooltip# = actual_sewer_ccf_new #decimalformat(actual_sewer_ccf_new)# #chr(10)#">
                            </cfif>
                            <cfset tooltip = "#tooltip# #repeatstring("-",35)# #chr(10)#">
                            <cfset tooltip = "#tooltip# #trim(content1)# #chr(10)#">

                            <cfset tooltip_actual_sewer_ccf[q_frs_billing.currentrow] = tooltip>
                        </cfif>
                       
                        <tr align="right" valign="top"
                            onmousedown="this.className='clicked';" onmouseover="this.className='menuon';" onmouseout="this.className='menuoff';">

                        <td>
                            <img src="images/select icon.png" width="20" height="20" alt="Details"
                                onClick="javascript:ColdFusion.Window.create('AssessDetail#SERV_TO_DATE#',
                                    'Assessment Details [FRS_AssessDetailWindow]',
                                    'FRS_AssessDetailWindow.cfm?SERV_FROM_DATE=#SERV_FROM_DATE#&SERV_TO_DATE=#SERV_TO_DATE#&account_num=#url.account_num#&assessRecID=#q_frs_billing.rec_id#&refdiv=Assess#url.recid#',
                                    {refreshOnShow:true,closable:true,center:true,overflow:scroll, modal:false,width:1000,height:600,_cf_refreshOnShow:true});">
                        </td>

                        <!--- billed date --->
                        <!--- <td style="color:#rowcolor#;" nowrap title="#tooltip_meter_dtl[q_frs_billing.currentrow]#"> --->
                        <td style="color:#rowcolor#;" nowrap>
                            #q_billing.billing_date#
                        </td>

                        <!--- incoming water gal | irrig gal | total gal --->
                        <td><span style="white-space:nowrap">#numberformat(q_billing.water_serv_gals_cons)#</span></td>
                        <td><span style="white-space:nowrap">#numberformat(q_billing.irrig_gals_cons)#</span></td>
                        <td><span style="white-space:nowrap">#numberformat(incoming_total_gal)#</span></td>

                        <!--- incoming total_ccf --->
                        <td>
                            <span style="white-space:nowrap">
                                <cfif val(irrig_ccf_cons) gt 0>&sup1;</cfif>
                                <cfif q_frs_billing.frs_billing_incoming_ccf_override neq "" and session.user_id neq "goberlagx">
                                    <s>#decimalformat(incoming_total_ccf_original)#</s><br>
                                </cfif>
                                <cfif q_frs_billing.frs_billing_incoming_ccf_override neq "">&sup2;</cfif>
                                <!--- #decimalformat(total_incoming_ccf)# --->
                                <!--- #int(INCOMING_CCF)# --->
                                <!--- #decimalformat(INCOMING_CCF)# --->
                                <!--- <cfif q_frs_billing.frs_billing_incoming_ccf_override neq "">
                                    #decimalformat(q_frs_billing.frs_billing_incoming_ccf_override)#
                                <cfelse> --->
                                    #decimalformat(billed_total_ccf)#
                                <!--- </cfif> --->
                            </span>
                        </td>

                        <!--- billed_sewer_ccf --->
                        <td>
                            <!--- #int(FRS_BILLING_BILLED_SEWER)# --->
                            <!--- #decimalformat(FRS_BILLING_BILLED_SEWER)# --->
                            <!--- 03/25/2026 GRO removed billed_sewer_ccf override --->
                            <!---
                            <cfif q_frs_billing.frs_billing_incoming_ccf_override neq "" and url.account_num neq "000099004-0099005-0004">
                                &sup2; #decimalformat(q_frs_billing.frs_billing_incoming_ccf_override)#
                            <cfelse>
                            --->
                            <cfif q_frs_billing.frs_billing_incoming_ccf_override eq "">
                                (#q_billing.sewer_percent#%) #decimalformat(billed_sewer_ccf)#
                            <cfelse>
                                <s>(#q_billing.sewer_percent#%) #decimalformat(billed_sewer_ccf)#</s>
                            </cfif>
                            <!--- </cfif> --->
                        </td>

                        <!--- billed_sewer_charge --->
                        <cfif q_frs_billing.frs_billing_sewer_charge_override neq "">
                            <cfset vfrs_billing_billed_charge = q_frs_billing.frs_billing_sewer_charge_override>
                        <cfelse>
                            <cfset vfrs_billing_billed_charge = q_frs_billing.frs_billing_billed_charge>
                        </cfif>

        				<td>
                            <cfif q_frs_billing.frs_billing_sewer_charge_override neq "">
                                <s>#dollarformat(q_frs_billing.frs_billing_billed_charge)#</s><br>
                            </cfif>
                            <cfif q_frs_billing.frs_billing_sewer_charge_override neq "">&sup3;</cfif>
                            #dollarformat(vfrs_billing_billed_charge)#
                        </td>
                    
                        <!--- actual_sewer_ccf --->
                        <!---
                        <cfif q_readings.FRS_LOSS gt 0>
                            <!--- <cfset total_consumption = (total_incoming_ccf - q_readings.frs_loss) + q_readings.frs_meter_sewer_ccf> --->
                            <cfset total_consumption = q_readings.frs_meter_sewer_ccf + (billed_water_ccf - q_readings.frs_loss)>
                        <cfelse>
                            <cfset total_consumption = q_readings.frs_meter_sewer_ccf + q_readings.HandleAsSewer>
                        </cfif>
                        --->

                        <!---
        				<cfif q_readings.HandleAsSewer gt 0>
                            <!--- <cfset total_consumption = total_consumption + total_incoming_ccf> --->
                            <!--- <cfset total_consumption = total_consumption + billed_water_ccf> --->
                            <cfset total_consumption = billed_total_ccf + q_readings.HandleAsSewer>
                        </cfif>
                        --->
                        <!---<cfset total_consumption = round(total_consumption)>--->
                        
                        <!--- <cfset consumptionColor = (int(total_consumption) lt 0) ? "darkred" : "blue"> --->
                        <cfset consumptionColor = (int(actual_sewer_ccf) lt 0) ? "darkred" : "blue">

                        <td style="color:#consumptionColor#;" title="#tooltip_actual_sewer_ccf[q_frs_billing.currentrow]#"> 
                            <!--- #decimalformat(total_consumption)# --->
                            #decimalformat(actual_sewer_ccf)#
                        </td>
                        
                        <!--- actual_sewer_charge --->
                        <!---
                        <cfset actual_billing_charge = 
                            objdbfunction.calcSewerCharge('#getAccountValidRet.ICL_OCL#', meterIndex, '#total_consumption#', '#frs_plan_basis#', '#billing_date#')>
                        --->
                        <cfif url.account_num neq "000099003-0099004-0001"> <!--- SW TX METHODIST HOSPITAL --->
                            <cfset actual_billing_charge = 
                            objdbfunction.calcSewerCharge('#getAccountValidRet.ICL_OCL#', meterIndex, '#actual_sewer_ccf#', '#q_frs_billing.frs_plan_basis#', '#billing_date#')>
                        <cfelse>
                            <cfset actual_billing_charge = 
                            objdbfunction.calcSewerCharge('O', meterIndex, '#actual_sewer_ccf#', '#q_frs_billing.frs_plan_basis#', '#billing_date#')>
                        </cfif>

                        <td style="color:blue;">#dollarformat(actual_billing_charge)#</td>

                        <!--- difference --->
                        <cfset xfrs_billing_difference =  vfrs_billing_billed_charge - actual_billing_charge>
                        <td style="color:blue;">#dollarformat(xfrs_billing_difference)#</td>
                        
                        <!---
                        if the loss is calculated as less than zero, it means it was likely a blowdown without a makeup,
                        and should be handled as a sewer meter would be
                        --->
                    
                        <!---
                        <cfif q_readings.HandleAsSewer lt 0>
        				    <cfset xfrs_billing_actual_basis = 
                                total_incoming_ccf eq 0 or q_readings.frs_loss lt 0 or listfind("4,6", frs_plan_billing_method_type) ? 
                                total_consumption : (total_consumption / total_incoming_ccf) * 100>
        				<cfelse>
        				    <cfset xfrs_billing_actual_basis = 
                                (frs_plan_billing_method_type neq "5" or total_incoming_ccf eq 0) ? 
                                total_consumption : ( total_consumption / total_incoming_ccf) * 100>
                        </cfif>
                        --->                    
            
                        <cfquery name="updateBillingRecord" datasource="intradb" result="r_update">
                            update VW_CS_FRS_BILLED_ACTUAL
                            set
                                <!--- FRS_BILLING_ACTUAL_SEWER = '#val(total_consumption)#', --->	
                                FRS_BILLING_ACTUAL_SEWER = '#val(actual_sewer_ccf)#',			
                                FRS_BILLING_ACTUAL_CHARGE = '#val(actual_billing_charge)#',
                                FRS_BILLING_DIFFERENCE = '#val(xfrs_billing_difference)#',
                                <!--- FRS_BILLING_ACTUAL_BASIS = '#val(xfrs_billing_actual_basis)#', --->
                                FRS_BILLING_ACTUAL_BASIS = '#val(actual_sewer_basis)#'
                            where rec_id = '#q_frs_billing.rec_id#'
                        </cfquery>
                    
                        <td align="left">
                            <cfset usethis = (FRS_BILLING_USE_MONEY eq 1) ? "yes" : "no">
                            <cfinput name="FRSMONEY#REC_ID#" type="checkbox" checked="#usethis#" value="#REC_ID#"
                                onclick="javascript:SubmitAssessmentForm('assess#left(url.account_num,9)#');javascript:ColdFusion.navigate('./modules/Assessment_subWindow.cfm?account_num=#url.account_num#&recid=#url.recid#','fra#left(url.account_num,9)#');">
                        </td>

                        <!--- <td style="color:blue;">#decimalformat(xfrs_billing_actual_basis)#%</td> --->
                        <td style="color:blue;">#decimalformat(actual_sewer_basis)#</td>

                        <td align="left">
                            <cfset usethis = (frs_billing_use_basis eq 1) ? "yes" : "no">
                            <cfinput name="FRSBASIS#REC_ID#" type="checkbox" checked="#usethis#" value="#REC_ID#"
                                onclick="javascript:SubmitAssessmentForm('assess#left(url.account_num,9)#');javascript:ColdFusion.navigate('./modules/Assessment_subWindow.cfm?account_num=#url.account_num#&recid=#url.recid#','fra#left(url.account_num,9)#');">
                        </td>

                        <cfif session.user_id eq "goberlag">
                            <td>
                                <a href="/intranet/apps/webservices/getbillbynum.cfm/#q_billing.infor_billing_num#" target="_blank">Bill</a>
                            </td>
                        </cfif>
                    </tr>
                    </cfoutput>
                </table>
            </cfform>
        </cflayoutarea>
    </cflayout>
    </div>
</cflayoutarea>

<cflayoutarea name="box2">
    <div style="padding:1em;">
            <cfoutput>
          		<table border="1" cellpadding="2" style="border-collapse:collapse;">
                    <tr><td>Account</td><td>#url.account_num#</td></tr>
                    <tr><td>Customer</td><td>#getAccountValidRet.customer_name#</td></tr>
                    <tr>
                        <td>ICL/OCL</td>
                        <td>
                            #getAccountValidRet.ICL_OCL#
                            <cfif url.account_num eq "000099003-0099004-0001"><span style="background-color:orange">Bill Sewer as OCL</span></cfif>
                        </td>
                    </tr>
                    <tr><td>Actual Meter Size</td><td>#actualMeterSize#"</td></tr>

                    <cfif actualMeterSize neq billingMeterSize>
                        <tr style="background-color:pink;"><td>Billing Meter Size</td><td>#billingMeterSize#"</td></tr>
                    </cfif>

                    <tr><td>Account Type</td><td>#getAccountValidRet.ACCT_TYPE#</td></tr>
                    <tr>
                        <td>Bill Method</td>
                        <td>
                            <cfswitch expression="#q_frs_billing.frs_plan_billing_method_type#">
                                <cfcase value="5">5-Percentage</cfcase>
                                <cfcase value="4">4-Fixed Metered</cfcase>
                                <cfcase value="6">4-Fixed Non-Metered</cfcase>
                            </cfswitch>
                        <!--- #q_frs_billing.frs_plan_billing_method_type# --->
                        </td>
                    </tr>
                    <tr><td>Plan Basis</td><td>#q_frs_billing.frs_plan_basis#</td></tr>
                </table>
            </cfoutput><br>
        <!--- </cfpod> --->

        <cfpod title="Flat Rate Assessment" width="300" height="300" 
            name="fra#left(url.account_num,9)#" source="./modules/Assessment_subWindow.cfm?account_num=#url.account_num#&recid=#url.recid#">
        </cfpod>

        <p>
            &sup1; includes Irrigation Gal<br>
            &sup2; override Incoming Total CCF<br>
            &sup3; override Billed Sewer Charge
        </p>

        <cfif session.user_id eq "goberlagx">
            <!--- <cfdump var="#getAccountValidRet#" label="getAccountValidRet"><br> --->
            <!--- <cfdump var="#getMeterOutputRet#" label="getMeterOutputRet"><br> --->
            actualMeterSize=<cfoutput>#actualMeterSize#</cfoutput><br>
            billingMeterSize=<cfoutput>#billingMeterSize#</cfoutput><br>
            meterIndex=<cfoutput>#meterIndex#</cfoutput><br>
        </cfif>

        <cfif session.user_id eq "goberlag">
            <cfdirectory action="list" name="q_files" directory="#ExpandPath("reports/files/")#" filter="frs#url.account_num#*.pdf" sort="name desc">
            <!--- <cfdump var="#q_files#" top="4"> --->
            Assessments:<br>
            <cfoutput query="q_files" maxrows="4">
                <a href="reports/files/#q_files.name#" target="_blank">
                    #q_files.name#<br>
                </a>
            </cfoutput><br>
        </cfif>
    </div>
</cflayoutarea>

<!---
<cflayout name="FRSmemos#left(url.account_num,9)#" type="tab" height="200" width="965" >
 <cflayoutarea name="FRSmemo#url.account_num#" title="Assessment Audit Log" >
 	<cfset displayCommentsRec = objdbfunction.getAllAuditLog('#url.account_num#')/>
    <cfoutput query="displayCommentsRec">
    <p align="left">#DATEFORMAT(FRS_ACTIVITY_TIMESTAMP,'mm/dd/yyyy')# - #FRS_ACTITITY_LOGENTRY#</p>
    </cfoutput>
 </cflayoutarea>
</cflayout>
--->

</cflayout>

<!--- <cfif session.user_id eq "goberlag">
    <cfdirectory action="list" name="q_files" directory="#ExpandPath("reports/files/")#" filter="frs#url.account_num#*.pdf" sort="name desc">
    <!--- <cfdump var="#q_files#" top="4"> --->
    Prior Assessments:<br>
    <cfoutput query="q_files" maxrows="4">
        <a href="reports/files/#q_files.name#" target="_blank">
            #q_files.name#<br>
        </a>
    </cfoutput><br>
</cfif> --->

<cfif session.user_id eq "goberlagx">
    <cfif isDefined("#q_readings_dtl#")><cfdump var="#q_readings_dtl#"></cfif>
</cfif>

<cfif session.user_id eq "goberlagx">
    <div>
        <!--- <cfdump var="#session#" label="session"><br> --->
        <cfoutput>
            <!--- session.currentref=#session.currentref#<br> --->
            application.ws_accountmethods=#application.ws_accountmethods#<br>
        </cfoutput>
        <cfdump var="#getAccountValidRet#" label="getAccountValidRet"><br>
        <!--- <cfdump var="#getFRSbillingIn#" label="getFRSbillingIn"><br> --->
        <cfdump var="#q_frs_billing#" label="q_frs_billing"><br>
        <cfif isDefined("q_billing")><cfdump var="#q_billing#" label="q_billing"><br></cfif>
        <cfif isDefined("q_meter")><cfdump var="#q_meter#" label="q_meter"><br></cfif>
        <cfif isDefined("q_readings")><cfdump var="#q_readings#" label="q_readings"><br></cfif>
    </div>

    <!---
    <cfinvoke webservice="#application.ws_accountmethods#" method="getCSWEBInfo" returnvariable="aQuery" refreshwsdl="false">
        <cfinvokeargument name="ACCOUNT_NUM" value="#acctnum#">
        <cfinvokeargument name="ADDRESS_KEY" value="">
    </cfinvoke>
    --->

    <!--- <cfquery name="q_frs_accounts" datasource="intradb">
        SELECT * 
        FROM CS_FRS_ACCOUNTS
        WHERE FRS_ACCOUNT_NUM = '#url.account_num#'
    </cfquery>
    <cfdump var="#q_frs_accounts#" label="q_account_csweb"><br> --->

    <cfquery name="q_account_csweb" datasource="datawarehouse">
        SELECT
        customer,
        [service address] as service_address,
        [account group] as account_group,
        [account subgroup] as account_subgroup,
        [account class] as account_class,
        [account key] as account_key,
        cycle
        FROM VW_ACCOUNT_CSWEB
        WHERE
        [Account Number] = '#url.account_num#' or 
        [Legacy Account Number] = '#url.account_num#'
        and [Account Status] = 'A'
    </cfquery>
    <!--- <cfdump var="#q_account_csweb#" label="q_account_csweb"><br> --->

    <!---
    <div style="background-color:lightgrey; display:inline-block; padding:1em;">
        <cfoutput>
            #url.account_num#<br>
            #q_account_csweb.customer#<br>
            #q_account_csweb.service_address#<br>
            ICL/OCL: #q_account_csweb.account_group#<br>
            SubGroup: #q_account_csweb.account_subgroup#<br>
            Class: #q_account_csweb.account_class#<br>
            Cycle: #q_account_csweb.cycle#
            <!--- <hr> --->
            <!--- SERVICES for #INT(AQuery.ACCOUNT_KEY)#:<br> --->
            <!--- <cfloop query="bQuery">
                #service#<cfif bQuery.recordcount gt 1 and bQuery.currentrow lt bQuery.recordcount>,</cfif>
            </cfloop> --->
        </cfoutput>
    </div>
    --->
</cfif>

<!--- 11/18/2024 GRO debugging for query that returns 0 rows --->
<cfif session.user_id neq "goberlag">
    <cfmail to="testuser@example.com" from="#cgi.server_name# <testuser@example.com>"
        subject="cfalert assessment #cgi.script_name# #DateTimeFormat(now(), "yyyy-mm-dd HH:nn:ss")#" type="html">
        #cgi.http_host##cgi.http_url#<br><br>
        #cgi.cf_template_path#<br><br>

        session.user_id=#session.user_id#<br>
        url.account_num=#url.account_num#<br>
        customer_name=#getAccountValidRet.customer_name#<br><br>
        
        frs_billing_incoming_ccf_override=#q_frs_billing.frs_billing_incoming_ccf_override#<br>
        frs_billing_sewer_charge_override=#q_frs_billing.frs_billing_sewer_charge_override#<br><br>

        <!--- <cfdump var="#getFRSbillingIn#" label="getFRSbillingIn"><br> --->
        <cfdump var="#q_frs_billing#" label="q_frs_billing"><br>
        <cfif isDefined("getAccountValidRet")><cfdump var="#getAccountValidRet#" label="getAccountValidRet"><br></cfif>
        <cfif isDefined("q_billing")><cfdump var="#q_billing#" label="q_billing"><br></cfif>
        <cfif isDefined("q_readings")><cfdump var="#q_readings#" label="q_readings"><br></cfif>
        <cfif isDefined("r_update")><cfdump var="#r_update#" label="r_update"><br></cfif>

        <cfdump var="#form#" label="form"><br>
        <cfdump var="#session#" label="session"><br>
        <cfdump var="#server#" label="server"><br>
        <cfdump var="#cgi#" label="cgi"><br>
    </cfmail>
</cfif>