const express = require('express');
const router = express.Router();
const helper = require('../../helper');
const { ObjectId } = require('mongodb');
const { BadRequestError, ParamError, BaseError, RuntimeError } = require('./lib/basis');

/**
 * {
 *  name: String,
 *  contact: String,
 *  birthday: Date,
 *  note: String,
 *  source: "manual|book", // default is "manual"
 *  status: "active|inactive",
 *  since: Date,
 *  openid: String,
 *  membership: [
 *      {
 *          type: "ALL|LIMITED",
 *          room: [],
 *          expire: Date,
 *          credit: Number
 *      }
 *  ],
 *  history: [
 *      {
 *          date: Date,
 *          user: String,
 *          target: "membership.0.type|credit",
 *          old: any,
 *          new: any,
 *          remark: String
 *      }
 *  ],
 *  comments: [
 *      {
 *          posted: Date,
 *          updated: Date,
 *          text: String,
 *          author: String
 *      }
 *  ]
 * }
 * 
 */

const NORMAL_FIELDS = {
    status: 1,
    since: 1,
    name: 1,
    contact: 1,
    birthday: 1,
    expire: 1,
    note: 1,
    source: 1,
    membership: 1,
    openid: 1
};

router.post('/validate', async function(req, res, next) {
    if (!req.tenant) {
        return next(new ParamError("tenant is not defined"));
    }

    let query = {};
    if (req.body.hasOwnProperty('name') && req.body.hasOwnProperty('contact')) {
        query['name'] = req.body.name;
        query['contact'] = req.body.contact;
    } else {
        return next(new ParamError("Missing param 'name' or 'contact'"));
    }

    try {
        const members = req.db.collection("members");
        let doc = await members.findOne(query, { projection: NORMAL_FIELDS });
        console.log("validate member: %j", doc);

        const contracts = req.db.collection("contracts");
        if (doc) {
            // return the valid contracts and the same time
            let cursor = contracts.find({
                memberId: doc._id,
                status: "paid",
                $or: [
                    { expireDate: { $gt: new Date() } },
                    { expireDate: null }
                ]
            }, { projection: { comments: 0, history: 0 } });
            let validContracts = await cursor.toArray();
            doc.contracts = validContracts;
        }
        // return null if member doesn't exist
        res.json(doc);
    } catch (error) {
        let err = new Error("validate member fails");
        err.innerError = error;
        return next(err);
    }
});

/// Below APIs are visible to authenticated users only
router.use(helper.isAuthenticated);

