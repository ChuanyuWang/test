var express = require('express');
var passport = require('passport');
var router = express.Router();
var Account = require('../account');
var logger = require('log4js').getLogger();

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

module.exports = router;
