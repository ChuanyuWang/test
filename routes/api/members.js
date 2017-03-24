var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var helper = require('../../helper');
var util = require('../../util');

var NORMAL_FIELDS = {
    status: 1,
    since: 1,
    name: 1,
    contact: 1,
    birthday: 1,
    expire: 1,
    note: 1,
    membership: 1
};

router.post('/validate', function(req, res, next) {
    var tenantDB = null;
    if (req.body.hasOwnProperty('tenant')) {
        tenantDB = util.connect(req.body.tenant);
    } else if (req.db) {
        // initialize the tenant db if it's authenticated user
        tenantDB = req.db;
    } else {
        var err = new Error("Missing param 'tenant'");
        err.status = 400;
        return next(err);
    }

    var query = {};
    if (req.body.hasOwnProperty('name') && req.body.hasOwnProperty('contact')) {
        query['name'] = req.body.name;
        query['contact'] = req.body.contact;
    } else {
        var err = new Error("Missing param 'name' or 'contact'");
        err.status = 400;
        return next(err);
    }

    var members = tenantDB.collection("members");
    members.findOne(query, NORMAL_FIELDS, function(err, doc) {
        if (err) {
            res.status(500).json({
                'err': err
            });
            return;
        }
        console.log("validate member: %j", doc);
        res.json(doc);
    });
});

/// Below APIs are visible to authenticated users only
router.use(helper.isAuthenticated);

router.get('/', function(req, res, next) {
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
        query["membership"] = { $size: 1 };
        query["membership.type"] = "LIMITED";
        query["membership.room"] = [req.query.filter];
    }
    // query members by status
    if (req.query.hasOwnProperty('status')) {
        query["status"] = req.query.status;
    }
    members.find(query, NORMAL_FIELDS).sort({
        since: -1
    }, function(err, docs) {
        if (err) {
            res.status(500).json({
                'err': err
            });
            return;
        }
        console.log("find members: ", docs ? docs.length : 0);
        res.json(docs);
    });
});

