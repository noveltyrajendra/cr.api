const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const WEBHOOK_SECRET = "SV14yKjSmHSI6Yg9H2VuJaavt34WCc4k";

router.use(function(req, res, next) {
    next();
});

// Return router
module.exports = router;