router.get('/', queryMembersHasContracts, async function(req, res, next) {
    let query = {};
    if (req.query.name) {
        query['name'] = req.query.name;
    }
    if (req.query.contact) {
        query['contact'] = req.query.contact;
    }
    // query members by status, the status could be empty string, e.g. status=
    if (req.query.status) {
        query['status'] = {
            $in: req.query.status.split(',').map(function(value) {
                return value ? value : null;
            })
        };
    }

    // query members by source, the source could be empty string, e.g. source=
    if (req.query.source) {
        // document is considered as "manual" if property "source" not existed
        if (req.query.source === "manual") {
            query['source'] = {
                $in: ["manual", null]
            };
        } else {
            query['source'] = req.query.source;
        }
    }

    // query members by keyword, search 'name' or 'contact'
    let search = req.query.search || "";
    if (search) {
        try {
            query['$or'] = [
                { 'name': new RegExp(search, 'i') },
                { 'contact': new RegExp(search, 'i') }
            ];
        } catch (error) {
            // e.g. search is "Ying\/:"
            console.warn(error.message);
            // query a dummy field "error" to ensure no result found
            query["error"] = error.message;
        }
    }

    // support sorting
    let sort = {};
    let field = req.query.sort || "since"; // sort by "since" by default
    sort[field] = req.query.order == 'asc' ? 1 : -1;

    // support pagination
    let skip = parseInt(req.query.offset) || 0;
    if (skip < 0) {
        console.warn(`page "offset" should be a positive integer, but get ${skip} in run-time`);
        skip = 0;
    }
    let pageSize = parseInt(req.query.limit) || 100;
    if (pageSize > 100 || pageSize < 0) {
        console.warn(`page "limit" should be a positive integer less than 100, but get ${pageSize} in run-time`);
        pageSize = 100;
    }

    const members = req.db.collection("members");

    // get the total of all matched members
    let cursor = members.find(query, { projection: NORMAL_FIELDS });
    let total = await cursor.count();

    // build pipelines for aggregate()
    let pipelines = [{
        $match: query
    }, {
        // put the $sort at the beginning for better performance
        $sort: sort
    }, {
        $skip: skip
    }, {
        $limit: pageSize
    }, {
        $project: NORMAL_FIELDS
    }, {
        $lookup: {
            from: 'contracts',
            let: { memberID: "$_id" },
            pipeline: [{
                $match: {
                    status: { $nin: ["closed", "deleted"] },
                    $expr: { $eq: ["$$memberID", "$memberId"] }
                }
            }, {
                $project: { comments: 0, history: 0 }
            }],
            as: 'contracts'
        }
    }, {
        $addFields: {
            contractsCount: {
                $size: "$contracts"
            },
            contractsTotalCredit: {
                $sum: "$contracts.credit"
            },
            contractsTotalConsumed: {
                $sum: "$contracts.consumedCredit"
            },
            contractsTotalExpended: {
                $sum: "$contracts.expendedCredit"
            }
        }
    }];

    try {
        let docs = await members.aggregate(pipelines).toArray();
        console.log(`find ${docs.length} members with relevant contracts from ${total} in total`);
        return res.json({
            total: total,
            rows: docs
        });
    } catch (error) {
        let err = new Error("Get member list fails");
        error.innerError = err;
        return next(error);
    }
});

router.get('/:memberID', async function(req, res, next) {
    try {
        let members = req.db.collection("members");
        let doc = await members.findOne(
            { _id: ObjectId(req.params.memberID) },
            { projection: NORMAL_FIELDS }
        );

        if (!doc) {
            return next(new BadRequestError(`member ${req.params.memberID} not found`));
        }
        console.log("find member %j", doc);
        return res.json(doc);
    } catch (error) {
        return next(new RuntimeError("Get member fails", error));
    }
});

router.patch('/:memberID', helper.requireRole("admin"), async function(req, res, next) {
    convertDateObject(req.body);

    // only below fields can be updated
    const EDIT_FIELDS = {
        name: 1,
        contact: 1,
        status: 1,
        note: 1,
        birthday: 1
    };
    //check any invalid field in the body
    for (let field in req.body) {
        if (!(field in EDIT_FIELDS)) {
            return next(new BadRequestError(`Invalid parameter "${field}" in member patch body`));
        }
    }

    try {
        let isExisted = await hasSameNameAndContact(req.db, req.params.memberID, req.body);
        if (isExisted) {
            return next(new BadRequestError("会员姓名和联系方式已经存在，请勿重复"));
        }

        const members = req.db.collection("members");
        let result = await members.findOneAndUpdate(
            { _id: ObjectId(req.params.memberID) },
            { $set: req.body },
            { projection: NORMAL_FIELDS, returnDocument: "after" }
        );

        console.log("member %s is updated by %j", req.params.memberID, req.body);
        return res.json(result.value);
    } catch (error) {
        return next(new RuntimeError("Update member fails", error));
    }
});

/**
 * Get the change log of current member, return 
 * [{
 *     "user": "yezhi",
 *     "date": "2016-1-1",
 *     "target": "membership.0.credit",
 *     "old": 4,
 *     "new": 14
 * }]
 */
