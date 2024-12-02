var express = require('express');
var router = express.Router();
var helper = require('../helper');
const { ObjectId } = require('mongodb');


router.get('/', helper.checkTenantUser, function(req, res, next) {
    res.render('bqsq/course', {
        title: res.__('classes'),
        currentUrl: 'course',
        user: req.user,
        classroom: req.tenant.classroom ? req.tenant.classroom : []
    });
});

router.get('/:courseID', helper.checkTenantUser, function(req, res, next) {
    if (!ObjectId.isValid(req.params.courseID)) return next();
    res.render('bqsq/pages/detail-page', {
        title: '查看班级',
        user: req.user,
        entry_module: 'course/course_view.js',
        data: req.params.courseID
    });
});

module.exports = router;
