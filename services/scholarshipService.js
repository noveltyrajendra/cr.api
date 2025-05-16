let scholarshipService = (function () {
  const config = require("../config");
  const mysqlService = require("./mysqlService");
  const emailService = require("./emailService");
  const sha1 = require("sha1");
  const stringUtil = require("../utils/stringUtil");
  const messageEmail = require("../utils/messageEmail");
  const { errorHandler } = require("../utils/errorHandler");
  const emailConstant = require("../constants/emailConstant");
  const searchConstant = require("../constants/searchConstant");
  const authenicateConstant = require("../constants/authenicateConstant");
  const moment = require("moment");
  const manageonlinequeryBuilder = require("./searchService");
  const scholarshipResultModel = require("../models/scholarshipResultModel");
  const base64Utility = require('../utils/base64Utility');

  function addScholarship(scholarship) {
    return new Promise(function (resolve, reject) {
      let addqry = "INSERT INTO scholarship_data SET ? ";
      mysqlService.query(addqry, scholarship)
        .then((results) => {
          if (results["affectedRows"] == 1) {
            getMatchingScholarship(scholarship).then(function (response) {
              if(response.length > 0) {
                addUserMatchScholarship(scholarship.student_id ,response).then( function (sresponse) {
                  if(sresponse == 'success') {
                    response.student_id = scholarship.student_id;
                    resolve(scholarshipResultModel(response))
                  }
                })
              } else {
                resolve(scholarshipResultModel(response))
              }
            }, function (err) {
              if (err) {
                var error = err;
                error.status = 503;
                return reject(error)
              };
            })
          } else {
            resolve("error");
          }
        }).catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function getMatchingScholarship(filters) {
    let student_dis = [];
    if(filters.student_disability){
      student_dis = filters.student_disability.split(',');
    }
    return new Promise(function (resolve, reject) {
      searchQuery = `SELECT DISTINCT(sl.id),sl.scholarship_name, sl.award, sl.recipients, sl.detail, sl.deadline from 
      scholarship_list as sl 
      JOIN scholarship_pivot_dataoption as sd ON sl.id=sd.scholarship_id 
      
      WHERE 
      1=1 `;
      if(filters.service_status){
        searchQuery += `AND 1=(CASE WHEN ${filters.service_status}=1 AND sl.check_military_status = 'yes' THEN 1
        WHEN sl.check_military_status = 'no' THEN 1 ELSE 0 END) `
      }
      
      if(filters.branch_of_service){
        searchQuery += `AND 1=(CASE WHEN ${filters.branch_of_service}=1 AND sl.check_military_branch = 'yes' THEN 1
        WHEN sl.check_military_branch  = 'no' THEN 1 ELSE 0 END) `
      }
      

      if(filters.student_disability && filters.student_disability.length>0) {
        searchQuery += ` AND 1=(CASE WHEN (`
          for(let i=0 ; i< student_dis.length; i++) {
            searchQuery += `${student_dis[i]}=1 OR `
            if(i == student_dis.length -1) {
              searchQuery = searchQuery.substring(0,searchQuery.length-3)
            }
          }
        searchQuery += `) AND sl.check_student_disability = 'yes' THEN 1
        WHEN sl.check_student_disability = 'no' THEN 1 ELSE 0 END) `
      }

      if(filters.degree_level){
        searchQuery += ` AND 1=(CASE WHEN ${filters.degree_level}=1 AND sl.check_academic_level = 'yes' THEN 1
        WHEN sl.check_academic_level = 'no' THEN 1 ELSE 0 END) `
      }
      
      if(filters.education_status){
        searchQuery += ` AND 1=(CASE WHEN ${filters.education_status}=1 AND sl.check_academic_status ='yes' THEN 1
        WHEN sl.check_academic_status = 'no' THEN 1 ELSE 0 END) `
      }

      if(filters.minority_background){
        searchQuery += ` AND 1=(CASE WHEN ${filters.minority_background}=1 AND sl.check_student_ethnic = 'yes' THEN 1
        WHEN sl.check_student_ethnic = 'no' THEN 1 ELSE 0 END) `
      }

      searchQuery += ` AND 1=(CASE WHEN (SELECT countMatchingElements(sl.bucket_id,'${filters.area_of_study}')) = 1 THEN 1 WHEN sl.check_degree_specific = 'no' THEN 1 ELSE 0 END  ) `

      if(filters.area_of_focus){
        searchQuery += ` AND 1=(CASE WHEN (SELECT countMatchingElements(sl.degree_id,'${filters.area_of_focus}')) = 1 THEN 1 WHEN sl.check_degree_specific = 'no' THEN 1 ELSE 0 END  ) AND  sl.status='active'`
      }
      
      //console.log("SS", searchQuery)
      mysqlService.query(searchQuery)
        .then(function (qresponse) {
          resolve(qresponse);
        }, function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        })
    });
  }

  function addUserMatchScholarship(id, scholarships) {
    return new Promise(function(resolve, reject) {
      insertQuery = "Insert into user_matched_scholarship (student_id,scholarship_id) values ";
      for (let i = 0; i < scholarships.length; i++) {
        if (i == scholarships.length - 1) {
          insertQuery += "('" + id + "'," + scholarships[i].id + ");";
        } else {
          insertQuery += "('" + id + "'," + scholarships[i].id + "),";
        }
      }
      // console.log(insertQuery)
      mysqlService.query(insertQuery)
      .then(function (response) {
        resolve("success");
      }, function (err) {
        if (err) {
          var error = err;
          error.status = 503;
          return reject(error)
        };
      })
    })
  }

  function requestUserMatchScholarship(scholarshipIds) {
    return new Promise(function(resolve, reject) {
      updateQuery = `UPDATE user_matched_scholarship SET scholarship_requested = 'Yes' WHERE student_id='${scholarshipIds.student_id}' AND scholarship_id IN (${scholarshipIds.scholarship_ids})`;
      // console.log(updateQuery)
      mysqlService.query(updateQuery)
      .then(function (response) {
        resolve("success");
      }, function (err) {
        if (err) {
          var error = err;
          error.status = 503;
          return reject(error)
        };
      })
    })
  }

  function getScholarshipListByVeterans(studentid) {
    return new Promise(function(resolve, reject) {
      checkQuery = "select primary_source from students where uuid='"+studentid+"'";
      mysqlService.query(checkQuery)
      .then(function (response) {
        if(response[0].primary_source == 'scholarshipfinder'){
          selQuery = "select sl.*,ums.scholarship_requested from user_matched_scholarship as ums left join scholarship_list as sl on ums.scholarship_id=sl.id where ums.student_id='"+studentid+"'";
          // console.log(updateQuery)
          mysqlService.query(selQuery)
          .then(function (response1) {
            resolve(scholarshipResultModel(response1))
          }, function (err) {
            if (err) {
              var error = err;
              error.status = 503;
              return reject(error)
            };
          })
        }else{
          resolve("normalusers");
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

  function unfollowScholarship(sid,lid) {
    return new Promise(function(resolve, reject) {
      updateQuery = `UPDATE user_matched_scholarship SET scholarship_requested = 'No' WHERE student_id='${sid}' AND scholarship_id = ${lid}`;
      // console.log(updateQuery)
      mysqlService.query(updateQuery)
      .then(function (response) {
        resolve("success");
      }, function (err) {
        if (err) {
          var error = err;
          error.status = 503;
          return reject(error)
        };
      })
    })
  }

  function scholarshipUserinfo(studentid) {
    return new Promise(function(resolve, reject) {
      updateQuery =  "select sd.*,s.first_name,s.last_name from scholarship_data as sd left join students as s on sd.student_id=s.uuid where student_id='"+studentid+"'";
      //console.log(updateQuery)
      mysqlService.query(updateQuery)
      .then(function (response) {
        if(response.length > 0){
          resolve(response);
        }else{
          resolve("nodata");
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

  function scholarshipEmailRegistration(sdata){
    return new Promise(function(resolve, reject) {
      let unsubscribeId = base64Utility.encodeBase64("sid:"+sdata.studentId+"&type:followup");
		  let unsubscribeUrl = config.DOMAIN_URL+"/email/unsubscribe/"+unsubscribeId;
      let emailcontent = "";
      let subject = "";
      let requestValue = "";
      if(sdata.type == "follow"){
        subject = "Important information on scholarships you requested";
        emailcontent = "<div style='text-align:center;'><span><img src='https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png' width='150px' /></span></div><p>Thank you for joining CollegeRecon.  Here are the scholarships you are following.  You will be alerted about upcoming deadlines and any new matching scholarships that become available.</p>";
        requestValue = "Yes";
      }else{
        emailcontent = "<div style='text-align:center;'><span><img src='https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png' width='150px' /></span></div><p>Thank you for joining CollegeRecon.  Here are your matching scholarships.  You can select to FOLLOW certain scholarships to be reminded of important deadlines.  You will be alerted about any new matching scholarships that become available.</p>"
        subject = "Matching scholarship info you requested";
        requestValue = "No";
      }
      selQuery =  "select sl.id,sl.scholarship_name from user_matched_scholarship as uu left join scholarship_list as sl on uu.scholarship_id=sl.id where uu.scholarship_requested='"+requestValue+"' and uu.student_id='"+sdata.studentId+"'";
      //console.log(selQuery)
      mysqlService.query(selQuery)
      .then(function (response) {
        emailcontent+="<ul>";
        for (let i = 0; i < response.length; i++) {
          let params = base64Utility.encodeBase64(sdata.studentId + "#" + response[i].id);
          let scholarUrl = config.DOMAIN_URL + "/login?scholarship=" + params;
          emailcontent+="<li><a href='"+scholarUrl+"'>"+response[i].scholarship_name+"</a></li>";
        }
        emailcontent+="</ul>";
        emailcontent+="<p>Team CollegeRecon</p>";
        emailcontent+="<p style='text-align:center;font-size:12px;'><i><a href='"+unsubscribeUrl+"' target='_blank'>Unsubscribe</a> to no longer receive scholarship emails</i></p>";
        let message = messageEmail.basicReplyEmailTemplate(emailcontent);
        //let to = ['shivaram@noveltytechnology.com'];
        let to = [sdata.email];
        let from = "CollegeRecon <"+emailConstant.INFORMATION_EMAIL+">";
        emailService.sendEmail(from, to, subject, message).then(function (eresponse) {
          resolve(eresponse);
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
      })
    });
  }

  function getScholarshipDetailInfo(studentid) {
    return mysqlService.query(
      `SELECT sl.id,sl.scholarship_name,um.scholarship_requested as follow,sl.recipients,sl.award,sl.detail,sl.check_military_branch,sl.check_military_status,sl.check_student_ethnic,sl.check_student_disability,sl.check_academic_status, sl.check_academic_level,sl.check_degree_specific,(SELECT GROUP_CONCAT(title) FROM bucket_degree WHERE id IN(sl.bucket_id)) as bucketname,(SELECT GROUP_CONCAT(title) FROM bucket_secondary_degree WHERE id IN(sl.degree_id)) as secondaryname,(if(sl.open_date_format = "mm/yyyy",MONTHNAME(sl.opendate),DATE_FORMAT(sl.opendate,"%d %M"))) as opendate,(if(sl.date_format = "mm/yyyy",MONTHNAME(sl.deadlinedate),DATE_FORMAT(sl.deadlinedate,"%d %M"))) as deadlinedate, sl.deadlinedate as deadline, sl.website,sl.recurring_event,sd.* FROM user_matched_scholarship as um LEFT JOIN scholarship_list as sl ON um.scholarship_id=sl.id LEFT JOIN scholarship_pivot_dataoption sd ON um.scholarship_id=sd.scholarship_id WHERE sl.status="active" and um.student_id="${studentid}" ORDER BY CURRENT_DATE`
    );
  }

  function scholarshipReportLists(studentid) {
		return new Promise(function (resolve, reject) {
			let selQuery = "select scholarship_id from scholarship_report where report_status='yes' and student_id='"+studentid+"'";
			mysqlService.query(selQuery)
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

  function scholarshipReportEmail(rdata){
    return new Promise(function(resolve, reject) {
      let chkQuery = "select id from scholarship_report where scholarship_id="+rdata.scholarshipId+" and student_id='"+rdata.studentId+"'";
      mysqlService.query(chkQuery)
				.then(function (response) {
						if(response.length > 0){
              sendScholarshipEmailReport(rdata)
              .then(function (response1) {
                resolve("success");
              }, function (err) {
                if (err) {
                  var error = err;
                  error.status = 503;
                  return reject(error)
                };
              })
            }else{
              let insertQuery = "Insert into scholarship_report (student_id,scholarship_id,report_status) values ('" + rdata.studentId + "'," + rdata.scholarshipId + ",'yes');";
              mysqlService.query(insertQuery)
                .then(function (response1) {
                  sendScholarshipEmailReport(rdata)
                  .then(function (response1) {
                    resolve("success");
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

  function sendScholarshipEmailReport(rdata){
    return new Promise(function(resolve, reject) {
      let emailcontent = "";
      let subject = "Scholarships report from '"+rdata.studentName+"'";
      emailcontent+="<p>A user has indicated that there is an issue with the following scholarship -<p>";
      emailcontent+="<ul>"
      emailcontent+="<li>"+rdata.scholarshipName+"</li>";
      emailcontent+="</ul>";
      emailcontent+="<p>Team CollegeRecon</p>";
      let message = messageEmail.basicReplyEmailTemplate(emailcontent);
      let to = ['information@hfalliance.com'];
      //let to = ['shivaram@noveltytechnology.com'];
      let from = "CollegeRecon <"+emailConstant.INFORMATION_EMAIL+">";
      emailService.sendEmail(from, to, subject, message).then(function (eresponse) {
        resolve(eresponse);
      }, function (err) {
        if (err) {
          var error = err;
          error.status = 503;
          return reject(error)
        };
      });
    });
  }

  function newScholarshipNotificationEmail(sdata){
    return new Promise(function(resolve, reject) {
      getMatchedVeteranList(sdata)
        .then(function (response) {
          if(response.length > 0){
            for (let i = 0; i < response.length; i++) {
              //send email functionality
              let unsubscribeId = base64Utility.encodeBase64("sid:"+response[i].student_id+"&type:new");
		          let unsubscribeUrl = config.DOMAIN_URL+"/email/unsubscribe/"+unsubscribeId;
              let profileUrl = config.DOMAIN_URL+"/login?uid="+response[i].student_id;
              let emailcontent = "";
              let subject = "Important scholarship matching update";
              emailcontent+="<p>A new scholarship is available that is a match for you! <p>";
              emailcontent+="<ul>"
              emailcontent+="<li>"+sdata.scholarshipName+"</li>";
              emailcontent+="</ul>";
              emailcontent+="<p>You can also view your matching scholarships and those that you’ve followed in your <a href='"+profileUrl+"'>profile</a>.<p>";
              emailcontent+="<p>Thanks,<br>Team CollegeRecon</p>";
              emailcontent+="<p style='text-align:center;font-size:12px;'><i><a href='"+unsubscribeUrl+"' target='_blank'>Unsubscribe</a> to no longer receive scholarship emails</i></p>";
              let message = messageEmail.basicReplyEmailTemplate(emailcontent);
              let to = [response[i].email];
              //console.log("EE:",response[i].email);
              //let to = ['shivaram@noveltytechnology.com'];
              let from = "CollegeRecon <"+emailConstant.INFORMATION_EMAIL+">";
              emailService.sendEmail(from, to, subject, message).then(function (eresponse) {
                //resolve(eresponse);
                if(eresponse == "success"){
                  let scholarData = {
                    student_id: response[i].student_id,
                    scholarship_id: sdata.id,
                    action : sdata.emailaction
                  }
                  saveQuery = `INSERT INTO scholarship_matched_email SET ?`;
                  mysqlService.query(saveQuery,scholarData)
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
              });
            }
          }else{
            resolve("success");
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

  function getMatchedVeteranList(sdata){
    return new Promise(function(resolve, reject) {
      //console.log("SS:",sdata);
      let listQry = "select student_id,email from scholarship_data as sd LEFT JOIN students as ss ON sd.student_id=ss.uuid WHERE ss.user_account_status='active' ";
      // For Student Minority Background
      if(sdata.checkStudentEthnic == "yes"){
        listQry += " and (";
        let studentEthnic = "";
        for(let i=0;i<sdata.studentEthnic.length;i++){
          if(sdata.studentEthnic[i].val == 1){
            studentEthnic += "minority_background = '"+sdata.studentEthnic[i].name+"' OR ";
          }
        }
        listQry += studentEthnic.slice(0,-3);
        listQry += ") ";
      }
      // For Student Disablility
      if(sdata.checkStudentDisability == "yes"){
        let stuDis = "";
        for(let i=0;i<sdata.studentDisability.length;i++){
          if(sdata.studentDisability[i].val == 1){
            stuDis += sdata.studentDisability[i].name+",";
          }
        }
        listQry += " and 1=(countMatchingElements(student_disability,'"+stuDis.slice(0,-1)+"'))";
      }
      // For Military Branch
      if(sdata.checkMilitaryBranch == "yes"){
        listQry += " and (";
        let militaryBranch = "";
        for(let i=0;i<sdata.militaryBranch.length;i++){
          if(sdata.militaryBranch[i].val == 1){
            militaryBranch += "branch_of_service = '"+sdata.militaryBranch[i].name+"' OR ";
          }
        }
        listQry += militaryBranch.slice(0,-3);
        listQry += ") ";
      }
      // For Military Status
      if(sdata.checkMilitaryStatus == "yes"){
        listQry += " and (";
        let checkMs = "";
        if(sdata.militaryStatus[0].val == 1){
          checkMs += " OR service_status = 'military_status_ams' ";
        }
        if(sdata.militaryStatus[1].val == 1){
          checkMs += " OR service_status = 'military_status_veteran'";
        }
        if(sdata.militaryStatus[2].val == 1){
          checkMs += " OR service_status = 'military_status_ds'";
        }
        if(sdata.militaryStatus[3].val == 1){
          checkMs += " OR service_status = 'military_status_ng'";
        }
        if(sdata.militaryStatus[4].val == 1){
          checkMs += " OR service_status = 'military_status_reserve'";
        }
        if(sdata.militaryStatus[5].val == 1){
          checkMs += " OR service_status = 'military_status_retiree'";
        }
        if(sdata.militaryStatus[6].val == 1){
          checkMs += " OR service_status = 'military_status_dependent'";
        }
        if(sdata.militaryStatus[12].val == 1){
          checkMs += " OR service_status = 'military_status_spouse'";
        }
        if(sdata.militaryStatus[18].val == 1){
          checkMs += " OR service_status = 'military_status_dov'";
        }
        listQry += checkMs.slice(3);
        listQry += ") ";
      }
      // For Academic Level
      if(sdata.checkAcademicLevel == "yes"){
        listQry += " and (";
        let academicLevel = "";
        for(let i=0;i<sdata.academicLevel.length;i++){
          if(sdata.academicLevel[i].val == 1){
            academicLevel += "degree_level = '"+sdata.academicLevel[i].name+"' OR ";
          }
        }
        listQry += academicLevel.slice(0,-3);
        listQry += ") ";
      }
      // For Academic Status
      if(sdata.checkAcademicStatus == "yes"){
        listQry += " and (";
        let academicStatus = "";
        for(let i=0;i<sdata.academicStatus.length;i++){
          if(sdata.academicStatus[i].val == 1){
            academicStatus += "education_status = '"+sdata.academicStatus[i].name+"' OR ";
          }
        }
        listQry += academicStatus.slice(0,-3);
        listQry += ") ";
      }
      // For Sex
      let gender = "";
      for(let i=0;i<sdata.sex.length;i++){
        if(sdata.sex[i].val == 1){
          gender += "sex = '"+sdata.sex[i].name+"' OR ";
        }
      }
      if(gender != ""){
        listQry += " and (";
        listQry += gender.slice(0,-3);
        listQry += ") ";
      }
      // For Degree level
      if(sdata.checkDegreeSpecific == "yes"){
        if(sdata.bucket_id && sdata.bucket_id != 0){
          listQry += " and 1=(countMatchingElements(area_of_study,'"+sdata.bucket_id+"'))";
        }
        if(sdata.degreeId){
          listQry += " and 1=(countMatchingElements(area_of_focus,'"+sdata.degreeId+"'))";
        }
      }
      listQry += " and student_id not in (SELECT student_id from scholarship_unsubscribe where unsubscribe_type='new')";
      //console.log("QQ:",listQry);
      mysqlService.query(listQry)
				.then(function (response) {
						resolve(response);
				}, function (err) {
					if (err) {
						var error = err;
						error.status = 503;
						return reject(error)
					};
				});
    })
  }

  function scholarshipManagedate(){
    return new Promise(function(resolve, reject) {
      let listQuery = 'SELECT * from scholarship_list where status="active"';
      //console.log("LL:",listQuery);
			mysqlService.query(listQuery)
				.then(function (response) {
          //console.log("RR:",response);
					for(let i=0;i<response.length;i++){
            let dateOpen = "";
            let deadlineDate = "";
            let opendateFormat = "";
            let dd = response[i].deadline.split("/");
            //deadline Date
            if(dd.length == 2){
              let odays = getDaysInMonth(dd[0],dd[1]);
              deadlineDate = dd[1]+"-"+dd[0]+"-"+odays;
              opendateFormat = "mm/yyyy";
            }else{
              deadlineDate = dd[2]+"-"+dd[0]+"-"+dd[1];
              opendateFormat = "mm/dd/yyyy";
            }

            //open Date
            /*dateOpen = getThirtyDaysEarlier(deadlineDate);
            let newOpenDate = dateOpen.split("-");
            if(dd.length == 2){
              openDateData = newOpenDate[1]+"/"+newOpenDate[0];
            }else{
              openDateData = newOpenDate[1]+"/"+newOpenDate[2]+"/"+newOpenDate[0];
            }*/
            //let updateQry = "UPDATE live_scholarship_list SET deadlinedate='"+deadlineDate+"', open_date_format='"+opendateFormat+"', open_date='"+openDateData+"', opendate='"+dateOpen+"' WHERE id="+response[i].id;
            let updateQry = "UPDATE scholarship_list SET deadlinedate='"+deadlineDate+"' WHERE id="+response[i].id;
            //console.log("UU:",updateQry);
            //console.log("dedlineDate:",deadlineDate);
            //console.log("openDateFormat:",opendateFormat);
            //console.log("openDate:",openDateData);
            //console.log("dateOpen:",dateOpen);
            mysqlService.query(updateQry)
            .then(function (uresponse) {
                if(i== response.length-1){
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

  function getThirtyDaysEarlier(tt){
    var date = new Date(tt);
    var newdate = new Date(date);

    newdate.setDate(newdate.getDate() - 30);
    
    var dd = newdate.getDate();
    var mm = newdate.getMonth() + 1;
    var y = newdate.getFullYear();

    let month = "";
    if(mm < 10){
      month = "0"+mm;
    }else{
      month = mm;
    }

    let day = "";
    if(dd < 10){
      day = "0"+dd;
    }else{
      day = dd;
    }
    
    return y +'-'+ month + '-' + day ;
  }

  function getDaysInMonth(Month, Year) {
		return new Date((new Date(Year, Month, 1)) - 1).getDate();
  }
  
  function scholarshipCheckCollegeList(sdata) {
    return new Promise(function (resolve, reject) {
      let checkqry = "";
      if(sdata.type == 'scholar'){
        checkqry = "Select count(id) as total from scholarship_data where student_id='" + sdata.uuid + "' and study_states='" + sdata.studyStates + "'";
        if (sdata.secondaryBucketIds) {
          checkqry += " and area_of_focus ='" + sdata.secondaryBucketIds + "'";
        }
        checkqry += " and degree_level='" + sdata.degreeLevel + "' and area_of_study='" + sdata.bucketId+ "'";
      }else{
        // States
        let stateval = "";
        if (sdata.studyStates.indexOf(',') > -1) {
          let stateData = sdata.studyStates.split(',');
          stateval = stateData[0];
        }else{
          stateval = sdata.studyStates;
        }
        // Degree Level
        let levelval = "";
        if (sdata.educationGoal.indexOf(',') > -1) {
          let eduData = sdata.educationGoal.split(',');
          levelval = eduData[0];
        }else{
          levelval = sdata.educationGoal;
        }
        // Primary Bucket
        let primaryval = "";
        if (sdata.bucketId.indexOf(',') > -1) {
          let eduData = sdata.bucketId.split(',');
          primaryval = eduData[0];
        }else{
          primaryval = sdata.bucketId;
        }
        checkqry = "Select count(id) as total from student_profile where  uuid='" + sdata.uuid + "' and state='" + stateval + "'";
        if (sdata.secondaryBucketIds) {
          checkqry += " and secondary_bucket_id ='" + sdata.secondaryBucketIds + "'";
        }
        checkqry += " and level_id=" + levelval + " and bucket_id=" + primaryval;
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

  function scholarshipCheckScholarData(sdata) {
    return new Promise(function (resolve, reject) {
      let checkqry = "";
      checkqry = "Select count(id) as total from scholarship_data where  student_id='" + sdata.student_id + "' and study_states='" + sdata.study_states + "' and sex='" + sdata.sex + "' and minority_background='" + sdata.minority_background + "' and student_disability='" + sdata.student_disability + "' and branch_of_service='" + sdata.branch_of_service + "'  and education_status='" + sdata.education_status + "'";
        if (sdata.area_of_focus) {
          checkqry += " and area_of_focus ='" + sdata.area_of_focus + "'";
        }
        checkqry += " and degree_level='" + sdata.degree_level + "' and area_of_study='" + sdata.area_of_study+ "'";
      
      //console.log("Check1:",checkqry);
      mysqlService.query(checkqry)
        .then((results) => {
          //console.log("RR1:",results[0].total);
          resolve(results[0].total);
        }).catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    });
  }

  function scholarshipListByScholarData(scholarship){
    return new Promise(function (resolve, reject) {
      getMatchingScholarship(scholarship).then(function (response) {
          resolve(scholarshipResultModel(response))
      }, function (err) {
        if (err) {
          var error = err;
          error.status = 503;
          return reject(error)
        };
      })
    })
  }

  function scholarshipSaveUpdateList(sdata){
    return new Promise(function (resolve, reject) {
      checkScholarshipDataExists(sdata,'single').then(function (response) {
        if (response[0].total == 0) {
          insertQuery = "Insert into user_matched_scholarship (student_id,scholarship_id) values ('" + sdata.studentId + "'," + sdata.scholarshipId + ")";
          mysqlService.query(insertQuery)
          .then(function (iresponse) {
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
    })
  }

  function checkScholarshipDataExists(sdata,type){
    return new Promise(function (resolve, reject) {
      let checkqry = ""; 
      if(type == "single"){
        checkqry = "select count(id) as total from user_matched_scholarship where student_id='"+sdata.studentId+"' and scholarship_id="+sdata.scholarshipId;
      }else{
        checkqry = "select count(id) as total from user_matched_scholarship where student_id='"+sdata.studentId+"'";
      }
      
      mysqlService.query(checkqry)
        .then((results) => {
          resolve(results);
        }).catch((err) => {
          console.log('error', err);
          reject(new Error(err));
        });
    })
  }

  function scholarshipCheckDeleteList(sdata){
    return new Promise(function (resolve, reject) {
      let delqry = "DELETE FROM user_matched_scholarship WHERE student_id='" + sdata.studentId + "' and scholarship_id NOT IN (" + sdata.scholarshipId + ")";
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
    })
  }

  function scholarshipUpdateVeteranInfo(sdata){
    return new Promise(function (resolve, reject) {
      let scholarData = {
        sex: sdata.sex,
        minority_background: sdata.minority_background,
        student_disability: sdata.student_disability,
        branch_of_service: sdata.branch_of_service,
        service_status: sdata.service_status,
        degree_level: sdata.degree_level,
        education_status: sdata.education_status,
        area_of_study: sdata.area_of_study,
        area_of_focus: sdata.area_of_focus,
        study_states: sdata.study_states,
        sub_service_status: sdata.sub_service_status,
        state_of_residence: sdata.state_of_residence
      }
      mysqlService.query("UPDATE scholarship_data SET ? WHERE student_id = ?", [scholarData, sdata.student_id])
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

  return {
    addScholarship: addScholarship,
    requestUserMatchScholarship: requestUserMatchScholarship,
    getScholarshipListByVeterans: getScholarshipListByVeterans,
    unfollowScholarship: unfollowScholarship,
    scholarshipUserinfo: scholarshipUserinfo,
    scholarshipEmailRegistration: scholarshipEmailRegistration,
    getScholarshipDetailInfo: getScholarshipDetailInfo,
    scholarshipReportLists: scholarshipReportLists,
    scholarshipReportEmail: scholarshipReportEmail,
    newScholarshipNotificationEmail: newScholarshipNotificationEmail,
    scholarshipManagedate: scholarshipManagedate,
    scholarshipCheckCollegeList: scholarshipCheckCollegeList,
    scholarshipCheckScholarData: scholarshipCheckScholarData,
    scholarshipListByScholarData: scholarshipListByScholarData,
    scholarshipSaveUpdateList: scholarshipSaveUpdateList,
    scholarshipCheckDeleteList: scholarshipCheckDeleteList,
    scholarshipUpdateVeteranInfo: scholarshipUpdateVeteranInfo
  };
})();

module.exports = scholarshipService;