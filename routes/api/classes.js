var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var util = require('../../util');
var helper = require('../../helper');

var NORMAL_FIELDS = {
    name: 1,
    date: 1,
    courseID: 1,
    cost: 1,
    capacity: 1,
    age: 1,
    classroom: 1,
    booking: 1,
    books: 1
};

router.get('/', function(req, res, next) {
    var tenantDB = null;
    if (req.query.hasOwnProperty('tenant')) {
        tenantDB = util.connect(req.query.tenant);
    } else if (req.db) {
        // initialize the tenant db if it's authenticated user
        tenantDB = req.db;
    } else {
        var err = new Error("Missing param 'tenant'");
        err.status = 400;
        return next(err);
    }

    var query = {};
    if (req.query.hasOwnProperty('from') && req.query.hasOwnProperty('to')) {
        query.date = {
            $gte: new Date(req.query.from),
            $lt: new Date(req.query.to)
        };
    } else if (req.query.hasOwnProperty('courseID')) {
        // query specific course
        query['courseID'] = req.query.courseID ? req.query.courseID : null;
    } else {
        res.status(400).send('Missing param "from", "to" or "coureID"');
        return;
    }

    // be defaul the sort is 'asc'
    var sort = req.query.order == 'desc' ? -1 : 1;
    // query specific classroom
    if (req.query.hasOwnProperty('classroom')) {
        query['classroom'] = req.query.classroom ? req.query.classroom : null;
    }
    // get all classes booked by this member
    if (req.query.memberid) {
        query['booking.member'] = req.query.memberid;
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
             {'age.min': { $gte : parseInt(req.query.minAge * 12) }},
             {'age.min': null},
             {'age.min': 0}
        ];
    }
    var classes = tenantDB.collection("classes");
    classes.find(query, NORMAL_FIELDS).sort({
        date: sort
    }, function(err, docs) {
        if (err) {
            res.status(500).json({
                'err': err
            });
            return;
        }
        console.log("find classes: ", docs ? docs.length : 0);
        res.json(docs);
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

/// Below APIs are visible to authenticated users only
router.use(helper.isAuthenticated);

router.post('/', helper.requireRole("admin"), function(req, res) {
    var classes = require("../../models/classes")(req.db);
    classes.insert(req.body, function(err, docs) {
        if (err) {
            res.status(500).json({
                'err': err
            })
        } else {
            console.log("class is added %j", docs);
            res.json(docs);
        }
    });
});

router.patch('/:classID', helper.requireRole("admin"), function(req, res) {
    // booking can only added by post/delete 'api/booking?classID=xxx' 
    if (req.body.hasOwnProperty('booking')) {
        var error = new Error('booking can only added by API "api/booking?classID=xxx"');
        error.status = 400;
        return next(error);
    }
    convertDateObject(req.body);
    var classes = req.db.collection("classes");
    classes.findAndModify({
        query: {
            _id: mongojs.ObjectId(req.params.classID)
        },
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
        console.log("class %s is updated by %j", req.params.classID, req.body);
        res.json(doc);
    });
});

// remove a class or event which there is no booking
router.delete('/:classID', helper.requireRole("admin"), function(req, res, next) {
    var classes = req.db.collection("classes");
    classes.remove({
        _id: mongojs.ObjectId(req.params.classID),
        $or: [
            { booking: { $size : 0 } },
            { booking: null }
        ]
    }, true, function(err, result) {
        console.log("remove result is %j", result);
        if (err) {
            var error = new Error("删除课程失败");
            error.innerError = err;
            return next(error);
        }
        if (result.n == 1) {
            console.log("class %s is deleted", req.params.classID);
            res.json(result);
        } else {
            console.log("can't find class %s to be deleted", req.params.classID);
            var error = new Error("不能删除已经预约的课程或活动");
            error.status = 400;
            return next(error);
        }
    });
});

router.post('/:classID/books', function(req, res, next) {
    var classes = req.db.collection("classes");
    var books = Array.isArray(req.body) ? req.body : [req.body];
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
};

module.exports = router;