<cfset objdbfunction = createobject('component','Intranet.apps.CustServ.FRS.CFCs.FRSobjects')>

<cfset engRptRet = objdbfunction.getFRSAccount(url.account_num)/>

<cfparam name="FRS_ENGRPT_ITEMS" default="#engRptRet.FRS_ENGRPT_ITEMS#">
<cfparam name="FRS_ENGRPT_FIRM" default="#engRptRet.FRS_ENGRPT_FIRM#">
<cfparam name="FRS_ENGRPT_DATE_DUE" default="#engRptRet.FRS_ENGRPT_DATE_DUE#">
<cfparam name="FRS_ENGRPT_STUDY_DATE" default="#engRptRet.FRS_ENGRPT_STUDY_DATE#">
<cfparam name="FRS_ENGRPT_TYPE" default="#engRptRet.FRS_ENGRPT_TYPE#">

<cfif isDefined("submit")>
	<cfset PutEngRpt= objdbfunction.putAccountEngRpt(account_num,FRS_ENGRPT_FIRM,FRS_ENGRPT_TYPE,FRS_ENGRPT_DATE_DUE,FRS_ENGRPT_STUDY_DATE,FRS_ENGRPT_ITEMS)/>	
<h3>Updated! - Please close</h3>

<cfelseif isDefined("PROGRESS")>
	<cfset PutEngRpt= objdbfunction.putAccountEngRpt(account_num,FRS_ENGRPT_FIRM,FRS_ENGRPT_TYPE,FRS_ENGRPT_DATE_DUE,FRS_ENGRPT_STUDY_DATE,FRS_ENGRPT_ITEMS)/>
	<cfset ProgressAssessment =objdbfunction.progressAssessment('EngRpt',account_num)/>	
	<cfset engRptRet = objdbfunction.getFRSAccount(account_num)/>
    <h3>Account Progressed! - Please close</h3>
<cfelse>
<cfform name="form1" method="post" action="">
<table>
	<cfinput type="hidden" name="account_num" value="#url.account_num#"/>
  <tr><td>Eng Report : FIRM</td><td>  <cfinput type="text" name="FRS_ENGRPT_FIRM" value="#FRS_ENGRPT_FIRM#"></td></tr>
   <tr>
     <td>Eng Report Due:</td>
     <td>  <cfinput type="text" name="FRS_ENGRPT_DATE_DUE" value="#FRS_ENGRPT_DATE_DUE#"></td></tr>
   <tr><td>Report Type:</td><td>    <cfinput type="text" name="FRS_ENGRPT_TYPE" value="#FRS_ENGRPT_TYPE#"></td></tr>
   <tr><td>Inground Sprinklet:</td><td>    <input type="checkbox" name="FRS_ENGRPT_ITEMS" value="I" <cfif ListContains(FRS_ENGRPT_ITEMS,"I")> checked="yes" </cfif>></td></tr>
   <tr><td>Hose Bibs: </td><td>  <input type="checkbox" name="FRS_ENGRPT_ITEMS" value="H" <cfif ListContains(FRS_ENGRPT_ITEMS,"H")> checked="yes" </cfif>></td></tr>
   <tr><td>Some Wtrng:</td><td>  <input type="checkbox" name="FRS_ENGRPT_ITEMS" value="W" <cfif ListContains(FRS_ENGRPT_ITEMS,"W")> checked="yes" </cfif>></td></tr>
   <tr><td>No Wtrng:</td><td>  <input type="checkbox" name="FRS_ENGRPT_ITEMS" value="N" <cfif ListContains(FRS_ENGRPT_ITEMS,"N")> checked="yes" </cfif>></td></tr>
   <tr>
     <td>Report Study Date:</td>
     <td><cfinput type="text" name="FRS_ENGRPT_STUDY_DATE" value="#FRS_ENGRPT_STUDY_DATE#"></td>
   </tr>
   <tr><td></td><td><cfinput type="submit" name="submit" value="Update"></td></tr>
   <tr><td></td><td><cfinput type="submit" name="PROGRESS" value="PROGRESS"></td></tr>   
</table>
</cfform>
</cfif>    
