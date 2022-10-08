const chai = require('chai');
const { ObjectId } = require('mongodb');
const db_utils = require('../server/databaseManager');
const tenant = require("./lib/tenant");

//enable assertion styles, include Assert, Expect and Should
const assert = chai.assert;
const expect = chai.expect;
chai.should(); //actually enable should style assertions

describe('MongoDB driver 3.7+', function() {
    before(async function() {
        // runs once before the first test in this block
        await tenant.init(true);
    });

    after(async function() {
        await tenant.clean(true);
    });

    it('test findOneAndUpdate result', async function() {
        let tenantDB = await db_utils.connect(tenant.name);
        let classes = tenantDB.collection("classes");
        let result = await classes.findOneAndUpdate({
            _id: ObjectId("6241c5ac95fbe9165c55f5b1")
        }, {
            $set: {
                "capacity": 6
            }
        }, {
            projection: { cost: 1, booking: 1 },
            returnDocument: "after"
        });
        /**
         * {
            lastErrorObject: { n: 1, updatedExisting: true },
            value: { _id: 6241c5dd5edea566404fe8a0, cost: 1, booking: [] },
            ok: 1
            }
         */
        //console.log(result);
        result.should.be.a('object');
        expect(result).to.have.property("lastErrorObject");
        assert.typeOf(result.lastErrorObject, "object");
        assert.deepEqual(result.lastErrorObject, { n: 1, updatedExisting: true });
        expect(result).to.have.property("value");
        expect(result).to.have.property("ok");
        assert.equal(result.ok, 1);
    });

    it('test findOne result', async function() {
        let tenantDB = await db_utils.connect(tenant.name);
        let classes = tenantDB.collection("classes");
        let result = await classes.findOne({
            _id: ObjectId("6241c5ac95fbe9165c55f5b1")
        }, {
            projection: {}
        });
        /**
         * {
                _id: 6241c5ac95fbe9165c55f5b1,
                name: 'money',
                date: 2022-11-13T16:12:15.904Z,
                cost: 1,
                capacity: 6,
                classroom: 'room1',
                age: { min: 24, max: null },
                booking: []
            }
         */
        //console.log(result);
        result.should.be.a('object');
        expect(result).to.have.property("booking");
        assert.typeOf(result.booking, "array");
        expect(result).to.have.property("name");
        expect(result).to.have.property("cost");
    });
});
