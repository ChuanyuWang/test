const { ObjectId } = require('mongodb');
const chai = require("chai");
const { SchemaValidator } = require("../routes/api/lib/schema_validator");

//enable assertion styles, include Assert, Expect and Should
const assert = chai.assert;
const expect = chai.expect;
chai.should(); //actually enable should style assertions

const ContractSchema = new SchemaValidator({
    status: {
        validator: value => {
            return ["open", "outstanding", "paid", "closed", "deleted"].includes(value);
        }
    },
    goods: String,
    memberId: { type: ObjectId, required: true },
    credit: { type: Number, required: true, editable: true },
    total: { type: Number, required: true, editable: true },
    discount: Number,
    received: Boolean,
    createDate: { type: Date, required: true },
    effectiveDate: { type: Date, required: true, editable: true },
    expireDate: { type: Date, editable: true },
    signDate: Date,
    comments: Array
});

describe('Schema Validator', function() {
    before(async function() {
        // runs once before the first test in this block
        assert.typeOf(ContractSchema, "Object");
    });

    after(async function() {

    });

    it('should verify number type', async function() {
        let schema = new SchemaValidator({ field1: Number });
        schema.createVerify({ field1: "0" }).should.equal(false);
        schema.createVerify({ field1: 2 }).should.equal(true);
        schema.createVerify({ field1: NaN }).should.equal(true);
    });

    it('should verify String type', async function() {
        let schema = new SchemaValidator({ field1: String });
        schema.createVerify({ field1: 0 }).should.equal(false);
        schema.createVerify({ field1: true }).should.equal(false);
        schema.createVerify({ field1: undefined }).should.equal(false);
        schema.createVerify({ field1: "false" }).should.equal(true);
        schema.createVerify({ field1: [] }).should.equal(false);
    });

    it('should verify boolean type', async function() {
        let schema = new SchemaValidator({ field1: Boolean });
        schema.createVerify({ field1: "true" }).should.equal(false);
        schema.createVerify({ field1: true }).should.equal(true);
        schema.createVerify({ field1: "false" }).should.equal(false);
        schema.createVerify({ field1: "F" }).should.equal(false);
    });

    it('should verify Date type', async function() {
        let schema = new SchemaValidator({ field1: Date });
        schema.createVerify({ field1: null }).should.equal(true);
        schema.createVerify({ field1: new Date() }).should.equal(true);
    });

    it('should verify validator type', async function() {
        let schema = new SchemaValidator({
            field1: {
                validator: value => {
                    return ["active", "inactive"].includes(value);
                },
                required: true
            },
        });
        schema.createVerify({ field1: null }).should.equal(false);
        schema.createVerify({ field1: undefined }).should.equal(false);
        schema.createVerify({ field1: "common" }).should.equal(false);
        schema.createVerify({ field1: "active" }).should.equal(true);
    });

    it('should verify required field', async function() {
        let schema = new SchemaValidator({
            field1: {
                type: String,
                required: true
            },
        });
        schema.createVerify({ field2: "abc" }).should.equal(false);
        schema.createVerify({ field1: undefined }).should.equal(false);
        schema.createVerify({ field1: null }).should.equal(false);
        schema.createVerify({ field1: "" }).should.equal(false);
        schema.createVerify({ field1: "active" }).should.equal(true);
    });

    it('should pass verify creating', async function() {
        let body = {
            "type": "new",
            "goods": "632961ecc04b056810a02fc4",
            "goods_type": "type",
            "category": "credit",
            "credit": 10,
            "expendedCredit": 0,
            "total": 100000,
            "discount": 0,
            "received": true,
            "createDate": "2022-10-31T08:08:47.702Z",
            "effectiveDate": "2022-10-31T08:08:47.702Z",
            "expireDate": null,
            "signDate": "2022-10-31T08:08:47.702Z",
            "comments": [],
            "memberId": "57300af0405ccbfc57bb7267"
        };
        let result = ContractSchema.createVerify(body);
        expect(result).to.equal(true);
    });

    it('should fail verify creating', async function() {
        let body = {
            "type": "new",
            "goods": "632961ecc04b056810a02fc4",
            "goods_type": "type",
            "category": "credit",
            "credit": 10,
            "expendedCredit": 0,
            "total": 100000,
            "discount": 0,
            "received": true,
            "createDate": "2022-10-31T08:08:47.702Z",
            "effectiveDate": "", // is missing
            "expireDate": null,
            "signDate": "2022-10-31T08:08:47.702Z",
            "comments": [],
            "memberId": "57300af0405ccbfc57bb7267"
        };
        let result = ContractSchema.createVerify(body);
        expect(result).to.equal(false);
    });

    it('should modify editable fields', async function() {
        let schema = new SchemaValidator({ field1: Boolean, field2: { type: Number, editable: true } });
        schema.modifyVerify({ field1: "true" }).should.equal(false);
        schema.modifyVerify({ field2: 1 }).should.equal(true);
        schema.modifyVerify({ field2: "false" }).should.equal(false);
        schema.modifyVerify({ field1: true, field2: 0 }).should.equal(false);
    });
});
