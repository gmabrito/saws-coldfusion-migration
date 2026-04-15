<h1>Administration Email Configuration</h1>
<hr>

When any essential activity, such as an assessment being conducted, is complete, the email listed below will receive a notice<br>

<cfset objdbfunction = createobject('component','Intranet.apps.CustServ.FRS.CFCs.FRSobjects')>

<cfif isDefined("submit")>
    <cfset FRS_NOTIFY_SET = objdbfunction.putListByKey(FRS_NOTIFY_RECID,'#FRS_NOTIFY_EMAIL#')>
    <cfset FRS_NOTIFY_RECID = FRS_NOTIFY_SET.REC_ID>
    <cfset FRS_NOTIFY_EMAIL = FRS_NOTIFY_SET.FRS_CTRL_VALUE>

    record updated!<br>
<cfelse>
  <cfset FRS_NOTIFY = objdbfunction.getListByKey('FRS_CONTACT_EMAIL')/>
  <cfset FRS_NOTIFY_RECID = FRS_NOTIFY.REC_ID/>
  <cfset FRS_NOTIFY_EMAIL = FRS_NOTIFY.FRS_CTRL_VALUE/>
</cfif>

<cfform name="notify" style="margin:1em;">
  Notification Email:
  <cfinput name="FRS_NOTIFY_EMAIL" type="text" size="50" value="#FRS_NOTIFY_EMAIL#">
  <cfinput type="submit" name="submit" value="Update">
  <cfinput type="hidden" name="FRS_NOTIFY_RECID" value="#FRS_NOTIFY_RECID#">
</cfform>