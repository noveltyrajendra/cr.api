const express = require('express');
const router = express.Router();
const awardService = require('../services/awardService');
const { errorHandler } = require('../utils/errorHandler');
const { successHandler } = require('../utils/success-handler');

router.use(function (req, res, next) {
  // console.log('middleware is working.');
  next();
});

/**
 * @api {get} /api/award/ Request Award information
 * @apiName GetAwards
 * @apiGroup Awards
 *
 * @apiSuccess {Boolean} success Request status.
 * @apiSuccess {object[]} data  Response wrapper.
 * @apiSuccess {integer} data.awardId primary Id of the award.
 * @apiSuccess {String} data.shortName shortname of the award.
 * @apiSuccess {String} data.fullName  fullname of the award.
 *
 * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 200 OK
 *    {
 *		"success": true,
 *		 "data": [
 *   		{
 *    		 "awardId": 1,
 *     		 "shortName": "Medal of Honor",
 *     		 "fullName": "Medal of Honor"
 *   		},
 *   		{
 *     		 "awardId": 2,
 *     		 "shortName": "Distinguished Service Cross (Army)",
 *     		 "fullName": "Distinguished Service Cross (Army)"
 *   		}]
 *	 }
 *
 */
router.get('/award', function (req, res) {
  awardService.getAward().then(
    function (response) {
      res.json({ success: true, data: response });
    },
    function (err) {
      errorHandler(err, res);
    }
  );
});

router.get('/award/:title', async (req, res) => {
  try {
    const awards = await awardService.getAwardByTitle(`%${req.params.title}%`);
    successHandler(res, awards, 'Fetched successfully');
  } catch (error) {
    errorHandler(error, res);
  }
});
// Return router
module.exports = router;
