var branchService = (function() {

	var mysqlService=require('./mysqlService');
	var branchConstants=require('../constants/branchConstants');
	var branchesModel =require('../models/branchesModel');
	const moment = require('moment');

	function getBranches()
	{	
		return new Promise(function(resolve, reject) {
			mysqlService.query(branchConstants.GET_ALL_BRANCH_QUERY)
			 	.then(function(response){
			 			resolve(branchesModel(response));	
			 		},function(err){  
			 			if (err) {
			 				var error = err;
							error.status = 503;
			 				return reject(error)
			 			};
					});
			});
	}	

	function getBranchesById(id)
	{	
		return new Promise(function(resolve, reject) {
			mysqlService.query(branchConstants.GET_BRANCH_BYID,id)
			 	.then(function(response){
			 			resolve(response);	
			 		},function(err){  
			 			if (err) {
			 				var error = err;
							error.status = 503;
			 				return reject(error)
			 			};
					});
			});
	}

	const getCreditEstimator = async (data) => {
		if(data.type == "all"){
			return getCreditEstimatorData();
		}else if(data.type == "branch"){
			return getCreditEstimatorBranchData(data.branchId);
		}else if(data.type == "rating"){
			return getCreditEstimatorRatingData(data.branchId, data.mosId);
		}else if(data.type == "result"){
			return await mysqlService.query("SELECT ce.college_name,cc.college_alias,ce.hour FROM credit_estimator as ce LEFT JOIN colleges as cc ON ce.college_id=cc.id WHERE ce.special_id="+data.mosId+" and ce.status_id="+data.branchId+" and ce.level='"+data.paygradeId+"'");
		}else{
			return "";
		}
	}
	
	const getCreditEstimatorData = async () => {
		let resultData = [];
		let branchData = await mysqlService.query(`SELECT DISTINCT ce.status_id as id,bb.branch_short_name as name FROM credit_estimator as ce LEFT JOIN branches as bb ON ce.status_id=bb.id order by bb.branch_short_name`);
		resultData.push(branchData);
		let mosData = await mysqlService.query(`SELECT DISTINCT ce.special_id as id,os.name,os.code FROM credit_estimator as ce LEFT JOIN occupational_speciality as os ON ce.special_id=os.id order by os.code`);
		resultData.push(mosData);
		let paygradeData = await mysqlService.query(`SELECT DISTINCT level FROM credit_estimator order by level`);
		resultData.push(paygradeData);
		return resultData;
	}

	const getCreditEstimatorBranchData = async (bid) => {
		let resultData = [];
		let mosData = await mysqlService.query("SELECT DISTINCT ce.special_id as id,os.name,os.code FROM credit_estimator as ce LEFT JOIN occupational_speciality as os ON ce.special_id=os.id WHERE ce.status_id="+bid+" order by os.code");
		resultData.push(mosData);
		let paygradeData = await mysqlService.query("SELECT DISTINCT level FROM credit_estimator WHERE status_id="+bid+" order by level");
		resultData.push(paygradeData);
		return resultData;
	}

	const getCreditEstimatorRatingData = async (bid, mosid) => {
		 return await mysqlService.query("SELECT DISTINCT level FROM credit_estimator WHERE status_id="+bid+" and special_id="+mosid+" order by level");
	}

	const getGibillCalculatorData = async () => {
		let resultData = [];
		resultData.push(getGibillInputData("military_status"));
		resultData.push(getGibillInputData("gibill_benefits"));
		resultData.push(getGibillInputData("duty_services"));
		resultData.push(getGibillInputData("student_type"));
		resultData.push(getGibillInputData("classes"));
		let collegeData = mysqlService.query("SELECT c.id,c.college_name,c.college_abbreviation,c.college_common_name,cp.in_state_tuition as instate,cp.out_state_tuition as outstate,cp.bah,lower(cp.public_private) as ctype FROM colleges as c left join college_profiles as cp on c.id=cp.college_id where c.status='active' order by c.college_name");
		resultData.push(collegeData);
		let result = await Promise.all(resultData);
		return result;
	}

	const getGibillInputData = async (type) => {
		return await mysqlService.query("SELECT name,value FROM gi_bill_inputs WHERE type='"+type+"' and status='active' order by id");
   }

	const getAdminSetting = async (name) => {
		let result = await mysqlService.query("SELECT value FROM admin_settings WHERE name='"+name+"'");
		if(result[0] && result[0].value){
			return result[0].value;
		}else{
			return "";
		}
		
	}

	const saveAdminSetting = async (data) => {
		let result = [];
		for(i=0;i<data.keys.length;i++){
			let name = data.keys[i];
			result.push(processSettingData(data.keys[i],data[name],data.adminId));
		}
		await Promise.all(result);
		return "success";
	}

	const processSettingData = async (key,val,adminId) => {
		let result = await mysqlService.query("select id from admin_settings where name='"+key+"'");
		if(result[0] && result[0].id){
			return updateAdminSetting(key,val,adminId,result[0].id);
		}else{
			return addAdminSetting(key,val,adminId);
		}
	}

	const addAdminSetting = async (key,val,adminId) => {
		let settingData = {
			"name": key,
			"value": val,
			"created_by": adminId,
			"created_at": moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
		}
		return mysqlService.query("INSERT INTO admin_settings SET ?", settingData);
	}

	const updateAdminSetting = async (key,val,adminId,id) => {
		let settingData = {
			"name": key,
			"value": val,
			"updated_by": adminId,
			"updated_at": moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
		}
		return mysqlService.query("UPDATE admin_settings SET ? WHERE id = ?", [settingData, id]);
	}

	const getBahCalculatorData = async () => {
		let resultData = [];
		let stateData = mysqlService.query("SELECT id,name from bah_state");
		resultData.push(stateData);
		let rankData = mysqlService.query("SELECT name,value from bah_rank");
		resultData.push(rankData);
		let result = await Promise.all(resultData);
		return result;
	}

	const getBahCalculatorCity = async (stateId) => {
		let result = mysqlService.query("SELECT id,name from bah_city where state_id="+stateId);
		return result;
	}

	const calculateBahByStateCity = async (cdata) => {
		let result = 0;
		let mhaId = 0;
		if(cdata['type'] == 'citystate'){
			const bahData = await mysqlService.query("SELECT mha_id from mha_city_state_relation where state_id="+cdata['state']+" and city_id="+cdata['city']);
			if(bahData[0] && bahData[0]['mha_id']){
				mhaId = bahData[0]['mha_id'];
			}
		}else{
			mhaId = cdata['zipcode'];
		}
		
		if(mhaId != 0){
			let calData = '';
			let tableName = '';
			
			if(cdata['dependent'] == "yes"){
				tableName = 'bah_w_dependent';
			}else{
				tableName = 'bah_wo_dependent';
			}
			calData =  await mysqlService.query("SELECT "+cdata['rank']+" from "+tableName+" where mha_id="+mhaId);
			if(calData[0][cdata['rank']]){
				result = calData[0][cdata['rank']];
			}
		}
		//console.log("RR:",result)
		return result;
	}

	const getZipcodeData = async (searchText) => {
		let qry = "";
		if(searchText.length == 0){
			qry = "SELECT zip_code as zipcode,mha_id as mhaid from zip_mha_relation where mha_name != 'xx499' limit 500"
		}else{
			qry = "SELECT zip_code as zipcode,mha_id as mhaid from zip_mha_relation where mha_name != 'xx499' and zip_code like '%"+searchText+"%'";
		}
		let result = mysqlService.query(qry);
		return result;
	}

	const getWidgetZipcode = async (searchText) => {
		const qry = "SELECT zip_code as zipcode,mha_id as mhaid from zip_mha_relation where mha_name != 'xx499'"
		let result = mysqlService.query(qry);
		return result;
	}

	const getOhaCalculatorCountryData = async () => {
		let countryData = mysqlService.query("SELECT id,country_name,maintenance_allowance,housing_allowance,exchange_rate,currency,exchange_url,with_dependents,updated_at from oha_calculator where status='active' order by id");
		return countryData;
	}

	const getOhaCalculatorLocality = async (cid) => {
		let localData = mysqlService.query("SELECT locality,locality_code from oha_calculator_data where country_id="+cid+" order by locality");
		return localData;
	}

	const calculateOhaCalculatorBahRate = async (cdata) => {
		let rate = 0;
		let ohaData = await mysqlService.query("SELECT "+cdata['oha_rank']+" as bahrate from oha_calculator_data where country_id='"+cdata['country_id']+"' and locality_code='"+cdata['state_id']+"'");
		if(ohaData[0]['bahrate']){
			rate = ohaData[0]['bahrate'];
		}
		return rate;
	}

	const ohaCalculatorSaveSetting = async (sdata) => {
		let settingData = {
			"maintenance_allowance": sdata['maintenanceAllowance'],
			"housing_allowance": sdata['housingAllowance'],
			"exchange_rate": sdata['exchangeRate'],
			"currency": sdata['currency'],
			"exchange_url": sdata['exchangeUrl'],
			"with_dependents": sdata['withoutDependent'],
			"updated_by": sdata['adminId'],
			"updated_at": moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
		}
		return mysqlService.query("UPDATE oha_calculator SET ? WHERE id = ?", [settingData, sdata['countryId']]);
	}

	return {
		getBranches: getBranches,
		getBranchesById: getBranchesById,
		getCreditEstimator,
		getGibillCalculatorData,
		getAdminSetting,
		saveAdminSetting,
		getBahCalculatorData,
		getBahCalculatorCity,
		calculateBahByStateCity,
		getZipcodeData,
		getWidgetZipcode,
		getOhaCalculatorCountryData,
		getOhaCalculatorLocality,
		calculateOhaCalculatorBahRate,
		ohaCalculatorSaveSetting,
	}

})();

module.exports = branchService;