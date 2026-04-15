<cfparam name="url.action" default="">

<cfset objdbfunction = createobject("component", "intranet.apps.custserv.frs.cfcs.frsobjects")>

<cfajaximport tags="cfgrid">

<cfquery  name="q_business" datasource="intradb">
    select distinct frs_contact_business
    from cs_frs_contacts
</cfquery>
<!--- <cfdump var="#q_business#" top="10"><br> --->

<cfform name="search" method="post" preservedata="yes">
  <table>
    <tr>
      <td>Account/Business</td>
      <td>
        <input list="biz_list" name="biz_name" id="biz_name" size="50">
        <datalist id="biz_list">
          <cfloop query="q_business">
            <option value="<cfoutput>#q_business.frs_contact_business#</cfoutput>">
          </cfloop>
        </datalist>
      </td>
      <td>
        <cfinput type="submit" name="submit" value="search">
      </td>
    </tr>    
  </table>
</cfform><br>

<cfif isdefined("form.submit") or isDefined("PageNum_Recordset1")>
  <cfparam name="PageNum_Recordset1" default="1">

  <cfset MaxRows_Recordset1 = 1500>

  <cfset Recordset1 = objdbfunction.getAllSites(1, MaxRows_Recordset1, "FRS_CONTACT_BUSINESS", "ASC", "", "#form.BIZ_NAME#")>

  <cfset StartRow_Recordset1 = Min((PageNum_Recordset1-1)*MaxRows_Recordset1+1,Max(Recordset1.RecordCount,1))>
  <cfset EndRow_Recordset1 = Min(StartRow_Recordset1+MaxRows_Recordset1-1,Recordset1.RecordCount)>
  <cfset TotalPages_Recordset1 = Ceiling(Recordset1.RecordCount/MaxRows_Recordset1)>

  <center>
    <cfpod name="search" width="1200" height="600">
      <table width="100%" border="1" cellpadding="2" style="border-collapse:collapse;">
        <cfif recordset1.recordcount eq 0>
          <tr>
            <td colspan="6">No match found</td>
          </tr>
        </cfif>

        <cfif recordset1.recordcount neq 0>
          <cfloop query="Recordset1" startRow="#StartRow_Recordset1#" endrow="#MaxRows_Recordset1#">
            <tr valign="bottom">
    		      <cfoutput query="Recordset1" startRow="#StartRow_Recordset1#" maxRows="3">
    		        <cfset title = replace(Recordset1.FRS_CONTACT_BUSINESS,"'","")>

                <td onmouseover="this.className='menuon';" onmouseout="this.className='menuoff';">
                  <!--- <cfif session.user_id eq "goberlag"> --->
                  <div>
                    <div style="float:left;">
                      #Recordset1.FRS_CONTACT_ACCOUNT_NUM#<br>
                      #left(replace(Recordset1.FRS_CONTACT_BUSINESS,"'",""),35)#<br>
                      #left(Recordset1.FRS_CONTACT_ADDRESS,35)#<br>
                      #left(Recordset1.FRS_CONTACT_NAME,35)#<br>
                    </div>
                  </div>

                  <!--- <cfelse> --->
                    <!---
                    <div
                      onClick="javascript:ColdFusion.Window.create('det#Recordset1.rec_id#',
                      'DETAILS - #title#', 'FRS_MaintWindow.cfm?recid=#Recordset1.rec_id#&formtype=#Recordset1.FRS_METHOD#&account_num=#Recordset1.FRS_ACCOUNT_NUM#',
                      {refreshOnShow:true,closable:true,center:true,modal:false,width:1500,height:800,_cf_refreshOnShow:true});"
                      width="33%" style="cursor:pointer;">
                      #Recordset1.FRS_CONTACT_ACCOUNT_NUM#<br>
                      #replace(Recordset1.FRS_CONTACT_BUSINESS,"'","")#<br>
                      #Recordset1.FRS_CONTACT_NAME#<br>
                      #Recordset1.FRS_CONTACT_ADDRESS#<br>
                    </div>
                    --->
                  <!--- </cfif> --->

                  <!--- <hr> --->

                  <div onClick="javascript:ColdFusion.Window.create('det#Recordset1.rec_id#',
                    'DETAILS - #title#','FRS_MaintWindow.cfm?recid=#Recordset1.rec_id#&formtype=#Recordset1.FRS_METHOD#&account_num=#Recordset1.FRS_ACCOUNT_NUM#',
                    {refreshOnShow:true,closable:true,center:true,modal:false,width:1500,height:800,_cf_refreshOnShow:true});"
                    width="33%" style="color:green;cursor:pointer;" align="right">
                    Details
                  </div>

                  <div onClick="javascript:ColdFusion.Window.create('Edit#Recordset1.rec_id#',
                      'Edit Account','FRS_Acct_Maint_window.cfm?acctnum=#Recordset1.FRS_ACCOUNT_NUM#',
                      {refreshOnShow:true,closable:true,center:true,modal:false,width:1500,height:800,_cf_refreshOnShow:true});"
                      style="color:green;cursor:pointer;font-style:italic;" align="right">
                      Account
                  </div>

                  <cfset dueNowColor = (Recordset1.FRS_PLAN_NEXT_ASSESSMENT_DATE lte '#dateformat(NOW(),"mm/dd/yyyy")#') ? "RED" : "BLUE"/>

                  <!---
                  <div
                    <cfif Recordset1.FRS_METHOD neq "EngRpt">
                      onClick="javascript:ColdFusion.Window.create('Assess#Recordset1.rec_id#',
                   			'FRS_AssessmentWindow - #replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")# | #Recordset1.FRS_CONTACT_ACCOUNT_NUM#',
            					  'FRS_AssessmentWindow.cfm?recid=#Recordset1.rec_id#&formtype=#Recordset1.FRS_METHOD#&account_num=#Recordset1.FRS_ACCOUNT_NUM#&account_name=#replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")#',
            						 {refreshOnShow:true,closable:true,center:true,modal:false,width:1500,height:900,_cf_refreshOnShow:true});"
                         width="33%" style="cursor:pointer;"
                    <cfelseif Recordset1.FRS_METHOD eq "EngRpt">
                      onClick="javascript:ColdFusion.Window.create('Assess#Recordset1.rec_id#',
                   			'FRS_AssessmentWindow - #replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")# | #Recordset1.FRS_CONTACT_ACCOUNT_NUM#',
            					  'FRS_ENGRPT_WINDOW.cfm?recid=#Recordset1.rec_id#&formtype=#Recordset1.FRS_METHOD#&account_num=#Recordset1.FRS_ACCOUNT_NUM#&account_name=#replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")#',
            						 {refreshOnShow:true,closable:true,center:true,modal:false,width:1500,height:900,_cf_refreshOnShow:true});"
                         width="33%" style="cursor:pointer;"          
                    </cfif> 
                    style="color:#dueNowColor#;cursor:pointer;font-style:italic;" align="right">
                    Assessment
                  </div>
                  --->

                  <cfif Recordset1.FRS_METHOD eq "cosa">
                    <div align="right">
                      #Recordset1.FRS_METHOD#
                    </div>
                  <cfelseif Recordset1.FRS_METHOD neq "EngRpt">
                    <div onClick="javascript:ColdFusion.Window.create('Assess#Recordset1.rec_id#',
                      'FRS_AssessmentWindow - #replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")# | #Recordset1.FRS_CONTACT_ACCOUNT_NUM#',
                      'FRS_AssessmentWindow.cfm?recid=#Recordset1.rec_id#&formtype=#Recordset1.FRS_METHOD#&account_num=#Recordset1.FRS_ACCOUNT_NUM#&account_name=#replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")#',
                       {refreshOnShow:true,closable:true,center:true,modal:false,width:1500,height:900,_cf_refreshOnShow:true});"
                       width="33%" style="cursor:pointer;" style="color:#dueNowColor#;cursor:pointer;font-style:italic;" align="right">
                      Assessment
                    </div>
                  <cfelseif Recordset1.FRS_METHOD eq "EngRpt">
                     <div onClick="javascript:ColdFusion.Window.create('Assess#Recordset1.rec_id#',
                      'FRS_AssessmentWindow - #replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")# | #Recordset1.FRS_CONTACT_ACCOUNT_NUM#',
                      'FRS_ENGRPT_WINDOW.cfm?recid=#Recordset1.rec_id#&formtype=#Recordset1.FRS_METHOD#&account_num=#Recordset1.FRS_ACCOUNT_NUM#&account_name=#replace(Recordset1.FRS_CONTACT_BUSINESS,"'","&lsquo;")#',
                       {refreshOnShow:true,closable:true,center:true,modal:false,width:1500,height:900,_cf_refreshOnShow:true});"
                       width="33%" style="cursor:pointer;" style="color:#dueNowColor#;cursor:pointer;font-style:italic;" align="right">
                      Assessment
                    </div>
                  </cfif>

                </td>
              </cfoutput>
            </tr>

            <cfset StartRow_Recordset1 = StartRow_Recordset1 + 3>
          </cfloop>
        </cfif>
      </table>
    </cfpod>

    <cfform name="searchFormResults">
      <table width="95%" border="0" cellpadding="1" cellspacing="2">
      	<tr>
          <td colspan="3" align="left" width="50%" valign="top">
            <em><cfoutput>#Recordset1.RecordCount# records match</cfoutput></em>
          </td>
          <td colspan="4" align="right" width="50%">
            <cfif TotalPages_Recordset1 gt 1>
              <cfloop from="1" to="#TotalPages_Recordset1#" index="numpage">
                <cfinput type="submit" name="PageNum_Recordset1" value="#numpage#">
              </cfloop>

              <cfinput type="hidden" name="biz_name" value="#form.BIZ_NAME#">
            </cfif>
          </td>
        </tr>
      </table>
    </cfform>

  </center>

  <!--- <cfif session.user_id eq "goberlag">
    <cfdump var="#Recordset1#">
  </cfif> --->
</cfif>