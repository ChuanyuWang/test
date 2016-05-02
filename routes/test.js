var express = require('express');
var router = express.Router();
var bqsq = require('./base');
var wechat = require('wechat');
var API = require('wechat-api');
//var config = require('../config.js').test;

var visited_user_list = new Array();
var counter = 1;

//setup database

var tenant = {
    appid : 'wxe5e454c5dff8c7b2',
    appsecret : 'f3893474595ddada8e5c2ac5b4e40136',
    token : 'Hibanana',
    encodingAESKey : '',
    tenant : 'test',
    name : '大Q小q'
};
var db = require("../db").get(tenant.tenant);

var api = new API(tenant.appid, tenant.appsecret);

// all requests to this router will append tenant info
router.use(function (req, res, next) {
    req.tenant = tenant;
    req.db = db;
    req.api = api;
    next();
});

router.get('/booking', function (req, res) {
    console.log("user open booking page %d with header %j", counter, req.headers);
    console.log("currentuser is %j", visited_user_list);
    res.render('bqsq/booking', {
        title : '会员约课',
        counter : counter++
    });
});

router.post('/api/sendText', function (req, res) {
    res.status(200).end();
    return;
    var user = visited_user_list.pop();
    /*
    user = {
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
    };*/
    if (user) {
        sendMsg(api, user.openid, '亲爱用户: ' + user.nickname + '\n 您已成功预约');
    } else {
        console.error("No user found, the message sending fails");
    }
});

router.get('/api/currentuser', function (req, res) {
    console.log("client get the current booking user %j", visited_user_list);
    res.json(visited_user_list.pop());
});

// Weichat =============================================================

router.use('/weixin', wechat(tenant, function (req, res, next) {
    // 微信输入信息都在req.weixin上
    var message = req.weixin;

    // test getting user info
    if (message.MsgType == 'event' && message.Event == "VIEW") {
        console.log("user click the booking button");
        api.getUser(message.FromUserName, function (err, user, res) {
            console.log("get user info successfully from Weichat with " + JSON.stringify(user, null, 4));
            console.log("err is " + err + " and user is " + user + " res is " + res);
            if (!err && user) {
                visited_user_list.push(user);
                //sendMsg(api, message.FromUserName, 'A message is received as below \n' + JSON.stringify(message, null, 4))
            }
        });
    } else if (message.MsgType == 'event' && message.Event == 'CLICK' && message.EventKey == 'zhaobin') {
        // 回复招兵买马(图文回复)
        res.reply([{
                    title : '大Q小q绘本馆招兵买马',
                    description : '本司招聘故事会讲师等各类兼职，加入我们的大家庭，为孩子建立一片真善美的天空，为自己保留一片纯净的土壤。',
                    picurl : 'https://mmbiz.qlogo.cn/mmbiz/B2YQzKx0nCBrVmica7VKGc67GJeZ3A3KfoMG1e1I4fPibCb2QDD8KUic8CyJWpsD2u4bD14xkUUz1SdOMnu9vBfyQ/0?wx_fmt=jpeg',
                    url : 'http://mp.weixin.qq.com/s?__biz=MzAxODg0MTU5MQ==&mid=502713725&idx=1&sn=b0016b6893aa768ce9205b9b583a3710'
                }
            ]);
    }

    console.log("A message is received: " + JSON.stringify(message, null, 4));
    res.reply('A message is received as below \n' + JSON.stringify(message, null, 4));
}));

// Functions =============================================================

function sendMsg(api, openid, content) {
    api.sendText(openid, content, function (err, result, res) {
        console.log("text message is sent to " + openid);
        console.log("err is " + err + " and result is " + result + " res is " + res);
    });
};

// Route other request to base router ====================================

router.use(bqsq);

module.exports = router;
