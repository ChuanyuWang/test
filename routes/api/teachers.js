var express = require('express');
var router = express.Router();
var helper = require('../../helper');
const { ObjectId } = require('mongodb');
const { BadRequestError, ParamError, RuntimeError } = require('./lib/basis');

var NORMAL_FIELDS = {
    name: 1,
    status: 1,
    contact: 1,
    brithday: 1,
    note: 1
};

router.get('/', async function(req, res, next) {
    if (!req.tenant) {
        return next(new BadRequestError("tenant is not defined"));
    }

    let query = {};
    if (req.query.hasOwnProperty('name')) {
        query['name'] = req.query.name;
    }
    // query by status only if status query is defined and not null
    if (req.query.status) {
        query["status"] = req.query.status;
    }

    try {
        let teachers = req.db.collection("teachers");
        let cursor = teachers.find(query, { projection: NORMAL_FIELDS });
        let docs = await cursor.toArray();
        console.log("find teachers: ", docs ? docs.length : 0);
        return res.json(docs);
    } catch (error) {
        return next(new RuntimeError("Get teachers fails", error));
    }
});

router.use(helper.isAuthenticated);

router.post('/', helper.requireRole("admin"), async function(req, res, next) {
    if (!req.body.hasOwnProperty('name')) {
        return next(new ParamError("Missing param 'name'"));
    }

    convertDateObject(req.body);
    if (!req.body.hasOwnProperty('status'))
        req.body.status = 'inactive';
    delete req.body._id;

    try {
        let teachers = req.db.collection("teachers");
        let result = await teachers.insertOne(req.body);
        if (result.acknowledged) {
            console.log("teacher is added %j", req.body);
            return res.json(req.body);
        } else {
            return next(new BadRequestError('添加老师失败'));
        }
    } catch (error) {
        return next(new RuntimeError("添加老师失败", error));
    }
});

router.patch('/:teacherID', helper.requireRole("admin"), async function(req, res, next) {
    convertDateObject(req.body);
    delete req.body._id;

    try {
        let teachers = req.db.collection("teachers");
        let result = await teachers.findOneAndUpdate({
            _id: ObjectId(req.params.teacherID)
        }, {
            $set: req.body
        }, {
            projection: NORMAL_FIELDS,
            returnDocument: "after"
        });

        if (result.value) {
            console.log("teacher %s is updated by %j", req.params.teacherID, req.body);
            return res.json(result.value);
        } else {
            return next(new BadRequestError("Teacher not found"));
        }
    } catch (error) {
        return next(new RuntimeError("Update teacher fails", error));
    }
});

router.delete('/:teacherID', helper.requireRole("admin"), async function(req, res, next) {
    try {
        let classes = req.db.collection("classes");
        let teachers = req.db.collection("teachers");
        const doc = await classes.findOne({ teacher: ObjectId(req.params.teacherID) }, { projection: { 'name': 1 } });
        if (doc) {
            // set the teacher's status as 'deleted' if any class exists
            let result = await teachers.findOneAndUpdate(
                { _id: ObjectId(req.params.teacherID) },
                { $set: { 'status': "deleted" } },
                { projection: NORMAL_FIELDS, returnDocument: "after" }
            );
            // result == {"ok":1, "value":{}, "lastErrorObject":{}}
            if (result.value) {
                console.log("teacher %s is marked as deleted", req.params.teacherID);
                return res.json(result.value);
            }
        } else {
            let result = await teachers.findOneAndDelete({ _id: ObjectId(req.params.teacherID) })
            // result == {"ok":1, "value":{}, "lastErrorObject":{}}
            if (result.value) {
                console.log("teacher %s is deleted", req.params.teacherID);
                return res.json({ deletedCount: 1 });
            }
        }
        console.log("Fail to delete teacher %s, not found", req.params.teacherID);
        return next(new BadRequestError("Teacher not found"));
    } catch (error) {
        return next(new RuntimeError("Delete teacher fails", error));
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
