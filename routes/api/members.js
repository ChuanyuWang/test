const express = require('express');
const router = express.Router();
const mongojs = require('mongojs');
const helper = require('../../helper');
const db_utils = require('../../server/databaseManager');
const { BadRequestError, ParamError, BaseError } = require('./lib/basis');

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

    var query = {};
    if (req.body.hasOwnProperty('name') && req.body.hasOwnProperty('contact')) {
        query['name'] = req.body.name;
        query['contact'] = req.body.contact;
    } else {
        return next(new ParamError("Missing param 'name' or 'contact'"));
    }

    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let members = tenantDB.collection("members");
        let doc = await members.findOne(query, { projection: NORMAL_FIELDS });
        console.log("validate member: %j", doc);

        let contracts = tenantDB.collection("contracts");
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

router.get('/', queryMembersHasContracts, queryMembersHasNoContracts, async function(req, res, next) {
    let query = {};
    if (req.query.name) {
        query['name'] = req.query.name;
    }
    if (req.query.contact) {
        query['contact'] = req.query.contact;
    }
    // "null" is the keyword indicate display all classrooms
    if (req.query.filter && req.query.filter != "null") {
        //TODO, support multi membership card
        query["membership"] = { $size: 1 };
        query["membership.type"] = "LIMITED";
        query["membership.room"] = [req.query.filter];
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

    // support paginzation
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

    // TODO, handle exception from `connect`
    let tenantDB = await db_utils.connect(req.tenant.name);
    let members = tenantDB.collection("members");

    // get the total of all matched members
    let cursor = members.find(query, { projection: NORMAL_FIELDS });
    let total = await cursor.count();

    if (!req.query.hasOwnProperty('appendLeft')) {
        try {
            let docs = await cursor.sort(sort).skip(skip).limit(pageSize).toArray();
            console.log(`find ${docs.length} members from ${total} in total`);
            return res.json({
                total: total,
                rows: docs
            });
        } catch (err) {
            let error = new Error("Get member list fails");
            error.innerError = err;
            return next(error);
        }
    }

    // build pipelines for aggregate()
    let pipelines = [{
        $match: query
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

    if (['unStartedClassCount', 'credit', 'allRemaining'].indexOf(field) > -1) {
        // user sort on calculated field
        pipelines.push({
            $sort: sort
        }, {
            $skip: skip
        }, {
            $limit: pageSize
        });
    } else {
        // put the $sort at the beginning for better performance
        pipelines.splice(1, 0, {
            $sort: sort
        }, {
            $skip: skip
        }, {
            $limit: pageSize
        });
    }

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

router.get('/:memberID', function(req, res, next) {
    var members = req.db.collection("members");
    members.findOne({
        _id: mongojs.ObjectId(req.params.memberID)
    }, NORMAL_FIELDS, function(err, doc) {
        if (err) {
            var error = new Error("Get member fails");
            error.innerError = err;
            return next(error);
        }
        console.log("find member %j", doc);
        res.json(doc);
    });
});

router.patch('/:memberID', helper.requireRole("admin"), function(req, res, next) {
    var members = req.db.collection("members");
    // no one can change history, even the admin
    for (var key in req.body) {
        if (key.indexOf('history') > -1) {
            var error = new Error('field "history" is not able to be modified');
            error.status = 400;
            return next(error);
        } else if (key.indexOf('membership') > -1) {
            var error = new Error('field "membership" has to be updated by "/memberships" API');
            error.status = 400;
            return next(error);
        }
    }
    convertDateObject(req.body);

    checkDuplicate(members, req.params.memberID, req.body, function(err, isExisted) {
        if (isExisted) {
            var error = new Error("会员姓名和联系方式已经存在，请勿重复");
            error.status = 400;
            return next(error);
        }
        members.findAndModify({
            query: {
                _id: mongojs.ObjectId(req.params.memberID)
            },
            update: {
                $set: req.body
            },
            fields: NORMAL_FIELDS,
            new: true
        }, function(err, doc, lastErrorObject) {
            if (err) {
                var error = new Error("Update member fails");
                error.innerError = err;
                return next(error);
            }
            console.log("member %s is updated by %j", req.params.memberID, req.body);
            res.json(doc);
        });
    });
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
router.get('/:memberID/history', function(req, res, next) {
    var members = req.db.collection("members");
    members.findOne({
        _id: mongojs.ObjectId(req.params.memberID)
    }, { "history": 1 }, function(err, doc) {
        if (err) {
            var error = new Error("fail to get member history");
            error.innerError = err;
            return next(error);
        }
        console.log("get member history");
        if (!doc) {
            var error = new Error("会员不存在");
            error.status = 400;
            return next(error);
        }
        var history = doc.history || []
        res.json(history.filter(function(val) {
            if (!val.hasOwnProperty('target')) return false;
            else return val.target.indexOf('credit') > -1 || val.target.indexOf('expire') > -1;
        }));
    });
});

router.post('/', helper.requireRole("admin"), async function(req, res, next) {
    try {
        let doc = await addNewMember(req.tenant.name, req.body || {});
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

async function addNewMember(tenantName, data) {
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

    let tenantDB = await db_utils.connect(tenantName);
    let members = tenantDB.collection("members");
    let doc = await members.findOne(query);
    if (doc) {
        throw new BadRequestError("会员已经存在", 2007);
    }

    convertDateObject(data);
    let result = await members.insertOne(data);
    console.debug("create member successfully with result: %j", result.result);
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
router.post('/:memberID/comments', function(req, res, next) {
    var members = req.db.collection("members");
    if (!req.body.text || req.body.text.length <= 0) {
        var error = new Error("Missing param 'text'");
        error.status = 400;
        return next(error);
    }
    // add comment author
    req.body.author = req.user.username;
    // add posted date
    req.body.posted = new Date();
    members.findAndModify({
        query: {
            _id: mongojs.ObjectId(req.params.memberID)
        },
        update: {
            $push: { comments: req.body }
        },
        fields: { comments: 1 },
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("Add comment fails");
            error.innerError = err;
            return next(error);
        }
        console.log("member %s has 1 new comment: %j", req.params.memberID, req.body);
        res.json(doc);
    });
});

router.get('/:memberID/comments', function(req, res, next) {
    var members = req.db.collection("members");
    members.findOne({
        _id: mongojs.ObjectId(req.params.memberID)
    }, { comments: 1 }, function(err, doc) {
        if (err) {
            var error = new Error("Get comments fails");
            error.innerError = err;
            return next(error);
        }
        console.log("Get comments from member %s", req.params.memberID);
        res.json(doc);
    });
});

/**
 * @description Update the existed with body 
 * {
 *     posted: ISODateTime(...), // the posted date is the same as original
 *     author: 'Rick' , // only the same author can update his/her comment
 *     text: 'This is so bogus ... ' // the updated comment text
 * }
 */
router.patch('/:memberID/comments/:commentIndex', function(req, res, next) {
    var members = req.db.collection("members");
    if (!req.body.text || req.body.text.length <= 0) {
        var error = new Error("Missing param 'text'");
        error.status = 400;
        return next(error);
    }
    if (isNaN(parseInt(req.params.commentIndex)) || parseInt(req.params.commentIndex) < 0) {
        var error = new Error("comment index is 0 based");
        error.status = 400;
        return next(error);
    }

    var queryString = {
        _id: mongojs.ObjectId(req.params.memberID)
    };
    // non-admin user can only modify his/her own comment
    if (req.user.role !== 'admin') {
        queryString[`comments.${req.params.commentIndex}.author`] = req.user.username;
    }
    var updateString = {
        $set: {}
    };
    updateString.$set[`comments.${req.params.commentIndex}.text`] = req.body.text;
    updateString.$set[`comments.${req.params.commentIndex}.updated`] = new Date();
    updateString.$set[`comments.${req.params.commentIndex}.author`] = req.user.username;
    members.findAndModify({
        query: queryString,
        update: updateString,
        fields: { comments: 1 },
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("Update comment fails");
            error.innerError = err;
            return next(error);
        }
        if (!doc) {
            var error = new Error("不能修改其它人的备忘，请联系管理员");
            error.status = 400;
            return next(error);
        }
        console.log("member %s update comment: %j", req.params.memberID, req.body);
        res.json(doc);
    });
});

router.post('/:memberID/memberships', helper.requireRole('admin'), function(req, res, next) {
    // membership card is not able to edit after Oct 31, 2022
    return next(new BadRequestError("会员卡功能已停用"));
});

router.patch('/:memberID/memberships/:cardIndex', function(req, res, next) {
    // membership card is not able to edit after Oct 31, 2022
    return next(new BadRequestError("会员卡功能已停用"));
});

router.get('/:memberID/summary', function(req, res, next) {
    var classes = req.db.collection("classes");
    classes.aggregate([{
        $match: {
            "booking.member": mongojs.ObjectId(req.params.memberID)
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
    }], function(err, docs) {
        if (err) {
            var error = new Error("get member summary fails");
            error.innerError = err;
            return next(error);
        }
        var courseList = docs.map(function(value, index, array) {
            return mongojs.ObjectId(value._id);
        });

        var courses = req.db.collection("courses");
        courses.find({
            _id: {
                $in: courseList
            }
        }, { 'name': 1 }, function(err, foundCourses) {
            if (err) {
                var error = new Error("Find courses fails when get member's summary");
                error.innerError = err;
                return next(error);
            }

            foundCourses.forEach(function(value, index, array) {
                var courseAgg = docs.find(function(value2, index2, array2) {
                    return value._id.toString() == value2._id;
                });
                courseAgg.courseName = value.name;
            });
            console.log("get member summary: ", docs ? docs.length : 0);
            res.json(docs);
        });
    });
});

router.delete('/:memberID', helper.requireRole("admin"), function(req, res, next) {
    return next(new Error("Not Supported"));
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
        for (var index in doc.membership) {
            var card = doc.membership[index];
            if (card && card.expire) {
                card.expire = new Date(card.expire);
            }
        }
    }

    return doc;
}

function checkDuplicate(collection, id, query, callback) {
    var FIELDS = { name: 1, contact: 1 };
    if (query.hasOwnProperty('name') && query.hasOwnProperty('contact')) {
        collection.find({
            name: query.name, contact: query.contact
        }, FIELDS, function(err, docs) {
            if (err) return callback(err);
            if (docs.length > 1) return callback(null, true);
            else if (docs.length == 1) {
                if (docs[0]._id.toString() != id) {
                    return callback(null, true);
                }
            }
            return callback(null, false);
        });
    } else if (query.hasOwnProperty('name') || query.hasOwnProperty('contact')) {
        // only 'name' or 'contact' been updated, E.g. user onlys modify 'name'
        collection.findOne({
            _id: mongojs.ObjectId(id)
        }, FIELDS, function(err, doc) {
            if (err) return callback(err);
            if (!doc) return callback(null, false);

            var search = {
                name: doc.name,
                contact: doc.contact
            };
            if (query.hasOwnProperty('name')) search.name = query.name;
            if (query.hasOwnProperty('contact')) search.contact = query.contact;

            collection.find(search, FIELDS, function(err, docs) {
                if (err) return callback(err);
                if (docs.length > 1) return callback(null, true);
                else if (docs.length == 1) {
                    if (docs[0]._id.toString() != id) {
                        return callback(null, true);
                    }
                }
                return callback(null, false);
            });
        });

    } else {
        return callback(null, false);
    }
}

async function queryMembersHasContracts(req, res, next) {
    if (!req.query.hasContracts) return next();

    // support sorting
    let sort = {};
    let field = req.query.sort || "total"; // sort by "total" by default
    sort[field] = req.query.order == 'asc' ? 1 : -1;

    // support paginzation
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
        let tenantDB = await db_utils.connect(req.tenant.name);
        let contracts = tenantDB.collection("contracts");

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

async function queryMembersHasNoContracts(req, res, next) {
    return next();
}

module.exports = router;
