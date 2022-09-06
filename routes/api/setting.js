var express = require('express');
var router = express.Router();
var db_utils = require('../../server/databaseManager');
var helper = require('../../helper');
const { ObjectId } = require('mongodb');

/**
 * {
 *  name: String,
 *  displayName: String,
 *  logoPath: String,
 *  version: Integer,
 *  classroom: [{id: String, name: String, visibility: "internal|null"}],
 *  status: "active|inactive",
 *  address: String,
 *  contact: String,
 *  addressLink: String,
 *  feature: "common|book",
 *  types: [{id: String, name: String, status: "open|closed", visible: Boolean}],
 *  groups: [{id: String, name: String, subTypes: [@type_id]}]
 * }
 */

var TENANT_FIELDS = {
    name: 1,
    displayName: 1,
    feature: 1,
    contact: 1,
    address: 1,
    addressLink: 1,
    classroom: 1,
    types: 1,
    groups: 1
};

var config_db = null;
// initialize the 'config' database for setting router
router.use(async function(req, res, next) {
    try {
        config_db = config_db || await db_utils.mongojsDB('config');
        return next();
    } catch (err) {
        let error = new Error("get config database fails");
        error.innerError = err;
        return next(error);
    }
});

router.get('/classrooms', function(req, res, next) {
    if (!req.tenant) {
        let error = new Error("tenant is not defined");
        error.status = 400;
        return next(error);
    }
    res.send(req.tenant.classroom ? req.tenant.classroom : []);
});

router.get('/types', function(req, res, next) {
    if (!req.tenant) {
        let error = new Error("tenant is not defined");
        error.status = 400;
        return next(error);
    }
    res.send(req.tenant.types ? req.tenant.types : []);
});

router.get('/groups', function(req, res, next) {
    if (!req.tenant) {
        let error = new Error("tenant is not defined");
        error.status = 400;
        return next(error);
    }
    res.send(req.tenant.groups ? req.tenant.groups : []);
});

/// Below APIs are visible to authenticated users only
router.use(helper.isAuthenticated);

router.get('/', function(req, res, next) {
    var tenants = config_db.collection('tenants');
    tenants.findOne({
        name: req.user.tenant
    }, TENANT_FIELDS, function(err, doc) {
        if (err) {
            var error = new Error("Get tenant basic setting fails");
            error.innerError = err;
            return next(error);
        }
        console.log(`Get tenant ${req.user.tenant} basic settings`);
        res.json(doc);
    });
});

router.patch('/basic', helper.requireRole("admin"), function(req, res, next) {
    var body = req.body || {};
    // tenant 'name' field is reserved and unique when created
    if (body.hasOwnProperty('name')) {
        var error = new Error('tenant "name" field is unique and immutable');
        error.status = 400;
        return next(error);
    }

    var tenants = config_db.collection('tenants');
    tenants.findAndModify({
        query: {
            name: req.user.tenant
        },
        update: {
            $set: body
        },
        fields: TENANT_FIELDS,
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("Update tenant basic setting fails");
            error.innerError = err;
            return next(error);
        }
        console.log("tenant %s is updated by %j", req.user.tenant, req.body);
        res.json(doc);
    });
});

router.post('/type', helper.requireRole("admin"), async function(req, res, next) {
    //var newType = {id: String, name: String, status: "open|closed", visible: Boolean};
    if (!req.body.name) {
        var error = new Error("type name is not defined");
        error.status = 400;
        return next(error);
    }

    try {
        let configDB = await db_utils.connect("config");
        let tenants = configDB.collection("tenants");
        let result = await tenants.findOneAndUpdate(
            { name: req.user.tenant },
            {
                $push: {
                    types: {
                        id: new ObjectId().toHexString(),
                        name: req.body.name,
                        status: req.body.status,
                        visible: req.body.visible === false ? false : true
                    }
                }
            },
            { returnDocument: "after" }
        );

        if (result.ok !== 1) {
            return next(new Error("Fail to add new class type"));
        }

        console.log(`new class type ${req.body.name.trim()} is created`);
        res.send(result.value);
    } catch (err) {
        var error = new Error("创建课程类型失败");
        error.innerError = err;
        return next(error);
    }
});

