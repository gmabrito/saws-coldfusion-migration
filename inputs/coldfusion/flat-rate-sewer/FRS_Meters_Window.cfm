    <cfinvoke 
     component="Intranet.apps.CustServ.FRS.CFCs.FRSobjects"
     method="getActiveMeters"
     returnvariable="getActiveMetersRet">
        <cfinvokeargument name="ACCTNUM" value="#url.account_num#"/>
        <cfinvokeargument name="SAWSDATE" value="#url.sawsstartdate#"/>
    </cfinvoke>


Meter Serial No.<hr />
            <table width="100%">
            <cfoutput query="getActiveMetersRet">
            <tr onmouseover="this.className='menuon';" onmouseout="this.className='menuoff';"
             onclick="javascript:ColdFusion.navigate('FRS_METER_INFO_WINDOW.CFM?acctnum=#FRS_METER_ACCOUNT#&serial=#FRS_METER_SERIAL#','MeterInfo#FRS_METER_ACCOUNT#');
             javascript:ColdFusion.navigate('FRS_METERREADINGS_WINDOW.CFM?acctnum=#FRS_METER_ACCOUNT#&serial=#FRS_METER_SERIAL#&sawsstartdate=#url.sawsstartdate#&sawsenddate=#url.sawsenddate#','MeterReadings#FRS_METER_ACCOUNT#');" >
            <td>
            #FRS_METER_SERIAL# - #FRS_METER_FUNCTION#
            </td>
            </tr>
            </cfoutput>
            </table>