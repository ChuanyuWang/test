const express = require('express');
const router = express.Router();
const db_utils = require('../../server/databaseManager');
const { InternalServerError, ParamError } = require('./lib/basis');
const { hasRole } = require('../../helper');
const moment = require('moment');
const { LOGS_SCHEMA } = require('../../server/logFetcher');
const util = require('./lib/util');
const { ObjectId } = require('mongodb');

const LOG_BEGIN_DATE = new Date("2023-03-01 GMT+0800");

/** log item sample from dlketang logs
 * 
  "tenantId": 135219,
  "tenantName": "佛山Bella",
  "userId": 185755,
  "nickname": "麦雪仪",
  "behaviorTime": "2023-02-13 18:49:20",
  "platform": "客户端",
  "bhvType": 3, // 行为类型:1-打开页面，3-上课，4-备课
  "itemType": 1,
  "fromContentId": 50561932,
  "itemId": 50572381,
  "itemName": "好困好困的新年",
  "bhvDesc": "上课了「好困好困的新年」 2小时32秒",
  "duration": 7232,
  "addressDesc": "广东省佛山市南海区灯湖东路20号 113.70.216.7",
  "macAddress": "74:86:E2:14:E2:3F",
  "clientAppId": "75145625871",
  "requestId": "10e116ee-a42d-4b82-8386-9007d5f09478",
  "attendance": 0
 * 
 */

router.post('/play/query', util.validateSign, async function(req, res, next) {
    //[Default] get the current year by month
    let start_date = moment();
    let startOfDate, endOfDate, duration = 10; // default 10 minutes
    if (req.body.hasOwnProperty("query_date")) {
        if (!moment(req.body.query_date).isValid()) {
            return next(new ParamError("查询日期格式不正确", 1102));
        }
        start_date = moment(req.body.query_date);
    }
    if (req.body.hasOwnProperty("duration")) {
        // default is 10 mins
        duration = parseInt(req.body.duration || 10); // unit of duration is minutes
    }
    if (!req.body.hasOwnProperty("tenantId")) {
        return next(new ParamError("缺少参数tenantId", 1103));
    }

    startOfDate = moment(start_date).startOf("month");
    endOfDate = moment(start_date).endOf("month");

    let formatted_date = startOfDate.format("YYYY-MM");
    if (req.body.hasOwnProperty("query_type")) {
        if (req.body.query_type === "quarter") {
            startOfDate = moment(start_date).startOf("quarter");
            endOfDate = moment(start_date).endOf("quarter");
            formatted_date = startOfDate.format("YYYY/[Q]Q");
        } else if (req.body.query_type === "month") {
            // skip
        } else {
            return next(new ParamError("参数query_type不正确", 1104));
        }
    }

    let query = {
        "_timestamp": {
            $gte: startOfDate.toDate(),
            $lte: endOfDate.toDate()
        },
        "duration": {
            $gte: duration * 60, // convert to seconds
        },
        "fromContentId": { $exists: true },
        tenantId: req.body.tenantId || null
    };

    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let logs = logs_db.collection("logList");

        let pipelines = [{
            $match: query
        }, {
            $project: {
                //week: { $week: "$_timestamp" },
                //month: { $month: "$_timestamp" },
                //year: { $year: "$_timestamp" },
                duration: 1,
                tenantId: 1,
                tenantName: 1,
                fromContentId: 1,
                itemName: 1
            }
        }, {
            $group: {
                _id: "$tenantId",
                total: {
                    $sum: 1
                },
                tenantName: {
                    $last: "$tenantName" // only get the last tenant name to display
                }
            }
        }];
        let result = await logs.aggregate(pipelines).toArray();
        let total = result.length > 0 ? result[0].total : 0;
        let tenantName = result.length > 0 ? result[0].tenantName : null;
        console.log("tenant %s[%s] play %s times in %s", tenantName, query.tenantId, total, formatted_date);
        res.json({
            code: 0,
            message: "success",
            total: total
        });

    } catch (error) {
        return next(new InternalServerError(`query times of play of tenant ${req.body.tenantId} fails`, error));
    }
});

// below API are avaiable to internal user
router.use(function(req, res, next) {
    // only accessible to tenant bqsq-admin
    if (req.isAuthenticated() && req.user.tenant === "bqsq-admin") {
        next();
    } else {
        res.status(401).send('Unauthorized Request');
    }
});

