var express = require('express');
var router = express.Router();
var Account = require('../account');
var util = require('../util');
var mongojs = require('mongojs');

var VERSION = 3;
var config_db = null;
// initialize the 'config' database for setting router
router.use(function(req, res, next) {
    config_db = config_db || util.connect('config');
    next();
});

/* GET users listing. */
router.get('/home', checkTenantUser, function(req, res) {
    res.render('admin', {
        title: '控制台',
        user: req.user,
        navTitle: "控制台"
    });
});

router.post('/createUser', isAuthenticated, function(req, res) {
    //TODO, check the tenant name existed
    Account.register(new Account({
        username: req.body.user, tenant: req.body.tenant, displayName: req.body.display, role: req.body.role
    }), req.body.password, function(err, account) {
        if (err) {
            return res.status(500).send(err);
        }
        console.log("Account %j is created successfully", account);
        res.send("success");
    });
});

// list the tenant
router.get('/api/tenants', isAuthenticated, function(req, res, next) {
    config_db.collection("tenants").find({}, function(err, docs) {
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
        var error = new Error("tenant name is not defined");
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
        name: req.body.name
    }, function(err, doc) {
        if (doc) {
            var error = new Error("find existed tenant, duplicated tenant name");
            error.status = 400;
            return next(error);
        }

        req.body.version = VERSION;
        tenants.insert(req.body, function(err, doc) {
            if (err) {
                var error = new Error("create tenant fails");
                error.innerError = err;
                return next(error);
            }
            console.log("tenant %j is created", req.body);
            res.send(doc);
        });
    });
});

// upgrade the tenant
router.post('/api/upgrade', isAuthenticated, function(req, res, next) {
    if (!req.body.tenant) {
        var error = new Error("tenant name is not defined");
        error.status = 400;
        return next(error);
    }
    config_db.collection("tenants").findOne({ name: req.body.tenant }, function(err, doc) {
        if (err) {
            var error = new Error("Find tenant fails");
            error.innerError = err;
            return next(error);
        }
        console.log("Find tenant %j", doc);

        if (!doc.version) {
            upgradeFromZero(req, res, next, doc.name);
            doc.version = 1;
            config_db.collection("tenants").save(doc, function(err, doc) {
                if (err) {
                    return next(new Error("save tenant version fails"));
                }
                //TODO, send the complete message when all data update
                res.send("Tenant update to 1.0");
            });
        } if (doc.version == 1) {
            upgradeFromOne(req, res, next, doc.name);
            doc.version = 2;
            config_db.collection("tenants").save(doc, function(err, doc) {
                if (err) {
                    return next(new Error("save tenant version fails"));
                }
                //TODO, send the complete message when all data update
                res.send("Tenant update to 2.0");
            });
        } else if (doc.version == 2) {
            upgradeFromTwo(req, res, next, doc.name);
            doc.version = 3;
            config_db.collection("tenants").save(doc, function(err, doc) {
                if (err) {
                    return next(new Error("save tenant version fails"));
                }
                //TODO, send the complete message when all data update
                res.send("Tenant update to 3.0");
            });
        } else if (doc.version == 3) {
            upgradeFromThree(req, res, next, doc.name);
            //doc.version = 4;
            config_db.collection("tenants").save(doc, function(err, doc) {
                if (err) {
                    return next(new Error("save tenant version fails"));
                }
                //TODO, send the complete message when all data update
                res.send("Tenant update to 4.0");
            });
        } else {
            res.send("Tenant is already update to date");
        }
    });
});

function upgradeFromZero(req, res, next, tenant_name) {
    //TODO, close the connection when all data update done
    var tenant_db = util.connect(tenant_name);

    var members = tenant_db.collection('members');
    members.find({}).forEach(function(err, doc) {
        if (err) {
            console.error(err);
        } else {
            if (doc && doc.point && !doc.hasOwnProperty('credit')) {
                doc.credit = 0;
                if (!isNaN(doc.point.story)) doc.credit += doc.point.story;
                if (!isNaN(doc.point.event)) doc.credit += doc.point.event * 2;
                members.save(doc);
            }
        }
    });

    var classes = tenant_db.collection('classes');
    classes.find({}).forEach(function(err, doc) {
        if (err) {
            console.error(err);
        } else {
            if (doc && doc.type && !doc.hasOwnProperty('cost')) {
                doc.cost = 0;
                if (doc.type == 'story') doc.cost = 1;
                if (doc.type == 'event') doc.cost = 2;
                classes.save(doc);
            }
        }
    });

    /*
    members.find({}, function(err, docs){
        if (err) {
            var error = new Error('Query all members fails with error');
            error.innerError = err;
            return next(error);
        } else {
            for (var i=0;i< docs.length; i++){
                var member = docs[i];
                if (member.point && !member.hasOwnProperty('credit')) {
                    member.credit = 0;
                    if (!isNaN(member.point.story)) member.credit += member.point.story;
                    if (!isNaN(member.point.event)) member.credit += member.point.event * 2;
                    members.save(member);
                }
            }
            
            if (doc && doc.point && !doc.hasOwnProperty('credit')) {
                doc.credit = 0;
                if (!isNaN(doc.point.story)) doc.credit += doc.point.story;
                if (!isNaN(doc.point.event)) doc.credit += doc.point.event * 2;
                members.save(doc);
            }
        }
    });
    */
}

