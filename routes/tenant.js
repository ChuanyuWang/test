const express = require('express');
const router = express.Router();
const db_utils = require('../server/databaseManager');
const helper = require('../helper');

const reserved_tenants = ['config', 'chuanyu', 'admin', 'setting', 'settings', 'api', 'bqsq-admin'];

// parse tenant information before proceed
router.use(getTenantInfo);

// Route requests to base pages =====================================

router.use('/course', require('./course'));
router.use(require('./base'));

// Functions =============================================================

async function getTenantInfo(req, res, next) {
    // Get the tenant name from url, e.g. "/t/test"
    let tenantName = req.baseUrl.split("/t/")[1];
    if (reserved_tenants.indexOf(tenantName) > -1) {
        //let error = new Error("tenant name is illegal");
        //error.status = 400;
        //return next(error);
        // reserved tenants are not accessible
        return next('router'); // jump out of the current router.
    }
    // cache the tenant object in request, e.g.
    /* tenant object
    {
        appid : '',
        appsecret : '',
        token : 'Hibanana',
        encodingAESKey : '',
        name : 'test',
        displayName : '大Q小q',
        feature: 'book',
        version : 5,
        classroom : [ { id: 'wucai', name: '五彩城' },
                    { id: 'a', name: 'aa', visibility: null },
                    { id: 'bb', name: 'bbb', visibility: 'internal' } ],
        contact : '136-6166-4265',
        address : '宝翔路801号五彩城3楼307'
        addressLink : 'http://j.map.baidu.com/39KKB'
    };
    */
    try {
        let config_db = await db_utils.connect('config');
        if (!config_db) {
            return next(new Error("database config is not existed"));
        }
        let tenant = await config_db.collection('tenants').findOne({
            name: tenantName
        });

        if (!tenant) {
            console.warn(`tenant ${tenantName} doesn't exist`);
            // return next('route'); //  bypass the remaining route callbacks.
            return next('router'); // jump out of the current router.
        }

        if (tenant.status === 'inactive') {
            if (req.user) {
                // force to logout if user login inactive tenant
                if (req.user.tenant === tenant.name) {
                    req.logout();
                }
            }
            let error = new Error("门店已关闭或停用，请稍后再试。");
            error.status = 400;
            return next(error);
        }

        req.tenant = tenant;
        req.db = await db_utils.mongojsDB(tenant.name);
        // navTitle is the title on the navigation bar
        res.locals.navTitle = tenant.displayName || "";
        res.locals.classrooms = tenant.classroom || [];
        res.locals.types = tenant.types || [];
        res.locals.logoPath = helper.getTenantLogo(tenant);
        res.locals.tenant_feature = tenant.feature || "common"; // default is common
        res.locals.tenant_address = tenant.address || "";
        res.locals.tenant_addressLink = tenant.addressLink || '#';
        res.locals.tenant_contact = tenant.contact || "";
        res.locals.tenant_systemMessage = tenant.systemMessage || "";
        return next();
    } catch (err) {
        let error = new Error("get tenant fails");
        error.innerError = err;
        return next(error);
    }
}

module.exports = router;
