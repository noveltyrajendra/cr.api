let messageEmail=(function() {
  let emailConstant=require('../constants/emailConstant');
  let config = require('../config');
  const { getMilitaryStatusGroup } = require('../utils/commonUtils');

  function resetPasswordEmail(password)
  {
    
    let htmlBody = "";
    htmlBody += "<b>"+emailConstant.RESET_PASSWORD_SUBJECT+"</b><br>";
    htmlBody += "<p>This is an automated response notifying you that your password has been reset. If you did not reset your password, please notify us at Information@HFAlliance.com.</p>";
    htmlBody += "<p>Your new password is: "+password+"<br>";
    htmlBody += "<p>To change your password once logged in, please go to 'settings' in upper right corner of your screen. <a href='"+config.DOMAIN_URL+"'>"+config.DOMAIN_URL+"</a><br>";
    htmlBody += "<br>Thank you,<br>College Recon";

    return htmlBody;
  }

  function veteranEmailMessage(){
    let htmlBody = "";
    htmlBody += "<b>"+emailConstant.NEW_VETERAN_REGISTER_SUBJECT+"</b><br>";
    htmlBody += "<b>WELCOME TO COLLEGERECON.COM</b>";
    htmlBody += "<p>Your account is now active! Begin conducting reconnaissance on colleges across the nation and directly connect with decision makers at your selected schools.</p>";
    htmlBody += "<p>Be sure to complete your profile so that you are able to promote yourself and inform colleges and universities of all that you have accomplished. Your profile offers you the chance to leave a lasting first impression on schools that will be conducting their own recon on you—if you choose to allow them to do so.</p>";
    htmlBody += "<p>CollegeRecon is the world’s first college-search and connection platform designed specifically for those who’ve served, those currently serving, and their families.</p>";
    htmlBody += "<p>- Your team at CollegeRecon</p>";
    return htmlBody;
  }

  function welcomeNewCollege(){
    let htmlBody = "";
    //htmlBody += "<b>"+emailConstant.NEW_COLLEGE_EMAIL_SUBJECT+"</b><br>";
    htmlBody += "<p>Thank you for requesting administrative access to your school's account on CollegeRecon.<br><br>Our team has received your information and we are processing your request immediately. We will contact you within 24 hours (normal business hours) to provide you with your log-in information.<br><br>We look forward to connecting with you and educating you on how CollegeRecon works to introduce your school and program offerings to military-connected students around the world.</p>";
    htmlBody += "<br>Thank you,<br>College Recon";
    return htmlBody;
  }

  function newCollegeSupportEmail(contact_name, college_name, college_email, college_state, college_contact_number){
    let htmlBody = "";
    htmlBody = "<p>A new college administrator has requested access to College Recon.</p> <b>Administrator's Name:</b>&nbsp;"+contact_name+"<br> <b>College Name:</b>&nbsp;"+college_name+"<br> <b>Email Address:</b>&nbsp;"+college_email+"<br> <b>College State:</b>&nbsp;"+college_state+"<br> <b>Contat Phone Number:</b>&nbsp;"+college_contact_number+"<br>"
    return htmlBody;
  }

  function basicEmailTemplate(content){
    let htmlBody = "";
    htmlBody += "<b>"+emailConstant.NEW_REPLY_VETERAN_MESSAGE+"</b><br>";
    htmlBody += content;
    return htmlBody;
  }

  function basicReplyEmailTemplate(content){
    let htmlBody = "";
    htmlBody += content;
    return htmlBody;
  }

  function emailHeaderSection() {
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
    return emailContent;
  }

  function veteranRegistrationMessage(militaryStatus) {
    let status = getMilitaryStatusGroup(militaryStatus);
    let emailContent = "";
    let statusType = "";
    let pdfLink = config.AWS_PDF_RESOURCE;
    if(status == "active"){
      statusType = "Active Duty";
      pdfLink = pdfLink+"guide-active-duty.pdf";
    }else if(status == "veteran"){
      statusType = "Veteran";
      pdfLink = pdfLink+"guide-veteran.pdf";
    }else{
      statusType = "Spouse";
      pdfLink = pdfLink+"guide-military-spouse.pdf";
    }
    const headerSection = emailHeaderSection();
    emailContent+= headerSection;
   
    emailContent += '<h3 style="text-align:center;">'+statusType+' Education Guide</h3>';
    emailContent += '<hr> <div style="text-align:center;"><p class="text-contain"><i>Was this email forwarded to you?</i> </p><p class="text-contain"><i><a href="https://lp.constantcontactpages.com/su/u7jjN8N?mode=preview&source_id=08ad768b-0976-474b-9840-003fb0378884&source_type=em&c=${Contact.encryptedContactId}" target="_blank">Sign up to receive</a> the latest on top colleges for the military free to your inbox!</i></p></div><hr>';
    emailContent += '<p>Garrett,</p>';
    emailContent += '<p>Thank you for signing up with CollegeRecon!  We’re excited to provide this guide to help you accomplish your education and career goals!</p>';
    emailContent += '<p><b>Download CollegeRecon’s</b> <a style="color:#2a9df4;" href="'+pdfLink+'" target="_blank">'+statusType+' Education Guide</a></p>';
    emailContent += '<p>Keep track of Important information and documents you may need by creating your <a style="color:#2a9df4;" href="https://app.collegerecon.com/login" target="_blank">CollegeRecon profile</a> today. When you’re ready, you can securely message schools to ask about programs you’re interested in and the benefits provided via your profile. </p>';
    emailContent += '<p>Sincerely,</p><p>CollegeRecon</p><p><hr></p>';
    emailContent += '<p style="font-weight:bold;">Get all the latest military & veteran discounts delivered to your inbox for free by <a href="https://www.mymilitarybenefits.com/discounts-newsletter/?utm_campaign=ColR_July52023&utm_medium=email&utm_source=newsletter" target="_blank" style="color:#333;"> subscribing to our Discounts Newsletter.</a></p>';
    emailContent += '<p style="font-weight:bold;">For info on all the benefits earned in service, please visit <a href="https://www.mymilitarybenefits.com/?utm_campaign=ColR_July52023&utm_medium=email&utm_source=newsletter" target="_blank" style="color:#333;">MyMilitaryBenefits.com</a><br>For education and transition info, please visit <a href="https://collegerecon.com/?utm_campaign=ColR_July52023&utm_medium=email&utm_source=newsletter" target="_blank" style="color:#333;">CollegeRecon.com</a></p>';
    emailContent += '<p><a href="https://www.facebook.com/CollegeRecon/" target="_blank" style="color:#2a9df4;">Facebook Link</a><p></p><a href="https://www.linkedin.com/company/colleger/" target="_blank" style="color:#2a9df4;">LinkedIn Link</a></p>';
    
    emailContent += '</div></body></html>';
    return  basicReplyEmailTemplate(emailContent);
  }

  return{
    resetPasswordEmail:resetPasswordEmail,
    veteranEmailMessage:veteranEmailMessage,
    welcomeNewCollege:welcomeNewCollege,
    newCollegeSupportEmail:newCollegeSupportEmail,
    basicEmailTemplate: basicEmailTemplate,
    basicReplyEmailTemplate: basicReplyEmailTemplate,
    emailHeaderSection: emailHeaderSection,
    veteranRegistrationMessage: veteranRegistrationMessage
  }

})();

module.exports=messageEmail;