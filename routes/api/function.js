var express = require('express');
var router = express.Router();
//var helper = require('../../helper');
//var dbUtility = require('../../util');
//var querystring = require('querystring');
const https = require("https");
const HmacSHA1 = require("crypto-js/hmac-sha1");
const Base64 = require('crypto-js/enc-base64');
const config = require("../../config.db");

/**
 * Send verify code
 */
router.post('/sendSMS', validateCode, function(req, res, next) {
    return res.end();
    /*
        var db = dbUtility.connect(req.tenant.name);
    
        if (!req.body.hasOwnProperty('status'))
            req.body.status = 'inactive';
        delete req.body._id;
    
        var teachers = db.get("teachers");
        teachers.insert(req.body).then(function(docs) {
            console.log("teacher is added %j", docs);
            return res.json(docs);
        }).catch(function(err) {
            var error = new Error("fail to add teacher");
            error.innerError = err;
            return next(error);
        });
    */
});

function objToUrl(data) {
    return Object.keys(data).map(function(key) {
        return key + '=' + encodeURIComponent(data[key]);
    }).join('&');
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

function validateCode(req, res, next) {
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
            //console.log(JSON.parse(data));
            console.log(data);
            return next();
        });

    }).on("error", (err) => {
        console.error("Error: " + err.message);
        return next(err);
    });
}

module.exports = router;