const express = require('express');
const router = express.Router(); 
const rankService=require('../services/rankService');
const { errorHandler } =require('../utils/errorHandler');

router.use(function(req,res,next){
	// console.log('middleware is working.');	
	next(); 
});

/**
 * @api {get} /api/rankbybranch/ Request Rank By Branch information
 * @apiName GetRanks
 * @apiGroup Rank
 *
 * @apiSuccess {Boolean} success Request status.
 * @apiSuccess {object[]} data  Response wrapper.
 * @apiSuccess {integer} data.rankId primary Id of the rank.
 * @apiSuccess {integer} data.branchId primary Id of the rank.
 * @apiSuccess {String} data.ShortName shortname of the rank.
 * @apiSuccess {String} data.FullName  fullname of the rank.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *		"success": true,
 *		 "data": [
 *   		{
 *    		 "rankId": 1,
 *         "branchId": 1,
 *     		 "ShortName": "E-1",
 *     		 "fullName": "private"
 *   		},
 *   		{
 *         "rankId": 2,
 *     		 "branchId": 1,
 *     		 "shortName": "E-2",
 *     		 "fullName": "private 2nd class"
 *   		}]
 *	 }
 *   
 */
router.get('/rankbybranch/:branchid', function(req, res ) {
  
  rankService.getrankByBranch(req.params.branchid)
     .then(function(response){
       res.json({success:true,data:response});
     },function(err){ errorHandler(err,res); });
     
   });

router.get('/rankinfo/:rankid', function(req, res ) {

rankService.getrankInfo(req.params.rankid)
    .then(function(response){
      res.json({success:true,data:response});
    },function(err){ errorHandler(err,res); });
    
  });

router.get('/collegerank/ranklist', function(req, res ) {

  rankService.getCollegerankList()
      .then(function(response){
        res.json({success:true,data:response});
      },function(err){ errorHandler(err,res); });
      
  });

// Return router
module.exports = router;