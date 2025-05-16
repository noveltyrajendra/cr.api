let scholarshipFollowEmail = (function() {
    let moment =require('moment');
    let mysqlService=require('./services/mysqlService');
    let emailService=require('./services/emailService');
    let stringUtil = require('./utils/stringUtil');
    let emailConstant=require('./constants/emailConstant');
    let messageEmail = require('./utils/messageEmail');
    let messageEncryption = require('./utils/base64Utility');
    let config = require('./config');

    async function veteranFollowEmail(){
        let veteranList = await getAllscholarShipVeteran('followup');
        for(let i=0;i<veteranList.length;i++){
        //for(let i=0;i<2;i++){
           let result= await getFollowUpScholarship(veteranList[i].student_id, veteranList[i].email);
           //console.log("Student :",veteranList[i].student_id+" Result:"+result)
        }
    }

    async function getFollowUpScholarship(studentId, email){
        return new Promise(function(resolve, reject) {
            let sql = "SELECT ums.*,sl.deadline,DATEDIFF(sl.deadlinedate,CURRENT_DATE) as days,sl.scholarship_name FROM user_matched_scholarship as ums LEFT JOIN scholarship_list as sl ON ums.scholarship_id=sl.id WHERE sl.status='active' and ums.scholarship_requested='yes' and ums.student_id='"+studentId+"' ORDER BY sl.deadlinedate";
            mysqlService.query(sql)
            .then(async function(response){
                if(response.length > 0){
                    let followData = [];
                    for (let i = 0; i < response.length; i++) {
                        if(response[i].days == 7 || response[i].days == 14 || response[i].days == 30){
                            followData.push({id:response[i].scholarship_id,name:response[i].scholarship_name,deadline:response[i].deadline,nodays:response[i].days});
                        }
                    }
                    //console.log("followData:",followData);
                    if(followData.length < 1){
                        resolve("success");
                    }
                    let followMess = "";
                    if(followData.length > 0){
                        followMess = await sendFollowupEmailNotification(studentId, email, followData);
                    }else{
                        followMess = "success";
                    } 
                    
                    if(followMess == "success"){
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

    async function sendFollowupEmailNotification(studentId, email, followupData){
        return new Promise(function(resolve, reject) {
            let unsubscribeId = messageEncryption.encodeBase64("sid:"+studentId+"&type:followup");
		    let unsubscribeUrl = config.DOMAIN_URL+"/email/unsubscribe/"+unsubscribeId;
            let profileUrl = config.DOMAIN_URL+"/login?uid="+studentId;
            let emailcontent = "";
            let subject = "Important scholarship updates";
            emailcontent+="<div style='text-align:center;'><span><img src='https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png' width='150px' /></span></div><p>Important updates on scholarships you are following.<p>";
            emailcontent+="<p>The deadline for the following scholarship(s) is approaching. Make sure that you’ve completed the application process before the deadline date.<p>";
            emailcontent+="<ul>"
            for (let i = 0; i < followupData.length; i++) {
                let params = messageEncryption.encodeBase64(studentId + "#" + followupData[i].id);
                let scholarUrl = config.DOMAIN_URL + "/login?scholarship=" + params;
                emailcontent+="<li><a href='"+scholarUrl+"'><b>"+followupData[i].name+"</b></a> &nbsp;&nbsp;&nbsp;&nbsp;  <span>Deadline Date:"+followupData[i].deadline+"</span></li>";
            }    
            emailcontent+="</ul>";
            emailcontent+="<p>Some dates are subject to change. You may want to check the dates for any scholarships you are interested in pursuing to make sure you don’t miss out.<p>";
            emailcontent+="<p>You can visit your <a href='"+profileUrl+"'>profile</a> to see your matching scholarships and those that you’ve followed.<p>";
            emailcontent+="<p>Thanks,<br>Team CollegeRecon</p>";
            emailcontent+="<p style='text-align:center;font-size:12px;'><i><a href='"+unsubscribeUrl+"' target='_blank'>Unsubscribe</a> to no longer receive scholarship emails</i></p>";
            //console.log("SI:",studentId+" EC:"+emailcontent);
            let message = messageEmail.basicReplyEmailTemplate(emailcontent);
            //console.log("SE:",email);
            let to = [email];
            let from = "CollegeRecon <"+emailConstant.INFORMATION_EMAIL+">";
            emailService.sendEmail(from, to, subject, message).then(function (eresponse) {
                if(eresponse == "success"){
                    for (let i = 0; i < followupData.length; i++) {  
                        let scholarData = {
                            student_id: studentId,
                            scholarship_id: followupData[i].id,
                            followup_type : followupData[i].nodays+"days"
                        }
                        saveQuery = `INSERT INTO scholarship_followup_email SET ?`;
                        mysqlService.query(saveQuery,scholarData)
                                .then(function (response) {
                            if(i == followupData.length-1){
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

    async function veteranMatchingEmail(){
        let veteranList = await getAllscholarShipVeteran('matching');
        for(let i=0;i<veteranList.length;i++){
        //for(let i=0;i<1;i++){
           let result= await getMatchingScholarship(veteranList[i].student_id, veteranList[i].email);
           //console.log("Student :",veteranList[i].student_id+" Result:"+result)
        }
    }

    async function getMatchingScholarship(studentId, email){
        return new Promise(function(resolve, reject) {
            let sql = "SELECT ums.*,DATEDIFF(sl.deadlinedate,CURRENT_DATE) as days,sl.scholarship_name FROM user_matched_scholarship as ums LEFT JOIN scholarship_list as sl ON ums.scholarship_id=sl.id WHERE sl.status='active' and ums.scholarship_requested='no' and ums.student_id='"+studentId+"' ORDER BY sl.deadlinedate";
            mysqlService.query(sql)
            .then(async function(response){
                if(response.length > 0){
                    let arrThiry = [];
                    for (let i = 0; i < response.length; i++) {
                        if(response[i].days == 30){
                            arrThiry.push({id:response[i].scholarship_id,name:response[i].scholarship_name});
                        }
                    }
                    //console.log("30:",arrThiry);
                    if(arrThiry.length < 1){
                        resolve("success");
                    }
                    let thirtyMess = "";
                    if(arrThiry.length > 0){
                        thirtyMess = await sendMatchingEmailNotification(studentId, email, arrThiry);
                    }else{
                        thirtyMess = "success";
                    }
                    if(thirtyMess == "success"){
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

    async function sendMatchingEmailNotification(studentId, email, arrThiry){
        return new Promise(function(resolve, reject) {
            let unsubscribeId = messageEncryption.encodeBase64("sid:"+studentId+"&type:matching");
		    let unsubscribeUrl = config.DOMAIN_URL+"/email/unsubscribe/"+unsubscribeId;
            let profileUrl = config.DOMAIN_URL+"/login?uid="+studentId;
            let emailcontent = "";
            let subject = "Matching scholarship updates";
            emailcontent+="<div style='text-align:center;'><span><img src='https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png' width='150px' /></span></div><p>Here are the latest updates regarding your matching scholarships.<p>";
            emailcontent+="<ul>"
            for (let i = 0; i < arrThiry.length; i++) {
                let params = messageEncryption.encodeBase64(studentId + "#" + arrThiry[i].id);
                let scholarUrl = config.DOMAIN_URL + "/login?scholarship=" + params;
                emailcontent+="<li><a href='"+scholarUrl+"'>"+arrThiry[i].name+"</a></li>";
            }
            emailcontent+="</ul>";
            emailcontent+="<p>REMINDER: You can select to FOLLOW certain scholarships to be reminded of important deadlines.  You will be alerted about any new matching scholarships that become available.</p>";
            emailcontent+="<p>In order to follow scholarships, click your <a href='"+profileUrl+"'>profile</a> link. Within the Scholarships section of your profile, you may click to follow scholarships to be reminded of important deadlines and updates.</p>";
            emailcontent+="<p>Thanks,<br>Team CollegeRecon</p>";
            emailcontent+="<p style='text-align:center;font-size:12px;'><i><a href='"+unsubscribeUrl+"' target='_blank'>Unsubscribe</a> to no longer receive scholarship emails</i></p>";
            //console.log("SI:",studentId+" EC:"+emailcontent);
            let message = messageEmail.basicReplyEmailTemplate(emailcontent);
            //console.log("SE:",email);
            let to = [email];
            let from = "CollegeRecon <"+emailConstant.INFORMATION_EMAIL+">";
            emailService.sendEmail(from, to, subject, message).then(function (eresponse) {
                //resolve(eresponse);
                if(eresponse == "success"){
                    for (let i = 0; i < arrThiry.length; i++) {  
                        let scholarData = {
                            student_id: studentId,
                            scholarship_id: arrThiry[i].id
                        }
                        saveQuery = `INSERT INTO scholarship_matching_email SET ?`;
                        mysqlService.query(saveQuery,scholarData)
                                .then(function (response) {
                            if(i == arrThiry.length-1){
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

    async function getAllscholarShipVeteran(type){
        return new Promise(function(resolve, reject) {
            let ruleSql = "SELECT distinct(sd.student_id),ss.email from scholarship_data as sd LEFT JOIN students as ss ON sd.student_id=ss.uuid where ss.user_account_status='active' and sd.student_id not in (SELECT student_id from scholarship_unsubscribe WHERE unsubscribe_type='"+type+"')";
            //console.log("QQ:",ruleSql);
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

    async function autoUpdateScholarship(){
        return new Promise(function(resolve, reject) {
            let ruleSql = "SELECT id,scholarship_name,recurring_event,deadline,open_date,DATEDIFF(deadlinedate,CURRENT_DATE) as days FROM scholarship_list WHERE status='active' and DATEDIFF(deadlinedate,CURRENT_DATE) < 0";
            //console.log("UU:",ruleSql);
            mysqlService.query(ruleSql)
            .then(async function(response){
                if(response.length > 0){
                    updateMess = await updateExpireScholarship(response);
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

    async function updateExpireScholarship(expData){
        for(let i=0;i<expData.length;i++){
            if(i == expData.length-1){
                if(expData[i].recurring_event == "yes"){
                    return await updateRecurringScholarship(expData[i].id,expData[i].deadline,expData[i].open_date);
                }else{
                    return await updateNormalScholarship(expData[i].id);
                }
            }else{
                if(expData[i].recurring_event == "yes"){
                    await updateRecurringScholarship(expData[i].id,expData[i].deadline,expData[i].open_date);
                }else{
                    await updateNormalScholarship(expData[i].id);
                }
            }
        }
    }

    async function updateRecurringScholarship(scholarshipId,deadline,openDate){
        return new Promise(function(resolve, reject) {
            // Deadline data update
            let newDeadline = "";
            let deadlineArr = deadline.split("/");
            let updateDeadline = parseInt(deadlineArr[deadlineArr.length-1])+1;
            if(deadlineArr.length == 2){
                newDeadline = deadlineArr[0]+"/"+updateDeadline;
            }
            if(deadlineArr.length == 3){
                newDeadline = deadlineArr[0]+"/"+deadlineArr[1]+"/"+updateDeadline;
            }
            //console.log("hee:",openDate);
            // Open data update
            let newOpenDate = "";
            if(openDate){
                let openArr = openDate.split("/");
                let updateOpen = parseInt(openArr[openArr.length-1])+1;
                if(openArr.length == 2){
                    newOpenDate = openArr[0]+"/"+updateOpen;
                }
                if(openArr.length == 3){
                    newOpenDate = openArr[0]+"/"+openArr[1]+"/"+updateOpen;
                }
            }
            //console.log("newDeadline:",newDeadline);
            //console.log("newOpenDate:",newOpenDate);
            let ruleSql = "";
            if(openDate){
                ruleSql = "UPDATE scholarship_list SET deadline='"+newDeadline+"',open_date='"+newOpenDate+"',deadlinedate=DATE_ADD(deadlinedate, INTERVAL 1 YEAR),opendate=DATE_ADD(opendate, INTERVAL 1 YEAR) WHERE id="+scholarshipId;
            }else{
                ruleSql = "UPDATE scholarship_list SET deadline='"+newDeadline+"',deadlinedate=DATE_ADD(deadlinedate, INTERVAL 1 YEAR) WHERE id="+scholarshipId;
            }
            //console.log("QQ:",ruleSql);
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

    async function updateNormalScholarship(scholarshipId){
        return new Promise(function(resolve, reject) {
            let ruleSql = "UPDATE scholarship_list SET status='expire' WHERE id="+scholarshipId;
            //console.log("QQ:",ruleSql);
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

    return {
        veteranFollowEmail: veteranFollowEmail,
        veteranMatchingEmail: veteranMatchingEmail,
        autoUpdateScholarship: autoUpdateScholarship
    }

})();
  
module.exports = scholarshipFollowEmail;