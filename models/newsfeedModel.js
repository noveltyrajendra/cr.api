var newsfeedModel = function(src,count){

	var config = require('../config');
	var moment = require('moment');
	let stringUtil = require('../utils/stringUtil');
	var list=[];
	var obj;
	
	src.forEach(function(obj)
	{ 
		let collegeSeo = "";
		if(obj.seo_name){
			collegeSeo = obj.seo_name;
		}else{
			collegeSeo = obj.college_name;
		}
		var newsfeeddate=moment(obj.date_created).format('DD/MM/YYYYTHH:MM');
		var findRepeat= list.find((value)=>{ return (value.dateCreated==newsfeeddate)});
		if(!findRepeat){
			list.push({
				newsfeedId:obj.id,
				post:obj.post,
				resourceUrl:obj.post_type=='TEXT'?obj.resource_url.replace('/watch?v=', '/embed/').replace(/\&amp.*/, ''):obj.resource_url,
				comments:obj.comments,
				collegeName:obj.college_name,
				collegeUrl:stringUtil.collegeNameUrl(collegeSeo),
				collegeId:obj.college_id,
				collegeLogo:config.AWS_IMAGE_RESOURCE_COLLEGE+obj.college_logo,
				postType:obj.post_type,
				postPrivacy:obj.post_privacy,
				dlImageUrl:obj.dl_image_url,
				cacheOgData:obj.cached_og_data,
				dateCreated:moment(obj.date_created).format('YYYY-MM-DD')

			});
		}
	});

	
	return list;
};

module.exports = newsfeedModel;