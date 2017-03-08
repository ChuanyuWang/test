var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var util = require('../../util');
var helper = require('../../helper');

var NORMAL_FIELDS = {
    booking : 0
};

router.get('/', function (req, res, next) {
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

    if (!req.query.from || !req.query.to) {
        res.status(400).send("Missing param 'from' or 'to'");
        return;
    }

    var classes = tenantDB.collection("classes");
    var query = {
        date : {
            $gte : new Date(req.query.from),
            $lt : new Date(req.query.to)
        }
    };
    
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
    classes.find(query, NORMAL_FIELDS).sort({
        date : sort
    }, function (err, docs) {
        if (err) {
            res.status(500).json({
                'err' : err
            });
            return;
        }
        console.log("find classes: ", docs?docs.length:0);
        res.json(docs);
    });
});

/// Below APIs are visible to authenticated users only
router.all(helper.isAuthenticated);

router.post('/', helper.requireRole("admin"), function (req, res) {
    var classes = require("../../models/classes")(req.db);
    classes.insert(req.body, function (err, docs) {
        if (err) {
            res.status(500).json({
                'err' : err
            })
        } else {
            console.log("class is added %j", docs);
            res.json(docs);
        }
    });
});

router.put('/:classID', helper.requireRole("admin"), function (req, res) {
    var classes = req.db.collection("classes");
    classes.update({
        _id : mongojs.ObjectId(req.params.classID)
    }, {
        $set : req.body
    }, function (err, result) {
        if (err) {
            var error = new Error("Update class fails");
            error.innerError = err;
            next(error);
            return;
        } 
        if (result.n == 1) {
            console.log("class %s is updated by %j", req.params.classID, req.body);
        } else {
            console.error("class %s update fail by %s", req.params.classID, req.body);
        }
        res.json(result);
    });
});
// remove a class or event which reservation is zero
router.delete ('/:classID', helper.requireRole("admin"), function (req, res) {
    var classes = req.db.collection("classes");
    classes.remove({
        _id : mongojs.ObjectId(req.params.classID),
        reservation : {
            $lte : 0
        }
    }, true, function (err, result) {
        console.log("remove result is %j", result);
        if (err) {
            res.status(500).json({
                'err' : err
            });
            return;
        }
        if (result.n == 1) {
            console.log("class %s is deleted", req.params.classID);
            res.json(result);
        } else {
            res.status(400).json({
                'code' : 2008,
                'message' : "不能删除已经预约的课程或活动",
                'err' : err
            });
        }
    });
});

module.exports = router;