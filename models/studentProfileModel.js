let studentProfileModel = function (src) {
  let config = require('../config');
  let stringUtil = require('../utils/stringUtil');
  let moment = require('moment');
  let list = [];
  let pimage = '';
  let militaryBranch = '';
  let militaryfullRank = '';
  let militaryshortRank = '';
  let rankName = '';
  let emptyprofile = 0;
  let fullprofile = 0;
  let dividedby = 0;
  let percentage = 0;
  let percentageComplete = 0;
  let start_date = null;
  let end_date = null;
  let dob = null;
  let term_comm = '';
  let vaDisabilityRating = "";
  src.forEach(function (obj) {
    fullprofile += 1;
    if (obj.profile_image == '') {
      pimage = 'no-profile.png';
      emptyprofile += 1;
    } else {
      pimage = obj.profile_image;
    }

    if (obj.branch_short_name) {
      militaryBranch = obj.branch_short_name.trim();
    }

    /*if(obj.rank_full_name){
			militaryfullRank = obj.rank_full_name.trim();
		}

		if(obj.rank_short_name){
			militaryshortRank = obj.rank_short_name.trim();
		}

		if(militaryshortRank != "" && militaryfullRank != ""){
			rankName = militaryshortRank+" - "+militaryfullRank;
		}else if(militaryshortRank != ""){
			rankName = militaryshortRank;
		}else if(militaryfullRank != ""){
			rankName = militaryfullRank;
		}*/

    if (obj.name != '') {
      rankName = obj.name;
    }

    fullprofile += 1;
    if (obj.first_name == '') {
      emptyprofile += 1;
    }

    fullprofile += 1;
    if (obj.last_name == '') {
      emptyprofile += 1;
    }

    fullprofile += 1;
    if (obj.address == '' || obj.address == null) {
      emptyprofile += 1;
    }

    fullprofile += 1;
    if (obj.city == '' || obj.city == null) {
      emptyprofile += 1;
    }

    fullprofile += 1;
    if (obj.state == '' || obj.state == null) {
      emptyprofile += 1;
    }

    fullprofile += 1;
    if (obj.postal_code == '' || obj.postal_code == null) {
      emptyprofile += 1;
    }

    fullprofile += 1;
    if (obj.gender == '' || obj.gender == null) {
      emptyprofile += 1;
    }

    fullprofile += 1;
    if (obj.dob == '' || obj.dob == null) {
      emptyprofile += 1;
    }

    fullprofile += 1;
    if (obj.marital_status == '' || obj.marital_status == null) {
      emptyprofile += 1;
    }

    fullprofile += 1;
    if (obj.ethnicity == '' || obj.ethnicity == null) {
      emptyprofile += 1;
    }

    fullprofile += 1;
    if (obj.phone_number == '' || obj.phone_number == null) {
      emptyprofile += 1;
    }

    fullprofile += 1;
    if (obj.military_status == '' || obj.military_status == null) {
      emptyprofile += 1;
    }

    fullprofile += 1;
    if (obj.military_branch == '' || obj.military_branch == null) {
      emptyprofile += 1;
    }

    if (
      (obj.military_status != 'Military Family Member') &
      (obj.military_status != 'Prospective ROTC')
    ) {
      fullprofile += 1;
      if (obj.military_rank == null) {
        emptyprofile += 1;
      }
    }

    if (
      obj.military_status != 'Military Family Member' &&
      obj.military_status != 'Prospective ROTC'
    ) {
      fullprofile += 1;
      if (
        obj.service_start_date == '0000-00-00 00:00:00' ||
        obj.service_start_date == '0000-00-00' ||
        obj.service_start_date == null
      ) {
        emptyprofile += 1;
      }
    }

    if (
      obj.military_status != 'Military Family Member' &&
      obj.military_status != 'Prospective ROTC'
    ) {
      fullprofile += 1;
      if (
        obj.service_end_date == '0000-00-00 00:00:00' ||
        obj.service_end_date == '0000-00-00' ||
        obj.service_end_date == null
      ) {
        emptyprofile += 1;
      }
    }

    if (
      obj.military_status != 'Military Family Member' &&
      obj.military_status != 'Prospective ROTC'
    ) {
      fullprofile += 1;
      if (
        obj.enrollment_military_status == '' ||
        obj.enrollment_military_status == null
      ) {
        emptyprofile += 1;
      }
    }

    fullprofile += 1;
    if (obj.last_school_attended == '' || obj.last_school_attended == null) {
      emptyprofile += 1;
    }

    fullprofile += 1;
    if (
      obj.academic_interest_1 == '' ||
      obj.academic_interest_1 == 0 ||
      obj.academic_interest_1 == null
    ) {
      emptyprofile += 1;
    } else {
      fullprofile += 1;
    }

    fullprofile += 1;
    if (obj.personal_statement == '' || obj.personal_statement == null) {
      emptyprofile += 1;
    } else {
      fullprofile += 1;
    }
    //console.log("fullprofile",fullprofile);
    //console.log("emptyprofile",emptyprofile)
    dividedby = emptyprofile / fullprofile;
    percentage = dividedby * 100;
    percentageComplete = 100 - percentage;

    if (
      obj.service_start_date == '0000-00-00 00:00:00' ||
      obj.service_start_date == '0000-00-00' ||
      obj.service_start_date == '' ||
      obj.service_start_date == null
    ) {
      start_date = null;
    } else {
      start_date = moment(obj.service_start_date).format('MM/DD/YYYY');
    }

    if (
      obj.service_end_date == '0000-00-00 00:00:00' ||
      obj.service_end_date == '0000-00-00' ||
      obj.service_end_date == '' ||
      obj.service_end_date == null
    ) {
      end_date = null;
    } else {
      end_date = moment(obj.service_end_date).format('MM/DD/YYYY');
    }

    if (obj.terms_of_comm == 1) {
      term_comm = 'Y';
    } else if (obj.terms_of_comm == 0) {
      term_comm = 'N';
    } else {
      term_comm = obj.terms_of_comm;
    }

    if (
      obj.dob == '0000-00-00 00:00:00' ||
      obj.dob == '0000-00-00' ||
      obj.dob == '' ||
      obj.dob == null
    ) {
      dob = null;
    } else {
      dob = moment(obj.dob).format('MM/DD/YYYY');
    }

    if(obj.va_disability_rating){
      vaDisabilityRating = obj.va_disability_rating;
    }else if(!obj.va_disability_rating && obj.primary_source && obj.primary_source.toLowerCase() == "vaclaims"){
      vaDisabilityRating = 10;
    }

    list.push({
      uuid: obj.uuid,
      firstName: obj.first_name,
      lastName: obj.last_name,
      middleName: obj.middle_initial,
      email: obj.email,
      academicFlag: obj.academic_flag,
      profileImage: config.AWS_IMAGE_RESOURCE_STUDENT + pimage,
      address: obj.address,
      city: obj.city,
      state: obj.state,
      postalCode: obj.postal_code,
      gender: obj.gender,
      termsOfComm: term_comm,
      utmSource: obj.utm_source,
      utmMedium: obj.utm_medium,
      utmCampaign: obj.utm_campaign,
      lastLogin:
        obj.last_login != '0000-00-00 00:00:00' && obj.last_login != ''
          ? stringUtil.convertFromUTC(obj.last_login, 'America/Chicago')
          : '',
      dateCreated:
        obj.date_created != '0000-00-00 00:00:00' && obj.date_created != ''
          ? moment(obj.date_created).format('MM/DD/YYYY')
          : '',
      dob: dob,
      timeZone: obj.time_zone,
      phoneNumber: obj.phone_number,
      veteranStatus: obj.veteran_status,
      maritalStatus: obj.marital_status,
      ethnicity: obj.ethnicity,
      militaryStatus: obj.military_status
        ? obj.military_status.toLowerCase() == 'active'
          ? 'Active'
          : obj.military_status.toLowerCase() == 'guard'
          ? 'Guard'
          : obj.military_status.toLowerCase() == 'retired'
          ? 'Retiree'
          : obj.military_status
        : obj.military_status,
      militaryBranch: obj.military_branch,
      militaryBranchName: militaryBranch,
      militaryRank: obj.military_rank,
      militaryRankName: rankName,
      militaryMos: obj.mos,
      serviceStartDate: start_date,
      serviceEndDate: end_date,
      enrollmentMilitaryStatus: obj.enrollment_military_status,
      militaryAwards1: obj.military_awards_1,
      militaryAwards2: obj.military_awards_2,
      militaryAwards3: obj.military_awards_3,
      lastSchoolAttended: obj.last_school_attended,
      nameOfSchool: obj.name_of_school,
      gpa: obj.gpa,
      satScore: obj.sat_score,
      actScore: obj.act_score,
      creditsEarned: obj.credits_earned,
      areaOfStudy: obj.area_of_study,
      academicInterest1: obj.academic_interest_1,
      academicInterest2: obj.academic_interest_2,
      academicInterest3: obj.academic_interest_3,
      academicInterest4: obj.academic_interest_4,
      academicInterest5: obj.academic_interest_5,
      personalStatement: obj.personal_statement,
      privacyUniversal: obj.privacy_universal,
      privacyPhoto: obj.privacy_photo,
      privacyPersonal: obj.privacy_personal,
      privacyContact: obj.privacy_contact,
      privacyAcademic: obj.privacy_academic,
      academic1: obj.academic1,
      academic2: obj.academic2,
      academic3: obj.academic3,
      academic4: obj.academic4,
      academic5: obj.academic5,
      award1: obj.award1,
      award2: obj.award2,
      award3: obj.award3,
      schoolType: obj.school_type,
      levelId: obj.level_id,
      bucketId: obj.bucket_id,
      secBucketId: obj.secondary_bucket_id,
      jstTranscriptFile: obj.jst_transcript_file
        ? config.AWS_IMAGE_RESOURCE_STUDENT + obj.jst_transcript_file
        : '',
      percentageComplete: Math.ceil(percentageComplete),
      vaDisabilityRating: vaDisabilityRating,
      highestLevelCompleted: obj.highest_level_completed,
      seperationDate: obj.seperation_date,
      securityClearance: obj.security_clearance,
      primarySource: obj.primary_source,
      secondarySource: obj.secondary_source,
    });
  });
  return list;
};

module.exports = studentProfileModel;
