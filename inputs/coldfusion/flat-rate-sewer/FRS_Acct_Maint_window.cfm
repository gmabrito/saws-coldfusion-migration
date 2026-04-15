<cfsetting requesttimeout="120">

<!---
<cfif session.user_id neq "goberlag">
  <p>Unexpected error occurred. IT support has been notified and is working to resolve the issue.</p>
  <cfabort>
</cfif>
--->

<cfif session.user_id eq "goberlagx">
  frs_acct_maint_window.cfm<br>
  application.ws_accountmethods=<cfoutput>#application.ws_accountmethods#</cfoutput><br>
</cfif>

<span style="margin-left:1em; font-weight:bold;">Flat Rate Customer Setup</span>

<cfinclude template="FRS_Menu.cfm">

<cfif acl.FRS_USER_ACCESS_LEVEL lt 2>
  Unauthorized
  <cfabort>
</cfif>

<cfif isDefined("form.submit")>
	<cfparam name="url.acctnum" default="">
<cfelseif isDefined("url.acctnum")>
	<cfparam name="url.acctnum" default="#url.acctnum#">
</cfif>

<cfif isDefined("url.acctnum") or isDefined("submit")>
  <cftry>

  <!--- <cfset application.ws_accountmethods = "https://#cgi.server_name#/intranet/apps/webservices/accountmethods.cfc?wsdl"> --->

	<!---
  <cfinvoke webservice="#application.ws_accountmethods#" method="getCSWEBInfo" returnvariable="aQuery" refreshwsdl="false">
		<cfinvokeargument name="ACCOUNT_NUM" value="#url.acctnum#">
		<cfinvokeargument name="ADDRESS_KEY" value="">
	</cfinvoke>
  --->

  <cfinvoke component="intranet.apps.webservices.accountmethods" method="getCSWEBInfo" returnVariable="aQuery">
    <cfinvokeargument name="account_num" value="#url.acctnum#">
    <cfinvokeargument name="address_key" value="">
  </cfinvoke>

  <!---
  <cfinvoke webservice="#application.ws_accountmethods#" method="getPropertyServices" returnvariable="BQuery" refreshwsdl="true" timeout="60">
    <cfinvokeargument name="accountkey" value="#aQuery.account_key#">
  </cfinvoke>
  --->

  <cfinvoke component="intranet.apps.webservices.accountmethods" method="getPropertyServices" returnVariable="bQuery">
    <cfinvokeargument name="accountkey" value="#aQuery.account_key#">
  </cfinvoke>
  <!--- <cfdump var="#bQuery#"> --->

	<!---
  <cfinvoke webservice="#application.ws_accountmethods#" method="getBillingAccountsInfo" returnvariable="getAccountValidRet" refreshwsdl="false">
		<cfinvokeargument name="acctnum" value="#url.acctnum#">
	</cfinvoke>
  --->

  <cfinvoke component="intranet.apps.webservices.accountmethods" method="getBillingAccountsInfo" returnVariable="getAccountValidRet">
    <cfinvokeargument name="acctnum" value="#url.acctnum#">
  </cfinvoke>

  <!--- actual meter size --->
  <!---
  <cfinvoke webservice="#application.ws_accountmethods#" method="getMeterOutput" returnvariable="getMeterOutputRet" refreshwsdl="false">
    <cfinvokeargument name="acctnum" value="#url.acctnum#">
  </cfinvoke>
  --->

  <cfinvoke component="intranet.apps.webservices.accountmethods" method="getMeterOutput" returnVariable="getMeterOutputRet">
    <cfinvokeargument name="acctnum" value="#url.acctnum#">
  </cfinvoke>

  <cfquery name="q_address" datasource="datawarehouse">
    SELECT *
    FROM VW_ADDRESS
    WHERE HANSEN_ADDRESS_KEY = <cfqueryparam value="#aQuery.address_key#" cfsqltype="float">
  </cfquery>

  <cfcatch>
    <p>Unexpected error occurred. IT support has been notified and is working to resolve the issue.</p>

    <cfif session.user_id eq "goberlag">
      <cfdump var="#cfcatch#"><br>
    </cfif>

    <cfmail to="testuser@example.com" from="#cgi.server_name# <testuser@example.com>"
        subject="cfalert ws_accountmethods #cgi.script_name# #datetimeformat(now(), "yyyy-mm-dd HH:nn:ss")#" type="html">
        #cgi.http_host##cgi.http_url#<br><br>
        #lcase(cgi.cf_template_path)#<br><br>

        <cfdump var="#cfcatch#" label="cfcatch"><br>
        <cfdump var="#url#" label="url"><br>
        <cfdump var="#form#" label="form"><br>
        <cfdump var="#session#" label="session"><br>
        <cfdump var="#cgi#" label="cgi"><br>
    </cfmail>
    <cfabort>
  </cfcatch>

  </cftry>

