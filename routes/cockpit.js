const express = require('express');
const router = express.Router();

router.get('/bqsq', function(req, res) {
    res.render('cockpit', {
        title: '大Q小q门店和片源统计'
    });
});

module.exports = router;
