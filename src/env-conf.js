'use strict';

var _typeof = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? 'symbol' : typeof obj; };

var fs = require('fs'),
    rp = require('fs.realpath'),
    uuid = require('uuid'),
    confId = '',
    k,
    v,
    fromJson = {},
    errMessage = {},
    expected,
    instance = {
        obj: null,
        unique: '',
        initd: false
    };

errMessage = {
    keyValueNotFound: 'Value of the key not found... ',
    objectsOnly: 'Options read generic objects only.',
    wrongKeyValue: 'Value of key is  not allowed... ',
    invalidJson: 'Invalid JSON file.',
    jsonDoesNotExist: 'JSON file does not exist.',
    configMustBeObject: 'Configuration must be a generic object.',
    unexpectedSource: 'Unexpected value source... '
};

function uniqueId() {
    return uuid.v1().split('-').join('').toUpperCase();
}

function getType(subject) {
    return null === subject ? 'null' : typeof subject === 'undefined' ? 'undefined' : _typeof(subject);
}

function getObjectName(obj) {
    return getType(obj) !== 'object' ? '' : obj.constructor.name;
}

function getSingleton(container) {
    if (container.initd !== true || container.unique === '') {
        confId = uniqueId();
        container.obj = new EnvConfiguration();
        container.initd = true;
        container.unique = container.obj.getSignature();
    }
    return container.obj;
}

function EnvConfigurationError(message) {
    this.constructor.prototype.__proto__ = Error.prototype;
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
}

function PackageJsonError(message) {
    this.constructor.prototype.__proto__ = Error.prototype;
    Error.captureStackTrace(this, this.constructor);
    this.name = this.constructor.name;
    this.message = message;
}

function PackageJson() {
    this.jp = require('jsonpath');
    this.data = {};
    this.load = function (file) {
        if (fs.existsSync(file) !== true) {
            if (this.opt.errors === 'throw') {
                throw new PackageJsonError(errMessage.jsonDoesNotExist);
            } else {
                this.errors.push(errMessage.jsonDoesNotExist);
            }
        }
        this.data = require(file);
    };

    this.jsonpath = function (query) {
        var fetched = this.jp.query(this.data, query);
        if (getObjectName(fetched) === 'Array' && fetched.length === 1) {
            fetched = fetched[0]; // array of 1 element
        }
        return fetched;
    };
}

function EnvConfiguration() {

    this._id = null;
    this.errors = null;
    this.items = null;
    this.opt = null;

    this.package = new PackageJson();

    this.getSignature = function () {
        this._id = confId;
        return this._id;
    };

    this.readPackage = function (file) {
        this.package.load(rp.realpathSync(file));
        return this;
    };

    this.reset = function () {
        this.items = {};
        this.errors = [];
        return this;
    };

    this.options = function (options) {

        if (getObjectName(options) !== 'Object') {
            // pre-error handling behaviour is decided
            throw new Error(errMessage.objectsOnly);
        }
        expected = {
            errors: {
                collect: true,
                throw: true
            }
        };
        for (k in options) {
            v = options[k];
            if (expected[k] && (!expected[k][v] || expected[k][v] !== true)) {
                throw new Error(errMessage.wrongKeyValue + k); // still pre-error
            }
        }
        k = null;
        this.opt = options;
        return this;
    };

    this.get = function (k) {
        return !this.items[k] ? null : this.items[k];
    };

    this.set = function (key, source, reference) {
        expected = {
            declaration: true,
            environment: true
        };
        if (expected[source] !== true) {
            if (this.opt.errors === 'throw') {
                throw new EnvConfigurationError(errMessage.unexpectedSource + source);
            } else {
                this.errors.push(errMessage.unexpectedSource + source);
            }
        }
        this.items[k] = source === 'declaration' ? reference // just set declared value
            : getType(process.env[reference]) === 'undefined' ? null : process.env[reference];
    };

    this.loadObject = function (input) {
        if (getObjectName(input) !== 'Object') {
            if (this.opt.errors === 'throw') {
                throw new EnvConfigurationError(errMessage.configMustBeObject);
            } else {
                this.errors.push(errMessage.configMustBeObject);
            }
        } else {
            for (k in input) {
                this.set(k, input[k].source, input[k].reference);
            }
            k = null;
        }
        return this;
    };

    this.loadJSON = function (input) {
        if (fs.existsSync(input) !== true) {
            if (this.opt.errors === 'throw') {
                throw new EnvConfigurationError(errMessage.jsonDoesNotExist);
            } else {
                this.errors.push(errMessage.jsonDoesNotExist);
            }
        }
        fromJson = require(input);
        if (getObjectName(fromJson) !== 'Object') {
            if (this.opt.errors === 'throw') {
                throw new EnvConfigurationError(errMessage.invalidJson);
            } else {
                this.errors.push(errMessage.invalidJson);
            }
        }
        return this.loadObject(fromJson);
    };

    this.isValid = function () {
        for (k in this.items) {
            if (this.get(k) === null) {
                if (this.opt.errors === 'throw') {
                    throw new EnvConfigurationError(errMessage.keyValueNotFound + k);
                } else {
                    this.errors.push(errMessage.keyValueNotFound + k);
                }
            }
        }
        return this.errors.length === 0; // errors empty
    };
}

module.exports = getSingleton(instance);