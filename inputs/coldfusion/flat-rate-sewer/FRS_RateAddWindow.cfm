<h2>Create new Rate Effective Date</h2>

<center>
<cfif isDefined("submit")>
    <cfset objdbfunction = createobject('component','Intranet.apps.CustServ.FRS.CFCs.FRSobjects')>
    <cfset BASERATE = "0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00,0.00">

    <cfset TierValues = objdbfunction.ApplyCtrlCoreValue("FRS_BILL_RATE_TIERS",NewRateDate,"1496,1496").FRS_CTRL_VALUE>
    <cfset MinCharges = objdbfunction.ApplyCtrlCoreValue("FRS_SWR_AVAIL_IOCLI",NewRateDate,BASERATE).FRS_CTRL_VALUE>
    <cfset TierRates = objdbfunction.ApplyCtrlCoreValue("FRS_BILL_RATE_OCLI",NewRateDate,".00352,.00352").FRS_CTRL_VALUE>
    <cfset MinCharges = objdbfunction.ApplyCtrlCoreValue("FRS_SWR_AVAIL_IOCLO",NewRateDate,BASERATE).FRS_CTRL_VALUE>
    <cfset TierRates = objdbfunction.ApplyCtrlCoreValue("FRS_BILL_RATE_OCLO",NewRateDate,".004224,.004224").FRS_CTRL_VALUE>

    <p>The new rate effective date has been created.  Please update the rates in the rate edit page</p>

    <div onClick="javascript:refreshPage('RateUpdate');ColdFusion.Window.destroy('newRateDate');">Close Window</div>
<cfelse>
    <!--- <cfajaximport tags="cfinput-DATEFIELD"/> --->
    <cfform>
        <!--- <cfinput type="datefield?" name="NewRateDate" value="#dateformat(now(),'mm/dd/yyyy')#"> --->
        <input type="date" name="NewRateDate" value="<cfoutput>#dateformat(now(),"yyyy-mm-dd")#</cfoutput>">
        <cfinput type="submit" name="submit" value="Add Date">
    </cfform>
</cfif>