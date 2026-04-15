
<cfset objdbfunction = createobject('component','Intranet.apps.CustServ.FRS.CFCs.FRSobjects')>
<cfinvoke 
 component="Intranet.apps.CustServ.FRS.CFCs.FRSobjects"
 method="getActiveMeters"
 returnvariable="getActiveMetersRet">
    <cfinvokeargument name="ACCTNUM" value="#url.account_num#"/>
    <cfinvokeargument name="DEACTIVATED" value=""/>
</cfinvoke>


<cflayout name="ImageExplorer" type="hbox" >
 <cflayoutarea name="BillingHistory" >
   <cfpod title="#url.account_num# Consumption" width="400" height="450">
    
  <table width="100%">


    
<cfloop query="getActiveMetersRet">
		<cfoutput>
        
        <tr>
        <td style="font-size:14px; cursor:pointer;" onmouseover="this.className='menuon';" onmouseout="this.className='menuoff';"
         onclick="javascript:ColdFusion.Window.create('meterInfo#getActiveMetersRet.rec_id#',
       					 'Edit Meter - #getActiveMetersRet.FRS_METER_SERIAL#',
                         					 'FRS_Meter_Info_window.cfm?acctnum=#getActiveMetersRet.FRS_METER_ACCOUNT#&serial=#getActiveMetersRet.FRS_METER_SERIAL#&rec_id=#getActiveMetersRet.rec_id#',
						 {refreshOnShow:true,closable:true,center:true,
                         modal:false,width:400,height:500,_cf_refreshOnShow:true});" style="color:blue;" >
        #getActiveMetersRet.FRS_METER_SERIAL#</td>
          <td align="right"><cfoutput>#UCASE(getActiveMetersRet.FRS_METER_FUNCTION)# CCF</cfoutput></td>
        </tr>
        </cfoutput>
</cfloop>
</table>
</cfpod>

</cflayoutarea>
</cflayout>
