var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
const { check, findAvailableContract } = require('./lib/reservation');
var helper = require('../../helper');
const db_utils = require('../../server/databaseManager');
const { ObjectId } = require('mongodb');
const { ParamError, asyncMiddlewareWrapper, RuntimeError } = require("./lib/basis");

router.use(helper.checkTenant);

/**
 * Get the member list who booked the class
 */
router.get('/', helper.isAuthenticated, function(req, res, next) {
    if (!req.query.classid) {
        let error = new Error("Missing param 'classid'");
        error.status = 400;
        return next(error);
    }

    let pipelines = [{
        $match: { _id: mongojs.ObjectId(req.query.classid) }
    }, {
        $project: { booking: 1 }
    }, {
        $lookup: {
            from: 'members',
            let: {
                // define the variable "memberList" as empty array when no booking, 
                // otherwise the "$in" operation will throw error in pipeline
                memberList: {
                    $cond: {
                        if: { $isArray: ['$booking.member'] },
                        then: '$booking.member',
                        else: []
                    }
                }
            },
            pipeline: [{
                $match: {
                    $expr: {
                        $in: ["$_id", "$$memberList"]
                    }
                }
            }, {
                $project: {
                    _id: 1,
                    name: 1,
                    contact: 1
                }
            }],
            as: 'users'
        }
    }];

    const tenantDB = req.db;
    var classes = tenantDB.collection("classes");
    classes.aggregate(pipelines, function(err, docs) {
        if (err) {
            let error = new Error("get booking fails");
            error.innerError = err;
            return next(error);
        }

        if (!docs || docs.length !== 1) {
            // docs === [] when the classid is invalid
            return res.status(400).json({
                'code': 2002,
                'message': "没有找到指定课程，请刷新重试",
                'err': err
            });
        }

        let booking = docs[0].booking || []; // booking is undefined when there is no booking
        let users = docs[0].users; // users will be empty array when there is no matched members
        console.log("find booking of class %s: %j", req.query.classid, booking);
        console.log("find %s members who book class %s", users.length, req.query.classid);

        // Find all the valid booking which member exists
        var book_items = [];
        for (var i = 0; i < booking.length; i++) {
            for (var j = 0; j < users.length; j++) {
                if (booking[i].member == users[j]._id.toString()) {
                    booking[i].userName = users[j].name;
                    booking[i].contact = users[j].contact;
                    book_items.push(booking[i]);
                    break;
                }
            }
        }
        res.json(book_items);
    });
});

const postR = asyncMiddlewareWrapper("Fail to book");
/**
 * booking a class by member
 * 
 * req.body = {
    openid : "o0uUrv4RGMMiGasPF5bvlggasfGk", (optional)
    name : "小朋友1",
    contact : "13500000000",
    classID : "5716630aa012576d0371e888",
    memberid: String
 }
 */
router.post('/',
    validateCreateBooking,
    postR(getClassObj),
    postR(createMemberIfNotExist),
    checkSeatandAge,
    postR(findContract),
    postR(deductContract),
    async function(req, res, next) {
        try {
            let cls = res.locals.cls;
            let contract = res.locals.contract;
            let member = res.locals.member;
            let tenantDB = await db_utils.connect(req.tenant.name);
            let classes = tenantDB.collection("classes");
            //let after_cls = await createNewBook(tenantDB, member, cls, req.body.quantity);

            let newbooking = {
                member: member._id,
                quantity: 1, // always be 1 since new version
                bookDate: new Date(),
                contract: contract ? contract._id : undefined
            };
            let result = await classes.findOneAndUpdate({
                // We have to skip the check, contract has been deduct, we have to insert anyway
                //"booking.member": { $ne: member._id }, 
                _id: cls._id
            }, {
                $push: {
                    booking: newbooking
                }
            }, { returnDocument: "after" });
            if (!result.value) {
                console.error("fatal error occurred: %j", result.lastErrorObject);
                return next(new RuntimeError("class seems been deleted just before booking, but contract already been deduct!"));
            }

            console.log(`add booking successfully to class ${cls._id}`);
            return res.json({
                class: result.value,
                member: member
            });
        } catch (error) {
            return next(new RuntimeError("Fail to book", error));
        }
    }
);

