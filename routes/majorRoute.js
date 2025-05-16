const express = require('express');
const router = express.Router();
const majorService = require('../services/majorService');
const { errorHandler } = require('../utils/errorHandler');
const { successHandler } = require('../utils/success-handler');

router.use(function (req, res, next) {
  // console.log('middleware is working.');
  next();
});

/**
 * @api {get} /api/majors/ Request all majors information
 * @apiName getMajors
 * @apiGroup Majors
 *
 * @apiSuccess {Boolean} success Request Status.
 * @apiSuccess {object[]} data Data Wrapper.
 * @apiSuccess {integer} data.majorId Primary Id of the Major.
 * @apiSuccess {String} data.majorTitle Title of the Major.
 * @apiSuccess {String} data.description Description for the Major.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
			      "majorId": 1,
			      "majorTitle": "Agriculture, General",
			      "description": "A program that focuses on the general .."
			    },
			    {
			      "majorId": 15,
			      "majorTitle": "Engineering Technology, General",
			      "description": "Instructional programs that prepare individuals to apply .."
			    }],
 *	 "count":2
 *	 }
 */

router.get('/majors', function (req, res) {
  majorService.getMajors().then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/majors/buckets-title/:collegeId', async function (req, res) {
  try {
    const majors = await majorService.getMajorsWithPrimaryAndSecondaryBuckets(
      req.params.collegeId
    );
    res.json({ success: true, data: majors });
  } catch (error) {
    errorHandler(error, res);
  }
});

/**
 * @api {get} /api/majors/:title Request majors by title
 * @apiName getMajorsByTitle
 * @apiGroup Majors
 *
 * @apiParam {String} title Filter by specified Title.
 *
 * @apiSuccess {Boolean} success Request Status.
 * @apiSuccess {object[]} data Data Wrapper.
 * @apiSuccess {integer} data.majorId Primary Id of the Major.
 * @apiSuccess {String} data.majorTitle Title of the Major.
 * @apiSuccess {String} data.description Description for the Major.
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
			      "majorId": 1,
			      "majorTitle": "Agriculture, General",
			      "description": "A program that focuses on the general .."
			    },
			    {
			      "majorId": 15,
			      "majorTitle": "Engineering Technology, General",
			      "description": "Instructional programs that prepare individuals to apply .."
			    }],
 *	 "count":2
 *	 }
 */

