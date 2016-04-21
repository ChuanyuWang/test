var mongojs = require('mongojs');

var state = {
    db : null,
}

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

database._connect = function () {
    if (state.db) {
        return;
    }

    var uri = "mongodb://admin:pass@localhost/abc?authSource=admin";
    var db = mongojs(uri);

    db.on('error', function (err) {
        console.log('database error', err);
        state.db = null;
    })

    db.on('connect', function () {
        console.log('database connected');
    })

    state.db = db;
}

database.get = function () {
    return state.db
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