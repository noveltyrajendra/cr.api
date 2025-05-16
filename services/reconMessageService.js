const promise = require('promise');

let reconMessageService = (function() {
  
    let mysqlService=require('./mysqlService');
    let emailService=require('./emailService');
    let {googleSheetService} = require('./googleSheetService');
    let {makeThirdPartyRequest} = require('./thirdPartyIntegrationService');
    let reconMessageConstant=require('../constants/reconMessageConstant');
    let studentInboxMessageModel=require('../models/studentInboxMessageModel');
    let collegeInboxMessageModel=require('../models/collegeInboxMessageModel');
    let messageEmail = require('../utils/messageEmail');
    let decrypt = require('../utils/base64Utility');
    let emailConstant=require('../constants/emailConstant');
    let moment =require('moment');
    let config = require('../config');
    var stringUtil = require('../utils/stringUtil');
    let googleSheetConstant = require('../constants/googleSheetConstant');
    let requestlogger = require('../utils/requestInfoLog');
    const { collegeConstant, integrationConstant, everSpringCollegeList } = require('../constants/integrationConstants');
    const {
      insertIntoLogEntry,
    } = require("../utils/integrationUtils");

    function getVeteranReplyReceived(studentid)
    {	
      return new Promise(function(resolve, reject) {
        mysqlService.query(reconMessageConstant.GET_VETERAN_REPLY_RECEIVED_MESSAGE,studentid)
           .then(function(response){
            resolve({'veteranreplyreceived':response && response[0] && response[0].replies_received ? response[0].replies_received : 0});
             },function(err){  
               if (err) {
                 var error = err;
                error.status = 503;
                 return reject(error)
               };
            });
        });
    }	

    function getVeteranInboxMessageCount(studentid)
    {	
      return new Promise(function(resolve, reject) {
        mysqlService.query(reconMessageConstant.GET_VETERAN_INBOX_MESSAGE_COUNT,studentid)
           .then(function(response){
             resolve({'countinbox':response[0].cinbox});
             },function(err){  
               if (err) {
                 var error = err;
                error.status = 503;
                 return reject(error)
               };
            });
        });
    }	

    function getVeteranInboxMessage(studentid, type)
    {	
      return new Promise(function(resolve, reject) {
        let qry = "";
        if(type == "inbox"){
          qry = reconMessageConstant.GET_VETERAN_MESSAGES;
        }else{
          qry = reconMessageConstant.GET_VETERAN_MESSAGES_TYPE;
        }
        mysqlService.query(qry,studentid)
           .then(function(response){
             resolve(studentInboxMessageModel(response));
             },function(err){  
               if (err) {
                 var error = err;
                error.status = 503;
                 return reject(error)
               };
            });
        });
    }	

    function replyVeterenMessage(body)
    {
      return new Promise(async function (resolve, reject) {
        let messageid="";
        let attach = "";
        if(!body.messageId){
          messageid = stringUtil.UID();
        }else{
          messageid = body.messageId;
        }
        
        if(body.attachment != "" || body.attachment == null){
          attach = config.AWS_IMAGE_RESOURCE_STUDENT+body.attachment;
        }
        const post = {
          responder: body.responder,
          recipient:body.recipient,
          message_state:"NEW",
          message_id:messageid,
          student_id:body.studentId,
          college_id:body.collegeId, 
          message:body.replyMessage,
          primary_source: body.primarySource,
          secondary_source : body.secondarySource,
          attachment: attach,
          date_created:moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        };

        const uuid = stringUtil.UID();

        const collegeQuery = "select specific_profile_id from colleges where id="+body.collegeId;
        const checkIsDegreeSpec = await mysqlService.query(collegeQuery);
        const sendMessage = sendReconMessage(post, body, uuid);
        const sendEmail = sendEmailToVeteran(body,messageid,attach, uuid);

        let promises = [sendMessage, sendEmail];

        if(body && body.type.toLowerCase() == "connect") {
          const cadenceEmail = stopMatchingCadenceEmail(body.studentId, body.collegeId);
          promises = [...promises, cadenceEmail];
        }

        if(checkIsDegreeSpec && checkIsDegreeSpec.length && checkIsDegreeSpec[0].specific_profile_id == 0) {
          requestlogger.log('info', "Normal college with CollegeID:"+body.collegeId);
          if(body && body.type.toLowerCase() == "connect" && (googleSheetConstant.parentCollegesConstant.findIndex(x=> x == body.collegeId)) > -1){
            requestlogger.log('info', "Normal college with CollegeID:"+body.collegeId+" having google sheet.");
            const googleSheetRequest = googleSheetService.addVeteranGooleSheet(body.studentId, body.collegeId, checkIsDegreeSpec[0].specific_profile_id,0,0, uuid);
            promises = [...promises, googleSheetRequest];
          }

          if(body && body.type.toLowerCase() == "connect" && (Object.values(collegeConstant).find(college => college.collegeId == body.collegeId))){
            const apiPostRequest = makeThirdPartyRequest(body.studentId, body.collegeId, checkIsDegreeSpec[0].specific_profile_id,0,0, uuid);
            promises = [...promises, apiPostRequest];
          }
        } else if(checkIsDegreeSpec && checkIsDegreeSpec.length && checkIsDegreeSpec[0].specific_profile_id  > 0) {
          requestlogger.log('info', "Degree Specific college with CollegeID:"+body.collegeId);
          const specificQuery = "select college_id,new_college_name from college_degree_specific_info where id="+checkIsDegreeSpec[0].specific_profile_id;
          const checkSpecific = await mysqlService.query(specificQuery)
          if(body && body.type.toLowerCase() == "connect" && (googleSheetConstant.specificCollegesConstant.findIndex(x=> x == checkSpecific[0].college_id)) > -1) {
            requestlogger.log('info', "Degree Specific college with CollegeID:"+body.collegeId+" having google sheet.");
            const googleSheetRequest = googleSheetService.addVeteranGooleSheet(body.studentId, body.collegeId, checkIsDegreeSpec[0].specific_profile_id, checkSpecific[0].college_id,checkSpecific[0].new_college_name, uuid);
            promises = [...promises, googleSheetRequest];
          } else if (body && body.type.toLowerCase() == "connect" && (googleSheetConstant.parentCollegesConstant.findIndex(x=> x == checkSpecific[0].college_id)) > -1 && !(googleSheetConstant.onlyParentColleges.includes(checkSpecific[0].college_id))) {
            requestlogger.log('info', "Degree Specific college with CollegeID:"+body.collegeId+" having parent google sheet.");
            const googleSheetRequest = googleSheetService.addVeteranGooleSheet(body.studentId, body.collegeId, checkIsDegreeSpec[0].specific_profile_id, checkSpecific[0].college_id,checkSpecific[0].new_college_name, uuid);
            promises = [...promises, googleSheetRequest];
          }

          // Check Everspring degree specific colleges
          if(body && body.type.toLowerCase() == "connect" && everSpringCollegeList.includes(+body.collegeId)){
            const apiPostRequest = makeThirdPartyRequest(body.studentId, body.collegeId, checkIsDegreeSpec[0].specific_profile_id, checkSpecific[0].college_id,checkSpecific[0].new_college_name, uuid);
            promises = [...promises, apiPostRequest];
          }else if(body && body.type.toLowerCase() == "connect" && (Object.values(collegeConstant).find(college => college.collegeId == checkSpecific[0].college_id))) {
            const apiPostRequest = makeThirdPartyRequest(body.studentId, body.collegeId, checkIsDegreeSpec[0].specific_profile_id, checkSpecific[0].college_id,checkSpecific[0].new_college_name, uuid);
            promises = [...promises, apiPostRequest];
          }
        }

        try{
          const promiseStatus = await Promise.all(promises);
          if(promiseStatus && promiseStatus.length) {
            resolve('success');
          }
        }catch(e){
          console.log("Err:",e);
          return reject({
            message: e.message
          })
        }
        
        });
    }

    function stopMatchingCadenceEmail(sid, cid){
      return new Promise(function(resolve, reject) {
        stopBounceDegreeEmail(sid, cid)
          .then(function (response1) {
            let qry = "select count(id) as total from cadence_matching_list where student_id='"+sid+"' and college_id="+cid;
            mysqlService.query(qry)
            .then(function (response) {
              if(response[0].total > 0){
                let uQry = "UPDATE cadence_matching_list SET rule_status='stop' WHERE student_id='"+sid+"' and college_id="+cid;
                mysqlService.query(uQry)
                  .then(function (uresponse) {
                    resolve( "success");
                  }, function (err) {
                    if (err) {
                      var error = err;
                      error.status = 503;
                      return reject(error)
                    };
                  });
              }else{
                resolve( "success");
              }
            }, function (err) {
              if (err) {
                var error = err;
                error.status = 503;
                return reject(error)
              };
            });
          }, function (err) {
            if (err) {
              var error = err;
              error.status = 503;
              return reject(error)
            };
          })
      });
    }

    function stopBounceDegreeEmail(sid, cid){
      return new Promise(function(resolve, reject) {
        let qry = "select count(id) as total from cadence_degree_bounce_list where student_id='"+sid+"' and college_id="+cid;
        mysqlService.query(qry)
        .then(function (response) {
          if(response[0].total > 0){
            let uQry = "UPDATE cadence_degree_bounce_list SET rule_status='stop' WHERE student_id='"+sid+"' and college_id="+cid;
            mysqlService.query(uQry)
              .then(function (uresponse) {
                resolve("success");
              }, function (err) {
                if (err) {
                  var error = err;
                  error.status = 503;
                  return reject(error)
                };
              });
          }else{
            resolve("success");
          }
        }, function (err) {
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        });
      });
    }

    function veteranReplyEmail(body, messageid, attach, uuid, studentId, collegeId){
      return new Promise(function(resolve, reject) {
      let veteranmessage = "";
      let message = "";
      let subject = emailConstant.NEW_REPLY_VETERAN_MESSAGE;
      let to = [body.collegeEmail];
      let from = emailConstant.NO_REPLY_EMAIL;
      let attach = "";
      let replyto = "veterans+"+decrypt.encodeBase64("COLLEGE+USER+"+messageid+"+"+body.studentId+"+"+body.collegeId+"+"+attach)+"@collegerecon.com";
      //let replyto = "shivaram+"+decrypt.encodeBase64("COLLEGE+USER+"+messageid+"+"+body.studentId+"+"+body.collegeId+"+"+attach)+"@noveltytechnology.com";
      if(body && body.type.toLowerCase() == "connect"){
          infoQuery = 'SELECT Concat(Ifnull(first_name," ") ," ", Ifnull(middle_initial," ")," ", Ifnull(last_name," ")) as display_name FROM students WHERE uuid="'+body.studentId+'"';
          message = messageEmail.basicReplyEmailTemplate(stringUtil.showLineBreakHtml(body.replyMessage));
          mysqlService.query(infoQuery)
                  .then(async function(response1){
          if(response1.length == 1){
            from = response1[0].display_name+"<"+from+">";
          } 
          getInquiryEmailList(collegeId, to).then(function(resultEmail){
            let bccEmails = [];
            if(resultEmail != "empty"){
              bccEmails = resultEmail;
            }else{
              bccEmails = [];
            }
            //console.log("RR:",resultEmail);
            //console.log("Bcc Emails:",bccEmails);
            emailService.sendEmail(from,to,subject,message,replyto,bccEmails).then(function(response){
              //console.log("Email Response:",response)
              resolve("success");
            },function(err){ 
              if (err) {
                var error = err;
                error.status = 503;
                return reject(error)
              };
            });
          },function(err){ 
            if (err) {
              var error = err;
              error.status = 503;
              return reject(error)
            };
          });  
        },function(err){  
          if (err) {
            var error = err;
            error.status = 503;
            console.log("ERR:",err);
          };
        });
      }else if(body.type == "reply"){
        veteranmessage = body.replyMessage;
        message = messageEmail.basicReplyEmailTemplate(stringUtil.showLineBreakHtml(veteranmessage));
        emailService.sendEmail(from,to,subject,message,replyto).then(async function(response){
          const logBody = {
            log_uuid: uuid,
            student_id: studentId,
            college_id: collegeId,
            stage: integrationConstant.VETERAN_EMAIL,
            message: "Veteran email sent successfully.",
            attributes: body,
            status: integrationConstant.STATUS_SUCCESS,
          };
      
          await insertIntoLogEntry(logBody);
          resolve("success");
        },async function(err){ 
          if (err) {
            var error = err;
            error.status = 503;
            const logBody = {
              log_uuid: uuid,
              student_id: studentId,
              college_id: collegeId,
              stage: integrationConstant.VETERAN_EMAIL,
              message: "Error sending veteran email.",
              attributes: body,
              status: integrationConstant.STATUS_FAILURE,
            };
        
            await insertIntoLogEntry(logBody);
            return reject(error)
          };
        });
      }
    });
  }

  function deleteVeterenMessage(body)
  {
    return new Promise(function (resolve, reject) {
      let updateTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
      //let uquery = "UPDATE recon_messages SET message = NOW(),message_state = 'DELETED' WHERE student_id = '"+body.studentId+"' AND message_id = '"+body.messageId+"' AND id = "+body.id;
      let uquery = "UPDATE recon_messages SET message_state = 'DELETED',updated_by='"+body.studentId+"',updated_date='"+updateTime+"' WHERE student_id = '"+body.studentId+"' AND message_id = '"+body.messageId+"' AND id = "+body.id;
      mysqlService.query(uquery)
      .then((results) => {
        resolve("success");
        }).catch((err) =>{
          console.log('error',err);
          reject(new Error(err));
        });;
      }); 
  }

  function getCollegeMessageData(collegeid)
  {	
    return new Promise(function(resolve, reject) {
      mysqlService.query(reconMessageConstant.REPLIES_RECEIVED_FOR_COLLEGE,collegeid)
         .then(function(response){
          mysqlService.query(reconMessageConstant.QUERY_CONTACTED_VETERAN,collegeid)
            .then(function(response1){
              resolve({'repliesReceivedCollege':response[0].replies_received,'contactedStudents':response1[0].pcount})
            },function(err){  
              if (err) {
                var error = err;
                error.status = 503;
                return reject(error)
              };
            })
           },function(err){  
             if (err) {
               var error = err;
              error.status = 503;
               return reject(error)
             };
          });
      });
  }	
  

  function getCollegeInboxMessageCount(collegeid)
  {	
    return new Promise(function(resolve, reject) {
      mysqlService.query(reconMessageConstant.GET_COLLEGE_INBOX_MESSAGE_COUNT,collegeid)
         .then(function(response){
           resolve({'countinbox':response[0].cinbox});
           },function(err){  
             if (err) {
               var error = err;
              error.status = 503;
               return reject(error)
             };
          });
      });
  }	

  function getCollegeInboxMessage(collegeid, type)
  {	
    return new Promise(function(resolve, reject) {
      let qry = "";
      if(type == "inbox"){
        qry = reconMessageConstant.GET_COLLEGE_MESSAGES;
      }else{
        qry = reconMessageConstant.GET_COLLEGE_MESSAGES_TYPE;
      }
      mysqlService.query(qry,collegeid)
         .then(function(response){
           resolve(collegeInboxMessageModel(response));
           },function(err){  
             if (err) {
               var error = err;
              error.status = 503;
               return reject(error)
             };
          });
      });
  }

  function replyCollegeMessage(body)
    {
      return new Promise(function (resolve, reject) {
        let messageid="";
        let attach = "";
        if(body.messageId == ""){
          messageid = stringUtil.UID();
        }else{
          messageid = body.messageId;
        }
        var post = {
          responder: body.responder,
          recipient:body.recipient,
          message_state:"NEW",
          message_id:messageid,
          student_id:body.studentId,
          college_id:body.collegeId, 
          message:body.replyMessage,
          primary_source: body.primarySource,
          secondary_source : body.secondarySource,
          date_created:moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
        };
        mysqlService.query(reconMessageConstant.SAVE_REPLY_STUDENT_MESSAGE, post)
        .then((results) => {
            //resolve(results);
            collegeReplyEmail(body,messageid).then(function(response){
              //console.log(response);
              if(response == "success"){
                resolve("success");
              }
            },function(err){ reject(new Error(err)); });
          }).catch((err) =>{
            console.log('error',err);
            reject(new Error(err));
          });;
        }); 
    }
  
  function collegeReplyEmail(body,messageid){
    return new Promise(function(resolve, reject) {
    let veteranmessage = "";  
    let message = "";
    let subject = emailConstant.NEW_REPLY_VETERAN_MESSAGE;
    let to = [body.email];
    let from = emailConstant.NO_REPLY_EMAIL;
    let attach = "";
    let replyto = "veterans+"+decrypt.encodeBase64("USER+COLLEGE+"+messageid+"+"+body.studentId+"+"+body.collegeId+"+"+attach)+"@collegerecon.com";
    //let replyto = "shivaram+"+decrypt.encodeBase64("USER+COLLEGE+"+messageid+"+"+body.studentId+"+"+body.collegeId+"+"+attach)+"@noveltytechnology.com";
    
    if(body && body.type.toLowerCase() == "connect"){
      veteranmessage = "<p>Congratulations! A school on CollegeRecon has found you and after reviewing your profile, they would like to connect with you and discuss your personal interests, needs, and qualifications</p><p>This is a great opportunity for you to start a conversation with a school actively looking to assist and educate military-connected individuals.</p><p>As always, if you have any questions with what you should be asking schools on CollegeRecon or how you should respond, you can reach the CollegeRecon team 24/7 at <a href='mailto:information@HFAlliance.com'>information@HFAlliance.com</a> or 414-454-9492.</p><p>Your team at CollegeRecon</p>";
      message = messageEmail.basicEmailTemplate(veteranmessage);
      emailService.sendEmail(from,to,subject,message).then(function(response){
        //resolve("success");
        //let sUrl = config.DOMAIN_URL+"/email/subscription/"+decrypt.encodeBase64(body.studentId);
        let collegeMessage = body.replyMessage;
        //collegeMessage += "<br>For email unsubscription Click <a href='"+sUrl+"' target='_blank'>here</a>";
        
        message = messageEmail.basicReplyEmailTemplate(stringUtil.showLineBreakHtml(collegeMessage));
        emailService.sendEmail(from,to,subject,message,replyto).then(function(response){
          resolve("success");
        },function(err){ 
          if (err) {
            var error = err;
            error.status = 503;
            return reject(error)
          };
        });
      },function(err){ 
        if (err) {
          var error = err;
          error.status = 503;
          return reject(error)
        };
      });
    }else if(body.type == "reply"){
      veteranmessage = body.replyMessage;
      message = messageEmail.basicReplyEmailTemplate(veteranmessage);
      emailService.sendEmail(from,to,subject,message,replyto).then(function(response){
        resolve("success");
      },function(err){ 
        if (err) {
          var error = err;
          error.status = 503;
          return reject(error)
        };
      });
    }
  });
}

function deleteCollegeMessage(body)
{
  return new Promise(function (resolve, reject) {
    let updateTime = moment(new Date()).format('YYYY-MM-DD HH:mm:ss');
    //let uquery = "UPDATE recon_messages SET message = NOW(),message_state = 'DELETED' WHERE college_id = '"+body.collegeId+"' AND message_id = '"+body.messageId+"' AND id = "+body.id;
    let uquery = "UPDATE recon_messages SET message_state = 'DELETED',updated_by='"+body.userId+"',updated_date='"+updateTime+"' WHERE college_id = '"+body.collegeId+"' AND message_id = '"+body.messageId+"' AND id = "+body.id;
    mysqlService.query(uquery)
    .then((results) => {
      resolve("success");
      }).catch((err) =>{
        console.log('error',err);
        reject(new Error(err));
      });;
    }); 
}

function markMessageAsRead(body)
{
  return new Promise(function (resolve, reject) {
    let uquery = "UPDATE recon_messages SET message_state = 'READ' WHERE message_id = '"+body.messageId+"' AND recipient = '"+body.recipientType+"' AND message_state = 'NEW'";
    mysqlService.query(uquery)
    .then((results) => {
      resolve("success");
      }).catch((err) =>{
        console.log('error',err);
        reject(new Error(err));
      });;
    }); 
}

const sendEmailToVeteran = async (body,messageid,attach, uuid) => {
  try {
    const logBody = {
      log_uuid: uuid,
      student_id: body.studentId,
      college_id: body.collegeId,
      stage: integrationConstant.VETERAN_EMAIL,
      message: "Before sending veteran email",
      attributes: body,
      status: integrationConstant.STATUS_SUCCESS,
    };

    await insertIntoLogEntry(logBody);
    const isMailSent = await veteranReplyEmail(body,messageid,attach, uuid,body.studentId, body.collegeId);
    return isMailSent;
  } catch (err) {
    console.log('error',err);
    return reject(new Error(err));
  }
}

const sendReconMessage = (post, { studentId, collegeId }, uuid) => {
  return new Promise(async(resolve, reject) => {
    try {

      const logBodyBefore = {
        log_uuid: uuid,
        student_id: studentId,
        college_id: collegeId,
        stage: integrationConstant.RECON_STAGE,
        message: "Before sending recon messages",
        attributes: '',
        status: integrationConstant.STATUS_SUCCESS,
      };

      await insertIntoLogEntry(logBodyBefore);

      await mysqlService.query(reconMessageConstant.SAVE_REPLY_STUDENT_MESSAGE, post);

      const logBodyAfter = {
        log_uuid: uuid,
        student_id: studentId,
        college_id: collegeId,
        stage: integrationConstant.RECON_STAGE,
        message: "Recon message sent successfully",
        attributes: '',
        status: integrationConstant.STATUS_SUCCESS,
      };

      await insertIntoLogEntry(logBodyAfter);
      // requestlogger.log('info', "Message from Student Id:"+studentId+" CollegeID:"+collegeId+" saved to recon_messages.");
      resolve('success')
    } catch (err) {
      console.log('error',err);
      return reject(new Error(err));
    }
  })
}

function getInquiryEmailList(cid, collegeEmail) {
  return new Promise(function (resolve, reject) {
      let query = `SELECT * from college_contacts where college_id=`+cid;
      mysqlService.query(query)
          .then(function (response) {
              if(response && response.length > 0){
                let emailData = "";
                if(response[0].inquiry_admission_email1 == 'yes' && response[0].admission_email_address_1 && response[0].admission_email_address_1 != collegeEmail){
                  emailData+= response[0].admission_email_address_1.trim()+",";
                }
                if(response[0].inquiry_admission_email2 == 'yes' && response[0].admission_email_address_2 && response[0].admission_email_address_2 != collegeEmail){
                  emailData+= response[0].admission_email_address_2.trim()+",";
                }
                if(response[0].inquiry_vet_affairs_email == 'yes' && response[0].vet_affairs_email_address  && response[0].vet_affairs_email_address != collegeEmail){
                  emailData+= response[0].vet_affairs_email_address.trim()+",";
                }
                if(response[0].inquiry_marketing_email1 == 'yes' && response[0].marketing_email_address1 && response[0].marketing_email_address1 != collegeEmail){
                  emailData+= response[0].marketing_email_address1.trim()+",";
                }
                if(response[0].inquiry_marketing_email2 == 'yes' && response[0].marketing_email_address_2 && response[0].marketing_email_address_2 != collegeEmail){
                  emailData+= response[0].marketing_email_address_2.trim()+",";
                }
                if(response[0].inquiry_contact_extra1 == 'yes' && response[0].contact_extra1 && response[0].contact_extra1 != collegeEmail){
                  emailData+= response[0].contact_extra1.trim()+",";
                }
                if(response[0].inquiry_contact_extra2 == 'yes' && response[0].contact_extra2 && response[0].contact_extra2 != collegeEmail){
                  emailData+= response[0].contact_extra2.trim()+",";
                }
                if(response[0].inquiry_contact_extra3 == 'yes' && response[0].contact_extra3 && response[0].contact_extra3 != collegeEmail){
                  emailData+= response[0].contact_extra3.trim()+",";
                }
                if(response[0].inquiry_contact_extra4 == 'yes' && response[0].contact_extra4 && response[0].contact_extra4 != collegeEmail){
                  emailData+= response[0].contact_extra4.trim()+",";
                }
                if(response[0].inquiry_contact_extra4 == 'yes' && response[0].contact_extra5 && response[0].contact_extra5 != collegeEmail){
                  emailData+= response[0].contact_extra5.trim()+",";
                }
                
                if(emailData){
                  let listemailData = (emailData.slice(0,-1)).split(",");
                  //let to = [collegeEmail];
                  let contantEmails = stringUtil.removeDuplicates(listemailData);
                  let bccAddress = [];
                  if(contantEmails.length > 0){
                      bccAddress = contantEmails;
                      if(collegeEmail){
                          if(contantEmails[0] == collegeEmail){
                              contantEmails.splice(0,1);
                          }
                      }
                      if(contantEmails.length > 0){
                        resolve(contantEmails);
                      }else{
                        resolve("empty");
                      }
                  }else{
                    resolve("empty");
                  }
                }else{
                  resolve("empty");
                }
              }else{
                resolve("empty");
              }
          }, function (err) {
              if (err) {
                  var error = err;
                  error.status = 503;
                  return reject(error)
              };
          });
  });
}

const replyAllVeterenMessage = async(messageList) => {
  return Promise.all(messageList.map(message => veteranReplyEmail(message)))
}

return {
  getVeteranReplyReceived: getVeteranReplyReceived,
  getVeteranInboxMessage: getVeteranInboxMessage,
  getVeteranInboxMessageCount: getVeteranInboxMessageCount,
  replyVeterenMessage: replyVeterenMessage,
  deleteVeterenMessage: deleteVeterenMessage,
  getCollegeMessageData: getCollegeMessageData,
  getCollegeInboxMessageCount: getCollegeInboxMessageCount,
  getCollegeInboxMessage: getCollegeInboxMessage,
  replyCollegeMessage: replyCollegeMessage,
  deleteCollegeMessage: deleteCollegeMessage,
  markMessageAsRead: markMessageAsRead,
  veteranReplyEmail: veteranReplyEmail,
  replyAllVeterenMessage
}
  
  })();
  
  module.exports = reconMessageService;