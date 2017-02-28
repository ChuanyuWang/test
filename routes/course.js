var express = require('express');
var router = express.Router();
var helper = require('../helper');

router.get('/', helper.checkTenantUser, function (req, res) {
    res.render('bqsq/course', {
        title: '班级',
        user: req.user,
        navTitle: req.tenant.displayName,
        classroom: req.tenant.classroom ? req.tenant.classroom : []
    });
});

module.exports = router;
