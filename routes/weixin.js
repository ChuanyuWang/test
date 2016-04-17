var express = require('express');
var router = express.Router();
var wechat = require('wechat');

var API = require('wechat-api');
var api = new API('wx44ade48e4f86c081', 'e284d26a4c30dddb295b6dbade703732');

/* GET users listing. */
router.get('/', function (req, res) {
	res.send('respond with a resource');
});

var appID = "wx44ade48e4f86c081";
var appSecret = "e284d26a4c30dddb295b6dbade703732";

var config = {
  token: 'Hibanana',
  appid: 'wx44ade48e4f86c081',
  encodingAESKey: 'SIA3ze7mGjCEpvTlhp5n3OjjRrD8QAPcHQDpklRp4uE'
};

router.use('/check', wechat(config, function (req, res, next) {
		// 微信输入信息都在req.weixin上
		var message = req.weixin;
		if (message.FromUserName === 'diaosi') {
			// 回复屌丝(普通回复)
			res.reply('hehe');
		} else if (message.FromUserName === 'text') {
			//你也可以这样回复text类型的信息
			res.reply({
				content : 'text object',
				type : 'text'
			});
		} else if (message.FromUserName === 'hehe') {
			// 回复一段音乐
			res.reply({
				type : "music",
				content : {
					title : "来段音乐吧",
					description : "一无所有",
					musicUrl : "http://mp3.com/xx.mp3",
					hqMusicUrl : "http://mp3.com/xx.mp3",
					thumbMediaId : "thisThumbMediaId"
				}
			});
		} else {
			// 回复高富帅(图文回复)
			res.reply([{
						title : '你来我家接我吧',
						description : '这是女神与高富帅之间的对话',
						picurl : 'http://nodeapi.cloudfoundry.com/qrcode.jpg',
						url : 'http://nodeapi.cloudfoundry.com/'
					}
				]);
		}
	}));

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
