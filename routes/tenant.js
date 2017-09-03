var express = require('express');
var router = express.Router();
var helper = require('../helper');
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
        return Math.abs(user.time - timeKey) <= 1;
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

    // get the list of public rooms
    var all_rooms = req.tenant.classroom || [];
    var public_rooms = all_rooms.filter(function(value, index, array) {
        return value.visibility != 'internal';
    });

    console.log("open booking page with user %j", user);
    res.render('bqsq/booking', {
        title : '会员约课',
        timeKey : timeKey,
        logoPath: helper.getTenantLogo(req.tenant.name),
        contact: req.tenant.contact,
        tel: helper.getTel(req.tenant.contact),
        address: req.tenant.address,
        addressLink: req.tenant.addressLink || '#',
        openid : user ? user.openid : '',
        classroom : public_rooms
    });
});

// Functions =============================================================


// Route other request to base pages =====================================

router.use('/course', require('./course'));
router.use(require('./base'));

module.exports = router;
