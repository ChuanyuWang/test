var express = require('express');
var router = express.Router();
//var helper = require('../../helper');
var db_utils = require('../../server/databaseManager');
//var querystring = require('querystring');
const https = require("https");
const HmacSHA1 = require("crypto-js/hmac-sha1");
const Base64 = require('crypto-js/enc-base64');
const config = require("../../config.db");
const AliCloud = require('@alicloud/pop-core');

/**
 * Send verify code
 */
router.post('/sendSMS', /* checkRobot, */ generateCode, function(req, res, next) {
    var client = new AliCloud({
        accessKeyId: config.accessKeyID,
        accessKeySecret: config.accessKeySecret,
        endpoint: 'https://dysmsapi.aliyuncs.com',
        apiVersion: '2017-05-25'
    });

    var params = {
        "PhoneNumbers": req.body.contact,
        "SignName": "报名试听",
        "TemplateCode": "SMS_175121681",
        "TemplateParam": `{"code":"${res.locals._code}"}`
    };

    var requestOption = {
        method: 'POST'
    };

    client.request('SendSms', params, requestOption).then((result) => {
        /** result is as below
         * {
                "Message": "OK",
                "RequestId": "EFE83E2E-6C64-4BE3-AD12-FBE2094277F8",
                "BizId": "514321470550812459^0",
                "Code": "OK"
            }
         */
        if (result.Code === 'OK') {
            console.log(`Send code "${res.locals._code}" to "${req.body.contact}" successfully`);
            return res.json({});
        } else {
            console.error(`Fail to send code "${res.locals._code}" to "${req.body.contact}"`);
            console.error(result);
            return next(new Error(`发送验证码失败: ${result.Message}`));
        }
    }, (ex) => {
        console.error(ex);
        return next(new Error("发送验证码失败，请重试"));
    });
});

/**
 * sent_code collect is as below
 * |phone|code|count|sendDate|
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
async function generateCode(req, res, next) {
    if (!req.body.hasOwnProperty('contact')) {
        var err = new Error("Missing param 'contact'");
        err.status = 400;
        return next(err);
    }
    if (!req.tenant) {
        let error = new Error("tenant is not defined");
        error.status = 400;
        return next(error);
    }
    // check if already submit phone for trial class
    const db = await db_utils.connect(req.tenant.name);
    const opportunities = db.collection('opportunities');
    const doc = await opportunities.findOne({ contact: req.body.contact });
    if (doc) {
        var err = new Error(`手机号${req.body.contact}已经报名试听`);
        err.status = 400;
        return next(err);
    }

    // check if time is expired, 10 minutes expired
    const sentCode = db.collection('sent_code');
    let code = await sentCode.findOne({ phone: req.body.contact });
    if (!code) {
        code = {
            phone: req.body.contact,
            code: getCode(4),
            count: 1,
            sendDate: new Date()
        }
    } else {
        let now = new Date();
        now.setMinutes(now.getMinutes() - 10);
        if (code.sendDate > now) {
            var err = new Error(`请勿在10分钟内重复发送验证码`);
            err.status = 400;
            return next(err);
        } else if (code.count > 100) {
            var err = new Error(`Sent too many code to the phone number, over 100 times`);
            err.status = 400;
            return next(err);
        } else {
            code.code = getCode(4);
            code.count += 1;
            code.sendDate = new Date();
        }
    }

    // generate code and store in req
    res.locals._code = code.code;

    // save code and contact in collection 'sent_code'
    await sentCode.save(code);

    return next();
}

function objToUrl(data) {
    return Object.keys(data).map(function(key) {
        return key + '=' + encodeURIComponent(data[key]);
    }).join('&');
}

function getCode(digit) {
    let code = '';
    for (let i = 0; i < digit; i++) {
        code += Math.floor(Math.random() * 10);
    }
    return code;
}

/**
 * Generate signature of Alibaba API service, more information refer to [link](https://help.aliyun.com/document_detail/26225.html?spm=a2c4g.11186623.2.1.6a3561caIUwm3y)
 * @param {Object} options object contains all params sent to Alibaba
 * @param {String} accessKeySecret Access Key Secret of Alibaba
 * @param {String} httpMethod HTTP method, e.g. "GET"
 */
function generateAlibabaSignature(options, accessKeySecret, httpMethod) {
    let tempQuery = {};
    Object.assign(tempQuery, options);
    let signQuery = {};
    Object.keys(tempQuery).sort().forEach(function(k) {
        signQuery[k] = tempQuery[k];
    });

    let str = httpMethod.toUpperCase() + "&" + encodeURIComponent("/") + "&" + encodeURIComponent(objToUrl(signQuery));

    // refer to https://www.npmjs.com/package/aliyun-apisign
    //return signature
    return Base64.stringify(HmacSHA1(str, accessKeySecret + "&"));
}

// eslint-disable-next-line
function checkRobot(req, res, next) {
    let date = new Date();

    let options = {
        // options of 'AuthenticateSig' action
        Action: "AuthenticateSig",
        Token: req.body.token,
        Sig: req.body.sig,
        SessionId: req.body.sessionId,
        Scene: req.body.scene,
        AppKey: req.body.appKey,
        RemoteIp: req.ip,
        // common options
        Format: "JSON",
        Version: "2018-01-12",
        AccessKeyId: config.accessKeyID,
        SignatureMethod: "HMAC-SHA1",
        Timestamp: date.toISOString().replace(/\.\d{3}/, ''), // 2019-10-07T15:18:30.795Z ==> 2019-10-07T15:18:30Z
        SignatureVersion: "1.0",
        SignatureNonce: String(date.getTime()) + Math.floor(Math.random() * 1000),
    };

    for (const key in options) {
        if (!options[key]) return next(new Error(`Missing param: ${key}`));
    }

    options.Signature = generateAlibabaSignature(options, config.accessKeySecret, "GET");

    https.get('https://afs.aliyuncs.com/?' + objToUrl(options), (resp) => {
        let data = '';

        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });

        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            /**data is JSON string as below
             * {
                    Detail: '{"sigSource":0}',
                    RiskLevel: '',
                    RequestId: 'C59DD07B-3D1E-428E-9AC7-F8B619623A0C',
                    Msg: 'pass_1',
                    Code: 100
                }
                successful code is 100
                duplicate code is 900 (send same Token, Sig and SessionId)
             */
            var result = JSON.parse(data);
            if (result.Code !== 100) {
                console.error(`validate code fail, contact is ${req.body.contact}, respond is ${result}`);
                return next(new Error('人机验证失败，请重试'));
            }
            return next();
        });

    }).on("error", (err) => {
        console.error("Error: " + err.message);
        return next(new Error('人机验证失败，请重试'));
    });
    //request.end() will automatically be called if the request was initiated via http.get()
}

module.exports = router;
