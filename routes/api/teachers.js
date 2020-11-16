var express = require('express');
var router = express.Router();
var helper = require('../../helper');
var dbUtility = require('../../util');
const mongoist = require('mongoist');

var NORMAL_FIELDS = {
    name: 1,
    status: 1,
    contact: 1,
    brithday: 1,
    note: 1
};

router.use(helper.isAuthenticated);

router.get('/', function(req, res, next) {
    const teachers = dbUtility.connect4(req.db).collection('teachers');
    var query = {};
    if (req.query.hasOwnProperty('name')) {
        query['name'] = req.query.name;
    }
    // query by status only if status query is defined and not null
    if (req.query.status) {
        query["status"] = req.query.status;
    }
    teachers.find(query, NORMAL_FIELDS).then(function(docs) {
        console.log("find teachers: ", docs ? docs.length : 0);
        return res.json(docs);
    }).catch(function(err) {
        var error = new Error("Get teachers fails");
        error.innerError = err;
        return next(error);
    });
});

router.post('/', helper.requireRole("admin"), function(req, res, next) {
    if (!req.body.hasOwnProperty('name')) {
        var error = new Error("Missing param 'name'");
        error.status = 400;
        return next(error);
    }

    const db = dbUtility.connect4(req.tenant.name);

    convertDateObject(req.body);
    if (!req.body.hasOwnProperty('status'))
        req.body.status = 'inactive';
    delete req.body._id;

    var teachers = db.collection("teachers");
    teachers.insert(req.body).then(function(docs) {
        console.log("teacher is added %j", docs);
        return res.json(docs);
    }).catch(function(err) {
        var error = new Error("fail to add teacher");
        error.innerError = err;
        return next(error);
    });
});

router.patch('/:teacherID', helper.requireRole("admin"), function(req, res, next) {
    const db = dbUtility.connect4(req.tenant.name);
    var teachers = db.collection("teachers");
    convertDateObject(req.body);
    delete req.body._id;

    teachers.findAndModify({
        query: {
            _id: mongoist.ObjectId(req.params.teacherID)
        },
        update: {
            $set: req.body
        },
        fields: NORMAL_FIELDS,
        new: true
    }).then(function(updatedDoc) {
        if (updatedDoc) {
            console.log("teacher %s is updated by %j", req.params.teacherID, req.body);
            return res.json(updatedDoc);
        } else {
            var err = new Error("Teacher not found");
            err.status = 400;
            return next(err);
        }
    }).catch(function(err) {
        var error = new Error("Update teacher fails");
        error.innerError = err;
        return next(error);
    });
});

router.delete('/:teacherID', helper.requireRole("admin"), function(req, res, next) {
    const db = dbUtility.connect4(req.tenant.name);
    const classes = db.collection('classes');
    classes.findOne({ teacher: mongoist.ObjectId(req.params.teacherID) }, { 'name': 1 }).then(function(doc) {
        let teachers = db.collection("teachers");
        if (doc) {
            // set the teacher's status as 'deleted' if any class exists
            return teachers.findAndModify({
                query: {
                    _id: mongoist.ObjectId(req.params.teacherID)
                },
                update: {
                    $set: { 'status': "deleted" }
                },
                fields: NORMAL_FIELDS,
                new: true
            }).then(function(doc) {
                console.log("teacher %s is marked as deleted", req.params.teacherID);
                return doc;
            });
        } else {
            return teachers.remove({ _id: mongoist.ObjectId(req.params.teacherID) }, {
                justOne: true
            }).then(function(result) {
                // result == {"ok":1,"n":1, "deletedCount":1}
                console.log("teacher %s is deleted", req.params.teacherID);
                return result;
            });
        }
    }).then(function(result) {
        return res.json(result);
    }).catch(function(err) {
        var error = new Error("Delete teacher fails");
        error.innerError = err;
        return next(error);
    });
});

/**
 * make sure the datetime object is stored as ISODate
 * @param {Object} doc 
 */
function convertDateObject(doc) {
    if (!doc) return doc;
    if (doc.hasOwnProperty("birthday")) {
        doc["birthday"] = new Date(doc["birthday"]);
    }
    return doc;
}

module.exports = router;
