var specificCollegeDataModel = function(src){

	var config = require('../config');
    var degreeList=[];
    collegeData=[];
    degree_name=[];
    degree_id=[];
    degree_desc=[];
    courses=[];
    job_market_review=[];
	src.forEach(function(obj)
	{	
		collegeData.push({
            degree_name: degree_name.push(obj.title),
		});

    });
    
	return bucketList;
};

module.exports = secondarybucketModel;