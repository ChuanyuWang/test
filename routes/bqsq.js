var express = require('express');
var router = express.Router();
var wechat = require('wechat');
var API = require('wechat-api');
var config = require('../config.js');

/* GET users listing. */
router.get('/', function (req, res) {
	res.send('respond with a resource');
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

		res.reply('A message is received as below \n' + JSON.stringify(message, null, 4));
		console.log("A message is received: " + JSON.stringify(message, null, 4));
	}));

function sendMsg(api, openid, content) {
	api.sendText(openid, content, function (err, result, res) {
        console.log("text message is sent to " + openid);
        console.log("err is " + err + " and result is " + result + " res is " + res);
    });
};
/*
router.get('/check', function (req, res) {
var signature = req.query.signature;
var timestamp = req.query.timestamp;
var nonce = req.query.nonce;

api.getLatestToken(function (err, token) {
console.log("token is " + token.accessToken);
});

// define token
var token = "Hibanana";
var tmpArr = new Array(token, timestamp, nonce);
// sort and join as string
var content = tmpArr.sort().join('');
console.log("content is " + content);

// generate sha1
var crypto = require('crypto');
var shasum = crypto.createHash('sha1');
shasum.update(content);
var d = shasum.digest('hex');
console.log("d is " + d);
if (signature == d) {
res.send(req.query.echostr);
} else {
res.status(403).send('Weixin authorization fails');
}
});
 */
module.exports = router;
