let militaryBenefitService = (function () {

  let config = require('../config');
  let mysqlService = require('./mysqlService');
  let emailService=require('./emailService');
  let sha1 = require('sha1');
  let stringUtil = require('../utils/stringUtil');
  let authenicateConstant = require('../constants/authenicateConstant');
  let constantContactService = require('../services/constantContactService');
  let authenicateService = require('../services/authenicateService');
  const loginService = require('../services/loginService');
  let stateConstant = require('../constants/stateConstant');
  let stateWithoutOnlineConstant = require('../constants/stateWithoutOnlineConstant');
  let militaryStatusConstant = require('../constants/militaryStatusConstant');
  let emailConstant=require('../constants/emailConstant');
  let messageEmail = require('../utils/messageEmail');
  let moment = require('moment');
  const { GoogleSpreadsheet } = require('google-spreadsheet');
  const fs = require('fs')
  //let creds = JSON.parse(fs.readFileSync('google-generated-creds.json', 'utf-8'))
  const creds = require('../google-generated-creds.json');
  const doc = new GoogleSpreadsheet('1zYkP-jj4HgvlTOd3WmyrGBJJNGvMA1hjEJYfO_xGlY4');
  const axios = require("axios");
  const {
    insertIntoLogEntry,
    saveThirdPartyResponse
  } = require("../utils/integrationUtils");
  let { vaClaimsConstant, integrationConstant } = require("../constants/integrationConstants");
  const { commonLoginPortal } = require('./loginService');

  function studentRegister(filters) {
    return new Promise(function (resolve, reject) {
      let terms_of_comm = "";
      let primary_source = "mymilitarybenefits";
      let secondary_source = "/register";
      let site_source = "https://www.mymilitarybenefits.com/register";
      let uuid = stringUtil.UID();
      if (filters.password) {
        password = sha1(filters.password)
      }
      if (filters.filter_majordata) {
        filter_majordata = filters.filter_majordata;
      } else {
        filter_majordata = "";
      }
      if (filters.filter_state) {
        filter_state = filters.filter_state;
      } else {
        filter_state = "";
      }
      if (filters.filter_data) {
        filter_data = filters.filter_data;
      } else {
        filter_data = "";
      }
      if (filters.relocate) {
        relocate = filters.relocate
      } else {
        relocate = "No";
      }
      if (filters.educational_goal) {
        educational_goal = filters.educational_goal;
      } else {
        educational_goal = "";
      }
      if (filters.bucket_value) {
        bucket_value = filters.bucket_value;
      } else {
        bucket_value = "";
      }
      if (filters.area_focus_ids) {
        area_focus_ids = filters.area_focus_ids;
      } else {
        area_focus_ids = "";
      }

      if (filters.year_experience) {
        exp_year = filters.year_experience;
      } else {
        exp_year = "";
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
            password: password,
            utm_source: "",
            site_source: site_source,
            primary_source: primary_source,
            secondary_source: secondary_source,
            filters: filter_data,
            filter_majordata: filter_majordata,
            filter_state: filter_state,
            utm_medium: "",
            utm_campaign: "",
            terms_of_comm: terms_of_comm,
            last_login: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
          };
          mysqlService.query(authenicateConstant.STUDENT_SAVE, student)
            .then((results) => {
              if (results["affectedRows"] == 1) {
                let mrank = 0;
                if (filters.military_rank) {
                  mrank = filters.military_rank;
                }
                let studentprofile = {
                  uuid: uuid,
                  postal_code: filters.postal_code,
                  military_status: filters.military_status,
                  military_branch: filters.military_branch,
                  military_rank: mrank,
                  mos: filters.military_mos,
                  state: filters.state,
                  level_id: educational_goal,
                  bucket_id: bucket_value,
                  secondary_bucket_id: area_focus_ids,
                  phone_number: "",
                  profile_image: "",
                  name_of_school: "",
                  sat_score: "",
                  seperation_date: filters.seperation_date,
                  security_clearance: filters.security_clearance,
                  relocate: relocate,
                  phone_number: filters.phone_number,
                  available: filters.available,
                  mmb_level_id: filters.mmb_level_id,
                  career_id: filters.career_id,
                  desired_salary: filters.desired_salary,
                  exp_year: exp_year,
                  date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                };
                mysqlService.query(authenicateConstant.STUDENT_PROFILE_SAVE, studentprofile)
                  .then((presults) => {
                    if (presults["affectedRows"] == 1) {
                      processBucketData(filters, uuid).then(function (response) {
                        let statquery = 'INSERT INTO usage_statistics SET resource = "SEARCH",college_id = 0,num_count=0 , student_id = "' + uuid + '"';
                        mysqlService.query(statquery)
                          .then((sresults) => {
                            userDetailSpreadsheet(filters).then(function (sresponse) {
                              // resolve(resultdata);
                              let resultdata = {
                                "uuid": uuid,
                                "first_name": filters.first_name,
                                "last_name": filters.last_name,
                                "employer_matching": sresponse
                              }
                              let contactId = "";
                              /*if (sresponse == "Employer Matching") {
                                contactId = "1722363360"
                              } else if (sresponse == "Employer Non-Matching") {
                                contactId = "1137228930"
                              }*/
                              contactId = "2059350297";
                              let constantcontact = {
                                "addresses": [
                                  {
                                    "address_type": "BUSINESS",
                                    "postal_code": filters.postal_code
                                  }
                                ],
                                "lists": [
                                  {
                                    "id": contactId
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
                              constantContactService.addUser(constantcontact).then(function (response) {
                                if (response == "success") {
                                  resolve(resultdata);
                                }
                              }, function (err) { reject(new Error(err)); });
                            }, function (err) {
                              if (err) {
                                var error = err;
                                error.status = 503;
                                return reject(error)
                              };
                            });
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

  function checkUserExists(email) {
    return new Promise(function (resolve, reject) {
      let checkqry = "select users.email, users.src from ( select email as email, 'user' as src from students where user_account_status='active' union select college_user_email as email, 'collegeAdmin' as src from college_users where status='active' union select admin_user_email as email, 'admin' as src from admin_users where status='active') users where users.email = '" + email + "' limit 1";
      mysqlService.query(checkqry)
        .then((results) => {
          resolve(results);
        }).catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function processBucketData(filters, uuid) {
    return new Promise(function (resolve, reject) {
      let checkqry = "";
      if (filters.area_focus_ids) {
        checkqry = "select major_id from bucket_secondary_degree_list where bucket_secondary_degree_id in (" + filters.area_focus_ids + ")";
      } else if (filters.bucket_value) {
        checkqry = "select major_id from bucket_secondary_degree_list where bucket_primary_degree_id =" + filters.bucket_value;
      }
      if (checkqry) {
        mysqlService.query(checkqry)
          .then((results) => {
            //console.log("result after checkqyery", results);
            let insertQuery = "";
            insertQuery = "Insert into student_degree_relation (student_id,major_id) values ";
            for (i = 0; i < results.length; i++) {
              if (i == results.length - 1) {
                insertQuery += "('" + uuid + "'," + results[i].major_id + ");";
              } else {
                insertQuery += "('" + uuid + "'," + results[i].major_id + "),";
              }
            }
            // console.log("insertqry:",insertQuery);
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
          }).catch((err) => {
            console.log('error', err);
            reject(new Error(err));
          });
      } else {
        resolve("success");
      }
    });
  }

  function getStates() {
    return new Promise(function (resolve, reject) {
      resolve(stateConstant);
      if (err) {
        var error = err;
        error.status = 503;
        return reject(error)
      }
    });
  }

  function getStatesWithoutOnline() {
    return new Promise(function (resolve, reject) {
      resolve(stateWithoutOnlineConstant);
      if (err) {
        var error = err;
        error.status = 503;
        return reject(error)
      }
    });
  }

  function getMilitaryStatus() {
    return new Promise(function (resolve, reject) {
      resolve(militaryStatusConstant);
      if (err) {
        var error = err;
        error.status = 503;
        return reject(error)
      }
    });
  }

  function getSecurityClearance() {
    return new Promise(function (resolve, reject) {
      let selectQuery = "Select id,name from security_clearance where status = 'Active'"
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

  function getEducationLevels() {
    return new Promise(function (resolve, reject) {
      let selectQuery = "Select id,level_name as levelName from mmb_education_levels where status = 'Active'"
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

  function getCareerFields() {
    return new Promise(function (resolve, reject) {
      let selectQuery = "Select id,career_name as careerName from mmb_career where status = 'Active'"
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

  function userDetailSpreadsheet(filters) {
    return new Promise(async function (resolve, reject) {
      let currentDate = moment(new Date()).format('YYYY-MM-DD');
      let sDate = new Date(filters.seperation_date);
      let sixMonthUntilSeperationDate = new Date(sDate.getFullYear(), sDate.getMonth() - 6, 1);
      let tenYearsFromSeperationDate = new Date(sDate.getFullYear() + 10, sDate.getMonth(), 1);
      sixMonthUntilSeperationDate = moment(sixMonthUntilSeperationDate).format('YYYY-MM-DD');
      tenYearsFromSeperationDate = moment(tenYearsFromSeperationDate).format('YYYY-MM-DD');
      const militaryRankCriteria = ['E-5', 'E-6', 'E-7', 'E-8', 'O-1', 'O-2', 'O-3', 'O-4'];
      let military_branch = "";
      let military_rank = "";
      let military_rank_shortname = "";
      let educational_goal = "";
      let primary_bucket = "";
      let secondary_bucket = "";
      let security_clearance = "";
      let mmb_education_level = "";
      let career = "";
      if (filters.military_branch) {
        let qry = "SELECT branch_short_name from branches where id = " + filters.military_branch
        await mysqlService.query(qry)
          .then((result) => {
            military_branch = result[0].branch_short_name;
          }).catch((err) => {
            console.log('error', err);
            reject(new Error(err));
          });
      }
      if (filters.military_rank) {
        let qry = "SELECT rank_short_name,rank_full_name from ranks where id = " + filters.military_rank
        await mysqlService.query(qry)
          .then((result) => {
            military_rank = result[0].rank_full_name;
            military_rank_shortname = result[0].rank_short_name.trim();
          }).catch((err) => {
            console.log('error', err);
            reject(new Error(err));
          });
      }
      if (filters.educational_goal) {
        let qry = "SELECT title from levels where id = " + filters.educational_goal
        await mysqlService.query(qry)
          .then((result) => {
            educational_goal = result[0].title;
          }).catch((err) => {
            console.log('error', err);
            reject(new Error(err));
          });
      }
      if (filters.bucket_value) {
        let qry = "SELECT title from bucket_degree where id = " + filters.bucket_value
        await mysqlService.query(qry)
          .then((result) => {
            primary_bucket = result[0].title;
          }).catch((err) => {
            console.log('error', err);
            reject(new Error(err));
          });
      }
      if (filters.area_focus_ids) {
        let qry = "SELECT title from bucket_secondary_degree where id in (" + filters.area_focus_ids + ")"
        await mysqlService.query(qry)
          .then((result) => {
            for (let i = 0; i < result.length; i++) {
              if (i == result.length - 1) {
                secondary_bucket += result[i].title;
              } else {
                secondary_bucket += result[i].title + ",";
              }
            }
          }).catch((err) => {
            console.log('error', err);
            reject(new Error(err));
          });
      }
      if (filters.security_clearance) {
        let qry = "SELECT name from security_clearance where id = " + filters.security_clearance
        await mysqlService.query(qry)
          .then((result) => {
            security_clearance = result[0].name;
          }).catch((err) => {
            console.log('error', err);
            reject(new Error(err));
          });
      }
      if (filters.mmb_level_id) {
        let qry = "SELECT level_name from mmb_education_levels where id = " + filters.mmb_level_id
        await mysqlService.query(qry)
          .then((result) => {
            mmb_education_level = result[0].level_name;
          }).catch((err) => {
            console.log('error', err);
            reject(new Error(err));
          });
      }
      if (filters.career_id) {
        let qry = "SELECT career_name from mmb_career where id = " + filters.career_id
        await mysqlService.query(qry)
          .then((result) => {
            career = result[0].career_name;
          }).catch((err) => {
            console.log('error', err);
            reject(new Error(err));
          });
      }
      let userData = {
        "First Name": filters.first_name,
        "Last Name": filters.last_name,
        "State": filters.state,
        "Email": filters.email,
        "Military Status": filters.military_status,
        "Military Branch": military_branch,
        "Military MOS": filters.military_mos,
        "Military Rank": military_rank,
        "Security Clearance": security_clearance,
        "Separation Date": filters.seperation_date,
        "Education Level": mmb_education_level,
        "Career Field": career,
        "Desired Salary": filters.desired_salary,
        "Relocate": filters.relocate,
        "Available": filters.available,
        "Phone": filters.phone_number,
        "Education Goal": educational_goal,
        "Primary Bucket": primary_bucket,
        "Secondary Bucket": secondary_bucket,
      }
      if (militaryRankCriteria.find(x => x == military_rank_shortname) && currentDate >= sixMonthUntilSeperationDate && currentDate <= tenYearsFromSeperationDate) {
        await doc.useServiceAccountAuth(creds);
        await doc.loadInfo();
        const sheet1 = doc.sheetsByIndex[0];
        await sheet1.addRow(userData);
        resolve("Employer Matching");
      } else {
        resolve("Employer Non-Matching");
      }
    }, function (err) {
      if (err) {
        var error = err;
        error.status = 503;
        return reject(error)
      };
    });
  }

  function claimStudentRegister(filters) {
    return new Promise(function (resolve, reject) {
      let terms_of_comm = "";
      let primary_source = "vaClaims";
      let secondary_source = "/register";
      let site_source = "https://www.mymilitarybenefits.com/register";
      let uuid = stringUtil.UID();
      if (filters.password) {
        password = sha1(filters.password)
      }
      if (filters.filter_state) {
        filter_state = filters.filter_state;
      } else {
        filter_state = "";
      }
      if(filters.secondary_source){
        secondary_source = filters.secondary_source;
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
            password: password,
            utm_source: "",
            site_source: site_source,
            primary_source: primary_source,
            secondary_source: secondary_source,
            //filters: filter_data,
            //filter_majordata: filter_majordata,
            filter_state: filter_state,
            utm_medium: "",
            utm_campaign: "",
            terms_of_comm: terms_of_comm,
            last_login: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
          };
          mysqlService.query(authenicateConstant.STUDENT_SAVE, student)
            .then((results) => {
              if (results["affectedRows"] == 1) {
                let mrank = 0;
                if (filters.military_rank) {
                  mrank = filters.military_rank;
                }
                let dateCreated = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                let dobVal = new Date(filters.dob);
                let studentprofile = {
                  uuid: uuid,
                  military_branch: filters.military_branch,
                  military_status: filters.military_status,
                  dob: moment(dobVal).format('YYYY-MM-DD'),
                  city: filters.city,
                  postal_code: filters.zip_code,
                  state: filters.state,
                  profile_image: "",
                  name_of_school: "",
                  sat_score: "",
                  phone_number: filters.phone_number,
                  va_disability: filters.va_disability,
                  honarably_discharged: filters.discharged,
                  //veteran_retiree: filters.veteran_retiree,
                  date_created: dateCreated
                };
                mysqlService.query(authenicateConstant.STUDENT_PROFILE_SAVE, studentprofile)
                  .then((presults) => {
                    if (presults["affectedRows"] == 1) {
                        let statquery = 'INSERT INTO usage_statistics SET resource = "SEARCH",college_id = 0,num_count=0 , student_id = "' + uuid + '"';
                        mysqlService.query(statquery)
                          .then((sresults) => {
                            userClaimDetailSpreadsheet(filters,dateCreated).then(function (sresponse) {
                              // resolve(resultdata);
                              claimsAPIIntegration(filters,uuid);
                              let resultdata = {
                                "uuid": uuid,
                                "first_name": filters.first_name,
                                "last_name": filters.last_name
                              }
                              let contactId = "1985984555";
                              
                              let constantcontact = {
                                "addresses": [
                                  {
                                    "address_type": "BUSINESS",
                                    "postal_code": filters.zip_code
                                  }
                                ],
                                "lists": [
                                  {
                                    "id": contactId
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
                                
                                let gResponse = await authenicateService.addVeteranToGoogleSheet(filters.first_name, filters.last_name, filters.email, "VA Claims", sheetResponse);
                                
                                if (gResponse == "success") {
                                  let message = "";
                                  let claimmess = "";
                                  let subject = "Thank you for registration";
                                  let to = [filters.email];
                                  let from = emailConstant.INFORMATION_EMAIL;
                                  claimmess = "<p>Thank you for registering with MyMilitaryBenefits.</p><p>The average veteran is underrated by $1,074 per month? That’s nearly $13,000 annually!  See how much more we can help you receive with a free consultation.</p><p>A claims expert representative will reach out to you soon regarding your disability status and how we can help.</p><p>For VA Disability Pay Rates and Charts, you can <a href='https://collegerecon.com/va-disability-benefits-pay/'>read more here</a>.</p>";
                                  message = messageEmail.basicReplyEmailTemplate(claimmess);
                                  emailService.sendEmail(from,to,subject,message)
                                    .then( function(mailresponse) {
                                      if(mailresponse == 'success'){
                                        resolve(resultdata);
                                      } else {
                                        resolve("fail");
                                      }
                                    }, function(err) {
                                      if(err) {
                                        var error = err;
                                        error.status = 503;
                                        console.log("Error email", err);
                                      };
                                  });
                                }
                              }, function (err) { reject(new Error(err)); });
                            }, function (err) {
                              if (err) {
                                var error = err;
                                error.status = 503;
                                return reject(error)
                              };
                            });
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
      }, function (err) {
        if (err) {
          var error = err;
          error.status = 503;
          return reject(error)
        };
      });
    });
  }

  const claimsAPIIntegration = ( data, uuid ) => {
    return new Promise(async function (resolve, reject) {
      const userData = {
        SourceID: vaClaimsConstant.SOURCEID,
        ClientID: vaClaimsConstant.CLIENTID,
        FirstName: data.first_name,
        LastName: data.last_name,
        Phone: data.phone_number ? stringUtil.formatClaimPhoneNumber(data.phone_number) : "",
        City: data.city,
        State: data.state,
        DOB: data.dob,
        Zip: data.zip_code,
        Email: data.email,
      };
      let headerData = config.VACLAIMS_USERNAME+":"+config.VACLAIMS_PASSWORD;
      let encodeData = Buffer.from(headerData).toString('base64');
      
      try {
        const thirdPartyResponse = await axios({
          url: vaClaimsConstant.CLAIMS_POST_URL,
          method: "post",
          data: userData,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Basic " + encodeData,
          },
        }).catch((error) => console.error(error));
  
        //const result = thirdPartyResponse.data;
        //console.log("Result:", thirdPartyResponse);
        let formattedResponseBody = {};
        if(thirdPartyResponse){
          formattedResponseBody = {
            uuid: uuid,
            college_id: 0,
            parent_college_id: 0,
            status_code: thirdPartyResponse.status,
            result: thirdPartyResponse.headers.location,
            source: integrationConstant.INTEGRATION_TYPE.INDIVIDUAL,
          };
        }else{
          formattedResponseBody = {
            uuid: uuid,
            college_id: 0,
            parent_college_id: 0,
            status_code: "400",
            result: "Validation failed.\r\nMissing Data",
            source: integrationConstant.INTEGRATION_TYPE.INDIVIDUAL,
          };
        }
        updateClaimWithResponse(data.email, formattedResponseBody.status_code, formattedResponseBody.result);
        await saveThirdPartyResponse(formattedResponseBody).catch((error) =>
          console.error(error)
        );
  
        const logBody = {
          log_uuid: vaClaimsConstant.VACLAIMS,
          student_id: uuid,
          college_id: 0,
          stage: vaClaimsConstant.INTEGRATION_VACLAIMS,
          message: integrationConstant.AFTER_INTEGRATION,
          attributes: JSON.stringify(userData),
          //response: JSON.stringify(thirdPartyResponse),
          response: 'success',
          status: integrationConstant.STATUS_SUCCESS,
        };
        const returnData = await insertIntoLogEntry(logBody);
        return resolve(returnData);
      } catch (error) {
        //var error = err;
        console.log("ERR:",error)
        error.status = 503;
        const body = {
          log_uuid: vaClaimsConstant.VACLAIMS,
          student_id: uuid,
          college_id: 0,
          stage: vaClaimsConstant.INTEGRATION_VACLAIMS,
          message: JSON.stringify(error),
          attributes: JSON.stringify(userData),
          response: "",
          status: "failure",
        };
        await insertIntoLogEntry(body);
        //console.error(err);
        return reject(error);
      }
    })
  };

  const updateClaimWithResponse= ( email, status, response ) => {
    return new Promise(async function (resolve, reject) {
      let claimdoc = new GoogleSpreadsheet('10u3ldED7ybxpS_mausqzRVP8qj9a7t2s0qJCPiXNNjA');
      await claimdoc.useServiceAccountAuth(creds);
      await claimdoc.loadInfo();
      const sheet1 = claimdoc.sheetsByIndex[0];
      const rows = await sheet1.getRows();
      let upNo = -1;
      for (let j = 0; j < rows.length; j++) {
        if (rows[j].Email == email) {
          upNo = j;
        }
      }
      if (upNo != -1) {
        rows[upNo]["API Response"] = response;
        await rows[upNo].save();
      }
      resolve("success");
    }, function (err) {
      if (err) {
        var error = err;
        error.status = 503;
        return reject(error)
      };
    });
  };

  function userClaimDetailSpreadsheet(filters,dateCreated) {
    return new Promise(async function (resolve, reject) {
      let claimdoc = new GoogleSpreadsheet('10u3ldED7ybxpS_mausqzRVP8qj9a7t2s0qJCPiXNNjA');
      let military_branch = "";
      
      if (filters.military_branch) {
        let qry = "SELECT branch_short_name from branches where id = " + filters.military_branch
        await mysqlService.query(qry)
          .then((result) => {
            military_branch = result[0].branch_short_name;
          }).catch((err) => {
            console.log('error', err);
            reject(new Error(err));
          });
      }
      
      let userData = {
        "First Name": filters.first_name,
        "Last Name": filters.last_name,
        "State": filters.state,
        "Email": filters.email,
        "Military Branch": military_branch,
        "Phone": filters.phone_number,
        "Va Disability": filters.va_disability,
        "Discharged": filters.discharged,
        "Veteran Retiree": filters.veteran_retiree,
        "Date Created": dateCreated,
      }
      await claimdoc.useServiceAccountAuth(creds);
      await claimdoc.loadInfo();
      const sheet1 = claimdoc.sheetsByIndex[0];
      await sheet1.addRow(userData);
      resolve("Done");

    }, function (err) {
      if (err) {
        var error = err;
        error.status = 503;
        return reject(error)
      };
    });
  }

  function collegereconStudentRegister(filters) {
    return new Promise(function (resolve, reject) {
      let nodeEnv = process.env.NODE_ENV;
      let terms_of_comm = "";
      let primary_source = "collegerecon";
      let secondary_source = "/register";
      let site_source = "https://collegerecon.com/registration";
      let uuid = stringUtil.UID();
      if (filters.password) {
        password = sha1(filters.password)
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
            password: password,
            utm_source: "",
            site_source: site_source,
            primary_source: primary_source,
            secondary_source: secondary_source,
            //filters: filter_data,
            //filter_majordata: filter_majordata,
            //filter_state: filters.state,
            utm_medium: "",
            utm_campaign: "",
            terms_of_comm: terms_of_comm,
            last_login: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
          };
          mysqlService.query(authenicateConstant.STUDENT_SAVE, student)
            .then((results) => {
              if (results["affectedRows"] == 1) {
                let mrank = 0;
                if (filters.military_rank) {
                  mrank = filters.military_rank;
                }
                let dateCreated = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                let studentprofile = {
                  uuid: uuid,
                  postal_code: filters.postal_code,
                  military_branch: filters.military_branch,
                  military_rank: mrank,
                  mos: filters.military_mos,
                  state: filters.state,
                  profile_image: "",
                  name_of_school: "",
                  sat_score: "",
                  phone_number: filters.phone_number,
                  level_id: filters.educational_goal,
                  bucket_id: filters.area_of_study,
                  secondary_bucket_id: filters.area_of_focus,
                  date_created: dateCreated
                };
                mysqlService.query(authenicateConstant.STUDENT_PROFILE_SAVE, studentprofile)
                  .then((presults) => {
                    if (presults["affectedRows"] == 1) {
                      processBucketData(filters, uuid).then(function (response) {
                        let statquery = 'INSERT INTO usage_statistics SET resource = "SEARCH",college_id = 0,num_count=0 , student_id = "' + uuid + '"';
                        mysqlService.query(statquery)
                          .then((sresults) => {
                            //userClaimDetailSpreadsheet(filters,dateCreated).then(function (sresponse) {
                              // resolve(resultdata);
                              let contactId = "1985984555";
                              
                              let constantcontact = {
                                "addresses": [
                                  {
                                    "address_type": "BUSINESS",
                                    "postal_code": filters.postal_code
                                  }
                                ],
                                "lists": [
                                  {
                                    "id": contactId
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
                              if(nodeEnv == "production"){
                                constantContactService.addUser(constantcontact).then(function (response) {
                                  if (response == "success") {
                                    let resultdata = {
                                      message: "success"
                                    }
                                    resolve(resultdata);
                                  }
                                }, function (err) { reject(new Error(err)); });
                              }else{
                                let resultdata = {
                                  message: "success"
                                }
                                resolve(resultdata);
                              }
                            /*}, function (err) {
                              if (err) {
                                var error = err;
                                error.status = 503;
                                return reject(error)
                              };
                            });*/
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

  function militaryBenefitStudentRegister(filters) {
    return new Promise(function (resolve, reject) {
      var nodeEnv = process.env.NODE_ENV;
      let terms_of_comm = "";
      let primary_source = "mymilitarybenefits";
      let secondary_source = "/question";
      let site_source = "https://www.mymilitarybenefits.com/register";
      let uuid = stringUtil.UID();
      if (filters.password) {
        password = sha1(filters.password)
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
            password: password,
            utm_source: "",
            site_source: site_source,
            primary_source: primary_source,
            secondary_source: secondary_source,
            //filters: filter_data,
            //filter_majordata: filter_majordata,
            //filter_state: filters.state,
            utm_medium: "",
            utm_campaign: "",
            terms_of_comm: terms_of_comm,
            last_login: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
          };
          mysqlService.query(authenicateConstant.STUDENT_SAVE, student)
            .then((results) => {
              if (results["affectedRows"] == 1) {
                let mrank = 0;
                if (filters.military_rank) {
                  mrank = filters.military_rank;
                }
                let dateCreated = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
                let studentprofile = {
                  uuid: uuid,
                  postal_code: filters.postal_code,
                  military_branch: filters.military_branch,
                  military_rank: mrank,
                  military_status: filters.military_status,
                  mos: filters.mos_afsc,
                  profile_image: "",
                  name_of_school: "",
                  sat_score: "",
                  phone_number: filters.phone_number,
                  category_question: filters.category_question,
                  benefit_question: filters.benefit_question,
                  date_created: dateCreated
                };
                mysqlService.query(authenicateConstant.STUDENT_PROFILE_SAVE, studentprofile)
                  .then((presults) => {
                    if (presults["affectedRows"] == 1) {
                      processBucketData(filters, uuid).then(function (response) {
                        let statquery = 'INSERT INTO usage_statistics SET resource = "SEARCH",college_id = 0,num_count=0 , student_id = "' + uuid + '"';
                        mysqlService.query(statquery)
                          .then((sresults) => {
                            userBenefitsQuestionSpreadsheet(filters,dateCreated).then(function (sresponse) {
                              // resolve(resultdata);
                              let resultdata = {
                                "uuid": uuid,
                                "first_name": filters.first_name,
                                "last_name": filters.last_name
                              }
                              let contactId = "1364677662";
                              
                              let constantcontact = {
                                "addresses": [
                                  {
                                    "address_type": "BUSINESS",
                                    "postal_code": filters.postal_code
                                  }
                                ],
                                "lists": [
                                  {
                                    "id": contactId
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
                              if(nodeEnv == "production"){
                                constantContactService.addUser(constantcontact).then(function (constantresponse) {
                                  if (constantresponse == "success") {
                                    sendMilitaryQuestionEmail(sresponse).then(function (mailresponse) {
                                      if(mailresponse == "success"){
                                        resolve(resultdata);
                                      }
                                    }, function (err) { reject(new Error(err)); });
                                  }
                                }, function (err) { reject(new Error(err)); });
                              }else{
                                resolve(resultdata);
                              }
                            }, function (err) {
                              if (err) {
                                var error = err;
                                error.status = 503;
                                return reject(error)
                              };
                            });
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

  function userBenefitsQuestionSpreadsheet(filters,dateCreated) {
    return new Promise(async function (resolve, reject) {
      let claimdoc = new GoogleSpreadsheet('1R2zz4SmWwumARQivRQOnJFMeNasN0jpHqCU9MxX2N_Q');
      let military_branch = "";
      let military_rank = "";
      
      if (filters.military_branch) {
        let qry = "SELECT branch_short_name from branches where id = " + filters.military_branch
        await mysqlService.query(qry)
          .then((result) => {
            military_branch = result[0].branch_short_name;
          }).catch((err) => {
            console.log('error', err);
            reject(new Error(err));
          });
      }

      if (filters.military_rank) {
        let qry = "SELECT name from college_ranks where id = " + filters.military_rank
        await mysqlService.query(qry)
          .then((result) => {
            military_rank = result[0].name;
          }).catch((err) => {
            console.log('error', err);
            reject(new Error(err));
          });
      }
      
      let userData = [
        filters.first_name,
        filters.last_name,
        filters.postal_code,
        filters.phone_number,
        filters.email,
        filters.category_question,
        military_branch,
        filters.military_status,
        military_rank,
        filters.benefit_question,
        dateCreated,
      ]
      await claimdoc.useServiceAccountAuth(creds);
      await claimdoc.loadInfo();
      const sheet1 = claimdoc.sheetsByIndex[0];
      await sheet1.addRow(userData);
      resolve(userData);

    }, function (err) {
      if (err) {
        var error = err;
        error.status = 503;
        return reject(error)
      };
    });
  }

  function sendMilitaryQuestionEmail(userData) {
    return new Promise(function (resolve, reject) {
      let message = "";
      let benefitMessage = "";
      let subject = emailConstant.MILITARY_BENEFITS_QUESTION_SUBJECT;
      let to = [emailConstant.BENEFITS_RECEIVER];
      let from = emailConstant.SUPPORT_ADMIN_EMAIL;
      benefitMessage = "<p>This is a military benefits question from a myMilitaryBenefits user.</p><p>First Name: "+userData[0]+"<br>Last Name: "+userData[1]+"<br>Postal Code: "+userData[2]+"<br>Phone: "+userData[3]+"<br>Email: "+userData[4]+"<br>Category Question: "+userData[5]+"<br>Military Branch: "+userData[6]+"<br>Military Status: "+userData[7]+"<br>Paygrade: "+userData[8]+"<br>Question: "+userData[9]+"<br>Date Created: "+userData[10]+"<br></p>";
      message = messageEmail.basicReplyEmailTemplate(benefitMessage);
      emailService.sendEmail(from,to,subject,message)
        .then( function(mailresponse) {
          resolve(mailresponse);
        }, function(err) {
          if(err) {
            var error = err;
            error.status = 503;
            console.log("Error email", err);
          };
      });
    })
  }

  function careerReconRegister(filters) {
    return new Promise(function (resolve, reject) {
      let nodeEnv = process.env.NODE_ENV;
      let terms_of_comm = "";
      let primary_source = "careerrecon";
      let secondary_source = "/register";
      let site_source = "https://www.mymilitarybenefits.com/register";
      let uuid = stringUtil.UID();
      if (filters.password) {
        password = sha1(filters.password)
      }
      
      if (filters.filter_state) {
        filter_state = filters.filter_state;
      } else {
        filter_state = "";
      }
      
      if (filters.relocate) {
        relocate = filters.relocate
      } else {
        relocate = "No";
      }
      
      
      if (filters.bucket_value) {
        bucket_value = filters.bucket_value;
      } else {
        bucket_value = "";
      }
      
      if (filters.year_experience) {
        exp_year = filters.year_experience;
      } else {
        exp_year = "";
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
            password: password,
            utm_source: "",
            site_source: site_source,
            primary_source: primary_source,
            secondary_source: secondary_source,
            utm_medium: "",
            utm_campaign: "",
            terms_of_comm: terms_of_comm,
            last_login: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
          };
          mysqlService.query(authenicateConstant.STUDENT_SAVE, student)
            .then((results) => {
              if (results["affectedRows"] == 1) {
                let mrank = 0;
                if (filters.military_rank) {
                  mrank = filters.military_rank;
                }
                let studentprofile = {
                  uuid: uuid,
                  military_status: filters.military_status,
                  military_branch: filters.military_branch,
                  military_rank: mrank,
                  mos: filters.military_mos,
                  state: filters.state,
                  bucket_id: bucket_value,
                  phone_number: "",
                  profile_image: "",
                  name_of_school: "",
                  sat_score: "",
                  seperation_date: filters.seperation_date,
                  security_clearance: filters.security_clearance,
                  relocate: relocate,
                  phone_number: filters.phone_number,
                  available: filters.available,
                  mmb_level_id: filters.mmb_level_id,
                  career_id: filters.career_id,
                  desired_salary: filters.desired_salary,
                  exp_year: exp_year,
                  date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                };
                mysqlService.query(authenicateConstant.STUDENT_PROFILE_SAVE, studentprofile)
                  .then((presults) => {
                    if (presults["affectedRows"] == 1) {
                      processBucketData(filters, uuid).then(function (response) {
                        let statquery = 'INSERT INTO usage_statistics SET resource = "SEARCH",college_id = 0,num_count=0 , student_id = "' + uuid + '"';
                        mysqlService.query(statquery)
                          .then((sresults) => {
                            if(nodeEnv == "production"){
                              //userDetailSpreadsheet(filters).then(function (sresponse) {
                                // resolve(resultdata);
                                let resultdata = {
                                  "uuid": uuid,
                                  "first_name": filters.first_name,
                                  "last_name": filters.last_name
                                }
                               
                                //contactId = "1137228930";
                                let contactId = "";
                                if(filters.military_status.toLowerCase() == 'spouse'){
                                  contactId = "1520869398";
                                }else{
                                  contactId = "2059350297";
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
                                      "id": contactId
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
                                constantContactService.addUser(constantcontact).then(function (response) {
                                  if (response == "success") {
                                    resolve(resultdata);
                                  }
                                }, function (err) { reject(new Error(err)); });
                              /*}, function (err) {
                                if (err) {
                                  var error = err;
                                  error.status = 503;
                                  return reject(error)
                                };
                              });*/
                            }else{
                              let resultdata = {
                                "uuid": uuid,
                                "first_name": filters.first_name,
                                "last_name": filters.last_name
                              }
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


  function careerReconCommonLogin(filters) {
    return new Promise(async function (resolve, reject) {
      commonLoginPortal(filters, filters.uuid);
      resolve("success");
    })
  }

  return {
    studentRegister: studentRegister,
    getStates: getStates,
    getStatesWithoutOnline: getStatesWithoutOnline,
    getMilitaryStatus: getMilitaryStatus,
    getSecurityClearance: getSecurityClearance,
    getEducationLevels: getEducationLevels,
    getCareerFields: getCareerFields,
    claimStudentRegister: claimStudentRegister,
    collegereconStudentRegister: collegereconStudentRegister,
    militaryBenefitStudentRegister: militaryBenefitStudentRegister,
    careerReconRegister: careerReconRegister,
    careerReconCommonLogin: careerReconCommonLogin
  }
})();

module.exports = militaryBenefitService;