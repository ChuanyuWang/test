var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var util = require("./util");

//the uri of 'config' database
var conn = util.connect2("config");

var Account = new Schema({
    username: String,
    password: String,
    tenant: String,
    displayName: String,
    role: String
});

Account.plugin(passportLocalMongoose);

module.exports = conn.model('Account', Account);