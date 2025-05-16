const express = require('express');
const router = express.Router(); 
const legionPostService=require('../services/legionPostService');
const { errorHandler } =require('../utils/errorHandler');
const logHandler =require('../utils/logHandler');

router.use(function(req,res,next){
	// console.log('middleware is working.');	
	next(); 
});

router.get('/legion/post/:zip', function(req, res ) {
 	legionPostService.getLegionPost(req.params.zip)
 	.then(function(response){
 		res.json({success:true,data:response});
 	},function(err){ errorHandler(err,res); });
 	
});

router.get('/legionpost/:zip', function(req, res ) {
 	legionPostService.getDefaultLegionPost(req.params.zip)
 	.then(function(response){
 		res.json({success:true,data:response});
 	},function(err){ errorHandler(err,res); });
 	
});

// Return router
module.exports = router;