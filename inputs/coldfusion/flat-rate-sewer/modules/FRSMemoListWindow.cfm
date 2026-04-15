<cfif session.user_id eq "goberlag">
	frsMemoListWindow.cfm<br>
	<!--- <cfdump var="#url#" label="url"><br> --->
	<!--- <cfdump var="#form#" label="form"><br> --->
	<!--- <cfabort> --->
</cfif>

<!--- <cfset sleep(500)> --->

<cfset objdbfunction = createobject("component", "intranet.apps.custserv.frs.cfcs.frsobjects")>

<cfset getAllMemoRet = objdbfunction.getMemosByTag("", "#url.tag#")>

<cfoutput>
	<div onclick="ColdFusion.Window.create('win#url.Windowsname#','Memo Window',
		'modules/FRSMemoFormWindow.cfm?windowsname=#url.Windowsname#&tag=#url.tag#&recid=#url.recid#&appName=#url.appName#',
		{refreshOnShow:true, closable:true, center:true, modal:false, width:1100, height:400, _cf_refreshOnShow:true});"
		align="right" style="margin-right:1em; color:blue; font-size:16; cursor:pointer;">
		Add New Memo
	</div>
</cfoutput>

<cfoutput query="getAllMemoRet">
    <div style="margin:0 1em;">
    	<hr>
		<!--- #dateformat(getAllMemoRet.FRS_MEMO_DATE)# #timeformat(getAllMemoRet.FRS_MEMO_DATE)#<br> --->
		<span style="font-weight:bolder;">
			#datetimeformat(getAllMemoRet.FRS_MEMO_DATE, "mm/dd/yyyy hh:nn tt")#
			#objdbfunction.getEmployee(getAllMemoRet.FRS_MEMO_AUTHOR).EMP_FULL_NAME#
		</span><br>
		#getAllMemoRet.FRS_MEMO_TEXT#
	</div>
</cfoutput>