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
        "status": "inprogress",
        "remark": "summar only",
        "classroom": "room1",
        "members": [
            { "id": "123", "name": "Hellen" },
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
    req.body.status = '';

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

router.delete('/:courseID', function(req, res, next) {
    return next(new Error("Not implementation"));
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

module.exports = router;
