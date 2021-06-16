var express = require('express');
var router = express.Router();
var helper = require('../helper');

router.get('/booking', function(req, res, next) {
    res.render('bqsq/booking', {
        title: '会员约课'
    });
});

// Functions =============================================================


// Route other request to base pages =====================================

router.use('/course', require('./course'));
router.use(require('./base'));

module.exports = router;
