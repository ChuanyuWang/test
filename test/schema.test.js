const { ObjectId } = require('mongodb');
const chai = require("chai");
const { SchemaValidator } = require("../routes/api/lib/schema_validator");

//enable assertion styles, include Assert, Expect and Should
const assert = chai.assert;
const expect = chai.expect;
const should = chai.should(); //actually enable should style assertions

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

describe('Signature Utility', function() {
    before(async function() {
        // runs once before the first test in this block

    });

    after(async function() {

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
});