router.get('/content/list', async function(req, res, next) {
    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let logs = logs_db.collection("logList");

        let pipelines = [{
            $match: {
                "_timestamp": {
                    $gte: LOG_BEGIN_DATE // exclude dirty data before 2023-03-01
                },
                "fromContentId": { $exists: true }
            }
        }, {
            $group: {
                _id: "$fromContentId",
                itemName: { $last: "$itemName" }
            }
        }];
        let docs = await logs.aggregate(pipelines).toArray();

        console.log("get list of content from dlketang logs: %s", docs ? docs.length : 0);
        res.json(docs);
    } catch (error) {
        return next(new InternalServerError("fail to get list of content from dlketang logs", error));
    }
});

router.get('/tenant/list', async function(req, res, next) {
    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let logs = logs_db.collection("logList");

        let pipelines = [{
            $match: {
                "fromContentId": { $exists: true }
            }
        }, {
            $group: {
                _id: "$tenantId",
                // get tenant name from the last element from group
                tenantName: { $last: "$tenantName" }
            }
        }];
        let docs = await logs.aggregate(pipelines).toArray();

        console.log("get list of tenant from dlketang logs: %s", docs ? docs.length : 0);
        res.json(docs);
    } catch (error) {
        return next(new InternalServerError("fail to get list of tenant from dlketang logs", error));
    }
});

router.get('/bycontent', async function(req, res, next) {
    //[Default] get the current year by month
    let this_month = moment().format("YYYY-MM");
    let startOfMonth, endOfMonth, duration = 0;
    if (req.query.hasOwnProperty("month")) {
        this_month = req.query.month;
    }
    if (req.query.hasOwnProperty("duration")) {
        duration = parseInt(req.query.duration) || 0;
    }

    startOfMonth = moment(this_month);
    endOfMonth = moment(this_month).endOf("month");

    let query = {
        "_timestamp": { // query one month
            $gte: startOfMonth.toDate(),
            $lte: endOfMonth.toDate()
        },
        "duration": {
            $gte: duration * 60, // convert to seconds
        },
        "fromContentId": { $exists: true }
    };

    if (req.query.tenantId) {
        query.tenantId = parseInt(req.query.tenantId);
    }

    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let logs = logs_db.collection("logList");

        let pipelines = [{
            $match: query
        }, {
            $project: {
                //week: { $week: "$_timestamp" },
                //month: { $month: "$_timestamp" },
                //year: { $year: "$_timestamp" },
                duration: 1,
                tenantName: 1,
                fromContentId: 1,
                itemName: 1
            }
        }, {
            $group: {
                _id: "$fromContentId",
                itemName: { $last: "$itemName" },
                total: { $sum: 1 }
            }
        }];
        let m_result = await logs.aggregate(pipelines).toArray();

        query["_timestamp"] = { // query whole year
            // exclude dirty data before 2023-03-01
            $gte: startOfMonth.year() === 2023 ? LOG_BEGIN_DATE : startOfMonth.startOf("year").toDate(),
            $lte: endOfMonth.endOf("year").toDate()
        };
        pipelines = [{
            $match: query
        }, {
            $project: {
                fromContentId: 1,
                itemName: 1
            }
        }, {
            $group: {
                _id: "$fromContentId",
                itemName: { $last: "$itemName" },
                total: { $sum: 1 }
            }
        }];
        let y_result = await logs.aggregate(pipelines).toArray();

        let docs = combineContentData(m_result, y_result);

        console.log("analyze dlketang logs by content: %s", docs ? docs.length : 0);
        res.json(docs);
    } catch (error) {
        return next(new InternalServerError("analyze dlketang logs by content fails", error));
    }
});

