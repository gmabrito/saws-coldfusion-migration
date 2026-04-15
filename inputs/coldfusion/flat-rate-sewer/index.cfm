<cfsetting showdebugoutput="yes">

<cfset objdbfunction = createobject("component", "intranet.apps.custserv.frs.cfcs.frsobjects")>

<cfset acl = objdbfunction.getFRSACL()>

<cfif session.user_id eq "goberlagx">
    <!--- <cfdump var="#acl#" label="acl"><br> --->
</cfif>

<cfset NavTitle = "FRS Console">

<cfif acl.recordcount eq 0>
    <p>Access to this system is restricted. Please check with the administrator for access</p>
    <cfabort>
</cfif>

<cfinclude template="frs_menu.cfm">

<center>
    <cflayout type="tab" width="1200" height="800" align="left">
		<cfif acl.FRS_USER_ACCESS_LEVEL gt 0>
            <cflayoutarea name="index-window" title="Daily Readings" source="index_window.cfm" refreshonactivate="false"/>
        </cfif>
        <cfif acl.FRS_USER_ACCESS_LEVEL gt 1>
            <cflayoutarea name="index-assessments-window" title="Assessments Due" source="index_assessments_window.cfm" refreshonactivate="true"/>
        </cfif>
        <cfif acl.FRS_USER_ACCESS_LEVEL gt 2>
            <cflayoutarea name="index-accounts-window" title="Accounts Maintenance" source="index_accounts_window.cfm" refreshonactivate="true"/>
        </cfif>
        <cfif acl.FRS_USER_ACCESS_LEVEL gt 2>
            <cflayoutarea name="index-reports-window" title="Reports" source="index_reports_window.cfm" refreshonactivate="false"/>
        </cfif>
        <cfif acl.FRS_USER_ACCESS_LEVEL gt 3>    
            <cflayoutarea name="index-admin-window" title="Administration" source="index_admin_window.cfm"/>
        </cfif>
    </cflayout>
</center>