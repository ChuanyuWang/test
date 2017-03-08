var express = require('express');
var router = express.Router();
var util = require('../util');
// API routers ===========================================================

router.use(getTenantInfo);
router.use('/classes', require('./api/classes'));
router.use('/courses', require('./api/courses'));
router.use('/members', require('./api/members'));
router.use('/booking', require('./api/booking'));

function getTenantInfo(req, res, next) {
    if (req.isUnauthenticated() || req.tenant) {
        return next();
    }

    var tenantName = req.user.tenant;
    req.db = util.connect(tenantName);
    // cache the tenant object in request, e.g.
    /* tenant object
    {
        appid : 'wxe5e454c5dff8c7b2',
        appsecret : 'f3893474595ddada8e5c2ac5b4e40136',
        token : 'Hibanana',
        encodingAESKey : '',
        name : 'test',
        displayName : '大Q小q',
        version : 1,
        classroom : []
    };
    */
    var config_db = util.connect('config');
    if (!config_db) {
        console.error("database config is not existed");
        next();
    }
    config_db.collection('tenants').findOne({
        name: req.params.tenantName
    }, function(err, tenant) {
        if (err) {
            console.error(err);
        }

        req.tenant = tenant || {};
        next();
    });
}

module.exports = router;
