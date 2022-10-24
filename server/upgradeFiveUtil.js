const db_utils = require('./databaseManager');
const { BadRequestError, InternalServerError } = require("../routes/api/lib/basis");
const { ObjectId } = require("mongodb");

const defaultTypeName = "绘本课";

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

    console.log("default type are to all not started classes: %j", result.result);
}

exports.createtDefaultContracts = async function(tenant, defaultType) {
    let db = await db_utils.connect(tenant.name);
    let members = db.collection("members");

    let pipelines = [{
        $match: {
            membership: {
                $size: 1
            }
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
                $project: { name: 1, date: 1, cost: 1, _id: 0, booking: 1 }
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
    }];

    let docs = await members.aggregate(pipelines).toArray();
    console.log(`find ${docs.length} members with relevant classes`);
}