router.get('/bytenant', async function(req, res, next) {
    //[Default] get the current year by month
    let this_month = moment().format("YYYY-MM");
    let startOfMonth, endOfMonth, duration = 0;
    if (req.query.hasOwnProperty("month")) {
        this_month = req.query.month;
    }
    startOfMonth = moment(this_month);
    endOfMonth = moment(this_month).endOf("month");

    if (req.query.hasOwnProperty("duration")) {
        duration = parseInt(req.query.duration) || 0;
    }

    let query = {
        "_timestamp": { // query one month
            $gte: startOfMonth.toDate(),
            $lte: endOfMonth.toDate()
        },
        "duration": {
            $gte: duration * 60, // convert to seconds
        },
        "fromContentId": { $exists: true }
    };

    if (req.query.contentId) {
        query.fromContentId = parseInt(req.query.contentId);
    }

    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let logs = logs_db.collection("logList");

        let pipelines = [{
            $match: query
        }, {
            $project: {
                //week: { $week: "$_timestamp" },
                //month: { $month: "$_timestamp" },
                //year: { $year: "$_timestamp" },
                tenantId: 1,
                tenantName: 1
            }
        }, {
            $group: {
                _id: "$tenantId",
                // get tenant name from the last element from group
                tenantName: { $last: "$tenantName" },
                total: { $sum: 1 }
            }
        }];
        let m_result = await logs.aggregate(pipelines).toArray();

        query["_timestamp"] = { // query whole year
            // exclude dirty data before 2023-03-01
            $gte: startOfMonth.year() === 2023 ? LOG_BEGIN_DATE : startOfMonth.startOf("year").toDate(),
            $lte: endOfMonth.endOf("year").toDate()
        };
        pipelines = [{
            $match: query
        }, {
            $project: {
                tenantId: 1,
                tenantName: 1,
            }
        }, {
            $group: {
                _id: "$tenantId",
                // get tenant name from the last element from group
                tenantName: { $last: "$tenantName" },
                total: { $sum: 1 }
            }
        }];
        let y_result = await logs.aggregate(pipelines).toArray();

        let docs = combineTenantData(m_result, y_result);

        console.log("analyze dlketang logs by tenant: %s", docs ? docs.length : 0);
        res.json(docs);
    } catch (error) {
        return next(new InternalServerError("analyze dlketang logs by tenant fails", error));
    }
});

router.get('/bydate', async function(req, res, next) {
    //[Default] get the current year by month
    let queryDate = moment();
    let startOfDate, endOfDate, duration = 10; // default 10 minutes
    if (req.query.hasOwnProperty("year")) {
        queryDate = moment(req.query.year, "YYYY"); // "2023"
    }
    startOfDate = queryDate.startOf("year").toDate();
    endOfDate = queryDate.endOf("year").toDate();

    if (req.query.hasOwnProperty("duration")) {
        duration = parseInt(req.query.duration) || 0;
    }

    let query = {
        "_timestamp": {
            // // exclude dirty data before 2023-03-01
            $gte: queryDate.year() === 2023 ? LOG_BEGIN_DATE : startOfDate,
            $lte: endOfDate
        },
        "duration": {
            $gte: duration * 60, // convert to seconds
        },
        "fromContentId": { $exists: true }
    };

    if (req.query.contentId) {
        query.fromContentId = parseInt(req.query.contentId);
    }

    if (req.query.tenantId) {
        query.tenantId = parseInt(req.query.tenantId);
    }

    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let logs = logs_db.collection("logList");

        let pipelines = [{
            $match: query
        }, {
            $project: {
                //week: { $week: "$_timestamp" },
                month: { $month: "$_timestamp" },
                //year: { $year: "$_timestamp" },
                tenantId: 1,
                tenantName: 1
            }
        }, {
            $group: {
                _id: "$month",
                total: { $sum: 1 }
            }
        }];
        let docs = await logs.aggregate(pipelines).toArray();

        console.log("analyze dlketang logs by date: %s", docs ? docs.length : 0);
        res.json(docs);
    } catch (error) {
        return next(new InternalServerError("analyze dlketang logs by date fails", error));
    }
});

