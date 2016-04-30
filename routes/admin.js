var express = require('express');
var router = express.Router();
var Account = require('../account');

/* GET users listing. */
router.get('/home', checkTenantUser, function (req, res) {
    res.render('admin',{
        title : '控制台',
        user : req.user,
        project : "控制台"
    });
});

router.post('/createUser', isAuthenticated, function (req, res) {
    Account.register(new Account({
            username : req.body.user, tenant : req.body.tenant, displayName : req.body.display
        }), req.body.password, function (err, account) {
        if (err) {
            return res.status(500).send(err);
        }
        res.send("success");
    });
});

function checkTenantUser(req, res, next) {
    if (!req.user) {
        req.flash('error', '用户未登陆或连接超时');
        res.redirect('/');
    } else if (req.user.tenant != 'admin') {
        res.redirect('/' + req.user.tenant + '/home');
    } else {
        next();
    }
};

function isAuthenticated(req, res, next) {
    if (req.user.username == 'chuanyu') { // special user as administrator
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

module.exports = router;
