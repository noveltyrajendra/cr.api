const express = require('express');
const router = express.Router(); 
const usagestatisticsService=require('../services/usagestatisticsService');
const { errorHandler } =require('../utils/errorHandler');

router.use(function(req,res,next){
	// console.log('middleware is working.');	
	next(); 
});

/**
 * @api {get} /api/usagestatistics/collegecontact/:studentId 
 * @apiName getCollegeContact
 * @apiGroup Usagestatistics
 *
 * @apiParam {Number} studentId Filter by studentId.
 *
 * @apiSuccess {Boolean} success Request Status.
 * @apiSuccess {object[]} data Data Wrapper.
 * @apiSuccess {integer} data.newsfeedId Primary Id of the Newsfeed.
 * @apiSuccess {String} data.post post of Newsfeed.
 * @apiSuccess {String} data.postType post type for the Newsfeed.
 * @apiSuccess {String} data.postPrivacy post privacy for the Newsfeed.
 * @apiSuccess {String} data.dlImageUrl image url for the Newsfeed.
 * @apiSuccess {String} data.resourceUrl resource url for the Newsfeed.
 * @apiSuccess {String} data.dateCreated created date for the Newsfeed.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
			      "newsfeedId": 1,
			      "post": "newsfeed text here",
			      "postType": "TEXT",
						"postPrivacy": "public",
						"dlImageUrl": "https://i.ytimg.com/vi/CpIs7hv1NK0/maxresdefault.jpg",
						"resourceUrl": "https://www.youtube.com/watch?v=CpIs7hv1NK0",
						"dateCreated": "2015-09-22 16:51:05"
			    },
			    {
			      "newsfeedId": 2,
			      "post": "newsfeed text here",
			      "postType": "ARTIFACT",
						"postPrivacy": "private",
						"dlImageUrl": "https://i.ytimg.com/vi/CpIs7hv1NK0/maxresdefault.jpg",
						"resourceUrl": "https://www.youtube.com/watch?v=CpIs7hv1NK0",
						"dateCreated": "2015-09-22 16:51:05"
			    }],
 *	 "count":2
 *	 }
 */

router.get('/usagestatistics/collegecontact/:studentId', function(req, res ) {
  usagestatisticsService.getCollegeContact(req.params.studentId)
  .then(function(response){
    res.json({success:true,data:response,count:response.length});
  },function(err){ errorHandler(err,res); });
  
});

/**
 * @api {get} /api/usagestatistics/favouritecollege/:studentId 
 * @apiName getFavoritedColleges
 * @apiGroup Usagestatistics
 *
 * @apiParam {String} studentId Filter by studentId.
 *
 * @apiSuccess {Boolean} success Request Status.
 */ 

router.get('/usagestatistics/favouritecollege/:studentId', function(req, res ) {
  usagestatisticsService.getFavoritedColleges(req.params.studentId)
  .then(function(response){
    res.json({success:true,data:response,count:response.length});
  },function(err){ errorHandler(err,res); });
  
});

/**
 * @api {get} /api/usagestatistics/search/:studentId 
 * @apiName getSearches
 * @apiGroup Usagestatistics
 *
 * @apiParam {String} studentId Filter by studentId.
 *
 * @apiSuccess {Boolean} success Request Status.
 */ 

router.get('/usagestatistics/search/:studentId', function(req, res ) {
  usagestatisticsService.getSearches(req.params.studentId)
  .then(function(response){
    res.json({success:true,data:response,count:response.length});
  },function(err){ errorHandler(err,res); });
  
});

/**
 * @api {get} /api/usagestatistics/viewforstudent/:studentId 
 * @apiName getViewsForStudent
 * @apiGroup Usagestatistics
 *
 * @apiParam {String} studentId Filter by studentId.
 *
 * @apiSuccess {Boolean} success Request Status.
 */ 

router.get('/usagestatistics/viewforstudent/:studentId', function(req, res ) {
  usagestatisticsService.getViewsForStudent(req.params.studentId)
  .then(function(response){
    res.json({success:true,data:response,count:response.length});
  },function(err){ errorHandler(err,res); });
  
});

