<!---
04/14/2025 GRO Change date installed from input text to html5 date
--->

<cfsavecontent variable="addHeader">
    <cfajaximport tags="cfgrid,cfform">

    <style type="text/css">
        tr.menuon { background-color: LIGHTBLUE; color: #FFFFFF; cursor:pointer; }
        tr.menuoff { background-color: #FFFFFF; color: #000000; cursor:pointer; }
        .x-window-mc { background-color: lightyellow; } 
    </style>
</cfsavecontent>

<cfhtmlhead text="#addHeader#"/>

<cfset objdbfunction = createobject('component','Intranet.apps.CustServ.FRS.CFCs.FRSobjects')>

<cfset varMeterType = objdbfunction.getListByKey("FRS_METER_TYPE")>
<cfset varMeterUOM = objdbfunction.getListByKey("FRS_METER_UNITS")>

<h1>Account Meter Definition</h1>

<cfoutput><p>#url.acctnum#</p></cfoutput>

<cfform>
	<cfgrid name="Sites" delete="yes" selectmode="edit" title="Account Meters" format="html" pagesize="10" height="250" width="625" striperows="yes"
			bind='cfc:CFCs.FRSobjects.getMeters({cfgridpage}, {cfgridpagesize}, {cfgridsortcolumn}, {cfgridsortdirection}, "#url.acctnum#")'
            onchange='cfc:CFCs.FRSobjects.editMeter({cfgridaction}, {cfgridrow}, {cfgridchanged})'>
		<cfgridcolumn name="rec_id" display="no"/>                                        
		<cfgridcolumn name="FRS_METER_ACCOUNT" display="no"/>                                        
		<cfgridcolumn name="FRS_METER_SERIAL" header="Serial No." />
		<cfgridcolumn name="FRS_METER_FUNCTION" header="Function" width="150"  
        	values="#ValueList(varMeterType.FRS_CTRL_VALUE,',')#" valuesdisplay="#ValueList(varMeterType.FRS_CTRL_DISP,',')#" valuesdelimiter="," />
		<cfgridcolumn name="FRS_METER_UOM" header="Unit of Measure" width="75" 
        	values="#ValueList(varMeterUOM.FRS_CTRL_VALUE,',')#" valuesdisplay="#ValueList(varMeterUOM.FRS_CTRL_DISP,',')#" valuesdelimiter="," />
		<cfgridcolumn name="FRS_METER_BASE_READING" header="Init Reading" width="100" dataalign="right"/>
		<cfgridcolumn name="FRS_METER_DATE_ACTIVE" header="Init Date" width="100" mask="99/99/9999"/>
	</cfgrid>
    
    <table cellpadding="5" cellspacing="8">
        <!---
        <tr>
            <td>Serial No.</td>
            <td>Meter Type</td>
            <td>Unit of Measure</td>
            <td>Base Reading</td>
            <td>Max Reading</td>
            <td>Date Installed</td>
        </tr>
        --->

        <tr>
            <cfinput type="hidden" name="FRS_METER_ACCOUNT" value="#url.acctnum#">
            <td>
                Serial No.<br>
                <cfinput name="FRS_METER_SERIAL" type="text"  size="15" required="yes">
            </td>
            
            <td>
                Meter Type<br>
                <cfselect name="FRS_METER_FUNCTION" query="varMeterType" display="frs_ctrl_disp" value="frs_ctrl_value"></cfselect>
            </td>

            <cfset varMeterUOM = objdbfunction.getListByKey("FRS_METER_UNITS")>

            <td>
                Unit of Measure<br>
                <cfselect name="FRS_METER_UOM" query="varMeterUOM" display="frs_ctrl_disp" value="frs_ctrl_value"></cfselect>
            </td>

            <td>
                Base Reading<br>
                <cfinput name="FRS_METER_BASE_READING" type="text" size="10" value="Base Reading"
                    onFocus="if (this.value == 'Base Reading') {this.value = '';}"onblur="if (this.value == '') {this.value = 'Base Reading';}">
            </td>

            <td>
                Max Reading<br>
                <cfselect name="FRS_METER_MAX_READING" multiple="no">
                	<option value="99999">99,999</option>
                    <option value="999999">999,999</option>
                    <option value="9999999">9,999,999</option>
                    <option value="99999999">99,999,999</option>
                    <option value="999999999">999,999,999</option>
                </cfselect>
            </td>

            <td>
                Date Installed<br>
                <!--- <cfinput name="FRS_METER_DATE_ACTIVE" type="text" size="6" required="yes" mask="99/99/9999"> --->
                <input type="date" name="FRS_METER_DATE_ACTIVE" id="FRS_METER_DATE_ACTIVE" required>
            </td>
        </tr>

        <tr>
            <td colspan="5">
                Comment:<br>
                <cfinput name="FRS_METER_COMMENT" type="text" size="60">
            </td>
            <td>
                <br>
                <cfinput type="submit" name="submit" value="add">
            </td>
        </tr>
    </table>
</cfform>

<cfif isDefined("form.submit")>
    <cfset returnResults = 
        objdbfunction.putMeter('#form.FRS_METER_ACCOUNT#', '0', '#form.FRS_METER_SERIAL#', '#form.FRS_METER_BASE_READING#', '#form.FRS_METER_UOM#', '#form.FRS_METER_FUNCTION#', '#form.FRS_METER_DATE_ACTIVE#', '#form.FRS_METER_COMMENT#', '#form.FRS_METER_MAX_READING#')>
</cfif>