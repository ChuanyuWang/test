const express = require('express');
const router = express.Router();
const helper = require('../../helper');
const { ObjectId } = require('mongodb');
const moment = require('moment');
const { SchemaValidator } = require("./lib/schema_validator");
const { BadRequestError, RuntimeError } = require("./lib/basis");

const EPSILON = 2e-10;

const PaymentSchema = new SchemaValidator({
    type: {
        validator: value => {
            return ["offline", "wechat"].includes(value);
        },
        required: true
    },
    method: {
        validator: value => {
            return ["bankcard", "cash", "mobilepayment"].includes(value);
        },
        required: true
    },
    //amount: Number, // TODO
    contractId: { type: ObjectId, required: true },
    contractNo: { type: String, required: true },
    memberId: { type: ObjectId, required: true },
    payDate: { type: Date, required: true },
    comment: String
});

/**
 * {
 *  contractId: ObjectId,
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

const NORMAL_FIELDS = {

};

router.use(helper.isAuthenticated);

router.post('/', async function(req, res, next) {
    if (!PaymentSchema.createVerify(req.body)) {
        return next(new BadRequestError(`Fail to create payment due to invalid parameters`));
    }

    let payment = {
        contractId: ObjectId(req.body.contractId),
        contractNo: req.body.contractNo,
        memberId: ObjectId(req.body.memberId),
        type: req.body.type,
        method: req.body.method,
        amount: parseInt(req.body.amount),
        payDate: new Date(req.body.payDate),
        comment: req.body.comment
    };
    try {
        // Check the member exist
        let members = req.db.collection("members");
        let memberItem = await members.findOne({ _id: payment.memberId }, { projection: { _id: 1 } });
        if (memberItem == null) {
            return next(new ParamError(`member ${req.body.memberId} doesn't exist`));
        }
        // Check the contract exist and update the field "received"
        let contracts = req.db.collection("contracts");
        let contractItem = await contracts.findOne({
            _id: payment.contractId,
            status: { $in: ["open", "outstanding"] }
        }, { projection: { comments: 0 } });
        if (contractItem == null) {
            return next(new ParamError(`contract ${req.body.contractId} doesn't exist`));
        }

        // Update the status of contract is no outstanding, e.g. 
        // 0.3 < 0.1 + 0.2 ===> true
        // 0.3 < 0.1 + 0.2 + EPSILON ===> false
        let status = contractItem.received + payment.amount + EPSILON < contractItem.total - contractItem.discount - EPSILON ? "outstanding" : "paid";

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

        let payments = req.db.collection("payments");
        await payments.insertOne(payment);

        console.log(`pay ${payment.amount / 100} successfully to contract ${contractItem.serialNo}`);
        return res.json(payment);
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

    // query payments by contractId
    let contractId = req.query.contractId || "";
    if (contractId) {
        if (!ObjectId.isValid(req.query.contractId)) {
            return next(new ParamError(`Invalid contractId ${req.query.contractId}`));
        }
        query['contractId'] = ObjectId(req.query.contractId);
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
        let payments = req.db.collection("payments");
        // get the total of all matched payments
        let total = await payments.countDocuments(query);
        let docs = await payments.aggregate(pipelines).toArray();

        console.log(`Get ${docs.length} payments out of ${total}`);
        return res.json({
            total: total,
            rows: docs
        });
    } catch (error) {
        return next(new RuntimeError("Query payment fails", error));
    }
});

router.get('/:paymentID', async function(req, res, next) {
    try {
        let payments = req.db.collection("payments");
        let doc = await payments.findOne({
            _id: ObjectId(req.params.paymentID)
        }, {
            projection: NORMAL_FIELDS
        });

        console.log("find payment %j", doc);
        return res.json(doc);
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
        let payments = req.db.collection("payments");
        let query = { _id: ObjectId(req.params.paymentID) };
        let payment = await payments.findOne(query);
        if (!payment) {
            return next(new ParamError(`Payment ${req.params.paymentID} doesn't exist`));
        }

        // Check the contract exist and update the field "received"
        let contracts = req.db.collection("contracts");

        let contractItem = await contracts.findOne({
            _id: payment.contractId,
            status: { $nin: ["closed", "deleted"] }
        }, { projection: { comments: 0 } });

        if (contractItem == null) {
            return next(new ParamError(`Contract ${req.params.contractId} doesn't exist`));
        } else if (contractItem.status == "closed" || contractItem.status == "deleted") {
            return next(new ParamError(`Contract ${req.params.contractId} status is ${contractItem.status}, can't delete payment`));
        }

        // Update the status of contract is no outstanding
        let status = contractItem.received - payment.amount + EPSILON < contractItem.total - contractItem.discount - EPSILON ? "outstanding" : "paid";
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
        // result is {"acknowledged":true, "deletedCount":1}
        console.log(`undo payment ${payment.amount} from contract ${contractItem.serialNo}`);
        return res.json(result);
    } catch (error) {
        let err = new Error("Delete payment fails");
        err.innerError = error;
        return next(err);
    }
});

class ParamError extends Error {
    constructor(message) {
        super(message);
        this.name = "Invalid Parameter Error";
        this.status = 400;
    }
}

module.exports = router;
