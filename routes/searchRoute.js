const express = require('express');
const router = express.Router();
const searchService = require('../services/searchService');
const { errorHandler } = require('../utils/errorHandler');

router.use(function (req, res, next) {
  // console.log('middleware is working.');	
  next();
});

/**
 * @api {post} /search/crud  
 * @apiName search update
 * @apiGroup Search
 */
router.post('/search/crud', function (req, res) {
  searchService.processSearchData(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to update' });
      }

    }, function (err) { errorHandler(err, res); });

});

/**
 * @api {post} /search/matchdata  
 * @apiName get matach search data
 * @apiGroup Search
 */
router.post('/search/matchdata', function (req, res) {
  searchService.matchSearchData(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

/**
 * @api {post} /search/emaildata  
 * @apiName list email college info.
 * @apiGroup Search
 */
router.post('/search/emaildata', function (req, res) {
  searchService.matchEmailData(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

/**
 * @api {post} /search/send/message  
 * @apiName send email to college.
 * @apiGroup Search
 */
router.post('/search/send/message', function (req, res) {
  searchService.matchSendEmail(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

router.get('/search/searchinfo/:userid', function (req, res) {
  searchService.getSearchUserInfo(req.params.userid)
    .then(function (response) {
      if (response.length > 0) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'Unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

router.get('/search/majorlist/:majorid', function (req, res) {
  searchService.getSearchMajorList(req.params.majorid)
    .then(function (response) {
      if (response.length > 0) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'Unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

router.post('/search/updateinfo', function (req, res) {
  searchService.searchInfoUpdate(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

router.post('/flow/match/save/collegelist', function (req, res) {
  searchService.getSaveFlowMatchCollege(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

router.post('/flow/check/previousdata', function (req, res) {
  searchService.checkFlowPrevoiusData(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

router.post('/flow/match/saveupdate/collegelist', function (req, res) {
  searchService.getSaveupdateCollegeData(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

router.post('/flow/match/checkdelete/collegelist', function (req, res) {
  searchService.getCheckDeleteCollegeData(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

router.post('/flow/match/emailsent/collegelist', function (req, res) {
  searchService.getUpdateEmailSentCollege(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

router.post('/search/collegeprofile/checkcollege', function (req, res) {
  searchService.getCollegeProfileCollegeExist(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

router.post('/search/profile/matchcollege/insert', function (req, res) {
  searchService.insertCollegeProfileCollege(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

router.post('/search/profile/matchcollege/update', function (req, res) {
  searchService.updateCollegeProfileCollege(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

router.post('/search/match/save/preferencestate', function (req, res) {
  searchService.savePreferenceState(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

router.post('/search/match/check/preferencestate', function (req, res) {
  searchService.checkPreferenceStateExists(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

router.get('/search/match/college/:collegeid', function (req, res) {
  searchService.getSearchMatchCollege(req.params.collegeid)
    .then(function (response) {
      if (response.length > 0) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'Unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});

router.post('/scholarship/veteran/updateinfo', function (req, res) {
  searchService.scholarshipVeteranInfoUpdate(req.body)
    .then(function (response) {
      if (response) {
        res.json({ success: true, data: response });
      }
      else {
        res.json({ success: false, data: null, message: 'unable to get data' });
      }

    }, function (err) { errorHandler(err, res); });

});


// Return router
module.exports = router;