var bucketModel = function(src){

	var config = require('../config');
	var bucketList=[];
	src.forEach(function(obj)
	{	
		bucketList.push({
			bucketId:obj.id,
			bucketTitle:obj.title
		});

	});
	return bucketList;
};

module.exports = bucketModel;