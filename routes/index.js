var express = require('express');
var passport = require('passport');
var router = express.Router();
var Account = require('../account');
var classes = require("../models/classes");

/* GET home page. */

router.get('/', function (req, res) {
    if (!req.user) {
        res.render('index', {
            project : '欢迎',
            errorMsg : req.flash('error')
        });
    } else {
        //TODO res.redirect('/' + user.tenant + '/home');
        console.log("req.user is " + req.user);
        res.redirect('/' + 'bqsq' + '/home');
    }
});
/*
router.get('/login', function (req, res) {
//console.error("login with previous error: " + req.flash('error'));
//console.error("login with previous error: " + req.flash('error'));
res.render('login', {
user : req.user,
error : req.flash('error')
});
});

router.post('/login', passport.authenticate('local', {
failureRedirect : '/login',
failureFlash : true
}), function (req, res, next) {
req.session.save(function (err) {
if (err) {
return next(err);
}
res.redirect('/');
});
});
 */

router.post('/login', passport.authenticate('local', {
        successRedirect : '/',
        failureRedirect : '/',
        failureFlash : true
    }));

router.get('/logout', function (req, res) {
    req.logout();
    res.redirect('/');
});

router.get('/index', function (req, res) {
    res.render('index', {
        title : 'Express'
    });
});

function getUserTenant(user) {
    return user.tenant;
}

function authentication(req, res) {
    console.log("req.user is " + req.user);
    console.log("req.session.user is " + req.session.user);
    if (!req.user) {
        return res.redirect('/login');
    }
}

module.exports = router;
