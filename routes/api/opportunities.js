const express = require('express');
const router = express.Router();
const helper = require('../../helper');
const { ObjectId } = require('mongodb');
const { BadRequestError, RuntimeError, ParamError } = require('./lib/basis');

const NORMAL_FIELDS = {
    since: 1,
    name: 1,
    contact: 1,
    status: 1, //"open"|"closed"
    birthday: 1,
    source: 1,
    remark: 1
};

router.post('/', verifyCode, async function(req, res, next) {
    if (!req.tenant) {
        return next(new BadRequestError("tenant nod found"));
    }
    if (!req.body.name || !req.body.contact) {
        return next(ParamError("Missing param 'name' or 'contact'"));
    }

    let tenantDB = req.db;
    let query = {
        name: req.body.name,
        contact: req.body.contact
    };

    let newDoc = {
        since: new Date(),
        status: req.body.status || "open",
        name: req.body.name,
        contact: req.body.contact,
        birthday: new Date(req.body.birthday),
        remark: req.body.remark,
        source: req.body.source
    };

    try {
        const opportunities = tenantDB.collection("opportunities");
        let result = await opportunities.findOneAndUpdate(
            query,
            { $set: newDoc },
            { upsert: true, returnDocument: "after" }
        );

        if (result.value) {
            // {"ok":1,"lastErrorObject":{n:1,...},"value":{"index":0,"_id":"577a77651b298d2b68bfb1c6"}}
            console.log("opportunity is added with result %j", result.lastErrorObject);
            return res.json(result.lastErrorObject);
        } else {
            return next(new BadRequestError("Fail to add opportunity"));
        }
    } catch (error) {
        return next(new RuntimeError("Add opportunity fails with error", error));
    }
});

/// Below APIs are visible to authenticated users only
router.use(helper.isAuthenticated);

router.get('/', async function(req, res, next) {
    try {
        let sort = req.query.order == 'asc' ? 1 : -1;
        let offset = parseInt(req.query.offset) || 0;
        let limit = parseInt(req.query.limit) || 100;
        let search = req.query.search || "";

        let query = {};
        if (search) {
            // search both name and contact
            query['$or'] = [
                { 'name': new RegExp(search, 'i') },
                { 'contact': new RegExp(search, 'i') }
            ];
        }

        const opportunities = req.db.collection("opportunities");
        let cursor = await opportunities.find(query, {
            projection: NORMAL_FIELDS,
            sort: [["since", sort]]
        });
        let total = await cursor.count();
        let docs = await cursor.skip(offset).limit(limit).toArray();
        //console.log(`offset is ${offset}, limit is ${limit}, total is ${total}`);
        console.log(`Get ${docs.length} opportunities out of ${total}`);
        return res.json({
            total: total,
            rows: docs
        });
    } catch (error) {
        return next(new RuntimeError("find opportunities fails", error));
    }
});

router.patch('/:opportunityID', helper.requireRole("admin"), async function(req, res, next) {
    initDateField(req.body);

    try {
        const opportunities = req.db.collection("opportunities");
        let result = await opportunities.findOneAndUpdate(
            { _id: ObjectId(req.params.opportunityID) },
            { $set: req.body },
            { returnDocument: "after" }
        );
        if (!result.value) {
            return next(new BadRequestError(`opportunity ${req.params.opportunityID} not found`));
        }

        console.log("opportunity %s is updated by %j", req.params.opportunityID, req.body);
        return res.json(result.value);
    } catch (error) {
        return next(new RuntimeError(`Fail to update opportunity ${req.params.opportunityID}`, error));
    }
});

router.delete('/:opportunityID', helper.requireRole("admin"), function(req, res, next) {
    //TODO
    return next(new BadRequestError("Not Implemented"));
});

// make sure the datetime object is stored as ISODate
function initDateField(item) {
    let fields = ["birthday", "since"];
    for (let i = 0; i < fields.length; i++) {
        if (item && item.hasOwnProperty(fields[i])) {
            item[fields[i]] = new Date(item[fields[i]]);
        }
    }
}

async function verifyCode(req, res, next) {
    if (req.app.locals.ENV_DEVELOPMENT) {
        // skip code verification if it's development mode
        return next();
    }

    if (!req.tenant) {
        return next(new BadRequestError("tenant is not defined"));
    }

    if (!req.body.code || !req.body.contact) {
        return next(new ParamError("Missing param 'code' or 'contact'"));
    }

    try {
        let tenantDB = req.db;
        const sent_code_collection = tenantDB.collection("sent_code");
        let now = new Date();
        now.setMinutes(now.getMinutes() - 10);
        let doc = await sent_code_collection.findOne({
            phone: req.body.contact,
            code: req.body.code,
            sendDate: { $gte: now }
        });

        if (!doc) {
            return next(new BadRequestError("验证码无效，请重新提交"));
        } else {
            return next();
        }
    } catch (error) {
        return next(new RuntimeError("Get verify code fails", error));
    }
}

module.exports = router;
