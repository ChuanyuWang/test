var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');

router.get('/', isAuthenticated, function (req, res) {
    var opportunities = req.db.collection("opportunities");
    var query = {};
    if (req.query.name) {
        query['name'] = req.query.name;
    }
    if (req.query.contact) {
        query['contact'] = req.query.contact;
    }
    opportunities.find(query).sort({
        since : -1
    }, function (err, docs) {
        if (err) {
            res.status(500).json({
                'err' : err
            });
            return;
        }
        console.log("find opportunities with result %j", docs);
        res.json(docs);
    });
});

router.put('/:opportunityID', isAuthenticated, function (req, res) {
    var opportunities = req.db.collection("opportunities");

    initDateField(req.body);

    opportunities.update({
        _id : mongojs.ObjectId(req.params.opportunityID)
    }, {
        $set : req.body
    }, function (err, result) {
        if (err) {
            res.status(500).json({
                'err' : err
            });
            return;
        } 
        if (result.n == 1) {
            console.log("opportunity %s is updated by %j", req.params.opportunityID, req.body);
        } else {
            console.error("opportunity %s update fail by %s", req.params.opportunityID, req.body);
        }
        res.json(result);
    });
});

router.post('/', function (req, res) {
    if (!req.body.name || !req.body.contact) {
        res.status(400).send("Missing param 'name' or 'contact'");
        return;
    }
    var query = {
        name : req.body.name,
        contact : req.body.contact
    };
    
    initDateField(req.body);

    var opportunities = req.db.collection("opportunities");
    opportunities.update(query, req.body, {upsert:true}, function (err, result) {
        if (err) {
            var error = new Error('Add opportunity fails with error');
            error.innerError = err;
            return next(error);
        } else {
            // result is object, e.g.
            // {"ok":1,"nModified":0,"n":1,"upserted":[{"index":0,"_id":"577a77651b298d2b68bfb1c6"}]}
            console.log("opportunity is added with result %j", result);
            res.json(result);
        }
    });
});

router.delete ('/:memberID', isAuthenticated, function (req, res) {
    //TODO
    return next(new Error("Not implementation"));
    
    var members = req.db.collection("members");
    members.remove({
        _id : mongojs.ObjectId(req.params.memberID)
    }, true, function (err, result) {
        if (err) {
            res.status(500).json({
                'err' : err
            });
            return;
        } 
        if (result.n == 1) {
            console.log("member %s is deteled", req.params.memberID);

            var classes = req.db.collection("classes");
            classes.find({
                "booking.member" : req.params.memberID
            }, function (err, docs) {
                if (err) {
                    console.error(err);
                } else {
                    var bulk = classes.initializeOrderedBulkOp();
                    for (var i = 0; i < docs.length; i++) {
                        var cls_item = docs[i];
                        // find the booking quantity of member
                        var quantity = getMemberBookQuantity(cls_item, req.params.memberID);
                        bulk.find({
                            _id : cls_item._id
                        }).update({
                            $inc : {
                                reservation : -quantity
                            },
                            $pull : {
                                "booking" : {
                                    member : req.params.memberID
                                }
                            }
                        });
                    }
                    bulk.execute(function (err, result) {
                        console.log("remove member's all booking %j", result);
                    });
                }
            });
        } else {
            console.error("member %s fails to be deteled", req.params.memberID);
        }
        res.json(result);
    });
});

// make sure the datetime object is stored as ISODate
function initDateField(item) {
    var fields = ["birthday", "since"];
    for (var i = 0; i < fields.length; i++) {
        if (item && item.hasOwnProperty(fields[i])) {
            item[fields[i]] = new Date(item[fields[i]]);
        }
    }
};

function isAuthenticated(req, res, next) {
    if (req.user && req.user.tenant == req.tenant.name) {
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

module.exports = router;