// remove specfic user's booking info
// TODO, the delete operation may sent accidentally.
router.delete('/:classID', async function(req, res, next) {
    if (!req.tenant || !req.tenant.name) {
        return next(new ParamError(`tenant is undefined`));
    }
    if (!req.body.memberid) {
        return next(new ParamError(`Missing param "memberid"`));
    } else if (!ObjectId.isValid(req.body.memberid)) {
        return next(new ParamError(`memberid ${req.body.memberid} is invalid`));
    }

    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        let classes = tenantDB.collection("classes");
        let doc = await classes.findOne({
            _id: ObjectId(req.params.classID),
            "booking.member": ObjectId(req.body.memberid)
        });

        if (!doc) {
            return next(new ParamError("没有找到指定课程预约，请刷新重试", 2009));
        }

        // find the booking info of member
        let bookingInfo = doc.booking.find(value => {
            return value.member.toString() == req.body.memberid;
        });
        // Can't cancel the booking if order is available
        // TODO, check refund status and cancel booking
        if (bookingInfo.order) {
            return next(new ParamError("预约订单已经支付，请联系门店取消预约"));
        }

        if (req.isAuthenticated() && req.user.tenant === req.tenant.name) {
            if (req.user.role === "admin") {
                //only admin could delete the booking in any time
                console.log("Admin %s cancel the booking of %s", req.user.username, req.body.memberid);
            } else if (Date.now() < doc.date.getTime() + 3600000) {
                // the other authenticated users could delete the booking before class ending, assume each class takes 1 hour, 
                // 1 hours = 3600000 (1*60*60*1000)
                console.log("User %s cancel the booking of %s", req.user.username, req.body.memberid);
            } else {
                return next(new ParamError("不能在课程开始1小时后取消预约"));
            }
        } else if (Date.now() + 86400000 > doc.date.getTime()) {
            // be free to cancel the booking if it's less than 24 hours before begin
            // 24 hours = 86400000 ms (24*60*60*1000)
            return next(new ParamError("不能在开始前24小时内取消课程或取消已经结束的课程"));
        }

        let result = await classes.findOneAndUpdate({
            _id: ObjectId(req.params.classID)
        }, {
            $pull: {
                "booking": {
                    member: ObjectId(req.body.memberid)
                }
            }
        }, {
            projection: { cost: 1, booking: 1 },
            returnDocument: "after"
        });

        // lastErrorObject: { n: 1, updatedExisting: true }
        let lastErrorObject = result.lastErrorObject || {};
        if (!lastErrorObject.updatedExisting) {
            // class session is gone, it should never happen
            console.error(`Can't find the session ${req.params.classID} when canceling booking`);
            return res.json(doc);
        }
        // update the class session with new data
        doc = result.value;
        if (doc.cost > 0 && bookingInfo.contract) {
            //TODO, handle the callback when member is inactive.
            let contracts = tenantDB.collection("contracts");
            result = await contracts.findOneAndUpdate({
                _id: bookingInfo.contract
            }, {
                $inc: { "consumedCredit": -doc.cost }
            }, {
                projection: { credit: 1, consumedCredit: 1 },
                returnDocument: "after"
            });

            if (result.lastErrorObject.updatedExisting) {
                console.log(`return ${doc.cost} credit to contract ${bookingInfo.contract} (after: ${JSON.stringify(result.value)})`);
            } else {
                //TODO, handle the callback when contract is not existed.
                console.error(`Fail to return expense to contract ${bookingInfo.contract}`);
            }
        } else if (doc.cost > 0) {
            console.error(`Can't find the contract of session ${req.params.classID}`);
        }

        return res.json(doc);
    } catch (err) {
        let error = new Error(`Fail to cancel booking from ${req.params.classID}`);
        error.innerError = err;
        return next(error);
    }
});

