var express = require('express');
var router = express.Router();
const db_utils = require('../server/databaseManager');
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
        //TODO, get AppID and AppSecret from tenant config
        let accessToken = await getAccessToken(`?appid=${credentials.AppID}&secret=${credentials.AppSecret}&code=${req.query.code}&grant_type=authorization_code`) || {};
        /**
         * Example of accessToken
         * {
            "access_token": "38_RrnB8cQM1fzPrOHbInkXaTMrqfTRBjYCWBh2mc6EsyMpMr7N7pmbGhPAU4O12brWJiGntoO-DyE71jDj8TaZwYXu3bgpERTJT9FnQxKtiMg",
            "expires_in": 7200, // 2 hours
            "refresh_token": "38_FKbWXAEwJt9vEhw-2Nx95u5vUuU5aB3d1nCKUJtR4U1hBMltO6aTWLke_e-oLRAhecMYuTuWAFL8RHyjAlOr4w868FMerP2sQ2Ilxscvfz4",
            "openid": "o9lk5w_d08t3gW6KY9VkdWU5rnnU",
            "scope": "snsapi_base"
            }
         */
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
        //TODO
        return res.json({});
    } catch (error) {
        return next(error);
    }
});

async function getTenantInfo(req, res, next) {
    if (req.tenant) {
        return next();
    }

    // identify the tenant info, it maybe different with authenticated user
    let tenantName = "";
    if (req.query.hasOwnProperty("tenant")) {
        tenantName = req.query.tenant;
    } else if (req.body.hasOwnProperty("tenant")) {
        tenantName = req.body.tenant;
    } else if (req.isAuthenticated()) {
        tenantName = req.user.tenant;
    } else {
        // Not able to get the tenant name, continue
        return next();
    }

    try {
        let config_db = await db_utils.connect('config');
        if (!config_db) {
            return next(new Error("database config is not existed"));
        }
        let tenant = await config_db.collection('tenants').findOne({
            name: tenantName
        });
        if (!tenant) {
            let error = new Error(`Invalid tenant "${tenantName}"`);
            error.status = 400;
            return next(error);
        }
        req.tenant = tenant || {};
        req.db = await db_utils.mongojsDB(tenantName);
        return next();
    } catch (err) {
        let error = new Error("get tenant fails");
        error.innerError = err;
        return next(error);
    }
}

module.exports = router;
