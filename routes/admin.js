var express = require('express');
var router = express.Router();
var Account = require('../account');
var util = require('../util');
var mongojs = require('mongojs');

var VERSION = 5; // current tenant version
var config_db = null;
// initialize the 'config' database for admin router
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

router.get('/api/users', isAuthenticated, function(req, res, next) {
    var tenant = req.query.tenant || null;
    Account.find({
        tenant: tenant
    }, 'username displayName role', function(err, users) {
        if (err) {
            var error = new Error("get tenant users fails");
            error.innerError = err;
            return next(error);
        }
        console.log(`Get the users of tenant ${tenant}`);
        res.json(users);
    });
});

router.post('/api/users', isAuthenticated, function(req, res, next) {
    let userRole = req.body.role === 'admin' ? 'admin' : 'user';
    Account.register(new Account({
        username: req.body.user, tenant: req.body.tenant, displayName: req.body.display, role: userRole
    }), req.body.password, function(err, account) {
        if (err) {
            var error = new Error("create tenant user fails");
            error.innerError = err;
            return next(error);
        }
        console.log("Account %j is created successfully", account);
        res.json({
            username: account.username,
            displayName: account.displayName,
            role: account.role
        });
    });
});

router.patch('/api/user/:userID', isAuthenticated, function(req, res, next) {
    let newPassword = req.body.newPassword;

    if (!newPassword || newPassword.length < 8) {
        var error = new Error("新密码不能为空或小于8位");
        error.status = 400;
        return next(error);
    }
    Account.findByUsername(req.params.userID, function(err, sanitizedUser) {
        if (err) {
            var error = new Error(`Fail to find user ${req.params.userID}`);
            error.innerError = err;
            return next(error);
        }
        console.log("Find user successfully", sanitizedUser);

        if (sanitizedUser) {
            sanitizedUser.setPassword(newPassword, function() {
                sanitizedUser.save();
                res.status(200).json({ message: 'password set successful' });
            });
        } else {
            return next(new Error(`User ${req.params.userID} doesn't exist`));
        }
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

    if (['config', 'test', 'chuanyu', 'admin', 'setting', 'settings', 'api'].indexOf(req.body.name) > -1) {
        var error = new Error("tenant name is duplicated");
        error.status = 400;
        return next(error);
    }

    var namePattern = /^[a-z0-9]+$/; // only letter or number
    if (!namePattern.test(req.body.name)) {
        var error = new Error("tenant name supports only letter and number");
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

// update the tenant
router.patch('/api/tenant/:name', isAuthenticated, function(req, res, next) {
    // Only tenant status will be updated by admin
    if (!req.body.status) {
        var error = new Error("tenant status is not defined");
        error.status = 400;
        return next(error);
    }

    var tenants = config_db.collection('tenants');
    tenants.findAndModify({
        query: {
            name: req.params.name
        },
        update: {
            $set: { status: req.body.status === "inactive" ? "inactive" : "active" }
        },
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("Update tenant fails");
            error.innerError = err;
            return next(error);
        }
        if (!doc) {
            var error = new Error(`Tenant ${req.params.name} doesn't exist`);
            error.status = 400;
            return next(error);
        }

        console.log("tenant %s is updated by %j", req.params.name, req.body);
        res.send(doc);
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
            doc.version = 4;
            config_db.collection("tenants").save(doc, function(err, doc) {
                if (err) {
                    return next(new Error("save tenant version fails"));
                }
                //TODO, send the complete message when all data update
                res.send("Tenant update to 4.0");
            });
        } else if (doc.version == 4) {
            upgradeFromFour(req, res, next, doc.name);
            doc.version = 5;
            config_db.collection("tenants").save(doc, function(err, doc) {
                if (err) {
                    return next(new Error("save tenant version fails"));
                }
                //TODO, send the complete message when all data update
                res.send("Tenant update to 5.0");
            });
        } else if (doc.version == VERSION) {
            res.send("Tenant is already update to date");
        } else {
            var error = new Error("tenant version is not valid");
            error.status = 400;
            return next(error);
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
        for (var i = 0; i < docs.length; i++) {
            var doc = docs[i];
            //docs.forEach(function(doc) {
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
        }
        //});
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

function upgradeFromFour(req, res, next, tenant_name) {
    var tenant_db = util.connect(tenant_name);

    // Set all the classes in history with booking status as 'checkin'
    var classes = tenant_db.collection('classes');
    var bulk = classes.initializeUnorderedBulkOp();
    // query class documents that has booking and be in the past
    classes.find({
        date: { $lt: new Date() },
        'booking.status': null,
        'booking.0': { $exists: true }
    }, { booking: 1 }, function(err, docs) {
        if (err) return console.error(err); // TODO, handle error

        for (var i = 0; i < docs.length; i++) {
            var doc = docs[i];
            var query = { $set: {} };
            if (doc.booking && doc.booking.length > 0) {
                // add the status field
                doc.booking.forEach(function(value, index, array) {
                    query.$set[`booking.${index}.status`] = 'checkin';
                })
            }
            bulk.find({ _id: doc._id }).updateOne(query);
        }
        bulk.execute(function(err, result) {
            //TODO, handle error
            if (err) console.error(err);
            else console.log("add status field in all classes %j", result);
        });
    });
}

function checkTenantUser(req, res, next) {
    if (!req.user) {
        req.flash('error', '用户未登录或连接超时');
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
