var express = require('express');
var router = express.Router();
var base = require('./base');
var wechat = require('wechat');
var API = require('wechat-api');
var util = require('../server/databaseManager');

//[{time:1462976508, openid:"o0uUrv4RGMMiGasPF5bvlggasfGk"}]
var visited_user_list = new Array();
var counter = 1;

/* tenant object
{
    appid : '',
    appsecret : '',
    token : 'Hibanana',
    encodingAESKey : '',
    name : 'test',
    displayName : '大Q小q',
    version : 1,
    classroom : []
};
*/
var tenant = null;
//var api = new API(tenant.appid, tenant.appsecret);
var api = null;

// all requests to this router will append tenant info
router.use(async function(req, res, next) {
    // add the tenant database to request object for later usage
    req.db = await util.connect("test");

    if (!tenant) {
        //load tenant info from database and initialize db and api object
        var tenant_name = "test";
        var config_db = await util.connect('config');
        config_db.collection('tenants').findOne({ name: tenant_name }, function(err, doc) {
            if (err || !doc) {
                var error = new Error("tenant is not created");
                error.status = 404;
                return next(error);
            }

            req.tenant = tenant = doc;
            req.api = api = new API(tenant.appid, tenant.appsecret);
            next();
        });
    } else {
        req.tenant = tenant;
        req.api = api;
        next();
    }
});

router.get('/booking', function(req, res) {
    var timeKey = parseInt(Date.now() / 1000);

    function findUserOpenID(user) {
        return timeKey - user.time <= 1;
    }

    var user = visited_user_list.find(findUserOpenID);
    visited_user_list = []; // important, clear the array

    console.log("open booking page with user %j", user);
    res.render('bqsq/booking', {
        title: '会员约课',
        counter: counter++,
        timeKey: timeKey,
        openid: user ? user.openid : '',
        classroom: req.tenant.classroom ? req.tenant.classroom : []
    });
});

router.post('/api/sendText', function(req, res) {
    if (!req.body.openid || !req.body.message) {
        res.status(400).send("Missing param 'openid' or 'message'");
        return;
    }

    api.sendText(req.body.openid, req.body.message, function(err, result) {
        if (err) {
            console.error("send text message to %s fails with error %j", req.body.openid, err);
            res.status(500).send(err);
        } else {
            console.log("text message is sent successfully with result %j", result);
            res.end();
        }
    });
});

router.get('/api/currentuser', function(req, res) {
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

// Weichat =============================================================

router.use('/weixin', wechat(tenant, function(req, res, next) {
    // 微信输入信息都在req.weixin上
    var message = req.weixin;
    console.log("A weixin message is received: %j", message);

    // test getting user info
    if (message.MsgType == 'event' && message.Event == "VIEW") {
        if (message.EventKey.indexOf('http://www.bookingme.cc') > -1) {
            console.log("user open page %s", message.EventKey);
            // user open some page from our web site, we need to cache user's openID for further usage
            visited_user_list.push({
                time: parseInt(message.CreateTime),
                openid: message.FromUserName
            });
            /*
            api.getUser(message.FromUserName, function (err, user) {
                
                user1 = {
                    "subscribe" : 1,
                    "openid" : "o0uUrv4RGMMiGasPF5bvlggasfGk",
                    "nickname" : "王传宇",
                    "sex" : 1,
                    "language" : "zh_CN",
                    "city" : "Pudong New District",
                    "province" : "Shanghai",
                    "country" : "China",
                    "headimgurl" : "http://wx.qlogo.cn/mmopen/UibmOkGHHooJQJN24337L2icPoXoQ0f8v51qiac0jGOxA2H7UglNDJ32WzwPHDiahzPznWePVcnYHKkcIwnkrwhSGGW7cVrHuKcI/0",
                    "subscribe_time" : 1460905029,
                    "remark" : "",
                    "groupid" : 0
                };
                console.log("get user info successfully from Weichat with " + JSON.stringify(user, null, 4));
                console.log("current date time is " + Date.now());
                if (!err && user) {
                    visited_user_list.push(user);
                    //sendMsg(api, message.FromUserName, 'A message is received as below \n' + JSON.stringify(message, null, 4))
                }
            });
            */
        }
    } else if (message.MsgType == 'event' && message.Event == 'CLICK' && message.EventKey == 'zhaobin') {
        // 回复招兵买马(图文回复)
        res.reply([{
            title: '大Q小q绘本馆招兵买马',
            description: '本司招聘故事会讲师等各类兼职，加入我们的大家庭，为孩子建立一片真善美的天空，为自己保留一片纯净的土壤。',
            picurl: 'https://mmbiz.qlogo.cn/mmbiz/B2YQzKx0nCBrVmica7VKGc67GJeZ3A3KfoMG1e1I4fPibCb2QDD8KUic8CyJWpsD2u4bD14xkUUz1SdOMnu9vBfyQ/0?wx_fmt=jpeg',
            url: 'http://mp.weixin.qq.com/s?__biz=MzAxODg0MTU5MQ==&mid=502713725&idx=1&sn=b0016b6893aa768ce9205b9b583a3710'
        }
        ]);
        return;
    }
    //TODO, only reply the message under development env
    //res.reply('A message is received as below \n' + JSON.stringify(message, null, 4));
    res.reply();
}));

// Functions =============================================================

// Route other request to base router ====================================

router.use(base);

module.exports = router;
