var express = require('express');
var passport = require('passport');
var router = express.Router();
var Account = require('../account');
var classes = require("../models/classes");
var logger = require('log4js').getLogger();

/* GET home page. */

router.get('/', function (req, res) {
    if (!req.user) {
        res.render('index', {
            project : '欢迎',
            errorMsg : req.flash('error')
        });
    } else {
        navigateToUserHome(req, res);
    }
});

router.post('/login', passport.authenticate('local', {
        failureRedirect : '/',
        failureFlash : true
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
    //TODO res.redirect('/' + user.tenant + '/home');
    res.redirect('/' + 'bqsq' + '/home');
}

module.exports = router;
