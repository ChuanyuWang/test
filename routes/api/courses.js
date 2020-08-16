var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var helper = require('../../helper');
var reservation = require('./lib/reservation');

var NORMAL_FIELDS = {
    name: 1,
    status: 1, //"active"|"closed"
    classroom: 1,
    createDate: 1,
    remark: 1,
    members: 1
};

// Below APIs are visible to anonymous users

/// Below APIs are visible to authenticated users only
router.use(helper.isAuthenticated);

/**
 * {
        "_id": "1",
        "name": "123",
        "createDate": "2017-02-26T02:00:00Z",
        "date": "2017-02-27T02:00:00Z",
        "status": "active|closed",
        "remark": "summar only",
        "classroom": "room1",
        "members": [
            { "id": ObjectID("123"), "name": "Hellen", note:"only available in morning" },
            { "id": ObjectID("456"), "name": "Peter" }
        ]
    }
 */
router.get('/', function(req, res, next) {
    var courses = req.db.collection("courses");
    var query = {};
    if (req.query.hasOwnProperty('name')) {
        query['name'] = req.query.name;
    }
    // query courses by status only if status query is defined and not null
    if (req.query.status) {
        query['status'] = {
            $in: req.query.status.split(',').map(function(value) {
                return value ? value : null;
            })
        };
    }
    courses.find(query, NORMAL_FIELDS, function(err, docs) {
        if (err) {
            var error = new Error("Get courses fails");
            error.innerError = err;
            return next(error);
        }
        console.log("find courses: ", docs ? docs.length : 0);
        res.json(docs);
    });
});

router.get('/:courseID', function(req, res, next) {
    var courses = req.db.collection("courses");
    courses.findOne({
        _id: mongojs.ObjectId(req.params.courseID)
    }, NORMAL_FIELDS, function(err, doc) {
        if (err) {
            var error = new Error("Get course fails");
            error.innerError = err;
            return next(error);
        }
        console.log("find course %j", doc);
        res.json(doc);
    });
});

// get the course members with name
router.get('/:courseID/members', function(req, res, next) {
    var courses = req.db.collection("courses");
    courses.aggregate([
        {
            $match: { _id: mongojs.ObjectId(req.params.courseID) }
        }, {
            $unwind: "$members"
        }, {
            $lookup: {
                from: "members",
                localField: "members.id",
                foreignField: "_id",
                as: "member"
            }
        }, {
            $project: {
                "member.name": 1,
                "members": 1
            }
        }
    ], function(err, docs) {
        if (err) {
            var error = new Error("Get course members fails");
            error.innerError = err;
            return next(error);
        }
        console.log("get course members: %j", docs ? docs.length : 0);
        if (!docs || docs.length === 0) {
            return res.json({
                _id: req.params.courseID,
                members: []
            });
        }
        var members = docs.map(function name(value, index, array) {
            return {
                id: value.members.id,
                // display the cached member name if member is deleted
                name: value.member.length > 0 ? value.member[0].name : value.members.name
            }
        });
        res.json({
            _id: req.params.courseID,
            members: members
        });
    });
});

router.post('/:courseID/members', function(req, res, next) {
    var courses = req.db.collection("courses");
    var added_members = Array.isArray(req.body) ? req.body : [req.body];
    added_members = added_members.map(function(value, index, array) {
        value.id = mongojs.ObjectId(value.id);
        return value;
    });
    courses.findAndModify({
        query: {
            _id: mongojs.ObjectId(req.params.courseID)
        },
        update: {
            $push: { members: { $each: added_members } }
        },
        fields: NORMAL_FIELDS,
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("add course's members fails");
            error.innerError = err;
            return next(error);
        }
        console.log("add %j members to course %s", req.body, req.params.courseID);
        getCourseClasses(req.params.courseID, req.db.collection('classes'), function(error, classes) {
            if (error) return next(error);
            getCourseMemebers(added_members, req.db.collection('members'), function(error, members) {
                if (error) return next(error);

                var result = reservation.add(members, classes, 1, true);
                createReservation(req.db, result, function(error, addedClasses) {
                    res.json({ "updateClasses": classes, "result": result });
                });
            });
        });
    });
});

