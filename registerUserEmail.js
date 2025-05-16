let registerUserEmail = (function() {
    const moment =require('moment');
    const mysqlService=require('./services/mysqlService');
    const collegeService=require('./services/collegeService');
    const emaillogger = require('./utils/collegeEmailLog');
    const reconMessageService = require('./services/reconMessageService');

    async function sendRegisterUserEmail(){
        emaillogger.log('info', "Call register paused email sender.");
        let resultData = await getAllStopEmailUserList();
        for(let i=0;i<resultData.length;i++){
            await getEmailInformationStudent(resultData[i]);
        }
    }

    async function getAllStopEmailUserList(){
        return new Promise(function(resolve, reject) {
            let ruleSql = "SELECT ss.uuid,ss.first_name,ss.email,sp.state,sp.level_id,sp.bucket_id,sp.secondary_bucket_id,sp.military_status,(SELECT title FROM levels where id=sp.level_id) as leveltext,ss.primary_source FROM students as ss LEFT JOIN student_profile as sp ON ss.uuid=sp.uuid WHERE ss.user_account_status='active' AND sp.level_id != 0 AND ss.date_created  between '2022-06-13 19:29:19' and '2022-06-16 10:12:23'";
                mysqlService.query(ruleSql)
                .then(function(response){
                    resolve(response);
                },function(err){  
                    if (err) {
                        let error = err;
                        error.status = 503;
                        return reject(error)
                    };
                });
            });
    }

    async function getEmailInformationStudent(data){
        let bucketText = "";
        let primaryData = await getBucketDataInfo("SELECT id,title FROM bucket_degree WHERE id in ("+data['bucket_id']+")");
        if(primaryData.length > 1){
            bucketText = primaryData.map(x=> x.name).join(',');
        }else{
            bucketText =  primaryData[0].name;
        }
        let secondaryData = await getBucketDataInfo("SELECT id,title FROM bucket_secondary_degree WHERE id in ("+data['secondary_bucket_id']+")");
        let bounceBackData = {
            "education_goal": String(data['level_id']),
            "area_focus_length": secondaryData.length,
            "college_id": 0,
            "state": data['state'],
            "bucket_id": data['bucket_id'],
            "website": "app",
            "area_focus_ids": data['secondary_bucket_id'],
            "military_status": data['military_status']
        };
        let secBucketDataToEmail = {
            areaOfFocus: secondaryData.map(x => x.name)
        }
        //let collegeData = await collegeService.getNewRegisteredMatchCollege(bounceBackData);
        let collegeData = await getNewRegisteredMatchCollege(data['uuid']);
        let completeData = [data['email'],data['first_name'],data['uuid'],data['state'],data['leveltext'],bucketText,secBucketDataToEmail,collegeData,'email',data['military_status']];
        let result = await collegeService.sendBackEmailToNewUser(completeData);
        emaillogger.log('info', "Match Email Sent to:"+data['first_name']+" UUID:"+data['uuid']+" -- Status:"+result);
        //Degree bounce email
        if(data['primary_source'] != 'scholarshipfinder'){
            let primaryArray = ['4','6','8','10','11','12','13','17','18','19'];
            if(primaryData.length > 1){
                for(let j=0;j<primaryData.length;j++){
                if(primaryArray.indexOf(String(primaryData[j].id)) > -1){
                    let bounceResult = await sendBounceBackEmail(String(primaryData[j].id),primaryData[j].name,data,secondaryData);
                }
                }
            }else{
                if(primaryArray.indexOf(data['bucket_id']) > -1){
                    let bounceResult = await sendBounceBackEmail(data['bucket_id'],primaryData[0].name,data,secondaryData);
                }
            }
        }
        
        return "success";
    }

    async function getBucketDataInfo(qry){
        return new Promise(function(resolve, reject) {
                mysqlService.query(qry)
                .then(function(response){
                    let bucketData =[];
                    for(i=0;i<response.length;i++){
                        bucketData.push({id:response[i].id,name:response[i].title});
                    }
                    resolve(bucketData)
                },function(err){  
                    if (err) {
                        let error = err;
                        error.status = 503;
                        return reject(error)
                    };
                });
            });
    }

    async function getNewRegisteredMatchCollege(uuid){
        return new Promise(function(resolve, reject) {
            let ruleSql = "SELECT cc.id,um.matched_percent as percentMatch,cc.college_name,cc.college_alias as collegeAlias FROM users_matched_colleges as um LEFT JOIN colleges as cc ON um.college_id=cc.id WHERE um.student_id='"+uuid+"'";
                mysqlService.query(ruleSql)
                .then(function(response){
                    resolve(response);
                },function(err){  
                    if (err) {
                        let error = err;
                        error.status = 503;
                        return reject(error)
                    };
                });
            });
    }

    async function sendBounceBackEmail(bucketId,bucketTitle,data,secondaryData){
        let bounceBackData = {
            "education_goal": String(data['level_id']),
            "area_focus_length": secondaryData.length,
            "college_id": 0,
            "state": data['state'],
            "bucket_id": bucketId,
            "website": "app",
            "area_focus_ids": data['secondary_bucket_id'],
            "military_status": data['military_status']
        };
        let bounceDegreeData = [bounceBackData,data['email'],data['first_name'],data['uuid'],bucketTitle,secondaryData.map(x=> x.name).join(','),'email'];
        let bounceResult = await collegeService.sendBackBucketDataEmailToNewUser(bounceDegreeData);
        emaillogger.log('info', "BounceDegree Email Sent to:"+data['first_name']+" UUID:"+data['uuid']+" -- Status:"+bounceResult);
        return bounceResult;
    }

    // Request Info Email sent to College contacts
    async function sendRequestInfoCollegeEmail(){
        emaillogger.log('info', "Call RequestInfo paused email.");
        let resultData = await getAllStopCollegeList();
        for(let i=0;i<resultData.length;i++){
            await getEmailInformationCollege(resultData[i]);
        }
    }

    async function getAllStopCollegeList(){
        return new Promise(function(resolve, reject) {
            let ruleSql = "select rm.student_id,rm.college_id,rm.message_id,rm.message,rm.attachment,cc.contact_email,cc.college_name from recon_messages as rm left join colleges as cc on rm.college_id=cc.id where rm.responder='user' and rm.recipient='college' and rm.date_created between '2022-06-12 15:18:55' and '2022-06-16 10:12:23'";
                mysqlService.query(ruleSql)
                .then(function(response){
                    resolve(response);
                },function(err){  
                    if (err) {
                        let error = err;
                        error.status = 503;
                        return reject(error)
                    };
                });
            });
    }

    async function getEmailInformationCollege(data){
        let body = {
            studentId: data.student_id,
            collegeEmail: data.contact_email,
            collegeId: data.college_id,
            replyMessage: data.message,
            type: 'connect'
        }
        let connectResult = await reconMessageService.veteranReplyEmail(body,data.message_id,data.attachment,data.student_id,data.student_id,data.college_id);
        emaillogger.log('info', "College Email Sent to:"+data['college_name']+" CID:"+data['student_id']+" -- Status:"+connectResult);
        return connectResult;
    }


    return {
        sendRegisterUserEmail: sendRegisterUserEmail,
        sendRequestInfoCollegeEmail: sendRequestInfoCollegeEmail
    }
})();
module.exports = registerUserEmail;