router.get('/majors/:title', function (req, res) {
  majorService.getMajorsByTitle(req.params.title + '%').then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

/**
 * @api {get} /api/majors/level/:levelId Request majors information by Level Id
 * @apiName getMajorsByLevel
 * @apiGroup Majors
 *
 * @apiParam {Number} levelId Filter by levelId.
 *
 * @apiSuccess {Boolean} success Request Status.
 * @apiSuccess {object[]} data Data Wrapper.
 * @apiSuccess {integer} data.majorId Primary Id of the Major.
 * @apiSuccess {String} data.majorTitle Title of the Major.
 * @apiSuccess {String} data.description Description for the Major.

 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
			      "majorId": 1,
			      "majorTitle": "Agriculture, General",
			      "description": "A program that focuses on the general .."
			    },
			    {
			      "majorId": 15,
			      "majorTitle": "Engineering Technology, General",
			      "description": "Instructional programs that prepare individuals to apply .."
			    }],
 *	 "count":2
 *	 }
 */

router.get('/majors/level/:levelId', function (req, res) {
  majorService.getMajorsByLevel(req.params.levelId).then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

/**
 * @api {get} /api/majors/college/:collegeId Request majors information by College Id
 * @apiName getMajorsByCollege
 * @apiGroup Majors
 *
 * @apiParam {Number} collegeId Filter by collegeId.
 *
 * @apiSuccess {Boolean} success Request Status.
 * @apiSuccess {object[]} data Data Wrapper.
 * @apiSuccess {integer} data.majorId Primary Id of the Major.
 * @apiSuccess {String} data.majorTitle Title of the Major.
 * @apiSuccess {String} data.description Description for the Major.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
			      "majorId": 1,
			      "majorTitle": "Agriculture, General",
			      "description": "A program that focuses on the general .."
			    },
			    {
			      "majorId": 15,
			      "majorTitle": "Engineering Technology, General",
			      "description": "Instructional programs that prepare individuals to apply .."
			    }],
 *	 "count":2
 *	 }
 */

router.get('/majors/college/:collegeId', function (req, res) {
  majorService.getMajorsByCollege(req.params.collegeId).then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

/**
 * @api {get} /api/majors/college/:collegeId/level/:levelId Request majors information by College Id and Level Id
 * @apiName getMajorsByCollegeAndLevel
 * @apiGroup Majors
 *
 * @apiParam {Number} collegeId Filter by collegeId.
 * @apiParam {Number} levelId Filter by levelId.
 *
 * @apiSuccess {Boolean} success Request Status.
 * @apiSuccess {object[]} data Data Wrapper.
 * @apiSuccess {integer} data.majorId Primary Id of the Major.
 * @apiSuccess {String} data.majorTitle Title of the Major.
 * @apiSuccess {String} data.description Description for the Major.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
			      "majorId": 1,
			      "majorTitle": "Agriculture, General",
			      "description": "A program that focuses on the general .."
			    },
			    {
			      "majorId": 15,
			      "majorTitle": "Engineering Technology, General",
			      "description": "Instructional programs that prepare individuals to apply .."
			    }],
 *	 "count":2
 *	 }
 */

router.get('/majors/college/:collegeId/level/:levelId', function (req, res) {
  majorService
    .getMajorsByCollegeAndLevel(req.params.collegeId, req.params.levelId)
    .then(
      function (response) {
        res.json({ success: true, data: response });
      },
      function (err) {
        errorHandler(err, res);
      }
    );
});

/**
 * @api {get} /api/majorslevel Get Major list
 * @apiName getMajorsLevel
 * @apiGroup Majors
 *
 *
 * @apiSuccess {Boolean} success Request Status.
 * @apiSuccess {object[]} data Data Wrapper.
 * @apiSuccess {integer} data.majorId Primary Id of the Major.
 * @apiSuccess {String} data.majorTitle Title of the Major.
 * @apiSuccess {String} data.description Description for the Major.
 * @apiSuccess {String} data.status status for the Major.
 * @apiSuccess {String} data.shortTitle short title levels for the Major.

 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *   "success": true,
 *   "data": [{
         "majorId": 1,
         "majorTitle": "Agriculture, General",
         "description": "A program that focuses on the general ..",
      "status": "ACTIVE",
      "shortTitle": "A,BC"
       },
       {
         "majorId": 15,
         "majorTitle": "Engineering Technology, General",
         "description": "Instructional programs that prepare individuals to apply ..",
      "status": "ACTIVE",
      "shortTitle": "A,BC"
       }],
 *  "count":2
 *  }
 */

router.get('/majorslevel', function (req, res) {
  majorService.getMajorsLevelQuery(req.body).then(
    function (response) {
      if (response.length > 0) {
        res.json({ success: true, data: response, count: response.length });
      } else {
        res.json({ success: false, data: null, message: 'majors not found' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

/**
 * @api {get} /api/collegemajors/:collegeId Request majors information by College Id
 * @apiName getMajorsByCollege
 * @apiGroup Majors
 *
 * @apiParam {Number} collegeId Filter by collegeId.
 *
 * @apiSuccess {Boolean} success Request Status.
 * @apiSuccess {object[]} data Data Wrapper.
 * @apiSuccess {integer} data.majorId Primary Id of the Major.
 * @apiSuccess {String} data.majorTitle Title of the Major.
 * @apiSuccess {String} data.description Description for the Major.
 * @apiSuccess {String} data.shortTitle short title levels for the Major.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
			      "majorId": 1,
			      "majorTitle": "Agriculture, General",
			      "description": "A program that focuses on the general ..",
						"shortTitle": "A,BC"
			    },
			    {
			      "majorId": 15,
			      "majorTitle": "Engineering Technology, General",
			      "description": "Instructional programs that prepare individuals to apply ..",
						"shortTitle": "A,BC"
			    }],
 *	 "count":2
 *	 }
 */

router.get('/collegemajors/:collegeId', async function (req, res) {
  try {
    const majors = await majorService.getMajorsByCollegeId(
      req.params.collegeId
    );
    res.json({ success: true, data: majors });
  } catch (error) {
    errorHandler(error, res);
  }
});

router.get('/collegemajors/designation/:collegeId', async function (req, res) {
  try {
    const majors = await majorService.getMajorsDesignationByCollegeId(
      req.params.collegeId
    );
    res.json({ success: true, data: majors });
  } catch (error) {
    errorHandler(error, res);
  }
});

/**
 * @api {get} /api/academicinterest/ Request all majors information
 * @apiName getAcademicInterest
 * @apiGroup Majors
 *
 * @apiSuccess {Boolean} success Request Status.
 * @apiSuccess {object[]} data Data Wrapper.
 * @apiSuccess {integer} data.id Primary Id of the Major.
 * @apiSuccess {String} data.major Title of the Major.
 * @apiSuccess {String} data.description Description for the Major.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
			      "id": 1,
			      "major": "Agriculture, General",
			      "description": "A program that focuses on the general .."
			    },
			    {
			      "id": 15,
			      "major": "Engineering Technology, General",
			      "description": "Instructional programs that prepare individuals to apply .."
			    }],
 *	 "count":2
 *	 }
 */

router.get('/academicinterest', function (req, res) {
  majorService.getAcademicInterest().then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

/**
 * @api {get} /api/academicinterest/:searchtext Request majors by title
 * @apiName getAcademicInterestByMajor
 * @apiGroup Majors
 *
 * @apiParam {String} major Filter by specified Title.
 *
 * @apiSuccess {Boolean} success Request Status.
 * @apiSuccess {object[]} data Data Wrapper.
 * @apiSuccess {integer} data.id Primary Id of the Major.
 * @apiSuccess {String} data.major Title of the Major.
 * @apiSuccess {String} data.description Description for the Major.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
			      "id": 1,
			      "major": "Agriculture, General",
			      "description": "A program that focuses on the general .."
			    },
			    {
			      "id": 15,
			      "major": "Engineering Technology, General",
			      "description": "Instructional programs that prepare individuals to apply .."
			    }],
 *	 "count":2
 *	 }
 */

router.get('/academicinterest/:title', function (req, res) {
  majorService.getAcademicInterestByMajor(req.params.title + '%').then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/majors/levelbucket/:levelid/:bucketids', function (req, res) {
  majorService
    .getMajorLevelBucketData(req.params.levelid, req.params.bucketids)
    .then(
      function (response) {
        res.json({ success: true, data: response });
      },
      function (err) {
        errorHandler(err, res);
      }
    );
});

// router.get('/majors/secondarybucket/:bucketids', function(req, res ) {
// 	majorService.getMajorSecondaryBucketData( req.params.bucketids)
// 	.then(function(response){
// 		res.json({success:true,data:response});
// 	},function(err){ errorHandler(err,res); });
// });

router.get('/secondarybucketlist/:bucketids', function (req, res) {
  majorService.getSecondaryLevelBucketData(req.params.bucketids).then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/bucketlist', function (req, res) {
  majorService.getBucketListData().then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/secondarybucketlist', function (req, res) {
  majorService.getSecondaryBucketListData().then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/filter/secondarybucketlist', function (req, res) {
  majorService.getSecondaryBucketList().then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/college/detail/majorlist/bylevel/:collegeId', function (req, res) {
  majorService.getMajorDataByLevel(req.params.collegeId).then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/filter/secondarybucketlist/:collegeIds', function (req, res) {
  majorService.getSecondaryBucketListByIds(req.params.collegeIds).then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/major/search', async (req, res) => {
  try {
    const majors = await majorService.getMajorsByFilter(req.query);
    successHandler(res, majors, 'Fetched successfully!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/filter/levelbucketrelaton', function (req, res) {
  majorService.getLevelBucketRelation(req.body).then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/filter/levelsecbucketrelaton', function (req, res) {
  majorService.getLevelSecBucketRelation(req.body).then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/filter/reset/savedschool', function (req, res) {
  majorService.resetSavedSchool(req.body).then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/secondarybucketlist/multiple/', function (req, res) {
  majorService.getSecondaryLevelFromMultipleBucketData(req.body).then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/scholarship/dictionary/:parentKey', function (req, res) {
  majorService.getScholarshipDictionary(req.params.parentKey).then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/primary/bucketlist', function (req, res) {
  majorService.getPrimaryBucketListData().then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/secondarylist/level/pbucket', function (req, res) {
  majorService.getSecondaryBucketFromLevelAndPbucket(req.body).then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/filterby/name/datalist/:name', async(req, res) => {
	try {
		const response = await  majorService.getFilterByNameData(req.params.name);
		res.json({ success: true, data: response });
	} catch (error) {
		errorHandler(error, res);
	}
});
// Return router
module.exports = router;
