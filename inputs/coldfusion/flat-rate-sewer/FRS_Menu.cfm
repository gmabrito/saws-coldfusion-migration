<style type="text/css">
	tr.menuon { background-color: lightblue; color: #FFFFFF; cursor:pointer; }
	tr.menuoff { background-color: #FFFFFF; color: #000000; cursor:pointer; }
	tr.clicked { background-color: lightyellow; color: #000000; cursor:pointer; }
	.x-window-mc { background-color: lightyellow; } 
	div.x-panel-body { overflow: auto; }
</style>

<cfsavecontent variable="addHeader">

<script> 
	function refreshPage(formname) { 
        ColdFusion.navigate('FRS_RateMgtWindow.cfm','centerarea','callbackNoAction','','POST',formname);
    } 
	
    function submitReadingForm(formname) { 
        ColdFusion.Ajax.submitForm(formname, './handlers/MeterReading_Window.cfm', callbackNoAction, errorHandler); 
    } 

    function submitMemoForm(formname,windowsname) { 
        ColdFusion.Ajax.submitForm(formname, './handlers/memo_window.cfm', callbackNoAction, errorHandler); 
		ColdFusion.Window.hide(windowsname);
    } 	
	
	function SubmitAssessmentForm(formname) { 
        ColdFusion.Ajax.submitForm(formname, './handlers/Assessment_Window.cfm', callbackNoAction, errorHandler); 
    } 
	
	function ApplyAssessmentValues(formname,windowname) { 
	   if (confirm("Click OK to Save Assessment") == true) {
			ColdFusion.Ajax.submitForm(formname, './handlers/Assessment2_Window.cfm', callbackNoAction, errorHandler); 
			alert("Assessment Saved");				
			ColdFusion.navigate('index_assessments_window.cfm','index-assessments-window');
			ColdFusion.Window.destroy(windowname); 
		} else {
			alert("Assessment Not Saved");
		}
    } 	
	
	function ProgressAssessmentValues(formname,windowname) { 
	   if (confirm("Click OK to Progress w/o Assessment") == true) {
			ColdFusion.Ajax.submitForm(formname, './handlers/Assessment2_Window.cfm?progress_only=true', callbackNoAction, errorHandler); 
			alert("Assessment Progressed");				
			ColdFusion.navigate('index_assessments_window.cfm','index-assessments-window');
			ColdFusion.Window.destroy(windowname); 
		} else {
			alert("Assessment Not Saved");
		}
    } 		

	function submitInOverrideValue(formname,containername,pageurl,close_windowname) { 
	    if (confirm("Are you sure you want to override values?") == true) {
	        ColdFusion.Ajax.submitForm(formname, './handlers/AssessOverrideWindow.cfm', callbackNoAction, errorHandler);
			ColdFusion.navigate(pageurl,containername);
			ColdFusion.Window.destroy(close_windowname); 
	    } else {
	        alert("Incomming CCF Not Saved");
	    }
	}

	function DeactivateMeter(formname) {
	   if (confirm("Click OK to Disable Meter") == true) {
			ColdFusion.Ajax.submitForm(formname, 'handlers/MeterInfo_Window.cfm', callbackNoAction, errorHandler);
			ColdFusion.Window.destroy('meter#url.rec_id#');
			alert("Meter Disabled");				
		} else {
			alert("Meter Not Disabled");
		}
	}
	
    function callbackNoAction(text) { 
        if (text != "") {
		    alert(text);
	    }
    }

    function callbackNoResponse(text) { 
        if (text != "") {
		   alert('Commit Complete for ' + text);
	    }
    } 
     
    function errorHandler(code, msg) { 
        alert("Error!!! " + code + ": " + msg); 
    } 

    function submitCustForm(formname, meter, close_windowname) {
		if (meter == "1") {
        	ColdFusion.Ajax.submitForm(formname, './handlers/AccountInfo_Window.cfm', callback, errorHandler); 
		}
		if (meter == "0") {
	        ColdFusion.Ajax.submitForm(formname, './handlers/AccountInfo_Window.cfm', callbackNoResponse, errorHandler); 
			ColdFusion.Window.destroy(close_windowname);
		}
    } 
     
    function callback(text) {
		if (text != "") {
			ColdFusion.Window.create('AccountDetail' + text.substring(1,9) + '', 'Account Details',
				'FRS_AccountDetailWindow.cfm?acctnum=' + text + '',
				{refreshOnShow:true, closable:true, center:true, modal:true, width:1200, height:650, bodystyle:'overflow:auto', _cf_refreshOnShow:true});
		}
    } 
</script> 

<!--- <cfajaximport tags="cfwindow, cfpod, cfform, cftextarea, cftooltip, cflayout-tab, cfinput-autosuggest, cflayout-border, cfinput-datefield, cftextarea, cfgrid, cfdiv"> --->
<cfajaximport tags="cfwindow, cfpod, cfform, cftextarea, cftooltip, cflayout-tab, cflayout-border, cfinput-datefield, cftextarea, cfgrid, cfdiv">

</cfsavecontent>

<cfhtmlhead text="#addHeader#"/>

<cfset objdbfunction = createobject("component", "intranet.apps.custserv.frs.cfcs.frsobjects")>

<title>Flat Rate Service</title>

<cfset acl = objdbfunction.getFRSACL()>

<cfif acl.recordcount eq 0>
	<p>Access to this system is restricted. Please check with the administrator for access</p>
	<cfabort>
</cfif>

<cfif not isDefined("session.FRSentry")>
	<cfset varAuditLog = 
		objdbfunction.putAuditLog('#session.emp_id#','#ListLast(cgi.SCRIPT_NAME,"/")#','Employee #session.emp_id# connected to FRS application','1')>
    <cfset session.FRSentry = '#session.emp_id#'>
</cfif>

<cfset calling_page_name = ListLast(cgi.script_name,"/")>
<cfset calling_page = (calling_page_name eq "index.cfm") ? "Customer" : "">
	
	<!--- <h2 align="center" style="margin-top:0"><cfoutput>#navTitle#</cfoutput></h2> --->
	<!--- <hr><br> --->

	<!---
	<cfif calling_page_name eq "index.cfm">
	<cfmenu name="Main" type="horizontal">
	<cfmenuitem display="Daily Readings"  href="/intranet/Apps/CustServ/FRS/index.cfm?action=readings"/>
	<cfmenuitem display="Monthly Assessments"  href="/intranet/Apps/CustServ/FRS/FRS_Assessments.cfm">
	</cfmenuitem>

	<cfmenuitem display="Account Maintenance"  href="/intranet/Apps/CustServ/FRS/FRS_AccountEdit.cfm?sortby=FRS_CONTACT_BUSINESS&orderby=desc">
	        <cfmenuitem display="Add Customer"  href="/intranet/Apps/CustServ/FRS/FRS_ACCT_Maint.cfm?action=Add Customer"/>
	</cfmenuitem>

	<cfif acl.FRS_USER_ACCESS_LEVEL gt 2>
	<cfmenuitem display="Reports">
		<cfmenuitem  display="Consumption" href="FRS_Consumption.cfm"/>
	</cfmenuitem>    

	    <cfmenuitem display="Admin Options">
			<cfif acl.FRS_USER_ACCESS_LEVEL gt 3>
	        <cfmenuitem display="Access / Security" href="/intranet/Apps/CustServ/FRS/FRS_ACLedit.cfm"/>
	        <cfmenuitem display="Configuration Defaults">
	            <cfmenuitem display="Set new FRS Sewer Rate" href="/intranet/Apps/CustServ/FRS/config/FRS_CFG_RATE.cfm"/>
	            <cfmenuitem display="Set new default BASIS" href="/intranet/Apps/CustServ/FRS/config/FRS_CFG_BASIS.cfm"/>
	            <cfmenuitem display="Set new default BOD" href="/intranet/Apps/CustServ/FRS/config/FRS_CFG_BOD.cfm"/>
	            <cfmenuitem display="Set new default TDD" href="/intranet/Apps/CustServ/FRS/config/FRS_CFG_TOD.cfm"/>
	        </cfmenuitem>
	        </cfif>
	        <cfmenuitem display="Log Viewer" href="/intranet/Apps/CustServ/FRS/FRS_LOGview.cfm"/>
	    </cfmenuitem>
	    
	</cfif>

	</cfmenu>
	</cfif>
	--->

<!---
<style>
   strong { font-weight:bold; }
   em { font-style:italic; }
   em.strong {font-weight:bold;}
   strong.em {font-style:italic;}
</style>
--->