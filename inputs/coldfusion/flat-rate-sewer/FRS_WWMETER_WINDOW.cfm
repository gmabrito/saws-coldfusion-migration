<cfset objdbfunction = createobject('component','Intranet.apps.CustServ.FRS.CFCs.FRSobjects')>

<cfset wwRptRet = objdbfunction.getActiveMeters(url.account_num,"",dateformat(now()))/>

<cfloop query="wwRptRet">

	<cfif FRS_METER_FUNCTION eq "sewer">
        <cfparam name="FRS_WW_TYPE" default="#wwRptRet.FRS_WW_TYPE#">
        <cfparam name="FRS_WW_INSTALL_DATE" default="#wwRptRet.FRS_WW_INSTALL_DATE#">
        <cfparam name="FRS_WW_CALIBRATES" default="#wwRptRet.FRS_WW_CALIBRATES#">
        
        <cfif isDefined("submit")>
    		<cfset putwwMeterInfo = objdbfunction.putWWmeter(form.rec_id,form.FRS_WW_TYPE,form.FRS_WW_CALIBRATES,form.FRS_WW_INSTALL_DATE)/>
			<h3>Calibration Updated! - Please close</h3>
			
        <cfelse>
        
        <cfform name="form1" method="post" action="">
        <table>
            <cfinput type="hidden" name="rec_id" value="#rec_id#"/>
            
          <tr><td>Serial No.</td><td><cfinput type="text" name="FRS_METER_SERIAL" readonly="readonly" value="#FRS_METER_SERIAL#"></td></tr>
          <tr>
            <td>Type of Monitor</td><td>  <cfinput type="text" name="FRS_WW_TYPE" value="#FRS_WW_TYPE#"></td></tr>
           <tr>
             <td>Install Date</td>
             <td>  <cfinput type="text" name="FRS_WW_INSTALL_DATE" value="#FRS_WW_INSTALL_DATE#"></td></tr>
           <tr>
             <td>Calibrates</td><td>    <cfinput type="text" name="FRS_WW_CALIBRATES" value="#FRS_WW_CALIBRATES#"></td></tr>
        
           <tr><td></td><td><cfinput type="submit" name="submit" value="Update"></td></tr>
        </table>
        </cfform>
        </cfif>    
	</cfif>
    
</cfloop>