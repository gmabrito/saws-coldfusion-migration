<!---
<cfif session.user_id neq "goberlag">
	Unavailable due to bug 07/14/2025
	<cfabort>
</cfif>
--->

<cfif session.user_id eq "goberlag">
	frsMeterReadingsGridWindow.cfm<br>
	<!--- <cfoutput>#getFileFromPath(cgi.script_name)#</cfoutput> --->
</cfif>

<cfform>
	<cfgrid name="MRG#url.rec_id#" 
		bind='cfc:CFCs.FRSobjects.getMeterReadingsGrid({cfgridpage}, {cfgridpagesize}, {cfgridsortcolumn}, {cfgridsortdirection}, "#url.acctnum#", "#url.serial#")'
		onchange='cfc:CFCs.FRSobjects.editMeterReadings({cfgridaction}, {cfgridrow}, {cfgridchanged}, "#url.acctnum#", "#url.serial#")'
		selectmode="edit" insert="yes" delete="yes" format="html" autowidth="true" height="700">
		<cfgridcolumn name="REC_ID" display="no">
		<cfgridcolumn name="FRS_METER_ACCT_NUM" display="no">
		<cfgridcolumn name="FRS_METER_SERIAL_NUM" display="no">
		<cfgridcolumn name="FRS_METER_READ_DATE" header="ReadDate" type="date">
		<cfgridcolumn name="FRS_METER_READING" header="Reading">
		<cfgridcolumn name="FRS_METER_CONSUMPTION" header="Consumption" select="no">
		<cfgridcolumn name="FRS_METER_PCT_CHANGE" header="PercentChg" select="no">
	</cfgrid>
</cfform>

<cfif session.user_id eq "goberlag">
	<!--- <cfoutput>#timeformat(now(), "HH:mm")#</cfoutput> --->
	<!--- <cfdump var="##"> --->
</cfif>