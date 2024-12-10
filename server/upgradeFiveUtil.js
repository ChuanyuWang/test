const moment = require('moment');
const db_utils = require('./databaseManager');
const { BadRequestError, InternalServerError, generateContractNo } = require("../routes/api/lib/basis");
const { ObjectId } = require("mongodb");

const defaultTypeName = "绘本课";
const creditCost = 100;

exports.createDefaultClassType = async function(tenant) {
    let configDB = await db_utils.connect('config');
    let tenants = configDB.collection('tenants');
    let doc = await tenants.findOne({ name: tenant.name });
    if (!doc) throw BadRequestError(`tenant ${tenant.name} doesn't exist`);

    let types = doc.types || [];
    let defaultType = types.find(value => {
        return value.name === defaultTypeName;
    });

    // already created
    if (defaultType) {
        console.log("default type is existed");
        return defaultType;
    }

    //create if not existed
    let result = await tenants.findOneAndUpdate({ name: tenant.name }, {
        $push: {
            types: {
                id: new ObjectId().toHexString(),
                name: defaultTypeName,
                status: "open",
                visible: true
            }
        }
    }, { returnDocument: "after" });

    if (!result.value) throw InternalServerError("fail to create default type");

    console.log("default type is created");
    defaultType = result.value.types.find(value => {
        return value.name === defaultTypeName;
    });
    return defaultType;
}

exports.setDefaultTypeForNotStartedClasses = async function(tenant, defaultType) {
    let db = await db_utils.connect(tenant.name);
    let classes = db.collection("classes");
    let result = await classes.updateMany({
        date: { $gte: new Date() },
        type: null
    }, {
        $set: { type: defaultType.id }
    });

    console.log("set default type to not started classes: %j", result);
}

exports.createtDefaultContracts = async function(tenant, defaultType) {
    let db = await db_utils.connect(tenant.name);
    let activeMembers = await queryActiveMembers(db);
    let contractsToCreate = [];

    for (let i = 0; i < activeMembers.length; i++) {
        const m = activeMembers[i];
        if (hasDefaultContract(m, defaultType)) continue;

        let remainingCredit = getRemainingCredit(m);
        let consumedCredit = getConsumedCredit(m);
        let totalCredit = remainingCredit + consumedCredit;
        let defaultContract = {
            _fromLegacyMemberCard: true,
            _id: new ObjectId(),
            serialNo: await generateContractNo(),
            status: "paid",
            type: "new",
            goods: defaultType.id,
            goods_type: "type",
            category: "credit", // TODO, remove hardcode category
            memberId: m._id,
            credit: totalCredit,
            consumedCredit: consumedCredit,
            expendedCredit: 0,
            total: Math.round(totalCredit * creditCost * 100),
            discount: 0,
            received: Math.round(totalCredit * creditCost * 100),
            createDate: m.since,
            effectiveDate: new Date(), // effective immediately
            expireDate: getExpireDate(m),
            clientip: "",
            signDate: new Date(),
            lastUpdate: new Date(),
            comments: [createUpgradeComment(m)],
            history: []
        };
        await updateMemberBooking(db, m, defaultContract);
        contractsToCreate.push(defaultContract);
    }
    if (contractsToCreate.length > 0) {
        let contracts = db.collection("contracts");
        let result = await contracts.insertMany(contractsToCreate);
        // result is {"acknowledged":true, "insertedCount":1, "insertedIds": {}}
        console.log(`Create ${result.insertedCount} default contracts`);
    }
    return contractsToCreate;
}

function hasDefaultContract(member, defaultType) {
    let contracts = member.contracts || [];
    return contracts.some(value => {
        return value.goods === defaultType.id;
    });
}

function getRemainingCredit(member) {
    let cards = member.membership || [];
    if (cards.length !== 1) {
        console.error(`fatal error occurred, member ${member._id} has ${cards.length} membership cards`);
        return 0;
    }
    return cards[0].credit || 0;
}

function getConsumedCredit(member) {
    let classes = member.classes || [];
    let total = 0;
    classes.forEach(c => {
        let booking = c.booking || [];
        let b = booking.find(v => {
            return v.member.equals(member._id);
        });
        let quantity = b.quantity || 1;
        if (quantity !== 1) console.warn(`member ${member._id} booked more than 1 quantity in class ${c._id}`);
        total += quantity * c.cost;
    })
    return total;
}

function getExpireDate(member) {
    let cards = member.membership || [];
    if (cards.length !== 1) {
        console.error(`fatal error occurred, member ${member._id} has ${cards.length} membership cards`);
        return 0;
    }
    return cards[0].expire || null;
}

function createUpgradeComment(member) {
    let cards = member.membership || [];
    if (cards.length !== 1) {
        console.error(`fatal error occurred, member ${member._id} has ${cards.length} membership cards`);
        return 0;
    }

    let credit = Math.round(cards[0].credit * 10) / 10;
    // "2012/12/20" without time
    //let expire = cards[0].expire instanceof Date ? cards[0].expire.toLocaleDateString('zh-CN', { timeZone: 'Asia/Shanghai' }) : cards[0].expire;
    let expire = cards[0].expire instanceof Date ? moment(cards[0].expire).format("YYYY/MM/DD") : cards[0].expire;
    let cardType = cards[0].type === "LIMITED" ? `卡片类型为限定卡 (可用教室: ${(cards[0].room || []).join(",")})` : "卡片类型为通用卡";

    return {
        posted: new Date(),
        text: `系统自动创建的合约，原会员卡中剩余${credit || 0}课时, 有效期到${expire}, ${cardType}`,
        author: `System`
    };
}

async function updateMemberBooking(db, member, contract) {
    let bookClasses = member.classes || [];
    if (bookClasses.length === 0) return;

    let classIds = bookClasses.map(value => {
        return value._id;
    });

    let classes = db.collection("classes");
    await classes.updateMany({
        _id: { $in: classIds },
        "booking.member": member._id
    }, {
        $set: { "booking.$.contract": contract._id }
    });
}

async function queryActiveMembers(db) {
    let members = db.collection("members");

    let pipelines = [{
        $match: {
            membership: { $size: 1 },
            "membership.0.expire": { $gt: new Date() }
        }
    }, {
        $lookup: {
            from: 'classes',
            let: { memberID: "$_id" },
            pipeline: [{
                $match: {
                    date: { $gt: new Date() },
                    "booking.0": { $exists: true },
                    $expr: { $in: ["$$memberID", "$booking.member"] }
                    //$expr: { $eq: ["$$memberID", "$booking.member"] } // invalid express for query elements from array
                }
            }, {
                $project: { name: 1, date: 1, cost: 1, type: 1, booking: 1 }
            }],
            as: 'classes'
        }
    }, {
        $match: {
            $or: [
                { "membership.0.credit": { $gt: 0.0001 } },
                { "classes.0": { $exists: true } }
            ]
        }
    }, {
        $lookup: {
            from: 'contracts',
            let: { memberID: "$_id" },
            pipeline: [{
                $match: {
                    $expr: { $eq: ["$$memberID", "$memberId"] }
                }
            }, {
                $project: { comments: 0, history: 0 }
            }],
            as: 'contracts'
        }
    }];

    let docs = await members.aggregate(pipelines).toArray();
    console.log(`find ${docs.length} active members with relevant classes/contracts`);
    return docs;
}
