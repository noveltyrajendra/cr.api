let studentCollegeContactModel = function(src){
  let config = require('../config');
  let stringUtil = require('../utils/stringUtil');
  let list=[];
  let cimage= "";
  let collegeSeo = "";
	src.forEach(function(obj)
	{	
    if(obj.college_logo == ""){
			cimage = "no-college.png";
		}else{
			cimage = obj.college_logo;
    }
    
		if(obj.seo_name){
			collegeSeo = obj.seo_name;
		}else{
			collegeSeo = obj.college_name;
		}
    
		list.push({
      collegeId: obj.id,
      collegeName: obj.college_name,
      collegeAlias: obj.college_alias,
      collegeUrl:stringUtil.collegeNameUrl(collegeSeo),
      address: obj.address,
      city: obj.city,
      state: obj.state,
      postalCode: obj.postal_code,
      phoneNumber: obj.phone_number,
      website: obj.website,
      collegeLogo: config.AWS_IMAGE_RESOURCE_COLLEGE+cimage
		});
			
	});
	return list;
};

module.exports = studentCollegeContactModel;