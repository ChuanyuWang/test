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

router.get('/bytenant', async function(req, res, next) {
    //[Default] get the current year by month
    let year = (new Date()).getFullYear();
    let unit = 'month';
    if (req.query.hasOwnProperty("year")) {
        year = parseInt(req.query.year);
    }
    if (req.query.hasOwnProperty("unit")) {
        unit = req.query.unit;
    }

    try {
        let tenantDB = await db_utils.connect(LOGS_SCHEMA);
        let logs = tenantDB.collection("logList");

        let pipelines = [{
            $match: {
                "_timestamp": {
                    $gte: unit === 'year' ? new Date(0) : new Date(year, 0),
                    $lt: unit === 'year' ? new Date(9999, 0) : new Date(year + 1, 0)
                },
                "fromContentId": { $exists: true }
            }
        }, {
            $project: {
                //week: { $week: "$_timestamp" },
                month: { $month: "$_timestamp" },
                year: { $year: "$_timestamp" },
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
        let docs = await logs.aggregate(pipelines).toArray();

        console.log("analyze dlketang logs: ", docs ? docs.length : 0);
        res.json(docs);
    } catch (error) {
        return next(new InternalServerError("analyze dlketang logs fails", error));
    }
});

module.exports = router;
