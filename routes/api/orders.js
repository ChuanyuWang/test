const express = require('express');
const router = express.Router();
const helper = require('../../helper');
const util = require('./lib/util');
const db_utils = require('../../server/databaseManager');
const bent = require('bent');
const credentials = require('../../config.db');
const { ObjectId } = require('mongodb');
const xml2js = require('xml2js');
const moment = require('moment');
const orderHelper = require('./lib/orderHelper');

/**
 * {
 *  tradeno: String
 *  name: String,
 *  contact: String,
 *  memberid: ObjectId,
 *  classid: ObjectId,
 *  status: "open|notpay|success|closed|refund",
 *  quantity: Int,
 *  body: String,
 *  detail: String,
 *  feetype: "CNY",
 *  totalfee: Int,
 *  openid: String,
 *  clientip: String,
 *  timestart: Date,
 *  timeexpire: Date,
 *  tradetype: "JSAPI|NATIVE|APP",
 *  prepayid: String,
 *  codeurl: String,
 *  transactionid: String, // define by WxPay callback
 *  querycount: 0,
 *  errorcode: String,
 *  errormessage: String
 * }
 * 
 */

var NORMAL_FIELDS = {
    tradeno: 1,
    name: 1,
    contact: 1,
    status: 1,
    detail: 1,
    memberid: 1,
    classid: 1,
    totalfee: 1,
    timestart: 1,
    errorcode: 1,
    errormessage: 1
};

const wxpay = bent('https://api.mch.weixin.qq.com/pay', 'POST', 200);

router.use(helper.checkTenant);

router.post('/', validateCreateOrderRequest, findMember, findClass, async function(req, res, next) {
    //TODO, find existing notpay order
    let order = {
        name: req.body.name,
        contact: req.body.contact,
        memberid: res.locals.member._id,
        classid: res.locals.class._id,
        status: "open",
        quantity: Number.parseInt(req.body.quantity),
        //TODO, remove hardcode title
        body: `大Q小q-绘本阅读`,
        detail: { goods_detail: [{ goods_name: res.locals.class.name }] },
        feetype: "CNY",
        totalfee: parseInt(req.body.totalfee),
        openid: req.body.openid,
        //clientip: req.ip.match(/\d+\.\d+\.\d+\.\d+/),
        clientip: req.ip,
        timestart: new Date(req.body.timeStart),
        timeexpire: new Date(req.body.timeExpire),
        tradetype: req.body.tradeType
    };
    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let orders = tenantDB.collection("orders");
        order.tradeno = await generateTradeNo(req.app.locals.ENV_DEVELOPMENT);
        let result = await orders.insertOne(order);
        // result.result is {"n":1,"ok":1}

        let prepay_id = await createUnifiedOrder(order, req.tenant.name);
        result = await orders.findOneAndUpdate(
            {
                _id: order._id,
                status: "open"
            },
            {
                $set: {
                    prepayid: prepay_id,
                    status: "notpay" // open ==> notpay
                }
            },
            { returnDocument: "after" }
        );
        // result.ok is 1
        console.log(`Create order ${order.tradeno} successfully`);
        return res.json(generateWxPayParams(result.value));
    } catch (error) {
        if (error instanceof UnifiedOrderError) {
            return next(error);
        } else {
            let err = new Error("Create order fails");
            err.innerError = error;
            return next(err);
        }
    }
});

