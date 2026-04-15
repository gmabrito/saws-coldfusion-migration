<cfset objdbfunction = createobject("component","Intranet.apps.CustServ.FRS.CFCs.FRSobjects")>

<cfparam name="url.orderby" default="asc">
<cfparam name="url.sortby" default="FRS_PLAN_NEXT_ASSESSMENT_DATE">
<cfparam name="PageNum_allSitesWorking" default="1">
<cfparam name="BIZ_NAME" default="">

<cfset nextorderby = (url.orderby eq "asc") ? "desc" : "asc">
<cfset arrow_dir = (nextorderby eq "desc") ? "&uarr;" : "&darr;">
<cfparam name="PageNum_Recordset1" default="1">

<cfset MaxRows_Recordset1 = 300>
<cfset Recordset2 = objdbfunction.getAllSites(PageNum_Recordset1, MaxRows_Recordset1, "#url.sortby#", "#nextorderby#", "ASSESS", "#BIZ_NAME#")>

<cfquery name="recordset1" dbtype="query">
    SELECT *
    FROM RECORDSET2
    WHERE  FRS_PLAN_START_DATE >= frs_plan_end_date
</cfquery>

<cfset StartRow_Recordset1=Min((PageNum_Recordset1-1)*MaxRows_Recordset1+1,Max(Recordset1.RecordCount,1))>
<cfset EndRow_Recordset1=Min(StartRow_Recordset1+MaxRows_Recordset1-1,Recordset1.RecordCount)>
<cfset TotalPages_Recordset1=Ceiling(Recordset1.RecordCount/MaxRows_Recordset1)>

<cfset nextorderby = (url.orderby eq "asc") ? "desc" : "asc"/>

