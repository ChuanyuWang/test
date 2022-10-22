const express = require('express');
const router = express.Router();
const mongojs = require('mongojs');
const { ObjectId } = require("mongodb");
const { isAuthenticated, checkTenant, requireRole } = require('../../helper');
const { check, findAvailableContract } = require('./lib/reservation');
const { ParamError, RuntimeError, asyncMiddlewareWrapper } = require('./lib/basis');

const NORMAL_FIELDS = {
    name: 1,
    status: 1, //"active"|"closed"
    classroom: 1,
    createDate: 1,
    remark: 1,
    members: 1
};

// Below APIs are visible to anonymous users

/// Below APIs are visible to authenticated users only
router.use(isAuthenticated);

/**
 * {
        "_id": "1",
        "name": "123",
        "createDate": "2017-02-26T02:00:00Z",
        "status": "active|closed",
        "remark": "summar only",
        "classroom": "room1",
        "members": [
            { "id": ObjectID("123"), "name": "Hellen", note:"only available in morning" },
            { "id": ObjectID("456"), "name": "Peter" }
        ]
    }
 */
router.get('/', function(req, res, next) {
    var courses = req.db.collection("courses");
    var query = {};
    if (req.query.hasOwnProperty('name')) {
        query['name'] = req.query.name;
    }
    // query courses by status only if status query is defined and not null
    if (req.query.status) {
        query['status'] = {
            $in: req.query.status.split(',').map(function(value) {
                return value ? value : null;
            })
        };
    }
    courses.find(query, NORMAL_FIELDS, function(err, docs) {
        if (err) {
            var error = new Error("Get courses fails");
            error.innerError = err;
            return next(error);
        }
        console.log("find courses: ", docs ? docs.length : 0);
        res.json(docs);
    });
});

router.get('/:courseID', function(req, res, next) {
    var courses = req.db.collection("courses");
    courses.findOne({
        _id: mongojs.ObjectId(req.params.courseID)
    }, NORMAL_FIELDS, function(err, doc) {
        if (err) {
            var error = new Error("Get course fails");
            error.innerError = err;
            return next(error);
        }
        console.log("find course %j", doc);
        res.json(doc);
    });
});

// get the course members with name
const getM = asyncMiddlewareWrapper("Get course members fails");
router.get('/:courseID/members',
    getM(checkCourse),
    getM(getMemebers),
    function(req, res, next) {
        let docs = res.locals.members || [];
        console.log("get course members: %j", docs ? docs.length : 0);
        return res.json(docs);
    }
);

const postM = asyncMiddlewareWrapper("add course's members fails");
router.post('/:courseID/members',
    checkTenant,
    postM(getAddedMembers),
    postM(addMembers2Course),
    postM(getClasses),
    postM(deductContracts),
    function(req, res, next) {
        return res.json({
            addedMembers: res.locals.members,
            updatedClasses: res.locals.classes,
            errors: res.locals.errors
        });
    }
);

const deleteM = asyncMiddlewareWrapper("delete course's members fails");
router.delete('/:courseID/members',
    checkParamId,
    deleteM(removeMembers),
    deleteM(getClasses),
    deleteM(retoreContracts),
    function(req, res, next) {
        return res.json({ ok: 1 });
    }
);

const postC = asyncMiddlewareWrapper("add course's classes fails");
router.post('/:courseID/classes',
    postC(checkCourse),
    postC(addClasses2Course),
    postC(getMemebers),
    postC(deductContracts),
    function(req, res, next) {
        return res.json({
            addedClasses: res.locals.classes,
            errors: res.locals.errors
        });
    }
);

router.post('/', function(req, res, next) {
    if (!req.body.hasOwnProperty('name')) {
        var error = new Error("Missing param 'name'");
        error.status = 400;
        return next(error);
    }
    convertDateObject(req.body);
    req.body.status = 'active';

    var courses = req.db.collection("courses");
    courses.insert(req.body, function(err, docs) {
        if (err) {
            var error = new Error("fail to add course");
            error.innerError = err;
            next(error);
        } else {
            console.log("course is added %j", docs);
            res.json(docs);
        }
    });
});

/// Below APIs are only visible to authenticated users with 'admin' role
router.use(requireRole("admin"));

router.patch('/:courseID', function(req, res, next) {
    var courses = req.db.collection("courses");
    convertDateObject(req.body);

    // members can only added by post 'courses/:id/members' 
    if (req.body.hasOwnProperty('members')) {
        var error = new Error('members can only added by API "courses/:id/members"');
        error.status = 400;
        return next(error);
    }

    courses.findAndModify({
        query: {
            _id: mongojs.ObjectId(req.params.courseID)
        },
        update: {
            $set: req.body
        },
        fields: NORMAL_FIELDS,
        new: true
    }, function(err, doc, lastErrorObject) {
        if (err) {
            var error = new Error("Update course fails");
            error.innerError = err;
            return next(error);
        }
        console.log("course %s is updated by %j", req.params.courseID, req.body);
        res.json(doc);
    });
});

