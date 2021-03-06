var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var helper = require('../../helper');
var util = require('../../util');

var NORMAL_FIELDS = {
    status: 1,
    since: 1,
    name: 1,
    contact: 1,
    birthday: 1,
    expire: 1,
    note: 1,
    membership: 1
};

router.post('/validate', function(req, res, next) {
    var tenantDB = null;
    if (req.body.hasOwnProperty('tenant')) {
        tenantDB = util.connect(req.body.tenant);
    } else if (req.db) {
        // initialize the tenant db if it's authenticated user
        tenantDB = req.db;
    } else {
        var err = new Error("Missing param 'tenant'");
        err.status = 400;
        return next(err);
    }

    var query = {};
    if (req.body.hasOwnProperty('name') && req.body.hasOwnProperty('contact')) {
        query['name'] = req.body.name;
        query['contact'] = req.body.contact;
    } else {
        var err = new Error("Missing param 'name' or 'contact'");
        err.status = 400;
        return next(err);
    }

    var members = tenantDB.collection("members");
    members.findOne(query, NORMAL_FIELDS, function(err, doc) {
        if (err) {
            res.status(500).json({
                'err': err
            });
            return;
        }
        console.log("validate member: %j", doc);
        res.json(doc);
    });
});

/// Below APIs are visible to authenticated users only
router.use(helper.isAuthenticated);

