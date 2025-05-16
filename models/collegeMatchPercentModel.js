let collegeMatchPercentModel = async function(obj,state,major_count, surrounding_state, militaryStatus,secondaryBuckets){
    let config = require('../config');
    let stringUtil = require('../utils/stringUtil');
    const branchService =require('../services/branchService');
    // let defaultPercent = 73;
    // let matchPercent = "";
    let preferenceState = false;
    let surroundingState = false;
    let giBillData = await branchService.getAdminSetting("gi_bill");
	  const giBill = giBillData ? parseFloat(giBillData) : 0;
    const { checkPrivateCollege } = require('../utils/commonUtils');

    let percentageMilitarySupport = 0;
    if (obj.full_time_vet_counselors && obj.full_time_vet_counselors.toLowerCase() == 'yes') {
      percentageMilitarySupport = percentageMilitarySupport + 8;
    }
   
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

    // let percentAreaofFocus = 0;
    if(major_count > 0){
        percentAreaofFocus = 27;
        if(secondaryBuckets > 0){
          percentAreaofFocus = percentAreaofFocus + 14;
        }
    }else{
      percentAreaofFocus = 0;
    }

    let totalmatchPercent = 0;

    if (stringUtil.checkDataInArray(state,obj.state)) {
      preferenceState = true;
      totalmatchPercent = (percentAreaofFocus + percentageMilitarySupport + 27);
    } else if(state.toLowerCase() == 'online' && obj.college_type == "online"){
      preferenceState = true;
      totalmatchPercent = (percentAreaofFocus + percentageMilitarySupport + 27);
    } else if (stringUtil.checkDataInArray(surrounding_state,obj.state) && obj.college_type != "online") {
      surroundingState = true;
      totalmatchPercent = (percentAreaofFocus + percentageMilitarySupport + 20);
    } else if(state.toLowerCase() != 'online' && obj.college_type == "online"){
      totalmatchPercent = (percentAreaofFocus + percentageMilitarySupport + 10);
    } else{
      totalmatchPercent = (percentAreaofFocus + percentageMilitarySupport);
    }

    

    return totalmatchPercent ={
      totalmatchPercent:totalmatchPercent,
      preferenceState:preferenceState,
      surroundingState:surroundingState,
      areaOfFocus: percentAreaofFocus
    };
};

module.exports = collegeMatchPercentModel;