const deleteC = asyncMiddlewareWrapper("delete course's classes fails");
router.delete('/:courseID/classes',
    checkParamId,
    deleteC(removeClasses),
    function(req, res, next) {
        return res.json({ ok: 1 });
    }
);

router.delete('/:courseID', function(req, res, next) {
    req.db.collection('classes').find({
        'courseID': mongojs.ObjectId(req.params.courseID),
        'cost': { $gt: 0 },
        'booking.0': { $exists: true }
    }, { 'booking': 1, 'cost': 1 }, function(err, docs) {
        if (err) {
            var error = new Error(`query classes of course ${req.params.courseID} fails`);
            error.innerError = err;
            return next(error);
        }

        if (docs && docs.length > 0) {
            var error = new Error(`无法删除班级，班级中包含已经预约的付费课程，请取消后再尝试删除`);
            error.status = 400;
            return next(error);
        }

        var courses = req.db.collection("courses");
        courses.remove({
            _id: mongojs.ObjectId(req.params.courseID)
        }, { justOne: true }, function(err, result) {
            if (err) {
                var error = new Error("delete course fails");
                error.innerError = err;
                return next(error);
            }

            // remove all classes with courseID
            req.db.collection("classes").remove({
                courseID: mongojs.ObjectId(req.params.courseID)
            }, { justOne: false }, function(err, result) {
                // result is {"n":0,"ok":1,"deletedCount":0}
                if (err) console.error("delete course's classes fails");
                else console.log("delete classes of course %s with result %j", req.params.courseID, result);
            });
            // check the result and respond
            if (result.n == 1) {
                console.log("course %s is deleted", req.params.courseID);
                res.json(result);
            } else {
                console.log("can't find course %s to be deleted", req.params.courseID);
                var error = new Error("can't find course to be deleted");
                error.status = 400;
                return next(error);
            }
        });
    });
});

/**
 * make sure the datetime object is stored as ISODate
 * @param {Object} doc 
 */
function convertDateObject(doc) {
    if (!doc) return doc;
    if (doc.hasOwnProperty("createDate")) {
        doc["createDate"] = new Date(doc["createDate"]);
    }
    return doc;
}

function checkParamId(req, res, next) {
    if (!req.body.hasOwnProperty('id')) {
        return next(new ParamError('missing param "id"'));
    } else if (!ObjectId.isValid(req.body.id)) {
        return next(new ParamError("param id is invalid"))
    } else if (!ObjectId.isValid(req.params.courseID)) {
        return next(new ParamError("course id is invalid"))
    }
    return next();
}

async function checkCourse(db, req, locals) {
    if (!ObjectId.isValid(req.params.courseID)) {
        throw ParamError(`course id ${req.params.courseID} is invalid`);
    }
    let courses = db.collection("courses");
    let doc = await courses.findOne({ _id: ObjectId(req.params.courseID), });
    if (!doc) {
        throw new RuntimeError("未找到班级");
    }
    locals.course = doc;
}

async function removeClasses(db, req, locals) {
    //TODO, support remove multi classes
    let removedClassIDs = [ObjectId(req.body.id)];
    let classes = db.collection("classes");
    let contracts = db.collection("contracts");

    for (let i = 0; i < removedClassIDs.length; i++) {
        const id = removedClassIDs[i];
        let result = await classes.findOneAndDelete({ _id: id });
        // result is { lastErrorObject: { n: 1 }, value: deleted_doc, ok: 1}
        if (!result.value) {
            console.error(`fatal error occurred: class ${id} is not deleted`);
            continue;
        }
        let c = result.value;

        console.log(`delete classes ${id} from course ${req.params.courseID}`);
        let booking = c.booking || [];

        if (booking.length === 0) continue;

        let restoreContracts = booking.map(value => {
            return ObjectId.isValid(value.contract) ? value.contract : null;
        });

        //check if quantity is more than 1
        let quantityGT1 = booking.some(value => {
            value.quantity > 1;
        });
        if (quantityGT1) console.error(`fatal error occurred. Invalid quantity is found when restoring contracts according to %j`, booking);

        result = await contracts.updateMany({
            _id: { $in: restoreContracts }
        }, {
            $inc: { "consumedCredit": -c.cost } // assume quantity is always 1
        });

        //result.result is {ok: 1, n: 10, nModified: 5}
        if (result.result.nModified !== booking.length) {
            console.error(`fatal error occurred when cancel all booking %j`, booking);
        }

        console.log(`return ${c.cost} credit to contracts with result: %j`, result.result);
    }
}