<cfelse>
	<cfparam name="url.acctnum" default="">
</cfif>
    
<cfinvoke component="intranet.apps.common.employee" method="whoIs" returnvariable="whoIsRet">
	<cfinvokeargument name="empid" value="#session.emp_id#">
</cfinvoke>


<style type="text/css">
	#apDiv1 {
	    position: absolute;
	    top: 40px;
	    left: 20px;
	    width: 500px;
	    height: 250px;
	    z-index: 1;
      background-color:lightgrey;
      padding:1em;
	}
	#apDiv2 {
	    position: absolute;
	    top: 40px;
	    left: 550px;
	    width: 500px;
	    height: 250px;
	    z-index: 2;
      background-color:lightgrey;
      padding:1em;
	}
	#apDiv3 {
	    position: absolute;
	    top: 320px;
	    left: 20px;
	    width: 500px;
	    height: 350px;
	    z-index: 3;
      background-color:lightgrey;
      padding:1em;
	}
	#apDiv4 {
	    position: absolute;
	    top: 320px;
	    left: 550px;
	    width: 500px;
	    height: 350px;
	    z-index: 4;
      background-color:lightgrey;
      padding:1em;
	}
  #apDiv5 {
	    position: absolute;
	    top: 800px;
	    left: 10px;
	    width: 600px;
	    height: 219px;
	    z-index: 5;
	}
</style>

<cfset getFRSAccount = objdbfunction.getFRSAccount("#url.acctnum#")>
<cfset getFRSContact = objdbfunction.getFRSContact('#getFRSAccount.FRS_ACTIVE_CONTACT_RECID#')>

<body>
    
<!--- if this is a new entry, do the invoke for the employee name --->
	
