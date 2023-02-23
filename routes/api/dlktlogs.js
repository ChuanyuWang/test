const express = require('express');
const router = express.Router();
const db_utils = require('../../server/databaseManager');
const { InternalServerError } = require('./lib/basis');
const moment = require('moment');
const { LOGS_SCHEMA } = require('../../server/logFetcher');

/** log item sample from dlketang logs
 * {
  "_id": {
    "$oid": "63ea60bb9c59c504f89d8b35"
  },
  "tenantId": 135219,
  "tenantName": "佛山Bella",
  "userId": 185755,
  "nickname": "麦雪仪",
  "behaviorTime": "2023-02-13 18:49:20",
  "platform": "客户端",
  "bhvType": 3,
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
  "_timestamp": {
    "$date": {
      "$numberLong": "1676285360000"
    }
  }
 * 
 */

router.use(function(req, res, next) {
    // only accessible to user admin@bqsq
    if (req.isAuthenticated() && req.user.username === "admin@bqsq") {
        next();
    } else {
        res.status(401).send('Unauthorized Request');
    }
});

router.get('/bycontent', async function(req, res, next) {
    //[Default] get the current year by month
    let this_month = moment().format("YYYY-MM");
    let startOfMonth, endOfMonth;
    if (req.query.hasOwnProperty("month")) {
        this_month = req.query.month;
    }
    startOfMonth = moment(this_month);
    endOfMonth = moment(this_month).endOf("month");

    try {
        let tenantDB = await db_utils.connect(LOGS_SCHEMA);
        let logs = tenantDB.collection("logList");

        let pipelines = [{
            $match: {
                "_timestamp": { // query one month
                    $gte: startOfMonth.toDate(),
                    $lte: endOfMonth.toDate()
                },
                "fromContentId": { $exists: true }
            }
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
                _id: { id: "$fromContentId", name: "$itemName" },
                total: {
                    $sum: 1
                }
            }
        }];
        let m_result = await logs.aggregate(pipelines).toArray();

        pipelines = [{
            $match: {
                "_timestamp": { // query whole year
                    $gte: startOfMonth.startOf("year").toDate(),
                    $lte: endOfMonth.endOf("year").toDate()
                },
                "fromContentId": { $exists: true }
            }
        }, {
            $project: {
                fromContentId: 1,
                itemName: 1
            }
        }, {
            $group: {
                _id: { id: "$fromContentId", name: "$itemName" },
                total: {
                    $sum: 1
                }
            }
        }];
        let y_result = await logs.aggregate(pipelines).toArray();

        let docs = combineData(m_result, y_result);

        console.log("analyze dlketang logs by content: ", docs ? docs.length : 0);
        res.json(docs);
    } catch (error) {
        return next(new InternalServerError("analyze dlketang logs by content fails", error));
    }
});

router.get('/bytenant', async function(req, res, next) {
    //[Default] get the current year by month
    let this_month = moment().format("YYYY-MM");
    let startOfMonth, endOfMonth;
    if (req.query.hasOwnProperty("month")) {
        this_month = req.query.month;
    }
    startOfMonth = moment(this_month);
    endOfMonth = moment(this_month).endOf("month");

    try {
        let tenantDB = await db_utils.connect(LOGS_SCHEMA);
        let logs = tenantDB.collection("logList");

        let pipelines = [{
            $match: {
                "_timestamp": { // query one month
                    $gte: startOfMonth.toDate(),
                    $lte: endOfMonth.toDate()
                },
                "fromContentId": { $exists: true }
            }
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
                _id: { id: "$tenantId", name: "$tenantName" },
                total: { $sum: 1 }
            }
        }];
        let m_result = await logs.aggregate(pipelines).toArray();

        pipelines = [{
            $match: {
                "_timestamp": { // query whole year
                    $gte: startOfMonth.startOf("year").toDate(),
                    $lte: endOfMonth.endOf("year").toDate()
                },
                "fromContentId": { $exists: true }
            }
        }, {
            $project: {
                tenantId: 1,
                tenantName: 1,
            }
        }, {
            $group: {
                _id: { id: "$tenantId", name: "$tenantName" },
                total: { $sum: 1 }
            }
        }];
        let y_result = await logs.aggregate(pipelines).toArray();

        let docs = combineData(m_result, y_result);

        console.log("analyze dlketang logs by tenant: ", docs ? docs.length : 0);
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
        let tenantDB = await db_utils.connect(LOGS_SCHEMA);
        let logs = tenantDB.collection("logList");

        let cursor = logs.find({
            "_timestamp": { // query one day
                $gte: startOfDay.toDate(),
                $lte: endOfDay.toDate()
            }
        });
        let docs = await cursor.toArray();

        console.log("query dlketang logs: ", docs ? docs.length : 0);
        res.json(docs);
    } catch (error) {
        return next(new InternalServerError("query dlketang logs fails", error));
    }
});

// combine data of year and month
function combineData(m_result, y_result) {
    let data = {};
    y_result.forEach(element => {
        data[element._id.id] = {
            name: element._id.name,
            year_total: element.total,
            month_total: 0
        };
    });
    m_result.forEach(element => {
        data[element._id.id].month_total = element.total;
    });
    let docs = [];
    for (let id in data) {
        docs.push(data[id]);
    }
    return docs;
}

module.exports = router;
