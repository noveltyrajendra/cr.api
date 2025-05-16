var scholarshipResultModel = function(src){

	var config = require('../config');
	var scholarshipList=[];
	src.forEach(function(obj)
	{	
		scholarshipList.push({
            id: obj.id,
			scholarship_name: obj.scholarship_name,
			follow: obj.scholarship_requested,
            award: obj.award,
            detail: obj.detail,
			recipients: obj.recipients,
			deadline: obj.deadline
		});

	});
	return scholarshipList;
};

module.exports = scholarshipResultModel;