

<cfset objdbfunction = createobject('component','Intranet.apps.CustServ.FRS.CFCs.FRSobjects')>
<cfset getMemoRet = objdbfunction.putMemo('#form.appName#','#form.recid#','#form.memo#','#form.tag#')/>
<cfset sleep(200)/>
