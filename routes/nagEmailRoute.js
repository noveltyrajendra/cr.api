var express = require("express");
var router = express.Router();
var nagEmailService = require("../services/nagEmailService");
let nagEmailConstant=require("../constants/nagEmailConstant");
let emailConstant=require('../constants/emailConstant');

router.use(function(req, res, next) {
  next();
});

router.post("/nagemail", function(req, res) {
  let body = "";
  req.on("data", chunk => {
    body += chunk.toString();
  });

  req.on("end", () => {
    let payload = JSON.parse(body);
    if (payload.Type === "Notification") {
      let message = JSON.parse(payload.Message);
      let eventType = message && message.eventType;
      //let checkActivity = message.mail.commonHeaders.subject.toLowerCase().split("at");
      let checkBounce = message.mail.commonHeaders.subject.toLowerCase().split(",");
      let campaignEmail =  message.mail.commonHeaders.subject.toLowerCase().split("for");
      let dbName = "";
      if(message.mail.commonHeaders.subject.toLowerCase().trim() == "how military-connected student’s behavior impacts college recruiting")
      {
        dbName = "collegeactivity";
      }else if(message.mail.commonHeaders.subject.toLowerCase().trim() == 'collegerecon monthly campaign review'){
        dbName = "partnercollege";
      }else if(checkBounce[1] && checkBounce[1].toLowerCase().trim() == 'here are your selected degree programs'){
        dbName = "bouncedegree";
      }else if(checkBounce[1] && checkBounce[1].toLowerCase().trim() == 'here are your matched schools from collegerecon.'){
        dbName = "bouncematch";
      }else if(nagEmailConstant.NAG_EMAIL_SUBJECTS.includes(message.mail.commonHeaders.subject.toLowerCase())){
        dbName = "nagemail";
      }else if(nagEmailConstant.SCHOLARSHIP_SUBJECTS.includes(message.mail.commonHeaders.subject.toLowerCase())){
        dbName = "scholarship";
      }else if(campaignEmail[0] && nagEmailConstant.CAMPAIGN_SUBJECTS.includes(campaignEmail[0].toLowerCase().trim())){
        dbName = "campaign";
      }else if(message.mail.commonHeaders.subject.toLowerCase() == emailConstant.NEW_REPLY_VETERAN_MESSAGE.toLowerCase()){
        dbName = "requestinfo";
      }else{
        dbName = "other";
      }
      
      if (eventType && eventType == "Open") {
        let nagEmailEvents = {
          eventType: eventType,
          messageSubject: message.mail.commonHeaders.subject,
          messageTo: message.mail.destination[0],
          messageId: message.mail.messageId,
          messageDate: message.mail.timestamp,
          actionDate: message.open.timestamp,
          nagEmailRule:
            message.mail.commonHeaders.subject.toLowerCase() ==
            "you have new messages waiting"
              ? "1"
              : message.mail.commonHeaders.subject.toLowerCase() ==
                "messages awaiting your reply"
              ? "2"
              : message.mail.commonHeaders.subject.toLowerCase() ==
                "messages received and awaiting your reply"
              ? "3"
              : message.mail.commonHeaders.subject.toLowerCase() ==
                "final reminder: respond to colleges now"
              ? "4"
              : "0"
        };
        nagEmailService
          .saveNagEmailEvents(nagEmailEvents,dbName)
          .then(res => console.log("successfully captured"));
      } else if (eventType && eventType == "Click") {
        //console.log("ClickLink:",message.click.link);
        let nagEmailEvents = {
          eventType: eventType,
          clickUrl: message.click.link,
          messageSubject: message.mail.commonHeaders.subject,
          messageTo: message.mail.destination[0],
          messageId: message.mail.messageId,
          messageDate: message.mail.timestamp,
          actionDate: message.click.timestamp,
          nagEmailRule:
            message.mail.commonHeaders.subject.toLowerCase() ==
            "you have new messages waiting"
              ? "1"
              : message.mail.commonHeaders.subject.toLowerCase() ==
                "messages awaiting your reply"
              ? "2"
              : message.mail.commonHeaders.subject.toLowerCase() ==
                "messages received and awaiting your reply"
              ? "3"
              : message.mail.commonHeaders.subject.toLowerCase() ==
                "final reminder: respond to colleges now"
              ? "4"
              : "0"
        };
        nagEmailService
          .saveNagEmailEvents(nagEmailEvents,dbName)
          .then(res => console.log("successfully captured"));
      } else if (eventType && eventType == "Bounce") {
        let nagEmailEvents = {
          eventType: eventType,
          messageSubject: message.mail.commonHeaders.subject,
          messageTo: message.mail.destination[0],
          messageId: message.mail.messageId,
          messageDate: message.mail.timestamp,
          actionDate: message.mail.timestamp,
          nagEmailRule:
            message.mail.commonHeaders.subject.toLowerCase() ==
            "you have new messages waiting"
              ? "1"
              : message.mail.commonHeaders.subject.toLowerCase() ==
                "messages awaiting your reply"
              ? "2"
              : message.mail.commonHeaders.subject.toLowerCase() ==
                "messages received and awaiting your reply"
              ? "3"
              : message.mail.commonHeaders.subject.toLowerCase() ==
                "final reminder: respond to colleges now"
              ? "4"
              : "0"
        };
        nagEmailService
          .saveNagEmailEvents(nagEmailEvents,dbName)
          .then(res => console.log("successfully captured"));
      } else if (eventType && (emailConstant.TRACK_EMAIL_EVENT.includes(eventType))) {
        let nagEmailEvents = {
          eventType: eventType,
          messageSubject: message.mail.commonHeaders.subject,
          messageTo: message.mail.destination[0],
          messageId: message.mail.messageId,
          messageDate: message.mail.timestamp,
          actionDate: message.mail.timestamp,
          nagEmailRule:
            message.mail.commonHeaders.subject.toLowerCase() ==
            "you have new messages waiting"
              ? "1"
              : message.mail.commonHeaders.subject.toLowerCase() ==
                "messages awaiting your reply"
              ? "2"
              : message.mail.commonHeaders.subject.toLowerCase() ==
                "messages received and awaiting your reply"
              ? "3"
              : message.mail.commonHeaders.subject.toLowerCase() ==
                "final reminder: respond to colleges now"
              ? "4"
              : "0"
        };
        nagEmailService
          .saveNagEmailEvents(nagEmailEvents,dbName)
          .then(res => console.log("successfully captured"));
      }
    }
    // if (payload.Type === "SubscriptionConfirmation") {
    //   console.log("payload.SubscribeURL", payload.SubscribeURL);
    // }
  });

  // req.on('end', () => {
  //   let payload = JSON.parse(body)

  //   if (payload.Type === 'SubscriptionConfirmation') {
  //     console.log('payload.SubscribeURL',payload.SubscribeURL)
  //   }
  // })
  //  console.log('req',req);
  //  console.log('res',res)
});

// Return router
module.exports = router;
