const { ObjectId } = require('mongodb');
const noop = function() { };

class SchemaValidator {
    constructor(obj, options) {
        this.obj = obj || {};
        this.options = options || {};
    }

    /**
     * Check if the body content is compliant with update schema
     * @param {Object} body 
     * @returns true - it's OK to update; otherwise return false
     */
    modifyVerify(body) {
        // body is empty, return false
        if (!body || Array.isArray(body)) return false;

        for (const key in body) {
            if (body.hasOwnProperty.call(body, key)) {
                if (!this.isEditable(key)) {
                    console.error(`${key} is not editable`);
                    return false;
                }

                const element = body[key];
                if (!this.isValid(key, element)) {
                    console.error(`${key} is not valid`);
                    return false;
                }
            }
        }

        return true;
    }

    createVerify(body) {
        // body is empty, return false
        if (!body || Array.isArray(body)) return false;
        // loop all defined field to find invalid or missing property (return true if found)
        let result = Object.keys(this.obj).find(key => {
            let def = this.obj[key];
            let required = this.isRequired(def);
            if (body.hasOwnProperty(key)) {
                // null value is ok if not required
                if (body[key] === null && !required) {
                    return false;
                }
                if (this.checkType(def, body[key]) === false) return true;
                // the field is required, but value is empty or null
                if (required && !this.hasValue(def, body[key])) return true;
            } else if (required) {
                // field is required but not found
                return true;
            } else {
                // field is not required
                return false;
            }
        });
        return result === undefined;
    }

    isValid(key, value) {
        let definition = this.obj[key];
        if (!definition) return false;
        if (!this.checkType(definition, value)) return false;
        let required = this.isRequired(definition);
        if (required && !this.hasValue(definition, value)) return false;
        return true;
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
                return value === null ? true : !isNaN(Date.parse(value));
            case ObjectId:
                return ObjectId.isValid(value);
            default:
                console.error("fatal error: unknown type %j", t);
                return false;
        }
    }

    hasValue(definition, value) {
        if (value === null || value === undefined) return false;
        if (typeof definition.type === "function") {
            let t = definition.type;
            switch (t) {
                case String:
                    return value !== "";
                case Number:
                    return !isNaN(value);
                case Boolean:
                    return typeof value === "boolean";
                case Array:
                    return Array.isArray(value) && value.length > 0;
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
        // assume the value always existed in other cases
        return true;
    }

    isRequired(definition) {
        if (typeof definition === "function") return false;
        else if (definition.required === true) return true;
        else return false;
    }

    isEditable(key) {
        if (this.obj.hasOwnProperty(key)) {
            let definition = this.obj[key];
            if (definition.editable === true) return true;
        }
        return false;
    }
}

exports.SchemaValidator = SchemaValidator;
