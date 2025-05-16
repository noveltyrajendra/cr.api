var superAdminSpecificCollegeModel = async function (src) {
    var config = require('../config');
	let stringUtil = require('../utils/stringUtil');
	var list = [];
    const branchService = require('../services/branchService');
    let giBillData = await branchService.getAdminSetting("gi_bill");
	const giBill = giBillData ? parseFloat(giBillData) : 0;
    const { checkPrivateCollege } = require('../utils/commonUtils');
    src.forEach(function (obj) {
		let tuitionCost = "";
		let giBillCoverage = "";
		let studentVeteranCost = "";
		let yellowRibbonCoverage = "";
		let militaryStudentCost = "";
		let costOfStudentVeteran = "";
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
		}else{
			militaryStudentCost = 0;
		}

		if(obj.books && obj.books > 1000){
			costOfStudentVeteran = obj.books - 1000;
		}else{
			costOfStudentVeteran = 0;
		}

		list.push({
            id: obj.specificid,
            collegeId:obj.parentid,
            collegeText:obj.collegename,
            levelId:obj.level_id,
            bucketId:obj.bucket_id,
            secBucketId:obj.sec_bucket_id,
            secondaryBucketTitles:obj.secondary_bucket_titles,
            schoolName: obj.school_name,
            newCollegeName:obj.new_college_name,
            degreeSpecificAlias:obj.degree_specific_alias,
            degreeRule:obj.degree_rule,
            degreeTitle:obj.degree_title,
            degreeDesc:obj.degree_desc,
            degreeStatus:obj.degree_status,
            jobMarketReview:obj.job_market_review,
            courses:obj.courses,
            graduationRate:obj.graduation_rate,
            placementRate:obj.placement_rate,
            gmatScore: obj.gmat_score,
            avgImmediateSalary:obj.avg_immediate_salary,
            programMatcherOnly:obj.program_matcher_only,
            secondaryAlias:obj.secondary_alias,
            profileCollegeId: obj.college_info_id,
            specificCollegeInfo:{
                collegeAccessLevel: obj.access_level,
                collegeAlias: obj.college_alias,
                collegeType: obj.college_type,
                collegeAddress: obj.address,
                collegeCity: obj.city,
                collegeState: obj.state,
                collegePostalCode: obj.postal_code,
                collegePhoneNumber: obj.phone_number,
                collegeFaxNumber: obj.fax_number,
                collegeContactEmail: obj.contact_email,
                collegeWebsite: cwebsite,
                //status: obj.status,
                //timeZone: obj.time_zone,
                //overview: collegeOverview ? stringUtil.collegeOverviewReplace(collegeOverview, tagList) : '',
                veteranAffairsName: obj.veteran_affairs_attn,
                veteranAffairsAddress: obj.veteran_affairs_address,
                veteranAffairsCity: obj.veteran_affairs_city,
                veteranAffairsState: obj.veteran_affairs_state,
                veteranAffairsPostalCode: obj.veteran_affairs_postal_code,
                veteranAffairsPhone: obj.veteran_affairs_phone,
                veteranAffairsFax: obj.veteran_affairs_fax,
                veteranAffairsEmail: obj.veteran_affairs_email,
                veteranAffairsWebsite: vetwesite,
                collegeLogo: config.AWS_IMAGE_RESOURCE_COLLEGE + obj.college_logo,
                overview: obj.overview,
                collegeOverview: obj.college_overview,
                displayText: obj.display_text,
                metaPageTitle:obj.page_title,
                metaDescription:obj.description,
                metaKeywords:obj.keywords,
                metaOgTitle:obj.og_title,
                metaOgDescription:obj.og_description,
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
                eightKeys: obj.eight_keys,
                calendar: obj.calendar,
                books: obj.books,
                accredit: obj.accredit,
                inStateCostPerCredit: obj.in_state_costpercredit,
                outStateCostPerCredit: obj.out_state_costpercredit,
                tuitionCost: tuitionCost,
                giBillCoverage: giBillCoverage,
                yellowRibbonCoverage: yellowRibbonCoverage,
                studentVeteranCost: studentVeteranCost,
                cpchUndergraduateCampus: obj.cpch_undergraduate_campus,
                cpchUndergraduateOnline: obj.cpch_undergraduate_online,
                cpchGraduateCampus: obj.cpch_graduate_campus,
                cpchGraduateOnline: obj.cpch_graduate_online,
                tuitionCpch: obj.tuition_cpch,
                militaryStudentCost: militaryStudentCost,
                costOfStudentVeteran: costOfStudentVeteran
            }
		});
	});
	return list;
};

module.exports = superAdminSpecificCollegeModel;