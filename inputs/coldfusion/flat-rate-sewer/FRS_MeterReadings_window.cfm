<cfif session.user_id eq "goberlag">
    frs_meterreadings_window.cfm<br>
</cfif>

<cfset objdbfunction = createobject("component", "intranet.apps.custserv.frs.cfcs.frsobjects")>

<cfinvoke component="Intranet.apps.CustServ.FRS.CFCs.FRSobjects"  method="getActiveMeters" returnvariable="getActiveMetersRet">
    <cfinvokeargument name="ACCTNUM" value="#url.account_num#">
    <cfinvokeargument name="DEACTIVATED" value="#url.sawsstartdate#">
</cfinvoke>
<cfif session.user_id eq "goberlag">
    <!--- <cfdump var="#getActiveMetersRet#" label="getActiveMetersRet"><br> --->
</cfif>

<cfoutput>
    BillingDate: <cfoutput>#url.billingdate#</cfoutput><br>
    Readings: #url.sawsstartdate# to #url.sawsenddate#<br>
    MeterRange: <cfoutput>#dateformat(dateadd("d", -14, url.billingdate),"mm/dd/yyyy")#</cfoutput> to
                <cfoutput>#dateformat(dateadd("d", +14, url.billingdate),"mm/dd/yyyy")#</cfoutput> (+/- 14 days)
</cfoutput><br><br>

<table>
    <tr>
        <cfoutput>
            <td onclick="javascript:ColdFusion.Window.create('meterEntry#left(url.account_num,9)##url.BillRecId#',
                'Readings - #url.account_num#',
                'FRS_Meter_Entry_Window.cfm?account_num=#url.account_num#&BillRecId=#url.BillRecId#&sawsstartdate=#url.sawsstartdate#&billingdate=#url.billingdate#&sawsenddate=#url.sawsenddate#',
                {refreshOnShow:true,closable:true,center:true,modal:false,width:600,height:700,_cf_refreshOnShow:true});">
                <button>Readings</button>
            </td>
        </cfoutput>
    </tr>
</table>

