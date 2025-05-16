const express = require('express');
const router = express.Router(); 
const emailService=require('../services/emailService');
const { errorHandler } = require('../utils/errorHandler');

router.use(function(req,res,next){
	// console.log('middleware is working.');	
	next(); 
});

router.post('/email', function(req, res ) {
	emailService.sendEmail(req.body.from,req.body.to,req.body.subject,req.body.message).then(function(response){
		res.status(200).send({status:200,data:response});
	},function(err){ errorHandler(err,res); });
});

/** Attachement Message Parameter
{
"from" : "no-reply@collegerecon.com",
"to" : "shivaram.prajapati007@gmail.com",
"subject" : "Sample SES message with attachment",
"message" : "Hey folks, this is a test message from SES with an attachment.",
"attachement" : {
	"filename" : "test.jpg",
	"path": "http://www.cosmic-energy.org/wp-content/uploads/2013/01/background.jpg"
}
}
*/

router.post('/emailattach', function(req, res ) {
	emailService.sendAttachementEmail(req.body.from,req.body.to,req.body.subject,req.body.message,req.body.attachement).then(function(response){
		res.status(200).send({status:200,data:response});
	},function(err){ errorHandler(err,res); });
});

// Return router
module.exports = router;