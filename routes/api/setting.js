var express = require('express');
var router = express.Router();
var db_utils = require('../../server/databaseManager');
var helper = require('../../helper');
const { ObjectId } = require('mongodb');
const { RuntimeError, asyncMiddlewareWrapper, ParamError, BadRequestError } = require("./lib/basis");

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

let config_db = null;
// initialize the 'config' database for setting router
router.use(async function(req, res, next) {
    try {
        config_db = config_db || await db_utils.connect('config');
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

router.get('/', async function(req, res, next) {
    let tenants = config_db.collection('tenants');
    try {
        let doc = await tenants.findOne(
            { name: req.user.tenant },
            { projection: TENANT_FIELDS }
        );
        console.log(`Get tenant ${req.user.tenant} basic settings`);
        res.json(doc);
    } catch (error) {
        return next(new RuntimeError("Get tenant basic setting fails", error));
    }
});

router.patch('/basic', helper.requireRole("admin"), async function(req, res, next) {
    var body = req.body || {};
    // tenant 'name' field is reserved and unique when created
    if (body.hasOwnProperty('name')) {
        return next(new ParamError('tenant "name" field is unique and immutable'));
    }

    try {
        let tenants = config_db.collection('tenants');
        let result = await tenants.findOneAndUpdate(
            { name: req.user.tenant },
            { $set: body },
            { projection: TENANT_FIELDS, returnDocument: "after" }
        );
        if (result.value) {
            console.log("tenant %s is updated by %j", req.user.tenant, req.body);
            return res.json(result.value);
        } else {
            return next(new BadRequestError('tenant not found'));
        }
    } catch (error) {
        return next(new RuntimeError("Update tenant basic setting fails", error));
    }
});

router.post('/types', helper.requireRole("admin"), async function(req, res, next) {
    //var newType = {id: String, name: String, status: "open|closed", visible: Boolean};
    if (!req.body.name) {
        return next(new ParamError("type name is not defined"));
    }

    try {
        let tenants = config_db.collection("tenants");
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

        if (!result.value) {
            return next(new BadRequestError("Tenant not found"));
        }

        console.log(`new class type "${req.body.name.trim()}" is created`);
        res.send(result.value);
    } catch (error) {
        return next(new RuntimeError("创建课程类型失败", error));
    }
});

router.patch('/types/:typeId', helper.requireRole("admin"), async function(req, res, next) {
    //var newType = {id: String, name: String, status: "open|closed", visible: Boolean};
    if (!req.body.name || typeof req.body.visible !== "boolean") {
        return next(new ParamError("params of updating type is missing"));
    }

    try {
        let tenants = config_db.collection("tenants");
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

        if (!result.value) {
            return next(new BadRequestError(`Fail to update type ${req.params.typeId}`));
        }

        console.log(`update class type ${req.params.typeId}`);
        res.send(result.value);
    } catch (error) {
        return next(new RuntimeError("修改课程类型失败", error));
    }
});

//TODO, it's not necessary to use wrap here, because it will initialize tenant db again
const deleteT = asyncMiddlewareWrapper("删除课程类型失败");
router.delete('/types/:typeId', helper.requireRole("admin"), deleteT(checkHasContractsOrClasses), async function(req, res, next) {
    try {
        let configDB = await db_utils.connect("config");
        let tenants = configDB.collection("tenants");
        let result = await tenants.findOneAndUpdate({
            name: req.user.tenant
        }, {
            $pull: {
                types: {
                    id: req.params.typeId
                }
            }
        }, { returnDocument: "after" });

        if (!result.value) {
            return next(new BadRequestError(`Fail to delete type ${req.params.typeId}`));
        }

        console.log(`update class type ${req.params.typeId}`);
        res.send(result.value);
    } catch (error) {
        return next(new RuntimeError("删除课程类型失败", error));
    }
});

router.post('/classrooms', helper.requireRole("admin"), async function(req, res, next) {
    //var newRoom = {id:'abc', name:'', visibility: 'internal'|null};
    if (!req.body.id) {
        return next(new ParamError("classroom ID is not defined"));
    }
    var namePattern = /^[a-z0-9]+$/; // only letter or number
    if (!namePattern.test(req.body.id)) {
        return next(new ParamError("教室ID包含非法字符,支持小写字母或数字"));
    }

    try {
        let tenants = config_db.collection('tenants');
        let doc = await tenants.findOne({
            name: req.user.tenant,
            'classroom.id': req.body.id
        });
        if (doc) {
            return next(new BadRequestError("创建教室失败,教室ID重复"));
        }
        let result = await tenants.findOneAndUpdate(
            { name: req.user.tenant },
            { $push: { classroom: req.body } },
            { returnDocument: "after" }
        );

        if (result.value) {
            console.log("classroom %j is created", req.body);
            // update the classroom field in req.tenant object
            req.tenant.classroom = result.value.classroom;

            // link all existed classes or events to the only newly added classroom
            if (req.tenant.classroom.length == 1) {
                await migrateFreeClass(req.body, req.db);
            }
        } else {
            return next(new BadRequestError("Tenant not found"));
        }
        return res.send(result.lastErrorObject);
    } catch (error) {
        return next(new RuntimeError("创建教室失败", error));
    }
});

router.route('/classrooms/:roomID')
    .all(helper.requireRole("admin"))
    .get(function(req, res, next) {
        //TODO, get a classroom
        next(new BadRequestError('not implemented'));
    })
    .delete(async function(req, res, next) {
        try {
            let tenants = config_db.collection('tenants');
            let result = await tenants.findOneAndUpdate(
                { name: req.user.tenant },
                {
                    $pull: {
                        classroom: {
                            id: req.params.roomID
                        }
                    }
                },
                { returnDocument: "after" }
            );

            if (result.value) {
                console.log("classroom %j is delete", req.params.roomID);

                // update the tenant object in cache
                req.tenant.classroom = result.value.classroom;
            } else {
                console.error("classroom %j fails to be deleted", req.params.roomID);
            }
            return res.json(result.lastErrorObject);
        } catch (error) {
            return next(new RuntimeError("删除教室失败", error));
        }
    })
    .put(function(req, res, next) {
        //TODO, update a classroom
        next(new BadRequestError('not implemented'));
    })
    .patch(async function(req, res, next) {
        try {
            let tenants = config_db.collection('tenants');
            let result = await tenants.findOneAndUpdate({
                name: req.user.tenant,
                'classroom.id': req.params.roomID
            }, {
                $set: {
                    'classroom.$.name': req.body.name,
                    'classroom.$.visibility': req.body.visibility
                }
            }, {
                returnDocument: "after"
            });
            if (result.value) {
                console.log("update tenant %s classroom %s", req.user.tenant, req.params.roomID);
                res.json(result.value);
            } else {
                return next(new BadRequestError("Tenant or classroom not found"));
            }
        } catch (error) {
            return next(new RuntimeError("Fail to update tenant's classroom", error));
        }
    });

async function migrateFreeClass(room, database) {
    try {
        // https://docs.mongodb.com/manual/tutorial/query-for-null-fields/
        let classes = database.collection("classes");
        let result = await classes.updateMany(
            { classroom: null },
            { $set: { classroom: room.id } }
        );
        console.log("%d class is/are linked to classroom %s", result.modifiedCount, room.id);
    } catch (error) {
        return console.error(error);
    }
}

//TODO, the first parameter db seems duplicated
async function checkHasContractsOrClasses(db, req, locals) {
    let contracts = db.collection("contracts");
    let doc = await contracts.findOne({ goods: req.params.typeId, status: { $ne: "deleted" } });
    if (doc) throw new RuntimeError("不能删除已产生合约的课程类型");

    let classes = db.collection("classes");
    doc = await classes.findOne({ type: req.params.typeId });
    if (doc) throw new RuntimeError("不能删除已创建课程的课程类型");
}

module.exports = router;