router.patch('/:memberID', helper.requireRole("admin"), function(req, res, next) {
    var members = req.db.collection("members");
    // no one can change history, even the admin
    for (var key in req.body) {
        if (key.indexOf('history') > -1) {
            var error = new Error('field "history" is not able to be modified');
            error.status = 400;
            return next(error);
        } else if (key.indexOf('membership') > -1) {
            var error = new Error('field "membership" has to be updated by "/memberships" API');
            error.status = 400;
            return next(error);
        }
    }
    convertDateObject(req.body);

    members.findAndModify({
        query: {
            _id: mongojs.ObjectId(req.params.memberID)
        },
        update: {
            $set: req.body
        },
        fields: NORMAL_FIELDS,
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("Update member fails");
            error.innerError = err;
            return next(error);
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
router.post('/:memberID/charge', helper.requireRole("admin"), function(req, res, next) {
    if (!req.body.hasOwnProperty("old") && !req.body.hasOwnProperty("new")) {
        var error = new Error("Missing param 'old' or 'new'");
        error.status = 400;
        return next(error);
    }

    var members = req.db.collection("members");

    var chargeItem = {
        date: new Date(),
        user: req.user.username,
        target: "membership.0.credit",
        old: parseFloat(req.body.old),
        new: parseFloat(req.body.new),
        remark: req.body.remark
    };

    members.find({
        _id: mongojs.ObjectId(req.params.memberID)
    }, NORMAL_FIELDS, function(err, docs) {
        if (err) {
            var error = new Error("find member fails");
            error.innerError = err;
            return next(error);
        }
        if (docs.length == 0) {
            var error = new Error("用户不存在");
            error.status = 400;
            return next(error);
        }
        var member = docs[0];
        if (!member.membership || !member.membership[0]) {
            var error = new Error("用户没有建立会员卡");
            error.status = 400;
            return next(error);
        }

        var membershipCard = member.membership[0];
        if (membershipCard.credit != chargeItem.old) {
            var error = new Error("充值失败，剩余课时不匹配");
            error.status = 400;
            return next(error);
        }
        //nothing changed, just return the original member object
        if (chargeItem.old == chargeItem["new"]) {
            return res.json(member);
        }

        members.findAndModify({
            query: {
                _id: mongojs.ObjectId(req.params.memberID)
            },
            update: {
                $set: { "membership.0.credit": chargeItem["new"] },
                $push: { history: chargeItem }
            },
            fields: NORMAL_FIELDS,
            new: true
        }, function(err, doc, lastErrorObject) {
            if (err) {
                var error = new Error("charge membership card fails");
                error.innerError = err;
                return next(error);
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
router.get('/:memberID/history', function(req, res, next) {
    var members = req.db.collection("members");

    members.find({
        _id: mongojs.ObjectId(req.params.memberID)
    }, { "history": 1 }, function(err, docs) {
        if (err) {
            var error = new Error("fail to get member charge history");
            error.innerError = err;
            return next(error);
        }
        console.log("get member charge history");
        if (docs.length == 0) {
            var error = new Error("会员不存在");
            error.status = 400;
            return next(error);
        }
        res.json(docs[0].history || []);
    });
});

router.post('/', helper.requireRole("admin"), function(req, res, next) {
    if (!req.body.name || !req.body.contact) {
        var error = new Error("Missing param 'name' or 'contact'");
        error.status = 400;
        return next(error);
    }
    // new member default status is 'active'
    if (!req.body.hasOwnProperty('status')) {
        req.body.status = 'active';
    }

    var members = req.db.collection("members");
    var query = {
        name: req.body.name,
        contact: req.body.contact
    };

    members.findOne(query, function(err, doc) {
        if (err) {
            var error = new Error("fail to find member");
            error.innerError = err;
            return next(error);
        }

        if (doc) {
            var error = new Error("会员已经存在");
            error.code = 2007;
            return next(error);
        }

        convertDateObject(req.body);
        members.insert(req.body, function(err, docs) {
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

router.post('/:memberID/memberships', helper.requireRole('admin'), function(req, res, next) {
    var members = req.db.collection("members");
    convertDateObject(req.body);
    convertNumberValue(req.body);
    members.findAndModify({
        query: {
            _id: mongojs.ObjectId(req.params.memberID)
        },
        update: {
            $push: { membership: req.body }
        },
        fields: NORMAL_FIELDS,
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("Create membership fails");
            error.innerError = err;
            return next(error);
        }
        console.log("membership %s is created by %j", req.params.memberID, req.body);
        // update the history when a new membership card is added
        var setQuery = {}, historyItems = [];
        genMembershipSetQueries(req.user.username, doc.membership.length - 1, {}, req.body, setQuery, historyItems);
        members.update({
            _id: mongojs.ObjectId(req.params.memberID)
        }, {
            $push: {
                history: {
                    $each: historyItems
                }
            }
        }, function(err, result) {
            if (err) console.error(err);
            console.log('update history by creating new card %j', result);
        });
        res.json(doc);
    });
});

router.patch('/:memberID/memberships/:cardIndex', helper.requireRole('admin'), function(req, res, next) {
    var members = req.db.collection("members");
    convertDateObject(req.body);
    convertNumberValue(req.body);

    members.findOne({
        _id: mongojs.ObjectId(req.params.memberID)
    }, { membership: 1 }, function(err, doc) {
        if (err) {
            var error = new Error("find member fails");
            error.innerError = err;
            return next(error);
        }
        if (!doc) {
            var error = new Error("用户不存在");
            error.status = 400;
            return next(error);
        }
        if (!doc.membership || !doc.membership[req.params.cardIndex]) {
            var error = new Error("没有找到指定会员卡，请先建立会员卡");
            error.status = 400;
            return next(error);
        }
        var membershipCard = doc.membership[req.params.cardIndex];

        var setQuery = {}, historyItems = [];
        genMembershipSetQueries(req.user.username, req.params.cardIndex, membershipCard, req.body, setQuery, historyItems);

        //nothing changed, just return the original member object
        if (Object.keys(setQuery).length === 0) {
            return res.json(member);
        }

        console.log(setQuery);
        console.log(historyItems);

        members.findAndModify({
            query: {
                _id: mongojs.ObjectId(req.params.memberID)
            },
            update: {
                $set: setQuery,
                $push: { history: { $each: historyItems } }
            },
            fields: NORMAL_FIELDS,
            new: true
        }, function(err, doc, lastErrorObject) {
            if (err) {
                var error = new Error("update membership card fails");
                error.innerError = err;
                return next(error);
            }
            console.log("update member %s by %s successfully", req.params.memberID, req.user.username);
            res.json(doc);
        });
    });
});

router.delete('/:memberID', helper.requireRole("admin"), function(req, res, next) {
    return next(new Error("Not implementation"));
    var members = req.db.collection("members");
    members.remove({
        _id: mongojs.ObjectId(req.params.memberID)
    }, true, function(err, result) {
        if (err) {
            var error = new Error("fail to remove member");
            error.innerError = err;
            return next(error);
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

/**
 * make sure the Number field is stored as Number
 * @param {Object} doc 
 */
function convertNumberValue(doc) {
    if (!doc) {
        return doc;
    }
    if (doc.hasOwnProperty('credit')) {
        doc['credit'] = parseFloat(doc['credit']);
    }
};

/**
 * make sure the datetime object is stored as ISODate
 * @param {Object} doc 
 */
function convertDateObject(doc) {
    if (!doc) {
        return doc;
    }
    if (doc.hasOwnProperty("membership.0.expire")) {
        doc["membership.0.expire"] = new Date(doc["membership.0.expire"]);
    }
    if (doc.hasOwnProperty("expire")) {
        doc["expire"] = new Date(doc["expire"]);
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

function genMembershipSetQueries(username, cardIndex, current, newItem, setQuery, historyItems) {
    for (var key in newItem) {
        //TODO, compare two objects 
        if (current.hasOwnProperty(key) && current[key] == newItem[key]) {
            // skip update of this field
            continue;
        }
        var targetField = 'membership.' + cardIndex + '.' + key;
        setQuery[targetField] = newItem[key];
        historyItems.push({
            date: new Date(),
            user: username,
            target: targetField,
            old: current.hasOwnProperty(key) ? current[key] : null,
            new: newItem[key]
        });
    }
};

function getMemberBookQuantity(class_doc, member_id) {
    if (!class_doc || !class_doc.booking) {
        return NaN;
    }
    // find the booking quantity of member
    for (var i = 0; i < class_doc.booking.length; i++) {
        if (class_doc.booking[i].member == member_id) {
            return class_doc.booking[i].quantity;
        }
    }
    return NaN;
};

module.exports = router;