var express = require('express');
var router = express.Router();
var wechat = require('wechat');
var API = require('wechat-api');
var config = require('../config.js');

/* GET users listing. */
router.get('/home', function (req, res) {
    if (!req.user) {
        res.redirect('/');
    } else {
        res.render('bqsq/home', {
            title : '课程表',
            user : req.user,
            project : '大Q小q'
        });
    }
});

router.get('/member', function (req, res) {
    if (!req.user) {
        res.redirect('/');
    } else {
        res.render('bqsq/member', {
            title : '会员',
            user : req.user,
            project : '大Q小q'
        });
    }
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

function isAuthenticated(req, res, next) {
    if (req.user) {
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

module.exports = router;