router.get('/query', async function(req, res, next) {
    let pipelines = [];
    let query = {
        fromContentId: { $exists: true },
        tenantId: req.query.tenantId ? parseInt(req.query.tenantId) : { $exists: true }
    };

    // Caution: the moment("2023-11-01") return the date according to system time zone,
    // it could be different date than expectation
    if (moment(req.query.from || "").isValid() && moment(req.query.to || "").isValid()) {
        query._timestamp = {
            $gte: new Date(req.query.from),
            $lt: new Date(req.query.to)
        };
    } else if (moment(req.query.from || "").isValid()) {
        query._timestamp = { $gte: new Date(req.query.from) };
    } else if (moment(req.query.to || "").isValid()) {
        query._timestamp = { $lt: new Date(req.query.to) };
    }

    if (req.query.hasOwnProperty("duration")) {
        query.duration = { $gte: parseInt(req.query.duration) || 0 };
    }

    pipelines.push({ $match: query });

    // support sorting
    if (req.query.sort) {
        let sort = {};
        let sortField = req.query.sort;
        sort[sortField] = req.query.order == 'asc' ? 1 : -1;
        pipelines.push({ $sort: sort });
    }

    // support pagination
    let skip = 0; // default value
    if (req.query.hasOwnProperty('offset')) {
        skip = parseInt(req.query.offset);
        if (skip < 0 || isNaN(skip)) {
            console.warn(`Page "offset" should be a positive integer, but get ${req.query.offset} in run-time`);
            skip = 0;
        }
    }
    pipelines.push({ $skip: skip });

    let pageSize = 100; // default value
    if (req.query.hasOwnProperty('limit')) {
        pageSize = parseInt(req.query.limit);
        if (pageSize > 100 || pageSize < 0 || isNaN(pageSize)) {
            console.warn(`Page "limit" should be a positive integer less than 100, but get ${req.query.limit} in run-time`);
            pageSize = 100;
        }
    }
    pipelines.push({ $limit: pageSize });

    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let logs = logs_db.collection("logList");
        let cursor = logs.find(query);
        let total = await cursor.count();
        let docs = await logs.aggregate(pipelines).toArray();

        console.log(`query ${docs.length} dlketang logs from ${total} in total`);
        return res.json({
            total: total,
            rows: docs
        });
    } catch (error) {
        return next(new InternalServerError("query dlketang logs fails", error));
    }
});

router.patch('/tasks', hasRole('admin'), async function(req, res, next) {
    let this_date = moment().subtract(1, 'day').startOf('day');
    if (!req.body.hasOwnProperty("date")) {
        return next(new ParamError());
    } else {
        this_date = moment(req.body.date).startOf('day');
    }

    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let tasks = logs_db.collection("tasks");

        let task = await tasks.findOneAndUpdate({
            date: this_date.toDate(),
        }, {
            $set: {
                status: "in_progress",
                pageNo: 1
            },
            $setOnInsert: {
                error_count: 0
            }
        }, {
            projection: { _id: 0 },
            returnDocument: "after",
            upsert: true
        });

        console.log("update fetch logs task: %j", task.value);
        res.json(task.value);
    } catch (error) {
        return next(new InternalServerError("update fetch logs task:", error));
    }
});

router.get('/prices', async function(req, res, next) {
    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let logs = logs_db.collection("logList");

        let pipelines = [{
            $match: {
                "_timestamp": {
                    $gte: LOG_BEGIN_DATE // exclude dirty data before 2023-03-01
                },
                "fromContentId": req.query.fromContentId ? parseInt(req.query.fromContentId) : { $exists: true }
            }
        }, {
            $group: {
                _id: "$fromContentId",
                itemName: { $last: "$itemName" }
            }
        }, {
            $lookup: {
                from: 'prices',
                let: { contentID: "$_id" },
                pipeline: [{
                    $match: {
                        $expr: {
                            $and: [{
                                $eq: ["$$contentID", "$_fromContentId"]
                            }, {
                                $gte: [new Date(), "$effective_date"]
                            }]
                        }
                    }
                }, {
                    $project: { _id: 0, price: 1, effective_date: 1 }
                }, {
                    $sort: { effective_date: -1 }
                }],
                as: 'prices'
            }
        }];
        let docs = await logs.aggregate(pipelines).toArray();

        console.log("get price of dlketang contents: %s", docs ? docs.length : 0);
        res.json(docs);
    } catch (error) {
        return next(new InternalServerError("fail to get prices of dlketang contents", error));
    }
});

router.get('/prices/:contentID', async function(req, res, next) {
    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let prices = logs_db.collection("prices");

        let cursor = prices.find({
            "_fromContentId": parseInt(req.params.contentID)
        });
        // TODO, sort by effective date
        let docs = await cursor.toArray();

        console.log(`query prices of content ${req.params.contentID}: %s`, docs ? docs.length : 0);
        res.json(docs);
    } catch (error) {
        return next(new InternalServerError(`fail to get prices of content ${req.params.contentID}`, error));
    }
});

/**
 * {_fromContentId: 50524832, price: 5000, modify_time: "2023-10-14T12:11:41.000Z", 
 * effective_date: "2023-10-14T12:11:41.000Z"}
 */
