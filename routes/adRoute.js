const express    = require('express');
const router = express.Router(); 
const adService=require('../services/adService');
const {errorHandler} =require('../utils/errorHandler');
const logHandler =require('../utils/logHandler');

router.use(function(req,res,next){
	// console.log('middleware is working.');	
	next(); 
});

router.get('/topad', function(req, res ) {
 	adService.getTopAd()
 	.then(function(response){
 		res.json({success:true,data:response});
 	},function(err){ errorHandler(err,res); });
 	
});

router.get('/sidebarad', function(req, res ) {
 	adService.getSideBarAd()
 	.then(function(response){
 		res.json({success:true,data:response});
 	},function(err){ errorHandler(err,res); });
 	
});

// Return router
module.exports = router;