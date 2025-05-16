const express = require('express');
const router = express.Router();
const authenicateService = require('../services/authenicateService');
const { errorHandler } = require('../utils/errorHandler');
const stringUtil = require('../utils/stringUtil');
const { validateToken } = require('../services/sso-service');

router.use(function (req, res, next) {
  // console.log('middleware is working.');
  next();
});

/**
 * @api {post} /authenicate/login Login
 * @apiName login
 *
 * @apiParam {String} [email] email.
 * @apiParam {String} [password] password.
 *
 * @apiSuccess {Boolean} success Request status.
 * @apiSuccess {object[]} data  Response wrapper.
 * @apiSuccess {Number} data.id  User Id.
 * @apiSuccess {String} data.uuid  User Unique Id.
 * @apiSuccess {String} data.type  User Type.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *	  "success": true,
 *	  "data": [{
 *			      "id": 1,
 *			      "uuid": "D5CEAE-CFBB3A-A5AA70-4D3R",
 *			      "type": "college"
 *			    }],
 *	 "count":1
 *	 }
 */

router.post('/authenicate/login', function (req, res) {
  authenicateService.login(req.body).then(
    function (response) {
      if (response) {
        res.json({ success: true, data: response });
      } else {
        res.json({ success: false, data: null, message: 'user not found' });
      }
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/authenicate/resetpassword', function (req, res) {
  authenicateService.resetPassword(req.body.userName).then(
    function (response) {
      res.status(200).send({ status: 200, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/authenicate/register/veteran', function (req, res) {
  authenicateService.studentRegister(req.body).then(
    function (response) {
      res.status(200).send({ status: 200, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/authenicate/register/collegeadmin', function (req, res) {
  authenicateService.collegeRegister(req.body).then(
    function (response) {
      res.status(200).send({ status: 200, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.post('/login', function (req, res) {
  let authorize = stringUtil.checkAuthoriseUser(req.headers);
  if (authorize) {
    let checkResult = stringUtil.joiLoginValidation(req);
    if (checkResult.check) {
      authenicateService.veteranLogin(req.body, req.headers['user-name']).then(
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

router.post('/auth/login', function (req, res) {
  if (!req.body.userName || !req.body.password) {
    res.json({ success: false, message: 'Required fill is missing.' });
  } else {
    authenicateService.userLogin(req.body).then(
      function (response) {
        if (response) {
          res.json({ success: true, data: response });
        } else {
          res.json({ success: false, message: 'user not found' });
        }
      },
      function (err) {
        errorHandler(err, res);
      }
    );
  }
});

router.post('/auth/sso-validate', async (req, res) => {
  try {
    const userProfile = await validateToken(req.body);
    res.json({ success: true, data: userProfile });
  } catch (error) {
    errorHandler(error, res);
  }
});

module.exports = router;
