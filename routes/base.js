var express = require('express');
const { __ } = require('i18n');
var router = express.Router();
var helper = require('../helper');

router.get('/home', helper.checkTenantUser, function(req, res) {
    res.render('bqsq/home', {
        title: res.__('curriculum'),
        currentUrl: 'home',
        user: req.user
    });
});

router.get('/class/:classID', helper.checkTenantUser, function(req, res) {
    res.locals.classID = req.params.classID;
    res.render('bqsq/pages/class_view', {
        title: res.__('view_session'),
        user: req.user
    });
});

router.get('/member', helper.checkTenantUser, function(req, res) {
    var members = req.db.collection("members");
    //TODO, support multi membership card
    members.aggregate([{
        $match: {
            membership: {
                $size: 1
            },
            "membership.0.expire": {
                $gt: new Date()
            },
            "membership.0.credit": {
                $gt: 0
            }
        }
    }, {
        $unwind: "$membership"
    }, {
        $group: {
            _id: null,
            count: {
                $sum: 1 // the count of valid member who is not expire and has remaining credit
            },
            total: {
                $sum: "$membership.credit" // the total of valid members' remaining credit
            }
        }
    }], function(err, docs) {
        if (err)
            console.error(err);

        var doc = { count: 0, total: 0 };
        if (docs && docs.length == 1)
            doc = docs[0];

        res.render('bqsq/member', {
            title: res.__('members'),
            user: req.user,
            currentUrl: 'member',
            statistics: {
                count: doc.count,
                total: Math.round(doc.total * 10) / 10
            }
        });
    });
});

router.get('/member/:memberID', helper.checkTenantUser, function(req, res, next) {
    res.locals.memberID = req.params.memberID;
    res.render('bqsq/pages/member_view', {
        title: '查看会员',
        user: req.user
    });
});

router.get('/statistics', helper.checkTenantUser, function(req, res) {
    res.render('bqsq/statistics', {
        title: res.__('statistics'),
        currentUrl: 'statistics',
        user: req.user
    });
});

router.get('/setting', helper.checkTenantUser, function(req, res) {
    let port = req.app.locals.ENV_DEVELOPMENT ? `:${req.app.get("port")}` : "";
    res.render('bqsq/setting', {
        title: res.__('settings'),
        currentUrl: 'setting',
        user: req.user,
        tenantUrl: req.protocol + '://' + req.hostname + port + req.baseUrl,
        hostname: req.hostname
    });
});

router.get('/mybooking', function(req, res) {
    res.render('bqsq/mybooking', {
        title: '我的课程'
    });
});

router.get('/myReadBooks', function(req, res) {
    res.render('bqsq/myReadBooks', {
        title: '我的英文绘本',
        logoPath: helper.getTenantLogo(req.tenant)
    });
});

router.get('/trial', function(req, res) {
    res.render('bqsq/trial', {
        title: req.tenant.name === 'bqsqdrc' ? '报名成功' : '报名试听',
        logoPath: helper.getTenantLogo(req.tenant)
    });
});

router.get('/app', function(req, res) {
    res.render('bqsq/mobile/portal', {
        title: 'Mobile Portal'
    });
});


module.exports = router;
