const express = require('express');
const router = express.Router();
const helper = require('../helper');

router.get('/bqsq', helper.checkUser('admin@bqsq'), function(req, res, next) {
    res.render('cockpit', {
        title: '大Q小q门店和片源统计'
    });
});

module.exports = router;
