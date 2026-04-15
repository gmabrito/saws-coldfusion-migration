<cfset navTitle="Access Log">
<cfinclude template="FRS_Menu.cfm">
<cfif acl.FRS_USER_ACCESS_LEVEL gte 2>
<cfoutput>
<h1 align="center">Log Viewer - #listfirst(cgi.HTTP_HOST,".")#</h1><br />
</cfoutput>

<cfset logentries=objdbfunction.getAllAuditLog()>
<table width="95%" cellpadding="1">
<tr>
<td width="2%"></td><td>Date</td><td>Time</td><TD>Associate</TD><td>Description</td><!---<td>Activity</td>---></tr>
<cfoutput query="logentries" startrow="1" >
<tr height="1px">
<td width="2%"></td><td colspan="4" bgcolor="grey"></td></tr>
<tr>
<td width="2%"></td>
<td>#dateformat(FRS_ACTIVITY_TIMESTAMP,'mm/dd/yyyy')#</td><td> #timeformat(FRS_ACTIVITY_TIMESTAMP,'hh:mm tt')#</td><td>#objdbfunction.getEmployee(FRS_ACTIVITY_EMP_ID).EMP_FULL_NAME#</td><td>#FRS_ACTITITY_LOGENTRY#</td><!---<td>#FRS_ACTIVITY_APPID#</td>--->
</tr>
</cfoutput>
<tr height="1px">
<td width="2%"></td><td colspan="4" bgcolor="grey"></td></tr>
</table>
</cfif>