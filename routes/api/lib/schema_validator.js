const { ObjectId } = require('mongodb');
const noop = function() { };

class SchemaValidator {
    constructor(obj, options) {
        this.obj = obj || {};
        this.options = options || {};
    }

    createVerify(body) {
        // body is empty, return false
        if (!body || Array.isArray(body)) return false;
        let result = Object.keys(this.obj).find(key => {
            let def = this.obj[key];
            let required = this.isRequired(def);
            if (body.hasOwnProperty(key)) {
                // handle null value, but not required
                if (body[key] === null && !required) {
                    return false;
                }
                if (this.checkType(def, body[key]) === false) return true;
            } else if (required) {
                result = true;
            }
        });
        return result === undefined;
    }

    checkType(definition, value) {
        let t = noop, v = null;
        if (typeof definition === "function") t = definition;
        else if (typeof definition.validator === "function") {
            v = definition.validator;
        } else if (typeof definition.type === "function") {
            t = definition.type;
        } else {
            console.error("fatal error: no type defined in %j", definition);
            return false;
        }

        if (v) return v(value);
        switch (t) {
            case String:
                return typeof value === "string";
            case Number:
                return typeof value === "number";
            case Boolean:
                return typeof value === "boolean";
            case Array:
                return Array.isArray(value);
            case Object:
                return typeof value === "object";
            case Date:
                return !isNaN(Date.parse(value));
            case ObjectId:
                return ObjectId.isValid(value);
            default:
                console.error("fatal error: unknown type %j", t);
                return false;
        }
    }

    isRequired(definition) {
        if (typeof definition === "function") return false;
        else if (definition.required === true) return true;
        else return false;
    }
}

exports.SchemaValidator = SchemaValidator;
