let collegeEmailSend = (function() {
    let moment =require('moment');
    let mysqlService=require('./services/mysqlService');
    let emailService=require('./services/emailService');
    let stringUtil = require('./utils/stringUtil');
    let emailConstant=require('./constants/emailConstant');
    let messageEmail = require('./utils/messageEmail');
    let messageEncryption = require('./utils/base64Utility');
    let config = require('./config');
    let emaillogger = require('./utils/collegeEmailLog');

    async function sendCollegeOccassionalEmail(){
        let resultData = await getAllActiveCollegeList();
        //console.log("CD:",resultData);
        for(let i=0;i<resultData.length;i++){
            //if(i==0){
                await getEmailInformationCollege(resultData[i]);
                /*if(i == resultData.length -1){
                    console.log("Send Email Completed.");
                }*/
            //}
        }

    }

    async function getAllActiveCollegeList(){
        return new Promise(function(resolve, reject) {
            let ruleSql = "SELECT c.id,c.college_name,c.college_alias,c.seo_name,c.contact_email,cp.college_logo,cc.admission_email_address_1,cc.admission_email_address_2,cc.vet_affairs_email_address,cc.marketing_email_address1,cc.marketing_email_address_2,cc.unsubscribe_contact_email,cc.unsubscribe_admission_email1,cc.unsubscribe_admission_email2,cc.unsubscribe_vet_affairs_email,cc.unsubscribe_marketing_email1,cc.unsubscribe_marketing_email2 FROM colleges as c inner join college_profiles as cp on c.id=cp.college_id inner join college_contacts cc  on cc.college_id=c.id where c.monthly_email_subscription='Yes' and (c.contact_email != '' or cc.admission_email_address_1 !='' or cc.admission_email_address_2 != '' or cc.vet_affairs_email_address != '' or cc.marketing_email_address1 != '' or cc.marketing_email_address_2 != '') and c.status='ACTIVE' and c.id not in (2281,2282,2312) order by c.id ASC";
            //console.log("QQ:",ruleSql);
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

    async function getEmailInformationCollege(data){
        return new Promise(function(resolve, reject) {
            collegeEmail = data['contact_email'];
            collegeName = data['college_name'];
            emaillogger.log('info', "Email sending to:"+collegeName);
            let from = "CollegeRecon <"+emailConstant.INFORMATION_EMAIL+">";
            let emailList = "";
            if(collegeEmail && collegeEmail != "" && data["unsubscribe_contact_email"] == 'no'){
                emailList+= collegeEmail+",";
            }
            if(data['admission_email_address_1'] && data['admission_email_address_1'] != '' && data["unsubscribe_admission_email1"] == 'no'){
                emailList+= data['admission_email_address_1'].trim()+",";
            }
            if(data['admission_email_address_2'] && data['admission_email_address_2'] != '' && data["unsubscribe_admission_email2"] == 'no'){
                emailList+= data['admission_email_address_2'].trim()+",";
            }
            if(data['vet_affairs_email_address'] && data['vet_affairs_email_address'] != '' && data["unsubscribe_vet_affairs_email"] == 'no'){
                emailList+= data['vet_affairs_email_address'].trim()+",";
            }
            if(data['marketing_email_address1'] && data['marketing_email_address1'] != '' && data["unsubscribe_marketing_email1"] == 'no'){
                emailList+= data['marketing_email_address1'].trim()+",";
            }
            if(data['marketing_email_address_2'] && data['marketing_email_address_2'] != '' && data["unsubscribe_marketing_email2"] == 'no'){
                emailList+= data['marketing_email_address_2'].trim()+",";
            }
            //console.log("emailList of "+collegeName+" :",emailList.slice(0,-1));
            listemailData = (emailList.slice(0,-1)).split(",");
            let to = [collegeEmail];
            let contantEmails = stringUtil.removeDuplicates(listemailData);
            let bccAddress = [];
            if(contantEmails.length > 1){
                bccAddress = contantEmails;
                if(collegeEmail){
                    if(contantEmails[0] == collegeEmail){
                        contantEmails.splice(0,1);
                    }
                }
            }

            let subject = "How the University of Cincinnati Online is building military enrollment and brand awareness";
            let messageContent = getEmailTemplateAppEmail(collegeName);
            //let messageContent = getEmailTemplateMonthlyReport(collegeName);
            //console.log("Bcc:",bccAddress);
            //console.log("To:",to);
            
            setTimeout(function() {
                emailService.sendEmail(from,to,subject,messageContent,'',bccAddress).then(function(response1){
                    if(response1 == "success"){
                        emaillogger.log('info', "Email sent to:"+collegeName);
                        resolve("success");
                    }else{
                        resolve("fail");
                    }
                },function(err){ 
                        if (err) {
                        var error = err;
                        error.status = 503;
                        console.log("ERR:",err);
                        emaillogger.log('ERR:', err);
                    };
                });
            }, 3000);
        });    
    }

    function getEmailTemplateMonthlyReport(collegeName){
        let emailContent = "";
        let imageUrl = "https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/map.jpg";
        emailContent += '<!DOCTYPE html><html><head><style>body {font-family: "Source Sans Pro", sans-serif;color:#333;}.header-italic{font-style:italic;}.header-section{text-align:center;}p{font-size:14px;}.body-section{margin: 20px 40px;}.center{display: block;margin-left: auto;margin-right: auto; width: 90%;}</style></head><body>';
        emailContent += '<div style="text-align:center;"><span><img src="https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png" width="195px" /></span></div>';
        emailContent += '<div class="header-section">';
        emailContent += '<h2>Recruit Veterans with CollegeRecon</h2></div>';
        emailContent += '<div class="body-section">';
        emailContent += '<p>Hello,</p>';
        emailContent += '<p>As the fall semester begins and colleges and universities look for new ways to recruit and market to attract students for the 2022 academic calendar and beyond, one of the most sought after demographics is the military and veteran community.</p>';
        emailContent += '<p class="header-italic">“How can I recruit veterans if they’re not near my school?”</p>';
        emailContent += '<p>The answer is veterans are everywhere.  They’re not just near military bases or one part of the country.  Here’s the most recent veteran population <a href="https://www.va.gov/vetdata/docs/Maps/VetPop16_PopCountyFY19.pdf">data</a> released by the VA that illustrates this point.</p>';
        emailContent += '<div style="margin: 20px 0px;">';
        emailContent += '<img src="'+imageUrl+'" class="center" alt="Veteran Population by County">';
        emailContent += '</div>';
        emailContent += '<p><a href="https://collegerecon.com/">CollegeRecon</a> speaks to the largest population of college-seeking, military-connected men and women in the country. We’ve helped hundreds of universities and tens-of-thousands of G.I. Bill beneficiaries over the years discover each other through our state-of-the-art technology solutions.</p>';
        emailContent += '<p>Is '+collegeName+' looking to begin recruiting G.I. Bill students? <b>We can help.</b></p>';
        emailContent += '<p>Is '+collegeName+' looking to expand your outreach efforts or try something new to engage with the military and veteran community? <b>We can help.</b></p>';
        emailContent += '<p>Is '+collegeName+' interested in learning about new ways to support your military-connected students once they arrive on campus? <b>We can help.</b></p>';
        emailContent += '<p>Is '+collegeName+' struggling with how to message your programs and offerings in a way that resonates with military-connected students? <b>We can help.</b></p>';
        emailContent += '<p><b>We can help your institution establish the necessary support services to service military-connected students, build a brand for years to come, and engage with prospective students looking to utilize their GI BIll and Tuition Assistance benefits.</b></p>';
        emailContent += '<p>Please contact us at the information below to schedule a meeting with our team.(<a href="mailto:Garrett@HFAlliance.com">Garrett@HFAlliance.com</a> or <a href="tel:414-350-6638">414-350-6638</a>)</p>';
        emailContent += '<p>Thank you for your time.</p>';
        emailContent += '<p>Sincerely,</p>';
        emailContent += '<p>Garrett FitzGerald<br>CEO<br>CollegeRecon.com</p>';
        emailContent += '</div>';
        emailContent += '</body> </html>';
        return(messageEmail.basicReplyEmailTemplate(emailContent));
    }

    function getEmailTemplateAppEmail(collegeName){
        let emailContent = "";
        emailContent += '<!DOCTYPE html><html><head><style>body {font-family: "Source Sans Pro", sans-serif;color:#333;}.header-italic{font-style:italic;}.header-section{text-align:center;}p{font-size:14px;}.body-section{margin: 20px 40px;}.center{display: block;margin-left: auto;margin-right: auto; width: 90%;}.yellow-btn{background-color: #fec231;border-radius: 4px;padding: 1rem 2rem;}.yellow-btn{color: #333 !important;font-size: 15px;font-weight:600;background-color: #fec231;border-radius: 4px;padding: 0.8rem 1rem;}.learn{padding-top:20px;text-align:center;}.thought{padding-left:40px;}</style></head><body>';
        emailContent += '<div style="text-align:center;"><span><img src="https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png" width="195px" /></span></div>';
        emailContent += '<div class="body-section">';
        emailContent += '<span>'+collegeName+',</span>';
        emailContent += '<p>In 2019, the University of Cincinnati approached CollegeRecon to assist in their military and veteran recruitment effort. The institution has been focused on improving military student experiences, establishing a comprehensive marketing plan and building multiple qualified admissions pipelines for military-connected students. CollegeRecon, the #1 military marketing platform for universities, has led the charge in this effort.</p>';
        emailContent += '<p class="thought">"We can honestly say that CollegeRecon is GOLDEN. CollegeRecon’s unique military platform, resources and active involvement in our program’s success is unparalleled. They get in front of the military audience better than a lot of our tactics because they are more experienced in that."&nbsp;&nbsp;- Brian Eck, UC Marketing</p>';
        emailContent += '<p>Please read our <a href="https://collegerecon.com/partnerships/case-studies/uc-online/?utm_source=corcn&utm_medium=email&utm_id=ucocase">brief case study</a> about the work CollegeRecon and UC have done over the last few years.</p>';
        emailContent += '<div class="learn"><a class="yellow-btn" href="https://collegerecon.com/partnerships/case-studies/uc-online/?utm_source=corcn&utm_medium=email&utm_id=ucocase">Learn More</a></div>';
        
        emailContent += '</div>';
        emailContent += '</body> </html>';
        return(messageEmail.basicReplyEmailTemplate(emailContent));
    }

    return {
        sendCollegeOccassionalEmail: sendCollegeOccassionalEmail
      }
    })();
  
module.exports = collegeEmailSend;