function validateCreateBooking(req, res, next) {
    if (!req.tenant || !req.tenant.name) {
        return next(new ParamError(`tenant is undefined`));
    }

    if (!req.body.classid) {
        return next(new ParamError(`Missing param 'classid'`));
    }

    if (req.body.classid && !ObjectId.isValid(req.body.classid)) {
        return next(new ParamError(`classid ${req.body.classid} is invalid`));
    }

    let user_query = {};
    if (req.body.memberid) {
        if (ObjectId.isValid(req.body.memberid)) {
            user_query._id = ObjectId(req.body.memberid)
        } else {
            return next(new ParamError(`memberid ${req.body.memberid} is invalid`));
        }
    } else if (req.body.name && req.body.contact) {
        user_query.name = req.body.name;
        user_query.contact = req.body.contact;
    } else {
        return next(new ParamError(`missing parameters of member`));
    }
    res.locals.user_query = user_query;
    return next();
}

async function getClassObj(db, req, locals) {
    // find the class want to book
    let classes = db.collection("classes");
    let cls = await classes.findOne({ _id: ObjectId(req.body.classid) });
    if (!cls) {
        throw new ParamError("没有找到指定课程，请刷新重试", 2002);
    }
    console.log("class is found %j", cls);

    // 1 hour = 3600000 (1*60*60*1000)
    // 1 minute = 60000 (1*60*1000)
    if (Date.now() > cls.date.getTime() - 60000) {
        if (req.isUnauthenticated() || req.user.tenant != req.tenant.name) {
            // member can only book the class 1 hour before started
            throw new ParamError("课程已经开始或即将开始(不足1分钟)");
        }
    }
    locals.cls = cls;
}

async function createMemberIfNotExist(db, req, locals) {
    let members = db.collection("members");
    let user_query = locals.user_query;
    // find the user who want to book a class
    let doc = await members.findOne(user_query, { projection: { history: 0, comments: 0 } });
    if (!doc) {
        if (user_query._id) {
            throw new ParamError(`member ${req.body.memberid} doesn't exist`);
        }
        // create new member if not exist
        doc = {
            name: req.body.name,
            contact: req.body.contact,
            status: "active",
            source: "book",
            since: new Date(),
            membership: [],
            openid: req.body.openid || undefined
        };
        let result = await members.insertOne(doc);
        console.debug("create member successfully with result: %j", result.result);
        console.log("member is created automatically during booking: %j", doc);
    } else {
        console.log("member is found %j", doc);
        // update openid if not the same
        if (req.body.openid && req.body.openid !== doc.openid) {
            await members.findOneAndUpdate(
                { _id: doc._id },
                { $set: { "openid": req.body.openid } }
            );
            doc.openid = req.body.openid;
        }
    }
    locals.member = doc;
}

function checkSeatandAge(req, res, next) {
    let cls = res.locals.cls;
    let member = res.locals.member;
    let error = check(member, cls, 1);
    if (error) {
        return next(error);
    } else {
        return next();
    }
}

async function findContract(db, req, locals) {
    let cls = locals.cls;
    if (cls.cost <= 0) return; // free class

    let member = locals.member;
    let contracts = db.collection("contracts");
    // sort result from old to new ['2022-9-29','2022-10-8']
    let cursor = contracts.find({
        memberId: member._id,
        status: "paid",
        $or: [
            { expireDate: { $gt: new Date() } },
            { expireDate: null }
        ]
    }, {
        projection: { comments: 0, history: 0 },
        sort: [['effectiveDate', 1]]
    });

    let docs = await cursor.toArray();
    locals.contract = findAvailableContract(cls, docs);
    if (!locals.contract) {
        throw new ParamError("预约失败，没有购买课程或合约已失效", 7002);
    }
}

async function deductContract(db, req, locals) {
    let contract = locals.contract;
    if (!contract) return; // free class
    let cls = locals.cls;
    let contracts = db.collection("contracts");
    let result = await contracts.findOneAndUpdate({
        _id: contract._id,
        consumedCredit: contract.consumedCredit,
        status: contract.status
    }, {
        $inc: { "consumedCredit": cls.cost }
    }, {
        projection: { credit: 1, consumedCredit: 1 },
        returnDocument: "after"
    });

    if (!result.value) {
        throw new RuntimeError("扣课时失败，请重试");
    }
    console.log("deduct %f credit from contract %s (after: %j)", cls.cost, contract.serialNo, result.value);
    locals.contract = result.value;
}

module.exports = router;
