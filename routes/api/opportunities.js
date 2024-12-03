var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var helper = require('../../helper');
const db_utils = require('../../server/databaseManager');
const { BadRequestError } = require('./lib/basis');

var NORMAL_FIELDS = {
    since: 1,
    name: 1,
    contact: 1,
    status: 1, //"open"|"closed"
    birthday: 1,
    source: 1,
    remark: 1
};

router.post('/', verifyCode, function(req, res, next) {
    if (!req.tenant) {
        let error = new Error("tenant is not defined");
        error.status = 400;
        return next(error);
    }
    if (!req.body.name || !req.body.contact) {
        res.status(400).send("Missing param 'name' or 'contact'");
        return;
    }

    let tenantDB = req.db;
    var query = {
        name: req.body.name,
        contact: req.body.contact
    };

    var newDoc = {
        since: new Date(),
        status: req.body.status || "open",
        name: req.body.name,
        contact: req.body.contact,
        birthday: new Date(req.body.birthday),
        remark: req.body.remark,
        source: req.body.source
    };

    var opportunities = tenantDB.collection("opportunities");
    //if the same opportunity is posted twice, the last one will override the previous
    opportunities.updateOne(query, { $set: newDoc }, { upsert: true }, function(err, result) {
        if (err) {
            var error = new Error('Add opportunity fails with error');
            error.innerError = err;
            return next(error);
        } else {
            // result is object, e.g.
            // {"ok":1,"nModified":0,"n":1,"upserted":[{"index":0,"_id":"577a77651b298d2b68bfb1c6"}]}
            console.log("opportunity is added with result %j", result);
            res.json(result);
        }
    });
});

/// Below APIs are visible to authenticated users only
router.use(helper.isAuthenticated);

router.get('/', async function(req, res, next) {
    //let opportunities = req.db.collection("opportunities");
    try {
        let sort = req.query.order == 'asc' ? 1 : -1;
        let offset = parseInt(req.query.offset) || 0;
        let limit = parseInt(req.query.limit) || 100;
        let search = req.query.search || "";

        let tenantDB = await db_utils.connect(req.tenant.name);
        let opportunities = tenantDB.collection("opportunities");

        let query = {};
        if (search) {
            // search both name and contact
            query['$or'] = [
                { 'name': new RegExp(search, 'i') },
                { 'contact': new RegExp(search, 'i') }
            ];
        }
        let cursor = await opportunities.find(query, {
            projection: NORMAL_FIELDS,
            sort: [["since", sort]]
        });
        let total = await cursor.count();
        let docs = await cursor.skip(offset).limit(limit).toArray();
        //console.log(`offset is ${offset}, limit is ${limit}, total is ${total}`);
        console.log("find opportunities: ", docs ? docs.length : 0);
        return res.json({
            total: total,
            rows: docs
        });
    } catch (err) {
        var error = new Error("find opportunities fails");
        error.innerError = err;
        return next(error);
    }
});

router.patch('/:opportunityID', helper.requireRole("admin"), function(req, res, next) {
    var opportunities = req.db.collection("opportunities");

    initDateField(req.body);

    opportunities.update({
        _id: mongojs.ObjectId(req.params.opportunityID)
    }, {
        $set: req.body
    }, function(err, result) {
        if (err) {
            res.status(500).json({
                'err': err
            });
            return;
        }
        if (result.n == 1) {
            console.log("opportunity %s is updated by %j", req.params.opportunityID, req.body);
            return res.json(result);
        } else {
            return next(new BadRequestError(`opportunity ${req.params.opportunityID} not found`));
        }
    });
});

router.delete('/:opportunityID', helper.requireRole("admin"), function(req, res, next) {
    //TODO
    return next(new BadRequestError("Not Implemented"));
});

// make sure the datetime object is stored as ISODate
function initDateField(item) {
    var fields = ["birthday", "since"];
    for (var i = 0; i < fields.length; i++) {
        if (item && item.hasOwnProperty(fields[i])) {
            item[fields[i]] = new Date(item[fields[i]]);
        }
    }
}

function verifyCode(req, res, next) {
    if (req.app.locals.ENV_DEVELOPMENT) {
        // skip code verification if it's development mode
        return next();
    }

    if (!req.tenant) {
        let error = new Error("tenant is not defined");
        error.status = 400;
        return next(error);
    }

    if (!req.body.code || !req.body.contact) {
        res.status(400).send("Missing param 'code' or 'contact'");
        return;
    }

    let tenantDB = req.db;

    var sent_code_collection = tenantDB.collection("sent_code");
    let now = new Date();
    now.setMinutes(now.getMinutes() - 10);
    sent_code_collection.findOne({
        phone: req.body.contact,
        code: req.body.code,
        sendDate: { $gte: now }
    }, function(err, doc) {
        if (err) {
            var error = new Error('Get verify code fails');
            error.innerError = err;
            return next(error);
        }
        if (!doc) {
            var err = new Error("验证码无效，请重新提交");
            err.status = 400;
            return next(err);
        }
        return next();
    });
}

module.exports = router;
