<cfset objdbfunction = createobject('component', 'Intranet.apps.CustServ.FRS.CFCs.FRSobjects')>

<cfset read_date_from = "#dateformat(dateadd("d", -14, url.SERV_TO_DATE),"mm/dd/yyyy")# 00:00:00">
<cfset read_date_to = "#dateformat(dateadd("d", +14, url.SERV_TO_DATE),"mm/dd/yyyy")# 23:59:59">

<cfif session.user_id eq "goberlagx">
  <cfoutput>#cgi.script_name#</cfoutput><br>
  url.serv_to_date=<cfoutput>#url.serv_to_date#</cfoutput><br>
  read_date_from=<cfoutput>#read_date_from#</cfoutput> -14 days<br>
  read_date_to=<cfoutput>#read_date_to#</cfoutput> +14 days<br>
</cfif>

<cfquery name="getConsumptionDetails" datasource="intradb">
  SELECT *,
  (isnull(FRS_METER_MAKEUP_CCF,0) + isnull(FRS_METER_BLOWDOWN_CCF,0) + isnull(FRS_METER_LOSS_CCF,0) + isnull(FRS_METER_SEWER_CCF,0)) as FRS_LOSS,
  isnull(FRS_METER_INCOMING_CCF,0) as FRS_METER_INCOMING_CCF
  FROM CS_FRS_METER_READINGS
  WHERE
  FRS_METER_ACCT_NUM = '#url.account_num#' and
  FRS_METER_READ_DATE BETWEEN '#read_date_from#' and '#read_date_to#'
</cfquery>

<!--- <cfset totalConsumption = 0> --->
<cfset total_consumption_gal = 0>

<cfquery name="getCurrentAssessment" datasource="intradb">
  select *
  FROM VW_CS_FRS_BILLED_ACTUAL
  WHERE rec_id = '#url.assessRecID#'
</cfquery>

<div style="padding:1em;">

<cfoutput>#url.account_num#</cfoutput><br>

Service Dates:&nbsp; <cfoutput>#url.SERV_FROM_DATE#</cfoutput> - <cfoutput>#url.SERV_TO_DATE#</cfoutput><br>
Reading Dates: <cfoutput>#left(read_date_from,10)#</cfoutput> - <cfoutput>#left(read_date_to,10)#</cfoutput> (+/- 14 days)<br><br>

<cfif getConsumptionDetails.recordcount gte 0>
  <table border="1" style="border-collapse:collapse;" cellpadding="2">
    <tr bgcolor="lightgrey">
      <td>SERIAL_NUM</td>
      <td>READ_DATE</td>
      <td>READING</td>
      <td>FUNCTION</td>
      <!--- <td align="right">CONSUMPTION</td> --->
      <td align="right">CCF</td>
      <td>ENTRY_DATE</td>
    </tr>

    <cfoutput query="getConsumptionDetails">
      <cfset total_consumption_gal = total_consumption_gal + getConsumptionDetails.FRS_LOSS>
      <cfset meter_type = ucase(objdbfunction.getActiveMeters(url.account_num,FRS_METER_SERIAL_NUM).FRS_METER_FUNCTION)>
      <tr>
        <td>#getConsumptionDetails.FRS_METER_SERIAL_NUM#</td>
        <td>#dateformat(getConsumptionDetails.FRS_METER_READ_DATE, "yyyy-mm-dd")#</td>
        <!--- <td align="right">#int(getConsumptionDetails.FRS_METER_READING)#</td> --->
        <td align="right">#numberformat(getConsumptionDetails.FRS_METER_READING)#</td>

        <!--- <td>#objdbfunction.getActiveMeters(url.account_num,FRS_METER_SERIAL_NUM).FRS_METER_FUNCTION#</td> --->
        <td>#meter_type#</td>

        <!--- <td align="right">#getConsumptionDetails.FRS_LOSS#</td> --->
        <td align="right">
          <cfif meter_type eq "incoming">
            #decimalformat(getConsumptionDetails.frs_meter_incoming_ccf)#
          <cfelseif meter_type eq "sewer">
            #decimalformat(getConsumptionDetails.frs_meter_sewer_ccf)#
          <cfelseif meter_type eq "makeup">
            #decimalformat(getConsumptionDetails.frs_meter_makeup_ccf)#
          <cfelseif meter_type eq "blowdown">
            #decimalformat(getConsumptionDetails.frs_meter_blowdown_ccf)#
          <cfelseif meter_type eq "loss">
            #decimalformat(getConsumptionDetails.frs_meter_loss_ccf)#
          <cfelse>
            ???
          </cfif>
        </td>
        <td>#dateformat(getConsumptionDetails.FRS_METER_ENTRY_DATE, "yyyy-mm-dd")#</td>
      </tr>
    </cfoutput>
  </table><br>
</cfif>

<cfif session.user_id eq "goberlagx">
    <!--- <cfset total_consumption_ccf = total_consumption_gal / 748.1> --->
    <cfoutput>
    total_consumption_gal=#decimalformat(total_consumption_gal)#<br>
    <!--- total_consumption_ccf=#decimalformat(total_consumption_ccf)#<br> --->
    <!--- total_sewer_ccf=#decimalformat(total_sewer_ccf)#<br> --->
    </cfoutput><br>
</cfif>

<div style="background-color:lightyellow; display:inline-block; padding:1em;">
  Functionality change on 03/25/2026:<br>
  "Override Billed Sewer CCF" changed to "Override Incoming Total CCF"
</div><br><br>

