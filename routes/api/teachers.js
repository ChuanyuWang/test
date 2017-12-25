var express = require('express');
var router = express.Router();
var helper = require('../../helper');
var dbUtility = require('../../util');
var monk = require('monk');

var NORMAL_FIELDS = {
    name: 1,
    status: 1,
    contact: 1,
    brithday: 1,
    note: 1
};

router.use(helper.isAuthenticated);

router.get('/', function(req, res, next) {
    var teachers = dbUtility.connect3(req.tenant.name).get('teachers');
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

router.post('/', function(req, res, next) {
    if (!req.body.hasOwnProperty('name')) {
        var error = new Error("Missing param 'name'");
        error.status = 400;
        return next(error);
    }

    var db = dbUtility.connect3(req.tenant.name);

    convertDateObject(req.body);
    if (!req.body.hasOwnProperty('status'))
        req.body.status = 'inactive';
    delete req.body._id;

    var teachers = db.get("teachers");
    teachers.insert(req.body).then(function(docs) {
        console.log("teacher is added %j", docs);
        return res.json(docs);
    }).catch(function(err) {
        var error = new Error("fail to add teacher");
        error.innerError = err;
        return next(error);
    });
});

router.patch('/:teacherID', function(req, res, next) {
    var db = dbUtility.connect3(req.tenant.name);
    var teachers = db.get("teachers");
    convertDateObject(req.body);
    delete req.body._id;

    teachers.findOneAndUpdate({
        _id: monk.id(req.params.teacherID)
    }, {
        $set: req.body
    }, {
        projection: NORMAL_FIELDS,
        returnOriginal: false
    }).then(function(updatedDoc) {
        console.log("teacher %s is updated by %j", req.params.teacherID, req.body);
        return res.json(updatedDoc);
    }).catch(function(err) {
        var error = new Error("Update teacher fails");
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