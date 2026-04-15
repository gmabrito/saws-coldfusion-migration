<cfif session.user_id eq "goberlag">
    frsMemoFormWindow.cfm<br>
    <!--- <cfdump var="#url#" label="url"><br> --->
    <!--- <cfdump var="#form#" label="form"><br> --->
    <!--- <cfabort> --->
</cfif>

<cfform name="appMemoEdit#url.windowsname#">
    <cfoutput>
        <table>
            <tr>
                <td>
                    <!--- <cftextarea name="memo" width="475" height="300" maxlength="1024" cols="50" rows="10"></cftextarea> --->
                    <cftextarea name="memo" maxlength="1024" cols="140" rows="20"></cftextarea>
                </td>
                    
                <cfinput type="hidden" name="recid" value="#url.recid#">
                <cfinput type="hidden" name="appName" value="#url.appName#">
                <cfinput type="hidden" name="tag" value="#url.tag#">
            </tr>

            <tr></tr>

            <tr>
                <td>
                    <cfinput type="button" name="submit" value="Submit Memo" 
                	   onClick="submitMemoForm('appMemoEdit#url.windowsname#','win#url.windowsname#');
                        ColdFusion.navigate('modules/FRSMemoListWindow.cfm?tag=#url.tag#&recid=#url.recid#&appName=#url.appName#&windowsname=#url.windowsname#','mycontentdiv#url.windowsname#');">
                </td>
            </tr>
        </table>
    </cfoutput>
</cfform>