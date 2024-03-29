var express = require('express');
var router = express.Router();
var Account = require('../account');
const db_utils = require('../server/databaseManager');
const { ParamError, InternalServerError, BaseError, BadRequestError } = require("./api/lib/basis");
var mongojs = require('mongojs');
const helper = require('../helper');
const { SchemaValidator } = require("./api/lib/schema_validator");
const { createDefaultClassType, setDefaultTypeForNotStartedClasses, createtDefaultContracts } = require("../server/upgradeFiveUtil");

const TenantSchema = new SchemaValidator({
    status: {
        validator: value => {
            return ["active", "inactive"].includes(value);
        },
        editable: true
    },
    feature: {
        validator: value => {
            return ["common", "book"].includes(value);
        }
    },
    name: { type: String, required: true },
    displayName: { type: String, required: true },
    systemMessage: { type: String, editable: true },
    version: Number,
    contact: String,
    address: String,
    addressLink: String,
    logoPath: String,
    types: Array,
    groups: Array,
    wechat: Object
});

var VERSION = 6; // current tenant version
var config_db = null;
// initialize the 'config' database for admin router
router.use(async function(req, res, next) {
    try {
        config_db = await db_utils.mongojsDB('config');
        return next();
    } catch (error) {
        let err = new Error("get config database fails");
        err.innerError = error;
        return next(err);
    }
});

/* GET users listing. */
router.get('/home', helper.checkUser('chuanyu'), function(req, res) {
    res.render('admin', {
        title: '控制台',
        user: req.user,
        navTitle: "控制台",
        classrooms: [],
        types: [],
        groups: []
    });
});

router.get('/api/users', isAuthenticated, function(req, res, next) {
    var tenant = req.query.tenant || null;
    // find users of selected tenants and only return "username displayName role active" fields
    Account.find({
        tenant: tenant
    }, 'username displayName role active', function(err, users) {
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
        username: req.body.user,
        tenant: req.body.tenant,
        displayName: req.body.display,
        role: userRole,
        active: true
    }), req.body.password, function(err, account) {
        if (err) {
            var error = new Error("create tenant user fails");
            error.innerError = err;
            return next(error);
        }
        // mask sensitive data before logging
        delete account.salt;
        delete account.hash;
        console.log("Account %j is created successfully", account);
        res.json({
            username: account.username,
            displayName: account.displayName,
            role: account.role,
            active: account.active
        });
    });
});

