var mongojs = require('mongojs');
var util = require('util');
var config = require('./config.db');

// Store all instantiated connections.
var connections = [];

module.exports = {
    connect : function (database) {
        if (typeof database != "string" || database.length == 0) {
            throw new Error("parameter databaseis not string or empty");
        }
        //  If a connection pool was found, return with it.
        var db = findConnection(database, connections);
        if (db) {
            return db;
        }
        
        //https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
        var uriString = util.format("mongodb://%s:%s@%s/%s?authSource=admin", config.user, config.pass, config.host, database);
        var options = {
            db : {
                native_parser : true,
                authSource : 'admin'
            },
            server : {
                poolSize : 5
                /*,
                socketOptions : {
                    keepAlive : 120
                }
                */
            }
        };
        var db = mongojs(uriString, [], options);
        
        // Store the connection in the connections array.
        connections.push({
            name : database,
            db : db
        });

        db.on('error', function (err) {
            console.error('connect database "%s" with error', db, err);
            state.db = null;
        })
        db.on('connect', function () {
            console.log('database "%s" is connected', db);
        })
        return db;
    }
};

function findConnection(databaseName, connections) {
    for (var i=0;i<connections.length;i++) {
        if (databaseName == connections[i].name) {
            return connections[i].db;
        }
    }
    return null;
};
