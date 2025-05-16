const router = require('express').Router();
const studentService = require('../services/studentService');
const { successHandler } = require('../utils/success-handler');
const { errorHandler } = require('../utils/errorHandler');
const stringUtil = require('../utils/stringUtil');

// TODO: CHECK WHERE THIS ROUTE IS USED AND FIX IT
router.put('/veterans', function (req, res) {
  let authorize = stringUtil.checkAuthoriseUser(req.headers);
  if (authorize) {
    let checkResult = stringUtil.joiVeteranDataValidation(req);
    if (checkResult.check) {
      studentService.veteranDataUpdate(req.body, req.headers['user-name']).then(
        function (response) {
          res.status(200).send({ status: 200, data: response });
        },
        function (err) {
          errorHandler(err, res);
        }
      );
    } else {
      res.status(400).json({
        status: 400,
        message: checkResult.errorMessage,
      });
    }
  } else {
    res.status(401).send({ status: 401, data: 'Unauthorized Access' });
  }
});

// TODO: CHECK WHERE IT IS USED
router.get('/veterans/:email/stats', function (req, res) {
  let authorize = stringUtil.checkAuthoriseUser(req.headers);
  if (authorize) {
    if (req.params.email) {
      studentService.getVeteransStats(req.params.email).then(
        function (response) {
          if (response) {
            if (response == 'fail') {
              res.json({
                success: false,
                message: 'Student with ' + req.params.email + ' not found',
              });
            } else {
              res.json({ success: true, data: response });
            }
          } else {
            res.json({
              success: false,
              data: null,
              message: 'unable to get data',
            });
          }
        },
        function (err) {
          errorHandler(err, res);
        }
      );
    } else {
      res.status(400).json({
        statusCode: 400,
        message: 'Email is required.',
      });
    }
  } else {
    res.status(401).send({ statusCode: 401, message: 'Unauthorized Access' });
  }
});

// TODO: PROGRAM MATCHER ROUTE UPDATE
router.post('/veteran/searchdata/update', async (req, res) => {
  try {
    const searchData = await studentService.updateVeteranProgramMatcher(
      req.body
    );
    successHandler(res, searchData, 'Successfully updated!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/veteran/scholarshipdata/update', async (req, res) => {
  try {
    const data = await studentService.updateVeteranScholarshipData(req.body);
    successHandler(res, data, 'Successfully updated!');
  } catch (error) {
    errorHandler(error, res);
  }
});

// Return router
module.exports = router;