async function getAddedMembers(db, req, locals) {
    // find the members to add
    let members = db.collection("members");

    let added_members = Array.isArray(req.body) ? req.body : [req.body];
    added_members = added_members.map(function(value, index, array) {
        if (ObjectId.isValid(value.id)) return ObjectId(value.id);
        return undefined;
    });
    if (added_members.length === 0) return locals.members = [];

    // TODO, check the status of member before adding to course
    let cursor = members.find({
        _id: { $in: added_members }
    }, { projection: { name: 1, contact: 1, status: 1 } });
    let docs = await cursor.toArray();

    console.log(`find ${docs.length} members to add into course`);
    locals.members = docs;
}

async function addClasses2Course(db, req, locals) {
    let items = Array.isArray(req.body) ? req.body : [req.body];
    // none classes needed to be created
    if (items.length === 0) return locals.classes = [];

    let course = locals.course;
    if (course.status === "closed") {
        throw new RuntimeError("添加课程失败, 班级已经结束, 不能添加学员或课程");
    }
    // create new added classes
    let added_classes = items.map(function(value, index, array) {
        value.courseID = course._id;
        if (value.hasOwnProperty("date")) {
            value["date"] = new Date(value["date"]);
        }
        if (value.teacher) {
            // save the teacher property as object reference
            value["teacher"] = ObjectId(value["teacher"]);
        }
        value.cost = value.cost || 0;
        value.capacity = value.capacity || 8;
        value.booking = []; // clear the booking for new added course's classes
        value.books = []; // clear the books for new added course's classes
        return value;
    });

    let classes = db.collection('classes');
    let result = await classes.insertMany(added_classes);
    // result is {result: {ok:1, n:1}, ops: [], insertedCount: 1, insertedIds: {'0': ObjectId}}
    console.log("add %j classes to course %s", result.ops, req.params.courseID);
    locals.classes = added_classes;
}

async function addMembers2Course(db, req, locals) {
    let added_members = locals.members || [];
    if (added_members.length === 0) {
        throw new ParamError("添加学员失败, 未找到学员");
    }
    let course_added_members = added_members.map(function(value, index, array) {
        return {
            id: value._id,
            name: value.name
        };
    });

    let courses = db.collection("courses");
    let result = await courses.findOneAndUpdate({
        // We have to skip the check, contract has been deduct, we have to insert anyway
        //"booking.member": { $ne: member._id }, 
        _id: ObjectId(req.params.courseID),
        status: { $ne: "closed" }
    }, {
        $push: {
            members: { $each: course_added_members }
        }
    }, {
        projection: NORMAL_FIELDS,
        returnDocument: "after"
    });

    if (!result.value) {
        console.error("fatal error occurred: %j", result.lastErrorObject);
        throw new RuntimeError("添加学员失败, 班级已经结束, 不能添加学员或课程");
    } else {
        console.log("add %j members to course %s", req.body, req.params.courseID);
        locals.course = result.value;
    }
}

/**
 * Get all unstarted classes of one course
 * @param {Object} db 
 * @param {Request} req 
 * @param {*} locals 
 */
async function getClasses(db, req, locals) {
    // find all the classes of the course
    let course = locals.course;
    let classes = db.collection("classes");

    // only get classes not started
    let cursor = classes.find({ courseID: course._id, date: { $gt: new Date() } });
    let docs = await cursor.toArray();

    console.debug(`find ${docs.length} unstarted classes of course ${course._id}`);
    locals.classes = docs || [];
}

/**
 * Get all member documents of current course
 * @param {*} db 
 * @param {*} req 
 * @param {*} locals 
 * @returns 
 */
async function getMemebers(db, req, locals) {
    let course = locals.course;
    let course_members = course.members || [];
    if (course_members.length == 0) return locals.members = [];
    let memberIDs = course_members.map(function(value, index, array) {
        return value.id;
    });
    let members = db.collection("members");
    let cursor = members.find({ _id: { $in: memberIDs } }, {
        projection: { name: 1, contact: 1, status: 1 }
    });
    locals.members = await cursor.toArray();
}

