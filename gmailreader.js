let gmailData = (function() {
  let fs = require('fs');
  let readline = require('readline');
  let {google} = require('googleapis');
  let googleAuth = require('google-auth-library');
  let request = require('request');
  let moment =require('moment');
  let replyParser = require("node-email-reply-parser");
  let messageDecode = require('./utils/base64Utility');
  let mysqlService=require('./services/mysqlService');
  let reconMessageConstant=require('./constants/reconMessageConstant');
  let emailService=require('./services/emailService');
  let emailConstant=require('./constants/emailConstant');
  
  // If modifying these scopes, delete your previously saved credentials
  // at ~/.credentials/gmail-nodejs-quickstart.json
  var SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];
  //var SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];
  var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
      process.env.USERPROFILE) + '/.credentials/';
  var TOKEN_PATH = TOKEN_DIR + 'gmail-nodejs-quickstart.json';
  //readGmailInbox();
  // Load client secrets from a local file.
  function readGmailInbox(){
    fs.readFile('client_secret.json', function processClientSecrets(err, content) {
      if (err) {
        console.log('Error loading client secret file: ' + err);
        return;
      }
      // Authorize a client with the loaded credentials, then call the
      // Gmail API.
      authorize(JSON.parse(content), listLabels);
    });
  }
  
  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(credentials, callback) {
    //staging
    var clientSecret = "QjMp41zESh0WcR8urMUGVNUP";
    var clientId = "38584654078-f9d5vhldi1ubhh9i2p5j6n0vdi3hdqn9.apps.googleusercontent.com";
    //local
    //var clientSecret = "cWpCNhD_ZuszPZ6-77G-CTU3";
    //var clientId = "1037013853185-gvipleflm0omn6s730ckcfnphggo0oms.apps.googleusercontent.com";
    var redirectUrl = "https://developers.google.com/oauthplayground";
    //var auth = new googleAuth();
    //var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    const oauth2Client = new google.auth.OAuth2(
        clientId, clientSecret, redirectUrl);  
    // Check if we have previously stored a token.
    console.log("T Path:",TOKEN_PATH);
    fs.readFile(TOKEN_PATH, function(err, token) {
      if (err) {
        getNewToken(oauth2Client, callback);
      } else {
        //oauth2Client.credentials = JSON.parse(token);
        oauth2Client.setCredentials(JSON.parse(token));
        callback(oauth2Client);
      }
    });
  }
  
  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   *
   * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback to call with the authorized
   *     client.
   */
  function getNewToken(oauth2Client, callback) {
    //console.log('inside getnew token')
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      approval_prompt:'force',
      scope: SCOPES
    });
    //console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
      rl.close();
      oauth2Client.getToken(code, function(err, token) {
        if (err) {
          console.log('Error while trying to retrieve access token', err);
          return;
        }
        //oauth2Client.credentials = token;
        oauth2Client.setCredentials(token);
        storeToken(token);
        callback(oauth2Client);
      });
    });
  }
  
  /**
   * Store token to disk be used in later program executions.
   *
   * @param {Object} token The token to store to disk.
   */
  function storeToken(token) {
    try {
      fs.mkdirSync(TOKEN_DIR);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
    fs.writeFile(TOKEN_PATH, JSON.stringify(token));
    console.log('Token stored to ' + TOKEN_PATH);
  }
  
  /**
   * Lists the labels in the user's account.
   *
   * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
   */
  function listLabels(auth) {
    //console.log('listLabels')
    var gmail = google.gmail({auth: auth, version: 'v1'});
    gmail.users.messages.list({
      includeSpamTrash: false,
      //maxResults: 10,
      //q: "in:inbox",
      q: "in:inbox is:unread",
      userId: 'me',
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      //console.log("Response:",response.messages);
      var datas = response.data.messages;
      //console.log("Data:",datas);
      if (!datas) {
        console.log('No Data In gamil found.');
      } else {
        //console.log('data found')
        for (var i = 0; i < datas.length; i++) {
          var messageId = datas[i].id;
          getMessage(messageId, auth);
        }
      }
    });
  }
  
  function getMessage(messageId, auth) {
    var gmail = google.gmail({ auth: auth, version: 'v1' });
  
    gmail.users.messages.get({
      'userId': 'me',
      'id': messageId,
    }, function (err, result) {
      //console.log("EmailData:",result);
      //console.log(getHeader(result.payload.headers, 'From'));
      //console.log('ccc',getHeader(result.payload.headers, 'Cc'));
      if(result)
      {
        let todata = getHeader(result.data.payload.headers, 'To');

        // if(todata == 'veterans+Q09MTEVHRStVU0VSKzlBRjBBNC02Q0U2OUMtMUMzQjZDLTkzNzIrMzE4MzBDLTlGQ0RGNy1DQTA0NDAtMEY1MisxOTU5Kw==@collegerecon.com')
        //   console.log("TO::",todata);
        let encodeData=todata.substring(todata.lastIndexOf("+")+1,todata.lastIndexOf("@"));
        //console.log("EncodeData:",encodeData);
        //console.log("DecodeData:",messageDecode.decodeBase64(encodeData));
        let messageData = (messageDecode.decodeBase64(encodeData)).split("+");
        //console.log("MD:",messageData);
        if(messageData.length == 1){
          let email_list = getHeader(result.data.payload.headers, 'Cc').split(',');
          // console.log("email_list:",email_list);
          email_list.map (value =>{
            let vet_email_encrypt_value = value.substring(value.lastIndexOf("+")+1,value.lastIndexOf("@"));
            // console.log('vet_email_encrypt_value:',vet_email_encrypt_value)
            let check_veteran_cc = (messageDecode.decodeBase64(vet_email_encrypt_value)).split("+");
            if(check_veteran_cc.length == 6){
              messageData = check_veteran_cc;
            }
          })
          // if (email_list.length > 0){
             
          // }
        }
        // if(todata == 'veterans+Q09MTEVHRStVU0VSKzlBRjBBNC02Q0U2OUMtMUMzQjZDLTkzNzIrMzE4MzBDLTlGQ0RGNy1DQTA0NDAtMEY1MisxOTU5Kw==@collegerecon.com')
        // {
        //   console.log("ML:",messageData);
        // }
      //console.log("TO:",todata);
      
      // if(todata == 'veterans+Q09MTEVHRStVU0VSKzlBRjBBNC02Q0U2OUMtMUMzQjZDLTkzNzIrMzE4MzBDLTlGQ0RGNy1DQTA0NDAtMEY1MisxOTU5Kw==@collegerecon.com')
      //   console.log("MLl:",messageData.length);
        if(messageData.length == 6){
          let cr_message = '';
          //console.log("HH:",result.payload.parts);
          if(result.data.payload.parts && result.data.payload.parts[0].body.size != 0){
            //console.log("console 1");
            cr_message= result.data.payload.parts[0].body.data;
          }else if(result.data.payload.parts && result.data.payload.parts[0].parts){
            //console.log("console 2");
            //console.log("DD2:",result.payload.parts[0].parts[0].parts);
            //console.log("DD3:",result.payload.parts[0].parts[0].parts[0].body.data);
            cr_message= result.data.payload.parts[0].parts[0].body.data;
          }else{
            //console.log("console 3");
            cr_message= result.data.payload.body.data;
          }

          if(!cr_message){
            return 0;
          }
          //console.log("cr_message:",cr_message);
          //console.log("result.payload.parts.msg",result.payload.parts[0].parts[0].body.data);
          let quotemessage = messageDecode.decodeBase64(cr_message);
          //console.log("quotemessage:",quotemessage);
          //console.log("replyParser(quotemessage).getFragments():",replyParser(quotemessage).getFragments());
          //console.log("replyParser(quotemessage).getFragments()[0].getContent():",replyParser(quotemessage).getFragments()[0].getContent());
          let message = replyParser(quotemessage).getFragments()[0].getContent();
          //console.log("message:",message);
          let emailData = {
            responder: messageData[0],
            recipient:messageData[1],
            message_state:"NEW",
            message_id:messageData[2],
            student_id:messageData[3],
            college_id:messageData[4], 
            message:message,
            primary_source: "email",
            secondary_source: "/email",
            //attachment: attach,
            date_created:moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
          };
          //console.log("PostData:",post);

          mysqlService.query(reconMessageConstant.SAVE_REPLY_STUDENT_MESSAGE, emailData)
          .then((results) => {
                //Mark as read code;
                gmail.users.messages.modify({
                  'userId':'me',
                  'id':messageId,
                  'resource': {
                      'addLabelIds':[],
                      'removeLabelIds': ['UNREAD']
                  }
              }, function(err) {
                  if (err) {
                    console.log('Failed to mark email as read! Error: '+err);
                      return;
                  }
                  console.log('Successfully marked email as read', messageId);
                  //Reply email message
              let sqlQuery = "";
              let from = emailConstant.NO_REPLY_EMAIL;
              let subject = emailConstant.NEW_REPLY_VETERAN_MESSAGE
              if(messageData[0] == "COLLEGE"){
                sqlQuery = 'SELECT email FROM students WHERE uuid="'+messageData[3]+'"';
              }else{
                sqlQuery = 'SELECT contact_email FROM colleges WHERE id="'+messageData[4]+'"';
              }
              //console.log("MessageSata::",messageData);
              //console.log("QQQ:",sqlQuery);
              mysqlService.query(sqlQuery)
              .then(function(response){
                //console.log("respose:",response);
                let to = "";
                let attach = "";
                let replyto = "";
                let from = emailConstant.NO_REPLY_EMAIL;
                let infoQuery = "";
                if(messageData[0] == "COLLEGE"){
                  replyto = "veterans+"+messageDecode.encodeBase64("USER+COLLEGE+"+messageData[2]+"+"+messageData[3]+"+"+messageData[4]+"+"+attach)+"@collegerecon.com";
                  //replyto = "shivaram+"+messageDecode.encodeBase64("USER+COLLEGE+"+messageData[2]+"+"+messageData[3]+"+"+messageData[4]+"+"+attach)+"@noveltytechnology.com";
                  to = [response[0].email];
                  infoQuery = 'SELECT college_name as display_name FROM colleges WHERE id="'+messageData[4]+'"';;
                }else{
                  replyto = "veterans+"+messageDecode.encodeBase64("COLLEGE+USER+"+messageData[2]+"+"+messageData[3]+"+"+messageData[4]+"+"+attach)+"@collegerecon.com";
                  //replyto = "shivaram+"+messageDecode.encodeBase64("COLLEGE+USER+"+messageData[2]+"+"+messageData[3]+"+"+messageData[4]+"+"+attach)+"@noveltytechnology.com";
                  to = [response[0].contact_email];
                  infoQuery = 'SELECT Concat(Ifnull(first_name," ") ," ", Ifnull(middle_initial," ")," ", Ifnull(last_name," ")) as display_name FROM students WHERE uuid="'+messageData[3]+'"';
                }
                //console.log("QQ:",infoQuery);
                mysqlService.query(infoQuery)
                  .then(function(response1){
                    //console.log("response1:",response1);
                    if(response1.length == 1){
                      from = response1[0].display_name+"<"+from+">";
                    }
                    emailService.sendEmail(from,to,subject,message,replyto).then(function(response2){
                      //resolve("success");
                      console.log("Message sent.");
                      },function(err){ 
                        if (err) {
                          var error = err;
                          error.status = 503;
                          console.log("ERR:",err);
                        };
                      });
                  },function(err){  
                    if (err) {
                      var error = err;
                      error.status = 503;
                      console.log("ERR:",err);
                    };
                  });
                },function(err){  
                  if (err) {
                    var error = err;
                    error.status = 503;
                    console.log("ERR:",err);
                  };
                });
              });

            }).catch((err) =>{
              console.log('error',err);
            });
        }
      }
    });
  }
  
  function getHeader(headers, index) {
    var $;
    var header = '';
    for (var i = 0; i < headers.length; i++) {
      if(headers[i].name === index){
        header = headers[i].value;
      }
    }
    return header;
  }

  // function decodeValue(){
  //   var todata='veterans+Q09MTEVHRStVU0VSK0U0OUFBMy0xMjVENkYtMUU3OUY3LUMzRjYrNzA3RTUxLUU1NUJBMy02QTc4NzgtNTVENCsxOTYyKw==@collegerecon.com'
  //   let encodeData=todata.substring(todata.lastIndexOf("+")+1,todata.lastIndexOf("@"));
   
  //   let messageData = (messageDecode.decodeBase64(encodeData)).split("+");
  //   console.log('messageData',messageData);
  // }
  // decodeValue();
  
  return {
    readGmailInbox: readGmailInbox
  }
  
  })();
  
  module.exports = gmailData;