<cfoutput>
    <cfset editLock = (getFRSAccount.recordcount eq 1) ? "disabled" : "">

    <cfparam name="FRS_ACCOUNT_NUM" default="#getFRSAccount.FRS_ACCOUNT_NUM#">
    <cfparam name="FRS_ACCOUNT_FACILITY_DESC" default="#getFRSAccount.FRS_ACCOUNT_FACILITY_DESC#">
    <cfparam name="FRS_BUSINESS_TYPE" default="#getFRSAccount.FRS_BUSINESS_TYPE#">
    <cfparam name="FRS_METHOD" default="#getFRSAccount.FRS_METHOD#">
    <cfparam name="FRS_METER_SIZE" default="#getFRSAccount.FRS_METER_SIZE#">
    <cfparam name="FRS_PLAN_BOD" default="#getFRSAccount.FRS_PLAN_BOD#">
    <cfparam name="FRS_PLAN_TDD" default="#getFRSAccount.FRS_PLAN_TDD#">
    <cfparam name="FRS_PLAN_BASIS" default="#getFRSAccount.FRS_PLAN_BASIS#">
    <cfparam name="FRS_PLAN_START_DATE" default="#dateformat(getFRSAccount.FRS_PLAN_START_DATE,"yyyy-mm-dd")#">
    <cfparam name="FRS_PLAN_ASSESSMENT_FREQ" default="#getFRSAccount.FRS_PLAN_ASSESSMENT_FREQ#">
    <cfparam name="FRS_PLAN_INSPECTION_FREQ" default="#getFRSAccount.FRS_PLAN_INSPECTION_FREQ#">
    <cfparam name="FRS_PLAN_INSPECTION_FREQ" default="#getFRSAccount.FRS_PLAN_INSPECTION_FREQ#">
    <cfparam name="FRS_PLAN_NEXT_ASSESSMENT_DATE" default="#getFRSAccount.FRS_PLAN_NEXT_ASSESSMENT_DATE#">
    <cfparam name="FRS_PLAN_NEXT_INSPECTION_DATE" default="#getFRSAccount.FRS_PLAN_NEXT_INSPECTION_DATE#">
    <cfparam name="FRS_PLAN_BILLING_METHOD_TYPE" default="#getFRSAccount.FRS_PLAN_BILLING_METHOD_TYPE#">
    <cfparam name="FRS_PLAN_CREATEDBY" default="#getFRSAccount.FRS_PLAN_CREATEDBY#">
        
    <cfparam name="FRS_CONTACT_BUSINESS" default="#getFRSContact.FRS_CONTACT_BUSINESS#">
    <cfparam name="FRS_CONTACT_NAME" default="#getFRSContact.FRS_CONTACT_NAME#">
    <cfparam name="FRS_CONTACT_ADDRESS" default="#getFRSContact.FRS_CONTACT_ADDRESS#">
    <cfparam name="FRS_CONTACT_CITY" default="#getFRSContact.FRS_CONTACT_CITY#">
        
    <cfparam name="FRS_CONTACT_STATE" default="#getFRSContact.FRS_CONTACT_STATE#">
    <cfparam name="FRS_CONTACT_ZIP" default="#getFRSContact.FRS_CONTACT_ZIP#">
    <cfparam name="FRS_CONTACT_PHONE" default="#getFRSContact.FRS_CONTACT_PHONE#">
    <cfparam name="FRS_CONTACT_EMAIL" default="#getFRSContact.FRS_CONTACT_EMAIL#">
    
	    <cfform name="FRSaccountInfo#left(url.acctnum,9)#" method="post" preservedata="yes">
        <cfinput type="hidden" name="editlock" value="#editlock#">

        <div id="apDiv1">
          <table width="100%" border="0" cellspacing="1" cellpadding="1">
            <tr>
              <td width="20%">
                Account Num 
                <!---
                <a href="https://csweb.saws.org" target="_blank">
                  <img src="images/lookup.jpg" alt="" width="15" height="15" style="cursor:pointer;">
                </a>
                --->
              </td>
              <td width="50%">
                <cfinput type="text" name="FRS_ACCOUNT_NUM" id="FRS_ACCOUNT_NUM" value="#url.acctnum#" mask="000099001-0099002-9999">
              </td>
            </tr>

            <tr>
              <cfif FRS_CONTACT_BUSINESS eq "">
                <!---
                <cfinvoke webservice="#application.ws_accountmethods#" method="getAccountValid" returnvariable="fQuery" refreshwsdl="false">
                  <cfinvokeargument name="ACCOUNT_NUM" value="#url.acctnum#">
                </cfinvoke>
                --->

                <cfinvoke component="intranet.apps.webservices.accountmethods" method="getAccountValid" returnVariable="fQuery">
                  <cfinvokeargument name="account_num" value="#url.acctnum#">
                </cfinvoke>

                <cfset FRS_CONTACT_BUSINESS = '#trim(fQuery.CUSTOMER_NAME)#'>
                <cfset FRS_CONTACT_ADDRESS = '#trim(fQuery.SERVICE_NUM)# #trim(fQuery.SERVICE_NME)#'>
                <cfset FRS_CONTACT_CITY = '#trim(fQuery.MAIL_LINE3)#'>
                <cfset FRS_CONTACT_ZIP = '#trim(fQuery.SERVICE_ZIP)#'>
              </cfif>

              <td>Business Name</td>
              <td>
                <input type="text" name="FRS_CONTACT_BUSINESS" id="FRS_CONTACT_BUSINESS" value="#FRS_CONTACT_BUSINESS#" size="35" maxlength="50">
              </td>
            </tr>

            <tr>
              <td>Contact Name</td>
              <td><cfinput type="text" name="FRS_CONTACT_NAME" id="FRS_CONTACT_NAME" value="#FRS_CONTACT_NAME#" size="35"></td>
            </tr>

            <tr>
              <td>&nbsp;</td>
              <td><cfinput type="text" name="FRS_CONTACT_ADDRESS" id="FRS_CONTACT_ADDRESS" value="#FRS_CONTACT_ADDRESS#" size="35"></td>
            </tr>

            <tr>
              <td>&nbsp;</td>
              <td>
                <cfinput type="text" name="FRS_CONTACT_CITY" id="FRS_CONTACT_CITY" value="#FRS_CONTACT_CITY#" size="12">
                <label for="label4"></label>
                <cfinput type="text" name="FRS_CONTACT_STATE" id="FRS_CONTACT_STATE" size="1" value="#FRS_CONTACT_STATE#"> <label for="label5"></label>
                <cfinput type="text" name="FRS_CONTACT_ZIP" id="FRS_CONTACT_ZIP" size="5" value="#FRS_CONTACT_ZIP#">
              </td>
            </tr>

            <tr>
              <td>Phone</td>
              <td><cfinput type="text" name="FRS_CONTACT_PHONE" id="FRS_CONTACT_ZIP" value="#FRS_CONTACT_PHONE#" size="10" mask="210-555-0101"></td>
            </tr>

            <tr>
              <td>Email Address</td>
              <td><cfinput type="text" name="FRS_CONTACT_EMAIL" id="FRS_CONTACT_EMAIL" value="#FRS_CONTACT_EMAIL#" size="35"></td>
            </tr>

            <tr>
              <td>&nbsp;</td>
              <td>&nbsp;</td>
            </tr>
          </table>
        </div>
     
        <div id="apDiv3">
          Facility Description<br>
          <cftextarea name="FRS_ACCOUNT_FACILITY_DESC" rows="5" cols="60">#FRS_ACCOUNT_FACILITY_DESC#</cftextarea>

          Comments<br>
          <cftextarea name="comment"  rows="5" cols="60" html="yes"
            onClick="javascript:ColdFusion.Window.create('AcctMemo#getFRSAccount.rec_id#', 'Account Memo',
            'modules/FRSMemoWindow.cfm?appName=#listlast(cgi.SCRIPT_NAME,'/')#&recid=#getFRSAccount.rec_id#&tag=#getFRSAccount.FRS_ACCOUNT_NUM#&all=true',
					  {refreshOnShow:true,closable:true,center:true,modal:false,width:1200,height:800,_cf_refreshOnShow:true});">
                       
          	<cfset objdbfunction = createobject('component','Intranet.apps.CustServ.FRS.CFCs.FRSobjects')>
          	<cfset getAllMemoRet = objdbfunction.getMemosByTag('','#getFRSAccount.FRS_ACCOUNT_NUM#') />

            <cfloop query="getAllMemoRet">
              #dateformat(getAllMemoRet.FRS_MEMO_DATE)# #timeformat(getAllMemoRet.FRS_MEMO_DATE)#
              #objdbfunction.getEmployee(getAllMemoRet.FRS_MEMO_AUTHOR).EMP_FULL_NAME#
              #chr(13)#-------#chr(13)##getAllMemoRet.FRS_MEMO_TEXT# #chr(13)##chr(13)#
            </cfloop>
          </cftextarea>
          </p>

          <table width="100%" border="0" cellpadding="1" cellspacing="1">
            <tr>
              <td colspan="2">Created By</td>
              <td>#whoIsRet.EMP_FIRST_NAME# #whoIsRet.EMP_LAST_NAME# (#session.emp_id#)</td>
              <cfinput type="hidden" name="FRS_PLAN_CREATEDBY" value="#session.emp_id#">
            </tr>

            <tr>
              <td colspan="2">Plan Start Date*</td>
              <td>
                <!--- <cfdump var="#getFRSAccount#" label="getFRSAccount"><br> --->
                <!---
                <cfinput type="datefield?" name="FRS_PLAN_START_DATE" value="#FRS_PLAN_START_DATE#"
                  required="true" message="Plan Start Date required" disabled=#editlock# maxlength="10" size="10">
                --->
                <input type="date" name="FRS_PLAN_START_DATE" value="#dateformat(FRS_PLAN_START_DATE,"yyyy-mm-dd")#" #editlock# required>

                <cfif editlock neq "">
                  <cfinput type="hidden" name="FRS_PLAN_START_DATE" value="#dateformat(FRS_PLAN_START_DATE,"yyyy-mm-dd")#">
                </cfif>
              </td>
            </tr>

            <tr>
              <td>Plan End Date</td>
              <td>
                <cfinput type="checkbox" name="deactivate" checked="no">
              </td>
              <td>
                <!--- <cfinput type="datefield?" name="FRS_PLAN_END_DATE" value="" maxlength="10" size="10"> --->
                <input type="date" name="FRS_PLAN_END_DATE" value="">
              </td>
            </tr>
          </table>
        </div>

        <div id="apDiv4">
          <cfset varBizType = objdbfunction.getListByKey("FRS_BIZ_TYPE")>
          <cfset varAssess = objdbfunction.getListByKey("FRS_ASSESS_FRQ")>
          <cfset varInspection = objdbfunction.getListByKey("FRS_INSPECT_FRQ")>
          <cfset varBillingMethods = objdbfunction.getListByKey("FRS_BILL_METHOD")>
          <cfset varFRSMethods = objdbfunction.getListByKey("FRS_METHOD")>
          <cfset varFRS_METERSIZE = objdbfunction.getListByKey("FRS_METER_SIZES")>

          <table width="100%" border="0" cellspacing="1" cellpadding="1">
            <cfif isDefined("getMeterOutputRet") and getMeterOutputRet.metersz neq "">
              <tr>
                <td>Actual Meter Size</td>
                <td>#getMeterOutputRet.metersz#"</td>
              </tr>
            </cfif>

            <tr>
              <td>Billing Meter Size</td>
              <cfset mtrsizepending = (FRS_METER_SIZE eq "") ? "" : "disabled">
              <td colspan="3">
                <cfselect name="FRS_METER_SIZE" disabled=#mtrsizepending#>
                  <cfset varFRS_METERSIZE_lis_disp = QuotedValueList(varFRS_METERSIZE.frs_ctrl_disp)>
                  <cfset varFRS_METERSIZE_list = QuotedValueList(varFRS_METERSIZE.frs_ctrl_value)>
                  <option value="" selected>--- Select One --- </option>
                  <cfloop from="1" to="#listlen(varFRS_METERSIZE_lis_disp)#" index="option">
                    <cfset sel= (FRS_METER_SIZE eq option) ? "selected" : "">
                    <option value="#option#" #sel#>#listgetat(varFRS_METERSIZE_lis_disp,option)#</option>
                  </cfloop>
                </cfselect>
                <cfif mtrsizepending eq "disabled">
                  <cfinput name="FRS_METER_SIZE" value="#FRS_METER_SIZE#" type="hidden">
                </cfif>
              </td>
            </tr>

            <tr>
              <td style="whitespace:nowrap">FRS Method</td>
              <td colspan="3">
                <cfselect name="FRS_METHOD" query="varFRSMethods" display="frs_ctrl_disp" value="frs_ctrl_value"
                  selected="#FRS_METHOD#" queryPosition="below">
                  <option value="">--- Select One ---</option>
                </cfselect>
              </td>
            </tr>

            <tr>
              <td style="whitespace:nowrap">Billing&nbsp;Method&nbsp;Type</td>
              <td colspan="3">
                <cfselect name="FRS_PLAN_BILLING_METHOD_TYPE" query="varBillingMethods" display="frs_ctrl_disp" value="frs_ctrl_value"
                  selected="#FRS_PLAN_BILLING_METHOD_TYPE#" queryPosition="below">
                  <option value="">--- Select One ---</option>
                </cfselect>
              </td>
            </tr>

            <tr>
              <td>Inspection Period</td>
              <td colspan="3">
                <cfselect name="FRS_PLAN_INSPECTION_FREQ" query="varInspection" display="frs_ctrl_disp" value="frs_ctrl_value"
                  selected="#FRS_PLAN_INSPECTION_FREQ#">
                </cfselect>
              </td>
            </tr>

            <tr>
              <td>Assessment Period</td>
              <td colspan="3">
                <cfselect name="FRS_PLAN_ASSESSMENT_FREQ" query="varAssess" display="frs_ctrl_disp" value="frs_ctrl_value"
                  selected="#FRS_PLAN_ASSESSMENT_FREQ#">
                </cfselect>
              </td>
            </tr> 
     
            <tr>
              <td>Business Type</td>
              <td colspan="3">
                <cfselect name="FRS_BUSINESS_TYPE" query="varBizType" display="frs_ctrl_disp" value="frs_ctrl_value"
                  selected="#FRS_BUSINESS_TYPE#">
                </cfselect>
              </td>
            </tr>

            <tr>
              <td>BOD</td>
              <td>
                <label for="textfield"></label>
                <cfinput type="text" name="FRS_PLAN_BOD" id="textfield" value="#FRS_PLAN_BOD#" size="3">
              </td>
              <td>TDD</td>
              <td>
                <cfinput type="text" name="FRS_PLAN_TDD" id="textfield2" value="#FRS_PLAN_TDD#" size="3">
              </td>
            </tr>

            <tr>
              <td>Basis</td>
              <td colspan="3">
                <cfinput type="text" name="FRS_PLAN_BASIS" id="textfield3" value="#FRS_PLAN_BASIS#" size="8" 
              		required="yes" message="Please provide a Basis valur">
              </td>
            </tr>

            <tr>
              <td>Next Assessment</td>
              <td>
				        <cfinput type="text" name="FRS_PLAN_NEXT_ASSESSMENT_DATE" id="textfield4"
                  value="#dateformat(FRS_PLAN_NEXT_ASSESSMENT_DATE,"mm/dd/yyyy")#" maxlength="10" size="10">
              </td>

              <td>Next&nbsp;Insp</td>
              <td>
				        <cfinput type="text" name="FRS_PLAN_NEXT_INSPECTION_DATE" id="textfield5"
                  value="#dateformat(FRS_PLAN_NEXT_INSPECTION_DATE,"mm/dd/yyyy")#" maxlength="10" size="10">
              </td>
            </tr>
           
            <tr>
              <td>&nbsp;</td>
              <td colspan="3">&nbsp;</td>
            </tr>

            <tr>
              <td>&nbsp;</td>
              <td colspan="2" align="right">
                <cfif editlock eq "">
                	<cfinput type="button" name="submit" value="Add Account" 
                    onClick="submitCustForm(FRSaccountInfo#left(url.acctnum,9)#,0,'Edit#getFRSAccount.rec_id#');">
                <cfelse>
                  <cfif FRS_METHOD eq "EngRpt">
              	    <cfinput type="button" name="submit" value="Commit Changes" 
                      onClick="submitCustForm(FRSaccountInfo#left(url.acctnum,9)#,0,'Edit#getFRSAccount.rec_id#');">                
                  <cfelse>
                	  <cfinput type="button" name="submit" value="Commit Changes" 
                      onClick="submitCustForm(FRSaccountInfo#left(url.acctnum,9)#,0,'Edit#getFRSAccount.rec_id#');">            
                    <td>
                      <cfinput type="button" name="submit" value="Define Meters" 
              		      onClick="submitCustForm(FRSaccountInfo#left(url.acctnum,9)#, 1);">
                    </td>
                  </cfif>
                </cfif>
              </td>
            </tr>
          </table>
        </div>
    </cfform>

    <div id="apDiv2">
      <!--- <cfpod title="Customer Info" width="400" height="200"> --->
        <cfif isDefined("aQuery")>
          <strong>#aQuery.CUSTOMER_NAME#</strong><br>
          #aQuery.Service_Address#<br>
          ServiceArea: #q_address.in_out_service_area#<br>
          ICL/OCL: #getAccountValidRet.ACCTGRP#
          <cfif url.acctnum eq "000099002-0099003-0001"><span style="background-color:orange">Bill Sewer as OCL</span></cfif><br>
          SubGroup: #getAccountValidRet.ACCTSUBGRP#<br>
          Class: #getAccountValidRet.ACCTCLASS#<br>
			    Cycle: #getAccountValidRet.BILLINGCYCLE#
          <hr>
          SERVICES for #INT(AQuery.ACCOUNT_KEY)#:<br>
          <!--- <li> --->
            <!--- [ --->
            <!--- This list the services with commas until last service record --->
            <cfloop query="bQuery">
              #service#<cfif bQuery.recordcount gt 1 and bQuery.currentrow lt bQuery.recordcount>,</cfif>
            </cfloop>
            <!--- ] --->
          <!--- </li> --->
        </cfif>
      <!--- </cfpod> --->
    </div>
