var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var helper = require('../../helper');

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
    // query courses by status
    if (req.query.hasOwnProperty('status')) {
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
    var members = Array.isArray(req.body) ? req.body : [req.body];
    courses.findAndModify({
        query: {
            _id: mongojs.ObjectId(req.params.courseID)
        },
        update: {
            $push: { members: { $each: members } }
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
        addCourseMembers(req.db, req.params.courseID, members, true);
        res.json(doc);
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

    courses.findOne({
        _id: mongojs.ObjectId(req.params.courseID)
    }, NORMAL_FIELDS, function(err, doc) {
        if (err) {
            var error = new Error("Get course fails");
            error.innerError = err;
            return next(error);
        }
        if (!doc) {
            var error = new Error("Course doesn't exist");
            error.status = 400;
            return next(error);
        }
        if (doc.status == 'closed') {
            var error = new Error("班级已经结束，不能添加课程");
            error.status = 400;
            return next(error);
        }

        var members = doc.members || [];
        var classes = items.map(function(value, index, array) {
            value.courseID = req.params.courseID;
            if (value.hasOwnProperty("date")) {
                value["date"] = new Date(value["date"]);
            }
            value.cost = value.cost || 0;
            value.capacity = value.capacity || 8;
            value.booking = value.booking || [];
            members.forEach(function(m, index, array) {
                value.booking.push({
                    member: m.id,
                    quantity: 1,
                    bookDate: new Date()
                })
            });
            return value;
        });
        if (classes.length === 0) {
            // none classes needed to be created
            return res.json([]);
        }
        req.db.collection("classes").insert(classes, function(err, docs) {
            if (err) {
                var error = new Error("add course's classes fails");
                error.innerError = err;
                return next(error);
            }
            console.log("add %j classes to course %s", classes, req.params.courseID);
            res.json(docs);
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
    }, {
        justOne: false
    }, function(err, result) {
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
    }, {
        justOne: true
    }, function(err, result) {
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
            var error = new Error("can't find course %s and delete it", req.params.courseID);
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
};

function removeCourseMembers(db, courseID, members, onlyLatter) {
    var ids = members.map(function(val, index, array) {
        return val.id;
    });
    db.collection('classes').update({
        'courseID': courseID,
        date: {
            $gte: new Date()
        }
    }, {
        $pull: {
            booking: {
                member: { $in: ids }
            }
        }
    }, function(err, result) {
        if (err) {
            return console.error(err);
        }
        console.log(result);
    });
};

function addCourseMembers(db, courseID, members, onlyLatter) {
    var ids = members.map(function(val, index, array) {
        return val.id;
    });
    var bookings = members.map(function(val, index, array) {
        return {
            'member': val.id,
            'quantity': 1,
            'bookDate': new Date()
        };
    });
    db.collection('classes').update({
        'courseID': courseID,
        date: {
            $gte: new Date()
        }
    }, {
        $pull: {
            booking: {
                member: { $in: ids }
            }
        }
    }, function(err, result) {
        if (err) {
            return console.error(err);
        }
        console.log(result);
        db.collection('classes').update({
            'courseID': courseID,
            date: { $gte: new Date() }
        }, {
            $push: {
                booking: {
                    $each: bookings
                }
            }
        }, function(err, result) {
            if (err) {
                return console.error(err);
            }
            console.log(result);
        });
    });
};

module.exports = router;
