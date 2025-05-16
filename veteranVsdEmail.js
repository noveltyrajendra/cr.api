let veteranVsdEmail = (function() {
    let moment =require('moment');
    let mysqlService=require('./services/mysqlService');
    let emailService=require('./services/emailService');
    let stringUtil = require('./utils/stringUtil');
    let emailConstant=require('./constants/emailConstant');
    let messageEmail = require('./utils/messageEmail');
    let config = require('./config');

    async function sendVeteranVsdEmail(){
        let resultData = await getAllActiveVeteranList();
        //console.log("CD:",resultData);
        for(let i=0;i<resultData.length;i++){
            //if(i==0){
                await getEmailInformationVeteran(resultData[i]);
                /*if(i == resultData.length -1){
                    console.log("Send Email Completed.");
                }*/
            //}
        }

    }

    async function getAllActiveVeteranList(){
        return new Promise(function(resolve, reject) {
            let ruleSql = "SELECT c.contact_email,cp.veteran_affairs_email FROM colleges as c left join college_profiles as cp on c.id=cp.college_id WHERE c.status='active' order by c.id ASC";
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

    async function getEmailInformationVeteran(udata){
        return new Promise(function(resolve, reject) {
            let message = "";
            let emailContent = "";
            let subject = "Veteran Services Director Email.";
            let sendEmail = "";
            if(udata.veteran_affairs_email){
                sendEmail = udata.veteran_affairs_email;
            }else if(udata.contact_email){
                sendEmail = udata.contact_email;
            }
            let to = [sendEmail];
            //let to = ['shivaram@noveltytechnology.com','ramesh@noveltytechnology.com','bill@hfalliance.com','garrett@hfalliance.com'];
            let from = emailConstant.NO_REPLY_EMAIL;
            emailContent = getReviewEmailContent();
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

    function getReviewEmailContent(){
        let emailContent = "";
        let dUrl = config.DOMAIN_URL;
        emailContent += '<!DOCTYPE html><html><head><style>body{font-family: "Source Sans Pro", sans-serif;color: #333;}.header-section {text-align: center;margin-bottom: 20px;}.text-contain {font-size: 14px;}p {font-size: 18px;}.body-section {margin: 20px 10%;}</style></head><body>';
        emailContent += '<div class="body-section">';
        emailContent += '<p style="text-align: center; margin-bottom: 46px;"><img src="https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png" width="195px" /></p>';
        emailContent += '<div class="text-contain">';
        emailContent += "<h2>Student Veterans of America (SVA) Partners with CollegeRecon to Help Inform Veterans’ Enrollment Decisions</h2>";
        emailContent += '<p>SVA has partnered with CollegeRecon to provide student veterans with first-hand accounts of the experience of other veterans at campuses to which they are considering enrolling.</p>';
        emailContent += '<h2>Qualitative Meets Quantitative</h2>';
        emailContent += '<p>The recently launched, and first-of-its-kind <a href="https://app.collegerecon.com/college/review">School Rater</a> tool will allow current and former students to rate the school they attended based on their personal assessment of how well the institution supports the needs of veteran and military students. In addition, it asks the important question, “would you recommend this school to other veterans?”</p>';
        emailContent += '<p>“We recognized that CollegeRecon already provided rich data on schools to help members of the military community make informed decisions about their education," SVA National President and CEO Jared Lyon said. "What we together saw missing was the personal component that would provide a more complete picture by merging qualitative and quantitative data."</p>';
        emailContent += '<h2>SCHOOL RATING EXAMPLE</h2>';
        emailContent += '<p style="text-align: center; margin:20px 0"> <img src="http://cr-staging.collegerecon.com/assets/img/review-rate.png" alt=""></p>';
        emailContent += '<h2>Paying It Forward</h2>';
        emailContent += '<p>As a Veteran Services Director, you’re in a unique position to help contribute to future service member and student veterans’ success. While this is something you’re already doing, with the School Rater tool you can drive more students to assess your school, thus providing valuable information for future classes of student veterans.</p>';
        emailContent += '<h2>More About the School Rater Tool</h2>';
        emailContent += '<p>This <a href="https://app.collegerecon.com/college/review">School Rater</a> data will be made available to future students to help inform their decisions about which schools are postured to help position them for future success. The ratings include four areas of measurement:</p>';
        emailContent += '<ul style="font-size: 18px;"><li>admissions process and experience</li><li>academic support</li><li>veteran and military support</li><li>overall level of recommendation</li></ul>';
        emailContent += '<p>Users are also able to freely enter in a more in-depth review if they wish to provide additional input.<p>';
        emailContent += '<h2>SCHOOL RATER TOOL</h2>';
        emailContent += '<p style="text-align: center; margin:20px 0"><img src="http://cr-staging.collegerecon.com/assets/img/rates-school.png" alt=""></p>';
        emailContent += '<p>You can view the ratings for schools that have already received them at <a href="https://app.collegerecon.com">https://app.collegerecon.com</a>, though not all schools have ratings yet.  For an example of a school that has already received reviews, please go <a href="https://app.collegerecon.com/college/san-diego-state-university">here</a> and view the “Reviews” tab.</p>';
        emailContent += '<h2>LEARN MORE</h2>';
        emailContent += '<p>If you would like to learn more about the School Rater tool or how you can partner with CollegeRecon, please visit our <a href="https://collegerecon.com/partnerships">Partnerships<a> page.</p>';
        emailContent += '</div></div></body></html>';
        return emailContent;
    }

    return {
        sendVeteranVsdEmail: sendVeteranVsdEmail
      }
})();
  
module.exports = veteranVsdEmail;