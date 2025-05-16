const express = require('express');
const router = express.Router(); 
const levelService=require('../services/levelService');
const { errorHandler } = require('../utils/errorHandler');
const logHandler =require('../utils/logHandler');

router.use(function(req,res,next){
	// console.log('middleware is working.');	
	next(); 
});

/**
 * @api {get} /api/levels/ Request Level information
 * @apiName GetLevels
 * @apiGroup Levels
 *
 * @apiSuccess {Boolean} success Request status.
 * @apiSuccess {object[]} data  Response wrapper.
 * @apiSuccess {integer} data.levelId primary Id of the Level.
 * @apiSuccess {String} data.levelTitle Title of the Level.
 * @apiSuccess {String} data.levelShortTitle abbreviation of the Title of Provided Level.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
			      "levelId": 3,
			      "levelTitle": "Associate's degree",
			      "levelShortTitle": "A"
			    },
			    {
			      "levelId": 5,
			      "levelTitle": "Bachelor's degree",
			      "levelShortTitle": "B"
			    }],
 *	 "count":2
 *	 }
 */

router.get('/levels', function(req, res ) {
	
 	levelService.getLevels()
 	.then(function(response){
 		res.json({success:true,data:response});
 	},function(err){ errorHandler(err,res); });
 	
});

// Return router
module.exports = router;