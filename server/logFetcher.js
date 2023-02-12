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
    console.log(`fetching log...`);

    let log_db = await mongoClient.db(LOGS_SCHEMA);
    let tasks = log_db.collection("tasks");
    let doc = await tasks.findOne({ status: "in_progress" });

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
        //endTime: "2023-01-02",
        pageNo
    });

    try {
        console.log(`fetch listLog with "startTime=${startTime}&pageNo=${pageNo}"`);
        let res = await listLog(`?startTime=${startTime}&pageNo=${pageNo}`, null, header);

        // if success, pump up the pageNo by 1
        //TODO

        // if error, try in next task (10 times at most)
        //TODO

        // if no more data returned, mark task as completed
        //TODO

        console.log(res);
    } catch (error) {
        console.error(error);
    }

    isWorking = false;
    return true;
}

exports.repeatTask = async function(mongoClient, date) { }


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
