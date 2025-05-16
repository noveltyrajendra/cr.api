const searchService = (function () {

  const config = require('../config');
  const mysqlService = require('./mysqlService');
  const emailService = require('./emailService');
  const sha1 = require('sha1');
  const stringUtil = require('../utils/stringUtil');
  const messageEmail = require('../utils/messageEmail');
  const { errorHandler } = require('../utils/errorHandler');
  const emailConstant = require('../constants/emailConstant');
  const searchConstant = require('../constants/searchConstant');
  const authenicateConstant = require('../constants/authenicateConstant');
  const constantContactService = require('../services/constantContactService');
  const authenicateService = require('../services/authenicateService');
  const searchCollegeListModel = require('../models/searchCollegeListModel');
  const moment = require('moment');
  const axios = require("axios");
  const { GoogleSpreadsheet } = require('google-spreadsheet');
  const creds = require('../google-generated-creds.json');
  const doc = new GoogleSpreadsheet(authenicateConstant.EXCEL_ID);

  function processSearchData(userData) {
    return new Promise(function (resolve, reject) {

      veteranRegister(userData).then(async function (response) {
        if (response.uuid) {
          if(userData.primary_source == "scholarshipfinder")
          {
            resolve(response);
          }else{
            const nodeEnv = process.env.NODE_ENV;
            if(nodeEnv == "production" && userData.primary_source == "program matcher" && userData.secondary_source == "/register/utmsource/bold"){
              const boldResponse = await axios({
                method: "get",
                url: searchConstant.BOLD_POST_URL+userData.subId,
                data: "",
              }).catch(async (error) => {
                console.error(error);
              });
            }
            insertSearchData(userData, response.uuid)
            .then(function (response1) {
              if (response1 == "success") {
                resolve(response);
              } else {
                resolve("error");
              }
            }, function (err) {
              if (err) {
                var error = err;
                error.status = 503;
                return reject(error)
              };
            })
          }
        } else {
          resolve(response);
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

  function veteranRegister(filters) {
    return new Promise(function (resolve, reject) {
      let uuid = stringUtil.UID();
      let terms_of_comm = "";
      if (filters.term == "") {
        terms_of_comm = 'N';
      } else {
        terms_of_comm = filters.term;
      }
      if(filters.passedIn_college_id){
        match_college_id = filters.passedIn_college_id;
      }else{
        match_college_id = 0;
      }
      let resultdata = {
        "uuid": uuid,
        "first_name": filters.first_name,
        "last_name": filters.last_name
      }
      checkUserExists(filters.email).then(function (response) {
        if (response.length == 1) {
          resolve("userexist");
        } else if (response.length == 0) {
          let student = {
            uuid: uuid,
            email: filters.email,
            first_name: filters.first_name,
            last_name: filters.last_name,
            password: sha1(filters.password),
            utm_source: "",
            site_source: filters.site_source,
            primary_source: filters.primary_source,
            secondary_source: filters.secondary_source,
            match_college_id:match_college_id,
            utm_medium: "",
            utm_campaign: "",
            terms_of_comm: terms_of_comm,
            last_login: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
          };
          mysqlService.query(authenicateConstant.STUDENT_SAVE, student)
            .then((results) => {
              if (results["affectedRows"] == 1) {
                // let academic1 = "0";
                // let academic2 = "0";
                // let academic3 = "0";
                // let area_focus = "";
                // if(filters.area_focus_ids){
                //   area_focus = filters.area_focus_ids.split(",");
                // }

                // if(area_focus.length > 0){
                //   academic1 = area_focus[0];
                // }
                // if(area_focus.length > 1){
                //   academic2 = area_focus[1];
                // }
                // if(area_focus.length > 2){
                //   academic3 = area_focus[2];
                // }
                let check_phone = "no";
                if(filters.check_phone_number){
                  check_phone = filters.check_phone_number;
                }
                let stateval = "";
                if (filters.study_state.length > 0) {
                  stateval = filters.study_state[0]['value'];
                }
                if(filters.military_rank == ""){
                  military_rank = 0;
                }else{
                  military_rank = filters.military_rank;
                }
                let levelId=0;
                if(isNaN(filters.education_goal)){
                  let levelD = filters.education_goal.split(",");
                  levelId = levelD[0];
                }else{
                  levelId = filters.education_goal;
                }

                let studentprofile = {
                  uuid: uuid,
                  postal_code: filters.zip_code,
                  military_status: filters.military_status,
                  military_branch: filters.military_branch,
                  //state: filters.state,
                  state: stateval,
                  level_id: levelId,
                  bucket_id: filters.bucket_id,
                  phone_number: filters.phone_number,
                  check_phone_number: check_phone,
                  profile_image: "",
                  name_of_school: "",
                  sat_score: "",
                  secondary_bucket_id: filters.secondary_bucket_ids,
                  military_rank: military_rank,
                  mos: filters.mos,
                  // academic_interest_1:academic1,
                  // academic_interest_2:academic2,
                  // academic_interest_3:academic3,
                  date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                };
                mysqlService.query(authenicateConstant.STUDENT_PROFILE_SAVE, studentprofile)
                  .then((presults) => {
                    
                    if (presults["affectedRows"] == 1) {
                      //const { commonLoginPortal } = require('./loginService');
                      processBucketData(filters, uuid).then(function (response) {
                        let statquery = 'INSERT INTO usage_statistics SET resource = "Workflow",college_id = 0,num_count=0 , student_id = "' + uuid + '"';
                        mysqlService.query(statquery)
                          .then(async (sresults) => {
                            //commonLoginPortal(filters, uuid);
                            if (config.DOMAIN_URL == "https://app.collegerecon.com") {
                              let listId = "";
                              if(filters.primary_source == 'scholarshipfinder')
                              {
                                listId = "1699440203";
                              }else{
                                listId = "2110708446";
                                /*if(filters.military_status == 'Spouse' || filters.military_status == 'Dependent'){
                                  listId = "1452629616";
                                }else{
                                  listId = "1574867395";
                                }*/
                              }
                              let constantcontact = {
                                "addresses": [
                                  {
                                    "address_type": "BUSINESS",
                                    "postal_code": filters.postal_code
                                  }
                                ],
                                "lists": [
                                  {
                                    "id": listId
                                  }
                                ],
                                "email_addresses": [
                                  {
                                    "email_address": filters.email
                                  }
                                ],
                                "first_name": filters.first_name,
                                "last_name": filters.last_name,
                                "created_date": moment(new Date()).format()
                              }
                              constantContactService.addUser(constantcontact).then(async function (response) {
                                let sheetResponse = "";
                                if(response == "success"){
                                  sheetResponse = response;
                                }else{
                                  sheetResponse = response.message;
                                }
                                const authenicateService = require('../services/authenicateService');
                                let gResponse = await authenicateService.addVeteranToGoogleSheet(filters.first_name, filters.last_name, filters.email, filters.primary_source, sheetResponse);
                                if (gResponse == "success") {
                                  resolve(resultdata);
                                }
                              }, function (err) { reject(new Error(err)); });
                            } else {
                              resolve(resultdata);
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
                    }
                  }).catch((err) => {
                    reject(new Error(err));
                  });
              }
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
    });
  }

  function processBucketData(filters, uuid) {
    return new Promise(function (resolve, reject) {
      let checkqry = "";
      if (filters.secondary_bucket_ids) {
        checkqry = "select major_id from bucket_secondary_degree_list where bucket_secondary_degree_id in (" + filters.secondary_bucket_ids + ")";
      } else {
        checkqry = "select major_id from bucket_secondary_degree_list where bucket_primary_degree_id in(" + filters.bucket_id + ")";
      }
      // console.log("checkqry:",checkqry);
      mysqlService.query(checkqry)
        .then((results) => {
          if (results.length > 0)
          {
            let insertQuery = "";
            insertQuery = "Insert into student_degree_relation (student_id,major_id) values ";
            for (i = 0; i < results.length; i++) {
              if (i == results.length - 1) {
                insertQuery += "('" + uuid + "'," + results[i].major_id + ");";
              } else {
                insertQuery += "('" + uuid + "'," + results[i].major_id + "),";
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
          }else{
            resolve("success");
          }
        }).catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function checkUserExists(email) {
    return new Promise(function (resolve, reject) {
      let checkqry ="select users.email, users.src from ( select email as email, 'user' as src from students where user_account_status='active' union select college_user_email as email, 'collegeAdmin' as src from college_users where status='active' union select admin_user_email as email, 'admin' as src from admin_users where status='active') users where users.email = '" + email + "' limit 1";
      mysqlService.query(checkqry)
        .then((results) => {
          resolve(results);
        }).catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function insertSearchData(searchdata, user_id) {
    return new Promise(function (resolve, reject) {
      let msupport = "";
      if (searchdata.military_support) {
        msupport = "yes";
      } else {
        msupport = "no";
      }
      let focus_ids = "";
      if (searchdata.area_focus_ids) {
        focus_ids = searchdata.area_focus_ids;
      }
      let sdata = {
        uuid: user_id,
        education_goal: searchdata.education_goal,
        // area_focus: focus_ids,
        secondary_bucket_id: searchdata.secondary_bucket_ids,
        study_type: searchdata.online,
        study_state: searchdata.study_state_values,
        military_support: msupport,
        military_branch: searchdata.military_branch,
        enrollment_military_status: searchdata.military_status,
        bucket_id: searchdata.bucket_id
      }
      mysqlService.query(searchConstant.SEARCHDATA_SAVE, sdata)
        .then((presults) => {
          if (presults["affectedRows"] == 1) {
            resolve("success");
          } else {
            resolve("error");
          }
        }).catch((err) => {
          reject(new Error(err));
        });
    });
  }

  function emailVeteran(email) {
    return new Promise(function (resolve, reject) {
      let message = messageEmail.veteranEmailMessage();
      let subject = emailConstant.NEW_VETERAN_REGISTER_SUBJECT;
      let to = [email];
      let from = emailConstant.NO_REPLY_EMAIL;
      emailService.sendEmail(from, to, subject, message).then(function (response) {
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

  function matchSearchData(filters) {
    return new Promise(function (resolve, reject) {
      var searchQuery = "";
      //if(filters.online){
      //searchQuery=searchConstant.GET_ALL_ONLINE_COLLEGE_SEARCH_QUERY;
      //}else{
      searchQuery = searchConstant.GET_ALL_COLLEGE_SEARCH_DISPLAY_QUERY;
      //}
      //Get sourrounding state
      let sourroundQuery = "Select sourrounding_statevalue from state_sourrounding where state_value in (" + stringUtil.joinStringByComma(filters.study_state_values.split(",")) + ")";
      mysqlService.query(sourroundQuery)
        .then(function (sresponse) {
          let sourround_state = "";
          let near_state = "";
          if (sresponse.length > 0 && sresponse[0]['sourrounding_statevalue'] != "") {
            //console.log("LL:",sresponse.length);
            if (sresponse.length > 1) {
              let setData = "";
              for (let i = 0; i < sresponse.length; i++) {
                setData += sresponse[i]['sourrounding_statevalue'] + ",";
              }
              setData = setData.slice(0, -1);
              sourrond_arr = stringUtil.removeDuplicates(setData.split(','));
              combineArr = [...filters.study_state_values.split(","), ...sourrond_arr];
              sourround_state = combineArr.join(',');
              //near_state = sourround_state;
              //console.log("SSSS:",sourround_state);
            } else {
              sourround_state = filters.study_state_values + "," + sresponse[0]['sourrounding_statevalue'];
              near_state = sresponse[0]['sourrounding_statevalue'];
            }
          } else {
            sourround_state = filters.study_state_values;
            near_state = "";
          }
          //console.log("SS:",sourround_state);
          var area_focus_ids = "";
          if (!filters.area_focus_ids) {
            let selectQuery = "";
            selectQuery = "select major_id from bucket_secondary_degree_list where bucket_primary_degree_id in (" + filters.bucket_id + ")";
            mysqlService.query(selectQuery)
              .then(function (response) {
                //resolve(response);
                if (response.length > 0) {
                  var ids = "";
                  for (i = 0; i < response.length; i++) {
                    ids += response[i].major_id + ",";
                  }
                  ids = ids.slice(0, -1);
                  //queryFilters=queryBuilder(filters,ids);
                  //subquery = searchQuery+queryFilters;
                  subquery = manageonlinequeryBuilder(searchQuery, filters, ids, sourround_state, filters.passedIn_college_id, near_state);
                  //console.log("QQ:",subquery);
                  if(filters.education_goal != 0){
                    if(isNaN(filters.education_goal) && filters.education_goal.indexOf(",") > -1){
                      allquery = "select a.*,(select group_concat(DISTINCT(major_id)) from college_majors_new where major_id in (" + ids + ") and cr_id=a.collegeId and aw_level in (" + filters.education_goal + ")) as majorCount  FROM (" + subquery + ") as a";
                    }else{
                      let educationGoal = getAcademicLevel(filters);
                      allquery = "select a.*,(select group_concat(DISTINCT(major_id)) from college_majors_new where major_id in (" + ids + ") and cr_id=a.collegeId and aw_level in (" + educationGoal + ")) as majorCount  FROM (" + subquery + ") as a";
                    }
                  }else{
                    allquery = "select a.*,(select group_concat(DISTINCT(major_id)) from college_majors_new where major_id in (" + ids + ") and cr_id=a.collegeId) as majorCount  FROM (" + subquery + ") as a";
                  }
                  //console.log("Q:",allquery);
                  mysqlService.query(allquery)
                    .then(function (response1) {
                      getSecondaryBucketMajorLists(filters).then(function (response2) {
                        resolve(searchCollegeListModel(response1, 0, filters.military_support, filters.study_state_values, filters.passedIn_college_id, sourround_state, filters.military_status,response2));
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
            //queryFilters=queryBuilder(filters,area_focus_ids);
            //subquery = searchQuery+queryFilters;
            subquery = manageonlinequeryBuilder(searchQuery, filters, area_focus_ids, sourround_state, filters.passedIn_college_id, near_state);
            //console.log("QB:",subquery);
            let educationGoal = getAcademicLevel(queryFilters);
            allquery = "select a.*,(select count(*) as ctn from college_majors_new where major_id in (" + area_focus_ids + ") and cr_id=a.collegeId and aw_level in (" + educationGoal + ")) as majorCount  FROM (" + subquery + ") as a";
            //console.log("Q:",allquery);
            mysqlService.query(allquery)
              .then(function (response) {
                //resolve(response);
                resolve(searchCollegeListModel(response, filters.area_focus.length, filters.military_support, filters.study_state_values, filters.passedIn_college_id,""));
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
			let educationGoal = getAcademicLevel(filters);
			let selectQuery = "select group_concat(DISTINCT(cmn.major_id)) as major_id from bucket_secondary_degree_list as bsd left join college_majors_new as cmn on bsd.major_id=cmn.major_id where bsd.bucket_secondary_degree_id in (" + filters.secondary_bucket_ids + ") and cmn.aw_level in (" + educationGoal + ")";
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

  function getAcademicLevel(data){
    let educationGoal = "";
    if(data.primary_source == "scholarshipfinder"){
      educationGoal = data.education_goal;
    }
		else{
      if(searchConstant.EducationalLevel.indexOf(data.education_goal) > -1){
        educationGoal = data.education_goal;
      }else{
        educationGoal = "6,8,18";
      }
    }
		return educationGoal;
	}

  function manageonlinequeryBuilder(searchQuery, filters, area_focus_ids, sourround_state, cid, near_state) {
    tradQuery = tradqueryBuilder(filters, area_focus_ids, sourround_state);
    onlineQuery = onlinequeryBuilder(filters, area_focus_ids, sourround_state);
    degreeOnlineQuery = degreeOnlinequeryBuilder(filters, area_focus_ids, sourround_state);
    orderQuery = orderqueryBuilder(filters, area_focus_ids, sourround_state);
    //Specific Degree Rule:
    specificDegreeOnlineRule = specificDegreeRuleBuilder(filters,'online');
    specificDegreeRule = specificDegreeRuleBuilder(filters,'');
    
    if (cid) {
      staticQuery = staticqueryBuilder(cid);
    } else {
      staticQuery = "";
    }
    if(near_state){
      let educationGoal = getAcademicLevel(filters);
      nearFilters = " and c.id in (select id from colleges where access_level='Patriot' and state in ("+stringUtil.joinStringByComma(near_state.split(","))+")) and c.id in (select cr_id from college_majors_new where major_id in (" + area_focus_ids + ") and aw_level in (" + educationGoal + "))";
    }
    if (filters.online) {
      queryFilters = searchQuery + orderQuery + " UNION " + searchQuery + onlineQuery + " UNION " +specificDegreeOnlineRule;
    } else {
      //queryFilters = searchQuery+orderQuery +" UNION "+ searchQuery+tradQuery +" UNION "+ searchQuery+onlineQuery;
      if(staticQuery && near_state){
        queryFilters = searchQuery + orderQuery + " UNION " + searchQuery + tradQuery + " UNION " + searchQuery + onlineQuery + " UNION " + searchQuery + degreeOnlineQuery + " UNION " + searchQuery + staticQuery + " UNION " + searchQuery + nearFilters + " UNION " +specificDegreeRule;
      }else if (near_state) {
        queryFilters = searchQuery + orderQuery + " UNION " + searchQuery + tradQuery + " UNION " + searchQuery + onlineQuery + " UNION " + searchQuery + degreeOnlineQuery + " UNION " + searchQuery + nearFilters + " UNION " +specificDegreeRule;
      }else if (staticQuery) {
        queryFilters = searchQuery + orderQuery + " UNION " + searchQuery + tradQuery + " UNION " + searchQuery + onlineQuery + " UNION " + searchQuery + degreeOnlineQuery + " UNION " + searchQuery + staticQuery + " UNION " +specificDegreeRule;
      } else {
        queryFilters = searchQuery + orderQuery + " UNION " + searchQuery + tradQuery + " UNION " + searchQuery + onlineQuery + " UNION " + searchQuery + degreeOnlineQuery + " UNION " +specificDegreeRule;
      }
    }
    //console.log("QQ:",queryFilters);
    /*if(filters.pageNumber != 0){
      queryFilters += " ORDER BY display_order DESC, collegeId ASC";
    }else{
      queryFilters += " ORDER BY display_order DESC";
    }*/
    return queryFilters;
  }

  function specificDegreeRuleBuilder(filters,type){
    let queryFilters = "Select c.id as collegeId,c.contact_email,c.college_type,(cds.new_college_name)as college_name,college_alias,seo_name,address,city, state, postal_code, phone_number,phone_required,website,convert(cast(convert(overview using latin1) as binary) using utf8) as overview, college_logo,college_photo,access_level,cp.full_time_vet_counselors,cp.principles_of_excellence,cp.awards_ace_credit,cp.yellow_ribbon,cp.approved_ta_funding,cp.reduced_tuition,cp.public_private,cp.in_state_tuition,cp.out_state_tuition,1 as isSpecificDegree,c.specific_profile_id,cds.college_id as parentCollegeId FROM colleges c LEFT JOIN college_profiles cp on c.id=cp.college_id LEFT JOIN default_colleges as tc on c.id=tc.college_id LEFT JOIN college_degree_specific_info cds ON c.id=cds.college_info_id where c.status='ACTIVE' AND cds.degree_status = 'partner'";

    if(filters.education_goal != 0){
      if(isNaN(filters.education_goal) && filters.education_goal.indexOf(",") > -1){
        queryFilters += " and cds.level_id in ("+filters.education_goal+") ";
      }else{
        let educationGoal = getAcademicLevel(filters);
        queryFilters += " and cds.level_id in ("+educationGoal+") ";
      }
    }
    

    if(filters.bucket_id.indexOf(",") > -1){
      let buckets = filters.bucket_id.split(",");
      if(buckets.length == 2){
        queryFilters += ` and `;
        for(let i=0;i<buckets.length;i++){
          if(i == 0){
            queryFilters += ` (FIND_IN_SET('${buckets[i]}',cds.bucket_id)`;
          }else{
            queryFilters += ` or FIND_IN_SET('${buckets[i]}',cds.bucket_id))`;
          }
        }
      }else{
        queryFilters += ` and `;
        for(let i=0;i<buckets.length;i++){
          if(i == 0){
            queryFilters += ` (FIND_IN_SET('${buckets[i]}',bucket_id)`;
          }else if(i<= buckets.length - 2){
            queryFilters += ` or FIND_IN_SET('${buckets[i]}',bucket_id)`;
          }else{
            queryFilters += ` or FIND_IN_SET('${buckets[i]}',bucket_id))`;
          }
        }
      }
    }else{
      queryFilters += " and FIND_IN_SET("+filters.bucket_id+",cds.bucket_id)";
    }

    if(filters.secondary_bucket_ids.indexOf(",") > -1){
      let secBuckets = filters.secondary_bucket_ids.split(",");
      if(secBuckets.length == 2){
        queryFilters += ` and `;
        for(let i=0;i<secBuckets.length;i++){
          if(i == 0){
            queryFilters += ` (FIND_IN_SET('${secBuckets[i]}',cds.sec_bucket_id)`;
          }else{
            queryFilters += ` or FIND_IN_SET('${secBuckets[i]}',cds.sec_bucket_id))`;
          }
        }
      }else{
        queryFilters += ` and `;
        for(let i=0;i<secBuckets.length;i++){
          if(i == 0){
            queryFilters += ` (FIND_IN_SET('${secBuckets[i]}',sec_bucket_id)`;
          }else if(i<= secBuckets.length - 2){
            queryFilters += ` or FIND_IN_SET('${secBuckets[i]}',sec_bucket_id)`;
          }else{
            queryFilters += ` or FIND_IN_SET('${secBuckets[i]}',sec_bucket_id))`;
          }
        }
      }
    }else{
      queryFilters += " and FIND_IN_SET("+filters.secondary_bucket_ids+",cds.sec_bucket_id)";
    }

    if(type == "online"){
      queryFilters += " and degree_rule='online'";
    }
    
    return queryFilters;
  }

  function staticqueryBuilder(cid) {
    var queryFilters = '';
    queryFilters += " and c.id =" + cid;
    return queryFilters;
  }

  function onlinequeryBuilder(filters, area_focus_ids, sourround_state) {
    var queryFilters = '';
    queryFilters += " and c.college_type ='online' and search_online_display='Yes'";
    let stringState = "";
    /*let sdata = sourround_state.split(",");
    for (i = 0; i < sdata.length; i++) {
      stringState += "exclude_flow_state not like '%" + sdata[i] + "%' or ";
    }*/
    for(i=0;i<filters.study_state.length;i++){
      stringState +="include_flow_state like '%"+filters.study_state[i]["value"]+"%' or ";
    }
    //queryFilters += " and (" + stringState + " include_flow_state is null)";
    if(filters.study_state_values != "Online"){
      queryFilters += " and (" + stringState.slice(0, -4) + ")";
    }

    return queryFilters;
  }

  function degreeOnlinequeryBuilder(filters, area_focus_ids, sourround_state) {
    let educationGoal = getAcademicLevel(filters);
    var queryFilters = '';
    queryFilters += " and c.college_type ='online' and search_online_display='No'";
    let stringState = "";
    /*let sdata = sourround_state.split(",");
    for (i = 0; i < sdata.length; i++) {
      stringState += "exclude_flow_state not like '%" + sdata[i] + "%' or ";
    }*/
    for(i=0;i<filters.study_state.length;i++){
      stringState +="include_flow_state like '%"+filters.study_state[i]["value"]+"%' or ";
    }
    //queryFilters += " and (" + stringState + " include_flow_state is null)";
    if(filters.study_state_values != "Online"){
      queryFilters += " and (" + stringState.slice(0, -4) + ")";
    }
    queryFilters += " and c.id in (select cr_id from college_majors_new where major_id in (" + area_focus_ids + ") and aw_level in (" + educationGoal + "))";

    return queryFilters;
  }

  function orderqueryBuilder(filters, area_focus_ids, sourround_state) {
    let educationGoal = getAcademicLevel(filters);
    var queryFilters = '';
    //queryFilters += " and tc.college_type='state' and tc.state_name in (" + stringUtil.joinStringByComma(sourround_state.split(",")) + ")";
    let stringState = "";
    /*let sdata = sourround_state.split(",");
    for (i = 0; i < sdata.length; i++) {
      stringState += "exclude_flow_state not like '%" + sdata[i] + "%' or ";
    }*/
    for(i=0;i<filters.study_state.length;i++){
      stringState +="include_flow_state like '%"+filters.study_state[i]["value"]+"%' or ";
    }
    //queryFilters += " or (" + stringState + " include_flow_state is null)";
    //queryFilters += " and (" + stringState.slice(0, -4) + ")";
    queryFilters += " and tc.college_type='state' and (tc.state_name in (" + stringUtil.joinStringByComma(filters.study_state_values.split(",")) + ") and ("+ stringState.slice(0, -4) + "))";
    if (filters.online) {
      queryFilters += " and c.college_type ='online'";
    }

    /** For And Query */
    //queryFilters +=" and state in ("+stringUtil.joinStringByComma(filters.study_state_values.split(","))+")";
    queryFilters +=" and c.id in (select cr_id from college_majors_new where major_id in ("+area_focus_ids+") and aw_level in (" + educationGoal + "))";
    //queryFilters += " and CASE WHEN c.college_type='online' THEN c.search_online_display='yes' ELSE 1=1 END ";
    /** remove static college */
    //queryFilters +=" and c.id not in (1913,3449)";

    return queryFilters;
  }

  function tradqueryBuilder(filters, area_focus_ids, sourround_state) {
    let educationGoal = getAcademicLevel(filters);
    var queryFilters = '';
    //does college provide online classes
    if (filters.study_type == "Online") {
      queryFilters += " and online_classes = 'YES'";
    }

    /** For Or Query */
    //queryFilters +=" and (state in ("+stringUtil.joinStringByComma(filters.study_state_values.split(","))+")";
    //queryFilters +=" or c.id in (select cr_id from college_majors_new where major_id in ("+filters.area_focus_ids+")))";

    /** For And Query */
    //queryFilters += " and state in (" + stringUtil.joinStringByComma(sourround_state.split(",")) + ")";
    queryFilters += " and state in (" + stringUtil.joinStringByComma(filters.study_state_values.split(",")) + ")";
    queryFilters += " and c.id in (select cr_id from college_majors_new where major_id in (" + area_focus_ids + ") and aw_level in (" + educationGoal + "))";
    /** remove static college */
    //queryFilters +=" and c.id not in (1913,3449)";
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

  function matchEmailData(filters) {
    return new Promise(function (resolve, reject) {
      if(filters.checkCollegeInfo){
        var searchQuery = searchConstant.GET_ALL_ONLINE_COLLEGE_SEARCH_QUERY_WITH_SPECIFIC;
        queryFilters = queryEmailList(filters);
        //console.log("QQ:",searchQuery+queryFilters);
        mysqlService.query(searchQuery + queryFilters)
          .then(function (response) {
            resolve(response);
          }, function (err) {
            if (err) {
              var error = err;
              error.status = 503;
              return reject(error)
            };
          });
      }else{
        resolve("nodata");
      }
    });
  }

  function queryEmailList(filters) {
    var queryFilters = '';
    //does college provide online classes
    /*if(filters.study_type == "Online")
    {
      queryFilters +=" and online_classes = 'YES'";
    }
    if(filters.uncheckCollegeInfo != ""){
      queryFilters +=" and c.id not in (1913,3449,"+filters.uncheckCollegeInfo+")";
    }else{
      queryFilters +=" and c.id not in (1913,3449)";
    }*/
    //queryFilters +=" and (state in ("+stringUtil.joinStringByComma(filters.study_state_values.split(","))+")";
    //queryFilters +=" or c.id in (select cr_id from college_majors_new where major_id in ("+filters.area_focus_ids+")))";

    //queryFilters +=" and state in ("+stringUtil.joinStringByComma(filters.study_state_values.split(","))+")";
    //queryFilters +=" and c.id in (select cr_id from college_majors_new where major_id in ("+filters.area_focus_ids+"))";
    if (filters.checkCollegeInfo != "") {
      queryFilters += " and c.id in (" + filters.checkCollegeInfo + ")";
    }

    //queryFilters += " ORDER BY tc.display_order DESC";

    return queryFilters;
  }

  function matchSendEmail(emaildata) {
    return new Promise(function (resolve, reject) {
      let message = messageEmail.basicReplyEmailTemplate(emaildata.message.replace(/\n/g, '<br/>'));
      let subject = emailConstant.subject;
      let to = [emaildata.to];
      let from = emailConstant.NO_REPLY_EMAIL;
      emailService.sendEmail(from, to, subject, message).then(function (response) {
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

  function getSearchUserInfo(userid) {
    return new Promise(function (resolve, reject) {
      let checkqry = "select * from searchdata where uuid = '" + userid + "'";
      mysqlService.query(checkqry)
        .then((results) => {
          resolve(results);
        }).catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function getSearchMajorList(majorid) {
    return new Promise(function (resolve, reject) {
      let checkqry = "select title,id from majors_new where id in (" + stringUtil.joinStringByComma(majorid.split(",")) + ")";
      mysqlService.query(checkqry)
        .then((results) => {
          resolve(results);
        }).catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function searchInfoUpdate(filters) {
    return new Promise(function (resolve, reject) {
      let stateval = "";
      if (filters.study_state.length > 0) {
        stateval = filters.study_state[0]['value'];
      }
      let updateQuery = 'UPDATE `student_profile` SET military_status = "' + filters.military_status + '", military_branch = "' + filters.military_branch + '",state="' + stateval + '",level_id = "' + filters.education_goal + '",bucket_id = "' + filters.bucket_id + '",secondary_bucket_id = "' + filters.secondary_bucket_ids + '" WHERE uuid = "' + filters.uuid + '"';
      //console.log("UQ",updateQuery);
      mysqlService.query(updateQuery)
        .then((results) => {
          if (results["affectedRows"] == 1) {
            let deleteQuery = 'DELETE FROM `student_degree_relation` WHERE student_id = "' + filters.uuid + '" ';
            mysqlService.query(deleteQuery)
              .then((dresult) => {
                //if (dresult["affectedRows"] > 0) {
                  processBucketData(filters, filters.uuid).then(function (response) {
                    //resolve(results);
                    if (filters.searchdata == "insert") {
                      insertSearchData(filters, filters.uuid)
                        .then(function (response1) {
                          if (response1 == "success") {
                            resolve(response1);
                          } else {
                            resolve("error");
                          }
                        }, function (err) {
                          if (err) {
                            var error = err;
                            error.status = 503;
                            return reject(error)
                          };
                        })
                    } else {
                      let msupport = "";
                      if (filters.military_support) {
                        msupport = "yes";
                      } else {
                        msupport = "no";
                      }
                      let updateSearchQuery = 'UPDATE `searchdata` SET  education_goal = "' + filters.education_goal + '",secondary_bucket_id = "' + filters.secondary_bucket_ids + '",study_type = "' + filters.online + '",study_state = "' + filters.study_state_values + '",military_support = "' + msupport + '",military_branch = "' + filters.military_branch + '",bucket_id = "' + filters.bucket_id + '",enrollment_military_status = "' + filters.military_status + '"  WHERE uuid = "' + filters.uuid + '"';
                      //console.log("UQ1:",updateSearchQuery);
                      mysqlService.query(updateSearchQuery)
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
                //}
              }).catch((err) => {
                console.log('error', err);
                reject(new Error(err));
              });

          }

        }).catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function getSaveFlowMatchCollege(cdata) {
    return new Promise(function (resolve, reject) {
      //console.log("LL:",cdata.collegeData.length);
      let nowdate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      let insertQuery = "";
      let passedIn = 0;
      insertQuery = "Insert into users_matched_colleges (student_id,college_id,is_contacted,src,matched_date,is_passedin_college,matched_percent) values ";
      for (let i = 0; i < cdata.collegeData.length; i++) {
        if (cdata.collegeData[i]['collegeId'] == cdata.passed_cid) {
          passedIn = 1;
        } else {
          passedIn = 0;
        }
        if (i == cdata.collegeData.length - 1) {
          insertQuery += "('" + cdata.studentId + "'," + cdata.collegeData[i]['collegeId'] + ",'" + cdata.contacted + "','" + cdata.src + "','" + nowdate + "'," + passedIn + ",'" + cdata.collegeData[i]['percentMatch'] + "');";
        } else {
          insertQuery += "('" + cdata.studentId + "'," + cdata.collegeData[i]['collegeId'] + ",'" + cdata.contacted + "','" + cdata.src + "','" + nowdate + "'," + passedIn + ",'" + cdata.collegeData[i]['percentMatch'] + "'),";
        }
      }
      //console.log("II1:",insertQuery);
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

  function checkFlowPrevoiusData(sdata) {
    return new Promise(function (resolve, reject) {
      let checkqry = "Select count(id) as total from searchdata where  uuid='" + sdata.uuid + "'";
      if (sdata.online == 'Online') {
        checkqry += " and study_type='" + sdata.online + "'";
      } else {
        if (sdata.secondary_bucket_ids) {
          checkqry += " and  	secondary_bucket_id ='" + sdata.secondary_bucket_ids + "'";
        }
        checkqry += " and education_goal='" + sdata.education_goal + "' and study_state='" + sdata.study_state_values + "' and bucket_id='" + sdata.bucket_id + "'";
      }
      //console.log("Check:",checkqry);
      mysqlService.query(checkqry)
        .then((results) => {
          //console.log("RR:",results[0].total);
          resolve(results[0].total);
        }).catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function getSaveupdateCollegeData(sudata) {
    return new Promise(function (resolve, reject) {
      checkFlowCollegeDataExists(sudata, "single").then(function (response) {
        var nowdate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        if (response[0].total == 1) {
          if (sudata.isPassedInCollege) {
            insertQuery = "Update users_matched_colleges set is_passedin_college='" + sudata.isPassedInCollege + "' where college_id=" + sudata.collegeId + " and student_id='" + sudata.studentId + "'";
          } else {
            insertQuery = "Update users_matched_colleges set is_contacted='" + sudata.contacted + "' where college_id=" + sudata.collegeId + " and student_id='" + sudata.studentId + "'";
          }
        } else {
          insertQuery = "Insert into users_matched_colleges (student_id,college_id,is_contacted,src,matched_date,matched_percent,is_passedin_college) values ('" + sudata.studentId + "'," + sudata.collegeId + ",'" + sudata.contacted + "','" + sudata.src + "','" + nowdate + "','" + sudata.matchPercent + "','" + sudata.isPassedInCollege + "')";
        }
        //console.log("II:",insertQuery);
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
      }, function (err) {
        if (err) {
          var error = err;
          error.status = 503;
          return reject(error)
        };
      });
    });
  }

  function checkFlowCollegeDataExists(cdata, type) {
    return new Promise(function (resolve, reject) {
      let checkqry = "";
      if (type == "single") {
        checkqry = "Select count(id) as total from users_matched_colleges where  college_id=" + cdata.collegeId + " and student_id='" + cdata.studentId + "'";
      } else {
        checkqry = "Select count(id) as total from users_matched_colleges where student_id='" + cdata.studentId + "'";
      }
      //console.log("CC:",checkqry);
      mysqlService.query(checkqry)
        .then((results) => {
          resolve(results);
        }).catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function getCheckDeleteCollegeData(cdata) {
    return new Promise(function (resolve, reject) {
      checkFlowCollegeDataExists(cdata, "multiple").then(function (response) {
        if (response[0].total > 0) {
          let delqry = "DELETE FROM users_matched_colleges WHERE student_id='" + cdata.studentId + "' and college_id NOT IN (" + cdata.collegeId + ")";
          //console.log("Del:",delqry);
          mysqlService.query(delqry)
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

  function getUpdateEmailSentCollege(udata) {
    return new Promise(function (resolve, reject) {
      let condate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      let updateQuery = "Update users_matched_colleges set is_contacted='Yes',contacted_date='" + condate + "' where college_id=" + udata.collegeId + " and student_id='" + udata.studentId + "'";
      //console.log("UU:",updateQuery);
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

  function getCollegeProfileCollegeExist(udata) {
    return new Promise(function (resolve, reject) {
      let updateQuery = "Select * From users_matched_colleges where college_id=" + udata.passedIn_college_id + " and student_id='" + udata.uuid + "'";
      //console.log("UU:",updateQuery);
      mysqlService.query(updateQuery)
        .then(function (response) {
          //console.log("RR:",response);
          if (response.length > 0) {
            resolve("exist");
          } else {
            resolve("notexist");
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

  function insertCollegeProfileCollege(sudata) {
    return new Promise(function (resolve, reject) {
      var nowdate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      let insertQuery = "Insert into users_matched_colleges (student_id,college_id,is_contacted,src,matched_date,matched_percent,is_passedin_college) values ('" + sudata.studentId + "'," + sudata.collegeId + ",'" + sudata.contacted + "','" + sudata.src + "','" + nowdate + "','" + sudata.matchPercent + "','" + sudata.isPassedInCollege + "')";
      //console.log("UU:",updateQuery);
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

  function updateCollegeProfileCollege(sudata) {
    return new Promise(function (resolve, reject) {
      var nowdate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      let updateQuery = "Update users_matched_colleges set is_passedin_college='" + sudata.isPassedInCollege + "',matched_date='" + nowdate + "' where college_id=" + sudata.collegeId + " and student_id='" + sudata.studentId + "'";
      // console.log("UU:",updateQuery);
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

  function savePreferenceState(data) {
    return new Promise(function (resolve, reject) {
      checkUserDataExists(data).then(function (response) {
        if (response && response.length > 0) {
          let study_state = response[0].study_state + "," + data.college_state;
          updateQuery = "Update searchdata SET study_state = '" + study_state + "' where uuid = '" + data.student_id + "'";
          mysqlService.query(updateQuery)
            .then(function (uresponse) {
              if (uresponse["affectedRows"] > 0) {
                resolve("success");
              } else {
                resolve("error");
              }
            }, function (err) {
              if (err) {
                var error = err;
                error.status = 503;
                return reject(error)
              };
            });
        } else {
          let msupport = "";
          if (data.military_support) {
            msupport = "yes";
          } else {
            msupport = "no";
          }
          // let focus_ids = "";
          // if (searchdata.area_focus_ids) {
          //   focus_ids = searchdata.area_focus_ids;
          // }
          let sdata = {
            uuid: data.student_id,
            education_goal: data.education_goal,
            area_focus: "",
            secondary_bucket_id: data.area_focus_ids,
            study_type: "",
            study_state: data.state  + "," + data.college_state,
            military_support: msupport,
            military_branch: data.military_branch?data.military_branch:0,
            enrollment_military_status: data.military_status?data.military_status:"",
            bucket_id: data.bucket_id,
            date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
          }
          mysqlService.query(searchConstant.SEARCHDATA_SAVE, sdata)
            .then((presults) => {
              if (presults["affectedRows"] == 1) {
                resolve("success");
              } else {
                resolve("error");
              }
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

    })
  }

  function checkUserDataExists(cdata) {
    return new Promise(function (resolve, reject) {
      //let checkqry = "Select count(id) as total,study_state from searchdata where uuid='" + cdata.student_id + "'";
      let checkqry = "Select id as total,study_state from searchdata where uuid='" + cdata.student_id + "'";
      //  console.log("CC:",checkqry);
      mysqlService.query(checkqry)
        .then((results) => {
          // console.log("results", results)
          resolve(results);
        }).catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function checkPreferenceStateExists(cdata) {
    return new Promise(function (resolve, reject) {
      let checkqry = "Select study_state from searchdata where uuid='" + cdata.student_id + "'";
      //   console.log("CC:",checkqry);
      mysqlService.query(checkqry)
        .then((result) => {
          let sourroundQuery = "Select sourrounding_statevalue from state_sourrounding where state_value in (" + stringUtil.joinStringByComma(result[0].study_state.split(",")) + ")";
          mysqlService.query(sourroundQuery)
            .then(function (sresponse) {
              if (sresponse.length > 0 && (sresponse[0]['sourrounding_statevalue'] != "" || sresponse[1]['sourrounding_statevalue'] != "")) {
                //console.log("LL:",sresponse.length);
                if (sresponse.length > 1) {
                  let setData = "";
                  for (let i = 0; i < sresponse.length; i++) {
                    setData += sresponse[i]['sourrounding_statevalue'] + ",";
                  }
                  setData = setData.slice(0, -1);
                  setData = result[0].study_state + setData;
                  sourrond_arr = stringUtil.removeDuplicates(setData.split(','));
                  sourround_state = sourrond_arr.join(',');
                  //console.log("SSSS:",sourround_state);
                } else {
                  sourround_state = result[0].study_state + "," + sresponse[0]['sourrounding_statevalue'];
                }
              } else {
                sourround_state = result[0].study_state;
              }


              if (stringUtil.checkDataInArray(result[0].study_state, cdata.college_state)) {
                result = "exist"
              } else if (stringUtil.checkDataInArray(sourround_state, cdata.college_state)) {
                result = "surrounding exist"
              } else {
                result = "not exist"
              }

              //  stringUtil.checkDataInArray(results[0].study_state,cdata.college_state)  
              // console.log("results", results)
              resolve(result);
            }).catch((err) => {
              console.log('error', err);
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

  function getSearchMatchCollege(collegeid) {
    return new Promise(function (resolve, reject) {
      let getqry = "select college_name from colleges where id = "+collegeid +"";
      mysqlService.query(getqry)
        .then((result) => {
          resolve(result);
        }).catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function scholarshipVeteranInfoUpdate(scData) {
    return new Promise(function (resolve, reject) {
      let updateqry = 'UPDATE `student_profile` SET military_status = "' + scData.military_status + '", military_branch = "' + scData.military_branch + '" WHERE uuid = "' + scData.uuid + '"';
      mysqlService.query(updateqry)
        .then((result) => {
          if(scData.checkPrev > 0){
            resolve("success")
          }else{
            // States
            let stateval = "";
            if (scData.studyStates.indexOf(',') > -1) {
              let stateData = scData.studyStates.split(',');
              stateval = stateData[0];
            }else{
              stateval = scData.studyStates;
            }
            // Degree Level
            let levelval = "";
            if (scData.education_goal.indexOf(',') > -1) {
              let eduData = scData.education_goal.split(',');
              levelval = eduData[0];
            }else{
              levelval = scData.education_goal;
            }
            // Primary Bucket
            let primaryval = "";
            if (scData.bucketId.indexOf(',') > -1) {
              let eduData = scData.bucketId.split(',');
              primaryval = eduData[0];
            }else{
              primaryval = scData.bucketId;
            }
            let updateQuery = 'UPDATE `student_profile` SET state="' + stateval + '",level_id = "' + levelval + '",bucket_id = "' + scData.bucketId + '",secondary_bucket_id = "' + scData.secondaryBucketIds + '" WHERE uuid = "' + scData.uuid + '"';
            //console.log("UQ",updateQuery);
            mysqlService.query(updateQuery)
              .then((results) => {
                if (results["affectedRows"] == 1) {
                  let deleteQuery = 'DELETE FROM `student_degree_relation` WHERE student_id = "' + scData.uuid + '" ';
                  mysqlService.query(deleteQuery)
                    .then((dresult) => {
                      //if (dresult["affectedRows"] > 0) {
                        let filters = {
                          secondary_bucket_ids: scData.secondaryBucketIds,
                          bucket_id: primaryval
                        }
                        processBucketData(filters, scData.uuid).then(function (response) {
                          resolve(response);
                        }, function (err) {
                          if (err) {
                            var error = err;
                            error.status = 503;
                            return reject(error)
                          };
                        });
                      //}
                    }).catch((err) => {
                      console.log('error', err);
                      reject(new Error(err));
                    });

                }

              }).catch((err) => {
                console.log('error', err);
                reject(new Error(err));
              });
          }
        }).catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    })
  }

  return {
    processSearchData: processSearchData,
    matchSearchData: matchSearchData,
    matchEmailData: matchEmailData,
    matchSendEmail: matchSendEmail,
    getSearchUserInfo: getSearchUserInfo,
    getSearchMajorList: getSearchMajorList,
    searchInfoUpdate: searchInfoUpdate,
    getSaveFlowMatchCollege: getSaveFlowMatchCollege,
    checkFlowPrevoiusData: checkFlowPrevoiusData,
    getSaveupdateCollegeData: getSaveupdateCollegeData,
    getCheckDeleteCollegeData: getCheckDeleteCollegeData,
    getUpdateEmailSentCollege: getUpdateEmailSentCollege,
    getCollegeProfileCollegeExist: getCollegeProfileCollegeExist,
    insertCollegeProfileCollege: insertCollegeProfileCollege,
    updateCollegeProfileCollege: updateCollegeProfileCollege,
    savePreferenceState: savePreferenceState,
    checkUserDataExists: checkUserDataExists,
    checkPreferenceStateExists: checkPreferenceStateExists,
    getSearchMatchCollege: getSearchMatchCollege,
    scholarshipVeteranInfoUpdate: scholarshipVeteranInfoUpdate
  }

})();

module.exports = searchService;
