var express = require('express');
var router = express.Router();
var helper = require('../../helper');

/// Below APIs are visible to authenticated users only
router.use(helper.isAuthenticated);

router.get('/consumption', function (req, res, next) {
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
                $gte: new Date(year, 0),
                $lt: new Date(year+1, 0)
            },
            "cost": {
                $gt: 0
            }
        }
    }, {
        $unwind: "$booking"
    }, {
        $project: {
            week: {
                $week: "$date"
            },
            month: {
                $month: "$date"
            },
            totalCost : {
                '$multiply' : [ '$cost', '$booking.quantity' ]
            }
        }
    }, {
        $group: {
            _id: "$" + unit, // group the data according to unit (month or week)
            total: {
                $sum: "$totalCost"
            }
        }
    }, {
        $sort: {
            "_id" : 1 // have to sort the class by its date, from old to new
        }
    }], function (err, docs) {
        if (err) {
            var error = new Error("analyze consumption fails");
            error.innerError = err;
            next(error);
            return;
        }
        console.log("analyze consumption: ", docs?docs.length:0);
        res.json(docs);
    });
});

router.get('/deposit', function (req, res, next) {
    //[Default] get the current year consumption by month
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
                $gte: new Date(year, 0),
                $lt: new Date(year+1, 0)
            },
            "history.target" : "membership.0.credit"
        }
    }, {
        $project: {
            week: {
                $week: "$history.date"
            },
            month: {
                $month: "$history.date"
            },
            delta : {
                '$subtract' : [ '$history.new', '$history.old' ]
            }
        }
    }, {
        $group: {
            _id: "$" + unit, // group the data according to unit (month or week)
            total: {
                $sum: "$delta"
            }
        }
    }, {
        $sort: {
            "_id" : 1 // have to sort the class by its date, from old to new
        }
    }], function (err, docs) {
        if (err) {
            var error = new Error("analyze deposit fails");
            error.innerError = err;
            next(error);
            return;
        }
        console.log("analyze deposit: ", docs?docs.length:0);
        res.json(docs);
    });
});

router.get('/deposit', function (req, res, next) {
    //[Default] get the current year consumption by month
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
                $gte: new Date(year, 0),
                $lt: new Date(year+1, 0)
            },
            "history.target" : "membership.0.credit"
        }
    }, {
        $project: {
            week: {
                $week: "$history.date"
            },
            month: {
                $month: "$history.date"
            },
            delta : {
                '$subtract' : [ '$history.new', '$history.old' ]
            }
        }
    }, {
        $group: {
            _id: "$" + unit, // group the data according to unit (month or week)
            total: {
                $sum: "$delta"
            }
        }
    }, {
        $sort: {
            "_id" : 1 // have to sort the class by its date, from old to new
        }
    }], function (err, docs) {
        if (err) {
            var error = new Error("analyze deposit fails");
            error.innerError = err;
            next(error);
            return;
        }
        console.log("analyze deposit: ", docs?docs.length:0);
        res.json(docs);
    });
});

module.exports = router;