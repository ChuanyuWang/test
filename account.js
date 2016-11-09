var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
var config = require('./config.db');
var util = require("util");

// Use native promises, more refer to http://mongoosejs.com/docs/promises.html
mongoose.Promise = global.Promise;

//the uri of 'config' database
var uri = util.format("mongodb://%s/config?authSource=admin", config.host);
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
    },
    user : config.user,
    pass : config.pass
};
var conn = mongoose.createConnection(uri, options);

var Account = new Schema({
        username : String,
        password : String,
        tenant : String,
        displayName : String,
        role : String
    });

Account.plugin(passportLocalMongoose);

module.exports = conn.model('account', Account);
