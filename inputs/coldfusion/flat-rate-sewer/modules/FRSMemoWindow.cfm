<cfparam name="url.appName" default="#ListLast(cgi.script_name,'/')#">
<cfparam name="url.recid" default="1">
<cfparam name="url.tag" default="">
<cfparam name="url.all" default="false">

<cfif session.user_id eq "goberlag">
	frsmemowindow.cfm<br>
	<!--- <cfdump var="#url#" label="url"><br> --->
	<!--- <cfdump var="#form#" label="form"><br> --->
	<!--- <cfabort> --->
</cfif>

<cfif server.cf.computer eq "hq-cf2022-p1">
	<cfset windowsname = "memo#hash(url.appName)##hash(url.recid)#">
<cfelse>
	<cfset windowsname = "memo#hash(url.recid)#">
</cfif>

<cfset objdbfunction = createobject("component", "intranet.apps.custserv.frs.cfcs.frsobjects")>

<!--- Routine creates a memo entry for a calling application --->
<cfset getMemoRet = objdbfunction.getMemo("#url.appName#", "#url.recid#")>

<cfif session.user_id eq "goberlag">
	<!--- <cfdump var="#getMemoRet#" label="getMemoRet" top="2"><br> --->
	<!--- <cfoutput>#windowsname#</cfoutput><br> --->
</cfif>

<cfif isDefined("submit")>
	<!--- save update if applicable --->
	<cfset getMemoRet = objdbfunction.putMemo("#url.appName#", "#url.recid#", "#form.memo#", "#url.tag#")>
	<!--- close window --->
</cfif>

<!---
<cfdiv id="mycontentdiv#windowsname#" bind="url:modules/FRSMemoListWindow.cfm?tag=#url.tag#&recid=#url.recid#&appName=#url.appName#&windowsname=#windowsname#">
</cfdiv>
--->

<cfset bind_value = "url:modules/FRSMemoListWindow.cfm?tag=#url.tag#&recid=#url.recid#&appName=#url.appName#&windowsname=#windowsname#">
<!--- <cfoutput>#bind_value#</cfoutput> --->

<cfdiv id="mycontentdiv#windowsname#" bind="#bind_value#"></cfdiv>

<!---
<cftry>
<cfcatch>
	<cfdump var="#cfcatch#">
</cfcatch>
</cftry>
--->