<cfset navTitle="Flat Rate Access Control List">

<cfinclude template="FRS_Menu.cfm">

<cfif acl.FRS_USER_ACCESS_LEVEL gte 2>
   <h1 align="center">Edit FRS Access</h1><br />

   <cfset allACL = objdbfunction.getAllFRSstaff()>
   <cfset ACLlevels = objdbfunction.getListByKey('FRS_ACCESS')/>

   <table width="80%" cellpadding="2" align="center">
      <tr>
         <td width="10%"></td>
         <td>Authorized User</td>
         <td>Access Level</td>
      </tr>

      <cfoutput query="allACL">
         <tr height="1px">
            <td colspan="3" bgcolor="black"></td>
         </tr>

         <tr>
            <td width="10%">
               <!--- <img src="https://ezlink.saws.org/intranet/images/Employees/images/P10000#FRS_USER_EMP_ID#.jpg" width="47px" height="62px"> --->
               <img src="/intranet/images/Employees/images/P10000#FRS_USER_EMP_ID#.jpg" width="47px" height="62px">
            </td>

            <cfform name="acl#FRS_USER_EMP_ID#">
               <cfinvoke component="Intranet.apps.common.employee" method="whoIs" returnvariable="whoIsRet">
                  <cfinvokeargument name="empid" value="#FRS_USER_EMP_ID#"/>
               </cfinvoke>    
                
               <td>#whoIsRet.EMP_FIRST_NAME# #whoIsRet.EMP_LAST_NAME#</td>
               <td>
                  <cfselect name="FRS_USER_ACCESS_LEVEL" query="ACLlevels" display="FRS_CTRL_DISP" value="FRS_CTRL_VALUE" selected="#allACL.FRS_USER_ACCESS_LEVEL#">
                     <option value="0">Remove</option>
                  </cfselect>
               </td>
            </cfform>
         </tr>
      </cfoutput>
   </table>
</cfif>