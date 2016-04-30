var express = require('express');
var router = express.Router();
var wechat = require('wechat');
var API = require('wechat-api');
var mongojs = require('mongojs');
var config = require('../config.js').test;
//setup database
var db = require("../db").get(config.tenant);
var classes = require("../models/classes")(db);
var members = require("../models/members")(db);
var api = new API(config.appid, config.appsecret);

var visited_user_list = new Array();

var counter = 1;

/* GET users listing. */
router.get('/home', checkTenantUser, function (req, res) {
    res.render('bqsq/home', {
        title : '课程表',
        user : req.user,
        project : config.name
    });
});

router.get('/member', checkTenantUser, function (req, res) {
    res.render('bqsq/member', {
        title : '会员',
        user : req.user,
        project : config.name
    });
});

router.get('/booking', function (req, res) {
    console.log("user open booking page %d with header %j", counter, req.headers);
    console.log("currentuser is %j", visited_user_list);
    res.render('bqsq/booking', {
        title : '会员约课',
        counter : counter++
    });
});

// API =============================================================

router.get('/api/members', isAuthenticated, function (req, res) {
    //console.log("get members with query %j", req.query);
    var members = db.collection("members");
    var query = {};
    members.find(query).sort({since: -1}, function (err, docs) {
        if (err) {
            res.status(500).json({
                'err' : err
            })
        }
        console.log("find members with result %j", docs);
        res.json(docs);
    });
});

router.post('/api/members', isAuthenticated, function (req, res) {
    members.insert(req.body, function (err, docs) {
        if (err) {
            res.status(500).json({
                'err' : err
            })
        } else {
            console.log("member is added %j", docs);
            res.json(docs);
        }
    });
});

router.delete('/api/members/:memberID', isAuthenticated, function (req, res) {
    var members = db.collection("members");
    members.remove({
        _id : mongojs.ObjectId(req.params.memberID)
    }, function (err, doc) {
        if (err) {
            res.status(500).json({
                'err' : err
            })
        } else {
            console.log("member %s is deteled", req.params.memberID);
            res.json({});
        }
    });
});

router.get('/api/classes', function (req, res) {
    //console.log("get classes with query %j", req.query);
    if (!req.query.from || !req.query.to) {
        res.status(400).send("Missing param 'from' or 'to'");
    }

    var classes = db.collection("classes");
    var query = {
        date : {
            $gte : new Date(req.query.from),
            $lt : new Date(req.query.to)
        }
    };
    classes.find(query, function (err, docs) {
        if (err) {
            res.status(500).json({
                'err' : err
            })
        }
        console.log("find classes with result %j", docs);
        res.json(docs);
    });
});

router.post('/api/classes', isAuthenticated, function (req, res) {
    classes.insert(req.body, function (err, docs) {
        if (err) {
            res.status(500).json({
                'err' : err
            })
        } else {
            console.log("class is added %j", docs);
            res.json(docs);
        }
    });
});

router.delete('/api/classes/:classID', isAuthenticated, function (req, res) {
    var classes = db.collection("classes");
    classes.remove({
        _id : mongojs.ObjectId(req.params.classID)
    }, function (err, doc) {
        if (err) {
            res.status(500).json({
                'err' : err
            })
        } else {
            console.log("class %s is deteled", req.params.classID);
            res.json({});
        }
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

router.use('/weixin', wechat(config, function (req, res, next) {
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

function checkTenantUser(req, res, next) {
    if (!req.user) {
        req.flash('error', '用户未登陆或连接超时');
        res.redirect('/');
    } else if (req.user.tenant != config.tenant) {
        res.redirect('/' + req.user.tenant + '/home');
    } else {
        next();
    }
};

function isAuthenticated(req, res, next) {
    if (req.user && req.user.tenant == config.tenant) {
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

module.exports = router;
