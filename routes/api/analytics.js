const express = require('express');
const router = express.Router();
const helper = require('../../helper');
const { InternalServerError, BadRequestError, RuntimeError } = require('./lib/basis');
const moment = require('moment');


/// Below APIs are visible to authenticated users only
router.use(helper.hasTenant, helper.isAuthenticated);

router.get('/consumption', async function(req, res, next) {
    //[Default] get the current year consumption by month
    let year = (new Date()).getFullYear();
    let unit = 'month';
    if (req.query.hasOwnProperty("year")) {
        year = parseInt(req.query.year);
    }
    if (req.query.hasOwnProperty("unit")) {
        unit = req.query.unit;
    }

    let pipelines = [{
        $match: {
            "booking.0": { // array size >= 1
                $exists: true
            },
            "date": {
                $gte: unit === 'year' ? new Date(0) : new Date(year, 0),
                $lt: unit === 'year' ? new Date(9999, 0) : new Date(year + 1, 0)
            },
            "cost": {
                $gt: 0
            }
        }
    }, {
        $unwind: "$booking"
    }, {
        $project: {
            courseID: 1,
            week: {
                $week: "$date"
            },
            month: {
                $month: "$date"
            },
            year: {
                $year: "$date"
            },
            totalCost: {
                '$multiply': [{ $ifNull: ["$cost", 0] }, { $ifNull: ["$booking.quantity", 1] }]
            }
        }
    }, {
        $group: {
            _id: "$" + unit, // group the data according to unit (month or week or year)

            // The only working solution is from below link, it looks like a hack
            // https://stackoverflow.com/questions/25497150/mongodb-aggregate-by-field-exists
            //_id: {unit: "$" + unit, isCourse: {$gt:["$courseID", null]}}, 
            // below methods are all failure
            //_id: {unit: "$" + unit, isCourse: { $ne: [ "$courseID", null ] }},
            //_id: {unit: "$" + unit, isCourse: { $eq: [ "$courseID", null]}}, 
            //_id: {unit: "$" + unit, isCourse: {$ifNull: ["$courseID", 1]}}, 
            //_id: {unit: "$" + unit, isCourse: {$ne : ["$courseID", undefined]}}, 
            total: {
                $sum: "$totalCost"
            }
        }
    }, {
        $sort: {
            "_id": 1 // have to sort the class by its date, from old to new
        }
    }];
    try {
        const classes = req.db.collection("classes");
        let docs = await classes.aggregate(pipelines).toArray();

        console.log("analyze consumption: ", docs ? docs.length : 0);
        return res.json(docs);
    } catch (error) {
        return next(new RuntimeError("analyze consumption fails", error));
    }
});

router.get('/deposit', async function(req, res, next) {
    //[Default] get the current year deposit by month
    let year = (new Date()).getFullYear();
    let unit = 'month';
    if (req.query.hasOwnProperty("year")) {
        year = parseInt(req.query.year);
    }
    if (req.query.hasOwnProperty("unit")) {
        unit = req.query.unit;
    }

    let pipelines = [{
        $unwind: "$history"
    }, {
        $match: {
            "history.date": {
                $gte: unit === 'year' ? new Date(0) : new Date(year, 0),
                $lt: unit === 'year' ? new Date(9999, 0) : new Date(year + 1, 0)
            },
            "history.target": "membership.0.credit"
        }
    }, {
        $project: {
            week: {
                $week: "$history.date"
            },
            month: {
                $month: "$history.date"
            },
            year: {
                $year: "$history.date"
            },
            delta: {
                '$subtract': [{ $ifNull: ['$history.new', 0] }, { $ifNull: ['$history.old', 0] }]
            }
        }
    }, {
        $group: {
            _id: "$" + unit, // group the data according to unit (month or week or year)
            total: {
                $sum: "$delta"
            }
        }
    }, {
        $sort: {
            "_id": 1 // have to sort the class by its date, from old to new
        }
    }];

    try {
        const members = req.db.collection("members");
        let docs = await members.aggregate(pipelines).toArray();

        console.log("analyze deposit: ", docs ? docs.length : 0);
        return res.json(docs);
    } catch (error) {
        return next(new RuntimeError("analyze deposit fails", error));
    }
});

