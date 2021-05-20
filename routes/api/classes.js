var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
const mongoist = require('mongoist');
var helper = require('../../helper');

var NORMAL_FIELDS = {
    name: 1,
    date: 1,
    courseID: 1,
    cost: 1,
    capacity: 1,
    age: 1,
    classroom: 1,
    teacher: 1,
    booking: 1,
    books: 1
};

router.get('/', function(req, res, next) {
    if (!req.tenant) {
        let error = new Error("tenant is not defined");
        error.status = 400;
        return next(error);
    }
    let tenantDB = mongoist(req.db);

    let query = {};
    if (req.query.hasOwnProperty('from') && req.query.hasOwnProperty('to')) {
        query.date = {
            $gte: new Date(req.query.from),
            $lt: new Date(req.query.to)
        };

        if (isNaN(query.date["$gte"].getTime()) || isNaN(query.date["$lt"].getTime())) {
            let error = new Error("Invalid Date");
            error.status = 400;
            return next(error);
        }
    }
    // query specific course
    if (req.query.hasOwnProperty('courseID')) {
        query['courseID'] = req.query.courseID ? mongoist.ObjectId(req.query.courseID) : null;
    }
    // query classes by specific teacher
    if (req.query.hasOwnProperty('teacher')) {
        query['teacher'] = req.query.teacher ? mongoist.ObjectId(req.query.teacher) : null;
    }
    // get all classes booked by this member
    if (req.query.hasOwnProperty('memberid')) {
        query['booking.member'] = mongoist.ObjectId(req.query.memberid);
    }

    // check if there is at least one filter, it's not supposed to return all classes
    if (Object.keys(query).length === 0) {
        return res.status(400).send(`Provide at least one filter to query classes, e,g. "from", "to"`);
    }

    // be defaul the sort is 'asc'
    var sort = req.query.order == 'desc' ? -1 : 1;
    // query specific classroom
    if (req.query.hasOwnProperty('classroom')) {
        query['classroom'] = req.query.classroom ? req.query.classroom : null;
    }
    // get all classes booked by this member
    if (req.query.hasOwnProperty('hasBooks')) {
        query['books.0'] = { // array size >= 1
            $exists: true
        };
    }
    // query all classes filter by minimum age, empty or null value will be ignored
    if (parseFloat(req.query.minAge)) {
        query['$or'] = [
            { 'age.min': { $gte: parseInt(req.query.minAge * 12) } },
            { 'age.min': null },
            { 'age.min': 0 }
        ];
    }
    var classes = tenantDB.collection("classes");
    // the return results will always sorted by class date
    classes.findAsCursor(query, NORMAL_FIELDS).sort({ date: sort }).toArray().then(function(docs) {
        console.log("find classes: ", docs ? docs.length : 0);
        return res.json(docs);
    }).catch(function(err) {
        var error = new Error("Get classes fails");
        error.innerError = err;
        return next(error);
    });
});

/// Below APIs are visible to authenticated users only
router.use(helper.isAuthenticated);

/**
 * Get the checkin status of all classes, pagination is supported.
 * Query string contains RESTFul type pagination params, "limit", "offset", "search", "sort" and "order"
 * "order" can only be 'asc' or 'desc'.
 * Return format is 
 * {
 *   "total": Number,
 *   "rows": []
 * }
 */
router.get('/checkin', function(req, res, next) {
    var query = {
        "booking.0": { // array size >= 1
            $exists: true
        },
    };
    if (req.query.hasOwnProperty('from') && req.query.hasOwnProperty('to')) {
        query.date = {
            $gte: new Date(req.query.from),
            $lt: new Date(req.query.to)
        };
    }
    // query specific classroom
    if (req.query.hasOwnProperty('classroom')) {
        query['classroom'] = req.query.classroom ? req.query.classroom : null;
    }
    // get all classes booked by this member
    if (req.query.hasOwnProperty('hasBooks')) {
        query['books.0'] = { // array size >= 1
            $exists: true
        };
    }

    // query checkin status
    var query2 = {};
    if (req.query.hasOwnProperty('status')) {
        //query2['booking.status'] = req.query.status ? {$in: req.query.status.split(',')} : null;
        query2['booking.status'] = {
            $in: req.query.status.split(',').map(function(value) {
                return value ? value : null;
            })
        };
    }
    // query flag status
    if (req.query.hasOwnProperty('flag')) {
        //query2['booking.status'] = req.query.status ? {$in: req.query.status.split(',')} : null;
        query2['booking.flag'] = {
            $in: req.query.flag.split(',').map(function(value) {
                return value ? value : null;
            })
        };
    }
    // get all checkin status of this member
    if (req.query.hasOwnProperty('memberid')) {
        query2['booking.member'] = mongojs.ObjectId(req.query.memberid);
    }

    // be defaul the sort is 'desc'
    var sort = req.query.order == 'asc' ? 1 : -1;

    var classes = req.db.collection("classes");
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

    classes.aggregate([
        {
            $match: query
        }, {
            $sort: { date: sort }
        }, {
            $unwind: "$booking"
        }, {
            $match: query2
        }, {
            $lookup: {
                from: "members",
                localField: "booking.member",
                foreignField: "_id",
                as: "member"
            }
        }, {
            $project: { // only return necessary value
                name: 1,
                date: 1,
                booking: 1,
                books: 1,
                'member._id': 1,
                'member.name': 1,
                'member.contact': 1
            }
        }, {
            $facet: {
                metadata: [{ $count: "total" }],
                rows: [{ $skip: skip }, { $limit: pageSize }]
            }
        }
    ], function(err, docs) {
        if (err) {
            var error = new Error("Get class checkin status fails");
            error.innerError = err;
            return next(error);
        }

        if (docs && docs.length > 0) {
            let results = docs[0];
            results.total = results.metadata.length > 0 ? results.metadata[0].total : 0;
            console.log(`get classes checkin status ${results.rows.length} from ${results.total} in total`);
            res.json(results);
        } else {
            console.log("Doesn't find checkin status");
            res.json({
                total: 0,
                rows: []
            });
        }
    });
});

