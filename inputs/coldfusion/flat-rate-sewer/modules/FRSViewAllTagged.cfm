<cfset objdbfunction = createobject('component','Intranet.apps.CustServ.FRS.CFCs.FRSobjects')>
	<cfset getAllMemoRet = objdbfunction.getMemosByTag('','#url.tag#') />
                          
    <cfoutput query="getAllMemoRet">
    <hr style="color:##069;" />
    <div align="left" ><h4>#dateformat(getAllMemoRet.FRS_MEMO_DATE)# #timeformat(getAllMemoRet.FRS_MEMO_DATE)# : #objdbfunction.getEmployee(getAllMemoRet.FRS_MEMO_AUTHOR).EMP_FULL_NAME#</h4> #getAllMemoRet.FRS_MEMO_TEXT#</div>
	
    </cfoutput>