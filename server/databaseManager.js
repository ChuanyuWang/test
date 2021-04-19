var util = require('util');
var config = require('../config.db');
const mongojs = require('mongojs');
const { MongoClient } = require('mongodb');

let mongoClient = null;

//const dbCache = new Map();
const manager = {};

manager.connectionURI = function(database) {
    //https://docs.mongodb.com/manual/reference/connection-string/#standard-connection-string-format
    if (config.user) {
        return util.format("mongodb://%s:%s@%s/%s", config.user, config.pass, config.host, database);
    } else {
        return util.format("mongodb://%s/%s", config.host, database);
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
    let db = await manager.connect(database);
    // return the mongojs db wrapper
    return mongojs(db);
}

module.exports = manager;
