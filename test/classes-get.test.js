const chai = require("chai");
const request = require("supertest");
const app = require("../app");
const tenant = require("./lib/tenant");

chai.should(); //actually enable should style assertions

describe('GET /api/classes', function() {
    before(async function() {
        // runs once before the first test in this block
        await tenant.init(true);
    });

    after(async function() {
        await tenant.clean(true);
        app.stop();
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
    /*
    it('should GET the users response', (done) => {
        chai.request(app)
            .get('/users')
            .end((err, res) => {
                res.should.have.status(200);
                res.text.should.equal('respond with a resource');
                done();
            });
    });
 
    it('should respond status 404', (done) => {
        chai.request(app)
            .get('/wrongUrl')
            .end((err, res) => {
                res.should.have.status(404);
                done();
            });
    });
    */
});