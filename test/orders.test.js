const chai = require("chai");
const request = require("supertest");
const app = require("../app");
const tenant = require("./lib/tenant");

//enable assertion styles, include Assert, Expect and Should
const assert = chai.assert;
const expect = chai.expect;
chai.should(); //actually enable should style assertions

// test agent to the express app
const agent = request.agent(app);

describe('POST /api/orders', function() {
    before(async function() {
        // runs once before the first test in this block
        await tenant.init(true);
    });

    after(async function() {
        await tenant.clean(true);
    });

    it('should not query orders without authentication', async function() {
        await agent.get('/api/orders?tenant=dummy')
            .expect(401);
    });
    /*
        it('should create order', async function() {
            await agent.post('/api/orders')
                .send({ name: "Wendy", contact: "123456789" })
                .expect(200);
        });
    */
    it('should confirm success order', async function() {
        await agent.post('/api/orders/confirmPay')
            .send({ tenant: "dummy", prepayid: "prepayid1" })
            .expect(200);
    });

    it('should query orders with authentication', async function() {
        await agent.post('/login')
            .send({ password: "1", username: "admin@dummy" })
            .expect(302);

        const res = await agent.get('/api/orders')
            .expect(200)
            .expect('Content-Type', /json/);
        res.body.should.have.property("total");
        res.body.should.have.property("rows").with.lengthOf(1);
    });
});
