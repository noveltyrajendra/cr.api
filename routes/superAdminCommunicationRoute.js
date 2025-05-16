const express = require('express');
const router = express.Router();
const superAdminCommunicationService=require('../services/superAdminCommunicationService');
const { errorHandler } =require('../utils/errorHandler');

router.use(function(req,res,next){
	// console.log('middleware is working.');	
	next(); 
});

router.get('/superadmin/communication/list', function(req, res ) {
	superAdminCommunicationService.listComminication()
	.then(function(response){
		if(response)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'unable to update'});
		}

	},function(err){ errorHandler(err,res); });

});

router.post('/superadmin/send/proxymesssage', function(req, res ) {
	superAdminCommunicationService.sendProxyMessage(req.body)
	.then(function(response){
		if(response)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'unable to update'});
		}

	},function(err){ errorHandler(err,res); });

});

router.get('/superadmin/communication/college/:id', function(req, res ) {
	superAdminCommunicationService.listCommunicationDetail(req.params.id)
	.then(function(response){
		if(response)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'unable to update'});
		}

	},function(err){ errorHandler(err,res); });

});

// Return router
module.exports = router;