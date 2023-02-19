var express = require('express');
var passport = require('passport');
var router = express.Router();
const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 1000 * 60, // 1 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
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
    else if (req.user.tenant == 'bqsq-admin') res.redirect('/cockpit/bqsq');
    else res.redirect('/t/' + req.user.tenant + '/home');
}

// API routers ===========================================================
router.use('/api', require('./api'));

// administrator page
router.use('/admin', require("./admin"));

// cockpit page
router.use('/cockpit', require("./cockpit"));

// route different tenant
router.use('/mygirl', require('./mygirl')); // load customize tenant before others
router.use('/t/:tenantName/', require("./tenant"));

module.exports = router;
