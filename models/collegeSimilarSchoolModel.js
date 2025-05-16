var collegeSimilarSchoolModel = function (simiarSchools, src, cdata) {
	var config = require('../config');
	let stringUtil = require('../utils/stringUtil');
	let porderList = [];
	let nporderList = [];
	let partnerList = [];
	let nonpartnerList = [];
	let countList = 5;
	let finalPartnerList = [];
	let finalNpartnerList = [];
	let randList = [];
	let finalList = [];

	if(simiarSchools.length) {
		for (const school of simiarSchools) {
			finalList.push({
				collegeId: school.id,
				collegeName: school.college_name,
				collegeUrl: stringUtil.collegeNameUrl(school.college_alias ? school.college_alias : school.seo_name ? school.seo_name : school.college_name),
				accessLevel: school.access_level,
				totalmatchPercent: getMatchPercent(cdata, school),
				collegeLogo: config.AWS_IMAGE_RESOURCE_COLLEGE + school.college_logo
			})
		}
	}

	src.forEach(function (obj) {
		const matchPercent = getMatchPercent(cdata, obj);
		if(obj.access_level.toLowerCase() == "patriot"){
			partnerList.push({
				collegeId: obj.id,
				collegeName: obj.college_name,
				collegeUrl: stringUtil.collegeNameUrl(obj.college_alias ? obj.college_alias : obj.seo_name ? obj.seo_name : obj.college_name),
				accessLevel: obj.access_level,
				totalmatchPercent: matchPercent,
				collegeLogo: config.AWS_IMAGE_RESOURCE_COLLEGE+obj.college_logo
			});
		}else{
			nonpartnerList.push({
				collegeId: obj.id,
				collegeName: obj.college_name,
				collegeUrl: stringUtil.collegeNameUrl(obj.college_alias ? obj.college_alias : obj.seo_name ? obj.seo_name : obj.college_name),
				accessLevel: obj.access_level,
				totalmatchPercent: matchPercent
			});
		}
    });
	
	if(partnerList.length) {
		porderList = partnerList.sort(function (a, b) { return b.totalmatchPercent - a.totalmatchPercent });
		if(porderList.length >= 2) {
			finalPartnerList = porderList.splice(0,2);
			countList = 3;
		} else {
			finalPartnerList = porderList;
			countList = 4;
		}
	}

	if(nonpartnerList.length) {
		nporderList = nonpartnerList.sort(function (a, b) { return b.totalmatchPercent - a.totalmatchPercent });
		if(nporderList.length >= countList) {
			finalNpartnerList =  nporderList.splice(0, countList);
		} else {
			finalNpartnerList =  nporderList.splice(0, nporderList.length);
		}
	}

	for (const partner of finalPartnerList) {
		if(finalList.filter(x => x.accessLevel.toLowerCase() === 'patriot').length < 2) {
			finalList.push(partner);
		} else {
			break;
		}
	}
	for (const nonPartner of finalNpartnerList) {
		if(finalList.length < 5) {
			finalList.push(nonPartner)
		} else {
			break;
		}
	}
	//finalList = orderList.splice(0, 5);
	//console.log("OO:",finalList);
	const formattedList = [];
	for (const college of finalList) {
		if(college.accessLevel.toLowerCase() === 'patriot') {
			formattedList.unshift(college);
		} else {
			formattedList.push(college);
		}
	}
	return formattedList;
};

function getMatchPercent(cdata, college) {
	matchPercent = 0;
	if(cdata.yearsOffered.toLowerCase() == college.years_offered.toLowerCase()) {
		matchPercent = matchPercent+ 15;
	}
	
	if(cdata.state.toLowerCase() == college.state.toLowerCase()) {
		matchPercent = matchPercent+ 40;
	}
	
	if(cdata.religiousAffiliation && cdata.religiousAffiliation.toLowerCase() == college.religious_affiliation.toLowerCase()) {
		matchPercent = matchPercent+ 20;
	}
	
	if(cdata.ethnicAffiliation && cdata.ethnicAffiliation.toLowerCase() == college.ethnic_affiliation.toLowerCase()) {
		matchPercent = matchPercent+ 30;
	}
	
	if(cdata.studentPopulation == college.student_population) {
		matchPercent = matchPercent+ 5;
	}
	
	if(college.public_private && cdata.publicPrivate) {
		if(cdata.publicPrivate.toLowerCase() == college.public_private.toLowerCase()){
			matchPercent = matchPercent+ 15;
		}
	}/*else{
			matchPercent = matchPercent+ 5;
	}*/
	return matchPercent;
}

module.exports = collegeSimilarSchoolModel;