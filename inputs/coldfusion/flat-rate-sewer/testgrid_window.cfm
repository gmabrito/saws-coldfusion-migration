<cfajaximport tags="cfgrid,cfform"/>

                    
                    
<cfform id="new" name="new">

    <cfgrid name="MRG" delete="yes" insert="yes" selectmode="edit" title="Meter Readings"
			format="html" sort="no" insertbutton="ADD" 
			pagesize="12" height="400" width="450"
			striperows="yes"
			bind="cfc:CFCs.FRSobjects.getMeterReadingsGrid({cfgridpage},
										{cfgridpagesize},
										{cfgridsortcolumn},
										{cfgridsortdirection},'000099020-0099021-0001','210719724')"
            onchange="cfc:CFCs.FRSobjects.editMeterReadings({cfgridaction},{cfgridrow},{cfgridchanged},'000099020-0099021-0001','1197')">
            
                                      
		<cfgridcolumn name="rec_id" display="no"/>               
		<cfgridcolumn name="FRS_METER_ACCT_NUM" display="no"/>               
		<cfgridcolumn name="FRS_METER_SERIAL_NUM" display="no"/>             
		<cfgridcolumn name="FRS_METER_READ_DATE" header="Read Date" type="date" mask="m/d/y" />
		<cfgridcolumn name="FRS_METER_READING" header="Reading"/>
		<cfgridcolumn name="FRS_METER_CONSUMPTION" header="Consumption" select="no" />
		<cfgridcolumn name="FRS_METER_PCT_CHANGE" header="Percent Chg" select="no" />
	</cfgrid>


</cfform>
    <cfdump var="#session#"/>

        <cfquery name="metersReadings" datasource="intradb">
            SELECT top 24 [REC_ID]
              ,[FRS_METER_READ_DATE]
              ,[FRS_METER_READING]
              ,[FRS_METER_CONSUMPTION]
              ,[FRS_METER_PCT_CHANGE]
              ,[FRS_METER_ENTRY_DATE]
         	FROM [dbo].[CS_FRS_METER_READINGS]

        </cfquery>

<cfdump var="#metersReadings#"/>