router.patch('/api/user/:userID', isAuthenticated, async function(req, res, next) {
    try {
        let sanitizedUser = await Account.findOne({ username: req.params.userID }).exec();
        if (!sanitizedUser) {
            return next(new Error(`User ${req.params.userID} doesn't exist`));
        }
        console.log(`Find user "${sanitizedUser.username} successfully`);

        // set new password
        if (typeof (req.body.newPassword) === "string") {
            let newPassword = req.body.newPassword;
            if (newPassword.length < 8) {
                let error = new Error("新密码不能为空或小于8位");
                error.status = 400;
                return next(error);
            }

            await sanitizedUser.setPassword(newPassword);
            await sanitizedUser.save();
            return res.status(200).json({ message: 'password set successful' });
        } else if (typeof (req.body.active) === "boolean") {
            // update new status
            sanitizedUser.active = req.body.active;
            await sanitizedUser.save();
            return res.status(200).json({ message: `active is set to "${req.body.active}" ` });
        } else if (typeof (req.body.role) === "string") {
            // update new role
            sanitizedUser.role = req.body.role;
            await sanitizedUser.save();
            return res.status(200).json({ message: `role is set to "${req.body.role}" ` });
        }
    } catch (err) {
        let error = new Error(`Fail to update user ${req.params.userID}`);
        error.innerError = err;
        return next(error);
    }
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

    if (['config', 'chuanyu', 'admin', 'setting', 'settings', 'api', 'local', 'dlketang_logs'].indexOf(req.body.name) > -1) {
        var error = new Error("tenant name is illegal");
        error.status = 400;
        return next(error);
    }

    var namePattern = /^[a-z0-9-]+$/; // only letter or number or "-"
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
        req.body.createdDate = new Date();
        req.body.wechat = {
            app_id: "",
            app_secret: "",
            mch_id: "",
            api_key: ""
        };
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
    if (!TenantSchema.modifyVerify(req.body)) {
        return next(BadRequestError(`Invalid Request to update tenant`))
    }

    let updateSet = {};
    if (req.body.hasOwnProperty("status")) updateSet.status = req.body.status;
    if (req.body.hasOwnProperty("systemMessage")) updateSet.systemMessage = req.body.systemMessage;
    if (req.body.hasOwnProperty("wechat")) updateSet.wechat = req.body.wechat;

    var tenants = config_db.collection('tenants');
    tenants.findAndModify({
        query: {
            name: req.params.name
        },
        update: {
            $set: updateSet
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
router.post('/api/upgrade',
    isAuthenticated,
    getTenantInfo,
    legacyUpgrade,
    upgradeFromFive,
    function(req, res, next) {
        // get the tenant to be upgraded
        let doc = req.tenant;
        return next(new ParamError(`tenant with version ${doc.version} is up-to-date`));
    }
);

async function fixPayment(req, res, next) { // eslint-disable-line
    // check payments with null contractNo
    let tenant = req.tenant;
    if (tenant.version !== 6) return next();

    try {
        // get all payments without contractNo field
        let db = await db_utils.connect(tenant.name);
        let payments = db.collection('payments');
        let pipelines = [{
            $match: { contractNo: null }
        }, {
            $project: { contractId: 1, contractNo: 1 }
        }, {
            $lookup: {
                from: "contracts",
                let: { contractID: "$contractId" },
                pipeline: [{
                    $match: {
                        $expr: { $eq: ["$$contractID", "$_id"] }
                    }
                }, {
                    $project: { serialNo: 1 }
                }],
                as: "contracts"
            }
        }];

        let docs = await payments.aggregate(pipelines).toArray();
        if (docs.length === 0) {
            console.log(`all payments have "contractNo" field in tenant ${tenant.name}`);
            return res.json("all payments are good");
        }

        console.log(`find ${docs.length} payments without contractNo in tenant ${tenant.name}`);
        let bulk = payments.initializeOrderedBulkOp();
        docs.forEach(doc => {
            let contracts = doc.contracts || [];
            if (contracts.length !== 1) {
                return console.error(`Can't find the contract of payment ${doc._id}`);
            }
            let serialNo = contracts[0].serialNo || null;
            bulk.find({ _id: doc._id }).updateOne({ $set: { contractNo: serialNo } });
        });
        let result = await bulk.execute();
        console.log("fix payments with result: %j", result.result);

        res.json(`${docs.length} payments are fixed with contractNo`);
    } catch (error) {
        if (error instanceof BaseError)
            return next(error);
        else
            return next(new InternalServerError("fail to check payments", error));
    }
}

async function getTenantInfo(req, res, next) {
    try {
        if (req.body.hasOwnProperty('tenant')) {
            let tenantName = req.body.tenant;
            let config_datebase = await db_utils.connect('config');
            let tenant = await config_datebase.collection('tenants').findOne({
                name: tenantName
            });
            if (!tenant) {
                let error = new Error(`tenant ${tenantName} doesn't exist`);
                error.status = 400;
                return next(error);
            }
            console.log("Find tenant %j", tenant);
            req.tenant = tenant;
            req.db = await db_utils.mongojsDB(tenantName);
            return next();
        } else {
            var err = new Error("Missing param 'tenant'");
            err.status = 400;
            return next(err);
        }
    } catch (error) {
        let err = new Error("get tenant fails");
        err.innerError = error;
        return next(err);
    }
}

function legacyUpgrade(req, res, next) {
    // get the tenant to be upgraded
    let doc = req.tenant;
    if (!doc.version) {
        upgradeFromZero(req, res, next);
        doc.version = 1;
        config_db.collection("tenants").save(doc, function(err, doc) {
            if (err) {
                return next(new Error("save tenant version fails"));
            }
            //TODO, send the complete message when all data update
            res.send("Tenant update to 1.0");
        });
    } if (doc.version == 1) {
        upgradeFromOne(req, res, next);
        doc.version = 2;
        config_db.collection("tenants").save(doc, function(err, doc) {
            if (err) {
                return next(new Error("save tenant version fails"));
            }
            //TODO, send the complete message when all data update
            res.send("Tenant update to 2.0");
        });
    } else if (doc.version == 2) {
        upgradeFromTwo(req, res, next);
        doc.version = 3;
        config_db.collection("tenants").save(doc, function(err, doc) {
            if (err) {
                return next(new Error("save tenant version fails"));
            }
            //TODO, send the complete message when all data update
            res.send("Tenant update to 3.0");
        });
    } else if (doc.version == 3) {
        upgradeFromThree(req, res, next);
        doc.version = 4;
        config_db.collection("tenants").save(doc, function(err, doc) {
            if (err) {
                return next(new Error("save tenant version fails"));
            }
            //TODO, send the complete message when all data update
            res.send("Tenant update to 4.0");
        });
    } else if (doc.version == 4) {
        upgradeFromFour(req, res, next);
        doc.version = 5;
        config_db.collection("tenants").save(doc, function(err, doc) {
            if (err) {
                return next(new Error("save tenant version fails"));
            }
            //TODO, send the complete message when all data update
            res.send("Tenant update to 5.0");
        });
    } else {
        return next();
    }
}

function upgradeFromZero(req, res, next) {
    //TODO, close the connection when all data update done
    let tenant_db = req.db;

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

function upgradeFromOne(req, res, next) {
    //TODO, close the connection when all data update done
    let tenant_db = req.db;

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
 */
function upgradeFromTwo(req, res, next) {
    let tenant_db = req.db;

    var members = tenant_db.collection('members');
    // query matches documents that either contain the status field whose value is null or that do not contain the status field.
    // assign default status as 'active'
    members.update({ status: null }, { $set: { status: 'active' } }, { multi: true }, function(err, result) {
        if (err) {
            console.error(err);
        } else {
            console.log('Upgrade from version 2 successfully');
            // e.g. { ok: 1, nModified: 3, n: 3 }
            console.debug(result);
        }
    });
}

function upgradeFromThree(req, res, next) {
    let tenant_db = req.db;

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

function upgradeFromFour(req, res, next) {
    let tenant_db = req.db;

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

async function upgradeFromFive(req, res, next) {
    // get the tenant to be upgraded
    let tenant = req.tenant;
    if (tenant.version !== 5) return next();

    try {
        // step 1: create default type
        let defaultType = await createDefaultClassType(tenant);

        // step 2: set unstarted classes with default type
        await setDefaultTypeForNotStartedClasses(tenant, defaultType);

        // step 3: create contract for all active members, which has remaining credit or classes
        let contracts = await createtDefaultContracts(tenant, defaultType);

        let config_datebase = await db_utils.connect('config');
        let result = await config_datebase.collection('tenants').findOneAndUpdate({
            name: tenant.name,
            version: 5
        }, {
            $set: { version: 6 }
        });
        if (result.value) {
            console.log(`tenant ${tenant.name} is updated to version 6.0`);
        } else {
            console.error(`fail to update tenant ${tenant.name} to version 6.0`);
        }

        res.json(contracts);
    } catch (error) {
        if (error instanceof BaseError)
            return next(error);
        else
            return next(new InternalServerError("fail to upgrade from version 5", error));
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
