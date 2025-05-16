var collegeProfileModel = async function (src, majors, tagList, rotcBranchUrl = [],extraInfo=[]) {
	var config = require('../config');
	let stringUtil = require('../utils/stringUtil');
	const branchService =require('../services/branchService');
	var list = [];
	let giBillData = await branchService.getAdminSetting("gi_bill");
	const giBill = giBillData ? parseFloat(giBillData) : 0;
	const { checkPrivateCollege } = require('../utils/commonUtils');
	src.forEach(function (obj) {
		let tuitionCost = "";
		let giBillCoverage = "";
		let studentVeteranCost = "";
		let yellowRibbonCoverage = "";
		let militaryStudentCost = "";
		let displayMilitaryCost = "no";
		let costOfStudentVeteran = "";
		let collegeSeo = "";
		let cautionMessage = "";
		let cautionFlag = false;
		let collegeOverview = obj.collegeoverview;
		if (obj.seo_name) {
			collegeSeo = obj.seo_name;
		} else {
			collegeSeo = obj.college_name;
		}
		let cwebsite = "";
		if (obj.website) {
			cwebsite = (obj.website.indexOf('http') !== -1 || obj.website.indexOf('https://') !== -1) ? (obj.website.trim()) : 'http://' + obj.website;
		}
		let vetwesite = "";
		if (obj.veteran_affairs_website) {
			vetwesite = (obj.veteran_affairs_website.indexOf('http') !== -1 || obj.veteran_affairs_website.indexOf('https://') !== -1) ? obj.veteran_affairs_website : 'http://' + obj.veteran_affairs_website
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
		
		if(obj.tuition_cpch && obj.tuition_cpch > 250){
			militaryStudentCost = obj.tuition_cpch - 250;
		}else if(obj.tuition_cpch){
			militaryStudentCost = 0;
			displayMilitaryCost = "yes";
		}

		if(obj.books && obj.books > 1000){
			costOfStudentVeteran = obj.books - 1000;
		}else{
			costOfStudentVeteran = 0;
		}

		if(extraInfo.length > 0){
			cautionFlag = true;
			cautionMessage = extraInfo[0].caution_flag_reason;
		}

		list.push({
			collegeId: obj.college_id,
			collegeAlias: obj.college_alias,
			collegeName: stringUtil.manageCollegeName(obj.college_name),
			collegeUrl: stringUtil.collegeNameUrl(collegeSeo),
			collegeContact: obj.contact_email,
			collegeType: obj.college_type,
			streetAddress: obj.address,
			city: obj.city,
			state: obj.state,
			postalCode: obj.postal_code,
			phone: obj.phone_number,
			website: cwebsite,
			collegeLogo: config.AWS_IMAGE_RESOURCE_COLLEGE + obj.college_logo,
			collegePhoto: config.AWS_IMAGE_RESOURCE_COLLEGE + obj.college_photo,
			collegeBanner: config.AWS_IMAGE_RESOURCE_COLLEGE + obj.college_banner,
			status: obj.status,
			timeZone: obj.time_zone,
			fax: obj.fax_number,
			email: obj.contact_email,
			overview: collegeOverview ? stringUtil.collegeOverviewReplace(collegeOverview, tagList) : '',
			veteranAffairs: {
				name: obj.veteran_affairs_attn,
				adress: obj.veteran_affairs_address,
				city: obj.veteran_affairs_city,
				state: obj.veteran_affairs_state,
				postalcode: obj.veteran_affairs_postal_code,
				phone: obj.veteran_affairs_phone,
				fax: obj.veteran_affairs_fax,
				email: obj.veteran_affairs_email,
				website: vetwesite
			},
			inStateTuition: obj.in_state_tuition,
			outStateTuition: obj.out_state_tuition,
			inStateTuitionGraduate: obj.in_state_tuition_graduate,
			outStateTuitionGraduate: obj.out_state_tuition_graduate,
			maleStudentCount: obj.male_student_count,
			femaleStudentCount: obj.female_student_count,
			// studentPopulation:obj.student_population,
			studentPopulation: obj.student_population_graduate + obj.student_population_undergraduate,
			studentPopulationGraduate: obj.student_population_graduate,
			studentPopulationUndergraduate: obj.student_population_undergraduate,
			religiousAffiliation: obj.religious_affiliation,
			ethnicAffiliation: obj.ethnic_affiliation,
			yearsOffered: obj.years_offered,
			genderPreference: obj.gender_preference,
			schoolSetting: obj.setting,
			publicPrivate: obj.public_private,
			SatScore: obj.sat_score,
			satMath: obj.sat_math,
			satCritical: obj.sat_critical,
			actScore: obj.act_score,
			gpaRange: obj.gpa_range,
			academicLevel: obj.academic_level,
			rotc: obj.rotc ? obj.rotc.toUpperCase() : "",
			gibillProgram: obj.gibill_program ? obj.gibill_program.toUpperCase() : "",
			yellowRibbon: obj.yellow_ribbon ? obj.yellow_ribbon.toUpperCase() : "",
			clepCredit: obj.clep_credit ? obj.clep_credit.toUpperCase() : "",
			dsstCredit: obj.dsst_credit ? obj.dsst_credit.toUpperCase() : "",
			onlineClasses: obj.online_classes,
			onlineClassesGraduate: obj.online_classes_graduate,
			onlineClassesUndergraduate: obj.online_classes_undergraduate,
			followAceCredit: obj.follow_ace_credit,
			reducedTuition: obj.reduced_tuition ? obj.reduced_tuition.toUpperCase() : "",
			scholarshipsForVeterans: obj.scholarships_for_veterans ? obj.scholarships_for_veterans.toUpperCase() : "",
			inStateTuitionNoResidency: obj.in_state_tuition_no_residency ? obj.in_state_tuition_no_residency.toUpperCase() : "",
			approvedTaFunding: obj.approved_ta_funding ? obj.approved_ta_funding.toUpperCase() : "",
			principlesOfExcellence: obj.principles_of_excellence ? obj.principles_of_excellence.toUpperCase() : "",
			fullTimeVetCounselors: obj.full_time_vet_counselors ? obj.full_time_vet_counselors.toUpperCase() : "",
			clubAssocCampus: obj.club_assoc_campus ? obj.club_assoc_campus.toUpperCase() : "",
			upwardBound: obj.upward_bound ? obj.upward_bound.toUpperCase() : "",
			memberSoc: obj.member_soc ? obj.member_soc.toUpperCase() : "",
			awardsAceCredit: obj.awards_ace_credit ? obj.awards_ace_credit.toUpperCase() : "",
			sva: obj.sva ? obj.sva.toUpperCase() : "",
			bah: obj.bah,
			yellowRibbonCoveragePrice: obj.yellow_ribbon_coverage,
			giBill: obj.gi_bill,
			eightKeys: obj.eight_keys?obj.eight_keys:"NO",
			calendar: obj.calendar,
			books: obj.books,
			accredit: obj.accredit,
			accessLevel: obj.access_level,
			majorsOffered: majors ? majors : '',
			inStateCostPerCredit: obj.in_state_costpercredit,
			outStateCostPerCredit: obj.out_state_costpercredit,
			vsdTitle: obj.vsd_title,
			vsdName: obj.vsd_name,
			vsdShortBio: obj.vsd_short_bio,
			vsdImage: obj.vsd_image ? config.AWS_IMAGE_RESOURCE_COLLEGE + "vsd/" + obj.vsd_image : '',
			vsdMessage: obj.school_message,
			tuitionCost: tuitionCost,
			giBillCoverage: giBillCoverage,
			yellowRibbonCoverage: yellowRibbonCoverage,
			studentVeteranCost: studentVeteranCost,
			collegeOverview: obj.adminoverview?obj.adminoverview:"",
			cpchUndergraduateCampus: obj.cpch_undergraduate_campus?obj.cpch_undergraduate_campus:0,
			cpchUndergraduateOnline: obj.cpch_undergraduate_online?obj.cpch_undergraduate_online:0,
			cpchGraduateCampus: obj.cpch_graduate_campus?obj.cpch_graduate_campus:0,
			cpchGraduateOnline: obj.cpch_graduate_online?obj.cpch_graduate_online:0,
			tuitionCpch: obj.tuition_cpch,
			militaryStudentCost: militaryStudentCost,
			displayMilitaryCost: displayMilitaryCost,
			costOfStudentVeteran: costOfStudentVeteran,
			graduation_rate: obj.graduation_rate,
			placement_rate: obj.placement_rate,
			gmat_score: obj.gmat_score,
			avg_immediate_salary: obj.avg_immediate_salary,
			accelerated: obj.accelerated,
			myCAA: obj.mycaa,
			rotcOverview: obj.rotc_overview,
			rotcBranchUrl,
			phoneRequired: obj.phone_required,
			cautionFlag: cautionFlag,
			cautionMessage: cautionMessage,
			parentId: obj.parent_id,
			showParentChild: obj.show_parent_child
		});
	});
	return list;
};

module.exports = collegeProfileModel;