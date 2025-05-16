let authenicateService = (function () {
  const config = require('../config');
  const mysqlService = require('./mysqlService');
  const emailService = require('./emailService');
  const loginModel = require('../models/loginModel');
  const basicLoginModel = require('../models/basicLoginModel');
  const careerreconLoginModel = require('../models/careerreconLoginModel');
  const sha1 = require('sha1');
  const stringUtil = require('../utils/stringUtil');
  const messageEmail = require('../utils/messageEmail');
  const { errorHandler } = require('../utils/errorHandler');
  const emailConstant = require('../constants/emailConstant');
  const authenicateConstant = require('../constants/authenicateConstant');
  const constantContactService = require('../services/constantContactService');
  const collegeService = require('../services/collegeService');
  const moment = require('moment');
  const requestlogger = require('../utils/requestInfoLog');
  const { GoogleSpreadsheet } = require('google-spreadsheet');
  const creds = require('../google-generated-creds.json');
  const doc = new GoogleSpreadsheet(authenicateConstant.EXCEL_ID);
  const { commonLoginPortal } = require('./loginService');

  async function login(filters) {
    const queryLogin =
      "select users.uuid, users.id, users.password, users.src from (select uuid as uuid, uuid as id, email as email , password as password , 'user' as src from students where user_account_status='ACTIVE' union select uuid as uuid, college_id as id, college_user_email as email, college_user_password as password,  'collegeAdmin' as src from college_users where status='ACTIVE') users where users.email = '" +
      filters.uname +
      "' limit 1";

    const response = await mysqlService.query(queryLogin);

    if (response.length == 0) {
      return 'emailnotexist';
    }
    if (response[0].password != filters.password) {
      return 'wrongpassword';
    }
    if (response[0].src == 'collegeAdmin') {
      collegeService.recordCollegeLogin(response[0].id);
    }

    if (response[0].src == 'user') {
      collegeService.recordStudentLogin(response[0].uuid);
    }
    return [
      {
        id: response[0].id,
        uuid: response[0].uuid,
        type: response[0].src,
      },
    ];
  }

  function resetPassword(userName) {
    return new Promise(function (resolve, reject) {
      let queryLogin =
        "select users.email, users.src from (select email as email, 'user' as src from students  union select college_user_email as email,  'collegeAdmin' as src from college_users  union  select admin_user_email as email, 'admin' as src from admin_users ) users where users.email = '" +
        userName +
        "' limit 1";

      mysqlService.query(queryLogin).then(
        function (response) {
          if (response.length == 0) {
            resolve('usernotexist');
          }

          let newPassword = stringUtil.generateRandomPassword();
          let securePassword = sha1(newPassword);
          let updateQuery = '';
          if (response[0].src == 'user') {
            updateQuery =
              'UPDATE students SET password = "' +
              securePassword +
              '" WHERE email = "' +
              stringUtil.escapeHtml(userName) +
              '"';
          } else if (response[0].src == 'collegeAdmin') {
            updateQuery =
              'UPDATE college_users SET college_user_password = "' +
              securePassword +
              '" WHERE college_user_email = "' +
              stringUtil.escapeHtml(userName) +
              '"';
          } else {
            resolve('nousertype');
          }
          mysqlService.query(updateQuery).then(
            function (response) {
              emailPassword(userName, newPassword).then(
                function (response) {
                  if (response == 'success') {
                    resolve('emailsent');
                  }
                },
                function (err) {
                  if (err) {
                    var error = err;
                    error.status = 503;
                    return reject(error);
                  }
                }
              );
            },
            function (err) {
              if (err) {
                var error = err;
                error.status = 503;
                return reject(error);
              }
            }
          );
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  function emailPassword(userName, newPassword) {
    return new Promise(function (resolve, reject) {
      let message = messageEmail.resetPasswordEmail(newPassword);
      let subject = emailConstant.RESET_PASSWORD_SUBJECT;
      let to = [userName];
      let from = emailConstant.NO_REPLY_EMAIL;
      emailService
        .sendEmail(
          from,
          to,
          subject,
          message,
          null,
          [],
          config.NODE_ENV === 'staging'
        )
        .then(
          function (response) {
            resolve('success');
          },
          function (err) {
            if (err) {
              var error = err;
              error.status = 503;
              return reject(error);
            }
          }
        );
    });
  }

  function studentRegister(filters) {
    return new Promise(function (resolve, reject) {
      let uuid = stringUtil.UID();
      let terms_of_comm = '';
      if (filters.terms_of_communication == '') {
        terms_of_comm = 'N';
      } else {
        terms_of_comm = filters.terms_of_communication;
      }
      if (filters.filter_majordata && filters.register_source == 'savesearch') {
        filter_majordata = filters.filter_majordata;
      } else {
        filter_majordata = '';
      }
      if (
        filters.filter_bucketdata &&
        filters.register_source == 'savesearch'
      ) {
        filter_bucketdata = filters.filter_bucketdata;
      } else {
        filter_bucketdata = '';
      }
      if (filters.filter_state && filters.register_source == 'savesearch') {
        filter_state = filters.filter_state;
      } else {
        filter_state = '';
      }
      if (filters.filter_data && filters.register_source == 'savesearch') {
        let filterData = filters.filter_data.split(',');
        let ct = filterData[0].split(':');
        let ft = filterData[1].split(':');
        if (filterData.length == 6 && ct.length == 2 && ft.length == 2) {
          filter_data = '';
        } else {
          filter_data = filters.filter_data;
        }
      } else {
        filter_data = '';
      }
      let resultdata = {
        uuid: uuid,
        first_name: filters.first_name,
        last_name: filters.last_name,
      };
      checkUserExists(filters.email).then(
        function (response) {
          if (response.length == 1) {
            resolve('userexist');
          } else if (response.length == 0) {
            let student = {
              uuid: uuid,
              email: filters.email,
              first_name: filters.first_name,
              last_name: filters.last_name,
              password: filters.password,
              utm_source: '',
              site_source: filters.site_source,
              primary_source: filters.primary_source,
              secondary_source: filters.secondary_source,
              filters: filter_data,
              filter_majordata: filter_majordata,
              filter_bucketdata: filter_bucketdata,
              filter_state: filter_state,
              utm_medium: '',
              utm_campaign: '',
              terms_of_comm: terms_of_comm,
              register_source: filters.register_source,
              last_login: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
              date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
            };
            // console.log("student:",student);
            mysqlService
              .query(authenicateConstant.STUDENT_SAVE, student)
              .then((results) => {
                if (results['affectedRows'] == 1) {
                  //let dob_data = filters.dob;
                  //let dob = moment(dob_data.replace(" ","")).format('YYYY-MM-DD');
                  let check_phone = 'yes';
                  if (filters.check_phone_number) {
                    check_phone = filters.check_phone_number;
                  }
                  let mrank = 0;
                  if (filters.military_rank) {
                    mrank = filters.military_rank;
                  }
                  let studentprofile = {
                    uuid: uuid,
                    //dob:dob,
                    postal_code: filters.postal_code,
                    military_status: filters.military_status,
                    military_branch: filters.military_branch,
                    military_rank: mrank,
                    mos: filters.military_mos,
                    state: filters.state,
                    //school_type:filters.school_type,
                    level_id: filters.educational_goal,
                    bucket_id: filters.bucket_value,
                    // academic_interest_1: filters.academic_interest_1,
                    // academic_interest_2: filters.academic_interest_2,
                    // academic_interest_3: filters.academic_interest_3,
                    // academic_interest_4: filters.academic_interest_4,
                    // academic_interest_5: filters.academic_interest_5,
                    secondary_bucket_id: filters.area_focus_ids,
                    phone_number: filters.phone_number,
                    check_phone_number: check_phone,
                    profile_image: '',
                    name_of_school: '',
                    sat_score: '',
                    date_created: moment(new Date()).format(
                      'YYYY-MM-DD HH:mm:ss'
                    ),
                  };
                  mysqlService
                    .query(
                      authenicateConstant.STUDENT_PROFILE_SAVE,
                      studentprofile
                    )
                    .then((presults) => {
                      if (presults['affectedRows'] == 1) {
                        processBucketData(filters, uuid).then(
                          function (response) {
                            let statquery =
                              'INSERT INTO usage_statistics SET resource = "SEARCH",college_id = 0,num_count=0 , student_id = "' +
                              uuid +
                              '"';
                            mysqlService
                              .query(statquery)
                              .then(async (sresults) => {
                                //commonLoginPortal(filters, uuid);
                                //console.log("Domain:",config.DOMAIN_URL);
                                if(filters.military_status != "Other"){
                                  emailVeteran(filters);
                                }
                               
                                if (
                                  config.DOMAIN_URL ==
                                  'https://app.collegerecon.com'
                                ) {
                                  let listId = '';
                                  if(emailConstant.MILITARY_STATUS_REGISTERPAGE.includes(filters.secondary_source)){
                                    listId = '1179789601';
                                  }else{
                                    listId = '2110708446';
                                  }
                                  /*if(filters.military_status == 'Spouse' || filters.military_status == 'Dependent'){
                                listId = "1452629616";
                              }else{
                                listId = "1574867395";
                              }*/
                                  let constantcontact = {
                                    addresses: [
                                      {
                                        address_type: 'BUSINESS',
                                        postal_code: filters.postal_code,
                                      },
                                    ],
                                    lists: [
                                      {
                                        id: listId,
                                      },
                                    ],
                                    email_addresses: [
                                      {
                                        email_address: filters.email,
                                      },
                                    ],
                                    first_name: filters.first_name,
                                    last_name: filters.last_name,
                                    created_date: moment(new Date()).format(),
                                  };
                                  constantContactService
                                    .addUser(constantcontact)
                                    .then(
                                      async function (response) {
                                        let sheetResponse = "";
                                        if(response == "success"){
                                          sheetResponse = response;
                                        }else{
                                          sheetResponse = response.message;
                                        }
                                        
                                        let gResponse = await addVeteranToGoogleSheet(filters.first_name, filters.last_name, filters.email, "APP", sheetResponse);
                                        if (gResponse == 'success') {
                                          resolve(resultdata);
                                        }
                                      },
                                      function (err) {
                                        reject(new Error(err));
                                      }
                                    );
                                } else {
                                  resolve(resultdata);
                                }
                              })
                              .catch((err) => {
                                reject(new Error(err));
                              });
                          },
                          function (err) {
                            if (err) {
                              var error = err;
                              error.status = 503;
                              return reject(error);
                            }
                          }
                        );
                      }
                    })
                    .catch((err) => {
                      reject(new Error(err));
                    });
                }
              })
              .catch((err) => {
                reject(new Error(err));
              });
          }
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  function processBucketData(filters, uuid) {
    return new Promise(function (resolve, reject) {
      let checkqry = '';
      if (filters.area_focus_ids) {
        checkqry =
          'select major_id from bucket_secondary_degree_list where bucket_secondary_degree_id in (' +
          filters.area_focus_ids +
          ')';
      } else {
        checkqry =
          'select major_id from bucket_secondary_degree_list where bucket_primary_degree_id =' +
          filters.bucket_id;
      }
      // console.log("checkqry:",checkqry);
      mysqlService
        .query(checkqry)
        .then((results) => {
          //console.log("result after checkqyery", results);
          let insertQuery = '';
          insertQuery =
            'Insert into student_degree_relation (student_id,major_id) values ';
          for (i = 0; i < results.length; i++) {
            if (i == results.length - 1) {
              insertQuery += "('" + uuid + "'," + results[i].major_id + ');';
            } else {
              insertQuery += "('" + uuid + "'," + results[i].major_id + '),';
            }
          }
          // console.log("insertqry:",insertQuery);
          mysqlService.query(insertQuery).then(
            function (response1) {
              resolve('success');
            },
            function (err) {
              if (err) {
                var error = err;
                error.status = 503;
                return reject(error);
              }
            }
          );
        })
        .catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function checkUserExists(email) {
    return new Promise(function (resolve, reject) {
      let checkqry =
        "select users.email, users.src from ( select email as email, 'user' as src from students where user_account_status='active' union select college_user_email as email, 'collegeAdmin' as src from college_users where status='active' union select admin_user_email as email, 'admin' as src from admin_users where status='active') users where users.email = '" +
        email +
        "' limit 1";
      mysqlService
        .query(checkqry)
        .then((results) => {
          resolve(results);
        })
        .catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function emailVeteran(studentInfo) {
    return new Promise(function (resolve, reject) {
      let message = messageEmail.veteranRegistrationMessage(studentInfo.military_status);
      //console.log("CON:", message)
      let subject = emailConstant.MILITARY_REGISTRATION_STATUS;
      let to = [studentInfo.email];
      let from = emailConstant.NO_REPLY_EMAIL;
      emailService.sendEmail(from, to, subject, message).then(
        function (response) {
          resolve('success');
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  function collegeRegister(filters) {
    return new Promise(function (resolve, reject) {
      emailNewCollege(filters.college_email).then(
        function (response) {
          // console.log(response);
          if (response == 'success') {
            notifyHFANewCollege(filters).then(
              function (response) {
                // console.log(response);
                if (response == 'success') {
                  resolve('success');
                }
              },
              function (err) {
                reject(new Error(err));
              }
            );
          }
        },
        function (err) {
          reject(new Error(err));
        }
      );
    });
  }

  function emailNewCollege(email) {
    return new Promise(function (resolve, reject) {
      let message = messageEmail.welcomeNewCollege();
      let subject = emailConstant.NEW_COLLEGE_EMAIL_SUBJECT;
      let to = [email];
      let from = emailConstant.NO_REPLY_EMAIL;
      emailService.sendEmail(from, to, subject, message).then(
        function (response) {
          resolve('success');
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  function notifyHFANewCollege(filters) {
    return new Promise(function (resolve, reject) {
      let message = messageEmail.newCollegeSupportEmail(
        filters.college_contact_name,
        filters.college_name,
        filters.college_email,
        filters.college_state,
        filters.college_admin_phone_number
      );
      let subject = emailConstant.NEW_COLLEGE_ADMIN_SUBJECT;
      let to = [emailConstant.SUPPORT_ADMIN_EMAIL];
      let from = emailConstant.NO_REPLY_EMAIL;
      emailService.sendEmail(from, to, subject, message).then(
        function (response) {
          resolve('success');
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  function veteranLogin(filters, userType) {
    return new Promise(function (resolve, reject) {
      let queryLogin =
        "select ss.uuid,ss.first_name,ss.last_name,ss.email,ss.password,sp.category_question,sp.military_branch,sp.military_status,sp.military_rank,sp.mos,sp.available,sp.benefit_question,sp.postal_code,sp.phone_number,sp.security_clearance,sp.mmb_level_id,sp.bucket_id,sp.secondary_bucket_id,sp.career_id,sp.exp_year,sp.desired_salary,sp.relocate,sp.state from students as ss LEFT JOIN student_profile as sp ON ss.uuid=sp.uuid where ss.email = '" +
        filters.user_email +
        "' limit 1";
      mysqlService.query(queryLogin).then(
        function (userinfo) {
          if (userinfo.length == 0) {
            resolve('user does not exist');
          }
          if (userinfo[0].password != sha1(filters.user_password)) {
            resolve('Please enter correct password');
          }

          collegeService.recordStudentLogin(userinfo[0].uuid);
          resolve(careerreconLoginModel(userinfo[0], userType));
        },
        function (err) {
          if (err) {
            let error = stringUtil.errorStatus(err);
            return reject(error);
          }
        }
      );
    });
  }

  function userLogin(filters) {
    return new Promise(function (resolve, reject) {
      let queryLogin =
        "select uuid as id,first_name,last_name,email,'user' as type,password from students where user_account_status='ACTIVE' and email = '" +
        filters.userName +
        "' limit 1";
      mysqlService.query(queryLogin).then(
        function (userinfo) {
          if (userinfo.length == 0) {
            resolve('user does not exist');
          }

          if (userinfo[0].password != sha1(filters.password)) {
            resolve('Please enter correct password');
          }

          collegeService.recordStudentLogin(userinfo[0].uuid);
          resolve(basicLoginModel(userinfo));
        },
        function (err) {
          if (err) {
            let error = stringUtil.errorStatus(err);
            return reject(error);
          }
        }
      );
    });
  }

  function addVeteranToGoogleSheet(firstName, lastName, email, registerSource, response){
    return new Promise(async function (resolve, reject) {
      let ccSuccess = "";
      let ccResponse = "";
      if(response == "success"){
          ccSuccess = "Success";
      }else{
          ccSuccess = "Fail";
          ccResponse = response;
      }
      let userData = [
        firstName,
        lastName,
        email,
        registerSource,
        ccSuccess,
        ccResponse
      ];
      await doc.useServiceAccountAuth(creds);
      await doc.loadInfo();
      const sheet1 = doc.sheetsByIndex[0];
      await sheet1.addRow(userData);
      resolve("success");
    });
  }

  return {
    login: login,
    resetPassword: resetPassword,
    studentRegister: studentRegister,
    collegeRegister: collegeRegister,
    veteranLogin: veteranLogin,
    userLogin: userLogin,
    addVeteranToGoogleSheet: addVeteranToGoogleSheet
  };
})();

module.exports = authenicateService;
