const chai = require('chai');
const { ObjectId } = require('mongodb');
const db_utils = require('../server/databaseManager');
const tenant = require("./lib/tenant");

//enable assertion styles, include Assert, Expect and Should
const assert = chai.assert;
const expect = chai.expect;
chai.should(); //actually enable should style assertions

describe('MongoDB driver 4.17+', function() {
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

    it('test findOneAndUpdate with no result', async function() {
        let tenantDB = await db_utils.connect(tenant.name);
        let classes = tenantDB.collection("classes");
        let result = await classes.findOneAndUpdate({
            // not existed ObjectId
            _id: ObjectId("6241c5ac95fbe9165c55f5b2")
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
            lastErrorObject: { n: 0, updatedExisting: false },
            value: null,
            ok: 1
            }
         */
        //console.log(result);
        result.should.be.a('object');
        expect(result).to.have.property("lastErrorObject");
        assert.typeOf(result.lastErrorObject, "object");
        assert.deepEqual(result.lastErrorObject, { n: 0, updatedExisting: false });
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

    it('test findOne with no result', async function() {
        let tenantDB = await db_utils.connect(tenant.name);
        let classes = tenantDB.collection("classes");
        let result = await classes.findOne({
            // not existed ObjectId
            _id: ObjectId("6241c5ac95fbe9165c55f5b2")
        }, {
            projection: {}
        });
        /**
         * result is null
         */
        //console.log(result);
        expect(result).to.be.null;
    });

    it('test insertOne result', async function() {
        let tenantDB = await db_utils.connect(tenant.name);
        let classes = tenantDB.collection("classes");
        let doc = { foo: 123 };
        let result = await classes.insertOne(doc);
        // result is {"acknowledged":1,"insertedId":ObjectId}
        // result.insertedId is ObjectId, generated ObjectId for the insert operation
        //console.log(result);
        expect(result).to.be.exist;
        result.should.be.a('object');
        //expect(result).to.have.property("result"); // removed from driver v4.0+
        //assert.deepEqual(result.result, { n: 1, ok: 1 });
        //expect(result).to.have.property("ops");
        //assert.typeOf(result.ops, "array");
        //expect(result).to.have.property("insertedCount");
        expect(result).to.have.property("insertedId");
        expect(result).to.have.property("acknowledged").is.equals(true);
        expect(doc).to.have.property("_id");
    });

    it('test deleteOne result', async function() {
        let tenantDB = await db_utils.connect(tenant.name);
        let classes = tenantDB.collection("classes");
        let doc = { foo: 456 };
        await classes.insertOne(doc);
        let result = await classes.deleteOne({ foo: 456 });
        //console.log(result);
        /**
         * {
            acknowledged: true,
            deletedCount: 1
            }
         */
        expect(result).to.be.exist;
        result.should.be.a('object');
        //expect(result).to.have.property("result"); // removed from driver v4.0+
        expect(result).to.have.property("deletedCount");
    });

    it('test updateOne result with upsert is true', async function() {
        let tenantDB = await db_utils.connect(tenant.name);
        let classes = tenantDB.collection("classes");
        let result = await classes.updateOne({ name: "456" }, {
            $set: { cost: 2 }
        }, { upsert: true });
        //console.log(result);
        /**
         * {
         *     "acknowledged":1, 
         *     "modifiedCount": 1|0,
         *     "insertedId": null|ObjectId, 
         *     "upsertedCount":0|1, 
         *     "matchedCount": 1|0
         * }
         **/
        expect(result).to.be.exist;
        result.should.be.a('object');
        //expect(result).to.have.property("result"); // removed from driver v4.0+
        //assert.deepEqual(result.result, { n: 1, ok: 1, nModified: 1 });
        expect(result).to.have.property("upsertedCount");
        expect(result).to.have.property("upsertedId");
        expect(result).to.have.property("matchedCount");
        expect(result).to.have.property("modifiedCount");
    });

    it('test updateMany result', async function() {
        let tenantDB = await db_utils.connect(tenant.name);
        let classes = tenantDB.collection("classes");
        let result = await classes.updateMany({ name: "456" }, {
            $set: { cost: 3 }
        }, { upsert: false }); // upsert default is false
        //console.log(result);
        /**
         * {
         *     "acknowledged":1, 
         *     "modifiedCount": 1|0,
         *     "upsertedId": null|ObjectId, 
         *     "upsertedCount":0|1, 
         *     "matchedCount": 1|0
         * }
         **/
        expect(result).to.be.exist;
        result.should.be.a('object');
        // expect(result).to.have.property("result"); // removed from driver v4.0+
        // assert.deepEqual(result.result, { n: 1, ok: 1, nModified: 1 });
        expect(result).to.have.property("upsertedCount");
        expect(result).to.have.property("upsertedId");
        expect(result).to.have.property("matchedCount");
        expect(result).to.have.property("modifiedCount");
    });

    it('test findOneAndDelete result', async function() {
        let tenantDB = await db_utils.connect(tenant.name);
        let classes = tenantDB.collection("classes");
        let result = await classes.findOneAndDelete({ name: "456" });
        /**
         * {
            lastErrorObject: { n: 1 }, // "n" is 0 if no match
            value: {deleted document}, // "value" is null if no match
            ok: 1
            }
         */
        //console.log(result);
        expect(result).to.be.exist;
        result.should.be.a('object');
        expect(result).to.have.property("lastErrorObject");
        assert.deepEqual(result.lastErrorObject, { n: 1 });
        expect(result).to.have.property("value");
        expect(result).to.have.property("ok");
    });

    it('test deleteMany result', async function() {
        let tenantDB = await db_utils.connect(tenant.name);
        let classes = tenantDB.collection("classes");
        let result = await classes.deleteMany({});
        //console.log(result);
        /**
         * {
            acknowledged: true,
            deletedCount: 1
            }
         */
        expect(result).to.be.exist;
        result.should.be.a('object');
        //expect(result).to.have.property("result"); // removed from driver v4.0+
        expect(result).to.have.property("deletedCount");
    });
});
