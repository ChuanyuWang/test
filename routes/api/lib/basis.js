
class ParamError extends Error {
    constructor(message) {
        super(message);
        this.name = "Invalid Parameter Error";
        this.status = 400;
    }
}

class RuntimeError extends Error {
    constructor(message, error) {
        super(message);
        this.name = "Server Runtime Error";
        this.innerError = error;
    }
}

exports.ParamError = ParamError;
exports.RuntimeError = RuntimeError;