</cfoutput>

<cfif session.user_id eq "goberlagx">
  <div id="apDiv5">
    <cfdump var="#getFRSAccount#" label="getFRSAccount"><br>
    <cfdump var="#getFRSContact#" label="getFRSContact"><br>
    <cfif isDefined("getMeterOutputRet")>
      <cfdump var="#getMeterOutputRet#" label="getMeterOutputRet"><br>
    </cfif>
    <cfdump var="#varFRS_METERSIZE#" label="varFRS_METERSIZE"><br>
    <!--- <cfdump var="#url#" label="url"><br> --->
    <!--- <cfdump var="#form#" label="form"> --->
  </div>
</cfif>


<cfif session.user_id eq "goberlag">
  <div id="apDiv5">
    <cfoutput>
    	#cgi.script_name#<br>
        editlock=#editlock#<br>
    </cfoutput>
    <cfdump var="#form#" label="form"><br>
    <!--- <cfdump var="#session#" label="session"><br> --->
    <cfif isDefined("aQuery")><cfdump var="#aQuery#" label="aQuery"><br></cfif>
    <cfif isDefined("bQuery")><cfdump var="#bQuery#" label="bQuery"><br></cfif>
    <cfif isDefined("q_address")><cfdump var="#q_address#" label="q_address"><br></cfif>
    <cfif isDefined("getAccountValidRet")><cfdump var="#getAccountValidRet#" label="getAccountValidRet"><br></cfif>
    <cfif isDefined("getMeterOutputRet")><cfdump var="#getMeterOutputRet#" label="getMeterOutputRet"><br></cfif>
    <cfif isDefined("fQuery")><cfdump var="#fQuery#" label="fQuery"><br></cfif>
    <cfif isDefined("whoIsRet")><cfdump var="#whoIsRet#" label="whoIsRet"><br></cfif>
  </div>
</cfif>
