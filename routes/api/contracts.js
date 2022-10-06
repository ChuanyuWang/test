const express = require('express');
const router = express.Router();
const helper = require('../../helper');
const db_utils = require('../../server/databaseManager');
const { ObjectId } = require('mongodb');
const moment = require('moment');
const mongojs = require('mongojs');

/**
 * {
 *  serialNo: "",
 *  status: "open|outstanding|paid|closed|deleted",
 *  type: "new|renewal|donate|import|export|refund"
 *  goods: String,
 *  goods_type: "type|package",
 *  category: "credit|limited|infinite",
 *  memberId: ObjectId,
 *  credit: Number,
 *  expendedCredit: Number,
 *  total: Number,
 *  discount: Number,
 *  //receivable: Number,
 *  received: Number,
 *  createDate: Date,
 *  effectiveDate: Date,
 *  expireDate: Date,
 *  signDate: Date,
 *  lastUpdate: Date,
 *  clientip: String,
 *  comments: [{
 *      {
 *          posted: Date,
 *          updated: Date,
 *          text: String,
 *          author: String
 *      }
 *  }]
 * }
 * 
 */

var NORMAL_FIELDS = {
    comments: 0
};

router.use(helper.isAuthenticated);

router.post('/', helper.requireRole("admin"), validateContract, async function(req, res, next) {
    let contract = {
        serialNo: "",
        status: "open",
        type: req.body.type,
        goods: req.body.goods,
        goods_type: req.body.goods_type,
        category: "credit", // TODO, remove hardcode category
        memberId: ObjectId(req.body.memberId),
        credit: req.body.credit,
        expendedCredit: req.body.expendedCredit || 0,
        total: parseInt(req.body.total),
        discount: parseInt(req.body.discount) || 0,
        //receivable: parseInt(req.body.receivable),
        received: 0,
        createDate: new Date(req.body.createDate),
        effectiveDate: req.body.effectiveDate ? new Date(req.body.effectiveDate) : null,
        expireDate: req.body.expireDate ? new Date(req.body.expireDate) : null,
        //clientip: req.ip.match(/\d+\.\d+\.\d+\.\d+/),
        clientip: req.ip,
        signDate: req.body.signDate ? new Date(req.body.signDate) : new Date(),
        lastUpdate: new Date()
    };
    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let contracts = tenantDB.collection("contracts");
        contract.serialNo = await generateContractNo(req.app.locals.ENV_DEVELOPMENT);
        let result = await contracts.insertOne(contract);
        // result.result is {"n":1,"ok":1}
        // result.ops is [{}] All the documents inserted
        // result.insertedCount is 1
        // result.insertedId is ObjectId, generated ObjectId for the insert operation

        console.log(`Create contract ${contract.serialNo} successfully`);
        return res.json(result.insertedId);
    } catch (error) {
        if (error instanceof ContractError) {
            return next(error);
        } else {
            let err = new Error("Create contract fails");
            err.innerError = error;
            return next(err);
        }
    }
});

router.get('/', async function(req, res, next) {
    let query = {};

    // support sorting
    let sort = {};
    let field = req.query.sort || "signDate"; // sort by "signDate" by default
    sort[field] = req.query.order == 'asc' ? 1 : -1;

    // query orders by keyword, search 'serialNo', 'name' or 'contact'
    let search = req.query.search || "";
    if (search) {
        // search both name and contact
        query['$or'] = [
            { 'serialNo': new RegExp(search, 'i') }
        ];
    }

    // query with date filter 'from' and 'to'
    // CAUTION: moment(undefined).isValid() return true
    if (moment(req.query.from || "").isValid() && moment(req.query.to || "").isValid()) {
        query.signDate = {
            $gte: new Date(req.query.from),
            $lt: new Date(req.query.to)
        };
    } else if (moment(req.query.from || "").isValid()) {
        query.signDate = { $gte: new Date(req.query.from) };
    } else if (moment(req.query.to || "").isValid()) {
        query.signDate = { $lt: new Date(req.query.to) };
    }

    // query orders by status
    let status = req.query.status || "";
    if (status) {
        query['status'] = status;
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
        let contracts = tenantDB.collection("contracts");
        // get the total of all matched contracts
        let cursor = contracts.find(query, { projection: NORMAL_FIELDS });
        let total = await cursor.count();
        let docs = await contracts.aggregate(pipelines).toArray();

        console.log(`Find ${docs.length} contracts from ${total} in total`);
        return res.json({
            total: total,
            rows: docs
        });
    } catch (error) {
        let err = new Error("Query contract fails");
        err.innerError = error;
        return next(err);
    }
});

router.get('/:contractID', function(req, res, next) {
    var contracts = req.db.collection("contracts");
    contracts.findOne({
        _id: mongojs.ObjectId(req.params.contractID)
    }, NORMAL_FIELDS, function(err, doc) {
        if (err) {
            var error = new Error("Get contract fails");
            error.innerError = err;
            return next(error);
        }
        console.log("find contract %j", doc);
        res.json(doc);
    });
});

router.patch('/:contractID', helper.requireRole("admin"), function(req, res, next) {
    return next(new Error("Not Implemented"));
});

router.delete('/:contractID', helper.requireRole("admin"), async function(req, res, next) {
    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let contracts = tenantDB.collection("contracts");
        // only open status could be deleted
        let query = { _id: ObjectId(req.params.contractID), status: "open" };
        let doc = await contracts.findOne(query);
        if (!doc) {
            let error = new Error(`Contract doesn't exist or status is not "open"`);
            error.status = 400;
            return next(error);
        }
        let result = await contracts.deleteOne(query);
        // result.result is {"n":1,"ok":1}
        console.log(`Contract ${doc.tradeno} is deleted with result: %j`, result.result);
        return res.json(result.result);
    } catch (error) {
        let err = new Error("Delete contract fails");
        err.innerError = error;
        return next(err);
    }
});

async function validateContract(req, res, next) {
    try {
        //TODO, validate all fields of contract
        let query = { _id: ObjectId(req.body.memberId) };

        let tenantDB = await db_utils.connect(req.tenant.name);
        let members = tenantDB.collection("members");
        let doc = await members.findOne(query, { projection: { name: 1, contact: 1 } });
        if (!doc) {
            let error = new Error("无法找到学员信息，请先注册/登录");
            error.status = 400;
            return next(error);
        }
        res.locals.member = doc;
        return next();
    } catch (error) {
        let err = new Error("Find member fails");
        err.innerError = error;
        return next(err);
    }
}

class ContractError extends Error {
    constructor(message) {
        super(message);
        this.name = "Contract API Error";
    }
}

/**
 * YYYYMMDD + 6-digit seq No. e.g. 20220321000055
 * @param {ObjectId} id 
 * @returns String
 */
async function generateContractNo(developmentMode) {
    try {
        let d = new Date();
        // The trade No has to be unique across all tenants
        let configDB = await db_utils.connect("config");
        let settings = configDB.collection("settings");
        let result = await settings.findOneAndUpdate({
            _id: ObjectId("-contract-id")
        }, {
            $inc: { seq: 1 }
        }, {
            upsert: true, returnDocument: "after"
        });

        let seq = parseInt(result.value.seq % 1000000); // get 6 digits seq number
        let datePart = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
        return datePart * 1000000 + seq + (developmentMode ? "t" : "");
    } catch (error) {
        let err = new ContractError("Fail to generate contract No.");
        err.innerError = error;
        throw err;
    }
}

module.exports = router;