router.patch('/type/:typeId', helper.requireRole("admin"), async function(req, res, next) {
    //var newType = {id: String, name: String, status: "open|closed", visible: Boolean};
    if (!req.body.name || typeof req.body.visible !== "boolean") {
        var error = new Error("params of updating type is missing");
        error.status = 400;
        return next(error);
    }

    try {
        let configDB = await db_utils.connect("config");
        let tenants = configDB.collection("tenants");
        let result = await tenants.findOneAndUpdate(
            {
                name: req.user.tenant,
                'types.id': req.params.typeId
            },
            {
                $set: {
                    'types.$.name': req.body.name,
                    'types.$.status': req.body.status,
                    'types.$.visible': req.body.visible
                }
            },
            { returnDocument: "after" }
        );

        if (result.ok !== 1) {
            return next(new Error(`Fail to update type ${req.params.typeId}`));
        }

        console.log(`update class type ${req.params.typeId}`);
        res.send(result.value);
    } catch (err) {
        var error = new Error("修改课程类型失败");
        error.innerError = err;
        return next(error);
    }
});

router.delete('/type/:typeId', helper.requireRole("admin"), async function(req, res, next) {
    next(new Error('not implemented'));
});

router.post('/classrooms', helper.requireRole("admin"), function(req, res, next) {
    //var newRoom = {id:'abc', name:'', visibility: 'internal'|null};
    if (!req.body.id) {
        var error = new Error("classroom ID is not defined");
        error.status = 400;
        return next(error);
    }
    var namePattern = /^[a-z0-9]+$/; // only letter or number
    if (!namePattern.test(req.body.id)) {
        var error = new Error("教室ID包含非法字符，支持小写字母或数字");
        error.status = 400;
        return next(error);
    }

    var tenants = config_db.collection('tenants');
    tenants.findOne({
        name: req.user.tenant,
        'classroom.id': req.body.id
    }, function(err, doc) {
        if (doc) {
            var error = new Error("创建教室失败，教室ID重复");
            error.status = 400;
            return next(error);
        }

        tenants.update({
            name: req.user.tenant
        }, {
            $push: {
                classroom: req.body
            }
        }, function(err, result) {
            if (err) {
                var error = new Error("创建教室失败");
                error.innerError = err;
                return next(error);
            }

            if (result.n == 1) {
                console.log("classroom %j is created", req.body);
                req.tenant.classroom = req.tenant.classroom || [];
                req.tenant.classroom.push(req.body);

                // link all classes or events to this classroom
                if (req.tenant.classroom.length == 1) {
                    migrateFreeClass(req.body, req.db);
                }
            } else {
                console.error("classroom %j fails to create", req.body);
            }
            res.send(result);
        });
    });
});

router.route('/classrooms/:roomID')
    .all(helper.requireRole("admin"))
    .get(function(req, res, next) {
        //TODO, get a classroom
        next(new Error('not implemented'));
    })
    .delete(function(req, res, next) {
        var tenants = config_db.collection('tenants');
        tenants.update({
            name: req.user.tenant
        }, {
            $pull: {
                classroom: {
                    id: req.params.roomID
                }
            }
        }, function(err, result) {
            if (err) {
                var error = new Error("删除教室失败");
                error.innerError = err;
                return next(error);
            }

            if (result.n == 1) {
                console.log("classroom %j is delete", req.params.roomID);

                // update the tenant object in cache
                req.tenant.classroom = req.tenant.classroom || [];
                for (var i = 0; i < req.tenant.classroom.length; i++) {
                    var room = req.tenant.classroom[i];
                    if (room && room.id == req.params.roomID) {
                        req.tenant.classroom.splice(i, 1);
                        break;
                    }
                }
            } else {
                console.error("classroom %j fails to be deleted", req.params.roomID);
            }
            res.json(result);
        });
    })
    .put(function(req, res, next) {
        //TODO, update a classroom
        next(new Error('not implemented'));
    })
    .patch(function(req, res, next) {
        var tenants = config_db.collection('tenants');
        tenants.findAndModify({
            query: {
                name: req.user.tenant,
                'classroom.id': req.params.roomID
            },
            update: {
                $set: {
                    'classroom.$.name': req.body.name,
                    'classroom.$.visibility': req.body.visibility
                }
            },
            new: true
        }, function(err, doc, lastErrorObject) {
            if (err) {
                var error = new Error("update tenant's classroom fails");
                error.innerError = err;
                return next(error);
            }
            console.log("update tenant %s classroom %s", req.user.tenant, req.params.roomID);
            res.json(doc);
        });
    });

function migrateFreeClass(room, database) {
    // https://docs.mongodb.com/manual/tutorial/query-for-null-fields/
    var classes = database.collection("classes");
    classes.update({
        classroom: null
    }, {
        $set: {
            classroom: room.id
        }
    }, { multi: true }, function(err, result) {
        if (err) {
            var error = new Error("update classes with default classroom fails");
            error.innerError = err;
            return console.error(error);
        }
        console.log("%d class is/are linked to classroom %s", result.n, room.id);
    });
}

module.exports = router;
