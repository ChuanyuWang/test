const express = require('express');
const router = express.Router();
const db_utils = require('../../server/databaseManager');
const { ObjectId } = require('mongodb');
const { RuntimeError, ParamError, BaseError, BadRequestError } = require('./lib/basis');
const moment = require('moment');
const { SchemaValidator } = require("./lib/schema_validator");
const util = require('./lib/util');

const NoticeSchema = new SchemaValidator({
    status: {
        validator: value => {
            return ["open", "publish", "deleted"].includes(value);
        },
        editable: true
    },
    title: { type: String, required: true, editable: true },
    content: { type: String, required: true, editable: true },
    issue_time: { type: Date },
    create_time: { type: Date },
    modify_by: { type: String }
});


var NORMAL_FIELDS = {
    dummy: 0
};

// query publish notices for clients
router.post('/query', validateSign, async function(req, res, next) {
    let query = {};

    // support sorting
    let sort = {};
    let sortField = req.body.sort || "issue_time"; // sort by "issue_time" by default
    sort[sortField] = req.body.order == 'asc' ? 1 : -1;

    // query with date filter 'issue_time'
    // CAUTION: moment(undefined).isValid() return true
    if (moment(req.body.issue_time || "").isValid()) {
        query.issue_time = { $gte: new Date(req.body.issue_time) };
    }

    // query notices by status
    query['status'] = "publish";

    // support pagination
    let skip = parseInt(req.body.offset) || 0;
    if (skip < 0) {
        console.warn(`Page "offset" should be a positive integer, but get ${skip} in run-time`);
        skip = 0;
    }
    let pageSize = parseInt(req.body.limit) || 100;
    if (pageSize > 100 || pageSize < 0) {
        console.warn(`Page "limit" should be a positive integer less than 100, but get ${pageSize} in run-time`);
        pageSize = 100;
    }

    let pipelines = [
        { $match: query },
        { $sort: sort },
        { $skip: skip },
        { $limit: pageSize },
        { $project: NORMAL_FIELDS }
    ];

    try {
        let config_db = await db_utils.connect("config");
        let notices = config_db.collection("notices");
        let cursor = notices.find(query, { projection: NORMAL_FIELDS });
        let total = await cursor.count();
        let docs = await notices.aggregate(pipelines).toArray();

        console.log(`Find ${docs.length} publish notices from ${total} in total`);
        return res.json({
            code: 0,
            message: "success",
            total: total,
            rows: docs
        });
    } catch (error) {
        let err = new Error("Query publish notice fails");
        err.innerError = error;
        return next(err);
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

router.post('/', validateNotice, async function(req, res, next) {
    let notice = {
        status: "open",
        title: req.body.title,
        content: req.body.content,
        create_time: new Date(),
        issue_time: null,
        modify_by: req.user.username
    };
    try {
        let config_db = await db_utils.connect("config");
        let notices = config_db.collection("notices");
        let result = await notices.insertOne(notice);
        // result.result is {"n":1,"ok":1}
        // result.ops is [{}] All the documents inserted
        // result.insertedCount is 1
        // result.insertedId is ObjectId, generated ObjectId for the insert operation

        console.log(`Create notice ${notice.title} successfully`);
        return res.json(result.insertedId);
    } catch (error) {
        if (error instanceof BaseError) {
            return next(error);
        } else {
            let err = new Error("Create notice fails");
            err.innerError = error;
            return next(err);
        }
    }
});

router.get('/', async function(req, res, next) {
    let query = {};

    // support sorting
    let sort = {};
    let sortField = req.query.sort || "create_time"; // sort by "create_time" by default
    sort[sortField] = req.query.order == 'asc' ? 1 : -1;

    // query notices by keyword, search 'title' and 'content'
    let search = req.query.search || "";
    if (search) {
        try {
            query['$or'] = [
                { 'title': new RegExp(search, 'i') },
                { 'content': new RegExp(search, 'i') }
            ];
        } catch (error) {
            // e.g. search is "Ying\/:"
            console.warn(error.message);
            // query a dummy field "error" to ensure no result found
            query["error"] = error.message;
        }
    }

    // query with date filter 'from' and 'to'
    // CAUTION: moment(undefined).isValid() return true
    if (moment(req.query.from || "").isValid() && moment(req.query.to || "").isValid()) {
        query.issue_time = {
            $gte: new Date(req.query.from),
            $lt: new Date(req.query.to)
        };
    } else if (moment(req.query.from || "").isValid()) {
        query.issue_time = { $gte: new Date(req.query.from) };
    } else if (moment(req.query.to || "").isValid()) {
        query.issue_time = { $lt: new Date(req.query.to) };
    }

    // query notices by status
    let status = req.query.status || "";
    if (status) {
        query['status'] = status;
    } else {
        query['status'] = { $ne: "deleted" };
    }

    // support pagination
    let skip = parseInt(req.query.offset) || 0;
    if (skip < 0) {
        console.warn(`Page "offset" should be a positive integer, but get ${skip} in run-time`);
        skip = 0;
    }
    let pageSize = parseInt(req.query.limit) || 100;
    if (pageSize > 100 || pageSize < 0) {
        console.warn(`Page "limit" should be a positive integer less than 100, but get ${pageSize} in run-time`);
        pageSize = 100;
    }

    let pipelines = [
        { $match: query },
        { $sort: sort },
        { $skip: skip },
        { $limit: pageSize },
        { $project: NORMAL_FIELDS }
    ];

    try {
        let config_db = await db_utils.connect("config");
        let notices = config_db.collection("notices");
        let cursor = notices.find(query, { projection: NORMAL_FIELDS });
        let total = await cursor.count();
        let docs = await notices.aggregate(pipelines).toArray();

        console.log(`Find ${docs.length} notices from ${total} in total`);
        return res.json({
            total: total,
            rows: docs
        });
    } catch (error) {
        let err = new Error("Query notice fails");
        err.innerError = error;
        return next(err);
    }
});

router.patch('/:noticeID', async function(req, res, next) {
    try {
        if (!ObjectId.isValid(req.params.noticeID)) return next(new BadRequestError(`notice ID ${req.params.noticeID} is invalid`));

        //TODO, validate content body
        if (!NoticeSchema.modifyVerify(req.body)) {
            return next(new BadRequestError("Fail to update notice due to bad request body"));
        }

        let config_db = await db_utils.connect("config");
        let notices = config_db.collection("notices");
        let doc = await notices.findOne({
            _id: ObjectId(req.params.noticeID),
            // can't edit deleted and closed notice
            status: { $in: ["open"] }
        }, { projection: NORMAL_FIELDS });

        if (!doc) {
            return next(new ParamError("不能修改已经发布或作废的公告"));
        }

        // update modify_by field
        req.body.modify_by = req.user.username;

        if (req.body.status === "publish" && doc.status === "open") {
            // update issue_time field when publishing
            req.body.issue_time = new Date();
        }

        let result = await notices.findOneAndUpdate({
            _id: doc._id,
        }, {
            $set: req.body
        }, {
            projection: NORMAL_FIELDS,
            returnDocument: "after"
        });
        console.log("update notice by %j", req.body);
        res.json(result.value);
    } catch (error) {
        return next(new RuntimeError("modify notice fails", error));
    }
});

router.delete('/:noticeID', async function(req, res, next) {
    try {
        if (!ObjectId.isValid(req.params.noticeID)) return next(new BadRequestError(`notice ID ${req.params.noticeID} is invalid`));
        let config_db = await db_utils.connect("config");
        let notices = config_db.collection("notices");
        // only open status could be deleted
        let query = {
            _id: ObjectId(req.params.noticeID),
            status: { $in: ["open", "publish"] }
        };
        let doc = await notices.findOne(query);

        if (!doc) return next(new BadRequestError("公告不存或已经删除"));

        let result = await notices.findOneAndUpdate({
            _id: doc._id,
        }, {
            $set: { status: "deleted" }
        }, {
            projection: NORMAL_FIELDS,
            returnDocument: "after"
        });

        console.log(`notice ${doc._id} is deleted with result: %j`, result.lastErrorObject);
        return res.json(result.value);
    } catch (error) {
        let err = new Error("Delete notice fails");
        err.innerError = error;
        return next(err);
    }
});

async function validateNotice(req, res, next) {
    try {
        if (!NoticeSchema.createVerify(req.body)) {
            return next(new BadRequestError("Fail to create notice due to bad request body"));
        }
        return next();
    } catch (error) {
        return next(new RuntimeError("find member fails", error));
    }
}

async function validateSign(req, res, next) {
    try {
        let query = req.body || {};
        if (!query.nonce_str) return next(new BadRequestError("缺少随机字符串", 1002));
        if (!query.user_id) return next(new BadRequestError("缺少调用者ID", 1003));
        if (!query.sign) return next(new BadRequestError("缺少签名", 1004));
        let key = util.getKey(query.user_id);
        if (!key) return next(new BadRequestError("缺少密钥", 1005));

        if (req.app.locals.ENV_DEVELOPMENT) {
            // skip verify sign if it's development mode
            return next();
        }

        let sign = query.sign;
        delete query.sign;
        if (sign !== util.sign(query, key)) return next(new BadRequestError("签名不一致", 1001));

        return next();
    } catch (error) {
        return next(new RuntimeError("Fail to validate sign", error));
    }
}

module.exports = router;
