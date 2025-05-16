let registerCollegeListModel = async function (src, state, surrounding_state, militaryStatus,majorIds) {
  let config = require('../config');
  let stringUtil = require('../utils/stringUtil');
  const branchService =require('../services/branchService');
  let list = [];
  var finalList = [];
  var orderList = [];
  let cimage = "";
  let giBillData = await branchService.getAdminSetting("gi_bill");
	const giBill = giBillData ? parseFloat(giBillData) : 0;
  const { checkPrivateCollege } = require('../utils/commonUtils');
  // let matchPercent = 73;
  src.forEach(function (obj) {
    if (obj.college_logo == "") {
      cimage = "no-college.png";
    } else {
      cimage = obj.college_logo;
    }

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
    /*if (obj.majorCount > 0 || obj.specific_profile_id != 0) {
      percentAreaofFocus = 27;
      if(obj.checkSecondary > 0){
        percentAreaofFocus = percentAreaofFocus + 14;
      }
    } else {
      percentAreaofFocus = 0;
    }*/

    // let percentAreaofFocus = 14;
    // if(totalAreaofFocus != 0){
    //   percentAreaofFocus = Math.round((maCount/totalAreaofFocus)*14);
    // }

    let totalmatchPercent = 0;
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

    if (list.findIndex(x => x.collegeId == obj.collegeId) < 0) {
      list.push({
        collegeId: obj.collegeId,
        college_name: obj.college_name,
        collegeAlias: obj.college_alias,
        accessLevel: obj.access_level,
        address: obj.address,
        city: obj.city,
        state: obj.state,
        postalCode: obj.postal_code,
        phoneNumber: obj.phone_number,
        website: obj.website,
        percentMatch: totalmatchPercent,
        collegeLogo: config.AWS_IMAGE_RESOURCE_COLLEGE + cimage,
        isSpecificDegree: obj.isSpecificDegree,
        specificProfileId: obj.specificProfileId,
        programMatcher: 'no',
        parentCollegeId: obj.parentCollegeId
      });
    }

  });


  if (list.length > 5) {
    orderList = list.splice(0, 5);
    let randomList = stringUtil.get_random(list);
    finalList = [...orderList, ...randomList];
  } else {
    finalList = list;
  }

  return finalList;
};

module.exports = registerCollegeListModel;