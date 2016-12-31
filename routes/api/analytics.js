var express = require('express');
var router = express.Router();

router.get('/consumption', isAuthenticated, function (req, res, next) {
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
            "reservation": {
                $gt: 0
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
        $sort: {
            "date" : -1 // have to sort the class by its date, from old to new
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

function requireRole(role) {
    return function (req, res, next) {
        if (req.user && req.user.role === role)
            next();
        else {
            var err = new Error("没有权限执行此操作");
            err.status = 403;
            next(err);
        }
    };
};

function isAuthenticated(req, res, next) {
    if (req.user && req.user.tenant == req.tenant.name) {
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

module.exports = router;
