var mongojs = require('mongojs');
var util = require('util');
var config = require('./config.db');
var mongoose = require('mongoose');
var monk = require('monk');

// Use native promises, more refer to http://mongoosejs.com/docs/promises.html
mongoose.Promise = global.Promise;

// Store all connected connections.
var connections = [];
var connections2 = {};
var monkConnections = {};

// export helper functions
var helpers = {};

helpers.connectionURI = function(database) {
    //https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
    return util.format("mongodb://%s:%s@%s/%s", config.user, config.pass, config.host, database);
};

helpers.connect = function(database) {
    if (typeof database != "string" || database.length == 0) {
        throw new Error("parameter database is not string or empty");
    }
    //  If a connection pool was found, return with it.
    var db = findConnection(database, connections);
    if (db) {
        return db;
    }

    //https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
    var uriString = util.format("mongodb://%s:%s@%s/%s", config.user, config.pass, config.host, database);
    var options = {
        authSource: 'admin',
        poolSize: 5
        /* keepAlive : 120 */
    };
    var db = mongojs(helpers.connectionURI(database), [], options);

    // Store the connection in the connections array.
    connections.push({
        name: database,
        db: db
    });

    db.on('error', function(err) {
        console.error('[mongojs] connect database "%s" with error', db.toString(), err);
        // TODO, remove error db from connection pool
    })
    db.on('connect', function() {
        console.log('[mongojs] database "%s" is connected', db.toString());
    })
    return db;
};

/**
 * 
 * @param {String} database name of database to be connected
 * @returns connection created by `mongoose.createConnection`
 */
helpers.connect2 = function(database) {
    if (typeof database != "string" || database.length == 0) {
        throw new Error("parameter database is not string or empty");
    }
    //  If a connection was found, return with it.
    if (connections2[database]) {
        return connections2[database];
    }
    var options = {
        useMongoClient: true,
        //keepAlive: 120,
        autoIndex: false, // Don't build indexes
        reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        reconnectInterval: 500, // Reconnect every 500ms
        poolSize: 3, // Maintain up to 3 socket connections for each database
        // If not connected, return errors immediately rather than waiting for reconnect
        bufferMaxEntries: 0,
        authSource: 'admin'
    };

    //https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
    var uriString = util.format("mongodb://%s:%s@%s/%s", config.user, config.pass, config.host, database);
    var conn = mongoose.createConnection(uriString, options);
    conn.then(function(params) {
        console.log('[mongoose] database "%s" is connected', database);
    }, function(err) {
        console.error('[mongoose] connect database "%s" with error', database, err);
        delete connections2[database];
    });

    // Store the connection in the connections pool.
    connections2[database] = conn;
    return conn;
};

/**
 * 
 * @param {String} database name of database to be connected
 * @returns connection created by `monk(uri, options)`
 */
helpers.connect3 = function(database) {
    if (typeof database != "string" || database.length == 0) {
        throw new Error("parameter database is not string or empty");
    }
    //  If a connection was found, return with it.
    if (monkConnections[database]) {
        return monkConnections[database];
    }
    var options = {
        //keepAlive: 120,
        reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
        reconnectInterval: 500, // Reconnect every 500ms
        poolSize: 3, // Maintain up to 3 socket connections for each database
        // If not connected, return errors immediately rather than waiting for reconnect
        bufferMaxEntries: 0,
        authSource: 'admin'
    };

    //https://mongodb.github.io/node-mongodb-native/driver-articles/mongoclient.html
    var uriString = util.format("mongodb://%s:%s@%s/%s", config.user, config.pass, config.host, database);
    var conn = monk(uriString, options);
    conn.then(function(params) {
        console.log('[monk] database "%s" is connected', database);
    }, function(err) {
        console.error('[monk] connect database "%s" with error', database, err);
        delete monkConnections[database];
    });

    // Store the connection in the connections pool.
    monkConnections[database] = conn;
    return conn;
};

function findConnection(databaseName, connections) {
    for (var i = 0; i < connections.length; i++) {
        if (databaseName == connections[i].name) {
            return connections[i].db;
        }
    }
    return null;
};

module.exports = helpers;