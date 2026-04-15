
<h1>FRS System Rate Management</h1>
<hr>
<cfparam name="MinCharges" default="0,0,0,0,0,0,0,0,0,0,0,0" type="string">
<cfparam name="TierValues" default="0,0" type="string">
<cfparam name="TierRates" default="0,0" type="string">
<cfparam name="form.FRS_RATE_TIER_NUM" default="1" type="numeric">
<cfparam name="form.FRS_RATE_EFFECTIVE_DATE" default="" >
<cfparam name="form.FRS_RATE_IOCL" default="I" >
<cfset objdbfunction = createobject('component','Intranet.apps.CustServ.FRS.CFCs.FRSobjects')>

<cfif isDefined("submit")>

		<cfset updList = "#RATE1#,#RATE2#,#RATE3#,#RATE4#,#RATE5#,#RATE6#,#RATE7#,#RATE8#,#RATE9#,#RATE10#,#RATE11#">
		
        <cfset MinCharges = objdbfunction.ApplyCtrlCoreValue("FRS_SWR_AVAIL_IOCL#FRS_RATE_IOCL#",FRS_RATE_EFFECTIVE_DATE,updList).FRS_CTRL_VALUE>
        <cfset TierValues = objdbfunction.ApplyCtrlCoreValue("FRS_BILL_RATE_TIERS",FRS_RATE_EFFECTIVE_DATE,"#FRS_BASE_CCF#,#FRS_BASE_CCF#").FRS_CTRL_VALUE>
        <cfset TierRates = objdbfunction.ApplyCtrlCoreValue("FRS_BILL_RATE_OCL#FRS_RATE_IOCL#",FRS_RATE_EFFECTIVE_DATE,"#FRS_RATE#,#FRS_RATE#").FRS_CTRL_VALUE>
<cfelse>
		<cfset FRS_RATE_EFFECTIVE_DATE = "#dateformat(form.FRS_RATE_EFFECTIVE_DATE,'mm/dd/yyyy')#">
        <cfset FRS_RATE_IOCL = form.FRS_RATE_IOCL>
        
        <cfset MinCharges = objdbfunction.getCtrlCoreValue("FRS_SWR_AVAIL_IOCL#FRS_RATE_IOCL#",FRS_RATE_EFFECTIVE_DATE).FRS_CTRL_VALUE>
        <cfset TierValues = objdbfunction.getCtrlCoreValue("FRS_BILL_RATE_TIERS",FRS_RATE_EFFECTIVE_DATE).FRS_CTRL_VALUE>
        <cfset TierRates = objdbfunction.getCtrlCoreValue("FRS_BILL_RATE_OCL#FRS_RATE_IOCL#",FRS_RATE_EFFECTIVE_DATE).FRS_CTRL_VALUE>
        
</cfif>

<cfset FRS_RATE_EFFECTIVE_DATE = objdbfunction.getCtrlCoreValue("FRS_BILL_RATE_OCL#FRS_RATE_IOCL#",FRS_RATE_EFFECTIVE_DATE).FRS_CTRL_EFFECTIVE_DATE>
<cfset QRY_ALLDATES = objdbfunction.getCtrlCoreValue("FRS_BILL_RATE_OCL#FRS_RATE_IOCL#","")>
<cfset METERSIZES = objdbfunction.getListByKey("FRS_METER_SIZES").FRS_CTRL_DISP>

<cfform name="RateUpdate" method="post" action="">
<table align="center" width="98%" >
<tr>
    <td>Effective Date</td>
    <td>Tier No.</td>
    <td>ICL/OCL</td>
    <td>Tier Base CCF</td>
    <td>Tier Rate</td>
    <td>
        <div onclick="javascript:ColdFusion.Window.create('newRateDate',
       		'Add Effective Date','FRS_RateAddWindow.cfm',
			{refreshOnShow:true,closable:true,center:true,modal:true,width:300,height:200,_cf_refreshOnShow:true});" 
            style="font-size:9; cursor:pointer; color:blue;">
            Add New Date
        </div>
    </td>
</tr>

<tr>
    <td>
        <cfselect name="FRS_RATE_EFFECTIVE_DATE" query="QRY_ALLDATES" display="FRS_CTRL_EFFECTIVE_DATE" value="FRS_CTRL_EFFECTIVE_DATE"
            selected="#FRS_RATE_EFFECTIVE_DATE#" onChange="javascript:refreshPage('RateUpdate');"/>
    </td>
</tr>

<!---
    <td>
        <cfinput name="FRS_RATE_EFFECTIVE_DATE" type="datefield?" size="8" value="#dateformat(FRS_RATE_EFFECTIVE_DATE,'mm/dd/yyyy')#">
    </td>
--->

<tr>
<cfinput type="hidden" name="TierValues" value="#TierValues#"/>
<td><cfselect name="FRS_RATE_TIER_NUM" onChange="javascript:refreshPage('RateUpdate');">
	<option value="1" <cfif FRS_RATE_TIER_NUM EQ "1">selected="selected"</cfif>>1</option>
    <option value="2" <cfif FRS_RATE_TIER_NUM EQ "2">selected="selected"</cfif>>2</option>
    </cfselect>
</td>

<td><cfselect name="FRS_RATE_IOCL" onChange="javascript:refreshPage('RateUpdate');">
	<option value="I" <cfif FRS_RATE_IOCL EQ "I">selected="selected"</cfif>>ICL</option>
    <option value="O" <cfif FRS_RATE_IOCL EQ "O">selected="selected"</cfif>>OCL</option>
    </cfselect>
</td>

<td><cfinput name="FRS_BASE_CCF" size="8" value="#listgetat(TierValues,form.FRS_RATE_TIER_NUM)#"></td>

<td><cfinput name="FRS_RATE" size="8" value="#listgetat(TierRates,FRS_RATE_TIER_NUM)#"></td>    
<td></td>
</tr>
<tr><td colspan="6">&nbsp;</td></tr><tr><td colspan="6">&nbsp;</td></tr><tr><td colspan="6">&nbsp;</td></tr>

</table>
<table width="95%">
<tr>
<td align="left" colspan="6"><strong>Minimum Charge by Sewer Availability</strong></td>
</tr>
<tr>
<cfloop from="1" to="#listlen(METERSIZES)#" index="a">
<td><cfoutput>#listgetat(METERSIZES,a)#"</cfoutput>
</td>
</cfloop>
</tr>
<tr>
<cfloop from="1" to="#listlen(METERSIZES)#" index="a">
<td><cfinput name="rate#a#" size="2" value="#listgetat(MinCharges,a)#" align="right">
</td>
</cfloop>
</tr>
</table>
</tr>
<tr align="right">
<cfoutput><td colspan="5" align="right"><cfinput type="submit" name="submit" value="Apply"/></td></cfoutput>
</tr>
</table></cfform>
