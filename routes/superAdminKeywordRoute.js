const express = require('express');
const router = express.Router();
const superAdminKeywordService = require('../services/superAdminKeywordService');
const { errorHandler } = require('../utils/errorHandler');

router.use(function (req, res, next) {
    next();
});

router.get('/superadmin/keyword/list', function (req, res) {
    superAdminKeywordService.listKeywords()
        .then(function (response) {
            if (response) {
                res.json({ success: true, data: response });
            }
            else {
                res.json({ success: false, data: null, message: 'unable to update' })
            }
        }, function (err) {
            errorHandler(err, res);
        });
});

module.exports = router;