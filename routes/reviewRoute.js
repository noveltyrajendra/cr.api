const express = require('express');
const router = express.Router(); 
const reviewService=require('../services/reviewService');
const { errorHandler } =require('../utils/errorHandler');
const logHandler =require('../utils/logHandler');

router.use(function(req,res,next){
	// console.log('middleware is working.');	
	next(); 
});

router.post('/add/review', function(req, res ) {
    reviewService.addReviewFormData(req.body)
    .then(function(response){
        if(response)
        {
            res.json({success:true,data:response});
        }
        else
        {
            res.json({success:false,data:null,message:'review not saved'});
        }
        
    },function(err){ errorHandler(err,res); });
    
});

router.get('/college/review/data/:collegeid', function(req, res ) {
	reviewService.getCollegeReviewInfo(req.params.collegeid)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'no review info'});
		}
		
	},function(err){ errorHandler(err,res); });
});

router.get('/college/review/datalist/:collegeid', function(req, res ) {
	reviewService.getCollegeReviewList(req.params.collegeid)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'no review info'});
		}
		
	},function(err){ errorHandler(err,res); });
});

router.get('/veteran/college/reviewlist/:studentid', function(req, res ) {
	reviewService.getVetranCollegeReviewData(req.params.studentid)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'no review list'});
		}
		
	},function(err){ errorHandler(err,res); });
});

router.get('/veteran/check/collegereview/:studentid/:collegeid', function(req, res ) {
	reviewService.getVetranCheckCollegeReview(req.params.studentid,req.params.collegeid)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'no review'});
		}
		
	},function(err){ errorHandler(err,res); });
});

router.post('/add/collegeuser/reviewreply', function(req, res ) {
    reviewService.addReviewReplyFormData(req.body)
    .then(function(response){
        if(response)
        {
            res.json({success:true,data:response});
        }
        else
        {
            res.json({success:false,data:null,message:'reply review not saved'});
        }
        
    },function(err){ errorHandler(err,res); });
    
});

router.get('/superadmin/college/reviewlist', function(req, res ) {
	reviewService.getSuperadminReviewList()
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'no review'});
		}
		
	},function(err){ errorHandler(err,res); });
});

router.get('/superadmin/veteran/reviewlist/:status', function(req, res ) {
	reviewService.getSuperadminVeteranReviewList(req.params.status)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'no review'});
		}
		
	},function(err){ errorHandler(err,res); });
});

router.get('/superadmin/review/detail/:reviewId', function(req, res ) {
	reviewService.getSuperadminReviewDetail(req.params.reviewId)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'no review'});
		}
		
	},function(err){ errorHandler(err,res); });
});

router.post('/superadmin/update/reviewinfo', function(req, res ) {
    reviewService.updateReviewDataSuperadmin(req.body)
    .then(function(response){
        if(response)
        {
            res.json({success:true,data:response});
        }
        else
        {
            res.json({success:false,data:null,message:'review not saved'});
        }
        
    },function(err){ errorHandler(err,res); });
    
});

router.get('/superadmin/college/reviewlist/:id', function(req, res ) {
	reviewService.getSuperadminCollegeReviewList(req.params.id)
	.then(function(response){
		if(response.length > 0)
		{
			res.json({success:true,data:response});
		}
		else
		{
			res.json({success:false,data:null,message:'no review'});
		}
		
	},function(err){ errorHandler(err,res); });
});
// Return router
module.exports = router;