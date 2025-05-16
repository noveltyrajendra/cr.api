var majorDetailModel = function(src){
	var config = require('../config');
	var majorDetail=[];
  var levelList=[];
	src.forEach(function(obj){
    levelList=obj.short_title.split(",");
		majorDetail.push({
			majorId:obj.major_id,
			majorTitle:obj.majorTitle,
			description:obj.description,
      shortTitle:levelList
		});
	});
	return majorDetail;
};

module.exports = majorDetailModel;