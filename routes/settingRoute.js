const express = require('express');
const router = express.Router(); 
const settingService=require('../services/settingService');
const { errorHandler } =require('../utils/errorHandler');

router.use(function(req,res,next){
	next(); 
});

router.post('/deactivate/user', function(req, res ) {
	settingService.deactivateUser(req.body)
	.then(function(response){
		res.json({success:true,data:response});
	},function(err){ errorHandler(err,res); });

});

router.post('/setting/privacy', function(req, res ) {
	settingService.changePrivacySetting(req.body)
	.then(function(response){
		res.json({success:true,data:response});
	},function(err){ errorHandler(err,res); });

});

router.post('/setting/resetpassword', function(req, res ) {
	settingService.changePassword(req.body)
	.then(function(response){
		res.json({success:true,data:response});
	},function(err){ errorHandler(err,res); });

});

router.post('/setting/email', function(req, res ) {
	settingService.changeEmail(req.body)
	.then(function(response){
		res.json({success:true,data:response});
	},function(err){ errorHandler(err,res); });

});

// Return router
module.exports = router;