router.post('/confirmPay', async function(req, res, next) {
    if (!req.body.hasOwnProperty("prepayid")) {
        let error = new Error("prepayid is not defined");
        error.status = 400;
        return next(error);
    }

    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let orders = tenantDB.collection("orders");
        let query = { prepayid: req.body.prepayid };
        let doc = await orders.findOne(query);
        // TODO, check query count
        // if (doc.querycount > 10) // skip
        if (doc.status === "notpay") {
            //query payment status
            let payResult = await queryOrder(doc);
            let status = payResult.error_type ? "notpay" : "success";
            let result = await orders.findOneAndUpdate({
                _id: doc._id,
                status: "notpay"
            }, {
                $set: {
                    status: status, // notpay ==> success
                    transactionid: payResult.transaction_id,
                    errorcode: payResult.error_type,
                    errormessage: payResult.error_msg
                },
                $inc: {
                    querycount: 1 // add query count
                }
            }, {
                returnDocument: "after"
            });
            doc = result.value;
            console.log(`Update order ${doc.tradeno} status from "notpay" to "${status}"`);
        } else {
            console.log(`Confirm order ${doc.tradeno} status as "${doc.status}"`);
        }
        if (doc.status === "success") {
            // add reservation
            await orderHelper.addReservationByOrder(doc, req.tenant.name);
        }
        return res.json(doc);
    } catch (error) {
        let err = new Error("Confirm payment fails");
        err.innerError = error;
        return next(err);
    }
});

router.use(helper.isAuthenticated);

router.get('/', async function(req, res, next) {
    let query = {};

    // support sorting
    let sort = {};
    let field = req.query.sort || "timestart"; // sort by "timestart" by default
    sort[field] = req.query.order == 'asc' ? 1 : -1;

    // query orders by keyword, search 'tradeno', 'name' or 'contact'
    let search = req.query.search || "";
    if (search) {
        // search both name and contact
        query['$or'] = [
            { 'tradeno': new RegExp(search, 'i') },
            { 'name': new RegExp(search, 'i') },
            { 'contact': new RegExp(search, 'i') }
        ];
    }

    // query orders by status
    let status = req.query.status || "";
    if (status) {
        query['status'] = status;
    }

    // support paginzation
    let skip = parseInt(req.query.offset) || 0;
    if (skip < 0) {
        console.warn(`page "offset" should be a positive integer, but get ${skip} in run-time`);
        skip = 0;
    }
    let pageSize = parseInt(req.query.limit) || 100;
    if (pageSize > 100 || pageSize < 0) {
        console.warn(`page "limit" should be a positive integer less than 100, but get ${pageSize} in run-time`);
        pageSize = 100;
    }

    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let orders = tenantDB.collection("orders");

        // get the total of all matched members
        let cursor = orders.find(query, { projection: NORMAL_FIELDS });
        let total = await cursor.count();

        // use find() instead of aggregate()
        let docs = await cursor.sort(sort).skip(skip).limit(pageSize).toArray();
        console.log(`find ${docs.length} orders from ${total} in total`);
        return res.json({
            total: total,
            rows: docs
        });
    } catch (error) {
        let err = new Error("Query order fails");
        err.innerError = error;
        return next(err);
    }
});

router.patch('/:orderID', helper.requireRole("admin"), function(req, res, next) {
    return next(new Error("Not Implemented"));
});

router.delete('/:orderID', helper.requireRole("admin"), async function(req, res, next) {
    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let orders = tenantDB.collection("orders");
        // only open status could be deleted
        let query = { _id: ObjectId(req.params.orderID), status: "open" };
        let doc = await orders.findOne(query);
        if (!doc) {
            let error = new Error(`Order doesn't exist or status is not "open"`);
            error.status = 400;
            return next(error);
        }
        let result = await orders.deleteOne(query);
        // result.result is {"n":1,"ok":1}
        console.log(`order ${doc.tradeno} is deleted with result: %j`, result.result);
        return res.json(result.result);
    } catch (error) {
        let err = new Error("Delete order fails");
        err.innerError = error;
        return next(err);
    }
});

function validateCreateOrderRequest(req, res, next) {
    let body = req.body, errorMsg = null;
    let requireFields = ['tenant', 'timeStart', 'timeExpire', 'tradeType', 'classid', 'name', 'contact', 'quantity', 'openid', 'totalfee'];
    let ok = requireFields.every(function(value, index, array) {
        if (!body.hasOwnProperty(value)) {
            errorMsg = `Missing param "${value}"`;
            return false;
        } else if (!body[value]) {
            errorMsg = `Param "${value}" is undefined`;
            return false;
        }
        return true;
    });
    if (!ok) {
        let error = new Error(errorMsg);
        error.status = 400;
        return next(error);
    }
    return next();
}

