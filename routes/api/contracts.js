const express = require('express');
const router = express.Router();
const helper = require('../../helper');
const db_utils = require('../../server/databaseManager');
const { ObjectId } = require('mongodb');
const { RuntimeError, ParamError } = require('./lib/basis');
const { isEqual } = require('./lib/util');
const moment = require('moment');

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
 *  consumedCredit: Number,
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
 *      posted: Date,
 *      updated: Date,
 *      text: String,
 *      author: String
 *  }],
 *  history: [{
 *      date: Date,
 *      user: String,
 *      old: any,
 *      new: any,
 *      remark: String
 *  }],
 * }
 * 
 */

var NORMAL_FIELDS = {
    comments: 0,
    history: 0
};

router.use(helper.isAuthenticated);

router.post('/', validateContract, async function(req, res, next) {
    let contract = {
        serialNo: "",
        status: "open",
        type: req.body.type,
        goods: req.body.goods,
        goods_type: req.body.goods_type,
        category: "credit", // TODO, remove hardcode category
        memberId: ObjectId(req.body.memberId),
        credit: req.body.credit,
        consumedCredit: 0,
        expendedCredit: req.body.expendedCredit || 0,
        total: parseInt(req.body.total),
        discount: parseInt(req.body.discount) || 0,
        //receivable: parseInt(req.body.receivable), //not necessary
        received: 0,
        createDate: new Date(req.body.createDate),
        effectiveDate: req.body.effectiveDate ? new Date(req.body.effectiveDate) : null,
        expireDate: req.body.expireDate ? new Date(req.body.expireDate) : null,
        //clientip: req.ip.match(/\d+\.\d+\.\d+\.\d+/),
        clientip: req.ip,
        signDate: req.body.signDate ? new Date(req.body.signDate) : new Date(),
        lastUpdate: new Date(),
        comments: []
    };
    (req.body.comments || []).forEach(element => {
        contract.comments.push({
            // add posted date
            posted: new Date(),
            text: element.text,
            // add comment author
            author: req.user.username
        })
    });
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

    // query orders by member
    let memberId = req.query.memberId || "";
    if (memberId && ObjectId.isValid(memberId)) {
        query['memberId'] = ObjectId(memberId);
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

router.get('/:contractID', async function(req, res, next) {
    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let contracts = tenantDB.collection("contracts");
        let doc = await contracts.findOne({
            _id: ObjectId(req.params.contractID)
        }, {
            projection: NORMAL_FIELDS
        });

        if (!doc) {
            return next(new ParamError("contract doesn't exist"));
        }

        console.log("find contract %j", doc);
        res.json(doc);
    } catch (error) {
        return next(new RuntimeError("get contract fails", error));
    }
});

router.patch('/:contractID', helper.requireRole("admin"), async function(req, res, next) {
    try {
        //TODO, validate content body
        let tenantDB = await db_utils.connect(req.tenant.name);
        let contracts = tenantDB.collection("contracts");
        let doc = await contracts.findOne({
            _id: ObjectId(req.params.contractID)
        }, { projection: NORMAL_FIELDS });

        if (!doc) {
            return next(new ParamError("contract doesn't exist"));
        }

        let remark = req.body.comment || "";
        // remove comment before further proceed
        delete req.body.comment;
        let newValueSet = getUpdatedValueSet(doc, req.body);
        let historyItem = buildHistoryRecord(doc, newValueSet, remark);
        historyItem.user = req.user.username;

        let result = await contracts.findOneAndUpdate({
            _id: doc._id,
        }, {
            $set: newValueSet,
            $push: { history: historyItem }
        }, {
            projection: NORMAL_FIELDS,
            returnDocument: "after"
        });
        console.log("update contract by %j", newValueSet);
        res.json(result.value);
    } catch (error) {
        return next(new RuntimeError("modify contract fails", error));
    }
});

router.delete('/:contractID', helper.requireRole("admin"), async function(req, res, next) {
    //TODO, only contract without payments or classes can be deleted.
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

/**
 * {
 *    posted: Date,
 *    updated: Date,
 *    text: String,
 *    author: String
 * }
 */
router.post('/:contractID/comments', async function(req, res, next) {
    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let contracts = tenantDB.collection("contracts");

        if (!req.body.text || req.body.text.length <= 0) {
            return new ParamError("Missing param 'text'");
        }
        let comment = {
            // add posted date
            posted: new Date(),
            text: req.body.text,
            // add comment author
            author: req.user.username
        };
        let result = await contracts.findOneAndUpdate({
            _id: ObjectId(req.params.contractID)
        }, {
            $push: { comments: comment }
        }, {
            projection: { comments: 1 },
            returnDocument: "after"
        });

        if (!result) {
            return next(new ParamError("contract doesn't exist"));
        }

        console.log(`add comment ${req.body.text} to contract ${req.params.contractID}`);
        res.json(result.value.comments || []);
    } catch (error) {
        return next(new RuntimeError("add comment fails", error));
    }
});

router.get('/:contractID/comments', async function(req, res, next) {
    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let contracts = tenantDB.collection("contracts");
        let doc = await contracts.findOne({
            _id: ObjectId(req.params.contractID)
        }, {
            projection: { comments: 1 }
        });

        if (!doc) {
            return next(new ParamError("contract doesn't exist"));
        }

        console.log(`query comments from contract ${req.params.contractID}`);
        res.json(doc.comments || []);
    } catch (error) {
        return next(new RuntimeError("get contract's comments fails", error));
    }
});

router.get('/:contractID/history', async function(req, res, next) {
    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let contracts = tenantDB.collection("contracts");
        let doc = await contracts.findOne({
            _id: ObjectId(req.params.contractID)
        }, {
            projection: { history: 1 }
        });

        if (!doc) {
            return next(new ParamError("contract doesn't exist"));
        }

        console.log(`query history from contract ${req.params.contractID}`);
        res.json(doc.history || []);
    } catch (error) {
        return next(new RuntimeError("get contract's history fails", error));
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
            return next(new ParamError("member doesn't exist"));
        }
        return next();
    } catch (error) {
        return next(new RuntimeError("find member fails", error));
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

function buildHistoryRecord(oldDoc, newValueSet, remark) {
    let oldValueSet = {};
    for (let key in newValueSet) {
        if (oldDoc.hasOwnProperty(key)) {
            oldValueSet[key] = oldDoc[key];
        } else {
            oldValueSet[key] = null;
        }
    }
    return {
        date: new Date(),
        //user: req.user.username,
        old: oldValueSet,
        new: newValueSet,
        remark: remark
    };
}

function getUpdatedValueSet(oldDoc, newDoc) {
    let newValueSet = {};
    let newItem = newDoc || {};
    //TODO, validate request body according to schema
    if (newItem.hasOwnProperty("effectiveDate") && newItem.effectiveDate) {
        newItem.effectiveDate = new Date(newItem.effectiveDate);
    }
    if (newItem.hasOwnProperty("expireDate") && newItem.expireDate) {
        newItem.expireDate = new Date(newItem.expireDate);
    }
    for (let key in newItem) {
        if (oldDoc.hasOwnProperty(key) && isEqual(oldDoc[key], newItem[key])) {
            // skip update of this field when it's the same
            continue;
        }
        newValueSet[key] = newItem[key];
    }
    return newValueSet;
}

module.exports = router;
