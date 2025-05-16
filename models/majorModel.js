var majorModel = function(src){

	var config = require('../config');
	var majorList=[];
	src.forEach(function(obj)
	{
		majorList.push({
			majorId:obj.majorId,
			majorTitle:obj.majorTitle,
			description:obj.description,
			inPerson: obj.inPerson ? obj.inPerson : 0,
			online: obj.online ? obj.online : 0,
			hybrid: obj.hybrid ? obj.hybrid : 0,
		});

	});
	return majorList;
};

module.exports = majorModel;