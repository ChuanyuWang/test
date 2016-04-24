var mongojs = require('mongojs');
var config = require('./config').mongodb;

var database = {};

database.connect = function () {
    database._connect();

    return function expressMongoDb(req, res, next) {
        if (!state.db) {
            console.error("database connection is not ready");
        } else {
            req['db'] = state.db;
        }
        next();
    };
};

database._connect = function (database) {
    var uri = config.getURI(database);
    var db = mongojs(uri);

    db.on('error', function (err) {
        console.log('database error', err);
        state.db = null;
    })

    db.on('connect', function () {
        console.log('database connected');
    })

    return db;
}

database.get = function (tenant) {
    var uri = config.getURI(tenant);
    var db = mongojs(uri);

    db.on('error', function (err) {
        console.log('database error', err);
        state.db = null;
    })

    db.on('connect', function () {
        console.log('database connected');
    })

    return db;
}

database.close = function (done) {
    if (state.db) {
        state.db.close(function (err, result) {
            state.db = null;
            done(err);
        })
    }
}

module.exports = database;