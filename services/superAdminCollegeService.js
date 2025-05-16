const { on } = require('node-cache');
const { biskCollegeList } = require('../constants/googleSheetConstant');

let superAdminCollegeService = (function () {

	let mysqlService = require('./mysqlService');
	let sha1 = require('sha1');
	let moment = require('moment');
	let stringUtil = require('../utils/stringUtil');
	let superAdminConstant = require('../constants/superAdminConstant');
	let superAdminCollegeListModel = require('../models/superAdmincollegeListModel');
	let degreeReportModel = require('../models/degreeReportModel');
	let superAdminCollegeModel = require('../models/superAdminCollegeModel');
	let collegeOrderModel = require('../models/collegeOrderModel');
	let superadminStateModel = require('../models/superadminStateModel');
	let collegeContactsModel = require('../models/collegeContactsModel');
	let collegeImageInfoModel = require('../models/collegeImageInfoModel');
	let collegeSpecificDegreeModel = require('../models/collegeSpecificDegreeModel');
	let superAdminScholarshipModel = require('../models/superAdminScholarshipModel');
	let scholarshipOptionModel = require('../models/scholarshipOptionModel');
	let superAdminSpecificDegreeModel = require('../models/superAdminSpecificDegreeModel');
	let superAdminSpecificCollegeModel = require('../models/superAdminSpecificCollegeModel');
	let dereeSpecificCollegeModel = require('../models/degreeSpecificCollegeModel');
	let superAdminBouncebackDegreeModel = require('../models/superAdminBouncebackDegreeModel');
	let imageInfoModel = require('../models/imageInfoModel');
	let s3Helper = require('../utils/s3Helper');
	const sizeOf = require('image-size');

	function listCollegesData() {
		return new Promise(function (resolve, reject) {

			let listQuery = 'Select * from colleges where status="ACTIVE" order by college_name ASC';
			//console.log("QQ:",listQuery);
			mysqlService.query(listQuery)
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

	function listColleges(type) {
		return new Promise(function (resolve, reject) {

			//let listQuery = 'Select * from colleges where status="ACTIVE" order by college_name ASC';
			let addparam = "";
			if(type == "active"){
				addparam = " status = 'ACTIVE' ";
			}else if(type == 'disable'){
				addparam = " status = 'DISABLED' ";
			}else if(type == 'patriot'){
				addparam = " status = 'ACTIVE' and access_level = 'patriot' ";
			}
			let listQuery = "Select * from colleges where specific_profile_id=0 and "+addparam+" order by college_name ASC";
			//console.log("LL:",listQuery);
			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(superAdminCollegeListModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function listInactiveColleges() {
		return new Promise(function (resolve, reject) {
			let listQuery = "Select * from colleges where specific_profile_id=0 and status = 'DISABLED' order by college_name ASC";

			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(superAdminCollegeListModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function listCollegesByState(state) {
		return new Promise(function (resolve, reject) {
			let listQuery = "";
			if (state == "all") {
				listQuery = 'Select id, college_name,contact_email from colleges where status="ACTIVE" order by college_name ASC';
			} else {
				//listQuery = 'Select id,college_name from colleges where status="ACTIVE" and state="' + state + '" and college_type="traditional" union  Select id,college_name from colleges where status="ACTIVE" and college_type = "online" or (include_app_state like "%' + state + '%" ) order by college_name ASC';
				listQuery = 'Select id,college_name from colleges where status="ACTIVE" and state="' + state + '" and college_type="traditional" and include_app_state like "%' + state + '%"  order by college_name ASC';
			}
			//console.log("QQ:",listQuery);
			mysqlService.query(listQuery)
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

	function listNationalCollegesData() {
		return new Promise(function (resolve, reject) {

			let listQuery = 'SELECT dc.*,HTML_UnEncode(c.college_name) as collegeName FROM default_colleges as dc LEFT JOIN colleges as c on dc.college_id = c.id WHERE dc.college_type="national" ORDER BY dc.display_order ASC';

			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(collegeOrderModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function listStateCollegesData(state) {
		return new Promise(function (resolve, reject) {

			let listQuery = 'SELECT dc.*,HTML_UnEncode(c.college_name) as collegeName FROM default_colleges as dc LEFT JOIN colleges as c on dc.college_id = c.id WHERE dc.state_name="' + state + '" AND dc.college_type="state" ORDER BY dc.display_order ASC';

			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(collegeOrderModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getCollegeDataById(id) {
		return new Promise(function (resolve, reject) {

			let listQuery = 'SELECT c.*,cp.*,cm.*,cv.* FROM colleges as c LEFT JOIN college_profiles as cp ON c.id=cp.college_id LEFT JOIN college_metadata as cm ON c.id=cm.college_id LEFT JOIN college_vsd as cv ON c.id=cv.college_id where c.id=' + id;

			mysqlService.query(listQuery)
				.then(function (response) {
						resolve(superAdminCollegeModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function addCollegeinfo(collegeinfo) {
		return new Promise(function (resolve, reject) {
			let calias = "";
			if(collegeinfo.collegeAlias){
				calias = collegeinfo.collegeAlias;
			}else{
				calias = stringUtil.collegeNameUrl(collegeinfo.collegeName);
			}
			let collegeName = "";
			if(collegeinfo.collegeName){
				collegeName =  stringUtil.manageCollegeName(collegeinfo.collegeName);
			}
			let college = {
				college_name: collegeName,
				college_alias: calias,
				seo_name: collegeinfo.seoName,
				address: collegeinfo.collegeAddress,
				city: collegeinfo.collegeCity,
				state: collegeinfo.collegeState,
				postal_code: collegeinfo.collegePostalCode,
				contact_email: collegeinfo.collegeContactEmail,
				website: collegeinfo.collegeWebsite,
				phone_number: collegeinfo.collegePhoneNumber,
				fax_number: collegeinfo.collegeFaxNumber,
				college_abbreviation: collegeinfo.collegeAbbreviation,
				college_common_name: collegeinfo.collegeCommonName,
				specific_profile_id:0,
				phone_required: collegeinfo.phoneRequired,
				parent_id: collegeinfo.parentId,
				show_parent_child: collegeinfo.showParentChild
			}
			mysqlService.query(superAdminConstant.COLLEGE_SAVE, college)
				.then((results) => {
					// console.log("Result:", results);
					if (results["affectedRows"] == 1) {
						let collegeprofile = {
							college_id: results["insertId"],
							years_offered: collegeinfo.yearsOffered,
							//public_private:collegeinfo.publicPrivate,
							gender_preference: collegeinfo.genderPreference,
							//setting: collegeinfo.setting,
							//degrees_offered: collegeinfo.degreesOffered,
							in_state_tuition: collegeinfo.inStateTuition,
							out_state_tuition: collegeinfo.outStateTuition,
							student_population: collegeinfo.studentPopulation,
							female_student_count: collegeinfo.femaleStudentCount,
							male_student_count: collegeinfo.maleStudentCount,
							//rotc: collegeinfo.rotc,
							//awards_ace_credit: collegeinfo.awardsAceCredit,
							//sva: collegeinfo.sva,
							religious_affiliation: collegeinfo.religiousAffiliation,
							ethnic_affiliation: collegeinfo.ethnicAffiliation,
							sat_score: collegeinfo.satScore,
							act_score: collegeinfo.actScore,
							veteran_affairs_address: collegeinfo.veteranAffairsAddress,
							//veteran_affairs_address2: collegeinfo.veteran_affairs_address2,
							//veteran_affairs_city: collegeinfo.veteran_affairs_city,
							//veteran_affairs_state: collegeinfo.veteran_affairs_state,
							//veteran_affairs_postal_code: collegeinfo.veteran_affairs_postal_code,
							veteran_affairs_fax: collegeinfo.veteranAffairsFax,
							veteran_affairs_phone: collegeinfo.veteranAffairsPhone,
							veteran_affairs_email: collegeinfo.veteranAffairsEmail,
							veteran_affairs_website: collegeinfo.veteranAffairsWebsite,
							overview: collegeinfo.overview,
							display_text: collegeinfo.displayText,
							yellow_ribbon_coverage: collegeinfo.yellowRibbonCoverage,
							in_state_costpercredit: collegeinfo.inStateCostpercredit,
							out_state_costpercredit: collegeinfo.outStateCostpercredit,
							cpch_undergraduate_campus: collegeinfo.cpchUndergraduateCampus,
							cpch_undergraduate_online: collegeinfo.cpchUndergraduateOnline,
							cpch_graduate_campus: collegeinfo.cpchGraduateCampus,
							cpch_graduate_online: collegeinfo.cpchGraduateOnline,
							tuition_cpch: collegeinfo.tuitionCpch
						};
						mysqlService.query(superAdminConstant.COLLEGE_PROFILE_SAVE, collegeprofile)
							.then((presults) => {
								// console.log("Post Result:", presults);
								if (presults["affectedRows"] == 1) {
									//resolve(results["insertId"]);
									let collegeMetadata = {
										college_id: results["insertId"],
										page_title: collegeinfo.metaPageTitle,
										description: collegeinfo.metaDescription,
										keywords: collegeinfo.metaKeywords,
										og_title: collegeinfo.metaOgTitle,
										og_description: collegeinfo.metaOgDescription
									};
									mysqlService.query(superAdminConstant.COLLEGE_METADATA_SAVE, collegeMetadata)
										.then((mresults) => {
											// console.log("meta Result:", mresults);
											if (mresults["affectedRows"] == 1) {
												let collegeVsddata = {
													college_id: results["insertId"],
													vsd_title: collegeinfo.vsdTitle,
													vsd_name: collegeinfo.vsdName,
													vsd_short_bio: collegeinfo.vsdShortBio,
													school_message: collegeinfo.vsdMessage
												};
												mysqlService.query(superAdminConstant.COLLEGE_VSDDATA_SAVE, collegeVsddata)
													.then((mresults) => {
														// console.log("meta Result:", mresults);
														if (mresults["affectedRows"] == 1) {
															resolve(results["insertId"]);
														}
													}).catch((err) => {
														reject(new Error(err));
													});
											}
										}).catch((err) => {
											reject(new Error(err));
										});
								}
							}).catch((err) => {
								reject(new Error(err));
							});
					}
				}).catch((err) => {
					reject(new Error(err));
				});
		});
	}

	function editCollegeinfo(collegeinfo) {
		return new Promise(function (resolve, reject) {
			let calias = "";
			if(collegeinfo.collegeAlias){
				calias = collegeinfo.collegeAlias;
			}else{
				calias = stringUtil.collegeNameUrl(collegeinfo.collegeName);
			}
			let collegeName = "";
			if(collegeinfo.collegeName){
				collegeName =  stringUtil.manageCollegeName(collegeinfo.collegeName);
			}
			let updateQuery = 'UPDATE `colleges` SET college_name = "' + collegeName + '",college_alias = "' + calias + '", seo_name = "' + collegeinfo.seoName + '",college_abbreviation = "'+ collegeinfo.collegeAbbreviation +'",college_common_name = "' + collegeinfo.collegeCommonName +'",address = "' + collegeinfo.collegeAddress + '",city="' + collegeinfo.collegeCity + '",state="' + collegeinfo.collegeState + '",postal_code="' + collegeinfo.collegePostalCode + '",contact_email="' + collegeinfo.collegeContactEmail + '",website="' + collegeinfo.collegeWebsite + '",phone_number="' + collegeinfo.collegePhoneNumber + '",fax_number="' + collegeinfo.collegeFaxNumber + '",include_app_state="' + collegeinfo.appStateValue + '",include_legion_state="' + collegeinfo.legionStateValue + '",include_flow_state="' + collegeinfo.flowStateValue + '",include_military_state="' + collegeinfo.militaryStateValue + '",search_online_display="' + collegeinfo.onlineDisplay + '",update_lock="' + collegeinfo.updateLock + '",phone_required="' + collegeinfo.phoneRequired + '",show_parent_child="' + collegeinfo.showParentChild + '",parent_id='+collegeinfo.parentId+' WHERE id = ' + collegeinfo.collegeId;
			mysqlService.query(updateQuery)
				.then(function (response) {
					if (response) {
						let collegeprofileEdit = {
							in_state_tuition: collegeinfo.inStateTuition,
							out_state_tuition: collegeinfo.outStateTuition,
							gender_preference: collegeinfo.genderPreference,
							student_population: collegeinfo.studentPopulation,
							female_student_count: collegeinfo.femaleStudentCount,
							male_student_count: collegeinfo.maleStudentCount,
							religious_affiliation: collegeinfo.religiousAffiliation,
							ethnic_affiliation: collegeinfo.ethnicAffiliation,
							years_offered: collegeinfo.yearsOffered,
							act_score: collegeinfo.actScore,
							veteran_affairs_address: collegeinfo.veteranAffairsAddress,
							veteran_affairs_phone: collegeinfo.veteranAffairsPhone,
							veteran_affairs_fax: collegeinfo.veteranAffairsFax,
							veteran_affairs_email: collegeinfo.veteranAffairsEmail,
							veteran_affairs_website: collegeinfo.veteranAffairsWebsite,
							overview: collegeinfo.overview,
							college_overview: collegeinfo.college_overview,
							display_text: collegeinfo.displayText,
							yellow_ribbon_coverage: collegeinfo.yellowRibbonCoverage,
							in_state_costpercredit: collegeinfo.inStateCostpercredit,
							out_state_costpercredit: collegeinfo.outStateCostpercredit,
							cpch_undergraduate_campus: collegeinfo.cpchUndergraduateCampus,
							cpch_undergraduate_online: collegeinfo.cpchUndergraduateOnline,
							cpch_graduate_campus: collegeinfo.cpchGraduateCampus,
							cpch_graduate_online: collegeinfo.cpchGraduateOnline,
							tuition_cpch: collegeinfo.tuitionCpch,
							updated_by: collegeinfo.adminId,
							updated_user: collegeinfo.adminType,
							graduation_rate: collegeinfo.graduationRate ? collegeinfo.graduationRate : '',
							placement_rate: collegeinfo.placementRate ? collegeinfo.placementRate : '',
							avg_immediate_salary: collegeinfo.averageImmediateSalary ? collegeinfo.averageImmediateSalary : '',
							gmat_score: collegeinfo.gmatScore ? collegeinfo.gmatScore : '',
							mycaa: collegeinfo.myCAA ? collegeinfo.myCAA : '',
							rotc_overview: collegeinfo.rotcOverview ? collegeinfo.rotcOverview : '',
						}
						/*let profileupdateQuery = "UPDATE `college_profiles` SET in_state_tuition = '"+collegeinfo.inStateTuition+"',out_state_tuition = '"+collegeinfo.outStateTuition+"',gender_preference = '"+collegeinfo.genderPreference+"',student_population = '"+collegeinfo.studentPopulation+"',female_student_count = '"+collegeinfo.femaleStudentCount+"',male_student_count = '"+collegeinfo.maleStudentCount+"',religious_affiliation = '"+collegeinfo.religiousAffiliation+"',ethnic_affiliation = '"+collegeinfo.ethnicAffiliation+"',years_offered = '"+collegeinfo.yearsOffered+"',act_score = '"+collegeinfo.actScore+"',veteran_affairs_address = '"+collegeinfo.veteranAffairsAddress+"',veteran_affairs_phone = '"+collegeinfo.veteranAffairsPhone+"',veteran_affairs_fax = '"+collegeinfo.veteranAffairsFax+"',veteran_affairs_email = '"+collegeinfo.veteranAffairsEmail+"',veteran_affairs_website = '"+collegeinfo.veteranAffairsWebsite+"',overview ='"+collegeinfo.overview+"',display_text ='"+collegeinfo.displayText+"' WHERE college_id = "+collegeinfo.collegeId;*/
						//console.log("WW:",profileupdateQuery);
						mysqlService.query("UPDATE college_profiles SET ? WHERE college_id = ?", [collegeprofileEdit, collegeinfo.collegeId])
							.then(function (response1) {
								// resolve("success");
								if (response1) {
									//resolve("success");
									let collegeMetadataEdit = {
										page_title: collegeinfo.metaPageTitle,
										description: collegeinfo.metaDescription,
										keywords: collegeinfo.metaKeywords,
										og_title: collegeinfo.metaOgTitle,
										og_description: collegeinfo.metaOgDescription
									}
									mysqlService.query("UPDATE college_metadata SET ? WHERE college_id = ?", [collegeMetadataEdit, collegeinfo.collegeId])
										.then(function (response2) {
											if(response2){
												let collegeVsddataEdit = {
													vsd_title: collegeinfo.vsdTitle,
													vsd_name: collegeinfo.vsdName,
													vsd_short_bio: collegeinfo.vsdShortBio,
													school_message: collegeinfo.vsdMessage
												}
												mysqlService.query("select count(id) as total from college_vsd where college_id="+collegeinfo.collegeId)
													.then(function (response3) {
														//resolve("success");
														if(response3[0]["total"] == 1){
															mysqlService.query("UPDATE college_vsd SET ? WHERE college_id = ?", [collegeVsddataEdit, collegeinfo.collegeId])
															.then(function (response4) {
																if(response4) {
																	resolve("Success")
																}
															}, function (err) {
																if (err) {
																	var error = err;
																	error.status = 503;
																	return reject(error)
																};
															});
														}else{
															let collegeVsddataAdd = {
																college_id: collegeinfo.collegeId,
																vsd_title: collegeinfo.vsdTitle,
																vsd_name: collegeinfo.vsdName,
																vsd_short_bio: collegeinfo.vsdShortBio,
																school_message: collegeinfo.vsdMessage
															}
															mysqlService.query(superAdminConstant.COLLEGE_VSDDATA_SAVE, collegeVsddataAdd)
															.then((mresults) => {
																resolve("success");
															}).catch((err) => {
																reject(new Error(err));
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
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function accessEditCollegeinfo(collegeinfo) {
		return new Promise(function (resolve, reject) {
			let updateQuery = "";
			if(collegeinfo.access_level == "Patriot") {
				let sourround_state = ` SELECT sourrounding_statevalue FROM state_sourrounding WHERE state_value = '${collegeinfo.state}' `;
				mysqlService.query(sourround_state).then(async function (soresponse) {
					let stateData = "";
					if(soresponse.length > 0 && soresponse[0].sourrounding_statevalue){
						stateData = collegeinfo.state+","+soresponse[0].sourrounding_statevalue;
					}else{
						stateData = collegeinfo.state;
					}
					updateQuery = 'UPDATE `colleges` SET access_level="' + collegeinfo.access_level + '",include_app_state="' + stateData +'",include_legion_state="' + stateData + '",include_flow_state="' + stateData + '",include_military_state="' + stateData + '" WHERE id = ' + collegeinfo.collegeId;
					mysqlService.query(updateQuery)
					.then(function (response) {
						if (response) {
							if(collegeinfo.status){
								mysqlService.query('UPDATE college_metadata SET status="' + collegeinfo.status + '" WHERE college_id ="' + collegeinfo.collegeId + '"')
								.then(function (response1) {
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
				})
			} else {
				if (collegeinfo.access_level) {
					if(collegeinfo.access_level != "Patriot"){
						updateQuery = 'UPDATE `colleges` SET access_level="' + collegeinfo.access_level + '",include_app_state="",include_legion_state="",include_flow_state="",include_military_state="" WHERE id = ' + collegeinfo.collegeId;
					}
				} else if (collegeinfo.college_type) {
					if(collegeinfo.college_type == 'online'){
						updateQuery = 'UPDATE `colleges` SET college_type="' + collegeinfo.college_type + '",include_app_state="AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,PR,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY",include_legion_state="AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,PR,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY",include_flow_state="AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,PR,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY",include_military_state="AL,AK,AZ,AR,CA,CO,CT,DE,DC,FL,GA,HI,ID,IL,IN,IA,KS,KY,LA,ME,MD,MA,MI,MN,MS,MO,MT,NE,NV,NH,NJ,NM,NY,NC,ND,OH,OK,OR,PA,PR,RI,SC,SD,TN,TX,UT,VT,VA,WA,WV,WI,WY",search_online_display="No" WHERE id = ' + collegeinfo.collegeId;
					}else{
						updateQuery = 'UPDATE `colleges` SET college_type="' + collegeinfo.college_type + '",include_app_state="",include_legion_state="",include_flow_state="",include_military_state="" WHERE id = ' + collegeinfo.collegeId;
					}
					//updateQuery = 'UPDATE `colleges` SET college_type="' + collegeinfo.college_type + '" WHERE id = ' + collegeinfo.collegeId;
				} else {
					updateQuery = 'UPDATE `colleges` SET status="' + collegeinfo.status + '" WHERE id = ' + collegeinfo.collegeId;
				}
				
				mysqlService.query(updateQuery)
					.then(function (response) {
						if (response) {
							if(collegeinfo.status){
								mysqlService.query('UPDATE college_metadata SET status="' + collegeinfo.status + '" WHERE college_id ="' + collegeinfo.collegeId + '"')
								.then(function (response1) {
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
			}
		});
	}

	function collegeSearchData(filterdata) {
		return new Promise(function (resolve, reject) {
			let queryFilters = '';
			let searchQuery = "Select * from  colleges Where status='ACTIVE' ";

			if (filterdata.searchText) {
				let stext = filterdata.searchText.trim();
				queryFilters += " AND (college_name LIKE '" + stext + "%' OR city LIKE '" + stext + "%')";
			}

			if (filterdata.state) {
				queryFilters += " AND (state = '" + filterdata.state + "')";
			}

			if(filterdata.collegeId) {
				queryFilters += ` AND (id = ${filterdata.collegeId})`
			}

			queryFilters += " ORDER BY college_name ASC";
			mysqlService.query(searchQuery + queryFilters)
				.then(function (response) {
					resolve(superAdminCollegeListModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function saveNationalList(nationalData) {
		return new Promise(function (resolve, reject) {
			updateNationalOrder(nationalData).then(function (response) {
				if (response == "success") {
					let collegeId = "";
					for (let i = 0; i < nationalData.length; i++) {
						if (i == nationalData.length - 1) {
							collegeId += nationalData[i].id;
						} else {
							collegeId += nationalData[i].id + ",";
						}
					}
					let deleteQuery = "DELETE FROM default_colleges WHERE college_type='national' AND college_id NOT IN(" + collegeId + ")";
					mysqlService.query(deleteQuery).then(function (response1) {
						resolve("success");
					}, function (err) {
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
				} else {
					resolve("Fail");
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

	function updateNationalOrder(nationalData) {
		return new Promise(function (resolve, reject) {
			for (let i = 0; i < nationalData.length; i++) {
				let searchQuery = "Select count(id) as total from  default_colleges Where college_type='national' and college_id=" + nationalData[i].id;
				let orderData = nationalData[i].order + 1;
				mysqlService.query(searchQuery)
					.then(function (response) {
						if (response[0].total == 1) {
							let updateQuery = 'UPDATE `default_colleges` SET display_order="' + orderData + '", date_updated = "' + moment(new Date()).format('YYYY-MM-DD HH:mm:ss') + '" WHERE college_type="national" and college_id = ' + nationalData[i].id;
							mysqlService.query(updateQuery)
								.then(function (response1) {
									resolve("success");
								}, function (err) {
									if (err) {
										var error = err;
										error.status = 503;
										return reject(error)
									};
								});
						} else {
							let insertQuery = 'INSERT INTO `default_colleges` SET display_order = "' + orderData + '",college_type = "national",college_id = ' + nationalData[i].id + ', state_name="", date_updated = "' + moment(new Date()).format('YYYY-MM-DD HH:mm:ss') + '"';
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
						resolve("success");
					}, function (err) {
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
			}
		});
	}

	function saveStateList(stateData) {
		return new Promise(function (resolve, reject) {
			updateStateOrder(stateData).then(function (response) {
				if (response == "success") {
					let collegeId = "";
					for (let i = 0; i < stateData.statelist.length; i++) {
						if (i == stateData.statelist.length - 1) {
							collegeId += stateData.statelist[i].id;
						} else {
							collegeId += stateData.statelist[i].id + ",";
						}
					}
					if (collegeId) {
						let deleteQuery = "DELETE FROM default_colleges WHERE college_type='state' AND state_name='" + stateData.state + "' AND college_id NOT IN(" + collegeId + ")";
						mysqlService.query(deleteQuery).then(function (response1) {
							resolve("success");
						}, function (err) {
							if (err) {
								var error = err;
								error.status = 503;
								return reject(error)
							};
						});
					} else {
						let deleteQuery = "DELETE FROM default_colleges WHERE college_type='state' AND state_name='" + stateData.state + "'";
						mysqlService.query(deleteQuery).then(function (response1) {
							resolve("success");
						}, function (err) {
							if (err) {
								var error = err;
								error.status = 503;
								return reject(error)
							};
						});
					}
					resolve("success");
				} else {
					resolve("Fail");
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

	const updateStateOrder = async (stateData) => {
		try {
			await Promise.all(stateData.statelist.map(async (state, i) => {
				let searchQuery = "Select count(id) as total from  default_colleges Where college_type='state' and state_name='" + stateData.state + "' and college_id=" + state.id;
				let orderData = state.order + 1;
				let result = mysqlService.query(searchQuery).then(function (response) {
					if (response[0].total == 1) {
						let updateQuery = 'UPDATE `default_colleges` SET display_order="' + orderData + '", state_name="' + stateData.state + '" , date_updated = "' + moment(new Date()).format('YYYY-MM-DD HH:mm:ss') + '" WHERE college_type="state" and college_id = ' + state.id;
						mysqlService.query(updateQuery)
							.then(function (response1) {
								return "success";
							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return error;
								};
							});
					} else {
						let insertQuery = 'INSERT INTO `default_colleges` SET display_order = "' + orderData + '", state_name="' + stateData.state + '", college_type = "state",college_id = ' + state.id + ', date_updated = "' + moment(new Date()).format('YYYY-MM-DD HH:mm:ss') + '"';
						mysqlService.query(insertQuery)
							.then(function (response1) {
								return "success";
							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return error;
								};
							});
					}
				})
			}))
			return "success";
		} catch (error) {
			return error;
		}

		//return new Promise(function(resolve, reject) {
		//console.log("SS:",stateData.state);
		//console.log("Data:",stateData.statelist);
		/*for(let i=0;i<stateData.statelist.length;i++){
			let searchQuery = "Select count(id) as total from  default_colleges Where college_type='state' and state_name='"+stateData.state+"' and college_id="+stateData.statelist[i].id;
			console.log("SS:",searchQuery);
			let orderData = stateData.statelist[i].order+1;
			mysqlService.query(searchQuery)
			.then(function(response){
				if(response[0].total == 1){
					let updateQuery = 'UPDATE `default_colleges` SET display_order="'+orderData+'", state_name="'+stateData.state+'" , date_updated = "'+moment(new Date()).format('YYYY-MM-DD h:mm:ss')+'" WHERE college_type="state" and college_id = '+stateData.statelist[i].id;
					console.log("UD:",updateQuery);
					mysqlService.query(updateQuery)
					.then(function(response1){
						resolve("success");
					},function(err){  
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
				}else{
					let insertQuery = 'INSERT INTO `default_colleges` values display_order = "'+orderData+'", state_name="'+stateData.state+'", college_type = "state",college_id = '+stateData.statelist[i].id+', date_updated = "'+moment(new Date()).format('YYYY-MM-DD h:mm:ss')+'"';
					console.log("IN:",insertQuery);
					mysqlService.query(insertQuery)
					.then(function(response1){
						resolve("success");
					},function(err){  
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
				}
				resolve("success");
			},function(err){  
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		}*/
		//});
	}

	function listStateWiseCollegesCount() {
		return new Promise(function (resolve, reject) {

			let listQuery = "SELECT count(college_id) as cid,state_name FROM `default_colleges` WHERE college_type='state' GROUP BY state_name";

			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(superadminStateModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function manageCollegeBucketRelation(){
		return new Promise(function(resolve, reject) {
			let vetlist = "SELECT cm.cr_id,cm.aw_level,cm.gov_id,cm.status,(SELECT bucket_primary_degree_id FROM bucket_secondary_degree_list WHERE major_id=cm.major_id) as primary_bucket_id,(SELECT bucket_secondary_degree_id FROM bucket_secondary_degree_list WHERE major_id=cm.major_id) as secondary_bucket_id FROM `college_majors_new` as cm order by id ASC";
			
			mysqlService.query(vetlist)
			.then(function(response){
				//resolve(reportCommunicationstatModel(response));
				let insertQuery = "";
      			insertQuery = "Insert into college_bucket_relation (college_id,primary_bucket_id,secondary_bucket_id,aw_level,gov_id,status) values ";
				for (let i = 0; i < response.length; i++) {
					let primaryBucketId = 0;
					let secondaryBucketId = 0;
					if(response[i].primary_bucket_id != null && response[i].secondary_bucket_id != null){
						primaryBucketId = response[i].primary_bucket_id;
						secondaryBucketId = response[i].secondary_bucket_id;
					}
					if(i == response.length - 1){
						if(response[i-1].cr_id == response[i].cr_id && response[i-1].aw_level == response[i].aw_level && response[i-1].primary_bucket_id == response[i].primary_bucket_id && response[i-1].secondary_bucket_id == response[i].secondary_bucket_id){
							insertQuery+= ";";
						}else{
							insertQuery+= "("+response[i].cr_id+","+primaryBucketId+","+secondaryBucketId+","+response[i].aw_level+","+response[i].gov_id+",'"+response[i].status+"');";
						}
					}else{
						if(i != 0){
							if(response[i-1].cr_id == response[i].cr_id && response[i-1].aw_level == response[i].aw_level && response[i-1].primary_bucket_id == response[i].primary_bucket_id && response[i-1].secondary_bucket_id == response[i].secondary_bucket_id){
								insertQuery+= "";
							}else{
								insertQuery+= "("+response[i].cr_id+","+primaryBucketId+","+secondaryBucketId+","+response[i].aw_level+","+response[i].gov_id+",'"+response[i].status+"'),";
							}
						}else{
							insertQuery+= "("+response[i].cr_id+","+primaryBucketId+","+secondaryBucketId+","+response[i].aw_level+","+response[i].gov_id+",'"+response[i].status+"'),";
						}
					}
				}
				let checkstr = insertQuery.substr(insertQuery.length-2, 1);
				if(checkstr == ","){
					insertQuery = insertQuery.slice(0, -2)+";";
				}
				//console.log("PP:",insertQuery);
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

	function manageCollegeBucketRelationPartial(){
		return new Promise(function(resolve, reject) {
			let qqlist = "SELECT count(id) as total FROM college_majors_new";
			mysqlService.query(qqlist)
			.then(async function(response1){
				let totalData = response1[0]['total'];
				//console.log("PP:",totalData);
				let noLoop = totalData/10000;
				//console.log("Noloop:",noLoop);
				//console.log("Int:",parseInt(noLoop));
				let checkresidue = totalData%10000;
				//console.log("RR:",checkresidue);
				let pageTotal = 0;
				if(checkresidue != 0){
					pageTotal = parseInt(noLoop)+1;
				}else{
					pageTotal = parseInt(noLoop);
				}
				//console.log("PT:",pageTotal);
				for(let j=1;j<=pageTotal;j++){
					let lowerLimit = 0;
					let upperLimit = 0;
					if(j==1){
						lowerLimit = 0;
						upperLimit = 10000;
					}else if(j < pageTotal){
						lowerLimit = (j-1)*10000;
						upperLimit = 10000;
					}else{
						lowerLimit = (j-1)*10000;
						upperLimit = checkresidue;
					}

					
					await InsertCollegeBucketData(j,lowerLimit,upperLimit);
					
				}
				resolve("success");
			},function(err){  
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		});	
	}

	async function InsertCollegeBucketData(page,lowerLimit,upperLimit){
		return new Promise(function(resolve, reject) {
			//console.log("pp:",page);
			//console.log("ll:",lowerLimit);
			let vetlist = "SELECT cm.cr_id,cm.aw_level,cm.gov_id,cm.status,(SELECT bucket_primary_degree_id FROM bucket_secondary_degree_list WHERE major_id=cm.major_id) as primary_bucket_id,(SELECT bucket_secondary_degree_id FROM bucket_secondary_degree_list WHERE major_id=cm.major_id) as secondary_bucket_id FROM `college_majors_new` as cm order by id ASC LIMIT "+lowerLimit+","+upperLimit;
			
					mysqlService.query(vetlist)
					.then(function(response){
						//resolve(reportCommunicationstatModel(response));
						let insertQuery = "";
						insertQuery = "Insert into college_bucket_relation (college_id,primary_bucket_id,secondary_bucket_id,aw_level,gov_id,status) values ";
						for (let i = 0; i < response.length; i++) {
							let primaryBucketId = 0;
							let secondaryBucketId = 0;
							if(response[i].primary_bucket_id != null && response[i].secondary_bucket_id != null){
								primaryBucketId = response[i].primary_bucket_id;
								secondaryBucketId = response[i].secondary_bucket_id;
							}
							if(i == response.length - 1){
								if(response[i-1].cr_id == response[i].cr_id && response[i-1].aw_level == response[i].aw_level && response[i-1].primary_bucket_id == response[i].primary_bucket_id && response[i-1].secondary_bucket_id == response[i].secondary_bucket_id){
									insertQuery+= ";";
								}else{
									insertQuery+= "("+response[i].cr_id+","+primaryBucketId+","+secondaryBucketId+","+response[i].aw_level+","+response[i].gov_id+",'"+response[i].status+"');";
								}
							}else{
								if(i != 0){
									if(response[i-1].cr_id == response[i].cr_id && response[i-1].aw_level == response[i].aw_level && response[i-1].primary_bucket_id == response[i].primary_bucket_id && response[i-1].secondary_bucket_id == response[i].secondary_bucket_id){
										insertQuery+= "";
									}else{
										insertQuery+= "("+response[i].cr_id+","+primaryBucketId+","+secondaryBucketId+","+response[i].aw_level+","+response[i].gov_id+",'"+response[i].status+"'),";
									}
								}else{
									insertQuery+= "("+response[i].cr_id+","+primaryBucketId+","+secondaryBucketId+","+response[i].aw_level+","+response[i].gov_id+",'"+response[i].status+"'),";
								}
							}
						}
						let checkstr = insertQuery.substr(insertQuery.length-2, 1);
						if(checkstr == ","){
							insertQuery = insertQuery.slice(0, -2)+";";
						}
						
						//console.log("PP:",insertQuery);
						mysqlService.query(insertQuery)
							.then(function (response1) {
								console.log("Execute:",page);
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

	function manageStudentBucketRelation(){
		return new Promise(function(resolve, reject) {
			let vetlist = "SELECT cm.student_id,(SELECT bucket_primary_degree_id FROM bucket_secondary_degree_list WHERE major_id=cm.major_id) as primary_bucket_id,(SELECT bucket_secondary_degree_id FROM bucket_secondary_degree_list WHERE major_id=cm.major_id) as secondary_bucket_id FROM `student_degree_relation` as cm order by id ASC";
			
			mysqlService.query(vetlist)
			.then(function(response){
				//resolve(reportCommunicationstatModel(response));
				let insertQuery = "";
      			insertQuery = "Insert into student_bucket_relation (student_id,primary_bucket_id,secondary_bucket_id) values ";
				for (let i = 0; i < response.length; i++) {
					let primaryBucketId = 0;
					let secondaryBucketId = 0;
					if(response[i].primary_bucket_id != null && response[i].secondary_bucket_id != null){
						primaryBucketId = response[i].primary_bucket_id;
						secondaryBucketId = response[i].secondary_bucket_id;
					}
					if(i == response.length - 1){
						if(response[i-1].student_id == response[i].student_id && response[i-1].primary_bucket_id == response[i].primary_bucket_id && response[i-1].secondary_bucket_id == response[i].secondary_bucket_id){
							insertQuery+= ";";
						}else{
							insertQuery+= "('"+response[i].student_id+"',"+primaryBucketId+","+secondaryBucketId+");";
						}
					}else{
						if(i != 0){
							if(response[i-1].student_id == response[i].student_id && response[i-1].primary_bucket_id == response[i].primary_bucket_id && response[i-1].secondary_bucket_id == response[i].secondary_bucket_id){
								insertQuery+= "";
							}else{
								insertQuery+= "('"+response[i].student_id+"',"+primaryBucketId+","+secondaryBucketId+"),";
							}
						}else{
							insertQuery+= "('"+response[i].student_id+"',"+primaryBucketId+","+secondaryBucketId+"),";
						}
					}
				}
				let checkstr = insertQuery.substr(insertQuery.length-2, 1);
				if(checkstr == ","){
					insertQuery = insertQuery.slice(0, -2)+";";
				}
				//console.log("PP:",insertQuery);
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

	function listCollegeContacts() {
		return new Promise(function (resolve, reject) {

			let listQuery = 'Select cc.*,c.college_name from college_contacts cc left join colleges c on cc.college_id=c.id order by college_name ASC';
			//console.log("QQ:",listQuery);
			mysqlService.query(listQuery)
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

	function editCollegeContacts(collegeId){
		return new Promise(function (resolve, reject) {

			let editQuery = 'Select cc.*,c.college_name from college_contacts cc left join colleges c on cc.college_id=c.id where cc.college_id='+collegeId;
			//console.log("QQ:",editQuery);
			mysqlService.query(editQuery)
				.then(function (response) {
					resolve(collegeContactsModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function collegeContactsData(contactsData){
		return new Promise(function (resolve, reject) {
		let collegeContactsEdit = {
			admission_email_address_1: contactsData.admissionEmailAddress1,
			admission_email_address_2: contactsData.admissionEmailAddress2,
			vet_affairs_email_address: contactsData.vetAffairsEmailAddress,
			marketing_email_address1: contactsData.marketingEmailAddress1,
			marketing_email_address_2: contactsData.marketingEmailAddress2,
			contact_extra1: contactsData.collegeContactExtra1,
			contact_extra2: contactsData.collegeContactExtra2,
			contact_extra3: contactsData.collegeContactExtra3,
			contact_extra4: contactsData.collegeContactExtra4,
			contact_extra5: contactsData.collegeContactExtra5,
			inquiry_admission_email1: contactsData.inquiryAdmissionEmail1,
			inquiry_admission_email2: contactsData.inquiryAdmissionEmail2,
			inquiry_vet_affairs_email: contactsData.inquiryVetAffairsEmail,
			inquiry_marketing_email1: contactsData.inquiryMarketingEmail1,
			inquiry_marketing_email2: contactsData.inquiryMarketingEmail2,
			inquiry_contact_extra1: contactsData.inquiryContractExtra1,
			inquiry_contact_extra2: contactsData.inquiryContractExtra2,
			inquiry_contact_extra3: contactsData.inquiryContractExtra3,
			inquiry_contact_extra4: contactsData.inquiryContractExtra4,
			inquiry_contact_extra5: contactsData.inquiryContractExtra5
		}
		let checkQuery = "select count(id) as total from college_contacts where college_id='" + contactsData.collegeId + "'";
		mysqlService.query(checkQuery)
			.then(function (response) {
				if(response[0].total == 0){
					addCollegeContactsData(contactsData).then(function (response1) {
						resolve(response1);
					}, function (err) {
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					})
				}else{
					mysqlService.query("UPDATE college_contacts SET ? WHERE college_id = ?", [collegeContactsEdit, contactsData.collegeId])
					.then(function (response) {
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
			})
		});
	}

	function addCollegeContactsData(contactsData){
		return new Promise(function (resolve, reject) {
		let collegeContactsEdit = {
			name: contactsData.collegeName,
			college_id: contactsData.collegeId,
			state: contactsData.stateName,
			admission_email_address_1: contactsData.admissionEmailAddress1,
			admission_email_address_2: contactsData.admissionEmailAddress2,
			vet_affairs_email_address: contactsData.vetAffairsEmailAddress,
			marketing_email_address1: contactsData.marketingEmailAddress1,
			marketing_email_address_2: contactsData.marketingEmailAddress2,
			contact_extra1: contactsData.collegeContactExtra1,
			contact_extra2: contactsData.collegeContactExtra2,
			contact_extra3: contactsData.collegeContactExtra3,
			contact_extra4: contactsData.collegeContactExtra4,
			contact_extra5: contactsData.collegeContactExtra5
		}

		
		mysqlService.query("INSERT INTO college_contacts SET ?", collegeContactsEdit)
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

	function listCollegeImageInfoList() {
		return new Promise(function (resolve, reject) {

			let listQuery = 'SELECT id,(SELECT college_name FROM colleges WHERE id=college_id) as collegename,image_type,height,width,size,upload_date,college_id,(SELECT college_user_email FROM college_users WHERE uuid=college_user_id) as collegeadmin,(SELECT admin_user_email FROM admin_users WHERE uuid=college_user_id) as admin FROM college_image_info ORDER BY upload_date DESC';
			//console.log("QQ:",listQuery);
			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(collegeImageInfoModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}
	
	function listStateWiseBounceCollegesCount() {
		return new Promise(function (resolve, reject) {

			let listQuery = "SELECT count(college_id) as cid,state_name FROM `bounce_colleges` WHERE college_type='state' GROUP BY state_name";

			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(superadminStateModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function listCollegesBounceByState(state) {
		return new Promise(function (resolve, reject) {
			let listQuery = "";
			if (state == "all") {
				listQuery = 'Select id, college_name,contact_email from colleges where status="ACTIVE" order by college_name ASC';
			} else {
				//listQuery = 'Select id,college_name from colleges where status="ACTIVE" and state="' + state + '" and college_type="traditional" union  Select id,college_name from colleges where status="ACTIVE" and and college_type = "online" or (include_app_state like "%' + state + '%") order by college_name ASC';
				listQuery = 'Select id,college_name from colleges where status="ACTIVE" and state="' + state + '" and college_type="traditional" and include_app_state like "%' + state + '%"  order by college_name ASC';
			}
			//console.log("QQ:",listQuery);
			mysqlService.query(listQuery)
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

	function listNationalBounceCollegesData() {
		return new Promise(function (resolve, reject) {

			let listQuery = 'SELECT dc.*,HTML_UnEncode(c.college_name) as collegeName FROM bounce_colleges as dc LEFT JOIN colleges as c on dc.college_id = c.id WHERE dc.college_type="national" ORDER BY dc.display_order ASC';

			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(collegeOrderModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function saveNationalBounceList(nationalData) {
		return new Promise(function (resolve, reject) {
			updateNationalBounceOrder(nationalData).then(function (response) {
				if (response == "success") {
					let collegeId = "";
					for (let i = 0; i < nationalData.length; i++) {
						if (i == nationalData.length - 1) {
							collegeId += nationalData[i].id;
						} else {
							collegeId += nationalData[i].id + ",";
						}
					}
					let deleteQuery = "DELETE FROM bounce_colleges WHERE college_type='national' AND college_id NOT IN(" + collegeId + ")";
					mysqlService.query(deleteQuery).then(function (response1) {
						resolve("success");
					}, function (err) {
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
				} else {
					resolve("Fail");
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

	function updateNationalBounceOrder(nationalData) {
		return new Promise(function (resolve, reject) {
			for (let i = 0; i < nationalData.length; i++) {
				let searchQuery = "Select count(id) as total from  bounce_colleges Where college_type='national' and college_id=" + nationalData[i].id;
				let orderData = nationalData[i].order + 1;
				mysqlService.query(searchQuery)
					.then(function (response) {
						if (response[0].total == 1) {
							let updateQuery = 'UPDATE `bounce_colleges` SET display_order="' + orderData + '", date_updated = "' + moment(new Date()).format('YYYY-MM-DD HH:mm:ss') + '" WHERE college_type="national" and college_id = ' + nationalData[i].id;
							mysqlService.query(updateQuery)
								.then(function (response1) {
									resolve("success");
								}, function (err) {
									if (err) {
										var error = err;
										error.status = 503;
										return reject(error)
									};
								});
						} else {
							let insertQuery = 'INSERT INTO `bounce_colleges` SET display_order = "' + orderData + '",college_type = "national",college_id = ' + nationalData[i].id + ', state_name="", date_updated = "' + moment(new Date()).format('YYYY-MM-DD HH:mm:ss') + '"';
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
						resolve("success");
					}, function (err) {
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
			}
		});
	}

	function listStateBounceCollegesData(state) {
		return new Promise(function (resolve, reject) {

			let listQuery = 'SELECT dc.*,HTML_UnEncode(c.college_name) as collegeName FROM bounce_colleges as dc LEFT JOIN colleges as c on dc.college_id = c.id WHERE dc.state_name="' + state + '" AND dc.college_type="state" ORDER BY dc.display_order ASC';
			//console.log("JJ:",listQuery)
			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(collegeOrderModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function saveBounceStateList(stateData) {
		return new Promise(function (resolve, reject) {
			updateBounceStateOrder(stateData).then(function (response) {
				if (response == "success") {
					let collegeId = "";
					for (let i = 0; i < stateData.statelist.length; i++) {
						if (i == stateData.statelist.length - 1) {
							collegeId += stateData.statelist[i].id;
						} else {
							collegeId += stateData.statelist[i].id + ",";
						}
					}
					if (collegeId) {
						let deleteQuery = "DELETE FROM bounce_colleges WHERE college_type='state' AND state_name='" + stateData.state + "' AND college_id NOT IN(" + collegeId + ")";
						mysqlService.query(deleteQuery).then(function (response1) {
							resolve("success");
						}, function (err) {
							if (err) {
								var error = err;
								error.status = 503;
								return reject(error)
							};
						});
					} else {
						let deleteQuery = "DELETE FROM bounce_colleges WHERE college_type='state' AND state_name='" + stateData.state + "'";
						mysqlService.query(deleteQuery).then(function (response1) {
							resolve("success");
						}, function (err) {
							if (err) {
								var error = err;
								error.status = 503;
								return reject(error)
							};
						});
					}
					resolve("success");
				} else {
					resolve("Fail");
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

	const updateBounceStateOrder = async (stateData) => {
		try {
			await Promise.all(stateData.statelist.map(async (state, i) => {
				let searchQuery = "Select count(id) as total from  bounce_colleges Where college_type='state' and state_name='" + stateData.state + "' and college_id=" + state.id;
				let orderData = state.order + 1;
				let result = mysqlService.query(searchQuery).then(function (response) {
					if (response[0].total == 1) {
						let updateQuery = 'UPDATE `bounce_colleges` SET display_order="' + orderData + '", state_name="' + stateData.state + '" , date_updated = "' + moment(new Date()).format('YYYY-MM-DD HH:mm:ss') + '" WHERE college_type="state" and college_id = ' + state.id;
						mysqlService.query(updateQuery)
							.then(function (response1) {
								return "success";
							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return error;
								};
							});
					} else {
						let insertQuery = 'INSERT INTO `bounce_colleges` SET display_order = "' + orderData + '", state_name="' + stateData.state + '", college_type = "state",college_id = ' + state.id + ', date_updated = "' + moment(new Date()).format('YYYY-MM-DD HH:mm:ss') + '"';
						mysqlService.query(insertQuery)
							.then(function (response1) {
								return "success";
							}, function (err) {
								if (err) {
									var error = err;
									error.status = 503;
									return error;
								};
							});
					}
				})
			}))
			return "success";
		} catch (error) {
			return error;
		}
	}	

	function listCollegesBySearchText(stext) {
		return new Promise(function (resolve, reject) {

			let listQuery = "SELECT id,college_name from colleges where college_name LIKE '%" + stext + "%' and status='active' and specific_profile_id = 0";

			mysqlService.query(listQuery)
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

	function getUsersByBucketData(filter) {
		return new Promise(function (resolve, reject) {

			let levelQuery = ` and aa.level_id = ${filter.level_id} `;
			let bucketQuery = ` and aa.bucket_id = ${filter.bucket_id} `;
			let secBucketQuery = ` and aa.sb_id = ${filter.secondary_bucket_id} `;
			
			// let listQuery = `SELECT ss.date_created,ss.first_name,ss.last_name,sp.city,sp.state,sp.postal_code,
			// (SELECT title FROM levels WHERE id=sp.level_id) as degree_level,
			// (SELECT title FROM bucket_degree WHERE id=sp.bucket_id) as primary_bucket,
			// (SELECT GROUP_CONCAT(title) FROM bucket_secondary_degree WHERE id IN(sp.secondary_bucket_id)) as secondary_bucket,
			// (SELECT GROUP_CONCAT(mn.title) FROM bucket_secondary_degree_list as bs LEFT JOIN majors_new as mn ON bs.major_id=mn.id WHERE bs.bucket_primary_degree_id = sp.bucket_id ${filter.major_id ? majorQuery : ''} AND bs.bucket_secondary_degree_id IN (sp.secondary_bucket_id)) as degree_name 
			// FROM  students as ss LEFT JOIN student_profile as sp ON ss.uuid=sp.uuid WHERE ss.date_created > '2018-01-01'  and ss.user_account_status='active' `;
			// if(filter.bucket_id) {
			// 	listQuery += `and sp.bucket_id = ${filter.bucket_id} `
			// }
			// if(filter.secondary_bucket_id) {
			// 	listQuery += `and sp.secondary_bucket_id = ${filter.secondary_bucket_id} `
			// }

			// let listQuery = `SELECT count(aa.uuid) as stotal,aa.level_id,aa.bucket_id,aa.sb_id,(SELECT title FROM bucket_degree WHERE id = aa.bucket_id) as bucketTitle,(SELECT title from bucket_secondary_degree WHERE id = aa.sb_id) AS secBucketTitle,(SELECT title from levels WHERE id = aa.level_id) as levelTitle FROM (SELECT student_profile.uuid,student_profile.level_id,student_profile.bucket_id, SUBSTRING_INDEX(SUBSTRING_INDEX(student_profile.secondary_bucket_id, ',', numbers.n), ',', -1) sb_id FROM numbers INNER JOIN student_profile ON CHAR_LENGTH(student_profile.secondary_bucket_id) -CHAR_LENGTH(REPLACE(student_profile.secondary_bucket_id, ',', ''))>=numbers.n-1 WHERE student_profile.secondary_bucket_id <>  '' ${filter.level_id ? levelQuery : ''}  ${filter.bucket_id ? bucketQuery : ''}  ${filter.secondary_bucket_id ? secBucketQuery : ''} ORDER BY id, n) as aa LEFT JOIN students as ss ON ss.uuid=aa.uuid WHERE ss.user_account_status='active' GROUP BY aa.level_id,aa.bucket_id,aa.sb_id`;
			if(filter.dateFrom && filter.dateTo) {
				listQuery = `SELECT count(aa.uuid) as stotal,aa.level_id,aa.bucket_id,aa.sb_id,cc.ptotal,(SELECT title FROM bucket_degree WHERE id = aa.bucket_id) as bucketTitle,(SELECT title from bucket_secondary_degree WHERE id = aa.sb_id) AS secBucketTitle,(SELECT title from levels WHERE id = aa.level_id) as levelTitle FROM (SELECT
					student_profile.uuid,student_profile.level_id,student_profile.bucket_id,
					SUBSTRING_INDEX(SUBSTRING_INDEX(student_profile.secondary_bucket_id, ',', numbers.n), ',', -1) sb_id
				  	FROM
					numbers INNER JOIN student_profile
					ON CHAR_LENGTH(student_profile.secondary_bucket_id)
					   -CHAR_LENGTH(REPLACE(student_profile.secondary_bucket_id, ',', ''))>=numbers.n-1
					WHERE student_profile.secondary_bucket_id <> '' and student_profile.level_id <> '' 
				  	ORDER BY
					id, n) as aa LEFT JOIN students as ss ON ss.uuid=aa.uuid 
					JOIN
					(SELECT count(aa.uuid) as ptotal,aa.level_id,aa.bucket_id FROM (SELECT
					student_profile.uuid,student_profile.level_id,student_profile.bucket_id,
					SUBSTRING_INDEX(SUBSTRING_INDEX(student_profile.secondary_bucket_id, ',', numbers.n), ',', -1) sb_id
				  	FROM
					numbers INNER JOIN student_profile
					ON CHAR_LENGTH(student_profile.secondary_bucket_id)
					   -CHAR_LENGTH(REPLACE(student_profile.secondary_bucket_id, ',', ''))>=numbers.n-1
					WHERE student_profile.secondary_bucket_id <> ''
				  	ORDER BY
					id, n) as aa LEFT JOIN students as ss ON ss.uuid=aa.uuid WHERE ss.user_account_status='active' and date(ss.date_created) BETWEEN "${filter.dateFrom}" AND "${filter.dateTo}" GROUP BY aa.level_id,aa.bucket_id) as cc 
					ON cc.level_id = aa.level_id AND cc.bucket_id=aa.bucket_id 
					WHERE ss.user_account_status='active' and date(ss.date_created) BETWEEN "${filter.dateFrom}" AND "${filter.dateTo}"  ${filter.level_id ? levelQuery : ''}  ${filter.bucket_id ? bucketQuery : ''}  ${filter.secondary_bucket_id ? secBucketQuery : ''}  GROUP BY aa.level_id,aa.bucket_id,aa.sb_id`
			} else {
				dateSet = "2018-01-01";
				listQuery = `SELECT count(aa.uuid) as stotal,aa.level_id,aa.bucket_id,aa.sb_id,cc.ptotal,(SELECT title FROM bucket_degree WHERE id = aa.bucket_id) as bucketTitle,(SELECT title from bucket_secondary_degree WHERE id = aa.sb_id) AS secBucketTitle,(SELECT title from levels WHERE id = aa.level_id) as levelTitle FROM (SELECT
					student_profile.uuid,student_profile.level_id,student_profile.bucket_id,
					SUBSTRING_INDEX(SUBSTRING_INDEX(student_profile.secondary_bucket_id, ',', numbers.n), ',', -1) sb_id
				  	FROM
					numbers INNER JOIN student_profile
					ON CHAR_LENGTH(student_profile.secondary_bucket_id)
					   -CHAR_LENGTH(REPLACE(student_profile.secondary_bucket_id, ',', ''))>=numbers.n-1
					WHERE student_profile.secondary_bucket_id <> '' and student_profile.level_id <> '' 
				  	ORDER BY
					id, n) as aa LEFT JOIN students as ss ON ss.uuid=aa.uuid 
					JOIN
					(SELECT count(aa.uuid) as ptotal,aa.level_id,aa.bucket_id FROM (SELECT
					student_profile.uuid,student_profile.level_id,student_profile.bucket_id,
					SUBSTRING_INDEX(SUBSTRING_INDEX(student_profile.secondary_bucket_id, ',', numbers.n), ',', -1) sb_id
				  	FROM
					numbers INNER JOIN student_profile
					ON CHAR_LENGTH(student_profile.secondary_bucket_id)
					   -CHAR_LENGTH(REPLACE(student_profile.secondary_bucket_id, ',', ''))>=numbers.n-1
					WHERE student_profile.secondary_bucket_id <> ''
				  	ORDER BY
					id, n) as aa LEFT JOIN students as ss ON ss.uuid=aa.uuid WHERE ss.user_account_status='active' and ss.date_created > "${dateSet}" GROUP BY aa.level_id,aa.bucket_id) as cc 
					ON cc.level_id = aa.level_id AND cc.bucket_id=aa.bucket_id 
					WHERE ss.user_account_status='active' and ss.date_created > "${dateSet}" ${filter.level_id ? levelQuery : ''}  ${filter.bucket_id ? bucketQuery : ''}  ${filter.secondary_bucket_id ? secBucketQuery : ''} GROUP BY aa.level_id,aa.bucket_id,aa.sb_id`
			}
			//console.log("QQ:",listQuery);
			mysqlService.query(listQuery)
				.then( function (response) {
					resolve(degreeReportModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error);
					};
				});
		});
	}

	function saveNationalBounceTick(nationalCollege) {
		return new Promise(function (resolve, reject) {
			for(let i = 0; i<nationalCollege.length; i++) {
				let listQuery = `UPDATE bounce_colleges SET checked_college = '${nationalCollege[i].isTicked}' WHERE college_type='national' AND college_id = '${nationalCollege[i].collegeId}'`;
				
				mysqlService.query(listQuery)
					.then(function (response) {
						resolve(response)
					}, function (err) {
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
			}
		});
	}

	function saveSpecificCollegeName(newNameData) {
		return new Promise(function (resolve, reject) {

			let searchQuery = `SELECT COUNT(college_id) AS total FROM degree_specific_profile WHERE college_id = ${newNameData.collegeId} AND primary_bucket = ${newNameData.primaryBucket} AND secondary_bucket LIKE '${newNameData.secondaryBucket}'`;
			mysqlService.query(searchQuery)
			.then(function(sresponse) {
				if(sresponse[0].total == 1) {
					resolve("Error")
				} else {
					sendData = {
						college_id: newNameData.collegeId,
						level: newNameData.level,
						degree_specific_alias: newNameData.newCollegeAlias,
						college_name: newNameData.newCollegeName,
						primary_bucket: newNameData.primaryBucket,
						secondary_bucket: newNameData.secondaryBucket,
						degree_rule: newNameData.degreeRule,
						secondary_bucket_titles: newNameData.secondaryBucketTitles
					}
					let saveQuery = `INSERT INTO degree_specific_profile SET ?`;
					mysqlService.query(saveQuery, sendData)
					.then(function (response) {
						resolve("Success")
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

	function getSpecificCollegeName(type) {
		return new Promise(function (resolve, reject) {
			/*let getQuery = `SELECT dsp.id, dsp.college_id,dsp.degree_specific_alias, dsp.degree_rule, dsp.college_name,dsp.level, dsp.primary_bucket, dsp.secondary_bucket, dsp.secondary_bucket_titles, (SELECT title FROM bucket_degree WHERE id = dsp.primary_bucket) AS priBucket,(SELECT title FROM levels WHERE id = dsp.level AND status='ACTIVE') AS levelName, (SELECT college_name FROM colleges WHERE id = dsp.college_id) AS original_college_name FROM degree_specific_profile dsp;`;*/
			let getQuery = "SELECT id,secondary_bucket_titles,new_college_name,degree_specific_alias,degree_status,program_matcher_only,secondary_alias,(SELECT title FROM bucket_degree WHERE id = bucket_id) AS priBucket,(SELECT title FROM levels WHERE id = level_id AND status='ACTIVE') AS levelName, (SELECT college_name FROM colleges WHERE id = college_id) AS original_college_name FROM college_degree_specific_info ";
			if(type == 'active'){
				getQuery+= " where degree_status != 'disable'";
			}else{
				getQuery+= " where degree_status = 'disable'";
			}
			mysqlService.query(getQuery)
				.then(function (response) {
					resolve(dereeSpecificCollegeModel(response))
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
				};
			});
		});
	}

	function updateSpecificCollegeName(collegeData) {
		return new Promise(function (resolve, reject) {
			let updateQuery = `UPDATE degree_specific_profile SET college_id = ${collegeData.collegeId},level = ${collegeData.level}, primary_bucket = '${collegeData.primaryBucket}', secondary_bucket = '${collegeData.secondaryBucket}', college_name = "${collegeData.newCollegeName}", degree_specific_alias = "${collegeData.newCollegeAlias}", degree_rule =  "${collegeData.degreeRule}", secondary_bucket_titles = '${collegeData.secondaryBucketTitles}' WHERE id = ${collegeData.id}`;
			mysqlService.query(updateQuery)
			.then(function (response) {
				resolve("Success")
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		})
	}

	function deleteSpecificCollegeDegree(deleteData) {
		return new Promise(function (resolve, reject) {
			let updateQuery = `DELETE from degree_specific_collegeinfo WHERE college_id = ${deleteData.college_id} AND degree_id = ${deleteData.degree_id}`;
			mysqlService.query(updateQuery)
			.then(function (response) {
				resolve("Success")
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		})
	}

	function listSpecificCollegeDegree(CollegeId) {
		return new Promise(function (resolve, reject) {
			let updateQuery = "SELECT id,college_id,(select title from majors_new where id=degree_id) as degreename,degree_id,degree_desc,job_market_review,courses from degree_specific_collegeinfo WHERE college_id = "+CollegeId;
			mysqlService.query(updateQuery)
			.then(function (response) {
				resolve(collegeSpecificDegreeModel(response))
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		})
	}

	function listSpecificCollegeDegreeById(id) {
		return new Promise(function (resolve, reject) {
			let updateQuery = "SELECT id,college_id,(select title from majors_new where id=degree_id) as degreename,degree_id,degree_desc,job_market_review,courses from degree_specific_collegeinfo WHERE id = "+id;
			mysqlService.query(updateQuery)
			.then(function (response) {
				resolve(collegeSpecificDegreeModel(response))
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		})
	}

	function saveSpecificCollegeDegree(saveData){
		return new Promise(function (resolve, reject) {
			let saveQuery = "";
			if(saveData.action == "add"){
				let checkQuery = "SELECT count(id) as total FROM degree_specific_collegeinfo WHERE college_id="+saveData.collegeId+" and degree_id="+saveData.degreeId;
				mysqlService.query(checkQuery)
				.then(function (response) {
					if(response[0].total == 0){
						sendData = {
							college_id: saveData.collegeId,
							degree_id: saveData.degreeId,
							degree_desc: saveData.degreeDesc,
							job_market_review: saveData.jobMarketReview,
							courses: saveData.courses
						}
						saveQuery = `INSERT INTO degree_specific_collegeinfo SET ?`;
						mysqlService.query(saveQuery,sendData)
						.then(function (response) {
							resolve("Success");
						}, function (err) {
							if (err) {
								var error = err;
								error.status = 503;
								return reject(error)
							};
						});
					}else{
						resolve("Exist");
					}
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
			}else{
				let checkQuery = "SELECT count(id) as total FROM degree_specific_collegeinfo WHERE college_id="+saveData.collegeId+" and degree_id="+saveData.degreeId+" and id !="+saveData.id;
				//console.log("CC:",checkQuery);
				mysqlService.query(checkQuery)
				.then(function (response) {
					if(response[0].total == 0){
						specificEdit = {
							degree_id: saveData.degreeId,
							degree_desc: saveData.degreeDesc,
							job_market_review: saveData.jobMarketReview,
							courses: saveData.courses
						}
						mysqlService.query("UPDATE degree_specific_collegeinfo SET ? WHERE id = ?", [specificEdit, saveData.id])
						.then(function (response) {
							resolve("Success")
						}, function (err) {
							if (err) {
								var error = err;
								error.status = 503;
								return reject(error)
							};
						});
					}else{
						resolve("Exist");
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
	}

	function deleteCollegeSpecificDegree(id) {
		return new Promise(function (resolve, reject) {
			let updateQuery = "DELETE from degree_specific_collegeinfo WHERE id ="+id;
			mysqlService.query(updateQuery)
			.then(function (response) {
				resolve("success")
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		})
	}

	function addScholarshipData(saveData){
		return new Promise(function (resolve, reject) {
			let openDateFormat = "";
			let dateOpen = "";
			let dealineDateFormat = "";
			let deadlineDate = "";
			let dd = saveData.deadline.split("/");
			//open Date
			if(saveData.openDate != ""){
                let od = saveData.openDate.split("/");
                if(od.length == 2){
                    dateOpen = od[1]+"-"+od[0]+"-01";
                    openDateFormat = "mm/yyyy";
                }else{
                    dateOpen = od[2]+"-"+od[0]+"-"+od[1];
                    openDateFormat = "mm/dd/yyyy";
                }
            }else{
                openDateFormat = saveData.opendateFormat;
            }
			
			//deadline Date
			if(dd.length == 2){
				let odays = getDaysInMonth(dd[0],dd[1]);
				deadlineDate = dd[1]+"-"+dd[0]+"-"+odays;
				dealineDateFormat = "mm/yyyy";
			}else{
				deadlineDate = dd[2]+"-"+dd[0]+"-"+dd[1];
				dealineDateFormat = "mm/dd/yyyy";
			} 

			let scholarshipData = {};
			if(saveData.openDate != ""){
				scholarshipData = {
					scholarship_name: saveData.scholarshipName,
					recipients: saveData.recipients,
					award: saveData.award,
					detail: saveData.detail,
					check_military_branch: saveData.checkMilitaryBranch,
					check_military_status: saveData.checkMilitaryStatus,
					check_student_ethnic: saveData.checkStudentEthnic,
					check_student_disability: saveData.checkStudentDisability,
					check_academic_status: saveData.checkAcademicStatus,
					check_academic_level: saveData.checkAcademicLevel,
					check_degree_specific: saveData.checkDegreeSpecific,
					bucket_id: saveData.bucket_id,
					degree_id: saveData.degreeId,
					open_date_format: openDateFormat,
					open_date: saveData.openDate,
					opendate: dateOpen,
					date_format: dealineDateFormat,
					deadline: saveData.deadline,
					deadlinedate: deadlineDate,
					recurring_event: saveData.recurringEvent,
					website: saveData.website
				}
			}else{
				scholarshipData = {
					scholarship_name: saveData.scholarshipName,
					recipients: saveData.recipients,
					award: saveData.award,
					detail: saveData.detail,
					check_military_branch: saveData.checkMilitaryBranch,
					check_military_status: saveData.checkMilitaryStatus,
					check_student_ethnic: saveData.checkStudentEthnic,
					check_student_disability: saveData.checkStudentDisability,
					check_academic_status: saveData.checkAcademicStatus,
					check_academic_level: saveData.checkAcademicLevel,
					check_degree_specific: saveData.checkDegreeSpecific,
					bucket_id: saveData.bucket_id,
					degree_id: saveData.degreeId,
					open_date_format: openDateFormat,
					open_date: saveData.openDate,
					date_format: dealineDateFormat,
					deadline: saveData.deadline,
					deadlinedate: deadlineDate,
					recurring_event: saveData.recurringEvent,
					website: saveData.website
				}
			}
			
			saveQuery = `INSERT INTO scholarship_list SET ?`;
			mysqlService.query(saveQuery,scholarshipData)
			.then(function (response) {
				//console.log("RR:",response.insertId);
				insertScholarsipOption(saveData.militaryBranch,saveData.militaryStatus,saveData.studentEthnic,saveData.studentDisability,saveData.academicStatus,saveData.academicLevel,saveData.sex,response.insertId).then(function (response1) {
					resolve(response.insertId);
				}, function (err) {
					if (err) {
					  var error = err;
					  error.status = 503;
					  return reject(error)
					};
				  });
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		})
	}

	function getDaysInMonth(Month, Year) {
		return new Date((new Date(Year, Month, 1)) - 1).getDate();
	}

	function insertScholarsipOption(militaryBranch,militaryStatus,studentEthnic,studentDisability,academicStatus,academicLevel,sex,insertId){
		return new Promise(function (resolve, reject) {
			//if(data.length > 0){
				let insertQuery = "";
				insertQuery = "Insert into scholarship_pivot_dataoption (`scholarship_id`, `military_branch_army`, `military_branch_marine_corps`, `military_branch_navy`, `military_branch_air_force`, `military_branch_coast_guard`, `military_branch_space_force`, `military_branch_other`, `military_status_ams`, `military_status_veteran`, `military_status_ds`, `military_status_ng`, `military_status_reserve`, `military_status_retiree`, `military_status_dependent`, `dependent_ams`, `dependent_veteran`, `dependent_active_pow`, `dependent_dv`, `dependent_div`, `military_status_spouse`, `spouse_ams`, `spouse_veteran`, `spouse_active_pow`, `spouse_dv`, `spouse_div`, `military_status_dov`, `student_ethnic_aab`,`student_ethnic_ai`, `student_ethnic_ll`, `student_ethnic_mac`, `student_ethnic_aa`, `student_disability_bvi`, `student_disability_dhi`, `student_disability_ld`, `student_disability_pd`, `academic_status_high_school`,`academic_status_student_undergraduate`, `academic_status_student_graduate`, `academic_status_other`, `academic_level_undergraduate`, `academic_level_post_graduate`, `academic_level_certificate`, `academic_level_trade_vocational`, `academic_level_other`, `sex_male`, `sex_female`, `sex_non_binary`, `sex_other`, `sex_prefer_not`) values ("+insertId+",";
				for(let i=0;i<militaryBranch.length;i++){
					insertQuery+= militaryBranch[i].val+",";
				}
				for(let i=0;i<militaryStatus.length;i++){
					insertQuery+= militaryStatus[i].val+",";
				}
				for(let i=0;i<studentEthnic.length;i++){
					insertQuery+= studentEthnic[i].val+",";
				}
				for(let i=0;i<studentDisability.length;i++){
					insertQuery+= studentDisability[i].val+",";
				}
				for(let i=0;i<academicStatus.length;i++){
					insertQuery+= academicStatus[i].val+",";
				}
				for(let i=0;i<academicLevel.length;i++){
					insertQuery+= academicLevel[i].val+",";
				}
				for(let i=0;i<sex.length;i++){
					if(i == sex.length - 1){
						insertQuery+= +sex[i].val+");";
					}else{
						insertQuery+= sex[i].val+",";
					}
				}
				// console.log("QQ:",insertQuery);
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
			/*}else{
				resolve("success");
			}*/
			
		})
	}

	function getAllScholarshipData() {
		return new Promise(function (resolve, reject) {

			let listQuery = 'SELECT * from scholarship_list where status="active"';
			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(superAdminScholarshipModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getScholarshipDataById(id) {
		return new Promise(function (resolve, reject) {

			let listQuery = 'SELECT * from scholarship_list where id=' + id;

			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(superAdminScholarshipModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getScholarshipOptionDataById(id) {
		return new Promise(function (resolve, reject) {
			let listQuery = "select * from scholarship_pivot_dataoption where scholarship_id="+id;
			mysqlService.query(listQuery)
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

	function editScholarshipData(saveData){
		return new Promise(function (resolve, reject) {
			let openDateFormat = "";
			let dateOpen = "";
			let dealineDateFormat = "";
			let deadlineDate = "";
			let dd = saveData.deadline.split("/");
			//open Date
			if(saveData.openDate != ""){
                let od = saveData.openDate.split("/");
                if(od.length == 2){
                    dateOpen = od[1]+"-"+od[0]+"-01";
                    openDateFormat = "mm/yyyy";
                }else{
                    dateOpen = od[2]+"-"+od[0]+"-"+od[1];
                    openDateFormat = "mm/dd/yyyy";
                }
            }else{
                openDateFormat = saveData.opendateFormat;
            }
			//deadline Date
			if(dd.length == 2){
				let odays = getDaysInMonth(dd[0],dd[1]);
				deadlineDate = dd[1]+"-"+dd[0]+"-"+odays;
				dealineDateFormat = "mm/yyyy";
			}else{
				deadlineDate = dd[2]+"-"+dd[0]+"-"+dd[1];
				dealineDateFormat = "mm/dd/yyyy";
			}
			
			let scholarshipData = {};
			if(saveData.openDate != ""){
				scholarshipData = {
					scholarship_name: saveData.scholarshipName,
					recipients: saveData.recipients,
					award: saveData.award,
					detail: saveData.detail,
					check_military_branch: saveData.checkMilitaryBranch,
					check_military_status: saveData.checkMilitaryStatus,
					check_student_ethnic: saveData.checkStudentEthnic,
					check_student_disability: saveData.checkStudentDisability,
					check_academic_status: saveData.checkAcademicStatus,
					check_academic_level: saveData.checkAcademicLevel,
					check_degree_specific: saveData.checkDegreeSpecific,
					bucket_id: saveData.bucket_id,
					degree_id: saveData.degreeId,
					open_date_format: openDateFormat,
					open_date: saveData.openDate,
					opendate: dateOpen,
					date_format: dealineDateFormat,
					deadline: saveData.deadline,
					deadlinedate: deadlineDate,
					recurring_event: saveData.recurringEvent,
					website: saveData.website
				}
			}else{
				scholarshipData = {
					scholarship_name: saveData.scholarshipName,
					recipients: saveData.recipients,
					award: saveData.award,
					detail: saveData.detail,
					check_military_branch: saveData.checkMilitaryBranch,
					check_military_status: saveData.checkMilitaryStatus,
					check_student_ethnic: saveData.checkStudentEthnic,
					check_student_disability: saveData.checkStudentDisability,
					check_academic_status: saveData.checkAcademicStatus,
					check_academic_level: saveData.checkAcademicLevel,
					check_degree_specific: saveData.checkDegreeSpecific,
					bucket_id: saveData.bucket_id,
					degree_id: saveData.degreeId,
					open_date_format: openDateFormat,
					open_date: saveData.openDate,
					date_format: dealineDateFormat,
					deadline: saveData.deadline,
					deadlinedate: deadlineDate,
					recurring_event: saveData.recurringEvent,
					website: saveData.website
				}
			}
			
			mysqlService.query("UPDATE scholarship_list SET ? WHERE id = ?", [scholarshipData, saveData.id])
			.then(function (response) {
				//console.log("RR:",response.insertId);
				editScholarsipOption(saveData.militaryBranch,saveData.militaryStatus,saveData.studentDisability,saveData.studentEthnic,saveData.academicStatus,saveData.academicLevel,saveData.sex,saveData.id).then(function (response1) {
					resolve("Success");
				}, function (err) {
					if (err) {
					  var error = err;
					  error.status = 503;
					  return reject(error)
					};
				  });
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		})
	}

	function editScholarsipOption(militaryBranch,militaryStatus,studentDisability,studentEthnicity,academicStatus,academicLevel,sex,editId){
		return new Promise(function (resolve, reject) {
			let  updateQuery="Update scholarship_pivot_dataoption set ";
			for(let i=0;i<militaryBranch.length;i++){
				updateQuery+= militaryBranch[i].name+"="+militaryBranch[i].val+",";
			}
			for(let i=0;i<militaryStatus.length;i++){
				updateQuery+= militaryStatus[i].name+"="+militaryStatus[i].val+",";
			}
			for(let i=0;i<studentDisability.length;i++){
				updateQuery+=  studentDisability[i].name+"="+studentDisability[i].val+",";
			}
			for(let i=0;i<studentEthnicity.length;i++){
				updateQuery+=  studentEthnicity[i].name+"="+studentEthnicity[i].val+",";
			}
			for(let i=0;i<academicStatus.length;i++){
				updateQuery+=  academicStatus[i].name+"="+academicStatus[i].val+",";
			}
			for(let i=0;i<academicLevel.length;i++){
				updateQuery+= academicLevel[i].name+"="+academicLevel[i].val+",";
			}
			for(let i=0;i<sex.length;i++){
				if(i == sex.length - 1){
					updateQuery+= sex[i].name+"="+sex[i].val;
				}else{
					updateQuery+= sex[i].name+"="+sex[i].val+",";
				}
			}
			updateQuery+= " where scholarship_id=" + editId;
			// console.log("UU:",updateQuery);
			mysqlService.query(updateQuery)
			.then(function (response1) {
				resolve("success");
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		})
	}

	function deleteScholarshipDataById(id) {
		return new Promise(function (resolve, reject) {
			let listQuery = "Update scholarship_list set status='disable' where id="+id;
			mysqlService.query(listQuery)
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

	function getCollegeSpecificDegreeById(id) {
		return new Promise(function (resolve, reject) {
			let listQuery = "select primary_bucket,secondary_bucket from degree_specific_profile where college_id="+id;
			mysqlService.query(listQuery)
				.then(function (response) {
					//resolve(response[0]);
					let listQuery = 'SELECT DISTINCT(mn.id),mn.title FROM bucket_secondary_degree_list as bsdl LEFT JOIN majors_new as mn ON bsdl.major_id=mn.id WHERE bsdl.bucket_primary_degree_id='+response[0].primary_bucket+' AND bsdl.bucket_secondary_degree_id IN ('+response[0].secondary_bucket+') AND mn.status="active" order by mn.title';
					mysqlService.query(listQuery)
						.then(function (response1) {
							resolve(response1);
						}, function (err) {
							if (err) {
								var error = err;
								error.status = 503;
								return reject(error)
							};
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

	function addSpecificDegreeData(saveData){
		return new Promise(function (resolve, reject) {
			let checkQuery = "select COUNT(id) as total from colleges WHERE college_alias = '"+saveData.degreeSpecificAlias+"'";
			//let checkQuery = "SELECT count(id) as total FROM college_degree_specific_info WHERE college_id="+saveData.collegeId+" and level_id="+saveData.levelId+" AND bucket_id = "+saveData.bucketId+" and countMatchingElements('"+saveData.secBucketId+"',sec_bucket_id) and degree_status='active'";
			//console.log("CC:",checkQuery);
			mysqlService.query(checkQuery)
			.then(function (response) {
				//console.log("TT:",response[0].total);
				if(response[0].total == 0){
					let specificDegreeData = {
						college_id: saveData.collegeId,
						level_id: saveData.levelId,
						bucket_id: saveData.bucketId,
						sec_bucket_id: saveData.secBucketId,
						school_name: saveData.schoolName,
						new_college_name: saveData.newCollegeName,
						degree_specific_alias: saveData.degreeSpecificAlias,
						secondary_bucket_titles: saveData.secondaryBucketTitles,
						degree_rule: saveData.degreeRule,
						degree_title: saveData.degreeTitle,
						degree_desc: saveData.degreeDesc,
						job_market_review: saveData.jobMarketReview,
						courses: saveData.courses,
						graduation_rate: saveData.graduationRate,
						placement_rate: saveData.placementRate,
						gmat_score: saveData.gmatScore,
						avg_immediate_salary: saveData.avgImmediateSalary,
						degree_status: saveData.degreeStatus,
						program_matcher_only: saveData.programMatcherOnly,
						secondary_alias: saveData.secondaryAlias,
						created_by: saveData.adminId
					}
					saveQuery = `INSERT INTO college_degree_specific_info SET ?`;
					mysqlService.query(saveQuery,specificDegreeData)
					.then(function (response1) {
						//console.log("RR:",response.insertId);
						if(response1.insertId){
							//resolve("Success");
							InsertSpecificProfileCollegeData(response1.insertId, saveData).then(function (res) {
								resolve(res);
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
				}else{
					resolve("exist");
				}
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		})
	}

	function InsertSpecificProfileCollegeData(specificId, saveData){
		return new Promise(function (resolve, reject) {
			let Qry = "SELECT c.*,cp.*,cm.page_title,cm.description,cm.keywords,cm.og_title,cm.og_description from colleges as c left join college_profiles as cp on c.id=cp.college_id left join college_metadata as cm on c.id=cm.college_id where c.id="+saveData.collegeId;
			mysqlService.query(Qry)
				.then(function (response) {
					let collegeData = {
						college_name: saveData.newCollegeName,
						seo_name: response[0].seo_name,
						address: response[0].address,
						address2: response[0].address2,
						city: response[0].city,
						state: response[0].state,
						postal_code: response[0].postal_code,
						contact_email: response[0].contact_email,
						website: response[0].website,
						phone_number: response[0].phone_number,
						fax_number: response[0].fax_number,
						status: response[0].status,
						access_level: "Patriot",
						display_order: response[0].display_order,
						college_type: response[0].college_type,
						va_code: response[0].va_code,
						include_app_state: response[0].include_app_state,
						include_legion_state: response[0].include_legion_state,
						include_flow_state: response[0].include_flow_state,
						include_military_state: response[0].include_military_state,
						college_abbreviation: response[0].college_abbreviation,
						facility_code: response[0].facility_code,
						monthly_email_subscription: response[0].monthly_email_subscription,
						unsubscription_reason: response[0].unsubscription_reason,
						search_online_display: response[0].search_online_display,
						college_alias: saveData.degreeSpecificAlias,
						specific_profile_id: specificId,
						parent_id: saveData.collegeId
					}
					saveQuery = `INSERT INTO colleges SET ?`;
					mysqlService.query(saveQuery,collegeData)
					.then(function (response1) {
						if (response1["affectedRows"] == 1) {
							let collegeProfileData = {
								college_id: response1.insertId,
								years_offered: response[0].years_offered,
								public_private: response[0].public_private,
								gender_preference: response[0].gender_preference,
								setting: response[0].setting,
								degrees_offered : response[0]. 	degrees_offered,
								in_state_tuition: response[0].in_state_tuition,
								out_state_tuition: response[0].out_state_tuition,
								student_population: response[0].student_population,
								female_student_count: response[0].female_student_count,
								male_student_count: response[0].male_student_count,
								gpa_range: response[0].gpa_range,
								academic_level: response[0].academic_level,
								rotc: response[0].rotc,
								yellow_ribbon: response[0].yellow_ribbon,
								clep_credit: response[0].clep_credit,
								dsst_credit: response[0].dsst_credit,
								online_classes: response[0].online_classes,
								follow_ace_credit: response[0].follow_ace_credit,
								awards_ace_credit: response[0].awards_ace_credit,
								sva: response[0].sva,
								reduced_tuition: response[0].reduced_tuition,
								scholarships_for_veterans: response[0].scholarships_for_veterans,
								in_state_tuition_no_residency: response[0].in_state_tuition_no_residency,
								approved_ta_funding: response[0].approved_ta_funding,
								upward_bound: response[0].upward_bound,
								religious_affiliation: response[0].religious_affiliation,
								ethnic_affiliation: response[0].ethnic_affiliation,
								sat_score: response[0].sat_score,
								act_score: response[0].act_score,
								veteran_affairs_attn: response[0].veteran_affairs_attn,
								veteran_affairs_address: response[0].veteran_affairs_address,
								veteran_affairs_address2: response[0].veteran_affairs_address2,
								veteran_affairs_city: response[0].veteran_affairs_city,
								veteran_affairs_state: response[0].veteran_affairs_state,
								veteran_affairs_postal_code: response[0].veteran_affairs_postal_code,
								veteran_affairs_fax: response[0].veteran_affairs_fax,
								veteran_affairs_phone: response[0].veteran_affairs_phone,
								veteran_affairs_email: response[0].veteran_affairs_email,
								veteran_affairs_website: response[0].veteran_affairs_website,
								bah: response[0].bah,
								gi_bill: response[0].gi_bill,
								eight_keys: response[0].eight_keys,
								calendar: response[0].calendar,
								books: response[0].books,
								accredit: response[0].accredit,
								overview: response[0].overview,
								college_logo: response[0].college_logo,
								college_photo: response[0].college_photo,
								in_state_tuition_graduate: response[0].in_state_tuition_graduate,
								out_state_tuition_graduate: response[0].out_state_tuition_graduate,
								student_population_undergraduate: response[0].student_population_undergraduate,
								student_population_graduate: response[0].student_population_graduate,
								online_classes_undergraduate: response[0].online_classes_undergraduate,
								online_classes_graduate:  response[0].online_classes_graduate,
								highest_degree_offered:  response[0].highest_degree_offered,
								campus_region: response[0].campus_region,
								sat_math: response[0].sat_math,
								sat_critical: response[0].sat_critical,
								member_soc: response[0].member_soc,
								display_text: response[0].display_text,
								yellow_ribbon_coverage: response[0].yellow_ribbon_coverage,
								in_state_costpercredit: response[0].in_state_costpercredit,
								out_state_costpercredit: response[0].out_state_costpercredit,
								gibill_program: response[0].gibill_program,
								college_overview: response[0].college_overview,
								cpch_undergraduate_campus: response[0].cpch_undergraduate_campus,
								cpch_undergraduate_online: response[0].cpch_undergraduate_online,
								cpch_graduate_campus: response[0].cpch_graduate_campus,
								cpch_graduate_online: response[0].cpch_graduate_online,
								tuition_cpch: response[0].tuition_cpch,
							}
							saveQuery = `INSERT INTO college_profiles SET ?`;
							mysqlService.query(saveQuery,collegeProfileData)
							.then(function (response2) {
								if (response2["affectedRows"] == 1) {
									let collegeMetadata = {
										college_id: response1.insertId,
										page_title: response[0].page_title,
										description:response[0].description,
										keywords: response[0].keywords,
										og_title: response[0].og_title,
										og_description: response[0].og_description
									}
								saveQuery = `INSERT INTO college_metadata SET ?`;
								mysqlService.query(saveQuery,collegeMetadata)
								.then(function (response3) {
									if (response3["affectedRows"] == 1) {
										let listQuery =`UPDATE college_degree_specific_info SET college_info_id = '${response1.insertId}' WHERE id = '${specificId}'`;
										mysqlService.query(listQuery)
										.then(function (response4) {
											resolve("Success");
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
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getSpecificDegreeDataById(id) {
		return new Promise(function (resolve, reject) {
			let listQuery = 'SELECT c.*,cp.*,cmd.*,cs.id as specificid,cs.college_id as parentid,cs.level_id,cs.bucket_id,cs.sec_bucket_id,cs.school_name,cs.new_college_name,cs.degree_specific_alias,cs.secondary_bucket_titles,cs.degree_rule,cs.degree_title,cs.degree_desc,cs.job_market_review,cs.courses,cs.graduation_rate,cs.placement_rate,cs.gmat_score,cs.avg_immediate_salary,cs.college_info_id,cs.degree_status,cs.program_matcher_only,cs.secondary_alias,(SELECT college_name from colleges where id=cs.college_id) as collegename from college_degree_specific_info as cs LEFT JOIN colleges c on cs.college_info_id =c.id  LEFT JOIN college_profiles cp on cs.college_info_id=cp.college_id  LEFT JOIN college_metadata cmd on cs.college_info_id = cmd.college_id where cs.id=' + id;
			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(superAdminSpecificCollegeModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function editSpecificDegreeData(saveData){
		return new Promise(function (resolve, reject) {
			let checkQuery = "select COUNT(id) as total  from colleges WHERE college_alias = '"+saveData.degreeSpecificAlias+"' and id !="+saveData.profileCollegeId;
			//let checkQuery = "SELECT count(id) as total FROM college_degree_specific_info WHERE college_id="+saveData.collegeId+" and level_id="+saveData.levelId+" AND bucket_id = "+saveData.bucketId+" and countMatchingElements('"+saveData.secBucketId+"',sec_bucket_id) and id!="+saveData.id+" and degree_status='active'";
			//console.log("CC:",checkQuery);
			mysqlService.query(checkQuery)
			.then(function (response) {
				//console.log("TT:",response[0].total);
				if(response[0].total == 0){
					let specificDegreeData = {
						college_id: saveData.collegeId,
						level_id: saveData.levelId,
						bucket_id: saveData.bucketId,
						sec_bucket_id: saveData.secBucketId,
						school_name: saveData.schoolName,
						new_college_name: saveData.newCollegeName,
						degree_specific_alias: saveData.degreeSpecificAlias,
						secondary_bucket_titles: saveData.secondaryBucketTitles,
						degree_rule: saveData.degreeRule,
						degree_title: saveData.degreeTitle,
						degree_desc: saveData.degreeDesc,
						job_market_review: saveData.jobMarketReview,
						courses: saveData.courses,
						graduation_rate: saveData.graduationRate,
						placement_rate: saveData.placementRate,
						gmat_score: saveData.gmatScore,
						avg_immediate_salary: saveData.avgImmediateSalary,
						degree_status: saveData.degreeStatus,
						program_matcher_only: saveData.programMatcherOnly,
						secondary_alias: saveData.secondaryAlias,
						updated_by: saveData.adminId,
						updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
					}
					
					mysqlService.query("UPDATE college_degree_specific_info SET ? WHERE id = ?", [specificDegreeData, saveData.id])
					.then(function (response1) {
						if(response1){
							let collegeData = {
								college_name: saveData.newCollegeName,
								college_alias: saveData.degreeSpecificAlias,
								address: saveData.specificCollegeInfo.collegeAddress,
								city: saveData.specificCollegeInfo.collegeCity,
								state: saveData.specificCollegeInfo.collegeState,
								postal_code: saveData.specificCollegeInfo.collegePostalCode,
								contact_email: saveData.specificCollegeInfo.collegeContactEmail,
								website: saveData.specificCollegeInfo.collegeWebsite,
								phone_number: saveData.specificCollegeInfo.collegePhoneNumber,
								fax_number: saveData.specificCollegeInfo.collegeFaxNumber
							}
							mysqlService.query("UPDATE colleges SET ? WHERE id = ?", [collegeData, saveData.profileCollegeId])
							.then(function (response2) {
								if(response2){
									let collegeProfileData = {
										in_state_tuition: saveData.specificCollegeInfo.inStateTuition,
										out_state_tuition: saveData.specificCollegeInfo.outStateTuition,
										in_state_tuition_graduate: saveData.specificCollegeInfo.inStateTuitionGraduate,
										out_state_tuition_graduate: saveData.specificCollegeInfo.outStateTuitionGraduate,
										books: saveData.specificCollegeInfo.books,
										gi_bill: saveData.specificCollegeInfo.giBill,
										gender_preference: saveData.specificCollegeInfo.genderPreference,
										female_student_count: saveData.specificCollegeInfo.femaleStudentCount,
										male_student_count:saveData.specificCollegeInfo.maleStudentCount,
										student_population_graduate:saveData.specificCollegeInfo.studentPopulationGraduate,
										student_population_undergraduate: saveData.specificCollegeInfo.studentPopulationUndergraduate,
										religious_affiliation: saveData.specificCollegeInfo.religiousAffiliation,
										ethnic_affiliation: saveData.specificCollegeInfo.ethnicAffiliation,
										years_offered: saveData.specificCollegeInfo.yearsOffered,
										calendar: saveData.specificCollegeInfo.calendar,
										setting: saveData.specificCollegeInfo.schoolSetting,
										public_private: saveData.specificCollegeInfo.publicPrivate,
										accredit: saveData.specificCollegeInfo.accredit,
										sat_math: saveData.specificCollegeInfo.satMath,
										sat_critical: saveData.specificCollegeInfo.satCritical,
										act_score: saveData.specificCollegeInfo.actScore,
										online_classes_undergraduate: saveData.specificCollegeInfo.onlineClassesUndergraduate,
										online_classes_graduate: saveData.specificCollegeInfo.onlineClassesGraduate,
										in_state_costpercredit: saveData.specificCollegeInfo.inStateCostPerCredit,
										out_state_costpercredit: saveData.specificCollegeInfo.outStateCostPerCredit,
										cpch_undergraduate_campus: saveData.specificCollegeInfo.cpchUndergraduateCampus,
										cpch_undergraduate_online: saveData.specificCollegeInfo.cpchUndergraduateOnline,
										cpch_graduate_campus: saveData.specificCollegeInfo.cpchGraduateCampus,
										cpch_graduate_online: saveData.specificCollegeInfo.cpchGraduateOnline,
										tuition_cpch: saveData.specificCollegeInfo.tuitionCpch,
										rotc: saveData.specificCollegeInfo.rotc,
										gibill_program: saveData.specificCollegeInfo.gibillProgram,
										yellow_ribbon: saveData.specificCollegeInfo.yellowRibbon,
										clep_credit: saveData.specificCollegeInfo.clepCredit,
										dsst_credit: saveData.specificCollegeInfo.dsstCredit,
										member_soc: saveData.specificCollegeInfo.memberSoc,
										awards_ace_credit: saveData.specificCollegeInfo.awardsAceCredit,
										bah: saveData.specificCollegeInfo.bah,
										sva: saveData.specificCollegeInfo.sva,
										reduced_tuition: saveData.specificCollegeInfo.reducedTuition,
										scholarships_for_veterans: saveData.specificCollegeInfo.scholarshipsForVeterans,
										in_state_tuition_no_residency: saveData.specificCollegeInfo.inStateTuitionNoResidency,
										principles_of_excellence: saveData.specificCollegeInfo.principlesOfExcellence,
										full_time_vet_counselors: saveData.specificCollegeInfo.fullTimeVetCounselors,
										club_assoc_campus: saveData.specificCollegeInfo.clubAssocCampus,
										approved_ta_funding: saveData.specificCollegeInfo.approvedTaFunding,
										eight_keys: saveData.specificCollegeInfo.eightKeys,
										upward_bound: saveData.specificCollegeInfo.upwardBound,
										yellow_ribbon_coverage: saveData.specificCollegeInfo.yellowRibbonCoveragePrice,
										veteran_affairs_attn: saveData.specificCollegeInfo.veteranAffairsName,
										veteran_affairs_address: saveData.specificCollegeInfo.veteranAffairsAddress,
										veteran_affairs_city: saveData.specificCollegeInfo.veteranAffairsCity,
										veteran_affairs_state: saveData.specificCollegeInfo.veteranAffairsState,
										veteran_affairs_postal_code: saveData.specificCollegeInfo.veteranAffairsPostalCode,
										veteran_affairs_email: saveData.specificCollegeInfo.veteranAffairsEmail,
										veteran_affairs_website: saveData.specificCollegeInfo.veteranAffairsWebsite,
										veteran_affairs_phone: saveData.specificCollegeInfo.veteranAffairsPhone,
										veteran_affairs_fax: saveData.specificCollegeInfo.veteranAffairsFax,
										overview: saveData.specificCollegeInfo.overview,
										college_overview: saveData.specificCollegeInfo.collegeOverview,
										display_text: saveData.specificCollegeInfo.displayText,
										updated_by: saveData.specificCollegeInfo.adminId,
										updated_user: saveData.specificCollegeInfo.adminType,
									}
									mysqlService.query("UPDATE college_profiles SET ? WHERE college_id = ?", [collegeProfileData, saveData.profileCollegeId])
									.then(function (response3) {
										if(response3){
											let collegeMetadataEdit = {
												page_title: saveData.specificCollegeInfo.metaPageTitle,
												description: saveData.specificCollegeInfo.metaDescription,
												keywords: saveData.specificCollegeInfo.metaKeywords,
												og_title: saveData.specificCollegeInfo.metaOgTitle,
												og_description: saveData.specificCollegeInfo.metaOgDescription
											}
											mysqlService.query("UPDATE college_metadata SET ? WHERE college_id = ?", [collegeMetadataEdit, saveData.profileCollegeId])
											.then(function (response4) {
												if(response4){
													resolve("Success");
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
				}else{
					resolve("exist");
				}
			}, function (err) {
				if (err) {
					var error = err;
					error.status = 503;
					return reject(error)
				};
			});
		})
	}

	function deleteSpecificDegreeDeleteById(id) {
		return new Promise(function (resolve, reject) {
			let listQuery = "Update college_degree_specific_info set degree_status='disable' where id="+id;
			mysqlService.query(listQuery)
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

	function listNonSpecificCollegesData() {
		return new Promise(function (resolve, reject) {

			let listQuery = 'Select * from colleges where status="ACTIVE" AND specific_profile_id = 0 order by college_name ASC';
			//console.log("QQ:",listQuery);
			mysqlService.query(listQuery)
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

	function importSpecificDegreeCollegeData(){
		return new Promise(function (resolve, reject) {
			let checkQuery = "SELECT id,college_id as collegeId,new_college_name as newCollegeName,degree_specific_alias as degreeSpecificAlias FROM college_degree_specific_info order by id";
			//console.log("CC:",checkQuery);
			mysqlService.query(checkQuery)
			.then(function (response) {
				for (let i = 0; i < response.length; i++) {
					InsertSpecificProfileCollegeData(response[i].id, response[i]).then(function (res) {
						if(i == response.length - 1){
							resolve(res);
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
		})
	}

	function searchScholarshipData(filters) {
		return new Promise(function (resolve, reject) {

			let listQuery = `SELECT * from scholarship_list as sl JOIN scholarship_pivot_dataoption as sd ON sl.id=sd.scholarship_id where sl.status='active' `;

			if(filters.militaryBranch.length>0) {
				listQuery += ` AND `
				  for(let i=0 ; i< filters.militaryBranch.length; i++) {
					listQuery += `sd.${filters.militaryBranch[i]}=1 AND `
					if(i == filters.militaryBranch.length -1) {
						listQuery = listQuery.substring(0,listQuery.length-4)
					}
				  }
				  listQuery += ` AND sl.check_military_branch = 'yes' `
			}

			if(filters.militaryStatus.length>0) {
				listQuery += ` AND `
				  for(let i=0 ; i< filters.militaryStatus.length; i++) {
					listQuery += `${filters.militaryStatus[i]}=1 AND `
					if(i == filters.militaryStatus.length -1) {
						listQuery = listQuery.substring(0,listQuery.length-4)
					}
				  }
				  listQuery += ` AND sl.check_military_status = 'yes' `
			}

			// console.log("LL:", listQuery)

			mysqlService.query(listQuery)
				.then(function (response) {
					resolve(superAdminScholarshipModel(response));
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
		});
	}

	function getScholarshipDegree(filters) {
		return new Promise(function (resolve, reject) {

			let degreeQuery = `SELECT title from bucket_degree where status='active' AND id IN (${filters.bucket})`;

			mysqlService.query(degreeQuery)
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

	function getScholarshipSecondaryDegree(filters) {
		return new Promise(function (resolve, reject) {

			let degreeQuery = `SELECT title from bucket_secondary_degree where status='active' AND id IN (${filters.secbucket})`;

			mysqlService.query(degreeQuery)
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

	function editSpecificDegreeStatus(updateData){
        return new Promise(function (resolve, reject) {
            if(updateData.degree_status == 'disable'){
                updateDegreeSpecificStatus(updateData.specificId,'disable').then(function (response) {
                    updateCollegeStatus(updateData.specificId,"DISABLED").then(function (response1) {
                        resolve("Success")
                    }, function (err) {
                        if (err) {
                            var error = err;
                            error.status = 503;
                            return reject(error)
                        };
                    });
                }, function (err) {
                    if (err) {
                        var error = err;
                        error.status = 503;
                        return reject(error)
                    };
                });
            }else{
                getDegreeSpecificStatus(updateData.specificId).then(function (response){
                    if(response != 'disable'){
                        updateDegreeSpecificStatus(updateData.specificId,updateData.degree_status).then(function (response1) {
                            resolve("Success")
                        }, function (err) {
                            if (err) {
                                var error = err;
                                error.status = 503;
                                return reject(error)
                            };
                        });
                    }else{
                        updateDegreeSpecificStatus(updateData.specificId,updateData.degree_status).then(function (response1) {
                            updateCollegeStatus(updateData.specificId,"ACTIVE").then(function (response2) {
                                resolve("Success")
                            }, function (err) {
                                if (err) {
                                    var error = err;
                                    error.status = 503;
                                    return reject(error)
                                };
                            });
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
    }

    function updateDegreeSpecificStatus(id,degreeStatus){
        return new Promise(function (resolve, reject) {
            let degreeQuery = `UPDATE college_degree_specific_info SET degree_status = "${degreeStatus}" WHERE id = ${id}`;
            mysqlService.query(degreeQuery)
                .then(function (response) {
                    resolve("Success");
                }, function (err) {
                    if (err) {
                        var error = err;
                        error.status = 503;
                        return reject(error)
                    };
                });
        });
    }

    function updateCollegeStatus(cid,collegeStatus){
        return new Promise(function (resolve, reject) {
            let degreeQuery = `UPDATE colleges SET status = "${collegeStatus}" WHERE specific_profile_id = ${cid}`;
            mysqlService.query(degreeQuery)
                .then(function (response) {
                    resolve("Success");
                }, function (err) {
                    if (err) {
                        var error = err;
                        error.status = 503;
                        return reject(error)
                    };
                });
        });
    }

    function getDegreeSpecificStatus(id) {
        return new Promise(function (resolve, reject) {
            let degreeQuery = `SELECT degree_status from college_degree_specific_info where id=`+id;
            mysqlService.query(degreeQuery)
                .then(function (response) {
                    resolve(response[0].degree_status);
                }, function (err) {
                    if (err) {
                        var error = err;
                        error.status = 503;
                        return reject(error)
                    };
                });
        });
    }

	async function getCollegeImageInfoById(id) {
		try{
			let imageQuery = `SELECT c.college_name,c.college_alias,cp.college_photo,cp.college_logo,cp.college_banner from colleges as c left join college_profiles as cp ON c.id=cp.college_id where c.id=`+id;
			let imageInfoReturn = await mysqlService.query(imageQuery);
			if(imageInfoReturn[0].college_logo && imageInfoReturn[0].college_photo && imageInfoReturn[0].college_banner){
				let logoDimension = await getImageDimension(imageInfoReturn[0].college_logo);
				let photoDimension = await getImageDimension(imageInfoReturn[0].college_photo);
				let bannerDimension = await getImageDimension(imageInfoReturn[0].college_banner);
				return imageInfoModel(imageInfoReturn[0],logoDimension,photoDimension,bannerDimension);
			}else if(imageInfoReturn[0].college_logo && imageInfoReturn[0].college_photo){
				let logoDimension = await getImageDimension(imageInfoReturn[0].college_logo);
				let photoDimension = await getImageDimension(imageInfoReturn[0].college_photo);
				return imageInfoModel(imageInfoReturn[0],logoDimension,photoDimension,'');
			}else if(imageInfoReturn[0].college_photo && imageInfoReturn[0].college_banner){
				let photoDimension = await getImageDimension(imageInfoReturn[0].college_photo);
				let bannerDimension = await getImageDimension(imageInfoReturn[0].college_banner);
				return imageInfoModel(imageInfoReturn[0],'',photoDimension,bannerDimension);
			}else if(imageInfoReturn[0].college_logo && imageInfoReturn[0].college_banner){
				let logoDimension = await getImageDimension(imageInfoReturn[0].college_logo);
				let bannerDimension = await getImageDimension(imageInfoReturn[0].college_banner);
				return imageInfoModel(imageInfoReturn[0],logoDimension,'',bannerDimension);
			}else if(imageInfoReturn[0].college_logo){
				let logoDimension = await getImageDimension(imageInfoReturn[0].college_logo);
				return imageInfoModel(imageInfoReturn[0],logoDimension,'','');
			}else if(imageInfoReturn[0].college_photo){
				let photoDimension = await getImageDimension(imageInfoReturn[0].college_photo);
				return imageInfoModel(imageInfoReturn[0],'',photoDimension,'');
			}else if(imageInfoReturn[0].college_banner){
				let bannerDimension = await getImageDimension(imageInfoReturn[0].college_banner);
				return imageInfoModel(imageInfoReturn[0],'','',bannerDimension);
			}else{
				return (imageInfoModel(imageInfoReturn[0],'','',''));
			}
		}catch (err) {
			console.log('error',err);
			return reject(new Error(err));
		}
	}

	async function getImageDimension(imageName){
		return new Promise(async function (resolve, reject) {
			let imageData = await s3Helper.getS3Object(imageName);
			if(imageData){
				resolve(sizeOf(imageData));
			}else{
				resolve(0);
			}
		})
	}

	function getBouncebackDegreeList(status) {
        return new Promise(function (resolve, reject) {
            let degreeQuery = "SELECT id,(SELECT title FROM levels WHERE id=level_id) as degree_level,(SELECT title FROM bucket_degree WHERE id=bucket_id) as primary_bucket,secondary_bucket_title FROM `bounceback_degree` WHERE degree_status='"+status+"' order by created_date asc";
            mysqlService.query(degreeQuery)
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

	function getCollegeListFilterByDegree(filter) {
        return new Promise(function (resolve, reject) {
            let filterQuery = "SELECT cc.id ,cc.college_name FROM colleges as cc WHERE cc.status='active' and cc.id IN (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id WHERE 1=1 ";
			let filterUnionQuery = "SELECT cc.id,cc.college_name FROM colleges as cc LEFT JOIN college_degree_specific_info as ss ON cc.id=ss.college_info_id WHERE 1=1";
			if(filter.bucketId){
				filterQuery+= " and bsdl.bucket_primary_degree_id in ('"+filter.bucketId+"')";
				filterUnionQuery+= " and ss.bucket_id in ('"+filter.bucketId+"')";
			}
			if(filter.secBucketId){
				filterQuery+= " and bsdl.bucket_secondary_degree_id in ("+ stringUtil.joinStringWithComma(filter.secBucketId) +")";
				//filterUnionQuery+= " and countMatchingElements(ss.sec_bucket_id,'"+filter.secBucketId+"')";
				let secBucketData = filter.secBucketId.split(",");
				filterUnionQuery+= " and (";
				for (i = 0; i < secBucketData.length; i++) {
					filterUnionQuery+= "find_in_set("+secBucketData[i]+",ss.sec_bucket_id)";
					if(secBucketData.length > 1 && i < secBucketData.length-1){
						filterUnionQuery+= " or ";
					}
				}
				filterUnionQuery+= ")"; 
			}
			if(filter.levelId){
				filterQuery+= " and cmn.aw_level in ('"+filter.levelId+"')";
				filterUnionQuery+= " and ss.level_id in ('"+filter.levelId+"')"
			}
			filterQuery+= " )";
			
			//console.log("QQ:",filterQuery +" UNION "+ filterUnionQuery);
            mysqlService.query(filterQuery +" UNION "+ filterUnionQuery)
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

	async function addCollegeListDegreeBounceback(bounceData) {
        return new Promise(async function (resolve, reject) {
			let checkDegreeExists = await checkDegreeBouncebackExist("add", bounceData);
			
			if(checkDegreeExists[0].total == 0){
				let degreeData = {
					level_id: bounceData.levelId,
					bucket_id: bounceData.bucketId,
					secondary_bucket_id: bounceData.secBucketId,
					secondary_bucket_title: bounceData.secBucketTitle,
					created_by: bounceData.adminId
				}
				let saveQuery = "";
				if(bounceData.type == "degreeorder"){
					saveQuery = `INSERT INTO degree_order SET ?`;
				}else{
					saveQuery = `INSERT INTO bounceback_degree SET ?`;
				}
				
				mysqlService.query(saveQuery,degreeData)
					.then(async function (response) {
						if(response.insertId){
							let resultData = await insertBouncebackColleges(response.insertId, bounceData);
							resolve(resultData);
						}
					},function(err){  
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
			}else{
				resolve('exist');
			}
		});
	}

	async function checkDegreeBouncebackExist(type, bounceData){
        return new Promise(function(resolve, reject) {
			let checkSql = "";
			if(bounceData.type == "degreeorder"){
				checkSql+= "SELECT count(id) as total FROM `degree_order` WHERE level_id in ('"+bounceData.levelId+"') and bucket_id in ('"+bounceData.bucketId+"') ";
			}else{
				checkSql+= "SELECT count(id) as total FROM `bounceback_degree` WHERE level_id in ('"+bounceData.levelId+"') and bucket_id in ('"+bounceData.bucketId+"') and countMatchingElements(secondary_bucket_id,'"+bounceData.secBucketId+"') ";
			}
			if(type == "edit"){
				checkSql+= " and id !="+bounceData.id;
			}
			mysqlService.query(checkSql)
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

	function insertBouncebackColleges(degreeId,bounceData){
		return new Promise(function (resolve, reject) {
			let insertQuery = "";
			if(bounceData.type == "degreeorder"){
				insertQuery = "Insert into degree_order_colleges (degree_order_id,college_id,burb, display_order) values ";
			}else{
				insertQuery = "Insert into bounceback_colleges (bounceback_degree_id,college_id,burb, display_order) values ";
			}
      		
			for (let i = 0; i < bounceData.saveCollegeOrder.length; i++) {
				if (i == bounceData.saveCollegeOrder.length - 1) {
					let orderValue = bounceData.saveCollegeOrder[i].order + 1;
					insertQuery += "(" + degreeId + "," + bounceData.saveCollegeOrder[i].id + ",'" + bounceData.saveCollegeOrder[i].burb + "'," + orderValue + ");";
				}else{
					let orderValue = bounceData.saveCollegeOrder[i].order + 1;
					insertQuery += "(" + degreeId + "," + bounceData.saveCollegeOrder[i].id + ",'" + bounceData.saveCollegeOrder[i].burb + "'," + orderValue + "),";
				}
			}
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

	function updateBouncebackDegreeById(degreeStatus, id){
        return new Promise(function (resolve, reject) {
            let degreeQuery = `UPDATE bounceback_degree SET degree_status = "${degreeStatus}" WHERE id = ${id}`;
			//console.log("BB:",degreeQuery);
            mysqlService.query(degreeQuery)
                .then(function (response) {
                    resolve("Success");
                }, function (err) {
                    if (err) {
                        var error = err;
                        error.status = 503;
                        return reject(error)
                    };
                });
        });
    }

	async function getBouncebackDegreeById(id) {
		let degreeListQuery = `SELECT * from bounceback_degree where id=`+id;
		let degreeData = await executeCollegeAdminQuery(degreeListQuery);
		let degreeCollegeListQuery = "SELECT bc.college_id,cc.college_name,bc.display_order,bc.burb from bounceback_colleges as bc left join colleges as cc on bc.college_id=cc.id where bounceback_degree_id="+id+" order by display_order asc";
		let degreeCollegeList = await executeCollegeAdminQuery(degreeCollegeListQuery);
        return  superAdminBouncebackDegreeModel(degreeData, degreeCollegeList);
    }

	async function getBouncebackDegreeCollegeList(id) {
		let collegeListQuery = "SELECT cc.college_name,cc.id,bc.display_order FROM bounceback_colleges as bc LEFT JOIN colleges as cc ON bc.college_id=cc.id WHERE bc.bounceback_degree_id="+id+" ORDER BY bc.display_order asc";
		let collegeList = await executeCollegeAdminQuery(collegeListQuery);
		return collegeList;
	}

	async function editCollegeListDegreeBounceback(bounceData) {
        return new Promise(async function (resolve, reject) {
			let checkDegreeExists = await checkDegreeBouncebackExist("edit", bounceData);
			//console.log("CD:", checkDegreeExists);
			if(checkDegreeExists[0].total == 0){
				//console.log("here");
				let degreeData = {
					level_id: bounceData.levelId,
					bucket_id: bounceData.bucketId,
					secondary_bucket_id: bounceData.secBucketId,
					secondary_bucket_title: bounceData.secBucketTitle,
					updated_by: bounceData.adminId,
					updated_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
				}
				let saveQuery = "";
				if(bounceData.type == "degreeorder"){
					saveQuery = `UPDATE degree_order SET ? WHERE id = ?`;
				}else{
					saveQuery = `UPDATE bounceback_degree SET ? WHERE id = ?`;
				}
				
				mysqlService.query(saveQuery,[degreeData,bounceData.id])
					.then(async function (response) {
						if(response){
							//console.log("RR:", response);
							let resultData = await editBouncebackColleges(bounceData.id, bounceData);
							resolve(resultData);
						}
					},function(err){  
						if (err) {
							var error = err;
							error.status = 503;
							return reject(error)
						};
					});
			}else{
				resolve('exist');
			}
		});
	}

	async function editBouncebackColleges(degreeId, bounceData) {
		let result = "";
		//console.log("Bounce:",bounceData.saveCollegeOrder);
		for (let i = 0; i < bounceData.saveCollegeOrder.length; i++) {
			let checkQuery = "";
			if(bounceData.type == "degreeorder"){
				checkQuery = "SELECT COUNT(id) as total FROM degree_order_colleges where degree_order_id="+degreeId+" and college_id="+bounceData.saveCollegeOrder[i].id;
			}else{
				checkQuery = "SELECT COUNT(id) as total FROM bounceback_colleges where bounceback_degree_id="+degreeId+" and college_id="+bounceData.saveCollegeOrder[i].id;
			}	
			
			//console.log("WW:",checkQuery);
			let checkExist = await executeCollegeAdminQuery(checkQuery);
			//console.log("BB:",checkExist);
			let orderValue = bounceData.saveCollegeOrder[i].order + 1;
			
			let degreeQuery = "";
			if(checkExist && checkExist[0].total == 0){
				if(bounceData.type == "degreeorder"){
					degreeQuery = "Insert into degree_order_colleges (degree_order_id,college_id,burb,display_order) values ("+degreeId+","+bounceData.saveCollegeOrder[i].id+",'"+bounceData.saveCollegeOrder[i].burb+"',"+orderValue+")";
				}else{
					degreeQuery = "Insert into bounceback_colleges (bounceback_degree_id,college_id,burb,display_order) values ("+degreeId+","+bounceData.saveCollegeOrder[i].id+",'"+bounceData.saveCollegeOrder[i].burb+"',"+orderValue+")";
				}
			}else{
				if(bounceData.type == "degreeorder"){
					degreeQuery = "UPDATE degree_order_colleges SET display_order ="+orderValue+",burb='"+bounceData.saveCollegeOrder[i].burb+"' WHERE degree_order_id="+degreeId+" and college_id="+bounceData.saveCollegeOrder[i].id;
				}else{
					degreeQuery = "UPDATE bounceback_colleges SET display_order ="+orderValue+",burb='"+bounceData.saveCollegeOrder[i].burb+"' WHERE bounceback_degree_id="+degreeId+" and college_id="+bounceData.saveCollegeOrder[i].id;
				}
			}
			//console.log("Up:",degreeQuery);
			await executeCollegeAdminQuery(degreeQuery);
			if (i == bounceData.saveCollegeOrder.length - 1) {
				result = "success";
			}
		}

		if(result == "success"){
			let deleteData = bounceData.saveCollegeOrder.map(a => a.id).join(',');
			let deleteQuery = "";
			if(bounceData.type == "degreeorder"){
				deleteQuery = "DELETE FROM degree_order_colleges where degree_order_id="+degreeId+" and college_id not in ("+ stringUtil.joinStringWithComma(deleteData) +")";
			}else{
				deleteQuery = "DELETE FROM bounceback_colleges where bounceback_degree_id="+degreeId+" and college_id not in ("+ stringUtil.joinStringWithComma(deleteData) +")";
			}
			//console.log("del:",deleteQuery);
			await executeCollegeAdminQuery(deleteQuery);
		}

		return "success";
	}

	async function updateCollegeinfoState(collegeinfo) {
		return new Promise(function (resolve, reject) {
			let updateQuery = 'UPDATE `colleges` SET include_app_state="' + collegeinfo.appStateValue + '",include_legion_state="' + collegeinfo.legionStateValue + '",include_flow_state="' + collegeinfo.flowStateValue + '",include_military_state="' + collegeinfo.militaryStateValue + '" WHERE id = ' + collegeinfo.collegeId;
			mysqlService.query(updateQuery)
                .then(function (response) {
                    resolve("Success");
                }, function (err) {
                    if (err) {
                        var error = err;
                        error.status = 503;
                        return reject(error)
                    };
                });
		});
	}

	const getDegreeOrderList = async (status) => {
		return mysqlService.query("SELECT id,(SELECT title FROM levels WHERE id=level_id) as degree_level,(SELECT title FROM bucket_degree WHERE id=bucket_id) as primary_bucket,secondary_bucket_title FROM `degree_order` WHERE degree_status='"+status+"' order by created_date asc")
	}

	const getDegreeOrderById = async (id) => {
		let degreeListQuery = `SELECT * from degree_order where id=`+id;
		let degreeData = await executeCollegeAdminQuery(degreeListQuery);
		let degreeCollegeListQuery = "SELECT bc.college_id,cc.college_name,bc.display_order,bc.burb from degree_order_colleges as bc left join colleges as cc on bc.college_id=cc.id where degree_order_id="+id+" order by display_order asc";
		let degreeCollegeList = await executeCollegeAdminQuery(degreeCollegeListQuery);
        return  superAdminBouncebackDegreeModel(degreeData, degreeCollegeList);
    }

	const getDegreeOrderCollegeList = async (id) => {
		return mysqlService.query("SELECT cc.college_name,cc.id,bc.display_order FROM degree_order_colleges as bc LEFT JOIN colleges as cc ON bc.college_id=cc.id WHERE bc.degree_order_id="+id+" ORDER BY bc.display_order asc");
	}

	const updateDegreeOrderById = async (degreeStatus, id) => {
		return mysqlService.query( `UPDATE degree_order SET degree_status = "${degreeStatus}" WHERE id = ${id}`);
    }

	async function executeCollegeAdminQuery(sql) {
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

	const getParentCollegeListFilterByDegree = async(filter) => {
		let filterQuery = "SELECT cc.* FROM colleges as cc WHERE cc.status='active' and cc.id IN (select cr_id from college_majors_new as cmn LEFT JOIN bucket_secondary_degree_list as bsdl ON cmn.major_id=bsdl.major_id WHERE 1=1 ";
		if(filter.bucketId){
			filterQuery+= " and bsdl.bucket_primary_degree_id in ('"+filter.bucketId+"')";
		}
		if(filter.secBucketId){
			filterQuery+= " and bsdl.bucket_secondary_degree_id in ("+ stringUtil.joinStringWithComma(filter.secBucketId) +")";
		}
		if(filter.levelId){
			filterQuery+= " and cmn.aw_level in ('"+filter.levelId+"')";
		}
		filterQuery+= " )";
		let resultData = await mysqlService.query(filterQuery);
		return superAdminCollegeListModel(resultData);
	}

	const importCollegeInfo = async() => {
		let resultData = await mysqlService.query( `select * from college_import_data where import_status=1`);
		let a = 1;
		for (const collegeData of resultData) {
			await importCollegeDataInfo(collegeData,a);
			a++;
			//return result;
		}
		return "success";
	}

	const importCollegeDataInfo = async(collegeData,a) => {
		let collegeInfoData = {
			edge_college_id :0,
			college_name_old: "",
			college_name: collegeData.compare_college_name,
			address: "",
			address2: "",
			city: collegeData.city,
			state: collegeData.state,
			postal_code: collegeData.zip,
			contact_email: "",
			website: collegeData.insturl?collegeData.insturl:"",
			access_level: "Registered",
			facility_code: collegeData.facility_code,
			college_alias: collegeData.college_alias+"-"+a,
			status: "ACTIVE",
			phone_number: "",
			fax_number: "",
			college_type: "traditional",
			college_abbreviation: "",
			phone_required: "no"
		}
		let results = await mysqlService.query("INSERT INTO colleges SET ?", collegeInfoData);
		let collegeProfileData = {
			college_id: results['insertId'],
			years_offered: collegeData.years_offered?collegeData.years_offered:"",
			public_private: collegeData.public_private?collegeData.public_private:"",
			gender_preference: "",
			setting: "",
			degrees_offered: "",
			in_state_tuition: collegeData.in_state_tuition?collegeData.in_state_tuition:0,
			out_state_tuition: collegeData.out_state_tuition?collegeData.out_state_tuition:0,
			student_population: collegeData.student_population?collegeData.student_population:0,
			female_student_count: 0,
			male_student_count: 0,
			gpa_range: "",
			academic_level: "",
			rotc: "",
			awards_ace_credit: collegeData.awards_ace_credit,
			sva: "",
			religious_affiliation: "",
			ethnic_affiliation: "",
			sat_score: 0,
			act_score: 0,
			veteran_affairs_attn: "",
			veteran_affairs_address: "",
			veteran_affairs_address2: "",
			veteran_affairs_city: "",
			veteran_affairs_state: "",
			veteran_affairs_postal_code: "",
			veteran_affairs_fax: "",
			veteran_affairs_phone: "",
			veteran_affairs_email: "",
			veteran_affairs_website: "",
			principles_of_excellence: collegeData.principles_of_excellence,
			club_assoc_campus: collegeData.club_assoc_campus,
			veteran_affairs_website: collegeData.veteran_affairs_website,
			bah: collegeData.bah?collegeData.bah:0,
			gi_bill: collegeData.gi_bill?collegeData.gi_bill:0,
			overview: "",
			college_photo: "",
			college_logo: "",
			eight_keys: collegeData.eight_keys,
			calendar: collegeData.calendar,
			books: collegeData.books?collegeData.books:0,
			accredit: collegeData.accredit,
			member_soc: collegeData.member_soc,
			graduation_rate: collegeData.graduation_rate,
			in_state_tuition_graduate: 0,
			out_state_tuition_graduate: 0,
			student_population_undergraduate: 0,
			student_population_graduate: 0,
			display_text: "",
		}
		await mysqlService.query("INSERT INTO college_profiles SET ?", collegeProfileData);
		let extraCollegeData = {
			college_id: results['insertId'],
			accreditation_status: collegeData.accreditation_status,
			college_type: collegeData.college_type,
			accredited: collegeData.accredited,
			caution_flag: collegeData.caution_flag,
			caution_flag_reason: collegeData.caution_flag_reason,
			closure: collegeData.closure,
			complies_with_sec: collegeData.complies_with_sec,
			cross_data: collegeData.cross_data,
			dodmou: collegeData.dodmou,
			in_state_tution_info: collegeData.in_state_tution_info,
			online_all: collegeData.online_all,
			p911_recipients: collegeData.p911_recipients?collegeData.p911_recipients:0,
			p911_yr_recipients: collegeData.p911_yr_recipients?collegeData.p911_yr_recipients:0,
			school_system_name: collegeData.school_system_name,
			sec_702: collegeData.sec_702,
			vetsuccess_email: collegeData.vetsuccess_email,
			vetsuccess_name: collegeData.vetsuccess_name,
			vrrap_provider: collegeData.vrrap_provider,
		}
		await mysqlService.query("INSERT INTO college_extra_data SET ?", extraCollegeData);
		let degreeData = await mysqlService.query(`select * from import_colleges_degrees where iped_code="${collegeData.iped_code}"`);
		let insertQuery = '';
		insertQuery = 'Insert into college_majors_new (cr_id,major_id,aw_level,gov_id,in_person) values ';
		for (i = 0; i < degreeData.length; i++) {
			if (i == degreeData.length - 1) {
				insertQuery += "("+ results['insertId'] +","+ degreeData[i].degree_id +","+ degreeData[i].level_id +",'" + collegeData.iped_code + "',1);";
			} else {
				insertQuery += "("+ results['insertId'] +","+ degreeData[i].degree_id +","+ degreeData[i].level_id +",'" + collegeData.iped_code + "',1),";
			}
		}
		await mysqlService.query(insertQuery);
		return "";
	}

	const manageImportCollegeOverview = async() => {
		let resultData = await mysqlService.query( `select cc.*,cp.*,(select group_concat(distinct title) from levels as ll left join college_majors_new as cmn on ll.id=cmn.aw_level where cr_id=ced.college_id) as degree from college_extra_data as ced left join colleges as cc on ced.college_id=cc.id left join college_profiles as cp on ced.college_id=cp.college_id`);
		let a = 1;
		for (const collegeData of resultData) {
			await updateCollegeOverview(collegeData,a);
			a++;
			//console.log("Start:",a)
			//return result;
		}
		//console.log("Complete!!")
		return "success";
	}

	const updateCollegeOverview = async(collegeData,a) => {
		let collegeName = stringUtil.manageCollegeName(collegeData.college_name);
		let overTemplate= "<html><head><title></title></head><body><p><meta charset='utf-8' /></p>";
		overTemplate+= "<h2>"+collegeName+"</h2>";
		overTemplate+= "<p>"+collegeName+" is a "+collegeData.years_offered+", "+stringUtil.titleCase(collegeData.public_private)+" university, located in "+stringUtil.titleCase(collegeData.city)+","+collegeData.state+". Students at "+collegeName+" can enroll in "+collegeData.degree+" programs.</p>";
		overTemplate+= "<h3>"+collegeName+" Military &amp; Veteran Support Programs</h3>";
		overTemplate+= "<p>"+collegeName+" offers the following veteran and military support programs:</p><ul><li>"+collegeName+" has <a href='https://collegerecon.com/gi-bill/' target='_blank'>GI Bill</a>-approved programs</li><li>"+collegeName+" is not approved for&nbsp;<a href='https://collegerecon.com/tuition-assistance/' target='_blank'>Tuition Assistance</a></li><li>"+collegeName+" is not a &nbsp;<a href='https://collegerecon.com/yellow-ribbon-schools/' target='_blank'>Yellow Ribbon school</a></li><li>"+collegeName;
		if(collegeData.awards_ace_credit == "YES"){
			overTemplate+= " offers ";
		}else{
			overTemplate+= " does not offers "
		}
		overTemplate+= " &nbsp;<a href='https://collegerecon.com/military-college-credit/' target='_blank'>credit for military</a></li>";
		overTemplate+= "<li>"+collegeName+" does not award credit for the <a href='https://collegerecon.com/clep-military/' target='_blank'>CLEP</a> exam</li>";
		overTemplate+= "<li>"+collegeName+" does not award credit for the <a href='https://collegerecon.com/dsst-exam/' target='_blank'>DSST</a> exam</li></ul>";
		overTemplate+= "<h3>Is "+collegeName+" a GI Bill-approved school?</h3>";
		overTemplate+= "<p> Yes, "+collegeName+" is a&nbsp;GI Bill-approved school. However, you will need to check with the school to ensure that the GI Bill covers your preferred degree program.</p>";
		overTemplate+= "<h3>Is "+collegeName+" a Yellow Ribbon school?</h3>";
		if(collegeData.public_private.toLowerCase() == 'public'){
			overTemplate+= "<p>No, "+collegeName+" is not a Yellow Ribbon school.</p><p>However, as "+collegeName+" is a public institution, your tuition costs should be covered by the GI Bill assuming you have full eligibility. You should check with the school to ensure that your preferred degree program is 100% covered.</p>";
		}else{
			overTemplate+= "<p>No, "+collegeName+" is not a Yellow Ribbon school.</p><p>Some tuition costs may not be covered by the GI Bill.  As a result, you may have out-of-pocket costs for which you are responsible to cover your full tuition.</p>";
		}
		overTemplate+= "<h3>Does "+collegeName+" offer Yellow Ribbon for master&rsquo;s programs?</h3>";
		if(collegeData.public_private.toLowerCase() == 'public'){
			overTemplate+= "<p>No, "+collegeName+" does not have Yellow Ribbon funding for their master's degree programs.</p><p>However, as "+collegeName+" is a public institution, your tuition costs may be fully covered by the GI Bill assuming you have full eligibility. You should check with the school to ensure that your preferred master&rsquo;s degree program is 100% covered.</p>";
		}else{
			overTemplate+= "<p>No, "+collegeName+" does not offer Yellow Ribbon funding for its master&rsquo;s programs.</p><p>This means that some tuition costs may not be fully covered by the GI Bill.  As a result, you may have out-of-pocket costs for which you are responsible to cover your full tuition for a master&rsquo;s program.</p>";
		}
		overTemplate+= "<h3>Does "+collegeName+" offer college credit for military service?</h3>";
		if(collegeData.awards_ace_credit == "YES"){
			overTemplate+= "<p>Yes, "+collegeName+" offers college credit for military service.</p><p>You will need to verify with the school to determine how many college credits you will receive for your military experience.</p>";
		}else{
			overTemplate+= "<p>No, "+collegeName+" does not offer college credit for military service.</p><p>In order to finish your degree as quickly as possible, you may want to research universities that provide credit for military service.</p>";
		}
		overTemplate+= "<h3>Does "+collegeName+" offer a military discount or reduced tuition rates for military and veterans?</h3>";
		if(collegeData.public_private.toLowerCase() == 'public'){
			overTemplate+= "<p>No, "+collegeName+" does not necessarily offer a military discount or reduced tuition for military and veterans.  However, as a state school, its rate may not exceed the military tuition assistance cap of $250.  You should verify with the university to find out if the rate is below the military tuition assistance cap of $250 per credit hour.  Otherwise, you may have out-of-pocket tuition costs for which you would be responsible.</p>";
		}else{
			overTemplate+= "<p>No, "+collegeName+" does not offer a military discount or reduced tuition for military and veterans.  You should verify with the university to find out if the rate is below the military tuition assistance cap of $250 per credit hour.  Otherwise, you may have out-of-pocket tuition costs for which you would be responsible.";
		}
		overTemplate+= "<h3>What are "+collegeName+"&rsquo;s military tuition rates for active military using tuition assistance funding?</h3>";
		overTemplate+=  "<p>"+collegeName+" has not provided their tuition rates for active military.<p>We recommend that you contact the school to verify that the courses you wish to pursue do not exceed the $250 rate cap for military tuition assistance.</p>";
		overTemplate+= "<h3>What are "+collegeName+"&rsquo;s online tuition rates for active military?</h3>";
		overTemplate+=  "<p>"+collegeName+" has not provided its tuition rates for active military.<p>We recommend that you contact the school to verify that the courses you wish to pursue do not exceed the $250 rate cap for military tuition assistance.</p>";
		overTemplate+= "<h3>Does "+collegeName+" offer online degree programs?</h3>";
		overTemplate+= "<p>No, "+collegeName+" does not currently offer online degree programs.";
		overTemplate+= "<h3>Is "+collegeName+" approved for Tuition Assistance (TA)?</h3>";
		overTemplate+= "<p>No, "+collegeName+" is not approved for Tuition Assistance (TA).<p>This means that the student may be responsible for any uncovered tuition costs, meaning you may have out-of-pocket costs.</p>";
		overTemplate+= "<h3>Is "+collegeName+" approved for MyCAA?</h3>";
		overTemplate+= "<p>No, "+collegeName+" does not currently offers programs approved for funding by the <a href='https://collegerecon.com/mycaa/' target='_blank'>MyCAA</a> program.</p>";
		overTemplate+= "</body> </html>";
		await mysqlService.query( `UPDATE college_profiles SET overview = "${overTemplate}" WHERE college_id = ${collegeData.college_id}`);
		return "";
	}

	const manageImportCollegeMetadata = async() => {
		let resultData = await mysqlService.query( `select cc.id,cc.college_name from college_extra_data as ced left join colleges as cc on ced.college_id=cc.id`);
		let a = 1;
		for (const collegeData of resultData) {
			await insertMetaData(collegeData,a);
			a++;
			//console.log("Start:",a)
			//return result;
		}
		//console.log("Complete!!")
		return "success";
	}

	const insertMetaData = async(collegeData,a) => {
		let collegeName = stringUtil.manageCollegeName(collegeData.college_name);
		let metaData = {
			college_id: collegeData.id,
			page_title: collegeName+" | GI Bill or Yellow Ribbon",
			description: "See if "+collegeName+" is approved for Military Tuition Assistance, GI Bill, or the Yellow Ribbon program.",
			keywords: collegeName+", gi bill, veterans, military, tuition assistance, yellow ribbon",
			og_title: collegeName+" | GI Bill or Yellow Ribbon",
			og_description: "See if "+collegeName+" is approved for Military Tuition Assistance, GI Bill, or the Yellow Ribbon program.",
			status: 'ACTIVE'
		}
		await mysqlService.query("INSERT INTO college_metadata SET ?", metaData);
		return "";
	}

	return {
		listColleges: listColleges,
		listInactiveColleges: listInactiveColleges,
		addCollegeinfo: addCollegeinfo,
		editCollegeinfo: editCollegeinfo,
		accessEditCollegeinfo: accessEditCollegeinfo,
		collegeSearchData: collegeSearchData,
		listCollegesData: listCollegesData,
		getCollegeDataById: getCollegeDataById,
		listNationalCollegesData: listNationalCollegesData,
		listStateCollegesData: listStateCollegesData,
		saveNationalList: saveNationalList,
		listCollegesByState: listCollegesByState,
		saveStateList: saveStateList,
		listStateWiseCollegesCount: listStateWiseCollegesCount,
		manageCollegeBucketRelation: manageCollegeBucketRelation,
		manageStudentBucketRelation: manageStudentBucketRelation,
		manageCollegeBucketRelationPartial:manageCollegeBucketRelationPartial,
		listCollegeContacts: listCollegeContacts,
		editCollegeContacts: editCollegeContacts,
		collegeContactsData: collegeContactsData,
		addCollegeContactsData: addCollegeContactsData,
		listCollegeImageInfoList: listCollegeImageInfoList,
		listStateWiseBounceCollegesCount: listStateWiseBounceCollegesCount,
		listCollegesBounceByState: listCollegesBounceByState,
		listNationalBounceCollegesData: listNationalBounceCollegesData,
		saveNationalBounceList: saveNationalBounceList,
		listStateBounceCollegesData: listStateBounceCollegesData,
		saveBounceStateList: saveBounceStateList,
		listCollegesBySearchText: listCollegesBySearchText,
		getUsersByBucketData: getUsersByBucketData,
		saveNationalBounceTick: saveNationalBounceTick,
		saveSpecificCollegeName: saveSpecificCollegeName,
		getSpecificCollegeName: getSpecificCollegeName,
		updateSpecificCollegeName: updateSpecificCollegeName,
		deleteSpecificCollegeDegree: deleteSpecificCollegeDegree,
		listSpecificCollegeDegree: listSpecificCollegeDegree,
		listSpecificCollegeDegreeById: listSpecificCollegeDegreeById,
		saveSpecificCollegeDegree: saveSpecificCollegeDegree,
		deleteCollegeSpecificDegree: deleteCollegeSpecificDegree,
		addScholarshipData: addScholarshipData,
		getAllScholarshipData: getAllScholarshipData,
		getScholarshipDataById: getScholarshipDataById,
		getScholarshipOptionDataById: getScholarshipOptionDataById,
		editScholarshipData: editScholarshipData,
		deleteScholarshipDataById: deleteScholarshipDataById,
		getCollegeSpecificDegreeById: getCollegeSpecificDegreeById,
		addSpecificDegreeData: addSpecificDegreeData,
		getSpecificDegreeDataById: getSpecificDegreeDataById,
		editSpecificDegreeData: editSpecificDegreeData,
		deleteSpecificDegreeDeleteById: deleteSpecificDegreeDeleteById,
		importSpecificDegreeCollegeData: importSpecificDegreeCollegeData,
		listNonSpecificCollegesData: listNonSpecificCollegesData,
		searchScholarshipData: searchScholarshipData,
		getScholarshipDegree: getScholarshipDegree,
		getScholarshipSecondaryDegree: getScholarshipSecondaryDegree,
		editSpecificDegreeStatus: editSpecificDegreeStatus,
		getCollegeImageInfoById: getCollegeImageInfoById,
		getBouncebackDegreeList: getBouncebackDegreeList,
		getCollegeListFilterByDegree: getCollegeListFilterByDegree,
		addCollegeListDegreeBounceback: addCollegeListDegreeBounceback,
		updateBouncebackDegreeById: updateBouncebackDegreeById,
		getBouncebackDegreeById: getBouncebackDegreeById,
		getBouncebackDegreeCollegeList: getBouncebackDegreeCollegeList,
		editCollegeListDegreeBounceback: editCollegeListDegreeBounceback,
		updateCollegeinfoState: updateCollegeinfoState,
		getDegreeOrderList,
		getDegreeOrderById,
		getDegreeOrderCollegeList,
		updateDegreeOrderById,
		importCollegeInfo,
		manageImportCollegeOverview,
		manageImportCollegeMetadata,
		getParentCollegeListFilterByDegree
	}

})();

module.exports = superAdminCollegeService;