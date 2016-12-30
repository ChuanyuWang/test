var express = require('express');
var router = express.Router();

router.get('/home', checkTenantUser, function (req, res) {
    res.render('bqsq/home', {
        title : '课程表',
        user : req.user,
        navTitle : req.tenant.displayName,
        classroom : req.tenant.classroom ? req.tenant.classroom : []
    });
});

router.get('/member', checkTenantUser, function (req, res) {
    var members = req.db.collection("members");
    //TODO, support multi membership card
    members.aggregate([{
                $match : {
                    membership : {
                        $size : 1
                    },
                    "membership.0.expire" : {
                        $gt : new Date()
                    },
                    "membership.0.credit" : {
                        $gt : 0
                    }
                }
            }, {
                $unwind : "$membership"
            }, {
                $group : {
                    _id : null,
                    count : {
                        $sum : 1 // the count of valid member who is not expire and has remaining credit
                    },
                    total : {
                        $sum : "$membership.credit" // the total of valid members' remaining credit
                    }
                }
            }
        ], function (err, docs) {
        if (err)
            console.error(err);

        var doc = {count:0, total:0};
        if (docs && docs.length == 1)
            doc = docs[0];

        res.render('bqsq/member', {
            title : '会员',
            user : req.user,
            navTitle : req.tenant.displayName,
            classroom : req.tenant.classroom ? req.tenant.classroom : [],
            statistics : {
                count : doc.count,
                total : Math.round(doc.total*10)/10
            }
        });
    });
});

router.get('/opportunity', checkTenantUser, function (req, res) {
    res.render('bqsq/opportunity', {
        title : '试听',
        user : req.user,
        navTitle : req.tenant.displayName
    });
});

router.get('/setting', checkTenantUser, function (req, res) {
    res.render('bqsq/setting', {
        title : '设置',
        user : req.user,
        navTitle : req.tenant.displayName
    });
});

router.get('/mybooking', function (req, res) {
    res.render('bqsq/mybooking', {
        title : '我的课程',
        classroom : JSON.stringify(req.tenant.classroom ? req.tenant.classroom : [])
    });
});

router.get('/myReadBooks', function (req, res) {
    res.render('bqsq/myReadBooks', {
        title : '我的英文绘本'
    });
});

router.get('/trial', function (req, res) {
    res.render('bqsq/trial', {
        title : '报名试听'
    });
});

function checkTenantUser(req, res, next) {
    if (!req.user) {
        req.flash('error', '用户未登陆或连接超时');
        res.redirect('/');
    } else if (req.user.tenant != req.tenant.name) {
        res.redirect('/' + req.user.tenant + '/home');
    } else {
        next();
    }
};

module.exports = router;
