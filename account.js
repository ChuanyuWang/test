var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var config = require('./config').mongodb;

//the center database on top of all tenants
var database = 'config';
//var conn = mongoose.createConnection(config.uri + '/config', config.options);
var conn = mongoose.createConnection(config.uri, config.options);

var Account = new Schema({
    username: String,
    password: String,
    tenant: String,
    displayName: String,
    role: String
});

Account.plugin(passportLocalMongoose);

module.exports = conn.model('account', Account);