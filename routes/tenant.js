var express = require('express');
var router = express.Router();
var util = require('../util');
// var wechat = require('wechat');
// var API = require('wechat-api');

//[{time:1462976508, openid:"o0uUrv4RGMMiGasPF5bvlggasfGk"}]
var visited_user_list = new Array();

router.get('/api/currentuser', function (req, res) {
    if (!req.query.timeKey) {
        res.status(400).send("Missing param 'timeKey'");
        return;
    }
    var timeKey = parseInt(req.query.timeKey);
    function findUserOpenID(user) {
        return Math.abs(user.time - time) <= 1;
    }
    
    var user = visited_user_list.find(findUserOpenID);
    console.log("Get the current weixin user %j", user);
    res.json(user || {});
});

router.get('/booking', function (req, res) {
    var timeKey = parseInt(Date.now()/1000);

    function findUserOpenID(user) {
        return timeKey - user.time <= 1;
    }
    
    var user = visited_user_list.find(findUserOpenID);
    visited_user_list = []; // important, clear the array

    console.log("open booking page with user %j", user);
    res.render('bqsq/booking', {
        title : '会员约课',
        timeKey : timeKey,
        openid : user ? user.openid : '',
        classroom : req.tenant.classroom ? req.tenant.classroom : []
    });
});

// Functions =============================================================


// Route other request to base pages =====================================

router.use('/course', require('./course'));
router.use(require('./base'));

module.exports = router;
