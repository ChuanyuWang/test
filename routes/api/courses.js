var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var helper = require('../../helper');
var reservation = require('./lib/reservation');

var NORMAL_FIELDS = {
    name: 1,
    status: 1,
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
            { "id": "123", "name": "Hellen", note:"only available in morning" },
            { "id": "456", "name": "Peter" }
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
        query["status"] = req.query.status;
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

router.post('/:courseID/members', function(req, res, next) {
    var courses = req.db.collection("courses");
    var added_members = Array.isArray(req.body) ? req.body : [req.body];
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
    var courses = req.db.collection("courses");
    var members = Array.isArray(req.body) ? req.body : [req.body];
    var ids = members.map(function(value, index, array) {
        return value.id;
    });
    courses.findAndModify({
        query: {
            _id: mongojs.ObjectId(req.params.courseID)
        },
        update: {
            $pull: {
                members: { id: { $in: ids } }
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
        removeCourseMembers(req.db, req.params.courseID, members, true);
        res.json(doc);
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
            value.courseID = req.params.courseID;
            if (value.hasOwnProperty("date")) {
                value["date"] = new Date(value["date"]);
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

router.delete('/:courseID/classes', function(req, res, next) {
    var classes = req.db.collection("classes");
    var items = Array.isArray(req.body) ? req.body : [req.body];
    var ids = items.map(function(value, index, array) {
        return mongojs.ObjectId(value.id);
    });
    classes.remove({
        _id: { $in: ids },
        courseID: req.params.courseID
    }, { justOne: false }, function(err, result) {
        if (err) {
            var error = new Error("delete course's classes fails");
            error.innerError = err;
            return next(error);
        }
        console.log("delete %j classes from course %s", req.body, req.params.courseID);
        res.json(result);
    });
});

router.delete('/:courseID', function(req, res, next) {
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
            courseID: req.params.courseID
        }, {
                justOne: false
            }, function(err, result) {
                if (err) {
                    console.error("delete course's classes fails");
                }
                console.log("delete classes of course %s", req.params.courseID);
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

function removeCourseMembers(db, courseID, members, onlyLatter) {
    var ids = members.map(function(val, index, array) {
        return val.id;
    });
    db.collection('classes').update({
        'courseID': courseID,
        date: { $gte: new Date() }
    }, {
            $pull: {
                booking: {
                    member: { $in: ids }
                }
            }
        }, { multi: true }, function(err, result) {
            if (err) {
                return console.error(err);
            }
            console.log(result);
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
        'courseID': courseID,
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
            bulk1.find({ _id: mongojs.ObjectId(memberID) }).updateOne({
                $inc: { "membership.0.credit": -res.expense }
            });
        }
    });
    bulk1.execute(function(err, res) {
        //TODO, handle error
        if (err) console.error(err);
        else console.log(`deduct the expense from membership card with ${res}`);
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
        else console.log(`add booking info into classes with ${res}`);
        callback(null, res)
    });
}

module.exports = router;
