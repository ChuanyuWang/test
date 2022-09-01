const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

var Account = new Schema({
    username: String,
    tenant: String,
    displayName: String,
    role: String,
    active: Boolean
});

Account.plugin(passportLocalMongoose, {
    findByUsername: function(model, queryParameters) {
        // Add additional query parameter - AND condition - active: true
        // use $ne to query active users due to existing users don't have 'active' field
        queryParameters.active = { $ne: false };
        return model.findOne(queryParameters);
    }
});

module.exports = mongoose.model('Account', Account);