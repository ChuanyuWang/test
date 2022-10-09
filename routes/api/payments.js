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
        // Check the member exist
        let members = tenantDB.collection("members");
        let memberItem = await members.findOne({ _id: payment.memberId }, { projection: { _id: 1 } });
        if (memberItem == null) {
            return next(new ParamError(`member ${req.body.memberId} doesn't exist`));
        }
        // Check the contract exist and update the field "received"
        let contracts = tenantDB.collection("contracts");
        let contractItem = await contracts.findOne({
            _id: payment.contractId,
            status: { $in: ["open", "outstanding"] }
        }, { projection: { comments: 0 } });
        if (contractItem == null) {
            return next(new ParamError(`contract ${req.body.contractId} doesn't exist`));
        }

        // Update the status of contract is no outstanding
        let status = contractItem.received + payment.amount < contractItem.total - contractItem.discount ? "outstanding" : "paid";

        let updatedContractItem = await contracts.findOneAndUpdate({
            _id: payment.contractId,
            status: contractItem.status,
            received: contractItem.received,
            total: contractItem.total,
            discount: contractItem.discount
        }, {
            $inc: { received: payment.amount },
            $set: { status: status }
        }, {
            projection: { comments: 0 },
            returnDocument: "after"
        });

        if (updatedContractItem.value == null) {
            throw new Error(`contract ${contractItem.serialNo} is updated during incoming payment, please pay again`);
        }

        let payments = tenantDB.collection("payments");
        let result = await payments.insertOne(payment);

        console.log(`pay ${payment.amount / 100} successfully to contract ${contractItem.serialNo}`);
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

        console.log(`find ${docs.length} payments from ${total} in total`);
        return res.json({
            total: total,
            rows: docs
        });
    } catch (error) {
        let err = new Error("query payment fails");
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
        let payment = await payments.findOne(query);
        if (!payment) {
            return next(new ParamError(`Payment ${req.params.paymentID} doesn't exist`));
        }

        // Check the contract exist and update the field "received"
        let contracts = tenantDB.collection("contracts");

        let contractItem = await contracts.findOne({
            _id: payment.contractId
            //status: { $in: ["outstanding", "paid"] }
        }, { projection: { comments: 0 } });

        if (contractItem == null) {
            return next(new ParamError(`Contract ${req.params.contractId} doesn't exist`));
        } else if (contractItem.status == "closed" || contractItem.status == "deleted") {
            return next(new ParamError(`Contract ${req.params.contractId} status is ${contractItem.status}, can't delete payment`));
        }

        // Update the status of contract is no outstanding
        let status = contractItem.received - payment.amount < contractItem.total - contractItem.discount ? "outstanding" : "paid";
        let updatedContractItem = await contracts.findOneAndUpdate({
            _id: payment.contractId,
            status: contractItem.status,
            received: contractItem.received,
            total: contractItem.total,
            discount: contractItem.discount
        }, {
            $inc: { received: -payment.amount },
            $set: { status: status }
        }, {
            projection: { comments: 0 },
            returnDocument: "after"
        });

        if (updatedContractItem.value == null) {
            throw new Error(`contract ${contractItem.serialNo} is updated during deleting payment, please pay again`);
        }

        let result = await payments.deleteOne(query);
        // result.result is {"n":1,"ok":1}
        console.log(`undo payment ${payment.amount} from contract ${contractItem.serialNo}`);
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

class ParamError extends Error {
    constructor(message) {
        super(message);
        this.name = "Invalid Parameter Error";
        this.status = 400;
    }
}

module.exports = router;
