var secondarybucketModel = function(src){

	var config = require('../config');
	var bucketList=[];
	src.forEach(function(obj)
	{	
		bucketList.push({
			secBucketId:obj.id,
			secBucketTitle:obj.title
		});

	});
	return bucketList;
};

module.exports = secondarybucketModel;