var collegeListModel = function(src, src1, src2){

	var config = require('../config');
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
		collegeList.push({
			id:obj.cid,
			name:stringUtil.manageCollegeName(obj.collegename),
			cname:obj.college_name,
			calias:obj.college_alias,
			streetAddress:obj.address,
			collegeUrl:stringUtil.collegeNameUrl(collegeSeo),
			collegeAbbreviation:obj.college_abbreviation,
			city:obj.city,
			state:obj.state,
			postalCode:obj.postal_code,
			phone:obj.phone_number,
			collegeLogo:config.AWS_IMAGE_RESOURCE_COLLEGE+obj.college_logo,
			collegePhoto:config.AWS_IMAGE_RESOURCE_COLLEGE+obj.college_photo,
			type: 'name',
			bhaRate: obj.bah
		});

	});
	src1.forEach(function(obj)
	{	
		collegeList.push({
			id:obj.id,
			name:obj.title,
			cname:'',
			calias:'',
			collegeUrl:'',
			collegeAbbreviation:'',
			type: 'degree'
		});
	})
	src2.forEach(function(obj)
	{	
		collegeList.push({
			id:obj.name,
			name:obj.name,
			cname:'',
			calias:'',
			collegeUrl:'',
			collegeAbbreviation:'',
			type: 'state'
		});
	})
	return collegeList;
};

module.exports = collegeListModel;