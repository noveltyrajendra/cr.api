let savedschoolFollowEmail = (function () {
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

    const savedSchoolSentEmail = async () => {
        let veteranList = await mysqlService.query("select student_id as studentId,saved_date from users_saved_colleges where saved_date >= CURRENT_DATE and is_first='yes' and student_id not in (select student_id from followup_savedschool_list)");
        //console.log("QQ:", veteranList)
        if(veteranList.length > 0){
            for(let i=0;i<veteranList.length;i++){
                await sentSavedSchoolEmail(veteranList[i],"email");
            }
        }else{
            return "success";
        }
    }

    const savedSchoolFollowup = async () => {
        let veteranList = await mysqlService.query("SELECT distinct(usc.student_id) as studentId,DATEDIFF(CURRENT_DATE,usc.date_created) as days,ss.email from followup_savedschool_list as usc LEFT JOIN students as ss ON usc.student_id=ss.uuid where ss.user_account_status='active' and usc.student_id not in (SELECT student_id from student_unsubscribe WHERE unsubscribe_type='saved_school') and DATEDIFF(CURRENT_DATE,usc.date_created) in(4,10,17)");
        //console.log("VV:", veteranList)
        if(veteranList.length > 0){
            for(let i=0;i<veteranList.length;i++){
                await sentSavedSchoolEmail(veteranList[i],"followup");
            }
        }else{
            return "success";
        }
    }

    const savedSchoolLastFollowup = async () => {
        let veteranList = await mysqlService.query("select fsl.student_id as studentId from followup_savedschool_list as fsl left join users_saved_colleges as usc on fsl.student_id=usc.student_id where usc.saved_date >= fsl.rule_date and fsl.rule_id=3 and usc.is_first='no' and fsl.student_id not in (select student_id from student_unsubscribe WHERE unsubscribe_type='saved_school')");
        //console.log("QQ:", veteranList)
        if(veteranList.length > 0){
            for(let i=0;i<veteranList.length;i++){
                await sentSavedSchoolEmail(veteranList[i],"last");
            }
        }else{
            return "success";
        }
    }

    const sentSavedSchoolEmail = async (emailData, type) => {
		const studentInfo = await mysqlService.query("SELECT ss.first_name,ss.last_name,ss.email,sp.state,sp.military_status from students as ss left join student_profile as sp on ss.uuid=sp.uuid WHERE ss.uuid = '"+ emailData.studentId +"'");
        //console.log("SS:", studentInfo)
		const featuredSchool = await collegeService.getBounceBackAdvertise(studentInfo[0].state);
		/*const matchedSchool = await mysqlService.query("SELECT umc.college_id,umc.matched_percent,cc.college_name,cc.college_alias from users_matched_colleges as umc left join colleges as cc on umc.college_id=cc.id WHERE student_id = '"+ emailData.studentId +"'");*/
        let savedSql = "SELECT cc.college_name,cc.contact_email,cc.phone_number,cp.college_logo,convert(cast(convert(cp.overview using latin1) as binary) using utf8) as overviewtext,cc.website,cp.veteran_affairs_attn,cc.college_alias from users_saved_colleges as usc left join colleges as cc on usc.college_id=cc.id left join college_profiles as cp on usc.college_id=cp.college_id WHERE usc.student_id='"+ emailData.studentId +"' and usc.is_delete='No'";
        if(type == "last"){
            savedSql+= " order by usc.saved_date desc";
        }
        //console.log("saveQ:", savedSql);
		const savedSchoolInfo = await mysqlService.query(savedSql);
        let ruleId = 0;
        if(type == "followup"){
            switch(emailData.days){
                case 4:
                    ruleId = 1;
                    break; 
                case 10:
                    ruleId = 2;
                    break;
                case 17:
                    ruleId = 3;
                    break;
            }
        }
        if(type == "last"){
            ruleId = 4;
        }
		const emailTemplate = await getSavedSchoolEmailTemplate(emailData, studentInfo[0], featuredSchool, savedSchoolInfo, ruleId);
		//console.log("TT - "+ruleId+":", emailTemplate)
		const from = "CollegeRecon <"+emailConstant.INFORMATION_EMAIL+">";
		const to = [studentInfo[0].email];
		//const to = ["shivaram@noveltytechnology.com"];
		let subject = "Saved school(s) for you";
        if(ruleId == 2){
            subject = "Find schools saved for you";
        }else if(ruleId == 3){
            subject = "Last chance to view saved schools";
        }else if(ruleId == 4){
            subject = "Additional saved schools email";
        }
        //console.log("Subject:", subject);
		const messageContent = messageEmail.basicReplyEmailTemplate(emailTemplate);
		await emailService.sendEmail(from,to,subject,messageContent);
        if(ruleId == 0){
            let followupData = {
                student_id: emailData.studentId,
                college_id: 0,
                rule_id: 0,
                rule_status: "active",
                date_created: emailData.saved_date,
                rule_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
            }
            let checkData = await mysqlService.query("select count(id) as total from followup_savedschool_list where student_id='"+emailData.studentId+"'");
            //console.log("CC:", checkData);
            if(checkData && checkData[0].total == 0){
                await mysqlService.query("INSERT INTO followup_savedschool_list SET ?", followupData);
            }
        }else{
            let updateQry = "UPDATE followup_savedschool_list set rule_id="+ruleId+" where student_id='"+emailData.studentId+"'";
            await mysqlService.query(updateQry);
        }
		return "success";
	}

	async function getSavedSchoolEmailTemplate(emailData, studentInfo, adData, savedSchoolInfo, ruleId) {
		const profileUrl = config.DOMAIN_URL+"/login?uid=" + emailData.studentId;
		const unsubscribeId = messageEncryption.encodeBase64("uid:"+emailData.studentId+"&type:saved_school");
		const unsubscribeUrl = config.DOMAIN_URL+"/email/unsubscribe/"+unsubscribeId;
		const encryptedUuid = messageEncryption.encodeBase64("uid:"+emailData.studentId);
		const requestInfoUrl = config.DOMAIN_URL+"/requestInfo?" + encryptedUuid;
		
		let emailContent = "";
		emailContent += '<!DOCTYPE html><html><head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8"><meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1">';
		emailContent += '<style>body {font-family: "Source Sans Pro", sans-serif;color: #333;}';
		emailContent += '.header-section {margin-bottom: 20px;}';
		emailContent += '.college-info {border-spacing: 0;margin-bottom: 80px; border-collapse: collapse;}';
		emailContent += '.yellowcolor {background-color: #fec231;} .college-info tr th{font-weight: 700;border-bottom: 10px solid #ffffff;background-color: #fbfbfb;} .college-info tr td{padding: 10px;} .college-info {width: 100%;margin-bottom: 10px;}';
		emailContent += '.college-ad td,th {border: 0;margin: 0 !important;padding: 10px 10px;text-align: center;}';
		emailContent += '.college-info td,th {/* border: 0; */margin: 0 !important;padding: 10px 20px;text-align: center;border-bottom: 5px solid #efefef;min-height: 40px;}';
		emailContent += '.text-contain {font-size: 14px;} p {font-size: 16px;}';
		emailContent += '.criteria{width: 100%;margin-bottom: 20px;} .college-detail{padding-left: 0;}';
		emailContent += '.college-detail li{list-style: none;display: inline-block;margin-right: .8rem;}';
		emailContent += '.edit-degree{padding: .5rem;background-color: #f5f5f5;} .list-direction{list-style-type:decimal}';
		emailContent += 'ul.list-direction-dash {list-style-type: none;} .list-direction-dash>li {text-indent: -5px;margin-bottom: 10px;}'
		emailContent += '.list-direction-dash>li:before {content: "-";text-indent: -5px;}'
		emailContent += '.list-direction li{margin-bottom: 10px;} .header-section1{clear: both;margin-bottom: 10px;}';
		emailContent += '.college-ad td span img{ width: 80px;} .table-collapse{border-collapse: collapse;} .table-collapse tr{background-color: #f5f5f5;border-bottom: 3px solid #fffcfc;} .request-info{background: #fec231; padding: 10px; font-weight: bold; text-transform: uppercase; white-space: nowrap; border-radius: 2px;}';
		emailContent += '@media only screen and (max-width:768px) { .d-xs-none {display: none !important;}}.unsubscribe{text-align: center;font-size: 12px;font-style: italic;}';
		emailContent += '</style></head><body><div class="body-section "><table align="center"><tr><td style="text-align: center;"><span><img src="https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png" width="200px" /></span></td></tr></table>';
        if(ruleId == 1 || ruleId == 3){
            emailContent += '<h3 style="text-align:left;font-weight:normal;">Have you reached out to your saved schools yet?  Schools can often help you understand your benefits and what applies to you.  There’s no commitment on your part by contacting the schools you have saved today!</h3>';
        }
        if(ruleId == 2){
            emailContent += '<h3 style="text-align:left;font-weight:normal;">Have you reached out to your saved schools yet?</h3>';
        }
		emailContent += '<div style="margin-top: 2.5rem;"><h2 style="display:inline-block;width:82%; margin: 0;padding: 10px 0px 20px 0px;">Featured Schools</h2><table width="100%" align="left" class="college-ad table-collapse" style="background-color: #f5f5f5;clear: both; padding:.5rem;margin-bottom: 24px;">';
		emailContent += `<thead></thead><tbody>`;
		const featureSchool = [];
		for (let adSchool of adData.slice(0,2)) {
			featureSchool.push(adSchool)
			let tadvLink = config.DOMAIN_URL+"/"+adSchool.collegeAlias+'?'+emailConstant.FEATURE_SCHOOL_TRACKER;
			emailContent += '<tr ><td width="10%" style="text-align: left;padding-bottom: 10px;"><a href="'+tadvLink+'"><span><img src="' + adSchool.collegeLogo + '" width="80px"/></span></a></td>';
			emailContent += '<td style="text-align: left;padding-bottom: 10px;"><a href="'+tadvLink+'" style="color:#333333;text-decoration:none;"><span style="display:block;font-weight: bold;">' + adSchool.college_name + '</span></a>';
			emailContent += `<span style="display:block; font-size: 0.8rem">${adSchool.collegeDesc}</span></td></tr>`
		}
		emailContent += '</tbody></table></div><!-- ad college -->';
        if(ruleId == 0){
		    emailContent += '<h3 style="text-align:left;font-weight:normal;">Thanks for saving the following schools:</h3>';
        }
        if(ruleId == 4){
		    emailContent += '<h3 style="text-align:left;font-weight:normal;">Thanks for saving schools to your profile:</h3>';
        }
		emailContent += '<div style="padding-top: 1rem;"><h2 style="margin: 0;padding: 10px 0px 5px 0px;">Saved School</h2><table width="100%" align="left" class="college-ad" style="clear: both; margin-bottom: 10px;"><tbody>';
		for (let saveSchool of savedSchoolInfo) {
			let savedSchoolUrl = config.DOMAIN_URL+"/"+saveSchool.college_alias;
			let overview = "";
			if(saveSchool.overviewtext){
				overview = truncatehtml(saveSchool.overviewtext, 300, { stripTags: true });
			}
			let collegeLogo = "";
			if(saveSchool.college_logo){
				collegeLogo = config.AWS_IMAGE_RESOURCE_COLLEGE + saveSchool.college_logo;
			}
			emailContent += '<tr><td width="10%" style="text-align: left;"><a href="'+savedSchoolUrl+'"><span><img src="'+collegeLogo+'" width="80px"/></span></a></td><td style="text-align: left;"><a href="'+savedSchoolUrl+'" style="color:#333333;text-decoration:none;"><span style="display:block;font-weight: bold;">'+saveSchool.college_name+'</span></a><p style="font-size:12px">'+overview+'</p><p>Contact Info</p><p style="font-size:12px">';
			if(saveSchool.veteran_affairs_attn){
				emailContent += saveSchool.veteran_affairs_attn+'<br>';
			}
			emailContent += '<a href="mailto:'+saveSchool.contact_email+'">'+saveSchool.contact_email+'</a><br>';
			if(saveSchool.phone_number){
				emailContent += saveSchool.phone_number+'<br>';
			}
			emailContent += '<a href="mailto:'+saveSchool.website+'">'+saveSchool.website+'</a></p></td></tr>';
		}
		emailContent += '</tbody></table>';
        if(ruleId == 0){
            emailContent += '<p>Are you unsure about your benefits or what to ask a school?</p>';
        }
        if(ruleId == 2){
            emailContent += '<p>Schools can often help you understand your benefits and what applies to you.  There’s no commitment on your part by contacting the schools you have saved today!</p>';
        }
        if(ruleId == 0 || ruleId == 1 || ruleId == 2){
            emailContent += '<ul>';
            emailContent += await militaryStatusLink(studentInfo.military_status);
            emailContent += '<li><a href="https://collegerecon.com/know-your-education-benefits/" style="color:#333333;text-decoration:none;">Know Your Education Benefits</a></li>';
            emailContent += '<li><a href="https://collegerecon.com/questions-student-veterans-ask-college-admissions/" style="color:#333333;text-decoration:none;">12 Questions Veterans and Military  Need to Ask College Admissions Reps</a></li></ul>';
        }
        if(ruleId == 0){
		    emailContent += '<p>Schools can often help you understand your benefits and what applies to you.  There’s no commitment on your part by contacting the schools you have saved today!</p>';
        }
        if(ruleId == 4){
            emailContent += '<p>Schools can often help you understand your benefits and what applies to you.  There’s no commitment on your part by contacting the schools you have saved!</p>';
            emailContent += '<div style="padding-left:60px"><p><i>Did you know?</i></p><p><i>You can compare schools right from the school profiles.  Just click “Compare To!”</i></p><p><i>You can see how well a school matches your needs!  Just click on “View Matching Score!” on the school profile.</i></p></div>';
        }
		emailContent += '</div>';
		emailContent += '<div class="unsubscribe"><span><a href="'+unsubscribeUrl+'">Unsubscribe</a> to no longer receive saved school emails</span></div>';
		emailContent += '</div></body></html>';
		return emailContent;
    }

	const militaryStatusLink = async (militaryStatus) => {
		let links = "";
		if(militaryStatus.toLowerCase() == "active"){
			links = "<li><a href='https://mymilitarybenefits.com/benefits/ultimate-guide-gi-bill-benefits/' style='color:#333333;text-decoration:none;'>Active Duty Education Benefits Guide</a></li>";
		}else if(militaryStatus.toLowerCase() == "veteran"){
			links = "<li><a href='https://mymilitarybenefits.com/education/veteran-education-benefits-guide/' style='color:#333333;text-decoration:none;'>Veterans Education Benefits Guide</a></li>"
		}else if(militaryStatus.toLowerCase() == "spouse" || militaryStatus.toLowerCase() == "dependent"){
			links = "<li><a href='https://collegerecon.com/post-9-11-gi-bill-guide-for-spouses-and-dependents/' style='color:#333333;text-decoration:none;'>Spouses and Dependents</a></li>"
		}else if(militaryStatus.toLowerCase() == "guard" || militaryStatus.toLowerCase() == "reserve"){
			links = "<li><a href='https://collegerecon.com/national-guard-reserve-education-benefits/' style='color:#333333;text-decoration:none;'>National Guard & Reserve</a></li>"
		}
		return links;
	}

    return {
        savedSchoolSentEmail,
        savedSchoolFollowup,
        savedSchoolLastFollowup
    }
})();

module.exports = savedschoolFollowEmail;