async function deductContracts(db, req, locals) {
    let added_members = locals.members || [];
    let added_classes = locals.classes || [];
    if (added_classes.length === 0 || added_members.length === 0) {
        return locals.errors = [];
    }

    let errors = [];
    function errorbuilder(m, c, msg) {
        return `添加${m.name}到课程${c.name}失败，原因: ${msg}`;
    }
    let contracts = db.collection("contracts");
    let classes = db.collection("classes");
    for (let i = 0; i < added_members.length; i++) {
        const m = added_members[i];

        // sort result from old to new ['2022-9-29','2022-10-8']
        let cursor = contracts.find({ memberId: m._id }, {
            projection: { comments: 0, history: 0 },
            sort: [['effectiveDate', 1]]
        });

        let all_contracts = await cursor.toArray();

        for (let j = 0; j < added_classes.length; j++) {
            const c = added_classes[j];

            let error = check(m, c, 1);
            if (error) {
                errors.push(errorbuilder(m, c, error.message));
                continue;
            }

            let contract2Deduct = findAvailableContract(c, all_contracts);
            if (!contract2Deduct) {
                errors.push(errorbuilder(m, c, "未购买课程或合约未生效"));
                continue;
            }

            //deduct contract
            let result = await contracts.findOneAndUpdate({
                _id: contract2Deduct._id,
                consumedCredit: contract2Deduct.consumedCredit,
                status: contract2Deduct.status
            }, {
                $inc: { "consumedCredit": c.cost } // quantity is always 1 since new version
            }, {
                projection: { consumedCredit: 1, credit: 1 },
                returnDocument: "after"
            });

            if (!result.value) {
                console.error("fatal error occurred: %j", result.lastErrorObject);
                continue;
            }
            console.log("deduct %f credit from contract %s (after: %j)", c.cost, contract2Deduct.serialNo, result.value);
            // update consumedCredit for next check
            contract2Deduct.consumedCredit += c.cost;

            // add booking
            let newbooking = {
                member: m._id,
                quantity: 1, // always be 1 since new version
                bookDate: new Date(),
                contract: contract2Deduct._id
            };
            result = await classes.findOneAndUpdate({
                // We have to skip the check, contract has been deduct, we have to insert anyway
                //"booking.member": { $ne: member._id }, 
                _id: c._id
            }, {
                $push: { booking: newbooking }
            }, {
                projection: { booking: 1, cost: 1 },
                returnDocument: "after"
            });

            if (!result.value) {
                console.error("fatal error occurred: %j", result.lastErrorObject);
                continue
            }

            console.log(`add booking successfuly to class ${c._id}`);
            // update booking for next check
            c.booking = result.value.booking;
        }
    }
    locals.errors = errors;
}

async function removeMembers(db, req, locals) {
    //TODO, support remove multi members
    let memberIDs = [ObjectId(req.body.id)];
    let courses = db.collection("courses");

    //remove members
    let result = await courses.findOneAndUpdate({
        _id: ObjectId(req.params.courseID)
    }, {
        $pull: {
            "members": { id: { $in: memberIDs } }
        }
    }, {
        projection: NORMAL_FIELDS,
        returnDocument: "after"
    });

    if (!result.value) {
        console.error("fatal eror occurred: %j", result.lastErrorObject);
        throw new RuntimeError("fail to remove members from course document");
    }

    console.log("delete %j members from course %s", req.body, req.params.courseID);
    locals.course = result.value;
    // [memberId, memberId, memberId]
    locals.removed_members = memberIDs;
}

async function retoreContracts(db, req, locals) {
    let unStartedClasses = locals.classes;
    let removed_members = locals.removed_members; // [memberId, memberId, memberId]
    if (unStartedClasses.length === 0 || removed_members.length === 0) return locals.errors = [];

    const classes = db.collection("classes");
    const contracts = db.collection("contracts");
    for (let i = 0; i < removed_members.length; i++) {
        // m is the ObjectID of member
        const m = removed_members[i];

        for (let j = 0; j < unStartedClasses.length; j++) {
            const c = unStartedClasses[j];
            // skip free class
            if (c.cost <= 0) continue;

            let booking = c.booking || [];
            let removedBooking = booking.find(value => {
                return value.member.toString() == m;
            });

            // skip if not booking
            if (!removedBooking) continue;

            if (!ObjectId.isValid(removedBooking.contract)) {
                console.error(`contract is not found: class ${c._id}`);
                continue;
            }

            let quantity = removedBooking.quantity || 1;
            //retore credit to contract
            let result = await contracts.findOneAndUpdate({
                _id: removedBooking.contract
            }, {
                $inc: { "consumedCredit": -c.cost * quantity }
            }, {
                projection: { credit: 1, consumedCredit: 1 },
                returnDocument: "after"
            });

            if (result.value) {
                console.log(`return ${c.cost} credit to contract ${removedBooking.contract} (after: ${JSON.stringify(result.value)})`);
            } else {
                //TODO, handle the callback when contract is not existed.
                console.error(`Fail to return expense to contract ${removedBooking.contract}`);
            }
        }

        // remove the booking reservation
        let result = await classes.updateMany({
            'courseID': ObjectId(req.params.courseID),
            date: { $gte: new Date() }
        }, {
            $pull: { booking: { member: m } }
        });

        console.log(`remove the booking of member ${m} from not started classes: %j`, result.result);
    }
}

module.exports = router;
