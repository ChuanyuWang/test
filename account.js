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


/**
 * Additionally, passport-local-mongoose will add more fields to above Schema
 *  - username, user name
 *  - hash, the hashed password
 *  - salt, the salt value
 * 
 * Some methods will also be added to the instance of Account
 * - setPassword
 * - changePassword
 * - authenticate
 * - resetAttempts
 * more information refer to https://github.com/saintedlama/passport-local-mongoose#api-documentation
 */

Account.plugin(passportLocalMongoose, {
    findByUsername: function(model, queryParameters) {
        // Add additional query parameter - AND condition - active: true
        // use $ne to query active users due to existing users don't have 'active' field
        queryParameters.active = { $ne: false };
        return model.findOne(queryParameters);
    }
});

module.exports = mongoose.model('Account', Account);
