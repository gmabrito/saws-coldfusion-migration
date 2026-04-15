<cfif session.user_id eq "goberlag">
    frs_maintwindow.cfm<br>
</cfif>

<cfset objdbfunction = createobject('component','Intranet.apps.CustServ.FRS.CFCs.FRSobjects')>

<cfparam name="url.account_num" default="000099019-0099020-0001">

<cfset lastAssessmentDate = objdbfunction.getFRSassessments('#url.account_num#').FRS_BILLING_ASSESSMENT_DATE/> 

<cfinvoke component="Intranet.apps.CustServ.FRS.CFCs.FRSobjects" method="getSAWSbilling" returnvariable="getSAWSbillingIn">
    <cfinvokeargument name="FRS_ACCOUNT_NUM" value="#url.account_num#">
</cfinvoke>
<cfif session.user_id eq "goberlag">
    <!--- <cfdump var="#getSAWSbillingIn#" label="VW_CS_FRS_BILLED_ACTUAL getSAWSbillingIn"><br> --->
</cfif>

<cfquery name="getSAWSbillingRet" dbtype="query" maxrows="24">
    select *
    from getSAWSbillingIn
    <!---
    <cfif isDate(lastAssessmentDate)>
      where serv_from_date >= '#dateformat(dateadd("m",-2,lastAssessmentDate),"mm/dd/yyyy")#'
    </cfif>
    --->
</cfquery>
<cfif session.user_id eq "goberlag">
    <!--- <cfdump var="#getSAWSbillingRet#" label="VW_CS_FRS_BILLED_ACTUAL getSAWSbillingRet"><br> --->
</cfif>

<cfset irrigation_flag = false>

<cflayout name="ImageExplorer" type="hbox">
   <cflayoutarea name="BillingHistory">
      <cfpod title="#url.account_num# Consumption" width="400" height="700" name="pod#left(url.account_num,9)#">
         Next Assessment Due: <strong><cfoutput>#dateformat(getSAWSbillingRet.FRS_PLAN_NEXT_ASSESSMENT_DATE,"mm/dd/yyyy")#</cfoutput></strong><br>
      
         <table width="100%" cellpadding="1" cellspacing="1" border="1" style="border-collapse:collapse;">
            <tr align="right" valign="bottom" style="background-color:lightgrey;">
               <td align="left">Billing Date</td>
               <td>Water CCF</td>
               <td>Irrig CCF</td>
               <td>Incoming CCF</td>
               <!--- <td>Billed Sewer CCF</td> --->
               <td>Sewer CCF</td>
               <td>Sewer Charge</td>
            </tr>

			<cfoutput query="getSAWSbillingRet">
                <cfinvoke component="Intranet.apps.CustServ.FRS.CFCs.FRSobjects" method="getMeterReadings" returnvariable="getMeterReadingsRet">
                  <cfinvokeargument name="acctnum" value="#url.account_num#"/>
                  <cfinvokeargument name="serial" value=""/>
                  <cfinvokeargument name="sawsstartdate" value="#dateformat(dateadd('d', -14, getSAWSbillingRet.serv_to_date),"mm/dd/yyyy")#">
                  <cfinvokeargument name="sawsenddate" value="#dateformat(dateadd('d', +14, getSAWSbillingRet.serv_to_date),"mm/dd/yyyy")#">
                </cfinvoke>

                <cfif session.user_id eq "goberlagx">
                    <cfdump var="#getMeterReadingsRet#"><br>
                </cfif>

               <cfset incoming_ccf = int(water_serv_ccf_cons) + int(irrig_ccf_cons)>

                <cfif irrig_ccf_cons gt 0>
                    <cfset irrigation_flag = true>
               </cfif>

               <cfset rdate = dateformat(getSAWSbillingRet.billing_date,"mm/dd/yyyy")>

               <tr align="right" onmouseover="this.className='menuon';" onmouseout="this.className='menuoff';" onmousedown="this.className='clicked';"
                  onclick="javascript:ColdFusion.navigate('FRS_MeterReadings_window.cfm?account_num=#url.account_num#&BillRecId=#getSAWSbillingRet.REC_ID#&sawsstartdate=#getSAWSbillingRet.serv_from_date#&sawsenddate=#getSAWSbillingRet.serv_to_date#&billingDate=#dateformat(getSAWSbillingRet.billing_date,'mm/dd/yyyy')#','ML#left(url.account_num,9)#');">

                  <td align="left">
                     #rdate#<cfif getMeterReadingsRet.recordcount eq 0><span style="color:red;">*</span></cfif>
                  </td>
                  <!--- <td>#rdate#</td> --->

                  <td>#numberformat(water_serv_ccf_cons)#</td>
                  <td>#numberformat(irrig_ccf_cons)#</td>
                  <td><cfif irrig_ccf_cons gt 0><sup>^</sup></cfif>#numberformat(incoming_ccf)#</td>

                  <td>#numberformat(int(SEWER_CCF_CONS))#</td>
                  <td>#dollarformat(FRS_BILLING_BILLED_CHARGE)#</td>
               </tr>
            </cfoutput>
         </table>

         Missing Readings<span style="color:red;">*</span><br> 
         Includes irrigation<sup>^</sup>
      </cfpod>
   </cflayoutarea>

   <cflayoutarea name="Orchid1Image">
      <cfpod name="ML#left(url.account_num,9)#" title="Active Meters" width="700" height="700">
         <h1>Select Billing dates on left to submit reading</h1>
      </cfpod>
    </cflayoutarea>

</cflayout>

<cfif irrigation_flag eq true and session.user_id neq "goberlag">
    <cfmail to="testuser@example.com" from="#cgi.server_name# <testuser@example.com>"
        subject="cfalert irrigation #cgi.script_name# #datetimeformat(now(), "yyyy-mm-dd HH:nn:ss")#" type="html">
        #cgi.http_host##cgi.http_url#<br><br>
        #lcase(cgi.cf_template_path)#<br><br>
        <cfdump var="#url#" label="url"><br>
        <cfdump var="#form#" label="form"><br>
        <cfdump var="#session#" label="session"><br>
        <cfdump var="#cgi#" label="cgi"><br>
    </cfmail>
</cfif>