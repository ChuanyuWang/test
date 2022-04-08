
const md5 = require('md5');
const HmacSHA256 = require("crypto-js/hmac-sha256");
const Hex = require('crypto-js/enc-hex');

exports.generateNonceString = function(length) {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var maxPos = chars.length;
    var noceStr = "";
    for (var i = 0; i < (length || 32); i++) {
        noceStr += chars.charAt(Math.floor(Math.random() * maxPos));
    }
    return noceStr;
};

/**
 * Sign params with key as MD5
 * Refer to https://pay.weixin.qq.com/wiki/doc/api/jsapi.php?chapter=4_3
 * Testing tool: https://pay.weixin.qq.com/wiki/doc/api/micropay.php?chapter=20_1
 * @param {Object} params 
 * @param {String} key 
 * @returns 
 */
exports.sign = function(params, key) {
    let querystring = Object.keys(params).filter(function(key) {
        return params[key] !== undefined && params[key] !== '' && ['pfx', 'partner_key', 'sign', 'key'].indexOf(key) < 0;
    }).sort().map(function(key) {
        return key + '=' + params[key];
    }).join("&") + "&key=" + key;

    return md5(querystring).toUpperCase();
}

/**
 * Sign params with key as HMAC-SHA256
 * Refer to https://pay.weixin.qq.com/wiki/doc/api/jsapi.php?chapter=4_3
 * @param {Object} params 
 * @param {String} key 
 * @returns 
 */
exports.sign2 = function(params, key) {
    let querystring = Object.keys(params).filter(function(key) {
        return params[key] !== undefined && params[key] !== '' && ['pfx', 'partner_key', 'sign', 'key'].indexOf(key) < 0;
    }).sort().map(function(key) {
        return key + '=' + params[key];
    }).join("&") + "&key=" + key;

    return Hex.stringify(HmacSHA256(querystring, key)).toUpperCase();
}
