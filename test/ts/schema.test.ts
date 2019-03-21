import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as spies from 'chai-spies';
import * as jp from '../../dist/index';

chai.use(spies);
chai.use(chaiAsPromised);

describe('Schema', function() {

  describe('validators', function() {

    describe('type', function() {
      it('should validate a null value', async function() {
        const schema = await jp.create({
          type: 'null'
        }, { scope: 'http://example.com' });
        await schema.validate(null).should.eventually.equal(true);
        return schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should validate a boolean value', async function() {
        const schema = await jp.create({
          type: 'boolean'
        }, { scope: 'http://example.com' });
        await schema.validate(true).should.eventually.equal(true);
        return schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should validate an array value', async function() {
        const schema = await jp.create({
          type: 'array'
        }, { scope: 'http://example.com' });
        await schema.validate([]).should.eventually.equal(true);
        return schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should validate a number value', async function() {
        const schema = await jp.create({
          type: 'number'
        }, { scope: 'http://example.com' });
        await schema.validate(10).should.eventually.equal(true);
        await schema.validate(10.5).should.eventually.equal(true);
        return schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should validate a integer value', async function() {
        const schema = await jp.create({
          type: 'integer'
        }, { scope: 'http://example.com' });
        await schema.validate(10).should.eventually.equal(true);
        await schema.validate(10.5).should.be.rejectedWith(jp.ValidationError, 'type');
        return schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should validate a string value', async function() {
        const schema = await jp.create({
          type: 'string'
        }, { scope: 'http://example.com' });
        await schema.validate('test').should.eventually.equal(true);
        await schema.validate('').should.eventually.equal(true);
        return schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should validate an object value', async function() {
        const schema = await jp.create({
          type: 'object'
        }, { scope: 'http://example.com' });
        await schema.validate({}).should.eventually.equal(true);
        return schema.validate('test').should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should validate with an array of types', async function() {
        const schema = await jp.create({
          type: [ 'string', 'number' ]
        }, { scope: 'http://example.com' });
        await schema.validate('test').should.eventually.equal(true);
        await schema.validate(10).should.eventually.equal(true);
        return schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'type');
      });
      it('should fail to validate an unknown type', async function() {
        const schema = await jp.create({
          type: 'foo'
        }, { scope: 'http://example.com' });
        return schema.validate({}).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
    });
    describe('enum', async function() {
      it('should fail with an invalid enum', async function() {
        const schema1 = await jp.create({
          enum: true
        }, { scope: 'http://example.com' });
        await schema1.validate(true).should.be.rejectedWith(jp.ValidationError, 'schema');
        const schema2 = await jp.create({
          enum: []
        }, { scope: 'http://example.com' });
        return schema2.validate(true).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with enum', async function() {
        const schema = await jp.create({
          enum: [ 'test', 10 ]
        }, { scope: 'http://example.com' });
        await schema.validate('test').should.eventually.equal(true);
        await schema.validate(10).should.eventually.equal(true);
        return schema.validate(11).should.be.rejectedWith(jp.ValidationError, 'enum');
      });
    });
    describe('const', async function() {
      it('should fail with an invalid const', async function() {
        const schema = await jp.create({
          const: undefined
        }, { scope: 'http://example.com' });
        return schema.validate(true).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with const', async function() {
        const schema = await jp.create({
          const: 10
        }, { scope: 'http://example.com' });
        await schema.validate(10).should.eventually.equal(true);
        return schema.validate(11).should.be.rejectedWith(jp.ValidationError, 'const');
      });
    });
    describe('multipleOf', async function() {
      it('should fail with an invalid multipleOf', async function() {
        const schema = await jp.create({
          multipleOf: 'test'
        }, { scope: 'http://example.com' });
        return schema.validate(10).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with multipleOf', async function() {
        const schema = await jp.create({
          multipleOf: 3
        }, { scope: 'http://example.com' });
        await schema.validate(15).should.eventually.equal(true);
        return schema.validate(11).should.be.rejectedWith(jp.ValidationError, 'multipleOf');
      });
    });
    describe('maximum', async function() {
      it('should fail with an invalid maximum', async function() {
        const schema = await jp.create({
          maximum: 'test'
        }, { scope: 'http://example.com' });
        return schema.validate(10).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with maximum', async function() {
        const schema = await jp.create({
          maximum: 3
        }, { scope: 'http://example.com' });
        await schema.validate(2).should.eventually.equal(true);
        await schema.validate(3).should.eventually.equal(true);
        return schema.validate(4).should.be.rejectedWith(jp.ValidationError, 'maximum');
      });
    });
    describe('exclusiveMaximum', async function() {
      it('should fail with an invalid exclusiveMaximum', async function() {
        const schema = await jp.create({
          exclusiveMaximum: 'test'
        }, { scope: 'http://example.com' });
        return schema.validate(10).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with exclusiveMaximum', async function() {
        const schema = await jp.create({
          exclusiveMaximum: 3
        }, { scope: 'http://example.com' });
        await schema.validate(2).should.eventually.equal(true);
        await schema.validate(3).should.be.rejectedWith(jp.ValidationError, 'exclusiveMaximum');
        return schema.validate(4).should.be.rejectedWith(jp.ValidationError, 'exclusiveMaximum');
      });
    });
    describe('minimum', async function() {
      it('should fail with an invalid minimum', async function() {
        const schema = await jp.create({
          minimum: 'test'
        }, { scope: 'http://example.com' });
        return schema.validate(10).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with minimum', async function() {
        const schema = await jp.create({
          minimum: 3
        }, { scope: 'http://example.com' });
        await schema.validate(4).should.eventually.equal(true);
        await schema.validate(3).should.eventually.equal(true);
        return schema.validate(2).should.be.rejectedWith(jp.ValidationError, 'minimum');
      });
    });
    describe('exclusiveMinimum', async function() {
      it('should fail with an invalid exclusiveMinimum', async function() {
        const schema = await jp.create({
          exclusiveMinimum: 'test'
        }, { scope: 'http://example.com' });
        return schema.validate(10).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with exclusiveMinimum', async function() {
        const schema = await jp.create({
          exclusiveMinimum: 3
        }, { scope: 'http://example.com' });
        await schema.validate(4).should.eventually.equal(true);
        await schema.validate(3).should.be.rejectedWith(jp.ValidationError, 'exclusiveMinimum');
        return schema.validate(2).should.be.rejectedWith(jp.ValidationError, 'exclusiveMinimum');
      });
    });
    describe('maxLength', async function() {
      it('should fail with an invalid maxLength', async function() {
        const schema = await jp.create({
          maxLength: 'test'
        }, { scope: 'http://example.com' });
        return schema.validate('abc').should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with maxLength', async function() {
        const schema = await jp.create({
          maxLength: 3
        }, { scope: 'http://example.com' });
        await schema.validate('abc').should.eventually.equal(true);
        return schema.validate('abcd').should.be.rejectedWith(jp.ValidationError, 'maxLength');
      });
    });
    describe('minLength', async function() {
      it('should fail with an invalid minLength', async function() {
        const schema = await jp.create({
          minLength: 'test'
        }, { scope: 'http://example.com' });
        return schema.validate('abc').should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with minLength', async function() {
        const schema = await jp.create({
          minLength: 3
        }, { scope: 'http://example.com' });
        await schema.validate('abc').should.eventually.equal(true);
        return schema.validate('ab').should.be.rejectedWith(jp.ValidationError, 'minLength');
      });
    });
    describe('pattern', async function() {
      it('should fail with an invalid pattern', async function() {
        const schema = await jp.create({
          pattern: 10
        }, { scope: 'http://example.com' });
        return schema.validate('abc').should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with pattern', async function() {
        const schema = await jp.create({
          pattern: "^a.*b$"
        }, { scope: 'http://example.com' });
        await schema.validate('a_b').should.eventually.equal(true);
        return schema.validate('abc').should.be.rejectedWith(jp.ValidationError, 'pattern');
      });
    });
    describe('format', async function() {
      it('should fail with an invalid format', async function() {
        const schema = await jp.create({
          format: 10
        }, { scope: 'http://example.com' });
        return schema.validate('abc').should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with format', async function() {
        const schema = await jp.create({
          format: "TODOTODOTODOTODOTODOTODOTODO"
        }, { scope: 'http://example.com' });
        return schema.validate('test').should.eventually.equal(true);
      });
    });
    describe('items', async function() {
      it('should validate with an empty array', async function() {
        const schema = await jp.create({
          items: {
            type: 'string'
          }
        }, { scope: 'http://example.com' });
        return schema.validate([]).should.eventually.equal(true);
      });
      it('should validate with a single schema', async function() {
        const schema = await jp.create({
          items: {
            type: 'string'
          }
        }, { scope: 'http://example.com' });
        await schema.validate([ 'test', 'other' ]).should.eventually.equal(true);
        return schema.validate([ 10 ]).should.be.rejectedWith(jp.ValidationError, 'items');
      });
      it('should validate with a multiple schemas', async function() {
        const schema = await jp.create({
          items: [{
            type: 'string'
          },
          {
            type: 'boolean'
          },
          {
            type: 'integer'
          }]
        }, { scope: 'http://example.com' });
        await schema.validate([ 'test', true, 10 ]).should.eventually.equal(true);
        const p = schema.validate([ 1, true,  10.2 ])
        const err = await p.should.be.rejectedWith(jp.ValidationError, 'items');
        err.errors.length.should.equal(2);
      });
    });
    describe('additionalItems', async function() {
      it('should ignore additionalItems if items is not an array', async function() {
        const schema1 = await jp.create({
          additionalItems: {
            type: 'string'
          }
        }, { scope: 'http://example.com' });
        await schema1.validate([ 5, 10, 12.5 ]).should.eventually.equal(true);
        const schema2 = await jp.create({
          items: {
            type: 'number'
          },
          additionalItems: {
            type: 'string'
          }
        }, { scope: 'http://example.com' });
        await schema2.validate([ 5, 10, 12.5 ]).should.eventually.equal(true);
      });
      it('should validate with additionalItems', async function() {
        const schema = await jp.create({
          items: [{
            type: 'string'
          },
          {
            type: 'boolean'
          },
          {
            type: 'integer'
          }],
          additionalItems: {
            type: 'string'
          }
        }, { scope: 'http://example.com' });
        await schema.validate([ 'test', true, 12, 'aaa', 'bbb', 'ccc' ]).should.eventually.equal(true);
        const p = schema.validate([ 'test', true, 12, true, null, 'ccc' ]);
        const err = await p.should.be.rejectedWith(jp.ValidationError, 'additionalItems');
        err.errors.length.should.equal(2);
      });
    });
    describe('maxItems', async function() {
      it('should fail with an invalid maxItems', async function() {
        const schema = await jp.create({
          maxItems: 'test'
        }, { scope: 'http://example.com' });
        return schema.validate([ 'abc' ]).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with maxItems', async function() {
        const schema = await jp.create({
          maxItems: 3
        }, { scope: 'http://example.com' });
        await schema.validate([ 'a', 'b' ]).should.eventually.equal(true);
        await schema.validate([ 'a', 'b', 'c' ]).should.eventually.equal(true);
        return schema.validate([ 'a', 'b', 'c', 'd' ]).should.be.rejectedWith(jp.ValidationError, 'maxItems');
      });
    });
    describe('minItems', async function() {
      it('should fail with an invalid minItems', async function() {
        const schema = await jp.create({
          minItems: 'test'
        }, { scope: 'http://example.com' });
        return schema.validate([ 'abc' ]).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with minItems', async function() {
        const schema = await jp.create({
          minItems: 3
        }, { scope: 'http://example.com' });
        await schema.validate([ 'a', 'b', 'c', 'd' ]).should.eventually.equal(true);
        await schema.validate([ 'a', 'b', 'c' ]).should.eventually.equal(true);
        return schema.validate([ 'a', 'b' ]).should.be.rejectedWith(jp.ValidationError, 'minItems');
      });
    });
    describe('uniqueItems', async function() {
      it('should fail with an invalid uniqueItems', async function() {
        const schema = await jp.create({
          uniqueItems: 'test'
        }, { scope: 'http://example.com' });
        return schema.validate([ 'abc' ]).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with uniqueItems', async function() {
        const schema = await jp.create({
          uniqueItems: true
        }, { scope: 'http://example.com' });
        await schema.validate([ 'a', 'b', 'c', 'd' ]).should.eventually.equal(true);
        return schema.validate([ 'a', 'b', 'a', 'd' ]).should.be.rejectedWith(jp.ValidationError, 'uniqueItems');
      });
    });
    describe('contains', async function() {
      it('should validate a contains', async function() {
        const schema = await jp.create({
          contains: {
            type: 'number',
            maximum: 3
          }
        }, { scope: 'http://example.com' });
        await schema.validate([ 'a', 'b', 7,  3 ]).should.eventually.equal(true);
        return schema.validate([ 'a', 'b', 7 ]).should.be.rejectedWith(jp.ValidationError, 'contains');
      });
    });
    describe('maxProperties', async function() {
      it('should fail with an invalid maxProperties', async function() {
        const schema = await jp.create({
          maxProperties: 'test'
        }, { scope: 'http://example.com' });
        return schema.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with maxProperties', async function() {
        const schema = await jp.create({
          maxProperties: 3
        }, { scope: 'http://example.com' });
        await schema.validate({ a: 1, b: 2 }).should.eventually.equal(true);
        await schema.validate({ a: 1, b: 2, c: 3 }).should.eventually.equal(true);
        return schema.validate({ a: 1, b: 2, c: 3, d: 4 }).should.be.rejectedWith(jp.ValidationError, 'maxProperties');
      });
    });
    describe('minProperties', async function() {
      it('should fail with an invalid minProperties', async function() {
        const schema = await jp.create({
          minProperties: 'test'
        }, { scope: 'http://example.com' });
        return schema.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with minProperties', async function() {
        const schema = await jp.create({
          minProperties: 3
        }, { scope: 'http://example.com' });
        await schema.validate({ a: 1, b: 2, c: 3, d: 4 }).should.eventually.equal(true);
        await schema.validate({ a: 1, b: 2, c: 3 }).should.eventually.equal(true);
        return schema.validate({ a: 1, b: 2 }).should.be.rejectedWith(jp.ValidationError, 'minProperties');
      });
    });
    describe('required', async function() {
      it('should fail with an invalid required', async function() {
        const schema1 = await jp.create({
          required: 'test'
        }, { scope: 'http://example.com' });
        await schema1.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'schema');
        const schema2 = await jp.create({
          required: [ 1 ]
        }, { scope: 'http://example.com' });
        return schema2.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with required', async function() {
        const schema = await jp.create({
          required: [ 'a', 'b', 'c' ]
        }, { scope: 'http://example.com' });
        await schema.validate({ a: 1, b: 2, c: 3, d: 4 }).should.eventually.equal(true);
        await schema.validate({ a: 1, b: 2, c: 3 }).should.eventually.equal(true);
        return schema.validate({ a: 1, b: 2 }).should.be.rejectedWith(jp.ValidationError, 'required');
      });
    });
    describe('properties', async function() {
      it('should fail with an invalid properties', async function() {
        const schema1 = await jp.create({
          properties: 'test'
        }, { scope: 'http://example.com' });
        await schema1.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'schema');
        const schema2 = await jp.create({
          properties: [ 1 ]
        }, { scope: 'http://example.com' });
        return schema2.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with properties', async function() {
        const schema = await jp.create({
          properties: {
            a: {
              type: 'number'
            },
            c: {
              type: 'string'
            }
          }
        }, { scope: 'http://example.com' });
        await schema.validate({ a: 1, b: true, c: 'test', d: 4 }).should.eventually.equal(true);
        const p = schema.validate({ a: 1, b: 2, c: 3 });
        const err = await p.should.be.rejectedWith(jp.ValidationError, 'properties');
        err.errors.length.should.equal(1);
        err.errors[0].message.should.equal('type');
      });
    });
    describe('patternProperties', async function() {
      it('should fail with an invalid patternProperties', async function() {
        const schema1 = await jp.create({
          patternProperties: 'test'
        }, { scope: 'http://example.com' });
        await schema1.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'schema');
        const schema2 = await jp.create({
          patternProperties: [ 1 ]
        }, { scope: 'http://example.com' });
        return schema2.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with patternProperties', async function() {
        const schema = await jp.create({
          patternProperties: {
            '^a': {
              type: 'number'
            },
            'b': {
              maxLength: 2,
              maximum: 6
            },
            'c$': {
              type: 'string'
            }
          }
        }, { scope: 'http://example.com' });
        await schema.validate({ aaa: 1, b1: true, b2: 'tt', cc: 'aaa' }).should.eventually.equal(true);
        await schema.validate({ aaa: true, b1: true }).should.be.rejectedWith(jp.ValidationError, 'patternProperties');
        await schema.validate({ aaa: 1, b1: 7 }).should.be.rejectedWith(jp.ValidationError, 'patternProperties');
        await schema.validate({ aba: 8 }).should.be.rejectedWith(jp.ValidationError, 'patternProperties');
        return schema.validate({ bbc: 'aaa' }).should.be.rejectedWith(jp.ValidationError, 'patternProperties');
      });
    });
    describe('additionalProperties', async function() {
      it('should validate with a schema additionalProperties', async function() {
        const schema = await jp.create({
          properties: {
            b: {
              type: 'string'
            }
          },
          patternProperties: {
            '^a': {
              type: 'number'
            }
          },
          additionalProperties: {
            type: 'boolean'
          }
        }, { scope: 'http://example.com' });
        await schema.validate({ aaa: 1, b: 'x', c: true }).should.eventually.equal(true);
        return schema.validate({ bbc: 'aaa' }).should.be.rejectedWith(jp.ValidationError, 'additionalProperties');
      });
      it('should validate with a boolean additionalProperties', async function() {
        const schema = await jp.create({
          properties: {
            b: {
              type: 'string'
            }
          },
          patternProperties: {
            '^a': {
              type: 'number'
            }
          },
          additionalProperties: false
        }, { scope: 'http://example.com' });
        await schema.validate({ aaa: 1, b: 'x' }).should.eventually.equal(true);
        return schema.validate({ bbc: 'aaa' }).should.be.rejectedWith(jp.ValidationError, 'additionalProperties');
      });
    });
    describe('dependencies', async function() {
      it('should fail with an invalid dependencies', async function() {
        const schema1 = await jp.create({
          dependencies: 'test'
        }, { scope: 'http://example.com' });
        await schema1.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'schema');
        const schema2 = await jp.create({
          dependencies: [ 1 ]
        }, { scope: 'http://example.com' });
        await schema2.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'schema');
        const schema3 = await jp.create({
          dependencies: { a : [ true ] }
        }, { scope: 'http://example.com' });
        return schema3.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with dependencies', async function() {
        const schema = await jp.create({
          dependencies: {
            a: [ 'b', 'c' ],
            b: [ 'd' ],
            d: {
              minProperties: 4
            }
          }
        }, { scope: 'http://example.com' });
        await schema.validate({ b: true, d: 'aaa', e: 1, f: 2 }).should.eventually.equal(true);
        await schema.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'dependencies');
        await schema.validate({ d: 'aaa' }).should.be.rejectedWith(jp.ValidationError, 'dependencies');
        return schema.validate({ b: true }).should.be.rejectedWith(jp.ValidationError, 'dependencies');
      });
    });
    describe('propertyNames', async function() {
      it('should validate with propertyNames', async function() {
        const schema = await jp.create({
          propertyNames: {
            minLength: 3,
            pattern: "^x-"
          }
        }, { scope: 'http://example.com' });
        await schema.validate({ 'x-a': 3, 'x-b': true }).should.eventually.equal(true);
        await schema.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'propertyNames');
        return schema.validate({ 'x-': true }).should.be.rejectedWith(jp.ValidationError, 'propertyNames');
      });
    });
    describe('if', async function() {
      it('should validate with if (when then and else are absent)', async function() {
        const schema = await jp.create({
          if: {
            properties: {
              a: {
                type: 'boolean'
              }
            }
          }
        }, { scope: 'http://example.com' });
        await schema.validate({ a: true }).should.eventually.equal(true);
        return schema.validate({ a: 1 }).should.eventually.equal(true);
      });
      it('should validate with if (true branch)', async function() {
        const schema = await jp.create({
          if: {
            properties: {
              a: {
                type: 'boolean'
              }
            }
          },
          then: {
            required: [ 'b' ]
          }
        }, { scope: 'http://example.com' });
        await schema.validate({ a: true, b: 1 }).should.eventually.equal(true);
        return schema.validate({ a: true }).should.be.rejectedWith(jp.ValidationError, 'required');
      });
      it('should validate with if (false branch)', async function() {
        const schema = await jp.create({
          if: {
            properties: {
              a: {
                type: 'boolean'
              }
            }
          },
          else: {
            required: [ 'c' ]
          }
        }, { scope: 'http://example.com' });
        await schema.validate({ a: true }).should.eventually.equal(true);
        await schema.validate({ a: 1, c: true }).should.eventually.equal(true);
        return schema.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'required');
      });
    });
    describe('allOf', async function() {
      it('should fail with an invalid allOf', async function() {
        const schema = await jp.create({
          allOf: 'test'
        }, { scope: 'http://example.com' });
        return schema.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with allOf', async function() {
        const schema = await jp.create({
          allOf: [
            {
              type: 'string'
            },
            {
              maxLength: 3
            }
          ]
        }, { scope: 'http://example.com' });
        await schema.validate('aaa').should.eventually.equal(true);
        await schema.validate(true).should.be.rejectedWith(jp.ValidationError, 'allOf');
        return schema.validate('aaaa').should.be.rejectedWith(jp.ValidationError, 'allOf');
      });
    });
    describe('anyOf', async function() {
      it('should fail with an invalid anyOf', async function() {
        const schema = await jp.create({
          anyOf: 'test'
        }, { scope: 'http://example.com' });
        return schema.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with anyOf', async function() {
        const schema = await jp.create({
          anyOf: [
            {
              type: 'string'
            },
            {
              maximum: 3
            }
          ]
        }, { scope: 'http://example.com' });
        await schema.validate('aaa').should.eventually.equal(true);
        await schema.validate(2).should.eventually.equal(true);
        await schema.validate(true).should.eventually.equal(true);
        return schema.validate(5).should.be.rejectedWith(jp.ValidationError, 'anyOf');
      });
    });
    describe('oneOf', async function() {
      it('should fail with an invalid oneOf', async function() {
        const schema = await jp.create({
          oneOf: 'test'
        }, { scope: 'http://example.com' });
        return schema.validate({ a: 1 }).should.be.rejectedWith(jp.ValidationError, 'schema');
      });
      it('should validate with oneOf', async function() {
        const schema = await jp.create({
          oneOf: [
            {
              properties: {
                a: true,
                b: true
              },
              additionalProperties: false
            },
            {
              properties: {
                b: true,
                c: true
              },
              additionalProperties: false
            }
          ]
        }, { scope: 'http://example.com' });
        await schema.validate({ a: 1 }).should.eventually.equal(true);
        await schema.validate({ c: 1 }).should.eventually.equal(true);
        return schema.validate({ b: 1 }).should.be.rejectedWith(jp.ValidationError, 'oneOf');
      });
    });
    describe('not', async function() {
      it('should validate with not', async function() {
        const schema = await jp.create({
          not: {
            type: 'string'
          }
        }, { scope: 'http://example.com' });
        await schema.validate(true).should.eventually.equal(true);
        await schema.validate(1).should.eventually.equal(true);
        return schema.validate('test').should.be.rejectedWith(jp.ValidationError, 'not');
      });
    });

  });

});