async function findMember(req, res, next) {
    try {
        let query = {
            name: req.body.name,
            contact: req.body.contact,
            openid: req.body.openid
        };

        let tenantDB = await db_utils.connect(req.tenant.name);
        let members = tenantDB.collection("members");
        let doc = await members.findOne(query, { projection: { name: 1 } });
        if (!doc) {
            let error = new Error("无法找到学员信息，请先注册/登录");
            error.status = 400;
            return next(error);
        }
        res.locals.member = doc;
        return next();
    } catch (error) {
        let err = new Error("Find member fails");
        err.innerError = error;
        return next(err);
    }
}

async function findClass(req, res, next) {
    try {
        let query = { _id: ObjectId(req.body.classid) };

        let tenantDB = await db_utils.connect(req.tenant.name);
        let classes = tenantDB.collection("classes");
        let doc = await classes.findOne(query, { projection: { name: 1, capacity: 1, booking: 1 } });
        if (!doc) {
            let error = new Error("无法找到课程信息，请重新预约");
            error.status = 400;
            return next(error);
        }
        let booking = doc.booking || [], remaining = doc.capacity;
        booking.forEach(element => {
            //TODO, check duplicate booking
            remaining -= element.quantity;
        });
        if (remaining <= 0) {
            let error = new Error("课程名额不足，无法预约");
            error.status = 400;
            return next(error);
        }
        res.locals.class = doc;
        return next();
    } catch (error) {
        let err = new Error("Find class session fails");
        err.innerError = error;
        return next(err);
    }
}

/**
 * https://pay.weixin.qq.com/wiki/doc/api/jsapi.php?chapter=9_2
 * @param {String} order 
 * @returns 
 */
async function queryOrder(order) {
    let params = {
        appid: credentials.AppID,
        mch_id: credentials.mch_id,
        nonce_str: util.generateNonceString(),
        out_trade_no: order.tradeno
    }
    let signCode = util.sign(params, credentials.apiKey);
    params.sign = signCode;
    const builder = new xml2js.Builder();

    console.debug("Query order with below params:");
    console.debug(params);
    let response = await wxpay("/orderquery", builder.buildObject(params));
    let responseText = await response.text();
    let parser = new xml2js.Parser({ trim: true, explicitArray: false, explicitRoot: false });
    let result = await parser.parseStringPromise(responseText);
    //TODO, validate sign
    console.debug("Receiving response from wechat pay:")
    console.debug(result);

    if (result.return_code === "SUCCESS" && result.result_code === "SUCCESS" && result.trade_state === "SUCCESS") {
        return {
            error_msg: result.trade_state_desc,
            error_type: "",
            transaction_id: result.transaction_id
        }
    } else if (result.return_code !== "SUCCESS") {
        // check the communication result
        return {
            error_msg: result.return_msg,
            error_type: "return_code",
            transaction_id: result.transaction_id
        }
    } else if (result.result_code !== "SUCCESS") {
        // chcek the business result
        return {
            error_msg: `[${result.err_code}]${result.err_code_des}`,
            error_type: "result_code",
            transaction_id: result.transaction_id
        }
    } else if (result.trade_state !== "SUCCESS") {
        // check the trade status
        return {
            error_msg: `[${result.trade_state}]${result.trade_state_desc}`,
            error_type: "trade_state",
            transaction_id: result.transaction_id
        }
    }
}

class UnifiedOrderError extends Error {
    constructor(message) {
        super(message);
        this.name = "UnifiedOrderError";
    }
}

/**
 * Refer to https://pay.weixin.qq.com/wiki/doc/api/jsapi.php?chapter=9_1
 * @param {Object} order 
 * @param {String} tenantName 
 * @returns 
 */
