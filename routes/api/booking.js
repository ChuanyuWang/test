var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var reservation = require('./lib/reservation');
var helper = require('../../helper');

/**
 * Get the member list who booked the class
 */
router.get('/', helper.isAuthenticated, function(req, res, next) {
    if (!req.query.classid) {
        let error = new Error("Missing param 'classid'");
        error.status = 400;
        return next(error);
    }

    let pipelines = [{
        $match: { _id: mongojs.ObjectId(req.query.classid) }
    }, {
        $project: { booking: 1 }
    }, {
        $lookup: {
            from: 'members',
            let: {
                // define the variable "memberList" as empty array when no booking, 
                // otherwise the "$in" operation will throw error in pipeline
                memberList: {
                    $cond: {
                        if: { $isArray: ['$booking.member'] },
                        then: '$booking.member',
                        else: []
                    }
                }
            },
            pipeline: [{
                $match: {
                    $expr: {
                        $in: ["$_id", "$$memberList"]
                    }
                }
            }, {
                $project: {
                    _id: 1,
                    name: 1,
                    contact: 1
                }
            }],
            as: 'users'
        }
    }];

    const tenantDB = req.db;
    var classes = tenantDB.collection("classes");
    classes.aggregate(pipelines, function(err, docs) {
        if (err) {
            let error = new Error("get booking fails");
            error.innerError = err;
            return next(error);
        }

        if (!docs || docs.length !== 1) {
            // docs === [] when the classid is invalid
            return res.status(400).json({
                'code': 2002,
                'message': "没有找到指定课程，请刷新重试",
                'err': err
            });
        }

        let booking = docs[0].booking || []; // booking is undefined when there is no booking
        let users = docs[0].users; // users will be empty array when there is no matched members
        console.log("find booking of class %s: %j", req.query.classid, booking);
        console.log("find %s members who book class %s", users.length, req.query.classid);

        // Find all the valid booking which member exists
        var book_items = [];
        for (var i = 0; i < booking.length; i++) {
            for (var j = 0; j < users.length; j++) {
                if (booking[i].member == users[j]._id.toString()) {
                    booking[i].userName = users[j].name;
                    booking[i].contact = users[j].contact;
                    book_items.push(booking[i]);
                    break;
                }
            }
        }
        res.json(book_items);
    });
});
/* booking a class by member

req.body = {
openid : "o0uUrv4RGMMiGasPF5bvlggasfGk", (optional)
name : "宝宝1",
contact : "13500000000",
classID : "5716630aa012576d0371e888"
}
 */
router.post('/', function(req, res, next) {
    if (!req.tenant) {
        let error = new Error("tenant is not defined");
        error.status = 400;
        return next(error);
    }
    if (!req.body.name || !req.body.contact || !req.body.classid || !req.body.quantity) {
        res.status(400).send("Missing param 'name' or 'contact' or 'quantity' or 'classid'");
        return;
    }

    let tenantDB = req.db;
    var members = tenantDB.collection("members");
    var user_query = {
        name: req.body.name,
        contact: req.body.contact
    };
    // find the user who want to book a class
    members.findOne(user_query, { history: 0 }, function(err, doc) {
        if (err) {
            var error = new Error('Find member fails');
            error.innerError = err;
            return next(error);
        }

        if (!doc) {
            var error = new Error("未找到您的会员信息，请核实姓名、电话；如果您还不是我们的会员，欢迎来电或到店咨询");
            error.status = 400;
            error.code = 2001;
            return next(error);
        }
        console.log("member is found %j", doc);

        // find the class want to book
        var classes = tenantDB.collection("classes");
        classes.findOne({
            _id: mongojs.ObjectId(req.body.classid)
        }, function(err, cls) {
            if (err) {
                return res.status(500).json({
                    'err': err
                });
            }

            if (!cls) {
                return res.status(400).json({
                    'code': 2002,
                    'message': "没有找到指定课程，请刷新重试",
                    'err': err
                });
            }
            console.log("class is found %j", cls);

            reservation.addOne(doc, cls, req.body.quantity, function(error, result) {
                if (error) return next(error);
                createNewBook(tenantDB, res, doc, cls, req.body.quantity);
            });
        });
    });
});

