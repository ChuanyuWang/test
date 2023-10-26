const express = require('express');
const router = express.Router();
const helper = require('../helper');

// req.tenant is not initialized for this router
router.get('/bqsq', helper.checkUserTenant('bqsq-admin'), function(req, res, next) {
    res.render('cockpit', {
        title: '大Q小q门店和片源统计'
    });
});

module.exports = router;