async function createUnifiedOrder(order, tenantName) {
    let params = {
        appid: credentials.AppID,
        mch_id: credentials.mch_id,
        nonce_str: util.generateNonceString(),
        body: order.body,
        out_trade_no: order.tradeno,
        attach: order._id.toHexString(), // pass the order _id as additional data
        fee_type: order.feetype,
        total_fee: order.totalfee,
        spbill_create_ip: order.clientip,
        time_start: formatTimeStamp(order.timestart),
        time_expire: formatTimeStamp(order.timeexpire),
        notify_url: "https://www.getbestlesson.com/api/wxpay/notify/" + tenantName, //TODO, hardcode
        trade_type: order.tradetype,
        product_id: order.classid.toHexString(),
        openid: order.openid
    }
    let signCode = util.sign(params, credentials.apiKey);
    params.sign = signCode;
    const builder = new xml2js.Builder();

    console.debug("Creating unified order with below params:");
    console.debug(params);
    let response = await wxpay("/unifiedorder", builder.buildObject(params));
    let responseText = await response.text();
    // explicitArray (default: true): Always put child nodes in an array if true; 
    // otherwise an array is created only if there is more than one.
    // explicitRoot (default: true): Set this if you want to get the root node in the resulting object.
    // trim (default: false): Trim the whitespace at the beginning and end of text nodes.
    let parser = new xml2js.Parser({ trim: true, explicitArray: false, explicitRoot: false });
    let result = await parser.parseStringPromise(responseText);
    console.debug("Receiving response from wechat pay:")
    console.debug(result);

    if (result.return_code === "SUCCESS" && result.result_code === "SUCCESS") {
        // return the pre-pay order ID if SUCCESS
        return result.prepay_id;
    } else if (result.return_code !== "SUCCESS") {
        // check the communication result
        throw new UnifiedOrderError(result.return_msg);
    } else if (result.result_code !== "SUCCESS") {
        // chcek the business result
        throw new UnifiedOrderError(`[${result.err_code}]${result.err_code_des}`);
    }
}

/**
 * Refer to https://pay.weixin.qq.com/wiki/doc/api/jsapi.php?chapter=7_7
 * @param {Object} order 
 * @returns 
 */
function generateWxPayParams(order) {
    let params = {
        appId: credentials.AppID,
        timeStamp: parseInt(new Date().getTime() / 1000).toString(),
        nonceStr: util.generateNonceString(),
        package: `prepay_id=${order.prepayid}`,
        signType: "MD5" // should be the same sign type with creating unified order
    };
    let signCode = util.sign(params, credentials.apiKey);
    params.paySign = signCode;
    return params;
}
/**
 * YYYYMMDD + 6-digit seq No. e.g. 20220321000055
 * @param {ObjectId} id 
 * @returns String
 */
async function generateTradeNo(developmentMode) {
    try {
        let d = new Date();
        // The trade No has to be unique across all tenants
        let configDB = await db_utils.connect("config");
        let settings = configDB.collection("settings");
        let result = await settings.findOneAndUpdate({
            _id: ObjectId("--order-id--")
        }, {
            $inc: { seq: 1 }
        }, {
            upsert: true, returnDocument: "after"
        });
        let seq = parseInt(result.value.seq % 1000000); // get 6 digits seq number
        let datePart = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
        return datePart * 1000000 + seq + (developmentMode ? "t" : "");
    } catch (error) {
        let err = new UnifiedOrderError("Fail to generate trade No.");
        err.innerError = error;
        return error;
    }
}

function formatTimeStamp(date) {
    if (date instanceof Date) {
        // format DateTime as '2022/03/20 13:07:51', caution: centOS runtime only return en-US locale string, which is "03/02/2022"
        // let res = date.toLocaleString('zh', { hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Shanghai' });
        // '2022/03/20 13:07:51' ==> '20220320130751'
        //return res.match(/\d/g).join("");
        return moment(date).format("YYYYMMDDHHmmss"); //"20220320130751" Beijing timezone
    }
    return "";
}

module.exports = router;
