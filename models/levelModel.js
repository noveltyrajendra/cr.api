var levelModel = function(src){

	var config = require('../config');
	var levelList=[];
	src.forEach(function(obj)
	{	
		levelList.push({
			levelId:obj.levelId,
			levelTitle:obj.levelTitle,
			levelShortTitle:obj.levelShortTitle
		});

	});
	return levelList;
};

module.exports = levelModel;