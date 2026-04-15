<cfparam name="statusList" default="A">
<cfparam name="url.orderby" default="asc">
<cfparam name="url.sortby" default="FRS_PLAN_NEXT_ASSESSMENT_DATE">
<cfparam name="PageNum_allSitesWorking" default="1">
<cfparam name="BIZ_NAME" default="">

<cfset NavTitle = "Account Maintenance">

<cfinclude template="FRS_Menu.cfm">

<form name="form1">
    <div align="right">
        <select name="statusList" id="statusList"
            onChange="ColdFusion.navigate('index_accounts_window.cfm','index-accounts-window','','','','form1');">
            <option value="A" <cfif statusList eq "A">selected="selected"</cfif>>Active</option>
            <option value="I" <cfif statusList eq "I">selected="selected"</cfif>>Inactive</option>
        </select>

        <input type="button" name="addNew" value="Add New"
            onClick="javascript:ColdFusion.Window.create('Editnew', 'Add Account', 'FRS_Acct_Maint_window.cfm?add=true',
			{refreshOnShow:true, closable:true, center:true, modal:true, width:900, height:900, _cf_refreshOnShow:true});"
            style="cursor:pointer;font-style:italic;">
    </div>
<form>

<cfset nextorderby = (url.orderby eq "asc") ? "desc" : "asc"/>
<cfset arrow_dir = (nextorderby eq "desc") ? "&uarr;" : "&darr;"/>
<cfparam name="PageNum_Recordset1" default="1">

<cfset MaxRows_Recordset1=500>
<cfset Recordset2=objdbfunction.getAllSites(PageNum_Recordset1,MaxRows_Recordset1,"#url.sortby#","#nextorderby#","","#BIZ_NAME#")>

<cfquery name="recordset1" dbtype="query">
    SELECT * FROM RECORDSET2
    WHERE frs_plan_end_date <cfif statusList eq "I"> >= <cfelse> <= </cfif> [FRS_PLAN_START_DATE]
</cfquery>

<cfset StartRow_Recordset1=Min((PageNum_Recordset1-1)*MaxRows_Recordset1+1,Max(Recordset1.RecordCount,1))>
<cfset EndRow_Recordset1=Min(StartRow_Recordset1+MaxRows_Recordset1-1,Recordset1.RecordCount)>
<cfset TotalPages_Recordset1=Ceiling(Recordset1.RecordCount/MaxRows_Recordset1)>

<cfset nextorderby = (url.orderby eq "asc") ? "desc" : "asc"/>

<table width="100%" border="0" cellpadding="1" cellspacing="2" >
    <tr>
        <td colspan="4"></td><td>
        <td></td>
    </tr>

    <tr><td colspan="9"></td></tr>

    <cfif recordset1.recordcount eq 0>
        <tr>
            <td colspan="6">NO MATCH FOUND</td>
        </tr>
    <cfelse>
        <cfoutput>
            <tr>
                <th width="25%" onclick="ColdFusion.navigate('index_accounts_window.cfm?sortby=FRS_ACCOUNT_NUM&orderby=#nextorderby#','index-accounts-window');">
                    Account Num <cfif url.sortby eq "FRS_ACCOUNT_NUM">#arrow_dir#</cfif>
                </th>
                <th width="35%" onclick="ColdFusion.navigate('index_accounts_window.cfm?sortby=FRS_CONTACT_BUSINESS&orderby=#nextorderby#','index-accounts-window');">
                    Business Name <cfif url.sortby eq "FRS_CONTACT_BUSINESS">#arrow_dir#</cfif>
                </th>
                <th width="15%" onclick="ColdFusion.navigate('index_accounts_window.cfm?sortby=FRS_BUSINESS_TYPE&orderby=#nextorderby#','index-accounts-window');">
                    Type<cfif url.sortby eq "FRS_BUSINESS_TYPE">#arrow_dir#</cfif>
                </th>
                <th width="5%" onclick="ColdFusion.navigate('index_accounts_window.cfm?sortby=FRS_PLAN_NEXT_ASSESSMENT_DATE&orderby=#nextorderby#','index-accounts-window');">
                    Next Assessment <cfif url.sortby eq "FRS_PLAN_NEXT_ASSESSMENT_DATE">#arrow_dir#</cfif>
                </th>
                <th width="5%" align="right">BC</th>
                <th width="15%" align="right">Basis</th>
            </tr>
        </cfoutput>

        <tr><td colspan="6"></td></tr>

      	<cfoutput query="Recordset1" startRow="#StartRow_Recordset1#" maxrows="#MaxRows_Recordset1#" >
            <tr height="20px" valign="bottom" onmouseover="this.className='menuon';" onmouseout="this.className='menuoff';" style="cursor:default;">
                <td onClick="javascript:ColdFusion.Window.create('Edit#Recordset1.rec_id#',
           			'Edit Account','FRS_Acct_Maint_window.cfm?acctnum=#Recordset1.FRS_ACCOUNT_NUM#',
    				{refreshOnShow:true,closable:true,center:true,
                    modal:false,width:1200,height:800,_cf_refreshOnShow:true});" style="cursor:pointer;font-style:italic;">                     
                    <u>#Recordset1.FRS_CONTACT_ACCOUNT_NUM#</u>
                </td>
            
                <td>#replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")#</td>
                <!--- <td>#Recordset1.FRS_CONTACT_NAME#</td> --->
                <td>#FRS_BUSINESS_TYPE#</td>
                <td>#dateformat(FRS_PLAN_NEXT_ASSESSMENT_DATE,"mm/dd/yyyy")#</td>
                <td align="right">#FRS_PLAN_BILLING_METHOD_TYPE#</td>

                <td align="right">#int(val(FRS_PLAN_BASIS))# 
                    <!--- #getAccountValidRet.BILLINGCYCLE# --->

                    <img src="images/document.png" alt="Assessments" width="18" height="18" 
                        onClick="javascript:ColdFusion.Window.create('Past#Recordset1.rec_id#',
               			'Past Assessment Reports','./reports/FRS_PastAssessmentsWindow.cfm?account_num=#Recordset1.FRS_CONTACT_ACCOUNT_NUM#',
        				{refreshOnShow:true,closable:true,center:true,modal:false,width:300,height:500,_cf_refreshOnShow:true});"
                        style="cursor:pointer;">

                    <img src="images/memo_edit.jpg" alt="Memos" width="18" height="18"
                        onClick="javascript:ColdFusion.Window.create('AcctMemo#Recordset1.rec_id#',
               			'Account Memo',
        				'modules/FRSMemoWindow.cfm?appName=#listlast(cgi.SCRIPT_NAME,'/')#&recid=#Recordset1.rec_id#&tag=#Recordset1.FRS_CONTACT_ACCOUNT_NUM#&all=true',
        				{refreshOnShow:true,closable:true,center:true,modal:false,width:900,height:350,_cf_refreshOnShow:true});">
                </td>
                <!--- <td>#Recordset1.FRS_PLAN_NEXT_ASSESSMENT_DATE#</td> --->
            </tr>
        </cfoutput>
    </cfif>
</table>

<cfform action="#cgi.SCRIPT_NAME#?#cgi.QUERY_STRING#">
    <cfloop index="pageNum" from="1" to="#TotalPages_Recordset1#">
        <cfif PageNum_Recordset1 neq pageNum>
            <cfinput type="submit" name="PageNum_Recordset1" value="#pageNum#">
        <cfelse>
            <cfinput type="submit" name="PageNum_Recordset1" value="#pageNum#" disabled>
        </cfif>
    </cfloop>
</cfform>