router.get('/:classID', function(req, res, next) {
    var classes = req.db.collection("classes");
    classes.findOne({
        _id: mongojs.ObjectId(req.params.classID)
    }, NORMAL_FIELDS, function(err, doc) {
        if (err) {
            var error = new Error("Get class fails");
            error.innerError = err;
            return next(error);
        }
        console.log("find class %j", doc);
        res.json(doc);
    });
});

router.post('/', function(req, res, next) {
    var classes = req.db.collection("classes");
    convertDateObject(req.body);
    // save the teacher as reference object
    if (req.body.hasOwnProperty('teacher')) {
        req.body.teacher = req.body.teacher ? mongojs.ObjectId(req.body.teacher) : null;
    }
    classes.insert(req.body, function(err, docs) {
        if (err) {
            var error = new Error("create class fails");
            error.innerError = err;
            return next(error);
        }
        console.log("class is added %j", docs);
        return res.json(docs);
    });
});

router.patch('/:classID', function(req, res, next) {
    // booking can only added by post/delete 'api/booking?classID=xxx' 
    if (req.body.hasOwnProperty('booking')) {
        var error = new Error('booking can only added by API "api/booking?classID=xxx"');
        error.status = 400;
        return next(error);
    }

    // only below fields can be updated
    var EDIT_FIELDS = {
        name: 1,
        date: 1,
        capacity: 1,
        age: 1,
        classroom: 1,
        teacher: 1
    };

    //check any invalid field in the body
    for (var field in req.body) {
        if (!(field in EDIT_FIELDS)) {
            var error = new Error(`Invalid parameter "${field}" in class patch body`);
            error.status = 400;
            return next(error);
        }
    }

    convertDateObject(req.body);
    // save the teacher as reference object
    if (req.body.hasOwnProperty('teacher')) {
        req.body.teacher = req.body.teacher ? mongojs.ObjectId(req.body.teacher) : null;
    }
    var query = {
        _id: mongojs.ObjectId(req.params.classID)
    };

    var classes = req.db.collection("classes");
    classes.findAndModify({
        query: query,
        update: {
            $set: req.body
        },
        fields: NORMAL_FIELDS,
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("Update class fails");
            error.innerError = err;
            return next(error);
        }
        if (!doc) {
            var error = new Error('课程不存在，或没有权限执行此操作(修改已结束的课程)');
            error.status = 403;
            return next(error);
        }
        console.log("class %s is updated by %j", req.params.classID, req.body);
        res.json(doc);
    });
});

// remove a class or event which there is no booking
router.delete('/:classID', function(req, res, next) {
    var classes = req.db.collection("classes");
    var query = {
        _id: mongojs.ObjectId(req.params.classID),
        $or: [
            { booking: { $size: 0 } },
            { booking: null }
        ]
    };
    if (req.user.role !== "admin") {
        // non-admin could only remove the classes not startted
        query.date = {
            $gt: new Date()
        };
    }
    classes.remove(query, true, function(err, result) {
        console.log("remove result is %j", result);
        if (err) {
            var error = new Error("删除课程失败");
            error.innerError = err;
            return next(error);
        }
        if (result.n == 1) {
            // result is {"ok":1,"n":1,"deletedCount":1}
            console.log("class %s is deleted", req.params.classID);
            res.json(result);
        } else {
            // result is {"ok":1,"n":0,"deletedCount":0}
            console.log("can't find class %s to be deleted", req.params.classID);
            var error = new Error("不能删除已经预约的课程；店长不能删除已经开始的课程");
            error.status = 400;
            return next(error);
        }
    });
});

router.post('/:classID/books', function(req, res, next) {
    let classes = req.db.collection("classes");
    let rawbooks = Array.isArray(req.body) ? req.body : [req.body];
    let books = rawbooks.map(function(value, index, array) {
        return {
            title: value.title,
            info: value.info || undefined
        }
    })
    classes.findAndModify({
        query: {
            _id: mongojs.ObjectId(req.params.classID)
        },
        update: {
            $push: { books: { $each: books } }
        },
        fields: NORMAL_FIELDS,
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("add class's books fails");
            error.innerError = err;
            return next(error);
        }
        console.log("add %j books to class %s", req.body, req.params.classID);
        res.json(doc);
    });
});

