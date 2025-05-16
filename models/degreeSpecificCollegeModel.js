var dereeSpecificCollegeModel = function(src){

	var config = require('../config');
    let stringUtil = require('../utils/stringUtil');
	var collegeList=[];
	src.forEach(function(obj)
	{	
		collegeList.push({
			id: obj.id,
			secondary_bucket_titles:obj.secondary_bucket_titles,
			new_college_name:obj.new_college_name,
            degree_specific_alias: obj.degree_specific_alias,
            degree_status: obj.degree_status,
            program_matcher_only: obj.program_matcher_only,
            secondary_alias: obj.secondary_alias,
            priBucket: obj.priBucket,
            levelName: obj.levelName,
            original_college_name: stringUtil.manageCollegeName(obj.original_college_name)
		});

	});
	return collegeList;
};

module.exports = dereeSpecificCollegeModel;