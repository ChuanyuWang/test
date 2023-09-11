const express = require('express');
const router = express.Router();
const db_utils = require('../../server/databaseManager');
const { InternalServerError, ParamError } = require('./lib/basis');
const moment = require('moment');
const { LOGS_SCHEMA } = require('../../server/logFetcher');
const util = require('./lib/util');

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
  "requestId": "10e116ee-a42d-4b82-8386-9007d5f09478"
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
    // only accessible to user admin@bqsq
    if (req.isAuthenticated() && req.user.username === "admin@bqsq") {
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
                    $gte: new Date("2023-03-01") // exclude dirty data before 2023-03-01
                },
                "fromContentId": { $exists: true }
            }
        }, {
            $group: {
                _id: { fromContentId: "$fromContentId", itemName: "$itemName" }
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
        duration = parseInt(req.query.duration || 0);
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
                _id: { id: "$fromContentId", name: "$itemName" },// TODO, group only by "$fromContentId"
                itemName: { $last: "$itemName" },
                total: { $sum: 1 }
            }
        }];
        let m_result = await logs.aggregate(pipelines).toArray();

        query["_timestamp"] = { // query whole year
            // exclude dirty data before 2023-03-01
            $gte: startOfMonth.year() === 2023 ? new Date("2023-03-01") : startOfMonth.startOf("year").toDate(),
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
                _id: { id: "$fromContentId", name: "$itemName" }, // TODO, group only by "$fromContentId"
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
        duration = parseInt(req.query.duration || 0);
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
            $gte: startOfMonth.year() === 2023 ? new Date("2023-03-01") : startOfMonth.startOf("year").toDate(),
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

router.get('/query', async function(req, res, next) {
    //[Default] query the data from yesterday
    let this_date = moment().subtract(1, 'day').format("YYYY-MM-DD");
    let startOfDay, endOfDay;
    if (req.query.hasOwnProperty("date")) {
        this_date = req.query.date;
    }
    startOfDay = moment(this_date);
    endOfDay = moment(this_date).endOf("day");

    try {
        let logs_db = await db_utils.connect(LOGS_SCHEMA);
        let logs = logs_db.collection("logList");

        let cursor = logs.find({
            "_timestamp": { // query one day
                $gte: startOfDay.toDate(),
                $lte: endOfDay.toDate()
            }
        });
        let docs = await cursor.toArray();

        console.log("query dlketang logs: %s", docs ? docs.length : 0);
        res.json(docs);
    } catch (error) {
        return next(new InternalServerError("query dlketang logs fails", error));
    }
});

router.patch('/tasks', async function(req, res, next) {
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
        data[element._id.id] = {
            name: element._id.name,
            year_total: element.total,
            month_total: 0
        };
    });
    m_result.forEach(element => {
        if (data[element._id.id])
            data[element._id.id].month_total = element.total;
    });
    let docs = [];
    for (let id in data) {
        docs.push(data[id]);
    }
    return docs;
}

module.exports = router;