router.delete('/:classID/books', function(req, res, next) {
    var classes = req.db.collection("classes");
    var booktoBeDeleted = req.body || {};
    classes.findAndModify({
        query: {
            _id: mongojs.ObjectId(req.params.classID)
        },
        update: {
            $pull: {
                books: booktoBeDeleted
            }
        },
        fields: NORMAL_FIELDS,
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("delete class's books fails");
            error.innerError = err;
            return next(error);
        }
        console.log("delete %j book from class %s", req.body, req.params.classID);
        res.json(doc);
    });
});

/**
 * booking:[{
 *     "member":"598dd2cf6c6da92830760a90",
 *     "quantity":1,
 *     "bookDate":"2018-04-08T13:40:20.279Z",
 *     "status": null (absent) || "checkin" || "absent",
 *     "flag": null || red || yellow || green
 * }]
 */
router.put('/:classID/checkin', function(req, res, next) {
    var classes = req.db.collection("classes");
    var memberToCheckin = req.body || {};

    if (!memberToCheckin.memberid) {
        var error = new Error('Check in fails due to memberid is missing');
        error.status = 400;
        return next(error);
    }

    classes.findOne({
        _id: mongojs.ObjectId(req.params.classID)
    }, { date: 1 }, function(err, doc) {
        if (err) {
            var error = new Error("Get class fails");
            error.innerError = err;
            return next(error);
        }

        var now = new Date();
        if (doc.date > now && req.user.role !== "admin") {
            var error = new Error("不能在课程开始前签到");
            error.status = 400;
            return next(error);
        }

        now.setHours(now.getHours() - 72);
        if (doc.date < now && req.user.role !== "admin") {
            var error = new Error("不能在课程开始72小时后签到");
            error.status = 400;
            return next(error);
        }

        classes.findAndModify({
            query: {
                _id: doc._id,
                'booking.member': mongojs.ObjectId(memberToCheckin.memberid)
            },
            update: {
                $set: {
                    'booking.$.status': memberToCheckin.status || 'checkin'
                }
            },
            fields: NORMAL_FIELDS,
            new: true
        }, function(err, doc, lastErrorObject) {
            if (err) {
                var error = new Error("class check-in fails");
                error.innerError = err;
                return next(error);
            }
            if (!doc) {
                var error = new Error('签到失败，会员未参加此课程');
                error.status = 400;
                return next(error);
            }
            console.log("class %s check-in by member %s", req.params.classID, memberToCheckin.memberid);
            res.json(doc);
        });
    });
});

router.put('/:classID/flag', function(req, res, next) {
    var classes = req.db.collection("classes");
    var memberToFlag = req.body || {};

    if (!memberToFlag.memberid) {
        var error = new Error('Flag fails due to memberid is missing');
        error.status = 400;
        return next(error);
    }

    classes.findAndModify({
        query: {
            _id: mongojs.ObjectId(req.params.classID),
            'booking.member': mongojs.ObjectId(memberToFlag.memberid)
        },
        update: {
            $set: {
                'booking.$.flag': memberToFlag.flag || null
            }
        },
        fields: NORMAL_FIELDS,
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("Add flag to booking fails");
            error.innerError = err;
            return next(error);
        }
        if (doc) {
            console.log("class %s flagged by member %s", req.params.classID, memberToFlag.memberid);
            res.json(doc);
        } else {
            var error = new Error('标旗失败，会员未参加此课程');
            error.status = 400;
            return next(error);
        }
    });
});

router.put('/:classID/comment', function(req, res, next) {
    var classes = req.db.collection("classes");
    var memberToComment = req.body || {};

    if (!memberToComment.memberid) {
        var error = new Error('Add comment fails due to memberid is missing');
        error.status = 400;
        return next(error);
    }

    classes.findAndModify({
        query: {
            _id: mongojs.ObjectId(req.params.classID),
            'booking.member': mongojs.ObjectId(memberToComment.memberid)
        },
        update: {
            $set: {
                'booking.$.comment': memberToComment.comment || ""
            }
        },
        fields: NORMAL_FIELDS,
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("Add comment to booking fails");
            error.innerError = err;
            return next(error);
        }
        if (doc) {
            console.log("class %s commented by member %s", req.params.classID, memberToComment.memberid);
            res.json(doc);
        } else {
            var error = new Error('备注失败，会员未参加此课程');
            error.status = 400;
            return next(error);
        }
    });
});

/**
 * make sure the datetime object is stored as ISODate
 * @param {Object} doc 
 */
function convertDateObject(doc) {
    if (!doc) {
        return doc;
    }
    // if date is null, then keep null value in mongodb
    if (doc.date) {
        doc.date = new Date(doc.date);
    }
    return doc;
}

module.exports = router;
