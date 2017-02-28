var express = require('express');
var router = express.Router();

router.get('/', checkTenantUser, function (req, res) {
    res.render('bqsq/course', {
        title: '班级',
        user: req.user,
        navTitle: req.tenant.displayName,
        classroom: req.tenant.classroom ? req.tenant.classroom : []
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
