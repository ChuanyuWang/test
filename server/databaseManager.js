const util = require('util');
const { MongoClient } = require('mongodb');

const mongoClient = new MongoClient(connectionURI("config"), {
    authSource: 'admin',
    maxPoolSize: 20 // Maintain up to 20 socket connections for tenant database
});

const dbCache = new Map();
const manager = {};

function connectionURI(database) {
    const config = require('../config.db');
    //https://docs.mongodb.com/manual/reference/connection-string/#standard-connection-string-format
    if (config.user) {
        return util.format("mongodb://%s:%s@%s:27017/%s", config.user, config.pass, config.host, database);
    } else {
        return util.format("mongodb://%s:27017/%s", config.host, database);
    }
}

// this function is called during the initialization of app
manager.getClient = async function() {
    /* 
    // https://mongodb.github.io/node-mongodb-native/3.6/reference/unified-topology/
    // some MongoDB events and options are deprecated, e.g isConnected()
    //TODO, add 'error' listener to MongoClient when upgrade to mongodb 4.0+
    db.once("error", err => {
        console.error(err);
        dbCache.delete(database);
    });
    db.once("timeout", err => {
        console.error(err);
        dbCache.delete(database);
    });

    db.once("close", err => {
        console.error(err);
        dbCache.delete(database);
    });
    */
    return await mongoClient.connect();
}

manager.connect = function(dbName) {
    if (typeof dbName !== 'string' || !dbName)
        throw new Error(`database name is not defined`);

    // Do we have the db in the cache already
    if (dbCache.has(dbName)) {
        return dbCache.get(dbName);
    }

    let db = mongoClient.db(dbName);
    // Add the db to the cache
    dbCache.set(dbName, db);
    // Return the database
    return db;
}

manager.close = function() {
    if (mongoClient) {
        mongoClient.close().catch(err => {
            console.error(err);
        });
    }
}

module.exports = manager;