router.delete('/:courseID/members', function(req, res, next) {
    if (!req.body.hasOwnProperty('id')) {
        var error = new Error('Missing param "id"');
        error.status = 400;
        return next(error);
    }
    //TODO, support remove multi members
    var memberIDs = [mongojs.ObjectId(req.body.id)];
    var courses = req.db.collection("courses");
    courses.findAndModify({
        query: {
            _id: mongojs.ObjectId(req.params.courseID)
        },
        update: {
            $pull: {
                members: { id: { $in: memberIDs } }
            }
        },
        fields: NORMAL_FIELDS,
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("delete course's members fails");
            error.innerError = err;
            return next(error);
        }
        console.log("delete %j members from course %s", req.body, req.params.courseID);
        removeCourseMember(req.db, req.params.courseID, memberIDs[0], function(error, result) {
            if (error) return next(error);
            res.json(doc);
        });
    });
});

router.post('/:courseID/classes', function(req, res, next) {
    var courses = req.db.collection("courses");
    var items = Array.isArray(req.body) ? req.body : [req.body];
    // none classes needed to be created
    if (items.length === 0) return res.json([]);

    getCourse(req.params.courseID, courses, function(error, doc) {
        if (error) return next(error);

        if (doc.status == 'closed') {
            var error = new Error("班级已经结束，不能添加课程");
            error.status = 400;
            return next(error);
        }
        // create new added classes
        var added_classes = items.map(function(value, index, array) {
            value.courseID = doc._id;
            if (value.hasOwnProperty("date")) {
                value["date"] = new Date(value["date"]);
            }
            if (value.teacher) {
                // save the teacher property as object reference
                value["teacher"] = mongojs.ObjectId(value["teacher"]);
            }
            value.cost = value.cost || 0;
            value.capacity = value.capacity || 8;
            value.booking = []; // clear the booking for new added course's classes
            return value;
        });
        req.db.collection('classes').insert(added_classes, function(err, docs) {
            if (err) {
                var error = new Error("add course's classes fails");
                error.innerError = err;
                return next(error);
            }
            console.log("add %j classes to course %s", docs, req.params.courseID);
            // Get course members for adding reservation
            getCourseMemebers(doc.members, req.db.collection('members'), function(error, members) {
                if (error) return next(error);

                var result = reservation.add(members, docs, 1, true);
                createReservation(req.db, result, function(error, addedClasses) {
                    res.json({ "addedClasses": docs, "result": result });
                });
            });
        });
    });
});

/// Below APIs are only visible to authenticated users with 'admin' role
router.use(helper.requireRole("admin"));

router.post('/', function(req, res, next) {
    if (!req.body.hasOwnProperty('name')) {
        var error = new Error("Missing param 'name'");
        error.status = 400;
        return next(error);
    }
    convertDateObject(req.body);
    req.body.status = 'active';

    var courses = req.db.collection("courses");
    courses.insert(req.body, function(err, docs) {
        if (err) {
            var error = new Error("fail to add course");
            error.innerError = err;
            next(error);
        } else {
            console.log("course is added %j", docs);
            res.json(docs);
        }
    });
});

router.patch('/:courseID', function(req, res, next) {
    var courses = req.db.collection("courses");
    convertDateObject(req.body);

    // members can only added by post 'courses/:id/members' 
    if (req.body.hasOwnProperty('members')) {
        var error = new Error('members can only added by API "courses/:id/members"');
        error.status = 400;
        return next(error);
    }

    courses.findAndModify({
        query: {
            _id: mongojs.ObjectId(req.params.courseID)
        },
        update: {
            $set: req.body
        },
        fields: NORMAL_FIELDS,
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("Update course fails");
            error.innerError = err;
            return next(error);
        }
        console.log("course %s is updated by %j", req.params.courseID, req.body);
        res.json(doc);
    });
});

