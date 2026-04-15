<!--- <cfset overridein = form["OverRideValue1"] eq "" ? 0 : form["OverRideValue1"]> --->
<!--- <cfset overridecharge = (FORM["OverRideValue2"] eq "") ? 0 : FORM["OverRideValue2"]> --->

<cfquery datasource="intradb">
    UPDATE CS_FRS_BILLING_ASSESSMENTS
    SET
    FRS_BILLING_INCOMING_CCF_OVERRIDE = #(form.overridevalue1 neq "" ? form.overridevalue1 : "null")#,
    FRS_BILLING_SEWER_CHARGE_OVERRIDE = #(form.OverRideValue2 neq "" ? form.OverRideValue2 : "null")#
    WHERE FRS_BILLING_REC_ID = #form.rec_id#
</cfquery>

<cfquery name="q_actual" datasource="intradb">
    select * from VW_CS_FRS_BILLED_ACTUAL 
    WHERE REC_ID = #form.rec_id#
</cfquery>
        
<cfset objdbfunction = createobject('component','Intranet.apps.CustServ.FRS.CFCs.FRSobjects')>

<cfset putlog = objdbfunction.putAuditLog('#session.emp_id#','assessOverrideWindow','Incomming CCF Override FOR customer ID #q_actual.FRS_ACCOUNT_NUM# on Billing Date #q_actual.BILLING_DATE# set to #form.overridevalue1#.  Originally was #q_actual.FRS_BILLING_INCOMING_CCF#','1','#q_actual.FRS_ACCOUNT_NUM#')>