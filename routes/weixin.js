var express = require('express');
var router = express.Router();
var url = require("url");

/* GET users listing. */
router.get('/', function (req, res) {
	res.send('respond with a resource');
});

router.get('/check', function (req, res) {
	var signature = req.query.signature;
	var timestamp = req.query.timestamp;
	var nonce = req.query.nonce;

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

module.exports = router;
