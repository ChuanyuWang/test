const express = require('express');
const router = express.Router();
const helper = require('../../helper');
const db_utils = require('../../server/databaseManager');
const { ObjectId } = require('mongodb');
const moment = require('moment');
const mongojs = require('mongojs');

/**
 * {
 *  contractID: ObjectId,
 *  contractNo: String,
 *  memberId: ObjectId,
 *  type: "offline|wechat"
 *  method: "bankcard|cash|mobilepayment",
 *  amount: Number,
 *  payDate: Date,
 *  comment: String
 * }
 * 
 */

var NORMAL_FIELDS = {

};

router.use(helper.isAuthenticated);

router.post('/', helper.requireRole("admin"), validate, async function(req, res, next) {
    let payment = {
        contractId: ObjectId(req.body.contractId),
        contractNo: req.body.contractNo,
        memberId: ObjectId(req.body.memberId),
        type: req.body.type,
        method: req.body.method,
        amount: req.body.amount,
        payDate: new Date(req.body.payDate),
        comment: req.body.comment
    };
    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let contracts = tenantDB.collection("contracts");
        let contractItem = await contracts.findOne({ _id: payment.contractId }, { projection: { _id: 1 } });
        if (contractItem == null) {
            throw new Error(`contract ${req.body.contractId} doesn't exist`);
        }
        let members = tenantDB.collection("members");
        let memberItem = await members.findOne({ _id: payment.memberId }, { projection: { _id: 1 } });
        if (memberItem == null) {
            throw new Error(`member ${req.body.memberId} doesn't exist`);
        }

        let payments = tenantDB.collection("payments");
        let result = await payments.insertOne(payment);

        console.log(`Create payment successfully ${result.result}`);
        return res.json(result.ops[0]);
    } catch (error) {
        let err = new Error("Create contract fails");
        err.innerError = error;
        return next(err);
    }
});

router.get('/', async function(req, res, next) {
    let query = {};

    // support sorting
    let sort = {};
    let field = req.query.sort || "payDate"; // sort by "payDate" by default
    sort[field] = req.query.order == 'asc' ? 1 : -1;

    // query orders by keyword, search 'serialNo', 'name' or 'contact'
    let search = req.query.search || "";
    if (search) {
        // search both name and contact
        query['$or'] = [
            { 'contractNo': new RegExp(search, 'i') }
        ];
    }

    // query with date filter 'from' and 'to'
    // CAUTION: moment(undefined).isValid() return true
    if (moment(req.query.from || "").isValid() && moment(req.query.to || "").isValid()) {
        query.payDate = {
            $gte: new Date(req.query.from),
            $lt: new Date(req.query.to)
        };
    } else if (moment(req.query.from || "").isValid()) {
        query.payDate = { $gte: new Date(req.query.from) };
    } else if (moment(req.query.to || "").isValid()) {
        query.payDate = { $lt: new Date(req.query.to) };
    }

    // support paginzation
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

    let pipelines = [{
        $match: query
    }, {
        $sort: sort
    }, {
        $skip: skip
    }, {
        $limit: pageSize
    }, {
        $project: NORMAL_FIELDS
    }, {
        $lookup: {
            from: 'members',
            let: { memberID: "$memberId" },
            pipeline: [{
                $match: {
                    $expr: { $eq: ["$$memberID", "$_id"] }
                }
            }, {
                $project: { name: 1, contact: 1, _id: 0 }
            }],
            as: 'member'
        }
    }];

    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let payments = tenantDB.collection("payments");
        // get the total of all matched payments
        let cursor = payments.find(query, { projection: NORMAL_FIELDS });
        let total = await cursor.count();
        let docs = await payments.aggregate(pipelines).toArray();

        console.log(`Find ${docs.length} payments from ${total} in total`);
        return res.json({
            total: total,
            rows: docs
        });
    } catch (error) {
        let err = new Error("Query payment fails");
        err.innerError = error;
        return next(err);
    }
});

router.get('/:paymentID', async function(req, res, next) {
    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let payments = tenantDB.collection("payments");
        let doc = await payments.findOne({
            _id: mongojs.ObjectId(req.params.paymentID)
        }, {
            projection: NORMAL_FIELDS
        });

        console.log("find payment %j", doc);
        res.json(doc);
    } catch (error) {
        var err = new Error("Get payment fails");
        err.innerError = error;
        return next(err);
    }
});

router.patch('/:paymentID', helper.requireRole("admin"), function(req, res, next) {
    return next(new Error("Not Implemented"));
});

router.delete('/:paymentID', helper.requireRole("admin"), async function(req, res, next) {
    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let payments = tenantDB.collection("payments");
        let query = { _id: ObjectId(req.params.paymentID) };
        let doc = await payments.findOne(query);
        if (!doc) {
            let error = new Error(`Payment doesn't exist`);
            error.status = 400;
            return next(error);
        }
        let result = await payments.deleteOne(query);
        // result.result is {"n":1,"ok":1}
        console.log(`Payment ${req.params.paymentID} is deleted with result: %j`, result.result);
        return res.json(result.result);
    } catch (error) {
        let err = new Error("Delete payment fails");
        err.innerError = error;
        return next(err);
    }
});

async function validate(req, res, next) {
    try {
        //TODO, validate all fields of contract

        return next();
    } catch (error) {
        let err = new Error("validate peymant request body fails");
        err.innerError = error;
        return next(err);
    }
}

module.exports = router;
