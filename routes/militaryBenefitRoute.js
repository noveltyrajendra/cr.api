const express = require('express');
const router = express.Router();
const militaryBenefitService = require('../services/militaryBenefitService');
const branchService = require('../services/branchService');
const rankService = require('../services/rankService');
const majorService = require('../services/majorService');
const { errorHandler } = require('../utils/errorHandler');

router.post('/militarybenefit/register', function (req, res) {
  if (req.headers['user-name'] == "mmb" && req.headers['password'] == "P@ssw0rd") {
    if (!req.body.first_name || !req.body.last_name || !req.body.password || !req.body.email || !req.body.state || !req.body.military_status || !req.body.military_branch || !req.body.phone_number || !req.body.available || !req.body.mmb_level_id ||!req.body.career_id) {
      res.status(400).send({ status: 400, data: "Fill the Required Fields" })
    } else {
      militaryBenefitService.studentRegister(req.body).then(function (response) {
        res.status(200).send({ status: 200, data: response });
      }, function (err) { errorHandler(err, res); });
    }
  } else {
    res.status(401).send({ status: 401, data: "Unauthorized Access" })
  }
});

router.post('/militarybenefit/veteran/spreadsheet', function(req, res ) {
	militaryBenefitService.userDetailSpreadsheet(req.body).then(function(response){
		res.status(200).send({status:200,data:response});
	},function(err){ errorHandler(err,res); });
});

router.get('/states', function (req, res) {
  militaryBenefitService.getStates()
    .then(function (response) {
      res.json({ success: true, data: response });
    }, function (err) { errorHandler(err, res); });
});

router.get('/withoutonline/states', function (req, res) {
  militaryBenefitService.getStatesWithoutOnline()
    .then(function (response) {
      res.json({ success: true, data: response });
    }, function (err) { errorHandler(err, res); });
});

router.get('/military-status', function (req, res) {
  militaryBenefitService.getMilitaryStatus()
    .then(function (response) {
      res.json({ success: true, data: response });
    }, function (err) { errorHandler(err, res); });
});

router.get('/security-clearance', function (req, res) {
  militaryBenefitService.getSecurityClearance()
    .then(function (response) {
      res.json({ success: true, data: response });
    }, function (err) { errorHandler(err, res); });
});

router.get('/branches', function (req, res) {
  branchService.getBranches()
    .then(function (response) {
      res.json({ success: true, data: response });
    }, function (err) { errorHandler(err, res); });

});

router.get('/branch/:branchid/ranks', function (req, res) {
  rankService.getrankByBranch(req.params.branchid)
    .then(function (response) {
      res.json({ success: true, data: response });
    }, function (err) { errorHandler(err, res); });
});

router.get('/primary-buckets', function (req, res) {
  majorService.getBucketListData()
    .then(function (response) {
      res.json({ success: true, data: response });
    }, function (err) { errorHandler(err, res); });
});

router.get('/primary-buckets/:primary_bucketid/secondary-buckets', function (req, res) {
  majorService.getSecondaryLevelBucketData(req.params.primary_bucketid)
    .then(function (response) {
      res.json({ success: true, data: response });
    }, function (err) { errorHandler(err, res); });
});

router.get('/militarybenefit/education-levels', function(req, res ) {
  militaryBenefitService.getEducationLevels()
  .then(function(response){
    res.json({success:true,data:response});
  },function(err){ errorHandler(err,res); });
});

router.get('/militarybenefit/careers', function(req, res ) {
  militaryBenefitService.getCareerFields()
  .then(function(response){
    res.json({success:true,data:response});
  },function(err){ errorHandler(err,res); });
});

router.post('/militarybenefit/claims/register', function (req, res) {
  if (req.headers['user-name'] == "claims" && req.headers['password'] == "P@ssw0rd") {
    if (!req.body.first_name || !req.body.last_name || !req.body.password || !req.body.email || !req.body.state || !req.body.military_branch || !req.body.phone_number || !req.body.military_status || !req.body.dob || !req.body.city || !req.body.zip_code) {
      res.status(400).send({ status: 400, data: "Fill the Required Fields" })
    } else {
      militaryBenefitService.claimStudentRegister(req.body).then(function (response) {
        res.status(200).send({ status: 200, data: response });
      }, function (err) { errorHandler(err, res); });
    }
  } else {
    res.status(401).send({ status: 401, data: "Unauthorized Access" })
  }
});

router.post('/collegerecon/registration', function (req, res) {
  if (req.headers['user-name'] == "collegerecon" && req.headers['password'] == "JmPbKRHz#N9*RRgY") {
    if (!req.body.first_name || !req.body.last_name || !req.body.password || !req.body.email || !req.body.state || !req.body.military_branch || !req.body.postal_code || !req.body.military_status || !req.body.educational_goal || !req.body.area_of_study || !req.body.area_of_focus || !req.body.agree) {
      res.status(400).send({ status: 400, data: "Fill the Required Fields" })
    } else {
      militaryBenefitService.collegereconStudentRegister(req.body).then(function (response) {
        res.status(200).send({ status: 200, data: response });
      }, function (err) { errorHandler(err, res); });
    }
  } else {
    res.status(401).send({ status: 401, data: "Unauthorized Access" })
  }
});

router.post('/militarybenefit/question/register', function (req, res) {
  if (req.headers['user-name'] == "militaryuser" && req.headers['password'] == "?D?TGNX9?T93eunM") {
    if (!req.body.first_name || !req.body.last_name || !req.body.password || !req.body.email || !req.body.postal_code || !req.body.military_branch || !req.body.category_question || !req.body.military_status || !req.body.military_rank) {
      res.status(400).send({ status: 400, data: "Fill the Required Fields" })
    } else {
      militaryBenefitService.militaryBenefitStudentRegister(req.body).then(function (response) {
        res.status(200).send({ status: 200, data: response });
      }, function (err) { errorHandler(err, res); });
    }
  } else {
    res.status(401).send({ status: 401, data: "Unauthorized Access" })
  }
});

router.post('/careerrecon/register', function (req, res) {
  if (req.headers['user-name'] == "careerrecon" && req.headers['password'] == "4yM@*&C^j3?HDxTD") {
    if (!req.body.first_name || !req.body.last_name || !req.body.password || !req.body.email || !req.body.state || !req.body.military_status || !req.body.military_branch || !req.body.phone_number || !req.body.available || !req.body.mmb_level_id ||!req.body.career_id) {
      res.status(400).send({ status: 400, data: "Fill the Required Fields" })
    } else {
      militaryBenefitService.careerReconRegister(req.body).then(function (response) {
        res.status(200).send({ status: 200, data: response });
      }, function (err) { errorHandler(err, res); });
    }
  } else {
    res.status(401).send({ status: 401, data: "Unauthorized Access" })
  }
});

router.post('/careerrecon/common/login', function (req, res) {
  if (req.headers['user-name'] == "careerrecon" && req.headers['password'] == "10g&2&TNuzonf!Sd") {
    if (!req.body.uuid || !req.body.militaryStatus || !req.body.militaryBranch || !req.body.state || !req.body.bucketId) {
      res.status(400).send({ status: 400, data: "Fill the Required Fields" })
    } else {
      militaryBenefitService.careerReconCommonLogin(req.body).then(function (response) {
        res.status(200).send({ status: 200, data: response });
      }, function (err) { errorHandler(err, res); });
    }
  } else {
    res.status(401).send({ status: 401, data: "Unauthorized Access" })
  }
});

module.exports = router;