var reviewService = (function() {

    let config = require('../config');
    var mysqlService=require('./mysqlService');
    let emailService=require('./emailService');
    var authenicateService=require('../services/authenicateService');
    let constantContactService = require('../services/constantContactService');
    var authenicateConstant=require('../constants/authenicateConstant');
    let stringUtil = require('../utils/stringUtil');
    let messageEmail = require('../utils/messageEmail');
    let emailConstant=require('../constants/emailConstant');
    var adModel =require('../models/adModel');
    let moment = require('moment');
    let sha1 = require('sha1');

	
	function addReviewFormData(rdata)
	{	
		return new Promise(function(resolve, reject) {
            if(rdata.is_login.toLowerCase() == "yes"){
                addReviewWithLogin(rdata).then(function (response1) {
                    if(response1 == "success"){
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
                checkUserExists(rdata.email).then(function (response) {
                    if (response.length == 1) {
                        resolve("userexist");
                    } else if (response.length == 0) {
                        addReviewWithOutLogin(rdata).then(function (response1) {
                            if(response1 == "success"){
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
            }
		});
    }

    function addReviewWithLogin(rdata){
        return new Promise(function(resolve, reject) {
            checkVeteranReview(rdata.student_id).then(function (response) {
                if(response[0].total == 0){
                    let collegeReview = {
                        student_id: rdata.student_id,
                        sva_member: rdata.sva_member,
                        current_attending: rdata.current_attending
                    }
                    mysqlService.query("INSERT INTO college_review SET ?", collegeReview)
                        .then((presults) => {
                            if (presults["affectedRows"] == 1) {
                                addReviewDataRating(rdata,"").then(function (response1) {
                                    if(response1 == "success"){
                                        sendReviewEmailLogin(rdata).then(function (lresponse) {
                                            if(lresponse == "success"){
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
                            }
                        }).catch((err) => {
                        reject(new Error(err));
                    });
                }else{
                    addReviewDataRating(rdata,"").then(function (response1) {
                        if(response1 == "success"){
                            sendReviewEmailLogin(rdata).then(function (lresponse) {
                                    if(lresponse == "success"){
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

    function sendReviewEmailLogin(rdata){
        return new Promise(function(resolve, reject) {
            let selQuery = "SELECT email FROM students WHERE uuid='"+rdata.student_id+"'";

			mysqlService.query(selQuery)
				.then(function (response) {
                    rdata["email"]=response[0]["email"];
					let subject = "Review received by Collegerecon";
                    let reviewtype = "pending";
                    sendReviewEmail(rdata,subject,reviewtype).then(function (emailresponse) {
                            if(emailresponse == "success"){
                                resolve("success");
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

    function addReviewWithOutLogin(rdata){
        return new Promise(function(resolve, reject) {
            let uuid = stringUtil.UID();
            addStudentProfileInfo(rdata,uuid).then(function (uresponse) {
                if(uresponse == "success"){
                    let collegeReview = {
                        student_id: uuid,
                        sva_member: rdata.sva_member,
                        current_attending: rdata.current_attending
                    }
                    mysqlService.query("INSERT INTO college_review SET ?", collegeReview)
                        .then(function(presults) {
                            if (presults["affectedRows"] == 1) {
                                addReviewDataRating(rdata,uuid).then(function (response1) {
                                    if(response1 == "success"){
                                        let subject = "Review received by Collegerecon";
                                        let reviewtype = "pending";
                                        sendReviewEmail(rdata,subject,reviewtype).then(function (emailresponse) {
                                                if(emailresponse == "success"){
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
                            }
                        }, function (err) {
                            let errData={
                                src:'college_review',
                                student_id:uuid,
                                data: JSON.stringify(rdata),
                                message: JSON.stringify(err)
                            };
                            userLogData(errData).then(function (response1) {
                                if(response1 == "success"){
                                    if (err) {
                                        var error = err;
                                        error.status = 503;
                                        return reject(error);
                                    };
                                }
                            }, function (err) {
                                if (err) {
                                    var error = err;
                                    error.status = 503;
                                    return reject(error)
                                };
                            });
                    });
                }
            }, function (err) {
                let errData={
                    src:'student_profile',
                    student_id:uuid,
                    data: JSON.stringify(rdata),
                    message: JSON.stringify(err)
                };
                userLogData(errData).then(function (response1) {
                    if(response1 == "success"){
                        if (err) {
                            var error = err;
                            error.status = 503;
                            return reject(error);
                        };
                    }
                }, function (err) {
                    if (err) {
                        var error = err;
                        error.status = 503;
                        return reject(error)
                    };
                });
            });
        });
    }

    function userLogData(logData){
        return new Promise(function(resolve, reject) {
            mysqlService.query("INSERT INTO review_user_log SET ?", logData)
            .then((presults) => {
                if (presults["affectedRows"] == 1) {
                    resolve("success");
                }
            }).catch((err) => {
                reject(new Error(err));
            });
        });
    }
    
    function addReviewDataRating(rdata,student_id){
        return new Promise(function(resolve, reject) {
            
            for (i = 0; i < rdata.reviewdata.length; i++) {
                let sid = "";
                if(student_id){
                    sid = student_id;
                }else{
                    sid = rdata.student_id;
                }
                let uuid = stringUtil.UID();
                let reviewData = {
                    student_id: sid,
                    review_id: uuid,
                    college_id: rdata.reviewdata[i]['college_id'],
                    graduate_from: rdata.reviewdata[i]['college_graduate'],
                    attend_school_type: rdata.reviewdata[i]['college_attend'],
                    review_status: 'pending'
                }
                let adminRate = rdata.reviewdata[i]['admission_rating']?1:0;
                let acedeminRate = rdata.reviewdata[i]['academic_rating']?1:0;
                let veteranRate = rdata.reviewdata[i]['veteran_support_rating']?1:0;
                let recommendRate = rdata.reviewdata[i]['recommend_rating']?1:0;
                let averageTotal = adminRate + acedeminRate + veteranRate + recommendRate;
                let allrate = (rdata.reviewdata[i]['admission_rating']+rdata.reviewdata[i]['academic_rating']+rdata.reviewdata[i]['veteran_support_rating']+rdata.reviewdata[i]['recommend_rating'])/averageTotal;
                let reviewRating = {
                    review_id: uuid,
                    admission_rating: rdata.reviewdata[i]['admission_rating'],
                    academic_rating: rdata.reviewdata[i]['academic_rating'],
                    veteran_military_rating: rdata.reviewdata[i]['veteran_support_rating'],
                    recommend_rating: rdata.reviewdata[i]['recommend_rating'],
                    overall_rating: allrate
                }
                let reviewMessage = {
                    review_id: uuid,
                    message: rdata.reviewdata[i]['message'],
                    review_from: "user",
                    review_to: "college",
                    review_type: "review",
                    user_id: sid,
                    college_id: rdata.reviewdata[i]['college_id'],
                    review_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                }
                checkSameCollegeReview(sid,rdata.reviewdata[i]['college_id']).then(function (response) {
                    if(response[0].total == 0){
                        mysqlService.query("INSERT INTO review_data SET ?", reviewData)
                        .then((results) => {
                            if (results["affectedRows"] == 1) {
                                mysqlService.query("INSERT INTO review_rating SET ?", reviewRating)
                                .then((presults) => {
                                    if (presults["affectedRows"] == 1) {
                                        mysqlService.query("INSERT INTO review_message SET ?", reviewMessage)
                                        .then((mresults) => {
                                            if (mresults["affectedRows"] == 1 && i == (rdata.reviewdata.length)) {
                                                resolve("success");
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
                    }else{
                        if(i == rdata.reviewdata.length - 1){
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

    function checkVeteranReview(studentId) {
        return new Promise(function (resolve, reject) {
          let checkqry = "select count(student_id) as total from college_review where student_id = '" + studentId + "'";
          mysqlService.query(checkqry)
            .then((results) => {
              resolve(results);
            }).catch((err) => {
              console.log('error', err);
              reject(new Error(err));
            });
        });
    }

    function checkSameCollegeReview(studentId,collegeId) {
        return new Promise(function (resolve, reject) {
          let checkqry = "select count(id) as total from review_data where student_id = '" + studentId + "' and college_id="+collegeId;
          mysqlService.query(checkqry)
            .then((results) => {
              resolve(results);
            }).catch((err) => {
              console.log('error', err);
              reject(new Error(err));
            });
        });
    }

    function addStudentProfileInfo(udata,uuid){
        return new Promise(function (resolve, reject) {
            let terms_of_comm = 'N';
            let student = {
                uuid: uuid,
                email: udata.email,
                first_name: udata.first_name,
                last_name: udata.last_name,
                password: sha1(udata.password),
                utm_source: "",
                site_source: udata.site_source,
                primary_source: udata.primary_source,
                secondary_source: udata.secondary_source,
                //filters: filter_data,
                //filter_majordata: filter_majordata,
                //filter_state: filter_state,
                utm_medium: "",
                utm_campaign: "",
                terms_of_comm: terms_of_comm,
                last_login: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
              };
              mysqlService.query(authenicateConstant.STUDENT_SAVE, student)
                  .then((results) => {
                    if (results["affectedRows"] == 1) {
                        let studentprofile = {
                            uuid: uuid,
                            military_status: udata.military_status,
                            state: udata.state,
                            military_rank: udata.rank_id,
                            military_branch: udata.branch_id,
                            phone_number: "",
                            profile_image: "",
                            name_of_school: "",
                            sat_score: "",
                            date_created: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                          };
                        mysqlService.query(authenicateConstant.STUDENT_PROFILE_SAVE, studentprofile)
                            .then((presults) => {
                                if (presults["affectedRows"] == 1) {
                                    if (config.DOMAIN_URL == "https://app.collegerecon.com") {
                                            let constantcontact = {
                                                "addresses": [
                                                {
                                                    "address_type": "BUSINESS",
                                                    "postal_code": ""
                                                }
                                                ],
                                                "lists": [
                                                {
                                                    "id": "1553710252"
                                                }
                                                ],
                                                "email_addresses": [
                                                {
                                                    "email_address": udata.email
                                                }
                                                ],
                                                "first_name": udata.first_name,
                                                "last_name": udata.last_name,
                                                "created_date": moment(new Date()).format()
                                            }
                                            constantContactService.addUser(constantcontact).then(function (response2) {
                                                if (response2 == "success") {
                                                    resolve("success");
                                                }
                                            }, function (err) { reject(new Error(err)); });
                                    }else {
                                        resolve("success");
                                    }
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

    function getCollegeReviewInfo(collegId){
        return new Promise(function (resolve, reject) {
			let updateQuery = "SELECT count(rd.student_id) as total,SUM(rr.overall_rating) as rate_total,SUM(rr.admission_rating) as rate_admission,SUM(rr.academic_rating) as rate_academic,SUM(rr.veteran_military_rating) as rate_veteran,SUM(rr.recommend_rating) as rate_recommend,SUM(CASE WHEN admission_rating = 0 THEN 0 ELSE 1 END) as admtotal,SUM(CASE WHEN academic_rating = 0 THEN 0 ELSE 1 END) as acatotal,SUM(CASE WHEN veteran_military_rating = 0 THEN 0 ELSE 1 END) as vettotal,SUM(CASE WHEN recommend_rating = 0 THEN 0 ELSE 1 END) as rectotal FROM review_data as rd LEFT JOIN review_rating as rr ON rd.review_id=rr.review_id WHERE rd.review_status='verified' and rd.college_id = "+collegId;

			mysqlService.query(updateQuery)
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

    function getVetranCollegeReviewData(studentId){
        return new Promise(function (resolve, reject) {
			let updateQuery = "SELECT GROUP_CONCAT(college_id) as collegeids FROM review_data WHERE student_id='"+studentId+"' GROUP BY student_id";

			mysqlService.query(updateQuery)
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

    function getCollegeReviewList(collegId){
        return new Promise(function (resolve, reject) {
            let updateQuery = "select rr.id,rr.review_id,(SELECT first_name FROM students WHERE uuid=rd.student_id) as first_name, rr.message as ReviewMsg , rrp.message as ReplyMsg,rrp.college_id ,rr.review_date as ReviewDate, rrp.review_date as ReplyDate, rrate.admission_rating,rrate.academic_rating,rrate.veteran_military_rating,rrate.recommend_rating,rrate.overall_rating from review_message rr JOIN review_data rd ON rd.review_id = rr.review_id JOIN review_rating rrate ON rd.review_id = rrate.review_id left JOIN review_message rrp on rr.review_id = rrp.review_id and rrp.review_type = 'reply' JOIN review_data rd1 ON rd1.review_id = rr.review_id where rd.college_id = "+collegId+" and rd.review_status='verified' and rr.review_type = 'review' ORDER BY rr.review_date DESC "
			/*let updateQuery = "SELECT rd.id,rd.review_id,rr.admission_rating,rr.academic_rating,rr.veteran_military_rating,rr.recommend_rating,rr.overall_rating,rm.message,rm.review_date,st.first_name FROM review_data as rd LEFT JOIN review_rating as rr ON rd.review_id=rr.review_id LEFT JOIN review_message as rm ON rd.review_id=rm.review_id LEFT JOIN students as st ON rd.student_id=st.uuid WHERE rm.review_type='review' AND rd.college_id = "+collegId+" ORDER BY rm.review_date DESC";*/

			mysqlService.query(updateQuery)
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

    function getVetranCheckCollegeReview(studentId,collegId){
        return new Promise(function (resolve, reject) {
			let updateQuery = "SELECT count(id) as total FROM review_data WHERE student_id='"+studentId+"' AND college_id = "+collegId;
            //console.log("QQ:",updateQuery);
			mysqlService.query(updateQuery)
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

    function addReviewReplyFormData(rdata)
	{	
		return new Promise(function(resolve, reject) {
            checkCollegeReplyReview(rdata.review_id,rdata.user_id,rdata.college_id).then(function (response) {
                if(response[0].total == 0){
                    let reviewReplyMessage = {
                        review_id: rdata.review_id,
                        message: rdata.message,
                        review_from: "college",
                        review_to: "user",
                        review_type: "reply",
                        user_id: rdata.user_id,
                        college_id: rdata.college_id,
                        review_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
                    }
                    mysqlService.query("INSERT INTO review_message SET ?", reviewReplyMessage)
                    .then((mresults) => {
                        if (mresults["affectedRows"] == 1) {
                            resolve("success");
                        }
                    }).catch((err) => {
                    reject(new Error(err));
                    });
                }else{
                    resolve("replysubmit");
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

    function checkCollegeReplyReview(reviewId,userId,collegeId) {
        return new Promise(function (resolve, reject) {
          let checkqry = "select count(id) as total from review_message where user_id = '" + userId + "' AND review_id = '" + reviewId + "' AND college_id="+collegeId;
          mysqlService.query(checkqry)
            .then((results) => {
              resolve(results);
            }).catch((err) => {
              console.log('error', err);
              reject(new Error(err));
            });
        });
    }

    function getSuperadminReviewList() {
        return new Promise(function (resolve, reject) {
          let checkqry = "SELECT rd.review_id,rd.student_id,rd.college_id,rd.graduate_from,rd.attend_school_type,rd.review_status,rm.message,rm.review_date,rr.admission_rating,rr.academic_rating,rr.veteran_military_rating,rr.recommend_rating,rr.overall_rating,cc.college_name,(CASE WHEN ss.middle_initial IS NULL OR TRIM(ss.middle_initial) ='' THEN CONCAT_WS( ' ', ss.first_name, ss.last_name ) ELSE CONCAT_WS( ' ', ss.first_name, ss.middle_initial, ss.last_name ) END) as name FROM review_data as rd LEFT JOIN review_message as rm ON rd.review_id=rm.review_id LEFT JOIN review_rating as rr ON rd.review_id=rr.review_id LEFT JOIN colleges as cc ON rd.college_id=cc.id LEFT JOIN students as ss ON rd.student_id = ss.uuid WHERE rm.review_type='review' ORDER BY rm.review_date DESC";
          mysqlService.query(checkqry)
            .then((results) => {
              resolve(results);
            }).catch((err) => {
              console.log('error', err);
              reject(new Error(err));
            });
        });
    }

    function getSuperadminVeteranReviewList(status) {
        return new Promise(function (resolve, reject) {
          let checkqry = "SELECT rd.review_id,rd.student_id,rd.college_id,rd.graduate_from,rd.attend_school_type,rm.message,rm.review_date,rr.admission_rating,rr.academic_rating,rr.veteran_military_rating,rr.recommend_rating,rr.overall_rating,cc.college_name,(CASE WHEN ss.middle_initial IS NULL OR TRIM(ss.middle_initial) ='' THEN CONCAT_WS( ' ', ss.first_name, ss.last_name ) ELSE CONCAT_WS( ' ', ss.first_name, ss.middle_initial, ss.last_name ) END) as name FROM review_data as rd LEFT JOIN review_message as rm ON rd.review_id=rm.review_id LEFT JOIN review_rating as rr ON rd.review_id=rr.review_id LEFT JOIN colleges as cc ON rd.college_id=cc.id LEFT JOIN students as ss ON rd.student_id = ss.uuid WHERE rd.review_status='"+status+"' and rm.review_type='review' ORDER BY rm.review_date DESC";
          mysqlService.query(checkqry)
            .then((results) => {
              resolve(results);
            }).catch((err) => {
              console.log('error', err);
              reject(new Error(err));
            });
        });
    }

    function getSuperadminReviewDetail(rid) {
        return new Promise(function (resolve, reject) {
          let checkqry = "SELECT rd.review_id,rd.student_id,rd.college_id,rd.graduate_from,rd.attend_school_type,rd.review_status,rm.message,rm.review_date,rr.admission_rating,rr.academic_rating,rr.veteran_military_rating,rr.recommend_rating,rr.overall_rating,cc.college_name,cc.college_alias,cc.seo_name,(CASE WHEN ss.middle_initial IS NULL OR TRIM(ss.middle_initial) ='' THEN CONCAT_WS( ' ', ss.first_name, ss.last_name ) ELSE CONCAT_WS( ' ', ss.first_name, ss.middle_initial, ss.last_name ) END) as name,ss.email FROM review_data as rd LEFT JOIN review_message as rm ON rd.review_id=rm.review_id LEFT JOIN review_rating as rr ON rd.review_id=rr.review_id LEFT JOIN colleges as cc ON rd.college_id=cc.id LEFT JOIN students as ss ON rd.student_id = ss.uuid WHERE rd.review_id='"+rid+"'";
          mysqlService.query(checkqry)
            .then((results) => {
              resolve(results);
            }).catch((err) => {
              console.log('error', err);
              reject(new Error(err));
            });
        });
    }

    function updateReviewDataSuperadmin(udata){
        return new Promise(function (resolve, reject) {
            let statusquery = "UPDATE review_data SET review_status = '"+udata.review_status+"' WHERE student_id = '"+udata.student_id+"' AND review_id = '"+udata.review_id+"' AND college_id = "+udata.college_id;
            mysqlService.query(statusquery)
                .then((results) => {
                    let messquery = "UPDATE review_message SET message = '"+udata.message+"' WHERE user_id = '"+udata.student_id+"' AND review_id = '"+udata.review_id+"' AND college_id = "+udata.college_id;
                    mysqlService.query(messquery)
                    .then((presults) => {
                        if(udata.review_status == 'verified'){
                            let subject = "Review verified by Collegerecon";
                            let reviewtype = "verified";
                            sendReviewEmail(udata,subject,reviewtype).then(function (emailresponse) {
                                    if(emailresponse == "success"){
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
                            resolve("success");
                        }
                    }).catch((err) => {
                    reject(new Error(err));
                    });
                }).catch((err) => {
                    reject(new Error(err));
                });
        });
    }

    function getReviewEmailContent(reviewType,collegeData){
        let emailContent = "";
        emailContent += '<!DOCTYPE html><html><head><style>body {font-family: "Source Sans Pro", sans-serif; color: #333;}p {font-size: 16px;}.main-section {margin: 6%;}</style></head><body>';
        emailContent += '<div class="main-section">';
        emailContent += '<p style="text-align: center; margin-bottom: 46px;"><img src="https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png" width="195px"/></p>';
        if(reviewType=="pending"){
            emailContent += '<p>Thank you for your submission! Your school ratings are currently pending and under review.</p>';
            emailContent += '<p>Once approved, your ratings will be invaluable in helping future veteran and military students make decisions about their future.</p>';
            emailContent += '<p>Submitted ratings are only screened for offensive content and profanity.</p><br>';
        }else if(reviewType=="verified"){
            let colUrl = stringUtil.collegeNameUrl(collegeData.collegeUrl);
            let collegeProfileUrl = config.DOMAIN_URL+'/'+collegeData.collegeAlias;
            emailContent += '<p>Thank you for your submission! Your review has been approved and is currently displayed within the school profile.</p>';
            emailContent += '<p>Please go here to view your school rating:<a href="'+collegeProfileUrl+'">'+collegeProfileUrl+'</a> and view the “Reviews” tab.</p>';
            emailContent += '<p>Your review will be invaluable in helping future veteran and military students make decisions about their future.</p><br>';
        }
        emailContent += '<p>Thank you,</p>';
        emailContent += '<p>Team CollegeRecon</p>';
        emailContent += '<p style="font-size:14px">Looking to jumpstart your career? Get <a href="https://collegerecon.com/sign-up-for-job-opportunities">matched with companies</a> looking to hire veterans. Use our <a href="https://collegerecon.com/sign-up-for-job-opportunities">Job Matcher</a> tool today!</p>';
        emailContent += '</div></body></html>';
        return emailContent;
    }

    function sendReviewEmail(userData,ss,reviewtype){
        return new Promise(function(resolve, reject) {
            let message = "";
            let emailContent = "";
            let subject = ss;
            let to = [userData.email];
            let from = emailConstant.NO_REPLY_EMAIL;
            emailContent = getReviewEmailContent(reviewtype,userData);
            message = messageEmail.basicReplyEmailTemplate(emailContent);
            emailService.sendEmail(from,to,subject,message).then(function(response){
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

    function getSuperadminCollegeReviewList(collegeId) {
        return new Promise(function (resolve, reject) {
          let checkqry = "SELECT rd.review_id,rd.student_id,rd.college_id,rd.graduate_from,rd.attend_school_type,rd.review_status,rm.message,rm.review_date,rr.admission_rating,rr.academic_rating,rr.veteran_military_rating,rr.recommend_rating,rr.overall_rating,cc.college_name,(CASE WHEN ss.middle_initial IS NULL OR TRIM(ss.middle_initial) ='' THEN CONCAT_WS( ' ', ss.first_name, ss.last_name ) ELSE CONCAT_WS( ' ', ss.first_name, ss.middle_initial, ss.last_name ) END) as name FROM review_data as rd LEFT JOIN review_message as rm ON rd.review_id=rm.review_id LEFT JOIN review_rating as rr ON rd.review_id=rr.review_id LEFT JOIN colleges as cc ON rd.college_id=cc.id LEFT JOIN students as ss ON rd.student_id = ss.uuid WHERE rm.review_type='review' and rd.college_id="+collegeId+" ORDER BY rm.review_date DESC";
          mysqlService.query(checkqry)
            .then((results) => {
              resolve(results);
            }).catch((err) => {
              console.log('error', err);
              reject(new Error(err));
            });
        });
    }

	return {
        addReviewFormData: addReviewFormData,
        getCollegeReviewInfo: getCollegeReviewInfo,
        getCollegeReviewList: getCollegeReviewList,
        getVetranCollegeReviewData: getVetranCollegeReviewData,
        getVetranCheckCollegeReview: getVetranCheckCollegeReview,
        addReviewReplyFormData: addReviewReplyFormData,
        getSuperadminReviewList: getSuperadminReviewList,
        getSuperadminVeteranReviewList: getSuperadminVeteranReviewList,
        getSuperadminReviewDetail: getSuperadminReviewDetail,
        updateReviewDataSuperadmin: updateReviewDataSuperadmin,
        getSuperadminCollegeReviewList: getSuperadminCollegeReviewList
	}

})();

module.exports = reviewService;