<table width="100%" border="1" style="margin-top:1em; border-collapse:collapse;">
    <tr style="background-color:lightgrey;">
        <td></td>
        <td>Serial No.</td>
        <td align="left">ReadingDate</td>
        <td align="right">Reading</td>
        <td align="right">Consumption</td>
        <td>Function</td>
        <td align="right">CCF</td>
        <td align="right">Pct Ch</td>
        <td align="right">[]</td>
    </tr>
    
    <cfset total_consumption_gal = 0>
    <cfset total_sewer_ccf = 0>

    <cfloop query="getActiveMetersRet">
        <cfset var.serial = replace(getActiveMetersRet.FRS_METER_SERIAL,"##","####","all")/>
        <!---
    	<cfoutput>
            <tr>
                <!---
                <td style="font-size:14px; cursor:pointer;" onmouseover="this.className='menuon';" onmouseout="this.className='menuoff';"
                    onclick="javascript:ColdFusion.Window.create('meterInfoa#getActiveMetersRet.rec_id#',
                	'Edit Meter - #getActiveMetersRet.FRS_METER_SERIAL#',
                    'FRS_Meter_Info_window.cfm?acctnum=#getActiveMetersRet.FRS_METER_ACCOUNT#&serial=#var.serial#&rec_id=#getActiveMetersRet.rec_id#',
                	{refreshOnShow:true,initshow:true,closable:true,center:true,modal:false,width:600,height:800,_cf_refreshOnShow:true});"
                    style="color:blue;">
                    <button>Edit</button>
                </td>
                --->

                <!--- <td align="left">#getActiveMetersRet.FRS_METER_SERIAL#</td> --->
                <td align="left">Date</td>
                <td align="right">Reading</td>
                <td align="right">Consumption</td>
                <!--- <td align="right"><cfoutput>#UCASE(getActiveMetersRet.FRS_METER_FUNCTION)# CCF</cfoutput></td> --->
                <td align="right">Type</td>
                <td align="right">CCF</td>
                <td align="right">Pct Ch</td>
                <td align="right">[]</td>
            </tr>
        </cfoutput>
        --->

        <!---
        <tr>
            <td colspan="6" align="center"><hr></td>
        </tr>
        --->

        <cfinvoke component="Intranet.apps.CustServ.FRS.CFCs.FRSobjects" method="getMeterReadings" returnvariable="getMeterReadingsRet">
            <cfinvokeargument name="acctnum" value="#url.account_num#">
            <cfinvokeargument name="serial" value="#getActiveMetersRet.FRS_METER_SERIAL#">
            <cfinvokeargument name="sawsstartdate" value="#dateformat(dateadd('d', -14, url.billingdate),'mm/dd/yyyy')#">
            <cfinvokeargument name="sawsenddate" value="#dateformat(dateadd('d', +14, url.billingdate),'mm/dd/yyyy')#">
        </cfinvoke>

        <cfif session.user_id eq "goberlag">
            <!--- <cfdump var="#getMeterReadingsRet#" label="getMeterReadingsRet"><br> --->
        </cfif>

        <cfif getMeterReadingsRet.recordcount gt 0>
			<cfoutput query="getMeterReadingsRet">
                <cfset MeterReadingMemo =
                    objdbfunction.getMemo(listlast(cgi.script_name,'/'),getMeterReadingsRet.rec_id).recordcount gt 0 ? true : false>
                <cfset total_consumption_gal = total_consumption_gal + frs_meter_consumption>
                
                <tr onmouseover="this.className='menuon';" onmouseout="this.className='menuoff';" >
                    <td onmouseover="this.className='menuon';" onmouseout="this.className='menuoff';"
                        onclick="javascript:ColdFusion.Window.create('meterInfoa#getActiveMetersRet.rec_id#',
                        'Edit Meter - #getActiveMetersRet.FRS_METER_SERIAL#',
                        'FRS_Meter_Info_window.cfm?acctnum=#getActiveMetersRet.FRS_METER_ACCOUNT#&serial=#var.serial#&rec_id=#getActiveMetersRet.rec_id#',
                        {refreshOnShow:true,initshow:true,closable:true,center:true,modal:false,width:600,height:800,_cf_refreshOnShow:true});"
                        style="color:blue;">
                        <button>Edit</button>
                    </td>

                    <td align="left">#getActiveMetersRet.FRS_METER_SERIAL#</td>
                    <td align="left">#dateformat(FRS_METER_READ_DATE,"mm/dd/yyyy")#</td>
                    <td align="right">#numberformat(FRS_METER_READING)#</td>
                    <td align="right">#numberformat(FRS_METER_CONSUMPTION)#</td>

                    <cfswitch expression="#getActiveMetersRet.FRS_METER_FUNCTION#">
                        <cfcase value="MAKEUP">
                            <cfset total_sewer_ccf = total_sewer_ccf + frs_meter_makeup_ccf>
                            <td>MAKEUP</td>
                            <td align="right">#numberformat(FRS_METER_MAKEUP_CCF,'9.99')#</td>
                        </cfcase>
                        <cfcase value="BLOWDOWN">
                            <cfset total_sewer_ccf = total_sewer_ccf + frs_meter_blowdown_ccf>
                            <td>BLOWDOWN</td>
                            <td align="right">#numberformat(FRS_METER_BLOWDOWN_CCF,'9.99')#</td>
                        </cfcase>
                        <cfcase value="LOSS">
                            <cfset total_sewer_ccf = total_sewer_ccf + frs_meter_loss_ccf>
                            <td>LOSS</td>
                            <td align="right">#numberformat(FRS_METER_LOSS_CCF,'9.99')#</td>
                        </cfcase>
                        <cfcase value="SEWER">
                            <cfset total_sewer_ccf = total_sewer_ccf + frs_meter_sewer_ccf>
                            <td>SEWER</td>
                            <td align="right">#numberformat(FRS_METER_SEWER_CCF,'9.99')#</td>
                        </cfcase>
                        <cfcase value="INCOMING">
                            <cfset total_sewer_ccf = total_sewer_ccf + frs_meter_incoming_ccf>
                            <td>INCOMING</td>
                            <td align="right">#numberformat(FRS_METER_INCOMING_CCF,'9.99')#</td>
                        </cfcase>
                        <cfdefaultcase>
                            <cfthrow detail="meter function invalid #getActiveMetersRet.FRS_METER_FUNCTION#">
                        </cfdefaultcase>
                    </cfswitch>

                    <cfif FRS_METER_PCT_CHANGE gt 100 or FRS_METER_PCT_CHANGE lt -100>
                        <cfset lncolor = "red">
                    <cfelse>
                        <cfset lncolor = "blue">
                    </cfif>

                    <td align="right" style="color:#lncolor#;">#numberformat(FRS_METER_PCT_CHANGE,'9.99')#</td>

                    <td>
                        <cfif MeterReadingMemo eq true>*</cfif>
                    </td>
                </tr>
            </cfoutput>
        </cfif>
       
        <!---
        <tr height="30px">
            <td colspan="6" align="center">&nbsp;</td>
        </tr>
        --->
    </cfloop>

    <!---
    <tr style="background-color:lightgrey;">
        <td></td>
        <td>Total</td>
        <td align="left"></td>
        <td align="right"></td>
        <td align="right"><cfoutput>#numberformat(total_consumption_gal)#</cfoutput></td>
        <td></td>
        <td align="right"><cfoutput>#decimalformat(total_sewer_ccf)#</cfoutput></td>
        <td align="right"></td>
        <td align="right"></td>
    </tr>
    --->
</table><br>

<cfif session.user_id eq "goberlagx">
    <cfset total_consumption_ccf = total_consumption_gal / 748.1>
    <cfoutput>
    total_consumption_gal=#numberformat(total_consumption_gal)#<br>
    total_consumption_ccf=#decimalformat(total_consumption_ccf)#<br>
    total_sewer_ccf=#decimalformat(total_sewer_ccf)#<br>
    </cfoutput>
</cfif>