const chai = require('chai');
const request = require('supertest');
const serverPromise = require('../app');

//enable assertion styles, include Assert, Expect and Should
const assert = chai.assert;
const expect = chai.expect;
chai.should(); //actually enable should style assertions
let app = null;

describe('Start App', function() {
    before(async function() {
        // runs once before the first test in this block
        app = await serverPromise;
    });

    after(function() {
    });

    it('home page status 200', function(done) {
        // enlarge the timeout to 3s
        // because the very first test case may take longger time to initialization
        this.timeout(3000);
        request(app).get('/').expect(200, done);
    });
});