router.get('/', getMemberLeftClasses, function(req, res, next) {
    var members = req.db.collection("members");
    var query = {};
    if (req.query.name) {
        query['name'] = req.query.name;
    }
    if (req.query.contact) {
        query['contact'] = req.query.contact;
    }
    // "null" is the keyword indicate display all members
    if (req.query.filter && req.query.filter != "null") {
        //TODO, support multi membership card
        query["membership"] = { $size: 1 };
        query["membership.type"] = "LIMITED";
        query["membership.room"] = [req.query.filter];
    }
    // query members by status
    if (req.query.hasOwnProperty('status')) {
        query['status'] = {
            $in: req.query.status.split(',').map(function(value) {
                return value ? value : null;
            })
        };
    }
    members.find(query, NORMAL_FIELDS).sort({
        since: -1
    }, function(err, docs) {
        if (err) {
            res.status(500).json({
                'err': err
            });
            return;
        }
        // append the field 'unStartedClassCount' and 'allRemaining' to each member, default is 0
        if (req.query.hasOwnProperty('appendLeft') && req.memberLeftClasses) {
            docs.forEach(function(value, index, array) {
                value.unStartedClassCount = req.memberLeftClasses[value._id.toString()] || 0;
                var credit = value.membership && value.membership[0] && value.membership[0].credit || 0;
                value.allRemaining = value.unStartedClassCount + credit;
            });
        }
        console.log("find members: ", docs ? docs.length : 0);
        res.json(docs);
    });
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

router.post('/', helper.requireRole("admin"), function(req, res, next) {
    if (!req.body.name || !req.body.contact) {
        var error = new Error("Missing param 'name' or 'contact'");
        error.status = 400;
        return next(error);
    }
    // new member default status is 'active'
    if (!req.body.hasOwnProperty('status')) {
        req.body.status = 'active';
    }

    var members = req.db.collection("members");
    var query = {
        name: req.body.name,
        contact: req.body.contact
    };

    members.findOne(query, function(err, doc) {
        if (err) {
            var error = new Error("fail to find member");
            error.innerError = err;
            return next(error);
        }

        if (doc) {
            var error = new Error("会员已经存在");
            error.code = 2007;
            return next(error);
        }

        convertDateObject(req.body);
        members.insert(req.body, function(err, docs) {
            if (err) {
                var error = new Error("fail to add member");
                error.innerError = err;
                next(error);
            } else {
                console.log("member is added %j", docs);
                res.json(docs);
            }
        });
    });
});
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
/**
 * @description req.body
 * {
    "type": "ALL",
    "room": ["wucai", "a", "bb"],
    "expire": "2014-03-12T16:00:00.000Z",
    "credit": 10
   }
 */
router.post('/:memberID/memberships', helper.requireRole('admin'), function(req, res, next) {
    var members = req.db.collection("members");
    //'memo' is reserved field for passing the memo for history item
    if (req.body && req.body.hasOwnProperty('memo')) {
        var memo = req.body.memo;
        delete req.body.memo;
    }
    convertDateObject(req.body);
    convertNumberValue(req.body);
    members.findAndModify({
        query: {
            _id: mongojs.ObjectId(req.params.memberID),
            // it's only allowed to create one membership card
            $or: [{ membership: { $size: 0 } }, { membership: { $exists: false } }]
        },
        update: {
            $push: { membership: req.body }
        },
        fields: NORMAL_FIELDS,
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("Create membership fails");
            error.innerError = err;
            return next(error);
        }
        if (!doc) {
            var error = new Error("创建会员卡失败，请核对会员状态，勿重复创建会员卡");
            error.status = 400;
            return next(error);
        }
        console.log("membership card %j is created by %s", req.body, req.user.username);
        // update the history when a new membership card is added
        var setQuery = {}, historyItems = [];
        genMembershipSetQueries(req.user.username, doc.membership.length - 1, {}, req.body, setQuery, historyItems, memo);
        members.update({
            _id: mongojs.ObjectId(req.params.memberID)
        }, {
            $push: {
                history: {
                    $each: historyItems
                }
            }
        }, function(err, result) {
            if (err) console.error(err);
            console.log('update history by creating new card %j', result);
        });
        res.json(doc);
    });
});

router.patch('/:memberID/memberships/:cardIndex', function(req, res, next) {
    var members = req.db.collection("members");
    //'memo' is reserved field for passing the memo for history item
    if (req.body && req.body.hasOwnProperty('memo')) {
        var memo = req.body.memo;
        delete req.body.memo;
    }
    convertDateObject(req.body);
    convertNumberValue(req.body);

    members.findOne({
        _id: mongojs.ObjectId(req.params.memberID)
    }, { membership: 1 }, function(err, doc) {
        if (err) {
            var error = new Error("find member fails");
            error.innerError = err;
            return next(error);
        }
        if (!doc) {
            var error = new Error("用户不存在");
            error.status = 400;
            return next(error);
        }
        if (!doc.membership || !doc.membership[req.params.cardIndex]) {
            var error = new Error("没有找到指定会员卡，请先建立会员卡");
            error.status = 400;
            return next(error);
        }
        var membershipCard = doc.membership[req.params.cardIndex];

        var setQuery = {}, historyItems = [];
        genMembershipSetQueries(req.user.username, req.params.cardIndex, membershipCard, req.body, setQuery, historyItems, memo);

        //nothing changed, just return the original member object
        if (Object.keys(setQuery).length === 0) {
            return res.json(doc);
        }

        // user can only modify the expire
        if (!helper.hasRole(req, 'admin')) {
            for (const key in setQuery) {
                if (setQuery.hasOwnProperty(key) && !key.endsWith(".expire")) {
                    var err = new Error("没有权限执行此操作");
                    err.status = 403;
                    return next(err);
                }
            }
        }

        members.findAndModify({
            query: {
                _id: mongojs.ObjectId(req.params.memberID)
            },
            update: {
                $set: setQuery,
                $push: { history: { $each: historyItems } }
            },
            fields: NORMAL_FIELDS,
            new: true
        }, function(err, doc, lastErrorObject) {
            if (err) {
                var error = new Error("update membership card fails");
                error.innerError = err;
                return next(error);
            }
            console.log("update membership card %j by %s", setQuery, req.user.username);
            res.json(doc);
        });
    });
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
 * make sure the Number field is stored as Number
 * @param {Object} doc 
 */
function convertNumberValue(doc) {
    if (!doc) {
        return doc;
    }
    if (doc.hasOwnProperty('credit')) {
        doc['credit'] = parseFloat(doc['credit']);
    }
}

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

/**
 * 
 * @param {String} username - The user name who did the modification
 * @param {Number} cardIndex - The membership card index 0 based
 * @param {Object} current - The current membership card
 * @param {Object} newItem - The fields with new value
 * @param {Array} setQuery - The generated array of set query
 * @param {Array} historyItems - The generated array of history items to be pushed
 * @param {String} memo - The memo for this change if there is any
 */
function genMembershipSetQueries(username, cardIndex, current, newItem, setQuery, historyItems, memo) {
    for (var key in newItem) {
        if (current.hasOwnProperty(key) && isEqual(current[key], newItem[key])) {
            // skip update of this field when it's the same
            continue;
        }
        var targetField = 'membership.' + cardIndex + '.' + key;
        setQuery[targetField] = newItem[key];
        // skip null value update
        if (!current.hasOwnProperty(key) && newItem[key] === null) continue;
        historyItems.push({
            date: new Date(),
            user: username,
            target: targetField,
            old: current.hasOwnProperty(key) ? current[key] : null,
            new: newItem[key],
            remark: memo
        });
    }
}

function isEqual(a, b) {
    if (a === b) return true;
    if (a.constructor === Date && b.constructor === Date) return a.getTime() === b.getTime();
    if (a.constructor === Array && b.constructor === Array) {
        if (a.length != b.length) return false;
        else return a.every(function(u, i) {
            return u == b[i];
        });
    }
    return a == b;
}

function getMemberLeftClasses(req, res, next) {
    // check whether to fetch the remaining classes for each member
    if (!req.query.hasOwnProperty('appendLeft')) return next();

    var classes_col = req.db.collection("classes");
    classes_col.aggregate([{
        $match: {
            "date": { $gte: new Date() }
        }
    }, {
        $project: {
            'booking': 1
        }
    }, {
        $unwind: "$booking"
    }, {
        $group: {
            _id: "$booking.member", // group the data according to member
            total: {
                $sum: 1
            }
        }
    }], function(err, docs) {
        if (err) {
            var error = new Error("get member remaining classes fails");
            error.innerError = err;
            return next(error);
        }
        if (!docs || docs.length === 0) {
            req.memberLeftClasses = {}; // append am empty object
            return next();
        }

        // generate the left classes for each member
        var memberLeftClasses = {};
        docs.forEach(function(value, index, array) {
            memberLeftClasses[value._id] = value.total || 0;
        });
        req.memberLeftClasses = memberLeftClasses;
        console.log("Append remaining info to members");
        return next();
    });
}
/*
function getMemberBookQuantity(class_doc, member_id) {
    if (!class_doc || !class_doc.booking) {
        return NaN;
    }
    // find the booking quantity of member
    for (var i = 0; i < class_doc.booking.length; i++) {
        if (class_doc.booking[i].member == member_id) {
            return class_doc.booking[i].quantity;
        }
    }
    return NaN;
}*/

module.exports = router;
