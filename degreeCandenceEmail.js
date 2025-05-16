let degreeCandenceEmail = (function() {
    let moment =require('moment');
    let mysqlService=require('./services/mysqlService');
    let emailService=require('./services/emailService');
    let collegeService=require('./services/collegeService');
    let stringUtil = require('./utils/stringUtil');
    let emailConstant=require('./constants/emailConstant');
    let messageEmail = require('./utils/messageEmail');
    let messageEncryption = require('./utils/base64Utility');
    let matchedCollegeListModel = require('./models/matchedCollegeListModel');
    let config = require('./config');

    // Sent Matching Cadence Email
    async function emailMatchingCandenceList(){
        let veteranList = await getAllActiveMatchingVeteranList();
        for(let i=0;i<veteranList.length;i++){
            //for(let i=0;i<2;i++){
               let result= await sentMatchingCandenceEmail(veteranList[i]);
               //console.log("Student :",veteranList[i].student_id+" Result:"+result);
            //}  
        }
    }

    async function getAllActiveMatchingVeteranList(){
        return new Promise(function(resolve, reject) {
            let ruleSql = "SELECT DISTINCT(mm.student_id) as student_id,ss.email,ss.first_name,sp.state,sp.military_status,(select title from levels where id=sp.level_id) as levelText,sp.level_id,(select title from bucket_degree where id=sp.bucket_id) as bucketText,sp.bucket_id,sp.secondary_bucket_id from cadence_matching_list as mm LEFT JOIN students as ss ON mm.student_id=ss.uuid LEFT JOIN student_profile as sp ON mm.student_id=sp.uuid WHERE ss.user_account_status='active' and DATEDIFF(CURRENT_DATE,mm.date_created) IN (8,22,36) and mm.student_id not in (SELECT student_id from student_unsubscribe WHERE unsubscribe_type='matching_email')";
            //console.log("QQ1:",ruleSql);
            mysqlService.query(ruleSql)
            .then(function(response){
                resolve(response);
            },function(err){  
                if (err) {
                    var error = err;
                    error.status = 503;
                    return reject(error)
                };
            });
        })
    }

    async function sentMatchingCandenceEmail(studentInfo){
        return new Promise(function(resolve, reject) {
            let sql = "SELECT DATEDIFF(CURRENT_DATE,date_created) as days,GROUP_CONCAT(college_id) as cids FROM `cadence_matching_list` where rule_status='active' and rule_id <> 4 and student_id='"+studentInfo.student_id+"' GROUP BY DATEDIFF(CURRENT_DATE,date_created)";
            //console.log("QQ2:",sql);
            mysqlService.query(sql)
            .then(async function(response){
                if(response.length > 0){
                    let secondRuleMess = "success";
                    let thirdRuleMess = "success";
                    let fourthRulemess = "success";
                    for (let i = 0; i < response.length; i++) {
                        if(response[i].days == 8){
                            secondRuleMess = await sentSecondMatchingEmail(studentInfo, response[i].cids,response[i].days);
                        }
                        if(response[i].days == 22){
                            thirdRuleMess = await sentThirdMatchingEmail(studentInfo, response[i].cids,response[i].days);
                        }
                        if(response[i].days == 36){
                            fourthRulemess = await sentFourthMatchingEmail(studentInfo, response[i].cids,response[i].days);
                        }
                    }

                    if(secondRuleMess == "success" && thirdRuleMess == "success" && fourthRulemess == "success")
                    {
                        resolve("success");
                    }
                }else{
                    resolve("success");
                }
            },function(err){  
                if (err) {
                    var error = err;
                    error.status = 503;
                    return reject(error)
                };
            });
        })
    }

    async function sentSecondMatchingEmail(studentInfo, cids, days){
        return new Promise(async function(resolve, reject) {
            //console.log("Second");
            let collegeinfo = await candenceSchoolInformation(cids);
            let secBucketData = await getSecondaryBucketListData(studentInfo.secondary_bucket_id);
            let secBucketDataToEmail = {
                areaOfFocus: secBucketData
            }
            let completeData = [studentInfo.email,studentInfo.first_name,studentInfo.student_id,studentInfo.state,studentInfo.levelText,studentInfo.bucketText,secBucketDataToEmail,collegeinfo,'cadence',studentInfo.military_status];
            collegeService.sendBackEmailToNewUser(completeData).then(function (eresponse) {
                if(eresponse == "success"){
                    resolve(updateCandenceEmailData(studentInfo.student_id, days, 2));
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

    async function sentThirdMatchingEmail(studentInfo, cids, days){
        return new Promise(async function(resolve, reject) {
            //console.log("Third");
            let collegeinfo = await candenceSchoolInformation(cids);
            let secBucketData = await getSecondaryBucketListData(studentInfo.secondary_bucket_id);
            let secBucketDataToEmail = {
                areaOfFocus: secBucketData
            }
            let completeData = [studentInfo.email,studentInfo.first_name,studentInfo.student_id,studentInfo.state,studentInfo.levelText,studentInfo.bucketText,secBucketDataToEmail,collegeinfo,'cadence',studentInfo.military_status];
            collegeService.sendBackEmailToNewUser(completeData).then(function (eresponse) {
                if(eresponse == "success"){
                    resolve(updateCandenceEmailData(studentInfo.student_id, days, 3));
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

    async function sentFourthMatchingEmail(studentInfo, cids, days){
        return new Promise(async function(resolve, reject) {
            //console.log("Fourth");
            let collegeinfo = await candenceSchoolInformation(cids);
            let secBucketData = await getSecondaryBucketListData(studentInfo.secondary_bucket_id);
            let secBucketDataToEmail = {
                areaOfFocus: secBucketData
            }
            let completeData = [studentInfo.email,studentInfo.first_name,studentInfo.student_id,studentInfo.state,studentInfo.levelText,studentInfo.bucketText,secBucketDataToEmail,collegeinfo,'cadence',studentInfo.military_status];
            collegeService.sendBackEmailToNewUser(completeData).then(function (eresponse) {
                if(eresponse == "success"){
                    resolve(updateCandenceEmailData(studentInfo.student_id, days, 4));
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

    async function candenceSchoolInformation(cids){
        return new Promise(function(resolve, reject) {
            let ruleSql = "select cc.id as collegeId,cc.college_name,cp.college_logo,cc.seo_name,cp.overview,cc.access_level,cc.college_alias,cl.matched_percent from colleges as cc left join college_profiles as cp on cc.id=cp.college_id left join cadence_matching_list as cl on cc.id=cl.college_id where cc.id in ("+cids+")";
            mysqlService.query(ruleSql)
            .then(function(response){
                resolve(matchedCollegeListModel(response));
            },function(err){  
                if (err) {
                    var error = err;
                    error.status = 503;
                    return reject(error)
                };
            });
        })
    }

    async function getSecondaryBucketListData(secBucketIds){
        return new Promise(function(resolve, reject) {
            let ruleSql = "select title from bucket_secondary_degree where id in ("+secBucketIds+")";
            //console.log("QQ4:",ruleSql);
            mysqlService.query(ruleSql)
            .then(function(response){
                resolve(response.map(a => a.title));
            },function(err){  
                if (err) {
                    var error = err;
                    error.status = 503;
                    return reject(error)
                };
            });
        })
    }

    async function updateCandenceEmailData(studentId, days, ruleId){
        return new Promise(function(resolve, reject) {
            let ruleSql = "";
            if(ruleId == 4){
                ruleSql = "UPDATE cadence_matching_list SET rule_id="+ruleId+",rule_status='stop' WHERE DATEDIFF(CURRENT_DATE,date_created)="+days+" and student_id='"+studentId+"' and rule_status='active'";
            }else{
                ruleSql = "UPDATE cadence_matching_list SET rule_id="+ruleId+" WHERE DATEDIFF(CURRENT_DATE,date_created)="+days+" and student_id='"+studentId+"' and rule_status='active'";
            }
            //console.log("QQ4:",ruleSql);
            mysqlService.query(ruleSql)
            .then(function(response){
                resolve("success");
            },function(err){  
                if (err) {
                    var error = err;
                    error.status = 503;
                    return reject(error)
                };
            });
        })
    }
    // End Matching Cadence Email

    // Sent Degree Bounce Cadence Email
    async function emailDegreebounceCandenceList(){
        let veteranList = await getAllActiveDegreebounceVeteranList();
        for(let i=0;i<veteranList.length;i++){
            //for(let i=0;i<2;i++){
               let result= await sentDegreebounceCandenceEmail(veteranList[i]);
               //console.log("Student :",veteranList[i].student_id+" Result:"+result);
            //}  
        }
    }

    async function getAllActiveDegreebounceVeteranList(){
        return new Promise(function(resolve, reject) {
            let ruleSql = "SELECT DISTINCT(mm.student_id) as student_id,ss.email,ss.first_name,sp.state,(select title from levels where id=sp.level_id) as levelText,sp.level_id,(select title from bucket_degree where id=sp.bucket_id) as bucketText,sp.bucket_id,sp.secondary_bucket_id,sp.military_status from cadence_degree_bounce_list as mm LEFT JOIN students as ss ON mm.student_id=ss.uuid LEFT JOIN student_profile as sp ON mm.student_id=sp.uuid WHERE ss.user_account_status='active' and DATEDIFF(CURRENT_DATE,mm.date_created) IN (8,22,36) and mm.student_id not in (SELECT student_id from student_unsubscribe WHERE unsubscribe_type='degree_bounce_email')";
            //console.log("QQ1:",ruleSql);
            mysqlService.query(ruleSql)
            .then(function(response){
                resolve(response);
            },function(err){  
                if (err) {
                    var error = err;
                    error.status = 503;
                    return reject(error)
                };
            });
        })
    }

    async function sentDegreebounceCandenceEmail(studentInfo){
        return new Promise(function(resolve, reject) {
            let sql = "SELECT DATEDIFF(CURRENT_DATE,date_created) as days,GROUP_CONCAT(college_id) as cids FROM `cadence_degree_bounce_list` where rule_status='active' and rule_id <> 4 and student_id='"+studentInfo.student_id+"' GROUP BY DATEDIFF(CURRENT_DATE,date_created)";
            //console.log("QQ2:",sql);
            mysqlService.query(sql)
            .then(async function(response){
                if(response.length > 0){
                    let secondRuleMess = "success";
                    let thirdRuleMess = "success";
                    let fourthRulemess = "success";
                    for (let i = 0; i < response.length; i++) {
                        if(response[i].days == 8){
                            secondRuleMess = await checkStudentDegreeBounceEmail(studentInfo, response[i].days,2);
                            //secondRuleMess = await sentSecondDegreebounceEmail(studentInfo, response[i].cids,response[i].days);
                        }
                        if(response[i].days == 22){
                            //thirdRuleMess = await sentThirdDegreebounceEmail(studentInfo, response[i].cids,response[i].days);
                            thirdRuleMess = await checkStudentDegreeBounceEmail(studentInfo,response[i].days,3);
                        }
                        if(response[i].days == 36){
                            //fourthRulemess = await sentFourthDegreebounceEmail(studentInfo, response[i].cids,response[i].days);
                            fourthRulemess = await checkStudentDegreeBounceEmail(studentInfo,response[i].days,4);
                        }
                    }

                    if(secondRuleMess == "success" && thirdRuleMess == "success" && fourthRulemess == "success")
                    {
                        resolve("success");
                    }
                }else{
                    resolve("success");
                }
            },function(err){  
                if (err) {
                    var error = err;
                    error.status = 503;
                    return reject(error)
                };
            });
        })
    }

    async function sentSecondDegreebounceEmail(studentInfo, cids, days){
        return new Promise(async function(resolve, reject) {
            //console.log("Second");
            let focusLength = 1;
            if(studentInfo.secondary_bucket_id.indexOf(",") > -1){
                let pData = studentInfo.secondary_bucket_id.split(",");
                focusLength = pData.length;
            }
            let bounceBackData = {
                "education_goal" : studentInfo.level_id,
                "area_focus_length" : focusLength,
                "college_id": 0,
                "state": studentInfo.state,
                "bucket_id": studentInfo.bucket_id,
                "website": "app",
                "area_focus_ids": studentInfo.secondary_bucket_id,
                "military_status": studentInfo.military_status
              };
            let secBucketData = await getDegreeSecondaryBucketListData(studentInfo.secondary_bucket_id);
            let completeData = [bounceBackData,studentInfo.email,studentInfo.first_name,studentInfo.student_id,studentInfo.bucketText,secBucketData,'cadence'];
            collegeService.sendBackBucketDataEmailToNewUser(completeData).then(function (eresponse) {
                if(eresponse == "success"){
                    //resolve("success");
                    resolve(updateCandenceDegreeEmailData(studentInfo.student_id, days, 2));
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

    async function sentThirdDegreebounceEmail(studentInfo, cids, days){
        return new Promise(async function(resolve, reject) {
            //console.log("Third");
            let focusLength = 1;
            if(studentInfo.secondary_bucket_id.indexOf(",") > -1){
                let pData = studentInfo.secondary_bucket_id.split(",");
                focusLength = pData.length;
            }
            let bounceBackData = {
                "education_goal" : studentInfo.level_id,
                "area_focus_length" : focusLength,
                "college_id": 0,
                "state": studentInfo.state,
                "bucket_id": studentInfo.bucket_id,
                "website": "app",
                "area_focus_ids": studentInfo.secondary_bucket_id,
                "military_status": studentInfo.military_status
              };
            let secBucketData = await getDegreeSecondaryBucketListData(studentInfo.secondary_bucket_id);
            let completeData = [bounceBackData,studentInfo.email,studentInfo.first_name,studentInfo.student_id,studentInfo.bucketText,secBucketData,'cadence'];
            collegeService.sendBackBucketDataEmailToNewUser(completeData).then(function (eresponse) {
                if(eresponse == "success"){
                    resolve(updateCandenceDegreeEmailData(studentInfo.student_id, days, 3));
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

    async function sentFourthDegreebounceEmail(studentInfo, cids, days){
        return new Promise(async function(resolve, reject) {
            //console.log("Fourth");
            let focusLength = 1;
            if(studentInfo.secondary_bucket_id.indexOf(",") > -1){
                let pData = studentInfo.secondary_bucket_id.split(",");
                focusLength = pData.length;
            }
            let bounceBackData = {
                "education_goal" : studentInfo.level_id,
                "area_focus_length" : focusLength,
                "college_id": 0,
                "state": studentInfo.state,
                "bucket_id": studentInfo.bucket_id,
                "website": "app",
                "area_focus_ids": studentInfo.secondary_bucket_id,
                "military_status": studentInfo.military_status
              };
            let secBucketData = await getDegreeSecondaryBucketListData(studentInfo.secondary_bucket_id);
            let completeData = [bounceBackData,studentInfo.email,studentInfo.first_name,studentInfo.student_id,studentInfo.bucketText,secBucketData,'cadence'];
            collegeService.sendBackBucketDataEmailToNewUser(completeData).then(function (eresponse) {
                if(eresponse == "success"){
                    resolve(updateCandenceDegreeEmailData(studentInfo.student_id, days, 4));
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

    async function checkStudentDegreeBounceEmail(studentInfo,days,ruleId){
        return new Promise(async function(resolve, reject) {
            let primaryArray = ['4','6','8','10','11','12','13','17','18','19'];
            if(studentInfo.bucket_id.indexOf(",") > -1){
                let priData = studentInfo.bucket_id.split(",");
                let i = 0;
                for(let j=0;j<priData.length;j++){
                    if(primaryArray.indexOf(priData[j]) > -1){
                        if(i == 0){
                            await sendBounceBackEmailToStudent(studentInfo,days,priData[j],ruleId,"yes");
                        }else{
                            await sendBounceBackEmailToStudent(studentInfo,days,priData[j],ruleId,"no");
                        }
                        i = i + 1;
                    }
                    if(j == priData.length-1){
                        resolve("success");
                    }
                }
            }else{
                if(primaryArray.indexOf(studentInfo.bucket_id) > -1){
                    await sendBounceBackEmailToStudent(studentInfo,days,studentInfo.bucket_id,ruleId,"yes");
                }
                resolve("success");
            }
        })    
    }

    async function sendBounceBackEmailToStudent(studentInfo,days,bucketId,ruleId,update){
        return new Promise(async function(resolve, reject) {
            let focusLength = 1;
            if(studentInfo.secondary_bucket_id.indexOf(",") > -1){
                let pData = studentInfo.secondary_bucket_id.split(",");
                focusLength = pData.length;
            }
            let bounceBackData = {
                "education_goal" : studentInfo.level_id,
                "area_focus_length" : focusLength,
                "college_id": 0,
                "state": studentInfo.state,
                "bucket_id": bucketId,
                "website": "app",
                "area_focus_ids": studentInfo.secondary_bucket_id,
                "military_status": studentInfo.military_status
              };
            let secBucketData = await getDegreeSecondaryBucketListData(studentInfo.secondary_bucket_id);
            let bucketTitle = await getPrimaryBucketName(bucketId);
            let completeData = [bounceBackData,studentInfo.email,studentInfo.first_name,studentInfo.student_id,bucketTitle,secBucketData,'cadence'];
            
            collegeService.sendBackBucketDataEmailToNewUser(completeData).then(function (eresponse) {
                    if(eresponse == "success"){
                        if(update == "yes"){
                            resolve(updateCandenceDegreeEmailData(studentInfo.student_id, days, ruleId));
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
    }
    
    async function getPrimaryBucketName(bucketId){
        return new Promise(function(resolve, reject) {
            let ruleSql = "select title from bucket_degree where id="+bucketId;
            //console.log("QQ4:",ruleSql);
            mysqlService.query(ruleSql)
            .then(function(response){
                resolve(response[0].title);
            },function(err){  
                if (err) {
                    var error = err;
                    error.status = 503;
                    return reject(error)
                };
            });
        })
    }

    async function getDegreeSecondaryBucketListData(secBucketIds){
        return new Promise(function(resolve, reject) {
            let ruleSql = "select GROUP_CONCAT(title) as secbucket from bucket_secondary_degree where id in ("+secBucketIds+")";
            //console.log("QQ4:",ruleSql);
            mysqlService.query(ruleSql)
            .then(function(response){
                resolve(response[0].secbucket);
            },function(err){  
                if (err) {
                    var error = err;
                    error.status = 503;
                    return reject(error)
                };
            });
        })
    }

    async function updateCandenceDegreeEmailData(studentId, days, ruleId){
        return new Promise(function(resolve, reject) {
            let ruleSql = "";
            if(ruleId == 4){
                ruleSql = "UPDATE cadence_degree_bounce_list SET rule_id="+ruleId+",rule_status='stop' WHERE DATEDIFF(CURRENT_DATE,date_created)="+days+" and student_id='"+studentId+"' and rule_status='active'";
            }else{
                ruleSql = "UPDATE cadence_degree_bounce_list SET rule_id="+ruleId+" WHERE DATEDIFF(CURRENT_DATE,date_created)="+days+" and student_id='"+studentId+"' and rule_status='active'";
            }
            //console.log("QQ4:",ruleSql);
            mysqlService.query(ruleSql)
            .then(function(response){
                resolve("success");
            },function(err){  
                if (err) {
                    var error = err;
                    error.status = 503;
                    return reject(error)
                };
            });
        })
    }
    // End Degree Bounce Cadence Email

    return {
        emailMatchingCandenceList: emailMatchingCandenceList,
        emailDegreebounceCandenceList: emailDegreebounceCandenceList
    }
})();
  
module.exports = degreeCandenceEmail;