router.get('/passive', async function(req, res, next) {
    let now = new Date();
    let begin = new Date(0);
    //begin.setFullYear(now.getFullYear() - 1); // last year
    if (req.query.hasOwnProperty("begin")) {
        begin = new Date(req.query.begin);
    }

    let queryValidMembers = {
        "status": "active",
        "membership.0": { // array size >= 1, has at least one membership card
            $exists: true
        },
        "membership.credit": { // has more then 0 credit
            $exists: true,
            $gt: 0
        },
        "membership.expire": { // not expire
            $gt: now
        }
    }

    try {
        const members = req.db.collection("members");
        let users = await members.find(queryValidMembers, {
            projection: { name: 1, contact: 1, membership: 1, since: 1 }
        }).toArray();

        console.log("find effective members: ", users ? users.length : 0);
        let memberList = users.map(function(value, index, array) {
            return value._id;
        });

        let pipelines = [{
            $match: {
                "booking.0": { // array size >= 1
                    $exists: true
                },
                "date": {
                    $gte: begin
                },
                "cost": {
                    $gte: 0
                }
            }
        }, {
            $unwind: "$booking"
        }, {
            $match: {
                "booking.member": {
                    $in: memberList
                },
                "booking.status": {
                    $eq: "checkin"
                }
            }
        }, {
            $group: {
                _id: "$booking.member", // group the data according to unit (month or week)
                last: {
                    $max: "$date"
                }
            }
        }, {
            $sort: {
                "last": -1 // have to sort the class by its date, from old to new
            }
        }/*, {
            $limit : 20
        }, {
            $lookup: {
                from: "members",
                localField: "countryId",
                foreignField: "_id",
                as: "member"
            }
    }*/];

        const classes = req.db.collection("classes");
        let docs = await classes.aggregate(pipelines).toArray();

        console.log("analyze passive: ", docs ? docs.length : 0);
        return res.json({ lastBook: docs, effectiveMembers: users });
    } catch (error) {
        return next(new RuntimeError("analyze passive fails", error));
    }
});

router.get("/teacherAnalysis", async function(req, res, next) {
    let month = moment().startOf('month').toDate();
    if (req.query.hasOwnProperty("targetMonth")) {
        month = new Date(req.query.targetMonth);
    }

    // build query for match
    let query = {
        // query classes within target month
        date: {
            $gte: new Date(month),
            $lt: new Date(month.setMonth(month.getMonth() + 1))
        },
        "booking.0": { $exists: true },
    };

    if (req.query.hasOwnProperty("type")) {
        query.type = req.query.type;
    }

    // build pipelines for aggregate()
    let pipelines = [{
        $match: query
    }, {
        $project: {
            cost: 1,
            teacher: 1,
            booking: 1
        }
    }, {
        $unwind: "$booking"
    }, {
        $group: {
            _id: "$teacher",
            total: {
                $sum: {
                    $multiply: [{ $ifNull: ["$cost", 0] }, { $ifNull: ["$booking.quantity", 1] }]
                }
            },
            quantity: {
                $sum: {
                    $ifNull: ["$booking.quantity", 1]
                }
            },
            absent: {
                $sum: {
                    $cond: [{ $eq: ["$booking.status", "absent"] }, { $multiply: [{ $ifNull: ["$cost", 0] }, { $ifNull: ["$booking.quantity", 1] }] }, 0]
                }
            },
            counter: { $addToSet: { id: "$_id", cost: "$cost" } }
        }
    }];

    try {
        const classes = req.db.collection("classes");
        let docs = await classes.aggregate(pipelines).toArray();
        console.log(`find ${docs.length} teachers with their deliver cost`);
        return res.json(docs);
    } catch (error) {
        return next(new RuntimeError("Analysis teacher fails", error));
    }
});

