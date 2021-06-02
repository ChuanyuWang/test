var util = require('util');
var config = require('../config.db');
const mongojs = require('mongojs');
const { MongoClient } = require('mongodb');

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

manager.connect = async function(database) {
    if (typeof database !== 'string' || !database)
        throw new Error(`database name is not defined`);

    if (!mongoClient) {
        mongoClient = await MongoClient.connect(manager.connectionURI(database), {
            authSource: 'admin',
            useNewUrlParser: true,
            useUnifiedTopology: true,
            poolSize: 20
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

module.exports = manager;
