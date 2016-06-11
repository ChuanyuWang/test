var mongojs = require('mongojs');

var util = {};

util.connect = function (uriString) {
    var db = mongojs(uriString);

    db.on('error', function (err) {
        console.error('connect database "%s" with error', db, err);
        state.db = null;
    })
    db.on('connect', function () {
        console.log('database "%s" is connected', db);
    })
    return db;
};

module.exports = util;