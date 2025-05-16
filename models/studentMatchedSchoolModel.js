var studentMatchedSchoolModel = function(src){

	var config = require('../config');
	var truncatehtml = require('truncate-html');
	let stringUtil = require('../utils/stringUtil');
	var collegeList=[];
	src.forEach(function(obj)
	{
		let collegeSeo = "";
		if(obj.seo_name){
			collegeSeo = obj.seo_name;
		}else{
			collegeSeo = obj.college_name;
		}
		let mPercent = 0;
		if(obj.matched_percent){
			mPercent = obj.matched_percent;
		}
		if(obj.display_text){
			overviewText = truncatehtml(obj.display_text, 300, { stripTags: true });
		}else{
			overviewText = truncatehtml(obj.overview, 300, { stripTags: true });
		}
		collegeList.push({
			id:obj.id,
			collegeName:obj.college_name,
			collegeAlias: obj.college_alias,
			contacted:obj.is_contacted,
			matchPercent:mPercent,
			collegeUrl:obj.college_alias,
			collegeId:obj.college_id,
			isPassedInCollege:obj.is_passedin_college,
			collegeLogo:config.AWS_IMAGE_RESOURCE_COLLEGE+obj.college_logo,
			city:obj.city,
			state:obj.state,
			overview:overviewText,
			accessLevel:obj.access_level,
			collegeType:obj.college_type,
			programMatcher: obj.searchonly?obj.searchonly:'no',
			collegeContact: obj.contact_email,
			phoneRequired: obj.phone_required,
			parentId: obj.parent_id,
			showParentChild: obj.show_parent_child,
		});

	});
	return collegeList;
};

module.exports = studentMatchedSchoolModel;