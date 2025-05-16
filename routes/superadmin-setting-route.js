const router = require('express').Router();
const { errorHandler } = require('../utils/errorHandler');
const { successHandler } = require('../utils/success-handler');
const {
  getAll,
  deleteAndCreateType,
} = require('../services/superadmin-setting-service');

router.get('/student-profile', async (req, res) => {
  try {
    const setting = await getAll(req.query);
    successHandler(res, setting, 'Successfully fetched!');
  } catch (error) {
    errorHandler(error, res);
  }
});

router.post('/student-profile', async (req, res) => {
  try {
    const setting = await deleteAndCreateType(req.body, req.query);
    successHandler(res, setting, 'Successfully inserted!');
  } catch (error) {
    errorHandler(error, res);
  }
});

module.exports = router;
