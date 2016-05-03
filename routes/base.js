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
    members.find(query).sort({since: -1}, function (err, docs) {
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
    var members = require("../models/members")(req.db);
    members.insert(req.body, function (err, docs) {
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

router.delete('/api/members/:memberID', isAuthenticated, function (req, res) {
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
    }

    var classes = req.db.collection("classes");
    var query = {
        date : {
            $gte : new Date(req.query.from),
            $lt : new Date(req.query.to)
        }
    };
    classes.find(query).sort({date: 1}, function (err, docs) {
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

router.delete('/api/classes/:classID', isAuthenticated, function (req, res) {
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
    var members = require("../models/members")(req.db);
    members.find(req.body, function (err, docs) {
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
