var express = require('express');
var router = express.Router();
var helper = require('../helper');

router.get('/home', helper.checkTenantUser, function(req, res) {
    res.render('bqsq/home', {
        title: '课程表',
        currentUrl: 'home',
        user: req.user,
        classrooms: req.tenant.classroom || []
    });
});

router.get('/class/:classID', helper.checkTenantUser, function(req, res) {
    res.locals.classID = req.params.classID;
    res.render('bqsq/pages/class_view', {
        title: '查看课程',
        user: req.user,
        classroom: req.tenant.classroom || []
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
            title: '会员',
            user: req.user,
            currentUrl: 'member',
            classroom: req.tenant.classroom || [],
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
        user: req.user,
        classrooms: req.tenant.classroom || []
    });
});

router.get('/statistics', helper.checkTenantUser, function(req, res) {
    res.render('bqsq/statistics', {
        title: '统计',
        currentUrl: 'statistics',
        user: req.user
    });
});

router.get('/setting', helper.checkTenantUser, function(req, res) {
    res.render('bqsq/setting', {
        title: '设置',
        currentUrl: 'setting',
        user: req.user,
        baseUrl: req.protocol + '://' + req.hostname + req.baseUrl,
        hostname: req.hostname
    });
});

router.get('/mybooking', function(req, res) {
    res.render('bqsq/mybooking', {
        title: '我的课程',
        logoPath: helper.getTenantLogo(req.tenant),
        contact: req.tenant.contact,
        tel: helper.getTel(req.tenant.contact),
        address: req.tenant.address,
        addressLink: req.tenant.addressLink || '#',
        classroom: JSON.stringify(req.tenant.classroom ? req.tenant.classroom : [])
    });
});

router.get('/myReadBooks', function(req, res) {
    res.render('bqsq/myReadBooks', {
        title: '我的英文绘本',
        logoPath: helper.getTenantLogo(req.tenant),
        contact: req.tenant.contact,
        tel: helper.getTel(req.tenant.contact),
        address: req.tenant.address,
        addressLink: req.tenant.addressLink || '#'
    });
});

router.get('/trial', function(req, res) {
    res.render('bqsq/trial', {
        title: req.tenant.name === 'bqsqdrc' ? '报名成功' : '报名试听',
        contact: req.tenant.contact,
        tel: helper.getTel(req.tenant.contact),
        address: req.tenant.address,
        addressLink: req.tenant.addressLink || '#',
        logoPath: helper.getTenantLogo(req.tenant)
    });
});

module.exports = router;
