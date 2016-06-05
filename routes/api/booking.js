var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');


router.get('/', function (req, res) {
    if (!req.query.classid) {
        res.status(400).send("Missing param 'classid'");
        return;
    }

    var classes = req.db.collection("classes");
    classes.findOne({
        _id : mongojs.ObjectId(req.query.classid)
    }, function(err, doc){
        if (err) {
            res.status(500).json({
                'err' : err
            })
            return;
        }
        
        if (!doc) {
            res.status(400).json({
                'code' : 2002,
                'message' : "没有找到指定课程，请刷新重试",
                'err' : err
            });
            return;
        }

        var booking = doc.booking;
        // no booking info
        if (!booking || booking.length == 0) {
            res.json([]);
            return;
        }
        
        console.log("find booking of class %s: %j", req.query.classid, booking);
        
        var query_member = [];
        for (var i = 0; i < booking.length; i++) {
            var memberid = mongojs.ObjectId(booking[i].member);
            query_member.push(memberid);
        }

        // query all the members who books this class
        var members = req.db.collection("members");
        members.find({
            _id : {
                "$in" : query_member
            }
        }, function (err, users) {
            if (err) {
                res.status(500).json({
                    'err' : err
                })
                return;
            }
            console.log("find members who books class %s: %j", req.query.classid, users);
            
            // Find all the valid booking which member exists
            var book_items = [];
            for (var i=0;i<booking.length;i++) {
                for (var j=0;j<users.length;j++) {
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
});
/* booking a class by member

req.body = {
openid : "o0uUrv4RGMMiGasPF5bvlggasfGk", (optional)
name : "宝宝1",
contact : "13500000000",
classID : "5716630aa012576d0371e888"
}
 */
router.post('/', function (req, res, next) {
    if (!req.body.name || !req.body.contact || !req.body.classid || !req.body.quantity) {
        res.status(400).send("Missing param 'name' or 'contact' or 'quantity' or 'classid'");
        return;
    }
    var members = req.db.collection("members");
    var user_query = {
        name : req.body.name,
        contact : req.body.contact
    };
    // find the user who want to book a class
    members.findOne(user_query, function (err, doc) {
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

        if (doc.expire && doc.expire < new Date()) {
            res.status(400).json({
                'code' : 2005,
                'message' : "会员有效期已过，如有问题，欢迎来电或到店咨询",
                'err' : err
            });
            return;
        }

        // find the class want to book
        var classes = req.db.collection("classes");
        classes.findOne({
            _id : mongojs.ObjectId(req.body.classid)
        }, function (err, cls) {
            if (err) {
                res.status(500).json({
                    'err' : err
                });
                return;
            }

            if (!cls) {
                res.status(400).json({
                    'code' : 2002,
                    'message' : "没有找到指定课程，请刷新重试",
                    'err' : err
                });
                return;
            }
            console.log("class is found %j", cls);

            if (doc.expire && doc.expire < cls.date) {
                res.status(400).json({
                    'code' : 2010,
                    'message' : "您的会员有效期至" + doc.expire.toLocaleDateString() + "，无法预约，如有问题，欢迎来电或到店咨询",
                    'err' : err
                });
                return;
            }

            if (cls.capacity - cls.reservation < req.body.quantity) {
                var remaining = cls.capacity - cls.reservation;
                remaining = remaining < 0 ? 0 : remaining;
                res.status(400).json({
                    'code' : 2003,
                    'message' : "名额不足，剩余 " + remaining + " 人",
                    'err' : err
                });
                return;
            }
            
            //check duplicate booking
            if (cls.booking && cls.booking.length > 0) {
                for (var i=0;i<cls.booking.length;i++) {
                    if (cls.booking[i].member == doc._id.toString()) {
                        res.status(400).json({
                            'code' : 2006,
                            'message' : "已经预约，请勿重复报名",
                            'err' : err
                        });
                        return;
                    }
                }
            }

            if (doc.point[cls.type] < req.body.quantity) {
                res.status(400).json({
                    'code' : 2004,
                    'message' : "您的可用次数不足，无法预约，如有问题，欢迎来电或到店咨询",
                    'err' : err
                });
                return;
            }

            createNewBook(req, res, doc, cls, req.body.quantity);
        });
    });
});

// remove specfic user's booking info
router.delete ('/:classID', isAuthenticated, function (req, res) {
    if (!req.body.memberid) {
        res.status(400).send("Missing param 'memberid'");
        return;
    }
    var classes = req.db.collection("classes");
    classes.findOne({
        _id : mongojs.ObjectId(req.params.classID),
        "booking.member" : req.body.memberid
    }, function (err, doc) {
        if (err) {
            res.status(500).json({
                'err' : err
            });
        }

        if (!doc) {
            res.status(400).json({
                'code' : 2009,
                'message' : "没有找到指定课程预约，请刷新重试",
                'err' : err
            });
            return;
        }
        
        // find the booking quantity of member
        for (var i=0;i<doc.booking.length;i++) {
            if (doc.booking[i].member == req.body.memberid) {
                var quantity = doc.booking[i].quantity;
                break;
            }
        }

        classes.update({
            _id : mongojs.ObjectId(req.params.classID)
        }, {
            $pull : {
                "booking" : {
                    member : req.body.memberid
                }
            },
            $inc : {
                reservation : -quantity
            }
        }, function (err, result) {
            if (result.n == 1) {
                var members = req.db.collection("members");
                var point = {};
                point["point." + doc.type] = quantity;
                members.update({
                    _id : mongojs.ObjectId(req.body.memberid)
                }, {
                    $inc : point
                });
            }
            //TODO, return the modified class item
            res.json(result);
        });
    });
});

function createNewBook(req, res, user, cls, quantity) {
    var newbooking = {
        member : user._id.toString(),
        quantity : quantity,
        bookDate : new Date()
    };
    var classes = req.db.collection("classes");
    classes.findAndModify({
        query : {
            _id : cls._id
        },
        update : {
            $push : {
                booking : newbooking
            },
            $inc : {
                reservation : quantity
            }
        },
        new : true
    }, function (err, doc, lastErrorObject) {
        if (err) {
            res.status(500).json({
                'code' : 3001,
                'message' : "create booking record fails",
                'err' : err
            });
            return;
        }

        var members = req.db.collection("members");
        
        var point = {};
        point["point." + doc.type] = -quantity;
        members.update({
            _id : user._id
        }, {
            $inc : point
        });
        //return the status of booking class
        user.point[doc.type] -= quantity;
        res.json({
            class : doc,
            member : user
        });
    });
};

function isAuthenticated(req, res, next) {
    if (req.user && req.user.tenant == req.tenant.name) {
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

module.exports = router;
