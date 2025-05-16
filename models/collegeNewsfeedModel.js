var collegeNewsfeedModel = function(src,count){

	var config = require('../config');
	var moment = require('moment');
	var list=[];
	var obj;
	
	src.forEach(function(obj)
	{ 
		var timelinedate=moment(obj.date_created).format('DD/MM/YYYYTHH:mm:ss');
		var findRepeat= list.find((value)=>{ return (value.dateCreated==timelinedate)});
		var newsfeedPost = "";
		if(obj.converted_post && (obj.converted_post.indexOf('’') != -1 || obj.converted_post.indexOf('”') != -1 || obj.converted_post.indexOf('’') != -1 || obj.converted_post.indexOf('“') != -1)){
			newsfeedPost = obj.converted_post;
		}else{
			newsfeedPost = obj.post;
		}
		if(!findRepeat){
			list.push({
				newsfeedId:obj.id,
				post:newsfeedPost,
				postType:obj.post_type,
				dlImageUrl:obj.dl_image_url,
				resourceUrl:obj.post_type=='TEXT'?obj.resource_url.replace('/watch?v=', '/embed/').replace(/\&amp.*/, ''):obj.resource_url,
				dateCreated:moment(obj.date_created).format('DD/MM/YYYYTHH:mm:ss')
			});}
		// list.push({
		// 	newsfeedId:obj.id,
		// 	post:obj.post,
		// 	postType:obj.post_type,
		// 	dlImageUrl:obj.dl_image_url,
		// 	resourceUrl:obj.resource_url,
		// 	dateCreated:moment(obj.date_created).format('DD/MM/YYYYTHH:MM')
		// });
	});
	return list;
};

module.exports = collegeNewsfeedModel;