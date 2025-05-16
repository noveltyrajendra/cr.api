const express = require('express');
const router = express.Router();
const { errorHandler } = require('../utils/errorHandler');
const { successHandler } = require('../utils/success-handler');
const { fetchMatchedSchools } = require('../services/sso-service');

// NOTICE: Please add sso related routes only

router.get('/veterans/:email/match-schools', async (req, res) => {
  try {
    const matchData = await fetchMatchedSchools(req.params.email);
    successHandler(
      res,
      matchData,
      'Successfully fetched list of matched schools!'
    );
  } catch (error) {
    errorHandler(error, res);
  }
});

// Return router
module.exports = router;
