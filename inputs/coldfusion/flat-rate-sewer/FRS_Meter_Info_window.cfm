<!--- <cfparam name="url.caller" default="http://"> --->

<cfset objdbfunction = createobject("component", "intranet.apps.custserv.frs.cfcs.frsobjects")>

<cfinvoke component="intranet.apps.custserv.frs.cfcs.frsobjects" method="getActiveMeters" returnvariable="getActiveMetersRet">
   <cfinvokeargument name="acctnum" value="#url.acctnum#">
   <cfinvokeargument name="serial" value="#URLDecode(url.serial)#">
</cfinvoke>
<!---
<cfif session.user_id eq "goberlag">
   <cfdump var="#getActiveMetersRet#" label="getActiveMetersRet">
</cfif>
--->

<cfif getActiveMetersRet.recordcount eq 1>
   <!---
   <cfset callerfmt = replace(url.caller,'|','&')><br />
   #callerfmt#
   --->

   <!--- <cflayout name="MW#getActiveMetersRet.rec_id#" type="tab"> --->

   <!--- <cflayoutarea <!---name="MR#getActiveMetersRet.rec_id#"---> title="Readings for Meter">--->
   <!--- <cfset allReadings=objdbfunction.getMeterReadings(url.acctnum,url.serial)>
   <hr />
   <table width="90%">
   <cfoutput query="allReadings" maxrows="12">
   <tr><td>#dateformat(FRS_METER_READ_DATE,'mm/dd/yyyy')#</td><td align="right">#FRS_METER_READING#</td><td align="right">#FRS_METER_CONSUMPTION#</td><td>X</td></tr>
   </cfoutput>
   </table>
   --->

   <cfinclude template="FRSmeterReadingsGridwindow.cfm">
</cfif>
<!---</cflayoutarea>--->       


<!---<cflayoutarea <!---name="MI#getActiveMetersRet.rec_id#" --->title="Meter Information" >--->

<!---     
	 <cfoutput>   <table width="80%" align="center">
         <tr height="100px">
         	<Td>Serial No.:</Td><td>#getActiveMetersRet.FRS_METER_SERIAL#</td>
            <Td>Active Date:</Td><td>#dateformat(getActiveMetersRet.FRS_METER_DATE_ACTIVE,"mm/dd/yyyy")#</td>
         </tr>
         <tr><td></td><td></td><td>Base Reading</td><td>#getActiveMetersRet.FRS_METER_BASE_READING#</td></tr>
         <tr><td></td><td></td><td>Final Reading</td><td>#getActiveMetersRet.FRS_METER_FINAL_READING#</td></tr>
         <tr><td></td><td></td><td></td><td>&nbsp;</td></tr>
         <tr>
         <td colspan="4" height="1px" bgcolor="grey">
         </td>
         </tr>
         <tr> 
         <td>Units:</td><td colspan="3">#getActiveMetersRet.FRS_METER_UOM#</td>
         </tr>
         <tr>
         <td>Measures:</td><td colspan="3">#getActiveMetersRet.FRS_METER_FUNCTION#</td>
         </tr>
         <tr>
         <td>Purpose:</td><td colspan="3">#getActiveMetersRet.FRS_METER_COMMENT#</td>
         </tr>
         
         </table>
         </cfoutput>
         <cfform name="FRSMeterInfoA#url.rec_id#">
         	<cfinput type="hidden" name="recToDeactivate" value="#url.rec_id#">
            <cfinput type="checkbox" name="deactivate">Deactivate Meter<br />
         	<cfinput type="button" name="FRS_Meter_Active" value="Update"  onClick="javascript:DeactivateMeter('FRSMeterInfo#url.rec_id#');">
            
            <!---ColdFusion.navigate('#callerfmt#','MeterList#getActiveMetersRet.FRS_METER_ACCOUNT#');--->
            
         	<cfinput type="button" name="FRS_Meter_Active" value="Close" onMouseUp="javascript:ColdFusion.Window.destroy('meterInfo#url.rec_id#');">
         	<cfinput type="button" name="Memo" value="Edit Memo"onClick="javascript:ColdFusion.Window.create('Memo#url.rec_id#',
       				 'Memo',
					 'modules/FRSMemoWindow.cfm?appName=#listlast(cgi.SCRIPT_NAME,'/')#&recid=#url.rec_id#',
						 {refreshOnShow:true,closable:true,center:true,
                         modal:false,width:510,height:350,_cf_refreshOnShow:true});">
        </cfform>
<!---</cflayoutarea>--->
  
<!---</cflayout>--->
		 <cfelse>
         <cfoutput>
         Account #url.acctnum# meter serial #url.serial# not found
 
         </cfoutput>
         </CFIF>
		 <hr />		         
--->