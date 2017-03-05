var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');

var NORMAL_FIELDS = {
    status : 1,
    since : 1,
    name : 1,
    contact : 1,
    birthday : 1,
    expire : 1,
    note : 1,
    membership : 1
};
// TODO, user authenticated user can access this API
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
    // "null" is the keyword indicate display all members
    if (req.query.filter && req.query.filter != "null") {
        //TODO, support multi membership card
        query["membership"] = { $size : 1 };
        query["membership.type"] = "LIMITED";
        query["membership.room"] = [req.query.filter];
    }
    // query members by status
    if (req.query.hasOwnProperty('status')) {
        query["status"] = req.query.status;
    }
    members.find(query, NORMAL_FIELDS).sort({
        since : -1
    }, function (err, docs) {
        if (err) {
            res.status(500).json({
                'err' : err
            });
            return;
        }
        console.log("find members: ", docs?docs.length:0);
        res.json(docs);
    });
});

router.patch('/:memberID', isAuthenticated, requireRole("admin"), function (req, res, next) {
    var members = req.db.collection("members");

    convertDateObject(req.body);
    
    members.findAndModify({
        query: {
            _id : mongojs.ObjectId(req.params.memberID)
        },
        update: { 
            $set: req.body
        },
        fields: NORMAL_FIELDS,
        new: true
    }, function (err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("Update member fails");
            error.innerError = err;
            next(error);
            return;
        }
        console.log("member %s is updated by %j", req.params.memberID, req.body);
        res.json(doc);
    });
});

/*
{
    "user": "yezhi",
    "date": "2016-1-1",
    "target": "membership.0.credit",
    "old": 4,
    "new": 14,
    "remark" : "****"
}
*/
router.post('/:memberID/charge', isAuthenticated, requireRole("admin"), function (req, res, next) {
    if (!req.body.hasOwnProperty("old") && !req.body.hasOwnProperty("new")) {
        var error = new Error("Missing param 'old' or 'new'");
        error.status = 400;
        next(error);
        return;
    }

    var members = req.db.collection("members");

    var chargeItem = {
        date : new Date(),
        user : req.user.username,
        target: "membership.0.credit",
        old : parseFloat(req.body.old),
        "new" : parseFloat(req.body.new),
        remark : req.body.remark
    };

    members.find({
        _id : mongojs.ObjectId(req.params.memberID)
    }, NORMAL_FIELDS, function (err, docs) {
        if (err) {
            var error = new Error("find member fails");
            error.innerError = err;
            next(error);
            return;
        }
        if (docs.length == 0) {
            var error = new Error("用户不存在");
            error.status = 400;
            next(error);
            return;
        }
        var member = docs[0];
        if (!member.membership || !member.membership[0]) {
            var error = new Error("用户没有建立会员卡");
            error.status = 400;
            next(error);
            return;
        }
        
        var membershipCard = member.membership[0];
        if (membershipCard.credit != chargeItem.old) {
            var error = new Error("充值失败，剩余课时不匹配");
            error.status = 400;
            next(error);
            return;
        }
        //nothing changed, just return the original member object
        if (chargeItem.old == chargeItem["new"]) {
            res.json(member);
            return;
        }

        members.findAndModify({
            query: {
                _id : mongojs.ObjectId(req.params.memberID)
            },
            update: { 
                $set: {"membership.0.credit" : chargeItem["new"]},
                $push : {history : chargeItem}
            },
            fields: NORMAL_FIELDS,
            new: true
        }, function (err, doc, lastErrorObject) {
            if (err) {
                var error = new Error("charge membership card fails");
                error.innerError = err;
                next(error);
                return;
            }
            console.log("charge member %s from %d to %d by %s", req.params.memberID, chargeItem.old, chargeItem["new"], chargeItem.user);
            res.json(doc);
        });
    });
});

/* 
{
    "_id": ObjectID("5787bab6e0de69928c6ad14b"),
    "name": "22",
    "membership": [],
    "history" : [{
            "user": "yezhi",
            "date": "2016-1-1",
            "target": "membership.0.credit",
            "old": 4,
            "new": 14,
            "remark" : "****"
    }]
}
*/
router.get('/:memberID/history', isAuthenticated, function (req, res, next) {
    var members = req.db.collection("members");

    members.find({
        _id : mongojs.ObjectId(req.params.memberID)
    }, {"history" : 1}, function (err, docs) {
        if (err) {
            var error = new Error("fail to get member charge history");
            error.innerError = err;
            next(error);
            return;
        }
        console.log("get member charge history");
        if (docs.length == 0) {
            var error = new Error("会员不存在");
            error.status = 400;
            next(error);
            return;
        }
        res.json(docs[0].history || []);
    });
});

router.post('/', isAuthenticated, requireRole("admin"), function (req, res, next) {
    if (!req.body.name || !req.body.contact) {
        var error = new Error("Missing param 'name' or 'contact'");
        error.status = 400;
        next(error);
        return;
    }

    var members = req.db.collection("members");
    var query = {
        name : req.body.name,
        contact : req.body.contact
    };
    
    members.findOne(query, function(err, doc){
        if (err) {
            var error = new Error("fail to find member");
            error.innerError = err;
            next(error);
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
                var error = new Error("fail to add member");
                error.innerError = err;
                next(error);
            } else {
                console.log("member is added %j", docs);
                res.json(docs);
            }
        });
    });
});

router.delete ('/:memberID', isAuthenticated, requireRole("admin"), function (req, res, next) {
    var members = req.db.collection("members");
    members.remove({
        _id : mongojs.ObjectId(req.params.memberID)
    }, true, function (err, result) {
        if (err) {
            var error = new Error("fail to remove member");
            error.innerError = err;
            next(error);
            return;
        } 
        if (result.n == 1) {
            console.log("member %s is deleted", req.params.memberID);
            /*
            var classes = req.db.collection("classes");
            //TODO, remove member's all booking information or only in the future???
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
            */
        } else {
            console.error("member %s fails to be deleted", req.params.memberID);
        }
        res.json(result);
    });
});

function convertDateObject(doc) {
    if (!doc) {
        return doc;
    }
    // make sure the datetime object is stored as ISODate
    if (doc.hasOwnProperty("membership.0.expire")) {
        doc["membership.0.expire"] = new Date(doc["membership.0.expire"]);
    }
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

function requireRole(role) {
    return function(req, res, next) {
        if(req.user && req.user.role === role)
            next();
        else {
            var err = new Error("没有权限执行此操作");
            err.status = 403;
            next(err);
        }
    };
};

function isAuthenticated(req, res, next) {
    if (req.user && req.user.tenant == req.tenant.name) {
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

module.exports = router;