router.get('/:memberID/history', async function(req, res, next) {
    try {
        const members = req.db.collection("members");
        let doc = await members.findOne(
            { _id: ObjectId(req.params.memberID) },
            { projection: { history: 1 } }
        );

        if (!doc) {
            return next(new BadRequestError("会员不存在"));
        }

        console.log("get member history");
        let history = doc.history || []
        return res.json(history.filter(function(val) {
            if (!val.hasOwnProperty('target')) return false;
            else return val.target.indexOf('credit') > -1 || val.target.indexOf('expire') > -1;
        }));
    } catch (error) {
        return next(new RuntimeError("fail to get member history", error));
    }
});

router.post('/', helper.requireRole("admin"), async function(req, res, next) {
    try {
        let doc = await addNewMember(req.db, req.body || {});
        return res.json(doc);
    } catch (err) {
        if (err instanceof BaseError) {
            return next(err);
        } else {
            let error = new Error("Fail to add member");
            error.innerError = err;
            return next(error);
        }
    }
});

async function addNewMember(db, data) {
    if (!data.name || !data.contact) {
        throw new ParamError("Missing param 'name' or 'contact'");
    }
    // new member default status is 'active'
    if (!data.hasOwnProperty('status')) {
        data.status = 'active';
    }

    let query = {
        name: data.name,
        contact: data.contact
    };

    let members = db.collection("members");
    let doc = await members.findOne(query);
    if (doc) {
        throw new BadRequestError("会员已经存在", 2007);
    }

    convertDateObject(data);
    let result = await members.insertOne(data);
    console.debug("create member successfully with result: %j", result);
    console.log("member is added %j", data);
    return data;
}
/**
 * comments: [
        { posted: ISODateTime(...),
          author: 'Rick' ,
          text: 'This is so bogus ... ' },
       ... ]
 */
router.post('/:memberID/comments', async function(req, res, next) {
    if (!req.body.text || req.body.text.length <= 0) {
        return next(new ParamError("Missing param 'text'"));
    }

    try {
        // add comment author
        req.body.author = req.user.username;
        // add posted date
        req.body.posted = new Date();
        const members = req.db.collection("members");
        let result = await members.findOneAndUpdate(
            { _id: ObjectId(req.params.memberID) },
            { $push: { comments: req.body } },
            { projection: { comments: 1 }, returnDocument: "after" }
        );
        console.log("member %s has 1 new comment: %j", req.params.memberID, req.body);
        return res.json(result.value);
    } catch (error) {
        return next(new RuntimeError("Add comment fails", error));
    }
});

router.get('/:memberID/comments', async function(req, res, next) {
    try {
        const members = req.db.collection("members");
        let doc = await members.findOne(
            { _id: ObjectId(req.params.memberID) },
            { projection: { comments: 1 } }
        );

        if (!doc) {
            return next(new BadRequestError(`member ${req.params.memberID} not found`));
        }
        console.log("Get comments from member %s", req.params.memberID);
        return res.json(doc);
    } catch (error) {
        return next(new RuntimeError("Get comments fails", error));
    }
});

/**
 * @description Update the existed with body 
 * {
 *     posted: ISODateTime(...), // the posted date is the same as original
 *     author: 'Rick' , // only the same author can update his/her comment
 *     text: 'This is so bogus ... ' // the updated comment text
 * }
 */
