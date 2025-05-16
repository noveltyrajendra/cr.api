let clientNagEmail = (function() {
    let moment =require('moment');
    let mysqlService=require('./services/mysqlService');
    let emailService=require('./services/emailService');
    let collegeService=require('./services/collegeService');
    let stringUtil = require('./utils/stringUtil');
    let nagEmailConstant=require('./constants/nagEmailConstant');
    let emailConstant=require('./constants/emailConstant');
    let messageEmail = require('./utils/messageEmail');
    let dataProcess = require('./utils/base64Utility');
    let messageEncryption = require('./utils/base64Utility');
    let config = require('./config');

    async function sendClientNagEmail(){
        //rules = await getAllNagEmailRule();
        nagEmailRule1 = await implementFirstNagRule();
        console.log("RR1::",nagEmailRule1);
        nagEmailRule2 = await implementSecondNagRule();
        console.log("RR2:",nagEmailRule2);
        nagEmailRule3 = await implementThirdNagRule();
        console.log("RR3:",nagEmailRule3);
        nagEmailRule4 = await implementFourthNagRule();
        console.log("RR4:",nagEmailRule4);
    }

    async function getAllNagEmailRule() {
        return new Promise(function(resolve, reject) {
        let ruleSql = "SELECT * FROM nag_email_rule";
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

    async function implementFirstNagRule() {
        console.log("Implement first rule.");
        return new Promise(function(resolve, reject) {
            let nag1Qry="CALL nagEmailList (3,0)";
            mysqlService.query(nag1Qry)
            .then(async function(response){
                if(response && response[0].length == 0){
                    resolve("Empty");
                }
                for(const item of response[0]){
                    if(item.is_subscribed == "Yes"){
                        await sendNagEmail(item,1,'You have new messages waiting');
                    }
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

    async function implementSecondNagRule() {
        console.log("Implement second rule.");
        return new Promise(function(resolve, reject) {
            let nag2Qry="CALL nagEmailList (6,1)";
            mysqlService.query(nag2Qry)
            .then(async function(response){
                if(response && response[0].length == 0){
                    resolve("Empty");
                }

                for(const item of response[0]){
                    if(item.is_subscribed == "Yes"){
                        await sendNagEmail(item,2,'Messages awaiting your reply');
                    }
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

    async function implementThirdNagRule() {
        console.log("Implement third rule.");
        return new Promise(function(resolve, reject) {
            let nag3Qry="CALL nagEmailList (9,2)";
            mysqlService.query(nag3Qry)
            .then(async function(response){
                if(response && response[0].length == 0){
                    resolve("Empty");
                }

                for(const item of response[0]){
                    if(item.is_subscribed == "Yes"){
                        await sendNagEmail(item,3,'Messages received and awaiting your reply');
                    }
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

    async function implementFourthNagRule() {
        console.log("Implement fourth rule.");
        return new Promise(function(resolve, reject) {
            let nag4Qry="CALL nagEmailList (12,3)";
            mysqlService.query(nag4Qry)
            .then(async function(response){
                if(response && response[0].length == 0){
                    resolve("Empty");
                }

                for(const item of response[0]){
                    if(item.is_subscribed == "Yes"){
                        await sendNagEmail(item,4,'Final Reminder: Respond to colleges now');
                    }
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
    
    function sendNagEmail(student,nagRuleId,subject1){
        return new Promise(function(resolve, reject) {
                //let enData = dataProcess.encodeBase64(student.student_id);
                let from = emailConstant.NO_REPLY_EMAIL;
                let to = [student.veteran_email];
                //let to = ['shivaram@noveltytechnology.com'];
                // let subject = "Reminder: messages received from colleges awaiting reply";
                let subject = subject1;
                /*let message = messageEmail.basicEmailTemplate("This is "+days+" days nag email content.\n For Unsubscription click <a href='"+config.DOMAIN_URL+"?sid="+enData+"' target='_blank'>here</a>");*/
                collegeService.getFeatureSchools(student.student_id).then(function(fresponse) {
                    let message = messageEmail.basicReplyEmailTemplate(getMessagesEmailContent(nagRuleId,student.veteran_name,student.student_id,student.schools,fresponse));
                    let replyto = "";
                    emailService.sendEmail(from,to,subject,message,replyto).then(function(response1){
                        //resolve("success");
                        console.log("Email:",response1);
                        if(response1 == "success"){
                            nagEmailData = {
                                nag_email_rule_id : nagRuleId,
                                student_id:student.student_id,
                                college_id:student.school_ids, 
                                message:message,
                                loop_count:1,
                                message_date:moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                            }
                            mysqlService.query(nagEmailConstant.SAVE_SYSTEM_MESSAGE, nagEmailData)
                                .then(function(response2){
                                    //console.log("Save:",response2);
                                    resolve("success");
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
                            console.log("ERR:",err);
                        };
                    });
                }, function(err) {
                    var error = err;
                    error.status = 503;
                    return reject(error);
                });
            });
    }

    async function stopNagEmailSubscription(studentId) {
        return new Promise(function(resolve, reject) {
        let ruleSql = "UPDATE students SET nag_email_subscription='No' WHERE uuid='"+studentId+"'";
            mysqlService.query(ruleSql)
            .then(function(response){
                console.log("Stop:",studentId);
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

    function getMessagesEmailContent(nagId,name,studentId,schools,featuredSchools){
        let vetProfileUrl = config.DOMAIN_URL+"/login?uid="+studentId;
        let unsubscribeLink = config.DOMAIN_URL+"/email/subscription/"+messageEncryption.encodeBase64(studentId);
        let emailContent = "";
        let featuredSchoolsList = "";
        if(featuredSchools.length > 0){
            featuredSchoolsList += '<div><h3 style="margin: 0;padding: 15px 0px 5px 0px;">Featured Schools</h3><table width="100%" align="left" class="college-ad table-collapse" style="background-color: #f5f5f5;clear: both; padding:.5rem;margin-bottom: 24px;">';
            if(featuredSchools[0].college_name){
                let tadvLink = config.DOMAIN_URL+"/"+featuredSchools[0].collegeAlias+'?'+emailConstant.FEATURE_SCHOOL_TRACKER;
                featuredSchoolsList += '<tr ><td width="10%" style="text-align: left;padding-bottom: 10px;"><a href="'+tadvLink+'"><span><img src="' + featuredSchools[0].collegeLogo + '" width="80px"/></span></a></td>';
				featuredSchoolsList += '<td style="text-align: left;padding-bottom: 10px;"><a href="'+tadvLink+'" style="color:#333333;text-decoration:none;"><span style="display:block;font-weight: bold;">' + featuredSchools[0].college_name + '</span></a></td></tr>';
            }
            if(featuredSchools.length > 1 && featuredSchools[1].college_name){
                let tadvLink1 = config.DOMAIN_URL+"/"+featuredSchools[1].collegeAlias+'?'+emailConstant.FEATURE_SCHOOL_TRACKER;
                featuredSchoolsList += '<tr><td colspan="2" style="border-bottom: 1px solid #ffffff;"></td></tr>';
                featuredSchoolsList += '<tr ><td width="10%" style="text-align: left;padding-bottom: 10px;"><a href="'+tadvLink1+'"><span><img src="' + featuredSchools[1].collegeLogo + '" width="80px"/></span></a></td>';
				featuredSchoolsList += '<td style="text-align: left;padding-bottom: 10px;"><a href="'+tadvLink1+'" style="color:#333333;text-decoration:none;"><span style="display:block;font-weight: bold;">' + featuredSchools[1].college_name + '</span></a></td></tr>';
            }
            featuredSchoolsList += '</tbody></table></div>';
        }
        if(nagId == 1){
            emailContent += featuredSchoolsList;
            emailContent += name+",<br><br>";
            emailContent += "Thank you for signing up with CollegeRecon and congratulations on taking the next steps toward earning your degree. Whether you’re looking for a certificate, associates, undergraduate or graduate degree, we can help you find the school that best fits your needs.<br><br>";
            emailContent += "This message is to notify you that "+schools+" have responded to your “request for information.” You can see these messages in your email inbox and reply directly from your email or login to your account on CollegeRecon <a href='"+vetProfileUrl+"' target='_blank'>here</a> to see your online profile and review your messages.<br><br>";
            emailContent += "If you’re not sure what to ask your list of schools next, please take a look at some suggestions below:<br><br>";
            emailContent += "Questions to Ask Veteran Counselors <br>";
            emailContent += "<ol><li>Does your school participate in the Yellow Ribbon program?  Which programs?</li><li>Do you have a full time, on campus Veteran counselor? If so, how do I contact them?</li><li>Do you offer ACE college credits for military experience? Do you award credit for the DSST and/or CLEP exams?</li><li>What is your policy for accepting transfer credits from other colleges?</li><li>What other programs or scholarships does your school provide for the military community?</li></ol>";
            emailContent += "If you have any questions, please don’t hesitate to reach out to us at CollegeRecon!<br><br><br>";
            emailContent += "Thank you,<br><br>";
            emailContent += "CollegeRecon Team<br>Information@HFAlliance.com<br><br>";
            emailContent += "<a href='"+unsubscribeLink+"' target='_blank'><i><small>Unsubscribe from CollegeRecon Reminder Emails</small></i></a>";
        }else if(nagId == 2){
            emailContent += featuredSchoolsList;
            emailContent += name+",<br><br>";
            emailContent += "You have messages waiting in your CollegeRecon inbox. This message is to notify you that "+schools+" have responded to your “request for information.”<br><br>";
            emailContent += "You can see these messages in your email inbox and reply directly from your email or login to your account on CollegeRecon <a href='"+vetProfileUrl+"' target='_blank'>here</a> to see your online profile and review your messages.<br><br><br>"
            emailContent += "Thank you,<br><br>";
            emailContent += "CollegeRecon Team<br>Information@HFAlliance.com<br><br>";
            emailContent += "<a href='"+unsubscribeLink+"' target='_blank'><i><small>Unsubscribe from CollegeRecon Reminder Emails</small></i></a>";
        }else if(nagId == 3){
            emailContent += featuredSchoolsList;
            emailContent += name+",<br><br>";
            emailContent += "This is a reminder that you have messages waiting in your CollegeRecon inbox from schools you have requested information from. "+schools+" have responded to your “request for information” and is waiting for your feedback.<br><br>";
            emailContent += "You can see these messages in your email inbox and reply directly from your email or login to your account on CollegeRecon <a href='"+vetProfileUrl+"' target='_blank'>here</a>  to see your online profile and review your messages.<br><br><br>";
            emailContent += "Thank you,<br><br>";
            emailContent += "CollegeRecon Team<br>Information@HFAlliance.com<br><br>";
            emailContent += "<a href='"+unsubscribeLink+"' target='_blank'><i><small>Unsubscribe from CollegeRecon Reminder Emails</small></i></a>";
        }else{
            emailContent += featuredSchoolsList;
            emailContent += name+",<br><br>";
            emailContent += "This is a final reminder that you have messages waiting in your CollegeRecon inbox from schools you have requested information from.<br><br>";
            emailContent += "You can see these messages in your email inbox and reply directly from your email or login to your account on CollegeRecon <a href='"+vetProfileUrl+"' target='_blank'>here</a> to see your online profile and review your messages.<br><br><br>"
            emailContent += "Thank you,<br><br>";
            emailContent += "CollegeRecon Team<br>Information@HFAlliance.com<br><br>";
            emailContent += "<a href='"+unsubscribeLink+"' target='_blank'><i><small>Unsubscribe from CollegeRecon Reminder Emails</small></i></a>";
        }
        return emailContent;
    }
    

    return {
        sendClientNagEmail: sendClientNagEmail
      }
})();
  
module.exports = clientNagEmail;