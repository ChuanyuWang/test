var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');

//API routers
var classes = require('./api/classes');
var members = require('./api/members');
var booking = require('./api/booking');

/* GET users listing. */
router.get('/home', checkTenantUser, function (req, res) {
    res.render('bqsq/home', {
        title : '课程表',
        user : req.user,
        project : req.tenant.displayName
    });
});

router.get('/member', checkTenantUser, function (req, res) {
    res.render('bqsq/member', {
        title : '会员',
        user : req.user,
        project : req.tenant.displayName
    });
});

router.get('/setting', checkTenantUser, function (req, res) {
    res.render('bqsq/setting', {
        title : '设置',
        user : req.user,
        project : req.tenant.displayName
    });
});

router.get('/mybooking', function (req, res) {
    res.render('bqsq/mybooking', {
        title : '我的课程'
    });
});

// API =============================================================

router.use('/api/classes', classes);
router.use('/api/members', members);
router.use('/api/booking', booking);

function checkTenantUser(req, res, next) {
    if (!req.user) {
        req.flash('error', '用户未登陆或连接超时');
        res.redirect('/');
    } else if (req.user.tenant != req.tenant.name) {
        res.redirect('/' + req.user.tenant + '/home');
    } else {
        next();
    }
};

module.exports = router;