router.patch('/:memberID/comments/:commentIndex', async function(req, res, next) {
    if (!req.body.text || req.body.text.length <= 0) {
        return next(new ParamError("Missing param 'text'"));
    }
    if (isNaN(parseInt(req.params.commentIndex)) || parseInt(req.params.commentIndex) < 0) {
        return next(new ParamError("comment index is 0 based"));
    }

    let queryString = {
        _id: ObjectId(req.params.memberID)
    };
    // non-admin user can only modify his/her own comment
    if (req.user.role !== 'admin') {
        queryString[`comments.${req.params.commentIndex}.author`] = req.user.username;
    }
    let updateString = {
        $set: {}
    };
    updateString.$set[`comments.${req.params.commentIndex}.text`] = req.body.text;
    updateString.$set[`comments.${req.params.commentIndex}.updated`] = new Date();
    updateString.$set[`comments.${req.params.commentIndex}.author`] = req.user.username;

    try {
        const members = req.db.collection("members");
        let result = await members.findOneAndUpdate(
            queryString,
            updateString,
            { projection: { comments: 1 }, returnDocument: "after" }
        );

        if (!result.value) {
            return next(new BadRequestError("不能修改其它人的备忘，请联系管理员"));
        }
        console.log("member %s update comment: %j", req.params.memberID, req.body);
        return res.json(result.value);
    } catch (error) {
        return next(new RuntimeError("Update comment fails", error));
    }
});

router.post('/:memberID/memberships', helper.requireRole('admin'), function(req, res, next) {
    // membership card is not able to edit after Oct 31, 2022
    return next(new BadRequestError("会员卡功能已停用"));
});

router.patch('/:memberID/memberships/:cardIndex', function(req, res, next) {
    // membership card is not able to edit after Oct 31, 2022
    return next(new BadRequestError("会员卡功能已停用"));
});

router.get('/:memberID/summary', async function(req, res, next) {
    let pipelines = [{
        $match: {
            "booking.member": ObjectId(req.params.memberID)
        }
    }, {
        $project: {
            "after": {
                $cond: { if: { $gte: ["$date", new Date()] }, then: 1, else: 0 }
            },
            "before": {
                $cond: { if: { $gte: ["$date", new Date()] }, then: 0, else: 1 }
            },
            'courseID': 1
        }
    }, {
        $group: {
            _id: "$courseID", // group the data according to course
            finished: {
                $sum: "$before"
            },
            unfinished: {
                $sum: "$after"
            },
            total: {
                $sum: 1
            }
        }
    }];
    try {
        const classes = req.db.collection("classes");
        let docs = await classes.aggregate(pipelines).toArray();

        let courseList = docs.map(function(value, index, array) {
            return ObjectId(value._id);
        });

        const courses = req.db.collection("courses");

        let foundCourses = await courses.find(
            { _id: { $in: courseList } },
            { projection: { name: 1 } }
        ).toArray();

        foundCourses.forEach(function(value, index, array) {
            let courseAgg = docs.find(function(value2, index2, array2) {
                return value._id.toString() == value2._id;
            });
            courseAgg.courseName = value.name;
        });
        console.log("get member summary: ", docs ? docs.length : 0);
        return res.json(docs);

    } catch (error) {
        return next(new RuntimeError("get member summary fails", error));
    }
});

router.delete('/:memberID', helper.requireRole("admin"), function(req, res, next) {
    return next(new BadRequestError("Not Supported"));
});

/**
 * make sure the datetime object is stored as ISODate
 * @param {Object} doc 
 */
function convertDateObject(doc) {
    if (!doc) {
        return doc;
    }
    if (doc.hasOwnProperty("membership.0.expire")) {
        doc["membership.0.expire"] = new Date(doc["membership.0.expire"]);
    }
    if (doc.hasOwnProperty("expire")) {
        doc["expire"] = new Date(doc["expire"]);
    }
    if (doc.hasOwnProperty("posted")) {
        doc["posted"] = new Date(doc["posted"]);
    }
    if (doc.birthday) {
        doc.birthday = new Date(doc.birthday);
    }
    if (doc.since) {
        doc.since = new Date(doc.since);
    }
    if (doc.membership && doc.membership.length > 0) {
        for (let index in doc.membership) {
            let card = doc.membership[index];
            if (card && card.expire) {
                card.expire = new Date(card.expire);
            }
        }
    }

    return doc;
}