<cfoutput>
  <form name="Override#url.assessRecID#">
    <table>
      <tr>
        <td>Override Incoming Total CCF</td>
        <!--- <td>Override Billed Sewer CCF</td> --->
        <td>
          <input type="text" name="OverRideValue1" value="#getCurrentAssessment.FRS_BILLING_INCOMING_CCF_OVERRIDE#">
        </td>
      </tr>

      <tr>
        <td>Override Billed Sewer Charge ($)</td>
        <td>
          <input  type="text" name="OverRideValue2" value="#getCurrentAssessment.FRS_BILLING_SEWER_CHARGE_OVERRIDE#">
        </td>
      </tr>

      <input type="hidden" name="serial_num" value="#getConsumptionDetails.FRS_METER_SERIAL_NUM#">
      <input type="hidden" name="read_date" value="#getConsumptionDetails.FRS_METER_READ_DATE#">
      <input type="hidden" name="REC_ID" value="#url.assessRecID#">
      <input type="hidden" name="PATH_INFO" value="#cgi.PATH_INFO#">

      <tr><td></td></tr>

      <tr>
        <td>&nbsp;</td>
        <td>
          <input type="button" name="submit" value="submit"
            onClick="javascript:submitInOverrideValue('Override#url.assessRecID#','#url.refdiv#','FRS_AssessmentWindow.cfm?#session.currentref#','AssessDetail#URL.SERV_TO_DATE#');">
        </td>
      </tr>
    </table>
  </form>
</cfoutput>

<cfif session.user_id eq "goberlagx">
  <cftry>
    <cfquery name="q_billing" datasource="csweb">
        select *
        from billing b
        where 1=1
        and rec_id = '#url.assessRecID#'
    </cfquery>
    <!--- <cfdump var="#q_billing#" label="q_billing"><br> --->

    <cfset a_columnlist = q_billing.getColumnList()>

    <table style="border:1px solid black; border-collapse:collapse; margin-top:1em; padding:2px;" border="1">
      <tr>
        <td colspan="2" style="background-color:lightgrey;">Billing</td>
      </tr>

      <cfloop array="#a_columnlist#" item="itm">
        <cfset itm_value = q_billing["#itm#"][1]>
        <tr>
          <td><cfoutput>#itm#</cfoutput></td>
          <td><cfoutput>#itm_value#</cfoutput></td>
        </tr>
      </cfloop>
    </table>

    <cfcatch>
      <cfdump var="#cfcatch#">
    </cfcatch>
  </cftry>
</cfif>

</div><br>

<cfif session.user_id eq "goberlagx">
  <cfdump var="#getConsumptionDetails#" label="getConsumptionDetails"><br>
  <cfdump var="#getCurrentAssessment#" label="getCurrentAssessment"><br>
</cfif>

<cfif session.user_id eq "goberlagx">
  url.assessRecID=<cfoutput>#url.assessRecID#</cfoutput><br>
  <cfdump var="#getCurrentAssessment#" label="getCurrentAssessment"><br>
</cfif>

<cfif session.user_id eq "goberlagx">
  <cfquery name="q_meter_readings" datasource="intradb">
      SELECT
      --FRS_METER_READ_DATE,
      isnull(sum(FRS_METER_MAKEUP_CCF),0) - isnull(sum(FRS_METER_BLOWDOWN_CCF),0) + isnull(SUM(FRS_METER_LOSS_CCF),0) as FRS_LOSS,
      isnull(sum(FRS_METER_BLOWDOWN_CCF),0) - isnull(sum(FRS_METER_MAKEUP_CCF),0) - isnull(SUM(FRS_METER_LOSS_CCF),0) as HandleAsSewer,
      isnull(SUM(FRS_METER_SEWER_CCF),0) as FRS_METER_CONSUMPTION_X,
      isnull(sum(FRS_METER_INCOMING_CCF),0) as FRS_METER_INCOMING_CCF
      FROM CS_FRS_METER_READINGS
      WHERE 1=1
      AND FRS_METER_ACCT_NUM = '#url.account_num#' 
      AND FRS_METER_READ_DATE BETWEEN 
      '#dateformat(dateadd("d", -14, url.SERV_TO_DATE),"mm/dd/yyyy")# 00:00:00' and
      '#dateformat(dateadd("d", +18, url.SERV_TO_DATE),"mm/dd/yyyy")# 23:59:59'
      --group by FRS_METER_READ_DATE
  </cfquery>
  <cfdump var="#q_meter_readings#" label="q_meter_readings"><br>

  <cfquery name="q_meter_readings" datasource="intradb">
      SELECT
      FRS_METER_READ_DATE,
      --isnull(FRS_METER_MAKEUP_CCF,0) - isnull(FRS_METER_BLOWDOWN_CCF,0) + isnull(FRS_METER_LOSS_CCF,0) as FRS_LOSS,
      --isnull(FRS_METER_BLOWDOWN_CCF,0) - isnull(FRS_METER_MAKEUP_CCF,0) - isnull(FRS_METER_LOSS_CCF,0) as HandleAsSewer
      isnull(FRS_METER_SEWER_CCF,0) as FRS_METER_CONSUMPTION_X
      --isnull(FRS_METER_INCOMING_CCF,0) as FRS_METER_INCOMING_CCF
      FROM CS_FRS_METER_READINGS
      WHERE 1=1
      AND FRS_METER_ACCT_NUM = '#url.account_num#' 
      AND FRS_METER_READ_DATE BETWEEN 
      '#dateformat(dateadd("d", -14, url.SERV_TO_DATE),"mm/dd/yyyy")# 00:00:00' and
      '#dateformat(dateadd("d", +18, url.SERV_TO_DATE),"mm/dd/yyyy")# 23:59:59'
      order by FRS_METER_READ_DATE desc
  </cfquery>
  <cfdump var="#q_meter_readings#" label="q_meter_readings"><br>
</cfif>