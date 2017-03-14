var chai = require('chai')
  , spies = require('chai-spies')
  , chaiAsPromised = require('chai-as-promised')
  , should = chai.should()
  , jp = require('../dist/index')
  , global = require('../dist/global')

chai.use(spies);
chai.use(chaiAsPromised);

describe('jsonpolice', function() {

  describe('create', function() {

    it('should throw a SchemaError when called with no args', function() {
      should.throw(function() {
        jp.create();
      }, jp.SchemaError, 'no_data');
    });

    it('should create a Schema', function() {
      var data = {};
      return jp.create(data).then(function(s) {
        should.exist(s);
        should.exist(s.opts);
        should.exist(s.opts.store);
        data[global.__schema].should.equal(s);
      });
    });

    it('should create a Schema with a scope and a store', function() {
      var opts = {
        scope: 'test',
        store: {}
      };
      var data = {
        id: 'pippo'
      };
      return jp.create(data, opts).then(function() {
        opts.store['test#'].should.equal(data);
        opts.store['pippo#'].should.equal(data);
      });
    });

    it('should create a known Schema by uri', function() {
      let store = {};
      let data = {};
      return jp.create(data, { scope: 'test', store }).then(function() {
        return jp.create('test', { store }).then(function(s) {
          s.should.equal(data[global.__schema]);
        });
      });
    });

    it('should create a unknown Schema by uri', function() {
      var spy = chai.spy(function() {
        return Promise.resolve({ id: 'test' });
      });
      var opts = {
        store: {},
        retriever: spy
      };
      return jp.create('uriuriuri', opts).then(function(s) {
        spy.should.have.been.called.once();
        opts.store['test#'].should.deep.equal({ id: 'test'});
      });
    });

    it('should return the passed data when creating a schema from data already used to create a schema', function() {
      var data = {};
      return jp.create(data).then(function(s1) {
        should.exist(s1);
        return jp.create(data).then(function(s2) {
          should.exist(s2);
          s2.should.equal(s1);
        });
      });
    });

    it('should not throw additionalProperties is not set and an additional property is found', function() {
      return jp.create({
        type: 'object',
        properties: {
          a: { type: 'number'}
        }
      }).then(function(s) {
        should.not.throw(function () {
          s.validate({ a: 1, b: false });
        });
      });
    });

    it('should throw if a recursive additional property if of the wrong type', function() {
      let opts = {};
      return jp.create({
        type: 'object',
        properties: {
          a: {
            type: 'integer'
          },
        },
        additionalProperties: { $ref: '#' }
      }, opts).then(function(s) {
        s.data.additionalProperties.should.equal(s.data);
        Object.keys(opts.store).should.have.length(0);
        should.throw(function() {
          s.validate({ a: 1, b: true });
        }, global.ValidationError, 'type');
        should.not.throw(function() {
          s.validate({ a: 1, b: { a: 5 } });
        });
      });
    });

  });

  describe('flatten', function() {

    it('should flatten a schema', function() {
      var a1 = {
        allOf: [
          {
            type: 'number',
            default: 5,
            minimum: 1,
            maximum: 2,
            minLength: 1,
            maxLength: 2,
            exclusiveMinimum: true,
            exclusiveMaximum: true,
            required: [ 'a', 'b' ],
            definitions: {
              x: 1,
              y: 2
            },
            properties: {
              m: 1,
              n: 2
            },
            patternProperties: {
              m: 1,
              n: 2
            }
          }, {
            type: 'number',
            default: 6,
            minimum: 0,
            maximum: 3,
            minLength: 0,
            maxLength: 3,
            exclusiveMinimum: false,
            exclusiveMaximum: false,
            required: [ 'b', 'c' ],
            definitions: {
              y: 3,
              z: 4
            },
            properties: {
              n: 3,
              o: 4
            },
            patternProperties: {
              n: 3,
              o: 4
            }
          }
        ]
      };
      return jp.flatten(a1).then(function(b1) {
        b1.default.should.equal(5);
        b1.minimum.should.equal(1);
        b1.maximum.should.equal(2);
        b1.minLength.should.equal(1);
        b1.maxLength.should.equal(2);
        b1.exclusiveMinimum.should.equal(false);
        b1.exclusiveMaximum.should.equal(false);
        b1.required.should.have.length(3).and.deep.equal(['a', 'b', 'c']);
        b1.definitions.should.deep.equal({x: 1, y: 2, z: 4});
        b1.properties.should.deep.equal({m: 1, n: 2, o: 4});
        b1.patternProperties.should.deep.equal({m: 1, n: 2, o: 4});
      });
    });

  });

  describe('fireValidationError', function() {

    it('should fire a ValidationError', function() {
      should.throw(function() {
        jp.fireValidationError('a', 'b', 'c');
      }, jp.ValidationError, 'c');
    });

  });

  describe('compliance', function() {

    it('should create a validator of the JSON-Schema specification', function() {
      let spec = {
        "id": "http://json-schema.org/draft-04/schema#",
        "$schema": "http://json-schema.org/draft-04/schema#",
        "description": "Core schema meta-schema",
        "definitions": {
          "schemaArray": {
            "type": "array",
            "minItems": 1,
            "items": { "$ref": "#" }
          },
          "positiveInteger": {
            "type": "integer",
            "minimum": 0
          },
          "positiveIntegerDefault0": {
            "allOf": [ { "$ref": "#/definitions/positiveInteger" }, { "default": 0 } ]
          },
          "simpleTypes": {
            "enum": [ "array", "boolean", "integer", "null", "number", "object", "string" ]
          },
          "stringArray": {
            "type": "array",
            "items": { "type": "string" },
            "minItems": 1,
            "uniqueItems": true
          }
        },
        "type": "object",
        "properties": {
          "id": {
            "type": "string",
            "format": "uri"
          },
          "$schema": {
            "type": "string",
            "format": "uri"
          },
          "title": {
            "type": "string"
          },
          "description": {
            "type": "string"
          },
          "default": {},
          "multipleOf": {
            "type": "number",
            "minimum": 0,
            "exclusiveMinimum": true
          },
          "maximum": {
            "type": "number"
          },
          "exclusiveMaximum": {
            "type": "boolean",
            "default": false
          },
          "minimum": {
            "type": "number"
          },
          "exclusiveMinimum": {
            "type": "boolean",
            "default": false
          },
          "maxLength": { "$ref": "#/definitions/positiveInteger" },
          "minLength": { "$ref": "#/definitions/positiveIntegerDefault0" },
          "pattern": {
            "type": "string",
            "format": "regex"
          },
          "additionalItems": {
            "anyOf": [
              { "type": "boolean" },
              { "$ref": "#" }
            ],
            "default": {}
          },
          "items": {
            "anyOf": [
              { "$ref": "#" },
              { "$ref": "#/definitions/schemaArray" }
            ],
            "default": {}
          },
          "maxItems": { "$ref": "#/definitions/positiveInteger" },
          "minItems": { "$ref": "#/definitions/positiveIntegerDefault0" },
          "uniqueItems": {
            "type": "boolean",
            "default": false
          },
          "maxProperties": { "$ref": "#/definitions/positiveInteger" },
          "minProperties": { "$ref": "#/definitions/positiveIntegerDefault0" },
          "required": { "$ref": "#/definitions/stringArray" },
          "additionalProperties": {
            "anyOf": [
              { "type": "boolean" },
              { "$ref": "#" }
            ],
            "default": {}
          },
          "definitions": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
          },
          "properties": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
          },
          "patternProperties": {
            "type": "object",
            "additionalProperties": { "$ref": "#" },
            "default": {}
          },
          "dependencies": {
            "type": "object",
            "additionalProperties": {
              "anyOf": [
                { "$ref": "#" },
                { "$ref": "#/definitions/stringArray" }
              ]
            }
          },
          "enum": {
            "type": "array",
            "minItems": 1,
            "uniqueItems": true
          },
          "type": {
            "anyOf": [
              { "$ref": "#/definitions/simpleTypes" },
              {
                "type": "array",
                "items": { "$ref": "#/definitions/simpleTypes" },
                "minItems": 1,
                "uniqueItems": true
              }
            ]
          },
          "allOf": { "$ref": "#/definitions/schemaArray" },
          "anyOf": { "$ref": "#/definitions/schemaArray" },
          "oneOf": { "$ref": "#/definitions/schemaArray" },
          "not": { "$ref": "#" }
        },
        "dependencies": {
          "exclusiveMaximum": [ "maximum" ],
          "exclusiveMinimum": [ "minimum" ]
        },
        "default": {}
      }
      let opts = {};
      return jp.create(spec, opts).then(schema => {
        opts.store['http://json-schema.org/draft-04/schema#'].should.equal(schema.data);
        should.throw(function() {
          schema.validate({ type: true });
        }, jp.ValidationError, 'anyOf');
        should.not.throw(function() {
          schema.validate({
            type: 'object',
            properties: {
              a: {
                type: 'integer'
              },
            },
            additionalProperties: { $ref: '#' }
          });
        });
      });
    });

  });

});
