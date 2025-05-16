let nagEmailService = (function() {
  var mysqlService = require("./mysqlService");
  let moment = require("moment");
  const emailConstant = require('../constants/emailConstant');
  let requestlogger = require('../utils/requestInfoLog');
  const webhookBatchInsertData = [];

  function saveNagEmailEventsOld(nagEmail,type) {
    return new Promise(function(resolve, reject) {
      if(type == 'nagemail'){
        let queryValue = `Select * from nag_email_events where message_id = '${
          nagEmail.messageId
        }' and message_to = '${nagEmail.messageTo}' and event_type = '${
          nagEmail.eventType
        }'`;
        // console.log("queryva", queryValue);
        mysqlService
          .query(queryValue)
          .then(function(response) {
            if (response.length == 0) {
              let nagEmailEvents = {
                event_type: nagEmail.eventType,
                message_subject: nagEmail.messageSubject,
                message_to: nagEmail.messageTo,
                message_id: nagEmail.messageId,
                message_date: moment(nagEmail.messageDate).format(
                  "YYYY-MM-DD HH:mm:ss"
                ),
                action_date: moment(nagEmail.actionDate).format(
                  "YYYY-MM-DD HH:mm:ss"
                ),
                nag_email_rule: nagEmail.nagEmailRule,
                created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
              };
  
              mysqlService
                .query("INSERT INTO nag_email_events SET ?", nagEmailEvents)
                .then(function(response) {
                  resolve(response);
                })
                .catch(err => reject(err));
            }
            // console.log('response',response.length)
            // resolve(response);
          })
          .catch(err => reject(err));
      }else if(type == 'bouncematch'){
        if(nagEmail.eventType == 'Click'){
          let linkData = nagEmail.clickUrl.split("/");
          let collegeAlias = linkData[3]?linkData[3]:"";
          let query = "SELECT id from colleges WHERE college_alias='"+collegeAlias+"' AND status='ACTIVE'";
          mysqlService.query(query)
			      .then(function(response){
                let cid = 0;
                if(response[0].id){
                  cid = response[0].id;
                }
                let queryValue = `Select * from register_bounce_match_email_events where message_id = '${
                  nagEmail.messageId
                }' and message_to = '${nagEmail.messageTo}' and college_id = '${
                  cid
                }'`;
                mysqlService
                  .query(queryValue)
                  .then(function(mresponse) {
                    if (mresponse.length == 0) {
                      let nagEmailEvents = {
                        event_type: nagEmail.eventType,
                        message_subject: nagEmail.messageSubject,
                        message_to: nagEmail.messageTo,
                        message_id: nagEmail.messageId,
                        linkurl: nagEmail.clickUrl,
                        college_id: cid,
                        message_date: moment(nagEmail.messageDate).format(
                          "YYYY-MM-DD HH:mm:ss"
                        ),
                        action_date: moment(nagEmail.actionDate).format(
                          "YYYY-MM-DD HH:mm:ss"
                        ),
                        created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                      };
          
                      mysqlService
                        .query("INSERT INTO register_bounce_match_email_events SET ?", nagEmailEvents)
                        .then(function(response) {
                          resolve(response);
                        })
                        .catch(err => reject(err));
                    }
                  })
                  .catch(err => reject(err));
            })
            .catch(err => reject(err));
        }else{
          let queryValue = `Select * from register_bounce_match_email_events where message_id = '${
            nagEmail.messageId
          }' and message_to = '${nagEmail.messageTo}' and event_type = '${
            nagEmail.eventType
          }'`;
          // console.log("queryva", queryValue);
          mysqlService
            .query(queryValue)
            .then(function(response) {
              if (response.length == 0) {
                let nagEmailEvents = {
                  event_type: nagEmail.eventType,
                  message_subject: nagEmail.messageSubject,
                  message_to: nagEmail.messageTo,
                  message_id: nagEmail.messageId,
                  message_date: moment(nagEmail.messageDate).format(
                    "YYYY-MM-DD HH:mm:ss"
                  ),
                  action_date: moment(nagEmail.actionDate).format(
                    "YYYY-MM-DD HH:mm:ss"
                  ),
                  created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                };
    
                mysqlService
                  .query("INSERT INTO register_bounce_match_email_events SET ?", nagEmailEvents)
                  .then(function(response) {
                    resolve(response);
                  })
                  .catch(err => reject(err));
              }
            })
            .catch(err => reject(err));
        }
      }else if(type == 'bouncedegree'){
        if(nagEmail.eventType == 'Click'){
          let linkData = nagEmail.clickUrl.split("/");
          let collegeAlias = linkData[3]?linkData[3]:"";
          let query = "SELECT id from colleges WHERE college_alias='"+collegeAlias+"' AND status='ACTIVE'";
          mysqlService.query(query)
			      .then(function(response){
                let cid = 0;
                if(response[0].id){
                  cid = response[0].id;
                }
                let queryValue = `Select * from register_bounce_degree_email_events where message_id = '${
                  nagEmail.messageId
                }' and message_to = '${nagEmail.messageTo}' and college_id = '${
                  cid
                }'`;
                mysqlService
                  .query(queryValue)
                  .then(function(mresponse) {
                    if (mresponse.length == 0) {
                      let nagEmailEvents = {
                        event_type: nagEmail.eventType,
                        message_subject: nagEmail.messageSubject,
                        message_to: nagEmail.messageTo,
                        message_id: nagEmail.messageId,
                        linkurl: nagEmail.clickUrl,
                        college_id: cid,
                        message_date: moment(nagEmail.messageDate).format(
                          "YYYY-MM-DD HH:mm:ss"
                        ),
                        action_date: moment(nagEmail.actionDate).format(
                          "YYYY-MM-DD HH:mm:ss"
                        ),
                        created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                      };
          
                      mysqlService
                        .query("INSERT INTO register_bounce_degree_email_events SET ?", nagEmailEvents)
                        .then(function(response) {
                          resolve(response);
                        })
                        .catch(err => reject(err));
                    }
                  })
                  .catch(err => reject(err));
            })
            .catch(err => reject(err));
        }else{
          let queryValue = `Select * from register_bounce_degree_email_events where message_id = '${
            nagEmail.messageId
          }' and message_to = '${nagEmail.messageTo}' and event_type = '${
            nagEmail.eventType
          }'`;
          // console.log("queryva", queryValue);
          mysqlService
            .query(queryValue)
            .then(function(response) {
              if (response.length == 0) {
                let nagEmailEvents = {
                  event_type: nagEmail.eventType,
                  message_subject: nagEmail.messageSubject,
                  message_to: nagEmail.messageTo,
                  message_id: nagEmail.messageId,
                  message_date: moment(nagEmail.messageDate).format(
                    "YYYY-MM-DD HH:mm:ss"
                  ),
                  action_date: moment(nagEmail.actionDate).format(
                    "YYYY-MM-DD HH:mm:ss"
                  ),
                  created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
                };
    
                mysqlService
                  .query("INSERT INTO register_bounce_degree_email_events SET ?", nagEmailEvents)
                  .then(function(response) {
                    resolve(response);
                  })
                  .catch(err => reject(err));
              }
            })
            .catch(err => reject(err));
        }
      }else{
        let queryValue = `Select * from college_activity_email_events where message_id = '${
          nagEmail.messageId
        }' and message_to = '${nagEmail.messageTo}' and event_type = '${
          nagEmail.eventType
        }'`;
        // console.log("queryva", queryValue);
        mysqlService
          .query(queryValue)
          .then(function(response) {
            if (response.length == 0) {
              let collegeActivityEmailEvents = {
                event_type: nagEmail.eventType,
                message_subject: nagEmail.messageSubject,
                message_to: nagEmail.messageTo,
                message_id: nagEmail.messageId,
                message_date: moment(nagEmail.messageDate).format(
                  "YYYY-MM-DD HH:mm:ss"
                ),
                action_date: moment(nagEmail.actionDate).format(
                  "YYYY-MM-DD HH:mm:ss"
                ),
                created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
              };
  
              mysqlService
                .query("INSERT INTO college_activity_email_events SET ?", collegeActivityEmailEvents)
                .then(function(response) {
                  resolve(response);
                })
                .catch(err => reject(err));
            }
            // console.log('response',response.length)
            // resolve(response);
          })
          .catch(err => reject(err));
      }
    });
  }

  // saveNagEmailEvents({
  //   messageId: 1,
  //   messageTo: "Ramesh@noveltytechnology.com",
  //   eventType:"open",
  //   messageSubject:"test",
  //   messageDate:new Date(),
  //   actionDate:new Date(),
  //   nagEmailRule:1
  // });

  function saveNagEmailEvents(nagEmail,type) {
    return new Promise(async (resolve, reject) => {
      try{
        if(nagEmail.eventType == 'Click'){
          let linkData = nagEmail.clickUrl.split("/");
          requestlogger.log('info', "LinkData:"+linkData);
          const splitForFeature = nagEmail.clickUrl.split("?");
          const isFeatureSchool = splitForFeature && splitForFeature[1] && splitForFeature[1].toString().toLowerCase() === emailConstant.FEATURE_SCHOOL_TRACKER
          let collegeAlias = linkData && linkData[3] ? linkData[3].split('?')[0] : "";
          requestlogger.log('info', "CollegeAlias:"+collegeAlias);
          let query = "SELECT id from colleges WHERE college_alias='"+collegeAlias+"' AND status='ACTIVE'";
          let collegeInfo = await executeNagQuery(query);
          requestlogger.log('info', "CollegeInfo Data:"+collegeInfo);
          let cid = 0;
          if(collegeInfo && collegeInfo[0].id){
            cid = collegeInfo[0].id;
          
            let queryValue = `Select * from aws_email_tracking where reference_type = '${type}' and message_id = '${nagEmail.messageId}' and message_to = '${nagEmail.messageTo}' and college_id = '${cid}'`;
            let checkExist = await executeNagQuery(queryValue);
            if(checkExist && checkExist.length == 0){
              let nagEmailEvents = {
                event_type: nagEmail.eventType,
                message_subject: nagEmail.messageSubject,
                message_to: nagEmail.messageTo,
                message_id: nagEmail.messageId,
                linkurl: nagEmail.clickUrl,
                college_id: cid,
                nag_email_rule: nagEmail.nagEmailRule,
                reference_type: type,
                reference_key: 'college_id',
                reference_value: cid,
                is_feature: isFeatureSchool ? true : false,
                message_date: moment(nagEmail.messageDate).format(
                  "YYYY-MM-DD HH:mm:ss"
                ),
                action_date: moment(nagEmail.actionDate).format(
                  "YYYY-MM-DD HH:mm:ss"
                ),
                created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
              };
              let result = await crudNagQuery("INSERT INTO aws_email_tracking SET ?", nagEmailEvents);
              return resolve(result);
            }
          }
        }else{
          /*let queryValue = `Select * from aws_email_tracking where reference_type = '${type}' and message_id = '${nagEmail.messageId}' and message_to = '${nagEmail.messageTo}' and event_type = '${ nagEmail.eventType }'`;
          let checkExist = await executeNagQuery(queryValue);
          if(checkExist && checkExist.length == 0){*/
          /*let nagEmailEvents = [
              nagEmail.eventType,
              nagEmail.messageSubject,
              nagEmail.messageTo,
              nagEmail.messageId,
              nagEmail.nagEmailRule,
              type,
              moment(nagEmail.messageDate).format("YYYY-MM-DD HH:mm:ss"),
              moment(nagEmail.messageDate).format("YYYY-MM-DD HH:mm:ss"),
              moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
            ];
            bulkInsertWebookdata(nagEmailEvents);*/
            if(type == "collegeactivity" && (nagEmail.eventType.toLowerCase() == "send" || nagEmail.eventType.toLowerCase() == "delivery")){
              return resolve("success");
            }else{
              let nagEmailEvents = {
                event_type: nagEmail.eventType,
                message_subject: nagEmail.messageSubject,
                message_to: nagEmail.messageTo,
                message_id: nagEmail.messageId,
                nag_email_rule: nagEmail.nagEmailRule,
                reference_type: type,
                message_date: moment(nagEmail.messageDate).format(
                  "YYYY-MM-DD HH:mm:ss"
                ),
                action_date: moment(nagEmail.actionDate).format(
                  "YYYY-MM-DD HH:mm:ss"
                ),
                created_date: moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
              };
              let result = await crudNagQuery("INSERT INTO aws_email_tracking SET ?", nagEmailEvents);
              return resolve(result);
            }
          //}
        }
      }catch(error){
        return reject(error)
      }
    });
  }

  async function bulkInsertWebookdata(data) {
    webhookBatchInsertData.push(data);
    const currentSize = webhookBatchInsertData.length;
    
    setTimeout(async () => {
      if (currentSize === webhookBatchInsertData.length)
        try{
          requestlogger.log('info', "After 5 Min");
          await mysqlService.query(
            'INSERT INTO aws_email_tracking(event_type,message_subject,message_to,message_id,nag_email_rule,reference_type,message_date,action_date,created_date) VALUES  ?',
            [webhookBatchInsertData]
          );
          webhookBatchInsertData.length = 0;
        }catch(e){
          console.log("ERR:",e);
        }
    }, 300000);
    if (webhookBatchInsertData.length === 1000) {
      try{
        requestlogger.log('info', "Length 1000");
        await mysqlService.query(
          'INSERT INTO aws_email_tracking(event_type,message_subject,message_to,message_id,nag_email_rule,reference_type,message_date,action_date,created_date) VALUES  ?',
            [webhookBatchInsertData]
        );
        webhookBatchInsertData.length = 0;
      }catch(e){
        console.log("ERR:",e);
      }
    }
  }

  function executeNagQuery(sqlQuery) {
    return new Promise(async (resolve, reject) => {
      try{
        const result = await mysqlService.query(sqlQuery);
        return resolve(result);
      }catch(error){
        return reject(error)
      }
    });
  }

  function crudNagQuery(sqlQuery,data) {
    return new Promise(async (resolve, reject) => {
      try{
        const result = await mysqlService.query(sqlQuery, data);
        return resolve(result);
      }catch(error){
        return reject(error)
      }
    });
  }

  return {
    saveNagEmailEvents: saveNagEmailEvents
  };
})();

module.exports = nagEmailService;
