const { getCurrentDateInFormat } = require('./utils/momentUtility');
const { AWS_IMAGE_RESOURCE_COLLEGE } = require("./config");

let collegeMonthlyReport = (function () {
  let moment = require('moment');
  let mysqlService = require('./services/mysqlService');
  let emailService = require('./services/emailService');
  let dashboardService = require('./services/superAdminDashboardService');
  let stringUtil = require('./utils/stringUtil');
  let emailConstant = require('./constants/emailConstant');
  let messageEmail = require('./utils/messageEmail');
  let messageEncryption = require('./utils/base64Utility');
  let config = require('./config');
  let requestlogger = require('./utils/requestInfoLog');

  async function sendMonthlyReportCollege() {
    let resultData = await getAllActiveCollegeList();
    //console.log("CD:",resultData);
    for (let i = 0; i < resultData.length; i++) {
      //if(i==0){
      await getEmailInformationCollege(resultData[i]);
      /*if(i == resultData.length -1){
                    console.log("Send Email Completed.");
                }*/
      //}
    }
  }

  async function getAllActiveCollegeList() {
    return new Promise(function (resolve, reject) {
      let ruleSql =
        "SELECT c.id,c.college_name,c.college_alias,c.seo_name,c.contact_email,cp.college_logo,cc.admission_email_address_1,cc.admission_email_address_2,cc.vet_affairs_email_address,cc.marketing_email_address1,cc.marketing_email_address_2,cc.unsubscribe_contact_email,cc.unsubscribe_admission_email1,cc.unsubscribe_admission_email2,cc.unsubscribe_vet_affairs_email,cc.unsubscribe_marketing_email1,cc.unsubscribe_marketing_email2 FROM colleges as c inner join college_profiles as cp on c.id=cp.college_id inner join college_contacts cc  on cc.college_id=c.id where c.monthly_email_subscription='Yes' and (c.contact_email != '' or cc.admission_email_address_1 !='' or cc.admission_email_address_2 != '' or cc.vet_affairs_email_address != '' or cc.marketing_email_address1 != '' or cc.marketing_email_address_2 != '') and c.status='ACTIVE' and c.access_level != 'Patriot' order by c.id ASC";
      //console.log("QQ:",ruleSql);
      mysqlService.query(ruleSql).then(
        function (response) {
          //console.log("RR:",response);
          resolve(response);
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  async function getEmailInformationCollege(data) {
    let date = new Date();
    let onefirstDay = new Date(date.getFullYear(), date.getMonth() - 3, 1);
    let onelastDay = date.setMonth(date.getMonth() - 2, 0);
    let onedateFrom = moment(onefirstDay).format('YYYY-MM-DD');
    let onedateTo = moment(onelastDay).format('YYYY-MM-DD');
    let firstcollegeData = await getCollegeActivityReport(
      data['id'],
      onedateFrom,
      onedateTo
    );

    let date1 = new Date();
    let twofirstDay = new Date(date1.getFullYear(), date1.getMonth() - 2, 1);
    let twolastDay = date1.setMonth(date1.getMonth() - 1, 0);
    let twodateFrom = moment(twofirstDay).format('YYYY-MM-DD');
    let twodateTo = moment(twolastDay).format('YYYY-MM-DD');
    let secondcollegeData = await getCollegeActivityReport(
      data['id'],
      twodateFrom,
      twodateTo
    );

    let date2 = new Date();
    let threefirstDay = new Date(date2.getFullYear(), date2.getMonth() - 1, 1);
    let threelastDay = date2.setMonth(date2.getMonth(), 0);
    let threedateFrom = moment(threefirstDay).format('YYYY-MM-DD');
    let threedateTo = moment(threelastDay).format('YYYY-MM-DD');
    let thirdcollegeData = await getCollegeActivityReport(
      data['id'],
      threedateFrom,
      threedateTo
    );

    let profileViewTotal = 0;

    finalCollegeList = [
      ...firstcollegeData,
      ...secondcollegeData,
      ...thirdcollegeData,
    ];
    //console.log("FInal:",finalList);
    collegeId = data['id'];
    contactEmail = data['contact_email'];
    collegeLogo = data['college_logo'];
    collegeName = data['college_name'];
    collegeAlias = data['college_alias'];
    //let emailTemplate = await getEmailTemplateMonthlyReport(finalCollegeList,collegeLogo,collegeName,collegeId,collegeAlias);
    //let messageContent = messageEmail.basicReplyEmailTemplate(emailTemplate);
    let sendEmail = false;
    if (
      finalCollegeList[0]['searchboxtotal'] >= 3 ||
      finalCollegeList[1]['searchboxtotal'] >= 3 ||
      finalCollegeList[2]['searchboxtotal'] >= 3
    ) {
      sendEmail = true;
      profileViewTotal =
        (finalCollegeList[0]['searchboxtotal']
          ? finalCollegeList[0]['searchboxtotal']
          : 0) +
        (finalCollegeList[1]['searchboxtotal']
          ? finalCollegeList[1]['searchboxtotal']
          : 0) +
        (finalCollegeList[2]['searchboxtotal']
          ? finalCollegeList[2]['searchboxtotal']
          : 0);
    } else if (
      finalCollegeList[0]['scount'] > 0 ||
      finalCollegeList[1]['scount'] > 0 ||
      finalCollegeList[2]['scount'] > 0
    ) {
      sendEmail = true;
    }

    if (sendEmail) {
      result = await sendEmailtoCollege(
        finalCollegeList,
        contactEmail,
        collegeName,
        data,
        profileViewTotal
      );
      //console.log("Email sent to "+collegeName+":",result);
    }

    //console.log("Name:",data['collegeName']);
    //console.log("email:",contactEmail);
  }

  async function getCollegeActivityReport(collegeId, dateFrom, dateTo) {
    return new Promise(function (resolve, reject) {
      let ruleSql =
        "select YEAR('" +
        dateFrom +
        "') as year, MONTHNAME('" +
        dateTo +
        "') as month, max(t.noreply) as noreply, max(ct.cn) as searchboxtotal,(SELECT COUNT(id) as total FROM searchresult_colleges_tracking WHERE date(date_created)  BETWEEN '" +
        dateFrom +
        "' AND '" +
        dateTo +
        "' AND secondary_source = 'filter' AND c.id=college_id) as searchresult, count(distinct r.student_id) as scount,(SELECT COUNT(id) as total FROM searchresult_colleges_tracking WHERE date(date_created) BETWEEN '" +
        dateFrom +
        "' AND '" +
        dateTo +
        "' AND secondary_source = 'register' AND c.id=college_id) as savedschool from colleges c left JOIN (select college_id ,count(distinct student_id) as noreply from recon_messages a join ( SELECT college_id as col,message_id, max(date_created) as maxdate from recon_messages where  date(date_created) BETWEEN '" +
        dateFrom +
        "' AND '" +
        dateTo +
        "'  group by college_id,message_id) b  on a.college_id = b.col and a.message_id = b.message_id and a.date_created = b.maxdate where  a.responder = 'USER'GROUP by college_id) t on c.id = t.college_id left JOIN (SELECT  college_id,count(*) as cn FROM college_search_tracking where date(date_created) BETWEEN '" +
        dateFrom +
        "' AND '" +
        dateTo +
        "' and secondary_source in ('url','list') group by college_id) ct on c.id = ct.college_id LEFT JOIN recon_messages r on c.id = r.college_id and r.responder= 'USER' and date(r.date_created) BETWEEN '" +
        dateFrom +
        "' AND '" +
        dateTo +
        "' where c.status ='ACTIVE' and c.id=" +
        collegeId;
      //console.log("QQ:",ruleSql);
      mysqlService.query(ruleSql).then(
        function (response) {
          //console.log("RR:",response);
          resolve(response);
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  function getEmailTemplateMonthlyReport(
    collegeData,
    collegeLogo,
    collegeName,
    collegeId,
    collegeAlias,
    unsubId,
    profileViewTotal
  ) {
    //return new Promise(function(resolve, reject) {
    let unsubscribeLink =
      config.DOMAIN_URL +
      '/college/subscription/' +
      messageEncryption.encodeBase64('cid:' + collegeId + ':' + unsubId);
    let collegeUrl = config.DOMAIN_URL + '/' + collegeAlias;
    let webpageUrl =
      config.DOMAIN_URL +
      '/collegeactivity/report/' +
      messageEncryption.encodeBase64('cid:' + collegeId);
    //console.log("Wb:",webpageUrl);
    let emailContent = '';
    emailContent +=
      '<!DOCTYPE html><html><head><style>body {font-family: "Source Sans Pro", sans-serif;color:#333;}.header-section{text-align:center;margin-bottom:20px;}.college-info{border-spacing: 0;}.college-info thead{background-color: #004d72;color: #FFF;font-size:14px;}.yellowcolor{background-color: #fec231;}.college-info td,th{border: 1px solid #777;margin: 0 !important;padding: 10px 20px;text-align:center;}.text-contain{font-size:14px;}p{font-size:16px;}td span{color: #333 !important;}.body-section{margin: 20px 40px;}</style></head><body>';
    // if(collegeLogo){
    //     emailContent += "<div style='text-align:center;'><span><img src='"+config.AWS_IMAGE_RESOURCE_COLLEGE+collegeLogo+"' width='100px'/></span></div>";
    // }
    emailContent += '<p>Good morning,</p>';
    emailContent +=
      '<p>Did you know ' +
      collegeName +
      ' has a free profile on the #1 <a href="https://collegerecon.com/partnerships/?utm_source=corcn&utm_medium=email&utm_id=activeml">college directory</a> for prospective military and veteran students?</p>';
    emailContent +=
      '<p>With limited visibility, ' +
      collegeName +
      ' has been viewed ' +
      profileViewTotal +
      ' times in the last 90 days.</p>';
    emailContent +=
      '<p><span style="text-decoration: underline;">These figures represent your brand’s performance as a <b>non-partner school</b></span>. This is a small sample of what we deliver to universities who work with CollegeRecon. Depending on your recruitment strategy, we can deliver 250+ profile views in a single month. We can help build your veteran support programs, create a resonating brand and increase your communication with prospective G.I. students.<p>';
    emailContent += '<div class="header-section">';
    //emailContent += '<h1>Military and Veteran Engagement Report For<br>'+collegeName+'</h1>';
    emailContent +=
      '<span style="font-size:18px;"><b>Prepared by <img src="https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png" width="150px" /></b><br></span>';
    emailContent += '</div>';
    emailContent +=
      '<div><table align="center" class="college-info"><thead><tr><td></td><th>Profile Views</th><th>Appeared in Searches</th><th>Messages Received</th><th>Saved School</th></tr><thead><tbody>';
    //emailContent += '<div><table align="center" class="college-info"><thead><tr><td></td><th>Profile Views</th><th>Appeared in Searches</th><th>Saved School</th></tr><thead><tbody>';
    for (let i = 0; i < collegeData.length; i++) {
      //console.log("GG:",collegeData[i]["month"]);
      let ptotal = collegeData[i]['searchboxtotal']
        ? collegeData[i]['searchboxtotal']
        : 0;
      //let noreplyTotal = collegeData[i]["noreply"]?collegeData[i]["noreply"]:0;
      let gMonth = collegeData[i]['month'].toString().substr(0, 3);
      let gYear = collegeData[i]['year'].toString().substr(2, 4);
      //console.log("PP:",ptotal);
      emailContent +=
        '<tr><td class="yellowcolor">' +
        gMonth +
        '-' +
        gYear +
        '</td><td>' +
        ptotal +
        '</td><td>' +
        collegeData[i]['searchresult'] +
        '</td><td>' +
        collegeData[i]['scount'] +
        '</td><td>' +
        collegeData[i]['savedschool'] +
        '</td></tr>';
      //emailContent += '<tr><td class="yellowcolor">'+gMonth+'-'+gYear+'</td><td>'+ptotal+'</td><td>'+collegeData[i]["searchresult"]+'</td><td>'+collegeData[i]["savedschool"]+'</td></tr>';
    }
    emailContent += '</tbody></table></div>';
    emailContent += '<div class="body-section">';
    emailContent +=
      '<p><span style="font-size:14px;">* Having trouble viewing these figures? View as a <a href="' +
      webpageUrl +
      '" target="_blank">webpage</a> </span></p>';
    emailContent +=
      '<p><span style="font-size:14px;">* The above report’s key appears at the bottom of this email for reference.</span></p>';

    emailContent +=
      '<p>If you’re unfamiliar with <a href="https://collegerecon.com/partnerships/?utm_source=corcn&utm_medium=email&utm_id=activeml">CollegeRecon</a>, we’re the largest college discovery platform built exclusively for the U.S. veteran and military community. We work with hundreds of schools across the country to build brand awareness and direct engagement with students looking for your types of programs.</p>';
    emailContent +=
      '<p>We’re a trusted brand for universities looking for transparent and targeted marketing initiatives within the military community.</p>';
    emailContent +=
      '<p>If you’re interested in increasing your profile visibility, enhancing your brand awareness and speaking to thousands of potential military-connected students, we’re a great partner for you! To find out more, please visit <a href="https://collegerecon.com/partnerships/?utm_source=corcn&utm_medium=email&utm_id=activeml">CollegeRecon.com/partnerships</a>.</p>';
    emailContent += '<p>Thank you for your time and consideration!</p>';
    emailContent += '<p>Best,</p>';
    emailContent +=
      '<p> Garrett FitzGerald<br>CEO<br>CollegeRecon </p><br><br> <p> <span>* REPORT KEY:</span> </p>';
    emailContent +=
      '<p style="font-size:14px;"><b> Profile Views:</b> # of times your school profile was viewed (non partner schools can appear lower in search results)<br> <b>Appeared in Searches:</b> # of times your school appeared in CollegeRecon search results<br> <b>Messages Received:</b> # of times a user requested information from your school<br> <b>Saved School:</b> Number of times a user saved a school as a part of their search </p>';
    emailContent +=
      '<p style="text-align:center;font-size:12px;">Do you no longer want to receive this free monthly engagement report? <i><a href="' +
      unsubscribeLink +
      '" target="_blank">Unsubscribe Monthly Report</a></i></p>';

    emailContent += '<p></p>';
    emailContent += '</div></div>';
    emailContent += '</body> </html>';
    return messageEmail.basicReplyEmailTemplate(emailContent);
    //});
  }

  async function sendEmailtoCollege(
    finalCollegeList,
    collegeEmail,
    collegeName,
    data,
    profileViewTotal
  ) {
    return new Promise(function (resolve, reject) {
      let from = 'CollegeRecon <' + emailConstant.INFORMATION_EMAIL + '>';
      let emailList = '';
      if (
        collegeEmail &&
        collegeEmail != '' &&
        data['unsubscribe_contact_email'] == 'no'
      ) {
        emailList += '1:' + collegeEmail + ',';
      }
      if (
        data['admission_email_address_1'] &&
        data['admission_email_address_1'] != '' &&
        data['unsubscribe_admission_email1'] == 'no'
      ) {
        emailList += '2:' + data['admission_email_address_1'].trim() + ',';
      }
      if (
        data['admission_email_address_2'] &&
        data['admission_email_address_2'] != '' &&
        data['unsubscribe_admission_email2'] == 'no'
      ) {
        emailList += '3:' + data['admission_email_address_2'].trim() + ',';
      }
      if (
        data['vet_affairs_email_address'] &&
        data['vet_affairs_email_address'] != '' &&
        data['unsubscribe_vet_affairs_email'] == 'no'
      ) {
        emailList += '4:' + data['vet_affairs_email_address'].trim() + ',';
      }
      if (
        data['marketing_email_address1'] &&
        data['marketing_email_address1'] != '' &&
        data['unsubscribe_marketing_email1'] == 'no'
      ) {
        emailList += '5:' + data['marketing_email_address1'].trim() + ',';
      }
      if (
        data['marketing_email_address_2'] &&
        data['marketing_email_address_2'] != '' &&
        data['unsubscribe_marketing_email2'] == 'no'
      ) {
        emailList += '6:' + data['marketing_email_address_2'].trim() + ',';
      }
      //console.log("emailList of "+collegeName+" :",emailList.slice(0,-1));
      listemailData = emailList.slice(0, -1).split(',');
      //let to = [collegeEmail];
      let contantEmails = stringUtil.removeDuplicates(listemailData);
      let bccAddress = [];
      if (contantEmails.length > 1) {
        bccAddress = contantEmails;
        if (collegeEmail) {
          if (contantEmails[0] == collegeEmail) {
            contantEmails.splice(0, 1);
          }
        }
      }
      //console.log("BCC:",bccAddress)

      //let to = stringUtil.removeDuplicates(listemailData);;
      //console.log("LL:",to);
      //let to = ['shivaram@noveltytechnology.com','ramesh@noveltytechnology.com','garrett@hfalliance.com','bill@hfalliance.com'];
      let subject = 'Military & Veteran recruitment at ' + collegeName;
      //let subject = "";
      //console.log("EE:",contantEmails);
      //console.log("EE1:",contantEmails[0].length);
      //console.log("LL:",contantEmails.length);
      if (contantEmails.length > 0 && contantEmails[0] != '') {
        setTimeout(function () {
          // Logic for sending individual contact address email
          collegeId = data['id'];
          contactEmail = data['contact_email'];
          collegeLogo = data['college_logo'];
          collegeName = data['college_name'];
          collegeAlias = data['college_alias'];
          for (let i = 0; i < contantEmails.length; i++) {
            let emailInfo = contantEmails[i].split(':');
            let to = [emailInfo[1]];
            //getEmailTemplateMonthlyReport(finalCollegeList,collegeLogo,collegeName,collegeId,collegeAlias,emailInfo[0]).then(function (messageContent) {
            //console.log("EE:",messageContent);/
            let messageContent = getEmailTemplateMonthlyReport(
              finalCollegeList,
              collegeLogo,
              collegeName,
              collegeId,
              collegeAlias,
              emailInfo[0],
              profileViewTotal
            );
            emailService.sendEmail(from, to, subject, messageContent).then(
              function (response1) {
                //console.log("EE:",response1);
                //console.log("EE1:",response1['code']);
                if (response1['code'] == 'InvalidParameterValue') {
                  //console.log("Insert DB");
                  emailData = {
                    email_ids: to.join(),
                    college_id: data['id'],
                    college_name: collegeName,
                    message_date: moment(new Date()).format(
                      'YYYY-MM-DD HH:mm:ss'
                    ),
                  };
                  mysqlService
                    .query('INSERT INTO college_contact_fails SET ?', emailData)
                    .then(
                      function (response2) {
                        //console.log("Save:",response2);
                        resolve('success');
                      },
                      function (err) {
                        if (err) {
                          var error = err;
                          error.status = 503;
                          return reject(error);
                        }
                      }
                    );
                }
                if (response1 == 'success') {
                  resolve('success');
                  /*nagEmailData = {
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
                                });*/
                } else {
                  resolve('fail');
                }
              },
              function (err) {
                if (err) {
                  var error = err;
                  error.status = 503;
                  console.log('ERR:', err);
                }
              }
            );
          }
        }, 7000);
      } else {
        resolve('empty');
        //console.log("empty");
      }
    });
  }

  async function sendTestEmail() {
    let nagresult = await sendNagTestEmail();
    //let activityresult = await sendCollegeTestEmail();
  }

  async function sendNagTestEmail() {
    return new Promise(function (resolve, reject) {
      let from = 'CollegeRecon <' + emailConstant.INFORMATION_EMAIL + '>';
      //let to = [collegeEmail];
      let to = ['shivaram@noveltytechnology.com'];
      let subject = 'Test, here are your selected degree programs';
      let emailContent = '';
      emailContent +=
        '<div ><h3 style="margin: 0;padding: .5rem 0rem;">Featured Schools</h3><table width="100%" align="left" class="college-ad" style="background-color: #f5f5f5;clear: both; padding:.5rem;margin-bottom: 24px;border-collapse: collapse;"><thead></thead><tbody>';
      emailContent +=
        '<tr ><td width="10%" style="text-align: left;padding-bottom: 10px;"><a href="https://app.collegerecon.com/post-university/3451"><img src="https://api.collegerecon.com/college_images/3451_logo.jpg" width="80px" /></a> </td><td style="text-align: left;padding-bottom: 10px;"><a href="https://app.collegerecon.com/post-university---online" style="color:#333333;text-decoration:none;"><span style="display:block;font-weight: bold;">Post University - Online</span></a></td></tr>';
      emailContent += '</tbody></table></div>';
      let message = messageEmail.basicReplyEmailTemplate(emailContent);
      //let subject = "";
      emailService.sendEmail(from, to, subject, message).then(
        function (response1) {
          if (response1 == 'success') {
            resolve('success');
          } else {
            resolve('fail');
          }
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            console.log('ERR:', err);
          }
        }
      );
    });
  }

  async function sendCollegeTestEmail() {
    return new Promise(function (resolve, reject) {
      let from = emailConstant.INFORMATION_EMAIL;
      //let to = [collegeEmail];
      let to = ['shivaram@noveltytechnology.com'];
      let subject = 'Military Engagement Update for Test';
      let message = messageEmail.basicReplyEmailTemplate(
        'Hello<br><br>This is collegeactivity test email.<br><br>regards<br>test'
      );
      //let subject = "";
      emailService.sendEmail(from, to, subject, message).then(
        function (response1) {
          if (response1 == 'success') {
            resolve('success');
          } else {
            resolve('fail');
          }
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            console.log('ERR:', err);
          }
        }
      );
    });
  }

  async function sendCollegeContactEmail() {
    let resultData = await getAllActiveCollegeContactList();
    //console.log("CD:",resultData);
    for (let i = 0; i < resultData.length; i++) {
      //if(i==0){
      await getEmailInformationCollegeContacts(resultData[i]);
      /*if(i == resultData.length -1){
                    console.log("Send Email Completed.");
                }*/
      //}
    }
  }

  async function getAllActiveCollegeContactList() {
    return new Promise(function (resolve, reject) {
      let ruleSql =
        "SELECT c.id,c.college_name,c.seo_name,c.college_alias,c.contact_email,cc.admission_email_address_1,cc.admission_email_address_2,cc.vet_affairs_email_address,cc.marketing_email_address1,cc.marketing_email_address_2 FROM college_contacts cc left join colleges c  on cc.college_id=c.id where (c.contact_email != '' or cc.admission_email_address_1 !='' or cc.admission_email_address_2 != '' or cc.vet_affairs_email_address != '' or cc.marketing_email_address1 != '' or cc.marketing_email_address_2 != '') and c.status='ACTIVE' order by c.id ASC";
      mysqlService.query(ruleSql).then(
        function (response) {
          //console.log("RR:",response);
          resolve(response);
        },
        function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error);
          }
        }
      );
    });
  }

  async function getEmailInformationCollegeContacts(data) {
    let collegeId = data['id'];
    let collegeName = data['college_name'];
    let collegeSeoName = data['seo_name'];
    let collegeAlias = data['college_alias'];
    let emailTemplate = await getEmailTemplateCollegeContacts(
      collegeName,
      collegeAlias,
      collegeId
    );
    return new Promise(function (resolve, reject) {
      let collegeEmail = data['contact_email'];
      let emailList = '';
      if (collegeEmail && collegeEmail != '') {
        emailList += collegeEmail + ',';
      }
      if (
        data['admission_email_address_1'] &&
        data['admission_email_address_1'] != ''
      ) {
        emailList += data['admission_email_address_1'].trim() + ',';
      }
      if (
        data['admission_email_address_2'] &&
        data['admission_email_address_2'] != ''
      ) {
        emailList += data['admission_email_address_2'].trim() + ',';
      }
      if (
        data['vet_affairs_email_address'] &&
        data['vet_affairs_email_address'] != ''
      ) {
        emailList += data['vet_affairs_email_address'].trim() + ',';
      }
      if (
        data['marketing_email_address1'] &&
        data['marketing_email_address1'] != ''
      ) {
        emailList += data['marketing_email_address1'].trim() + ',';
      }
      if (
        data['marketing_email_address_2'] &&
        data['marketing_email_address_2'] != ''
      ) {
        emailList += data['marketing_email_address_2'].trim() + ',';
      }
      //console.log("emailList of "+collegeName+" :",emailList.slice(0,-1));
      listemailData = emailList.slice(0, -1).split(',');
      let to = [collegeEmail];
      let contantEmails = stringUtil.removeDuplicates(listemailData);
      let bccAddress = [];
      if (contantEmails.length > 1) {
        bccAddress = contantEmails;
        if (collegeEmail) {
          if (contantEmails[0] == collegeEmail) {
            contantEmails.splice(0, 1);
          }
        }
      }
      let messageContent = messageEmail.basicReplyEmailTemplate(emailTemplate);
      let from = 'CollegeRecon <' + emailConstant.INFORMATION_EMAIL + '>';
      //let to = [collegeEmail];
      //let to = ['shivaram@noveltytechnology.com'];
      let subject =
        'See Your School’s Rating; Encourage Users to Rate Your Military Friendliness';
      setTimeout(function () {
        emailService
          .sendEmail(from, to, subject, messageContent, '', bccAddress)
          .then(
            function (response1) {
              if (response1 == 'success') {
                //console.log("Email sent to:",collegeName);
                resolve('success');
              } else {
                resolve('fail');
              }
            },
            function (err) {
              if (err) {
                var error = err;
                error.status = 503;
                console.log('ERR:', err);
              }
            }
          );
      }, 10000);
    });
  }

  async function getEmailTemplateCollegeContacts(
    collegeName,
    collegeAlias,
    collegeId
  ) {
    var collegeUrl = 'https://app.collegerecon.com/' + collegeAlias;
    let emailContent = '';
    emailContent +=
      '<!DOCTYPE html><html><head><style>body {font-family: "Source Sans Pro", sans-serif;color:#333;}.header-section{text-align:left;margin: 20px 40px;}.text-contain{font-size:14px;}p{font-size:16px;}.body-section{margin: 20px 40px;}</style></head><body>';
    emailContent +=
      '<div style="text-align:center;"><span><img src="https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png" width="195px" /></span></div>';
    emailContent += '<div class="header-section">';
    emailContent += '<h3>' + collegeName + '</h3></div>';
    emailContent += '<div class="body-section">';
    emailContent +=
      '<p>In late 2019, Student Veterans of America (SVA) and CollegeRecon partnered to create a first-of-its-kind “College Rating” tool for military-connected students. The partnership was the result of a shared goal of empowering prospective military and veteran students through first-hand data collected from the military community.</p>';
    emailContent +=
      '<p>There are various college search engines, but CollegeRecon caters exclusively to the unique needs of the military/veteran student. We offer an inside look into what schools are providing these students, from financial benefits to academic support.</p>';
    emailContent += '<h3>Your School’s Ratings </h3>';
    emailContent +=
      '<p>If you haven’t yet checked your school’s digital profile on CollegeRecon, please take a look <a href="' +
      collegeUrl +
      '">here</a>. If you don’t see many ratings yet for your institution, this would be a great opportunity to solicit feedback from your institution’s military and veteran community.  You can send this <a href="https://app.collegerecon.com/college/review/">link</a> to your current military- and veteran-students to rate their experience. </p>';
    emailContent +=
      '<p>(If you wish to view a school that has already gathered some reviews, please go <a href="https://app.collegerecon.com/lincoln-university-of-pennsylvania/2487">here</a>)</p>';
    emailContent +=
      '<p>We salute your organization’s support of military-connected students and are here to assist in your efforts to position your brand and program offerings to the tens-of-thousands of college-bound student veterans we engage with on a monthly basis.</p>';
    emailContent += '<h3>About CollegeRecon</h3>';
    emailContent +=
      '<p>CollegeRecon proudly provides digital tools and resources exclusively for the college-bound, military-connected audience. </p>';
    emailContent += '<h3>About SVA</h3>';
    emailContent +=
      '<p>SVA is the largest student veteran organization in the country representing nearly 750,000 veterans.</p>';
    emailContent +=
      '<p>Please reach out to Garrett FitzGerald with any questions regarding this partnership, your digital profile or any other military recruitment questions.</p>';
    emailContent += '<p>Thank you for your time and consideration.</p>';
    emailContent += '<p>Best,</p>';
    emailContent +=
      '<p>Garrett Fitzgerald<br>CEO<br>Home Front Alliance, LLC<br>Creators of CollegeRecon<br><a href="mailto:Garrett@HFAlliance.com">Garrett@HFAlliance.com</a><br>414-350-6638</p>';
    emailContent += '</div></body></html>';
    return emailContent;
  }

  async function getCollegeActivityData(type, collegeId) {
    return new Promise(async (resolve, reject) => {
      try {
        let date = new Date();
        let dateTo = moment(date).format('YYYY-MM-DD');
        let lastDay = date.setDate(date.getDate() - 90);
        let dateFrom = moment(lastDay).format('YYYY-MM-DD');
        let ruleSql = '';
        if (type == 'non-partner') {
          ruleSql =
            "select max(ct.cn) as searchboxtotal,count(distinct r.student_id) as scount,count(sct.id) as savedtotal from colleges c left JOIN (SELECT college_id,count(*) as cn FROM college_search_tracking where date(date_created) BETWEEN '" +
            dateFrom +
            "' AND '" +
            dateTo +
            "' and secondary_source in ('url','list') group by college_id) ct on c.id = ct.college_id LEFT JOIN recon_messages r on c.id = r.college_id and r.responder= 'USER' and date(r.date_created) BETWEEN '" +
            dateFrom +
            "' AND '" +
            dateTo +
            "' left join searchresult_colleges_tracking as sct on c.id=sct.college_id and sct.secondary_source = 'register' AND sct.date_created BETWEEN '" +
            dateFrom +
            "' AND '" +
            dateTo +
            "' where c.status ='ACTIVE' and c.id=" +
            collegeId;
        } else {
          ruleSql =
            'select (SELECT count(*) FROM college_search_tracking where college_id=' +
            collegeId +
            " and secondary_source in ('url','list') and date(date_created) BETWEEN '" +
            dateFrom +
            "' AND '" +
            dateTo +
            "') as searchboxtotal,(SELECT count(distinct student_id) FROM recon_messages WHERE college_id=" +
            collegeId +
            " and responder= 'USER' and date(date_created) BETWEEN '" +
            dateFrom +
            "' AND '" +
            dateTo +
            "') as scount,(SELECT count(id) FROM searchresult_colleges_tracking WHERE college_id=" +
            collegeId +
            " and secondary_source='filter' and date_created BETWEEN '" +
            dateFrom +
            "' AND '" +
            dateTo +
            "') as matchedtotal,(SELECT count(distinct student_id) FROM users_saved_colleges WHERE college_id=" +
            collegeId +
            "  and date(saved_date) BETWEEN '" +
            dateFrom +
            "' AND '" +
            dateTo +
            "') as stotal from colleges c  where c.status ='ACTIVE' and c.id=" +
            collegeId;
          /*ruleSql = "select max(ct.cn) as searchboxtotal,count(distinct r.student_id) as scount,count(distinct umc.student_id) as matchedtotal from colleges c left JOIN (SELECT college_id,count(*) as cn FROM college_search_tracking where date(date_created) BETWEEN '"+dateFrom+"' AND '"+dateTo+"' group by college_id) ct on c.id = ct.college_id LEFT JOIN recon_messages r on c.id = r.college_id and r.responder= 'USER' and date(r.date_created) BETWEEN '"+dateFrom+"' AND '"+dateTo+"' LEFT JOIN users_matched_colleges umc on c.id=umc.college_id and date(umc.matched_date) BETWEEN '"+dateFrom+"' AND '"+dateTo+"' where c.status ='ACTIVE' and c.id="+collegeId;*/
        }
        //console.log("QQ:",ruleSql);
        const result = await mysqlService.query(ruleSql);
        return resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  }

  async function getAllActiveCollegeData(type) {
    return new Promise(async (resolve, reject) => {
      try {
        let ruleSql = "SELECT c.id,c.college_name,c.college_alias,c.seo_name,c.contact_email,cp.college_logo,cc.admission_email_address_1,cc.admission_email_address_2,cc.vet_affairs_email_address,cc.marketing_email_address1,cc.marketing_email_address_2,cc.unsubscribe_contact_email,cc.unsubscribe_admission_email1,cc.unsubscribe_admission_email2,cc.unsubscribe_vet_affairs_email,cc.unsubscribe_marketing_email1,cc.unsubscribe_marketing_email2,cc.contact_extra1,cc.contact_extra2,cc.contact_extra3,cc.contact_extra4,cc.contact_extra5,cc.unsubscribe_contact_extra1,cc.unsubscribe_contact_extra2,cc.unsubscribe_contact_extra3,cc.unsubscribe_contact_extra4,cc.unsubscribe_contact_extra5 FROM colleges as c inner join college_profiles as cp on c.id=cp.college_id inner join college_contacts cc  on cc.college_id=c.id where c.monthly_email_subscription='Yes' and (c.contact_email != '' or cc.admission_email_address_1 !='' or cc.admission_email_address_2 != '' or cc.vet_affairs_email_address != '' or cc.marketing_email_address1 != '' or cc.marketing_email_address_2 != '' or contact_extra1 != '' or contact_extra2 != '' or contact_extra3 != '' or contact_extra4 != '' or contact_extra5 != '') and c.status='ACTIVE'";
        if (type == 'non-partner') {
          ruleSql+=" and c.access_level != 'Patriot' order by c.id ASC";
          //ruleSql+=" and c.access_level != 'Patriot' and c.id > 10";
        } else {
          ruleSql+=" and c.access_level = 'Patriot' and c.specific_profile_id=0 order by c.id ASC";
        }
        //console.log("QQ:",ruleSql);
        const result = await mysqlService.query(ruleSql);
        return resolve(result);
      } catch (error) {
        return reject(error);
      }
    });
  }

  async function sendNonPartnerEmail() {
    let type = 'non-partner';
    let resultData = await getAllActiveCollegeData(type);
    //console.log("CD:",resultData);
    for (let i = 0; i < resultData.length; i++) {
      //if(i==0){
      await sendCollegeActivityMonthlyEmail(resultData[i], type);
      /*if(i == resultData.length -1){
                    console.log("Send Email Completed.");
                }*/
      //}
    }
  }

  async function sendPartnerEmail() {
    const type = 'partner';
    const resultData = await getAllActiveCollegeData(type);
    for (const collegeData of resultData) {
      await sendCollegeActivityMonthlyEmail(collegeData, type);
    }
  }

  async function sendCollegeActivityMonthlyEmail(data, type) {
    try {
      const from = `CollegeRecon<${emailConstant.INFORMATION_EMAIL}>`;
      const collegeEmail = data['contact_email'];
      const bccAddress = [
        ...new Set(
          [
            collegeEmail && data['unsubscribe_contact_email'] == 'no'
              ? `1:${collegeEmail}`
              : null,
            data['admission_email_address_1'] &&
            data['unsubscribe_admission_email1'] == 'no'
              ? `2:${data['admission_email_address_1'].trim()}`
              : false,
            data['admission_email_address_2'] &&
            data['unsubscribe_admission_email2'] == 'no'
              ? `3:${data['admission_email_address_2'].trim()}`
              : false,
            data['vet_affairs_email_address'] &&
            data['unsubscribe_vet_affairs_email'] == 'no'
              ? `4:${data['vet_affairs_email_address'].trim()}`
              : false,
            data['marketing_email_address1'] &&
            data['unsubscribe_marketing_email1'] == 'no'
              ? `5:${data['marketing_email_address1'].trim()}`
              : false,
            data['marketing_email_address_2'] &&
            data['unsubscribe_marketing_email2'] == 'no'
              ? `6:${data['marketing_email_address_2'].trim()}`
              : false,
            //type.toLowerCase() === 'partner' &&
            data['contact_extra1'] &&
            data['unsubscribe_contact_extra1'] == 'no'
              ? `7:${data['contact_extra1'].trim()}`
              : false,
            //type.toLowerCase() === 'partner' &&
            data['contact_extra2'] &&
            data['unsubscribe_contact_extra2'] == 'no'
              ? `8:${data['contact_extra2'].trim()}`
              : false,
            //type.toLowerCase() === 'partner' &&
            data['contact_extra3'] &&
            data['unsubscribe_contact_extra3'] == 'no'
              ? `9:${data['contact_extra3'].trim()}`
              : false,
            //type.toLowerCase() === 'partner' &&
            data['contact_extra4'] &&
            data['unsubscribe_contact_extra4'] == 'no'
              ? `10:${data['contact_extra4'].trim()}`
              : false,
            //type.toLowerCase() === 'partner' &&
            data['contact_extra5'] &&
            data['unsubscribe_contact_extra5'] == 'no'
              ? `11:${data['contact_extra5'].trim()}`
              : false,
          ].filter(Boolean)
        ),
      ];
      const emailList = bccAddress.filter((email) => email !== collegeEmail);
      const subject =
        type.toLowerCase() === 'non-partner'
          ? 'How military-connected student’s behavior impacts college recruiting'
          : 'CollegeRecon Monthly Campaign Review';
      const collegeActivityData =
        type.toLowerCase() !== 'non-partner'
          ? await getCollegeActivityData(type, data['id'])
          : null;
      if (!emailList.length) return;
      const emailResponses = await Promise.all(
        emailList.map((email) => {
          const collegeId = data['id'];
          const collegeLogo = data['college_logo'];
          const collegeName = data['college_name'];
          const collegeAlias = data['college_alias'];
          const [unsubId, to] = email.split(':');
          return emailService.sendEmail(
            from,
            [to],
            subject,
            type.toLowerCase() === 'non-partner'
              ? getNonPartnerNewsletterEmailTemplate(
                  collegeLogo,
                  collegeName,
                  collegeId,
                  collegeAlias,
                  unsubId
                )
              : getPartnerEmailTemplate(
                  collegeLogo,
                  collegeName,
                  collegeId,
                  collegeAlias,
                  unsubId,
                  collegeActivityData
                )
          );
        })
      );
      /*await Promise.all(
        emailResponses
          .map((response) => {
            return response &&
              response.code &&
              response.code.toLowerCase() === 'invalidparametervalue'
              ? mysqlService.query(``, {
                  email_ids: to,
                  college_id: data['id'],
                  college_name: collegeName,
                  message_date: getCurrentDateInFormat('YYYY-MM-DD HH:mm:ss'),
                })
              : false;
          })
          .filter(Boolean)
      );*/
      return;
    } catch (error) {
      return;
    }
  }

  function getNonPartnerEmailTemplate(
    collegeLogo,
    collegeName,
    collegeId,
    collegeAlias,
    unsubId
  ) {
    let unsubscribeLink =
      config.DOMAIN_URL +
      '/college/subscription/' +
      messageEncryption.encodeBase64('cid:' + collegeId + ':' + unsubId);
    let collegeUrl = config.DOMAIN_URL + '/' + collegeAlias;
    let webpageUrl =
      config.DOMAIN_URL +
      '/collegeactivity/report/' +
      messageEncryption.encodeBase64('cid:' + collegeId);
    //console.log("Wb:",webpageUrl);
    let emailContent = '';
    emailContent +=
      '<!DOCTYPE html><html><head><style>body {font-family: "Source Sans Pro", sans-serif;color:#333;}.header-section{text-align:left;margin: 20px 40px;}.text-contain{font-size:14px;}p{font-size:16px;}.body-section{margin: 20px 40px;}ul li{font-size:14px;}h3{font-size:22px}</style></head><body>';
    emailContent +=
      '<div style="text-align:center;"><span><img src="https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png" width="195px" /></span></div>';
    emailContent += '<div class="header-section">';
    emailContent += '<h3>' + collegeName + '</h3></div>';
    emailContent += '<div class="body-section">';
    emailContent +=
      '<p>We at CollegeRecon hope you had a great holiday break and that you’re looking forward to 2023!</p>';
    emailContent +=
      '<p>As part of CollegeRecon’s continued effort to educate higher ed institutions on all aspects of military marketing, enrollment, and retention, we’ve produced a series of helpful guides and resources focused on this community.</p>';
    emailContent +=
      '<p>Please feel free to <a href="http://collegerecon.com/partnerships">reach out</a> to us with any questions or to learn more about our military outreach programs built exclusively for non-predatory colleges and universities.</p><p>The following is information on military-connected prospective students.</p>';
    emailContent += '<h3>Research by Military-Connected Students</h3>';
    emailContent +=
      '<p>Like their civilian counterparts, choosing a college or university is a considerable decision for military, veterans, military spouses, and child dependents.</p><p>In the case of active military and military spouses, they may research for months before they make a decision.  Unlike their civilian counterparts, they may be considering:</p>';
    emailContent +=
      '<ul><li>Relocation to a new base or deployments overseas</li><li>DoD-provided financial / education benefits</li><li>Temporary Training Requirements</li><li>Retirement timelines</li></ul>';
    emailContent +=
      '<p>College discovery is something that the military emphasizes using trusted, safe organizations and senior leaders. CollegeRecon is a trusted platform that focuses solely on assisting military-connected prospective students.</p>';
    //emailContent += '<h3>About CollegeRecon</h3>';
    //emailContent += '<p>CollegeRecon proudly provides digital tools and resources exclusively for the college-bound, military-connected audience. </p>';
    emailContent += '<h3>Transferring Benefits to a Spouse or Dependent</h3>';
    emailContent +=
      '<p>The Post-9/11 GI Bill allows married military members to transfer their benefits to a child or spouse.  This allows colleges to enroll the military member while on active duty and then enroll their spouse/dependents in the future.</p><p>This requires a continued commitment (in the form of reenlistment) from the service member and, of course, a great deal of paperwork.  This may be complicated for the service member and the recipient of the benefits.  They may require outside assistance and guidance, which may prolong the process.</p>';
    emailContent +=
      '<hr><p style="text-align:center;">Want to recruit more military students?  CollegeRecon can help!  A trusted brand in the military community, we help 100k service members each month with their benefits, education, and career options.<a href="https://collegerecon.com/partnerships">Contact us today!</a></p><hr>';
    emailContent +=
      '<h3>Community & Camaraderie within the Military Community</h3>';
    emailContent +=
      '<p>Veterans attending in person may heavily consider the veteran community and institutional support of veterans.</p>';
    emailContent +=
      '<p>In many cases, the veteran community may seek a sense of community through veteran support groups, programs, and dedicated campus veteran centers.</p>';
    emailContent += '<h3>Messaging the Military Community</h3>';
    emailContent +=
      '<p>Military members have unique needs and interests concerning their pursuit of higher education. We, along with our partners, have found that it is less effective to use the same messaging for traditional students when addressing the military community.</p><p>As with civilians, personalization matters.  One way you might personalize this is by addressing them by their rank or pay grade. CollegeRecon provides this information for all inquiries generated through our platform.</p>';
    emailContent +=
      '<p>Listing direct contact information on your website and in emails is important. Direct phone numbers should be listed for admissions, advising, finance, and registrar departments. Ensure these contacts are ready and willing to assist military-connected students.</p>';
    emailContent += '<h3>Following Up with Military-Connected Students</h3>';
    emailContent +=
      '<p>Military students may be at the beginning of the process, determining if their preferred degree program is approved for their type of funding (Military Tuition Assistance, GI Bill, and/or Yellow Ribbon).  This may differentiate them from your traditional student population.</p><p>We have found that it is most effective to target Initial outreach within the first 5 to 6 weeks of their degree interests, what financial coverage they will have, and the process of understanding their benefits and associated costs for their desired program. </p>';
    emailContent +=
      '<p>If they do not initially enroll within the first 60 days, follow-up communications are effective as much as 6 months after your initial outreach cycle closes.  This helps ensure that they have gone through the necessary steps to ensure that everything is approved from a funding perspective. They may now be ready to continue the admissions and enrollment processes.</p>';
    emailContent += '<h3>Timing Counts</h3>';
    emailContent +=
      '<p>Because of the unpredictable nature of the military assignment system, many military students may come to the process late--missing enrollment deadlines (which many military people fail to appreciate as coming far earlier in the enrollment process than they expect. When a military person with no experience in civilian colleges wants to apply for a Spring semester, do they know they actually have to start applying long before Spring? Some start late and get discouraged by the long waiting times--warning students to apply far earlier than they anticipate may be crucial in many cases.</p>';
    emailContent += '<h3>How to Implement</h3><h4>Make your Case</h4>';
    emailContent +=
      '<p>It’s always a good idea to highlight what makes you different and focus on the applicable financial coverage when speaking with the military community.</p>';
    emailContent +=
      '<ul><li>GI Bill</li><li>Military Tuition Assistance</li><li>Yellow Ribbon funding</li><li>Grants</li><li>Reduced Tuition for Military</li></ul>';
    emailContent +=
      '<p>High on their list is reducing out-of-pocket costs.  They have earned valuable financial benefits in service to our country, and we should all look to help them get the most out of them.</p>';
    emailContent += '<h4>Some things to think about:</h4>';
    emailContent +=
      '<ul><li>Scholarships offered by the college</li><li>Special military/spouse tuition rates</li><li>Career development/career placement resources</li><li>School-specific policies surrounding military-connected students</li><ul style="list-style-type: disc;"><li>Waived fees</li><li>Rolling admissions</li><li>Extended class add/drop deadlines</li></ul></ul>';
    emailContent +=
      '<hr><p>Is ' +
      collegeName +
      ' interested in increasing military enrollment and growing your brand awareness in the military and veteran community?</p>';
    emailContent +=
      '<p><a href="https://collegerecon.com/partnerships/">CollegeRecon</a> can be your solution like it is for more than 100 other colleges and universities around the country!</p>';
    emailContent +=
      '<p>We work with universities to grow G.I. Bill ® and Tuition Assistance revenues through targeted marketing campaigns on the CollegeRecon search <a href="https://app.collegerecon.com/">platform</a>. We can also consult with admissions and marketing teams to educate and train staff on communicating with military-connected students.</p>';
    emailContent +=
      '<p>Please contact us if you wish to learn more about the military audience or recruit more military-connected students to your institution.</p>';
    emailContent +=
      '<p style="text-align:center;font-size:12px;">Do you no longer want to receive this free monthly engagement report? <i><a href="' +
      unsubscribeLink +
      '" target="_blank">Unsubscribe Monthly Report</a></i></p>';
    emailContent += '</div></body></html>';
    return messageEmail.basicReplyEmailTemplate(emailContent);
  }

  function getNonPartnerNewsletterEmailTemplate(
    collegeLogo,
    collegeName,
    collegeId,
    collegeAlias,
    unsubId
  ) {
    let unsubscribeLink =
      config.DOMAIN_URL +
      '/college/subscription/' +
      messageEncryption.encodeBase64('cid:' + collegeId + ':' + unsubId);
    let emailContent = '';
    emailContent +=
      '<!DOCTYPE html><html><head><style>body {font-family: "Source Sans Pro", sans-serif;color:#333;}.header-section{text-align:left;margin: 20px 40px;}.text-contain{font-size:14px;}p{font-size:16px;}.body-section{margin: 20px 40px;}ul li{font-size:14px;}h3{font-size:22px}</style></head><body>';
    emailContent +=
      '<div style="text-align:center;"><span><img src="'+AWS_IMAGE_RESOURCE_COLLEGE+collegeLogo+'" width="150px" /></span></div>';
    emailContent += '<div class="header-section">';
    emailContent += '<h3>' + collegeName + '</h3></div>';
    emailContent += '<div class="body-section">';
    emailContent += '<p>In light of the new year, many schools are actively seeking new audiences to market to and recruit. Many schools are turning their attention to large communities like international, adult learners and community college transfers.</p>';
    emailContent += '<p>One audience that has remained relatively stable over the last 5 years is the military and veteran community. These individuals are unique in that they increase diversity on-campus, come with federal tuition dollars earned from service, and provide unique perspectives in a classroom setting.</p>';
    emailContent += '<p>Did you know:<ul><li><b>$23 billion+ was received by universities between 2019-20</b></li><li>1.8 million military-connected students enrolled in higher ed between 2019-20</li><li>75% of student veterans enroll full-time</li><li>68% of student veterans enroll in 4-year undergraduate or graduate level programs</li><li>42% of student veterans enroll in private institutions</li><li>62% of student veterans are first-generation college students</li></ul></p>';
    emailContent += '<p>Is '+ collegeName +' doing enough to recruit military-connected students? If you’re eligible to receive G.I. Bill ® and Tuition Assistance funding from the government, accept military credit for service, and are interested in prioritizing military enrollment in 2023 and beyond, <b>we can help.</b></p>';
    emailContent += '<p>CollegeRecon is the largest and most trusted resource for colleges and universities looking to:<ul><li>Market to the military community</li><li>Increase student veteran population</li><li>Train admissions teams for handling military-connected prospects</li></ul></p>';
    emailContent += '<p>If you’re looking to make a change this year and the military is an audience you feel you’re not prioritizing enough, please give us a call or reach out to schedule time with our team this month to put a plan together!</p>';
    emailContent += '<p>For more information: CollegeRecon.com/partnerships</p>';
    emailContent += '<p>Sincerely,</p>';
    emailContent += '<p>Garrett FitzGerald<br/>CEO<br/>CollegeRecon.com</p>';
    emailContent += '<div style="text-align:center;"><span><img src="https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png" width="195px" /></span></div>';
    emailContent += '<p style="text-align:center;font-size:12px;">Do you no longer want to receive this free monthly engagement report? <i><a href="' + unsubscribeLink +
      '" target="_blank">Unsubscribe Monthly Report</a></i></p>';
    emailContent += '</div></body></html>';
    //console.log("TT:",messageEmail.basicReplyEmailTemplate(emailContent))
    return messageEmail.basicReplyEmailTemplate(emailContent);
  }

  function getPartnerEmailTemplate(
    collegeLogo,
    collegeName,
    collegeId,
    collegeAlias,
    unsubId,
    collegeActvityInfo
  ) {
    let unsubscribeLink =
      config.DOMAIN_URL +
      '/college/subscription/' +
      messageEncryption.encodeBase64('cid:' + collegeId + ':' + unsubId);
    let collegeUrl = config.DOMAIN_URL + '/' + collegeAlias;
    let webpageUrl =
      config.DOMAIN_URL +
      '/collegeactivity/report/' +
      messageEncryption.encodeBase64('cid:' + collegeId);
    //console.log("Wb:",webpageUrl);
    let emailContent = '';
    let profileTotal = collegeActvityInfo[0]['searchboxtotal']
      ? collegeActvityInfo[0]['searchboxtotal']
      : 0;
    let userMatchedTotal =
      (collegeActvityInfo[0]['matchedtotal']
        ? collegeActvityInfo[0]['matchedtotal']
        : 0) +
      (collegeActvityInfo[0]['stotal'] ? collegeActvityInfo[0]['stotal'] : 0);
    let requestTotal = collegeActvityInfo[0]['scount']
      ? collegeActvityInfo[0]['scount']
      : 0;
    let overAllTotal = profileTotal + userMatchedTotal + requestTotal;
    emailContent +=
      '<!DOCTYPE html><html><head><style>body {font-family: "Source Sans Pro", sans-serif;color:#333;}.header-section{text-align:center;margin-bottom:20px;}.college-info{border-spacing: 0;}.college-info thead{background-color: #ffffff;color: #000000;font-size:14px;}.yellowcolor{background-color: #fec231;}.college-info td,th{border: 1px solid #777;margin: 0 !important;padding: 10px 20px;text-align:center;}.text-contain{font-size:14px;}p{font-size:16px;}td span{color: #333 !important;}.body-section{margin: 20px 40px;}p{font-size:14px}.center-div h3{text-align:center;}td{text-align:left !important}.indicator{font-size:10px;}</style></head><body>';
    // if(collegeLogo){
    //     emailContent += "<div style='text-align:center;'><span><img src='"+config.AWS_IMAGE_RESOURCE_COLLEGE+collegeLogo+"' width='100px'/></span></div>";
    // }
    emailContent +=
      "<div style='text-align:center;'><span><img src='https://s3.amazonaws.com/collegerecon.prod.assets/assets/social-assets/cr-logo.png' width='150px' /></span></div>";
    emailContent += '<div class="body-section"><p>Good morning!</p>';
    emailContent +=
      '<p>We hope that all is well at ' +
      collegeName +
      ' this month! As a CollegeRecon partner institution, you’re receiving the below report to detail the activity of your current campaign.</p>';
    emailContent +=
      '<p>Our priority is to increase your brand awareness and create direct engagement with military-connected, prospective students. We are continuing to find new ways to scale your visibility, introduce you to early-stage prospective students, and work with your admissions teams to optimize enrollment processes.</p>';
    emailContent += '<p>Please see campaign metrics below (last 90 days):</p>';
    emailContent +=
      '<div class="center-div"><h3>Military Activity & Engagement Review</h3><br><table align="center" class="college-info" width="400px"><thead><tr><th colspan="2">Total Brand Engagements : ' +
      overAllTotal +
      '</th></tr><tr><td>Profile Visitors</td><td>' +
      profileTotal +
      '</td></tr><tr><td>Matches Made</td><td>' +
      userMatchedTotal +
      '</td></tr><tr><td>Information Requests</td><td>' +
      requestTotal +
      '</td></tr><thead><tbody>';
    emailContent += '</tbody></table>';
    emailContent +=
      '<span class="indicator"><b>Inclusive of last 90 days of campaign</b><br>* Profile Visitors: total # of unique visits to your profile by prospects<br>* Matches Made: total # of times you were saved by a prospect and # of times you appeared in search results <br>* Information Requests: total # of conversions via CollegeRecon<span> </div>';
    emailContent +=
      '<p><b>To see more detailed reporting and audience demographics, please <a href="https://app.collegerecon.com/login">login</a> to your CollegeRecon account and access our brand new reporting section!</b></p>';
    emailContent +=
      '<p>On our quarterly call, we can review these stats and our team will answer any questions you may have. If you’re looking for more ways to further expand your exposure on CollegeRecon properties, we can look into additional opportunities as well.</p>';

    emailContent +=
      '<p>Thank you for your continued partnership and please contact us with any immediate questions or if you’d like to schedule a review with your campaign manager.</p>';
    emailContent +=
      '<p>Please let us know if you have any questions or would like to schedule a call with your rep to review this in greater detail.</p>';

    emailContent += '<p>Best,</p>';
    emailContent += '<p></p>';
    emailContent += '<p>CollegeRecon Team</p>';
    emailContent += '<p></p>';
    emailContent +=
      '<p style="text-align:center;font-size:12px;">Do you no longer want to receive this free monthly engagement report? <i><a href="' +
      unsubscribeLink +
      '" target="_blank">Unsubscribe Monthly Report</a></i></p>';
    emailContent += '</div></body> </html>';
    return messageEmail.basicReplyEmailTemplate(emailContent);
  }

  return {
    sendMonthlyReportCollege: sendMonthlyReportCollege,
    sendTestEmail: sendTestEmail,
    sendCollegeContactEmail: sendCollegeContactEmail,
    sendNonPartnerEmail: sendNonPartnerEmail,
    sendPartnerEmail: sendPartnerEmail,
  };
})();

module.exports = collegeMonthlyReport;
