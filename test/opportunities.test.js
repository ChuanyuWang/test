const chai = require("chai");
const request = require("supertest");
const serverPromise = require("../app");
const tenant = require("./lib/tenant");

//enable assertion styles, include Assert, Expect and Should
//const assert = chai.assert;
const expect = chai.expect;
chai.should(); //actually enable should style assertions

let app, agent = null;

describe.only('TEST /api/opportunities', function() {
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

    it('should not query opportunities without authentication', async function() {
        await agent.get(`/api/opportunities?tenant=${tenant.name}`)
            .expect(401);
    });

    it('should add opportunity successfully', async function() {
        let opportunity = {
            tenant: tenant.name,
            status: "open",
            name: "Alex",
            contact: "13500008888",
            //code: "000",
            birthday: "2011-06-11T00:00:00.000+00:00",
            remark: "remark",
            source: "mobile"
        };
        await agent.post('/api/opportunities')
            .send(opportunity)
            .expect(200);
    });

    // need to login before run below test cases

    it('should query opportunities with authentication', async function() {
        await agent.post('/login')
            .send({ password: "1", username: "admin@dummy" })
            .expect(302);

        const res = await agent.get('/api/opportunities')
            .expect(200)
            .expect('Content-Type', /json/);
        res.body.should.have.property("total").to.be.above(0);
        res.body.should.have.property("rows").to.have.length.above(0);
    });

    it('should edit opportunity successfully', async function() {
        const res = await agent.patch('/api/opportunities/60bcde5c2a8a9af97b27a291')
            .send({ status: "closed" })
            .expect(200);
        expect(res).to.have.property('body');
    });

    it('should not able to delete opportunities', async function() {
        await agent.delete('/api/opportunities/60bcde5c2a8a9af97b27a291')
            .send({})
            .expect(400);
    });
});
