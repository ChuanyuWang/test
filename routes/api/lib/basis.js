const db_utils = require('../../../server/databaseManager');

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

exports.BaseError = BaseError;
exports.ParamError = ParamError;
exports.RuntimeError = RuntimeError;
exports.BadRequestError = BadRequestError;
exports.InternalServerError = InternalServerError;