<table width="95%" border="0" cellpadding="1" cellspacing="2">

  <tr>
    <td colspan="4"><h2><cfoutput>#Recordset1.RecordCount#</cfoutput> Assessments Due</h2></td>
  </tr>
    <tr><td colspan="4"><hr /></td></tr>
    <cfif recordset1.recordcount eq 0>
    <tr>
    <td colspan="4">NO MATCH FOUND</td>
    </tr>
    <cfelse>
    <cfoutput>
      <tr>
        	<td>Account Num</td>
        	<td onclick="ColdFusion.navigate('index_assessments_window.cfm?sortby=FRS_CONTACT_BUSINESS&orderby=#nextorderby#','index-assessments-window');">
            Business Name <cfif url.sortby eq "FRS_CONTACT_BUSINESS">#arrow_dir#</cfif>
          </td>
          <td onclick="ColdFusion.navigate('index_assessments_window.cfm?sortby=FRS_PLAN_NEXT_ASSESSMENT_DATE&orderby=#nextorderby#','index-assessments-window');">
            Assessment Due <cfif url.sortby eq "FRS_PLAN_NEXT_ASSESSMENT_DATE">#arrow_dir#</cfif>
          </td>
          <td>Method</td>
      </tr>
    </cfoutput>

    <tr><td colspan="4"><hr /></td></tr>

  	<cfoutput query="Recordset1" startRow="#StartRow_Recordset1#" maxrows="#MaxRows_Recordset1#" >
    	<cfset dueNowColor = (Recordset1.FRS_PLAN_NEXT_ASSESSMENT_DATE lte '#dateformat(NOW(),"mm/dd/yyyy")#') ? "BLUE" : "BLACK"/>

        <tr height="20px" valign="bottom"
       <!--- onmouseover="this.className='menuon';" onmouseout="this.className='menuoff';" --->
       >
      <td style="color:#dueNowColor#;" >                     
      	#Recordset1.FRS_CONTACT_ACCOUNT_NUM#</td>
        <td>#replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")#</td>
		<!---<td>#Recordset1.FRS_CONTACT_NAME#</td>--->
		<td>#dateformat(Recordset1.FRS_PLAN_NEXT_ASSESSMENT_DATE,"mm/dd/yyyy")#<br />
		#Recordset1.FRS_METHOD#<cfif #Recordset1.FRS_METHOD# eq "WWMETER"><sup onclick="javascript:ColdFusion.Window.create('wwmeter#Recordset1.rec_id#',
       				 'FRS_AssessmentWindow - #replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")# | #Recordset1.FRS_CONTACT_ACCOUNT_NUM#',
					 'FRS_WWMETER_WINDOW.cfm?recid=#Recordset1.rec_id#&formtype=#Recordset1.FRS_METHOD#&account_num=#Recordset1.FRS_ACCOUNT_NUM#&account_name=#replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")#',
						 {refreshOnShow:true,closable:true,center:true,
                         modal:false,width:400,height:350,_cf_refreshOnShow:true});" style="color:blue;cursor:pointer;"> *Edit</sup></cfif></td>
        
        <td><cfif FRS_PLAN_BILLING_METHOD_TYPE neq 5>
        </cfif>
          <img src="images/select icon.png" alt="Perform Assessment" width="21" height="20" 
          <cfif Recordset1.FRS_METHOD neq "EngRpt" >
          onClick="javascript:ColdFusion.Window.create('Assess#Recordset1.rec_id#',
       				 'FRS_AssessmentWindow - #replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")# | #Recordset1.FRS_CONTACT_ACCOUNT_NUM#',
					 'FRS_AssessmentWindow.cfm?recid=#Recordset1.rec_id#&formtype=#Recordset1.FRS_METHOD#&account_num=#Recordset1.FRS_ACCOUNT_NUM#&account_name=#replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")#',
						 {refreshOnShow:true,closable:true,center:true,
                         modal:false,width:1200,height:800,_cf_refreshOnShow:true});" width="33%" style="cursor:pointer;"
           <cfelseif Recordset1.FRS_METHOD eq "EngRpt">
           onClick="javascript:ColdFusion.Window.create('Assess#Recordset1.rec_id#',
       				 'FRS_AssessmentWindow - #replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")# | #Recordset1.FRS_CONTACT_ACCOUNT_NUM#',
					 'FRS_ENGRPT_WINDOW.cfm?recid=#Recordset1.rec_id#&formtype=#Recordset1.FRS_METHOD#&account_num=#Recordset1.FRS_ACCOUNT_NUM#&account_name=#replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")#',
						 {refreshOnShow:true,closable:true,center:true,
                         modal:false,width:400,height:350,_cf_refreshOnShow:true});" width="33%" style="cursor:pointer;"          
           </cfif>
            />
                         
                         <img src="images/memo_edit.jpg" alt="Memos" width="18" height="18" onClick="javascript:ColdFusion.Window.create('AssessMemo#Recordset1.rec_id#',
       				 'Assessment Memo',
					 'modules/FRSMemoWindow.cfm?appName=#listlast(cgi.SCRIPT_NAME,'/')#&recid=#Recordset1.rec_id#&tag=#Recordset1.FRS_CONTACT_ACCOUNT_NUM#&all=true',
						 {refreshOnShow:true,closable:true,center:true,
                         modal:false,width:500,height:350,_cf_refreshOnShow:true});">
                         

                         

                         <img src="images/document.png" alt="Past Assessments" width="18" height="18" 
                         onClick="javascript:ColdFusion.Window.create('Past#Recordset1.rec_id#',
       				 'Past Assessment Reports','./reports/FRS_PastAssessmentsWindow.cfm?account_num=#Recordset1.FRS_ACCOUNT_NUM#',
						 {refreshOnShow:true,closable:true,center:true,
                         modal:false,width:300,height:500,_cf_refreshOnShow:true});" style="cursor:pointer;" />
                         
                         <sup>#FRS_PLAN_BILLING_METHOD_TYPE#</sup>
                         
                         </td>
        
    </tr>
    <tr height=1 bgcolor="##fdfdfdfd"><td colspan="4"></td></tr>


</cfoutput>
</cfif>
</table>
<cfform action="?#cgi.QUERY_STRING#">
<cfloop index="pageNum" from="1" to="#TotalPages_Recordset1#">
<cfif PageNum_Recordset1 neq pageNum>
<cfinput type="submit" name="PageNum_Recordset1" value="#pageNum#">
<cfelse>
<cfinput type="submit" name="PageNum_Recordset1" value="#pageNum#" disabled="disabled">
</cfif>
</cfloop>
</cfform>