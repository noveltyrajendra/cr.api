const { STUDENT_MAP, STUDENT_PROFILE_MAP } = require('../mapper');
const { mapDataToTableField, isObjectEmpty } = require('../utils/commonUtils');
const config = require('../config');

let studentService = (function () {
  let mysqlService = require('./mysqlService');
  let studentConstant = require('../constants/studentConstant');
  let searchConstant = require('../constants/searchConstant');
  let stringUtil = require('../utils/stringUtil');
  let studentProfileModel = require('../models/studentProfileModel');
  let studentMessageinfoModel = require('../models/studentMessageinfoModel');
  let studentCollegeContactModel = require('../models/studentCollegeContactModel');
  let studentMatchedSchoolModel = require('../models/studentMatchedSchoolModel');
  let collegeMatchPercentModel = require('../models/collegeMatchPercentModel');
  let savedCollegeListModel = require('../models/savedCollegeListModel');
  let savedCollegeWithFilterModel = require('../models/savedCollegeWithFilterModel');
  let collegeService = require('./collegeService');
  let moment = require('moment');
  let sha1 = require('sha1');
  const { findOne } = require('../helpers/mysql-helper');
  const { DB_TABLE } = require('../constants/table-constant');
  const { getFavoritedColleges } = require('./usagestatisticsService');
  const { getVeteranReplyReceived } = require('./reconMessageService');
  const { convertDateToSpecificFormat } = require('../utils/momentUtility');
  const { YMD } = require('../constants/date-time-constant');
  const { errorWithCode } = require('../utils/errorHandler');
  const emailService = require('../services/emailService');
	const emailConstant=require('../constants/emailConstant');
  const messageEmail = require('../utils/messageEmail');
  const config = require('../config');
  const messageEncryption = require('../utils/base64Utility');

  async function getStudentProfile(studentId) {
    try {
      const student = await mysqlService.query(
        `${studentConstant.DEFAULT_STUDENT_PROFILE_QUERY} '${studentId}'`
      );
      const [studentProfile] = studentProfileModel(student);
      const studentBuckets = studentProfile.bucketId
        ? await mysqlService.query(
            `SELECT title FROM bucket_degree WHERE FIND_IN_SET(id, '${studentProfile.bucketId}')`
          )
        : null;
      const studentSecondaryBuckets = studentProfile.secBucketId
        ? await mysqlService.query(
            `SELECT title FROM bucket_secondary_degree WHERE FIND_IN_SET(id, '${studentProfile.secBucketId}')`
          )
        : null;
      const studentLevel = studentProfile.levelId
        ? await mysqlService.query(
            `SELECT title FROM levels WHERE FIND_IN_SET(id, '${studentProfile.levelId}')`
          )
        : null;
      return [
        {
          ...studentProfile,
          studentBuckets:
            studentProfile.bucketId && studentBuckets
              ? studentBuckets.map((bucket) => bucket.title).join(',')
              : '',
          studentSecondaryBuckets:
            studentProfile.secBucketId && studentSecondaryBuckets
              ? studentSecondaryBuckets.map((bucket) => bucket.title).join(',')
              : '',
          studentLevel:
            studentProfile.levelId && studentLevel
              ? studentLevel.map((bucket) => bucket.title).join(',')
              : '',
        },
      ];
    } catch (error) {
      throw errorWithCode(
        error && error.message ? error.message : 'Internal server error!'
      );
    }
  }

  function getStudentMessageData(studentid) {
    return new Promise(function (resolve, reject) {
      mysqlService
        .query(
          studentConstant.DEFAULT_STUDENT_MESSAGEINFO_QUERY +
            "'" +
            studentid +
            "'"
        )
        .then(
          function (response) {
            resolve(studentMessageinfoModel(response));
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

  function imageUpdate(imageName, uuid) {
    return new Promise(function (resolve, reject) {
      let updateQuery =
        'UPDATE `student_profile` SET  profile_image = "' +
        imageName +
        '" WHERE uuid = "' +
        uuid +
        '"';
      mysqlService.query(updateQuery).then(
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

  function updatePersonalInfoName(userData) {
    return new Promise(function (resolve, reject) {
      let updateStudentName =
        'UPDATE `students` SET  first_name = "' +
        userData['firstName'] +
        '", middle_initial = "' +
        userData['middleName'] +
        '",last_name = "' +
        userData['lastName'] +
        '"  WHERE uuid = "' +
        userData['uuid'] +
        '"';
      /*let updateStudentProfile = 'UPDATE `student_profile` SET  personal_statement = "'+userData['personalStatement']+'", military_branch = "'+userData['militaryBranch']+'", military_rank = "'+userData['militaryRank']+'"  WHERE uuid = "'+userData['uuid']+'"';*/
      let updateStudentProfile =
        'UPDATE `student_profile` SET  personal_statement = "' +
        userData['personalStatement'] +
        '" WHERE uuid = "' +
        userData['uuid'] +
        '"';
      //console.log(updateStudentName);
      mysqlService.query(updateStudentName).then(
        function (response) {
          mysqlService.query(updateStudentProfile).then(
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

  function updatePersonalInfo(userData) {
    return new Promise(function (resolve, reject) {
      let dobval = '';
      if (userData.dob != '') {
        dobval = moment(userData.dob).format('YYYY-MM-DD');
      }
      let updateEmail =
        'UPDATE `students` SET  email = "' +
        userData.email +
        '"  WHERE uuid = "' +
        userData.uuid +
        '"';
      let updateQuery =
        'UPDATE `student_profile` SET address = "' +
        userData.address +
        '", city = "' +
        userData.city +
        '",state = "' +
        userData.state +
        '",postal_code = "' +
        userData.postalCode +
        '",gender = "' +
        userData.gender +
        '", dob = "' +
        dobval +
        '",ethnicity = "' +
        userData.ethnicity +
        '",marital_status = "' +
        userData.maritalStatus +
        '",phone_number = "' +
        userData.phoneNumber +
        '"  WHERE uuid = "' +
        userData.uuid +
        '"';
      mysqlService.query(updateQuery).then(
        function (response) {
          mysqlService.query(updateEmail).then(
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

  function updatefilterdata(filterData) {
    return new Promise(function (resolve, reject) {
      let updateFilters =
        "UPDATE `students` SET  filters =  ' " +
        filterData.filter_data +
        " ',filter_bucketdata = '" +
        filterData.filter_bucketdata +
        "',filter_state = '" +
        filterData.filter_state +
        "'  WHERE uuid = '" +
        filterData.uuid +
        "'";
      // console.log("uf",updateFilters);
      mysqlService.query(updateFilters).then(
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

  function updateAcademicInfo(userData) {
    return new Promise(function (resolve, reject) {
      let updateQuery =
        'UPDATE `student_profile` SET last_school_attended = "' +
        userData.lastSchoolAttended +
        '", name_of_school = "' +
        userData.nameOfSchool +
        '", act_score = "' +
        userData.actScore +
        '", sat_score = "' +
        userData.satScore +
        '", gpa = "' +
        userData.gpa +
        '", credits_earned = "' +
        userData.creditsEarned +
        '", academic_flag=0  WHERE uuid = "' +
        userData.uuid +
        '"';

      let delData = stringUtil.arrayDiff(
        userData.prevoiusMajors,
        userData.currentMajors
      );
      let newData = stringUtil.arrayDiff(
        userData.currentMajors,
        userData.prevoiusMajors
      );

      mysqlService.query(updateQuery).then(
        function (response) {
          deleteVeteranMajors(delData, userData.uuid).then(
            function (response1) {
              if (response1 == 'success') {
                insertVeteranMajors(newData, userData.uuid).then(
                  function (response2) {
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
    });
  }

  function deleteVeteranMajors(delData, uuid) {
    return new Promise(function (resolve, reject) {
      if (delData.length > 0) {
        let delQuery =
          'Delete  from `student_degree_relation` WHERE student_id = "' +
          uuid +
          '" and major_id in (' +
          stringUtil.joinStringByComma(delData) +
          ')';
        //console.log("Del:",delQuery);
        mysqlService.query(delQuery).then(
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
      } else {
        resolve('success');
      }
    });
  }

  function deleteMatchedSchools(delData) {
    return new Promise(function (resolve, reject) {
      let delQuery =
        'Delete from `users_matched_colleges` WHERE student_id = "' +
        delData.studentId +
        '" and college_id ="' +
        delData.collegeId +
        '"';
      mysqlService.query(delQuery).then(
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

  function insertVeteranMajors(newData, uuid) {
    return new Promise(function (resolve, reject) {
      if (newData.length > 0) {
        let insertQuery =
          'Insert into student_degree_relation (student_id,major_id) values ';
        for (i = 0; i < newData.length; i++) {
          if (i == newData.length - 1) {
            insertQuery += "('" + uuid + "'," + newData[i] + ');';
          } else {
            insertQuery += "('" + uuid + "'," + newData[i] + '),';
          }
        }
        //console.log("Insert:",insertQuery);
        mysqlService.query(insertQuery).then(
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
      } else {
        resolve('success');
      }
    });
  }

  function updateMilitaryInfo(userData) {
    return new Promise(function (resolve, reject) {
      let ssdate = '';
      let sedate = '';
      let mrank = 0;
      if (userData.militaryRank != '') {
        mrank = userData.militaryRank;
      }
      if (userData.serviceStartDate != '') {
        ssdate = moment(userData.serviceStartDate).format('YYYY-MM-DD');
      }
      if (userData.serviceEndDate != '') {
        sedate = moment(userData.serviceEndDate).format('YYYY-MM-DD');
      }
      let updateQuery =
        'UPDATE `student_profile` SET military_status = "' +
        userData.militaryStatus +
        '", military_branch = "' +
        userData.militaryBranch +
        '",mos = "' +
        userData.militaryMos +
        '", military_rank = "' +
        mrank +
        '", service_start_date = "' +
        ssdate +
        '", service_end_date = "' +
        sedate +
        '", enrollment_military_status = "' +
        userData.enrollmentMilitaryStatus +
        '", military_awards_1 = "' +
        userData.militaryAwards1 +
        '", military_awards_2 = "' +
        userData.militaryAwards2 +
        '", military_awards_3 = "' +
        userData.militaryAwards3 +
        '"  WHERE uuid = "' +
        userData.uuid +
        '"';
      mysqlService.query(updateQuery).then(
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

  function jstTranscriptFileUpdate(imageName, data, uuid) {
    return new Promise(function (resolve, reject) {
      let updateQuery =
        'UPDATE `student_profile` SET  jst_transcript_file = "' +
        imageName +
        '" WHERE uuid = "' +
        uuid +
        '"';
      mysqlService.query(updateQuery).then(
        function (response) {
          resolve(data.Location);
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

  function jstTranscriptFileDelete(res) {
    return new Promise(function (resolve, reject) {
      let updateQuery =
        'UPDATE `student_profile` SET  jst_transcript_file = "" WHERE uuid = "' +
        res.uuid +
        '"';
      mysqlService.query(updateQuery).then(
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

  function favoutiteCollege(res) {
    return new Promise(function (resolve, reject) {
      let deleteQuery =
        'DELETE FROM fav_colleges WHERE student_id = "' +
        res.studentId +
        '" AND college_id = ' +
        res.collegeId;
      mysqlService.query(deleteQuery).then(
        function (response) {
          let insertQuery =
            'INSERT INTO fav_colleges SET student_id = "' +
            res.studentId +
            '", college_id = "' +
            res.collegeId +
            '"';
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

  function unfavoutiteCollege(res) {
    return new Promise(function (resolve, reject) {
      let deleteQuery =
        'DELETE FROM fav_colleges WHERE student_id = "' +
        res.studentId +
        '" AND college_id = ' +
        res.collegeId;
      mysqlService.query(deleteQuery).then(
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

  function checkfavoutiteCollege(studentid, collegeid) {
    return new Promise(function (resolve, reject) {
      let selectQuery =
        'SELECT count(id) as favcount FROM fav_colleges WHERE student_id = "' +
        studentid +
        '" AND college_id = ' +
        collegeid;
      mysqlService.query(selectQuery).then(
        function (response) {
          if (response[0].favcount > 0) {
            resolve('true');
          } else {
            resolve('false');
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

  function getVeteranProfileView(studentid) {
    return new Promise(function (resolve, reject) {
      let query =
        'SELECT distinct(college_id) FROM `recon_messages` WHERE student_id = "' +
        studentid +
        '"';
      mysqlService.query(query).then(
        function (response) {
          if (response.length == 0) {
            resolve(response);
          }
          let searchColleges = '';
          for (var i = 0; i < response.length; i++) {
            searchColleges += response[i].college_id + ',';
          }
          searchColleges = searchColleges.slice(0, -1);
          let selectQuery =
            'SELECT c.id,HTML_UnEncode(c.college_name)as college_name,seo_name,college_alias,c.address,c.city,c.state,c.postal_code,c.phone_number,c.website,cp.college_logo FROM colleges as c LEFT JOIN college_profiles as cp ON c.id=cp.college_id WHERE c.id IN (' +
            searchColleges +
            ') ORDER BY college_name ASC';
          mysqlService.query(selectQuery).then(
            function (response1) {
              resolve(studentCollegeContactModel(response1));
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

  function getVeteranFavouritelist(studentid) {
    return new Promise(function (resolve, reject) {
      let selectQuery =
        "SELECT HTML_UnEncode(c.college_name)as college_name,c.seo_name,c.college_alias,c.address,c.city,c.state,c.postal_code,c.website,c.phone_number,f.college_id as id,cp.college_logo FROM `fav_colleges` as f,colleges as c,college_profiles as cp WHERE f.college_id = c.id AND f.college_id=cp.college_id AND student_id = '" +
        studentid +
        "'";
      mysqlService.query(selectQuery).then(
        function (response) {
          resolve(studentCollegeContactModel(response));
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

  function getSaveRegisterMatchCollege(cdata) {
    return new Promise(function (resolve, reject) {
      //console.log("LL:",cdata.collegeData.length);
      let insertQuery = '';
      if (cdata.collegeData.length == 1) {
        checkCollegeDataExists(cdata).then(
          function (response) {
            var nowdate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
            //var condate = '0000-00-00';
            //if (cdata.contacted == "Yes") {
            condate = nowdate;
            //}
            if (response[0].total == 1) {
              insertQuery =
                "Update users_matched_colleges set is_contacted='" +
                cdata.contacted +
                "',contacted_date='" +
                condate +
                "' where college_id=" +
                cdata.collegeData[0]['collegeId'] +
                " and student_id='" +
                cdata.studentId +
                "'";
            } else {
              let isPassedInCollege = 0;
              if (cdata.isPassedInCollege) {
                isPassedInCollege = cdata.isPassedInCollege;
              }
              let mPercent = 0;
              if (cdata.contacted == 'Yes') {
                mPercent = cdata.matchPercent;
              } else {
                mPercent = cdata.collegeData[0]['percentMatch'];
              }
              insertQuery =
                "Insert into users_matched_colleges (student_id,college_id,is_contacted,src,matched_date,matched_percent,is_passedin_college) values ('" +
                cdata.studentId +
                "'," +
                cdata.collegeData[0]['collegeId'] +
                ",'" +
                cdata.contacted +
                "','" +
                cdata.src +
                "','" +
                nowdate +
                "','" +
                mPercent +
                "','" +
                isPassedInCollege +
                "')";
            }
            // console.log("II:",insertQuery);
            mysqlService.query(insertQuery).then(
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
          },
          function (err) {
            if (err) {
              var error = err;
              error.status = 503;
              return reject(error);
            }
          }
        );
      } else {
        let nowdate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
        insertQuery =
          'Insert into users_matched_colleges (student_id,college_id,is_contacted,src,matched_date,matched_percent) values ';
        for (let i = 0; i < cdata.collegeData.length; i++) {
          if (i == cdata.collegeData.length - 1) {
            insertQuery +=
              "('" +
              cdata.studentId +
              "'," +
              cdata.collegeData[i]['collegeId'] +
              ",'" +
              cdata.contacted +
              "','" +
              cdata.src +
              "','" +
              nowdate +
              "','" +
              cdata.collegeData[i]['percentMatch'] +
              "');";
          } else {
            insertQuery +=
              "('" +
              cdata.studentId +
              "'," +
              cdata.collegeData[i]['collegeId'] +
              ",'" +
              cdata.contacted +
              "','" +
              cdata.src +
              "','" +
              nowdate +
              "','" +
              cdata.collegeData[i]['percentMatch'] +
              "'),";
          }
        }

        // console.log("II1:",insertQuery);
        mysqlService.query(insertQuery).then(
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
      }
    });
  }

  function checkCollegeDataExists(cdata) {
    return new Promise(function (resolve, reject) {
      let checkqry =
        'Select count(id) as total from users_matched_colleges where  college_id=' +
        cdata.collegeData[0]['collegeId'] +
        " and student_id='" +
        cdata.studentId +
        "'";
      //   console.log("CC:",checkqry);
      mysqlService
        .query(checkqry)
        .then((results) => {
          // console.log("results", results)
          resolve(results);
        })
        .catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function getUpdateRegisterMatchCollege(udata) {
    return new Promise(function (resolve, reject) {
      let condate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      let updateQuery =
        "Update users_matched_colleges set is_contacted='Yes',contacted_date='" +
        condate +
        "' where college_id=" +
        udata.collegeId +
        " and student_id='" +
        udata.studentId +
        "'";
      //console.log("UU:",updateQuery);
      mysqlService.query(updateQuery).then(
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

  function getMatchedCollegeList(studentId) {
    return new Promise(function (resolve, reject) {
      let selQuery =
        "select umc.*,cc.college_name,cc.college_alias,cc.seo_name, convert(cast(convert(cp.display_text using latin1) as binary) using utf8) as display_text,cc.phone_required,cc.parent_id,cc.show_parent_child,cp.college_logo,cc.college_type,cc.access_level,cc.city,cc.state,cc.contact_email,convert(cast(convert(cp.overview using latin1) as binary) using utf8) as overview,(select program_matcher_only from college_degree_specific_info WHERE college_info_id=cc.id) as searchonly from users_matched_colleges as umc left join colleges as cc on umc.college_id=cc.id LEFT JOIN college_profiles cp ON cp.college_id = umc.college_id where umc.student_id='" +
        studentId +
        "' ORDER BY is_passedin_college DESC, matched_date DESC,matched_percent DESC";
      // console.log("UU:",selQuery);
      mysqlService.query(selQuery).then(
        function (response) {
          resolve(studentMatchedSchoolModel(response));
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

  function getMatchedCollegeInfo(data) {
    return new Promise(function (resolve, reject) {
      let selQuery =
        "select umc.*,cc.college_name,cc.seo_name from users_matched_colleges as umc left join colleges as cc on umc.college_id=cc.id where umc.student_id='" +
        data.studentId +
        "' and umc.college_id = '" +
        data.collegeId +
        "'  ORDER BY is_passedin_college DESC, matched_date DESC,matched_percent DESC";
      // console.log("UU:",selQuery);
      mysqlService.query(selQuery).then(
        function (response) {
          resolve(response);
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

  function getCalculateMatchedPercent(studentId, collegeId) {
    return new Promise(function (resolve, reject) {
      let stuinfo =
        "Select study_state,bucket_id,secondary_bucket_id,education_goal,enrollment_military_status from searchdata where uuid='" +
        studentId +
        "' order by date_created desc limit 1";
      mysqlService.query(stuinfo).then(
        function (response) {
          if (response.length > 0) {
            // let sourroundQuery = 'Select sourrounding_statevalue from state_sourrounding where state_value ="' + response[0].study_state + '"';
            // mysqlService.query(sourroundQuery)
            // 	.then(function (sresponse) {
            // 		if (sresponse.length > 0 && sresponse[0]['sourrounding_statevalue'] != "") {
            // 			sourround_state = response[0].study_state + "," + sresponse[0]['sourrounding_statevalue'];
            // 		} else {
            // 			sourround_state = response[0].study_state;
            // 		}
            let sourroundQuery =
              'Select GROUP_CONCAT(sourrounding_statevalue) as sourrounding_statevalue from state_sourrounding where state_value in (' +
              stringUtil.joinStringByComma(response[0].study_state.split(',')) +
              ')';
            mysqlService.query(sourroundQuery).then(
              function (sresponse) {
                if (sresponse[0]['sourrounding_statevalue'] && sresponse[0]['sourrounding_statevalue'].length > 0) {
                  //if (sresponse.length > 1) {
                  let setData = '';
                  /*for (let i = 0; i < sresponse.length; i++) {
									  setData += sresponse[i]['sourrounding_statevalue'] + ",";
									}
									setData = setData.slice(0, -1);*/
                  setData = sresponse[0]['sourrounding_statevalue'];
                  let commaData = setData;
                  if (commaData.substr(0, 1) == ',') {
                    commaData = commaData.slice(1, commaData.length);
                  }

                  if (commaData.substr(commaData.length - 1, 1) == ',') {
                    commaData = commaData.slice(0, -1);
                  }
                  setData = response[0].study_state + ',' + commaData;
                  sourrond_arr = stringUtil.removeDuplicates(
                    setData.split(',')
                  );
                  sourround_state = sourrond_arr.join(',');
                  //console.log("SSSS:",sourround_state);
                  //} else {
                  //	sourround_state = response[0].study_state + "," + sresponse[0]['sourrounding_statevalue'];
                  //}
                } else {
                  sourround_state = response[0].study_state;
                }
                let selectQuery = '';
                if (response.length > 0 && response[0].bucket_id) {
                  selectQuery =
                    'select major_id from bucket_secondary_degree_list where bucket_primary_degree_id in (' +
                    response[0].bucket_id +
                    ')';
                  //console.log("KK:",selectQuery);
                  mysqlService.query(selectQuery).then(
                    function (mresponse) {
                      if (mresponse.length > 0) {
                        // console.log("major id", mresponse)
                        var ids = '';
                        for (i = 0; i < mresponse.length; i++) {
                          ids += mresponse[i].major_id + ',';
                        }
                        ids = ids.slice(0, -1);
                        subquery =
                          'select count(*) as majorCount from college_majors_new where major_id in (' +
                          ids +
                          ') and cr_id=' +
                          collegeId +
                          ' and aw_level = ' +
                          response[0].education_goal +
                          '';
                        mysqlService.query(subquery).then(
                          function (cresponse) {
                            // console.log("cresponse",cresponse)
                            let colinfo =
                              'Select cc.state,cc.college_type,cp.full_time_vet_counselors,cp.principles_of_excellence,cp.awards_ace_credit,cp.yellow_ribbon,cp.approved_ta_funding,cp.reduced_tuition,cp.public_private,cp.in_state_tuition,cp.out_state_tuition from colleges as cc left join college_profiles as cp ON cc.id=cp.college_id where cp.college_id=' +
                              collegeId;
                            mysqlService.query(colinfo).then(
                              function (response1) {
                                checkSecondaryBucketInCollege(
                                  response[0],
                                  collegeId
                                ).then(
                                  function (response2) {
                                    resolve(
                                      collegeMatchPercentModel(
                                        response1[0],
                                        response[0].study_state,
                                        cresponse[0].majorCount,
                                        sourround_state,
                                        response[0].enrollment_military_status,
                                        response2
                                      )
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
                          },
                          function (err) {
                            if (err) {
                              var error = err;
                              error.status = 503;
                              return reject(error);
                            }
                          }
                        );
                      } else {
                        resolve('empty');
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
                } else {
                  let studentMajorQry =
                    "Select GROUP_CONCAT(major_id) as major_ids from student_degree_relation where student_id='" +
                    studentId +
                    "'";
                  mysqlService.query(studentMajorQry).then(
                    function (mresponse) {
                      if (
                        mresponse[0].major_ids &&
                        mresponse[0].major_ids.length > 0
                      ) {
                        if (response[0].education_goal) {
                          subquery =
                            'select count(*) as majorCount from college_majors_new where major_id in (' +
                            mresponse[0].major_ids +
                            ') and cr_id=' +
                            collegeId +
                            ' and aw_level = ' +
                            response[0].education_goal +
                            '';
                        } else {
                          subquery =
                            'select count(*) as majorCount from college_majors_new where major_id in (' +
                            mresponse[0].major_ids +
                            ') and cr_id=' +
                            collegeId;
                        }
                        mysqlService.query(subquery).then(
                          function (cresponse) {
                            // console.log("cresponse",cresponse)
                            let colinfo =
                              'Select cc.state,cc.college_type,cp.full_time_vet_counselors,cp.principles_of_excellence,cp.awards_ace_credit,cp.yellow_ribbon,cp.approved_ta_funding,cp.reduced_tuition,cp.public_private,cp.in_state_tuition,cp.out_state_tuition from colleges as cc left join college_profiles as cp ON cc.id=cp.college_id where cp.college_id=' +
                              collegeId;
                            mysqlService.query(colinfo).then(
                              function (response1) {
                                resolve(
                                  collegeMatchPercentModel(
                                    response1[0],
                                    response[0].study_state,
                                    cresponse[0].majorCount,
                                    sourround_state,
                                    response[0].enrollment_military_status,
                                    0
                                  )
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
                      } else {
                        let colinfo =
                          'Select cc.state,cc.college_type,cp.full_time_vet_counselors,cp.principles_of_excellence,cp.awards_ace_credit,cp.yellow_ribbon,cp.approved_ta_funding,cp.reduced_tuition,cp.public_private,cp.in_state_tuition,cp.out_state_tuition from colleges as cc left join college_profiles as cp ON cc.id=cp.college_id where cp.college_id=' +
                          collegeId;
                        mysqlService.query(colinfo).then(
                          function (response1) {
                            resolve(
                              collegeMatchPercentModel(
                                response1[0],
                                response[0].study_state,
                                0,
                                sourround_state,
                                response[0].enrollment_military_status,
                                0
                              )
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
          } else {
            let stuinfo =
              "Select state,bucket_id,secondary_bucket_id,level_id,military_status from student_profile where uuid='" +
              studentId +
              "'";
            mysqlService.query(stuinfo).then(
              function (response) {
                if (response[0] && response[0].state) {
                  let sourroundQuery =
                    'Select sourrounding_statevalue from state_sourrounding where state_value ="' +
                    response[0].state +
                    '"';
                  mysqlService.query(sourroundQuery).then(
                    function (sresponse) {
                      if (
                        sresponse.length > 0 &&
                        sresponse[0]['sourrounding_statevalue'] != ''
                      ) {
                        sourround_state =
                          response[0].state +
                          ',' +
                          sresponse[0]['sourrounding_statevalue'];
                      } else {
                        sourround_state = response[0].state;
                      }
                      if (response.length > 0 && response[0].bucket_id) {
                        let selectQuery =
                          'select major_id from bucket_secondary_degree_list where bucket_primary_degree_id in (' +
                          response[0].bucket_id +
                          ')';
                        mysqlService.query(selectQuery).then(
                          function (mresponse) {
                            if (mresponse.length > 0) {
                              // console.log("major id", mresponse)
                              var ids = '';
                              for (i = 0; i < mresponse.length; i++) {
                                ids += mresponse[i].major_id + ',';
                              }
                              ids = ids.slice(0, -1);
                              subquery =
                                'select count(*) as majorCount from college_majors_new where major_id in (' +
                                ids +
                                ') and cr_id=' +
                                collegeId +
                                ' and aw_level = ' +
                                response[0].level_id +
                                '';
                              mysqlService.query(subquery).then(
                                function (cresponse) {
                                  // console.log("cresponse",cresponse)
                                  let colinfo =
                                    'Select cc.state,cc.college_type,cp.full_time_vet_counselors,cp.principles_of_excellence,cp.awards_ace_credit,cp.yellow_ribbon,cp.approved_ta_funding,cp.reduced_tuition,cp.public_private,cp.in_state_tuition,cp.out_state_tuition from colleges as cc left join college_profiles as cp ON cc.id=cp.college_id where cp.college_id=' +
                                    collegeId;
                                  mysqlService.query(colinfo).then(
                                    function (response1) {
                                      checkSecondaryBucketInCollege(
                                        response[0],
                                        collegeId
                                      ).then(
                                        function (response2) {
                                          resolve(
                                            collegeMatchPercentModel(
                                              response1[0],
                                              response[0].state,
                                              cresponse[0].majorCount,
                                              sourround_state,
                                              response[0].military_status,
                                              response2
                                            )
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
                                },
                                function (err) {
                                  if (err) {
                                    var error = err;
                                    error.status = 503;
                                    return reject(error);
                                  }
                                }
                              );
                            } else {
                              resolve('empty');
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
                      } else {
                        let studentMajorQry =
                          "Select GROUP_CONCAT(major_id) as major_ids from student_degree_relation where student_id='" +
                          studentId +
                          "'";
                        mysqlService.query(studentMajorQry).then(
                          function (mresponse) {
                            if (
                              mresponse[0].major_ids &&
                              mresponse[0].major_ids.length > 0
                            ) {
                              if (response[0].education_goal) {
                                subquery =
                                  'select count(*) as majorCount from college_majors_new where major_id in (' +
                                  mresponse[0].major_ids +
                                  ') and cr_id=' +
                                  collegeId +
                                  ' and aw_level = ' +
                                  response[0].education_goal +
                                  '';
                              } else {
                                subquery =
                                  'select count(*) as majorCount from college_majors_new where major_id in (' +
                                  mresponse[0].major_ids +
                                  ') and cr_id=' +
                                  collegeId;
                              }
                              mysqlService.query(subquery).then(
                                function (cresponse) {
                                  // console.log("cresponse",cresponse)
                                  let colinfo =
                                    'Select cc.state,cc.college_type,cp.full_time_vet_counselors,cp.principles_of_excellence,cp.awards_ace_credit,cp.yellow_ribbon,cp.approved_ta_funding,cp.reduced_tuition,cp.public_private,cp.in_state_tuition,cp.out_state_tuition from colleges as cc left join college_profiles as cp ON cc.id=cp.college_id where cp.college_id=' +
                                    collegeId;
                                  mysqlService.query(colinfo).then(
                                    function (response1) {
                                      resolve(
                                        collegeMatchPercentModel(
                                          response1[0],
                                          response[0].study_state,
                                          cresponse[0].majorCount,
                                          sourround_state,
                                          response[0].military_status,
                                          0
                                        )
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
                            } else {
                              let colinfo =
                                'Select cc.state,cc.college_type,cp.full_time_vet_counselors,cp.principles_of_excellence,cp.awards_ace_credit,cp.yellow_ribbon,cp.approved_ta_funding,cp.reduced_tuition,cp.public_private,cp.in_state_tuition,cp.out_state_tuition from colleges as cc left join college_profiles as cp ON cc.id=cp.college_id where cp.college_id=' +
                                collegeId;
                              mysqlService.query(colinfo).then(
                                function (response1) {
                                  resolve(
                                    collegeMatchPercentModel(
                                      response1[0],
                                      response[0].study_state,
                                      0,
                                      sourround_state,
                                      response[0].military_status,
                                      0
                                    )
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
                } else {
                  resolve({ totalMatchPercent: 0 });
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

  function checkSecondaryBucketInCollege(vetData, collegeId) {
    return new Promise(function (resolve, reject) {
      let educationGoal = getAcademicLevel(vetData.level_id);
      let selectQuery =
        'select count(cmn.major_id) as total from bucket_secondary_degree_list as bsd left join college_majors_new as cmn on bsd.major_id=cmn.major_id where bsd.bucket_secondary_degree_id in (' +
        vetData.secondary_bucket_id +
        ') and cmn.aw_level in (' +
        educationGoal +
        ') and cmn.cr_id=' +
        collegeId;
      mysqlService.query(selectQuery).then(
        function (response) {
          var majorsIds = 0;
          if (response.length > 0) {
            majorsIds = response[0].total;
          }
          resolve(majorsIds);
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

  function getAcademicLevel(levelId) {
    let educationGoal = '';
    if (searchConstant.EducationalLevel.indexOf(levelId) > -1) {
      educationGoal = levelId;
    } else {
      educationGoal = '6,8,18';
    }
    return educationGoal;
  }

  function checkVeteransExist(studentId) {
    return new Promise(function (resolve, reject) {
      let selQuery = "select id from students where uuid='" + studentId + "'";
      mysqlService.query(selQuery).then(
        function (response) {
          if (response.length > 0 && response[0].id) {
            resolve('success');
          } else {
            resolve('fail');
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

  function getVeteransMajorList(studentId) {
    return mysqlService.query(`
      SELECT major_id,(SELECT title FROM majors_new WHERE id=major_id) as title FROM student_degree_relation WHERE student_id = '${studentId}'
    `);
  }

  async function getVeteranAwards(studentId) {
    const [{ militaryAwards1, militaryAwards2, militaryAwards3 }] =
      await mysqlService.query(
        `SELECT military_awards_1 as militaryAwards1, military_awards_2 as militaryAwards2, military_awards_3 as militaryAwards3 FROM student_profile WHERE uuid = '${studentId}'`
      );
    if (!militaryAwards1 && !militaryAwards2 && !militaryAwards3) return [];
    let query = `SELECT id as awardId, award_short_name as shortName FROM awards WHERE id IN (`;
    if (militaryAwards1) query += `'${militaryAwards1}'`;
    if (militaryAwards2) query += `,'${militaryAwards2}'`;
    if (militaryAwards3) query += `,'${militaryAwards3}'`;
    query += `)`;
    return mysqlService.query(query);
  }

  function getVeteranAttendedSchools(studentId) {
    return mysqlService.query(`
    SELECT college_name as name, id FROM colleges WHERE FIND_IN_SET(id, (SELECT schools_attended FROM student_profile WHERE uuid = '${studentId}'))
    `);
  }

  async function getVeteranDegreeInterestList(studentId) {
    let [
      {
        areaInterest1,
        areaInterest2,
        areaInterest3,
        areaInterest4,
        areaInterest5,
      },
    ] = await mysqlService.query(
      `SELECT academic_interest_1 as areaInterest1, academic_interest_2 as areaInterest2, academic_interest_3 as areaInterest3, academic_interest_4 as areaInterest4, academic_interest_5 as areaInterest5 FROM student_profile WHERE uuid = '${studentId}'`
    );
    if (
      !areaInterest1 &&
      !areaInterest2 &&
      !areaInterest3 &&
      !areaInterest4 &&
      !areaInterest5
    )
      return [];
    let query = `SELECT id, title FROM majors_new WHERE id IN (`;
    if (areaInterest1) query += `'${areaInterest1}'`;
    if (areaInterest2) query += `,'${areaInterest2}'`;
    if (areaInterest3) query += `,'${areaInterest3}'`;
    if (areaInterest4) query += `,'${areaInterest4}'`;
    if (areaInterest5) query += `,'${areaInterest5}'`;
    query += `)`;
    return mysqlService.query(query);
  }

  function getVeteransBucketInfo(studentId) {
    return new Promise(function (resolve, reject) {
      let selQuery =
        "SELECT bucket_id,secondary_bucket_id,(SELECT title FROM bucket_degree WHERE id=bucket_id) as primaryname,(SELECT GROUP_CONCAT(title) FROM bucket_secondary_degree WHERE FIND_IN_SET(id, secondary_bucket_id)) as secondaryname FROM student_profile WHERE uuid='" +
        studentId +
        "'";
      mysqlService.query(selQuery).then(
        function (response) {
          resolve(response);
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

  function getVeteransSearchData(studentId) {
    return new Promise(function (resolve, reject) {
      let selQuery =
        "SELECT education_goal,secondary_bucket_id,study_state,enrollment_military_status,military_branch,bucket_id FROM searchdata WHERE uuid='" +
        studentId +
        "'";
      mysqlService.query(selQuery).then(
        function (response) {
          // console.log("response",response);
          if (response && response.length > 0) {
            resolve(response[0]);
          } else {
            let profileQry =
              "SELECT level_id as education_goal,secondary_bucket_id,state as study_state,military_status as enrollment_military_status,military_branch,bucket_id from student_profile WHERE uuid='" +
              studentId +
              "'";
            mysqlService.query(profileQry).then(
              function (response) {
                resolve(response[0]);
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

  function getStudentfilterData(studentid) {
    return new Promise(function (resolve, reject) {
      getQuery =
        "select filters,filter_majordata,filter_state from students where uuid = '" +
        studentid +
        "'";
      // console.log("gQ",getQuery);
      mysqlService.query(getQuery).then(
        function (response) {
          resolve(response);
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

  function emptyFilters(studentid) {
    return new Promise(function (resolve, reject) {
      getQuery = `UPDATE students SET filters = "", filter_majordata = "" , filter_bucketdata = "", filter_state = "" WHERE uuid = '${studentid}'`;
      // console.log("gQ",getQuery);
      mysqlService.query(getQuery).then(
        function (response) {
          resolve(response);
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

  function getVeteransMessagetoCollege(studentid, collegeid) {
    return new Promise(function (resolve, reject) {
      getQuery =
        'select count(id) as total from recon_messages where college_id=' +
        collegeid +
        " and student_id='" +
        studentid +
        "' and responder='user' and recipient='college'";
      // console.log("gQ",getQuery);
      mysqlService.query(getQuery).then(
        function (response) {
          resolve(response[0].total);
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

  function getVeteransSecondaryBucketInfo(studentid) {
    return new Promise(function (resolve, reject) {
      getQuery =
        "select secondary_bucket_id from student_profile where uuid = '" +
        studentid +
        "'";
      //console.log("gQ",getQuery);
      mysqlService.query(getQuery).then(
        function (response) {
          if (response[0].secondary_bucket_id && response.length > 0) {
            selQuery =
              'select title from bucket_secondary_degree where id in (' +
              response[0].secondary_bucket_id +
              ')';
            mysqlService.query(selQuery).then(
              function (response1) {
                resolve(response1);
              },
              function (err) {
                if (err) {
                  var error = err;
                  error.status = 503;
                  return reject(error);
                }
              }
            );
          } else {
            selQuery =
              "SELECT bs.title  FROM student_bucket_relation as sbr LEFT JOIN bucket_secondary_degree as bs ON sbr.secondary_bucket_id=bs.id WHERE sbr.student_id='" +
              studentid +
              "'";
            mysqlService.query(selQuery).then(
              function (response1) {
                resolve(response1);
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
          //resolve(response);
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

  function getSaveVeteranSchool(schoolData) {
    return new Promise(function (resolve, reject) {
      let savedate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      checkVeteranSavedSchool(schoolData.studentId, schoolData.collegeId).then(
        function (response) {
          if (response[0].total == 0) {
            getContactInfoMatched(
              schoolData.studentId,
              schoolData.collegeId
            ).then(
              async function (cresponse) {
                let checkFirst = await executeQuery(
                  "Select count(id) as total from users_saved_colleges WHERE student_id='" + schoolData.studentId + "'"
                );
                let isFirst = "No";
                if(checkFirst[0].total == 0){
                  isFirst = "Yes";
                }
                let insertQuery = '';
                if (
                  cresponse.length > 0 &&
                  cresponse[0].is_contacted == 'Yes'
                ) {
                  insertQuery =
                    'INSERT INTO users_saved_colleges SET student_id = "' +
                    schoolData.studentId +
                    '", college_id = "' +
                    schoolData.collegeId +
                    '", saved_date="' +
                    savedate +
                    '", is_first="'+isFirst+'", is_contacted="' +
                    cresponse[0].is_contacted +
                    '", contacted_date="' +
                    moment(cresponse[0].contacted_date).format(
                      'YYYY-MM-DD HH:mm:ss'
                    ) +
                    '"';
                } else {
                  insertQuery =
                    'INSERT INTO users_saved_colleges SET student_id = "' +
                    schoolData.studentId +
                    '", college_id = "' +
                    schoolData.collegeId +
                    '", saved_date="' +
                    savedate +
                    '", is_first="'+isFirst+'", is_contacted="' +
                    schoolData.isContacted +
                    '"';
                }

                //console.log("gQ",insertQuery);
                mysqlService.query(insertQuery).then(
                  function (response1) {
                    resolve(isFirst);
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
          } else {
            getContactInfoMatched(
              schoolData.studentId,
              schoolData.collegeId
            ).then(
              function (cresponse) {
                let updateQuery = '';
                if (
                  cresponse.length > 0 &&
                  cresponse[0].is_contacted == 'Yes'
                ) {
                  updateQuery =
                    'UPDATE `users_saved_colleges` SET  is_delete = "No", is_contacted="' +
                    cresponse[0].is_contacted +
                    '", contacted_date="' +
                    moment(cresponse[0].contacted_date).format(
                      'YYYY-MM-DD HH:mm:ss'
                    ) +
                    '" WHERE college_id = "' +
                    schoolData.collegeId +
                    '" and student_id="' +
                    schoolData.studentId +
                    '"';
                } else {
                  updateQuery =
                    'UPDATE `users_saved_colleges` SET  is_delete = "No",is_contacted="' +
                    schoolData.isContacted +
                    '" WHERE college_id = "' +
                    schoolData.collegeId +
                    '" and student_id="' +
                    schoolData.studentId +
                    '"';
                }
                //console.log("uQ",updateQuery);
                mysqlService.query(updateQuery).then(
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

  function checkVeteranSavedSchool(sid, cid) {
    return new Promise(function (resolve, reject) {
      let updateQuery =
        'Select count(id) as total from users_saved_colleges WHERE college_id = "' +
        cid +
        '" and student_id="' +
        sid +
        '"';
      // console.log("gQ",updateQuery);
      mysqlService.query(updateQuery).then(
        function (response) {
          resolve(response);
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

  function getContactInfoMatched(sid, cid) {
    return new Promise(function (resolve, reject) {
      let updateQuery =
        'Select is_contacted,contacted_date from users_matched_colleges WHERE college_id = "' +
        cid +
        '" and student_id="' +
        sid +
        '"';
      //console.log("cQ",updateQuery);
      mysqlService.query(updateQuery).then(
        function (response) {
          resolve(response);
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

  function getDeleteSavedCollegeData(delData) {
    return new Promise(function (resolve, reject) {
      let updateQuery =
        'UPDATE `users_saved_colleges` SET  is_delete = "Yes" WHERE college_id = "' +
        delData.collegeId +
        '" and student_id="' +
        delData.studentId +
        '"';
      // console.log("gQ",updateQuery);
      mysqlService.query(updateQuery).then(
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

  async function getVeteranSavedSchoolList(studentId) {
    const { filters } = await getStudentfilterData(studentId);
    if (filters) {
      const [searchSchool, veteranSchoolList] = await Promise.all([
        collegeService.searchCollege(JSON.parse(filters)),
        veteranSavedSchoolList(studentId),
      ]);
      return savedCollegeWithFilterModel(
        searchSchool.collegelist,
        veteranSchoolList
      );
    } else {
      return veteranSavedSchoolList(studentId);
    }
  }

  function veteranSavedSchoolList(sid) {
    return new Promise(function (resolve, reject) {
      let selQuery =
        'Select usc.is_contacted,c.seo_name,c.college_alias,c.college_name,c.id,c.phone_required,c.contact_email from `users_saved_colleges` as usc left join colleges as c on usc.college_id=c.id WHERE usc.is_delete="No" and student_id="' +
        sid +
        '"';
      //console.log("gQ",selQuery);
      mysqlService.query(selQuery).then(
        function (response) {
          resolve(savedCollegeListModel(response));
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

  function getVeteranData(sid) {
    return new Promise(function (resolve, reject) {
      let getquery = `SELECT state FROM student_profile WHERE uuid = '${sid.studentid}'`;
      mysqlService.query(getquery).then(
        function (response) {
          resolve(response);
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

  function getUpdateSavedCollege(udata) {
    return new Promise(function (resolve, reject) {
      let condate = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      let updateMatchedQuery = `UPDATE users_matched_colleges SET is_contacted='yes', contacted_date = '${condate}' WHERE college_id = ${udata.collegeId} and student_id = '${udata.studentId}'`;
      let updateSavedQuery =
        "Update users_saved_colleges set is_contacted='Yes',contacted_date='" +
        condate +
        "' where college_id=" +
        udata.collegeId +
        " and student_id='" +
        udata.studentId +
        "'";
      let checkQuery = `SELECT EXISTS(SELECT * from users_matched_colleges WHERE college_id=${udata.collegeId} AND student_id= '${udata.studentId}') as umc, EXISTS(SELECT * from users_saved_colleges WHERE college_id=${udata.collegeId} AND student_id= '${udata.studentId}') as usc;`;
      mysqlService.query(checkQuery).then(
        function (response) {
          if (response[0].umc == 1 && response[0].usc == 1) {
            resolve(
              updateMatchedAndSaved(updateSavedQuery, updateMatchedQuery)
            );
          } else if (response[0].umc == 0 && response[0].usc == 1) {
            resolve(updateSaved(updateSavedQuery));
          } else if (response[0].umc == 1 && response[0].usc == 0) {
            resolve(updateMatch(updateMatchedQuery));
          } else {
            resolve('Success');
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
      // console.log("UU:",updateQuery);
    });
  }

  function updateMatchedAndSaved(squery, mquery) {
    return new Promise(function (resolve, reject) {
      mysqlService.query(mquery).then(
        function (mresponse) {
          mysqlService.query(squery).then(
            function (sresponse) {
              resolve('Success');
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

  function updateMatch(query) {
    return new Promise(function (resolve, reject) {
      mysqlService.query(query).then(
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

  function updateSaved(query) {
    return new Promise(function (resolve, reject) {
      mysqlService.query(query).then(
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

  function updateVeteranProgramMatcher(pdata) {
    return new Promise(function (resolve, reject) {
      let checkQuery =
        "select count(id) as total from searchdata where uuid='" +
        pdata.uuid +
        "'";
      mysqlService.query(checkQuery).then(
        function (response) {
          if (response[0].total == 0) {
            resolve('success');
          } else {
            let updateData = {
              education_goal: pdata.educationGoal,
              study_state: pdata.studyStates,
              military_branch: pdata.militaryBranch,
              enrollment_military_status: pdata.militaryStatus,
              bucket_id: pdata.bucketId,
              secondary_bucket_id: pdata.secondaryBucketIds,
            };

            mysqlService
              .query('UPDATE searchdata SET ? WHERE uuid = ?', [
                updateData,
                pdata.uuid,
              ])
              .then(
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

  function updateVeteranScholarshipData(sdata) {
    return new Promise(function (resolve, reject) {
      let checkQuery =
        "select count(id) as total from scholarship_data where student_id='" +
        sdata.uuid +
        "'";
      mysqlService.query(checkQuery).then(
        function (response) {
          if (response[0].total == 0) {
            resolve('success');
          } else {
            let updateData = {
              degree_level: sdata.educationGoal,
              study_states: sdata.studyState,
              branch_of_service: sdata.militaryBranch,
              service_status: sdata.militaryStatus,
              area_of_study: sdata.bucketId,
              area_of_focus: sdata.secondaryBucketId,
            };
            //console.log("DD:",updateData);
            mysqlService
              .query('UPDATE scholarship_data SET ? WHERE student_id = ?', [
                updateData,
                sdata.uuid,
              ])
              .then(
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

  function unsubscribeVeteranEmail(updatedata) {
    return new Promise(function (resolve, reject) {
      let checkQuery =
        "select count(id) as total from student_unsubscribe where student_id='" +
        updatedata.student_id +
        "' and unsubscribe_type='" +
        updatedata.unsubscribe_type +
        "'";
      mysqlService.query(checkQuery).then(
        function (response) {
          if (response[0].total == 0) {
            mysqlService
              .query('INSERT INTO student_unsubscribe SET ? ', updatedata)
              .then(
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
          } else {
            resolve('success');
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

  function unsubscribeVeteranScholarshipEmail(updatedata) {
    return new Promise(function (resolve, reject) {
      let checkQuery =
        "select count(id) as total from scholarship_unsubscribe where student_id='" +
        updatedata.student_id +
        "' and unsubscribe_type='" +
        updatedata.unsubscribe_type +
        "'";
      mysqlService.query(checkQuery).then(
        function (response) {
          if (response[0].total == 0) {
            mysqlService
              .query('INSERT INTO scholarship_unsubscribe SET ? ', updatedata)
              .then(
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
          } else {
            resolve('success');
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

  function veteranDataUpdate(updateData, userType) {
    return new Promise(function (resolve, reject) {
      let veteranData = {
        first_name: updateData.first_name,
        last_name: updateData.last_name,
        password: sha1(updateData.password),
        email: updateData.email,
        last_updated: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
      };
      updateStudentInfo(veteranData, 'students', updateData.uuid).then(
        function (vetereninfo) {
          if (vetereninfo == 'success') {
            getQuery =
              "select bucket_id from student_profile where uuid='" +
              updateData.uuid +
              "'";
            mysqlService.query(getQuery).then(
              function (bucketData) {
                let veteranProfileData = {};
                if (userType == 'careerrecon') {
                  veteranProfileData = {
                    state: updateData.state,
                    phone_number: updateData.phone_number,
                    military_status: updateData.military_status,
                    military_branch: updateData.military_branch,
                    military_rank: updateData.military_rank,
                    mos: updateData.mos,
                    available: updateData.available,
                    security_clearance: updateData.security_clearance,
                    mmb_level_id: updateData.mmb_level_id,
                    bucket_id: updateData.bucket_value,
                    career_id: updateData.career_id,
                    exp_year: updateData.year_experience,
                    desired_salary: updateData.desired_salary,
                    relocate: updateData.relocate,
                  };
                } else {
                  veteranProfileData = {
                    postal_code: updateData.postal_code,
                    phone_number: updateData.phone_number,
                    military_status: updateData.military_status,
                    military_branch: updateData.military_branch,
                    military_rank: updateData.military_rank,
                    mos: updateData.mos,
                    category_question: updateData.category_question,
                    benefit_question: updateData.benefit_question,
                  };
                }

                updateStudentInfo(
                  veteranProfileData,
                  'student_profile',
                  updateData.uuid
                ).then(
                  function (veteranprofile) {
                    if (veteranprofile == 'success') {
                      if (userType == 'careerrecon') {
                        if (
                          bucketData[0].bucket_id == updateData.bucket_value
                        ) {
                          resolve('success');
                        } else {
                          mysqlService
                            .query(
                              "Delete  from student_degree_relation where student_id='" +
                                updateData.uuid +
                                "'"
                            )
                            .then(
                              function (delresponse) {
                                let bucketData = {
                                  bucket_value: updateData.bucket_value,
                                };
                                processBucketData(
                                  bucketData,
                                  updateData.uuid
                                ).then(
                                  function (bresponse) {
                                    resolve('success');
                                  },
                                  function (err) {
                                    if (err) {
                                      let error = stringUtil.errorStatus(err);
                                      return reject(error);
                                    }
                                  }
                                );
                              },
                              function (err) {
                                if (err) {
                                  let error = stringUtil.errorStatus(err);
                                  return reject(error);
                                }
                              }
                            );
                        }
                      } else {
                        resolve('success');
                      }
                    }
                  },
                  function (err) {
                    if (err) {
                      let error = stringUtil.errorStatus(err);
                      return reject(error);
                    }
                  }
                );
              },
              function (err) {
                if (err) {
                  let error = stringUtil.errorStatus(err);
                  return reject(error);
                }
              }
            );
          }
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

  function updateStudentInfo(updateData, dbName, studentId) {
    return new Promise(function (resolve, reject) {
      mysqlService
        .query('UPDATE ' + dbName + ' SET ? WHERE uuid = ?', [
          updateData,
          studentId,
        ])
        .then(
          function (response1) {
            resolve('success');
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

  function processBucketData(filters, uuid) {
    return new Promise(function (resolve, reject) {
      let checkqry = '';
      if (filters.area_focus_ids) {
        checkqry =
          'select major_id from bucket_secondary_degree_list where bucket_secondary_degree_id in (' +
          filters.area_focus_ids +
          ')';
      } else if (filters.bucket_value) {
        checkqry =
          'select major_id from bucket_secondary_degree_list where bucket_primary_degree_id =' +
          filters.bucket_value;
      }
      if (checkqry) {
        mysqlService
          .query(checkqry)
          .then((results) => {
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
            mysqlService.query(insertQuery).then(
              function (response1) {
                resolve('success');
              },
              function (err) {
                if (err) {
                  let error = stringUtil.errorStatus(err);
                  return reject(error);
                }
              }
            );
          })
          .catch((err) => {
            console.log('error', err);
            reject(new Error(err));
          });
      } else {
        resolve('success');
      }
    });
  }

  async function checkCareerreconUser(studentId) {
    let careerInfo = await executeQuery(
      "select id from filter_log where uuid='" + studentId + "'"
    );
    if (careerInfo[0] && careerInfo[0]['id']) {
      result = careerInfo[0]['id'];
    } else {
      let studentInfo = await executeQuery(
        "select primary_source from students where uuid='" + studentId + "'"
      );
      if (studentInfo[0]['primary_source'] == 'careerrecon') {
        result = 'yes';
      } else {
        result = 'no';
      }
    }
    return result;
  }

  function executeQuery(sqlQuery) {
    return new Promise(function (resolve, reject) {
      mysqlService.query(sqlQuery).then(
        function (response) {
          resolve(response);
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

  async function getVeteransStats(email) {
    const student = await findOne(DB_TABLE.STUDENT, { email }, ['uuid']);
    if (!student || !student.length) {
      return 'fail';
    } else {
      const uuid = student[0].uuid;
      const studentInfo = await getStudentProfile(uuid);
      const favouriteInfo = await getFavoritedColleges(uuid);
      const messageInfo = await getVeteranReplyReceived(uuid);
      const statsData = {
        studentId: uuid,
        firstName: studentInfo[0].firstName,
        lastName: studentInfo[0].lastName,
        email: email,
        imageURL: studentInfo[0].profileImage,
        militaryBranch: studentInfo[0].militaryBranchName,
        militaryRank: studentInfo[0].militaryRankName,
        profilePercentage: studentInfo[0].percentageComplete,
        collegeFavourite: favouriteInfo.favoriteCollege,
        totalSearch: favouriteInfo.collegeSearch,
        collegeContacted: favouriteInfo.collegeContact,
        profileView: favouriteInfo.collegeView,
        messageReceived: messageInfo.veteranreplyreceived,
      };
      return statsData;
    }
  }

  const updateStudent = (userData, studentId) => {
    const student = mapDataToTableField(userData, STUDENT_MAP);
    const studentProfile = mapDataToTableField(userData, STUDENT_PROFILE_MAP);
    const updateQueries = [];
    if (!isObjectEmpty(student))
      updateQueries.push(
        mysqlService.query(`UPDATE students SET ? WHERE uuid = ?`, [
          mapDataToTableField(userData, STUDENT_MAP),
          studentId,
        ])
      );
    if (!isObjectEmpty(studentProfile))
      updateQueries.push(
        mysqlService.query(`UPDATE student_profile SET ? WHERE uuid = ?`, [
          mapDataToTableField(userData, STUDENT_PROFILE_MAP),
          studentId,
        ])
      );
    if (!updateQueries.length)
      throw new Error(
        'Body does not comtain valid student or student profile properties!'
      );
    return Promise.all(updateQueries);
  };

  const getBannerInfo = async (studentId) => {
    const [[bannerInfo], [studentProfile]] = await Promise.all([
      mysqlService.query(
        `SELECT (SELECT count(id) FROM users_matched_colleges WHERE student_id = s.uuid) as matchedSchools,(SELECT count(id) FROM user_matched_scholarship WHERE student_id = s.uuid) as followedScholarship, (SELECT count(id) from user_matched_scholarship where student_id = s.uuid) as scholarships,CONCAT(s.first_name, ' ', s.last_name) as name, (SELECT branch_short_name FROM branches WHERE id = sp.military_branch) as branchName, (SELECT rank_short_name FROM ranks WHERE id = sp.military_rank) as rankName from students s join student_profile sp on s.uuid = sp.uuid WHERE s.uuid = '${studentId}';`
      ),
      getStudentProfile(studentId),
    ]);
    return {
      ...bannerInfo,
      ...studentProfile,
    };
  };

  const updateVeteranMilitaryInfo = async (
    {
      militaryBranch,
      militaryRank,
      militaryStatus,
      serviceStartDate,
      serviceEndDate,
      militaryAwards,
      vaDisabilityRating,
      militaryMos,
    },
    studentId
  ) => {
    const [militaryAwards1, militaryAwards2, militaryAwards3] = militaryAwards
      ? militaryAwards
      : '';
    const query = `UPDATE student_profile SET military_branch = '${militaryBranch}', military_rank = '${militaryRank}', military_status = '${militaryStatus}', mos = '${militaryMos}', service_start_date = ${
      serviceStartDate ? `'${serviceStartDate}'` : null
    }, service_end_date = ${
      serviceEndDate ? `'${serviceEndDate}'` : null
    }, military_awards = '${
      militaryAwards
        ? militaryAwards.map((award) => award.awardId).join(',')
        : ''
    }', va_disability_rating =  '${
      vaDisabilityRating ? `${vaDisabilityRating}` : 0
    }', military_awards_1 = ${
      militaryAwards1 ? `'${militaryAwards1.awardId}'` : null
    }, military_awards_2 = ${
      militaryAwards2 ? `'${militaryAwards2.awardId}'` : null
    }, military_awards_3 = ${
      militaryAwards3 ? `'${militaryAwards3.awardId}'` : null
    } WHERE uuid = '${studentId}'
    `;
    return mysqlService.query(query);
  };

  const updateVeteranEducationInfo = async (
    {
      highestLevelCompleted,
      collegeAttended,
      creditsEarned,
      gpa,
      actScore,
      satScore,
      degrees,
      bucketId,
      secBucketId,
    },
    studentId
  ) => {
    const [
      academicInterest1,
      academicInterest2,
      academicInterest3,
      academicInterest4,
      academicInterest5,
    ] = degrees;
    return mysqlService.query(`
      UPDATE student_profile SET highest_level_completed = '${highestLevelCompleted}', sat_score = '${satScore}', act_score = ${actScore}, gpa = ${gpa}, credits_earned = ${creditsEarned}, schools_attended = '${
      collegeAttended && collegeAttended.length
        ? collegeAttended.map((school) => school.id).join(',')
        : ''
    }', bucket_id = '${bucketId}', secondary_bucket_id = '${secBucketId}', academic_interest_1 = ${
      academicInterest1 ? `'${academicInterest1.id}'` : null
    }, academic_interest_2 = ${
      academicInterest2 ? `'${academicInterest2.id}'` : null
    }, academic_interest_3 = ${
      academicInterest3 ? `'${academicInterest3.id}'` : null
    }, academic_interest_4 = ${
      academicInterest4 ? `'${academicInterest4.id}'` : null
    }, academic_interest_5 = ${
      academicInterest5 ? `'${academicInterest5.id}'` : null
    } WHERE uuid = '${studentId}'
    `);
  };

  const updateStudentPhone = async (updateData) => {
    return mysqlService.query(
      `UPDATE student_profile SET phone_number='${updateData.phone}' WHERE uuid = '${updateData.studentId}'`
    );
  };

  async function getUserPhoneInfo(studentId) {
    let phoneInfo = await executeQuery(
      "select phone_number from student_profile where uuid='" + studentId + "'"
    );
    return phoneInfo[0]['phone_number'];
  }

  const sentRequestInfoEmail = async (emailData)=> {
    let collegeInfo = await executeQuery("select cc.college_name,cc.access_level,cc.college_alias,cc.phone_number,cc.contact_email,cc.website,cp.veteran_affairs_phone,cp.veteran_affairs_email,cp.veteran_affairs_website,cp.college_logo from colleges as cc left join college_profiles as cp on cc.id=cp.college_id where cc.id="+emailData.collegeId);
    const featuredSchool = await collegeService.getBounceBackAdvertise(emailData.state);
    let emailTemplate = await getRequestInfoEmailTemplate(emailData, collegeInfo[0], featuredSchool);
    const from = "CollegeRecon <"+emailConstant.INFORMATION_EMAIL+">";
		const to = [emailData.email];
    const subject = "Confirming your information request";
    const messageContent = messageEmail.basicReplyEmailTemplate(emailTemplate);
    //console.log("TT:",messageContent)
    await emailService.sendEmail(from,to,subject,messageContent);
    let requestData = {
      email_id: emailData.studentId,
      email_type: "student",
      rule_type: "requestinfo",
      rule_data: "sent"
    }
    await mysqlService.query("INSERT INTO cronjob_email_log SET ?", requestData);
    return "success";
  }

  async function getRequestInfoEmailTemplate(emailData, collegeInfo, featuredSchool) {
    const profileUrl = config.DOMAIN_URL+"/login?uid=" + emailData.studentId;
    const unsubscribeId = messageEncryption.encodeBase64("uid:"+emailData.studentId+"&type:request_info");
		const unsubscribeUrl = config.DOMAIN_URL+"/email/unsubscribe/"+unsubscribeId;
    const collegeUrl = config.DOMAIN_URL+"/"+collegeInfo.college_alias;
    const collegeLogo = config.AWS_IMAGE_RESOURCE_COLLEGE+collegeInfo.college_logo;
    const cwebsite = (collegeInfo.website.indexOf('http') !== -1 || collegeInfo.website.indexOf('https://') !== -1) ? (collegeInfo.website.trim()) : 'http://' + collegeInfo.website;
    const vetWebsite = (collegeInfo.veteran_affairs_website.indexOf('http') !== -1 || collegeInfo.veteran_affairs_website.indexOf('https://') !== -1) ? collegeInfo.veteran_affairs_website : 'http://' + collegeInfo.veteran_affairs_website;
    let emailContent = "";
   
    const headerSection = messageEmail.emailHeaderSection();
    emailContent+= headerSection;
    emailContent += '<p>Dear '+emailData.studentName+',</p>';
    emailContent += '<h3 style="text-align:left;font-weight:normal;">';
    emailContent += '<p>Thank you for registering with CollegeRecon. The school(s) you requested info about appear below.</p><p>Please review their <a href="'+profileUrl+'">profile</a> as they assign a team member to get back to you. Schools will generally get back to you within 24 to 48 hours.</p> <p>If you want to talk to someone sooner, a school member can assist you if you contact them immediately. Their contact info appears below. It’s a great idea to talk to the school to get your questions answered.  There is no obligation for you to apply.</p></h3>';
    emailContent += '<div style="margin-top: 2.5rem;"><h2 style="display:inline-block;width:82%; margin: 0;padding: 10px 0px 20px 0px;">Featured Schools</h2><table width="100%" align="left" class="college-ad table-collapse" style="background-color: #f5f5f5;clear: both; padding:.5rem;margin-bottom: 24px;">';
		emailContent += `<thead></thead><tbody>`;
    const featureSchool = [];
		for (let adSchool of featuredSchool.slice(0,2)) {
			featureSchool.push(adSchool)
			let tadvLink = config.DOMAIN_URL+"/"+adSchool.collegeAlias+'?'+emailConstant.FEATURE_SCHOOL_TRACKER;
			emailContent += '<tr ><td width="10%" style="text-align: left;padding-bottom: 10px;"><a href="'+tadvLink+'"><span><img src="' + adSchool.collegeLogo + '" width="80px"/></span></a></td>';
			emailContent += '<td style="text-align: left;padding-bottom: 10px;"><a href="'+tadvLink+'" style="color:#333333;text-decoration:none;"><span style="display:block;font-weight: bold;">' + adSchool.college_name + '</span></a>';
			emailContent += `<span style="display:block; font-size: 0.8rem">${adSchool.collegeDesc}</span></td></tr>`
		}
		emailContent += '</tbody></table></div><!-- ad college -->';
    emailContent += '<div style="padding-top: 1rem;"><h2 style="display:inline-block;width:82%; margin: 0;padding: 10px 0px 20px 0px;">Request Info School</h2><table width="100%" align="left" class="college-ad" style="clear: both; margin-bottom: 10px;"></tbody><tr><td width="10%" style="text-align: center;"><a href="'+collegeUrl+'"><span><img src="'+collegeLogo+'" width="80px"/></span></a></td>';
    emailContent += '<td style="text-align: left;"><a href="'+collegeUrl+'" style="color:#333333;text-decoration:none;"><span style="display:block;font-weight: bold;">'+collegeInfo.college_name+'</span></a>';
    if(collegeInfo.access_level == 'Patriot'){
      emailContent += '<p style="font-size:12px"><b>Admission Info</b> <br> Phone : <a href="tel:'+collegeInfo.phone_number+'">'+collegeInfo.phone_number+'</a> <br> Email : <a href="mailto:'+collegeInfo.contact_email+'">'+collegeInfo.contact_email+'</a> <br><a href="'+cwebsite+'">College Website</a></p>';
      emailContent += '<p style="font-size:12px"><b>Veteran Affairs Info:</b><br> Phone : <a href="tel:'+collegeInfo.veteran_affairs_phone+'">'+collegeInfo.veteran_affairs_phone+'</a> <br> Email : <a href="mailto:'+collegeInfo.veteran_affairs_email+'">'+collegeInfo.veteran_affairs_email+'</a> <br><a href="'+vetWebsite+'">Veteran Affairs Website</a></p>';
    }else{
      let collegeEmailData = collegeInfo.contact_email.split('@');
      let vetEmailData = collegeInfo.veteran_affairs_email.split('@');
      emailContent += '<p style="font-size:12px"><b>Admission Info</b> <br> Email : '+collegeEmailData[0].slice(0, 1)+'#####@'+collegeEmailData[1]+'<br><a href="'+cwebsite+'">College Website</a></p>';
      emailContent += '<p style="font-size:12px"><b>Veteran Affairs Info:</b> <br> Email : '+vetEmailData[0].slice(0, 1)+'#####@'+vetEmailData[1]+'<br><a href="'+vetWebsite+'">Veteran Affairs Website</a></p>';
    }
    emailContent += '</td></tr></tbody></table></div>';
    emailContent += '<p>Sincerely,</p><p>CollegeRecon</p>';
    emailContent += '<div class="unsubscribe"><span><a href="'+unsubscribeUrl+'">Unsubscribe</a> to no longer receive Request Info emails</span></div>';
    emailContent += '</div></body></html>';
    return emailContent;
  }

  const updateVeteranDisability = async (updateData) => {
    return mysqlService.query(
      `UPDATE student_profile SET va_disability_rating='${updateData.disabilityRate}' WHERE uuid = '${updateData.studentId}'`
    );
  };

  const getMilitaryInfoData = async (studentId) => {
    let checkExist = await mysqlService.query("select count(id) as total from students where uuid='"+studentId+"'");
    if(checkExist[0].total > 0){
      const studentInfo = await getStudentProfile(studentId);
      const claimData = {
        studentId: studentId,
        firstName: studentInfo[0].firstName,
        lastName: studentInfo[0].lastName,
        email: studentInfo[0].email,
        dob: studentInfo[0].dob,
        Phone: studentInfo[0].phoneNumber,
        militaryBranch: studentInfo[0].militaryBranch,
        militaryStatus: studentInfo[0].militaryStatus,
        city: studentInfo[0].city,
        state: studentInfo[0].state,
        postalCode: studentInfo[0].postalCode
      };
      return claimData;
    }else{
      return "fail";
    }
  }

  return {
    getStudentProfile: getStudentProfile,
    getStudentMessageData: getStudentMessageData,
    imageUpdate: imageUpdate,
    updatePersonalInfoName: updatePersonalInfoName,
    updatePersonalInfo: updatePersonalInfo,
    updateAcademicInfo: updateAcademicInfo,
    updateMilitaryInfo: updateMilitaryInfo,
    jstTranscriptFileUpdate: jstTranscriptFileUpdate,
    jstTranscriptFileDelete: jstTranscriptFileDelete,
    favoutiteCollege: favoutiteCollege,
    unfavoutiteCollege: unfavoutiteCollege,
    checkfavoutiteCollege: checkfavoutiteCollege,
    getVeteranProfileView: getVeteranProfileView,
    getVeteranFavouritelist: getVeteranFavouritelist,
    getSaveRegisterMatchCollege: getSaveRegisterMatchCollege,
    getUpdateRegisterMatchCollege: getUpdateRegisterMatchCollege,
    getMatchedCollegeList: getMatchedCollegeList,
    getCalculateMatchedPercent: getCalculateMatchedPercent,
    checkVeteransExist: checkVeteransExist,
    getVeteransMajorList: getVeteransMajorList,
    getVeteransBucketInfo: getVeteransBucketInfo,
    getMatchedCollegeInfo: getMatchedCollegeInfo,
    getVeteransSearchData: getVeteransSearchData,
    updatefilterdata: updatefilterdata,
    getStudentfilterData: getStudentfilterData,
    deleteMatchedSchools: deleteMatchedSchools,
    getVeteransMessagetoCollege: getVeteransMessagetoCollege,
    getVeteransSecondaryBucketInfo: getVeteransSecondaryBucketInfo,
    getSaveVeteranSchool: getSaveVeteranSchool,
    getDeleteSavedCollegeData: getDeleteSavedCollegeData,
    getVeteranSavedSchoolList: getVeteranSavedSchoolList,
    emptyFilters: emptyFilters,
    getVeteranData: getVeteranData,
    getUpdateSavedCollege: getUpdateSavedCollege,
    updateVeteranProgramMatcher: updateVeteranProgramMatcher,
    updateVeteranScholarshipData: updateVeteranScholarshipData,
    unsubscribeVeteranEmail: unsubscribeVeteranEmail,
    unsubscribeVeteranScholarshipEmail: unsubscribeVeteranScholarshipEmail,
    veteranDataUpdate: veteranDataUpdate,
    checkCareerreconUser: checkCareerreconUser,
    getVeteransStats: getVeteransStats,
    updateStudent,
    getBannerInfo,
    updateVeteranMilitaryInfo,
    updateVeteranEducationInfo,
    getVeteranAwards,
    getVeteranAttendedSchools,
    getVeteranDegreeInterestList,
    updateStudentPhone,
    getUserPhoneInfo: getUserPhoneInfo,
    sentRequestInfoEmail,
    updateVeteranDisability,
    getMilitaryInfoData,
  };
})();

module.exports = studentService;