router.get("/orders", async function(req, res, next) {
    //[Default] get the current year orders by month
    let year = (new Date()).getFullYear();
    let unit = 'month';
    if (req.query.year) {
        year = parseInt(req.query.year);
    }
    if (req.query.unit) {
        unit = req.query.unit;
    }

    let query = {
        "status": "success",
        "timestart": {
            $gte: unit === 'year' ? new Date(0) : new Date(year, 0),
            $lt: unit === 'year' ? new Date(9999, 0) : new Date(year + 1, 0)
        },
        "totalfee": {
            $gt: 0
        }
    };

    // build pipelines for aggregate()
    let pipelines = [{
        $match: query
    }, {
        $project: {
            tradeno: 1,
            status: 1,
            totalfee: 1,
            week: { $week: "$timestart" },
            month: { $month: "$timestart" },
            year: { $year: "$timestart" }
        }
    }, {
        $group: {
            _id: "$" + unit, // group the data according to unit (month or week or year)
            total: { $sum: "$totalfee" }
        }
    }];

    try {
        const orders = req.db.collection("orders");
        let docs = await orders.aggregate(pipelines).toArray();
        console.log(`Analysis orders by ${unit}`);
        return res.json(docs);
    } catch (error) {
        return next(new RuntimeError("Analysis orders fails", error));
    }
});

router.get('/memberdata', async function(req, res, next) {
    //[Default] get the current year consumption by month
    let year = (new Date()).getFullYear();
    if (req.query.hasOwnProperty("year")) {
        year = parseInt(req.query.year);
    }

    let pipelines = [{
        $match: {
            "booking.0": { // array size >= 1
                $exists: true
            },
            "date": {
                $gte: new Date(year, 0),
                $lt: new Date(year + 1, 0)
            },
            "cost": {
                $gt: 0
            }
        }
    }, {
        $unwind: "$booking"
    }, {
        $lookup: {
            from: "members",
            //localField: "booking.member",
            //foreignField: "_id",
            let: { memberID: "$booking.member" },
            pipeline: [{
                $match: {
                    $expr: { $eq: ["$_id", "$$memberID"] }
                }
            }, {
                $project: { name: 1, _id: 1 }
            }],
            as: "member"
        }
    }, {
        $project: {
            month: {
                $month: "$date"
            },
            totalCost: {
                '$multiply': [{ $ifNull: ["$cost", 0] }, { $ifNull: ["$booking.quantity", 1] }]
            },
            member: 1
        }
    }, {
        $group: {
            // group the data according to unit (month or week or year)
            _id: { member1: "$member", month: "$month" },
            total: {
                $sum: "$totalCost"
            }
        }
    }, {
        $group: {
            "_id": "$_id.member1",
            value: {
                $push: { t: "$total", m: "$_id.month" }
            }
        }
    }];

    try {
        const classes = req.db.collection("classes");
        let docs = await classes.aggregate(pipelines).toArray();

        console.log("analyze member: ", docs ? docs.length : 0);
        return res.json(docs);
    } catch (error) {
        return next(new RuntimeError("analyze member fails", error));
    }
});

