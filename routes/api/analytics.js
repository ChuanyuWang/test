var express = require('express');
var router = express.Router();
var helper = require('../../helper');
const db_utils = require('../../server/databaseManager');

/// Below APIs are visible to authenticated users only
router.use(helper.checkTenant, helper.isAuthenticated);

router.get('/consumption', function(req, res, next) {
    //[Default] get the current year consumption by month
    var year = (new Date()).getFullYear();
    var unit = 'month';
    if (req.query.hasOwnProperty("year")) {
        year = parseInt(req.query.year);
    }
    if (req.query.hasOwnProperty("unit")) {
        unit = req.query.unit;
    }

    var classes = req.db.collection("classes");
    classes.aggregate([{
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
    }], function(err, docs) {
        if (err) {
            var error = new Error("analyze consumption fails");
            error.innerError = err;
            next(error);
            return;
        }
        console.log("analyze consumption: ", docs ? docs.length : 0);
        res.json(docs);
    });
});

router.get('/deposit', function(req, res, next) {
    //[Default] get the current year deposit by month
    var year = (new Date()).getFullYear();
    var unit = 'month';
    if (req.query.hasOwnProperty("year")) {
        year = parseInt(req.query.year);
    }
    if (req.query.hasOwnProperty("unit")) {
        unit = req.query.unit;
    }

    var members = req.db.collection("members");
    members.aggregate([{
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
    }], function(err, docs) {
        if (err) {
            var error = new Error("analyze deposit fails");
            error.innerError = err;
            next(error);
            return;
        }
        console.log("analyze deposit: ", docs ? docs.length : 0);
        res.json(docs);
    });
});

router.get('/passive', function(req, res, next) {
    var now = new Date();
    var begin = new Date(0);
    //begin.setFullYear(now.getFullYear() - 1); // last year
    if (req.query.hasOwnProperty("begin")) {
        begin = new Date(req.query.begin);
    }

    var queryValidMembers = {
        "status": "active",
        "membership.0": { // array size >= 1, has at least one membership card
            $exists: true
        },
        "membership.credit": { // has more then 0 creidt
            $exists: true,
            $gt: 0
        },
        "membership.expire": { // not expire
            $gt: now
        }
    }

    var members = req.db.collection("members");
    members.find(queryValidMembers, { name: 1, contact: 1, membership: 1, since: 1 },
        function(err, users) {
            if (err) {
                var error = new Error("find members fails");
                error.innerError = err;
                return next(error);
            }
            console.log("find effective members: ", users ? users.length : 0);
            var memberList = users.map(function(value, index, array) {
                return value._id;
            });

            var classes = req.db.collection("classes");
            classes.aggregate([{
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
        }*/], function(err, docs) {
                if (err) {
                    var error = new Error("analyze passive fails");
                    error.innerError = err;
                    next(error);
                    return;
                }
                console.log("analyze passive: ", docs ? docs.length : 0);
                res.json({ lastBook: docs, effectiveMembers: users });
            });
        });
});

router.get("/teacherAnalysis", async function(req, res, next) {
    let month, classes;
    if (req.query.hasOwnProperty("targetMonth")) {
        month = new Date(req.query.targetMonth);
    }
    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        classes = tenantDB.collection("classes");
    } catch (error) {
        return next(error);
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
            absent: {
                $sum: {
                    $cond: [{ $eq: ["$booking.status", "absent"] }, { $multiply: [{ $ifNull: ["$cost", 0] }, { $ifNull: ["$booking.quantity", 1] }] }, 0]
                }
            },
            counter: { $addToSet: { id: "$_id", cost: "$cost" } }
        }
    }];

    try {
        let docs = await classes.aggregate(pipelines).toArray();
        console.log(`find ${docs.length} teachers with their deliver cost`);
        return res.json(docs);
    } catch (error) {
        let err = new Error("Analysis teacher fails");
        error.innerError = err;
        return next(error);
    }
});

router.get("/orders", async function(req, res, next) {
    //[Default] get the current year orders by month
    let year = (new Date()).getFullYear();
    var unit = 'month';
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

    let orders;
    try {
        let tenantDB = await db_utils.connect(req.tenant.name);
        orders = tenantDB.collection("orders");
    } catch (error) {
        return next(error);
    }

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
        let docs = await orders.aggregate(pipelines).toArray();
        console.log(`Analysis orders by ${unit}`);
        return res.json(docs);
    } catch (error) {
        let err = new Error("Analysis orders fails");
        error.innerError = err;
        return next(error);
    }
});

router.get('/memberdata', function(req, res, next) {
    //[Default] get the current year consumption by month
    var year = (new Date()).getFullYear();
    if (req.query.hasOwnProperty("year")) {
        year = parseInt(req.query.year);
    }

    var classes = req.db.collection("classes");
    classes.aggregate([{
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
    }], function(err, docs) {
        if (err) {
            var error = new Error("analyze member fails");
            error.innerError = err;
            return next(error);
        }
        console.log("analyze member: ", docs ? docs.length : 0);
        res.json(docs);
    });
});

module.exports = router;
