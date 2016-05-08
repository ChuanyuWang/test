var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');

/* GET users listing. */
router.get('/home', checkTenantUser, function (req, res) {
    res.render('bqsq/home', {
        title : '课程表',
        user : req.user,
        project : req.tenant.name
    });
});

router.get('/member', checkTenantUser, function (req, res) {
    res.render('bqsq/member', {
        title : '会员',
        user : req.user,
        project : req.tenant.name
    });
});

// API =============================================================

router.get('/api/members', isAuthenticated, function (req, res) {
    //console.log("get members with query %j", req.query);
    var members = req.db.collection("members");
    var query = {};
    members.find(query).sort({
        since : -1
    }, function (err, docs) {
        if (err) {
            res.status(500).json({
                'err' : err
            })
        }
        console.log("find members with result %j", docs);
        res.json(docs);
    });
});

router.post('/api/members', isAuthenticated, function (req, res) {
    if (!req.body.name || !req.body.contact) {
        res.status(400).send("Missing param 'name' or 'contact'");
        return;
    }
    
    var members = require("../models/members")(req.db);
    members.insert(req.body, function (err, docs) {
        if (err) {
            res.status(500).json({
                'code' : err.code,
                'message' : err.message,
                'err' : err
            })
        } else {
            console.log("member is added %j", docs);
            res.json(docs);
        }
    });
});

router.delete ('/api/members/:memberID', isAuthenticated, function (req, res) {
    var members = req.db.collection("members");
    members.remove({
        _id : mongojs.ObjectId(req.params.memberID)
    }, function (err, doc) {
        if (err) {
            res.status(500).json({
                'err' : err
            })
        } else {
            console.log("member %s is deteled", req.params.memberID);
            res.json({});
        }
    });
});

router.get('/api/classes', function (req, res) {
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
            })
        }
        console.log("find classes with result %j", docs);
        res.json(docs);
    });
});

router.post('/api/classes', isAuthenticated, function (req, res) {
    var classes = require("../models/classes")(req.db);
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

router.delete ('/api/classes/:classID', isAuthenticated, function (req, res) {
    var classes = req.db.collection("classes");
    classes.remove({
        _id : mongojs.ObjectId(req.params.classID)
    }, function (err, doc) {
        if (err) {
            res.status(500).json({
                'err' : err
            })
        } else {
            console.log("class %s is deteled", req.params.classID);
            res.json({});
        }
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
router.post('/api/booking', function (req, res) {
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
            res.status(500).json({
                'err' : err
            })
            return;
        }

        if (!doc) {
            res.status(400).json({
                'code' : 2001,
                'message' : "未找到您的会员信息，请核实姓名、电话；如果您还不是我们的会员，欢迎来电或到店咨询",
                'err' : err
            })
            return;
        }
        console.log("member is found %j", doc);

        if (doc.expire < new Date()) {
            res.status(400).json({
                'code' : 2005,
                'message' : "会员有效期已过，如果有问题，欢迎来电或到店咨询",
                'err' : err
            })
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
                })
                return;
            }

            if (!cls) {
                res.status(400).json({
                    'code' : 2002,
                    'message' : "没有找到指定课程，请刷新重试",
                    'err' : err
                })
                return;
            }
            console.log("class is found %j", cls);

            if (cls.capacity - cls.reservation <= 0) {
                res.status(400).json({
                    'code' : 2003,
                    'message' : "本次课程或活动预约已满，一共" + cls.reservation + "人报名",
                    'err' : err
                })
                return;
            }

            if (doc.point[cls.type] < req.body.quantity) {
                res.status(400).json({
                    'code' : 2004,
                    'message' : "您的可用次数不足，无法预约，如果有问题，欢迎来电或到店咨询",
                    'err' : err
                })
                return;
            }

            createNewBook(req, res, doc, cls, req.body.quantity);
        });
    });
});

function createNewBook(req, res, user, cls, quantity) {
    var booking = req.db.collection("booking");
    var query = {
        memeberid : user._id.toString(),
        classid : cls._id.toString()
    };
    booking.findOne(query, function (err, doc) {
        if (err) {
            res.status(500).json({
                'err' : err
            })
            return;
        }

        if (doc) {
            res.status(400).json({
                'code' : 2006,
                'message' : "已经预约，请勿重复报名",
                'err' : err
            })
            return;
        }
        var newBookingItem = query;
        newBookingItem.quantity = quantity;
        newBookingItem.date = new Date();
        booking.insert(newBookingItem, function (err, docs) {
            if (err) {
                res.status(500).json({
                    'code' : 3001,
                    'message' : "create booking record fails",
                    'err' : err
                })
                return;
            }
            
            var classes = req.db.collection("classes");
            cls.reservation += quantity;
            classes.update({_id:cls._id}, {$set:{reservation:cls.reservation}});
            var members = req.db.collection("members");
            user.point[cls.type] -= quantity;
            members.update({_id:user._id}, {$set: {point: user.point}});
            //return the status of booking class
            res.json({
                class : cls,
                member : user
            });
        });
    });
};

function checkTenantUser(req, res, next) {
    if (!req.user) {
        req.flash('error', '用户未登陆或连接超时');
        res.redirect('/');
    } else if (req.user.tenant != req.tenant.tenant) {
        res.redirect('/' + req.user.tenant + '/home');
    } else {
        next();
    }
};

function isAuthenticated(req, res, next) {
    if (req.user && req.user.tenant == req.tenant.tenant) {
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

module.exports = router;
