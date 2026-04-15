
<cflayout name="outerlayout" type="vbox"> 
    <cflayoutarea style="height:100%;"> 
        <cflayout name="thelayout" type="border" style="height:490;"> 
            <!--- The 100% height style ensures that the background color fills  
                the area. ---> 

            <cflayoutarea title="Function" position="left" 
                    closable="false" 
                    collapsible="yes" name="left" splitter="true" 
                    style="height:100%"> 
            <p>&nbsp;</p>
            <p>&nbsp;</p>
                                
            <p style="cursor:pointer;" onClick="ColdFusion.navigate('FRS_ACLEDITWindow.cfm','centerarea');">Access Control</p>
            <p>&nbsp;</p>
            <p style="cursor:pointer;" onClick="ColdFusion.navigate('FRS_LOGviewWindow.cfm','centerarea');">View Access Logs</p>
            <p>&nbsp;</p>
            <p style="cursor:pointer;" onClick="ColdFusion.navigate('modules/Assessment_Recall_window.cfm','centerarea');">Rollback Assessment</p>
            <p>&nbsp;</p>
            <p style="cursor:pointer;" onClick="ColdFusion.navigate('FRS_RateMgtWindow.cfm','centerarea');ColdFusion.Layout.collapseAccordion('thelayout', 'left')">Update Rates</p>
            <p>&nbsp;</p>
            <p style="cursor:pointer;" onClick="ColdFusion.navigate('FRS_ConfigWindow.cfm' ,'centerarea'); ColdFusion.Layout.collapseAccordion('thelayout', 'left')">Configuration</p>
            <p>&nbsp;</p>
            </cflayoutarea> 
            <cflayoutarea position="center"  name="centerarea" bindonload="true" source="FRS_ACLEDITWindow.cfm"
                    style="background-color:##FFFF00; height:100%"> 
				Target Area
            </cflayoutarea> 

 
        </cflayout> 
    </cflayoutarea> 
 <!---
    <cflayoutarea style="height:100; ; background-color:##FFCCFF"> 
        <h3>Change the state of Area 2</h3> 
        <cfform> 
            <cfinput name="expand2" width="100" value="Expand Area 2" type="button"  
                onClick="ColdFusion.Layout.expandArea('thelayout', 'left');"> 
            <cfinput name="collapse2" width="100" value="Collapse Area 2" type="button" 
                onClick="ColdFusion.Layout.collapseArea('thelayout', 'left');"> 
            <cfinput name="show2" width="100" value="Show Area 2" type="button"  
                onClick="ColdFusion.Layout.showArea('thelayout', 'left');"> 
            <cfinput name="hide2" width="100" value="Hide Area 2" type="button"  
                onClick="ColdFusion.Layout.hideArea('thelayout', 'left');"> 
        </cfform> 
    </cflayoutarea> --->
</cflayout> 