router.get('/classexpense', async function(req, res, next) {
    //[Default] get the current year consumption by month
    let currentDate = new Date();

    let t_year = currentDate.getFullYear();
    if (req.query.hasOwnProperty("year")) {
        t_year = parseInt(req.query.year);
    }
    let t_month = currentDate.getMonth();
    if (req.query.hasOwnProperty("month")) {
        t_month = parseInt(req.query.month);
    }
    let unit = 'month';
    if (req.query.hasOwnProperty("unit")) { // day|week|month|year
        unit = req.query.unit;
    }

    let begin = new Date(t_year, 0), end = new Date(t_year + 1, 0);
    switch (unit) {
        case "day":
            begin = new Date(t_year, t_month);
            end = new Date(t_year, t_month + 1);
            break;
        case "week":
        case "month":
            break;
        case "year":
            begin = new Date(0);
            end = new Date(9999, 0);
            break;
        default:
            console.warn(`unit ${unit} is invalid, query by "month" as default`);
            unit = "month";
            break;
    }

    try {
        const classes = req.db.collection("classes");

        let pipelines = [{
            $match: {
                "booking.contract": { // the booking array has at least one embedded document that contains the field "contract"
                    $exists: true
                },
                "date": {
                    $gte: begin,
                    $lt: end
                },
                "cost": {
                    $gt: 0
                }
            }
        }, {
            $unwind: "$booking"
        }, {
            $lookup: {
                from: "contracts",
                let: { contractID: "$booking.contract" },
                pipeline: [{
                    $match: {
                        $expr: { $eq: ["$$contractID", "$_id"] }
                    }
                }, {
                    $project: { comments: 0, history: 0 }
                }],
                as: 'contracts'
            }
        }, {
            $match: {
                "contracts.0": { $exists: true }
            }
        }, {
            $unwind: "$contracts"
        }, {
            $project: {
                type: 1,
                week: { $week: "$date" },
                month: { $month: "$date" },
                year: { $year: "$date" },
                day: { $dayOfMonth: "$date" },
                totalCost: {
                    $multiply: [{ $ifNull: ["$cost", 0] }, { $ifNull: ["$booking.quantity", 1] }]
                },
                creditPrice: {
                    $divide: [{ $subtract: ["$contracts.total", "$contracts.discount"] }, "$contracts.credit"]
                }
            }
        }, {
            $group: {
                _id: "$" + unit, // group the data according to unit (month/week/year)
                total: {
                    $sum: { $multiply: ["$creditPrice", "$totalCost"] }
                }
            }
        }, {
            // sort the data by date, from old to new
            $sort: { "_id": 1 }
        }];
        let docs = await classes.aggregate(pipelines).toArray();

        console.log("analyze expense: ", docs ? docs.length : 0);
        return res.json(docs);
    } catch (error) {
        return next(new InternalServerError("analysis class expense fails", error));
    }
});

// analysis for one day
router.get('/classexpense2', async function(req, res, next) {
    //[Default] get the result from today
    let t_date = new Date();
    if (req.query.hasOwnProperty("date") && moment(req.query.date).isValid()) {
        t_date = new Date(req.query.date);
    } else {
        return next(new BadRequestError(`param date ${req.query.date} is not valid`));
    }
    let begin = moment(t_date).startOf("day"), end = moment(t_date).endOf("day");

    try {
        const classes = req.db.collection("classes");

        let pipelines = [{
            $match: {
                "booking.0": { // array size >= 1
                    $exists: true
                },
                "date": {
                    $gte: begin.toDate(),
                    $lt: end.toDate()
                },
                "cost": {
                    $gt: 0
                }
            }
        }, {
            $unwind: "$booking"
        }, {
            $lookup: {
                from: "contracts",
                let: { contractID: "$booking.contract" },
                pipeline: [{
                    $match: {
                        $expr: { $eq: ["$$contractID", "$_id"] }
                    }
                }, {
                    $project: { comments: 0, history: 0 }
                }],
                as: 'contracts'
            }
        }, {
            $match: {
                "contracts.0": { $exists: true }
            }
        }, {
            $unwind: "$contracts"
        }, {
            $project: {
                type: 1,
                name: 1,
                totalCost: {
                    $multiply: [{ $ifNull: ["$cost", 0] }, { $ifNull: ["$booking.quantity", 1] }]
                },
                creditPrice: {
                    $divide: [{ $subtract: ["$contracts.total", "$contracts.discount"] }, "$contracts.credit"]
                }
            }
        }, {
            $group: {
                _id: { "_id": "$_id", type: "$type", name: "$name" }, // group the cost by class session
                total: {
                    $sum: { $multiply: ["$creditPrice", "$totalCost"] }
                }
            }
        }];
        let docs = await classes.aggregate(pipelines).toArray();

        console.log("analyze one day expense: ", docs ? docs.length : 0);
        return res.json(docs);
    } catch (error) {
        return next(new InternalServerError("analysis one day class expense fails", error));
    }
});