router.post('/prices', hasRole('admin'), async function(req, res, next) {
    let priceDoc = {
        _fromContentId: parseInt(req.body.contentId),
        price: parseInt(req.body.price ?? 0), // expect 0.01 ==> 1
        modify_time: new Date(),
        effective_date: new Date(req.body.effective_date)
    };
    if (isNaN(priceDoc.effective_date.valueOf()) || priceDoc.effective_date < new Date()) {
        return next(new ParamError(`Effective date ${req.body.effective_date} not valid`));
    }
    if (isNaN(priceDoc._fromContentId)) {
        return next(new ParamError(`contentID ${req.body.contentId} not valid`));
    }
    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let prices = logs_db.collection("prices");

        //let result = await prices.insertOne(priceDoc);
        let result = await prices.updateOne({
            _fromContentId: priceDoc._fromContentId,
            effective_date: priceDoc.effective_date
        }, {
            $setOnInsert: priceDoc
        }, {
            upsert: true
        });

        if (result.upsertedCount === 1) {
            console.log(`Add price of content ${priceDoc._fromContentId} to ${priceDoc.price / 100}`);
        } else {
            return next(new ParamError(`Effective date ${req.body.effective_date} already exist`));
        }
        // result.upsertedId is "{ index: 0, _id: 6552361ae21b20219729c74b }"
        res.json(result.upsertedId);
    } catch (error) {
        return next(new InternalServerError("fail to add price of dlketang content", error));
    }
});

router.delete('/prices/:Id', hasRole('admin'), async function(req, res, next) {
    if (!ObjectId.isValid(req.params.Id)) {
        return next(new ParamError(`Price Id ${req.params.Id} not valid`));
    }
    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let prices = logs_db.collection("prices");

        let query = {
            _id: ObjectId(req.params.Id),
            effective_date: { $gt: new Date() } // only not effective can be deleted
        };

        let result = await prices.deleteOne(query);
        // result.result is {"n":1,"ok":1}
        if (result.result.n === 1) {
            console.log(`Remove price of content ${req.body._fromContentId} successfully`);
        } else {
            return next(new ParamError(`Not able to delete effective price`));
        }

        res.json(result.result);
    } catch (error) {
        return next(new InternalServerError("fail to remove price", error));
    }
});

/**
 * {}
 */
router.get('/deposits', async function(req, res, next) {
    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let logs = logs_db.collection("logList");

        let pipelines = [{
            $match: {
                "fromContentId": { $exists: true },
                "tenantId": req.query.tenantId ? parseInt(req.query.tenantId) : { $exists: true }
            }
        }, {
            $group: {
                _id: "$tenantId",
                tenantName: { $last: "$tenantName" }
            }
        }, {
            $lookup: {
                from: 'deposits',
                let: { tenantID: "$_id" },
                pipeline: [{
                    $match: {
                        $expr: { $eq: ["$$tenantID", "$tenantId"] }
                    }
                }, {
                    $group: {
                        _id: null,
                        total: {
                            $sum: { $add: ["$received", "$donate"] }
                        }
                    },
                }, {
                    $project: { _id: 0 }
                }],
                as: 'deposits'
            }
        }];
        let docs = await logs.aggregate(pipelines).toArray();

        console.log("get deposits of dlketang tenants: %s", docs ? docs.length : 0);
        res.json(docs);
    } catch (error) {
        return next(new InternalServerError("fail to get deposits of dlketang tenants", error));
    }
});

router.get('/deposits/:tenantID', async function(req, res, next) {
    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let deposits = logs_db.collection("deposits");

        let cursor = deposits.find({
            "tenantId": parseInt(req.params.tenantID)
        });
        let docs = await cursor.toArray();

        console.log(`get deposits of dlketang tenant ${req.params.tenantID}: %s`, docs ? docs.length : 0);
        res.json(docs);
    } catch (error) {
        return next(new InternalServerError("fail to get deposits of dlketang tenants", error));
    }
});

/**
 * { 
 *    tenantId: Int,
 *    createDate: Date,   
 *    method: "bankcard|cash|mobilepayment",
 *    received: Number,
 *    donate: Number,
 *    payDate: Date,
 *    comment: String
 * }
 */
