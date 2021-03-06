'use strict';

var _typeof = typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol' ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype ? 'symbol' : typeof obj; },
    configuration = require(__dirname + '/../../index').readPackage(__dirname + '/../../package.json'), // this is how other modules will load it
    str = '',
    obj = {};

describe('If pointed at file it reads package.json if passed', function () {
    it('and makes it ready for json path queries', function () {
        expect(configuration.package.jsonpath('$..name')).toBe('env-configuration');
        expect(configuration.package.jsonpath('$..description')).toBe('Configuration manager feeding values from Env Vars and driven by objects or JSON files');
        expect(configuration.package.jsonpath('$..licenses[0]')['type']).toBe('MIT');
    });
});

process.env['this_is_my_value'] = 'my precious';

configuration.loadObject({
    proxy: {
        source: 'environment',
        reference: 'this_is_my_value'
    },
    system: {
        source: 'declaration',
        reference: 'hard-coded-value'
    },
    json_config: {
        source: 'declaration',
        reference: '{"hello":"world","iam":{"many":"names"}}' // JSON as string
    }
});

describe('If passed an object it reads it and sets values', function () {
    it('using environment vars', function () {
        expect(configuration.get('proxy')).toBe(process.env['this_is_my_value']);
        expect(configuration.get('proxy')).toBe('my precious');
    });
    it('and declared values', function () {
        expect(configuration.get('system')).toBe('hard-coded-value');
    });
});

configuration.loadJSON(__dirname + '/env-conf-spec-prop.json');

describe('If passed a file it reads it and sets values', function () {
    it('from environment vars', function () {
        expect(configuration.get('myHomeDirectory')).toBe(process.env['HOME']);
        expect(_typeof(configuration.get('myHomeDirectory'))).toBe('string');
    });
    it('and declared values', function () {
        expect(configuration.get('foo')).toBe('bar');
    });
});

describe('If obj.get() is passed with a function as 2nd parameter', function () {
    it('it will use it to prepare value returned', function () {
        expect((configuration.get('json_config', JSON.parse)).hello).toBe('world');
        expect((configuration.get('json_config', JSON.parse)).iam.many).toBe('names');
        expect(configuration.get('system')).toBe('hard-coded-value');
        expect(configuration.get('system', function(contents){
            return contents.toUpperCase();
        })).toBe('HARD-CODED-VALUE');
    });
});
