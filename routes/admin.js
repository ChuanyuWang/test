var express = require('express');
var router = express.Router();
var Account = require('../account');
var util = require('../util');

var config_db = null;
// initialize the 'config' database for setting router
router.use(function (req, res, next) {
    config_db = config_db || util.connect(req.app.locals.getURI('config'));
    next();
});

/* GET users listing. */
router.get('/home', checkTenantUser, function (req, res) {
    res.render('admin',{
        title : '控制台',
        user : req.user,
        project : "控制台"
    });
});

router.post('/createUser', isAuthenticated, function (req, res) {
    //TODO, check the tenant name existed
    Account.register(new Account({
            username : req.body.user, tenant : req.body.tenant, displayName : req.body.display
        }), req.body.password, function (err, account) {
        if (err) {
            return res.status(500).send(err);
        }
        res.send("success");
    });
});

// list the tenant
router.get('/api/tenants', isAuthenticated, function(req, res, next) {
    config_db.collection("tenants").find({}, function(err, docs){
        if (err) {
            var error = new Error("Get tenant list fails");
            error.innerError = err;
            return next(error);
        }
        console.log("Find %d tenants", docs.length);
        res.send(docs);
    });
});

// create the tenant
router.post('/api/tenants', isAuthenticated, function(req, res, next) {
    if (!req.body.name) {
        var error = new Error("tenamt name is not defined");
        error.status = 400;
        return next(error);
    }
    
    var namePattern = /^[a-z]+$/; // only letter or number
    if (!namePattern.test(req.body.name)) {
        var error = new Error("tenant name only supports letter");
        error.status = 400;
        return next(error);
    }
    var tenants = config_db.collection('tenants');
    tenants.findOne({
        name : req.body.name
    }, function(err, doc) {
        if (doc) {
            var error = new Error("find existed tenant, duplicated tenant name");
            error.status = 400;
            return next(error);
        }

        tenants.insert(req.body, function (err, doc){
            if (err) {
                var error = new Error("create tenamt fails");
                error.innerError = err;
                return next(error);
            }
            console.log("tenant %j is created", req.body);
            res.send(doc);
        });
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
    if (req.user && req.user.username == 'chuanyu') { // special user as administrator
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

module.exports = router;