// analysis of remaining class sessions by type
router.get('/remainingclasses', async function(req, res, next) {
    try {
        let pipelines = [{
            $match: {
                // array size >= 1
                "booking.0": { $exists: true },
                "date": { $gt: new Date() },
                "cost": { $gt: 0 }
            }
        }, {
            $project: {
                type: 1,
                cost: 1,
                totalQuantity: {
                    $sum: { $ifNull: ["$booking.quantity", 1] }
                }
            }
        }, {
            $group: {
                _id: "$type", // group the cost by class type
                total: {
                    $sum: { $multiply: ["$cost", "$totalQuantity"] }
                }
            }
        }];
        const classes = req.db.collection("classes");
        let docs = await classes.aggregate(pipelines).toArray();

        console.log("analyze remaining credit by type: ", docs ? docs.length : 0);
        return res.json(docs);
    } catch (error) {
        return next(new InternalServerError("analyze remaining credit by type fails", error));
    }
});

// analysis of remaining contracts by type
router.get('/remainingcontracts', async function(req, res, next) {
    try {
        let pipelines = [{
            $match: {
                status: "paid",
                $or: [
                    { expireDate: { $gt: new Date() } },
                    { expireDate: null }
                ]
            }
        }, {
            $project: {
                goods: 1,
                remaining: {
                    $subtract: ["$credit", { $add: ["$consumedCredit", "$expendedCredit"] }]
                }
            }
        }, {
            $group: {
                _id: "$goods", // group the cost by class type
                total: { $sum: "$remaining" }
            }
        }];
        const contracts = req.db.collection("contracts");
        let docs = await contracts.aggregate(pipelines).toArray();

        console.log("analyze remaining contracts by type: ", docs ? docs.length : 0);
        return res.json(docs);
    } catch (error) {
        return next(new InternalServerError("analyze remaining contracts by type fails", error));
    }
});

// analysis of effective members
router.get('/effectivemembers', async function(req, res, next) {
    try {
        let pipelines = [{
            $match: {
                status: "paid",
                $or: [
                    { expireDate: { $gt: new Date() } },
                    { expireDate: null }
                ]
            }
        }, {
            $project: {
                memberId: 1,
                remaining: {
                    $subtract: ["$credit", { $add: ["$consumedCredit", "$expendedCredit"] }]
                }
            }
        }, {
            $group: {
                _id: "$memberId", // group the remaining credit by member
                total: { $sum: "$remaining" }
            }
        }, {
            $group: {
                _id: null,
                count: { $sum: 1 },
                totalRemaining: { $sum: "$total" }
            }
        }];
        const contracts = req.db.collection("contracts");
        let docs = await contracts.aggregate(pipelines).toArray();

        console.log("analyze members with effective contracts: ", docs ? docs.length : 0);
        return res.json(docs);
    } catch (error) {
        return next(new InternalServerError("analyze members with effective contracts fails", error));
    }
});

router.get('/incomingpayment', async function(req, res, next) {
    //[Default] get the current year consumption by month
    let year = (new Date()).getFullYear();
    let unit = 'month';
    if (req.query.hasOwnProperty("year")) {
        year = parseInt(req.query.year);
    }
    if (req.query.hasOwnProperty("unit")) {
        unit = req.query.unit;
    }

    try {
        const payments = req.db.collection("payments");

        let pipelines = [{
            $match: {
                "payDate": {
                    $gte: unit === 'year' ? new Date(0) : new Date(year, 0),
                    $lt: unit === 'year' ? new Date(9999, 0) : new Date(year + 1, 0)
                }
            }
        }, {
            $project: {
                week: { $week: "$payDate" },
                month: { $month: "$payDate" },
                year: { $year: "$payDate" },
                amount: 1
            }
        }, {
            $group: {
                _id: "$" + unit, // group the data according to unit (month/week/year)
                total: {
                    $sum: "$amount"
                }
            }
        }, {
            // sort the data by date, from old to new
            $sort: { "_id": 1 }
        }];
        let docs = await payments.aggregate(pipelines).toArray();

        console.log("analyze incoming payments: ", docs ? docs.length : 0);
        return res.json(docs);
    } catch (error) {
        return next(new InternalServerError("analysis incoming payments fails", error));
    }
});

module.exports = router;