router.delete('/:courseID/classes', function(req, res, next) {
    if (!req.body.hasOwnProperty('id')) {
        var error = new Error('Missing param "id"');
        error.status = 400;
        return next(error);
    }
    //TODO, support remove multi members
    var classIDs = [req.body.id];
    var classes = req.db.collection("classes");
    classes.findAndModify({
        query: {
            _id: mongojs.ObjectId(classIDs[0])
        },
        remove: true,
        new: false
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("delete course's classes fails");
            error.innerError = err;
            return next(error);
        }
        console.log("delete classes %j from course %s", req.body, req.params.courseID);
        if (doc && doc.cost > 0) {
            var booking = doc.booking || [];
            if (booking.length === 0) return res.json(doc);

            // return the cost to membership card
            var bulk1 = req.db.collection('members').initializeUnorderedBulkOp();
            booking.forEach(function(booking_item) {
                console.log("return %f credit to member %s", doc.cost * booking_item.quantity, booking_item.member);
                bulk1.find({ _id: booking_item.member }).updateOne({
                    $inc: { "membership.0.credit": doc.cost * booking_item.quantity }
                });
            });
            bulk1.execute(function(err, result) {
                // result is {"writeErrors":[],"writeConcernErrors":[],"nInserted":0,"nUpserted":1,
                // "nMatched":0,"nModified":0,"nRemoved":0,"upserted":[],"ok":1}
                //TODO, handle error
                if (err) console.error(err);
                else console.log("return the cost to membership card with %j", result);
            });
        }
        return res.json(doc);
    });
});

router.delete('/:courseID', function(req, res, next) {
    req.db.collection('classes').find({
        'courseID': mongojs.ObjectId(req.params.courseID),
        'cost': { $gt: 0 },
        'booking.0': { $exists: true }
    }, { 'booking': 1, 'cost': 1 }, function(err, docs) {
        if (err) {
            var error = new Error(`query classes of course ${req.params.courseID} fails`);
            error.innerError = err;
            return next(error);
        }

        if (docs && docs.length > 0) {
            var error = new Error(`无法删除班级，班级中包含已经预约的付费课程，请取消后再尝试删除`);
            error.status = 400;
            return next(error);
        }

        var courses = req.db.collection("courses");
        courses.remove({
            _id: mongojs.ObjectId(req.params.courseID)
        }, { justOne: true }, function(err, result) {
            if (err) {
                var error = new Error("delete course fails");
                error.innerError = err;
                return next(error);
            }

            // remove all classes with courseID
            req.db.collection("classes").remove({
                courseID: mongojs.ObjectId(req.params.courseID)
            }, { justOne: false }, function(err, result) {
                // result is {"n":0,"ok":1,"deletedCount":0}
                if (err) console.error("delete course's classes fails");
                else console.log("delete classes of course %s with result %j", req.params.courseID, result);
            });
            // check the result and respond
            if (result.n == 1) {
                console.log("course %s is deleted", req.params.courseID);
                res.json(result);
            } else {
                console.log("can't find course %s to be deleted", req.params.courseID);
                var error = new Error("can't find course to be deleted");
                error.status = 400;
                return next(error);
            }
        });
    });
});

/**
 * make sure the datetime object is stored as ISODate
 * @param {Object} doc 
 */
function convertDateObject(doc) {
    if (!doc) return doc;
    if (doc.hasOwnProperty("createDate")) {
        doc["createDate"] = new Date(doc["createDate"]);
    }
    return doc;
}

