const collegeService = (function () {

	const mysqlService = require('./mysqlService');
	const majorService = require('./majorService');
	const tagService = require('./superAdminKeywordService');
	const collegeConstants = require('../constants/collegeConstants');
	const searchConstant = require('../constants/searchConstant');
	const stateConstant = require('../constants/stateConstant');
	const messageEmail = require('../utils/messageEmail');
	const collegeModel = require('../models/collegeModel');
	const collegeComparisonDetailModel = require('../models/collegeComparisonDetailModel');
	const bounceBackEmailMatchCollegeModel = require('../models/bounceBackEmailMatchCollegeModel');
	const bounceBackEmailMatchBucketModel = require('../models/bounceBackEmailMatchBucketModel');
	const bounceBackEmailGetBucketInfoModel = require('../models/bounceBackEmailGetBucketInfoModel');
	const bounceEmailAdvertiseOrderModel = require('../models/bounceEmailAdvertiseOrderModel');
	const collegeProfileModel = require('../models/collegeProfileModel');
	const collegeParentChildModel = require('../models/collegeParentChildModel');
	const superAdminkeywordListModel = require('../models/superAdminkeywordListModel');
	const collegeListModel = require('../models/collegeListModel');
	const collegeNewsfeedModel = require('../models/collegeNewsfeedModel');
	const collegeStudentContactModel = require('../models/collegeStudentContactModel');
	const emailService = require('../services/emailService');
	const emailConstant=require('../constants/emailConstant');
	const registerCollegeListModel = require('../models/registerCollegeListModel');
	const collegeYellowRibbonDataModel = require('../models/collegeYellowRibbonDataModel');
	const collegeSimilarSchoolModel = require('../models/collegeSimilarSchoolModel');
	const newsfeedModel = require('../models/newsfeedModel');
	const stringUtil = require('../utils/stringUtil');
	const ogGraphService = require('./ogGraphService');
	const config = require('../config');
	const uuidv4 = require('uuid/v4');
	const moment = require('moment');
	const base64Utility = require('../utils/base64Utility');
	const sourceTrackingConstant = require('../constants/sourceTrackingConstant');
	const { getCurrentDateInFormat } = require('../utils/momentUtility');
	const fs = require('fs');
	const { truncatehtml } = require('truncate-html');
	const { GI_BILL_LINK, QUESTION_ANSWER_LINK } = require('../constants/emailConstant');

	const zeroCostData = ["zero_cost_veterans","zero_cost_military"];

	function getDefaultColleges() {
		return new Promise(function (resolve, reject) {
			mysqlService.query(collegeConstants.DEFAULT_COLLEGE_QUERY)
				.then(function (response) {
					let filterData = [{filterBy:"none"}];
					resolve(collegeModel(response,'','','',filterData));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getAllColleges() {
		return new Promise(function (resolve, reject) {
			mysqlService.query(collegeConstants.GET_ALL_COLLEGE_QUERY)
				.then(function (response) {
					resolve(collegeModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getCollegeProfile(collegeId) {
		return new Promise(async (resolve, reject) => {
			const [collegeDetail, tags, majors, rotcBrnach, extraInfo] = await Promise.all([
				mysqlService.query(collegeConstants.GET_COLLEGE_BY_ID_QUERY, collegeId),
				tagService.listKeywords(),
				majorService.getMajorsByCollege(collegeId),
				getRotcBranchUrl(collegeId),
				getCollegeExtraInfo(collegeId)
			])
			return resolve(collegeProfileModel(collegeDetail, majors, tags, rotcBrnach, extraInfo));
		});
	}

	function getCollegeComparisonDetail(collegeId, studentId) {
		return new Promise(async (resolve, reject) => {
			try {
				const existCondition = `, EXISTS(Select * From recon_messages where college_id = c.id and student_id = '${studentId}' and responder='user' and recipient='college') as isMatched`
				const query = `Select c.*,cp.*,HTML_UnEncode(c.college_name)as college_name,college_alias,college_type ${studentId ? existCondition : ''} FROM colleges c LEFT JOIN college_profiles cp on c.id=cp.college_id  LEFT JOIN college_vsd cv on c.id = cv.college_id where c.status='ACTIVE' AND c.id = ${collegeId}`
				const college = await mysqlService.query(query)
				if(college && college.length) return resolve(collegeComparisonDetailModel(college[0]))
			} catch (error) {
				return reject(error)
			}
		})
	}

	function searchCollege(filters) {
		return new Promise(function (resolve, reject) {
			let subquery = "";
			var searchQuery = collegeConstants.GET_ALL_COLLEGE_SEARCH_QUERY;
			if(filters.levels){
				for(let i = 0; i< filters.levels.length ; i++) {
					if(filters.levels[i] == 18) {
						filters.levels.push(6,8);
					}
				}
			}
			let checkZeroCostVeterans = false;
			let checkZeroCostMilitary = false;
			let filterData = [{filterBy:"none"}];
			if(filters.filterAttribute){
				checkZeroCostVeterans = filters.filterAttribute.some(i=> i.column === "zero_cost_veterans");
				checkZeroCostMilitary = filters.filterAttribute.some(i=> i.column === "zero_cost_military");
				if(checkZeroCostVeterans && checkZeroCostMilitary){
					filterData = [];
					filterData.push({filterBy:"both"});
				}else if(checkZeroCostVeterans) {
					filterData = [];
					filterData.push({filterBy:"veterans"});
				}else if(checkZeroCostMilitary) {
					filterData = [];
					filterData.push({filterBy:"military"});
				}
			}
			var buildquery = developQuery(searchQuery, filters, "");
			//console.log("QQ:",searchQuery+queryFilters);
			//console.log("QQ:",buildquery);
			mysqlService.query(buildquery)
				.then(function (response) {
					if (filters.pageNumber == 0) {
						var searchQuery = collegeConstants.GET_COLLEGE_TOTAL_QUERY;
						totalquery = developQuery(searchQuery, filters, "total");
						// console.log("DD:",totalquery);
						mysqlService.query(totalquery)
							.then(function (res) {
								resolve(collegeModel(response, res.length, "random", res.map(a=>a.cid).join(","),filterData));
							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return reject(error)
								};
							});
					}
					else {

						resolve(collegeModel(response, 0, "random",'',filterData));
					}
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});

	}

	function developQuery(searchQuery, filters, type) {
		let stateFiter = true;
		let degreeFilter = false;
		let degreeOrderFilter = false;
		if ((filters.name && filters.name.length) || (filters.majors && filters.majors.length) || (filters.secBuckets && filters.secBuckets.length) || (filters.religiousAffiliation) || (filters.ethnicAffiliation) || (filters.collegeType && filters.collegeType.publicPrivate && filters.collegeType.publicPrivate.length) || (filters.collegeType && filters.collegeType.yearsOffered && filters.collegeType.yearsOffered.length) || (filters.collegeType && filters.collegeType.genderPreference && filters.collegeType.genderPreference.length) || (filters.collegeType && filters.collegeType.schoolSetting && filters.collegeType.schoolSetting.length) || (filters.collegeType && filters.collegeType.provideOnlineGraduateClasses) || (filters.collegeType && filters.collegeType.provideOnlineUnderGraduateClasses) || (filters.provideOnlineClasses) || (filters.underGraduateTuitionFrom) || (filters.underGraduateTuitionTo) || (filters.graduateTuitionFrom) || (filters.graduateTuitionTo) || (filters.studentPopulationFrom) || (filters.studentPopulationTo) || (filters.bahFrom) || (filters.bahTo) || (filters.provideSva) || (filters.provideFullTimeVeteranCounselor) || (filters.principlesOfExcellence) || (filters.associaionOnCampus) || (filters.upwardBound) || (filters.eightKeys) || (filters.rotcService) || (filters.isMemberOfSoc) || (filters.aceCredit) || (filters.clepCredit) || (filters.dsstCredit) || (filters.inStateTuitionForActiveDuty) || (filters.approvedTaFunding) || (filters.yellowRibbon) || (filters.scholarshipsForVeterans) || (filters.reducedTuition) || (filters.filterAttribute.length) || (filters.checkOnline) || (filters.checkOffline)) {
			stateFiter = false;
		} else {
			onlineQry = querystateBuilder(filters);
			degreeOnlineQuery = querydegreestateBuilder(filters);
		}
		
		const traditionalQry = queryBuilder(filters, stateFiter, '');
		const orderQry = queryorderBuilder(filters);
		const onlineOnlyQuery = onlineOnlyQueryBuilder(filters);

		if((filters.levels && filters.levels.length) && (filters.priBuckets && filters.priBuckets.length) && (filters.secBuckets && filters.secBuckets.length)) {
			specificQueryState = specificQueryStateBuilder(filters);
			specificOnlineQuery = specificOnlineQueryBuilder(filters);
			degreeFilter = true;
		}
		let traditionalDegreeQry = "";
		if((filters.levels && filters.levels.length) || (filters.priBuckets && filters.priBuckets.length) || (filters.secBuckets && filters.secBuckets.length)) {
			degreeOrderFilter = true;
			//traditionalDegreeQry = queryBuilder(filters, stateFiter, 'degree');
		}
		let degreeSql = "Select c.id as collegeId,c.contact_email,HTML_UnEncode(college_name)as college_name,0 as isSpecificDegree,c.specific_profile_id,0 as parentCollegeId, 0 as degree_name,seo_name,college_alias,c.college_type,address,city, state, postal_code, phone_number,phone_required,parent_id,show_parent_child,website,convert(cast(convert(overview using latin1) as binary) using utf8) as overview, college_logo,college_photo,access_level,convert(cast(convert(display_text using latin1) as binary) using utf8) as display_text,99 as display_order,tc.display_order as degree_order,cp.public_private,cp.in_state_tuition,cp.out_state_tuition,cp.yellow_ribbon,cp.yellow_ribbon_coverage,cp.tuition_cpch FROM colleges c LEFT JOIN college_profiles cp on c.id=cp.college_id LEFT JOIN degree_order_colleges as tc on c.id=tc.college_id left join degree_order as bd on tc.degree_order_id=bd.id where c.status='ACTIVE' and c.access_level != 'pending' and bd.degree_status='active'";
		if(filters.levels && filters.levels.length){
			degreeSql+= " and bd.level_id in ("+stringUtil.joinIntByComma(filters.levels)+") ";
		}

		if(filters.secBuckets && filters.secBuckets.length){
			degreeSql+= " and (";
			for (i = 0; i < filters.secBuckets.length; i++) {
				degreeSql+= "find_in_set("+filters.secBuckets[i]+",bd.secondary_bucket_id)";
				if(filters.secBuckets.length > 1 && i < filters.secBuckets.length-1){
					degreeSql+= " or ";
				}
			}
			degreeSql+= ")"; 
		}
		//console.log("DS:", degreeSql);
		if(filters.priBuckets && filters.priBuckets.length){
			degreeSql+= " and bd.bucket_id in ("+stringUtil.joinIntByComma(filters.priBuckets)+") ";
		}
		if (type === "total") {
			let totalPatriotQry = getTotalPatriotData(filters);
			if (stateFiter) {
				if(degreeFilter) {
					queryFilters = searchQuery + traditionalQry + " union " + searchQuery + onlineQry + " union " + searchQuery + degreeOnlineQuery + " union " + specificOnlineQueryTotalQuery(filters, 'state') + (onlineOnlyQuery ? " union " + '(' + searchQuery + onlineOnlyQuery + ')' : '');
				} else {
					queryFilters = searchQuery + traditionalQry + " union " + searchQuery + onlineQry + " union " + searchQuery + totalPatriotQry + (!onlineOnlyQuery ? '' : " union " + '(' + searchQuery + onlineOnlyQuery + ')');
				}
			} else {
				if(degreeFilter && filters.state && filters.state.length) {
					queryFilters =  searchQuery +  traditionalQry + " union " + specificOnlineQueryTotalQuery(filters, 'state') + " union " + searchQuery + totalPatriotQry + (!onlineOnlyQuery ? '' : " union " + '(' + searchQuery + onlineOnlyQuery + ')' )
				} else if(degreeFilter){
					queryFilters =  searchQuery +  traditionalQry + " union " + specificOnlineQueryTotalQuery(filters, 'state') + (!onlineOnlyQuery ? '' : " union " + '(' + searchQuery + onlineOnlyQuery + ')');
				} else if((filters.levels && filters.levels.length) || (filters.priBuckets && filters.priBuckets.length) || (filters.secBuckets && filters.secBuckets.length) || (filters.state && filters.state.length)){
					queryFilters =  searchQuery +  traditionalQry + " union " + searchQuery + totalPatriotQry + (!onlineOnlyQuery ? '' : " union " + '(' + searchQuery + onlineOnlyQuery + ')');
				} else {
					queryFilters =  searchQuery +  traditionalQry + (!onlineOnlyQuery ? '' : " union " + '(' + searchQuery + onlineOnlyQuery + ')');
				}
			}
		} else {
			if (filters.savedSearch && filters.studentid) {
				let newSearchQry = "Select c.id as collegeId,c.contact_email,HTML_UnEncode(college_name)as college_name,0 as isSpecificDegree,c.specific_profile_id,0 as parentCollegeId,0 as degree_name,seo_name,college_alias,c.college_type,address,city, state, postal_code, phone_number,phone_required,parent_id,show_parent_child,website,convert(cast(convert(overview using latin1) as binary) using utf8) as overview, college_logo,college_photo,access_level,convert(cast(convert(display_text using latin1) as binary) using utf8) as display_text,tc.display_order,case when std_relation.college_id is not null then 'Yes' else 'No' end  as contacted  FROM colleges c LEFT JOIN college_profiles cp on c.id=cp.college_id LEFT JOIN default_colleges as tc on c.id=tc.college_id LEFT JOIN (select distinct(college_id) FROM recon_messages WHERE student_id='" + filters.studentid + "') as std_relation on c.id=std_relation.college_id where c.status='ACTIVE' AND c.access_level != 'pending' AND c.specific_profile_id = '0'";
				/*if (stateFiter) {
					queryFilters = "select c.* from ("+newSearchQry + orderQry + " order by tc.display_order limit 10) as c union select b.* from (" + newSearchQry + onlineQry +" ORDER BY c.access_level DESC) as b union select a.* from (" + newSearchQry + traditionalQry + " ORDER BY c.access_level DESC) as a";
				} else {
					queryFilters = "select c.* from ("+newSearchQry + orderQry + " order by tc.display_order limit 10) as c union select a.* from (" + newSearchQry + traditionalQry+" ORDER BY c.access_level DESC) as a";
				}*/
				if (stateFiter) {
					if(degreeFilter) {
						queryFilters = "select a.* from ("+newSearchQry + orderQry + "  union " + newSearchQry + onlineQry +" union " + newSearchQry + degreeOnlineQuery + " union " + newSearchQry + traditionalQry + " union " + specificOnlineQuery + " union " + specificQueryState + (degreeOrderFilter ? " union " + '(' + degreeSql + traditionalDegreeQry + ')':'') + (!onlineOnlyQuery ? '' : " union " + newSearchQry + onlineOnlyQuery)+") as a";
					} else {
						queryFilters = "select a.* from ("+newSearchQry + orderQry + "  union " + newSearchQry + onlineQry +" union " + newSearchQry + degreeOnlineQuery + " union " + newSearchQry + traditionalQry + (degreeOrderFilter ? " union " + '(' + degreeSql + traditionalDegreeQry + ')':'') + (!onlineOnlyQuery ? '' : " union " + '(' + newSearchQry + onlineOnlyQuery + ')') +") as a";
					}
				} else {
					if(degreeFilter) {
						queryFilters = "select a.* from ("+newSearchQry + orderQry + " union " + newSearchQry + traditionalQry + " union " + specificOnlineQuery + " union " + specificQueryState + (degreeOrderFilter ? " union " + '(' + degreeSql + traditionalDegreeQry + ')':'') + (!onlineOnlyQuery ? '' : " union " + '(' + newSearchQry + onlineOnlyQuery + ')')+" ) as a";
					} else {
						queryFilters = "select a.* from ("+newSearchQry + orderQry + " union " + newSearchQry + traditionalQry + (degreeOrderFilter ? " union " + '(' + degreeSql + traditionalDegreeQry + ')':'') + (!onlineOnlyQuery ? '' : " union " + '(' + newSearchQry + onlineOnlyQuery + ')')+" ) as a";
					}
				}
			} else {
				/*if (stateFiter) {
					queryFilters = "select c.* from ("+searchQuery + orderQry + " order by tc.display_order limit 10) as c union select b.* from (" + searchQuery + onlineQry +" ORDER BY c.access_level DESC) as b union select a.* from (" + searchQuery + traditionalQry + " ORDER BY c.access_level DESC) as a ";
				} else {
					queryFilters = "select c.* from ("+searchQuery + orderQry + " order by tc.display_order limit 10) as c union select a.* from (" + searchQuery + traditionalQry+" ORDER BY c.access_level DESC) as a";
				}*/
				const traditionalPatQry = queryPatriotBuilder(filters, stateFiter);
			    let newSearchQuery =  "Select c.id as collegeId,c.contact_email,HTML_UnEncode(college_name)as college_name,0 as isSpecificDegree,c.specific_profile_id,0 as parentCollegeId,0 as degree_name,seo_name,college_alias,c.college_type,address,city, state, postal_code, phone_number,phone_required,parent_id,show_parent_child,website,convert(cast(convert(overview using latin1) as binary) using utf8) as overview, college_logo,college_photo,access_level,convert(cast(convert(display_text using latin1) as binary) using utf8) as display_text,99 as display_order,99 as degree_order,cp.public_private,cp.in_state_tuition,cp.out_state_tuition,cp.yellow_ribbon,cp.yellow_ribbon_coverage,cp.tuition_cpch FROM colleges c LEFT JOIN college_profiles cp on c.id=cp.college_id LEFT JOIN default_colleges as tc on c.id=tc.college_id where c.status='ACTIVE' AND c.access_level != 'pending' AND c.specific_profile_id = '0'"
				if (stateFiter) {
					if (filters.state && filters.state.length) {
						if(degreeFilter) {
							queryFilters = "select a.* from ("+searchQuery + orderQry + " union  " + newSearchQuery + onlineQry + " union " + newSearchQuery + degreeOnlineQuery + " union " + newSearchQuery + traditionalQry + " union " + newSearchQuery + traditionalPatQry + " union " + specificOnlineQuery + " union " + specificQueryState + (degreeOrderFilter ? " union " + '(' + degreeSql + traditionalDegreeQry + ')':'') + (onlineOnlyQuery ? '' : " union " + '(' + newSearchQuery + onlineOnlyQuery + ')')+ ") as a ";
						} else {
							queryFilters = "select a.* from ("+searchQuery + orderQry + " union  " + newSearchQuery + onlineQry + " union " + newSearchQuery + degreeOnlineQuery + " union " + newSearchQuery + traditionalQry + " union " + newSearchQuery + traditionalPatQry + (degreeOrderFilter ? " union " + '(' + degreeSql + traditionalDegreeQry + ')':'') + (!onlineOnlyQuery ? '' : " union " + '(' + newSearchQuery + onlineOnlyQuery + ')')+") as a ";
						}
					}else{
						if(degreeFilter) {
							queryFilters = "select a.* from ("+searchQuery + orderQry + " union  " + newSearchQuery + onlineQry +" union " + newSearchQuery + degreeOnlineQuery + " union " + newSearchQuery + traditionalQry + " union " + specificOnlineQuery +  " union " + specificQueryState + (degreeOrderFilter ? " union " + '(' + degreeSql + traditionalDegreeQry + ')':'') + (!onlineOnlyQuery ? '' : " union " + '(' + newSearchQuery + onlineOnlyQuery + ')')+" ) as a ";
						} else {
							queryFilters = "select a.* from ("+searchQuery + orderQry + " union  " + newSearchQuery + onlineQry +" union " + newSearchQuery + degreeOnlineQuery + " union " + newSearchQuery + traditionalQry + (degreeOrderFilter ? " union " + '(' + degreeSql + traditionalDegreeQry + ')':'') + (!onlineOnlyQuery ? '' : " union " + '(' + newSearchQuery + onlineOnlyQuery + ')')+" ) as a ";
						}
					}
				} else {
					if (filters.state && filters.state.length) {
						if(degreeFilter) {
							queryFilters = "select a.* from ("+searchQuery + orderQry + "  union " + newSearchQuery + traditionalQry+" union " + newSearchQuery + traditionalPatQry +  " union " + specificOnlineQuery + " union " + specificQueryState + (degreeOrderFilter ? " union " + '(' + degreeSql + traditionalDegreeQry + ')':'') + (!onlineOnlyQuery ? '' : " union " + '(' + newSearchQuery + onlineOnlyQuery + ')')+") as a";
						} else {
							queryFilters = "select a.* from ("+searchQuery + orderQry + "  union " + newSearchQuery + traditionalQry+" union " + newSearchQuery + traditionalPatQry + (degreeOrderFilter ? " union " + '(' + degreeSql + traditionalDegreeQry + ')':'') + (!onlineOnlyQuery ? '' : " union " + '(' + newSearchQuery + onlineOnlyQuery + ')')+") as a";
						}
					}else{
						
						if(degreeFilter) {
							queryFilters = "select a.* from ("+searchQuery + orderQry + "  union " + newSearchQuery + traditionalQry + " union " + specificOnlineQuery + " union " + specificQueryState + (degreeOrderFilter ? " union " + '(' + degreeSql + traditionalDegreeQry + ')':'') + (!onlineOnlyQuery ? '' : " union " + '(' + newSearchQuery + onlineOnlyQuery + ')')+" ) as a";
						}else {
							queryFilters = "select a.* from ("+searchQuery + orderQry + "  union " + newSearchQuery + traditionalQry + (degreeOrderFilter ? " union " + '(' + degreeSql + traditionalDegreeQry + ')':'') +(!onlineOnlyQuery ? '' : " union " + '(' + newSearchQuery + onlineOnlyQuery + ')') +" ) as a";
						}
					}
				}
			}
			//mainQuery = "select * from ("+queryFilters+") as a ORDER BY a.access_level ASC";
		}
		if (type == "" && !filters.savedSearch) {
			let result = false;
			if(filters.filterAttribute){
				result = filters.filterAttribute.some(i=> i.column === "zero_cost_veterans");
				if(!result){
					result = filters.filterAttribute.some(i=> i.column === "zero_cost_military");
				}
			}
			
			if(result){
				queryFilters += " WHERE a.access_level='patriot' ORDER BY a.display_order ASC";
			}else{
				if (+filters.pageNumber === 0) {
					queryFilters += " ORDER BY a.degree_order,a.display_order,a.access_level ASC LIMIT 0,20";
				} else {
					const count = 20;
					const lowerlimit = filters.pageNumber * count;
					queryFilters += " ORDER BY a.degree_order,a.display_order,a.access_level ASC LIMIT " + lowerlimit + "," + count;
				}
			}
		}
		subquery = queryFilters;
		// console.log("QQQ",queryFilters)
		return subquery;
	}

	function onlineOnlyQueryBuilder(filters) {
		let queryFilters = '';

		if(filters.checkOffline) {
			return false;
		}

		let dbField = "";
		if (filters.website === "app") {
			dbField = "include_app_state";
		} else if (filters.website === "legion") {
			dbField = "include_legion_state";
		} else if (filters.website === "military") {
			dbField = "include_military_state";
		}
		let stringState = "";

		if (filters.state) {
			for (const state of filters.state) {
				stringState += dbField + " like '%" + state + "%' or ";
			}
		}

		if (filters.name && filters.name.length) {
			queryFilters += " AND (c.college_name LIKE '%" + filters.name + "%' OR c.city LIKE '%" + filters.name + "%' OR c.college_abbreviation LIKE '%" + filters.name + "%' OR state LIKE '%" + filters.name + "%' OR c.id in(select distinct(cr_id) from college_majors_new as cmn left join bucket_secondary_degree_list as bsdl on cmn.major_id=bsdl.major_id left join bucket_secondary_degree as bsd on bsdl.bucket_secondary_degree_id=bsd.id where bsd.title LIKE '%" + filters.name + "%'))";
		}

		if(!filters.checkOffline) {
			queryFilters += " and c.college_type='online'"
		};

		if(filters.state && filters.state.length) queryFilters += " and (" + stringState.slice(0, -4) + ")";

		// filter by religious affiliation
		if(filters.religiousAffiliation) queryFilters +=" and religious_affiliation like '"+filters.religiousAffiliation+"'";

		// filter by ethnic affilication
		if (filters.ethnicAffiliation) queryFilters += " and ethnic_affiliation = '" + filters.ethnicAffiliation + "'";

		//filter by public or private flag 
		if(filters.collegeType && filters.collegeType.publicPrivate && filters.collegeType.publicPrivate.length)
			queryFilters +=" and public_private in ("+stringUtil.joinStringByComma(filters.collegeType.publicPrivate)+")";

		//filter by school duration [2 year , 4 year]
		if(filters.collegeType && filters.collegeType.yearsOffered && filters.collegeType.yearsOffered.length) queryFilters +=" and years_offered in ("+stringUtil.joinStringByComma(filters.collegeType.yearsOffered)+")";

		//filter by gender preference
		if(filters.collegeType && filters.collegeType.genderPreference && filters.collegeType.genderPreference.length) queryFilters +=" and gender_preference in ("+stringUtil.joinStringByComma(filters.collegeType.genderPreference)+")";

		if (filters.collegeType && filters.collegeType.schoolSetting && filters.collegeType.schoolSetting.length > 0) {
			queryFilters += " and setting in (" + stringUtil.joinStringByComma(filters.collegeType.schoolSetting) + ")";
		}

		if(filters.studentPopulationFrom == 0 && filters.studentPopulationTo == 0 && filters.studentPopulationIndicator == 'S,M,L') {
			queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'  AND student_population <> '' `;
		}
		if(filters.studentPopulationIndicator == 'S,L') {
			queryFilters += ` AND student_population NOT BETWEEN 5000 and 15000 AND student_population <> '' `;
		} else {
			if(filters.studentPopulationFrom && filters.studentPopulationFrom!=0) {
				queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'   `;
			}
	
			if(filters.studentPopulationTo && filters.studentPopulationTo!=0) {
				queryFilters += ` AND student_population <> '' and student_population <= '${filters.studentPopulationTo}' `;
			}
		}

		//sva service
		if(filters.provideSva)
		{
			queryFilters +=" and sva = '"+filters.provideSva+"'";
		}

		//full time veteran counselors service
		if(filters.provideFullTimeVeteranCounselor)
		{
			queryFilters +=" and full_time_vet_counselors = '"+filters.provideFullTimeVeteranCounselor+"'";
		}


		//signed principles of excellence
		if(filters.principlesOfExcellence)
		{
			queryFilters +=" and principles_of_excellence = '"+filters.principlesOfExcellence+"'";
		}

		//club / association on campus
		if(filters.associaionOnCampus)
		{
			queryFilters +=" and club_assoc_campus = '"+filters.associaionOnCampus+"'";
		}

		//upward bound
		if(filters.upwardBound)
		{
			queryFilters +=" and upward_bound = '"+filters.upwardBound+"'";
		}

		//eight keys to veteran's success
		if(filters.eightKeys)
		{
			queryFilters +=" and eight_keys = '"+filters.eightKeys+"'";
		}

		//provide ROTC service
		if(filters.rotcService)
		{
			queryFilters +=" and rotc = '"+filters.rotcService+"'";
		}

		//is member of SOC
		if(filters.isMemberOfSoc)
		{
			queryFilters +=" and member_SOC = '"+filters.isMemberOfSoc+"'";
		}

		//awards ace credit
		if(filters.aceCredit)
		{
			queryFilters +=" and awards_ace_credit = '"+filters.aceCredit+"'";
		}

		//awards clep credit for exam
		if(filters.clepCredit)
		{
			queryFilters +=" and clep_credit = '"+filters.clepCredit+"'";
		}

		//awards dsst credit for exam
		if(filters.dsstCredit)
		{
			queryFilters +=" and dsst_credit = '"+filters.dsstCredit+"'";
		}

		// Comply with The Veteran's Choice Act
		if(filters.inStateTuitionForActiveDuty)
		{
			queryFilters +=" and in_state_tuition_no_residency = '"+filters.inStateTuitionForActiveDuty+"'";
		}

		// Approved for TA Funding
		if(filters.approvedTaFunding)
		{
			queryFilters +=" and approved_ta_funding = '"+filters.approvedTaFunding+"'";
		}

		// yellow ribbon program
		if(filters.yellowRibbon)
		{
			queryFilters +=" and yellow_ribbon = '"+filters.yellowRibbon+"'";
		}

		// scholarships for vevterans
		if(filters.scholarshipsForVeterans)
		{
			queryFilters +=" and scholarships_for_veterans = '"+filters.scholarshipsForVeterans+"'";
		}

		// scholarships for veterans
		if(filters.reducedTuition)
		{
			queryFilters +=" and reduced_tuition = '"+filters.reducedTuition+"'";
		}

		// miltary service
		for (const attribute of filters.filterAttribute) {
			if(!zeroCostData.includes(attribute.column)){
				queryFilters += " and "+attribute.column+" = '"+attribute.checked+"'";
			}
		}

		//filter by primary and secondary buckets
		if(filters.secBuckets && filters.secBuckets.length > 0 && filters.priBuckets && filters.priBuckets.length > 0){
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + ") and cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}
		}else if (filters.secBuckets && filters.secBuckets.length > 0) {
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}
		}else if (filters.priBuckets && filters.priBuckets.length > 0) {
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + "))";
			}
		}else if (filters.levels && filters.levels.length > 0) {
            queryFilters += " and c.id in (select cr_id from college_majors_new where aw_level in (" + stringUtil.joinStringByComma(filters.levels) + "))";
        }

		return !filters.checkOffline && filters.state && filters.state.length ? queryFilters + ' LIMIT 3 ' : queryFilters;
	}

	function getTotalPatriotData(filters){
		var queryFilters = '';

		if (filters.religiousAffiliation) {
			//queryFilters +=" and religious_affiliation like '"+filters.religiousAffiliation+"'";
			queryFilters += " and religious_affiliation = '" + filters.religiousAffiliation + "'";
		}

		// filter by ethnic affilication
		if (filters.ethnicAffiliation) {
			queryFilters += " and ethnic_affiliation = '" + filters.ethnicAffiliation + "'";
		}

		//filter by public or private flag 
		if (filters.collegeType && filters.collegeType.publicPrivate && filters.collegeType.publicPrivate.length > 0) {
			queryFilters += " and public_private in (" + stringUtil.joinStringByComma(filters.collegeType.publicPrivate) + ")";
		}

		//filter by school duration [2 year , 4 year]
		if (filters.collegeType && filters.collegeType.yearsOffered && filters.collegeType.yearsOffered.length > 0) {
			queryFilters += " and years_offered in (" + stringUtil.joinStringByComma(filters.collegeType.yearsOffered) + ")";
		}

		//filter by gender preference
		if (filters.collegeType && filters.collegeType.genderPreference && filters.collegeType.genderPreference.length > 0) {
			queryFilters += " and gender_preference in (" + stringUtil.joinStringByComma(filters.collegeType.genderPreference) + ")";
		}

		//filter by school setting [town , urban , suburbs]
		if (filters.collegeType && filters.collegeType.schoolSetting && filters.collegeType.schoolSetting.length > 0) {
			queryFilters += " and setting in (" + stringUtil.joinStringByComma(filters.collegeType.schoolSetting) + ")";
		}

		//does college provide online classes
		if (filters.collegeType && filters.collegeType.provideOnlineGraduateClasses) {
			queryFilters += " and online_classes_graduate like '" + filters.collegeType.provideOnlineGraduateClasses + "'";
		}

		//does college provide online classes
		if (filters.collegeType && filters.collegeType.provideOnlineUnderGraduateClasses) {
			queryFilters += " and online_classes_undergraduate like '" + filters.collegeType.provideOnlineUnderGraduateClasses + "'";
		}

		//does college provide online classes
		if (filters.provideOnlineClasses) {
			queryFilters += " and online_classes like '" + filters.provideOnlineClasses + "'";
		}

		if(filters.checkOnline) {
			queryFilters += ` and c.college_type like '${filters.checkOnline}' `
		}

		if(filters.checkOffline) {
			queryFilters += ` and c.college_type like 'traditional' `
		}
		//undergraduate tuition range from
		if (filters.underGraduateTuitionFrom) {	
			queryFilters += " and in_state_tuition >= " + filters.underGraduateTuitionFrom;
		}

		//undergraduate tuition range to
		if (filters.underGraduateTuitionTo) {
			queryFilters += " and in_state_tuition <= " + filters.underGraduateTuitionTo;
		}

		//graduate tuition range from
		if (filters.graduateTuitionFrom) {
			queryFilters += " and in_state_tuition_graduate >= " + filters.graduateTuitionFrom;
		}

		//graduate tuition range to
		if (filters.graduateTuitionTo) {
			queryFilters += " and in_state_tuition_graduate <= " + filters.graduateTuitionTo;
		}

		//student population from
		if(filters.studentPopulationFrom == 0 && filters.studentPopulationTo == 0 && filters.studentPopulationIndicator == 'S,M,L') {
			queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'  AND student_population <> '' `;
		}
		if(filters.studentPopulationIndicator == 'S,L') {
			queryFilters += ` AND student_population NOT BETWEEN 5000 and 15000 AND student_population <> '' `;
		} else {
			if(filters.studentPopulationFrom && filters.studentPopulationFrom!=0) {
				queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'   `;
			}
	
			if(filters.studentPopulationTo && filters.studentPopulationTo!=0) {
				queryFilters += ` AND student_population <> '' and student_population <= '${filters.studentPopulationTo}' `;
			}
		}

		//gi bill range from
		if (filters.bahFrom) {
			queryFilters += " and bah >= " + filters.bahFrom;
		}

		//gi bill range to
		if (filters.bahTo) {
			queryFilters += " and bah <= " + filters.bahTo;
		}

		//sva service
		if (filters.provideSva) {
			queryFilters += " and sva = '" + filters.provideSva + "'";
		}

		//full time veteran counselors service
		if (filters.provideFullTimeVeteranCounselor) {
			queryFilters += " and full_time_vet_counselors = '" + filters.provideFullTimeVeteranCounselor + "'";
		}


		//signed principles of excellence
		if (filters.principlesOfExcellence) {
			queryFilters += " and principles_of_excellence = '" + filters.principlesOfExcellence + "'";
		}

		//club / association on campus
		if (filters.associaionOnCampus) {
			queryFilters += " and club_assoc_campus = '" + filters.associaionOnCampus + "'";
		}

		//upward bound
		if (filters.upwardBound) {
			queryFilters += " and upward_bound = '" + filters.upwardBound + "'";
		}

		//eight keys to veteran's success
		if (filters.eightKeys) {
			queryFilters += " and eight_keys = '" + filters.eightKeys + "'";
		}

		//provide ROTC service
		if (filters.rotcService) {
			queryFilters += " and rotc = '" + filters.rotcService + "'";
		}

		//is member of SOC
		if (filters.isMemberOfSoc) {
			queryFilters += " and member_SOC = '" + filters.isMemberOfSoc + "'";
		}

		//awards ace credit 
		if (filters.aceCredit) {
			queryFilters += " and awards_ace_credit = '" + filters.aceCredit + "'";
		}

		//awards clep credit for exam
		if (filters.clepCredit) {
			queryFilters += " and clep_credit = '" + filters.clepCredit + "'";
		}

		//awards dsst credit for exam
		if (filters.dsstCredit) {
			queryFilters += " and dsst_credit = '" + filters.dsstCredit + "'";
		}

		// Comply with The Veteran's Choice Act
		if (filters.inStateTuitionForActiveDuty) {
			queryFilters += " and in_state_tuition_no_residency = '" + filters.inStateTuitionForActiveDuty + "'";
		}

		// Approved for TA Funding
		if (filters.approvedTaFunding) {
			queryFilters += " and approved_ta_funding = '" + filters.approvedTaFunding + "'";
		}

		// yellow ribbon program
		if (filters.yellowRibbon) {
			queryFilters += " and yellow_ribbon = '" + filters.yellowRibbon + "'";
		}

		// scholarships for vevterans
		if (filters.scholarshipsForVeterans) {
			queryFilters += " and scholarships_for_veterans = '" + filters.scholarshipsForVeterans + "'";
		}

		// scholarships for veterans
		if (filters.reducedTuition) {
			queryFilters += " and reduced_tuition = '" + filters.reducedTuition + "'";
		}

		// miltary service
		for (var i = 0; i < filters.filterAttribute.length; i++) {
			if(!zeroCostData.includes(filters.filterAttribute[i].column)){
				queryFilters += " and " + filters.filterAttribute[i].column + " = '" + filters.filterAttribute[i].checked + "'";
			}
		}

		//filter by primary and secondary buckets
		if(filters.secBuckets && filters.secBuckets.length > 0 && filters.priBuckets && filters.priBuckets.length > 0){
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + ") and cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}
		}else if (filters.secBuckets && filters.secBuckets.length > 0) {
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}
		}else if (filters.priBuckets && filters.priBuckets.length > 0) {
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + "))";
			}
		}else if (filters.levels && filters.levels.length > 0) {
            queryFilters += " and c.id in (select cr_id from college_majors_new where aw_level in (" + stringUtil.joinStringByComma(filters.levels) + "))";
        }

		if (filters.state && filters.state.length > 0) {
			let dbField = "";
			if (filters.website == "app") {
				dbField = "c.include_app_state";
			} else if (filters.website == "legion") {
				dbField = "c.include_legion_state";
			} else if (filters.website == "military") {
				dbField = "c.include_military_state";
			}
			let stringState = "";
			for (i = 0; i < filters.state.length; i++) {
				stringState += dbField + " like '%" + filters.state[i] + "%' or ";
			}

			queryFilters += " and c.access_level='patriot'  and " + stringState.slice(0, -4) + "";
		}
		return queryFilters;
	}

	function queryorderBuilder(filters) {
		var queryFilters = '';
		if (filters.state && filters.state.length > 0) {
			let dbField = "";
			if (filters.website == "app") {
				dbField = "include_app_state";
			} else if (filters.website == "legion") {
				dbField = "include_legion_state";
			}else if (filters.website == "military") {
				dbField = "include_military_state";
			}
			let stringState = "";
			for (i = 0; i < filters.state.length; i++) {
				stringState += dbField + " like '%" + filters.state[i] + "%' or ";
			}

			//queryFilters += " and (" + stringState + " " + dbField + " is null)";
			//queryFilters += " and (" + stringState.slice(0, -4) + ")";
			queryFilters += " and tc.college_type='state' and (tc.state_name in (" + stringUtil.joinStringByComma(filters.state) + ") and ("+ stringState.slice(0, -4) + "))";
		} else {
			queryFilters += " and tc.college_type='national'";
		}

		// filter by searchtext
		if (filters.name && filters.name.length > 0) {
			queryFilters += " AND (c.college_name LIKE '%" + filters.name + "%' OR c.city LIKE '%" + filters.name + "%' OR c.college_abbreviation LIKE '%" + filters.name + "%' OR state LIKE '%" + filters.name + "%' OR c.id in(select distinct(cr_id) from college_majors_new as cmn left join bucket_secondary_degree_list as bsdl on cmn.major_id=bsdl.major_id left join bucket_secondary_degree as bsd on bsdl.bucket_secondary_degree_id=bsd.id where bsd.title LIKE '%" + filters.name + "%'))";
		}

		// filter by levels and majors
		if(filters.majors && filters.majors.length > 0 && filters.levels && filters.levels.length > 0){
			queryFilters += " and c.id in (select cr_id from college_majors_new where aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and major_id in (" + stringUtil.joinStringByComma(filters.majors) + "))";
		}else if (filters.majors && filters.majors.length > 0) {
			queryFilters += " and c.id in (select cr_id from college_majors_new where major_id in (" + stringUtil.joinStringByComma(filters.majors) + "))";
		}

		//filter by primary and secondary buckets
		if(filters.secBuckets && filters.secBuckets.length > 0 && filters.priBuckets && filters.priBuckets.length > 0){
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + ") and cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}
		}else if (filters.secBuckets && filters.secBuckets.length > 0) {
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}
		}else if (filters.priBuckets && filters.priBuckets.length > 0) {
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + "))";
			}
		}else if (filters.levels && filters.levels.length > 0) {
            queryFilters += " and c.id in (select cr_id from college_majors_new where aw_level in (" + stringUtil.joinStringByComma(filters.levels) + "))";
        }

		// filter by religious affiliation
		if (filters.religiousAffiliation) {
			//queryFilters +=" and religious_affiliation like '"+filters.religiousAffiliation+"'";
			queryFilters += " and religious_affiliation = '" + filters.religiousAffiliation + "'";
		}

		// filter by ethnic affilication
		if (filters.ethnicAffiliation) {
			/*var ea=filters.ethnicAffiliation;
			if (filters.ethnicAffiliation == 'HBCU') 
			{
				ea = 'Historically/Predominantly Black Colleges (HBCU)';
			}
			else if (filters.ethnicAffiliation  == 'HSI')
			{
				ea = 'Hispanic Serving Institutin (HSI)';
			} 

			queryFilters +=" and ethnic_affiliation like '"+filters.ethnicAffiliation+"'";*/
			queryFilters += " and ethnic_affiliation = '" + filters.ethnicAffiliation + "'";
		}

		//filter by public or private flag 
		if (filters.collegeType && filters.collegeType.publicPrivate && filters.collegeType.publicPrivate.length > 0) {
			queryFilters += " and public_private in (" + stringUtil.joinStringByComma(filters.collegeType.publicPrivate) + ")";
		}

		//filter by school duration [2 year , 4 year]
		if (filters.collegeType && filters.collegeType.yearsOffered && filters.collegeType.yearsOffered.length > 0) {
			queryFilters += " and years_offered in (" + stringUtil.joinStringByComma(filters.collegeType.yearsOffered) + ")";
		}

		//filter by gender preference
		if (filters.collegeType && filters.collegeType.genderPreference && filters.collegeType.genderPreference.length > 0) {
			queryFilters += " and gender_preference in (" + stringUtil.joinStringByComma(filters.collegeType.genderPreference) + ")";
		}

		//filter by school setting [town , urban , suburbs]
		if (filters.collegeType && filters.collegeType.schoolSetting && filters.collegeType.schoolSetting.length > 0) {
			queryFilters += " and setting in (" + stringUtil.joinStringByComma(filters.collegeType.schoolSetting) + ")";
		}

		//does college provide online classes
		if (filters.collegeType && filters.collegeType.provideOnlineGraduateClasses) {
			queryFilters += " and online_classes_graduate like '" + filters.collegeType.provideOnlineGraduateClasses + "'";
		}

		//does college provide online classes
		if (filters.collegeType && filters.collegeType.provideOnlineUnderGraduateClasses) {
			queryFilters += " and online_classes_undergraduate like '" + filters.collegeType.provideOnlineUnderGraduateClasses + "'";
		}

		//does college provide online classes
		if (filters.provideOnlineClasses) {
			queryFilters += " and online_classes like '" + filters.provideOnlineClasses + "'";
		}

		if(filters.checkOnline) {
		// 	queryFilters += ` and c.college_type like '${filters.checkOnline}' `
		}

		if(!filters.checkOnline) {
			queryFilters += ` and c.college_type like 'traditional' `
		} else if(filters.checkOnline) {
			queryFilters += ` and c.college_type like 'online' `
		}
		//undergraduate tuition range from
		if (filters.underGraduateTuitionFrom) {	
			queryFilters += " and in_state_tuition >= " + filters.underGraduateTuitionFrom;
		}

		//undergraduate tuition range to
		if (filters.underGraduateTuitionTo) {
			queryFilters += " and in_state_tuition <= " + filters.underGraduateTuitionTo;
		}

		//graduate tuition range from
		if (filters.graduateTuitionFrom) {
			queryFilters += " and in_state_tuition_graduate >= " + filters.graduateTuitionFrom;
		}

		//graduate tuition range to
		if (filters.graduateTuitionTo) {
			queryFilters += " and in_state_tuition_graduate <= " + filters.graduateTuitionTo;
		}

		//student population from
		if(filters.studentPopulationFrom == 0 && filters.studentPopulationTo == 0 && filters.studentPopulationIndicator == 'S,M,L') {
			queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'  AND student_population <> '' `;
		}
		if(filters.studentPopulationIndicator == 'S,L') {
			queryFilters += ` AND student_population NOT BETWEEN 5000 and 15000 AND student_population <> '' `;
		} else {
			if(filters.studentPopulationFrom && filters.studentPopulationFrom!=0) {
				queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'   `;
			}
	
			if(filters.studentPopulationTo && filters.studentPopulationTo!=0) {
				queryFilters += ` AND student_population <> '' and student_population <= '${filters.studentPopulationTo}' `;
			}
		}

		// if (filters.studentPopulationFrom && filters.studentPopulationTo) {
		// 	console.log("GOT INSIDE")
		// 	queryFilters += " and (student_population_undergraduate >= " + filters.studentPopulationFrom + " and student_population_undergraduate <= " + filters.studentPopulationTo + ")   OR (student_population_graduate >= " + filters.studentPopulationFrom +"AND student_population_graduate <= " + filters.studentPopulationTo + ")";
		// }

		//graduate population range from
		// if (filters.graduatePopulationFrom) {
		// 	queryFilters += " and student_population_graduate >= " + filters.graduatePopulationFrom;
		// }

		//graduate population range to
		// if (filters.graduatePopulationTo) {
		// 	queryFilters += " and student_population_graduate <= " + filters.graduatePopulationTo;
		// }

		//gi bill student range from
		// if (filters.giStudentFrom) {
		// 	queryFilters += " and gi_bill >= " + filters.giStudentFrom;
		// }

		//gi bill student range to
		// if (filters.giStudentTo) {
		// 	queryFilters += " and gi_bill <= " + filters.giStudentTo;
		// }

		//gi bill range from
		if (filters.bahFrom) {
			queryFilters += " and bah >= " + filters.bahFrom;
		}

		//gi bill range to
		if (filters.bahTo) {
			queryFilters += " and bah <= " + filters.bahTo;
		}

		//sva service
		if (filters.provideSva) {
			queryFilters += " and sva = '" + filters.provideSva + "'";
		}

		//full time veteran counselors service
		if (filters.provideFullTimeVeteranCounselor) {
			queryFilters += " and full_time_vet_counselors = '" + filters.provideFullTimeVeteranCounselor + "'";
		}


		//signed principles of excellence
		if (filters.principlesOfExcellence) {
			queryFilters += " and principles_of_excellence = '" + filters.principlesOfExcellence + "'";
		}

		//club / association on campus
		if (filters.associaionOnCampus) {
			queryFilters += " and club_assoc_campus = '" + filters.associaionOnCampus + "'";
		}

		//upward bound
		if (filters.upwardBound) {
			queryFilters += " and upward_bound = '" + filters.upwardBound + "'";
		}

		//eight keys to veteran's success
		if (filters.eightKeys) {
			queryFilters += " and eight_keys = '" + filters.eightKeys + "'";
		}

		//provide ROTC service
		if (filters.rotcService) {
			queryFilters += " and rotc = '" + filters.rotcService + "'";
		}

		//is member of SOC
		if (filters.isMemberOfSoc) {
			queryFilters += " and member_SOC = '" + filters.isMemberOfSoc + "'";
		}

		//awards ace credit 
		if (filters.aceCredit) {
			queryFilters += " and awards_ace_credit = '" + filters.aceCredit + "'";
		}

		//awards clep credit for exam
		if (filters.clepCredit) {
			queryFilters += " and clep_credit = '" + filters.clepCredit + "'";
		}

		//awards dsst credit for exam
		if (filters.dsstCredit) {
			queryFilters += " and dsst_credit = '" + filters.dsstCredit + "'";
		}

		// Comply with The Veteran's Choice Act
		if (filters.inStateTuitionForActiveDuty) {
			queryFilters += " and in_state_tuition_no_residency = '" + filters.inStateTuitionForActiveDuty + "'";
		}

		// Approved for TA Funding
		if (filters.approvedTaFunding) {
			queryFilters += " and approved_ta_funding = '" + filters.approvedTaFunding + "'";
		}

		// yellow ribbon program
		if (filters.yellowRibbon) {
			queryFilters += " and yellow_ribbon = '" + filters.yellowRibbon + "'";
		}

		// scholarships for vevterans
		if (filters.scholarshipsForVeterans) {
			queryFilters += " and scholarships_for_veterans = '" + filters.scholarshipsForVeterans + "'";
		}

		// scholarships for veterans
		if (filters.reducedTuition) {
			queryFilters += " and reduced_tuition = '" + filters.reducedTuition + "'";
		}

		// miltary service
		for (var i = 0; i < filters.filterAttribute.length; i++) {
			if(!zeroCostData.includes(filters.filterAttribute[i].column)){
				queryFilters += " and " + filters.filterAttribute[i].column + " = '" + filters.filterAttribute[i].checked + "'";
			}
		}
		return queryFilters;
	}

	function queryBuilder(filters, type, orderType) {
		var queryFilters = '';
		// filter by degrees offered 
		// eg : 390201 
		if(filters.majors && filters.majors.length > 0 && filters.levels && filters.levels.length > 0){
			queryFilters += " and c.id in (select cr_id from college_majors_new where aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and major_id in (" + stringUtil.joinStringByComma(filters.majors) + "))";
		}else if (filters.majors && filters.majors.length > 0) {
			queryFilters += " and c.id in (select cr_id from college_majors_new where major_id in (" + stringUtil.joinStringByComma(filters.majors) + "))";
		}

		//filter by primary and secondary buckets
		if(filters.secBuckets && filters.secBuckets.length > 0 && filters.priBuckets && filters.priBuckets.length > 0){
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + ") and cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}
		}else if (filters.secBuckets && filters.secBuckets.length > 0) {
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}
		}else if (filters.priBuckets && filters.priBuckets.length > 0) {
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + "))";
			}
		}else if (filters.levels && filters.levels.length > 0) {
            queryFilters += " and c.id in (select cr_id from college_majors_new where aw_level in (" + stringUtil.joinStringByComma(filters.levels) + "))";
        }
		// filter by searchtext
		if (filters.name && filters.name.length > 0) {
			queryFilters += " AND (c.college_name LIKE '%" + filters.name + "%' OR c.city LIKE '%" + filters.name + "%' OR c.college_abbreviation LIKE '%" + filters.name + "%' OR state LIKE '%" + filters.name + "%' OR c.id in(select distinct(cr_id) from college_majors_new as cmn left join bucket_secondary_degree_list as bsdl on cmn.major_id=bsdl.major_id left join bucket_secondary_degree as bsd on bsdl.bucket_secondary_degree_id=bsd.id where bsd.title LIKE '%" + filters.name + "%'))";
		}

		// filter by religious affiliation
		if (filters.religiousAffiliation) {
			//queryFilters +=" and religious_affiliation like '"+filters.religiousAffiliation+"'";
			queryFilters += " and religious_affiliation = '" + filters.religiousAffiliation + "'";
		}

		// filter by ethnic affilication
		if (filters.ethnicAffiliation) {
			/*var ea=filters.ethnicAffiliation;
			if (filters.ethnicAffiliation == 'HBCU') 
			{
				ea = 'Historically/Predominantly Black Colleges (HBCU)';
			}
			else if (filters.ethnicAffiliation  == 'HSI')
			{
				ea = 'Hispanic Serving Institutin (HSI)';
			} 

			queryFilters +=" and ethnic_affiliation like '"+filters.ethnicAffiliation+"'";*/
			queryFilters += " and ethnic_affiliation = '" + filters.ethnicAffiliation + "'";
		}

		//filter by public or private flag 
		if (filters.collegeType && filters.collegeType.publicPrivate && filters.collegeType.publicPrivate.length > 0) {
			queryFilters += " and public_private in (" + stringUtil.joinStringByComma(filters.collegeType.publicPrivate) + ")";
		}

		//filter by school duration [2 year , 4 year]
		if (filters.collegeType && filters.collegeType.yearsOffered && filters.collegeType.yearsOffered.length > 0) {
			queryFilters += " and years_offered in (" + stringUtil.joinStringByComma(filters.collegeType.yearsOffered) + ")";
		}

		//filter by gender preference
		if (filters.collegeType && filters.collegeType.genderPreference && filters.collegeType.genderPreference.length > 0) {
			queryFilters += " and gender_preference in (" + stringUtil.joinStringByComma(filters.collegeType.genderPreference) + ")";
		}

		//filter by school setting [town , urban , suburbs]
		if (filters.collegeType && filters.collegeType.schoolSetting && filters.collegeType.schoolSetting.length > 0) {
			queryFilters += " and setting in (" + stringUtil.joinStringByComma(filters.collegeType.schoolSetting) + ")";
		}

		//does college provide online classes
		if (filters.collegeType && filters.collegeType.provideOnlineGraduateClasses) {
			queryFilters += " and online_classes_graduate like '" + filters.collegeType.provideOnlineGraduateClasses + "'";
		}

		//does college provide online classes
		if (filters.collegeType && filters.collegeType.provideOnlineUnderGraduateClasses) {
			queryFilters += " and online_classes_undergraduate like '" + filters.collegeType.provideOnlineUnderGraduateClasses + "'";
		}

		//does college provide online classes
		if (filters.provideOnlineClasses) {
			queryFilters += " and online_classes like '" + filters.provideOnlineClasses + "'";
		}

		// if(filters.checkOnline) {
		// 	queryFilters += ` and c.college_type like '${filters.checkOnline}' `
		// }

		if(!orderType){
			if(!filters.checkOnline) {
				queryFilters += ` and c.college_type like 'traditional' `
			} else if(filters.checkOnline) {
				queryFilters += ` and c.college_type like 'online' `
			}
		}

		//undergraduate tuition range from
		if (filters.underGraduateTuitionFrom) {
			queryFilters += " and in_state_tuition >= " + filters.underGraduateTuitionFrom;
		}

		//undergraduate tuition range to
		if (filters.underGraduateTuitionTo) {
			queryFilters += " and in_state_tuition <= " + filters.underGraduateTuitionTo;
		}

		//graduate tuition range from
		if (filters.graduateTuitionFrom) {
			queryFilters += " and in_state_tuition_graduate >= " + filters.graduateTuitionFrom;
		}

		//graduate tuition range to
		if (filters.graduateTuitionTo) {
			queryFilters += " and in_state_tuition_graduate <= " + filters.graduateTuitionTo;
		}

		//undergraduate population range from
		if(filters.studentPopulationFrom == 0 && filters.studentPopulationTo == 0 && filters.studentPopulationIndicator == 'S,M,L') {
			queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'  AND student_population <> '' `;
		}
		if(filters.studentPopulationIndicator == 'S,L') {
			queryFilters += ` AND student_population NOT BETWEEN 5000 and 15000 AND student_population <> '' `;
		} else {
			if(filters.studentPopulationFrom && filters.studentPopulationFrom!=0) {
				queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'   `;
			}
	
			if(filters.studentPopulationTo && filters.studentPopulationTo!=0) {
				queryFilters += ` AND student_population <> '' and student_population <= '${filters.studentPopulationTo}' `;
			}
		}

		// if (filters.studentPopulationFrom && filters.studentPopulationTo) {
		// 	queryFilters += " and (student_population_undergraduate >= " + filters.studentPopulationFrom + " and student_population_undergraduate <= " + filters.studentPopulationTo + ")   OR (student_population_graduate >= " + filters.studentPopulationFrom +"AND student_population_graduate <= " + filters.studentPopulationTo + ")";
		// }

		//graduate population range from
		// if (filters.graduatePopulationFrom) {
		// 	queryFilters += " and student_population_graduate >= " + filters.graduatePopulationFrom;
		// }

		//graduate population range to
		// if (filters.graduatePopulationTo) {
		// 	queryFilters += " and student_population_graduate <= " + filters.graduatePopulationTo;
		// }

		//gi bill student range from
		// if (filters.giStudentFrom) {
		// 	queryFilters += " and gi_bill >= " + filters.giStudentFrom;
		// }

		//gi bill student range to
		// if (filters.giStudentTo) {
		// 	queryFilters += " and gi_bill <= " + filters.giStudentTo;
		// }

		//gi bill range from
		if (filters.bahFrom) {
			queryFilters += " and bah >= " + filters.bahFrom;
		}

		//gi bill range to
		if (filters.bahTo) {
			queryFilters += " and bah <= " + filters.bahTo;
		}

		//sva service
		if (filters.provideSva) {
			queryFilters += " and sva = '" + filters.provideSva + "'";
		}

		//full time veteran counselors service
		if (filters.provideFullTimeVeteranCounselor) {
			queryFilters += " and full_time_vet_counselors = '" + filters.provideFullTimeVeteranCounselor + "'";
		}


		//signed principles of excellence
		if (filters.principlesOfExcellence) {
			queryFilters += " and principles_of_excellence = '" + filters.principlesOfExcellence + "'";
		}

		//club / association on campus
		if (filters.associaionOnCampus) {
			queryFilters += " and club_assoc_campus = '" + filters.associaionOnCampus + "'";
		}

		//upward bound
		if (filters.upwardBound) {
			queryFilters += " and upward_bound = '" + filters.upwardBound + "'";
		}

		//eight keys to veteran's success
		if (filters.eightKeys) {
			queryFilters += " and eight_keys = '" + filters.eightKeys + "'";
		}

		//provide ROTC service
		if (filters.rotcService) {
			queryFilters += " and rotc = '" + filters.rotcService + "'";
		}

		//is member of SOC
		if (filters.isMemberOfSoc) {
			queryFilters += " and member_SOC = '" + filters.isMemberOfSoc + "'";
		}

		//awards ace credit 
		if (filters.aceCredit) {
			queryFilters += " and awards_ace_credit = '" + filters.aceCredit + "'";
		}

		//awards clep credit for exam
		if (filters.clepCredit) {
			queryFilters += " and clep_credit = '" + filters.clepCredit + "'";
		}

		//awards dsst credit for exam
		if (filters.dsstCredit) {
			queryFilters += " and dsst_credit = '" + filters.dsstCredit + "'";
		}

		// Comply with The Veteran's Choice Act
		if (filters.inStateTuitionForActiveDuty) {
			queryFilters += " and in_state_tuition_no_residency = '" + filters.inStateTuitionForActiveDuty + "'";
		}

		// Approved for TA Funding
		if (filters.approvedTaFunding) {
			queryFilters += " and approved_ta_funding = '" + filters.approvedTaFunding + "'";
		}

		// yellow ribbon program
		if (filters.yellowRibbon) {
			queryFilters += " and yellow_ribbon = '" + filters.yellowRibbon + "'";
		}

		// scholarships for vevterans
		if (filters.scholarshipsForVeterans) {
			queryFilters += " and scholarships_for_veterans = '" + filters.scholarshipsForVeterans + "'";
		}

		// scholarships for veterans
		if (filters.reducedTuition) {
			queryFilters += " and reduced_tuition = '" + filters.reducedTuition + "'";
		}

		// miltary service
		for (var i = 0; i < filters.filterAttribute.length; i++) {
			if(!zeroCostData.includes(filters.filterAttribute[i].column)){
				queryFilters += " and " + filters.filterAttribute[i].column + " = '" + filters.filterAttribute[i].checked + "'";
			}
		}

		// filter by state 
		// eg : AK , AL 
		if (filters.state && filters.state.length > 0) {
			// if (type) {
				queryFilters += " and state in (" + stringUtil.joinStringByComma(filters.state) + ")";
			// } else {
			// 	let dbField = "";
			// 	if (filters.website == "app") {
			// 		dbField = "c.include_app_state";
			// 	} else if (filters.website == "legion") {
			// 		dbField = "c.include_legion_state";
			// 	} else if (filters.website == "military") {
			// 		dbField = "c.include_military_state";
			// 	}
			// 	let stringState = "";
			// 	for (i = 0; i < filters.state.length; i++) {
			// 		stringState += dbField + " like '%" + filters.state[i] + "%' or ";
			// 	}
				//queryFilters += " and (state in (" + stringUtil.joinStringByComma(filters.state) + ") or c.college_type='online' ) and (" + stringState + " " + dbField + " is null)";
				//queryFilters += " and (state in (" + stringUtil.joinStringByComma(filters.state) + ") or c.college_type='online' ) or (" + stringState.slice(0, -4) + ")";
			// 	queryFilters += " and state in (" + stringUtil.joinStringByComma(filters.state) + ") and (c.college_type='online'  and " + stringState.slice(0, -4) + ")";
			// }
			//queryFilters +=" or (college_type == 'online' and exclude_app_state not in ("+stringUtil.joinStringByComma(filters.state)+"))";
		} /*else if (!filters.name) {
			queryFilters += " or c.college_type='online'";
		}*/
		//queryFilters += ' and c.id NOT IN (1913,3449)';

		// order by
		return queryFilters;
	}

	function queryPatriotBuilder(filters, type) {
		var queryFilters = '';
		// filter by degrees offered 
		// eg : 390201 
		if(filters.majors && filters.majors.length > 0 && filters.levels && filters.levels.length > 0){
			queryFilters += " and c.id in (select cr_id from college_majors_new where aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and major_id in (" + stringUtil.joinStringByComma(filters.majors) + "))";
		}else if (filters.majors && filters.majors.length > 0) {
			queryFilters += " and c.id in (select cr_id from college_majors_new where major_id in (" + stringUtil.joinStringByComma(filters.majors) + "))";
		}

		//filter by primary and secondary buckets
		if(filters.secBuckets && filters.secBuckets.length > 0 && filters.priBuckets && filters.priBuckets.length > 0){
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + ") and cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}
		}else if (filters.secBuckets && filters.secBuckets.length > 0) {
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}
		}else if (filters.priBuckets && filters.priBuckets.length > 0) {
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + "))";
			}
		}else if (filters.levels && filters.levels.length > 0) {
            queryFilters += " and c.id in (select cr_id from college_majors_new where aw_level in (" + stringUtil.joinStringByComma(filters.levels) + "))";
        }
		// filter by searchtext
		if (filters.name && filters.name.length > 0) {
			queryFilters += " AND (c.college_name LIKE '%" + filters.name + "%' OR c.city LIKE '%" + filters.name + "%' OR c.college_abbreviation LIKE '%" + filters.name + "%' OR state LIKE '%" + filters.name + "%' OR c.id in(select distinct(cr_id) from college_majors_new as cmn left join bucket_secondary_degree_list as bsdl on cmn.major_id=bsdl.major_id left join bucket_secondary_degree as bsd on bsdl.bucket_secondary_degree_id=bsd.id where bsd.title LIKE '%" + filters.name + "%'))";
		}

		// filter by religious affiliation
		if (filters.religiousAffiliation) {
			//queryFilters +=" and religious_affiliation like '"+filters.religiousAffiliation+"'";
			queryFilters += " and religious_affiliation = '" + filters.religiousAffiliation + "'";
		}

		// filter by ethnic affilication
		if (filters.ethnicAffiliation) {
			queryFilters += " and ethnic_affiliation = '" + filters.ethnicAffiliation + "'";
		}

		//filter by public or private flag 
		if (filters.collegeType && filters.collegeType.publicPrivate && filters.collegeType.publicPrivate.length > 0) {
			queryFilters += " and public_private in (" + stringUtil.joinStringByComma(filters.collegeType.publicPrivate) + ")";
		}

		//filter by school duration [2 year , 4 year]
		if (filters.collegeType && filters.collegeType.yearsOffered && filters.collegeType.yearsOffered.length > 0) {
			queryFilters += " and years_offered in (" + stringUtil.joinStringByComma(filters.collegeType.yearsOffered) + ")";
		}

		//filter by gender preference
		if (filters.collegeType && filters.collegeType.genderPreference && filters.collegeType.genderPreference.length > 0) {
			queryFilters += " and gender_preference in (" + stringUtil.joinStringByComma(filters.collegeType.genderPreference) + ")";
		}

		//filter by school setting [town , urban , suburbs]
		if (filters.collegeType && filters.collegeType.schoolSetting && filters.collegeType.schoolSetting.length > 0) {
			queryFilters += " and setting in (" + stringUtil.joinStringByComma(filters.collegeType.schoolSetting) + ")";
		}

		//does college provide online classes
		if (filters.collegeType && filters.collegeType.provideOnlineGraduateClasses) {
			queryFilters += " and online_classes_graduate like '" + filters.collegeType.provideOnlineGraduateClasses + "'";
		}

		//does college provide online classes
		if (filters.collegeType && filters.collegeType.provideOnlineUnderGraduateClasses) {
			queryFilters += " and online_classes_undergraduate like '" + filters.collegeType.provideOnlineUnderGraduateClasses + "'";
		}

		//does college provide online classes
		if (filters.provideOnlineClasses) {
			queryFilters += " and online_classes like '" + filters.provideOnlineClasses + "'";
		}

		if(filters.checkOnline) {
			queryFilters += ` and c.college_type like '${filters.checkOnline}' `
		}

		if(!filters.checkOnline) {
			queryFilters += ` and c.college_type like 'traditional' `
		}

		//undergraduate tuition range from
		if (filters.underGraduateTuitionFrom) {
			queryFilters += " and in_state_tuition >= " + filters.underGraduateTuitionFrom;
		}

		//undergraduate tuition range to
		if (filters.underGraduateTuitionTo) {
			queryFilters += " and in_state_tuition <= " + filters.underGraduateTuitionTo;
		}

		//graduate tuition range from
		if (filters.graduateTuitionFrom) {
			queryFilters += " and in_state_tuition_graduate >= " + filters.graduateTuitionFrom;
		}

		//graduate tuition range to
		if (filters.graduateTuitionTo) {
			queryFilters += " and in_state_tuition_graduate <= " + filters.graduateTuitionTo;
		}

		//undergraduate population range from
		if(filters.studentPopulationFrom == 0 && filters.studentPopulationTo == 0 && filters.studentPopulationIndicator == 'S,M,L') {
			queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'  AND student_population <> '' `;
		}
		if(filters.studentPopulationIndicator == 'S,L') {
			queryFilters += ` AND student_population NOT BETWEEN 5000 and 15000 AND student_population <> '' `;
		} else {
			if(filters.studentPopulationFrom && filters.studentPopulationFrom!=0) {
				queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'   `;
			}
	
			if(filters.studentPopulationTo && filters.studentPopulationTo!=0) {
				queryFilters += ` AND student_population <> '' and student_population <= '${filters.studentPopulationTo}' `;
			}
		}
		//gi bill range from
		if (filters.bahFrom) {
			queryFilters += " and bah >= " + filters.bahFrom;
		}

		//gi bill range to
		if (filters.bahTo) {
			queryFilters += " and bah <= " + filters.bahTo;
		}

		//sva service
		if (filters.provideSva) {
			queryFilters += " and sva = '" + filters.provideSva + "'";
		}

		//full time veteran counselors service
		if (filters.provideFullTimeVeteranCounselor) {
			queryFilters += " and full_time_vet_counselors = '" + filters.provideFullTimeVeteranCounselor + "'";
		}


		//signed principles of excellence
		if (filters.principlesOfExcellence) {
			queryFilters += " and principles_of_excellence = '" + filters.principlesOfExcellence + "'";
		}

		//club / association on campus
		if (filters.associaionOnCampus) {
			queryFilters += " and club_assoc_campus = '" + filters.associaionOnCampus + "'";
		}

		//upward bound
		if (filters.upwardBound) {
			queryFilters += " and upward_bound = '" + filters.upwardBound + "'";
		}

		//eight keys to veteran's success
		if (filters.eightKeys) {
			queryFilters += " and eight_keys = '" + filters.eightKeys + "'";
		}

		//provide ROTC service
		if (filters.rotcService) {
			queryFilters += " and rotc = '" + filters.rotcService + "'";
		}

		//is member of SOC
		if (filters.isMemberOfSoc) {
			queryFilters += " and member_SOC = '" + filters.isMemberOfSoc + "'";
		}

		//awards ace credit 
		if (filters.aceCredit) {
			queryFilters += " and awards_ace_credit = '" + filters.aceCredit + "'";
		}

		//awards clep credit for exam
		if (filters.clepCredit) {
			queryFilters += " and clep_credit = '" + filters.clepCredit + "'";
		}

		//awards dsst credit for exam
		if (filters.dsstCredit) {
			queryFilters += " and dsst_credit = '" + filters.dsstCredit + "'";
		}

		// Comply with The Veteran's Choice Act
		if (filters.inStateTuitionForActiveDuty) {
			queryFilters += " and in_state_tuition_no_residency = '" + filters.inStateTuitionForActiveDuty + "'";
		}

		// Approved for TA Funding
		if (filters.approvedTaFunding) {
			queryFilters += " and approved_ta_funding = '" + filters.approvedTaFunding + "'";
		}

		// yellow ribbon program
		if (filters.yellowRibbon) {
			queryFilters += " and yellow_ribbon = '" + filters.yellowRibbon + "'";
		}

		// scholarships for vevterans
		if (filters.scholarshipsForVeterans) {
			queryFilters += " and scholarships_for_veterans = '" + filters.scholarshipsForVeterans + "'";
		}

		// scholarships for veterans
		if (filters.reducedTuition) {
			queryFilters += " and reduced_tuition = '" + filters.reducedTuition + "'";
		}

		// miltary service
		for (var i = 0; i < filters.filterAttribute.length; i++) {
			if(!zeroCostData.includes(filters.filterAttribute[i].column)){
				queryFilters += " and " + filters.filterAttribute[i].column + " = '" + filters.filterAttribute[i].checked + "'";
			}
		}

		// filter by state 
		// eg : AK , AL 
		if (filters.state && filters.state.length) {
			let dbField = "";
			if (filters.website == "app") {
				dbField = "c.include_app_state";
			} else if (filters.website == "legion") {
				dbField = "c.include_legion_state";
			} else if (filters.website == "military") {
				dbField = "c.include_military_state";
			}
			let stringState = "";
			stringState += '('
			for (const state of filters.state) {
				stringState += dbField + " like '%" + state + "%' or ";
			}

			queryFilters += " and c.access_level='patriot'  and " + stringState.slice(0, -4) + "";
			queryFilters += ')'
		} 

		// order by
		return queryFilters;
	}

	function showOnline(filters) {
		var queryFilters = '';

		let dbField = "";
		if (filters.website == "app") {
			dbField = "include_app_state";
		} else if (filters.website == "legion") {
			dbField = "include_legion_state";
		} else if (filters.website == "military") {
			dbField = "include_military_state";
		}
		let stringState = "";

		if (filters.state) {
			for (i = 0; i < filters.state.length; i++) {
				stringState += dbField + " like '%" + filters.state[i] + "%' or ";
			}
		}

		if (filters.name && filters.name.length > 0) {
			queryFilters += " AND (c.college_name LIKE '%" + filters.name + "%' OR c.city LIKE '%" + filters.name + "%' OR c.college_abbreviation LIKE '%" + filters.name + "%' OR state LIKE '%" + filters.name + "%' OR c.id in(select distinct(cr_id) from college_majors_new as cmn left join bucket_secondary_degree_list as bsdl on cmn.major_id=bsdl.major_id left join bucket_secondary_degree as bsd on bsdl.bucket_secondary_degree_id=bsd.id where bsd.title LIKE '%" + filters.name + "%'))";
		}

		if(!filters.checkOnline) {
			queryFilters += " and c.college_type='traditional'";
		}else{
			queryFilters += " and c.college_type='online' and c.search_online_display='Yes'";
		}

		if(filters.state && filters.state.length > 0){
			queryFilters += " and (" + stringState.slice(0, -4) + ")";
		}

		// filter by religious affiliation
		if(filters.religiousAffiliation)
		{
			queryFilters +=" and religious_affiliation like '"+filters.religiousAffiliation+"'";
		}

		// filter by ethnic affilication
		if (filters.ethnicAffiliation) {
			/*var ea=filters.ethnicAffiliation;
			if (filters.ethnicAffiliation == 'HBCU') 
			{
				ea = 'Historically/Predominantly Black Colleges (HBCU)';
			}
			else if (filters.ethnicAffiliation  == 'HSI')
			{
				ea = 'Hispanic Serving Institutin (HSI)';
			} 

			queryFilters +=" and ethnic_affiliation like '"+filters.ethnicAffiliation+"'";*/
			queryFilters += " and ethnic_affiliation = '" + filters.ethnicAffiliation + "'";
		}

		//filter by public or private flag 
		if(filters.collegeType && filters.collegeType.publicPrivate && filters.collegeType.publicPrivate.length > 0)
		{
			queryFilters +=" and public_private in ("+stringUtil.joinStringByComma(filters.collegeType.publicPrivate)+")";
		}

		//filter by school duration [2 year , 4 year]
		if(filters.collegeType && filters.collegeType.yearsOffered && filters.collegeType.yearsOffered.length > 0)
		{
			queryFilters +=" and years_offered in ("+stringUtil.joinStringByComma(filters.collegeType.yearsOffered)+")";
		}

		//filter by gender preference
		if(filters.collegeType && filters.collegeType.genderPreference && filters.collegeType.genderPreference.length > 0)
		{
			queryFilters +=" and gender_preference in ("+stringUtil.joinStringByComma(filters.collegeType.genderPreference)+")";
		}

		if (filters.collegeType && filters.collegeType.schoolSetting && filters.collegeType.schoolSetting.length > 0) {
			queryFilters += " and setting in (" + stringUtil.joinStringByComma(filters.collegeType.schoolSetting) + ")";
		}

		if(filters.studentPopulationFrom == 0 && filters.studentPopulationTo == 0 && filters.studentPopulationIndicator == 'S,M,L') {
			queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'  AND student_population <> '' `;
		}
		if(filters.studentPopulationIndicator == 'S,L') {
			queryFilters += ` AND student_population NOT BETWEEN 5000 and 15000 AND student_population <> '' `;
		} else {
			if(filters.studentPopulationFrom && filters.studentPopulationFrom!=0) {
				queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'   `;
			}
	
			if(filters.studentPopulationTo && filters.studentPopulationTo!=0) {
				queryFilters += ` AND student_population <> '' and student_population <= '${filters.studentPopulationTo}' `;
			}
		}

		//sva service
		if(filters.provideSva)
		{
			queryFilters +=" and sva = '"+filters.provideSva+"'";
		}

		//full time veteran counselors service
		if(filters.provideFullTimeVeteranCounselor)
		{
			queryFilters +=" and full_time_vet_counselors = '"+filters.provideFullTimeVeteranCounselor+"'";
		}


		//signed principles of excellence
		if(filters.principlesOfExcellence)
		{
			queryFilters +=" and principles_of_excellence = '"+filters.principlesOfExcellence+"'";
		}

		//club / association on campus
		if(filters.associaionOnCampus)
		{
			queryFilters +=" and club_assoc_campus = '"+filters.associaionOnCampus+"'";
		}

		//upward bound
		if(filters.upwardBound)
		{
			queryFilters +=" and upward_bound = '"+filters.upwardBound+"'";
		}

		//eight keys to veteran's success
		if(filters.eightKeys)
		{
			queryFilters +=" and eight_keys = '"+filters.eightKeys+"'";
		}

		//provide ROTC service
		if(filters.rotcService)
		{
			queryFilters +=" and rotc = '"+filters.rotcService+"'";
		}

		//is member of SOC
		if(filters.isMemberOfSoc)
		{
			queryFilters +=" and member_SOC = '"+filters.isMemberOfSoc+"'";
		}

		//awards ace credit 
		if(filters.aceCredit)
		{
			queryFilters +=" and awards_ace_credit = '"+filters.aceCredit+"'";
		}

		//awards clep credit for exam
		if(filters.clepCredit)
		{
			queryFilters +=" and clep_credit = '"+filters.clepCredit+"'";
		}

		//awards dsst credit for exam
		if(filters.dsstCredit)
		{
			queryFilters +=" and dsst_credit = '"+filters.dsstCredit+"'";
		}

		// Comply with The Veteran's Choice Act
		if(filters.inStateTuitionForActiveDuty)
		{
			queryFilters +=" and in_state_tuition_no_residency = '"+filters.inStateTuitionForActiveDuty+"'";
		}

		// Approved for TA Funding
		if(filters.approvedTaFunding)
		{
			queryFilters +=" and approved_ta_funding = '"+filters.approvedTaFunding+"'";
		}

		// yellow ribbon program
		if(filters.yellowRibbon)
		{
			queryFilters +=" and yellow_ribbon = '"+filters.yellowRibbon+"'";
		}

		// scholarships for vevterans
		if(filters.scholarshipsForVeterans)
		{
			queryFilters +=" and scholarships_for_veterans = '"+filters.scholarshipsForVeterans+"'";
		}

		// scholarships for veterans
		if(filters.reducedTuition)
		{
			queryFilters +=" and reduced_tuition = '"+filters.reducedTuition+"'";
		}

		// miltary service
		for(var i=0; i<filters.filterAttribute.length;i++){
			if(!zeroCostData.includes(filters.filterAttribute[i].column)){
				queryFilters += " and "+filters.filterAttribute[i].column+" = '"+filters.filterAttribute[i].checked+"'";
			}
		}

		//queryFilters += ' and c.id NOT IN (1913,3449)';

		return queryFilters;
	}

	function specificOnlineQueryBuilder(filters) {
		var queryFilters = ` `;

		if (filters.savedSearch && filters.studentid) {
			queryFilters = `Select c.id as collegeId,c.contact_email,HTML_UnEncode(sc.new_college_name)as college_name,1 as isSpecificDegree,c.specific_profile_id,sc.college_id as parentCollegeId,sc.degree_title as degree_name,seo_name,college_alias,c.college_type,address,city, state, postal_code, phone_number,phone_required,parent_id,show_parent_child,website,convert(cast(convert(sc.degree_desc using latin1) as binary) using utf8) as overview, college_logo,college_photo,access_level,convert(cast(convert(sc.degree_desc using latin1) as binary) using utf8) as display_text,tc.display_order,(select DISTINCT IF(college_id > '','Yes','NO') FROM recon_messages WHERE student_id='${filters.studentid}' AND c.id=college_id) as contacted  FROM colleges c LEFT JOIN college_profiles cp on c.id=cp.college_id LEFT JOIN default_colleges as tc on c.id=tc.college_id LEFT JOIN college_degree_specific_info as sc ON c.id=sc.college_info_id where c.status='ACTIVE' AND c.access_level != 'pending' AND sc.degree_status IN ('active','partner') and sc.program_matcher_only='no'`;
		} else {
			queryFilters = `Select c.id as collegeId,c.contact_email,HTML_UnEncode(sc.new_college_name) as college_name,1 as isSpecificDegree,c.specific_profile_id,sc.college_id as parentCollegeId,sc.degree_title as degree_name,seo_name,sc.degree_specific_alias as college_alias,c.college_type,address,city, state, postal_code, phone_number,phone_required,parent_id,show_parent_child,website,convert(cast(convert(sc.degree_desc using latin1) as binary) using utf8) as overview, college_logo,college_photo,access_level,convert(cast(convert(sc.degree_desc using latin1) as binary) using utf8) as display_text,99 as display_order,99 as degree_order,cp.public_private,cp.in_state_tuition,cp.out_state_tuition,cp.yellow_ribbon,cp.yellow_ribbon_coverage,cp.tuition_cpch FROM colleges c LEFT JOIN college_profiles cp on c.id=cp.college_id LEFT JOIN default_colleges as tc on c.id=tc.college_id LEFT JOIN college_degree_specific_info as sc ON c.id=sc.college_info_id where c.status='ACTIVE' AND c.access_level != 'pending' AND sc.degree_status IN ('active','partner') and sc.program_matcher_only='no'`;
		}

		let dbField = "";
		// if (filters.website == "app") {
		// 	dbField = "include_app_state";
		// } else if (filters.website == "legion") {
		// 	dbField = "include_legion_state";
		// } else if (filters.website == "military") {
		// 	dbField = "include_military_state";
		// }
		// let stringState = "";
		// if (filters.state) {
		// 	for (i = 0; i < filters.state.length; i++) {
		// 		stringState += dbField + " like '%" + filters.state[i] + "%' or ";
		// 	}
		// }

		queryFilters += ` and sc.degree_rule = 'online' `;

		if((filters.levels && filters.levels.length > 0) || (filters.priBuckets && filters.priBuckets.length > 0) || (filters.secBuckets && filters.secBuckets.length > 0)) {
			if(filters.levels && filters.levels.length > 0) {
				queryFilters += ` and FIND_IN_SET(sc.level_id, '${filters.levels}') `
			}

			if(filters.priBuckets && filters.priBuckets.length > 0) {
				queryFilters += ` and FIND_IN_SET(sc.bucket_id, '${filters.priBuckets}') `
			}

			if(filters.secBuckets && filters.secBuckets.length > 0) {
				if(filters.secBuckets.length == 1 ){
					queryFilters += ` and find_in_set('${filters.secBuckets[0]}',sc.sec_bucket_id)`;
				}else if(filters.secBuckets.length == 2){
					queryFilters += ` and `;
					for(let i=0;i<filters.secBuckets.length;i++){
						if(i == 0){
							queryFilters += ` (find_in_set('${filters.secBuckets[i]}',sc.sec_bucket_id)`;
						}else{
							queryFilters += ` or find_in_set('${filters.secBuckets[i]}',sc.sec_bucket_id))`;
						}
					}
				}else{
					queryFilters += ` and `;
					for(let i=0;i<filters.secBuckets.length;i++){
						if(i == 0){
							queryFilters += ` (find_in_set('${filters.secBuckets[i]}',sc.sec_bucket_id)`;
						}else if(i<= filters.secBuckets.length - 2){
							queryFilters += ` or find_in_set('${filters.secBuckets[i]}',sc.sec_bucket_id)`;
						}else{
							queryFilters += ` or find_in_set('${filters.secBuckets[i]}',sc.sec_bucket_id))`;
						}
					}
				}
			}
		}

		// if(filters.state){
		// 	queryFilters += " and (" + stringState.slice(0, -4) + ")";
		// }

		if (filters.religiousAffiliation) {
			//queryFilters +=" and religious_affiliation like '"+filters.religiousAffiliation+"'";
			queryFilters += " and religious_affiliation = '" + filters.religiousAffiliation + "'";
		}

		// filter by ethnic affilication
		if (filters.ethnicAffiliation) {
			/*var ea=filters.ethnicAffiliation;
			if (filters.ethnicAffiliation == 'HBCU') 
			{
				ea = 'Historically/Predominantly Black Colleges (HBCU)';
			}
			else if (filters.ethnicAffiliation  == 'HSI')
			{
				ea = 'Hispanic Serving Institutin (HSI)';
			} 

			queryFilters +=" and ethnic_affiliation like '"+filters.ethnicAffiliation+"'";*/
			queryFilters += " and ethnic_affiliation = '" + filters.ethnicAffiliation + "'";
		}

		//filter by public or private flag 
		if (filters.collegeType && filters.collegeType.publicPrivate && filters.collegeType.publicPrivate.length > 0) {
			queryFilters += " and public_private in (" + stringUtil.joinStringByComma(filters.collegeType.publicPrivate) + ")";
		}

		//filter by school duration [2 year , 4 year]
		if (filters.collegeType && filters.collegeType.yearsOffered && filters.collegeType.yearsOffered.length > 0) {
			queryFilters += " and years_offered in (" + stringUtil.joinStringByComma(filters.collegeType.yearsOffered) + ")";
		}

		//filter by gender preference
		if (filters.collegeType && filters.collegeType.genderPreference && filters.collegeType.genderPreference.length > 0) {
			queryFilters += " and gender_preference in (" + stringUtil.joinStringByComma(filters.collegeType.genderPreference) + ")";
		}

		//filter by school setting [town , urban , suburbs]
		if (filters.collegeType && filters.collegeType.schoolSetting && filters.collegeType.schoolSetting.length > 0) {
			queryFilters += " and setting in (" + stringUtil.joinStringByComma(filters.collegeType.schoolSetting) + ")";
		}

		//does college provide online classes
		if (filters.collegeType && filters.collegeType.provideOnlineGraduateClasses) {
			queryFilters += " and online_classes_graduate like '" + filters.collegeType.provideOnlineGraduateClasses + "'";
		}

		//does college provide online classes
		if (filters.collegeType && filters.collegeType.provideOnlineUnderGraduateClasses) {
			queryFilters += " and online_classes_undergraduate like '" + filters.collegeType.provideOnlineUnderGraduateClasses + "'";
		}

		//does college provide online classes
		if (filters.provideOnlineClasses) {
			queryFilters += " and online_classes like '" + filters.provideOnlineClasses + "'";
		}

		// if(filters.checkOnline) {
		// 	queryFilters += ` and c.college_type like '${filters.checkOnline}' `
		// }

		//undergraduate population range from
		if(filters.studentPopulationFrom == 0 && filters.studentPopulationTo == 0 && filters.studentPopulationIndicator == 'S,M,L') {
			queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'  AND student_population <> '' `;
		}
		if(filters.studentPopulationIndicator == 'S,L') {
			queryFilters += ` AND student_population NOT BETWEEN 5000 and 15000 AND student_population <> '' `;
		} else {
			if(filters.studentPopulationFrom && filters.studentPopulationFrom!=0) {
				queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'   `;
			}
	
			if(filters.studentPopulationTo && filters.studentPopulationTo!=0) {
				queryFilters += ` AND student_population <> '' and student_population <= '${filters.studentPopulationTo}' `;
			}
		}

		//sva service
		if (filters.provideSva) {
			queryFilters += " and sva = '" + filters.provideSva + "'";
		}

		//full time veteran counselors service
		if (filters.provideFullTimeVeteranCounselor) {
			queryFilters += " and full_time_vet_counselors = '" + filters.provideFullTimeVeteranCounselor + "'";
		}


		//signed principles of excellence
		if (filters.principlesOfExcellence) {
			queryFilters += " and principles_of_excellence = '" + filters.principlesOfExcellence + "'";
		}

		//club / association on campus
		if (filters.associaionOnCampus) {
			queryFilters += " and club_assoc_campus = '" + filters.associaionOnCampus + "'";
		}

		//upward bound
		if (filters.upwardBound) {
			queryFilters += " and upward_bound = '" + filters.upwardBound + "'";
		}

		//eight keys to veteran's success
		if (filters.eightKeys) {
			queryFilters += " and eight_keys = '" + filters.eightKeys + "'";
		}

		//provide ROTC service
		if (filters.rotcService) {
			queryFilters += " and rotc = '" + filters.rotcService + "'";
		}

		//is member of SOC
		if (filters.isMemberOfSoc) {
			queryFilters += " and member_SOC = '" + filters.isMemberOfSoc + "'";
		}

		//awards ace credit 
		if (filters.aceCredit) {
			queryFilters += " and awards_ace_credit = '" + filters.aceCredit + "'";
		}

		//awards clep credit for exam
		if (filters.clepCredit) {
			queryFilters += " and clep_credit = '" + filters.clepCredit + "'";
		}

		//awards dsst credit for exam
		if (filters.dsstCredit) {
			queryFilters += " and dsst_credit = '" + filters.dsstCredit + "'";
		}

		// Comply with The Veteran's Choice Act
		if (filters.inStateTuitionForActiveDuty) {
			queryFilters += " and in_state_tuition_no_residency = '" + filters.inStateTuitionForActiveDuty + "'";
		}

		// Approved for TA Funding
		if (filters.approvedTaFunding) {
			queryFilters += " and approved_ta_funding = '" + filters.approvedTaFunding + "'";
		}

		// yellow ribbon program
		if (filters.yellowRibbon) {
			queryFilters += " and yellow_ribbon = '" + filters.yellowRibbon + "'";
		}

		// scholarships for vevterans
		if (filters.scholarshipsForVeterans) {
			queryFilters += " and scholarships_for_veterans = '" + filters.scholarshipsForVeterans + "'";
		}

		// scholarships for veterans
		if (filters.reducedTuition) {
			queryFilters += " and reduced_tuition = '" + filters.reducedTuition + "'";
		}

		// miltary service
		for (var i = 0; i < filters.filterAttribute.length; i++) {
			if(!zeroCostData.includes(filters.filterAttribute[i].column)){
				queryFilters += " and " + filters.filterAttribute[i].column + " = '" + filters.filterAttribute[i].checked + "'";
			}
		}

		return queryFilters;
	}

	function specificOnlineQueryTotalQuery(filters, type) {
		var queryFilters = ` SELECT sc.id as cid FROM college_degree_specific_info sc LEFT JOIN colleges c ON sc.college_id = c.id LEFT JOIN college_profiles cp ON sc.college_id = cp.college_id WHERE degree_status = 'active' `;

		if(type == 'online') {
			queryFilters += ` and sc.degree_rule = 'online' `
		}

		let dbField = "";
		// if (filters.website == "app") {
		// 	dbField = "include_app_state";
		// } else if (filters.website == "legion") {
		// 	dbField = "include_legion_state";
		// } else if (filters.website == "military") {
		// 	dbField = "include_military_state";
		// }
		// let stringState = "";
		// if (filters.state) {
		// 	for (i = 0; i < filters.state.length; i++) {
		// 		stringState += dbField + " like '%" + filters.state[i] + "%' or ";
		// 	}
		// }

		if((filters.levels && filters.levels.length > 0) || (filters.priBuckets && filters.priBuckets.length > 0) || (filters.secBuckets && filters.secBuckets.length > 0)) {
			if(filters.levels && filters.levels.length > 0) {
				queryFilters += ` and FIND_IN_SET(sc.level_id, '${filters.levels}') `
			}

			if(filters.priBuckets && filters.priBuckets.length > 0) {
				queryFilters += ` and FIND_IN_SET(sc.bucket_id, '${filters.priBuckets}') `
			}

			if(filters.secBuckets && filters.secBuckets.length > 0) {
				if(filters.secBuckets.length == 1 ){
					queryFilters += ` and find_in_set('${filters.secBuckets[0]}',sc.sec_bucket_id)`;
				}else if(filters.secBuckets.length == 2){
					queryFilters += ` and `;
					for(let i=0;i<filters.secBuckets.length;i++){
						if(i == 0){
							queryFilters += ` (find_in_set('${filters.secBuckets[i]}',sc.sec_bucket_id)`;
						}else{
							queryFilters += ` or find_in_set('${filters.secBuckets[i]}',sc.sec_bucket_id))`;
						}
					}
				}else{
					queryFilters += ` and `;
					for(let i=0;i<filters.secBuckets.length;i++){
						if(i == 0){
							queryFilters += ` (find_in_set('${filters.secBuckets[i]}',sc.sec_bucket_id)`;
						}else if(i<= filters.secBuckets.length - 2){
							queryFilters += ` or find_in_set('${filters.secBuckets[i]}',sc.sec_bucket_id)`;
						}else{
							queryFilters += ` or find_in_set('${filters.secBuckets[i]}',sc.sec_bucket_id))`;
						}
					}
				}
			}
		}

		// if(filters.state){
		// 	queryFilters += " and (" + stringState.slice(0, -4) + ")";
		// }

		if (filters.religiousAffiliation) {
			//queryFilters +=" and religious_affiliation like '"+filters.religiousAffiliation+"'";
			queryFilters += " and religious_affiliation = '" + filters.religiousAffiliation + "'";
		}

		// filter by ethnic affilication
		if (filters.ethnicAffiliation) {
			/*var ea=filters.ethnicAffiliation;
			if (filters.ethnicAffiliation == 'HBCU') 
			{
				ea = 'Historically/Predominantly Black Colleges (HBCU)';
			}
			else if (filters.ethnicAffiliation  == 'HSI')
			{
				ea = 'Hispanic Serving Institutin (HSI)';
			} 

			queryFilters +=" and ethnic_affiliation like '"+filters.ethnicAffiliation+"'";*/
			queryFilters += " and ethnic_affiliation = '" + filters.ethnicAffiliation + "'";
		}

		//filter by public or private flag 
		if (filters.collegeType && filters.collegeType.publicPrivate && filters.collegeType.publicPrivate.length > 0) {
			queryFilters += " and public_private in (" + stringUtil.joinStringByComma(filters.collegeType.publicPrivate) + ")";
		}

		//filter by school duration [2 year , 4 year]
		if (filters.collegeType && filters.collegeType.yearsOffered && filters.collegeType.yearsOffered.length > 0) {
			queryFilters += " and years_offered in (" + stringUtil.joinStringByComma(filters.collegeType.yearsOffered) + ")";
		}

		//filter by gender preference
		if (filters.collegeType && filters.collegeType.genderPreference && filters.collegeType.genderPreference.length > 0) {
			queryFilters += " and gender_preference in (" + stringUtil.joinStringByComma(filters.collegeType.genderPreference) + ")";
		}

		//filter by school setting [town , urban , suburbs]
		if (filters.collegeType && filters.collegeType.schoolSetting && filters.collegeType.schoolSetting.length > 0) {
			queryFilters += " and setting in (" + stringUtil.joinStringByComma(filters.collegeType.schoolSetting) + ")";
		}

		//does college provide online classes
		if (filters.collegeType && filters.collegeType.provideOnlineGraduateClasses) {
			queryFilters += " and online_classes_graduate like '" + filters.collegeType.provideOnlineGraduateClasses + "'";
		}

		//does college provide online classes
		if (filters.collegeType && filters.collegeType.provideOnlineUnderGraduateClasses) {
			queryFilters += " and online_classes_undergraduate like '" + filters.collegeType.provideOnlineUnderGraduateClasses + "'";
		}

		//does college provide online classes
		if (filters.provideOnlineClasses) {
			queryFilters += " and online_classes like '" + filters.provideOnlineClasses + "'";
		}

		// if(filters.checkOnline) {
		// 	queryFilters += ` and c.college_type like '${filters.checkOnline}' `
		// }

		//undergraduate population range from
		if(filters.studentPopulationFrom == 0 && filters.studentPopulationTo == 0 && filters.studentPopulationIndicator == 'S,M,L') {
			queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'  AND student_population <> '' `;
		}
		if(filters.studentPopulationIndicator == 'S,L') {
			queryFilters += ` AND student_population NOT BETWEEN 5000 and 15000 AND student_population <> '' `;
		} else {
			if(filters.studentPopulationFrom && filters.studentPopulationFrom!=0) {
				queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'   `;
			}
	
			if(filters.studentPopulationTo && filters.studentPopulationTo!=0) {
				queryFilters += ` AND student_population <> '' and student_population <= '${filters.studentPopulationTo}' `;
			}
		}

		//sva service
		if (filters.provideSva) {
			queryFilters += " and sva = '" + filters.provideSva + "'";
		}

		//full time veteran counselors service
		if (filters.provideFullTimeVeteranCounselor) {
			queryFilters += " and full_time_vet_counselors = '" + filters.provideFullTimeVeteranCounselor + "'";
		}


		//signed principles of excellence
		if (filters.principlesOfExcellence) {
			queryFilters += " and principles_of_excellence = '" + filters.principlesOfExcellence + "'";
		}

		//club / association on campus
		if (filters.associaionOnCampus) {
			queryFilters += " and club_assoc_campus = '" + filters.associaionOnCampus + "'";
		}

		//upward bound
		if (filters.upwardBound) {
			queryFilters += " and upward_bound = '" + filters.upwardBound + "'";
		}

		//eight keys to veteran's success
		if (filters.eightKeys) {
			queryFilters += " and eight_keys = '" + filters.eightKeys + "'";
		}

		//provide ROTC service
		if (filters.rotcService) {
			queryFilters += " and rotc = '" + filters.rotcService + "'";
		}

		//is member of SOC
		if (filters.isMemberOfSoc) {
			queryFilters += " and member_SOC = '" + filters.isMemberOfSoc + "'";
		}

		//awards ace credit 
		if (filters.aceCredit) {
			queryFilters += " and awards_ace_credit = '" + filters.aceCredit + "'";
		}

		//awards clep credit for exam
		if (filters.clepCredit) {
			queryFilters += " and clep_credit = '" + filters.clepCredit + "'";
		}

		//awards dsst credit for exam
		if (filters.dsstCredit) {
			queryFilters += " and dsst_credit = '" + filters.dsstCredit + "'";
		}

		// Comply with The Veteran's Choice Act
		if (filters.inStateTuitionForActiveDuty) {
			queryFilters += " and in_state_tuition_no_residency = '" + filters.inStateTuitionForActiveDuty + "'";
		}

		// Approved for TA Funding
		if (filters.approvedTaFunding) {
			queryFilters += " and approved_ta_funding = '" + filters.approvedTaFunding + "'";
		}

		// yellow ribbon program
		if (filters.yellowRibbon) {
			queryFilters += " and yellow_ribbon = '" + filters.yellowRibbon + "'";
		}

		// scholarships for vevterans
		if (filters.scholarshipsForVeterans) {
			queryFilters += " and scholarships_for_veterans = '" + filters.scholarshipsForVeterans + "'";
		}

		// scholarships for veterans
		if (filters.reducedTuition) {
			queryFilters += " and reduced_tuition = '" + filters.reducedTuition + "'";
		}

		// miltary service
		for (var i = 0; i < filters.filterAttribute.length; i++) {
			if(!zeroCostData.includes(filters.filterAttribute[i].column)){
				queryFilters += " and " + filters.filterAttribute[i].column + " = '" + filters.filterAttribute[i].checked + "'";
			}
		}

		return queryFilters;
	}

	function specificQueryStateBuilder(filters) {
		var queryFilters = ` `;

		if (filters.savedSearch && filters.studentid) {
			queryFilters = ` Select c.id as collegeId,c.contact_email,HTML_UnEncode(sc.new_college_name)as college_name,1 as isSpecificDegree,c.specific_profile_id,sc.college_id as parentCollegeId,sc.degree_title as degree_name,seo_name,college_alias,c.college_type,address,city, state, postal_code, phone_number,phone_required,parent_id,show_parent_child,website,convert(cast(convert(sc.degree_desc using latin1) as binary) using utf8) as overview, college_logo,college_photo,access_level,convert(cast(convert(sc.degree_desc using latin1) as binary) using utf8) as display_text,tc.display_order,(select DISTINCT IF(college_id > '','Yes','NO') FROM recon_messages WHERE student_id='${filters.studentid}' AND c.id=college_id) as contacted  FROM colleges c LEFT JOIN college_profiles cp on c.id=cp.college_id LEFT JOIN default_colleges as tc on c.id=tc.college_id LEFT JOIN college_degree_specific_info as sc ON c.id=sc.college_info_id where c.status='ACTIVE' AND c.access_level != 'pending' AND sc.degree_status IN ('active','partner') and sc.program_matcher_only='no'`;
		} else {
			queryFilters = ` Select c.id as collegeId,c.contact_email,HTML_UnEncode(sc.new_college_name) as college_name,1 as isSpecificDegree,c.specific_profile_id,sc.college_id as parentCollegeId,sc.degree_title as degree_name,seo_name,sc.degree_specific_alias as college_alias,c.college_type,address,city, state, postal_code, phone_number,phone_required,parent_id,show_parent_child,website,convert(cast(convert(sc.degree_desc using latin1) as binary) using utf8) as overview, college_logo,college_photo,access_level,convert(cast(convert(sc.degree_desc using latin1) as binary) using utf8) as display_text,99 as display_order,99 as degree_order,cp.public_private,cp.in_state_tuition,cp.out_state_tuition,cp.yellow_ribbon,cp.yellow_ribbon_coverage,cp.tuition_cpch FROM colleges c LEFT JOIN college_profiles cp on c.id=cp.college_id LEFT JOIN default_colleges as tc on c.id=tc.college_id LEFT JOIN college_degree_specific_info as sc ON c.id=sc.college_info_id where c.status='ACTIVE' AND c.access_level != 'pending' AND sc.degree_status IN ('active','partner') and sc.program_matcher_only='no'`;
		}

		// let dbField = "";
		// if (filters.website == "app") {
		// 	dbField = "include_app_state";
		// } else if (filters.website == "legion") {
		// 	dbField = "include_legion_state";
		// } else if (filters.website == "military") {
		// 	dbField = "include_military_state";
		// }
		// let stringState = "";
		// if (filters.state) {
		// 	for (i = 0; i < filters.state.length; i++) {
		// 		stringState += dbField + " like '%" + filters.state[i] + "%' or ";
		// 	}
		// }

		// need to implement stringState if needed

		queryFilters += ` and sc.degree_rule = 'state' `;

		queryFilters += ` and countMatchingElements(level_id, '${filters.levels.join(',')}') AND countMatchingElements(bucket_id, '${filters.priBuckets.join(',')}')  `;
		if(filters.secBuckets.length == 1 ){
			queryFilters += ` and find_in_set('${filters.secBuckets[0]}',sec_bucket_id)`;
		}else if(filters.secBuckets.length == 2){
			queryFilters += ` and `;
			for(let i=0;i<filters.secBuckets.length;i++){
				if(i == 0){
					queryFilters += ` (find_in_set('${filters.secBuckets[i]}',sec_bucket_id)`;
				}else{
					queryFilters += ` or find_in_set('${filters.secBuckets[i]}',sec_bucket_id))`;
				}
			}
		}else{
			queryFilters += ` and `;
			for(let i=0;i<filters.secBuckets.length;i++){
				if(i == 0){
					queryFilters += ` (find_in_set('${filters.secBuckets[i]}',sec_bucket_id)`;
				}else if(i<= filters.secBuckets.length - 2){
					queryFilters += ` or find_in_set('${filters.secBuckets[i]}',sec_bucket_id)`;
				}else{
					queryFilters += ` or find_in_set('${filters.secBuckets[i]}',sec_bucket_id))`;
				}
			}
		}

		if (filters.religiousAffiliation) {
			//queryFilters +=" and religious_affiliation like '"+filters.religiousAffiliation+"'";
			queryFilters += " and religious_affiliation = '" + filters.religiousAffiliation + "'";
		}

		// filter by ethnic affilication
		if (filters.ethnicAffiliation) {
			/*var ea=filters.ethnicAffiliation;
			if (filters.ethnicAffiliation == 'HBCU') 
			{
				ea = 'Historically/Predominantly Black Colleges (HBCU)';
			}
			else if (filters.ethnicAffiliation  == 'HSI')
			{
				ea = 'Hispanic Serving Institutin (HSI)';
			} 

			queryFilters +=" and ethnic_affiliation like '"+filters.ethnicAffiliation+"'";*/
			queryFilters += " and ethnic_affiliation = '" + filters.ethnicAffiliation + "'";
		}

		//filter by public or private flag 
		if (filters.collegeType && filters.collegeType.publicPrivate && filters.collegeType.publicPrivate.length > 0) {
			queryFilters += " and public_private in (" + stringUtil.joinStringByComma(filters.collegeType.publicPrivate) + ")";
		}

		//filter by school duration [2 year , 4 year]
		if (filters.collegeType && filters.collegeType.yearsOffered && filters.collegeType.yearsOffered.length > 0) {
			queryFilters += " and years_offered in (" + stringUtil.joinStringByComma(filters.collegeType.yearsOffered) + ")";
		}

		//filter by gender preference
		if (filters.collegeType && filters.collegeType.genderPreference && filters.collegeType.genderPreference.length > 0) {
			queryFilters += " and gender_preference in (" + stringUtil.joinStringByComma(filters.collegeType.genderPreference) + ")";
		}

		//filter by school setting [town , urban , suburbs]
		if (filters.collegeType && filters.collegeType.schoolSetting && filters.collegeType.schoolSetting.length > 0) {
			queryFilters += " and setting in (" + stringUtil.joinStringByComma(filters.collegeType.schoolSetting) + ")";
		}

		//does college provide online classes
		if (filters.collegeType && filters.collegeType.provideOnlineGraduateClasses) {
			queryFilters += " and online_classes_graduate like '" + filters.collegeType.provideOnlineGraduateClasses + "'";
		}

		//does college provide online classes
		if (filters.collegeType && filters.collegeType.provideOnlineUnderGraduateClasses) {
			queryFilters += " and online_classes_undergraduate like '" + filters.collegeType.provideOnlineUnderGraduateClasses + "'";
		}

		//does college provide online classes
		if (filters.provideOnlineClasses) {
			queryFilters += " and online_classes like '" + filters.provideOnlineClasses + "'";
		}

		// if(filters.checkOnline) {
		// 	queryFilters += ` and c.college_type like '${filters.checkOnline}' `
		// }

		//undergraduate population range from
		if(filters.studentPopulationFrom == 0 && filters.studentPopulationTo == 0 && filters.studentPopulationIndicator == 'S,M,L') {
			queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'  AND student_population <> '' `;
		}
		if(filters.studentPopulationIndicator == 'S,L') {
			queryFilters += ` AND student_population NOT BETWEEN 5000 and 15000 AND student_population <> '' `;
		} else {
			if(filters.studentPopulationFrom && filters.studentPopulationFrom!=0) {
				queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'   `;
			}
	
			if(filters.studentPopulationTo && filters.studentPopulationTo!=0) {
				queryFilters += ` AND student_population <> '' and student_population <= '${filters.studentPopulationTo}' `;
			}
		}

		//sva service
		if (filters.provideSva) {
			queryFilters += " and sva = '" + filters.provideSva + "'";
		}

		//full time veteran counselors service
		if (filters.provideFullTimeVeteranCounselor) {
			queryFilters += " and full_time_vet_counselors = '" + filters.provideFullTimeVeteranCounselor + "'";
		}


		//signed principles of excellence
		if (filters.principlesOfExcellence) {
			queryFilters += " and principles_of_excellence = '" + filters.principlesOfExcellence + "'";
		}

		//club / association on campus
		if (filters.associaionOnCampus) {
			queryFilters += " and club_assoc_campus = '" + filters.associaionOnCampus + "'";
		}

		//upward bound
		if (filters.upwardBound) {
			queryFilters += " and upward_bound = '" + filters.upwardBound + "'";
		}

		//eight keys to veteran's success
		if (filters.eightKeys) {
			queryFilters += " and eight_keys = '" + filters.eightKeys + "'";
		}

		//provide ROTC service
		if (filters.rotcService) {
			queryFilters += " and rotc = '" + filters.rotcService + "'";
		}

		//is member of SOC
		if (filters.isMemberOfSoc) {
			queryFilters += " and member_SOC = '" + filters.isMemberOfSoc + "'";
		}

		//awards ace credit 
		if (filters.aceCredit) {
			queryFilters += " and awards_ace_credit = '" + filters.aceCredit + "'";
		}

		//awards clep credit for exam
		if (filters.clepCredit) {
			queryFilters += " and clep_credit = '" + filters.clepCredit + "'";
		}

		//awards dsst credit for exam
		if (filters.dsstCredit) {
			queryFilters += " and dsst_credit = '" + filters.dsstCredit + "'";
		}

		// Comply with The Veteran's Choice Act
		if (filters.inStateTuitionForActiveDuty) {
			queryFilters += " and in_state_tuition_no_residency = '" + filters.inStateTuitionForActiveDuty + "'";
		}

		// Approved for TA Funding
		if (filters.approvedTaFunding) {
			queryFilters += " and approved_ta_funding = '" + filters.approvedTaFunding + "'";
		}

		// yellow ribbon program
		if (filters.yellowRibbon) {
			queryFilters += " and yellow_ribbon = '" + filters.yellowRibbon + "'";
		}

		// scholarships for vevterans
		if (filters.scholarshipsForVeterans) {
			queryFilters += " and scholarships_for_veterans = '" + filters.scholarshipsForVeterans + "'";
		}

		// scholarships for veterans
		if (filters.reducedTuition) {
			queryFilters += " and reduced_tuition = '" + filters.reducedTuition + "'";
		}

		// miltary service
		for (var i = 0; i < filters.filterAttribute.length; i++) {
			if(!zeroCostData.includes(filters.filterAttribute[i].column)){
				queryFilters += " and " + filters.filterAttribute[i].column + " = '" + filters.filterAttribute[i].checked + "'";
			}
		}

		return queryFilters;
	}

	function querystateBuilder(filters) {
		var queryFilters = '';
		// filter by state 
		// eg : AK , AL 
		let dbField = "";
		if (filters.website == "app") {
			dbField = "include_app_state";
		} else if (filters.website == "legion") {
			dbField = "include_legion_state";
		} else if (filters.website == "military") {
			dbField = "include_military_state";
		}
		let stringState = "";
		if (filters.state) {
			for (i = 0; i < filters.state.length; i++) {
				stringState += dbField + " like '%" + filters.state[i] + "%' or ";
			}
		}

		if (filters.name && filters.name.length > 0) {
			queryFilters += " AND (c.college_name LIKE '%" + filters.name + "%' OR c.city LIKE '%" + filters.name + "%' OR c.college_abbreviation LIKE '%" + filters.name + "%' OR state LIKE '%" + filters.name + "%' OR c.id in(select distinct(cr_id) from college_majors_new as cmn left join bucket_secondary_degree_list as bsdl on cmn.major_id=bsdl.major_id left join bucket_secondary_degree as bsd on bsdl.bucket_secondary_degree_id=bsd.id where bsd.title LIKE '%" + filters.name + "%'))";
		}

		if(!filters.checkOnline){
			queryFilters += " and c.college_type='traditional'";
		// }else if(filters.checkOnline) {
		// 	if((filters.levels && filters.levels.length > 0) || (filters.priBuckets && filters.priBuckets.length > 0) || (filters.secBuckets && filters.secBuckets.length > 0)) {
		// 		queryFilters += " and c.search_online_display='Yes'";
		// 	}else{
		// 		queryFilters += " and c.college_type='online' and c.search_online_display='Yes'";
		// 	}
		}


		//queryFilters += " and (" + stringState + " " + dbField + " is null)";
		if(filters.state && filters.state.length > 0){
			queryFilters += " and (" + stringState.slice(0, -4) + ")";
		}

		// filter by degrees offered 
		// eg : 390201 
		// if(filters.majors && filters.majors.length > 0)
		// {
		// 	queryFilters +=" and c.id in (select cr_id from college_majors_new where major_id in ("+stringUtil.joinStringByComma(filters.majors)+"))";
		// }

		// filter by religious affiliation
		if(filters.religiousAffiliation)
		{
			queryFilters +=" and religious_affiliation like '"+filters.religiousAffiliation+"'";
		}

		// filter by ethnic affilication
		if(filters.ethnicAffiliation)
		{
			var ea=filters.ethnicAffiliation;
			if (filters.ethnicAffiliation == 'HBCU') 
			{
				ea = 'Historically/Predominantly Black Colleges (HBCU)';
			}
			else if (filters.ethnicAffiliation  == 'HSI')
			{
				ea = 'Hispanic Serving Institutin (HSI)';
			} 

			queryFilters +=" and ethnic_affiliation like '"+filters.ethnicAffiliation+"'";
		}

		//filter by public or private flag 
		if(filters.collegeType && filters.collegeType.publicPrivate && filters.collegeType.publicPrivate.length > 0)
		{
			queryFilters +=" and public_private in ("+stringUtil.joinStringByComma(filters.collegeType.publicPrivate)+")";
		}

		//filter by school duration [2 year , 4 year]
		if(filters.collegeType && filters.collegeType.yearsOffered && filters.collegeType.yearsOffered.length > 0)
		{
			queryFilters +=" and years_offered in ("+stringUtil.joinStringByComma(filters.collegeType.yearsOffered)+")";
		}

		//filter by gender preference
		if(filters.collegeType && filters.collegeType.genderPreference && filters.collegeType.genderPreference.length > 0)
		{
			queryFilters +=" and gender_preference in ("+stringUtil.joinStringByComma(filters.collegeType.genderPreference)+")";
		}

		if(filters.studentPopulationFrom == 0 && filters.studentPopulationTo == 0 && filters.studentPopulationIndicator == 'S,M,L') {
			queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'  AND student_population <> '' `;
		}
		if(filters.studentPopulationIndicator == 'S,L') {
			queryFilters += ` AND student_population NOT BETWEEN 5000 and 15000 AND student_population <> '' `;
		} else {
			if(filters.studentPopulationFrom && filters.studentPopulationFrom!=0) {
				queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'   `;
			}
	
			if(filters.studentPopulationTo && filters.studentPopulationTo!=0) {
				queryFilters += ` AND student_population <> '' and student_population <= '${filters.studentPopulationTo}' `;
			}
		}

		//sva service
		if(filters.provideSva)
		{
			queryFilters +=" and sva = '"+filters.provideSva+"'";
		}

		//full time veteran counselors service
		if(filters.provideFullTimeVeteranCounselor)
		{
			queryFilters +=" and full_time_vet_counselors = '"+filters.provideFullTimeVeteranCounselor+"'";
		}


		//signed principles of excellence
		if(filters.principlesOfExcellence)
		{
			queryFilters +=" and principles_of_excellence = '"+filters.principlesOfExcellence+"'";
		}

		//club / association on campus
		if(filters.associaionOnCampus)
		{
			queryFilters +=" and club_assoc_campus = '"+filters.associaionOnCampus+"'";
		}

		//upward bound
		if(filters.upwardBound)
		{
			queryFilters +=" and upward_bound = '"+filters.upwardBound+"'";
		}

		//eight keys to veteran's success
		if(filters.eightKeys)
		{
			queryFilters +=" and eight_keys = '"+filters.eightKeys+"'";
		}

		//provide ROTC service
		if(filters.rotcService)
		{
			queryFilters +=" and rotc = '"+filters.rotcService+"'";
		}

		//is member of SOC
		if(filters.isMemberOfSoc)
		{
			queryFilters +=" and member_SOC = '"+filters.isMemberOfSoc+"'";
		}

		//awards ace credit 
		if(filters.aceCredit)
		{
			queryFilters +=" and awards_ace_credit = '"+filters.aceCredit+"'";
		}

		//awards clep credit for exam
		if(filters.clepCredit)
		{
			queryFilters +=" and clep_credit = '"+filters.clepCredit+"'";
		}

		//awards dsst credit for exam
		if(filters.dsstCredit)
		{
			queryFilters +=" and dsst_credit = '"+filters.dsstCredit+"'";
		}

		// Comply with The Veteran's Choice Act
		if(filters.inStateTuitionForActiveDuty)
		{
			queryFilters +=" and in_state_tuition_no_residency = '"+filters.inStateTuitionForActiveDuty+"'";
		}

		// Approved for TA Funding
		if(filters.approvedTaFunding)
		{
			queryFilters +=" and approved_ta_funding = '"+filters.approvedTaFunding+"'";
		}

		// yellow ribbon program
		if(filters.yellowRibbon)
		{
			queryFilters +=" and yellow_ribbon = '"+filters.yellowRibbon+"'";
		}

		// scholarships for vevterans
		if(filters.scholarshipsForVeterans)
		{
			queryFilters +=" and scholarships_for_veterans = '"+filters.scholarshipsForVeterans+"'";
		}

		// scholarships for veterans
		if(filters.reducedTuition)
		{
			queryFilters +=" and reduced_tuition = '"+filters.reducedTuition+"'";
		}

		// miltary service
		for(var i=0; i<filters.filterAttribute.length;i++){
			if(!zeroCostData.includes(filters.filterAttribute[i].column)){
				queryFilters += " and "+filters.filterAttribute[i].column+" = '"+filters.filterAttribute[i].checked+"'";
			}
		}

		//queryFilters += ' and c.id NOT IN (1913,3449)';

		return queryFilters;
	}

	function querydegreestateBuilder(filters) {
		var queryFilters = '';
		// filter by state 
		// eg : AK , AL 
		let dbField = "";
		if (filters.website == "app") {
			dbField = "include_app_state";
		} else if (filters.website == "legion") {
			dbField = "include_legion_state";
		} else if (filters.website == "military") {
			dbField = "include_military_state";
		}
		let stringState = "";
		if (filters.state) {
			for (i = 0; i < filters.state.length; i++) {
				stringState += dbField + " like '%" + filters.state[i] + "%' or ";
			}
		}

		if (filters.name && filters.name.length > 0) {
			queryFilters += " AND (c.college_name LIKE '%" + filters.name + "%' OR c.city LIKE '%" + filters.name + "%' OR c.college_abbreviation LIKE '%" + filters.name + "%' OR state LIKE '%" + filters.name + "%' OR c.id in(select distinct(cr_id) from college_majors_new as cmn left join bucket_secondary_degree_list as bsdl on cmn.major_id=bsdl.major_id left join bucket_secondary_degree as bsd on bsdl.bucket_secondary_degree_id=bsd.id where bsd.title LIKE '%" + filters.name + "%'))";
		}

		if(!filters.checkOnline){
			queryFilters += " and c.college_type='traditional'";
		}else if(filters.checkOnline) {
			queryFilters += " and c.college_type='online' and c.search_online_display='No'";
		}

		//filter by primary and secondary buckets
		if(filters.secBuckets && filters.secBuckets.length > 0 && filters.priBuckets && filters.priBuckets.length > 0){
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + ") and cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}
		}else if (filters.secBuckets && filters.secBuckets.length > 0) {
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_secondary_degree_id in (" + stringUtil.joinStringByComma(filters.secBuckets) + "))";
			}
		}else if (filters.priBuckets && filters.priBuckets.length > 0) {
			if(filters.levels && filters.levels.length > 0){
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where cmn.aw_level in (" + stringUtil.joinStringByComma(filters.levels) + ") and bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + "))";
			}else{
				queryFilters += " and c.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in (" + stringUtil.joinStringByComma(filters.priBuckets) + "))";
			}
		}else if (filters.levels && filters.levels.length > 0) {
            queryFilters += " and c.id in (select cr_id from college_majors_new where aw_level in (" + stringUtil.joinStringByComma(filters.levels) + "))";
        }

		//queryFilters += " and (" + stringState + " " + dbField + " is null)";
		if(filters.state && filters.state.length > 0){
			queryFilters += " and (" + stringState.slice(0, -4) + ")";
		}

		// filter by religious affiliation
		if(filters.religiousAffiliation)
		{
			queryFilters +=" and religious_affiliation like '"+filters.religiousAffiliation+"'";
		}

		// filter by ethnic affilication
		if(filters.ethnicAffiliation)
		{
			var ea=filters.ethnicAffiliation;
			if (filters.ethnicAffiliation == 'HBCU') 
			{
				ea = 'Historically/Predominantly Black Colleges (HBCU)';
			}
			else if (filters.ethnicAffiliation  == 'HSI')
			{
				ea = 'Hispanic Serving Institutin (HSI)';
			} 

			queryFilters +=" and ethnic_affiliation like '"+filters.ethnicAffiliation+"'";
		}

		//filter by public or private flag 
		if(filters.collegeType && filters.collegeType.publicPrivate && filters.collegeType.publicPrivate.length > 0)
		{
			queryFilters +=" and public_private in ("+stringUtil.joinStringByComma(filters.collegeType.publicPrivate)+")";
		}

		//filter by school duration [2 year , 4 year]
		if(filters.collegeType && filters.collegeType.yearsOffered && filters.collegeType.yearsOffered.length > 0)
		{
			queryFilters +=" and years_offered in ("+stringUtil.joinStringByComma(filters.collegeType.yearsOffered)+")";
		}

		//filter by gender preference
		if(filters.collegeType && filters.collegeType.genderPreference && filters.collegeType.genderPreference.length > 0)
		{
			queryFilters +=" and gender_preference in ("+stringUtil.joinStringByComma(filters.collegeType.genderPreference)+")";
		}

		if(filters.studentPopulationFrom == 0 && filters.studentPopulationTo == 0 && filters.studentPopulationIndicator == 'S,M,L') {
			queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'  AND student_population <> '' `;
		}
		if(filters.studentPopulationIndicator == 'S,L') {
			queryFilters += ` AND student_population NOT BETWEEN 5000 and 15000 AND student_population <> '' `;
		} else {
			if(filters.studentPopulationFrom && filters.studentPopulationFrom!=0) {
				queryFilters += `  and student_population >= '${filters.studentPopulationFrom}'   `;
			}
	
			if(filters.studentPopulationTo && filters.studentPopulationTo!=0) {
				queryFilters += ` AND student_population <> '' and student_population <= '${filters.studentPopulationTo}' `;
			}
		}

		//sva service
		if(filters.provideSva)
		{
			queryFilters +=" and sva = '"+filters.provideSva+"'";
		}

		//full time veteran counselors service
		if(filters.provideFullTimeVeteranCounselor)
		{
			queryFilters +=" and full_time_vet_counselors = '"+filters.provideFullTimeVeteranCounselor+"'";
		}


		//signed principles of excellence
		if(filters.principlesOfExcellence)
		{
			queryFilters +=" and principles_of_excellence = '"+filters.principlesOfExcellence+"'";
		}

		//club / association on campus
		if(filters.associaionOnCampus)
		{
			queryFilters +=" and club_assoc_campus = '"+filters.associaionOnCampus+"'";
		}

		//upward bound
		if(filters.upwardBound)
		{
			queryFilters +=" and upward_bound = '"+filters.upwardBound+"'";
		}

		//eight keys to veteran's success
		if(filters.eightKeys)
		{
			queryFilters +=" and eight_keys = '"+filters.eightKeys+"'";
		}

		//provide ROTC service
		if(filters.rotcService)
		{
			queryFilters +=" and rotc = '"+filters.rotcService+"'";
		}

		//is member of SOC
		if(filters.isMemberOfSoc)
		{
			queryFilters +=" and member_SOC = '"+filters.isMemberOfSoc+"'";
		}

		//awards ace credit 
		if(filters.aceCredit)
		{
			queryFilters +=" and awards_ace_credit = '"+filters.aceCredit+"'";
		}

		//awards clep credit for exam
		if(filters.clepCredit)
		{
			queryFilters +=" and clep_credit = '"+filters.clepCredit+"'";
		}

		//awards dsst credit for exam
		if(filters.dsstCredit)
		{
			queryFilters +=" and dsst_credit = '"+filters.dsstCredit+"'";
		}

		// Comply with The Veteran's Choice Act
		if(filters.inStateTuitionForActiveDuty)
		{
			queryFilters +=" and in_state_tuition_no_residency = '"+filters.inStateTuitionForActiveDuty+"'";
		}

		// Approved for TA Funding
		if(filters.approvedTaFunding)
		{
			queryFilters +=" and approved_ta_funding = '"+filters.approvedTaFunding+"'";
		}

		// yellow ribbon program
		if(filters.yellowRibbon)
		{
			queryFilters +=" and yellow_ribbon = '"+filters.yellowRibbon+"'";
		}

		// scholarships for vevterans
		if(filters.scholarshipsForVeterans)
		{
			queryFilters +=" and scholarships_for_veterans = '"+filters.scholarshipsForVeterans+"'";
		}

		// scholarships for veterans
		if(filters.reducedTuition)
		{
			queryFilters +=" and reduced_tuition = '"+filters.reducedTuition+"'";
		}

		// miltary service
		for(var i=0; i<filters.filterAttribute.length;i++){
			if(!zeroCostData.includes(filters.filterAttribute[i].column)){
				queryFilters += " and "+filters.filterAttribute[i].column+" = '"+filters.filterAttribute[i].checked+"'";
			}
		}

		//queryFilters += ' and c.id NOT IN (1913,3449)';

		return queryFilters;
	}

	function searchCollegeSearch(filters) {
		return new Promise(function (resolve, reject) {
			var searchQuery = collegeConstants.GET_COLLEGE_SEARCH_BY_NAME_QUERY;
			queryFilters = searchqueryBuilder(filters);
			//console.log("QQ"+searchQuery+queryFilters);
			mysqlService.query(searchQuery + queryFilters)
				.then(function (response) {
					if (filters.spageNumber == 0) {
						var searchQuery = collegeConstants.GET_TOTAL_COLLEGE_SEARCH_QUERY;
						queryFilters = searchqueryBuilder(filters);
						mysqlService.query(searchQuery + queryFilters)
							.then(function (res) {
								resolve(collegeModel(response, res[0].total, '', res[0].cdata));
							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return reject(error)
								};
							});
					}
					else {
						resolve(collegeModel(response, 0));
					}
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});

	}

	function searchqueryBuilder(filters) {
		var queryFilters = '';
		if (filters.name.length > 0) {
			queryFilters += " AND (college_name LIKE '%" + filters.name + "%' OR city LIKE '%" + filters.name + "%') ORDER BY college_name ASC";

			if (filters.spageNumber == 0) {
				queryFilters += " limit 0,20";
			} else {
				var count = filters.spageSize;
				var lowerlimit = filters.spageNumber * count;
				queryFilters += " limit " + lowerlimit + "," + count;
			}
		}
		return queryFilters;
	}

	const getautolistCollege = async (filters) => {
		const autoCollegeQry = await mysqlService.query(collegeConstants.GET_COLLEGE_AUTO_LIST +  " AND (college_name LIKE '%" + filters.name + "%' OR city LIKE '%" + filters.name + "%' OR college_abbreviation LIKE '%" + filters.name + "%') ORDER BY college_name ASC");
		const degreeQry = await  mysqlService.query("select id,title from bucket_secondary_degree where title LIKE '%" + filters.name + "%' and status='active'");
		const stateData = stateConstant.filter(it => new RegExp(filters.name, "i").test(it.name));
		return  collegeListModel(autoCollegeQry, degreeQry, stateData);
	}

	function getNewsfeedByCollege(collegeId) {
		return new Promise(function (resolve, reject) {
			mysqlService.query(collegeConstants.GET_COLLEGE_NEWSFEED_QUERY, [collegeId])
				.then(function (response) {
					resolve(collegeNewsfeedModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function updateCollegeOverviewText(collegeData) {
		return new Promise(function (resolve, reject) {
			let updateQuery = "";
			if(collegeData.userType == 'collegeAdmin'){
				updateQuery = "UPDATE `college_profiles` SET college_overview = '" + collegeData.overview + "',updated_by='" + collegeData.adminId + "',updated_user='" + collegeData.adminType + "' WHERE college_id = " + collegeData.collegeId;
			}else{
				updateQuery = "UPDATE `college_profiles` SET overview = '" + collegeData.overview + "',updated_by='" + collegeData.adminId + "',updated_user='" + collegeData.adminType + "' WHERE college_id = " + collegeData.collegeId;
			}
			//console.log("UU:",updateQuery);
			mysqlService.query(updateQuery)
				.then(function (response) {
					if(response){
						resolve("success");
						/*let nameQuery = "UPDATE colleges SET college_name = '" + collegeData.collegeName + "' WHERE id = " + collegeData.collegeId;
						mysqlService.query(nameQuery)
						.then(function (response) {
							resolve("success");
						}, function (err) {
							if (err) {
								var error = err;
								error.status = 503;
								return reject(error)
							};
						});*/
					}
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function uploadPhoto(imageName, collegeId) {
		return new Promise(function (resolve, reject) {
			let updateQuery = 'UPDATE `college_profiles` SET  college_photo = "' + imageName + '" WHERE college_id = ' + collegeId;
			mysqlService.query(updateQuery)
				.then(function (response) {
					resolve("success");
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function uploadLogo(imageName, logoData) {
		return new Promise(function (resolve, reject) {
			let updateQuery = 'UPDATE `college_profiles` SET  college_logo = "' + imageName + '" WHERE college_id = ' + logoData.collegeId;
			mysqlService.query(updateQuery)
				.then(function (response) {
					//resolve("success");
					let logoInfo = {
						'college_id': logoData.collegeId,
						'image_type': 'logo',
						'height': logoData.height,
						'width': logoData.width,
						'size': logoData.size,
						'college_user_id': logoData.cuid
					}
					mysqlService.query("INSERT INTO college_image_info SET ?", logoInfo)
						.then((presults) => {
						if (presults["affectedRows"] == 1) {
							resolve("success");
						} else {
							resolve("error");
						}
						}).catch((err) => {
							reject(new Error(err));
					});
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function uploadBanner(imageName, bannerData) {
		return new Promise(function (resolve, reject) {
			let updateQuery = 'UPDATE `college_profiles` SET  college_banner = "' + imageName + '" WHERE college_id = ' + bannerData.collegeId;
			mysqlService.query(updateQuery)
				.then(function (response) {
					let bannerInfo = {
						'college_id': bannerData.collegeId,
						'image_type': 'banner',
						'height': bannerData.height,
						'width': bannerData.width,
						'size': bannerData.size,
						'college_user_id': bannerData.cuid
					}
					mysqlService.query("INSERT INTO college_image_info SET ?", bannerInfo)
						.then((presults) => {
						if (presults["affectedRows"] == 1) {
							resolve("success");
						} else {
							resolve("error");
						}
						}).catch((err) => {
							reject(new Error(err));
					});
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function uploadVsdImage(imageName, collegeId) {
		return new Promise(function (resolve, reject) {
			let updateQuery = 'UPDATE `college_vsd` SET  vsd_image = "' + imageName + '" WHERE college_id = ' + collegeId;
			mysqlService.query(updateQuery)
				.then(function (response) {
					resolve("success");
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function updateCollegeOverview(collegeData) {
		return new Promise(function (resolve, reject) {

			let updateQuery = 'UPDATE `college_profiles` SET in_state_tuition = "' + collegeData.inStateTuition + '",out_state_tuition = "' + collegeData.outStateTuition + '",in_state_tuition_graduate = "' + collegeData.inStateTuitionGraduate + '",out_state_tuition_graduate = "' + collegeData.outStateTuitionGraduate + '",books = "' + collegeData.books + '",gi_bill = "' + collegeData.giBill + '",gender_preference = "' + collegeData.genderPreference + '",female_student_count = "' + collegeData.femaleStudentCount + '",male_student_count = "' + collegeData.maleStudentCount + '",student_population_graduate = "' + collegeData.studentPopulationGraduate + '",student_population_undergraduate = "' + collegeData.studentPopulationUndergraduate + '",religious_affiliation = "' + collegeData.religiousAffiliation + '",ethnic_affiliation = "' + collegeData.ethnicAffiliation + '",years_offered = "' + collegeData.yearsOffered + '",calendar = "' + collegeData.calendar + '",setting = "' + collegeData.schoolSetting + '",public_private = "' + collegeData.publicPrivate + '",accredit = "' + collegeData.accredit + '",sat_math = "' + collegeData.satMath + '",sat_critical = "' + collegeData.satCritical + '",act_score = "' + collegeData.actScore + '",online_classes_undergraduate = "' + collegeData.onlineClassesUndergraduate + '",online_classes_graduate = "' + collegeData.onlineClassesGraduate + '",in_state_costpercredit = "' + collegeData.inStateCostPerCredit + '",out_state_costpercredit = "' + collegeData.outStateCostPerCredit + '",cpch_undergraduate_campus = "' + collegeData.cpchUndergraduateCampus + '",cpch_undergraduate_online = "' + collegeData.cpchUndergraduateOnline + '",cpch_graduate_campus = "' + collegeData.cpchGraduateCampus + '",cpch_graduate_online = "' + collegeData.cpchGraduateOnline + '",tuition_cpch = "' + collegeData.tuitionCpch + '",accelerated = "' + collegeData.accelerated + '",updated_by="' + collegeData.adminId + '",updated_user="' + collegeData.adminType + '" WHERE college_id = ' + collegeData.collegeId;

			mysqlService.query(updateQuery)
				.then(function (response) {
					resolve("success");
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function updateCollegeLocation(collegeData) {
		return new Promise(function (resolve, reject) {

			let updateQuery = 'UPDATE `college_profiles` SET veteran_affairs_attn = "' + collegeData.veteranAffairs.name + '",veteran_affairs_address = "' + collegeData.veteranAffairs.adress + '",veteran_affairs_city = "' + collegeData.veteranAffairs.city + '",veteran_affairs_state = "' + collegeData.veteranAffairs.state + '",veteran_affairs_postal_code = "' + collegeData.veteranAffairs.postalcode + '",veteran_affairs_email = "' + collegeData.veteranAffairs.email + '",veteran_affairs_website = "' + collegeData.veteranAffairs.website + '",veteran_affairs_phone = "' + collegeData.veteranAffairs.phone + '",veteran_affairs_fax = "' + collegeData.veteranAffairs.fax + '" WHERE college_id = ' + collegeData.collegeId;

			updateCollegeAdmissionsInformation(collegeData).then(function (response) {
				mysqlService.query(updateQuery).then(function (response1) {
					manageVsdInformation(collegeData).then(function (vresponse) {
						if(vresponse == 'success'){
							resolve("success");
						}
					}, function (err) {
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
				}, function (err) { reject(new Error(err)); });
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}

	function manageVsdInformation(collegeData) {
		return new Promise(function (resolve, reject) {
			let chkQuery = "SELECT count(id) as total FROM college_vsd WHERE college_id="+collegeData.collegeId;
			mysqlService.query(chkQuery)
			.then(function (response) {
				if(response[0].total == 0){
					let collegeVsd = {
						college_id: collegeData.collegeId,
						vsd_name: collegeData.vsdName,
						vsd_title: collegeData.vsdTitle,
						vsd_short_bio: collegeData.vsdShortBio,
						school_message: collegeData.vsdMessage
					};
					mysqlService.query("INSERT INTO college_vsd SET ?", collegeVsd)
                        .then(function(presults) {
							if (presults["affectedRows"] == 1) {
								resolve("success");
							}
						}, function (err) {
							if (err) {
								var error = err;
								error.status = 503;
								return reject(error)
							};
					});
				}else{
					if(collegeData.vsdName || collegeData.vsdTitle || collegeData.vsdShortBio || collegeData.vsdMessage){
						let updateQuery = 'UPDATE `college_vsd` SET vsd_name = "' + collegeData.vsdName + '",vsd_title = "' + collegeData.vsdTitle + '",vsd_short_bio = "' + collegeData.vsdShortBio + '",school_message = "' + collegeData.vsdMessage + '" WHERE college_id = ' + collegeData.collegeId;
					mysqlService.query(updateQuery)
						.then(function (uresponse) {
							resolve("success");
						}, function (err) {
							if (err) {
								var error = err;
								error.status = 503;
								return reject(error)
							};
						});
					}else{
						resolve("success");
					}
				}
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}

	function updateCollegeAdmissionsInformation(collegeData) {
		return new Promise(function (resolve, reject) {

			let updateQuery = 'UPDATE `colleges` SET address = "' + collegeData.streetAddress + '",city = "' + collegeData.city + '",state = "' + collegeData.state + '",postal_code = "' + collegeData.postalCode + '",contact_email = "' + collegeData.email + '",website = "' + collegeData.website + '",phone_number = "' + collegeData.phone + '",fax_number = "' + collegeData.fax + '" WHERE id = ' + collegeData.collegeId;
			mysqlService.query(updateQuery)
				.then(function (response) {
					resolve("success");
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function updateMilitaryOfferings(collegeData) {
		return new Promise(async (resolve, reject) => {
			try {
				const updateQuery = `UPDATE college_profiles SET mycaa = '${collegeData.myCAA}',rotc_overview = '${collegeData.rotcOverview}',rotc = '${collegeData.rotc}',gibill_program = '${collegeData.gibillProgram}',yellow_ribbon = '${collegeData.yellowRibbon}',clep_credit = '${collegeData.clepCredit}',dsst_credit = '${collegeData.dsstCredit}',member_soc = '${collegeData.memberSoc}',awards_ace_credit = '${collegeData.awardsAceCredit}',bah = '${collegeData.bah}',sva = '${collegeData.sva}',reduced_tuition = '${collegeData.reducedTuition}',scholarships_for_veterans = '${collegeData.scholarshipsForVeterans}',in_state_tuition_no_residency = '${collegeData.inStateTuitionNoResidency}',principles_of_excellence = '${collegeData.principlesOfExcellence}',full_time_vet_counselors = '${collegeData.fullTimeVetCounselors}',club_assoc_campus = '${collegeData.clubAssocCampus}',approved_ta_funding = '${collegeData.approvedTaFunding}',eight_keys = '${collegeData.eightKeys}',upward_bound = '${collegeData.upwardBound}',yellow_ribbon_coverage = '${collegeData.yellowRibbonCoveragePrice}',updated_by='${collegeData.adminId}',updated_user = '${collegeData.adminType}' WHERE college_id = ${collegeData.collegeId}`;
				await mysqlService.query(updateQuery);
				return resolve('success');
			} catch (error) {
				return reject(error);
			}
		});
	}

	function updateYellowRibbonData(yellowribbonData){
		return new Promise(function (resolve, reject) {
			let selQuery = "select count(id) as total from college_yellow_ribbon_degree where college_id="+yellowribbonData.collegeId;
			//console.log("QQ1:",selQuery);
			mysqlService.query(selQuery)
			.then(function (response) {
				//console.log("Response:",response[0]);
				if(response[0] && response[0].total > 0){
					let delQuery = "DELETE FROM college_yellow_ribbon_degree where college_id="+yellowribbonData.collegeId;
					mysqlService.query(delQuery)
					.then(function (response1) {
						//console.log("RR:",response1["affectedRows"]);
						if(yellowribbonData.degreeLists.length > 0){
							let insertQuery = "Insert into college_yellow_ribbon_degree (college_id,degree_name,division_of_school,amount,no_of_student,division_bucket) values ";
							for (i = 0; i < yellowribbonData.degreeLists.length; i++) {
								if (i == yellowribbonData.degreeLists.length - 1) {
									insertQuery += "("+yellowribbonData.collegeId+",'" + yellowribbonData.degreeLists[i]["degreelevel"] + "','" + yellowribbonData.degreeLists[i]["divisonschool"] + "','" + yellowribbonData.degreeLists[i]["amount"] + "','" + yellowribbonData.degreeLists[i]["number"] + "','');";
								} else {
									insertQuery += "("+yellowribbonData.collegeId+",'" + yellowribbonData.degreeLists[i]["degreelevel"] + "','" + yellowribbonData.degreeLists[i]["divisonschool"] + "','" + yellowribbonData.degreeLists[i]["amount"] + "','" + yellowribbonData.degreeLists[i]["number"] + "',''),";
								}
							}
							mysqlService.query(insertQuery)
								.then(function (response2) {
									resolve("success");
								}, function (err) {
									if (err) {
										var error = err;
										error.status = 503;
										return reject(error)
									};
								});
						}else{
							resolve("success");
						}
					}, function (err) {
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
				}else{
					let insertQuery = "Insert into college_yellow_ribbon_degree (college_id,degree_name,division_of_school,amount,no_of_student,division_bucket) values ";
					for (i = 0; i < yellowribbonData.degreeLists.length; i++) {
						if (i == yellowribbonData.degreeLists.length - 1) {
							insertQuery += "("+yellowribbonData.collegeId+",'" + yellowribbonData.degreeLists[i]["degreelevel"] + "','" + yellowribbonData.degreeLists[i]["divisonschool"] + "','" + yellowribbonData.degreeLists[i]["amount"] + "','" + yellowribbonData.degreeLists[i]["number"] + "','');";
						} else {
							insertQuery += "("+yellowribbonData.collegeId+",'" + yellowribbonData.degreeLists[i]["degreelevel"] + "','" + yellowribbonData.degreeLists[i]["divisonschool"] + "','" + yellowribbonData.degreeLists[i]["amount"] + "','" + yellowribbonData.degreeLists[i]["number"] + "',''),";
						}
					}
					mysqlService.query(insertQuery)
					.then(function (response1) {
						resolve("success");
					}, function (err) {
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
				}
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}

	function saveTimeLine(collegeTimeLine) {
		var imageName = '';
		var dl_image_url = '';
		var cached_og_data = '';
		if (collegeTimeLine.file) {
			var ext = collegeTimeLine.fileExtension;
			var imagePath = collegeTimeLine.file.split(",");
			var base64Data = imagePath[1];
			imageName = uuidv4() + '.' + ext;

			var bitmap = new Buffer(base64Data, 'base64');
			require("fs").writeFile('social_images/' + imageName, bitmap, function (err) {
				console.log(err);
			});
		}

		if (collegeTimeLine.resourcePath) {

			return new Promise(function (resolve, reject) {
				ogGraphService.getOgGraphDescription(collegeTimeLine.resourcePath).then(function (res) {
					// console.log('ogdata',res)
					cached_og_data = JSON.stringify(res);

					// console.log('cached_og_data',cached_og_data)
					dl_image_url = res.image.url;
					// return new Promise(function(resolve, reject) {
					/*let insertTimeLine = `insert into newsfeed (college_id, post, post_type, post_privacy, dl_image_url, resource_url,cached_og_data,date_created) 
					values (${collegeTimeLine.collegeId},'${collegeTimeLine.post}', '${collegeTimeLine.postType}', '${collegeTimeLine.postPrivacy}', '${dl_image_url}',
					'${collegeTimeLine.resourcePath}', '${cached_og_data.replace("'",'&quot;')}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}')`*/
					// console.log('query', insertTimeLine)
					//console.log("Here");
					let timeLine = {
						college_id: collegeTimeLine.collegeId,
						post: collegeTimeLine.post,
						post_type: collegeTimeLine.postType,
						post_privacy: collegeTimeLine.postPrivacy,
						dl_image_url: dl_image_url,
						resource_url: collegeTimeLine.resourcePath,
						cached_og_data: cached_og_data.replace("'", '&quot;'),
						date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
					};
					mysqlService.query("INSERT INTO newsfeed SET ?", timeLine)
						.then(function (response) {
							resolve(response);
						}, function (err) {
							reject(err)
						})
				}, function (err) {
					console.log('inside error')
				})
			})
		} else {
			return new Promise(function (resolve, reject) {
				if (imageName) {
					imageName = config.AWS_IMAGE_RESOURCE_SOCIAL + imageName;
				}

				/*let insertTimeLine = `insert into newsfeed (college_id, post, post_type, post_privacy, dl_image_url, resource_url,cached_og_data,date_created) 
				values (${collegeTimeLine.collegeId},'${collegeTimeLine.post}', '${collegeTimeLine.postType}', '${collegeTimeLine.postPrivacy}', '${dl_image_url}',
				'${imageName}', '${cached_og_data}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}')`*/
				//console.log("Here1");
				let timeLine = {
					college_id: collegeTimeLine.collegeId,
					post: collegeTimeLine.post,
					post_type: collegeTimeLine.postType,
					post_privacy: collegeTimeLine.postPrivacy,
					dl_image_url: dl_image_url,
					resource_url: imageName,
					cached_og_data: cached_og_data,
					date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
				};
				mysqlService.query("INSERT INTO newsfeed SET ?", timeLine)
					.then(function (response) {
						resolve(response);
					});
			});
		}

	}

	function deleteTimeLine(collegeId, newsFeedId) {
		return new Promise(function (resolve, reject) {
			let deleteQuery = "Delete from newsfeed where college_id = " + collegeId + " AND id =" + newsFeedId;
			mysqlService.query(deleteQuery)
				.then(function (response) {
					resolve("success");
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}


	function updateMajorOfferings(majorData, collegeId) {
		return new Promise(async (resolve, reject) => {
			try {
				const getGovIdQuery = "select gov_id from college_majors_new where cr_id = " + collegeId + " limit 1";
				let govId = 0;
				const [response] = await mysqlService.query(getGovIdQuery);
				if (response) {
					govId = response.gov_id;
				}
				const queryDelete = "DELETE FROM college_majors_new WHERE cr_id = " + collegeId;
				await mysqlService.query(queryDelete);
				if(majorData && majorData.length) {
					let sql = "INSERT INTO college_majors_new (cr_id, major_id,aw_level, gov_id, in_person, online, hybrid, status) VALUES ";
					for (const major of majorData) {
						sql += "("
						+ major.collegeId + ","
						+ major.majorId + ","
						+ major.level + ","
						+ govId + ","
						+ major.inPerson + ","
						+ major.online + ","
						+ major.hybrid + ","
						+ "'ACTIVE'" + "),";
					}
					sql = sql.slice(0, -1);
					await mysqlService.query(sql);
				}
				return resolve('success');
			} catch (error) {
				return reject(error)
			}
		});
	}

	function getCollegeProfileView(collegeid) {
		return new Promise(function (resolve, reject) {
			let query = 'SELECT distinct(student_id) as student_id FROM `recon_messages` WHERE college_id = ' + collegeid;
			mysqlService.query(query)
				.then(function (response) {
					let searchStudents = "";
					if (response.length > 0) {
						for (var i = 0; i < response.length; i++) {
							searchStudents += '"' + response[i].student_id + '",';
						}
						searchStudents = searchStudents.slice(0, -1);
						let selectQuery = "SELECT s.uuid,s.first_name, s.middle_initial,s.last_name,sp.military_status,sp.city,sp.state,sp.gpa,sp.act_score,sp.sat_score,sp.profile_image,sp.privacy_universal,sp.privacy_photo,sp.privacy_personal,sp.privacy_contact,sp.privacy_academic,bb.branch_short_name FROM students as s LEFT JOIN student_profile as sp ON s.uuid = sp.uuid LEFT JOIN branches as bb ON bb.id=sp.military_branch WHERE s.uuid IN (" + searchStudents + ") ORDER BY s.first_name ASC";
						mysqlService.query(selectQuery)
							.then(function (response1) {
								resolve(collegeStudentContactModel(response1));
							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return reject(error)
								};
							});
					} else {
						resolve("empty");
					}
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getCollegeFavouriteList(collegeid) {
		return new Promise(function (resolve, reject) {
			let query = 'SELECT distinct(student_id) as student_id FROM `fav_colleges` WHERE college_id = ' + collegeid;
			mysqlService.query(query)
				.then(function (response) {
					let searchStudents = "";
					if (response.length > 0) {
						for (var i = 0; i < response.length; i++) {
							searchStudents += '"' + response[i].student_id + '",';
						}
						searchStudents = searchStudents.slice(0, -1);
						let selectQuery = "SELECT s.uuid,s.first_name, s.middle_initial,s.last_name,sp.military_status,sp.city,sp.state,sp.gpa,sp.act_score,sp.sat_score,sp.profile_image,sp.privacy_universal,sp.privacy_photo,sp.privacy_personal,sp.privacy_contact,sp.privacy_academic,bb.branch_short_name FROM students as s LEFT JOIN student_profile as sp ON s.uuid = sp.uuid LEFT JOIN branches as bb ON bb.id=sp.military_branch WHERE s.uuid IN (" + searchStudents + ") ORDER BY s.first_name ASC";
						mysqlService.query(selectQuery)
							.then(function (response1) {
								resolve(collegeStudentContactModel(response1));
							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return reject(error)
								};
							});
					} else {
						resolve("empty");
					}
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

		// To get matching college for new registered user to send bounceback email

		function getNewRegisteredMatchCollege(filters) {
		return new Promise(function (resolve, reject) {
			var searchQuery = "";
			if (filters.state == "Online") {
				searchQuery = searchConstant.GET_ALL_ONLINE_COLLEGE_SEARCH_QUERY;
			} else {
				searchQuery = searchConstant.GET_ALL_COLLEGE_SEARCH_QUERY;
			}
			// console.log("search query:",searchQuery);
			//Get sourrounding state
			let sourroundQuery = 'Select sourrounding_statevalue from state_sourrounding where state_value ="' + filters.state + '"';
			mysqlService.query(sourroundQuery)
				.then(function (sresponse) {
					if (sresponse.length > 0 && sresponse[0]['sourrounding_statevalue'] != "") {
						sourround_state = filters.state + "," + sresponse[0]['sourrounding_statevalue'];
						near_state = sresponse[0]['sourrounding_statevalue'];
					} else {
						sourround_state = filters.state;
						near_state = "";
					}
					let educationGoal = getAcademicLevel(filters.education_goal);
					var area_focus_ids = "";
					if (filters.area_focus_ids) {
						let checkTouro = false;
						//let selectQuery = "select major_id from bucket_secondary_degree_list where bucket_secondary_degree_id in (" + filters.area_focus_ids + ")";
						let selectQuery = "select major_id from bucket_secondary_degree_list where bucket_primary_degree_id in (" + filters.bucket_id + ")";
						mysqlService.query(selectQuery)
							.then(function (response) {
								//resolve(response);
								if (response.length > 0) {
									var ids = "";
									for (i = 0; i < response.length; i++) {
										ids += response[i].major_id + ",";
									}
									ids = ids.slice(0, -1);
									//queryFilters=registerqueryBuilder(filters,ids);
									//subquery = searchQuery+queryFilters;
									subquery = buildOnlinequeryBuilder(searchQuery, filters, ids, sourround_state, near_state);
									
										allquery = "select a.*,(select group_concat(DISTINCT(major_id)) from college_majors_new where major_id in (" + ids + ") and cr_id=a.collegeId and aw_level in (" + educationGoal + ")) as majorCount  FROM (" + subquery + ") as a";
										
										//  console.log("Q:",allquery);
										mysqlService.query(allquery)
											.then(function (response1) {
												getSecondaryBucketMajorLists(filters).then(function (response2) {
													resolve(registerCollegeListModel(response1, filters.state, sourround_state, filters.military_status,response2));
												}, function (err) {
													if (err) {
													var error = err;
													error.status = 503;
													return reject(error)
													};
												})
											}, function (err) {
												if (err) {
													var error = err;
													error.status = 503;
													return reject(error)
												};
											});
									
									//console.log("QQ:",subquery);
								} else {
									resolve("empty");
								}

							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return reject(error)
								};
							});
					} else {
						area_focus_ids = filters.area_focus_ids;
						//queryFilters=registerqueryBuilder(filters,area_focus_ids);
						//subquery = searchQuery+queryFilters;
						subquery = buildOnlinequeryBuilder(searchQuery, filters, area_focus_ids, sourround_state, near_state);
						// console.log("SB:",subquery);
						allquery = "select a.*,(select count(*) as ctn from college_majors_new where major_id in (" + area_focus_ids + ") and cr_id=a.collegeId and aw_level in (" + educationGoal + ")) as majorCount  FROM (" + subquery + ") as a";
						// console.log("Q:",allquery);
						mysqlService.query(allquery)
							.then(function (response) {
								//resolve(response);
								resolve(registerCollegeListModel(response, filters.state, sourround_state, filters.military_status,""));
							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return reject(error)
								};
							});
					}
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});	
		});
		}

	function sendBackBucketDataEmailToNewUser(filters) {
		return new Promise(async (resolve, reject) => {
			const adData = await getDegreeBounceBackAdvertise(filters[0]);
			const unsubscribeId = base64Utility.encodeBase64("uid:"+filters[3]+"&type:degree_bounce_email");
			const unsubscribeUrl = config.DOMAIN_URL+"/email/unsubscribe/"+unsubscribeId;
			const profileUrl = config.DOMAIN_URL+"/login?uid=" + filters[3];
			let emailContent = "";
			emailContent += `<!DOCTYPE html><html><head><style> body { font-family: "Source Sans Pro", sans-serif; color: #333; }.body{padding: 10%;}.header-section {margin-bottom: 10px;margin-top: 10px;padding: .5rem;clear: both;}`;
			emailContent += `.college-info {border-spacing: 0;margin-bottom: 80px;}.yellowcolor {background-color: #fec231;}.college-info tr th{font-weight: 700;}.college-info { width: 100%;margin-bottom: 10px;}.college-ad td,th {border: 0;margin: 0 !important;padding: 10px 10px;text-align: center;}`;
			emailContent += `.text-contain {font-size: 14px;}.criteria{width: 100%;margin-bottom: 20px;}.criteria td{font-size: 18px;}.criteria-dlinks td{font-size: 14px;}.college-detail{padding-left: 0;}.college-detail li{list-style: none;display: inline-block;margin-right: .8rem;}.edit-degree{padding: .5rem;background-color: #f5f5f5;}h3{font-size:24px;}`;
			//emailContent += `.list-direction{list-style-type:decimal}.list-direction li{margin-bottom: 10px;}@media only screen and (max-width: 768px) { .d-xs-none{display: none !important;}}</style></head><body><div class="body-section "><div><h3>${filters[4]} Program Information for ${filters[2]}</h3><p style="margin-top: 8px;">Did you know...you can refine the programs contained within your search?</p>`;
			emailContent += `.list-direction{list-style-type:decimal}.list-direction li{margin-bottom: 10px;}@media only screen and (max-width: 768px) { .d-xs-none{display: none !important;}}.unsubscribe{text-align: center;font-size: 12px;font-style: italic;}</style></head><body>`;
			emailContent += '<div style="text-align:center;"><span><img src="https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png" width="150px" /></span></div>';
			emailContent += '<div class="body-section "><div>';
			emailContent += `<p style="margin-top: 15px;">Thank you for choosing CollegeRecon, the premier education and transition resource built exclusively for the US military, veterans and their families.</p><p>Please find descriptions of your chosen degree programs below.</p>`;
			emailContent += '<h3 style="padding-top: 15px;margin: 0px;">Matching Criteria for '+ filters[2] +'</h3>';
			emailContent += '<table class="criteria-dlinks" ><tbody><tr><td>Where You Plan to Study:</td></tr><tr><td style="padding-bottom: 10px;">  <strong>' + filters[0].state + '</strong></td></tr>';
			emailContent += '<tr><td>Area of Study: </td></tr><tr><td style="padding-bottom: 10px;"><strong>'+ filters[4] +'</strong></td></tr>';
			emailContent += '<tr><td>Area of Focus : </td></tr><tr><td>';
			emailContent += '<strong>' + filters[5].replace(/,/g, ", ") + '</strong>';
			emailContent += '</td>';
			emailContent += '</tr></tbody></table>';
			emailContent += `<h3 style="margin: 0px;padding-left: 0;padding-top:20px;">How to Contact Schools</h3><ol style="margin-left:8px;" class="list-direction"><li>Visit your <a href="${profileUrl}">profile</a></li><li>Open the Matched Schools tab</li><li>Check schools that you wish to contact</li><li>Click request info to hear from schools</li></ol></div>`;
			emailContent += `<div ><h3 style="margin: 0;padding: 1rem 0rem;">Featured Schools & Programs</h3><table width="100%" align="left" class="college-ad" style="background-color: #f5f5f5;clear: both; padding:.5rem;margin-bottom: 24px;border-collapse: collapse;"><thead></thead><tbody>`;
			const featureSchool = [];
			let featureLength = 0;
			if(adData.length > 3){
				featureLength = 3;
			}else{
				featureLength = adData.length;
			}
			for (let i = 0; i < featureLength; i++) {
				school = adData[i];
				featureSchool.push(school);
				let tadvLink = config.DOMAIN_URL+"/"+school.collegeAlias+'?'+emailConstant.FEATURE_SCHOOL_TRACKER;
				emailContent += `<tr ><td width="10%" style="text-align: left;padding-bottom: 10px;"><a href="${tadvLink}"><img src="${school.collegeLogo}" width="80px" /></a> </td><td style="text-align: left;padding-bottom: 10px;"><a href="${tadvLink}" style="color:#333333;text-decoration:none;"><span style="display:block;font-weight: bold;">${school.college_name}</span></a><span style="font-size:12px;">${school.collegeDesc}</span></td></tr><tr><td colspan="2" style="text-align: left;padding-bottom: 10px;font-size:12px;border-bottom: 2px solid #ffffff;"></td></tr>`;
			}
			emailContent += `</tbody></table></div><div style="clear: both;">`;
			emailContent += getSelectedProgramlinks(filters[0].education_goal,filters[0].bucket_id, filters[0].area_focus_ids);
			emailContent += `<h3 style="margin: 0;padding: .5rem 0rem;">${filters[4]} Program Descriptions</h3><table align="left" class="college-info" style="clear: both; background-color: #ffffff;margin-bottom: 24px;border-collapse: collapse;"><thead></thead><tbody>`;
			const majorIdArray = await getMajorId(filters[0].bucket_id, filters[0].area_focus_ids, filters[3], filters[6])
			for (let majorId of majorIdArray) {
				if(majorId.title) {
					emailContent += `<tr ><td style="text-align: left;padding: 20px 0px 0px 0px;border-bottom: 5px solid #ffffff; min-height: 40px;"><span style="font-weight: bold;">${majorId.title}</span></td></tr>`;
				}
				if(majorId.description) {
					emailContent +=`<tr ><td style="text-align: left;padding: 0px 0px 5px 0px;border-bottom: 5px solid #ffffff; min-height: 40px;">${majorId.description}</td></tr>`;
				}
				if(majorId.college_details[0].length) {
					emailContent += `<tr><td style="text-align: left;border-bottom: 5px solid #ffffff; min-height: 40px;">Schools with this academic program</td></tr>`;
				}
				for(let collegeDetail of majorId.college_details[0]) {
					if(filters[6] == 'register') {
						await insertDegreeBounceEmailData(filters[3], collegeDetail.college_id);
					}
					const collegeLink = config.DOMAIN_URL+"/"+collegeDetail.collegeAlias;
					emailContent += `<tr><td style="text-align: left;border-bottom: 5px solid #ffffff; min-height: 40px;"><a href="${collegeLink}" style="color:#333333;">${collegeDetail.college_name}</a></td></tr> `;
				}
			}
			emailContent += ` </tbody></table></div>`;
			emailContent += `<div style="border-bottom: 2px solid #f5f5f5;width: 100%;">&nbsp;</div>`;
			if(adData.length > 3){
				emailContent += `<div ><h3 style="margin: 0;padding: 1rem 0rem;">Featured Schools & Programs</h3><table width="100%" align="left" class="college-ad" style="background-color: #f5f5f5;clear: both; padding:.5rem;margin-bottom: 24px;border-collapse: collapse;"><thead></thead><tbody>`;
				for (let i = 3; i < adData.length; i++) {
					school = adData[i];
					featureSchool.push(school);
					let tadvLink = config.DOMAIN_URL+"/"+school.collegeAlias+'?'+emailConstant.FEATURE_SCHOOL_TRACKER;
				    emailContent += `<tr ><td width="10%" style="text-align: left;padding-bottom: 10px;"><a href="${tadvLink}"><img src="${school.collegeLogo}" width="80px" /></a> </td><td style="text-align: left;padding-bottom: 10px;"><a href="${tadvLink}" style="color:#333333;text-decoration:none;"><span style="display:block;font-weight: bold;">${school.college_name}</span></a><span style="font-size:12px;">${school.collegeDesc}</span></td></tr><tr><td colspan="2" style="text-align: left;padding-bottom: 10px;font-size:12px;border-bottom: 2px solid #ffffff;"></td></tr>`;
				}
				emailContent += `</tbody></table></div><div style="clear: both;">`;
			}
			if(featureSchool.length) await insertTracking(featureSchool.map(x => x.collegeId), sourceTrackingConstant.PRIMARY_SOURCE_APP, sourceTrackingConstant.SECONDARY_SOURCE_MATCHING_FEATURE_APPEARANCE);
			emailContent += `<div style="padding-top: 1rem;"><p style="font-size: 18px;"><a href="https://scholarships.collegerecon.com">Scholarship Finder</a></p><p>Find money to pay for school with the CollegeRecon Scholarship Finder.  Scholarships for veterans, military and their families, as well as by degree program.</p></div>`;
			emailContent += '<div class="unsubscribe"><span><a href="'+unsubscribeUrl+'">Unsubscribe</a> to no longer receive degree emails</span></div>';
			emailContent += `<table align="center" style="margin-top:80px"><tr><td style="text-align: center;"><span><img src="https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png" width="150px" /></span></td></tr><tr><td style="text-align: center;">College Recon Team</td></tr></table></div></body></html>`;
			const messageContent = messageEmail.basicReplyEmailTemplate(emailContent);
			//console.log("BounceDegree:",messageContent);
			const from = "CollegeRecon <"+emailConstant.INFORMATION_EMAIL+">";
			const subject = filters[2]+", here are your selected degree programs";
			const to = [filters[1]];
			//let to = ['shivaram@noveltytechnology.com','bill@hfalliance.com','garrett@hfalliance.com','Ramesh@noveltytechnology.com'];
			await emailService.sendEmail(from, to, subject, messageContent);
			return resolve('success');
		});
	}

	function getSelectedProgramlinks(levelId,bucketId,secBucketId){
		let separateLinks = ['4','6','10','11'];
		let sameLinks = ['8','12','13','17','18','19'];
		let emptyTradeArticle = ['78','144','168','171','23','169','160','161','22','74'];
		if(separateLinks.indexOf(bucketId) > -1){
			let bachelors = ['3','5','18','0'];
			switch(bucketId) {
				case '4':
					if(bachelors.indexOf(levelId) > -1){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/business-administration-degrees/">Business Degrees</a></td></tr><tr><td>Degree types and jobs available to those who pursue business degrees.</td></tr><tr><td><a href="https://collegerecon.com/business-scholarships/">Scholarships for Those Seeking Business Degrees</a></td></tr><tr><td><a href="https://collegerecon.com/how-to-determine-if-business-school-is-right-for-you/">Is Business School Right For You?</a></td></tr><tr><td><a href="https://collegerecon.com/accounting-degree-portable-career/">Learn More About Accounting Degrees</a></td></tr></table></div>`;
					}else{
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/how-to-determine-if-business-school-is-right-for-you/">Is Business School Right For You?</a></td></tr><tr><td><a href="https://collegerecon.com/mba-scholarships-veterans/">MBA Scholarships for Veterans</a></td></tr><tr><td><a href="https://collegerecon.com/business-schools-military/">MBA Programs with GMAT Waivers for Military</a></td></tr><tr><td><a href="https://collegerecon.com/business-scholarships/">Scholarships for Those Seeking Business Degrees</a></td></tr></table></div>`;
					}
				case '6':
					if(bachelors.indexOf(levelId) > -1){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/computer-science-degrees/">Computer Science Degrees</a></td></tr><tr><td>Degree types and jobs available to those who pursue computer science degrees.</td></tr><tr><td><a href="https://collegerecon.com/computer-science-scholarships/">Computer Science Scholarships</a></td></tr><tr><td><a href="https://collegerecon.com/getting-a-degree-in-information-technology/">IT Degrees</a></td></tr><tr><td>Degree types and jobs available to those who pursue information technology degrees.</td></tr><tr><td><a href="https://collegerecon.com/information-technology-scholarships/">Scholarships for Those Seeking Degrees in Information Technology</a></td></tr><tr><td><a href="https://collegerecon.com/cybersecurity/">Cyber Security Education and Career Guide</a></td></tr><tr><td><a href="https://collegerecon.com/veterans-cyber-security-degrees/">Cyber Security Degrees</a></td></tr><tr><td>Degree types and jobs available to those who pursue cyber security degrees.</td></tr></table></div>`;
					}else{
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/getting-your-masters-degree-in-computer-science/">Master in Computer Science</a></td></tr><tr><td>Degree types, jobs available and salary info for those who pursue a master’s degree in Computer Science.</td></tr><tr><td><a href="https://collegerecon.com/getting-masters-degree-information-technology/">Master in Information Technology</a></td></tr><tr><td>Degree types, jobs available and salary info for those who pursue a master’s degree in Information Technology.</td></tr><tr><td><a href="https://collegerecon.com/computer-science-scholarships/">Computer Science Scholarships</a></td></tr><tr><td><a href="https://collegerecon.com/information-technology-scholarships/">Information Technology Scholarships</a></td></tr><tr><td><a href="https://collegerecon.com/cybersecurity/">Cyber Security Education and Career Guide</a></td></tr><tr><td><a href="https://collegerecon.com/veterans-cyber-security-degrees/">Cyber Security Degrees</a></td></tr><tr><td>Degree types and jobs available to those who pursue cyber security degrees.</td></tr></table></div>`;
					}
				case '10':
					if(bachelors.indexOf(levelId) > -1){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/getting-a-degree-in-education/">https://collegerecon.com/getting-a-degree-in-education/</a></td></tr><tr><td><a href="https://collegerecon.com/education-careers-veterans-military-spouses/">https://collegerecon.com/education-careers-veterans-military-spouses/</a></td></tr><tr><td><a href="https://collegerecon.com/getting-a-degree-in-teaching-english-tesol/">https://collegerecon.com/getting-a-degree-in-teaching-english-tesol/</a></td></tr><tr><td><a href="https://collegerecon.com/certificate-for-teaching-english-to-speakers-of-other-languages-tesol/">https://collegerecon.com/certificate-for-teaching-english-to-speakers-of-other-languages-tesol/</a></td></tr><tr><td><a href="https://collegerecon.com/troops-to-teachers-tips-veterans/">https://collegerecon.com/troops-to-teachers-tips-veterans/</a></td></tr></table></div>`;
					}else{
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/getting-a-degree-in-education/">https://collegerecon.com/getting-a-degree-in-education/</a></td></tr><tr><td><a href="https://collegerecon.com/education-careers-veterans-military-spouses/">https://collegerecon.com/education-careers-veterans-military-spouses/</a></td></tr><tr><td><a href="https://collegerecon.com/getting-a-degree-in-teaching-english-tesol/">https://collegerecon.com/getting-a-degree-in-teaching-english-tesol/</a></td></tr><tr><td><a href="https://collegerecon.com/certificate-for-teaching-english-to-speakers-of-other-languages-tesol/">https://collegerecon.com/certificate-for-teaching-english-to-speakers-of-other-languages-tesol/</a></td></tr></table></div>`;
					}
				case '11':
					if(bachelors.indexOf(levelId) > -1){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/civil-engineering-scholarships/">https://collegerecon.com/civil-engineering-scholarships/</a></td></tr><tr><td><a href="https://collegerecon.com/civil-engineering-degrees-jobs-scholarships/">https://collegerecon.com/civil-engineering-degrees-jobs-scholarships/</a></td></tr><tr><td><a href="https://collegerecon.com/scholarships-industrial-engineer-majors/">https://collegerecon.com/scholarships-industrial-engineer-majors/</a></td></tr><tr><td><a href="https://collegerecon.com/scholarships-for-chemical-engineer-majors/">https://collegerecon.com/scholarships-for-chemical-engineer-majors/</a></td></tr><tr><td><a href="https://collegerecon.com/getting-degree-industrial-engineering/">https://collegerecon.com/getting-degree-industrial-engineering/</a></td></tr><tr><td><a href="https://collegerecon.com/getting-a-degree-in-chemical-engineering/">https://collegerecon.com/getting-a-degree-in-chemical-engineering/</a></td></tr><tr><td><a href="https://collegerecon.com/scholarships-for-mechanical-engineer-majors/">https://collegerecon.com/scholarships-for-mechanical-engineer-majors/</a></td></tr><tr><td><a href="https://collegerecon.com/mechanical-engineering-degree/">https://collegerecon.com/mechanical-engineering-degree/</a></td></tr><tr><td><a href="https://collegerecon.com/electrical-engineering-scholarships/">https://collegerecon.com/electrical-engineering-scholarships/</a></td></tr><tr><td><a href="https://collegerecon.com/electrical-engineering-degrees/">https://collegerecon.com/electrical-engineering-degrees/</a></td></tr></table></div>`;
					}else{
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/masters-degree-chemical-engineering/">https://collegerecon.com/masters-degree-chemical-engineering/</a></td></tr><tr><td><a href="https://collegerecon.com/masters-degree-industrial-engineering/">https://collegerecon.com/masters-degree-industrial-engineering/</a></td></tr><tr><td><a href="https://collegerecon.com/getting-your-masters-degree-in-mechanical-engineering/">https://collegerecon.com/getting-your-masters-degree-in-mechanical-engineering/</a></td></tr><tr><td><a href="https://collegerecon.com/getting-your-masters-degree-in-electrical-engineering/">https://collegerecon.com/getting-your-masters-degree-in-electrical-engineering/</a></td></tr>tr><td><a href="https://collegerecon.com/civil-engineering-scholarships/">https://collegerecon.com/civil-engineering-scholarships/</a></td></tr><tr><td><a href="https://collegerecon.com/scholarships-industrial-engineer-majors/">https://collegerecon.com/scholarships-industrial-engineer-majors/</a></td></tr><tr><td><a href="https://collegerecon.com/scholarships-for-chemical-engineer-majors/">https://collegerecon.com/scholarships-for-chemical-engineer-majors/</a></td></tr><tr><td><a href="https://collegerecon.com/electrical-engineering-scholarships/">https://collegerecon.com/electrical-engineering-scholarships/</a></td></tr></table></div>`;
					}
			}
		}else{
			switch(bucketId) {
				case '8':
					return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td>Veterans Guide to Law School</td></tr><tr><td><a href="https://collegerecon.com/veterans-guide-law-school/">https://collegerecon.com/veterans-guide-law-school/</a></td></tr><tr><td>Criminal Justice Degree Programs</td></tr><tr><td><a href="https://collegerecon.com/criminal-justice-degree-programs/">https://collegerecon.com/criminal-justice-degree-programs/</a></td></tr><tr><td>Criminal Justice Scholarships</td></tr><tr><td><a href="https://collegerecon.com/criminal-justice-scholarships/">https://collegerecon.com/criminal-justice-scholarships/</a></td></tr></table></div>`;
				case '12':
					if(secBucketId == 45){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/great-degrees-for-portable-careers-nursing/">Nursing: Great Degrees for Portable Careers</a></td></tr><tr><td><a href="https://collegerecon.com/nursing-careers-veterans-military-spouses/">Nursing Careers for Veterans and Military Spouses</a></td></tr><tr><td><a href="https://collegerecon.com/how-to-become-nurse-military-spouse/">How to Become a Nurse as a Military Spouse</a></td></tr><tr><td><a href="https://collegerecon.com/health-information-management-careers-for-military-veterans-spouses/">Health Information Management</a></td></tr><tr><td>Info on degrees and jobs for veterans and spouses</td></tr><tr><td><a href="https://collegerecon.com/respiratory-therapy-degree-career/">Respiratory Therapy</a></td></tr><tr><td>Degree and job info</td></tr><tr><td><a href="https://collegerecon.com/radiation-technicians-degree-careers/">Radiation Technicians</a></td></tr><tr><td>Info on degrees and jobs</td></tr></table></div>`;
					}else{
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/online-degree-healthcare-administration/">Online Degrees in Healthcare Administration</a></td></tr><tr><td><a href="https://collegerecon.com/health-information-management-careers-for-military-veterans-spouses/">Health Information Management</a></td></tr><tr><td>Info on degrees and jobs for veterans and spouses</td></tr><tr><td><a href="https://collegerecon.com/public-health-scholarships/">Public Health</a></td></tr><tr><td>Education and career info</td></tr><tr><td><a href="https://collegerecon.com/respiratory-therapy-degree-career/">Respiratory Therapy</a></td></tr><tr><td>Degree and job info</td></tr><tr><td><a href="https://collegerecon.com/radiation-technicians-degree-careers/">Radiation Technicians</a></td></tr><tr><td>Info on degrees and jobs</td></tr><tr><td><a href="https://collegerecon.com/dental-hygiene-degree-options-and-career-opportunities/">Dental Hygiene</a></td></tr><tr><td>Education and career info</td></tr><tr><td><a href="https://collegerecon.com/physical-therapy-degrees-jobs/">Physical Therapy</a></td></tr><tr><td>Info on degrees and jobs</td></tr></table></div>`;
					}
				case '13':
					if(secBucketId == 109){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/getting-degree-social-work/">https://collegerecon.com/getting-degree-social-work/</a></td></tr></table></div>`;
					}else{
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/liberal-arts-studies-degree/">https://collegerecon.com/liberal-arts-studies-degree/</a></td></tr><tr><td><a href="https://collegerecon.com/liberal-arts-colleges-more-money/">https://collegerecon.com/liberal-arts-colleges-more-money/</a></td></tr><tr><td><a href="https://collegerecon.com/getting-a-degree-in-mathematics/">https://collegerecon.com/getting-a-degree-in-mathematics/</a></td></tr></table></div>`;
					}
				case '17':
					return '';
				case '18':
					return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/getting-a-degree-in-psychology/">https://collegerecon.com/getting-a-degree-in-psychology/</a></td></tr><tr><td><a href="https://collegerecon.com/psychology-scholarships/">https://collegerecon.com/psychology-scholarships/</a></td></tr></table></div>`;
				case '19':
					if(emptyTradeArticle.indexOf(secBucketId) > -1){
						return '';
					}else if(secBucketId == 79){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/top-colleges-veterans-aeronautics-aviation-degrees/">Aeronautics & Aviation: Top Colleges for Veterans</a></td></tr><tr><td><a href="https://collegerecon.com/aeronautics-aviation-degree/">Aeronautics or Aviation Degrees</a></td></tr><tr><td><a href="https://collegerecon.com/civilian-jobs-military-aviation/">Civilian Jobs After Serving In The Military in Aviation</a></td></tr></table></div>`;
					}else if(secBucketId == 77){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/degrees-construction-management/">Construction Management</a></td></tr></table></div>`;
					}else if(secBucketId == 28 || secBucketId == 31 || secBucketId == 57){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/gi-bill-approved-culinary-schools/">Culinary Arts & Food Services</a></td></tr></table></div>`;
					}else if(secBucketId == 163){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/dental-hygiene-degree-options-and-career-opportunities/"Dental Hygiene</a></td></tr></table></div>`;
					}else if(secBucketId == 76){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/electricians-high-demand-veterans/">Electricians</a></td></tr></table></div>`;
					}else if(secBucketId == 170){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/medical-imaging-degree-military-veterans/">Medical Imaging Programs</a></td></tr></table></div>`;
					}else if(secBucketId == 75){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/paramedic-emt-degrees-jobs/">Paramedics and EMT’s</a></td></tr></table></div>`;
					}else if(secBucketId == 172){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/become-massage-therapist-gi-bill/">Using Your GI Bill to Become a Massage Therapist</a></td></tr></table></div>`;
					}else if(secBucketId == 164){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/medical-assistant-certificate-degree-careers/">Becoming a Medical Assistant</a></td></tr></table></div>`;
					}else if(secBucketId == 162){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/medical-assistant-certificate-degree-careers/">Becoming a Medical Assistant</a></td></tr><tr><td><a href="https://collegerecon.com/become-physician-assistant/">Becoming a Physician Assistant</a></td></tr></table></div>`;
					}else if(secBucketId == 167){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/exercise-science-degree-military-veterans/">Exercise Science Programs</a></td></tr><tr><td><a href="https://collegerecon.com/less-school-more-pay-career-physical-therapy/">Physical Therapy</a></td></tr><tr><td><a href="https://collegerecon.com/non-medical-patient-care-careers/">Non-Medical Patient Care Careers</a></td></tr></table></div>`;
					}else if(secBucketId == 165){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/pharmacy-technician-degrees-jobs-military-veterans/">Pharmacy Technician Programs</a></td></tr></table></div>`;
					}else if(secBucketId == 73){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/hot-prospects-for-hvac-technicians/">HVAC Technicians</a></td></tr><tr><td><a href="https://collegerecon.com/welding-career-military-veterans/">Welding</a></td></tr><tr><td><a href="https://collegerecon.com/electricians-high-demand-veterans/">Electricians</a></td></tr></table></div>`;
					}else if(secBucketId == 166){
						return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody><tr><td><a href="https://collegerecon.com/how-to-become-a-veterinarian/">Becoming a Veterinarian</a></td></tr><tr><td><a href="https://collegerecon.com/veterinary-degree-programs/">Veterinary Degree Programs</a></td></tr></table></div>`;
					}
				default:
					return `<div style="padding-top: 1rem;padding-bottom: 30px;"><h3 style="padding-top: 10px;margin: 0px;">Articles For You</h3><table class="criteria-dlinks" ><tbody>
					<tr><td><a href="https://collegerecon.com/top-colleges-veterans-aeronautics-aviation-degrees/">Aeronautics & Aviation: Top Colleges for Veterans</a></td></tr>
					<tr><td><a href="https://collegerecon.com/aeronautics-aviation-degree/">Aeronautics or Aviation</a></td></tr>
					<tr><td><a href="https://collegerecon.com/degrees-construction-management/">Construction Management</a></td></tr>
					<tr><td><a href="https://collegerecon.com/gi-bill-approved-culinary-schools/">Culinary Arts Schools</a></td></tr>
					<tr><td><a href="https://collegerecon.com/dental-hygiene-degree-options-and-career-opportunities/">Dental Hygiene</a></td></tr>
					<tr><td><a href="https://l28yrhk9.r.us-west-2.awstrack.me/L0/https:%2F%2Fcollegerecon.com%2Felectricians-high-demand-veterans%2F/1/010101863c94043e-2e2e66f3-61f0-4eb2-b22a-863cc216ad5e-000000/yo8yPP5mI_fxNt1kw5aLME1Qon0=309">Electricians</a></td></tr>
					<tr><td><a href="https://collegerecon.com/exercise-science-degree-military-veterans/">Exercise Science Programs</a></td></tr>
					<tr><td><a href="https://l28yrhk9.r.us-west-2.awstrack.me/L0/https:%2F%2Fcollegerecon.com%2Fhospitality-degrees-portable-career%2F/1/010101863c94043e-2e2e66f3-61f0-4eb2-b22a-863cc216ad5e-000000/rO2TorUAQ43W0HyYmD8SfBwoGTk=309">Hospitality</a></td></tr>
					<tr><td><a href="https://collegerecon.com/hot-prospects-for-hvac-technicians/">HVAC Technicians</a></td></tr>
					<tr><td><a href="https://collegerecon.com/become-massage-therapist-gi-bill/">Massage Therapy</a></td></tr>
					<tr><td><a href="https://collegerecon.com/medical-assistant-certificate-degree-careers/">Medical Assistant</a></td></tr>
					<tr><td><a href="https://collegerecon.com/medical-imaging-degree-military-veterans/">Medical Imaging Programs</a></td></tr>
					<tr><td><a href="https://collegerecon.com/non-medical-patient-care-careers/">Non-Medical Patient Care Careers</a></td></tr>
					<tr><td><a href="https://l28yrhk9.r.us-west-2.awstrack.me/L0/https:%2F%2Fcollegerecon.com%2Fcareer-associates-degree-occupational-therapy%2F/1/010101863c94043e-2e2e66f3-61f0-4eb2-b22a-863cc216ad5e-000000/geDo3rJK_WJUurb2bhkpv4qxWgM=309">Occupational Therapy</a></td></tr>
					<tr><td><a href="https://collegerecon.com/paramedic-emt-degrees-jobs/">Paramedics and EMT’s</a></td></tr>
					<tr><td><a href="https://collegerecon.com/less-school-more-pay-career-physical-therapy/">Physical Therapy</a></td></tr>
					<tr><td><a href="https://collegerecon.com/become-physician-assistant/">Physician Assistant</a></td></tr>
					<tr><td><a href="https://collegerecon.com/radiation-technicians-degree-careers/">Radiation Technician</a></td></tr>
					<tr><td><a href="https://collegerecon.com/veterinary-degree-programs/">Veterinary Degree Programs</a></td></tr>
					<tr><td><a href="https://collegerecon.com/welding-career-military-veterans/">Welding</a></td></tr></table></div>`;	
			}
		}
	}

	function getMajorId(bucketId, aof, studentId, type) {
		let mainList = [];
		let list = {};
		
		return new Promise (async function (resolve,reject) {
			await checkMajorDataList(bucketId,aof).then(async function (response) {
				for(let i = 0 ; i<response.length;i++) {
					list = {
						title: response[i].title,
						description: response[i].description,
						college_details: []
					}
					let subQuery = "";
					if(type == 'register'){
						subQuery = `SELECT DISTINCT(c.id),c.college_name, c.college_alias, c.seo_name FROM college_majors_new cm LEFT JOIN colleges c ON c.id = cm.cr_id WHERE cm.major_id = '${response[i].major_id}' AND c.access_level = "Patriot" AND c.status = "ACTIVE"`;
					}else{
						subQuery = `SELECT DISTINCT(c.id),c.college_name, c.college_alias, c.seo_name FROM college_majors_new cm LEFT JOIN colleges c ON c.id = cm.cr_id LEFT JOIN cadence_degree_bounce_list as cdl ON c.id=cdl.college_id WHERE cm.major_id = '${response[i].major_id}' AND c.access_level = "Patriot" AND c.status = "ACTIVE" AND cdl.student_id='${studentId}' AND cdl.rule_status='active'`;
					}
					await mysqlService.query(subQuery)
					.then(function (tdresponse) {
						list['college_details'].push(bounceBackEmailGetBucketInfoModel(tdresponse));
						mainList.push(list);
						if(i == response.length - 1) {
							resolve(mainList);
						}
					}, function (err) {
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					})
				}
			},function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			})
		})
	}

	async function checkMajorDataList(bucketId, aof){
		return new Promise(async function (resolve, reject) {
			searchQuery = `SELECT bsd.major_id, mn.title, mn.description FROM bucket_secondary_degree_list bsd LEFT JOIN majors_new mn ON bsd.major_id = mn.id WHERE bsd.bucket_primary_degree_id = ${bucketId} AND bsd.bucket_secondary_degree_id IN (${aof})`;
			//console.log("FF:",searchQuery)
			await mysqlService.query(searchQuery)
			.then(async function (response) {
				if(response.length == 0){
					searchQry = `SELECT bsd.major_id, mn.title, mn.description FROM bucket_secondary_degree_list bsd LEFT JOIN majors_new mn ON bsd.major_id = mn.id WHERE bsd.bucket_primary_degree_id = ${bucketId}`;
					//console.log("SS:",searchQry)
					await mysqlService.query(searchQry)
					.then(async function (cresponse) {
						resolve(cresponse);
					},function (err) {
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					})
				}else{
					resolve(response);
				}
			},function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			})
		});
	}

	function insertDegreeBounceEmailData(sid,cid){
		return new Promise(async function (resolve, reject) {
			let insertData = {
				"student_id": sid,
				"college_id": cid,
				"rule_id": 1,
				"rule_status": "active",
				"date_created": moment(new Date()).format('YYYY-MM-DD')
			}
			await mysqlService.query("INSERT INTO cadence_degree_bounce_list SET ?", insertData)
			.then(function (response) {
				resolve("success");
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}

	function getBucketWithoutCollege(majorId) {
		let query = `SELECT title, description FROM majors_new WHERE id = '${majorId}'`;
		return new Promise(function (resolve, reject) {
			mysqlService.query(query)
			.then(function (response) {
				resolve(response);
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}

	function getCollegeUserInfo(collegeuserid) {
		return new Promise(function (resolve, reject) {
			let selectQuery = 'SELECT college_user_email,college_user_password  FROM `college_users`  WHERE uuid = "' + collegeuserid + '"';
			mysqlService.query(selectQuery)
			.then(function (response) {
				resolve(response);
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}

	function getNewsFeed() {
		return new Promise(function (resolve, reject) {
			mysqlService.query(collegeConstants.GET_ALL_COLLEGE_NEWSFEED_QUERY)
				.then(function (response) {
					resolve(newsfeedModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function recordCollegeLogin(id) {
		const nowdate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
		return mysqlService.query(
      `UPDATE colleges SET last_login = '${nowdate}' WHERE id = '${id}'`
    );
	}

	function recordStudentLogin(uuid) {
		const nowdate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
		return mysqlService.query(
      `"UPDATE students SET last_login = '${nowdate}' WHERE uuid ='${uuid}'`
    );
	}

	function getRegisterMatchCollege(filters) {
		return new Promise(function (resolve, reject) {
			var searchQuery = "";
			if (filters.state == "Online") {
				searchQuery = searchConstant.GET_ALL_ONLINE_COLLEGE_SEARCH_QUERY;
			} else {
				searchQuery = searchConstant.GET_ALL_COLLEGE_SEARCH_QUERY;
			}
			// console.log("search query:",searchQuery);
			//Get sourrounding state
			let sourroundQuery = 'Select sourrounding_statevalue from state_sourrounding where state_value ="' + filters.state + '"';
			mysqlService.query(sourroundQuery)
				.then(function (sresponse) {
					if (sresponse.length > 0 && sresponse[0]['sourrounding_statevalue'] != "") {
						sourround_state = filters.state + "," + sresponse[0]['sourrounding_statevalue'];
						near_state = sresponse[0]['sourrounding_statevalue'];
					} else {
						sourround_state = filters.state;
						near_state = "";
					}
					let educationGoal = getAcademicLevel(filters.education_goal);
					var area_focus_ids = "";
					if (filters.area_focus_ids) {
						let checkTouro = false;
						//let selectQuery = "select major_id from bucket_secondary_degree_list where bucket_secondary_degree_id in (" + filters.area_focus_ids + ")";
						let selectQuery = "select major_id from bucket_secondary_degree_list where bucket_primary_degree_id in (" + filters.bucket_id + ")";
						mysqlService.query(selectQuery)
							.then(function (response) {
								//resolve(response);
								if (response.length > 0) {
									var ids = "";
									for (i = 0; i < response.length; i++) {
										ids += response[i].major_id + ",";
									}
									ids = ids.slice(0, -1);
									//queryFilters=registerqueryBuilder(filters,ids);
									//subquery = searchQuery+queryFilters;
									subquery = buildOnlinequeryBuilder(searchQuery, filters, ids, sourround_state, near_state);
									
									//console.log("SUB", subquery);
									//	console.log("QQ:",subquery);
									allquery = "select a.*,(select group_concat(DISTINCT(major_id)) from college_majors_new where major_id in (" + ids + ") and cr_id=a.collegeId and aw_level in (" + educationGoal + ")) as majorCount  FROM (" + subquery + ") as a";
									
									// console.log("Q:",allquery);
									mysqlService.query(allquery)
										.then(function (response1) {
											getSecondaryBucketMajorLists(filters).then(function (response2) {
												resolve(registerCollegeListModel(response1, filters.state, sourround_state, filters.military_status,response2));
											}, function (err) {
												if (err) {
												var error = err;
												error.status = 503;
												return reject(error)
												};
											})
										}, function (err) {
											if (err) {
												var error = err;
												error.status = 503;
												return reject(error)
											};
										}); 
								} else {
									resolve("empty");
								}

							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return reject(error)
								};
							});
					} else {
						area_focus_ids = filters.area_focus_ids;
						//queryFilters=registerqueryBuilder(filters,area_focus_ids);
						//subquery = searchQuery+queryFilters;
						subquery = buildOnlinequeryBuilder(searchQuery, filters, area_focus_ids, sourround_state, near_state);
						//console.log("SB:",subquery);
						allquery = "select a.*,(select count(*) as ctn from college_majors_new where major_id in (" + area_focus_ids + ") and cr_id=a.collegeId and aw_level in (" + educationGoal + ")) as majorCount  FROM (" + subquery + ") as a";
						// console.log("Q:",allquery);
						mysqlService.query(allquery)
							.then(function (response) {
								//resolve(response);
								resolve(registerCollegeListModel(response, filters.state, sourround_state, filters.military_status,""));
							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return reject(error)
								};
							});
					}
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});

		});
	}

	function getSecondaryBucketMajorLists(filters){
		return new Promise(function (resolve, reject) {
			let educationGoal = getAcademicLevel(filters.education_goal);
			let selectQuery = "select group_concat(DISTINCT(cmn.major_id)) as major_id from bucket_secondary_degree_list as bsd left join college_majors_new as cmn on bsd.major_id=cmn.major_id where bsd.bucket_secondary_degree_id in (" + filters.area_focus_ids + ") and cmn.aw_level in (" + educationGoal + ")";
			mysqlService.query(selectQuery)
				.then(function (response) {
					var majorsIds = "";
					if (response.length > 0) {
						majorsIds = response[0].major_id;
					}
					resolve(majorsIds);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		})
	}

	function getAcademicLevel(levelId){
		let educationGoal = "";
		if(searchConstant.AppEducationalLevel.indexOf(levelId) > -1){
			educationGoal = levelId;
		}else{
			educationGoal = "6,8,18";
		}
		return educationGoal;
	}

	function buildOnlinequeryBuilder(searchQuery, filters, area_focus_ids, sourround_state, near_state) {
		tradQuery = registerqueryBuilder(filters, area_focus_ids);
		onlineQuery = registerOnlinequeryBuilder(filters, area_focus_ids, sourround_state);
		degreeOnlineQuery = registerDegreeOnlinequeryBuilder(filters, area_focus_ids, sourround_state);
		orderQuery = registerOrderqueryBuilder(filters, area_focus_ids, sourround_state);
		staticQuery = registerStaticqueryBuilder(filters, near_state, area_focus_ids);
		degreeSpecificOnlineQuery = degreeSpecificOnlineQueryBuilder(filters, 'online');
		degreeSpecificStateQuery = degreeSpecificOnlineQueryBuilder(filters, 'state');
		staticCollegeQuery = " and c.id in (select college_id from college_actions where action='static')";
		
		if (filters.state == "Online") {
			//queryFilters = searchQuery+onlineQuery;
			queryFilters = searchQuery + onlineQuery + " UNION " + degreeSpecificOnlineQuery + " UNION " + searchQuery + degreeOnlineQuery + (sourceTrackingConstant.COLLEGE_MATCHING_LIST ? " UNION " + '(' + searchQuery + staticCollegeQuery + ')' : '');
		} else {
			//queryFilters = searchQuery+orderQuery +" UNION "+ searchQuery+tradQuery +" UNION "+ searchQuery+onlineQuery;
			if (near_state) {
				queryFilters = searchQuery + orderQuery + " UNION " + searchQuery + tradQuery + " UNION " + searchQuery + onlineQuery + " UNION " + searchQuery + degreeOnlineQuery + " UNION " + searchQuery + staticQuery + " UNION " + degreeSpecificOnlineQuery + " UNION " + degreeSpecificStateQuery + (sourceTrackingConstant.COLLEGE_MATCHING_LIST ? " UNION " + '(' + searchQuery + staticCollegeQuery + ')' : '');
			} else {
				queryFilters = searchQuery + orderQuery + " UNION " + searchQuery + tradQuery + " UNION " + searchQuery + onlineQuery + " UNION " + searchQuery + degreeOnlineQuery  + " UNION " + degreeSpecificOnlineQuery + " UNION " + degreeSpecificStateQuery + (sourceTrackingConstant.COLLEGE_MATCHING_LIST ? " UNION " + '(' + searchQuery + staticCollegeQuery + ')' : '');
			}
		}
		// console.log("DD:",queryFilters);
		/*if(filters.pageNumber != 0){
			queryFilters += " ORDER BY display_order DESC, collegeId ASC";
		}else{
			queryFilters += " ORDER BY display_order DESC";
		}*/
		return queryFilters;
	}

	function registerStaticqueryBuilder(filters, near_state, area_focus_ids) {
		let educationGoal = getAcademicLevel(filters.education_goal);
		var queryFilters = '';
		if(near_state){
			queryFilters += " and c.id in (select id from colleges where access_level='Patriot' and state in (" + stringUtil.joinStringByComma(near_state.split(",")) + "))";
		}
		queryFilters += " and c.id in (select cr_id from college_majors_new where major_id in (" + area_focus_ids + ") and aw_level in (" + educationGoal + "))";
		return queryFilters;
	}

	function registerOrderqueryBuilder(filters, area_focus_ids, sourround_state) {
		let educationGoal = getAcademicLevel(filters.education_goal);
		var queryFilters = '';
		//filter by years offered
		//queryFilters +=" and years_offered  = '"+filters.college_type+"'";
		if (filters.college_id != 0) {
			queryFilters += " and c.id not in (" + filters.college_id + ")";
		}

		/** For And Query */
		//queryFilters += " and tc.college_type='state' and tc.state_name in (" + stringUtil.joinStringByComma(sourround_state.split(",")) + ")";
		queryFilters += " and tc.college_type='state' and tc.state_name in ('" + filters.state + "')";
		queryFilters += " and c.id in (select cr_id from college_majors_new where major_id in (" + area_focus_ids + ") and aw_level in (" + educationGoal + "))";
		if (filters.website == "app") {
			//queryFilters += " and (include_app_state like '%" + filters.state + "%' or include_app_state is null)";
			queryFilters += " and (include_app_state like '%" + filters.state + "%')";
		} else if (filters.website == "legion") {
			//queryFilters += " and (include_legion_state like '%" + filters.state + "%'  or include_legion_state is null)";
			queryFilters += " and (include_legion_state like '%" + filters.state + "%')";
		} else if (filters.website == "military") {
			//queryFilters += " and (include_military_state like '%" + filters.state + "%'  or include_military_state is null)";
			queryFilters += " and (include_military_state like '%" + filters.state + "%')";
		}
		//queryFilters += " and CASE WHEN c.college_type='online' THEN c.search_online_display='yes' ELSE 1=1 END ";
		return queryFilters;
	}

	function registerOnlinequeryBuilder(filters, area_focus_ids, sourround_state) {
		var queryFilters = '';
		let checkTouro = false;
		//filter by years offered
		//queryFilters +=" and years_offered  = '"+filters.college_type+"'";
		if (filters.college_id != 0) {
			queryFilters += " and c.id not in (" + filters.college_id + ")";
		}

		/** For And Query */
		if (filters.state == "Online") {
			queryFilters += " and c.college_type ='online' and c.search_online_display='yes' ";
		} else {
			queryFilters += " and c.college_type ='online' and c.search_online_display='yes' ";
			/*let sdata = sourround_state.split(",");
			let stringState = "";
			let stState = "";
			if (sdata.length > 1) {
				for (i = 0; i < sdata.length; i++) {
					stState += "%" + sdata[i] + "%,";
				}
				stringState = stState.slice(0, -1);
			} else {
				stringState += "%" + sourround_state + "%";
			}*/

			if (filters.website == "app") {
				//queryFilters += " and (include_app_state like '%" + filters.state + "%' or include_app_state is null)";
				queryFilters += " and (include_app_state like '%" + filters.state + "%')";
			} else if (filters.website == "legion") {
				//queryFilters += " and (include_legion_state like '%" + filters.state + "'  or include_legion_state is null)";
				queryFilters += " and (include_legion_state like '%" + filters.state + "')";
			} else if (filters.website == "military") {
				//queryFilters += " and (include_military_state like '%" + filters.state + "'  or include_military_state is null)";
				queryFilters += " and (include_military_state like '%" + filters.state + "')";
			}
		}
		return queryFilters;
		//queryFilters +=" and c.id in (select cr_id from college_majors_new where major_id in ("+area_focus_ids+"))";

	}

	function registerDegreeOnlinequeryBuilder(filters, area_focus_ids, sourround_state) {
		let educationGoal = getAcademicLevel(filters.education_goal);
		var queryFilters = '';
		let checkTouro = false;
		//filter by years offered
		//queryFilters +=" and years_offered  = '"+filters.college_type+"'";
		if (filters.college_id != 0) {
			queryFilters += " and c.id not in (" + filters.college_id + ")";
		}

		/** For And Query */
		if (filters.state == "Online") {
			queryFilters += " and c.college_type ='online' and c.search_online_display='no' ";
			queryFilters += " and c.id in (select cr_id from college_majors_new where major_id in (" + area_focus_ids + ") and aw_level in (" + educationGoal + "))";
		} else {
			queryFilters += " and c.college_type ='online' and c.search_online_display='no' ";
			/*let sdata = sourround_state.split(",");
			let stringState = "";
			let stState = "";
			if (sdata.length > 1) {
				for (i = 0; i < sdata.length; i++) {
					stState += "%" + sdata[i] + "%,";
				}
				stringState = stState.slice(0, -1);
			} else {
				stringState += "%" + sourround_state + "%";
			}*/

			if (filters.website == "app") {
				//queryFilters += " and (include_app_state like '%" + filters.state + "%' or include_app_state is null)";
				queryFilters += " and (include_app_state like '%" + filters.state + "%')";
			} else if (filters.website == "legion") {
				//queryFilters += " and (include_legion_state like '%" + filters.state + "'  or include_legion_state is null)";
				queryFilters += " and (include_legion_state like '%" + filters.state + "')";
			} else if (filters.website == "military") {
				//queryFilters += " and (include_military_state like '%" + filters.state + "'  or include_military_state is null)";
				queryFilters += " and (include_military_state like '%" + filters.state + "')";
			}
			queryFilters += " and c.id in (select cr_id from college_majors_new where major_id in (" + area_focus_ids + ") and aw_level in (" + educationGoal + "))";
		}
		return queryFilters;
		//queryFilters +=" and c.id in (select cr_id from college_majors_new where major_id in ("+area_focus_ids+"))";

	}

	function registerqueryBuilder(filters, area_focus_ids) {
		let educationGoal = getAcademicLevel(filters.education_goal);
		var queryFilters = '';
		//filter by years offered
		//queryFilters +=" and years_offered  = '"+filters.college_type+"'";
		if (filters.college_id != 0) {
			//queryFilters +=" and c.id not in (1913,3449,"+filters.college_id+")";
			queryFilters += " and c.id not in (" + filters.college_id + ")";
		}
		/** For Or Query */
		//queryFilters +=" and (state in ("+stringUtil.joinStringByComma(filters.study_state_values.split(","))+")";
		//queryFilters +=" or c.id in (select cr_id from college_majors_new where major_id in ("+filters.area_focus_ids+")))";

		/** For And Query */
		//queryFilters += " and state in (" + stringUtil.joinStringByComma(sourround_state.split(",")) + ")";
		queryFilters += " and state in ('" + filters.state + "')";
		queryFilters += " and c.college_type ='traditional'";
		queryFilters += " and c.id in (select cr_id from college_majors_new where major_id in (" + area_focus_ids + ") and aw_level in (" + educationGoal + "))";

		// order by
		/*if(filters.pageNumber != 0){
			queryFilters += " ORDER BY tc.display_order DESC, collegeId ASC";
		}else{
			queryFilters += " ORDER BY tc.display_order DESC";
		}*/

		// for paging
		//if(filters.pageNumber && filters.pageNumber != 0)
		//{
		if (filters.pageNumber == 0) {
			//queryFilters +=" limit 0,3";
		} else {
			//var count = 3;
			//var lowerlimit = filters.pageNumber*count;
			//queryFilters +=" limit "+lowerlimit+","+count;
		}
		//}
		return queryFilters;
	}

	function degreeSpecificOnlineQueryBuilder(filters, type) {
		let educationGoal = getAcademicLevel(filters.education_goal);
		queryFilters = `Select c.id as collegeId,c.contact_email,c.college_type,HTML_UnEncode(sc.new_college_name)as college_name,college_alias,seo_name,address,city, state, postal_code, phone_number,website,convert(cast(convert(overview using latin1) as binary) using utf8) as overview, college_logo,college_photo,access_level,cp.full_time_vet_counselors,cp.principles_of_excellence,cp.awards_ace_credit,cp.yellow_ribbon,cp.approved_ta_funding,cp.reduced_tuition,cp.public_private,cp.in_state_tuition,cp.out_state_tuition,tc.display_order,1 as isSpecificDegree,c.specific_profile_id,sc.college_id as parentCollegeId FROM colleges c LEFT JOIN college_profiles cp on c.id=cp.college_id LEFT JOIN default_colleges as tc on c.id=tc.college_id LEFT JOIN college_degree_specific_info as sc ON c.id=sc.college_info_id where c.status='ACTIVE' AND sc.degree_status IN ('active','partner') AND sc.program_matcher_only='no' AND sc.degree_rule = '${ type }'`;

		if((filters.education_goal) || (filters.bucket_id) || (filters.area_focus_ids)) {
			if(filters.education_goal && filters.education_goal.length > 0) {
				if(educationGoal.indexOf(",") > -1){
					queryFilters += ` and `;
					for(let i=0;i<educationGoal.split(',').length;i++){
						if(i == 0){
							queryFilters += ` (find_in_set('${educationGoal.split(',')[i]}',sc.level_id)`;
						}else if(i<= educationGoal.split(',').length - 2){
							queryFilters += ` or find_in_set('${educationGoal.split(',')[i]}',sc.level_id)`;
						}else{
							queryFilters += ` or find_in_set('${educationGoal.split(',')[i]}',sc.level_id))`;
						}
					}
				}else{
					queryFilters += ` and FIND_IN_SET(sc.level_id, '${filters.education_goal}') `
				}
			}

			if(filters.bucket_id && filters.bucket_id.length > 0) {
				queryFilters += ` and FIND_IN_SET(sc.bucket_id, '${filters.bucket_id}') `
			}

			if(filters.area_focus_ids && filters.area_focus_ids.length > 0) {
				if(filters.area_focus_ids.split(',').length == 1 ){
					queryFilters += ` and find_in_set('${filters.area_focus_ids.split(',')[0]}',sc.sec_bucket_id)`;
				}else if(filters.area_focus_ids.split(',').length == 2){
					queryFilters += ` and `;
					for(let i=0;i<filters.area_focus_ids.split(',').length;i++){
						if(i == 0){
							queryFilters += ` (find_in_set('${filters.area_focus_ids.split(',')[i]}',sc.sec_bucket_id)`;
						}else{
							queryFilters += ` or find_in_set('${filters.area_focus_ids.split(',')[i]}',sc.sec_bucket_id))`;
						}
					}
				}else{
					queryFilters += ` and `;
					for(let i=0;i<filters.area_focus_ids.split(',').length;i++){
						if(i == 0){
							queryFilters += ` (find_in_set('${filters.area_focus_ids.split(',')[i]}',sc.sec_bucket_id)`;
						}else if(i<= filters.area_focus_ids.split(',').length - 2){
							queryFilters += ` or find_in_set('${filters.area_focus_ids.split(',')[i]}',sc.sec_bucket_id)`;
						}else{
							queryFilters += ` or find_in_set('${filters.area_focus_ids.split(',')[i]}',sc.sec_bucket_id))`;
						}
					}
				}
			}
		}
		return queryFilters;
	}

	function getRegisterMatchEmailData(filters) {
		return new Promise(function (resolve, reject) {
			var searchQuery = searchConstant.GET_ALL_ONLINE_COLLEGE_SEARCH_QUERY_WITH_SPECIFIC;
			queryFilters = registeremailqueryBuilder(filters);
			subquery = searchQuery + queryFilters;

			mysqlService.query(subquery)
				.then(function (response) {
					resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function registeremailqueryBuilder(filters) {
		var queryFilters = '';
		//filter by years offered
		//queryFilters +=" and years_offered  = '"+filters.college_type+"'";
		if (filters.checkedCollegeInfo != "") {
			queryFilters += " and c.id in (" + filters.checkedCollegeInfo + ")";
		}

		/** For And Query */
		//queryFilters +=" and state ='"+filters.state+"'";
		//queryFilters +=" and c.id in (select cr_id from college_majors_new where major_id in ("+filters.area_focus_ids+"))";
		//queryFilters += " ORDER BY tc.display_order DESC";
		return queryFilters;
	}

	function getCollegeBasicInfo(collegeid) {
		return new Promise(function (resolve, reject) {

			let selectQuery = 'SELECT id,college_name,contact_email,city,state,access_level  FROM `colleges`  WHERE id IN (' + collegeid + ')';
			mysqlService.query(selectQuery)
				.then(function (response) {
					resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getStaticCollegeList(collegeid) {
		return new Promise(function (resolve, reject) {

			let selectQuery = collegeConstants.GET_STATIC_COLLEGE_DATA + ' and c.id IN (' + collegeid + ')';
			mysqlService.query(selectQuery)
				.then(function (response) {
					resolve(collegeModel(response, null));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getNagEmailSubscriptionData(stuData) {
		return new Promise(function (resolve, reject) {
			let updateQuery = "UPDATE students SET nag_email_subscription = '" + stuData.subscription + "',unsubscription_reason = '" + stuData.reason + "' WHERE uuid ='" + stuData.studentId + "'";
			mysqlService.query(updateQuery)
				.then(function (response) {
					resolve(unsubscribeNagEmail(stuData));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	async function unsubscribeNagEmail(udata){
		let checkQuery = "select count(id) as total from student_unsubscribe where student_id='" + udata.studentId + "' and unsubscribe_type='nag_email'";
		let checkResult = await executeCollegeQuery(checkQuery);
		let qry = "";
		if(checkResult[0].total == 0){
			qry = "INSERT INTO `student_unsubscribe` (student_id,unsubscribe_type,reason) values ('"+udata.studentId+"','nag_email','"+udata.reason+"')";
		}else{
			qry = "UPDATE `student_unsubscribe` SET  reason = '"+udata.reason+"' WHERE student_id='"+udata.studentId+"'";
		}
		return await executeCollegeQuery(qry);
	}

	function getCollegeMetadata(collegeId) {
		return new Promise(function (resolve, reject) {
			let selectQuery = "SELECT * FROM college_metadata WHERE college_id = " + collegeId;
			mysqlService.query(selectQuery)
				.then(function (response) {
					resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function checkCollegeExist(collegeId) {
		return new Promise(function (resolve, reject) {
			let selQuery = "select college_name from colleges where status='active' and id=" + collegeId;
			//console.log("QQ:",selQuery);
			mysqlService.query(selQuery)
				.then(function (response) {
					if (response.length > 0 && response[0].college_name) {
						resolve(response[0].college_name);
					} else {
						resolve("fail");
					}
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	//Here the email template is called to send the data for the email
	async function sendBackEmailToNewUser(emailData) {
		return new Promise(async (resolve, reject) => {
			try {
				const adData = await getBounceBackAdvertise(emailData[3]);
				const emailTemplate = await sendNewUserBounceBackEmail(adData, emailData);
				//console.log("EM:",emailData[1]+"-"+emailTemplate);
				const from = "CollegeRecon <"+emailConstant.INFORMATION_EMAIL+">";
				const to = [emailData[0]];
				const subject = emailData[1]+", here are your matched schools from CollegeRecon.";
				const messageContent = messageEmail.basicReplyEmailTemplate(emailTemplate);
				await emailService.sendEmail(from,to,subject,messageContent);
				return resolve("success");
			} catch (error) {
				error.status = 503;
				return reject(error);
			}
		});
	}

	function sendBackEmailToSpecificNewUser(bucketData) {
		return new Promise(async (resolve, reject) => {
			try {
				const adData = await getBounceBackAdvertise(bucketData[0]);
				const emailTemplate = sendNewUserBounceBackEmail(adData, bucketData);
				const from = "CollegeRecon <"+emailConstant.INFORMATION_EMAIL+">";
				const to = [bucketData[0]];
				const subject = bucketData[1]+", here are your matched schools from CollegeRecon.";
				const messageContent = messageEmail.basicReplyEmailTemplate(emailTemplate);
				await emailService.sendEmail(from,to,subject,messageContent);
				return resolve("success");
			} catch (error) {
				error.status = 503;
				return reject(error);
			}
		});
	}

	function getBounceBackAdvertise(stateName) {
		return new Promise( function(resolve, reject) {
			let checkedQuery = 	`SELECT c.id,HTML_UnEncode(c.college_name)as college_name,college_alias,seo_name,c.access_level,c.contact_email,convert(cast(convert(cp.overview using latin1) as binary) using utf8) as overviewtext,convert(cast(convert(cp.display_text using latin1) as binary) using utf8) as overview, cp.college_logo, bc.checked_college,cspec.degree_desc FROM bounce_colleges bc LEFT JOIN colleges c ON bc.college_id = c.id LEFT JOIN college_profiles cp ON bc.college_id = cp.college_id LEFT JOIN college_degree_specific_info as cspec ON c.specific_profile_id=cspec.id WHERE bc.college_type = 'national' AND bc.checked_college = 'true' ORDER BY bc.display_order LIMIT 6`;
			mysqlService.query(checkedQuery)
			.then(function(cresponse) {
				if(cresponse.length > 0) {
					if(cresponse.length == 6) {
						resolve(bounceEmailAdvertiseOrderModel(cresponse));
					} else{
						let stateQuery = `SELECT c.id,HTML_UnEncode(c.college_name)as college_name,college_alias,seo_name,c.access_level,c.contact_email,convert(cast(convert(cp.overview using latin1) as binary) using utf8) as overviewtext,convert(cast(convert(cp.display_text using latin1) as binary) using utf8) as overview, cp.college_logo, bc.checked_college,cspec.degree_desc FROM bounce_colleges bc LEFT JOIN colleges c ON bc.college_id = c.id LEFT JOIN college_profiles cp ON bc.college_id = cp.college_id LEFT JOIN college_degree_specific_info as cspec ON c.specific_profile_id=cspec.id WHERE bc.college_type = 'state' AND state_name IN ('${stateName}') ORDER BY bc.display_order LIMIT ${6-cresponse.length}`;
						mysqlService.query(stateQuery)
						.then(function (sresponse) {
							switch(sresponse.length) {
							case 0:
								let nationalQuery = `SELECT c.id,HTML_UnEncode(c.college_name)as college_name,college_alias,seo_name,c.access_level,c.contact_email,convert(cast(convert(cp.overview using latin1) as binary) using utf8) as overviewtext,convert(cast(convert(cp.display_text using latin1) as binary) using utf8) as overview, cp.college_logo, bc.checked_college,cspec.degree_desc FROM bounce_colleges bc LEFT JOIN colleges c ON bc.college_id = c.id LEFT JOIN college_profiles cp ON bc.college_id = cp.college_id LEFT JOIN college_degree_specific_info as cspec ON c.specific_profile_id=cspec.id WHERE bc.college_type = 'national' AND bc.checked_college='false' ORDER BY bc.display_order LIMIT ${6-cresponse.length}`;
								mysqlService.query(nationalQuery)
								.then(function (nresponse) {
									switch(nresponse.length) {
										case 0:
											resolve(bounceEmailAdvertiseOrderModel(cresponse));
											break;
										case 1:
											cresponse.push(nresponse[0]);
											resolve(bounceEmailAdvertiseOrderModel(cresponse));
											break;
										case 2:
											cresponse.push(nresponse[0]);
											cresponse.push(nresponse[1]);
											resolve(bounceEmailAdvertiseOrderModel(cresponse));
											break;
										case 3:
											cresponse.push(nresponse[0]);
											cresponse.push(nresponse[1]);
											cresponse.push(nresponse[2]);
											resolve(bounceEmailAdvertiseOrderModel(cresponse));
											break;
										case 4:
											cresponse.push(nresponse[0]);
											cresponse.push(nresponse[1]);
											cresponse.push(nresponse[2]);
											cresponse.push(nresponse[3]);
											resolve(bounceEmailAdvertiseOrderModel(cresponse));
											break;
										case 5:
											cresponse.push(nresponse[0]);
											cresponse.push(nresponse[1]);
											cresponse.push(nresponse[2]);
											cresponse.push(nresponse[3]);
											cresponse.push(nresponse[4]);
											resolve(bounceEmailAdvertiseOrderModel(cresponse));
											break;
									}
								})
								break;
							case 1:
								cresponse.push(sresponse[0]);
								resolve(bounceEmailAdvertiseOrderModel(cresponse));
								break;
							case 2:
								cresponse.push(sresponse[0]);
								cresponse.push(sresponse[1]);
								resolve(bounceEmailAdvertiseOrderModel(cresponse));
								break;
							case 3:
								cresponse.push(sresponse[0]);
								cresponse.push(sresponse[1]);
								cresponse.push(sresponse[2]);
								resolve(bounceEmailAdvertiseOrderModel(cresponse));
							break;
							case 4:
								cresponse.push(sresponse[0]);
								cresponse.push(sresponse[1]);
								cresponse.push(sresponse[2]);
								cresponse.push(sresponse[3]);
								resolve(bounceEmailAdvertiseOrderModel(cresponse));
							break;
							case 5:
								cresponse.push(sresponse[0]);
								cresponse.push(sresponse[1]);
								cresponse.push(sresponse[2]);
								cresponse.push(sresponse[3]);
								cresponse.push(sresponse[4]);
								resolve(bounceEmailAdvertiseOrderModel(cresponse));
							break;
							}
						}, function (err) {
							if (err) {
								var error = err;
								error.status = 503;
								return reject(error)
							};
						})
					}
				}else{
					let selQuery = `SELECT c.id,HTML_UnEncode(c.college_name)as college_name,college_alias,seo_name,c.access_level,c.contact_email,convert(cast(convert(cp.overview using latin1) as binary) using utf8) as overviewtext,convert(cast(convert(cp.display_text using latin1) as binary) using utf8) as overview, cp.college_logo, bc.checked_college,cspec.degree_desc FROM bounce_colleges bc LEFT JOIN colleges c ON bc.college_id = c.id LEFT JOIN college_profiles cp ON bc.college_id = cp.college_id LEFT JOIN college_degree_specific_info as cspec ON c.specific_profile_id=cspec.id WHERE bc.college_type = 'state' AND state_name IN ('${stateName}') ORDER BY bc.display_order LIMIT 6`;
					mysqlService.query(selQuery)
					.then(function (response) {
						if (response.length > 0) {
							resolve(bounceEmailAdvertiseOrderModel(response));
						} else {
							let selQuery = `SELECT c.id,HTML_UnEncode(c.college_name)as college_name,college_alias,seo_name,c.access_level,c.contact_email,convert(cast(convert(cp.overview using latin1) as binary) using utf8) as overviewtext,convert(cast(convert(cp.display_text using latin1) as binary) using utf8) as overview, cp.college_logo, bc.checked_college,cspec.degree_desc FROM bounce_colleges bc LEFT JOIN colleges c ON bc.college_id = c.id LEFT JOIN college_profiles cp ON bc.college_id = cp.college_id LEFT JOIN college_degree_specific_info as cspec ON c.specific_profile_id=cspec.id WHERE bc.college_type = 'national'  ORDER BY bc.display_order LIMIT 6`;
							mysqlService.query(selQuery)
							.then(function (response) {
								resolve(bounceEmailAdvertiseOrderModel(response));
							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return reject(error)
								};
							});
						}
					}, function (err) {
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
				}
			})
		})
	}

	async function sendNewUserBounceBackEmail(adData, emailData) {
		const profileUrl = config.DOMAIN_URL+"/login?uid=" + emailData[2];
		const unsubscribeId = base64Utility.encodeBase64("uid:"+emailData[2]+"&type:matching_email");
		const unsubscribeUrl = config.DOMAIN_URL+"/email/unsubscribe/"+unsubscribeId;
		const encryptedUuid = base64Utility.encodeBase64("uid:"+emailData[2]);
		const requestInfoUrl = config.DOMAIN_URL+"/requestInfo?" + encryptedUuid;
		const areaOfFocus = emailData[6].areaOfFocus.join(',');
		const sortedMatchedColleges = emailData[7].sort((a, b) => +b.percentMatch - +a.percentMatch);
		const questionAndAnswerLink = QUESTION_ANSWER_LINK;
		const giBillApplicationGuide = emailData[9] ? getGiBillLink(emailData[9]): null;
		let emailContent = "";
		emailContent += '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1">';
		emailContent += '<style>body {font-family: "Source Sans Pro", sans-serif;color: #333;}';
		emailContent += '.header-section {margin-bottom: 20px;}';
		emailContent += '.college-info {border-spacing: 0;margin-bottom: 80px; border-collapse: collapse;}';
		emailContent += '.yellowcolor {background-color: #fec231;} .college-info tr th{font-weight: 700;border-bottom: 10px solid #ffffff;background-color: #fbfbfb;} .college-info tr td{padding: 10px;} .college-info {width: 100%;margin-bottom: 10px;}';
		emailContent += '.college-ad td,th {border: 0;margin: 0 !important;padding: 10px 10px;text-align: center;}';
		emailContent += '.college-info td,th {/* border: 0; */margin: 0 !important;padding: 10px 20px;text-align: center;border-bottom: 5px solid #efefef;min-height: 40px;}';
		emailContent += '.text-contain {font-size: 14px;} p {font-size: 16px;}';
		emailContent += '.criteria{width: 100%;margin-bottom: 20px;} .college-detail{padding-left: 0;}';
		emailContent += '.college-detail li{list-style: none;display: inline-block;margin-right: .8rem;}';
		emailContent += '.edit-degree{padding: .5rem;background-color: #f5f5f5;} .list-direction{list-style-type:decimal}';
		emailContent += 'ul.list-direction-dash {list-style-type: none;} .list-direction-dash>li {text-indent: -5px;margin-bottom: 10px;}'
		emailContent += '.list-direction-dash>li:before {content: "-";text-indent: -5px;}'
		emailContent += '.list-direction li{margin-bottom: 10px;} .header-section1{clear: both;margin-bottom: 10px;}';
		emailContent += '.college-ad td span img{ width: 80px;} .table-collapse{border-collapse: collapse;} .table-collapse tr{background-color: #f5f5f5;border-bottom: 3px solid #fffcfc;} .request-info{background: #fec231; padding: 10px; font-weight: bold; text-transform: uppercase; white-space: nowrap; border-radius: 2px;}';
		emailContent += '@media only screen and (max-width:768px) { .d-xs-none {display: none !important;}}.unsubscribe{text-align: center;font-size: 12px;font-style: italic;}';
		emailContent += '</style></head><body><div class="body-section "><table align="center"><tr><td style="text-align: center;"><span><img src="https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png" width="200px" /></span></td></tr></table><div class="header-section">';
		emailContent += '<p style="text-align:left;font-weight:normal;">Thanks for using CollegeRecon, the premier education and transition resource for the US military. Please find your matched schools below.</p>';
		emailContent += '<h2 style="padding-top: 10px; padding-bottom: 20px; margin: 0px;">Matching Criteria for '+ emailData[1] +'</h2>';
		emailContent += '<table style="border-collapse: separate; border-spacing: 0 0.8em;" class="criteria" ><tbody><tr><td>Where You Plan to Study: <br/><p style="margin: 8px 0px"><strong>' + emailData[3] + '</strong></p></td></tr>';
		emailContent += '<tr><td>Area of Study: <br/><p style="margin: 8px 0px"><strong>'+ emailData[5] +'</strong></p></td></tr>';
		emailContent += '<tr><td>Area of Focus : <br/><p style="margin: 8px 0px"><strong>'+areaOfFocus+'</strong></p></td></tr>';
		if(emailData[9]) {
			emailContent += `<tr><td>Status: <br/><p style="margin: 8px 0px"><strong>${emailData[9]}</strong></p></td></tr>`;
		}
		emailContent += '</tbody></table></div><!-- ad college --><div >';
		//instructions
		emailContent += '<div style="margin-top: 1.7rem;" class="header-section1"><h2 style="margin: 0px;padding-left: 0;padding-bottom: 20px">How to Use CollegeRecon</h2><ul style="padding-left:8px;margin: 5px 0px; list-style-type: circle;" class="list-direction">';
		emailContent += '<li>Visit your <a href="'+profileUrl+'">profile</a></li>';
		emailContent += `<li>Open the Matched Schools tab</li><li>Check schools that you wish to contact</li><li><a href="${profileUrl}">Contact schools</a> to determine if your program is approved for GI Bill, Yellow Ribbon, or Tuition Assistance Funding</li></ul></div>`;

		emailContent += `<div style="margin-top: 2.5rem;" class="header-section1"><h2>It's important for you to reach out to schools.</h2><ul style="padding-left:8px;margin: 5px 0px; list-style-type: circle;" class="list-direction">`;
		emailContent += '<li>To find out if your preferred program is coveredby the GI Bill, Tuition Assistance, or Yellow Ribbon.</li>';
		emailContent += '<li> If there will be any out-of-pocket costs that you will need to cover your self. </li>';
		emailContent += '<li> How much credit you are eligible to receive for your military experience, or CLEP and DSST tests.</li></ul></div>';
		emailContent += '<div style="margin-top: 2.5rem;"><div style="font-style: italic; font-weight: bold;">';
		emailContent += `Use our <a ${giBillApplicationGuide ? 'href="'+giBillApplicationGuide+'"' : ''}>GI Bill Application Guide</a> to get the answers you need.</div>`;
		emailContent += '<div style="font-style: italic; font-weight: bold;">Ready to talk to schools? Here are our <a href="'+questionAndAnswerLink+'">Questions to ask Admissions.</a></div></div>';

		emailContent += '<div style="margin-top: 2.5rem;"><h2 style="display:inline-block;width:82%; margin: 0;padding: 10px 0px 20px 0px;">Featured Schools</h2><table width="100%" align="left" class="college-ad table-collapse" style="background-color: #f5f5f5;clear: both; padding:.5rem;margin-bottom: 24px;">';
		emailContent += `<thead></thead><tbody>`;
		const featureSchool = [];
		for (const adSchool of adData.slice(0,3)) {
			featureSchool.push(adSchool)
			const tadvLink = config.DOMAIN_URL+"/"+adSchool.collegeAlias+'?'+emailConstant.FEATURE_SCHOOL_TRACKER;
			emailContent += '<tr ><td width="10%" style="text-align: left;padding-bottom: 10px;"><a href="'+tadvLink+'"><span><img src="' + adSchool.collegeLogo + '" width="80px"/></span></a></td>';
			emailContent += '<td style="text-align: left;padding-bottom: 10px;"><a href="'+tadvLink+'" style="color:#333333;text-decoration:none;"><span style="display:block;font-weight: bold;">' + adSchool.college_name + '</span></a>';
			emailContent += `<span style="display:block; font-size: 0.8rem">${adSchool.collegeDesc}</span></td></tr>`
		}
		emailContent += '</tbody></table></div><!-- ad college -->';
		emailContent += `<div style="margin-top: 2.5rem;">`;
		emailContent += '<table width="100%" align="left" class="college-info" style="clear: both; background-color: #ffffff;margin-bottom: 10px;border-collapse: collapse;">';
		emailContent += '<thead><tr><th style="padding: 0%"><h2 style="text-align: left;">Matched College List</h2></th><th><a class="request-info" style="color:#333333;text-decoration:none;margin-bottom:20px;" href="'+requestInfoUrl+'" target="_blank">Request Info</a></th></tr></thead><tbody>';
		if(emailData[8] == 'register'){
			insertMatchingEmailData(emailData[2], sortedMatchedColleges);
		}
		
		if(sortedMatchedColleges.length) {
			for (const matchSchool of sortedMatchedColleges.slice(0, 10)) {
				const matchLink = config.DOMAIN_URL+"/"+matchSchool.collegeAlias;
				emailContent += '<tr><td style="text-align: left;border-bottom: 5px solid #ffffff; min-height: 40px;"><a href="'+matchLink+'" style="color:#333333;">' + matchSchool.college_name + '</a></td><td width="25%" style="border-bottom: 5px solid #ffffff; min-height: 40px;padding-left:10px">' + matchSchool.percentMatch + '% <span class="d-xs-none"> Matched</span></td></tr>';
			}
		}else{
			emailContent += `<tr><td style="text-align: left;border-bottom: 5px solid #ffffff; min-height: 40px;" colspan="2">No Matched College</td></tr>`;
		}
		
		emailContent += '</tbody></table></div>';
		if(adData.length > 2) {
			emailContent += '<h2 style="display:inline-block;width:82%; margin: 0;padding: 30px 0px 20px 0px;">Featured Schools</h2>';
			emailContent += '<table width="100%" align="left" class="college-ad table-collapse" style="background-color: #f5f5f5;clear: both; padding:.5rem;margin-bottom: 24px;">';
			emailContent += '<thead></thead><tbody>';

			for (const adSchool of adData.slice(3,5)) {
				featureSchool.push(adSchool)
				const badvLink = config.DOMAIN_URL+"/"+adSchool.collegeAlias;
				emailContent += '<tr><td width="10%" style="text-align: left;"><a href="'+badvLink+'"><span><img src="' + adSchool.collegeLogo + '" width="80px"/></span></a></td>';
				emailContent += '<td style="text-align: left;"><a href="'+badvLink+'" style="color:#333333;text-decoration:none;"><span style="display:block;font-weight: bold;">' + adSchool.college_name + '</span></a>';
				emailContent += `<span style="display:block; font-size: 0.8rem">${adSchool.collegeDesc}</span></td></tr>`
			}
			emailContent += '</tbody></table> </div>';
		}
		if(featureSchool.length) insertTracking(featureSchool.map(x => x.collegeId), sourceTrackingConstant.PRIMARY_SOURCE_APP, sourceTrackingConstant.SECONDARY_SOURCE_BOUNCE_FEATURE_APPEARANCE);
		emailContent += '<div class="unsubscribe"><span><a href="'+unsubscribeUrl+'">Unsubscribe</a> to no longer receive matching emails</span></div>';
		emailContent += '<!-- ad college --><table align="center" style="margin-top:80px"><tr><td style="text-align: center;">';
		emailContent += '<span><img src="https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png" width="200px" /></span></td></tr>';
		emailContent += '<tr><td style="text-align: center;">College Recon Team</td></tr></table></div></div></body></html>';
		return emailContent;
    }

	function insertMatchingEmailData(sid,collegeData){
		return new Promise(function (resolve, reject) {
			let insertQuery = "";
      		insertQuery = "Insert into cadence_matching_list (student_id,college_id,matched_percent,rule_id,rule_status,date_created) values ";
			for (let i = 0; i < collegeData.length; i++) {
				if (i == collegeData.length - 1) {
					insertQuery += "('" + sid + "'," + collegeData[i].collegeId + ",'" + collegeData[i].percentMatch + "',1,'active','"+moment(new Date()).format('YYYY-MM-DD')+"');";
				}else{
					insertQuery += "('" + sid + "'," + collegeData[i].collegeId + ",'" + collegeData[i].percentMatch + "',1,'active','"+moment(new Date()).format('YYYY-MM-DD')+"'),";
				}
			}
			//emailData[7][i].collegeId
			mysqlService.query(insertQuery)
			.then(function (response) {
				resolve("success");
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}

	function updateCollegeMonthlySubscriptionData(collegeData) {
		return new Promise(function (resolve, reject) {
			//let updateQuery = "UPDATE colleges SET monthly_email_subscription = '" + collegeData.subscription + "',unsubscription_reason = '" + collegeData.reason + "' WHERE id =" + collegeData.collegeId;
			let updateQuery = "UPDATE college_contacts SET "+collegeData.unsubscribe_email_field+" = 'yes',"+collegeData.unsubscribe_reason_field+" = '" + collegeData.reason + "',"+collegeData.unsubscribe_date_field+" = '" + getCurrentDateInFormat('YYYY-MM-DD HH:mm:ss') + "' WHERE college_id =" + collegeData.collegeId;
			mysqlService.query(updateQuery)
				.then(function (response) {
					resolve("success");
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function updateCollegeOverviewData(collegeData) {
		return new Promise(function (resolve, reject) {
			let selQuery = "select count(id) as total from college_user_data where status='pending' and college_id=" + collegeData.college_id;
			mysqlService.query(selQuery)
				.then(function (response) {
					//console.log("RR:",response[0].total);
					if (response[0].total == 0) {
						let collegeUserData= {
							name: collegeData.name,
							overview: collegeData.overview?collegeData.overview:'',
							college_id: collegeData.college_id,
							college_user_id: collegeData.college_user_id
						}
						mysqlService.query("INSERT INTO college_user_data SET ?", collegeUserData)
							.then(function (adddresponse) {
							resolve("success");
							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return reject(error)
								};
						});
					} else {
						let updateQuery = "";
						if(collegeData.isOverviewEdit){
							updateQuery = "UPDATE college_user_data SET name = '" + collegeData.name + "',overview = '" + collegeData.overview + "' WHERE status='pending' and college_id =" + collegeData.college_id;
						}else{
							updateQuery = "UPDATE college_user_data SET name = '" + collegeData.name + "' WHERE status='pending' and college_id =" + collegeData.college_id;
						}
						
						mysqlService.query(updateQuery)
							.then(function (updateresponse) {
								resolve("success");
							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return reject(error)
								};
						});
					}
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	async function getCollegeActivityReportForAdmin(collegeId){
		let collegeInfo = await getCollegeAccessLevel(collegeId);
		let accessLevel = collegeInfo.access_level;
		let isDegreeeSpecific = false;
		if(collegeInfo.specific_profile_id > 0){
			isDegreeeSpecific = true;
		}

		let otwodateFrom = getMonthFirstDay(12);
		let otwodateTo = getMonthLastDay(12);

		let oonedateFrom = getMonthFirstDay(11);
		let oonedateTo = getMonthLastDay(11);

		let tendateFrom = getMonthFirstDay(10);
		let tendateTo = getMonthLastDay(10);

		let ninedateFrom = getMonthFirstDay(9);
		let ninedateTo = getMonthLastDay(9);

		let eightdateFrom = getMonthFirstDay(8);
		let eightdateTo = getMonthLastDay(8);

		let sevendateFrom = getMonthFirstDay(7);
		let sevendateTo = getMonthLastDay(7);

		let sixdateFrom = getMonthFirstDay(6);
		let sixdateTo = getMonthLastDay(6);

		let fivedateFrom = getMonthFirstDay(5);
		let fivedateTo = getMonthLastDay(5);

		let fourdateFrom = getMonthFirstDay(4);
		let fourdateTo = getMonthLastDay(4);

		let threedateFrom = getMonthFirstDay(3);
		let threedateTo = getMonthLastDay(3);

		let twodateFrom = getMonthFirstDay(2);
		let twodateTo = getMonthLastDay(2);

		let onedateFrom = getMonthFirstDay(1);
		let onedateTo = getMonthLastDay(1);
		
		if(accessLevel == "Patriot"){
			return await getCollegeActivityReport(collegeId,otwodateFrom,onedateTo,isDegreeeSpecific);
		}else{
			return await getCollegeActivityReport(collegeId,threedateFrom,onedateTo,isDegreeeSpecific);
		}
	}

	async function getTweleveCollegeActivityReportForAdmin(collegeId){
		let collegeInfo = await getCollegeAccessLevel(collegeId);
		let isDegreeeSpecific = false;
		if(collegeInfo.specific_profile_id > 0){
			isDegreeeSpecific = true;
		}

		let tfourdateFrom = getMonthFirstDay(24);
		let tfourdateTo = getMonthLastDay(24);

		let tthreedateFrom = getMonthFirstDay(23);
		let tthreedateTo = getMonthLastDay(23);

		let ttwodateFrom = getMonthFirstDay(22);
		let ttwodateTo = getMonthLastDay(22);

		let tonedateFrom = getMonthFirstDay(21);
		let tonedateTo = getMonthLastDay(21);

		let ttendateFrom = getMonthFirstDay(20);
		let ttendateTo = getMonthLastDay(20);

		let oninedateFrom = getMonthFirstDay(19);
		let oninedateTo = getMonthLastDay(19);

		let oeightdateFrom = getMonthFirstDay(18);
		let oeightdateTo = getMonthLastDay(18);

		let osevendateFrom = getMonthFirstDay(17);
		let osevendateTo = getMonthLastDay(17);

		let osixdateFrom = getMonthFirstDay(16);
		let osixdateTo = getMonthLastDay(16);

		let ofivedateFrom = getMonthFirstDay(15);
		let ofivedateTo = getMonthLastDay(15);

		let ofourdateFrom = getMonthFirstDay(14);
		let ofourdateTo = getMonthLastDay(14);

		let othreedateFrom = getMonthFirstDay(13);
		let othreedateTo = getMonthLastDay(13);
		
		return await getCollegeActivityReport(collegeId,tfourdateFrom,othreedateTo,isDegreeeSpecific);
	}

	function getMonthFirstDay(i){
		let date = new Date();
		let firstDay = new Date(date.getFullYear(), date.getMonth()-i, 1);
		let dateFrom = moment(firstDay).format('YYYY-MM-DD');
		return dateFrom;
	}

	function getMonthLastDay(i){
		let date = new Date();
		let lastDay = date.setMonth(date.getMonth()-(i-1), 0);
		let dateTo = moment(lastDay).add(1, 'days').format('YYYY-MM-DD');
		return dateTo;
	}

	function getCollegeActivityReport(collegeId,dateFrom,dateTo,isDegreeeSpecific){
        return new Promise(function(resolve, reject) {
			let ruleSql = "";
			let tabData = "";
			if(isDegreeeSpecific){
				tabData = "('contact','military','overview','stats','degree_description')";
			}else{
				tabData = "('contact','military','degrees','stats','review')";
			}
			/*ruleSql = "select YEAR('"+dateFrom+"') as year, MONTHNAME('"+dateTo+"') as month, sum(tt.filterdata) as searchresult, sum(tt.registerdata) as savedschool,(SELECT count(*) as cn FROM college_search_tracking where college_id = "+collegeId+" and date(date_created) BETWEEN '"+dateFrom+"' AND '"+dateTo+"' and secondary_source in ('url','list'))  as searchboxtotal,(select count(distinct student_id) from recon_messages r  where r.college_id ="+collegeId+" and r.responder = 'USER' and  date(r.date_created) BETWEEN '"+dateFrom+"' AND '"+dateTo+"') as scount,(select COUNT(id) as total FROM tab_click_tracking where college_id ="+collegeId+" AND  date(date_clicked) BETWEEN '"+dateFrom+"' AND '"+dateTo+"' and tab_name in "+tabData+") as tabtotal from (SELECT case when (secondary_source is not null and secondary_source = 'filter') then 1 else 0 end as filterdata,case when (secondary_source is not null and secondary_source = 'register') then 1 else 0 end as registerdata FROM searchresult_colleges_tracking where college_id = "+collegeId+"  and date_created BETWEEN '"+dateFrom+"' AND '"+dateTo+"') as tt";*/
			ruleSql = "select YYYY as year, MM as allmonth, MMonth as month,sum(filterdata) as searchresult,sum(registerdata) as savedschool,sum(sboxtot) as searchboxtotal,sum(stutot) as scount,sum(tabtot) as tabtotal from (SELECT COUNT(id) as filterdata,0 as registerdata, 0 as sboxtot,0 as stutot,0 as tabtot,Year(date_created) as YYYY, Month(date_created) as MM, MonthName(date_created) as MMonth FROM searchresult_colleges_tracking where college_id = "+collegeId+" AND secondary_source = 'filter' and date_created BETWEEN '"+dateFrom+"' AND '"+dateTo+"' group by YYYY, MM, MMonth union SELECT 0 as filterdata,COUNT(id) as registerdata,0 as sboxtot,0 as stutot,0 as tabtot,Year(date_created) as YYYY, Month(date_created) as MM, MonthName(date_created) as MMonth FROM searchresult_colleges_tracking where college_id = "+collegeId+" AND secondary_source = 'register' and date_created >= '"+dateFrom+"' and date_created <= '"+dateTo+"' group by YYYY, MM, MMonth union SELECT 0 as filterdata,0 as registerdata,count(*) as sboxtot,0 as stutot,0 as tabtot,Year(date_created) as YYYY, Month(date_created) as MM, MonthName(date_created) as MMonth FROM college_search_tracking where college_id = "+collegeId+" and date_created BETWEEN '"+dateFrom+"' AND '"+dateTo+"' and secondary_source in ('url','list') group by YYYY, MM, MMonth union select 0 as filterdata,0 as registerdata,0 as sboxtot,count(distinct student_id) as stutot,0 as tabtot,Year(date_created) as YYYY, Month(date_created) as MM, MonthName(date_created) as MMonth  from recon_messages  where college_id ="+collegeId+" and responder = 'USER' and date_created BETWEEN '"+dateFrom+"' AND '"+dateTo+"' group by YYYY, MM, MMonth union select  0 as filterdata,0 as registerdata,0 as sboxtot,0 as stutot,COUNT(id) as tabtot,Year(date_clicked) as YYYY, Month(date_clicked) as MM, MonthName(date_clicked) as MMonth FROM tab_click_tracking where college_id ="+collegeId+" AND  date_clicked BETWEEN '"+dateFrom+"' AND '"+dateTo+"' and tab_name in ('contact','military','degrees','stats','review') group by YYYY, MM, MMonth ) temp group by YYYY, MM, MMonth order by YYYY desc,MM desc";
            //console.log("QQ:",ruleSql);
                mysqlService.query(ruleSql)
                .then(function(response){
                    //console.log("RR:",response);
                    resolve(response);
                },function(err){  
                    if (err) {
                        var error = err;
                        error.status = 503;
                        return reject(error)
                    };
                });
            });
	}

	function getCollegeAccessLevel(collegeId){
		return new Promise(function (resolve, reject) {
			let selQuery = "Select access_level,specific_profile_id from colleges where id="+collegeId;
			mysqlService.query(selQuery)
				.then(function (response) {
					resolve(response[0]);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}
	
	function getCollegeAdminUserinfo(collegeId) {
		return new Promise(function (resolve, reject) {
			let selQuery = "SELECT cu.id,cu.uuid,cu.college_user_email,cc.access_level from college_users as cu LEFT JOIN colleges as cc ON cu.college_id=cc.id  WHERE cu.status='ACTIVE' and college_id="+collegeId+" LIMIT 1";
			//console.log("QQ:",selQuery);
			mysqlService.query(selQuery)
				.then(function (response) {
					if (response.length > 0) {
						resolve(response);
					} else {
						resolve("nouser");
					}
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getYellowRibbonData(collegeId) {
		return new Promise(function (resolve, reject) {
			let selQuery = "SELECT * FROM college_yellow_ribbon_degree WHERE college_id="+collegeId;
			//console.log("QQ:",selQuery);
			mysqlService.query(selQuery)
				.then(function (response) {
					if(response){
						resolve(collegeYellowRibbonDataModel(response));
					}
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getImportYellowRibbonData(){
		return new Promise(function(resolve, reject) {
			let vetlist = "SELECT * FROM unique_match_yrd";
			
			mysqlService.query(vetlist)
			.then(function(response){
				//resolve(reportCommunicationstatModel(response));
				let insertQuery = "";
				insertQuery = "Insert into college_yellow_ribbon_degree (college_id,degree_name,division_of_school,amount,no_of_student,division_bucket) values ";
				let regex = /[/,]/;
				for (let i = 0; i < response.length; i++) {
					if(i == response.length - 1){
						if(response[i].degree_level_new.match(regex)){
							insertQuery+= getExtraYellowRibbonData(response[i].college_id,response[i].degree_level_new,response[i].division_of_school_new,response[i].amount,response[i].number,response[i].division_bucket,"last");
						}else{
							insertQuery+= "("+response[i].college_id+",'"+response[i].degree_level_new+"','"+response[i].division_of_school_new+"','"+response[i].amount+"','"+response[i].number+"','"+response[i].division_bucket+"');";
						}
					}else{
						if(response[i].degree_level_new.match(regex)){
							insertQuery+= getExtraYellowRibbonData(response[i].college_id,response[i].degree_level_new,response[i].division_of_school_new,response[i].amount,response[i].number,response[i].division_bucket,"nlast");
						}else{
							insertQuery+= "("+response[i].college_id+",'"+response[i].degree_level_new+"','"+response[i].division_of_school_new+"','"+response[i].amount+"','"+response[i].number+"','"+response[i].division_bucket+"'),";
						}
					}
				}
				mysqlService.query(insertQuery)
					.then(function (response1) {
						resolve("success");
					}, function (err) {
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
				//resolve("success");
			},function(err){  
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});	
	}

	function getExtraYellowRibbonData(cid,degree_level,division_of_school,amount,no,division_bucket,check){
		let commaArr = degree_level.split(",");
		let slashArr = degree_level.split("/");
		let degreeArr = [];
		if(commaArr.length > 1){
			degreeArr = commaArr; 
		}else{
			degreeArr = slashArr;
		}
		let Qry = "";
		if(check == "last"){
			for (let i = 0; i < degreeArr.length; i++) {
				if(i == degreeArr.length - 1){
					Qry+= "("+cid+",'"+degreeArr[i].trim()+"','"+division_of_school+"','"+amount+"','"+no+"','"+division_bucket+"');";
				}else{
					Qry+= "("+cid+",'"+degreeArr[i].trim()+"','"+division_of_school+"','"+amount+"','"+no+"','"+division_bucket+"'),";
				}
			}
		}else{
			for (let i = 0; i < degreeArr.length; i++) {
				Qry+= "("+cid+",'"+degreeArr[i].trim()+"','"+division_of_school+"','"+amount+"','"+no+"','"+division_bucket+"'),";
			}
		}
		return Qry;
	}

	function getFeatureSchools(uuid) {
		return new Promise(function(resolve, reject) {
			let getQuery = `SELECT state from student_profile WHERE uuid='${uuid}'`;
			
			mysqlService.query(getQuery)
			.then(function(response){
				getBounceBackAdvertise(response[0].state)
					.then(function(defCollege) {
						resolve(defCollege);
					})
			},function(err){  
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});	
	}

	function updateCollegeNameAlias(collegeId) {
        return new Promise(function (resolve, reject) {
            let selQuery = "SELECT id,college_name FROM colleges ORDER BY id";
            //console.log("QQ:",selQuery);
            mysqlService.query(selQuery)
                .then(function (response) {
                    for (let i = 0; i < response.length; i++) {
                        let upquery = "update colleges set college_alias='"+stringUtil.collegeNameUrl(response[i].college_name)+"' where id="+response[i].id;
                        mysqlService.query(upquery)
                            .then(function (uponse) {
                                if(i == response.length -1){
                                    resolve("success");
                                }
                            }, function (err) {
                                if (err) {
                                    var error = err;
                                    error.status = 503;
                                    return reject(error)
                                };
                        });
                    }
                }, function (err) {
                    if (err) {
                        var error = err;
                        error.status = 503;
                        return reject(error)
                    };
                });
        });
	}
	
	function getCollegeIdFromAlias(alias) {
		return new Promise(function(resolve, reject) {
			let getQuery = "SELECT id,access_level from colleges WHERE college_alias='"+alias+"' AND status='ACTIVE' AND specific_profile_id = '0'";
			//console.log("QQ:",getQuery);
			mysqlService.query(getQuery)
			.then(function(response){
				if(response.length > 0) {
					resolve(response[0]);
				} else {
					let searchQuery = `SELECT id as dspId,college_info_id as id FROM college_degree_specific_info WHERE degree_specific_alias = "${alias}" AND degree_status!='disable' and program_matcher_only='no'`;
					mysqlService.query(searchQuery)
					.then(function(sresponse) {
						if(sresponse.length > 0){
							sresponse[0].isSpecific = true
							resolve(sresponse[0]);
						}else{
							let programQuery = `SELECT id as dspId,college_info_id as id FROM college_degree_specific_info WHERE secondary_alias = "${alias}" AND degree_status!='disable' and program_matcher_only='yes'`;
							mysqlService.query(programQuery)
							.then(function(presponse) {
								if(presponse.length > 0){
									presponse[0].isSpecific = true;
									presponse[0].programMatcher = true
									resolve(presponse[0]);
								}else{
									resolve("");
								}
							},function(err){  
								if (err) {
									var error = err;
									error.status = 503;
									return reject(error)
								};
							});
						}
					},function(err){  
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					})
				}
			},function(err){  
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});	
	}

	function getCollegeAliasFromId(id) {
		return new Promise(function(resolve, reject) {
			let getQuery = "SELECT college_alias from colleges WHERE id="+id;
			//console.log("QQ:",getQuery);
			mysqlService.query(getQuery)
			.then(function(response){
				resolve(response[0]);
			},function(err){  
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});	
	}

	function getSpecificCollegeNameFromBucketId(priBucket, secBucket, level) {
		return new Promise(function(resolve, reject) {
				let getQuery = `SELECT id, college_id, new_college_name as college_name, degree_specific_alias FROM college_degree_specific_info WHERE countMatchingElements(level_id,'${level}') AND bucket_id IN (${priBucket}) and countMatchingElements('${secBucket}',sec_bucket_id) and degree_status='active'`;
				// console.log(getQuery)
				mysqlService.query(getQuery)
				.then(function(response){
					resolve(response)
				},function(err){  
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
			// console.log("QQ:",getQuery);
		});	
	}

	function getSpecificCollegeDegreeData(id) {
		return new Promise(function(resolve, reject) {
			let getQuery = `SELECT degree_title, college_name, school_name, convert(cast(convert(degree_desc using latin1) as binary) using utf8) as degree_desc, job_market_review, courses, graduation_rate,
			placement_rate, gmat_score, avg_immediate_salary, level_id FROM college_degree_specific_info as cdsi LEFT JOIN colleges as cc ON cdsi.college_id=cc.id WHERE cdsi.id = '${id}'`;
			// console.log("QQ:",getQuery);
			mysqlService.query(getQuery)
			.then(function(response){
				resolve(response);
			},function(err){  
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});	
	}

	function getSpecificCollegeProfileData(cid) {
		return new Promise(function(resolve, reject) {
			let getQuery = `SELECT graduation_rate, placement_rate, avg_immediate_salary, gmat_score FROM college_profiles WHERE college_id = ${cid}`;
			// console.log("QQ:",getQuery);
			mysqlService.query(getQuery)
			.then(function(response){
				resolve(response);
			},function(err){  
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});	
	}

	function getautolistCollegeWithSpecific(filters) {
		return new Promise(function (resolve, reject) {
			var searchQuery = collegeConstants.GET_COLLEGE_AUTO_LIST_WITH_SPECIFIC;
			var queryFilters = '';
			if (filters.name.length > 0) {
				queryFilters += " AND (college_name LIKE '%" + filters.name + "%' OR city LIKE '%" + filters.name + "%' OR college_abbreviation LIKE '%" + filters.name + "%') ORDER BY college_name ASC";
			}
			mysqlService.query(searchQuery + queryFilters)
				.then(function (response) {
					resolve(collegeListModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function contactInfoTracking(contactData) {
		return new Promise(function (resolve, reject) {
			var searchQuery = `  INSERT INTO contactinfo_tracking (student_id, college_id, source, date_created) values ('${contactData.studentId}','${contactData.collegeId}', '${contactData.source}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}')  `;

			mysqlService.query(searchQuery)
			.then(function (response) {
				resolve('success')
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}

	function bookmarkTracking(saveData) {
		return new Promise(function (resolve, reject) {
			var searchQuery = `  INSERT INTO bookmark_tracking (student_id, college_id, source, date_clicked) values ('${saveData.studentId}','${saveData.collegeId}', '${saveData.source}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}')  `;

			mysqlService.query(searchQuery)
			.then(function (response) {
				resolve("success")
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}

	function tabClickTracking(tabData) {
		return new Promise(function (resolve, reject) {
			var searchQuery = `  INSERT INTO tab_click_tracking (tab_name, college_id, student_id, source,  date_clicked) values ('${tabData.tabName}','${tabData.collegeId}', '${tabData.studentId}', '${tabData.source}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}')  `;

			mysqlService.query(searchQuery)
			.then(function (response) {
				resolve("success")
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}

	function homepageLinkTracking(homepageData) {
		return new Promise(function (resolve, reject) {
			var insertQuery = `  INSERT INTO homepage_link_tracking (filter_name, student_id, source,  date_clicked) values ('${homepageData.value}', '${homepageData.studentId}', '${homepageData.source}', '${moment(new Date()).format('YYYY-MM-DD HH:mm:ss')}')  `;

			mysqlService.query(insertQuery)
			.then(function (response) {
				resolve("success")
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}

	function buttonClickTracking(buttonData) {
		return new Promise(function (resolve, reject) {
			var searchQuery = `  INSERT INTO button_click_tracking (button_name, location, college_id, student_id, source) values ('${buttonData.buttonName}','${buttonData.location}','${buttonData.collegeId}', '${buttonData.studentId}', '${buttonData.source}')  `;

			mysqlService.query(searchQuery)
			.then(function (response) {
				resolve("success")
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});
	}

	function getSimilarSchoolLists(cdata, { track }) {
		return new Promise(async (resolve, reject) => {
			try {
				const customSimilarSchoolQuery = `SELECT cc.id,cc.college_name,cc.seo_name,cc.college_alias,cc.access_level,cc.state,cp.years_offered,cp.religious_affiliation,cp.ethnic_affiliation,cp.student_population,cp.public_private,cp.college_logo FROM similar_schools ss JOIN colleges as cc on ss.similar_college_id = cc.id join college_profiles as cp ON ss.similar_college_id=cp.college_id WHERE cc.status='active' AND ss.college_id = ${cdata.collegeId}`;
				let getQuery = "SELECT cc.id,cc.college_name,cc.seo_name,cc.college_alias,cc.access_level,cc.state,cp.years_offered,cp.religious_affiliation,cp.ethnic_affiliation,cp.student_population,cp.public_private,cp.college_logo FROM colleges as cc join college_profiles as cp ON cc.id=cp.college_id WHERE cc.status='active' and cc.id != "+cdata.collegeId+" and cc.specific_profile_id=0 and ((cp.years_offered ='"+cdata.yearsOffered+"' and cc.state = '"+cdata.state+"') ";
				if(cdata.religiousAffiliation && cdata.ethnicAffiliation) {
					getQuery+= " or (cp.religious_affiliation='"+cdata.religiousAffiliation+"' and cp.ethnic_affiliation='"+cdata.ethnicAffiliation+"') ";
				}else if(cdata.religiousAffiliation) {
					getQuery+= " or (cp.religious_affiliation='"+cdata.religiousAffiliation+"') ";
				}else if(cdata.ethnicAffiliation) {
					getQuery+= " or (cp.ethnic_affiliation='"+cdata.ethnicAffiliation+"') ";
				}
				getQuery+= " or cp.student_population= '"+cdata.studentPopulation+"' or cp.public_private='"+cdata.publicPrivate+"')";
				const [similarSchools, customSimilarSchools] = await Promise.all([
					mysqlService.query(getQuery),
					mysqlService.query(customSimilarSchoolQuery)
				]);
				const similarSchoolListFormatted = collegeSimilarSchoolModel(customSimilarSchools, similarSchools, cdata);
				if(track && track === 'false') await Promise.all(similarSchoolListFormatted.map(({ collegeId }) => {
					const trackingBody = {
						primary_source: sourceTrackingConstant.PRIMARY_SOURCE_APP,
						secondary_source: sourceTrackingConstant.SECONDARY_SOURCE_SIMILAR_APPEARANCE,
						college_id: collegeId,
						date_created: getCurrentDateInFormat('YYYY-MM-DD HH:mm:ss')
					}
					return mysqlService.query(sourceTrackingConstant.SAVE_COLLEGE_SEARCH_TRACKING, trackingBody)
				}));
				return resolve(similarSchoolListFormatted);
			} catch (error) {
				error.status = 503;
				return reject(error);
			}
		});
	}

	function unsubscribeCollegeEamil(updatedata) {
		return new Promise(function (resolve, reject) {
			let checkQuery = "select count(id) as total from college_unsubscribe where college_id='" + updatedata.college_id + "' and unsubscribe_type='" + updatedata.unsubscribe_type + "'";
			mysqlService.query(checkQuery)
			.then(function (response) {
				if(response[0].total == 0){
					mysqlService.query("INSERT INTO college_unsubscribe SET ? ", updatedata)
						.then(function (response1) {
							resolve("success")
						}, function (err) {
							if (err) {
								var error = err;
								error.status = 503;
								return reject(error)
							};
						})
				}else{
					resolve("success")
				}
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			})
		})
	}

	function updateCollegeName() {
        return new Promise(function (resolve, reject) {
            let selQuery = "SELECT id,college_name FROM colleges ORDER BY id";
            //console.log("QQ:",selQuery);
            mysqlService.query(selQuery)
                .then(function (response) {
                    for (let i = 0; i < response.length; i++) {
                        let upquery = 'update colleges set college_name_bck="'+stringUtil.manageCollegeName(response[i].college_name)+'" where id='+response[i].id;
                        mysqlService.query(upquery)
                            .then(function (uponse) {
                                if(i == response.length -1){
                                    resolve("success");
                                }
                            }, function (err) {
                                if (err) {
                                    var error = err;
                                    error.status = 503;
                                    return reject(error)
                                };
                        });
                    }
                }, function (err) {
                    if (err) {
                        var error = err;
                        error.status = 503;
                        return reject(error)
                    };
                });
        });
	}

	async function getDegreeBounceBackAdvertise(bounceData){
		let collegeListQuery = "";
		let degreeCheckQuery = "SELECT id FROM `bounceback_degree` WHERE level_id="+bounceData.education_goal+" and bucket_id="+bounceData.bucket_id+" and countMatchingElements(secondary_bucket_id,'"+ bounceData.area_focus_ids +"')";
		
		let degreeCheckResult = await executeCollegeQuery(degreeCheckQuery);
		if(degreeCheckResult.length > 0 && degreeCheckResult[0].id){
			collegeListQuery = "SELECT c.id,HTML_UnEncode(c.college_name)as college_name,college_alias,seo_name,c.access_level,c.contact_email,bc.burb as overview, cp.college_logo, cspec.degree_desc FROM bounceback_colleges bc LEFT JOIN colleges c ON bc.college_id = c.id LEFT JOIN college_profiles cp ON bc.college_id = cp.college_id LEFT JOIN college_degree_specific_info as cspec ON c.specific_profile_id=cspec.id WHERE bc.bounceback_degree_id = "+degreeCheckResult[0].id+" ORDER BY bc.display_order LIMIT 5";
		}else{
			collegeListQuery = "SELECT c.id,HTML_UnEncode(c.college_name)as college_name,college_alias,seo_name,c.access_level,c.contact_email,convert(cast(convert(cp.overview using latin1) as binary) using utf8) as overview, cp.college_logo, bc.checked_college,cspec.degree_desc,bc.display_order FROM bounce_colleges bc LEFT JOIN colleges c ON bc.college_id = c.id LEFT JOIN college_profiles cp ON bc.college_id = cp.college_id LEFT JOIN college_degree_specific_info as cspec ON c.specific_profile_id=cspec.id WHERE bc.college_type = 'national' ORDER BY bc.checked_college,bc.display_order LIMIT 5";
		}
		
		let collegeList = await executeCollegeQuery(collegeListQuery);
		return bounceEmailAdvertiseOrderModel(collegeList);
	}

	const getRotcBranchUrl = async (collegeId) => {
		return mysqlService.query(`SELECT branch_id as branchId, college_id as collegeId, branch_name as branchName, rotc_branch_url as url, rotc_branch_type as rotcBranchType from rotc_branch_url WHERE college_id = ${collegeId}`);
	}

	const insertRotcBranchUrl = async (collegeId, branchUrlBody) => {
		if(!branchUrlBody.length) return mysqlService.query(`DELETE FROM rotc_branch_url WHERE college_id = ${collegeId}`)
		await mysqlService.query(`DELETE FROM rotc_branch_url WHERE college_id = ${collegeId}`);
		let query = `INSERT INTO rotc_branch_url (college_id, branch_id, branch_name, rotc_branch_url, rotc_branch_type) VALUES `;
		const valuesArray = []
		for (const rotcBranch of branchUrlBody) {
			valuesArray.push(`(${collegeId}, ${rotcBranch.branchId}, '${rotcBranch.branchName}', '${rotcBranch.url}', '${rotcBranch.rotcBranchType}')`);
		}
		return mysqlService.query(query+valuesArray.join(', '));
	}

	async function executeCollegeQuery(sql) {
        return new Promise(function (resolve, reject) {
            mysqlService.query(sql)
                .then(function (response) {
                    resolve(response);
                }, function (err) {
                    if (err) {
                        var error = err;
                        error.status = 503;
                        return reject(error)
                    };
                });
        });
    }

	async function insertTracking(colleges, primary_source, secondary_source) {
		await Promise.all(colleges.map((college_id) => {
			const trackingBody = {
				primary_source,
				secondary_source,
				college_id,
				date_created: getCurrentDateInFormat('YYYY-MM-DD HH:mm:ss')
			}
			return mysqlService.query(sourceTrackingConstant.SAVE_COLLEGE_SEARCH_TRACKING, trackingBody)
		}));
	}

	function getGiBillLink(militaryStatus) {
		if(militaryStatus && (militaryStatus.toLowerCase() === 'spouse' || militaryStatus.toLowerCase() === 'dependent')) {
			return GI_BILL_LINK.SPOUSE_DEPENDENTS;
		} else if(militaryStatus && (militaryStatus.toLowerCase() === 'veteran' || militaryStatus.toLowerCase() === 'retired' || militaryStatus.toLowerCase() === 'active')) {
			return GI_BILL_LINK.ACTIVE_DUTY_VETERANS;
		} else {
			return null;
		}
	}

	const getMycaaData = async (collegeId) => {
		return mysqlService.query(`SELECT accreditation, availability from mycaa_schools WHERE college_id = ${collegeId}`);
	}

	const getautolistCollegeByName = async (filters) => {
		let sql = "";
		if(filters.name){
			sql = collegeConstants.GET_COLLEGE_AUTO_LIST +  " AND (college_name LIKE '%" + filters.name + "%' OR city LIKE '%" + filters.name + "%' OR college_abbreviation LIKE '%" + filters.name + "%') ORDER BY college_name ASC"; 
		}else{
			sql = collegeConstants.GET_COLLEGE_AUTO_LIST;
		}
		const autoCollegeQry = await mysqlService.query(sql);
		return  collegeListModel(autoCollegeQry, [], []);
	}

	const getCollegeExtraInfo = async (collegeId) => {
		return mysqlService.query(`SELECT caution_flag, caution_flag_reason from college_extra_data WHERE college_id = ${collegeId}`);
	}

	const getMultiCampusList = async (collegeId, parentId) => {
		let qry = "";
		if(parentId == 0){
			qry = "select cc.id,cc.college_name,cc.college_alias,cp.college_logo from colleges as cc left join college_profiles as cp on cc.id=cp.college_id where cc.parent_id="+collegeId;
		}else{
			qry = "select cc.id,cc.college_name,cc.college_alias,cp.college_logo from colleges as cc left join college_profiles as cp on cc.id=cp.college_id where cc.id="+parentId;
		}
		let collegeData = await executeCollegeQuery(qry);
		return collegeParentChildModel(collegeData);
	}

	const getMultiCampusCollegeList = async (collegeId, parentId) => {
		let qry = "";
		if(parentId == 0){
			qry = "select id,college_name,contact_email,access_level from colleges where id="+collegeId;
			qry+= " UNION select id,college_name,contact_email,access_level from colleges where parent_id="+collegeId;
		}else{
			qry = "select id,college_name,contact_email,access_level from colleges where id="+parentId;
			qry+= " UNION select id,college_name,contact_email,access_level from colleges where parent_id="+parentId;
		}
		let collegeData = await executeCollegeQuery(qry);
		return collegeData;
	}

	const getMatchedMultiCampusCollegeList = async (postData) => {
		let matchedCollegeLists = [];
		// let i=0;
		for (let collegeData of postData.collegeList) {
			let pcid = collegeData.collegeId;
			let collegeList = await getMatchedCollegeList(collegeData,postData.filters);
			collegeList.map((college) => {
				if(college.id == pcid) {
					college['checked'] = true;
				}else{
					college['checked'] = false;
				}
				matchedCollegeLists.push(college);
			})
		}
		 return matchedCollegeLists;
	}

	const getMatchedCollegeList = async (collegeData, filters) => {
		let qry = "";
		let secBuckets = "";
		if(filters.area_focus_length == 1){
			secBuckets = filters.area_focus_ids;
		}else{
			secBuckets = stringUtil.joinStringByComma(filters.area_focus_ids);
		}
		if(collegeData.parentId == 0){
			qry = "select cc.* from (select id,college_name,contact_email,access_level from colleges where id="+collegeData.collegeId+" UNION select id,college_name,contact_email,access_level from colleges where parent_id= "+collegeData.collegeId+") as cc where cc.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in ("+filters.bucket_id+") and cmn.aw_level in ("+filters.education_goal+") and bsdl.bucket_secondary_degree_id in ("+secBuckets+"))";
		}else{
			qry = "select cc.* from (select id,college_name,contact_email,access_level from colleges where id="+collegeData.parentId+" UNION select id,college_name,contact_email,access_level from colleges where parent_id= "+collegeData.parentId+") as cc where cc.id in (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id where bsdl.bucket_primary_degree_id in ("+filters.bucket_id+") and cmn.aw_level in ("+filters.education_goal+") and bsdl.bucket_secondary_degree_id in ("+secBuckets+"))";
		}
		let matchedData = await executeCollegeQuery(qry);
		return matchedData;
	}

	return {
    getDefaultColleges: getDefaultColleges,
    getAllColleges: getAllColleges,
    getCollegeProfile: getCollegeProfile,
    searchCollege: searchCollege,
    searchCollegeSearch: searchCollegeSearch,
    getautolistCollege: getautolistCollege,
    getNewsfeedByCollege: getNewsfeedByCollege,
    sendBackEmailToNewUser: sendBackEmailToNewUser,
    sendBackBucketDataEmailToNewUser: sendBackBucketDataEmailToNewUser,
    sendBackEmailToSpecificNewUser: sendBackEmailToSpecificNewUser,
    updateCollegeOverviewText: updateCollegeOverviewText,
    updateCollegeOverview: updateCollegeOverview,
    uploadPhoto: uploadPhoto,
    uploadLogo: uploadLogo,
    uploadBanner: uploadBanner,
    updateCollegeLocation: updateCollegeLocation,
    updateMilitaryOfferings: updateMilitaryOfferings,
    saveTimeLine: saveTimeLine,
    deleteTimeLine: deleteTimeLine,
    updateMajorOfferings: updateMajorOfferings,
    getCollegeProfileView: getCollegeProfileView,
    getCollegeFavouriteList: getCollegeFavouriteList,
    getNewsFeed: getNewsFeed,
    getCollegeUserInfo: getCollegeUserInfo,
    recordCollegeLogin: recordCollegeLogin,
    recordStudentLogin: recordStudentLogin,
    getRegisterMatchCollege: getRegisterMatchCollege,
    getNewRegisteredMatchCollege: getNewRegisteredMatchCollege,
    getRegisterMatchEmailData: getRegisterMatchEmailData,
    getCollegeBasicInfo: getCollegeBasicInfo,
    getStaticCollegeList: getStaticCollegeList,
    getNagEmailSubscriptionData: getNagEmailSubscriptionData,
    getCollegeMetadata: getCollegeMetadata,
    checkCollegeExist: checkCollegeExist,
    updateCollegeMonthlySubscriptionData: updateCollegeMonthlySubscriptionData,
    uploadVsdImage:uploadVsdImage,
    updateCollegeOverviewData: updateCollegeOverviewData,
    getCollegeActivityReportForAdmin: getCollegeActivityReportForAdmin,
    getCollegeAdminUserinfo: getCollegeAdminUserinfo,
    getYellowRibbonData: getYellowRibbonData,
    updateYellowRibbonData: updateYellowRibbonData,
    getImportYellowRibbonData: getImportYellowRibbonData,
    getFeatureSchools: getFeatureSchools,
    updateCollegeNameAlias: updateCollegeNameAlias,
    getCollegeIdFromAlias: getCollegeIdFromAlias,
    getCollegeAliasFromId: getCollegeAliasFromId,
    getSpecificCollegeNameFromBucketId: getSpecificCollegeNameFromBucketId,
    getSpecificCollegeDegreeData: getSpecificCollegeDegreeData,
    getSpecificCollegeProfileData: getSpecificCollegeProfileData,
    getautolistCollegeWithSpecific: getautolistCollegeWithSpecific,
    contactInfoTracking: contactInfoTracking,
    bookmarkTracking: bookmarkTracking,
    tabClickTracking: tabClickTracking,
    homepageLinkTracking: homepageLinkTracking,
    getTweleveCollegeActivityReportForAdmin: getTweleveCollegeActivityReportForAdmin,
    buttonClickTracking: buttonClickTracking,
    getSimilarSchoolLists: getSimilarSchoolLists,
    unsubscribeCollegeEamil: unsubscribeCollegeEamil,
    updateCollegeName: updateCollegeName,
    getCollegeComparisonDetail: getCollegeComparisonDetail,
    getRotcBranchUrl,
    insertRotcBranchUrl,
    sendNewUserBounceBackEmail,
    getBounceBackAdvertise,
	getMycaaData,
	getautolistCollegeByName,
	getMultiCampusList,
	getMultiCampusCollegeList,
	getMatchedMultiCampusCollegeList,
  };

})();

module.exports = collegeService;