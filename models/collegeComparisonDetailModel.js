const stringUtil = require("../utils/stringUtil");
const axios = require("axios");

const collegeComparisonDetailModel = async (college) => {
  const { collegeNameUrl } = require("../utils/stringUtil");
  const { AWS_IMAGE_RESOURCE_COLLEGE } = require("../config");
  const branchService = require('../services/branchService');

  const collegeSeo = college.seo_name ? college.seo_name : college.college_name;
  const {
    PRIVATE_TUITION_CONSTANT,
    TUITION_CPCH_COMPARATOR,
    POPULATION_COMPARATOR_LOW,
    POPULATION_COMPARATOR_HIGH,
    PUBLIC_SCHOOL,
    PRIVATE_SCHOOL,
    BOOK_COMPARATOR,
    TUITION_ASSISTANCE_BENEFITS,
    SIZE_SMALL,
    SIZE_MEDIUM,
    SIZE_LARGE,
  } = require("../constants/collegeConstants.js");
  const { checkPrivateCollege } = require('../utils/commonUtils');
  let tuitionCost = "";
  let giBillCoverage = "";
  let studentVeteranCost = "";
  let yellowRibbonCoverage = 0;
  let militaryStudentCost = "";
  let costOfStudentVeteran = "";
  let outPocketCost = 0;
  let tuitionAssistantRate = 0;
  let size = "";
  let giBillData = await branchService.getAdminSetting("gi_bill");
	const giBill = giBillData ? parseFloat(giBillData) : 0;
  if (college.studentPopulation < POPULATION_COMPARATOR_LOW) {
    size = SIZE_SMALL;
  } else if (
    college.studentPopulation >= POPULATION_COMPARATOR_LOW &&
    college.studentPopulation < POPULATION_COMPARATOR_HIGH
  ) {
    size = SIZE_MEDIUM;
  } else {
    size = SIZE_LARGE;
  }
  if (
    college.public_private &&
    checkPrivateCollege(college.public_private.toLowerCase())
  ) {
    tuitionCost =
      college.in_state_tuition >= college.out_state_tuition
        ? college.in_state_tuition
        : college.out_state_tuition;
    if (tuitionCost < giBill) {
      giBillCoverage = tuitionCost;
      studentVeteranCost = tuitionCost - giBillCoverage;
    } else {
      giBillCoverage = giBill;
      if (college.yellow_ribbon.toLowerCase() === "yes") {
        if (college.yellow_ribbon_coverage) {
          yellowRibbonCoverage = college.yellow_ribbon_coverage;
          let tempNumber = tuitionCost - giBillCoverage;
          if (tempNumber < yellowRibbonCoverage) {
            yellowRibbonCoverage = tempNumber;
          }
          studentVeteranCost =
            tuitionCost - (giBillCoverage + yellowRibbonCoverage);
        } else {
          studentVeteranCost = tuitionCost - giBillCoverage;
        }
      } else if (college.yellow_ribbon.toLowerCase() == "no") {
        studentVeteranCost = tuitionCost - giBillCoverage;
      }
    }
  }else{
    tuitionCost = college.in_state_tuition;
    giBillCoverage = tuitionCost;
    studentVeteranCost = tuitionCost - giBillCoverage;
  }
  if(giBillCoverage > 0){
    outPocketCost = giBillCoverage - college.in_state_tuition;
  }
  if(outPocketCost > 0){
    tuitionAssistantRate = outPocketCost - 250;
  }
  if (college.tuition_cpch && college.tuition_cpch > TUITION_CPCH_COMPARATOR) {
    militaryStudentCost = college.tuition_cpch - TUITION_CPCH_COMPARATOR;
  } else {
    militaryStudentCost = 0;
  }

  /*if (college.books && college.books > BOOK_COMPARATOR) {
    costOfStudentVeteran = college.books - BOOK_COMPARATOR;
  } else {
    costOfStudentVeteran = 0;
  }*/
  if(tuitionCost){
    costOfStudentVeteran = tuitionCost - giBillCoverage - yellowRibbonCoverage;
  }else{
    costOfStudentVeteran = 0;
  }
  let base64Image = "";
  if(college.college_logo){
    const url = AWS_IMAGE_RESOURCE_COLLEGE + college.college_logo;
    let checkImage = await checkUrl(url);
    if(checkImage){
      const ext = college.college_logo.substr((college.college_logo.lastIndexOf('.') + 1));
      const image = await axios.get(url, {responseType: 'arraybuffer'});
      const raw = Buffer.from(image.data).toString('base64');
      base64Image = "data:image/" + ext + ";base64,"+raw;
    }
  }
  
  return {
    collegeName: college.college_name,
    collegeLogo: AWS_IMAGE_RESOURCE_COLLEGE + college.college_logo,
    collegeUrl: college.college_alias,
    accessLevel: college.access_level,
    tuitionCost,
    giBillCoverage,
    yellowRibbon: college.yellow_ribbon
      ? college.yellow_ribbon.toLowerCase()
      : "",
    giBill: college.gi_bill,
    cpchGraduateCampus: college.cpch_graduate_campus
      ? college.cpch_graduate_campus
      : 0,
    cpchGraduateOnline: college.cpch_graduate_online
      ? college.cpch_graduate_online
      : 0,
    cpchUndergraduateCampus: college.cpch_undergraduate_campus
      ? college.cpch_undergraduate_campus
      : 0,
    cpchUndergraduateOnline: college.cpch_undergraduate_online
      ? college.cpch_undergraduate_online
      : 0,
    approvedTaFunding: college.approved_ta_funding
      ? college.approved_ta_funding.toLowerCase()
      : "",
    awardsAceCredit: college.awards_ace_credit
      ? college.awards_ace_credit.toLowerCase()
      : "",
    fullTimeVetCounselors: college.full_time_vet_counselors
      ? college.full_time_vet_counselors.toLowerCase()
      : college.full_time_vet_counselors,
    scholarshipsForVeterans: college.scholarships_for_veterans
      ? college.scholarships_for_veterans.toLowerCase()
      : "",
    reducedTuition: college.reduced_tuition
      ? college.reduced_tuition.toLowerCase()
      : college.reduced_tuition,
    publicPrivate: college.public_private,
    schoolSetting: college.setting,
    onlineClasses: college.online_classes,
    onlineClassesGraduate: college.online_classes_graduate,
    onlineClassesUndergraduate: college.online_classes_undergraduate,
    accredit: college.accredit,
    size,
    collegeId: college.college_id,
    isMatched: college.isMatched,
    bah: college.bah,
    academicLevel: college.academic_level,
    tuitionAssistanceBenefits: TUITION_ASSISTANCE_BENEFITS,
    collegeContact: college.contact_email,
    tuitionCpch: college.tuition_cpch,
    costOfStudentVeteran,
    city: college.city,
    state: college.state,
    outOfPocketCost: militaryStudentCost,
    tuitionAssistanceRate: TUITION_CPCH_COMPARATOR,
    studentVeteranGroup: college.club_assoc_campus,
    giBillStudent: college.gi_bill,
    collegeType: college.college_type,
    yellowRibbonCoverage: yellowRibbonCoverage,
		studentVeteranCost: studentVeteranCost,
    imageBase64: base64Image,
    // outOfPocketCPHUndergraduate:
    //   (college.cpch_undergraduate_campus
    //     ? college.cpch_undergraduate_campus
    //     : 0) - TUITION_ASSISTANCE_BENEFITS,
    // outOfPocketCPHUndergraduateOnline:
    //   (college.cpch_undergraduate_online
    //     ? college.cpch_undergraduate_online
    //     : 0) - TUITION_ASSISTANCE_BENEFITS,
    // outOfPocketCPHGraduate:
    //   (college.cpch_graduate_campus ? college.cpch_graduate_campus : 0) -
    //   TUITION_ASSISTANCE_BENEFITS,
    // outOfPocketCPHGraduateOnline:
    //   (college.cpch_graduate_online ? college.cpch_graduate_online : 0) -
    //   TUITION_ASSISTANCE_BENEFITS,
  };
};

const checkUrl = async (url) => {
  try {
    await axios.head(url);
    return true;
  } catch (error) {
    if (error.response.status >= 400) {
      return false;
    }
  }
}

module.exports = collegeComparisonDetailModel;
