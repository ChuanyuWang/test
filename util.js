var mongojs = require('mongojs');
var util = require('util');
var config = require('./config.db');

module.exports = {
    connect : function (database) {
        //https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
        var uriString = util.format("mongodb://%s:%s@%s/%s?authSource=admin", config.user, config.pass, config.host, database);
        var options = {
            db : {
                native_parser : true,
                authSource : 'admin'
            },
            server : {
                poolSize : 3,
                socketOptions : {
                    keepAlive : 120
                }
            }
        };
        var db = mongojs(uriString);

        db.on('error', function (err) {
            console.error('connect database "%s" with error', db, err);
            state.db = null;
        })
        db.on('connect', function () {
            console.log('database "%s" is connected', db);
        })
        return db;
    }
}
