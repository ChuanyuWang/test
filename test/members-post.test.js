const chai = require("chai");
const request = require("supertest");
const serverPromise = require("../app");
const tenant = require("./lib/tenant");

//enable assertion styles, include Assert, Expect and Should
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should(); //actually enable should style assertions

let app, agent = null;

describe('POST /api/members', function() {
    before(async function() {
        // runs once before the first test in this block
        await tenant.init(true);
        app = await serverPromise;
        // test agent to the express app
        agent = request.agent(app);
    });

    after(async function() {
        await tenant.clean(true);
    });

    it('should not query member without authentication', async function() {
        await agent.get('/api/members')
            .expect(401);
    });

    it('should query member with authentication', async function() {
        await agent.post('/login')
            .send({ password: "1", username: "admin@dummy" })
            .expect(302);

        const res = await agent.get('/api/members')
            .expect(200)
            .expect('Content-Type', /json/);
        res.body.should.have.property("total");
        res.body.should.have.property("rows").with.lengthOf(1);
    });

    it('should add new member', async function() {
        await agent.post('/login')
            .send({ password: "1", username: "admin@dummy" })
            .expect(302);
        await agent.post('/api/members')
            .send({ name: "Wendy", contact: "123456789" })
            .expect(200);
    });

    it('should not add same member', async function() {
        await agent.post('/login')
            .send({ password: "1", username: "admin@dummy" })
            .expect(302);
        await agent.post('/api/members')
            .send({ name: "John", contact: "123456789" })
            .expect(400);
    });
});