async function hasSameNameAndContact(db, memberId, body) {
    const FIELDS = { name: 1, contact: 1 };
    const members = db.collection("members");
    let doc = await members.findOne(
        { _id: ObjectId(memberId) },
        { projection: FIELDS }
    );

    if (!doc) {
        throw new Error(`member ${memberId} not found`);
    }

    let query = {
        _id: { $ne: doc._id }, // member Id is not same as modified one
        name: doc.name,
        contact: doc.contact
    };

    if (body.hasOwnProperty('name')) query.name = body.name;
    if (body.hasOwnProperty('contact')) query.contact = body.contact;

    let existedDoc = await members.findOne(query, { projection: FIELDS });
    return existedDoc ? true : false;
}

async function queryMembersHasContracts(req, res, next) {
    if (!req.query.hasContracts) return next();

    // support sorting
    let sort = {};
    let field = req.query.sort || "total"; // sort by "total" by default
    sort[field] = req.query.order == 'asc' ? 1 : -1;

    // support pagination
    let skip = parseInt(req.query.offset) || 0;
    if (skip < 0) {
        console.warn(`page "offset" should be a positive integer, but get ${skip} in run-time`);
        skip = 0;
    }
    let pageSize = parseInt(req.query.limit) || 100;
    if (pageSize > 100 || pageSize < 0) {
        console.warn(`page "limit" should be a positive integer less than 100, but get ${pageSize} in run-time`);
        pageSize = 100;
    }

    let pipelines = [{
        $match: { // query active contracts only
            status: 'paid',
            $or: [{
                expireDate: { $gt: new Date() }
            }, {
                expireDate: null
            }]
        }
    }, {
        $project: {
            memberId: 1,
            credit: 1,
            consumedCredit: 1,
            expendedCredit: 1
        }
    }, {
        $lookup: {
            from: 'classes',
            let: { contractID: '$_id' },
            pipeline: [{
                $match: { // query classes with at least one booking
                    date: { $gte: new Date() },
                    'booking.0': { $exists: true },
                    $expr: { $in: ['$$contractID', '$booking.contract'] }
                }
            }, {
                $project: { name: 1, cost: 1, date: 1, _id: 0 }
            }],
            as: 'unStartedClass'
        }
    }, {
        $addFields: {
            plan: { $sum: '$unStartedClass.cost' },
            remaining: {
                $subtract: ['$credit', { $add: ['$consumedCredit', '$expendedCredit'] }]
            }
        }
    }, {
        $group: {
            _id: '$memberId',
            total: {
                $sum: { $add: ['$plan', '$remaining'] }
            },
            plan: { $sum: "$plan", },
            remaining: { $sum: "$remaining", }
        }
    }, {
        $lookup: {
            from: 'members',
            let: { 'memberId': '$_id' },
            pipeline: [{
                $match: { // query active members only
                    status: 'active',
                    $expr: { $eq: ['$$memberId', '$_id'] }
                }
            }, {
                $project: { name: 1, contact: 1, _id: 0 }
            }],
            as: 'members'
        }
    }, {
        $project: {
            total: 1,
            plan: 1,
            remaining: 1,
            member: { $arrayElemAt: ['$members', 0] }
        }
    }, {
        $facet: {
            metadata: [{ $count: "total" }], // get the total of all matched members
            data: [{ $sort: sort }, { $skip: skip }, { $limit: pageSize }], // sort and pagination
        }
    }];

    try {
        let contracts = req.db.collection("contracts");

        // [ { metadata: [{total:24}], data: [{x}, {y} ...] } ]
        // [ { metadata: [], data: [] } ] when no data found
        let docs = await contracts.aggregate(pipelines).toArray();
        let result = docs[0];
        let total = result.metadata.length > 0 ? result.metadata[0].total : 0;
        console.log(`find ${result.data.length} members with active contracts from ${total} in total`);
        return res.json({
            total: total,
            rows: result.data
        });
    } catch (error) {
        let err = new Error("Get member with active contracts fails");
        error.innerError = err;
        return next(error);
    }
}

module.exports = router;
