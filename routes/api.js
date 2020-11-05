var express = require('express');
var router = express.Router();
var util = require('../util');
const credentials = require('../config.db');
const bent = require('bent');
const getAccessToken = bent('https://api.weixin.qq.com/sns/oauth2/access_token', 'GET', 'json', 200);

// API routers ===========================================================

router.use(getTenantInfo);
router.use('/classes', require('./api/classes'));
router.use('/courses', require('./api/courses'));
router.use('/members', require('./api/members'));
router.use('/booking', require('./api/booking'));
router.use('/setting', require('./api/setting'));
router.use('/teachers', require('./api/teachers'));
router.use('/opportunities', require('./api/opportunities'));
router.use('/analytics', require('./api/analytics'));
router.use('/function', require('./api/function'));

router.get('/getOpenID', async function(req, res, next) {
    try {
        if (!req.query.tenant || !req.query.code) {
            let err = new Error("Missing param 'tenant' or 'code'");
            err.status = 400;
            return next(err);
        }
        let accessToken = await getAccessToken(`?appid=${credentials.AppID}&secret=${credentials.AppSecret}&code=${req.query.code}&grant_type=authorization_code`) || {};
        console.log("Get accessToken %j", accessToken);
        if (accessToken.errcode) {
            let err = new Error(accessToken.errmsg);
            err.code = accessToken.errcode;
            err.status = 400;
            return next(err);
        } else {
            //TODO, return member info together if existing
            return res.json({ openid: accessToken.openid });
        }
    } catch (error) {
        return next(error);
    }
});

router.post('/sendNotification', async function(req, res, next) {
    try {
        if (!req.body.tenant || !req.body.openid) {
            let err = new Error("Missing param 'tenant' or 'openid'");
            err.status = 400;
            return next(err);
        }
        return res.json({});
    } catch (error) {
        return next(error);
    }
});

function getTenantInfo(req, res, next) {
    if (req.isUnauthenticated() || req.tenant) {
        return next();
    }

    var tenantName = req.user.tenant;
    req.db = util.connect(tenantName);
    // cache the tenant object in request, e.g.
    /* tenant object
    {
        appid : 'wxe5e454c5dff8c7b2',
        appsecret : 'f3893474595ddada8e5c2ac5b4e40136',
        token : 'Hibanana',
        encodingAESKey : '',
        name : 'test',
        displayName : '大Q小q',
        version : 1,
        classroom : []
    };
    */
    var config_db = util.connect('config');
    if (!config_db) {
        console.error("database config is not existed");
        next();
    }
    config_db.collection('tenants').findOne({
        name: tenantName
    }, function(err, tenant) {
        if (err) {
            console.error(err);
        }

        req.tenant = tenant || {};
        next();
    });
}

module.exports = router;
