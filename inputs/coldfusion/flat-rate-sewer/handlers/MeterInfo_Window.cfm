
<cfif isDefined("form.deactivate")>
<cfquery name="deactivate" datasource="intradb">
UPDATE CS_FRS_METERS
SET FRS_METER_ACTIVE = 'N'
WHERE REC_ID = '#FORM.recToDeactivate#'

</cfquery>
</cfif>