var express = require('express');
var router = express.Router();
var helper = require('../helper');

router.get('/', helper.checkTenantUser, function (req, res, next) {
    res.render('bqsq/course', {
        title: '班级',
        currentUrl: 'course',
        user: req.user,
        navTitle: req.tenant.displayName,
        classroom: req.tenant.classroom ? req.tenant.classroom : []
    });
});

router.get('/:courseID', helper.checkTenantUser, function (req, res, next) {
    res.locals.courseID = req.params.courseID;
    res.render('bqsq/course/view', {
        title: '查看班级',
        user: req.user,
        navTitle: req.tenant.displayName,
        classroom: req.tenant.classroom ? req.tenant.classroom : []
    });
});

module.exports = router;
