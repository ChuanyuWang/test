var express = require('express');
var router = express.Router();
var mongojs = require('mongojs');

var config_db = null;

// initialize the 'config' database for setting request
router.use(function (req, res, next) {
    if (!config_db) {
        // setting of each teant all in one 'config' database, 
        // create the database connection at the first time
        var uri = req.app.locals.getURI('config');
        var db = mongojs(uri);

        db.on('error', function (err) {
            console.error('connect database "config" error', err);
            state.db = null;
        })
        db.on('connect', function () {
            console.log('database "config" connected');
        })
        // cache for setting router
        config_db = db;
    }
    next();
});

router.get('/classroom', function(req, res, next) {
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

router.route('/classroom/:roomID')
.all(isAuthenticated)
.post(function (req, res, next) {
    //var newRoom = {id:'abc', name:''};
    if (req.body.id != req.params.roomID) {
        var error = new Error("the classroom ID is not the same in body and url");
        error.status = 400;
        return next(error);
    }
    var namePattern = /^[a-z0-9]+$/; // only letter or number
    if (!namePattern.test(req.params.roomID)) {
        var error = new Error("教室ID包含非法字符，支持小写字母或数字");
        error.status = 400;
        return next(error);
    }
    
    var tenants = config_db.collection('tenants');
    tenants.findOne({
        name : req.user.tenant,
        'classroom.id' : req.params.roomID
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
})
.delete (function (req, res) {
    //TODO, Delete a classroom
    next(new Error('not implemented'));
})
.put(function (req, res) {
    //TODO, handle the error in error handle middleware 
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

function isAuthenticated(req, res, next) {
    //TODO, only the super admin 'chuanyu' or tenant's admin can modify own tenant's setting
    if (req.user && req.user.tenant == req.tenant.name) {
        next()
    } else {
        res.status(401).send('Unauthorized Request');
    }
};

module.exports = router;