/**
 * @api {get} /api/usagestatistics/searchforcollege/:collegeId 
 * @apiName getSearchesForCollege
 * @apiGroup Usagestatistics
 *
 * @apiParam {Number} collegeId Filter by collegeId.
 *
 * @apiSuccess {Boolean} success Request Status.
 */ 

router.get('/usagestatistics/searchforcollege/:collegeId', function(req, res ) {
  usagestatisticsService.getSearchesForCollege(req.params.collegeId)
  .then(function(response){
    res.json({success:true,data:response,count:response.length});
  },function(err){ errorHandler(err,res); });
  
});

/**
 * @api {get} /api/usagestatistics/favcollegesforcolleges/:collegeId 
 * @apiName getFavCollegesForColleges
 * @apiGroup Usagestatistics
 *
 * @apiParam {Number} collegeId Filter by collegeId.
 *
 * @apiSuccess {Boolean} success Request Status.
 */ 

router.get('/usagestatistics/favcollegesforcolleges/:collegeId', function(req, res ) {
  usagestatisticsService.getFavCollegesForColleges(req.params.collegeId)
  .then(function(response){
    res.json({success:true,data:response,count:response.length});
  },function(err){ errorHandler(err,res); });
  
});

/**
 * @api {get} /api/usagestatistics/collegeviewstudent/:collegeId 
 * @apiName getCollegeViewStudent
 * @apiGroup Usagestatistics
 *
 * @apiParam {Number} collegeId Filter by collegeId.
 *
 * @apiSuccess {Boolean} success Request Status.
 */ 

router.get('/usagestatistics/collegeviewstudent/:collegeId', function(req, res ) {
  usagestatisticsService.getCollegeViewStudent(req.params.collegeId)
  .then(function(response){
    res.json({success:true,data:response,count:response.length});
  },function(err){ errorHandler(err,res); });
  
});

/**
 * @api {get} /api/usagestatistics/collegeviewpublic/:collegeId 
 * @apiName getCollegeViewPublic
 * @apiGroup Usagestatistics
 *
 * @apiParam {Number} collegeId Filter by collegeId.
 *
 * @apiSuccess {Boolean} success Request Status.
 */ 

router.get('/usagestatistics/collegeviewpublic/:collegeId', function(req, res ) {
  usagestatisticsService.getCollegeViewPublic(req.params.collegeId)
  .then(function(response){
    res.json({success:true,data:response,count:response.length});
  },function(err){ errorHandler(err,res); });
  
});

/**
 * @api {get} /api/usagestatistics/searchcollegecount/:collegeId 
 * @apiName getSearchCollegesCount
 * @apiGroup Usagestatistics
 *
 * @apiParam {String} collegeId Filter by collegeId.
 *
 * @apiSuccess {Boolean} success Request Status.
 */ 

router.get('/usagestatistics/searchcollegecount/:collegeId', function(req, res ) {
  usagestatisticsService.getSearchCollegesCount(req.params.collegeId)
  .then(function(response){
    res.json({success:true,data:response,count:response.length});
  },function(err){ errorHandler(err,res); });
  
});


/**
 * @api {post} /usagestatistics/counter/view 
 * @apiName update view counter
 * @apiGroup Usagestatistics
 */ 
router.post('/usagestatistics/counter/view', function(req, res ) {
  usagestatisticsService.updateViewCounter(req.body)
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

/**
 * @api {post} /usagestatistics/counter/searchcollege 
 * @apiName update counter search college
 * @apiGroup Usagestatistics
 */ 
router.post('/usagestatistics/counter/searchcollege', function(req, res ) {
  usagestatisticsService.updateCollegeSearchCounter(req.body)
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

/**
 * @api {post} /usagestatistics/counter/searchstudent 
 * @apiName update counter search student
 * @apiGroup Usagestatistics
 */ 
router.post('/usagestatistics/counter/searchstudent', function(req, res ) {
  usagestatisticsService.updateStudentSearchCounter(req.body)
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

router.get('/usagestatistics/superadmincollegeadd/:collegeId', function(req, res ) {
  usagestatisticsService.superadminCollegeadd(req.params.collegeId)
  .then(function(response){
    res.json({success:true,data:response,count:response.length});
  },function(err){ errorHandler(err,res); });
  
});

module.exports = router;