function upgradeFromOne(req, res, next, tenant_name) {
    //TODO, close the connection when all data update done
    var tenant_db = util.connect(tenant_name);

    var members = tenant_db.collection('members');
    members.find({}).forEach(function(err, doc) {
        if (err) {
            console.error(err);
        } else {
            if (doc && doc.hasOwnProperty('credit') && !doc.hasOwnProperty('membership')) {
                doc.membership = [];
                // assign each member a default member card with no limitation
                var defaultCard = {
                    type: "ALL",
                    room: [],
                    expire: doc.expire,
                    credit: doc.credit
                };
                doc.membership.push(defaultCard);
                members.save(doc);
            }
        }
    });
}
/**
 * Update the tenant from version 2 to 3, which append `status` field to all members documents
 * @param {Object} req
 * @param {Object} res 
 * @param {Function} next 
 * @param {String} tenant_name 
 */
function upgradeFromTwo(req, res, next, tenant_name) {
    var tenant_db = util.connect(tenant_name);

    var members = tenant_db.collection('members');
    // query matches documents that either contain the status field whose value is null or that do not contain the status field.
    // assign default status as 'active'
    members.update({ status: null }, { $set: { status: 'active' } }, { multi: true }, function(err, result) {
        if (err) {
            console.error(err);
        } else {
            console.info('Upgrade from version 2 successfully');
            // e.g. { ok: 1, nModified: 3, n: 3 }
            console.debug(result);
        }
    });
}

function upgradeFromThree(req, res, next, tenant_name) {
    var tenant_db = util.connect(tenant_name);

    // Fix the reference field "courseID" and "booking.member" in collection("classes")
    var classes = tenant_db.collection('classes');
    var bulk1 = classes.initializeUnorderedBulkOp();
    // query matches documents that has at least one member reservation
    classes.find({
        $or: [
            { 'courseID': { $exists: true } },
            { 'booking.0': { $exists: true } }
        ]
    }, { courseID: 1, booking: 1 }, function(err, docs) {
        if (err) return console.error(err); // TODO, handle error
        docs.forEach(function(doc) {
            var query = { $set: {} };
            if (doc.courseID) {
                // fix the courseID field "58328628b18262980c0d2917" ==> ObjectID("58328628b18262980c0d2917")
                query.$set['courseID'] = mongojs.ObjectId(doc.courseID);
            }
            if (doc.booking && doc.booking.length > 0) {
                // fix the member field "58328628b18262980c0d2917" ==> ObjectID("58328628b18262980c0d2917")
                doc.booking.forEach(function(value, index, array) {
                    query.$set[`booking.${index}.member`] = mongojs.ObjectId(value.member);
                })
            }
            bulk1.find({ _id: doc._id }).updateOne(query);
        });
        bulk1.execute(function(err, result) {
            //TODO, handle error
            if (err) console.error(err);
            else console.log("update courseID and booking.member in all classes %j", result);
        });
    });

    // Fix the reference field "members.id" in collection("courses")
    var courses = tenant_db.collection('courses');
    var bulk2 = courses.initializeUnorderedBulkOp();
    // query matches documents that has at least one member
    courses.find({
        'members.0': { $exists: true }
    }, { members: 1 }, function(err, docs) {
        if (err) return console.error(err); // TODO, handle error
        docs.forEach(function(doc) {
            var query = { $set: {} };
            // fix the member field "58328628b18262980c0d2917" ==> ObjectID("58328628b18262980c0d2917")
            doc.members.forEach(function(value, index, array) {
                query.$set[`members.${index}.id`] = mongojs.ObjectId(value.id);
            })
            bulk2.find({ _id: doc._id }).updateOne(query);
        });
        bulk2.execute(function(err, result) {
            //TODO, handle error
            if (err) console.error(err);
            else console.log("update members.id in all courses %j", result);
        });
    });
}

function checkTenantUser(req, res, next) {
    if (!req.user) {
        req.flash('error', '用户未登陆或连接超时');
        res.redirect('/');
    } else if (req.user.tenant != 'admin') {
        res.redirect('/t/' + req.user.tenant + '/home');
    } else {
        next();
    }
}

function isAuthenticated(req, res, next) {
    if (req.user && req.user.username == 'chuanyu') { // special user as administrator
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
}

module.exports = router;
