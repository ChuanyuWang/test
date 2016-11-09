var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');
var util = require('../../util');

var config_db = null;
// initialize the 'config' database for setting router
router.use(function (req, res, next) {
    config_db = config_db || util.connect('config');
    next();
});

router.get('/classrooms', function(req, res, next) {
    // get the tenant name from url, as this api is used public
    var tenant = req.baseUrl.split("/")[1];
    config_db.collection('tenants').findOne({
        name : tenant
    }, function(err, doc) {
        if (err) {
            var error = new Error("Get classroom list fails with tenant: " + tenant);
            error.status = 400;
            return next(error);
        }
        
        if (!doc) {
            var error = new Error("Not found classroom with tenant: " + tenant);
            error.status = 400;
            return next(error);
        }

        res.send(doc.classroom ? doc.classroom : []);
    });
});

router.post('/classrooms', isAuthenticated, requireRole("admin"), function(req, res, next) {
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
.all(isAuthenticated, requireRole("admin"))
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

function requireRole(role) {
    return function(req, res, next) {
        if(req.user && req.user.role === role)
            next();
        else {
            var err = new Error("没有权限执行此操作");
            err.status = 403;
            next(err);
        }
    };
};

function isAuthenticated(req, res, next) {
    //TODO, only the tenant's admin can modify own tenant's setting
    if (req.user && req.user.tenant == req.tenant.name) {
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

module.exports = router;
