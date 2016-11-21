var express = require('express');
var passport = require('passport');
var router = express.Router();
var Account = require('../account');
var logger = require('log4js').getLogger();
var util = require('../util');

/* GET home page. */
router.get('/', function (req, res) {
    if (!req.user) {
        res.render('index', {
            title : '约课',
            navTitle : '约课',
            errorMsg : req.flash('error')
        });
    } else {
        navigateToUserHome(req, res);
    }
});

/* login/logout API */

router.post('/login', passport.authenticate('local', {
        failureRedirect : '/',
        failureFlash : '用户名或密码不正确'
    }), function (req, res) {
    // If this function gets called, authentication was successful.
    // 'req.user' contains the authenticated user.

    logger.info("User >>%s<< login", req.user.username);
    navigateToUserHome(req, res);
});

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

function navigateToUserHome(req, res) {
    res.redirect('/' + req.user.tenant + '/home');
}

// administrator page
router.use('/admin', require("./admin"));

// route different tenant
router.use('/:tenantName', getTenantInfo, require("./main"));
router.use('/mygirl', require('./mygirl')); // load customize tenant before others

function getTenantInfo(req, res, next) {
    req.db = util.connect(req.params.tenantName);
    // cache the tenant object in request, e.g.
    /* tenant object
    {
        appid : 'wxe5e454c5dff8c7b2',
        appsecret : 'f3893474595ddada8e5c2ac5b4e40136',
        token : 'Hibanana',
        encodingAESKey : '',
        name : 'test',
        displayName : '大Q小q',
        version : 1,
        classroom : []
    };
    */
    var config_db = util.connect('config');
    if (!config_db) {
        console.error("database config is not existed");
        next();
    }
    config_db.collection('tenants').findOne({
        name: req.params.tenantName
    }, function (err, tenant) {
        if (err) {
            console.error(err);
        }

        req.tenant = tenant;
        next();
    });
}

module.exports = router;
