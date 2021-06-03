var util = require('util');
var config = require('../config.db');
const mongojs = require('mongojs');
const { MongoClient } = require('mongodb');
const mongoose = require('mongoose');

let mongoClient = null;

const dbCache = new Map();
const manager = {};

manager.connectionURI = function(database) {
    //https://docs.mongodb.com/manual/reference/connection-string/#standard-connection-string-format
    if (config.user) {
        return util.format("mongodb://%s:%s@%s:27017/%s", config.user, config.pass, config.host, database);
    } else {
        return util.format("mongodb://%s:27017/%s", config.host, database);
    }
}

/**
 * create mongoose default connection to 'config' database 
 */
const options = {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    //keepAlive: 120,
    autoIndex: false, // Don't build indexes
    //autoReconnect: true,
    //reconnectTries: Number.MAX_VALUE, // Never stop trying to reconnect
    //reconnectInterval: 500, // Reconnect every 500ms
    poolSize: 3, // Maintain up to 3 socket connections
    // If not connected, return errors immediately rather than waiting for reconnect
    bufferMaxEntries: 0,
    authSource: 'admin'
};
mongoose.connect(manager.connectionURI("config"), options).then(function(params) {
    console.log('[mongoose] database "config" is connected');
}, function(err) {
    // handle initial connection error
    console.error('[mongoose] connect database "config" with error', err);
});

mongoose.connection.on('error', err => {
    // handle errors after initial connection was established
    console.error('[mongoose] connection with error', err);
});

manager.connect = async function(database) {
    if (typeof database !== 'string' || !database)
        throw new Error(`database name is not defined`);

    if (!mongoClient) {
        mongoClient = await MongoClient.connect(manager.connectionURI(database), {
            authSource: 'admin',
            useNewUrlParser: true,
            useUnifiedTopology: true,
            poolSize: 20 // Maintain up to 20 socket connections for tenant database
        });
    } else if (!mongoClient.isConnected()) {
        await mongoClient.connect();
    }
    //TODO, add 'error' listner to returned db instance
    return mongoClient.db(database);
}

manager.mongojsDB = async function(database) {
    if (dbCache.has(database)) {
        return dbCache.get(database);
    }
    let db = await manager.connect(database);
    dbCache.set(database, mongojs(db));
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
    // return the mongojs db wrapper
    return dbCache.get(database);
}

manager.close = function() {
    if (mongoClient) {
        mongoClient.close().catch(err => {
            console.error(err);
        })
    }
    mongoose.disconnect().catch(err => {
        console.error(err);
    });
}

module.exports = manager;
