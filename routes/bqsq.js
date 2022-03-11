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
    name : 'bqsq',
    displayName : '大Q小q',
    version : 1,
    classroom : []
};
*/
var tenant = null;
//var api = new API(tenant.appid, tenant.appsecret);
var api = null;
// single tenant database connection
var tenant_db = null;

// all requests to this router will append tenant info
router.use(function(req, res, next) {
    // add the tenant database to request object for later usage
    if (!tenant_db) {
        var tenant_name = req.baseUrl.split("/")[1];
        tenant_db = util.mongojsDB(tenant_name);
    }
    req.db = tenant_db;

    if (!tenant) {
        //load tenant info from database and initialize db and api object
        var tenant_name = req.baseUrl.split("/")[1];
        var config_db = util.connect('config');
        config_db.collection('tenants').findOne({ name: tenant_name }, function(err, doc) {
            if (err || !doc) {
                var error = new Error("tenant is not created");
                error.status = 404;
                return next(error);
            }

            req.tenant = tenant = doc;
            req.api = api = new API(tenant.appid, tenant.appsecret);
            config_db.close();
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
    } else if (message.MsgType == 'event' && message.Event == 'CLICK' && message.EventKey == 'club_intro') {
        // 回复Q馆介绍(图文回复)
        res.reply([{
            title: '大Q小q绘本馆',
            description: '大Q小q致力于学龄前儿童早期阅读的研究和推广，以绘本为工具，以故事会的形式开拓单一的儿童商业业态，并帮助家长择书育儿。',
            picurl: 'https://mmbiz.qlogo.cn/mmbiz/B2YQzKx0nCDxZj1kzveRrhpzBB4jO2s1s6D3LvlmTLq5o2icst1YoXHfYZhzjbMUx2xQo97JsHbcL7ydLJusibUw/0?wx_fmt=jpeg',
            url: 'http://mp.weixin.qq.com/s?__biz=MzAxODg0MTU5MQ==&mid=502713766&idx=1&sn=b877e12afcc7734de6d14920abb942f3'
        }
        ]);
        return;
    } else if (message.MsgType == 'event' && message.Event == 'CLICK' && message.EventKey == 'club_zhaobin') {
        // 回复招兵买马(图文回复)
        res.reply([{
            title: '大Q小q绘本馆招兵买马',
            description: '本司招聘故事会讲师等各类兼职，加入我们的大家庭，为孩子建立一片真善美的天空，为自己保留一片纯净的土壤。',
            picurl: 'https://mmbiz.qlogo.cn/mmbiz/B2YQzKx0nCBrVmica7VKGc67GJeZ3A3KfoMG1e1I4fPibCb2QDD8KUic8CyJWpsD2u4bD14xkUUz1SdOMnu9vBfyQ/0?wx_fmt=jpeg',
            url: 'http://mp.weixin.qq.com/s?__biz=MzAxODg0MTU5MQ==&mid=502713725&idx=1&sn=b0016b6893aa768ce9205b9b583a3710'
        }
        ]);
        return;
    } else if (message.MsgType == 'event' && message.Event == 'CLICK' && message.EventKey == 'club_member') {
        // 回复申请会员(图文回复)
        res.reply([{
            title: '大Q小q阅读俱乐部招募会员啦',
            description: '用心的绘本平台，丰富的主题课程，天天故事会，让我们一起读书吧！',
            picurl: 'https://mmbiz.qlogo.cn/mmbiz/B2YQzKx0nCDxZj1kzveRrhpzBB4jO2s1DXgxlJ7ibHUww2SzUyuO1icNWf6TPtNv6yeriaK8vic7bubSykkIqQxm0g/0?wx_fmt=jpeg',
            url: 'http://mp.weixin.qq.com/s?__biz=MzAxODg0MTU5MQ==&mid=502713754&idx=1&sn=c8f3e32b4cc139adfe75e59923a595dd'
        }
        ]);
        return;
    } else if (message.MsgType == 'event' && message.Event == 'CLICK' && message.EventKey == 'club_collect') {
        // 回复收购绘本(图文回复)
        res.reply([{
            title: '大Q小q绘本馆二手绘本征集令!',
            description: '想看更多的书？想腾出更多的空间？想把好书分享给其他的小朋友？大Q小q绘本馆，二手绘本征集啦~！！！',
            picurl: 'https://mmbiz.qlogo.cn/mmbiz/B2YQzKx0nCDXviag8uozkdxreEfsAB5TCDjl3358wWgjFjOknI2EfpN077XmoJxTYvqic4B3hSuTAFZce6D8ibGeQ/0?wx_fmt=jpeg',
            url: 'http://mp.weixin.qq.com/s?__biz=MzAxODg0MTU5MQ==&mid=502713728&idx=1&sn=32b8fe1d8626bc9970808ddf669499eb'
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
