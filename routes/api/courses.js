const express = require('express');
const router = express.Router();
const { ObjectId } = require("mongodb");
const { isAuthenticated, hasTenant, requireRole } = require('../../helper');
const { check, findAvailableContract } = require('./lib/reservation');
const { ParamError, RuntimeError, asyncMiddlewareWrapper, BadRequestError } = require('./lib/basis');

const NORMAL_FIELDS = {
    name: 1,
    status: 1, //"active"|"closed"
    classroom: 1,
    createDate: 1,
    remark: 1,
    members: 1
};

// Below APIs are visible to anonymous users

// Below APIs are visible to authenticated users only
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
router.get('/', async function(req, res, next) {
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
    try {
        const courses = req.db.collection("courses");
        let docs = await courses.find(query, { projection: NORMAL_FIELDS }).toArray();

        console.log("find courses: ", docs ? docs.length : 0);
        return res.json(docs);
    } catch (error) {
        return next(new RuntimeError("Get courses fails", error));
    }
});

router.get('/:courseID', async function(req, res, next) {
    try {
        const courses = req.db.collection("courses");
        let doc = await courses.findOne(
            { _id: ObjectId(req.params.courseID) },
            { projection: NORMAL_FIELDS }
        );

        console.log("find course %j", doc);
        return res.json(doc || {});
    } catch (error) {
        return next(new RuntimeError(`Fail to get course ${req.params.courseID}`, error));
    }
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
    hasTenant,
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
    deleteM(restoreContracts),
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

router.post('/', async function(req, res, next) {
    if (!req.body.hasOwnProperty('name')) {
        return next(new ParamError(`Missing param "name"`));
    }
    convertDateObject(req.body);
    req.body.status = 'active';

    try {
        const courses = req.db.collection("courses");
        let result = await courses.insertOne(req.body);
        if (result.acknowledged) {
            console.log("course is added %j", req.body);
            return res.json(req.body);
        } else {
            console.error(`Fail to add course`);
            return res.json({});
        }
    } catch (error) {
        return next(new RuntimeError("Fail to add course", error));
    }
});

/// Below APIs are only visible to authenticated users with 'admin' role
router.use(requireRole("admin"));

router.patch('/:courseID', async function(req, res, next) {
    convertDateObject(req.body);

    // members can only added by post 'courses/:id/members' 
    if (req.body.hasOwnProperty('members')) {
        var error = new Error('members can only added by API "courses/:id/members"');
        error.status = 400;
        return next(error);
    }
    try {
        const courses = req.db.collection("courses");
        let result = await courses.findOneAndUpdate(
            { _id: ObjectId(req.params.courseID) },
            { $set: req.body },
            { projection: NORMAL_FIELDS, returnDocument: "after" }
        );

        if (!result.value) {
            return next(new BadRequestError(`Course ${req.params.courseID} not found`));
        }

        console.log("course %s is updated by %j", req.params.courseID, req.body);
        return res.json(result.value);
    } catch (error) {
        return next(new RuntimeError("Update course fails", error));
    }
});

const deleteC = asyncMiddlewareWrapper("delete course's classes fails");
router.delete('/:courseID/classes',
    checkParamId,
    deleteC(removeClasses),
    function(req, res, next) {
        return res.json({ ok: 1 });
    }
);

router.delete('/:courseID', async function(req, res, next) {
    try {
        const classes = req.db.collection("classes");
        let doc = await classes.findOne({
            'courseID': ObjectId(req.params.courseID),
            'cost': { $gt: 0 },
            'booking.0': { $exists: true }
        }, {
            projection: { 'booking': 1, 'cost': 1 }
        });
        if (doc) {
            return next(new BadRequestError("不能删除班级，班级中包含已经预约的付费课程，请取消后再尝试删除"));
        }

        // remove the course
        const courses = req.db.collection("courses");
        let result = await courses.findOneAndDelete({ _id: ObjectId(req.params.courseID) });
        // result is {"ok":1, "value": {deleted document}, "lastErrorObject":{n:1}}
        if (!result.value) {
            return next(new BadRequestError(`Course ${req.params.courseID} not found`));
        }
        console.log("course %s is deleted", req.params.courseID);

        // remove all classes with courseID
        result = await classes.deleteMany({ courseID: ObjectId(req.params.courseID) });
        // result is { "acknowledged": true, "deletedCount":2}
        console.log(`delete ${result.deletedCount} classes belong to the course`);

        return res.json({ ok: 1 });
    } catch (error) {
        return next(new RuntimeError(`Fail to delete course ${req.params.courseID}`, error));
    }
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

        console.log(`delete classes ${id} (${c.name}/${c.date.toDateString()}) from course ${req.params.courseID}`);
        let booking = c.booking || [];

        // no one book
        if (booking.length === 0) continue;

        // no cost to return
        if (c.cost <= 0) continue;

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

        if (result.modifiedCount !== booking.length) {
            console.error(`fatal error occurred when cancel all booking %j`, booking);
        }

        console.log(`return ${c.cost} credit to contracts with result: %j`, result);
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
    // result is {"acknowledged":true, "insertedCount":1, "insertedIds": {'0': ObjectId}}
    console.log(`add ${result.insertedCount} classes to course ${req.params.courseID}`);
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
        // {id: 1, name: "a"} and {name: "a", id: 1} will be treated as two different objectsby addToSet
        $addToSet: { // avoid duplicate member, {id, name}, id must be the first field
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
    function createErrorMessage(m, c, msg) {
        return `添加${m.name}到课程${c.name}失败，原因: ${msg}`;
    }
    let contracts = db.collection("contracts");
    let classes = db.collection("classes");
    for (let i = 0; i < added_members.length; i++) {
        const m = added_members[i];

        // sort result from old to new ['2022-9-29','2022-10-8']
        let cursor = contracts.find({
            memberId: m._id,
            status: "paid",
            $or: [
                { expireDate: { $gt: new Date() } },
                { expireDate: null }
            ]
        }, {
            projection: { comments: 0, history: 0 },
            sort: [['effectiveDate', 1]]
        });

        let valid_contracts = await cursor.toArray();

        for (let j = 0; j < added_classes.length; j++) {
            const c = added_classes[j];

            let error = check(m, c, 1);
            if (error) {
                errors.push(createErrorMessage(m, c, error.message));
                continue;
            }

            let contract2Deduct = findAvailableContract(c, valid_contracts);
            if (!contract2Deduct) {
                errors.push(createErrorMessage(m, c, "未购买课程或合约未生效"));
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

            console.log(`add booking successfully to class ${c._id}`);
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
        console.error("fatal error occurred: %j", result.lastErrorObject);
        throw new RuntimeError("fail to remove members from course document");
    }

    console.log("delete %j members from course %s", req.body, req.params.courseID);
    locals.course = result.value;
    // [memberId, memberId, memberId]
    locals.removed_members = memberIDs;
}

async function restoreContracts(db, req, locals) {
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

        console.log(`remove the booking of member ${m} from not started classes: %j`, result);
    }
}

module.exports = router;
