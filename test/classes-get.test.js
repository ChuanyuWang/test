const chai = require("chai");
const request = require("supertest");
const app = require("../app");
const tenant = require("./lib/tenant");

//enable assertion styles, include Assert, Expect and Should
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should(); //actually enable should style assertions

describe('GET /api/classes', function() {
    before(async function() {
        // runs once before the first test in this block
        await tenant.init(true);
    });

    after(async function() {
        await tenant.clean(true);
    });

    it('should query classes', function(done) {
        request(app)
            .get('/api/classes?memberid=57300af0405ccbfc57bb7267&tenant=dummy')
            .expect('Content-Type', /json/)
            .expect(200)
            .end(function(err, res) {
                if (err) throw err;
                return done();
            });
    });
});