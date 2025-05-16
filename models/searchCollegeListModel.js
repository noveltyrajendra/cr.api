let searchCollegeListModel = async function(src,totalAreaofFocus,militarySupport,state,cid,surrounding_state, militaryStatus,majorIds){
  let config = require('../config');
  let stringUtil = require('../utils/stringUtil');
  const branchService =require('../services/branchService');
  let truncatehtml = require('truncate-html');
  let list=[];
  var finalList = [];
	var orderList = [];
  let cimage= "";
  let collegeSeo = "";
  let overviewText = "";
  let giBillData = await branchService.getAdminSetting("gi_bill");
	const giBill = giBillData ? parseFloat(giBillData) : 0;
  const { checkPrivateCollege } = require('../utils/commonUtils');
  // let matchPercent = 73;
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

    // let percentageMilitarySupport = 0;
    
    // if(militarySupport == 'yes'){
    //   if(obj.full_time_vet_counselors && obj.full_time_vet_counselors.toLowerCase()=='yes'){
    //     percentageMilitarySupport = percentageMilitarySupport + 4;
    //   }
    //   if(obj.principles_of_excellence && obj.principles_of_excellence.toLowerCase()=='yes'){
    //     percentageMilitarySupport = percentageMilitarySupport + 4;
    //   }
    //   if(obj.awards_ace_credit && obj.awards_ace_credit.toLowerCase()=='yes'){
    //     percentageMilitarySupport = percentageMilitarySupport + 5;
    //   }
    // }else{
    //   if(obj.full_time_vet_counselors && obj.full_time_vet_counselors.toLowerCase()=='no'){
    //     percentageMilitarySupport = percentageMilitarySupport + 4;
    //   }
    //   if(obj.principles_of_excellence && obj.principles_of_excellence.toLowerCase()=='no'){
    //     percentageMilitarySupport = percentageMilitarySupport + 4;
    //   }
    //   if(obj.awards_ace_credit && obj.awards_ace_credit.toLowerCase()=='no'){
    //     percentageMilitarySupport = percentageMilitarySupport + 5;
    //   }
    // }
    let percentageMilitarySupport = 0;
    if (obj.full_time_vet_counselors && obj.full_time_vet_counselors.toLowerCase() == 'yes') {
      percentageMilitarySupport = percentageMilitarySupport + 8;
    }
    // if(obj.principles_of_excellence && obj.principles_of_excellence.toLowerCase()=='yes'){
    //   percentageMilitarySupport = percentageMilitarySupport + 4;
    // }
    if (obj.awards_ace_credit && obj.awards_ace_credit.toLowerCase() == 'yes') {
      percentageMilitarySupport = percentageMilitarySupport + 8;
    }

    if (obj.yellow_ribbon && obj.yellow_ribbon.toLowerCase() == 'yes') {
      percentageMilitarySupport = percentageMilitarySupport + 8;
    }else if(obj.yellow_ribbon && obj.yellow_ribbon.toLowerCase() == 'no' && obj.public_private && checkPrivateCollege(obj.public_private.toLowerCase())){
      let tuitionCost = obj.in_state_tuition >= obj.out_state_tuition ? obj.in_state_tuition : obj.out_state_tuition;
      if (tuitionCost > giBill) {
        percentageMilitarySupport = percentageMilitarySupport - 8;
      }
    }

    if (obj.approved_ta_funding && obj.approved_ta_funding.toLowerCase() == 'yes') {
      percentageMilitarySupport = percentageMilitarySupport + 8;
    }else if(obj.approved_ta_funding && obj.approved_ta_funding.toLowerCase() == 'no' && militaryStatus.toLowerCase() == 'active'){
      percentageMilitarySupport = percentageMilitarySupport - 8;
    }

    //if (obj.reduced_tuition && obj.reduced_tuition.toLowerCase() == 'yes') {
    //  percentageMilitarySupport = percentageMilitarySupport + 6;
    //}

    // let maCount = 0;
    // if(obj.majorCount > totalAreaofFocus){
    //   maCount = totalAreaofFocus;
    // }else{
    //   maCount = obj.majorCount;
    // }
    // let percentAreaofFocus = 14;
    // if(totalAreaofFocus != 0){
    //   percentAreaofFocus = Math.round((maCount/totalAreaofFocus)*14);
    // }
    
    if(obj.specific_profile_id != 0){
      percentAreaofFocus = 41;
    }else if(obj.majorCount && obj.majorCount.length > 0){
      percentAreaofFocus = 27;
      if(obj.majorCount !== null){
        primaryMoajorIds = obj.majorCount.split(",");
        if(majorIds && majorIds != ""){
          secondaryMajorIds = majorIds.split(",");
          if(primaryMoajorIds.some(item => secondaryMajorIds.includes(item))){
            percentAreaofFocus = percentAreaofFocus + 14;
          }
        }
      }
    }else{
      percentAreaofFocus = 0;
    }

    // let totalmatchPercent = 0;
    // if(stringUtil.checkDataInArray(state,obj.state)){
    //   totalmatchPercent = matchPercent+percentAreaofFocus+percentageMilitarySupport;
    // }else{
    //   totalmatchPercent = (matchPercent+percentAreaofFocus+percentageMilitarySupport -10);
    // }

    
    let totalmatchPercent = 0;
    if(state.indexOf(",") > -1){
      let stateArr = state.split(",");
      if(stringUtil.checkDataInArray(state,obj.state)){
        totalmatchPercent = (percentAreaofFocus + percentageMilitarySupport + 27);
      } else if(stringUtil.checkDataInArray(state,'Online') && obj.college_type == "online"){
        totalmatchPercent = (percentAreaofFocus + percentageMilitarySupport + 27);
      } else if (stringUtil.checkDataInArray(surrounding_state,obj.state) && obj.college_type != "online") {
        totalmatchPercent = (percentAreaofFocus + percentageMilitarySupport + 20);
      } else if (!stringUtil.checkDataInArray(state,'Online') && obj.college_type == "online") {
        totalmatchPercent = (percentAreaofFocus + percentageMilitarySupport + 10);
      } else{
        totalmatchPercent = (percentAreaofFocus + percentageMilitarySupport);
      }
    }else{
      if (state == obj.state) {
        totalmatchPercent = (percentAreaofFocus + percentageMilitarySupport + 27);
      } else if(state.toLowerCase() == 'online' && obj.college_type == "online"){
        totalmatchPercent = (percentAreaofFocus + percentageMilitarySupport + 27);
      } else if (stringUtil.checkDataInArray(surrounding_state,obj.state) && obj.college_type != "online") {
        totalmatchPercent = (percentAreaofFocus + percentageMilitarySupport + 20);
      } else if(state.toLowerCase() != 'online' && obj.college_type == "online"){
        totalmatchPercent = (percentAreaofFocus + percentageMilitarySupport + 10);
      } else{
        totalmatchPercent = (percentAreaofFocus + percentageMilitarySupport);
      }
    }

    overviewText = truncatehtml(obj.overview, 300, { stripTags: true });
    // if(cid && cid == obj.collegeId){
    //   if(stringUtil.checkDataInArray(state,obj.state)){
    //     totalmatchPercent = totalmatchPercent;
    //   }else{
    //     totalmatchPercent = 0;
    //   }
    // }

    if(list.findIndex(x=>x.collegeId == obj.collegeId && obj.isSpecificDegree == 0) < 0){
      list.push({
        collegeId: obj.collegeId,
        college_name: obj.college_name,
        collegeAlias: obj.college_alias,
        collegeContact: obj.contact_email,
        collegeUrl:stringUtil.collegeNameUrl(collegeSeo),
        address: obj.address,
        city: obj.city,
        state: obj.state,
        accessLevel: obj.access_level,
        postalCode: obj.postal_code,
        phoneNumber: obj.phone_number,
        website: obj.website,
        percentMatch:totalmatchPercent,
        collegeDesc: overviewText,
        collegeLogo: config.AWS_IMAGE_RESOURCE_COLLEGE+cimage,
        specificProfileId: obj.specific_profile_id,
        isSpecificDegree: obj.isSpecificDegree,
        parentCollegeId: obj.parentCollegeId,
        phoneRequired: obj.phone_required,
      });
    }
			
  });
  
  if(list.length > 5){
    orderList = list.splice(0, 5);
    let randomList = stringUtil.get_random(list);
    finalList = [...orderList,...randomList];
  }else{
    finalList = list;
  }

	return finalList;
};

module.exports = searchCollegeListModel;