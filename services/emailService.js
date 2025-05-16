var emailService = (function() {

	var aws = require('aws-sdk');
	var config = require('../config');
	var mailcomposer = require('mailcomposer');
	var ses = new aws.SES({"accessKeyId": config.ACCESS_KEY_ID, "secretAccessKey": config.ACCESS_SECRET_KEY, "region": config.REGION});

	function sendEmail(from,to,subject,message,replyto=null,bccAddress=[],useForStaging = false)
	{	
		return new Promise(function(resolve, reject) {
			var nodeEnv = process.env.NODE_ENV;
			// var nodeEnv = 'production';
			//console.log("EE:",nodeEnv);
			if(nodeEnv == "production" || useForStaging){
				var eparam = {
					Destination: {
						BccAddresses : bccAddress ? bccAddress : '',
						ToAddresses: to
					},
					ConfigurationSetName: 'CollegeRecon_Email_Open_Tracking',
					Message: {
						Body: {
							Html: {
								Data: message
							},
							Text: {
								Data: message
							}
						},
						Subject: {
							Data: subject
						}
					},
					Source: from,
					ReplyToAddresses: [replyto ? replyto : from],
					ReturnPath: from
				};
	
				ses.sendEmail(eparam, function (err, data) {
					if (err) return resolve(err);
					else 	{
						//console.log('successs email')
						return resolve("success");
					};
				})
			}else{
				return resolve("success");
			}
		});
	}	

	// sendEmail('info@collegerecon.com',['ramesh@noveltytechnology.com'],'test open email','<div>message <a href="google.com"> link </a></div>')

	function sendAttachementEmail(from,to,subject,message,attachment){
		return new Promise(function(resolve, reject) {

			var mailOptions = {
				from: from,
				subject: subject,
				text: message,
				html: message,
				to: to,
				attachments: [
						{
								filename: attachment.filename,
								path: attachment.path
						}
				]
			};
			var mail = mailcomposer(mailOptions);
			mail.build(function (err, message){
				ses.sendRawEmail({RawMessage: {Data: message}}, function (err, data) {
						if (err) {
							return reject(`Error sending raw email: ${err}`);
						}else{
							return resolve('The email was successfully sent');
						}
				}); 
			});
		});
	}

	return {
		sendEmail: sendEmail,
		sendAttachementEmail: sendAttachementEmail
	}

})();

module.exports = emailService;