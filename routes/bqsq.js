var express = require('express');
var router = express.Router();
var wechat = require('wechat');
var API = require('wechat-api');
var config = require('../config.js');

var CURRENT_TENANT = {
    name : 'bqsq',
    displayName : '大Q小q'
};

/* GET users listing. */
router.get('/home', checkTenantUser, function (req, res) {
    res.render('bqsq/home', {
        title : '课程表',
        user : req.user,
        project : CURRENT_TENANT.displayName
    });
});

router.get('/member', checkTenantUser, function (req, res) {
    res.render('bqsq/member', {
        title : '会员',
        user : req.user,
        project : CURRENT_TENANT.displayName
    });
});

router.get('/booking', function (req, res) {
    res.render('bqsq/booking', {
        title : '会员约课',
        user : req.user,
        project : CURRENT_TENANT.displayName
    });
});

router.post('/api/classes', isAuthenticated, function (req, res) {
    res.status(200);
});

router.use('/weixin', wechat(config.test, function (req, res, next) {
        // 微信输入信息都在req.weixin上
        var message = req.weixin;

        // test getting user info
        if (message.MsgType == 'event' && message.Event == "VIEW") {
            var api = new API(config.test.appid, config.test.appsecret);
            api.getUser(message.FromUserName, function (err, user, res) {
                console.log("get user info is done with " + JSON.stringify(user, null, 4));
                console.log("err is " + err + " and user is " + user + " res is " + res);
                if (!err && user) {
                    sendMsg(api, message.FromUserName, 'A message is received as below \n' + JSON.stringify(message, null, 4))
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

function sendMsg(api, openid, content) {
    api.sendText(openid, content, function (err, result, res) {
        console.log("text message is sent to " + openid);
        console.log("err is " + err + " and result is " + result + " res is " + res);
    });
};

function checkTenantUser(req, res, next) {
    if (!req.user) {
        req.flash('error', '用户未登陆或连接超时');
        res.redirect('/');
    } else if (req.user.tenant != CURRENT_TENANT.name) {
        res.redirect('/' + req.user.tenant + '/home');
    } else {
        next();
    }
}

function isAuthenticated(req, res, next) {
    if (req.user) {
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

module.exports = router;
