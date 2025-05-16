var adModel = function(src){

	var config = require('../config');
	var adList=[];
	src.forEach(function(obj)
	{	
		adList.push({
			id:obj.id,
			uuid:obj.uuid,
			advertiser:obj.advertiser,
			ad_type:obj.ad_type,
			ad:config.AWS_IMAGE_RESOURCE_AD+obj.ad,
			top_ad:config.AWS_IMAGE_RESOURCE_AD+(obj.top_ad),
			premium:obj.premium,
			url:obj.url,
			impressions:obj.impressions,
			status:obj.status,
			date_Added:obj.date_Added
		});
	});
	return adList;
};

module.exports = adModel;