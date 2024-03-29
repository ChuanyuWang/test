var express = require('express');
var router = express.Router();
var helper = require('../../helper');
const mongoist = require('mongoist');

var NORMAL_FIELDS = {
    name: 1,
    status: 1,
    contact: 1,
    brithday: 1,
    note: 1
};

router.get('/', function(req, res, next) {
    if (!req.tenant) {
        let error = new Error("tenant is not defined");
        error.status = 400;
        return next(error);
    }

    const teachers = mongoist(req.db).collection('teachers');
    let query = {};
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
        let error = new Error("Get teachers fails");
        error.innerError = err;
        return next(error);
    });
});

router.use(helper.isAuthenticated);

router.post('/', helper.requireRole("admin"), function(req, res, next) {
    if (!req.body.hasOwnProperty('name')) {
        var error = new Error("Missing param 'name'");
        error.status = 400;
        return next(error);
    }

    const db = mongoist(req.db);

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
    const db = mongoist(req.db);
    var teachers = db.collection("teachers");
    convertDateObject(req.body);
    delete req.body._id;

    teachers.findAndModify({
        query: { _id: mongoist.ObjectId(req.params.teacherID) },
        update: { $set: req.body },
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

router.delete('/:teacherID', helper.requireRole("admin"), async function(req, res, next) {
    try {
        const db = mongoist(req.db);
        const doc = await db.classes.findOne({ teacher: mongoist.ObjectId(req.params.teacherID) }, { 'name': 1 });
        if (doc) {
            // set the teacher's status as 'deleted' if any class exists
            const deletedOne = await db.teachers.findAndModify({
                query: { _id: mongoist.ObjectId(req.params.teacherID) },
                update: { $set: { 'status': "deleted" } },
                fields: NORMAL_FIELDS,
                new: true
            });
            console.log("teacher %s is marked as deleted", req.params.teacherID);
            return res.json(deletedOne);
        } else {
            const result = await db.teachers.remove({ _id: mongoist.ObjectId(req.params.teacherID) }, { justOne: true })
            // result == {"ok":1,"n":1, "deletedCount":1}
            console.log("teacher %s is deleted", req.params.teacherID);
            return res.json(result);
        }
    } catch (err) {
        var error = new Error("Delete teacher fails");
        error.innerError = err;
        return next(error);
    }
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
