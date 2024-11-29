const express = require('express');
const router = express.Router();
const helper = require('../helper');
const { ObjectId } = require('mongodb');
const { getCheckinPage } = require('../server/renderCheckinPage');

router.get('/home', helper.checkTenantUser, function(req, res) {
    res.render('bqsq/home', {
        title: res.__('curriculum'),
        currentUrl: 'home',
        user: req.user
    });
});

router.get('/class/:classID', helper.checkTenantUser, function(req, res, next) {
    // skip to 404 page if class ID is not valid
    if (!ObjectId.isValid(req.params.classID)) return next();
    res.render('bqsq/pages/detail-page', {
        title: res.__('view_session'),
        entry_module: 'home/class_view.js',
        data: req.params.classID,
        user: req.user
    });
});

router.get('/class/:classID/printcheckin', getCheckinPage);

router.get('/member', helper.checkTenantUser, function(req, res) {
    res.render('bqsq/member', {
        title: res.__('members'),
        user: req.user,
        currentUrl: 'member'
    });
});

router.get('/member/:memberID', helper.checkTenantUser, function(req, res, next) {
    // skip to 404 page if member ID is not valid
    if (!ObjectId.isValid(req.params.memberID)) return next();
    res.locals.memberID = req.params.memberID;
    res.render('bqsq/pages/detail-page', {
        title: res.__('view_member'),
        user: req.user,
        entry_module: 'members/member_detail.js',
        data: req.params.memberID,
    });
});

router.get('/statistics', helper.checkTenantUser, function(req, res) {
    res.render('bqsq/statistics', {
        title: res.__('statistics'),
        currentUrl: 'statistics',
        user: req.user
    });
});

router.get('/setting', helper.checkTenantUser, function(req, res) {
    let port = req.app.locals.ENV_DEVELOPMENT ? `:${req.app.get("port")}` : "";
    res.render('bqsq/setting', {
        title: res.__('settings'),
        currentUrl: 'setting',
        user: req.user,
        tenantUrl: req.protocol + '://' + req.hostname + port + req.baseUrl,
        hostname: req.hostname
    });
});

router.get('/booking', function(req, res, next) {
    res.render('bqsq/booking', {
        title: '学员约课'
    });
});

router.get('/mybooking', function(req, res) {
    res.render('bqsq/mybooking', {
        title: '我的课程'
    });
});

router.get('/myReadBooks', function(req, res) {
    res.render('bqsq/myReadBooks', {
        title: '我的英文绘本',
        logoPath: helper.getTenantLogo(req.tenant)
    });
});

router.get('/trial', function(req, res) {
    res.render('bqsq/trial', {
        title: req.tenant.name === 'bqsqdrc' ? '报名成功' : '报名试听',
        logoPath: helper.getTenantLogo(req.tenant)
    });
});

router.get('/finance', helper.checkTenantUser, function(req, res) {
    res.render('bqsq/finance', {
        title: res.__('constracts'),
        currentUrl: 'finance',
        user: req.user
    });
});

router.get('/contract/create', helper.checkTenantUser, function(req, res) {
    res.render('bqsq/pages/detail-page', {
        title: res.__('constracts_create'),
        entry_module: '/js/contract_create.js',
        user: req.user
    });
});

router.get('/contract/:contractID', helper.checkTenantUser, function(req, res, next) {
    // skip to 404 page if contract ID is not valid
    if (!ObjectId.isValid(req.params.contractID)) return next();
    res.render('bqsq/pages/detail-page', {
        title: res.__('view_contract'),
        entry_module: 'finance/contract_detail.js',
        data: req.params.contractID,
        user: req.user
    });
});

router.get('/app', function(req, res) {
    res.render('bqsq/mobile/portal', {
        title: 'Mobile Portal'
    });
});

router.get('/poster', function(req, res) {
    res.render('bqsq/mobile/poster', {
        title: '当日课程表展示'
    });
});

module.exports = router;
