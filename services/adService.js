var adService = (function() {

	var mysqlService=require('./mysqlService');
	var adConstant=require('../constants/adConstant');
	var adModel =require('../models/adModel');

	
	function getTopAd()
	{	
		return new Promise(function(resolve, reject) {
			mysqlService.query(adConstant.TOP_AD)
			.then(function(response){
				var topAdList=adModel(response);
				topAdList.forEach(function(obj){
					updateImpression(obj.impressions + 1 ,obj.uuid);
				});
				resolve(topAdList);	
			},function(err){  
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}	

	function getSideBarAd()
	{ 
		return new Promise(function(resolve, reject) {
			mysqlService.query(adConstant.SIDEBAR_AD)
			.then(function(response){
				var sideBarAdList=adModel(response);
				sideBarAdList.forEach(function(obj){
					updateImpression(obj.impressions + 1 ,obj.uuid);
				});
				resolve(sideBarAdList);
			},function(err){  
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}

	function updateImpression(impression, uuid)
	{	
		return new Promise(function(resolve, reject) {
			mysqlService.query(adConstant.AD_UPDATE,[impression,uuid])
			.then(function(response){
				resolve("success");	
			},function(err){  
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}	

	return {
		getTopAd: getTopAd,
		getSideBarAd:getSideBarAd,
		updateImpression:updateImpression,
	}

})();

module.exports = adService;