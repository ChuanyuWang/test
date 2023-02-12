const credentials = require('../config.db');
const moment = require('moment');
const bent = require('bent');
const md5 = require('md5');

// https://console-docs.apipost.cn/preview/70212edd6cda96fd/27f60840581d036c?target_id=91e3a65c-3cc4-41d3-9d20-207634f1c33b
const listLog = bent('https://admin-api.dlketang.com:8080/api/openData/listLog', 'GET', 'json', 200);

const LOGS_SCHEMA = "dlketang_logs";
exports.LOGS_SCHEMA = LOGS_SCHEMA;

let isWorking = false;
exports.isWorking = function() {
    return isWorking;
}

exports.checkYesterdayLog = async function(mongoClient) {
    let log_db = await mongoClient.db(LOGS_SCHEMA);
    let tasks = log_db.collection("tasks");

    let yesterday = moment().subtract(1, 'days').startOf('day').toDate(); // set to 12:00 am today
    let doc = await tasks.findOne({ date: yesterday });
    if (doc) return;

    // insert a new task to fetch the log of yesterday
    await tasks.insertOne({
        date: yesterday,
        status: "in_progress",
        pageNo: 1,
        error_count: 0
    });
}

exports.startNextTask = async function(mongoClient) {
    isWorking = true;

    let log_db = await mongoClient.db(LOGS_SCHEMA);
    let tasks = log_db.collection("tasks");
    let doc = await tasks.findOne({ status: "in_progress" });
    if (!doc) {
        console.log(`no task to proceed`);
        isWorking = false;
        return false; // no more task to proceed
    }

    let startTime = moment(doc.date).format('YYYY-MM-DD');
    let pageNo = doc.pageNo;

    let header = {
        clientAppId: credentials.dlketang_appId,
        timestamp: Date.now(),
        nonce: generateNonceString(),
    };

    header.sign = sign({
        timestamp: header.timestamp,
        nonce: header.nonce,
        startTime,
        endTime: startTime,
        pageNo
    });

    try {
        console.log(`fetch listLog with "startTime=${startTime}&endTime=${startTime}&pageNo=${pageNo}"`);
        let res = await listLog(`?startTime=${startTime}&endTime=${startTime}&pageNo=${pageNo}`, null, header);
        res = res || {};
        if (res.code !== 0 || res.msg !== "success") {
            console.log(`receive error respond: code is ${res.code}, msg is ${res.msg}`);
            if (doc.error_count >= 9) {
                // stop the task when error count reach to 10
                await tasks.findOneAndUpdate({ _id: doc._id }, {
                    $inc: { error_count: 1 },
                    $set: { status: "error" }
                });
            } else {
                await tasks.findOneAndUpdate({ _id: doc._id }, {
                    $inc: { error_count: 1 }
                });
            }
            isWorking = false;
            return true;
        }

        await proceedData(mongoClient, doc, res);
    } catch (error) {
        console.error(error);
    }

    isWorking = false;
    return true;
}

async function proceedData(mongoClient, task, data) {
    let log_db = await mongoClient.db(LOGS_SCHEMA);
    let tasks = log_db.collection("tasks");

    let logItems = data.logList || [];
    // TODO, filter out needed logs
    if (logItems.length > 0) {
        try {
            let logList = log_db.collection("logList");
            let result = await logList.insertMany(logItems, { ordered: false });
            console.log(`insert log items with result %j`, result.result);
        } catch (error) {
            if (error.code === 11000) {
                // BulkWriteError: E11000 duplicate key error collection
                // reach to the page with duplicate data, stop task
                console.warn(`find duplicate log items at page ${task.pageNo}, stop task`);
                await tasks.findOneAndUpdate({ _id: task._id }, {
                    $set: { status: "duplicate" }
                });
                return;
            } else {
                throw error;
            }
        }
    }

    if (logItems.length === 0 || logItems.length < 50) {
        // reach to the last page with no data, complete task
        await tasks.findOneAndUpdate({ _id: task._id }, {
            $set: { status: "completed" }
        });
    } else {
        // need to fetch more log, pump up the page No
        await tasks.findOneAndUpdate({ _id: task._id }, {
            $inc: { pageNo: 1 }
        });
    }
}

function generateNonceString(length) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var maxPos = chars.length;
    var noceStr = "";
    for (var i = 0; i < (length || 32); i++) {
        noceStr += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return md5(noceStr).toLowerCase();
}

/**
 * Sign params with key as MD5
 * Refer to https://console-docs.apipost.cn/preview/70212edd6cda96fd/27f60840581d036c?target_id=f4d23989-c2ad-4338-9237-e25e40810065
 * Testing tool: https://console-docs.apipost.cn/preview/70212edd6cda96fd/27f60840581d036c?target_id=6e4b2e54-9967-459a-b9f1-0343cb101cde
 * @param {Object} params 
 * @param {String} key 
 * @returns 
 */
function sign(params) {
    let querystring = Object.keys(params).filter(function(key) {
        return params[key] !== undefined && params[key] !== '' && ['pfx', 'partner_key', 'sign', 'key'].indexOf(key) < 0;
    }).sort().map(function(key) {
        return key + params[key];
    }).join("");

    let signValue = md5(credentials.dlketang_appId + querystring + credentials.dlketang_appSecret).toLowerCase();
    //console.log(`signValue is ${signValue}`);
    return signValue;
}
