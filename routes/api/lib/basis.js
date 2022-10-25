const db_utils = require('../../../server/databaseManager');
const { ObjectId } = require('mongodb');

class BaseError extends Error {

}

/**
 * 400 status Error
 */
class ParamError extends BaseError {
    constructor(message, code) {
        super(message);
        this.name = "Invalid Parameter Error";
        this.status = 400;
        if (typeof code == "number")
            this.code = code;
    }
}

class BadRequestError extends BaseError {
    constructor(message, code) {
        super(message);
        this.name = "Bad Reqeust Error";
        this.status = 400;
        if (typeof code == "number")
            this.code = code;
    }
}

class RuntimeError extends BaseError {
    constructor(message, error) {
        super(message);
        this.name = "Server Runtime Error";
        this.innerError = error;
    }
}

class InternalServerError extends BaseError {
    constructor(message, error) {
        super(message);
        this.name = "Internal Server Error";
        this.innerError = error;
    }
}

exports.asyncMiddlewareWrapper = function(erorrMessage) {
    return function(func) {
        return async function(req, res, next) {
            try {
                let db = await db_utils.connect(req.tenant.name);
                await func(db, req, res.locals);
                return next();
            } catch (error) {
                if (error instanceof ParamError || error instanceof RuntimeError)
                    return next(error);
                else
                    return next(new RuntimeError(erorrMessage, error));
            }
        }
    }
}

/**
 * YYYYMMDD + 6-digit seq No. e.g. 20220321000055
 * @param {ObjectId} id 
 * @returns String
 */
exports.generateContractNo = async function(developmentMode) {
    try {
        let d = new Date();
        // The trade No has to be unique across all tenants
        let configDB = await db_utils.connect("config");
        let settings = configDB.collection("settings");
        let result = await settings.findOneAndUpdate({
            _id: ObjectId("-contract-id")
        }, {
            $inc: { seq: 1 }
        }, {
            upsert: true, returnDocument: "after"
        });

        let seq = parseInt(result.value.seq % 1000000); // get 6 digits seq number
        let datePart = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
        return datePart * 1000000 + seq + (developmentMode ? "t" : "");
    } catch (error) {
        let err = new InternalServerError("Fail to generate contract No.");
        err.innerError = error;
        throw err;
    }
}

exports.BaseError = BaseError;
exports.ParamError = ParamError;
exports.RuntimeError = RuntimeError;
exports.BadRequestError = BadRequestError;
exports.InternalServerError = InternalServerError;
