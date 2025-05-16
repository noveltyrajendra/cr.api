var bounceEmailAdvertiseOrderModel = function(src){

    var config = require('../config');
    let stringUtil = require('../utils/stringUtil');
    let truncatehtml = require('truncate-html');
    let cimage = "";
    let collegeSeo = "";
    let overviewText = "";
    let degreeDesc = "";
	var adList=[];
	src.forEach(function(obj)
	{	
        if (obj.college_logo == "") {
            cimage = "no-college.png";
        } else {
            cimage = obj.college_logo;
        }

        if(obj.seo_name){
            collegeSeo = obj.seo_name;
        }else{
            collegeSeo = obj.college_name;
        }
        if(obj.overview){
            overviewText = truncatehtml(obj.overview, 300, { stripTags: true });
        }else{
            overviewText = "";
        }
        degreeDesc = truncatehtml(obj.degree_desc, 300, { stripTags: true });
		adList.push({
            collegeId: obj.id,
            college_name: obj.college_name,
            collegeAlias: obj.college_alias,
            collegeDesc: overviewText,
            collegeDegreeDesc: degreeDesc?degreeDesc:'',
            collegeUrl:stringUtil.collegeNameUrl(collegeSeo),
            accessLevel: obj.access_level,
            collegeLogo: config.AWS_IMAGE_RESOURCE_COLLEGE + cimage,
            collegeContact: obj.contact_email
		});
	});
	return adList;
};

module.exports = bounceEmailAdvertiseOrderModel;