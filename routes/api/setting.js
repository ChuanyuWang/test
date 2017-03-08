var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var util = require('../../util');
var helper = require('../../helper');

var config_db = null;
// initialize the 'config' database for setting router
router.use(function (req, res, next) {
    config_db = config_db || util.connect('config');
    next();
});

router.get('/classrooms', function(req, res, next) {
    var tenantName = null;
    if (req.query.hasOwnProperty('tenant')) {
        tenantName = req.query.tenant;
    } else if (req.isAuthenticated()) {
        // initialize the tenant db if it's authenticated user
        tenantName = req.user.tenant;
    } else {
        var err = new Error("Missing param 'tenant'");
        err.status = 400;
        return next(err);
    }

    config_db.collection('tenants').findOne({
        name : tenantName
    }, function(err, doc) {
        if (err) {
            var error = new Error("Get classroom list fails with tenant: " + tenantName);
            error.status = 400;
            return next(error);
        }
        
        if (!doc) {
            var error = new Error("Not found classroom with tenant: " + tenantName);
            error.status = 400;
            return next(error);
        }

        res.send(doc.classroom ? doc.classroom : []);
    });
});

/// Below APIs are visible to authenticated users only
router.all(helper.isAuthenticated);

router.post('/classrooms', helper.requireRole("admin"), function(req, res, next) {
    //var newRoom = {id:'abc', name:''};
    if (!req.body.id) {
        var error = new Error("classroom ID is not defined");
        error.status = 400;
        return next(error);
    }
    var namePattern = /^[a-z0-9]+$/; // only letter or number
    if (!namePattern.test(req.body.id)) {
        var error = new Error("教室ID包含非法字符，支持小写字母或数字");
        error.status = 400;
        return next(error);
    }
    
    var tenants = config_db.collection('tenants');
    tenants.findOne({
        name : req.user.tenant,
        'classroom.id' : req.body.id
    }, function(err, doc) {
        if (doc) {
            var error = new Error("创建教室失败，教室ID重复");
            error.status = 400;
            return next(error);
        }
        
        tenants.update({
            name : req.user.tenant
        }, {
            $push : {
                classroom : req.body
            }
        }, function (err, result){
            if (err) {
                var error = new Error("创建教室失败");
                error.innerError = err;
                return next(error);
            }
            
            if (result.n == 1) {
                console.log("classroom %j is created", req.body);
                req.tenant.classroom = req.tenant.classroom || [];
                req.tenant.classroom.push(req.body);
                
                // link all classes or events to this classroom
                if (req.tenant.classroom.length == 1) {
                    migrateFreeClass(req.body, req.db);
                }
            } else {
                console.error("classroom %j fails to create", req.body);
            }
            res.send(result);
        });
    });
});

router.route('/classrooms/:roomID')
.all(helper.requireRole("admin"))
.get(function(req, res){
    //TODO, get a classroom
    next(new Error('not implemented'));
})
.delete (function (req, res) {
    var tenants = config_db.collection('tenants');
    tenants.update({
        name : req.user.tenant
    }, {
        $pull : {
            classroom : {
                id : req.params.roomID
            }
        }
    }, function (err, result){
        if (err) {
            var error = new Error("删除教室失败");
            error.innerError = err;
            return next(error);
        }
        
        if (result.n == 1) {
            console.log("classroom %j is delete", req.params.roomID);
            
            // update the tenant object in cache
            req.tenant.classroom = req.tenant.classroom || [];
            for (var i=0;i<req.tenant.classroom.length;i++) {
                var room = req.tenant.classroom[i];
                if (room && room.id == req.params.roomID) {
                    req.tenant.classroom.splice(i, 1);
                    break;
                }
            }
        } else {
            console.error("classroom %j fails to be deleted", req.params.roomID);
        }
        res.json(result);
    });
})
.put(function (req, res) {
    //TODO, update a classroom
    next(new Error('not implemented'));
});

function migrateFreeClass(room, database) {
    // https://docs.mongodb.com/manual/tutorial/query-for-null-fields/
    var classes = database.collection("classes");
    classes.update({
        classroom : null
    }, {
        $set : {
            classroom : room.id
        }
    }, {multi: true}, function(err, result){
        if (err) {
            var error = new Error("update classes with default classroom fails");
            error.innerError = err;
            return console.error(error);
        }
        console.log("%d class is/are linked to classroom %s", result.n, room.id);
    });
};

module.exports = router;