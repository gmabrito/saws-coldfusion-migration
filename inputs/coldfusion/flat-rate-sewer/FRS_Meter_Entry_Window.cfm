<cfset objdbfunction = createobject('component','Intranet.apps.CustServ.FRS.CFCs.FRSobjects')>

<cfinvoke component="Intranet.apps.CustServ.FRS.CFCs.FRSobjects" method="getActiveMeters" returnvariable="getActiveMetersRet">
    <cfinvokeargument name="ACCTNUM" value="#url.account_num#"/>
    <cfinvokeargument name="DEACTIVATED" value="#url.sawsstartdate#"/>
</cfinvoke>

<cfset myFormId = "ReadingCRUD#left(url.account_num,9)##url.billrecid#">

<cfif session.user_id eq "goberlag">
    frs_meter_entry_window.cfm<br>
    <!--- <cfdump var="#getSAWSbillingRet#" label="getSAWSbillingRet"><br> --->
</cfif>

<cfform name="#myFormId#" style="margin:1em;">
    <cfinput type="hidden" name="account_num" value="#url.account_num#">
    <cfinput type="hidden" name="BillRecId" value="#url.BillRecId#">
    <cfinput type="hidden" name="FRS_METER_COUNT" value="#getActiveMetersRet.recordcount#">

	<div>
	    <label for="FRSreaddate">Reading Date:</label>
	    <input type="date" name="FRSreaddate" id="FRSreaddate" value="<cfoutput>#dateformat(url.billingdate,"yyyy-mm-dd")#</cfoutput>" required
	        tabindex="1" style="margin-right:1em;">
	
	    <label for="FRSsawsdate">Billing Date:</label>
	    <input type="date" name="FRSsawsdate" id="FRSsawsdate" value="<cfoutput>#dateformat(url.billingdate,"yyyy-mm-dd")#</cfoutput>" required
	        tabindex="2"style="margin-right:1em;">
	
	    <cfoutput>
	        <img src="images/memo_edit.jpg" alt="Memos" width="18" height="18"
	            onClick="javascript:ColdFusion.Window.create('BillingMemo#url.BillRecId#', 'Account Memo',
	            'modules/FRSMemoWindow.cfm?appName=#listlast(cgi.script_name,'/')#&recid=#url.BillRecId#&tag=#url.account_num#',
	            {refreshOnShow:true,closable:true,center:true,modal:false,width:510,height:350,_cf_refreshOnShow:true});">
	    </cfoutput>
	</div>

    <table cellpadding="2" cellspacing="2" border="0" style="margin-top:1em;">
        <!---
        <tr height="50px" valign="bottom">
            <td>Reading Date: </td>
            <td>
                <cfinput type="datefield?" name="FRSreaddate" value="#url.billingdate#" size="8" tabindex="1"
                    validate="date" validateat="onblur" message="Enter a valid date">
            </td>
            <td>Billing Date:</td>
            <td>
                <cfinput name="FRSsawsdate" type="datefield?" validate="date" value="#url.billingdate#" size="8" tabindex="2">
            </td>
            <td>
                <cfoutput>
                    <img src="images/memo_edit.jpg" alt="Memos" width="18" height="18" onClick="javascript:ColdFusion.Window.create('BillingMemo#url.BillRecId#',
       				 'Account Memo',
					 'modules/FRSMemoWindow.cfm?appName=#listlast(cgi.SCRIPT_NAME,'/')#&recid=#url.BillRecId#&tag=#url.account_num#',
						 {refreshOnShow:true,closable:true,center:true,
                         modal:false,width:510,height:350,_cf_refreshOnShow:true});">
                </cfoutput>
            </td>
        </tr>
        --->

        <!---
        <tr>
            <td colspan="4"><hr></td>
        </tr>
        --->

        <tr style="background-color:lightgrey;">
            <th style="text-align:left;">Serial No.</th>
            <th style="text-align:left;">Meter Function</th>
            <th style="text-align:left;">Reading</th>
            <th style="text-align:right;">Last Reading</th>
        </tr>

        <!---
        <tr>
            <td><hr /></td>
            <td><hr /></td>
            <td><hr /></td>
            <td><hr /></td>
        </tr>
        --->

        <cfset iter = 0>
        <cfoutput query="getActiveMetersRet">
            <cfset iter = iter + 1> 
            <tr>
                <td>
                    #FRS_METER_SERIAL#
                    <cfinput name="FRSserial#iter#" value="#FRS_METER_SERIAL#" type="hidden">
                </td>
                <td>
                    #FRS_METER_FUNCTION#
                </td>
                <td>
                    <cfinput type="text" name="FRSreading#iter#" onChange="javascript:submitReadingForm('#myFormId#');">
                </td>
                <td align="right">
                    <!--- #numberformat(objdbfunction.getLastMeterReadings("#url.account_num#","#FRS_METER_SERIAL#").FRS_METER_READING,"999")# --->
                    #numberformat(objdbfunction.getLastMeterReadings("#url.account_num#","#FRS_METER_SERIAL#").FRS_METER_READING)#
                </td>
            </tr>
        </cfoutput>
        
        <tr><td></td></tr>
        <tr>
            <td></td>
            <td></td>
            <td colspan="2">
                <!--- validate="submitonce" only valid on a type="submit" control --->
                <cfinput type="button" name="submit" value="Submit Readings"
                    onClick="javascript:submitReadingForm('#myFormId#');
                    ColdFusion.navigate('FRS_MeterReadings_window.cfm?account_num=#url.account_num#&BillRecId=#url.BillRecId#&sawsstartdate=#url.sawsstartdate#&sawsenddate=#url.sawsenddate#&billingDate=#url.billingDate#','ML#left(url.account_num,9)#');
                    ColdFusion.Window.destroy('meterEntry#left(url.account_num,9)#');">
            </td>
        </tr>
    </table>
</cfform>