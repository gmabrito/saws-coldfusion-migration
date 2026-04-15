<cfcomponent>
    <cfset this.dsn = "intradb">

    <!--- ------------------------------------------------------------------------------------------------- --->
    <!--- FUNCTION : getProgramCtrlLists.                                                                   --->
    <!--- Based on the arguments passed, this function retrieves the control values used in the program for --->
    <!--- list and other application configuration objectives.                                              --->
    <!--- ------------------------------------------------------------------------------------------------- --->
    <cffunction name="getProgramCtrlLists" access="public" returntype="query">
        <cfquery name="getProgramCtrlListRet" datasource="intradb" cachedwithin="#createtimespan(0,0,0,30)#">
            SELECT *
            FROM CS_FRS_PROGRAM_CTRL
            WHERE FRS_CTRL_TYPE = 'LI' or FRS_CTRL_TYPE = 'CFG'
        </cfquery>

		<cfreturn getProgramCtrlListRet>
	</cffunction>

    <!--- ------------------------------------------------------------------------------------------------- --->
    <!--- FUNCTION : getListByKey.                                                                          --->
    <!--- Returns list from all getProgramCtrlLists results matching key                                    --->
    <!--- ------------------------------------------------------------------------------------------------- --->    
	<cffunction name="getListByKey" access="public" returntype="query">
		<cfargument name="key" type="string" required="yes">
        
        <cfset workingQuery = getProgramCtrlLists()>
        
        <cfquery name="ListRet" dbtype="query">
            SELECT *
            FROM workingQuery
            WHERE FRS_CTRL_KEY = '#ARGUMENTS.KEY#'
        </cfquery>
        
    	<cfreturn ListRet>
	</cffunction>    

    <!--- ------------------------------------------------------------------------------------------------- --->
    <!--- FUNCTION : putListByKey.                                                                          --->
    <!--- Puts record new control value by recid                                                            --->
    <!--- ------------------------------------------------------------------------------------------------- --->    
	<cffunction name="putListByKey" access="public" returntype="query">
		<cfargument name="RECID" type="string" required="yes">
		<cfargument name="newctrlvalue" type="string" required="yes">
                
        <cfquery name="PutListRet" datasource="#this.dsn#">
        update CS_FRS_PROGRAM_CTRL
        set FRS_CTRL_VALUE = '#ARGUMENTS.newctrlvalue#'
        WHERE REC_ID = '#ARGUMENTS.RECID#';
        SELECT * FROM CS_FRS_PROGRAM_CTRL
        WHERE REC_ID = '#ARGUMENTS.RECID#';
        </cfquery>
        
    	<cfreturn PutListRet>
	</cffunction>        
    
    <!--- ------------------------------------------------------------------------------------------------- --->
    <!--- FUNCTION : getCtrlCoreValue.                                                                      --->
    <!--- Based on the arguments passed, this function retrieves the core control values used in application--->
    <!--- such as current sewer rate, default basis, and other default values required.  The function returns--->
    <!--- a single value based on the current date being greater than the effecive date.                    --->
    <!--- ------------------------------------------------------------------------------------------------- --->
    <cffunction name="getCtrlCoreValue" access="public" returntype="query">
		<cfargument name="key" type="string" required="yes">
		<cfargument name="usedate" type="string" required="no" default="">
        
        <cfquery name="getProgramCtrlListRet" datasource="intradb" >
        	SELECT <cfif usedate neq "">top 1 </cfif> * FROM CS_FRS_PROGRAM_CTRL
            WHERE FRS_CTRL_TYPE = 'CR' and FRS_CTRL_KEY = '#ARGUMENTS.KEY#' <cfif usedate neq ""> and FRS_CTRL_EFFECTIVE_DATE <= '#usedate#'</cfif>
            order by FRS_CTRL_EFFECTIVE_DATE desc
            
        </cfquery>

		<cfreturn getProgramCtrlListRet>
	</cffunction>

    <!--- -------------------------------------------------------------------------------------------------- --->
    <!--- FUNCTION : ApplyCtrlCoreValue.                                                                     --->
    <!--- Based on the arguments passed, this function stores the core control values used in application    --->
    <!--- such as current sewer rate, default basis, and other default values required.  The function returns--->
    <!--- a single value based on the key conditions provided                                                --->
    <!--- -------------------------------------------------------------------------------------------------- --->
    <cffunction name="ApplyCtrlCoreValue" access="public" returntype="query">
		<cfargument name="key" type="string" required="yes">
		<cfargument name="usedate" type="string" required="no" default="">
		<cfargument name="newvalue" type="string" required="no" default="">
        
        <cfquery name="chkProgramCtrlListRet" datasource="intradb" >
        	SELECT * FROM CS_FRS_PROGRAM_CTRL
            WHERE FRS_CTRL_TYPE = 'CR' and FRS_CTRL_KEY = '#ARGUMENTS.KEY#' and FRS_CTRL_EFFECTIVE_DATE = '#usedate#'            
        </cfquery>
        
        <cfquery name="ApplyCtrlCoreValueRet" datasource="#this.dsn#">

        <cfif chkProgramCtrlListRet.recordcount eq 0>
        	INSERT 
            INTO CS_FRS_PROGRAM_CTRL
             (FRS_CTRL_TYPE,FRS_CTRL_KEY,FRS_CTRL_VALUE,FRS_CTRL_EFFECTIVE_DATE) VALUES
             ('CR','#ARGUMENTS.KEY#','#ARGUMENTS.NEWVALUE#','#ARGUMENTS.USEDATE#');
        <cfelse>
        	UPDATE CS_FRS_PROGRAM_CTRL
            SET FRS_CTRL_VALUE = '#ARGUMENTS.NEWVALUE#'
            WHERE FRS_CTRL_TYPE = 'CR' AND FRS_CTRL_KEY ='#ARGUMENTS.KEY#' AND FRS_CTRL_EFFECTIVE_DATE = '#ARGUMENTS.USEDATE#';
        </cfif>
        	SELECT * FROM CS_FRS_PROGRAM_CTRL
            WHERE FRS_CTRL_TYPE = 'CR' and FRS_CTRL_KEY = '#ARGUMENTS.KEY#' and FRS_CTRL_EFFECTIVE_DATE = '#usedate#'   
        </cfquery>

		<cfreturn ApplyCtrlCoreValueRet>
	</cffunction>

    <!--- ------------------------------------------------------------------------------------------------- --->
    <!--- FUNCTION : putAuditLog.                                                                           --->
    <!--- Writes text entries to the log file for the employee id passed in Arguments.                      --->
    <!--- ------------------------------------------------------------------------------------------------- --->    
     <cffunction name="putAuditLog" access="remote" returntype="string">
        <cfargument name="empid" default="" required="yes">
        <cfargument name="appid" default="" required="yes">
        <cfargument name="message" default="" required="yes">
        <cfargument name="level" default="" required="yes">
        <cfargument name="accountnum" default="" required="no">
        
        <cfquery name="putAuditLogEntry" datasource="intradb">
            INSERT INTO [dbo].[CS_FRS_AUDITLOG]
                       ([FRS_ACTIVITY_EMP_ID]
                       ,[FRS_ACTIVITY_TIMESTAMP]
                       ,[FRS_ACTIVITY_APPID]
                       ,[FRS_ACTITITY_LOGENTRY]
                       ,[FRS_ACTIVITY_LEVEL]
                       ,[FRS_ACTIVITY_ACCOUNT])
                 VALUES
                       ('#ARGUMENTS.EMPID#'
                       ,'#dateformat(now())# #timeformat(now())#'
                       ,'#ARGUMENTS.appid#'
                       ,'#ARGUMENTS.message#'
                       ,'#ARGUMENTS.level#'
                       ,'#ARGUMENTS.accountnum#')
        </cfquery>

        <cfreturn "TRUE">
    </cffunction>

    <!--- ------------------------------------------------------------------------------------------------- --->
    <!--- FUNCTION : getFRSACL.                                                                             --->
    <!--- Read the Access Control List value for a employee                                                 --->
    <!--- ------------------------------------------------------------------------------------------------- --->    
    <cffunction name="getFRSACL" access="public" returntype="query">
        <cfquery name="getFRSACLret" datasource="intradb" cachedwithin="#createtimespan(0,0,0,30)#">
        	SELECT *
            FROM CS_FRS_ACL
            WHERE FRS_USER_EMP_ID = '#SESSION.EMP_ID#'
        </cfquery>

		<cfreturn getFRSACLret>
	</cffunction>
    
    <!--- ------------------------------------------------------------------------------------------------- --->
    <!--- FUNCTION : getFRSassessments.                                                                     --->
    <!--- Get the assessments for customer by date desc                                                     --->
    <!--- ------------------------------------------------------------------------------------------------- --->    
    <cffunction name="getFRSassessments" access="public" returntype="query">
        <cfargument name="account_num" type="string" required="yes">
        
        <cfquery name="getFRSassessmentsRet" datasource="intradb" >
        	SELECT * FROM CS_FRS_BILLING_ASSESSMENTS
            WHERE FRS_BILLING_ACCT_NUM = '#arguments.account_num#'
            order by FRS_BILLING_ASSESSMENT_DATE desc
        </cfquery>

		<cfreturn getFRSassessmentsRet>
	</cffunction>

    <!--- ------------------------------------------------------------------------------------------------- --->
    <!--- FUNCTION : calcSewerCharge.                                                                       --->
    <!--- Function to calculate the sewer charge for a customer                                             --->
    <!--- ------------------------------------------------------------------------------------------------- --->    
    <cffunction name="calcSewerCharge" access="public" returntype="numeric">
		<cfargument name="iclocl" default="" hint="" required="yes">
		<cfargument name="meter_size_code" default="1" hint="" required="yes">
		<cfargument name="Consumption" default="" hint="" required="yes">
		<cfargument name="PLAN_BASIS" default="" hint="" required="yes">
		<cfargument name="calcdate" default="" hint="" required="yes">
        
        <cfset MinCharges = getCtrlCoreValue("FRS_SWR_AVAIL_IOCL#iclocl#",calcdate).FRS_CTRL_VALUE>
        <cfset TierValues = getCtrlCoreValue("FRS_BILL_RATE_TIERS",calcdate).FRS_CTRL_VALUE>
        <cfset TierRates = getCtrlCoreValue("FRS_BILL_RATE_OCL#iclocl#",calcdate).FRS_CTRL_VALUE>
        
        <!--- set first value to calculate --->
        <cfset calcConsumption = (ARGUMENTS.consumption)*748.1> 

		<cfset MinCharge =  listgetat(MinCharges,ARGUMENTS.meter_size_code)>
        <cfset SewerCharge = MinCharge>
        
        <cfloop from="#listlen(TierValues)#" to="1" step="-1" index="TierNdx">
        	<cfif calcConsumption gt listgetat(TierValues,TierNDX)>
            	<cfset SewerCharge = SewerCharge + ( ( (calcConsumption - listgetat(TierValues,TierNDX) ) * listgetat(TierRates,TierNDX) )<!---*(arguments.PLAN_BASIS*.01)--->) >
                <cfset calcConsumption = listgetat(TierValues,TierNDX)>
            </cfif>        
        </cfloop>

		<cfreturn SewerCharge>
	</cffunction>    

    <!--- ------------------------------------------------------------------------------------------------- --->
    <!--- FUNCTION : getEmployee.                                                                           --->
    <!--- Retreives employee information from the devserver database                                          --->
    <!--- ------------------------------------------------------------------------------------------------- --->    
	<cffunction name="getEmployee" output="false" access="public" returntype="query">
		<cfargument name="EMP_ID" default="1" hint="Argument for EMP_ID." required="yes">
		<cfset var Employee = "" >

		<cfquery name="Employee" datasource="intradb" cachedwithin="#createtimespan(0,0,5,0)#">
				SELECT *, EMP_LAST_NAME + ', ' + EMP_FIRST_NAME AS EMP_FULL_NAME
				FROM dbo.EMPLOYEES
				WHERE EMP_ID = <cfqueryparam value="#Arguments.EMP_ID#" cfsqltype="cf_sql_varchar"> 
		  </cfquery>

		<cfreturn Employee>
	</cffunction>

    <!--- ------------------------------------------------------------------------------------------------- --->
    <!--- FUNCTION : getAllEmployees.                                                                       --->
    <!--- Retreives all employees for use in drop-down list when applicable                                 --->
    <!--- ------------------------------------------------------------------------------------------------- --->    
	<cffunction name="getAllEmployees" output="false" access="public" returntype="query">
		<cfargument name="DEP_ID" default="1" hint="Argument for DEP_ID." required="yes">
		<cfset var getAllEmployeesRet = "" >

		<cfquery name="getAllEmployeesRet" datasource="intradb" cachedwithin="#createtimespan(0,0,5,0)#">
				SELECT *, EMP_LAST_NAME + ', ' + EMP_FIRST_NAME AS EMP_FULL_NAME
				FROM dbo.EMPLOYEES
				ORDER BY EMP_LAST_NAME, EMP_FIRST_NAME
				<!---WHERE EMP_ID = <cfqueryparam value="#Arguments.EMP_ID#" cfsqltype="cf_sql_numeric"> --->
		  </cfquery>

		<cfreturn getAllEmployeesRet>
	</cffunction>	

    <!--- ------------------------------------------------------------------------------------------------- --->
    <!--- FUNCTION : getAllFRSstaff.                                                                        --->
    <!--- Retreives all employees with access to the FRS system                                             --->
    <!--- ------------------------------------------------------------------------------------------------- --->    
	<cffunction name="getAllFRSstaff" output="false" access="public" returntype="query">
		<cfquery name="getAllFRSstaffRet" datasource="intradb">
			SELECT * from CS_FRS_ACL
		</cfquery>

		<cfreturn  getAllFRSstaffRet>
    </cffunction>

    <!--- ------------------------------------------------------------------------------------------------- --->
    <!--- FUNCTION : getAllAuditLog.                                                                        --->
    <!--- Retreives all log entries from the FRS Auditlog table                                             --->
    <!--- ------------------------------------------------------------------------------------------------- --->        
	<cffunction name="getAllAuditLog" output="false" access="public" returntype="query">
    	<cfargument name="accountnum" default="" type="string" required="no">

		<cfquery name="getAllAuditLogRet" datasource="intradb">
			SELECT * from CS_FRS_AUDITLOG
            <cfif accountnum neq "">where FRS_ACTIVITY_ACCOUNT = '#arguments.accountnum#'</cfif>
            order by rec_id desc
		</cfquery>

		<cfreturn  getAllAuditLogRet>
    </cffunction>

    <!--- ------------------------------------------------------------------------------------------------- --->
    <!--- Retreives all FRS accounts for use in Grid                                                        --->
    <!--- ------------------------------------------------------------------------------------------------- --->        
    <cffunction name="getAllSites" access="remote" returntype="query">
        <cfargument name="page" type="numeric" required="yes">
        <cfargument name="pageSize" type="numeric" required="yes">
        <cfargument name="gridsortcolumn" type="string" required="no" default="">
        <cfargument name="gridsortdir" type="string" required="no" default="">
        <cfargument name="siteStatus" type="string" required="no" default="">
        <cfargument name="ACCTNUM" type="string" required="no" default="">

        <cfset var sites="">

        <cfquery name="allSitesRet" datasource="intradb">
            SELECT *
            FROM VW_CS_FRS_ACCOUNTS
            where 1=1 
            <cfif ARGUMENTS.ACCTNUM neq "">
                and FRS_CONTACT_ACCOUNT_NUM = '#arguments.ACCTNUM#'
                or FRS_CONTACT_BUSINESS like '#arguments.ACCTNUM#%'
                or FRS_CONTACT_NAME like '%#arguments.ACCTNUM#%'
            </cfif>
            <cfif ARGUMENTS.SITESTATUS eq "ASSESS">
                and FRS_PLAN_NEXT_ASSESSMENT_DATE <= '#dateformat(NOW(),"mm/dd/yyyy")#'
            </cfif>
            <cfif ARGUMENTS.SITESTATUS eq "INSPECT">
                and FRS_PLAN_NEXT_INSPECTION_DATE <=  '#dateformat(NOW(),"mm/dd/yyyy")#'
            </cfif>        
            <cfif ARGUMENTS.gridsortcolumn neq "" and ARGUMENTS.gridsortdir NEQ "">
                ORDER BY #ARGUMENTS.gridsortcolumn# #ARGUMENTS.gridsortdir#
            </cfif>
        </cfquery>

        <cfreturn allSitesRet>
    </cffunction>
       
    <cffunction name="getSites" access="remote" returntype="struct">
        <cfargument name="page" type="numeric" required="yes">
        <cfargument name="pageSize" type="numeric" required="yes">
        <cfargument name="gridsortcolumn" type="string" required="no" default="">
        <cfargument name="gridsortdir" type="string" required="no" default="">
        <cfargument name="ACCTNUM" type="string" required="no" default="">

        <!--- Local variables --->
        <cfset var sites="">

        <!--- Get data --->
        <cfquery name="sites" datasource="#THIS.dsn#">
            SELECT FRS_SITE_ID,FRS_SITE_DESC,FRS_SITE_ADDRESS,FRS_SITE_CITY,FRS_SITE_ZIP,FRS_CONTACT_NAME
            FROM CS_FRS_SITES
            where FRS_SITE_ACCOUNT_NUM = '#arguments.ACCTNUM#'
            <cfif ARGUMENTS.gridsortcolumn NEQ ""
                and ARGUMENTS.gridsortdir NEQ "">
                ORDER BY #ARGUMENTS.gridsortcolumn# #ARGUMENTS.gridsortdir#
            </cfif>
        </cfquery>

        <!--- And return it as a grid structure --->
        <cfreturn QueryConvertForGrid(artists, ARGUMENTS.page, ARGUMENTS.pageSize)>
    </cffunction>

    <cffunction name="getActiveMeters" access="remote" returntype="query">
        <cfargument name="ACCTNUM" type="string" required="YES" default="">
        <cfargument name="SERIAL" type="string" required="no" default="">
        <cfargument name="DEACTIVATED" type="STRING" required="no" default="">

        <!--- Local variables --->
        <cfset var sites="">

        <!--- Get data --->
        <cfquery name="meters" datasource="intradb"> <!--- cachedwithin="#createtimespan(0,0,0,15)#" --->
            SELECT *
              FROM CS_FRS_METERS
        	where FRS_METER_ACTIVE = 'Y'
            and FRS_METER_ACCOUNT = '#arguments.ACCTNUM#'
        	<cfif arguments.SERIAL neq "">
                AND FRS_METER_SERIAL = <cfqueryparam cfsqltype="cf_sql_varchar" value="#arguments.SERIAL#">
            </cfif>
            <cfif arguments.deactivated neq "">
                AND (FRS_METER_DEACTIVATE_DATE = '' OR FRS_METER_DEACTIVATE_DATE >= '#ARGUMENTS.DEACTIVATED#')
            </cfif>
            ORDER BY FRS_METER_ORDER
		</cfquery>

        <cfreturn meters>
	</cffunction>        

    <cffunction name="getMeters" access="remote" returntype="struct">
        <cfargument name="page" type="numeric" required="yes">
        <cfargument name="pageSize" type="numeric" required="yes">
        <cfargument name="gridsortcolumn" type="string" required="no" default="">
        <cfargument name="gridsortdir" type="string" required="no" default="">
        <cfargument name="ACCTNUM" type="string" required="no" default="">

        <!--- Local variables --->
        <cfset var sites="">

        <!--- Get data --->
        <cfquery name="meters" datasource="#THIS.dsn#">
            SELECT [REC_ID]
                  ,[FRS_METER_ACTIVE]
                  ,[FRS_METER_ACCOUNT]
                  ,[FRS_METER_SERIAL]
                  ,[FRS_METER_BASE_READING]
                  ,[FRS_METER_FINAL_READING]
                  ,[FRS_METER_UOM]
                  ,[FRS_METER_FUNCTION]
                  ,[FRS_METER_COMMENT]
                  ,[FRS_METER_DATE_ACTIVE]
              FROM [dbo].[CS_FRS_METERS]
            where FRS_METER_ACTIVE = 'Y' and FRS_METER_ACCOUNT = '#arguments.ACCTNUM#'

            <cfif ARGUMENTS.gridsortcolumn NEQ ""
                and ARGUMENTS.gridsortdir NEQ "">
                ORDER BY #ARGUMENTS.gridsortcolumn# #ARGUMENTS.gridsortdir#
            </cfif>
        </cfquery>

        <!--- And return it as a grid structure --->
        <cfreturn QueryConvertForGrid(meters, ARGUMENTS.page, ARGUMENTS.pageSize)>
    </cffunction>

    <cffunction name="putWWmeter" access="remote" returntype="any">
        <cfargument name="rec_id" type="string" required="yes" default="">
        <cfargument name="FRS_WW_TYPE" type="string" required="no" default="">
        <cfargument name="FRS_WW_CALIBRATES" type="string" required="no" default="">
        <cfargument name="FRS_WW_INSTALL_DATE" type="string" required="no" default="">
        <cfargument name="FRS_METER_COMMENT" type="string" required="no" default="">
        
        <cfquery name="UpdateWWmeters" datasource="#THIS.dsn#">
            UPDATE CS_FRS_METERS
            SET FRS_WW_TYPE = '#ARGUMENTS.FRS_WW_TYPE#',
                FRS_WW_CALIBRATES = '#ARGUMENTS.FRS_WW_CALIBRATES#',
                FRS_WW_INSTALL_DATE = '#ARGUMENTS.FRS_WW_INSTALL_DATE#',
                FRS_METER_COMMENT = '#ARGUMENTS.FRS_METER_COMMENT#'
            where REC_ID = '#arguments.REC_ID#' 
        </cfquery>

		<cfreturn>
    </cffunction>
          
    <cffunction name="PutMeter" access="remote" returntype="string">
        <cfargument name="FRS_METER_ACCOUNT" type="string" required="yes" default="">
        <cfargument name="FRS_METER_ORDER" type="string" required="yes" default="">
        <cfargument name="FRS_METER_SERIAL" type="string" required="YES" default="">
        <cfargument name="FRS_METER_BASE_READING" type="string" required="no" default="0">
        <cfargument name="FRS_METER_UOM" type="string" required="no" default="gal">
        <cfargument name="FRS_METER_FUNCTION" type="string" required="no" default="LOSS">
        <cfargument name="FRS_METER_DATE_ACTIVE" type="string" required="no" default="">
        <cfargument name="FRS_METER_COMMENT" type="string" required="no" default="">
        <cfargument name="FRS_METER_MAX_READING" type="string" required="no" default="99999999">
        <cfargument name="FRS_METER_DEACTIVATE_DATE" type="string" required="no" default="">

        <!--- Local variables --->
        <cfset var sites="">
        
        <cfquery name="getMeter" datasource="#THIS.dsn#">
            select * from CS_FRS_METERS 
            where FRS_METER_ACCOUNT = '#arguments.FRS_METER_ACCOUNT#' 
        	and FRS_METER_SERIAL = '#arguments.FRS_METER_SERIAL#'
		</cfquery>

        <!--- Get data --->
        <cfquery name="meters" datasource="#THIS.dsn#">
            INSERT INTO  [CS_FRS_METERS]
            ([FRS_METER_ACTIVE]
                  ,[FRS_METER_ACCOUNT]
                  ,[FRS_METER_ORDER]
                  ,[FRS_METER_SERIAL]
                  ,[FRS_METER_BASE_READING]
                  ,[FRS_METER_UOM]
                  ,[FRS_METER_FUNCTION]
                  ,[FRS_METER_DATE_ACTIVE]
                  ,[FRS_METER_COMMENT]
                  ,FRS_METER_MAX_READING
                  ,[FRS_METER_DEACTIVATE_DATE])
             VALUES
             ('Y',
             '#ARGUMENTS.FRS_METER_ACCOUNT#',
              '#ARGUMENTS.FRS_METER_ORDER#',
              '#ARGUMENTS.FRS_METER_SERIAL#',
              '#ARGUMENTS.FRS_METER_BASE_READING#',
              '#ARGUMENTS.FRS_METER_UOM#',
              '#ARGUMENTS.FRS_METER_FUNCTION#',
              '#ARGUMENTS.FRS_METER_DATE_ACTIVE#',
              '#ARGUMENTS.FRS_METER_COMMENT#',
              '#ARGUMENTS.FRS_METER_MAX_READING#',
              '#ARGUMENTS.FRS_METER_DEACTIVATE_DATE#');
        </cfquery>

        <cfreturn true>
    </cffunction>

    <!---
    <cffunction name="getMeterReadingsGrid" access="remote" returntype="struct">
        <cfargument name="page" type="numeric" required="yes">
        <cfargument name="pageSize" type="numeric" required="yes">
        <cfargument name="gridsortcolumn" type="string" required="no" default="FRS_METER_READING">
        <cfargument name="gridsortdir" type="string" required="no" default="desc">
        <cfargument name="ACCTNUM" type="string" required="no" default="">
        <cfargument name="METERSERIAL" type="string" required="no" default="">

    	<cfset lastAssessmentDate = getFRSassessments('#arguments.acctnum#').FRS_BILLING_ASSESSMENT_DATE/>

        <cfquery name="metersReadings" datasource="#THIS.dsn#">
            SELECT top 24 [REC_ID]
              ,[FRS_METER_READ_DATE]
              ,[FRS_METER_READING]
              ,[FRS_METER_CONSUMPTION]
              ,[FRS_METER_PCT_CHANGE]
              ,[FRS_METER_ENTRY_DATE]
         	FROM [dbo].[CS_FRS_METER_READINGS]
        	where FRS_METER_SERIAL_NUM = '#arguments.METERSERIAL#' 
            	and FRS_METER_ACCT_NUM = '#arguments.ACCTNUM#'
                <!---<cfif isDate(lastAssessmentDate) eq true>and FRS_METER_ENTRY_DATE >= '#lastAssessmentDate#'</cfif>--->
    		order by FRS_METER_READ_DATE desc
    		<!---
            <cfif ARGUMENTS.gridsortcolumn NEQ ""
            and ARGUMENTS.gridsortdir NEQ "">
            ORDER BY #ARGUMENTS.gridsortcolumn# #ARGUMENTS.gridsortdir#
            </cfif>
            --->
        </cfquery>
            
        <cfreturn QueryConvertForGrid(metersReadings, ARGUMENTS.page, ARGUMENTS.pageSize)>
    </cffunction>
    --->

    <cffunction name="getMeterReadingsGrid" access="remote" returntype="struct">
        <cfargument name="gridpage" type="numeric" required="no" default="1">
        <cfargument name="gridpagesize" type="numeric" required="no" default="24">
        <cfargument name="gridsortcolumn" type="string" required="no" default="FRS_METER_READ_DATE">
        <cfargument name="gridsortdirection" type="string" required="no" default="desc">
        <cfargument name="ACCTNUM" type="string" required="no" default="">
        <cfargument name="METERSERIAL" type="string" required="no" default="">
        <cfargument name="limit" type="numeric" required="no" default="30">
        <cfargument name="start">
        <cfargument name="_dc">

        <cftry>

        <cfquery name="metersReadings" datasource="#THIS.dsn#">
            SELECT top 24
            REC_ID,
            FRS_METER_READ_DATE,
            FRS_METER_READING,
            FRS_METER_CONSUMPTION,
            FRS_METER_PCT_CHANGE,
            FRS_METER_ENTRY_DATE
            FROM CS_FRS_METER_READINGS
            where 1=1
            and FRS_METER_SERIAL_NUM = '#arguments.METERSERIAL#' 
            and FRS_METER_ACCT_NUM = '#arguments.ACCTNUM#'
            order by FRS_METER_READ_DATE desc
        </cfquery>

        <cfif session.user_id neq "goberlag">
            <!--- <cfmail to="testuser@example.com" from="#cgi.server_name# <testuser@example.com>"
                subject="cfalert getMeterReadingsGrid #cgi.script_name# #DateTimeFormat(now(), "yyyy-mm-dd HH:nn:ss")#" type="html">
                #cgi.http_host##cgi.http_url#<br><br>
                #cgi.http_host##cgi.cf_template_path#<br><br>
                <cfdump var="#session#" label="session"><br>
                <cfdump var="#arguments#" label="arguments"><br>
                <cfdump var="#metersReadings#" label="metersReadings"><br>
                <cfdump var="#url#" label="url"><br>
                <cfdump var="#form#" label="form"><br>
                <!--- <cfdump var="#session#" label="session"><br> --->
                <cfdump var="#server#" label="server"><br>
                <cfdump var="#cgi#" label="cgi"><br>
            </cfmail> --->
        </cfif>
           
        <!--- <cfreturn QueryConvertForGrid(metersReadings, arguments.gridpage, arguments.gridpagesize)> --->
        <cfreturn QueryConvertForGrid(metersReadings, 1, 24)>

        <cfcatch>
            <cfdump var="#cfcatch#">
            <cfmail to="testuser@example.com" from="#cgi.server_name# <testuser@example.com>"
                subject="cfalert #cgi.script_name# #DateTimeFormat(now(), "yyyy-mm-dd HH:nn:ss")#" type="html">
                #cgi.http_host##cgi.http_url#<br><br>
                #cgi.http_host##cgi.cf_template_path#<br><br>
                <cfdump var="#arguments#" label="arguments"><br>
                <cfdump var="#url#" label="url"><br>
                <cfdump var="#form#" label="form"><br>
                <!--- <cfdump var="#session#" label="session"><br> --->
                <cfdump var="#server#" label="server"><br>
                <cfdump var="#cgi#" label="cgi"><br>
            </cfmail>
        </cfcatch>
        </cftry>
    </cffunction>

    <cffunction name="editMeterReadings" access="remote" returntype="string">
        <cfargument name="gridaction" type="string" required="yes" default="">
        <cfargument name="gridrow" type="struct" required="no" default="">
        <cfargument name="gridchanged" type="struct" required="no" default="">
        <cfargument name="FRS_METER_ACCT_NUM" type="string" required="no" default="">
        <cfargument name="FRS_METER_SERIAL_NUM" type="string" required="no" default="">
        <cfargument name="_CF_NOCACHE">
        <cfargument name="_CF_NODEBUG">
        <cfargument name="_CF_AJAXPROXYTOKEN">
        <cfargument name="_CF_CLIENTID">
    
        <cfif isStruct(gridrow) and isStruct(gridchanged)>
			<cfif gridaction eq "U" >
                <cfset colname=structkeylist(gridchanged)>
                <cfset value=structfind(gridchanged,#colname#)>
                
                <cfquery name="editMETERReading" datasource="#this.dsn#"> 
                    UPDATE CS_FRS_METER_READINGS 
                    SET #colname# = '#value#'
                    WHERE REC_ID = #gridrow.REC_ID#
                </cfquery>
                
				<!--- Refresh the billing asessment data if the reading is changed to ensure the correct record ID is referenced --->
				<cfset quickRefresh = getFRSbilling('#FRS_METER_ACCT_NUM#',true)>
                
                <!--- recalculate the percentages --->
				<cfset recalcrecords = recalcMeterReadings('#FRS_METER_ACCT_NUM#','#FRS_METER_SERIAL_NUM#','')>
            <cfelseif  gridaction eq "D">
                <cfquery name="editMETER" datasource="#this.dsn#"> 
                    DELETE CS_FRS_METER_READINGS
                    WHERE REC_ID = #gridrow.REC_ID#
                </cfquery> 
                
				<cfset recalcrecords = recalcMeterReadings('#FRS_METER_ACCT_NUM#','#FRS_METER_SERIAL_NUM#','')>
            <cfelseif  gridaction eq "I">
            	<cfset addReading = putMeterReadings('#FRS_METER_ACCT_NUM#','#FRS_METER_SERIAL_NUM#','#gridrow.FRS_METER_READ_DATE#','#gridrow.FRS_METER_READING#')>
                <!---
                <cfquery name="metersrEADING" datasource="#THIS.dsn#">
                    INSERT INTO CS_FRS_METER_READINGS
                </cfquery>
                --->
            </cfif>
        </cfif>

        <cfreturn true>
    </cffunction>
    
    <cffunction name="editMeter" access="remote" returntype="string">
        <cfargument name="gridaction" type="string" required="yes" default="">
        <cfargument name="gridrow" type="struct" required="no" default="">
        <cfargument name="gridchanged" type="struct" required="no" default="">
        
        <cfif isStruct(gridrow) and isStruct(gridchanged)>
                <cfif gridaction eq "U">
                    <cfset colname = structkeylist(gridchanged)>
                    <cfset value = structfind(gridchanged,#colname#)>
                    <cfquery name="editMETER" datasource="#this.dsn#"> 
                        UPDATE CS_FRS_METERS
                        SET <cfoutput>#colname#</cfoutput> = '<cfoutput>#value#</cfoutput>'
                        WHERE REC_ID = <cfoutput>#gridrow.REC_ID#</cfoutput>
                    </cfquery>
                <cfelseif gridaction eq "D">
                    <cfquery name="editMETER" datasource="#this.dsn#"> 
                        UPDATE CS_FRS_METERS
                        SET FRS_METER_ACTIVE = 'N'
                        WHERE REC_ID = <cfoutput>#gridrow.REC_ID#</cfoutput>
                    </cfquery> 
                <cfelseif  gridaction eq "I">
                    <cfquery name="meters" datasource="#THIS.dsn#">
                        INSERT INTO CS_FRS_METERS
                        (
                        FRS_METER_ACTIVE,
                        FRS_METER_ACCOUNT,
                        FRS_METER_SERIAL,
                        FRS_METER_BASE_READING,
                        FRS_METER_UOM,
                        FRS_METER_FUNCTION,
                        FRS_METER_DATE_ACTIVE
                        )
                        VALUES
                        (
                        'Y',
                        '#gridrow.FRS_METER_ACCOUNT#',
                        '#gridrow.FRS_METER_SERIAL#',
                        '#gridrow.FRS_METER_BASE_READING#',
                        '#gridrow.FRS_METER_UOM#',
                        '#gridrow.FRS_METER_FUNCTION#',
                        '#gridrow.FRS_METER_DATE_ACTIVE#'
                        )
                    </cfquery>
                </cfif>
            </cfif>

            <cfreturn true>
    </cffunction>

	<cffunction name="putBilling" access="remote" returntype="string">
    	<cfargument name="FRS_BILLING_ACCOUNT_NUM" type="string" required="yes" default="">
        <cfargument name="FRS_BILLING_TYPE" type="string" required="no" default="">
        <cfargument name="FRS_BILLING_INCOMING_CCF" type="string" required="no" default="">
        <cfargument name="FRS_BILLING_READING_DATE" type="string" required="no" default="">
        <cfargument name="FRS_BILLING_SAWS_DATE" type="string" required="no" default="">
        <cfargument name="FRS_BILLING_BILLED_BASIS" type="string" required="no" default="">
        <cfargument name="FRS_BILLING_BILLED_SEWER" type="string" required="no" default="">
        <cfargument name="FRS_BILLING_BILLED_CHARGE" type="string" required="no" default="">
        <cfargument name="FRS_BILLING_ACTUAL_LOSS" type="string" required="no" default="">
        <cfargument name="FRS_BILLING_ACTUAL_BASIS" type="string" required="no" default="">
        <cfargument name="FRS_BILLING_ACTUAL_SEWER" type="string" required="no" default="">
        <cfargument name="FRS_BILLING_ACTUAL_CHARGE" type="string" required="no" default="">
        <cfargument name="FRS_BILLING_DIFFERENCE" type="string" required="no" default="">
        <cfargument name="FRS_BILLING_USE_MONEY" type="string" required="no" default="">
        <cfargument name="FRS_BILLING_USE_BASIS" type="string" required="no" default="">
        <cfargument name="FRS_BILLING_DATE_ENTERED" type="string" required="no" default="">
    
    	<Cfset billing_low_range = dateadd("d", -14, ARGUMENTS.FRS_BILLING_READING_DATE)>
    	<Cfset billing_high_range = dateadd("d", +14, ARGUMENTS.FRS_BILLING_READING_DATE)>

		<cfquery name="findBillingRec" datasource="csweb">
            select rec_id
            from billing
            where [ACCOUNT_NUM] = '#ARGUMENTS.FRS_BILLING_ACCOUNT_NUM#'
            and cast(serv_to_date as date) between '#dateformat(billing_low_range)#' and '#dateformat(billing_high_range)#';
        </cfquery>
    	
        <cfif findBillingRec.recordcount neq 1>
            <cfreturn 'false'>
        </cfif>

        <cfif findBillingRec.recordcount eq 1>
    	   <cfquery name="putBillingRecord" datasource="#this.dsn#" timeout="999">
                INSERT INTO [dbo].[CS_FRS_BILLING_ASSESSMENTS]
                   ([FRS_BILLING_ACCT_NUM]
                   ,[FRS_BILLING_REC_ID]
                   ,[FRS_BILLING_TYPE]
                   ,[FRS_BILLING_INCOMING_CCF_OVERRIDE]
                   ,[FRS_BILLING_SEWER_CHARGE_OVERRIDE]
                   ,[FRS_BILLING_READING_DATE]
                   ,[FRS_BILLING_SAWS_DATE]
                    <!---
                    ,[FRS_BILLING_BILLED_BASIS]
                   ,[FRS_BILLING_BILLED_SEWER]
                   ,[FRS_BILLING_BILLED_CHARGE]
                    --->
                   ,[FRS_BILLING_ACTUAL_LOSS]
                   ,[FRS_BILLING_ACTUAL_BASIS]
                   ,[FRS_BILLING_ACTUAL_SEWER]
                   ,[FRS_BILLING_ACTUAL_CHARGE]
                   ,[FRS_BILLING_DIFFERENCE]
                   ,[FRS_BILLING_USE_MONEY]
                   ,[FRS_BILLING_USE_BASIS]
                   ,[FRS_BILLING_DATE_ENTERED])
                VALUES
                   ('#ARGUMENTS.FRS_BILLING_ACCOUNT_NUM#'
                   ,'#val(findBillingRec.rec_id)#'
                   ,'#val(ARGUMENTS.FRS_BILLING_TYPE)#'
                   ,'#val(ARGUMENTS.FRS_BILLING_INCOMING_CCF)#'
                   ,''
                   ,'#ARGUMENTS.FRS_BILLING_READING_DATE#'
                   ,'#ARGUMENTS.FRS_BILLING_SAWS_DATE#'
                    <!---
                    ,'#val(ARGUMENTS.FRS_BILLING_BILLED_BASIS)#'
                   ,'#val(ARGUMENTS.FRS_BILLING_BILLED_SEWER)#'
                   ,'#val(ARGUMENTS.FRS_BILLING_BILLED_CHARGE)#'
                    --->
                   ,'#val(ARGUMENTS.FRS_BILLING_ACTUAL_LOSS)#'
                   ,'#val(ARGUMENTS.FRS_BILLING_ACTUAL_BASIS)#'
                   ,'#val(ARGUMENTS.FRS_BILLING_ACTUAL_SEWER)#'
                   ,'#val(ARGUMENTS.FRS_BILLING_ACTUAL_CHARGE)#'
                   ,'#val(ARGUMENTS.FRS_BILLING_DIFFERENCE)#'
                   ,'#ARGUMENTS.FRS_BILLING_USE_MONEY#'
                   ,'#ARGUMENTS.FRS_BILLING_USE_BASIS#'
                   ,'#ARGUMENTS.FRS_BILLING_DATE_ENTERED#');
           
                    <!---
                    update VW_CS_FRS_BILLED_ACTUAL
                    set FRS_BILLING_ACTUAL_SEWER = '#val(ARGUMENTS.FRS_BILLING_ACTUAL_SEWER)#',
                   		FRS_BILLING_ACTUAL_LOSS = '#val(ARGUMENTS.FRS_BILLING_ACTUAL_LOSS)#',
                   		[FRS_BILLING_ACTUAL_BASIS] = '#val(ARGUMENTS.FRS_BILLING_ACTUAL_BASIS)#',
                   		[FRS_BILLING_ACTUAL_CHARGE] = '#val(ARGUMENTS.FRS_BILLING_ACTUAL_CHARGE)#',
                        [FRS_BILLING_USE_MONEY] ='#ARGUMENTS.FRS_BILLING_USE_MONEY#',
                        [FRS_BILLING_USE_BASIS] = '#ARGUMENTS.FRS_BILLING_USE_BASIS#',
                        [FRS_BILLING_DATE_ENTERED] = '#ARGUMENTS.FRS_BILLING_DATE_ENTERED#',
                        FRS_BILLING_DIFFERENCE = '#val(ARGUMENTS.FRS_BILLING_DIFFERENCE)#',
                        FRS_BILLING_SAWS_DATE = '#ARGUMENTS.FRS_BILLING_SAWS_DATE#'
                    where [FRS_ACCOUNT_NUM] = '#ARGUMENTS.FRS_BILLING_ACCOUNT_NUM#' and  [FRS_BILLING_BILLING_DATE] between '#dateformat(billing_low_range)#' and '#dateformat(billing_high_range)#';
                    --->
            </cfquery>

            <cfreturn 'true'>
        </cfif>
    </cffunction>

    <cffunction name="getLastMeterReadings" access="remote" returntype="query">
        <cfargument name="ACCTNUM" type="string" required="YES" default="">
        <cfargument name="SERIAL" type="string" required="no" default="">

 		<cfquery name="meterReadingRet" datasource="#this.dsn#">
            SELECT top 1 *
            FROM CS_FRS_METER_READINGS
        	where 1=1
            and FRS_METER_ACCT_NUM = '#arguments.ACCTNUM#' 
          	and FRS_METER_SERIAL_NUM = '#arguments.SERIAL#'
            order by FRS_METER_READ_DATE DESC
		</cfquery>

        <cfreturn meterReadingRet> 
	</cffunction>            

    <cffunction name="getMeterReadings" access="remote" returntype="query">
        <cfargument name="ACCTNUM" type="string" required="YES" default="">
        <cfargument name="SERIAL" type="string" required="no" default="">
        <cfargument name="SAWSSTARTDATE" type="string" required="no" default="">
        <cfargument name="SAWSENDDATE" type="string" required="no" default="">
        
        <!--- Local variables --->
        <cfset var sites="">

        <!--- Get data --->
        <cfquery name="meterReadings" datasource="#this.dsn#">
            SELECT *
            FROM CS_FRS_METER_READINGS
        	where FRS_METER_ACCT_NUM = '#arguments.ACCTNUM#' 
            <cfif arguments.serial neq "">
                and FRS_METER_SERIAL_NUM = '#arguments.SERIAL#'
            </cfif>
            <cfif arguments.SAWSSTARTDATE neq "">
                and FRS_METER_READ_DATE >= '#ARGUMENTS.SAWSSTARTDATE#'
                and FRS_METER_READ_DATE < '#ARGUMENTS.SAWSENDDATE#'
            </cfif>
            order by FRS_METER_READ_DATE DESC
		</cfquery>

        <cfreturn meterReadings>
	</cffunction>        
    
    <cffunction name="putMeterReadings" access="remote" returntype="string">
        <cfargument name="FRS_METER_ACCT_NUM" type="string" required="yes" default="">
        <cfargument name="FRS_METER_SERIAL_NUM" type="string" required="yes" default="">
        <cfargument name="FRS_METER_READ_DATE" type="string" required="yes" default="">
        <cfargument name="FRS_METER_READING" type="numeric" required="yes" default="">
        <cfargument name="REC_ID" type="numeric" required="no" default="0">

        <!--- Local variables --->
        <cfset var sites = "">
		<cfset retErrorMsg = "">
                    
        <!--- Don't allow invalid entries --->
        <cfif arguments.FRS_METER_READING lt 0>
			<cfset retErrorMsg = "Negative Value is not permitted for meter reading">
        <cfelse>

		<cfset meter_function_col = "FRS_METER_#getActiveMeters(arguments.FRS_METER_ACCT_NUM,arguments.FRS_METER_SERIAL_NUM).FRS_METER_FUNCTION#_CCF">
		<cfset meter_UOM = getActiveMeters(arguments.FRS_METER_ACCT_NUM,arguments.FRS_METER_SERIAL_NUM).FRS_METER_UOM>
        
        <!--- This section is to ensure that when a meter rolls over its max value, the new consumption is calculated correctly --->
		<cfset findMeterMax = getActiveMeters(arguments.FRS_METER_ACCT_NUM,arguments.FRS_METER_SERIAL_NUM).FRS_METER_MAX_READING>
		<cfset meter_maxread = (findMeterMax gt 0) ? findMeterMax : 99999999>
        
        <!--- Get data --->
        <cfquery name="meterReadingRet" datasource="#this.dsn#">
            SELECT *
            FROM CS_FRS_METER_READINGS
        	where 1=1
            and FRS_METER_ACCT_NUM = '#arguments.FRS_METER_ACCT_NUM#' 
            and FRS_METER_SERIAL_NUM = '#arguments.FRS_METER_SERIAL_NUM#'
            and FRS_METER_READ_DATE = '#arguments.FRS_METER_READ_DATE#'
		</cfquery>
        
        <!--- Get the prior reading to calculate actual consumption --->
        <cfquery name="meterPriorReadingRet" datasource="#this.dsn#">
            SELECT top 1 *
            FROM CS_FRS_METER_READINGS
        	where
            FRS_METER_ACCT_NUM = '#arguments.FRS_METER_ACCT_NUM#' and
            FRS_METER_SERIAL_NUM = '#arguments.FRS_METER_SERIAL_NUM#' and
            FRS_METER_READ_DATE < '#arguments.FRS_METER_READ_DATE#'
            <cfif arguments.rec_id neq "0">
                or REC_ID = arguments.REC_ID
            </cfif>
            order by FRS_METER_READ_DATE desc
		</cfquery>
        
        <cfset newConsumption = (meterPriorReadingRet.recordcount gt 0) ? (val(arguments.FRS_METER_READING) - meterPriorReadingRet.FRS_METER_READING) : 0> 

        <!--- This section is to ensure that when a meter rolls over its max value, the new consumption is calculated correctly --->            
        <cfif (newConsumption lt 0) and ((meterPriorReadingRet.FRS_METER_READING / meter_maxread) gt .40)>
        	<cfset newConsumption = (meter_maxread - meterPriorReadingRet.FRS_METER_READING + arguments.FRS_METER_READING)>
            <!--- <cfset retErrorMsg = "#arguments.FRS_METER_SERIAL_NUM# rollover "> --->
        </cfif>
        
        <!--- if this was not reasonably a rollover, then consider it a reset --->
        <cfset retErrorMsg = (newConsumption lt 0) ? "#arguments.FRS_METER_SERIAL_NUM# consumption reset" : "">
        <cfset newCCF = newConsumption / 748.1>
         
        <cfswitch expression="#ucase(meter_UOM)#">
        	<cfcase value="GAL">
				<cfset newCCF = newConsumption / 748.1>
            </cfcase>
            <cfcase value="CF">
	            <cfset newCCF = newConsumption / 100>
            </cfcase>
            <cfcase value="CCF">
            	<cfset newCCF = newConsumption>
            </cfcase>
            <cfcase value="LB">
            	<cfset newCCF = newConsumption / 8.32 / 748.1>
            </cfcase>
        </cfswitch>
            
        <cfset newPCT = 0>
        <cfif retErrorMsg neq "">
        	<!--- <cfreturn retErrorMsg> --->
            <cfset newCCF = 0>
            <cfset newConsumption = 0>
		</cfif>
                    
        <cfif newConsumption gt 0 and  meterPriorReadingRet.FRS_METER_CONSUMPTION gt 0>
        	<cfset newPCT = (newConsumption - meterPriorReadingRet.FRS_METER_CONSUMPTION) / meterPriorReadingRet.FRS_METER_CONSUMPTION * 100>
        </cfif>
      
        <!--- Add or update the meter reading --->
        <!---
        <cfquery name="putMeterRead" datasource="#this.dsn#">
			<cfif meterReadingRet.recordcount gt 0>
                UPDATE CS_FRS_METER_READINGS
                set
                FRS_METER_READ_DATE = '#ARGUMENTS.FRS_METER_READ_DATE#',
                FRS_METER_READING = #val(ARGUMENTS.FRS_METER_READING)#,
                FRS_METER_CONSUMPTION = #newConsumption#,
                FRS_METER_PCT_CHANGE = #newPCT#,
                #meter_function_col# = #newCCF#
                WHERE rec_id = #meterReadingRet.rec_id#
            <cfelse>
                INSERT INTO [dbo].[CS_FRS_METER_READINGS]
                   ([FRS_METER_ACCT_NUM]
                   ,[FRS_METER_SERIAL_NUM]
                   ,[FRS_METER_READ_DATE]
                   ,[FRS_METER_READING]
                   ,[FRS_METER_CONSUMPTION]
                   ,[FRS_METER_PCT_CHANGE]
                   ,[FRS_METER_ENTRY_DATE]
                   ,#meter_function_col#)
                VALUES
                   ('#ARGUMENTS.FRS_METER_ACCT_NUM#'
                   ,'#ARGUMENTS.FRS_METER_SERIAL_NUM#'
                   ,'#ARGUMENTS.FRS_METER_READ_DATE#'
                   ,#val(ARGUMENTS.FRS_METER_READING)#
                   ,#newConsumption#
                   ,#newPCT#
                   ,'#dateformat(now(),"mm/dd/yyyy")#'
                   ,#newCCF#)
            </cfif>
        </cfquery>
        --->

        <cfif meterReadingRet.recordcount eq 0>
            <cfquery name="putMeterRead" datasource="intradb">
                INSERT INTO CS_FRS_METER_READINGS
                   (FRS_METER_ACCT_NUM
                   ,FRS_METER_SERIAL_NUM
                   ,FRS_METER_READ_DATE
                   ,FRS_METER_READING
                   ,FRS_METER_CONSUMPTION
                   ,FRS_METER_PCT_CHANGE
                   ,FRS_METER_ENTRY_DATE
                   ,#meter_function_col#)
                VALUES
                   ('#ARGUMENTS.FRS_METER_ACCT_NUM#'
                   ,'#ARGUMENTS.FRS_METER_SERIAL_NUM#'
                   ,'#ARGUMENTS.FRS_METER_READ_DATE#'
                   ,#val(ARGUMENTS.FRS_METER_READING)#
                   ,#newConsumption#
                   ,#newPCT#
                   ,'#dateformat(now(),"mm/dd/yyyy")#'
                   ,#newCCF#)
            </cfquery>
        </cfif>

        <cfif meterReadingRet.recordcount gt 0>
            <cfquery name="putMeterRead" datasource="intradb">
                UPDATE CS_FRS_METER_READINGS
                set
                FRS_METER_READ_DATE = '#ARGUMENTS.FRS_METER_READ_DATE#',
                FRS_METER_READING = #val(ARGUMENTS.FRS_METER_READING)#,
                FRS_METER_CONSUMPTION = #newConsumption#,
                FRS_METER_PCT_CHANGE = #newPCT#,
                #meter_function_col# = #newCCF#
                WHERE rec_id = #meterReadingRet.rec_id#
            </cfquery>
        </cfif>
        
		<cfif meterReadingRet.recordcount gt 0>
			<cfthread action="run" priority="high" name="TH#left(arguments.FRS_METER_ACCT_NUM,9)##CreateUUID()#" 
            	FRS_METER_ACCT_NUM="#arguments.FRS_METER_ACCT_NUM#" FRS_METER_SERIAL_NUM="#arguments.FRS_METER_SERIAL_NUM#" meter_function="#meter_function_col#">
        	   <cfset recalcMeterReadings(FRS_METER_ACCT_NUM,FRS_METER_SERIAL_NUM,meter_function)>
            </cfthread>
        </cfif>
        
        </cfif>

        <cfreturn retErrorMsg>
	</cffunction>         


	<!--- Recalculate the percentages for all active reads when one in the middle has changed --->
    <cffunction name="recalcMeterReadings" access="remote" returntype="string">
        <cfargument name="FRS_METER_ACCT_NUM" type="string" required="YES" default="">
        <cfargument name="FRS_METER_SERIAL_NUM" type="string" required="yes" default="">
        <cfargument name="meter_function_col" type="string" required="yes" default="">
        
      	<cfset meter_function_col = "FRS_METER_#getActiveMeters(arguments.FRS_METER_ACCT_NUM,arguments.FRS_METER_SERIAL_NUM).FRS_METER_FUNCTION#_CCF">
		<cfset meter_UOM = getActiveMeters(arguments.FRS_METER_ACCT_NUM,arguments.FRS_METER_SERIAL_NUM).FRS_METER_UOM>

        <!--- This section is to ensure that when a meter rolls over its max value, the new consumption is calculated correctly --->
		<cfset findMeterMax = getActiveMeters(arguments.FRS_METER_ACCT_NUM,arguments.FRS_METER_SERIAL_NUM).FRS_METER_MAX_READING>
		<cfset meter_maxread = (findMeterMax gt 0) ? findMeterMax : 99999999>
  
        <cfquery name="getAllReadsForSerial" datasource="#this.dsn#">
			SELECT *
              FROM CS_FRS_METER_READINGS
        	where FRS_METER_ACCT_NUM = '#arguments.FRS_METER_ACCT_NUM#' 
            and FRS_METER_SERIAL_NUM = '#arguments.FRS_METER_SERIAL_NUM#'
            order by FRS_METER_READ_DATE desc, REC_ID desc
        </cfquery>

		<cfloop query="getAllReadsForSerial">
            <cfquery name="getNextsForSerial" datasource="#this.dsn#">
                SELECT top 1 *
                FROM CS_FRS_METER_READINGS
                where 1=1
                and FRS_METER_ACCT_NUM = '#FRS_METER_ACCT_NUM#' 
                and FRS_METER_SERIAL_NUM = '#FRS_METER_SERIAL_NUM#'
                and FRS_METER_READ_DATE <= '#FRS_METER_READ_DATE#' 
                and rec_id != #rec_id#
                order by FRS_METER_READ_DATE desc, rec_id desc
            </cfquery>
            
			<cfset newConsumption = (getNextsForSerial.recordcount gt 0) ?  (val(FRS_METER_READING)) - (getNextsForSerial.FRS_METER_READING) : 0> 

            <!--- This section is to ensure that when a meter rolls over its max value, the new consumption is calculated correctly --->            
            <cfif (newConsumption lt 0) and ((getNextsForSerial.FRS_METER_READING / meter_maxread) gt .50)>
            	<cfset newConsumption = (meter_maxread - getNextsForSerial.FRS_METER_READING + FRS_METER_READING)>
                <!--- <cfset retErrorMsg = "#arguments.FRS_METER_SERIAL_NUM# rollover "> --->
            </cfif>
        
            <!--- if this was not reasonably a rollover, then consider it a reset --->
            <cfset retErrorMsg = (newConsumption lt 0) ? "#arguments.FRS_METER_SERIAL_NUM# consumption reset" : "">
           
            <cfswitch expression="#ucase(meter_UOM)#">
                <cfcase value="GAL">
                    <cfset newCCF = newConsumption / 748.1>
                </cfcase>
                <cfcase value="CF">
                    <cfset newCCF = newConsumption / 100>
                </cfcase>
                <cfcase value="CCF">
                    <cfset newCCF = newConsumption>
                </cfcase>
                <cfcase value="LB">
                    <cfset newCCF = newConsumption / 8.32 / 748.1>
                </cfcase>
            </cfswitch>
                
            <cfset newPCT = 0>
            
            <cfif newConsumption gt 0 and  getNextsForSerial.FRS_METER_CONSUMPTION gt 0>
                <cfset newPCT = (newConsumption - getNextsForSerial.FRS_METER_CONSUMPTION) / getNextsForSerial.FRS_METER_CONSUMPTION * 100>
            </cfif>
            
			<cfquery name="putMeterRead" datasource="#this.dsn#">
                UPDATE CS_FRS_METER_READINGS
                set FRS_METER_CONSUMPTION = #newConsumption#, FRS_METER_PCT_CHANGE = #newPCT#, #meter_function_col# = #newCCF#
                WHERE rec_id = #rec_id#
			</cfquery>
        </cfloop>
        
        <cfreturn>
    </cffunction>

	<cffunction name="putFRSAccount" returntype="string" access="remote">
        <cfargument name="FRS_ACCOUNT_NUM" type="string" required="yes" default="">
        <cfargument name="FRS_ACTIVE_CONTACT_RECID" type="string" required="yes" default="">
        <cfargument name="FRS_ACCOUNT_FACILITY_DESC" type="string" required="yes" default="">
        <cfargument name="FRS_BUSINESS_TYPE" type="string" required="yes" default="">
        <cfargument name="FRS_METER_SIZE" type="string" required="yes" default="">
        <cfargument name="FRS_METHOD" type="string" required="yes" default="">
        <cfargument name="FRS_PLAN_BASIS" type="string" required="yes" default="">
        <cfargument name="FRS_PLAN_BOD" type="string" required="yes" default="">
        <cfargument name="FRS_PLAN_TDD" type="string" required="yes" default="">
        <cfargument name="FRS_PLAN_START_DATE" type="string" required="yes" default="">
        <cfargument name="FRS_PLAN_END_DATE" type="string" required="yes" default="">
        <cfargument name="FRS_PLAN_ASSESSMENT_FREQ" type="string" required="yes" default="">
        <cfargument name="FRS_PLAN_INSPECTION_FREQ" type="string" required="yes" default="">
        <cfargument name="FRS_PLAN_BILLING_METHOD_TYPE" type="string" required="yes" default="">
        <cfargument name="FRS_PLAN_CREATEDBY" type="string" required="yes" default="">
        <cfargument name="FRS_PLAN_NEXT_ASSESSMENT_DATE" type="string" required="yes" default="">
        <cfargument name="FRS_PLAN_NEXT_INSPECTION_DATE" type="string" required="yes" default="">
        <cfargument name="editable" type="string" required="no" default="">
    
        <cfquery name="checkFRSaccountRec" datasource="#this.dsn#">
            SELECT REC_ID
            FROM CS_FRS_ACCOUNTS
            WHERE FRS_ACCOUNT_NUM = '#ARGUMENTS.FRS_ACCOUNT_NUM#'
        </cfquery>       
        
        <cfif checkFRSaccountRec.recordcount eq 0>
            <cfquery name="putFRSaccountRec" datasource="#this.dsn#">
                 INSERT INTO [dbo].[CS_FRS_ACCOUNTS]
                           ([FRS_ACCOUNT_NUM]
                           ,[FRS_ACTIVE_CONTACT_RECID]
                           ,[FRS_ACCOUNT_FACILITY_DESC]
                           ,[FRS_BUSINESS_TYPE]
                           ,[FRS_METER_SIZE]
                           ,[FRS_METHOD]
                           ,[FRS_PLAN_BASIS]
                           ,[FRS_PLAN_BOD]
                           ,[FRS_PLAN_TDD]
                           ,[FRS_PLAN_START_DATE]
                           ,[FRS_PLAN_END_DATE]
                           ,[FRS_PLAN_ASSESSMENT_FREQ]
                           ,[FRS_PLAN_INSPECTION_FREQ]
                           ,[FRS_PLAN_BILLING_METHOD_TYPE]
                           ,[FRS_PLAN_CREATEDBY]
                           ,[FRS_PLAN_NEXT_ASSESSMENT_DATE]
                           ,[FRS_PLAN_NEXT_INSPECTION_DATE])
                     VALUES
                           ('#ARGUMENTS.FRS_ACCOUNT_NUM#'
                           ,'#ARGUMENTS.FRS_ACTIVE_CONTACT_RECID#'
                           ,'#ARGUMENTS.FRS_ACCOUNT_FACILITY_DESC#'
                           ,'#ARGUMENTS.FRS_BUSINESS_TYPE#'
                           ,'#ARGUMENTS.FRS_METER_SIZE#'
                           ,'#ARGUMENTS.FRS_METHOD#'
                           ,'#ARGUMENTS.FRS_PLAN_BASIS#'
                           ,'#ARGUMENTS.FRS_PLAN_BOD#'
                           ,'#ARGUMENTS.FRS_PLAN_TDD#'
                           ,'#ARGUMENTS.FRS_PLAN_START_DATE#'
                           ,'#ARGUMENTS.FRS_PLAN_END_DATE#'
                           ,'#ARGUMENTS.FRS_PLAN_ASSESSMENT_FREQ#'
                           ,'#ARGUMENTS.FRS_PLAN_INSPECTION_FREQ#'
                           ,'#ARGUMENTS.FRS_PLAN_BILLING_METHOD_TYPE#'
                           ,'#ARGUMENTS.FRS_PLAN_CREATEDBY#'
                           ,'#ARGUMENTS.FRS_PLAN_NEXT_ASSESSMENT_DATE#'
                           ,'#ARGUMENTS.FRS_PLAN_NEXT_INSPECTION_DATE#')    	
            </cfquery>
		<cfelse>
            <cfquery name="putFRSaccountRec" datasource="#this.dsn#">
                UPDATE [dbo].[CS_FRS_ACCOUNTS]
                   SET [FRS_ACTIVE_CONTACT_RECID] = '#ARGUMENTS.FRS_ACTIVE_CONTACT_RECID#'
                      ,[FRS_ACCOUNT_FACILITY_DESC] = '#ARGUMENTS.FRS_ACCOUNT_FACILITY_DESC#'
                      ,[FRS_BUSINESS_TYPE] = '#ARGUMENTS.FRS_BUSINESS_TYPE#'
                      ,[FRS_METER_SIZE] = '#ARGUMENTS.FRS_METER_SIZE#'
                      ,[FRS_PLAN_NEXT_ASSESSMENT_DATE] ='#ARGUMENTS.FRS_PLAN_NEXT_ASSESSMENT_DATE#'
                      ,[FRS_PLAN_NEXT_INSPECTION_DATE] = '#ARGUMENTS.FRS_PLAN_NEXT_INSPECTION_DATE#'
                      ,[FRS_METHOD] = '#ARGUMENTS.FRS_METHOD#'
                      ,[FRS_PLAN_START_DATE] = '#ARGUMENTS.FRS_PLAN_START_DATE#'
                      ,[FRS_PLAN_BASIS] = '#ARGUMENTS.FRS_PLAN_BASIS#'
                      ,[FRS_PLAN_BOD] = '#ARGUMENTS.FRS_PLAN_BOD#'
                      ,[FRS_PLAN_TDD] = '#ARGUMENTS.FRS_PLAN_TDD#'
                      ,[FRS_PLAN_END_DATE] = '#ARGUMENTS.FRS_PLAN_END_DATE#'
                      ,[FRS_PLAN_ASSESSMENT_FREQ] ='#ARGUMENTS.FRS_PLAN_ASSESSMENT_FREQ#'
                      ,[FRS_PLAN_INSPECTION_FREQ] ='#ARGUMENTS.FRS_PLAN_INSPECTION_FREQ#'
                      ,[FRS_PLAN_BILLING_METHOD_TYPE] = '#ARGUMENTS.FRS_PLAN_BILLING_METHOD_TYPE#'
                      ,[FRS_PLAN_CREATEDBY] = '#ARGUMENTS.FRS_PLAN_CREATEDBY#'
                WHERE [REC_ID] = #checkFRSaccountRec.REC_ID#
            </cfquery>
    	</cfif>

        <cfreturn true>
    </cffunction>
    
    <cffunction name="updateFRSContact" returntype="query" access="remote">
    	<cfargument name="FRS_CONTACT_ACCOUNT_NUM" type="string" default="">
        <cfargument name="FRS_CONTACT_BUSINESS" type="string" default="">
        <cfargument name="FRS_CONTACT_NAME" type="string" default="">
        <cfargument name="FRS_CONTACT_ADDRESS" type="string" default="">
        <cfargument name="FRS_CONTACT_CITY" type="string" default="">
        <cfargument name="FRS_CONTACT_STATE" type="string" default="">
        <cfargument name="FRS_CONTACT_ZIP" type="string" default="">
        <cfargument name="FRS_CONTACT_PHONE" type="string" default="">
        <cfargument name="FRS_CONTACT_EMAIL" type="string" default="">
        
    	<cfquery name="getFRSContactRet" datasource="#this.dsn#">
	        SELECT * FROM CS_FRS_CONTACTS
            WHERE FRS_CONTACT_ACCOUNT_NUM = '#ARGUMENTS.FRS_CONTACT_ACCOUNT_NUM#'
            AND FRS_CONTACT_ACTIVE = 'Y'
        </cfquery>
        
        <cfif getFRSContactRet.recordcount eq 0>
    	    <cfquery name="putFRSContactRet" datasource="#this.dsn#">
                INSERT INTO [dbo].[CS_FRS_CONTACTS]
                       ([FRS_CONTACT_ACTIVE]
                       ,[FRS_CONTACT_ACCOUNT_NUM]
                       ,[FRS_CONTACT_BUSINESS]
                       ,[FRS_CONTACT_NAME]
                       ,[FRS_CONTACT_ADDRESS]
                       ,[FRS_CONTACT_CITY]
                       ,[FRS_CONTACT_STATE]
                       ,[FRS_CONTACT_ZIP]
                       ,[FRS_CONTACT_PHONE]
                       ,[FRS_CONTACT_EMAIL])
                VALUES
                       ('Y'
                       ,'#ARGUMENTS.FRS_CONTACT_ACCOUNT_NUM#'
                       ,'#ARGUMENTS.FRS_CONTACT_BUSINESS#'
                       ,'#ARGUMENTS.FRS_CONTACT_NAME#'
                       ,'#ARGUMENTS.FRS_CONTACT_ADDRESS#'
                       ,'#ARGUMENTS.FRS_CONTACT_CITY#'
                       ,'#ARGUMENTS.FRS_CONTACT_STATE#'
                       ,'#ARGUMENTS.FRS_CONTACT_ZIP#'
                       ,'#ARGUMENTS.FRS_CONTACT_PHONE#'
                       ,'#ARGUMENTS.FRS_CONTACT_EMAIL#');
			</cfquery>
		<cfelse>
	    	<cfquery name="putFRSContactRet" datasource="#this.dsn#">
                UPDATE [dbo].[CS_FRS_CONTACTS]
                   SET [FRS_CONTACT_BUSINESS] = '#ARGUMENTS.FRS_CONTACT_BUSINESS#'
                      ,[FRS_CONTACT_NAME] = '#ARGUMENTS.FRS_CONTACT_NAME#'
                      ,[FRS_CONTACT_ADDRESS] = '#ARGUMENTS.FRS_CONTACT_ADDRESS#'
                      ,[FRS_CONTACT_CITY] = '#ARGUMENTS.FRS_CONTACT_CITY#'
                      ,[FRS_CONTACT_STATE] = '#ARGUMENTS.FRS_CONTACT_STATE#'
                      ,[FRS_CONTACT_ZIP] = '#ARGUMENTS.FRS_CONTACT_ZIP#'
                      ,[FRS_CONTACT_PHONE] = '#ARGUMENTS.FRS_CONTACT_PHONE#'
                      ,[FRS_CONTACT_EMAIL] = '#ARGUMENTS.FRS_CONTACT_EMAIL#'
                 WHERE REC_ID = '#getFRSContactRet.REC_ID#';
			</cfquery>                     
        </cfif>
        
        <cfquery name="getFRSContactRet" datasource="#this.dsn#">
	        SELECT * FROM CS_FRS_CONTACTS
            WHERE FRS_CONTACT_ACCOUNT_NUM = '#ARGUMENTS.FRS_CONTACT_ACCOUNT_NUM#'
            AND FRS_CONTACT_ACTIVE = 'Y'
        </cfquery>
        
        <cfreturn getFRSContactRet/>
    </cffunction>
    
    <cffunction name="RefreshAccountBilling" access="remote" returntype="any">
    	<cfargument name="account_number" default="" type="string" required="yes">

        <cfquery name="getFRSAccountBills" datasource="#THIS.DSN#">
            SELECT [FRS_ACCOUNT_NUM]
                  ,[FRS_METER_SIZE]
                  ,[FRS_METHOD]
                  ,[FRS_PLAN_BASIS]
                  ,[FRS_BUSINESS_TYPE]
                  ,[FRS_PLAN_BILLING_METHOD_TYPE]
                  ,[SERV_FROM_DATE]
                  ,[SERV_TO_DATE]
                  ,[TYPE]
                  ,[SEWER_PERCENT]
                  ,[SEWER_CCF_CONS]
                  ,[SEWER_NET_CHRG]
                  ,[BILLING_DATE]
                  ,[REC_ID]
                  ,LEFT(RIGHT(NEXT_READ_DATE,4),2) + '/' + RIGHT(NEXT_READ_DATE,2) + '/' + LEFT(NEXT_READ_DATE,4) AS READ_DATE
                  ,[SERV_NUM_DAYS]
            FROM [dbo].[VW_CS_FRS_BILLING]
            where FRS_ACCOUNT_NUM = '#arguments.account_number#'
            <!---AND NEXT_READ_DATE != '00000000'--->
            order by rec_id asc
        </cfquery>
            
            <cfoutput query="getFRSAccountBills">
                <cfif READ_DATE eq "00/00/0000"><cfset x_read_date = billing_date><cfelse><cfset x_read_date = read_date></Cfif>
                <cfset LASTREADDATE = DATEADD("D",SERV_NUM_DAYS*-1,x_read_date)>
               
                <cfquery name="putNewBillingAssessments" datasource="#this.dsn#">
                    INSERT INTO [dbo].[CS_FRS_BILLING_ASSESSMENTS]
                               ([FRS_BILLING_REC_ID]
                               ,[FRS_BILLING_ACCT_NUM]
                               ,[FRS_BILLING_TYPE]
                               ,[FRS_BILLING_READING_DATE]
                               ,[FRS_BILLING_BILLING_DATE])
                    VALUES
                               (#rec_id#
                               ,'#FRS_ACCOUNT_NUM#'
                               ,'#FRS_PLAN_BILLING_METHOD_TYPE#'
                               ,'#DATEFORMAT(LASTREADDATE,"mm/dd/yyyy")#'
                               ,'#DATEFORMAT(BILLING_DATE,"mm/dd/yyyy")#');
                </cfquery>
            </cfoutput>
            
            <cfreturn>
        </cffunction>
    
	<cffunction name="getFRScontact" returntype="query" access="remote">
        <cfargument name="FRS_ACTIVE_CONTACT_RECID" type="string" required="yes" default="">
    
        <cfquery name="getFRSContactRet" datasource="#this.dsn#">
	        SELECT * FROM CS_FRS_CONTACTS
            WHERE rec_id = '#ARGUMENTS.FRS_ACTIVE_CONTACT_RECID#'
            AND FRS_CONTACT_ACTIVE ='Y'
        </cfquery>
        
        <cfreturn getFRSContactRet/>
    </cffunction>

    
	<cffunction name="getFRSAccount" returntype="query" access="remote">
        <cfargument name="FRS_ACCOUNT_NUM" type="string" required="yes" default="">
        
        <cfquery name="getFRSAccountRet" datasource="#this.dsn#">
        	SELECT * FROM [dbo].[CS_FRS_ACCOUNTS]
            WHERE FRS_ACCOUNT_NUM = '#ARGUMENTS.FRS_ACCOUNT_NUM#'
        </cfquery>

	   <cfreturn getFRSAccountRet>
    </cffunction>
    
   	<cffunction name="putAccountEngRpt" returntype="any" access="remote">
        <cfargument name="FRS_ACCOUNT_NUM" type="string" required="yes" default="">
        <cfargument name="FRS_ENGRPT_FIRM" type="string" required="yes" default="">
        <cfargument name="FRS_ENGRPT_TYPE" type="string" required="yes" default="">
        <cfargument name="FRS_ENGRPT_DATE_DUE" type="string" required="yes" default="">
        <cfargument name="FRS_ENGRPT_STUDY_DATE" type="string" required="yes" default="">
        <cfargument name="FRS_ENGRPT_ITEMS" type="string" required="yes" default="">
      
        <cfquery name="getFRSAccountRet" datasource="#this.dsn#">
			UPDATE [CS_FRS_ACCOUNTS]
            SET FRS_ENGRPT_FIRM = '#ARGUMENTS.FRS_ENGRPT_FIRM#',
            	FRS_ENGRPT_TYPE = '#ARGUMENTS.FRS_ENGRPT_TYPE#',
                FRS_ENGRPT_DATE_DUE = '#ARGUMENTS.FRS_ENGRPT_DATE_DUE#',
                FRS_ENGRPT_ITEMS = '#ARGUMENTS.FRS_ENGRPT_ITEMS#',
                FRS_ENGRPT_STUDY_DATE= '#ARGUMENTS.FRS_ENGRPT_STUDY_DATE#'
            WHERE FRS_ACCOUNT_NUM = '#ARGUMENTS.FRS_ACCOUNT_NUM#'
        </cfquery>

	   <cfreturn>
    </cffunction>
    
    <!--- TODO Prior assessment review --->
	<cffunction name="getPriorAssessments" returntype="query" access="remote">
        <cfargument name="FRS_ACCOUNT_NUM" type="string" required="yes" default="">
        
		<cfquery name="getPriorAssessmentsRet" datasource="#this.dsn#">
            SELECT [FRS_ACCOUNT_NUM],
               FRS_BILLING_ASSESSMENT_DATE
               FROM [dbo].[VW_CS_FRS_BILLED_ACTUAL]
               where <cfif arguments.FRS_ACCOUNT_NUM neq "">FRS_ACCOUNT_NUM = '#arguments.FRS_ACCOUNT_NUM#' and </cfif>
               FRS_BILLING_ASSESSMENT_DATE is not null
               group by [FRS_ACCOUNT_NUM],
               FRS_BILLING_ASSESSMENT_DATE
        </cfquery>
    
    	<cfreturn getPriorAssessmentsRet>
    </cffunction>
    
	<cffunction name="rollbackPriorAssessments" returntype="any" access="remote">
        <cfargument name="FRS_ACCOUNT_NUM" type="string" required="yes" default="">
        <cfargument name="FRS_BILLING_ASSESSMENT_DATE" type="string" required="yes" default="">
        
		<cfquery name="LastAssessmentsRet" datasource="#this.dsn#">
            select * from CS_FRS_ACCOUNTS
            where FRS_ACCOUNT_NUM = '#arguments.FRS_ACCOUNT_NUM#' 
        </cfquery>

		<cfquery name="rollbackPriorAssessmentsRet" datasource="#this.dsn#">
            UPDATE [VW_CS_FRS_BILLED_ACTUAL]
            SET FRS_BILLING_ASSESSMENT_DATE = NULL, FRS_BILLING_ASSESSED_FLAG =0
            where FRS_ACCOUNT_NUM = '#arguments.FRS_ACCOUNT_NUM#' 
            and FRS_BILLING_ASSESSMENT_DATE = '#dateformat(ARGUMENTS.FRS_BILLING_ASSESSMENT_DATE,"mm/dd/yyyy")#'
        </cfquery>
        
		<cfquery name="rollbackcsdate" datasource="#this.dsn#">
            UPDATE CS_FRS_ACCOUNTS
        	SET FRS_PLAN_NEXT_ASSESSMENT_DATE = '#dateformat(dateadd("M",LastAssessmentsRet.FRS_PLAN_ASSESSMENT_FREQ*-1,LastAssessmentsRet.FRS_PLAN_NEXT_ASSESSMENT_DATE),"mm/dd/yyyy")#'
           where FRS_ACCOUNT_NUM = '#arguments.FRS_ACCOUNT_NUM#' 
        </cfquery>
    
    	<cfreturn>
    </cffunction>
   
	<!--- refreshBillingInfo ensures that the billing record for a new submission is present --->
    <cffunction name="refreshBillingInfo" returntype="string" access="remote">
        <cfargument name="FRS_ACCOUNT_NUM" type="string" required="yes" default="">
        <cfargument name="BILLINGRECID" type="string" required="yes" default="">

    	<!--- check if record exist --->
        <cfquery name="getFRSBillingRec" datasource="#this.dsn#">
        	select FRS_BILLING_REC_ID from [CS_FRS_BILLING_ASSESSMENTS]
            where FRS_BILLING_REC_ID = '#ARGUMENTS.BILLINGRECID#'
        </cfquery>
    
    	<cfquery name="putUpdatedBilling" datasource="#this.dsn#">
			<cfif getFRSBillingRec.recordcount eq 0>
                <!---INSERT INTO [CS_FRS_BILLING_ASSESSMENTS] (FRS_BILLING_REC_ID,FRS_BILLING_ACCT_NUM) VALUES (#ARGUMENTS.BILLINGRECID#,'#ARGUMENTS.FRS_ACCOUNT_NUM#')--->
            <cfelse>
                select * from CS_FRS_BILLING_ASSESSMENTS where FRS_BILLING_REC_ID = '#ARGUMENTS.BILLINGRECID#'
            </cfif>
        </cfquery>
    
        <cfreturn "true">
    </cffunction>
    
	<cffunction name="getSAWSbilling" returntype="query" access="remote">
        <cfargument name="FRS_ACCOUNT_NUM" type="string" required="yes" default="">
        
        <cfquery name="getFRSbillingRet" datasource="#this.dsn#">
            SELECT *, cast(irrig_ccf_cons as int) as irrig_ccf_cons
            FROM VW_CS_FRS_BILLED_ACTUAL
            where FRS_ACCOUNT_NUM = '#ARGUMENTS.FRS_ACCOUNT_NUM#'
            and isnull(FRS_BILLING_ASSESSED_FLAG,0) = 0
            order by billing_date desc
		</cfquery>

        <cfreturn getFRSbillingRet>
    </cffunction>    

	<cffunction name="getFRSbilling" returntype="query" access="remote">
        <cfargument name="FRS_ACCOUNT_NUM" type="string" required="yes" default="">
        <cfargument name="FRS_BILLING_REC_UPDATE" type="boolean" required="no" default=false>

		<cfquery name="getFRSbillingRet" datasource="#this.dsn#">
            SELECT *, cast(irrig_ccf_cons as int) as irrig_ccf_cons 
            FROM VW_CS_FRS_BILLED_ACTUAL
            WHERE FRS_ACCOUNT_NUM = '#ARGUMENTS.FRS_ACCOUNT_NUM#'
            ORDER BY BILLING_DATE DESC
        </cfquery>
        
        <cfif ARGUMENTS.FRS_BILLING_REC_UPDATE EQ TRUE>
            <cfloop query="getFRSbillingRet">
                <cfif isdate(getFRSbillingRet.FRS_BILLING_READING_DATE)>
                    <cfset billing_low_range = dateadd("d", -14, "#dateformat(getFRSbillingRet.FRS_BILLING_READING_DATE,'mm/dd/yyyy')#")>
                    <cfset billing_high_range = dateadd("d", +14, "#dateformat(getFRSbillingRet.FRS_BILLING_READING_DATE,'mm/dd/yyyy')#")>

                    <cfquery name="getBillingMatchRec" datasource="csweb">
                        select rec_id
                        from billing  
                        where 1=1
                        and ACCOUNT_NUM = '#ARGUMENTS.FRS_ACCOUNT_NUM#' 
                        and cast(serv_to_date as date) between '#dateformat(billing_low_range)#' and '#dateformat(billing_high_range)#'
                    </cfquery>

                    <cfquery name="updateAssessmentRec" datasource="#this.dsn#">
                        update CS_FRS_BILLING_ASSESSMENTS
                        set FRS_BILLING_REC_ID = '#getBillingMatchRec.rec_id#'
                        where FRS_BILL_ASSESS_REC_ID =  '#FRS_BILL_ASSESS_REC_ID#'
                    </cfquery>
                </cfif>                
            </cfloop>       
        </cfif>
        
        <cfreturn getFRSbillingRet>
    </cffunction>    

    <cffunction name="lookupFRSName" access="remote" returntype="array">
        <cfargument name="search" type="any" required="false" default="">

        <!--- Define variables --->
        <cfset var data="">
        <cfset var result=ArrayNew(1)>

        <!--- Do search --->
        <cfquery datasource="intradb" name="data">
            SELECT FRS_CONTACT_BUSINESS
            FROM [CS_FRS_CONTACTS]
            where FRS_CONTACT_BUSINESS like '#ucase(arguments.search)#%'
            group by FRS_CONTACT_BUSINESS
            order by FRS_CONTACT_BUSINESS
        </cfquery>

        <!--- Build result array --->
        <cfloop query="data">
            <cfset ArrayAppend(result, FRS_CONTACT_BUSINESS )>
        </cfloop>
        
        <!--- And return it --->
        <cfreturn result>
    </cffunction>

    <cffunction name="getMemo" access="remote" returntype="query">
        <cfargument name="appid" type="any" required="false" default="">
        <cfargument name="recid" type="any" required="false" default="">

        <!--- Define variables --->
        <cfset var data="">
        <cfset var result=ArrayNew(1)>

        <!--- Do search --->
        <cfquery datasource="intradb" name="getMemoRet">
            SELECT *
            FROM [CS_FRS_MEMOS]
            where [FRS_MEMO_APP] = '#arguments.appid#'
            and [FRS_MEMO_RECID_REF] = '#arguments.recid#'
            order by FRS_MEMO_DATE desc
        </cfquery>
      
        <!--- And return it --->
        <cfreturn getMemoRet>
    </cffunction>

    <cffunction name="getMemosByTag" access="remote" returntype="query">
        <cfargument name="appid" type="any" required="false" default="">
        <cfargument name="tag" type="any" required="false" default="">

        <!--- Define variables --->
        <cfset var data="">
        <cfset var result=ArrayNew(1)>

        <!--- Do search --->
        <cfquery datasource="intradb" name="getMemoRet">
            SELECT *
            FROM [CS_FRS_MEMOS]
            where <cfif arguments.appid neq "">[FRS_MEMO_APP] = '#arguments.appid#' and </cfif>
            	[FRS_MEMO_TAG] = '#arguments.tag#'
            order by FRS_MEMO_DATE desc
        </cfquery>
      
        <!--- And return it --->
        <cfreturn getMemoRet>
    </cffunction>

    <cffunction name="putMemo" access="remote" returntype="query">
        <cfargument name="appid" type="any" required="false" default="">
        <cfargument name="recid" type="any" required="false" default="">
        <cfargument name="NEWTEXT" type="any" required="false" default="">
        <cfargument name="Tag" type="any" required="false" default="">
        <cfargument name="setDate" type="any" required="false" default="#dateformat(now())# #timeformat(now())#">

        <!--- Define variables --->
        <cfset var data="">
        <cfset var result=ArrayNew(1)>

        <!--- Do check and update --->
        <cfquery datasource="intradb" name="getMemoRet">
            SELECT *
            FROM [CS_FRS_MEMOS]
            where [FRS_MEMO_APP] = '#arguments.appid#'
            and [FRS_MEMO_RECID_REF] = '#arguments.recid#'
            and [FRS_MEMO_DATE] = '#arguments.setDate#';
        </cfquery>

    	<cfquery name="MaintMemoRet" datasource="intradb">
    		<cfif getMemoRet.recordcount eq 1>
                update CS_FRS_MEMOS
                set [FRS_MEMO_TEXT] = '#arguments.NEWTEXT#', FRS_MEMO_TAG = '#arguments.Tag#'
                where [FRS_MEMO_APP] = '#arguments.appid#'
                and [FRS_MEMO_RECID_REF] = '#arguments.recid#'
                and [FRS_MEMO_DATE] = '#arguments.setDate#';
            <cfelse>
                insert into CS_FRS_MEMOS
                (FRS_MEMO_APP,FRS_MEMO_RECID_REF,FRS_MEMO_TEXT,FRS_MEMO_AUTHOR, FRS_MEMO_TAG, FRS_MEMO_DATE)
                VALUES
                ('#arguments.appid#','#arguments.recid#','#arguments.NEWTEXT#','#SESSION.EMP_ID#','#arguments.Tag#', '#arguments.setDate#');
                
            </cfif>
                SELECT *
                FROM [CS_FRS_MEMOS]
                where [FRS_MEMO_APP] = '#arguments.appid#'
                and [FRS_MEMO_RECID_REF] = '#arguments.recid#'
        </cfquery>
      
        <cfreturn MaintMemoRet>
    </cffunction>

    <cffunction name="getAcctByAcct" output="true" access="remote" returntype="string" securejson="true">
        <!--- ------------------------------------------------------------------------- --->
        <!--- Method:  getGetAcct												--->
        <!--- Author:  Ronnie Pitts														--->
        <!--- Purpose: This method returns a able element from the ACCOUNT_INFO table	--->
        <!---          based on the address passed in.  Used in a field binding for 	--->
        <!---          cfinput.															--->
        <!--- ------------------------------------------------------------------------- --->
        <cfargument name="acctnum" default="" required="yes" hint="Argument for acctnum.">
        <cfargument name="retWhat" default="mailaddress" required="no" hint="Tells method what to return">

		<cfset var retAcct = "" >
        <cfset crlf = chr(13)&chr(10)>
        
        <!---  ONLY PERFORM THIS FUNCTION IF THE ACCOUNT NUMBER IS PROVIDED COMPLETELY --->
        <cfif LEN(arguments.acctnum) EQ 13 or LEN(arguments.acctnum) GTE 22>
            <cfquery name="GetAcctByNum" datasource="CSWEB">
                SELECT *
                FROM dbo.ACCOUNT_INFO
                WHERE ACCOUNT_NUM = '#Arguments.acctnum#' or
                INFOR_ACCOUNT_NUM = '#Arguments.acctnum#'
            </cfquery>
        
            <cfswitch expression="#Arguments.retWhat#">
                <!--- RETURN THE MAILING ADDRESS FROM CSWEB --->
                <cfcase value="mailaddress">
                    <cfset retAcct = "#TRIM(GetAcctByNum.CUSTOMER_NAME)##crlf##trim(GetAcctByNum.MAIL_LINE1)##crlf##trim(GetAcctByNum.MAIL_LINE2)##crlf##trim(GetAcctByNum.MAIL_LINE3)##crlf##trim(GetAcctByNum.MAIL_LINE4)#"/>
                </cfcase>  

                <!--- RETURN THE CUSTOMER NAME FROM CSWEB --->
                <cfcase value="custname">
                    <cfset retAcct = "#GetAcctByNum.CUSTOMER_NAME#"/>
                </cfcase>

                <!--- RETURN THE CUSTOMER PHONE NUMBER FROM CSWEB --->
                <cfcase value="custphone">
                    <cfset retAcct = "#GetAcctByNum.PHONE#"/>
                </cfcase>
            </cfswitch>
        </cfif>
        
        <cfreturn retAcct>
    </cffunction>

    <cffunction name="getAcctServices" output="true" access="remote" returntype="string" securejson="true">
        <!--- ------------------------------------------------------------------------- --->
        <!--- Method:  getAcctServices												    --->
        <!--- ------------------------------------------------------------------------- --->

        <cfargument name="acctnum" default="" required="yes" hint="Argument for acctnum.">
        <cfargument name="retWhat" default="mailaddress" required="no" hint="Tells method what to return">
      
        <cfquery name="test" datasource="datawarehouse">
            select ba.BILLINGCYCLE
            ,Ba.ACCOUNTNUMBER
            ,Ba.CUSTDESC
            ,Ba.ACCTCLASS
            ,Ba.ACCTGRP
            ,Ba.ACCTSUBGRP
            ,bsd.SERVICE
            from billing.account ba
            join billing.accountservice Bas on Bas.ACCOUNTKEY=Ba.ACCOUNTKEY
            join billing.SERVICEOPTIONS bso on bso.SERVICEOPTIONSKEY=bas.SERVICEOPTIONSKEY
            join billing.SERVICEDEFINITION bsd on bsd.SERVICEDEFINITIONKEY=bso.SERVICEDEFINITIONKEY
            where Ba.ACCOUNTNUMBER = '#ARGUMENTS.ACCTNUM#' AND
            <!---ba.acctclass !='Res' AND--->
            ba.ACCOUNTSTATUS = 'A' 
            <!---and (Code='IRR' or Code = 'IRR-EX')--->
            and bas.STATUS = 'Active'
        </cfquery>
    
        <cfreturn TEST.ba.BILLINGCYCLE>
    </cffunction>       

    <cffunction name="progressAssessment" returntype="any" access="remote">
    	<cfargument name="ProgressType" default="submeter" type="string">
    	<cfargument name="account_num1" default="" type="string" required="yes">
    	<cfargument name="FRS_PLAN_BASIS" default="" type="string" required="no">
    	<cfargument name="FRS_ADJUSTMENT" default="" type="string" required="no">
        
		<cfset getAcctInfoRecord = getFRSAccount(account_num1)>
        <cfset varFRS_PLAN_ASSESSMENT_FREQ = (getAcctInfoRecord.FRS_PLAN_ASSESSMENT_FREQ eq 0) ? "1" : getAcctInfoRecord.FRS_PLAN_ASSESSMENT_FREQ/>
		<cfset NEXTASSESSMENT = DATEADD("M",varFRS_PLAN_ASSESSMENT_FREQ,getAcctInfoRecord.FRS_PLAN_NEXT_ASSESSMENT_DATE)>
        
		<!--- Get highest record num used in assessment --->
        <cfif arguments.ProgressType neq "EngRpt">        
            <cfquery name="prepAssessment" datasource="intradb">
                select max(rec_id) as startPoint
                from [VW_CS_FRS_BILLED_ACTUAL]
                  where frs_account_num = '#account_num1#' and isnull(FRS_BILLING_ASSESSED_FLAG,0) = 0
                  and (FRS_BILLING_USE_BASIS = 1 or FRS_BILLING_USE_MONEY=1);
            </cfquery>
        </cfif>

        <cfquery name="updateAssessments" datasource="intradb">
            <!--- UPDATE THE BILLING RECORDS SO THE ARE NOT AVAILABLE FOR FUTURE ASSESSMENTS --->
            <cfif arguments.ProgressType neq "EngRpt">
                update [VW_CS_FRS_BILLED_ACTUAL]
                SET [FRS_BILLING_ASSESSED_FLAG] = 1, [FRS_BILLING_ASSESSMENT_DATE] = '#DATEFORMAT(now(),"mm/dd/yyyy")#'
                where frs_account_num = '#account_num1#' and isnull(FRS_BILLING_ASSESSED_FLAG,0) = 0
                and rec_id <= '#prepAssessment.startPoint#';
          
                <!--- SET THE NEW BASIS NUMBER AND UPDATE THE ASSESSMENT DATE --->
                update [CS_FRS_ACCOUNTS]
                SET <cfif url.progress_only eq "false"> [FRS_PLAN_BASIS] = '#numberformat(form['FRS_NEW_BASIS'],"999.99")#'
                ,</cfif>
                [FRS_PLAN_NEXT_ASSESSMENT_DATE] = '#dateformat(NEXTASSESSMENT,"mm/dd/yyyy")#'
                where rec_id = '#getAcctInfoRecord.rec_id#';
		    <cfelse>
                <!--- SET THE NEW ENGINERRING REPORT DUE DATE AND ASSESSMENT DATE --->
                update [CS_FRS_ACCOUNTS]
                SET FRS_PLAN_NEXT_ASSESSMENT_DATE = '#dateformat(dateAdd("m",22,getAcctInfoRecord.FRS_ENGRPT_STUDY_DATE),"mm/dd/yyyy")#',
                    FRS_ENGRPT_DATE_DUE = '#dateformat(dateAdd("m",24,getAcctInfoRecord.FRS_ENGRPT_STUDY_DATE),"mm/dd/yyyy")#'
                where rec_id = '#getAcctInfoRecord.rec_id#';
            </cfif>
        </cfquery>
          
		<cfif arguments.ProgressType neq "EngRpt">
            <cfquery name="forAssessment" datasource="intradb">
                SELECT *
                FROM dbo.VW_CS_FRS_BILLED_ACTUAL 
                WHERE 1=1
                and FRS_ACCOUNT_NUM = '#account_num1#'
                and FRS_BILLING_ASSESSMENT_DATE = '#DATEFORMAT(now(),"mm/dd/yyyy")#'
                and ((FRS_BILLING_USE_MONEY = '1') or (FRS_BILLING_USE_BASIS = '1')) 
                and (FRS_BILLING_ASSESSED_FLAG = '1')
                ORDER BY FRS_ACCOUNT_NUM
            </cfquery>
        
            <cfset reportfile = ExpandPath("../reports/files/frs#account_num1#[#dateformat(now(),'yyyymmdd')#].pdf")/>
            
            <cfreport template="../reports/assessment1.cfr" query="forAssessment" filename="#reportfile#" format="pdf" overwrite="yes"/>
		</cfif>
		
		<!--- Apply assessment and generate paperwork --->
		<cfif arguments.ProgressType eq "EngRpt" or arguments.ProgressType eq "ProgressOnly">
			<cfset varEmailMsg = "An Assessment has been completed for Account #arguments.ACCOUNT_NUM1# #getFRScontact(getAcctInfoRecord.FRS_ACTIVE_CONTACT_RECID).FRS_CONTACT_BUSINESS# by #getEmployee(session.emp_id).EMP_FULL_NAME#.<br>
            --- Account Assessment Progression Only ---<br />
            The next assessment for this customer is due on #dateformat(NEXTASSESSMENT,"mm/dd/yyyy")#">
        <cfelse>
            <cfset varEmailMsg = "An Assessment has been completed for Account #arguments.ACCOUNT_NUM1# #getFRScontact(getAcctInfoRecord.FRS_ACTIVE_CONTACT_RECID).FRS_CONTACT_BUSINESS# by #getEmployee(session.emp_id).EMP_FULL_NAME#.<br>
            <br>
            An adjustment in the amount of #dollarformat(form['arguments.FRS_ADJUSTMENT'])# is requested and a new Basis of 
			#numberformat(form['arguments.FRS_PLAN_BASIS'],"999.99")# is advised.<br><br>
            The next assessment for this customer is due on #dateformat(NEXTASSESSMENT,"mm/dd/yyyy")#">
        </cfif>

        <cfif arguments.ProgressType eq "EngRpt">
            <cfset email_type = "engrpt">
        <cfelseif arguments.ProgressType eq "ProgressOnly">
            <cfset email_type = "progess">
        <cfelse>
            <cfset email_type = "adjustment">
        </cfif>
        
      	<cfset FRS_NOTIFY_EMAIL = getListByKey('FRS_CONTACT_EMAIL').FRS_CTRL_VALUE/>

        <cfmail from="testuser@example.com" to="#FRS_NOTIFY_EMAIL#" cc="#session.email#" bcc="testuser@example.com" 
            subject="Assessment completed for #form['ACCOUNT_NUM']#" type="html">
        	<cfif arguments.ProgressType neq "EngRpt" and arguments.ProgressType neq "ProgressOnly">
            	<cfmailparam file="#reportfile#">
			</cfif>
            #varEmailMsg#
            <p>e:frs:assessment:1:<cfoutput>#email_type#</cfoutput></p>
        </cfmail>
      
		<cfreturn>
    </cffunction>
    
</cfcomponent>