// remove specfic user's booking info
// TODO, the delete operation may sent unwantted.
router.delete('/:classID', function(req, res, next) {
    if (!req.tenant) {
        let error = new Error("tenant is not defined");
        error.status = 400;
        return next(error);
    }
    if (!req.body.memberid) {
        res.status(400).send("Missing param 'memberid'");
        return;
    }

    let tenantDB = req.db;
    var classes = tenantDB.collection("classes");
    classes.findOne({
        _id: mongojs.ObjectId(req.params.classID),
        "booking.member": mongojs.ObjectId(req.body.memberid)
    }, function(err, doc) {
        if (err) {
            res.status(500).json({
                'err': err
            });
            return;
        }

        if (!doc) {
            res.status(400).json({
                'code': 2009,
                'message': "没有找到指定课程预约，请刷新重试",
                'err': err
            });
            return;
        }

        if (req.isAuthenticated()) {
            if (req.user.role === "admin") {
                //only admin could delete the booking in any time
                console.log("Admin %s cancel the booking of %s", req.user.username, req.body.memberid);
            } else if (Date.now() < doc.date.getTime() + 3600000) {
                // the other authenticated users could delete the booking before class ending, assume each class takes 1 hour, 
                // 1 hours = 3600000 (1*60*60*1000)
                console.log("User %s cancel the booking of %s", req.user.username, req.body.memberid);
            } else {
                var error = new Error("不能在课程开始1小时后取消预约");
                error.status = 400;
                return next(error);
            }
        } else if (Date.now() + 86400000 > doc.date.getTime()) {
            // be free to cancel the booking if it's less than 24 hours before begin
            // 24 hours = 86400000 ms (24*60*60*1000)
            var error = new Error("不能在开始前24小时内取消课程或取消已经结束的课程");
            error.status = 400;
            return next(error);
        }

        // find the booking quantity of member
        for (var i = 0; i < doc.booking.length; i++) {
            if (doc.booking[i].member.toString() == req.body.memberid) {
                var quantity = doc.booking[i].quantity;
                break;
            }
        }

        classes.findAndModify({
            query: {
                _id: mongojs.ObjectId(req.params.classID)
            },
            update: {
                $pull: {
                    "booking": {
                        member: mongojs.ObjectId(req.body.memberid)
                    }
                }
            },
            fields: { cost: 1, booking: 1 },
            new: true
        }, function(err, doc, lastErrorObject) {
            if (err) {
                var error = new Error("取消会员预约失败");
                error.innerError = err;
                return next(error);
            }
            if (doc.cost > 0) {
                //TODO, support multi membership card
                //TODO, handle the callback when member is inactive.
                tenantDB.collection("members").findAndModify({
                    query: {
                        _id: mongojs.ObjectId(req.body.memberid),
                        "membership.0": { $exists: true }
                    },
                    update: {
                        $inc: { "membership.0.credit": doc.cost * quantity }
                    },
                    fields: { membership: 1 },
                    new: true
                }, function(err, m, lastErrorObject) {
                    if (err) {
                        // TODO, handle error
                        console.error(err);
                    }
                    if (m) {
                        console.log(`return ${doc.cost * quantity} credit to member ${req.body.memberid} (after: ${JSON.stringify(m.membership)})`);
                    } else {
                        //TODO, handle the callback when member is not existed.
                        console.error(`Fail to return expense to member ${req.body.memberid}`);
                    }
                });
            }

            return res.json(doc);
        });
    });
});

/**
 * 
 * @param {Object} tenantDB 
 * @param {Object} res 
 * @param {Object} user 
 * @param {Object} cls 
 * @param {Number} quantity 
 */
function createNewBook(tenantDB, res, user, cls, quantity) {
    var newbooking = {
        member: user._id,
        quantity: quantity,
        bookDate: new Date()
    };
    var classes = tenantDB.collection("classes");
    classes.findAndModify({
        query: {
            _id: cls._id
        },
        update: {
            $push: {
                booking: newbooking
            }
        },
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            return res.status(500).json({
                'code': 3001,
                'message': "create booking record fails",
                'err': err
            });
        }

        //TODO, support multi membership card
        if (user.membership && user.membership.length > 0 && doc.cost > 0) {
            // update the credit value in membership
            var members = tenantDB.collection("members");
            members.findAndModify({
                query: {
                    _id: user._id
                }, update: {
                    $inc: { "membership.0.credit": -quantity * doc.cost }
                }, fields: { membership: 1 },
                new: true
            }, function(err, m, lastErrorObject) {
                if (err) console.error(err);
                if (m) {
                    console.log("deduct %f credit from member %s (after: %j)", quantity * doc.cost, user._id, m.membership);
                    user.membership = m.membership;
                }
                //return the status of booking class
                return res.json({
                    class: doc,
                    member: user
                });
            });
        } else {
            //return the status of booking class
            return res.json({
                class: doc,
                member: user
            });
        }
    });
}

module.exports = router;
