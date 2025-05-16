let requestinfoFollowEmail = (function () {
    const moment = require('moment');
    const mysqlService = require('./services/mysqlService');
    const emailService = require('./services/emailService');
    const stringUtil = require('./utils/stringUtil');
    const emailConstant = require('./constants/emailConstant');
    const messageEmail = require('./utils/messageEmail');
    const messageEncryption = require('./utils/base64Utility');
    const collegeService = require('./services/collegeService');
    const config = require('./config');
    const requestlogger = require('./utils/requestInfoLog');
    const truncatehtml  = require('truncate-html');

    const requestInfoSentEmail = async () => {
        let veteranList = await mysqlService.query("select distinct(student_id) as studentId from recon_messages where date_created >= CURRENT_DATE and student_id not in (SELECT student_id from student_unsubscribe WHERE unsubscribe_type='request_info')");
        //console.log("QQ:", veteranList)
        if(veteranList.length > 0){
            for(let i=0;i<veteranList.length;i++){
                await sentRequestInfoEmail(veteranList[i].studentId);
            }
        }else{
            return "success";
        }
        //await sentRequestInfoEmail('2238BB-B83A75-5D8BC4-21C2');
    }

    const sentRequestInfoEmail = async (studentId) => {
        const studentInfo = await mysqlService.query("SELECT ss.first_name,ss.email,sp.state from students as ss left join student_profile as sp on ss.uuid=sp.uuid WHERE ss.uuid = '"+ studentId +"'");
        const requestCollegeInfo = await mysqlService.query("select cc.college_name,cc.access_level,cc.college_alias,cc.phone_number,cc.contact_email,cc.website,cp.veteran_affairs_phone,cp.veteran_affairs_email,cp.veteran_affairs_website,cp.college_logo from recon_messages as rm left join colleges as cc on rm.college_id=cc.id left join college_profiles as cp on rm.college_id=cp.college_id where rm.date_created >= CURRENT_DATE and rm.student_id='"+ studentId +"' order by rm.date_created asc");
        const featuredSchool = await collegeService.getBounceBackAdvertise(studentInfo[0].state);
        const emailTemplate = await getRequestInfoEmailTemplate(studentInfo[0], requestCollegeInfo, featuredSchool, studentId);
        //console.log("TT:", emailTemplate);
        const from = "CollegeRecon <"+emailConstant.INFORMATION_EMAIL+">";
		const to = [studentInfo[0].email];
        const subject = "Confirming your information request";
        const messageContent = messageEmail.basicReplyEmailTemplate(emailTemplate);
        await emailService.sendEmail(from,to,subject,messageContent);
        let requestData = {
            email_id: studentId,
            email_type: "student",
            rule_type: "requestinfo",
            rule_data: "daily"
        }
        await mysqlService.query("INSERT INTO cronjob_email_log SET ?", requestData);
        return "success";
    }

    const getRequestInfoEmailTemplate = async (studentInfo, requestCollegeInfo, featuredSchool, studentId) => {
        const profileUrl = config.DOMAIN_URL+"/login?uid=" + studentId;
        const unsubscribeId = messageEncryption.encodeBase64("uid:"+studentId+"&type:request_info");
		const unsubscribeUrl = config.DOMAIN_URL+"/email/unsubscribe/"+unsubscribeId;
        let emailContent = "";
   
        const headerSection = messageEmail.emailHeaderSection();
        emailContent+= headerSection;
        emailContent += '<p>Dear '+studentInfo.first_name+',</p>';
        emailContent += '<h3 style="text-align:left;font-weight:normal;">';
        emailContent += '<p>Thank you for registering with CollegeRecon. The school(s) you requested info about appear below.</p><p>Please review their <a href="'+profileUrl+'">profile</a> as they assign a team member to get back to you. Schools will generally get back to you within 24 to 48 hours.</p> <p>If you want to talk to someone sooner, a school member can assist you if you contact them immediately. Their contact info appears below. It’s a great idea to talk to the school to get your questions answered. There is no obligation for you to apply.</p></h3>';
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
        emailContent += '<div style="padding-top: 1rem;"><h2 style="display:inline-block;width:82%; margin: 0;padding: 10px 0px 20px 0px;">Request Info Schools</h2><table width="100%" align="left" class="college-ad" style="clear: both; margin-bottom: 10px;"></tbody>';
        for (let collegeInfo of requestCollegeInfo) {
            const collegeUrl = config.DOMAIN_URL+"/"+collegeInfo.college_alias;
            const collegeLogo = config.AWS_IMAGE_RESOURCE_COLLEGE+collegeInfo.college_logo;
            const cwebsite = (collegeInfo.website.indexOf('http') !== -1 || collegeInfo.website.indexOf('https://') !== -1) ? (collegeInfo.website.trim()) : 'http://' + collegeInfo.website;
            const vetWebsite = (collegeInfo.veteran_affairs_website.indexOf('http') !== -1 || collegeInfo.veteran_affairs_website.indexOf('https://') !== -1) ? collegeInfo.veteran_affairs_website : 'http://' + collegeInfo.veteran_affairs_website;
            emailContent += '<tr><td width="10%" style="text-align: center;"><a href="'+collegeUrl+'"><span><img src="'+collegeLogo+'" width="80px"/></span></a></td>';
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
            
            emailContent += '</td></tr>';
        }
        emailContent += '</tbody></table></div>';
        emailContent += '<p>Sincerely,</p><p>CollegeRecon</p>';
        emailContent += '<div class="unsubscribe"><span><a href="'+unsubscribeUrl+'">Unsubscribe</a> to no longer receive Request Info emails</span></div>';
        emailContent += '</div></body></html>';
        return emailContent;
    }

    return {
        requestInfoSentEmail
    }
})();

module.exports = requestinfoFollowEmail;