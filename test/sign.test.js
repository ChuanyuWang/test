const util = require("../routes/api/lib/util");

const chai = require("chai");

//enable assertion styles, include Assert, Expect and Should
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should(); //actually enable should style assertions

describe('Signature Utility', function() {
    before(async function() {
        // runs once before the first test in this block

    });

    after(async function() {

    });

    it('should sign as MD5', async function() {
        let params = {
            appid: "wxe4283737fc91496e",
            mch_id: "1577616351",
            return_code: "SUCCESS",
            return_msg: "OK"
        };
        let result = util.sign(params, "12345");
        expect(result).to.equal("02ED06CE20F9DA8F86475300C91A1237");
    });

    it('should sign as HMAC-SHA256', async function() {
        let params = {
            appid: "wxe4283737fc91496e",
            mch_id: "1577616351",
            return_code: "SUCCESS",
            return_msg: "OK"
        };
        let result = util.sign2(params, "12345");
        expect(result).to.equal("397D5A7E92DA9D1A539E8F551D1BD8B5F0F52ABF2618825FA94DA8AC0A9E8040");
    });
});