router.post('/deposits', hasRole('admin'), async function(req, res, next) {
    if (["cash", "bankcard", "mobilepayment"].indexOf(req.body.method) === -1) {
        return next(new ParamError(`pay method ${req.body.method} not valid`));
    }
    let depositDoc = {
        tenantId: parseInt(req.body.tenantId),
        create_date: new Date(),
        method: req.body.method,
        received: parseInt(req.body.received ?? 0), // expect 0.01 ==> 1
        donate: parseInt(req.body.donate ?? 0), // expect 0.01 ==> 1
        pay_date: new Date(req.body.pay_date),
        comment: req.body.comment ?? ""
    };
    if (isNaN(depositDoc.tenantId)) {
        return next(new ParamError(`tenant ID ${req.body.tenantId} not valid`));
    }
    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let deposits = logs_db.collection("deposits");

        let result = await deposits.insertOne(depositDoc);

        console.log(`add deposit to tenant ${depositDoc.tenantId} (received: ${depositDoc.received / 100} / donate: ${depositDoc.donate / 100})`);
        res.json(result.result);
    } catch (error) {
        return next(new InternalServerError("fail to add deposit to tenant", error));
    }
});

router.get('/costs', async function(req, res, next) {
    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let logs = logs_db.collection("logList");

        let begin_date = LOG_BEGIN_DATE;
        if (req.query.from) {
            begin_date = new Date(req.query.from);
        }

        let pipelines = [{
            $match: {
                fromContentId: { $exists: true },
                _timestamp: { $gte: begin_date },
                // more than 10 mins
                duration: { $gte: 600 },
                tenantId: req.query.tenantId ? parseInt(req.query.tenantId) : { $exists: true }
            }
        }, {
            $lookup: {
                from: 'prices',
                let: {
                    contentID: '$fromContentId',
                    play_date: '$_timestamp'
                },
                pipeline: [{
                    $match: {
                        $expr: {
                            $and: [{
                                $eq: ['$$contentID', '$_fromContentId']
                            }, {
                                $gte: ['$$play_date', '$effective_date']
                            }]
                        }
                    }
                }, {
                    $project: {
                        _id: 0,
                        price: 1,
                        effective_date: 1
                    }
                }, {
                    $sort: { effective_date: -1 }
                }],
                as: 'prices'
            }
        }, {
            $addFields: {
                first_price: {
                    $ifNull: [{
                        $arrayElemAt: ['$prices.price', 0]
                    }, 0]
                },
                times: {
                    $ceil: { $divide: ['$duration', 3599] }
                }
            }
        }, {
            $group: {
                _id: '$tenantId',
                total: {
                    $sum: {
                        $multiply: ['$first_price', '$times']
                    }
                },
                play: { $sum: 1 },
                attendance: { $sum: '$attendance' },
                tenantName: { $last: '$tenantName' }
            }
        }, {
            $lookup: {
                from: 'deposits',
                let: { tenantID: '$_id' },
                pipeline: [{
                    $match: {
                        $expr: {
                            $eq: ['$$tenantID', '$tenantId']
                        }
                    }
                }, {
                    $project: {
                        _id: 0,
                        received: 1,
                        donate: 1
                    }
                }],
                as: 'deposit'
            }
        }, {
            $addFields: {
                deposit: {
                    $add: [
                        { $sum: '$deposit.received' },
                        { $sum: '$deposit.donate' }
                    ]
                }
            }
        }];
        let docs = await logs.aggregate(pipelines).toArray();

        console.log("get cost of dlketang tenants: %s", docs ? docs.length : 0);
        res.json(docs);
    } catch (error) {
        return next(new InternalServerError("fail to get cost of dlketang tenants", error));
    }
});

/**
 * combine data of year and month, m_result and y_result have the same structure
 * {_id: integer, tenantName: String, total: integer}
 * @param {*} m_result 
 * @param {*} y_result 
 * @returns {Object} the combined data with structure [{id: integer, name:String, year_total: integer, month_total:integer}]
 */
function combineTenantData(m_result, y_result) {
    let data = {};
    y_result.forEach(element => {
        data[element._id] = {
            id: element._id,
            name: element.tenantName,
            year_total: element.total,
            month_total: 0
        };
    });
    m_result.forEach(element => {
        if (data[element._id])
            data[element._id].month_total = element.total;
    });
    let docs = [];
    for (let id in data) {
        docs.push(data[id]);
    }
    return docs;
}

function combineContentData(m_result, y_result) {
    let data = {};
    y_result.forEach(element => {
        data[element._id] = {
            contentId: element._id,
            name: element.itemName,
            year_total: element.total,
            month_total: 0
        };
    });
    m_result.forEach(element => {
        if (data[element._id])
            data[element._id].month_total = element.total;
    });
    let docs = [];
    for (let id in data) {
        docs.push(data[id]);
    }
    return docs;
}

module.exports = router;
