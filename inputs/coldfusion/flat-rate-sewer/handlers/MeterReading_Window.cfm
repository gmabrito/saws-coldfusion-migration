<cfset objdbfunction = createobject("component", "intranet.apps.custserv.frs.cfcs.frsobjects")>

<!--- <cfset syncBillingRecord = objdbfunction.refreshBillingInfo(account_num, billrecid)> --->

<cfmail to="testuser@example.com" from="#cgi.server_name# <testuser@example.com>"
    subject="cfalert reading #cgi.script_name# #DateTimeFormat(now(), "yyyy-mm-dd HH:nn:ss")#" type="html">
    #cgi.http_host##cgi.http_url#<br><br>
    #cgi.cf_template_path#<br><br>

    session.email=#session.email#<br><br>

    <cfdump var="#form#" label="form"><br>
    <cfdump var="#url#" label="url"><br>
    <cfdump var="#session#" label="session"><br>
    <cfdump var="#server#" label="server"><br>
    <cfdump var="#cgi#" label="cgi"><br>
</cfmail>

<cfloop from="1" to="#form.frs_meter_count#" index="g1">
	<cfset frs_serial_num = form["FRSSERIAL"&g1]>
    <cfset frs_reading = form["FRSreading"&g1]>

    <cfset MeterRecord = frs_reading neq "" ? objdbfunction.putMeterReadings(form.account_num, frs_serial_num, form.frsreaddate, frs_reading) : "">

    <cfif MeterRecord neq "">
        <cfoutput>#MeterRecord#</cfoutput><br>
    </cfif>
</cfloop>

<!--- Put the billing record if it is missing --->