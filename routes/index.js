var express = require('express');
var passport = require('passport');
var router = express.Router();
var util = require('../util');
var RateLimit = require('express-rate-limit');

var loginLimiter = new RateLimit({
    windowMs: 1000 * 60, // 1 minutes
    max: 5, // limit each IP to 10 requests per windowMs
    delayMs: 0, // disable delaying - full speed until the max limit is reached
    // Error message returned when max is exceeded.
    message: "Too many login requests, please try again later."
});

/* GET home page. */
router.get('/', function(req, res) {
    if (!req.user) {
        res.render('index', {
            title: res.__('title'),
            navTitle: res.__('title'),
            errorMsg: req.flash('error')
        });
    } else {
        navigateToUserHome(req, res);
    }
});

/* login/logout API */
router.get('/login', function(req, res) {
    res.redirect('/');
});

router.post('/login', loginLimiter, passport.authenticate('local', {
    failureRedirect: '/',
    failureFlash: '用户名或密码不正确'
}), function(req, res) {
    // If this function gets called, authentication was successful.
    // 'req.user' contains the authenticated user.

    console.log(`User >>${req.user.username}<< login ${req.user.tenant}`);
    navigateToUserHome(req, res);
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

function navigateToUserHome(req, res) {
    // handle administrator login, then navigate to admin home page
    if (req.user.tenant == 'admin') res.redirect('/admin/home');
    else res.redirect('/t/' + req.user.tenant + '/home');
}

// API routers ===========================================================
router.use('/api', require('./api'));

// administrator page
router.use('/admin', require("./admin"));

// route different tenant
router.use('/mygirl', require('./mygirl')); // load customize tenant before others
router.use('/t/:tenantName/', getTenantInfo, require("./tenant"));

function getTenantInfo(req, res, next) {
    // cache the tenant object in request, e.g.
    /* tenant object
    {
        appid : 'wxe5e454c5dff8c7b2',
        appsecret : 'f3893474595ddada8e5c2ac5b4e40136',
        token : 'Hibanana',
        encodingAESKey : '',
        name : 'test',
        displayName : '大Q小q',
        feature: 'book',
        version : 1,
        classroom : [],
        contact : '136-6166-4265',
        address : '宝翔路801号五彩城3楼307'
        addressLink : 'http://j.map.baidu.com/39KKB'
    };
    */
    var config_db = util.connect('config');
    if (!config_db) {
        return next(new Error("database config is not existed"));
    }
    config_db.collection('tenants').findOne({
        name: req.params.tenantName
    }, function(err, tenant) {
        if (err) {
            let error = new Error("get tenant fails");
            error.innerError = err;
            return next(error);
        }
        if (!tenant) {
            let error = new Error(`tenant ${req.params.tenantName} doesn't exist`);
            error.status = 400;
            return next(error);
        }

        if (tenant.status === 'inactive') {
            if (req.user) {
                // force to logout if user login inactive tenant
                if (req.user.tenant === tenant.name) {
                    req.logout();
                }
            }
            let error = new Error("门店已关闭或停用，请稍后再试。");
            error.status = 400;
            return next(error);
        }

        req.tenant = tenant;
        req.db = util.connect(tenant.name);
        // navTitle is the title on the navigation bar
        res.locals.navTitle = tenant.displayName || "";
        res.locals.tenant_feature = tenant.feature || "common"; // default is common
        next();
    });
}

module.exports = router;
