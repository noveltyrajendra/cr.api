var collegeModel = async function(src,count,type,cids,filters){

	var config = require('../config');
	var truncatehtml = require('truncate-html');
	let stringUtil = require('../utils/stringUtil');
	const branchService =require('../services/branchService');
	var finalList = [];
	var orderList = [];
	var list=[];
	var obj;
	let giBillData = await branchService.getAdminSetting("gi_bill");
	const giBill = giBillData ? parseFloat(giBillData) : 0;
	const { checkPrivateCollege } = require('../utils/commonUtils');
	
	src.forEach(function(obj)
	{ 
		let overviewText = "";
		let isContacted = "";
		let collegeSeo = "";
		let tuitionCost = "";
		let giBillCoverage = "";
		let studentVeteranCost = "";
		let yellowRibbonCoverage = "";
		let costForMilitary = "no";
		let totalCountResult = 0;
		let filterByZeroCost = false;
		if(obj.contacted){
			isContacted=obj.contacted
		}
		if(obj.seo_name){
			collegeSeo = obj.seo_name;
		}else{
			collegeSeo = obj.college_name;
		}
		if(obj.display_text){
			overviewText = truncatehtml(obj.display_text, 300, { stripTags: true });
		}else{
			overviewText = truncatehtml(obj.overview, 300, { stripTags: true });
		}

		if (obj.public_private && checkPrivateCollege(obj.public_private.toLowerCase())) {
			tuitionCost = obj.in_state_tuition >= obj.out_state_tuition ? obj.in_state_tuition : obj.out_state_tuition;
			if (tuitionCost < giBill) {
				giBillCoverage = tuitionCost;
				studentVeteranCost = tuitionCost - giBillCoverage;
			} else {
				giBillCoverage = giBill;
				if (obj.yellow_ribbon == "YES") {
					if (obj.yellow_ribbon_coverage) {
						yellowRibbonCoverage = obj.yellow_ribbon_coverage;
						let tempNumber = tuitionCost - giBillCoverage;
						if (tempNumber < yellowRibbonCoverage) {
							yellowRibbonCoverage = tempNumber;
						}
						studentVeteranCost = tuitionCost - (giBillCoverage + yellowRibbonCoverage);
					} else {
						studentVeteranCost = tuitionCost - giBillCoverage;
					}
				} else if (obj.yellow_ribbon == "NO") {
					studentVeteranCost = tuitionCost - giBillCoverage;
				}
			}
		}else{
			tuitionCost = obj.in_state_tuition;
			giBillCoverage = tuitionCost;
			studentVeteranCost = tuitionCost - giBillCoverage;
		}

		if(obj.tuition_cpch && obj.tuition_cpch > 250) {
			costForMilitary = "no";
		}else if(obj.tuition_cpch){
			costForMilitary = "yes";
		}
		
		if(filters && filters[0]['filterBy'] != "none"){
			filterByZeroCost = true;
		}
		
		if(list.findIndex(x=>(x.collegeId == obj.collegeId && obj.isSpecificDegree == 0)) < 0){
			if(filterByZeroCost && filters[0]['filterBy'] == "both" && studentVeteranCost == 0 && costForMilitary == 'yes'){
				list.push({
					collegeId:obj.collegeId,
					collegeName:stringUtil.manageCollegeName(obj.college_name),
					isSpecificDegree: obj.isSpecificDegree,
					specificProfileId: obj.specific_profile_id,
					parentCollegeId: obj.parentCollegeId,
					degreeName: obj.degree_name,
					collegeAlias: obj.college_alias,
					collegeContact:obj.contact_email,
					streetAddress:obj.address,
					city:obj.city,
					state:obj.state,
					postalCode:obj.postal_code,
					phone:obj.phone_number,
					website:obj.website,
					overview:overviewText,
					collegeUrl:stringUtil.collegeNameUrl(collegeSeo),
					collegeType:obj.college_type,
					accessLevel:obj.access_level,
					displayOrder: obj.display_order?obj.display_order:9999,
					contacted:isContacted,
					collegeLogo:config.AWS_IMAGE_RESOURCE_COLLEGE+obj.college_logo,
					tuitionCost: studentVeteranCost,
					militaryCost: costForMilitary,
					phoneRequired: obj.phone_required,
					parentId: obj.parent_id,
					showParentChild: obj.show_parent_child,
					//collegePhoto:config.AWS_IMAGE_RESOURCE_COLLEGE+obj.college_photo
				});
			}else if(filterByZeroCost && filters[0]['filterBy'] == "veterans" && studentVeteranCost == 0){
				list.push({
					collegeId:obj.collegeId,
					collegeName:stringUtil.manageCollegeName(obj.college_name),
					isSpecificDegree: obj.isSpecificDegree,
					specificProfileId: obj.specific_profile_id,
					parentCollegeId: obj.parentCollegeId,
					degreeName: obj.degree_name,
					collegeAlias: obj.college_alias,
					collegeContact:obj.contact_email,
					streetAddress:obj.address,
					city:obj.city,
					state:obj.state,
					postalCode:obj.postal_code,
					phone:obj.phone_number,
					website:obj.website,
					overview:overviewText,
					collegeUrl:stringUtil.collegeNameUrl(collegeSeo),
					collegeType:obj.college_type,
					accessLevel:obj.access_level,
					displayOrder: obj.display_order?obj.display_order:9999,
					contacted:isContacted,
					collegeLogo:config.AWS_IMAGE_RESOURCE_COLLEGE+obj.college_logo,
					tuitionCost: studentVeteranCost,
					militaryCost: costForMilitary,
					phoneRequired: obj.phone_required,
					parentId: obj.parent_id,
					showParentChild: obj.show_parent_child,
					//collegePhoto:config.AWS_IMAGE_RESOURCE_COLLEGE+obj.college_photo
				});
			}else if(filterByZeroCost && filters[0]['filterBy'] == "military" && costForMilitary == 'yes'){
				list.push({
					collegeId:obj.collegeId,
					collegeName:stringUtil.manageCollegeName(obj.college_name),
					isSpecificDegree: obj.isSpecificDegree,
					specificProfileId: obj.specific_profile_id,
					parentCollegeId: obj.parentCollegeId,
					degreeName: obj.degree_name,
					collegeAlias: obj.college_alias,
					collegeContact:obj.contact_email,
					streetAddress:obj.address,
					city:obj.city,
					state:obj.state,
					postalCode:obj.postal_code,
					phone:obj.phone_number,
					website:obj.website,
					overview:overviewText,
					collegeUrl:stringUtil.collegeNameUrl(collegeSeo),
					collegeType:obj.college_type,
					accessLevel:obj.access_level,
					displayOrder: obj.display_order?obj.display_order:9999,
					contacted:isContacted,
					collegeLogo:config.AWS_IMAGE_RESOURCE_COLLEGE+obj.college_logo,
					tuitionCost: studentVeteranCost,
					militaryCost: costForMilitary,
					phoneRequired: obj.phone_required,
					parentId: obj.parent_id,
					showParentChild: obj.show_parent_child,
					//collegePhoto:config.AWS_IMAGE_RESOURCE_COLLEGE+obj.college_photo
				});
			}else if(filters[0]['filterBy'] == "none"){
				list.push({
					collegeId:obj.collegeId,
					collegeName:stringUtil.manageCollegeName(obj.college_name),
					isSpecificDegree: obj.isSpecificDegree,
					specificProfileId: obj.specific_profile_id,
					parentCollegeId: obj.parentCollegeId,
					degreeName: obj.degree_name,
					collegeAlias: obj.college_alias,
					collegeContact:obj.contact_email,
					streetAddress:obj.address,
					city:obj.city,
					state:obj.state,
					postalCode:obj.postal_code,
					phone:obj.phone_number,
					website:obj.website,
					overview:overviewText,
					collegeUrl:stringUtil.collegeNameUrl(collegeSeo),
					collegeType:obj.college_type,
					accessLevel:obj.access_level,
					displayOrder: obj.display_order?obj.display_order:9999,
					contacted:isContacted,
					collegeLogo:config.AWS_IMAGE_RESOURCE_COLLEGE+obj.college_logo,
					tuitionCost: studentVeteranCost,
					militaryCost: costForMilitary,
					phoneRequired: obj.phone_required,
					parentId: obj.parent_id,
					showParentChild: obj.show_parent_child,
					//collegePhoto:config.AWS_IMAGE_RESOURCE_COLLEGE+obj.college_photo
				});
			}
		}
	});
	//console.log("BL:",list.length)
	//console.log("TYPE:",type);
	if(type == "random"){
		/*if(list.length > 5){
			orderList = list.splice(0, 5).sort((a, b) => parseInt(a.displayOrder) - parseInt(b.displayOrder));
			let randomList = stringUtil.get_random(list);
			finalList = [...orderList,...randomList];
		}else{*/
			finalList = list;
		//}
	}else{
		finalList = list;
	}
	if(filters && filters[0]['filterBy'] != "none"){
		totalCountResult = finalList.length;
	}else{
		totalCountResult = count;
	}
	obj={
		count:totalCountResult,
		collegelist:finalList,
		collegeids:cids
	}
	return obj;
};

module.exports = collegeModel;