function removeCourseMember(db, courseID, memberID, callback) {
    db.collection('classes').find({
        'courseID': mongojs.ObjectId(courseID),
        date: { $gte: new Date() },
        'booking.member': mongojs.ObjectId(memberID)
    }, function(err, docs) {
        if (err) return callback(new Error(`Get course classes of ${memberID} fail`));

        var expense = 0;
        docs.forEach(function(cls, index, array) {
            if (cls.cost > 0) {
                var bookings = cls.booking || [];
                var booking_item = bookings.find(function(val) {
                    return val.member.toString() == memberID;
                });
                expense += cls.cost * booking_item.quantity;
            }
        });
        if (expense > 0) {
            // return the cost to membership card
            db.collection('members').findAndModify({
                query: {
                    _id: mongojs.ObjectId(memberID)
                },
                update: {
                    $inc: { "membership.0.credit": expense }
                },
                fields: { name: 1, membership: 1 },
                new: true
            }, function(err, doc, lastErrorObject) {
                //TODO, handle error
                if (err) console.error(err);
                if (doc) console.log("return %f credit to member %s (after: %j)", expense, memberID, doc.membership);
                else console.log(`member ${memberID} doesn't exist`)
            });
        }
        if (docs.length > 0) {
            // cancel the booking reservation
            db.collection('classes').update({
                'courseID': mongojs.ObjectId(courseID),
                date: { $gte: new Date() }
            }, { $pull: { booking: { member: mongojs.ObjectId(memberID) } } }, { multi: true }, function(err, result) {
                //TODO, handle error
                if (err) console.error(err);
                return callback(null, result);
            });
        } else {
            return callback(null, {});
        }
    });
}

function getCourse(id, collection, callback) {
    collection.findOne({
        _id: mongojs.ObjectId(id)
    }, NORMAL_FIELDS, function(err, doc) {
        if (err) {
            var error = new Error("Get course fails");
            error.innerError = err;
            return callback(error);
        }
        if (!doc) {
            var error = new Error("Course doesn't exist");
            error.status = 400;
            return callback(error);
        }

        return callback(null, doc);
    });
}

function getCourseMemebers(merberIDs, membersCol, callback) {
    var course_members = merberIDs || [];
    if (course_members.length == 0) return callback(null, []);
    var memberIDs = course_members.map(function(value, index, array) {
        return mongojs.ObjectId(value.id);
    });
    membersCol.find({
        _id: { $in: memberIDs }
    }, { name: 1, birthday: 1, status: 1, membership: 1 }, function(err, members) {
        if (err) {
            var error = new Error("get course's members fails");
            error.innerError = err;
            return callback(error);
        }
        return callback(null, members);
    });
}

function getCourseClasses(courseID, classesCol, callback) {
    classesCol.find({
        'courseID': mongojs.ObjectId(courseID),
    }, function(err, docs) {
        if (err) {
            var error = new Error("get course's classes fails");
            error.innerError = err;
            return callback(error);
        }
        return callback(null, docs);
    });
}

function createReservation(db, result, callback) {
    //deduct the expense from membership card
    var bulk1 = db.collection('members').initializeUnorderedBulkOp();
    Object.keys(result.memberSummary).forEach(function(memberID) {
        var res = result.memberSummary[memberID];
        if (res.expense > 0) {
            console.log("deduct %f credit from member %s", res.expense, memberID);
            bulk1.find({ _id: mongojs.ObjectId(memberID) }).updateOne({
                $inc: { "membership.0.credit": -res.expense }
            });
        }
    });
    bulk1.execute(function(err, res) {
        //TODO, handle error
        if (err) console.error(err);
        else console.log("deduct the expense from membership card with %j", res);
    });
    //add the booking info into corresponding classes
    var bulk2 = db.collection('classes').initializeUnorderedBulkOp();
    Object.keys(result.classSummary).forEach(function(classID) {
        var res = result.classSummary[classID];
        if (res.newbookings.length > 0) {
            bulk2.find({ _id: mongojs.ObjectId(classID) }).updateOne({
                $push: { booking: { $each: res.newbookings } }
            });
        }
    });
    bulk2.execute(function(err, res) {
        //TODO, handle error
        if (err) console.error(err);
        else console.log("add booking info into classes with %j", res);
        callback(null, res)
    });
}

module.exports = router;
