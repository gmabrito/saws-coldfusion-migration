<cfif session.user_id eq "goberlag">
    frs_consumption.cfm<br>
</cfif>

<cfparam name="url.action" default="">

<cfset NavTitle = "FRS Customer Console: Consumption">

<cfinclude template="FRS_Menu.cfm">

<cfparam name="url.account_num" default="000099018-0099019-0001">

<cfinvoke component="Intranet.apps.CustServ.FRS.CFCs.FRSobjects" method="getFRSbilling" returnvariable="getFRSbillingRet">
	<cfinvokeargument name="FRS_ACCOUNT_NUM" value="#url.account_num#"/>
</cfinvoke>

<cfoutput><h2 align="center">#url.account_num#</h2></cfoutput>

<p align="center">
	This is an example of billing information returned through web service call. Through this method, we can transverse databases.
</p>

<table width="100%" cellpadding="3" cellspacing="3">
	<tr align="right">
		<td>SAWS Date</td>
		<td>Incoming CCF</td>
		<td>Billed Sewer CCF</td>
		<td>SEWER Charge</td>
	</tr>
	
	<tr height="2px">
		<td style="background-color:grey"></td>
		<td style="background-color:grey"></td>
		<td style="background-color:grey"></td>
		<td style="background-color:grey"></td>
	</tr>

	<cfoutput query="getFRSbillingRet">
		<cfset rdate = "#left(right(next_read_date,4),2)#/#right(next_read_date,2)#/#left(next_read_date,4)#"/>
		<tr align="right">
			<td>#dateformat(dateadd('d',int(serv_num_days)*-1,rdate),'mm/dd/yyyy')#</td>
			<td>#int(WATER_SERV_CCF_CONS*748.051948)#</td><td>#int(SEWER_CCF_CONS)#</td>
			<td> #dollarformat(SEWER_GROSS_CHRG)#</td>
		</tr>
	</cfoutput>
</table>

<!---
<cfform>
	<cfgrid name="Sites" title="Account Meters" format="html" striperows="yes" query="getFRSbillingRet">
		<cfgridcolumn name="rec_id" display="no"/>                                        
		<cfgridcolumn name="WATER_SERV_CCF_CONS" header="Incoming CCF" width="100" dataalign="right"/>
		<cfgridcolumn name="SEWER_CCF_CONS" header="Incoming CCF" width="100" dataalign="right"/>
		<cfgridcolumn name="SEWER_GROSS_CHRG" header="Server Charge" width="100" mask="99/99/9999"/>
	</cfgrid>
</cfform>
--->