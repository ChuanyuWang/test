var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');

router.get('/', function (req, res) {
    //console.log("get members with query %j", req.query);
    var members = req.db.collection("members");
    var query = {};
    if (req.query.name) {
        query['name'] = req.query.name;
    }
    if (req.query.contact) {
        query['contact'] = req.query.contact;
    }
    members.find(query).sort({
        since : -1
    }, function (err, docs) {
        if (err) {
            res.status(500).json({
                'err' : err
            });
            return;
        }
        console.log("find members with result %j", docs);
        res.json(docs);
    });
});

router.put('/:memberID', isAuthenticated, function (req, res) {
    var members = req.db.collection("members");

    convertDateObject(req.body);

    members.update({
        _id : mongojs.ObjectId(req.params.memberID)
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
            console.log("member %s is updated by %j", req.params.memberID, req.body);
        } else {
            console.error("member %s update fail by %s", req.params.memberID, req.body);
        }
        res.json(result);
    });
});

router.post('/', isAuthenticated, function (req, res, next) {
    if (!req.body.name || !req.body.contact) {
        res.status(400).send("Missing param 'name' or 'contact'");
        return;
    }
    
    var members = req.db.collection("members");
    var query = {
        name : req.body.name,
        contact : req.body.contact
    };
    
    members.findOne(query, function(err, doc){
        if (err) {
            res.status(500).json({
                'err' : err
            })
            return;
        }
        
        if (doc) {
            var error = new Error("会员已经存在");
            error.code = 2007;
            next(error);
            return;
        }
        
        convertDateObject(req.body);
        members.insert(req.body, function(err, docs){
            if (err) {
                res.status(500).json({
                    'err' : err
                })
            } else {
                console.log("member is added %j", docs);
                res.json(docs);
            }
        });
    });
});

router.delete ('/:memberID', isAuthenticated, function (req, res) {
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

function convertDateObject(doc) {
    if (!doc) {
        return doc;
    }
    // make sure the datetime object is stored as ISODate
    if (doc.birthday) {
        doc.birthday = new Date(doc.birthday);
    }
    if (doc.since) {
        doc.since = new Date(doc.since);
    }
    if (doc.membership && doc.membership.length > 0) {
        for (var index in doc.membership) {
            var card = doc.membership[index];
            if (card && card.expire) {
                card.expire = new Date(card.expire);
            }
        }
    }

    return doc;
};

function getMemberBookQuantity(class_doc, member_id) {
    if (!class_doc || !class_doc.booking) {
        return NaN;
    }
    // find the booking quantity of member
    for (var i=0;i<class_doc.booking.length;i++) {
        if (class_doc.booking[i].member == member_id) {
            return class_doc.booking[i].quantity;
        }
    }
    return NaN;
};

function isAuthenticated(req, res, next) {
    if (req.user && req.user.tenant == req.tenant.name) {
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

module.exports = router;
