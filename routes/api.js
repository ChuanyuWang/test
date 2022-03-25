const express = require('express');
const router = express.Router();
const db_utils = require('../server/databaseManager');
const credentials = require('../config.db');
const bent = require('bent');
const getAccessToken = bent('https://api.weixin.qq.com/sns/oauth2/access_token', 'GET', 'json', 200);
const xml2js = require('xml2js');
const util = require('./api/lib/util');
const rateLimit = require('express-rate-limit');


//add RateLimit
const limiter = rateLimit({
    windowMs: 1000 * 60, // 1 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    // Error message returned when max is exceeded.
    message: "Too many API requests, please try again later."
});
router.use(limiter);

// API routers ===========================================================

router.use(getTenantInfo);
router.use('/classes', require('./api/classes'));
router.use('/courses', require('./api/courses'));
router.use('/members', require('./api/members'));
router.use('/orders', require('./api/orders'));
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

router.post('/wxpay/notify/:tenant', async function(req, res, next) {
    let result = {};
    let response = {
        return_code: "SUCCESS",
        return_msg: "OK"
    };
    // Content-Type is "text/xml"
    console.debug("receiving notification from wechat pay");
    console.debug(req.body);
    const builder = new xml2js.Builder();
    try {
        result = req.body;
        //validate sign in case someone fake the payment
        if (!validateSign(result)) {
            response.return_code = "FAIL";
            response.return_msg = "签名失败";
            console.warn("WxPay notify sign is invalid");
            console.warn(result);
            return res.send(builder.buildObject(response));
        }
    } catch (error) {
        console.error(error);
        response.return_code = "FAIL";
        response.return_msg = error.message;
        return res.send(builder.buildObject(response));
    }
    try {
        let error = "", message = "", status = "notpay";
        if (result.return_code === "SUCCESS" && result.result_code === "SUCCESS") {
            // update the order as success
            status = "success";
        } else if (result.return_code !== "SUCCESS") {
            // check the communication result
            error = "return_code";
            message = result.return_msg;
        } else if (result.result_code !== "SUCCESS") {
            // chcek the business result
            error = "result_code";
            message = `[${result.err_code}]${result.err_code_des}`;
        }
        if (error) {
            console.log(`Notify fail pay, tenant: ${req.params.tenant}, tradeno: ${result.out_trade_no}, error code: ${error}, message: ${message}`);
        } else {
            console.log(`Notify success pay, tenant: ${req.params.tenant}, tradeno: ${result.out_trade_no}`);
        }

        let tenantDB = await db_utils.connect(req.params.tenant);
        let orders = tenantDB.collection("orders");
        await orders.findOneAndUpdate(
            { tradeno: parseInt(result.out_trade_no), status: "notpay" },
            {
                $set: {
                    status: status,
                    transactionid: result.transaction_id,
                    errorcode: error,
                    errormessage: message
                }
            }
        );
        console.log(`Update order ${result.out_trade_no} status from "notpay" to "${status}"`);

        return res.send(builder.buildObject(response));
    } catch (error) {
        console.error(error);
        response.return_code = "FAIL";
        response.return_msg = error.message;
        return res.send(builder.buildObject(response));
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

function validateSign(params) {
    let sign = params.sign;
    delete params.sign;
    if (params.sign_type == "HMAC-SHA256") {
        return sign === util.sign2(params, credentials.apiKey);
    } else {
        return sign === util.sign(params, credentials.apiKey);
    }
}

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
