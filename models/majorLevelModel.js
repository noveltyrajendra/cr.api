var majorLevelModel = function(src){

	var config = require('../config');
	var majorList=[];
	src.forEach(function(obj){
		majorList.push({
			majorId:obj.majorId,
			majorTitle:obj.majorTitle,
			description:obj.description,
			status:obj.status,
			shortTitle:obj.shortTitle
		});
	});
	return majorList;
};

module.exports = majorLevelModel;