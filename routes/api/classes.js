var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');


router.get('/', function (req, res) {
    if (!req.query.from || !req.query.to) {
        res.status(400).send("Missing param 'from' or 'to'");
        return;
    }

    var classes = req.db.collection("classes");
    var query = {
        date : {
            $gte : new Date(req.query.from),
            $lt : new Date(req.query.to)
        }
    };
    classes.find(query).sort({
        date : 1
    }, function (err, docs) {
        if (err) {
            res.status(500).json({
                'err' : err
            });
            return;
        }
        console.log("find classes with result %j", docs);
        res.json(docs);
    });
});

router.post('/', isAuthenticated, function (req, res) {
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

router.put('/:classID', isAuthenticated, function (req, res) {
    var classes = req.db.collection("classes");
    classes.update({
        _id : mongojs.ObjectId(req.params.classID)
    }, {
        $set : req.body
    }, function (err, result) {
        if (err) {
            res.status(500).json({
                'err' : err
            })
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
router.delete ('/:classID', isAuthenticated, function (req, res) {
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
            console.log("class %s is deteled", req.params.classID);
            res.json({});
        } else {
            res.status(400).json({
                'code' : 2008,
                'message' : "不能删除已经预约的课程或活动",
                'err' : err
            });
        }
    });
});

function isAuthenticated(req, res, next) {
    if (req.user && req.user.tenant == req.tenant.tenant) {
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

module.exports = router;
