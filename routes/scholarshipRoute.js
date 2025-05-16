const express = require('express');
const router = express.Router();
const scholarshipService = require('../services/scholarshipService');
const { errorHandler } = require('../utils/errorHandler');
const { successHandler } = require('../utils/success-handler');

router.use(function (req, res, next) {
  // console.log('middleware is working.');	
  next();
});

/**
 * @api {post} /scholarship/add 
 * @apiName scholarship add
 * @apiGroup Scholarship
 */
router.post('/scholarship/add', function (req, res) {
    scholarshipService.addScholarship(req.body)
      .then(function (response) {
        if (response) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'unable to update' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  router.post('/scholarship/request', function (req, res) {
    scholarshipService.requestUserMatchScholarship(req.body)
      .then(function (response) {
        if (response) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'unable to update' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  router.get('/scholarship/listby/veterans/:studentid', function (req, res) {
    scholarshipService.getScholarshipListByVeterans(req.params.studentid)
      .then(function (response) {
        if (response.length > 0) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'Unable to get data' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  router.get('/scholarship/unfollow/:studentid/:listid', function (req, res) {
    scholarshipService.unfollowScholarship(req.params.studentid,req.params.listid)
      .then(function (response) {
        if (response.length > 0) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'Unable to get data' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  router.get('/scholarship/userinfo/:studentid', function (req, res) {
    scholarshipService.scholarshipUserinfo(req.params.studentid)
      .then(function (response) {
        if (response.length > 0) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'Unable to get data' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  router.post('/scholarship/register/email', function (req, res) {
    scholarshipService.scholarshipEmailRegistration(req.body)
      .then(function (response) {
        if (response) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'unable to update' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

router.get('/veteran/scholarship/detailinfo/:studentid', async (req, res) => {
    scholarshipService.getScholarshipDetailInfo(req.params.studentid)
      .then(function (response) {
        if (response.length > 0) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'Unable to get data' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  router.post('/scholarship/report/email', function (req, res) {
    scholarshipService.scholarshipReportEmail(req.body)
      .then(function (response) {
        if (response) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'unable to update' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  router.get('/scholarship/reportlist/:studentid', function (req, res) {
    scholarshipService.scholarshipReportLists(req.params.studentid)
      .then(function (response) {
        if (response.length > 0) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'Unable to get data' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  router.post('/newscholarship/notification/veteran/email', function (req, res) {
    scholarshipService.newScholarshipNotificationEmail(req.body)
      .then(function (response) {
        if (response) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'unable to update' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  router.get('/scholarship/manage/date', function (req, res) {
    scholarshipService.scholarshipManagedate()
      .then(function (response) {
        if (response.length > 0) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'Unable to get data' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  router.post('/scholarship/check/collegelist', function (req, res) {
    scholarshipService.scholarshipCheckCollegeList(req.body)
      .then(function (response) {
        if (response) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'Unable to get data' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  router.post('/scholarship/check/scholardata', function (req, res) {
    scholarshipService.scholarshipCheckScholarData(req.body)
      .then(function (response) {
        if (response) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'Unable to get data' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  router.post('/scholarship/list/scholardata', function (req, res) {
    scholarshipService.scholarshipListByScholarData(req.body)
      .then(function (response) {
        if (response.length > 0) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'Unable to get data' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  router.post('/scholarship/saveupdate/scholarlist', function (req, res) {
    scholarshipService.scholarshipSaveUpdateList(req.body)
      .then(function (response) {
        if (response.length > 0) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'Unable to get data' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  router.post('/scholarship/checkdelete/scholarlist', function (req, res) {
    scholarshipService.scholarshipCheckDeleteList(req.body)
      .then(function (response) {
        if (response.length > 0) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'Unable to get data' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  router.post('/scholarship/update/scholardata', function (req, res) {
    scholarshipService.scholarshipUpdateVeteranInfo(req.body)
      .then(function (response) {
        if (response.length > 0) {
          res.json({ success: true, data: response });
        }
        else {
          res.json({ success: false, data: null, message: 'Unable to get data' });
        }
  
      }, function (err) { errorHandler(err, res); });
  
  });

  module.exports = router;